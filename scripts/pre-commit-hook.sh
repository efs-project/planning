#!/usr/bin/env bash
# pre-commit-hook.sh
#
# OPTIONAL pre-commit hook for the planning vault. Runs the tri-sync
# check on every commit; rejects the commit if a tri-sync violation
# is detected. Promotes the convention from "documented" to "enforced."
#
# INSTALL (if you want it):
#   ln -s ../../scripts/pre-commit-hook.sh .git/hooks/pre-commit
#
# UNINSTALL:
#   rm .git/hooks/pre-commit
#
# This script is NOT installed by default. Self-numbered drafts and
# tri-sync drift are mostly caught by periodic runs of tri-sync-check.sh
# — the hook is for teams that want commit-time blocking.

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Only run if staged changes touch Designs/*.md
if ! git diff --cached --name-only | grep -qE '^Designs/.*\.md$'; then
  exit 0
fi

echo "pre-commit: running tri-sync-check.sh against Designs/..."

if ! "$VAULT_ROOT/scripts/tri-sync-check.sh"; then
  echo ""
  echo "pre-commit: tri-sync-check.sh failed. Fix the issues above and re-commit."
  echo "To bypass (NOT RECOMMENDED): git commit --no-verify"
  exit 1
fi

exit 0
