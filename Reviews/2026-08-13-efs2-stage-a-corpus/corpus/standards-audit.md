# EFS 2.0 standards audit — durable record of the intake standards lane

**Stage A evidence corpus — intake audit of 2026-08-12, durable record.**

Provenance: faithful transcription of the STANDARDS lane of the six-lane intake audit
(`scratchpad/audit-lanes.json`, 2026-08-12), reorganized stable-vs-draft and deduplicated.
No re-research was performed. Every VERIFIED/PLAUSIBLE mark is the intake auditor's own,
carried unchanged; severities are carried unchanged. Web statuses are current to
2026-08-12 (the audit date), not to any later date.

Reading key (PM-mandated distinction, pm-stage-a-directive.md line 23):

- **Standards FACT** — the status, date, and source of the external document. Marked
  VERIFIED (web) when the auditor fetched the exact text, VERIFIED (vault) when the
  auditor read the exact vault text, PLAUSIBLE (knowledge) when stated from model
  knowledge without a fetch. Facts are not EFS decisions.
- **EFS policy recommendation** — what the intake auditor recommends EFS do about the
  fact. Every policy line here is a [PROPOSAL] of the intake audit unless it cites an
  owner ruling; adoption happens only through Stage A chapters and later synthesis.
  Silence never adopts a proposal (PM execution default).

---

## 1. Corrections to spine assumptions

Eight places where the spine (kickoff / candidate / July evidence) carries a stale or
absent standards status. Each row links to its full entry below.

| # | Correction | Spine text corrected | Entry |
|---|-----------|----------------------|-------|
| C1 | **EIP-7825 is live** on L1 since Fusaka 2025-12-03 (16,777,216-gas per-tx cap) — new protocol physics; kickoff standards list omits it; July batch arithmetic is stale | deterministic-ids.md §5 (line 160) "~29M gas… ~36M-gas-limit L1 block"; kickoff lines 102-107, 149 | §2.1 |
| C2 | **ERC-7913 is Final**, with shipped OpenZeppelin verifiers — not the "future seam" the candidate assumes | core-architecture-candidate.md lines 249-250; kickoff line 149 | §2.2 |
| C3 | **EIP-7951 (P-256 precompile) is live** on L1 since Fusaka — absent from the kickoff standards list; unblocks passkey/WebAuthn zero-setup Principals | kickoff line 149 (absence); identity.md open question (b) already knew | §2.3 |
| C4 | **CBOR CDE is not an RFC** (draft-ietf-cbor-cde-13, intended BCP); "deterministic CBOR" names a family, not a codec — golden vectors impossible until one byte-exact profile is named | kickoff line 150 | §3.3 |
| C5 | **multihash/CID is registry-stewarded only** — the IETF draft expired 2024-02-21 and was never an RFC | deterministic-ids.md §13.8 convention | §3.5 |
| C6 | **web3:// is two documents**: ERC-4804 Final but superseded-in-practice by ERC-6860, which carries the corrections and is still Draft — "web3://" alone is ambiguous about the normative text | deterministic-ids.md §8, §13.7; memory: web3:// as zero-infra write default | §3.2 |
| C7 | **EIP-170's 24,576-byte code limit still binds** (EIP-7907 did not ship in Fusaka) — a compile-time forced gate on bakeoff axis 6; EIP-4444 history expiry is now partially real (pre-merge droppable since 2025-05) | kickoff lines 149-150 list neither | §2.14 |
| C8 | **EIP-8130 is a Draft Core EIP** (2025-10-24, spec explicitly unstable, no scheduled fork) — reserved seam only, never load-bearing; kickoff labels it "draft" correctly | kickoff line 149 | §3.1 |

---

## 2. Stable / live standards

### 2.1 EIP-7825 — per-transaction gas cap (severity at intake: SERIOUS; BLOCKING as carry-in)

- **Standards FACT** — VERIFIED (web): live on L1 mainnet since Fusaka, activated
  2025-12-03 at epoch 411392. Cap = 2^24 = 16,777,216 gas per transaction. Sources: EF
  blog 2025-10-21 "Fusaka Update – Transaction Gas Limit Cap arrives with EIP-7825"; EF
  Fusaka Mainnet Announcement + coverage.
