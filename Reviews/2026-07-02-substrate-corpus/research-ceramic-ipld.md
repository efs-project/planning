# Ceramic + IPFS/IPLD autopsy — substrate research for EFS

**Agent:** ceramic-ipld · **Date:** 2026-07-02
**Scope:** Ceramic (streams, event logs, CACAO, Ethereum anchoring, key rotation, adoption/death timeline, ComposeDB fate) and IPFS/IPLD (CIDs, IPNS, dag-cbor, pinning economics, Filecoin). Focus: blockchain anchoring of off-chain data as a consensus/ordering primitive — what Ceramic proved and disproved about it, and copy/avoid lessons for EFS.
**Method note:** All external claims cite URLs. Primary sources (specs, CIPs, official blog) are distinguished from commentary. Ceramic's official docs are partially link-rotted post-pivot (several developers.ceramic.network paths 404); where I relied on the legacy spec I say so. Data current as of July 2026 unless noted.

---

## 0. Verdict in one paragraph

Ceramic is the most complete real-world experiment in exactly the architecture EFS's journey keeps drifting toward: chain-free content-derived object IDs, portable signature-authenticated events (not msg.sender), off-chain event logs, and a blockchain used *only* as a batch-anchored clock. It ran that experiment at production scale for ~5 years and the company abandoned it in April 2025 — not because the anchoring cryptography failed (it worked), but because (1) earliest-anchor-wins ordering is unsound under data withholding, (2) anchoring buys ordering but not availability and not existence-consensus, (3) the anchor service was an unfunded, allowlisted, centralized chokepoint to the end, (4) rotatable DIDs (3ID) produced retroactively-invalid signatures and were replaced by *non-rotatable* wallet identity plus expiring session capabilities, and (5) apps that needed verifiable data went on-chain (Gitcoin Passport → EAS attestations) while apps that needed fast data went to Postgres — the middle position had no durable demand. IPFS supplies the complementary lesson: signed portable records and content addressing are solved problems (dag-cbor/CIDs are copyable), but every liveness-dependent layer above them (IPNS, pinning, free storage tiers) decayed exactly the way a 100-year archive cannot afford. EFS's instinct — keep the authoritative bytes and indices *on* the consensus substrate, treat everything off-chain as best-effort redundancy — is strongly validated by both autopsies.

---

## 1. Ceramic autopsy

### 1.1 What Ceramic was, structurally

Ceramic modeled all data as **streams**: append-only, DID-authenticated event logs stored as IPLD objects, replicated over libp2p, with three event types (legacy names in parentheses):

