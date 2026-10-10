# SIMPLYYTR 2.0 — Build Readiness Master Plan

## Goal
Turn the frozen SIMPLYYTR specification into a production-capable implementation through an AI-assisted, builder-portable engineering workflow.

## Development architecture

```text
YOU
  -> GitHub (source of truth)
  -> Lead Builder (Antigravity / Codex)
  -> bounded task workstreams
  -> branches/worktrees
  -> CI + independent review (Codex / Claude / Cursor)
  -> merge
```

Do not make SIMPLYYTR dependent on any builder's private chat memory.

## Frozen application architecture
- Frontend: Next.js, React, TypeScript, Tailwind
- Backend: Python, FastAPI
- Database: PostgreSQL + pgvector
- ORM/migrations: SQLAlchemy 2.x + Alembic
- Validation: Pydantic
- Brain: LangGraph or equivalent stateful workflow layer + custom policy/decision/memory/evaluation layers
- Research: Crawl4AI + Playwright + official APIs/feed connectors
- Local AI: Ollama, vLLM for GPU workers, Qwen family, faster-whisper, Kokoro/Piper, vision/OCR stack
- Media: FFmpeg + canonical SIMPLYYTR Timeline IR
- Observability: OpenTelemetry + Langfuse/equivalent
- Deployment: Docker Compose first; modular monolith + workers
- Compute: local + optional free GPU workers + optional paid workers through a common Compute Fabric

## Builder portability
The project must preserve:
- specification version/hash
- Git commit/branch
- active phase/task
- blockers
- next actions
- decisions
- lessons
- incidents
- test results
- changed files
- artifacts
- environment requirements
- builder/model metadata

Never transfer secrets, tokens, cookies or credentials.

## Phases
0. forensic audit
1. foundation
2. jobs and compute fabric
3. signal/research engine
4. evidence/knowledge graph
5. content compiler
6. media generation/render/QC
7. affiliate/commerce
8. publishing
9. analytics
10. learning/experiments
11. autonomous brain
12. production hardening

## First vertical slice
Research -> Signal -> Opportunity -> Evidence -> Concept -> Script -> Scene Plan -> Voice -> Render -> QC -> Publish-ready package.

Then close the loop: Publish -> Analytics -> Postmortem -> Learning -> Strategy update.

## Engineering rule
Plan -> implement -> test -> review -> fix -> document -> checkpoint.
