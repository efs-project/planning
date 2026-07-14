# Red-team attack report — EFS v2 Portable Authorship Envelope (THE Etched crypto surface)

**Reviewer:** dedicated adversarial review of `envelope-replay-domain.md` (the file named `envelope-crypto.md` in my charter; that name does not exist on disk — `envelope-replay-domain.md` is unambiguously the envelope/replay-domain crypto work product and is the target reviewed here).
**Method:** every "byte-exact frozen" constant recomputed independently (foundry `cast` + `ethers`); EIP-712 digest reproduced against a stock `eth_signTypedData_v4` path; the §2.3 Merkle construction + §2.4 verifier re-implemented and fuzzed for proof soundness; arch-B fatals reproduced in code and checked against the claimed closures; reservations cross-checked against `efs-substrate-decision.md` §3, arch-B, and the mission bundle.
**Bottom line:** I could not break the core cryptography. Constants, digest construction, Merkle proof soundness, N=1 degeneration, authorship non-forgeability, and the D1/D2 closures of the two arch-B fatals all survive. No FATAL. Three SERIOUS items (one is a genuine contradiction with the spec's own master invariant; one is an over-claimed "closed" label on an unclosed attack; one is a consensus-safety gap in a reserved slot). Several survivable/routed items. Details, with bytes, below.

---

## PART A — What I verified and could NOT break (the freeze-positive results)

These are load-bearing for the freeze decision: the surface most likely to hide a fatal (frozen constants + Merkle) is clean.

### A1. Every frozen constant is byte-exact correct
Recomputed independently with `cast keccak` / `ethers`:

| Constant | Spec value | Independent recompute | Verdict |
|---|---|---|---|
| `keccak("EIP712Domain(string name,string version)")` | `0xb0394844…cb8e15c3` | identical | ✅ |
| `keccak("EFS")` | `0x86de7f34…4e73e317` | identical | ✅ |
| `keccak("1")` | `0xc89efdaa…298b8bc6` | identical | ✅ |
| `DOMAIN_SEPARATOR` (abi.encode of 3 words) | `0x965d1d82…64685057` | identical | ✅ |
| `ENVELOPE_TYPEHASH` | `0x5e03a789…6891bab1` | identical | ✅ |
| `DOMAIN_RECORD_V1` | `0x77fe391d…37a1e874` | identical | ✅ |
| `DOMAIN_LEAF_V1` | `0xdbf6cb87…73a11716` | identical | ✅ |
| `DOMAIN_NODE_V1` | `0x6eb9d93f…dff8b5f8` | identical | ✅ |
| `DOMAIN_CLAIM_V1` | `0x5593b673…ea8e0881` | identical | ✅ |

No wrong-constant fatal. The seq/TID bit layout (`bit63=0 | bits62..10 = 53-bit µs | bits9..0 = clockId`) arithmetically closes: 53 µs-bits reach ~year 2255 as claimed, 2026 timestamps fit, and compose/decompose round-trips exactly (`tidTime`, `clockId` extraction verified).

### A2. The EIP-712 digest matches a stock wallet, and the manual `envelopeId` formula matches ethers
With the **2-field (no-salt) domain**, `ethers.TypedDataEncoder.hashDomain` == the spec's `DOMAIN_SEPARATOR` (`0x965d1d82…`), and `TypedDataEncoder.hash(domain,types,env)` == `keccak(0x1901 ‖ DS ‖ hashStruct)` **exactly** (`0xf3f4e1f2…11c33112` from both paths). So:
- The "a stock `eth_signTypedData_v4` signs this on every chain" claim is **true** — no custom signer needed.
- The chain-free domain is a *legitimate* EIP-712 domain (fewer fields is valid); wallets will sign it.
- The N=1 leaf-wrap rule holds: `leaf_0 ≠ recordDigest_0` (`0x7b938…` ≠ `0x4d89c…`), so a record digest can never double as a root.

### A3. Merkle proof soundness — re-implemented §2.3 build + §2.4 verifier, fuzzed
For N = 1..9, all indices:
- Every honest `(leaf, proof)` verifies. ✅
- **Wrong-index** replay of a valid leaf → root mismatch (reject). ✅
- **Trailing extra proof element** → reject (the `k == proof.length` fully-consumed rule works). ✅
- **Missing proof element** → reject. ✅
- **Inner-node-as-leaf** (present a level-1 node as a `recordDigest` with every crafted proof over N=4) → **not forgeable** (domain-separated leaf/node preimages hold). ✅
- N=7 vs N=8 over a shared prefix → distinct roots (cardinality is structural, and `count` is also signed). ✅
- Promotion root ≠ duplicate-last root at N=3 → **CVE-2012-2459 neutralized** by the promotion rule. ✅

The promotion "sibling exists" predicate `(p^1) < width` was hand-traced at N=3 and N=5 and matches the construction's odd-node promotion at every level; the fuzz confirms it for all widths through 9. **The tree is sound.**

### A4. Authorship is non-forgeable — the central security goal holds
- `author` is IN the signed struct; v1 rule `bytes32(uint256(uint160(recovered))) == author` is fail-closed. A mangled/garbage-recovery signature cannot mint authorship (it recovers *some* address, which must equal the in-struct `author`; without the victim's key you can only be yourself).
- **Cross-tree / cross-envelope replay** of Alice's record bytes under Mallory's envelope makes it *Mallory's* record — bodies are deliberately author-free; authorship is exclusively envelope-level. Owned-kind IDs (`dataId = H(author, salt)`) then derive under Mallory, so no theft is expressible.
- **Cross-scheme lifting** is blocked because `author` is committed inside the digest every scheme signs: a P-256 (0x02) signature with the attacker's key fails `keccak(qx‖qy) ∈ KEL(author)`, and the attacker cannot change `author` without a new digest.
- Nothing hashes `msg.sender` or signature bytes into any identity/authentication path (grep-confirmed; invariant 5 and sig-bytes-independence hold). Signature malleability is cosmetic (idempotence keys on `envelopeId`, never on sig bytes).

### A5. The two arch-B fatals are genuinely closed (reproduced in code)
- **TID-collision / same-(author,seq) cross-chain divergence:** arch-B (line 149) reverted on `same-(author,seq)-different-digest` → two chains that admitted *different* same-seq envelopes first can never reconcile (S₁∪S₂ inadmissible on both). D1 (both admissible, `SeqCollision` evidence, deterministic `(seq, recordDigest)` tie-break) removes the revert entirely → admission is conflict-free → convergent. **Closed.**
- **Coordinate-addressed claimId (§8.3 "bonus fatal"):** reproduced — arch-B `claimId = H(author, seq, idx)` yields the **identical** value `0xd60d0fb0…` for two *different* records both at idx 0, so a portable REVOKE is ambiguous across chains. The spec's content-addressed `H(author, seq, recordDigest)` yields **distinct** claimIds (`0x059ac74…` vs `0x9e7176a…`) → a REVOKE names exactly one content globally. **Closed, and the catch is legitimate.**
- The slot-ordering divergence from arch-B (`(seq, idx)` → `(seq, recordDigest)`, §5.6) is a correct fix: `idx` is not carriage-independent under content-addressed claims; `(seq, recordDigest)` is a strict total order over distinct claims in a slot (two claims sharing both seq and recordDigest are the same claimId, so they collapse — no ties). LWW is deterministic. ✅

---

## PART B — SERIOUS findings (must be resolved before freeze; fixes exist)

### B1 [SERIOUS] `maxEntries` cap-gated admission contradicts the spec's own master invariant 4 (convergence), and "declare it chain-local" does not close it
**Where:** §5.6 carve-out (b); §5.7 not listed as a check but implied; §3.3 LIST body `maxEntries`; inherited from substrate reservation 4 and arch-B line 193.

**The attack (bytes-level scenario):** A LIST L declares `maxEntries = 3`. Five parties each sign a `CLAIMROLE_LIST_ENTRY (listId=L, target=Tk, expiresAt=0)` claim — five valid, portable artifacts E1…E5. If fullness is an **admission gate** (the "chain-local admission state" resolution), then:
- Chain A admits E1,E2,E3 first → E4,E5 **rejected forever** on A.
- Chain B admits E3,E4,E5 first → E1,E2 **rejected forever** on B.
- LOCKSS replication tries to union: neither chain can admit the other's overflow. **The admitted sets never converge**, and this is *unrecoverable by any kernel upgrade* (it is baked into arrival order).

This is precisely the "first-seen-wins REVERTs → chains can never reconcile" fatal that D1 was written to eliminate for `seq` (§5.3 table), resurfacing for LIST caps. It **directly violates invariant 4** ("No admission check may permanently reject what another kernel could accept. Checks are either intrinsic … or delaying … Anything else forks the multiverse.") A cap-gate is neither: not intrinsic (A accepts E4, B rejects it), not delaying (B will *never* accept E4 once full). The convergence **theorem** (§5.6) is stated as normative and invariant-tested (I1), so a documented carve-out that admits arrival-order divergence is a hole in the freeze, not a footnote.

**Why the inherited blessing doesn't save it:** substrate reservation 4 says "LIST `maxEntries` declared chain-local," and arch-B calls it "the one genuinely interleaving-dependent write rule" and just documents it. But the envelope spec *elevated* convergence from a property to a **master invariant + normative theorem**. Under that stronger frame, the inherited carve-out is now a self-contradiction, not an accepted footnote. For a "credibly neutral, verify-don't-trust" archive whose entire pitch is that any chain's copy is equivalent, a normatively-frozen record kind (`LIST_ENTRY`) with order-dependent, unrecoverable divergence is unacceptable.

**Severity:** SERIOUS. Not FATAL — blast radius is limited to lists that set a finite cap, and `LIST_ENTRY` is already flagged as an open fork (may collapse into a TAG-shaped edge). But it undermines the central mission property and must be resolved before freeze.

**Minimal fix (inside the design):** make `maxEntries` a **read-time filter, not an admission gate** — exactly how expiry (§7.2) and LWW slots (§5.6) already work. Admit *all* `LIST_ENTRY` claims (each is the asserting author's signed claim); the LIST resolver returns the first `maxEntries` entries in deterministic `(seq, recordDigest)` order at read time. Then the admitted set is convergent, "fullness" is a pure function of the set, invariant 4 holds, and the behavior is *more* consistent with EFS's lens/first-attester-wins read model. Storage-DoS is not a new concern (each entry costs the submitter gas). This deletes carve-out (b) entirely and should be routed to the ID-Codex/kernel owners as a normative change, not a documentation note.

### B2 [SERIOUS] §8.1 labels truncation-replay "closed" — it is only *bounded and detectable*, and the read-grade-vocabulary defense is misapplied
**Where:** §8.1 header ("Truncation-replay — closed by visibility + monotonicity + expiry"); FM4 ("bounded + visible"); the body honestly says "this spec sells detection and bounding, not prevention."

**The attack:** Alice's true history is E1 `(seq S1)`: ASSERT PIN slot→X (claim C1); E2 `(seq S2>S1)`: REVOKE C1 + ASSERT PIN slot→Y (claim C2). Her real current state: slot = Y. Mallory relays **only E1** to chain 2 (E1 is a complete, validly-signed envelope). Chain 2 shows slot = **X**, the stale/revoked value, with **no signal** that C1 was revoked elsewhere.

**Why the stated closures do not close it:**
1. `count` (§1.3) proves *E1's own* cardinality; it says nothing about Alice withholding a *later* envelope (E2). Truncation here is of **history**, not of E1's leaves. `count` is irrelevant to this attack.
2. "attacker must withhold every envelope containing the revoke" — that is exactly **one** envelope (E2). Trivial for a hostile relayer.
3. The read-grade-vocabulary defense ("unknown ≠ absent") is **misapplied**: on chain 2 the answer is not "unknown" — it is a *positively admitted, unrevoked-on-this-chain* claim C1 → a **definite wrong value X**. The vocabulary only protects against absence being read as no-claim; it gives no protection when a chain holds positive stale data.
4. Expiry (§7.2) only bounds the damage **if Alice set `expiresAt` on C1**. With `expiresAt = 0`, C1 serves forever on chain 2.

So the only real mitigations are author-opt-in expiry, or a reader cross-checking a chain that holds E2. The section-header word **"closed" over-claims** relative to the honest body and to the carrier decision.

**Severity:** SERIOUS as a *labeling/read-contract* issue (the crypto is doing what it can; the residual is inherent and priced by James). The danger is that a downstream reader trusts the header and builds a safety-critical read path on a non-home chain believing revocation propagation is guaranteed.

**Minimal fix:** (a) relabel §8.1 "bounded and detection-only, NOT prevented" and align FM4's disposition. (b) Make it **normative** that the read layer distinguishes *home-chain-certain* from *foreign-chain-best-effort* answers — e.g., a per-read "completeness-checkable-here?" flag, or a claim-carried home-chain hint so a reader knows where the answer is authoritative. (c) Promote claim-level `expiresAt` from "recommended for dangerous data" to a **MUST-surface** on every slot read (already half-stated) and require lens resolvers to refuse to serve an unexpired-but-foreign-chain winner as authoritative for safety-critical kinds. None of this changes the wire; it hardens the read contract the crypto sits under.

### B3 [SERIOUS, reserved-layer] The WebAuthn reserved scheme (0x03) binding is under-specified for on-chain consensus — as written it is not cross-kernel deterministic
**Where:** §6.1 scheme 0x03: "signed bytes = `authenticatorData ‖ SHA256(clientDataJSON)`, where `clientDataJSON.challenge == base64url(envelopeId)`. Full assertion-envelope vectors live in the reserved KEL Codex section." The task asked explicitly whether the reserved KEL hooks create *usable* slots.

**Assessment of the reserved slots:**
- **0x01 (secp256k1):** usable now, verified (A2/A4).
- **0x02 (P-256 raw):** the slot is genuinely usable — `author` is `bytes32` (holds a digest-shaped identity word), the signature carries `(qx,qy)`, and authorization is `keccak(qx‖qy) ∈ KEL(author)` over the same `envelopeId` digest. The artifact grammar already expresses `(digest-author, P-256 sig)`; only the KEL machinery is deferred. **Reservation is real and usable.** (Nit: `keccak(qx‖qy)` is a packed concat — safe here because both operands are fixed 32-byte, but the encodePacked-ban house rule means the KEL Codex should pin `abi.encode` for consistency.)
- **0x03 (WebAuthn):** the slot is **only conditionally usable.** `clientDataJSON` is JSON — notoriously non-canonical (whitespace, key ordering, extra members, escaping), and `base64url(envelopeId)` has canonical-vs-padded ambiguity. Two kernel implementations that parse the challenge out of `clientDataJSON` differently, or compare base64url with/without padding, can **admit on kernel A and reject the identical assertion on kernel B** → a permanent divergence for that scheme, violating invariant 4 for 0x03. The one-line binding rule as stated is **not sufficient to freeze a consensus-safe slot.**

**Severity:** SERIOUS for the reserved layer, not a v1 break (0x03 is intrinsic-rejected in v1, so nothing ships broken). But "the reservation creates a usable slot" is only true for 0x03 if the missing canonicalization is done, and the doc's one-liner invites someone to treat it as done.

**Minimal fix:** the reserved KEL Codex MUST, *before 0x03 is un-reserved*, pin: (1) a canonical challenge-extraction grammar over the UTF-8 `clientDataJSON` bytes (not "parse JSON, read `.challenge`"); (2) `base64url` **without padding**, exact-string comparison; (3) explicit handling of `type`/`origin`/extra members (authorship needs only the challenge binding, so these can be ignored-but-pinned); (4) byte-exact assertion vectors. State in this doc that 0x03's binding is a *sketch pending Codex canonicalization*, so no one freezes the one-liner.

---

## PART C — SURVIVABLE / routed items

### C1 [survivable] 600 s future-bound creates a bounded LWW-inversion window under key compromise; coupling hazard with FM14
Under key theft, the attacker signs a claim at `tidTime = now + 600 s` (the max admissible). Because LWW orders by `(seq, recordDigest)` seq-first, that near-future claim **beats every honest current-time re-assertion** Alice can make, for up to 600 seconds. Alice's recovery: emit her own claim at the same `now+600 s` and grind a free field (`expiresAt`) until her `recordDigest` > the attacker's (a few tries), or wait ≤600 s. So the practical window is seconds, and it requires key compromise (game-over already). **Coupling hazard worth flagging:** FM14 (admission flicker at the boundary) will tempt a "widen the 600 s slack" fix — doing so *widens this inversion window and* the range in which a buggy client's future-dated seq wins LWW. Keep the slack tight; do not treat FM14 as a reason to grow it. Disposition: acknowledge as a bounded, key-compromise-gated inversion; add the "don't widen 600 s" note next to FM14.

### C2 [survivable] Stale sibling artifact: `vectors.js` uses the 4-field *salted* domain the envelope spec deleted
`vectors.js` (the identity/KEL vector generator in the same folder) builds `domain = { name:"EFS", version:"1", salt: keccak("efs.kernel.envelope.v1") }`. I computed its domain separator: **`0x2f735cac…f35fcc50`** — different from the frozen 2-field separator `0x965d1d82…64685057`. Any envelope vector generated from that script would be signed under the wrong domain and fail against the frozen spec. The envelope spec correctly **dropped** salt (§1.1) and I verified its 2-field separator is the stock-wallet value. Disposition: reconcile — either regenerate envelope vectors from the no-salt domain, or delete `ENVELOPE_SALT` from `vectors.js`, so nobody pins the wrong digest. (Low severity: the spec itself is self-consistent and correct; this is script hygiene across phases.)

### C3 [survivable] Invariant 4 is stated more absolutely than it holds — distinguish additive version-skew from arrival-order divergence
The §5.7 rows "unknown op/kind/reserved kind" and "datatype != STRING (v1)" are labeled "intrinsic (per kernel version)" and defended as "version skew … converges on what is admitted." But a v1 kernel rejects an INT256 PROPERTY that a v2 kernel accepts — two kernels, permanent divergence, on the face of invariant 4's wording ("what another kernel could accept"). This is **defensible** because version-skew is *monotonic/additive and recoverable*: upgrading the v1 kernel to v2 re-admits the record (it is "delaying pending kernel upgrade," and the *artifact* never becomes invalid). That is categorically different from B1's `maxEntries` divergence, which no upgrade can repair. Disposition: the spec should explicitly split invariant 4 into "additive version-skew (recoverable by upgrade — OK)" vs "arrival-order divergence (unrecoverable — banned)," which both tightens the invariant and makes B1's carve-out visibly illegal under it.

### C4 [survivable, routed] Vector 22 asserts "reject non-NFC on-wire," but on-chain NFC verification may be infeasible
§3.3 says TAGDEF `name` is "validated on-chain byte-pass; NFC client-owned," while vector 22 says "raw non-NFC bytes on-wire ⇒ reject." These are in tension: to *reject* non-NFC the kernel must *detect* non-NFC, which needs Unicode normalization tables on-chain (very expensive). If NFC is truly client-owned and unchecked, two clients submitting NFC vs decomposed forms of the same name produce **different `tagId`s** (since `tagId` hashes `keccak(name)`), fragmenting the namespace. This is the ID-Codex/name-profile owner's surface (explicitly out of the envelope-crypto scope), but flag it: either the kernel byte-pass genuinely rejects non-NFC (then specify the affordable mechanism, e.g., restrict to a codepoint subset where NFC == identity), or accept that name canonicalization is client-trust and document the homograph/fragmentation consequence. Routed to ID/name-profile owner.

### C5 [survivable] Body canonicalization (dynamic `bytes`) is correct-but-implementation-fragile — keep I10 freeze-blocking
`KIND_PROPERTY` and `CLAIMROLE_MIRROR` bodies contain dynamic `bytes`/`string`. The "strict decode + structural checks + re-encode byte-compare, reject any trailing byte" rule (§3.3) is the right defense against ABI-offset malleability (crafted offset/junk-gap encodings that decode to the same value but hash differently → claim aliasing). The approach is sound, but re-encode-compare in Solidity is a classic footgun; a kernel that skips it admits alias claims (two claimIds for one logical claim). This is implementation risk, not spec risk. Disposition: keep the I10 cross-implementation differential fuzz (Solidity kernel vs TS simulator) **freeze-blocking**, and add explicit alias-injection vectors (non-canonical dynamic-bytes bodies) to the suite.

### C6 [survivable, minor] Storage note: leaf-admission bitmap is `envelopeId`-keyed while claims are content-keyed
Because the leaf-admission bitmap is per-`envelopeId` but claims/objects register by content (`claimId`/`objectId`), the same claim re-carried by its author under a different `prev` (→ different `envelopeId`) occupies storage in multiple envelope registrations while collapsing to one claim semantically. This is **author-gated** (each re-carry needs the author's own signature over the new header) and therefore self-cost only — not an external DoS. No fix needed; noted so a reader does not mistake it for a griefing vector.

---

## PART D — Attacks I tried that FAILED (defenses confirmed)

- **Reinterpret an N=1 signature as a multi-leaf tree** (or vice versa): blocked — `count` is signed and `records.length == count` / `index < count` are enforced; a different count is a different `envelopeId`.
- **submitOne against a registered envelope with a doctored header** (skip-signature path abuse): blocked — the registry key is `envelopeId`, which commits *all* header fields including `prev`, `recordsRoot`, `count`; any change misses the registry and falls to the signature-required path. The proof + committed root is exactly as strong as the signature for record-inclusion, so skip-sig is safe.
- **Inject a fabricated record via submitOne**: blocked — the proof must verify against the committed `recordsRoot`; no valid proof exists for a non-member leaf.
- **Foreign-author REVOKE** (Mallory names Alice's `claimId`): admits but sits **inert forever** — effectiveness is `(R.author, claimId) ∈ set`; `(Mallory, id)` matches no claim authored by Alice. No cross-author revoke forgery.
- **Un-revoke by replaying the pre-revocation envelope**: blocked — the revoke G-set is monotone; re-admitting the old envelope is idempotent and the claimId stays in the revoke-set. (Re-assertion requires a *new* seq → new claimId; that is intended, not an un-revoke.)
- **REVOKE an object** (name an `objectId` as a `claimId`): inert by domain disjointness + collision-resistance (`efs.id.*` vs `efs.kernel.claim.v1`).
- **Cross-scheme signature lifting** (P-256 sig claiming a secp256k1 author): blocked — `author` is committed in the shared digest and P-256 authorization requires `keccak(qx‖qy) ∈ KEL(author)`.
- **High-s / v∈{0,1} / 64-byte compact / untagged 65-byte / schemeTag 0x00** signatures: all rejected by the §6.2 canonical rules; malleability is cosmetic because idempotence keys on `envelopeId`.
- **Dual-identifier drift** (arch-B's separate `DOMAIN_ENVELOPE` digest): eliminated (D3) — one canonical `envelopeId` is the idempotence key, `prev` target, event key, and registry key. Verified the manual formula == ethers digest, so there is exactly one identifier.

---

## Routing summary
- **Kernel owner:** implement `maxEntries` as read-time filter (B1); keep I10 differential + alias-injection vectors freeze-blocking (C5); per-slot active-claim enumeration for revoke-by-slot (spec FM15).
- **ID-Codex / name-profile owner:** NFC-vs-byte-pass reconciliation (C4); adopt declBytes-folded `listId` (spec §3.3 / FM10, also removes the §5.5 carve-out); `abi.encode` for `keccak(qx‖qy)` in KEL (B3 nit).
- **Identity/KEL owner (reserved):** pin canonical WebAuthn 0x03 challenge extraction + base64url form + vectors before un-reserving (B3).
- **This spec's editor:** relabel §8.1/FM4 from "closed" to "bounded/detection-only" and harden the read contract (B2); split invariant 4 into additive-version-skew vs arrival-order divergence (C3); add the "don't widen 600 s" note by FM14 (C1).
- **SDK owner:** reconcile `vectors.js` to the no-salt domain (C2).
