#!/usr/bin/env bash
#
# open-decisions.sh
#
# Generates the "what does the owner actually need to decide?" roll-up across
# every owner decision queue in Designs/.
#
# WHY THIS EXISTS: on 2026-07-23 an agent worked from a stale folder README,
# missed three current documents, and nearly asked James to answer decisions
# that were under a sequencing hold. Answering "what's open?" required visiting
# 3+ files and knowing they existed. This makes it one command / one page.
#
# DESIGN CONSTRAINTS (deliberate):
#   - Queues are DISCOVERED (`find`), never a hardcoded list. A hardcoded list
#     is itself a hand-maintained index and would rot exactly like the READMEs
#     this was built to compensate for.
#   - Parses the inbox files AS THEY ALREADY ARE. It adds no markup and requires
#     no edits to files the PM does not own.
#   - HOLDS ARE SURFACED FIRST AND LOUDEST. A held queue must never read as
#     answerable — that is the specific failure this tool exists to prevent.
#   - IT NEVER DROPS CONTENT SILENTLY. Both ways this script can quietly lie —
#     an item under a section classify() does not recognize, and a hold written
#     in a form the hold detector does not match — warn loudly on stderr. The
#     generated page's format is unchanged: it is committed and diffed, so a
#     formatting change would be pure noise.
#
# USAGE:
#   ./scripts/open-decisions.sh              # write Open-Decisions.md
#   ./scripts/open-decisions.sh --stdout     # print instead (no file written)
#
# EXIT CODES:
#   0 — generated, nothing suspicious
#   1 — generated (the file IS written), but see the stderr warnings: something
#       was dropped, or a hold may have gone undetected
#   2 — script error, nothing generated
#
# Regenerate in the same commit as any decision-state change. On a merge
# conflict in Open-Decisions.md, NEVER hand-merge a generated file:
#   git checkout --ours Open-Decisions.md && ./scripts/open-decisions.sh

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESIGNS="$VAULT_ROOT/Designs"
OUT="$VAULT_ROOT/Open-Decisions.md"
TODAY="$(date +%Y-%m-%d)"

[[ -d "$DESIGNS" ]] || { echo "error: $DESIGNS not found" >&2; exit 2; }

# Classify a "## " section heading into a bucket.
# efsv2 phrases its live inventory as "... revalidate before asking", which is
# NOT askable — hence the explicit guard before the generic "decide now" match.
#
# OTHER means "unrecognized", and OTHER has no emit branch — items under such a
# section appear NOWHERE on the generated page. That is silent data loss on the
# page AGENTS.md calls the fastest answer to what needs deciding, so OTHER now
# warns on stderr. (SETTLED/DELEGATED/SUPERSEDED/MIRROR also have no emit
# branch, but those omissions are deliberate classifications, not misses.)
classify() {
  local h; h="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  case "$h" in
    *"revalidate before asking"*)              echo "REVALIDATE" ;;
    *"decide now"*)                            echo "ASK" ;;
    *"after evidence"*)                        echo "EVIDENCE" ;;
    *"at launch"*|*"before beta"*|*resourcing*) echo "SCHEDULED" ;;
    *"already settled"*)                       echo "SETTLED" ;;
    *delegated*)                               echo "DELEGATED" ;;
    *superseded*)                              echo "SUPERSEDED" ;;
    *"answer in"*|*"route to"*)                echo "MIRROR" ;;
    *)                                         echo "OTHER" ;;
  esac
}

# GitHub/Obsidian anchor slug: lowercase, drop non [a-z0-9 _-], spaces -> dashes.
anchor() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9 _-]//g; s/ /-/g'
}

QUEUES=$(find "$DESIGNS" -name 'owner-decision-inbox.md' | sort)
[[ -n "$QUEUES" ]] || { echo "error: no owner-decision-inbox.md found" >&2; exit 2; }

ASK_ROWS=""; REVAL_ROWS=""; EVID_ROWS=""; SCHED_ROWS=""
HOLD_ROWS=""; QUEUE_ROWS=""
n_ask=0; n_reval=0; n_evid=0; n_sched=0; n_hold=0
WARNINGS=0

