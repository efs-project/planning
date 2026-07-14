# EFS v2 — The private-by-default OS personal tier (design of record)

**Pass:** Deep Privacy Pass, 2026-07-11 — REPAIR ROUND (closes critic GAP-2; contains the GAP-3 ratification and the GAP-4 collab-transport spec as binding deliverables).
**Lane:** OS-private-tier design of record. Replaces the lane that died in round 1; designed against — not merely re-audited by — [attack-os-tier.md](attack-os-tier.md), whose findings are requirements here.
**Bound by:** [critic.md](critic.md) (rulings, kill list, freeze table), [layer1-crypto.md](layer1-crypto.md) (the crypto substrate), [metadata-adversary.md](metadata-adversary.md) (what the public graph shows regardless), fs-pass-synthesis C1–C14, fs-pass-freeze-reservations, os-pass-handoff.
**Status:** draft — design of record; owes a re-run of attack-os-tier against these actual numbered steps (critic GAP-2 closure condition). #status/draft #kind/design #topic/privacy #pass/deep-privacy

---

## 0. Frame, tier split, and the machinery inventory

### 0.1 The honest frame (one paragraph)

The OS personal tier is **private by default** ("permanent ≠ public"): files are born encrypted, sharing and publishing are explicit ceremonies, and deletion is honest (trash = hiding; crypto-shred = the only "truly gone", and only in the tier built for it). Everything below is **confidentiality, never anonymity**: the public graph still shows authorship, timing, sizes-in-buckets, wrap fan-outs, and edit cadence (metadata-adversary §6) — every walkthrough step below states what an observer sees. No step claims "forward secrecy" (killed); the honest properties are **forward-only re-key** and **crypto-shred**.

### 0.2 The tier split (JD-1, binding)

Every private file/subtree is in exactly one of two tiers; the user picks per file/subtree; the default is `private-recoverable`.

