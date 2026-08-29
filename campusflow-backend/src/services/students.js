import { mongo } from "../db/mongo.js";
import { cacheGetJson, cacheSetJson } from "../db/redis.js";
import { env } from "../config/env.js";

const key = (id) => `student:${id}`;

export async function getStudent(studentId) {
  const cached = await cacheGetJson(key(studentId));
  if (cached) return cached;
  const student = await mongo().collection("students").findOne(
    { studentId },
    { projection: { _id: 0 } }
  );
  if (student) await cacheSetJson(key(studentId), student, env.cacheTtlSeconds);
  return student;
}

export async function upsertStudent(student) {
  const clean = {
    studentId: String(student.studentId),
    name: String(student.name || ""),
    department: String(student.department || ""),
    semester: String(student.semester || ""),
    averageMarks: Number(student.averageMarks || 0),
    attendancePercentage: Number(student.attendancePercentage || 0),
    updatedAt: new Date()
  };
  await mongo().collection("students").updateOne(
    { studentId: clean.studentId },
    { $set: clean, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  await cacheSetJson(key(clean.studentId), clean, env.cacheTtlSeconds);
  return clean;
}
