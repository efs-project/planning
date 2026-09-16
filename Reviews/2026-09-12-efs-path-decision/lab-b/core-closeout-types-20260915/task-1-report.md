# Types Task1 — finite described registration and mandatory validation

Status: DONE, candidate ready for independent controller review. September16,
2026; contracts-dev / codex / Astra Extra High; session described-types-20260916.
Exact reviewed BASE: `f7ce1875044e9c63f762cc57bde3b9dba523f86a`.
The source/evidence commit is the commit containing this report; the controller
handoff at `.superpowers/sdd/core-closeout-types-plan-20260915/task-1-report.md`
records its exact SHA after commit. No push by this worker.

## Outcome and scope

Implemented Task1 only. No independent Task2 decoder, third-party unfamiliar
Type demonstration, SDK/browser import, owner demo, protocol adoption, production
deployment, dependency installation, additional agent or external publication.
Parent owns canonical planning/main documentation and publication; parent added
the session status entry. The existing shared-clone commit hook was verified.

- `src/DescribedTypeProfile.sol`: finite canonical parser, STOP-prefixed immutable
  descriptor carrier, stateless mandatory wrapper, explicit-context custom ABI.
- `src/TypeRegistry.sol`: portable EOA-signed declaration relay/retention, fixed
  shared custom-free wrapper, creator-authorized immutable local custom binding
  with CREATE2 identical-runtime per-Type wrapper, bounded interpretation getter,
  retained signatures/preimages, independent described catalog revision.
- `src/PublicationSupport.sol`: refuse unregistered PUBLISH/REUSE Types during
  initial profile computation, before any callbacks. No Ledger source/layout or
  raw getter ABI changed; existing fixed support seam owns the narrow check.
- New `test/DescribedTypeProfile.t.sol`, `test/DescribedTypeParticipation.t.sol`,
  `test/DescribedFixtures.sol`; one obsolete unknown-zero-profile assertion in
  `test/CoreOrderedAcceptance.t.sol` updated without weakening known-Type hashes
  or ordered-prefix controls. Legacy opaque `register`, policy/role authority,
  Note fixtures, checked refs, and whole-operation rollback remain.
- This directory retains WIRE, literal vectors, producer-only fixture emitter,
  finite paid runner, audit, raw receipts/transactions, build/source metadata,
  and all meaningful RED/intermediate/final logs.

`WIRE.md` and literal `vectors.json` are Task2's frozen interpretation handoff.
Six descriptors/seven positive bodies include unit, Note v1/v1.1/rich/restricted,
and all finite kinds; two invalid descriptors and six invalid bodies are literal.
They include exact Type/Record IDs, shape/ref joins and declaration signatures.
Task2 must independently implement from the spec/vectors, not import the Solidity
parser or `fixture-encoding.mjs`, and must freeze before its unfamiliar fixture.

## Semantics and authority boundaries

Codec/profile1 supports0..16 fields,8 required leading REF32 words,4096 descriptor
bytes and8192 body bytes. The controller clarified unit Types (zero fields) and
required-only references. Optional presence applies only to non-reference fields.
Fixed bytes32, width/range-bounded unsigned integers, canonical bool/enum,
length-prefixed bytes, ASCII/LF text and printable-only text are finite kinds.
The existing Note text1..1024/LF and title1..64/no-LF domains were not shortened.
Unknown versions, invalid flags/fields, duplicate IDs, nonleading/optional refs,
noncanonical bool/enum/presence, bad lengths/trailing bytes fail closed.

The declaration binds the exact portable Type and its declaration-key namespace,
not chain/registry/payer/local instance. All described Types mandate structure
AND any declared custom predicate. Realm policy only adds constraints. Custom
runtime is committed inside descriptor; wrapper runtime remains ruleId. Local
binding signs twelve canonical ABI words including chain, registry, Type,
wrapper profile/runtime/initcode, exact custom instance, allowed Ledger and
authority. Its hash is the CREATE2 salt and existing mandatory-instance address
therefore commits local binding without adding a Ledger profile field.

