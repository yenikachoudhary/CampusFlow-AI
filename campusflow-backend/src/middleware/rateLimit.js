import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

/**
 * Sliding window rate limiter store.
 * Maps client IP address -> array of request timestamps (epoch ms).
 */
const buckets = new Map();
let lastCleanup = 0;

/**
 * Resolves the true client IP context from socket or reverse proxies.
 * @param {import('node:http').IncomingMessage} req
 * @returns {string}
 */
function clientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = String(forwarded).split(",")[0].trim();
    if (ip) return ip;
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

/**
 * Rate Limiter Middleware:
 * Uses a sliding-window array to throttle excessive requests and mitigate automated attacks.
 * @param {import('node:http').IncomingMessage} req
 */
export function rateLimit(req) {
  const now = Date.now();
  const key = clientKey(req);
  let timestamps = buckets.get(key) || [];
  const cutoff = now - env.rateLimitWindowMs;

  // Evict timestamps older than current window
  timestamps = timestamps.filter((time) => time > cutoff);

  if (timestamps.length >= env.rateLimitMax) {
    throw new HttpError(429, `Too many requests. Limit is ${env.rateLimitMax} requests per minute.`, "RATE_LIMITED");
  }

  timestamps.push(now);
  buckets.set(key, timestamps);

  // Periodic garbage collection for inactive client buckets
  if (now - lastCleanup > env.rateLimitWindowMs) {
    lastCleanup = now;
    for (const [bucketKey, values] of buckets) {
      if (!values.some((time) => time > cutoff)) {
        buckets.delete(bucketKey);
      }
    }
  }
}
