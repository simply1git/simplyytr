# SIMPLYYTR 2.0 — Build-Ready Kit Integration Conflicts & Resolutions

**Date:** 2026-10-09  
**Auditor:** Antigravity (Lead Systems Architect)  
**Status:** RECONCILED & DOCUMENTED  
**Authority:** [docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md](file:///D:/Projects/SIMPLYYTR/docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md)  

---

## 1. Overview

During the integration of the SIMPLYYTR 2.0 Build-Ready Kit into the existing `simply1git/simplyytr` repository, several real discrepancies and structural tensions between the legacy workspace and the kit specifications were identified. In accordance with the Integration Rules (Section 2), no legacy files were overwritten or silently discarded. All conflicts are cataloged below with risk assessments and resolutions.

---

## 2. Identified Conflicts & Discrepancies

### Conflict 1: Canonical Specification Location
- **Kit Source:** [SIMPLYYTR_2_0_BUILD_READY_KIT/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md](file:///D:/Projects/SIMPLYYTR/SIMPLYYTR_2_0_BUILD_READY_KIT/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md)
- **User Prompt Expectation:** Expected at [docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md](file:///D:/Projects/SIMPLYYTR/docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md) or workspace root.
- **Risk:** Relative path broken links across documentation ([START_HERE.md](file:///D:/Projects/SIMPLYYTR/START_HERE.md), [AGENTS.md](file:///D:/Projects/SIMPLYYTR/AGENTS.md), builder prompts).
- **Resolution:** During kit integration, the authoritative frozen specification was placed in both locations:
  1. [SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md](file:///D:/Projects/SIMPLYYTR/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md) (Workspace root)
  2. [docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md](file:///D:/Projects/SIMPLYYTR/docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md) (Inside canonical docs)
  Both files are identical in content and verified against the kit SHA256 hash (`b59ef0a5e4c11ccbe6c1e62539e75b65d97872353c8df59397948cc4ba6ff78f`).

---

### Conflict 2: Database Technology Collision (SQLite vs PostgreSQL + pgvector)
- **Legacy Files:**
  - [Dockerfile#L19](file:///D:/Projects/SIMPLYYTR/Dockerfile#L19): `# Generate Prisma Client (SQLite)`
  - [docker-compose.yml#L10](file:///D:/Projects/SIMPLYYTR/docker-compose.yml#L10): `./packages/database/dev.db:/app/packages/database/dev.db`
  - [deploy.sh#L29](file:///D:/Projects/SIMPLYYTR/deploy.sh#L29): `touch packages/database/dev.db`
  - [packages/database/prisma/schema.prisma#L4](file:///D:/Projects/SIMPLYYTR/packages/database/prisma/schema.prisma#L4): `provider = "postgresql"`
- **Kit & 2.0 Specification:** Mandates PostgreSQL 16 with `pgvector` extension and SQLAlchemy 2.x async ORM.
- **Risk:** Attempting to start the legacy container fails or creates an unmigrated empty SQLite file while the backend application crashes trying to connect to PostgreSQL via `DATABASE_URL`.
- **Resolution:**
  - In Phase 0: Preserve all existing files without modification.
  - In Phase 1: Retire legacy Dockerfile and Compose mounts; provide clean `docker-compose.yml` that provisions an official PostgreSQL 16 container with `pgvector/pgvector:pg16` image.

---

### Conflict 3: Dual Backend Architecture vs Single Modular Monolith
- **Legacy Workspace:** Contains two active, divergent backend services:
  1. [apps/backend](file:///D:/Projects/SIMPLYYTR/apps/backend): Express + TypeScript on port 3001 with node-cron.
  2. [apps/web/src/app/api](file:///D:/Projects/SIMPLYYTR/apps/web/src/app/api): Next.js App Router API routes on port 3000.
- **Kit & 2.0 Specification:** Mandates a single Python / FastAPI modular monolith for domain logic, background jobs, and AI workflows. Next.js is strictly a frontend HUD.
- **Risk:** Confusion over which backend controls pipeline state, leading to split-brain database updates.
- **Resolution:**
  - In Phase 0: Both implementations audited and mapped in [docs/audit/MIGRATION_MATRIX.md](file:///D:/Projects/SIMPLYYTR/docs/audit/MIGRATION_MATRIX.md).
  - In Phase 1: New FastAPI core will be established in `apps/core/`. Next.js API routes will be deprecated and proxy directly to FastAPI `/api/v1`.

---

### Conflict 4: YouTube Publishing Strategy (Puppeteer Stealth vs Official Data API)
- **Legacy Code:**
  - [apps/uploader-agent/index.js](file:///D:/Projects/SIMPLYYTR/apps/uploader-agent/index.js) (748 LOC): Puppeteer stealth automation of YouTube Studio web interface.
  - [login_youtube.bat](file:///D:/Projects/SIMPLYYTR/login_youtube.bat): Manual login into genuine Chrome profile to harvest session cookies.
  - [apps/backend/src/queue/youtubePublisher.ts](file:///D:/Projects/SIMPLYYTR/apps/backend/src/queue/youtubePublisher.ts): Uses Puppeteer uploader.
- **Kit & 2.0 Specification:** Section 2.2 and Section 12 strictly forbid stealth browser automation as a core mechanism. Mandates official YouTube Data API v3 OAuth resumable uploads with explicit altered/synthetic media disclosures.
- **Risk:** Account termination, bot detection bans, and persistent breakage due to YouTube Studio DOM updates.
- **Resolution:**
  - In Phase 0: Stealth tools quarantined and classified as `DELETE`.
  - In Phase 1 & Phase 8: Implement standard OAuth 2.0 authorization code flow with offline access (refresh token) and YouTube Data API v3 client.

---

### Conflict 5: Copyright Evasion Pipeline vs Original Content & Provenance Policy
- **Legacy Code:**
  - [kaggle-worker/video_generator.py](file:///D:/Projects/SIMPLYYTR/kaggle-worker/video_generator.py): Downloads other creators' shorts from YouTube and Bilibili, combines with split-screen gameplay.
  - [apps/backend/src/queue/editorQueue.ts#L104-L105](file:///D:/Projects/SIMPLYYTR/apps/backend/src/queue/editorQueue.ts#L104-L105): Alters speed to 1.05x, adds color scrambles (`eq=brightness=0.01:contrast=1.02:saturation=1.05`), and text overlays to evade Content ID.
- **Kit & 2.0 Specification:** Section 1 and Section 2.2 explicitly prohibit unauthorized reposting, split-screen spam, and Content ID evasion. Requires first-party evidence, verified licenses, and authentic originality.
- **Risk:** Channel strikes, copyright takedowns, and ineligibility for YouTube Partner Program monetization.
- **Resolution:**
  - In Phase 0: Scrambling filters identified as dangerous non-compliant code.
  - In Phase 1+: SIMPLYYTR will only produce original scripts derived from verified research signals, rendered using licensed stock, generative visuals, or authorized owned media.

---

### Conflict 6: Missing Module in Legacy Backend (`puppeteerUploader.ts`)
- **Legacy Files Affected:**
  - [apps/backend/src/routes/publish.ts#L7](file:///D:/Projects/SIMPLYYTR/apps/backend/src/routes/publish.ts#L7): `import { uploadViaPuppeteer } from '../services/puppeteerUploader';`
  - [apps/backend/src/queue/youtubePublisher.ts#L3](file:///D:/Projects/SIMPLYYTR/apps/backend/src/queue/youtubePublisher.ts#L3): `import { uploadViaPuppeteer } from '../services/puppeteerUploader';`
- **Discrepancy:** The file `apps/backend/src/services/puppeteerUploader.ts` does not exist on disk, causing `tsc` compilation failure.
- **Resolution:**
  - In Phase 0: Documented as broken code; not modified during Phase 0 to preserve existing tree.
  - In Phase 1: Module references will be removed when `apps/backend` is phased out in favor of `apps/core`.

---

### Conflict 7: Stray Nested Projects Inside Repository
- **Discovered Directories:**
  - [ytdownlod/](file:///D:/Projects/SIMPLYYTR/ytdownlod): Standalone Vite + React + Express app with Tkinter popup.
  - [simplyytr-updateed/](file:///D:/Projects/SIMPLYYTR/simplyytr-updateed): Static HTML/PNG UI mockups.
  - [kaggle_logs/](file:///D:/Projects/SIMPLYYTR/kaggle_logs) & [kaggle_pull/](file:///D:/Projects/SIMPLYYTR/kaggle_pull): Redundant duplicate files.
  - [temp_repo/free-claude-code](file:///D:/Projects/SIMPLYYTR/temp_repo): Empty folder.
- **Discrepancy:** None of these folders are part of the SIMPLYYTR 2.0 architecture.
- **Resolution:**
  - In Phase 0: Preserved and cataloged.
  - In Phase 1: Marked for removal or archival to keep the repository clean and portable.