The wrapper has no storage, immutables, delegatecall or arbitrary forwarding.
It derives Ledger only from msg.sender; bounds registry getters, blob code and
custom returndata before copying, checks descriptor/Type/ref projection and
body shape, then invokes the exact custom instance using STATICCALL. Nested
evaluation receives only remaining gas less12k reserve and EIP150 reduction,
inside the existing300k outer allowance. Exactly32 bytes equal1 is success.
The custom fixture authenticates wrapper runtime before trusting forwarded
Ledger and enforces its creator-selected allowed Ledger. Tests cover direct
forgery, fake caller, and a forged registry response without genuine-context
impersonation. The latter deliberately uses a mocked hostile getter while the
real wrapper and real state-sensitive predicate execute.

New described registration initializes policy row1 at current epoch and advances
only catalogRevision. An actual serialized pending old-Type signature and an
actual consumer-owned Files query prefix survive unrelated registration. A real
policy activation invalidates both. Legacy registration still bumps epoch.
The installed marker is separate from declaration retention: raw legacy rows
remain opaque whether a matching sidecar is offered before or after registration.

Anyone may retain custom meaning without installing it. Copying a declaration
does NOT install arbitrary stateful custom Types into another Realm. Destination
custom installation needs its exact local authorization; if the authority is
gone without retained destination authorization, interpretation remains possible
but new local admission is not claimed. Same runtime is not same state. Raw ECDSA
digests are this disposable signature profile, not ordinary-wallet-UI support.

## TDD, failures and tests

Commands ran from `Reviews/2026-09-12-efs-path-decision/lab-b`. Shared flags for
each Forge invocation below:

```sh
F=/Users/james/.foundry/bin/forge
OUT=/tmp/efs-recovery-build-wPDyNv/out
CACHE=/tmp/efs-recovery-build-wPDyNv/cache
# Every recorded test command included: --out "$OUT" --cache-path "$CACHE" -vv
```

The variable shorthand above describes the exact binary/flags used, not an
installation or a required environment mutation. Logs retain actual output.

| Command after `forge test` | Evidence | Observed result |
| --- | --- | --- |
| `--match-contract DescribedTypeProfileTest` before source | red-initial.log |0/2; public API missing; `unknown publish profile was signable` |
| same, first implementation | green-initial.log |2/2 |
| same, custom controls | red-custom.log |9/11; valid custom paths rejected |
| custom positive test with `-vvvv` | custom-route-trace.log | finite call trace identified nested call going to Ledger rather than custom instance |
| same custom suite after named-address fix | green-custom.log |11/11 |
| described profile/participation boundary run | green-boundaries.log |39/40; retry test expected success but existing behavior is `AlreadyAdmitted(1)` |
| `--match-test test_retained_declaration_before_opaque_registration_does_not_install_interpretation` | red-opaque-order.log | offered-before-legacy sidecar incorrectly accepted body |
| described profile after installed marker/test retry correction | green-opaque-order.log |16/16 |
| `--match-test test_zero_field_unit_type_requires_exact_empty_body` | red-unit.log / green-unit.log | `E_DESCRIPTOR()` before controller clarification;1/1 after allowing zero fields |
| `--match-test 'test_custom_another\|test_wrong_local\|test_descriptor_code'` | green-context-tamper.log |3/3 |
| CoreOrderedAcceptance old unknown-profile test only | prior-unknown-expectation.log | planned `E_UNKNOWN_TYPE(0x7b)` superseded old zero-row expectation |

Final **single scoped covering run**, not a whole-suite tournament:

```sh
/Users/james/.foundry/bin/forge test \
  --match-contract '(DescribedType(Profile|Participation)|LedgerMatrix|LedgerEvidence|LedgerImport|Falsify|CoreOrderedAcceptance|PublicationPreparation|LabelType|ReadSetCarrier)Test' \
  --out /tmp/efs-recovery-build-wPDyNv/out \
  --cache-path /tmp/efs-recovery-build-wPDyNv/cache -vv
```

`covering-final.log`: **112 passed,0 failed,0 skipped,10 suites**. Described
profile20/20; participation25/25 includes24 inherited Files regression cases plus
the new actual pending-signature/owned-prefix test. Legacy Ledger/import/evidence,
mandatory-rule/policy, ordered-prefix/final rollback, fixed preparation, Label and
read-set-carrier tests pass. Test-contract deployment gas is not a paid-venue
claim. The logs were retained through `2>&1 | tee`; assertions/counts, not tee's
pipeline exit alone, establish test results.

