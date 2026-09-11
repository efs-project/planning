# Index-layer lab — one declared `FIELD_EQ` family, hook + backfill + probe + page, measured

**Status:** lab on `fable/2026-09-09-files-browser`, written 2026-09-10 (Task A of the
prototype round in [reconciliation-with-codex-2026-09-10.md §3](../2026-09-09-files-browser-mvp/reconciliation-with-codex-2026-09-10.md)).
Implements the smallest honest version of the L1 declared family of
[index-layer-2026-09-10.md](../2026-09-09-files-browser-mvp/index-layer-2026-09-10.md)
on the populated files-browser world and measures it with retained receipts and
traces. Not a design, not a ruling, no K10 (Codex owns it). Every number is
**MEASURED** (a retained artifact under `evidence/`), **QUOTED** (a spec) or
**ESTIMATED** (arithmetic on measured counts).

## 0. In one paragraph

A `FIELD_EQ` family over `DirectoryEntry/1.child` was declared *after* a
directory scope of 1,000 placements existed, attached at declaration, maintained
by a write hook inside the real admission path from the declaration ordinal `d`,
and backfilled by strangers in chunks that derive every bit from on-chain source
records (kind-10 word → admission → envelope bytes → binding record → binding →
target record → field; nothing from calldata). `probe` is the only
bool-returning read and reverts `Uncovered` / `Frozen` / `Unsupported` /
`NotAPosition`; `probeTolerated` returns a five-state enum with no bool;
`page` commits the admission high-water and the coverage revision in its cursor
and refuses a cursor across any admission. All matrix cases pass
(`tests 1 / pass 1 / fail 0`, 80/80 differential oracle checks in the suite,
§6). The per-entry backfill walk under today's layout is in §5, decomposed by
`StateStore` kind so the K10 saving can be estimated rather than claimed.

## 1. The field, and why

The task asked for the media/content type on the file record if a placement
carries it, else another scalar field the placement carries. In the Files
fixture `mediaType` lives on `FileRevision/1` (field 2, STRING). No N-position
scope binds a `FileRevision`: the revision-head scope `(A, headPurpose, file)`
has exactly one position (`HEAD_ROLE`), and a *directory* placement binds a
`DirectoryEntry/1`, from which `mediaType` is two more binding hops away
(child → head binding → FileRevision) that the design's `FIELD_EQ` walk does not
include. So the family indexes the field the bound record itself carries.

`DirectoryEntry/1` = `parent REF(32) | name STRING(2+n) | child REF(32) |
mountOverride OPTION(REF)`. The lab's primary family is **field 2, `child`**:

- it has a real reader — "which positions in D hold object X" is the reverse
  locator the browser needs and the positive accelerator the tag document
  demotes position bits to (tag-system §5b);
- its cardinality can be driven **hot** (one object under many names via
  `placement`) and **sparse** (distinct objects via `createDir`), which is what
  the PM asked to benchmark instead of assuming 512;
- it changes under real router rebinds: `remove` (whiteout; the Type changes and
  the bit clears), `restore` (entry again; set), and a direct one-step
  `entry(A) → entry(B)` rebind (bucket moves).

`child` is a REF-kinded field; as bytes it is a fixed 32-byte value and the bit
machinery is identical to `BYTES_FIXED(32)`. The closed menu would spell this
`REF_TARGET`; the lab's walker is generic over `(typeId, fieldIndex)` and the
suite also declares families over `DirectoryEntry/1.name` (STRING, length
prefix included, so the bucket equals the kind-7 scalar key) and over
`FileRevision/1.mediaType` on the revision-head scope, to prove the walker is not
special-cased. `name` alone would have been maximal-sparse only and would
duplicate the Lens.

## 2. What was built

