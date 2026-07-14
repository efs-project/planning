# On-chain completeness audit — LANE: Identity + Content retrieval

**Auditor key:** identity-content
**Date:** 2026-07-10
**Constraint (James, 2026-07-10):** ALL CORE FUNCTIONALITY MUST WORK ON-CHAIN; no Graph/trusted-indexer dependency for core queries; every off-chain deferral EXPLICIT + James-signed.
**Tier model:** T1 = contract-answerable (bounded gas call). T2 = on-chain STATE, client-reconstructible, no trusted party (verify-don't-trust; ACCEPTABLE for core). T3 = trusted off-chain indexer OR event-log-only/prunable (EIP-4444) → CORE MUST NOT be T3; every T3 needs explicit James sign-off.
**Builds on:** `/planning/Designs/efsv2/onchain-graph-queries.md` (backlink regression already found; not re-litigated — instantiated here for identity/content targets).

---

## CAPABILITY × TIER × VERIFICATION × RULING

### IDENTITY

#### (1) "Current signing key(s) for identity I" resolution
- **v2 doc:** identity.md §"Adopted core" (bare-EOA = key IS identity; address-shaped word forever); corpus identity.md:11, §1.2 admission predicate (author from signature recovery). read-lens-spec §2.5 ("certainly *this key*").
- **v1 code:** identity = EAS attester field; a gating contract reads `attestation.attester` (set by EAS ECDSA/delegated attest). No rotation existed in v1.
- **Tier:** **T1.** For a bare-EOA identity, "current key" = the address word itself; a contract gates by `ecrecover(envelopeDigest, sig) == identityWord` in bounded gas. No external index needed.
- **Core?** YES — "contract gating on 'signed by the real current key of I'" is the named Tier-1 must-have.
- **Regression?** NO. v2 provides it (author-from-signature). **Caveat (accepted, James-signed in identity.md §"What only James can move"):** smart-contract-only wallets (no exportable EOA key) are EXCLUDED from authorship at year-0 — **no ERC-1271, ever** (corpus identity.md:297). This is a deliberate scope cut, not a regression (v1 also keyed on a plain attester; ERC-1271 authorship was never a portable artifact). The exclusion is explicit and signed; note it as an adoption cost, not an on-chain-completeness gap.

#### (2) KEL key-event-log resolution: "was key K valid at position P" (reserved/future — the READ shape)
- **v2 doc:** corpus identity.md §2.1 (KEL event format), §2.5 (key validity `[ADD_KEY, REMOVE_KEY)` window, monotone), §4.2 (peer-deployment + frozen union-read), §4.3 read-cost table (identity.md:373 — post-KEL secp256k1: "registry head SLOAD ~2.1k + keyWindow SLOAD ~2.1k ≈ 7–9k" + KEL-prefix walk). read-lens-spec §2.4 reserves grades `UNAUTHENTICATED-POST-INCEPTION`, `KEL-UNKNOWN`, `KEL-CONTESTED`.
- **v1 code:** N/A — no key rotation in v1.
- **Tier (as designed):** **T1/T2.** The read shape is explicitly on-chain: keyWindow SLOAD + registry head SLOAD, contract-answerable per the cost table; union-read rules are read-layer/client-reconstructible from on-chain KEL state. Deliberately NOT an in-kernel registry slot (a pre-wired address is a master key — corpus identity.md:12/§4.2).
- **Core?** Reserved/future (KEL is a dated ~2030 obligation, not year-0). The READ SHAPE being on-chain-designed is correct.
- **Regression?** NO (v1 had no KEL). **Freeze-sensitive:** the reserved KEL formats/vectors + union-read rules + the reserved grade names must be frozen now (they are, in the Codex reserved sections). ACTION: ensure the reserved read-ABI reservation for `keyWindow`/registry-head reads survives the freeze so the future KEL is T1/T2, not forced into an indexer.

#### (3) act / delegation resolution
- **v2 doc:** fs-pass-synthesis:66 (W2 "authority = delegated authorship via `act` (read-side; kernel verifies nothing)"); fs-pass-freeze-reservations D2 note (`act` DISTINCT from persona — authority-laundering defense); §I list ("`act` row IS the grant"); read-lens-spec revision batch line 80 ("delegate-set completeness + authority-STALE").
- **v1 code:** No delegation primitive (EAS has delegated-attestation but not an EFS `act` graph).
- **Tier:** **SPLIT.** "Does A's specific `act` grant name B?" (point/known-claim read) = **T1/T2** (getSlot / getClaim on a known act claim). BUT **"delegate-set completeness" — enumerate ALL of A's act grants to decide 'is B *currently* authorized to act for A'** = requires enumerating an author's outbound authored claims. That is authorship-enumeration (`_sentAttestations`-equivalent), which v2 **DEMOTED to event-derived** (onchain-graph-queries §3; deterministic-ids §12 keep/demote). If only event-derived → **T3**.
- **Core?** Delegation authorization is a GATE-read primitive (a contract/gate asking "may B write as A?"). Completeness of the delegate/revocation set is load-bearing for a correct authorization answer.
- **Regression?** No v1 baseline, but a **v2 internal gap**: authority resolution needs delegate-set + authority-STALE completeness, and the enumeration substrate for it (author's outbound claims) is currently the demoted-to-event-derived surface. **Coordinate with read-lens lane** (owns "delegate-set completeness"). RULING: if `act` authorization is to be a T1/T2 core gate, the delegate-set enumeration must be backed by on-chain STATE (the spine `allClaims` filtered by author, OR an author-scoped act index), not event logs. Flag as **CORE-must-fix if `act` gates ship**; LEGITIMATELY-deferrable only if `act` stays a pure client-render hint with no gate/authorization semantics (must be James-signed either way).

#### (4) persona-link resolution: "is address B a persona of A"
- **v2 doc:** fs-pass-freeze-reservations D2 (persona-link pair: `efs.os/persona` TAG on A + `efs.os/primary` PIN on B; keyed on the primary address word; "KEL backs it additively"); identity.md open-Q §"Org-as-lens-list → persona fleets"; codex-kinds:64 (P4 persona-link expressible as client convention now, reserving keeps future KEL-enforced version additive).
- **v1 code:** No persona primitive.
- **Tier:** **FORWARD = T1/T2.** "Is B a persona of A" = read B's `efs.os/primary` PIN (cardinality-1 slot) → does it point to A? A single `getSlot` point read. "Does A claim B?" = A's `efs.os/persona` TAG on B, in A's author-scoped referencing index (`referencingByAuthor[B][A]` — KEPT on-chain per onchain-graph-queries §3) = T2. **REVERSE = "list all personas of A"** = enumerate every address whose `primary` PIN → A = general backlink on A = rides B3 (REQUIRED target-index).
- **Core?** Persona resolution underpins the promptless/fleet identity story (per MEMORY: v2 native-carrier ruling adds personas). Forward check is the load-bearing gate ("is this burner speaking for the primary?").
- **Regression?** NO (new capability). **Freeze-sensitive:** D2 reserved-key rows (`efs.os/persona`, `efs.os/primary`, `label`) must be in the genesis manifest; the reverse "all personas of A" rides the B3 backlink index (REF-target postings) — confirm persona-primary PINs route into B3.

#### (5) key-wrap / encryptionKey lookup for a recipient
- **v2 doc:** privacy.md:42 (`encryptionKey` PIN VAL, ADDRESS-parent, separate KEM/KEX algoTag registry — NOT the signing registry), :43 (`keyWrap` TAG-only), :46 (occurrence keys RANDOM by default — the `H(recipientEncKeyId)` slot key is a public O(1) recipient-confirmation oracle, deliberately avoided → recipients TRIAL-DECRYPT). fs-pass-freeze-reservations C3 (encryptionKey ADOPT), E5 (keyWrap TAG-only ADOPT).
- **v1 code:** No encryption at all.
- **Tier:**
  - **`encryptionKey` (publish recipient's public enc key) = T1/T2** — PIN VAL point read under identity I's `encryptionKey` slot (`getSlot`/`getValue`). Contract-answerable.
  - **`keyWrap` set for a file = T2 (enumeration), by design NOT O(1)-addressable.** Enumerating a file's wraps = TAG accumulation referencing the file; single-granter = `referencingByAuthor` (KEPT, T2); cross-granter = rides B3. The **"which wrap is Bob's" is intentionally off-chain trial-decrypt** (random occurrence keys) — making it addressable on-chain would be the recipient-confirmation oracle the design explicitly refuses.
- **Core?** encryptionKey resolution = core (a sender needs I's current enc key on-chain). keyWrap enumeration = core (a recipient must find the candidate wraps). "Is Bob a recipient" O(1) oracle = deliberately NOT provided.
- **Regression?** NO (new). **Correctly T3 by design:** the recipient-confirmation oracle avoidance (trial-decrypt) is a privacy feature, not an off-chain-completeness failure — **but state it as an explicit, James-signed defer** ("recipient-set membership is not on-chain-queryable by design; recipients trial-decrypt"). **Freeze-sensitive:** C3 (encryptionKey row + separate KEM registry) and E5 (keyWrap TAG-only + reserved self-occurrence-key escrow + PQ-hybrid-wrap MUST) must be reserved before freeze.

---

### CONTENT

#### (6) Mirror selection: "best mirror for DATA X" (v1 MirrorResolver/EFSRouter — is v2 Tier 1?)
- **v1 code:** **T1, on-chain, contract-answerable.** `EFSRouter._getBestMirrorURI` (EFSRouter.sol:1065) enumerates the per-attester mirror index (`indexer.getReferencingBySchemaAndAttester`, paginated on-chain, EFSRouter.sol:1088) and ranks by transport priority web3>ar>ipfs>magnet>https (EFSRouter.sol:1106–1124), lens-scoped, revoked-filtered, cap 500 (ADR-0020). The router IS a contract serving ERC-5219 `request()` (EFSRouter.sol:199). MirrorResolver validates transport-ancestry on write (MirrorResolver.sol:141–197).
- **v2 doc:** codex-kinds:28 (MIRROR → reserved-key `mirrors`, **dual role: PIN = primary mirror (O(1) point read), TAG = additional mirrors**). read-lens-spec:261 ("Mirror set = PIN (primary) ∪ active TAGs under `mirrors`; the PIN is the defined primary. **Consumers' fallback when the PIN slot is empty: enumerate TAGs (off-chain) or fail — never guess**"). No v2 on-chain selection-router contract is specified (read-lens-spec is a client-side resolver; codex-kernel evicts all enumeration to redeployable views).
- **Tier:** **SPLIT / PARTIAL REGRESSION.**
  - Primary mirror (the PIN) = **T1/T2** point read (`getSlot`). Good — covers the NFT-app "O(1) tokenURI" case.
  - **Best-of-N ranked transport selection across the additional (TAG-role) mirrors = demoted to T3** ("enumerate TAGs off-chain"). v1 did this ranked selection ON-CHAIN in a contract; v2's read spec routes the additional-mirror enumeration off-chain.
- **Core?** YES — the audit brief states "Mirror selection powering web3:// must be Tier 1 (the router is a contract) — confirm." v2 confirms ONLY the single primary PIN mirror as T1/T2; the multi-transport ranked pick is not contract-answerable as specced.
- **Regression? YES — flag loudly.** v1 EFSRouter.sol:1065 `_getBestMirrorURI` (on-chain ranked selection over ALL mirrors) → v2 read-lens-spec:261 (primary PIN on-chain; additional mirrors "enumerate off-chain or fail"). **Aggravating:** the author-scoped additional-mirror TAGs ARE in the KEPT on-chain index (`referencingByAuthor[dataId][author]`, onchain-graph-queries §3), so a redeployable view COULD rank them on-chain (T2) — the read spec's "off-chain" routing is stricter than the state actually requires. RULING: **CORE-must-fix** — either (a) restore an on-chain best-mirror view contract ranking PIN ∪ author-scoped mirror-TAGs (T1/T2, matching v1), or (b) James explicitly signs that only the single primary PIN mirror is contract-answerable and multi-transport fallback is client-only. Do NOT let this inherit T3 by silence.

#### (7) web3:// byte serving + chunk-store reads (EFSBytes)
- **v1 code:** **T1.** `EFSBytesStore` — dual interface: `chunkCount()`/`chunkAddress(i)` for router `extcodecopy` (EFSBytesStore.sol:67/71/173) + ERC-5219 `resolveMode()`/`request()` (EFSBytesStore.sol:83/112) so bare `web3://<store>` resolves in any client. Router reads chunks via `extcodecopy` (EFSRouter.sol:426), EIP-7617 pagination.
- **v2 doc:** large-file-uploads.md §mechanism (EFSBytes sibling Etched contract; Tier-0 SSTORE2 via CREATE2, contract-readable via `extcodecopy`, EIP-7617 paginated; `~store:<chunksRoot>` serves bytes directly; kernel-verified chunks against author-signed `chunksRoot`). read-lens-spec:538 (`data:` bytes in state, 3–5 point reads no oracle). codex-kernel reserves EFSBytes as second Etched artifact.
- **Tier:** **T1 (tier-0/state), STRONGER than v1** — chunks are Merkle-verified against the author-committed root at submit (v1 never cross-checked SSTORE2 bytes vs contentHash — large-file-uploads.md:42). Tier-2 calldata bytes ride history → **T3 (prunable)**, but graded honestly (`@EPHEMERAL`/`BYTES-*` grades, read-lens-spec:123) and the `contractReadable` floor (James ruling #1) forces state tier when a contract must read.
- **Core?** YES. On-chain byte serving is the archival core.
- **Regression?** NO — improved. **Note:** tier-2/calldata bytes being prunable is an explicit, James-ruled graded outcome (never masquerades as complete); acceptable. Freeze-sensitive: EFSBytes ERC-7201 layout + tier constants + chunk-Merkle vectors + SHA-256 per-chunk word (fs-pass-freeze-reservations C4).

#### (8) contentHash / size property reads
- **v1 code:** **T1/T2.** contentType/contentHash/size are PROPERTYs bound via cardinality-1 PIN, lens-scoped. `EFSRouter._getContentType` (EFSRouter.sol:1140): `resolveAnchor(dataUID,"contentType")` → `edgeResolver.getActivePinTarget(keyAnchor, attester)` O(1) point read (EFSRouter.sol:1149). Same shape for contentHash/size.
- **v2 doc:** codex-kinds §5 reserved keys; deterministic-ids:160 (virtual reserved-key anchors — `contentHash`/`size`/`contentType`/`name`/`contentEncryption` bound by recompute-and-compare from the PIN payload, read by derived point lookup); read-lens-spec P8 `getValue(propertyId)`; genesis manifest amendment 10 lists these reserved-key TAGDEF rows.
- **Tier:** **T1/T2** — `getSlot`(slotId)/`getValue`(propertyId) point reads, lens-scoped (author-scoped slot). Contract-answerable.
- **Core?** YES.
- **Regression?** NO. **But note the reverse:** "which DATA has contentHash H" (dedup/CAS reverse) — **already deprecated in v1**: `EFSFileView.getCanonicalData` returns `bytes32(0)` (EFSFileView.sol:1013, ADR-0049 removed the intrinsic `dataByContentKey` index). So content-hash-reverse is OFF-CHAIN even in v1. In v2 this is the **VAL-target backlink** — the "one optional trim" (fs-pass-freeze-reservations B3, onchain-graph-queries §5 "VAL-layout target backlinks OPTIONAL"). LEGITIMATELY-deferrable (reverse-by-value = analytics-adjacent), but must be a James-signed trim decision, not silent. Recommend: dedup-reverse stays client-side (query property index for a *trusted* contentHash claim then hardlink — the v1 upload-flow pattern), consistent with "content-address the verifiable, owner-address the unverifiable."

#### (9) "who has an active placement of DATA X" reverse
- **v1 code:** **T1, on-chain.** Placement = `PIN(definition=anchorUID, refUID=dataUID)`; the reverse "which records point at DATA X" = `getReferencingAttestations(dataX, PIN_SCHEMA_UID)` (EFSIndexer.sol:740) / `getAllReferencing` (EFSIndexer.sol:791), paginated + revoked-filtered. This answers "at which anchors / by which lenses is this DATA placed."
- **v2 doc:** onchain-graph-queries §3 — general cross-author backlink `_allReferencing` **DEMOTED to event-derived**; only `referencingByAuthor[targetId][author]` (author-scoped) KEPT. Restored to REQUIRED via B3 target-keyed index (fs-pass-freeze-reservations B3, ruled 2026-07-10).
- **Tier:** **Forward slot read = T1/T2** ("which DATA is at anchor A under author X" = `getSlot`). **Reverse (from DATA to all its placements, any author) = the demoted backlink** → **T3 unless B3 lands.**
- **Core?** YES — "where does this file live / who placed it" is a basic content-retrieval reverse, exactly the class the mission forbids being T3.
- **Regression? YES** — v1 `getReferencingAttestations`/`getAllReferencing` (EFSIndexer.sol:740/791, on-chain) → v2 demoted-to-event-derived (onchain-graph-queries §3). This is the ALREADY-FOUND backlink regression, instantiated for DATA-placement. Covered by B3-REQUIRED, but **freeze-sensitive:** placement-PIN targets (dataId as REF-target) MUST be in the B3 REF-target postings — if the B3 trim excludes placement, this core query breaks. NOT a candidate for the VAL-target optional trim.

---

## SUMMARY: FREEZE-SENSITIVE (reserve before ceremony to keep these T1/T2)
1. **B3 target-keyed backlink index (REF-target postings)** must include: DATA-placement-reverse (#9), additional-mirror TAGs (#6), persona reverse "all personas of A" (#4), keyWrap set per file (#5), REDIRECT cited-by for dedup/version. All REQUIRED, not the optional VAL trim.
2. **KEL read-ABI reservation** (#2): reserved keyWindow/registry-head read shape + union-read rules + reserved grades (`UNAUTHENTICATED-POST-INCEPTION`/`KEL-UNKNOWN`/`KEL-CONTESTED`) — keep future KEL T1/T2, not indexer-bound.
3. **encryptionKey row (C3)** + separate KEM/KEX algoTag registry; **keyWrap TAG-only (E5)** + reserved self-occurrence-key escrow + PQ-hybrid MUST.
4. **persona-link pair (D2):** `efs.os/persona` TAG + `efs.os/primary` PIN + `label`, in genesis manifest.
5. **`mirrors` dual-role reserved-key row** (PIN primary + TAG additional) + reserved contentHash/size/contentType/name/contentEncryption TAGDEF rows in genesis manifest (amendment 10).
6. **EFSBytes** ERC-7201 layout + tier constants + chunk-Merkle vectors + SHA-256 per-chunk word (C4).
7. **`act` grant row** — if authorization/gate semantics ship, its enumeration substrate must be on-chain state.

## CROSS-LANE DEPENDENCIES
- **read-lens lane:** owns "delegate-set completeness + authority-STALE" (#3 act) and the mirror-set resolution semantics (#6). The #6 best-mirror T3 demotion and the #3 delegate-set enumeration substrate are joint decisions.
- **onchain-graph-queries / backlink lane:** #4/#5/#6/#9 all ride the B3 target index; do not re-derive the backlink finding — this lane instantiates it for identity/content targets.
