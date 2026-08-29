import crypto from "node:crypto";
import { env } from "../config/env.js";
import { mongo } from "../db/mongo.js";
import { demoEmbedding } from "../utils/embedding.js";
import { upsertStudent } from "./students.js";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export async function seedDevelopmentData() {
  const users = mongo().collection("users");
  const existing = await users.findOne({ username: "CF2026-1042" });
  if (existing) return { seeded: false };

  const password = env.devLoginPassword;
  const studentCreds = hashPassword(password);
  const facultyCreds = hashPassword(password);
  const hodCreds = hashPassword(password);

  await users.insertOne({
    username: "CF2026-1042",
    name: "Yenika Choudhary",
    role: "student",
    studentId: "CF2026-1042",
    passwordSalt: studentCreds.salt,
    passwordHash: studentCreds.hash,
    createdAt: new Date()
  });
  await users.insertOne({
    username: "faculty-cse",
    name: "Dr. Rahul Sharma",
    role: "faculty",
    department: "CSE",
    passwordSalt: facultyCreds.salt,
    passwordHash: facultyCreds.hash,
    createdAt: new Date()
  });
  await users.insertOne({
    username: "hod-cse",
    name: "Head of Department",
    role: "hod",
    department: "CSE",
    passwordSalt: hodCreds.salt,
    passwordHash: hodCreds.hash,
    createdAt: new Date()
  });

  await upsertStudent({
    studentId: "CF2026-1042",
    name: "Yenika Choudhary",
    department: "Computer Science & Engineering",
    semester: "2nd Semester",
    averageMarks: 84,
    attendancePercentage: 87
  });

  await mongo().collection("studentEmbeddings").updateOne(
    { studentId: "CF2026-1042" },
    { $set: { studentId: "CF2026-1042", embedding: demoEmbedding("CF2026-1042"), updatedAt: new Date() } },
    { upsert: true }
  );

  await mongo().collection("notices").insertOne({
    noticeId: "NOTICE-WELCOME",
    title: "CampusFlow connected",
    body: "The Student and Faculty portals can now call the CampusFlow API.",
    department: "CSE",
    createdAt: new Date()
  });

  return { seeded: true };
}

export function verifyPassword(password, salt, hash) {
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
