# CampusFlow AI

### Next-Generation Smart Campus Workflow Automation Platform

> **Detect. Decide. Approve. Automate.**

CampusFlow AI is a smart campus workflow automation platform designed to modernize legacy academic management systems through AI-assisted detection, biometric verification, workflow automation, human approval, security controls, and auditability.

---

## ⚠️ DEMO / PROTOTYPE STATUS

**This repository currently contains a functional frontend prototype/demo.**

The current version is intentionally designed to demonstrate the complete CampusFlow AI workflow and user experience without requiring production backend infrastructure.

Several backend-heavy components are currently **simulated in the browser**. This is intentional for the prototype stage.

The demo demonstrates:

```text
Campus Event
     ↓
AI Detection
     ↓
Analysis
     ↓
Security Validation
     ↓
Human Approval
     ↓
Automated Action
     ↓
Audit Trail
```

The production implementation will replace these simulations with real backend services, databases, AI models, authentication, encryption, and integrations.

---

## 🚀 Current Demo Features

- Smart Campus Dashboard
- AI workflow visualization
- Facial attendance workflow
- Liveness / anti-spoofing simulation
- 128-dimensional face embedding simulation
- Vector similarity search simulation
- Academic risk detection
- Application tracking
- Human approval workflow
- Notion-style Action Queue
- Security monitoring
- JWT/RBAC security simulation
- HMAC verification simulation
- Rate-limiting / brute-force simulation
- AI Campus Assistant
- Structured JSON-based AI response architecture
- System activity / audit visualization

---

## 🧠 Core Concept

### Traditional Campus System

```text
Input
  ↓
Database
  ↓
Manual Review
  ↓
Display
```

### CampusFlow AI

```text
Detect
  ↓
Analyze
  ↓
Recommend
  ↓
Human Approval
  ↓
Execute
  ↓
Audit
```

CampusFlow AI follows a **controlled AI autonomy** model: AI can detect issues and recommend actions, while sensitive decisions remain under authorized human control.

---

## 🏗️ Current Architecture

The current demo runs entirely in the browser.

```text
┌───────────────────────────────────────┐
│            CampusFlow AI              │
│                                       │
│          Vanilla HTML/CSS/JS          │
└───────────────────┬───────────────────┘
                    │
                    ▼
          ┌───────────────────┐
          │   Demo AI Engine  │
          │                   │
          │ JSON Responses    │
          │ Demo NLP Logic    │
          │ Workflow Logic    │
          └─────────┬─────────┘
                    │
       ┌────────────┼─────────────┐
       ▼            ▼             ▼
   Attendance     Risk        Applications
       │            │             │
       └────────────┼─────────────┘
                    ▼
             Action Queue
                    │
                    ▼
             Human Approval
                    │
                    ▼
               Audit Log
```

---

## 💻 Technology Stack — Current Demo

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | UI, animations and responsive design |
| JavaScript ES6+ | Application logic |
| Browser APIs | Client-side interaction |
| Fetch API | AI API integration interface |
| Local JavaScript state | Demo data |
| JSON | Structured AI responses |

### No framework required

The current demo does **not** use:

- React
- Vue
- Angular
- Tailwind
- Vite
- Webpack
- Build tools

The application can be launched directly by opening:

```text
index.html
```

in a modern browser.

---

## 📁 Project Structure

```text
CampusFlow-AI/
│
├── index.html
├── style.css
├── app.js
└── README.md
```

---

# 🤖 AI Integration

The application is designed so that the AI layer can be replaced without rebuilding the frontend.

The JavaScript contains an AI integration interface using `fetch()`.

The intended architecture is:

```text
Frontend
   ↓
Backend AI Gateway
   ↓
NLP / LLM Model
   ↓
Structured JSON
   ↓
Frontend
```

The AI is instructed to return structured JSON rather than unrestricted text.

Example:

```json
{
  "intent": "risk_analysis",
  "summary": "Several students require academic intervention.",
  "priority": "high",
  "actions": [
    "Review high-risk students",
    "Schedule faculty intervention"
  ],
  "requires_human_approval": true,
  "confidence": 0.94
}
```

This allows the frontend to dynamically interpret AI output.

---

# ⚠️ Why OpenAI Is Not Used Directly in Production

The prototype may contain an API-key placeholder such as:

```javascript
API_KEY: "YOUR_API_KEY_HERE"
```

A real API key **must not be exposed inside browser JavaScript**, because users can inspect frontend code through browser developer tools.

The production architecture should therefore use:

```text
Browser
   ↓
CampusFlow Backend
   ↓
AI Gateway
   ↓
Local / Self-Hosted NLP Model
```

instead of:

```text
Browser
   ↓
OpenAI API
```

---

# 🧠 Planned Local NLP / AI Architecture

The production system is intended to minimize or eliminate dependency on external proprietary AI APIs.

