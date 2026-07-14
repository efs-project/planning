# FS Pass 1 — Lane report: Deletion, trash, and PRIVACY

**Lane:** deletion honesty / crypto-shredding / private files / private folders / metadata leakage / private-by-default OS pattern
**Ground truth read:** fable-fs-kickoff, fs-feature-space §5/§11, state-brief, codex-envelope, codex-kinds, codex-kernel, read-lens-spec (full), freeze-gates §C, identity (G9/A1–A3), client-os-pressure-report (P8/P9/P13), large-file-uploads (incl. mandatory fix 3 + James rulings), efs-v2-holistic-redesign §2.3, efs-substrate-decision §6.4, ops-doctrine, apps-cookbook, confidence-and-open-decisions.
**Status:** design-pass output, spec-grade where marked NORMATIVE-CANDIDATE; nothing here is ruled until James/critic passes it.
**Date:** 2026-07-10

---

## 0. The one-sentence theses

1. **Deletion:** EFS has exactly one deletion primitive — REVOKE — and it is *hiding, not destruction*. Everything else in the deletion cluster is either a view over revocations (trash), a read-layer mask (WHITEOUT), or key destruction (crypto-shred). Hard delete of bytes/graph **does not exist and cannot**, and this must be a first-class stated tradeoff, not a footnote.
2. **Privacy:** *Permanent ≠ public.* The archive property is about survival, not disclosure. EFS can be private-where-it-matters by composing four already-reserved parts — `contentEncryption`, `keyWrap`, salted/blinded TAGDEF, capability-in-fragment — plus **one genuinely new reserved row this lane proposes (`encryptionKey`)**. The write-graph (author, timing, shape) stays public by construction; the honest project-wide framing is the substrate ruling's: **privacy-possible, not private-by-default (at the protocol layer), never anonymous.** But the OS tier built on top SHOULD be private-by-default (§7).

---

## 1. Deletion honesty

### 1.1 Soft delete is the native and only delete [settled, restated precisely]

"Delete a file" = **REVOKE the placement PIN**. Consequences, each traceable:

- The slot reads **EMPTY** (empty-on-revoke, read-lens-spec P2) — no fallback to a prior claim, no resurrection.
- The DATA object, its bytes, its mirrors, and every historical claim **persist**: objects are permanent and unrevocable; superseded/revoked claims stay reachable by claimId and in the `allClaims` spine with full bodies in state (codex-kernel).
- **Undelete = re-ASSERT** the placement at a new `order`. Free, forever. This is trash semantics with an infinite retention window, at zero extra design cost.
- Batch delete is native: one envelope of N REVOKEs is one signature (atomic).
- "Delete a folder" = revoke your placements/dirnode PIN under it. The TAGDEF path node itself is permanent and unowned — you cannot delete a *name*, only your claims at it. An emptied folder node persists as a Schelling point anyone may repopulate. **Stated disposition: `rmdir` on the namespace is GONE; only your furniture in the room is yours to remove.**

### 1.2 Trash as a view [native; Durable/SDK]

A "Trash" folder is a **read-lens-spec/SDK view over the author's revoked and superseded placements** — enumerate own-author history (spine / `getSlot`'s `priorClaimId` chain), filter disposition ∈ {REVOKED, SUPERSEDED}, render restore = re-assert. Zero new protocol surface. Two honesty obligations:

- **Trash is public history (FM-P10).** Your revocations are permanent, enumerable, timestamped claims. *What you deleted, and when, is legible to everyone forever.* A conforming client MUST NOT present Trash as a private space. (Deleting the evidence of a mistake is itself impossible — the mistake and its retraction are both archived. This is the mission working as intended, and it will surprise users; say it in every Trash UI.)
- **Empty Trash cannot mean destruction.** For plaintext content "Empty Trash" is a UI fiction (at most: drop local caches, un-pin own mirrors). The only real "empty" is §2's crypto-shred, and only for encrypted content. UIs MUST NOT imply otherwise.

### 1.3 Hard delete does not exist — the first-class tradeoff statement [NORMATIVE-CANDIDATE wording]

> **EFS cannot destroy data. Not the author, not a moderator, not a court order addressed to the protocol, not James.** Revocation hides a claim from current resolution; it does not remove it from the archive. On-chain bytes (tier 0/2) live in every full node's state or history regardless of anyone's lens; the `~store:<chunksRoot>` path serves stored bytes directly and never consults the (revocable) manifest slot — revoking a manifest hides the *pointer*, never the *content* (large-file-uploads mandatory fix 3, already ruled). The claim graph — who asserted what, when, and that it was later revoked — is itself permanent. The only mechanism that makes content *unreadable* (as opposed to unlisted) is encryption followed by key destruction (§2), and it must be arranged **before** writing, not after.

This paragraph (or equivalent) belongs in: apps-cookbook, the client's delete UX copy, and the operator doctrine. It is the deletion-cluster twin of P13's "known tradeoffs of the timestamp-free ID."

Right-to-erasure: see §2.4 for the honest GDPR statement. Illegal-content/operator exposure stays where James ruled it (substrate §6.3: protocol neutral; operator-facing doctrine, not protocol machinery) — this lane adds only the erasure-honesty text, no mechanism.

### 1.4 The fallthrough-resurrection surprise, and what WHITEOUT is actually for (FM-P1)

A defect in the naive "delete = revoke" story that nobody has written down:

