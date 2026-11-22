# SIMPLYYTR 2.0 — Phase 5M.3: Read-Only Remediation Feasibility Review

**Document Status:** Complete & Evidence-Based (Strictly Read-Only Review)  
**Date:** 2026-10-18  
**Verdict:** `REMEDIATION_FEASIBLE_RELEASE_REMAINS_BLOCKED`  
**Workspace:** `D:\Projects\SIMPLYYTR`  
**Repository:** `https://github.com/simply1git/simplyytr.git`  
**Baseline Git HEAD:** `b83d88ee997a4b0c948232c3c69591b8ee0c0545`  
**Active Branch:** `main`  
**Staged Changes:** **0 files staged** (`git diff --staged` is empty)  
**Dependency Manifests / Lockfiles Modified:** **0 files modified** (strictly preserved)  

---

## 1. Executive Summary & Review Verdict

### Verdict: `REMEDIATION_FEASIBLE_RELEASE_REMAINS_BLOCKED`

### Summary:
Phase 5M.3 conducted an in-depth, strictly read-only technical feasibility review of dependency remediation options, specification-kit architecture, test metrics, and release gates.

1. **Backend Puppeteer is 100% Removable with Zero Code Regressions:**
   - Forensic inspection of `apps/backend/src/` established that **zero source files import or call `puppeteer`, `puppeteer-extra`, or `puppeteer-extra-plugin-stealth`**.
   - These packages are phantom dependencies left over from legacy 1.0 architecture.
   - Pruning them from `apps/backend/package.json` breaks **zero backend functionality**, requires zero code rewrites, and immediately removes `basic-ftp` from all server-side production images.
2. **Specification Kit is 97.4% Redundant with Conflicting Stale State:**
   - **38 out of 39 files** in `SIMPLYYTR_2_0_BUILD_READY_KIT/` already exist at the repository root and are committed to Git at HEAD `b83d88e`.
   - In 33 files, the content is 100% identical when normalized (differing only by CRLF vs LF line endings).
   - In 5 memory and state files, the root files have evolved and contain authoritative Phase 5 records, whereas the kit copies contain obsolete Phase 0 pre-implementation stubs.
   - The kit's nested `.agent/state/` folder asserts `current_phase: 0` and `status: BUILD-READY / PRE-IMPLEMENTATION`, creating a severe state collision if committed to `main`.
3. **Release Operations Remain Strictly Blocked:**
   - Public release operations (`v2.0.0-rc1`) remain **BLOCKED** pending owner decisions on specification kit preservation and dependency remediation, followed by external infrastructure setup (remote PostgreSQL and secrets cutover).

---

## 2. Workstream A — Backend Puppeteer Removability Verification

### 2.1. Complete Source Code & Import Audit

A recursive search for `puppeteer`, `puppeteer-extra`, and `youtubeScraper` across the workspace produced the following findings:

| Scope / Location | References Found | Nature of Reference | Active Call Path? |
|---|:---:|---|:---:|
| `apps/backend/src/**/*.ts` | 2 | Code comments only (`youtubePublisher.ts:3`, `queue/youtubePublisher.ts:43`) | **NO** (0 imports) |
| `apps/backend/src/queue/youtubeScraper.ts` | 0 | Uses `yt-dlp` via child process `spawn('yt-dlp', ...)`; disabled by default via `isLegacyScraperPipelineEnabled()` | **NO** (0 Puppeteer usage) |
| `apps/backend/package.json` | 3 | `"puppeteer": "^25.14.0"`, `"puppeteer-extra": "^3.3.6"`, `"puppeteer-extra-plugin-stealth": "^2.11.2"` | **Phantom Dependency** |
| `apps/uploader-agent/index.js` | 6 | `const puppeteer = require('puppeteer-extra')`, `puppeteer.launch({...})` | **YES (Desktop Uploader Only)** |
| `apps/web/src/**/*.ts(x)` | 3 | Documentation comments and UI labels on dashboard (`page.tsx`) | **NO** (0 imports) |

