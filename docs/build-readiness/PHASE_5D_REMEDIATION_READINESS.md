# SIMPLYYTR 2.0 — Phase 5D: Release Blocker Remediation and Change Classification

**Document:** `docs/build-readiness/PHASE_5D_REMEDIATION_READINESS.md`  
**Date:** 2026-10-15  
**Auditor / Lead Systems Engineer:** Antigravity  
**Status:** **READY FOR OWNER REVIEW & RELEASE AUTHORIZATION**  
**Working Tree State:** Dirty (Working-tree changes preserved; uncommitted)  
**Baseline Commit:** `b83d88ee997a4b0c948232c3c69591b8ee0c0545`  

---

## 1. Executive Summary

Phase 5D resolves release-readiness questions and classifies all working-tree changes in `D:\Projects\SIMPLYYTR` to prepare an immutable, reviewable Release Candidate (`v2.0.0-rc1`). 

### Core Status:
1. **Local Evaluation Release Candidate:** **`PASS`** (All 159 tests passing, clean TypeScript and Next.js builds, 0 schema drift, 100% database record preservation, 0 secrets staged/leaked).
2. **Production Release Deployment:** **`PENDING HUMAN OWNER ACTIONS`** (Synchronizing `PIPELINE_SECRET` to GitHub Actions and Vercel; verifying external cloud provider dashboards; granting explicit release commit/tag authorization).
3. **Change Classification:** Complete audit of 33 modified tracked files, 25 untracked files/directories, and 15 ignored/local paths.

---

## 2. Working-Tree Change Classification

Every modified, untracked, and ignored file in the workspace has been inspected without modification and categorized according to release disposition.

### Group 1: Intended Application Changes (Include in Release Commit)
These files represent the core SIMPLYYTR 2.0 system enhancements, security boundaries, and architectural fixes developed across Phases 4A–4C.

