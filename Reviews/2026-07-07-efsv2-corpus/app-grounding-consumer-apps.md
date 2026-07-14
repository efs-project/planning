# EFS v2 app grounding — five consumer apps walked at the record level (tag-core + native kernel)

**Role:** Application grounding engineer — consumer apps. **Date:** 2026-07-07.
**Baseline:** tag-core (TAGDEF namespace primitive, PIN/TAG kept separate, DATA/LIST owned, PROPERTY string-only interned, LIST_ENTRY→cardinality-N edge + kept LIST declaration, MIRROR/REDIRECT as claims pending their open forks) carried on the native envelope kernel (chain-free EIP-712 Merkle envelope, recovered signer = author, msg.sender ignored, TID `seq`, `claimId = H(author, seq, idx)`, slot supersession by max-(seq,idx), REVOKE-as-record, checkpoints, everyone-pays-own-writes + optional community relayers, no free tier, bare-EOA identity in v2 with KEL/session-keys RESERVED-not-built).
**Sources:** fable-handoff-v2-tag-core.md; 2026-07-07-carrier-decision.md; 2026-07-02-record-format-investigation.md; deterministic-ids.md; efs-substrate-decision.md; arch-B-native-kernel.md; research-efs-coupling-audit.md; contracts/specs/overview.md.
**Status of numbers:** every gas/$ figure below is an estimate assembled from arch-B §7 + the coupling audit §3.5 slot accounting. The handoff itself flags "gas reality — everyone's been assuming numbers." Treat figures as ±2×; the *relative* shape (envelope fixed cost vs per-record cost vs index dominance) is what the verdicts rest on.

---

## 0. The shared machinery every app uses (stated once)

### 0.1 Record kinds assumed (tag-core baseline)

| Kind | Object/claim | Body (payload words) | Owned? | Revocable? | Notes |
|---|---|---|---|---|---|
| TAGDEF | object | `parentTagId, name, kindTag` | **unowned** (Schelling; idempotent dup) | no (path permanence) | `tagId = keccak(DOMAIN, parentTagId, keccak(name), kind)`; carries canonical-name validation |
| DATA | object | `salt` | **owned** (author+salt) | no | pure identity; content rides mirrors |
| PROPERTY | object | `datatype(string), value` | unowned (interned) | no | string-only per current leaning |
| LIST | object | `salt, allowsDuplicates, appendOnly, targetKind, maxEntries` | owned | no | kept as declaration node for gating |
| PIN | claim | `definitionId, targetId, targetKind (+virtual-key words)` | — | yes | cardinality-1; slot `(author, definitionId, targetKind)` |
| TAG | claim | `definitionId, targetId, targetKind, weight` | — | yes | cardinality-N; slot `(author, definitionId, targetId)`; list entries are this shape with `definitionId = listId` |
| MIRROR | claim | `dataId, transportId, uri` | — | yes | cardinality-N per DATA (ADR-0015); open fork "→ property" evaluated in §7 |
| REDIRECT | claim | `sourceId, targetId, kind` | — | yes | movedTo / sameAs / supersededBy / symlink |
| REVOKE | op | `claimId` | — | — | envelope op, not a kind |
| CHECKPOINT | op | `coversSeq, stateRoot` | — | — | per-author completeness commitment |

### 0.2 Cost model (estimate stack, used throughout)

- **Envelope fixed cost:** ~27–35k gas (21k base + ~3k ecrecover + 2–5k EIP-712 hashing + sig calldata). Paid once per `submit()`. `submitOne` adds ~1–2k Merkle verify + re-runs the sig check.
- **Per-record admission:** ranges wildly by kind because **indices dominate**: PROPERTY re-use (already interned) ~10–20k; light claim (TAG/PIN into warm slots) ~100–250k; TAGDEF (path-tree writes, registry) ~150–300k; DATA+registry ~120–200k; MIRROR with a 2–4KB `data:` inline URI ~600k–1.5M (calldata + payload store). arch-B's aggregate anchor: **small file, 7–8 records ≈ 8.5–9.5M gas**.
- **Money (order-of-magnitude):** Base-class L2 at 0.005–0.05 gwei effective: small-file write ≈ **$0.10–1.50**; single-claim envelope (like/follow/list-add) ≈ **$0.005–0.05**; comment with inline body ≈ **$0.02–0.20**. Dedicated L3: divide by 5–20. L1 archival lane: ~$25–30/file. These bracket everything below.
- **Click ladder:** self-pay plain wallet = 2 interactions (sign envelope + send tx); relayed = 1 (sign only); **there are no session keys in v2** (KEL reserved) — every envelope is a wallet prompt for a wallet-held key, or zero prompts for an app-held hot key *which then IS the identity* (key = identity in v2). This constraint bites repeatedly below.

### 0.3 Read/verify machinery

- Client computes `tagId` chain offline (one keccak per segment), then point reads: `getObject(tagId)` → exists; `getSlot(slotId)` per lens author in order (first-attester-wins) → placement; winning author's MIRROR claims + `contentType` PIN; fetch bytes; verify `contentHash`.
- Trustless verify of any single record (home chain or copied): `(EnvelopeHeader, Record, merklePath, index, sig)` → recompute leaf/root → ecrecover → author. ~3–10k gas on-chain; free offline.
- Enumeration reads (directory listing, feed, list entries) are **per-author** — the kernel's kept indices are per-author by design; global enumeration is demoted to labeled-untrusted discovery (events/indexers). This asymmetry is the single most verdict-relevant fact in this grounding (§6.1).
- Read-grade vocabulary is normative: *proven-absent* (non-inclusion vs checkpoint) ≠ *unknown*; lens resolution MUST NOT fall through on unknown.

---

## 1. App 1 — Personal file browser / personal site

