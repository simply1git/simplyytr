# Architecture Decision Records (ADRs)

## D-0001 Builder portability
- **Context:** Antigravity, Codex, Cursor, Claude Code, Cline, Copilot may be used interchangeably.
- **Decision:** Project knowledge, state, and task contracts must live in repository-controlled canonical files (`.agent/`, `docs/`, `schemas/`), never in a builder's private chat history.
- **Status:** APPROVED & IMPLEMENTED (2026-10-08)

## D-0002 Provider independence
- **Context:** Paid APIs may become unavailable, rate-limited, or unwanted.
- **Decision:** SIMPLYYTR decides WHAT; pluggable providers decide HOW. The core platform must operate with 0 paid cloud AI keys.
- **Status:** APPROVED (2026-10-08)

## D-0003 Modular monolith first
- **Context:** Early microservice architectures create unnecessary network latency, deployment overhead, and failure modes.
- **Decision:** Build SIMPLYYTR 2.0 as a modular monolith in Python (FastAPI) with PostgreSQL + pgvector, deploying workers only for heavy compute.
- **Status:** APPROVED (2026-10-08)

## D-0004 Clean Core Rebuild over Legacy Patching
- **Context:** Phase 0 audit revealed dual conflicting backends (Express vs Next.js API), broken imports, committed Chrome session profiles, hardcoded fallback secrets, and Content ID evasion scraping in `simply1git/simplyytr`.
- **Decision:** Do not patch or build directly on top of legacy Node/Express/Puppeteer backend. Build SIMPLYYTR 2.0 clean in `apps/core` (FastAPI) and selectively migrate only reusable components (CSS styling, Zod schemas, FFmpeg filters, prompt structures).
- **Status:** APPROVED in Phase 0 (2026-10-09)

## D-0005 Official YouTube Data API over Stealth Browser Automation
- **Context:** Legacy codebase uses Puppeteer stealth to automate YouTube Studio shadow DOM, posing severe account termination risks.
- **Decision:** Strictly use official YouTube Data API v3 resumable uploads with standard OAuth 2.0 authorization codes and automated synthetic media disclosures.
- **Status:** APPROVED in Phase 0 (2026-10-09)
