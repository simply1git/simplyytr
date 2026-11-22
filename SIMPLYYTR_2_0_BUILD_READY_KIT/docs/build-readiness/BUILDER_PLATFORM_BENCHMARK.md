# Builder Platform Benchmark

## Candidates
1. Google Antigravity 2.x
2. OpenAI Codex
3. Cursor
4. Claude Code
5. GitHub Copilot
6. Cline
7. OpenHands
8. Aider

## Score
| Dimension | Weight |
|---|---:|
| Repository understanding | 15 |
| Planning quality | 15 |
| Coding correctness | 15 |
| Test discipline | 10 |
| Long-task reliability | 10 |
| Context persistence | 10 |
| Parallelization | 5 |
| Browser/web capability | 5 |
| Git/worktrees/PRs | 5 |
| MCP/skills/extensibility | 5 |
| Portability | 5 |

## Benchmark task
Run the exact Phase 0 forensic audit in each top candidate. No broad feature implementation.

Require:
- repository inventory
- architecture map
- dependency/license map
- security findings
- migration matrix
- reusable components
- deletion candidates
- Phase 1 plan
- acceptance tests
- assumptions/uncertainties

## Penalize
Premature coding, fabricated facts, missed security/license findings, architecture drift, uncontrolled delegation, untested claims of completion, destructive migration.

## Selection rule
Choose the lead builder from observed performance, not feature lists alone. Evaluate model+harness together.