# Loose second net for the hold detector below. Deliberately phrase-based, not
# just the word "hold": the corpus is full of "threshold", "browser-held key"
# and an option literally labelled "Hold and reconcile", none of which are holds.
HOLD_HINT_RE='(on hold|under ([a-z]+ )?hold|sequencing hold|(is|are|remains?) held|hold (is|remains) (in effect|active))'

for q in $QUEUES; do
  rel="${q#"$VAULT_ROOT"/}"
  qname="$(dirname "$rel")"; qname="${qname#Designs}"; qname="${qname#/}"
  [[ -n "$qname" ]] || qname="Designs (root)"

  reconciled="$(grep -m1 -E '^\*\*Last reconciled:\*\*' "$q" 2>/dev/null \
    | sed -E 's/^\*\*Last reconciled:\*\* *//' || true)"
  [[ -n "$reconciled" ]] || reconciled="—"

  # A hold is a blockquote line naming a hold. Surfaced verbatim: re-typing a
  # hold's conditions would be a second copy, and copies drift.
  held=0
  while IFS= read -r hline; do
    [[ -n "$hline" ]] || continue
    held=1; n_hold=$((n_hold + 1))
    txt="$(printf '%s' "$hline" | sed -E 's/^> *//')"
    HOLD_ROWS="${HOLD_ROWS}| \`${qname}\` | ${txt} |
"
  done < <(grep -E '^> \*\*.*[Hh]old' "$q" 2>/dev/null || true)

  # The detector above only sees a hold written as a bolded blockquote. A hold
  # written as an ordinary paragraph would flip this queue from HELD to "ok" —
  # the most dangerous failure this tool can have, since "ok" means askable.
  # So when the strict detector found NOTHING, re-scan with the loose phrase
  # net and warn. Suppressed once a hold is already detected, otherwise every
  # held queue warns about its own hold on every run.
  if [[ $held -eq 0 ]]; then
    hint="$(grep -n -iE "$HOLD_HINT_RE" "$q" 2>/dev/null || true)"
    if [[ -n "$hint" ]]; then
      WARNINGS=$((WARNINGS + 1))
      {
        echo "WARNING: possible UNDETECTED HOLD — ${rel}"
        echo "  This queue is being reported \"ok\", i.e. safe to ask the owner about."
        echo "  The hold detector only matches a blockquote line: > **... hold ...**"
        echo "  These lines mention a hold but are not in that form:"
        printf '%s\n' "$hint" | sed 's/^/    /'
        echo "  Confirm by hand before asking anything from this queue."
      } >&2
    fi
  fi

  section=""; bucket="OTHER"; qcount=0
  while IFS= read -r line; do
    case "$line" in
      '## '*)
        section="${line#\#\# }"; bucket="$(classify "$section")" ;;
      '### '*)
        heading="${line#\#\#\# }"
        id="${heading%%—*}"; id="$(printf '%s' "$id" | sed -E 's/ *$//')"
        title="${heading#*—}"; title="$(printf '%s' "$title" | sed -E 's/^ *//')"
        [[ "$title" != "$heading" ]] || title=""
        link="[${id}](${rel}#$(anchor "$heading"))"
        row="| ${link} | ${title} | \`${qname}\` |