**Worked example.** Alice's lens for `/shared/plan.md` is `[Alice, Bob]`. Both placed a version. Alice deletes hers (REVOKE → her position reads EMPTY → **PROVEN-ABSENT on a home-chain read → the resolver falls through**) — and the path now serves *Bob's* version. Alice's "delete" didn't remove the file from her view; it **changed which content shows**. Under first-attester-wins, deleting your claim *un-masks the next author*. For a solo namespace this never bites (one position, EMPTY everywhere); for any shared/curated container it bites immediately, and it is exactly the overlay-filesystem problem: removing your upper-layer file re-exposes the lower layer.

OverlayFS solves this with a **whiteout** — an upper-layer entry that *asserts absence* and masks lower layers. EFS has WHITEOUT already additive-reserved (freeze-gates §C) with no pinned semantics. This lane pins what it can and cannot promise, and finds the reservation currently conflates **two different objects**:

**(a) Self-slot whiteout — assertive absence (the real WHITEOUT; needs the reservation).**
A claim by author A *in A's own placement slot* whose meaning is "this position is deliberately empty; do not fall through past me." Read semantics: the slot is **PRESENT** (a winner exists — so resolution stops at A, per the ordinary algorithm) but renders as *removed-by-A*, serving nothing. Undelete = supersede the whiteout with a normal placement. This is precisely `rm` in a union mount, and it is the only way "delete" can mean "gone from views that trust me first" rather than "revealed the next author."
- **Encoding decision (freeze-sensitive):** a placement PIN needs a distinguishable whiteout form. Options: (i) a reserved sentinel target word (WHITEOUT_TARGET) legal in placement-PIN position — touches the closed targetKind enumeration (and note OPAQUE is forbidden in reserved rows, so the sentinel must be its own named class); (ii) a reserved `whiteout` key row paired to the placement key — awkward (two slots to keep coherent); (iii) VAL-layout placement with a reserved value — abuses VAL. **Recommend (i): a single reserved sentinel target word, admitted in ordinary PIN slots, zero kernel semantics (the kernel stores it like any claim; all meaning is read-layer).** The *word* and its targetKind-matrix legality are Etched-table surface → must be pinned at the ceremony. The read behavior (PRESENT-but-serves-absence, GATE reads treat as PROVEN-ABSENT? — no: as *present-and-empty*, which for a GATE consuming existence is a clean "absent by author's assertion with provenance") is Durable and can iterate.
- Cardinality note: whiteout-vs-content in one slot is automatic (cardinality-1 PIN LWW) — no new conflict machinery.

**(b) Cross-author tombstone — "treat X as removed" aimed at other people's claims.**
This is **already shipped machinery wearing a different name: deny advisories** (read-lens-spec §3.4). A moderation/curation author asserts a deny-shaped TAG against a claimId/object/tagId; subscribing readers subtract after resolution. Per-reader, advisory, revocable, graded-before-subtracting. **Ruling proposal: the cross-author form of WHITEOUT is a *convention on deny advisories* (a named advisory feed, e.g. `removals`), NOT a new row.** Minting a second, parallel cross-author-removal primitive would create a dual spelling of deny — exactly the equivocation-hole class the kinds ruling spent its budget deleting.

**What WHITEOUT (either form) can promise:** removal from *views that honor it* — the lens positions that trust A (form a) or subscribe to the advisory author (form b) — with full provenance ("removed by A at order N", inspectable, reversible).
**What it can never promise:** destruction; removal from the spine, discovery enumeration, or historical views; any effect on readers whose lenses don't include the asserting author; any effect on bytes or mirrors. It is **deny-shaped, per-reader, never destruction** — say all five words every time it is documented.

### 1.5 "Delete for everyone" is inexpressible — and should stay so [declared-gone]

"Make this cease to exist for all readers" would be a write-gate over other people's reads — it contradicts permissionless writes + viewer sovereignty at the mission-end level. The honest decomposition an SDK "delete" verb should perform, in order:
1. REVOKE own placement(s) (+ whiteout if the container is shared and the author wants masking, §1.4a);
2. optionally publish a removal advisory (if the author runs/feeds a moderation lens);
3. optionally REVOKE the mirrors/manifest edges (hides pointers; bytes persist — §1.3);
4. for encrypted content only: crypto-shred (§2);
5. off-protocol: request off-chain mirror deletion (IPFS unpin etc.) — best-effort courtesy, never a guarantee.

**Expiry is not on this list on purpose (FM-honesty):** `expiresAt` is a *currency fuse*, stale-not-dead; STALE content remains readable, labeled, and distinct-from-REVOKED by hard rule (RR4). Apps reaching for expiry as "auto-delete" get neither deletion nor hiding — steer them to REVOKE (the exit-flow doctrine sentence, read-lens-spec §3.2, already says this; the deletion cookbook must repeat it).

### 1.6 Classic-FS deletion features — stated dispositions (pass rule 3)

| Classic feature | Disposition |
|---|---|
| `rm` / delete file | **re-homed**: REVOKE own placement (per-author, per-view); + WHITEOUT(a) for union-masking |
| Trash / Recycle Bin / undelete | **native**: revocation history + re-assert; infinite window; public (FM-P10) |
| `rmdir` / delete directory name | **gone**: TAGDEFs permanent/unowned; only your claims at the node are removable |
| Secure erase / `shred(1)` / wipe | **gone at the byte layer; re-homed at the key layer** (crypto-shred, §2) |
| "Delete for everyone" (admin delete) | **gone** (artifact of one-mutable-cell + central authority); nearest honest composite in §1.5 |
| Retention policies / auto-purge | **gone as destruction; re-homed as currency** (expiresAt = STALE labeling, never removal) |
| Refcount GC ("last link frees the file") | **gone** (nothing is ever freed; hardlink-effect without hardlink-GC — cross-ref move/link lane) |
| File modes `r--` (read permission) | **re-homed to encryption** — encryption is the *only* real read control (holistic §4, confirmed here) |
| Hidden files (dotfiles) | **split**: cosmetic hiding = client/lens convention (gone as protocol); real hiding = salted TAGDEF (§4) |
| atime (read tracking) | **gone, as a privacy feature** — reads leave no on-chain trace; residual read-leak is the RPC/gateway layer (P8) |

