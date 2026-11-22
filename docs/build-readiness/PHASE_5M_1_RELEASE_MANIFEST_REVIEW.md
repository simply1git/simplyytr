# SIMPLYYTR 2.0 — Phase 5M.1: Release Manifest Review (Read-Only)

**Document Status:** Complete & Fully Audited (Strictly Read-Only)  
**Date:** 2026-10-18  
**Verdict:** `LOCAL_MANIFEST_VERIFIED_RELEASE_BLOCKED`  
**Workspace:** `D:\Projects\SIMPLYYTR`  
**Git Baseline HEAD:** `b83d88ee997a4b0c948232c3c69591b8ee0c0545`  
**Active Branch:** `main`  
**Staged Changes:** **0 files staged** (`git diff --staged` is empty)  
**Tracked Modified Files:** Exactly 36 files  
**Untracked Files:** Exactly 82 individual files (43 workspace files + 39 kit files)  
**Total Working Tree Items:** Exactly 118 files evaluated  
**Ignored Paths:** 15 paths  

---

## 1. Executive Summary & Review Verdict

### Verdict: `LOCAL_MANIFEST_VERIFIED_RELEASE_BLOCKED`

### Summary:
Phase 5M.1 conducted an exhaustive, recursive, file-by-file audit of all 118 active items in the `D:\Projects\SIMPLYYTR` working tree to prepare an auditable proposed release manifest for `v2.0.0-rc1`.

1. **Local Working-Tree Integrity:**
   - Every single modified tracked file (36 files) and untracked file (82 files) has been individually inspected, categorized, and assigned an evidence-backed disposition.
   - All proposed core application files, baseline database migrations, tests, and documentation are confirmed free of hardcoded credentials, local environment paths, database binaries, and personal data.
   - Zero files have been staged, committed, tagged, or pushed.
2. **Production Release Blockers:**
   - Production release remains **BLOCKED** on four critical conditions:
     - **P0 Blocker 1 (Remote Secret Cutover):** Rotated `PIPELINE_SECRET` is verified locally, but remote deployment cutover to GitHub Actions Secrets and Vercel Project Environment Variables remains `UNVERIFIED`.
     - **P0 Blocker 2 (Remote Production Database):** Baseline migration `0_init` is verified locally with zero schema drift, but hosted PostgreSQL (Supabase/Neon) provisioning remains `UNVERIFIED`.
     - **P1 Blocker 3 (Owner Dependency Risk Sign-Off):** Production dependency tree contains 7 vulnerability nodes mapped to `basic-ftp@5.3.1` under `apps/uploader-agent` (dormant at runtime; pinned by upstream `get-uri@8.0.1`). Formal owner risk acceptance is required.
     - **P1 Blocker 4 (Owner Decision on Specification Kit):** Disposition of `SIMPLYYTR_2_0_BUILD_READY_KIT/` (39 files) requires an explicit owner decision (Option A: stage on `main`; Option B: preserve on separate documentation branch).

---

## 2. Working-Tree Inventory Reconciliation

### 2.1. Exact Reconciled Inventory

| Category | High-Level Count (`git status -s`) | Recursive File Count (`git status -u`) | Proposed Disposition |
|---|:---:|:---:|:---:|
| **Tracked Modified Files** | 36 entries | 36 files | 36 INCLUDE (or MANUAL REVIEW for state files) |
| **Untracked Application & Migrations** | 10 entries | 11 files | 11 INCLUDE |
| **Untracked Tests & Scripts** | 7 entries | 13 files | 13 INCLUDE |
| **Untracked Documentation & Reports** | 18 entries | 19 files | 19 INCLUDE |
| **Untracked Specification Kit** | 1 entry (`SIMPLYYTR_2_0_BUILD_READY_KIT/`) | 39 files | 39 MANUAL REVIEW (Awaits Owner Decision) |
| **Ignored Local Data & Build Artifacts** | 15 entries | N/A (Ignored) | 15 STRICTLY EXCLUDE |
| **TOTAL WORKING TREE ITEMS** | **73 entries** | **118 files** | **79 INCLUDE, 39 MANUAL REVIEW, 15 EXCLUDE** |

---

## 3. Comprehensive File-by-File Release Manifest

### Group 1: Core Application Changes & Package Manifests (42 Files)
*Status: All verified clean. Zero credentials, zero build artifacts, zero sensitive local paths.*

