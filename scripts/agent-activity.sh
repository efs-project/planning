#!/usr/bin/env bash
# agent-activity.sh
#
# Per-agent activity rollup based on the `Agent: <slug>` commit trailer.
# Prints recent commits grouped by agent.
#
# Usage:
#   ./scripts/agent-activity.sh         # default: last 7 days
#   ./scripts/agent-activity.sh 14      # last 14 days
#
# Exit codes:
#   0 — completed (always)
#   2 — script error

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$VAULT_ROOT"

if [[ ! -d .git ]]; then
  echo "error: not a git repo: $VAULT_ROOT" >&2
  exit 2
fi

DAYS="${1:-7}"

echo "=== Agent activity, last $DAYS days ==="
echo ""

# Get all commit SHAs in the window
SHAS=()
while IFS= read -r line; do
  SHAS+=("$line")
done < <(git log --since="$DAYS days ago" --no-merges --pretty=format:'%H')

if [[ ${#SHAS[@]} -eq 0 ]]; then
  echo "No commits in the last $DAYS days."
  exit 0
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# For each commit, pull subject + agent trailer + date in a robust way.
for sha in "${SHAS[@]}"; do
  agent="$(git log -1 --format='%B' "$sha" | grep -m1 -E '^Agent: ' | sed -E 's/^Agent: +//' | tr -d '\r' || true)"
  agent="${agent:-unknown}"
  date="$(git log -1 --format='%ai' "$sha" | cut -d' ' -f1)"
  short="$(git log -1 --format='%h' "$sha")"
  subject="$(git log -1 --format='%s' "$sha")"
  printf "%s\t%s\t%s\t%s\n" "$agent" "$short" "$date" "$subject"
done | sort -k1,1 -k3,3r > "$TMP"

# Group by agent
CURRENT_AGENT=""
while IFS=$'\t' read -r agent sha date subject; do
  if [[ "$agent" != "$CURRENT_AGENT" ]]; then
    [[ -n "$CURRENT_AGENT" ]] && echo ""
    echo "## $agent"
    CURRENT_AGENT="$agent"
  fi
  echo "  $date  $sha  $subject"
done < "$TMP"

echo ""
echo "=== Summary ==="
awk -F'\t' '{ count[$1]++ } END { for (a in count) printf "  %-30s %d commits\n", a, count[a] }' "$TMP" | sort -k2 -rn
