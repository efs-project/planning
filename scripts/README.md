# scripts/

Small bash scripts that close the highest-leverage observability gaps cheaply. Zero dependencies beyond standard Unix tools (`grep`, `awk`, `git`, `find`). No Python, no npm. Must run on macOS's bash 3.2 — no `mapfile`, no associative arrays.

Run from anywhere — scripts use absolute paths via `$VAULT_ROOT` derived from `$(dirname "$0")/..`.

**This index must list every file in this directory.** It went stale once (6 of 10 scripts listed) and stale indexes are the exact failure these tools exist to catch. If you add a script, add a row.

## Checks

| Script | Purpose | When to run |
|---|---|---|
| `stale-cards.sh` | Find Kanban cards **in `## In Flight` only** whose `expires YYYY-MM-DD` is past. Under Review and Blocked have no TTL, so expiries there are reported to stderr as non-findings — they cannot be reclaimed without asking in chat first. | When opening Obsidian on a fresh day; before reclaiming an apparently-stalled card. |
| `tri-sync-check.sh` | Verify prose `**Status:**`, `#status/` tag, and filename agree across every design in `Designs/` **recursively, including subfolders** (`Designs/efsv2/`, `Designs/clientv2/`). Also catches self-numbered drafts. | Before committing a status change; periodically as a vault health check. |
| `designs-awaiting-promotion.sh` | List designs in `#status/ready-for-promotion` (recursive) and flag WIP-limit pressure. | Daily check; before deciding what to promote. |
| `promotion-check.sh` | Audit `promote:` commits in a time window for the trust token, atomic rename, and subject format. Promotions are rare, so an empty window is normal — the script says **UNVERIFIED** and reports when the last promotion actually was, rather than reading as a pass. | Periodically as a vault health check; after every promotion. Widen the window (`./scripts/promotion-check.sh 3650`) to actually check something. |
| `open-decisions.sh` | Regenerate `Open-Decisions.md` — the roll-up of every `Designs/**/owner-decision-inbox.md`, holds first and loudest. Warns on stderr (and exits 1) if an item falls under an unrecognized section or a queue may have an undetected hold. | In the same commit as any decision-state change. |
| `needs-integration.sh` | From `Retirements.md`, find documents that still contradict a ruling the owner already made — "decided but not yet integrated". `--brief` for one line per phrase. | Before claiming a decision is done; when picking up integration work. |
| `agent-activity.sh` | Show recent commits per agent based on the `Agent:` trailer. | Weekly; before triaging the promotion queue. |

## Git hooks

Hooks are per-clone and not carried by git — a fresh agent checkout has none.

| Script | Purpose | When to run |
|---|---|---|
| `install-hooks.sh` | Install the vault's hooks into this clone. Idempotent. Installs `commit-msg` only. | Once, after cloning. |
| `commit-msg-hook.sh` | Validates agent commit-message format; exempts Obsidian's `vault backup: <date>` commits. Installed by `install-hooks.sh` — not run directly. | Never directly. |
| `pre-commit-hook.sh` | Optional hook running tri-sync-check on commits touching `Designs/`. **Deliberately not installed** by `install-hooks.sh`: tri-sync has known findings, and a gate that arrives red trains everyone to use `--no-verify`. | Only if you want commit-time blocking; symlink into `.git/hooks/pre-commit`. |

## Running

```bash
cd <your planning checkout>
./scripts/stale-cards.sh
./scripts/tri-sync-check.sh
./scripts/designs-awaiting-promotion.sh
./scripts/promotion-check.sh [days]     # default: 30
./scripts/open-decisions.sh             # writes Open-Decisions.md; --stdout to preview
./scripts/needs-integration.sh          # --brief for one line per phrase
./scripts/agent-activity.sh [days]      # default: 7
```

All checks exit 0 on "clean" and a non-zero code on "issues found" — friendly for CI later if we ever add it. **Exit 0 is not automatically a clean bill of health**: read the output for whether anything was in scope to check. `stale-cards.sh` and `promotion-check.sh` both say so explicitly when they checked nothing.

## Adding a script

Keep them short and Unix-portable. Add a row to the tables above in the same commit.

Conventions:

- Shebang `#!/usr/bin/env bash` and `set -euo pipefail`.
- Resolve `$VAULT_ROOT` via `$(cd "$(dirname "$0")/.." && pwd)`.
- Print findings to stdout (one finding per line, parseable).
- Print errors, progress, and "this could not be checked" warnings to stderr.
- Exit code: 0 = clean, 1 = issues found, ≥2 = script error.
- bash 3.2 compatible (macOS ships 3.2): no `mapfile`, no `declare -A`, no `${var^^}`.
- **Never let "found nothing" print like "verified good."** Anything that walks `Designs/` must recurse into subfolders — a non-recursive glob hid ~77% of the corpus and produced three separate false greens (fixed 2026-07-23 in `tri-sync-check.sh`, `designs-awaiting-promotion.sh`, and `promotion-check.sh`). If a scan has an empty scope, say so.
