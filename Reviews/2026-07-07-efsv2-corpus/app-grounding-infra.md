# EFS v2 application grounding — infrastructure apps + on-chain consumers

**Role:** Application grounding engineer (infra apps). **Date:** 2026-07-07.
**Model under test:** the settled v2 direction — native kernel, chain-free EIP-712 Merkle-signed envelopes, recovered-signer-is-author, TAG-core namespace (TAGDEF + derived tagIds), deterministic IDs per `deterministic-ids.md` §1 (identity word widened to bytes32), PIN/TAG cardinality split intact, DATA owned vs tags unowned, string-only properties, best-effort cross-chain revocation completeness + author-set EXPIRY doctrine, no HEAD/CHECKPOINT machinery, read-grade vocabulary normative, bare-EOA identity first-class with KEL reserved.
**Sources:** fable-handoff-v2-tag-core.md; 2026-07-07-carrier-decision.md; 2026-07-02-record-format-investigation.md; deterministic-ids.md; efs-substrate-decision.md; arch-B-native-kernel.md; research-efs-coupling-audit.md; contracts/specs/overview.md + 02-Data-Models-and-Schemas.md.

**Method:** for each of five apps — (1) NFT/token metadata backing, (2) DAO document store, (3) package registry, (4) web archive mirror, (5) dapp structured records — I model the exact records, the writes per operation, the reads (off-chain and the on-chain consumer's point lookups), run the Microsoft-config portability walkthrough as a first-class scenario (bytes, proofs, gas, strains), and stress yank/deprecate under best-effort revocation completeness. Each section ends with named failure modes and a verdict. §9 is the cross-app synthesis; §10 is the top-5 model changes demanded. I tried to break every one of these before writing it down; residual doubts are in §11.

---

## 0. The model as I am testing it (assumptions pinned so disagreements are checkable)

Everything below is taken from the settled direction; where a surface is not yet frozen I state the assumption and it becomes checkable.

### 0.1 Record kinds assumed

| Kind | Owned? | Revocable? | Identity | Body (assumed v2 shape) |
|---|---|---|---|---|
| TAGDEF | unowned (Schelling) | no | `tagId = keccak256(abi.encode(DOMAIN_TAGDEF, parentTagId, keccak256(canonicalNameBytes), kindTag))` | `(parentTagId, name, kindTag)` |
| DATA | owned (author+salt) | no | `dataId = keccak256(abi.encode(DOMAIN_DATA, authorWord, salt))`, salt ≥128-bit CSPRNG, **never public-input-derived** | `(salt)` |
| PROPERTY | unowned (interned) | no | `propertyId = keccak256(abi.encode(DOMAIN_PROPERTY, DATATYPE_STRING, keccak256(valueBytes)))` | `(datatype, value)` — string-only per ruling |
| LIST | owned | no | `listId = keccak256(abi.encode(DOMAIN_LIST, authorWord, salt))` | `(salt, allowsDuplicates, appendOnly, targetKind, maxEntries)` |
| PIN | claim | yes | slot: `slotId = keccak256(abi.encode(DOMAIN_SLOT, CLAIMROLE_PIN, authorWord, definitionId, targetKind))` | `(definitionId, targetId, targetKind, defParentId, defKeyHash)` |
| TAG | claim | yes | slot: `(…, CLAIMROLE_TAG, authorWord, definitionId, targetId)` | `(definitionId, targetId, targetKind, weight)` |
| LIST_ENTRY | claim | yes unless list appendOnly | slot: `(…, CLAIMROLE_LIST_ENTRY, authorWord, listId, identityKey)`; identityKey = target | `(listId, target)` |
| MIRROR | claim | yes | **no slot** (cardinality-N); revocation handle = claimId | `(dataId, transportId, uri)` |
| REDIRECT | claim | yes | no slot | `(sourceId, targetId, kind)` |
| REVOKE | op | — | names a `claimId` | `(claimId)` |

`claimId = keccak256(abi.encode(DOMAIN_CLAIM_V1, author, uint256(seq), uint256(idx)))` — chain-free, client-computable before submission (arch-B §4).

### 0.2 Envelope and read surface assumed

- Envelope: `{author, seq (TID), prev, recordsRoot, count}` + `Record[]{op, kindTag, body}`; one `eth_signTypedData_v4` over the chain-free domain `{name:"EFS", version:"1", salt:keccak256("efs.kernel.envelope.v1")}` — no chainId, no verifyingContract. Leaves commit index: `leaf_i = keccak256(abi.encode(DOMAIN_LEAF_V1, i, recordDigest_i))`.
- `submit(header, records[], sig)` full-batch atomic; `submitOne(header, record, index, proof[], sig)` single-record replication unit with O(log N) proof.
- Point reads: `getObject(id)`, `getSlot(slotId)`, `getClaim(claimId) → (author, kindTag, seq, revokedAtSeq, body)`, `authorHead(author)`, `resolvePath(tagId)`. **I assume `getClaim` returns body bytes from state** — this assumption is load-bearing and becomes demand #2.
- Slot supersession keys on `(seq, idx)` over the admitted set; first-seen-wins per `(author, seq)`; byte-identical resubmit = idempotent no-op.
- Genesis: `/transports/*`, reserved keys, Codex written under reserved author `keccak256("efs.system.v1")` from a frozen genesis blob, byte-identical on every chain.
- Lenses: ordered author list, first-attester-wins; contracts that consume EFS fix their lens statically (usually a single author or a LIST).
- NO checkpoint records, no signed HEADs, no cross-chain absence proofs (explicitly not sold). `authorHead()` is a **per-chain** index read (highest seq admitted here), not currency machinery.

### 0.3 Byte/gas baseline for the walkthroughs (order-of-magnitude, flagged unmeasured)

- EIP-712 digest: `keccak256(0x1901 ‖ domainSeparator ‖ hashStruct(Envelope))`; domainSeparator has 3 fields (name, version, salt). ecrecover ≈ 3k gas.
- Merkle proof for record *i* of N=12: ⌈log₂12⌉ = 4 siblings = 128 bytes; verify ≈ 4×(keccak + abi.encode) ≈ 1–2k gas.
- Per-record admission (store + validation + indices): **~60–300k** depending on kind and index writes; envelope overhead ~25–35k once. Small-file DAG (7–9 records, content inline ≤1KB): **~1.5–3M gas** excluding bulk bytes; with the full v1-style index set the prior estimate was ~9–10M *including* content chunk deploys. **These numbers are inherited estimates, never measured — the gas-measurement gap flagged in the handoff bites every economics claim below and I mark each dependent claim.**
- `submitOne` calldata: header 160B + record (~250–600B) + proof 128B + sig 65B ≈ 600–950B ≈ 10–15k calldata gas.

---

## 1. Canonical portability walkthrough (the Microsoft-config case, traced once in full)

Each app section then states only its deltas and where it strains. Scenario: Microsoft publishes app config on its home chain (Base); a third party (no relationship to Microsoft) copies the subtree to a fresh L3; a contract on the L3 reads it natively as provably Microsoft's.

**Step 1 — publish (home chain).** Author word `A = bytes32(uint160(0xMSFT…))` (bare EOA held cold or via TSS). SDK builds one envelope, parents-first:

```
idx op     kind        body
0   ASSERT TAGDEF      (root, "msft", KIND_GENERIC)                → tagId_msft
1   ASSERT TAGDEF      (tagId_msft, "config", KIND_GENERIC)        → tagId_cfg
2   ASSERT TAGDEF      (tagId_cfg, "app.json", KIND_DATA)          → tagId_file
3   ASSERT DATA        (salt s₁)                                   → dataId
4   ASSERT PROPERTY    (STRING, "application/json")                → propId_ct   (likely already interned; duplicate = no-op)
5   ASSERT PROPERTY    (STRING, "1220…(multihash of bytes)")       → propId_hash
6   ASSERT MIRROR      (dataId, tagId_/transports/data, "data:application/json;base64,eyJ…")
7   ASSERT PIN         (defId=H(TAGDEF,dataId,keccak("contentType"),KIND_PROPERTY), propId_ct, KIND_PROPERTY, dataId, keccak("contentType"))   [virtual reserved-key form]
8   ASSERT PIN         (defId=…"contentHash"…, propId_hash, …)
9   ASSERT PIN         (tagId_file, dataId, KIND_DATA, 0, 0)       [placement]
10  ASSERT TAG         (visibility, tagId_cfg …)                   [follow-up envelope if gas demands]
```

Header `{A, seq=TID(2026-07-07T…, dev=0x2A), prev=h(prev envelope), recordsRoot=R, count=11}`. One signature. Anyone submits; kernel recovers A, validates parents-first, commits atomically. Cost: ~1.5–3M gas (unmeasured; content is inline in record 6's body so the config bytes are state-resident).

**Step 2 — copy (third party, zero trust, zero Microsoft involvement).** Copier obtains the envelope bytes from Base calldata (`eth_getTransactionByHash`), an indexer, or a shoebox USB stick — the artifact is self-verifying either way. Two modes:
- **Full replay:** `submit(h, records, sig)` on the L3 kernel — byte-identical calldata, same IDs (derivations chain-free), same author recovered. If someone already replayed it: idempotent no-op.
- **Cherry-pick:** `submitOne(h, records[9], 9, proof₉, sig)` — but the PIN's dependencies (`tagId_file` chain, `dataId`, `propId_*`) must already be registry-instantiated on the L3 or admission REVERTs. **The registry existence rule converts "dangling ref" from a silent corruption into a forced-completeness property: you cannot land a claim whose dependencies aren't there.** The copier must replay the dependency closure (records 0–8 first, or rely on prior replays / genesis). Dangling refs across *envelopes* (a PIN in E18 targeting a DATA minted in E15) force the copier to carry E15's relevant leaves too — the SDK's export format must ship dependency closures, not lone leaves (SDK requirement, not kernel).

**Step 3 — destination contract reads natively.** On the L3:

```solidity
bytes32 tagId_file = _derive(tagId_cfg, "app.json", KIND_DATA);        // pure keccak, no state
(bytes32 pinClaim,,, ) = kernel.getSlot(_slot(CLAIMROLE_PIN, MSFT, tagId_file, KIND_DATA));
(, , , uint64 revokedAt, bytes memory pinBody) = kernel.getClaim(pinClaim);
bytes32 dataId = _decodeTarget(pinBody);
// bytes: find the data: mirror → getClaim(mirrorClaimId).body → parse URI → bytes in hand
```

3–5 SLOAD-shaped calls, ~10–30k gas, zero oracles, and the answer is *provably Microsoft's* because the L3 kernel verified A's signature at admission. This is the property everything else in this document leans on, and for records ≤ inline size **it works end-to-end with no strain**.

**Where it strains (the honest inventory — every app below hits a subset):**

- **S1. Stale snapshot.** Microsoft supersedes app.json on Base (new PIN at the same slot, higher seq). The L3 keeps serving v1 with a real signature until someone replays the newer envelope. Per-author seq travels: *if* the newer envelope is replayed, supersession applies deterministically regardless of replay order (max-(seq,idx)). But absence of a newer envelope is invisible. Grade: **unknown-currency**, must be labeled, never faked.
- **S2. Missing revoke.** Microsoft REVOKEs the placement (config had a security bug). The revoke is a signed record and replicates for free — but only if carried. An L3 holding the PIN and not the REVOKE serves revoked data as active. Cannot be closed without consensus machinery (not sold). Mitigations per app below: EXPIRY (see §5 for where that doctrine cracks), pull-latest-before-trust against a declared home, third-party advisory authors in the consumer's lens.
- **S3. Bytes that don't travel with the records.** Records travel; **SSTORE2 chunk stores do not** — they are contracts, not records. A `web3://<addr>:<originChainId>` MIRROR on the L3 points at a store that exists only on Base; the L3 router degrades to a cross-chain redirect and an *on-chain* consumer gets nothing. This kills native on-chain byte reads for anything above inline size unless the copier re-materializes the store — which is possible and cheap to standardize (CREATE2 via the deterministic-deployment proxy: same init code + same salt ⇒ same address on every chain) but is currently **convention folklore, not spec**. Demand #3.
- **S4. Expiry ambiguity.** If EXPIRY is a string property, a destination contract must know to look for it and compare — a 20-line consumer forgets and the doctrine silently fails. Demand #1.
- **S5. Genesis dependency.** MIRROR admission validates transport ancestry; the L3 must carry the genesis blob (`/transports/*`). Guaranteed by deployment ceremony — fine, but note that a *nonstandard* transport TAGDEF (`/transports/mycorp`) minted on Base must ride the closure too.

---

## 2. App 1 — NFT/token metadata backing

**Shape:** an ERC-721/1155 contract composes `tokenURI(id)` from EFS state **on its own chain**. The collection author publishes per-token metadata into EFS; the NFT contract holds one bytes32 (`collectionTagId`) and one author word, and derives everything else.

### 2.1 Records

Per token *i* (metadata JSON ≤ ~2–4KB, `data:` inline):

| # | Record | Notes |
|---|---|---|
| 1 | TAGDEF `(collectionTagId, toString(i), KIND_DATA)` | the per-token file node; unowned but placement is author-scoped so squatting is inert |
| 2 | DATA `(saltᵢ)` | saltᵢ CSPRNG — **not** derivable from i (entropy rule §1); fine, contracts never need dataId a priori (they reach it via the slot) |
| 3 | MIRROR `(dataIdᵢ, /transports/data, "data:application/json;base64,…")` | metadata bytes state-resident |
| 4 | PIN placement `(tagIdᵢ, dataIdᵢ, KIND_DATA)` | the slot the contract reads |
| 5–6 | contentHash PROPERTY + reserved-key PIN | optional but cheap integrity |

≈ 4–6 records/token. contentType amortizes (one interned PROPERTY for the whole collection).

### 2.2 Writes per operation

| Operation | Records | Signatures | Gas (unmeasured est.) |
|---|---|---|---|
| Collection init (TAGDEF root + collection node) | 2 | 1 | ~0.3M |
| Publish one token's metadata | 4–6 | rides a batch | ~0.6–1.5M incl. inline bytes |
| Publish 10k collection | ~40–60k records across ~100–400 envelopes (block-gas-bounded) | scripted key — signature count irrelevant | ~10–25B gas total ⇒ **order $10²–10⁴ on an L2 depending on gas price and DA. This is the app that makes the gas-measurement gap urgent.** |
| Reveal (blinded TAGDEFs → disclosure) | 1 disclosure claim/token | | blinded-anchor §8 machinery applies cleanly to unrevealed drops — a genuinely nice fit |
| Update metadata (mutable collections) | new DATA+MIRROR+ re-PIN same slot | 1 | supersession O(1) |

**Cheaper alternative (named trade):** one aggregate byte store (all 10k JSONs in one SSTORE2/ERC-5219 store with per-token paths) + one DATA + one MIRROR; `tokenURI` = `web3://<store>/{id}.json`. ~10⁴× fewer records, but tokens stop being individually placed/taggable/supersedable in EFS — metadata becomes one opaque file. Legitimate for static collections; the per-token model is what exercises EFS.

### 2.3 On-chain consumer flow (the point-lookup audit)

```
tokenURI(id):
  tagId   = keccak(TAGDEF_DOMAIN, collectionTagId, keccak(toString(id)), KIND_DATA)   // pure
  slotId  = keccak(SLOT_DOMAIN, PIN, authorWord, tagId, KIND_DATA)                    // pure
  pin     = getSlot(slotId)            // 1 read
  dataId  = decode(getClaim(pin).body) // 1 read
  mirror  = ???                        // ← the one non-derivable hop
  return  parse(getClaim(mirror).body) // 1 read
```

Everything is derivable-key O(1) **except the mirror hop**: MIRROR is cardinality-N with no slot, so "the mirror for this dataId from this author" is an enumeration, not a point read. v1's router scans up to 500 mirrors; that is fine for a redeployable router and *wrong* as the on-chain composability story — a tokenURI that scans is a tokenURI that gets more expensive every time anyone adds a mirror. **Two fixes, either suffices (demand #4):** (a) a kernel per-`(author, dataId)` mirror index with an O(1) paged getter and a defined first/primary position; (b) resolve the open MIRROR→reserved-property-key fork *in favor of the property form*: primary mirror = cardinality-1 PIN under reserved key `mirror` (derivable slotId ⇒ pure point read), additional mirrors = TAGs under the same key. (b) also deletes a schema, at the cost of re-homing transport-ancestry validation (the fork's known price). This app is concrete evidence for (b).

Surface verdict: **stays point-lookup-shaped** iff the mirror hop is fixed. No traversal is ever needed — `tokenURI` never walks the tree; enumeration (marketplace grids) is an off-chain indexer job as designed.

### 2.4 Portability walkthrough (delta from §1)

The L3-game case: a collection lives on Base; a game on a fresh L3 wants to render/read traits natively. Copier replays the collection's envelopes; the game deploys a reader with the same `collectionTagId` + author word; every derivation lands identically. **Works byte-for-byte for `data:`-inline metadata** — the metadata bytes live in MIRROR record bodies, which are records, which travel.

Strains: **S3 is the killer for large media.** Images in SSTORE2 stores do not travel with the envelopes. With the CREATE2-deterministic store recipe (demand #3) the copier can re-deploy every chunk store to the *same address* on the L3, and — if the mirror URI is chain-relative (`web3://<addr>` with no chainId = "this chain") — the original MIRROR record is *true on every chain where someone has done the byte deploy*, with no re-signing by the author. Without demand #3, the portable subset of this app is "metadata yes, media no," which is survivable (media via ipfs://ar:// mirrors) but forfeits the pure on-chain claim. **S1** is mild here (stale metadata renders stale — visible, low-harm). **S2**: revoked placements (e.g. takedown of a stolen-art token) not copied → L3 renders it; lens-level problem, no funds at risk in the metadata path itself.

### 2.5 Yank/deprecate semantics

Metadata "yank" = revoke the placement PIN or re-PIN to a tombstone DATA. Home chain: immediate, one SLOAD. Cross-chain: best-effort (S2) — acceptable for metadata; for *royalty/config records a marketplace contract gates on*, use kernel-legible expiry (demand #1) so a snapshot chain fails safe to "stale" rather than serving a superseded royalty config forever.

### 2.6 Named failure modes

- **F1.1 mirror-scan tokenURI** — enumeration in the hot read; third parties can grief gas by adding mirrors *only if* the read isn't author-scoped; author-scoped it's still O(author's mirror count). Fixed by demand #4.
- **F1.2 chainId-welded mirror URIs** — the one chain-bound field in an otherwise chain-free record set; breaks S3 permanently if frozen as-is. Demand #3.
- **F1.3 collection-scale write costs unmeasured** — could be 10× either way; blocks any "NFT on EFS" pitch until the gas benchmark runs.
- **F1.4 salt-rule friction (resolved, note only)** — contracts cannot derive dataIds (salts are secret-entropy); the tagId path is the designed detour and it works. Do not "fix" this by blessing content-derived salts — that reopens the confirmation-oracle hole.

### 2.7 Verdict

**Fits well; two model changes required to make it real** (#3 chain-relative mirrors + deterministic stores, #4 derivable mirror slot), one benchmark mandatory (#gas). The per-token record DAG is the right shape; blinded TAGDEFs give reveal mechanics for free; supersession gives mutable-metadata semantics with an audit trail. This is the flagship on-chain-composability app and it survives contact.

---

## 3. App 2 — DAO document store

**Shape:** governance docs (charter, proposals, policies) published permanent + hash-committed; org identity must survive officer/signer churn; a Governor-style contract binds proposals to docs and optionally verifies at execution.

### 3.1 The identity problem, faced first (this app's real content)

v2 ships **bare-EOA identity; KEL reserved, not built**. A DAO is precisely the persona with rotating signers. Options in-model, honestly graded:

| Option | Mechanics | Portability | Rotation | Verdict |
|---|---|---|---|---|
| **A. One org EOA under threshold custody (TSS/MPC)** | chain sees a single author word; officer churn = off-chain key-share resharing; multiple custodians sign concurrently, TID device bits prevent seq collisions | **pure-signature portable** (the best grade that exists) | off-chain, invisible, no protocol support needed | **the v2 answer.** Real operational burden (ceremony discipline), zero protocol gap |
| B. Safe/ERC-1271 as author | — | **does not exist**: ERC-1271 can't sign chain-free envelopes; contract sigs never travel (arch-B §2.3) | — | ruled out by the model, correctly |
| C. Officer EOAs + org LIST of authorized officer words; docs signed by officers; consumers gate on list membership | per-doc author = officer; org = curation | portable per-doc | rotation = LIST edit | **works but with a hole:** membership is *current-state*; "was officer O authorized when doc D was published?" is a historical read the kernel doesn't serve — see F2.2 |
| D. C + org countersign (org TSS key TAGs each officer doc "ratified") | authorship = officer, authority = org TAG | portable | org key still needed (→ A) | best hybrid: cheap officer UX, org key touched once per ratification |

**Grounding answer to the handoff's open question ("does org recovery UX force the KEL sooner than v2?"): no — threshold custody of one EOA (A/D) carries the DAO persona through v2 without protocol change. But the *time-scoped authorization* question (F2.2) is the first concrete consumer of the reserved KEL: position-scoped key windows are exactly "was this key valid at that position." Freeze the succession/KEL vectors with this use case in the test set.**

### 3.2 Records & writes

| Operation | Records | Notes |
|---|---|---|
| Publish doc `/dao/proposals/042.md` | TAGDEF(s) + DATA + MIRROR (data: inline for ≤4KB; SSTORE2 above) + contentType/contentHash/size reserved-key PINs (+ ≤3 interned PROPERTYs) + placement PIN ≈ **8–10 records, 1 sig** | identical to §1 trace |
| Amend | new DATA + MIRROR + props + re-PIN same slot + REDIRECT(supersededBy, old→new) ≈ 7–9 | old version stays readable in history (archive semantics: amendments never erase) |
| Ratify | 1 TAG("ratified", target=dataId) from the org word | or ride Governor state only |
| Retract | 1 REVOKE(placement claimId) | bytes remain; default reads hide it; viewer-sovereign |

### 3.3 On-chain consumer flow

Hash-commitment rides existing Governor machinery (descriptionHash) with EFS adding permanence + native verification:

- **Propose:** description carries `dataId` + contentHash; proposer contract optionally checks `getObject(dataId).author == DAO_WORD` (1 read) and snapshots the placement `claimId` from `getSlot` (1 read).
- **Execute:** re-read `getSlot(slot)`, require `claimId == snapshot` — **detects a between-propose-and-execute document switcheroo in one comparison.** This check is only possible if `getSlot` exposes the current claimId (it does in the assumed surface) and is only *cheap* to audit historically if supersession is evidence-visible (demand #4b: `getSlot` should also return a supersession counter / prior-claim link so "this slot was rewritten N times" is one read).
- Voters verify off-chain: fetch bytes via mirror, keccak vs contentHash property, check author. Zero-trust, no indexer.

Point-lookup-shaped throughout. ✔

### 3.4 Portability walkthrough (delta)

The DAO-forks-to-its-own-L3 case (governance history must come along): copier replays the org author's full envelope log — small (docs are low-volume), cheap, and **pure-signature portable if the org used option A/D** (no chain-notarized events exist in v2 at all, so the arch-B receipt-portability caveat doesn't even arise). The L3 Governor verifies everything natively.

Strains: **S1/S2 are structurally mild here** — governance docs are the rare data class where *the consumer wants the full history anyway*, so the replication norm is "full author log," not cherry-picking, and completeness-of-log is checkable against `authorHead` on the home chain while it lives. The real strain is **identity succession**: if the org key is ever burned/compromised and succeeded (EOA-signed successor claims, lens-level merge per arch-B §2.3), a destination contract keyed on the *old* author word does not follow — succession is not consumer-transparent. Named failure mode F2.3; the fix is convention (consumers read a `successor` reserved-key PIN on the org's address container — derivable slot, 1 read) — should be in the Codex, not app folklore.

### 3.5 Yank/deprecate

Retraction = REVOKE placement; permanence doctrine means the bytes never vanish (correct for governance — you cannot memory-hole a charter). Cross-chain missing-revoke (S2) means a fork chain may show a retracted policy as active; for docs the mitigation is procedural (docs carry version/effective-date in content; consumers check the home chain for anything operative). Expiry is genuinely useful here for *delegation-style* records ("X may sign for Y until T") — another consumer for kernel-legible expiry (#1).

### 3.6 Named failure modes

- **F2.1 TSS ceremony rot** — the org key's custody is off-protocol; if the ceremony lapses the identity freezes (KERI dead-author property: everything signed stays verifiable forever; nothing new can be authorized). Correct archival behavior; document it.
- **F2.2 time-scoped authorization unavailable** — option-C consumers can't verify historical officer membership O(1); kernel stores current state only. Workarounds: countersigning (D), or an appendOnly LIST of officer grants where *entries are never revoked, only end-dated by a later entry* — an app-level KEL imitation that works today but is exactly the machinery the KEL reservation should eventually subsume.
- **F2.3 succession opacity to contracts** — successor claims are lens-level; a frozen consumer contract keying the old word strands. Convention fix above.

### 3.7 Verdict

**Fits, with an operational (not protocol) burden.** The envelope model is *better* for DAOs than EAS was (portable revocation, one org signature over a whole doc batch, submit-by-anyone means officers never hold gas). The one genuine model pressure is F2.2 → keep the KEL reservation warm and freeze its vectors against this use case. No fatal finding.

---

## 4. App 3 — package registry (the app sent to break the expiry doctrine)

**Shape:** npm-shape registry: names, versions, dist-tags (`latest`), yank, deprecate, integrity hashes, tarballs. Consumers: installers (off-chain, network-capable) and occasionally contracts (e.g., a deployment pipeline gating on a package's integrity record).

### 4.1 Name ownership, faced first

npm names are exclusive; EFS tags are **unowned by ruling** (opposite duplicate policy from DATA — the flagged trap, and this app shows why the trap ruling is right). Anyone can PIN their own data at `/registry/lodash/…`; exclusivity cannot and should not come from the namespace. It comes from the lens:

- **Scoped form (protocol-native, zero curation):** package identity = `(publisherAuthorWord, name)`. Installers resolve with lens `[publisher]`. This is `@alice/foo` and it needs nothing.
- **Unscoped form (npm-like):** a registry curator maintains the name→publisher mapping — either a LIST of `(nameHash → publisherWord)` grant entries or curator PINs at name nodes — and installers use lens `[curator]` with first-attester-wins doing the rest. Squatting a tagId is inert: the squatter's PIN is invisible in every lens that doesn't include them. **Lenses carry the entire trust load and it holds.** (The registry-operator-as-oligopoly concern is the known lens-monoculture unknown; nothing new here.)

### 4.2 Records & writes per operation

Layout: `/registry/<pkg>` (KIND_GENERIC) with version file nodes `/registry/<pkg>/1.2.3` (KIND_DATA); per-package an **appendOnly LIST** as the publisher's version ledger; `latest` dist-tag = PIN at `/registry/<pkg>/latest` (KIND_DATA... a normal supersedable slot — dist-tags are *supposed* to move).

| Operation | Records | Count |
|---|---|---|
| First publish of pkg | TAGDEF pkg node + LIST decl (version ledger) + version publish (below) | +2 |
| Publish version 1.2.3 | TAGDEF version node (1) + DATA (1) + MIRROR ipfs/ar for tarball (1–2) + integrity contentHash PIN+PROPERTY (2) + placement PIN at version node (1) + LIST_ENTRY into appendOnly ledger, target=dataId (1) + re-PIN `latest` (1) | **8–9, 1 sig** |
| Yank 1.2.3 | REVOKE(placement PIN claimId) + TAG("yanked", target=versionTagId, weight=advisory code) | 1–2 |
| Deprecate ("use foo@2") | reserved-key PIN "deprecated" + interned PROPERTY(message) on version node | 2–3 |
| Un-yank | re-assert placement PIN (same slot, higher seq) | 1 — revocation is monotone per-claim but the *slot* is re-fillable; cargo-style un-yank works |
| Transfer package | curator re-grants name→newPublisher (curated form); or publisher PINs a `successor` key | 1–2 |

**Version immutability — the left-pad problem.** npm learned versions must be immutable; the PIN slot at a version node is supersedable by construction, so a compromised publisher key *can* re-point `1.2.3` at different bytes. Three layered answers, all needed:
1. **Detectability:** demand #4b — `getSlot` exposes supersession evidence; an installer (or watchdog) sees "version slot rewritten" in one read and screams. Cheap, kernel-level, catches the attack after one write.
2. **The appendOnly LIST ledger:** entries can never be revoked (declaration-gated — **this app is the concrete evidence for keeping the LIST declaration node in the tag-core simplification**: fold LIST_ENTRY into a plain cardinality-N edge and appendOnly enforcement dies with the declaration). First entry for a version's dataId is permanent; a rewrite creates a *second* entry, and divergence between ledger-first and slot-current is machine-detectable equivocation-grade evidence.
3. **Lockfiles:** after first resolution, installers pin `dataId`+contentHash and never re-resolve — the DATA and its integrity property are non-revocable objects; rewrites can't touch installed dependents. (Identical to npm's integrity field; EFS makes it verifiable rather than trusted.)

One wrinkle: the v2 LIST_ENTRY identityKey = `target` in all modes, so the ledger is keyed by dataId, not by version string — you cannot ask the LIST "what is 1.2.3." That's fine (the version-keyed read is the PIN slot); the LIST is the audit ledger, not the resolver. If a version-keyed *immutable* read is wanted, that's a `!allowsDuplicates` list keyed by version-hash — **currently impossible** (identityKey ruling). Noted as a minor grounding datum for the LIST open questions: an app wants an author-chosen identityKey mode back.

### 4.3 Reads

- **Installer resolve `foo@^1.2.0`:** enumerate versions — off-chain (indexer/log-derived; semver range logic is client-side anyway, string-only properties don't hurt because semver ordering was never numeric). Then per chosen version: derive version tagId → `getSlot` (placement) → dataId → integrity slot → mirror → fetch tarball → verify multihash. All point reads after enumeration; the enumeration is the same "list the directory" read every registry protocol has and belongs off-chain.
- **Contract consumer** (deploy pipeline gating "is foo@1.2.3's integrity X, unyanked, from publisher P"): derive slotId → `getSlot` → `getClaim` (revokedAt check is free in the same read) → integrity slot → compare. 3–4 point reads. ✔ point-lookup-shaped.

### 4.4 Portability walkthrough (delta)

Registry mirrored to a fresh L3 (e.g., an appchain wants local package resolution): copier replays publisher envelopes (+ curator's name-grant envelopes for the unscoped form). Resolution works natively; integrity verification works from bytes alone. Strains, in order of severity:

- **S2 is the whole ballgame: the missing yank.** foo@1.2.3 is yanked on the home chain for an RCE; the L3 mirror never receives the REVOKE; installers pointed at the L3 serve the vulnerable version *as active, with the publisher's real signature*. This is not an edge case for a registry — yank latency is the security-relevant metric.
- **S1:** the L3 shows `latest`=1.2.3 after home has 1.3.0 — annoying, not dangerous (stale mirrors are registry-normal).
- **S3:** tarballs are ipfs://ar:// mirrors — chain-free URIs, no strain (bulk bytes were never on-chain here).

### 4.5 Does the expiry doctrine actually work here? (the honest answer: **not as stated**)

The doctrine as ruled: "apps use author-set EXPIRY for safety-critical data." Applied naively — expiry on version placements — it fails on three counts:

1. **It contradicts the archive.** Packages must resolve for decades (the 100-year mission *is* the pitch to this persona). An expiring placement makes packages rot by default.
2. **It creates a liveness obligation.** Refresh-before-expiry is a heartbeat; a dead or merely bored publisher's packages vanish from default reads everywhere — including the *home* chain, where currency was supposed to be certain. That is Ceramic-grade anchor-rot re-imported by doctrine, and it punishes exactly the abandoned-but-fine packages an archive exists to keep.
3. **It's a category error.** The danger was never "this placement might be old"; it's "my knowledge of the *revocation set* might be incomplete." Expiring the *data* to bound staleness of the *absence-of-revoke* is a sledgehammer proxy: it makes true data fail closed instead of making unknown currency fail labeled.

**What actually works for a registry (and generalizes):**

- **(a) Expiry redefined as a freshness TTL — "stale, not dead" (demand #1).** `expiresAt` on a claim means: *past T, this claim may not be served as CURRENT without revalidation; it is never invalid as a record.* Default reads return it flagged stale (or exclude it under a `?current` view) rather than tombstoning it. Refresh = idempotent re-assert (same slot, higher seq) — one relayable signature, and crucially the refresh is *optional*: an unrefreshed claim degrades to as-of semantics, it does not die. On the home chain, live revocation state makes the TTL redundant — expiry only ever bites snapshot readers, which is exactly the intended target.
- **(b) Declared home + pull-latest-before-trust (demand #5).** A reserved-key PIN on the publisher (and/or registry root): `home = <chainId (+ optional RPC hint)>`, plus `authorHead(author)` in the frozen read surface. An installer doing anything yank-sensitive on a non-home chain checks the home chain's `authorHead` + the specific slots (installers are off-chain and network-capable — this is one RPC call, and it is the *same* trust model as `npm audit` phoning home). When home is dead: degrade honestly to "as-of latest replicated seq," labeled. This is an **advisory signed claim + a per-chain view**, not HEAD/CHECKPOINT consensus machinery — it stays inside the not-sold line, and it must be Codex-normative rather than folklore or every consumer reinvents it wrong.
- **(c) Third-party advisories in the consumer's lens (the decentralized yank — no model change, just doctrine).** The real-world endgame of yank is not publisher revocation, it's OSV/RustSec/GitHub-advisories: *security teams* publish "foo@1.2.3 is vulnerable" and installers consult them. EFS supports this natively today: an advisory author TAGs `(definition=/advisories/osv, target=versionTagId or dataId, weight=severity)`; installers put advisory authors in their lens and check the (small, hot, easily-fully-replicated) advisory feed fresh. **Yank completeness stops depending on the publisher's revoke propagating at all** — the advisory set is an independent, positively-asserted (monotone! presence-shaped, so replication-friendly) signal. This is the strongest answer of the three and it falls out of existing primitives; it should be written into the Codex read-path chapter as the registry pattern.

With (a)+(b)+(c): home chain certain; mirror chains bounded-stale with machine-legible bounds; the vulnerable-version window on a lazy mirror equals today's registry-mirror reality, except verifiable and with a decentralized advisory channel mirrors can't censor unnoticed. **That's honest and shippable. The doctrine as currently worded — bare "use expiry" — is not; this is the app that breaks the wording, not the architecture.**

### 4.6 Named failure modes

- **F3.1 missing-revoke window on replicas** (S2) — bounded by (a)/(b)/(c), never closed; must be labeled in read-grade vocabulary. Anyone selling "yank works cross-chain" unqualified is lying.
- **F3.2 version-slot rewrite by compromised key** — detectability chain in §4.2; residual: consumers who check nothing (lockfile-less cold installs) get npm-2016-grade exposure for the window before watchdogs scream.
- **F3.3 expiry-as-death heartbeat rot** — the doctrine failure dissected above; fixed only by redefining expiry semantics in the kernel/Codex (demand #1).
- **F3.4 curator capture (unscoped names)** — the name authority is a lens choice; forkable by construction (installers switch curators), which is the right shape, but the default-lens monoculture concern lands squarely here.
- **F3.5 identityKey inflexibility** — no author-chosen list key mode ⇒ no version-keyed immutable ledger; minor, workaround exists.

### 4.7 Verdict

**Fits — and it's the most demanding fit of the five.** Publish/resolve/integrity are clean (objects/claims split matches cargo-yank semantics almost line-for-line: revoked placement disappears from *new* resolution, bytes + integrity survive for lockfiles). The registry is the app that: (1) **breaks the expiry doctrine as worded** and forces the stale-not-dead redefinition; (2) proves the appendOnly LIST declaration node must survive tag-core simplification; (3) makes home-declaration + advisory-lens patterns Codex-mandatory. With demands #1, #4b, #5 it works honestly. Without them it works dishonestly, which is worse than not working.

---

## 5. App 4 — web archive mirror

**Shape:** bulk import of an existing site (dying blog, agency site, a Wikipedia slice) by an archivist who is **not the origin author**; provenance must be honest; later readers verify what the archivist committed to.

### 5.1 Records & provenance model

Per archived URL `https://example.com/a/b/page.html`:

| # | Record | Notes |
|---|---|---|
| 1–k | TAGDEFs for uncreated path segments `/archive/example.com/a/b/` | amortized: shared across the site; a site's unique-directory count, not its URL count. Percent-encoding profile handles query strings (`?`→`%3F`), unicode paths (NFC), byte-exact case — URL space maps into the canonical-name profile with no residue found |
| k+1 | DATA (saltᵤ) | archivist-owned identity |
| k+2 | MIRROR (ipfs://…WARC-chunk or ar://; `data:` for small text) | bulk bytes off-chain by economics |
| k+3–8 | reserved-key PINs: contentType, contentHash, size + **provenance keys**: `source-url`, `retrieved-at`, `warc-record-id` (non-reserved key TAGDEFs, amortized) | retrieved-at is a **self-asserted string** — see F4.2 |
| k+9 | placement PIN | |

≈ 7–10 records/URL + amortized TAGDEFs. A 10k-URL site ≈ 80–100k records, hundreds of envelopes, scripted key (signature count irrelevant), **gas order 5–30B ⇒ $10²–10⁴ on an L2 (unmeasured — this app and app 1 jointly force the benchmark), plus off-chain storage for bytes.** The bulk-bytes/endowment gap (substrate-decision §6.2) is this app's real ceiling and is a known, separately-commissioned workstream — I do not re-litigate it; I note that **every mirror URI here is chain-free, so S3 never bites: the archive's *records* are fully portable even though its *bytes* were never on-chain.**

**Provenance honesty (read-grade vocabulary in action):** nothing here is "example.com's data" — the origin never signed. It is *the archivist's claim* about example.com, anchored by contentHash. Any UI or API that renders it as origin-authentic is lying; the correct grade is "attested by <archivist> as retrieved from <source-url> at <retrieved-at>." Multiple independent archivists importing the same site converge on the same tagIds (Schelling) with per-author placements — cross-archivist contentHash agreement is the emergent verification signal, and lenses compose it (`?lenses=archive.org,webrecorder,…` first-match). This is genuinely elegant: **LOCKSS across archivists falls out of unowned tags + owned DATA with zero new machinery.**

### 5.2 Reads & on-chain consumers

Reads are the standard path walk + lens resolution; no contract consumer in the primary flow (archives are read by humans/indexers). Secondary on-chain consumer: a bounty/attestation-market contract paying archivists for coverage — gates on `getSlot(archivist, urlTagId)` + contentHash agreement with a second archivist (two point reads per check). Point-lookup-shaped. ✔

### 5.3 Portability walkthrough (delta)

The canonical LOCKSS case — and the app the mission was practically written for. Archive subtree → fresh L3: replay archivist envelopes; mirrors are chain-free URIs; provenance properties travel; the archivist's authorship verifies from bytes alone; a dead archivist's corpus is carried by strangers forever (the signature-verified permissionless carriage this design bought). **No strain unique to this app**; S1/S2 are near-irrelevant (archives are append-mostly; revocation is rare and non-security-critical — a retracted snapshot missing on a replica is a curation lag, not a vulnerability).

Dedup across re-crawls: same bytes → distinct DATA unless the client hardlinks. `propertyId` is derivable from the hash value (interned), so "who binds this contentHash" is a reverse lookup — served by the kept `_referencingByAttester`-class index / events, off-chain. Fine.

### 5.4 Yank/deprecate

Takedown-shaped pressure (copyright, privacy) hits the *operator/mirror* layer, not the protocol (ruled: neutrality + operator-doctrine note). Archivist-side retraction = REVOKE placement; bytes-on-IPFS lifecycle is off-protocol. Expiry has no role here — and that's consistent with the §4.5 redefinition: an archive is the persona for whom expiry-as-death would have been catastrophic-by-default.

### 5.5 Named failure modes

- **F4.1 economics wall** — TAGDEF-per-segment + per-URL DAGs price a large site in the $10³–10⁴ range on today's guesses; if the gas benchmark comes back bad, this app needs a batch-optimized write shape (e.g., dirnode-style aggregate placement records) — flag for the gas workstream, not a semantics change.
- **F4.2 self-asserted `retrieved-at`** — temporal provenance is a string claim; an archivist can backdate. Anchoring receipts (envelope's block inclusion) bound it above ("existed before block B") but the *claimed* crawl time is trust-the-archivist. Honest labeling required; a countersigning-witness convention is future work (temporal-provenance convention, holistic §3.3 — already tracked).
- **F4.3 string-only properties, mild sting** — `size` as decimal string is fine; range queries ("files > 1MB") are off-chain regardless. No app-breaking numeric consumer found here either — across all five apps the only on-chain numeric consumers were TAG weight (already int256) — **the string-only ruling survives this grounding pass.**

### 5.6 Verdict

**Best-fit app of the five.** The model's soul (permissionless carriage, honest provenance grades, Schelling names, lens-composed multi-archivist truth) is exactly this app. Its problems are priced-in economics (bulk bytes, gas) — known, commissioned, not semantic. No model change demanded beyond the shared gas benchmark.

---

## 6. App 5 — dapp structured records (reviews / forum posts a contract gates on)

**Shape:** typed small records written by many strangers; a contract gates value on them (marketplace pays referral if a review exists from a whitelisted reviewer; a game admits players endorsed by N guild officers; Coinbase-Verifications-class checks).

### 6.1 Records & writes

- Review: `TAG(definition=/apps/market/review, target=subjectId, weight=rating)` + optional body: reserved-key PIN `review-body` → interned PROPERTY (short) or DATA+MIRROR (long). **2–5 records, 1 sig, relayable** — the author never holds gas (community relayer per §5 mission ruling; the sub-cent stranger-write economics are the ruled-out free tier's ghost: writes are cheap on an L2 but not free, and the relayer-abuse economics remain the known untested load-bearing unknown; nothing in this app changes that assessment, it just depends on it).
- Forum post: DATA + MIRROR(data:) + placement PIN under `/forum/<topic>/` + reply threading via reserved-key PIN `in-reply-to` (value = parent's claimId or dataId as string / REF-datatype if typed literals ship). Enumerationy reads (thread listing) are off-chain indexer surface, as designed.

### 6.2 On-chain consumer flow — the sybil audit

The TAG slot key is `(author, definitionId, targetId)` ⇒ **"has author A an active review-TAG on subject S" is a pure point read**: derive slotId offline shape, `getSlot` → claimId, weight from `getClaim`. So:

```
gate: for (officer in APPROVED_LIST[0..k]) if getSlot(slot(officer, ENDORSE_DEF, player)) exists → count++
```

O(k) point reads against a *closed author set* — and it must be a closed set: gating on "any author says X" is free-mint sybil candy. The approved set is either a contract array or an EFS LIST (curated, `countOf`-style O(1) membership via the LIST_ENTRY slot: `getSlot(slot(curator, listId, memberWord))`). First-attester-wins never enters contract gating (contracts don't run lens fallback; they enumerate a fixed set) — **the lens model and the gating model are disjoint by construction, which is correct and worth stating in the Codex's composability chapter so nobody builds a lens-walking contract.**

Aggregation ("average rating," "top posts") is off-chain indexer work; a contract wanting counts maintains its own counter by *being* the submitter path (app contract wraps `submit` — legal, since msg.sender is ignored for auth, the author is still the signer; the wrapper just counts). Nice consequence of signature-auth: **app contracts can add app-state side-effects to EFS writes without stealing authorship** — impossible under EAS (attester collapse), free here. This is a real, new composability pattern the model enables; name it in the Codex (the `EFSGate`/`EFSWrapper` reference pair).

### 6.3 Portability walkthrough (delta)

Reviews written on cheap L2; game logic on an L3 wants them: copy the relevant authors' envelopes (cherry-pick per-author closures — small), contract reads natively. Strains: **S2 in its sharpest monetary form** — a *retracted* endorsement (officer revoked their TAG after a falling-out / compromise) missing on the L3 lets the player claim admission with a real signature on a dead claim. For money-gating, this is exactly the kernel-legible-expiry use case: endorsements carry `expiresAt` (e.g., 90 days); a snapshot chain fails safe to stale after the TTL; refresh is one relayed re-assert. **Demand #1 is load-bearing for this app, and here — unlike the registry — expiry-as-TTL is natural because the claims are inherently freshness-shaped (endorsements, not archives).** The doctrine survives when the data is currency-like; it broke in §4.5 when the data was archive-like; the redefinition (#1) serves both.

### 6.4 Yank/deprecate

Author retracts review: REVOKE — home chain instant; replicas best-effort (S2, bounded by expiry). Subject *disputes* review: never deletion (neutrality) — counter-speech (subject's own TAG) + lens curation + WHITEOUT-class masking, all existing doctrine. Moderation = lens membership, not protocol. Holds.

### 6.5 Named failure modes

- **F5.1 open-set gating** — a contract gating on unscoped authors is sybil-owned on day one; must be documented as an anti-pattern with the closed-set/LIST idiom beside it.
- **F5.2 stale-endorsement monetary replay** (S2) — bounded by kernel expiry (#1); without #1 it's a silent-fail string-property check (S4) that some consumer will botch.
- **F5.3 relayer economics** — inherited unknown (substrate §9); this app is its primary tenant.

### 6.6 Verdict

**Fits; cheapest fit of the five.** One model change load-bearing (#1), one doctrine write-up owed (closed-set gating idiom + the wrapper-contract pattern). Confirms the point-lookup shape of the whole consumer surface.

---

## 7. Cross-app synthesis

### 7.1 The point-lookup audit (asked directly by the brief): **confirmed, with one repair**

Every contract read needed by all five apps reduces to derive-key-offline → `getSlot`/`getClaim`/`getObject`, **except** the mirror hop (cardinality-N, no slot, currently enumeration) — repaired by demand #4a/b. No app needed on-chain traversal, cross-author lens fallback in a contract, or global enumeration. The Story-precompile counterexample budget is intact.

### 7.2 The expiry doctrine (asked directly): **survives only if redefined**

- Currency-shaped claims (endorsements, delegations, royalty configs): expiry-as-TTL is natural and load-bearing. ✔
- Archive-shaped data (packages, docs, archives): expiry-as-death is actively harmful (heartbeat rot, dead-author erasure, home-chain damage). ✘
- The unifying semantics that serves both: **expiry bounds currency, never validity** — "stale, not dead," kernel-legible, default-read-visible. Plus the registry's real completeness answer is (b) declared-home revalidation + (c) advisory-author lenses — presence-shaped (monotone, replication-friendly) signals replacing dependence on absence-shaped revoke propagation wherever security demands it.

### 7.3 Portability strain league table (which strain bit how many apps)

| Strain | NFT | DAO | Registry | Archive | Dapp | Repair |
|---|---|---|---|---|---|---|
| S2 missing revoke | low | low | **critical** | negl. | **high ($)** | #1 + #5 + advisory pattern |
| S3 bytes don't travel | **critical** | low | none | none | low | #3 |
| S1 stale snapshot | low | low | med | negl. | med | labeling + #5 |
| S4 expiry illegibility | med | med | med | none | **high** | #1 |
| Dangling refs | — | — | — | — | — | **non-issue**: registry existence rule forces closure; ship closure-export in SDK |

Dangling refs deserve one line: I went looking for the failure and found the kernel already prevents it — a cherry-picked claim without its dependency closure REVERTs at admission. The residual is UX (SDK must export closures), not model.

---

## 8. Per-app verdicts

| App | Verdict | Blocking demands | Notes |
|---|---|---|---|
| 1. NFT metadata | **Fits well** | #2, #3, #4a; gas benchmark | flagship composability case; blinded-TAGDEF reveals free |
| 2. DAO doc store | **Fits, operational burden** | #1 (delegations); Codex succession convention | TSS-EOA carries orgs through v2; F2.2 is the KEL's first real customer |
| 3. Package registry | **Fits only with the expiry redefinition** | #1, #4b, #5 | breaks the doctrine's wording, not the architecture; proves LIST declaration node must stay |
| 4. Web archive | **Best fit** | gas benchmark only | the mission's home turf; economics are the known ceiling |
| 5. Dapp records | **Fits cheaply** | #1 | confirms point-lookup surface; new wrapper-contract composability pattern worth naming |

**No app produced a fatal finding against the settled direction.** The tag-core namespace, owned/unowned split, PIN/TAG cardinality split, signature-recovered authorship, and permissionless carriage all took load without cracking. The two flagged traps (don't merge PIN/TAG; DATA owned vs tags unowned) were each independently re-confirmed by an app (F3.2 needed owned DATA; §4.1 needed unowned tags; app 1's O(1) tokenURI needs cardinality-in-the-kind).

---

## 9. Top 5 model changes demanded (ranked, each with its evidence)

1. **Kernel-legible expiry with "stale, not dead" semantics.** Add optional `expiresAt` (uint64) to revocable-claim bodies (PIN/TAG/LIST_ENTRY), enforced in default reads (`getSlot` returns a staleness flag / a `current` view excludes past-TTL claims), with records never invalidated — refresh = idempotent re-assert. Kills S4 (string-property expiry that consumer contracts silently skip), makes the cross-chain safety doctrine machine-checkable, and reconciles the registry contradiction (§4.5) with the endorsement use case (§6.3). *Evidence: apps 2, 3, 5; app 3 breaks without it.* (Cost: one word per claim; the one v1 lesson to respect is EAS's expirationTime was dead weight because it was mandatory-and-meaningless — here it's optional-and-enforced.)
2. **Payload-bytes-in-state is normative (hard part (d) answered: YES).** `getClaim` must return body bytes from state for all record kinds; `data:` inline MIRROR is the blessed on-chain-composability transport. Settles coupling-audit open question #2 with app evidence: tokenURI composition (app 1), Governor doc checks (app 2), integrity gating (app 3) all read bodies on-chain. Without this the composability sale is void.
3. **Make on-chain bytes portable: chain-relative mirror URIs + frozen deterministic byte-store recipe.** Spec `web3://<addr>` (no chainId) as "this chain" in mirror URIs; freeze the CREATE2 recipe (canonical deterministic-deployment proxy + salt = contentHash) in the Codex so any copier re-materializes chunk stores at identical addresses on any chain and the author's original MIRROR record stays true everywhere. Without it, S3 confines the Microsoft walkthrough to inline-sized files and the NFT/media case dies on replication. *Evidence: apps 1, 4; §1 S3.*
4. **Complete the derivable-point-read surface.** (a) Give the mirror hop a point read: either a kernel per-`(author,dataId)` mirror index with a defined primary position, or resolve the MIRROR→reserved-property-key fork in favor of the property form (primary = PIN slot, extras = TAGs) — app evidence favors the property form. (b) `getSlot` exposes supersession evidence (count and/or prior claimId) so rewrite-detection (registry versions, DAO propose/execute pinning) is one read. *Evidence: apps 1, 2, 3.*
5. **Home-declaration + read-grade plumbing as Codex-normative convention (not machinery).** Reserved key `home` (author-signed chain declaration), `authorHead()` frozen in the read surface, and the registry read-pattern chapter: pull-latest-before-trust against declared home for yank-sensitive reads; third-party advisory authors in the consumer lens as the decentralized-yank pattern; mandatory read-grade labels (current / stale-as-of / unknown). This is advisory-claim + per-chain-view only — it stays strictly inside the "no portable currency" line while giving every app the same honest answer instead of five folklore reinventions. *Evidence: app 3 primarily; apps 1, 5 secondarily.*

**Below the cut (worth tracking, not top-5):** freeze KEL/succession golden vectors against the DAO time-scoped-authorization case (F2.2) and the successor-key consumer convention (F2.3); the gas benchmark (apps 1+4 make it urgent — it gates two verdicts); SDK closure-export format for cherry-pick replication; an author-chosen LIST identityKey mode (F3.5); document the closed-set gating idiom + wrapper-contract pattern (§6.2).

---

## 10. Self-attack (what I tried to break and couldn't, and residual doubts)

- **Tried:** making the NFT contract derive dataIds directly (dies correctly on the salt entropy rule — the tagId detour is sound, don't weaken salts). Merging the registry's yank into placement supersession (loses the cargo-distinction between "moved" and "withdrawn" — the REVOKE/re-assert pair is right). Using expiry to solve the registry (it made it worse — §4.5). Gating contracts on lens fallback (sybil-owned; closed sets only). Finding a string-only-property victim (none found on-chain across five apps; the ruling survives *this* pass — but these five apps are infra-shaped, and a marketplace/pricing app might still land the numeric blow; my sample can't clear the ruling globally).
- **Residual doubts:** (1) every gas number here is inherited estimate — two verdicts (apps 1, 4) are hostage to the benchmark; (2) I assumed `getClaim` returns state-resident bodies and that TAG/LIST_ENTRY slots are `getSlot`-readable — if the kernel surface diverges from arch-B's sketch, §§2.3/6.2 need re-derivation; (3) the advisory-lens yank pattern (§4.5c) is designed-on-paper here, same epistemic grade as the leanings it sits beside — it deserves a red-team of its own (can an advisory author be spoofed into a consumer's lens? what's the bootstrap default-advisory-lens story?); (4) relayer abuse economics remain untested and app 5's viability leans on them; (5) the LIST declaration-node argument (§4.2) assumes appendOnly enforcement can't be re-homed elsewhere — if someone finds a cheaper carrier for that guarantee, the argument transfers rather than dies.
