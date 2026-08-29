import { Client } from "@notionhq/client";
import { env } from "../config/env.js";
import { mongo } from "../db/mongo.js";
import { audit } from "./audit.js";

let notion;

export function notionClient() {
  if (!env.notionToken || !env.notionDatabaseId) return null;
  notion ||= new Client({ auth: env.notionToken });
  return notion;
}

function title(text) {
  return [{ type: "text", text: { content: String(text).slice(0, 2000) } }];
}

async function setNotionStatus(pageId, status) {
  const client = notionClient();
  if (!client || !pageId) return;
  await client.pages.update({
    page_id: pageId,
    properties: {
      Status: { select: { name: status } }
    }
  });
}

export async function createWorkflowTask({ taskType, titleText, studentId, payload, riskContext }) {
  const client = notionClient();
  const task = {
    taskType,
    title: titleText,
    studentId,
    status: "Triage",
    payload,
    riskContext,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await mongo().collection("workflowTasks").insertOne(task);
  task._id = result.insertedId;

  if (!client) return { ...task, notionPageId: null };

  const page = await client.pages.create({
    parent: { database_id: env.notionDatabaseId },
    properties: {
      Name: { title: title(titleText) },
      Status: { select: { name: "Triage" } },
      "Student ID": { rich_text: title(studentId || "") },
      "Task Type": { select: { name: taskType } }
    }
  });

  await mongo().collection("workflowTasks").updateOne(
    { _id: result.insertedId },
    { $set: { notionPageId: page.id, updatedAt: new Date() } }
  );
  await audit("NOTION_TASK_CREATED", { taskId: result.insertedId, notionPageId: page.id });
  return { ...task, notionPageId: page.id };
}

export async function syncApprovedTasks() {
  return syncWorkflowStatuses();
}

export async function syncWorkflowStatuses() {
  const client = notionClient();
  if (!client) return { synced: 0, skipped: true, statuses: [] };

  let synced = 0;
  const statuses = ["Approved", "Rejected"];
  for (const status of statuses) {
    const response = await client.databases.query({
      database_id: env.notionDatabaseId,
      filter: { property: "Status", select: { equals: status } }
    });

    for (const page of response.results) {
      const existing = await mongo().collection("workflowTasks").findOne({ notionPageId: page.id });
      if (!existing) continue;
      if (existing.status === "Executed" || existing.status === status) continue;

      if (status === "Approved") {
        await executeApprovedTask(existing);
        await setNotionStatus(page.id, "Executed");
      } else {
        await rejectTask(existing);
      }
      synced += 1;
    }
  }
  return { synced, skipped: false, statuses };
}

async function executeApprovedTask(task) {
  if (task.taskType === "APPLICATION_APPROVAL" && task.payload?.applicationId) {
    await mongo().collection("applications").updateOne(
      { applicationId: task.payload.applicationId },
      { $set: { status: "Approved", approvedAt: new Date(), updatedAt: new Date() } }
    );
  }

  await mongo().collection("workflowTasks").updateOne(
    { _id: task._id },
    { $set: { status: "Executed", executedAt: new Date(), updatedAt: new Date() } }
  );
  await audit("WORKFLOW_EXECUTED", { taskId: task._id, taskType: task.taskType });
}

async function rejectTask(task) {
  if (task.taskType === "APPLICATION_APPROVAL" && task.payload?.applicationId) {
    await mongo().collection("applications").updateOne(
      { applicationId: task.payload.applicationId },
      { $set: { status: "Rejected", rejectedAt: new Date(), updatedAt: new Date() } }
    );
  }
  await mongo().collection("workflowTasks").updateOne(
    { _id: task._id },
    { $set: { status: "Rejected", rejectedAt: new Date(), updatedAt: new Date() } }
  );
  await audit("WORKFLOW_REJECTED", { taskId: task._id, taskType: task.taskType });
}

export async function decideLocalTask(taskId, status, actor) {
  const task = await mongo().collection("workflowTasks").findOne({ _id: taskId })
    || await mongo().collection("workflowTasks").findOne({ notionPageId: taskId });
  if (!task) return null;

  if (status === "Approved") {
    await executeApprovedTask(task);
    await setNotionStatus(task.notionPageId, "Executed");
  } else {
    await rejectTask(task);
    await setNotionStatus(task.notionPageId, "Rejected");
  }
  await audit("WORKFLOW_DECISION", { taskId: task._id, status, actor: actor?.sub });
  return { taskId: task._id, status: status === "Approved" ? "Executed" : "Rejected" };
}
