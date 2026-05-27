---
agent: bs-lifetime-split-deepdive-v1
date: 2026-05-26
status: raw
anchors:
  - area: contracts
  - brainstorm: 2026-05-26-bs-contract-decomposition-v1
---

# Lifetime-based contract architecture: a deep-dive on Direction 4

`bs-contract-decomposition-v1` proposed five directions for how to slice EFS's contract surface before the shape-freeze. Direction 4 — separate contracts for permanent vs. mutable state — was flagged as the most novel of the five, and the only one that makes the Glossary's permanence tiers (Etched / Durable / Ephemeral) load-bearing on-chain rather than just in agent prose. The curator's note was: "worth the design thread's serious engagement."

This brainstorm takes that mandate literally. It tries to falsify the direction by enumerating concrete failure modes, then balances against concrete wins, then compares head-to-head with Directions 1 and 2 (the two "starting position" framings the design thread will most likely engage with first).

Bottom line up front, so the reader can decide whether to keep reading: the direction holds up architecturally but its concrete migration runs into a cross-contract write problem in the qualifying-folder / contains-propagation path that is uncomfortable enough to be a genuine blocker. The win is auditability of permanence invariants. The most controversial James-decision is whether PROPERTY is permanent or mutable.

## 1. Detailed architecture

Four contracts, plus the surviving overlay:

### `EFSPermanence` (Etched tier — never upgrade)

**Owns:** ANCHOR schema, DATA schema. Their resolvers, their state, their on-chain events.

**State it holds:**
- `_parents[anchorUID] → parentAnchorUID` — the directory tree edges.
- `_children[parentUID] → anchorUID[]` — global insertion-order list per parent (for paging).
- `_childrenBySchema[parentUID][anchorSchema] → anchorUID[]` — for schema-filtered listings.
- `_anchorByNameAtParent[parentUID][nameHash] → anchorUID` — uniqueness lookup for path resolution.
- `dataByContentKey[contentHash] → dataUID` — first-DATA-wins canonical lookup.
- `_dataByAttester[attester] → dataUID[]` — who attested what.
- `_anchorMeta[anchorUID]` — the cached `(parent, attester, schema)` triple used by readers.
- A `MAX_ANCHOR_DEPTH = 32` invariant on path walks.

**ABI shape (read):**
- `resolvePath(parentUID, segments[]) → leafUID` — pure tree walk.
- `getParent(anchorUID) → parentUID`.
- `getChildren(parentUID, start, length) → anchorUID[]`.
- `getChildrenBySchema(parentUID, schemaUID, start, length) → anchorUID[]`.
- `getDataByContentHash(contentHash) → dataUID`.
- `exists(uid) → bool` — primitive for `EFSMutable` to validate references.
- `getAnchorMeta(uid) → (parent, attester, schema, createdAt)`.

**ABI shape (write):**
- `onAttest(ANCHOR | DATA)` from EAS — only entry points that mutate state.
- No `revoke`, no `clear`, no `update`. *That's the point.*

**Events:** `AnchorCreated`, `DataCreated`. No revocation events emitted from this contract.

**Why it's Etched:** every byte of state in this contract is the consequence of a non-revocable EAS attestation. There is no operation in the contract's whole ABI that mutates an existing slot. An audit of `EFSPermanence` reduces to: "show me the writes are append-only, and that path resolution is bounded." Two invariants to verify forever.

### `EFSMutable` (Durable tier — devnet proxy, mainnet permanent)

**Owns:** MIRROR, PROPERTY, PIN, TAG schemas. Their resolvers, their state, their revocation tracking. The "current state" view of EFS.

**State it holds:**
- `_isRevoked[uid] → bool` — revocation flags for MIRROR, PROPERTY, PIN, TAG, SORT_INFO.
- `_activeByAAS[definition][attester][schema] → uid[]` — the swap-and-pop active-edge index from `EdgeResolver`.
- `_activeByAASIndex[definition][attester][schema][target] → uint` — position+1 for O(1) removal.
- `_containsAttestations[anchorUID][attester] → bool` — sticky propagation flags.
- `_childrenByAttester[parentUID][attester] → anchorUID[]` — per-attester directory lists (post-propagation).
- `_qualifyingFolders[attester] → anchorUID[]` — write-time folder discovery index (ADR-0008).
- `_mirrorsByData[dataUID] → mirrorUID[]` — discovery index for retrieval.
- `_propertiesOf[targetUID] → propertyUID[]` — discovery index for metadata.
- All edition-aware aggregations.

**ABI shape (read):**
- `isRevoked(uid) → bool`.
- `getActiveTargetsByAttesterAndSchema(definition, attester, schema, start, length) → uid[]`.
- `isActivelyTagged(targetID, definition) → bool`.
- `getMirrors(dataUID, start, length) → mirrorUID[]`.
- `getPropertiesOf(targetUID, key, start, length) → propertyUID[]`.
- `getChildrenByAttester(parent, attester, start, length) → anchorUID[]`.
- `getQualifyingFolders(attester, start, length) → anchorUID[]`.
- `containsAttestations(anchorUID, attester) → bool`.

**ABI shape (write):**
- `onAttest(MIRROR | PROPERTY | PIN | TAG)` from EAS.
- `onRevoke(MIRROR | PROPERTY | PIN | TAG)` from EAS.
- Internal-only: `propagateContains`, `clearContains`, `indexQualifyingFolder`.
- Public: `indexExternalRevocation(uid)` for revocations EAS routes that bypass the resolver path (none currently, but the seam exists).

**Cross-contract dependency:** every write hook on `EFSMutable` does at least one staticcall to `EFSPermanence.exists(referencedUID)` to validate the target. A TAG that places a DATA at an Anchor staticcalls `exists(dataUID)` and `exists(anchorUID)` before recording state. A MIRROR validates `exists(dataUID)`. This is the load-bearing cross-contract coupling; section 6 returns to it.

