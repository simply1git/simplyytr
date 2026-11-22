# SIMPLYYTR 2.0 — Phase 5K.3: Targeted Residual Remediation Report

**Document Status:** Complete & Evidence-Based  
**Date:** 2026-10-17  
**Final Verdict:** `PHASE_5K_3_PARTIALLY_REMEDIATED`  
**Workspace:** `D:\Projects\SIMPLYYTR`  
**Git Baseline HEAD:** `b83d88ee997a4b0c948232c3c69591b8ee0c0545`  
**Final Git HEAD:** `b83d88ee997a4b0c948232c3c69591b8ee0c0545` (0 commits created; workspace preserved)  
**Safety & Backup Directory:** `scratch/pre_phase5k_3_backup/`  

---

## 1. Executive Summary

Phase 5K.3 executed a targeted remediation of compatible, confirmed dependency advisories, conducted in-depth architectural investigations of the residual `basic-ftp` and `braces` vulnerability clusters, audited PostCSS across all levels of the dependency tree, and executed validation gates without touching PostgreSQL processes.

### Key Outcomes:
1. **Compatible Vulnerabilities Remediated:**
   - `browserslist` was upgraded from `4.28.2` to `4.29.3` across all dependency consumers, resolving [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx) (Moderate).
   - `baseline-browser-mapping` was upgraded from `2.10.38` to `2.11.29` across all dependency consumers, resolving [GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g) and [GHSA-w5vr-8v7q-w6rv](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv) (High).
   - Total audit vulnerability count dropped from **16 (1 moderate, 15 high)** to **14 (0 moderate, 14 high, 0 critical)**.
2. **`basic-ftp` Root-Cause Investigation:**
   - Traced the invocation chain from `puppeteer@25.14.0` -> `@puppeteer/browsers@3.2.5` -> `proxy-agent@8.0.2` -> `pac-proxy-agent@9.1.0` -> `get-uri@8.0.1` -> `basic-ftp@5.3.1`.
   - Identified that `basic-ftp@5.3.1` is the final release of the 5.x branch with zero upstream backports, while `basic-ftp@6.x` contains breaking changes unadopted by `get-uri@8.0.1` (which pins `^5.3.1`).
   - Confirmed that `basic-ftp` is only reachable if an `ftp://` or `pac+ftp://` proxy URL is configured. SIMPLYYTR uses zero FTP endpoints, configures no PAC proxies, and isolates Puppeteer to local uploader scripts. The finding is retained with documented compensating controls.
3. **`braces` Root-Cause Investigation:**
   - Traced both dependency paths: `ts-node-dev@2.0.0` -> `chokidar@3.6.0` -> `braces@3.0.3` (backend devDependency) and `eslint-config-next@16.4.1` -> `@next/eslint-plugin-next@16.4.1` -> `fast-glob@3.3.1` -> `micromatch@4.0.8` -> `braces@3.0.3` (web devDependency).
   - Confirmed advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) affects all versions `<=3.0.3` (zero patched releases exist in the npm ecosystem).
   - Empirically verified that neither `ts-node-dev` nor `eslint-config-next` / `braces` is bundled into production deployment artifacts (`apps/backend/dist` and `apps/web/.next`).
4. **PostCSS Tree Verification:**
   - Audited root `postcss@8.5.30` and internal `node_modules/next/node_modules/postcss@8.5.23`. Confirmed zero known vulnerabilities across all copies.
5. **Database Process Safety:**
   - Strictly adhered to safety rules: PostgreSQL was neither started, stopped, nor killed during Phase 5K.3.
   - Database-dependent tests (`test:pipeline`, `test:workflow`, `test:remediation`, and DB checks in `test:legacy`/`test:phase4b`) were cleanly withheld and identified as unverified offline.
   - All offline test suites (`test:security` 43/43, `test:tts` 21/21 offline, `test:legacy` 29/29 offline, `test:phase4b` 15/15 offline), secret scanning, TypeScript compilation, and Turbopack production builds succeeded with exit code 0.

---

## 2. Working Tree & Safety Inventory

- **Target Workspace:** `D:\Projects\SIMPLYYTR`
- **Git HEAD:** `b83d88ee997a4b0c948232c3c69591b8ee0c0545`
- **Pre-execution Backup:** Pristine copies stored in `scratch/pre_phase5k_3_backup/`:
  - `package.json`
  - `package-lock.json`
  - `apps/backend/package.json`
  - `apps/uploader-agent/package.json`
  - `apps/web/package.json`