| | `private-recoverable` (default) | `private-shreddable` (explicit opt-in) |
|---|---|---|
| Key root | `archiveRoot` (from `rootSecret`, phrase-recoverable) | shred domain (enclave-bound epoch keys; **never** escrowed, **never** phrase-derivable — kill-list #14) |
| Total device loss | **Recoverable** (phrase / social shares) | **Permanent loss** (by design) |
| Crypto-shred | **Not available** — and a recoverable file can never retroactively become shreddable (its escrow wrap is on-chain forever) | **Available** (W1.7) |
| First-run copy | "You can always get this back. You can never make it truly gone." | "You can make this truly gone. If you lose every device, it is gone too." |

### 0.3 What this design is allowed to build with (the inventory)

**Frozen/reserved rows:** `DATA`/`TAGDEF`/`LIST`/`PIN`/`TAG` + ASSERT/REVOKE; `contentEncryption` (E6, PIN card-1, format folded into the AEAD prologue); `encryptionKey` (C3 + F-5 typed multi-key blob, roles ⊇ {kem, scan}, KEM `0x01 = xwing-v1`); `keyWrap` (E5, TAG-only, **opaque** occurrence keys per F-3, owner-derived self-escrow key per F-4); `act` (D1); persona pair `efs.os/persona`/`efs.os/primary` + label (D2); EFSBytes manifests + per-chunk SHA-256 (C4); WHITEOUT REF-PIN (D6); `claimedAt` (A2; private tier writes 0 — **not** timing privacy, C-G). The salted-TAGDEF family (D3/D4 + F-1/F-2) is **reserved, post-freeze activation — used by NOTHING at launch in this design** (JD-6).

**Blessed conventions (critic §3.2):** committing AEAD `efs-ctx1` + `dekCommit` (layer1 §7.2, §1.4); X-Wing HPKE base-mode wraps with `info = "efs/v2/keywrap" ‖ granter ‖ fileId`, `aad = dekCommit` (layer1 §1.3); the three-lane scan convention (C-B: incremental cursor + H2 pairwise mailboxes + H1 view-tags k=16 + self-index escrow); encrypted dirnodes (layer1 §5.3); the P9 derivation tree (random `rootSecret`, signature-derivation banned, independent `shredRoot`; layer1 §4.2); pairwise + team-key groups ≤50 (JD-10); Padmé + 4 KiB floor + VAL buckets {256 B, 1 KiB, 8 KiB}; private-tier metadata suppression (JD-19); recovery ladder + `.efs-bundle` + Shamir-of-archive-root (JD-11); WA-2 share-acknowledgment records (law-positioning R5); walkaway gates WA-0..3 (JD-12); separate-envelope-per-tier, distinct-encryptionKey-per-persona, clientId=0 for unlinkable personas (§3.4 promotions).

Anything a step needs beyond this list is **flagged loudly** in the Gap table at the end. Nothing in this file writes against the salted resolver, mints a row, or touches kernel state.

### 0.4 Notation

Each step lists **Records written** as: `kind/row · layout · signer`. "Envelope" discipline throughout: one author per envelope; private-tier records never co-batch with public-tier records (§3.4 promotion); `claimedAt = 0`; private-tier TIDs are coarsened (JD-22(c): quantized to the hour with an intra-bucket monotone counter so own-slot supersession still orders; `admittedAt` remains the unfuzzable floor and this is **not** sold as timing privacy).

**The key tree used everywhere** (layer1 §4.2, restated):

```
rootSecret  (32B CSPRNG at onboarding; presented AS the recovery phrase — never signature-derived, JD-7)
 └ archiveRoot = HKDF(rootSecret, "efs/v2/root/archive")
    ├ recoveryKemSeed = HKDF(archiveRoot, "efs/v2/kem/recovery")   → the self-escrow X-Wing keypair
    ├ scanRoot        = HKDF(archiveRoot, "efs/v2/scan")           → scan keypair, occ_self, mailbox cache
    ├ lensStateKey    = HKDF(archiveRoot, "efs/v2/p9/lens")
    ├ dirnodeRootSalt_i = HKDF(archiveRoot, "efs/v2/dirnode-root" ‖ i)   → root-anchor DATA salts (W2)
    └ teamSeed_{T}    = HKDF(archiveRoot, "efs/v2/team" ‖ teamId)  → team-epoch derivation (W5, curator only)
shredRoot   (independent 32B; enclave-bound; never escrowed/phrase-derived; ships device-to-device only)
```

---

## 1. W1 — A private personal file, end to end

### W1.1 Create (born encrypted)

**Tier prompt.** First save into a private context: System Chrome asks once per subtree — Recoverable (default) or Shreddable — with the §0.2 copy. Per-file override in the save sheet. This is the JD-1 choice surfaced at the only moment it can matter (before the first escrow wrap exists).

**SDK work (client never touches keys):** DEK ← 32 B CSPRNG; plaintext framed as `metadataHeader ‖ content` (name, contentType, real size, times — JD-19: metadata lives INSIDE the ciphertext, never as rows); Padmé-pad (4 KiB floor); encrypt per `efs-ctx1` (committing EtM STREAM); compute `dekCommit`; chunk-normalize.

**Records written (one envelope, signer = the active private-tier persona — see the W4/JD-20 guard):**

| # | Record | Kind/row · layout · signer |
|---|---|---|
| 1 | file identity | `DATA` · body = random salt · persona |
| 2 | content bytes | EFSBytes manifest + K ciphertext chunks (contentHash/size/chunksRoot all refer to padded ciphertext) · persona |
| 3 | encrypted marker | `contentEncryption` PIN (card-1) on the fileId · no format tag on chain (folded into the AEAD prologue) · persona |
| 4 | escrow wrap — **recoverable tier only** | `keyWrap` TAG on fileId · VAL = X-Wing HPKE Seal(recovery KEM pk, DEK), `info` binds granter+fileId, `aad = dekCommit` · **occurrence key = HMAC-SHA-256(scanRoot, "efs/v2/self-escrow" ‖ fileId)** (F-4) · persona |
| 4′ | shred-ring update — **shreddable tier only** | see W1.7 mechanism: the DEK enters the shred keyring (one ring supersession, 2–3 records); **no `keyWrap` is ever written for a shreddable DEK** |
| 5 | placement | **none on chain** — the file enters the parent encrypted dirnode's child table (W2): one dirnode version supersession (3 records, W2.2), typically batched into this same envelope |

Cost-shape note: files that live in a dirnode do **not** strictly need record 4 — the dirnode table (W2) carries the child's DEK, and the table chain is itself escrow-wrapped. Record 4 is the default anyway (defense in depth + standalone-file recovery); elide it only for high-volume app data where the table is the sole escrow (stated trade: dirnode loss = loss of un-escrowed children).

**Rows this step deliberately does NOT write (JD-19):** no `name`, no `size`, no `contentType`, no `lang`/`dir`, no plaintext anything. `claimedAt = 0`.

**Public observer sees:** a new opaque DATA + padded-bucket ciphertext + one `contentEncryption` PIN + (recoverable tier) one `keyWrap` TAG with an opaque occurrence key — indistinguishable from a wrap to a stranger (F-3 opacity working as designed) — authored by persona P at coarse TID t, device bits, `admittedAt` block; plus one dirnode object's edit cadence ticking. No name, no tree position, no recipient identity, not even whether the file has an escrow.

### W1.2 Place / organize

Placement, rename, move between private folders are all **dirnode table edits** (W2.2): no on-chain placement PIN, no `movedTo`, no public edge from folder to file, ever. Cross-folder move = edit two tables in one envelope (atomic — single author, one signature over the Merkle root; stronger than POSIX rename).

### W1.3 Share to one friend

**Lane choice, shown:** Bob is a known counterparty (in Alice's contacts/lens) → **H2 pairwise mailbox** (zero-leak; C-B lane 2). H1 view-tag wraps are the stranger-share fallback (k=16). JD-11 governs the *transport of the grant*: a durable share is **wrapped to the recipient**, never a bearer cap in a URL; raw fragment caps exist only for same-device/air-gapped hand-off (QR-then-clear) and the composer detects-and-upgrades pastes into synced surfaces.

Prereq: Bob has published his `encryptionKey` PIN (C3) with `kem` + `scan` entries. Alice computes `k_AB = HKDF(X25519(scanSk_A, scanPk_B), "efs/v2/mailbox" ‖ A ‖ B)` — non-interactive, re-derivable by both (layer1 §2, H2).

**Records written (one envelope, Alice's persona):**

| # | Record | Kind/row · layout · signer |
|---|---|---|
| 1 | recipient wrap | `keyWrap` TAG on fileId · VAL = X-Wing Seal to **each current `kem` entry in Bob's blob** (N_devices blobs → N wraps, priced honestly: ~1.2 KB each) · **occurrence key = HMAC(k_AB, LE64(i))**, the next index in the A→B mailbox chain (opaque, F-3-conforming) · Alice |

That is the whole share. Bob learns the file's name from the decrypted metadata header, not from any row. The System Chrome grant ceremony surfaces the forward-only law **at grant time**: *"Once Bob decrypts this, no removal can take it back."*

**Public observer sees:** one more opaque-keyed wrap on file F by Alice at time t. Fan-out count of F ticks 1→2 (Playbook 5: cardinality is public; identity is not). Nothing names Bob.

### W1.4 Friend discovers + decrypts

1. **Discover (Lane 2):** Bob's device runs its incremental cursor over Alice's author stream (spine replay / any indexer, verify-don't-trust — hints are accelerators, never authority) and matches occurrence keys against the precomputed `HMAC(k_AB, i)` window. Zero on-chain action.
2. **Unwrap:** X-Wing decap → DEK; recompute `dekCommit`; compare to the file prologue; **mismatch ⇒ reject the share as poisoned before rendering anything** (layer1 R2 — this is what committing AEAD bought).
3. **Fetch + decrypt:** ciphertext chunks by chunksRoot; per-chunk SHA-256 verifies without keys (the free verify-cap); decrypt; render.
4. **Accept (one record, Bob signs):** the **WA-2 share-acknowledgment** (law R5): a TAG under Bob's own client-convention ack key, **VAL = encrypted {fileId, wrap recordId, granter}** under Bob's own keys, **occurrence key = HMAC(Bob.scanRoot, "efs/v2/share-ack" ‖ fileId)** — own-derived, opaque, **no REF target to F** (a REF ack would be a public Bob→F edge and would deanonymize the recipient; this is the design's own Playbook-8 discipline). Bob's walkaway recovery re-finds accepted shares by self-scanning his own author stream.

**Explicitly NOT written:** any read receipt, seen-marker, or delivery echo (REJECT, JD-24). **Observer sees:** Bob authored one opaque record at t′ > t. Residual, named: the temporal join (wrap at t, Bob's opaque write at t′) is a weak recipient signal (Playbook 8.2); a recipient who never writes anything remains invisible (atime-gone, the tier's strongest win).

### W1.5 Un-share (re-key)

Removal is an explicit, priced choice (JD-21), and the forward-only law is surfaced **at removal**: *"Bob keeps everything he already decrypted, forever. Re-keying protects future versions only."*

**Eager re-key of one file = a new version** (this is load-bearing for W5 §5.4 — re-keys are version-creating, never in-place):

| # | Record | Kind/row · layout · signer |
|---|---|---|
| 1–3 | new version | `DATA` v2 (fresh salt) + ciphertext chunks (fresh DEK — the fresh-DEK-per-version law is also the nonce discipline) + `contentEncryption` PIN · Alice |
| 4 | escrow wrap | self-escrow `keyWrap` on v2 (occ_self(v2)) · Alice |
| 5…n | remaining recipients | `keyWrap` TAGs on v2 to the remaining set via their mailbox chains · Alice |
| n+1 | pointer | dirnode table entry updated to v2; **the version chain (v1→v2) lives inside the table ciphertext, never as a public `supersededBy` edge** (a public edge between two opaque objects would leak the version graph — JD-19 spirit) · Alice |
| n+2 | hygiene | REVOKE(Bob's v1 wrap claimId) — cryptographically inert (the revoked body persists and still opens v1 for Bob forever); written so Bob's client and Alice's audit trail see the un-share honestly · Alice |

**Lazy option:** table-only flag; re-key happens on next natural edit. UI renders *"removed for future edits; this file stays readable by Bob until it is next edited"* — never a clean "removed". Pricing rendered at the choice: eager ≈ re-upload bytes + ~6–10 records (cents for a document; real money only at folder scale, W5).

**Observer sees:** a new opaque object + a wrap burst whose count went N→N−1 + one revocation (membership-change event: fact, timing, direction — Playbook 5, unmitigated and stated).

### W1.6 Publish (private → public ceremony)

"Make public" is a **new write, never a mutation** (deletion-trash §7.6). System Chrome checkpoint #2, records itemized at S2; the ceremony copy: *"Publishing cannot be undone. Not by you, not by EFS, not by a court order addressed to the protocol."*

**Author choice first (the JD-20 moment in reverse):** publish under the **primary** (public identity) or a public persona — a different author than the private persona. The composer forbids co-batching and defaults the public DATA to the primary.

**Records written (one envelope, signer = primary):**

| # | Record | Kind/row · layout · signer |
|---|---|---|
| 1 | public file | `DATA` (new salt → new fileId) + **plaintext** chunks/manifest · primary |
| 2 | placement | placement PIN under a public path TAGDEF (plaintext name; mint the TAGDEF if new) · primary |
| 3 | metadata | `lang`/`dir`/`mirrors` rows as appropriate (now legal — it's public) · primary |
| 4 | provenance disclosure — **optional, opt-in** | a VAL claim publishing the *old private version's DEK* (or a per-file viewing key). Because the content AEAD is committing, this is a **sound, verifiable disclosure**: the DEK opens the old ciphertext to exactly one plaintext, so anyone can verify "this public file existed encrypted since ⟨admittedAt of v1⟩". Irreversible: the old ciphertext becomes world-readable · primary |

**What history the public graph shows:** without record 4 — two unlinked objects (opaque ciphertext under persona P; plaintext under the primary); nothing on-chain ties them (if P is an unlinked persona, JD-20 hygiene held, and the user accepts the plaintext's timestamp as its provenance). With record 4 — the link is proven and permanent, and every prior wrap/edit timing of the private object retroactively attaches to the published work. The ceremony states this trade in exactly those words.

**Why irreversible:** plaintext on a permanent chain is in every replica's state forever; REVOKE hides pointers, never bytes (`~store:` serves stored bytes without consulting the revocable manifest slot). Crash-mid-publish: multi-envelope tree publishes render "publishing (K of N)" with idempotent resume (deterministic ids make re-submission a no-op) — the pending/confirmed/final taxonomy the OS pass owns (os-pass-handoff G4).

### W1.7 Crypto-shred (shreddable tier only)

**Mechanism — the shred keyring** (this tier's DEK custody; flagged as a NEW convention in the Gap table): per (author, shred-domain), one **keyring** = an encrypted DATA whose padded content is the `{fileId → DEK}` table for every live shreddable file, encrypted under the current **ring epoch key** `K_ring_e` — which exists **only inside device enclaves** (seeded from `shredRoot`, transferred device-to-device at enrollment, never on-chain, never phrase-derivable). The ring's current version is found via a pointer PIN exactly like a dirnode (W2.1 structure). Shreddable DEKs have **no `keyWrap` records at all**.

**Shred(file F), numbered:**

1. Remove F's DEK from the ring table; **rotate the ring epoch**: re-encrypt the new table under fresh `K_ring_{e+1}`.
2. Records written: new ring `DATA` + `contentEncryption` PIN + ring-pointer PIN supersession (3 records · persona). Optionally REVOKE F's dirnode entry (1 dirnode supersession) and optionally a `shredded` courtesy attestation (F7 convention — unverifiable, labeled as courtesy).
3. Every enrolled device erases `K_ring_e` from its enclave and destroys any local plaintext/DEK copies of F. Until all devices confirm: render **"shred pending on K devices"** (layer1 §7.3) — a stolen offline device holding `K_ring_e` + the old ring version is exactly the residual this state refuses to hide.
4. Old ring versions on-chain are now ciphertext under a destroyed key; F's ciphertext is permanently inert **for the owner too**.

**Honesty ladder rendered (deletion-trash §2.2):** owner-only file → "permanently shredded (the ciphertext survives as noise; the claim graph — existence, size-bucket, timing, authorship — survives forever)". Ever-shared file → "access destroyed for future grants; N prior recipients unaffected". Recoverable-tier file → the "Delete permanently" verb is **absent**, with the §0.2 explanation; the offered path is "shred future versions" (recreate in the shreddable tier; old escrowed versions remain recoverable-forever, i.e. HNDL-exposed-forever, stated).

**Observer sees:** one keyring object superseded, maybe a dirnode edit, maybe a courtesy claim. Shred does not erase the metadata skeleton, and no UI copy implies it does.

---

## 2. W2 — Private folders at launch: the encrypted-dirnode tree

Salted-TAGDEF folders do **not** ship at launch (JD-6; the resolver activates post-freeze). The launch construction is the encrypted dirnode (layer1 §5.3), specified here to the record level for the first time.

### W2.1 The construction

A folder = three pieces, all existing machinery:

| Piece | Record | Notes |
|---|---|---|
| **anchor** (permanent folder identity) | `DATA` · body = salt · owner | For a tree ROOT: salt = `HKDF(archiveRoot, "efs/v2/dirnode-root" ‖ i)` → **the anchor's dataId is re-derivable from the phrase alone** (WA-1 entry point). Non-root folders: random salt (their anchors live in the parent's table). Zero content. |
| **pointer** | PIN · definitionId = `efs.os/dirnode` (a one-time public client-convention key-TAGDEF; permissionless extension) · parent/subject = the anchor DATA · target = the current version DATA · owner | Cardinality-1 slot = the mutable cell. Legal per codex am.8 (claims under KIND_DATA parents). |
| **version** | `DATA` (fresh salt) + ciphertext (efs-ctx1, Padmé, 4 KiB floor) + `contentEncryption` PIN · writer | The encrypted **child table**. |

**The child table (inside the ciphertext, invisible on-chain):** per entry `{name, type, entryId, currentVersion fileId, DEK (or child-anchor dataId + child-DEK for subfolders), realSize, times, versionChain, trash flag, per-entry TID + add/remove causal tags}` — plus table-level `{basedOn: [parent version fileId(s)], roster/epoch for shared folders (W5)}`. Names, topology, membership, and version history exist **only here**.

**Default shape — inline subtree:** one dirnode serves the whole personal tree (subfolders are nested inline in the one table) until (a) a subtree is shared separately (it gets its own anchor + DEK so its cap can be handed out — Cryptree keys-on-edges), or (b) the table outgrows its padding bucket. Most personal trees are therefore **one object on chain**.

**Leak profile (honest):** per folder-object: existence, edit cadence, padded size bucket, pointer-record class (the `efs.os/dirnode` definitionId is visible, so an observer can count an author's folder objects and watch their cadences). NOT leaked: names, topology, membership, which file belongs to which folder, deletes-vs-adds. Compare salted trees: full topology + per-node timing (metadata Playbook 4.2) — the dirnode's dominance is why JD-6 flipped the default. Private-tier trash is table-internal: **a private delete leaks nothing but one more dirnode edit** — strictly better than the public tier's FM-P10 "deletions are public history"; this is an undersold win and the doc says it.

### W2.2 Operations (records per op)

| Op | Records | Notes |
|---|---|---|
| create folder (root) | anchor DATA + version DATA + contentEncryption + pointer PIN = 4 | one envelope |
| create subfolder | 0 (inline) or 4 (own anchor, when shared/large) | |
| add/remove/rename/move child | new version DATA + contentEncryption + pointer supersession = 3 | cross-folder move touches two tables → 6 records, one envelope, atomic |
| delete file (to trash) | 3 (table edit: entry → trash) | no on-chain REVOKE needed |
| restore from trash | 3 | |

### W2.3 Concurrent edits from two devices — the merge discipline (the GAP-3 class, applied to dirnodes)

**The hazard:** the pointer PIN is one cardinality-1 slot; two devices concurrently write versions v_A (adds file X) and v_B (adds file Y); LWW picks one; the other's entry vanishes from the current table. Silent child loss.

**The saving structural fact:** LWW loses the *slot*, never the *record*. The losing pointer claim and the losing version DATA remain permanently readable in the author's spine. So the truth can be defined over the causal set, not the slot.

**RATIFIED DISCIPLINE (dirnodes): the pointer is a hint; the table is a CRDT.**

1. **Causal metadata lives in the ciphertext:** every version carries `basedOn` (its parent version fileId(s)); every entry carries its own TID and add/remove tags. Nothing causal is on-chain plaintext.
2. **Merge-on-read:** resolving a folder = read the pointer slot **plus its recent slot history** (the superseded/losing claims, via the spine cursor / priorClaimId chain); if two live versions are causally concurrent (neither in the other's `basedOn` ancestry), compute the deterministic merge: **OR-set, add-wins** for entry existence (a concurrent delete never silently kills a concurrent add — never lose a file), **per-field LWW by entry-TID** for renames/metadata, **union** of version chains. Two concurrent edits of the same *file* produce two version entries rendered as **conflict siblings** (the EQUIVOCAL conflict-copy UX the OS pass already owes) — never an auto-merged file body.
3. **Repair-on-write:** the next writer (any device) writes v_merge with `basedOn = [v_A, v_B]` and supersedes the pointer. The merge function is deterministic and idempotent, so if both devices race the repair, the contents converge and the race quiesces; a device skips the repair if it has seen a pointer whose table ⊇ its merge result.
4. **Fixture:** the two-device concurrent-add dirnode fixture joins the walkaway/CI suite (with the W5 fixture, §5.5).

This is the metadata half of GAP-3: safe to solve with a deterministic merge **because no cryptographic material diverges** — merging two tables is set arithmetic. The FEK half is NOT mergeable and gets a different discipline (§5.4).

### W2.4 Upgrade path when salted TAGDEFs activate (post-freeze)

Dirnodes remain the default forever. The salted family activates as the **addressable/disclosable tier** for exactly three wants dirnodes cannot serve: (a) capability-holder Schelling rendezvous (independent parties derive the same node from a shared salt without exchanging a cap); (b) contract-readable private anchors; (c) reveal-later disclosure (D4 + F-1/F-2: prove "this path was that name all along" with original timestamps). Migration is additive and per-node: mint the salted path, reference it from the dirnode entry (or vice versa — a dirnode entry can point at a salted anchor and a salted node can carry a dirnode cap). No forced migration, no flag day; the two compose.

---

## 3. W3 — Secret configuration: the config-classes ruling

### 3.1 The three classes

**(a) NEVER-ON-CHAIN.** Wallet seeds/keys, persona secp256k1 secrets, API credentials, OAuth/session tokens, TOTP seeds, `shredRoot`, enclave keys, relay credentials. Rule: anything whose compromise grants **authority** (not merely disclosure), or whose useful life exceeds its re-keyability, never becomes chain ciphertext — HNDL makes every on-chain wrap a 100-year bet that both X25519 and ML-KEM hold; for content that bet is stated and accepted, for live credentials it is the wrong bet entirely (a credential can be rotated off-chain in a second; a harvested ciphertext is harvested forever).
**Sync story:** the device mesh, not the chain: (i) the enrollment channel (W4.3 — direct device-to-device transfer, QR/local-network, E2E under per-device KEM keys, nothing persisted anywhere third-party); (ii) thereafter, opportunistic device-to-device sync over the collab-relay rails (§5.6), E2E under pairwise device keys — the relay carries opaque bytes, stores nothing. The platform keychain's own cloud sync (iCloud/Google) is permitted per item **with the escrow named** ("vendor-escrowed"), same honesty rule as the passkey-PRF vault. **Recovery story: none, by design** — class (a) is re-issuable-or-catastrophic: API keys re-issue at the provider; personas die and are re-minted (their claims stay LIVE; the fleet re-links via D2/fleet-map); the wallet seed is the wallet's own backup problem and the identity story (pre-KEL: unrecoverable).

**(b) ENCRYPTED-ON-CHAIN (roams via P9).** Preferences, lens state (under `lensStateKey`), the persona **fleet map** (C-H: private fleet trust is content, never a claim/row), drafts, app config, contacts, dirnode root registry, WA-2 share-acks, the self-index escrow, keybindings/UI state. Mechanics: each is a private-**recoverable** file (W1) in the P9 config dirnode; keys from `archiveRoot` branches → everything in class (b) survives total device loss with the phrase alone (WA-3).

**(c) PUBLIC.** Published lenses (LC2: the shipped default lens MUST be published), public persona links (D2) with labels, `home`/checkpoint claims, deny advisories the user publishes, `encryptionKey` blobs (necessarily public), public handler bindings, package manifests.

### 3.2 The defaults table (per record class)

| Record class | Default posture | Override affordance | One-line why |
|---|---|---|---|
| Personal files (docs, photos, notes, journals, receipts, health) | **private-recoverable** (b-adjacent: W1) | per-file/subtree: → shreddable (explicit, with loss warning) or → publish ceremony | users lose devices far more often than they need erasure (JD-1 recommendation) |
| Erasure-sensitive files (sources, disclosures, intimate content) | **private-shreddable** — never a silent default; chosen via the tier prompt | → recoverable (one-way for future versions only) | shred requires never-escrowed keys; only honest as an explicit choice |
| Folders / trees | **encrypted dirnode, private-recoverable** | subtree → shreddable ring; post-freeze: attach salted-addressable alias | JD-6: less leakage, less gas, launch-viable |
| Config / preferences / app state | **(b) encrypted-on-chain** | app manifest may request (c) public with a user grant | config is personal data; roaming beats re-setup; nothing here needs shred |
| Lens state / personal lens config | **(b)** | the *shipped default* lens is (c) public by LC2 — personal extensions stay (b) local/encrypted (JD-25 carve-out) | a published personal lens is a published social graph |
| Persona fleet map | **(b), always** — never public, never a row | none upward; disclosure is per-reader wrapped share only | C-H / SF-2: a public fleet map re-clusters the fleet, permanently |
| Credentials / keys / tokens | **(a) never-on-chain** | none | authority-granting + HNDL; rotate-not-archive |
| App data (caches, indexes, documents) | **private-recoverable** under the app's persona | app may request public subtree grant | blast-radius: app junk stays opaque and revocable-by-disavowal |
| Social posts / published artifacts | **(c) public** under the chosen persona | drafts are (b) until the publish ceremony | it's the point of publishing; the ceremony is the boundary |
| Drafts | **(b)** | → publish ceremony (W1.6) | drafts are the classic accidental-disclosure class |
| Share-acks / self-index / recovery artifacts | **(b)** with owner-derived opaque keys | none | they ARE the recovery path (WA-1/WA-2) |

---

## 4. W4 — Multi-wallet single human (desktop EOA + phone EOA)

### 4.1 Which is primary

**One human = one primary author** (the account doctrine). The desktop/hardware-custody EOA is the primary (rung 0/2 custody; it signs only at System Chrome checkpoints). The phone EOA is **not a second primary**: it enrolls as a **device persona** (Axis-1 per-device key; Axis-2 public-linked, labeled `device:phone` via the D2 pair). The phone never holds or reconstructs the primary key. Two primaries would fork the user's namespace, lens identity, and fleet ownership — the design forbids it and the onboarding flow says why.

### 4.2 How the phone reads the desktop's private tree

Two enrollment trust levels; the user picks at enrollment (default: full):

- **Full device (default for your own phone):** the phone receives `rootSecret` (wrapped to its device KEM key, transferred over the enrollment channel) → derives `archiveRoot` → every recoverable-tier object opens through the same self-escrow wraps and dirnode tables the desktop uses. **Zero extra on-chain records per file.** Consequence, stated at enrollment: a stolen full device is a whole-archive-tier event (see 4.5).
- **Scoped device (the "travel phone"):** no `rootSecret`. The desktop wraps *specific* subtree keys (a dirnode's DEK + table chain) to the phone's own `kem` key — ordinary `keyWrap` TAGs on the shared anchors, occurrence keys via the self-mailbox. Stolen scoped device = only what was wrapped to it. Cost: O(shared subtrees) wraps + ongoing wraps for new roots.
- **Shreddable tier:** `K_ring`/`shredRoot` material transfers **only** over the direct enrollment channel (never chain, never platform sync). A scoped device simply has no shreddable access.

Inbound shares from friends reach both devices because the user's public `encryptionKey` blob (under the **primary's** address, C3/F-5) lists both devices' `kem` entries — granters wrap to every current entry (layer1 §3), so each device unwraps with its own key.

### 4.3 Enrollment ceremony for a new device (numbered)

1. **Phone (new device):** generates locally — device secp256k1 persona key, device X-Wing KEM keypair, device scan key (enclave-resident where available). Nothing leaves the device.
2. **Offer:** phone renders a QR = {persona address, kem pk, scan pk, session nonce}. Public keys only — safe in a QR (JD-11 applies to *secrets* in URLs, not pubkeys).
3. **Verify:** both screens show a short auth string over the offer; the human compares (the anti-MitM step).
4. **Desktop (primary custodian) signs one envelope — System Chrome checkpoint #5 (Grant), S3, primary:**
   - `efs.os/persona` TAG (D2): target = phone address, VAL label = `device:phone` · primary
   - `encryptionKey` PIN supersession: primary's blob + phone's `kem` + `scan` entries · primary
   - optional `act` TAG (D1): target = phone persona, VAL = scope grammar (subtrees/kinds), `expiresAt` = window — only if the phone must write **as the primary's authority** into reputation-bearing namespace; day-to-day phone writes are its own persona's, stitched by the D2 pair · primary
5. **Phone signs its reciprocal:** `efs.os/primary` PIN (D2 other half) · phone persona · separate envelope (different author, structurally).
6. **Secret hand-off (full device only):** `rootSecret` wrapped to the phone's kem key, delivered over the direct channel (default) or as an encrypted vault DATA on-chain (recoverable-tier escrow artifact; acceptable for `rootSecret`, **never** for `shredRoot`).
7. **Bootstrap:** phone decrypts the self-index escrow, initializes Lane-1 cursors, derives its `clientId` per the device-bit roster convention (P10).

Records: 2–3 primary claims + 1 phone claim (+ optional 1 vault DATA). **Observer sees:** the primary endorsed a new labeled device persona and rotated its encryptionKey blob — a public "new device" event (chosen leak: the D2 link is deliberately public for a *device*; an *unlinkable* persona would never get a D2 pair — §4.6).

### 4.4 Day-to-day: who signs what

Per the wallet-and-actions doctrine table: app content/saves/annotations → device persona, promptless under Kernel policy; identity rows, lens publications, grants, publishes → primary at checkpoints. **The JD-20 guard is normative here:** a write into any private-tier subtree under a public-linked persona whose privacy class mismatches the subtree's (e.g. saving into an unlinked-persona tree while the `device:phone` persona is active) **breaks the promptless path** with a loud System-Chrome interstitial — private-tier authorship is S3-severity. Unlinkable personas additionally default to relayed/sponsored flush and refuse/loud-warn linked-wallet top-ups (JD-20).

### 4.5 Revoking a stolen device — and what the thief keeps forever

**Actions (in order, first envelope within minutes):**

1. Primary REVOKEs the phone's `efs.os/persona` TAG + its `act` rows; REVOKEs broadcast multi-venue by default · primary.
2. Flush the phone persona's **pre-signed revoke-all ladder** (minted at enrollment; pre-revocation is legal) — its past claims read EMPTY for lens-following readers · anyone may submit.
3. Supersede the primary's `encryptionKey` blob (drop the phone's kem/scan entries) — future inbound wraps exclude it · primary.
4. **Re-key, priced (JD-21):** full device ⇒ this is a **root-rotation event**: mint new `rootSecret`; re-wrap the archive tier (new self-escrow wraps under the new recovery KEM; new dirnode DEK chain) eagerly or lazily per the priced choice; shred domain rotates `K_ring` (cheap — one ring supersession) and the stolen device's enclave copy is why "shred pending on K devices" exists.

**What the thief keeps forever (the honesty box, rendered in the Permission Center):**

- Every plaintext and DEK it already held; every **cold file not eagerly re-keyed** (lazy mode leaves them readable forever — JD-21).
- If a full device: the old `rootSecret` → all old salts, **all dirnode anchor ids** (it can watch your new ciphertexts' existence and cadence at known anchors forever — anchors are identity, not secrets; offer anchor rotation as part of eager re-key), the old `scanRoot` → **every `k_AB` mailbox secret**, which retroactively links your entire pairwise wrap history with every counterparty (H2's stated compromise property) and can watch future mailbox traffic until counterparties re-key their mailboxes (the SDK rotates `k_AB` chains on device-revocation notice).
- The phone persona's signing key — it can author as that persona forever; your REVOKE is prospective un-endorsement, not retroactive disavowal (the "was-me-until-N" partition waits for the KEL).

**What the thief does not get:** the primary key (never on the phone), future DEKs/epochs, and — if the phone was scoped — anything outside its wrapped subtrees.

### 4.6 The persona-link answer (C-H), with a concrete fleet map

Public personas (devices, agents, public app roles) use the **D2 rows** — public, labeled, primary-endorsed. Private fleet trust is **content, never a claim**: the **fleet map** is a class-(b) encrypted config file:

```json
{ "fleet": [
  {"addr":"0x…phone",  "label":"device:phone",  "link":"D2-public", "flush":"self-pay"},
  {"addr":"0x…notes",  "label":"app:notes",      "link":"D2-public", "flush":"self-pay"},
  {"addr":"0x…anon1",  "label":"whistle-forum",  "link":"NONE — fleet-map only", "flush":"relayed-only",
   "funding":"sponsored-only", "clientId":0, "encryptionKey":"distinct", "envelopes":"never co-batched"}
]}
```

`0x…anon1` has **no D2 pair, no on-chain edge of any kind to the primary**; it exists as a persona only inside this ciphertext and in the user's local client-config lens (the JD-25 LC2 carve-out — fleet trust never enters a published lens). Its unlinkability budget is exactly the JD-20 conjunction: no public link AND relayed/sponsored flush AND no linked-wallet funding AND clientId=0 AND distinct encryptionKey/scan keys AND separate envelopes — the OS enforces all six as defaults for any persona marked unlinkable, and the honest residual is still stated: behavioral/timing correlation (Playbook 7) is not solved, only starved.

---

## 5. W5 — Collaboration: the 5-person team shared folder

Team: Alice (curator), Bob, Carol, Dave, Eve. Machinery: JD-10 pairwise wraps + team-key indirection (≤50 members; no MLS on-chain — kill-list #4).

### 5.1 Structure

- **Folder:** a shared encrypted dirnode (W2.1): Alice-authored anchor DATA + versions. **Multi-writer pointer rule (5.3).**
- **Team key:** the team "KEK" is an **X-Wing keypair per membership epoch** (`teamKeypair_e`; the 32-byte dk seed is what gets wrapped around). Public half: any member (or invited outsider) can seal INTO the team; private half: members unwrap any file DEK. Derivation: `teamKeypair_e` from `HKDF(teamSeed_T, LE64(e))` where `teamSeed_T = HKDF(curator.archiveRoot, "efs/v2/team" ‖ teamId)` — deterministic **for the curator only** (load-bearing in 5.4). Consequence, named: team epochs live under the curator's root — curator device theft is a team-re-key event (new teamId under the new root); curator phrase-recovery restores team custody (a walkaway property).
- **Per-file:** each file has its own DEK (W1), wrapped **once to the current team epoch pk** (one `keyWrap` TAG on the fileId, occurrence key = `HMAC(teamScanSecret_e, fileId)` — opaque, member-derivable).
- **Membership:** epoch-seed wraps to each member: `keyWrap` TAGs **on the team anchor DATA**, sealed to each member's kem entries, occurrence keys via the curator↔member H2 mailboxes. The **roster lives inside the dirnode ciphertext** (epoch number, member list, member scan material) — on-chain, membership is only a fan-out count.

**Records at creation (Alice, one envelope):** anchor DATA + version DATA + contentEncryption + Alice's pointer PIN + 5 epoch wraps (one per member incl. self) + self-escrow wrap = **10 records ≈ cents**. Invite Bob later = 1 epoch wrap + 1 table edit (3 records). Bob accepts: WA-2 ack + installs the folder in his **local client-config lens** (JD-25/SF-2: the workspace's member trust is distributed inside the encrypted roster and installed locally; nothing published enumerates the team).

### 5.2 Member writes (each signs their own records)

Bob adds a file: Bob authors `DATA` + chunks + `contentEncryption` + one `keyWrap` (DEK sealed to `teamPk_e`) + his table edit (5.3). **Author = signer always**; there is no "team author". Readers attribute via the roster; delegation-flavored attribution ("Bob for ACME") is the `act`-row read-side convention if the team wants it. **Observer sees:** five stable authors co-writing wraps/edits that target one anchor and its version objects — **the co-occurrence clique is visible and unfixable** (Playbook 1; the anchor is opaque but the clustering is not). Stated in the team-creation ceremony, verbatim: *"The world can see that these five addresses work together, and when. It cannot see on what."*

### 5.3 Multi-writer dirnode: per-member pointers + CRDT merge

Bob cannot supersede Alice's pointer PIN (different author = different slot — there is no shared mutable cell, by design). Ratified: **each member holds their own pointer PIN** on the anchor (same `efs.os/dirnode` key, per-author slots). Readers resolve **all roster members' pointer slots**, take the causal frontier of the pointed versions, and apply the W2.3 merge discipline (OR-set add-wins over table entries; conflict siblings for same-file concurrent edits; repair-on-write by whoever writes next). Non-roster authors' pointers are **ignored by the merge** — permissionless writes mean Eve-after-removal or a vandal can still write records at the anchor, but membership is curation (read-side roster), never a write gate (master invariant respected). Cost: readers resolve ≤N pointer slots — N ≤ 50 by JD-10's own bound.

### 5.4 Remove a member — and THE GAP-3 CLOSURE (binding)

**Removal of Eve (records):**

1. **Epoch rotation (curator only):** Alice derives `teamKeypair_{e+1}` (deterministically, from `teamSeed_T`); writes 4 epoch wraps (remaining members, via mailboxes) + self-escrow · **primary-signed at a System Chrome checkpoint (S2/S3), never promptless** (rotation is a checkpoint op).
2. REVOKE Eve's epoch-e wrap (hygiene; inert — Eve holds epoch-e forever) · Alice.
3. Roster/table edit: Eve out, epoch++ (inside ciphertext); Alice's pointer supersession · Alice.
4. **Curator sweep:** Alice re-affirms (in the table) which Eve-authored entries remain in the folder view (Eve's DATAs are hers forever; the view is curation). Approval-sweep-as-curator-re-PIN, per the os-pass-handoff remove-member verb.
5. **Per-file re-key — the JD-21 priced choice, rendered with numbers:** *"Clean removal now: K files × (re-encrypt + re-upload + 1 wrap) ≈ $X and Y MB; or free lazy removal: K cold files stay readable by Eve forever."* Eager = for each file: a **new version** under a fresh DEK wrapped to epoch e+1 (the W1.5 shape). Lazy = files re-key on next natural edit. The forward-only law is surfaced **at removal** (and was surfaced at grant).

---

**THE GAP-3 RATIFICATION.** The critic sketched two candidate disciplines: (A) single-writer-per-file serialization, or (B) deterministic FEK = f(oldFEK, membership-epoch). **Finding first, stated loudly: arm (B) as literally sketched is cryptographically unsound for removals.** Derivation: the removed member Eve holds every epoch-e secret, including every oldFEK/old epoch key, and the membership-epoch counter is public; therefore any deterministic function of (oldFEK, epoch) is computable by Eve, and the "rotation" excludes no one. Convergence and exclusion are in direct tension: exclusion requires entropy Eve never held; fresh entropy from two devices cannot deterministically converge. (B) survives only if the deterministic input includes a secret outside the shared team state — which is a single-writer's secret, i.e. arm (A) wearing math.

**The ratified discipline is the sound synthesis of both arms:**

> **R-GAP3.1 — Rotation authority is single-writer:** membership-epoch rotation is a **curator-primary checkpoint operation** (one author; never promptless; never a persona write). One author's `order` totally orders their own commits — the designated-committer answer layer1 §6.1 already names. Concurrent removals by *different members* are excluded by authority, not by luck; a member "remove" request is an intent routed to the curator (or to the co-curator set under R-GAP3.4).
>
> **R-GAP3.2 — The authorized writer's own concurrency converges by derivation:** epoch secrets derive deterministically from the **curator's private root** (`teamSeed_T`, §5.1), which Eve never held. If the curator's two devices race the same removal, both derive the identical `teamKeypair_{e+1}`; their duplicate epoch wraps land in the same mailbox-indexed slots (same occurrence keys → LWW picks one valid wrap of the same seed — nothing lost); eager per-file re-keys pin `DEK_{F,e+1}` and the version-DATA salt from `HKDF(teamSeed_T, "rekey" ‖ fileId ‖ e+1)`, so racing devices produce **byte-identical DATA re-derivations = idempotent no-ops** (the frozen duplicate policy absorbs the race).
>
> **R-GAP3.3 — Content re-keys are version-creating, never in-place:** a re-key is a NEW version DATA with its own once-written `contentEncryption` PIN. The attack-os-tier §3.3 lost-plaintext hazard came from two devices superseding one `contentEncryption` cardinality-1 slot with two different FEKs; under this discipline that slot is written exactly once per version by the version's creator and never rotated. Concurrent edits/re-keys land as **two versions in the dirnode CRDT** (mergeable, both decryptable, conflict-sibling UX) — the race moves from a lossy LWW slot to a mergeable table. This dissolves the §3.3 collision rather than refereeing it.
>
> **R-GAP3.4 — Failure analysis, stated:** (A)-side residual: curator liveness — removals wait for the curator (acceptable: removal is deliberate; *adds* don't rotate epochs and stay member-writable). Curator loss: phrase-recovery restores `teamSeed_T`; curator handoff = new teamId under the new curator's root, wrap fan-out to members (a re-key-everything event, priced). Co-curator teams: allowed only as **disjoint rotation authority** (exactly one rotation author per epoch, agreed in the roster; two curators racing different removals is a roster-level conflict rendered as EQUIVOCAL, resolved humanly — never silently merged). Offline member during rotation: picks up epoch e+1 wraps from its mailbox on next sync; no divergence is possible because no second author ever writes epoch state. (B)-side residual: none retained beyond R-GAP3.2's use — the naive form is rejected above.

**The walkaway fixture (owed to the WA/CI suite, spec):** simulate curator devices D1, D2 and members Bob (online), Carol (offline), Eve (removed): (1) D1 and D2 execute remove(Eve) concurrently under message delay; assert exactly one epoch-(e+1) keypair exists, every remaining member ends with ≥1 live wrap, and no byte-distinct duplicate re-key versions exist (idempotence). (2) Bob edits file F during the rotation; assert F yields two dirnode versions (conflict siblings), both decryptable, neither lost. (3) Carol returns; assert she reads everything with no manual repair. (4) **Eve's client, holding the complete epoch-e state, asserts it CANNOT compute epoch e+1** (the anti-(B) check — this assertion is the fixture's reason to exist). (5) Lazy-mode variant: assert cold files remain Eve-readable and the UI state says so.

---

**Observer sees (removal):** an epoch-wrap burst with fan-out 5→4 + a revocation + dirnode edits — membership change: fact, time, direction, not identity (Playbook 5, stated).

### 5.5 Economics (carried from attack-os-tier §6)

5-person team, ~50 files/month ≈ $0.2–2/month. Remove-member eager over a 500-file tree ≈ 2,000+ records ≈ $1–10 **plus the ciphertext re-upload** — the gradient still points at lazy, which is why JD-21's priced-choice UI is normative, not advisory.

### 5.6 THE COLLAB-TRANSPORT SPEC (GAP-4 closure, binding)

Live co-editing = client-encrypted CRDT deltas (Yjs-class) over a **stateless, ciphertext-only, self-hostable relay**. The chain never sees a delta; the relay never sees plaintext; the on-chain artifacts are identical whether or not the live layer exists (the relay never holds anything the chain trusts — layer1 §6.3, driven to spec here).

- **Session:** any member starts a session for file F: `K_sess` ← 32 B CSPRNG; **session announcement** = `{K_sess, F, saver-hints}` sealed to the **team epoch pk** (one X-Wing HPKE blob), posted **in-relay** to the room (default: zero on-chain records; an optional on-chain `keyWrap` rendezvous TAG is available for chain-only discovery and is default-OFF — it would leak session existence/timing).
- **Room addressing:** `roomId = HMAC(teamScanSecret_e, "efs/v2/collab" ‖ fileId ‖ sessionNonce)` — derivable by members only; the relay sees opaque room ids and byte blobs.
- **Delta encryption:** per-sender keys `K_send = HKDF(K_sess, "sender" ‖ senderNonce)`; each Yjs update encrypted with the committing-AEAD recipe (ChaCha20 + HMAC), counter nonces per sender, AAD = (roomId, seq) against cross-room/replay splicing; deltas padded to 1 KiB buckets. Intra-session per-delta attribution is a relay-layer nicety (all members hold `K_sess`, so member-forged deltas are possible within the session and the design does not pretend otherwise); **the only EFS-grade authorship is the saved version's envelope signature**.
- **Relay trust statement (what the relay learns):** connection presence and IP (unless members connect via their relayed/OHTTP transport), delta timing/burst patterns, padded sizes, session duration, participant count per opaque room. **What it cannot do:** read content, learn EFS identities or file identities, forge or modify (AEAD), or affect the archive (worst case = drop/delay/partition — a liveness attack that degrades to offline editing, never an integrity or confidentiality event). It is stateless: no accounts, no history requirement; a bounded in-flight buffer is permitted and is opaque anyway.
- **Checkpoint cadence:** fold the live state into a **saved version** every 5 minutes of activity or 256 KB of deltas or on last-member-leave, and always on explicit save: the saver writes a normal private DATA under a fresh per-file DEK wrapped to the current team epoch (the W1/W5 machinery, ~4–5 records) + their pointer/table edit; **author = saver's signature**. Deltas between checkpoints are ephemeral by design: if every participant crashes simultaneously, un-checkpointed keystrokes are lost — same as any editor; stated, not hidden.
- **Offline/rejoin:** returning member syncs the latest saved version from chain, rejoins the room, receives the live Yjs state-vector diff from any online peer (through the relay, under `K_sess` from the current announcement). A member who edited offline holds a local Yjs branch: on rejoin it CRDT-merges (that is what Yjs is for); if they had checkpointed offline work on-chain, the dirnode shows sibling versions and the **next checkpoint merges both states** into one version with `basedOn = both`.
- **Launch-honest tiering:** at launch, the correctness story is complete **without** the relay — shared folders + versioned saves + wraps (asynchronous collaboration; "save often"). The live layer ships when a reference relay exists; the reference relay is a trivial websocket room server, self-hostable, but **a relay nobody runs is dark** (the RF-1 lesson applied to ourselves) — its operation is a resourcing decision (JD-16 posture applies: separate entity, minimal logs), flagged in Decisions. Roadmap, not launch, unless resourced.

---

## 6. W6 — Recovery / walk-away

### 6.1 The account-vs-data distinction, at setup (Proton's rule)

First-run copy, verbatim candidate: *"Two different keys protect two different things. Your **wallet seed** is your identity — if you lose it, nothing can recover your authorship (until key succession ships, ~2030). Your **EFS recovery phrase** is your data — with it alone, on a new device, you can rebuild your entire private archive from the public network. Write both down. They are not the same thing, and neither can be reset."* The EFS phrase is never derived from the wallet (G9 extension: no root secret from the identity key or its signatures — JD-7).

### 6.2 The ladder (JD-11), concretely

1. **Recovery phrase (mandatory prompt at onboarding).** The phrase IS `rootSecret` (BIP-39-style encoding of the 256-bit CSPRNG root minted at onboarding — entropy first, words as the display format; no signature anywhere in the chain of custody). Recovery = type phrase → `rootSecret` → `archiveRoot` → the §0.4 tree → everything in §6.3. The phrase recovers the **recoverable tier and class-(b) config only** — never `shredRoot` (kill-list #14), never device persona keys (class (a); dead personas are re-minted and re-linked), never the wallet.
2. **`.efs-bundle` recovery file** (export ceremony, checkpoint #6, T10): contains `{rootSecret wrapped under an Argon2id file-passphrase, the input manifest (primary address, home venues, dirnode root indices, KEM registry pins, convention/vector versions), a self-index snapshot}`. Purpose: recovery that survives forgetting which client you used, and a faster-than-rescan bootstrap. Explicitly NOT in the bundle: `shredRoot`, persona signing keys, pre-signed ladders (those stay in the vault tier).
3. **Opt-in Shamir social recovery — of the archive root only, never the shred root.** Setup: split `rootSecret` k-of-n (default 3-of-5); for each friend, the share rides as an encrypted DATA (share ciphertext under a fresh DEK) + one **E5 `keyWrap` TAG** sealing that DEK to the friend's `encryptionKey`, **opaque occurrence key via the H2 mailbox** — so recovery shares are indistinguishable from ordinary private shares on-chain; nobody can enumerate your recovery circle (fan-out count of n wraps on n opaque objects is the residual, named). Friends' clients ack (WA-2) and file the share in their own class-(b) config. Recovery: contact k friends out-of-band; each friend's client **re-wraps their share to your new device's kem key** (one new `keyWrap` TAG each, friend-authored — onward wrapping is the bearer-semantics feature working for you); your new device decrypts k shares → `rootSecret`. Ceremony includes an out-of-band voice/fingerprint verification step and the social-engineering warning ("EFS will never ask your friends for shares; only you, in person, do").
4. **Device loss vs total loss, per tier (JD-1):**

| Scenario | recoverable tier | shreddable tier |
|---|---|---|
| Lose one device (others enrolled) | ✔ nothing lost (other devices hold `rootSecret`); revoke per W4.5 | ✔ other devices hold the ring epoch; rotate ring |
| Lose ALL devices, have phrase (or k friends) | ✔ full recovery (§6.3) | ✘ **permanent loss — by design; this is what shreddable means** |
| Lose all devices + phrase + no social | ✘ data death (stated at setup; nobody can reset it) | ✘ |

### 6.3 How keys-only recovery actually walks (the WA-0..3 trace)

- **WA-1 (private tree with keys only):** phrase → `archiveRoot` → `dirnodeRootSalt_i` → **root anchor dataIds re-derive** (point-read, no indexer) → pointer PIN → current version DATA → `occ_self(versionFileId)` → **point-read the self-escrow wrap** (F-4's owner-derived key is exactly what makes this a point-read, not a scan) → DEK → decrypt table → children's fileIds + DEKs are IN the table → recurse. Standalone files: own self-escrow wraps found via the self-index (or spine self-scan as the slow path). **Passes with the phrase alone against any public RPC.**
- **WA-2 (shares):** own-author spine scan finds the encrypted share-acks (accepted shares re-open via the recorded wrap refs); the closed unrecoverable-reason list names the holes exactly: never-accepted shares (undiscoverable without re-scan — the price of the closed A1 oracle, law-positioning §3.4), revoked-then-re-keyed content, shredded content.
- **WA-3 (config):** class (b) re-opens under `lensStateKey` etc.; lenses, fleet map, contacts, ring-fenced from WA-1's tree walk only by branch labels.
- **Fixtures owed to the suite from this design:** the W2.3 two-device dirnode fixture; the §5.4 concurrent re-key fixture; a tier-honesty fixture (assert shreddable content is absent from phrase-only recovery AND that the failure reason is the documented one, not a silent hole).

---

## 7. The SDK boundary (kept thin, per the standing rule)

The SDK owns: the derivation tree and all HKDF labels + vectors; efs-ctx1 encrypt/decrypt + dekCommit; X-Wing wraps (info/aad discipline); occurrence-key derivation (occ_self, mailbox chains, team scans); the three scan lanes + self-index; dirnode table codec + the W2.3/5.3 merge; padding; ring/epoch rotation; enrollment channel crypto; recovery (phrase/bundle/Shamir); fixture harnesses. The client owns: tier prompts, ceremonies and their copy, the priced-choice removal UI, pending/confirmed/final rendering, the Permission Center honesty boxes. **No client ever assembles records or touches key material directly.** Anything here that smells like client-side crypto is an SDK API by construction.

---

## Freeze-sensitive reservations

**Expected: none new. Check performed — every construction in this file, tested against the frozen surface:**

| Construction (new in this file) | Frozen-surface test | Verdict |
|---|---|---|
| Dirnode anchor DATA + `efs.os/dirnode` pointer PIN (W2.1) | user key-TAGDEF = permissionless extension; PIN under KIND_DATA parent legal (codex am.8); DATA salts author-chosen | **convention, post-freeze-addable** |
| OR-set dirnode merge + basedOn causal metadata (W2.3/5.3) | lives entirely inside ciphertext + client read discipline | **convention** |
| Shred keyring + ring-epoch rotation (W1.7) | DATA + PIN + enclave-held keys; no row, no kernel state | **convention** |
| Team epoch derivation from curator root (5.1/5.4) | client-side HKDF; labels are SDK vectors (Durable) | **convention** |
| Deterministic re-key salts → idempotent convergence (R-GAP3.2) | rides the already-frozen byte-identical-re-derivation-is-a-no-op duplicate policy | **nothing needed** |
| Recovery-share DATAs + E5 wraps (§6.2.3) | ordinary kinds + E5 as amended (F-3/F-4) | **convention** |
| Collab relay + session wraps (5.6) | entirely off-chain; optional rendezvous TAG is an ordinary keyWrap | **convention / off-chain** |
| Phrase-as-root + `.efs-bundle` (§6.2) | pure client key management | **convention** |

**Consumed (not added) ceremony dependencies — this design fails if these don't land as ruled:** **F-3** ("opaque" not "random" — every occurrence key above is structured: occ_self, mailbox chains, team scans, share-acks; under "random" this entire tier is non-conforming), **F-4** (owner-derived self-escrow — WA-1's point-read), **F-5** (kem+scan roles in the `encryptionKey` blob — mailboxes, multi-device, enrollment). Also consumed: E6 header-folding, E5 TAG-only, D1/D2, the §3.4 promotions. **Deliberately not consumed:** the salted resolver (nothing here writes against it — the attack-os-tier W2/W3 launch trap is designed out, not papered over), `admittedAt`/B1 (no step gates on it), any stealth/ZK surface, any new row. **Over-reservation guard honored:** this design asks the ceremony for zero bytes.

---

## Gap table — machinery that is neither reserved surface nor (yet) blessed convention

Everything below is post-freeze-addable (checked above); "gap" means it needs a home in the conventions registry / SDK vectors / resourcing, not the ceremony.

| # | Gap | Class | What closing it needs |
|---|---|---|---|
| G-1 | `efs.os/dirnode` pointer convention + dirnode table codec + W2.3 merge rules | convention, unblessed | conventions-registry entry + SDK vectors + the two-device fixture; **launch-blocking for private folders** |
| G-2 | Shred keyring (ring format, epoch rotation, "shred pending on K devices" protocol) | convention, unblessed — the shreddable tier's mechanism was never specified anywhere in the corpus | registry entry + vectors + tier-honesty fixture; **launch-blocking for the shreddable tier** (recoverable tier ships without it) |
| G-3 | Share-ack record shape (encrypted, own-keyed, no REF target) | law R5 blessed the *existence*; the exact shape is unpinned | registry entry + WA-2 fixture |
| G-4 | Team-epoch derivation labels + R-GAP3 discipline + fixture | ratified here; needs registry + CI | conventions registry + the §5.4 fixture in the WA suite |
| G-5 | Collab relay reference implementation + operation | spec'd here (5.6); **no relay exists**; dark until someone runs one | resourcing (JD-16 posture); launch ships async-collab only |
| G-6 | Enrollment channel (QR/local-network E2E transport for rootSecret/shredRoot/class-(a) sync) | convention, unblessed | registry entry + short auth-string spec; **launch-blocking for multi-device** |
| G-7 | Mailbox-chain rotation on device revocation (W4.5's k_AB re-key) | H2 blessed; the revocation-triggered rotation protocol is not | registry entry; degrades gracefully (manual re-key) if late |
| G-8 | Coarse-TID mode (hour quantization + intra-bucket monotone counter) | JD-22(c) blessed the posture; the exact quantization is unpinned | SDK convention + supersession-cost note |
| G-9 | Conflict-sibling UX for same-file concurrent versions | owed by the OS pass already (EQUIVOCAL conflict-copy UX) | OS-pass surface spec; this file only depends on its existence |

---

## Decisions for James

Only genuinely new ones; refinements reference the JD they refine.

**JD-26 (new; refines JD-6) — Shared-folder write model: per-member pointers + CRDT merge vs designated-committer.** Plain: in a team folder, either every member publishes their own "current table" pointer and readers merge (no single point of liveness; readers check ≤N slots), or one member serializes all table updates (simple reads; that member's absence stalls the folder). Recommendation: **per-member pointers + merge (§5.3)** — it matches the no-shared-mutable-cell grain and survives any member going dark; the merge discipline is deterministic and fixture-tested. Defer-cost: shipping single-writer folders and discovering the liveness cliff in the field.

**JD-27 (new; completes JD-1) — The shreddable tier's custody mechanism: shred keyring (on-chain encrypted ring + enclave epoch keys) vs device-mesh-only (no on-chain artifact).** Plain: the keyring lets your own devices sync shreddable-file keys through the chain (as opaque ciphertext under a destroyable key) with O(1) records per shred; mesh-only avoids even that ciphertext but shreddable files then sync only when two devices are simultaneously online, and one-device users have zero redundancy. Recommendation: **keyring (W1.7)** — the on-chain residue is one opaque object's cadence, and per-file shred stays honest via epoch rotation. Defer-cost: shreddable tier ships single-device-only.

**JD-28 (new; refines JD-1/JD-11) — Device enrollment trust default: full (shared rootSecret) vs scoped (per-subtree wraps).** Plain: a full phone opens everything and costs nothing per file, but a stolen full phone is a whole-archive event (root rotation, mailbox-history exposure — W4.5); a scoped phone bounds theft to what was wrapped to it, at ongoing wrap cost and UX friction. Recommendation: **full as the default for personally-held devices, scoped offered as "travel mode"** — with the W4.5 honesty box shown at enrollment, not after theft. Defer-cost: none technical; this is a default-and-copy decision.

**JD-29 (new) — Ratify R-GAP3 (§5.4) as the group re-key discipline, noting it overrides half of the critic's sketch.** Plain: the critic offered "single-writer" OR "deterministic new-key-from-old-key" as candidate repairs; this design shows the second is unsound alone (whoever you removed can compute the "new" key, since it's a function of things they already have) and ratifies single-writer authority + determinism *from the curator's own secret root* + re-keys-as-new-versions. This is the one place this file amends a critic repair sketch rather than instantiating it — the derivation is in §5.4 and the fixture's assertion (4) tests it mechanically. Recommendation: ratify; commission the fixture with the WA suite.

**JD-30 (new; resourcing, JD-16-shaped) — The collab relay.** Plain: live co-editing needs one dumb ciphertext relay running somewhere; the spec is ~a websocket room server, but RF-1's lesson is that unfunded relays are vapor. Options: (a) ship async-collab at launch, stand the reference relay up under the separate-entity posture when resourced (**recommended**); (b) launch-block on the relay; (c) let the ecosystem run relays with no reference deployment. Defer-cost of (a): honest — launch collaboration is save-cadence, not keystroke-live.

---

## Confidence

**VERIFIED (read in full this session, design derived from the texts):** critic.md (all rulings, kill list, freeze table), attack-os-tier.md (every finding designed against: W2/W3 launch trap → nothing here touches the salted resolver; §3.3 → R-GAP3; §4.1/4.2 → JD-20 defaults in W4; §2 → JD-11 share transport; §5 → the tier split and the W4.5/§6 honesty boxes; §6 → JD-21 priced choices), layer1-crypto.md (wrap spec, scan lanes, P9 tree, dirnodes §5.3, efs-ctx1, X-Wing, padding — consumed as the substrate), metadata-adversary.md (every "observer sees" line is checked against Playbooks 1/2/4/5/7/8 and §6), privacy.md, fs-pass-freeze-reservations.md, identity.md, codex-kinds.md, fs-pass-synthesis.md (C1–C14 — no step introduces a write gate, a fold on admittedAt, or a second removal spelling), os-pass-handoff.md, wallet-and-actions.md (persona axes, custody rungs, checkpoints, S-classes), law-positioning WA-gates + R5/R8, deletion-trash-privacy.md.

**Derived here and internally verified, wanting adversarial re-run (the GAP-2 closure condition):** the R-GAP3 unsoundness derivation for naive deterministic-FEK (§5.4 — one paragraph, checkable: removed member holds all epoch-e state; deterministic f of held state is computable); the dirnode record-level construction (anchor/pointer/version) and its legality reading of codex am.8; the OR-set merge discipline; the shred keyring; the WA-1 trace in §6.3 (each hop uses only point-reads on derivable ids + own-author scans). A re-run of attack-os-tier against these numbered steps is owed and expected to focus on: the pointer-history read path (does every client see losing claims uniformly?), the keyring's offline-device residual, and the enrollment channel's MitM surface.

**PLAUSIBLE (order-of-magnitude, inherited):** all dollar/gas figures (read-privacy's ±5× band via attack-os-tier §6); table-capacity-per-padding-bucket estimates (~40 entries/4 KiB); Yjs merge behavior at the checkpoint boundary (standard CRDT properties, not re-verified against a Yjs version).

**COULD-NOT-VERIFY:** enclave key-erasure guarantees across real platforms (the shreddable tier's "destroyed" inherits layer1 §7.3's custody-claim honesty — "shredded" is a claim about key custody, not other people's hardware); whether codex am.8's attachment-matrix relaxation covers the `efs.os/dirnode` PIN-under-DATA shape byte-exactly (flagged for the kinds owner — if not, the pointer re-homes to a per-user random-name TAGDEF parent with identical properties and one extra record at tree creation; the design does not change shape).