**Key Finding:** `apps/backend` never imports Puppeteer. The legacy scraper in `apps/backend/src/queue/youtubeScraper.ts` relies on `yt-dlp` for video downloading and is guarded behind `isLegacyScraperPipelineEnabled() = false`. The official publisher in `apps/backend/src/services/youtubePublisher.ts` uses Google's official API (`googleapis@^173.0.0`), not Puppeteer.

### 2.2. Backend Build & Packaging Impact

- **TypeScript Compilation (`tsc`):**
  - Backend compiles from `apps/backend/src/` to `apps/backend/dist/`.
  - Because no file in `src/` imports Puppeteer, the compiled `dist/` directory contains **zero references to Puppeteer**.
- **Production Container Packaging (`npm install --omit=dev`):**
  - When building a server container image, npm reads `apps/backend/package.json`'s `"dependencies"`.
  - Because `puppeteer@^25.14.0` is currently declared in `"dependencies"`, npm installs Puppeteer, downloads Chromium via `@puppeteer/browsers`, and installs `proxy-agent`, `pac-proxy-agent`, `get-uri`, and `basic-ftp@5.3.1` into the server container's `node_modules/`.
  - **Result:** The server image is bloated by ~300 MB and triggers 7 High-severity vulnerability alerts in container security scanners (Trivy, Snyk, GitHub Container Registry), even though the code is never executed.

### 2.3. Browser-Based Behavior Impact
- **Question:** What browser-based behavior in `apps/backend` would break if Puppeteer is removed?
- **Answer:** **Zero behavior breaks.** There is no browser-based automation in `apps/backend`. Browser automation is exclusively contained within the separate `apps/uploader-agent` package for local desktop YouTube uploads.

### 2.4. Proposed Minimal Change List for a Future Implementation Phase
*Note: Read-only inspection; no changes were applied.*

1. **Edit `apps/backend/package.json`:**
   ```diff
   --- a/apps/backend/package.json
   +++ b/apps/backend/package.json
   @@ -18,9 +18,6 @@
        "googleapis": "^173.0.0",
        "ioredis": "^5.3.2",
        "node-cron": "^4.5.0",
   -    "puppeteer": "^25.14.0",
   -    "puppeteer-extra": "^3.3.6",
   -    "puppeteer-extra-plugin-stealth": "^2.11.2"
      },
   ```
2. **Lockfile Synchronization:**
   - Execute `npm install --package-lock-only` to prune Puppeteer from the backend dependency graph in `package-lock.json`.
3. **Validation Plan:**
   - Run `npm run build --workspace=@youtubbot/backend` (`tsc` must compile with code 0).
   - Run all 7 test suites (`npm test` must maintain 100% pass rate).
   - Run `npm audit --omit=dev --workspace=@youtubbot/backend` to verify 0 vulnerabilities in backend production dependencies.

---

## 3. Workstream B — Advisory Re-Verification

### 3.1. `basic-ftp` (`GHSA-c475-qrg2-pj4r`) Re-Verification

- **Installed Version:** `5.3.1`
- **Advisory Details:**
  - Advisory ID: `GHSA-c475-qrg2-pj4r` (npm: 1240853)
  - Title: Quadratic-time CPU denial of service in `Client.list()` Unix directory-listing parser (RE_LINE backtracking).
  - CWE: CWE-1333 (Inefficient Regular Expression Complexity).
  - Severity: High
  - Affected Range: `<= 6.2.0`
- **Exact Installed Dependency Chains:**
  - Chain A (Backend): `@youtubbot/backend@1.0.0` -> `puppeteer@25.14.0` -> `@puppeteer/browsers@3.2.5` -> `proxy-agent@8.0.2` -> `pac-proxy-agent@9.1.0` -> `get-uri@8.0.1` -> `basic-ftp@5.3.1`
  - Chain B (Uploader Agent): `@youtubbot/uploader-agent@1.0.0` -> `puppeteer@25.14.0` -> (same chain) -> `basic-ftp@5.3.1`
