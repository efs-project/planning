#!/usr/bin/env bash
# promotion-check.sh
#
# Audit recent `promote:` commits for the integrity invariants of the
# promotion ceremony:
#   - Commit subject is `promote: DESIGN-NNNN — <title>`
#   - Commit body contains the literal trust token
#     `Promoted by @james on YYYY-MM-DD`
#   - The commit includes a file rename from `<slug>.md` to `NNNN-<slug>.md`
#
# Scans the last $DAYS days of history. Flags any `promote:` commit
# missing the trust token (i.e., self-promotion attempt by an agent
# without James's authorization).
#
# HONESTY NOTE: promotions are rare, so the common case is that the window
# contains none. That is UNVERIFIED, not verified-good — the script says so
# explicitly and always reports when the last promotion actually was, so a
# zero-commit run can never be misread as a clean bill of health.
#
# Usage:
#   ./scripts/promotion-check.sh         # default: last 30 days
#   ./scripts/promotion-check.sh 90
#
# Exit codes:
#   0 — every promote commit *inside the window* is valid. Read the output to
#       see whether that was zero commits (nothing checked) or some.
#   1 — invalid promote commits found (and printed)
#   2 — script error

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$VAULT_ROOT"

DAYS="${1:-30}"
ISSUES=0
CHECKED=0

# The most recent promote: commit in ALL of history, regardless of the window.
# Reported unconditionally: without it, "0 commits in window" reads as "clean".
LAST_SHA="$(git log -1 --pretty=format:'%H' --grep='^promote:' || true)"
if [[ -n "$LAST_SHA" ]]; then
  LAST_LINE="$(git log -1 --date=short --pretty=format:'%h  %ad (%ar)  %s' "$LAST_SHA")"
else
  LAST_LINE=""
fi

# Find all promote: commits in the window
COMMITS="$(git log --since="$DAYS days ago" --pretty=format:'%H' --grep='^promote:' || true)"

if [[ -z "$COMMITS" ]]; then
  echo "UNVERIFIED: 0 promote: commits in the last $DAYS days — nothing was checked."
  echo "  This is NOT a clean bill of health. It means the window is empty."
  if [[ -n "$LAST_LINE" ]]; then
    echo "  Last promotion in history: $LAST_LINE"
    echo "  To actually verify it, widen the window past that date, e.g.:"
    echo "    ./scripts/promotion-check.sh 3650"
  else
    echo "  No promote: commits anywhere in this repo's history."
  fi
  exit 0
fi

for sha in $COMMITS; do
  CHECKED=$((CHECKED + 1))
  subject="$(git log -1 --format='%s' "$sha")"
  body="$(git log -1 --format='%b' "$sha")"
  short="$(git log -1 --format='%h' "$sha")"

  # Check 1: subject format `promote: DESIGN-NNNN — <title>`
  if ! [[ "$subject" =~ ^promote:\ DESIGN-[0-9]{4}\ —\ .+ ]]; then
    echo "BAD SUBJECT (expected 'promote: DESIGN-NNNN — <title>'): $short — $subject"
    ISSUES=$((ISSUES + 1))
  fi

  # Check 2: body contains literal trust token
  if ! echo "$body" | grep -qE 'Promoted by @james on [0-9]{4}-[0-9]{2}-[0-9]{2}'; then
    echo "MISSING TRUST TOKEN: $short — $subject"
    echo "  Expected body line: 'Promoted by @james on YYYY-MM-DD'"
    ISSUES=$((ISSUES + 1))
  fi

  # Check 3: commit renames a file matching the pattern.
  # Recursive as of 2026-07-23 — was `Designs/[^/]+\.md`, which only matched
  # designs at the root of Designs/. The live corpus lives in Designs/efsv2/
  # and Designs/clientv2/, so the next promotion would have been flagged
  # "NO QUALIFYING RENAME" while being perfectly correct. Same bug class
  # already fixed in tri-sync-check.sh and designs-awaiting-promotion.sh.
  rename_check="$(git show --name-status --format= "$sha" \
    | grep -E '^R[0-9]+[[:space:]]+Designs/([^[:space:]]+/)?[^/[:space:]]+\.md[[:space:]]+Designs/([^[:space:]]+/)?[0-9]{4}-' || true)"
  if [[ -z "$rename_check" ]]; then
    echo "NO QUALIFYING RENAME: $short — $subject"
    echo "  Expected: rename of Designs/[<folder>/]<slug>.md to Designs/[<folder>/]NNNN-<slug>.md"
    ISSUES=$((ISSUES + 1))
  fi
done

echo ""
echo "Checked $CHECKED promote: commits in the last $DAYS days."
[[ -n "$LAST_LINE" ]] && echo "Last promotion in history: $LAST_LINE"
if [[ $ISSUES -eq 0 ]]; then
  echo "All $CHECKED checked promotion(s) integrity-valid."
  exit 0
else
  echo "$ISSUES integrity issue(s) found."
  exit 1
fi
