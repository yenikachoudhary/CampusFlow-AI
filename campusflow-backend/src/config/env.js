import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const allowMock = !isProduction && process.env.DEV_ALLOW_MOCK_DATASTORE !== "false";

export const env = {
  nodeEnv,
  isProduction,
  allowMockDatastore: allowMock,
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 3000),
  webWorkers: process.env.WEB_WORKERS === undefined
    ? (isProduction ? 0 : 1)
    : Number(process.env.WEB_WORKERS),
  corsOrigins: String(process.env.CORS_ORIGIN || "http://localhost:5500,http://127.0.0.1:5500")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  mongodbUri: process.env.MONGODB_URI || "",
  mongodbDb: process.env.MONGODB_DB || "campusflow",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  notionToken: process.env.NOTION_TOKEN || "",
  notionDatabaseId: process.env.NOTION_DATABASE_ID || "",
  notionPollMs: Number(process.env.NOTION_POLL_MS || 5000),
  hmacSecret: required("HMAC_SECRET"),
  jwtSecret: required("JWT_SECRET"),
  jwtIssuer: process.env.JWT_ISSUER || "campusflow",
  jwtAudience: process.env.JWT_AUDIENCE || "campusflow-web",
  devLoginPassword: process.env.DEV_LOGIN_PASSWORD || "campusflow-dev",
  aiApiUrl: process.env.AI_API_URL || "",
  aiApiKey: process.env.AI_API_KEY || "",
  aiModel: process.env.AI_MODEL || "",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 120),
  bodyLimitBytes: Number(process.env.BODY_LIMIT_BYTES || 1048576),
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS || 300),
  vectorNumCandidates: Number(process.env.VECTOR_NUM_CANDIDATES || 100),
  vectorLimit: Number(process.env.VECTOR_LIMIT || 5)
};

if (isProduction && !env.mongodbUri) {
  throw new Error("MONGODB_URI is required in production");
}
