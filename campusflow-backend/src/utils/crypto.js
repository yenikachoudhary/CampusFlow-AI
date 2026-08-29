import crypto from "node:crypto";
import { env } from "../config/env.js";
import { HttpError } from "./http.js";

const b64url = (value) => Buffer.from(value).toString("base64url");

export function hmacHex(rawBody, secret = env.hmacSecret) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyHmac(rawBody, supplied) {
  if (!supplied || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = Buffer.from(hmacHex(rawBody), "hex");
  const actual = Buffer.from(supplied, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function decodePart(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

export function verifyJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new HttpError(401, "Malformed JWT", "INVALID_TOKEN");

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  let header, payload;
  try {
    header = decodePart(encodedHeader);
    payload = decodePart(encodedPayload);
  } catch {
    throw new HttpError(401, "Malformed JWT", "INVALID_TOKEN");
  }

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new HttpError(401, "Unsupported JWT", "INVALID_TOKEN");
  }

  const expected = crypto.createHmac("sha256", env.jwtSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const supplied = Buffer.from(encodedSignature, "base64url");
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    throw new HttpError(401, "Invalid JWT signature", "INVALID_TOKEN");
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || !payload.role) throw new HttpError(401, "JWT subject and role are required", "INVALID_TOKEN");
  if (payload.iss !== env.jwtIssuer || payload.aud !== env.jwtAudience) {
    throw new HttpError(401, "Invalid JWT issuer or audience", "INVALID_TOKEN");
  }
  if (!Number.isInteger(payload.exp) || payload.exp <= now) {
    throw new HttpError(401, "JWT expired", "TOKEN_EXPIRED");
  }
  if (payload.nbf && payload.nbf > now) throw new HttpError(401, "JWT not active", "INVALID_TOKEN");

  return payload;
}

export function createDevJwt({ sub, role, expiresInSeconds = 3600, extra = {} }) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    sub,
    role,
    iss: env.jwtIssuer,
    aud: env.jwtAudience,
    iat: now,
    exp: now + expiresInSeconds,
    ...extra
  }));
  const signature = crypto.createHmac("sha256", env.jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}