```text
                  CampusFlow AI
                       │
                       ▼
                AI Gateway
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
       Local NLP Model      Rule Engine
              │                 │
              └────────┬────────┘
                       ▼
                 JSON Output
```

Potential future model options include:

- Llama-family models
- Mistral-family models
- Qwen-family models
- Other suitable open-weight NLP/LLM models

Possible infrastructure can include local model runners such as Ollama or llama.cpp, depending on deployment requirements and available hardware.

The exact model will be selected after testing accuracy, latency, memory requirements, and hardware constraints.

---

# 🔍 AI Responsibilities

The planned AI layer can support:

### 1. Intent Detection

Example:

> "Which students are at risk?"

```text
intent = risk_analysis
```

### 2. Academic Risk Analysis

```text
Attendance
+
Marks
+
Historical Performance
        ↓
Risk Level
+
Reason
+
Recommended Intervention
```

### 3. Application Classification

Applications can be classified into categories such as:

- Leave Request
- Scholarship
- Internship Permission
- Hostel
- Transport
- Academic Issue
- Student Support

### 4. Recommendation Generation

AI generates recommendations but does not automatically perform sensitive actions.

```text
AI Recommendation
       ↓
Human Approval
       ↓
Action
```

---

# 👤 Human-in-the-Loop Architecture

Sensitive decisions follow:

```text
AI Detection
     ↓
AI Recommendation
     ↓
Notion Action Queue
     ↓
HOD / Authorized Faculty
     ↓
Approve / Reject
     ↓
Backend Execution
     ↓
Audit Log
```

This provides a human control layer for important administrative decisions.

---

# 📸 Facial Attendance

The prototype demonstrates the intended biometric workflow:

```text
Camera
  ↓
Face Detection
  ↓
Liveness Check
  ↓
Depth Analysis
  ↓
Blink Detection
  ↓
Embedding Extraction
  ↓
128D Vector
  ↓
Vector Search
  ↓
Identity Match
  ↓
Attendance
```

### Privacy Principle

The intended production system should avoid retaining unnecessary raw facial images.

The target approach is:

```text
Face
 ↓
Embedding
 ↓
Encrypted Vector
 ↓
Secure Storage
```

Raw images should be discarded according to the final system's privacy policy and retention requirements.

---

# 🛡️ Anti-Spoofing

The production biometric system is intended to evaluate signals such as:

- Eye blinking
- Micro-movements
- Depth information
- Facial motion
- Presentation-attack indicators

The current browser implementation **simulates these checks for demonstration purposes**.

---

# 🔐 Security Architecture

The target production architecture includes:

```text
AES-256
+
HMAC-SHA256
+
TLS
+
Secure Token Storage
+
Rate Limiting
+
RBAC
```

### HMAC Request Signing

```text
Request
   ↓
HMAC Signature
   ↓
Backend Verification
   ↓
Accept / Reject
```

### Rate Limiting

The backend should enforce request limits to mitigate:

- Brute-force attempts
- Automated scraping
- Credential abuse
- API flooding

The current Security Console demonstrates this behavior visually.

---

# 🔑 Authentication & RBAC

The production system should use authenticated sessions/tokens with role-based authorization.

Example:

```text
Student
   ↓
Student APIs only

Faculty
   ↓
Faculty APIs

HOD
   ↓
Approval + Administrative APIs

Admin
   ↓
System Administration
```

A student token must never be allowed to access HOD-only endpoints.

---

# 🗄️ Planned Database Architecture

## MongoDB Atlas

Planned use:

- Student profiles
- Attendance records
- Applications
- Encrypted biometric vectors
- Academic records
- Audit logs

### MongoDB Atlas Vector Search

```text
Face Embedding
      ↓
Vector Search
      ↓
Similarity Score
      ↓
Identity Match
```

The current prototype simulates this process.

---

# ⚡ Redis

Redis is intended for low-latency caching.

Potential cached data:

```text
Student Rosters
      ↓
Redis

Notices
      ↓
Redis

User Sessions
      ↓
Redis

Frequently Used Campus Data
      ↓
Redis
```

This reduces unnecessary database reads during high-load campus operations.

---

# 📋 Notion Action Queue

The production architecture can use Notion as the human approval interface.

```text
AI Detection
      ↓
Action Recommendation
      ↓
Notion Database
      ↓
HOD
      ↓
Approve / Reject
      ↓
Backend
      ↓
MongoDB
      ↓
Audit Log
```

This avoids building a separate administrative dashboard during the initial implementation.

The current prototype provides a **Notion-style simulated Action Queue**.

---

# 📊 Academic Risk Radar

CampusFlow can combine:

```text
Attendance
+
Academic Marks
+
Historical Trends
```

to identify students who may require intervention.

Example:

```text
Attendance: 61%
Marks: 54%

Risk: HIGH

Recommendation:
Schedule faculty intervention.
```