| # | Path | Git Status | File Purpose | Proposed Disposition | Evidence-Based Rationale | Security / Licensing / Data Concern | Dependencies / Release Impact |
|:---:|:---|:---:|:---|:---:|:---|:---|:---|
| 1 | `package.json` | Modified | Root workspace package manifest | **INCLUDE** | Defines workspace scripts (`test:*`, `db:*`) and root overrides (`qs`, `browserslist`, `baseline-browser-mapping`) | Verified clean; no private tokens | Controls root dependency resolution and test commands |
| 2 | `package-lock.json` | Modified | Locked dependency graph | **INCLUDE** | Pins all remediated dependency versions (`qs@6.16.1`, `body-parser@1.20.8`, `puppeteer@25.14.0`, etc.) | Verified clean; integrity hashes checked | Ensures deterministic CI/CD builds without pulling vulnerable versions |
| 3 | `.gitignore` | Modified | Repository ignore rules | **INCLUDE** | Enforces exclusion of `.env`, `.local_db_data/`, Chrome profiles, media storage, sqlite DBs | High positive security value | Prevents accidental commits of secrets and local runtime data |
| 4 | `apps/backend/package.json` | Modified | Backend package manifest | **INCLUDE** | Defines backend dependencies and scripts | Verified clean | Backend build configuration |
| 5 | `apps/backend/src/index.ts` | Modified | Backend Express entry point | **INCLUDE** | Express server bootstrap; guards cron and routes behind `isLegacyScraperPipelineEnabled()` | Fail-closed guard prevents unauthorized scraper execution | Backend service bootstrap |
| 6 | `apps/backend/src/middleware/auth.ts` | Untracked | Backend Bearer auth middleware | **INCLUDE** | Implements constant-time `verifyBackendAuth` for Express route authentication | Protects backend HTTP ingress from unauthenticated calls | Express routing security |
| 7 | `apps/backend/src/queue/legacyGuard.ts` | Untracked | Fail-closed legacy pipeline gate | **INCLUDE** | Checks `ENABLE_LEGACY_SCRAPER_PIPELINE="true"` before queue execution | Prevents accidental background execution of ungrounded scrapers | Legacy queue isolation |
| 8 | `apps/backend/src/queue/editorQueue.ts` | Modified | BullMQ video editor processor | **INCLUDE** | Intercepts queue tasks with `isLegacyScraperPipelineEnabled()` | Fail-closed guard | Legacy queue isolation |
| 9 | `apps/backend/src/queue/ingestQueue.ts` | Modified | BullMQ ingest processor | **INCLUDE** | Intercepts queue tasks with `isLegacyScraperPipelineEnabled()` | Fail-closed guard | Legacy queue isolation |
| 10 | `apps/backend/src/queue/youtubeScraper.ts` | Modified | Legacy scraper processor | **INCLUDE** | Intercepts queue tasks with `isLegacyScraperPipelineEnabled()` | Prevents YouTube scraping and quota consumption | Legacy queue isolation |
| 11 | `apps/backend/src/queue/youtubePublisher.ts` | Modified | BullMQ publisher worker | **INCLUDE** | Enforces `!settings.autoPublishOnline`, eradicates mock upload success | Prevents unauthorized live publishing | Publishing safety gate |
| 12 | `apps/backend/src/routes/publish.ts` | Modified | Publishing Express routes | **INCLUDE** | Secures `/api/publish` with `verifyBackendAuth` and legacy guard | Closes unauthenticated POST vulnerability | API security |
| 13 | `apps/backend/src/routes/settings.ts` | Modified | Settings Express routes | **INCLUDE** | Guards legacy settings modification behind legacy guard | Prevents unauthorized settings mutation | API security |
| 14 | `apps/backend/src/routes/trends.ts` | Modified | Trends Express routes | **INCLUDE** | Guards legacy trend scraping behind legacy guard | Prevents unauthorized trend scraping | API security |
| 15 | `apps/backend/src/services/aiRewriter.ts` | Modified | AI script generation service | **INCLUDE** | Topic-grounded script generation with honest fallback when LLM keys unset | Strips mock credentials; honest telemetry | Core content pipeline |
| 16 | `apps/backend/src/services/productRadar.ts` | Modified | Product catalog research service | **INCLUDE** | Labels sample catalog items as `LOCAL_SAMPLE_CATALOG` and `SAMPLE_UNVERIFIED` | Prevents fabricated affiliate/product claims | Content compliance |
| 17 | `apps/backend/src/services/youtubePublisher.ts` | Modified | YouTube publishing service | **INCLUDE** | Eradicates silent fake upload mock; requires genuine OAuth credentials | Eliminates false claims of published videos | Publishing subsystem |
| 18 | `apps/backend/src/services/localRenderer.ts` | Untracked | Local FFmpeg video renderer | **INCLUDE** | Cross-platform FFmpeg execution, dynamic font discovery, 3-segment visual montage | Input validation; relative tools resolution | Core video rendering service |
| 19 | `apps/backend/src/services/localTts.ts` | Untracked | Local TTS engine abstraction | **INCLUDE** | Unified `ITtsProvider` for Windows SAPI, eSpeak NG, Piper, edge-tts | Text sanitization, audio header check, path confinement | Core audio synthesis service |
| 20 | `apps/backend/src/services/topicPackage.ts` | Untracked | Topic package builder & validator | **INCLUDE** | Deterministic Single Content Contract builder for local renderer | Strict schema validation | Content data modeling |
| 21 | `apps/uploader-agent/package.json` | Modified | Desktop uploader manifest | **INCLUDE** | Upgraded to `puppeteer@^25.14.0`, completely eliminating `extract-zip@2.0.1` | Direct vulnerability remediation | Desktop uploader dependencies |
| 22 | `apps/web/package.json` | Modified | Web frontend manifest | **INCLUDE** | Updates dependencies (`zod`) and build scripts | Verified clean | Frontend build configuration |
| 23 | `apps/web/src/app/api/lib/adversarialQualityGate.ts` | Modified | Adversarial quality rubric | **INCLUDE** | Evaluates generated scripts for factual grounding and evidence alignment | Protects against hallucinated claims | Pre-render quality gate |
| 24 | `apps/web/src/app/api/lib/agenticOrchestrator.ts` | Modified | Pipeline orchestrator | **INCLUDE** | Grounded pipeline coordinator enforcing Single Content Contract | Ensures workflow state consistency | Generation orchestration |
| 25 | `apps/web/src/app/api/lib/aiPipelineEngine.ts` | Modified | AI pipeline script engine | **INCLUDE** | Topic-grounded script generation with honest demo labeling | Prevents deceptive AI content | Web script engine |
| 26 | `apps/web/src/app/api/lib/complianceProxy.ts` | Modified | FTC compliance validator | **INCLUDE** | Validates mandatory FTC affiliate disclosures; blocks health/financial claims | Enforces FTC legal compliance | Compliance proxy |
| 27 | `apps/web/src/app/api/lib/contentContract.ts` | Untracked | Single Content Contract schema | **INCLUDE** | Zod validation boundary for topic scripts, claims, visuals, citations | Schema poisoning protection | Core validation boundary |
| 28 | `apps/web/src/app/api/lib/evidenceGraph.ts` | Modified | Evidence grounding graph | **INCLUDE** | Maps factual claims to verified manufacturer URLs and documentation | Factual grounding enforcement | Content grounding |
| 29 | `apps/web/src/app/api/lib/mediaAuth.ts` | Untracked | HMAC streaming media token service | **INCLUDE** | Generates and validates time-bounded, path-scoped HMAC-SHA256 media tokens | Protects media from unauthenticated hotlinking/enumeration | Media authorization |
| 30 | `apps/web/src/app/api/lib/productRadar.ts` | Modified | Web product radar service | **INCLUDE** | Enforces honest sample disclosures and FTC compliance | Protects against deceptive marketing | Product discovery |
| 31 | `apps/web/src/app/api/lib/topicGroundedGenerator.ts` | Untracked | Deterministic script generator | **INCLUDE** | Generates topic-grounded 3-segment scripts with verified manufacturer citations | Zero fake citations | Topic generation |
| 32 | `apps/web/src/app/api/lib/youtubePublisher.ts` | Modified | Web YouTube publisher | **INCLUDE** | Eradicates silent mock success when credentials are unset | Eliminates false upload reports | Web publishing |
| 33 | `apps/web/src/app/api/media/[filename]/route.ts` | Untracked | Authenticated media route | **INCLUDE** | Enforces HMAC token check; RFC 9110 compliant byte-range streaming | Path traversal check; token verification | Video streaming API |
| 34 | `apps/web/src/app/api/pipeline/control/route.ts` | Modified | Pipeline operator control route | **INCLUDE** | Human operator approval, rejection, and retry endpoints with package freezing | Enforces human-in-the-loop oversight | Web API control route |
| 35 | `apps/web/src/app/api/pipeline/jobs/route.ts` | Modified | Pipeline jobs listing route | **INCLUDE** | Applies safe Prisma select whitelist; signs HMAC streaming media URLs | Prevents sensitive database leaking | Web API jobs route |
| 36 | `apps/web/src/app/api/pipeline/publish/route.ts` | Modified | Pipeline publish route | **INCLUDE** | Enforces `READY` status guard before allowing publishing | Prevents unapproved publishing | Web API publish route |
| 37 | `apps/web/src/app/api/pipeline/trigger/route.ts` | Modified | Pipeline trigger route | **INCLUDE** | Single Content Contract creation boundary; authenticates via Bearer secret | Prevents unauthenticated pipeline activation | Web API trigger route |
| 38 | `apps/web/src/app/api/pipeline/webhook/route.ts` | Modified | Worker webhook route | **INCLUDE** | Authoritative state transition boundary; verifies worker payload and output file | Prevents spoofed job completions | Web API webhook route |
| 39 | `apps/web/src/app/api/pipeline/worker-job/route.ts` | Modified | Worker job lease route | **INCLUDE** | Atomic job leasing via transactions; strips master storage secrets; 30-min stale reaper | Closes master credential exposure | Worker queue route |
| 40 | `apps/web/src/app/page.tsx` | Modified | Next.js main dashboard UI | **INCLUDE** | Removed `process.env` references; browser video player with signed HMAC media URLs | Eliminates client-side credential exposure | Main UI dashboard |
| 41 | `scripts/local_worker.mjs` | Untracked | Local rendering worker daemon | **INCLUDE** | Polling daemon claiming jobs, rendering MP4, and reporting via webhook | Uses `PIPELINE_SECRET` from environment; no hardcoded keys | Local rendering daemon |
| 42 | `packages/database/prisma/schema.prisma` | Modified | Prisma database schema | **INCLUDE** | Adds Single Content Contract fields to `RenderJob`; defaults `autoPublishOnline = false` | Fail-closed defaults | Core database modeling |

