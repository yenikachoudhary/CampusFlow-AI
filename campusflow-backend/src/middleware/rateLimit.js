import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

const buckets = new Map();
let lastCleanup = 0;

function clientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return (forwarded ? String(forwarded).split(",")[0].trim() : req.socket.remoteAddress) || "unknown";
}

export function rateLimit(req) {
  const now = Date.now();
  const key = clientKey(req);
  let timestamps = buckets.get(key) || [];
  const cutoff = now - env.rateLimitWindowMs;
  timestamps = timestamps.filter((time) => time > cutoff);
  if (timestamps.length >= env.rateLimitMax) {
    throw new HttpError(429, "Too many requests", "RATE_LIMITED");
  }
  timestamps.push(now);
  buckets.set(key, timestamps);

  if (now - lastCleanup > env.rateLimitWindowMs) {
    lastCleanup = now;
    for (const [bucketKey, values] of buckets) {
      if (!values.some((time) => time > cutoff)) buckets.delete(bucketKey);
    }
  }
}