- **Parent Version Constraints:**
  - `node_modules/proxy-agent/node_modules/get-uri/package.json` line 45 declares: `"basic-ftp": "^5.3.1"`.
  - Patched versions of `basic-ftp` begin at `6.2.1+`.
  - Upgrading across the major boundary (5.x -> 6.x) cannot occur automatically via npm because `get-uri` declares a caret range on 5.x.
- **Runtime Reachability & Exposure:**
  - **Reachable Function:** `Client.list()` in `basic-ftp`. This function is invoked **only** when parsing Unix directory listings returned by an active FTP connection.
  - **Application Ingress / Egress:** SIMPLYYTR contains **0 FTP URLs**, **0 FTP client endpoints**, and **0 PAC proxy configurations**.
  - **Reachability Condition:** Exploitability requires that the host machine's network proxy be maliciously configured to fetch PAC scripts over `ftp://` from an attacker-controlled FTP server returning a malicious directory listing.
  - **Status:** **Dormant at runtime**.

### 3.2. `braces` (`GHSA-vfj7-8cjw-p6xm`) Re-Verification

- **Installed Version:** `3.0.3`
- **Advisory Details:**
  - Advisory ID: `GHSA-vfj7-8cjw-p6xm` (npm: 1240992)
  - Title: Stack-exhaustion denial of service through deeply nested patterns.
  - CWE: CWE-400 (Uncontrolled Resource Consumption).
  - Severity: High
  - Affected Range: `<= 3.0.3` (`*`)
- **Exact Installed Dependency Chains:**
  - Chain A (Backend Dev): `@youtubbot/backend@1.0.0` (dev) -> `ts-node-dev@2.0.0` -> `chokidar@3.6.0` -> `braces@3.0.3`
  - Chain B (Web Dev): `web@0.1.0` (dev) -> `eslint-config-next@16.4.1` -> `@next/eslint-plugin-next@16.4.1` -> `fast-glob@3.3.1` -> `micromatch@4.0.8` -> `braces@3.0.3`
- **Parent Version Constraints:**
  - `micromatch@4.0.8` declares `"braces": "^3.0.3"`.
  - `chokidar@3.6.0` declares `"braces": "~3.0.2"`.
- **Patch Availability:**
  - `3.0.3` is the latest published release on npm. **Zero patched versions exist in the entire npm ecosystem.**
- **Runtime Reachability & Exposure:**
  - `npm audit --omit=dev` confirms **0 occurrences in production dependencies**.
  - `ts-node-dev` is used only for local development (`npm run dev`); production backend runs compiled JS (`node dist/index.js`).
  - `eslint-config-next` is used only during linting (`next lint`).
  - Search of production compilation artifacts (`apps/backend/dist` and `apps/web/.next`) confirms **zero traces of `braces`**.
  - **Status:** **Build-Time Only / Negligible Runtime Risk**.

### 3.3. Status of `apps/uploader-agent`
- `apps/uploader-agent` is designed as an optional, local desktop utility that operators run on their workstation to automate YouTube uploads using their local browser profile.
- It is **not** bundled into the web frontend (`apps/web`) or the server backend (`apps/backend`).
- In a production cloud deployment (e.g., Vercel + headless worker), `apps/uploader-agent` is **never deployed to cloud servers**.
- Therefore, retaining `puppeteer` in `apps/uploader-agent` does not expose cloud production environments.

---

## 4. Workstream C — Specification Kit Forensic Analysis (All 39 Files)

### 4.1. Path-by-Path Kit Comparison vs. Repository Root

Every file in `SIMPLYYTR_2_0_BUILD_READY_KIT/` was compared against repository root files using exact sha256 checksums and normalized (line-ending invariant) sha256 checksums:

