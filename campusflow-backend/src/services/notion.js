import { Client } from "@notionhq/client";
import { env } from "../config/env.js";
import { mongo } from "../db/mongo.js";
import { cacheDelete, cacheDeletePattern } from "../db/redis.js";
import { audit } from "./audit.js";

let notion;
let cachedDataSourceId = null;

/**
 * Returns an authenticated Notion SDK Client instance or null if unconfigured.
 * Handles token prefix normalization (e.g. ntn_ or secret_).
 * @returns {Client|null}
 */
export function notionClient() {
  if (!env.notionToken || !env.notionDatabaseId) return null;
  if (!notion) {
    let auth = env.notionToken.trim();
    if (auth.startsWith("secret_ntn_")) {
      auth = auth.replace("secret_", "");
    }
    notion = new Client({ auth });
  }
  return notion;
}

function textObj(text) {
  return [{ type: "text", text: { content: String(text || "").slice(0, 2000) } }];
}

/**
 * Retrieves the primary data source ID for Notion SDK v5 compatibility.
 * @param {Client} client
 * @param {string} databaseId
 * @returns {Promise<string|null>}
 */
async function getDataSourceId(client, databaseId) {
  if (cachedDataSourceId) return cachedDataSourceId;
  try {
    const db = await client.databases.retrieve({ database_id: databaseId });
    if (db.data_sources?.[0]?.id) {
      cachedDataSourceId = db.data_sources[0].id;
      return cachedDataSourceId;
    }
  } catch (error) {
    console.warn("Could not retrieve Notion data_source_id:", error.message);
  }
  return null;
}

/**
 * Updates status select property on a Notion page.
 * @param {string} pageId
 * @param {string} status
 */
async function setNotionStatus(pageId, status) {
  const client = notionClient();
  if (!client || !pageId) return;
  try {
    await client.pages.update({
      page_id: pageId,
      properties: {
        Status: { select: { name: status } }
      }
    });
  } catch {
    // If the database does not have a Status property column, degrade gracefully
  }
}

/**
 * Constructs a rich structural operational page inside the designated Notion database.
 * Formats properties and embeds rich body blocks for human approvers.
 * @param {object} params
 * @param {string} params.taskType
 * @param {string} params.titleText
 * @param {string} [params.studentId]
 * @param {object} [params.payload]
 * @param {object} [params.riskContext]
 * @returns {Promise<object>}
 */
export async function createWorkflowTask({ taskType, titleText, studentId, payload = {}, riskContext = null }) {
  const client = notionClient();
  const task = {
    taskType,
    title: titleText,
    studentId: studentId || null,
    status: "Triage",
    payload,
    riskContext,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await mongo().collection("workflowTasks").insertOne(task);
  task._id = result.insertedId;

  if (!client) {
    return { ...task, notionPageId: null };
  }

  try {
    const childrenBlocks = [
      {
        object: "block",
        type: "callout",
        callout: {
          rich_text: textObj(`CampusFlow AI Operational Alert: ${titleText}`),
          icon: { emoji: taskType === "RISK_INTERVENTION" ? "⚠️" : "📋" }
        }
      },
      {
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: textObj("Student & Telemetry Details")
        }
      },
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: textObj(`Student ID: ${studentId || "N/A"}`)
        }
      },
      {
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: textObj(`Task Category: ${taskType}`)
        }
      }
    ];

    if (riskContext) {
      childrenBlocks.push(
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: textObj(`Average Marks: ${riskContext.averageMarks ?? "N/A"}%`)
          }
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: textObj(`Attendance: ${riskContext.attendancePercentage ?? "N/A"}%`)
          }
        },
        {
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: textObj(`Trigger Reason: ${riskContext.flagReason || "Performance Threshold Violation"}`)
          }
        }
      );
    }

    if (payload.reason) {
      childrenBlocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: textObj(`Application Reason: ${payload.reason}`)
        }
      });
    }

    childrenBlocks.push(
      {
        object: "block",
        type: "divider",
        divider: {}
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: textObj("Human Review: Set Status to 'Approved' or 'Rejected' to execute downstream synchronization.")
        }
      }
    );

    const pageProperties = {
      Name: { title: textObj(titleText) }
    };

    const page = await client.pages.create({
      parent: { database_id: env.notionDatabaseId },
      properties: pageProperties,
      children: childrenBlocks
    });

    await mongo().collection("workflowTasks").updateOne(
      { _id: result.insertedId },
      { $set: { notionPageId: page.id, updatedAt: new Date() } }
    );

    await audit("NOTION_TASK_CREATED", { taskId: result.insertedId, notionPageId: page.id, taskType });
    return { ...task, notionPageId: page.id };
  } catch (error) {
    console.warn("Notion page creation error:", error.message);
    return { ...task, notionPageId: null };
  }
}

