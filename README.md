# Devin Security Autopilot

**What if every security vulnerability in your codebase got fixed automatically, with zero engineer time?**

Devin Security Autopilot scans your repositories for real CVEs, creates GitHub issues, and triggers parallel Devin sessions to auto-fix each one — with a real-time Trust Dashboard showing every step.

## The Problem

Apache Superset — one of the most popular open-source BI platforms — has **9 known security vulnerabilities** across its Python and JavaScript dependencies. These include critical issues in **Flask** (the web framework), **PyJWT** (authentication), **Paramiko** (SSH), and **PyArrow** (data processing).

Manually triaging and fixing these would take an engineer **36+ hours**. Most teams let CVEs pile up for months.

## The Solution

```
Security Scan  →  GitHub Issues  →  Devin Sessions  →  Pull Requests
(pip-audit +      (auto-created,     (up to 5 parallel,   (linked to issues,
 npm audit)        severity-labeled)   real-time tracking)   auto-commented)
                                           ↓
                                    Trust Dashboard
                                    (live metrics, cost analysis, timeline)
```

Devin Security Autopilot is an **event-driven pipeline** that:

1. **Scans** your codebase with `pip-audit` and `npm audit` — finding real CVEs with real CVE numbers
2. **Creates** GitHub issues for each vulnerability, labeled by severity
3. **Triggers** parallel Devin sessions to fix each one autonomously
4. **Tracks** everything on a real-time Trust Dashboard with cost analysis and ROI

## Quick Start

### Option 1: Docker (recommended)

```bash
git clone https://github.com/minatoplanb/devin-security-autopilot.git
cd devin-security-autopilot
cp .env.example .env
# Edit .env with your API keys
docker compose up
```

Open **http://localhost:3000** for the Trust Dashboard.

### Option 2: Demo Mode (no API keys needed)

```bash
git clone https://github.com/minatoplanb/devin-security-autopilot.git
cd devin-security-autopilot
npm install
DEMO_MODE=true node src/index.js
```

Open **http://localhost:3000** — watch the dashboard simulate a full pipeline run with real vulnerability data.

### Option 3: Live Mode

```bash
# Set environment variables
export DEVIN_API_KEY=cog_your_key
export DEVIN_ORG_ID=org-your-org-id
export GITHUB_TOKEN=ghp_your_token

node src/index.js

# Trigger the pipeline
curl -X POST http://localhost:3000/api/scan
curl -X POST http://localhost:3000/api/remediate
```

## Trust Dashboard

The dashboard shows:

- **Real-time metrics**: Vulnerabilities found, fixed, in-progress, failed
- **Progress bar**: Animated countdown as vulnerabilities get remediated
- **Vulnerability table**: Severity badges, status, Devin session links, PR links
- **Cost analysis**: ACUs consumed, engineer hours saved, ROI percentage
- **Activity timeline**: Chronological event log of the entire pipeline

## How It Works

### 1. Scanning
The scanner runs `pip-audit` on Python requirements and `npm audit` on JavaScript dependencies. Results are real — every CVE listed is a genuine vulnerability found in Apache Superset's dependency tree.

### 2. Issue Creation
For each vulnerability, a GitHub issue is created with:
- CVE identifier and description
- Affected package and version
- Severity label (critical/high/moderate/low)
- `auto-remediate` label for Devin to pick up

### 3. Devin Orchestration
The orchestrator creates Devin sessions via the v3 API, up to 5 in parallel:
- Each session gets a focused prompt with CVE details and fix instructions
- Sessions are tagged for tracking
- Status is polled every 10 seconds
- On completion, the PR is linked back to the GitHub issue