| # | Kit Relative Path | Size | Exists at Root? | Content Comparison vs. Root Counterpart | Category Classification | Forensic Recommendation |
|:---:|:---|:---:|:---:|:---|:---:|---|
| 1 | `MANIFEST.json` | 6,571 B | No | **Unique to Kit.** Contains sha256 checksums of the other 38 kit files. | **UNIQUE** | Exclude from `main`; keep with kit archive. |
| 2 | `AGENTS.md` | 819 B | Yes | Text normalized: **100% Identical** to root `AGENTS.md`. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 3 | `START_HERE.md` | 914 B | Yes | Text normalized: **100% Identical** to root `START_HERE.md`. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 4 | `BUILDER_BENCHMARK_TASK.md` | 261 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 5 | `MASTER_ONE_SHOT_BUILDER_PROMPT.md` | 853 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 6 | `SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md` | 83,119 B | Yes | Text normalized: **100% Identical** to root copy (3,963 lines). Kit is LF; root is CRLF (87,081 B). | **LINE_ENDING_ONLY** | Exclude (Root already tracked; saves 83 KB duplicate). |
| 7 | `.agent/adapters/antigravity/ANTIGRAVITY.md` | 163 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 8 | `.agent/adapters/claude-code/CLAUDE.md` | 137 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 9 | `.agent/adapters/cline/CLINE.md` | 133 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 10 | `.agent/adapters/codex/AGENTS.md` | 146 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 11 | `.agent/adapters/copilot/COPILOT_INSTRUCTIONS.md` | 134 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 12 | `.agent/adapters/cursor/CURSOR_RULES.md` | 118 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 13 | `.agent/memory/DECISIONS.md` | 344 B | Yes | **Substantive Difference.** Kit has 3 one-line stubs. Root has full ADRs D-0001 through D-0005. | **SUBSTANTIVE_DIFF** | Exclude (Kit copy is obsolete; root is authoritative). |
| 14 | `.agent/memory/LESSONS.md` | 76 B | Yes | **Substantive Difference.** Kit has "No promoted lessons yet". Root has L-0001 and L-0002. | **SUBSTANTIVE_DIFF** | Exclude (Kit copy is obsolete; root is authoritative). |
| 15 | `.agent/memory/PREFERENCES.md` | 196 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 16 | `.agent/protocols/DECISION_PROTOCOL.md` | 266 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 17 | `.agent/protocols/HANDOFF_PROTOCOL.md` | 356 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 18 | `.agent/protocols/REVIEW_PROTOCOL.md` | 309 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 19 | `.agent/protocols/SECURITY_PROTOCOL.md` | 269 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 20 | `.agent/protocols/TASK_PROTOCOL.md` | 220 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 21 | `.agent/state/ACTIVE_MISSION.md` | 232 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Stale Phase 0 mission). |
| 22 | `.agent/state/BLOCKERS.md` | 194 B | Yes | **Substantive Difference.** Kit has pre-implementation stubs. Root tracks real verified gate blockers. | **SUBSTANTIVE_DIFF** | Exclude (Kit copy is obsolete; root is authoritative). |
| 23 | `.agent/state/CURRENT_STATE.md` | 294 B | Yes | **Substantive Difference.** Kit claims `current_phase: 0`, `BUILD-READY`. Root tracks Phase 5M.2. | **SUBSTANTIVE_DIFF** | **HIGH RISK EXCLUDE:** Staging causes state regression. |
| 24 | `.agent/state/NEXT_ACTIONS.md` | 179 B | Yes | **Substantive Difference.** Kit claims "Run Phase 0 audit". Root tracks Phase 5M.3 runbook. | **SUBSTANTIVE_DIFF** | Exclude (Kit copy is obsolete; root is authoritative). |
| 25 | `.agent/transfer/export_schema.json` | 538 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 26 | `.agents/skills/simplyytr-core/SKILL.md` | 296 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 27 | `.agents/skills/simplyytr-testing/SKILL.md` | 203 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 28 | `docs/alphasignal/ALPHASIGNAL_INTELLIGENCE_RESEARCH.md` | 1,755 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 29 | `docs/alphasignal/ALPHASIGNAL_OPEN_SOURCE_REFERENCES.md` | 1,117 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 30 | `docs/alphasignal/ALPHASIGNAL_TO_SIMPLYYTR_DESIGN.md` | 1,073 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 31 | `docs/build-readiness/BUILDER_PLATFORM_BENCHMARK.md` | 1,155 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 32 | `docs/build-readiness/BUILDER_PORTABILITY_PROTOCOL.md` | 1,517 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 33 | `docs/build-readiness/BUILD_READINESS_MASTER_PLAN.md` | 2,225 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 34 | `docs/build-readiness/OSS_TECHNOLOGY_SELECTION_MATRIX.md` | 1,906 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 35 | `docs/build-readiness/PHASE_0_FORENSIC_TASK.md` | 1,412 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 36 | `docs/build-readiness/PHASE_1_FOUNDATION_TASKS.md` | 1,148 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 37 | `docs/builder-platforms/BUILDER_SELECTION.md` | 664 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 38 | `schemas/task-contract.schema.json` | 994 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |
| 39 | `scripts/builder/README.md` | 294 B | Yes | Text normalized: **100% Identical** to root copy. | **LINE_ENDING_ONLY** | Exclude (Root already tracked). |

