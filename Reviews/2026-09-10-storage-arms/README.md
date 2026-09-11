# State-readable immutable bytes and content-dedup lab

**Status:** bounded local experiment; no Core replacement or protocol choice.
**Date:** 2026-09-10
**Source basis:** `ae9aef48f586da59fcf8b13409773ff889a27257`, branch `codex/mvp-c0-coherence`.
**Compiler:** Solidity 0.8.30, Cancun, via IR, optimizer 200.
**Harness:** Forge 1.7.1 (`4072e48705af9d93e3c0f6e29e93b5e9a40caed8`).

At 4 KiB, **zero-filled state bytes are cheaper to write** (410,611 gas)
than the code arm (954,133), while nonzero state bytes cost 2,957,811.
Dedup reupload costs 18,709, but a new authorized exact-reference write is
another 60,490. These are bounded call-work measurements, not transaction
receipts, all-EFS savings, or forecasts. No single storage winner is selected.

## Surfaces and trust boundary

All three arms implement `put(bytes) -> bytes32` and checked `read(id) -> bytes`.
The state and code controls allocate fresh sequential ids on every upload;
the dedup arm returns the content hash and reuses one immutable payload
across publishers, exact file revisions/trees and positions. Different content
does not alias, assuming Keccak collision resistance. Bodies never depend on a
private offchain store.

- `StateBytes`: independent stored body, exact length, hash, presence flag.
- `CodeBytes`: deployed `STOP || body`, packed address/length, content hash,
  and runtime code hash. This is **code-backed immutable bytes**, not a
  production SSTORE2 integration or dependency evaluation.
- `DedupBytes`: content-only identity, plus separately authorized immutable
  references keyed by `keccak256(abi.encode(publisher, exactRevisionOrTree, position))`.
  Only `msg.sender == publisher` may establish a reference. Uploading bytes
  grants no authority over another publisher's references. Same-reference
  restage is idempotent; changed content at the same exact reference reverts.
  A different revision/tree is a new key. These revision commitments are caller
  inputs: the lab does not validate an EFS revision, implement mutable filenames,
  sign requests, or replace Files authorization.

`descriptor(id)` supplies the retained pointer, length, content hash and code hash.
`readAt(id, candidatePointer)` checks the address against that trusted descriptor,
even if another address has identical code. No descriptor-write API is exposed.

The separately defined `IndependentPinnedReader` in the test file imports only
the descriptor type; it does not call or inherit production verifier helpers.
It is deployed **after** content/reference writes and pins a retained descriptor
and publisher/revision/position tuple. Tests remove the original writer's code,
then recover exact bytes without consulting it. This models an already trusted
retained reference: it does not establish that initial trust or its chain/finality
basis for a real client. Hash integrity is not publisher authority.

Empty content deploys a real one-byte `0x00` STOP runtime. It is never an absent
address. The maximum body is **24,575 bytes**, consuming the EIP-170 runtime
limit of 24,576 with the prefix. The literal 12-byte init program plus runtime
is at most 24,588 bytes, under EIP-3860's 49,152-byte initcode limit. The common
state-control cap makes the comparison bounded and equivalent; it is not an
inherent Solidity storage-bytes limit. No chunking or general huge-body claim.

Every byte-returning arm read checks exact length and content hash. Code reads
also check exact runtime size, code hash and inert prefix before accepting data;
`EXTCODECOPY` zero padding cannot silently repair a truncated zero-filled body.
Missing/altered/truncated code, wrong commitments and reference/address
substitution are tested. `vm.etch`/`vm.store` are test fault injection, not
claimed network attacks or supported mutation APIs. STOP-prefixed payloads
have no execution path to mutate or destroy themselves under this tested EVM;
this does not promise future carrier permanence or state-retention policy.

## Reproduce

From the planning worktree root:

```sh
forge --version
forge test --root Reviews/2026-09-10-storage-arms --force --isolate -vv
forge fmt --root Reviews/2026-09-10-storage-arms --check
forge inspect --root Reviews/2026-09-10-storage-arms LayoutHarness storageLayout --json
```

No dependency installation, Core build/test, public network, or funds are required.
`out/` contains generated compiler artifacts including storage-layout JSON;
`out/` and `cache/` are ignored. No full Core implementation is imported:
the layout harness imports only the real `StateStore` source.

Result: **15/15 tests**, across 4 state-control, 8 code/dedup/adversarial and
3 measurement tests. Round-trip matrix: 0/1/31/32/33/1024/4096 bytes, zeros
and the nonzero pattern `byte[j] = j % 255 + 1`; both code arms also pass
fresh independent readers for this entire matrix. Empty's two pattern cases
are deliberately identical. The 24,575-byte acceptance boundary and 24,576
rejection are additional bounded tests, not a scale sweep.

TDD: storage control first ran 2 runnable `NOT_IMPLEMENTED` failures
(round-trip and matrix), then 3/3 passed. Code/dedup next ran 7 runnable
`NOT_IMPLEMENTED` failures with the 3 controls passing, then 10/10 passed.
Later measurement and validation-gate qualification bring the final count to 15.
Literal Keccak vectors for empty and `abc` anchor commitments independently of
the writer's encoding. No production helper supplies independent-reader
expected output.

