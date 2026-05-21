#!/usr/bin/env bash
# tri-sync-check.sh
#
# Verify the tri-sync invariant across every file in Designs/:
#   - Prose `**Status:** X` matches the `#status/X` tag
#   - Filename `NNNN-<slug>.md` implies Status must be `accepted` or `landed`
#   - Filename `<slug>.md` (no NNNN prefix) implies Status must be one of:
#     `draft`, `review`, `ready-for-promotion`, `abandoned`, `rejected`
#
# Also catches self-numbered drafts: a file with `NNNN-` prefix that has
# prose Status `draft` or `review` (per "DO NOT NUMBER YOUR OWN DRAFT"
# rule in design-system.md).
#
# Exit codes:
#   0 — all designs pass
#   1 — issues found (and printed)
#   2 — script error

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESIGNS="$VAULT_ROOT/Designs"

if [[ ! -d "$DESIGNS" ]]; then
  echo "error: $DESIGNS not found" >&2
  exit 2
fi

ISSUES=0

for f in "$DESIGNS"/*.md; do
  base="$(basename "$f")"

  # Skip the template and the folder README
  case "$base" in
    _template.md|README.md) continue ;;
  esac

  # Extract prose Status (first occurrence)
  prose_status="$(grep -m1 -E '^\*\*Status:\*\*' "$f" 2>/dev/null | sed -E 's/^\*\*Status:\*\* +//' | sed -E 's/ +#.*//' | awk '{print $1}' || true)"

  # Extract status/X tag (first occurrence)
  tag_status="$(grep -m1 -oE '#status/[a-z-]+' "$f" 2>/dev/null | sed 's|#status/||' || true)"

  # Filename: is it numbered (NNNN-<slug>.md) or name-only (<slug>.md)?
  if [[ "$base" =~ ^[0-9]{4}- ]]; then
    is_numbered=1
  else
    is_numbered=0
  fi

  # Check 1: prose status and tag status agree
  if [[ -z "$prose_status" ]]; then
    echo "MISSING prose **Status:** field — $f"
    ISSUES=$((ISSUES + 1))
    continue
  fi
  if [[ -z "$tag_status" ]]; then
    echo "MISSING #status/ tag — $f (prose says: $prose_status)"
    ISSUES=$((ISSUES + 1))
    continue
  fi
  if [[ "$prose_status" != "$tag_status" ]]; then
    echo "PROSE/TAG MISMATCH: prose=$prose_status, tag=$tag_status — $f"
    ISSUES=$((ISSUES + 1))
    continue
  fi

  # Check 2: filename and status agree
  if [[ $is_numbered -eq 1 ]]; then
    case "$prose_status" in
      accepted|landed) ;;  # OK
      draft|review|ready-for-promotion)
        echo "SELF-NUMBERED DRAFT: $f has NNNN- prefix but status=$prose_status (numbers are for promoted designs only)"
        ISSUES=$((ISSUES + 1))
        ;;
      abandoned|rejected) ;;  # OK — was promoted then abandoned/rejected
      *)
        echo "UNKNOWN STATUS '$prose_status' on numbered design — $f"
        ISSUES=$((ISSUES + 1))
        ;;
    esac
  else
    case "$prose_status" in
      draft|review|ready-for-promotion|abandoned|rejected) ;;  # OK
      accepted|landed)
        echo "MISSING NUMBER: $f has status=$prose_status but no NNNN- prefix (promotion should have renamed)"
        ISSUES=$((ISSUES + 1))
        ;;
      *)
        echo "UNKNOWN STATUS '$prose_status' on un-numbered draft — $f"
        ISSUES=$((ISSUES + 1))
        ;;
    esac
  fi
done

echo ""
if [[ $ISSUES -eq 0 ]]; then
  echo "Tri-sync invariant holds across all designs."
  exit 0
else
  echo "$ISSUES tri-sync issue(s) found."
  exit 1
fi