---

### Group 2: Database Schema & Baseline Migrations (2 Files)
*Status: Verified locally with zero schema drift. Required for production database provisioning.*

| # | Path | Git Status | File Purpose | Proposed Disposition | Evidence-Based Rationale | Security / Licensing / Data Concern | Dependencies / Release Impact |
|:---:|:---|:---:|:---|:---:|:---|:---|:---|
| 43 | `packages/database/prisma/migrations/0_init/migration.sql` | Untracked | Baseline PostgreSQL DDL migration | **INCLUDE** | Establishes clean schema baseline (10 tables, 5 foreign keys, 14 indexes) from scratch | Deterministic SQL DDL; zero data leaks | Mandatory for `npx prisma migrate deploy` |
| 44 | `packages/database/prisma/migrations/migration_lock.toml` | Untracked | Prisma migration engine lockfile | **INCLUDE** | Pins Prisma PostgreSQL provider engine | Clean; autogenerated by Prisma | Required for Prisma migration tracking |

---

### Group 3: Test Suites & Verification Tooling (12 Files)
*Status: 100% passing (159 automated assertions). Enables reproducible continuous integration.*

| # | Path | Git Status | File Purpose | Proposed Disposition | Evidence-Based Rationale | Security / Licensing / Data Concern | Dependencies / Release Impact |
|:---:|:---|:---:|:---|:---:|:---|:---|:---|
| 45 | `tests/audit/phase4a1_acceptance.test.mjs` | Untracked | Security acceptance test suite | **INCLUDE** | 14 automated tests verifying security remediations | Verified clean | CI/CD regression testing |
| 46 | `tests/pipeline/phase4a_workflow.test.mjs` | Untracked | Full workflow integration test | **INCLUDE** | Exercises full video render, audio volume analysis, and HTTP streaming | Verified clean; uses local test storage | CI/CD integration testing |
| 47 | `tests/pipeline/phase4b_content_grounding.test.mjs` | Untracked | Content grounding test suite | **INCLUDE** | 23 automated tests verifying Single Content Contract, citations, FTC text | Verified clean | CI/CD regression testing |
| 48 | `tests/pipeline/pipeline_e2e.test.js` | Untracked | Pipeline concurrency & leasing test | **INCLUDE** | 23 automated tests verifying worker lease atomicity and stale reaper | Verified clean | CI/CD regression testing |
| 49 | `tests/security/cross_platform_tts.test.mjs` | Untracked | Cross-platform TTS test suite | **INCLUDE** | 22 automated tests verifying TTS providers, text validation, audio headers | Verified clean | CI/CD regression testing |
| 50 | `tests/security/legacy_scraper_isolation.test.mjs` | Untracked | Legacy scraper isolation test suite | **INCLUDE** | 30 automated tests verifying fail-closed isolation across routes, queues, cron | Verified clean | CI/CD regression testing |
| 51 | `tests/security/remediation_regression.test.mjs` | Untracked | Remediation regression test suite | **INCLUDE** | 17 automated tests verifying RFC 9110 range parser and HMAC token scope | Verified clean | CI/CD regression testing |
| 52 | `scripts/exercise_phase4b_e2e.mjs` | Untracked | Pipeline trigger & frame extraction | **INCLUDE** | Local utility to exercise full pipeline and extract verification video frames | Reads `PIPELINE_SECRET` from env; output written to ignored `scratch/` | Developer verification tooling |
| 53 | `scripts/local_db.js` | Untracked | Local PostgreSQL lifecycle manager | **INCLUDE** | Embedded local PostgreSQL service manager for dev/test environments | Uses relative paths; zero hardcoded passwords | Developer tooling |
| 54 | `scripts/register_hook.mjs` | Untracked | Node.js ESM loader registration hook | **INCLUDE** | Registers TypeScript transpiler hook for running `.ts` files in Node.js ESM tests | Verified clean | Test execution tooling |
| 55 | `scripts/resolve_hook.mjs` | Untracked | Node.js ESM module resolver helper | **INCLUDE** | Resolves TypeScript module extensions during dynamic test execution | Verified clean | Test execution tooling |
| 56 | `scripts/sync_env.js` | Untracked | Environment config helper | **INCLUDE** | Generates cryptographic 64-char `PIPELINE_SECRET` and creates safe local `.env` | Safe local key generation; does not leak | Configuration management |

