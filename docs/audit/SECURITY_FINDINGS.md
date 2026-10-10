# SIMPLYYTR 2.0 — Security & Safety Forensic Findings

**Date:** 2026-10-09  
**Auditor:** Antigravity (Repository Security Auditor & Lead Systems Architect)  
**Status:** CONFIRMED FORENSIC AUDIT  
**Scope:** Complete repository inspection of `simply1git/simplyytr` (`build/phase-0-forensic-audit`)  

---

## 1. Executive Summary

During the Phase 0 forensic audit, multiple critical and high-severity security vulnerabilities were identified in the legacy codebase. The most severe issues involve the tracking of a real Google Chrome user data profile directly in Git, hardcoded fallback secrets committed to GitHub Actions workflow YAML files, reckless process termination scripts that kill arbitrary developer processes on Windows, and shadow-DOM browser automation designed to bypass official OAuth security perimeters.

All credentials and sensitive identifiers mentioned below have been redacted in accordance with the Security Protocol ([.agent/protocols/SECURITY_PROTOCOL.md](file:///D:/Projects/SIMPLYYTR/.agent/protocols/SECURITY_PROTOCOL.md)).

---

## 2. Security Findings Register

### SEC-001: Committed Genuine Google Chrome User Profile
- **Severity:** `CRITICAL`
- **Status:** `VERIFIED`
- **Affected Path:** [apps/storage/chrome_profile/](file:///D:/Projects/SIMPLYYTR/apps/storage/chrome_profile)
- **Concrete Evidence:**
  Git tracks over 500 files inside `apps/storage/chrome_profile/`, including:
  - `Default/Web Data` & `Default/Web Data-journal` (SQLite databases containing autofill and form profiles)
  - `Default/Local State` (contains encrypted keys and client IDs)
  - `Default/Extensions/` (multiple installed CRX extension directories)
  - `Safe Browsing/`, `ShaderCache/`, `GrShaderCache/`, `optimization_guide_model_store/`
  The root [.gitignore](file:///D:/Projects/SIMPLYYTR/.gitignore#L43) contains `storage/chrome_profile/` instead of `**/chrome_profile/**` or `apps/storage/chrome_profile/`, allowing this folder to be committed into repository history.
- **Potential Impact:**
  Active Google account session tokens, cookies, OAuth refresh states, and browsing history may be exposed to anyone with read access to the GitHub repository.
- **Recommended Mitigation:**
  1. Immediately invalidate all Google sessions and OAuth refresh tokens for accounts associated with this machine/profile.
  2. Remove `apps/storage/chrome_profile` from Git tracking (`git rm -r --cached`).
  3. Update `.gitignore` with `**/chrome_profile/**` and `**/storage/**`.
  4. Perform Git history scrubbing (via `git filter-repo` or BFG Repo-Cleaner) prior to pushing to public remotes.
- **Immediate Action Required:** `YES` (Action required by user: revoke Google sessions; code removal prepared in Phase 1).

---

### SEC-002: Hardcoded Fallback Secrets Committed in GitHub Actions Workflows
- **Severity:** `CRITICAL`
- **Status:** `VERIFIED`
- **Affected Paths:**
  - [.github/workflows/content_pipeline.yml#L22](file:///D:/Projects/SIMPLYYTR/.github/workflows/content_pipeline.yml#L22)
  - [.github/workflows/content_pipeline.yml#L55](file:///D:/Projects/SIMPLYYTR/.github/workflows/content_pipeline.yml#L55)
  - [.github/workflows/render-worker.yml#L41](file:///D:/Projects/SIMPLYYTR/.github/workflows/render-worker.yml#L41)
- **Concrete Evidence:**
  The workflow files contain hardcoded fallback secret values when repository secrets are unset:
  ```yaml
  SECRET_KEY="${{ secrets.PIPELINE_SECRET || '[REDACTED_FALLBACK_TOKEN_2026]' }}"
  ```
  ```yaml
  PIPELINE_SECRET: ${{ secrets.PIPELINE_SECRET || '[REDACTED_FALLBACK_TOKEN_2026]' }}
  ```
  Furthermore, the workflows target a hardcoded external production Vercel deployment URL (`https://simplyytr.vercel.app`) as default fallback.
- **Potential Impact:**
  Any unauthorized party reading the repository can construct valid Authorization Bearer headers to invoke `/api/pipeline/trigger` and `/api/cron/analytics` on deployed endpoints using the fallback secret.
- **Recommended Mitigation:**
  1. Remove all fallback default values from GitHub Actions workflow files.
  2. Fail the workflow immediately if required secrets (`PIPELINE_SECRET`, `VERCEL_API_URL`) are missing.
  3. Rotate any deployed instances using this fallback secret.
- **Immediate Action Required:** `YES`

---

### SEC-003: Destructive Global Process Termination Script
- **Severity:** `HIGH`
- **Status:** `VERIFIED`
- **Affected Path:** [stop_bot.bat#L3-L4](file:///D:/Projects/SIMPLYYTR/stop_bot.bat#L3-L4)
- **Concrete Evidence:**
  The batch script contains the following commands:
  ```bat
  taskkill /F /IM node.exe
  taskkill /F /IM cmd.exe
  ```
- **Potential Impact:**
  Executing `stop_bot.bat` forcefully terminates *every* Node.js and Command Prompt process running on the user's entire Windows operating system. This kills active IDE terminal sessions, unrelated background microservices, build tools, and other developer tools without warning, risking data corruption.
- **Recommended Mitigation:**
  1. Immediately delete or replace `stop_bot.bat` with process-specific PID management.
  2. Implement graceful shutdown handlers using persistent PID files or container lifecycle management (`docker compose down`).
- **Immediate Action Required:** `YES`

---

### SEC-004: Arbitrary Host GUI Process Execution via Unauthenticated HTTP Endpoint
- **Severity:** `HIGH`
- **Status:** `VERIFIED`
- **Affected Path:** [ytdownlod/backend/server.js#L59-L65](file:///D:/Projects/SIMPLYYTR/ytdownlod/backend/server.js#L59-L65)
- **Concrete Evidence:**
  The endpoint `/api/select-directory` spawns a Python Tkinter process directly on the host operating system:
  ```javascript
  app.get('/api/select-directory', (req, res) => {
      const script = `import tkinter as tk\nfrom tkinter import filedialog\nroot = tk.Tk()\nroot.withdraw()\nroot.attributes('-topmost', True)\nprint(filedialog.askdirectory())`;
      const py = spawn('python', ['-c', script]);
      ...
  ```
- **Potential Impact:**
  Any entity capable of reaching this HTTP endpoint (including malicious web pages via local CORS exploitation or DNS rebinding) can trigger blocking GUI dialog windows on the host machine, disrupting the desktop session or leading to denial-of-service.
- **Recommended Mitigation:**
  Remove the `ytdownlod` sub-application entirely from the SIMPLYYTR repository as part of Phase 1 cleanup.
- **Immediate Action Required:** `NO` (Isolated legacy sub-app; will be deleted in Phase 1).

---

### SEC-005: Stealth Browser Automation & YouTube Studio Session Hijacking
- **Severity:** `HIGH`
- **Status:** `VERIFIED`
- **Affected Paths:**
  - [apps/uploader-agent/index.js](file:///D:/Projects/SIMPLYYTR/apps/uploader-agent/index.js) (748 LOC)
  - [login_youtube.bat](file:///D:/Projects/SIMPLYYTR/login_youtube.bat)
  - [manual_login.bat](file:///D:/Projects/SIMPLYYTR/manual_login.bat)
- **Concrete Evidence:**
  The uploader agent bypasses official Google OAuth APIs by launching Puppeteer with `puppeteer-extra-plugin-stealth` against Chrome profile directories and traversing YouTube Studio's internal Polymer shadow DOM (`ytcp-video-permalink`, `ytcp-uploads-dialog`). Batch files prompt the user to log in manually via Chrome flags to create persistent session cookies on disk.
- **Potential Impact:**
  1. Direct violation of YouTube Terms of Service regarding automated use of YouTube Studio.
  2. Immediate risk of permanent YouTube channel termination or Google account suspension upon bot detection.
  3. High fragility: any minor UI update to YouTube Studio breaks the entire publishing pipeline.
- **Recommended Mitigation:**
  1. Abandon stealth browser automation as an architectural publishing mechanism.
  2. Implement official YouTube Data API v3 resumable video uploads using standard OAuth 2.0 authorization codes and granular scopes (`youtube.upload`).
- **Immediate Action Required:** `NO` (Architectural direction; governed by 2.0 spec).

---

### SEC-006: In-Memory Volatile Token Storage
- **Severity:** `MEDIUM`
- **Status:** `VERIFIED`
- **Affected Path:** [apps/backend/src/routes/publish.ts#L43-L47](file:///D:/Projects/SIMPLYYTR/apps/backend/src/routes/publish.ts#L43-L47)
- **Concrete Evidence:**
  OAuth tokens are held in an in-memory variable `let globalTokens: any = null;` and returned via `getGlobalTokens()`.
- **Potential Impact:**
  Tokens are lost on every process restart, forcing repeated manual re-authentication or silent fallback to simulated mock IDs. If exposed via debugging endpoints, raw token structures could be leaked.
- **Recommended Mitigation:**
  Store encrypted refresh tokens in PostgreSQL using AES-GCM-256 with key management tied to an environment secret (`TOKEN_ENCRYPTION_KEY`). Never expose raw tokens in API responses.
- **Immediate Action Required:** `NO` (Addressed in Phase 1 database models).

---

### SEC-007: Plaintext Client Secret File Dependency
- **Severity:** `MEDIUM`
- **Status:** `VERIFIED`
- **Affected Path:** [apps/backend/src/routes/publish.ts#L14-L26](file:///D:/Projects/SIMPLYYTR/apps/backend/src/routes/publish.ts#L14-L26)
- **Concrete Evidence:**
  The code reads `CREDENTIALS_PATH = path.resolve(__dirname, '../../client_secret.json')` synchronously using `fs.readFileSync`. `docker-compose.yml` mounts this file directly.
- **Potential Impact:**
  Developers risk accidentally committing `client_secret.json` to Git if downloaded directly into `apps/backend/`. (Although listed in `.gitignore`, file-based secrets frequently slip into commits).
- **Recommended Mitigation:**
  Transition to standard environment variable configuration (`YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`) managed via `.env` and Docker secrets, eliminating loose JSON secret files on disk.
- **Immediate Action Required:** `NO` (Addressed in Phase 1 configuration architecture).

---

### SEC-008: Dynamic Remote Code & Checkpoint Downloading at Runtime
- **Severity:** `MEDIUM`
- **Status:** `VERIFIED`
- **Affected Paths:**
  - [kaggle-worker/video_generator.py#L18](file:///D:/Projects/SIMPLYYTR/kaggle-worker/video_generator.py#L18)
  - [kaggle-worker/avatar_generator.py#L12](file:///D:/Projects/SIMPLYYTR/kaggle-worker/avatar_generator.py#L12)
  - [kaggle-worker/voice_cloner.py#L13-L23](file:///D:/Projects/SIMPLYYTR/kaggle-worker/voice_cloner.py#L13-L23)
- **Concrete Evidence:**
  Worker scripts run `git clone https://github.com/OpenTalker/SadTalker.git`, `git clone https://github.com/myshell-ai/OpenVoice.git`, and download unpinned checkpoint zip files from arbitrary S3 buckets (`https://myshell-public-repo-hosting.s3.amazonaws.com/...`) and unverified shell scripts (`scripts/download_models.sh`) during execution.
- **Potential Impact:**
  Supply chain vulnerability: Any upstream compromise, branch modification, or DNS hijack of these third-party repositories or buckets results in arbitrary code execution inside the worker environment.
- **Recommended Mitigation:**
  1. Pin all dependency versions in container images.
  2. Verify SHA256 checksums on all pre-trained weights prior to loading.
  3. Pre-bake approved dependencies and models into Docker container images rather than executing dynamic git clones during job runs.
- **Immediate Action Required:** `NO` (Addressed in Phase 2 Compute Fabric).

---

### SEC-009: Unauthenticated Public API Exposure in Pipeline Routes
- **Severity:** `MEDIUM`
- **Status:** `VERIFIED`
- **Affected Path:** [apps/web/src/app/api/pipeline/](file:///D:/Projects/SIMPLYYTR/apps/web/src/app/api/pipeline/)
- **Concrete Evidence:**
  Several endpoints (such as [pipeline/logs/route.ts](file:///D:/Projects/SIMPLYYTR/apps/web/src/app/api/pipeline/logs/route.ts) and [settings/route.ts](file:///D:/Projects/SIMPLYYTR/apps/web/src/app/api/settings/route.ts)) lack authentication middleware, allowing any unauthenticated client on the network to view system telemetry logs, change settings, or trigger pipeline execution.
- **Potential Impact:**
  Information disclosure and unauthorized resource consumption on public hosting environments (e.g. Vercel).
- **Recommended Mitigation:**
  Implement consistent API authentication middleware (Bearer token or session cookie validation) across all API routes in Phase 1.
- **Immediate Action Required:** `NO` (Addressed in Phase 1 API design).

---

### SEC-010: Hardcoded File Paths in Host Automation Scripts
- **Severity:** `LOW`
- **Status:** `VERIFIED`
- **Affected Path:** [start_bot.vbs#L2](file:///D:/Projects/SIMPLYYTR/start_bot.vbs#L2)
- **Concrete Evidence:**
  `start_bot.vbs` executes `WshShell.Run "cmd.exe /c cd E:\project\youtubbot && npm run dev", 0, False`.
- **Potential Impact:**
  Fails silently or executes code from unrelated directories if an `E:\project\youtubbot` exists on the host machine.
- **Recommended Mitigation:**
  Delete `start_bot.vbs` in Phase 1.
- **Immediate Action Required:** `NO`

---

### SEC-011: Trivial Authentication Bypass via Request Header Spoofing & Hardcoded Fallback Token in Web API Middleware
- **Severity:** `CRITICAL`
- **Status:** `VERIFIED (CONTAINMENT PATCH PREPARED)`
- **Affected Path:** [apps/web/src/app/api/lib/utils.ts#L5-L23](file:///D:/Projects/SIMPLYYTR/apps/web/src/app/api/lib/utils.ts#L5-L23)
- **Concrete Evidence:**
  The centralized authentication middleware `verifyAuth(request: Request)` contains two critical security bypasses:
  ```typescript
  // 1. Allow same-origin browser dashboard requests
  const secFetchSite = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (secFetchSite === 'same-origin') {
    return true;
  }
  if (origin && host && (origin.includes(host) || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('vercel.app'))) {
    return true;
  }

  // 2. Token-based authentication for external worker & GitHub Actions
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  const secret = process.env.PIPELINE_SECRET || '[REDACTED_FALLBACK_TOKEN]';
  return token === secret;
  ```
- **Vulnerability Analysis:**
  1. **Untrusted Header Spoofing (`Sec-Fetch-Site: same-origin`):** Any non-browser HTTP client (curl, Python, Go, Node, or automated attacker tooling) can set the `Sec-Fetch-Site: same-origin` header arbitrarily. When present, `verifyAuth` immediately returns `true`, granting full administrative access to all 11 endpoints protected by `verifyAuth` without providing any credentials.
  2. **Insecure Origin Matching & Suffix Bypass:**
     - Non-browser clients can trivially spoof `Origin: http://localhost` or `Origin: https://127.0.0.1`.
     - Substring matching with `.includes('vercel.app')` permits any third-party app hosted on Vercel (e.g., `https://attacker.vercel.app`) or any domain containing the string (e.g., `https://vercel.app.evil.com`) to bypass authentication.
     - Substring matching with `origin.includes(host)` permits an attacker domain such as `https://host.attacker.com` to pass.
     - **Conceptual Inversion of Origin Security:** `Origin` and `Sec-Fetch-Site` are designed as server-side restrictions against cross-origin browser requests (CSRF defenses). Treating the presence of a specific Origin header as an *authentication grant* fundamentally misunderstands HTTP trust boundaries.
  3. **Hardcoded Fallback Secret Token:**
     If `process.env.PIPELINE_SECRET` is unset, the system defaults to `'[REDACTED_FALLBACK_TOKEN]'`. Any caller supplying this public string passes token validation.
  4. **Timing Attack Vulnerability:**
     Direct string comparison `token === secret` is not constant-time, allowing character-by-character timing measurements.
  5. **Fails Open on Missing Secret:**
     Instead of failing closed with HTTP 500 or 401 when the secret is missing from the environment, the server silently accepts the hardcoded fallback token.
- **Affected Endpoints:**
  - `/api/pipeline/trigger` (Spawns script generation and video render jobs)
  - `/api/pipeline/auto-trigger` (Automated generation loop)
  - `/api/pipeline/worker-job` (Leases render jobs to workers)
  - `/api/pipeline/worker-status` (Updates job processing status)
  - `/api/pipeline/ready-jobs` (Queries ready jobs)
  - `/api/pipeline/webhook` (Receives completion payloads)
  - `/api/pipeline/control` (Pauses, resumes, or stops pipeline execution)
  - `/api/pipeline/clear` (Purges queue tables)
  - `/api/pipeline/complete` (Marks jobs finalized)
  - `/api/pipeline/history` (Queries execution history)
  - `/api/cron/analytics` (Triggers YouTube analytics sync)
- **Mitigation & Containment:**
  1. Patch `verifyAuth()` to remove all header-only authentication shortcuts.
  2. Implement timing-safe constant-time string comparison (`crypto.timingSafeEqual`).
  3. Require explicit authentication credentials (`Authorization: Bearer <token>`, `X-Pipeline-Secret` header, or authenticated session cookie).
  4. Treat Origin and `Sec-Fetch-Site` strictly as supplementary CSRF defenses for cookie/browser sessions, never as standalone authentication.
  5. Fail closed immediately if `PIPELINE_SECRET` is not configured in the server environment.
- **Immediate Action Required:** `YES (CONTAINED LOCALLY)`

---

### SEC-012: Inconsistent Authentication Coverage & Unauthenticated Privileged Endpoints Across Dual Backends
- **Severity:** `HIGH`
- **Status:** `VERIFIED (AUDITED & DOCUMENTED)`
- **Affected Paths:**
  - [apps/backend/src/index.ts](file:///D:/Projects/SIMPLYYTR/apps/backend/src/index.ts) & [apps/backend/src/routes/](file:///D:/Projects/SIMPLYYTR/apps/backend/src/routes/) (Express on port 3001)
  - [apps/web/src/app/api/pipeline/publish/route.ts](file:///D:/Projects/SIMPLYYTR/apps/web/src/app/api/pipeline/publish/route.ts)
  - [apps/web/src/app/api/pipeline/trend-jack/route.ts](file:///D:/Projects/SIMPLYYTR/apps/web/src/app/api/pipeline/trend-jack/route.ts)
  - [apps/web/src/app/api/pipeline/jobs/route.ts](file:///D:/Projects/SIMPLYYTR/apps/web/src/app/api/pipeline/jobs/route.ts)
  - [apps/web/src/app/api/pipeline/logs/route.ts](file:///D:/Projects/SIMPLYYTR/apps/web/src/app/api/pipeline/logs/route.ts)
  - [apps/web/src/app/api/settings/route.ts](file:///D:/Projects/SIMPLYYTR/apps/web/src/app/api/settings/route.ts)
- **Concrete Evidence:**
  1. **Express Backend Zero-Auth:** The Express backend on port 3001 mounts `/api/trends`, `/api/briefs`, `/api/publish`, and `/api/settings` without any authentication middleware. Anyone on the network can trigger YouTube video publishing (`POST /api/publish/youtube`), access OAuth flows (`GET /api/publish/auth`), scrape YouTube (`POST /api/trends/scrape`), and modify settings.
  2. **Next.js Unauthenticated Routes:** In `apps/web/src/app/api`, while 11 routes use `verifyAuth()`, several critical privileged endpoints bypass it completely:
     - `POST /api/pipeline/publish` (Publishes videos to YouTube shorts via uploader agent)
     - `POST /api/pipeline/trend-jack` (Triggers Groq LLM generations and queue jobs)
     - `GET /api/pipeline/jobs` (Exposes all prompt data, video assets, and job records)
     - `GET /api/settings` and `POST /api/settings` (Modifies system niche, API keys, and autoPilot)
- **Vulnerability Analysis:**
  The legacy system was split across two independent backend implementations with completely divergent security perimeters. An attacker unable to authenticate to `/api/pipeline/trigger` on Next.js could still invoke publishing on `/api/pipeline/publish` or bypass Next.js entirely by hitting the Express server on port 3001.
- **Recommended Mitigation:**
  Phase 1 architecture replaces both fragmented backends with a unified Python FastAPI modular monolith (`apps/core`) enforcing a single, consistent authentication dependency (`Depends(verify_auth)`) across all privileged routes.
- **Immediate Action Required:** `NO (ARCHITECTURAL REMEDIATION IN PHASE 1)`