**Why it's Durable:** edge cardinality logic (PIN/TAG split per ADR-0041), lens-scoped read rules, sort-overlay coordination, qualifying-folder semantics have all changed mid-flight. State here is the part of EFS that has been re-thought multiple times and will probably be re-thought again. Putting it behind an upgradeable proxy on devnet is the explicit pattern.

### `EFSRouter` (Ephemeral tier — redeployable, URI break each time)

**Owns:** `web3://` URI parsing, ERC-5219 entrypoint, lens-scoped mirror selection, content-type composition, SSTORE2 chunk reading.

**State:** none. Composes reads across `EFSPermanence` (for `resolvePath`), `EFSMutable` (for active-tag lookup, mirror selection, contentType lookup), and `EFSSortOverlay` (for sorted dir listings when a sort is requested).

**ABI:** `request(...)` per ERC-5219, plus convenience read helpers (`getDirectoryListing(parentUID, lenses[], start, length)`, `getFileBytes(dataUID, lenses[])`, etc.).

**Why it's Ephemeral:** zero on-chain state; the only durable consequence of redeployment is that every URL ever issued points at the prior router address. URL stability becomes a deploy-discipline issue, not a contract-architecture issue.

### `EFSSortOverlay` (Durable tier — its own boundary, unchanged from current)

**Owns:** SORT_INFO schema, per-`(sortInfoUID, parentAnchor)` linked lists, `processItems` advancement, `ISortFunc` dispatch.

**Cross-contract:** queries `EFSPermanence.getChildrenBySchema` for kernel item discovery; queries `EFSMutable.containsAttestations` for lens-scoped chunk reads.