| File Path | Phase Origin | Purpose / Architectural Description |
| :--- | :---: | :--- |
| `packages/database/prisma/schema.prisma` | Phase 4B/4C.1 | Single Content Contract schema additions (`contentPackage`, `generatorMode`, `reviewStatus`), fail-closed default `autoPublishOnline = false`. |
| `packages/database/prisma/migrations/0_init/migration.sql` | Phase 4C.1 | Deterministic baseline migration for PostgreSQL schema (10 tables, 5 foreign keys, 14 indexes). |
| `packages/database/prisma/migrations/migration_lock.toml` | Phase 4C.1 | Prisma engine lockfile for PostgreSQL provider. |
| `package.json` | Phase 4B/4C | Workspace package scripts (`test`, `test:security`, `test:tts`, `test:phase4b`, `db:start`, `db:stop`) and shared dependencies (`zod`). |
| `package-lock.json` | Phase 4B/4C | Locked dependency tree for reproduction. |
| `.gitignore` | Phase 4A/5 | Tightened security exclusion rules (blocks `.env`, Chrome profiles, SQLite DBs, media, keys/tokens, scratch dirs). |
| `apps/backend/src/index.ts` | Phase 4C.2 | Master clock cron and route mounting guarded behind `isLegacyScraperPipelineEnabled()`. |
| `apps/backend/src/middleware/auth.ts` | Phase 4C.2 | Constant-time `verifyBackendAuth` middleware requiring `PIPELINE_SECRET` for Express publishing routes. |
| `apps/backend/src/queue/legacyGuard.ts` | Phase 4C.2 | Central `isLegacyScraperPipelineEnabled()` fail-closed guard function. |
| `apps/backend/src/queue/editorQueue.ts` | Phase 4C.2 | Fail-closed opt-in guard on legacy video editor queue. |
| `apps/backend/src/queue/ingestQueue.ts` | Phase 4C.2 | Fail-closed opt-in guard on legacy scraper queue. |
| `apps/backend/src/queue/youtubeScraper.ts` | Phase 4C.2 | Fail-closed opt-in guard on YouTube scraper worker. |
| `apps/backend/src/queue/youtubePublisher.ts` | Phase 4C.2 | Guarded publishing with `!settings.autoPublishOnline`; eliminated mock success. |
| `apps/backend/src/routes/publish.ts` | Phase 4C.2 | Secured Express publishing endpoints with `verifyBackendAuth` and legacy guard. |
| `apps/backend/src/routes/settings.ts` | Phase 4C.2 | Guarded legacy settings activation. |
| `apps/backend/src/routes/trends.ts` | Phase 4C.2 | Guarded legacy trend ingestion. |
| `apps/backend/src/services/aiRewriter.ts` | Phase 4B | Topic-grounded script generation; honest fallback when LLM keys are unconfigured. |
| `apps/backend/src/services/localRenderer.ts` | Phase 4C.3 | Cross-platform FFmpeg video rendering engine with dynamic font and binary resolution. |
| `apps/backend/src/services/localTts.ts` | Phase 4C.3 | Unified `ITtsProvider` abstraction supporting Windows SAPI, eSpeak NG, Piper, and edge-tts. |
| `apps/backend/src/services/productRadar.ts` | Phase 4B | Catalog items labeled `LOCAL_SAMPLE_CATALOG` and `SAMPLE_UNVERIFIED`. |
| `apps/backend/src/services/topicPackage.ts` | Phase 4B | Deterministic topic-grounded package builder and validator. |
| `apps/backend/src/services/youtubePublisher.ts` | Phase 4C | Eliminated silent mock success when credentials are unset. |
| `apps/web/src/app/api/lib/adversarialQualityGate.ts` | Phase 4B | Adversarial quality rubric, factual claim linter, evidence grounding check. |
| `apps/web/src/app/api/lib/agenticOrchestrator.ts` | Phase 4B | Grounded pipeline orchestrator enforcing Single Content Contract. |
| `apps/web/src/app/api/lib/aiPipelineEngine.ts` | Phase 4B | Single Content Contract script generation engine with honest demo labeling. |
| `apps/web/src/app/api/lib/complianceProxy.ts` | Phase 4B | Strict FTC disclosure validator and disallowed health/financial claims gate. |
| `apps/web/src/app/api/lib/contentContract.ts` | Phase 4B | Zod validation boundary and types for Single Content Contract. |
| `apps/web/src/app/api/lib/evidenceGraph.ts` | Phase 4B | Evidence grounding graph linking claims to manufacturer articles. |
| `apps/web/src/app/api/lib/mediaAuth.ts` | Phase 4A.2 | HMAC-SHA256 media stream token generator and boundary validator. |
| `apps/web/src/app/api/lib/productRadar.ts` | Phase 4B | Honest sample product catalog with mandatory FTC affiliate disclosures. |
| `apps/web/src/app/api/lib/topicGroundedGenerator.ts` | Phase 4B | Deterministic topic-grounded script generator with verified manufacturer citations. |
| `apps/web/src/app/api/lib/youtubePublisher.ts` | Phase 4C | Eliminated silent mock success in web publishing service. |
| `apps/web/src/app/api/media/[filename]/route.ts` | Phase 4A.2 | Authenticated streaming media endpoint with RFC 9110 byte-range handling. |
| `apps/web/src/app/api/pipeline/control/route.ts` | Phase 4B | Operator approval and retry endpoints with package freezing. |
| `apps/web/src/app/api/pipeline/jobs/route.ts` | Phase 4A.2 | Safe projection whitelist (select); signs HMAC media URLs. |
| `apps/web/src/app/api/pipeline/publish/route.ts` | Phase 4C | Enforced `READY` state guard; fail-closed authorization. |
| `apps/web/src/app/api/pipeline/trigger/route.ts` | Phase 4B | Single Content Contract creation boundary. |
| `apps/web/src/app/api/pipeline/webhook/route.ts` | Phase 4A.2/4B | Authoritative state transition boundary; local file existence and size verification. |
| `apps/web/src/app/api/pipeline/worker-job/route.ts` | Phase 4A.1/4A.2 | Stripped master storage secrets; atomic worker leasing; 30-min stale reaper. |
| `apps/web/src/app/page.tsx` | Phase 4A.2 | Removed process.env references; browser video player with signed HMAC media URL support. |
| `scripts/local_worker.mjs` | Phase 4A | Local worker polling daemon claiming, rendering, and reporting jobs. |

