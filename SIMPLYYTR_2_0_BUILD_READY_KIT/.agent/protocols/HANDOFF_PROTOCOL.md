# Builder Handoff Protocol

Before switching builders:
1. checkpoint code
2. record branch/commit
3. record uncommitted changes
4. update current state
5. record decisions/lessons/incidents
6. record tests and blockers
7. write transfer manifest
8. never export secrets

Receiving builder verifies the commit and runs the recorded tests before continuing.