---

### Group 4: Canonical Documentation & State Files (22 Files)
*Status: Provides complete durable memory, architecture decisions, and audit trail.*

| # | Path | Git Status | File Purpose | Proposed Disposition | Evidence-Based Rationale | Security / Licensing / Data Concern | Dependencies / Release Impact |
|:---:|:---|:---:|:---|:---:|:---|:---|:---|
| 57 | `.agent/state/BLOCKERS.md` | Modified | Active blockers register | **INCLUDE / MANUAL REVIEW** | Preserves durable memory of remaining gates and blockers | Verified clean; zero secrets | Agent memory |
| 58 | `.agent/state/CURRENT_STATE.md` | Modified | Current state tracking | **INCLUDE / MANUAL REVIEW** | Canonical tracking of verified commit, phase milestone, test metrics | Verified clean; zero secrets | Agent memory |
| 59 | `.agent/state/NEXT_ACTIONS.md` | Modified | Roadmap & operational commands | **INCLUDE / MANUAL REVIEW** | Operational command runbook and next actions sequence | Verified clean; zero secrets | Agent memory |
| 60 | `docs/audit/SECURITY_FINDINGS.md` | Modified | Security findings register | **INCLUDE** | Core security register and remediation verification | Zero secrets contained | Security audit trail |
| 61 | `docs/audit/GITHUB_HISTORY_REPLACEMENT_RUNBOOK.md` | Untracked | Git history replacement runbook | **INCLUDE** | Procedure for Git history hygiene and remote force-push | Safe operational guide | Documentation |
| 62 | `docs/build-readiness/DATABASE_MIGRATION_STRATEGY.md` | Untracked | Database migration strategy | **INCLUDE** | Runbook for PostgreSQL migrations and schema drift policy | Safe operational guide | Database deployment |
| 63 | `docs/build-readiness/PHASE_4A_1_ACCEPTANCE_AUDIT.md` | Untracked | Phase 4A.1 acceptance audit | **INCLUDE** | Audit evidence of security remediations | Verified clean | Historical audit trail |
| 64 | `docs/build-readiness/PHASE_4B_CONTENT_GROUNDING_ACCEPTANCE.md` | Untracked | Phase 4B acceptance report | **INCLUDE** | Audit evidence of Single Content Contract and topic grounding | Verified clean | Historical audit trail |
| 65 | `docs/build-readiness/PHASE_4C_INTEGRATION_AUDIT.md` | Untracked | Phase 4C integration report | **INCLUDE** | Baseline audit of pipeline integration | Verified clean | Historical audit trail |
| 66 | `docs/build-readiness/PHASE_5A_CREDENTIAL_ROTATION_PLAN.md` | Untracked | Credential rotation plan | **INCLUDE** | Inventory of all system credentials and rotation runbook | Zero secrets printed | Deployment runbook |
| 67 | `docs/build-readiness/PHASE_5B_ROTATION_VERIFICATION.md` | Untracked | Rotation verification report | **INCLUDE** | Verification of local secret rotation | Verified clean | Historical audit trail |
| 68 | `docs/build-readiness/PHASE_5C_RELEASE_CANDIDATE_AUDIT.md` | Untracked | Release candidate audit report | **INCLUDE** | Release candidate verification report | Verified clean | Historical audit trail |
| 69 | `docs/build-readiness/PHASE_5D_REMEDIATION_READINESS.md` | Untracked | Remediation readiness report | **INCLUDE** | Audit trail of remediation steps | Verified clean | Historical audit trail |
| 70 | `docs/build-readiness/PHASE_5E_RELEASE_CANDIDATE_REVIEW.md` | Untracked | Release candidate review report | **INCLUDE** | Initial working tree inventory analysis | Verified clean | Historical audit trail |
| 71 | `docs/build-readiness/PHASE_5K_DEPENDENCY_REMEDIATION_REPORT.md` | Untracked | Dependency remediation report | **INCLUDE** | Evidence of `qs`, `body-parser`, `puppeteer` fixes | Verified clean | Dependency audit trail |
| 72 | `docs/build-readiness/PHASE_5K_1_RESIDUAL_VERIFICATION_REPORT.md` | Untracked | Residual verification report | **INCLUDE** | Evidence of PostCSS upgrade and dependency telemetry | Verified clean | Dependency audit trail |
| 73 | `docs/build-readiness/PHASE_5K_2_INDEPENDENT_VERIFICATION_REPORT.md` | Untracked | Independent verification report | **INCLUDE** | Independent verification of dependency status and DB incident | Verified clean | Dependency audit trail |
| 74 | `docs/build-readiness/PHASE_5K_3_TARGETED_REMEDIATION_REPORT.md` | Untracked | Targeted remediation report | **INCLUDE** | Evidence of `browserslist` upgrade | Verified clean | Dependency audit trail |
| 75 | `docs/build-readiness/PHASE_5K_4_INDEPENDENT_VERIFICATION_REPORT.md` | Untracked | Independent verification report | **INCLUDE** | Empirical proof of `braces` omission from prod | Verified clean | Dependency audit trail |
| 76 | `docs/build-readiness/PHASE_5L_1A_DATABASE_DIAGNOSTICS.md` | Untracked | Database diagnostics report | **INCLUDE** | Port 5432 diagnostics and stale PID investigation | Verified clean | Database audit trail |
| 77 | `docs/build-readiness/PHASE_5L_1B_DATABASE_RECOVERY_REPORT.md` | Untracked | Database recovery report | **INCLUDE** | Evidence of clean WAL recovery and 159 tests passing | Verified clean | Database audit trail |
| 78 | `docs/build-readiness/PHASE_5L_2_FINAL_READINESS_AUDIT.md` | Untracked | Final readiness audit report | **INCLUDE** | Comprehensive gate audit and P0/P1/P2 blocker list | Verified clean | Release gate audit |
| 79 | `docs/build-readiness/PHASE_5M_1_RELEASE_MANIFEST_REVIEW.md` | Untracked | *This document: Release manifest* | **INCLUDE** | Complete file-by-file manifest review | Verified clean | Release manifest |

