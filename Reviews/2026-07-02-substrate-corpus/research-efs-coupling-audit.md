# EFS ↔ EAS coupling ledger, post-v2 — the migration-cost half of the EAS-vs-native decision

**Agent:** efs-coupling-audit · **Date:** 2026-07-02 · **Method:** codebase audit only (no web research).
**Sources read (primary):**
- Contracts: `/Users/james/Code/EFS/contracts/packages/hardhat/contracts/` — `EFSIndexer.sol` (1,336 LoC), `EdgeResolver.sol` (994), `MirrorResolver.sol` (228), `ListEntryResolver.sol` (374), `ListResolver.sol` (99), `AliasResolver.sol` (210), `base/EFSUpgradeableResolver.sol` (31), `SystemAccount.sol` (463), `EFSRouter.sol` (1,158), `EFSFileView.sol` (1,021), `ListReader.sol` (164), `EFSSortOverlay.sol` (678, deferred), `EFSBytesStore.sol` (262).
- Vendored EAS v1.3.0 source: `node_modules/@ethereum-attestation-service/eas-contracts/contracts/` — `EAS.sol` (777 LoC), `SchemaRegistry.sol` (55), `resolver/SchemaResolver.sol` (157), `eip1271/EIP1271Verifier.sol` (172), `Common.sol` (44). Total EAS machinery EFS touches: ~1,205 LoC.
- Specs: `specs/overview.md`, `specs/02-Data-Models-and-Schemas.md`, `specs/03-Onchain-Indexing-Strategy.md`.
- ADRs: 0032 (EAS as foundation), 0048 (freeze + proxy/burn), 0053 (SystemAccount); index of 0001–0063.
- v2 designs: `/Users/james/Code/EFS/planning/Designs/deterministic-ids.md`, `efs-v2-holistic-redesign.md`, `efs-v2-transition-plan.md`.

---

## 0. Executive verdict (the migration-cost half)