### Group 2: Tests and Verification Scripts (Include in Release Commit)
These files ensure reproducible testability and security regression enforcement.

| File Path | Test Suite / Purpose | Tests Count |
| :--- | :--- | :---: |
| `tests/security/auth_verification.test.js` | Timing attack resilience, fail-closed auth, secret sanitization | 43 |
| `tests/security/remediation_regression.test.mjs` | RFC 9110 range parser, HMAC token scope, worker secret stripping | 17 |
| `tests/security/legacy_scraper_isolation.test.mjs` | Fail-closed legacy scraper isolation across cron, routes, queues | 30 |
| `tests/security/cross_platform_tts.test.mjs` | Cross-platform TTS engine abstraction, text validation, audio headers | 22 |
| `tests/pipeline/pipeline_e2e.test.js` | Worker lease atomicity, concurrency, stale reaper, retry recovery | 23 |
| `tests/pipeline/phase4a_workflow.test.mjs` | Full physical end-to-end video render, audio analysis, streaming | 1 (E2E) |
| `tests/pipeline/phase4b_content_grounding.test.mjs` | Single Content Contract validation, citation verification, FTC text | 23 |
| `tests/audit/phase4a1_acceptance.test.mjs` | Phase 4A.1 verification test suite | 14 |
| `scripts/register_hook.mjs` | Node.js ES module loader hook for executing TypeScript test files | Tool |
| `scripts/resolve_hook.mjs` | Node.js ES module resolver helper | Tool |
| `scripts/local_db.js` | Embedded local PostgreSQL service lifecycle manager | Tool |
| `scripts/sync_env.js` | Cryptographic secret verification and .env synchronization helper | Tool |
| `scripts/exercise_phase4b_e2e.mjs` | Phase 4B pipeline trigger and frame extraction utility | Tool |

### Group 3: Required Documentation (Include in Release Commit)
Durable architectural, audit, and security decision records.

| File Path | Description |
| :--- | :--- |
| `.agent/state/BLOCKERS.md` | Canonical agent memory: active blockers, technical limitations, gate statuses. |
| `.agent/state/CURRENT_STATE.md` | Canonical agent memory: verified commit, phase milestone, metrics. |
| `.agent/state/NEXT_ACTIONS.md` | Canonical agent memory: roadmap, operational commands, next phase runbook. |
| `docs/audit/SECURITY_FINDINGS.md` | Core security findings register and remediation evidence. |
| `docs/audit/GITHUB_HISTORY_REPLACEMENT_RUNBOOK.md` | Git history rewrite and force-push procedure. |
| `docs/build-readiness/DATABASE_MIGRATION_STRATEGY.md` | Database baseline migration runbook and schema drift policy. |
| `docs/build-readiness/PHASE_4A_1_ACCEPTANCE_AUDIT.md` | Phase 4A.1 acceptance audit report. |
| `docs/build-readiness/PHASE_4B_CONTENT_GROUNDING_ACCEPTANCE.md` | Phase 4B topic-grounded content acceptance audit report. |
| `docs/build-readiness/PHASE_4C_INTEGRATION_AUDIT.md` | Phase 4C integration and release-readiness audit report. |
| `docs/build-readiness/PHASE_5A_CREDENTIAL_ROTATION_PLAN.md` | Phase 5A credential inventory and rotation plan. |
| `docs/build-readiness/PHASE_5B_ROTATION_VERIFICATION.md` | Phase 5B rotation verification audit report. |
| `docs/build-readiness/PHASE_5C_RELEASE_CANDIDATE_AUDIT.md` | Phase 5C release candidate audit report. |
| `docs/build-readiness/PHASE_5D_REMEDIATION_READINESS.md` | *This document: change classification & release runbook.* |