---

### Group 5: Specification Kit (`SIMPLYYTR_2_0_BUILD_READY_KIT/`, 39 Files) — `MANUAL REVIEW`
*Status: Architecture specifications, builder benchmarks, agent adapters (Claude, Cline, Codex, Copilot, Cursor). Zero credentials.*

| # | Path | Git Status | File Purpose | Proposed Disposition | Evidence-Based Rationale | Security / Licensing / Data Concern | Dependencies / Release Impact |
|:---:|:---|:---:|:---|:---:|:---|:---|:---|
| 80 | `SIMPLYYTR_2_0_BUILD_READY_KIT/AGENTS.md` | Untracked | Agent instructions for kit | **MANUAL REVIEW** | Duplicate of top-level `AGENTS.md` tailored for kit | Clean | Reference specification |
| 81 | `SIMPLYYTR_2_0_BUILD_READY_KIT/START_HERE.md` | Untracked | Kit entry point guide | **MANUAL REVIEW** | Guide for secondary AI builders | Clean | Reference specification |
| 82 | `SIMPLYYTR_2_0_BUILD_READY_KIT/BUILDER_BENCHMARK_TASK.md` | Untracked | Builder benchmark task specification | **MANUAL REVIEW** | Benchmark specification for autonomous builders | Clean | Research / Benchmarks |
| 83 | `SIMPLYYTR_2_0_BUILD_READY_KIT/MANIFEST.json` | Untracked | Kit manifest checksum file | **MANUAL REVIEW** | Integrity checksum of kit files | Clean | Integrity tracking |
| 84 | `SIMPLYYTR_2_0_BUILD_READY_KIT/MASTER_ONE_SHOT_BUILDER_PROMPT.md` | Untracked | One-shot prompt specification | **MANUAL REVIEW** | Master specification prompt | Clean | Prompt documentation |
| 85 | `SIMPLYYTR_2_0_BUILD_READY_KIT/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md` | Untracked | Master architecture specification | **MANUAL REVIEW** | Complete frozen technical architecture document | Clean | Master architecture specification |
| 86-91 | `SIMPLYYTR_2_0_BUILD_READY_KIT/.agent/adapters/*` (6 files) | Untracked | AI agent adapter instructions (Antigravity, Claude, Cline, Codex, Copilot, Cursor) | **MANUAL REVIEW** | Cross-tool interoperability adapters | Clean | Multi-agent support |
| 92-94 | `SIMPLYYTR_2_0_BUILD_READY_KIT/.agent/memory/*` (3 files) | Untracked | Decisions, lessons, and preferences memory | **MANUAL REVIEW** | Durable agent memory specifications | Clean | Agent memory |
| 95-99 | `SIMPLYYTR_2_0_BUILD_READY_KIT/.agent/protocols/*` (5 files) | Untracked | Agent protocols (Decision, Handoff, Review, Security, Task) | **MANUAL REVIEW** | Operating protocols for autonomous agents | Clean | Protocols |
| 100-103 | `SIMPLYYTR_2_0_BUILD_READY_KIT/.agent/state/*` (4 files) | Untracked | Kit state files (`ACTIVE_MISSION.md`, `BLOCKERS.md`, `CURRENT_STATE.md`, `NEXT_ACTIONS.md`) | **MANUAL REVIEW** | **Caution:** Nested state files duplicate root `.agent/state/` names, potentially causing confusion if indexed | Contains duplicate state schema | Kit internal state |
| 104 | `SIMPLYYTR_2_0_BUILD_READY_KIT/.agent/transfer/export_schema.json` | Untracked | State transfer schema | **MANUAL REVIEW** | JSON schema for agent transfer | Clean | Schema |
| 105-106 | `SIMPLYYTR_2_0_BUILD_READY_KIT/.agents/skills/*` (2 files) | Untracked | Custom builder skills (`simplyytr-core`, `simplyytr-testing`) | **MANUAL REVIEW** | Antigravity builder skills | Clean | Custom skills |
| 107-109 | `SIMPLYYTR_2_0_BUILD_READY_KIT/docs/alphasignal/*` (3 files) | Untracked | AlphaSignal intelligence research and references | **MANUAL REVIEW** | Research on automated trend discovery | Clean | Research documentation |
| 110-115 | `SIMPLYYTR_2_0_BUILD_READY_KIT/docs/build-readiness/*` (6 files) | Untracked | Platform benchmarks, portability protocol, master plan | **MANUAL REVIEW** | Forensic foundation specifications | Clean | Build-readiness specifications |
| 116 | `SIMPLYYTR_2_0_BUILD_READY_KIT/docs/builder-platforms/BUILDER_SELECTION.md` | Untracked | Builder platform comparison | **MANUAL REVIEW** | Comparative analysis of AI platforms | Clean | Research |
| 117 | `SIMPLYYTR_2_0_BUILD_READY_KIT/schemas/task-contract.schema.json` | Untracked | Task contract schema | **MANUAL REVIEW** | JSON schema for task contracts | Clean | Validation schema |
| 118 | `SIMPLYYTR_2_0_BUILD_READY_KIT/scripts/builder/README.md` | Untracked | Builder scripts guide | **MANUAL REVIEW** | Guide for runner scripts | Clean | Documentation |

