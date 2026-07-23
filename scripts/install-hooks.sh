#!/usr/bin/env bash
#
# install-hooks.sh — install the vault's git hooks into this clone.
#
# Hooks are per-clone and NOT carried by git, so every fresh agent checkout starts
# without them. Run this once after cloning. Idempotent.
#
#   ./scripts/install-hooks.sh
#
# Installs:
#   commit-msg -> scripts/commit-msg-hook.sh   (agent commit format; exempts Obsidian)
#
# Deliberately NOT installed: the tri-sync pre-commit hook. It has 7 known
# findings, and a gate that arrives red trains everyone to use --no-verify.
# Run ./scripts/tri-sync-check.sh manually instead until it is green.

set -euo pipefail

VAULT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS="$VAULT_ROOT/.git/hooks"

[[ -d "$HOOKS" ]] || { echo "error: $HOOKS not found — is this a git clone?" >&2; exit 2; }

ln -sf ../../scripts/commit-msg-hook.sh "$HOOKS/commit-msg"
chmod +x "$VAULT_ROOT/scripts/commit-msg-hook.sh"

echo "Installed: commit-msg -> scripts/commit-msg-hook.sh"
echo ""
echo "Verify with a throwaway:"
echo "  git commit --allow-empty -m 'bad subject'        # should FAIL"
echo "  git commit --allow-empty -m 'vault backup: x'    # should PASS (Obsidian exemption)"
echo ""
echo "Uninstall: rm $HOOKS/commit-msg"
