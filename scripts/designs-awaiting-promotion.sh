#!/usr/bin/env bash
# designs-awaiting-promotion.sh
#
# List all designs whose prose Status is `ready-for-promotion`.
# These are James's promotion queue. Also flags WIP-limit pressure
# (the convention limit is 3).
#
# Exit codes:
#   0 — found 0 or 1+ designs (clean)
#   1 — found designs AT OR OVER the WIP limit of 3
#   2 — script error

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESIGNS="$VAULT_ROOT/Designs"

if [[ ! -d "$DESIGNS" ]]; then
  echo "error: $DESIGNS not found" >&2
  exit 2
fi

WIP_LIMIT=3
COUNT=0

echo "=== Designs awaiting promotion ==="
echo ""

for f in "$DESIGNS"/*.md; do
  base="$(basename "$f")"
  case "$base" in
    _template.md|README.md) continue ;;
  esac

  prose_status="$(grep -m1 -E '^\*\*Status:\*\*' "$f" 2>/dev/null | sed -E 's/^\*\*Status:\*\* +//' | awk '{print $1}' || true)"

  if [[ "$prose_status" == "ready-for-promotion" ]]; then
    # Extract title (first H1)
    title="$(grep -m1 -E '^# ' "$f" 2>/dev/null | sed 's/^# //' || echo "$(basename "$f" .md)")"
    target_repos="$(grep -m1 -E '^\*\*Target repos:\*\*' "$f" 2>/dev/null | sed -E 's/^\*\*Target repos:\*\* +//' || echo "(unspecified)")"
    last_touched="$(git -C "$VAULT_ROOT" log -1 --format='%ai' -- "$f" 2>/dev/null | cut -d' ' -f1 || echo "unknown")"

    echo "- $title"
    echo "    file:          Designs/$base"
    echo "    target repos:  $target_repos"
    echo "    last touched:  $last_touched"
    echo ""
    COUNT=$((COUNT + 1))
  fi
done

echo "=== Summary ==="
echo "Total: $COUNT designs awaiting promotion (WIP limit: $WIP_LIMIT)"

if [[ $COUNT -eq 0 ]]; then
  echo "Promotion queue empty."
  exit 0
elif [[ $COUNT -ge $WIP_LIMIT ]]; then
  echo "AT OR OVER WIP LIMIT — agents should stop queuing new ready-for-promotion designs"
  echo "until James promotes at least one."
  exit 1
else
  echo "Under WIP limit. James can promote at convenience."
  exit 0
fi
