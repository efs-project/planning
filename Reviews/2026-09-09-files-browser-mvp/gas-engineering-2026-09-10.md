# Making EFS v2 affordable on the EVM — measured engineering findings

**From:** Fable (integration-test-lead), branch `fable/2026-09-09-files-browser`
**Date:** 2026-09-10
**Status:** measurement and proposals. Nothing implemented, nothing promoted, no design frozen.

Every figure labelled MEASURED came from a real transaction on a local chain
(prestate storage diffs and `structLogs` opcode histograms) or from a public
explorer API. ESTIMATED means arithmetic. Where I was previously wrong, the
correction is stated rather than quietly dropped.

---

## 1. Two corrections to my earlier numbers

Before anything else, because other people were building on them:

- **"~98.5% of a file creation is SSTORE" was wrong.** MEASURED: SSTORE is
  **46.8%** of a tag, **47.1%** of a directory create, **46.8%** of a file
  create. That figure came from gas-schedule arithmetic, not measurement.
  *Corrected again 2026-09-10 evening (independent verification of the
  baseline):* only the tag share was measured opcode gas; the 47.1% and 46.8%
  were themselves schedule arithmetic (`fresh × 22,100 + updated × 5,000`
  over the receipt). MEASURED shares of the receipt: createDir **43.1%**,
  createFile **42.9%**, tag 46.8% first-ever / 43.2% steady
  ([gas-baseline-2026-09-10.md](gas-baseline-2026-09-10.md) §7.11).
- **"Chunk staging costs ~104k gas per 4 KiB" was wrong by ~29×.** MEASURED:
  **3,014,913 gas** for one 4 KiB chunk, 131 fresh slots, 96% SSTORE. Content
  really is stored on-chain, so my claim that "metadata costs 16× the content"
  was backwards — a 10 KiB file's chunks cost roughly the same as its metadata.

---

## 2. Where the money actually goes

Steady-state tag receipt = **2,838,264 gas** (MEASURED).