## Measurement method and limits

Each measured read/write runs inside a separately called `GasProbe`.
`--isolate` makes each top-level probe call a separate EVM context. Payload and
reference setup occurs before the measured transaction; the first and second
nested reads happen in **one probe call**, with no intervening cooling or writes.
The first read includes cold target-account/storage/payload access, and the
second reuses those warm accesses. Return copying, ABI work and caller memory
expansion remain in the `gasleft()` spans, so their difference is not solely an
EIP-2929 constant. Gas spent before entering the span and its post-read assertion
is excluded.

The coldness guards require more than 10,000 gas separation. As a negative
control, running `testMeasureColdAndWarmReads` **without** `--isolate` fails
`reference must actually be cold then warm`: the preceding content read warmed
the dedup/payload for that reference read. Do not remove isolation and still
label these numbers cold. The negative control is intentionally not a green
suite invocation.

Writes are separately cold probe calls, including repeat uploads: “repeat”
means persisted content already exists, **not** that it shares a warm transaction.
First writes use empty arm instances; repeat and changed-body writes use
prepopulated instances. Changed fixtures XOR the first byte with `0xff`; an
empty body changes to the one-byte `ff` because equal-length changed empty
content cannot exist. Control arms always allocate new entries; dedup checks
the existing code on reupload. Reference writes recheck the payload.

Deployment costs below are nested CREATE spans inside one probe call, including
caller code construction, CREATE, initcode work and code deposit. A trace
confirms they are nested, not top-level synthetic deployment transactions.
Payload CREATE and descriptor initialization are included in each code first/
changed upload cost, not separately attributed. These results do **not** include
full external transaction intrinsic calldata gas, fees, receipts, deployment
amortization, wallet paths, EFS authorization/indexing or a rollup cost model.

### Arm deployment

| Arm | CREATE span gas | Runtime bytes | Initcode bytes |
|---|---:|---:|---:|
| StateBytes | 263486 | 1154 | 1180 |
| CodeBytes | 320697 | 1440 | 1466 |
| DedupBytes | 441742 | 2044 | 2070 |

### Body write calls

| Bytes | Pattern | State first / repeat / changed | Code first / repeat / changed | Dedup first / repeat / changed |
|---:|---|---:|---:|---:|
| 0 | zero | 75251 / 58151 / 98000 | 126759 / 109659 / 109893 | 105488 / 14308 / 105733 |
| 0 | nonzero | 75251 / 58151 / 98000 | 126759 / 109659 / 109893 | 105488 / 14308 / 105733 |
| 1 | zero | 115100 / 98000 / 98000 | 126993 / 109893 / 109893 | 105733 / 14338 / 105733 |
| 1 | nonzero | 115100 / 98000 / 98000 | 126993 / 109893 / 109893 | 105733 / 14338 / 105733 |
| 31 | zero | 115103 / 98003 / 98003 | 133001 / 115901 / 115901 | 111741 / 14341 / 111741 |
| 31 | nonzero | 115103 / 98003 / 98003 | 133001 / 115901 / 115901 | 111741 / 14341 / 111741 |
| 32 | zero | 117447 / 100347 / 120247 | 133219 / 116119 / 116119 | 111959 / 14341 / 111959 |
| 32 | nonzero | 137347 / 120247 / 120247 | 133219 / 116119 / 116119 | 111959 / 14341 / 111959 |
| 33 | zero | 119726 / 102626 / 122526 | 133452 / 116352 / 116352 | 112205 / 14371 / 112205 |
| 33 | nonzero | 159526 / 142426 / 142426 | 133452 / 116352 / 116352 | 112205 / 14371 / 112205 |
| 1024 | zero | 188977 / 171877 / 191777 | 333495 / 316395 / 316395 | 312631 / 15378 / 312631 |
| 1024 | nonzero | 825777 / 808677 / 808677 | 333495 / 316395 / 316395 | 312631 / 15378 / 312631 |
| 4096 | zero | 410611 / 393511 / 413411 | 954133 / 937033 / 937033 | 934709 / 18709 / 934709 |
| 4096 | nonzero | 2957811 / 2940711 / 2940711 | 954133 / 937033 / 937033 | 934709 / 18709 / 934709 |

### Separate authorized reference write calls

Same values for zero and nonzero patterns. “Different file” is represented by
a different exact revision/tree commitment; neither file is a mutable name.

| Bytes | Exact-reference restage | Different file/revision | Different position |
|---:|---:|---:|---:|
| 0 | 18508 | 58528 | 58528 |
| 1 | 18523 | 58543 | 58543 |
| 31 | 18523 | 58543 | 58543 |
| 32 | 18523 | 58543 | 58543 |
| 33 | 18538 | 58558 | 58558 |
| 1024 | 18993 | 59013 | 59013 |
| 4096 | 20470 | 60490 | 60490 |

These reference costs are **additional** to body upload. Already uploaded
content can be referenced without another upload. Body-plus-reference in a
single atomic transaction is not measured; adding these separate-cold spans
would not reproduce that transaction's shared warmth.