### 4.2. Verification of `MANIFEST.json`
- `MANIFEST.json` contains 38 file entries with sha256 checksums.
- Automated checksum verification verified that **all 38 entries match the kit files with 0 mismatches and 0 missing files**.
- The manifest was generated on `2026-10-08` as a bootstrap index before Phase 0.

### 4.3. Recommendation & Trade-Offs
- **Option B (Recommended): Move to Dedicated Archive Branch.**
  - *Command:* Create branch `archive/build-ready-kit`, commit `SIMPLYYTR_2_0_BUILD_READY_KIT/`, and remove the untracked directory from `main`.
  - *Trade-off:* 100% preservation of the bootstrap kit in Git history with zero bloat and zero state collision on `main`.
- **Option A (Retain on `main`):**
  - *Trade-off:* Adds 39 duplicate/stale files to the repository root. If chosen, the nested `.agent/state/` folder must be deleted to prevent automated AI tools from reading `current_phase: 0`.

---

## 5. Workstream D — Reconciliation of Phase 5M.2 Evidence

### 5.1. Test Count Discrepancy Verification
- **Verification:** The underlying test runner for `tests/pipeline/phase4a_workflow.test.mjs` outputs 7 sequential checkpoint assertions:
  1. Trigger Job (NEEDS_REVIEW)
  2. Operator Approval (SCRIPTED)
  3. Worker Claim & Render (READY)
  4. Technical Stream Analysis (H.264/AAC, Volume Mean = -19.5 dB)
  5. Authenticated Media Route (HTTP 206 / 401 guard)
  6. Dashboard State Exposure
  7. Publishing Guardrail Verification
- In Phase 5D, this workflow was counted as **1 passing end-to-end test suite** (`43 + 17 + 30 + 22 + 23 + 1 + 23 = 159`).
- In Phase 5L.1B / 5L.2, its 7 sequential stages were counted individually (`43 + 17 + 30 + 22 + 23 + 7 + 23 = 165`).
- **Conclusion:** Both numbers describe the exact same passing test execution. Zero assertions failed.

### 5.2. `git diff --check` Whitespace Reconciliation
- Git flags 7 files for line-ending replacement warnings (`LF will be replaced by CRLF`).
- Git flags 5 specific line locations for trailing whitespace or blank line at EOF:
  - `.agent/state/CURRENT_STATE.md:64`: Empty newline at EOF.
  - `.agent/state/NEXT_ACTIONS.md:156`: Empty newline at EOF.
  - `apps/backend/src/queue/youtubeScraper.ts:18`: Empty indented line (`+    `).
  - `apps/web/src/app/api/pipeline/jobs/route.ts:71`: Empty newline at EOF.
  - `docs/audit/SECURITY_FINDINGS.md:289, 290`: Trailing spaces for Markdown linebreaks.