/**
 * Bi-Directional Synchronization Loop:
 * Queries Notion database / dataSource for status modifications ("Approved" or "Rejected"),
 * applies downstream state mutations into MongoDB, clears Redis caches, and updates Notion status.
 * Compatible across Notion API v4 and v5.
 * @returns {Promise<{synced: number, skipped: boolean, statuses: Array<string>}>}
 */
export async function syncWorkflowStatuses() {
  const client = notionClient();
  if (!client) return { synced: 0, skipped: true, statuses: [] };

  let synced = 0;
  const statuses = ["Approved", "Rejected"];

  try {
    let pages = [];
    const dataSourceId = await getDataSourceId(client, env.notionDatabaseId);

    if (dataSourceId && client.dataSources?.query) {
      const response = await client.dataSources.query({ data_source_id: dataSourceId });
      pages = response.results || [];
    } else if (client.databases?.query) {
      const response = await client.databases.query({ database_id: env.notionDatabaseId });
      pages = response.results || [];
    }

    for (const page of pages) {
      const statusProp = page.properties?.Status?.select?.name || page.properties?.Status?.status?.name;
      if (!statusProp || !statuses.includes(statusProp)) continue;

      const existing = await mongo().collection("workflowTasks").findOne({ notionPageId: page.id });
      if (!existing) continue;
      if (existing.status === "Executed" || existing.status === statusProp) continue;

      if (statusProp === "Approved") {
        await executeApprovedTask(existing);
        await setNotionStatus(page.id, "Executed");
      } else {
        await rejectTask(existing);
      }
      synced += 1;
    }
  } catch (error) {
    console.warn("Notion sync query error:", error.message);
  }

  return { synced, skipped: false, statuses };
}

/**
 * Downstream execution handler for Approved tasks.
 * @param {object} task
 */
async function executeApprovedTask(task) {
  if (task.taskType === "APPLICATION_APPROVAL" && task.payload?.applicationId) {
    await mongo().collection("applications").updateOne(
      { applicationId: task.payload.applicationId },
      { $set: { status: "Approved", approvedAt: new Date(), updatedAt: new Date() } }
    );
  }

  if (task.taskType === "RISK_INTERVENTION" && task.studentId) {
    await mongo().collection("students").updateOne(
      { studentId: task.studentId },
      {
        $set: {
          "riskContext.interventionStatus": "Approved by HOD/Dean",
          "riskContext.clearedAt": new Date(),
          updatedAt: new Date()
        }
      }
    );
    await cacheDelete(`student:${task.studentId}`);
    await cacheDeletePattern("roster:*");
  }

  await mongo().collection("workflowTasks").updateOne(
    { _id: task._id },
    { $set: { status: "Executed", executedAt: new Date(), updatedAt: new Date() } }
  );

  await cacheDeletePattern("workflow:*");
  await audit("WORKFLOW_EXECUTED", { taskId: task._id, taskType: task.taskType, studentId: task.studentId });
}

/**
 * Downstream rejection handler.
 * @param {object} task
 */
async function rejectTask(task) {
  if (task.taskType === "APPLICATION_APPROVAL" && task.payload?.applicationId) {
    await mongo().collection("applications").updateOne(
      { applicationId: task.payload.applicationId },
      { $set: { status: "Rejected", rejectedAt: new Date(), updatedAt: new Date() } }
    );
  }

  if (task.taskType === "RISK_INTERVENTION" && task.studentId) {
    await mongo().collection("students").updateOne(
      { studentId: task.studentId },
      {
        $set: {
          "riskContext.interventionStatus": "Rejected / Dismissed",
          updatedAt: new Date()
        }
      }
    );
    await cacheDelete(`student:${task.studentId}`);
  }

  await mongo().collection("workflowTasks").updateOne(
    { _id: task._id },
    { $set: { status: "Rejected", rejectedAt: new Date(), updatedAt: new Date() } }
  );

  await cacheDeletePattern("workflow:*");
  await audit("WORKFLOW_REJECTED", { taskId: task._id, taskType: task.taskType, studentId: task.studentId });
}

/**
 * Direct administrative decision override.
 * @param {string} taskId
 * @param {string} status
 * @param {object} actor
 */
export async function decideLocalTask(taskId, status, actor) {
  const task =
    (await mongo().collection("workflowTasks").findOne({ _id: taskId })) ||
    (await mongo().collection("workflowTasks").findOne({ notionPageId: taskId }));

  if (!task) return null;

  if (status === "Approved") {
    await executeApprovedTask(task);
    if (task.notionPageId) await setNotionStatus(task.notionPageId, "Executed");
  } else {
    await rejectTask(task);
    if (task.notionPageId) await setNotionStatus(task.notionPageId, "Rejected");
  }

  await audit("WORKFLOW_DECISION", { taskId: task._id, status, actor: actor?.sub });
  return { taskId: task._id, status: status === "Approved" ? "Executed" : "Rejected" };
}
