import { MongoClient } from "mongodb";
import { env } from "../config/env.js";
import { createMemoryDb } from "./memory.js";

let client;
let db;
let mode = "disconnected";

export function mongoMode() {
  return mode;
}

export async function connectMongo() {
  if (db) return db;

  if (env.isProduction && !env.mongodbUri) {
    throw new Error("MONGODB_URI is required in production");
  }

  if (env.mongodbUri) {
    try {
      client = new MongoClient(env.mongodbUri, {
        maxPoolSize: 30,
        minPoolSize: 0,
        retryWrites: true,
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        family: 4,
        tls: env.mongodbUri.startsWith("mongodb+srv://") || env.mongodbUri.includes("tls=true")
      });
      await client.connect();
      await client.db(env.mongodbDb).command({ ping: 1 });
      db = client.db(env.mongodbDb);
      mode = "atlas";
      await ensureIndexes(db);
      console.log("MongoDB Atlas connected");
      return db;
    } catch (error) {
      await client?.close().catch(() => undefined);
      client = undefined;
      db = undefined;
      console.error("MongoDB connection failed:", error.message);
      if (env.isProduction || !env.allowMockDatastore) {
        throw error;
      }
      console.warn("Development mock datastore enabled. Production must use MongoDB Atlas.");
    }
  } else if (env.isProduction) {
    throw new Error("MONGODB_URI is required in production");
  } else if (!env.allowMockDatastore) {
    throw new Error("MONGODB_URI is missing and DEV_ALLOW_MOCK_DATASTORE is disabled");
  } else {
    console.warn("MONGODB_URI not set. Using development mock datastore.");
  }

  db = createMemoryDb();
  mode = "memory";
  await ensureIndexes(db);
  return db;
}

async function ensureIndexes(database) {
  await database.collection("users").createIndex({ username: 1 }, { unique: true });
  await database.collection("students").createIndex({ studentId: 1 }, { unique: true });
  await database.collection("applications").createIndex({ studentId: 1, createdAt: -1 });
  await database.collection("attendance").createIndex({ studentId: 1, timestamp: -1 });
  await database.collection("auditLogs").createIndex({ createdAt: -1 });
  await database.collection("workflowTasks").createIndex({ status: 1, updatedAt: -1 });
  await database.collection("notices").createIndex({ department: 1, createdAt: -1 });
  await database.collection("studentEmbeddings").createIndex({ studentId: 1 }, { unique: true });
}

export function mongo() {
  if (!db) throw new Error("MongoDB is not connected");
  return db;
}

export async function closeMongo() {
  await client?.close();
  client = undefined;
  db = undefined;
  mode = "disconnected";
}
