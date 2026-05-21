#!/usr/bin/env bash
# stale-cards.sh
#
# Find In Flight Kanban cards whose `expires YYYY-MM-DD` is in the past.
#
# Reads `Kanban.md`. Looks for lines matching `expires <date>` and compares
# each date to today. Prints stale cards to stdout, one per line.
#
# Exit codes:
#   0 — no stale cards
#   1 — stale cards found (and printed)
#   2 — script error

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KANBAN="$VAULT_ROOT/Kanban.md"

if [[ ! -f "$KANBAN" ]]; then
  echo "error: $KANBAN not found" >&2
  exit 2
fi

TODAY="$(date +%F)"
EXIT_CODE=0

# Match lines containing `expires YYYY-MM-DD`. Print the previous line
# (the card itself) along with the annotation if expired.
awk -v today="$TODAY" '
  /expires [0-9]{4}-[0-9]{2}-[0-9]{2}/ {
    match($0, /expires [0-9]{4}-[0-9]{2}-[0-9]{2}/)
    expires_str = substr($0, RSTART+8, 10)
    if (expires_str < today) {
      print "STALE (expired " expires_str ", today " today "):"
      if (prev != "") print "  " prev
      print "  " $0
      print ""
      found = 1
    }
  }
  { prev = $0 }
  END { exit (found ? 1 : 0) }
' "$KANBAN" || EXIT_CODE=$?

if [[ $EXIT_CODE -eq 0 ]]; then
  echo "No stale In Flight cards. (today: $TODAY)"
fi

exit $EXIT_CODE
