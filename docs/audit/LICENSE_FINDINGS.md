# SIMPLYYTR 2.0 — Dependency & Open-Source License Due Diligence

**Date:** 2026-10-09  
**Auditor:** Antigravity (Senior Technical Researcher & Systems Architect)  
**Status:** COMPLETED FORENSIC AUDIT  
**Scope:** NPM manifests, Python requirements, embedded repositories, proposed technology stack, and AI model weights.  

---

## 1. Executive Summary

A comprehensive licensing and dependency audit was performed across all package manifests ([package.json](file:///D:/Projects/SIMPLYYTR/package.json), [apps/backend/package.json](file:///D:/Projects/SIMPLYYTR/apps/backend/package.json), [apps/web/package.json](file:///D:/Projects/SIMPLYYTR/apps/web/package.json), [apps/uploader-agent/package.json](file:///D:/Projects/SIMPLYYTR/apps/uploader-agent/package.json), [packages/database/package.json](file:///D:/Projects/SIMPLYYTR/packages/database/package.json), [kaggle-worker/requirements.txt](file:///D:/Projects/SIMPLYYTR/kaggle-worker/requirements.txt)) and the proposed SIMPLYYTR 2.0 technology selection matrix ([docs/build-readiness/OSS_TECHNOLOGY_SELECTION_MATRIX.md](file:///D:/Projects/SIMPLYYTR/docs/build-readiness/OSS_TECHNOLOGY_SELECTION_MATRIX.md)).

### Critical Findings:
1. **SadTalker Model Weights:** While SadTalker code is licensed under Apache 2.0, its standard pre-trained checkpoints depend on 3DMM (BFM) and GFPGAN face restoration weights which carry **non-commercial research restrictions**. Using the default pre-trained weights in a commercial content production system creates copyright and license compliance liability.
2. **Remotion License Restrictions:** Remotion is **source-available**, not open source. It is free for individuals or teams of up to 3 people, but requires a paid Company License for teams of 4 or more. It cannot serve as the core rendering engine for SIMPLYYTR without licensing costs. FFmpeg + custom Timeline IR remains the canonical, unrestricted core.
3. **Kokoro TTS & espeak-ng:** Kokoro-82M model weights are Apache 2.0 (commercial use permitted), but standard phonemizer pipelines depend on `espeak-ng`, which is **GPLv3**. When packaging local TTS, phonemizer dependencies must be isolated via a clean CLI/process boundary or alternative phonemizers (e.g., Misaki) to prevent GPL copyleft contamination of proprietary application code.
4. **OpenVoice V2:** As of April 2024, Myshell released OpenVoice V2 under the **MIT License**, permitting unrestricted commercial use.
5. **Crawl4AI Attribution Requirement:** Crawl4AI is licensed under Apache 2.0 but includes an explicit **mandatory attribution clause** requiring credit badges in documentation/websites for derivative works.

---

## 2. Complete Dependency & License Inventory

### 2.1 Node.js / TypeScript Ecosystem (NPM)

| Package | Version | Direct/Transitive | License | Commercial Compatibility | Role in SIMPLYYTR | Recommendation | Evidence / Source |
|---|---|---|---|---|---|---|---|
| **next** | `16.2.9` | Direct (`apps/web`) | MIT | Permitted | Frontend Web Framework | **KEEP** | Standard Next.js MIT license |
| **react** | `19.2.4` | Direct (`apps/web`) | MIT | Permitted | UI Rendering Engine | **KEEP** | React MIT license |
| **react-dom** | `19.2.4` | Direct (`apps/web`) | MIT | Permitted | DOM Binder | **KEEP** | React MIT license |
| **tailwindcss** | `^4` | Direct (`apps/web`) | MIT | Permitted | Utility CSS Styling | **KEEP** | Tailwind CSS MIT license |
| **@tailwindcss/postcss** | `^4` | Direct (`apps/web`) | MIT | Permitted | PostCSS integration | **KEEP** | PostCSS Tailwind plugin |
| **react-hot-toast** | `^2.6.0` | Direct (`apps/web`) | MIT | Permitted | UI Notifications | **KEEP** | MIT license |
| **zod** | `^4.4.3` | Direct (`apps/web`) | MIT | Permitted | Client Validation | **KEEP** | Zod MIT license |
| **@prisma/client** | `^5.22.0` | Direct (`backend`, `web`, `database`) | Apache-2.0 | Permitted | Legacy Database Client | **REPLACE** | Migrating to Python SQLAlchemy 2.x in 2.0 |
| **prisma** | `^5.22.0` | Dev (`database`) | Apache-2.0 | Permitted | Legacy ORM CLI | **REPLACE** | Migrating to Alembic in 2.0 |
| **@aws-sdk/client-s3** | `^3.1081.0` | Direct (`apps/web`) | Apache-2.0 | Permitted | S3/R2 Object Storage | **REPLACE** | Moving storage operations to Python backend |
| **express** | `^4.18.2` | Direct (`apps/backend`) | MIT | Permitted | Legacy Backend | **REPLACE** | Replacing with Python/FastAPI modular monolith |
| **cors** | `^2.8.5` | Direct (`apps/backend`) | MIT | Permitted | HTTP CORS middleware | **REPLACE** | Using FastAPI CORS middleware in 2.0 |
| **dotenv** | `^16.4.5` | Direct (`backend`, `uploader`) | BSD-2-Clause | Permitted | Env Loader | **REPLACE** | Using Pydantic `BaseSettings` in Python |
| **fluent-ffmpeg** | `^2.1.3` | Direct (`apps/backend`) | MIT | Permitted | Legacy FFmpeg CLI Wrapper | **REPLACE** | Moving media operations to Python subprocess/FFmpeg |
| **googleapis** | `^173.0.0` | Direct (`apps/backend`) | Apache-2.0 | Permitted | Google/YouTube Client | **REPLACE** | Moving to `google-api-python-client` in FastAPI |
| **@google/generative-ai**| `^0.24.1` | Direct (`apps/backend`) | Apache-2.0 | Permitted | Gemini LLM SDK | **OPTIONAL** | Replace with pluggable provider adapter |
| **node-cron** | `^4.5.0` | Direct (`apps/backend`) | ISC | Permitted | Cron Scheduler | **REPLACE** | Replacing with persistent database job runner |
| **bullmq** | `^5.7.1` | Direct (`apps/backend`) | MIT | Permitted | Redis Queue Wrapper | **REPLACE** | BullMQ is unused in current backend; migrating to Python jobs |
| **ioredis** | `^5.3.2` | Direct (`apps/backend`) | MIT | Permitted | Redis Client | **REPLACE** | Unused in active routes |
| **puppeteer** | `^25.2.1` | Direct (`backend`, `uploader`) | Apache-2.0 | Permitted | Headless Browser | **DELETE** | Deprecating stealth upload automation |
| **puppeteer-extra** | `^3.3.6` | Direct (`backend`, `uploader`) | MIT | Permitted | Puppeteer Plugins | **DELETE** | Deprecating stealth upload automation |
| **puppeteer-extra-plugin-stealth** | `^2.11.2` | Direct (`backend`, `uploader`) | MIT | Permitted | Stealth Evasion Plugin | **DELETE** | Deprecating stealth upload automation |
| **concurrently** | `^10.0.3` | Dev (Root) | MIT | Permitted | Dev Process Runner | **REPLACE** | Replacing with docker compose / standard scripts |

---

### 2.2 Python Ecosystem & Worker Libraries

| Package | Version / Source | License | Commercial Compatibility | Proposed SIMPLYYTR Role | Recommendation | Risk & Notes |
|---|---|---|---|---|---|---|
| **fastapi** | Proposed | MIT | Permitted | Core Modular Monolith API | **ADOPT (Phase 1)** | High maturity, async, Pydantic native |
| **uvicorn** | Proposed | BSD-3-Clause | Permitted | ASGI Web Server | **ADOPT (Phase 1)** | Standard FastAPI runner |
| **pydantic** | `^2.0` Proposed | MIT | Permitted | Core Data Models & Validation | **ADOPT (Phase 1)** | High performance, strict typing |
| **sqlalchemy** | `^2.0` Proposed | MIT | Permitted | Relational Database ORM | **ADOPT (Phase 1)** | Industry standard, async PostgreSQL support |
| **alembic** | Proposed | MIT | Permitted | Database Migrations | **ADOPT (Phase 1)** | Schema version control |
| **asyncpg** | Proposed | Apache-2.0 | Permitted | Async PostgreSQL Driver | **ADOPT (Phase 1)** | High-throughput DB connector |
| **pgvector** | Proposed | PostgreSQL License | Permitted | Vector Similarity Search | **ADOPT (Phase 1)** | Permissive vector storage in PostgreSQL |
| **crawl4ai** | Proposed | Apache-2.0 | Permitted (Attribution Req.) | Web Ingestion & Research | **OPTIONAL (Phase 3)** | Mandatory attribution badge in docs/UI |
| **playwright** | Proposed | Apache-2.0 | Permitted | Headless Research Browser | **ADOPT (Phase 3)** | Modern browser automation (research only) |
| **faster-whisper** | `kaggle-worker` / `SYSTRAN` | MIT | Permitted | Speech-to-Text Transcription | **KEEP / ADOPT** | Highly efficient CTranslate2 implementation |
| **edge-tts** | `kaggle-worker` | GPL-3.0 | **CAUTION: Copyleft** | Speech Synthesis (Cloud) | **REPLACE** | GPL-3.0; cloud-dependent; replace with Kokoro/Piper |
| **boto3** | `kaggle-worker` | Apache-2.0 | Permitted | S3/R2 Object Storage | **KEEP / ADOPT** | Standard AWS/S3 client |
| **yt-dlp** | `kaggle-worker` | The Unlicense | Public Domain | Media Metadata Extraction | **REFACTOR** | Do not use for unauthorized media downloads; metadata only |
| **Pillow** | `kaggle-worker` | HPND | Permitted | Image Processing | **KEEP / ADOPT** | Permissive imaging library |
| **srt** | `kaggle-worker` | MIT | Permitted | Subtitle Formatting | **KEEP / ADOPT** | Lightweight SRT parsing |
| **moviepy** | `1.0.3` (`kaggle-worker`) | MIT | Permitted | Video Composition | **REPLACE** | High memory usage; replace with native FFmpeg Timeline IR |

---

### 2.3 AI Models & Media Weights

| Technology / Model | Source / Checkpoint | License | Commercial Use | Restrictions & Caveats | SIMPLYYTR Role | Recommendation |
|---|---|---|---|---|---|---|
| **Kokoro-82M** | `hexgrad/Kokoro-82M` | Apache-2.0 | **Permitted** | Weights are Apache 2.0; however `espeak-ng` dependency is GPLv3. Must isolate phonemizer. | Local Speech Synthesis (TTS) | **ADOPT (Phase 6)** |
| **Piper TTS** | `rhasspy/piper` | MIT | **Permitted** | Highly optimized C++ TTS engine; fast on CPU. | Local Speech Synthesis Fallback | **ADOPT (Phase 6)** |
| **SadTalker** | `OpenTalker/SadTalker` | Apache-2.0 (Code) | **RESTRICTED** | Pre-trained weights (BFM, GFPGAN) have non-commercial research restrictions. | Avatar Generation | **REPLACE / OPTIONAL** |
| **OpenVoice V2** | `myshell-ai/OpenVoice` | MIT | **Permitted** | V2 weights and code released under MIT (April 2024). Commercial use allowed. | Voice Cloning Adapter | **OPTIONAL (Phase 6)** |
| **Remotion** | `remotion-dev/remotion` | Source-Available | **RESTRICTED** | Free up to 3 users; paid Company License required for 4+ users. Not OSI open source. | Video Renderer | **DO NOT ADOPT IN CORE** (Keep as optional adapter only) |
| **Qwen 2.5 Family** | Alibaba Cloud / HuggingFace | Apache-2.0 | **Permitted** | Qwen 2.5 models under 72B are fully open under Apache 2.0 for commercial deployment. | Local LLM Core (Ollama/vLLM) | **ADOPT (Phase 3)** |
| **Langfuse** | `langfuse/langfuse` | MIT (Core) | **Permitted** | Core tracing & evals are MIT; enterprise features are proprietary. | Telemetry & LLM Traces | **ADOPT (Phase 1)** |

---

## 3. Compliance Verification Checklist

- [x] All licenses verified against authoritative source repositories (GitHub / PyPI / NPM).
- [x] Model weight licenses distinguished from source code licenses.
- [x] Source-available and copyleft constraints flagged (Remotion, SadTalker, edge-tts, espeak-ng).
- [x] Commercial viability confirmed for core proposed Phase 1 stack (FastAPI, PostgreSQL, pgvector, SQLAlchemy, Alembic, Next.js).
- [x] No dependencies executed or installed during Phase 0 audit.