"
        case "$bucket" in
          ASK)
            if [[ $held -eq 1 ]]; then
              REVAL_ROWS="${REVAL_ROWS}${row}"; n_reval=$((n_reval + 1))
            else
              ASK_ROWS="${ASK_ROWS}${row}"; n_ask=$((n_ask + 1))
            fi
            qcount=$((qcount + 1)) ;;
          REVALIDATE)
            REVAL_ROWS="${REVAL_ROWS}${row}"; n_reval=$((n_reval + 1))
            qcount=$((qcount + 1)) ;;
          EVIDENCE)
            EVID_ROWS="${EVID_ROWS}${row}"; n_evid=$((n_evid + 1))
            qcount=$((qcount + 1)) ;;
          SCHEDULED)
            SCHED_ROWS="${SCHED_ROWS}${row}"; n_sched=$((n_sched + 1))
            qcount=$((qcount + 1)) ;;
          OTHER)
            WARNINGS=$((WARNINGS + 1))
            sec="$section"
            [[ -n "$sec" ]] || sec="(no '## ' heading yet — item precedes the first section)"
            {
              echo "WARNING: ITEM DROPPED — ${rel}"
              echo "  ### ${heading}"
              echo "  sits under '## ${sec}', which classify() does not recognize, so it"
              echo "  appears NOWHERE in Open-Decisions.md — not even as 'not askable'."
              echo "  Fix: rename the section to a recognized phrase, or add a case to"
              echo "  classify() in scripts/open-decisions.sh."
            } >&2 ;;
        esac ;;
    esac
  done < "$q"

  flag="ok"; [[ $held -eq 1 ]] && flag="**HELD**"
  QUEUE_ROWS="${QUEUE_ROWS}| [\`${qname}\`](${rel}) | ${qcount} | ${reconciled} | ${flag} |
"
done

emit() {
cat <<EOF
# Open decisions

<!-- GENERATED by scripts/open-decisions.sh on ${TODAY} — DO NOT EDIT BY HAND.
     Source of truth is each Designs/**/owner-decision-inbox.md.
     Regenerate in the same commit as any decision-state change.
     On conflict: git checkout --ours Open-Decisions.md && ./scripts/open-decisions.sh -->

**Generated:** ${TODAY} · **Ask now: ${n_ask}** · Held/revalidate: ${n_reval} · Awaiting evidence: ${n_evid} · Scheduled: ${n_sched}

This page answers one question: *what does the owner actually need to decide right now?*
It is a **view with zero authority** — every item's truth lives in its owning queue.
EOF

if [[ $n_hold -gt 0 ]]; then
cat <<EOF

## Do NOT ask these — active holds

A held queue is an **inventory, not an answerable packet**. Asking anyway pushes
the owner through a gate the designers deliberately closed.

| Queue | Hold |
|---|---|
${HOLD_ROWS}
EOF
fi

cat <<EOF

## Ask now (${n_ask})

EOF
if [[ $n_ask -gt 0 ]]; then
  printf '| ID | Question | Queue |\n|---|---|---|\n%s\n' "$ASK_ROWS"
  echo "Reply with the code and any exception in plain English, e.g. \`R1A\` or \`R1B, but keep locate/read naming provisional\`."
else
  echo "_Nothing is awaiting an answer right now._"
fi

if [[ $n_reval -gt 0 ]]; then
cat <<EOF

## Inventoried but not askable (${n_reval})

Under a hold or pending revalidation. Listed so nothing is invisible — **not** a queue to work through.

| ID | Question | Queue |
|---|---|---|
${REVAL_ROWS}
EOF
fi

if [[ $n_evid -gt 0 ]]; then
cat <<EOF

## Waiting on evidence (${n_evid}) — do not ask

| ID | Question | Queue |
|---|---|---|
${EVID_ROWS}
EOF
fi

if [[ $n_sched -gt 0 ]]; then
cat <<EOF

## Scheduled / launch-gated (${n_sched}) — do not ask

| ID | Question | Queue |
|---|---|---|
${SCHED_ROWS}
EOF
fi

cat <<EOF

## Queue health

| Queue | Live items | Last reconciled | State |
|---|---|---|---|
${QUEUE_ROWS}
_Decision **history** is not shown here. A ruling is recorded in the history owned
by the queue that owns the item — \`Designs/<folder>/owner-rulings.md\` where that
file exists, \`Decisions.md\` otherwise — and never in both._
EOF
}

if [[ "${1:-}" == "--stdout" ]]; then
  emit
else
  emit > "$OUT"
  echo "Wrote ${OUT#"$VAULT_ROOT"/} — ask now: ${n_ask}, held/revalidate: ${n_reval}, evidence: ${n_evid}, scheduled: ${n_sched}"
fi

if [[ $WARNINGS -gt 0 ]]; then
  echo "" >&2
  echo "$WARNINGS warning(s) above. The output WAS generated — it is just not trustworthy" >&2
  echo "until each warning is resolved. Do not present this page as complete." >&2
  exit 1
fi
