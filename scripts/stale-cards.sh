#!/usr/bin/env bash
# stale-cards.sh
#
# Find In Flight Kanban cards whose `expires YYYY-MM-DD` is in the past.
#
# Reads `Kanban.md`. Looks for lines matching `expires <date>` and compares
# each date to today. Prints stale cards to stdout, one per line.
#
# SCOPED TO `## In Flight` ONLY (2026-07-23). Per Onboarding/conventions.md:
# "Under Review and Blocked cards do NOT auto-expire. Only In Flight has the
# 3-day TTL; Under Review (PR open) and Blocked cards cannot be reclaimed
# without asking in chat first." The scan used to cover the whole board, so an
# `expires` annotation on an Under Review or Blocked card was reported STALE —
# and the onboarding decision tree licenses an agent to reclaim a stale card.
# Any expiry annotation found outside In Flight is reported to stderr as a
# no-TTL note, never as a finding, and never affects the exit code.
#
# Exit codes:
#   0 — no stale In Flight cards
#   1 — stale In Flight cards found (and printed)
#   2 — script error (includes: no `## In Flight` section found, i.e. nothing
#       could be checked — a false green would otherwise be indistinguishable)

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KANBAN="$VAULT_ROOT/Kanban.md"

if [[ ! -f "$KANBAN" ]]; then
  echo "error: $KANBAN not found" >&2
  exit 2
fi

TODAY="$(date +%F)"
EXIT_CODE=0

# Track the current `## ` column and only treat expiries inside `## In Flight`
# as findings. Print the previous line (the card itself) with the annotation.
awk -v today="$TODAY" '
  /^## / {
    section = $0
    sub(/^##[ \t]+/, "", section)
    sub(/[ \t]+$/, "", section)
    in_flight = (section == "In Flight")
    if (in_flight) seen_in_flight = 1
    prev = $0
    next
  }
  /expires [0-9]{4}-[0-9]{2}-[0-9]{2}/ {
    match($0, /expires [0-9]{4}-[0-9]{2}-[0-9]{2}/)
    expires_str = substr($0, RSTART+8, 10)

    # Outside In Flight there is no TTL. Report to stderr so the annotation is
    # not silently dropped, but never as a finding: these cards cannot be
    # reclaimed without asking in chat first.
    if (!in_flight) {
      if (expires_str < today) {
        print "note: past expiry " expires_str " on a card in \"" section "\" — that column has NO TTL." > "/dev/stderr"
        print "      NOT stale, NOT reclaimable without asking in chat first (Onboarding/conventions.md)." > "/dev/stderr"
        if (prev != "") print "      " prev > "/dev/stderr"
      }
      prev = $0
      next
    }

    if (expires_str < today) {
      print "STALE (expired " expires_str ", today " today "):"
      if (prev != "") print "  " prev
      print "  " $0
      print ""
      found = 1
    }
  }
  { prev = $0 }
  END {
    if (!seen_in_flight) exit 2
    exit (found ? 1 : 0)
  }
' "$KANBAN" || EXIT_CODE=$?

if [[ $EXIT_CODE -eq 2 ]]; then
  echo "error: no '## In Flight' section found in $KANBAN — nothing was checked." >&2
  exit 2
fi

if [[ $EXIT_CODE -eq 0 ]]; then
  echo "No stale In Flight cards. (today: $TODAY)"
fi

exit $EXIT_CODE