### Checked read calls

Both payload patterns produced the same values at each length.

| Bytes | State cold / warm | Code cold / warm | Dedup cold / warm | Dedup reference cold / warm |
|---:|---:|---:|---:|---:|
| 0 | 12547 / 2015 | 14232 / 3200 | 14254 / 3222 | 19072 / 4036 |
| 1 | 12574 / 2042 | 14265 / 3233 | 14287 / 3255 | 19106 / 4070 |
| 31 | 12574 / 2042 | 14265 / 3233 | 14287 / 3255 | 19106 / 4070 |
| 32 | 14823 / 2291 | 14265 / 3233 | 14287 / 3255 | 19106 / 4070 |
| 33 | 17044 / 2512 | 14298 / 3266 | 14320 / 3288 | 19139 / 4103 |
| 1024 | 83694 / 9179 | 15311 / 4296 | 15333 / 4318 | 20152 / 5133 |
| 4096 | 297162 / 30892 | 18738 / 7968 | 18760 / 7990 | 23582 / 8808 |

## Actual C0 compiler storage layout

`test/LayoutHarness.sol` imports `StateStore.Store` from
`../2026-09-05-c0-core/src/StateStore.sol`, whose Git blob at the source basis is
`643bcbb7fe0da736227bce265f67421019dda39f`. The compiler JSON, not field names,
produced the following slots and **byte offsets**. Each row's slots are relative
to its own struct base. Dynamic `bytes` entries below are head slots, not the
total out-of-line body footprint.

| Actual struct | Head slots / bytes | Compiler members at slot:offset |
|---|---:|---|
| Counts | 2 / 64 | records 0:0; envelopes 0:8; types 0:16; principals 0:24; admissions 1:0; batches 1:8; postingKeys 1:16; bindingKeys 1:24 |
| RecordRow | 3 / 96 | typeId 0:0; body 1:0; recordOrdinal 2:0; firstAdmissionOrdinal 2:8 |
| EnvelopeRow | 2 / 64 | canonicalUnsignedEnvelope 0:0; envelopeOrdinal 1:0 |
| TypeRow | 3 / 96 | groupRecordId 0:0; memberIndex 1:0; typeOrdinal 1:2; admittedAtOrdinal 1:10; cacheBytes 2:0 |
| PrincipalRow | 1 / 32 | principalOrdinal 0:0; firstAdmissionOrdinal 0:8 |
| AdmissionRow | 2 / 64 | envelopeId 0:0; packed 1:0 |
| LifecycleRow | 1 / 32 | packed 0:0 |
| BindingRow | 2 / 64 | meta 0:0; target 1:0 |
| PostingRow | 1 / 32 | head 0:0 |
| BatchRow | 3 / 96 | meta 0:0; authorityBasis 1:0; authorityCodehash 2:0 |
| Bootstrap | 10 / 320 | realmId 0:0; initialRevisionId 1:0; intrinsicGroupBytes 2:0; objectGroup1Hash 3:0; kernelGroup2Hash 4:0; metaTypeId 5:0; objectGenesisType 6:0; bindingSetType 7:0; bindingTombstoneType 8:0; withdrawalType 9:0 |

The `Store` head is 29 slots / 928 bytes: Counts at0, Bootstrap at2, mapping
heads records12/envelopes13/types14/principals15/admissions16/occurrences17/
bindings18/postings19/postingWords20/batches21/recordIds22/envelopeIds23/typeIds24/
principalIds25/postingKeys26/bindingKeys27; standalone scopeLayout28. These are
head positions, not all populated mapping storage.

**Already packed:** RecordRow and PrincipalRow's two uint64 ordinals share a
slot; TypeRow's uint16 and two uint64s share a slot; Counts packs four uint64s
per slot. Remaining byte capacity is 16 in RecordRow's ordinal slot, 24 in
EnvelopeRow's ordinal slot, 14 in TypeRow's packed slot, 16 in PrincipalRow.
That is capacity within existing slots, not measured slots saved. Whole-word
`packed`, `meta`, `head` and `authorityBasis` fields may have application-level
bit structure not described by storageLayout; no headroom is inferred from
their names. Reordering the already-packed narrow fields alone does not remove
another current slot.

For transparency, the lab control is not a maximally packed storage competitor:
its Entry uses 4 head slots (bytes/uint256 length/hash/bool); code Descriptor uses
3 (address+uint32 length at offsets0/20, body hash, code hash). Dedup inherits an
unused sequence slot and references occupy 2 slots (id/presence). Metadata and
identifier policies therefore contribute to the comparison. Do not attribute
the whole gas difference solely to bytes-vs-code or extrapolate it onto current
C0 rows. An optimized state control is a possible later experiment, not silently
delivered or claimed here.

## Deliberately open

No Core source/storage replacement, row-reencoding/shared-context patch,
populated-layout migration, reverse locator comparison, joined 10k index run,
production SSTORE2 integration, acceptance/evolution/continuity completion,
carrier-permanence guarantee, canonical protocol selection, main merge or public
deployment. Independent review of this bounded lab is controller-owned.
