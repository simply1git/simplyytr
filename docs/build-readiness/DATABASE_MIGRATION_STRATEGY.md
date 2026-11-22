# SIMPLYYTR 2.0 — Database Migration & Versioning Strategy

## 1. Baseline Assessment

- **Database Engine:** PostgreSQL 18.4 (Isolated local native binaries via `@embedded-postgres`).
- **ORM / Schema Tool:** Prisma ORM 5.22 (`packages/database/prisma/schema.prisma`).
- **Initial Setup:** Schema was initialized using `prisma db push` to synchronize tables directly to `simplyytr_dev`.
- **Target Architecture:** Transition from ad-hoc schema pushing to versioned, reproducible, non-destructive SQL migrations.

---

## 2. Transition Execution Record (Phase 4C.1 — Completed)

The migration baseline was formalized and verified without dropping tables, resetting the local development database, or losing data:

### Step 1: Baseline Migration SQL & Lockfile Generated
Generated deterministic DDL from the Prisma datamodel without executing against the database:
- **Migration Path:** `packages/database/prisma/migrations/0_init/migration.sql`
- **Lockfile Path:** `packages/database/prisma/migrations/migration_lock.toml` (`provider = "postgresql"`)
- **DDL Inspection:** 9 application models, 5 foreign key constraints, 14 indexes, zero destructive drops or extensions.

### Step 2: Isolated Database Validation (`simplyytr_migration_test`)
A separate, isolated database (`simplyytr_migration_test`) was created and used to validate the baseline migration from scratch:
- **Migration Application:** `npx prisma migrate deploy --schema packages/database/prisma/schema.prisma` successfully applied `0_init`.
- **Migration Status Check:** `npx prisma migrate status` confirmed database schema is up to date with 0 pending migrations.
- **Drift Verification:** `npx prisma migrate diff --from-schema-datamodel ... --to-schema-datasource ...` returned exit code 0 (`No difference detected.`).
- **Object Inspection:** Verified all 10 tables (including `_prisma_migrations`), 5 foreign keys, and 14 indexes.
- **Cleanup:** Isolated test database dropped cleanly after verification.
- **Environment Note:** When `directUrl` is configured in `schema.prisma`, Prisma Migrate requires both `DATABASE_URL` and `DIRECT_URL` to be pointed at the target test database.

### Step 3: Existing Development Database Reconciliation (`simplyytr_dev`)
Non-destructive inspection confirmed zero schema drift between `schema.prisma` and `simplyytr_dev`. The baseline was marked applied:
```bash
npx prisma migrate resolve --applied 0_init --schema packages/database/prisma/schema.prisma
```
- **Result:** `Migration 0_init marked as applied.`
- **Status Check:** `npx prisma migrate status` confirmed `Database schema is up to date!`.
- **Data Integrity:** 100% of existing table rows preserved (all `RenderJob` and `SystemSettings` rows intact).

### Step 4: Incremental Future Changes
For all future schema modifications, developers must run:
```bash
npx prisma migrate dev --name <descriptive_change_name> --schema packages/database/prisma/schema.prisma
```
This ensures Prisma creates an incremental timestamped migration folder with deterministic forward SQL (`migration.sql`).

---

## 3. Strict Prohibitions

1. **NO `prisma db push --accept-data-loss`:** Prohibited across all environments. Drops columns and recreates tables unpredictably.
2. **NO `prisma migrate reset`:** Prohibited on development or staging databases containing state. Wipes database data completely.
3. **NO Production Migration Execution from Local Scripts:** Production migrations must only execute during CI/CD deploy steps via `npx prisma migrate deploy`.

---

## 4. Operational Health & Commands

| Action | Canonical Command |
| :--- | :--- |
| **Start Database** | `npm run db:start` |
| **Stop Database** | `npm run db:stop` |
| **Database Status** | `npm run db:status` |
| **Run Regression Suite** | `npm test` |
| **Security Suite** | `npm run test:security` |
| **Content Pipeline Suite** | `npm run test:pipeline` |
| **Credential Guard** | `node scripts/verify_no_secrets.js` |
| **Build Web** | `npm run build --workspace=web` |
| **Build Backend** | `npm run build --workspace=@youtubbot/backend` |