- **Init event (genesis commit)** — creates the stream. Fields: `controllers` (DID array), `data`, optional `schema`, `family`, `tags`, `unique`. "The CID of this commit is used to create the persistent StreamID of the stream, which is an immutable permalink" ([legacy spec](https://github.com/ceramicnetwork/.github/blob/main/LEGACY_SPECIFICATION.md)).
- **Data event (signed commit)** — an update; a **DAG-JOSE JWS** whose payload is a dag-cbor object containing `id` (link to init event), `prev` (link to previous event), and the mutation. Signature is a JWS by the controlling DID — authorship by signature, not by transaction sender. This is precisely EFS's "portable signed artifact" shape.
- **Time event (anchor commit)** — a proof that a given event CID existed before a blockchain timestamp; see §1.5.

Two structural observations that map directly onto the EFS v2 design:

1. **StreamID = hash of creation payload = chain-free deterministic ID.** Ceramic had portable, client-computable identity from day one, for free, via content addressing. Same-content collisions were handled by the `unique` field — a random nonce in the init payload, the exact analog of EFS's `salt` in `dataId`. Convergence: two independent systems arrived at (creator-signed payload + nonce) → hash as the identity of an *owned mutable thing*. EFS's derivation is more disciplined (fixed-width abi.encode, domain separation, spec-owned constants vs. "whatever dag-cbor bytes hash to"), but the shape is validated.
2. **Statements vs. things, Ceramic edition.** The stream ID names the *thing*; each event is a *statement*; the current state is a fold over statements ordered by anchors. EFS's split (deterministic object IDs vs. EAS-UID claims) is the same taxonomy with the fold executed on-chain by resolvers instead of on every reader's machine. Ceramic's version pushed the fold to readers — which meant every reader needed either a synced node or a trusted indexer, i.e. it failed EFS's verify-don't-trust test *in practice* even though it passed it in principle.

### 1.2 CACAO capabilities and sessions

[CAIP-74](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-74.md) defines the **CACAO**: a chain-agnostic object capability serialized as dag-cbor IPLD, carrying `{header (caip122|eip4361), payload (iss as did:pkh, aud, nonce, iat/nbf/exp, resources), signature (eip191|eip1271 …)}`. It reifies a Sign-in-with-Ethereum (EIP-4361) message as a portable, content-addressed, offline-verifiable delegation artifact (transported base64url-encoded or in CAR files).

How Ceramic used it ([did-session docs](https://developers.ceramic.network/docs/protocol/js-ceramic/guides/ceramic-clients/authentication/did-session)): the user's identity is `did:pkh:eip155:<chainId>:<address>` (their wallet). On login the wallet signs *one* SIWE message delegating write authority over specified resources (ComposeDB models) to an ephemeral in-browser `did:key`. Every subsequent event is signed by the session key and carries the CACAO in its envelope; verifiers check session-key signature + CACAO signature + expiry + resource scope. **Default session validity: 1 week** (configurable via `expiresInSecs`), after which the user must re-sign.

Properties relevant to EFS:

- **Portability of the delegation chain.** An `eip191` CACAO verifies anywhere forever with bare ecrecover — the chain reference in `did:pkh:eip155:1:0x…` is *naming metadata inside the payload*, not a verification domain separator. This is a genuine existence proof for EFS: you can have a chain-scoped *identity label* while keeping signature verification chain-free. Contrast EIP-712/EAS-offchain, where chainId sits in the signing domain and poisons portability.
- **The ERC-1271 hole is unsolved there too.** CACAO records `t: eip1271`, and verifying such a capability requires calling `isValidSignature` on a specific contract on a specific chain at a specific state — non-portable and non-archival (the contract can be upgraded, killed, or the chain can die). CAIP-74 offers no fix. Nobody has solved smart-account signature portability; Ceramic simply ate the asymmetry (EOAs portable, contract wallets not).
- **No revocation.** CAIP-74 has expiry (`exp`) but "no explicit revocation mechanism." Ceramic's mitigation was short default lifetimes — i.e., revocation-by-expiry, the same tradeoff Nostr-style systems make. Short expiry also means a *reader validating old events must accept expired CACAOs for data written during their validity window* — Ceramic nodes verified `exp` against the anchor timestamp, not wall-clock. **This is a load-bearing interaction: capability expiry only works if you have trustworthy timestamps for when the signed data was created — which is what anchoring supplied.** A signature-relay design without a time source cannot even do revocation-by-expiry soundly.

### 1.3 Key rotation: the 3ID failure — EFS hard part (e), field-tested

Ceramic's original identity was **3ID (did:3)**: a DID document stored *in a Ceramic stream*, so keys could be rotated by appending events. The [evolution blog](https://blog.ceramic.network/accounts-evolution-of-3id/) and issue trackers document the decay:

- **3IDv0** was immutable — "it was not possible to do any sort of key rotation."
- **3IDv1** made the DID document a mutable stream. Rotation then *depended on anchored ordering*: to validate an old signature you must know which key was valid at signing time, which requires a timestamp for both the signature and the rotation.
- The killer bug class ([js-3id-did-provider #138](https://github.com/ceramicstudio/js-3id-did-provider/issues/138)): **"Signatures made with unanchored keys can become retroactively invalid after a key rotation"** — a signature made between key creation and its anchor has no provable validity window; rotate, and history breaks.
- Secondary failures: DID documents were fully public (no private verification methods); CAIP-10 wallet links were permanently doxxing ("even if removed would leave a trace in the caip10-link event log"); long-lived keys forced an iframe key-management UX.
- Outcome: **3ID deprecated**; the recommendation became did:pkh + did-session ([forum](https://forum.ceramic.network/t/choosing-dids-with-ceramic/744), [docs](https://developers.ceramic.network/docs/advanced/standards/accounts/pkh-did/)) — "key rotations, changes, deactivation not supported, which actually simplifies the validation and security model."

**The lesson for hard part (e), stated sharply:** Ceramic tried durable-rotatable identity (3ID ≈ smart-account-like key registry, but off-chain) and portable signatures simultaneously, and discovered they interact catastrophically unless *every key event and every signature is anchored to a consensus clock before it is relied upon*. Their retreat was to make identity **non-rotatable** (a bare secp256k1 wallet) and push all rotation-like flexibility into **short-lived, expiring, portable delegations** (CACAO → did:key). That is a coherent landing zone EFS should study: the durable root stays simple and verification-portable (ecrecover); agility lives in an expiring delegation layer whose validity windows are established by the chain's clock. EFS has an advantage Ceramic lacked: EFS *has* a consensus substrate, so a key-rotation registry (e.g., the B′ smart account) can be consistently ordered on-chain — but the moment EFS wants signatures to outlive the origin chain, it re-enters exactly Ceramic's trap: an ERC-1271/B′-bound signature is not evaluable after the chain dies. A two-tier scheme (chain-bound smart-account identity for liveness; EOA-key or key-event-log with anchored windows for archival verification) is what the evidence points at.

### 1.4 Anchoring mechanics — the machine EFS asked about

**Pipeline** (from the [legacy spec](https://github.com/ceramicnetwork/.github/blob/main/LEGACY_SPECIFICATION.md), [CIP-69](https://cips.ceramic.network/CIPs/cip-69), [CIP-110](https://cips.ceramic.network/CIPs/cip-110), [CAIP-168](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-168.md), [how-it-works](https://ceramic.network/how-it-works), [community HackMD](https://hackmd.io/@SammyCodes/rk15SBeIs)):

1. Nodes POST anchor requests `(StreamID, CommitID)` to a **Ceramic Anchor Service (CAS)**.
2. CAS batches requests "into a single transaction on a regular interval" (spec leaves frequency to the operator; mainnet CAS ran continuous scheduled batches — the repo's config exposes a cron `ANCHOR_SCHEDULE_EXPRESSION`).
3. It builds a **binary merkle tree of event CIDs** (CIP-69): leaves sorted hierarchically by `family → schema → controllers → StreamID` so related updates cluster (enables binary search into a batch); the root node carries a third slot pointing to `TreeMetadata {numEntries, bloomFilter}` (bloom filter over family/schema/tags/controllers/StreamID, error rate 1e-4) — i.e., they engineered *queryability of the batch itself*.
4. It publishes **one Ethereum transaction** carrying the root. Two generations: originally a tx-to-self with the merkle-root CID in calldata ("an anchor is a transaction from a wallet to itself with data that represents a CID of a Merkle root"); later [CIP-110](https://cips.ceramic.network/CIPs/cip-110): a contract with `anchorDagCbor(bytes32 _root)` that just **emits an event** (root as the 32 hash bytes of the CID, no multibase/multicodec prefix), gated by an **owner-managed allowlist of CAS operators**. Mainnet anchoring was on Ethereum L1 (eip155:1); early testnets used Ropsten/Rinkeby/Gnosis.
5. CAS writes, for every batched event, a **time event** into the stream's log: `AnchorProof {chainId (CAIP-2), blockNumber, blockTimestamp, txHash (CID), root (CID)}` plus the **merkle witness path** (an IPLD path like `<root-cid>/1/0` down the tree). "The blockNumber and blockTimestamp are added for convenience, but these numbers need to be verified."
6. **Verification** ([CAIP-168](https://standards.chainagnostic.org/CAIPs/caip-168)): resolve the anchor; fetch the tx by hash from a chain RPC; check tx payload contains the root (per `txType`: raw-calldata vs CIP-110 event); walk the witness path from root to the event CID; take the block timestamp as the "existed-before" time. "Timestamps not already cached will need to be fetched from an Ethereum node."

**Cost model.** The on-chain marginal cost is one event-emitting tx per batch (≈25–50k gas) amortized over an arbitrarily large tree — per-event chain cost asymptotically zero. Ceramic correctly advertised "high-volume data at extremely low cost." The *real* costs were all off-chain:

- **Witness availability.** The merkle tree and paths live in IPFS, not on chain. CIP-110's own motivation: a malicious/negligent anchor service "withholding IPFS data needed to validate anchors" leaves streams with unverifiable timestamps — which is exactly why anchoring stayed **allowlisted** ("It is not permitted to create personal Ceramic Anchor Service but use the free community operated CAS"; mainnet required a waitlist and IP allowlisting by 3Box Labs). **An anchor whose witness data is lost is a 32-byte tombstone.** For EFS: witness paths are archival-class data and must live at the same durability class as the anchored content, or the anchor adds nothing at year 100.
- **Chain-history dependence.** Verification needs `eth_getTransactionByHash` / receipts for arbitrarily old blocks. Under EIP-4444-style history expiry, CAIP-168 proofs silently stop verifying against default nodes. The CIP-110 event-based variant is *worse* than contract storage here: events are precisely the thing EFS's own registry design refuses to depend on ("reconstructible from a documented state-walk — never dependent on event logs"). **If EFS ever anchors, anchor into contract *state* (e.g., an append-only root accumulator readable via storage proofs), not into calldata or logs.**
- **Service economics.** CAS was free, subsidized by 3Box Labs, permissioned, and single-operator for its entire life. Nobody else ever ran a production anchor service. Decentralized "self-anchoring" (each node anchors its own batches to any EVM chain — Gnosis/Ethereum/Polygon, `anchor-evm` in [rust-ceramic](https://github.com/ceramicnetwork/rust-ceramic)) shipped only at the end, as part of the wind-down, plus "self-anchoring to Recall" as the "one final critical feature… without relying on their centralized CAS or Ethereum L1" ([sunset post](https://blog.ceramic.network/the-future-of-ceramic-focusing-on-recall/)). A public-good anchoring service with no fee mechanism is a liability that lives exactly as long as its sponsor.

### 1.5 Consensus semantics: what anchoring actually bought — and the hole

Ceramic's ordering rule ([legacy spec](https://github.com/ceramicnetwork/.github/blob/main/LEGACY_SPECIFICATION.md), verbatim):

> "If there are two different branches for a specific stream's commit log, the canonical branch is determined by looking at the conflicting anchor commits to determine which update happened first. When both anchors are on the same blockchain, the blockheight of the anchor is used; if the anchors are on different blockchains, the block timestamp is used." Tie-break: "the update commit which has the smallest CID in binary format (an arbitrary but deterministic choice)."

So: **earliest anchor wins**, per stream, with cross-chain comparison by wall-clock block timestamp. This gives a total order over *revealed* branches without per-write gas. The acknowledged hole — the **late-publishing / data-withholding attack**:

> "A user creates a stream, makes two conflicting updates and anchors one of them earlier than the other, but only publishes the data of the update that was anchored later… if the user later publishes the data of the earlier update, the stream will fork back to this update and all of the other updates made to the stream will be invalidated."

The spec's mitigations are (i) social — "a 'double spend' would cause the user to lose all history and associations that have accrued on their identity," and (ii) procedural — "only allow anchor services that actively publish all created anchor commits when they are created" — i.e., **the fix for decentralized timestamping is a trusted publisher**, which is a contradiction Ceramic never escaped and one reason the CAS allowlist persisted. Note also that under earliest-anchor-wins, *finality is retroactively revisable forever*: any reader's fold can be reorganized by an old anchored branch surfacing. There is no finality horizon.

**Generalized:** merkle anchoring proves *existence-before-T* of whatever is revealed; it can never prove *non-existence of an earlier commitment*. Ordering derived from it is therefore sound only if commitments are guaranteed visible at anchor time — which requires the anchor substrate to also be a data-availability substrate for at least the commitment set. Ethereum gives EFS both in one place; Ceramic split them and fell in the gap. This is the single most transferable result of the whole autopsy: **anchoring is a clock, not a consensus.** It answers "when did this exist" and cannot answer "what is the complete set of things that exist" or "is this the current version" against an adversarial writer.

Corollaries mapped to EFS's hard parts:

- **(a) Revocation without a consensus substrate:** Ceramic implemented revocation-as-supersession ordered by anchors. It works against honest writers and fails against the writer themself (late publishing = un-revoking / re-revoking history). Advisory-deletion-plus-clock is strictly weaker than EAS on-chain revocation. If EFS's portable layer needs revocation that binds the *author*, the revocation registry must live on a substrate with availability consensus — or accept Ceramic's weakness with eyes open.
- **(c) Consensus on "what exists":** anchoring contributes *auditable checkpoints* (a bucket/replica can anchor its inventory root, making completeness claims falsifiable in retrospect) but not liveness or completeness guarantees. Ceramic layered **Recon** ([CIP-124](https://cips.ceramic.network/CIPs/cip-124)) for that: sortable EventIDs `(network, sort-value 8B, controller 8B, stream 4B, height, CID)` + associative range hashes + recursive range-splitting set reconciliation over declared *interest ranges*. Recon is genuinely good engineering (efficient partial replication, sharding by model/controller) and is the shape any EFS cross-replica sync would take — but it is gossip convergence among honest peers, not consensus.
- **(b) Spam/sybil without gas:** Ceramic's only answers were the centralized CAS rate limit and Recon interest-scoping (you simply don't sync controllers/models you don't care about — the read-side filter analogous to EFS lenses). No cost-to-write mechanism ever existed. Free writes + no fee market is part of why the infrastructure was unfundable.

### 1.6 ceramic-one, Recon, and the pivot timeline — 2024–2026 status

- **2023:** ComposeDB (GraphQL graph DB over streams) launches on mainnet (Feb) — the developer-facing bet.
- **2024:** Rewrite begins: **ceramic-one / rust-ceramic** — Rust node implementing Recon (CIP-124), replacing the single libp2p pubsub topic ("a lot of work on all nodes to process messages that they don't necessarily care about") with range-based sync; js-ceramic demoted to an API layer ([release post](https://blog.ceramic.network/new-ceramic-release-ceramic-one-with-new-ceramic-recon-protocol/)).
- **Early 2025:** 3Box Labs **merges with Textile** to form **Recall Labs** (Tableland/Basin lineage), refocusing on "the Intelligence Layer for AI Agents" ([announcement](https://blog.ceramic.network/ceramic-is-joining-textile/)).
- **April 17, 2025 — the sunset post** ([The Future of Ceramic: Focusing on Recall](https://blog.ceramic.network/the-future-of-ceramic-focusing-on-recall/)): js-ceramic and ComposeDB **deprecated effective immediately**; **ComposeDB and the CAS shut down** "at least one month after Recall's Mainnet launch," expected mid-2025. ceramic-one continues as MIT-licensed community software ("anyone who wants to fork it… is welcome"), with self-anchoring (EVM chains or Recall) shipped so it can live without CAS. The stated rationale: AI agents are the new user class, and Ceramic's "persistent UX challenges — key management and access control" suit agents better than humans.
- **2026:** rust-ceramic repo remains public with an SDK; ecosystem remnants (e.g., OrbisDB) continue on ceramic-one; there is no funded core-protocol steward. Practically: **Ceramic as a network is dead; Ceramic as a codebase is orphaned-but-forkable.**

### 1.7 Why adoption struggled (evidence, not vibes)

- **The flagship user's trajectory is the whole story.** Gitcoin Passport launched storing identity stamps on Ceramic ([Ceramic blog](https://blog.ceramic.network/gitcoin-builds-passport-on-ceramic/)). During the Feb 2023 Allo Alpha rounds, "donors were unable to verify their unique identity for most of the program due to infrastructure instability with Gitcoin Passport" — documented in a public postmortem ([Gitcoin governance](https://gov.gitcoin.co/t/lessons-learned-a-look-at-gitcoin-allo-alpha-rounds-and-the-path-forward-with-gitcoin-passport/13011)). Passport then moved to a **Postgres-primary / Ceramic-secondary** hybrid, and its verifiable path went **on-chain as EAS attestations** ([onchain passports docs](https://docs.passport.gitcoin.co/building-with-passport/major-concepts/onchain-passports)). Squeezed from both sides: Postgres beat it on speed/reliability; on-chain attestations beat it on verifiability and composability. **EFS's positioning (verifiable part directly on the consensus substrate) is the side of that squeeze that won.**
- **On-chain composability was a real demand and Ceramic had none** — hard part (d) data point: no contract could ever read a stream; every dapp integration needed an off-chain verifier. The observable market said apps *do* want attestation state readable by contracts (Passport scores are consumed by contracts via EAS).
- **Reader trust model never closed.** State = fold over events ⇒ readers ran nodes (ops burden, sync lag, pre-Recon pubsub firehose) or trusted a gateway/indexer — the verify-don't-trust property existed only for whoever paid the node tax.
- **Write UX friction:** DID sessions, weekly re-signing, "pending" writes until anchored, occasional retroactive reorder — versus "just Postgres" for the 99% of app data that never needed neutrality.
- **No economic loop:** no fee for writes, storage, anchoring, or reads; infra costs fell on 3Box Labs (CAS, gateways, bootstrap nodes) with VC runway as the only revenue. The pivot to Recall (a token-incentivized chain) is the team's own admission that the missing piece was an economic engine, not throughput.
- The sunset post's epitaph claims "dozens of applications" — after ~$30M+ raised and 5 years, *dozens*, and the company still walked away.

---

## 2. IPFS / IPLD autopsy

### 2.1 CIDs — copy the multiformat discipline, avoid the codec-identity conflation

A CIDv1 = `multibase(version ‖ multicodec ‖ multihash(digest))` — self-describing hash agility. Two EFS-relevant edges:

- **Copy:** multihash's explicit hash-function byte is the mature version of EFS's "hash-migration playbook" (§13.6 of deterministic-ids): new hash = new prefix, old IDs stay valid opaque names forever, no rewrite. EFS's `contentHash` convention already commits to "multibase-multihash" — correct choice; keep it byte-frozen in the Codex.
- **Avoid:** the codec sits *inside* the identity, so identical bytes have different CIDs as `raw` vs `dag-pb` vs `dag-cbor`; worse, a *file's* CID depends on chunker settings (default 256 KiB), DAG layout (balanced vs trickle), raw-leaves flag, CIDv0/v1 — the "same file, many CIDs" problem that breaks deduplication and cross-system citation in practice ([IPFS docs on immutability/CIDs](https://docs.ipfs.tech/concepts/content-addressing/)). EFS's ADR-0049 stance (identity ≠ content; contentHash is a *claim over exact bytes*, not an ingestion-parameterized DAG) dodges this entirely — keep dodging it. If EFS ever specifies chunked large-file hashing, the chunking parameters must be part of the frozen convention or the "same bytes" cease to have one hash.

### 2.2 DAG-CBOR as a portable record format candidate

The [DAG-CBOR spec](https://ipld.io/specs/codecs/dag-cbor/spec/) is the strictest widely-deployed deterministic binary record format: map keys "sorted in (byte-wise) lexical order, including their major type 3 and length"; integer and length encodings "as short as possible"; floats always 64-bit; no NaN/Infinity; no indefinite-length items; the only tag is 42 (CIDs, encoded as `0x00`-prefixed byte strings, tag token exactly `0xd82a`). It has serious ecosystem gravity: Ceramic events, ATProto records/repos, Filecoin chain state are all dag-cbor.

- **Copy (if EFS builds a portable signed-record layer):** dag-cbor + a JWS/COSE-style envelope (Ceramic's dag-jose) is the proven stack for chain-free signed artifacts; tooling exists in every language; content-addresses natively.
- **Avoid / eyes-open:** determinism is a *spec* property, not an *ecosystem* property — "decoders may relax this": Go accepts IEEE-754 specials, JS mangles >2^53 integers, most decoders accept unsorted maps. Round-trip re-encode-and-compare at acceptance time (exactly EFS's canonical-name round-trip rule) is mandatory or IDs fork silently. Note the philosophical match with deterministic-ids §1: EFS chose `keccak(abi.encode(fixed-width words))` — a *simpler* determinism domain than dag-cbor's (no maps, no varints, no floats). For on-chain derivation that's strictly better; dag-cbor is the candidate only for the off-chain portable-statement wrapper, not for ID preimages.

### 2.3 IPNS — the cautionary mutable-pointer tale

IPNS = signed, versioned name records (`sequence`, `validity`, TTL) published to the DHT ([docs](https://docs.ipfs.tech/concepts/ipns/)). Weaknesses, measured and structural:

- **Liveness-coupled:** records expire and must be **republished (Kubo default every 4 h; record lifetime default 48 h)**; "the publisher needs to stay online." A name whose keyholder stops republishing goes dark even though every signature remains valid — *the naming layer dies before the data does*.
- **Slow:** ProbeLab's Aug 2025 measurement on the public DHT ([study](https://probelab.io/blog/ipns-performance-amino-dht)): resolution median ~11 s (P50 7–11 s, tails 37–60 s), quorum 16 peers queried per resolve; conclusion "user experience is generally bad." Correctness was fine (100% success in-window) — it's the architecture, not bugs.
- **No history, latest-wins:** highest sequence number wins; there is no verifiable past — a reader can be replayed a stale record if fresher ones are unreachable; there is no way to cite version N.

For EFS this is the anti-pattern for hard part (c): mutable pointers whose currency depends on publisher/network liveness cannot serve a 100-year archive. EFS's on-chain anchors + first-writer-wins registry is the opposite (state, not heartbeat). If any EFS overlay ever needs off-chain mutable pointers, IPNS demonstrates the minimum bar: signed + sequenced is not enough without an availability substrate and a history.

### 2.4 Pinning economics — the free-tier extinction event (2024–2025)

Content on IPFS persists only while *someone* pins it; pinning is a service business with no protocol-level payment. The last two years falsified the "altruistic availability" assumption at scale:

- **NFT.Storage Classic**: uploads **decommissioned June 30, 2024**; existing data kept on a best-effort gateway with the explicit caveat that "latency and availability may degrade over time"; replaced by a *paid, one-time-fee endowment* model ([announcement](https://nft.storage/blog/important-product-updates-nft-storage-is-evolving), [2025 transition](https://nft.storage/blog/nft-storage-operation-transitions-in-2025) — operations handed to Storacha & Lighthouse).
- **web3.storage** → rebranded **Storacha** and "dropped IPFS pinning altogether" in favor of UCAN-based hot storage on Filecoin ([storacha.network](https://storacha.network/)).
- **Cloudflare** sunset its public IPFS gateways; **Scaleway** shut down its pinning service; Infura's IPFS API was likewise deprecated (widely reported; verify if load-bearing).
- What remains is paid pinning (Pinata, Lighthouse, Filebase): fine businesses, but "requiring periodic payments to keep pins active" — rental, not archival.

**Lesson:** subsidized availability is a decaying asset with a ~3–7 year half-life. EFS's durability-class labeling (on-chain bytes = archival; mirrors = best-effort) and the hash-verified cross-attester mirror fallback are the right structural responses; this history is the citation for why they're non-negotiable. It also quantifies the LOCKSS point: copies must be *cheap to make and verify* (EFS: IDs recompute + contentHash match) because any individual host's promise is worthless at century scale.

### 2.5 Filecoin — subsidy-distorted rental, not permanence

- Utilization: ~**29–36%** of committed capacity holds any data at all through 2025 ([Messari Q3 2025](https://messari.io/report/state-of-filecoin-q3-2025), [roadmap coverage](https://depinscan.io/news/2025-07-23/filecoin-s-vision-for-2025-achieving-full-paid-storage-capacity)); the "full-paid storage" target is aspirational.
- Demand is dominated by **Filecoin Plus**: verified deals get a 10× reward multiplier, so providers store "verified" data ~free; Coinbase Institutional notes this "may distort the market by effectively subsidizing the true cost of storage" ([tokenomics review](https://www.coinbase.com/institutional/research-insights/research/tokenomics-review/filecoin-fil-dissecting-storage-market-incentives)); datacap misuse is a standing governance problem and **FIP-0080 proposes phasing Fil+ out** ([community analysis](https://hackmd.io/@cryptoecon/rknAqoOAh)). Genuine willingness-to-pay for storage remains largely unproven.
- Deals are **term-limited** (sectors expire; renewal is an active operation by a live counterparty) — structurally rental. Retrieval was historically the weak point; success rates "surged 388% over the last year" ([CoinLaw stats roundup](https://coinlaw.io/filecoin-statistics/), commentary-grade) — improving, but from a low base, and retrieval is still not a protocol guarantee.
- Relationship to IPFS: shared addressing (CIDs), separate networks; storing on Filecoin does *not* make data live on IPFS — hot access needs a pinning/serving layer on top (the niche Storacha/Lighthouse fill).

**For EFS:** Filecoin is usable as one more best-effort mirror class, never as the archival substrate; its economics reinforce the same conclusion as §2.4. Arweave's pay-once endowment (out of scope here; see sibling agent) is the only storage network even *claiming* the 100-year property.

---

## 3. Synthesis: blockchain anchoring as a consensus/ordering primitive

What five years of Ceramic **proved**:

1. **Amortized timestamping works and is essentially free on-chain.** One event/tx per batch, unbounded leaves, chain-agnostic proof format (CAIP-168). The clock function of a blockchain can be exported to arbitrary volumes of off-chain data. This is real and EFS can use it (e.g., future cross-chain replica provenance, inventory checkpoints, timestamping portable signatures to create validity windows).
2. **Content-derived, chain-free, salted object IDs work at scale** — Ceramic ran EFS-shaped identity in production for years. The concept is de-risked.
3. **Portable signature-authenticated authorship works** — dag-jose/CACAO events verified by signature, not msg.sender, across millions of events. The *kernel-recovers-author-from-signature* prize EFS is chasing has an existence proof, including the gasless-relay corollary (anyone could deliver anyone's signed events).
4. **Range-keyed set reconciliation (Recon) is the right sync primitive** for partial, interest-scoped replication of an ID-keyed event universe — directly reusable shape for EFS bucket replication.

What Ceramic **disproved / bounded**:

5. **Anchoring is a clock, not a consensus.** Earliest-anchor-wins ordering is unsound under commitment withholding, forever revisable, and its only known fix (anchor services that guarantee publication) reintroduces a trusted party. Ordering from anchors is sound only when the anchor substrate also guarantees availability of the commitment set — i.e., when you've rebuilt what an L1 already gives you.
6. **Anchoring provides zero availability and zero existence-consensus.** "What exists / what's current" (hard part c) remained gossip-and-trust in Ceramic to the end.
7. **A free, centralized anchor/infra service is a terminal liability** — allowlisted for its whole life (with a *technical* reason: witness withholding), funded by runway, dead when the sponsor pivoted. Any EFS reliance on an "anchoring/bridging service" must have on-protocol economics or must be so trivial that any archivist can run it from a cron job.
8. **Rotatable identity + portable signatures + no consensus clock = retroactive invalidity.** (§1.3.) Rotation must be consensus-ordered, or identity must be non-rotatable with expiring delegations layered above.
9. **The market position "more verifiable than Postgres, less verifiable than the chain" had no durable demand.** Its flagship users moved the trust-bearing data on-chain (to EAS!) and the fast data to Postgres. EFS is already on the winning side of this; the v2 temptation to drift off-EAS should be evaluated against this outcome every time.

**Mechanics to copy if EFS anchors anything** (checklist form): anchor into **contract state** (append-only root accumulator; storage-proof-readable), not calldata/logs (EIP-4444; matches EFS's own state-walk doctrine) · treat **witness paths as archival-class content** (store them *in* EFS, on-chain-mirror class) · make anchors **inclusive commitments over enumerable inventories** (CIP-69's sorted+bloom-filtered batch trees) so completeness is auditable, not just existence · never derive *ordering* authority from anchors against a potentially adversarial writer — only *not-after* timestamps · record chainId + blockNumber but re-verify; block timestamps across chains are only weakly comparable (Ceramic compared cross-chain anchors by wall-clock timestamp — acceptable for its threat model, sloppy for an archive).

---

## 4. Copy / avoid — consolidated for the architects

**COPY**
- C1. Salted creator-signed init payload → hash as owned-object identity (Ceramic `unique` ≡ EFS salt): de-risked at production scale.
- C2. did:pkh pattern: chain-scoped *name*, chain-free *verification* (eip191/ecrecover); chain reference as payload metadata, never signing-domain material.
- C3. CACAO-style expiring delegation to ephemeral keys as the agility layer over a non-rotatable (or consensus-ordered) root identity; revocation-by-expiry needs a trustworthy clock — which EFS's chain provides natively.
- C4. CAIP-168-style anchor proofs *for timestamping only*: batch merkle root, one tx, amortized ~zero — good for replica provenance, inventory checkpoints, portable-signature validity windows.
- C5. CIP-69's queryable batch trees: sort leaves by (namespace, controller, id) + attach metadata/bloom so a batch is enumerable and searchable — if EFS ever anchors inventories, copy this.
- C6. Recon (CIP-124): sortable composite EventIDs + associative range hashes + interest ranges = the sync protocol shape for LOCKSS-style EFS buckets.
- C7. Multihash/multibase hash-agility discipline for contentHash (already adopted) — the mature form of the hash-migration playbook.
- C8. DAG-CBOR (+JOSE/COSE envelope) as the off-chain portable signed-record format *if one is needed* — with mandatory strict-mode round-trip verification at acceptance, because real decoders are lax.

**AVOID**
- A1. Deriving *ordering/currency* from anchor timestamps against the data's own author — late-publishing/data-withholding breaks it; anchoring proves existence-before-T, never non-existence of earlier commitments, and finality never closes.
- A2. Any separation of ordering substrate from availability substrate for trust-bearing state — the gap between them is where Ceramic died; EAS-on-chain keeps them fused, which is the property EFS pays that ~25% overhead *for*.
- A3. Anchor proofs that depend on tx calldata/receipts/logs — history expiry kills them; anchor into contract state readable by storage proof.
- A4. Off-chain witness data at a lower durability class than the thing it proves (witness withholding is why CAS was allowlisted; a lost witness = a dead anchor).
- A5. Rotatable identity whose rotation events are not consensus-ordered — retroactive signature invalidity (3ID's grave).
- A6. ERC-1271-dependent artifacts in anything meant to outlive a chain — unsolved everywhere, including CAIP-74; plan the archival verification path around EOA-class keys or anchored key-event logs.
- A7. Liveness-coupled naming/pointers (IPNS republish treadmill; ~11 s median resolution; no history) — mutable reference layers must be state-based, history-preserving, and liveness-free.
- A8. Counting on subsidized/free availability (CAS, NFT.Storage, web3.storage, Cloudflare/Scaleway gateways: all dead or paywalled within ~5 years) — mirrors are best-effort by definition; only on-chain bytes are archival-class. Filecoin is subsidy-distorted rental (~30–36% utilization, Fil+ 10× multiplier, term-limited deals), acceptable only as redundancy.
- A9. UnixFS/CID-style identity that varies with ingestion parameters (chunker/layout/codec) — contentHash must be over exact bytes with any chunking convention frozen in the Codex.
- A10. Free centralized protocol services with no economic loop and no permissionless fallback — they are walking single points of failure; Ceramic shipped its decentralized anchoring only as a going-away present.
- A11. Reader-side state folds as the *only* read path (every reader needs a node or a trusted indexer) — EFS's on-chain registry/resolvers avoid this; keep the state-walk + O(1) registry read as the canonical trust path.

---

## 5. Sources

**Primary (specs/official):**
- Ceramic sunset: https://blog.ceramic.network/the-future-of-ceramic-focusing-on-recall/ (2025-04-17); Textile merge: https://blog.ceramic.network/ceramic-is-joining-textile/
- Legacy protocol spec (event log, AnchorProof, conflict resolution, withholding attack): https://github.com/ceramicnetwork/.github/blob/main/LEGACY_SPECIFICATION.md (marked out-of-date; rules quoted were operative for mainnet Ceramic)
- CIP-69 batched anchor structure: https://cips.ceramic.network/CIPs/cip-69 · CIP-110 anchor contract + allowlist: https://cips.ceramic.network/CIPs/cip-110 · CIP-124 Recon: https://cips.ceramic.network/CIPs/cip-124
- CAIP-168 IPLD timestamp proof: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-168.md · CAIP-74 CACAO: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-74.md
- CAS repo: https://github.com/ceramicnetwork/ceramic-anchor-service · rust-ceramic (self-anchoring): https://github.com/ceramicnetwork/rust-ceramic
- 3ID evolution: https://blog.ceramic.network/accounts-evolution-of-3id/ · retroactive invalidity: https://github.com/ceramicstudio/js-3id-did-provider/issues/138 · did:pkh/did-session docs: https://developers.ceramic.network/docs/advanced/standards/accounts/pkh-did/, https://developers.ceramic.network/docs/protocol/js-ceramic/guides/ceramic-clients/authentication/did-session
- DAG-CBOR spec: https://ipld.io/specs/codecs/dag-cbor/spec/ · IPNS docs: https://docs.ipfs.tech/concepts/ipns/
- NFT.Storage transitions: https://nft.storage/blog/important-product-updates-nft-storage-is-evolving, https://nft.storage/blog/nft-storage-operation-transitions-in-2025 · Storacha: https://storacha.network/
- Gitcoin postmortem (Feb 2023): https://gov.gitcoin.co/t/lessons-learned-a-look-at-gitcoin-allo-alpha-rounds-and-the-path-forward-with-gitcoin-passport/13011 · Passport onchain (EAS): https://docs.passport.gitcoin.co/building-with-passport/major-concepts/onchain-passports

**Measurement / analysis (secondary but rigorous):**
- ProbeLab IPNS study (Aug 2025): https://probelab.io/blog/ipns-performance-amino-dht
- Messari State of Filecoin Q3 2025: https://messari.io/report/state-of-filecoin-q3-2025 · Coinbase Fil+ tokenomics: https://www.coinbase.com/institutional/research-insights/research/tokenomics-review/filecoin-fil-dissecting-storage-market-incentives · Fil+ debate: https://hackmd.io/@cryptoecon/rknAqoOAh

**Commentary (lower confidence, used with hedges):** HackMD CAS walkthrough https://hackmd.io/@SammyCodes/rk15SBeIs (contract address, allowlist details); CoinLaw Filecoin stats https://coinlaw.io/filecoin-statistics/ (retrieval improvement figure); Infura IPFS deprecation is widely reported but was not verified against a primary source here.

**Staleness:** Ceramic official docs are partially link-rotted post-pivot; CAS/ComposeDB shutdown was scheduled relative to Recall mainnet ("mid-2025") and the precise final shutdown date was not re-verified; Filecoin retrieval/utilization figures are Q3 2025, the newest found.