```
Reviews/2026-09-10-index-layer-lab/
  PINNED-SOURCES.md       source commit + sha256 of every copied file
  src/                    byte-identical copy of Reviews/2026-09-05-c0-core/src (23 files)
  foundation/             copy of 5 foundation files; ONE edit (executeFixture `virtual`)
  lab/IndexLayerStorage.sol   ERC-7201 namespace efs.lab.index-layer.v1: families, attach, coverage, bit words
  lab/FieldWalk.sol           schema-cache → one-word field program at declaration; extract() at run time
  lab/IndexedAdmission.sol    THE WRITE HOOK: pre-read heads → pinned kernel admit → derive bits from storage
  lab/IndexLayerModule.sol    declare / backfill / probe / probeTolerated / page / coverageOf / announceDetach / detach
  lab/LabCoreU4.sol           U3 core + hooked executeAuthorized + retired operator path + fallback → module
  scripts/lab-fixture.mjs     deploy + upgrade the populated pair; direct author-signed admits; off-chain oracle
  scripts/measure.mjs         retained receipts/traces; scripts/lab-slots.mjs lean slot attribution
  test/index-layer.test.mjs   the matrix (node --test)
  evidence/                   functional-run.json, n1000/ (index.json with sha256 of every file)
```

### 2.1 Why the hook is a wrapper around the pinned kernel, not a kernel edit

The foundation controller (`FixtureDeployment.upgradePair` → `activate`) copies
`admissionLibrary` / `admissionCodehash` from the previous execution set into
the next one and requires `FixtureEndpoint(core).configuration()` — which hashes
the implementation's `admissionLibrary` immutables — to equal it. **A populated
pair therefore cannot be upgraded onto a different (hooked) kernel library.**
"Implement in the copied kernel" would have meant a fresh, unpopulated
deployment, which defeats "declare after data exists". The lab keeps the
populated world: `IndexedAdmission.admit` (an external library, delegatecalled
by the U4 core) reads the heads of every binding-typed leaf *before* calling the
pinned `UpgradeAdmissionLibrary.admit` (a nested delegatecall in the proxy's
storage — the kernel then reads those slots warm, so the pre-read is net-free),
lets the kernel admit, and afterwards derives every bit from storage: the
post-admission head, the target record's type and body, and the position. The
U4 core retires `executeFixture` (`ErrOperatorPathRetired`), so the hooked
`executeAuthorized` is the only admission path of that revision; the suite
proves it. The pinned kernel `src/` is byte-identical to the source (verified
with `cmp`; hashes in `PINNED-SOURCES.md`).

What the wrapper costs relative to an in-kernel hook (ESTIMATED from the
measured decomposition, §5.3): one extra delegatecall and one extra ABI encoding
of the publication, the `typeFamilies[targetType]` read the kernel would have
had for free from `TypeRow.cacheBytes` (2,100 per binding leaf whose target Type
has no family), and warm re-reads (100 each) of rows the kernel just wrote.

### 2.2 Attach, coverage, position, bucket

- **Declare = attach.** `declare(typeId, fieldIndex)` (lab authority: anyone;
  Type-level, cap 8 per Type as one word of `u32` family ordinals) decodes the
  Type's admitted `cacheBytes` (`TypeGroupParser.SchemaCache`), compiles the
  field program (fixed-width prefixes summed, BYTES/STRING prefixes walked by
  their 2-byte length; containers/OPTION/DIGEST before the field → `UnsupportedField`
  at declaration, never at read time) and records `d = count.admissions`.
- **Three ordinal domains kept apart** (§11a): scope *position* (kind-10 index),
  the first-binding *admission ordinal* the kind-10 word carries, and the
  admission high-water `H`. "Born after `d`" is `ordinalAt(position) > d`, one
  word read, so a scope born after `d` needs no slot and the probe never
  compares a binding-key ordinal with an admission ordinal.
- **Coverage slot** `{through, liveFrom, revision, state}` packed in one word,
  keyed `(family, scope)`, allocated by the first `backfill` call only when
  `liveFrom > 0` (binary search over the ordinal-sorted kind-10 list for the
  first ordinal `> d`). `retiredAt` lives in the family row.
- **Reverse locator for rebinds** (the §11a gap): the key's first admission
  ordinal is kind-8 word 0 entry 0; a binary search over the kind-10 list finds
  its position in `O(log N)` word reads. No reverse-map slot, no calldata, no
  linear walk. A first binding's position is `count − 1` after the kernel's
  append (head warm).
- **Bucket** = `IndexKeys.scalar(fieldBytes)`, the same value key the kind-7
  scalar index derives, with the bytes `RecordBody.validate` would yield for
  that field.
- **Hook**: for each freshly admitted binding leaf, `newType`/`oldType` from the
  target records; families of each; set the new bucket's bit; clear the old
  bucket's bit unless same family and same bucket; skip retired families.
  Bits are only ORed by backfill; the hook clears only on a rebind away.
