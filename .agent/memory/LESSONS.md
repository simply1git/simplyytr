# Engineering Lessons

## L-0001: Inspect All Tracked Storage Directories
- **Observation:** `.gitignore` contained `storage/chrome_profile/` instead of `apps/storage/chrome_profile/` or `**/chrome_profile/**`, allowing an entire user profile to be committed into Git without developer realization.
- **Evidence:** 500+ files tracked in `apps/storage/chrome_profile/` under commit `f3d038d`.
- **Status:** PROMOTED (2026-10-09)
- **Guideline:** Always use recursive wildcards (`**/pattern/**`) in root `.gitignore` for security-sensitive local directories.

## L-0002: Check Build Compilability Before Trusting Architecture Docs
- **Observation:** The repository README advertised an advanced SOTA platform, but `apps/backend` could not compile due to a missing import (`puppeteerUploader.ts`).
- **Evidence:** `import { uploadViaPuppeteer } from '../services/puppeteerUploader'` in `publish.ts` and `youtubePublisher.ts` where the target file does not exist.
- **Status:** PROMOTED (2026-10-09)
- **Guideline:** Run static analysis and type checks across all packages during initial forensics before accepting documentation claims.
