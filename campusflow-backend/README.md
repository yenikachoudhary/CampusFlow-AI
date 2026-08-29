# CampusFlow AI Backend

Node.js ES-module backend matching the CampusFlow AI blueprint and the available student/staff frontend contracts.

## What is included
- Native Node `http` server; no Express.
- Multi-process `cluster` orchestration.
- JWT HS256 verification using native `crypto`.
- HMAC-SHA256 request verification for signed telemetry/service requests.
- Sliding-window rate limiter.
- MongoDB persistence and Atlas Vector Search helpers.
- Raw-image rejection: attendance/vector endpoints accept embeddings, not pixel data.
- Redis cache-aside utilities.
- Notion approval-card creation and polling/synchronization.
- AI proxy so browser code never receives the AI provider secret.
- Audit/run logs.
- Student and staff API routes.

## Install

```bash
npm install
copy .env.example .env
```

Fill `.env`, then:

```bash
npm start
```

The server listens on `http://localhost:3000` by default.

## JWT

The server expects an HS256 JWT in `Authorization: Bearer <token>`. Claims used are `sub`, `role`, `iss`, `aud`, `iat`, and `exp`.

Roles: `student`, `faculty`, `hod`, `dean`, `admin`.

For production, issue tokens from your real identity provider. The backend deliberately does not provide a public login endpoint that would create privileged credentials.

## Frontend integration

The supplied student frontend is currently demo-only and explicitly says its real implementation will later connect to Node.js, MongoDB, Redis, Notion, facial recognition, AI/NLP, and JWT. It also identifies `POST /api/applications` as the future application endpoint. The backend therefore exposes those contracts while keeping provider secrets server-side.

The frontend's current AI placeholder should call `POST /api/ai/chat` instead of calling an AI provider directly.

## HMAC note

A browser must not contain `HMAC_SECRET`. HMAC is intended for trusted device/service telemetry. Browser-facing routes use HTTPS + JWT. Signed telemetry uses `X-CampusFlow-Signature` over the exact raw HTTP body.
