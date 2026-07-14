# Red team — Layer 1 cryptography (second, independent cryptographer)

**Lane:** SECOND CRYPTOGRAPHER RED TEAM — the pass that never ran in round 1 (critic GAP-1). Target: `layer1-crypto.md` end-to-end, and specifically the five freeze-bound items the critic consolidated (critic §3.1): F-1 blinded-name function, F-2 child-derivation chain, F-3 "opaque not random," F-4 owner-derived self-escrow key, F-5 typed-multi-key `encryptionKey` blob + open KEM registry. The critic marked these CRITIC-VERIFIED, not RED-TEAMED; this file is the adversarial pass owed before the ceremony freezes them.

**Standards re-fetched this session (2026-07-11):** draft-connolly-cfrg-xwing-kem-10 (auth status, MAL-BIND-K-CT/PK, KEM id 25722=0x647a, sizes 1216/32/1120/32, SHA3-256 combiner inputs); **eprint 2026/396 "Anonymity of X-Wing and its Variants"** (the anonymity result the lane did NOT cite — load-bearing, see FATAL-adjacent finding Q1); X-Wing IND-CCA robust-combiner statement (cic.iacr.org/p/1/1/21); ERC-5564 view-tag (1-byte MSB of hashed shared secret, 128→124-bit margin, 255/256 skip).

**Honesty frame:** EFS is confidential, never anonymous. Below I distinguish content-confidentiality (post-quantum, robust) from recipient-unlinkability (classical-only, retroactively defeated at CRQC) — a split the lane blurs and the single most important thing this red team adds.

**Status:** draft — adversarial record. #status/draft #kind/review #topic/privacy #pass/deep-privacy

---

## 0. Verdict in one paragraph

