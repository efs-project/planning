#!/usr/bin/env bash
# Behavioral tests for agent-role.sh.  Each case copies the real helper into a
# disposable vault tree; the helper has no test-only root override.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HELPER_SOURCE="$SCRIPT_DIR/agent-role.sh"
PM_BRIEF_SOURCE="$SCRIPT_DIR/../Agents/pm.md"
TEST_TMP="$(mktemp -d "${TMPDIR:-/tmp}/agent-role-test.XXXXXX")"
OUTPUT="$TEST_TMP/stdout"
ERROR="$TEST_TMP/stderr"
LAST_STATUS=0
TESTS=0
FAILURES=0

cleanup() {
  rm -rf "$TEST_TMP"
}
trap cleanup EXIT HUP INT TERM

note_failure() {
  echo "FAIL: $1" >&2
  FAILURES=$((FAILURES + 1))
}

assert_status() {
  TESTS=$((TESTS + 1))
  if [[ "$LAST_STATUS" -ne "$1" ]]; then
    note_failure "expected exit $1, got $LAST_STATUS; stderr: $(cat "$ERROR")"
  fi
}

assert_stdout() {
  TESTS=$((TESTS + 1))
  local expected="$1"
  local actual
  actual="$(cat "$OUTPUT")"
  if [[ "$actual" != "$expected" ]]; then
    note_failure "unexpected stdout; expected [$expected], got [$actual]"
  fi
}

assert_contains() {
  TESTS=$((TESTS + 1))
  if ! grep -F -q -- "$1" "$OUTPUT"; then
    note_failure "stdout did not contain [$1]"
  fi
}

assert_not_contains() {
  TESTS=$((TESTS + 1))
  if grep -F -q -- "$1" "$OUTPUT"; then
    note_failure "stdout unexpectedly contained [$1]"
  fi
}

snapshot() {
  find "$1" -type f -exec shasum {} \; | LC_ALL=C sort
}

make_fixture() {
  FIXTURE="$TEST_TMP/fixture-$RANDOM"
  mkdir -p "$FIXTURE/scripts" "$FIXTURE/Agents/alpha" "$FIXTURE/Agents/beta"
  cp "$HELPER_SOURCE" "$FIXTURE/scripts/agent-role.sh"
  chmod +x "$FIXTURE/scripts/agent-role.sh"

  cat > "$FIXTURE/Agents/README.md" <<'EOF'
# Test roster

<!-- role-registry:start -->
| Role ID | Name | Aliases | Brief | Use |
|---|---|---|---|---|
| alpha | Alpha Role | Alpha Alias | [SOUL](./alpha/SOUL.md) | established |
| beta | Beta Role | Beta Alias; Exact Alias | [SOUL](./beta/SOUL.md) | on-demand |
| pm | EFS Project Manager | Project Manager | [PM SOUL](./pm.md) | established |
<!-- role-registry:end -->
EOF
  cat > "$FIXTURE/Agents/alpha/SOUL.md" <<'EOF'
# Alpha Role

## Mission

Test the helper.

## Owns

Its bounded work.

## Does not own

Other work.

## Deliverables

Observable evidence.

## Collaborators

The acceptance owner.

## Decisions

Reversible details only.

## Start here

Read this test fixture.

## Working style

Be precise.
EOF
  cp "$FIXTURE/Agents/alpha/SOUL.md" "$FIXTURE/Agents/beta/SOUL.md"
  # PM deliberately retains its legacy heading shape rather than the SOUL form.
  cp "$PM_BRIEF_SOURCE" "$FIXTURE/Agents/pm.md"
  cat > "$FIXTURE/Agents/launch.md" <<'EOF'
# Launch

Use the selected role.
EOF
}

run_helper() {
  local cwd="$1"
  shift
  local before after
  before="$(snapshot "$FIXTURE")"
  set +e
  (
    cd "$cwd"
    "$FIXTURE/scripts/agent-role.sh" "$@"
  ) >"$OUTPUT" 2>"$ERROR"
  LAST_STATUS=$?
  set -e
  after="$(snapshot "$FIXTURE")"
  TESTS=$((TESTS + 1))
  if [[ "$before" != "$after" ]]; then
    note_failure "helper wrote fixture files for: $*"
  fi
}

test_valid_operations_from_unrelated_directory() {
  make_fixture
  local elsewhere="$TEST_TMP/elsewhere" fixture_actual
  mkdir -p "$elsewhere"
  fixture_actual="$(cd "$FIXTURE" && pwd -P)"
  run_helper "$elsewhere" list
  assert_status 0
  assert_stdout $'alpha\tAlpha Role\tAgents/alpha/SOUL.md\nbeta\tBeta Role\tAgents/beta/SOUL.md\npm\tEFS Project Manager\tAgents/pm.md'

  run_helper "$elsewhere" launch "exact alias"
  assert_status 0
  assert_contains "Role ID: beta"
  assert_contains "Role brief: $fixture_actual/Agents/beta/SOUL.md"
  assert_contains "Launch contract: $fixture_actual/Agents/launch.md"
  assert_contains "Planning checkout on this machine: $fixture_actual"
  assert_contains "For another machine, obtain the assigned branch and commit"

  run_helper "$elsewhere" check
  assert_status 0
  assert_contains "3 role(s) checked"
  assert_contains "Limits: this checker does not prove semantics, locks, permission enforcement, runtime support, or all project links."
}

