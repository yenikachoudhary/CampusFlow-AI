#!/usr/bin/env node
import crypto from "node:crypto";
import { env } from "../src/config/env.js";
import { encryptAes256, decryptAes256, verifyHmac, createDevJwt, verifyJwt } from "../src/utils/crypto.js";
import { demoEmbedding } from "../src/utils/embedding.js";
import { cosineSimilarity } from "../src/services/vector.js";

const baseUrl = `http://${env.host === "0.0.0.0" ? "localhost" : env.host}:${env.port}`;

async function runSystemVerification() {
  console.log("================================================================");
  console.log("🚀 CAMPUSFLOW AI — FULL SYSTEM VERIFICATION SUITE");
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. Cryptographic Engine Verification
  console.log("--- 1. Cryptographic Engine Verification ---");
  const secretData = "Student-Biometric-Record-9041";
  const encrypted = encryptAes256(secretData, env.hmacSecret);
  const decrypted = decryptAes256(encrypted, env.hmacSecret);
  assert(decrypted === secretData, "AES-256-GCM Encryption & Decryption Cycle", `Expected ${secretData}, got ${decrypted}`);

  const testPayload = JSON.stringify({ ping: "campusflow" });
  const testHmac = crypto.createHmac("sha256", env.hmacSecret).update(testPayload).digest("hex");
  assert(verifyHmac(testPayload, testHmac), "Constant-Time HMAC-SHA256 Verification");
  assert(!verifyHmac(testPayload, "0000000000000000000000000000000000000000000000000000000000000000"), "HMAC Tamper Rejection");

  const testJwt = createDevJwt({ sub: "CF2026-1042", role: "student", expiresInSeconds: 60 });
  const verifiedPayload = verifyJwt(testJwt);
  assert(verifiedPayload.sub === "CF2026-1042" && verifiedPayload.role === "student", "Zero-Dependency HS256 JWT Cycle");

  // 2. Vector Math & Cosine Similarity Verification
  console.log("\n--- 2. Biometric Vector Matching Verification ---");
  const vec1 = demoEmbedding("CF2026-1042");
  const vec2 = demoEmbedding("CF2026-1042");
  const vec3 = demoEmbedding("DifferentStudent");
  assert(vec1.length === 128, "128-Dimensional Embedding Shape Constraint");
  const matchSelf = cosineSimilarity(vec1, vec2);
  const matchOther = cosineSimilarity(vec1, vec3);
  assert(matchSelf > 0.999, "Cosine Self-Match (>0.999)", `Score: ${matchSelf}`);
  assert(matchOther < 0.8, "Cosine Non-Match Discrimination (<0.80)", `Score: ${matchOther}`);

  // 3. API Health & Endpoints (if server is running)
  console.log("\n--- 3. Live API Gateway Verification ---");
  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const health = await healthRes.json();
    assert(health.ok === true && health.service === "campusflow-api", "GET /api/health Endpoint");
    console.log(`   Datastores: Mongo [${health.mongo}], Redis [${health.redis}], Notion [${health.notion}], AI [${health.ai}]`);

    // Student Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "CF2026-1042", password: env.devLoginPassword })
    });
    const loginData = await loginRes.json();
    assert(loginRes.ok && Boolean(loginData.token), "POST /api/auth/login (Student)");

    const studentToken = loginData.token;

    // Profile retrieval
    const meRes = await fetch(`${baseUrl}/api/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const meData = await meRes.json();
    assert(meRes.ok && meData.student?.studentId === "CF2026-1042", "GET /api/me Context Resolution");

    // Biometric Attendance Verification Check-In
    const checkInRes = await fetch(`${baseUrl}/api/attendance/check-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ embedding: vec1 })
    });
    const checkInData = await checkInRes.json();
    assert(checkInRes.ok && checkInData.verified === true, "POST /api/attendance/check-in (Face Verification Match)");

    // Privacy Pipeline Enforcement (Raw image rejection)
    const rawImageRes = await fetch(`${baseUrl}/api/attendance/check-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ imageBase64: "data:image/jpeg;base64,...", embedding: vec1 })
    });
    assert(rawImageRes.status === 400, "Privacy Pipeline: Rejection of Raw Imagery (HTTP 400)");

    // Faculty Login & Directory
    const facultyLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "faculty-cse", password: env.devLoginPassword })
    });
    const facultyData = await facultyLoginRes.json();
    const facultyToken = facultyData.token;

    const studentsRes = await fetch(`${baseUrl}/api/students`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const studentsData = await studentsRes.json();
    assert(studentsRes.ok && Array.isArray(studentsData.students), "GET /api/students (Redis Cache-Aside Roster)");

    // AI Query
    const aiRes = await fetch(`${baseUrl}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ question: "What is my current attendance percentage?" })
    });
    const aiData = await aiRes.json();
    assert(aiRes.ok && Boolean(aiData.answer), "POST /api/ai/chat Assistant Query");
  } catch (err) {
    console.warn(`   ⚠️ Live server tests skipped or error: ${err.message}`);
    console.log("   (Start server via `npm start` before running full live gateway tests)");
  }

  console.log("\n================================================================");
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================\n");

  if (failed > 0) process.exit(1);
}

runSystemVerification();