### Group 4: Reference / System Specification Kits (Disposition: Commit as Reference Documentation)
| Directory / File | Description | Recommended Disposition |
| :--- | :--- | :--- |
| `SIMPLYYTR_2_0_BUILD_READY_KIT/` | Self-contained kit containing system specification, builder benchmarks, agent adapters (Claude, Cline, Codex, Copilot, Cursor), research reports, and protocols. Contains 0 secrets. | **Include in release commit** as reference design documentation (`docs/spec/` or keep at root). It preserves critical system specifications. |

### Group 5: Potentially Sensitive Files (STRICTLY EXCLUDE FROM RELEASE)
These files contain local credentials, keys, or private configuration. They are already ignored by `.gitignore` and must never be staged or committed.

| File Path | Description | Reason for Exclusion |
| :--- | :--- | :--- |
| `.env` | Local root environment variables | Contains local PostgreSQL URL and local `PIPELINE_SECRET`. Must remain uncommitted. |
| `apps/backend/.env` | Backend local environment variables | Local symlink or copy of `.env`. |
| `apps/web/.env` | Web local environment variables | Local symlink or copy of `.env`. |

### Group 6: Temporary Artifacts, Databases, and Local Binaries (STRICTLY EXCLUDE FROM RELEASE)
These paths contain transient build output, local database clusters, rendered video files, or platform-specific binaries.

| File / Directory Path | Reason for Exclusion |
| :--- | :--- |
| `.local_db_data/` | Local embedded PostgreSQL data cluster. Ignored via `.gitignore`. |
| `scratch/` | Scratch scripts, frame extractions (`scratch/frames_phase4b3/`), backup Git bare repository (`scratch/cleanup/`). Ignored via `.gitignore`. |
| `storage/` | Rendered MP4 videos, thumbnails, and audio files (`storage/processed/`, `storage/temp/`). Ignored via `.gitignore`. |
| `local_tools/` | Local Windows `ffmpeg.exe` binary. Ignored via `.gitignore`. |
| `apps/backend/dist/` | TypeScript compiler build output. Ignored via `.gitignore`. |
| `apps/web/.next/` | Next.js compilation cache and build output. Ignored via `.gitignore`. |
| `apps/web/tsconfig.tsbuildinfo` | TypeScript incremental build cache. Ignored via `.gitignore`. |
| `kaggle-worker/__pycache__/` | Python bytecode cache. Ignored via `.gitignore`. |
| `node_modules/` (all workspaces) | Third-party dependencies. Ignored via `.gitignore`. |

---

## 3. Deployment Configuration Requirements: `PIPELINE_SECRET` Consumer Map

`PIPELINE_SECRET` is the central cryptographic master token securing server-to-server and worker-to-server communication in SIMPLYYTR 2.0.

### 3.1 Exhaustive Consumer Code Path Map

| Consumer Domain | File & Line | Function / Action | Auth Mechanism | Failure Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Web API Gate** | `apps/web/src/app/api/lib/auth.ts`:81 | `verifyWorkerAuth(req)` | `Authorization: Bearer <SECRET>` or `X-Pipeline-Secret` | Fails closed: HTTP 401 Unauthorized |
| **Media Stream Route** | `apps/web/src/app/api/lib/mediaAuth.ts`:21 | `generateMediaAccessToken()` | HMAC-SHA256 signature generator | Throws error if secret unconfigured |
| **Media Stream Route** | `apps/web/src/app/api/lib/mediaAuth.ts`:65 | `verifyMediaRequest(req, filename)` | HMAC-SHA256 token verification or Bearer auth | Fails closed: HTTP 401 Unauthorized |
| **Backend Express API**| `apps/backend/src/middleware/auth.ts`:28 | `verifyBackendAuth(req, res, next)` | `Authorization: Bearer <SECRET>` | Fails closed: HTTP 401 Unauthorized |
| **Local Media Worker** | `scripts/local_worker.mjs`:24 | Polls `/api/pipeline/worker-job`, posts to `/api/pipeline/webhook` | `Authorization: Bearer <SECRET>` | Halts immediately with fatal exit |
| **Kaggle GPU Worker** | `kaggle-worker/video_generator.py`:1020 | Polls worker job, posts status updates, calls `/api/pipeline/history` | `Authorization: Bearer <SECRET>` | Logs CRITICAL error and fails closed |
| **Uploader Agent (Legacy)**| `apps/uploader-agent/index.js`:10 | Queries `/api/pipeline/jobs`, updates status | `Authorization: Bearer <SECRET>` | Fails closed (HTTP 401) |
| **GitHub Actions Worker**| `.github/workflows/render-worker.yml`:39, 48 | Environment variable injection for worker step | Passed via `${{ secrets.PIPELINE_SECRET }}` | Exits with `::error:: Required secret not configured` |
| **GitHub Actions Pipeline**| `.github/workflows/content_pipeline.yml`:22, 65 | Triggers automated pipeline & analytics sync | Passed via `${{ secrets.PIPELINE_SECRET }}` in curl | Exits with `::error:: Required secret not configured` |
| **Verification & E2E** | `scripts/exercise_phase4b_e2e.mjs`:23 | E2E integration test execution | `Authorization: Bearer <SECRET>` | Halts execution if missing |

