# Role helper verification

**Date:** 2026-09-03
**Scope:** Task 2 optional read-only registry routing helper and behavioral fixtures.

## TDD evidence

RED 1, before `scripts/agent-role.sh` existed:

```text
$ /bin/bash scripts/test-agent-role.sh
cp: .../scripts/agent-role.sh: No such file or directory
```

RED 2, after adding an adversarial trailing-empty-alias fixture but before
rejecting empty alias segments:

```text
$ /bin/bash scripts/test-agent-role.sh
FAIL: expected exit 1, got 0; stderr:
1 of 53 assertions failed.
```

RED 3, after adding a missing-roster runtime fixture but before preserving the
helper's runtime exit code:

```text
$ /bin/bash scripts/test-agent-role.sh
FAIL: expected exit 2, got 1; stderr: error: Agents/README.md not found from .../fixture-31384
1 of 55 assertions failed.
```

GREEN:

```text
$ /bin/bash scripts/test-agent-role.sh
PASS: 55 assertions

$ /bin/bash scripts/agent-role.sh check
16 role(s) checked; 62 routing key(s) validated.
Limits: this checker does not prove semantics, locks, permission enforcement, runtime support, or all project links.
```

The fixture suite copies the real helper into disposable vault trees and checks
observable `list`, `launch`, and `check` results, exit status, and unchanged
fixture snapshots. It covers exact aliases, unknown routes, collisions, missing
and unsafe briefs, malformed/empty registry shapes, empty aliases, required
nonempty sections, the actual legacy PM brief, paths with spaces, arbitrary
working directories, and corrupted unrelated rows blocking launch output.

## Local checks

```text
$ /bin/bash --version
GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)

$ /bin/bash -n scripts/agent-role.sh
$ /bin/bash -n scripts/test-agent-role.sh
$ ./scripts/open-decisions.sh --check
Open-Decisions.md is current.

$ ./scripts/tri-sync-check.sh
Tri-sync invariant holds across all designs.

$ git diff --check
```

Real roster launches succeeded for `Contracts Dev`, `Files PM`, and `PM`.
The generated prompts named the derived planning-checkout location, selected
canonical IDs and actual brief/launch-contract paths, and told another machine
to obtain its branch and commit from the task or handoff.

## Evidence boundary

This is source/helper/consumer validation only. The separate scenario review
records a fresh Codex instruction-interpretation probe; it is not a native
startup-discovery or permission-enforcement test. Claude's restricted probe was
unauthenticated, and Antigravity was not invoked. Neither runtime is claimed as
passed here.

## Task 2 fix round 1

RED, before structural-only section lines were excluded:

```text
$ /bin/bash scripts/test-agent-role.sh
FAIL: expected exit 1, got 0; stderr:
FAIL: stdout unexpectedly contained [Role ID: beta]
FAIL: expected exit 1, got 0; stderr:
3 of 60 assertions failed.
```

The new real-helper fixtures put either `### Placeholder` or
`<!-- intentionally blank -->` in beta's otherwise empty `Owns` section. The
first executes `launch "Exact Alias"` and proves trusted role output is blocked,
not merely that a source token changed.

GREEN after the helper ignored headings and HTML comments as structural lines:

```text
$ /bin/bash scripts/test-agent-role.sh
PASS: 60 assertions

$ /bin/bash scripts/agent-role.sh check
16 role(s) checked; 62 routing key(s) validated.
Limits: this checker does not prove semantics, locks, permission enforcement, runtime support, or all project links.
```