### 4. Observability
Everything is observable through:
- **Trust Dashboard** (http://localhost:3000)
- **API endpoint** (GET /api/status)
- **Console logs** with colored output
- **Slack notifications** (optional)
- **Auto-generated PowerPoint report**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Full pipeline state + metrics |
| POST | `/api/scan` | Trigger vulnerability scan |
| POST | `/api/remediate` | Start Devin remediation sessions |
| GET | `/api/report` | Report data for PowerPoint generation |

## Real Vulnerabilities Found

| Package | CVE | Severity | Description |
|---------|-----|----------|-------------|
| flask 2.3.3 | CVE-2026-27205 | HIGH | Session cookie Vary header issue |
| pyjwt 2.12.0 | PYSEC-2026-175 | HIGH | JWT validation bypass |
| pyjwt 2.12.0 | PYSEC-2026-176 | HIGH | JWT key reuse attack |
| pyjwt 2.12.0 | PYSEC-2026-177 | HIGH | JWT claim validation bypass |
| pyjwt 2.12.0 | PYSEC-2026-178 | HIGH | JWT header injection |
| pyjwt 2.12.0 | PYSEC-2026-179 | HIGH | JWT timing attack |
| paramiko 3.5.1 | CVE-2026-44405 | MODERATE | SHA-1 RSA signature accepted |
| pyarrow 20.0.0 | PYSEC-2026-113 | HIGH | Use-after-free in C++ IPC |
| eslint-plugin-i18n-strings | GHSA | CRITICAL | Malware package |

## Extending

### CI/CD Integration
Add to your GitHub Actions workflow:
```yaml
on:
  schedule:
    - cron: '0 6 * * 1'  # Every Monday at 6am
  workflow_dispatch:

jobs:
  security-autopilot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up --abort-on-container-exit
        env:
          DEVIN_API_KEY: ${{ secrets.DEVIN_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Multi-Repo Scanning
Configure multiple repositories by extending the scanner to accept a list of repo paths or URLs.

## Tech Stack

- **Server**: Node.js 20 + Express
- **Scanner**: pip-audit (Python) + npm audit (JavaScript)
- **GitHub**: @octokit/rest
- **Devin API**: v3 REST API with session management
- **Dashboard**: Vanilla HTML/CSS/JS (zero dependencies)
- **Report**: pptx-genjs (auto-generated PowerPoint)
- **Docker**: Alpine-based, single container

## Video Demo

[Loom video link — coming soon]

---

## For Interview Candidates

This repo was built as a take-home assignment for the **Devin Deployed Engineer** role at [Cognition](https://cognition.ai). I'm publishing it as a reference for future candidates.

### What the assignment asks
You're given access to the Devin API and asked to build something that demonstrates Devin's capabilities in a real-world workflow. There is no single "correct" answer — it's open-ended. This repo chose **automated security vulnerability remediation** as the use case.

### Time budget
The assignment is designed to be completed in a few days. This implementation took roughly **2 days of focused work** using Claude Code as a pair programmer. Budget time for:
- Understanding the Devin API (v3 REST API — sessions, commands, polling)
- Building something demo-worthy with a visual component (dashboard, report, etc.)
- Writing clear documentation

### Tips
- **Demo mode is key** — Reviewers may not have all the API keys to run your project live. Build a demo mode that showcases the full flow without external dependencies.
- **Show, don't tell** — A real-time dashboard or visual output is more compelling than CLI logs.
- **Real data matters** — Use genuine vulnerabilities/issues, not toy examples.
- **Think about trust** — The role is about deploying Devin to enterprise customers. Show you understand observability, cost tracking, and failure handling.

### Architecture decisions
If you're looking for inspiration, here's why this repo is structured the way it is:
- **Event-driven pipeline** (scan → issues → sessions → PRs) mirrors how enterprises actually adopt AI tooling
- **Trust Dashboard** demonstrates the observability layer that enterprise customers need
- **Cost tracking** (ACU analysis, ROI calculation) speaks the language of engineering managers
- **Parallel session management** shows understanding of the Devin API's concurrency model

Feel free to fork this repo, learn from it, or build something completely different. Good luck.

---

MIT License — Built by [David Hsu](https://github.com/minatoplanb)
