<!-- Index-layer deep dive strand: Architect memo: lens-scoped views -->
<!-- Provenance: produced 2026-09-10 by a research/design agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering lead's
     verification and position are in ../../index-layer-2026-09-10.md. -->

# EFS v2 index layer — lens-scoped views, verified families, crowd-paid builds

Design memo, 2026-09-10. `$V` = `/Users/james/Code/EFS/planning-fable-files-browser`, `$C` = `/Users/james/Code/EFS/contracts`. Gas is labelled QUOTED / MEASURED / ESTIMATED; two schedules are given as `today / Glamsterdam` (fresh slot 22,100 / 110,020; rewrite 5,000 / 12,100; cold SLOAD 2,100 both; EIP-7825 cap 16,777,216 — all QUOTED from the task brief).

## 0. The answer in one paragraph

Yes: indexes can be a separate layer that is declared after the fact, built in the background by strangers, sometimes out of date, and still safely relied upon — but only if the layer carries three things the v1 sort overlay half-had and EAS's `Indexer.sol` lacks entirely: (1) an on-chain **coverage frontier per column** in the scope's own ordinal units, (2) write-path coupling **from the declaration ordinal onward** so the backfill only ever has to cover the past, and (3) a read ABI that makes a bit **unreachable** unless the frontier covers it (a contract probe past the frontier reverts; the client gets a typed UNKNOWN). With those, "out of date" is not "untrustworthy" — an unsynced family is exactly as trustworthy as a synced one over the range it claims, and every surviving production system (Postgres `indisvalid`, F1 write-only, DynamoDB `CREATING`, Cassandra `IndexBuildInProgress`, Marten's high-water mark) is structurally this. Where the owner's v1 sort scheme was complex — client hints, `StaleStartIndex` races, per-lens filtering of a shared list — the complexity came from *sorting*, not from *indexing*: bitmap families over the kind-10 ordinal need no hints (derivation is deterministic), tolerate duplicate work (OR is idempotent), and are per-principal by construction. The design below has three layers with different trust: the **kernel spine** (never incomplete), **attached families** (derived from kernel state, verified on-chain, authored by nobody, crowd-buildable), and **published views** (an indexer principal's claims — sorted, ranked, cross-scope — bound under its own name and consumed under a Lens; cheap to build, expensive to trust, and the only place ZK proofs or bonded challenges buy anything). The owner's push-back instinct is right in one place: a *live sorted index* maintained on every write should not exist; sorted order is a snapshot view over a basis, verified in O(n), merged as runs.

## 1. The layers

| Layer | What | Maintained by | Complete? | Authored by | Who pays |
| --- | --- | --- | --- | --- | --- |
| **L0 spine** | admission log (global ordinal); kind-10 scope list per `(principal, purpose, subject)` giving a dense, never-reused directory-local ordinal (`$V/Reviews/2026-09-09-files-browser-mvp/indexing-and-state-2026-09-10.md:94-120`; `$V/Reviews/2026-09-05-c0-core/src/StateKernel.sol:485-491`) | kernel on every admission | always | kernel | writer |
| **L1 kernel families** | kind 5 backlink, kind 6 per-Type/definition enumeration, kind 10 scope; `alive` per scope | kernel on every admission | always, from genesis | kernel | writer |
| **L2 attached families** | predicate bitmaps `bits[familyKey][concept][word]` keyed by the source principal's scope ordinal; e.g. `mediaType`, `assert/deny` tag columns, `implied` | kernel write path **from the declaration ordinal**; historical partition built by anyone | PARTIAL until `through == liveFrom`, then complete forever (or until retired) | **nobody** — a pure function of kernel state, recomputed on-chain | declarer (attach), writers (live), anyone (backfill) |
| **L3 published views** | a derived record set (sorted run, top-N, cross-scope roll-up, full-text digest) bound under an **indexer principal** at `(VIEW, scope, viewId, chunk)`, carrying `basis` and `through` | the indexer, off-chain, at will | as claimed by the indexer | the indexer principal | the indexer |

**Reconciliation with the 2026-07-15 ruling.** The ruling's operative text is "the moment it goes on-chain via EFS, indexing is mandatory" and the rationale is "opt-in would allow on-chain-but-un-queryable 'half-presence' data" (`$V/Designs/efsv2/owner-rulings.md:59-61`). L0+L1 satisfy the letter: every admitted record is in the spine, kind 5, kind 6 and its scope, so every record is *findable* by contract and by a Graph-less client, no writer can opt out, and half-presence is impossible. What this memo narrows is the ruling's corollary "kills the 'is X indexed?' conditional": for *predicate* families (L2) the conditional returns — but as a typed state (`UNSUPPORTED` / `PARTIAL [0,through)` / `COMPLETE`), never as a silent empty. That is the same narrowing pending D-D already proposes (kind 5/6 always automatic, other families declared per Type — `$V/Reviews/2026-09-09-files-browser-mvp/tag-system-2026-09-10.md:244`, `:257-276`); this memo adds the thing D-D concedes it lacks ("a Type author who leaves a list out cannot add it later without a paid pass over existing records", `:272-273`): the paid pass exists, is bounded per transaction, is crowd-payable, and carries a coverage contract. L3 is orthogonal to the ruling: a view is just another record under a principal, mandatorily indexed like everything else.

**Where the Lens applies, and where it deliberately does not.** L2 families are *not* lens-scoped — each is a column keyed by one source principal's scope ordinal; a Lens over k principals is applied at read by OR-ing k columns and taking the minimum coverage (`$V/Designs/efsv2/lens-spec.md:63`, "composite completeness = minimum over members"). Wrapping a verified derived column in a Lens would add a lookup and no trust, because the column cannot lie. L3 views *are* lens-scoped and must be: the indexer can omit, misorder, or claim a basis it did not build from, so a consumer must choose which indexer's word counts — which is exactly what a Lens is for. Contracts pin an indexer the way the consumer-tournament verdict says effectful consumers must pin (closed trusted sets; `owner-rulings.md` ruling F, 2026-07-15).

## 2. Declaration

**An attached family (L2) is a registry entry, not a record and not a Type field.** `attach(scopeKey | (typeId, subject), familyId, predicateId) → familyKey`, where `familyKey = keccak(scopeKey, familyId, generation)`. The registry stores one packed slot: `{liveFrom: u32, through: u32, retiredAt: u32, generation: u16, state: u8}` — `liveFrom = scopeCount at declaration`, `through = 0`. The write path reads the scope's attached-family bitmap (1 SLOAD, shared across families) on each admission into that scope and evaluates each family's predicate on the record already in memory. `predicateId` is a content-addressed record describing the derivation (`field`, `kind ∈ {exact, prefix-of-Type, presence}`, `conceptFn`) — deterministic and computable from record fields in bounded gas, or it cannot be an L2 family. Cost of attach: 1 fresh slot + 1 bitmap rewrite ≈ 27k / 122k, plus the predicate record if new (ESTIMATED).

**Who may attach.** Three declarers, in order of preference:
1. **The Type author, at Type creation** (D-D's proposal): the family is part of the Type's cost profile; writers accept it by choosing the Type; every scope that admits that Type maintains it from genesis, so it is never PARTIAL. This is the cheapest and should be the default for anything a contract consumer is *known* to need.
2. **The scope's own principal**, on its own scope, at any time: self-imposed per-write cost, no griefing surface, historical partition backfilled by anyone.
3. **Any principal, on any scope, with a cap** (e.g. ≤ 4 later-attached families per scope) and the scope principal's right to detach: this is the "developers found they needed new indexes later" case when the needer is not the writer. It raises every writer's cost in that scope by ≈5k / 12k per family per write, which is why it needs the cap and the detach. Recommend shipping (1)+(2) and holding (3) behind a flag — under this design a stranger who wants a predicate over someone else's scope *today* can always publish an L3 view at zero cost to the scope owner.

**Key space.** `bits[familyKey][concept][word]` where `concept = keccak(canonical value)` (media type: `keccak("image/png")`), `word = ordinal >> 8`. Set-bit semantics only — never XOR (Uniswap `tickBitmap.flipTick` is the counterexample; a replayed flip corrupts). A family with an unbounded concept space (free-text fields) allocates a word per distinct value per 256 entries; the Type author must bound it or it is not admissible as L2 (the media-library falsifier "a generic materialized key causes combinatorial writer/state growth", `$V/Designs/media-library/query-and-indexing.md:358`).

**Attach vs snapshot.** Both exist and are different objects. L2 = *attach*: "the kernel will maintain this going forward from ordinal `liveFrom`; the past is backfilled". L3 = *snapshot view*: "built at basis B, never maintained; a new basis is a new chunk". The v1 sort overlay was a hybrid that did neither cleanly (lazily advanced, never maintained by the write path, `$C/specs/07-Sort-Overlay-Architecture.md:5`).

**An L3 view is a record plus a binding.** Type `IndexView { scopeKey, viewId, basis: u32 (scope count at build), through: u32, chunkIdx: u16, payload: bytes }` bound by the indexer under `(VIEW, scopeKey, viewId, chunkIdx)`. The payload for 256 ordinals is 1 KB; as an SSTORE2-style body it costs ≈ 32,000 + 200 × 1,024 + calldata ≈ 260k to publish today (Glamsterdam code-deposit price is **not** in the quoted schedule — unverified) and ≈ 2.7k to read whole via `EXTCODECOPY` (ESTIMATED). Nobody declares an L3 view to anyone; the indexer just publishes, and readers find it through the Lens or through kind 6 ("all `IndexView` records for scope S").

## 3. Build

**Operation.** `build(familyKey, expectedFromWord: u32, words: u8) → throughWord`. Untrusted builder: supplies a range and gas, nothing else. Per word `w` in `[from, from+words)`:

1. read the kind-10 scope entries for ordinals `[256w, 256w+256)` — the posting holds the admission ordinal (`StateKernel.sol:488-490`); whether four entries pack per slot (525 gas/entry) or one (2,100) is not verified in the store layout and moves the total by ≈1.5k/entry;
2. for each ordinal, read the current binding head at that position (2,100 cold) → current record id; a position whose binding is dead sets no bit (the `alive` family already carries liveness);
3. read the predicate's field from the record body: 1–3 slots (2,100–6,300) or one `EXTCODECOPY` (≈2,700) for SSTORE2 bodies;
4. compute `word_c` for every concept `c` seen, write `bits[familyKey][c][w] = word_c` **wholesale** (not `|=` — see idempotence below), and advance `through`.

The kind-10 walk *is* the ordinal verification: the builder never asserts "position i ↔ record R"; the contract reads it. The ≈8,400-gas verification the tag system prices for *claimed* bits (`tag-system-2026-09-10.md:158-161`) is therefore not an extra line here — it is steps 1–2.

**Per-entry reads ≈ 4.7–10.5k (packed kind-10) to 6.3–12.6k (unpacked); per 256-entry word ≈ 1.2–3.3M, read-bound (>95%), unchanged under Glamsterdam. Writes per word: one fresh slot per concept present in that word — for media types typically 3–8 → 66–177k today / 330–880k Glamsterdam.** Under EIP-7825 a transaction holds **4–12 words** (1,000–3,000 entries). The vault's Path-A pricing of 13–19k per entry (onchain strand §6) is the upper bound if a family must re-verify ordinal↔record beyond the walk; for families derived directly from the binding head it does not apply. All ESTIMATED.

**Idempotence and order.** Each word is written as `f(current kernel state)`, not as a delta, so re-running a word yields the same word. Because the EVM totally orders admissions and the build in one block, there is no "base moved while I scanned" reconciliation — the InnoDB online log / MongoDB side-writes table / DBLog watermark machinery does not transfer (databases strand §4). Ordering of *chunks* is enforced the v1 way: CAS on `through` — `expectedFromWord == through` → apply; `through ≥ from+words` → silent no-op (the loser of a race succeeds cheaply); partial overlap → revert `StaleFrom` at the first check (≈25k wasted). A contiguous frontier is chosen over a per-word `built` bitmap because the reader then needs one SLOAD, not a bit test plus a frontier, and because a 10,000-entry directory is 40 words — parallelism buys nothing. (The per-word variant is in the decisions table as the reversible alternative if 1M-entry scopes appear.)

**Live partition during the build.** From the declaration on, the write path maintains bits at *every* position ≥ 0 of the scope, including historical positions the backfill has not reached: a rebind at position 17 while `through == 0` clears the old concept's bit and sets the new one. The backfill later recomputes word 0 from current heads and produces the same word. Consequence worth stating plainly: **a set bit is never a lie, at any time** — it was written either by the write path from the current record or by the backfill from the current record, and every later rebind updates it. Only a *clear* bit in the gap `[through·256, liveFrom)` is uncertain. This is why the tri-state in §4 can promote HIT to authoritative even mid-build.

**"Nobody writes into another principal's column."** The invariant is "a principal's columns are written only by an op signed by that principal or by a fold signed by a vocabulary it delegated to; anyone may pay, nobody else may author" (`tag-system-2026-09-10.md:156-158`). An L2 family is not the principal's column: it is a kernel-owned derived column *keyed by* that principal's ordinal, in the same class as `implied` ("derived, opt-in, separate", `:155`) and as v1's shared `(sortInfoUID, parent)` list (`$C/specs/07-Sort-Overlay-Architecture.md:11-13`). The builder authors nothing — it cannot change what the principal is on record as asserting, only what the kernel has *derived* from it, and a reader can always re-derive from the record. That is the ADR-0066 line (discovery may never manufacture placement, `$C/docs/adr/0066-index-discovery-only-no-folder-presence.md:28-42`) applied to v2: a build call is a discovery call. The judge's objection to booru-faithful's `backfill` ("lets a stranger alter what P's column asserts", `$V/Reviews/2026-09-09-files-browser-mvp/research-2026-09-10/tags/judge-synthesis.md:29`) does not apply because there is no `|=` of a *claimed* word — the contract computes it. Where a family *cannot* be derived on-chain in bounded gas (implication closure over an unreleased vocabulary, ranking), it is not L2; it is either the delegated signed fold graph-native describes (`…/tags/design-graph-native.md:147-155`) or an L3 view.

## 4. Watermark and trust

**State a reader needs:** the family slot `{liveFrom, through, retiredAt, generation, state}` (1 SLOAD) and `scopeCount` (1 SLOAD). Units are the scope's own ordinal — one stamp per `(scope, family)` column, never a global cursor (judge: "one basis stamp per column-set is meaningless", `judge-synthesis.md:30`; W1: heads are not cursors, `$V/Reviews/2026-07-10-fs-pass-corpus/attack-boundary-os.md:74-78`).

**Tri-state point read** for `probe(familyKey, concept, pos)`:

| Condition | Result | Meaning |
| --- | --- | --- |
| `pos ≥ scopeCount` | revert `NotAPosition` | never a zero |
| bit set | **HIT** | authoritative at any time (§3) |
| bit clear ∧ (`pos < 256·through` ∨ `pos ≥ liveFrom`) ∧ not retired | **MISS-COMPLETE** | proven absence at this basis |
| bit clear ∧ `256·through ≤ pos < liveFrom` | **MISS-BEHIND** | UNKNOWN; someone must pay to advance `through` |
| `retiredAt != 0` | HIT/MISS **as of `retiredAt`** | snapshot semantics; current-needing callers must not use it |
| family unknown | revert `Unsupported` | never confused with declared-but-empty (`$V/Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:1330-1336`) |

Two ABIs, one for each consumer class (Oracle's `enforced` vs `stale_tolerated`; Compound's `Stored`/`Current` twins): `probe(...)` **reverts** on MISS-BEHIND, MISS-retired and Unsupported — effectful contracts get only this one; `probeTolerated(...) → (Tri, bool)` returns the state for inert readers and the client. The reverting form is the antidote to the "confirms-but-unreadable" and "silent absence" classes because the bit is syntactically unreachable without the coverage check; the measured lesson on this branch is that a watermark sitting beside the value as a sibling field is ignored (`$V/Reviews/2026-09-09-files-browser-mvp/report-for-codex-2026-09-10.md:18-24`), so the SDK result is a discriminated union, not `{bit, coverage}`. Point-read cost: 4,200–6,300 (ESTIMATED).

**Enumeration** ("all PNGs in D under Lens L"): per source principal in L, per word, `alive & bits[c]` = 2 SLOADs per 256 entries → a 10,000-entry column costs ≈ 168k for the whole directory vs ≈ 65M for a spine walk (≈400×). Result is the existing `PageResult{realmBasis, highWaterOrdinal, cursor, items, coverage, completeness}` (`$V/Reviews/2026-09-05-c0-core/src/StateAuditPages.sol:14-30`) plus a coverage report `{liveFrom, through, retiredAt, generation}`; `completeness = COMPLETE` iff `through·256 ≥ liveFrom` (and not retired), else `PARTIAL` with the covered intervals `[0, 256·through) ∪ [liveFrom, count)` explicit. Composite under a Lens = minimum (`lens-spec.md:63`); a merged `ABSENT_PROVEN` needs every column COMPLETE at one basis (`$V/Designs/efsv2/disposable-mvp-profile.md:626-630`). The one-basis discipline stays (`b0-indexes.md:1345-1353`): page 1 pins `H = scopeCount`; a backfill advancing between pages only *adds* coverage over positions already final, so — unlike F4's `coverageRevision` revert (`b0-indexes.md:1958-1960`) — no cursor invalidation is needed; the client reports the coverage it had at page 1.

**Staleness pinning.** For a COMPLETE L2 family there is no staleness to pin — the kernel maintains it. Pinning applies to (a) a family still backfilling: `probe` takes no tolerance, it reverts; a contract that wants to be lenient must call `probeTolerated` and handle UNKNOWN as UNKNOWN; (b) L3 views: the view record carries `basis`; the contract checks `basis ≥ scopeCount − maxLag` (2 SLOADs + 1 record read ≈ 7k) and reverts `ViewStale` otherwise — Maker `Pot.join`'s `require(now == rho)` and Pyth's `getPriceNoOlderThan` are the deployed shapes.

**Catching up.** Nothing special happens when `through` reaches `liveFrom`: the state flips to COMPLETE and the family was already on the write path. The alternative — build first, attach when caught up — is rejected because it re-introduces the snapshot+side-log reconciliation every database needed (databases strand §2.1, §4) and because between "caught up" and "attached" a write would land unindexed. Writers pay from declaration, exactly as F1's write-only state has them do.

**Races.** Two builders on the same range: first lands, second is a silent no-op (fully behind) or reverts at its first SLOAD (partial overlap). Nothing is corrupted, because words are recomputed wholesale from state and the CAS is checked before any write. The v1 SDK already hides both outcomes ("refresh+retry / silent success, never surfaced as errors", `$V/Designs/sdk-architecture.md:626-635`).

**Trust ladder** (what "expensive to trust" means, with numbers):

| Path | Build cost per 256 entries | Trust | When |
| --- | --- | --- | --- |
| L2 on-chain recompute | 1.2–3.3M reads + 66–880k writes (ESTIMATED) | none — kernel derives | default for anything a contract acts on |
| L3 trusted indexer | ≈ 260k publish + one binding (ESTIMATED; Glamsterdam SSTORE2 unknown) | the indexer's key, under a Lens | client-tier, sorted/ranked, cross-scope |
| L3 + bonded challenge (UMA/coChain shape) | + claim slot & bond moves ≈ 60–150k, settle ≈ 30–50k | economic; dispute = one L2 word recompute (≤ 3.3M, fits one tx) | when a contract needs an L3 view but can wait a window (2 h–7 d) |
| L3 + ZK proof of derivation | ≈ 220–250k verify (Groth16, EIP-1108 QUOTED), size-independent | none | needs a keccak-MPT circuit EFS does not have; Axiom shut down, Brevis is a service, Lagrange unverifiable (onchain strand §3, §6) |

ZK removes trust exactly at L3 and could cut an L2 backfill ≈10× above ~20 entries — but it is a post-v2 option, not a dependency. A design that makes L3 views ordinary records with an explicit `basis` is what lets a proof be attached later without an ABI change.

## 5. Turn off

`detach(familyKey)`: sets `retiredAt = scopeCount`, clears the scope's attached-family bit (writers stop paying), freezes `through`. Bits are **never cleared**; readers see `retiredAt` in the same slot they must read anyway, and `probe` reverts `Retired` unless the caller passes `allowSnapshot`. Re-attaching is `generation + 1` = a new `familyKey`; the old one stays a frozen snapshot at its basis. Who may detach = who may attach (Type-level families cannot be detached under a frozen Type — a new Type version is the path; scope-level by the scope principal).

Is it scary? **Not with `retiredAt` born in the slot on day one; scary in exactly two ways otherwise.** (1) Without the flag, a family nobody wants still taxes every writer forever — Postgres's invalid index "still consume[s] update overhead" is the mild version; on-chain the tax is per write per family, with no `DROP INDEX`. (2) *Deleting* bits is the scary operation: a reader that missed the retirement stamp would read cleared bits as proven absence — the confirms-then-unreadable shape, and EIP-3529 refunds cap at gas_used/5 so it does not even pay. So: detach is in scope and cheap (one rewrite, 5k / 12.1k); deletion is out of scope, permanently. The v1 defect to design against: `getSortStaleness` returns 0 for a revoked or unknown sort (`$C/packages/hardhat/contracts/EFSSortOverlay.sol:623-624`) while the SDK documents 0 as "fully sorted" (`sdk-architecture.md:623-624`) — a retired index must read as RETIRED/UNSUPPORTED, never as complete-and-empty.

## 6. Sorts

The v1 crowd-built sort (`processItems` with `expectedStartIndex`, kernel-element check, hint validation, `StaleStartIndex`, `EFSSortOverlay.sol:205-258`) was right about three things — verify-don't-compute, contiguous CAS, kernel-validated membership — and wrong about one: it was a *live* linked list. Live sorted structures cost 68–127k per insert (task brief), never shrink (removals are no-ops, `sdk-architecture.md:566-568`), run caller-supplied comparators that can OOG (the 2026-05-31 rejection of lens-scoped overlay sorting, `$C/docs/FUTURE_WORK.md:552-566`), allocate a node per entry (110k each under Glamsterdam), and answer "sorted" only as of a staleness a separate call reports. Under the lens angle they are simply the wrong layer: **sorted order is an L3 view over a basis, verified in O(n) at publish.**

**Verified sorted run.** `publishSortedRun(scopeKey, viewId, basisCount, runIdx, ordinals[256])` (or the record-body form: the contract reads the chunk via `EXTCODECOPY`). The contract checks, per entry: the ordinal is `< basisCount` and not yet seen (a persistent `seen` bitmap over ordinals — 1 word per 256 entries, itself an L2-shaped structure), and the sort key read from the current binding head is ≥ the previous entry's key (2,100–4,200 per key read); across runs it checks `minKey(run) ≥ maxKey(run−1)` (1 slot). Completeness = `popcount(seen) == basisCount` at seal. Cost per 256 entries ≈ 0.55–1.1M reads + 22k seen word + ≈260k chunk publish (ESTIMATED) — trustless and roughly 3× cheaper than an L2 word because it reads one key, not the whole predicate path. No hints, because sortedness of a *given* sequence is checked by n−1 comparisons; hints only exist to insert into a live structure. Safe's `checkNSignatures` and Balancer's `ensureArrayIsSorted` are the deployed O(n) form (onchain strand §4).

**Trusted sorted run.** The indexer binds the same record without verification: ≈260k per chunk, consumed under a Lens. This is what the browser should use for 99% of directories.

**Basis and increments.** A run carries `basis = {scopeKey, count}`; entries placed after `count` are not in it, and a rebind after `basis` may have changed a key without the run knowing — an honest limitation the view states, and the reader can check per entry (`bindingRevision(pos) ≤ basisOrdinal`) if it cares. An increment is a new run over `[oldCount, newCount)`, not a merge: readers k-way-merge run heads (client: trivial; contract top-N: k SLOADs per step). Anyone may publish a merged run replacing two (verify: sorted, and a permutation of the union via the seen bitmaps) — the LSM shape. Rebinds within the basis: the run is stale; the indexer republishes; consumers pin `maxLag`.

## 7. Cost sharing

| Cost | Payer | Amount (ESTIMATED, today / Glamsterdam) |
| --- | --- | --- |
| attach | declarer | ≈ 27k / 122k + predicate record |
| live maintenance per write per family | writer | ≈ 5.1k / 12.5k avg (rewrite; fresh word every 256th entry per concept amortises to 86 / 430); rebind across concepts 10k / 24.2k |
| backfill per 256 entries | anyone | 1.2–3.3M reads (unchanged) + 66–880k writes |
| bounty (optional) | declarer escrows; `build` pays `msg.sender` pro rata per word advanced | 1 escrow slot + transfer per call |
| L3 publish per 256-entry chunk | indexer | ≈ 260k + binding (Glamsterdam SSTORE2 unknown) |
| contract probe | reader | 4.2–6.3k |
| enumeration per 256 entries per Lens member | reader | 4.2k |

A bounty is a keeper incentive with the Synthetix lesson attached (SIP-11: the bot "failed twice already", made permissionless): pay whoever lands first, no penalties. MEV sniping of bounties builds the index faster and is welcome.

**Can an incomplete index be exploited?**
- *Poisoning via ordinal mismatch* — impossible at L2: the contract reads the kernel, the builder supplies a range. Possible at L3: that is what the Lens, the bond, and the proof are for.
- *Front-running a backfill* — harmless: identical output, loser no-ops or reverts at its first SLOAD.
- *Stalling* — a family nobody funds stays PARTIAL; contracts pinned to it fail closed (revert), the browser falls back to a spine walk over the gap and offers to build the next chunk. This is the honest cost of "crowd-built"; the mitigation is the bounty, not a weaker read.
- *Griefing by attach* — bounded to the declarer's own scope or Type in the default; the permissionless variant needs the cap + detach.
- *The real exploit surface* is a consumer that calls `probeTolerated` and treats UNKNOWN as false — the Chainlink-without-`updatedAt` class (onchain strand §7). The API makes that a deliberate act on a differently named function, which is as far as an ABI can go.
- *Sentinel collision* (Compound Proposal 62, ~$80–90M): "0 = not tagged" vs "0 = not yet built" — solved structurally by the frontier and by `alive` (F1 in the onchain strand); a bit is meaningful only under coverage.

## 8. DX

```ts
// declare
efs.index.attach({ scope, family: 'mediaType', predicate: { field: 'mime', kind: 'exact' } })
  → { familyKey, liveFrom, state: 'BACKFILLING' }        // or { typeId } for Type-level
efs.index.publishView({ scope, view: 'byDate', basis, runs })   // L3, under my principal

// build (anyone)
efs.index.status(familyKey) → { state, through, liveFrom, count, retiredAt, wordsRemaining, gasPerWord }
efs.index.build(familyKey, { maxWords, onProgress }) → { txs, through }   // absorbs StaleFrom / already-built

// read
efs.index.probe(familyKey, concept, pos)
  → { kind: 'HIT' } | { kind: 'MISS', proven: true } | { kind: 'UNKNOWN', reason: 'BEHIND'|'RETIRED'|'UNSUPPORTED', through, liveFrom }
efs.index.enumerate(familyKey, concept, { lens, basis }) → PageResult & { coverage: Interval[], completeness }
efs.index.view(indexer, scope, 'byDate', { maxLag }) → { runs, basis } | { kind: 'STALE'|'ABSENT' }
```

```solidity
function attach(bytes32 scopeKey, bytes32 familyId, bytes32 predicateId) external returns (bytes32 familyKey);
function build(bytes32 familyKey, uint32 expectedFromWord, uint8 words) external returns (uint32 through);
function detach(bytes32 familyKey) external;
function coverage(bytes32 familyKey) external view returns (uint32 liveFrom, uint32 through, uint32 retiredAt, uint16 generation, uint32 count);
function probe(bytes32 familyKey, bytes32 concept, uint32 pos) external view returns (bool);      // reverts IndexBehind/Retired/Unsupported/NotAPosition
function probeTolerated(bytes32 familyKey, bytes32 concept, uint32 pos) external view returns (Tri, bool);
function words(bytes32 familyKey, bytes32 concept, uint32 fromWord, uint8 n) external view returns (uint256[] memory, CoverageReport memory);
```

**What is not possible, said plainly.** An index that is crowd-built *and* complete at every block *and* free: completeness at every block requires the write path, which the writer pays from declaration; the crowd only ever pays for the past. A global backfill ("every scope that contains A"): there is no scope-by-concept map, so builds are per scope (`design-graph-native.md:151`). A family over an open attester set: k columns for k principals, and no on-chain answer for unbounded k (synthesis finding 12). A retired family that stays current. A trustless L3 view without a proof or a challenge window. A predicate that needs off-chain input (ranking, full text, closure over an unreleased vocabulary) as L2. Live sorted order on-chain at any price a writer would accept.

## 9. Worked example: 10,000 files gain "by media type" six months later

Directory `D`, one placer principal `P`, scope `S = (P, DIRECTORY, D)`, `scopeCount = 10,000` (40 words). At creation the `FileEntry` Type declared no `mediaType` family. Month 6: an on-chain gallery game wants "is file at position i a PNG?" and "all videos in D".

1. **Declare.** `P` calls `attach(S, mediaType, pred{field: mime, exact})` → `familyKey`, `liveFrom = 10,000`, `through = 0`, state BACKFILLING; ≈27k / 122k. From this block every new placement by `P` into `D` sets one bit (≈5.1k / 12.5k). `P` escrows a bounty, or does not.
2. **Build, three strangers.** Alice sends `build(fk, 0, 8)`; Bob, watching the same `status`, sends `build(fk, 0, 8)` in the same block — Bob's tx sees `through == 8` and no-ops after one SLOAD. Carol sends `build(fk, 8, 12)`. Alice's next is `build(fk, 8, 8)` → reverts `StaleFrom` at the first check when Carol lands first (≈25k lost); her SDK refreshes and sends `build(fk, 20, 8)`. Five to ten transactions in total, each 8–12 words ≈ 10–16M gas; total ≈ 50–130M gas, of which >95% is reads (unchanged under Glamsterdam) and the fresh concept-words (≈40–240) are 0.9–5.3M today / 4.4–26M Glamsterdam. When `through == 40` (`≥ liveFrom/256`), state → COMPLETE. Nobody signed anything as `P`; nobody could have set a bit `P`'s records do not justify.
3. **Contract, mid-build** (`through == 20`, i.e. positions < 5,120 built). `probe(fk, png, 3,001)` → authoritative HIT/MISS. `probe(fk, png, 7,500)` with the bit clear → revert `IndexBehind(through=20, needed=30)`; with the bit *set* (the file was rebound to a PNG yesterday, after the declaration) → HIT, correctly. `probe(fk, png, 10,004)` (placed after declaration) → authoritative. The game's design choice is visible in code: it either accepts the revert (fail closed) or uses `probeTolerated` and handles UNKNOWN.
4. **Browser, mid-build.** `enumerate(fk, video, {lens: [P]})` → `PARTIAL`, coverage `[0, 5,120) ∪ [10,000, 10,004)`, 40 words attempted, 20 authoritative. The UI renders "12 videos found in the 5,124 indexed files; 4,880 files not yet indexed — [scan them now (free, ~30 s)] [build the next chunk (~12M gas)]". The scan is the read-through fallback (ENSRegistryWithFallback shape): walk `[5,120, 10,000)` of the spine via multicall `eth_call`. It never renders the 12 as "all videos".
5. **After.** `enumerate` → `COMPLETE`, 2 SLOADs per 256 entries → ≈168k for the whole directory; `probe` ≈4.2–6.3k; new placements maintain the family. If `P` later `detach`es, `retiredAt = 10,317`; the game's `probe` reverts `Retired` and the browser shows the family as a dated snapshot. If a Lens `[P, Q]` is wanted, `Q` attaches on its own scope and its column is built the same way; the Lens read is the min of two coverages.
6. **Sorted by date.** The browser's indexer persona publishes `byDate` runs at `basis = 10,317` (≈260k per 256-entry run, ≈40 runs, trusted under the user's Lens); a contract that must rank on-chain reads a *verified* run (≈0.8–1.4M per run to publish, trustless) or pins the indexer with `maxLag`.

## 10. Decisions for the owner

| # | Decision | Recommendation | Cheapest reversible default | Reversibility |
| --- | --- | --- | --- | --- |
| 1 | Keep 2026-07-15 mandatory indexing as "L0+L1 for every record"; predicate families are declared (D-D) and attachable later with coverage | **Yes** — ratify D-D with this memo's coverage contract as the missing half | kind 5/6/10 automatic; nothing else at genesis | Adding L1 families later = L2 attach from genesis-scope; removing one is Etched — so keep L1 minimal |
| 2 | Family registry slot `{liveFrom, through, retiredAt, generation, state}` per `(scope, family)` in scope-ordinal units | **Yes**, must precede `initialize()` (`$V/Reviews/2026-09-02-efs2-coherence-review-corpus/findings-ledger.md:325-329`) | one packed slot | Etched shape; the fields are the minimum any later scheme needs |
| 3 | Who may attach | Type author at creation + scope principal on own scope | ship (1)+(2) | permissionless-with-cap is additive later |
| 4 | Build = untrusted on-chain recompute, contiguous CAS, wholesale word writes | **Yes** | `build(fk, from, n≤12)` | per-word `built` bitmap can be added as `generation+1` if 1M-entry scopes appear |
| 5 | Write path maintains all positions from declaration; backfill covers only `[0, liveFrom)` | **Yes** (F1/DynamoDB shape; no side-log) | — | none needed |
| 6 | Reverting `probe` for contracts; `probeTolerated` for clients; SDK discriminated union | **Yes** — this is the anti-silent-absence line | — | additive |
| 7 | Detach with frozen bits; no deletion | **Yes**, in scope, not scary | `retiredAt` field from day one | deletion never |
| 8 | Sorts = L3 snapshot runs (trusted by default, verified O(n) option); no live sorted index | **Yes**; D-9 choice A confirmed (unruled in the vault — `$V/Designs/efsv2/human-overview.md:453-455`) | trusted runs only | verified runs and merges additive |
| 9 | Bounties | optional escrow, pay-first-lander | none at launch | additive |
| 10 | ZK / bonded challenge for L3 | defer; keep `basis` on every view record so proofs attach later | none | additive |
| 11 | Unbounded-concept families | reject at attach (Type author bounds the concept space) | — | loosen later |

## 11. Could not be found / not verified

- No owner ruling on D-9 (sorted pages) or on who pays lens-registration backfill (`indexing-and-state-2026-09-10.md:445-446`, `synthesis.md:214` remain open); this memo answers both but they are not ruled.
- No vault design of turning an index off beyond D-D's one line and F4's `retiredAtBasis` (`b0-indexes.md:1925-1931`).
- Whether kind-10 postings pack four ordinals per slot (`StateKernel.sol:488-490` shows the append, not the layout) — moves the per-entry read by ≈1.5k; and the exact walk from admission ordinal to current binding head (1–2 slots assumed).
- Glamsterdam pricing for SSTORE2/CREATE code deposit (affects every L3 publish figure); Brevis per-callback verification gas; Lagrange's operational status; any Epic/EOS source.
- `getSortedChunk*` bodies in `EFSSortOverlay.sol` were not re-read; the revoked-sort-reads-as-complete defect is from `:623-624` directly.
- The measured cost of the read-through fallback in the browser (step 4 of the example) — "free, ~30 s" is a guess at multicall throughput, not a measurement.