import { mongo } from "../db/mongo.js";

export async function audit(event, data = {}) {
  try {
    await mongo().collection("auditLogs").insertOne({
      event,
      ...data,
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Audit write failed:", error.message);
  }
}