Alice maintains a browsable tree (`/…/site/index.html`, `/docs/`, `/photos/thumbs/…`) served over web3:// or any EFS client.

### 1.1 Namespace choice (first awkwardness, before any record is written)

TAGDEFs are **unowned**. If Alice roots her site at a global vanity path `/alice`, anyone else can PIN different content at `/alice/index.html` and *the reader's lens decides who wins*. Under the default-lens chain a stranger visiting `web3://…/alice/` sees whatever the default lens (system/curated) resolves — Alice has no protocol-level claim to the name. The correct pattern is the **address container**: `parentTagId = bytes32(uint160(alice))` — a self-certifying root only meaningful through Alice's authorship. Vanity naming is a *lens/ENS-layer* service, not a kernel one. Apps must be told this loudly; users coming from DNS will assume name ownership that does not exist. (Not a defect — it is the credible-neutrality design — but it is the #1 onboarding surprise.)

### 1.2 Writes, record by record

**Create folder `photos/thumbs` under her container** (first time):
one envelope, 2 records, parents-first:

| # | kind | body | signer | payer |
|---|---|---|---|---|
| 1 | TAGDEF | `(aliceContainer, "photos", KIND_GENERIC)` | Alice | Alice or relayer |
| 2 | TAGDEF | `(tagId₁, "thumbs", KIND_GENERIC)` | Alice | same |

Idempotent if they exist (someone else may have instantiated the same derived ids — harmless; unowned).

**Save a 3KB `index.html`** — one envelope, ~8 records (~8.5–9.5M gas ≈ $0.1–1.5 L2):

| # | kind | body | notes |
|---|---|---|---|
| 1 | DATA | `salt` (CSPRNG, persisted in WritePlan) | owned; dataId known offline |
| 2 | TAGDEF | `(siteTagId, "index.html", KIND_DATA)` | the naming slot |
| 3 | PROPERTY | `("string", "text/html")` | usually already interned → ~free |
| 4 | MIRROR | `(dataId, /transports/data, "data:text/html;base64,…")` | bytes ride calldata → kernel store |
| 5 | PIN | placement: `(fileTagId, dataId, KIND_DATA)` | cardinality-1 slot |
| 6 | PIN | `contentType` virtual-key binding → property₃ | reserved key, no TAGDEF needed |
| 7 | PROPERTY+PIN | `contentHash` = multihash string | verify anchor for every future read |
| 8 | PROPERTY+PIN | `size` | |

Plus **ancestor visibility TAGs** (`TAG(def=KIND_DATA-visibility, target=folderTagId)`) for each untagged ancestor — first upload into a subtree only; rides a follow-up envelope when gas requires (deterministic-ids §5 carve-out survives the kernel unchanged, or dies entirely if the kernel-walk alternative is chosen — either way not app-visible).

**Edit the file.** Two possible shapes and the spec currently blesses neither:
- (a) **new DATA** + new MIRROR/props + re-PIN the placement slot (supersedes O(1)) + `REDIRECT(oldData → newData, supersededBy)`: ~7 records, full version history, old bytes remain addressable.
- (b) **mutate around one DATA**: revoke old MIRROR, add new MIRROR, re-PIN `contentHash`/`size`: ~5 records, cheaper, but the dataId now denotes different bytes over time and third parties who cited `(dataId, their-own contentHash claim)` fork from Alice's view.
Both are legal. Apps will disagree, and lenses will disagree about "what is this file now." → model change #4 (§8): the Codex must pick (a) as THE convention and label (b) an anti-pattern for placed files.

**Rename `notes.txt → ideas.txt`:** new TAGDEF (ideas.txt) + PIN at new slot + REVOKE old placement PIN + `REDIRECT(oldTagId → newTagId, movedTo)` = 4 records, one envelope. Old path never structurally 404s (TAGDEF permanent; REDIRECT re-points). Correct but ceremonial — 4 records to rename is the price of path permanence; acceptable, must be SDK-packaged as one verb.

### 1.3 Reads

- Path resolve: k keccaks offline + `getObject` + per-lens `getSlot` — O(lens length), ~5–10k gas each if a contract does it; trivial for an RPC client.
- Directory listing: per-author children pages (kept path tree + per-author visibility) under the reader's lens. For a personal site the lens is `[alice]` — single-author, clean, fast.
- Trustless client: recompute every tagId; verify Alice's placement claims by envelope sig if reading from a replica; verify bytes by contentHash. Full verify-don't-trust holds end-to-end. **This app is the model's home turf.**

### 1.4 Moderation / deletion

Alice REVOKEs placement PINs and MIRRORs → file leaves her lens; TAGDEF (the name string!) and inline `data:` bytes are permanent chain state. Two honest consequences: (1) **filenames are unerasable public strings** — `divorce-lawyer-quotes.txt` is forever; salted TAGDEFs (deterministic-ids §8) are the mitigation and MUST survive the tag-core port; (2) published bytes can only be un-*served*, never un-*stored* — the permanent-archive doctrine, fine for a site, needs plain-language user warning. Expiry: irrelevant here.

### 1.5 Portability

Export Alice's envelopes (or let anyone copy them) → replay on any L3 → identical tagIds, identical dataIds, site resolves natively; her EOA-recovered authorship intact. Inline `data:` mirrors make the *bytes* travel with the claims — a personal site is fully self-contained in its envelope set. Snapshot-not-feed caveat applies (edits don't propagate). This is the cleanest portability story of the five apps.

