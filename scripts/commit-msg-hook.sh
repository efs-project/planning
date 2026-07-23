#!/usr/bin/env bash
#
# commit-msg-hook.sh — validates AGENT commit messages. Install with:
#   ./scripts/install-hooks.sh
#
# SCOPE IS DELIBERATELY NARROW. It checks only things that are (a) mechanically
# decidable, (b) already green, and (c) cheap to fix in under 10 seconds. It does
# NOT run tri-sync — that check currently has 7 known findings, and a gate that
# arrives red is a gate everyone learns to bypass. Never widen this to a check
# that isn't already passing.
#
# WHY IT EXEMPTS OBSIDIAN COMMITS: the vault has exactly one git author
# ("James Carnley") for both human and agent commits, so author is useless as a
# discriminator. The Obsidian Git plugin's message template `vault backup: <date>`
# IS a clean one — verified 2026-07-23: 12 such commits, 0 of them agent-authored.
# Human commits through Obsidian (including mobile, where hooks don't fire at all)
# pass straight through by design.

set -euo pipefail

MSG_FILE="$1"
SUBJECT="$(head -1 "$MSG_FILE")"
BODY="$(cat "$MSG_FILE")"

# --- Human/Obsidian commits: not our business ---------------------------------
case "$SUBJECT" in
  "vault backup:"*|"Merge "*|"Revert "*|fixup!*|squash!*) exit 0 ;;
esac

fail() {
  echo "" >&2
  echo "commit-msg: $1" >&2
  echo "" >&2
  echo "  Subject was: $SUBJECT" >&2
  echo "" >&2
  echo "  This hook only checks agent commits. Human commits made through" >&2
  echo "  Obsidian (\`vault backup: ...\`) are exempt automatically." >&2
  echo "  To bypass once: git commit --no-verify" >&2
  exit 1
}

# --- 1. Trailers glued on by a literal \n (the observed Codex failure) ---------
# Six vault commits landed with trailers as a literal \n on one physical line,
# breaking agent-activity.sh bucketing. Match THAT shape specifically, not any
# occurrence of \n — a message may legitimately discuss \n in prose. (This hook
# false-positived on its own introducing commit; narrowed 2026-07-23.)
if printf '%s' "$BODY" | grep -qE '\\n(Agent|Co-authored-by|Harness):'; then
  fail 'trailers are glued to the body by a literal \n instead of a real newline.
  Write the message to a file and use git commit -F <file>.'
fi

# --- 2. Subject shape: <area>: <imperative summary> ----------------------------
if ! printf '%s' "$SUBJECT" | grep -qE '^[a-z][a-z0-9-]*(\([a-z0-9/-]+\))?: .+'; then
  fail 'subject must be "<area>: <imperative summary>" (lowercase area).
  Areas in use: design, kanban, docs, chore, promote, land, sync, pm, status.'
fi

# --- 3. Agent trailers present, as real trailer lines --------------------------
if ! printf '%s' "$BODY" | grep -qE '^Agent: .+'; then
  fail 'missing "Agent: <slug>" trailer on its own line.'
fi
if ! printf '%s' "$BODY" | grep -qE '^Co-authored-by: .+<.+@.+>'; then
  fail 'missing "Co-authored-by: <Model> <noreply@vendor>" trailer.'
fi

exit 0
