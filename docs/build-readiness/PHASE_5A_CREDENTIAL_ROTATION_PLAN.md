# SIMPLYYTR 2.0 — Phase 5A: Credential Exposure Audit and Rotation Plan

**Document:** `docs/build-readiness/PHASE_5A_CREDENTIAL_ROTATION_PLAN.md`  
**Date:** 2026-10-15  
**Auditor:** Antigravity (Repository Security Auditor & Lead Systems Architect)  
**Status:** **ROTATION PLAN ESTABLISHED — ALL PROVIDER-SIDE ACTIONS UNVERIFIED**  
**Execution Mode:** STRICTLY EVIDENCE-BASED AUDIT — ZERO NETWORK ROTATION, ZERO PRODUCTION MUTATION, ZERO COMMITS  

---

## 1. Executive Summary & Purpose

Phase 5A establishes an evidence-based credential exposure inventory and prioritized rotation plan for SIMPLYYTR 2.0 prior to release.

In accordance with strict safety constraints:
1. **Zero Secret Exposure:** No credential values, tokens, hashes, or `.env` contents are printed, logged, or recorded in this document.
2. **Factual Separation:** Repository-side code sanitization is verified locally; all provider-side rotations remain explicitly **`UNVERIFIED`** until independently confirmed by the repository owner.
3. **Fail-Closed Operation:** Online publishing remains disabled (`autoPublishOnline=false`), and legacy scraper queues remain isolated (`ENABLE_LEGACY_SCRAPER_PIPELINE="false"`).
4. **Non-Destructive Posture:** No live credentials have been revoked, modified, or overwritten automatically.

---

## 2. Credential Exposure Inventory

The inventory classifies every system integration credential across five objective dimensions:
- **Confirmed historical exposure:** Present in historical Git commits or unscrubbed packfiles prior to sanitization.
- **Suspected exposure requiring investigation:** Credential was configured during development or passed through CI/CD environments.
- **Current local configuration presence:** Environment variable exists in `.env` or local configuration for development.
- **Provider-side rotation status:** Current status on provider's cloud dashboard (`UNVERIFIED` / Pending owner execution).
- **Post-rotation verification:** Validation of functional authentication using newly issued credentials.

### Comprehensive Credential Register

