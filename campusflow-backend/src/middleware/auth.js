import { HttpError, readBody } from "../utils/http.js";
import { verifyJwt, verifyHmac } from "../utils/crypto.js";

/**
 * Extracts the Bearer token from the Authorization header.
 * @param {import('node:http').IncomingMessage} req
 * @returns {string}
 */
export function getBearer(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, "Bearer token required", "AUTH_REQUIRED");
  return match[1];
}

/**
 * Authenticates the request via JWT Bearer token and attaches req.user.
 * @param {import('node:http').IncomingMessage} req
 * @returns {object} The decoded user payload
 */
export function requireAuth(req) {
  req.user = verifyJwt(getBearer(req));
  return req.user;
}

/**
 * Isolated RBAC Engine: Restricts route access to specified roles.
 * Prevents student credentials from calling admin/faculty/HOD routes.
 * @param  {...string} roles
 * @returns {function}
 */
export function requireRoles(...roles) {
  return (req) => {
    const user = req.user || requireAuth(req);
    if (!roles.includes(user.role)) {
      throw new HttpError(403, `Insufficient permissions. Requires one of: ${roles.join(", ")}`, "FORBIDDEN");
    }
    return user;
  };
}

/**
 * Custom HMAC security middleware interceptor.
 * Evaluates the X-CampusFlow-Signature header, verifies the raw request payload against HMAC_SECRET,
 * and rejects tampered or unauthorized telemetry transmissions.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<Buffer>} The raw verified payload buffer
 */
export async function requireHmacBody(req) {
  const raw = await readBody(req);
  const signature = req.headers["x-campusflow-signature"] || req.headers["x-signature"];
  
  // If signature header is missing, check if it was provided inside JSON body as securitySignature
  if (!signature) {
    try {
      const parsed = JSON.parse(raw.toString("utf8"));
      if (parsed.securitySignature) {
        // Construct canonical representation without securitySignature for HMAC check
        const { securitySignature, ...canonicalData } = parsed;
        const canonicalRaw = Buffer.from(JSON.stringify(canonicalData));
        if (verifyHmac(canonicalRaw, securitySignature) || verifyHmac(raw, securitySignature)) {
          return raw;
        }
      }
    } catch {
      // Fall through to signature header validation error
    }
    throw new HttpError(401, "Missing X-CampusFlow-Signature header", "HMAC_REQUIRED");
  }

  if (!verifyHmac(raw, signature)) {
    throw new HttpError(401, "Invalid or tampered cryptographic HMAC signature", "INVALID_HMAC");
  }
  return raw;
}
