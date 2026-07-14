# Privacy pass — Layer 1 (confidentiality) cryptographer review

**Lane:** CRYPTOGRAPHER — does Layer 1 actually instantiate HPKE / MLS / Cryptree / Tahoe, or cargo-cult them?
**Targets reviewed:** [[privacy]] §3 (Layer 1), [[fs-pass-freeze-reservations]] C3/E5/E6/D3/D4/§H, [[identity]] (G9 coupling rule), [[codex-kinds]], [[codex-envelope]], deletion-trash-privacy.md §2–§4 (base text), attack-privacy.md (prior red team, all findings re-checked here).
**Standards verified on the web, 2026-07-11:** RFC 9180 (HPKE), FIPS 203 (ML-KEM, final 2024-08-13), draft-connolly-cfrg-xwing-kem-10 (X-Wing, still I-D), draft-ietf-hpke-pq-04 (PQ KEMs for HPKE), RFC 9771 (AEAD properties incl. key commitment, May 2025), ERC-5564 (view tags), Padmé/PURBs, partitioning-oracle literature, age's multi-key mitigation, OMR/FMD scanning frontier, MetaMask's EIP-1024 deprecation.
**Date:** 2026-07-11

---

## 0. Verdict in one paragraph

Layer 1 is **not cargo-culting its references — the references are apt and the two prior red-team rulings (random occurrence keys, TAG-only keyWrap) are correct — but it is a design sketch wearing a spec's badge.** Of the nine components: three are BLESSED as-is or with wording edits (registry separation, PQ-hybrid posture, crypto-shred honesty ladder), one is BLESSED-as-roadmap (groups), and **five are UNDERSPECIFIED in ways that would produce five incompatible client implementations tomorrow** — no HPKE mode is named, no binding of wraps to granter/file, no committing-AEAD rule (and the design's own trial-decrypt default makes the invisible-salamander class *concretely* relevant, not theoretical), no scan design at all (the biggest hole: random occurrence keys without a scan lane make share-discovery O(all wraps ever) — unusable at 10⁶ records, impossible at 10⁸), and no ruling on where the P9 root secret comes from (the one place the design could silently fall into the Fileverse wallet-signature trap). Every missing spec is proposed concretely below. **Freeze impact is small and mostly wording**: the layer as designed needs only two derivation-math completions and three row-text wording changes before the ceremony; everything else — including the entire scan-hint system, committing AEAD, X-Wing, Padmé, groups, and the encrypted-dirnode alternative to salted trees — is post-freeze-addable convention. That is the good news and it should be said plainly: **confidentiality does not block the freeze.**