#### Owner Decision Options for `SIMPLYYTR_2_0_BUILD_READY_KIT/`:
- **Option A (Include in release candidate):** Stage and commit all 39 files on `main` to preserve the reference specification directly in the release history.
- **Option B (Separate documentation branch or archive):** Move or push the kit to a dedicated branch (e.g. `docs/build-ready-kit`) to prevent nested `.agent/state/` collisions and keep the primary branch strictly focused on production application code and active documentation.

---

### Group 6: Strictly Excluded Local Data & Ignored Paths (15 Paths)
*Status: Must remain unstaged and ignored. Strictly prohibited from release.*

| Path | Category | Reason for Exclusion | Enforcement Mechanism |
|---|---|---|---|
| `.env` | Local Secrets | Contains active local secrets: `PIPELINE_SECRET`, `NEXTAUTH_SECRET`, `DATABASE_URL` | Excluded by `.gitignore` & Credential Guard |
| `.local_db_data/` | Database Cluster | Local PostgreSQL cluster files (WAL, data pages, logs, config) | Excluded by `.gitignore` |
| `apps/backend/.env` | Local Secrets | Backend local configuration overrides | Excluded by `.gitignore` |
| `apps/backend/dist/` | Build Artifacts | Compiled JavaScript output; regenerated dynamically during build/CI | Excluded by `.gitignore` |
| `apps/web/.env` | Local Secrets | Frontend local environment file | Excluded by `.gitignore` |
| `apps/web/.next/` | Build Artifacts | Next.js build cache, static route chunks, webpack/turbopack cache | Excluded by `.gitignore` |
| `apps/web/next-env.d.ts` | Autogenerated Code | Autogenerated Next.js TypeScript declarations | Excluded by `.gitignore` |
| `apps/web/node_modules/` | Dependencies | Web workspace package dependencies | Excluded by `.gitignore` |
| `apps/web/tsconfig.tsbuildinfo` | Build Cache | TypeScript incremental compilation cache | Excluded by `.gitignore` |
| `kaggle-worker/__pycache__/` | Python Cache | Python bytecode cache files | Excluded by `.gitignore` |
| `local_tools/` | Local Binaries | Local OS binaries (e.g. Windows FFmpeg binary `local_tools/bin/ffmpeg.exe`) | Excluded by `.gitignore` |
| `node_modules/` | Dependencies | Root node_modules tree (817 dependencies) | Excluded by `.gitignore` |
| `scratch/` | Temporary Evidence | Scratch test scripts, temporary frame dumps, raw npm audit JSON files, pre-recovery db backup (67.4 MB) | Excluded by `.gitignore` |
| `storage/` | Generated Media | Rendered MP4 videos, thumbnails, and audio assets | Excluded by `.gitignore` |
| Temporary backup directories | Backup Artifacts | `D:\Projects\SIMPLYYTR_BACKUP_*` (outside repo) | Located outside Git repository boundary |

