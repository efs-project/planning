# EFS substrate decision — EAS, native, or portable records (the v2+ freeze)

**Status:** draft
**Target repos:** planning, contracts, sdk
**Depends on:** [[deterministic-ids]], [[efs-v2-holistic-redesign]], [[efs-v2-transition-plan]]
**Supersedes:** — (on acceptance: amends the v2 bundle with the §3 reservations; re-scopes the mission's portability claims per §5; resolves [[deterministic-ids]]'s coupled duplicate-policy × replication-model question per §3.4)
**Reviewers:** —
**Last touched:** 2026-07-02

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk

## Problem

EFS's EAS usage has been shrinking with every design round: v2 moved references off EAS UIDs; replication planning moved identity off `msg.sender`; portability planning moved authenticity off EAS signatures (even EAS's *offchain* attestations bind a chainId + verifying contract in their EIP-712 domain — portable name, non-portable proof). The pattern raised the foundation question: **what is the right substrate for a portable, verifiable, permanent graph database — and is EAS it?**

A full investigation was run (2026-07-02): 13 research autopsies (Nostr/SSB, ATProto, Farcaster, Ceramic/IPLD, CT/Trillian/KERI/Datomic, VC/DIDs/Verax/Sign, CRDTs/Holochain/Urbit, on-chain composability, identity crux, spam economics, apps requirements, consensus-on-existence, EFS coupling audit), 4 end-to-end candidate architectures each designed and then red-teamed, 3 value-system judges, 1 completeness critic. Record: [[2026-07-02-substrate-investigation]]; full corpus: `planning/Reviews/2026-07-02-substrate-corpus/`.

## The central finding

**"EAS or not" was the wrong axis.** The investigation's real result is a three-way decomposition of what the mission needs:

1. **Single-chain guarantees** (existence, ordering, one-SLOAD revocation, availability fused to commitment, synchronous contract reads) — real, cheap, and only a chain provides them. Every off-chain system that needed them rebuilt a chain or a directory: Farcaster built Snapchain; ATProto institutionalized plc.directory + relays; Ceramic died trying anchors-as-consensus.
2. **Portable authenticity** ("author I signed this, provably before epoch E") — real and cheap: a chain-free signed envelope carried as calldata. This is what actually survives chain death, and EFS can have it *on top of* any carrier, including EAS.
3. **Portable currency** (cross-chain/post-chain "is this the latest? is it revoked? is this key still valid?") — **not purchasable at any price point offered by any of the four architectures.** Every mechanism proposed (author-signed HEADs, checkpoint witnessing, earliest-anchor fork choice, KEL enforcement) was killed by its own red team: HEAD currency is circular under withholding; earliest-anchor fork choice contradicts the corpus's own Ceramic lesson (anchors are clocks, not consensus); author-signed completeness proofs bind only honest authors; key-validity windows never close when a home chain dies (eternal forgery oracles); and the year-100 "offline verification from headers" procedure is uncashable on the PoS/L2 substrate class EFS actually uses (sequencer signatures aren't self-certifying; blobs prune in ~18 days; dead-PoS histories are long-range-forgeable post-CRQC). Delivering portable currency requires a live cross-chain witness/consensus layer — a designed-but-unexplored "Architecture E" (§6.1), not a v2 purchase.

**Therefore: sell (1) and (2); refuse to sell (3) until it can be bought.** The honest product claim is: *portable authenticity + live-home-chain currency; currency elsewhere is graded and labeled, never faked.*

## Proposal — the v2+ freeze

### 1. Ship v2 chain-native, on EAS, single-chain guarantees only

