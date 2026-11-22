# SIMPLYYTR 2.0 — GitHub History Replacement Runbook & Safety Plan

**Document:** `docs/audit/GITHUB_HISTORY_REPLACEMENT_RUNBOOK.md`  
**Date:** 2026-10-13  
**Status:** DRAFT EXECUTION PLAN — AWAITING SEPARATE EXPLICIT AUTHORIZATIONS  
**Execution Mode:** STRICTLY READ-ONLY PLANNING — ZERO NETWORK CONTACT, ZERO COMMITS, ZERO PUSHES  
**Authority:** [docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md](file:///D:/Projects/SIMPLYYTR/docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md)  
**Parent Review:** [docs/audit/FINAL_PRE_PUSH_REVIEW.md](file:///D:/Projects/SIMPLYYTR/docs/audit/FINAL_PRE_PUSH_REVIEW.md)  

---

## 1. Intended Change & Objective

The objective of this procedure is to permanently sanitize the public repository (`https://github.com/simply1git/simplyytr.git`) by replacing the un-scrubbed historical commit chain on `main` with the locally verified 107-commit sanitized history.

### Concrete State Transition:
* **Target Repository:** `https://github.com/simply1git/simplyytr.git`
* **Target Ref:** `refs/heads/main`
* **Current Remote HEAD (Expected):** `ed8436f4fca6410e5c1e3b139e06fbfe2182084f` (Contains historical session DBs, Chrome profiles, and hardcoded tokens)
* **Replacement HEAD:** `b83d88ee997a4b0c948232c3c69591b8ee0c0545` (100% sanitized; fail-closed route guards, shared authentication engine, and SIMPLYYTR 2.0 specs)
* **Replacement Parent:** `188ae0ca3ea534182a94b8d7f9119cd9eeee9e32`
* **Protected Offline Backups (Immutable & Isolated):**
  * Archive Mirror: `scratch/cleanup/simplyytr-backup-ARCHIVE.git` (Frozen at `ed8436f4fca6410e5c1e3b139e06fbfe2182084f`)
  * Recovery Mirror: `scratch/cleanup/simplyytr-backup-RECOVERY.git` (Frozen at `5284d428fac3ce57e9532ba85d2ad9171a0694de`)

---

## 2. Preconditions & Verification Checklist

Before any network-contacting or network-mutating command is authorized, every precondition in this section must be explicitly verified:

### A. Repository Identity & Administrative Authority
- [ ] **Target URL Confirmation:** The target remote is strictly `https://github.com/simply1git/simplyytr.git`.
- [ ] **Operator Privileges:** The human operator is an owner or administrator of the `simply1git/simplyytr` repository with permissions to push to `main`.
- [ ] **Branch Protection Rules:** The operator has verified whether GitHub branch protection rules on `main` require temporary adjustment (e.g. enabling "Allow force pushes" for administrators) and will re-enable protection immediately post-push.

### B. Local Sanitized Mirror Integrity
- [ ] **Sanitized Mirror HEAD:** `D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git` has `refs/heads/main` pointing exactly to `b83d88ee997a4b0c948232c3c69591b8ee0c0545`.
- [ ] **Parent Lineage:** Parent commit is confirmed as `188ae0ca3ea534182a94b8d7f9119cd9eeee9e32`.
- [ ] **History Completeness:** Total commit count is exactly 107 commits.
- [ ] **Cleanliness Verification:** Reachable history contains 0 instances of Chrome profiles, session databases, private keys, `client_secret.json`, Python bytecode, or hardcoded tokens.

### C. Ref Scope & Strict Exclusion Boundaries
- [ ] **Single Ref Targeting:** Only `refs/heads/main` will be updated.
- [ ] **Zero Mirror Contamination:** Under no circumstances will old or remote history be fetched into `simplyytr-backup.git`.
- [ ] **No Tag Publication:** No historical or local tags will be pushed (`git tag -l` in mirror is empty).
- [ ] **No Secondary Branches:** Remote has only `refs/heads/main`; no secondary branches exist or will be pushed.
- [ ] **Exclusion of Protected Backups:** Neither `simplyytr-backup-ARCHIVE.git` nor `simplyytr-backup-RECOVERY.git` will be pushed, modified, or exposed.

### D. External Security & Credential Revocation Status
- [ ] **Google Account Active Sessions:** Confirmed revoked by channel owner via Google Account Security Console.
- [ ] **Google Cloud OAuth Client Secret:** Operator must acknowledge whether `client_secret.json` has been regenerated in Google Cloud Console.
- [ ] **New `PIPELINE_SECRET`:** Operator has generated a new 32+ byte random secret ready for immediate deployment to GitHub Repository Secrets and Vercel.
- [ ] **Third-Party API Keys:** Operator has cataloged any production keys (Cloudflare R2, Groq, ElevenLabs, Pexels) needing rotation.

---

## 3. Safe Execution Architecture & Guardrails

To prevent unintended data loss or accidental repository contamination, this execution plan enforces strict architectural safeguards:

1. **Strict Prohibition of Mirror Re-Contamination:**
   * **NEVER fetch old remote history into `simplyytr-backup.git`.**
   * Fetching `origin refs/heads/main` into the sanitized bare mirror would import the compromised commit objects (`ed8436f` and prior) and sensitive blobs (Chrome profiles, session cookies, `client_secret.json`) back into the local object database, completely destroying the repository's sanitized state.
2. **Handling of Pre-Push Remote Snapshots:**
   * The existing pristine offline archive mirror `scratch/cleanup/simplyytr-backup-ARCHIVE.git` already preserves a complete, verified snapshot of the original remote history at `ed8436f4fca6410e5c1e3b139e06fbfe2182084f`.
   * If an additional live remote snapshot is ever deemed necessary before execution, it must be fetched into a **completely separate, dedicated, isolated repository** (e.g., `scratch/cleanup/simplyytr-remote-live-snapshot.git`) explicitly classified as **COMPROMISED / SENSITIVE BACKUP**. It must NEVER touch `simplyytr-backup.git` or `simplyytr-release`.
3. **Strict Prohibition of `--mirror`:**
   * `--mirror` pushes all local refs and deletes any remote refs not present locally. It is strictly prohibited.
4. **Strict Refspec Scoping (`refs/heads/main:refs/heads/main`):**
   * The push command targets only the specific ref `main`. It will never use wildcard refspecs (`*/*` or `--all`).
5. **Lease-Guarded Force Push (`--force-with-lease`):**
   * Rather than an unconditional `--force`, the operation uses `--force-with-lease=refs/heads/main:<VERIFIED_REMOTE_OLD_SHA>`.
   * If any external collaborator or automation committed to the remote repository after the pre-execution query, the push will instantly abort without mutating remote history.
6. **Explicit STOP Gates on Anomaly:**
   * If `ls-remote` reports that the remote SHA differs from `ed8436f4fca6410e5c1e3b139e06fbfe2182084f`, **STOP IMMEDIATELY**.
   * If `ls-remote` reveals any unexpected remote branches or tags, **STOP IMMEDIATELY**.
   * If `--force-with-lease` rejects the push with `[rejected] (stale info)`, **STOP IMMEDIATELY**.

---

## 4. Command-by-Command Runbook

> **Legend of Safety Labels:**
> * `[LOCAL-ONLY]`: Executes strictly on the local machine; zero network contact.
> * `[LOCAL-READ-ONLY]`: Reads local state; causes zero mutation.
> * `[REMOTE-READ-ONLY — REQUIRES SEPARATE EXPLICIT AUTHORIZATION]`: Performs read-only network queries to GitHub (e.g. `ls-remote`). Does NOT mutate remote state, but requires explicit user authorization to initiate network traffic.
> * `[REMOTE-MUTATING — REQUIRES SEPARATE EXPLICIT AUTHORIZATION]`: Modifies public remote state on GitHub. Must NEVER be executed without explicit written operator approval.

---

### Stage 1: Local Preflight Revalidation `[LOCAL-ONLY]` `[LOCAL-READ-ONLY]`

Verify that the local sanitized mirror and release clone remain in their verified state:

```powershell
# 1.1 Verify sanitized mirror HEAD (Must output b83d88ee997a4b0c948232c3c69591b8ee0c0545)
git --git-dir="D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git" rev-parse refs/heads/main

# 1.2 Verify sanitized mirror parent (Must output 188ae0ca3ea534182a94b8d7f9119cd9eeee9e32)
git --git-dir="D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git" rev-parse refs/heads/main~1

# 1.3 Verify offline archive mirror HEAD (Must output ed8436f4fca6410e5c1e3b139e06fbfe2182084f)
git --git-dir="D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup-ARCHIVE.git" rev-parse refs/heads/main

# 1.4 Verify offline recovery mirror HEAD (Must output 5284d428fac3ce57e9532ba85d2ad9171a0694de)
git --git-dir="D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup-RECOVERY.git" rev-parse refs/heads/main

# 1.5 Verify release clone working tree status (Must output: working tree clean)
git -C "D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-release" status
```

*Gate Check:* If any SHA differs from the expected value, **ABORT IMMEDIATELY**.

---

### Stage 2: Remote Pre-Execution Inspection `[REMOTE-READ-ONLY — REQUIRES SEPARATE EXPLICIT AUTHORIZATION]`

*(Network operation contacting GitHub. Requires separate explicit operator authorization before execution.)*

Inspect the current live state of the GitHub remote without modifying it:

```powershell
# 2.1 Query live remote refs from GitHub
git --git-dir="D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git" ls-remote origin
```

*Expected Output:*
```text
<REMOTE_CURRENT_SHA>        HEAD
<REMOTE_CURRENT_SHA>        refs/heads/main
```

*Mandatory STOP Gates:*
1. **SHA Validation:** Verify that `<REMOTE_CURRENT_SHA>` matches exactly `ed8436f4fca6410e5c1e3b139e06fbfe2182084f`. If `<REMOTE_CURRENT_SHA>` differs, **STOP IMMEDIATELY**. Do not proceed.
2. **Branch Validation:** Confirm there are **no other branches** (e.g. `refs/heads/develop`, `refs/heads/feature/*`). If unexpected branches exist, **STOP IMMEDIATELY**.
3. **Tag Validation:** Confirm there are **no tags** (e.g. `refs/tags/*`). If unexpected tags exist, **STOP IMMEDIATELY**.

---

### Stage 3: Remote Snapshot Verification `[LOCAL-ONLY]` `[LOCAL-READ-ONLY]`

*Note: Do NOT fetch from GitHub into `simplyytr-backup.git`. The sanitized mirror must remain strictly isolated.*

Verify that the existing offline archive mirror is intact and ready as the permanent historical record:

```powershell
# 3.1 Verify existing archive mirror matches the verified remote SHA
git --git-dir="D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup-ARCHIVE.git" rev-parse refs/heads/main
# Output must be: ed8436f4fca6410e5c1e3b139e06fbfe2182084f
```

*(Optional Separate Step): If the operator desires an independent pre-push remote bundle, it must be cloned/fetched strictly to a new dedicated path such as `D:\Projects\SIMPLYYTR\scratch\cleanup\pre-push-remote-snapshot.git` and NEVER merged into `simplyytr-backup.git`.*

---

### Stage 4: Scoped Remote History Replacement `[REMOTE-MUTATING — REQUIRES SEPARATE EXPLICIT AUTHORIZATION]`

> ⚠️ **CRITICAL EXECUTION STEP — DO NOT RUN WITHOUT EXPLICIT WRITTEN USER AUTHORIZATION**  
> This command overwrites the public commit history of `main` on GitHub.

Execute the lease-guarded push from the sanitized bare mirror:

```powershell
# 4.1 Push sanitized main to GitHub with lease verification against verified remote SHA
git --git-dir="D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git" push --force-with-lease=refs/heads/main:<VERIFIED_REMOTE_OLD_SHA> origin refs/heads/main:refs/heads/main
```

*Parameter Substitution & Behavior:*
* Replace `<VERIFIED_REMOTE_OLD_SHA>` with the exact SHA confirmed in Stage 2 (expected: `ed8436f4fca6410e5c1e3b139e06fbfe2182084f`).
* If the remote reference changed for any reason, Git will reject the push with `[rejected] (stale info)` and **no remote changes will occur**.
* If rejected, **DO NOT RETRY WITH UNCONDITIONAL `--force`**. Stop and investigate.

---

### Stage 5: Post-Publication Remote Verification `[REMOTE-READ-ONLY — REQUIRES SEPARATE EXPLICIT AUTHORIZATION]`

*(Network operation contacting GitHub. Requires separate explicit operator authorization.)*

Verify that GitHub successfully adopted the sanitized history:

```powershell
# 5.1 Query live remote refs to verify new HEAD on GitHub
git --git-dir="D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git" ls-remote origin

# Expected output:
# b83d88ee997a4b0c948232c3c69591b8ee0c0545    HEAD
# b83d88ee997a4b0c948232c3c69591b8ee0c0545    refs/heads/main
```

---

### Stage 6: Upstream Commit-Cache Invalidation `[EXTERNAL HUMAN OPERATION]`

Because GitHub retains unreachable commit objects in internal cache for up to 90 days or until garbage collected, sensitive historical objects (e.g. `ed8436f`) could remain viewable by direct commit SHA URL:

1. **Submit GitHub Support Ticket:**
   * URL: `https://support.github.com/contact`
   * Category: **Repo or organization administration** > **Remove sensitive data**
   * Subject: `Request commit-cache purge and garbage collection for simply1git/simplyytr`
   * Body Template:
     > "Hello GitHub Support,  
     > We have rewritten git history on repository `simply1git/simplyytr` to purge sensitive session credentials and force-pushed a sanitized `main` branch.  
     > Please trigger repository garbage collection (`git gc --prune=now`) and clear cached commit views / dangling objects for repository `simply1git/simplyytr`.  
     > Thank you."
2. **Verify Releases & Pull Requests:**
   * Confirm no GitHub Releases attach old binaries or source snapshots.
   * Confirm no closed Pull Requests contain historical sensitive diffs.

---

### Stage 7: Local Primary Workspace Realignment `[LOCAL-ONLY]`

> ⚠️ **SAFEGUARD MANDATE:** Before any destructive workspace operations (`reset --hard`), uncommitted work must be backed up, and remote identity must be verified.

```powershell
# 7.1 Verify working-tree status of main workspace D:\Projects\SIMPLYYTR
git -C "D:\Projects\SIMPLYYTR" status

# 7.2 Safety Backup: Create a backup branch of current workspace state before any reset
git -C "D:\Projects\SIMPLYYTR" branch backup/pre-sanitization-alignment-$(Get-Date -Format "yyyyMMdd-HHmmss")

# 7.3 Verify remote URL strictly matches GitHub
git -C "D:\Projects\SIMPLYYTR" remote get-url origin
# Must output: https://github.com/simply1git/simplyytr.git

# 7.4 Fetch the sanitized history from GitHub (Requires separate authorization if executed over network)
git -C "D:\Projects\SIMPLYYTR" fetch origin main

# 7.5 Switch to main and reset hard to origin/main
git -C "D:\Projects\SIMPLYYTR" checkout main
git -C "D:\Projects\SIMPLYYTR" reset --hard origin/main

# 7.6 Verify workspace HEAD is b83d88e
git -C "D:\Projects\SIMPLYYTR" rev-parse HEAD
# Output must be: b83d88ee997a4b0c948232c3c69591b8ee0c0545

# 7.7 Run Credential Guard to confirm workspace cleanliness
node "D:\Projects\SIMPLYYTR\scripts\verify_no_secrets.js"
```

---

## 5. Rollback & Incident-Response Plan (No Republishing of Leaks)

* **Strict Safety Mandate:** **NEVER RESTORE COMMIT `ed8436f` TO GITHUB.** Restoring `ed8436f` would republish leaked credentials.
* **Lease Failure:** If push is rejected due to `stale info`, stop and re-inspect remote refs.
* **Emergency Post-Push Rollback:** If a defect is found on `b83d88e`, rollback only to the clean parent commit `188ae0ca3ea534182a94b8d7f9119cd9eeee9e32`:
  ```powershell
  # [REMOTE-MUTATING — EMERGENCY ONLY]
  git --git-dir="D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git" push --force-with-lease=refs/heads/main:b83d88ee997a4b0c948232c3c69591b8ee0c0545 origin 188ae0ca3ea534182a94b8d7f9119cd9eeee9e32:refs/heads/main
  ```
* **Downstream Clones & Forks:** Notify contributors to discard existing clones and re-clone fresh from `origin/main`.

---

## 6. Operational Separation: Credential Tasks vs History Push

| Operational Item | Audit Status | Responsible Scope | Prerequisite Timing |
|---|---|---|---|
| **Git History Replacement** | **PLANNED (Awaiting Authorization)** | Git Bare Mirror / Operator | Executes upon explicit user authorization. |
| **Google Cloud OAuth Client Secret** | **UNVERIFIED / PENDING** | Operator / Google Cloud Console | Complete prior to deploying backend. |
| **Production `PIPELINE_SECRET`** | **NOT DONE / PENDING** | Operator / GitHub Secrets & Vercel | Complete prior to starting Phase 1 CI/CD. |
| **Cloudflare R2 & Vendor API Keys** | **UNVERIFIED / PENDING** | Operator / Cloudflare & Vendor Dashboards | Verify before starting video render worker. |
| **Frontend Build / Typecheck (`npm run build`)** | **DEFERRED TO PHASE 1** | Phase 1 Workspace Bootstrap | Executes immediately after repo alignment in Phase 1. |

---

## 7. Checklist of Unresolved Decisions & Authorization Gate

Before executing Stage 4, confirm the following four decisions:

- [ ] **Decision 1:** Does the operator authorize running `git ls-remote origin` (Stage 2) to query GitHub over the network?
- [ ] **Decision 2:** Has a fresh 32+ byte `PIPELINE_SECRET` been generated for deployment to GitHub Secrets & Vercel?
- [ ] **Decision 3:** Does the operator authorize replacing `refs/heads/main` on GitHub with commit `b83d88ee997a4b0c948232c3c69591b8ee0c0545` via `--force-with-lease` (Stage 4)?
- [ ] **Decision 4:** Is the operator prepared to submit the GitHub Support commit-cache purge ticket immediately post-push?

---

### Formal Safety Statement:
**ZERO GITHUB OR NETWORK OPERATIONS WERE EXECUTED.**  
All mirrors, local repositories, working trees, and remote configurations remain completely untouched in read-only mode.