- **page cursor** = `next | H << 48 | revision << 96 | 1 << 128 | tag << 136`;
  `H ≠ count.admissions` or a revision change → `ErrPageCursor`; a nonzero
  `basisOrdinal ≠ H` → `ErrPageBasis`. COMPLETE iff the scan exhausted the
  scope, coverage is COMPLETE and the family is live; a retired family never
  reads COMPLETE (the v1 "revoked sort = staleness 0" defect).
- **Detach**: `announceDetach` → `detachAt = H + Δ` (lab Δ = 4 admissions;
  the design says ≈2¹⁶), `detach` after `H ≥ detachAt` stamps `retiredAt`; the
  hook and backfill stop; bits are never cleared; re-attach is a new family id.

## 3. API (module, reached through the U4 core's fallback)

```solidity
declare(bytes32 typeId, uint8 fieldIndex) → (familyId, ordinal, declaredAt)
backfill(familyId, scopeKey, uint64 expectedThrough /* NONE = 2^64-1 */, uint16 maxEntries) → (through, liveFrom, state)
probe(familyId, scopeKey, bucket, position) view → bool        // reverts Unsupported/Frozen/NotAPosition/Uncovered
probeTolerated(...) view → (Tri {HIT, MISS_COVERED, UNCOVERED, UNSUPPORTED, FROZEN}, Coverage)
page(familyId, scopeKey, bucket, cursor, maxItems, basisOrdinal) view → (StateAuditPages.PageResult, Coverage)
coverageOf(familyId, scopeKey) view → Coverage; family(familyId) view
announceDetach(familyId) → detachAt; detach(familyId) → retiredAt
Coverage { slot, state {NONE, PARTIAL, COMPLETE, FROZEN}, through, liveFrom, revision, declaredAt, retiredAt, scopeCount, highWater }
```

`NotAPosition` reverts in both probes (an out-of-range position is a malformed
query, not a coverage state). The strict probe reads at most: family ordinal,
family packed word, kind-10 head, bit word, coverage slot, kind-10 word; the
tolerant probe and `page` additionally derive `liveFrom` by binary search when
no slot exists, for display.

## 4. Tests (all in `test/index-layer.test.mjs`, one managed anvil)

| matrix case | where | result |
| --- | --- | --- |
| declare after data exists (16 positions predate `d`, 14 of them admitted under U3) | steps "data that predates", "declare" | pass |
| delayed first backfill; writes before the first chunk | "delayed first backfill" | pass |
| writes before / during / after chunks | placements q00…q03, remove p00, rebinds p02/p09 | pass |
| a rebind during the build that changes the field converges | p02 draft→fileB (covered), p09 fileB→extra (gap), p05 fileB→extra before any backfill | pass |
| two builders racing, no guard: consecutive chunks both land in one block | `evm_setAutomine(false)` | pass (12→14→16) |
| two builders racing, with guard: loser reverts `Guard(through, expected)` | photos/ scope | pass |
| probe: covered clear bit = false; uncovered clear bit = revert `Uncovered(pos, through, liveFrom)`; set bit in the gap = true | | pass |
| page PARTIAL with explicit gap `[6,17)` then COMPLETE | | pass |
| a scope born after `d` needs no coverage slot (probe, page COMPLETE, backfill returns COMPLETE without a slot) | `late/` | pass |
| detach freezes: probe `Frozen`, tolerant `FROZEN`, page PARTIAL with items intact, backfill `Frozen`, hook stops, bits never cleared, re-attach = new id | | pass |
| page cursor across a rebind between pages is refused (`ErrPageCursor`) and a stale basis is refused (`ErrPageBasis`); re-based listing reflects the rebind | | pass |
| operator path retired (the only admission path is hooked) | | pass |
| generic walker: `DirectoryEntry.name` (STRING) and `FileRevision.mediaType` on the head scope; OPTION/behind-OPTION/unknown-Type declarations refused | | pass |
| differential oracle over every position × 4 buckets after completion | 80/80 | pass |

Verbatim run (2026-09-11 00:48 UTC, `node --test --test-force-exit --test-concurrency=1 test/index-layer.test.mjs`):

```
✔ FIELD_EQ family over DirectoryEntry.child: declare after data, delayed backfill, convergence, coverage, detach (6544.503459ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6692.262959
```

