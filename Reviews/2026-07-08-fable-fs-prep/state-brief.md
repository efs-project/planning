# FS-pass state & constraints brief — the citable ground truth

**Purpose.** A tight, accurate, sourced substrate for the Fable 5 filesystem-features kickoff prompt. Every claim below is traceable to a current efsv2 doc so the prompt can be *factually* grounded (the recurring project failure is prose that sounds right but is wrong). Doc names in `[brackets]` are the ruling docs; where docs disagree the precedence is **codex-envelope > codex-kinds > codex-kernel > base texts**, and **read-lens-spec is Durable (versionable), not Etched** `[read-lens-spec §0 / freeze-gates §C]`.

Confidence markers mirror the source: `[reviewed]` survived red-team, `[ruled]` James decided, `[open]` still undecided, `[pending-James]` awaits a one-line ratification.

---

## 1. The settled base a FS pass must respect (one line each, with the doc that rules it)

- **Native kernel, not EAS** — records are chain-free EIP-712 Merkle-signed envelopes; no on-chain attestation framework underneath. `[ruled][reviewed]` `[confidence-and-open-decisions]`
- **One signature over a Merkle root authorizes an arbitrarily large write; author = recovered signer; anyone relays; per-record/per-chunk items need no own signature, verified incrementally on-chain.** Highest-confidence item in the design (`[verified-in-code]`). `[confidence-and-open-decisions]`
- **Deterministic, client-computable, chain-free IDs** (`tagId`, `dataId`, `listId`, `claimId`, `propertyId`). `[reviewed]` `[confidence-and-open-decisions]`
- **FIVE record kinds + two ops** — TAGDEF, DATA, LIST, PIN, TAG; ops ASSERT(0)/REVOKE(1). PROPERTY/MIRROR/REDIRECT/LIST_ENTRY were deleted and re-homed. `[reviewed]` `[codex-kinds]`
- **DATA is owned (author+salt, unforgeable); TAGDEF/paths are unowned shared Schelling points.** `[reviewed]` `[codex-kinds]`
- **A file's identity is its DATA record, not its bytes** — identity is never content-derived; on-chain and off-chain files are equally real (ADR-0049). `[reviewed]` `[confidence-and-open-decisions]`
- **PIN (cardinality-1) and TAG (cardinality-N) stay separate kinds** — cardinality is part of slot identity, a frozen Codex invariant; merging is refused. `[reviewed]` `[codex-kinds]`
- **Reads = lenses (per-viewer ordered trusted-author list, first-attester-wins) + normative read grades** (proven-absent vs unknown; never resolve missing data as no-claim). `[reviewed]` `[read-lens-spec §2]`
- **No portable cross-chain "currency"** (is-this-latest / is-this-revoked); apps use author-set **expiry** for safety-critical data. Every full-currency mechanism died under red team. `[reviewed]` `[confidence-and-open-decisions]`
- **Portability = replication** (copy records + bytes to another chain, read natively), not cross-chain proofs. `[reviewed]` `[confidence-and-open-decisions]`
- **String-only property values** (v2-scoped, `[ruled]`; datatype word kept only so the interning formula stays recomputable; re-check trigger = a marketplace/sort-range numeric app). `[codex-kinds]`
- **Fully permissionless byte pool** — anyone writes anything, nobody controls EFS; filtering is edge-only (lenses/gateways/operators). `[ruled]` `[confidence-and-open-decisions]`
- **Bare-EOA identity is first-class in v2; KEL / passkey / post-quantum succession is reserved** (formats frozen, machinery not built). `[reviewed]` `[confidence-and-open-decisions]`
- **The Codex = the frozen Etched rulebook**, self-hosted at genesis; one freeze pledge (scope in §3). `[reviewed]` `[freeze-gates §C]`

**The recurring theme a FS pass will keep hitting:** the protocol is deliberately *allow-shaped, monotone, and clock-free*. First-attester-wins can't natively express "everyone EXCEPT," admission never permanently rejects what another kernel could accept, and the kernel never reads a clock at admission. Filesystem features that assume mutation, deletion, exclusion, permissions, or trusted time are pushing against these grains — that's exactly where the design work is.

---

## 2. The exact current mechanisms a FS feature would build ON (precise, not vibes)

