# Red-team report — attack on `deletion-trash-privacy.md`

**Target:** `/private/tmp/.../fspass/deletion-trash-privacy.md` (the deletion / crypto-shred / private-files / private-folders / metadata-leak lane)
**Attacker brief:** destroy the key-wrap slot shapes, forward-secrecy honesty, crypto-shred completeness, salted-TAGDEF cap leakage, metadata-leak enumeration completeness, PQ-hybrid wrap format prematurity, GDPR honesty, and **every freeze-sensitive row the lane proposes** (wrong row = Etched forever).
**Ground truth re-read for adjudication:** `freeze-gates §C`, `codex-kinds` (reserved-key table + amendment 5 closed targetKind enum), `codex-kernel §10` (genesis manifest enumeration), `deterministic-ids §5/§7/§8/§13` (virtual-anchor reserved-key set, salt entropy rule, blinded/salted forks, resolver-gate), `identity` (G9/amendment 1 + algoTag families), `read-lens-spec` (§2.1 PROVEN-ABSENT/fallthrough, §3.4 deny, §2.4 flags, §6.5 fragment), `large-file-uploads` (mandatory fix 3).
**Date:** 2026-07-10

---

## Verdict in one paragraph

The lane's *prose theses survive* — soft-delete-is-the-only-delete, crypto-shred-is-the-only-honest-hard-delete, permanent≠public, "honest enumeration IS the mitigation," and the forward-only law are all correct and well-grounded, and several sub-findings (the FM-P1 fallthrough-resurrection, the L9 intern-equality-oracle, the HNDL-on-wraps MUST) are genuinely sharp contributions the ground truth backs. **But the lane's freeze-sensitive reservations are not safe to Etch as written.** Two of them are actively broken: (A) the `keyWrap` dual-role/PIN proposal *contradicts the owning derivation doc*, which excludes keyWrap from cardinality-1 by explicit ruling; (B) the per-recipient occurrence-key recipe the lane proposes as *frozen keyWrap semantics* is a public recipient-set confirmation oracle that **silently defeats the lane's own L3 anonymous-wrap social-graph mitigation.** Four more freeze/crypto findings (algoTag-family category error, passphrase-derived shred-root, lazy-rekey permanence, mandatory-plaintext-`contentEncryption` intern fingerprint) are serious and fixable inside the design. The GDPR statement over-promises. None is unfixable, but **the keyWrap row must not go to the ceremony in this shape.**

---

## FATAL (freeze-sensitive; would Etch a broken row or ship a false privacy claim)

### A1. The per-recipient occurrence-key `H(recipientEncKeyId)` is a public O(1) recipient-set confirmation oracle — it defeats the lane's own anonymous-wrap mitigation (self-contradiction §3.2 F2 vs §5 L3)

**The claim under attack.** §3.2/F2 proposes, as part of the **frozen `keyWrap` row semantics**, that per-recipient wrap slots use "the opaque-occurrence-key recipe … occurrence key = `H(recipientEncKeyId)` (or random for anonymous mode)." Separately, L3 lists "keyWrap recipient hints" as a social-graph leak and offers "**anonymous-recipient wraps (no hint; trial-decrypt cost O(wraps))**" as the mitigation.

**The attack.** The lane *also* mints `encryptionKey` as a **published** reserved row under every ADDRESS container (F3). So `recipientEncKeyId` is public for every identity. The wrap slot key is `(granterAuthor, keyWrapDef, fileId, occurrenceKey)` with `occurrenceKey = H(recipientEncKeyId)`. Therefore:

> *"Is Bob a recipient of file F granted by Alice?"* = compute `H(BobEncKeyId)` (public inputs) → `getSlot(Alice, keyWrap, F, H(BobEncKeyId))` → occupied ⟺ yes. **O(1), by anyone, for any candidate whose encryptionKey is public — i.e. everyone.**

