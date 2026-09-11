# Index-layer lab — one declared `FIELD_EQ` family, hook + backfill + probe + page, measured

**Status:** lab on `fable/2026-09-09-files-browser`, written 2026-09-10 (Task A of the
prototype round in [reconciliation-with-codex-2026-09-10.md §3](../2026-09-09-files-browser-mvp/reconciliation-with-codex-2026-09-10.md)).
Implements the smallest honest version of the L1 declared family of
[index-layer-2026-09-10.md](../2026-09-09-files-browser-mvp/index-layer-2026-09-10.md)
on the populated files-browser world and measures it with retained receipts and
traces. Not a design, not a ruling. Sections 0–8 are round 1 (no K10; the
K10 figures there are ESTIMATED). **§9 is round 2 (late evening 2026-09-10):**
the §8 position bug fixed, Codex's K10 patch applied to the lab's pinned
kernel, a fresh mode-1 world, and the K10 saving MEASURED in both layouts —
read §9 for the current numbers. Every number is **MEASURED** (a retained
artifact under `evidence/`), **QUOTED** (a spec) or **ESTIMATED** (arithmetic
on measured counts).

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
  -- round 2 (§9) --
  lab/ScopeOrdinals.sol       lane -> admission ordinal in either layout; lowerBound; reverse locator
  lab/LabWorld.sol            fresh-world U1 core: selectScopeLayout(mode) BEFORE initialize; scopeLayout() getter
  lab/FixtureDeployment.sol   copy of the foundation's test factory (imports rewritten)
  foundation/UpgradeableFixtureCarrier.sol   byte-identical copy (fresh world needs a carrier)
  scripts/lab-world.mjs       withLabWorld({scopeLayout}): the fresh pair from the lab's K10-patched build
  scripts/compare.mjs         two runs side by side (mode 1 - mode 0), from analysis.json only
  scripts/salvage-trace.mjs   offline hook/module gas + lane reads from retained trace.json.gz (used for the partial 10k run)
  evidence/functional-run-mode1.json, n1000-mode0/, n1000-mode1/, n1000-mode0-fresh/, n10000-mode0/ (…)
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
node --test --test-force-exit --test-concurrency=1 test/index-layer.test.mjs   # matrix, BOTH worlds (mode 0 populated, mode 1 fresh), ~1 min after compiles
node scripts/measure.mjs --n 1000 --sparse 64 --label n1000-mode0              # populated pair, legacy layout (control), ~5.5 min
node scripts/measure.mjs --n 1000 --sparse 64 --label n1000-mode1 --world fresh --layout 1   # fresh pair, K10 layout
node scripts/measure.mjs --n 1000 --sparse 64 --label n1000-mode0-fresh --world fresh --layout 0   # fresh pair, legacy layout (library control)
node scripts/measure.mjs --n 10000 --sparse 64 --label n10000-mode0 --no-finish   # 10k: never finish the scope under tracing
node scripts/report.mjs --label <label>                                        # tables.md for one run
node scripts/compare.mjs --a n1000-mode0 --b n1000-mode1                       # mode 1 - mode 0, markdown to stdout
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

## 9. Round 2 (2026-09-10, late evening) — position fix, Codex's K10 patch, mode-1 world, both layouts measured

Written incrementally as each step lands (partial work survives a session
end). Every number is MEASURED (retained artifact under `evidence/<label>/`),
QUOTED (a spec or Codex's handoff) or ESTIMATED (arithmetic on measured
counts). Order of work: 9.1 position fix → 9.2 K10 patch applied to the lab's
pinned `src/` → 9.3 mode-1 world + mode-1 derive + every "born after d"
comparison fixed → 9.4 N = 1,000 in both layouts → 9.5 N = 10,000 → 9.6
restore + final matrix.

### 9.1 Two first bindings in one scope in one publication (README §8 item 1) — FIXED

**Bug.** `afterAdmit` computed a first binding's position as `scopeCount − 1`
*after* the kernel ran, so every first binding of the same scope in one
publication received the last position.

