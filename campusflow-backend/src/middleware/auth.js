import { HttpError } from "../utils/http.js";
import { verifyJwt, verifyHmac } from "../utils/crypto.js";
import { readBody } from "../utils/http.js";

export function getBearer(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, "Bearer token required", "AUTH_REQUIRED");
  return match[1];
}

export function requireAuth(req) {
  req.user = verifyJwt(getBearer(req));
  return req.user;
}

export function requireRoles(...roles) {
  return (req) => {
    const user = req.user || requireAuth(req);
    if (!roles.includes(user.role)) {
      throw new HttpError(403, "Insufficient permissions", "FORBIDDEN");
    }
    return user;
  };
}

export async function requireHmacBody(req) {
  const raw = await readBody(req);
  const signature = req.headers["x-campusflow-signature"];
  if (!verifyHmac(raw, signature)) {
    throw new HttpError(401, "Invalid X-CampusFlow-Signature", "INVALID_HMAC");
  }
  return raw;
}