- **Spine state at intake** — VERIFIED (vault): deterministic-ids.md §5 (line 160) still
  reasons "32 ancestors ≈ ~29M gas physically cannot ride a ~36M-gas-limit L1 block" —
  both numbers now stale physics. Kickoff "Required technical gates" (lines 102-107)
  commands aggregate gas/budget measurement without naming any per-tx cap; the kickoff
  standards list (line 149) omits 7825 entirely. VERIFIED (vault, carry-in lane):
  lens-pass-synthesis.md LN-4 and lens-spec.md §1 already encode the consequence — a
  128-item × 55-principal naive directory page (~29.5M gas) is permanently impossible;
  "wide sorted contract-native directories cannot be delivered under the live EIP-7825
  cap."
- **EFS policy recommendation** [PROPOSAL]: the measurement harness must treat
  16,777,216 gas as the hard L1 per-tx ceiling for every one-call dependent write,
  mandatory-index fan-out, and atomic batch; re-derive worst-case batch sizes against
  it; state L2 caps separately; cite EIP-7825 in the standards section as live protocol
  physics, not a candidate. Carry-in label: **derived invariant, venue-conditional
  physics, not an EFS mechanism** — re-verify the cap against the adopted Realm gas
  profile (an L2/L3 may not enforce 7825, and the cap can be revised). "Bounded
  candidate pages + exact venue-local point resolution + fixed-basis client
  materialization" is the only honest on-chain enumeration promise under the cap.
  Invalidated only by a Realm profile without the cap or a materially raised cap — in
  which case the 2026-07-11 "should-not-be-promised" argument still applies on cost
  grounds.

### 2.2 ERC-7913 — signature verifiers beyond addresses (severity at intake: SERIOUS)

- **Standards FACT** — VERIFIED (web): eips.ethereum.org/EIPS/eip-7913 fetched —
  "Status: Final (Standards Track: ERC)". OpenZeppelin docs list ready-to-use ERC-7913
  verifiers (P256/RSA/WebAuthn) and SignerERC7913/MultiSignerERC7913 account building
  blocks.
- **Spine state at intake** — VERIFIED (vault): core-architecture-candidate.md lines
  249-250 call ERC-7913 "a future addressless-actor seam, not stable Principal
  identity"; kickoff line 149 groups it in the standards list without status.
- **EFS policy recommendation** [PROPOSAL]: re-grade ERC-7913 from watch-item to
  concrete candidate encoding for non-address authorities in AccountPrincipal/1 — while
  flagging the misfit: the verifier half of `verifier||key` is a contract address, hence
  chain/Realm-scoped; portable PrincipalId should hash the key + algo, with the verifier
  as Realm-revision config, or portability silently breaks.

### 2.3 EIP-7951 — secp256r1 (P-256) precompile (severity at intake: SERIOUS)

- **Standards FACT** — VERIFIED (web): eips.ethereum.org/EIPS/eip-7951 + EF Fusaka
  announcements — included in Fusaka, live on L1 mainnet since 2025-12-03; precompile at
  0x100, 6900 gas; interface-compatible with RIP-7212 on L2s.
- **Spine state at intake** — VERIFIED (vault): identity.md open question (b) already
  says "EIP-7951 is live on L1; the client's key-custody ladder is capped until this
  lands" — the evidence docs know; the kickoff standards list (line 149) doesn't.
- **EFS policy recommendation** [PROPOSAL]: add EIP-7951/RIP-7212 to the standards list;
  the Principal bakeoff should include one P-256/WebAuthn account-Principal vector
  (algoTag path). Combined with Final ERC-7913 + shipped WebAuthn verifiers this
  un-blocks the passkey/WebAuthn zero-setup Principals the July identity round deferred.
  Misfit to state: WebAuthn payload profiles (authenticatorData/clientDataJSON) need the
  strict profile the July KEL round reserved — verify against ≥2 real authenticator
  families before freezing, per identity.md line 16.

### 2.4 EIP-712 — typed structured-data signing (severity at intake: SERIOUS)

- **Standards FACT** — PLAUSIBLE (knowledge, near-certain): EIP-712 status is Final.
- **Spine state at intake** — VERIFIED (vault): identity.md line 16 — "The v2 admission
  predicate (canonical low-S secp256k1, chain-free EIP-712, constant domain separator)";
  kickoff line 115 lists "cross-Realm replay/domain confusion" attacks but line 149's
  standards list has no EIP-712.
- **EFS policy recommendation** [PROPOSAL]: add EIP-712 to the standards list. The
  kickoff's own required gates (cross-Realm replay/domain confusion) are exactly EIP-712
  domain design. The pass must explicitly argue the inherited deviation: a constant
  domain (no chainId/verifyingContract) moves all replay defense into the
  Envelope/AdmissionIntent nonce+realm design — that July decision is exactly the kind
  of mechanism the greenfield ruling says must re-earn inclusion, and wallet signing UX
  (eth_signTypedData) constrains the Envelope struct either way.

