import crypto from "node:crypto";
import { env } from "../config/env.js";
import { mongo } from "../db/mongo.js";
import { demoEmbedding } from "../utils/embedding.js";
import { upsertStudent } from "./students.js";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/**
 * Seeds initial demo accounts, students, 128-d biometric embeddings,
 * notices, and workflow tasks for full-stack validation.
 */
export async function seedDevelopmentData() {
  const users = mongo().collection("users");
  const existing = await users.findOne({ username: "CF2026-1042" });
  if (existing) return { seeded: false };

  const password = env.devLoginPassword;
  const student1Creds = hashPassword(password);
  const student2Creds = hashPassword(password);
  const facultyCreds = hashPassword(password);
  const hodCreds = hashPassword(password);
  const deanCreds = hashPassword(password);

  // 1. Seed User Accounts
  await users.insertMany([
    {
      username: "CF2026-1042",
      name: "Yenika Choudhary",
      role: "student",
      studentId: "CF2026-1042",
      department: "CSE",
      passwordSalt: student1Creds.salt,
      passwordHash: student1Creds.hash,
      createdAt: new Date()
    },
    {
      username: "CF-2026-9041",
      name: "Jane Doe",
      role: "student",
      studentId: "CF-2026-9041",
      department: "Computer Science",
      passwordSalt: student2Creds.salt,
      passwordHash: student2Creds.hash,
      createdAt: new Date()
    },
    {
      username: "faculty-cse",
      name: "Dr. Rahul Sharma",
      role: "faculty",
      department: "CSE",
      passwordSalt: facultyCreds.salt,
      passwordHash: facultyCreds.hash,
      createdAt: new Date()
    },
    {
      username: "hod-cse",
      name: "Prof. Sunita Rao (HOD)",
      role: "hod",
      department: "CSE",
      passwordSalt: hodCreds.salt,
      passwordHash: hodCreds.hash,
      createdAt: new Date()
    },
    {
      username: "dean-acad",
      name: "Dean of Academic Affairs",
      role: "dean",
      department: "Academic Affairs",
      passwordSalt: deanCreds.salt,
      passwordHash: deanCreds.hash,
      createdAt: new Date()
    }
  ]);

  // 2. Seed Student Profiles
  await upsertStudent({
    studentId: "CF2026-1042",
    name: "Yenika Choudhary",
    department: "Computer Science & Engineering",
    semester: "2nd Semester",
    averageMarks: 84,
    attendancePercentage: 87
  });

  await upsertStudent({
    studentId: "CF-2026-9041",
    name: "Jane Doe",
    department: "Computer Science",
    semester: "4th Semester",
    averageMarks: 42.5,
    attendancePercentage: 61.2,
    riskContext: {
      averageMarks: 42.5,
      attendancePercentage: 61.2,
      flagReason: "Automated performance threshold violation: Low midterm evaluation scores paired with high proxy attendance risk markers.",
      flaggedAt: new Date()
    }
  });

  await upsertStudent({
    studentId: "CF2026-1055",
    name: "Rohan Verma",
    department: "Information Technology",
    semester: "2nd Semester",
    averageMarks: 72,
    attendancePercentage: 78
  });

  // 3. Seed 128-d Biometric Embeddings
  const embeddings = mongo().collection("studentEmbeddings");
  await embeddings.updateOne(
    { studentId: "CF2026-1042" },
    { $set: { studentId: "CF2026-1042", embedding: demoEmbedding("CF2026-1042"), updatedAt: new Date() } },
    { upsert: true }
  );
  await embeddings.updateOne(
    { studentId: "CF-2026-9041" },
    { $set: { studentId: "CF-2026-9041", embedding: demoEmbedding("CF-2026-9041"), updatedAt: new Date() } },
    { upsert: true }
  );
  await embeddings.updateOne(
    { studentId: "CF2026-1055" },
    { $set: { studentId: "CF2026-1055", embedding: demoEmbedding("CF2026-1055"), updatedAt: new Date() } },
    { upsert: true }
  );

  // 4. Seed Notices
  await mongo().collection("notices").insertMany([
    {
      noticeId: "NOTICE-ORIENTATION",
      title: "CampusFlow AI Platform Online",
      body: "Welcome to CampusFlow AI. Facial biometric attendance check-in, leave application processing, and Smart Notice Engine are now live.",
      department: "CSE",
      createdBy: "hod-cse",
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      noticeId: "NOTICE-MIDTERMS",
      title: "Upcoming Mid-Semester Evaluations",
      body: "Midterm evaluations scheduled for next month. Ensure overall subject attendance remains strictly above the 75% threshold.",
      department: "Academic Affairs",
      createdBy: "dean-acad",
      createdAt: new Date()
    }
  ]);

  // 5. Seed Initial Notion Workflow Task in Triage
  await mongo().collection("workflowTasks").insertOne({
    taskType: "RISK_INTERVENTION",
    title: "Performance Alert: Jane Doe (CF-2026-9041)",
    studentId: "CF-2026-9041",
    status: "Triage",
    payload: {
      studentId: "CF-2026-9041",
      name: "Jane Doe",
      department: "Computer Science",
      averageMarks: 42.5,
      attendancePercentage: 61.2,
      flagReason: "Automated performance threshold violation: Low midterm evaluation scores paired with high proxy attendance risk markers."
    },
    riskContext: {
      averageMarks: 42.5,
      attendancePercentage: 61.2,
      flagReason: "Automated performance threshold violation"
    },
    notionPageId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return { seeded: true };
}
