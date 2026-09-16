# Types Task2 — independent interpretation and source-off meaning

September 16, 2026. **Status: implemented and verified; ready for independent
controller review.** Disposable experiment, not a permanent schema, compatibility
policy, production release or source-state proof.

Role contracts-dev; harness codex; model GPT-6 Astra, Extra High;
session described-interpretation-20260916. Assigned BASE
`cb4e8af179d46f1e989de990f27ede21f7f0f1ae`, branch codex/efs-warroom-b-run.
No subagents, source-contract changes, installs, public writes, push, Fable,
owner-demo restart or RPC/UI state mutation. Controller owns main documentation,
independent review and publication.

## Outcome and chronology

1. Read the Task2 brief, global constraints, role/conventions, preflight and
   Task1's complete frozen WIRE/literal vectors. The decoder was written from
   those bytes and unchanged Keys identity derivations. It did not import/read
   the Solidity parser or fixture-encoding producer before freeze.
2. Focused missing-reader RED: 0/4, expected missing API assertions. GREEN: 4/4
   on six descriptors/seven bodies, exact shape/Type/Record/declaration joins,
   signature controls and malformed/unsupported/missing boundaries.
3. Decoder freeze commit `ffa9bbe0ec43e77bc248922ff89c0192e31deca7`; SHA256
   `f592e731cab6e1e0a91b18ce4c89531e7a1f86e5cbb5dd004a3751c3fb02fed9`.
   Sent commit/hash to controller before seeing or creating a new measurement
   fixture. That decoder remains **byte-identical** at handoff.
4. Controller then supplied two literal unfamiliar weather Types. The first
   has seven fields; the second adds a required leading checked reference to
   the first. Both inputs are retained unchanged, including controller
   provenance. No fixture-specific decoder branch or correction was needed.
   Independent tests preserve UINT7 value9007199254741007 exactly as a decimal
   string, false and zero words, absent fields versus present-empty bytes, LF
   text and exact IDs. Four structural negatives refuse; two reference-state
   negatives parse but are refused by the Ledger, not mistaken for parser proof.
5. Successful measured source snapshot is commit
   `a72c272a4f3d1d55aec1a0d77a2ee9cc2a351895`. The paid runner recorded HEAD at
   the earlier freeze because source changes were then uncommitted; its37
   content hashes match this later committed snapshot exactly. The audit
   verifies those hashes via `git show`, not by relabelling the run's HEAD.
6. Final self-review changes are offline archive qualification/projection only,
   plus test dependency-path cleanup. Missing required sidecars now yield
   PARTIAL; unsupported descriptor bytes still must match their shape;
   omitting a present required field needs explicit adapter/loss consent;
   standalone interpretation cannot hide a missing referenced Record. Focused
   RED/GREEN caught each behavior. No decoder, contract, paid runner or receipt
   was changed to accommodate this hardening. The current verifier reproduces
   all eight retained successful offline results exactly. Final evidence/hardening
   commit is the commit containing this report (`git log -1 -- <this file>`).

## Implementation surfaces

- `browser/described-type-reader.mjs` and its tests: finite independent decoder,
  raw portable declaration signature verification, original-byte/field identity
  retention, explicit unsupported/missing outcomes. All eight kinds are generic;
  schema names and fixture Type IDs are absent from production dispatch.
- `browser/described-type-archive.mjs` and tests: injected standalone extension
  for source sidecars and offline identity/auth/CREATE2 joins; exact
  consumer-approved projections and exact writer-Type refusal.
- `browser/described-type.integration.test.mjs`: post-freeze literal fixtures,
  frozen-source assertion, parser-versus-reference-state separation, aggregate
  code/descriptor budget checks.
- `browser/compact-sdk.mjs` and tests: `readTypeDescriptor` uses owned pinned
  context, bounded canonical return bytes and content-derived shape/local Type
  joins. Raw bytes are explicitly NOT_INTERPRETED. Older registry ABIs return
  UNSUPPORTED without probing nonexistent getters; opaque/missing Type and
  unavailable/invalid responses remain distinct. Existing Record reads remain
  unchanged, including valid empty unit bodies.
- `browser/guarded-archive.mjs`: retains injected described sidecars and exposes
  `interpretationCoverage` separately from byte/identity `closureCoverage`.
  Existing served modules gain **no new static import**. Without an interpreter
  or required sidecars, meaning stays PARTIAL; explicit legacy rows are opaque.
