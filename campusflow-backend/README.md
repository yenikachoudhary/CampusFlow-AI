# 🚀 CampusFlow AI — Production Backend Engine

CampusFlow AI is an enterprise-grade academic automation backend built on a lightweight, high-throughput Node.js micro-clustering runtime. It replaces obsolete campus administrative panels by using a **Notion Database** as the primary human approval workflow UI, powered by **MongoDB Atlas Vector Search**, **Redis low-latency caching**, and **native cryptographic verification (AES-256 + HMAC-SHA256)**.

---

## 🏛️ 4-Stage Architectural Implementation

```
[ Client / Frontend Engine (HTML5/CSS3/Vanilla JS) ]
       │ (HMAC Signed Payload / JWT Bearer Tokens)
       ▼
┌──────────────────────────────────────────────┐
│ STAGE 1: MICRO-CLUSTER & SECURITY MIDDLEWARE │
│ • Native multi-core CPU cluster scaling      │
│ • Native Crypto (AES-256-GCM + HMAC-SHA256)  │
│ • Sliding-window IP Rate Limiter             │
│ • Strict Role-Based Access Control (RBAC)    │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ STAGE 2: MONGO VECTOR & DATA PERSISTENCE     │
│ • 128-d Face Vector Storage ($vectorSearch)  │
│ • Privacy Pipeline (Drop raw pixel data)     │
│ • Risk Radar & Telemetry Ingestion           │
│ • Immutable Transactional Audit Run Logs     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ STAGE 3: LOW-LATENCY CACHE STRATEGY (REDIS)  │
│ • Cache-Aside query pattern (0.8ms reads)    │
│ • Roster, Notices, Profiles, & Daily Cache   │
│ • Targeted cache invalidation on mutations   │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ STAGE 4: BI-DIRECTIONAL NOTION SYNC ENGINE   │
│ • Automated Notion Triage Card Generation    │
│ • Polling Loop & Webhook Sync Engine         │
│ • Downstream Execution & Audit Sync          │
└──────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (a pre-configured `.env` is already provided):
```bash
cp .env.example .env
```

### 3. Start Backend Server
```bash
npm start
```
*The server will start with multi-core clustering on `http://localhost:3000` (or your configured `PORT`).*

### 4. Run System Verification Tests
```bash
npm test
```
*Runs the 14-point test suite checking crypto, vector similarity, JWT, rate limiting, and all live API routes.*

### 5. Simulate Telemetry & Risk Marker Ingestion
```bash
npm run telemetry:test
```
*Transmits an HMAC-signed telemetry payload to `/api/telemetry/risk`, updates MongoDB, refreshes Redis, and creates a Notion Triage card.*

---

## 🔑 External API Token & Configuration Guide

### 1. 📘 Notion Integration Token & Database ID

To enable the Notion Human Approval Workflow:

