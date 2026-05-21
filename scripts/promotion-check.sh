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
# Usage:
#   ./scripts/promotion-check.sh         # default: last 30 days
#   ./scripts/promotion-check.sh 90
#
# Exit codes:
#   0 — all promote commits valid (or none found)
#   1 — invalid promote commits found (and printed)
#   2 — script error

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$VAULT_ROOT"

DAYS="${1:-30}"
ISSUES=0
CHECKED=0

# Find all promote: commits in the window
COMMITS="$(git log --since="$DAYS days ago" --pretty=format:'%H' --grep='^promote:' || true)"

if [[ -z "$COMMITS" ]]; then
  echo "No promote: commits in the last $DAYS days."
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

  # Check 3: commit renames a file matching the pattern
  rename_check="$(git show --name-status --format= "$sha" | grep -E '^R[0-9]+\s+Designs/[^/]+\.md\s+Designs/[0-9]{4}-' || true)"
  if [[ -z "$rename_check" ]]; then
    echo "NO QUALIFYING RENAME: $short — $subject"
    echo "  Expected: rename of Designs/<slug>.md to Designs/NNNN-<slug>.md"
    ISSUES=$((ISSUES + 1))
  fi
done

echo ""
echo "Checked $CHECKED promote: commits in the last $DAYS days."
if [[ $ISSUES -eq 0 ]]; then
  echo "All promotions integrity-valid."
  exit 0
else
  echo "$ISSUES integrity issue(s) found."
  exit 1
fi