### 3.2 Deployment Environment Cutover Status

| Deployment Target | Active Consumers | Required Key Name | Status | Operator Cutover Action |
| :--- | :--- | :--- | :---: | :--- |
| **Local Workspace** | Web API, Local Worker, Local DB, Test Suites | `PIPELINE_SECRET` in `.env` | **VERIFIED OPERATIONAL** | Already completed in Phase 5B. 64-character hex key active. |
| **GitHub Actions** | `render-worker.yml`, `content_pipeline.yml` | `PIPELINE_SECRET` in Repo Secrets | **PENDING** | Configure in GitHub Repository Settings. |
| **Vercel** | Web API (`/api/pipeline/*`, `/api/media/*`) | `PIPELINE_SECRET` in Project Env | **PENDING** | Configure in Vercel Project Settings for all environments. |
| **Kaggle (Optional)** | Remote GPU Worker Notebook | `PIPELINE_SECRET` in Kaggle Secrets | **PENDING** | Configure in Kaggle notebook secret manager if Kaggle workers are used. |

---

## 4. Manual Deployment Store Cutover Checklist (For Human Owner)

> [!IMPORTANT]
> The AI agent cannot and will not access external provider dashboards. The human owner must perform these cutover steps manually.

### Step 1: Configure Vercel Project Environment Variables
1. Navigate to your Vercel Dashboard: **https://vercel.com > Your Team > SIMPLYYTR Project**.
2. Go to **Settings > Environment Variables**.
3. Locate `PIPELINE_SECRET` (or click **Add New**).
4. Enter the replacement 64-character (32-byte hex) secret configured in your local `.env`.
5. Select environments: **Production**, **Preview**, **Development**.
6. Click **Save**.
7. If your Vercel project connects to a remote database, ensure `DATABASE_URL` is set to your production PostgreSQL connection string.

### Step 2: Configure GitHub Actions Repository Secrets
1. Navigate to your GitHub Repository: **https://github.com/simply1git/simplyytr**.
2. Go to **Settings > Secrets and variables > Actions**.
3. Under **Repository secrets**, click **New repository secret** (or update existing).
4. Name: `PIPELINE_SECRET`.
5. Secret: Paste the identical 64-character replacement secret.
6. Click **Add secret** / **Update secret**.

### Step 3: Verify Authenticated Remote Telemetry (Post-Cutover)
1. Trigger a test request against the deployed Vercel endpoint:
   ```bash
   curl -I -H "Authorization: Bearer <REPLACEMENT_PIPELINE_SECRET>" https://<your-vercel-app>.vercel.app/api/pipeline/worker-job
   ```
2. Verify that the response is `HTTP 200 OK` (empty job list or candidate job).
3. Confirm that an unauthenticated request fails closed:
   ```bash
   curl -I https://<your-vercel-app>.vercel.app/api/pipeline/worker-job
   # Must return HTTP 401 Unauthorized
   ```

---

## 5. Credential Status and Evidence Register

