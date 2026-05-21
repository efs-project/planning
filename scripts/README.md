# scripts/

Small bash scripts that close the highest-leverage observability gaps cheaply. Each is ~15-30 lines, zero dependencies beyond standard Unix tools (`grep`, `awk`, `git`, `find`). No Python, no npm.

Run from anywhere — scripts use absolute paths via `$VAULT_ROOT` derived from `$(dirname "$0")/..`.

## What's here

| Script | Purpose | When to run |
|---|---|---|
| `stale-cards.sh` | Find In Flight Kanban cards whose `expires YYYY-MM-DD` is in the past. | When opening Obsidian on a fresh day; before reclaiming an apparently-stalled card. |
| `tri-sync-check.sh` | Verify prose `**Status:**`, `#status/` tag, and filename agree across `Designs/*.md`. Also catches self-numbered drafts. | Before committing a status change; periodically as a vault health check. |
| `agent-activity.sh` | Show recent commits per agent based on `Agent:` trailer. | Weekly; before triaging the promotion queue. |
| `designs-awaiting-promotion.sh` | List designs in `#status/ready-for-promotion` and flag WIP-limit pressure. | Daily check; before deciding what to promote. |
| `promotion-check.sh` | Audit recent `promote:` commits for the trust token, atomic rename, and subject format. | Periodically as a vault health check; after every promotion. |
| `pre-commit-hook.sh` | Optional git hook running tri-sync-check on every commit that touches `Designs/`. Promotes tri-sync from "documented" to "enforced." Not installed by default; symlink into `.git/hooks/pre-commit` to activate. | Once, if you want commit-time blocking instead of periodic checks. |

## Running

```bash
cd /efs/planning
./scripts/stale-cards.sh
./scripts/tri-sync-check.sh
./scripts/agent-activity.sh [days]      # default: 7
./scripts/designs-awaiting-promotion.sh
```

All scripts exit 0 on "clean" and a non-zero code on "issues found" — friendly for CI later if we ever add it.

## Adding a script

Keep them short and Unix-portable. If a script grows beyond ~50 lines, that's a signal it should be a real tool (Python, JS, etc.) elsewhere — not in this directory.

Conventions:

- Shebang `#!/usr/bin/env bash` and `set -euo pipefail`.
- Resolve `$VAULT_ROOT` via `$(cd "$(dirname "$0")/.." && pwd)`.
- Print findings to stdout (one finding per line, parseable).
- Print errors and progress to stderr.
- Exit code: 0 = clean, 1 = issues found, ≥2 = script error.
