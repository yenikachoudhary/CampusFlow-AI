import { mongo } from "../db/mongo.js";
import { cacheGetJson, cacheSetJson, cacheDelete, cacheDeletePattern } from "../db/redis.js";
import { env } from "../config/env.js";
import { createWorkflowTask } from "./notion.js";
import { audit } from "./audit.js";

const key = (id) => `student:${id}`;

/**
 * Cache-Aside query for single student profile.
 * Reads from Redis memory first (<0.8ms); falls back to MongoDB Atlas on cache miss.
 * @param {string} studentId
 * @returns {Promise<object|null>}
 */
export async function getStudent(studentId) {
  const cached = await cacheGetJson(key(studentId));
  if (cached) return cached;

  const student = await mongo()
    .collection("students")
    .findOne({ studentId }, { projection: { _id: 0 } });

  if (student) {
    await cacheSetJson(key(studentId), student, env.cacheTtlSeconds);
  }
  return student;
}

/**
 * Cache-Aside query for student directory / roster.
 * @param {object} [filter={}]
 * @returns {Promise<Array>}
 */
export async function listStudents(filter = {}) {
  const deptKey = filter.department ? `roster:${filter.department}` : "roster:students";
  const cached = await cacheGetJson(deptKey);
  if (cached) return cached;

  const query = filter.department ? { department: filter.department } : {};
  const students = await mongo()
    .collection("students")
    .find(query, { projection: { _id: 0 } })
    .sort({ name: 1 })
    .limit(250)
    .toArray();

  await cacheSetJson(deptKey, students, env.cacheTtlSeconds);
  return students;
}

/**
 * Persists or updates student profile, invalidating and refreshing Redis caches.
 * @param {object} student
 * @returns {Promise<object>}
 */
export async function upsertStudent(student) {
  const clean = {
    studentId: String(student.studentId),
    name: String(student.name || ""),
    department: String(student.department || ""),
    semester: String(student.semester || ""),
    averageMarks: Number(student.averageMarks ?? 0),
    attendancePercentage: Number(student.attendancePercentage ?? 0),
    riskContext: student.riskContext || null,
    updatedAt: new Date()
  };

  await mongo()
    .collection("students")
    .updateOne(
      { studentId: clean.studentId },
      { $set: clean, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

  await cacheSetJson(key(clean.studentId), clean, env.cacheTtlSeconds);
  await cacheDeletePattern("roster:*");
  return clean;
}

/**
 * Ingests a telemetry risk marker matching Blueprint Section 4 schema,
 * updates persistence layer, purges caches, and generates a Notion Triage card.
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function ingestStudentRisk(payload) {
  const studentId = String(payload.studentId || "").trim();
  if (!studentId) throw new Error("studentId is required in risk payload");

  const riskContext = payload.riskContext || {};
  const averageMarks = Number(riskContext.averageMarks ?? payload.averageMarks ?? 0);
  const attendancePercentage = Number(riskContext.attendancePercentage ?? payload.attendancePercentage ?? 0);
  const flagReason = String(
    riskContext.flagReason ||
    payload.flagReason ||
    "Automated performance threshold violation"
  );

  const studentData = {
    studentId,
    name: String(payload.name || "Student"),
    department: String(payload.department || "General"),
    averageMarks,
    attendancePercentage,
    riskContext: {
      averageMarks,
      attendancePercentage,
      flagReason,
      flaggedAt: new Date()
    },
    updatedAt: new Date()
  };

  await mongo().collection("students").updateOne(
    { studentId },
    { $set: studentData, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  await cacheSetJson(key(studentId), studentData, env.cacheTtlSeconds);
  await cacheDeletePattern("roster:*");

  // Automatically construct dynamic operational card in Notion database in "Triage" state
  const workflowTask = await createWorkflowTask({
    taskType: "RISK_INTERVENTION",
    titleText: `Performance Alert: ${studentData.name} (${studentId})`,
    studentId,
    payload: {
      studentId,
      name: studentData.name,
      department: studentData.department,
      averageMarks,
      attendancePercentage,
      flagReason
    },
    riskContext: studentData.riskContext
  });

  await audit("RISK_MARKER_INGESTED", {
    studentId,
    flagReason,
    averageMarks,
    attendancePercentage,
    taskId: workflowTask._id,
    notionPageId: workflowTask.notionPageId
  });

  return {
    success: true,
    student: studentData,
    workflowTask: {
      id: workflowTask._id,
      status: "Triage",
      notionPageId: workflowTask.notionPageId
    }
  };
}

export async function clearStudentCaches(studentId) {
  await cacheDelete(key(studentId));
  await cacheDeletePattern("roster:*");
}