| Credential Name | Consumers | Active in V2? | Historically Exposed? | Required for RC Release? | Rotation / Revocation Status | Evidence & Verification Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`PIPELINE_SECRET`** | Web API, Backend, Workers, Workflows | **YES** | YES | **YES** | **LOCAL PASS / REMOTE PENDING** | Local `.env` has 64-char key; verified by `verify_replacement_secret.mjs`; GitHub/Vercel cutover pending. |
| **Google Sessions** | Legacy uploader agent | **NO** | YES | **NO** | **REPORTED (UNVERIFIED BY TELEMETRY)** | Owner reported revoking all sessions in Google Account Security Console. Ignored by `.gitignore`. |
| **OAuth Client Secret** | YouTube publisher | **NO** | YES | **NO** | **REPORTED (UNVERIFIED BY TELEMETRY)** | Owner reported deleting Client ID in Google Cloud Console; absent from disk. Publishing disabled (`autoPublishOnline=false`). |
| **Cloudflare R2** | Kaggle worker video storage | Remote only | YES | **NO (LOCAL RC)** / **YES (KAGGLE)** | **UNVERIFIED** | Placeholder in local `.env`. Must be rotated in Cloudflare dashboard if remote GPU workers are used. |
| **Database URL** | Prisma ORM, Web API | **YES** | YES | **YES** | **LOCAL PASS / REMOTE UNVERIFIED** | Local embedded PostgreSQL operates with unique local credentials; Supabase cloud password rotation unverified. |
| **Groq API Key** | AI script generation | Optional | YES | **NO** | **UNVERIFIED** | Deterministic fallback operates offline without key; vendor dashboard rotation unverified. |
| **Gemini API Key** | Analytics / LLM tracker | Optional | YES | **NO** | **UNVERIFIED** | Optional feature; vendor dashboard rotation unverified. |
| **Pexels API Key** | Stock B-roll video search | Optional | YES | **NO** | **UNVERIFIED** | Local motion graphics fallback operates offline without key; vendor dashboard rotation unverified. |
| **Kaggle Token** | Remote worker trigger | Dormant | YES | **NO (LOCAL RC)** | **UNVERIFIED** | Unset locally; vendor dashboard rotation unverified. |
| **GitHub PAT** | Repository dispatch trigger| Optional | YES | **NO (LOCAL RC)** | **UNVERIFIED** | Unset locally; vendor dashboard rotation unverified. |
| **ElevenLabs API** | Legacy 1.0 TTS | **NO** | Legacy | **NO** | **NOT APPLICABLE** | Fully eradicated and replaced by `localTts.ts` (Windows SAPI, eSpeak NG, Piper). |

---

## 6. Verification of Release Behavior and Controls

A complete rerun of non-destructive verification checks was executed:

1. **Automated Test Suite (`npm test`):**
   - **Result:** **159 passed, 0 failed (100% pass rate)**.
   - Breakdown:
     - `auth_verification.test.js`: 43 passed.
     - `remediation_regression.test.mjs`: 17 passed.
     - `legacy_scraper_isolation.test.mjs`: 30 passed.
     - `cross_platform_tts.test.mjs`: 22 passed.
     - `pipeline_e2e.test.js`: 23 passed.
     - `phase4a_workflow.test.mjs`: 1 passed (rendered real 39-second MP4, audio mean = -19.7 dB).
     - `phase4b_content_grounding.test.mjs`: 23 passed.
2. **Credential Guard Scanner (`scripts/verify_no_secrets.js`):**
   - **Result:** **PASSED with exit code 0**. Zero prohibited patterns staged or committed.
3. **Backend Compilation (`npm run build --workspace=@youtubbot/backend`):**
   - **Result:** **PASSED with exit code 0** (`tsc` compiles cleanly).
4. **Frontend Next.js Build (`npm run build --workspace=web`):**
   - **Result:** **PASSED with exit code 0** (Next.js 16.2.9 Turbopack compiles 16 static/dynamic routes cleanly).
5. **Publishing and Scraping Safeguards:**
   - `autoPublishOnline = false` confirmed in database schema and runtime settings.
   - `isLegacyScraperPipelineEnabled() = false` confirmed by default across all cron jobs and endpoints.

