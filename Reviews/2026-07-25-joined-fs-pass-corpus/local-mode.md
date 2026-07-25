# EFS v2 joined pass — chain-free / local mode: the designed, honest mode

**Status:** lane deliverable of the 2026-07-25 joined KEL × authority × lens filesystem reconciliation pass — the ruling-5 design + cannot-do ledger
**Lane charge:** elevate the client local cache to a designed, honest mode: signed portable records in a local store; the signed-head realm (multi-device sync, witnessing, offline merge, conflict surfacing); rollback/export/backup/recovery; the completeness manifest; provider-observation honesty; the explicit list of what local-only mode structurally cannot do; contracts as the flip-side unique power; the promotion journey; the local-first precedent check; the five break scenarios
**Inputs (read in full or per charge):** [[README]], [[owner-decision-inbox]], [[owner-rulings]], [[human-overview]], [[ethereum-first-efs-and-os]] (§5–6 in full), [[solana]] (§3, §7), [[mountable-filesystem-semantics]], [[privacy-pass-synthesis]], [[fs-pass-synthesis]], [[kel]] (§8 seam verified directly), [use-cases.md](./use-cases.md), [aa-inversion.md](./aa-inversion.md)
**Last touched:** 2026-07-25

#status/draft #kind/review #repo/planning #topic/efsv2 #topic/local-mode #topic/chain-free

> **How to read this file.** §0 is the verdict. §1–§5 are deliverable 1 (the mode designed). §6 is deliverable 2 (the cannot-do ledger — the list James named in ruling 5). §7 is deliverable 3 (contracts as the unique power + the promotion journey). §8 is deliverable 4 (local-first precedent check + the named residual). §9 is deliverable 5 (how it breaks, five scenarios). §10 reconciles T1–T4 from this lane's seat. Per [[README]], nothing here is ceremony-final; this is reconciliation input, not freeze permission.

---

## 0. Verdict in one page

**Chain-free local mode is not a degraded EFS; it is EFS's evidence lane running without an authority lane** — and once that framing is adopted, almost the entire design already exists in the corpus and merely needs to be *joined*: the canonical envelope is offline-constructible (§1.3, verified against [[kel#8. Envelope seam and admission|kel §8]] with one recut gate), the fold is confluent so a local replica and a venue holding the same records materialize byte-identical state ([[fs-pass-synthesis#The consistency-model statement (the sentence the OS pass quotes)|the consistency statement]], verified), heads/checkpoints are ordinary signed claims exactly as Q4A wants ([[owner-decision-inbox]] Q4), personal realms are closed containers so the op-fold canon applies legitimately (Q3A, C7), and the weak authority grade *is* the local identity story ([aa-inversion.md](./aa-inversion.md) §6.4 derives it rather than assuming it).

**What must be honestly refused:** local mode has no answer to freshness, completeness, canonical order, post-revocation backdating, third-party discoverability, or autonomous composability — and §6 says *why structurally* for each, with the honest degraded substitute. Signatures verify the past; they cannot rank the present. The single most dangerous product failure is a UI that lets a user believe a local draft is globally final; §9.4 states the honesty rule that prevents it and JL-1 asks James to make it law.