### 1.6 Verdict: **WORKS.**
Warts: vanity-name expectation gap (education, not mechanism); rename/update ceremonies need SDK verbs and one Codex convention (#4); permanent-names privacy hygiene.

---

## 2. App 2 — Blog with stranger comments

Bob publishes posts; strangers (no prior EFS presence, possibly no ETH) comment; readers see posts + comments.

### 2.1 Posts

Same as App 1 file saves under `/0xBob/blog/posts/2026/07/why-tags.md` (~8 records each). Post updates use convention (a) above; the placement slot's supersession gives readers "current version" for free, `REDIRECT(supersededBy)` chains give history.

### 2.2 Where do comments *live*? (the model gets awkward immediately)

The natural shape — a comments container *under the post* — is illegal: the kind-attachment matrix allows only KIND_PROPERTY children under a KIND_DATA name-tag. So comments must live in a **parallel container**: `/0xBob/blog/comments/<post-slug>/` (generic TAGDEF chain), linked to the post only by app convention (the shared slug). Anyone can instantiate the container TAGDEFs (unowned, derivable offline); the first commenter pays ~1–2 extra TAGDEF records, later ones include them defensively (idempotent no-op) or omit after a registry read.

A note on naming the container: using the post's dataId hex as the segment name collides with the container classifier's 64-hex precedence (Address > Schema > Attestation > Tag) — apps should use slugs or a prefixed form (`d-<hex>`). Small, sharp edge; belongs in the SDK.

**One comment** — one envelope, signed by the commenter, ~5–7 records (~$0.02–0.20 L2):

| # | kind | body |
|---|---|---|
| 1–2 | TAGDEF ×2 | comments container segments (idempotent, usually no-op) |
| 3 | DATA | commenter's salt |
| 4 | MIRROR | `data:text/markdown;base64,<comment body>` |
| 5 | PROPERTY+PIN | contentType (interned → cheap) |
| 6 | TAG | `(commentsContainerTagId, commentDataId, KIND_DATA, weight=0)` — the attach edge |

Optionally `PROPERTY+PIN replyTo = "<parent comment dataId hex>"` for threading (string-only property carrying a ref as hex — works, ugly; see §7 string-only note).

**Who signs / who pays.** The commenter signs (author = commenter — non-negotiable; lenses key on it). Payment: (i) self-pay (needs gas — kills drive-by commenters), or (ii) **Bob's community relayer**: browser generates a burner EOA (key = identity — a burner identity per site is actually fine for drive-by comments), signs typed data, POSTs the envelope; Bob's relayer verifies, applies budget policy (~50 lines), submits. Bob pays ~$0.02–0.20/comment. Spam lands on Bob's relayer budget as rate-limiting, and on his curation as filtering — both his own knobs. Self-pay remains the censorship floor if Bob's relayer refuses.

### 2.3 The read that decides the app: enumerate stranger comments

The blog app must render "all comments on this post" from **authors nobody has opted into**. This is the exact read the kernel's index posture does not serve trustlessly:

- TAG accumulation indices are **per-author** (`slot = (author, def, target)`; buckets keyed by author). Enumerating a container across *unknown* authors requires either a **container-keyed cross-author index** (does not exist in the kept set — global enumeration is demoted) or the **discovery lane**: full-payload events consumed by any indexer, labeled untrusted.
- With the indexer: the app lists candidate comments, then verifies each one individually (envelope sig → author; bytes → contentHash) — **per-item trustless, enumeration-complete only as far as you trust the indexer**. "There are no hidden comments" is unprovable; "this comment is really by author X" is provable. For comments, per-item authenticity + best-effort completeness is honestly fine.
- The *curated* alternative: Bob (or his moderators) re-attest approvals — a LIST `approved-comments` per post, or a TAG from Bob onto each approved commentDataId. Readers resolve through **Bob's lens** and get a moderated, trustlessly-enumerable comment section — at the price of **one Bob-write (~$0.01) per approved comment** (moderation-as-writes) and Bob's liveness on the approval path.

So the app has three modes: unmoderated-via-indexer (cheap, untrusted enumeration), moderated-via-curation (trustless, costs the moderator per comment), hybrid (indexer for "new", curation for "verified"). All three are buildable; none is free. → model change #1 (§8): decide whether a bounded **container-scoped** cross-author edge index (paginated, append-only, spam-absorbing at attacker's gas expense — the discovery read, not a trust claim) belongs in the kernel. It is NOT the demoted global enumeration; it is keyed by one tagId. It would move this app from "indexer-dependent" to "chain-native discovery, lens-native trust."

### 2.4 Ordering

Comment order across authors: per-author `seq` does not order strangers against each other. Home chain: admission order (block order) is a fine display order. On a replica: only self-asserted timestamps/`seq` — comment threads on a copied blog can be re-shuffled within honesty bounds. Cosmetic for comments; named because app devs will ask.

### 2.5 Moderation / deletion

- Bob cannot delete a stranger's comment — he can only exclude it from his lens/approval list (readers using his lens see it vanish); the record is permanent. Correct per credible neutrality; means "delete" in the UI is really "unlist," and the blog app must say so.
- Commenter deletes own comment: signs a REVOKE (needs a relay again — the burner key must be retained by the browser or the comment becomes unrevokable-by-loss; a real UX trap worth an SDK convention: persist burner keys, or offer "publish under my main identity").
- Cross-chain: a comment revoked at home but copied to an L3 *without its revoke* renders as live with a valid signature (carrier-decision caveat). For comments the stake is low; for *approvals* it is not — Bob's approval TAG revoked at home (comment turned out to be defamatory) but stale on a replica keeps his endorsement alive. Curation claims should carry **author-set expiry** (freshness horizon) so stale replicas fail toward "unknown," not "endorsed" (→ model change #5).

### 2.6 Portability

Anyone (Bob, an archivist) copies the whole discussion: Bob's envelopes + every commenter's envelopes replay onto any kernel; authorship of every stranger's comment verifies from bytes alone. Nothing about the comments needs the commenters to still exist — this is genuinely excellent and unique to the native kernel (EAS delegation could never do this). Incompleteness (missed comments, missed revokes) is the standing caveat; a checkpoint from Bob covers *his* claims only — there is no "the thread is complete" proof and cannot be (cross-author).

### 2.7 Verdict: **WORKS-WITH-WARTS.**
The warts, ranked: (1) stranger-comment enumeration is indexer-mediated or moderation-priced — the model's biggest read-side gap (#1); (2) no legal attachment point under a file — parallel-container convention only (#3); (3) burner-key lifecycle for revocation; (4) approval-staleness needs expiry (#5). None blocks a real blog; all four shape the SDK and two shape the kernel/Codex.

---

## 3. App 3 — Social feed (follows, posts, likes)

### 3.1 Writes

| Action | Records | Envelope shape | Est. cost (L2) |
|---|---|---|---|
| **Post** (≤1KB text) | DATA + MIRROR(`data:`) + contentType PIN + TAG into own `/0xA/feed` container (or appendOnly LIST) ≈ 4–6 records | one envelope, signed by author, relayed | $0.02–0.15 |
| **Follow** | TAG `(followsVocabTagId, bytes32(bob), TARGETKIND_ADDRESS)` — 1 record | 1-record envelope | $0.005–0.05 |
| **Like** | TAG `(likesVocabTagId, postDataId, KIND_DATA)` — 1 record | 1-record envelope | $0.005–0.05 |
| **Unfollow / unlike** | REVOKE(claimId) — 1 op | 1-record envelope | ~same |

Notes:
- The **slot model gives like/follow semantics for free**: TAG slot = `(author, def, target)` → exactly one like per (user, post), idempotent re-like, REVOKE to unlike, re-like later = new claim at same slot (max-(seq,idx) supersession handles it). This is a genuinely elegant fit — no app-level dedup.
- Vocab predicates (`/vocab/follows`, `/vocab/likes`) are unowned TAGDEFs: genesis blob or first-user instantiation; every client derives the ids offline. No authority needed to mint a predicate — good.
- **Micro-claim overhead:** a 1-record envelope pays ~30k envelope tax on a ~100–200k record — 15–30% overhead. Clients will want to batch (a session's likes in one envelope) but that delays visibility; instant-UX apps eat the tax. Not fatal; named.
- Posts need no TAGDEF-per-post (posts aren't named files); the feed container + per-author `seq` IS the ordering. TAGDEF cost is not a social-app problem.

### 3.2 Reads

- **Home feed** = for each followed author: read their feed bucket, newest-(seq,idx)-first, K-way merge client-side. Per-author reads are the kernel's *strongest* index shape — N follows = N cheap paged reads or N log-filter subscriptions (ID-keyed topics from a static site — no server). Genuinely good: the feed is trustless, no timeline oracle exists to be captured.
- **Who liked my post / reply notifications** = reverse cross-author read → same gap as §2.3: discovery lane (indexer over events), per-item verifiable, never provably complete. Like *counts* are indexer artifacts. For social this is honestly acceptable (nobody proves like-counts today) but must be labeled: a contract MUST NOT pay out on "N likes" read from an indexer; on-chain consumers gate on *specific authors'* claims (point reads), never on counts.
- Global discovery ("trending") is explicitly out — lens/curator territory. By design.

### 3.3 Economics and the permanence mismatch

Everyone-pays-own-writes prices a like at ~$0.005–0.05 on an L2 (less on an L3) — *and makes it a permanent archival record*. The community-relayer ruling covers payment; nothing covers the semantic mismatch: ephemeral social gestures are being etched into a 100-year archive. Mechanically fine; philosophically the ruled answer ("EFS is an archive; there is no free ephemeral tier") means EFS social is **small-community, relayer-sponsored, permanence-aware social** — not consumer-scale Twitter. The grounding confirms the ruling's own prediction rather than contradicting it. What the apps evidence adds: an **author-set expiry property convention for posts** (readers hide expired posts by default) recovers "ephemerality" at the read layer without touching permanence — cheap, and the same mechanism §2.5/§5.4 need anyway (#5).

### 3.4 Moderation / deletion / multi-device

- Block = lens exclusion (client-side); mute = same; no protocol path, correct.
- Delete post = REVOKE placement TAG + REVOKE MIRROR; inline bytes permanent (drunk-post warning belongs in every client).
- Multi-device posting: TID device bits mean two phones never manufacture equivocation — resolved by reservation §3.5; but **no session keys in v2** means each device holds the same raw EOA key (custody smear) or the user signs on one device only. Social is exactly the persona that wants per-device keys; v2 ships without them. Live-with-it answer: app-held hot key as the social identity (acceptable custody for a social persona; irreversible key=identity trade). Pressure on "does real UX force the KEL sooner" — this app says *yes, sooner than the others* (matches handoff's open stress-test).

### 3.5 Portability

An author's entire social history (posts, likes, follows, revokes) is one envelope set — replays anywhere, graph edges intact because targets are chain-free ids. Copied subsets dangle: a like whose target post wasn't copied reads as target-*unknown* (never "no post") — read-grade vocabulary is load-bearing here and clients must render it honestly.

### 3.6 Verdict: **WORKS-WITH-WARTS.**
Per-author feeds are the model at its best; likes/follows fit the slot algebra perfectly. Warts: notification/aggregation reads are indexer-lane (#1 helps); micro-claim envelope tax; no-session-keys pushes social identities to app-held keys; permanence-vs-ephemerality handled only by an expiry convention that doesn't exist yet (#5).

---

## 4. App 4 — Photo archive (1,000 photos, albums)

### 4.1 The bytes come first (and mostly don't live in EFS)

1,000 photos × 3MB ≈ 3GB. On-chain (SSTORE2/calldata) is ruled out by cost at L1 and still punishing on L2s; the substrate decision itself flags bulk-bytes as an unsolved commissioned workstream ("mirrors + hope"). The realistic layout: **originals on Arweave/IPFS/self-host (MIRROR URIs + contentHash), thumbnails (~20–50KB… still heavy) or tiny previews maybe inline, everything else metadata.** EFS's contribution is the *authenticated catalog*: identity, hashes, names, albums, ordering — which is exactly what rots first in real photo archives. Honest framing for the app: EFS = the catalog of record; bytes = transport-layer with verifiable hashes.

### 4.2 Writes

Per photo (metadata only): DATA + MIRROR(`ar://…`) [+ second MIRROR ipfs://] + contentHash PROPERTY+PIN + contentType PIN (interned) + size PROPERTY+PIN + placement (TAG into album or folder PIN+TAGDEF if user names files) ≈ **6–9 records, ~0.5–1.2M gas ≈ $0.01–0.10 each on L2** → **$10–100 for the full thousand**; an L3 makes it pocket change. Perfectly acceptable for an archive.

**Album** = LIST (owned, `allowsDuplicates=false`) + one cardinality-N edge per member (`TAG(def=listId, target=photoDataId)`); ordering via `weight` (int256 — gapped weights make reorders O(moved)) or order PROPERTYs on the entry slotId. A photo in 3 albums = 3 edges, one DATA — hardlinks are native and this is the model being *good*: no copies, no sync.

### 4.3 The bulk-ingest walk (where the envelope design earns or loses its keep)

1,000 photos ≈ 7,000 records ≈ 700M–1B gas — physically dozens-to-hundreds of transactions. Naively that is dozens-to-hundreds of wallet prompts (no session keys!). The design's own answer is already in the wire format and must be **blessed as a first-class flow**: **sign ONE Merkle root over the whole import** (one `eth_signTypedData_v4`, N=7,000 leaves), then the submitter — the app, a relayer, anyone — chunks submission across transactions via `submitOne`/a `submitRange` variant, parents-first across chunks. Properties that must be specced (they hold today by construction but are folklore):
1. Partial-envelope state is legal and converges: each record admits independently (registry existence checks per record); re-submission is idempotent; interruption mid-import leaves valid-but-incomplete state (DATA without placement) that finishes on resume.
2. Ordering across chunks is the submitter's job (same rule as intra-batch parents-first) — a mis-ordered chunk reverts harmlessly.
3. A completion view (`envelopeProgress(envelopeDigest) → admittedCount/count`) or an SDK-side receipt so importers can resume trustlessly.
→ model change #2. Without this blessed, the photo archive (and every importer/migration tool) is a prompt-storm or a hot-key custody trade; with it, it's one signature + a background upload bar. `count` in the header (truncation-evidence) already supports the progress semantics.

### 4.4 Reads

Album page = per-author list read (owner's lens), paginated; thumbnails via gateway with client-side contentHash verify (the verify-don't-trust render path). A shared family archive = 2–5 authors in the lens; K-way page merge, all kept-index shapes. Search ("photos from 2019") = properties are string-only; date-range queries are client/indexer-side over the owner's own claims — fine at 1,000-photo scale, no kernel change needed (per-author full scan is bounded by the author's own corpus).

### 4.5 Moderation / deletion / privacy

- Delete photo = REVOKE placement/mirror claims; Arweave bytes permanent, self-hosted bytes actually deletable — the *catalog entry* is permanent either way (dataId + contentHash claims). Album membership revokes cleanly.
- **Privacy is the real issue**: filenames, album names, EXIF-ish properties are permanent public strings under plaintext TAGDEFs/PROPERTYs. A family archive wants the **salted-TAGDEF** variant (capability in the URL fragment) + encrypted bytes with key-destruction-as-deletion (holistic §2.3 conventions). The tag-core port MUST carry salted/blinded TAGDEF semantics forward (they were specced for ANCHOR; nothing in tag-core contradicts them, but the handoff doesn't re-state them — flagged so they don't fall out).
- Expiry: irrelevant (archive).

### 4.6 Portability

Copy the envelope set to an L3 → the *catalog* replays perfectly (ids identical, albums intact, authorship provable). The *bytes* do not travel with it — MIRROR URIs point at external transports; a replica's usefulness = catalog + whatever mirrors still answer + contentHash to verify any re-found copy. Honest statement for the Codex: **EFS portability is graph/metadata portability; byte portability is per-transport** (`data:` inline is the only self-carrying transport). The dead-photo-site scenario (Flickr dies) is exactly where the catalog + hashes let descendants re-verify recovered bytes — the 100-year story is real but it is a *catalog* story.

### 4.7 Verdict: **WORKS-WITH-WARTS.**
Warts: bulk-bytes is out of scope by prior ruling (fine, but the app is only half an app without a transport answer); split-submission of one envelope must be specced (#2); privacy hygiene requires salted TAGDEFs surviving the port; string-only properties make date/size range reads client-side (acceptable at personal scale).

---

## 5. App 5 — Curated collections + lens subscription ("follow my lens")

Carol curates: (a) collections of *other people's* content ("best writing on L2 economics"), (b) a published lens — an ordered trusted-author list her followers adopt for resolution.

### 5.1 Writes

**Collection** = LIST(salt, appendOnly=false, targetKind=KIND_DATA or TARGETKIND_OPAQUE for foreign ids) + one TAG-shaped entry per member `(def=listId, target=someoneElsesDataId, weight=rank)` + optional label PROPERTYs on entry slotIds. Cross-author targets are the *point*: edges may reference any object; Carol's claims about Dave's DATA are hers, lens-scoped, and never mutate Dave's anything. ~1 record per curation act, $0.005–0.05 — curation is cheap, which the mission wants.

**Published lens** = LIST(targetKind=TARGETKIND_ADDRESS) whose ordered entries are author words (weights = precedence). ~1 envelope to create, 1-record envelopes to evolve.

**Subscription** = client-side: follower's client reads Carol's lens LIST live and uses it as (part of) the resolution chain. Optionally an on-chain `TAG(follows-lens, carolsListId)` for discoverability. No kernel machinery — lenses stay a read-time parameter, which tag-core keeps intact.

### 5.2 Reads and the resolution surprise

Follower resolves any path: for each author in [self, …Carol's list order…, system]: `getSlot(placement)` — first author with content wins. All point reads, all kept indices; a contract can even do it (`EFSGate`-style, ~5–10k/lookup + lens length). **The surprise nobody will expect:** subscribing to a lens grants every listed author, *in Carol's chosen order*, the power to resolve **any path in the namespace** ahead of lower-listed authors — not just paths Carol curated. Carol adds a compromised author at position 2 → that author's placements shadow everyone below at *every path they squat*, for *all subscribers, immediately* (the list is read live). This is working-as-designed (trust is explicit and total per author) but the UX consequence is that **lens updates are trust-critical events delivered silently**. → model change #5b: subscription convention = **pin the lens version** (client stores the entry-set hash / Carol's checkpoint at subscribe time) and surface diffs for approval ("Carol added 0xEve — accept?"). Pure client convention + Carol's checkpoints; no kernel change; but it must be in the Codex read-semantics chapter or every client will do live-follow by default and the first compromised curator becomes the lens model's reputation-ending incident.

### 5.3 First-attester-wins interactions worth naming

- Carol's collection *entries* are unambiguous (her claims, her lens). But followers browsing a *path* through Carol's lens get first-wins across her authors — for **configs/properties the lens composes** (overrides cascade), for **placements it selects**. Apps must not present "Carol's lens" as "Carol's view" — it is "Carol's *delegation order*." Naming/wording issue, repeated stumbling block in walkthroughs.
- Carol revokes an entry (retracts an endorsement): home chain immediate; replicas stale-serve until the revoke is copied (§2.5's problem, sharper here because endorsement is the product). **Safety-critical lenses (curated-for-kids, malware-free software registries) MUST use author-set expiry / freshness heads**: entries or the list head carry an expiry property; readers past the horizon fail to *unknown* (not to "endorsed"). This is the carrier-decision's own TLS answer made into an app convention — it needs a reserved property key and one Codex paragraph (#5a).

### 5.4 Moderation / deletion

Carol's collections are hers to edit (revoke/re-add entries, reorder by weight — all O(changed)). Nobody else's content is touched, ever. A curated author who turns bad: Carol revokes their lens entry; subscribers pinned to an old version keep trusting until they accept the diff — the pin-vs-live tension is inherent (freshness vs stability) and the convention should default: **live-follow removals, prompt on additions/reorders** (fail-safe asymmetry).

### 5.5 Portability

Copying "what Carol's lens sees" to an L3 is the **natural replication unit** the whole design has been circling: her lens list + her collections + the transitive closure of placements/mirrors/properties by her listed authors at the paths involved. Nothing in the record model resists this — every claim is independently portable — but no tooling concept exists for "lens-scoped export." The read-grade rule prevents the failure mode (missing author state on the replica must render *unknown*, never fall through to the next author — the anti-monotone rule is EXACTLY this app's safety net). → the #1-adjacent tooling rec: define the **lens-bundle** (envelope set selected by lens closure) as the SDK's export/replication unit. Cheap, no kernel change, converts the LOCKSS story from "anyone can copy bytes" to "anyone can copy a *view*."

### 5.6 Verdict: **WORKS** — the model's strongest app.
Curation-as-cheap-claims, cross-author edges, first-wins composition, and portable authorship line up exactly with what a curator needs. The two obligations: lens-update trust UX (pin-and-diff) and freshness/expiry for safety lenses — both conventions, both must be written down before anyone ships a lens marketplace.

---

## 6. Cross-cutting awkwardness ledger (all five apps)

### 6.1 THE gap: cross-author enumeration ("the inbox read")
Every stranger-write surface (comments §2.3, notifications/likes-received §3.2, and any future guestbook/marketplace/review app) needs "enumerate claims at container/target X across authors I haven't opted into." Kernel posture: per-author indices kept, global enumeration demoted to untrusted discovery. The apps split cleanly: single-author and known-author-set reads are flawless; unknown-author reads are indexer-lane. Options priced in §8 #1. This is the one place where the tag-core+kernel model, as written, structurally under-serves two of five apps.

### 6.2 Kind-attachment matrix vs "attach things to files"
Comments-under-a-post (§2.2), annotations-under-a-photo, reviews-under-a-package: the matrix (KIND_DATA → property children only) forces parallel containers glued by convention. Repeated across app walks; either relax one matrix row (generic children under KIND_DATA tags) or bless + spec the parallel-container convention with a derivation-level link (e.g. a reserved child name `~discussion` with defined semantics). §8 #3.

### 6.3 No session keys in v2 (identity = one raw key)
Bites App 3 (multi-device social), App 4 (bulk import prompts — mitigated fully by #2 split-submission), App 2 (burner-key retention for revocation). Bare-EOA-first is the ruled reservation posture; the app evidence says the KEL/session layer will be the *first* post-v2 addition users demand, and the burner-per-site pattern should be an SDK-blessed persona in the meantime. No model change demanded — pressure documented.

### 6.4 Micro-claim envelope tax
~30k envelope overhead on 1-record claims (likes, unfollows, single revokes) = 15–30% overhead. Encourage client-side batching windows; accept the tax for instant actions. No change demanded.

### 6.5 String-only properties
Survived all five apps: refs-as-hex-strings (threading §2.2) are ugly but workable; numeric sort/range (size, dates §4.4) is client-side over per-author corpora — acceptable at personal scale, would hurt a *global* marketplace app (not in this five). No verdict changes from string-only; the on-chain-numeric-consumer app that would flip it wasn't among these five. (Deterministic-ids' typed-literal machinery exists if the leaning flips; nothing here forces it.)

### 6.6 Permanence UX
Three apps need the same two client warnings: names/bytes are forever (write-side), "delete" means "unlist" (read-side). Plus salted TAGDEFs as the privacy escape — must survive the tag-core port explicitly.

### 6.7 Confirmations of flagged traps (tried to break them, failed)
- **PIN/TAG merge trap:** confirmed from the read side — App 1/2's placement read (cardinality-1, O(1), first-wins) and App 2/3/5's accumulation read (cardinality-N, paged) are different ops with different hot paths; a cardinality field would put a branch + degraded slot shape on the single hottest read (path resolve). The trap is real; do not merge.
- **DATA-owned vs TAGDEF-unowned opposite duplicate policies:** confirmed — comment/burner flows depend on unowned-idempotent TAGDEFs (defensive inclusion, races harmless), and owned DATA's byte-identical-or-equivocation rule is what makes permissionless carriage (App 2 comment copying) safe. Opposite policies are both load-bearing.
- **First-attester-wins + read-grade vocabulary:** the anti-monotone rule was load-bearing in Apps 3 and 5 (dangling targets, partial lens replicas). Keep normative.

---

## 7. Kind-set sensitivity (where more/less minimal changes verdicts)

| Variation | Effect on the five apps |
|---|---|
| **Drop LIST → everything a TAG bucket** (more minimal) | App 4 albums lose nothing essential (ordering via weights survives) but App 5 loses the *declaration* node: no appendOnly/maxEntries/dup gating, and — worse — no stable listId for "follow my lens" to point at (a lens subscription needs one object to subscribe to; a bare TAGDEF could substitute but then lens lists collide with path namespace). App 5 drops works → works-with-warts. **Keep LIST.** |
| **MIRROR → reserved property key** (open fork) | Mirrors are cardinality-N (multi-transport redundancy is the point — App 4 uses 2–3 per photo). Property binding is a cardinality-1 PIN slot; the collapse forces either one-mirror-per-file (App 4 verdict degrades: redundancy is the archive) or TAG-bound multi-value properties (a new mechanism = no saving). **Resolve the fork toward keeping MIRROR a distinct cardinality-N claim** (or explicitly give the property collapse a cardinality-N binding, at which point nothing was saved). App-evidence is one-sided here. |
| **REDIRECT → property** (open fork) | Used by App 1 (rename/movedTo) and App 2 (supersededBy version chains). As a string property it loses on-chain existence checks and typed kinds; rename still *works* (client-resolved) but the trustless "old links never rot" walk becomes client folklore rather than checked structure. Verdicts unchanged (works either way); the *quality* of App 1's permanence story is better with REDIRECT as a claim. Mild preference: keep. |
| **LIST_ENTRY → cardinality-N edge** (already in baseline) | Confirmed good across Apps 4/5 — no app missed a distinct entry kind; order-on-slotId + weights covered every need. |
| **Less minimal: dedicated COMMENT/REPLY kind** | Not needed — §2's TAG-attach shape suffices *if* #1 (enumeration) and #3 (attachment point) are answered. A new kind would not fix either gap; don't add. |
| **Less minimal: kernel-level like/reaction kind** | TAG slot algebra already gives exactly-once semantics (§3.1). Don't add. |

---

## 8. Verdicts and the top 5 model changes the app evidence demands

### Per-app verdicts

| App | Verdict | Decisive factors |
|---|---|---|
| 1. Personal file browser/site | **WORKS** | model's home turf; needs SDK verbs (rename/update) + naming-expectation education |
| 2. Blog + stranger comments | **WORKS-WITH-WARTS** | stranger enumeration = indexer or paid curation (#1); no attachment point under files (#3); relayer economics fine at blog scale |
| 3. Social feed | **WORKS-WITH-WARTS** | per-author feeds excellent; notifications/counts indexer-lane (#1); no session keys pushes to hot-key identities; permanence-vs-ephemerality via expiry convention (#5) |
| 4. Photo archive | **WORKS-WITH-WARTS** | catalog superb, bulk bytes out-of-scope by ruling; hinges on split-submission being specced (#2); privacy needs salted TAGDEFs carried forward |
| 5. Collections + lens subscription | **WORKS** | strongest fit; obligations: lens pin-and-diff + freshness expiry (#5) |

**No app is blocked.** The nearest-to-blocked point in the whole walk is App 2's trustless comment enumeration, and it is answerable three ways (#1) without touching frozen surfaces.

### Top 5 model changes (ranked by leverage)

1. **Decide the stranger-read (container-scoped cross-author enumeration).** Either add a bounded, per-tagId (NOT global) cross-author edge index to the kernel as a *discovery-grade* read — append-only, paginated, spam absorbed at writer's gas cost, explicitly labeled "enumeration ≠ endorsement; filter through your lens" — or ratify in the Codex that unknown-author discovery is indexer-lane only and per-item verification is the trust floor. Apps 2 and 3 hinge on this; it is the only finding that plausibly touches kernel index shape, so it must be decided **before** freeze. (My read of the evidence: add it. It is the same read shape as folder browsing, keyed by one id, and its absence converts two of five apps into indexer-dependents, contradicting verify-don't-trust at the discovery layer.)
2. **Bless one-envelope/many-tx split submission as first-class.** Spec partial-envelope admission semantics (per-record independence, parents-first across chunks, idempotent resume, a progress/completion read), plus a `submitRange` batch variant. One signature per import is the ERC-7920 payoff actually cashed; without it, bulk writes under bare-EOA identity are a prompt-storm or a custody trade. Pure spec + one view function; no derivation impact. (App 4; every importer.)
3. **Give "attach to a file" a legal home.** Relax the kind-attachment matrix to permit generic child TAGDEFs under KIND_DATA name-tags, or Codex-bless the parallel-container convention with a *derivable* link (reserved sibling/child name with defined semantics). Today every annotation-shaped app invents its own glue. (App 2; future review/annotation apps.)
4. **Write the mutable-document doctrine into the Codex read semantics:** update = new DATA + re-PIN placement + `REDIRECT(supersededBy)`; mirror/property churn on a placed DATA is an anti-pattern (it forks the meaning of dataId across observers). One paragraph + an SDK verb; prevents ecosystem-wide version-model divergence. (Apps 1, 2.)
5. **Freshness conventions: one reserved `expiry`/freshness property + lens pin-and-diff.** (a) Author-set expiry honored by default reads — the ruled answer to cross-chain revocation incompleteness, currently existing nowhere as a concrete key; safety-critical lenses/curation fail to *unknown* past horizon. (b) Lens subscriptions pin a version and prompt on additions/reorders (live-follow removals). Both conventions + one reserved key; no kernel change. (Apps 2, 3, 5; directly operationalizes the carrier-decision's revocation caveat.)

Honorable mentions (no model change, must land in SDK/docs): burner-key persona + retention for revocability (App 2); micro-claim batching guidance (App 3); salted TAGDEFs explicitly re-stated in the tag-core port (App 4); 64-hex segment-name vs container-classifier collision note (App 2); "delete = unlist" + permanent-names UX language (Apps 1–4); lens-bundle as the export/replication tooling unit (App 5).

---

## 9. Named failure modes (with the app that surfaces each)

| # | Failure mode | App | Severity / mitigation |
|---|---|---|---|
| FM1 | **Silent lens fallthrough on partial replica** — missing author state resolved as "no claim," next author's content served as if authoritative | 5, 3 | High on replicas; already normatively banned (read-grade vocab) — enforce in conformance tests |
| FM2 | **Revoked-but-copied claim served live** (comment, endorsement, curation entry) with valid author signature on an L3 | 2, 5 | Inherent (carrier decision); mitigate via #5 expiry + pull-latest-before-trust for anything safety-critical |
| FM3 | **Hot-key-as-identity custody trade** — app-held key IS the archive identity; theft = permanent identity capture (no rotation in v2) | 3, 4 | Real; document personas (burner-per-site OK, main-identity-in-app NOT); KEL reservation is the eventual fix |
| FM4 | **Relayer budget exhaustion / policy censorship** — sponsored writes stall; strangers silently dropped | 2, 3 | Self-pay floor preserved by design; apps must surface "relayer refused, pay to post" rather than fail silently |
| FM5 | **Vanity-path expectation gap** — user "loses" /alice to a squatter in some default lens; nothing was ever owned | 1 | Education + address-container defaults in SDK; lens-layer naming services |
| FM6 | **Enumeration pollution** (if #1's discovery index ships) — spam floods a container's cross-author bucket; readers wade | 2, 3 | Attacker pays gas per entry; paginate + lens-filter at read; identical to v1's global-index posture |
| FM7 | **Partial-envelope stall** — split-submitted import dies mid-way; DATA exists placement-less until resume | 4 | Benign by idempotent resume once #2 is specced; needs progress view to be operable |
| FM8 | **Stale pinned lens** — subscriber pinned to old version keeps trusting a since-revoked author | 5 | The dual of FM2; default live-follow-removals / prompt-on-additions asymmetry (#5b) |
| FM9 | **Dangling edge target on replica** — like/entry whose target wasn't copied | 3, 5 | Render "unknown target," never "gone"; read-grade vocab again |
| FM10 | **Burner-key loss = unrevokable comment** — drive-by author can never retract | 2 | SDK: persist burner keys; offer main-identity posting; expiry as backstop |
| FM11 | **Version-model divergence** — apps disagree whether dataId means fixed bytes or a mutable document | 1, 2 | #4 Codex doctrine; conformance test that placed-DATA mirror-churn is flagged |
| FM12 | **Comment-thread reorder on replica** — cross-author order is self-asserted off home chain | 2 | Cosmetic; display-order = home-chain admission where available, timestamps labeled self-asserted otherwise |

---

## 10. What I tried to break and couldn't (so the next pass doesn't re-walk it)

- **One-signature-per-write UX** holds for every interactive flow in all five apps (the only strain is bulk import, resolved by #2, and micro-claims, an accepted tax).
- **Slot supersession by (seq,idx)** gave correct semantics for: file update, re-follow after unfollow, re-like, lens reorder, album reorder — no app needed arrival-order semantics; no app could cheat another author via backdated seq (slots are single-author).
- **TAGDEF-per-segment cost** never mattered: folders are created once and amortize; social/feed apps don't use named paths per item; the per-segment record is not the cost problem the handoff feared. The *matrix restriction* (§6.2), not the *cost*, is where TAGDEF bites.
- **Unowned TAGDEF + owned DATA duplicate policies** compose correctly under permissionless carriage in every replay scenario I constructed (races, defensive inclusion, front-run submission → all idempotent or beneficial).
- **Naming vs categorizing confusion**: looked for a case where a user's mental "tag" and "folder" collide destructively — did not find one at the record level (kind is in the derivation; a tag-shaped TAGDEF and folder-shaped TAGDEF with the same name coexist as distinct ids). The confusion risk is UI vocabulary, not model.
- Checked each app against a contract-reader: gating on list membership / specific-author claims = cheap point reads (~5–10k); nothing needed traversal-shaped on-chain reads; the point-lookup-only composability surface survives the app suite.