Honesty frame carried throughout: EFS is **confidential, never anonymous**; wrap authorship, wrap counts, timing, and ciphertext existence are public by design (the price of verify-don't-trust); nothing below papers over that.

---

## 1. Component 1 — THE WRAP SCHEME

**Verdict: UNDERSPECIFIED** (the shape is right; the spec does not exist). Missing spec proposed in §1.3–§1.6.

### 1.1 Is this HPKE single-shot? Which mode?

What the design says today: "per-file content key wrapped to each recipient," "HPKE sealed; randomized by construction," blob = `{wrapAlgTags, recipientKeyHint, sealedFEK}`. That is HPKE-shaped but names no mode, no KEM/KDF/AEAD suite, no `info`/`aad` discipline. Ruling:

- **It is HPKE single-shot `Seal()` (RFC 9180 §6.1), and the mode MUST be `mode_base` (0x00).** Not `mode_auth`. Two independent reasons, either sufficient:
  1. **Auth mode is unavailable in the PQ path — permanently.** VERIFIED on primary sources 2026-07-11: draft-ietf-hpke-pq-04 states its KEMs (ML-KEM-512/768/1024, MLKEM768-X25519, MLKEM768-P256, MLKEM1024-P384) "do not support `AuthEncap`/`AuthDecap` and cannot be used to migrate uses of HPKE that rely on this mode" ([draft-ietf-hpke-pq-04](https://datatracker.ietf.org/doc/html/draft-ietf-hpke-pq-04)); the X-Wing draft states "X-Wing is not an authenticated KEM" ([draft-connolly-cfrg-xwing-kem](https://datatracker.ietf.org/doc/draft-connolly-cfrg-xwing-kem/)). ML-KEM has no static-static operation, so KEM-level sender auth dies with the DH. Since PQ-hybrid wraps are a MUST (HNDL), building anything on auth mode would be designing an un-migratable dead end.
  2. **EFS already has stronger sender authentication than auth mode gives.** Every wrap is a claim inside an EIP-712 Merkle-signed envelope; the recovered signer IS the granter, non-repudiably and *third-party-verifiably* (Bob can prove to Carol that Alice granted him access — HPKE auth mode cannot do that; it only convinces the recipient). Auth mode would be a second, weaker authenticator glued under a stronger one.

- **Consequence worth stating in the row docs (deniability):** because sender auth rides the envelope signature, **every share grant is a signed, permanent, non-repudiable social edge**. HPKE auth mode's deniability property is not available and not wanted here — but nobody should later "add deniable shares" without realizing the envelope kills it. A future deniable-share lane would need author-side unlinkability (the stealth/persona lane), not an HPKE mode.

### 1.2 Sender authentication and poisoned shares — what actually binds what

Threat: a stranger wraps a garbage/poisoned DEK to you and spoofs a "share" (phishing surface: "Alice shared TAXES-2026.xlsx with you").

- **Spoofing the granter identity: impossible** below key theft — the wrap record's author is the recovered envelope signer. A stranger's wrap says the stranger's address, period.
- **Spoofing a share *from a stranger*: trivially possible and permanent** — permissionless writes mean anyone can hang wrap TAGs on any fileId. This is a UX/lens problem, not a crypto problem, and the base text's rule is correct and blessed: **verification order lens → signature → bytes → decrypt** (RR9 extension). SDK MUST: share notifications render only for wrap authors resolving through the viewer's lens; off-lens wraps are quarantine-class (the email-spam shape).
- **What binds the wrap to the file and granter cryptographically: today, nothing.** The blob seals the DEK; the *record* targets the fileId; but nothing inside the HPKE computation binds (granter, fileId), so a blob is transplantable: Mallory copies Alice's blob (sealed to Bob) into Mallory's own wrap record targeting file G. Bob unwraps "successfully," gets F's DEK, tries G, gets garbage — fails late and confusingly instead of early and cleanly. **Fix (spec below): bind context via HPKE `info`.** This is exactly what `info` exists for (RFC 9180 key-schedule context binding).
- **What binds the DEK to the ciphertext: today, nothing** — the salamander gap, §1.4.

### 1.3 PROPOSED SPEC — the wrap (normative candidate, convention layer, zero freeze surface)

```
wrap_blob := algoTag(1) || hpke_enc || hpke_ct        (VAL payload of the keyWrap TAG)

algoTag   := 0x01  (KEM registry entry: X-Wing — see §8)
suite     := HPKE base mode, single-shot Seal
  KEM     := X-Wing (HPKE KEM id 0x647a; X25519 + ML-KEM-768, SHA3-256 combiner)
  KDF     := HKDF-SHA256 (0x0001)
  AEAD    := ChaCha20-Poly1305 (0x0003)
plaintext := DEK (exactly 32 bytes — length pinned, see §1.4)
info      := "efs/v2/keywrap" || granterAddress(20) || fileId(32)
aad       := dekCommit(32)                             (see §1.4)
```

- `hpke_enc` = 1120 bytes (X-Wing ct), `hpke_ct` = 32+16 bytes → blob ≈ **1.2 KB**, comfortably under `MAX_VALUE_BYTES = 8192`. (X-Wing sizes VERIFIED from draft: ek 1216 B, dk 32-byte seed, ct 1120 B, ss 32 B.)
- **Fresh encapsulation per recipient — never reuse an ephemeral across recipients.** (The classic multi-recipient footgun; X-Wing's ct embeds the X25519 ephemeral, so sharing it across recipients would also correlate the wraps on-chain.)
- `recipientKeyHint` from the base text is **deleted from the private-tier blob** (it was the leak A1 half-fixed); recipient discovery is the scan lane (§2).
- The 32-byte-exact plaintext rule is load-bearing: age's mitigation for multi-key ChaCha20-Poly1305 forgeries is precisely bounding stanza ciphertext size — small ciphertexts cap a multi-key collision at 2 keys ([age commit 2194f69](https://github.com/FiloSottile/age/commit/2194f6962c8bb3bca8a55f313d5b9302596b593b)). With the dekCommit check below, even that residue is inert.

### 1.4 AEAD key-commitment — ruling the requirement (the salamander/partitioning-oracle question)

Background, verified: AES-GCM and (X)ChaCha20-Poly1305 are **not key-committing** — ciphertexts decrypting validly under multiple keys are cheap to craft (Len–Grubbs–Ristenpart, [Partitioning Oracle Attacks, USENIX Sec'21](https://www.usenix.org/system/files/sec21-len.pdf); RFC 9771 §"key commitment", [RFC 9771](https://www.rfc-editor.org/rfc/rfc9771.txt), May 2025). Why it is *concretely* relevant here and not checkbox security:

1. **Trial decryption is the design's own default.** Random occurrence keys force recipients to trial-decrypt candidate wraps. The attacker who authors a wrap record **chooses the ephemeral, therefore knows the would-be shared secret for every candidate recipient's public `encryptionKey`** (for the X25519 half outright; X-Wing's combiner mixes ML-KEM, but the attacker runs the full encap per candidate — all inputs are public). So the attacker can compute the exact AEAD key each candidate recipient would derive, and craft ONE blob whose tag verifies under k of those keys, delivering **different DEKs to different recipients from one record**.
2. **The classic partitioning-oracle payoff (secret-recovery) does NOT apply** — recipients' KEM keys are high-entropy and public, not password-derived; there is no low-entropy secret to binary-search. Say this plainly: the oracle here does not *recover keys*.
3. **The payoff that DOES apply is the invisible-salamander payoff: equivocation.** `fileId`/`contentHash` commit the *ciphertext*. Non-committing content AEAD means one fileId can decrypt to **two different plaintexts under two different DEKs** — and (1) lets an attacker hand those two DEKs to two audiences via one wrap record or two. Concrete abuse: a moderation reviewer decrypts F and sees an innocuous document; the target audience decrypts the same F — same hash, same on-chain identity, same "verified bytes" badge — and sees something else. On a system whose whole pitch is *verify-don't-trust byte identity*, this breaks the implicit promise that a fileId names one plaintext. (This is exactly the Facebook attachment-franking attack — Dodis–Grubbs–Ristenpart–Woodage line of work; recall, not re-fetched.)
4. A softer real oracle: after a successful trial-unwrap a client does something observable (fetches F's chunks, renders a share toast). A crafted multi-key blob turns that behavior into a remote **"which of these k encryption keys does this scanning client hold"** probe. With per-persona encryptionKeys (V3 in the prior red team), that is a persona-linking probe. Cheap to kill with commitment; kill it.

**RULING (MUST, private tier; SHOULD everywhere):**

- **R1 — content AEAD MUST be key-and-context-committing (CMT-4-class: committing to key, nonce, AD, plaintext).** Concrete scheme in §7.2. Plain AES-GCM / ChaCha20-Poly1305 without a commitment layer is non-conforming for encrypted EFS content.
- **R2 — a public DEK commitment binds wrap ↔ content.** Define `dekCommit = HKDF-SHA-256(ikm=DEK, salt=∅, info="efs/v2/dek-commit" || fileId, L=32)`. It appears (a) in the content's cleartext AEAD prologue (authenticated as AD by every chunk — §7.2), and (b) as the wrap's HPKE `aad`. Recipient flow: unwrap → recompute dekCommit → compare to the file prologue → mismatch ⇒ **reject the share as poisoned before rendering anything**. Consequences: every recipient can verify they hold *the same* DEK as everyone else (one fileId → one DEK → one plaintext, restoring the byte-identity promise); transplanted blobs die at `info`/`aad` check; multi-key blob forgeries die at dekCommit; publishing a hash-commitment of a 256-bit random key leaks nothing usable.
- **R3 — the wrap blob itself needs no committing AEAD** given R1+R2 and the 32-byte plaintext pin: HPKE's key schedule already binds the KEM ct (X-Wing is MAL-BIND-K-CT / MAL-BIND-K-PK — VERIFIED from the draft's security considerations), and dekCommit catches everything the blob AEAD could equivocate. Requiring a custom committing AEAD *inside* HPKE would mean leaving RFC 9180's registry — bad trade; rejected.

### 1.5 Multi-recipient pitfalls (same DEK to N recipients) — enumerated

- **Onward wrapping is unstoppable and legible** (Bob wraps F's DEK to Carol under Bob's own authorship) — bearer semantics, already ruled; a feature-and-limit pair. Blessed.
- **No cross-recipient integrity without R2**: without dekCommit, recipients cannot know they all hold the same DEK. With R2, they can. This is the multi-recipient pitfall that actually matters here.
- **Ephemeral reuse across recipients — forbidden** (§1.3). Also forbid *DEK reuse across files* (each DATA object = fresh DEK; §7.3 nonce discipline depends on it).
- **Wrap-count leak (L7)**: N wraps ≈ N recipients, public forever. Existing mitigation (dummy wraps sealed to random keys) is real and cheap — with random occurrence keys and no hints, a dummy wrap is *indistinguishable by construction*. Keep as convention-optional. (A dummy wrap under the §2 hint scheme must carry a random hint — noted there.)
- **Revocation asymmetry**: REVOKE of a wrap TAG is public ("membership changed") and cryptographically inert (the revoked body persists; the ex-recipient decrypts the old ciphertext forever). Already stated in the base text; blessed; the UI copy at *grant* time is the mitigation.

### 1.6 What survives from the prior rulings

Random occurrence keys in the private tier (A1 fix): **correct and blessed** — `H(recipientEncKeyId)` slot keys were a public O(1) recipient oracle; randomizing them closes it. TAG-only keyWrap (A2 fix): **correct and blessed** — multi-recipient wraps are cardinality-N; the owner-escrow PIN is not worth reopening a derivation-doc exclusion (the escrow is one more TAG with an owner-derived occurrence key, §2.5). Both survive this review unchanged; what they lacked was the scan lane those choices force — §2.

---

## 2. Component 2 — TRIAL-DECRYPT SCALING (the pass's most load-bearing missing spec)

**Verdict: UNDERSPECIFIED — nothing exists.** The design says "recipients trial-decrypt" and stops. Quantified, then designed.

### 2.1 The cost of the naive scan

A recipient must find wraps addressed to them among ALL keyWrap TAGs ever written by anyone (occurrence keys are random ⇒ no addressing; author ⇒ no filter, any granter may share to you). Per-record naive cost: fetch blob (~1.2 KB) + one X-Wing decap (X25519 DH ~30–60 µs + ML-KEM-768 decap ~10–30 µs, PLAUSIBLE order-of-magnitude for 2026 hardware; mobile 2–4× worse) + AEAD attempt (~µs).

| corpus (keyWrap records) | bandwidth (full blobs) | compute (1 core, ~50 µs/record) | verdict |
|---|---|---|---|
| 10⁴ | ~12 MB | ~0.5 s | trivial |
| 10⁶ | ~1.2 GB | ~50 s | desktop-tolerable once; hostile on phones; hostile as a *repeated* cost |
| 10⁸ | ~120 GB | ~80 min (≈10 min on 8 cores) | **bandwidth-impossible for clients; compute-hostile everywhere** |

Two structural observations that reframe the numbers:

- **The spine is append-ordered, so steady-state scanning is incremental**: a client keeps a per-venue cursor and scans only new records since last sync. Steady-state cost is proportional to the *global write rate of wraps*, not corpus size. The full-corpus scan is paid only at **device-loss recovery / new-device onboarding** — which is exactly the P9 story, so the recovery path must not be "rescan 10⁸ records" (fix: self-index escrow, §2.5).
- **The same shape exists in the stealth lane.** ERC-5564 announcements have the identical scan problem and solved it with 1-byte view tags (~6× parse speedup, skip probability 255/256 — VERIFIED, [EIP-5564](https://eips.ethereum.org/EIPS/eip-5564)); Zcash/Penumbra hit it at scale and spawned the OMR/FMD literature. **If the stealth lane reserves or conventions an announcement-hint format, the keyWrap hint format below should be the same format** — one scanning pipeline, two record families.

### 2.2 The scan-hint space, with exact leak math per option

Design axes: what the recipient must do per record; what a k-bit hint leaks to (a) a passive observer, (b) an active prober, (c) a delegated scanner.

**Option H0 — no hints (status quo).** Leak: zero beyond the wrap's existence/author/target. Cost: the table above. Verdict: **the private default must not be this**; it silently rations sharing to tiny corpora.

**Option H1 — view-tag hint (ERC-5564 shape), k bits.**
Granter also publishes, per wrap, `ephScanPk` (32 B, an X25519 ephemeral for the *scan* keypair — see §3 registry: recipients publish a scan key separate from the KEM key) and `tag = H(X25519(ephScanSk, recipientScanPk))[0:k/8]`.
Recipient per record: **one X25519 op + one hash**; on tag mismatch (prob 1 − 2⁻ᵏ) skip the blob entirely; on match, do the full X-Wing unwrap.
- **Leak to passive observer: 0 bits about the recipient identity.** The tag is a truncated hash of a fresh per-wrap DH secret — uniform and uncorrelated across wraps to the same recipient (unlike a stable mailbox ID, tags don't cluster). It *does* publish k bits of that hash: ERC-5564's own analysis frames the 1-byte tag as reducing the shared-secret security margin 128→124 bits (their arithmetic; the naive count is 128−8=120 — either way immaterial at these sizes). No recipient-confirmation probe exists without the recipient's scan secret.
- **Leak to active prober: nothing new** — a prober without `recipientScanSk` cannot evaluate the tag predicate for a candidate.
- **Leak to a delegated scanner (you hand your scanSk to an indexer to scan for you): your entire wrap-receipt pattern** — the Zcash detection-key tradeoff, stated honestly. Separating scan keys from KEM keys (§3) at least caps delegation at *detection*, never decryption.
- Cost at 10⁸, k=8: hint stream = (ephScanPk 32 B + tag 1 B + recordId ref) ≈ **4 GB** bandwidth (vs 120 GB), compute 10⁸ × ~35 µs ≈ 1 hr single-core / minutes parallel; false positives 10⁸·2⁻⁸ ≈ 390k full unwraps ≈ 20 s. With k=16: FPs ≈ 1.5k; leak still nil to observers. **Recommend k=16 for a permanent archive** (the corpus only grows; the marginal leak is another 8 bits off a hash margin that started ≥120).
- Placement: hint fields ride **inside the wrap VAL blob** (grammar is Durable) *plus* the convention that indexers/bulk snapshots (P8) serve a compact `(recordId, ephScanPk, tag)` hint stream. Verify-don't-trust preserved: hints are advisory accelerators; a client can always fall back to full spine replay — an indexer that censors a hint can hide a share from fast-scan but not from the canonical scan, and never learns whether anything matched.

**Option H2 — pairwise mailbox chains (PRF occurrence keys) — the fast lane for known counterparties.**
Both parties can compute `k_AB = HKDF(X25519(scanSk_A, scanPk_B), "efs/v2/mailbox" || A || B)` **without interaction** (static-static DH on published scan keys). Wrap i from A to B uses `occurrenceKey = HMAC-SHA-256(k_AB, LE64(i))`. B discovers wraps by enumerating each known counterparty's author stream (author-filtered enumeration exists via spine replay / indexer views — deliberately NOT an Etched index, per B7's standing REJECT) and matching occurrence keys against a precomputed window (say, next 64 per counterparty).
- **Leak to passive observer: 0** — occurrence keys are PRF outputs, indistinguishable from the random default. (This is why the frozen row text must say *opaque*, not *random* — §Freeze F-3.)
- **Leak on compromise of `k_AB`:** the pair's entire wrap history becomes linkable retroactively (static-static DH has no forward secrecy). Optional ratchet (`k_AB,i+1 = H(k_AB,i)`, delete old) buys forward unlinkability at a sync-fragility cost; offer, don't default.
- Cost: O(#counterparties × their wrap rate) — effectively free. Does not cover stranger shares; H1 is the fallback lane.
- Note the granter needs `k_AB` reproducible for REVOKE lookups — it is (static DH), which also kills the prior design's "granter keeps a local recipient→key map" fragility (map loss made your own grants un-revokable-by-lookup; now re-derivable).

**Option H3 — encrypted Bloom digests (per-epoch recipient filters).** Granter publishes per epoch a Bloom filter of the epoch's `k_AB`-derived tags. Rejected: the filter's population count leaks grant volume per epoch more legibly than raw wraps; recipients still need to know *which* granters' filters to fetch (the same discovery problem, shifted); dominated by H1+H2 on every axis. **REJECT.**

**Option H4 — FMD/OMR (the frontier).** Fuzzy Message Detection gives tunable false-positive detection delegation ([Penumbra's FMD spec](https://protocol.penumbra.zone/main/crypto/fmd.html)); OMR gives fully-oblivious delegated scanning but with ~1 GB detection keys and heavy server compute (VERIFIED: [Liu–Tromer](https://eprint.iacr.org/2021/1256.pdf), [PerfOMR, USENIX'24](https://www.usenix.org/system/files/usenixsecurity24-liu-zeyu.pdf); [ZF investigation](https://zfnd.org/oblivious-message-retrieval/)). Not v2 machinery; named as the upgrade path for delegated scanning without the H1 delegation leak. **Watch, don't build; nothing to reserve** (hint grammar is Durable).

### 2.3 RULING (proposed): the three-lane scan convention

1. **Lane 1 — incremental cursor** (always): scan only since last sync; per-venue cursors; bulk hint snapshots via P8.
2. **Lane 2 — pairwise mailboxes (H2)** for counterparties in your lens/contacts: O(contacts), zero leak.
3. **Lane 3 — view-tag scan (H1, k=16)** over the residual stream for stranger shares: one cheap DH per record, 0-bit recipient leak to observers.
Plus **§2.5 self-index escrow** so recovery never replays history. Dummy wraps (L7) carry random `ephScanPk`+`tag` — indistinguishable in every lane; noted so nobody "optimizes" them distinguishable.

### 2.4 What this does NOT need: an Etched index

No on-chain occurrence-key-keyed or recipient-keyed index is needed or wanted: point reads require knowing the slot key (which hidden-recipient wraps deliberately deny), and scanning is a client/indexer duty riding events + spine replay + P8 snapshots — all existing surface. **Confirmed against B7's REJECT; no new kernel state demanded by this lane.** (Adversarial check: could a *future* scan scheme need kernel help? OMR/FMD run over exactly the hint stream shape Lane 3 already publishes; a PIR-served hint DB is a gateway concern. Nothing kernel-shaped found.)

### 2.5 The owner's own problems: escrow occurrence key + self-index

- **Owner-escrow wrap (E5's "reserved self-occurrence-key")**: make it owner-derived, NOT a public constant: `occ_self = HMAC-SHA-256(scanRoot, "efs/v2/self-escrow" || fileId)`. A public constant (e.g. `keccak("efs.wrap.self")`) would be an O(1) public oracle for "this file has owner escrow" — mild but free to avoid. Recovery order: P9 root → scanRoot → derive occ_self per fileId → point-read own escrow wraps. **Freeze note F-4: E5's row text must not pin a public constant.**
- **Self-index escrow (recovery accelerator):** periodically write (or fold into P9 roaming state) an encrypted index of `(fileId, wrap recordId)` for everything you can decrypt — wrapped to your own keys. New device: recover root → decrypt index → fetch tail since index height → Lane 1 the rest. Recovery cost becomes O(since-last-checkpoint), not O(history). Pure convention.

---

## 3. Component 3 — ENCRYPTION-KEY REGISTRY (`encryptionKey` row, KEM algoTag registry)

**Verdict: BLESSED, with three completions.** The two prior rulings hold and are re-verified: (a) a dedicated row beats per-client conventions (the failure mode is *silent mis-encryption*, correctly classed as correctness-not-UX); (b) the **separate KEM registry** (S1 fix) is categorically right — and now has an industry receipt: MetaMask deprecated `eth_getEncryptionPublicKey`/`eth_decrypt` explicitly because "using the same private key across different elliptic curves for both signing and encrypting isn't best practice," and EIP-1024 is abandoned (VERIFIED: [MetaMask deprecation note](https://metamask.io/news/developers/metamask-api-method-deprecation/)). EFS's G9 rule is the same lesson, learned before shipping instead of after. Also confirms: **do not lean on wallet-provided encryption keys; EFS-native published keys are the only portable path.**

Completions:

1. **Blob schema (proposed, grammar Durable):** `[{algoTag, role, keyBytes, deviceLabel?, notAfter?}]` where `role ∈ {kem, scan}`. Multiple `kem` entries = device keys (the granter wraps the DEK **to every current kem key** — N_devices wraps per grant; at 2–3 devices this is 2–3 records per share, priced honestly). One `scan` entry (X25519) powers §2 lanes 2–3; separating it from the KEM key means scan delegation ≠ decryption capability, and it can stay classical (a scan key protects unlinkability, not content — HNDL against it reveals *detection*, not plaintext; acceptable and stated).
2. **Rotation:** supersede the PIN with a new blob. Old wraps stay decryptable by old-key holders (forward-only law, fourth instance); new grants target new keys. Old wraps made to a *compromised* key: re-wrap alone is useless (old record persists) — protection requires content re-key (new DEK + new ciphertext), same as reader removal. The SDK's "rotate encryption key" flow MUST offer the re-encrypt sweep, and MUST say what rotation alone does not do.
3. **Coupling-rule enforceability — honest answer: it is NOT cryptographically enforceable.** Nobody can inspect an X25519 public key and prove it wasn't derived from the secp256k1 identity key (derivation is invisible in the codomain). Enforceability budget, plainly:
   - Structural (real): the registry is KEM-typed; a secp256k1 point in a `kem` slot is malformed → SDK MUST refuse to publish and refuse to wrap to it.
   - SDK MUST-refuse list: no API that derives KEM/scan keys from the identity key or its signatures (this closes the *convenient* path, which is 95% of the risk); refuse to encrypt to an EQUIVOCAL/CONTESTED `encryptionKey` slot (fail-closed — blessed as ruled); refuse wraps targeting a key whose blob self-declares the author's own address key.
   - Residual (named, accepted): a malicious/lazy third-party client can still derive-and-publish. Convention + conformance tests + the walk-away audit are the only fences. The row spec should carry the MetaMask/EIP-1024 citation as the cautionary tale.
4. **Per-persona keys (V3 carried):** distinct `encryptionKey` AND distinct scan key per persona, or wraps/scans cross-link personas. One line in the row text.

---

## 4. Component 4 — KEY DERIVATION / P9 ROAMING (the Fileverse trap)

**Verdict: UNDERSPECIFIED, and it is the one place Layer 1 could silently rot into a real vulnerability.** The reserved surface says "HKDF-derived salts are legal, so a user's own devices re-derive their private tree… with no server" — but **derived from WHAT root** is unstated. The obvious wallet-UX answer (derive from an EOA signature over a fixed message) is the trap.

### 4.1 Why signature-derived roots are a trap (each risk named)

1. **Any dapp can mint your root.** Ethereum wallets sign `personal_sign`/EIP-712 payloads for any requesting origin; ECDSA per RFC 6979 (deterministic nonce, standard in major wallets — PLAUSIBLE, unverified per-wallet) means the same message yields the same signature forever. A phishing dapp that presents the same message obtains signature = root secret. The signature *looks* harmless to the user ("sign to log in") — that is the whole attack.
2. **Determinism isn't even guaranteed.** MPC signers and some hardware paths randomize ECDSA nonces (PLAUSIBLE, unverified per-vendor); a non-deterministic signer yields a *different* "root" per invocation → data permanently unrecoverable. Failure mode is data loss, discovered at recovery time.
3. **No forward secrecy / no rotation.** The root is a pure function of a key you can't rotate (bare-EOA identity is frozen); one leak = every past and future derived secret, forever. privacy.md §7 already flags this as Fileverse's documented weakness ("deterministic key derivation → no forward secrecy") — do not import it.
4. **It violates the spirit of G9.** The coupling rule bars wrap *targets* derived from the identity key; a signature-derived root is the same coupling through one indirection: identity-key theft ⇒ sign the bootstrap message ⇒ root ⇒ archive. That would re-create exactly the "THEFT = retroactive decryption" catastrophe G9 exists to prevent. **RULING: G9 extends to root secrets — no root secret in the escrow graph may be computable from the identity key or any signature made by it.**

### 4.2 PROPOSED SPEC — the derivation tree (convention, SDK-normative)

```
rootSecret        := 32 random bytes, CSPRNG, generated once at onboarding.
                     NEVER derived from any signature. Lives in device keystore/enclave.
  ├ archiveRoot   := HKDF(rootSecret, "efs/v2/root/archive")
  │   ├ subtreeSalt_i   := HKDF(archiveRoot, "efs/v2/salt/tree" || i)      (salted TAGDEFs, §5)
  │   ├ lensStateKey    := HKDF(archiveRoot, "efs/v2/p9/lens")             (P9 roaming lens/config)
  │   ├ scanRoot        := HKDF(archiveRoot, "efs/v2/scan")                (§2: scan keypair seed, occ_self PRF key, k_AB cache key)
  │   └ recoveryKemSeed := HKDF(archiveRoot, "efs/v2/kem/recovery")        (X-Wing dk is a 32-byte seed — one HKDF output IS a recovery keypair)
  └ shredRoot     := 32 random bytes, INDEPENDENT (not derived from rootSecret),
                     enclave-bound, never passphrase-derivable, never in roaming backup   (S2, upheld)
```

- **Backup of rootSecret:** wrapped to the user's other device KEM keys (device enrollment = mutual wrap ceremony); optional passphrase-derived wrap (Argon2id) is legal for `rootSecret`/archive tier ONLY — S2's ban on passphrase-derivable **shredRoot** stands (a memorized passphrase is the opposite of destroyable). Optional social/escrow wraps ride the same keyWrap machinery (dogfooding).
- Device KEM keys: per-device random, never derived from rootSecret (device compromise ≠ root compromise; root recovery ≠ device impersonation).
- All derivations HKDF-SHA-256 with the literal domain-separation labels pinned in the SDK conformance vectors. Labels are convention (Durable) — but they must be *published* vectors or clients fork the tree silently.
- **If James wants one-click bootstrap anyway** (no stored root, "just my wallet"): the only defensible shape is an EIP-712 typed signature over a domain-separated EFS-only struct, used ONCE to decrypt a random rootSecret escrowed on EFS (bootstrap-KEK, not root), with the risks above printed at setup. Recommended default remains: random root + device-wrap backup; signature-bootstrap off by default. (Options for James, §Decisions D5.)

### 4.3 Forward-secrecy honesty (kills a likely marketing lie preemptively)

**Forward secrecy in the messaging sense is structurally impossible for a permanent public archive** — FS means old ciphertexts become undecryptable when keys rotate; an archive's ciphertexts must stay decryptable by design, and every wrap is retained on-chain forever. What EFS can honestly offer: **post-compromise security for future content** (rotate keys, re-key content forward) and **crypto-shred for the past** (destroy DEKs/roots). Never write "forward secrecy" in EFS materials; write "forward-only re-key + shred."

---

## 5. Component 5 — SALTED-TAGDEF FAMILY

**Verdict: BLESSED as reserved, with one derivation-math sufficiency gap (freeze-relevant), one honesty gap (topology), and one missing companion convention (encrypted dirnodes) that should carry most of the actual load.**

### 5.1 Sufficiency gap: the blinding function itself must be pinned (F-1)

D3/D4 pin `DOMAIN_ANCHOR_SALTED`, blinded-name-in-body, NFC-variant, disclosure shape `(name, salt, parentId, kindTag)`, resolver-gate. But `blindedName = H(name, salt)` names no H and no encoding. The disclosure record's whole value is that **anyone** can verify `saltedTagId` recomputes from the revealed preimage — which requires the blinding function to be part of the frozen derivation math, not client convention (two clients blinding differently = two different "same" paths = broken Schelling point among capability holders, and unverifiable disclosures). **Demand: pin `blindedName = keccak256(DOMAIN_NAME_BLIND_V1 || salt32 || nfc(name))` (keccak for symmetry with all other on-chain derivation math) with golden vectors, in the D3 ceremony batch.** Without this, D3/D4 as reserved are INSUFFICIENT to ship the family post-freeze.

### 5.2 Salt-per-tree vs salt-per-node — the linkage analysis asked for

- Per-segment blinding keys `K_child = HKDF(K_node, "efs/v2/salt/child" || blindedName_child)` (chain from the subtree salt; this exact chaining rule is currently unwritten — pin it in the same vector set as §5.1, since disclosure-of-a-subtree = revealing `K_node`, and what that unlocks is defined by this rule). Properties: revealing `K_node` unlocks that node + descendants (by design — partial disclosure); **siblings stay dark** (HKDF is a PRF; sibling keys are underivable). So *cryptographic* sibling linkage from one leaked node: none. Good — this is Cryptree's edge discipline done right.
- **BUT topology linkage is on-chain regardless of any salt (the honesty gap):** every salted TAGDEF body carries `parentId` in the clear (it must — tagId derivation consumes it). All children of one private folder share a visible opaque `parentId`. An observer clusters: fan-out per node, tree depth via parent chains, creation timing per node — the full **shape** of every private tree, names and content dark. One disclosed node therefore also *anchors* its visible siblings-cluster to a now-known path ("this folder has 37 siblings of the revealed one, written at these times"). This is Layer-2 leakage appearing inside a Layer-1 feature, and today's docs don't say it. **Demand: the salted-family docs state "salting hides names, never topology" with the cluster example.** Coercion note (V2) compounds: a compelled subtree-salt disclosure self-authenticates the whole shape.
- Per-node *independent* salts (compartmentalization, already legal) cut disclosure blast radius but do nothing about topology (parentId still chains). The only real topology fix is not writing the topology on-chain at all →

### 5.3 The missing companion: **encrypted dirnodes should be the private-folder default** (Tahoe's actual answer)

Tahoe-LAFS does not put directory structure in a public graph: a directory IS a file — an encrypted table of `(childName → child cap)` (recall; foundational Tahoe design). EFS can do exactly this with zero new surface: a private folder = one DATA object whose (encrypted, Padmé-padded) content is the child table `{name → {fileId|dirnodeId, DEK-cap or subtree ref}}`; the whole subtree hangs off ONE on-chain object; children are plain DATA objects with no on-chain edges to each other at all.

- Leak comparison: salted-TAGDEF tree = topology + per-node timing public; encrypted dirnode = **one object's existence + its edit cadence + padded size** public. Massively less.
- Cost comparison: renaming/moving/adding a child = supersede the dirnode version (one record) vs one TAGDEF+PIN per node; sub-sharing = hand out the child dirnode's cap (each dir has its own DEK — Cryptree keys-on-edges); the child table IS the granter's local recipient/key bookkeeping, made durable and roaming.
- What salted TAGDEFs remain FOR (real, narrower): private paths that must be **on-chain addressable** — capability-holder Schelling points where independent parties derive the same node without exchanging a dirnode cap; contract-readable private anchors; reveal-later commit-reveal paths (§4.5 disclosure is a TAGDEF feature, dirnodes can't do it).
- **Ruling proposal: encrypted dirnode = default private-folder construction (SDK convention, zero freeze surface); salted-TAGDEF = the addressable/disclosable tier.** Both ship; the default flips. This is also a gas story: dirnode subtrees cost O(1) records per folder instead of O(nodes).

### 5.4 Resolver-gate reservation (S7 carried)

Confirmed still required and still listed (fs-pass-freeze-reservations D3 includes it). Sufficiency check run: with §5.1's blinding function pinned + resolver gate reserved + NFC variant + disclosure shape + vectors, the family is fully instantiable post-freeze. Nothing else found missing.

---

## 6. Component 6 — GROUPS (pairwise vs TreeKEM; removal; live-collab)

**Verdict: BLESSED as a roadmap — pairwise/KEK now, MLS-shaped later — with the honest note that MLS's headline guarantees mostly do not transfer to archives, so "MLS later" is about O(log N) rekey economics, not about importing RFC 9420.**

### 6.1 What MLS actually offers vs what EFS can use

RFC 9420's TreeKEM gives O(log N) member updates and *forward secrecy + post-compromise security over a message stream* under a **Delivery Service that totally orders commits** (recall; RFC 9420). Transfer analysis:
- **FS: inapplicable** (§4.3) — archive ciphertexts must remain decryptable; epoch secrets that age out protect nothing retroactively on a public permanent ledger where every old wrap persists.
- **PCS: partially transfers** — "heal the group going forward after a member-key compromise" is exactly forward-only re-key; EFS already has the primitive (rotate KEK, re-wrap).
- **The DS total order: EFS structurally lacks it.** No cross-author linearizability; two concurrent commits at the same epoch would fork the tree. Any future MLS-shaped group needs an ordering convention: designated committer (one author's `order` totally orders their own commits — the cheap answer), or venue admission order via `admittedAt` (B1, pending James). This is the real MLS-on-EFS obstacle; log it as the named blocker in the roadmap, not a surprise for 2028.
- **The O(log N) rekey economics: transfers cleanly** and is the only reason to ever do this. Break-even: flat KEK removal = N−1 re-wraps (~1.2 KB + ~22–27k gas each). N=10: noise. N=100: ~2.7M gas + ~120 KB — tolerable on L2s, painful L1. N=10⁴: prohibitive → TreeKEM territory. File-sharing groups are overwhelmingly ≤100 (PLAUSIBLE, unmeasured); pairwise/flat-KEK is the right v2 ship.

### 6.2 Removal sweep (S3 carried, upheld, one addition)

Lazy re-key means **permanent-partial removal for cold files** — a file never rewritten is readable by the removed member forever (they hold the old KEK/DEK). Upheld verbatim. Addition — the sweep spec: "remove member (eager)" = rotate KEK, re-wrap to N−1, and for each file: new DEK, re-encrypt, new DATA + supersede placement — **O(subtree) records, gas, and mirrors bandwidth; a 10-GB folder re-uploads 10 GB.** The UI must render mode and progress ("removed for future writes; K cold files pending; est. cost X") — silence here is how products lie. Both modes ship; eager is the default only for folders marked sensitive.

### 6.3 Live-collab (Fileverse encrypted-Yjs-relay composed with per-file DEKs)

Blessed as the transport story to investigate (per privacy.md §7.1); the composition that keeps Layer 1 coherent: session key `K_sess` fresh per editing session, wrapped to the folder KEK (one wrap, on-chain or in-relay); Yjs deltas encrypted under `K_sess` through the ciphertext-only relay (never on-chain); on save/checkpoint, the folded document is written as a normal private DATA (fresh DEK, committing AEAD, wraps via §1) — the relay never holds anything the chain trusts, and the on-chain artifact never depends on the relay. Authorship of the *saved* version is the saver's signature (author=signer preserved; per-delta attribution is a relay-layer nicety, not an EFS claim). Zero freeze surface.

### 6.4 What to reserve for groups: **nothing** (adversarial check shown)

Enumerated requirements of a future MLS-shaped group: group state records (ratchet-tree snapshots, commits, welcomes) → DATA/TAG/VAL conventions, additive; commit ordering → designated-committer convention or B1 (already its own decision); member KEM keys → `encryptionKey` row (exists); epoch-scoped wraps → keyWrap TAGs with epoch in the blob (grammar Durable). No row, no derivation constant, no kernel state. **No reservation demanded — and reserving a speculative "group" row today would be exactly the junk-reservation pollution the pass rules warn about.**

---

## 7. Component 7 — CRYPTO-SHRED

**Verdict: BLESSED (the honesty ladder is the best part of the base text), with granularity clarified, nonce discipline specified, and one sentence sharpened.**

### 7.1 Granularity: version-level, and that's fine

EFS DATA objects are immutable; an "edit" is a new DATA (new fileId). Therefore: **fresh DEK per version, and shred granularity = the (file, version) pair.** Chunk-level shred is a non-goal: chunks of one version share the version's DEK (per-chunk independent keys would multiply wraps for no articulated need — if a future app needs sub-file shred, it splits files; REJECT chunk-keys as default). Shredding "the file" = destroying every version's DEK (the self-index (§2.5) is the version-DEK ledger that makes this findable).

### 7.2 PROPOSED SPEC — content encryption (the committing AEAD, concrete)

```
scheme "efs-ctx1" (folded into the ciphertext prologue per E6 — no on-chain plaintext format tag):
  (K_enc, K_mac)  := HKDF-SHA-256(DEK, "efs/v2/content" || fileSalt)
  prologue        := magic || version || chunkSize || padScheme || dekCommit(32)   (cleartext, authenticated)
  chunk_i         := ChaCha20(K_enc, nonce_i, plaintext_i) ||
                     HMAC-SHA-256(K_mac, prologue || nonce_i || ct_i)[0:32]
  nonce_i         := LE64(i) || 0x00*3 || finalFlag(1)      (STREAM shape: counter + last-chunk bit)
  chunkSize       := aligned to the EFSBytes chunk-normalization size (one AEAD chunk = one EFSBytes chunk,
                     so per-chunk SHA-256 verification (C4) and per-chunk decryption align for random access)
```

- Encrypt-then-MAC with HMAC-SHA-256 is CMT-4-class committing (collision-resistant MAC over key-derived K_mac + context; the construction class of [draft-lucas-generalised-committing-aead](https://samuellucas.com/draft-lucas-generalised-committing-aead/draft-lucas-generalised-committing-aead.html)); it is boring, universally implementable, and auditable — chosen over AES-GCM+CTX (Chan–Rogaway) because no mainstream library ships CTX natively (could-not-verify any as of 2026-07). AES-256-CTR+HMAC is an acceptable hardware-accelerated alternate under the same algoTag discipline. AEGIS and other RFC-9771-era committing candidates: revisit at SDK build time.
- STREAM-style counter nonces + finalFlag close truncation/reorder/extension across the chunk sequence (age's scheme shape; recall).
- **Nonce discipline across re-encryption — one MUST:** never encrypt two different ciphertexts under one DEK. Rekey/edit/re-pad ⇒ fresh DEK, always. (Counter nonces restart at 0 for every new ciphertext; reusing a DEK across versions would be catastrophic ChaCha20 nonce reuse. The rule "fresh DEK per version" *is* the nonce discipline.)

### 7.3 "Destroyed" across N devices + backups — honesty upheld

The §2.2 honesty ladder and S2's ban on passphrase-derivable shred roots are upheld unchanged (and §4.2 makes shredRoot independent of rootSecret, so shredding can't orphan the archive tier and root recovery can't resurrect shredded content). Sharpen one sentence for the ladder's top row: **"shredded" is a claim about key custody, not about mathematics or other people's hardware** — it asserts "every DEK copy *I* controlled is destroyed (enclave-erased), no wrap targets a key I can still reach, and no recipient was ever granted"; it is unverifiable by anyone else (the `shredded` attestation stays a courtesy convention, F7 upheld), and HNDL means the ciphertext's secrecy still expires if the wraps were classical (§8: with hybrid wraps, a shredded owner-only file is dead even to a CRQC unless *both* X25519 and ML-KEM fall). Devices that are offline at shred time re-sync the shred instruction — until every enrolled device confirms, render "shred pending on K devices"; a stolen offline device holding the DEK is exactly the residual the ladder's wording must not hide.

---

## 8. Component 8 — PQ-HYBRID WRAP

**Verdict: BLESSED (the MUST was already right — V5); the concrete pick, the registry shape, and the migration honesty follow.**

### 8.1 The pick: **X-Wing** (statuses verified 2026-07-11)

- **FIPS 203 (ML-KEM) final** since 2024-08-13 (high-confidence recall, not re-fetched).
- **X-Wing** (X25519 + ML-KEM-768, SHA3-256 combiner binding `ct_X`/`pk_X`): [draft-connolly-cfrg-xwing-kem-10](https://datatracker.ietf.org/doc/draft-connolly-cfrg-xwing-kem/), expires 2026-09-03 — **still an Internet-Draft, not an RFC**. IND-CCA bounded by ML-KEM-768 ∧ gap-CDH(Curve25519); MAL-BIND-K-PK and MAL-BIND-K-CT (the binding properties §1.4's R3 leans on) — VERIFIED from the draft.
- **HPKE integration exists**: [draft-ietf-hpke-pq-04](https://datatracker.ietf.org/doc/draft-ietf-hpke-pq-04) registers MLKEM768-X25519 at KEM id **0x647a** (the X-Wing codepoint), alongside pure ML-KEM and P-256/P-384 hybrids; no auth mode (§1.1).
- Why X-Wing over generic combiner-of-the-week: it is *the* named, analyzed, test-vectored hybrid the HPKE ecosystem is converging on, with the exact binding properties we need and a 32-byte decap seed (which makes §4.2's recovery-key-from-HKDF trick clean). Why not pure ML-KEM: no hedge against lattice cryptanalysis on a 100-year archive. Why not wait for the RFC: HNDL accrues per wrap written; the draft is stable at -10 and byte-pinned by EFS's own algoTag + vectors regardless of RFC timing (if final-RFC bytes shift, that's a new algoTag — the registry absorbs it; see D2 for the ship-gate options).

### 8.2 KEM registry shape (the migration machinery)

Launch registry (convention doc + reserved numbering discipline; grammar Durable):
`0x01 = xwing-v1` (as in draft-10 + pinned EFS vectors) — the ONLY tag valid for private-tier wraps at launch. Reserved names, unminted: `0x02` (ML-KEM-1024-class hybrid, paranoia tier), `0x03` (post-classical pure-PQ, for a world that deprecates the DH half). **Deliberately never minted: any classical-only KEM tag** — its absence is the downgrade defense (a conforming client cannot be talked into a classical wrap because no tag names one; at ~1.2 KB/wrap the hybrid costs nothing worth a knob). Registry supports migration by construction: new tag → new wraps; old blobs self-describe; mixed-tag wrap sets on one file are legal during transitions.

### 8.3 Migration honesty for wraps already written (re-wrap vs accept-HNDL)

There should never BE classical wraps (hybrid is MUST from record one — this review re-affirms it as the single highest-leverage sentence in Layer 1). But state the general law, because some client will get it wrong and ask: **re-wrapping cannot un-harvest**. An on-chain wrap is permanent; a CRQC-equipped adversary decapsulates the *old* blob no matter what you write later. The only real remediations, in order of strength: (1) content re-key (new DEK + new ciphertext + hybrid wraps) — protects the content, though the old ciphertext+wrap pair remains attackable if the adversary archived it (they did; it's a blockchain); (2) crypto-shred if owner-only; (3) accept-and-label. For a mis-wrapped file the honest UI verb is not "fix" but "supersede and shred the old version."

---

## 9. Component 9 — PADDING / SIZE BUCKETS

**Verdict: UNDERSPECIFIED ("padding/bucketed sizes (MUST-level convention)" names no scheme). Proposed:**

- **Files (private tier): Padmé** — pad plaintext to Padmé length before encryption. Verified properties: leakage O(log log M) bits; max overhead ≈12%, decreasing with size ([PURBs paper](https://bford.info/pub/sec/purb.pdf), PoPETS 2019). Beats power-of-2 buckets (100% worst-case overhead) at equal-or-better leakage for anything over a few KB. **Floor: pad everything below 4 KiB to 4 KiB** (Padmé is weakest exactly where most secrets live — notes, keys, configs; a flat floor makes the small-file anonymity set one bucket). Chunk-size normalization (P8) already handles the transport view; Padmé handles the manifest `size` word (which refers to ciphertext — so pad-then-encrypt puts the padded length on-chain, correct by construction).
- **VAL payloads: fixed buckets** {256 B, 1 KiB, 8 KiB} post-encryption — small closed set because VALs are numerous and Padmé's fractional buckets fragment tiny anonymity sets (at 10⁶ VALs, 3 buckets ≈ 333k-deep sets vs Padmé's ~dozens of distinct lengths under 8 KiB).
- **Cost honesty (MUST accompany the convention):** padding multiplies *permanent storage* and gas, not just bandwidth — worst case +12% (Padmé cap) or up to +4 KiB per small file forever, on every mirror. A 100-byte note costs 4 KiB of chain-priced bytes: ~40× byte overhead for that file, trivial in absolute terms, and the flat floor is exactly why small private files stop being distinguishable. Publish the table; do not let the convention imply padding is free.
- What padding does NOT fix (say it where the MUST is written): counts, timing, cadence, wrap fan-out, dirnode edit rates — Layer 2 lives on.

---

## 10. Cross-check A — Fileverse's shipped stack (where we diverge, who is wrong)

Primary-source check bounded by what is public: [fileverse-cryptography](https://github.com/fileverse/fileverse-cryptography) README documents ECIES (via `@noble/curves`, curve not stated in the README), NaCl secretbox (XSalsa20-Poly1305), HKDF, Argon2id — VERIFIED 2026-07-11 at that depth; their audit PDFs and exact key-derivation flow remain non-public (could-not-verify; privacy.md §7's "wallet-derived user-held keys" is carried as prior-round research, unconfirmed by me).

| Axis | Fileverse ships | EFS Layer 1 (this review) | Who is wrong |
|---|---|---|---|
| Content AEAD | AES-256-GCM (Penumbra streaming) / secretbox — **non-committing** | committing EtM (§7.2) | **For EFS's threat model, they would be wrong; for theirs, it's defensible-ish**: their blobs are deletable, mostly relay-mediated, and content identity isn't a public verification anchor. EFS's fileId IS a public byte-identity promise + trial-decrypt default ⇒ committing is non-optional (§1.4). Not a symmetric disagreement — a threat-model fork. |
| Key derivation | deterministic, wallet-linked (their repo's documented revocation trap; derivation flow unverified) | random root, signature-derivation banned (§4) | **They are wrong on this axis and their own docs admit the consequence** ("regenerate + re-encrypt everything"). Confirmation, not a task. |
| PQ | classical ECIES, no hybrid | X-Wing MUST | **Both right**: HNDL against deletable IPFS blobs is a bounded bet; against a permanent chain it is a certainty. Missions diverge; ours has no classical option. |
| Recipient discovery | Portal contract's access config names collaborators (their zk-granular-permissions work exists precisely because this leaks) | random occurrence keys + §2 scan lanes | EFS's shape is stronger at Layer 1; their vOPRF membership work is Layer-2 frontier (other lane's charge). |
| Link caps | Link Lock = key in URL fragment | cap-in-fragment (§4.3 base) | Convergent — independent validation of the Tahoe pattern. |
| Reuse audited libs | Penumbra, `@noble/*` | SDK should do the same (`@noble/ciphers`/`@noble/curves` + an audited ML-KEM; hand-roll nothing) | Agreed lesson, carried. |

## 11. Cross-check B — Tahoe-LAFS cap semantics (does EFS need the triad?)

Tahoe's triad (recall; foundational): **write-cap** ⊃ **read-cap** ⊃ **verify-cap** — attenuable capabilities, where verify-caps let keyless servers check/repair ciphertext integrity. Does EFS need all three?

- **Write-cap: NO — writes are signatures.** Tahoe needs write-caps because a directory is a mutable cell whose write authority must be bearable; EFS has no mutable cells — "writing" is authoring signed claims under your own identity, and *placement* authority is a lens fact. The nearest EFS object is the **structure-cap** (salt/dirnode knowledge = ability to write *into a private rendezvous*), which is discovery, not authority. Do not import write-caps; they would re-create the msg.sender confusion v2 just escaped.
- **Verify-cap: FREE — and stronger than Tahoe's.** `contentHash`/`chunksRoot`/per-chunk SHA-256 are public on-chain words; *everyone* holds the verify-cap to every file by default; mirrors repair ciphertext with zero key material. EFS gets for free what Tahoe had to engineer into its cap lattice. Worth one proud sentence in the docs.
- **Read-cap: YES — the one cap EFS actually mints**, in two attenuation grades exactly as the base text has them: structure-cap (shape, no plaintext) < read-cap (+KEK). One correction to the cap-string spec: **a read-cap MUST embed the content commitment it grants against** — `cap = {saltedRootId | fileId, keyMaterial, dekCommit}` — so a cap cannot be silently re-pointed at substituted content (Tahoe caps bind the verify hash into the cap string for exactly this reason; EFS's version is binding dekCommit + fileId).
- Net: **the triad collapses to read-caps, because the other two corners are supplied by the envelope (signatures) and the chain (public verification).** This is a genuinely *better* position than Tahoe's, and it is a direct dividend of verify-don't-trust — the mission end paying rent inside Layer 1.

---

## 12. What the whole layer looks like after this review (one table)

| # | Component | Verdict | Action |
|---|---|---|---|
| 1 | Wrap scheme | UNDERSPECIFIED → spec'd | HPKE base + X-Wing + info/aad binding + dekCommit (§1.3–1.4) |
| 2 | Trial-decrypt scaling | UNDERSPECIFIED (worst gap) → spec'd | three-lane scan + hints k=16 + self-index (§2) |
| 3 | encryptionKey registry | BLESSED + completions | blob schema, scan-key role, refuse-list, per-persona (§3) |
| 4 | P9 roaming derivation | UNDERSPECIFIED → spec'd | random root; signature-derivation BANNED (G9 extension) (§4) |
| 5 | Salted family | BLESSED + 1 sufficiency gap | pin blinding fn + child-chain (F-1/F-2); topology honesty; dirnode default (§5) |
| 6 | Groups | BLESSED roadmap | pairwise/KEK now; MLS-shaped later; ordering blocker named; reserve nothing (§6) |
| 7 | Crypto-shred | BLESSED | version-granularity; fresh-DEK nonce law; custody-claim honesty (§7) |
| 8 | PQ hybrid | BLESSED | X-Wing 0x647a; no classical tag ever; re-wrap ≠ un-harvest (§8) |
| 9 | Padding | UNDERSPECIFIED → spec'd | Padmé + 4 KiB floor + VAL buckets + cost table (§9) |

---

## Freeze-sensitive reservations

Everything in this review was tested against the frozen surface. **Headline: Layer 1 demands NO new rows, NO new kernel state, NO envelope changes.** Five precise items touch the frozen surface; each classified, with the sufficiency test shown. Everything else in this file is CONVENTION (post-freeze-addable) — the adversarial checks for the big ones are shown inline (§2.4 scan/no-index; §6.4 groups/nothing; §5.3 dirnodes/nothing).

| # | Item | Class | Exactly what must be reserved/changed, and the sufficiency test |
|---|---|---|---|
| **F-1** | **Blinded-name function pinned into the salted family** (completes D3/D4) | **ROW-class (derivation math)** | Pin `blindedName = keccak256(DOMAIN_NAME_BLIND_V1 || salt32 || nfc(name))` + the constant `DOMAIN_NAME_BLIND_V1` + golden vectors, in the D3/D4 ceremony batch. **Sufficiency:** with this + D3's DOMAIN_ANCHOR_SALTED + resolver-gate + D4's disclosure shape, third parties can verify disclosures byte-exactly and independent capability holders derive identical ids → family fully instantiable post-freeze. **Without it, D3/D4 are insufficient**: disclosure verification has no defined math; two clients blind differently and fork every private path. |
| **F-2** | **Child-derivation chain for subtree salts** (per-segment keys) | **ROW-class (derivation math) — or explicitly declare it client-Durable** | Either pin `K_child = HKDF-SHA-256(K_node, "efs/v2/salt/child" || blindedName_child)` with vectors alongside F-1, or state in the frozen family text that segment-key derivation is capability-holder convention (in which case partial-disclosure interop across clients is NOT guaranteed and the docs must say so). Recommend pinning: partial disclosure (D4's whole point) otherwise means different things in different clients. **Sufficiency:** pinned chain + F-1 ⇒ "reveal K_node ⇒ verifiers/co-holders derive exactly the descendant set" is well-defined. |
| **F-3** | **keyWrap row text: occurrence keys "OPAQUE", not "random"** (E5 wording) | **ROW-text wording** | The frozen E5 text must read: occurrence keys in the private tier MUST be **opaque — computationally unlinkable to recipient identity by non-holders** (uniformly random being the degenerate case), not "MUST be random." **Sufficiency test that catches the bug:** §2's H1 view-tag-bearing and H2 PRF-derived occurrence keys are structured, not random; under a frozen "MUST be random," the entire scan-lane design (and any future FMD upgrade) is non-conforming forever. One word choice decides whether the scanning problem is solvable post-freeze. |
| **F-4** | **keyWrap row text: self-escrow occurrence key is owner-derived, never a public constant** (E5 wording) | **ROW-text wording** | E5's "reserved self-occurrence-key escrow" must be reserved as *owner-derived* (e.g. PRF(scanRoot, fileId), §2.5), not as a published constant. **Sufficiency/leak test:** a frozen public constant = permanent O(1) oracle "file F has owner escrow" — the same oracle class A1 killed for recipients, reintroduced for owners in frozen text. Owner-derived costs nothing and recovery still works (root → scanRoot → point reads). |
| **F-5** | **encryptionKey row text: blob admits key *roles* (kem + scan), and the KEM algoTag registry is numbering-disciplined** (completes C3) | **ROW-text wording + registry convention** | C3's frozen row description must say the VAL blob is a *typed multi-key* structure (roles at minimum {kem, scan}; grammar Durable) — if the frozen text says "encryption key(s)" only, publishing scan keys post-freeze becomes a squat on a frozen row's stated meaning. Registry: launch `0x01 = xwing-v1`; reserve 0x02/0x03 names; **never mint a classical-only tag** (§8.2). **Sufficiency:** §2 scanning, §3 multi-device, §8 migration all reachable post-freeze via blob grammar alone. |
| R-1 | Etched occurrence-key/recipient index for scanning | **REJECT** | Point-reads can't serve hidden recipients by definition; scanning rides events + spine + P8 snapshots (§2.4). Re-affirms B7. |
| R-2 | Any "group"/MLS reserved row, epoch word, or commit-ordering kernel hook | **REJECT** | §6.4 enumeration: all future group machinery is records-as-convention; ordering is a convention or rides B1, which is already its own decision. A speculative row here is junk pollution of the frozen table. |
| R-3 | On-chain padding/committing-AEAD/scheme enforcement of any kind | **REJECT** | The kernel must never parse ciphertext (scheme-blindness is what keeps E6's fold-into-header fix clean). All MUSTs in this file are SDK/conformance-level. |
| R-4 | Classical-only KEM algoTag | **REJECT (deliberate permanent absence)** | §8.2 — the registry's silence is the downgrade defense. Recorded so silence doesn't get "fixed" later. |

Also carried, unchanged, already in the reservation set: C3/E5/E6/D3/D4 as listed in [[fs-pass-freeze-reservations]]; S1's separate-KEM-registry fix; S7's resolver-gate; F13's claimedAt=0 rider. This review found **no missing row beyond the F-1/F-2 derivation-math completions, and no reservation demanded by scanning, groups, committing AEAD, padding, PQ migration, or dirnodes** — each checked by enumerating what shipping it later requires (shown in the sections cited).

---

## Decisions for James

Plain English, with examples. My recommendation is marked ▸ on each.

**D1 — Should encrypted files be REQUIRED to use "committing" encryption?**
Plain version: with ordinary encryption (the kind everything uses — AES-GCM), a technically savvy attacker can build ONE encrypted file that opens as *different documents for different people* — your moderator sees a recipe, the target sees the leak — and both "verify" as the same file, same hash, same everything. On EFS, the file's on-chain identity is supposed to mean "one file, one content." Committing encryption (a slightly different assembly of the same standard parts, ~zero speed cost for files) makes that attack impossible.
- (a) Ordinary AES-GCM like everyone else — simplest, interoperable with off-the-shelf tools, leaves the two-faced-file attack open.
- (b) ▸ **Committing encryption MUST for the private tier** (the §7.2 recipe: standard ChaCha20 + HMAC), plus a 32-byte "key fingerprint" in every file header and share (dekCommit) so every recipient can check they got the same key as everyone else and poisoned "shares" are auto-rejected.
- (c) Committing optional per-app. (Worst: the guarantee "one fileId = one content" becomes app-dependent — unverifiable from outside.)
Recommendation: (b). This is the cheapest place in the whole design to buy a real guarantee.

**D2 — Which post-quantum wrap, and do we wait for the RFC?**
Every key-share written on-chain is harvestable forever; quantum computers someday = old shares readable. The fix (wrapping keys with X25519+ML-KEM together, called X-Wing) is standardized-in-substance but the IETF paperwork isn't stamped yet (still a draft as of 2026-07).
- (a) ▸ **Ship X-Wing now** under our own algoTag `0x01` with our own pinned test vectors; if the final RFC changes bytes, that's simply algoTag `0x02` later — the registry absorbs it, nothing breaks.
- (b) Wait for the RFC — every wrap written meanwhile is either classical (harvestable) or blocked (no sharing in the private tier). Bad trade on a permanent archive.
- (c) Classical X25519 now, PQ later — recorded REJECT (R-4): "later" cannot un-harvest "now."
Recommendation: (a).

**D3 — How do people FIND things shared with them?** (the scanning problem)
Because we hid recipient names (correctly — otherwise anyone could check "is Bob a recipient of F?"), your phone has to *discover* incoming shares. Naively that means downloading every share-record ever written — fine at 10 thousand, ~120 GB at 100 million. Options:
- (a) Naive scan only — dies at scale; effectively rations sharing.
- (b) ▸ **Three lanes (§2.3):** (1) only scan what's new since last sync; (2) friends' shares found instantly via a shared secret trick (no interaction needed, invisible to observers); (3) stranger shares found via a 2-byte "maybe for you" tag that observers can't read (the same trick Ethereum stealth addresses use), ~30× cheaper than full checks; plus an encrypted "index of my stuff" backup so a new phone doesn't rescan history.
- (c) Delegate scanning to an indexer service by giving it your scan key — convenient, but that service then sees *which shares are yours* (not the contents). Fine as an opt-in; must never be the only way.
Recommendation: (b) with (c) as opt-in. Requires freeze wording F-3 (one word in the frozen row text — "opaque" not "random") or lane 2/3 become illegal forever.

**D4 — Private folders: on-chain hidden tree, or encrypted folder-file?**
Example: your `Journal/2026/` with 40 entries. Option A (salted TAGDEFs, currently reserved): each folder/file is an on-chain node with scrambled names — names hidden, but anyone can see an opaque cluster: "something with 40 children, edited Tuesdays." Option B (encrypted dirnode, Tahoe-style): the folder is itself one encrypted file listing its children; the chain shows ONE object and its edit cadence, no tree shape at all; also ~40× fewer records (cheaper gas).
- (a) Salted trees as the default (status quo direction).
- (b) ▸ **Encrypted dirnodes as the default; salted trees for the special cases** that genuinely need on-chain addressable/provable paths (e.g. reveal-later journalism embargoes, contract-readable private anchors). Both ship; zero freeze impact (dirnodes are pure convention; salted family stays reserved as-is + F-1/F-2 math pins).
Recommendation: (b). Less leakage, less gas, same sharing power.

**D5 — Where does the master secret for your private stuff come from?**
- (a) Derive it from a wallet signature ("sign this message to unlock your files") — the Fileverse-style UX. Feels magical: nothing to back up. Reality: any dapp that gets you to sign that same message OWNS YOUR ENTIRE PRIVATE ARCHIVE, forever, unrotatably; and some signers (MPC/hardware) don't sign deterministically — your files become unrecoverable. This is the trap §4.1 documents.
- (b) ▸ **Random master secret, generated at onboarding, backed up by wrapping it to your other devices** (add-a-device = the backup ceremony) with an optional passphrase-protected recovery wrap. Slightly more onboarding friction; categorically safer; consistent with the G9 rule that key theft must never decrypt your archive.
- (c) (b) by default with (a) as an explicit "I understand the risks" escape hatch, EIP-712-scoped.
Recommendation: (b); (c) only if onboarding data says the friction bites. Ruling either way should extend G9: no root secret derivable from the identity key or its signatures.

**D6 — Groups: fancy now or fancy later?**
Removing someone from a 10-person shared folder = ~9 re-shares (pennies). At 100 people it's ~100 records per removal (noticeable); at 10,000 it needs the clever tree scheme messaging apps use (MLS/TreeKEM).
- (a) ▸ **Simple now (pairwise + folder keys), MLS-shaped later**, with the named blocker (EFS has no cross-author ordering; a future group scheme needs a designated-committer convention or the `admittedAt` decision B1) written into the roadmap. Nothing to reserve (checked, §6.4).
- (b) Build TreeKEM now — months of work for group sizes nobody has yet.
Recommendation: (a). Also ratify the honesty rider: EFS never claims "forward secrecy" (impossible on a permanent archive, §4.3); it claims forward-only re-key + shred.

---

## Confidence

**VERIFIED (primary source read during this review, 2026-07-11):**
- draft-ietf-hpke-pq-04: KEM codepoints (ML-KEM 0x0040–42; MLKEM768-X25519 = 0x647a; P-256/P-384 hybrids), explicit no-AuthEncap statement, SHAKE KDF additions.
- draft-connolly-cfrg-xwing-kem (-09/-10): construction (SHA3-256 combiner over ss_M, ss_X, ct_X, pk_X + label), sizes (ek 1216 / dk 32-seed / ct 1120 / ss 32), not-an-authenticated-KEM, IND-CCA bound, MAL-BIND-K-PK & MAL-BIND-K-CT; still an I-D (draft-10 expires 2026-09-03; not an RFC as of 2026-07-11).
- RFC 9771 (May 2025, Informational): key-commitment definition; AES-GCM/ChaCha20-Poly1305 non-committing (also Len–Grubbs–Ristenpart, USENIX Sec'21, partitioning oracles).
- age's multi-key mitigation = bounding stanza ciphertext size (FiloSottile/age commit 2194f69).
- ERC-5564 view tags: 1 byte, ~6×parse speedup, 255/256 skip, EIP's own 128→124-bit margin framing (eips.ethereum.org/EIPS/eip-5564).
- Padmé: O(log log M) leakage, ≤~12% max overhead decreasing with size (PURBs, PoPETS 2019 / bford.info).
- OMR: ~1 GB detection keys, impractical for constrained devices (zfnd.org; Liu–Tromer ePrint 2021/1256; PerfOMR USENIX'24). Penumbra FMD spec exists (protocol.penumbra.zone).
- MetaMask deprecated eth_getEncryptionPublicKey/eth_decrypt; EIP-1024 abandoned; stated reason = same key across curves for sign+encrypt (metamask.io/news).
- fileverse/fileverse-cryptography README: ECIES via @noble/curves (curve unstated), NaCl secretbox, HKDF, Argon2id, AGPL-3.0.
- All EFS-internal claims (row statuses, prior red-team findings, slot mechanics, envelope semantics): read directly from the planning corpus this session.

**PLAUSIBLE (recalled/derived, not re-fetched; flagged where used):**
- FIPS 203 final 2024-08-13; RFC 9180 mode/suite numerology (cross-consistent with the fetched hpke-pq text); RFC 9420 TreeKEM properties & DS ordering requirement; Tahoe cap-triad semantics; Cryptree (Grolimund et al. 2006); STREAM nonce construction & age's chunk scheme shape; invisible-salamanders/franking lineage (Dodis–Grubbs–Ristenpart–Woodage); CTX (Chan–Rogaway) and CMT-1/CMT-4 (Bellare–Hoang) framework; RFC 6979 determinism as prevailing wallet behavior; X25519/ML-KEM per-op timings (order-of-magnitude); gas ~22–27k/record (from the pass brief); "file-sharing groups ≤100" (unmeasured intuition, labeled).
- The attacker-computes-candidate-AEAD-keys argument (§1.4 item 1): reasoning reproduced by me from HPKE's key schedule; not from a published attack paper on HPKE trial-decryption specifically.

**COULD NOT VERIFY (named honestly):**
- Fileverse's actual wallet-signature key-derivation flow, their ECIES curve, and their audit reports (non-public; carried from privacy.md's prior round with its own caveat). The §10 table marks the affected rows.
- Whether any mainstream library ships the CTX committing transform natively as of mid-2026 (searched; no positive finding — the §7.2 EtM recommendation deliberately avoids depending on one).
- Per-wallet ECDSA nonce behavior (RFC 6979 vs randomized) across MetaMask/Ledger/MPC vendors — the §4 ruling is deliberately robust to either answer.
- Exact 2026 mobile benchmark numbers for X-Wing decap — the §2.1 table is order-of-magnitude and says so.