Warnings are **not pristine**: existing Keys shadowing, unused LedgerImport
local, view/pure suggestions and oversized Forge test contracts; explicit build
also reports unsafe-typecast lints, including the existing packed epoch/block
width convention in new row1 initialization. Ordinary deployable contracts were
separately priced and cap-checked below; no cap override was used.
Staged whitespace checking found tool-generated trailing spaces/extra EOF lines
in build-paid/audit/paid-run2 logs. Exact raw bytes are retained as sibling
`.log.raw.gz`; readable logs only had trailing whitespace/EOF normalized. No
warning, failure, result or receipt content was removed.

## Paid resources and bounded reproducibility

The first paid attempt stopped at preflight on a stale legacy Note artifact's
Ledger source hash **before starting a chain** (`paid-run1.log`). Targeted build:

```sh
/Users/james/.foundry/bin/forge build src/TypeRegistry.sol src/Ledger.sol \
  src/IndexModule.sol test/DescribedFixtures.sol test/NoteProfile.sol \
  --out /tmp/efs-recovery-build-wPDyNv/out \
  --cache-path /tmp/efs-recovery-build-wPDyNv/cache
```

`build-paid.log` retains output/warnings. Then:

```sh
EFS_ETHERS_PATH="$PWD/../../../../planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers" \
FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out \
ANVIL_BIN=/Users/james/.foundry/bin/anvil \
EFS_TYPES_OUTPUT=core-closeout-types-20260915/paid-run2 \
/opt/homebrew/opt/node/bin/node core-closeout-types-20260915/paid.mjs
```

Output directory must be new; existing-output overwrite refuses.55 transactions,
47 successes and8 intended refusals; all raw signed transactions, receipts,
chain-transaction/block joins and source/compiler/deployment metadata retained
in `paid-run2/paid.json`. Local Node26.0.0, solc0.8.30+73712a01, optimizer200,
viaIR/Cancun. Every tx gasLimit15,000,000; chain block cap16,777,216. Anvil
PID88291, loopback62899, prune-history256, transaction-block-keeper512, fresh
run-specific cache; closed in finally, exit0, `ps -p 88291` verified absent.
No owner RPC60599/UI60608 use or server restart.

Four explicit `debug_traceTransaction` **callTracer** requests, not opcode traces;
runner refuses traversal beyond512 calls. Actual call counts34/33/42/19. Only
bounded target-call gas fields are retained. No trace tournament or cap inflation.

| Ordinary deployment | Runtime | Creation + actual args = initcode | Paid gas |
| --- | ---: | ---: | ---: |
| TypeRegistry incl. shared wrapper |14,914|19,512+0=19,512|4,257,218|
| Ledger incl. fixed support |24,247|36,314+64=36,378|7,803,668|
| IndexModule |12,897|21,674+32=21,706|4,381,278|
| standalone fixed wrapper |4,380|4,406+0=4,406|1,000,317|
| standalone Note descriptor blob |323|244+416=660|125,782|
| custom fixture |1,043|1,189+64=1,253|325,886|
| paid descriptor/body consumer |786|812+0=812|223,344|

All runtime<=24,576, initcode<=49,152, empty linkReferences, ordinary Node
ContractFactory deployment. The descriptor compiler's57-byte template is NOT
its actual runtime: constructor returns STOP plus322 descriptor bytes here.
Maximum retained blob is4097 bytes. Ledger runtime count remains24,247 (329 spare),
but fixed-helper change makes creation36,314 versus baseline36,348 (-34); actual
initcode with64 argument bytes is36,378. Runtime count equality is not a claim
that deployment/execution code commitments stayed byte-identical.

| Setup or recurring operation | Paid gas |
| --- | ---: |
| First described unit / next Note registration |332,181 /358,437|
| Identical custom-free relay |49,669|
| Custom registration incl. new CREATE2 wrapper/local binding/blob |1,729,348|
| Identical custom relay |64,249|
|4096-byte joint descriptor registration |1,396,036|
| Native first short Note / duplicate / REUSE |671,924 /578,473 /526,067|
| Signed Note |736,834|
| Native custom short Note |665,734|
| Paid descriptor+body read, first / separate repeat tx |46,654 /46,654|
| Retain custom declaration without destination installation |249,318|

Registration-only custom setup amortizes to1,729,348/172,934/17,293/1,729 gas per
admission at1/10/100/1000 admissions (integer divisions). Against measured665,734
recurring custom admission, that setup is below10% at26 admissions and below1%
at260. These are arithmetic amortization thresholds, not a measured crossover
against an unimplemented shared-custom-wrapper alternative. Per-Type duplicated
runtime is not free: runtime-code deposit alone is876,000 gas. Setup fits the
bounded normal venue; no alternative binding-commitment route was implemented.