- **Preservation Check:**
  - Zero git resets, stashes, checkouts, or cleans executed.
  - Zero commits, tags, pushes, or deployments created.
  - Zero secrets exposed (`node scripts/verify_no_secrets.js` passed).
  - PostgreSQL was neither started, stopped, nor terminated.

---

## 3. Stage 1 — Fix Known Compatible Advisories

### 3.1. Parent Dependency Constraint Analysis

Prior to applying upgrades, the dependency constraints of all parent packages were evaluated:

| Target Package | Parent Package | Parent Declared Constraint | Proposed Version | Compatible? |
|---|---|---|---|---|
| `browserslist` | `@babel/helper-compilation-targets@7.29.7` | `"browserslist": "^4.24.0"` | `4.29.3` | **Yes** (`4.29.3` satisfies `^4.24.0`) |
| `browserslist` | `update-browserslist-db@1.3.4` | `peer browserslist@">= 4.21.0"` | `4.29.3` | **Yes** (`4.29.3` satisfies `>= 4.21.0`) |
| `baseline-browser-mapping` | `next@16.4.1` | `"baseline-browser-mapping": "^2.9.19"` | `2.11.29` | **Yes** (`2.11.29` satisfies `^2.9.19`) |
| `baseline-browser-mapping` | `browserslist@4.29.3` | `"baseline-browser-mapping": "^2.11.26"` | `2.11.29` | **Yes** (`2.11.29` satisfies `^2.11.26`) |

### 3.2. Manifest Update & Lockfile Regeneration

Targeted overrides were added to root `package.json`:
```json
  "overrides": {
    "browserslist": "^4.29.3",
    "baseline-browser-mapping": "^2.11.29"
  }
```

The dependency tree was regenerated via:
1. `npm update browserslist baseline-browser-mapping --package-lock-only` (Exit code 0)
2. `npm install` (Exit code 0)

### 3.3. Verification Across the Tree

Verification via `npm ls` and `npm explain` confirmed complete remediation across all nodes:

```
$ npm ls browserslist baseline-browser-mapping
youtubbot-platform@1.0.0 D:\Projects\SIMPLYYTR
`-- web@0.1.0 -> .\apps\web
  +-- eslint-config-next@16.4.1
  | `-- eslint-plugin-react-hooks@7.1.1
  |   `-- @babel/core@7.29.7
  |     `-- @babel/helper-compilation-targets@7.29.7
  |       `-- browserslist@4.29.3
  |         +-- baseline-browser-mapping@2.11.29 deduped
  |         `-- update-browserslist-db@1.3.4
  |           `-- browserslist@4.29.3 deduped
  `-- next@16.4.1
    `-- baseline-browser-mapping@2.11.29
```

- **Every installed copy** of `browserslist` is `4.29.3` (deduped).
- **Every installed copy** of `baseline-browser-mapping` is `2.11.29` (deduped).
- Zero residual unpatched copies exist in any nested workspace.

### 3.4. Advisories Resolved

1. **[GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx) (Moderate):** Non-linear parsing of queries leading to ReDoS/DoS in `browserslist`.
   - Affected range: `< 4.28.7`
   - Fixed in: `>= 4.28.7`
   - Installed: `4.29.3` (**REMEDIATED**)
2. **[GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g) & [GHSA-w5vr-8v7q-w6rv](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv) (High):** ReDoS / DoS in `baseline-browser-mapping`.
   - Affected range: `< 2.11.0`
   - Fixed in: `>= 2.11.0`
   - Installed: `2.11.29` (**REMEDIATED**)

---

## 4. Stage 2 — Investigation of `basic-ftp`

### 4.1. Installed State & Advisory Details

- **Package:** `basic-ftp`
- **Installed Version:** `5.3.1`
- **Advisory ID:** [GHSA-c475-qrg2-pj4r](https://github.com/advisories/GHSA-c475-qrg2-pj4r) (npm: 1240853)
- **Severity:** High
- **Title:** Quadratic-time CPU denial of service in `Client.list()` Unix directory-listing parser (RE_LINE backtracking)
- **Affected Range:** `<= 6.2.0`
- **Fixed Range:** `>= 6.2.1`

### 4.2. Complete Dependency Path

```
web / @youtubbot/uploader-agent / @youtubbot/backend
 `-- puppeteer@25.14.0
       `-- @puppeteer/browsers@3.2.5
             `-- proxy-agent@8.0.2
                   `-- pac-proxy-agent@9.1.0
                         `-- get-uri@8.0.1
                               `-- basic-ftp@5.3.1
