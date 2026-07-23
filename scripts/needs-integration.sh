#!/usr/bin/env bash
#
# needs-integration.sh
#
# Produces the "decided but not yet integrated" work order: documents that still
# contradict a ruling the owner already made.
#
# WHY: a decision is not done when it is recorded — it is done when the docs that
# contradict it stop saying the old thing. EAS was dropped as the record carrier
# on 2026-07-07 and 16 days later the Kanban card still said "EAS-core retained."
#
# WHY DERIVED, NOT A STATUS FIELD: every hand-maintained coordination field in
# this vault has rotted (agent-status.md is a *mandated* daily append and went
# 30 days dead). A field someone must remember to update is a field that lies.
# This is recomputed from scratch every run, so it cannot drift.
#
# FITS THE TWO-MODEL WORKFLOW:
#   deciding agent (cheap)  -> records the ruling + adds one row to Retirements.md
#   this script             -> finds every live contradiction
#   integrating agent (strong) -> fixes them; rows clear themselves at zero hits
#
# USAGE:
#   ./scripts/needs-integration.sh            # human-readable work order
#   ./scripts/needs-integration.sh --brief    # one line per phrase (for reports)
#
# Exit 0 = nothing awaiting integration. Exit 1 = work outstanding.

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REG="$VAULT_ROOT/Retirements.md"
BRIEF=0
[[ "${1:-}" == "--brief" ]] && BRIEF=1

[[ -f "$REG" ]] || { echo "error: Retirements.md not found" >&2; exit 2; }

# Append-only history is SUPPOSED to contain retired phrases. Never scan it.
is_history() {
  case "$1" in
    */Decisions.md|*/owner-rulings.md|*/Retirements.md) return 0 ;;
    */Reviews/*|*/Brainstorms/*|*/Daily\ Notes/*) return 0 ;;
    *) return 1 ;;
  esac
}

TOTAL=0
ROWCOUNT=0
OUT=""

# Rows in the Active table: | phrase | replacement | ruling | since |
# No `mapfile` — macOS ships bash 3.2, and this must run wherever an agent lands.
while IFS= read -r row; do
  ROWCOUNT=$((ROWCOUNT + 1))
  phrase=$(printf '%s' "$row" | awk -F'|' '{print $2}' | sed -E 's/^ *`//; s/` *$//')
  repl=$(printf '%s' "$row"  | awk -F'|' '{print $3}' | sed -E 's/^ *//; s/ *$//')
  [[ -n "$phrase" ]] || continue

  hits=""
  n=0
  while IFS= read -r hit; do
    file="${hit%%:*}"
    is_history "$file" && continue
    # An explicit marker means the line legitimately keeps the old phrase.
    printf '%s' "$hit" | grep -q '@historical' && continue
    hits="${hits}    ${hit#"$VAULT_ROOT"/}
"
    n=$((n + 1))
  done < <(grep -rn --include='*.md' -F "$phrase" "$VAULT_ROOT" 2>/dev/null || true)

  TOTAL=$((TOTAL + n))
  if [[ $n -gt 0 ]]; then
    if [[ $BRIEF -eq 1 ]]; then
      OUT="${OUT}  ${phrase} -> ${repl}: ${n} live contradiction(s)
"
    else
      OUT="${OUT}
  \"${phrase}\" should now read: ${repl}   [${n} hit(s)]
${hits}"
    fi
  fi
done < <(awk '/^## Active/{a=1;next} /^## Cleared/{a=0} a && /^\| `/{print}' "$REG")

[[ $ROWCOUNT -gt 0 ]] || { echo "No active retirements — nothing to integrate."; exit 0; }

echo "=== Decided but not integrated ==="
if [[ $TOTAL -eq 0 ]]; then
  echo ""
  echo "Nothing outstanding — every ruling's retired phrasing is gone from live docs."
  echo "(History is excluded by design and still contains it, correctly.)"
  exit 0
fi

printf '%s\n' "$OUT"
echo "Total: $TOTAL live contradiction(s) across $(printf '%s' "$OUT" | grep -c ':' || true) reference(s)."
echo ""
echo "Work order for the integrating agent: fix each line above so it reflects the"
echo "current ruling, then re-run. When a phrase reaches zero, move its row in"
echo "Retirements.md from Active to Cleared with today's date."
exit 1