**No FATAL, one NOT-FREEZE-SAFE freeze item, one load-bearing honesty gap.** Seven of the nine components are CONFIRM-BLESSED; the committing-AEAD recipe, the X-Wing pick, the G9-to-root-secrets extension, and the three-lane scan design survive concrete attack. The committing-AEAD binding chain (dekCommit + HPKE `info` + EtM-HMAC) defeats all three equivocation/replay attacks I ran — the strongest part of the layer. **The one freeze item that is NOT safe as written is F-2**: the child-derivation chain and F-1's blinded-name function were specified independently and **do not compose** — F-2's headline property ("reveal `K_node` ⇒ unlock exactly the descendant set") is *false* unless a third, unpinned rule (how each child's `salt32` derives from `K_node`) is added; F-1 treats `salt32` as a free input, which contradicts F-2. That is a genuine derivation-math gap the single-reviewer verification missed, and it is exactly the class of thing that Etches wrong forever. **The one honesty gap** (severity SERIOUS, not freeze-blocking): per eprint 2026/396, X-Wing's *anonymity* requires **both** halves to be anonymous, whereas its IND-CCA *confidentiality* survives on **either** half — so recipient key-privacy is **classical-only and retroactively falls at CRQC**, while content stays secret. The lane blesses X-Wing as "key-private" (R5-zk / F-5) with no CRQC-anonymity caveat. F-1, F-3, F-4, F-5, R5-zk are freeze-safe with the wording tightenings below.

---

## 1. Component-by-component verdicts (mirroring the lane's list)

| # | Component | Verdict | Why |
|---|---|---|---|
| 1 | Wrap scheme (HPKE base + X-Wing + info/aad) | **CONFIRM-BLESSED** | Cross-file replay dies at the `info` mismatch; §2 below runs it concretely. |
| 2 | Trial-decrypt scaling (three-lane scan, k=16) | **CONFIRM-BLESSED + GAP** | No birthday/intersection leak from view tags (§4); but scan-layer anonymity is classical-only (Q1). |
| 3 | `encryptionKey` registry | **CONFIRM-BLESSED** | G9-typed refuse-list sound; F-5 governance caveat (§5, F-5). |
| 4 | P9 derivation / signature-ban | **CONFIRM-BLESSED + GAP** | G9-to-root-secrets is sound (§6); hardware-wallet custody gap unstated (Q4). |
| 5 | Salted family | **OVERTURN-IN-PART** | F-1 self-contained for disclosure; **F-2 does not compose with F-1** — NOT-FREEZE-SAFE as written (§5, F-2). |
| 6 | Groups | **CONFIRM-BLESSED** | Reserve-nothing enumeration holds; FEK-rotation hazard is the OS lane's GAP-3, not a crypto defect. |
| 7 | Crypto-shred / committing AEAD | **CONFIRM-BLESSED** | dekCommit binding reduces to SHA-256 collision resistance; all three equivocation attacks caught (§3). |
| 8 | PQ hybrid (X-Wing) | **CONFIRM-BLESSED + honesty GAP** | Confidentiality robust (either-half); anonymity NOT post-quantum (Q1); §8.1 "∧" notation is wrong-direction (§7). |
| 9 | Padding (Padmé + buckets) | **CONFIRM-BLESSED** | Dirnode bucket-crossing signal under-stated (Q6); VAL 8KiB bucket = the cap (confirm AEAD headroom). |

---

## 2. The wrap scheme — malicious-sharer attacks run concretely (CONFIRM)

The lane's binding claim is that HPKE `info = "efs/v2/keywrap" ‖ granter(20) ‖ fileId(32)` + `aad = dekCommit(32)` bind a wrap to its (granter, file). I ran the three transplant/replay games:

- **(c) cross-file wrap replay (wrap for A replayed as B).** Mallory copies Alice's sealed blob into Mallory's own keyWrap TAG targeting fileId_B. On decap the recipient reconstructs `info'` **from the record context** — author (=Mallory) and target (=fileId_B) — so `info' = "…"‖Mallory‖fileId_B`, but the blob was sealed under `"…"‖Alice‖fileId_A`. HPKE authenticates `info` in the key schedule ⇒ **Open fails**. Dies twice over (granter word AND fileId word differ). **Caught.**
- **(a) same file, two DEKs to two recipients.** Content is one ciphertext under one DEK; its prologue carries `dekCommit = HKDF(DEK,fileId)`. The second recipient unwraps a different DEK', recomputes `HKDF(DEK',fileId) ≠ dekCommit` ⇒ **rejects before rendering.** To actually deliver two *plaintexts* the attacker would need two ciphertexts = two fileIds, so the "one fileId, two faces" attack is structurally impossible. **Caught.**
- **(b) STREAM splice/truncation under one DEK.** Counter nonces `LE64(i)‖…‖finalFlag` + per-chunk HMAC over `prologue‖nonce‖ct` close reorder/truncation/extension; fresh-DEK-per-version closes cross-version nonce reuse. **Caught.**

**Is HKDF-as-commitment binding enough (the brief's PRF-vs-RO question)?** Yes. `dekCommit = HKDF-Extract-then-Expand(salt=∅, IKM=DEK)`; Extract is `HMAC-SHA-256(0, DEK)` with DEK as the HMAC *message*. Finding `DEK≠DEK'` with equal `dekCommit` reduces to a **SHA-256 collision** — infeasible; full random-oracle modelling is not required for *binding* (it would be for hiding, but hiding is not claimed — DEK is 256-bit random and `dekCommit` is one-way). Publishing `dekCommit` in the (fetchable) ciphertext prologue leaks nothing on the DEK and does not link files (fileId is mixed in). **The committing recipe is the strongest-specified part of Layer 1; bless it unchanged.** One nit for the SDK spec: state that `dekCommit`'s job is *wrap↔content binding*, and that *content equivocation* is prevented by the EtM-HMAC (CMT-4) construction, not by `dekCommit` — two mechanisms, don't conflate them in the docs.

---

## 3. Quantum harvester — the anonymity asymmetry the lane missed (Q1, SERIOUS honesty)