Nulling the in-blob `recipientKeyHint` (the "anonymous mode" L3 leans on) does **nothing**, because the *slot key itself* already deterministically encodes the recipient. The two mitigations are presented as independently composable; they are not. This is exactly the confirmation-oracle class the lane itself warns about for salted tagIds (§4.1 "anyone can derive … and probe") and that `deterministic-ids §7` forbids for DATA salts ("a content-derived salt makes dataId a confirmation oracle") — **the lane failed to apply its own lesson to its own wrap-slot recipe.**

**Severity: FATAL as a privacy claim + freeze-sensitive.** L3's social-graph protection is the lane's *only* named tool for the recipient graph; the default keyWrap recipe silently nullifies it. And the occurrence-key rule is proposed as **frozen row semantics** ("the keyWrap row spec must state this occurrence-key rule; it is part of the row's frozen semantics"), so shipping it wrong is permanent.

**Fix exists inside the design? Yes.** The lane already lists "or random for anonymous mode" — but as an afterthought. Minimal fix:
1. **Flip the default for the private tier to random occurrence keys.** A random per-wrap occurrence key makes the slot unlinkable to the recipient. The recipient finds their wrap by trial-decrypt (the O(wraps) cost L3 already accepts); the **granter** re-finds a specific recipient's slot for later REVOKE via a *local* `recipient → occurrenceKey` map (client-side bookkeeping, no on-chain cost).
2. State that `H(recipientEncKeyId)` occurrence keys are a **public-sharing convenience only** (fast recipient self-lookup, discoverable membership acceptable), never for the private tier.
3. Move the occurrence-key rule's privacy consequence into the row spec's normative text, next to the rule itself, so no future client re-introduces the oracle.

---

### A2. The `keyWrap` dual-role PIN proposal contradicts the owning derivation doc — the lane treats a *routed-away, excluded* key as a "row that exists, just pin the role" (§3.2 F2 vs `deterministic-ids §5/§13`)

**The claim under attack.** §3.2 and F2 assert: "The `keyWrap` row **exists in the genesis manifest** with no pinned role shape … Proposal — dual-role, mirroring `mirrors`: **PIN role = the owner's escrow wrap** … TAG role = per-recipient wraps."

**The attack — the ground truth actively excludes this shape.** `deterministic-ids §5` (the doc that *owns* the reserved-key derivation math) says, verbatim:

> "(`keyWrap` is **deliberately excluded**: multi-recipient key wraps **don't fit a cardinality-1 PIN slot**; they use **TAG or a future additive schema**.)"

and its open-question list (§13) fixes the reserved virtual-anchor set as exactly `{contentType, contentHash, size, name, contentEncryption}` — "`keyWrap` **excluded — cardinality-N**." `codex-kernel §10` does list the *word* `keyWrap` in the genesis-manifest enumeration, but that enumeration is explicitly "**to be cut in the next iteration**," and it does not confer the PIN/cardinality-1 role the lane assigns. So the true status of keyWrap is not "existing row, role unpinned" — it is "**routed to TAG-or-future-additive-schema and explicitly barred from the cardinality-1 PIN path.**" The lane's F2 quietly reopens the exact shape the derivation doc closed, and frames it as housekeeping.

The owner-escrow-as-PIN is *attractive* (O(1) "my own way back in," mirroring `mirrors` PIN=primary) — this is a legitimate design want. But the lane presents it as pinning an open field when it is in fact **overturning a stated exclusion**, and does so without citing or engaging the exclusion. A ceremony that trusts F2's "row exists; keep/pin" framing would Etch a cardinality-1 PIN role for keyWrap that the derivation doc argued against — and **wrong reserved-row cardinality is Etched forever.**

**Severity: FATAL (freeze-sensitive).** This is precisely the "wrong row = Etched forever" hazard the pass rule flags.