### 2.5 EIP-1271 — contract signature validation (severity at intake: SERIOUS)

- **Standards FACT** — VERIFIED (web): eips.ethereum.org/EIPS/eip-1271 fetched — Final,
  and ubiquitous in deployment.
- **Spine state at intake** — VERIFIED (vault): a live vault contradiction. identity.md
  line 18: "No ERC-1271 anywhere, ever (chain-bound, state-dependent — the antithesis of
  the portable artifact)". core-architecture-candidate.md line 249: "ERC-1271 works
  locally"; line 316 and falsifier 8 (line 429) forbid Lens reads calling arbitrary 1271
  accounts. Under the 2026-08-12 greenfield ruling the July ban is evidence, not
  baseline, so the candidate's re-admission is legitimate but must be argued, not
  assumed.
- **EFS policy recommendation** [PROPOSAL]: state the re-earned rule explicitly —
  ERC-1271 acceptable **only at admission time**, with the admission receipt pinning
  account codehash / RealmRevision / block basis so later account-code changes never
  reinterpret recorded authorship (the misfit is state-dependence, which receipts
  neutralize); never on read/Lens paths. Note EIP-7702 makes hasCode-dispatch unsafe
  (already in candidate lines 247-250).

### 2.6 ERC-4337 — account abstraction via alt mempool (severity at intake: NOTE)

- **Standards FACT** — VERIFIED (web): eips.ethereum.org fetched — ERC-4337 Final.
- **Spine state at intake** — VERIFIED (vault): kickoff line 148 lists it;
  core-architecture-candidate.md lines 250-251 require author Principal separate from
  relayer and payer.
- **EFS policy recommendation** [PROPOSAL]: 4337 solves SDK/write-UX problems, not
  Core-semantics problems. Scope it to the SDK/relayer lane; author/actor/payer
  separation in the Envelope is the Core-level requirement; bundler infrastructure must
  never be a Core dependency.

### 2.7 ERC-6492 — signature validation for predeploy (counterfactual) contracts (severity at intake: NOTE; PM-named)

- **Standards FACT** — VERIFIED (web): eips.ethereum.org fetched — ERC-6492 Final
  ("Signature Validation for Predeploy Contracts").
- **Spine state at intake** — VERIFIED (vault): kickoff line 148 lists it. PLAUSIBLE
  (inference, intake auditor): a 6492 wrapper's validity flips once the account deploys,
  so an admission receipt recording "6492-verified" without deployment-state basis is a
  reinterpretation hazard of the same class as 1271 state-dependence.
- **EFS policy recommendation** [PROPOSAL]: treat 6492 as **off-chain pre-flight
  verification only**, or record deployment-state basis in the receipt if ever accepted
  on-chain. Its simulation-based, time-varying counterfactual verification is unsafe as
  an admission-time authority basis. (Note: kel.md §20 already REJECTS ERC-1271/6492 as
  *envelope* authority — see the carry-in register, rejected imports.)

### 2.8 EIP-7702 — set EOA account code (severity at intake: NOTE)

- **Standards FACT** — PLAUSIBLE (knowledge, near-certain): activated with Pectra
  2025-05-07 on mainnet.
- **Spine state at intake** — VERIFIED (vault): core-architecture-candidate.md lines
  247-250 already internalize the one real hazard (code-bearing EOAs breaking hasCode
  dispatch) via a versioned authority verifier instead of `hasCode ? ERC1271 :
  ecrecover`; kickoff line 116 lists "EIP-7702 classification" among attacks — the gate
  is well-aimed.
- **EFS policy recommendation** [PROPOSAL]: keep the versioned authority verifier and
  add one conformance vector: the same 7702 account authored records before delegation,
  under delegation, and after re-delegation — all three must classify under the basis
  recorded at their own admission, never the current one.

### 2.9 EIP-1153, EIP-2935, ERC-7201 — live EVM prototype toolbox (severity at intake: NOTE)

- **Standards FACT** — PLAUSIBLE (knowledge, near-certain): EIP-1153 transient storage
  live since Cancun (2024-03); EIP-2935 block-hash history in state live since Pectra
  (2025-05), ~8191-block ring only. VERIFIED (web): ERC-7201 (namespaced storage
  layout) Final per eips.ethereum.org.