The AI recommendation remains subject to human review.

---

# 📱 Application Tracking

The system converts static application processing into a visible workflow:

```text
Submitted
    ↓
Seen
    ↓
Under Review
    ↓
Approved / Rejected
```

This improves operational transparency for students and administrators.

---

# 📈 Scalability Plan

The production architecture is intended to support high-throughput campus environments.

```text
Load Balancer
      ↓
Node.js Cluster
      ↓
Redis
      ↓
MongoDB Atlas
      ↓
AI Processing Layer
```

Future modules can include:

- Library
- Hostel
- Transport
- Scholarships
- Examination
- Events
- Placement
- Student Support

---

# 🚧 Demo vs Production

| Component | Current Demo | Production Target |
|---|---|---|
| Frontend | ✅ Working | ✅ |
| Dashboard | ✅ Working | ✅ |
| Attendance UI | ⚠️ Simulated | Real camera pipeline |
| Liveness | ⚠️ Simulated | Real anti-spoofing model |
| Face Embeddings | ⚠️ Simulated | Real on-device model |
| Vector Search | ⚠️ Simulated | MongoDB Atlas Vector Search |
| Database | ⚠️ Demo state | MongoDB Atlas |
| Redis | ⚠️ Simulated | Redis |
| Notion | ⚠️ Simulated | Notion API |
| Authentication | ⚠️ Simulated | Backend authentication |
| RBAC | ⚠️ Simulated | Backend middleware |
| HMAC | ⚠️ Demonstration | Backend verification |
| Rate Limiting | ⚠️ Simulated | Backend/API gateway |
| AI | ⚠️ Demo/fallback | Self-hosted NLP/LLM |
| Audit Trail | ⚠️ Frontend demo | Persistent backend logs |
| Encryption | ⚠️ Architecture demonstrated | Production implementation |

---

# 🛣️ Roadmap

## Phase 1 — Current: Interactive Prototype

- [x] Dashboard
- [x] Navigation
- [x] Facial attendance simulation
- [x] Liveness simulation
- [x] Vector search simulation
- [x] Academic risk radar
- [x] Application tracker
- [x] Human approval queue
- [x] Security console
- [x] AI assistant
- [x] Structured JSON AI architecture
- [x] System activity visualization

## Phase 2 — Real Backend

Planned:

```text
Node.js
+
Express
+
MongoDB Atlas
+
Redis
```

Implement:

- Authentication
- JWT/session security
- RBAC
- Database persistence
- Audit logging
- Rate limiting
- API validation

## Phase 3 — Real NLP / AI

Replace the browser fallback with:

```text
CampusFlow Backend
        ↓
Local AI Gateway
        ↓
Open-Source NLP / LLM
        ↓
Structured JSON
        ↓
CampusFlow
```

## Phase 4 — Real Facial Recognition

Implement:

```text
Camera
 ↓
Face Detection
 ↓
Liveness
 ↓
Embedding Extraction
 ↓
Encrypted Vector
 ↓
MongoDB Vector Search
 ↓
Attendance
```

## Phase 5 — Real Notion Integration

Connect:

```text
Node.js
   ↕
Notion API
```

Implement:

- Action creation
- Approval status synchronization
- Action execution
- Audit logging

## Phase 6 — Production Security

Implement:

- TLS
- Secure secrets management
- AES-256 encryption where appropriate
- HMAC verification
- Authentication/session security
- RBAC
- Rate limiting
- Input validation
- Security logging
- Database access controls
- Secure deployment

---

# 🎯 Vision

CampusFlow AI is designed to act as an **intelligent workflow automation layer over existing campus infrastructure**.

```text
Legacy Campus Systems
        ↓
   CampusFlow AI
        ↓
 ┌──────┼──────┐
 ↓      ↓      ↓
AI    Security Workflow
 ↓      ↓      ↓
 └──────┼──────┘
        ↓
Human Decision
        ↓
Automated Execution
```

The goal is to make campus operations:

**Smarter. Faster. Safer. More transparent.**

---

# ⚠️ Disclaimer

This project is currently a **functional prototype/demo** created to demonstrate the CampusFlow AI concept and workflow.

Biometric processing, encryption, authentication, vector databases, Redis caching, Notion synchronization, NLP/LLM inference, and backend security controls shown in the interface are not all implemented as production services in the current version.

The prototype should **not be used with real student biometric data, authentication credentials, or real administrative decisions**.

Production deployment requires appropriate security engineering, privacy safeguards, legal/compliance review, infrastructure, testing, and responsible AI evaluation.

---

# 👥 Team

**Team:** NEXTGEN_mind  
**Team ID:** CFB43298C7B7  
**College:** Ajay Kumar Garg Engineering College

### CampusFlow AI

> **Detect. Decide. Approve. Automate.**