**Fix exists inside the design? Yes, but it must be an explicit reconciliation, not a silent pin.** Minimal fix:
1. **Cite `deterministic-ids §5/§13` and state the conflict openly.** keyWrap is currently excluded from cardinality-1 and virtual-anchor.
2. If dual-role is still wanted, mint keyWrap as a **full genesis-instantiated dual-role reserved row** (walk-enumerable, like `mirrors`/`supersededBy`) — **not** via the closed 5-key virtual-anchor carve-out — with an explicit written override rationale ("owner-escrow is cardinality-1 and earns the O(1) PIN; per-recipient is cardinality-N TAG"). This requires an amendment line in `deterministic-ids §13`, not silence.
3. **Or** drop the PIN role entirely: make owner-escrow just another wrap TAG with a reserved self-occurrence-key, keeping keyWrap TAG-only exactly as the derivation doc routed it. (Loses the O(1) escrow point read; costs one extra slot read; zero freeze conflict.)

Either path is fine. What is not fine is F2 as written, which reads as "settled row, assign role" when the owning doc says the opposite.

---

## SERIOUS (real defects with in-design fixes)

### S1. `encryptionKey` and wrap blobs are routed onto identity's *signature* algoTag registry — a KEM/KEX category error (§3.3 + F10 vs `identity` algoTags)

§3.3 says the new `encryptionKey` row is "algo-tagged for agility (rides the identity doc's reserved algoTag extension constants)"; F10 says wrap-blob algoTags "ride identity's already-reserved extension constants … verify the algoTag constant space is **wide enough** for KEM tags." But `identity`'s algoTags are a **signature/authentication** registry — "secp256k1 / p256 / p256.webauthn / PQ pattern" — tied to the KEL, the EVM verifier, and record-authorship. `x25519` and `ml-kem-768` are **KEM/KEX** primitives; they are not signature schemes and share none of that machinery. The problem is not *width* (F10's framing); it is **registry identity**: encrypting-key agility must be governed by its own KEM/KEX algoTag family, distinct from the signature-algoTag constants. For the *wrap blob* (Durable, off-chain-interpreted) this is merely sloppy; for the **`encryptionKey` row, which the lane itself marks Etched/⚠️CEREMONY**, drawing its algoTag values from the wrong frozen registry is a genuine freeze error (collision risk or a post-freeze amendment).

**Fix (inside design):** define a distinct reserved **KEM/KEX algoTag family** for `encryptionKey` and wrap blobs (x25519, ml-kem-768, hybrid-combiner id), pinned at the ceremony alongside the row; keep it disjoint from identity's signature algoTags. Correct F10 from "is the space wide enough" to "is there a *separate* KEM registry."

### S2. Crypto-shred completeness — a passphrase-derived shred-root cannot be shredded (§2.3)

§2.3's Boojum-shape indirection is sound *except* for one listed option: the shred-root KEK's plaintext "lives only in destroyable locations (secure enclave / **passphrase-derived**, not in the roaming backup itself)." A passphrase-derived key is the **opposite of destroyable** — the passphrase survives in the owner's memory, password manager, and that manager's own cloud backups, so the root is re-derivable forever. The §2.2 honesty-ladder row "**Genuine erasure-equivalent**" is therefore *false* for any owner who chose passphrase derivation: the ciphertext is not permanently inert, it is one remembered passphrase away from recovery. This is the crypto-shred analogue of conflating STALE with REVOKED — a "shredded" state the design cannot actually deliver.