- **Spine state at intake** — VERIFIED (vault): deterministic-ids.md §2 already stores
  config "in ERC-7201 config at initialize()"; kickoff line 113 attacks
  "reentrancy/module partial failure"; memory note efs-correct-easy-before-fast says
  defer perf levers.
- **EFS policy recommendation** [PROPOSAL]: list all three as available tools with
  scoped roles — 1153 for correctness (reentrancy locks, batch-local dependency tables),
  not gas optimization; 2935 for pinning/verifying recent bases on-chain, explicitly not
  a deep-history mechanism; 7201 only for the disposable upgradeable prototypes, with a
  stated invariant that the frozen Core ends non-upgradeable.

### 2.10 ERC-5564 / ERC-6538 — stealth addresses (severity at intake: NOTE)

- **Standards FACT** — VERIFIED (web): eips.ethereum.org/EIPS/eip-5564 fetched — Final.
  ERC-6538 is the companion registry.
- **Spine state at intake** — VERIFIED (vault): absent from the kickoff standards list
  despite kickoff lines 133-136 requiring "zero accidental plaintext/dictionary identity
  leakage… public/private batch-linkage rejection, and retrieval-observer disclosure";
  deterministic-ids.md §1 salt-entropy rule and §8 salted anchors are the current
  in-house mechanisms.
- **EFS policy recommendation** [PROPOSAL]: evaluate, don't adopt wholesale — stealth
  meta-address derivation is payment-shaped (announcement scan cost, view-key
  semantics), but the ephemeral-key + shared-secret derivation pattern is the
  standards-grounded way to mint unlinkable one-off account Principals for the
  sensitive-Record fixture; cite it in the privacy seam design either way.

### 2.11 RFC 8949 — CBOR (severity at intake: part of the SERIOUS CBOR-family finding, §3.3)

- **Standards FACT** — VERIFIED (web, via the CBOR-family finding): RFC 8949 is an
  Internet Standard; its §4.2 defines deterministic encoding (bytewise-lexicographic map
  ordering).
- **EFS policy recommendation** [PROPOSAL]: if a CBOR profile is adopted anywhere, pin
  "RFC 8949 §4.2 profile, pinned in the Codex" — never a floating reference to CDE. See
  §3.3 for the full family disambiguation and candidates.

### 2.12 RFC 6920 — naming things with hashes (ni: URIs) (severity at intake: NOTE)

- **Standards FACT** — VERIFIED (web): datatracker — RFC 6920, Proposed Standard, April
  2013, not obsoleted/updated. PLAUSIBLE (knowledge): near-zero ecosystem adoption vs
  multihash/SRI momentum.