---

## 4. Sensitive Files & Boundary Audit

A comprehensive inspection was conducted across all files proposed for inclusion:

1. **Hardcoded Secrets:**
   - `node scripts/verify_no_secrets.js` executed with exit code 0 (`Credential Guard PASSED`).
   - Inspected `apps/web/src/app/page.tsx`: Confirmed zero `process.env` references exposed to client browser.
   - Inspected `apps/web/src/app/api/pipeline/worker-job/route.ts`: Confirmed master storage credentials (`R2_SECRET_ACCESS_KEY`, etc.) are stripped from worker lease payloads.
2. **Local Machine & Workstation Paths:**
   - Inspected `apps/backend/src/services/localRenderer.ts`: Confirmed FFmpeg and font discovery use environment variables (`FFMPEG_PATH`), relative project paths, or system defaults. No hardcoded `C:\Users\Hp\...` paths exist.
   - Inspected `scripts/local_db.js`: Confirmed database paths are resolved relative to `__dirname`.
3. **Environment-Specific Settings:**
   - Web API routes (`trigger`, `worker-job`, `webhook`) rely on `process.env.PIPELINE_SECRET` and `process.env.DATABASE_URL`.
   - GitHub Actions workflows (`content_pipeline.yml`, `render-worker.yml`) explicitly reference `${{ secrets.PIPELINE_SECRET }}` and fail closed if unconfigured.

---

## 5. Comparative Analysis with Prior Build-Readiness Reports

| Audit Dimension | Phase 5E Report (2026-10-15) | Phase 5L.2 Final Audit (2026-10-18) | Current Phase 5M.1 Manifest (2026-10-18) | Reconciliation Analysis |
|---|---|---|---|---|
| **Tracked Modified Files** | 33 files | 36 files | **36 files** | +3 files added in Phase 5K (`package.json`, `package-lock.json`, `apps/uploader-agent/package.json`) for vulnerability fixes. |
| **Untracked Workspace Files** | 33 files | 42 files | **43 files** | +10 files added: 9 post-5E audit/recovery reports + current manifest review report. |
| **Specification Kit** | 39 files | 39 files | **39 files** | Contained entirely within `SIMPLYYTR_2_0_BUILD_READY_KIT/`. Unchanged. |
| **Total Inventory Under Review** | 105 files | 117 files | **118 files** | Complete, unbroken lineage of every tracked and untracked file. |
| **Automated Assertions** | 159 passed (100%) | 159 passed (100%) | **159 passed (100%)** | Verified reproducible across all 7 test suites + 1 workflow test. |
| **Database Status** | Running (Local) | Stopped cleanly (PostgreSQL 18.4) | **Stopped cleanly (Port 5432 unbound)** | Verified 0 schema drift, 10 tables preserved, WAL recovery complete. |
| **Dependency Advisories** | 26 audit nodes | 14 nodes (2 root advisories) | **14 nodes (2 root advisories)** | Remediated `qs`, `body-parser`, `browserslist`, `baseline-browser-mapping`, `extract-zip`. |

---

## 6. Dependency Security Audit & Production Exposure Review

Fresh structured audits captured in `scratch/phase5l_2_evidence/` establish the exact dependency posture:

