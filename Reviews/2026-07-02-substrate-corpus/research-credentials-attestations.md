# Credentials & Attestations Autopsy — W3C VC/DID + Verax/Sign/EAS-offchain

**Agent:** credentials-attestations (EFS substrate investigation)
**Date:** 2026-07-02
**Method:** primary sources fetched directly (W3C TRs, spec drafts, contract/SDK source on GitHub, vendor docs) plus commentary (labeled). Staleness notes inline. Repo context read: `planning/Designs/deterministic-ids.md`.

**One-paragraph verdict.** The VC world proved that the *portable signed artifact* works cryptographically and fails everywhere it silently re-introduces a live server: status-list URLs, did:web resolution, phone-home verification, issuer-lifetime dependencies. The attestation-registry world (EAS, Verax, Sign) proved the inverse: chains answer "what exists / what's current / composability" decisively, and every one of them gave up artifact portability to get it — EAS binds offchain signatures to `{chainId, verifyingContract, per-chain version}`, Verax uses chain-prefixed counters, Sign punts cross-chain identity to a centralized indexer. Nobody in either family has both. The one lineage that squarely attacks EFS hard part (e) — durable *rotatable* identity with signatures that verify anywhere forever — is KERI/did:webvh: a self-certifying identifier plus a portable, hash-chained, infrastructure-replaceable key-event log with pre-rotation. That pattern, plus "make replay harmless by construction instead of forbidden by domain separation," is the main import for EFS.

---

## 1. W3C Verifiable Credentials + DIDs

### 1.1 The artifact model — what VC gets right

