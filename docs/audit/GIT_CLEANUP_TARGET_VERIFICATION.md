# SIMPLYYTR 2.0 — Forensic Git Cleanup Target & Remote Verification

**Date:** 2026-10-09  
**Auditor / Diagnostic Agent:** Antigravity (Repository Security Auditor & Lead Systems Architect)  
**Task Type:** Read-Only Forensic Git History Diagnostic  
**Authority:** [docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md](file:///D:/Projects/SIMPLYYTR/docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md)  
**Governance Rules:** [AGENTS.md](file:///D:/Projects/SIMPLYYTR/AGENTS.md)  
**Verification Result:** `PASS WITH BLOCKERS` (Isolated Mirror Verified; Remote and Main Workspace Unrewritten)

---

## 1. Executive Diagnostic Findings

A comprehensive read-only forensic inspection was conducted across all local repositories, bare clones, and the GitHub remote to resolve uncertainty regarding which repository was rewritten by `git-filter-repo`.

### Definitive Verdict on Target Repository
* **Rewritten Repository:** **EXCLUSIVELY** the isolated bare mirror located at `D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git`.
* **Main Working Clone:** **NOT REWRITTEN.** Located at `D:\Projects\SIMPLYYTR`. Zero filter-repo metadata exists. Working tree and history remain on original un-scrubbed commits (`f3d038d399d2050c9ea8ba4cad3c6b3067c517cf`) with 623 sensitive Chrome profile files tracked in HEAD.
* **Archive Backup:** **NOT REWRITTEN.** Located at `D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup-ARCHIVE.git`. Pristine verbatim mirror of GitHub remote as of 2026-10-09 15:14 IST (`ed8436f4fca6410e5c1e3b139e06fbfe2182084f`).
* **GitHub Remote:** **NOT REWRITTEN.** Read-only inspection of `https://github.com/simply1git/simplyytr.git` confirms that `HEAD` and `refs/heads/main` remain at `ed8436f4fca6410e5c1e3b139e06fbfe2182084f`. No push or force-push was executed. All historical commits (`0daf3ae` through `f3d038d`) remain fully reachable and exposed on GitHub.

---

## 2. Step 1 & 2: Repository Inventory & Status

| Attribute | Main Workspace | Cleanup Mirror | Archive Mirror | GitHub Remote |
|---|---|---|---|---|
| **Location / URL** | `D:\Projects\SIMPLYYTR` | `D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git` | `D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup-ARCHIVE.git` | `https://github.com/simply1git/simplyytr.git` |
| **Git Dir** | `D:\Projects\SIMPLYYTR\.git` | `D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git` | `D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup-ARCHIVE.git` | Remote server |
| **Bare Status** | Non-bare (`false`) | Bare (`true`) | Bare (`true`) | Bare server repository |
| **Active Branch / Ref** | `build/phase-0-forensic-audit` | `main` | `main` | `main` |
| **Current HEAD SHA** | `f3d038d399d2050c9ea8ba4cad3c6b3067c517cf` | `5284d428fac3ce57e9532ba85d2ad9171a0694de` | `ed8436f4fca6410e5c1e3b139e06fbfe2182084f` | `ed8436f4fca6410e5c1e3b139e06fbfe2182084f` |
| **Reachable Refs** | `refs/heads/build/phase-0-forensic-audit`<br>`refs/heads/main`<br>`refs/remotes/origin/main` | `refs/heads/main` | `refs/heads/main` | `HEAD`<br>`refs/heads/main` |
| **Remote Origin URL** | `https://github.com/simply1git/simplyytr.git` | `https://github.com/simply1git/simplyytr.git` | `https://github.com/simply1git/simplyytr.git` | N/A |
| **filter-repo Metadata** | **ABSENT** (`.git/filter-repo` does not exist) | **PRESENT** (`filter-repo/commit-map`, etc.) | **ABSENT** (Pristine mirror) | N/A |
| **Object Store Size** | 174.21 MB (2,544 objects in 1 pack) | 158.39 MB (2,115 objects in 1 pack) | 174.21 MB (2,547 objects in 1 pack) | Remote managed |
| **Size Difference** | Baseline | **-15.82 MB (-429 objects)** | +3 objects relative to workspace | Baseline |

### Command Verification Log (Step 1)
```powershell
Get-Location
# D:\Projects\SIMPLYYTR

git rev-parse --show-toplevel
# D:/Projects/SIMPLYYTR

git rev-parse HEAD
# f3d038d399d2050c9ea8ba4cad3c6b3067c517cf

git branch --show-current
# build/phase-0-forensic-audit

git status --short
# Modified: .env.example, content_pipeline.yml, render-worker.yml, .gitignore, utils.ts, page.tsx, video_generator.py, youtubbot-worker.py
# Untracked: .agent/, .agents/, AGENTS.md, START_HERE.md, docs/, schemas/, scripts/, tests/, etc.

git remote -v
# origin  https://github.com/simply1git/simplyytr.git (fetch)
# origin  https://github.com/simply1git/simplyytr.git (push)

git show-ref
# f3d038d399d2050c9ea8ba4cad3c6b3067c517cf refs/heads/build/phase-0-forensic-audit
# f3d038d399d2050c9ea8ba4cad3c6b3067c517cf refs/heads/main
# f3d038d399d2050c9ea8ba4cad3c6b3067c517cf refs/remotes/origin/HEAD
# f3d038d399d2050c9ea8ba4cad3c6b3067c517cf refs/remotes/origin/main
```

---

## 3. Step 3: Independent Sensitive History Inspection

All three local repositories were independently evaluated using non-destructive Git inspection commands across all reachable references (`--all`).

### Sensitive Targets Tested
1. `apps/storage/chrome_profile/` (SQLite databases, session cookies, local state, encryption metadata)
2. `apps/backend/client_secret.json` (OAuth 2.0 client secrets)
3. `*.pyc` and `__pycache__` (compiled Python bytecode artifacts)
4. Historical Fallback Pipeline Token (`[REDACTED_FALLBACK_TOKEN]`, searched in-memory from fragments without terminal echo)
5. Individual sub-paths: `Default/Web Data`, `Default/Network/Cookies`, `Local State`

### Side-by-Side Test Outcomes

| Target Item | Main Workspace (`D:\Projects\SIMPLYYTR`) | Cleanup Mirror (`simplyytr-backup.git`) | Archive Mirror (`simplyytr-backup-ARCHIVE.git`) | Remote GitHub Status |
|---|---|---|---|---|
| **`apps/storage/chrome_profile` History** | **1 commit** (Tracked in tree at HEAD `f3d038d`, 623 files) | **0 commits** (0 files in tree at HEAD `5284d42`) | **2 commits** (`0daf3ae` added, `ed8436f` deleted from tree) | **Present in history** (commits `0daf3ae`..`f3d038d`) |
| **`apps/backend/client_secret.json`** | **2 commits** (`0daf3ae` added, `9140566` deleted) | **0 commits** | **2 commits** (`0daf3ae` added, `9140566` deleted) | **Present in history** (commits `0daf3ae`..`9140566`) |
| **`__pycache__` / `*.pyc` artifacts** | **3 commits** | **0 commits** | **3 commits** | **Present in history** |
| **Fallback Token (Commit Count)** | **12 commits** | **0 commits** | **12 commits** | **Present in history** (12 commits) |
| **Fallback Token (Grep across all commits)** | Matches found in 8 files | **0 matches** (106 commits searched) | Matches found in 8 files | Reachable via GitHub commit history |
| **`Default/Web Data`** | 1 commit | **0 commits** | 2 commits | Reachable via GitHub commit history |
| **`Default/Network/Cookies`** | 1 commit | **0 commits** | 2 commits | Reachable via GitHub commit history |
| **`Local State`** | 1 commit | **0 commits** | 2 commits | Reachable via GitHub commit history |

### Files Affected by Fallback Token in Un-Scrubbed Repositories
The fallback token was committed and modified across 12 commits in the following 8 repository-relative files in both the Workspace and Archive Mirror:
1. `.github/workflows/content_pipeline.yml`
2. `.github/workflows/render-worker.yml`
3. `apps/web/src/app/api/lib/utils.ts`
4. `apps/web/src/app/page.tsx`
5. `kaggle_logs/youtubbot-worker.py`
6. `kaggle_pull/youtubbot-worker.py`
7. `kaggle-worker/__pycache__/video_generator.cpython-312.pyc`
8. `kaggle-worker/video_generator.py`

In `scratch/cleanup/simplyytr-backup.git`, **zero occurrences** remain across all 106 commits (all instances replaced with `[REDACTED_FALLBACK_TOKEN]`).

---

## 4. Crucial Conceptual Distinctions

It is critical to distinguish the following four verification states:

### 1. "No path in reachable history"
* **Definition:** The file or directory path does not appear in the tree object of any commit traversable from the repository's ref heads (`git rev-list --all -- <path>` returns empty).
* **Limitation:** Does not guarantee that data or secrets originally in those files were not duplicated into other files or diffs (e.g. pasted into workflow YAML or worker scripts).

### 2. "No matching text in reachable history"
* **Definition:** A literal string or regular expression does not appear in any commit patch or blob reachable from the repository's ref heads (`git log --all -S <str>` and `git grep <str> $(git rev-list --all)` return zero hits).
* **Limitation:** Scoped strictly to the queried pattern. Does not detect alternative encodings, base64 representations, or separate secrets.

### 3. "No evidence found in the inspected refs"
* **Definition:** A negative search result bounded strictly to the local repository references queried during the inspection.
* **Limitation:** Does not account for uninspected refs, orphaned git objects, reflog entries, dangling stashes, or un-synchronized remote branches/forks.

### 4. "Confirmation that the remote GitHub refs were rewritten"
* **Definition:** Authoritative verification directly against the public GitHub remote (e.g. via `git ls-remote`) proving that the remote ref heads (`refs/heads/main`) now reference the rewritten commit SHAs (e.g., `5284d428fac3ce57e9532ba85d2ad9171a0694de`), and that old commit lineages have been disconnected from public refs.
* **Current Status:** **NOT CONFIRMED / UNREWRITTEN.** The remote refs still point to `ed8436f4fca6410e5c1e3b139e06fbfe2182084f`. Local scrubbing of `simplyytr-backup.git` did not alter GitHub.

---

## 5. Step 4: Forensic Reconstruction of Which Repository Was Rewritten

### Direct Forensic Evidence
Inspection of `D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git\filter-repo` reveals:
1. `already_ran`: Present.
2. `changed-refs`: `refs/heads/main`.
3. `ref-map`:
   ```
   old                                      new                                      ref
   ed8436f4fca6410e5c1e3b139e06fbfe2182084f 5284d428fac3ce57e9532ba85d2ad9171a0694de refs/heads/main
   ```
4. `first-changed-commits`:
   `0daf3aec558087ddf9dc5fe18e7a69be1178c077 6ab39d3a0b2e0f2f934fda393a01d65bd2f05d2e`
5. `commit-map`: 106 total historical commits mapped from old SHAs to new SHAs.

### Discovery of the "Missing" Commit `ed8436f`
The command log showed that `simplyytr-backup.git` was cloned when GitHub's `main` was at `ed8436f` ("Delete apps/storage/chrome_profile directory", committed via GitHub Web UI on 2026-10-09 13:57 IST).

Why did the rewritten HEAD commit `5284d42` have the commit message of `f3d038d` ("feat(top1-percent): upgrade to live 2026 pop-culture/movie trends..."), instead of `ed8436f`?

Forensic inspection of `commit-map` reveals the exact explanation:
```
line 97:  ed8436f4fca6410e5c1e3b139e06fbfe2182084f 0000000000000000000000000000000000000000
line 103: f3d038d399d2050c9ea8ba4cad3c6b3067c517cf 5284d428fac3ce57e9532ba85d2ad9171a0694de
```
* Commit `ed8436f` had only one modification: deleting `apps/storage/chrome_profile/`.
* When `git-filter-repo` filtered out `apps/storage/chrome_profile/` from all commits, commit `ed8436f` became an **empty commit** (diff was completely null).
* By design, `git-filter-repo` prunes empty commits by mapping them to all zeros (`00000000...`).
* Consequently, `ed8436f` was discarded, and its parent `f3d038d` was rewritten to `5284d428fac3ce57e9532ba85d2ad9171a0694de`, which became the new HEAD of `main`.

### Repository Rewrite Matrix
* **Working clone (`D:\Projects\SIMPLYYTR`):** **NOT REWRITTEN.**
* **Cleanup mirror (`scratch/cleanup/simplyytr-backup.git`):** **REWRITTEN & SANITIZED.**
* **Archive mirror (`scratch/cleanup/simplyytr-backup-ARCHIVE.git`):** **NOT REWRITTEN (Pristine pre-rewrite backup).**
* **GitHub Remote (`simply1git/simplyytr`):** **NOT REWRITTEN.**

---

## 6. Step 5: Remote Status Inspection

Execution of read-only remote query `git ls-remote https://github.com/simply1git/simplyytr.git` returned:
```
ed8436f4fca6410e5c1e3b139e06fbfe2182084f	HEAD
ed8436f4fca6410e5c1e3b139e06fbfe2182084f	refs/heads/main
```

### Remote Exposure Analysis
1. Commit `ed8436f` deleted `apps/storage/chrome_profile` from the *active working tree* on GitHub, but it **did not rewrite Git history**.
2. Because `ed8436f` has parent `f3d038d`, every historical commit dating back to repository creation (`0daf3ae`) is reachable on GitHub.
3. Historical `apps/storage/chrome_profile`, `client_secret.json`, compiled bytecode, and the hardcoded fallback token remain accessible to anyone cloning or querying `simply1git/simplyytr`.
4. The cleaned history at `5284d42` exists **only locally** inside `D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git`.

---

## 7. Uncertainties & Active Blockers

### Remaining Blockers
1. **BLOCKER-01 (Severity: CRITICAL): Public Remote Remains Un-Scrubbed on GitHub**
   - The public repository `simply1git/simplyytr` still hosts sensitive history across all commits prior to `ed8436f`.
   - **Resolution Required:** User authorization to force-push the sanitized bare mirror `scratch/cleanup/simplyytr-backup.git` to `origin`, followed by a GitHub Support request to clear cached unreachable commit objects.
2. **BLOCKER-02 (Severity: HIGH): Workspace / Local Working Tree Divergence**
   - The local working tree in `D:\Projects\SIMPLYYTR` is based on un-rewritten commit `f3d038d` with modified files and untracked audit documents.
   - If a developer commits or pushes directly from `D:\Projects\SIMPLYYTR`, the un-sanitized commit graph (`f3d038d`) will be pushed back to the remote, undoing the cleanup.
   - **Resolution Required:** After remote force-push, align the local working tree with `5284d42` while preserving untracked Phase 0 audit documents and containment edits.
3. **BLOCKER-03 (Severity: MEDIUM): Phase 1 Implementation Gate**
   - In accordance with the system specification and `PHASE_0_REVIEW_CHECKLIST.md`, Phase 1 implementation remains strictly blocked until external security remediation and history scrubbing are verified on GitHub.

---

## 8. Safest Recommended Next Procedure (Recommendation Only)

> [!CAUTION]
> **READ-ONLY GUARANTEE:** No push, reset, or rewrite actions were executed during this verification. The procedure below is a recommended plan for user authorization.

### Recommended Step-by-Step Sequence:

1. **Step A — Authorize & Execute Remote Force-Push:**
   The user explicitly runs the force-push from the verified bare mirror to GitHub:
   ```powershell
   git -C D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git push origin --force --all
   git -C D:\Projects\SIMPLYYTR\scratch\cleanup\simplyytr-backup.git push origin --force --tags
   ```

2. **Step B — Submit GitHub Support Cache Purge Request:**
   Submit a request at `https://support.github.com/contact`:
   *"Please invalidate the commit cache and prune unreachable commits for repository simply1git/simplyytr following a git-filter-repo history cleanup."*

3. **Step C — Verify Remote Heads via `git ls-remote`:**
   Confirm that `git ls-remote https://github.com/simply1git/simplyytr.git` returns `5284d428fac3ce57e9532ba85d2ad9171a0694de` as HEAD.

4. **Step D — Safe Local Workspace Re-alignment:**
   In `D:\Projects\SIMPLYYTR`:
   - Untracked audit files (`docs/audit/`, `.agent/`, `schemas/`, `tests/`) must be safely preserved.
   - The tracked `apps/storage/chrome_profile` directory in the local working tree must be permanently deleted from disk.
   - The local branch should be reset or rebased onto the fetched `5284d42` commit, ensuring no legacy commit objects (`f3d038d`) can be pushed.

5. **Step E — Phase 1 Kickoff:**
   Once all remote and local verifications confirm clean status, proceed to Phase 1 Foundation Slice implementation.