test_unknown_role_is_rejected() {
  make_fixture
  run_helper "$FIXTURE" launch "not a role"
  assert_status 1
}

test_duplicate_id_is_rejected_before_list_or_launch() {
  make_fixture
  sed -i '' 's/| beta | Beta Role/| alpha | Beta Role/' "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" list
  assert_status 1
  run_helper "$FIXTURE" launch "Alpha Alias"
  assert_status 1
}

test_alias_id_and_name_collisions_are_rejected() {
  make_fixture
  sed -i '' 's/Beta Alias; Exact Alias/alpha/' "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" check
  assert_status 1

  make_fixture
  sed -i '' 's/| beta | Beta Role/| beta | Alpha Role/' "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" check
  assert_status 1
}

test_missing_and_unsafe_briefs_are_rejected() {
  make_fixture
  sed -i '' 's#./beta/SOUL.md#./beta/missing.md#' "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" check
  assert_status 1

  make_fixture
  sed -i '' 's#./beta/SOUL.md#./../outside.md#' "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" check
  assert_status 1

  make_fixture
  local outside="$TEST_TMP/outside.md"
  cp "$FIXTURE/Agents/alpha/SOUL.md" "$outside"
  ln -s "$outside" "$FIXTURE/Agents/beta/escape.md"
  sed -i '' 's#./beta/SOUL.md#./beta/escape.md#' "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" check
  assert_status 1
}

test_empty_and_malformed_registries_are_rejected() {
  make_fixture
  sed -i '' '/| alpha |/,/| pm |/d' "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" check
  assert_status 1

  make_fixture
  sed -i '' 's/| Role ID | Name | Aliases | Brief | Use |/| Name | Role ID | Aliases | Brief | Use |/' "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" check
  assert_status 1

  make_fixture
  sed -i '' 's/| beta | Beta Role | Beta Alias; Exact Alias | \[SOUL\](\.\/beta\/SOUL\.md) | on-demand |/| beta | Beta Role | Beta Alias | [SOUL](.\/beta\/SOUL.md) |/' "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" check
  assert_status 1

  make_fixture
  sed -i '' 's/Alpha Alias/Alpha Alias;/' "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" check
  assert_status 1
}

test_missing_and_empty_required_sections_are_rejected() {
  make_fixture
  sed -i '' '/## Working style/,$d' "$FIXTURE/Agents/beta/SOUL.md"
  run_helper "$FIXTURE" check
  assert_status 1

  make_fixture
  sed -i '' '/## Owns/{n; s/.*/## Does not own/;}' "$FIXTURE/Agents/beta/SOUL.md"
  run_helper "$FIXTURE" check
  assert_status 1
}

test_structural_only_required_sections_block_trusted_launch() {
  make_fixture
  sed -i '' 's/Its bounded work\./### Placeholder/' "$FIXTURE/Agents/beta/SOUL.md"
  run_helper "$FIXTURE" launch "Exact Alias"
  assert_status 1
  assert_not_contains "Role ID: beta"

  make_fixture
  sed -i '' 's/Its bounded work\./<!-- intentionally blank -->/' "$FIXTURE/Agents/beta/SOUL.md"
  run_helper "$FIXTURE" check
  assert_status 1
}

test_paths_with_spaces_and_pm_legacy_brief_pass() {
  local saved_tmp="$TEST_TMP"
  TEST_TMP="$saved_tmp/fixture tree with spaces"
  mkdir -p "$TEST_TMP"
  make_fixture
  run_helper "$TEST_TMP" check
  assert_status 0
  run_helper "$TEST_TMP" launch "PROJECT MANAGER"
  assert_status 0
  assert_contains "Role ID: pm"
  TEST_TMP="$saved_tmp"
}

test_corruption_of_an_unrelated_row_blocks_launch() {
  make_fixture
  sed -i '' 's/| beta | Beta Role/| ALPHA | Beta Role/' "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" launch "Alpha Alias"
  assert_status 1
}

test_usage_errors_have_runtime_status() {
  make_fixture
  run_helper "$FIXTURE" nonsense
  assert_status 2
  run_helper "$FIXTURE" launch
  assert_status 2

  make_fixture
  rm -f "$FIXTURE/Agents/README.md"
  run_helper "$FIXTURE" check
  assert_status 2
}

test_valid_operations_from_unrelated_directory
test_unknown_role_is_rejected
test_duplicate_id_is_rejected_before_list_or_launch
test_alias_id_and_name_collisions_are_rejected
test_missing_and_unsafe_briefs_are_rejected
test_empty_and_malformed_registries_are_rejected
test_missing_and_empty_required_sections_are_rejected
test_structural_only_required_sections_block_trusted_launch
test_paths_with_spaces_and_pm_legacy_brief_pass
test_corruption_of_an_unrelated_row_blocks_launch
test_usage_errors_have_runtime_status

if [[ "$FAILURES" -ne 0 ]]; then
  echo "$FAILURES of $TESTS assertions failed." >&2
  exit 1
fi

echo "PASS: $TESTS assertions"