**Why it's separate:** sort overlay is structurally different from both Permanence (it's mutable, has revocation) and Mutable (it's lazy/off-hook rather than write-hook driven). Folding it into `EFSMutable` would mean `EFSMutable` holds two very different write disciplines under one roof.

### Optional fifth: `EFSFileView`

Stateless composer over Router-style reads. Either folded into `EFSRouter` (it's already half-router) or kept separate as a "convenience contract" outside the canonical four. The lifetime-split direction doesn't have a strong opinion here; it's an Ephemeral concern either way.

---

So the **canonical set is 4** (Permanence, Mutable, Router, SortOverlay), of which **2 are schema-wired and frozen** (Permanence permanently; Mutable for devnet via proxy, permanently on mainnet) and **2 are redeployable** (Router fully, SortOverlay only via re-registration of SORT_INFO).

## 2. What's permanent, what's mutable — element-by-element classification

| State element | Schema host | Contract | Tier | Note |
|---|---|---|---|---|
| ANCHOR attestations | ANCHOR | Permanence | Etched | Non-revocable per Glossary. |
| DATA attestations | DATA | Permanence | Etched | Non-revocable per ADR-0002. |
| `dataByContentKey` | DATA | Permanence | Etched | First-attester wins, never overwritten. |
| `_parents`, `_children`, `_childrenBySchema` | ANCHOR | Permanence | Etched | Append-only by construction. |
| `_anchorByNameAtParent` | ANCHOR | Permanence | Etched | First write wins (uniqueness). |
| MIRROR attestations | MIRROR | Mutable | Durable | Revocable per spec. |
| `_mirrorsByData` index | MIRROR | Mutable | Durable | Append-only flag set, but with `_isRevoked` filter at read. |
| PROPERTY attestations | PROPERTY | Mutable | Durable | Revocable per spec. **Borderline — see §3.** |
| `_propertiesOf` index | PROPERTY | Mutable | Durable | Same shape as `_mirrorsByData`. |
| PIN attestations | PIN | Mutable | Durable | Revocable. Cardinality-1 supersession is a mutation by definition. |
| TAG attestations | TAG | Mutable | Durable | Revocable. Cardinality-N with weights. |
| `_activeByAAS` / `_activeByAASIndex` | PIN/TAG | Mutable | Durable | Swap-and-pop on revoke. |
| `_isRevoked` flags | (all revocable) | Mutable | Durable | The single source of truth for revocation state across MIRROR/PROPERTY/PIN/TAG/SORT_INFO. |
| `_containsAttestations` | derived from PIN/TAG | Mutable | Durable | Sticky on set, partial clear on remove (ADR-0010). |
| `_childrenByAttester` | derived from PIN/TAG + ANCHOR | **Split** | Durable (read) / Etched (anchor-creation writes) | **Boundary case — see §3.** |
| `_qualifyingFolders` | derived from ANCHOR writes | **Split** | Durable (write hook) / fires on Etched event | **Boundary case — see §3.** |
| SORT_INFO attestations | SORT_INFO | SortOverlay | Durable | Revocable. |
| Sort linked-list state | SORT_INFO | SortOverlay | Durable | Lazily populated by `processItems`. |
| Router URI parser | n/a | Router | Ephemeral | Pure code. |
| Lens-merge logic | n/a | Router | Ephemeral | Pure code; URL-driven. |
| Content-Type composition | n/a | Router | Ephemeral | Pure code. |
| Transport priority order | n/a | Router | Ephemeral | Pure code (per ADR-0012). |

The table makes the seam visible. About 85% of state elements classify cleanly. Two are genuinely split. One (PROPERTY) is borderline.

## 3. Boundary semantics — where things straddle

### 3a. The qualifying-folder index (ADR-0008)

Today's `EFSIndexer` fires the qualifying-folder write-time index when an ANCHOR is created. ANCHOR is Etched (lives in `EFSPermanence`), but `_qualifyingFolders` is a lens-aware aggregation (lives in `EFSMutable` by the lifetime rule). So the write goes:

```
EAS → EFSPermanence.onAttest(ANCHOR) → emits AnchorCreated
                                    ↓ (cross-contract call)
                                    EFSMutable.indexQualifyingFolder(uid, attester, parent)
```

The cross-contract call is from a resolver hook. EAS calls resolvers with limited gas and forbids reverts from breaking the attestation. The Mutable contract has to accept this write idempotently and never revert. **This is a real coupling.** It means:

- `EFSMutable` exposes a write surface (`indexQualifyingFolder`) that only `EFSPermanence` should call — but cannot be revert-guarded behind `require(msg.sender == permanence)` if Permanence is upgradeable, and cannot be revert-guarded if Mutable is upgradeable and Permanence's known address may change post-deploy. The natural solution is a constructor-immutable address pair, which forecloses upgrade independence.
- Gas in the ANCHOR write path is now `Permanence.onAttest` cost + the staticcall + Mutable's index update cost. Probably +5–8k gas per ANCHOR creation vs. today's monolithic `EFSIndexer.onAttest`.

### 3b. `_containsAttestations` propagation

The `propagateContains` logic walks up `_parents` (which lives in Permanence) and sets `_containsAttestations[ancestor][attester] = true` (which lives in Mutable). It's triggered by a TAG/PIN write (Mutable-owned schemas).

```
EAS → EFSMutable.onAttest(PIN | TAG) →  read EFSPermanence._parents (staticcall × depth)
                                     →  write EFSMutable._containsAttestations
```

The cost is one cross-contract staticcall per depth level (capped at 32 by `MAX_ANCHOR_DEPTH`). That's up to 32 staticcalls in the worst case. Even at warm-slot prices that's 32 × ~100 gas + 32 × ~2,100 staticcall overhead ≈ 70k extra gas in the worst case. Average path depth is 3–6, so realistic added cost is more like 7–15k gas per PIN/TAG write.

**Note:** the cross-contract reads are *staticcalls*, not writes — so reentrancy is not an issue. But the gas overhead is. And `_parents` is the most frequently-accessed slot in EFS by far; making it cross-contract penalizes every write that touches the tree.

### 3c. `_childrenByAttester`

This array is appended from two trigger points:
1. ANCHOR creation by an attester (Permanence-triggered).
2. PIN/TAG with `applies=true` against an ANCHOR (Mutable-triggered, via propagation).

So the same slot has two writers from two different contracts. The slot has to live in *one* contract; the lifetime rule says Mutable (because it's lens-aware). Then ANCHOR creation pays the cross-contract-call cost of writing into Mutable from Permanence.

Alternative: `_childrenByAttester` is split into two slots — one for "attester created an anchor here" (Etched) and one for "attester placed content here" (Durable). Readers union the two. This restores the lifetime rule but doubles the read cost and complicates the most common UI query.

### 3d. PROPERTY — the philosophical fault line

PROPERTY is revocable, so by the lifetime rule it goes in Mutable. But the most common PROPERTY in practice is `contentType` — written once with the DATA, never revoked, semantically permanent. Treating `contentType` as Durable when its actual lifetime is Etched feels misclassified.

Three resolution options for the design thread:

- **Hard line:** PROPERTY is Mutable because it's revocable. Done. Accept the cognitive dissonance.
- **Convention:** PROPERTY is Mutable but `contentType` (and any future reserved-key PROPERTYs) is documented as "you can revoke it but you shouldn't, and the UI will treat revocation as an error." Schema-level revocability remains; usage convention restricts it.
- **Schema split:** introduce `IMMUTABLE_PROPERTY` (non-revocable) for content-essential metadata, keep `PROPERTY` (revocable) for everything else. Lifetime classification becomes clean. But this is a real schema change with ADR consequences.

The third option is the most honest fit for the lifetime-split direction. It's also the only one that adds a new schema. The brainstorm's instinct: the lifetime-split direction *wants* the schema split, even though it's a separate ADR-sized decision.

### 3e. Revocation flags refer to entries that exist elsewhere

`_isRevoked[uid]` lives in `EFSMutable`. But the `uid` it refers to may be a SORT_INFO attestation that lives in `EFSSortOverlay`, or a PROPERTY referencing a DATA that lives in `EFSPermanence`. The flag is detached from the thing it flags. Two consequences:

- A reader has to know which contract to ask for the *attestation* (EAS directly, in practice) and which contract to ask for the *revocation flag* (always Mutable). The current EFS pattern of `indexer.isRevoked(uid)` becomes `mutable.isRevoked(uid)` — same shape, different address.
- An auditor verifying "revocation correctly removes from active indices" has to follow a cross-contract path. Acceptable but adds a hop.

## 4. Schema implications

### 4a. The split *favors* schemas where revocability matches the data's actual lifetime

PIN, TAG, MIRROR, SORT_INFO all have revocability that matches actual use: people genuinely revoke tags, remove pins, retire mirrors when they go stale, deprecate sort orders. These schemas fit Mutable cleanly.

ANCHOR, DATA fit Permanence cleanly.

PROPERTY is the misfit (see 3d).

### 4b. The split *disfavors* schemas that want to be sometimes-permanent

Any future schema where the *expectation* is "write once, never revoke" but the *capability* is "revocable for safety" gets force-classified into Mutable. Examples that might come up:
- A `VERSION_LINK` schema (this DATA supersedes that DATA) that's revocable only to undo mistakes.
- A `LICENSE` schema attaching SPDX identifiers to DATA, revocable only if the license itself was wrong.

Each such schema either becomes "Mutable but documented as etched-in-practice" (option 2 from §3d) or forces a non-revocable schema variant.

### 4c. The split *creates a new constraint*: future schemas declare lifetime in their ADR

A new schema's ADR has to answer "permanent or mutable?" before it can be wired. That's actually useful design pressure — it forces the question that today is implicit in "is this revocable?"

### 4d. The split makes one specific schema change *impossible*: making ANCHOR or DATA revocable

If someone later proposes "let's make ANCHOR revocable for moderation purposes," the lifetime-split layout says no, much more loudly than today's layout. ANCHOR's resolver lives in Permanence, whose ABI has no revoke entry point at all. Either the schema moves to Mutable (a major migration, since the bulk of the kernel state hangs off ANCHOR) or the proposal is rejected by architecture. That's a feature, not a bug — it makes the permanence guarantee real rather than convention.

### 4e. No new schemas required — but PROPERTY-split is *invited*

The direction works with the current six schemas. But it implicitly argues for splitting PROPERTY into permanent and mutable variants. That argument deserves its own ADR thread regardless of which decomposition direction wins.

## 5. Migration from current Lists-branch state

Eleven-ish contracts on the branch today, after counting stubs. The migration:

| Current contract | Disposition | Notes |
|---|---|---|
| `Indexer.sol` (legacy, generic EAS-relationship store) | Retire | Schema-blind indexer logic moves into Permanence + Mutable as needed. The "generic indexer" concept doesn't survive the lifetime split. |
| `EFSIndexer.sol` (current kernel) | **Split** | ANCHOR + DATA hooks + content-key dedup → Permanence. Edge-state hooks, contains propagation, qualifying-folders → Mutable. |
| `EFSRouter.sol` | Mostly unchanged | Stays as Router. Internal lookups re-pointed to Permanence + Mutable. |
| `EFSFileView.sol` | Fold into Router OR keep separate | No state, no schema wiring. Operator preference. |
| `EdgeResolver.sol` (PIN + TAG) | Merge into Mutable | Becomes the PIN/TAG resolver path inside Mutable. The cardinality split logic survives intact. |
| `MirrorResolver.sol` | Merge into Mutable | URI scheme allowlist + transport-ancestry check move in. |
| `PropertyResolver.sol` (no-op stub) | Merge into Mutable | Real validation logic (reserved keys, contentType sanitization per ADR-0024) is finally implemented at the resolver hook rather than in calling layer. |
| `FileResolver.sol` (stub) | Retire | Dead. |
| `BlobResolver.sol` (stub) | Retire | Dead. |
| `TopicResolver.sol` (stub) | Retire | Dead. |
| `SchemaNameIndex.sol` | Retire or move to Router | Optional helper; not load-bearing. |
| `EFSSortOverlay.sol` | Unchanged | Its own contract, its own upgrade boundary. |
| `YourContract.sol` | Retire | Scaffold-ETH leftover. |

**Net contract count:** 11 → 4 (Permanence, Mutable, Router, SortOverlay), or 5 if FileView stays separate. Comparable to Direction 5; smaller than Direction 2.

**The hard part of the migration** is splitting `EFSIndexer.sol` itself. About 60% of the file (ANCHOR/DATA hooks, dedup, path resolution, parent walks) moves wholesale to Permanence. About 30% (edge state, contains propagation, qualifying-folders, revocation flags) moves wholesale to Mutable. About 10% (the cross-cutting helpers like `getAnchorMeta`, the events) gets duplicated or moved to one side with a cross-contract read added.

The single hardest extraction is `propagateContains` and `clearContains`. They span both contracts by design. The migration has to decide whether they live in Mutable (calling Permanence for parent lookups) or in Permanence (with a write hook callable by Mutable). I think Mutable, because the *output* is Mutable state — but it's a real call.

**Schema re-registration cost:** none of the EFS schemas need to be re-registered if migration happens *before* devnet launch. After launch, every schema whose resolver moved contracts needs a new UID, which orphans every existing attestation under the old UID. Migration is effectively pre-launch-only.

## 6. Concrete failure modes — at least five

### 6a. The cross-contract write tax on the ANCHOR creation hot path

ANCHOR creation is one of the most common writes in EFS — every directory, every file name, every PROPERTY key anchor, every tag definition. Today it's one resolver hook on one contract. Under this split, it's one resolver hook on Permanence *plus* a cross-contract call into Mutable to update `_qualifyingFolders` and the contains-propagation chain.

Empirically: a folder-creation transaction today is ~50–80k gas (per the gas budgets in 03-Onchain-Indexing-Strategy.md). Adding a cross-contract call (~2,600 gas baseline per call) plus warm-slot SLOADs across the boundary plus the SSTORE inside Mutable: I'd estimate +6k to +10k gas per ANCHOR write. That's a 10–15% gas regression on the most common write in the system.

**Why this is more than an annoyance:** EFS's value prop is "credibly neutral on-chain filesystem." Gas is the user-visible cost. A 10% regression on the hot write path is a real consumer-facing cost, and the architectural justification ("lifetime separation is clean") doesn't survive contact with "users pay 10% more for every file they upload."

### 6b. The propagation depth multiplier

`MAX_ANCHOR_DEPTH = 32`. Every PIN/TAG write that needs to propagate contains walks up to 32 levels. Today, each level is a Permanence-internal SLOAD. Under the split, each level is a *cross-contract* SLOAD into Permanence's `_parents` slot.

Single-contract SLOAD: ~100 gas (warm). Cross-contract staticcall to read one slot: ~2,600 gas overhead + the SLOAD inside. A 6-deep path goes from ~600 gas worth of SLOADs to ~16k gas worth of staticcalls. Worst-case 32-deep: ~83k extra gas vs. ~3,200 gas today.

**Why this is bad:** PIN/TAG writes are the *second* most common write in the system. They're the operation a third-party SDK is most likely to wire into a "place file here" button. Every such button-press now pays the contract-boundary tax on every level of the path.

Mitigations are real but each costs something:
- Permanence exposes a batch read (`getParentsChain(uid, maxDepth) → uid[]`) so propagation costs one cross-contract call instead of N. Reduces overhead to one call worth of overhead, then Mutable iterates locally. But this means Permanence has to know about depth limits (a Mutable-layer concern).
- Mutable caches the parents chain after first read. But then revocation/staleness becomes a cross-contract cache invalidation problem.

### 6c. The PROPERTY classification dispute holds up the design thread

§3d laid out three options for PROPERTY's classification, and none of them is obviously correct. The design thread for this direction has to resolve PROPERTY's lifetime *before* the contract split can be specified. If the resolution is "split PROPERTY into two schemas," that's a separate ADR (probably ADR-0044-ish), which needs its own design discussion, which needs broad agreement on what's "essential" metadata vs "supplementary."

Concrete scenario: the design thread spends two weeks on the contract split, then discovers the PROPERTY question is unresolved, and the PROPERTY ADR takes another two weeks. The direction has a *dependency-on-a-prior-decision* that the other directions don't have.

### 6d. Auditable-permanence guarantee leaks if Mutable's ABI is anything-goes

The selling point of Permanence is "this contract has no mutation in its ABI; verify once, trust forever." But Permanence is going to need *read* helpers for Mutable — `getParent`, `getChildrenBySchema`, `getAnchorMeta`, etc. — and probably batch readers (per §6b) to avoid death-by-staticcall.

Each read helper added to Permanence's ABI is a new auditable surface. If a future agent adds a "compute the canonical content key for a DATA" helper that incorporates lens-specific logic, the helper's behavior depends on inputs the auditor would need to reason about. Permanence's surface grows beyond pure "tree + content-hash" and the audit invariants get weaker.

Concrete failure scenario: a year post-deploy, someone adds `getDeepestAnchorByCallerPath` to Permanence as a convenience for the Router. The implementation reads only Permanence state, so it's "safe." But it's now a function the auditor has to model — and if subsequent agents add similar helpers, the "two invariants" surface grows to twenty.

Mitigation: enforce by convention that Permanence's ABI is *fixed at deploy time* and never extended. Then any new read helper goes in a separate view contract (`EFSPermanenceView`?) that reads through Permanence. Architecturally clean but adds a contract.

### 6e. The lens-aware/lens-blind line moves to the wrong place

The current `EFSIndexer` is mostly lens-blind (kernel) with some lens-aware aggregations (qualifying folders, contains propagation, `_childrenByAttester`). The lens-split direction puts everything lens-aware into Mutable. But there are kernel operations that are lens-blind today and probably want to stay in Permanence — yet they're *triggered* by Mutable-schema writes:

- `dataByContentKey` is set when DATA is attested. DATA is Etched. Clean.
- `_childrenBySchema` is set when ANCHOR is attested. ANCHOR is Etched. Clean.
- BUT: what about `_referencingByAttester` (current indexer field, used by `getReferencingAttestations`)? It's a kernel index that fires on any write — including MIRROR writes (Mutable). Under the split, MIRROR's write hook (in Mutable) has to call into Permanence to update the kernel discovery index. Which is the reverse direction of the qualifying-folder problem.

So the cross-contract write goes *both directions* — Permanence calls Mutable for qualifying-folders; Mutable calls Permanence for discovery indices. Now you have bidirectional contract coupling, which means upgrade independence is mostly fictitious: a change to either contract's interface can break the other.

### 6f. Sort overlay's awkward position becomes worse

`EFSSortOverlay` reads from both Permanence (kernel item discovery) and Mutable (lens filtering). It's already split between two contracts under the lifetime layout. Adding sort-overlay-shaped operations to either Permanence (sort-context kernel item access) or Mutable (lens-aware sort-aware reads) is what happens in practice.

Worse: if a *second* overlay is added (custom-lists), the same coupling repeats. The lifetime split doesn't help overlays; it gives them two backends to talk to instead of one.

### 6g. The "PROPERTY but actually contentType" read pattern is now cross-contract for *every read*

The Router serves `web3://<router>/path/file.png`. To do that it:
1. Calls `Permanence.resolvePath` → path leaf Anchor.
2. Calls `Mutable.getActiveTargetsByAttesterAndSchema` for each lens → DATA UIDs.
3. Calls `Mutable.getPropertiesOf(dataUID, "contentType")` → contentType PROPERTY.
4. Calls `Mutable.getMirrors(dataUID)` → mirror list.
5. Picks best mirror, fetches bytes.

That's already 4 cross-contract calls (1 to Permanence, 3 to Mutable) on the read hot path. Under today's monolithic `EFSIndexer`, steps 2–4 are calls into the same contract. The split adds maybe ~5k gas to every read, which is mostly hidden in eth_call (it's not a transaction) but still material for `web3://` gateways that serve heavy traffic.

## 7. Concrete wins — at least three

### 7a. The permanence guarantee becomes mechanically verifiable

This is the headline win and it's real. Under the current `EFSIndexer`, "ANCHOR is non-revocable" is a property of the schema definition and the absence of an `onRevoke` for ANCHOR. To verify the guarantee holds, an auditor reads the resolver code, follows what `onAttest` does, follows what `onRevoke` would do for adjacent schemas, and confirms no path lets ANCHOR be retracted.

Under the lifetime split, `EFSPermanence` has *no mutation primitives at all*. The audit reduces to: read the ABI, confirm there is no function whose effect is to remove state, confirm append-only writes are bounded. The auditor can be confident in the permanence guarantee without modeling the rest of EFS.

This matters disproportionately for "credibly neutral protocol" positioning. Direction 2 (status quo) can claim non-revocability of ANCHOR/DATA; only Direction 4 can claim it *mechanically*. For protocols competing on neutrality (Arweave, Filecoin, etc., positioning), this is a real differentiator.

### 7b. The `wasEverTrue` vs. `isCurrentlyTrue` query split mirrors the contract split

An SDK has two natural query shapes:
- "Did Alice ever place this DATA at this path?" — historical, append-only.
- "Is Alice currently placing this DATA at this path?" — current state, revocation-sensitive.

Under the lifetime split, the historical query goes to Permanence (or to EAS directly, since the attestation exists regardless) and the current-state query goes to Mutable. These are *different contracts* the SDK calls, which makes the semantic difference physically visible at the API surface.

Compared to the current layout where both queries go to `EFSIndexer` with different functions: the split version is harder to confuse. An SDK author writing a "was this ever true?" check cannot accidentally call the "is this currently true?" function, because the contract addresses are different. This catches a real class of bug.

(Other directions don't have this affordance. Direction 1's `EFSIndexer` is purely append-only but doesn't have a corresponding "current state" contract to contrast with. Direction 2's `EFSIndexer` mixes both.)

### 7c. Devnet upgrade ceremony has a natural scope boundary

The current open Tier-2 question (QUESTIONS.md) is which proxy pattern to use for devnet upgradeability. Under any single-monolith layout (Direction 3) or any "split by concern" layout (Directions 1, 2, 5), the upgrade ceremony has to consider every schema's resolver at once — proxying the whole indexer affects everything.

Under the lifetime split, Permanence is *defined as* the contract that doesn't upgrade. Mutable is *defined as* the contract that does. The devnet ceremony only ever touches Mutable. Permanence is deployed once and forgotten. The proxy-pattern decision becomes "for Mutable, what proxy pattern" rather than "for the whole kernel, what proxy pattern," which is a smaller and less risky question.

Concrete payoff: if TransparentUpgradeableProxy adds ~2,600 gas per call, that cost is paid only on Mutable's calls. Permanence reads stay direct (no proxy overhead). Net gas impact of devnet upgradeability is roughly halved.

### 7d. A new contributor can read Permanence in an afternoon

Permanence holds the most fundamental data in EFS, but its surface is the smallest of the four contracts. A new contributor (or auditor, or third-party SDK author) can read all of Permanence's code in an afternoon and feel they understand it. The complex stuff lives in Mutable, but Mutable's complexity is *bounded* — it never has to be the foundation; it's always the layer above.

This is a real pedagogical win. The other directions all have a large "foundation" contract that's also the most complex contract (current `EFSIndexer`, Direction 1's `EFSGraph`, Direction 3's `EFSKernel`). Direction 4 is the only one where the foundation is genuinely small.

### 7e. Selective upgrade of complex semantics doesn't risk the foundation

The history of EFS has multiple cases where the design of edge cardinality, lens scoping, or sort overlay was re-thought *after* initial deploy. ADR-0041 (PIN/TAG split) is the most recent example. Under the lifetime split, any future "we got X wrong" iteration touches only Mutable. The Permanence contract — the part holding actual user data — is unaffected.

This is structurally different from Direction 1, where re-thinking edge cardinality means upgrading `EFSGraph` which also holds the qualifying-folder index that's tied to ANCHOR semantics. Lifetime split puts the high-churn logic in a separate contract from the low-churn data.

## 8. Head-to-head comparison

### 8a. vs. Direction 1 (James's 3-contract: Indexer + Graph + Data)

| Dimension | Direction 1 | Direction 4 |
|---|---|---|
| Contract count | 3 | 4 (5 with FileView separate) |
| Permanence guarantee | Implicit (in schema config) | Mechanical (in contract ABI) |
| Schema-wired contracts | 2 (Indexer + Graph) | 2 (Permanence + Mutable) |
| Cross-contract writes on ANCHOR hot path | None (single Indexer) | 1 (Permanence → Mutable) |
| Cross-contract reads on directory listing | 2 hops (Indexer → Graph → Data) | 2 hops (Permanence → Mutable + Router compose) |
| Pitch line | "Three contracts: indexer, graph, data" | "Two contracts: the permanent record, and the mutable view on top" |
| Devnet upgrade scope | Whatever proxy strategy, applied across 3 | Applied to Mutable only |
| Risk of single-contract bytecode-size blowup | Graph is large | Mutable is large; Permanence small |
| Boundary clarity | Edge cardinality vs. tree vs. data — three lines | Permanence vs. mutability — one line |
| Where edge state lives | `EFSGraph` | `EFSMutable` |
| Where the SDK author looks for "current truth" | `EFSGraph` (mostly) + `EFSData` (for content) | `EFSMutable` (one address) |
| What breaks if you got the lines wrong | "graph" and "data" are both schema-aware and overlap; the gradient between them is fuzzy | Permanent vs. mutable is binary; less fuzzy but PROPERTY straddles |

**Head-to-head verdict:** Direction 4 is more architecturally novel and gives a stronger permanence guarantee, but Direction 1 is more contiguous to current code (you can squint and see `EFSIndexer → EFSGraph` as a relatively clean extraction). Direction 1 wins on "easier to migrate from today's branch." Direction 4 wins on "easier for an auditor to verify the protocol property that matters most."

### 8b. vs. Direction 2 (current 5+ contract reality)

| Dimension | Direction 2 | Direction 4 |
|---|---|---|
| Contract count | 5–7 (depending on FileView/stubs) | 4–5 |
| Migration cost from today | Near zero (ratify status quo) | High (split EFSIndexer in half) |
| Per-schema upgrade narrowness | Tightest in the menu — each resolver is its own contract | Wider — five schemas share Mutable |
| Pitch line | "EFS is the set of resolvers EAS calls into" — less satisfying | "EFS is what's permanent, plus what's mutable" — strong narrative |
| Auditor's job | Audit each resolver in isolation; trust integration | Audit Permanence's invariants once, then Mutable in isolation |
| Future schema additions | Add a new resolver, new contract; cost = N | Add to Mutable (if mutable) or Permanence (if permanent); cost = 0 if the schema fits the existing lifetime |
| Mainnet permanence claim | Distributed across 5–7 contracts | Concentrated in Permanence |
| Devnet upgrade complexity | Either upgrade each resolver independently (many ceremonies) or proxy all of them (large scope) | One ceremony, scoped to Mutable |
| Cross-contract calls per write | Today's: TAG resolver staticcalls Indexer; otherwise mostly local | Bidirectional Permanence ↔ Mutable; more cross-contract overhead |
| Test surface | Per-contract integration tests already exist | Major rewrite — existing test boundaries don't survive |
| Bug blast radius | Tight per schema | Wider — a Mutable bug spans MIRROR/PROPERTY/PIN/TAG |

**Head-to-head verdict:** Direction 2 has overwhelmingly better short-term economics — it's the status quo and works. Direction 4's only paths to winning over Direction 2 are: (a) the permanence guarantee matters enough to pay the migration cost, or (b) the operator burden of 5–7 contracts is meaningfully higher than 4 (debatable). The migration cost is real and one-time; the maintenance benefit is recurring but small. In a pure short-term-economics framing, Direction 2 wins. In a "what story do you tell about EFS to a credibly-neutral-protocol-friendly audience" framing, Direction 4 wins.

### 8c. Cross-cutting axis: where does the "schema-aware kernel" question land?

The curator note from the prior brainstorm said the schema-aware-vs-schema-blind kernel question is the most fundamental fork, showing up inside every direction. Direction 4's answer is: Permanence is schema-aware about ANCHOR and DATA (it has to be, to run their resolvers and maintain content-key dedup), but it knows nothing about MIRROR/PROPERTY/PIN/TAG. Mutable is schema-aware about MIRROR/PROPERTY/PIN/TAG but knows nothing about ANCHOR/DATA *as schemas* (it only references their UIDs via Permanence's `exists` call).

This is a clean answer to the kernel-schema-awareness question: each contract is schema-aware only about its own schemas. Direction 1 has the same answer with different lines drawn. Direction 2 has a messier answer (Indexer is schema-aware about anchors via qualifying-folders + DATA via dedup + transports via reserved folders).

## Closing read

The direction has a real architectural payoff (the permanence guarantee becomes mechanical) and a real architectural cost (cross-contract calls penalize hot writes). The PROPERTY classification dispute is a precondition for design-thread engagement. The migration cost from today's branch is non-trivial but pre-launch-tractable.

The direction is *worth* serious engagement — the permanence guarantee is a thing EFS as a credibly-neutral protocol benefits from — but the engagement has to honestly weigh whether the auditor's-clarity benefit is worth the gas regression on the write hot path. That's a James-level call.

---

## Controversial human design choices

### Choice: Is PROPERTY permanent or mutable?

- **Options:**
  - **A:** Keep PROPERTY revocable, put it in Mutable, accept that `contentType` is conceptually misclassified.
  - **B:** Keep PROPERTY revocable, document a convention that reserved-key PROPERTYs (`contentType`, `name`) are etched-in-practice.
  - **C:** Split PROPERTY into `IMMUTABLE_PROPERTY` (etched) and `PROPERTY` (mutable). New ADR. New schema UID.
- **Tentative read:** C, if Direction 4 is chosen. The whole point of lifetime-split is to make permanence mechanical, and convention-based etched-in-practice undermines that. C is the only option that *preserves the architectural property* of Direction 4.
- **Why controversial:** C is a real schema change with deploy/migration consequences, and the in-practice cost of "you can't revoke a contentType you set by mistake" is annoying to users. Reasonable people argue B is fine; the convention does most of the work, and audit-strictness isn't worth a new schema.

### Choice: How tightly coupled are Permanence and Mutable allowed to be?

- **Options:**
  - **A:** Loose — both contracts can be proxied independently; bidirectional staticcalls use interface ABIs and tolerate either side upgrading.
  - **B:** Tight — addresses are constructor-immutable on both sides; bidirectional staticcalls are direct; upgrading either contract requires migration of the other.
  - **C:** Asymmetric — Permanence is constructor-immutable and unfooled by Mutable upgrades; Mutable knows Permanence's address as an immutable; Mutable's address may change behind a proxy, but Permanence never reads from Mutable (only Mutable→Permanence reads are allowed).
- **Tentative read:** C. It preserves Permanence as a fixed audit target while keeping Mutable upgradeable. The cost is that Permanence cannot fire write-hooks into Mutable (so the qualifying-folder index becomes Mutable's responsibility to compute lazily on first access, not write-time-indexed). That's a real loss of write-time index efficiency but it preserves the architectural symmetry.
- **Why controversial:** C means re-architecting ADR-0008 (qualifying-folder write-time index) as a lazy index. That's a meaningful behavioral change worth its own ADR. A and B each have their own ugly properties (A is hard to verify; B means Mutable can't really upgrade independently).

### Choice: Is the qualifying-folder index worth the cross-contract write tax?

- **Options:**
  - **A:** Keep the write-time index, pay the cross-contract write cost on every ANCHOR creation (~10% gas regression).
  - **B:** Drop the write-time index, scan at read time (worse read performance, simpler writes).
  - **C:** Replace with an event-only index, recomputed off-chain by indexers (current contract is unchanged; clients rely on The Graph or equivalent).
- **Tentative read:** A, with C as a fallback if A's gas cost is unacceptable. C is the most aligned with EFS's "you can run a node and reconstruct state from events" philosophy and least disruptive to write-time gas. B is a regression on read performance that nobody asked for.
- **Why controversial:** James has historically pushed hard for on-chain indices as a core EFS property. C says "drop on-chain indexing for one specific case." That cuts against the project's identity even if it's locally optimal.

### Choice: Does SortOverlay stay separate, or fold into Mutable?

- **Options:**
  - **A:** Stays separate (per the layout above). Sort overlay is its own contract, its own upgrade boundary.
  - **B:** Folds into Mutable. SORT_INFO is revocable, so by the lifetime rule it belongs there.
- **Tentative read:** A. SortOverlay has a fundamentally different write discipline (lazy off-hook population) than the rest of Mutable (write-hook driven). Mixing them in one contract makes the contract's invariants harder to state. The lifetime rule is a guide, not an absolute.
- **Why controversial:** Inconsistency — the rule for splitting contracts is "lifetime" but here we make an exception for "write discipline." Reasonable to argue the rule should be applied strictly, or that the "lifetime" framing is too narrow and the real rule is "split on write-discipline differences too."

### Choice: PROPERTY validation enforcement point

- **Options:**
  - **A:** PROPERTY validation (reserved-key sanitization per ADR-0024) lives in Mutable's resolver hook.
  - **B:** PROPERTY validation lives in calling layers (Router, SDK, third-party clients).
- **Tentative read:** A. The lifetime split direction is the first time PROPERTY has a real resolver contract; using that resolver as the enforcement point is the natural fit.
- **Why controversial:** Strict on-chain validation reverts attestations that fail. Users who tried to set a malformed contentType get a failed transaction with no remediation. Calling-layer validation is friendlier; on-chain validation is more correct.

## Unknown questions for future brainstorms

### Question: What's the actual gas cost of the cross-contract write tax under realistic load?

- **Brainstorm shape that would answer it:** A `bs-lifetime-split-gas-model-v1` brainstorm building a concrete gas model. Take three representative write flows (ANCHOR-only, TAG-with-propagation, multiAttest of ANCHOR+DATA+TAG+MIRROR+PROPERTY) and compute total gas under the current monolithic `EFSIndexer` vs. the proposed lifetime split. Include staticcall overhead, warm-vs-cold slot costs, and proxy overhead if Mutable goes behind a proxy.
- **What it would unlock:** Either kills the direction on gas grounds (if the regression is >15%) or makes the cost concrete enough that James can make an informed trade. Without numbers, this brainstorm's "10–15% gas regression" estimate is hand-wavy.

### Question: Could a "PROPERTY split" ADR be written before contract architecture is finalized?

- **Brainstorm shape that would answer it:** A `bs-property-immutability-tiers-v1` brainstorm enumerating which PROPERTYs are essentially-permanent vs. essentially-revocable, what a reserved-keys list looks like, whether `IMMUTABLE_PROPERTY` is one schema or several, and what the migration cost is.
- **What it would unlock:** Resolves §6c (PROPERTY classification is a precondition for Direction 4's design thread). Also useful independent of decomposition direction.

### Question: Are there any other EFS state elements that should be split by lifetime *even if* we don't go with this direction?

- **Brainstorm shape that would answer it:** A `bs-state-lifetime-audit-v1` brainstorm cataloguing each state element across all current contracts and asking "is this etched, durable, or ephemeral?" — not to choose a decomposition, but to see if any cross-cutting patterns emerge. (E.g., maybe `dataByContentKey` and `_anchorByNameAtParent` are conceptually the same etched-uniqueness invariant and want a unified abstraction regardless of decomposition.)
- **What it would unlock:** Cross-cutting design pressure that improves *any* decomposition. The lifetime taxonomy might be useful even if it isn't a deployment boundary.

### Question: Does any production EFS-like protocol use lifetime-based decomposition?

- **Brainstorm shape that would answer it:** A `bs-prior-art-lifetime-split-v1` brainstorm surveying decentralized-storage and on-chain-graph protocols (Arweave bundles, Ceramic streams, Filecoin's deals vs. content addressing, EAS itself, Lens Protocol, Farcaster) for whether any of them split contracts by lifetime. If there's prior art, what worked and what didn't?
- **What it would unlock:** Either confirms novelty (and we're in unknown territory) or finds a template. Both are decision-shaping. The curator called Direction 4 "genuinely novel" and that claim deserves checking.

### Question: How does the lifetime split interact with future custom-lists architecture?

- **Brainstorm shape that would answer it:** A `bs-custom-lists-decomposition-v1` brainstorm asking specifically "if Direction 4 wins, where does custom-lists live?" — Mutable? Its own overlay? Its own contract? — and what the answer says about the lifetime split's extensibility.
- **What it would unlock:** Custom-lists is in active design and will land before the contract architecture freezes. Knowing how it fits each direction is preconditional to the architecture freeze.

## Blockers / concerns

### What's blocked: Choosing between Direction 1 and Direction 4

- **The blocker:** Without a concrete gas-cost model (per the first Unknown question), the trade between "auditability of permanence" (Direction 4) and "lower hot-path gas" (Direction 1) is unresolvable. Direction 4 might be the right call at +5% gas and the wrong call at +20%.
- **Who/what could unblock:** A `bs-lifetime-split-gas-model-v1` brainstorm. Or James saying "auditability matters more than 15% gas" or "15% gas regression is a non-starter."

### What's blocked: The PROPERTY schema's final shape

- **The blocker:** §6c — Direction 4 implicitly argues for splitting PROPERTY into immutable and mutable variants, but that's a separate ADR-sized decision that nobody has been forced to make yet. Direction 4 is the first decomposition that *forces* the question.
- **Who/what could unblock:** A dedicated PROPERTY-lifetime brainstorm or an ADR thread. Independent of decomposition direction, the question is worth answering.

### What's blocked: The qualifying-folder index design's stability

- **The blocker:** ADR-0008's write-time index assumes a single contract owns both the ANCHOR write hook and the index. Direction 4 splits them. Either the ADR needs revision (write-time index → lazy index) or the lifetime-split's tight-coupling option B from "Controversial choice 2" wins. Both are real changes.
- **Who/what could unblock:** James deciding whether write-time indexing is load-bearing. If it is, Direction 4 has to use coupling option B (less upgrade independence). If it isn't, ADR-0008 supersession is in scope.

### What's blocked: The mainnet permanence claim's audit story

- **The blocker:** ADR-0030 says mainnet is permanent (no upgrades). Direction 4 says Permanence is mechanically permanent (no mutation primitives) and Mutable is logically permanent on mainnet (no upgrade ceremony) but mechanically upgradeable on devnet. The story of "what 'permanent' means for EFS" gets more nuanced. An auditor or third-party SDK author may be confused by "two kinds of permanent."
- **Who/what could unblock:** Documentation work and a clear public statement of the layered permanence model. Probably an ADR clarifying the relationship between architectural permanence (Direction 4's Permanence contract) and operational permanence (ADR-0030's no-upgrade rule).

### What's blocked: Migration timing

- **The blocker:** Per §5, schema re-registration after launch is essentially impossible (it orphans every existing attestation under the old UID). Direction 4 requires schema re-registration if migration happens post-launch. So the deadline for picking Direction 4 is the devnet launch (April 19, 2026). After that, the migration tax is prohibitive.
- **Who/what could unblock:** James committing to a contract architecture decision before launch. Or accepting that post-launch migration is not in scope and Direction 4 must win pre-launch or never.
