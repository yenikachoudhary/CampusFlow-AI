import { env } from "../config/env.js";

export class HttpError extends Error {
  constructor(status, message, code = "ERROR", details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function corsHeaders(req) {
  const requestOrigin = req.headers.origin;
  const allowed = env.corsOrigins;
  const origin = allowed.includes("*")
    ? (requestOrigin || "*")
    : (allowed.includes(requestOrigin) ? requestOrigin : allowed[0] || "*");
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CampusFlow-Signature",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

export function applyCors(req, res) {
  res._corsHeaders = corsHeaders(req);
}

export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...(res._corsHeaders || {})
  });
  res.end(body);
}

export function sendError(res, error) {
  const status = error instanceof HttpError ? error.status : 500;
  sendJson(res, status, {
    error: error instanceof HttpError ? error.code : "INTERNAL_ERROR",
    message: status === 500 && env.isProduction ? "Internal server error" : error.message,
    ...(error?.details ? { details: error.details } : {})
  });
}

export async function readBody(req) {
  let total = 0;
  const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > env.bodyLimitBytes) {
      throw new HttpError(413, "Request body too large", "BODY_TOO_LARGE");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function readJson(req) {
  const raw = await readBody(req);
  if (!raw.length) return { raw, value: {} };
  try {
    return { raw, value: JSON.parse(raw.toString("utf8")) };
  } catch {
    throw new HttpError(400, "Invalid JSON body", "INVALID_JSON");
  }
}

export function parseUrl(req) {
  return new URL(req.url, `http://${req.headers.host || "localhost"}`);
}

export function methodPath(req) {
  return `${req.method} ${parseUrl(req).pathname}`;
}
