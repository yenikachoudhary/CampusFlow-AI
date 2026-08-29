import cluster from "node:cluster";
import os from "node:os";
import http from "node:http";
import { env } from "./config/env.js";
import { connectMongo, closeMongo } from "./db/mongo.js";
import { connectRedis, closeRedis } from "./db/redis.js";
import { routeApi } from "./routes/api.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { sendError, sendJson, methodPath, applyCors } from "./utils/http.js";
import { syncWorkflowStatuses } from "./services/notion.js";
import { seedDevelopmentData } from "./services/seed.js";

const requestedWorkers = Number(env.webWorkers || 0);
const workerCount = Math.max(1, Math.min(requestedWorkers || os.availableParallelism(), 8));

if (cluster.isPrimary) {
  console.log(`CampusFlow primary ${process.pid}: starting ${workerCount} worker(s)`);
  for (let i = 0; i < workerCount; i++) cluster.fork();

  cluster.on("exit", (worker, code, signal) => {
    console.error(`Worker ${worker.process.pid} exited (${code || signal}); restarting.`);
    cluster.fork();
  });
} else {
  await startWorker();
}

async function startWorker() {
  await connectMongo();
  await connectRedis();
  if (!env.isProduction) {
    const seed = await seedDevelopmentData();
    if (seed.seeded) console.log("Development users seeded (student CF2026-1042, faculty-cse, hod-cse).");
  }

  const server = http.createServer(async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204, res._corsHeaders || {});
      res.end();
      return;
    }
    try {
      rateLimit(req);
      const handled = await routeApi(req, res, new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname);
      if (handled !== false) return;
      sendJson(res, 404, { error: "NOT_FOUND", message: `Route not found: ${methodPath(req)}` });
    } catch (error) {
      console.error(`${methodPath(req)}:`, error);
      sendError(res, error);
    }
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.requestTimeout = 30000;

  server.listen(env.port, env.host, () => {
    console.log(`CampusFlow worker ${process.pid} listening on ${env.host}:${env.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await Promise.allSettled([closeRedis(), closeMongo()]);
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  if (cluster.worker?.id === 1 && env.notionToken && env.notionDatabaseId) {
    setInterval(async () => {
      try {
        const result = await syncWorkflowStatuses();
        if (result.synced) console.log(`Notion sync: ${result.synced} task(s) processed.`);
      } catch (error) {
        console.error("Notion sync failed:", error.message);
      }
    }, env.notionPollMs).unref();
  }
}