The suite's receipt-level gas (MEASURED, receipts only, not retained as traces)
is in `evidence/functional-run.json`; the retained-trace figures are §5.

## 5. Measurements (MEASURED unless marked; run `n1000`)

Harness: `scripts/measure.mjs --n 1000 --sparse 64 --label n1000` (2026-09-11,
commit `c833ecd` + this lab uncommitted, anvil 1.7.1, solc 0.8.30, Cancun, tx
gas limit 16,777,216). Retained under `evidence/n1000/`: per transaction
`receipt.json`, `tx.json`, `prestate-diff.json`, `storage-ops.json`,
`analysis.json` and the full stack-enabled `trace.json.gz`; `environment.json`,
`summary.json`, `tables.md` (generated by `scripts/report.mjs`), and
`index.json` with the sha256 of all 230 files (180.6 MiB, of which 169.1 MiB
are the gzipped traces, kept locally). Every transaction reconciles
`intrinsic + gross − refund = receipt` with residual 0 (38/38), 0 SSTORE
EIP-2200/2929 model mismatches, and the `prestateTracer` diff agrees for 34/38
— the four exceptions (`u3-restore`, `u4-restore`, `hook-restore-set`,
`hook-rebind-field-change`) are exactly the transactions with one `CLEAR`
write, which geth-style diff mode omits from `post`; the harness check was
corrected after this run (the 10k run reports 0). Unattributed reads: 4 per
placement (8,400 gas), the resolver probing binding heads of principals that
never bound the name, as in the baseline harness.

Reuse: `trace.mjs` / `gas.mjs` / `slots.mjs` from
`../2026-09-09-files-browser-mvp/scripts/measure/lib` unchanged; the lab adds a
lean slot map sized from actual heads (`scripts/lab-slots.mjs`) with the lab
namespace labelled. A methodological finding worth keeping: an anvil started
with `--steps-tracing` keeps every mined transaction's step log in memory
(3,157–6,338 MiB after 13 traced 3–5M-gas transactions, ≈250 MB each; ~100
placements killed it) and `anvil_dumpState` on such a node dies serialising
them, so the harness populates on an untraced node and re-hosts the same chain
on the same port through `anvil_dumpState`/`anvil_loadState`
(`--no-request-size-limit`) for each traced phase; a 1,000-placement world is a
10.2 MiB dump that loads in 0.4 s.

### 5.1 Population

1,000 placements of four files into one directory (`placement`, 2 leaves each,
FilesRouterV2 → hooked U4 core, no family declared yet): **49,494 ms wall**
(49 ms each) on the untraced node, 3,112,982,140 gas in total (3.11 M per
placement; the U3/U4 placement band is 3.05–3.23 M, 53–62 FRESH slots). The
sparse arm: 64 `createDir` (5.1 M each) in 5,622 ms.

### 5.2 Per-entry backfill cost under today's layout — `evidence/n1000/backfill-*/analysis.json`

| chunk | receipt | per entry | SLOADs | SLOADs/entry | SSTORE classes (FRESH / COLD / WARM) | note |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `backfill-32` | 1,913,261 | 59,789 | 777 | 24.3 | 3 / 2 / 27 | 3 fresh bucket words |
| `backfill-64` | 3,656,759 | 57,137 | 1,545 | 24.1 | 0 / 5 / 60 | |
| `backfill-128` | 7,266,182 | 56,767 | 3,081 | 24.1 | 0 / 5 / 124 | |
| `backfill-256` | 14,673,829 | 57,320 | 6,153 | 24.0 | 4 / 5 / 248 | 4 fresh words (word 1 of each bucket) |
| `backfill-max-273` | 15,654,878 | 57,344 | 6,561 | 24.0 | 4 / 5 / 265 | **largest chunk that landed** |
| `backfill-oog-288` | 16,257,997 consumed, status 0 | — | 6,818 | — | — | out of gas under the 16,777,216 ceiling (the 63/64 rule leaves ≈1/64 unspent) |

**Marginal per entry (hot arm, bit words already allocated): 56,397 receipt
gas** (64→128 delta ÷ 64; 57,872 for 128→256, which carries four fresh words =
625/entry). Implied fixed cost per `backfill` call ≈ 47,336 (22,452 intrinsic +
family/coverage/init reads + the coverage rewrite + event). The largest chunk
under the ceiling is therefore **between 273 (landed, 15,654,878) and 288
(failed)** under this walk; the exact edge was not bisected further.