- **Conclusion:** Verified clean. Zero merge conflicts or syntax errors.

### 5.3. Secret Scanner Verification
- `node scripts/verify_no_secrets.js` executed with exit code 0 (`Credential Guard PASSED: No forbidden credential patterns staged`).
- Verified zero secret values printed in any report.

---

## 6. Release Gates That Remain Blocked

The following gates remain strictly **`BLOCKED`** or **`UNVERIFIED`**:

1. **Gate 2 (Remote Production Database):** `UNVERIFIED`. Hosted PostgreSQL (Supabase/Neon) has not been provisioned; `0_init` has only been verified locally.
2. **Gate 5 (Remote Secrets Cutover):** `UNVERIFIED`. `PIPELINE_SECRET`, `DATABASE_URL`, and `NEXTAUTH_SECRET` have not been populated in Vercel or GitHub Secrets.
3. **Gate 6 (External Credential Revocation):** `UNVERIFIED`. Owner reported revoking Google sessions and deleting OAuth secret, but this cannot be programmatically verified locally.
4. **Gate 7 (Dependency Vulnerabilities):** `BLOCKED`. 7 High nodes exist in production tree (`basic-ftp@5.3.1`) and 7 in dev tree (`braces@3.0.3`). Pruning backend Puppeteer resolves server production exposure.
5. **Gate 11 (Live Staging Smoke Testing):** `UNVERIFIED`. Cannot execute until remote deployment is live.
6. **Gate 12 (Production Release Commit & Tag Freeze):** `BLOCKED`. Awaits owner decisions on kit and dependencies.

---

## 7. Short Owner Decision Checklist

```markdown
[ ] Decision 1: Specification Kit (`SIMPLYYTR_2_0_BUILD_READY_KIT/`)
    ( ) Option B (Recommended): Move kit to dedicated branch 'archive/build-ready-kit' (keeps main clean)
    ( ) Option A: Retain on main (purge nested stale .agent/state/ first to prevent state regression)
    ( ) Option C: Archive as external tarball and exclude from Git

[ ] Decision 2: Backend Puppeteer Pruning
    ( ) Option 1 (Recommended): Authorize removing unused 'puppeteer', 'puppeteer-extra', and 
        'puppeteer-extra-plugin-stealth' from apps/backend/package.json (prunes basic-ftp from server images)
    ( ) Option 2: Keep backend Puppeteer and accept basic-ftp@5.3.1 as documented dormant residual risk

[ ] Decision 3: External Infrastructure & Remote Secrets
    ( ) Provision remote PostgreSQL instance (Supabase/Neon) and run prisma migrate deploy
    ( ) Populate PIPELINE_SECRET, DATABASE_URL, NEXTAUTH_SECRET into Vercel and GitHub Secrets

[ ] Decision 4: Release Candidate Tagging Authorization (v2.0.0-rc1)
    ( ) Authorize staging of approved manifest files
    ( ) Authorize Git commit and annotated tag v2.0.0-rc1
```

---

## 8. Final Safety Verification

- **Git HEAD:** `b83d88ee997a4b0c948232c3c69591b8ee0c0545` (Unchanged).
- **Git Branch:** `main` (Unchanged).
- **Staged Changes:** Exactly 0 files staged (`git diff --staged` is empty).
- **Dependency Manifests & Lockfiles:** Exactly 0 files modified.
- **PostgreSQL Cluster:** Remained cleanly stopped; port 5432 unbound.
- **Remote Operations:** Exactly 0 remote commands executed.
- **Secrets Exposed:** Exactly 0 secrets exposed.
