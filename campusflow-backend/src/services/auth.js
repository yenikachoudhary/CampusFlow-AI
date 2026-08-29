import { env } from "../config/env.js";
import { mongo } from "../db/mongo.js";
import { verifyPassword } from "./seed.js";
import { createDevJwt } from "../utils/crypto.js";
import { HttpError } from "../utils/http.js";
import { audit } from "./audit.js";

export async function login({ identifier, password }) {
  const username = String(identifier || "").trim();
  const secret = String(password || "");
  if (!username || !secret) {
    throw new HttpError(400, "identifier and password are required", "INVALID_LOGIN");
  }

  const user = await mongo().collection("users").findOne({ username });
  if (!user || !verifyPassword(secret, user.passwordSalt, user.passwordHash)) {
    throw new HttpError(401, "Invalid credentials", "INVALID_LOGIN");
  }

  const token = createDevJwt({
    sub: user.studentId || user.username,
    role: user.role,
    expiresInSeconds: 60 * 60 * 8,
    extra: { name: user.name, username: user.username }
  });

  await audit("LOGIN", { userId: user.username, role: user.role });
  return {
    token,
    user: {
      sub: user.studentId || user.username,
      username: user.username,
      name: user.name,
      role: user.role
    },
    expiresIn: 60 * 60 * 8,
    issuer: env.jwtIssuer
  };
}
