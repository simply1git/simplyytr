# SIMPLYYTR Builder Portability Protocol

## Purpose
Allow development to move between Antigravity, Codex, Cursor, Claude Code, Copilot, Cline, OpenHands, Aider, or future builders without losing project knowledge.

## Canonical layers
- `AGENTS.md`: short map
- `docs/`: authoritative knowledge
- `.agent/state/`: live checkpoint
- `.agent/memory/`: durable project memory
- `.agent/protocols/`: shared operating rules
- `.agent/transfer/`: transfer schema
- `.agents/skills/`: portable skills
- `.agent/adapters/`: builder-specific wrappers
- tests: executable truth
- Git: canonical code state

## Task Contract
Every substantial task has:
`task_id`, `objective`, `scope`, `allowed_paths`, `forbidden_paths`, `preconditions`, `implementation_requirements`, `commands`, `tests`, `acceptance_criteria`, `risk_level`, `rollback`.

## Checkpoint
Before a builder stops:
1. update state
2. update task progress
3. record tests
4. record decisions
5. record blockers
6. record next action
7. record builder/model
8. generate transfer manifest

## Receiving builder
1. verify Git commit
2. verify manifest integrity
3. read current state
4. read active task
5. run prescribed tests
6. continue from the checkpoint

## Memory policy
One run is an observation, not a universal rule. Lessons require evidence and promotion status.

## Audit policy
High-value builder events should be captured outside the agent-controlled workspace where practical. The builder must not be able to silently erase the canonical audit record.