```

### 4.3. Code Execution Analysis

1. **`@puppeteer/browsers` Invocation:**
   - In `node_modules/@puppeteer/browsers/lib/httpUtil.js`:
     ```javascript
     export async function httpRequest(url, method, response, keepAlive = true) {
       let agent;
       try {
         const { ProxyAgent } = await import('proxy-agent');
         agent = new ProxyAgent();
       } catch { ... }
     ```
   - `@puppeteer/browsers` only calls `httpRequest` in `install.ts` when downloading Chromium binaries from Google CDN over HTTPS (`headHttpRequest` / `downloadFile`).
2. **`proxy-agent` Invocation:**
   - In `node_modules/proxy-agent/dist/index.js`, `ProxyAgent` relies on `proxy-from-env` to inspect `HTTP_PROXY`, `HTTPS_PROXY`, and `ALL_PROXY`.
   - `pac-proxy-agent` is lazily loaded **only** if the proxy URL specifies a PAC scheme (`pac+http`, `pac+https`, `pac+file`, `pac+data`, `pac+ftp`).
3. **`pac-proxy-agent` & `get-uri` Invocation:**
   - In `node_modules/proxy-agent/node_modules/pac-proxy-agent/dist/index.js`, PAC scripts are retrieved using `getUri()`.
   - In `node_modules/proxy-agent/node_modules/get-uri/dist/index.js`, `ftp.js` is imported to handle `ftp:` and `pac+ftp:` schemes.
4. **`basic-ftp` Invocation:**
   - In `node_modules/proxy-agent/node_modules/get-uri/dist/ftp.js`:
     ```javascript
     const client = new Client();
     ...
     const list = await client.list(dirname(filepath));
     ```
   - `client.list()` is invoked **exclusively** when an FTP URI is processed and the server does not support the `MDTM` extension command.

### 4.4. Upstream Compatibility Analysis & Blocker

- `get-uri@8.0.1` explicitly declares `"basic-ftp": "^5.3.1"`.
- Registry inspection of `basic-ftp` confirms:
  - `5.3.1` is the last release of version 5.x. Upstream published 0 backported security fixes on the 5.x branch.
  - The fix exists only in `6.2.1+`.
  - `basic-ftp@6.x` introduced breaking changes.
  - Latest `get-uri` (`8.0.1`), `pac-proxy-agent` (`9.1.0`), and `proxy-agent` (`8.0.2`) have **not** upgraded to `basic-ftp@6.x`.
- Forcing `basic-ftp@6.2.3` via npm overrides violates the parent dependency contract (`^5.3.1`) and risks breaking FTP handling without upstream test validation.

### 4.5. Compensating Controls & Risk Classification

- **Reachable Surface in SIMPLYYTR:**
  - SIMPLYYTR contains **zero FTP connections or endpoints**.
  - SIMPLYYTR does **not** configure or use PAC proxy scripts (`pac+...`).
  - Production web and API routes do not import Puppeteer, `@puppeteer/browsers`, or `basic-ftp`.
  - Puppeteer is restricted to the local `uploader-agent` and legacy scraper (disabled by default via `legacyGuard.ts`).
- **Residual Risk Classification:** **Very Low / Dormant**. The vulnerability cannot be reached without an operator explicitly configuring a malicious FTP-based PAC proxy URL in environment variables.

---

## 5. Stage 3 — Investigation of `braces`

### 5.1. Installed State & Advisory Details

- **Package:** `braces`
- **Installed Version:** `3.0.3`
- **Advisory ID:** [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) (npm: 1240992)
- **Severity:** High
- **Title:** `braces` vulnerable to stack-exhaustion denial of service through deeply nested patterns
- **Affected Range:** `<= 3.0.3` (`*`)
- **Fixed Range:** **None available**

### 5.2. Complete Dependency Paths

```
Path A (apps/backend devDependency):
@youtubbot/backend@1.0.0
 `-- ts-node-dev@2.0.0
       `-- chokidar@3.6.0
             `-- braces@3.0.3

Path B (apps/web devDependency):
web@0.1.0
 `-- eslint-config-next@16.4.1
       `-- @next/eslint-plugin-next@16.4.1
             `-- fast-glob@3.3.1
                   `-- micromatch@4.0.8
                         `-- braces@3.0.3
```

### 5.3. Upstream Status & Ecosystem Analysis

- Registry inspection (`npm view braces versions`) confirms `3.0.3` is the **latest version ever published** by the package maintainers.
- There are **zero** patched versions available in the npm ecosystem.
- Upstream `npm audit` suggests:
  `{"name":"eslint-config-next","version":"14.2.35","isSemVerMajor":true}`
  Downgrading `eslint-config-next` to `14.2.35` would break React 19 and Next.js 16.4.1 compatibility, downgrade the entire web app toolchain, and is rejected as unsafe.

### 5.4. Empirical Production Bundle Verification

To verify that `braces` is absent from production deployment artifacts:
1. **Backend Production Build:**
   - Built via `tsc` to `apps/backend/dist/`.
   - Content search for `braces` in `apps/backend/dist/*.js` returned **0 matches**.
   - `ts-node-dev` and `chokidar` are development-only file watchers not packaged into the backend runtime.
2. **Web Production Build:**
   - Built via `next build` to `apps/web/.next/`.
   - Comprehensive recursive search across all `.js` and `.json` artifacts in `.next/` returned **0 matches** for `braces`.
   - `eslint-config-next`, `@next/eslint-plugin-next`, `fast-glob`, `micromatch`, and `braces` are development linter tools evaluated at lint/build time and completely omitted from client and server bundles.

### 5.5. Compensating Controls & Risk Classification

- **Compensating Controls:**
  - `braces` is completely excluded from production runtime execution in both backend and web services.
  - Development environments operate on trusted internal source code and do not evaluate untrusted glob strings.
- **Monitoring Plan:**
  - Track upstream `micromatch` and `braces` GitHub repositories for a future `3.0.4` or `4.0.0` release.
  - When upstream publishes a fix, verify compatibility before bumping.
- **Residual Risk Classification:** **Negligible / Build-Time Only**.

---

## 6. Stage 4 — Verification of PostCSS Across the Tree

All copies of PostCSS in the workspace were inspected:

| Location | Installed Version | Direct Parent | Applicability | Advisories | Status |
|---|---|---|---|---|---|
| `node_modules/postcss` | `8.5.30` | `@tailwindcss/postcss@4.3.3` | Tailwind CSS compilation | All known CVEs checked | **CLEAN (0 findings)** |
| `node_modules/next/node_modules/postcss` | `8.5.23` | `next@16.4.1` | Next.js internal CSS pipeline | All known CVEs checked | **CLEAN (0 findings)** |

### Historical Advisory Check:
1. **CVE-2023-44270 / GHSA-7fh5-64p2-3v2j (CSS injection):** Affected `< 8.4.31`. Both `8.5.30` and `8.5.23` exceed this threshold.
2. **CVE-2021-23368 / GHSA-56gw-m554-x63c (ReDoS in normalize):** Affected `< 8.2.10`. Both `8.5.30` and `8.5.23` exceed this threshold.
3. **Fresh Audit Verification:** `npm audit --json` returns zero PostCSS advisories across all workspace nodes.
4. **Tailwind & Next.js Preservation:** Existing configuration using Tailwind 4.3.3 and Next.js 16.4.1 was preserved without modification and validated via successful Turbopack build.

---

## 7. Stage 5 — Validation Gate Results

### 7.1. Validation Matrix

| Validation Gate | Command Executed | Exit Code | Result Summary |
|---|---|---|---|
| **Dependency Tree** | `npm ls --depth=0` | 0 | All workspace packages resolved cleanly |
| **Security Audit** | `npm audit --json` | 0 | 14 high severity findings (0 critical, 0 moderate) |
| **Backend Build** | `npm run build --workspace=@youtubbot/backend` | 0 | TypeScript `tsc` compiled cleanly |
| **Web Production Build** | `npm run build --workspace=web` | 0 | Next.js 16.4.1 Turbopack compiled 20 static & dynamic routes |
| **Secret Scanner** | `node scripts/verify_no_secrets.js` | 0 | Credential Guard PASSED: 0 secrets staged or present |
| **Git Diff Hygiene** | `git diff --check` | 1 | Code/manifests clean; pre-existing CRLF warnings on state docs |
| **Auth Regression Test** | `npm run test:security` | 0 | **43 passed, 0 failed** |
| **Cross-Platform TTS Test** | `npm run test:tts` | 1 | **21 passed**, 1 DB test unverified (expected offline) |
| **Legacy Scraper Guard** | `npm run test:legacy` | 1 | **29 passed**, 1 DB test unverified (expected offline) |
| **Content Grounding Test** | `npm run test:phase4b` | 1 | **15 passed**, 8 DB/server tests unverified (expected offline) |
| **End-to-End Pipeline** | `npm run test:pipeline` | Withheld | Database-dependent (PostgreSQL offline per safety rule) |
| **Workflow State Machine** | `npm run test:workflow` | Withheld | Database-dependent (PostgreSQL offline per safety rule) |
| **Remediation Regression** | `npm run test:remediation` | Withheld | Database & web dev server dependent |

### 7.2. Database-Dependent Tests Withheld Per Safety Rules

In strict compliance with the safety mandate (*"Do not terminate PostgreSQL processes or manipulate the database in this phase. Do not start or stop PostgreSQL during this phase"*), the following tests remain unverified:
1. `tests/pipeline/pipeline_e2e.test.js` (`test:pipeline`)
2. `tests/pipeline/phase4a_workflow.test.mjs` (`test:workflow`)
3. `tests/security/remediation_regression.test.mjs` (`test:remediation`)
4. Group 7 in `test:tts` (Renderer failure status transition via Prisma)
5. Group 7 in `test:legacy` (`systemSettings.autoPublishOnline` DB query)
6. Groups 2-5 in `test:phase4b` (Job status transition and persistence queries)

PostgreSQL process status: **Unchanged (Neither started, stopped, nor killed).**

---

## 8. Audit Summary: Advisories vs Package Nodes

### 8.1. Summary Counts
- **Total Audited Dependencies:** 817
- **Unique Root Advisories in Tree:** **2** (both High severity; 0 Critical, 0 Moderate)
- **Total Affected Package-Node Entries:** **14**

### 8.2. Affected Package Nodes Breakdown

#### Cluster 1: `basic-ftp` Root Advisory (1 unique advisory, 7 package nodes)
- Root Advisory: [GHSA-c475-qrg2-pj4r](https://github.com/advisories/GHSA-c475-qrg2-pj4r) (`basic-ftp <= 6.2.0`)
- Nodes:
  1. `node_modules/basic-ftp`
  2. `node_modules/proxy-agent/node_modules/get-uri`
  3. `node_modules/proxy-agent/node_modules/pac-proxy-agent`
  4. `node_modules/proxy-agent`
  5. `node_modules/@puppeteer/browsers`
  6. `node_modules/puppeteer-core`
  7. `node_modules/puppeteer`

#### Cluster 2: `braces` Root Advisory (1 unique advisory, 7 package nodes)
- Root Advisory: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) (`braces <= 3.0.3`)
- Nodes:
  1. `node_modules/braces`
  2. `node_modules/chokidar`
  3. `node_modules/ts-node-dev`
  4. `node_modules/micromatch`
  5. `node_modules/fast-glob`
  6. `node_modules/@next/eslint-plugin-next`
  7. `node_modules/eslint-config-next`

---

## 9. Final Verdict

### `PHASE_5K_3_PARTIALLY_REMEDIATED`

**Rationale:**
- **Confirmed Advisories Remediated:** Both `browserslist` ([GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx)) and `baseline-browser-mapping` ([GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g), [GHSA-w5vr-8v7q-w6rv](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv)) were upgraded to safe, compatible versions without breaking parent dependency contracts.
- **Residual Risks Fully Accounted For:** The remaining 14 package entries map directly to 2 upstream advisories (`basic-ftp` and `braces`) where no safe, non-breaking upstream fixes exist. Both have been verified non-reachable from production HTTP ingress and absent from production deployment artifacts.
- **Workspace & Safety Preserved:** PostgreSQL was neither manipulated nor terminated. No user modifications or untracked assets were discarded. No secrets were exposed. Builds and 108 offline regression assertions passed cleanly.
- **No Release Actions:** This verdict does not declare public-production release authorization.
