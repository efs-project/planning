<!-- Index-layer deep dive strand: Architect memo: trustless recompute -->
<!-- Provenance: produced 2026-09-10 by a research/design agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering lead's
     verification and position are in ../../index-layer-2026-09-10.md. -->

# EFS v2 index layer — separate, late-declared, crowd-built, kernel-verified

Design memo, 2026-09-10. Angle: **trustless recompute**. Gas labels: MEASURED / QUOTED / ESTIMATED. Schedules: today (fresh slot 22,100, rewrite 5,000, cold SLOAD 2,100, warm 100) and Glamsterdam (fresh 110,020, rewrite 12,100, reads unchanged; EIP-8037/8038 Scheduled). Per-tx cap EIP-7825 16,777,216.

## 0. The answer in one paragraph

Yes: indexes can be a separate layer, declared six months after the data, built by strangers in chunks, and still relied on by an MMORPG contract — under one rule that inverts the v1 sort design: **attach the family to the write path first, backfill the past second.** The builder never submits a claim. The kernel derives every bit from its own admission log, kind-10 scope list, binding heads and record bodies (`Reviews/2026-09-05-c0-core/src/StateKernel.sol:485-491`), so the only thing a stranger contributes is gas and a chunk number. The watermark ("complete through ordinal N of scope S") is written by the kernel as a consequence of its own derivation, never asserted by anyone. Readers get a tri-state (HIT / MISS-and-complete / MISS-but-behind) with the coverage interval in the same return, so silent absence is unreachable. Cost: ≈2.2–4.2M gas per 256-entry chunk today, ≈2.7–4.7M under Glamsterdam (ESTIMATED, ~95% reads), so a 10,000-file directory backfills in ~14 transactions for ≈90–170M gas today / ≈110–190M Glamsterdam. The three things that made v1 sorts complex — client-computed hints, `StaleStartIndex` races, per-lens filtering of a shared list — come from *sorting*, not from *indexing*, and none of them appear here. What is **not** possible is stated in §8: nothing is both crowd-built and complete at every block for free, and a family that is never attached to the write path is never "current".

The push-back the owner invited: the v1 "possibly out of date" property is the wrong property to keep. An attached family is *never* out of date — it is complete for the live partition from the attach ordinal on, and merely *unbackfilled* over a fixed, shrinking, kernel-known historical interval. "Out of date" survives only for detached families and sorted runs, which carry a frozen basis (§5, §6). That is what makes the layer usable by contracts.

## 1. The layers

| Layer | Families | Maintained by | Completeness | Reconciles with |
|---|---|---|---|---|
| **L0 — source of truth** (kernel, every admission) | admission log (global ordinal); kind-10 scope list per (principal, purpose, subject) with directory-local ordinal; binding heads; target backlink (kind 5); definition-keyed enumeration (kind 6) | kernel, on the admission path, non-optional | never incomplete; genesis-to-head | 2026-07-15 ruling "MANDATORY automatic indexing… the moment it goes on-chain via EFS, indexing is mandatory" (`Designs/efsv2/owner-rulings.md:57-61`) — satisfied literally: every record is enumerable by definition, by target, and by scope from the block it lands |
| **L0.5 — always-on per-scope derived** | `alive[scope]` (bit per position whose head is live) | kernel, on every binding write, every scope | complete from scope genesis | tag-system's "explicit placer-maintained `alive` bitmap" (`Reviews/2026-09-09-files-browser-mvp/tag-system-2026-09-10.md:303-304`); cost ≈5,000 / 12,100 per write + one fresh word per 256 entries (ESTIMATED) |
| **L1a — Type-declared families** | bitmaps `bits[scope][declId][concept][word]` over the scope ordinal, listed in the Type definition | kernel, from the *first placement* of a record of that Type in a scope (auto-attach; the placer pays) | complete for every scope by construction (attach precedes the first record) | pending D-D "other families declared by the Type definition" (`tag-system-2026-09-10.md:244`, `:257-276`) |
| **L1b — later-declared families** | same storage shape; declared by anyone at any time as a record; attached per scope by that scope's principal | kernel from the attach ordinal on; **history built by anyone** | PARTIAL until `coveredThrough == attachedAt`, then complete; kernel reports the interval | the new piece — an amendment to D-D (§9) |
| **L2 — sorted runs / snapshots** | sorted views over a frozen basis; committed or materialised | built by anyone, verified per chunk, never maintained | frozen at `(count, block)` | v1 `efs.sorts` (`Designs/sdk-architecture.md:587-641`) recast, §6 |
| **L3 — off-chain** | ranked, full-text, global aggregates, open attester sets | The Graph / clients | — | 2026-07-15 item 15 (`owner-rulings.md:62`) |

