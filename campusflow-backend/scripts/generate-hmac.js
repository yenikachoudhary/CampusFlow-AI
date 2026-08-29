#!/usr/bin/env node
import crypto from "node:crypto";
import { env } from "../src/config/env.js";

const payload = process.argv[2]
  ? JSON.parse(process.argv[2])
  : {
      studentId: "CF-2026-9041",
      name: "Jane Doe",
      department: "Computer Science",
      riskContext: {
        averageMarks: 42.5,
        attendancePercentage: 61.2,
        flagReason: "Automated performance threshold violation: Low midterm evaluation scores paired with high proxy attendance risk markers."
      },
      notionWorkflowState: "Triage"
    };

const raw = JSON.stringify(payload);
const signature = crypto.createHmac("sha256", env.hmacSecret).update(raw).digest("hex");

console.log("\n========================================================");
console.log("CampusFlow AI — Cryptographic HMAC-SHA256 Generator");
console.log("========================================================");
console.log("\n[Payload Raw JSON]:\n", raw);
console.log("\n[X-CampusFlow-Signature]:\n", signature);
console.log("\n[Combined Payload with securitySignature]:\n", JSON.stringify({ ...payload, securitySignature: signature }, null, 2));
console.log("========================================================\n");
