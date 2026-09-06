# Binding reads: partial implementation and runtime-size constraint

**Status:** incomplete at `ae9367d` — normal runtime limit fails; not a
completed Binding capability, authenticated Core or MVP checkpoint.

The [design](binding-reads-design.md) and [single implementation task](binding-reads-plan.md)
started from `4ece846`. The partial implementation changes only seven named
source/test paths; retained storage and mutation rules are unchanged. The
worker stopped at the required size gate before expanding the full matrix.
No limit was raised, required getter removed or new dependency introduced.

## Evidence actually obtained

Worker behavioral RED compiled and failed `current head identity`; GREEN
passes the one real candidate-group/ObjectGenesis/BindingSet test, checking
the current head and one history entry. Worker ran the full existing regression
set:161/161 Forge;93/94 Node. The sole Node failure is the new normal-host size
gate. These aggregate runs are worker-reported, not an independent root rerun.

Root read the complete report, verified the immutable exact-seven-path commit,
then independently ran from the Core directory:

```sh
node --test test/binding-reads.test.mjs
```

It reproduced the intended failure before deployment: runtime26,736 exceeds
24,576. The output retains all compiler metadata/source pins and exact sizes:

| Combined BindingReadHarness | Bytes | Standing |
|---|---:|---|
| Runtime template | 26,736 | Exceeds24,576 by2,160 |
| Creation bytecode template | 29,064 | Not full transaction initcode |
| Actual fixture constructor arguments | 3,296 | Exact existing Init shape |
| Full transaction initcode | 32,360 | Below49,152 by16,792 |

Solc0.8.30/Cancun/optimizer200/viaIR, Node26, Forge/Anvil1.7.1 and the existing
AdmissionLibrary link are unchanged. No deployment, getter gas, canonical
retained-state comparison or new-host cleanup evidence is claimed. The large
Forge test's aggregate gas is not a normal transaction budget. Build warnings
include pre-existing diagnostics and new checked-narrowing lints; output is
not labeled pristine.

## What this taught us and the next measured step

The18,664-byte predecessor already included raw inventory/inspection ports
and trusted publication. Its remaining headroom was not a final Core budget.
Adding Binding exposed that distinction early. A source module or abstract
base alone is not a bytecode-size boundary.

Next compare three otherwise unchanged compiled surfaces: the full oracle
host, a raw-free trusted host retaining all eleven implemented read forwards,
and a read-only sizing shell. Preserve exact constructor/dependency checks,
ABI outputs and compiler settings; separate creation from constructor bytes.
The latter two are **sizing inputs only**, not permission to remove required
Core reads or replace independent state evidence with submitted intent.

Only after those measurements may a layout refinement be selected. The
existing V2 deployment frame has four fixed components and only AdmissionLibrary
link windows. A new linked read module cannot silently enter that representation.
Its trust, source/runtime pins, deployment codec and static-consumer behavior
would require explicit additional design and evidence. No such choice is
selected by this size failure.

## Remaining task and owner followups

The task is still open. After resolving the measured layout boundary, finish
all transition/H/input/corruption/large-history cases in the plan; deploy under
normal limits; compare every field at pinned source blocks using the independent
reader; measure gas/returndata; rerun regressions; close task and whole-increment
reviews. One passing Binding scenario cannot replace that evidence.

No owner answer is needed for the current reversible diagnosis. No main merge,
public deployment, production repository, durable data or protocol freeze is
authorized or implied. Shared pages/Scope, actual initializer/authority and
Files/SDK/static-SPA integration remain the subsequent joined-MVP work.