**Fix (inside design):** disqualify passphrase-derivation for the **shreddable** root (high-entropy, hardware/enclave-bound, never-backed-up key only). Passphrase-derivation stays legal for the **archive** root (§2.3's partition), where recoverability is the goal. State it in the ladder: only enclave-bound-non-exported shred-roots earn the "permanently shredded" render.

### S3. Lazy re-keying gives removed readers *permanent* access to cold files, not the transient window the lane implies (§3.4 / §3.5)

§3.4/§3.5 bless "lazy re-keying": "each file's FEK rotates **on its next content write**," and the removed-member state is rendered as "removed; **N files pending re-key**." But a file that is never written again **never re-keys**, so the removed member's retained old FEK/old-KEK wrap decrypts it **forever**. With the folder-KEK model (§3.5), removal that only rotates the KEK leaves *every* not-yet-rewritten file wrapped under the old KEK the removed member still holds. "Pending re-key" implies a transient state that resolves; for cold content it is **permanent-partial removal**. This under-states the exposure of the blessed default.

**Fix (inside design):** state plainly that lazy re-key means removal is permanent-partial for cold files (a removed member keeps read access to any file not subsequently written). Offer an **eager-rekey** option and/or a background re-key sweep for security-critical removals, and make the UI say which mode is in force ("removed for new writes; K cold files still readable by the removed member until rewritten").

### S4. `contentEncryption` is a mandatory *plaintext* interned VAL — an intern-oracle corpus fingerprint the lane's own L9 rule misses (§3.1 F1 vs L9)

L9 (the lane's sharpest finding) mandates: "sensitive VAL payloads are **encrypted or salted** before assertion" so AEAD randomization defeats the auto-intern equality oracle. But `contentEncryption` (the self-describing format tag: "age/HPKE suite, chunking mode, padding scheme") **cannot** be encrypted — a reader must parse it *before* it has a key. It is a plaintext, auto-interned VAL, and for the OS private-tier template (§7) it is a **low-entropy, shared-across-all-files config string**. Consequences the lane does not draw:
- **O(1) confirmation:** "does any file with private-tier config ⟨X⟩ exist" is a point read (the intern oracle L9 describes, now pointed at the mandatory metadata).
- **Cross-user dedup/linkage:** every private-tier file's `contentEncryption` edge targets the *same* interned value object → an equality-linkage set of "all files using the OS default private config," across every user — enumerable by spine scan (bodies-in-state) or, if the discovery index keys on edge targets (kickoff open Q6), cheaply. This is a **corpus-enumeration vector for the entire private tier**, produced by the one VAL the private tier cannot randomize.

**Fix (inside design):** fold the format descriptor into the **AEAD-self-describing ciphertext header** (age/HPKE ciphertext is already self-describing) so no on-chain plaintext format VAL is needed at all; or, if an on-chain tag is kept for interop, give it enough per-file entropy to break dedup. State the residual either way. (This also weakens the case for F1's "already exists; keep" — see S6.)

### S5. GDPR statement over-promises: the claim graph *is* personal data, and the private tier does not confer compliance (§2.4)

§2.4 says the un-erasable claim graph "**may itself be personal data under a broad reading**," and frames the design decision as "personal-data-bearing apps **MUST default to the private tier so that erasure-by-shred is available**" — which reads as *the private tier makes you compliant*. Two honesty problems:
1. Under the mainstream EU/CJEU position, an identifiable or re-identifiable (pseudonymous) address plus timestamped activity **is** personal data — not "a broad reading." So the claim graph (author, timing, sizes, fact-of-deletion) is personal data that **no technical measure can erase**. The private tier reduces *payload* exposure; payload was never the un-erasable part. EFS is therefore structurally unable to honor Art. 17 for any identifiable author, and the private-tier default does not change that.
2. "Several EU supervisory authorities **accept** [key destruction] as satisfying Art. 17" is stated more settled than it is; crypto-shred-as-erasure is a *contested, conditional* position (hinges on genuine irrecoverability — see S2), not established acceptance.

**Fix (inside design + legal review):** sharpen to: the claim graph is (not "may be") personal data and is un-erasable by any means, so EFS cannot be made GDPR-erasure-compliant for identifiable authors; the private tier reduces payload exposure only; crypto-shred *may* satisfy erasure for the payload where the key is genuinely irrecoverable, subject to DPA acceptance. Route to the `freeze-gates §B` operator-liability legal review rather than asserting DPA acceptance in a normative doc.

### S6. WHITEOUT sentinel-target-word: "zero kernel semantics" is self-contradictory, and a cleaner all-read-layer encoding exists (§1.4a / F6 vs `codex-kinds` amendment 5)

F6/§1.4a recommends encoding self-slot whiteout as "a **single reserved sentinel target word** … legal in PIN placement slots … **zero kernel semantics** (the kernel stores it like any claim; all meaning is read-layer)." But `codex-kinds` amendment 5 freezes a **closed targetKind enumeration** ("OPAQUE forbidden in reserved rows; the legal set per row is stated in the frozen table"). A sentinel that is "legal in placement-PIN position" **must be admitted where a non-object word would otherwise be rejected** — i.e. the kernel's admission-time targetKind-legality check must recognize it. That *is* kernel surface; "a new legal targetKind class **and** zero kernel semantics" cannot both hold. The lane even concedes "the word and its targetKind-matrix legality are Etched-table surface → must be pinned at the ceremony," which contradicts the "zero kernel semantics" line two sentences earlier.

Two corrections:
- **A cleaner encoding the lane didn't consider:** mint a genesis reserved **TAGDEF object** (e.g. `/.well-known/whiteout`) and encode whiteout as an **ordinary REF-PIN targeting that existing object id**. This needs **no** change to the closed targetKind enumeration (it's a normal REF to a normal object), is genuinely all-read-layer (the resolver recognizes the well-known id and renders removed-by-A), and undelete is an ordinary supersession. Strictly less freeze surface than a new sentinel targetKind class.
- **Correct the `freeze-gates §C` classification note:** §C lists WHITEOUT as "additive-later." That is true only for the *read behavior*. Under F6 option (i) the sentinel *word/targetKind-legality* is now-or-never (you cannot add a class to a closed frozen enumeration post-freeze). Under the cleaner `/.well-known/whiteout` encoding, only the genesis object id is now-or-never (one manifest row), and even the read behavior is Durable. Say which, loudly.

### S7. Salted/blinded family: the resolver-gate reservation is missing from the lane's freeze enumeration (§4 / F4–F5 vs `deterministic-ids §5/§8`)

The lane's §4 activation design and F4/F5 pin the derivation constant (`DOMAIN_ANCHOR_SALTED`, which does exist — `deterministic-ids` line 37), the blinded-name body rule, the salted-family NFC variant, and the disclosure-record shape. Good — and the F4 point that *the record body must carry the blinded name, not plaintext* is a real, correct freeze catch. **But it omits the one thing `deterministic-ids §8` calls out as the freeze constraint:** the blinded/salted *resolver* "must be **admissible to the registry's resolver-gate set — reserved at freeze**, since unlike WHITEOUT it **writes shared frozen state**" (§8), and the registry write-gate is "extensible only by the **pre-freeze reservation** of variant-schema resolvers, e.g. blinded ANCHOR" (§5, line 137). A salted resolver that isn't pre-reserved in the gate set **cannot write the registry at all** — the activation ships dead. The lane's freeze list (§8 table) is therefore incomplete.

**Fix (inside design):** add a freeze-sensitive row: "**salted/blinded variant resolver reserved in the registry resolver-gate set** ⚠️CEREMONY — writes shared frozen state; without pre-freeze gate reservation the family cannot instantiate." Cross-reference `deterministic-ids §5` line 137 / §8 line 181.

---

## SURVIVABLE (refinements, additions, honest nits)

### V1. `contentEncryption` cardinality is left unpinned (§3.1 / F1)
F1 says "reserved VAL row on the DATA … already exists; keep," but does not pin **cardinality**. A format descriptor must be **cardinality-1** (one format per file); if left TAG (cardinality-N) a file could carry two conflicting `contentEncryption` values (format equivocation, an unwrap-ambiguity hazard). `deterministic-ids §13` places it in the virtual-anchor set (PIN-bindable), implying single — pin it explicitly as PIN/cardinality-1. Minor but freeze-adjacent.

### V2. Coerced salt disclosure is *worse than plaintext-from-the-start* — add FM-P13 salt-compulsion (§4.5)
The lane sells "reveal-later" (§4.5) purely as a feature (embargo, journalism, sealed bids). It omits the adversarial mirror: because the disclosure record (`name, salt, parentId, kindTag`) proves the path *and* unblinds all historical `admittedAt` timestamps + authorship with cryptographic force, a **compelled** salt reveal (subpoena, coercion) is *stronger evidence against the author* than plaintext ever was — self-authenticating proof of "you had this, here, at time T." The single subtree salt (§4.2) makes this all-or-nothing. Add to the failure-mode register (FM-P13 salt-compulsion) and to the L-table; note the compartmentalization mitigation (per-folder salts) already exists in §4.2 but should be recommended for coercion-sensitive content.

### V3. Per-persona `encryptionKey` is not stated (L1/L3)
L2b correctly says "randomize/rotate device bits per persona." The parallel rule for the new `encryptionKey` row is missing: **a shared encryptionKey across personas links them** (every wrap to it is cross-persona linkage). State "distinct encryptionKey per persona" alongside the device-bit guidance. One line; closes a linkage the lane's own persona-partitioning (L1) otherwise leaves open.

### V4. Cap-in-fragment: sharpen the residual vectors (§4.3)
§4.3 is basically correct — `read-lens-spec §6.5` confirms the fragment "never [reaches] servers or chain," and (attacker note) URL fragments are also **not** sent in `Referer` headers, so the referrer vector the brief asked about is a non-issue. The lane names history/sync. Two refinements: (a) call out **history-sync-to-cloud** explicitly (Chrome/Safari sync upload *full URLs incl. fragments* to the vendor — the cap lands in Google/Apple servers); (b) note that a **client-side-resolving gateway (JS)** could exfiltrate the fragment even though a *server* gateway never receives it. The existing mitigation (wrap caps to the recipient's `encryptionKey` for durable shares, raw fragments for ephemeral only) is the right call; just enumerate the two vectors under it.

### V5. PQ-hybrid wraps are correctly *not* premature — the doc's own framing is a point in its favor (§3.6)
Adjudicating the brief's "PQ-hybrid wrap format prematurity" charge: it does **not** land. Key-wrap decryption is **client-side**, so — unlike the KEL/authorship path — it needs no EVM verifier and no NIST-final *signature* scheme; ML-KEM-768 is FIPS-203-final today. The lane's "encrypted content has a PQ path today; authorship waits on the ~2030 KEL" is correct and consistent with `identity`'s PQ posture. The *only* PQ-format risk is the algoTag-registry conflation (S1), not the hybrid decision. Keep §3.6 as-is; fix S1.

### V6. FM-P1 fallthrough-resurrection is correct — confirmed against ground truth
Not an attack — a confirmation, because it's load-bearing for F6. `read-lens-spec §2.1` (line 96) and the resolver pseudocode (line 174) confirm: revoked winner → slot EMPTY → **PROVEN-ABSENT on a home read → the one state that yields fallthrough** → next lens author serves. So "delete un-masks the next author" is real, and WHITEOUT(a) is genuinely needed. The lane's core FS-semantics finding stands; only its *encoding* (S6) needs work.

---

## FREEZE-SENSITIVE ROW VERDICTS (the loud section — my adjudication of the lane's §8 table)

| Lane item | Lane's verdict | My red-team verdict |
|---|---|---|
| F1 `contentEncryption` | "Row exists; keep" | **Mostly OK** — confirmed in `deterministic-ids §13` virtual-anchor set. But pin **cardinality-1/PIN** (V1), and note S4: its mandatory-plaintext-VAL status is an intern fingerprint the private tier can't randomize. |
| **F2 `keyWrap` role/cardinality** | "Row exists; dual-role PIN+TAG; occurrence-key `H(recipientEncKeyId)`" | **BROKEN — do not Etch as written.** Contradicts `deterministic-ids §5/§13` cardinality-1 exclusion (A2); occurrence-key is a public recipient-set oracle (A1). Fix both before the ceremony or ship keyWrap TAG-only with random occurrence keys. |
| **F3 `encryptionKey` (NEW)** | "Mint row" | **Mint — agreed, genuinely needed** (HPKE needs recipient keys; G9 bars the identity key; convention fragments into silent mis-encryption). But S1: give it a **KEM/KEX algoTag family**, not identity's signature algoTags. Confirm it's an ADDRESS-parent row (home/successor family), not an expansion of the closed 5-key virtual-anchor set. |
| F4 salted family (`DOMAIN_ANCHOR_SALTED` + blinded body + NFC variant) | "Reserve fully-pinned, vectors" | **Agreed and well-caught** (the blinded-name-in-body rule is a real freeze catch). Incomplete: **add the resolver-gate reservation** (S7). |
| F5 disclosure record shape | "Reserve, pinned shape" | **Agreed.** Add the coercion caveat (V2) to the *docs*, not the shape. |
| **F6 WHITEOUT** | "(a) new sentinel targetKind class, zero kernel semantics; (b) deny convention" | **(b) correct** (deny-advisory convention, no second removal spelling — right call). **(a) self-contradictory** (a new legal targetKind class is kernel surface) and there's a **cleaner all-read-layer encoding** (REF-PIN to a genesis `/.well-known/whiteout` object) — S6. Correct the "additive-later" label too. |
| F7 `shredded` | "Convention, not row" | **Agreed** (unverifiable courtesy claim). |
| F8 `ENCRYPTED-NO-KEY` | "Durable, not freeze-bound" | **Agreed** — `read-lens-spec §2.4` flags are an orthogonal, closed-set-revisable family; a new flag batches with P3. |
| F9 padding/chunk-norm | "Convention/SDK MUST" | **Agreed.** |
| F10 PQ-hybrid MUST + wrap algoTags | "Convention; ride identity algoTags; check width" | **Partly wrong** — S1: not a *width* check, a *separate KEM registry* requirement. The MUST itself is correct and not premature (V5). |
| F11 randomize sensitive VALs | "Convention, MUST-level" | **Agreed and important** (L9) — but incomplete: it cannot cover `contentEncryption` (S4). |
| F12 anon/dummy wraps | "Convention, optional" | **Agreed** — but note A1: "anonymous" is only real if the *occurrence key* is also random, not just the blob hint. |
| F13 `claimedAt` privacy rider | "Guidance rider on A.8" | **Agreed** (`freeze-gates §A.8` is the right home). |

**Net:** F1 (nit), F3 (fix algoTag family), F4 (add resolver-gate), F6 (re-encode), F10 (separate registry) all need edits before the ceremony; **F2 is the one that must not go to freeze in its current shape.**

---

## What survives the attack (steelman, so the critic can weigh it)

- **The two theses hold.** Soft-delete-is-the-only-delete and permanent≠public are both correct and traceable; the "privacy-possible, not private-by-default at the protocol layer, but private-by-default at the OS tier" dual posture is a clean reconciliation of the mission with the private tier.
- **Genuinely sharp, correct findings the lane contributes:** FM-P1 fallthrough-resurrection (V6, confirmed); L9 intern-equality-oracle as a *global equality oracle by design* (correct and under-appreciated elsewhere); the HNDL-on-every-wrap MUST (correct, and correctly *not* premature); the forward-only law stated once with four instances; the pointer-hiding≠content-hiding restatement (grounded in `large-file-uploads` mandatory fix 3); the "Trash is public history" honesty obligation; the shred/backup opposition and Boojum-shape indirection (sound except the passphrase option, S2).
- **The deny-advisory reuse for cross-author WHITEOUT (F6b) is exactly right** — `read-lens-spec §3.4` confirms advisories are ordinary graded point-readable TAGs, and minting a *second* cross-author-removal primitive would reopen the dual-encoding hole the kinds ruling spent its budget closing. Good discipline.

The lane is strong analysis with two broken bolts in the one place bolts are permanent (the keyWrap row). Fix A1+A2 before anything else; S1–S7 are ordinary pre-freeze edits.