| Cold transaction case | Body density | Whole tx gas | Mandatory call /300k |
| --- | --- | ---: | ---: |
| Custom short Note |3/4 bytes nonzero;1/1 words nonzero|665,734|40,473|
| Note1024 + title64 |1091/1093 bytes;35/35 words nonzero|1,574,386|152,372|
|4096 descriptor /16 fields /8 refs /8192 bytes body |265/8192 bytes;9/256 words nonzero|1,770,302|93,973|
|8190 text bytes +2-byte length |8192/8192 bytes;256/256 words nonzero|826,782, REFUSED|300,000, out of gas|
| Legacy hand-coded Note1024 control |1029/1030 bytes;33/33 words nonzero|1,579,300|not traced|

The joint case contains7927 zero payload bytes and **eight copies of ONE retained
target**. It proves maximal dimension/shape feasibility for this exact body,
not worst-case nonzero write cost or eight cold distinct target reads. Final
resource work owns those workloads. “Cold” means a separate real transaction;
Core profile preparation and earlier reads naturally warm slots inside it.
Different legacy/new Note bodies/index histories prevent an equal-workload gas
optimization claim.8190 text is structurally legal but this profile cannot admit
it within300k; structural validity and callback-budget feasibility differ. No
universal maxima claim or silent text-limit reduction is made.

## Pins, audit and self-review

```text
DescribedTypeProfile.sol SHA256 db8ffaba9db5b7b72507f456ad0476b35e74485334722be941a202422dfcf3d8
TypeRegistry.sol SHA256          4dd993a191cb60a262a0bb8cbfb0e81fbed26639e846294b97323b095d62b276
PublicationSupport.sol SHA256    55def6e05e636a56ba8cbf926c42e880802108ecbf1b30c0adce87e660ee03cc
vectors.json SHA256              a9040812a00a55e08614f1fdd1c3a96de7f8f186df18b4fc9536a84452051014
wrapper source keccak 0x9571406c5007d3924a0efdaba2af415f26507aa1eb97a0be9187c4e66cfef2a0
wrapper runtime hash  0x685da87926b52f471eca3b7994db46cccf1f3e8166c2af378fb45d7768806ec8
wrapper initcode hash 0xe9eef707a978ff6519b427f0ffb6de5a01a73b076b3aa1591b18c3879991e725
```

`audit.mjs` independently checks21 current source hashes against paid pins,
literal vector/compiler/deployed-wrapper joins, signed tx hashes/senders,
receipts/status/gas, actual constructor/runtime limits and byte/word density.
It is an evidence checker, NOT Task2's descriptor decoder.

```sh
EFS_ETHERS_PATH="$PWD/../../../../planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers" \
FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out \
/opt/homebrew/opt/node/bin/node core-closeout-types-20260915/audit.mjs
git diff --check
```

`audit.json`/`audit.log`:21 pinned files,55 verified receipts,8 intended refusals,
all joins/caps satisfied. Self-review read the complete production diff/new
source and tests. Corrected nested target by named variable instead of a brittle
memory-struct offset; corrected retention-before-legacy interpretation with an
explicit installed marker and both-order controls. Retry fixture was corrected
to existing AlreadyAdmitted semantics, not production behavior. Known-Type hash
expectations remain exact. New source is163 lines; registry318 lines; no unplanned
split/architecture, arbitrary delegate module or silent custom-state equivalence.

Remaining evidence limits: finite local EVM experiment, no consensus state proof,
production audit, general Unicode, recursive schemas, universal schema/account
support, automatic compatibility or wallet UX. Mutable custom dependencies are
re-evaluated, not made portable or historically reproducible by runtime hash.
Semantic-description bytes are retained, not machine-certified truth. The paid
consumer prices raw descriptor/body retrieval, not independent authenticated
semantic interpretation. Source-off independent decoding and unfamiliar Types
belong to Task2. No owner-demo changes or browser static imports were made.

Source/build/bounded-chain ownership is released with the committed handoff.
No task-owned chain remains; retained small run cache is not deleted. Unrelated
pre-existing `.codex-*message` files were preserved. Parent owns independent
review, canonical documents and publication.
