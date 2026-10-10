# SIMPLYYTR 2.0 — Git History Sensitive Data Removal Plan

**Date:** 2026-10-09  
**Authority:** [docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md](file:///D:/Projects/SIMPLYYTR/docs/SIMPLYYTR_2_0_FINAL_COMPLETE_SYSTEM_SPECIFICATION.md)  
**Standard:** [GitHub Docs: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)  
**Status:** EXECUTED & VERIFIED IN ISOLATED MIRROR (`scratch/cleanup/simplyytr-backup.git`)  
**Tool Choice:** `git-filter-repo` (Officially recommended by Git and GitHub)

---

## 1. Executive Summary & Purpose

A forensic audit of `simply1git/simplyytr` discovered that sensitive credentials and browser session databases are committed directly into the Git repository history:
1. **`apps/storage/chrome_profile/` (623 files):** Committed in initial commit `0daf3ae` and currently tracked in `HEAD` (`f3d038d`), containing Google Chrome session cookies (`Default/Network/Cookies`), login profiles (`Default/Login Data`), autofill databases (`Default/Account Web Data`), and encryption states (`Local State`).
2. **`apps/backend/client_secret.json`:** Committed in `0daf3ae` and removed from the tree in `9140566`, but still present in Git packfiles and reachable via commit history.
3. **Hardcoded Fallback Secret Strings:** The string `[REDACTED_FALLBACK_TOKEN]` was committed in historical commits of GitHub Actions workflows, `utils.ts`, `page.tsx`, and worker scripts.

Simply running `git rm -r --cached` only removes files from future commits; **it does not remove them from historical commits**. Anyone cloning the repository or browsing previous commit SHAs can extract these files.

This document provides a safe, step-by-step, non-destructive execution plan following GitHub's documented best practices. **No destructive actions or history rewrites are performed automatically.**

---

## 2. Prerequisites & Critical Warning

> [!CAUTION]
> **REWRITE WARNING:** Rewriting Git history modifies all commit SHAs across all branches and tags. Any existing local clone or pull request will diverge. All collaborators must re-clone the repository after completion.

> [!IMPORTANT]
> **REVOCATION PRECEDES SCRUBBING:** Removing files from Git history does **not** invalidate credentials that were already pushed or cached by GitHub, crawlers, or third parties. All external credentials must be rotated and invalidated **before** rewriting Git history.

---

## 3. Phase 0: External Credential Revocation (Mandatory First Step)

Before executing any Git history operations:

1. **Google Chrome Session Invalidation:**
   - The user must log into Google Account Security: `https://myaccount.google.com/device-activity`
   - Review "Where you're signed in" and click **"Sign out of all sessions"** for all web and desktop sessions associated with the bot profile.
   - Change the Google account password to invalidate active OAuth refresh tokens.
2. **Google Cloud Console OAuth Secret Rotation:**
   - Navigate to Google Cloud Console (`https://console.cloud.google.com/apis/credentials`).
   - If `client_secret.json` was an active OAuth 2.0 client credential, delete or regenerate the client secret immediately.
3. **Internal Pipeline Secret Rotation:**
   - Generate a new cryptographically secure random token:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Store this token securely as repository secret `PIPELINE_SECRET` in GitHub Settings > Secrets and variables > Actions.
   - Never commit this value to source code.

---

## 4. Phase 1: Local Backup & Mirror Clone

Create an isolated, full-mirror backup before modifying repository objects:

```bash
# 1. Create a dedicated scratch workspace outside the main directory
mkdir -p D:\Projects\simplyytr_cleanup
cd D:\Projects\simplyytr_cleanup

# 2. Clone a full mirror containing all branches, tags, and refs
git clone --mirror https://github.com/simply1git/simplyytr.git simplyytr-backup.git

# 3. Create an immutable archive copy of the mirror backup
cp -r simplyytr-backup.git simplyytr-backup-ARCHIVE.git
```

---

## 5. Phase 2: Sensitive Paths Inventory for Purging

The following target paths must be purged from every commit in the repository:

| Target Path | Discovery Commit | Removal Commit in Tree | Historical Status |
|---|---|---|---|
| `apps/storage/chrome_profile/` | `0daf3ae` | Currently tracked in `f3d038d` | Present in all commits |
| `apps/backend/client_secret.json` | `0daf3ae` | Purged in `9140566` | Present in commits `0daf3ae` through `9140566` |
| `storage/` | `0daf3ae` | N/A | Check for any legacy duplicate directories |

Create a text replacement file `expressions.txt` for any plaintext secret strings to be scrubbed from historical diffs:
```text
[REDACTED_FALLBACK_TOKEN]===>[REDACTED_FALLBACK_TOKEN]
```

---

## 6. Phase 3: History Scrubbing via `git-filter-repo`

GitHub officially recommends **`git-filter-repo`** over `git filter-branch` and BFG Repo-Cleaner.

### Step 3.1: Install `git-filter-repo`
```bash
pip install git-filter-repo
```

### Step 3.2: Execute Path Inversion
In the `simplyytr-backup.git` directory:

```bash
cd D:\Projects\simplyytr_cleanup\simplyytr-backup.git

# Execute path removal across all refs
git-filter-repo \
  --path apps/storage/chrome_profile --invert-paths \
  --path apps/backend/client_secret.json --invert-paths \
  --replace-text ../expressions.txt --force
```

### Step 3.3: Verify Removal
Verify that the purged paths and strings no longer exist anywhere in Git history:

```bash
# Check that chrome_profile is completely gone from rev-list
git rev-list --all -- apps/storage/chrome_profile
# Expected output: (empty)

# Check that client_secret.json is completely gone
git rev-list --all -- apps/backend/client_secret.json
# Expected output: (empty)

# Check that the fallback secret string is gone
git grep "[REDACTED_FALLBACK_TOKEN]" $(git rev-list --all)
# Expected output: (empty)
```

---

## 7. Phase 4: Pushing Cleaned History to GitHub

Once verification is 100% complete:

```bash
# Re-add remote URL (git-filter-repo removes remotes for safety)
git remote add origin https://github.com/simply1git/simplyytr.git

# Force-push all sanitized branches
git push origin --force --all

# Force-push all sanitized tags
git push origin --force --tags
```

---

## 8. Phase 5: GitHub Server-Side Commit Cache Invalidation

Even after force-pushing, GitHub may retain cached views of commits that were previously pushed or referenced in pull requests:

1. **Contact GitHub Support (or Repository Settings):**
   - Open a ticket at `https://support.github.com/contact` referencing repository `simply1git/simplyytr`.
   - Request: *"Please clear the GitHub ref cache and unreachable commit objects for repository simply1git/simplyytr following a sensitive data removal procedure."*
2. **Confirm Web UI Inaccessibility:**
   - Attempt to navigate to the previous commit SHA `f3d038d` and initial commit `0daf3ae` via browser.
   - Verify that viewing `apps/storage/chrome_profile` returns 404 Not Found.

---

## 9. Phase 6: Post-Cleanup Developer & CI Alignment

1. **Delete Existing Local Clones:**
   - All developers must delete old local clones of `simplyytr` to avoid accidentally pushing purged commits back to the remote.
2. **Fresh Clone:**
   ```bash
   git clone https://github.com/simply1git/simplyytr.git
   ```
3. **Verify Git Credential Guard:**
   - Ensure the updated `.gitignore` and `scripts/verify_no_secrets.js` are in place to prevent any future accidental tracking.

---

## 10. Execution Checklist

- [x] User confirms Google Account sessions revoked via Google Account Security.
- [x] Local mirror backup created (`scratch/cleanup/simplyytr-backup.git` and immutable `ARCHIVE.git`).
- [x] `git-filter-repo` executed with `--path apps/storage/chrome_profile --invert-paths --path apps/backend/client_secret.json --invert-paths --path kaggle-worker/__pycache__ --invert-paths --replace-text expressions.txt`.
- [x] Verified zero search hits for sensitive files, pycache, and fallback tokens across all 106 commits.
- [x] Origin remote re-configured (`https://github.com/simply1git/simplyytr.git`) in scrubbed mirror.
- [ ] User executes or authorizes force-push of sanitized history (`git push origin --force --all && git push origin --force --tags`).
- [ ] GitHub Support requested to clear cached commit objects (`https://support.github.com/contact`).
- [ ] Working tree synchronized / re-cloned from cleaned repository.
