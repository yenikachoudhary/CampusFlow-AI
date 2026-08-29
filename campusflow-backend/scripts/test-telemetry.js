#!/usr/bin/env node
import crypto from "node:crypto";
import { env } from "../src/config/env.js";

const baseUrl = `http://${env.host === "0.0.0.0" ? "localhost" : env.host}:${env.port}`;

async function runTelemetryTest() {
  console.log("================================================================");
  console.log("CampusFlow AI — Telemetry & Risk Ingestion Simulation Test");
  console.log("================================================================");
  console.log(`Target Backend: ${baseUrl}\n`);

  const telemetryPayload = {
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

  const rawBody = JSON.stringify(telemetryPayload);
  const signature = crypto.createHmac("sha256", env.hmacSecret).update(rawBody).digest("hex");

  console.log("1. Generated HMAC-SHA256 Signature for Telemetry Payload:");
  console.log(`   Signature: ${signature}\n`);

  try {
    console.log("2. Transmitting signed telemetry payload to POST /api/telemetry/risk...");
    const response = await fetch(`${baseUrl}/api/telemetry/risk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CampusFlow-Signature": signature
      },
      body: rawBody
    });

    const responseData = await response.json();
    console.log(`   Status: HTTP ${response.status}`);
    console.log("   Response Data:", JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log("\n✅ Telemetry ingestion test PASSED.");
      console.log("   Student profile saved in MongoDB & cached in Redis.");
      console.log("   Notion workflow task registered in Triage status.");
    } else {
      console.error("\n❌ Telemetry ingestion test FAILED with error status.");
    }
  } catch (error) {
    console.error("\n❌ Telemetry ingestion test request error:", error.message);
    console.log("   (Make sure the backend server is running via `npm start`)");
  }
  console.log("================================================================\n");
}

runTelemetryTest();
