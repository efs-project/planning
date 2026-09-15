# Core audit reproductions — September 15

Inspected implementation: `23a331e468102512d01acbf422dbf8a9349ee7b3`.
Only diagnostic tests and this evidence packet were added. No Core/index/SDK
behavior changed. These are OPEN findings, not fixes or production adoption.

From the lab directory:

```sh
forge test --match-path 'test/Core*Audit.t.sol' --match-test test_audit_ -vv
```

Use run-specific output/cache paths if another worker is building. The recorded
run used Solidity 0.8.30, optimizer200, via-IR, Cancun, with output/cache in
temporary scratch. No Anvil instance was started or owner demo mutated.

`core-audit-results.txt` is complete compiler/test output: five checks reproduced
the described limitations. A passing audit reproduction means the limitation
exists; it must not be interpreted as a met requirement or fixed defect.

- `CoreAcceptanceAudit.t.sol`: a coverage-qualified singleton rule accepts two
  distinct same-Type records in one publication, but rejects the second separate
  publication. Direct reference writes and deferred index state do not expose
  the same ordered prefix.
- `CoreReadCostAudit.t.sol`: unrelated data admission invalidates a folder page
  continuation; a valid255-byte Name can be retained but its standalone binding
  exhausts the350k callback; legitimate two-action Name+binding setup permits
  the filter diagnostic under the unchanged500k callback budget.
- Difficult negative substring over valid255-byte names: one candidate consumes
  5,835,900 warm call-region gas; four/eight/32 exhaust15M. Short-negative controls
  at those budgets consume414,852 /1,400,857 /2,722,688 /10,698,852.

The read measurements are separately gas-fenced contract calls in a Foundry
fixture whose setup has warmed state. NOT cold transaction receipts, network
fees, deployability evidence, or irreducible performance floors. Large test
contract initcode warnings describe the fixture, not a deployed EFS module.

`core-read-audit-trace.txt` is the retained INITIAL failing reproduction before
the setup was split into an explicit failure test and legitimate two-action
setup for the filter test. The trace shows `FilesNameRule` returning true and
the subsequent `FilesCarrierIndex.onAdmission` consuming350,000 gas and failing.
It does not trace the final five-check suite. Names and addresses are disposable
local fixtures; no secrets, signatures or user filesystem data are included.

The complete audit/requirements and finite closeout plan are in canonical
planning `Reviews/2026-09-12-efs-path-decision/core-design-audit-20260915.md`.