- **EFS policy recommendation** [PROPOSAL]: right shape (self-describing hash URIs),
  wrong interop bet if made the primary external-reference form. Cite RFC 6920 as the
  standards-blessed precedent for hash-in-URI self-description (it satisfies the
  kickoff's "standards-based self-describing external references" gate on paper) and
  optionally emit `ni:` as a projection, but make the canonical stored form the
  Codex-pinned multihash convention (§3.5).

### 2.13 RDFC-1.0 — RDF dataset canonicalization (severity at intake: NOTE; PM-named)

- **Standards FACT** — VERIFIED (web): W3C news 2024 — "RDF Dataset Canonicalization is
  a W3C Recommendation" (2024-05-21).
- **Spine state at intake** — VERIFIED (vault): deterministic-ids.md "Statements vs.
  things" explicitly maps to Datomic's entity/fact split, the closer database prior art;
  kickoff lines 60-61 require honest FOUND/ABSENT/CONFLICT/UNKNOWN semantics, which are
  closed-world, basis-pinned claims.
- **EFS policy recommendation** [PROPOSAL]: RDFC's correct use in this pass is **prior
  art justifying avoidance**: EFS gives every node a deterministic ID, so blank-node
  canonicalization (RDFC's entire hard problem, with worst-case pathological graphs)
  never arises; RDF's open-world semantics also mismatch Realm-qualified
  FOUND/ABSENT/CONFLICT/UNKNOWN. Adopt RDF as the n-ary/typed-reference vocabulary prior
  art and RDFC as the cautionary tale (no anonymous nodes in the Core algebra = no
  canonicalization algorithm needed); for the graph index contract, benchmark against
  property-graph/Datomic index models (EAVT/AEVT/VAET-style) rather than triple-store
  SPARQL models.

### 2.14 EIP-170 (binding) and EIP-4444/EIP-7927 (partially real) — protocol physics beyond 7825 (severity at intake: NOTE; 4444/7927 PM-named)

- **Standards FACT** — PLAUSIBLE (knowledge): EIP-7907 (code-size increase) was
  considered for but not included in Fusaka's final EIP set, so **EIP-170's 24,576-byte
  contract-code limit stands**. VERIFIED (web): EF blog 2025-07-08 "Partial history
  expiry announcement" — all clients support dropping pre-merge bodies/receipts since
  2025-05; the rolling-window phase has no set timeline; EIP-7927 is the History Expiry
  Meta-EIP.
- **Spine state at intake** — VERIFIED (vault): core-architecture-candidate.md falsifier
  10 (line 432) "state-only reconstruction needs old logs" and deterministic-ids.md §4
  "never dependent on event logs (EIP-4444 history expiry)" already encode the response;
  kickoff lines 149-150 list neither 4444 nor any code-size constraint.
- **EFS policy recommendation** [PROPOSAL]: add EIP-4444/7927 to the standards list as
  the justification for the state-readable-reconstruction gate (a reviewer should see it
  argued from live protocol direction, not taste) — partial history expiry converts the
  vault's state-walk doctrine from prudence into necessity. Put the 24KB code limit into
  the monolith-vs-modules bakeoff (axis 6) as a measured compile-time constraint: one
  atomic Core must fit, or use EIP-2535/delegate patterns — which reintroduce exactly
  the codehash-dependency risks the kickoff attacks.

### 2.15 ISO/IEC 18670:2025 — SWHID (severity at intake: NOTE)

- **Standards FACT** — VERIFIED (web): iso.org shows ISO/IEC 18670:2025 "SoftWare Hash
  IDentifier (SWHID) Specification V1.2"; swhid.org announcement 2025-04-23. PLAUSIBLE
  (knowledge): SWHID computes Git-compatible SHA-1 object hashes over source artifacts
  (snapshots/revisions/contents).
- **EFS policy recommendation** [PROPOSAL]: the strongest external validation available
  for the kickoff's core bet (intrinsic, registry-free, client-computable IDs can reach
  ISO standardization — useful against "why not a registry" reviewer pressure), but it
  is SHA-1-based and source-artifact-scoped, so it is citation and interop target, not a
  base. Optionally emit/consume SWHIDs in the Git fixture as foreign identifiers;
  inherit nothing of its SHA-1 hashing.

### 2.16 W3C DID-core 1.0 (severity at intake: NOTE; 1.1 is draft — see §3.7)

- **Standards FACT** — VERIFIED (web): DID 1.0 is a W3C Recommendation (2022); w3.org
  news 2026 — "W3C Invites Implementations of Decentralized Identifiers (DIDs) v1.1"
  (Candidate Recommendation 2026-03-05; resolution split into DID Resolution v0.3).
- **Spine state at intake** — VERIFIED (vault): kickoff line 148 "Prefer established
  standards and justify every EFS invention"; the managed-Principal feature list
  (rotation/delegation/recovery/organizations, kickoff lines 56-58) is precisely DID's
  controller/verificationMethod model — yet the kickoff never mentions DID.
- **EFS policy recommendation** [PROPOSAL]: write the rejection (or adoption)
  explicitly: likely reject as identity substrate (method-specific resolution infra,
  mutable DID documents vs immutable recorded authority basis, registry-shaped methods)
  while reserving a `did:efs` projection as an export seam. An independent
  crypto/identity reviewer will ask; pre-empt with citations to 1.0 REC vs 1.1 CR
  status.

### 2.17 CAIP-2 / CAIP-10 — chain-scoped identifiers, text form (severity at intake: SERIOUS, shared with ERC-7930 — see §3.6)

- **Standards FACT** — VERIFIED (web): CASA pages — CAIP-2 among the first finalized
  CASA standards; CAIP-10 is the account form.
- **Spine state at intake** — VERIFIED (vault): core-architecture-candidate.md line 54
  "RealmId = H(immutable profile + chain reference + genesis/deployment commitment)" and
  lines 245-247 "a contract-account authority is Realm-qualified" — both need a
  canonical chain-reference byte encoding for hash preimages, and no standard is named
  anywhere in the kickoff.
- **EFS policy recommendation** [PROPOSAL]: add to the standards list; use CAIP-2/10 as
  the human/URL projection, with ERC-7930's binary encoding evaluated as the
  hash-preimage form (see §3.6 for the 7930 status caveat).

### 2.18 ERC-4804 — web3:// (Final half of the pair) (severity at intake: NOTE)

- **Standards FACT** — VERIFIED (web): ERC-4804 Final. Superseded-in-practice by
  ERC-6860 (Draft), which "updates ERC-4804 with minor corrections, clarifications and
  modifications" with an Appendix B change list — see §3.2.
- **EFS policy recommendation** — see §3.2 (the pair must be treated together).

---

## 3. Draft / unstable / registry-stewarded

### 3.1 EIP-8130 — native AA transaction type (severity at intake: NOTE)

- **Standards FACT** — VERIFIED (web): eips.ethereum.org/EIPS/eip-8130 fetched —
  Status: Draft, Standards Track: Core; created 2025-10-24, Coinbase-authored (new AA
  transaction type + onchain account-configuration system contract); base/eip-8130
  README states "active work in progress, spec changing, code not yet audited"; no
  scheduled fork. The kickoff (line 149) correctly labels it "draft".
- **EFS policy recommendation** [PROPOSAL]: reserved seam only, never load-bearing.
  Treat EIP-8130 solely as a falsifier probe for the authority-verifier abstraction: if
  the versioned admission-time authority verifier cannot later classify an
  8130-configured account without rewriting history, the verifier design is wrong. No
  mechanism may depend on 8130 shipping. (Cross-check, VERIFIED in the survivors lane:
  assumptions-and-requirements.md line 165 notes native transaction context cannot
  satisfy R-D8 — authority never derives from the submission rail.)

### 3.2 ERC-6860 — web3:// corrected text (severity at intake: NOTE)

- **Standards FACT** — VERIFIED (web): ERC-6860 fetched — Status: Draft; it updates
  Final ERC-4804 with the corrections and is the text implementers actually follow.
- **Spine state at intake** — VERIFIED (vault): deterministic-ids.md §8 (fragment
  capabilities in web3:// URLs) and §13.7 (transport interpretation includes web3://);
  memory note efs-mirror-data-scheme-rejected makes web3:// the universal zero-infra
  write default.
- **EFS policy recommendation** [PROPOSAL]: if web3:// survives into 2.0 Locator
  conventions, the Codex must pin the exact spec text (a 6860 revision hash or
  4804-as-published) plus the auto/manual-mode and name-resolution subset EFS actually
  requires; note the gateway-trust caveat for clients without native resolution.

### 3.3 Deterministic CBOR — a family, not a codec (severity at intake: SERIOUS; PM-named)

- **Standards FACT** — VERIFIED (web): datatracker shows draft-ietf-cbor-cde-13
  (2025-10-14), intended status Best Current Practice, expires 2026-04-17 — **not an RFC
  as of 2026-08**. RFC 8949 §4.2 is an Internet Standard. PLAUSIBLE (knowledge):
  dag-cbor retains legacy length-first map-key ordering vs RFC 8949 §4.2
  bytewise-lexicographic — a real byte-level divergence; dag-cbor is a de facto IPLD
  spec with no SDO. SSZ is stable in the consensus layer (merkleization useful for
  partial/50GB staged proofs) but has immature EL tooling.
- **Spine state at intake** — VERIFIED (vault): kickoff line 150 says only
  "multihash/CID and deterministic CBOR"; the July evidence (deterministic-ids.md §1)
  instead used keccak over fixed-width abi.encode words for on-chain verifiability.
- **EFS policy recommendation** [PROPOSAL]: golden vectors cannot be produced until one
  byte-exact profile is named. Make the bootstrap/meta-codec bakeoff name explicit
  candidates: (a) fixed-width abi.encode words (July-evidence lesson, cheapest
  on-chain), (b) an RFC 8949 §4.2 profile pinned in the Codex (not a floating reference
  to CDE), (c) SSZ where merkle partial proofs pay for closure/chunk verification.
  Reject dag-cbor unless full CID interop is a requirement, and record that CDE is not
  yet stable enough to pin.

### 3.4 Git SHA-1 → SHA-256 transition (severity at intake: NOTE)

- **Standards FACT** — VERIFIED (web, secondary sources: LWN/devclass/deployhq): SHA-256
  repos non-experimental since Git 2.42; Git 2.48-2.51 shipped Git 3.0 groundwork
  including SHA-256-by-default; Git 3.0 targeted late 2026 makes SHA-256 the default for
  new repos; "GitHub still doesn't support SHA-256 repositories"; Bitbucket lagging;
  SHA-1↔SHA-256 interop remains incomplete after 8+ years.
- **Spine state at intake** — VERIFIED (vault): deterministic-ids.md §13.6 already
  encodes the lesson ("the git SHA-1→SHA-256 lesson (8+ years, still unfinished, because
  the transition was retrofitted)"); kickoff Git fixture (lines 126-131) requires
  "native OIDs, stock clone/fetch".
- **EFS policy recommendation** [PROPOSAL]: this is the load-bearing cautionary tale;
  two obligations for the pass: (1) the Git fixture must carry raw SHA-1 OIDs strictly
  as algorithm-tagged foreign digests (ByteDigest/1-style), never as EFS identity — a
  broken hash entering the identity layer is the falsifier; (2) the hash-migration
  playbook must be written before the first ID is minted (the July §13.6 gate survives
  the greenfield reset as a requirement, and the Git evidence is why).

### 3.5 multihash / CID — registry-stewarded only (severity at intake: NOTE)

- **Standards FACT** — VERIFIED (web): datatracker shows draft-multiformats-multihash-07
  as the latest, expired 2024-02-21, intended Informational — the IETF track is dead;
  multihash is de facto stable only via the multiformats GitHub registry.
- **Spine state at intake** — VERIFIED (vault): deterministic-ids.md §13.8 "contentHash
  multibase-multihash convention" — the convention is already in the evidence spine.
- **EFS policy recommendation** [PROPOSAL]: registry stewardship is inadequate for a
  50-year archive unless the Codex pins exact codes. Adopt the wire format but pin the
  closed code subset (e.g. sha2-256, and the chosen successor slot) with printable
  preimages in the Codex itself, exactly like the domain constants — reference the
  registry as provenance, never as a living dependency. Avoid full CID (IPLD
  codec+multibase semantics) unless IPFS interop is a stated requirement; a bare
  multihash + explicit codec tag is the smaller, freezable unit.

### 3.6 ERC-7930 — interoperable addresses, binary form (severity at intake: SERIOUS, shared with CAIP; PM-named)

- **Standards FACT** — VERIFIED (web): eips/ethereum-magicians — ERC-7930 in **Review**
  as of Q2 2026; binary chainType+reference+address encoding.
- **Spine state at intake** — as §2.17: the candidate's RealmId "chain reference" and
  Realm-qualified contract-account authorities need a standard chain-scoped identifier
  encoding, and none is named anywhere in the kickoff.
- **EFS policy recommendation** [PROPOSAL]: evaluate ERC-7930's binary encoding as the
  hash-preimage form (compact, EVM-parseable, self-describing) with CAIP-2/10 as the
  human/URL projection; **since 7930 is still Review, pin the exact byte layout in the
  Codex if adopted early**, with the same escape-hatch versioning as the domain
  constants.

### 3.7 W3C DID 1.1 — Candidate Recommendation (severity at intake: NOTE)

- **Standards FACT** — VERIFIED (web): DID 1.1 at Candidate Recommendation since
  2026-03-05; DID Resolution split out as v0.3. (DID 1.0 remains the stable
  Recommendation — §2.16.)
- **EFS policy recommendation** — as §2.16: adopt-or-justify-rejection, citing which
  version's status is being argued against.

### 3.8 Certificate Transparency, KERI, OCapN, Tahoe-LAFS — "capability and append-only data systems" (severity at intake: NOTE)

- **Standards FACT** — PLAUSIBLE (knowledge): RFC 6962 and RFC 9162 (CT) are
  Experimental-track; KERI remains a ToIP/IETF-adjacent draft, not a published standard;
  OCapN still in progress; Tahoe-LAFS capability URLs are de facto only.
- **Spine state at intake** — VERIFIED (vault): deterministic-ids.md §8 already adopts
  the Tahoe-LAFS fragment-capability pattern; kel.md and identity.md are KERI-shaped
  (pre-rotation, inception, duplicity). The kickoff's phrase "capability and append-only
  data systems" (line 151) names a research area, not standards.
- **EFS policy recommendation** [PROPOSAL]: import CT's proof vocabulary
  (inclusion/consistency proofs) only where the kickoff's completeness gates need
  provable coverage on partial replicas; note that Realm chains already provide the
  ordering a CT log operator provides; treat KERI as design prior art whose full
  machinery the greenfield explicitly declines to freeze ("without freezing a custom KEL
  unnecessarily", kickoff line 58).

### 3.9 SSZ — consensus-layer serialization (severity at intake: folded into §3.3)

- **Standards FACT** — PLAUSIBLE (knowledge): stable in the consensus layer;
  merkleization useful for partial/50GB staged proofs; immature EL tooling.
- **EFS policy recommendation** — candidate (c) in the §3.3 meta-codec bakeoff.

---

## 4. Deployed prior art, not SDO standards

### 4.1 EAS — Ethereum Attestation Service

- **FACT** — VERIFIED (vault): kickoff mentions EAS only as prior art to re-check (line
  150) and as "EAS-like developer benefits but no mined UID identity" (lines 47-48);
  candidate module 7 (line 357) keeps an optional "EAS projection" adapter; README line
  72 "An EAS import/export adapter remains possible if it provides real
  interoperability"; constitution freeze step 3 (lines 327-328) "Keep EAS as an optional
  adapter experiment, not a hidden dependency."
- **EFS policy recommendation** [PROPOSAL, from the STANDARDS lane]: list EAS in the
  memo as deployed prior art (not an SDO standard) whose mined-UID identity is the
  disqualifying misfit the whole deterministic-ID program answers — with the candidate's
  optional EAS projection adapter as the bridge that keeps its ecosystem value without
  baseline status. PM execution default: the full EAS loss-map is deferred to V2-E8, but
  the adapter seam must be specified in Stage A.

### 4.2 Datomic / property-graph index models

- Carried inside the RDFC entry (§2.13): the closer database prior art for the graph
  index contract is the entity/fact split and EAVT/AEVT/VAET-style covering indexes, not
  triple-store SPARQL models. VERIFIED (vault): deterministic-ids.md "Statements vs.
  things".

---

## 5. Consolidated actionable deltas (verbatim priorities from the intake lane)

1. **EIP-7825 invalidates the July evidence's batch-gas arithmetic** and must bound
   every one-call write (§2.1).
2. **ERC-7913 Final + EIP-7951 live** moves addressless/passkey Principals from deferred
   to concretely buildable (§2.2, §2.3).
3. **"Deterministic CBOR" must be resolved to a named byte-exact profile** before golden
   vectors exist (§3.3).
4. **EIP-712 domain design, chain-scoped identifiers (CAIP/ERC-7930), and DID-core
   adopt-or-reject are missing** from the kickoff standards list (§2.4, §2.17/§3.6,
   §2.16).
5. **The vault carries a live ERC-1271 contradiction** (July "never" vs candidate
   "locally") that the pass must re-earn explicitly with basis-pinned receipts (§2.5).

---

## Interfaces exposed

What other Stage A chapters may rely on from this document:

- The **FACT vs policy split** above is the citable form for every standards claim; a
  chapter citing a standards status should cite the entry here (e.g. "standards-audit
  §2.1") rather than re-asserting the status, and must not promote a policy
  recommendation to adopted without its own labeled decision.
- **Hard physics constants for Stage A arithmetic**: EIP-7825 per-tx cap = 16,777,216
  gas (L1, live; venue-conditional per Realm profile); EIP-170 runtime-code limit =
  24,576 bytes (binding; EIP-7907 did not ship); EIP-7951 P-256 precompile at 0x100,
  6900 gas; EIP-2935 ring ≈ 8191 blocks.
- **Status one-liners** (all as of 2026-08-12): Final/live — 1271, 4337, 6492, 7702
  (Pectra), 7913, 712, 7825 (Fusaka), 7951 (Fusaka), 1153 (Cancun), 2935 (Pectra), 7201,
  5564, 4804, RFC 8949, RFC 6920 (2013, stagnant), RDFC-1.0, ISO 18670 (SWHID), DID 1.0,
  CAIP-2. Draft/unstable — 8130, 6860, CBOR CDE draft-13, dag-cbor (no SDO),
  multihash/CID (expired drafts; registry), DID 1.1 (CR), ERC-7930 (Review), EIP-4444
  (partial: pre-merge expiry only), CT RFCs (Experimental), KERI/OCapN (drafts), SSZ
  (consensus-layer only), Git SHA-256 transition (incomplete).

## Open items

- Re-verify every "PLAUSIBLE (knowledge)" status line before any freeze decision relies
  on it (7702 activation date, EIP-7907 non-inclusion, dag-cbor ordering divergence,
  CT/KERI/OCapN statuses, SWHID hashing scope, SSZ maturity) — the intake auditor did
  not fetch these.
- CDE (draft-ietf-cbor-cde-13) expires 2026-04-17 per datatracker at audit time and may
  have advanced; check before the meta-codec bakeoff report is finalized.
- ERC-7930 is in Review; its byte layout may change — anyone pinning it in the Codex
  must snapshot the exact revision.
- The Realm gas profile decides whether EIP-7825 physics binds a given Realm; the Realm
  chapter owns declaring that per-profile.