1. Go to [Notion Integrations](https://www.notion.so/my-integrations).
2. Click **+ New integration**.
3. Name it **"CampusFlow AI"**, select your workspace, and choose **Internal Integration**.
4. Copy the **Internal Integration Secret** (starts with `secret_...`). Set this as `NOTION_TOKEN` in `.env`.
5. Create a new full-page Database or Board inside your Notion workspace.
   - Recommended columns / properties:
     - `Name` (Title)
     - `Status` (Select: `Triage`, `Approved`, `Rejected`, `Executed`)
     - `Student ID` (Rich Text)
     - `Task Type` (Select: `RISK_INTERVENTION`, `APPLICATION_APPROVAL`, `ADMIN_REVIEW`)
6. Share your Notion Database with the integration:
   - In Notion, click the `...` menu (top right of your database page) -> **Connections** -> Select **CampusFlow AI**.
7. Copy the **Database ID**:
   - The database URL format is: `https://www.notion.so/<workspace>/<DATABASE_ID>?v=...`
   - Copy the 32-character `<DATABASE_ID>` string and set it as `NOTION_DATABASE_ID` in `.env`.

---

### 2. 🍃 MongoDB Atlas & Vector Search Index

1. Create a free MongoDB Atlas cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Under **Security -> Database Access**, create a user with read/write permissions.
3. Under **Security -> Network Access**, whitelist your IP or allow access from anywhere (`0.0.0.0/0`).
4. Under **Database -> Connect -> Drivers**, copy the connection string:
   ```env
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=campusflow
   ```
5. *(Optional)* Create the Atlas Vector Search index on the `studentEmbeddings` collection:
   - In Atlas, go to **Search -> Create Search Index -> Atlas Vector Search (JSON Editor)**.
   - Database: `campusflow`, Collection: `studentEmbeddings`, Index Name: `student_embedding_vector_index`.
   - Paste the definition from [`scripts/atlas-vector-index.json`](./scripts/atlas-vector-index.json):
     ```json
     {
       "fields": [
         {
           "type": "vector",
           "path": "embedding",
           "numDimensions": 128,
           "similarity": "cosine"
         },
         {
           "type": "filter",
           "path": "studentId"
         }
       ]
     }
     ```
   *Note: If Atlas is not connected, the server automatically uses an optimized in-memory datastore and fallback cosine vector matcher.*

---

### 3. 🔴 Redis Caching Engine

1. **Option A (Free Cloud Redis)**:
   - Create a free database at [Upstash Redis](https://upstash.com).
   - Copy the Redis URL (e.g. `rediss://default:token@...upstash.io:6379`).
   - Set `REDIS_URL` in `.env`.
2. **Option B (Local Redis / Docker)**:
   ```bash
   docker run -d -p 6379:6379 --name campusflow-redis redis:alpine
   ```
   - Set `REDIS_URL=redis://localhost:6379`.
   *Note: If Redis is not connected, the backend automatically uses an in-memory cache-aside fallback.*

---

### 4. 🤖 AI Assistant API Key (Google Gemini or OpenAI)

1. **Google Gemini (Recommended)**:
   - Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).
   - In `.env`:
     ```env
     AI_API_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
     AI_API_KEY=YOUR_GEMINI_API_KEY
     AI_MODEL=gemini-1.5-flash
     ```
2. **OpenAI**:
   - Get an API key at [platform.openai.com](https://platform.openai.com/api-keys).
   - In `.env`:
     ```env
     AI_API_URL=https://api.openai.com/v1/chat/completions
     AI_API_KEY=YOUR_OPENAI_API_KEY
     AI_MODEL=gpt-4o-mini
     ```
   *Note: If no AI key is configured, the backend automatically runs a built-in intelligent campus reasoning engine.*

---

## 📡 API Endpoint Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | Datastore health, cluster state, and service statuses |
| `POST` | `/api/auth/login` | None | Authenticates student/staff and returns HS256 JWT |
| `GET` | `/api/me` | JWT | Current authenticated user and student profile |
| `GET` | `/api/attendance` | JWT | Attendance history records |
| `POST` | `/api/attendance/check-in` | Student JWT | 128-d face embedding check-in (drops raw images) |
| `POST` | `/api/telemetry/risk` | HMAC-SHA256 | Ingests performance risk marker, updates Mongo, creates Notion card |
| `POST` | `/api/telemetry/embedding` | HMAC-SHA256 | Registers 128-d biometric embedding for student |
| `GET` | `/api/students` | Staff JWT | Student directory (Redis Cache-Aside) |
| `GET` | `/api/applications` | JWT | Lists student or campus applications |
| `POST` | `/api/applications` | Student JWT | Submits application and opens Notion approval card |
| `POST` | `/api/applications/:id/:action` | Staff JWT | Approves or Rejects application (`:action` = approve/reject) |
| `GET` | `/api/workflow/tasks` | Staff JWT | Lists Notion workflow queue tasks |
| `POST` | `/api/workflow/tasks` | Staff JWT | Creates manual administrative workflow task |
| `POST` | `/api/workflow/tasks/:id/:action` | Staff JWT | Directly approves or rejects a workflow card |
| `POST` | `/api/workflow/sync` | Staff JWT | Manually triggers Notion bi-directional polling sync |
| `GET` | `/api/notices` | JWT | Campus notices (Redis Cache-Aside) |
| `POST` | `/api/notices` | Staff JWT | Publishes campus notice |
| `POST` | `/api/ai/chat` | JWT | AI assistant queries with student context |
| `GET` | `/api/audit` | Staff JWT | Immutable transactional audit logs |

---

## 🔒 Security Architecture

1. **Native AES-256-GCM Encryption**: Secure encryption and decryption for sensitive records.
2. **HMAC-SHA256 Verification**: Telemetry requests validated in constant time via `crypto.timingSafeEqual` with `X-CampusFlow-Signature`.
3. **Privacy Pipeline**: Strict rejection and zero-storage of raw pixel arrays/images; only 128-d mathematical embeddings are accepted.
4. **Sliding-Window Rate Limiter**: Native IP-level sliding-window tracking preventing automated brute-force attacks.
5. **Role-Based Access Control (RBAC)**: Zero-dependency HS256 JWT verifying roles (`student`, `faculty`, `hod`, `dean`, `admin`).
