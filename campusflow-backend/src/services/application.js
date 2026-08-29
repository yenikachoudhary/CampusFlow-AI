import crypto from "node:crypto";
import { mongo } from "../db/mongo.js";
import { cacheDelete } from "../db/redis.js";
import { createWorkflowTask } from "./notion.js";
import { audit } from "./audit.js";

export async function createApplication({ user, type, reason, metadata = {} }) {
  const applicationId = `APP-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const document = {
    applicationId,
    studentId: user.sub,
    type: String(type || "Campus Application").slice(0, 120),
    reason: String(reason || "").slice(0, 5000),
    metadata,
    status: "Submitted",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await mongo().collection("applications").insertOne(document);
  await createWorkflowTask({
    taskType: "APPLICATION_APPROVAL",
    titleText: `${document.type} — ${document.studentId}`,
    studentId: document.studentId,
    payload: { applicationId },
    riskContext: null
  });
  await audit("APPLICATION_SUBMITTED", { applicationId, studentId: document.studentId });
  return document;
}

export async function listApplications(studentId) {
  if (studentId) {
    return mongo().collection("applications").find({ studentId }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
  }
  return mongo().collection("applications").find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(200).toArray();
}

export async function decideApplication(applicationId, status, actor) {
  const allowed = ["Approved", "Rejected"];
  if (!allowed.includes(status)) throw new Error("Invalid application status");
  const result = await mongo().collection("applications").updateOne(
    { applicationId },
    { $set: { status, decidedBy: actor.sub, decidedAt: new Date(), updatedAt: new Date() } }
  );
  await mongo().collection("workflowTasks").updateOne(
    { "payload.applicationId": applicationId },
    { $set: { status: status === "Approved" ? "Executed" : "Rejected", updatedAt: new Date() } }
  );
  await audit("APPLICATION_DECISION", { applicationId, status, actor: actor.sub });
  return { applicationId, status, matched: result.matchedCount };
}

export async function clearStudentCaches(studentId) {
  await cacheDelete(`student:${studentId}`);
}
