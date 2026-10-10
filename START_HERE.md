# SIMPLYYTR 2.0 — Build-Ready Kit

This package connects the frozen product specification to the coding builder that will implement it.

## Source of truth
- `SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md`
- `docs/build-readiness/BUILD_READINESS_MASTER_PLAN.md`
- Git history
- executable tests

## Builder strategy
Use a lead builder plus an independent reviewer. Current candidates are Antigravity, Codex, Cursor and Claude Code; Cline, Copilot, OpenHands and Aider remain alternatives.

## First action
Run `docs/build-readiness/PHASE_0_FORENSIC_TASK.md`. Do not start broad implementation until the legacy repo is inventoried and migration decisions are documented.

## Portability requirement
The repository carries its own current state, decisions, lessons, incidents, task contracts, skills and transfer manifests under `.agent/` and `.agents/skills/`. Builder-specific adapters are thin wrappers.
