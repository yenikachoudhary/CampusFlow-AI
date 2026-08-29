import { HttpError } from "../utils/http.js";
import { requireAuth, requireRoles, requireHmacBody } from "../middleware/auth.js";
import { getStudent, listStudents, ingestStudentRisk } from "../services/students.js";
import { createApplication, listApplications, decideApplication } from "../services/application.js";
import { audit } from "../services/audit.js";
import { storeEmbedding, matchEmbedding } from "../services/vector.js";
import { askAI } from "../services/ai.js";
import { mongo, mongoMode } from "../db/mongo.js";
import { redisMode, cacheGetJson, cacheSetJson, cacheDeletePattern } from "../db/redis.js";
import { createWorkflowTask, syncWorkflowStatuses, decideLocalTask } from "../services/notion.js";
import { login } from "../services/auth.js";
import { readJson, sendJson } from "../utils/http.js";
import { env } from "../config/env.js";

function jsonBody(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "JSON object required in request body", "INVALID_BODY");
  }
  return value;
}

function staffRoles(req) {
  return requireRoles("faculty", "hod", "dean", "admin")(req);
}

/**
 * Main API Route Handler.
 * Dispatches all API requests matching CampusFlow specification.
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 * @returns {Promise<boolean>}
 */
export async function routeApi(req, res, pathname) {
  // 1. Health Check
  if (pathname === "/api/health" && req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      service: "campusflow-api",
      time: new Date().toISOString(),
      mongo: mongoMode(),
      redis: redisMode(),
      notion: Boolean(env.notionToken && env.notionDatabaseId),
      ai: env.aiApiKey ? "configured" : "local_intelligence"
    });
  }

  // 2. Authentication Login
  if (pathname === "/api/auth/login" && req.method === "POST") {
    const { value } = await readJson(req);
    jsonBody(value);
    const result = await login({
      identifier: value.identifier || value.username || value.studentId || value.email,
      password: value.password
    });
    return sendJson(res, 200, result);
  }

  // 3. User Profile Context
  if (pathname === "/api/me" && req.method === "GET") {
    const user = requireAuth(req);
    const student = user.role === "student" ? await getStudent(user.sub) : null;
    return sendJson(res, 200, { user, student });
  }

  // 4. Attendance History
  if (pathname === "/api/attendance" && req.method === "GET") {
    const user = requireAuth(req);
    const filter = user.role === "student" ? { studentId: user.sub } : {};
    const records = await mongo()
      .collection("attendance")
      .find(filter, { projection: { _id: 0 } })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    return sendJson(res, 200, { records });
  }

  // 5. Biometric Attendance Check-In (Strict Privacy: 128-d vector only)
  if (pathname === "/api/attendance/check-in" && req.method === "POST") {
    const user = requireAuth(req);
    if (user.role !== "student") throw new HttpError(403, "Only students can check in", "FORBIDDEN");

    const { raw, value } = await readJson(req);
    jsonBody(value);

    // Privacy Pipeline Enforcement: Immediately reject raw image submissions
    if (
      Object.prototype.hasOwnProperty.call(value, "image") ||
      Object.prototype.hasOwnProperty.call(value, "imageBase64") ||
      Object.prototype.hasOwnProperty.call(value, "pixels") ||
      Object.prototype.hasOwnProperty.call(value, "photo") ||
      Object.prototype.hasOwnProperty.call(value, "imageData")
    ) {
      throw new HttpError(400, "Raw imagery is strictly rejected. Submit only 128-dimensional floating point embeddings.", "RAW_IMAGE_REJECTED");
    }

    const embedding = value.embedding;
    let matches;
    try {
      matches = await matchEmbedding(embedding);
    } catch (error) {
      throw new HttpError(400, error.message, "INVALID_EMBEDDING");
    }

    const top = matches[0];
    const threshold = Number(value.minimumScore || 0.70);

    if (!top || top.studentId !== user.sub || top.score < threshold) {
      await audit("ATTENDANCE_REJECTED", {
        studentId: user.sub,
        score: top?.score ?? null,
        threshold
      });
      return sendJson(res, 403, {
        verified: false,
        message: "Biometric identity verification failed. Score does not meet required confidence threshold.",
        score: top?.score ?? 0
      });
    }

    const checkInRecord = {
      studentId: user.sub,
      timestamp: new Date(),
      method: "face_embedding_128d",
      score: top.score
    };

    await mongo().collection("attendance").insertOne(checkInRecord);
    await audit("ATTENDANCE_CHECK_IN", {
      studentId: user.sub,
      score: top.score,
      bodyHash: raw.toString("hex").slice(0, 32)
    });

    return sendJson(res, 200, {
      verified: true,
      studentId: user.sub,
      timestamp: checkInRecord.timestamp.toISOString(),
      score: top.score
    });
  }

  // 6. Telemetry Risk Marker Ingestion (Blueprint Section 4 Schema)
  if ((pathname === "/api/telemetry/risk" || pathname === "/api/telemetry/student-risk") && req.method === "POST") {
    const raw = await requireHmacBody(req);
    let value;
    try {
      value = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new HttpError(400, "Invalid JSON body", "INVALID_JSON");
    }
    jsonBody(value);

    // Drop any imagery safely
    delete value.image;
    delete value.imageBase64;
    delete value.pixels;

    const result = await ingestStudentRisk(value);
    return sendJson(res, 201, result);
  }

  // 7. Telemetry Biometric Embedding Registration
  if (pathname === "/api/telemetry/embedding" && req.method === "POST") {
    const raw = await requireHmacBody(req);
    let value;
    try {
      value = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new HttpError(400, "Invalid JSON body", "INVALID_JSON");
    }
    jsonBody(value);

    if (
      value.image ||
      value.imageBase64 ||
      value.pixels ||
      value.photo ||
      value.imageData
    ) {
      throw new HttpError(400, "Raw imagery rejected; send only 128-dimensional embedding array.", "RAW_IMAGE_REJECTED");
    }

    const result = await storeEmbedding(String(value.studentId), value.embedding);
    await audit("EMBEDDING_UPSERT", { studentId: String(value.studentId), dimensions: 128 });
    return sendJson(res, 201, result);
  }

  // 8. Applications: Create
  if (pathname === "/api/applications" && req.method === "POST") {
    const user = requireAuth(req);
    if (user.role !== "student") throw new HttpError(403, "Only students can submit applications", "FORBIDDEN");
    const { value } = await readJson(req);
    jsonBody(value);
    const application = await createApplication({
      user,
      type: value.applicationType || value.type,
      reason: value.reason,
      metadata: value.metadata || {}
    });
    return sendJson(res, 201, {
      applicationId: application.applicationId,
      status: application.status,
      submittedAt: application.createdAt
    });
  }

  // 9. Applications: List
  if (pathname === "/api/applications" && req.method === "GET") {
    const user = requireAuth(req);
    const applications = user.role === "student"
      ? await listApplications(user.sub)
      : await listApplications();
    return sendJson(res, 200, { applications });
  }

  // 10. Applications: Decision Override
  const applicationDecision = pathname.match(/^\/api\/applications\/([^/]+)\/(approve|reject)$/);
  if (applicationDecision && req.method === "POST") {
    const user = staffRoles(req);
    const status = applicationDecision[2] === "approve" ? "Approved" : "Rejected";
    const result = await decideApplication(decodeURIComponent(applicationDecision[1]), status, user);
    return sendJson(res, 200, result);
  }

  // 11. Student Directory (Redis Cache-Aside)
  if (pathname === "/api/students" && req.method === "GET") {
    staffRoles(req);
    const students = await listStudents();
    return sendJson(res, 200, { students });
  }

  // 12. Notion Workflow Tasks Queue: List
  if (pathname === "/api/workflow/tasks" && req.method === "GET") {
    staffRoles(req);
    const cached = await cacheGetJson("workflow:tasks");
    if (cached) return sendJson(res, 200, { tasks: cached });

    const tasks = await mongo()
      .collection("workflowTasks")
      .find({}, {
        projection: {
          _id: 0,
          payload: 1,
          status: 1,
          title: 1,
          taskType: 1,
          studentId: 1,
          createdAt: 1,
          updatedAt: 1,
          notionPageId: 1
        }
      })
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray();

    await cacheSetJson("workflow:tasks", tasks, 60);
    return sendJson(res, 200, { tasks });
  }

  // 13. Notion Workflow Tasks Queue: Create
  if (pathname === "/api/workflow/tasks" && req.method === "POST") {
    const user = staffRoles(req);
    const { value } = await readJson(req);
    jsonBody(value);
    const task = await createWorkflowTask({
      taskType: value.taskType || "ADMIN_REVIEW",
      titleText: value.title || "CampusFlow administrative review",
      studentId: value.studentId || null,
      payload: value.payload || {},
      riskContext: value.riskContext || null
    });
    await cacheDeletePattern("workflow:*");
    await audit("ADMIN_TASK_CREATED", { userId: user.sub, taskId: task._id });
    return sendJson(res, 201, { task });
  }

  // 14. Notion Workflow Tasks: Decision
  const workflowDecision = pathname.match(/^\/api\/workflow\/tasks\/([^/]+)\/(approve|reject)$/);
  if (workflowDecision && req.method === "POST") {
    const user = staffRoles(req);
    const status = workflowDecision[2] === "approve" ? "Approved" : "Rejected";
    const result = await decideLocalTask(decodeURIComponent(workflowDecision[1]), status, user);
    if (!result) throw new HttpError(404, "Workflow task not found", "NOT_FOUND");
    return sendJson(res, 200, result);
  }

  // 15. Notion Workflow: Trigger Sync Loop
  if (pathname === "/api/workflow/sync" && req.method === "POST") {
    requireRoles("faculty", "hod", "dean", "admin")(req);
    const result = await syncWorkflowStatuses();
    return sendJson(res, 200, result);
  }

  // 16. Notices: List (Cache-Aside Pattern)
  if (pathname === "/api/notices" && req.method === "GET") {
    requireAuth(req);
    const cached = await cacheGetJson("notices:all");
    if (cached) return sendJson(res, 200, { notices: cached });

    const notices = await mongo()
      .collection("notices")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    await cacheSetJson("notices:all", notices, 300);
    return sendJson(res, 200, { notices });
  }

  // 17. Notices: Publish
  if (pathname === "/api/notices" && req.method === "POST") {
    const user = staffRoles(req);
    const { value } = await readJson(req);
    jsonBody(value);
    const notice = {
      noticeId: `NOTICE-${Date.now()}`,
      title: String(value.title || "Campus Notice").slice(0, 200),
      body: String(value.body || value.bodyText || "").slice(0, 8000),
      department: String(value.department || "General").slice(0, 80),
      createdBy: user.sub,
      createdAt: new Date()
    };
    await mongo().collection("notices").insertOne(notice);
    await cacheDeletePattern("notices:*");
    await audit("NOTICE_PUBLISHED", { noticeId: notice.noticeId, userId: user.sub });
    return sendJson(res, 201, { notice });
  }

  // 18. AI Assistant Chat
  if (pathname === "/api/ai/chat" && req.method === "POST") {
    const user = requireAuth(req);
    const { value } = await readJson(req);
    jsonBody(value);
    const question = String(value.question || value.message || "").trim();
    if (!question || question.length > 2000) {
      throw new HttpError(400, "Question is required and must be under 2000 characters", "INVALID_QUESTION");
    }
    const student = user.role === "student" ? await getStudent(user.sub) : null;
    const result = await askAI({ question, student, user });
    await audit("AI_QUERY", { userId: user.sub, intent: result.intent });
    return sendJson(res, 200, result);
  }

  // 19. Audit Logs (Immutable Run Logs)
  if (pathname === "/api/audit" && req.method === "GET") {
    staffRoles(req);
    const logs = await mongo()
      .collection("auditLogs")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    return sendJson(res, 200, { logs });
  }

  return false;
}