- `script/compact-environment.mjs`: additive bounded `blockGasLimit` option.
  Existing default30000000 remains unchanged for prior callers; this campaign
  explicitly selected16777216 on both chains and verified every retained block.
  All80 transactions used gasLimit<=15000000. No owner server was restarted.
- This evidence directory: two controller fixture literals, standalone offline
  child verifier, paid/source-off runner, all-join audit, this report, and
  compressed raw packets plus covering output under `interpretation-run1/`.

## Actual state, source-off recovery, and authority

The source ran on a temporary loopback chain31338, PID93865. All unfamiliar
descriptor/body bytes were fetched from actual registered contract state through
the SDK and retained-state exporter, not substituted from fixtures after a
receipt. The source read returned the exact original portable declarations.
Native and guarded-signed publication/reuse were ordinary real transactions.

After exporting eight signed claims, source RPC was stopped and a fresh process
received **only serialized sidecars**, no source endpoint, manifest, creator key,
publisher decoder or fixture encoder. It recovered all signatures and identities:
seven interpretation-COMPLETE bundles and one OPAQUE_LEGACY aggregate. The latter
contains a fully interpreted described custom Type whose checked target is a
legacy opaque Type; interpreting its parent never proves that target's meaning.
The source was tested unreachable before this child ran. No source chain restart
was needed. The original publisher code/key was not available to that child.

A new chain31337, PID93871, provided an independent destination Realm. Retaining
the old signed claims in SignedClaimArchiveCodeBlob changed no destination relay
Ledger count or original-author nonce. Archive-only export without the Type
sidecars is PARTIAL; supplying the retained closure recovers complete unfamiliar
meaning. The unchanged original custom-free declarations were relayed for both
unfamiliar Types with no new creator signature. Type/Record IDs agree; local
Ledger/admission histories and wrapper addresses differ:

| | Source | Destination relay |
| --- | --- | --- |
| chain |31338|31337|
| Ledger |0xe7f1725e7734ce288f8367e1bb143e90bb3f0512|0x0b306bf915c4d645ff596e518faf3f9669b97016|
| wrapper |0xa16E02E87b7454126E5E10d957A927A7F5B5d2be|0x8e80FFe6Dc044F4A766Afd6e5a8732Fe0977A493|

Destination native publication belongs to Bob, the actual caller, **not** the
original signed-claim author Alice. Copying/retaining/reading bytes is not
reassertion or write authority. Declaration creator is yet another disposable
key; the runner has no private key for the two controller Types.

The custom fixture uses a required checked reference and rejects an otherwise
structurally valid optional title ending `!`. Sidecars retain exact descriptor,
portable signature, wrapper runtime/initcode/address, chain/registry context,
local-binding preimage/signature and custom runtime. Offline verification
recomputes shape, refs, Type, Record, local digest, recovered authority and CREATE2
address. It does **not** execute or prove historical/current custom storage.
Destination retained this declaration without installing it. Its attempted old
custom binding was refused, but that paid control also supplied a wrong-runtime
instance: the source custom address is the destination relayRegistry address.
It is **not an isolated same-runtime authorization replay test**. Task1's reviewed
local-authorization/same-code-different-state controls remain the evidence for
that narrower property. No arbitrary custom-state portability is claimed.

## Evolution and coverage

Actual state-backed signed bundles exercise the exact Task1 text, optional-title,
rich-emphasis and tighter/editLocked descriptors. An explicitly approved exact
source-Type/view/projection mapping lets the unchanged `({text})` display render
the additive body and reports the omitted title while preserving original bytes.
A v1-only allowlist refuses the additive Type. Rich rendering requires an
explicit drop-emphasis adapter, consent and loss disclosure. The adversarial
successor's claim of compatibility is ignored; old writers reject all unknown
exact Types, including a newer body that a read projection can display.

Missing descriptor, wrapper/binding sidecars or referenced Record bytes produce
PARTIAL coverage; unsupported codec is UNSUPPORTED, not valid empty data.
Malformed known bytes fail. A zero-field unit descriptor plus exactly `0x` body
is valid and remains distinct from absent bytes. Human semantic-description
truth is never certified by successful machine decoding.