| Credential Name | Provider | Primary Purpose | Severity | Historical Git Exposure | Current Local Presence | Provider Rotation Status | Post-Rotation Verification |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Google Chrome Profile & Cookies** | Google | Legacy browser automation session | `CRITICAL` | **Confirmed** (623 files committed in `0daf3ae`) | Ignored via `.gitignore` | **UNVERIFIED** (User reported session sign-out; unverified) | Pending |
| **OAuth Client Secret (`client_secret.json`)** | Google Cloud | YouTube Data API v3 video upload | `CRITICAL` | **Confirmed** (Committed in `0daf3ae`, removed in `9140566`, persisted in packfiles) | Ignored via `.gitignore` | **UNVERIFIED** (Pending regeneration in Google Cloud Console) | Pending |
| **`PIPELINE_SECRET`** | Internal | Server-to-server worker & media HMAC auth | `CRITICAL` | **Confirmed** (Fallback token committed to workflows and code) | Configured in `.env` | **UNVERIFIED** (Pending new 32+ byte key generation and deployment) | Pending |
| **GitHub PAT (`GITHUB_PAT`)** | GitHub | Workflow dispatch for headless workers | `HIGH` | Not found in code | Configured in `.env` | **UNVERIFIED** (Pending regeneration in GitHub Developer Settings) | Pending |
| **Cloudflare R2 Keys (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`)** | Cloudflare | S3-compatible cloud storage for videos | `HIGH` | Not found in code | Configured in `.env` | **UNVERIFIED** (Pending rotation in Cloudflare Dashboard) | Pending |
| **Database URL (`DATABASE_URL`)** | Supabase / PostgreSQL | Primary relational data store | `HIGH` | Not found in code (example URI in `.env.example`) | Configured in `.env` | **UNVERIFIED** (Pending password reset in Supabase Console) | Pending |
| **Groq API Key (`GROQ_API_KEY`)** | Groq Cloud | LLM topic script generation | `MEDIUM` | Not found in code | Configured in `.env` | **UNVERIFIED** (Pending regeneration in Groq Console) | Pending |
| **Google Gemini Key (`GEMINI_API_KEY`)** | Google AI Studio | Analytics feedback & trend evaluation | `MEDIUM` | Not found in code | Configured in `.env` | **UNVERIFIED** (Pending regeneration in Google AI Studio) | Pending |
| **Kaggle API Token (`KAGGLE_API_TOKEN`)** | Kaggle | Cloud GPU kernel execution | `MEDIUM` | Not found in code | Configured in `.env` | **UNVERIFIED** (Pending token regeneration on Kaggle) | Pending |
| **Pexels API Key (`PEXELS_API_KEY`)** | Pexels | Stock media asset queries | `LOW` | Not found in code | Configured in `.env` | **UNVERIFIED** (Pending rotation in Pexels Developer Portal) | Pending |
| **ElevenLabs API Key (`ELEVENLABS_API_KEY`)** | ElevenLabs | Legacy TTS narration (unused in 2.0 offline renderer) | `LOW` | Not found in code | Not configured | **UNVERIFIED** (Pending revocation in ElevenLabs Console) | Pending |

---

## 3. Prioritized Rotation Plan

Credentials are prioritized based on administrative privilege, cloud account impact, and publishing capability.

### Priority Tier 1: Critical Administrative & Publishing Credentials

#### 1.1 Google Account Active Sessions & YouTube OAuth Client Secret
- **Provider:** Google LLC / YouTube.
- **Credential Purpose:** Grants direct write access to the YouTube channel for uploading and updating videos.
- **Evidence of Exposure:**
  - `apps/storage/chrome_profile/` containing SQLite cookie jars (`Default/Network/Cookies`) and encrypted master keys was committed to repository history.
  - `apps/backend/client_secret.json` was committed in historical commit `0daf3ae`.
- **Potential Impact:** Unauthorized parties with access to historical commit objects could impersonate the channel owner, publish arbitrary videos, or hijack the YouTube channel.
- **Official Revocation / Rotation Procedure:**
  1. Navigate to Google Account Device Activity: [https://myaccount.google.com/device-activity](https://myaccount.google.com/device-activity).
  2. Click **"Sign out of all sessions"** for all unrecognized or previous desktop/bot sessions.
  3. Navigate to Google Cloud Console Credentials: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials).
  4. Select the SIMPLYYTR project, locate the OAuth 2.0 Client ID used for YouTube uploading, and click **Delete** or **Reset Secret**.
  5. Create a new OAuth 2.0 Client ID (Type: Web Application) with authorized redirect URI `http://localhost:3001/api/publish/oauth2callback`.
  6. Download the new client configuration or record `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`.
- **Application Interruption:** Online publishing will fail until re-authentication is performed. Local video generation and rendering are unaffected.
- **Safe Replacement Procedure:** Place the new configuration strictly in local `.env` as `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET`. Never commit `client_secret.json`.
- **Post-Rotation Verification:** Run OAuth consent flow on local port 3001 in dry-run mode (`autoPublishOnline=false`). Verify successful token issuance without publishing live videos.
- **Rollback Plan:** If generation fails, delete the newly created OAuth client in Google Cloud Console and generate a fresh client. Do NOT restore or re-enable the deleted historical client.
- **Owner Action Status:** **`UNVERIFIED`** (Awaiting owner execution in Google Cloud Console).

#### 1.2 Pipeline Secret (`PIPELINE_SECRET`)
- **Provider:** Internal SIMPLYYTR Security Architecture.
- **Credential Purpose:** Governs server-to-server worker job leasing (`/api/pipeline/worker-job`), webhook callbacks (`/api/pipeline/webhook`), administrative control (`/api/pipeline/control`), and HMAC-SHA256 signing of local media playback URLs (`/api/media/[filename]`).
- **Evidence of Exposure:** Historical default token strings (`[REDACTED_FALLBACK_TOKEN_2026]`) were committed to workflow YAML files and web API middleware.
- **Potential Impact:** Possession of the secret allows unauthenticated network clients to claim render jobs, inject rogue webhook completion payloads, or generate valid media streaming tokens.
- **Official Generation / Rotation Procedure:**
  1. Generate a new cryptographically random 32-byte hex secret on the local host:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
  2. Update GitHub Actions Secrets: Repository Settings > Secrets and variables > Actions > Update `PIPELINE_SECRET`.
  3. Update Vercel Environment Variables: Project Settings > Environment Variables > Update `PIPELINE_SECRET` for Production and Preview.
  4. Update local development `.env`: Set `PIPELINE_SECRET="<new_hex_string>"`.
- **Application Interruption:** Temporary (1–2 minutes) while environment variables reload. Active worker nodes with mismatched tokens will be rejected with HTTP 401 until updated.
- **Safe Replacement Procedure:** Deploy the new secret to Vercel and GitHub Actions simultaneously, then restart any local worker scripts.
- **Post-Rotation Verification:** Execute `npm test` and verify that `tests/security/auth_verification.test.js` and `tests/pipeline/phase4a_workflow.test.mjs` pass.
- **Rollback Plan:** If deployment fails, generate a second fresh random secret. Never revert to the historical fallback token.
- **Owner Action Status:** **`UNVERIFIED`** (Awaiting owner generation and deployment).

#### 1.3 GitHub Personal Access Token (`GITHUB_PAT` / `GITHUB_TOKEN`)
- **Provider:** GitHub Inc.
- **Credential Purpose:** Allows the Vercel web API to dispatch workflow triggers (`trigger-kaggle.yml`, `render-worker.yml`) via GitHub Actions REST API.
- **Evidence of Exposure:** High-confidence precaution. Token existed in deployment environments.
- **Potential Impact:** Abuse could consume GitHub Actions runner minutes or trigger unauthorized workflow dispatches.
- **Official Rotation Procedure:**
  1. Navigate to GitHub Personal Access Tokens: [https://github.com/settings/tokens](https://github.com/settings/tokens).
  2. Locate the token used for SIMPLYYTR automation and click **Delete / Revoke**.
  3. Generate a new Fine-Grained Personal Access Token scoped strictly to repository `simply1git/simplyytr` with permissions: `Actions: Read and write`.
  4. Update Vercel environment variable `GITHUB_PAT`.
- **Application Interruption:** Automated workflow triggering from the web UI will be paused until the token is updated.
- **Post-Rotation Verification:** Dispatch a test workflow via GitHub UI or verify via dry-run API query.
- **Owner Action Status:** **`UNVERIFIED`**.

---

### Priority Tier 2: Storage & Compute Fabric Credentials

#### 2.1 Cloudflare R2 Storage Keys (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`)
- **Provider:** Cloudflare, Inc.
- **Credential Purpose:** Authenticates S3-compatible API operations to upload rendered video MP4s and thumbnails to Cloudflare R2 bucket.
- **Evidence of Exposure:** Suspected exposure precaution. Configured in CI/CD workflow and local development environments.
- **Potential Impact:** Unauthorized upload, deletion, or bandwidth consumption within the R2 bucket.
- **Official Rotation Procedure:**
  1. Log into Cloudflare Dashboard: [https://dash.cloudflare.com](https://dash.cloudflare.com) > R2 > Manage R2 API Tokens.
  2. Locate the existing SIMPLYYTR API token and click **Revoke**.
  3. Create a new API token with **Object Read & Write** permissions scoped strictly to the `youtubbot-assets` bucket.
  4. Record the new `Access Key ID` and `Secret Access Key`.
  5. Update GitHub Actions Secrets: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
  6. Update Vercel Environment Variables: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- **Application Interruption:** Workers attempting to upload during token changeover will fail to upload assets. Local rendering pipeline remains operational.
- **Post-Rotation Verification:** Run an S3 `HeadBucket` or test object upload using AWS CLI / SDK against the new credentials.
- **Owner Action Status:** **`UNVERIFIED`**.

#### 2.2 Production Database Password (`DATABASE_URL`)
- **Provider:** Supabase / Cloud PostgreSQL.
- **Credential Purpose:** Authenticates Prisma ORM to manage relational schema, render jobs, and audit logs.
- **Evidence of Exposure:** Precautionary. `.env.example` contains dummy credentials, but real database URLs exist in developer `.env` files.
- **Potential Impact:** Unauthorized reading or tampering with channel configuration, job history, and trend data.
- **Official Rotation Procedure:**
  1. Log into Supabase Console: [https://supabase.com/dashboard](https://supabase.com/dashboard) > Project Settings > Database.
  2. Click **Reset Database Password**.
  3. Generate a strong 32+ character random password.
  4. Copy the new connection string (`DATABASE_URL` and `DIRECT_URL`).
  5. Update Vercel Environment Variables with the new connection strings.
  6. In local development, the embedded PostgreSQL (`scripts/local_db.js`) is isolated and unaffected by cloud database credentials.
- **Application Interruption:** Web API will lose database connectivity for approximately 30 seconds during password reset until Vercel redeploys.
- **Post-Rotation Verification:** Run `npx prisma db execute --stdin` or query `/api/pipeline/jobs` to verify connectivity.
- **Owner Action Status:** **`UNVERIFIED`**.

#### 2.3 Kaggle API Token (`KAGGLE_API_TOKEN`)
- **Provider:** Kaggle (Alphabet Inc.).
- **Credential Purpose:** Pushes notebook code to Kaggle GPU worker kernels.
- **Official Rotation Procedure:**
  1. Log into Kaggle: [https://www.kaggle.com/settings](https://www.kaggle.com/settings).
  2. In the "API" section, click **Expire API Token**.
  3. Click **Create New Token** to download a new `kaggle.json`.
  4. Update GitHub Actions Secret `KAGGLE_API_TOKEN` with the content of the new token.
- **Application Interruption:** Headless Kaggle worker triggers will fail until the GitHub secret is updated.
- **Owner Action Status:** **`UNVERIFIED`**.

---

### Priority Tier 3: Third-Party Generation & Inference API Keys

#### 3.1 Groq Cloud API Key (`GROQ_API_KEY`)
- **Provider:** Groq, Inc.
- **Credential Purpose:** Powers fast Llama-3 LLM script generation.
- **Official Rotation Procedure:**
  1. Log into Groq Console: [https://console.groq.com/keys](https://console.groq.com/keys).
  2. Delete previous API key and create a new key named `simplyytr-2.0-prod`.
  3. Update Vercel and local `.env` with the new key.
- **Post-Rotation Verification:** Trigger a topic generation dry-run or verify via `callGroq` test.
- **Owner Action Status:** **`UNVERIFIED`**.

#### 3.2 Google Gemini API Key (`GEMINI_API_KEY`)
- **Provider:** Google AI Studio.
- **Credential Purpose:** Evaluates audience retention feedback and trend analysis.
- **Official Rotation Procedure:**
  1. Log into Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
  2. Delete previous key and generate a new key.
  3. Update Vercel and local `.env`.
- **Owner Action Status:** **`UNVERIFIED`**.

#### 3.3 Pexels API Key (`PEXELS_API_KEY`)
- **Provider:** Pexels GmbH.
- **Credential Purpose:** Stock B-roll video search queries.
- **Official Rotation Procedure:**
  1. Log into Pexels Developer Portal: [https://www.pexels.com/api/](https://www.pexels.com/api/).
  2. Request a new API key and revoke previous key.
  3. Update GitHub Actions and local `.env`.
- **Owner Action Status:** **`UNVERIFIED`**.

#### 3.4 ElevenLabs API Key (`ELEVENLABS_API_KEY`)
- **Provider:** ElevenLabs Inc.
- **Credential Purpose:** Legacy 1.0 voice synthesis. Unused in SIMPLYYTR 2.0 offline rendering architecture.
- **Official Action:**
  1. Log into ElevenLabs: [https://elevenlabs.io](https://elevenlabs.io) > Profile > API Keys.
  2. Revoke and delete the API key completely. Do not replace, as SIMPLYYTR 2.0 relies on local offline TTS (Windows SAPI, eSpeak NG, Piper).
- **Owner Action Status:** **`UNVERIFIED`**.

---

## 4. Credential Handling Audit

An exhaustive code audit was conducted across all application surfaces to verify that credentials cannot leak through runtime mechanisms:

### 4.1 HTTP Response Inspection
- **`/api/pipeline/worker-job`:** Queries `RenderJob` and returns `{ job: { ...updatedJob }, config: { copy_paste_mode, target_channels, replace_original_audio } }`. The `RenderJob` schema contains only media URLs, content package fields, and status strings. Zero master secrets or environment variables are included in the payload.
- **`/api/pipeline/jobs`:** Enforces an explicit field projection whitelist (`select: { id, status, topic, generatedTitle, videoUrl, thumbnailUrl, ... }`). Signs media URLs using HMAC tokens without exposing `PIPELINE_SECRET`.
- **`/api/settings`:** Restricts returns to `SystemSettings` table. Uses an explicit allowed-keys whitelist; does not return or store API keys.
- **`/api/pipeline/ready-jobs`:** Uses strict field whitelist (`id`, `topic`, `generatedTitle`, `videoUrl`, `thumbnailUrl`).

### 4.2 Logging & Error Handling
- All API catch blocks log sanitized error representations (`console.error(err.message)` or `String(err)`).
- `youtubePublisher.ts` explicitly guards against logging missing tokens.
- `localTts.ts` scrubs control characters and sanitizes text before spawning subprocesses.
- No logging statement prints `process.env` objects, Authorization headers, or bearer tokens.

### 4.3 Client-Side Bundle Inspection
- Next.js exports environment variables to browser bundles **only** if prefixed with `NEXT_PUBLIC_`.
- Full repository scan confirms: **0 instances of `NEXT_PUBLIC_` exist across the entire workspace.**
- `apps/web/src/app/page.tsx` contains **0 references to `process.env`**. Zero server secrets are reachable from the client-side React bundle.

### 4.4 Test Fixtures & Synthetic Mocks
- Security regression tests (`tests/security/auth_verification.test.js`) use synthetic 64-character dummy tokens (`TEST_SERVER_SECRET = 'a'.repeat(64)`).
- Real production credentials are never committed as test fixtures or transmitted to external endpoints during test runs.

### 4.5 Generated Media Artifacts
- Video MP4 files, thumbnails, and ASS subtitle files stored in `storage/processed/` contain audio/video frames and subtitle styling. Zero metadata fields embed API keys or server tokens.
- All media artifacts and SQLite files are strictly blocked from Git staging via root `.gitignore`.

### 4.6 File Tracking & Secret Guard
- Root `.gitignore` explicitly blocks `.env*`, `**/chrome_profile/**`, `client_secret*.json`, `kaggle.json`, and private keys (`*.pem`, `*.key`).
- Automated Credential Guard (`node scripts/verify_no_secrets.js`) inspects staged files and confirms 0 forbidden credential patterns.

---

## 5. Verification Results (Evidence Log)

### Executed Verification Checks

| Check | Tool / Command | Result | Evidence / Details |
| :--- | :--- | :---: | :--- |
| **Credential Guard** | `node scripts/verify_no_secrets.js` | **PASSED** | Exit code 0; 0 forbidden credential patterns staged in Git. |
| **Full Automated Test Suite** | `npm test` | **PASSED** | Exit code 0; 158 tests passed across 7 test suites + 1 full workflow render. |
| **Backend TypeScript Build** | `npm run build --workspace=@youtubbot/backend` | **PASSED** | Exit code 0; clean compilation. |
| **Frontend Next.js Build** | `npm run build --workspace=web` | **PASSED** | Exit code 0; 16 routes compiled successfully. |
| **Git Working Tree Inspection** | `git status --short --branch` | **VERIFIED** | Zero commits, zero pushes, all uncommitted user files preserved. |

### Pending External Checks (Awaiting Operator Execution)
1. Revocation of active Google Chrome sessions in Google Account Security Console.
2. Regeneration of YouTube OAuth 2.0 Client Secret in Google Cloud Console.
3. Generation of new 32+ byte `PIPELINE_SECRET` and synchronization across Vercel, GitHub Secrets, and `.env`.
4. Rotation of Cloudflare R2 API tokens in Cloudflare Dashboard.
5. Regeneration of Groq, Gemini, and Kaggle API keys in respective vendor dashboards.

---

## 6. Audit Verdict & Sign-Off

### Phase 5A Verdict: **`ACCEPTED — READY FOR OWNER ROTATION`**

**Reasoning:**
- The credential exposure inventory is fully established with concrete forensic evidence.
- Every system credential has been assigned an actionable, official provider rotation procedure with clear impact analysis and rollback boundaries.
- Credential handling code has been audited: master secrets are stripped from worker payloads, client bundles contain 0 exposed variables, and logging is verified safe.
- All 158 automated tests, backend build, frontend build, and pre-commit secret scanners pass with exit code 0.
- All provider-side actions remain factually classified as **`UNVERIFIED`** until executed by the human repository owner.

---
*Report completed in accordance with SIMPLYYTR 2.0 Security Protocols. Do not commit, push, or execute provider-side mutations without explicit written owner authorization.*
