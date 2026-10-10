# SIMPLYYTR Agent Instructions

Read `START_HERE.md`, the frozen specification, and `docs/build-readiness/` before implementation.

Rules:
- Inspect before modifying.
- Keep the repository buildable.
- Use canonical project files as durable memory, not chat history.
- Record material architecture changes as ADRs.
- Test every meaningful change.
- Never fabricate analytics, product claims, affiliate data, or functionality.
- Never commit secrets.
- Preserve rights/provenance/compliance controls.
- Keep providers replaceable and paid services optional.
- Do not add unnecessary microservices.
- Do not silently delete legacy functionality; audit it first.
- Do not use stealth publishing as core functionality.
- Autonomous agents must not have unrestricted OS access.
- Update `.agent/state/` at every checkpoint.