Bounds:4096 descriptor/body8192 per profile; archive<=4096 Records/512 Types;
record bodies<=16777216 aggregate; descriptors<=2097152, code<=4194304,
signature/binding bytes<=262144 aggregate. Wrapper initcode<=49152,
runtime/custom-code<=24576 each. Aggregate code refusal is tested even when
every individual sidecar fits. No parser limits or shared300k gas allowance
were raised, and no Ledger runtime/storage expansion occurred.

## Verification and exact commands

Run from this lab. Tool paths and flags used:

```sh
export EFS_ETHERS_PATH="$PWD/../../../../planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers"
export FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out
export ANVIL_BIN=/Users/james/.foundry/bin/anvil
```

One paid/source-off campaign, successful first attempt:

```sh
EFS_TYPES_OUTPUT=core-closeout-types-20260915/interpretation-run1 \
 /opt/homebrew/opt/node/bin/node core-closeout-types-20260915/interpretation-paid.mjs
```

The runner requires a **new** output directory and refuses overwrite.49 source
transactions plus31 destination transactions =80;72 successes,8 intended
refusals. All25 ordinary deployments obey runtime/initcode limits. Source and
destination prune-history256, transaction-block-keeper512, run-specific caches,
closed in finally. `ps -p 93865,93871 -o pid=,command=` returned no processes.
Only these bounded temporary chains were used.

Final affected covering commands, each run once (not a whole-suite tournament):

```sh
/opt/homebrew/opt/node/bin/node --test \
 browser/described-type-reader.test.mjs browser/described-type-archive.test.mjs \
 browser/described-type.integration.test.mjs browser/guarded-archive.test.mjs \
 browser/compact-sdk.test.mjs browser/note-reader.test.mjs
/Users/james/.foundry/bin/forge test \
 --match-contract '(GuardedRecovery|GuardedDelegate|GuardedArchive|SignedClaimArchive)Test' \
 --out /tmp/efs-recovery-build-wPDyNv/out --cache-path /tmp/efs-recovery-build-wPDyNv/cache -vv
/opt/homebrew/opt/node/bin/node core-closeout-types-20260915/audit-interpretation.mjs
git diff --check
```

Retained `node-covering.log`:66/66,0 skipped; `forge-covering.log`:36/36,0
skipped. Guarded authority, recovery rollback, archive local-body coverage,
signature/domain and legacy Note projection controls pass. After replacing a
machine-absolute test import with the existing environment-configured ethers
loader, only the four reader tests were rerun (4/4); decoder unchanged.

Initial archive APIs RED0/2 then GREEN2/2. Self-review missing-sidecar/projection
RED1/3 then GREEN3/3; standalone missing-reference RED0/1 then GREEN1/1.
The descriptor accessor was integrated with a focused test and actual live-state
check, not a separately demonstrated RED for every internal helper; this report
does not claim blanket per-function strict TDD. Additional focused pre-covering
Node51/51 included the two unfamiliar fixtures and old deployment behavior.

Targeted artifact build before the run used forge build with TypeRegistry,
Ledger, IndexModule, LensReader, FilesJoinedProfile, FilesNamesProfile,
FilesLiveIndex, FilesJoinedConsumer, FilesApplication, DescribedFixtures and
SignedClaimArchive at the same out/cache paths. No Solidity source changed.
Warnings remain: existing Keys shadowing, packed-width/other build lints and
oversized Forge **test harness** initcode. Logs do not claim pristine compilation;
test harness gas is not normal-venue evidence. Real deployments below are.

The durable audit verifies37 measured source SHA256/Keccak pins,14 complete
artifact files/compiler metadata,193 compiler-source joins,80 raw signed
transaction/hash/sender/input/nonce/chain/receipt/status/block/index/gas joins,
25 creation/actual-constructor/runtime-template joins (immutable offsets masked),
and all eight offline bundles. It checks raw/gzip hashes and distinguishes the
one post-measurement archive-source change. It is stronger than Task1's old
checker but still verifies **retained local RPC evidence, not consensus proof**.

## Paid costs and retained size

| Measured operation | Gas |
| --- | ---: |
| unfamiliar unlinked / linked registration |647380 /737491|
| linked guarded-signed publish / signed reuse |1001100 /694791|
| linked native duplicate / native reuse |637308 /588296|
| source cold paid descriptor+body / separate repeat tx |52914 /52914|
| custom registration incl. local wrapper/binding |2036119|
| custom guarded signed publish |890314|
| valid structure rejected by custom value predicate |475066, refused|
| destination native linked publication |557736|