**Walk decomposition per entry (MEASURED, 64→128 delta; all 24 SLOADs
attributed, 0 unattributed):**

| StateStore kind read | SLOADs / entry | gas / entry | what it is |
| --- | ---: | ---: | --- |
| `Record:BindingSet/1` | 7 (5 cold + 2 warm) | 10,700 | typeId, body length (×3 calls), purpose, subject, fieldRole |
| `Record:DirectoryEntry/1` | 5 | 10,500 | target typeId, body length, 3 body words (parent, name, child) |
| `Envelope` | 6 (4 cold + 2 warm) | 8,600 | bytes length (×3), principal word, leaf-count word, record-id word |
| `Admission` | 2 | 4,200 | envelopeId, packed (leaf index) |
| `Binding` | 2 | 4,200 | meta, target |
| `Word:k10` | 0.23 | 475 | the scope word, five ordinals per word |
| `IndexWord` | 1 (warm) | 100 | the bit word (rewritten warm) |
| **SLOAD total** | **24** | **38,775** | |
| non-storage plumbing | | 17,522 | STACK 7,049, CONTROL 5,061, ARITH 2,796, MEMORY 1,592, KECCAK 996, CALLDATA 28 |
| SSTORE | | 100 | warm rewrite of the bit word |
| **per entry** | | **56,397** | |

**K10 saving (ESTIMATED, not claimed).** K10 puts the binding-key ordinal in
the kind-10 word, so the leg admission row → envelope bytes → BindingSet body
→ binding key (Admission 2 + Envelope 6 + `Record:BindingSet/1` 7 = 15 SLOADs,
23,500 gas/entry) becomes one `bindingKeys[ordinal]` read (2,100). SLOAD-only
saving ≈ **21,400 per entry (38 % of 56,397)**, plus the keccak/memory
plumbing of those decodes (not separated). ESTIMATED post-K10 hot cost ≈ 33–35k
per entry, i.e. a chunk cap around 450–490 entries under the same ceiling —
**512 is not reached by this estimate**. The design's 9.5–15k post-K10 figure
(§1 there) priced the scope word, the binding key + head and a 2,700–8,400
target-field read; measured, the target record costs 10,500 (typeId + length +
3 body words, the whole small body is loaded), the binding row 4,200, and the
walk carries ≈17.5k of interpreter plumbing per entry (`StorageByteView`
loops, `FieldWalk.extract` copies, keccaks) that no SLOAD count shows. The
full-envelope decode that `references()`/`withdrawal()` perform today would
add the remaining envelope words (a 2-leaf placement envelope is 10 ABI words;
this walk reads 3 of them + the length): ESTIMATED +7 cold words ≈ +14,700 per
entry, which is the "envelope-size term" the design left unverified.

**Sparse arm** (`backfill-sparse-64`, 64 distinct children, includes its slot
init): 5,059,456 = **79,054 per entry**, of which 64 FRESH bucket words =
20,000 each; walk + init ≈ 59k. ESTIMATED sparse chunk cap ≈ 210 entries.

### 5.3 Hook cost per placement and per rebind — `evidence/n1000/{u3,u4,hook}-*/analysis.json`