After v2 (deterministic EFS IDs, payload-borne references, object registry, kind tags), EFS's remaining use of EAS collapses to **five load-bearing mechanisms**: (1) the authenticated write entrypoint (`attest`/`multiAttest`, attester = msg.sender or delegation-verified signer), (2) multiAttest **batch atomicity + hook-ordering semantics** (the engine of v2's one-tx write, pinned by bytecode hash), (3) the **revocation registry** (attester-only revoke + canonical `revocationTime`), (4) the **resolver-hook no-bypass guarantee** (every write under a schema flows through EFS validation), and (5) the **attestation record store** (`_db` is EFS's only on-chain payload store — EFS indices hold UIDs, and ~25 call sites across resolvers/views join back through `eas.getAttestation`). Everything else EAS offers is already unused, rejected at write time, or duplicated on the EFS side.

A minimal native kernel replacing those five is **small in code** (~500–900 new kernel LoC; the ~2,900 LoC of EFS resolver logic ports nearly unchanged — it already does all the validation and indexing) and **large in verification** (it re-creates the audited-substrate property EAS gives for free, on the most Etched artifact in the system). The genuinely new design work is not the kernel mechanics — it is the **signature/replay domain** (hard part (e)): a kernel that recovers the author from a signature must decide what one signature is valid *for* (which chain(s), which state, how many times), a question EAS answers per-chain (EIP-712 domain binds chainId + contract; sequential nonces) in exactly the way that blocks EFS's portability goals.

**Key structural finding:** signature-based authorship changes the *entrypoint and the authentication source*, not the resolver architecture. Validation, slot supersession, indices, and events port as-is. And a weaker form of it **already exists on unmodified EAS** (`multiAttestByDelegation` — author signs, anyone submits, attester stays the signer), which post-v2 becomes actually usable because payload-borne EFS ids remove the sign-children-before-parent-UIDs blocker. What EAS delegation cannot ever give is chain-free signatures — the domain separator welds every signature to one EAS deployment on one chain.

**Sequencing finding (verdict-relevant):** the transition plan publicly commits v2 as "the last freeze before mainnet." A post-v2 substrate swap to a native kernel would break that pledge for claims (objects survive by construction — that is v2's point; claims and revocation handles do not). So EAS-vs-native is not independently timeable: **native rides the v2 ceremony or waits for a fork-level event.** v2 is, however, a one-way hedge: it reduces a future substrate exit from "lose everything" to "lose claims/revocations," because object identity stops depending on EAS.

---

## 1. What EAS actually is, verified from vendored source (v1.3.0)

Facts the ledger below relies on, with source locations:

- **Attestation struct** (`Common.sol:26–37`): `uid, schema, time (uint64), expirationTime (uint64), revocationTime (uint64), refUID, recipient (address), attester (address), revocable (bool), data (bytes)`. Stored in full in `_db[uid]` (`EAS.sol:463`). Storage layout ≈ 7 slots + data: uid | schema | packed(time, expirationTime, revocationTime) | refUID | recipient | packed(attester, revocable) | data-length + ⌈len/32⌉ content slots.
- **UID formula** (`EAS.sol:697–712`): `keccak256(abi.encodePacked(schema, recipient, attester, time, expirationTime, revocable, refUID, data, bump))` — `time = block.timestamp`, `bump` increments on collision via a grind loop (`EAS.sol:450–460`). This is the timestamp coupling v2 demotes.
- **attest/multiAttest** (`EAS.sol:96, 116`): attester = `msg.sender`. `_attest` per schema-group: loop stores **every attestation in the group into `_db` first**, checks `refUID` existence, emits `Attested` (payload-free), **then** calls the resolver once for the whole group (`_resolveAttestations`, `EAS.sol:481`). Resolver base then loops `onAttest` per item **in order** (`SchemaResolver.sol:55–89`). Any hook returning false or reverting reverts the entire transaction (`InvalidAttestations`). Groups across a `multiAttest` call are processed in request order. Consequence pinned in deterministic-ids §5: mid-batch, `eas.getAttestation(x)` "exists" for later items of the same group whose hooks haven't run — hence v2's one-existence-rule (read the EFS registry at hook time, never raw EAS existence).
- **Revocation** (`EAS.sol:485–548`): only the original attester may revoke (`AccessDenied`), only revocable attestations (`Irrevocable`), no double-revoke (`AlreadyRevoked`); sets `revocationTime`; calls resolver `onRevoke`; emits payload-free `Revoked`.
- **SchemaRegistry** (`SchemaRegistry.sol:23–42`): `schemaUID = keccak256(schemaString, resolver, revocable)`. Registration is permissionless and first-come. The resolver **address** and revocable flag are in the UID forever (basis of ADR-0048's proxy+burn and of v2 §2's rejection of schema UIDs in derivations).
- **Resolver framework** (`SchemaResolver.sol`): `onlyEAS` gate; attest/multiAttest/revoke/multiRevoke dispatchers; ETH value forwarding to payable resolvers (EFS uses none of the value path).
- **Delegation rails** (`EIP1271Verifier.sol`): `attestByDelegation` verifies an EIP-712 typed signature (`Attest(attester, schema, recipient, expirationTime, revocable, refUID, keccak(data), value, nonce, deadline)`) via OZ `SignatureChecker` (ECDSA **or** ERC-1271), with **strictly sequential per-attester nonces** (`_nonces[attester]++`) and a deadline. `multiAttestByDelegation` takes `Signature[]` parallel to `data[]` — **one signature per attestation**, "signed with increasing nonces" (`IEAS.sol:41–47`). The EIP-712 domain is `("EAS", "1.3.0", chainId, verifyingContract)` — every delegated signature is bound to one EAS deployment on one chain.
- **Unused-by-EFS surface:** ETH-value/payable resolver path, `timestamp()`/`revokeOffchain()` (off-chain attestation registries), expirationTime semantics (every EFS resolver rejects nonzero — see ledger §3.9).

---

## 2. What v1 uses today vs what v2 removes (the delta baseline)

v1 couplings **removed or demoted by v2** (from `deterministic-ids.md`):
- EAS UID as *object identity* → replaced by client-computable EFS ids (`anchorId/dataId/propertyId/listId/slotId`); UID demoted to "statement handle": registry `firstUID` + revocation handle.
- `refUID` as the *graph edge* → references move into payload fields as EFS ids; refUID becomes an optional, verified display pointer with **zero index authority** (§7), and `_indexGlobal`'s refUID-keyed lens indices re-key on decoded EFS ids.
- `recipient` as a *targeting mechanism* → retired (§3); address targets encode as `bytes32(uint160(addr))` in `targetId`. (v1 uses recipient in 4 places: ANCHOR address-container parents `EFSIndexer.sol:397–398`, edge address targets `EdgeResolver.sol:341`, LIST_ENTRY ADDR mode `ListEntryResolver.sol:244`, `_receivedAttestations` index `EFSIndexer.sol:1125`.)
- `block.timestamp` in identity → gone from identity; `time` remains only display/provenance metadata (read on-chain today only by `EFSFileView` timestamps at lines 777/902/999 and the deferred TimestampSort).
- Schema-UID-as-namespace in derivations → abstract kind tags; per-chain `schemaUID → kindTag` membership map in resolver config (§2).

v1 couplings **explicitly kept by v2** (§11): attester = user's own account on every claim; EAS as substrate (ADR-0032); revocation entirely on EAS UIDs; resolver hooks; multiAttest as the atomic write vehicle; the ~25% record-storage overhead accepted as "rent for authentication, revocation, hooks, delegation rails, and neutrality."

Everything in §3 below is therefore the **honest residual ledger** — what still binds EFS to EAS after v2 lands as specced.

---

## 3. The post-v2 coupling ledger

Format per item: what it does for EFS → native-kernel replacement (LoC scale, risk) → wasted fields/gas.

### 3.1 `attest`/`multiAttest` entrypoint + msg.sender attester binding

**What it does for EFS.** The single authenticated write path. `attestation.attester` is the identity every EFS mechanism keys on: lens resolution (ADR-0031 first-attester-wins), PIN slots `_activeBySlot[def][attester][targetSchema]` (`EdgeResolver.sol:231`), TAG buckets, `_containsAttestations`/`_childrenByAttester` visibility, LIST_ENTRY per-attester lenses, and v2's owned-kind id derivation (`dataId = H(DOMAIN_DATA, attester, salt)`). EAS guarantees this field is either msg.sender (`EAS.sol:96–101`) or a delegation-verified signer — EFS resolvers never authenticate anyone themselves; they trust the struct.
It also produces the known side-constraint: any contract that calls `eas.attest` becomes the attester. That is why SystemAccount exists (ADR-0053, deliberate) and why a naive "EFS kernel wrapper in front of EAS" was rejected ("collapses the attester", deterministic-ids §11) — under EAS, wrapping the write path in any contract destroys per-user authorship unless every user account calls EAS directly.

**Native replacement.** Trivial mechanically: the kernel *is* the entrypoint; `author = msg.sender` (EOA/AA path) is ~10 LoC. The important point: **a native kernel does not collapse the attester** — the §11 collapse argument applies only to a wrapper in front of EAS, not to a kernel that owns authentication. Adding the signature path is §3.7. Risk: low for msg.sender parity; the risk lives entirely in the signature path.

**Waste under EAS.** None for this mechanism per se; the cost is architectural — authentication being EAS's means EFS cannot extend it (e.g., accept portable signatures, session-key scoping, alternate schemes) without either the delegation rails' constraints or a new substrate.

### 3.2 multiAttest batching, atomicity, and hook ordering — the pinned behavioral dependency

**What it does for EFS.** v2's core UX/correctness win (one-tx parents-first atomic write of a full file DAG) is built *entirely* on verified-but-not-documented EAS behavior: groups processed in order; per-group store-then-resolve; per-item in-order `onAttest`; whole-tx revert on any failure (`EAS.sol:403–486`, `SchemaResolver.sol:55–89`). deterministic-ids §5 pins this **with the EAS bytecode hash** and requires a conformance test per new chain, plus the one-existence-rule to sidestep the `_db`-populated-before-hooks divergence. Batch ordering `[DATA][LIST][ANCHOR…][PROPERTY][MIRROR][PIN][TAG][LIST_ENTRY][REDIRECT]` becomes protocol.

**Native replacement.** A kernel-owned `writeBatch(records[])` loop is *simpler and stronger* than what EAS provides: atomicity is by construction (one function, one revert scope); ordering is enforceable natively (the kernel can validate parents-first instead of specifying it as client protocol); the store/validate interleaving is chooseable (validate-then-commit per item removes the existence-rule subtlety entirely). ~100–200 LoC. Risk: low. This is the one place where native is an unambiguous *simplification*: the bytecode-hash pin, the per-chain conformance suite, and the mid-batch existence footgun all evaporate.

**Waste under EAS.** Per-item resolver dispatch is an external CALL per schema group with full structs ABI-copied calldata→memory, plus each EFS hook re-reading dependencies via more external `eas.getAttestation` CALLs (§3.5). Estimated 5–15k gas per attestation of pure boundary-crossing overhead vs internal function calls in a native kernel (~50–120k per 8-record write; second-order vs the 9–10M total, but nonzero).

### 3.3 Revocation registry

**What it does for EFS.** Canonical revocation: attester-only (`EAS.sol:530 AccessDenied`), revocable-only, no-double-revoke, `revocationTime` timestamp, `onRevoke` hook. EFS builds all *consequences* itself already: `EFSIndexer._isRevoked` mirror + read filtering (ADR-0051), EdgeResolver slot clears/swap-and-pop, ListEntryResolver swap-and-pop, `indexRevocation()` sync for externally-resolved schemas (`EFSIndexer.sol:1315–1324`). v2 keeps claims' revocation on EAS UIDs untouched (§11) — the UID's *only* remaining job besides registry firstUID.
Note the asymmetry EFS already fights: EAS's revocation state and EFS's `_isRevoked` are two stores that must be synced (permissionless `indexRevocation`, revocation-state mirroring in `index()`/`indexBatch` at `EFSIndexer.sol:1250,1288`). A native kernel has one store.

**Native replacement.** `revoke(claimKey)` with `require(msg.sender == author)` (or signature-verified author), a `revoked` flag/timestamp, and the existing per-resolver active-set cleanup logic ported as-is. ~50–100 LoC kernel-side; resolver-side logic already written. Design choice that EAS currently makes for EFS: what the revocation *handle* is. Without EAS UIDs, the natural v2-native handle is the slot (for slot-bearing claims: PIN/TAG/LIST_ENTRY — "revoke my claim at slotId") plus a per-claim id for the multi-valued claims (MIRROR/REDIRECT have **no slot** by doctrine, ADR-0015/deterministic-ids §1 — a native kernel must mint *some* per-claim identifier for them; a deterministic `claimId = H(author, payloadHash, nonce?)` re-imports a uniqueness/nonce question EAS's timestamped UIDs answer silently). This is the one genuinely non-trivial design item hiding in "just replicate revocation." Risk: medium (handle design), low (mechanics).

**Waste under EAS.** `revocationTime` slot is dead weight for the 4 non-revocable object schemas (ANCHOR/DATA/PROPERTY/LIST — over half of all records in a typical write); it packs with `time` so no extra slot, but the entire *revocation authorization surface* is carried for schemas that reject revocability at the resolver (`EFSIndexer.sol:376,473,489`; `ListResolver.sol:70`).

### 3.4 Resolver-hook framework + the no-bypass guarantee

**What it does for EFS.** (a) Routing: SchemaRegistry binds schema → resolver, so **every** attest/revoke under an EFS schema passes EFS validation — the completeness of every EFS index and write-time guard rests on this. (b) The hook API shape (full `Attestation` struct in calldata). (c) `onlyEAS` authentication of hook calls. EFS resolvers are 100% of EFS's write-path semantics: canonical-payload round-trip checks, name validation, kind/type matrices, duplicate policy, slot supersession, caps. Cost side: EAS lets **anyone** register a foreign schema pointing at an EFS resolver, so four resolvers carry self-derived-UID foreign-schema guards (`ListEntryResolver.sol:214`, `AliasResolver.sol:165`, `ListResolver.sol:68`, `MirrorResolver.sol:150`) — a whole bug class (the constructor-vs-initialize self-UID brick, ADR-0048 §2) exists only because the resolver must *re-derive which schema it serves*.

**Native replacement.** The framework becomes internal dispatch: `write(kindTag, payload)` → `_validateAnchor/_validateData/...` — the current `onAttest` bodies with the struct fields as parameters. No `onlyEAS`, no foreign-schema guards, no self-UID derivation, no proxy-address-in-UID coupling (kills the ADR-0048 §2 bug class and simplifies the burn story: only the kernel address is Etched, not N proxy addresses × field strings). Port scale: ~2,900 LoC of resolver code touched mechanically, logic preserved; est. 10–20% of lines actually change (signatures, struct-field plumbing, EAS reads → kernel reads). Risk: low-medium — mechanical porting of already-reviewed validation logic, but every touched line is on the Etched surface and re-enters review.

**What is genuinely lost.** Third-party extensibility via EAS: today anyone can register a new schema with their own resolver and have EFS index it permissionlessly (`EFSIndexer.index()/indexBatch()` — `EFSIndexer.sol:1232–1298`), and EFS can browse *any* EAS attestation (router's raw schema/attestation containers, ADR-0033: `EFSRouter.sol:730,733,945,967`; LIST targetType=SCHEMA existence-checks foreign EAS attestations, `ListEntryResolver.sol:248`). A native kernel keeps EFS-native extensibility (new kindTags/claim schemas = new kernel modules — note this becomes *permissioned by the kernel's frozen resolver-gate*, vs EAS's permissionless schema registry) but loses "EFS as a lens over the whole EAS universe" unless the views optionally keep reading EAS. v2 already flags foreign-EAS lists as an open question (deterministic-ids §3 LIST row) — a native kernel forces that answer to "dropped or view-layer-only."

### 3.5 The attestation record store (`_db`) — EFS's only payload store

**What it does for EFS.** EFS contracts store **UIDs and index keys, never payloads**. Every payload read round-trips through `eas.getAttestation()`. Census of call sites (write-path + read-path):

| Contract | Sites | Purpose |
|---|---|---|
| EFSIndexer | 1235, 1278, 1317 | index()/indexBatch()/indexRevocation hydration |
| EdgeResolver | 347, 423, 469, 500, 662, 692, 917 | target schema, definition-is-anchor, revoke sym., swap-and-pop rehash, def validation, target resolution |
| MirrorResolver | 155, 182 | refUID-is-DATA, transport-is-ANCHOR |
| ListEntryResolver | 228, 248 | LIST decl hydration, SCHEMA-mode target check |
| AliasResolver | 183–189 | per-kind endpoint typing |
| EFSRouter | 733, 967, 1100, 1153 (+ registry 730, 945) | container classification, attestation JSON, mirror payload, property payload |
| EFSFileView | 671, 757, 878, 992 | entry hydration for directory/file views |
| ListReader | 37, 59, 148, 158 | list decl + entry payloads |
| SystemAccount | 344 | bootstrap idempotency |

≈ **25–30 external-CALL join points**; the read views (router/fileview/listreader) are the heaviest users. v2 §4's registry (`id → firstUID`) still terminates in `_db` for the payload bytes; §10's full-payload events give log-readers independence but "events are conveniences; the archival reconstruction path is the state-walk" — and the state-walk (§13.5 item 6) must document **EAS's storage layout** as part of the Codex. That is a deep, permanent coupling: EFS's 100-year self-describing-archive property includes "here is how to read a third-party contract's private mapping layout."

**Native replacement.** Kernel-owned record storage. Design freedom EAS denies: store only what EFS needs — e.g. registry entry `id → (author, kindTag, revokedFlag, payloadHash)` with payload bytes in events + optional SSTORE2, or full payload in storage for on-chain composability (hard part (d) decides). At minimum: 2–3 slots per record vs EAS's ~7 + data. ~150–300 LoC (store + getters). Risk: medium — this is where hard part (d) (how much do real apps need to read on-chain?) becomes a concrete schema decision; storing less than EAS does forecloses some on-chain reads forever.

**Waste under EAS (slot-level accounting, per record).** Cold-write costs, EIP-2929/3529 semantics:

| Field(s) | Slot | EFS-post-v2 use | Cost |
|---|---|---|---|
| uid | 1 | statement handle (registry firstUID, revocation) | 22.1k — needed only because `_db` is UID-keyed |
| schema | 2 | kindTag lookup (via membership map) | 22.1k — replaceable by 1-byte kind in a packed slot |
| time/expiration/revocation | 3 | time: display only; expiration: **rejected by every resolver**; revocationTime: claims only | 22.1k (time nonzero forces the slot) |
| refUID | 4 | zero-authority display pointer (v2 §7); zero in canonical v2 writes | ~2.2k when zero; 22.1k if used |
| recipient | 5 | **retired by v2 §3** | ~2.2k (zero write) |
| attester+revocable | 6 | attester: essential; revocable: redundant with schema | 22.1k |
| data len + words | 7+ | the actual payload | 22.1k + 22.1k/word |

Per record ≈ 90–115k gas in `_db` alone, of which a purpose-built kernel needs perhaps 45–70k (author+kind+payload+flag) — i.e., roughly **40–50k gas/record of pure substrate overhead**, ≈ 0.3–0.5M per 8-record v2 file write, plus the CALL/ABI overhead of §3.2 and the getAttestation round-trips of this section. Against a ~9–10M total small-file write (deterministic-ids §12), EAS record overhead is **~5–10% of write gas** — real but second-order; EFS's own indices dominate. (§11's "~25% EAS record-storage overhead" is the design doc's own figure for record *storage* specifically, consistent with the slot table above: ~7 slots stored vs ~3–4 needed.)

### 3.6 Schema registry

**What it does for EFS.** (a) Global type identity: the 9 frozen schema UIDs are EFS's wire-format discriminators — resolvers branch on `attestation.schema`; readers/subgraphs dispatch cardinality on it (ADR-0041); EFS even uses schema UIDs as *values* (folder-visibility TAG definition = DATA_SCHEMA_UID, ADR-0038; ADR-0033 schema containers). (b) Resolver binding (§3.4). (c) Registration ceremony + freeze table (ADR-0048; the whole CREATE3/proxy/burn apparatus exists to keep resolver addresses stable *because they are hashed into UIDs*).

**Native replacement.** v2 already builds the successor: spec-owned kindTag constants with printable preimages (deterministic-ids §1–2) and a per-chain schemaUID→kindTag map. In a native kernel the map's EAS side disappears; kindTags *are* the type system; "registration" is the Codex + kernel deployment. ~0 additional LoC beyond v2's own work — **v2 pays this migration cost regardless of substrate**. What disappears with EAS: the resolver-address-in-UID poison (§2 of deterministic-ids exists to neutralize it), the freeze-table UID regeneration machinery, per-chain UID parity risk (zkSync-class exclusions in ADR-0048 §3). What is lost: permissionless third-party schema creation inside the same namespace (see §3.4), and EAS-explorer schema legibility (§3.8). Risk: low.

### 3.7 Delegation rails (EIP-712/EIP-1271, nonces) — today's signature-based authorship

**What it does for EFS.** Nothing, today — EFS write UX uses direct `multiAttest` from the user's account (Tier-0), and the write-UX memory rule keeps the attester = user. But it is the standing answer to "record signed by author, submitted by anyone" on unmodified EAS: `attestByDelegation` sets `attester` to the verified signer, not the submitter — lenses and slots keep working; gasless relaying works today with zero contract changes.

**Why it under-delivers for EFS (verified from source):**
1. **Chain-bound by construction.** The EIP-712 domain = ("EAS", "1.3.0", chainId, verifyingContract). A signature is valid on exactly one EAS deployment on one chain. This is the precise failure the substrate investigation's framing names — even EAS's off-chain attestations bind chainId. No portable authorship artifact can come out of these rails.
2. **Sequential nonces** (`_nonces[attester]++`, `EIP1271Verifier.sol:114`): concurrent writes from multiple devices/sessions interleave-fail; a lost signature blocks all later ones until `increaseNonce`. Fine for occasional delegated writes, hostile as the primary write path.
3. **One signature per attestation** (`MultiDelegatedAttestationRequest.signatures[]` parallel to `data[]`): an 8-record v2 DAG = 8 signatures. Wallets can sign these in one interaction only with custom flows; standard wallets = 8 popups. (v1 had a worse blocker — refUIDs baked into signed payloads made pre-signing children impossible; **v2's payload-borne EFS ids remove that blocker**, so post-v2 the delegation path becomes mechanically usable: sign all records offline with refUID=0, anyone submits in order.)
4. **ERC-1271 support cuts both ways**: smart-account signatures verify only against a live contract on that chain — durable-identity-friendly, portability-hostile (hard part (e) exactly).

**Native replacement (the real new build).** Kernel-side `writeSigned(record, sig)` / `writeBatchSigned(records[], sig)`:
- Verification: OZ ECDSA + optional ERC-1271 via SignatureChecker, ~100–200 LoC.
- **One signature over the whole DAG** (sign the batch hash, not per-record) — strictly better than EAS delegation; ~30 LoC.
- **The replay-domain design is the hard 20%**: EFS wants *deliberate* cross-chain replay (LOCKSS model A: same attester+salt reproduces dataId on any chain — the signed artifact should be re-submittable on a new chain) while preventing *unwanted* replay (double-apply on one chain; replay onto a chain the author never intended). EAS's answer (chainId in domain + sequential nonce) prevents both, including the one EFS wants. A native kernel must invent a chain-free or chain-set-scoped domain plus idempotent application semantics (v2's duplicate policy already gives idempotency for shared kinds and REVERT for owned kinds — a signed-write kernel likely flips owned-kind duplicates to idempotent no-ops, which is exactly the §6/§9 model-A/model-C coupling flagged as a joint Phase-0 decision). Estimated design+spec effort rivals the deterministic-ids Codex itself; code is small (~50–150 LoC), the *specification and its external review* are the cost. Risk: **high** — this is hard part (e) made concrete, and mistakes are Etched.
- Revocation parity: signed revocations need the same domain design (EAS's `REVOKE_TYPEHASH` equivalent).

**Prize confirmation:** with signature-recovered authorship, gasless relaying is free (any relayer/paymaster submits; author unchanged; lens integrity holds), and the "no shared relayer" memory constraint dissolves *because the attester no longer depends on msg.sender at all*.

### 3.8 EAS-native events + ecosystem legibility

**What it does for EFS.** `Attested`/`Revoked` (payload-free) are the canonical cross-tool log; easscan-class explorers, existing indexers, and "EAS-aware tooling" legibility were an explicit ADR-0032 benefit and are cited in the holistic redesign's status-quo steelman ("EAS legibility... preserved or compatible"). EFS already routes around the events' poverty with its own full-payload event set (specs/03 §Kernel events; v2 §10's log-only-sync acceptance test), and v2 §7 keeps refUID populated *only* for explorer legibility.

**Native replacement.** Nothing to build (EFS events are already self-sufficient); what is lost is pure ecosystem surface: EFS data stops appearing in EAS explorers/dashboards; the "attestation" conceptual umbrella (and its neutrality optics) goes away; ERC-7730 clear-signing work re-targets kernel calldata instead of EAS multiAttest (the v2 signing-surface deliverable would need redoing if the entrypoint changes — another reason native must ride the same ceremony). Risk: zero technical, nonzero strategic/optics.

### 3.9 Confirmed-unused / rejected EAS surface (waste inventory)

- **`expirationTime`**: every resolver rejects nonzero at write time (EFSIndexer 380/474/490; EdgeResolver 337; MirrorResolver 164; ListEntryResolver 219; AliasResolver 173; ListResolver 71) — EFS reads filter on revocation, never expiry. The field is pure calldata+validation waste and a permanent footgun the resolvers must guard (PR #24 P2 class).
- **`recipient`**: retired by v2 (§3.5 table above); today's four uses all move to payload.
- **ETH value / payable resolver path**: unused (all EFS resolvers non-payable); every attest still runs the value bookkeeping loops in `_resolveAttestations`.
- **Off-chain timestamp/revoke registries** (`timestamp()`, `revokeOffchain()`): unused.
- **`revocable` flag per attestation**: redundant with schema-level policy; resolvers must reject the mismatch cases EAS permits (revocable=false under revocable schemas — EdgeResolver 336, MirrorResolver 163, ListEntryResolver 218, AliasResolver 172).
- **UID grind loop** (`EAS.sol:450–460`): pure legacy of timestamp-salted identity; a native kernel with deterministic ids has no grinding.
- **EAS's own `Indexer.sol`** (vendored, 357-LoC local copy at `contracts/Indexer.sol`): superseded by EFSIndexer's `_indexGlobal`; dead weight in-repo.
- Legacy stubs `FileResolver/PropertyResolver/BlobResolver/TopicResolver/SchemaNameIndex`: pre-v1 remnants, not in the freeze set.

---

## 4. The minimal native "EFS kernel" — what it must replicate

Assembled from the ledger; assumes v2's Codex, kindTags, registry, duplicate/existence/ordering rules exist (they are substrate-independent and already specced).

| Subsystem | Contents | New LoC (est.) | Ported LoC | Risk |
|---|---|---|---|---|
| Record store + object registry | `id → (author, kindTag, revoked, firstPayload ref)`; payload in events + storage per composability decision | 150–300 | registry already in v2 scope | M (hard part d decides storage depth) |
| Write entrypoint + batch | `writeBatch(records[])`, atomic, parents-first enforced natively | 100–200 | — | L (simpler than EAS's semantics; kills the bytecode pin + conformance suite) |
| Signature path | `writeBatchSigned`, ECDSA(+1271), batch-hash signing, replay domain | 200–400 | — | **H** — replay/portability domain design is hard part (e); spec cost ≫ code cost |
| Revocation | author-auth (msg.sender or sig), claim handles for slot-less claims (MIRROR/REDIRECT) | 50–150 | active-set cleanup ports | M (handle design) |
| Validation modules | current onAttest/onRevoke bodies per kind | — | ~2,900 LoC ports, 10–20% lines change | L-M (mechanical, but Etched surface re-review) |
| Indices | `_indexGlobal` post-keep/demote set, path tree, active edges, contains/childrenByAttester | — | ports as-is | L |
| Events | v2 event set §10, already ID-keyed, log-only-sync tested | — | ports as-is | L |
| Views/router re-key | replace ~25 `eas.getAttestation` joins with kernel reads | — | ~2.3k LoC of view code touched | L (redeployable surfaces) |

**Net new kernel code: ~500–900 LoC** replacing the ~1,205 LoC of EAS machinery EFS touches — i.e., the kernel is *smaller* than the substrate it replaces, because EFS uses a narrow slice of EAS and rejects much of the rest at write time. **The cost is not code; it is (1) the signature/replay domain spec + external review, (2) re-creating the audited-substrate property on a bespoke Etched artifact (invariant suite, soak, burn discipline per ADR-0048 §4 — now applied to a kernel with no battle-testing), and (3) the strategic/optics loss of §3.8.** Calibrating against the transition plan's own estimate (6–8 weeks for v2 where "the contract diff is the easy part" and verification drives the schedule): a native kernel added to the same ceremony plausibly adds 2–4 weeks of build but a *disproportionate* verification increment, because EAS's `_attest`/`_revoke`/auth core — currently outside EFS's audit scope — moves inside it.

## 5. Does signature-based authorship change the resolver architecture fundamentally?

**No — it changes the entrypoint and the authentication source; the architecture survives intact.** Specifically:

- **Unchanged:** all write-time validation semantics (canonical payload round-trips, kind-attachment matrix, duplicate policy, existence rules), slot supersession (`_activeBySlot`, swap-and-pop), every index shape, the event set, lens semantics, the registry. These consume `(author, kind, payload)` and are indifferent to whether `author` came from msg.sender or ecrecover. The v2 spec even anticipates this: derivations use `attestation.attester` as an input word, never msg.sender directly.
- **Changed at the boundary:** (1) hooks become internal functions (no onlyEAS, no foreign-schema guards, no self-UID derivation — net deletion); (2) `author` sourcing gains a second path (verify-then-recover); (3) revocation authorization mirrors the same two paths; (4) batch construction moves fully client-side with a single signature over the DAG.
- **Genuinely new, and the only deep change:** the **replay/validity domain** of a signature (what chains, what state, how many times, what expiry) becomes EFS-owned protocol surface. EAS's per-chain answer is precisely wrong for EFS's replication goals, and no off-the-shelf answer exists that is simultaneously chain-free (portability), replay-safe (no double-apply), and idempotent-under-deliberate-replication (LOCKSS). This couples directly to the open §6/§9 duplicate-policy × replication-model decision — a signed-record kernel all but forces model-A-with-idempotent-application or model-C, and makes that Phase-0 decision *substrate-deciding*, not just schema-deciding.
- **Half-step available without leaving EAS:** post-v2, `multiAttestByDelegation` gives submit-by-anyone with author-attester today, at the cost of N signatures, sequential nonces, and chain-bound domains. It is a viable gasless bridge, not a portability answer.

## 6. What EAS still buys (the other half's preview, for balance)

For the architects weighing this ledger: the residual EAS value post-v2 is (a) audited, battle-tested custody of the auth/store/revoke core (out of EFS's audit scope), (b) delegation rails good enough for gasless relaying post-v2, (c) ecosystem legibility/neutrality optics, (d) pre-deployment on most chains, (e) the permissionless schema/attestation universe EFS can index and browse (ADR-0033 containers, `index()`, foreign-EAS lists). Items (a) and (e) are the only ones a native kernel cannot cheaply reproduce; (b) is reproduced *better* (one signature, no nonce serialization); (c) is optics; (d) is moot given EFS already requires CREATE3 ceremonies per chain.

## 7. Copy/avoid lessons for EFS

**Copy:**
1. Copy EAS's store-then-hook atomic batch into any native kernel, but validate-then-commit per item — it deletes v2's "one existence rule" footnote and the mid-batch `_db` divergence footgun entirely.
2. Copy v2's kindTag/constants/Codex discipline as the schema system — it already is the native kernel's type registry; no schema-registry replacement needs designing.
3. Copy the existing resolver validation bodies verbatim into kernel modules — ~2,900 LoC of reviewed write-path semantics is the migration's biggest de-risked asset; treat it as port, not rewrite.
4. Copy EAS delegation's *shape* (typed struct, deadline, explicit attester field, SignatureChecker for ECDSA+1271) for the kernel's signed-write path — but sign the batch hash once, not per record.
5. Copy the ADR-0048 burn discipline wholesale onto the kernel (invariant suite against deployed bytecode, upgrade-with-state test, soak, ledgered burn) — the kernel inherits the resolvers' Etched status plus EAS's former responsibilities.

**Avoid:**
1. Avoid a kernel-wrapper in front of EAS (msg.sender collapse) — the §11 objection is about that architecture only; don't let it be read as an objection to a native kernel with its own auth.
2. Avoid sequential per-author nonces in any signed-write design — they serialize multi-device writers and are the wrong replay answer for a system that *wants* deliberate cross-chain replay.
3. Avoid chainId in the signature domain for object-creating writes (kills portability — EAS's exact mistake for EFS's purposes); scope replay by application-idempotency (deterministic ids + first-writer-wins registry) instead, and decide §6/§9 jointly with the substrate question.
4. Avoid carrying EAS struct fields into a native record (recipient, expirationTime, per-record revocable, UID grinding) — every resolver already rejects or ignores them; they are pure rent.
5. Avoid deciding EAS-vs-native after the v2 freeze — the one-freeze pledge makes post-v2 substrate migration a broken public commitment for claims; the ledger must be adjudicated inside the v2 window or explicitly deferred to a fork-level event.
6. Avoid assuming events can replace payload storage without deciding hard part (d) first — on-chain composability depth is the real determinant of the native record schema, and EIP-4444 history expiry is why v2 already demands state-walk reconstructibility.

## 8. Open questions this audit forces upward

1. **Claim-handle design in a native kernel** for slot-less claims (MIRROR/REDIRECT): deterministic claimId (nonce question returns) vs kernel-assigned sequence id (loses client-computability for claims — acceptable, since claims are already non-portable statements?).
2. **Does any real dapp need on-chain reads of payload bytes** (hard part d)? Determines whether the native record stores payloads or only commitments+events.
3. **Signed-write replay domain**: chain-free vs chain-set-enumerated vs origin-chain+replica-provenance — must be co-decided with §6/§9 model A/C.
4. **If EAS stays:** is post-v2 `multiAttestByDelegation` (N sigs, sequential nonces) acceptable as the gasless bridge, or does its UX force the AA/7702 route regardless — and does that change the attester-identity story the lenses depend on?
5. **View-layer EAS reads** (ADR-0033 raw containers, foreign-EAS lists): keep as optional EAS interop in redeployable views even under a native kernel, or drop for a clean severance?