Linked registration setup alone amortizes to737491/73749/7374/737 gas per
admission at1/10/100/1000 admissions (integer division). These are arithmetic
setup allocations, not another measured throughput run or an equal-workload
cross-Realm efficiency claim. Wrapper fixed runtime4380/initcode4406 are the
reviewed Task1 profile. The existing Ledger stays24247 runtime,36314 creation
+64 actual constructor bytes =36378 initcode. Registry14914 runtime/19512
initcode; custom1043/1253; paid consumer786/812; claim archive10611/11007.
All25 actual constructor lengths and runtime preimages are retained.

The complete eight-claim source-sidecar JSON is255002 bytes; one linked claim
including its recursively retained Type/Record sidecars is49971 bytes. Repeated
claims duplicate code/descriptor sidecars here; this is not optimal deduplicated
archive packaging. The paid consumer prices raw bytes consumed and emits exact
descriptor/body hashes; it does **not** price authenticated semantic inference.

Task1's longest legacy Note1024/title64 controls are retained unchanged in its
report/packet (cold mandatory152372/300000). Its structurally legal8190 text
case still exhausts300000. This campaign neither reran nor shortened that
falsifier. Structural domain and jointly admissible gas domain remain different;
dense/joint Resource2 measurements belong to their assigned task.

## Packaging and pins

After measurement, `gzip -n -9` losslessly compressed paid.json,
source-sidecars.json and source-off-results.json. Only the duplicate plain files
were removed; all exact bytes remain recoverable with `gzip -dc`. The paid
runner is unchanged and still emits raw files. `gzip -t` and the audit verify
the round-trip hashes. No paid or chain rerun was performed for packaging.

| Packet | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| paid.json |3992774|719777|
| source-sidecars.json |255002|18585|
| source-off-results.json |42655|3680|

All raw/gzip SHA256s are in `interpretation-run1/audit.json` and independently
checked by `audit-interpretation.mjs`. Key source SHA256s:

```text
decoder f592e731cab6e1e0a91b18ce4c89531e7a1f86e5cbb5dd004a3751c3fb02fed9
archive a850ad482216364aa4cd473cf9cfa387484a3f3c3995136e563ef7df32010377
SDK 119c82019b9a4b988671200cbfdb2b55f7e13b0e76b1dbef5e30fadca2accbe1
guarded c205ad638a4a1bb09fd363f85a02685ce2bbb1a6f7a441e90701b755df5917d9
runner 46c140e2168c5278f3a334ce61528c4e044688b23824c90665cc74e225212769
weather 554782ec9db0b87343df44ea0e33bfe0197594dcf366b56d679284628116a5b5
linked 76f30dab5bb2329f21216f741506b42fe6be767ee3f9662e2b39c9534605b5c6
```

## Limits and handoff

No universal schema expressiveness, Unicode support, automatic compatibility,
permanent neutral governance, source consensus proof, arbitrary custom-state
equivalence, original-author destination permission or wallet UX is established.
Portable raw ECDSA is a disposable declaration-key profile. Source-off recovery
and custom-free installation differ from creator authorization for a new local
stateful custom binding. If that authority disappears without retained destination
authorization, bytes can still be retained/interpreted but new equivalent-state
admission is not claimed. Human semantic descriptions and transitive custom
dependencies remain outside finite structural truth.

Self-review inspected the complete new decoder/archive/accessor/runner diff and
retained hashes/joins; the listed offline boundary corrections and mixed-reason
custom refusal are disclosed, not silently retrofitted into paid evidence.
Unrelated `.codex-*message` files were preserved. No task-owned chain remains.
**Source/build/bounded-chain ownership released** for controller review and the
next explicitly assigned worker; no further source or chain work is pending here.


## Review fix round1 — absent-Type rule-code bounds

September 16, 2026; same contracts-dev/codex session. Fix BASE
`2488c5bc3980f6f075e73ebcbcf478055bceb6d4`; read the full controller-provided
Task2 review and addressed its sole Important finding. The review's dense-code
and inherited compiler-warning minors remain explicitly deferred.

