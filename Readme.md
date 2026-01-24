# 🚀 ShipIQ – GitHub App–Powered DevOps Automation Platform

ShipIQ is a **secure DevOps automation platform** that integrates with GitHub using a **GitHub App (not PATs)** to:

* Scan repositories for CI/CD & DevOps gaps
* Detect Docker, tests, workflows, and env requirements
* Generate missing DevOps files automatically (via n8n)
* Monitor GitHub Actions **live**
* Classify CI failures and trigger intelligent retries

---

## ✨ Key Features

* 🔐 **No Personal Access Tokens (PATs)** — GitHub App only
* 🧠 **Workflow Intelligence** (step-level CI classification)
* ⚙️ **Automated DevOps Generation** (Dockerfile, CI, tests)
* 🔁 **Classifier-driven retries**
* 📦 **Repo-scoped access with auto-expiring tokens**
* 🌐 Works for **users & organizations**

---

## 🏗️ Architecture Overview

```
User → OAuth Login → ShipIQ
User → Install GitHub App
ShipIQ → Installation Token → GitHub API
ShipIQ → Repo Scan → Gap Report
ShipIQ → DevOps Generation → n8n
GitHub Actions → Webhooks → ShipIQ Classifier
```

---

## 🔑 Authentication Model (IMPORTANT)

| Mechanism          | Purpose             |
| ------------------ | ------------------- |
| GitHub OAuth       | User identity only  |
| GitHub App         | Repository access   |
| Installation Token | API calls to GitHub |
| Webhooks           | CI/CD intelligence  |

> OAuth **does NOT** give repo access
> GitHub App **DOES**

---

## 🧩 GitHub App Setup

### 1️⃣ Create GitHub App

**GitHub → Settings → Developer Settings → GitHub Apps → New App**

**Basic Info**

* App Name: `ShipIQ`
* Homepage URL:

  ```
  http://localhost:2000
  ```

**OAuth Callback URL**

```
http://localhost:7000/auth/callback
```

---

### 2️⃣ Repository Permissions (READ ONLY)

| Permission | Level |
| ---------- | ----- |
| Contents   | Read  |
| Metadata   | Read  |
| Actions    | Read  |
| Workflows  | Read  |
| Checks     | Read  |

❗ Write access is **not required**

---

### 3️⃣ Webhook Configuration (CRITICAL)

**Webhook URL**

```
https://<your-domain-or-ngrok>/api/github/webhook
```

**Content type**

```
application/json
```

**Events to Subscribe**

* ✅ workflow_job (**MANDATORY**)
* workflow_run (optional)
* installation_repositories (recommended)

> ⚠️ Without `workflow_job`, CI logs & classifier will NOT work.

---

### 4️⃣ Generate Private Key

* Click **Generate private key**
* Download `.pem`
* Store securely (never commit)

---

## 🌱 Environment Variables

### Backend `.env`

```env
# Server
PORT=7000
SESSION_SECRET=dev_secret

# MongoDB
MONGO_URI=mongodb://localhost:27017/shipiq

# GitHub OAuth
GITHUB_CLIENT_ID=xxxx
GITHUB_CLIENT_SECRET=xxxx

# GitHub App
GITHUB_APP_ID=2580135
GITHUB_PRIVATE_KEY_PATH=./keys/shipiq.pem

# Webhooks
GITHUB_WEBHOOK_SECRET=xxxx

# n8n
N8N_WEBHOOK_URL=https://n8n.yourdomain/webhook/devops
N8N_RETRY_WEBHOOK_URL=https://n8n.yourdomain/webhook/retry
```

---

## ▶️ Running Locally

### Backend

```bash
cd backend
npm install
node index.js
```

Expected logs:

```
ENV CHECK: { GITHUB_CLIENT_ID: 'FOUND', GITHUB_APP_ID: 'FOUND' }
✅ MongoDB connected
✅ Server listening on port 7000
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```
http://localhost:2000
```

---

## 👤 User Onboarding Flow

### 1️⃣ OAuth Login

```
GET /auth/github
```

* Authenticates user
* Identity only (no repo access)

---

### 2️⃣ Install GitHub App

```
GET /auth/github-app/install
```

* User selects repositories
* Installation ID stored in MongoDB
* Repo list fetched using installation token

---

### 3️⃣ Auth Status (Source of Truth)

```
GET /auth/status
```

Response:

```json
{
  "loggedIn": true,
  "hasInstallation": true,
  "installationId": 102540060
}
```

---

## 🔍 Repository Scanning

### Endpoint

```
POST /api/scan
```

### Payload

```json
{
  "repoFullName": "owner/repo"
}
```

### What ShipIQ Detects

* Backend / frontend structure
* Dockerfile presence
* GitHub Actions workflows
* Test configuration
* README
* Environment variables
* CI/CD gaps

---

## 🤖 DevOps File Generation (n8n)

### Endpoint

```
POST /api/generate-files
```

### Payload

```json
{
  "repoFullName": "owner/repo"
}
```

### Flow

1. Scan repository
2. Build canonical context
3. Send payload to n8n
4. Generate DevOps files
5. Return generated artifacts

---

## 🔔 GitHub Webhooks & CI Intelligence

### Webhook Endpoint

```
POST /api/github/webhook
```

### Supported Events

* `workflow_job.in_progress`
* `workflow_job.completed`

---

### 🟡 Live CI Stage Tracking

Maps GitHub workflow steps → ShipIQ stages:

```
INSTALL_DEPS
TEST
DOCKER_BUILD
DOCKER_RUN
LOG_SCAN
```

Displayed in real time during workflow execution.

---

### 🧠 Final CI Classification

After workflow completion, ShipIQ classifies the run:

```json
{
  "status": "failure",
  "stage": "DOCKER_RUN",
  "retryable": true
}
```

---

### 🔁 Intelligent Retry

If:

* CI fails
* Classifier marks retryable

Then ShipIQ triggers:

```
POST → N8N_RETRY_WEBHOOK_URL
```

---

## 🚨 Common Issues & Fixes

### ❌ No CI Logs After Migration

**Cause**

* `workflow_job` event not enabled

**Fix**

* Enable in GitHub App
* Reinstall app

---

### ❌ 404 on Installation Token

**Cause**

* App reinstalled → new installation ID

**Fix**

* Update MongoDB
* Reinstall app after permission changes

---

## 🔐 Security Guarantees

| Feature              | Status |
| -------------------- | ------ |
| No PATs              | ✅      |
| Repo-scoped access   | ✅      |
| Auto-expiring tokens | ✅      |
| Least privilege      | ✅      |
| Webhook verification | ✅      |

---

## 📌 Final Notes

* OAuth ≠ Repository Access
* GitHub App = Single Source of GitHub Permissions
* Webhooks belong to **App**, not individual repos
* Installation tokens are the **only** GitHub API access method

---

## ✅ Status

✔ Production-ready
✔ Scales to org installs
✔ CI intelligence fully automated