---

## 7. Remaining Blockers and Verification Criteria

| Blocker ID | Description | Responsible Party | Verification Criteria | Resolution Action |
| :--- | :--- | :--- | :--- | :--- |
| **BLOCKER-1** | `PIPELINE_SECRET` cutover in GitHub Actions Secrets | Human Owner | Secret present in GitHub repository settings | Add `PIPELINE_SECRET` to GitHub Secrets. |
| **BLOCKER-2** | `PIPELINE_SECRET` cutover in Vercel Environment Variables | Human Owner | Secret present in Vercel project settings | Add `PIPELINE_SECRET` to Vercel Environment Variables. |
| **BLOCKER-3** | External Provider Dashboard Credential Audit | Human Owner | Provider dashboards checked for revoked/rotated tokens | Verify or rotate Cloudflare R2, Supabase, Groq, Gemini keys. |
| **BLOCKER-4** | Working Tree Release Commit & Tagging Authorization | Human Owner | Explicit owner command to stage, commit, and tag | Authorize staging of Groups 1–4, commit on `main`, and tag `v2.0.0-rc1`. |

---

## 8. Linux Runtime Smoke-Test Procedure (For Linux / Container Deployments)

If deploying SIMPLYYTR 2.0 to a Linux server or containerized environment, execute the following smoke-test:

### 8.1 Prerequisites
- Ubuntu 22.04 LTS or Debian 12 container/host.
- Install system packages:
  ```bash
  sudo apt-get update && sudo apt-get install -y ffmpeg espeak-ng fonts-dejavu-core fonts-freefont-ttf
  ```

### 8.2 Execution
```bash
# Clone the repository
git clone https://github.com/simply1git/simplyytr.git simplyytr-linux-test
cd simplyytr-linux-test

# Install dependencies
npm ci

# Configure environment with replacement PIPELINE_SECRET
cp .env.example .env
echo "PIPELINE_SECRET=\"<REPLACEMENT_PIPELINE_SECRET>\"" >> .env
echo "TTS_ENGINE=\"ESPEAK_NG\"" >> .env

# Run full test suite
npm test

# Verify local audio synthesis and rendering
node --import ./scripts/register_hook.mjs tests/pipeline/phase4a_workflow.test.mjs
```

### 8.3 Expected Verification Outcome
- `localTts.ts` automatically detects `process.platform === 'linux'` and selects `EspeakNgProvider` (or `PiperProvider`).
- `localRenderer.ts` resolves FFmpeg at `/usr/bin/ffmpeg` and font paths at `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`.
- Video renders cleanly with synchronized subtitles and valid audio stream.

---

## 9. Ordered Release Checklist (Phase 5E Runbook)

Once the human owner has completed the deployment store cutovers and authorized the release:

1. **Step 1: Verify Git Status:**
   - Confirm only Groups 1–4 files are staged; ensure `.env`, `.local_db_data/`, `scratch/`, `storage/`, and `local_tools/` remain unstaged and ignored.
2. **Step 2: Pre-Commit Secret Scan:**
   - Run `node scripts/verify_no_secrets.js` to ensure zero credentials are in the staging area.
3. **Step 3: Create Signed Release Commit on `main`:**
   ```bash
   git add package.json package-lock.json .gitignore packages/ apps/ scripts/ tests/ docs/ SIMPLYYTR_2_0_BUILD_READY_KIT/ .agent/
   git commit -m "feat(release): SIMPLYYTR 2.0 Release Candidate v2.0.0-rc1"
   ```
4. **Step 4: Create Release Candidate Tag:**
   ```bash
   git tag -a v2.0.0-rc1 -m "SIMPLYYTR 2.0 Release Candidate 1"
   ```
5. **Step 5: Push to Origin with Lease Guard:**
   ```bash
   git push origin refs/heads/main --force-with-lease
   git push origin v2.0.0-rc1
   ```

---
*Phase 5D Remediation Readiness Report complete. All non-destructive checks passed. Awaiting explicit owner authorization before any git staging, commit, tag, or push.*