Architecture A-core (chain-carried records on EAS with the full v2 deterministic-ID Codex) is the only candidate that survived its own red team *as something that ships within the one freeze window*. EAS is retained as the **carrier**, not the foundation: it provides the audited write entrypoint, batch atomicity + hook ordering, and revocation registry; the ecosystem-legibility and gas-as-spam-defense arguments are struck (the first inverts under enveloped writes, the second was refuted by the investigation's own economics stream — lenses and index shape are the spam defense, gas is not). If the native kernel's external review demonstrably fits the freeze window, swapping the carrier is a capacity decision, not a research question — the coupling audit prices a minimal kernel at less code than the EAS it replaces, and the deep design surface (the envelope/replay domain) is identical either way.

### 2. The Portable Authorship Envelope — rehearse now, freeze the format

Every EFS write becomes signable under a **chain-free domain** (no chainId, no verifyingContract; spec-owned domain constants): the envelope is the 100-year artifact; calldata is its first carrier; resolvers verify author-from-signature, making the attester the *author*, `msg.sender` the *submitter* — gasless relaying and dead-author replication fall out. Phase-1 rehearsal (§7 experiment b) runs it as a client convention + resolver-hook verification on unmodified EAS **before** anything is Etched.

### 3. Non-negotiable freeze reservations (the D-shaped future, mechanically reserved)

The corpus mantra "identity indirection cannot be retrofitted" (NIP-26/NIP-41/SSB fusion all failed) is true only when the frozen verification path has **no slot**. The reservations below create the slots, converting a future portable-layer deployment from broken-pledge to additive:

1. **`bytes32` identity word** in every ID derivation (not `address`) — digest-shaped identities become legal without re-derivation.
2. **Envelope + signature domains + key-event-log (KEL) event format** frozen as reserved Codex sections *with golden vectors*, rehearsed client-side before freeze.
3. **Reserved schema/kind IDs** for KEYGRANT/REVOKE-class identity records.
4. **The three chain-order leak fixes** (SCC cycle tie-break re-keyed on chain-free ids; LIST `maxEntries` declared chain-local; registry `firstUID` semantics-free) — already flagged in [[deterministic-ids]], now substrate-motivated.
5. **TID device-discriminator bits** in the per-author sequence format (two honest devices must never manufacture equivocation evidence — the SSB death; record-level seq collisions are NEVER duplicity; only home-registry head/KEL equivocation is, and there the contract prevents it outright).
6. **Normative read-grade vocabulary**: resolvers MUST distinguish *proven-absent* from *unknown* and never resolve missing data as no-claim (first-attester-wins is anti-monotone under missing data — the one rule all four red teams independently converged on).

### 4. Resolutions this ruling forces in the v2 docs

- **Replication model** ([[deterministic-ids]] §9, the coupled Phase-0 question): resolved to **signature-verified permissionless carriage** — the envelope makes "claimed attester" checkable, closing model A's dead-attester gap and model C's authentication flaw at once. Owned-kind duplicates: idempotent no-op **iff byte-identical payload**; same derived id + different payload is stored as author-equivocation evidence, never merged and never a batch-killing revert (this preserves v2's anti-corruption intent while surviving permissionless resubmission).
- **"Attester = user, no relayers"** is superseded by **"author = user; submitter may be anyone"** — the lens intent (identity keys on the user) is preserved; the mechanism (msg.sender) is generalized.
- **What is explicitly NOT shipped**: HEAD/CHECKPOINT cross-chain currency, earliest-anchor fork choice anywhere in frozen semantics, KEL *enforcement* machinery, cross-chain absence proofs. "Revocation is a theorem" comes out of all language; revocation is a theorem **on the live home chain**, bounded-staleness against an availability-coupled head, and *unknown* beyond that — graded, labeled, honest.

### 5. The mission ruling required first (only James can make it)

**Default permanence vs a free ephemeral tier.** The judges' split reduced to this: records-first architectures win only if EFS serves sub-$0.001 stranger-writes (comments/social/reviews) via a free tier — which is precisely the tier that is "a publishing medium, not an archive" (Nostr-grade, dies in years 3–10, evidentiary-dead post-CRQC if never anchored). Recommended ruling: **EFS is a permanent archive with social features, not a free firehose** — no default-ephemeral tier; stranger-writes are served by sponsored L2 gas + app-layer aggregation, with the achievable price *measured* (§7a) rather than assumed. If measurement fails AND stranger-write apps are ruled must-have, the mission itself must be amended first — the substrate follows the mission, never the reverse.

### 6. Commissioned workstreams (gaps the investigation exposed)

1. **Architecture E — rented witness-quorum ordering.** All four red teams hit the same wall: portable currency needs "a witness layer with liveness." The verifiable-logs research supplied the pattern (C2SP checkpoints, proactive cosigning, quorum-as-immutable-policy-file); no architect used it structurally. Design it as a candidate *post-freeze additive layer* riding the §3 reservations.
2. **Bulk-bytes / endowment substrate.** The Arweave pay-once-endowment autopsy was punted; bulk bytes (10GB ≈ $490k L1 calldata vs $20–50 Arweave) is a top-5 apps requirement currently answered by "mirrors + hope," and every autopsy says volunteer mirrors die in 3–7 years.
3. **Illegal content & operator liability.** Zero corpus coverage (CSAM/DSA/takedown). A permanent anyone-writes archive WILL receive it (ordinals precedent); bytes-fused-to-chain (our archival tier) makes this a validator/mirror/RPC liability question that bears directly on byte-on-chain doctrine. Decision-relevant, not compliance trivia.
4. **Privacy/HNDL design.** "Privacy possible" has requirements but no design: key distribution, metadata privacy (the public claim graph leaks social graphs even with encrypted payloads), harvest-now-decrypt-later on a permanent chain. Extends the encrypted-file conventions in [[efs-v2-holistic-redesign]] §2.3.
5. **Substrate mortality & censorship floor.** State expiry (The Purge), blob pruning, precompile repricing, OFAC builder/sequencer filtering vs "self-submission is the censorship floor" — never researched; the floor is currently an assumption.
6. **Codex/epoch-table governance.** Every architecture's PQ story and fork doctrine terminates in a mutable human-amended document — the smuggled trust root. Joins the trust-root-stewardship workstream ([[efs-v2-holistic-redesign]] §3.2).
7. **One-freeze pledge scope definition.** The pledge decided architecture questions without ever being precisely scoped (Etched bytecode + ID derivations vs additive schemas vs client conventions). Write the scope before it rules anything else.

### 7. Deciding experiments (cheap, ordered, run before further design)

a. **Days — the Class-2 price measurement.** Benchmark real sponsored/relayed `multiAttest` stranger-writes (envelope as client convention, unmodified EAS, existing fork + Base at current blob prices). Within ~10× of $0.001/write → Class-2 is served chain-native and records-first's raison d'être is void; if not → the §5 mission question is live.
b. **1–2 weeks — the envelope rehearsal.** Client-side signing + resolver-hook verification on devnet validates the reserved formats (§3.2) before Etching — A's only novel machinery, de-risked.
c. **Calendar-parallel — a named institution.** One archive/DAO/registry institution co-signs requirements (or an LOI) for the portable tier before any bespoke-kernel verification dollar is spent. None forthcoming → the portable layer stays a hedge, which the reservations fully fund.
d. **One afternoon — the dead-chain fire drill.** Kill a devnet; verify one artifact from exported headers/receipts alone. Converts the corpus's most-repeated unverified claim ("year-100 verification is offline-cashable") into a procedure or a retraction.

### 8. Decision rules (pre-committed)

- **Leave EAS for the native kernel within v2** iff the kernel + envelope external review demonstrably fits the freeze window at stated capacity — a capacity fact, measured at the week-3 checkpoint, not a preference.
- **Revive records-first (C/D machinery)** iff: experiment (a) fails AND the mission is amended to serve Class-2 as a distinct tier, OR experiment (c) produces a funded institutional demand signal — and only with the red-team redesigns (home-chain-per-identity with pre-committed succession; availability-coupled heads; key-expiry epochs; seq-primary supersession with ingestion clamps) done on paper and externally reviewed first.
- **Build Architecture E** iff a designed witness-quorum layer passes external review as an additive deployment on the §3 reservations — never as frozen v2 surface.
- **Un-reserve nothing.** The §3 reservations ship regardless of every other outcome; they are the cheap end of every future.

### 9. False-confidence register (claims that must not calcify)

The investigation exhibited textbook imitation risk; these recur everywhere and have thin evidentiary bases: "year-100 verification = hashes + headers, offline" (never executed — run §7d); "composability demand = exactly two app categories" (one categorization exercise, selection-biased sample); "$0.001 stranger-write ceiling" (one derivation from Farcaster's shifting rent, 82–91% of *paying* accounts were spam-labeled); "lenses are the proven spam answer" (EFS's most-cited, least-tested mechanism — email's actual endgame is a centralized reputation oligopoly); "cross-chain proofs are dead" (one vendor failure generalized; add a re-check clause); coupling-audit LoC/gas point estimates (never re-measured). Treat each as a hypothesis with a named test, not a fact.

## Open questions

- [ ] **§5 mission ruling**: permanent-archive-with-social-features (no default-ephemeral tier) — confirm or amend. Everything else sequences after this.
- [ ] **Carrier call**: EAS-carried v2+ (default) vs native kernel within the window — decided by the week-3 capacity checkpoint per §8.
- [ ] **Which of the §6 workstreams start now** vs post-freeze (recommend now: liability (§6.3) and pledge-scope (§6.7); the rest post-freeze).
- [ ] **Experiment (c) target list**: which institutions to approach for the portable-tier LOI.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

On acceptance: (1) the §3 reservations enter [[efs-v2-holistic-redesign]] §1 as freeze-bundle items and [[deterministic-ids]] gains the envelope/KEL reserved sections; (2) [[efs-v2-transition-plan]] Phase 1 adds experiments (a)/(b)/(d) as gates and the §8 carrier checkpoint; (3) the §6 workstreams become name-first designs in this folder. The four architecture files and thirteen research autopsies in `planning/Reviews/2026-07-02-substrate-corpus/` are the evidence base — cite them, don't re-derive them.
