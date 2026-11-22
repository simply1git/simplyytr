# Phase 0 — Forensic Audit Task

## Mission
Understand the legacy `simply1git/simplyytr` repository before changing it.

## Required inspection
- full directory tree
- package manifests and lockfiles
- Docker and deployment files
- environment templates
- GitHub Actions
- database schemas/migrations
- backend/frontend structure
- workers
- rendering/media pipeline
- publishing/uploader code
- analytics/learning logic
- tests and scripts

## Security audit
Find secrets, hardcoded tokens, OAuth handling, shell execution, browser automation, stealth tooling, unrestricted file access, unsafe upload paths, writable audit logs and insecure mounts.

## Licensing audit
Record exact licenses and flag unknown, copyleft, non-commercial or source-available restrictions.

## Migration classification
For every important component: KEEP / REFACTOR / ADAPT / REPLACE / DELETE / UNKNOWN.

## Legacy hazards to verify
- stealth uploader
- synthetic/fake analytics
- forced publishing behavior
- hardcoded product/coupon data
- fake retention
- paid-service assumptions
- vendor coupling
- SQLite/Prisma leftovers
- old cron/job architecture
- temporary/duplicate directories

## Deliverables
Create:
- `docs/audit/PHASE_0_FORENSIC_AUDIT.md`
- `docs/audit/MIGRATION_MATRIX.md`
- `docs/audit/SECURITY_FINDINGS.md`
- `docs/audit/LICENSE_FINDINGS.md`
- `docs/audit/PHASE_1_PLAN.md`

Do not delete code during the audit.