Receipts are noisy at ±17,100 per FRESH posting-word crossing (the FRESH counts
are in `tables.md`); the honest per-operation number is the **hook frame's
self gas** (all opcodes executed by `IndexedAdmission`, its SLOAD/SSTOREs
included, independent of the kernel's frame):

| operation | hook frame self gas | of which storage on the lab namespace | receipt |
| --- | ---: | --- | ---: |
| U4 placement, no family (wrapper only: pre-read 1 head, nested-call encoding, `typeFamilies` read) | **21,800** | IndexTypeFamilies 1 read | 3,088,061–3,139,325 (U3: 3,050,766–3,225,189) |
| placement, family attached, bucket word FRESH | **62,254** (+40,454) | IndexWord 1 read + 1 FRESH write 20,000; IndexFamily 2 reads | 3,201,239 |
| placement, family attached, bucket word warm | **45,154** (+23,354) | IndexWord 1 read + 1 cold rewrite 2,900 | 3,115,175 |
| placement, second bucket (fresh word) | 62,254 | as fresh | 3,140,057 |
| `remove` (whiteout rebind of a hook-set position + marker bind) | **89,599** (U4 no family: 39,878) | locate: 11 kind-10 word reads + kind-8 word 0; old body; clear 2,900 | 5,213,502 |
| `restore` (entry rebind of the whiteout position) | **83,327** (U4 no family: 33,584) | locate; new body; set 2,900 | 4,206,838 |
| direct one-step rebind fileB→draft (field change) | **121,561** | locate; old + new bodies; CLEAR + FRESH word 20,000 | 2,934,951 |
| direct rebind of an unbackfilled pre-`d` position | 118,221 | locate; set FRESH | 2,952,449 |

So on this wrapper: **≈23k per placement with a warm bucket word, ≈40k when the
placement opens a new bucket word; ≈50–100k per rebind**, of which the
`O(log N)` reverse locator is ≈11 word reads ≈ 23k at N=1,000 and a new bucket
word is 20,000. The design's ESTIMATED 8–13k / 16–27k assumed an in-kernel hook
with the target body and Type cache already in memory and a free position;
the delta to that is the wrapper's re-reads (§2.1) and the locator.

### 5.4 Reads, coverage init, declare — `evidence/n1000/{probe,page,coverage-init,declare}*/analysis.json`

Sent as transactions so receipts exist; execution gross in parentheses is the
`eth_call` cost (receipt − 21,000 − calldata).

| op | receipt | execution | SLOADs | note |
| --- | ---: | ---: | ---: | --- |
| `probe` hit | 42,145 | 19,417 | 5 | ERC-1967 impl, family ordinal, family word, kind-10 head, bit word |
| `probe` covered miss | 44,726 | 21,986 | 6 | + coverage slot |
| `probe` born-after-`d` miss (no slot) | 47,201 | 24,449 | 7 | + the kind-10 word of the position |
| `probeTolerated` MISS_COVERED | 48,412 | 25,672 | 7 | Coverage struct returned |
| `probe` uncovered → revert | 71,120 consumed | 48,392 | 16 | includes the log N `liveFrom` derivation on the revert path only |
| `page` hot bucket, 256 items | 443,052 | 420,056 | 12 (23,200) | **≈1,550 per item** of loop + ABI return; storage is 4 bit words |
| `page` hot bucket, 512 cap (≈254 hits exist) | 445,295 | 422,299 | 12 | |
| `page` sparse bucket, 1 hit | 72,990 | 49,994 | 9 | |
| coverage-slot init (`backfill` with 0 entries) | 98,201 | 75,761 | 19 | binary search: 10 kind-10 word reads at N=1,000; 1 FRESH slot 20,000 (design ESTIMATED ≈47k) |
| second family, same scope | 97,418 | 74,978 | 18 | |
| `declare` (attach) | 354,891 | 333,175 | 75 | 69 Type reads = the `cacheBytes` decode (144,900); 7 FRESH slots (148,400) |
| U4 upgrade (`upgradePair`) | 584,409 | 562,073 | 72 | |

The strict probe costs ≈19–24k of execution against the design's ESTIMATED
≈6,300: the extra is the proxy → U4 → module double delegatecall, the family
lookups (ordinal + word) and ABI plumbing, not the bit read. `page` per 256
entries is ≈420k, dominated by item materialisation, not storage.

### 5.5 N = 10,000

Not reached in this round. The `n10000` run was started and captured only its
phase-B baselines before the agent producing it hit a session limit; that
partial directory (no `index.json`, no `summary.json`) was deleted rather than
kept as evidence. A full run (`scripts/measure.mjs --n 10000 --sparse 64
--label n10000`) is ≈8 minutes of untraced population plus the traced phases
and is queued after the lab test re-run; until it lands, every number in this
document is N = 1,000, and the "10k scale" the PM asked for is **not
measured**.

### 5.6 Oracle

After completion the off-chain oracle (kind-10 listing → occurrence → record →
binding head → target record → `child`) was compared with `probe` at every
position × 4 buckets: **1,003 positions, 4,012 probes, 0 mismatches** (1,760
ms), `evidence/n1000/environment.json → oracle`.

## 6. What works, what does not

**Works.** Everything in §4 on the populated pair; the walker over three
different fields; the reverse locator without extra storage; the guard and the
guard-free race; born-after-`d` scopes with no slot; detach two-step.

**Does not / not done.**

- **Withdrawal-driven tombstones are not hooked.** The kernel can tombstone a
  binding through a `Withdrawal` leaf (`StateKernel.withdrawal` →
  `saveBinding(withdrawHead)`); the wrapper pre-reads only `BindingSet` /
  `BindingTombstone` leaves. The Files router never emits withdrawals, so no
  test exercises it; an in-kernel hook at `saveBinding` would cover it. A
  withdrawal on an attached scope would leave a stale set bit.
- **Attach authority is "anyone" and Type-level only** — the lab's simplest
  authority; the design's Type-author / scope-principal authority, the
  effective epoch and the writer cost ceilings (§11a) are not implemented.
- **The hook is a wrapper**, not the kernel's journaled plan (§2.1); its cost
  overstates an in-kernel hook by the items listed there.
- **Δ for detach is 4 admissions** (lab knob), not 2¹⁶.
- **Full-envelope decode was not measured as a variant**: the walk reads the
  envelope positionally (principal, leaf count, record-id word), exactly as the
  kernel's own reader `StatePointReads._hydrate` does; the cost of decoding the
  whole envelope (what `references()` does) is ESTIMATED from the measured word
  counts in §5.3.
- **N = 10,000**: see §5.5 for what was reached.
- No K10; no sorted runs; no TagSet joins (Task B).

## 7. How to run

```sh
cd Reviews/2026-09-10-index-layer-lab
node --test --test-force-exit --test-concurrency=1 test/index-layer.test.mjs   # matrix, ~1 min after compiles
node scripts/measure.mjs --n 1000 --sparse 64 --label n1000                    # retained traces, ~? min
```

Both compile the foundation, the MVP router and the lab (`forge build --offline
--use <pinned solc 0.8.30>`); `compileRouter` rewrites the tracked
`Reviews/2026-09-09-files-browser-mvp/contracts/{out,cache}` — restore them with
`git checkout -- <paths>` afterwards. Never run the measurement concurrently with
a node suite. `evidence/<label>/index.json` lists every retained file with its
sha256; `trace.json.gz` files are kept locally (`.gitignore`) and regenerable.

## 8. Lead's review (2026-09-10 evening)

The adversarial review agent for this round did not run (session limit), so
the integration-test-lead reviewed the hook and the module by hand and re-ran
the matrix. Findings, in severity order:

1. **Latent position bug for two first-time bindings in one scope in one
   publication** (`IndexedAdmission.afterAdmit`): a binding whose pre-read
   head was empty gets `position = scopeCount − 1` *after* the kernel ran, so
   if one publication first-binds two positions in the same scope, both get the
   last position. No Files router operation does this (a rename or move binds
   one new position per scope; a createFile binds its name entry and its
   revision head in different scopes), so no test exercises it and the
   1,000-position oracle cannot see it — but a kernel-level hook must assign
   positions in leaf order from the pre-admission count. Fix: record
   `scopeCount` per scope in `preRead` and count new bindings per scope in
   order. Not fixed in this round; recorded so the K10 integration does not
   inherit it.
2. **Withdrawal-driven tombstones are not hooked** (§6). A `Withdrawal` leaf
   that tombstones an attached position leaves a stale set bit. The Files
   router never emits withdrawals; an in-kernel hook at `saveBinding` would
   cover it. A set bit is therefore "authoritative" only under the Files
   router's operation set.
3. **Attach authority is "anyone"** (lab knob). The design's Type-author /
   scope-principal authority is not implemented; do not read the hook cost
   as the writer-consent model.
4. Verified by hand: `probe` is the only bool path and reverts on clear-in-gap,
   frozen and unknown families; `probeTolerated` and `page` carry no bool;
   `page` COMPLETE requires exhaustion + COMPLETE coverage + a live family and
   its cursor commits the admission high-water (any admission, including a
   rebind, invalidates it); backfill takes nothing from calldata and derives
   each bit from the kind-10 word → admission → envelope → binding record →
   binding → target record; the guard-free race lands consecutive chunks;
   `src/` is byte-identical to the pinned kernel (cmp), and the single
   foundation edit is `executeFixture` made `virtual`.