### 2.1 Supersession / slots (the mutation primitive) `[codex-kernel][read-lens-spec §1.3]`
- A **slot** is a `(author, key)` position; a key is a placement, a reserved-key, a list-entry, or a TAG accumulation.
- **Winner** = `argmax over admitted claims in the slot by (order, recordDigest)` lexicographic. (The field formerly called `seq`; see §5 — the rename to `order` is a `[pending-James]` freeze-sensitive decision, `freeze-gates §A.8`.)
- **Empty-on-revoke** (kernel's rule, `[reviewed]`): if the winner is revoked, the slot reads **EMPTY** — no max-over-unrevoked fallback, no resurrection; the author re-asserts at a new order to refill. `[read-lens-spec P2]`
- **Superseded claims still exist** — reachable by claimId and in historical enumeration; disposition SUPERSEDED, never silently absent. `getSlot` returns `supersessionCount + priorClaimId` (O(1) words, NOT per-slot history arrays). `[codex-kernel Read ABI]`
- **Slot state is a pure function of the admitted set** — identical on any venue holding the same records, in any order. This is what makes "current version" = the placement slot, and the version history = the `supersededBy` chain. `[read-lens-spec §3.6]`

### 2.2 PIN vs TAG semantics (the edge kinds) `[codex-kinds]`
- **PIN** = cardinality-1 naming/placement/binding edge (one winner per slot). **TAG** = cardinality-N (weighted) categorizing/membership edge (accumulates). Both are claims, revocable, in REF or VAL layout.
- **REF layout** = points at an object id; **VAL layout** = carries a datatype word + value bytes ≤ `MAX_VALUE_BYTES = 8192` (this is how the deleted PROPERTY kind was re-homed — the kernel **auto-interns**: derives `propertyId` and registers the value object as a side effect of the edge).
- **REF-edges targeting KIND_PROPERTY are forbidden** (closes a dual-spelling hole). A fact has exactly one encoding.

### 2.3 TAGDEF hierarchy (paths / folders / tags / keys) `[codex-kinds][read-lens-spec §6]`
- One **derived-tagId namespace** covers paths, folders, categories, and property keys. `tagId = H(DOMAIN_ANCHOR, parentId, keccak(name), kindTag)` — the **kind word is in the derivation**, so one parent can hold the same `name` under multiple kindTags as distinct tagIds. `[read-lens-spec P10, §4.1]`
- TAGDEF carries **canonical-name (NFC) validation + path permanence** (what the old ANCHOR resolver quietly enforced). TAGDEFs are **unowned** — shared Schelling points; permissionless extension is by minting user-key TAGDEFs.
- **Name shadowing** across kinds resolves by a frozen per-context trial order (byte-serving: DATA → GENERIC → LIST; path continuation: GENERIC → DATA → LIST; explicit-kind: no fallback). `[read-lens-spec §4.1]`
- **Children under a KIND_DATA parent are legal** (sub-file paths, annotation/comment attachment get a home) — but a child of a file node is **not the file author's content** unless the same author wrote it (phishing-defusing authorship boundary). `[codex-kinds amendment 8][read-lens-spec §4.2]`

### 2.4 Reserved-key table (13 rows, Etched) `[codex-kinds §5, P9][codex-kernel amendment 10]`
The re-homed enforcement of the 4 deleted kinds now lives as frozen reserved-key rows under containers. Current enumerated set (from the genesis manifest, `[codex-kernel amendment 10]`):
- `mirrors` — **dual-role**: PIN = primary mirror (the O(1) tokenURI point read), TAG = additional mirrors (multi-transport redundancy).
- Five redirect rows: `sameAs`, `relatedVersion` (TAG, cardinality-N, **never auto-followed**); `symlink`, `movedTo` (PIN, **auto-follow**, count against the follow budget); **`supersededBy`** — dual-role (PIN = designated successor, TAG = additional, union read) so many-to-one supersession is expressible.
- `name` (VAL, display metadata only — the path TAGDEF segment name is canonical for listings).
- `home` (advisory venue hint, fail-safe; never resolution input).
- `successor` — **demoted to reserved-not-active**: an active successor pre-KEL blesses key-theft trust migration; ships with the KEL. Interim convention is client-layer only (OPAQUE target, publish-pair-at-creation, never auto-followed, MUST-NOT-authorize). `[codex-kinds amendment 7]`
- `checkpoint` — reserved, activation `[pending-James freeze-gates A1]`; an ordinary reserved-KEY claim (through-order + state root), **zero kernel machinery**.
- Content-metadata rows named in the manifest: `keyWrap`, `contentType`, `contentHash`, `size`, `contentEncryption`, plus the `/vocab/datatypes/string` datatype vocabulary.
- **Follow budget** `MAX_AUTO_FOLLOWS = 8` combined (symlink + movedTo) per resolution, cycle-detected; exhaustion/cycle = resolver error `UNRESOLVABLE`, never a grade. `[read-lens-spec §4.3]`
- **OPAQUE is forbidden in all reserved-key rows**; the legal targetKind set per row is stated in the frozen table. `[codex-kinds amendment 5]`

### 2.5 LIST (collection charter) `[codex-kinds]`
- LIST = owned collection charter (`appendOnly`, `targetKind`, `maxEntries`); **config folds into `listId`** (`listId` includes `keccak(configBytes)`), so same-listId-different-charter is impossible by derivation.
- **LIST_ENTRY was deleted** → a member is a **TAG with `definitionId = listId`**. Add-entry-with-order drops 3 records → 1.
- **maxEntries is a pure read-time filter** (envelope amendment 1 / C6) — NOT admission state, no counter, no `ListFull` event. Beyond-cap entries admit normally and are labeled `beyond-charter-cap` in unfiltered/historical views. `[read-lens-spec §3.5]`
- `appendOnly` entry edges require `expiresAt == 0` (K1: otherwise born-expiring entries hollow the guarantee). An append-only revoke-second is the **inert `RefusedAppendOnly` no-op** (recorded, event, never a revert). `[codex-kinds amendment 1-2]`

### 2.6 expiresAt (the only currency lever) `[codex-kinds amendment 8][codex-kernel amendment 5]`
- `expiresAt uint64` is the **last word of every claim body**; the kernel **stores it opaquely and never checks it at admission** (clock-free storage), exposing it in reads. **Objects never expire; only claims do.**
- Semantics = **stale-not-dead**: expired-not-revoked keeps authenticity, voids currency. STALE is **always distinct from REVOKED** — conflating them "slanders dead authors" and MUST NOT happen in any UI. `[read-lens-spec §2.2]`
- **Expiry read rule is context-split** (K6): GATE reads **stop at STALE**; INTERACTIVE reads **label-and-render-stale**, fallthrough only by explicit disclosed reader policy. The exit mechanism is **REVOKE** (slot yields cleanly); expiry is a currency fuse, not an exit. `[read-lens-spec §3.2]`

### 2.7 Revocation G-set `[read-lens-spec P3][codex-kernel amendment 4]`
- Revocation is the **monotone G-set** of `(revoker, claimId)` pairs; effectiveness = `revoker == claim.author`.
- **Pre-revocation is legal** — a REVOKE naming a not-yet-admitted claimId admits and stores; effectiveness is lazy at pair completion (the old MissingDependency revert is deleted).
- REVOKE op body = the target claimId. `claimId = keccak256(DOMAIN_CLAIM_V1, author, order, recordDigest)` — content-addressed, so revocation is portable across carriage. `[codex-kinds delta 1]`
- **Delegated revocation does NOT exist today** (`revoker == claim.author`): the primary cannot revoke a stolen persona's claims; pre-signed revoke ladders are the only pre-KEL kill switch. `[client-os-pressure P4]`

### 2.8 Discovery index (cross-author enumeration) `[codex-kernel amendment 9][read-lens-spec §7]`
- **Container-scoped per-tagId discovery index** — bounded, paginated, `discover(tagId, cursor, limit ≤ 256)`; `[pending-James]` (P12), the consumer apps' #1 demand. Recommended ADD; if refused, degrades to an off-chain indexer lane (`DISCOVERY(INDEXED)`, enumeration completeness = indexer trust).
- **Enumeration ≠ endorsement**: every entry is `DISCOVERY`-flagged and MUST pass §3 lens-grading before any trusted render. Order = venue admission order (chain-local, labeled, **never** an input to slot resolution). Counts are indexer artifacts, never GATE-consumable. Discovery output MUST NOT satisfy a PROVEN-ABSENT check.
- Backing spine: **`allClaims` append-only array** (~22–27k gas/record) + full record bodies in state — the only way the from-state-alone reconstruction pledge is implementable. `[codex-kernel adopted core]`

### 2.9 Read grades (the closed vocabulary a FS feature must speak) `[read-lens-spec §2]`
- **Position states**: PRESENT(c) / **PROVEN-ABSENT** (the *only* state that yields fallthrough) / **UNKNOWN** (STOP — never fall through; falling through on UNKNOWN converts a data gap into a trust transfer, because first-attester-wins is anti-monotone under missing data).
- **Claim dispositions** (dominance order): EQUIVOCAL → CONTESTED → REVOKED → STALE → SUPERSEDED → LIVE. Only LIVE (within a currency bound + clean deny pass) is GATE-consumable.
- **Currency qualifiers**: HOME-LIVE / AS-OF(N) / UNKNOWN-CURRENCY. A LIVE disposition under UNKNOWN-CURRENCY MUST NOT render as plain LIVE.
- **Deny composition** (`§3.4`): first-attester-wins is allow-shaped; "admit everyone EXCEPT" is expressed **client-side** as advisory lenses (ordinary TAGs by a moderation author) that **subtract after allow-resolution**. Subtract-after-resolve never re-opens resolution. This is the load-bearing safe-consumption layer (RustSec/OSV/npm-audit/Bluesky-labeler shape).
- The set is **CLOSED for v2**; extension is by spec revision only. Three KEL-era names already reserved.

### 2.10 Move / rename, symlink, mirrors — what already exists
- **Rename/move primitive** = `movedTo` PIN (auto-follow, moved-from renders a provenance breadcrumb). **`symlink`** PIN (auto-follow). Both bounded by the follow budget. `[read-lens-spec §4.3]` — the FS pass is asked to *walk these end-to-end at scale* (move a 10k-child folder: cost, link integrity, old-path behavior). `[fable-next-pass-scope]`
- **Folder visibility derives from the parent-walk at read/view time** (contains-walk); v1's ancestor-visibility TAGs do NOT port into the kernel (overturnable at Phase-0 only if a directory-heavy multi-tenant grounding demands write-time visibility state). `[codex-kernel amendment 12]`

---

## 3. Freeze-sensitive surfaces a FS pass might touch (cross-ref freeze-gates §C)

**Bound by the one-final-freeze pledge (Etched — a FS feature that needs any of these needs it reserved before the ceremony):** `[freeze-gates §C]`
- The envelope wire format + signature/replay domain + all `DOMAIN_*` constants.
- **The record-kind table + reserved-key rows + derivation math** (the deterministic-ids v2 delta). ← *Most likely FS collision point.* Any new FS edge type, sharing/permission record, versioning primitive, or lock record is either a reserved-key row (freeze-bound) or a user-key TAGDEF convention (free but un-vectored, per-client dialect risk). `[codex-kinds §5]`
- Kernel admission semantics (master confluence invariant, `(order, recordDigest)` comparator, G-set revocation, auto-intern) + **frozen read ABI** + storage layout (ERC-7201) + genesis manifest.
- The identity-word taxonomy + reserved KEL/algoTag/WebAuthn formats.

**NOT bound (Durable / iterates freely):** view contracts, **all of read-lens-spec** (resolution algorithms, grade rendering, discovery-read semantics, URL/prefix grammar), SDK surfaces, relayer/lens conformance, the apps cookbook, all doctrine. So: *read-side* FS features (history views, restore UX, multi-tag search over the index, trash rendering) are cheap and iterable; *write-side* FS features that need new record shapes or new admission behavior are freeze-bound. `[freeze-gates §C]`

**Additive-later reserved slots already carved** (retrofit is legal against these): KEL machinery + successor activation, P-256/WebAuthn un-reservation, PQ algoTags, witness/checkpoint tooling, **duplicate-member role**, **WHITEOUT**, **salted TAGDEF (`DOMAIN_ANCHOR_SALTED` family) + blinded-TAGDEF disclosure record**, **REF-to-property annotation role**, author-chosen list identityKey mode, datatype-tag extension constants. `[freeze-gates §C]` — several of these (WHITEOUT ≈ soft-delete/trash, duplicate-member, salted TAGDEF ≈ private folders) are *exactly* FS-feature-shaped and already reserved.

**Freeze-timing rule the FS pass operates under:** deep design is staged (FS first), but **each pass must surface its freeze-sensitive reserved slots early** so the full "reserve before the ceremony" set from all three passes converges before the freeze. Staging the design does NOT mean staging the reservations. `[fable-next-pass-scope]`

**Kernel read-ABI / index surface** (Etched, `[pending-James]` gas sign-off): the enumeration spine, the container-scoped discovery index, `authorHead(author)`, and the two extra slot words are in the **freeze-gates A2 gas bundle** — a FS feature leaning harder on enumeration/discovery rides that same cost decision. `[codex-kernel Read ABI, Open questions]`

---

## 4. OS-side FS-relevant asks (input, not gospel — adjudicate, don't assume) `[client-os-pressure-report]`

The client-v2 round is a **pressure test**, explicitly *input to adjudicate*, except two red-team-confirmed findings (persona-group owner-authored agent-label construction; persona-linkage privacy finding). FS-relevant items:

- **P2 reserved-key candidates** (`[ETCHED-WINDOW]`, decide before the table freezes): `lang`+`dir` (content metadata, top-cited); persona-link relation + `label`/`act` word; **handler-binding** ("type author endorses handler app" — open-with routing without squattable first-attester claims); **freshness-beacon** (expiring head PIN, TUF-timestamp analog for update channels); receipt/grant schema. Each is row-vs-blessed-convention-vs-reject. Handler-binding and freshness-beacon are the most FS/app-platform-shaped. `[P2]`
- **P7 app-package convention** (`[DOCTRINE, borderline P2]`): app identity = (author word, app-root record); manifest hashed into identity; **atomic resolve-closure-at-pinned-root** (manifest + content root as one consistent pair — per-record lens resolution can otherwise mix versions across an app's records; a partially-upgraded app is a hazard). Language/font packs ride the same convention. This is the "a directory-tree IS a deployable unit" FS question. `[P7]`
- **P13 social / timestamp-free-ID footguns** (`[DURABLE+DOCTRINE]`): no trustworthy "when" on a record — author TID is back-datable (only +600s future-fenced). Blessed defenses a FS/social feature must use: order by **admission order** (discovery index), **cite the exact version** (citation-form pins claimId, supersession never silently followed), **render edit history**, grade partial replicas UNKNOWN-CURRENCY. `[P13]`
- **P1 trustworthy clock** (`[ETCHED-WINDOW]`, enables P13): store `admittedAt[claimId] = block.timestamp` in kernel state (getProof-provable), `isAdmitted(claimId[])` batch, every grade state-provable not log-derived. Per-chain, venue-labeled, **never** a global clock. Any FS feature wanting "when was this file created/modified" trustworthily depends on this decision. `[P1]`
- **P9 private/encrypted tier + local-state ruling** (`[WORKSTREAM]`, mostly Pass 2 but touches FS): cross-device roaming of profiles/lens-config/settings; **lens/trust config restorable** (a silent wipe changing what a user *sees* = a truth bug — "the round's sharpest storage finding"). Relevant to "my filesystem view must survive device loss." `[P9]`
- **P10 multi-device authorship** (`[DURABLE/SDK]`): two offline devices minting the same `order` make the user self-EQUIVOCAL; the TID carries 10 device bits but no allocation convention exists yet. Relevant to any "same user editing one folder from two devices" FS story. `[P10]`

**Three root causes it names** (fix causes not symptoms): no trustworthy time + no actor below the author (P1/P4/P13); no private/encrypted tier (P8/P9 → Pass 2); the closed read-grade vocabulary keeps hitting unnameable states (P3 → e.g. `NO-TRANSPORT` "not permitted to look" ≠ "not found").

---

## 5. Known open questions a FS pass intersects (already logged)

- **`seq` → `order` rename + optional `claimedAt`** `[pending-James, freeze-gates §A.8, FREEZE-SENSITIVE]`. `order` = portable per-batch ordering key (LWW by `(order, recordDigest)`), not a timestamp, not a nonce. `claimedAt` = optional per-record untrusted user time-claim, survives batching. `admittedAt` = per-chain kernel-stamped trustworthy clock (P1). A FS "sort by time / show modified date / timeline" feature lands squarely on all three concepts — and the field is being renamed *because* apps kept mis-trusting it as a clock. **The prompt should use `order`, and flag that this trio is the honest time model.**
- **Checkpoint activation** `[pending-James, freeze-gates A1]` — checkpoints as ordinary reserved-key claims; read-lens-spec §5 (staleness bounds, copied-chain grade column) degrades if refused. FS "restore as of yesterday / prove this folder's state at time T" leans on checkpoints.
- **Discovery index ship-or-not** `[pending-James, P12]` — the whole multi-tag-search and cross-author-listing story downgrades to indexer-trust if refused.
- **Multi-tag AND-selection** `[open, James wants it if cheap]` — "files with tags A AND B AND C." The scope doc's *explicit deliverable ask*: draw a clear line — "works on-chain/indexer up to here; richer search is a The Graph feature." If not cheap on-chain, search is explicitly off-chain and that's fine. `[fable-next-pass-scope Pass 1]`
- **String-only confirm** `[pending-James, freeze-gates A7]` — re-check trigger is a marketplace/sort-range numeric app; a FS "sort by size/date as numbers on-chain" feature is exactly that trigger. `[codex-kinds]`
- **AppendOnly signer-legibility residual** `[open, freeze-gates A4]` — a permanent list entry looks like a revocable TAG in the signed bytes; relevant to any append-only FS log/journal feature.
- **Charter read-filter formula + vectors** `[→ Codex, read-lens-spec §3.5]` — the maxEntries min-`(order, recordDigest)` ordering needs golden vectors; a FS "bounded collection" feature depends on it.
- **Reserved-key table golden vectors** `[needs-measurement, codex-kinds pre-promotion]` — the 13 rows re-centralize what 4 deleted kinds enforced; every row is freeze-gate surface, vectors pending.

---

## 6. Flags — what a FS pass would LIKELY need to change or reopen (call these out honestly)

1. **New write-side FS primitives collide with the frozen record/reserved-key table.** Write-sharing/access-control, multi-writer merge state, locking, quotas — none exist today `[fable-next-pass-scope]`, and EFS has **no write-permission model at all** (it's read-curated by lenses; the byte pool is permissionless-by-ruling). Any of these that needs on-chain expression is a reserved-key row or a new admission behavior = **freeze-sensitive, must surface early**. Some are pre-reserved (WHITEOUT ≈ trash/soft-delete; salted TAGDEF ≈ private folders; duplicate-member) — the pass should check the additive-later list before inventing. `[freeze-gates §C]`

2. **Multi-writer collaboration strains the single-author + monotone model.** "One folder, many editors" has no whose-version-wins story beyond slot LWW, and **CRDTs were dismissed early** — the scope doc explicitly says the shared-folder story "needs a real check." Merge/conflict is where the FS pass is most likely to *reopen* an assumption. `[fable-next-pass-scope]`

3. **Delegated / permissioned writes have no protocol home below the author key.** `revoker == claim.author` and author = recovered signer mean shared-folder write-access and delegated revocation are inexpressible pre-KEL; the client-side persona/owner-label construction is *presentation only, owner-asserted not kernel-enforced, prospective-not-retroactive*. A real access-control FS feature likely presses on the P4 reserved delegation slot. `[client-os-pressure P4]`

4. **Versioning/history/undo has mechanism but no coherent primitive.** `supersededBy` chains + SUPERSEDED grade + `getSlot`'s `priorClaimId` exist, but there is **no "show history / restore v3" primitive** — this is a read-lens-spec/SDK build (Durable, cheap), *unless* "restore as of time T" needs checkpoints (freeze-sensitive). `[fable-next-pass-scope]`

5. **"Trustworthy modified/created time" for files is blocked on P1 + the `order` rename.** Any FS metadata feature wanting real timestamps must ride P1 `admittedAt` (Etched, undecided) and speak the `claimedAt`/`order`/`admittedAt` trio honestly — naive "sort by TID" is a documented footgun (P13). **This is freeze-sensitive and must be surfaced early.**

6. **Multi-tag search's on-chain reach is genuinely undecided** and depends on the also-undecided discovery index (P12). The pass owes a clear on-chain/off-chain line, not a query language (James: EFS ships **no query language** — export to DB / The Graph / RPC; the pass *confirms clean subgraph-indexability*, which the log-only-sync event set already targets — verify it holds for all FS ops). `[fable-next-pass-scope]`

7. **Folder visibility was ruled read-time-derived, explicitly overturnable.** `[codex-kernel amendment 12]` says a directory-heavy multi-tenant grounding *could* reopen write-time visibility state at Phase-0 — a FS pass stressing large permissioned directory trees is exactly that grounding and may reopen it.

---

### Precision notes for the prompt author
- Say **`order`, not `seq`** (rename is the current thinking; `[pending-James]`), and present the **`claimedAt` / `order` / `admittedAt`** trio as the honest time model.
- Say **five kinds** (TAGDEF, DATA, LIST, PIN, TAG) — PROPERTY/MIRROR/REDIRECT/LIST_ENTRY are *deleted and re-homed*, not part of the model.
- **read-lens-spec is Durable, not Etched** — don't call its grades/algorithms freeze-bound; the *pins* it depends on (§0 table) are the Etched surfaces.
- "No write permissions," "no cross-chain currency," "permissionless byte pool," "clock-free admission," "empty-on-revoke" are all *ruled*, not open — reopening needs loud specific cause.
- The pass is **informational and non-prescriptive by James's instruction** — this brief is *material to reason over*, not a checklist to satisfy.
