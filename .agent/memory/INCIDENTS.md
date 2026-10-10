# Incidents Register

## INC-0001: Committed Chrome Session Profile Discovery
- **Date:** 2026-10-09
- **Severity:** CRITICAL
- **Component:** `apps/storage/chrome_profile/`
- **Description:** Forensic scan discovered 500+ files comprising a genuine Google Chrome user data profile committed to Git history.
- **Immediate Impact:** Potential session credential and cookie exposure.
- **Action Taken:** Quarantined in Phase 0; flagged as SEC-001; remediation plan scheduled for immediate user action and Task 1.1 execution.
- **Resolution Status:** IN PROGRESS (Awaiting user session revocation and git history scrubbing).