**Who declares / attaches.** *Declare* is global and side-effect-free: anyone admits an `IndexFamilyDecl` record and pays one ordinary admission. *Attach* is the act that costs a writer gas on every future write, so it belongs to whoever pays: the scope's principal (`attach(scope, declId)`), or the Type author on behalf of writers who chose the Type (auto-attach at first placement). There is no "directory owner" in v2 — a directory is k per-principal scopes (`indexing-and-state-2026-09-10.md:113-120`), so a directory-wide index is k attaches and a Lens composes k watermarks by minimum (`Designs/efsv2/lens-spec.md:63`). A stranger can therefore declare a family on nobody's behalf and build it for anyone who attached it, but cannot make bits exist under a principal's scope key without that principal's (or their Type's) act.

**Reconciliation with the 07-15 ruling and D-D, stated once.** "Mandatory indexing" = every on-chain record is findable through L0 at the block it lands; that never had an opt-out and still does not. D-D's narrowing concerns which *predicate* families exist beyond L0; this memo keeps D-D's kind 5/6-always-on and adds the missing third case: a family can be attached *after* records exist, and the ruling's rationale ("no half-presence") is preserved because the kernel reports the unbackfilled interval instead of answering empty.

## 2. Declaration

A declaration is a **record** (immutable, content-addressed, Type `IndexFamilyDecl`), so it has an admission ordinal, a record id (`declId`), and an author. It is *not* a Type field (Stage A's "new canonical index ⇒ new Type Schema", `Designs/efsv2/core-architecture-candidate.md:319-328`, is the L1a case only) and *not* a binding under a principal (bindings are mutable; a derivation must be pinned).

```
IndexFamilyDecl {
  derivation : enum { TYPE_IS, HEAD_LIVE, FIELD_EQ, FIELD_BUCKET, IMPLIES }   // kernel catalog, pure over kernel state
  typeId     : bytes32          // records of other Types derive to "none" (sparse by declaration)
  selector   : uint16           // fixed-width field slot for FIELD_*; vocabulary release for IMPLIES
  concepts   : enum { SINGLE, BOUNDED(n ≤ 64), OPEN }   // key space of the concept dimension
  mode       : enum { ATTACHABLE, SNAPSHOT_ONLY }
}
```

- **Key space.** `bits[scope][declId][concept][wordIndex]`, bit = directory-local ordinal mod 256. `concept` is the derived value (media type, bucket, target concept). `OPEN` concept spaces (e.g. by contentHash) cost one fresh word per distinct value per 256-entry span; the catalog forbids `OPEN` for Type-declared families (writers must not be bound to unbounded per-write allocation, `tag-system-2026-09-10.md` hot-value spam concern; `Designs/efsv2/system-constitution.md:339-343`).
- **Attach ⇒ "family the kernel will maintain going forward, history to be built".** `attach(scope, declId)` writes `Coverage{attachedAt = scopeCount, coveredThrough = 0, detachedAt = ∞, epoch}` (one fresh word ≈22,100 / 110,020) and adds `declId` to the scope's attached list (≤ 8 entries, packed into the scope head that the write path already touches — ESTIMATED 5,000 / 12,100 rewrite). From this block every binding write in that scope sets/clears the family's bits. History is exactly `[0, attachedAt)` — fixed, never moving, no side-log, no reconciliation. This is F1's write-only state (Rae et al., PVLDB 2013, https://www.vldb.org/pvldb/vol6/p1045-rae.pdf) and DynamoDB's "tracks the items that are being added, deleted, or updated" during backfill (https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.OnlineOps.html, accessed 2026-09-10), and it is *simpler* on an append-only ledger than in either because admissions are totally ordered.
- **Snapshot view ⇒ attach + build + detach.** There is one build mechanism. A "built at a basis, never maintained" view is an attached family whose principal detaches it at basis `d` (§5): coverage `[0, d)`, consistent as of the detach block. A consent-free stranger snapshot (build without attach) is expressible in the same keyspace under a separate epoch and is *deferred* (§9), because its value drift is unbounded and contracts must never rely on it.

## 3. Build — the chunked backfill

```
backfill(scope, declId, uint32 chunk)            // anyone; no other inputs
```

**What the kernel reads, per ordinal i in `[chunk·256, min(chunk·256+256, attachedAt))`:**

1. kind-10 posting word for the scope → admission ordinal `a_i` (`StateKernel.sol:489`; words are packed `postingWords[key][w]`, `StateStore.sol:89`).
2. `AdmissionRow[a_i]` (2 slots, `StateStore.sol:41-44`) → binding key / position.
3. binding head → current record id and live state (`BindingFold.Head`, revision-carrying, `BindingFold.sol:22`).
4. record body fields named by `selector` (2–4 slots, or SSTORE2 `EXTCODECOPY` ≈2,700).
5. derivation → `concept` or `none`.

**What it writes:** `bits[scope][declId][concept][i/256] |= 1 << (i mod 256)` (OR, never XOR — Uniswap `tickBitmap.flipTick` is the counterexample); `done[scope][declId][chunk/256] |= 1 << (chunk mod 256)`; and, if `chunk` was the frontier, `coveredThrough` advances to the first zero bit of the `done` word (one `ctz`, one rewrite).

**Why idempotent and order-independent.** Each bit is a pure function of the *current* head at position `i`; the family is keyed by binding position, not record id (`indexing-and-state-2026-09-10.md:180-187`). Because the write hook is live from `attachedAt`, any rebind of a historical position after attach flips the delta itself: if the chunk was built before the rebind, the hook clears the old concept bit and sets the new; if after, the backfill reads the new head and sets the same bit the hook already set — OR converges either way. Unbound/tombstoned heads derive to `none` and set nothing (the hook cleared them). No ordering between chunks is needed; the `done` bitmap records which chunks exist and `coveredThrough` is its contiguous prefix. (Contrast v1 `processItems`, which needed `expectedStartIndex` because a linked list is order-dependent, `EFSSortOverlay.sol:221-227`.)

**Trust.** The builder supplies `(scope, declId, chunk)`. None of those bytes become semantic state; the only builder-chosen bit is the `done` bit, which the kernel sets only after performing the derivation. Ordinal verification (the ≈8,400 the tag memo makes mandatory, `tag-system-2026-09-10.md:158-161`) is not an extra check — it *is* the read in steps 1–3. There is nothing to poison, nothing to front-run to a different result, and no claim to dispute. This is EFS v1's own rule generalised ("fabricated UIDs rejected — validates each item against the kernel", `contracts/specs/07-Sort-Overlay-Architecture.md:289`) and TornadoTrees' `require(leafHash == deposit)` chunk fold (§5 of the on-chain strand), minus the SNARK because the source is local state.

**"Nobody writes into another principal's column" — is the builder authoring anything?** No. The chain of authorship is: P signed the records; the declaration record (content-addressed, pinned) fixes the derivation; P (or P's Type) attached it; the kernel computes the bits. The builder chooses *which chunk* and *when*. The tag-system invariant "anyone may pay, nobody else may author" (`tag-system-2026-09-10.md:156-158`) is met literally, and the judge's objection to booru-faithful — the builder chose which vocabulary edge to fold (`…/tags/judge-synthesis.md:29-30`) — cannot arise, because for `IMPLIES` the release is part of `declId`. Derived families stay in their own keyspace, never mixed into `assert` (graph-native `:147-155`). ADR-0066's line holds too: a permissionless call may make things discoverable but never manufactures placement (`contracts/docs/adr/0066-index-discovery-only-no-folder-presence.md:28-42`) — a derived bit at position `i` exists only if P's own head at `i` derives to it.

**Per-chunk gas, ESTIMATED (256 entries; 6 distinct concepts in the chunk; posting words assumed 4 × 64-bit ordinals per word):**

| Item | Today | Glamsterdam |
|---|---|---|
| scope-list words, 64 cold SLOAD | 134k | 134k |
| admission rows, 256 × 4,200 | 1.08M | 1.08M |
| binding heads, 256 × 2,100 | 538k | 538k |
| record fields, 256 × 2,700–8,400 | 0.69–2.15M | 0.69–2.15M |
| keccak/decode, 256 × ~500 | 128k | 128k |
| **reads subtotal** | **2.6–4.0M** | **2.6–4.0M** |
| concept words, first touch ×6 (fresh) | 133k | 660k |
| further bits, 250 × 100 | 25k | 25k |
| `done` bit (rewrite; fresh once per 256 chunks) | 5,000 | 12,100 |
| `coveredThrough` advance (rewrite) | 5,000 | 12,100 |
| **chunk total** | **≈2.8–4.2M** | **≈3.3–4.7M** |
| per entry, amortised | 11–16k | 13–18k |

(If posting words hold one ordinal per slot rather than four, add ≈400k per chunk on both schedules. If record bodies are SSTORE2, the low end applies.)

**EIP-7825.** `backfillMany(scope, declId, chunks[])` with ≤ 3 chunks: 8.4–12.6M today, 9.9–14.1M Glamsterdam, under 16.78M with margin for the 21k base and revert paths. Recommend `MAX_CHUNKS_PER_TX = 3` today, 2 under the Glamsterdam high estimate. Calldata is trivial (three `uint32`). A 65,536-entry scope is 256 chunks ≈ 86–128 transactions — every retroactive family is a multi-transaction crowd job by construction, which is why the `done` bitmap is not optional.

**Concurrency.** Duplicate chunk → the first thing `backfill` does is test the `done` bit and return (silent success, ≈25k wasted incl. base). Different chunks → both land. Mempool front-running → identical state, loser pays ≈25k. A `nextChunks(scope, declId, n, seed)` view hands builders a randomised undone set to reduce collisions; no locks, no claims, no state for coordination.

## 4. Watermark and trust

```
Coverage { attachedAt u64; coveredThrough u64; detachedAt u64 (∞); detachBlock u64; epoch u16; flags }
```

`coveredThrough` is written only by the kernel, only after it has itself derived every bit of every chunk below it. It is in **scope-local ordinal units**, one per `(scope, declId)` column — never a max-seen head (`Reviews/2026-07-10-fs-pass-corpus/attack-boundary-os.md:74-78`), never a global cursor (which would assert completeness for columns nobody built — the F10 failure in the on-chain strand). The live partition is `[attachedAt, min(scopeCount, detachedAt))`; the historical partition is `[0, attachedAt)`, of which `[0, coveredThrough)` plus any non-contiguous done chunks are covered.

**Point read — tri-state, no fourth silent value:**

```solidity
enum Probe { HIT, MISS_COMPLETE, MISS_BEHIND, UNSUPPORTED }
function probe(scope, declId, concept, uint64 i) view returns (Probe, Coverage);
function probeStrict(scope, declId, concept, uint64 i) view returns (bool hit);   // reverts IndexBehind / Unsupported / Detached
```
- `i ≥ detachedAt` or family not attached to scope → `UNSUPPORTED` (never confused with empty, `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:1321-1366`).
- `attachedAt ≤ i < scopeCount` → bit is authoritative → `HIT` / `MISS_COMPLETE`.
- `i < attachedAt` and chunk `i/256` done → `HIT` / `MISS_COMPLETE`; else **`MISS_BEHIND`** (`Completeness.UNKNOWN` semantics: "never grounds absence", `Designs/efsv2/system-constitution.md:207-209`).

Cold cost: coverage word 2,100 + `done` word 2,100 + bits word 2,100 = 6,300 (live-partition probes skip the `done` word: 4,200).

**Page read** returns the words plus a report, and `Completeness` is COMPLETE only if every word in the page lies in covered territory; else PARTIAL with `[0, coveredThrough)` explicit — the F4 shape (`b0-indexes.md:1975-1984`) with one machine instead of profile states. Cursors commit `(epoch, coveredThrough)` so a chunk landing between pages invalidates rather than splices (the `coverageRevision` role, `b0-indexes.md:1958-1960`).

**How a contract pins acceptable staleness.** The strict ABI takes a required coverage argument, mandatory, Maker-`Pot.join` / Pyth-`getPriceNoOlderThan` style (on-chain strand §2, §7): `pageStrict(scope, declId, concept, fromWord, n, requireCompleteThrough)` reverts unless `coveredThrough ≥ requireCompleteThrough` and `detachedAt ≥ requested range`. A contract that wants the whole directory passes `attachedAt`; a contract that only cares about entries placed after it deployed passes its own deployment-time `scopeCount` and is served correctly *during* the backfill. A stale read is still correct as of its stamp — Aave/Compound-`Stored` property — because bits below `coveredThrough` are kernel-derived and hook-maintained.

**Catching up to the head.** There is no catch-up race: the hook was attached before the first chunk was built, so the historical end never moves and live writers pay for their own bits from the attach block. "Backfill reaches `attachedAt`" is simply `coveredThrough == attachedAt`; the kernel flips `flags.COMPLETE` on the transaction that closes the last gap. Nothing about the write path changes at that moment — this is the single biggest simplification versus v1, where staleness grew with every kernel write because sorting was never on the write path (`EFSSortOverlay.sol:622-631`).

**Web client with no Graph.** Pin `blockTag`, read `Coverage` and `scopeCount` in the same call as the page, render three states, never two (`Reviews/2026-09-09-files-browser-mvp/report-for-codex-2026-09-10.md:18-40`). The SDK result type makes `rows` unreachable outside the covered range (§8).

## 5. Turn off

`detach(scope, declId)` by the scope principal (or, for Type-declared families, by nobody — writers who chose the Type accepted the cost; the escape is to stop using that Type). Writes `detachedAt = scopeCount, detachBlock = block.number` (one rewrite 5,000 / 12,100), removes the family from the scope's attached list, and the hook stops. Readers see: `[0, min(coveredThrough, detachedAt))` FROZEN as of `detachBlock`; positions `≥ detachedAt` UNSUPPORTED. Monotone, metadata-only, visible in every read — DynamoDB `DELETING` "no effect on any read or write activity" and F1 public→write-only→absent. **Not scary**, provided two rules:

1. **No resume.** Re-attaching creates a new `epoch` with its own `attachedAt` and empty coverage; the old epoch stays frozen. Otherwise the gap `[detachedAt, reattachAt)` would be silently unindexed under a COMPLETE flag — exactly the PostgreSQL 14.0–14.3 defect shape (incomplete index marked valid, https://www.postgresql.org/docs/release/14.4/, 2022-06-16).
2. **Drift is measurable or declared unbounded.** After `detachBlock`, rebinds at positions `< detachedAt` make frozen bits wrong. The kernel today keeps a per-binding-key `revision` (`BindingFold.sol:22`) but **no per-scope mutation counter** (verified: `StateKernel.sol:485-491` appends to kind-10 only on first binding). Either add `scope.mutationOrdinal` (one rewrite per rebind, 5,000 / 12,100, ESTIMATED) so a detached family and a sorted run can report `rebindsSince`, or document that FROZEN means "position-complete through `detachedAt`, values as of `detachBlock`, drift unbounded". Recommend the counter; it is the same cost class as the `alive` bit and it also serves IVM (`Reviews/2026-07-25-lens-pass-corpus/profiles-composition.md:392-397`).

**Optional deletion.** `purge(scope, declId, epoch, wordRange)` by the principal, only after detach, and only after a `PURGED` flag is set so every read returns UNSUPPORTED before any word is cleared (a zeroed word must never read as MISS_COMPLETE). Cost today: rewrite-to-zero 5,000 with 4,800 refund, but EIP-3529 caps refunds at gas_used/5, so a purge-only transaction nets ≈4,000 per word (ESTIMATED); under Glamsterdam the rewrite is 12,100 and the refund schedule under EIP-8037/8038 is not known to me — UNKNOWN. This is the only scary part, and only because of reader ordering; defer it (§9). Storage otherwise persists, as in every surveyed system (EAS never prunes; Postgres invalid indexes "still consume update overhead").

## 6. Sorts

The owner's v1 machinery is a CQRS projection with an on-chain checkpoint and per-item verification (`specs/07:5-13, 97-109`). Recast under this layer it becomes **L2 sorted runs over a frozen basis**, verify-don't-compute:

```
openRun(scope, sortDecl)                         // anyone; basis = (scopeCount, block); epoch++
submitRun(scope, sortDecl, epoch, k, uint32[] ordinals)   // k == nextChunk (CAS), |ordinals| ≤ 256
```
Per item the kernel reads the key from the source record (the same 8–17k read chain as §3 — the "recompute" is the key fetch), checks `key[j] ≤ key[j+1]` within the chunk, `lastKey[k−1] ≤ key[0]` at the boundary (stores `lastKey[k]`), and sets `seen[epoch][o]` — a set bit already present reverts `Duplicate`, an ordinal `≥ basis` reverts `OutOfBasis`. When `k · 256 ≥ basis` the run is COMPLETE: with `basis` items, no duplicates and every ordinal `< basis`, the run is a permutation by pigeonhole — membership proved in O(n) without a sort. Sequential `k` is required because the boundary check needs the predecessor; this is the one place a `StaleStartIndex`-style CAS survives, and it costs only the loser's early-exit gas.

Why the honest framing is "verify the global order, recompute the keys": sorting 256 keys in memory would be ≈10⁵ gas, negligible next to 2.6–4.0M of key reads; the builder is not saving the contract arithmetic, it is supplying the *global* order across chunks, which no single transaction can compute because it cannot read every key under the cap (on-chain strand §4; `gas-engineering-2026-09-10.md` §8.1). Hints (`leftHints/rightHints`) are gone — with a frozen basis and sequential output there is nothing to insert into.

**Two storage forms.** *Committed*: store `keccak(ordinals)` per chunk (one fresh word 22,100 / 110,020) — off-chain readers reconstruct from calldata, contracts verify a supplied chunk against the hash for ≈42/word keccak + calldata. *Materialised*: also store the ordinals (32 words at 8 × uint32 → 707k today / 3.52M Glamsterdam per chunk) for contracts needing in-tx sorted access. Per chunk, ESTIMATED: committed ≈2.7–4.1M today / ≈2.9–4.3M Glamsterdam; materialised ≈3.4–4.8M / ≈6.4–7.8M. Committed is the default.

**Basis and increments.** A run's basis is `(count, block)`; a new basis `b' > b` opens a new run over `[b, b')` only (an LSM "level"); readers k-way merge runs at the pinned basis; anyone may later submit a *compacted* run over `[0, b')` verified the same way. Drift after `block` is reported via the per-scope mutation ordinal (§5) or declared unbounded. Lens-level sorted listings over k principals stay a client (or small-k contract) merge — the "materialized winners are accelerators, never truth" line (`Reviews/2026-07-11-efsv2-lens-architecture-and-scale-review.md:1020-1035`), and D-9's assumed choice A (`Designs/efsv2/human-overview.md:453-455`, unruled).

**Why live sorted indexes stay out.** A write-maintained ordered structure costs 68–127k per insert (QUOTED in the task; rebalancing + ~depth/2 slots), paid by every writer forever, plus per-lens filtering of a shared list — the 2026-05-31 rejection (`contracts/docs/FUTURE_WORK.md:552-566`). Under Glamsterdam any per-insert fresh allocation is 110k before the structure does anything. Runs cost the reader a merge and cost writers nothing.

## 7. Cost sharing and exploitation

| Who | Pays | Amount (ESTIMATED) |
|---|---|---|
| Declarer | one record admission | ordinary admission cost; no side effects |
| Attaching principal / Type author's writers | attach + hook per write | attach ≈27k / 122k; hook per family per write 5.5–22.6k today, 12.6–110.5k Glamsterdam worst-case fresh word (amortised fresh-word ≈86 / 430 per entry); cap 8 attached families per scope |
| Builders (anyone) | backfill | 2.8–4.2M / 3.3–4.7M per 256 entries; ≈11–18k per entry |
| Readers | probes / pages | 4.2–6.3k per probe; 2,100 per word per concept + 4,200 fixed per page |

**Bounties.** Optional `fund(scope, declId, epoch)` escrow paying out per completed chunk to the transaction that lands it; front-running the bounty is harmless to correctness (state is identical) and only redistributes the reward. No claim/lock mechanism ever — locks add state, trust and a stalling vector. Defer bounties; the files browser's own "Build next chunk" button is the v2.0 payer (the Uniswap `grow()` shape: the beneficiary pays, https://raw.githubusercontent.com/Uniswap/v3-core/main/contracts/libraries/Oracle.sol).

**Exploitation review.**
- *Declaration spam*: costs the declarer; declarations have no effect until attached.
- *Attach griefing*: only the scope principal or the chosen Type can attach; `OPEN` concept spaces are barred from Type-declared families; ≤ 8 families per scope bounds write gas.
- *Stalling*: impossible — no chunk is reserved; anyone can complete any chunk at any time.
- *Front-running a backfill*: state-identical; loser pays ≈25k.
- *Poisoning via ordinal mismatch*: impossible — the kernel reads ordinals from the scope list; the builder never supplies one.
- *Exploiting incompleteness*: a strict reader cannot be fooled; a tolerant reader that ignores the report can be — the DX must make the report unignorable (§8), the measured lesson that runtime shape beats type unions beats lint (`/Users/james/.claude/projects/-Users-james-Code-EFS/memory/efs-silent-absence-is-a-shape-problem.md`).
- *Sentinel collision* (Compound Proposal 62 class): a 0 bit means "not this concept" only below `coveredThrough` or in the live partition — the tri-state encodes this; there is no bare-bit read in the ABI.
- *Thin-basis aggregates* (Inverse class): `popcount`-style counts are only offered through `pageStrict`.
- *Sorted-run key drift*: a builder cannot forge order (keys are re-read), but a run is only as current as its basis; readers see the basis.
- *State expiry*: a derived family is read-mostly state; carried forward as the open exposure it already is (`indexing-and-state-2026-09-10.md:445-452`).

## 8. DX

```ts
efs.indexes.declare({ derivation:'FIELD_EQ', typeId, selector, concepts:'BOUNDED' }) → declId
efs.indexes.attach(scope, declId)                      // signer = scope principal
efs.indexes.coverage(scope, declId) → { attachedAt, coveredThrough, chunksDone, chunksTotal, liveFrom, detachedAt?, epoch, rebindsSince? }
efs.indexes.build(scope, declId, { maxChunksPerTx: 3, onProgress }) → { chunksBuilt, txHashes, coverage }   // picks undone chunks via nextChunks; ChunkDone = silent success
efs.indexes.read(scope, declId, concept, { basis }) → IndexPage
efs.indexes.detach(scope, declId)

type IndexPage =
  | { status:'COMPLETE';    basis; ordinals: number[] }
  | { status:'PARTIAL';     basis; covered:{ ordinals:number[]; through:number }; uncovered:{ from:number; to:number } }
  | { status:'UNSUPPORTED'; reason:'not-declared'|'not-attached'|'detached'|'purged' }
```
`ordinals` does not exist on `PARTIAL` — the covered slice is reachable only by naming `covered`, so a merge cannot emit absence from a partial page. Solidity: `probe`/`page` (tolerant, return the report) and `probeStrict`/`pageStrict` (revert, take `requireCompleteThrough`) — the Compound `Stored`/`Current` twin. Effectful contracts get only the strict pair, matching the consumer-tournament verdict (`/Users/james/.claude/projects/-Users-james-Code-EFS/memory/efs-consumer-tournament-verdict.md`).

**What is NOT possible, said plainly.**
1. An index that is crowd-built *and* complete at every block *and* free: the live partition is complete because writers pay the hook; history is complete only after someone pays ≈11–18k per entry.
2. A family that was never attached being "current": the SNAPSHOT/detached forms are frozen at a basis, full stop.
3. An index over an open attester set: a Lens over k principals reads k columns and is complete only when all k are; a lens over "anyone" has no on-chain answer at any price (`indexing-and-state-2026-09-10.md:117-120`).
4. Derivations needing off-chain input (ranking, full-text, cross-vocabulary implication over releases not on-chain): not permissionlessly backfillable; proof-carrying or L3.
5. History ("media type at block B"): families index current heads only; superseded records stay resolvable by id, never in the index.
6. `MISS_COMPLETE` meaning "applicable but not X" for a sparse family: it means "not X or not of this Type"; combine with `TYPE_IS` if the distinction matters (DynamoDB's sparse-GSI caveat).
7. Measured drift for detached families and sorted runs without the per-scope mutation ordinal.
8. Storage reclamation at meaningful refund under Glamsterdam: unknown schedule; treat as never.

## Worked example — 10,000 files gain "by media type" six months later

Scope `S = (P, DIRECTORY, D)`; P placed 10,000 files (positions 0–9,999) over six months. Media types present: jpeg, png, mp4, pdf, markdown, mpeg.

1. **Declare (day 180, anyone).** Stranger A admits `IndexFamilyDecl{FIELD_EQ, FileType, selector=mediaType, BOUNDED}` → `declId M`. One record admission. Nothing happens to S.
2. **Attach (P).** `attach(S, M)` at `scopeCount = 10,000` → `Coverage{attachedAt 10,000, coveredThrough 0}`; ≈27k today / ≈122k Glamsterdam. From this block P's writes into D set media bits (≈5.5–22.6k extra per write today).
3. **Build (strangers A, B, C).** 40 chunks (chunk 39 holds 16 entries). A submits `backfillMany(S, M, [0,1,2])` ≈8.4–12.6M gas; B takes 3–5; C takes 6–8; they keep pulling from `nextChunks`. B and C both send chunk 12: B lands, C's transaction exits at the `done` test (≈25k). Chunk 39 is 16 entries ≈180–260k. Total ≈14 transactions, ≈100–165M gas today / ≈120–185M Glamsterdam; 240 concept words allocated (5.3M today / 26.4M Glamsterdam of that).
4. **Rebind during the build.** P rebinds position 5,000 (chunk 19) from png to mp4 before chunk 19 is built: the hook clears png (no-op) and sets mp4; chunk 19 later reads the mp4 head and ORs the same bit. Had chunk 19 been built first, the hook would clear png and set mp4. Either order converges.
5. **New file during the build.** P places file 10,001 at position 10,000: live partition; its bit is authoritative immediately.
6. **Contract during the build.** `Gallery.isVideo(S, 7,300)` → chunk 28. If done: `HIT`/`MISS_COMPLETE`. If not: `probeStrict` reverts `IndexBehind(S, M, coveredThrough, 7,300)` — the contract cannot act on nothing. `Gallery.countVideos(S)` with `requireCompleteThrough = 10,000` reverts until complete. A contract deployed at step 2 that only cares about later placements passes `requireCompleteThrough = 10,000` for `[10,000, …)` — wait: it passes its range start, and is served from the live partition immediately.
7. **Browser during the build.** Reads `Coverage` and the page at one `blockTag`: "By media type: built 0–6,399 of 10,000 (16 chunks left) · [Build next 3 chunks ≈ 10M gas]". Covered rows show badges; rows 6,400–9,999 show "media type not yet indexed", never "no media type"; rows ≥ 10,000 show badges.
8. **After the build.** `coveredThrough == attachedAt == 10,000`, `flags.COMPLETE`. `countVideos` = popcount over 40 words ≈ 40 × 2,100 + 4,200 ≈ 88k. If D is viewed under a Lens of three principals, three scopes must each be attached and complete; composite completeness is the minimum.
9. **Six months later, P detaches** (writes stop paying ≈5–23k per file): coverage FROZEN `[0, detachedAt)` as of `detachBlock`; probes for later positions return UNSUPPORTED; drift reported as `rebindsSince` if the mutation ordinal ships, else declared unbounded.
10. **A sorted "newest first" view** is a separate L2 run at basis `(count, block)`: 40 committed chunks ≈2.7–4.1M each; a contract needing top-N in-tx asks for the materialised form.

## 9. Decisions for the owner

| # | Decision | Recommendation | Cheapest reversible default | Cost of being wrong |
|---|---|---|---|---|
| 1 | L0 / L0.5 / L1a / L1b / L2 split | adopt | L0 + L1b machinery only; L0.5 `alive` and L1a auto-attach are small additions on the same storage | none — layers share one keyspace |
| 2 | **Attach before backfill** (hook first, history second) | adopt; this is the load-bearing rule | — | without it you rebuild v1's growing staleness and the F1/Cockroach side-log problem |
| 3 | Who declares / attaches | anyone declares (a record); scope principal attaches; Type author via Type definition at first placement; no "directory owner" | principal-attach only; Type auto-attach in the next Type-definition revision | Type auto-attach late = new Type version, fine |
| 4 | Derivation catalog (freeze-sensitive) | `TYPE_IS`, `HEAD_LIVE`, `FIELD_EQ` on fixed-width fields, `FIELD_BUCKET`; `IMPLIES` over on-chain vocabulary releases later | three entries | additive: a new derivation is a new enum value; an existing one cannot change |
| 5 | Watermark shape | `done` bitmap per 256-entry chunk + kernel-derived contiguous `coveredThrough`; never a CAS cursor for bitmaps | — | CAS serialises builders and wastes gas on races |
| 6 | Read ABI | tolerant twin returns `Coverage`; strict twin takes `requireCompleteThrough` and reverts; SDK union makes rows unreachable on PARTIAL | ship both from day one | a bare-bit getter reintroduces silent absence |
| 7 | Chunk size / tx bound | 256 entries; ≤ 3 chunks per tx today, 2 under Glamsterdam high estimate | — | tunable constants |
| 8 | Detach | yes; principal-only; monotone; re-attach = new epoch, never resume | ship with attach | not scary; resume would be |
| 9 | Purge | defer; `PURGED` flag before any clear when shipped | not in v2.0 | refund schedule unknown under Glamsterdam |
| 10 | Per-scope `mutationOrdinal` | add (one rewrite per rebind) so FROZEN and runs report drift | add now — it is Etched | without it, detached/sorted drift is "unbounded" forever |
| 11 | Consent-free stranger snapshots | defer; contracts must never read them | not in v2.0 | additive keyspace later |
| 12 | Sorted views | L2 committed runs now; materialised form on demand; live sorted structures never | committed only | materialised is additive |
| 13 | Cap attached families per scope | 8 (≤ 4 Type-declared) | 8 | constant |
| 14 | Bounties | defer; if added, pay-per-landed-chunk escrow, no locks | none | additive contract |
| 15 | Storage home | bits, `done`, `Coverage` in the kernel (so the watermark is a kernel fact); view/query contracts separate and redeployable (`Designs/media-library/query-and-indexing.md:74-77`) | — | a separate index contract would have to re-verify everything |
| 16 | **Amend D-D** | "Kinds 5/6 and `alive` always on. Other families are declared as records; the Type definition may auto-attach bounded-concept families at first placement (writers pay); any principal may attach a family to its own scope later, and anyone may pay to backfill its history; the kernel reports the covered interval; strict readers revert outside it." | — | keeps the 07-15 ruling intact; adds the case it did not cover |

**Could not be found / not verified.** No vault design for turning an index off beyond D-D's one line and F4's `retiredAtBasis` (`b0-indexes.md:1918-1932`); no owner ruling on who pays Lens-registration or later-index backfill (`indexing-and-state-2026-09-10.md:445-446`); no per-scope mutation counter in the c0-core kernel (checked `StateKernel.sol`, `BindingFold.sol`); the packing factor of kind-10 posting words (affects §3 by ≈400k per chunk); Glamsterdam's storage-clear refund rules; any deployed contract that reaches provable completeness for a later-added family without per-chunk verification or proofs (on-chain strand §5 — none exists, which is the point); Epic's internal practice (no public source).