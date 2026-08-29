import crypto from "node:crypto";
import { env } from "../config/env.js";
import { HttpError } from "./http.js";

const b64url = (value) => Buffer.from(value).toString("base64url");

/**
 * Computes a SHA-256 HMAC digest in hex.
 * @param {string|Buffer} rawBody
 * @param {string} [secret]
 * @returns {string}
 */
export function hmacHex(rawBody, secret = env.hmacSecret) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

/**
 * Constant-time HMAC signature verification to prevent timing attacks.
 * @param {string|Buffer} rawBody
 * @param {string} supplied
 * @param {string} [secret]
 * @returns {boolean}
 */
export function verifyHmac(rawBody, supplied, secret = env.hmacSecret) {
  if (!supplied || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = Buffer.from(hmacHex(rawBody, secret), "hex");
  const actual = Buffer.from(supplied, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/**
 * AES-256-GCM Encryption for sensitive telemetry and records.
 * Uses a cryptographically random 12-byte IV and returns iv:authTag:ciphertext in hex.
 * @param {string} plaintext
 * @param {string} [keySecret]
 * @returns {string}
 */
export function encryptAes256(plaintext, keySecret = env.hmacSecret) {
  const key = crypto.createHash("sha256").update(keySecret).digest(); // 32-byte key
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * AES-256-GCM Decryption.
 * @param {string} payload - Formatted as iv:authTag:ciphertext in hex.
 * @param {string} [keySecret]
 * @returns {string}
 */
export function decryptAes256(payload, keySecret = env.hmacSecret) {
  const parts = payload.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted payload format");
  const [ivHex, tagHex, dataHex] = parts;
  const key = crypto.createHash("sha256").update(keySecret).digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

function decodePart(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

/**
 * Strict verification of HS256 JWT tokens.
 * @param {string} token
 * @returns {object} Decoded JWT payload
 */
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
    throw new HttpError(401, "Unsupported JWT algorithm", "INVALID_TOKEN");
  }

  const expected = crypto
    .createHmac("sha256", env.jwtSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const supplied = Buffer.from(encodedSignature, "base64url");
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    throw new HttpError(401, "Invalid JWT signature", "INVALID_TOKEN");
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || !payload.role) {
    throw new HttpError(401, "JWT subject and role are required", "INVALID_TOKEN");
  }
  if (payload.iss !== env.jwtIssuer || payload.aud !== env.jwtAudience) {
    throw new HttpError(401, "Invalid JWT issuer or audience", "INVALID_TOKEN");
  }
  if (!Number.isInteger(payload.exp) || payload.exp <= now) {
    throw new HttpError(401, "JWT expired", "TOKEN_EXPIRED");
  }
  if (payload.nbf && payload.nbf > now) {
    throw new HttpError(401, "JWT not active yet", "INVALID_TOKEN");
  }

  return payload;
}

/**
 * Creates a signed HS256 JWT.
 * @param {object} params
 * @param {string} params.sub
 * @param {string} params.role
 * @param {number} [params.expiresInSeconds=3600]
 * @param {object} [params.extra={}]
 * @returns {string}
 */
export function createDevJwt({ sub, role, expiresInSeconds = 3600, extra = {} }) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      sub,
      role,
      iss: env.jwtIssuer,
      aud: env.jwtAudience,
      iat: now,
      exp: now + expiresInSeconds,
      ...extra
    })
  );
  const signature = crypto
    .createHmac("sha256", env.jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}