**Fix** (`lab/IndexedAdmission.sol`): `preRead` records the scope's kind-10
count BEFORE admission for every leaf whose binding row is empty (the kernel
re-reads that head warm for its own append, so the pre-read is net-free);
`afterAdmit` first classifies the leaves (`skip` = not freshly admitted, or a
later leaf on a key an earlier admitted leaf already carries — the kernel
journals such a leaf as a rebind of the first, and the first occurrence reads
the publication's *final* head from storage; `isNew` = first binding of a
distinct key), then assigns `position = preCount + (number of earlier isNew
leaves of the same scope)` in leaf order — the order the kernel appends — and
only then decides families and bits. A first binding whose target Type has no
family (a whiteout) still consumes its position. The in-publication duplicate
key branch is defensive: a same-key rebind inside one publication would need a
predecessor occurrence that names its own envelope, which is circular and
cannot be built, so it is unreachable through the kernel's CAS.

**Test** (`test/index-layer.test.mjs`, in the born-after-`d` `late/` scope,
which needs no coverage slot): one author-signed publication with six leaves
`entry(fileA) | bind | whiteout | bind | entry(draft) | bind`
(`directAdmit`, CAS rows `[1,0] [3,0] [5,0]`), then the oracle (kind-10 →
occurrence → binding head → target) must list `[fileA, whiteout, draft]` at
positions `before+0..2`, every probe at those positions × 4 buckets must agree
(12 checks), and the pages for `fileA` / `draft` must each hold exactly one
position. Verified RED first: against the round-1 hook (`git show HEAD:…`) the
suite fails at `multi-first-bindings: position 1 bucket fileA — false !== true`
(all three bits landed on position 3); GREEN with the fix.

Verbatim run (fixed hook, 2026-09-11, `node --test --test-force-exit
--test-concurrency=1 test/index-layer.test.mjs`):