The root cause was `present:false` skipping `ruleCode` validation/accounting
even when bytes were supplied. The fix validates and counts **every supplied**
rule-code preimage regardless of presence. Present Types still must supply
their preimage; an absent Type without supplied code remains legal PARTIAL
evidence. No descriptor/body meaning, signature, compatibility, static import,
contract, code/gas cap, or frozen decoder changed.

New behavior tests reject the actual4,194,305-byte absent-row reproduction and
171 individually permitted24,576-byte absent-row payloads (4,202,496 aggregate),
both directly and through complete signed partial-claim verification. They
assert rejection, not merely returned counters. Positive missing-preimage
PARTIAL and present-Type mandatory-preimage controls are retained.

Exact scoped commands below ran from this lab with `set -o pipefail`.
The environment variables were:

```sh
EFS_ETHERS_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers
FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out
```

Both variables were supplied to the audit command; only EFS_ETHERS_PATH was
needed for these Node tests.

```sh
/opt/homebrew/opt/node/bin/node --test --test-name-pattern='absent-Type' \
 browser/described-type.integration.test.mjs browser/guarded-archive.test.mjs
/opt/homebrew/opt/node/bin/node --test \
 browser/described-type.integration.test.mjs browser/guarded-archive.test.mjs
/opt/homebrew/opt/node/bin/node core-closeout-types-20260915/audit-interpretation.mjs
git diff --check
```

Output was retained via `2>&1 | tee` for tests and `| tee` for the audit:

- `interpretation-run1/fix1-red.log`:0/3, all three controls report missing
  expected exception/rejection on the original reviewed implementation.
- `fix1-first-fix.log`:1/3. Counting supplied absent-row bytes fixed aggregate
  rejection, but the single huge input exposed the existing hex regex running
  **before** the size bound: `RangeError: Maximum call stack size exceeded`.
  The log was renamed from the initial green-attempt filename; failure retained.
  Stack traces identify the hex predicate called by the sidecar `take` helper.
  Four whitespace-only diagnostic lines were normalized in the readable log;
  exact original bytes remain in `fix1-first-fix.log.raw.gz` (gzip integrity
  checked). Raw/gzip SHA256s are
  `01d3d5a9a8b696742f193ae0b841f096d65f4bfbc452f61107093391c2b6013c` /
  `9496d36d2ad5de747e21c888ddb98e35e30941ec6cdef76d5e498ece7ad46475`.
- `fix1-green.log`:3/3 after moving the finite string/size guard before hex
  validation. This is the same focused negative suite, not a new campaign.
- `fix1-covering.log`:10/10,0 failures/skips, one complete run of the two
  requested files. No all66/36 rerun, Solidity build, chain, or paid execution.
- `fix1-audit.json`:37 measured source pins,14 artifacts,193 dependency joins,
 80 raw transactions,25 deployment joins and all eight offline bundles pass.
  The successful current offline results exactly equal the retained originals.

The audit preserves measured source commit
`a72c272a4f3d1d55aec1a0d77a2ee9cc2a351895`, all raw/gzip packet hashes,
artifact/compiler data and receipt joins. Its explicit post-measurement map
now pins both the earlier described-archive hardening and this **bounds-only**
guarded-archive correction. It rejects other drift or a changed current hash
rather than treating these filenames as an unrestricted exception.
New guarded-archive SHA256:
`eb159b62afe8d0bef7941dab1803a6389792402f841e41b82935de3e58807e76`.
The decoder remains
`f592e731cab6e1e0a91b18ce4c89531e7a1f86e5cbb5dd004a3751c3fb02fed9`.
The earlier `audit.json` and paid packets are historical evidence and were
not overwritten; the fix audit is a separate dated checkpoint.

Scoped changed files: guarded-archive.mjs; described-type.integration.test.mjs;
guarded-archive.test.mjs; audit-interpretation.mjs; the two report copies; and
the five fix1 log/audit outputs and exact raw first-fix log gzip. Runtime diff is two predicate changes plus a
comment. The exact fix commit is the commit containing this appendix; the local
SDD report records its full hash after commit. No push, owner-demo access,
new static import, unrelated cleanup or architecture change.

**Source/build/bounded-chain ownership released again** at this fix handoff.
No task process was started, and the prior stopped chains remain untouched.
Ready for the controller's scoped2488c5b..FIXHEAD review.
