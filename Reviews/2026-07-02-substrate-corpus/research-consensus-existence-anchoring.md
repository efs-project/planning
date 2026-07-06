# Consensus on existence, current-ness, and revocation — anchoring research

**Agent:** consensus-existence-anchoring (EFS substrate investigation)
**Date:** 2026-07-02
**Repo inputs read:** `planning/Designs/deterministic-ids.md`, `efs-v2-holistic-redesign.md`, `efs-v2-transition-plan.md`
**Method note:** external claims cite URLs; primary sources (specs, FIP discussions, papers, contract code) are marked (P), commentary/secondary marked (S). Staleness flags where the ecosystem moved recently.

---

## 0. Executive framing

The consensus-on-existence problem is actually **four separable sub-problems**, and conflating them is how systems end up buying (or building) more consensus than their semantics need:

| Sub-problem | Logical type | Minimal mechanism that solves it |
|---|---|---|
| **E — Existence** ("does X exist?") | Positive, monotone | Set union across replicas; any one honest holder suffices. Anchoring adds a *time bound* (existed by T). |
| **O — Ordering** ("which of A's claims on slot S is later?") | Relative, per-writer in EFS | Per-author sequence numbers / hash chains. A chain gives it for free via nonces; no cross-author order is needed by EFS read semantics (§5). |
| **C — Completeness / absence** ("is there NO later claim / NO revocation?") | Negative, non-monotone | The irreducible one. Requires either (a) consulting total state (a chain), or (b) an author-signed commitment to their *entire current claim-set* (a state root), freshness-bounded by anchoring. |
| **Q — Equivocation** ("did A show me one history and you another?") | Adversarial fork of a per-author log | Witnessing/gossip (CT), or anchoring with an earliest-anchored-wins fork rule (Ceramic), or a consensus substrate that makes self-forking impossible (a chain). |

**The headline finding, argued in §5:** EFS's read semantics — per-`(attester, slot)` PIN/TAG supersession, set-valued MIRROR/TAG/REDIRECT, first-attester-wins lens merge — need **zero cross-author ordering**. The problem does collapse, but it collapses to **per-author completeness (C) + equivocation resistance (Q)**, not to "per-author ordering suffices, done." Ordering was never the hard part; a signed `seq` field solves O trivially. What a single chain uniquely provides is C and Q *for free* (state is total; an account cannot fork its own nonce history). Every replicated system studied either rebuilt C/Q (ATProto signed state roots, Ceramic anchors, CT witnesses, Snapchain consensus) or shipped wrong answers (Nostr, pre-Snapchain Farcaster hubs).

**On anchoring:** batch-anchoring off-chain records buys existence-by-T, coarse epoch ordering, an equivocation fork-choice rule, and — *only* if heads commit to the author's full claim-set — bounded-staleness revocation finality with provable absence. It buys **no byte availability** (Ceramic's fatal gap; CT survives because the log stores what it commits to), no freshness (a silent author and a withheld update are indistinguishable), and no synchronous on-chain composability.

---

## 1. The baseline: one chain (the EAS answer)

A single chain answers all four sub-problems by construction: total order over all transactions; state at head *is* the complete answer; an account cannot equivocate against itself (nonces); "is X revoked" is one `SLOAD`. EFS v2 leans on this everywhere:

- The object registry is "first-writer-wins, state-based, reconstructible from a documented state-walk" (`deterministic-ids.md` §4) — i.e., the chain's total order is consumed once, to produce a first-wins bit, and thereafter existence is a state read.
- The existence rule (§5 of the design) — claim-side dependency checks read `registry.instantiated` at hook time — is a *completeness* consumption: the resolver trusts that chain state at hook time is the whole truth.
- Revocation is EAS on-chain state; "current PIN at slot" is the latest non-revoked claim in chain order, which for a single attester is just their own transaction order.

Two under-appreciated details of EAS itself:

1. **EAS's own off-chain story reaches back to the chain for C and Q.** For offchain attestations, EAS provides on-chain `timestamp()`/`multiTimestamp()` (existence-by-T) and `revokeOffchain()` writing into `mapping(address revoker => mapping(bytes32 data => uint64 timestamp))` — an on-chain revocation registry *for off-chain artifacts* ([EAS.sol](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/EAS.sol) (P)). Even the attestation-native project concluded that negative statements about signed artifacts need a consensus registry. This is the closest existing precedent for "per-chain EFS registries anchoring off-chain records" — and note it is keyed per-revoker, i.e., **per-author**, consistent with the collapse thesis.
2. **What the chain's total order is actually *used for* in EFS is narrower than what it provides.** §5 inventories this; the gap between "provided" and "consumed" is exactly the design space for replication.

