# Phase 1 — Foundation Tasks

## Goal
Create the stable base architecture without trying to finish the whole product.

### Repository
- monorepo structure
- lint/format/test/CI
- environment validation

### Backend
- FastAPI
- configuration
- structured logging
- health/readiness
- API versioning

### Database
- PostgreSQL
- SQLAlchemy
- Alembic
- base entities: Workspace, Channel, Provider, ModelProfile, BackgroundJob, AuditEvent

### Provider contracts
LLM, embeddings, ASR, TTS, vision, image, video, research, affiliate, publishing, compute.

### Jobs
Persistent state, retries, idempotency, cancellation, progress, logs, checkpoint metadata.

### Frontend
Shell, navigation, health/status, job monitor, audit viewer, provider/model registry.

### Portability
State files, task contracts, transfer manifest, builder adapters, status/doctor/checkpoint commands.

### Security
Secret references only, permission model, tool policy, external audit design.

## Exit criteria
A fresh developer can clone, configure, start PostgreSQL/API/web, run migrations, create a workspace, submit a test job, observe audit data, and export builder state.