A VC is a self-contained set of signed claims: issuer (URL or DID), subject, claims, optional status/expiry, secured by either an **embedded** proof (Data Integrity / "LD-proofs") or an **enveloping** proof (JOSE/COSE JWT, SD-JWT). The VC 2.0 data model explicitly touts repository portability: identifiers (esp. DIDs) are "associated with subjects such that a verifiable credential can be easily ported from one credential repository to another without reissuing the credential" ([VC-DM 2.0](https://www.w3.org/TR/vc-data-model-2.0/)). Verification requires **no origin server** in the base model — the artifact + issuer key material suffices. This is exactly the property EFS wants for authorship that survives an origin chain's death, and it demonstrably works *as cryptography*.

Costs baked into the W3C flavor:

- **Mandatory JSON-LD `@context`** (ordered set, first item pinned URL) even for consumers that never do RDF processing; Data Integrity proofs additionally require RDF canonicalization (RDFC-1.0) — an entire normalization stack in the verification path. This is a major reason implementers fled to SD-JWT (plain JWS over JSON).
- **Proof-suite proliferation**: VC 2.0 examples alone span `ecdsa`, `ecdsa-sd`, `bbs`, JOSE, COSE, SD-JWT — the spec mandates "at least one securing mechanism" and defers the rest. Two conformant stacks routinely can't verify each other's credentials. (Primary: [VC-DM 2.0](https://www.w3.org/TR/vc-data-model-2.0/), [vc-jose-cose](https://www.w3.org/TR/vc-jose-cose/).)

**EFS mapping:** EFS's portable chain-free authorship signature should copy the *artifact* property (self-contained, verifier-offline-capable) and reject the format zoo: one signature suite (EIP-712/ECDSA — the most widely verifiable primitive in the EVM world, `ecrecover` verifies anywhere forever), one canonical byte encoding, no semantic-web canonicalization layer. EFS already has the "fixed-width words, pre-hash dynamic content" discipline in `deterministic-ids.md`; the signed-artifact spec should inherit it.

### 1.2 Revocation — does StatusList actually work?

**Mechanism** ([Bitstring Status List, W3C TR](https://www.w3.org/TR/vc-bitstring-status-list/)): each credential carries `credentialStatus: { statusListCredential: <URL>, statusListIndex: <n> }`; the verifier dereferences the URL, gets a signed `BitstringStatusListCredential` containing a GZIP'd bitstring, checks bit *n*. Purposes: `revocation` (terminal), `suspension` (reversible), `refresh`, `message`.

**What works:**
- **Herd privacy by batching**: minimum bitstring size 131,072 entries (16KB raw, a few hundred bytes compressed when sparse) — "this size ensures an adequate amount of group privacy in the average case." A spec-mandated anonymity-set floor is a good idea worth stealing.
- **Stapling**: the holder may supply the status list with the presentation, "ensuring that the verifier does not need to contact the issuer" — a replica-carried status proof.
- One fetch covers ~131k credentials; verifiers can cache.

**What fails:**
- **Availability = validity.** The validate algorithm hard-fails: "If the dereference fails, raise a STATUS_RETRIEVAL_ERROR." There is *no fallback*. Issuer's URL down ⇒ credential unverifiable. Issuer dead ⇒ permanent limbo. For a 100-year archive this is disqualifying as-is.
- **Surveillance surface**: once a verifier learns `(URL, index)` it "becomes possible for that verifier to see updates to that status entry" — per-credential tracking; and a malicious issuer can make per-credential status lists or per-credential keys to deanonymize. The spec documents these attacks against itself.
- **Staleness vs freshness tension**: stapled lists can be stale; fresh fetches phone home. Pick your poison.

**Accumulators (AnonCreds/CL revocation): empirically, no.** The Hyperledger Indy design requires issuer-hosted "tails files" of primes — "up to 1GB per revocation registry" for ~100k credentials, slow to prove against, and "usually on a web server owned by the issuer, making access trackable" ([cheqd analysis](https://cheqd.io/blog/anoncreds-indy-pendence-1/), [Indy SDK design doc](https://hyperledger-indy.readthedocs.io/projects/sdk/en/latest/docs/design/002-anoncreds/README.html)). Community consensus: "highly privacy-preserving but not scalable." Successors (zk-SAM etc. at DIF Applied Crypto WG) are research-grade. Do not build 100-year infrastructure on accumulator revocation.

**The telling recent development — CRSet** ([arXiv 2501.17089](https://arxiv.org/abs/2501.17089), 2025): a padded Bloom-filter-cascade revocation set published via **Ethereum blob-carrying transactions** ("one Ethereum blob fits revocation data for about 170k VCs"), so relying parties download once and check locally, and issuer activity metrics don't leak. The VC world is reaching for a *chain* to fix revocation's availability/neutrality problem at the same time EFS is reaching for *signatures* to fix the chain's portability problem. (Caveat, my note: consensus-layer blobs expire after ~18 days — CRSet-style schemes still need an archival story for the blob data itself; the chain provides ordering/commitment, not eternal DA.)

**EFS mapping (hard part a):** every *working* revocation mechanism surveyed has an always-on authority or a consensus point. The honest design space is exactly three cells: (1) chain-scoped revocation records with a defined lookup locus (what EFS v1/v2 already does with EAS UIDs — keep it); (2) expiry/deadlines baked into the signed artifact (VC `expirationDate`, EAS delegated `deadline` — cheap, underused); (3) advisory revocation for the post-chain/replicated regime, where a revocation is itself a portable signed *statement* by the same author, replicated alongside the data, and "current" is resolved lens-side (first-attester-wins gives EFS a coherent precedence rule the VC world lacks). StatusList's two good ideas — batch status into one herd-private artifact, let the *presenter* staple it — port directly to "replicas carry the author's revocation claims with the data."

### 1.3 DID methods — the identity-durability spectrum

| Method | Rotation | History / old-signature verification | Infrastructure dependency | Portability | 100-yr fitness |
|---|---|---|---|---|---|
| **did:key** | none — "cannot be updated or deactivated"; identifier *is* the key | n/a (key never changes) | none (purely generative) | perfect | spec itself discourages use beyond "weeks to months" without HSM ([did:key](https://w3c-ccg.github.io/did-key-spec/)) |
| **did:pkh** | none — "No updates possible… intended for local-only usage" | n/a | none (CAIP-10 account string) | the *string* is portable; a contract account behind it is not | EOA: durable-but-frozen; smart account: see §3(e) ([did:pkh draft](https://github.com/w3c-ccg/did-pkh/blob/main/did-pkh-method-draft.md)) |
| **did:web** | yes (replace the JSON) | **none** — "no guidance exists regarding whether previously signed material remains valid after rotation"; no signed audit trail | DNS + TLS + hosting; "Delete action MAY be performed by domain name registrars" | none (name = domain) | fails on issuer death, registrar action, or domain lapse ([did:web](https://w3c-ccg.github.io/did-method-web/)) |
| **did:ethr** (context) | yes, via ERC-1056 registry events | yes, on that chain | one specific chain, forever | chain-bound | inherits chain lifetime |
| **did:ion** | yes (Sidetree batches on Bitcoin + IPFS CAS) | yes in principle | Bitcoin + IPFS + ION node network | chain-anchored | **abandoned by its main sponsor** — Microsoft removed did:ion from Entra Verified ID (preview ended Dec 2023) and moved to did:web ([MS Learn](https://learn.microsoft.com/en-us/entra/verified-id/whats-new), [FAQ](https://learn.microsoft.com/en-us/entra/verified-id/verifiable-credentials-faq)) |
| **did:webvh** (ex-did:tdw) | yes + **pre-rotation** commitments | yes — hash-chained signed log, "resolve the state of a DID Document at a point in the past" | web hosting, but log is self-certifying via **SCID**; DID can *move domains* "while retaining… the DID's verifiable history" | designed-in | the ecosystem's own correction of did:web ([didwebvh v1.0](https://identity.foundation/didwebvh/v1.0/)) |
| **KERI** | yes + pre-rotation (each rotation pre-commits to digests of the *next* keys) | yes — KEL is "a doubly (backward and forward) hash chained non-repudiably signed append-only verifiable data structure" | witnesses/watchers, but "intervening operational infrastructure [is] replaceable… event logs may be served up by any infrastructure including ambient infrastructure" | designed-in ("ledger portability") | strongest design; weakest ecosystem ([KERI paper](https://arxiv.org/abs/1907.02143), [IETF draft](https://weboftrust.github.io/ietf-keri/draft-ssmith-keri.html)) |

Two lessons stand out:

1. **The market's revealed preference is convergent**: did:web was too mutable/unverifiable, did:key/did:pkh too frozen, did:ion too heavy and it died — and the correction (did:webvh) independently re-derived KERI's shape: *self-certifying identifier (hash of inception state) + portable signed event log + pre-rotation*. When two lineages converge on one architecture, that architecture is probably the answer-shape.
2. **Microsoft's ION retreat is the cautionary tale for chain-anchored identity**: the best-funded chain-anchored DID method in existence was walked back to DNS because operating the anchoring infrastructure (Bitcoin + IPFS + Sidetree nodes) wasn't worth it to the sponsor. Century-scale identity cannot depend on any single operator's continued enthusiasm — which cuts *against* bespoke identity chains and *for* identity artifacts that any substrate can host (KEL-style).

KERI honesty note (commentary, not primary): criticisms center on complexity, a small implementation ecosystem, and liveness/duplicity-detection depending on witness/watcher gossip — i.e., its guarantees against a *deliberately equivocating* controller are weaker without some ordering service. A chain is an excellent ordering service. EFS sits in the unusually good position of having chains available as KEL witnesses without *binding identity to* any one of them.

### 1.4 Why VC adoption underwhelmed

Primary post-mortem: Riley Hughes (Trinsic co-founder), ["Why Verifiable Credentials Aren't Widely Adopted & Why Trinsic Pivoted"](https://rileyparkerhughes.medium.com/why-verifiable-credentials-arent-widely-adopted-why-trinsic-pivoted-aee946379e3b) (2024):

- **The interoperability paradox**: "VCs need innovation, iteration, and experimentation to succeed. But they also need standardization, agreement, buy-in, and stagnation to have value." Standardize-before-product-market-fit failed: "prematurely standardizing a pre-product/market fit technology won't work."
- **Worse UX now for better UX later**: "100% of the AI developers we talked to just chose to use OAuth" over wallet+credential flows.
- **Scattered demand, no network-effect pocket**: adopters "from Myanmar to Peru to USA to Romania"; asked whether anyone had seen a credential *reused across contexts* — the entire point — "no hand went up."
- **Outcome data**: "roughly 1 breakaway customer story per 500 companies that signed up"; the winners (Plaid, Incode, Footprint, one $75M-funded "proprietary SSI" firm with tens of millions of users) shipped **proprietary** reusable ID.
- Trinsic pivoted from issuing VCs to *accepting* whatever fragmented IDs exist — a bet on permanent fragmentation.

Corroborating structural evidence:

- **eIDAS 2.0 / EUDI wallet sidelined W3C VC**: the ARF mandates **SD-JWT VC (IETF)** and **ISO 18013-5 mdoc** for PID/QEAA; W3C VCDM is optional and only for non-qualified attestations ([walt.id eIDAS2 guide](https://walt.id/eidas2), [EWC RFCs](https://github.com/EWC-consortium/eudi-wallet-rfcs/blob/main/ewc-rfc002-present-verifiable-credentials.md)). The largest regulated deployment on Earth chose the OAuth-adjacent format over the semantic-web one. Boring, tooling-adjacent envelopes win.
- **Long-lived credentials are an unsolved governance problem**: Bochnia & Anke, ARES 2024 best paper ([ACM](https://dl.acm.org/doi/10.1145/3664476.3669933)): "if the issuer dissolves, the SSI trust triangle is broken"; "almost any LLVC will need a long-lived revocation mechanism, and as revocation is already a difficult problem, long-lived revocation will likely be even more challenging"; durability requires "sustainable governance structures that extend beyond the life of the issuer." The VC stack has no answer to issuer death — EFS's core requirement.
- **Verify-don't-trust is still being fought over there**: the June 2025 **No Phone Home** campaign (ACLU, EFF, EPIC, CDT, Schneier, ~100 signatories) formed because ISO 18013-5's server-retrieval mode lets issuers observe every verification ([Biometric Update](https://www.biometricupdate.com/202506/no-phone-home-campaign-waves-red-flag-over-server-retrieval-for-digital-id), [statement coverage](https://commsrisk.com/experts-and-ngos-back-no-phone-home-campaign-against-digital-id-that-enables-surveillance/)). Any EFS mechanism whose *verification path* touches an author-controlled endpoint imports this failure class.

**Synthesis:** what failed was not signature portability — that works and nobody disputes it. What failed: (1) every place a live server crept back into the trust path; (2) committee-first standardization with N proof formats; (3) no adoption pocket with network effects; (4) no story for issuer death. EFS should read (3) as a warning about generality-first, and (4) as its own reason to exist.

---

## 2. The attestation-registry family

### 2.1 EAS onchain — precise recap (verified from source)

From [`EAS.sol`](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/EAS.sol): UID = `keccak256(schema, recipient, attester, time, expirationTime, revocable, refUID, data, bump)` where `time` is set from block time at creation and `bump` increments on collision. No chainId in the preimage — but the UID is unknowable pre-mining (the EFS journey's step 1) and meaningful only against one chain's history.

**Deployment reality** ([eas-contracts README](https://github.com/ethereum-attestation-service/eas-contracts)): addresses and versions differ per chain — Ethereum mainnet v0.26 `0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587`; Arbitrum One v0.26 `0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458`; Polygon v1.3.0 `0x5E634ef5355f45A855d02D66eCD687b1502AF790`; only OP-Stack chains share the predeploys (`0x4200…0021` EAS / `0x4200…0020` SchemaRegistry, v1.0.1 on OP and Base). "Same address on every chain" is true only inside one governance family (OP-Stack), and **contract version strings diverge across chains** — this matters below.

### 2.2 EAS offchain attestations — the exact portability finding (CONFIRMED)

From [`eas-sdk/src/offchain/offchain.ts`](https://github.com/ethereum-attestation-service/eas-sdk/blob/master/src/offchain/offchain.ts):

**Signature domain — chain-bound on three axes.** The EIP-712 domain is:

```
name:              "EAS Attestation"        // signing type domain
version:           this.config.version      // = the EAS *contract* version on that chain ("0.26", "1.0.1", "1.3.0"…)
chainId:           this.config.chainId
verifyingContract: this.config.address      // = that chain's EAS deployment address
```

So yes — **confirmed precisely**: an EAS offchain attestation's EIP-712 domain binds `chainId` AND `verifyingContract` AND a per-chain contract `version` string. A signature produced against mainnet's domain (`0.26`, `1`, `0xA120…`) cannot verify against Optimism's (`1.0.1`, `10`, `0x4200…21`). Even if EAS had used CREATE2 for identical addresses everywhere, the *version divergence alone* would fork the domain. Verifying an old offchain attestation therefore requires knowing the origin chain's historical deployment parameters — the artifact carries an implicit dependency on a specific deployment.

**UID — chain-free.** The offchain UID is `solidityPackedKeccak256` over `[version(uint16, v1+), schema, recipient, time, expirationTime, revocable, refUID, data, salt(v2), bump=0]` — **no chainId, no verifyingContract**. Version evolution: Legacy → v1 (adds a `version` field to the typed data) → v2 (adds `bytes32 salt`, auto-filled with `randomBytes` — the same uniqueness-under-identical-payload move EFS's v2 design makes with its salt rules; convergent evolution worth noting).

**The resulting split-brain is the single most instructive datum in this report:** EAS offchain attestations have a *portable name* and a *non-portable proof*. The UID can be cited anywhere; the signature verifies only against one deployment's domain. Is it "replayable across chains"? As an *artifact*, yes — anyone can present it anywhere, and its UID doesn't change. As a *verifiable statement admissible to another chain's EAS*, no — there is no import path, and the domain check fails by construction. What breaks cross-chain: signature verification (domain mismatch), timestamping (chain-local, below), and revocation (chain-local, below).

**Timestamping & offchain revocation are chain-local.** `timestamp(bytes32)` stores `_timestamps[data] = time` on one chain; `revokeOffchain` stores `_revocationsOffchain[msg.sender][data] = time` — keyed by **msg.sender** (verifiers must check revoker == attester; anyone can "revoke" any hash in their own namespace). So even the fully-offchain artifact's *lifecycle* (proof-of-existence, revocation) re-binds to specific chains, and checking revocation of a multi-chain-presented offchain attestation is an unbounded cross-chain search unless a convention pins the lookup locus. Note also: `msg.sender`-keyed revocation means a smart-account attester's revocation authority doesn't travel to chains where that account doesn't exist — identity and lifecycle degrade together.

**Delegated attestations and ERC-1271** (from [`EIP1271Verifier.sol`](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/eip1271/EIP1271Verifier.sol)): EAS verifies delegated attest/revoke requests via OpenZeppelin `SignatureChecker.isValidSignatureNow(request.attester, hash, sig)` — accepting **both** ECDSA and ERC-1271 contract signatures — with **sequential per-attester nonces** (`_nonces[request.attester]++`, plus voluntary `increaseNonce()`) and optional deadlines. Three EFS-relevant observations:
1. EAS already implements "recover/validate author from signature, relayer pays gas" — the kernel-prize pattern — and lenses keying on `attester` survive it (consistent with the EFS write-UX memory: attester stays the user).
2. ERC-1271 validity here is `isValidSignatureNow` — time-of-check, chain-local, liveness-dependent. The exact non-portability EFS worries about in hard part (e), embodied in production code.
3. **Sequential nonces are the wrong idempotency tool for EFS**: they exist to *forbid* replay. EFS's LOCKSS model *wants* replay (same artifact, many chains) to be *harmless*, which deterministic IDs + first-writer-wins registry + salt-based uniqueness already provide. Copy the `deadline`; skip the sequential nonce for portable artifacts (or scope nonces per-chain for gas-sponsorship abuse control only).

### 2.3 Verax (Consensys/Linea)

Architecture: Router + AttestationRegistry + SchemaRegistry + ModuleRegistry + PortalRegistry; issuers write through **Portals** with **Module** validation chains — a reasonable policy/storage separation (analogous to EFS resolvers). Deployed on several EVM chains (Linea-first; repo: [Consensys/linea-attestation-registry](https://github.com/Consensys/linea-attestation-registry)).

**IDs — verified from [`AttestationRegistry.sol`](https://github.com/Consensys/linea-attestation-registry/blob/dev/contracts/src/AttestationRegistry.sol):** a `uint32 attestationIdCounter` increments per attestation; the ID is `bytes32(abi.encode(chainPrefix + id))` where `chainPrefix` is a `uint256` whose low 240 bits must be zero (`ChainPrefixFormatInvalid` otherwise — i.e., the prefix lives in the top 16 bits), set **once** in `initialize(address _router, uint256 _chainPrefix)` and immutable thereafter. Network prefixes are maintained in the repo's `script/utils.ts`.

Read this as the **retrofit fossil record**: Verax v1 shipped bare counters on Linea; going multichain forced v2 to add chain prefixes — which only make IDs *collision-free for aggregators*, not portable. An attestation's identity is "the Nth write on chain X": replaying content to another chain renumbers everything and severs every `replacedBy`/reference. Counter IDs are the maximally anti-LOCKSS choice. Also note `massImport(payloads, portal) onlyOwner` — migration/backfill exists only as a registry-owner backdoor, i.e., replication is a privileged operation. Revocation is portal-gated (`revoke` checks caller is the issuing portal and portal revocability); `replacedBy` gives supersession pointers (chain-local, by construction).

### 2.4 Sign Protocol (ex-EthSign)

From [docs.sign.global](https://docs.sign.global/) (llms-full corpus): schema and attestation IDs are **`uint64` sequential per deployment**; storage modes "Fully on-chain (EVM, Starknet, Solana, TON) / Fully Arweave / Hybrid (on-chain references + off-chain payloads)" with a `DataLocation` enum `{ONCHAIN, ARWEAVE, IPFS, CUSTOM}`; the docs themselves warn "Storage on IPFS is free but not permanent. We recommend Arweave over IPFS." Delegated creation: "attester will be the address found in the Attestation object… if a delegate signature is supplied" — same relayer pattern as EAS. In fully-offchain mode they accept "ANY form of consent generated by ANY algorithm, as long as they can be independently verified" (secp256r1, RSA, …) — maximal flexibility that pushes verification *policy* onto every verifier (the VC proof-zoo mistake in miniature).

**How do they handle cross-chain attestation portability? They don't — they aggregate.** "SignScan is Sign's indexing and aggregation service, providing REST and GraphQL APIs that unify data across all supported chains." Attestations are chain-specific; the multi-chain story is a trusted, centralized query layer. For EFS's verify-don't-trust requirement (reader verifies path→file→bytes without trusting an indexer), this is the named anti-pattern: **"multi-chain" without portable identity degenerates into indexer-mediated union**, and the indexer becomes the de-facto root of trust. Their Arweave recommendation is also a quiet concession that general-purpose chains aren't the DA layer for content payloads.

---

## 3. Scoring against EFS's five hard parts

**(a) Revocation without a consensus substrate.** Survey result: no surveyed system does it. StatusList = live issuer server (dies with issuer); accumulators = failed at scale; CRSet = *uses a chain* as the neutral bulletin board; EAS offchain revocation = chain-local msg.sender registry; VC expiry = the only mechanism needing nothing. Design space for EFS: chain-scoped revocation while chains live (status quo, keep) + expiry-in-artifact where semantics allow + author-signed revocation *statements* that replicate with the data for the post-origin-chain regime, with lens-side precedence (first-attester-wins already gives EFS the conflict rule Nostr lacks). Un-signing is impossible; the achievable target is "any verifier holding a reasonably fresh replica set sees the revocation," which is the same guarantee StatusList-with-stapling actually delivers — minus the live server.

**(b) Spam/sybil without gas.** The VC world's answer is issuer gatekeeping (the issuer *is* the rate limiter); registries' answer is gas. Nothing here for EFS beyond confirming there's no free lunch — a signature-authenticated kernel with gasless relaying re-imports the spam problem at the relayer/registry boundary (EAS's delegated path just moves the gas to the relayer; nonces/deadlines bound abuse per-attester but don't price it).

**(c) Consensus on "what exists / what's current."** VCs dodge it (holder presents; verifier never enumerates). SignScan answers it with a trusted indexer. Verax/EAS answer it per-chain with registry state. Only consensus substrates actually answer it; EFS's per-chain first-writer-wins registries + deterministic IDs (so all replicas *agree on names* even while disagreeing on presence) is already ahead of everything surveyed.

**(d) On-chain composability.** Decisive registry-family advantage: EAS resolvers/Verax modules give contracts attest-time hooks and synchronous reads; the VC stack offers contracts nothing (verifying an RDF-canonicalized LD-proof on-chain is impractical; even SD-JWT is hostile). Any EFS drift toward "just signed artifacts, chains optional" pays this cost: contracts can only consume what some transaction has *imported into state*. The v2 design's split (portable signed artifact as the authenticity root; per-chain registry instantiation as the composability/indexing layer) is the correct synthesis — the artifact travels, and each chain's registry is a verified *cache* of it that contracts can read.

**(e) Signature portability vs identity durability.** The spectrum, end to end: `did:key`/`did:pkh`-EOA = signatures verify anywhere forever (ecrecover), identity frozen to one key (spec-discouraged beyond weeks-to-months); `did:web` = rotatable but server-dependent, history-free, registrar-deletable; ERC-1271 (per EAS's own `isValidSignatureNow`) = rotatable but contract- and chain-bound, time-of-check, liveness-dependent — does not travel; `did:ion` = chain-anchored rotation, operationally abandoned; **KERI / did:webvh = the reconciliation**: a self-certifying identifier (digest of the inception event = initial keys + pre-rotation commitment) plus a portable hash-chained key-event log that any infrastructure can serve, giving (i) signatures verifiable anywhere *against the KEL state at signing time*, (ii) rotation without changing the identifier, (iii) historical resolution ("what were the valid keys at time T" — [didwebvh](https://identity.foundation/didwebvh/v1.0/) does this natively), (iv) no permanent dependency on any host or chain. Concrete EFS shape: author identity = self-certifying ID; the KEL itself stored *as EFS data* (the archive carries its own identity layer, matching the Codex self-hosting doctrine); chains used as KEL witnesses/timestampers (solving KERI's duplicity-detection weakness with infrastructure EFS already has); EOA-only authors are the degenerate single-event KEL, so the simple case stays simple. This also preserves the kernel prize: recover-from-signature, then check against the author's KEL instead of a bare address — gasless relaying intact.

---

## 4. Copy / Avoid for EFS

### Copy
1. **VC artifact model**: self-contained signed claims verifiable offline with no origin-server dependency; explicit media types/envelopes. This is the proven core — EFS's portable authorship signature is this, minus the format zoo.
2. **One boring signature suite**: eIDAS chose SD-JWT/mdoc because they sit next to existing tooling; EFS's equivalent is plain EIP-712/ECDSA (`ecrecover` = the universally-verifiable primitive of the EVM century).
3. **Chain-free ID + salt** (EAS offchain v2 UID: no chainId/contract in the hash, random salt for uniqueness): convergent with EFS deterministic IDs — take it as independent confirmation of the design.
4. **Stapling / replica-carried status**: holder-supplied revocation evidence (Bitstring §stapling) → "replicas carry the author's revocation claims"; verification never phones home.
5. **Herd-privacy floors as spec MUSTs** (131,072-entry minimum): when EFS specs privacy-relevant batching (lens queries, status artifacts), mandate the anonymity-set floor in the spec, not the SDK.
6. **Deadline fields in delegated/portable write artifacts** (EAS): cheap, chain-free bounded-validity; a partial revocation substitute.
7. **KERI/did:webvh identity shape**: self-certifying ID + portable hash-chained pre-rotation key-event log, hosted as EFS data, chains as witnesses; historical ("keys at time T") verification semantics. The only surveyed reconciliation of hard part (e).
8. **SignatureChecker duality** (ECDSA + ERC-1271) for *live, chain-local* write paths specifically — fine at the registry write boundary, never as the portable-artifact verification rule.
9. **Chain-as-revocation-bulletin-board** (CRSet direction): while chains live, they're the credibly neutral, availability-guaranteed status host the VC world wishes it had; EFS gets this for free by keeping revocation as chain-scoped claims.

### Avoid
1. **chainId / verifyingContract / deployment-version in the signature domain of portable artifacts** — EAS offchain's exact trap, on three axes (chainId, address, per-chain version string). EIP-712 domain separation exists to *forbid* replay; EFS must instead make replay *harmless* (deterministic IDs, idempotent first-writer registry) and bind domains to spec-owned constants (`efs.…v1` pattern, exactly like `deterministic-ids.md` already does). Domain-separate by *meaning*, never by *deployment*.
2. **Issuer/author-hosted mutable URLs as validity conditions** (StatusList's `STATUS_RETRIEVAL_ERROR`-with-no-fallback; did:web resolution): any verification path through a live author-controlled endpoint dies with the author and enables phone-home surveillance.
3. **Accumulator/tails revocation**: 1GB issuer-hosted tails files, slow proofs, trackable fetches; empirically failed at scale.
4. **Counter IDs, even chain-prefixed** (Verax): ordinal identity is maximally anti-LOCKSS; prefixes fix aggregator collisions, not portability; migration becomes an `onlyOwner` backdoor (`massImport`).
5. **Centralized aggregator as the cross-chain truth** (SignScan): "multi-chain" without portable IDs = trusted-indexer union, the negation of verify-don't-trust.
6. **Sequential nonces on portable write artifacts**: they forbid the replay EFS wants; use salt/ID idempotency, keep nonces (if any) chain-scoped for relayer-abuse control.
7. **"Any algorithm" signature acceptance** (Sign offchain) and proof-suite proliferation (VC DI/JOSE/COSE/SD-JWT/AnonCreds): each extra suite is a century-scale verification liability; one suite + a documented succession path (hash-migration-playbook style) instead.
8. **Mutable-resolution identity roots** (did:web) and **non-rotatable-only identity** (did:key/did:pkh frozen keys, spec-discouraged long-term) — both ends of the spectrum fail alone; ship the degenerate-KEL EOA case with a documented rotation/succession path rather than freezing "author = bare key hash" forever.
9. **Chain-anchored identity whose operation depends on one sponsor** (ION): if the anchoring machinery isn't self-serve from commodity infrastructure, its lifetime is one corporate strategy review.
10. **ERC-1271 as an authenticity root for portable artifacts**: `isValidSignatureNow` is chain-local and time-of-check; EAS's own delegation code demonstrates it — valid for live gating, meaningless in an archive after the contract/chain is gone.
11. **Standardize-before-product** (Trinsic): EFS's devnet-only, all-ADRs-reopenable posture is the correct inversion; don't freeze artifact formats to court interop partners that don't exist yet.

---

## 5. Sources

**Primary (specs/source, fetched 2026-07-02):**
- EAS SDK offchain: https://github.com/ethereum-attestation-service/eas-sdk/blob/master/src/offchain/offchain.ts (domain + UID computation, versions Legacy/1/2)
- EAS contracts: https://github.com/ethereum-attestation-service/eas-contracts (README deployment table); `contracts/EAS.sol` (UID, timestamp, revokeOffchain); `contracts/eip1271/EIP1271Verifier.sol` (SignatureChecker, nonces, deadlines)
- Verax: https://github.com/Consensys/linea-attestation-registry — `contracts/src/AttestationRegistry.sol` (counter + chainPrefix + massImport); docs https://docs.ver.ax/verax-documentation/core-concepts/attestations
- Sign Protocol docs corpus: https://docs.sign.global/llms-full.txt
- W3C VC Data Model 2.0: https://www.w3.org/TR/vc-data-model-2.0/ ; Bitstring Status List: https://www.w3.org/TR/vc-bitstring-status-list/ ; vc-jose-cose: https://www.w3.org/TR/vc-jose-cose/
- did:key: https://w3c-ccg.github.io/did-key-spec/ ; did:web: https://w3c-ccg.github.io/did-method-web/ ; did:pkh: https://github.com/w3c-ccg/did-pkh/blob/main/did-pkh-method-draft.md ; did:webvh: https://identity.foundation/didwebvh/v1.0/
- KERI: https://arxiv.org/abs/1907.02143 ; https://weboftrust.github.io/ietf-keri/draft-ssmith-keri.html
- Microsoft ION removal: https://learn.microsoft.com/en-us/entra/verified-id/whats-new (did:ion preview ended Dec 2023; did:web only) ; https://learn.microsoft.com/en-us/entra/verified-id/verifiable-credentials-faq
- CRSet: https://arxiv.org/abs/2501.17089

**Commentary/secondary (labeled as such in text):**
- Riley Hughes / Trinsic post-mortem (2024): https://rileyparkerhughes.medium.com/why-verifiable-credentials-arent-widely-adopted-why-trinsic-pivoted-aee946379e3b
- AnonCreds revocation scalability: https://cheqd.io/blog/anoncreds-indy-pendence-1/ ; https://hyperledger-indy.readthedocs.io/projects/sdk/en/latest/docs/design/002-anoncreds/README.html ; https://aca-py.org/latest/gettingStarted/CredentialRevocation/
- eIDAS 2.0 formats: https://walt.id/eidas2 ; https://github.com/EWC-consortium/eudi-wallet-rfcs/blob/main/ewc-rfc002-present-verifiable-credentials.md ; https://darutk.medium.com/issuing-verifiable-credentials-in-the-sd-jwt-vc-and-mdoc-mdl-formats-mandated-in-eidas-2-0-87a232cfcc2a
- Long-lived VCs (ARES 2024): https://dl.acm.org/doi/10.1145/3664476.3669933 (abstract/summary via search; full text paywalled at fetch time)
- No Phone Home (June 2025): https://www.biometricupdate.com/202506/no-phone-home-campaign-waves-red-flag-over-server-retrieval-for-digital-id ; https://commsrisk.com/experts-and-ngos-back-no-phone-home-campaign-against-digital-id-that-enables-surveillance/ ; https://phil.windley.org/archives/2025/06/lets_stop_phoning_home.shtml

**Staleness notes:** EAS deployment versions/addresses read from the repo README (current master, 2026-07); Verax code read from `dev` branch; Sign docs are the live corpus (their product focus has been shifting toward identity/"Sign ID" — attestation-protocol docs may lag the deployed contracts); VC 2.0 and Bitstring are W3C Recommendations (stable); did:pkh and did:web are CCG drafts (semi-stable); did:webvh v1.0 is a DIF spec under active development; CRSet is a 2025 preprint (unreviewed at fetch time).