1. **Full Tree (`npm audit --json`):** 14 High-severity nodes (0 Critical, 0 Moderate, 0 Low).
2. **Production Tree (`npm audit --omit=dev --json`):** 7 High-severity nodes (0 Critical, 0 Moderate, 0 Low).
3. **Root Advisory 1 — `basic-ftp@5.3.1` (GHSA-c475-qrg2-pj4r):**
   - **Affects:** Production tree under `apps/uploader-agent` (`puppeteer -> @puppeteer/browsers -> proxy-agent -> pac-proxy-agent -> get-uri@8.0.1 -> basic-ftp@5.3.1`).
   - **Path Nodes:** 1 direct advisory + 6 metavulnerability parent nodes = **7 production vulnerability nodes**.
   - **Why it cannot be patched locally:** Upstream `get-uri@8.0.1` pins `^5.3.1`. Upstream version `basic-ftp@6.2.1+` introduces breaking API changes not yet adopted by `get-uri`. Downgrading Puppeteer to `20.3.0` breaks Chrome 120+ compatibility.
   - **Runtime Exposure:** SIMPLYYTR contains zero FTP endpoints and zero PAC proxy usage. The desktop uploader does not connect to FTP servers.
   - **Disposition:** **Dormant Residual Risk requiring formal owner risk acceptance**.
4. **Root Advisory 2 — `braces@3.0.3` (GHSA-vfj7-8cjw-p6xm):**
   - **Affects:** Development-only tree (`ts-node-dev` and `eslint-config-next`).
   - **Path Nodes:** 1 direct advisory + 6 metavulnerability parent nodes = **7 development vulnerability nodes**.
   - **Why it cannot be patched locally:** Unpatched in the npm ecosystem (`3.0.3` is latest published version).
   - **Runtime Exposure:** 100% absent from production bundles (`npm audit --omit=dev` yields 0 occurrences; 0 traces in `apps/backend/dist` and `apps/web/.next`).
   - **Disposition:** **Build-Time Only Risk requiring owner risk acceptance**.

---

## 7. Status of Remote Pre-Conditions

In accordance with strict safety guidelines, remote production systems were not accessed or altered. The following gates remain classified as **`UNVERIFIED`**:

1. **Remote Secrets Cutover (Gate 5):** `UNVERIFIED`. The rotated 64-character hex `PIPELINE_SECRET` is verified in local `.env`, but cutover to GitHub Actions Secrets and Vercel Project Environment Variables requires owner action.
2. **Remote Production Database Provisioning (Gate 2):** `UNVERIFIED`. Local database baseline is verified (`0_init`, 0 schema drift), but remote hosted PostgreSQL (Supabase/Neon) has not been provisioned.
3. **External Credential Revocation (Gate 6):** `UNVERIFIED`. Historical YouTube OAuth Client Secret deletion and Google session revocation were reported by the owner via the Google Cloud Console; remote vendor status cannot be verified via local telemetry.
4. **Live Deployment Smoke Testing:** `UNVERIFIED`. End-to-end HTTP ingress verification on `simplyytr.vercel.app` cannot be performed until remote database and secrets are provisioned.

---

## 8. Prioritized Blocker List for Release `v2.0.0-rc1`

### Priority 0 (P0) — Hard Release Blockers (Must be resolved before deployment)
1. **Remote Secrets Cutover:** Populate `PIPELINE_SECRET`, database URL, and authentication secrets into Vercel Project Environment Variables and GitHub Actions Secrets.
2. **Remote Production Database Provisioning:** Provision hosted PostgreSQL instance and execute `npx prisma migrate deploy` to initialize schema `0_init`.
3. **Repository Release Commit & Tagging:** Review proposed manifest, stage approved files, commit, and tag `v2.0.0-rc1` under explicit owner authorization.

### Priority 1 (P1) — Security & Architecture Owner Decisions
4. **Owner Risk Acceptance of Residual Dependencies:** Formal sign-off on retaining `basic-ftp@5.3.1` (dormant under desktop uploader) and `braces@3.0.3` (unpatched upstream, devDependency only).
5. **Owner Decision on Specification Kit:** Choose Option A (stage `SIMPLYYTR_2_0_BUILD_READY_KIT/` on `main`) or Option B (preserve on dedicated documentation branch).

### Priority 2 (P2) — Post-Deployment Verification
6. **Live Staging Smoke Test:** Verify authenticated health check and worker lease on live Vercel deployment URL.

---

## 9. Smallest Safe Next Step

### Phase 5M.2: Owner Alignment & Staging Execution

#### Objective:
Present the finalized release manifest to the repository owner, obtain decisions on the two P1 items (specification kit disposition and dependency risk sign-off), and upon explicit command, stage the approved files for `v2.0.0-rc1`.

#### Exact Acceptance Criteria:
1. Owner provides decision on `SIMPLYYTR_2_0_BUILD_READY_KIT/` (Option A vs Option B).
2. Owner formally accepts residual dependency risk for `basic-ftp` and `braces`.
3. Upon explicit owner command, stage the approved manifest files (excluding `.env`, build caches, local database data, and temporary scratch files).
4. Run `git status` to verify that staged changes match the approved manifest exactly.
5. Create annotated tag `v2.0.0-rc1` and release commit.

---

## 10. Explicit Actions Not Taken in This Phase

- Zero files were staged, committed, tagged, pushed, or deployed.
- Zero Git history rewrites (`git reset`, `git clean`, `git stash`) were executed.
- Zero dependencies were installed, updated, or removed.
- PostgreSQL remained cleanly stopped (port 5432 unbound).
- Zero remote services, Vercel deployments, or GitHub repository settings were modified.
- Zero secret values from `.env` were printed or exposed.