> **Correction, 2026-09-10 evening (found by the PM's review).** The
> decomposition below was measured on a *different* run — the first tag
> admitted into a scope, receipt **3,046,997** — and its components sum to
> 3,028,451: the shares are of that run (1,427,300 / 3,046,997 = 46.8%), not
> of the steady-state total. The two runs differ by the scope and posting
> heads a first tag allocates. Also, "94 distinct slots" counts *touched*
> slots, not fresh allocations; by arithmetic at most ~64 can be fresh
> (1,427,300 / 22,100), so every "all 94 fresh" extrapolation in later
> documents is an upper bound. A reconciled baseline with retained traces,
> classifying fresh / cold-rewrite / warm / restore per storage Kind, is
> being produced as [gas-baseline-2026-09-10.md](gas-baseline-2026-09-10.md);
> until it lands, read the table as the first-tag decomposition.

First-tag decomposition (receipt 3,046,997; MEASURED):

| Component | Gas | Share | Detail |
| --- | --- | --- | --- |
| SSTORE | 1,427,300 | 46.8% | 104 ops, 94 distinct slots |
| SLOAD | 653,800 | 21.5% | 778 reads over 278 distinct slots |
| EVM interpreter / ABI plumbing | ~859,963 | 28.2% | 28,903 PUSH1, 16,583 ADD, 9,124 MSTORE |
| KECCAK | 26,124 | 0.9% | 576 hashes |
| intrinsic + call bases | ~61,264 | 2.0% | |

Three structural facts follow, all MEASURED:

- **Cost scales per record, not per transaction.** ~1.42M/leaf for a 2-leaf
  tag vs ~1.28M/leaf for a 4-leaf directory create. *Corrected 2026-09-10
  evening:* comparing two different operations does not establish that
  batching saves only the intrinsic fee; the honest test is the same final
  state written as N transactions versus one batch, which has not been run.
  What this comparison does show is that per-leaf work does not shrink with
  leaf count in these two ops.
- **91% of the plumbing sits below the Core entry point**, in one
  `UpgradeAdmissionLibrary` frame that also carries all the storage work.
  `CALLDATACOPY` alone is 48,291 gas there: the publication struct being
  materialised into memory and walked.
- **Content addressing is free.** 576 hashes, 0.9%. Any proposal to weaken
  hashing or verification for performance should be refused on this evidence.

---

## 3. The comparison that should decide our appetite

MEASURED from public explorers and repos, 2026-09-10. All are "admit one small
attributed record to contract state":

| System | Operation | Gas | Slots |
| --- | --- | --- | --- |
| — | one cold 32-byte slot (spec floor) | 22,100 | 1 |
| MUD | cold single-slot record | 32,095 | 1 |
| ENS | `setText`, new key | 60,035 | 1 |
| ERC-721 | mint | 76,672 | ~3 |
| Farcaster | fid `register` | 144,429 | 3 + counter |
| Farcaster | signer key add (**enumerable set**) | 179,509 | ~4 |
| EAS | attestation, 65-byte payload | 230,409 | ~7 |
| **EFS v2** | **tag** | **2,838,264** | **94** |

The Farcaster row is the one that matters. Their `EnumerableKeySet` gives
attributed, revocable, **enumerable** keys per identity — the closest analogue
to our posting indexes — for about **four slots**. We spend **94**.

We do more than any of these: current-value bindings, pluralistic naming,
retained history. But 12× EAS and 47× ENS is not the price of those features.

---

## 4. What the cost is made of, and what it buys

An independent source audit plus my own verification established:

**Written on every leaf of every admission, and unqueryable.** The query
surface is literally `supported() { return T == 0 && ordinal == 0 && (kind == 8
|| kind == 10); }` (`StateAuditPages.sol:49-51`, verified). Posting families
**kinds 1, 2, 4, 5, 6, 7 and 9** are maintained anyway. Kind 3 is read only by
the writer itself.

**ABLATION (MEASURED).** I deleted those writes, rebuilt, and measured:

| | baseline | ablated | saving |
| --- | --- | --- | --- |
| tag (steady) | 2,838,264 | **2,257,306** | 580,958 — **20.5%, 1.26×** |
| createDir | 5,132,853 | **4,172,658** | 960,195 — **18.7%, 1.23×** |

Real, worth taking, and **not** the dominant term. I expected more; the honest
result is that there is no single fix.

**Other write-only or derivable state**, all verified:
- `batches` — 3 slots per admission; `getReceipt` is **not exposed** on the
  deployed Core, so nothing can read it.
- `FilesRouterV2.typeIds`/`purposes` — 17 constructor-only `bytes32` in
  storage; ~35,700 gas of cold SLOADs per operation that `immutable` removes.
- `s.init` — 13 Bootstrap slots guard-read and rewritten on **every**
  admission, though only `group()` ever changes them (~33,000 gas/op).
- `ExecutionSet` — 21 fields fetched by static call on every Core entry.
- Duplicated fields: `BindingRow.meta.revision`/`admissionOrdinal` duplicate the
  kind-8 posting head (and are cross-checked against it); `PostingRow.last`
  duplicates the final word entry; `PostingRow.live` equals `count` for both
  readable families; `AdmissionRow.principalOrdinal` duplicates the envelope
  header; `BatchRow.authorityCodehash` is already in the ExecutionSet. The
  admission ordinal is stored **four times**.
- Envelope prefix: four of eight slots hold values the reader asserts are
  constants (`profile == 1`, `authorityRef == 0`, `authEpoch == 0`,
  `arrayOffset == 224`).

---

## 5. Proposals, ranked by measured or estimated effect

None of these removes a property from the ledger. None needs a sixth SDK seam.

| # | Change | Effect | What it costs |
| --- | --- | --- | --- |
| 1 | Stop writing the 7 unqueryable posting families | **1.26× MEASURED** | Nothing today — they cannot be read. See decision A. |
| 2 | Router `typeIds`/`purposes` → `immutable` | ~35,700/op MEASURED-derived | Nothing. Oversight. |
| 3 | Stop rewriting + guard-reading `s.init` per admission | ~33,000/op ESTIMATED | Nothing for Files ops. |
| 4 | Drop `batches` until `getReceipt` is exposed | ~66,000/op ESTIMATED | Receipts, if we ever want them. |
| 5 | Pack `EnvelopeRow` 2→1, `BatchRow` 3→1, Authority 2→1; drop the derivable duplicates in §4 | 1.2–1.4× ESTIMATED | Schema rigidity, migration pain. |
| 6 | Stop materialising the publication in memory inside the admission library — calldata-region reads by offset, or pass leaf commitments so bodies are never copied | up to 28% in scope, ESTIMATED | Implementation only; one library, one boundary. |
| 7 | Record bodies as bytecode (SSTORE2) rather than storage slots | ~216 vs ~625–690 gas/byte QUOTED | Reads become `EXTCODECOPY` + parse, not struct access. See decision C. |
| 8 | Content-addressed dedup of identical bodies | up to 995× on a repeat, QUOTED from EthFS's own figures (5,158,527 → 5,186 is internal execution gas, not a transaction receipt; boundary differs from ours) | Needs a pointer registry. See decision B. |

Compounding 1–6 plausibly reaches **400–700k for a tag** (ESTIMATED) — within
2–3× of EAS while still providing bindings and enumeration, which EAS lacks. I
would not promise parity and I would not stop before trying.

---

## 6. Decisions I need from James

**A. Are the seven unqueryable posting families dead, or unfinished?**
They cost 1.26× and cannot be read by anything. Either the query surface was
never completed — in which case finish it and they earn their keep — or they
were speculative and should go. The code cannot tell me which was intended.
*This one blocks work; the others do not.*

**B. Do we want content-addressed dedup?** Our records already hash to their
identity. EthFS collapses a repeat write of identical 24 KB content from
5,158,527 gas to **5,186** (MEASURED) because the pointer address *is* a
function of the content. For a filesystem where identical bytes recur
constantly, this is potentially the largest lever in the system.

**C. Is bytecode-as-storage acceptable for record bodies?** It is ~3× cheaper
to write, 20–175× cheaper to read, readable on-chain via `EXTCODECOPY`, and —
because code is state — **never expired by EIP-4444**, unlike calldata, which
lives in prunable history. It satisfies both "contracts must read it" and
"must always be available" simultaneously. `EXTSLOAD` never shipped, so
`EXTCODECOPY` is the *only* primitive by which one contract reads another's
bulk data; Merkle-root-only designs genuinely fail the contract-readable rule.

---

## 7. What remains true regardless

- Content storage is honest and irreducible: 4.19 KiB of state for 4 KiB of
  data, 96% SSTORE. Its only lever is not storing bytes on-chain — the
  user-chooses-where-bytes-live decision already framed by the owner.
- On L2s, **L1 data availability is now a rounding error**: MEASURED 0.137% of
  a Base transaction, 1.5–3.1% on OP. Base's own docs still say the opposite;
  they are out of date. Execution gas is the whole game.
- The dominant industry lever is **whether a record enters state at all**
  (Farcaster's tier purchases are event-only; ENS subnames via CCIP-Read cost
  zero on L1). We should know which of our seven records per file genuinely
  need to be in state, and I do not think we have ever asked that question.

---

## 8. Merkle commitments — one decision closed, one large pattern found

An independent benchmark strand (Foundry, solc 0.8.30, prague pricing; mainnet
figures verified by `cast receipt`) settles decision **C** and adds a lever
bigger than anything in §5.

### 8.1 Root-only is ruled out by our own constraint — definitively

**No third-party contract can `view`-read a leaf given only a root in state.**
This is structural, not a missing feature. `EXTSLOAD` ([EIP-2330](https://eips.ethereum.org/EIPS/eip-2330))
was proposed precisely because *"while any off-chain application can read all
contract storage data of all contracts, this is not possible for deployed smart
contracts themselves"* — and it is **Stagnant, never shipped**. Every candidate
escape fails: `EXTCODECOPY` reads bytecode (which means you stored the whole
preimage — the opposite of root-only); `BLOBHASH` exposes a commitment, not
data; logs are unreadable even by their emitting contract; CCIP-Read can only
be driven by an off-chain client, never by another contract.

So the owner's contract-readability rule **eliminates Merkle-root-only for
metadata**, permanently. Decision C therefore narrows to a single question:
bytecode-as-storage, yes or no. Commitment-only is not on the menu.

Two corollaries worth recording:
- **Crossover:** proof-guarded writes beat direct storage only below depth ~11
  (≈2,048 leaves). Beyond that, `5,000 + 1,525d` exceeds a 22,100 direct write.
- **Verifier micro-optimisation is pointless.** Under EIP-7623 the calldata
  floor is 40 gas/non-zero byte, so proof calldata costs ~1,280 gas/level
  against ~245 of verification compute. MEASURED: from depth ≈16 upward,
  verifying and *not* verifying cost the same to the gas.

### 8.2 Keep keccak — the margin is 350–950×

| hash (2 inputs) | gas | vs keccak |
| --- | --- | --- |
| keccak256 | 42 | 1× |
| SHA-256 precompile | 72 | 1.7× |
| Poseidon2 (Huff, best case) | 14,845 | 353× |
| poseidon-solidity T3 | 21,124 | 503× |
| MiMC (Tornado, measured) | ~40,000 | ~950× |

ZK-friendly hashes only pay when the same tree is proven inside a circuit. We
have no circuit. Adopting one would be a ~500× self-inflicted cost.

### 8.3 The pattern we should steal: don't store what you can recompute

MEASURED, mainnet: the **beacon deposit contract appends to a depth-32 tree for
50,462 gas**. An equivalent keccak append that recomputes and stores the root
costs **~228,000** at the same depth — and beacon uses SHA-256, which is *more*
expensive per hash. It is **4.5× cheaper while using a dearer hash.**

The entire difference is architectural: it updates **one** frontier slot per
append and computes the root **lazily in a view function**. Tornado and
OpenZeppelin's `PushTree` instead recompute the root on every insert, paying
`depth` hashes and ~`depth/2` SSTOREs each time.

MEASURED decomposition of a depth-20 append: hashing is **0.5%** of the cost;
the rest is storage traffic. That matches our own tag measurement exactly
(hashing 0.9%). **Appending is storage-bound, and aggregates recomputed on
every write are the expensive part.**

**This applies directly to us.** Our `append()` writes a `PostingRow`
aggregate — `count`, `live`, `last`, `flags` — on *every* posting append, for
*every* key, on *every* leaf. Those are derivable from the posting words the
same read already walks (§4 notes `last` and `live` are literally cross-checked
against them today). Deferring aggregate maintenance to read time removes one
slot write per key per leaf, on top of the §5.1 removal of unread families.

I have not measured this on our code; it is the next ablation I would run. But
the beacon contract is proof that the pattern is worth 4.5× in production, and
our own numbers say we are paying exactly the cost it avoids.