The lane blesses X-Wing as MAL-BIND-K-CT/PK (verified — draft-10 confirms both) and blesses R5-zk / F-5's "wraps MUST be key-private (anonymity-preserving)," implicitly satisfied by X-Wing. **The lane never checked whether X-Wing is actually key-private, and against whom.** I did.

- **Confidentiality (IND-CCA) is a *robust* combiner:** X-Wing is IND-CCA if **either** X25519 (strong-DH, ROM) **or** ML-KEM-768 (standard model) is secure (cic.iacr.org/p/1/1/21). So content stays secret post-CRQC via the ML-KEM half. HNDL-on-content defended. ✓ (This is what the lane's §8.3 "dead unless *both* fall" correctly states.)
- **Anonymity (key-privacy / ANON-CCA) is a *weak* combiner:** per **eprint 2026/396 (2026, "Anonymity of X-Wing and its Variants")**, X-Wing achieves anonymity only if **both** X25519 **and** ML-KEM-768 are anonymous. X25519's anonymity "can be proven without a hardness assumption" classically — but that does not survive a quantum adversary, and **because both halves are required, a CRQC that breaks X25519 breaks X-Wing's anonymity.**

**Consequence for EFS, stated honestly and permanently:** *recipient-unlinkability of every keyWrap written today is classical-only.* A harvest-now-decrypt-later adversary at CRQC cannot read wrapped content (ML-KEM holds) but **can retroactively deanonymize which recipient each wrap targets** — on a permanent public archive, that is a permanent retroactive recipient-graph disclosure. This *unifies* with the scan layer: H1 view tags and H2 mailbox keys ride **classical X25519 scan keys** (the lane deliberately keeps scan keys classical), so at CRQC an adversary re-derives every scan DH and **clusters all wraps and announcements by recipient**. The critic's JD-9 already flagged this for default-on stealth view keys; the finding here is broader — **it is true of the ordinary keyWrap tier, not just stealth**, and the lane presents the ordinary wrap as key-private without the caveat.

This does not overturn any freeze item. It *reinforces* F-5 (the open KEM registry is exactly what lets a future fully-anonymous PQ KEM — e.g., a memory-tight X-Wing variant from 2026/396, or a pure-PQ anonymous KEM — supersede X-Wing for the anonymity property). Repairs:
- **Honesty line (MUST, positioning + row docs):** "EFS wraps give post-quantum *content* secrecy and classical-only *recipient* unlinkability. Who-shared-with-whom is protected against today's adversaries and is retroactively exposed to a future quantum adversary. Anonymity was never promised; even confidential-tier recipient privacy has a quantum expiry."
- **R5-zk wording:** the "MUST be key-private" sentence is a correct *floor* and stays freeze-safe, but it MUST NOT be read as "post-quantum key-private." Add "(classical key-privacy is the launch floor; PQ-anonymous suites are a Durable registry upgrade)."

---

## 4. View tags — no birthday/intersection leak (CONFIRM), one CRQC caveat

The brief asks whether the k=16 view tag enables a birthday/intersection attack across announcements sharing tag prefixes. **It does not, because tags do not cluster.** H1 tag `= H(X25519(ephScanSk, recipientScanPk))[0:16]` uses a **fresh per-wrap ephemeral**, so successive tags to the *same* recipient are independent uniform 16-bit draws — an observer cannot group wraps by recipient (this is precisely why the lane chose per-wrap ephemerals over a stable mailbox ID). ERC-5564 confirms the shape (1-byte MSB of the hashed shared secret; the lane's k=16 is 2 bytes, margin 128→112, immaterial). A **false positive** (2⁻ᵏ per record) costs the *scanner* one wasted X-Wing decap that fails — no information leaks to anyone from an FP. **Confirmed: k=16 is safe; no intersection leak.** The only leak is the CRQC retro-clustering of Q1 (X25519 scan DH falls), which is the classical-only-anonymity story, not a birthday attack.

H2 mailbox keys `occ_i = HMAC(k_AB, LE64(i))` are PRF outputs; without `k_AB` they are unlinkable to each other and to a recipient. **Confirmed unlinkable to non-holders.**

Two H2 liveness notes (NOTE, not freeze): (1) if A's per-counterparty counter is lost on device loss and restarts at 0, A reuses `occ` values ⇒ LWW slot collisions orphaning old wraps — so **the counter must be roamed in P9 state or re-derived by scanning A's own past wraps to B** (re-derivable from chain, so not fatal); (2) a large counter gap (wraps A wrote that never reached B's venue) is a **window-widening perf cliff, not a strand** — B falls back to H1. State both in the scan convention.

---

## 5. The F-batch — freeze verdicts with exact text

### F-1 blinded-name function — **FREEZE-SAFE for disclosure, but under-specified; four pins required**

`blindedName = keccak256(DOMAIN_NAME_BLIND_V1 ‖ salt32 ‖ nfc(name))` is self-contained for the *disclosure-verification* purpose (the salt is revealed in the disclosure record, so provenance is irrelevant to verification), and it is **encoding-safe**: exactly one variable-length field (`nfc(name)`), and it is terminal, after a fixed constant and a fixed 32-byte salt — so no canonical-encoding ambiguity, and cross-domain collision reduces to keccak collision resistance. **Confusables are NOT laundered** (NFC does not fold Cyrillic-а into Latin-a; the two produce different `blindedName`s and different tagIds) — good, but the *display* of a disclosed name is a confusable/bidi-warning obligation on the verifying client, same as any name-rendering surface. Missing pins the ceremony batch MUST add, or two clients fork every private path:

1. **Byte encoding of `nfc(name)`:** pin **UTF-8 of the NFC form** explicitly (the lane writes "nfc(name)" but never says UTF-8).
2. **Grammar applicability:** rule whether the E4 path-segment reject-set + `MAX_NAME_BYTES=255` + grammar apply to `name` *before* blinding. If they do not, a salted anchor can commit to a name illegal as a plaintext path (control chars, separators) that cannot round-trip on disclosure/promotion. D3 gestures at a "salted-family NFC-validation variant"; F-1 as quoted has only NFC, not the reject-set. **Pin the exact validation set in the vectors.**
3. **Domain distinctness:** `DOMAIN_NAME_BLIND_V1` must be fixed-width and **provably distinct** from every other keccak domain (`DOMAIN_CLAIM_V1`, `DOMAIN_LIST_V1`, `DOMAIN_ANCHOR_SALTED`, the `efs.id.tagdef.v1` family, the propertyId domain). Using keccak "for symmetry" is what *creates* the shared-primitive collision surface; add a domain-constant-distinctness assertion to the golden-vector suite. (HKDF labels are safe — SHA-2 vs keccak cannot cross-collide.)
4. **ID-SHAPE-1 inheritance:** confirm the resulting salted tagId is digest-shaped and re-salted-never-address-shaped per identity's ID-SHAPE-1 invariant (inherited from D3; state it so a blinded id can never be misread as an author word).

With these four, F-1 is freeze-safe. Without them the critic's "sufficiency" claim is optimistic — F-1 as a bare formula is not enough to instantiate the family interoperably.

### F-2 child-derivation chain — **NOT-FREEZE-SAFE as written (does not compose with F-1)**

This is the finding a single reviewer missed. F-2 pins `K_child = HKDF-SHA-256(K_node, "efs/v2/salt/child" ‖ blindedName_child)` and claims "reveal `K_node` ⇒ unlock that node **and its descendants**; siblings stay dark." **The property is false unless each child's `salt32` is derivable from `K_node`, and neither F-1 nor F-2 pins that derivation.** Trace: to compute `K_child` a holder needs `blindedName_child = keccak(DOMAIN_NAME_BLIND_V1 ‖ salt32_child ‖ nfc(name_child))`. If `salt32_child` is random-and-stored (F-1 treats `salt32` as a free input, revealed only in that child's own disclosure record), then holding `K_node` gives you **no way to obtain `salt32_child`**, so you **cannot** derive `K_child` and **cannot** unlock descendants. F-1 (salt = input) and F-2 (subtree bulk-unlock) are therefore **mutually contradictory as specified.**

The fix is a *third* pinned rule reconciling the two — and this is now-or-never derivation math, so it belongs in the same ceremony batch:

- **Option A (keep subtree bulk-unlock):** pin `salt32_child = HKDF-SHA-256(K_node, "efs/v2/salt/anchor" ‖ nfc(name_child))[0:32]`. Then `salt32` is *not* a free input — it is a derived value; disclosure may still reveal it (redundantly) or reveal the K-path; a `K_node`-holder who knows a child's name can derive its salt → its `blindedName` → its tagId (find it) → its `K_child` (unlock it). Note the honest limit: this unlocks descendants **whose names you know** (from a dirnode/traversal), not blind enumeration. Add this as **F-2b** with vectors.
- **Option B (drop subtree bulk-unlock):** declare `salt32` random-per-node and stored; F-2's chain is then unnecessary; "partial disclosure of a subtree" means disclosing each node's salt individually; state in the frozen family text that **cross-node bulk unlock via `K_node` is not supported** and that segment-key derivation is capability-holder convention (Durable), with interop not guaranteed.

**Recommendation:** Option B. The encrypted-dirnode default (C-F / JD-6) already carries the real private-folder load, and dirnodes give subtree unlock *by handing out the child dirnode cap* — F-2's on-chain-derived subtree unlock is the salted-tier's narrow, expensive path, and **rename re-anchors the whole subtree** under Option A (renaming a node changes `blindedName_child` ⇒ changes `K_child` ⇒ re-keys every descendant's blinding branch), which is a strong argument against pinning the more complex Option A into permanent surface. Pin the *minimum* (F-1 for disclosure) and declare F-2 Durable-convention with the honest interop caveat. Either way, **do not freeze F-2 in its current quoted form** — it is incoherent with F-1.

### F-3 "opaque not random" — **FREEZE-SAFE (confirm)**

"Occurrence keys MUST be opaque — computationally unlinkable to recipient identity by non-holders (uniformly random being the degenerate case)" is correct and necessary. It catches the A1 oracle (`H(recipientEncKeyId)` is a *public* function of the recipient key, hence linkable *by non-holders* — the wording bans exactly that) while admitting the structured-but-opaque keys the scan lanes need (H1 fresh-DH tags, H2 `HMAC(k_AB,i)` PRF outputs, F-4 `HMAC(scanRoot,fileId)`). A frozen "MUST be random" would make all three non-conforming forever. **One word decides post-freeze solvability; adopt as F-3.** No change to the critic's text.

### F-4 owner-derived self-escrow key — **FREEZE-SAFE as a PROPERTY; do not freeze the formula**

`occ_self = HMAC-SHA-256(scanRoot, "efs/v2/self-escrow" ‖ fileId)` is G9-clean (checked: an occurrence key is a *slot coordinate*, not a wrap target; it derives from the *scan/encryption* branch, not the signing key — theft of the signing key does not yield `scanRoot`). It is **not** a public oracle (keyed on secret `scanRoot`; `fileId` being public does not help a non-holder). And critically for the brief's fingerprint question: **the self-escrow wrap is structurally indistinguishable from a recipient wrap** — same X-Wing blob format, same opaque (HMAC) occurrence key, same slot family — so an observer **cannot** diff "file has owner escrow" vs "file has a recipient." **No owner-escrow fingerprint. Confirmed.**

Two freeze refinements:
- The **frozen E5 row text should reserve the PROPERTY** ("opaque, owner-derived from the encryption/scan branch, deterministically re-derivable after total device loss, never a public constant") **and NOT freeze the exact `HMAC(scanRoot,fileId)` construction.** The critic's row text says "e.g. `PRF(scanRoot, fileId)`" — drop the "e.g." example from *frozen* text or mark it explicitly non-normative. Rationale: self-escrow has **no cross-author interop** — only *same-user-multi-device* recovery needs a shared construction, which an SDK version gate handles. So the exact PRF is **Durable**, not ROW. Freezing a specific formula needlessly commits it.
- Consequence to state (NOTE): because `occ_self` and every scan/mailbox key hang off `scanRoot`, **rotating `scanRoot` breaks re-derivation of all prior self-escrow wraps, mailbox keys, and view-tag scan matches.** `scanRoot` is therefore a *long-lived, not-freely-rotatable* secret whose compromise blast radius is the **entire recipient graph + the self-escrow index**. Recovery/rotation needs a `scanRoot`-generation list (try each generation). This is an OS/recovery-lane design note, not freeze surface.

### F-5 typed-multi-key blob + open KEM registry + never-classical-only — **FREEZE-SAFE, with one honest de-claim**

The typed-multi-key grammar (`roles ⊇ {kem, scan}`, blob Durable) is the linchpin the critic identifies, and it survives attack:
- **Mixed-suite / weakest-KEM forcing: not applicable.** Wraps are **per-recipient independent** (each DEK is sealed to each recipient under *that* recipient's own KEM) — there is no negotiated common ciphersuite, so there is no TLS-style downgrade-to-weakest. **Confirmed no downgrade-negotiation surface.**
- **Malicious-app blob downgrade:** an app holding a signing session can supersede the user's own `encryptionKey` PIN (it's the user's own cardinality-1 row) with a weakened blob — but this is *account/session compromise*, not a grammar weakness, and since no classical-only tag is *registered* it cannot silently downgrade the KEM to classical via a valid tag. Out of scope of the frozen-surface question; belongs to session-authorization UX (relate to the persona wrong-write guard, JD-20).
- **Honest de-claim (NOTE):** "**never mint a classical-only KEM tag**" is a **registry-governance discipline, not a freeze-enforced invariant** — the KEM registry is explicitly *Durable / post-freeze-addable*, so a future maintainer *could* register `0x04 = classical`. The real fence is the **conforming-client rule "refuse to wrap under a classical-only tag,"** an SDK/conformance gate. The ceremony sheet should record F-5's "no classical tag" under *convention/governance*, not imply the frozen surface prevents it. With that correction, **F-5 is freeze-safe and is the correct linchpin** (it also absorbs the future PQ-anonymous KEM that Q1 will eventually require).

### R5-zk key-privacy sentence — **FREEZE-SAFE** (correct floor; add the "classical" qualifier per Q1). See §3.

---

## 6. P9 derivation and the coupling rule — CONFIRM, plus the hardware-wallet gap (Q4)

The random-`rootSecret` + signature-derivation-ban + G9-to-root-secrets extension is sound and I reproduce it: a signature-derived root re-creates the theft⇒retroactive-decryption catastrophe through one indirection, and non-deterministic signers (MPC/randomized ECDSA) lose data. **Bless the ban; bless "no root secret computable from the identity signing key or any signature by it" into the identity coupling text.**

**But the coupling rule has an unstated cost no lane names (Q4, SERIOUS honesty / GAP).** Hardware wallets (Ledger/Trezor) sign secp256k1 and do **no** X25519/ML-KEM ECDH and **no** HKDF-with-secrets; MetaMask deprecated `eth_getEncryptionPublicKey`/`eth_decrypt` (the lane confirms this); EIP-5630 is not shipped in production (could-not-verify a live implementation this session). Therefore the enc/scan root of a **hardware-wallet-only user must live in software** — the HW device cannot hold or derive it. The result the corpus does not state: **a hardware wallet protects authorship (signing) but provides ZERO protection for the private tier.** A HW-wallet user's entire encrypted archive is only as safe as their software client's keystore — precisely the property HW-wallet users believe they have escaped. This is the confidentiality-tier analogue of identity.md's stated exclusion ("smart-contract-only wallets excluded from authorship at year-0"), and it deserves the same loud, honest statement. It is not fixable (it is forced by G9 + HW-wallet capabilities); it must be *disclosed*. → Decision for James.

Stolen-unlocked device (NOTE): full P9 blast radius is `rootSecret → archiveRoot → {scanRoot, lensStateKey, subtree salts, recoveryKemSeed}` plus `shredRoot` if the enclave is unlocked ⇒ read-everything + shred-everything. Inherent to any key-holding device; enclave-binding of `shredRoot` and remote-wipe are the only levers. The lane acknowledges the offline-stolen-device residual for shred; enumerate the full read blast radius in the OS tier.

---

## 7. X-Wing notation and padding (NOTE-level)

- **§8.1 combiner notation is wrong-direction.** The lane writes "IND-CCA bounded by ML-KEM-768 **∧** gap-CDH(Curve25519)." A hybrid's guarantee is a **disjunction**: secure if **either** holds (robust combiner) — the ∧ reads as requiring *both*, which inverts the guarantee and contradicts the lane's own §8.3 ("dead unless *both* fall" = secure if either holds). Not freeze-bound (SDK/doc text), but fix it so no downstream reader concludes X-Wing needs both halves for confidentiality. (For *anonymity* it genuinely does need both — Q1 — so the doc should carry **both** statements side by side: confidentiality = OR, anonymity = AND.)
- **Padmé dirnode bucket-crossing (Q6).** The lane's §9 lists "dirnode edit rates" as un-fixed by padding but does not name the sharper signal: when a growing dirnode crosses a Padmé length boundary, its on-chain padded size **steps up**, broadcasting "this folder just grew past ~N entries" to anyone diffing successive versions. Mitigation for sensitive dirnodes: pad to a fixed large size (hide growth up to a cap) or grow-only with large hysteresis. NOTE; reinforces the encrypted-dirnode default (which already reduces to one object's cadence).
- **VAL 8 KiB bucket vs the cap.** The top VAL bucket (8 KiB) equals `MAX_VALUE_BYTES = 8192`. Padding is post-encryption, so the usable plaintext for that bucket is 8192 minus AEAD/prologue overhead — confirm the bucket definition accounts for it so a near-cap VAL can still pad to bucket without exceeding 8192. Minor; state it in the cost table.

---

## Freeze-sensitive reservations

Anything the F-batch missed or over-reserved:

- **[MISSED — now-or-never] The F-1↔F-2 salt-provenance rule.** F-1 (`salt32` as input) and F-2 (`K_node` unlocks descendants) do not compose; a third derivation-math rule (`salt32_child = HKDF(K_node, …)`, "F-2b") is required *if* subtree bulk-unlock is kept. This was invisible to single-reviewer verification and is the one genuine freeze defect. **Ruling: either add F-2b with vectors, or drop subtree bulk-unlock and declare F-2 Durable-convention** (recommended — Option B, §5). Pinning F-2 *as quoted* freezes an incoherent spec.
- **[UNDER-SPECIFIED] F-1's four pins:** UTF-8-of-NFC; E4-grammar applicability to blinded names; `DOMAIN_NAME_BLIND_V1` fixed-width + distinctness assertion across all keccak domains; ID-SHAPE-1 inheritance. All belong in the D3/D4 vector batch (§5, F-1).
- **[OVER-CLAIMED as freeze] F-4 exact formula and F-5 "no classical tag."** F-4 should freeze the *property*, not `HMAC(scanRoot,fileId)` (self-escrow needs no cross-author interop → the construction is Durable). F-5's "never classical-only" is *governance*, not frozen surface (the registry is Durable); the real fence is the conforming-client refuse rule. Record both under convention, not ROW, so the ceremony sheet does not over-claim.
- **[CONFIRM freeze-safe] F-3** (opaque-not-random) and **R5-zk** (key-private floor, classical qualifier added) — adopt as the critic has them, with the Q1 caveat that neither implies post-quantum anonymity.
- **[CONFIRM no new surface]** committing AEAD, dekCommit, X-Wing wrap, scan lanes, Padmé, groups, dirnodes — all Durable/convention, verified so by the transplant/replay/enumeration checks above. No new row, kernel state, or envelope change is demanded by anything I attacked.

## Decisions for James

1. **F-2: pin the salt-provenance rule, or drop subtree bulk-unlock (recommend drop).** This is the only freeze item that is unsafe as written. Recommend Option B: freeze F-1 for disclosure only; declare cross-node subtree unlock a Durable capability-holder convention with interop-not-guaranteed stated; let encrypted dirnodes carry subtree sharing (they already do, via child caps, and they don't re-anchor on rename). If you want on-chain-derived subtree unlock in the salted tier, it must be Option A (`F-2b` pinned) — heavier, and renames re-key subtrees.
2. **Adopt the recipient-privacy quantum-expiry honesty line.** State plainly, in positioning and row docs, that EFS wraps give **post-quantum content secrecy but classical-only recipient unlinkability** (X-Wing anonymity needs both halves; scan keys are classical) — who-shared-with-whom is retroactively exposed at CRQC. This is honesty, not a fix; it is also the strongest argument for keeping the KEM registry open (F-5).
3. **Disclose the hardware-wallet private-tier gap.** Because the coupling rule forbids deriving the enc root from the signing key, and HW wallets can't hold/derive an independent enc root, **a hardware-wallet-only user's private tier is protected only by their software keystore — the HW wallet secures authorship, not confidentiality.** Not fixable; must be said, like the smart-wallet authorship exclusion. Decide the messaging.

## Confidence

**VERIFIED (primary sources re-fetched this session, reasoning reproduced):** X-Wing draft-10 (not-authenticated; MAL-BIND-K-CT/PK; KEM id 25722=0x647a; sizes 1216/32/1120/32; SHA3-256 combiner over ss_M‖ss_X‖ct_X‖pk_X‖label); **X-Wing IND-CCA robust-combiner (either-half)** and **X-Wing anonymity weak-combiner (both-halves, falls at CRQC) — eprint 2026/396**, the load-bearing new citation the lane did not have; ERC-5564 view tag (1-byte MSB, 128→124 margin, 255/256 skip). The committing-AEAD binding reduction (dekCommit ⇒ SHA-256 collision resistance), the three transplant/replay refutations, the F-1↔F-2 non-composition, the view-tag no-intersection argument, the G9-to-root-secrets soundness, and the hardware-wallet gap are **my reasoning reproduced from the frozen surface + the lane + the fetched standards** — internally verified; a third cryptographer should re-run the F-2 salt-provenance trace and the 2026/396 anonymity dependency specifically.

**PLAUSIBLE / could-not-verify (flagged where used):** EIP-5630 current status (no live production implementation found this session; the HW-wallet gap does not depend on its status — it depends on HW wallets not doing X25519/ML-KEM, which is architectural); exact 2026/396 memory-tight-variant construction (abstract-level only — I did not need the variant, only the both-halves-required anonymity condition, which the abstract states explicitly); the internal EFS row/derivation constants (read from the planning corpus, not independently recomputed — the ceremony's own vector suite is the check).

**LOAD-BEARING RESULTS (re-open if any is wrong):** (1) F-2 does not compose with F-1 — NOT-FREEZE-SAFE as quoted; (2) X-Wing recipient-anonymity is classical-only (both-halves) while content confidentiality is post-quantum (either-half) — the asymmetry the lane blurred; (3) the committing-AEAD recipe is sound against all three equivocation/replay attacks — bless; (4) F-3/F-4/F-5/R5-zk freeze-safe with the wording tightenings above; (5) the hardware-wallet private-tier gap is real, forced by the coupling rule, and unstated.