**The one genuinely new mechanism this lane adds** is small: a `RealmHead` / `CompletenessManifest` convention (§2, §4) built entirely from ordinary signed claims — version-vector heads with monotone counters that make provider staleness *retrospectively detectable* and device equivocation *evidentiary* (transparency-log-shaped: forks can't be prevented, but two conflicting signed heads at one counter are permanent proof of misbehavior). Zero kernel surface. Everything else is reuse.

**The flip side is the product story** (§7): local = sovereign + free + private + fully-featured data model; on-chain = shared + composable + strong + discoverable. The promotion journey preserves identity byte-for-byte (same claimIds, same object IDs, same content commitments — venue-free by construction) and changes only grade, ordering, exposure, and reach. Promotion is additive, irreversible in exposure, and never backdates.

**How this page breaks:** if the reader concludes "local mode is fine for everything but dapps," they have missed §6 rows 1–2 and §9.1 — a person whose *only* copy relies on one dumb provider has weaker guarantees than a Dropbox user, because EFS refuses to pretend the provider is a witness. The ladder ([[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]]) exists precisely so that refusal is a labeled rung, not a hidden hole.

---

## 1. The local mode, designed — objects and store

### 1.1 What a local realm is

A **local realm** is a declared, named evidence domain with no authority lane:

```text
RealmDescriptorV1 {
  realmId,          // random 32 bytes, minted at realm inception, signed by the owning principal
  principal,        // the owner (bare-EOA address-shaped or born-KEL bytes32; full-width per seam 1)
  memberSet,        // v2 launch: exactly {principal}; field exists so team realms are not foreclosed (JL-4)
  createdAt,        // testimony
}
```

The `realmId` is what [[solana#7. Capability matrix beyond Solana]] calls "a declared local realm": it scopes heads, manifests, exports, and replica buckets so that a bundle always names *which* world it came from. It is **not** an authority domain and never answers unqualified `CURRENT` — the realm-qualification rule (R-K11-class, cited via [[owner-rulings#2026-07-23]]) applies to local realms exactly as to chains: a local realm may claim `CURRENT-in-realm@basis`, nothing more.

**How it breaks:** if `realmId` were derived from a device, provider, or path, realm identity would die with the locator — the [[solana#3. What is actually portable]] invariant 6 violation. Random + principal-signed keeps it portable. Conversely a *thief* can mint "Alice's realm" freely — realm descriptors are evidence, not identity claims; nothing about a realm asserts exclusivity, and consumers must treat an unfamiliar realm as exactly what it is: someone's signed pile (§9.3).

### 1.2 The store

Contents, all portable artifacts first, derived state second:

| Layer | Contents | Status |
|---|---|---|
| **Canonical artifacts** | envelope bytes, records, KEL event chains, grant objects, lens revisions, heads/manifests | the truth; exactly what exports carry |
| **Byte store** | content-addressed blobs verified against commitments ([[human-overview#2.5 Content authority is not transport authority]]) | carrier-grade `local`; a local disk is one more `ByteStore` under [[solana#4. Do not build one `FilesystemBackend`]] |
| **Materialized state** | per-slot LWW winners, revocation set, KEL materialized state | pure function of the admitted artifact set — rebuildable, never exported as truth |
| **Derived indexes** | backlinks, child enumeration, contentHash→DATA, author self-enumeration — the same *query shapes* as the mandatory on-chain bundle ([[owner-rulings#2026-07-15]]) | local caches. **Not** mandatory-indexing: that ruling is admission-coupled and explicitly does not apply here (see Reconciliation ledger #3) |

Substrate (SQLite/OPFS per the [[ethereum-first-efs-and-os#10. Expand, test, contract]] candidate slices) is Durable implementation detail, never frozen. The governing invariant is [[ethereum-first-efs-and-os#12. Stop rules against the Pandora's box]]: *no OS-local cache, journal, or view becomes protocol truth.* Local mode does not weaken that stop rule; it is the disciplined form of it.

Giving local mode the **same query shapes** as the on-chain bundle (as derived caches) is deliberate: one SDK read API across modes, so an app written against `children(folderTagId, cursor)` runs unmodified over a realm, a bundle, or a venue — only the `ObservationBasis` (venue, completeness, trustClass — [[solana#4. Do not build one `FilesystemBackend`|the observation struct]]) differs. This is the concrete meaning of "the lens is the stable OS abstraction" ([[solana#5. The lens is the stable OS abstraction]]).

### 1.3 Same envelope bytes — verified under the KEL seam reopening, with one recut gate

The charge asked: do local records really use *the same envelope bytes* now that the envelope is reopened? **Verified with a caveat and one newly-exposed gate:**

- The reopened envelope signs `author, authorityId, authEpoch` plus the existing ordering/testimony words ([[kel#8. Envelope seam and admission|kel §8.1]], read directly). Every signed field is **client-computable without venue state**: `author` (local), `authorityId` = a grantId derived from KEL events the signer holds, `authEpoch` from the signer's local KEL state, `order` (author TID), `claimedAt` (testimony), batch root (local). Bare mode is exactly `authorityId = 0, authEpoch = 0`. So one artifact family across local and chain **holds by design** — this is [[solana#3. What is actually portable]] invariant 1 and register row R-PA1 ([use-cases.md](./use-cases.md) §5.1) restated from the local seat.
- **Caveat:** the exact bytes are *not final* — seam 2 (two competing envelope identities, [[human-overview#7. The seams that must be closed]]) is open, so "same bytes" is a requirement on the coordinated recut, not a settled fact. Local mode inherits whatever the recut freezes and regenerates vectors with everyone else.
- **Newly-exposed recut gate (this lane's contribution): the offline-constructibility invariant.** The coordinated recut must never move venue-coupled admission context (home-block windows, admission ordinals, venue identifiers-as-freshness) into the **author-signed** bytes. [[kel#8. Envelope seam and admission|kel §8.3]]'s `ActionContextV1` mentions a "home-block window" among admission checks, and I could not fully verify how much of that struct is signed versus recomputed at submit ([[kel]] Tier-1 text says the submit path "recomputes it from signed bytes and proofs"). If any freshness-window field lands inside the signature, offline-signed records would *expire* rather than promote — killing journey (d) ([use-cases.md](./use-cases.md) §3) for anyone offline longer than the window. Flagged for the envelope/kernel recut as a hard gate; see Confidence.
- **The stale-epoch case is already solved by the seam's own design, and it matters here:** an offline device may sign with a stale `authEpoch` (a rotation happened elsewhere). At promotion the venue refuses or degrades that carriage — but because `claimId` is logical-record-based and **excludes actor/grant carriage** ([[kel#8. Envelope seam and admission|kel §8.1]], verified), the client re-signs the same claims under the current epoch **without changing any record's identity**. Local links, folds, and IDs survive re-authorization untouched. This is the single most local-mode-friendly property of the KEL seam and must survive the recut.

---

## 2. The signed-head realm — multi-device sync

### 2.1 What names a head

A head is an **ordinary signed claim**, exactly as Q4A demands ([[owner-decision-inbox]] Q4: "a checkpoint is an ordinary reserved-key claim... add no kernel HEAD/current/fork-choice machinery"). No kernel surface; a reserved-key convention for the conventions registry ([[fs-pass-synthesis#Commissioned follow-ups (Durable, not freeze-blocking, but ship-order-critical)|fs-pass follow-up 2]]):

```text
RealmHeadV1 {
  realmId,
  deviceRef,             // (author, deviceBits) per the P10 clientId convention — fs-pass canon C9-14
  counter,               // strictly monotone per device — the anti-replay spine
  recordSetRoot,         // order-independent commitment (set hash) over claimIds admitted to this device's view
  basisVector,           // version vector: highest (deviceRef → counter) this device has folded — the C8 view-parameter discipline applied to sync
  prevHeadDigest,        // hash-chains this device's own head history
  signedAt,              // testimony only (claimedAt-class; never a comparator — canon C3/C4)
}
```

- **Per-device, never per-realm.** [[kel#8. Envelope seam and admission|kel §8.1]] is explicit that `prev` is an actor-lane hint and "multiple actors do not share a consensus head." A realm's *current state* is not one head; it is the deterministic fold of the union of records at a **basis vector** of per-device heads — precisely the [[fs-pass-synthesis#Classic-FS dispositions — the master table (native / re-homed / gone)|fs-pass]] "basis = the vector of per-author checkpoints" re-used at device granularity.
- **Monotone counter + hash chain** make a device that signs two different heads at one counter **permanently convictable**: any party holding both artifacts holds transferable equivocation evidence. This is the transparency-log property imported without a log operator — forks are *not prevented* (nothing local prevents anything), they are *evidentiary*. That is the strongest honest claim available and it is worth having.

**How it breaks:** a head proves what a device *admitted to seeing*, never what exists. A malicious device simply... doesn't sign heads covering records it wants to hide (withholding is silent — §6 row 9). A stolen device signs valid heads until revocation reaches the reader (§9.3). And `signedAt` is testimony: a backdated head is cheap; only the counter/vector structure — not any timestamp — carries ordering weight.

### 2.2 Who witnesses a head

The witness set is the rung ladder from [[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]], made concrete:

| Rung | Witness | What it actually buys | Trust named |
|---|---|---|---|
| **local-sovereign** | the user's other devices (mutual `basisVector` acknowledgment) | retrospective staleness detection among own devices; equivocation evidence | none beyond own hardware |
| **network-replicated** | 1+ dumb replicas storing envelopes+heads | availability; nothing about freshness (§5) | replica operator, per replica |
| **provider-attested** *(optional rung, JL-2)* | a replica that **countersigns** received heads `(headDigest, receivedAt)` | Dropbox-grade "you are up to date" UX with the trust **named**: the provider attests freshness and can lie | one named operator |
| **witnessed** | independent log/quorum, or an occasional **chain anchor** (one tiny record on any reachable venue committing `(realmId, deviceRef, counter, headDigest)`) | third-party-verifiable "this head existed by then"; bounds provider replay to pre-anchor states | the anchor venue (chains-don't-die makes this the strong rung) |
| **chain-authoritative** | full promotion (§7) | everything in §6's right column | the venue |

An anchor is itself an ordinary record — the witnessed rung needs **zero new machinery** and no locator: the realm chooses any venue it can reach (T2 consequence, §10).

**How it breaks:** every rung below *witnessed* shares one structural ceiling — all witnesses are chosen by (or are) the user, so a coordinated provider+thief can present an internally consistent stale world to a fresh device (§9.1's worst case). The anchor rung is the first one an attacker must attack *a chain* to defeat.

### 2.3 Offline merge — reuse of the FS-pass canon

Merging two devices after any offline window is **the ordinary EFS fold, not a sync algorithm**:

1. Union the envelope sets (verify signatures + commitments on ingest — [[solana#3. What is actually portable]] invariant 2, exact bytes preserved).
2. Fold: per-`(author, key)` slot LWW with the deterministic `(order, recordDigest)` winner; grow-only revocation; losers retained and inspectable. The [[fs-pass-synthesis#The consistency-model statement (the sentence the OS pass quotes)|consistency statement]] guarantees confluence: *"slot state is a pure function of the admitted set — identical on any venue holding the same records in any order."* A month of divergence merges in one deterministic pass; there is no "too old to sync" cliff (§8).
3. Where the realm uses op-fold containers (notes CRDTs, rosters): the personal realm is a **closed, capability-gated, stable-membership container**, which is exactly and only where the op-fold family survives canon C7 / Q3A ([[fs-pass-synthesis#Corrected canon (the C1–C14 reconciliations the synthesis adopts)|C7]]; [[owner-decision-inbox]] Q3). Roster changes follow the privacy-pass serialization law (rotations read-your-latest-epoch; LWW-by-rotation-order, never OR-set union — [[privacy-pass-synthesis]] PC-12) when team realms eventually exist.
4. Device distinction rides the P10 convention: roster-assigned `deviceBits`, `clientId = f(author, deviceBits)` — already FOLD-correctness-blocking in the canon; local mode makes it load-bearing sync state.

### 2.4 Conflict surfacing — deterministic fold, honest UI

Same-slot concurrent edits from two devices (neither head's `basisVector` covers the other) are **objectively detectable as concurrent** via the vectors — this is what heads add over bare LWW. The rule set:

- The fold's deterministic winner **always stands** (determinism is what makes replicas agree; never patch the fold with heuristics).
- The UI **must surface** the losing concurrent sibling as a first-class conflicted version — Dropbox's "conflicted copy" semantics with better provenance (§8). Resolution = the user re-asserts (an ordinary new record), which is simultaneously the merge checkpoint of [[ethereum-first-efs-and-os#7. “We trust the user” is useful but needs one correction]]: *the user is the realm's arbiter.* No consensus system is invented (charge item 4; §8).
- **Clock-skew honesty:** `order` is an author-controlled TID; a device with a wrong clock can win LWW "from the past" or "from the future." When the causal vector and the TID order *disagree* (vector says A-then-B, TIDs say B-then-A), flag `CLOCK-SKEW-SUSPECT` on the surfaced conflict. Flag, never re-fold.

**How it breaks:** conflict surfacing is per-slot; a month offline on both devices can produce hundreds of conflicts, and a dialog-per-conflict UX is abandonment-grade — the conflict *set* must render as one reviewable changeset (a product requirement inherited from the local-first precedent bar, §8). And concurrency detection is only as good as head hygiene: a device that never signs heads degrades the realm to bare LWW — honest, but blind.

---

## 3. Rollback, export, backup, recovery

### 3.1 Rollback

Nothing is ever destroyed ([[fs-pass-synthesis#Classic-FS dispositions — the master table (native / re-homed / gone)|versioning is native]]), so rollback is cheap and evidence-preserving:

- **Slot rollback** = re-assert the prior value (undo = re-assert; the master table's rule).
- **Realm rollback** ("restore to Tuesday") = pin an earlier basis vector and materialize — the per-lens basis record of the fs-pass, with C8 view parameters declared.
- **The anti-replay invariant:** a rollback is always **signed forward** — a new head with a *higher* counter whose body names the earlier basis and carries an explicit `REVERT` marker. A head whose basis moves backward *without* the marker is indistinguishable from a replay attack and must be treated as one by other devices. Silent rewind never exists.

**How it breaks:** rollback of *published* (promoted) slots is local-only theater unless re-asserted on-chain too — the sync-state vocabulary (§7.3) must show `LOCAL-AHEAD` after a local revert of a promoted slot, or the user believes the world un-saw something.

### 3.2 Export = backup

The `.efs-bundle` ([[solana#9. Recommended design-time reservations]] reservation 7; register R-PA3 in [use-cases.md](./use-cases.md)) is the single export/backup/walk-away vehicle: exact canonical artifacts + KEL history + heads + manifests (§4) + byte blobs + import rules. A bundle import re-verifies everything; a clean implementation rebuilds the realm from a bundle with no EFS-operated anything ([[human-overview#2.6 A century promise is a maintenance program]]). Local mode's backup story **is** the walk-away drill run domestically.

### 3.3 Recovery

Three independent outcomes, never conflated ([[human-overview#7. The seams that must be closed]] seam 13):

- **Evidence recovery** — the bundle. Works forever, even after total key loss: records still verify; the archive is readable; no new writes. This is the floor and it is genuinely good.
- **Identity recovery** — zero-state bare key: **none**; key loss = identity loss, the advertised cost of zero setup ([[human-overview#2.1 Evidence is not authority]]). KEL-mode: rotation/recovery mechanics work **venue-free** in one important respect — **pre-rotation verifies locally** (the ROTATE must reveal the precommitted next state; a thief holding only current keys cannot forge it — [[kel#5. Key state|kel §5.3]], the mechanism [aa-inversion.md](./aa-inversion.md) row 3 calls the one thing no account layer has). What is *not* venue-free: choosing between two competing structurally-valid event chains shown to a third party, and knowing the chain you see is complete (§6 row 5). Recovery *factors* are the adopted baseline (passkey-sync + independent cold factor, [[owner-rulings#2026-07-16]]).
- **Encryption recovery** — independent random roots, never wallet-signature-derived (adopted, [[owner-rulings]]); recoverable vs shreddable per [[privacy-pass-synthesis]] PC-4; local mode carries the private tier's substrate and its gates (JD-31/32) unchanged.
- **One cheap, high-leverage addition (this lane):** the recovery factors should carry a **head hint** — the latest known `(deviceRef, counter)` vector, refreshed opportunistically into passkey-synced metadata and written to the cold factor at creation. A fresh device restoring from a replica then has a *remembered basis* and can detect a rolled-back restore (§9.1's worst case becomes detectable whenever the hint is fresher than the replay). Platform feasibility unverified — see Confidence and JL-3's cadence cousin.

---

## 4. The completeness manifest — what a local realm can honestly claim

```text
CompletenessManifestV1 {
  realmId,
  basisVector,            // exactly which per-device heads this statement covers
  recordSetRoot, recordCount,
  byteManifest,           // contentHash → PRESENT | ABSENT (bytes actually in this bundle/replica)
  kelBasis,               // principal's KEL head (event digest + seq) as-known
  lensRef,                // if the manifest describes a resolved view: C8 view parameters, pinned
  completeness: DECLARED, // never PROVEN — see below
  signedBy,
}
```

The honest sentence a manifest supports — and the *only* sentence: **"These N records, at this basis, signed by these actors, with these bytes present — signed by me."** Three disciplines:

1. **`DECLARED`, never `PROVEN`.** The [[solana#4. Do not build one `FilesystemBackend`|ObservationBasis]] completeness vocabulary (`PROVEN | DECLARED | UNKNOWN`) is the law here. A realm manifest is self-scoped testimony: it proves inclusion (everything named is present and verifies) and can never prove exclusion (no closed enumeration authority exists over an open signing key — §6 row 2). `PROVEN` completeness exists only where an admission-closed index with positive closure exists, i.e. on a venue.
2. **Absence claims are basis-scoped.** "Not in this manifest" is a fact; "does not exist" is never claimable. This is the mount contract's `UNKNOWN ≠ ENOENT` rule ([[mountable-filesystem-semantics#4. Cross-platform read-only mount contract]]) generated at the source: a mounted realm snapshot renders manifest-covered names as present, manifest-proven-absent-in-basis as absent *at this basis*, and everything else `UNKNOWN`.
3. **A later-surfacing record is evidence, not embarrassment.** If a record signed by a covered actor surfaces outside a manifest that claimed to cover that actor's head, the pair (manifest + record) is durable evidence of omission or device equivocation — the transparency-shaped property of §2.1 extended to manifests.

**How it breaks:** manifests are only as honest as their signer. A hostile exporter simply omits and signs; the reader learns nothing until contradiction surfaces. Manifest trust = signer trust; the grade carried forward must say so (`trustClass` in every observation).

---

## 5. Provider-observation honesty — sync over a dumb relay

If sync rides a rented dumb replica (S3-class, any object store — the [[ethereum-first-efs-and-os#8. Coherent architecture shapes to keep alive|Shape B]] network rung):

**What the provider sees, stated flatly** (the PC-11 ledger applied — [[privacy-pass-synthesis]]): object counts, sizes, write timing/cadence, pull timing per device, device IPs, and — for public-tier records — full plaintext content and graph. Private-tier envelopes hide content, not existence, cadence, or fan-out shape. A "local-first" mode that syncs through a cloud bucket is **provider-observed**, and the rung label must say so; "local" describes authority, not observability.

**Hidden-newer-head detection is structurally limited — exactly how:** any prefix-consistent subset of a realm verifies perfectly (all signatures check, all commitments check, all heads chain). A provider that freezes device B's view at time T while accepting device A's writes shows B a world with **no internal defect whatsoever**. Detection is therefore only ever *cross-channel*:

1. **Retrospective, via counters:** when A and B next share any channel (LAN, QR, a second replica, direct contact), B's basis vector (covering A only to counter 38) against A's knowledge (pushed 41) exposes the gap — after the fact, never at read time.
2. **Second independent replica:** withholding then requires collusion across operators.
3. **Provider attestation (if the JL-2 rung is used):** a countersigned `(headDigest, receivedAt)` converts silent withholding into provable contract breach — the provider must now *lie in writing* rather than merely stay silent.
4. **Chain anchor:** bounds any replay to pre-anchor state for every device that can reach the anchor venue.

**The structural floor, said exactly:** a single dumb provider serving a fresh device with no remembered basis, no second channel, and no anchor **cannot be caught**. Freshness in local mode is a liveness property with cross-checks, not a safety property with proofs. This is the freshness-bootstrap problem of [[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]] and it is irreducible below the witnessed rung; the honest client answer is the `UNKNOWN-CURRENCY` label plus the §3.3 head hint.

---

## 6. The cannot-do ledger (ruling-5 deliverable)

What local-only mode **structurally cannot provide**, why, and the honest degraded substitute. Rows extend the loss list in [use-cases.md](./use-cases.md) §4 (their L1–L10, mapping noted) with the structural argument and substitute each row was owed. The six capabilities the lane charge named are rows 1–6.

| # | Cannot do | Why — structurally, not contingently | Honest degraded substitute | Maps to |
|---|---|---|---|---|
| 1 | **The strong authority grade** — reject a stolen-key *backdated* record | No admission witness exists: nothing observed the record while the grant was live, and signatures carry no trustworthy creation time, so a revocation has no objective position relative to any record ([aa-inversion.md](./aa-inversion.md) §3.3; [[human-overview#2.1 Evidence is not authority]]) | Pre-rotation caps what a thief can do to the *control chain* (venue-free, §3.3); cross-device/witness "observed-before-revocation" testimony as a labeled heuristic; **excluded from all safety gates**; upgrade = admission at an authority domain | L4 |
| 2 | **Definite revocation / current-key answers** | The withheld-fork problem: a reader shown KEL events 1..k cannot know k+1 exists; no canonical ordering selects among competing chains for a third party ([aa-inversion.md](./aa-inversion.md) §3.1) | Qualified answers only: `CURRENT-in-realm@basis` / `SNAPSHOT@H` / `UNKNOWN-CURRENCY`; gate-grade consumers fail closed | L1-adjacent |
| 3 | **Contract gates and on-chain composability** | No autonomous third party can read your laptop; bounded-gas readability requires the record graph resident in venue state (N2b, [[owner-decision-inbox]]; [[onchain-completeness]] line) | None — this is the venue's unique power (§7); export/promote is the path | L5 |
| 4 | **Schema/shape verification as *enforcement*** | Two-layer: locally there is no admission choke point, so nothing forces the next writer through any check; and even on-chain the kernel is deliberately schema-free ([[fs-pass-synthesis#Classic-FS dispositions — the master table (native / re-homed / gone)|"Schema — GONE from kernel"]]) — what a venue adds is one *shared admitted set* so every reader's lens applies the same verdict to the same records; locally each replica may hold different sets, so "this folder validates" is per-basis testimony | Publisher-side pre-flight + lens-side validation with a DECLARED basis; promotion pre-flight re-checks (§7.2) | — (new row) |
| 5 | **Mandatory indexing / global discoverability** | Force-indexing is admission-coupled ([[owner-rulings#2026-07-15]] item 12): no admission, no force. Local indexes are private derived caches; strangers cannot query what they cannot reach, and no one can prove a local index complete (row 2) | Same query *shapes* as derived caches for self and invited peers (§1.2); publication is the discoverability path — by ruling, the client-only escape hatch is also the privacy feature | L8, L9 |
| 6 | **Proof-against-withholding** | Signed data cannot prove the nonexistence of newer or additional signed data; any peer/provider can serve a defect-free consistent subset (§5) | Multi-path replication; retrospective gap detection via head counters; equivocation/omission *evidence* when contradictions surface; anchors bound the damage window | L1, L2 |
| 7 | **Canonical public order + trustless existence-time** | `order` is author-controlled testimony (Q1's whole point); no neutral observer sequences events | Version vectors give partial order among own devices; mutual head references give *relative* existence testimony (A's head covering B's record proves it predated A's head — bounded-before evidence within the realm); an anchor gives coarse existence-since at the anchor venue | L3 |
| 8 | **Permissionless third-party durability & completion** | Replicas are bilateral contracts with named operators; no shared coordination point exists where a stranger can pay to preserve or finish your data | Multiple replicas; **byte durability is separable**: Arweave is purchasable chain-free (bytes permanent, records still local) — durability without authority; the venue's permissionless completion ([[large-file-uploads]] pattern) is the real fix | L6, L10 |
| 9 | **Credibly-neutral admission (censorship resistance)** | Your provider can refuse you; there is no permissionless write lane into infrastructure you don't operate | Operate your own replicas; multi-provider spread; the permissionless venue is the fix | L7 |
| 10 | **Revocation-aware live counts / shared graph state** | Requires one shared, complete, current view — three properties local mode lacks (rows 2, 5, 7) | Per-basis local counts labeled as such; never gate anything on them | L9 |

**The product ladder this table prices** is [[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]]'s: local-sovereign → network-replicated → (provider-attested) → witnessed → chain-authoritative — each rung buys back specific rows (witnessed buys the damage-bounding half of 6/7; chain buys everything). What pure-local still does *well* is the [use-cases.md](./use-cases.md) §4 keep-list, unchanged and real: exact authorship evidence, content integrity, the full data model with history, deterministic lens resolution with honest grades, mounting/export/walk-away, visible-conflict sync, verified package execution, and the best metadata privacy EFS offers — not publishing.

---

## 7. Contracts as the unique power — the flip side, and the promotion journey

### 7.1 What on-chain EFS uniquely enables

The contrast is the product story: **local = sovereign + free + private; on-chain = shared + composable + strong.** The owner-ruled line already says it: *"private/local = your business; on-chain = everyone's to use"* ([[owner-rulings#2026-07-15]]). Enumerated, each with its register/use-case anchor ([use-cases.md](./use-cases.md)):

1. **Bounded-gas contract reads of files and graph** — a folder-gated mint, a fully on-chain NFT, an escrow releasing on an attested deliverable (G-DAPP-1/2/3; R-CR1/2) — an *autonomous* program that is nobody's client consuming file state. Nothing off-chain can offer this at all (§6 row 3).
2. **Admission-ordered authority** — the strong grade; the package-registry account-takeover defense (G-PKG-1, R-AU3) — the only known answer to post-revocation backdating (§6 row 1).
3. **Credibly-neutral shared indexes** — everyone sees the same backlinks/enumeration/contentHash-lookup with positive closure, no trusted indexer (the mandatory bundle, [[owner-rulings#2026-07-15]]) — turning §6 rows 2/5 into `PROVEN`.
4. **Permissionless evidence markets** — anyone can relay, promote, or *finish* another's upload against a signed manifest ([[large-file-uploads]]; §6 row 8's fix); author ≠ payer (R-MODE3).
5. **Neutral existence-time** — `admittedAt`-class evidence with named consumers (E3; G-LEGAL-1).
6. **Cross-author atomicity** — Alice-AND-Bob-or-neither via escrow/commit contracts conditioning on admission facts ([[fs-pass-synthesis#Classic-FS dispositions — the master table (native / re-homed / gone)|re-homed to chain-layer]]).
7. **Censorship-resistant admission** and **public revocation-aware live state** (§6 rows 9/10).

**How the flip side breaks:** every one of these is bought with permanent public metadata exposure (on-chain = force-indexed = graph-exposed by construction, [[owner-rulings#2026-07-15]]), real gas cost (E2's unproduced bill), and irreversibility. The product must sell the ladder, not shame the lower rungs.

### 7.2 The promotion journey, step by step

Local file → published on-chain, identity preserved (journey (d) of [use-cases.md](./use-cases.md) §3, elaborated from this seat):

1. **Select + close.** User picks records/subtree; client computes the dependency closure (records + TAGDEFs + placements + the KEL events/grants admission will check).
2. **Pre-flight.** Sensitivity check (public-by-default warning; R-PRIV2 intake guardrails — this is the moment "make permanent" must confront "make public forever"); shape/lens validation (§6 row 4's substitute); tier/cost pricing including any signed `contractReadable` floor (T3 note, §10); **stale-epoch check** — records signed under a superseded `authEpoch` are re-carried under fresh envelopes, identity unchanged (§1.3).
3. **Establish authority (KEL-mode).** If not yet incepted at the authority domain, admit the KEL chain + grants first (the evidence→authority lane crossing of seam 3, [[human-overview#7. The seams that must be closed]]).
4. **Submit the already-signed envelopes.** Sign-once/submit-chunks, resumable, relayer-payable ([[large-file-uploads]]; blessed pattern 1). The bytes that were local truth become venue submissions unmodified.
5. **Admission.** Venue checks grant/epoch/revocation, mints `AuthReceipt`s, force-indexes everything, honors the byte-tier choice (Arweave replication per the storage ruling).
6. **What changed:** grade (`PORTABLE-EVIDENCE` → `AUTHORITY-ADMITTED`), ordering (venue admission order now exists where only vectors did), exposure (public, force-indexed, permanent — the one-way door), reach (strangers, contracts, relayers), durability class. **What did not change:** claimIds, object IDs (owner/salt-derived, venue-free — [[human-overview#2.5 Content authority is not transport authority]]), content commitments, pre-promotion links (they resolve unchanged), and the local realm itself — promotion is **additive**; it does not erase local history, does not backdate (admission time is now; `order`/`claimedAt` stay testimony), and does not make the venue the realm's master.

### 7.3 The post-promotion sync-state vocabulary (new product surface)

After promotion the same slot can advance locally while the venue holds the old value. The client must track a promoted-basis per slot and surface git-grade states: `LOCAL-ONLY` / `PROMOTED-SYNCED` / `LOCAL-AHEAD` / `CHAIN-AHEAD` (another device promoted) / `DIVERGED`. Without this vocabulary, §3.1's break (local revert of a published slot) and §9.4's failure (believing local = global) are both live. This is UX law under JL-1, not protocol surface.

---

## 8. Local-first precedent check — what must be matched, and the named residual

The bar ordinary local-first products set, and EFS local mode's answer — **without inventing a consensus system**:

| Precedent behavior | Bar | EFS local mode |
|---|---|---|
| Offline windows | weeks-to-months are normal, merge on return is bounded and predictable, no re-clone cliff | **Met by construction**: confluent fold, order-independent (§2.3); cost is linear in backlog; *unbenchmarked* (Confidence) |
| Conflict UX | never silently lose an edit; Dropbox "conflicted copy" is the floor; silent LWW (stock notes apps) is the anti-pattern | **Met + exceeded**: deterministic winner, loser retained with provenance, objective concurrency detection via vectors, `CLOCK-SKEW-SUSPECT` flag (§2.4); conflict-*set* review required at scale |
| Sync status | per-file truthful state ("syncing / up to date / offline") | **Met differently**: the rung + grade + §7.3 vocabulary — richer and more honest, and it must never fake the one thing it can't have (next row) |
| "You are up to date" | products answer this **by trusting their server as witness and sequencer** | **The refused behavior.** This is the ethereum-first blind spot named honestly ([[ethereum-first-efs-and-os#Joined blind spots to keep visible]], "non-chain rollback and conflict"): *signatures alone do not choose a newest head, detect a hiding provider, or guarantee availability.* EFS local mode does not counterfeit it |
| Recovery/restore | restore from cloud onto a new device "just works" | **Met with a caveat surfaced**: restore works; *currency* of the restore is `UNKNOWN` until a cross-check (§5, §9.1) — precedent products have this same hole and hide it; EFS labels it |

**The residual, stated once:** freshness. Mainstream local-first sync buys it with a trusted server. EFS's honest replacements, in escalating strength: the user as arbiter (signed merge checkpoints — a personal realm needs no more); quorum-of-own-devices acknowledgment; a *named*, optional provider attestation (JL-2 — the same trust the incumbents hide, made visible); an anchor on any chain (witnessed); the venue (authoritative). Teams use closed-membership quorums (C7-legitimate); anything with open membership graduates to a chain — that boundary is Q3A restated for sync, and it is where local mode *stops* rather than growing a consensus protocol.

---

## 9. How it breaks — the five scenarios

### 9.1 A sync provider withholds the newest head

Walk: Alice's laptop pushes counters 39–41; the provider serves her phone a world frozen at 38. Every check passes on the phone (§5). Detection: none at read time; retrospective on any cross-channel contact; bounded by an anchor if one exists. **Worst case — fresh-device bootstrap:** a new device restoring from the provider has no remembered basis and accepts the frozen world *as current* silently. Mitigations, in order of strength: the §3.3 head hint in recovery factors; a second replica; the anchor rung; and unconditionally the UI rule — a restored realm reads **"restored as of \<basis\>; currency unknown until confirmed"**, never "up to date." Residual after all mitigations: a provider+thief who also control the second channel and the victim's anchors win; below the witnessed rung that is irreducible (§6 row 6).

### 9.2 Two devices diverge for a month

Walk: laptop offline four weeks; phone active. Reunion: union + fold, deterministic, no cliff (§2.3). The genuine hazards are product-shaped, not protocol-shaped: (a) conflict-set volume — must render as one reviewable changeset, not 400 dialogs (§2.4); (b) clock skew — the laptop's TIDs may all lose (or all win) LWW against the phone's; vectors catch the causal disagreement, `CLOCK-SKEW-SUSPECT` flags it, the user re-asserts; the fold never bends (§2.4); (c) stale `authEpoch` if a rotation happened meanwhile — re-carriage at next promotion, identity unchanged (§1.3). A month is the *normal* case local mode must be sized for, not the disaster case.

### 9.3 A stolen device replays old exports as current

Walk: thief holds Alice's old device/bundle. Everything in it verifies forever — it *was* Alice's. Three distinct frauds: (a) **presenting the stale bundle as Alice's current state** to a third party — undetectable from the artifact alone; the defense is grade discipline: a bundle is `SNAPSHOT@basis`, never `CURRENT`, and any consumer needing currency checks Alice or a venue (§6 row 2); (b) **continuing to sign** with unrevoked-locally keys — local revocation is gossip, not guarantee; a partitioned reader honestly cannot know; KEL-mode pre-rotation at least prevents the thief from *advancing the control chain* (§3.3); the strong cutoff needs the venue (§6 row 1); (c) **minting a fresh "Alice realm"** and syncing it to a new provider — realms assert nothing exclusive (§1.1); consumers who treat any signed pile as identity-authoritative have made the error the grade vocabulary exists to prevent. Local mode's honest posture: theft of a device is theft of *evidence and (until revoked everywhere) signing power*; only an authority domain turns revocation into a wall.

### 9.4 A user believes a local draft is globally final

The honesty rule that prevents it — proposed as product law (JL-1): **no UI surface may render local-sovereign or replica-observed state with the vocabulary of published state.** "Saved" always carries its rung; "final"/"published"/"permanent" are reserved for chain-admitted (and "permanent" further gated by the L8 preservation-wording decision, [[owner-decision-inbox]] L8). The mount projects the same truth (grade/basis via `user.efs.*` xattrs — [[mountable-filesystem-semantics#5. Synthetic inode and metadata policy]]); the promotion ceremony is explicit, never ambient (no silent background publishing — publication is the one irreversible act in the system and deserves a click). This is [[ethereum-first-efs-and-os#13. What success would look like]]'s criterion — *"non-blockchain users can use the OS without being told a local draft is globally final"* — made enforceable.

### 9.5 Malicious public data into the local resolver (the standing pair)

Inherited and unchanged from the pass frame: a realm ingests foreign evidence (invited peers, bundles); the resolver/daemon treats every artifact as untrusted input under bounded parsing and resource budgets ([[ethereum-first-efs-and-os#Joined blind spots to keep visible]] — "malicious public data is an input to a kernel-facing daemon"). Local mode adds one specific: **imported bundles are the local attack surface** — import must verify before admit, quota before fold, and never let a hostile bundle's TIDs/heads displace the realm's own conflict evidence.

---

## 10. Tensions T1–T4 from this lane's seat

**T1 — chains-don't-die vs stranded homes.** Local mode sits *outside* the assumption's scope, and that placement sharpens it: a local realm **can** die (device loss, provider exit) — which is exactly why §3's export/backup and the anchor rung exist. The adopted assumption ([[owner-rulings#2026-07-10]]) covers chains-as-read-venues; this lane leans on it in one place only — the **anchor rung's strength** (an anchored head stays checkable forever because the anchor venue persists). The open membership-scope question (does the assumption cover any L3 a realm might anchor to?) is the same axis [aa-inversion.md](./aa-inversion.md) §6.1 and [use-cases.md](./use-cases.md) T1 surfaced for E1/J4; anchoring is deliberately venue-promiscuous here, so local mode is *insensitive* to how James scopes it — a devalued anchor venue degrades one rung, not the mode. Surfaced, not silently resolved.

**T2 — the L1 pointer vs the stop-rule.** Local mode adds **zero pressure for the pointer**, and mild pressure against needing it: realms are declared, private, and self-scoped (`realmId`), witnessing anchors go to *any* reachable venue with no locator, and nothing in §2–§5 wants a global principal→home map. This corroborates the [use-cases.md](./use-cases.md) §5.8 finding (nothing in the MUST set forces the pointer) from an independent seat. Consistent with the 2026-07-23 correction ([[owner-rulings#2026-07-23]]), argued, not assumed.

**T3 — large on-chain files vs the item-16 calldata line.** Local mode's touchpoints: (a) the [[large-file-uploads]] one-signature `chunksRoot` manifest works unchanged over local carriers — a local disk is just a `ByteStore`, chunks verify against the author-committed root, so large files are first-class locally with zero venue machinery; (b) tiers are a *venue* concept — locally all bytes are carrier-grade `local`, and promotion is where the tier trilemma bites; (c) one wrinkle: the `contractReadable` floor is **author-signed** ([[large-file-uploads]] ruling 1), so a local signer commits it before venue costs are visible — promotion pre-flight (§7.2) must price it, and re-signing to change it is a new record. No conflict with either ruling; the [use-cases.md](./use-cases.md) T3 tier reconciliation stands.

**T4 — two-grade hypothesis vs maximal topology vs N1 axes: kept separable.** Local mode is the weak grade's **native habitat** and validates its floor content exactly as [aa-inversion.md](./aa-inversion.md) §6.4 derived it: what §6 rows 1–2 refuse is precisely what `PORTABLE-EVIDENCE` structurally cannot promise, on any chain or none. Nothing in this design presumes an authority topology: heads, manifests, anchors, and promotion are venue-parametric; the strong grade is unreachable locally under *every* N1 option, so no local-mode choice leaks into N1. The maximal per-principal-home topology stays demoted and untouched here.

---

## Reconciliation ledger

Existing choices/requirements this lane touches, disposed explicitly:

1. **Chains-don't-die ([[owner-rulings#2026-07-10]])** — **still-valid; scope-sharpened**: local realms are explicitly outside it (they can die; hence export/anchor); the assumption is load-bearing only for the anchor rung's permanence. Venue-class membership stays the open E1/J4 axis (§10 T1).
2. **Public-by-default + sensitivity layer ([[owner-rulings#2026-07-10]])** — **still-valid**; local mode is the ruled client-only escape hatch *formalized*; the promotion pre-flight is where the sensitivity layer earns its keep (§7.2).
3. **Mandatory automatic indexing ([[owner-rulings#2026-07-15]])** — **still-valid, boundary clarified**: force-indexing is admission-coupled and does not extend to realms; local derived indexes are caches offering the same query shapes (§1.2). **Newly-exposed:** one cross-mode read API (same shapes, different `ObservationBasis`) as an SDK requirement.
4. **Q4A checkpoints-as-ordinary-claims ([[owner-decision-inbox]] Q4)** — **still-valid and load-bearing**: `RealmHeadV1` is an ordinary reserved-key claim; zero kernel HEAD machinery added (§2.1). This lane is evidence *for* Q4A.
5. **Q3A / canon C7 (op-folds only in closed containers; public collab = revision-DAG + curation)** — **still-valid, validated**: personal realms are closed containers; the open-membership boundary is where local sync stops and chains start (§8).
6. **FS-pass canon C1–C14 ([[fs-pass-synthesis]])** — **still-valid, reused**: C3/C4 (testimony never comparator) govern `signedAt`; C8 view parameters govern manifests/bases; P10 deviceBits **elevated** from convention to load-bearing realm sync state (§2.3).
7. **The consistency statement ("per-venue consistent, eventually-replicated, never globally-linearizable")** — **still-valid, extended**: confluence is what makes realm↔venue fold equivalence hold given the same record set (§2.3) — the sentence that makes promotion identity-preserving.
8. **KEL envelope seam `authorityId`/`authEpoch` ([[kel#8. Envelope seam and admission|kel §8]])** — **still-valid; two newly-exposed recut gates**: (a) the offline-constructibility invariant — no venue-coupled signed field, ever (§1.3); (b) preserve `claimId`-excludes-actor-carriage so stale-epoch re-carriage keeps identity (§1.3). Both are inputs to the seam-2/seam-3 coordinated recut.
9. **Evidence/authority two-lane kernel (seam 3, [[human-overview#7. The seams that must be closed]])** — **still-valid**: local mode *is* the evidence lane standalone; promotion is the lane crossing (§7.2). This lane is a consumer of that split, strengthening it.
10. **No wallet-signature-derived encryption roots; recoverable/shreddable split ([[owner-rulings]]; [[privacy-pass-synthesis]] PC-4)** — **still-valid, carried**: the local vault follows the privacy substrate; JD-31/32 gates unchanged (§3.3).
11. **Privacy canon PC-10/PC-11 ([[privacy-pass-synthesis]])** — **still-valid, applied**: §5's provider-observation ledger is PC-11 at the sync layer; the local replica remains the strongest read-privacy mode.
12. **Read-only mount requirement ([[owner-rulings#2026-07-22]]; [[mountable-filesystem-semantics]])** — **checked per pass rule 9, passes, with synergy**: a realm/bundle mount is exactly the mount ladder's Phase 0/1 first target; manifests supply the snapshot-mount closure story; `UNKNOWN ≠ ENOENT` generated at source (§4); grades project as bounded xattrs. No local-mode choice forecloses the mount; local mode is its cheapest validation vehicle.
13. **`.efs-bundle` reservation ([[solana#9. Recommended design-time reservations]] #7)** — **still-valid, elevated**: the bundle is local mode's export/backup/walk-away vehicle and needs its normative spec early (§3.2); this lane is its second real consumer after Solana portability.
14. **Use-cases §4 loss list L1–L10 ([use-cases.md](./use-cases.md))** — **still-valid, extended**: §6 supplies the structural-why and degraded-substitute columns; one row added (schema-as-enforcement, row 4) and one separation exposed (byte durability is purchasable chain-free via Arweave — row 8).
15. **aa-inversion residual R1–R7 + two-grade derivation ([aa-inversion.md](./aa-inversion.md))** — **still-valid, consumed**: pre-rotation-verifies-locally (§3.3) and the weak-grade content (§6 rows 1–2) are that lane's findings carried into design; T4 separability maintained (§10).
16. **Ethereum-first §11 blind spot "non-chain rollback and conflict" ([[ethereum-first-efs-and-os#Joined blind spots to keep visible]])** — **addressed-in-draft by this file**: signed-head realm, rollback invariant, completeness manifest, provider-observation honesty, and the named freshness residual are the demanded answers; mark the blind spot design-covered pending critic review.
17. **Cross-chain stop-rule (2026-07-23 correction)** — **respected**: no locator, hub, or bridge machinery introduced; anchor venues are realm-chosen (§10 T2).
18. **J3 (chain-free mode: seam vs shipped mode, [use-cases.md](./use-cases.md))** — **supported, not re-asked**: this file is the design J3A assumes exists; JL-1/JL-2/JL-3 below are the mode's *own* owner axes, disjoint from J3.
19. **Relayed/sponsored writes; spam posture; storage baseline** — **untouched**; promotion consumes them as-is (§7.2).

---

## Decisions for James

Only genuinely-owner items surfaced by this lane. Under the 2026-07-23 sequencing hold these are inputs to the revalidated packet, not a batch to answer today. None re-asks a held N/Q item; JL-4 feeds the collab/OS gates and says so. Reply with codes if answering voluntarily (e.g. `JL-1A`).

### JL-1 — The rung-label honesty rule: product law or guideline?

**Example:** Sam edits a will in the EFS client. It says "Saved ✓". Sam believes the will is permanent and public to his executor. It is on one laptop. Under JL-1A, that UI is illegal: it must say "Saved on this device" (local-sovereign), and only a chain-admitted record may ever say "Published".

- **JL-1A — Adopt as binding product law:** no UI surface (client, mount xattrs, SDK status strings) may render local-sovereign/replica-observed state with published-state vocabulary; every "saved" carries its rung (§7.3's vocabulary + the ladder); "final/published/permanent" reserved for chain-admitted (with "permanent" further subject to L8). **Recommended** — it is the single cheapest defense against the mode's worst failure (§9.4), it operationalizes the adopted honest-guarantees boundary (N2 spirit; [[ethereum-first-efs-and-os#3. A cypherpunk OS is defined by powers, not by putting everything on-chain]] property 9), and it costs zero protocol surface.
- **JL-1B — Keep it a design guideline.** Cheaper to iterate; history says guidelines lose to conversion-rate pressure.

Reason trail: §9.4, §7.3; [[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]]; [use-cases.md](./use-cases.md) J3.

### JL-2 — Is provider-attested freshness an allowed labeled rung in the reference client?

**Example:** Rija pays a sync service. With attestation, her phone shows "up to date ✓ (attested by SyncCo)" — Dropbox-grade comfort, trust named, and SyncCo's countersigned heads make withholding provable breach (§5). Without it, her phone can only ever say "no gaps detected as of last cross-check".

- **JL-2A — Allow it as an explicit, labeled, optional rung. Recommended** — it converts the incumbents' *hidden* trust into EFS's *named* trust (strictly more honest than the products users already accept), materially improves §9.1, and keeps the trustless rungs the default. The cypherpunk objection ("no blessed operators") is answered by labeling + substitutability: any provider, user-chosen, evicted freely.
- **JL-2B — Reference client stays trustless-only** (cross-device + anchors); attestation left to third-party clients. Purer; the mainstream cost is that EFS's honest "currency unknown" reads as *worse* than competitors' dishonest "up to date".

Reason trail: §2.2, §5, §8; [[privacy-pass-synthesis]] PC-11 (the provider sees everything either way — attestation adds no new observation).

### JL-3 — Default head-anchoring posture (the witnessed rung's privacy price)

**Example:** Tomás uses EFS purely locally for a journal. If the client silently anchors his realm head to a chain weekly, an observer of that venue learns a pseudonymous something exists and updates weekly — cadence metadata from a user who chose *local precisely for privacy*.

- **JL-3A — Opt-in ("witnessed mode"), surfaced at setup and per-realm. Recommended** — anchoring publishes existence + cadence metadata by construction ([[owner-rulings#2026-07-15]]: on-chain = metadata-exposed, full stop), and local mode's promise is that *not publishing* is the privacy path; the freshness upgrade is real but must be chosen. Pairs with the §3.3 head hint (which is private and should be default-on — it leaks nothing).
- **JL-3B — Default-on with an opt-out.** Stronger anti-replay for the median user who will never find the setting; buys it by making "local" mode emit chain writes by default (also: someone pays gas — sponsorship questions follow).
- **JL-3C — Omit anchoring from the reference client.** Simplest; forfeits the witnessed rung's damage-bounding (§9.1) entirely.

Reason trail: §2.2, §5, §9.1; PC-11; the L2 endpoint-privacy decision family ([[owner-decision-inbox]] L2).

### JL-4 — Local-mode launch scope: single-principal realms only?

**Example:** a family wants one shared local photo realm (three principals, five devices, no chain). Multi-principal realms multiply the witness/quorum, roster, and epoch-rotation surface — the exact machinery the privacy pass gated (JD-31..35).

- **JL-4A — v2 local mode ships single-principal (+ its devices) realms; the `memberSet` field keeps team realms unforeclosed; closed-team realms land with the collab/OS gates (JD-33/34, Q3A machinery). Recommended** — it keeps this mode's new surface at two conventions (head + manifest), and every §6 row and §9 scenario is analyzed and honest for the single-principal case *now*.
- **JL-4B — Design multi-principal closed realms into v2 local mode from the start.** More product sooner; imports the roster/rotation/serialization law into the first cut and couples local-mode shipping to the privacy pass's owed specs.

Reason trail: §1.1, §2.3 step 3, §8; [[privacy-pass-synthesis]] PC-12 + JD-31..35; [[owner-decision-inbox]] Q3.

---

## Confidence

**VERIFIED (read directly from the cited documents this pass):** the envelope seam field set, bare-mode zeros, `claimId` excluding actor/grant carriage, per-actor `prev`-as-hint, and pre-rotation priority order ([[kel]] §5–§8, read at line level); the consistency/confluence statement, C1–C14, the dispositions table, and the five-want decomposition ([[fs-pass-synthesis]]); Q3A/Q4A status and the settled list ([[owner-decision-inbox]]); every adopted ruling cited from [[owner-rulings]] (mandatory indexing + client escape hatch, chains-don't-die scope, storage, recovery baseline, mount requirement, 2026-07-23 corrections); the non-chain capability table, product ladder, freshness-bootstrap problem, blind-spot list, and stop rules ([[ethereum-first-efs-and-os]] §6, §11–12); the portable invariants, capability matrix, `ObservationBasis`/completeness vocabulary, staged-commit and bundle reservations ([[solana]] §3–§4, §7, §9); the mount contract, `UNKNOWN ≠ ENOENT`, xattr profile, and Phase 0–2 ladder ([[mountable-filesystem-semantics]]); the privacy canon rows used (PC-2/4/10/11/12) and JD gates ([[privacy-pass-synthesis]]); the use-cases §4 loss list and journey (d); aa-inversion's gaps (a)–(d), residual R1–R7, and two-grade derivation.

**PLAUSIBLE (my synthesis; falsifiable by the critic and later lanes):** the `RealmDescriptorV1`/`RealmHeadV1`/`CompletenessManifestV1` shapes and the monotone-counter/hash-chain equivocation-evidence claim (standard transparency-log and version-vector practice recombined — no primary-source verification of novelty or sufficiency); the claim that heads+manifests need **zero** kernel surface (they are ordinary claims, but the conventions-registry cut must confirm no reserved-row is required); the §6 table's completeness *as a list* (individual rows are grounded; that no eleventh structural loss exists is judgment); the promotion sync-state vocabulary (§7.3); the JL-2 attestation-rung security argument (countersigned heads = provable breach) — mechanism is sound, incentive analysis unmodeled; realm↔venue fold equivalence (follows from the verified confluence statement *given identical record sets*; the given is doing real work — ingest/eviction policy differences could break it in practice).

**Could not verify:** how much of `ActionContextV1` is author-signed versus admission-recomputed ([[kel]] §8.3 wording is ambiguous at line level) — this is exactly why the offline-constructibility gate (§1.3, ledger #8a) is flagged for the recut rather than asserted satisfied; the final envelope bytes (seam 2 open — "same bytes" is a requirement on the recut, not a fact); whether passkey-sync metadata can carry the §3.3 head hint on all platforms (a platform-capability claim needing prototyping); merge performance after month-scale backlogs and conflict-set UX viability at hundreds of conflicts (no benchmarks anywhere in the corpus; candidate for the E-series alongside E6); [[assumptions-and-requirements]] was consulted only through quotations in other corpus documents (R-K11, R-D8, D-numbering) — a full cross-check of this lane against its requirements register is owed to the synthesis lane; no cost claim in this file is measurement-backed (per [[owner-rulings#2026-07-23]], nothing in the chain/authority space is).