```
✔ FIELD_EQ family over DirectoryEntry.child: declare after data, delayed backfill, convergence, coverage, detach (8298.107792ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Cost of the fix (MEASURED, receipts in `evidence/functional-run.json`, not
traced): placement with a fresh bucket word 3,133,212 → **3,134,816
(+1,604)**, warm word 3,109,842 → **3,111,446 (+1,604)**; the six-leaf
publication itself 6,953,445. (Corrected after review: the values first
written here were from the step-1 run, whose `functional-run.json` later
runs overwrote; the +1,604 includes the `ScopeOrdinals` locator refactor as
well as the position fix.) The SLOAD of the kind-10 head moves from the
kernel's frame to the hook's (cold there, warm for the kernel), so the delta is
the classification loops and the wider `Pre` struct, not storage.

### 9.2 Codex's K10 patch applied to the lab's pinned `src/` — DONE

`git diff 832c7ae..fe98f18 -- Reviews/2026-09-05-c0-core/src` (StateStore +3,
StateKernel +22/−? , StateReadPrimitives +40, StateAuditPages +65/−?),
path-rewritten to `src/` and applied clean with `git apply`; the four files are
now byte-identical to `fe98f18` (`cmp`), the shared `c0-core/src` untouched.
Hashes and the full note are the "Second pin" in `PINNED-SOURCES.md`. The lab
compiles against it unchanged (solc 0.8.30, via-IR, 200 runs, Cancun):
`UpgradeAdmissionLibrary` **24,553 bytes = 23 bytes of EIP-170 headroom,
exactly Codex's figure** (QUOTED 24,553 in the handoff; MEASURED here from the
lab artifact). The populated-pair path is untouched by the patch — it links to
the genesis-deployed legacy library whose codehash the controller pins — and
re-ran green on the patched `src/` (`tests 1 / pass 1 / fail 0`, 6,733 ms).
`K10Scope.t.sol` / `K10ScopeHarness.sol` were not brought over (why: in
PINNED-SOURCES); the seam they show — `selectScopeLayout(s, 1)` before
`initialize` — is what the lab's fresh-world U1 core does in §9.3.

### 9.3 Mode-1 world, mode-1 derive, every "born after d" comparison fixed — DONE

**The fresh-world arm** (`scripts/lab-world.mjs`, `lab/LabWorld.sol`,
`lab/FixtureDeployment.sol`). `withLabWorld({ scopeLayout })` starts a managed
anvil and deploys the foundation pair from the LAB's own `out/` — i.e. the
foundation compiled against the lab's K10-patched `src/`: `FixtureDeployment`
(a copy of the foundation's test factory with its three `../src/` imports
rewritten to the lab's `Foundation/` remapping, nothing else), `PreparationHelper`,
`UpgradeAdmissionLibrary` (K10 kernel, 24,553 bytes), `PointReadLibrary`,
`UpgradeQueryReadLibrary` (K10 readers), `UpgradeableFixtureCarrier` (added to
the lab's `foundation/` copy, byte-identical, sha256 `30e845de…`), and the U1
core `UpgradeableReadFixtureCoreK10`, whose `initialize` override does exactly
Codex's harness sequence — `_initialize(...)`, then
`StateKernel.selectScopeLayout(efs(), selectedScopeLayout)` (an immutable of
the implementation, chosen at deployment, never inferred), then
`StateKernel.initialize(...)` — and exposes the full-word `scopeLayout()`
getter. That override needs `initialize` to be `virtual`, which is the second
(and only other) edit to the lab's foundation copy of `UpgradeableFixtureCore.sol`
(marked `LAB EDIT … round 2`). `deployPair` is the factory's own, so the proxy /
ProxyAdmin / execution-set machinery is the foundation's. The deployer then
asserts the stored discriminator reads back as selected. The rest of the world is
built by the SAME fixtures as the populated path — `nestedFixture` (operator
path on the K10 U1 core) → `routerFixture` (FilesRouterV1) → `authorityFixture`
(U3 + FilesRouterV2, from the MVP's artifacts, linked to the lab's K10
libraries; U3 is ABI-compatible because the patch changes no struct) →
`indexLayerFixture` (U4 hook + module). `--world fresh --layout 0` gives the
legacy layout on the same patched kernel bytes: a second control that isolates
the layout from the library.

**Layout selection in the lab code** is one read of the stored `scopeLayout`
(`ScopeOrdinals.layoutOf`, reverts `ScopeLayoutUnsupported` above 1) — never
a value inference. The module exposes `scopeLayout()`; `indexLayerFixture`
reads it once after the U4 upgrade and the test asserts it equals the world's
selection.

**Every lane → admission comparison now goes through one helper**
(`lab/ScopeOrdinals.sol`):

| use | round 1 | round 2, mode 0 | round 2, mode 1 |
| --- | --- | --- | --- |
| `probe` born-after-`d` | `ordinalAt(pos) > d` (lane compared with `d` — wrong in mode 1) | `admissionAt(pos) > d` = lane | `admissionAt(pos) > d` = kind-8 word 0 of `bindingKeys[lane]` (3 reads: k10 word, `bindingKeys[k]`, k8 word 0) |
| `backfill` first touch `liveFrom`, `coverageView` display `liveFrom` | `lowerBound` on lanes | `lowerBound` on `admissionAt` (log N × 1 read) | log N × 3 reads |
| hook reverse locator (rebind) | binary search on lanes vs kind-8 word 0 of the key | same, via `admissionAt` | binary search on `admissionAt` (log N × 3 reads) + a final `bindingKeys[lane] == key` equality check (`ScopeIntegrity(4)`) |
| `derive` (backfill walk) | lane → admission → envelope → BindingSet body → key → binding → target | unchanged (control) | lane → `bindingKeys[k]` → binding row → target record → field (`deriveK10`); no admission row, envelope bytes or BindingSet record read; trusts the kernel's kind-10 inventory to name keys of this scope, where the mode-0 walk re-derives the scope from the BindingSet body |

Why kind-8 word 0 and not something cheaper: a `BindingRow` is `{meta,
target}` and carries no key ordinal, and `Head.admissionOrdinal` is the
*last* admission (not monotone in position after rebinds), so the only
admission-domain value that is both available from a lane and sorted by
position is the key's first history entry — the same source Codex's
`StateReadPrimitives.firstBindingAdmission` uses (with more validation). Price:
each mode-1 comparison costs 3 cold SLOADs (≈6,300) against 1 (≈2,100); the
log N searches (coverage init, display `liveFrom`, the locator) are 3× the
mode-0 storage cost. The mode-1 receipts already show it (functional run,
MEASURED, not traced): direct rebind of an unbackfilled pre-`d` position
2,955,411 (mode 0) → 2,979,219 (mode 1, +23,808); `remove` 5,234,322 → 5,258,488
(+24,166); backfill of 6 entries with slot init 472,513 → **342,804 (−129,709)**;
a guarded 6-entry chunk 425,818 → **277,026 (−148,792 ≈ −24,800 per entry)**.
Traced, decomposed figures are §9.4.

**Oracle in mode 1** (`lab-fixture.mjs`): raw kind-10 lanes are key ordinals,
so the oracle takes Codex's *hydrated* kind-10 page (`pagePostingsHydrated`,
rows carry the first admission recovered through kind 8 and the BindingSet
record id), walks record → key → head → target as before, and cross-checks
each row's key against `bindingKeyAt(lane)` from the raw page. The test also
asserts the domain separation directly: in mode 1 every lane is strictly below
its first admission ordinal; in mode 0 every lane equals it.

**Matrix, both worlds** (`node --test --test-force-exit --test-concurrency=1
test/index-layer.test.mjs`, 2026-09-11; the first run of this step failed in
BOTH worlds with `ScopeIntegrity(3)` on the first rebind — a lab bug in the
new `locate` (`lo >= hi` after a binary search is always true; fixed to
`lo >= n`) — then:

```
✔ FIELD_EQ family over DirectoryEntry.child — mode 0 (populated pair, legacy layout, genesis kernel library): … (8732.833125ms)
✔ FIELD_EQ family over DirectoryEntry.child — mode 1 (fresh pair, K10 layout selected before initialize, patched kernel): … (4509.867666ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

Receipts of both arms: `evidence/functional-run.json` (mode 0) and
`evidence/functional-run-mode1.json` (mode 1).

### 9.4 N = 1,000 in both layouts (retained receipts and traces)

Three runs of `scripts/measure.mjs --n 1000 --sparse 64 --skip-compile`
(everything compiled by the matrix run just before), same phases A–D and the
same re-hosting discipline as round 1 (§5), each retained under
`evidence/<label>/` with `index.json` (sha256 of every file), `summary.json`,
`environment.json` (now with a `world` block: kind, selected and stored
`scopeLayout`, which kernel library, the fresh deployer's addresses / sizes /
artifact pins) and `tables.md` from `scripts/report.mjs`:

| label | world | stored `scopeLayout` | kernel library the admissions ran through | role |
| --- | --- | --- | --- | --- |
| `n1000-mode0` | populated pair (`withUpgrade`) | 0 | foundation genesis library (shared unpatched `c0-core/src`), pinned by the controller | **the control the task names** |
| `n1000-mode1` | fresh pair (`withLabWorld`, layout selected before `initialize`) | 1 | lab-compiled K10 library (24,553 bytes) | **the K10 arm** |
| `n1000-mode0-fresh` | fresh pair, layout 0 | 0 | lab-compiled K10 library | supplementary control: same kernel bytes as the K10 arm, only the layout differs |

`scripts/compare.mjs --a <A> --b <B>` prints B − A from the two runs'
`analysis.json` files (per-entry backfill deltas by `StateStore` kind, chunk
receipts, hook / module frame self gas, SLOAD counts, population wall-clock,
oracle counts). The **K10 saving reported below is MEASURED as
`n1000-mode1` − `n1000-mode0`** (the task's definition); `n1000-mode0-fresh`
is quoted next to it so a reader can see how much of any hook-side delta is the
kernel library rather than the layout (the backfill walk runs entirely in the
lab module, so its delta is layout-only in either comparison).

Runs (2026-09-11, anvil 1.7.1, solc 0.8.30, Cancun, tx ceiling 16,777,216;
every transaction reconciles `intrinsic + gross − refund = receipt` with
residual 0 and 0 SSTORE model mismatches: 38/38 in each run): `n1000-mode0`
319 s, `n1000-mode0-fresh` 309 s, `n1000-mode1` 291 s (its first attempt
measured everything and then crashed in the *oracle*, see the hydrated-page
finding below; the directory was deleted and the run repeated with the oracle
rewritten). Oracle after completion in every run: 1,003 positions × 4 buckets =
**4,012 probes, 0 mismatches**. Population: 1,000 placements in 50,899 ms
(mode 0) / 48,336 ms (mode 1) on the untraced node; 3,114,900 vs 3,117,707 gas
per placement (**+2,807 = the K10 kernel's own `scopeLayout` read on every
admission**, MEASURED as +2,747–2,783 on the `mode0-fresh` control too, where
the layout is 0 and only the library differs).

#### 9.4.1 Backfill per entry — the K10 saving, MEASURED (`compare.mjs --a n1000-mode0 --b n1000-mode1`)

64 → 128 marginal, hot arm (4 buckets cycling, bit words allocated):

| per entry | mode 0 (`n1000-mode0`) | mode 1 (`n1000-mode1`) | **mode 1 − mode 0** |
| --- | ---: | ---: | ---: |
| **receipt gas** | **56,425** | **31,384** | **−25,041 (−44.4 %)** |
| SLOADs | 24 | 10 | −14 |
| SLOAD gas | 38,775 | 17,375 | −21,400 |
| KECCAK256 / MEMORY / STACK / CONTROL / ARITH / CALLDATA | 996 / 1,602 / 7,037 / 5,079 / 2,808 / 28 | 540 / 771 / 5,801 / 4,390 / 2,388 / 18 | −456 / −830 / −1,236 / −689 / −420 / −10 (= −3,641 of plumbing) |
| SSTORE (warm rewrite of the bit word) | 100 | 100 | 0 |

By `StateStore` kind (SLOADs / gas per entry): `Record:BindingSet/1` 7 /
10,700 → **0**; `Envelope` 6 / 8,600 → **0**; `Admission` 2 / 4,200 → **0**;
`BindingKey` 0 → **1 / 2,100**; unchanged: `Record:DirectoryEntry/1` 5 /
10,500, `Binding` 2 / 4,200, `Word:k10` 1 / 475, `IndexWord` 1 / 100. So the
leg the round-1 estimate priced (15 SLOADs, 23,500 → one 2,100 read, ≈21,400
saved) is **exactly** what the SLOAD column shows, and the plumbing the estimate
could not separate is a further 3,641 per entry. The round-1 ESTIMATE of a
33–35k post-K10 walk was therefore slightly pessimistic: MEASURED **31,384**.

Chunk receipts and per-entry receipts (receipt ÷ entries): 32 → 1,916,312 /
59,885 vs 1,129,169 / 35,287; 64 → 3,660,685 / 57,198 vs 2,081,989 / 32,531;
128 → 7,271,859 / 56,811 vs 4,090,557 / 31,957; 256 → 14,683,007 / 57,355 vs
8,218,493 / 32,103 (per-entry delta −24,598 … −25,252 at every size). The
marginal grows with chunk size in both modes (mode 1: 29,776 for 32→64, 31,384
for 64→128, 32,249 for 128→256): memory is never released inside the chunk
loop, so memory expansion adds a small quadratic term, and the 128→256 chunk
crosses into bit word 1 (4 FRESH words = 625/entry, as in round 1).

**Largest chunk under 16,777,216:** mode 0 **273 landed** (15,664,520), 288
out of gas (16,257,997 consumed) — the round-1 edge; mode 1 **491 landed
(15,754,885), 517 out of gas** (16,257,997 consumed); the exact edge between
491 and 517 was not bisected. The round-1 ESTIMATE was "450–490, 512 not
reached"; MEASURED the cap sits at 491 or a little above, i.e. within a few
entries of 512 but a 512-entry chunk was not shown to land.

**Sparse arm** (`backfill-sparse-64`, 64 distinct children, one FRESH bucket
word each, includes the slot init): 5,063,749 → **3,501,841** (79,121 → 54,716
per entry, −24,405 per entry); SLOADs 1,552 → 667.

#### 9.4.2 What mode 1 makes dearer — the three-read comparison (MEASURED)

Every place that turns a lane into an admission ordinal now reads
`bindingKeys[k]` and kind-8 word 0 as well as the lane:

| op | mode 0 receipt | mode 1 receipt | delta | reads that differ (mode 0 → mode 1) |
| --- | ---: | ---: | ---: | --- |
| `coverage-init` (binary search for `liveFrom`, 10 probes at N=1,000, 1 FRESH slot) | 100,980 | 146,572 | **+45,592** | `Word:k10` 10 → 10, `BindingKey` 0 → 10, `Word:k8` 0 → 10 |
| `coverage-init-2` (second family, same scope) | 100,138 | 140,961 | +40,823 | same shape |
| `probe-tail-miss` (one born-after-`d` comparison) | 49,420 | 54,187 | **+4,767** | `BindingKey` 0 → 1, `Word:k8` 0 → 1 |
| `probe-uncovered-revert` (log N `liveFrom` on the revert path) | 73,888 | 121,570 | +47,682 | 10 → 30 lane-derived reads |
| `probe-hit`, `probe-miss-covered`, `probe-tolerated`, `page-hot-256/512`, `page-sparse`, `declare`, `u4-upgrade` | — | — | **0** | never touch a lane |
| hook, `remove` (whiteout rebind of a hook-set position) — hook frame self gas | 98,497 | 144,500 | **+46,003** | locator: `Word:k10` 14 → 15, `Word:k8` 7 → 18, `BindingKey` 2 → 14 |
| hook, `restore` — hook frame self gas | 89,739 | 135,737 | +45,998 | |
| hook, direct one-step rebind (field change) — hook frame self gas | 126,944 | 172,925 | +45,981 | `Word:k10` 11 → 12, `Word:k8` 4 → 15, `BindingKey` 0 → 12 |
| hook, rebind of an unbackfilled pre-`d` position — hook frame self gas | 123,485 | 169,466 | +45,981 | |
| hook, placement (first binding; no locator) — hook frame self gas | 65,858 / 48,758 (fresh / warm word) | 65,858 / 48,758 | **0** | the +2,807 receipt delta is the kernel library (see `mode0-fresh`) |

So at N = 1,000 the **reverse locator costs ≈ 69k in mode 1 against ≈ 23k in
mode 0** (11 probes × 3 cold reads vs × 1), and every log N derivation pays
the same 3×. Compared with the −25,041 per backfilled entry this is the honest
trade: K10 pays back after two backfilled entries per rebind. An alternative
that avoids the two extra reads per probe would need a key → key-ordinal (or
key → position) map the Store does not have (a `BindingRow` is `{meta,
target}`); a caller-supplied position verified against the lane (§11a's other
option) would cost one lane read + one `bindingKeys[k]` read and was not
implemented.

#### 9.4.3 Codex's hydrated kind-10 reader at N = 1,000 (MEASURED, `environment.json → hydratedPageProbe`)

`pagePostingsHydrated(0, 10, 0, bigScope, {0, maxItems, 0})` as an `eth_call`
with the transaction ceiling, mode 1: **256 items → reverts with empty data
(`eth_estimateGas` reverts too, i.e. out of gas under 16,777,216)**; 64 items
→ 4,790,387; 16 items → 1,342,119, so ≈ **71,800 gas per hydrated item**
(the K10 hydration recovers the admission through kind 8 — key inventory,
binding head, history head + word — then hydrates the occurrence). This is
what crashed the first mode-1 attempt: the lab's oracle had been switched to
the hydrated page for mode 1 and asked for 256 items. The oracle now uses the
raw page (512 lanes), `bindingKeyAt(lane)`, `readHistory(key, 1, 1)` (kind 8)
→ occurrence → BindingSet record → recomputed key (must equal the inventory's)
→ head → target, and no longer depends on that reader. Whether the mode-0
hydrated page fits at 256 items on the same scope is probed by the N = 10,000
mode-0 run (§9.5).

#### 9.4.4 Two mode-0 controls agree (`compare.mjs --a n1000-mode0 --b n1000-mode0-fresh`)

Backfill per entry 56,425 in both, identical SLOAD decomposition, identical
chunk receipts and cap (273 / 288), identical probes, pages, declare, coverage
init and sparse arm. The only deltas: +2,747–2,783 per placement receipt
(the K10 kernel library's `scopeLayout` read inside admission) and −2,000 hook
frame self gas on every rebind (the hook's own `scopeLayout` read is warm in
the fresh world because the kernel read it first). The layout, not the
library, is what §9.4.1–9.4.2 measure.

Artifacts: `evidence/n1000-mode0/`, `evidence/n1000-mode1/`,
`evidence/n1000-mode0-fresh/` (each: per-op `receipt.json` / `tx.json` /
`prestate-diff.json` / `storage-ops.json` / `analysis.json` / `trace.json.gz`
(local), plus `environment.json`, `summary.json`, `tables.md`, `index.json`
with sha256 of every file).

**Provenance note (after review).** The three 1k runs were captured
22:39–22:54 local, before the last edits to `scripts/measure.mjs` (23:11,
phase-C re-hosting flags) and, for `n1000-mode0`, before the oracle rewrite in
`scripts/lab-fixture.mjs` (22:50); their `environment.json → rehosts[]` lack
the `extraArgs` field the current script writes. No on-chain number is
affected (the edits touch the population node's flags and the JS oracle), but
§7's commands do not reproduce those artifacts byte-for-byte; a re-run with the
committed scripts would. Likewise the hook deltas in §9.4.2 (+45,981…+46,003)
are mode 1 − mode 0 *across kernel libraries*; the library alone is −2,000
hook self gas on rebinds (§9.4.4), so the layout-only locator premium is
≈ +48k per rebind at N = 1,000.

### 9.5 N = 10,000

**First attempt failed at 3,400 placements — an anvil scaling finding, not a
lab one.** `measure.mjs --n 10000 … --no-finish` populated 200 placements in
7 s, then slowed linearly: 95 ms each by 1,000, 135 by 2,000, 230 by 3,000,
290 by 3,200 (OBSERVED from the run console; log not retained), until one receipt exceeded the
foundation runner's 7.5 s wait (`bounded receipt wait`, 439 s in). Per-block
time growing linearly with the number of storage slots already written means
anvil does O(state) work per mined block: it keeps a historical state
snapshot per block (a clone of the in-memory state) and, past its in-memory
limit, serialises old snapshots to disk — the multi-second stalls. The
round-1 "≈ 8 minutes" for 10k was ESTIMATED from the 1,000-placement rate
and was wrong for that reason. Fix in `measure.mjs`: the population re-host
(phase C, untraced, never reads history) now starts anvil with
`--prune-history`, and the population loop uses a 120 s receipt wait; the
traced phases B/D keep the default (their `prevBlock` storage reads need
one block of history). With pruning the curve flattens but does not
disappear (35 → 60 ms per placement by 1,400: OBSERVED, console only; the remaining linear
term is presumably the per-block state root over the Core account's storage).

**Second attempt (`n10000-mode0`, `--no-finish`): population complete, the
traced phase died at its 13th traced transaction.** Receipts and traces are
MEASURED from the retained files in `evidence/n10000-mode0/`; wall-clock,
dump-size and swap figures below are OBSERVED from the run console, which was
not retained (no `environment.json` / `summary.json` exist for this run) (25 op directories with
`receipt.json` / `tx.json` / `prestate-diff.json` / `storage-ops.json` /
`trace.json.gz`; phase B has `analysis.json`, phase D does not — `analyze()`
runs at the end and never ran; `index.json` lists the files with sha256; no
`summary.json` / `environment.json` / `tables.md`):

- **Population wall-clock: 10,000 placements in 1,850 s** (185 ms average;
  OBSERVED per thousand, console only: 40, 71, 103, 135, 171, 207, 236, 269, 293, 325 ms
  each — still linear growth after `--prune-history`, so ≈ 4× the 1k rate is
  what a 10k world costs to build on anvil 1.7.1). Sparse arm 64 createDirs,
  D1 dump **87.4 MiB** in 3.7 s, loaded into the tracing node in 2.4 s.
- **Backfill per entry at N = 10,000 = at N = 1,000.** `backfill-32` /
  `-64` / `-128` receipts 1,916,300 / 3,660,673 / 7,271,847 (1k: 1,916,312 /
  3,660,685 / 7,271,859 — 12 gas of calldata difference; execution gross
  identical to the gas: 1,893,860 / 3,638,233 / 7,249,407); 64 → 128 marginal
  **56,425 per entry**, `Word:k10` reads 32 / 64 / 128 in both runs. The walk
  has no N term, so the chunk cap is the same edge (273 landed / 288 out of gas
  at 1k) — at 10k that is ESTIMATED from identical per-entry and fixed costs,
  because `backfill-256` is the transaction whose trace request killed the node.
- **Reverse locator at N = 10,000 (the log N reads on a rebind), MEASURED
  from the retained traces with `scripts/salvage-trace.mjs`** (the script
  reproduces the 1k run's `analysis.json` hook/module frame gas and SLOAD
  counts exactly, so it is the same attribution):

| op | 1k receipt / hook self | 10k receipt / hook self | hook delta | `Word:k10` lane reads 1k → 10k |
| --- | ---: | ---: | ---: | --- |
| direct rebind, field change | 2,940,334 / 126,944 | 2,950,977 / **137,587** | **+10,643** | 11 → **14** |
| `remove` (whiteout rebind) | 5,220,400 / 98,497 | 5,232,471 / 109,200 | +10,703 | 11 → 14 (+3 on the removed-purpose scope, unchanged) |
| `restore` | 4,213,238 / 89,739 | 4,223,965 / 100,442 | +10,703 | 11 → 14 |
| rebind of an unbackfilled pre-`d` position | 2,957,689 / 123,485 | 2,966,128 / 131,888 | +8,403 | 11 → 14 |
| `coverage-init` (module self) | 100,980 / 69,552 | 111,652 / 80,236 | +10,684 (module) | 10 → 13 |
| placements (fresh / warm word), hook self | 65,858 / 48,758 | 65,858 / 48,758 | 0 | 3 → 3 (no locator) |

  ⌈log₂ 10,003⌉ = 14 probes against 11 at 1,003: **≈ 3,550 per extra probe in
  mode 0** (one cold lane read 2,100 + ≈ 1,450 of loop plumbing), so the mode-0
  locator is ≈ 49k at N = 10,000. Mode 1 at N = 10,000 was **not run**;
  ESTIMATED from the MEASURED mode-1 per-probe premium at 1k (+45,981 over 11
  probes = +4,180 per probe: two more cold reads and their plumbing) the mode-1
  locator would be ≈ 14 × 7,730 ≈ **108k** and a field-changing rebind's hook
  frame ≈ 137,587 + 14 × 4,180 ≈ **196k**.
- **Not measured at 10k**, and why: `backfill-256`, the largest chunk, the
  probes, pages, the sparse arm, the hydrated-page probe, the oracle and the
  phase-D SLOAD decomposition — the `--steps-tracing` node (which retains every
  traced transaction's step log; `backfill-256` alone is 1.16 M steps) dropped
  the connection (`fetch failed: ECONNRESET`) on the `backfill-256` trace
  request after 12 traced transactions on the 87 MiB world, with the machine's
  swap at 5.16 GB of 5.6 GB used (24 GiB RAM). The D1 dump lives only in the
  measuring process, so a retry is another ≈ 35 minutes of population with the
  same memory risk; it was not attempted tonight. Every one of those items is
  N-independent (the probe / page / walk paths read no N-dependent slot except
  the log N lane reads recovered above), so the 1k figures in §9.4 are the
  best MEASURED values for them and are labelled as 1k figures, not 10k ones.
- **`n10000-mode1` was not run** (it was chained and killed when the mode-0
  run died; ≈ 40 minutes for a result whose only N-dependent term is the
  locator estimated above).

### 9.7 Open after round 2

- Withdrawal-driven tombstones are still not hooked (§6, §8 item 2).
- Attach authority is still "anyone" (§8 item 3).
- The mode-1 walk trusts the kernel's kind-10 inventory to name keys of the
  scope (no BindingSet body is read to re-derive the scope); the mode-0 walk
  re-derives it. An in-kernel hook would not need either.
- Codex's hydrated kind-10 page at K10 does not fit a 256-item page in a
  16.7 M-gas call on a 1,000-position scope (≈ 71.8k per item, §9.4.3); the
  files reader lists directories with `pagePostingsHydrated` — worth a look
  before any K10 host is pointed at it.
- The mode-1 3-reads-per-probe comparisons (locator, coverage init, born-
  after-`d` on the miss path) are the price of having no key → position map;
  §11a's caller-supplied-position-verified-against-the-lane alternative was
  not implemented.
- N = 10,000: chunk cap, probes/pages, oracle and the mode-1 arm remain
  ESTIMATED / not run (§9.5).

### 9.6 Restore and final matrix — DONE

`Reviews/2026-09-09-files-browser-mvp/contracts/out` and `contracts/cache` were
restored with `git checkout --` before and after the final matrix run
(`git status --short Reviews/2026-09-09-files-browser-mvp/contracts` → 0
lines both times; the router build is deterministic, so the compile had
produced byte-identical output anyway). No measurement was running during
the matrix. Final run, both worlds (2026-09-11, `node --test
--test-force-exit --test-concurrency=1 test/index-layer.test.mjs`):

```
✔ FIELD_EQ family over DirectoryEntry.child — mode 0 (populated pair, legacy layout, genesis kernel library): declare after data, delayed backfill, convergence, coverage, detach (6723.278ms)
✔ FIELD_EQ family over DirectoryEntry.child — mode 1 (fresh pair, K10 layout selected before initialize, patched kernel): declare after data, delayed backfill, convergence, coverage, detach (4503.999083ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 11368.841666
```

Nothing was committed (the lead reviews and commits).
