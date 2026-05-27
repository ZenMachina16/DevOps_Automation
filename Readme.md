<div align="center">

# ShipIQ

**GitHub App–Powered DevOps Automation Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61dafb.svg)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg)](https://mongodb.com)

*From "it works locally" to production-ready — automatically.*

[Demo](#demo) · [Features](#features) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Security](#security)

</div>

---

## Overview

ShipIQ is a DevOps automation platform built for small-to-mid-sized engineering teams. It integrates through **GitHub Apps** (no Personal Access Tokens) to automatically detect missing DevOps infrastructure, generate production-ready artifacts, and monitor CI/CD workflows in real time.

Instead of spending weeks manually configuring pipelines, teams get Dockerfiles, GitHub Actions workflows, and deployment validation generated and committed — in seconds.

---

## Features

| Capability | Description |
|---|---|
|  **Secure Authentication** | GitHub App–based auth — no PATs required |
|  **Repository Analysis** | Automatically detects missing DevOps components |
|  **Artifact Generation** | Generates Dockerfiles, CI/CD pipelines, test scaffolds |
|  **Failure Classification** | Parses workflow logs and classifies deployment failures |
|  **Intelligent Retry** | Auto-retries recoverable failures via n8n automation |
|  **Real-time Tracking** | Monitors GitHub Actions stages live |
|  **Webhook Lifecycle** | Deployment events driven by GitHub webhooks |
|  **Multi-repo Support** | Organization-level scaling across repositories |
|  **Secret Handling** | SHA-256 credential hashing, no plain-text storage |

---

## Why ShipIQ

Most growing repositories are missing critical production infrastructure:

- Dockerfiles and container configuration
- CI/CD pipelines
- Automated test scaffolding
- Deployment validation
- Environment management
- Monitoring visibility

Setting these up manually requires time and DevOps expertise that many teams don't yet have. ShipIQ eliminates that bottleneck — it analyzes repositories and generates the missing infrastructure automatically, without requiring developers to first master every DevOps tool.

---

## Architecture

```
User ──► OAuth Login ──────────────────► ShipIQ
User ──► Install GitHub App ───────────► ShipIQ
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                       Repository Scan  Gap Detection  Artifact Generation
                                                            │
                              ┌─────────────────────────────┤
                              ▼                             ▼
                         Validation                  Pull Request Creation
                              │
                    GitHub Actions Triggers
                              │
                              ▼
                    Webhooks ──► ShipIQ Classifier
```

### Platform Layers

- **Frontend Dashboard** — React + TypeScript interface for repo management and deployment tracking
- **Authentication Layer** — GitHub OAuth for identity; GitHub Apps for repository access
- **Repository Analysis Engine** — Scans for framework types, Docker support, CI/CD gaps
- **Artifact Generator** — Template-based generation of Dockerfiles, workflows, configs
- **Validation Pipeline** — YAML, Docker, syntax, and dependency checks before commit
- **GitHub Integration Layer** — Branch creation, file commits, PR automation
- **Deployment Tracking Layer** — Real-time Actions monitoring and stage classification
- **Storage Layer** — MongoDB for repository state, run history, and credentials

---

## Authentication Model

ShipIQ intentionally avoids Personal Access Tokens in favor of the GitHub Apps model.

| Mechanism | Purpose |
|---|---|
| GitHub OAuth | User identity verification only |
| GitHub App | Scoped repository access |
| Installation Tokens | Temporary, auto-expiring GitHub API access |
| Webhooks | Deployment lifecycle event delivery |

**Benefits of GitHub Apps over PATs:**

- Per-repo permission scoping
- Short-lived, auto-expiring tokens
- Safer access across multiple repositories
- Organization-level scalability without shared credentials

---

## Repository Analysis

The analysis engine scans each repository to identify missing DevOps components before generating anything.

**Detected signals include:**

- Frontend and backend framework type
- Existing Docker configuration
- GitHub Actions workflow presence
- Test runner configuration
- Deployment readiness indicators
- Documentation gaps
- Environment variable requirements

**Directories excluded from scanning:**

```
node_modules/   dist/   build/   coverage/   logs/
```

---

## Artifact Generation

Once gaps are identified, ShipIQ generates production-ready DevOps artifacts using **deterministic template matching** — not LLM-driven generation.

**Generated artifacts:**

- `Dockerfile` — optimized per detected framework
- GitHub Actions workflows — install, test, build, deploy stages
- Test scaffolding — framework-appropriate test setup
- `README` updates — badges, setup instructions
- Deployment configurations
- Environment variable templates (`.env.example`)

### Performance

Switching from LLM-driven to template-based generation yielded a significant improvement:

```
Before  ~90–120 seconds per repository
After   ~3–4 seconds per repository
```

This approach also improves consistency — the same repository type always produces the same artifact structure.

---

## Validation Pipeline

All generated artifacts pass through a validation pipeline before being committed.

```
Generated Artifacts
        │
        ▼
  YAML Validation
        │
        ▼
  Docker Build Check
        │
        ▼
  Syntax & Dependency Verification
        │
        ▼
  Test Execution
        │
        ▼
  Deployment Validation
        │
    ┌───┴───┐
  PASS     FAIL
    │         │
    ▼         ▼
  Branch   Error
  + PR     Report
```

On success, ShipIQ automatically:
1. Creates a new branch
2. Commits the generated files
3. Opens a pull request for team review

---

## CI/CD Intelligence

ShipIQ monitors GitHub Actions in real time, tracking workflows through logical deployment stages:

```
INSTALL_DEPS → TEST → DOCKER_BUILD → DOCKER_RUN → VERIFY_RUNNING → LOG_SCAN
```

Workflow logs and annotations are parsed to classify each failure automatically.

**Example failure classification output:**

```json
{
  "status": "failure",
  "stage": "DOCKER_RUN",
  "retryable": true
}
```

When a failure is classified as retryable, the intelligent retry system triggers a fresh workflow run automatically via n8n — no manual intervention required.

---

## Security

Security was a first-class design consideration throughout the platform.

- **No PAT-based auth** — GitHub Apps only, with least-privilege scoping
- **Webhook verification** — all incoming events validated before processing
- **Auto-expiring tokens** — installation tokens rotate automatically
- **SHA-256 credential hashing** — secrets never stored in plain text
- **GitHub Environment Secrets** — sensitive values injected at runtime, not hardcoded

---

## Tech Stack

### Frontend
- **React** + **TypeScript**
- **Tailwind CSS**
- **Vite**

### Backend
- **Node.js** + **Express**
- **MongoDB**

### DevOps & Automation
- **GitHub Actions**
- **Docker**
- **n8n** (workflow automation)
- **GitHub Apps**

---

## Results

| Metric | Outcome |
|---|---|
| Artifact generation time | ~90–120s → ~3–4s |
| Artifact consistency | Significantly improved with template-based generation |
| CI/CD monitoring | Fully automated, stage-level visibility |
| Failure classification | Automatic, with retryable detection |
| Multi-repo scaling | Organization-level support without credential sharing |

---

## Roadmap

- [ ] AI-assisted debugging agents for failure root cause analysis
- [ ] Self-healing deployment workflows
- [ ] Kubernetes deployment manifest generation
- [ ] Terraform infrastructure scaffolding
- [ ] Multi-cloud deployment orchestration
- [ ] Predictive CI failure analysis

---

## Demo

> 📹 [Watch the demo](#) *(link coming soon)*

---

## License

[MIT](LICENSE) © ShipIQ