Cost of the baseline: the answer is per-chain and dies with the chain. "Current-ness" on chain A says nothing about chain B — which EFS doctrine already accepts ("supersededBy is per-chain state, never inferred across chains without explicit claims," `efs-v2-holistic-redesign.md` §3.3).

---

## 2. Case studies

### 2.1 ATProto — per-author signed state roots; canonicalization by indexer convention

**Mechanism** ([repository spec](https://atproto.com/specs/repository) (P)): every account has a repo; repo contents live in a **Merkle Search Tree (MST)** — a *deterministic* tree structure (same record set ⇒ same root hash, regardless of insertion order). Every mutation produces a signed **commit** containing `data` (CID of the MST root — i.e., a commitment to the *entire current repo*) and `rev`: "revision of the repo, used as a logical clock. Must increase monotonically."

**What this solves:** a commit is not just a statement about one record — it is a **completeness statement over the author's whole state**. Because the MST is deterministic, both inclusion *and exclusion* are provable against a root: "is record R current per author A as of A's rev N" has a cryptographic answer, including "no, and here is the non-inclusion proof." Deletions change the root like any mutation. This is the single most copyable trick in the whole survey: **sign the state root, not (only) the records** — it converts the non-monotone completeness question into a monotone one ("give me A's latest signed root").

**What ATProto does *not* solve, and how it papers over it:**
- **Freshness:** "The specification provides no explicit guarantee about having current state" (spec (P)). A consumer can be fed a stale-but-validly-signed root. Bluesky mitigates operationally via the relay firehose ("a monotonic cursor that establishes a total ordering across all repository changes *from a given host*"), i.e., freshness by trusting your relay.
- **Canonical current-ness is indexer convention.** With [Sync v1.1](https://docs.bsky.app/blog/relay-sync-updates) (P), relays are **non-archival**; relays "should ignore #account and #commit events which are not coming from the currently declared PDS instance" and drop commits when "the local account status is not active" — account existence/liveness/takedown is relay- and AppView-policy, not protocol truth. Two AppViews can legitimately disagree about what exists.
- **History was demoted.** The [v3 sync update](https://docs.bsky.app/blog/repo-sync-update) (P) removed canonical commit history (`prev` became a hint) because "record deletions are difficult to process" and history cost 5–10x storage. ATProto chose *current-state-commitment* over *append-only-log* — the same "state-walk, not event log" instinct as `deterministic-ids.md` §4, and validation that per-author *state* roots (not full logs) are the sustainable artifact.
- **Cross-repo ordering: none, and nobody misses it.** Likes, follows, replies across users are just records in each author's repo; apps merge by convention. Strong evidence that a social/graph read model survives fine without cross-author order.

### 2.2 Farcaster — the CRDT failure and Snapchain's purpose-built consensus

**The failure (primary record: [FIP "Introducing Ordering"](https://github.com/farcasterxyz/protocol/discussions/193) (P), [FIP Snapchain](https://github.com/farcasterxyz/protocol/discussions/207) (P)):** pre-2025 hubs held per-user delta-graph CRDTs (last-write-wins with lexicographic hash tiebreak), synced by gossip + Merkle-trie diff. At ~500M messages it broke operationally:
- "a node could only detect gossip failures by syncing manually with every other node and comparing all transactions. This becomes slow and eventually infeasible" — **unordered sets make missing-data detection O(compare everything)**; that is sub-problem C, not O.
- Rate limits had to be node-local, so "a transaction that passes the limits on one node might be rejected by another"; per-user storage limits meant hubs that saw different message subsets **pruned different messages** — admission and pruning rules that depend on global state diverge without consensus.
- Varun Srinivasan: "Hubs practically become inconsistent — sync may require multiple retries or waiting for a while, but that delay may cause more state changes which exacerbates the problem."

**The debate matters more than the outcome.** FIP-193 explicitly weighed **account-level ordering** (per-signer sequence numbers, monotonic enforcement, lowest-hash conflict tiebreak; "easier implementation, maintains decentralization, enables future sharding") against **global ordering** ("cleaner… fewer edge cases"; but "single point of failure; harder decentralization"). They chose global — but for *operational* reasons EFS mostly lacks: (a) free writes ⇒ network-enforced rate limits ⇒ global admission state; (b) storage rent + pruning ⇒ deletions are load-bearing and must be uniform; (c) sync completeness across permissionless hubs with no payment or anchor.

**Snapchain** ([site](https://snapchain.farcaster.xyz) (P), [repo](https://github.com/farcasterxyz/snapchain) (P)): Malachite (Rust Tendermint) BFT, ~11 elected validators, sub-second finality, mainnet April 16 2025. The decisive detail: **shards are per-account** — "accounts are assigned to a chain using a deterministic function… transactions made by one account cannot affect the state of another account" (FIP-207). Even after buying total order, Farcaster's *semantics* remain per-account; consensus exists for sync/rate-limits/pruning, not for cross-user conflict resolution. This is the strongest external confirmation of the per-author-collapse thesis.

**Costs they accepted that EFS must not:** a validator committee as a new trust root ("if more than 2/3rd of validators in a shard collude they can censor a user, and governance action is needed" — FIP-207); protocol-level pruning of old data (anti-archival by design); one bespoke substrate (the opposite of substrate independence). Commentary noting the centralization trade: [BlockEden retrospective](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/) (S). Staleness note: details current as of the Apr-2025 launch and Oct-2025 commentary.

### 2.3 Certificate Transparency + witnesses — verifiable inclusion, and why gossip became cosigning

**Mechanism** ([RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) (P)): append-only Merkle logs; Signed Tree Heads (STH); O(log N) **inclusion proofs** (existence) and **consistency proofs** (append-only evolution between two STHs). Crucially, **the log stores the full certificates it commits to** — commitment and availability travel together.

**The attack that defines the field:** **split view** — a log shows one tree to the victim and another to monitors, each self-consistent ([Stark overview](https://emilymstark.com/2020/07/20/certificate-transparency-a-birds-eye-view.html) (S)). An inclusion proof alone proves membership in *some* view, not in *the* view. RFC 6962's answer was gossip — and after a decade, "there has been an attempt to define gossip protocols for exchanging STHs, but they haven't been widely deployed" (ibid.). What actually shipped is **witness cosigning**: independent witnesses verify consistency proofs and countersign checkpoints; a client requires a threshold of witness cosignatures ([Sigsum design](https://git.sigsum.org/sigsum/plain/doc/design.md) (P), [C2SP tlog-witness spec](https://github.com/C2SP/C2SP/blob/main/tlog-witness.md) (P), [transparency.dev witness network](https://blog.transparency.dev/can-i-get-a-witness-network) (P/S), [Armored Witness hardware](https://github.com/transparency-dev/armored-witness) (P)). Witnesses are nearly free to run: "the witness only needs to store the O(1) latest checkpoint it observed."

**The mapping for EFS:** a blockchain *is* a maximally-hardened witness network — posting a root on-chain gets you globally-agreed checkpoint history without building a witness ecosystem. Conversely, the witness model shows what "anchoring to N chains" means: N independent O(1)-state witnesses of the same head, which is precisely LOCKSS-for-anchors. And the deployment history teaches: **reactive gossip does not ship; proactive countersigning on the write path does.**

### 2.4 Ceramic — batch anchoring as consensus, and both of its failure modes

**Mechanism:** streams are per-controller signed commit DAGs; nodes submit stream tips to the **Ceramic Anchor Service (CAS)**, "Layer 2 service for anchoring batches of Ceramic commits into a single blockchain transaction" ([repo](https://github.com/ceramicnetwork/ceramic-anchor-service) (P)) — a Merkle root in one Ethereum tx, against an authoritative anchor contract ([CIP-110](https://cips.ceramic.network/CIPs/cip-110) (P)).

**What anchoring bought them — the conflict rule** ([TileDocument spec](https://github.com/ceramicnetwork/docs/blob/main/docs/docs/advanced/standards/stream-programs/tile-document.md) (P)): "In the case of conflicting versions, the branch with the earliest recorded anchor commit will be respected as the canonical branch." This is the equivocation fork-choice (Q) and it "enables keys to be securely revoked since someone that gains possession of an old key after it was revoked will be unable to produce a proof-of-publication that is earlier than the first anchor" — anchoring converts key compromise from unbounded retroactive forgery into a race the legitimate controller already won. Directly relevant to EFS hard-part (e): **anchoring is the mechanism that lets long-lived rotatable identities coexist with portable signatures** — old-key signatures postdating the rotation anchor are rejectable by timestamp, chain-free-signature portability notwithstanding.

**Failure mode 1 — the batcher was a trust root.** CAS was operated by 3Box Labs alone: a liveness, censorship, and (via batch composition) admission chokepoint. Known consequence class: the **late-publishing / withheld-branch problem** — earliest-anchor-wins *rewards* an anchored-but-unpublished branch revealed later; a bare Merkle root proves existence of whatever preimage its holder eventually reveals. (Contrast CT, where the log must *serve* what it commits to.)

**Failure mode 2 — anchors don't carry bytes.** Committed data lived in IPFS subject to pinning/GC; proofs and commits could become unfetchable while the on-chain root sat there, valid and useless. Anchoring proves existence; it cannot prove or provide availability.

**Failure mode 3 — the institution died before the data.** Jan-Feb 2025: 3Box Labs merged into Textile → Recall; js-ceramic and ComposeDB deprecated; "ComposeDB and the Ceramic Anchor Service (CAS) will be completely shut down at least one month after Recall's Mainnet launch (expected in mid-2025)" ([Ceramic joins Textile](https://blog.ceramic.network/ceramic-is-joining-textile/) (P), [Focusing on Recall](https://blog.ceramic.network/the-future-of-ceramic-focusing-on-recall/) (P)). A live demonstration of `efs-v2-holistic-redesign.md` §3.2 (trust-root stewardship): the Ethereum anchors survive; the *interpretive infrastructure* — CAS, the docs, the client that knows the fork-choice rule — is dissolving. An anchor whose verification procedure lives in a dead company's docs repo is not a 100-year artifact. (Staleness: shutdown timeline announced Feb 2025; exact current state as of Jul 2026 unverified.)

### 2.5 LOCKSS — polling solves integrity of known holdings, not existence

**Mechanism** ([Maniatis et al., SOSP 2003](https://www.cs.rochester.edu/meetings/sosp2003/papers/p140-maniatis.pdf) (P)): peers preserving the same archival unit run periodic (≈quarterly) **opinion polls**: the poller samples peers, each voter hashes a poller-supplied nonce with its replica; if the poller "is outvoted in a landslide (e.g., it disagrees with 80% of the votes), it assumes its replica is corrupt and repairs it from a disagreeing voter." **Rate limitation is the security core**: slow polls + admission effort mean "even some very powerful adversaries attacking over many years have only a small probability of causing irrecoverable damage before being detected."

**Scope discipline:** LOCKSS never answers "does X exist / is X current." Existence comes from an *external oracle* — the publisher's website, crawled during the subscription window; currency doesn't exist (journals are immutable). Polling answers only "are my bytes the same as the majority's bytes." Lessons: (a) hash-verified peer repair (already adopted, `efs-v2-holistic-redesign.md` §2.4) is the correct availability posture and needs no consensus; (b) rate-limiting as the defense of a no-token voting system; (c) don't ask a replication layer to answer existence questions — LOCKSS worked *because* ingest was anchored to an authoritative source, which for EFS is the per-chain registry.

### 2.6 Nostr — the null hypothesis (what no-consensus + no-completeness looks like)

[NIP-09](https://github.com/nostr-protocol/nips/blob/master/09.md) (P): deletion is a *request* event; "clients may choose to inform the user that their request for deletion does not guarantee deletion because it is impossible to delete events from all relays and clients." Replaceable events resolve by latest-`created_at` (self-asserted timestamp) — with no completeness signal, any relay lacking the latest version *silently serves a superseded one as current*. [NIP-62 "Request to Vanish"](https://nips.nostr.com/62) (P) escalates the plea without changing the mechanism. This is the posture the prompt correctly rules unacceptable; its precise defect is not "no total order" but **no per-author completeness commitment** — a signed state root + head discovery convention would fix most of it without any consensus. Nostr is what EFS replication becomes if model A ships with no head/anchor convention.

### 2.7 Sidebar precedents

- **OpenTimestamps** ([Todd, 2016](https://petertodd.org/2016/opentimestamps-announcement) (P)): calendar servers aggregate arbitrarily many hashes into Merkle trees, one Bitcoin tx commits the root; proofs are self-contained (verification never needs the calendar again); trees of trees scale unboundedly. The engineering template for cheap batch anchoring — and for making proof verification *independent of the batching institution* (the anti-Ceramic property).
- **Key transparency (CONIKS; WhatsApp's deployment)**: the general solution to "auditable current-ness of a mutable mapping" is exactly the ATProto/anchor shape — per-epoch signed roots over the *entire* mapping, inclusion proofs for lookups, auditors checking root evolution. (Cited from prior knowledge — CONIKS, USENIX Security '15; WhatsApp key transparency, 2023 — medium confidence on details, high on the shape.)

### 2.8 Comparative table

| System | Existence (E) | Ordering (O) | Completeness (C) | Equivocation (Q) | Availability of bytes |
|---|---|---|---|---|---|
| One chain / EAS | state | total, free | total state, free | impossible (nonces) | calldata/state, chain-lifetime |
| ATProto | record in signed repo | per-author `rev` clock | **signed MST root** (absence provable) | unsolved at protocol level (relay convention) | PDS + (non-archival) relays, best-effort |
| Farcaster pre-2025 | CRDT set union | per-user LWW+hash tiebreak | **none → the failure** | hash tiebreak | hubs, best-effort |
| Snapchain | block inclusion | global (BFT), sharded per-account | total per shard | impossible | validators, **pruned by design** |
| CT + witnesses | inclusion proof | log order (coarse) | monitors over full log | **witness cosigning** | **log stores data** |
| Ceramic | anchor inclusion proof | per-stream DAG + anchor epochs | none (tips self-reported) | **earliest-anchor-wins** | **not provided → failure** |
| LOCKSS | out of scope (publisher oracle) | n/a (immutable) | n/a | n/a | **the whole point** (poll+repair) |
| Nostr | relay has it or not | self-asserted timestamps | **none** | none | relays, best-effort |

---

## 3. What batch anchoring buys EFS, exactly

Setting: off-chain (or foreign-chain) EFS records — signed claim artifacts per the portable-signature track — with per-chain EFS registries accepting batch anchors (Merkle roots over record hashes or over per-author heads).

**Buys:**

1. **Existence-by-T** (upper bound on creation time; never "created at T"). This is the missing mechanism for the **temporal provenance** workstream (`efs-v2-holistic-redesign.md` §3.3): a record anchored contemporaneously with publication carries its own proof of origin time that survives the origin chain's death — provided the *anchor* chain survives, and anchors can be replicated to N chains at N× one-hash cost (witness model, §2.3). "Which clock does a 100-year citation trust" gets the Ceramic answer: **the earliest surviving anchor.**
2. **Coarse epoch ordering** between anchored artifacts on the same anchor chain. Combined with author `seq`, this bounds backdating: an author can antedate within an epoch, never across one.
3. **Equivocation fork-choice + key-rotation safety** (Q): earliest-anchored head wins. A forked per-author log is resolvable deterministically; a stolen key cannot rewrite pre-rotation history (§2.4). This is the reconciliation lever for hard-part (e) — durable rotatable identity vs eternally-verifiable ECDSA: signatures verify forever, but *validity windows* are adjudicated by anchor timestamps.
4. **Revocation finality and provable absence — only under two conditions:** (i) the anchored object is an author-signed **state root over the author's full active claim-set** in a deterministic structure (MST-style), so non-inclusion (= revoked/superseded/never-existed) is provable; and (ii) readers adopt the convention that claim validity is evaluated **as-of an anchored head**. Then "is claim X active per author A" = inclusion proof against A's latest anchored root; "is it revoked" = non-inclusion; staleness is bounded by anchor cadence. Without (i), anchoring individual records proves only E and can never prove absence; revocation stays advisory (Nostr with timestamps).

**Cannot buy:**

5. **Availability of the record bytes — or of the proof material.** A root proves whatever preimage someone eventually produces (Ceramic failures 1–2; late-publishing attack). Countermeasures, in strength order: (a) the committed records are themselves on-chain calldata/state on *some* chain (model A: the origin chain is the DA layer; anchoring elsewhere is pure witness); (b) the author's claim-log/state-tree is itself published as an EFS file with mirrors + contentHash (self-hosting — the Codex-at-genesis instinct applied to logs); (c) CT-style: an anchor is only accepted with an availability attestation from parties that hold the data. EIP-4844 blobs are explicitly *not* an answer (≈18-day retention).
6. **Freshness/liveness.** A validly-signed, validly-anchored head can be arbitrarily stale; withheld-newer-head is indistinguishable from author silence. Only conventions help: heads carry `seq` + timestamp; lens UIs surface head age; optionally a max-staleness policy per lens. This is irreducible — accept and surface it.
7. **Spam/sybil control.** Batching amortizes gas to ~zero per record, dissolving gas-as-write-cost; whoever composes batches becomes an admission gatekeeper (CAS lesson; Farcaster answered with storage rent). Any anchored-records design must re-derive its spam story (out of scope here; flag to the spam/sybil agent: **anchoring and gas-as-spam-control are in direct tension**).
8. **On-chain composability.** Contracts cannot verify Merkle proofs against anchors *synchronously* at reasonable cost/UX for reads; contracts reading EFS state need materialized per-chain registry state (posture 1). If hard-part (d) — real dapps needing contract-readable EFS — is the deciding factor, anchoring can only ever be a *supplement* to chain-state registries, never a replacement.

---

## 4. Where "current-ness" actually needs which order — the EFS semantics audit

Every current-ness-bearing semantic in v1/v2, audited for the order it consumes:

| Semantic | Rule | Order actually required |
|---|---|---|
| PIN supersession | latest non-revoked per slot `(attester, definitionId, targetKind)` | **per-(author,slot)** |
| TAG weight update | supersedes per `(attester, definitionId, targetId)` | **per-(author,slot)** |
| TAG/MIRROR/REDIRECT sets | multi-valued, shrink only by author's own revocation (by EAS UID — an observed-remove set, immune to add/remove races) | **none** (union) + per-author revocation |
| Revocation | only the original attester revokes their claim (EAS rule) | **per-author** |
| Lens resolution | first-attester-wins over an *ordered attester list* — a pure deterministic function of per-attester slot states | **none across authors** |
| Registry instantiation, shared kinds (ANCHOR/PROPERTY) | first-writer-wins, but duplicates are idempotent no-ops *because payload ⇒ id is injective* — winner identity is bookkeeping (`firstUID`), not semantics | **none** (semantically) |
| Registry instantiation, owned kinds (DATA/LIST, model A) | duplicate `(attester, salt)` = client bug, REVERT | **per-author** |
| REDIRECT cycle resolution | SCC-lowest-**UID** tie-break (ADR-0050) | deterministic tie-break, no order — **but see flag 3** |
| Blinded→plaintext disclosure | preimage-verified; order affects walkability timing only | none for validity |
| **LIST `maxEntries` / capacity admission** | resolver counts existing entries at write time | **⚠ cross-author, chain-order-dependent** — see flag 1 |

**Conclusion (the collapse, stated precisely).** No EFS *read* semantic requires cross-author ordering. Lens resolution composes per-author answers by a static precedence list — the design has, perhaps unintentionally, the exact shape (per-author state + deterministic merge function) that CRDT theory and ATProto/Snapchain practice say replicates safely. What replication still needs from somewhere is **C** (per-author completeness — "I have *all* of A's claims bearing on this slot, and A's revocations") and **Q** (A hasn't shown me a different history than she showed you). On a chain both are free. Off-chain, the ATProto state-root + Ceramic anchor pair restores both with bounded staleness. **Total order per se is never the requirement.**

**The lens amplifier (original observation, sharpest failure mode).** First-attester-wins makes lens reads *anti-monotone in missing data*: if attester #1's PIN on slot S is missing from my replica, resolution silently falls through to attester #2 — a **wrong answer with no error**, worse than staleness. Union-semantics systems degrade gracefully under incompleteness; precedence-fallthrough systems do not. Therefore: under any replicated/off-chain read path, a lens resolver MUST distinguish "attester A has no claim on S (proven against A's anchored head)" from "I don't know A's state" — and only anchored state roots make that distinction checkable. On-chain reads are exempt (state is total). This should be written into any future replicated-read spec as a conformance rule.

**Flags for the architects (cross-author order residue found by the audit):**
1. **LIST `maxEntries`/`appendOnly` admission is the only genuinely global-per-object, interleaving-dependent write rule in EFS.** It is fine as a chain-local validation (chain provides the order) but is *not reproducible* across replicas: replaying the same entry-set against a different interleaving admits a different subset. Options: declare capacity chain-local (a replicated list's "fullness" is per-chain state, like supersession); scope caps per-attester; or drop caps from portable semantics. Decide before LIST semantics freeze.
2. **Registry `firstUID` and duplicate-instantiation bookkeeping** are chain-order artifacts; harmless because idempotence makes them semantics-free — keep it that way (any future rule that keys behavior on *who* instantiated first re-imports total-order dependence).
3. **The SCC-lowest-UID cycle tie-break keys on EAS UIDs, which are chain-dependent.** Under replication model A, identical logical REDIRECT graphs on two chains can resolve cycles *differently* (different UIDs → different SCC minimum). Re-key the tie-break on chain-free EFS ids (e.g., lowest `sourceId`) in the ADR-0050 resolution spec before it freezes — cheap now, unfixable later.

---

## 5. Copy / avoid lessons

**Copy:**
1. **ATProto — sign the state root, not just the records.** A deterministic per-author tree (MST) over the *active claim-set* makes completeness and absence (revocation, supersession) provable against one signed hash. This is the keystone mechanism for portable current-ness.
2. **ATProto — per-author monotonic `rev` logical clock** in every head; trivially cheap, kills same-author ambiguity forever.
3. **Ceramic — earliest-anchor-wins fork choice**, adopted as the equivocation and key-rotation rule: it converts key compromise into an already-lost race and needs no committee.
4. **CT — commitment and availability must travel together.** Anchor only artifacts whose bytes are on-chain or first-class-mirrored EFS files; a bare root over unavailable data is Ceramic's grave.
5. **CT witnesses — proactive countersigning over reactive gossip**; and treat "anchor the same head on N chains" as running N free O(1) witnesses. Reactive gossip protocols never shipped in a decade; don't design one.
6. **OpenTimestamps — proofs verifiable without the batcher.** Any EFS anchor format must verify from (proof + chain data) alone, with the batching service dead.
7. **LOCKSS — hash-verified peer repair + rate-limited polls** for byte availability (already in v2 conventions §2.4); and its scope discipline: replication machinery answers integrity, an authoritative layer answers existence.
8. **Snapchain — per-account sharding as vindication:** even a team that bought global BFT consensus kept semantics strictly per-account ("transactions made by one account cannot affect the state of another"). Design so that consensus, if ever added, shards trivially — EFS's per-(author,slot) semantics already do.
9. **EAS itself — on-chain registries for negative statements about off-chain artifacts** (`revokeOffchain`, keyed per-revoker): the minimal, already-proven shape of "per-chain registry anchoring off-chain records."

**Avoid:**
10. **Nostr — advisory deletion / self-asserted-timestamp current-ness with no completeness commitment.** Latest-known ≠ latest; a replica that lacks the newest record serves lies silently.
11. **Pre-Snapchain Farcaster — unordered replicated sets with global admission rules (rate limits, caps, pruning).** Any write-validity rule that depends on cross-author interleaving diverges without consensus. (EFS has exactly one: LIST caps — see flag 1.)
12. **Ceramic — a single batch-anchoring operator** as de-facto consensus: liveness/censorship chokepoint, late-publishing surface, and an institution that died faster than the data. Anchoring must be permissionless (anyone may self-anchor; batching is an optimization, never an authority) and its verification procedure must live in the self-hosted Codex, not a company's docs.
13. **Snapchain-style bespoke consensus for an archive:** an elected validator set is a new mortal trust root, and its economics pushed Farcaster into protocol-level pruning — both anti-goals for a 100-year, substrate-independent system.
14. **ATProto — "current-ness by indexer convention"** (non-archival relays deciding which accounts/commits count): exactly the trusted-indexer posture EFS's verify-don't-trust property forbids.
15. **Precedence-fallthrough reads over unverified-complete replicas** (the lens amplifier, §4): never let "I don't have A's data" resolve as "A has no claim."

---

## 6. Three consensus postures for EFS

### Posture 1 — "The chain is the notary": per-chain state consensus, divergence-tolerant (v2 as specced; the floor)

Each chain's registry + EAS state is the complete consensus answer *for that chain*; per-author order rides transaction order; revocation is state; cross-chain current-ness is never inferred (existing doctrine). Cross-chain identity stays coherent without any coordination because ids are payload-deterministic — replicas can disagree about *which* objects exist, never about what an id *means*.
**Strengths:** zero new machinery; full on-chain composability (the hard-part-(d) winner); spam story intact (gas).
**Weaknesses:** existence/current-ness answers die with the chain (mitigable: the state-walk snapshot is exportable, but a snapshot is unauthenticated data unless its root is anchored elsewhere); temporal provenance across chain death unsolved; no portable "current as of" artifact.
**Cheap hardening, recommended regardless of anything else:** a periodic **registry-root checkpoint** — hash of a canonical serialization of registry + active-claim state (or even just of the state-walk snapshot) attested onto ≥1 other chain. One attestation per epoch turns every other chain into a witness of this chain's history for ~zero cost, and makes post-mortem snapshots verifiable. Pure convention; no freeze surface.

### Posture 2 — "Anchored per-author heads": signed state-roots + permissionless batch anchoring (the recommended target; additive, post-v2)

Each author's **head** = signed `(author, seq, root)` where `root` commits, MST-style, to their full active claim-set (claims in portable signed form, per the portable-signature track — chain-free, so the head is chain-free). Heads are attested into per-chain EFS registries — self-anchored by the author as an ordinary attestation, or batch-anchored OpenTimestamps-style by *anyone* (permissionless; batcher is never an authority; proofs verify batcher-free). Fork choice: earliest-anchored head wins at equal `seq`. Read convention: replicated/off-chain reads resolve lenses against each lens-attester's latest anchored head, with non-inclusion proofs for absence and surfaced head-age; on-chain reads unchanged.
Key structural note: **on-chain writes make the head *derivable***: because the chain already provides order and completeness, *any* third party can deterministically compute what an author's head must be from chain state — but only the **author's signature** on it makes it portable and post-chain-death verifiable. So head-signing can be batched lazily, ride the author's next write, or be prompted by the SDK; no per-write UX cost.
**What it delivers against the five hard parts:** (a) revocation without a live consensus substrate — bounded-staleness finality + provable absence, the first non-advisory answer available to a signature-based system; (c) consensus-on-current across buckets — per-author heads + earliest-anchor fork choice is *all* the consensus §4 shows EFS needs; (e) identity durability — rotation events anchored ⇒ old-key forgeries lose by timestamp; plus temporal provenance (§3.3) for free.
**Costs/risks:** anchor cadence gas (batched: ~one tx per epoch for everyone); staleness window; a new spec surface (head schema + root layout + proof format — must enter the self-hosted Codex; the *hash/serialization* conventions want deciding near the freeze even if the schema is additive later, WHITEOUT-pattern reservation); the availability rule (lesson 4): the claim-set behind a head must itself be an EFS-mirrorable artifact.
**Verdict:** this is the posture that makes the whole "portable signed artifacts" journey land — without it, portable signatures give portable *authenticity* but Nostr-grade *current-ness*.

### Posture 3 — "EFS Snapchain": purpose-built ordering layer (rejected; conditions for revival stated)

A dedicated BFT-ordered substrate for EFS records. Rejected: (i) §4 shows no EFS semantic consumes cross-author order — the one motivation Farcaster had (free writes ⇒ global rate limits/pruning) is absent while gas is the write cost; (ii) a validator set is a new mortal institution in a system whose thesis is outliving institutions; (iii) it *is* a chain — "chains as interchangeable DA substrates" collapses into "our chain," the worst substrate-dependence outcome; (iv) Farcaster's own trade-list (censorship at 2/3 collusion, governance rescue, pruning economics) reads as an EFS anti-goals checklist.
**Revival conditions (pre-commit these):** only if EFS moves to free/off-chain-first writes at social-network volume (spam story no longer gas) *and* posture 2's staleness bounds are empirically unacceptable for flagship apps *and* on-chain composability (hard-part d) turns out not to matter. All three together are ~the decision to become Farcaster; then copy Snapchain honestly (per-author shards, epoch checkpoints preserved forever, no pruning).

**Recommendation:** Posture 1 now (it is v2) + its checkpoint hardening as an immediate convention; Posture 2 as the designed target for replication/provenance workstreams (it subsumes `efs-v2-holistic-redesign.md` §3.3 and should be drafted alongside the portable-signature design — the two are one artifact-format decision apart); Posture 3 rejected with revival conditions on file. Resolve §4's three flags (LIST caps, firstUID semantics-freedom, UID-keyed cycle tie-break) before the freeze — they are the only places chain-order dependence has leaked into what should be per-author, portable semantics.

---

## 7. Source list

Primary: [ATProto repository spec](https://atproto.com/specs/repository) · [Bluesky repo-sync v3 update](https://docs.bsky.app/blog/repo-sync-update) · [Relay updates for Sync v1.1](https://docs.bsky.app/blog/relay-sync-updates) · [Farcaster FIP: Introducing Ordering (#193)](https://github.com/farcasterxyz/protocol/discussions/193) · [Farcaster FIP: Snapchain (#207)](https://github.com/farcasterxyz/protocol/discussions/207) · [Snapchain docs](https://snapchain.farcaster.xyz) / [repo](https://github.com/farcasterxyz/snapchain) · [Ceramic TileDocument conflict resolution](https://github.com/ceramicnetwork/docs/blob/main/docs/docs/advanced/standards/stream-programs/tile-document.md) · [CIP-110 anchor contract](https://cips.ceramic.network/CIPs/cip-110) · [ceramic-anchor-service](https://github.com/ceramicnetwork/ceramic-anchor-service) · [Ceramic→Textile](https://blog.ceramic.network/ceramic-is-joining-textile/) · [Focusing on Recall](https://blog.ceramic.network/the-future-of-ceramic-focusing-on-recall/) · [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962) · [Sigsum design](https://git.sigsum.org/sigsum/plain/doc/design.md) · [C2SP tlog-witness](https://github.com/C2SP/C2SP/blob/main/tlog-witness.md) · [Armored Witness](https://github.com/transparency-dev/armored-witness) · [LOCKSS sampled voting (SOSP '03)](https://www.cs.rochester.edu/meetings/sosp2003/papers/p140-maniatis.pdf) · [NIP-09](https://github.com/nostr-protocol/nips/blob/master/09.md) · [NIP-62](https://nips.nostr.com/62) · [OpenTimestamps announcement](https://petertodd.org/2016/opentimestamps-announcement) · [EAS.sol](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/EAS.sol).
Secondary/commentary: [Stark, CT bird's-eye view](https://emilymstark.com/2020/07/20/certificate-transparency-a-birds-eye-view.html) · [transparency.dev witness-network post](https://blog.transparency.dev/can-i-get-a-witness-network) · [BlockEden Farcaster 2025 retrospective](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/).
From prior knowledge, medium confidence on details: CONIKS (USENIX Sec '15), WhatsApp key transparency (2023), EIP-4844 blob retention (~18 days), Optimism/Wintermute CREATE-address incident (already cited in `deterministic-ids.md` §9).
Staleness: Snapchain facts as of Apr–Oct 2025 sources; Ceramic shutdown announced Feb 2025 with mid-2025 target, current operational status unverified; ATProto Sync v1.1 rollout 2025; CT witness ecosystem actively evolving through 2025.