---

## 2. Crypto-shredding — the only honest hard delete

Prior art: NIST SP 800-88 sanitization-by-key-destruction; Boojum/Di Crescenzo "How to Forget a Secret"; ZFS/self-encrypting-drive crypto-erase; the GDPR practice of several EU DPAs (notably the Danish Datatilsynet) accepting key destruction as erasure when the key is genuinely irrecoverable.

### 2.1 Mechanism (composes entirely from §3's private-file convention)

A file written under the private-file convention has a random per-file **FEK** (file encryption key); ciphertext is the stored/mirrored content; the FEK exists only as (a) key-wrap records on-chain (wrapped to recipients' encryption keys, §3) and (b) whatever plaintext copies key-holders keep.

**Shred(file F)** =
1. Destroy every plaintext copy of FEK_F the owner controls (device keystores, roaming/escrow tier).
2. REVOKE the owner's `keyWrap` edges for F (hygiene + legibility — cryptographically irrelevant: revoked bodies persist in state, see FM below).
3. Optionally assert a `shredded` claim (VAL TAG on F: "key destroyed at ⟨claimedAt⟩") — an *unverifiable* courtesy record that lets UIs render "shredded" and gives audit trails an anchor. **Convention, not row** — it has no kernel semantics and can't be proven true.

**The load-bearing subtlety (FM-wrap-persistence):** revoking a keyWrap edge does NOT remove the wrap blob — bodies-in-state means every wrap ever written is readable forever. Therefore **a wrap is a permanent capability grant to whoever holds the unwrapping private key**. Shredding only works against parties whose unwrap keys are *also* gone or were never granted. This drives the whole honesty ladder:

### 2.2 What shred actually delivers — the honesty ladder [NORMATIVE-CANDIDATE]

| Situation | What "shred" means |
|---|---|
| Owner-only file (wraps only to owner's own device/escrow keys) | **Genuine erasure-equivalent**: destroy FEK copies + the escrow wrap chain's root (§2.3) → ciphertext is permanently inert, modulo cryptanalysis (§3.6 HNDL) |
| Shared file (recipients were granted wraps) | **Forward-only**: recipients may hold FEK/plaintext forever; on-chain wraps to their keys remain unwrappable by them forever. Shred = "I destroyed *my* access and stopped *my* escrow"; it is un-share-shaped, not erasure-shaped |
| Any file | What always survives: the ciphertext bytes (with padded size), the DATA identity, every claim-graph edge (placements, wraps, revocations, the shred claim itself), authorship, timing. **The graph is not shreddable** (§5) |

**Rule for UIs: only owner-only files may render a "permanently shredded" state; shared files render "access destroyed for future grants; N prior recipients unaffected."** Conflating these is the crypto-shred version of conflating STALE with REVOKED.

### 2.3 The shred/backup tension (FM-P8) — key custody designed for destroyability

Trash wants keys backed up everywhere forever; shred wants keys concentrated and destroyable. These are opposites, and the design must hold both:

- **Indirection (Boojum shape):** device/escrow backups never store FEKs directly; they store FEKs wrapped to a **shred-root KEK** whose plaintext lives only in destroyable locations (secure enclave / passphrase-derived, *not* in the roaming backup itself). Destroying the shred-root (and rotating the escrow so future backups use a new root) severs every backed-up wrap at once, without having to find every backup copy.
- The **P9 roaming tier** is the escrow home; its design must therefore support *partitioned* roots: an "archive" root (never shred; lens/config/settings — losing these is the P9 truth-bug) and a "shreddable" root (personal content). One root for everything makes shred impossible or backup unsafe.
- **Identity-key independence (G9, already ruled, integrated here):** no key in this graph is ever the secp256k1 identity key or derived from it. Signing-key THEFT must not decrypt the archive (the system's only non-monotone consequence, identity amendment 1); signing-key LOSS must not lose data; and — the converse this lane adds — **encryption-key loss must not touch identity**: the escrow graph and the KEL-reservation are disjoint by construction.

### 2.4 GDPR / right-to-erasure — the honest statement [NORMATIVE-CANDIDATE wording]

> EFS is a permanent archive; plaintext once written is irrevocably public and **no erasure right can be honored on it** — the only compliant handling of personal data on EFS is *never writing it in plaintext*. For content written under the private tier, **erasure = crypto-shred**: destruction of all controller-held key material, which several EU supervisory authorities accept as satisfying Art. 17 for the *payload*. What crypto-shred cannot erase: the claim graph — the author's address, record timing, sizes, the fact-of-deletion — which may itself be personal data under a broad reading. EFS therefore cannot promise *complete* GDPR erasure to anyone, and says so. Roles are honest too: the protocol has no operator; gateways, mirrors, and indexers are controllers/processors of what *they* store and serve and make their own jurisdictional calls (ops-doctrine tier table). The design decision that follows: **personal-data-bearing apps MUST default to the private tier (§7) so that erasure-by-shred is available at all.**

---

## 3. Private files — the encrypted-content convention (end-to-end)

Extends holistic §2.3 (which this lane confirms and completes); prior art: Tahoe-LAFS (immutable-cap model), age/HPKE (RFC 9180), Cryptree (Wuala's folder key graph), Signal sender-key rotation, MLS (RFC 9420).

### 3.1 Envelope encryption — the shape [confirming settled leanings]

- Random per-file **FEK**; content encrypted under an AEAD (XChaCha20-Poly1305 or AES-256-GCM — Grover-resistant margins at 256-bit).
- **Ciphertext is the file content** as far as every existing mechanism is concerned: `contentHash`/`size` refer to ciphertext (trustless byte verification intact — already ruled); `chunksRoot` commits ciphertext chunks, so EFSBytes proof-streaming, resumability, promotion, and replication work unchanged on private files. Zero new byte-layer surface.
- `contentEncryption` reserved VAL row on the DATA: self-describing format tag (age/HPKE suite, chunking mode, padding scheme §5.3). The **row** is Etched (exists in the genesis manifest); the format-tag grammar is Durable.
- **Convergent encryption stays opt-in only, with a per-user convergence secret** (holistic §2.3 stands): deterministic keys enable the confirmation-of-file attack (Tahoe's classic leak) *and* collide with §5.4's intern-oracle. Default is random FEK.

### 3.2 Where wrapped keys live — the `keyWrap` shape decision [freeze-sensitive: role/cardinality]

The `keyWrap` row exists in the genesis manifest with **no pinned role shape**. Role and cardinality are frozen-table surface, so this must be decided before the ceremony:

**Proposal — dual-role, mirroring `mirrors`:**
- **PIN role = the owner's escrow wrap** (the O(1) point read: "my own way back in", targeting the shred-root chain of §2.3).
- **TAG role = per-recipient wraps**, accumulating. Each wrap: VAL layout, value = self-describing wrap blob `{wrapAlgTags, recipientKeyHint, sealedFEK}` (HPKE sealed; randomized by construction, so no intern-dedup leak).
- **Slot mechanics (the sharp part):** the TAG slot key is `(author, definitionId, targetId)` — N wraps by one author on one file would LWW-collapse into one slot. Per-recipient wraps therefore use the **opaque-occurrence-key recipe** (already documented for list duplicate-members): occurrence key = `H(recipientEncKeyId)` (or random for anonymous mode). This makes each recipient's wrap an individually revocable slot — remove-reader is one REVOKE. **The keyWrap row spec must state this occurrence-key rule; it is part of the row's frozen semantics.**
- **Whose slots:** the granter's — the file owner's, or *any FEK-holder's*. Permissionless writes mean Bob, once granted, can wrap the FEK onward to Carol under his own authorship. **Capability delegation is structurally unstoppable once granted** (bearer semantics — same truth as Tahoe caps), and it is *legible*: onward grants are signed, attributable claims. State it as a feature-and-limit pair, not a bug.
- **Read side:** a client seeking access resolves keyWrap TAGs targeting the file *under its lens* (a hostile author can plant garbage wraps; lens-filter first, and AEAD unwrap/decrypt failure catches the rest — verification order extends RR9: lens → signature → bytes → **decrypt**).

### 3.3 The missing piece — recipients need a published encryption key [NEW ROW PROPOSAL: `encryptionKey`]

HPKE needs a recipient public key, G9 forbids using/deriving from the identity key, and **no reserved row exists for an encryption public key**. Without one, every client invents its own user-key TAGDEF — a per-client dialect exactly where cross-client interop is mandatory (Alice on client X must be able to share to Bob on client Y). This is the strongest row case in this lane:

- **`encryptionKey`** — reserved PIN (cardinality-1), VAL layout, under the ADDRESS container. Value = self-describing multi-key blob: `[{algoTag: x25519, key}, {algoTag: ml-kem-768, key}]`, algo-tagged for agility (rides the identity doc's reserved algoTag extension constants). Rotation = supersession (old wraps remain decryptable by old-key holders — forward-only, again). Grading: an EQUIVOCAL/CONTESTED encryptionKey slot means **do not encrypt to this identity** (fail closed — encrypting to an ambiguous key is a disclosure hazard, the encryption-side twin of RR3).
- Row-vs-convention: **mint the row.** Cheap (one row + vectors), and the fragmentation cost of convention is paid in silent disclosure failures, not UX papercuts. (Anonymous-recipient wraps — no hint, trial-decrypt, age's `-R` anonymous mode — remain a convention *option* on top; §5.)

### 3.4 Recipient management — add/remove/rotate [NORMATIVE-CANDIDATE]

- **Add reader:** append one wrap TAG (no re-encryption, O(1)).
- **Remove reader — forward-only, always:** REVOKE their wrap slot **and rotate**: new FEK, re-encrypt, new ciphertext/`chunksRoot`/mirrors, supersede the manifest, re-wrap to remaining recipients. The removed reader keeps: everything already read, any FEK copy, and the permanent on-chain wrap to their key for the *old* ciphertext (FM-wrap-persistence). **Revoking a reader protects future versions only.** This is the third instance of one law this design keeps producing — lens removal, persona un-endorsement, reader revocation are all *prospective un-endorsement, never retroactive disavowal* — and it should be stated once, centrally, as **the forward-only law of a monotone archive**.
- **Rotation laziness (Cryptree's lesson):** eager re-encryption of a whole subtree on every membership change is O(subtree) gas and mirrors. Bless **lazy re-keying**: group/folder KEK rotates immediately (cheap, §3.5); each file's FEK rotates on its next content write. Interval honesty: between removal and next write, the removed member can still read *unchanged* files — render this state ("removed; N files pending re-key"), don't hide it.
- **Rotation is visible (FM-P3, → §5):** a burst of revoked+re-asserted wraps is a public "membership changed here" event. Unavoidable; disclose in the pattern docs.

### 3.5 Groups and folders — the key graph [convention]

Per-recipient wraps are O(N) per file per rotation. The standard indirection (Cryptree / Tahoe dirnode shape):
- A **folder/group KEK** (random). Each file's FEK wrapped once to the KEK (one TAG per file); the KEK wrapped to N members (N TAGs, amortized over all files). Membership change = rotate the KEK (N wraps) + lazy FEK re-keys.
- KEK-wrap records hang on the *dirnode DATA* (the holistic §2.1 dirnode convention gives the folder an owned object to hang them on — private folders are the dirnode pattern's best customer).
- Nesting = KEKs wrapping KEKs (the Cryptree edge). Depth is bounded by resolution patience, not protocol.
- **MLS (TreeKEM) is deliberately NOT the v2 convention** — O(log N) member updates matter at messaging scale, not file-sharing scale, and MLS's group-state machinery fights the no-shared-mutable-cell grain. The wrap blob's self-describing algoTag leaves the door open for an MLS-backed group KEK later without new rows. **Convention: flat KEK + lazy re-key; reject MLS for now, cite it.**

### 3.6 PQ-hybrid wraps — HNDL on a permanent archive [MUST, confirming holistic §2.3]

Every on-chain wrap blob is harvestable forever by construction; a classical-only wrap is a time bomb with a CRQC fuse. **MUST: all on-chain key-wraps are PQ-hybrid (X25519 + ML-KEM-768 KEM combiner per the HPKE hybrid drafts), with an explicit HNDL warning in the convention.** The AEAD layer at 256-bit is not the HNDL surface; the KEM is. Migration story: algoTag agility (§3.3) + opportunistic re-wrap of old files on next touch; and note the asymmetry with identity honestly — encrypted *content* has a PQ path today (hybrid wraps ship now), while *authorship* waits on the ~2030 KEL. Privacy is ahead of identity on PQ, and that's fine.

### 3.7 Lens interplay — private data in a lens-resolved world

- Encrypted claims resolve **identically** to plaintext ones: slots, grades, currency, deny — none of it reads payload plaintext. No changes to §3 resolution.
- **One missing read state:** resolved-LIVE, bytes fetched and verified, viewer holds no key. Not UNKNOWN (the position answered), not BYTES-UNAVAILABLE (bytes are right there). Propose flag **`ENCRYPTED-NO-KEY`** (orthogonal, alongside BYTES-UNAVAILABLE/DISCOVERY/DENIED): INTERACTIVE renders an opaque-entry affordance ("encrypted; you have no key"); a GATE read requiring plaintext fails closed. This is Durable read-lens-spec vocabulary (closed-set extension by revision — batch it with the P3 items; **not** freeze-bound).
- **Contracts can never decrypt:** private data is never GATE-consumable on-chain in plaintext. Selective disclosure to chains (zk over ciphertext etc.) is out of scope, consistent with the substrate ruling's verify-don't-trust tension note.
- **Moderation honesty:** deny advisories against encrypted content can key only on ids/authors/metadata, never content. A private tier is *structurally unmoderatable at the content level* — a stated consequence, and part of why the permissionless-byte-pool ruling already accepted unattributed permanent bytes.

---

## 4. Private folders — salted/blinded TAGDEF activation design

Reserved surface (freeze-gates §C): the `DOMAIN_ANCHOR_SALTED` derivation family + the blinded-TAGDEF disclosure record. This lane's activation design:

### 4.1 Why salting is necessary at all (the dictionary problem)

Public tagId derivation is a *feature* (Schelling paths) and a *privacy hole*: anyone can derive `keccak(DOMAIN, yourRoot, keccak("passwords"), kind)` and probe for it — every guessable name under every address is enumerable. Encryption hides content; **only salting hides structure.**

### 4.2 Mechanism [freeze-sensitive: derivation math + record shape]

- `saltedTagId = keccak(DOMAIN_ANCHOR_SALTED, parentId, blindedName, kindTag)` with `blindedName = H(name, salt)` — and, critically, the TAGDEF record body carries **the blinded name, not the plaintext name** (an ordinary TAGDEF publishes its name string in the signed body; a salted node that shipped a plaintext name would be pointless). This means:
  - The kernel's NFC canonical-name validation **cannot run** on a blinded segment — the salted family needs its own validation rule (shape/length of the blinded word). This is derivation-math + record-shape surface = **Etched; the family must be fully pinned (with vectors) at the ceremony even though the machinery ships later.** This is the loudest freeze item in the lane.
  - **Every segment of a private path must be salted (FM-P6).** One plaintext TAGDEF segment under a salted parent re-leaks its name in its own body. The SDK must make mixed paths impossible-by-default.
- **Salt scoping:** one **subtree salt** per private root (capability ergonomics: one secret), with per-segment blinding keys derived `H(subtreeSalt, relativePath)` — enables partial disclosure of a sub-branch without disclosing siblings. Per-folder independent salts remain legal for compartmentalization.
- Salted TAGDEFs remain **unowned Schelling points among capability holders**: anyone holding the salt derives the same ids and may write there (permissionless writes are unchanged — "hidden" ≠ "write-restricted"; read the §1 inversion again). Exclusivity, as everywhere, is a lens fact.

### 4.3 Capability-in-URL-fragment sharing [convention; grammar exists]

`web3://…/photos/album#k=⟨cap⟩` — the fragment never reaches servers or chain (already exemplified in read-lens-spec §6.5). Define the cap encoding (Tahoe-LAFS is the prior art for cap-string discipline):
- **structure-cap** = `{saltedRootId, subtreeSalt}` → derive ids, see the shape, fetch ciphertext, *write* into the subtree; no plaintext.
- **read-cap** = structure-cap + KEK → full read. (No "write-cap" exists — writing is never gated; a cap holder writes under their own authorship like anyone.)
- Caps are bearer secrets: browser-history/sync exposure is real (fragments stay client-side but persist in history) — client guidance: short-lived share links should carry caps wrapped to the recipient's `encryptionKey` (a keyWrap record) rather than raw, reserving raw-fragment caps for ephemeral hand-offs.
- **Cap revocation = salt rotation** = mint a new salted subtree + move (expensive, forward-only — the removed holder keeps the old subtree's structure knowledge forever). Fourth instance of the forward-only law.

### 4.4 Directory listing with opaque entries — two blessed modes

- **Dark mode (existence-hiding):** the private subtree hangs off its own salted root; **no edge from any public node**. Nothing to list; the public tree doesn't know it exists. Discovery/parent-walk sees nothing. This is the default for the OS personal tier.
- **Stub mode (mountpoint-visible):** a PIN under a public parent placing the salted node with a blinded segment — listings render "🔒 1 encrypted item" (existence + author + timing leak; name/content don't). For "my public root has a private area" UX.
Name the tradeoff explicitly; never render stub-mode entries as if existence were secret.

### 4.5 Reveal-later — the disclosure record [reserved; pin the shape]

The blinded-TAGDEF disclosure record publishes `(name, salt, parentId, kindTag)` proving `saltedTagId` was that path all along — commit-reveal for filesystems. Uses: embargoed archives, sealed bids, journalism ("I had this in 2026"), converting a private folder to public history *with its original timestamps intact* (admittedAt of the salted writes becomes retroactively meaningful — this pairs beautifully with P1). Pin the record shape with the family at the ceremony; activation stays additive.

### 4.6 Failure modes

- **FM-P5 salt loss = structure loss:** ids underivable; content DATA objects remain reachable via any direct links/dataIds held elsewhere, but the tree rendezvous is gone. Salts are therefore escrow-tier material (§2.3) on the *archive* root (never the shreddable root — losing your own folder structure must not be a side effect of shredding one file). Conversely **shredding a whole private subtree** = destroy subtree salt + KEKs — the only "rm -rf that means it" EFS will ever have, and only for owner-only trees.
- Salt reuse across subtrees = linkability (one cap leak opens both). SDK: fresh CSPRNG salt per root, same discipline as DATA salts (holistic §2.9 salt lifecycle).
- Traffic analysis still works (§5): salted writes still show author, timing, sizes, fan-out. Salting hides *names*, not *behavior*.

---

## 5. Metadata leakage — what the public claim graph says even when everything is encrypted

The full leak inventory, because honest enumeration IS the mitigation posture (substrate §6.4: the authorship edge + timing are "the irreducible boundary of a public verifiable write-graph"):

| # | Leak | Channel | Mitigation (honest) |
|---|---|---|---|
| L1 | **Authorship** — every claim names its author forever | recovered signer | Persona partitioning (P4/P9) — the *only* real tool; linkage between personas is the thing to protect (private persona-link convention, P9). Never promise anonymity |
| L2 | **Timing** — `order` TID leaks author-claimed µs-time; `admittedAt` (if P1 lands) leaks true admission time; envelope batching leaks session shape | envelope + kernel state | Batching (many actions, one order) coarsens per-action timing — *set `claimedAt = 0` in private-tier apps* (it's optional; a private app that fills it re-leaks per-action times the batch just hid). Beyond that: none; say so |
| L2b | **Device bits** — 10-bit clockId in every TID distinguishes the author's devices; device-usage patterns correlate across time and potentially across personas that share devices | TID layout | SDK guidance: randomize/rotate device bits per persona (they exist to prevent self-equivocation, not to be stable identifiers — P10's allocation convention should say persona-scoped) |
| L3 | **Social graph** — keyWrap recipient hints; lens LISTs (public follow/trust graphs — ops A1 notes subscription edges are public by construction); deny subscriptions; TAG edges into shared containers | claim bodies | Anonymous-recipient wraps (no hint; trial-decrypt cost O(wraps)); private lens config in the encrypted tier (P9c) rather than published LISTs when the lens itself is sensitive |
| L4 | **Sizes** — `size`, chunkCount×chunkSize, ciphertext ≈ plaintext length | manifest + stores | **Padding convention (MUST for the private tier):** bucketed sizes (e.g. Padmé or power-of-two buckets) + normalized chunk sizes (P8/P11 already ask for chunk normalization — fold padding into the same guidance) |
| L5 | **Structure & cadence** — edge counts under a node, supersession counts (edit frequency), write cadence, subtree fan-out | spine/discovery | Dark-mode subtrees remove *public* attachment points but the author's own claim stream still shows volume/cadence. Decoy records are possible (gas-priced) — **reject as a blessed pattern** (unbounded cost for bounded confusion) but don't forbid |
| L6 | **Key-rotation events (FM-P3)** — wrap churn = legible "membership changed / reader removed at T"; encryptionKey supersession = "rotated their key (compromise?)" | keyWrap/encryptionKey slots | None. Disclose in docs; rotation-shaming is a social phenomenon to expect |
| L7 | **Group sizes (FM-P11)** — wrap counts ≈ recipient counts | keyWrap TAGs | Dummy wraps (sealed to random keys) are cheap and *do* work — offer as a convention option, unlike L5 decoys |
| L8 | **Deletion events (FM-P10)** — revocations are public, timestamped, permanent | G-set | None. §1.2's Trash honesty |
| L9 | **The intern equality oracle (FM-P2)** — VAL values are auto-interned content-addressed: `propertyId` is derivable from value bytes, so *anyone can dictionary-test whether any low-entropy value was ever asserted by anyone* ("is there a claim with value ⟨X⟩?" is a point read), and identical values dedup across authors (equality linkage) | auto-intern pathway | **MUST (private tier): sensitive VAL payloads are encrypted or salted before assertion** — AEAD output is randomized → unique bytes → no dedup, no dictionary. This is a real, sharp finding: auto-interning is a *global equality oracle by design*; the cookbook must carry the rule prominently |
| L10 | **Read-side** — on-chain reads are traceless (no atime — good), but RPC/gateway query patterns reconstruct interest graphs | transport | P8's program (bulk snapshots, OHTTP-cleanliness, chunk normalization) — owned there; this lane just binds the private tier to it (a private file fetched via a correlating RPC leaks its consultation) |
| L11 | **Funding trails** — gas payer / submitter / relayer choice correlate personas | tx layer | Relayer submission (submitter ≠ author is native); beyond that out of scope (mixing), consistent with never-anonymous |

**Posture ruling proposal:** mitigations that are *cheap and effective* (padding, randomized VALs, anonymous/dummy wraps, claimedAt=0, dark subtrees) are MUSTs or defaults of the private tier; mitigations that are *expensive theater* (decoy records, timing jitter against a global adversary) are named and rejected; everything else is **honesty text**. The enemy of trust here is not the leak — it's the undisclosed leak.

---

## 6. Deletion × privacy interactions worth pinning

- **Shredding a shared file** (worked example): Alice shreds F (§2.2 shared row). On-chain forever after: F's DATA, ciphertext bytes (padded size), Alice's revoked placement + revoked wraps + shred claim, Bob's and Carol's wraps (usable by them forever), the whole timeline. An adversary learns: F existed, Alice authored it, shared with ~2 parties, killed it at T. Bob can still decrypt the old ciphertext forever. Nothing Alice does changes any of this — which is exactly what the UI must have told her *at share time*, not at shred time.
- **WHITEOUT on encrypted entries** composes cleanly (whiteout is payload-independent).
- **Expiry on wraps:** a keyWrap with `expiresAt` gives *labeled* key-currency ("this grant was meant to lapse") — but STALE never hides, and the wrap stays unwrappable. Time-boxed sharing that *means it* = rotation on schedule, not expiry. Say it, because expiring grants is the most tempting wrong pattern in this whole lane.
- **Trash + private tier:** revoked private placements are still enumerable (L8) but opaque (blinded names, encrypted content) — the private tier's trash leaks *that* you deleted, not *what*. This asymmetry is the strongest practical argument for private-by-default personal data.

---

## 7. The private-by-default app pattern (the OS handoff)

James pulled privacy into this pass as the foundation for the OS. The composed pattern the OS designer should take as the default template for **personal-data apps** (journal, notes, settings, drafts, receipts, health, photos):

1. **App root:** dark-mode salted subtree per (user, app): `saltedRoot = f(user's app salt, appId)`; salts in the archive-escrow root (§2.3).
2. **Every file:** random FEK; AEAD ciphertext padded to bucket (L4); `contentEncryption` + ciphertext `contentHash`/`size`; mirrors/EFSBytes unchanged.
3. **Keys:** FEK → folder/app KEK (one wrap) → user's device/escrow `encryptionKey`s (PQ-hybrid, §3.6). Owner-only by default → **every file is born shreddable**.
4. **Values:** all VAL properties encrypted/randomized (L9); `claimedAt = 0` (L2); device bits per P10 persona-scoped.
5. **Sharing is an explicit act** with an explicit irreversibility notice: wrap to recipient's `encryptionKey` row or cap link (§4.3); UI states the forward-only law at grant time.
6. **Publishing is an explicit act:** "make public" = place plaintext (or disclose via §4.5) under the public namespace — a *new write*, never a mutation of the private one.
7. **Deletion UX:** Trash = revoke (recoverable, public-that-something-was-deleted); "Delete permanently" = shred (owner-only files only; irreversible; §2.2 ladder rendered honestly).
8. **Lens/trust config** roams encrypted (P9c) — a user's *view* of the world is personal data too.
9. **What the OS must never promise:** retroactive un-share; hidden authorship/timing/cadence; erasure of the graph; content moderation inside the private tier.

Dual-posture ruling proposal to carry to James: **EFS-the-archive stays public-by-default (hyperlinkable web is the mission); EFS-the-OS personal tier is private-by-default (this pattern).** Publishing crosses the line deliberately. "Permanent ≠ public" is the sentence that reconciles the mission with the tier.

---

## 8. FREEZE-SENSITIVE RESERVATIONS (the loud section)

Every reserved-slot/format item this lane touches, with **row vs convention vs reject** and why. Items marked ⚠️CEREMONY are Etched-table/derivation surface that must be pinned before the one final freeze even though all machinery ships later.

| # | Item | Verdict | Why |
|---|---|---|---|
| F1 | `contentEncryption` row | **Row — already exists; keep.** Format-tag grammar Durable | Uniform self-describing ciphertext marker; interop-critical |
| F2 | `keyWrap` row **role/cardinality shape** ⚠️CEREMONY | **Row exists; PIN role = owner escrow, TAG role = per-recipient (dual-role like `mirrors`), occurrence-key rule for per-recipient slots stated in the row spec** | Role/cardinality is frozen-table surface; without the occurrence-key rule N wraps LWW-collapse into one slot and remove-reader is inexpressible |
| F3 | **`encryptionKey` row (NEW)** ⚠️CEREMONY | **Mint row** (PIN, VAL, ADDRESS-parent; algo-tagged multi-key blob) | The one genuinely new row this lane needs. HPKE needs recipient keys; G9 forbids the identity key; a convention here fragments into per-client dialects whose failure mode is *silent mis-encryption*, not UX papercuts. Cheap: one row + vectors. Add to the P2 candidate pass |
| F4 | Salted TAGDEF family: `DOMAIN_ANCHOR_SALTED` derivation + **blinded-name record body + validation rule** ⚠️CEREMONY | **Reserve fully-pinned with vectors** (already on the additive list; this lane adds: the body must carry the *blinded* name, and the NFC rule needs a salted-family variant) | Derivation math + record shape = Etched. A salted family whose record body still carried plaintext names would be dead on arrival; discovering that post-freeze = pledge amendment |
| F5 | Blinded-TAGDEF **disclosure record shape** ⚠️CEREMONY | **Reserve with pinned shape** `(name, salt, parentId, kindTag)` + vector | Reveal-later is the feature that makes salting archival-grade (commit-reveal); shape is format surface |
| F6 | **WHITEOUT** ⚠️CEREMONY | **Split.** (a) Self-slot assertive-absence: reserve as a **single sentinel target word** legal in PIN placement slots (touches the closed targetKind enumeration → ceremony), zero kernel semantics, read behavior Durable. (b) Cross-author tombstone: **convention on deny advisories — no row** (a second cross-author-removal spelling would reopen the dual-encoding hole the kinds ruling closed) | Without (a), "delete" in any shared container un-masks the next lens author (FM-P1) — the sharpest FS-semantics gap this lane found |
| F7 | `shredded` attestation | **Convention, not row** | Unverifiable courtesy claim; zero kernel semantics; ordinary VAL TAG |
| F8 | `ENCRYPTED-NO-KEY` read flag | **Durable** (read-lens-spec closed-set revision, batch with P3) — not freeze-bound | Read vocabulary, not format |
| F9 | Padding/bucket + chunk-size normalization | **Convention/SDK MUST for private tier** (fold into P8/P11 guidance) | Transport/bytes guidance, not format |
| F10 | PQ-hybrid wrap MUST + wrap-blob algoTags | **Convention (normative in cookbook/SDK)**; algoTags ride identity's already-reserved extension constants | No new Etched surface needed — verify the algoTag constant space is wide enough for KEM tags before it freezes (one-line check against identity's reserved table) |
| F11 | Randomize-sensitive-VALs (anti-intern-oracle, L9) | **Convention, MUST-level** | Behavioral rule over existing machinery |
| F12 | Anonymous/dummy wraps (L3/L7) | **Convention, optional** | Privacy dial, no shape change |
| F13 | `claimedAt` privacy interaction | **Guidance rider on the A.8 decision:** if `claimedAt` is blessed, its spec carries "private-tier apps SHOULD write 0" | The new field is a per-action timing leak the envelope's batching otherwise hides — the A.8 ratification text should say so |

Un-minted rows are explicit "convention, not row" rulings per the pass rule — F7, F9–F12 above are those rulings, not silence.

---

## 9. Named failure modes (register candidates)

FM-P1 fallthrough-resurrection (delete un-masks the next author; fixed by WHITEOUT-a) · FM-P2 intern equality oracle/dictionary (L9) · FM-P3 rotation legibility (L6) · FM-P4 HNDL on classical wraps (§3.6) · FM-P5 salt/cap loss = structure loss (§4.6) · FM-P6 plaintext-name leak under salted parent (§4.2) · FM-P7 forward-only un-share (recipient knowledge undeletable, §3.4) · FM-P8 shred/backup opposition (§2.3) · FM-P9 pointer-hiding ≠ content-hiding (`~store:` serves revoked-manifest bytes — already ruled, restated) · FM-P10 trash is public history (§1.2) · FM-P11 group-size leak via wrap counts (L7) · FM-P12 device-bit persona correlation (L2b).

## 10. What this lane sends to other lanes / passes

- **To the collaboration lane:** shared *private* folders inherit both problems at once (multi-writer + key graph); the KEK convention (§3.5) is writer-agnostic (any cap holder wraps onward) — check it against whatever multi-writer pattern that lane blesses.
- **To the P2 candidate pass:** add `encryptionKey` (F3) to the row/convention/reject table alongside `lang`/`dir`, persona-link, handler-binding.
- **To the A.8 time ruling:** the `claimedAt` privacy rider (F13).
- **To ops-doctrine:** §1.3 hard-delete statement + §2.4 GDPR statement + private-tier operator note (encrypted bytes are still bytes operators store).
- **To the OS pass:** §7 wholesale, plus the forward-only law as a single named principle (it now has four instances: lens removal, persona un-endorsement, reader revocation, cap rotation).
