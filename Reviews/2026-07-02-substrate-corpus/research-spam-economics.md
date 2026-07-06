# Spam economics for a portable-records EFS

**Agent:** spam-economics (EFS substrate investigation)
**Date:** 2026-07-02
**Question:** What replaces gas as the write cost in a portable-records world?
**Method:** Web research on deployed systems (primary sources cited and distinguished from commentary; staleness flagged), plus repo reads of `/Users/james/Code/EFS/planning/Designs/deterministic-ids.md`, `efs-v2-holistic-redesign.md`, `efs-v2-transition-plan.md`.

---

## 0. Executive verdict

**Nothing replaces gas as a single write cost, because gas was never a single thing.** Every deployed attempt to substitute one universal write price for spam control has failed against motivated adversaries (Hashcash/PoW: quantitatively debunked in 2004; Farcaster storage rent: 82–91% of *paying* accounts labeled spammy by Farcaster's own classifier; ENS-style rent: works, but only for scarce names, and rent-expiry is anti-archival). What has actually worked, everywhere, at every scale, is the same two-part pattern: **(1) authenticated identity + receiver-side trust scoping** (email's SPF/DKIM/DMARC + reputation; Bluesky's labelers; Nostr's web-of-trust relays; Scuttlebutt's follow-graph replication), plus **(2) accountable service layers that rate-limit or charge at their own edge** (Bluesky's per-DID point budgets; Nostr's paid relays; ION's per-op anchoring fees).

EFS is unusually well-positioned: **lenses are already the winning mechanism** — first-attester-wins over an ordered trusted-attester list is exactly the "receiver-side trust scoping" that beat email spam, rediscovered independently by every decentralized social system. The critical insight from this research: **the spam problem in a portable-records EFS genuinely does reduce to (a) shared-index/registry pollution and (b) relay/storage/discovery costs** — and the case-study record says (a) is solved by index *shape* (per-attester indices primary, global demoted), not by price, and (b) is solved by lens-scoped replication (SSB's transitive-interest model), not by price. Prices belong at exactly two places: chain anchoring (which prices *canonicity and ordering*, not spam — batching collapses per-record cost to ~0) and replaceable service edges (relayers, paymasters, gateways — never Etched).

---

## 1. What gas actually buys today (decompose before replacing)

Gas on the EFS write path currently bundles four distinct functions:

1. **Substrate compute metering** — DoS protection for validators/sequencers. Non-negotiable wherever a chain is involved; irrelevant to off-chain portable records.
2. **Per-write spam price** — the implicit assumption that "writes cost money so spam is bounded." The inscriptions episode (§2.11) shows this fails exactly when gas is cheap, which is the *stated EFS plan* (OP-Stack L2 as default write plane, deterministic-ids §12).
3. **Registry/index admission fee** — every EFS attestation currently pays (in gas) to appear in shared on-chain indices. This is the function the v2 redesign already identifies as under-priced: "~$450–4,500 permanently poisons a hot shared folder's global `_children` scan path" (efs-v2-holistic-redesign §2.8).
4. **Total ordering / timestamping** — the chain sequences writes and gives supersession a clock.

In a portable-records world these unbundle. Portable signed records get (none of the above) for free — that is the point. The design question is which functions must be re-provided, where, and at what price. The case studies below map each function to its best-in-class deployed replacement.

---

## 2. Case studies with real data

### 2.1 Hashcash / PoW stamps for email — the canonical quantitative negative result

**Primary source:** Laurie & Clayton, *"Proof-of-Work" Proves Not to Work*, WEIS 2004 ([PDF](https://www.cl.cam.ac.uk/~rnc1/proofwork.pdf); full paper read for this report).

The only rigorous published attempt to price a PoW stamp, using real ISP data (Demon Internet, ~200k customers). Exact numbers:

- **Economic approach:** a spam-capable PC (~$500 amortized over 1,000 days + electricity) costs ~75¢/day to run. At 0.005¢/email (marginal spam profitability per Goodman & Rounthwaite), the spammer breaks even at 15,000 emails/day ⇒ the puzzle must cost **≥5.8 seconds per message** just to reach break-even harassment. At 0.1¢/email pricing, restricting spammers to 1,750 emails/day requires **≥50 seconds of CPU per message**.
- **Free-CPU (botnet) approach:** with ~1M compromised machines (MyDoom-era estimates; the ISP observed exploited customers sending ~21,000 emails/day), reducing spam to 1% of legitimate email requires restricting *every* sender to 250 emails/day ⇒ **C = 346 seconds per message**.
- **The kill shot — legitimate-tail data:** 93.5% of machines sent <75 emails/day, but the distribution has a long tail. The 1,750/day and 250/day caps would have blocked **0.13% and 1.56% of legitimate customers** on daily rates — and **1% to 13% on hourly rates** (people batch their sending). Heterogeneous hardware makes it worse: CPU-bound puzzles vary ~360× across devices (10s on a 3GHz Pentium = 1hr+ on a PDA); even memory-bound puzzles (Dwork et al. 2003) vary 4×, so the cap must be set 4× lower still.
- **Conclusion, verbatim in spirit:** for PoW to be plausible you need "many orders of magnitude between the work done by the good guys and that achievable by the bad guys" — and no such gap exists, because attackers steal cycles and buy hardware while legitimate users have phones.

Hashcash was never deployed at email scale. Its legacy is Bitcoin — i.e., PoW works for *consensus leader election*, not for *per-message admission pricing*.

**EFS relevance:** the asymmetry argument generalizes to any flat write cost. The attacker's willingness-to-pay is set by their expected value per record (in crypto contexts: airdrops, MEV, scam yield — effectively unbounded), while the legitimate publisher's tolerance is set by convenience. A price that deters the former destroys the latter's long tail (bulk archival publishers are exactly the legitimate long tail EFS most wants).

### 2.2 Nostr NIP-13 — PoW stamps in the wild (mostly unused)

**Primary source:** [NIP-13 spec](https://github.com/nostr-protocol/nips/blob/master/13.md). Difficulty = leading zero bits of the NIP-01 event id; the `nonce` tag SHOULD commit the *target* difficulty so lucky lower-target hashes can't free-ride; relays advertise `min_pow_difficulty` via [NIP-11](https://nips.nostr.com/11).

Two structurally interesting properties, both cutting against PoW-as-work:

1. **Delegated PoW is explicitly blessed:** because the event id doesn't commit to a signature, "PoW can be outsourced to PoW providers, potentially for a fee" (spec text; see also a [proposed PoW-service NIP](https://gist.github.com/blakejakopovic/6c0ea718c0f956c461e9e8952d8c6533)). The moment work is outsourceable it is just a price denominated in electricity — with worse UX and worse distributional properties than a fee, and Laurie–Clayton's asymmetry intact.
2. **Adoption is thin.** NIP-13 remains a Draft/optional NIP; PoW-requiring relays exist but are a small minority (commentary: [nostr.co.uk NIP index](https://nostr.co.uk/nips/nip-13/), [stacker.news discussion](https://stacker.news/items/59733)). No measured data on what fraction of relays enforce PoW was found (flagging the gap); qualitative consensus across sources is that the ecosystem's real spam defenses are elsewhere (§2.3). Staleness note: sources span 2023–2026.

**EFS relevance:** Nostr is the closest existing thing to a portable-records EFS — chain-free signed events, permissionless relays, advisory deletion. Its revealed preference matters more than any whitepaper: **given the choice, the portable-signed-records ecosystem did not converge on PoW.**

### 2.3 Nostr paid relays, filter relays, WoT relays — what Nostr actually converged on

- **Paid admission at the service edge:** [nostr.wine](https://nostr.wine/) charges roughly 21,000 sats (~$7/month at the time of sources) for write access; its companion [filter.nostr.wine](https://nostr-wine.github.io/filter-relay/) costs ~10,000 sats/month and restricts "global" to *your follows plus your followers' follows* — an explicit trust-graph scope. In Sept 2024 it shipped a "Purgatory" pipeline to quarantine new-user spam without losing real users (primary: relay readme/docs; commentary: [The Bitcoin Manual](https://thebitcoinmanual.com/articles/paid-nostr-relay/)).
- **Web-of-trust relays** filter writes/reads by social-graph distance (commentary: [Nostr WoT article](https://medium.com/nostr-wot/nostr-solved-censorship-now-lets-solve-trust-cc776bbd0f8f)); public free relays are, per the same sources, the spam buckets.

**EFS relevance:** relays discovered lenses. The admission price is *per-service, adjustable, refusable* — exactly what EFS doctrine allows ("opt-in layers") and what immutable contracts forbid. Note the direct mapping: filter.nostr.wine's "follows + follows-of-follows global" ≈ an EFS default lens chain; a paid relay ≈ a gateway/indexer with its own admission policy.

### 2.4 Farcaster storage rent — the flagship experiment, and its measured failure against spam

**Primary sources:** [FIP-6: Flexible Storage](https://github.com/farcasterxyz/protocol/discussions/98) (fetched in full), [Farcaster docs — Messages](https://docs.farcaster.xyz/learn/what-is-farcaster/messages), [Storage Registry contract docs](https://docs.farcaster.xyz/reference/contracts/reference/storage-registry), [warpcast/labels dataset](https://github.com/warpcast/labels).

**The design (FIP-6, 2023):** message storage framed as a "common-pool resource"; rent chosen over invite-gating, application-level filtering, and dynamic pricing (GDA/VRGDA considered and rejected for tuning complexity). **$5/unit-year at launch (500,000,000 wei USDC), later $7** (current docs; an ETH price oracle converts). One unit = **5,000 casts + 2,500 reactions + 2,500 links + 50 profile entries + 50 verifications** (sized at the 99th percentile of cast usage). Signup requires renting ≥1 unit — an explicit identity-admission price. Expiry = **365 days + 30-day grace**; after that, and whenever an account exceeds a limit, hubs **prune the lowest timestamp-hash messages**, hourly on the hour ([dTech explainer](https://dtech.vision/farcaster/hubs/howdoesfarcasterstoragework/), commentary).

**The outcome (2024–2025):**

- Spam persisted and became the dominant account class. Warpcast's own published spam-label dataset ([merkle-team/labels](https://github.com/warpcast/labels), analyzed by [farmap](https://github.com/cazeth/farmap) and the [pichi analyses](https://paragraph.com/@pichi/the-unwritten-rules-of-warpcast-avoiding-spam-labels), commentary on primary data): **Jan 23 2025 snapshot — 236,865 "likely spammy" + 200,705 "might be spammy" vs 44,054 "unlikely" ⇒ ~91% of active accounts carried a spam-side label**; a Feb 20 2025 re-run still showed **~82%**. Every one of those accounts had paid (or been sponsored for) storage rent.
- The mechanism that actually filters Farcaster feeds is a **centralized ML reputation model** (inputs per the repo README: historical activity, social graph, message content, moderation actions; weekly updates; binary label since 2025-05-22) — i.e., a lens, operated by one company, with predictable legitimacy complaints ("shadow-banning," "centralized moderation" — [BlockEden 2025 retrospective](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/), commentary with its own slant; treat numbers as indicative).
- Why rent failed as a spam price: it was **priced to cover hub storage costs, not to exceed attacker EV**. During the 2024 airdrop-farming wave (DEGEN etc.), expected value per active-looking account was orders of magnitude above $7/yr ([TechCrunch on the $150M raise vs 80K DAU](https://techcrunch.com/2024/05/21/farcaster-a-crypto-based-social-network-raised-150m-with-just-80k-daily-users/), commentary). Laurie–Clayton's condition — price must exceed adversary EV without crushing the legitimate tail — was unmeetable, again.
- **Rent is anti-archival by construction:** lapse ⇒ deletion. Farcaster's own ecosystem answer to permanence is "mirror to Arweave" ([Pinata](https://pinata.cloud/blog/ipfs-as-an-archival-solution-for-farcaster/), commentary). And [FIP: Farcaster Pro](https://github.com/farcasterxyz/protocol/discussions/236) (June 2025, finalized) shows the drift: the paid tier sells *features* (10k-char casts, banners) and "does not currently guarantee users extra storage" — monetization decoupled from both storage and spam.

**EFS relevance:** this is the single most direct test of "storage rent replaces gas" and it failed on both EFS-critical axes: it did not stop spam, and it structurally deletes data. A 100-year archive cannot adopt any mechanism where non-payment ⇒ pruning of already-published records. Rent may gate *admission to a service*; it must never gate *retention of anchored data*.

### 2.5 Steem/Hive Resource Credits — stake as a renewable rate limit

Feeless chains; each account's transaction budget (Resource Credits) regenerates in proportion to staked tokens (Hive Power). Community sources report spam "decreased a lot" after the RC hardfork and that small accounts (~100–200 SP staked) could operate normally ([hive.blog: RCs effectively block spam](https://hive.blog/steem/@astromaniak/resource-credits-effectively-block-spam-on-steem), [RC explainer](https://hive.blog/wiki/@propolis.eng/resource-credits)). **Source caveat: all of this is community commentary on their own chain; no independent measurement found.**

Structure worth copying conceptually: stake converts *capital opportunity cost* (not spend) into a **regenerating rate limit** — a free tier whose size scales with skin-in-the-game, refundable by unstaking. Structural problems: (1) it requires a consensus substrate to meter consumption, unavailable to off-chain portable records; (2) it couples write access to token wealth (plutocratic, and EFS has no token by doctrine); (3) new-account onboarding requires delegation — an invite system in disguise.

### 2.6 Token-curated registries (adChain) — staking-for-curation degenerates

The first mainnet TCR (adChain publisher registry, live April 2018) died quickly. Post-mortem by its own builders ([MetaX learnings](https://www.adtoken.com/blog/learnings-from-metax-on-launching-the-first-token-curated-registry-tcr), primary; [TCR game-theory paper](https://arxiv.org/abs/1809.01756)): **free-rider problem** (token holders don't do curation work), **no shared standards** for what belongs on the list, **whale capture** of votes, **diminishing challenge incentives** as the registry grows. **EFS relevance:** any "stake to admit records to the shared registry, challenge to evict" design imports these dynamics. EFS's lens-as-LIST curation avoids them precisely because curation is *per-curator publication* (reputation-backed, no shared vote, no stake game) rather than a global staked list.

### 2.7 Pay-per-write name registries — ENS vs Namecoin (rent works only for scarce names)

- **Namecoin (one-time cheap fee):** Kalodner et al.'s empirical study ([Princeton CITP](https://blog.citp.princeton.edu/2015/05/21/an-empirical-study-of-namecoin-and-lessons-for-decentralized-namespace-design/), primary research, 2015): of **196,023 registered names, only 28 were non-squatted with nontrivial content (~0.014%)**. Cheap one-time payment ⇒ squatting wasteland.
- **ENS (recurring rent):** $5/yr (5+ chars), $160/yr (4), $640/yr (3) — the fee's *stated primary purpose* is "an incentive mechanism to prevent the namespace from becoming overwhelmed with speculatively registered names" ([ENS docs FAQ](https://docs.ens.domains/faq/), primary); expiry + 90-day grace + a 21-day decaying Dutch-auction premium on released names prevents sniping ([ENS support](https://support.ens.domains/en/articles/7900605-fees), [decaying premium post](https://medium.com/the-ethereum-name-service/new-decaying-price-premium-for-newly-released-names-72080a650c15)); Vitalik's [demand-based recurring fees essay](https://vitalik.eth.limo/general/2022/09/09/ens.html) argues even this underprices contested names. Squatting still rampant at the $5 tier (all Scrabble five-letter words taken).

**EFS relevance — a genuinely happy structural result:** EFS's v2 deterministic anchorIds make shared-name squatting *meaningless*. An anchor is an unowned Schelling object; `anchorId = f(parentId, nameHash, kindTag)`; duplicate instantiation is an idempotent no-op and the object is identical regardless of who instantiates it (deterministic-ids §6). There is nothing to own, resell, or hold hostage — the squatting economy that consumed Namecoin and stresses ENS has no purchase. (EFS's "no global human-name registry at root" non-change is independently validated by the Namecoin data.) The scarce contested resource in EFS is therefore **not names but index position and attention** — e.g., who appears in a hot folder's enumeration — which is a lens/read-path question, not a registration-pricing question.

### 2.8 Web-of-trust and invite admission — Scuttlebutt and early Bluesky

- **Scuttlebutt:** replication follows the social graph — you replicate feeds you follow (plus friends-of-friends), full stop ([SSB handbook](https://handbook.scuttlebutt.nz/concepts/), primary; [Kermarrec et al., DICG 2020](https://dicg2020.github.io/papers/kermarrec.pdf) formalizes the "transitive-interest" model as spam- and sybil-resistant). The design story: "map the computer network along the social network — defeating spam, because you aren't friends with spammers" ([design challenge doc](https://github.com/ssbc/handbook.scuttlebutt.nz/blob/master/stories/design-challenge-sybil-attacks.md), primary). Spam from strangers is not merely hidden — **it is never fetched, never stored, never relayed**. The cost paid: discovery is weak, onboarding is hard, and the network stayed tiny. This is the purest existing implementation of "lenses at the replication layer."
- **Bluesky invite codes:** a year of invite-gating (mid-2023 → Feb 6, 2024) to throttle growth while moderation tooling matured. Codes were sold and used as phishing/malware lures ([Born City](https://borncity.com/win/2023/11/13/stop-bluesky-fake-invites-dropping-malware/), commentary). On opening: **~1M signups in day one, ~5M by end of Feb 2024** ([MacRumors](https://www.macrumors.com/2024/02/07/bluesky-ends-closed-beta-period/); [arXiv measurement papers](https://arxiv.org/pdf/2408.03146)). Verdict: invites are a *launch-phase governor*, not a spam architecture — Bluesky's durable answer is §2.9's rate limits plus labelers.

### 2.9 Rate-limited free tiers — Bluesky's numbers, and where rate limits can live

**Primary source:** [Bluesky rate-limits post](https://docs.bsky.app/blog/rate-limits-pds-v3) + [current docs](https://docs.bsky.app/docs/advanced-guides/rate-limits). Per-DID write budgets: **CREATE=3 / UPDATE=2 / DELETE=1 points; 5,000 points/hour, 35,000 points/day ⇒ max 1,666 creates/hour, 11,666/day.** Explicitly sized to be invisible to humans and binding on "prolific bots." Additionally, PDS-level admission tooling (invite codes, CAPTCHAs, phone verification, payment) and delegated moderation via [Ozone labelers](https://docs.bsky.app/blog/blueskys-moderation-architecture) — labels *annotate* content for subscribing clients rather than deleting it, the closest deployed analog to EFS lenses at consumer scale.

**Key structural point:** rate limits require an accountable choke point (the PDS, the relay). Portable signed records have none at the protocol layer — a record created offline at any rate is still valid. So free-tier rate limiting in EFS can only live at *services*: relayers/paymasters, gateways, indexers, hosted mirrors. Those are all redeployable surfaces, which is exactly where EFS doctrine says policy belongs.

### 2.10 Anchoring economics — Sidetree/ION and OpenTimestamps (what "costly anchors" really price)

- **Sidetree/ION** ([spec](https://identity.foundation/sidetree/spec/), primary; [ION repo](https://github.com/decentralized-identity/ion)): batches ~10,000+ DID operations into one Bitcoin transaction. Because batching collapses per-op chain cost toward zero, the protocol *re-introduces* per-operation pricing deliberately: a **deterministic per-op fee** scaled to the number of ops declared in an anchor (so nobody floods during cheap-fee windows), a **maximum ops per batch**, per-op PoW in some configurations, and **proof-of-fee value-locking** (a ~30-day timelocked Bitcoin escrow) for large anchors. Also note Sidetree's documented data-withholding hazard: an anchor can reference batch content that is never published ("late publish"), polluting/forking resolution — anchors alone don't guarantee well-formed registry state; content availability is a separate obligation.
- **ION's fate:** despite sound anchoring economics, Microsoft removed did:ion from Entra Verified ID (preview support ended; **did:ion selection removed in December 2023, did:web became the only trust system** — [Microsoft Entra FAQ/what's-new](https://learn.microsoft.com/en-us/entra/verified-id/whats-new), primary). The system died of demand and stewardship, not spam — a reminder that anti-spam design is never the binding constraint on survival.
- **OpenTimestamps** ([opentimestamps.org](https://opentimestamps.org/), primary): Merkle-aggregates unbounded hashes into single Bitcoin transactions via donation-funded calendar servers ⇒ **timestamping is free at the margin, for everyone, forever**. "Almost unlimited scalability."

**The decisive lesson for the hybrid-EFS premise:** "free records, costly anchors" is only coherent if you decide *what an anchor buys*. If an anchor buys **existence/ordering proof**, aggregation makes it free (OpenTimestamps) and it is **not** a spam control — a spammer puts a million records under one Merkle root. If an anchor buys **per-record admission to an enumerable shared registry** (Sidetree's position, EFS's object registry), then the per-record price must be protocol-enforced at registration (gas per attestation does this today; any batched-anchor future must charge per op, not per anchor). Conflating the two reproduces the confusion Sidetree had to engineer its way out of.

### 2.11 Gas itself fails when cheap — the inscriptions stress test (Dec 2023)

When speculative EV exceeded gas cost, gas stopped being a spam control on every cheap chain simultaneously: **Arbitrum's sequencer went down ~78–90 minutes with ~90% of pre-outage transactions being inscriptions** ([Dedaub RCA](https://dedaub.com/blog/arbitrum-sequencer-outage/), primary analysis; [The Block](https://www.theblock.co/post/267950/arbitrum-says-all-systems-are-operational-after-surge-of-inscriptions-caused-outage-earlier-in-day)); TON slowed to ~1 tx/s; Polygon gas spiked ([Cointelegraph](https://cointelegraph.com/news/arbitrum-network-goes-offline-december-15)). **EFS relevance:** the v2 plan is "gas is the rate limit" on an OP-Stack L2 — i.e., a *cheap* chain. The redesign's own $450–4,500 folder-poisoning number is today's price; a 10–100× L2 fee drop is a plausible decade-scale assumption, so any index whose integrity depends on current gas prices must be treated as already poisoned. The index-shape fix (per-attester indices primary, global `_children` demoted to discovery — efs-v2-holistic-redesign §2.8) is the correct class of response; price-based responses are not available (immutable contracts, no tunable parameters — §4 non-changes).

### 2.12 Email's actual endgame — the pattern that won

PoW lost (§2.1). Payment lost (Goodman & Rounthwaite surveyed it; "e-money" postage went nowhere — Laurie & Clayton §1). Bonded-sender deposits (IronPort, cited in the paper) stayed marginal. What won at internet scale: **domain-authenticated identity (SPF/DKIM/DMARC) + receiver-side reputation and filtering** — Gmail is, structurally, a centralized lens over an open write network. Nobody's inbox is protected by making sending expensive; it is protected by the receiver refusing to render untrusted senders. Forty years of email is the largest natural experiment in spam economics, and its answer is the lens.

---

## 3. The EFS-specific analysis: does sybil spam even matter at the read layer?

**Mostly no — and this should be stated as a designed property, not a hope.** First-attester-wins resolution over an ordered trusted-attester list means an untrusted attester's claims are *definitionally invisible* in any lens-scoped read. A billion sybil attestations change nothing about what any lens-scoped reader sees. The prompt's proposed reduction is correct and the case-study record independently confirms it: the spam problem reduces to the surfaces that are **not** lens-scoped. Enumerating them exhaustively:

**(a) Shared-index / registry pollution.**
- The global `_children` walk and any global discovery surface (already identified, §2.8 of the redesign; ~$450–4,500 to poison a hot folder today, less on cheaper gas futures).
- The v2 object registry itself: write-once, first-writer-wins, unbounded state that anyone can grow at gas cost. Squatting of *shared* kinds is neutralized by determinism+idempotence (§2.7 above), and *owned* kinds (DATA/LIST) derive from the attester so third parties can't collide (under replication model A). Two residual registry-pollution vectors: sheer state growth (a storage-cost problem for nodes/archives, priced by gas alone), and — **if replication model C is chosen** — duplicate-instantiation REVERT becoming a front-run griefing primitive (already flagged as coupled in deterministic-ids §6/§9; the spam-economics lens supports model A here: model C makes registry writes permissionless in a way that transfers the sybil problem onto owned-object identity).
- Cross-check from the field: Bluesky's PLC directory and Sidetree registries hit the same issue — enumerable shared registries always need either per-op pricing or an operator with admission policy.

**(b) Relay / storage / replication costs.** Someone must store bytes nobody trusts yet. Farcaster's answer (prune on non-payment) is anti-archival; Arweave's answer (pay-per-byte endowment: ~5% to miners now, 95% endowed against Kryder's-law cost decay — [Arweave endowment explainer](https://permaweb-journal.arweave.net/article/storage-endowment-explained.html), primary-adjacent) prices *storage* honestly but is a fee, not spam control, and imports a century-scale economic assumption. **SSB's answer is the right one for EFS replication:** archives and mirrors replicate *lens-scoped attester sets*, not firehoses. A LOCKSS replica of EFS is "these attesters' objects, verified" — spam no lens includes is never copied, so replicated-spam cost converges to ~0 without any protocol price. The redesign's hash-verified cross-attester mirror fallback (§2.4) already fits: repair-eligibility requires a contentHash claim from a *trusted* attester.

**(c) Discovery and onboarding — the honest residual.** Lenses protect readers who have lenses. New users, and any "global/what's new" surface, sit outside every lens — and that is precisely where every studied system's spam actually lives (Nostr public-relay global feeds; Farcaster's pre-label feeds; Bluesky's firehose pre-Ozone). Every survivor converged on *published reputation as a subscribable artifact* (Warpcast labels, Ozone labelers, WoT relays). EFS's named-lens-as-LIST (redesign §2.7) is exactly this, with a decisive advantage: labelers are *competing publishers on the same substrate*, chosen per-viewer, rather than a platform monopoly. The Warpcast episode (one company's classifier labeling 82–91% of accounts, with shadow-banning accusations) is the monoculture failure mode EFS's design already avoids — provided default-lens stewardship (holistic redesign §3.2) treats the shipped default lens chain as the constitutional object it is.

**(d) Verification DoS (minor but real).** Verify-don't-trust readers do work per candidate record. Ordering matters: lens filter first (cheap set membership against trusted attesters), signature/derivation check second (O(1)), byte fetch/hash last. A reader that fetches bytes before checking the attester against the lens can be griefed for bandwidth. This is an SDK sequencing rule worth writing down.

**(e) Gasless relaying — the prize's price.** A kernel that recovers author from signature (not msg.sender) makes relaying permissionless — and moves the "who pays gas" question to relayers/paymasters. That surface then needs Bluesky-style point budgets, deposits, or allowlists — all fine, because relayers are replaceable services, plural, and refusable. A relayer's spam policy censors nothing (the author can always self-submit with gas); this is the censorship-resistance escape hatch that makes service-layer rate limiting acceptable in a cypherpunk design. (Consistent with the hackathon gasless faucet-drip and the accepted devnet-drain posture.)

---

## 4. Three coherent anti-spam postures for a hybrid EFS

Premise for all three: records are free portable signed artifacts; chains provide paid registration/anchoring; lenses scope reads. The postures differ in *where prices and scoping live*.

### Posture A — Two-class records: costly canonical registration, free portable periphery

**Design.** Any record exists for free as a signed portable artifact and can circulate, be lensed, and be verified. **Canonical status** — instantiation in a chain's object registry, membership in shared on-chain indices, eligibility as a first-class edge target — requires an on-chain registration paying gas (and, if registration is ever batched behind aggregated anchors, a Sidetree-style *per-operation* protocol fee, never per-anchor). "Spam unanchored ≠ spam canonical": the unanchored world can be arbitrarily spammy at zero systemic cost because nothing shared enumerates it.

**Evidence base.** Sidetree per-op fees + value-locking (§2.10); ENS-style pricing for genuinely scarce/contested surfaces (§2.7); gas as today's registration price; OpenTimestamps proving the free tier costs nothing to provide.

**Failure modes.**
1. **Cheap-gas industrial pollution** (§2.11): registry admission priced only by L2 gas is one fee-market collapse away from unbounded. Mitigation is architectural, not economic: per-attester indices primary, global enumeration demoted to explicitly-untrusted discovery, registry state growth treated as a node-cost problem (state-walk reconstructibility keeps archives viable even if hot indices bloat).
2. **Aggregation collapse:** if EFS ever amortizes registration through batched anchors without per-op pricing, the canonical class silently becomes free and Posture A degenerates to Posture B without its scoping discipline.
3. **Two-class legibility:** readers must always know which class they are seeing; if popular clients default to rendering unanchored records inline, the canonical/periphery boundary evaporates (email's HTML-rendering lesson). Requires a conforming-client rule like ADR-0056's render-sandbox tier.

### Posture B — Lens-native: trust-scoped everything, price nothing

**Design.** No write price on portable records anywhere. Every read, index, replication, and relay surface is lens-scoped by construction: indexers index attester sets, archives replicate attester sets, relays accept from authenticated authors within (configurable) social-graph distance, discovery happens exclusively through subscribable published lenses (lens-as-LIST). Global surfaces either don't exist or are explicitly per-operator ventures bearing their own costs.

**Evidence base.** SSB's transitive-interest replication (works; sybil-resistant by construction; §2.8); email's endgame (§2.12); Bluesky labelers (§2.9); Nostr WoT/filter relays (§2.3).

**Failure modes.**
1. **Cold start / discovery starvation:** SSB's fate. New authors are invisible until lensed; big lens publishers become de-facto gatekeepers (the Warpcast monoculture, §2.4). Mitigations: many competing lenses, cheap lens publication (it's one LIST), default-lens stewardship as a governed artifact.
2. **Ingestion-point spam buckets:** any relay/indexer that accepts unauthenticated or unscoped writes becomes Nostr's public-relay wasteland; the posture only holds if *every* hop enforces scoping or charges at its own edge.
3. **Doesn't protect on-chain shared surfaces:** EFS's kernel indices and object registry exist regardless and are written at gas cost, not lens cost. Posture B alone leaves them to Posture A's problem.
4. **Curation capture / label wars:** competing lenses fight over borderline authors; first-attester-wins within a lens is deterministic, but *lens choice* becomes the political surface. This is the least-bad place to put the politics (viewer-sovereign, forkable), but it should be named as where the fight moves.

### Posture C — Deposit/stake-gated shared surfaces (bonds, rent, stake)

**Design.** Writes to *contested shared surfaces only* (hot-folder index inclusion, discovery registries, any future name-like surface) require a refundable deposit, recurring rent, or stake-scaled budget (Steem-RC-style); ordinary per-attester writes stay free/gas-only. Evictions by expiry or challenge.

**Evidence base (mostly negative).** Farcaster rent — failed vs adversary EV, anti-archival (§2.4). ENS rent — works, but for scarce unique names, a resource EFS deliberately doesn't have (§2.7). Steem RC — plausible as rate limit, but needs stake + consensus metering and imports plutocracy (§2.5). TCR — staked curation degenerates (§2.6). ION value-locking — sound, narrow (§2.10).

**Failure modes.**
1. **Mispricing is fatal and unfixable under EFS doctrine:** "no tunable anti-spam parameters in immutable contracts" (redesign §4) means any Etched price is wrong within a decade (Farcaster couldn't hold a *mutable* price right for two years, with an oracle). An oracle dependency is a century-scale rot surface of exactly the kind v2 rejected for cross-chain proofs.
2. **Rent–archive contradiction:** expiry-based reclamation must never touch retention of published data; bonds can gate admission only. Any design where lapse ⇒ removal from the permanent record is disqualified on mission grounds.
3. **Wealth ≠ trust:** Farcaster's 82–91% spam-labeled *paying* accounts is the controlled experiment; capital gates exclude poor legitimate publishers before they exclude funded spammers.
4. **Challenge-game decay:** TCR free-riding; nobody polices a stale registry.

### Recommended synthesis (A + B, with C only at replaceable edges)

- **Anchoring/registration prices canonicity and ordering** — honestly acknowledged as *not* a spam control (batching, cheap gas), enforced per-op wherever registration is enumerable.
- **Lenses price nothing and scope everything** — reads (already true), *replication* (make lens-scoped archiving the blessed LOCKSS form), *indexing* (per-attester primary), and *discovery* (lens-as-LIST as the only blessed discovery surface; global walks demoted and labeled untrusted).
- **Rate limits, deposits, and admission fees live only at redeployable service layers** — relayers/paymasters (Bluesky-style point budgets; the gasless prize's necessary companion), gateways, hosted indexers — plural, competing, refusable, never Etched. Self-submission with gas remains the censorship-resistance floor under every service policy.
- This synthesis is doctrinally clean: it changes no schema, adds no token, honors "gas is the rate limit" while refusing to *depend* on it, and uses the preserved incentive hooks (chain-free IDs, uninterpreted TAG weights, permissionless `index()`) for opt-in reputation/bounty layers later.

---

## 5. Copy / avoid lessons

**Copy:**
1. **Email's endgame, structurally:** authenticated author + receiver-side trust scoping (lenses) is the only spam mechanism with a 30-year, internet-scale success record. Treat lenses as the *primary* anti-spam mechanism and say so in the spec.
2. **SSB's transitive-interest replication:** scope *replication and storage* by the trust graph, not just reads — spam nobody trusts is never fetched, stored, or copied. Make lens-scoped archiving the blessed LOCKSS form.
3. **Bluesky's split:** protocol stays free/open; accountable service edges (PDS ≈ relayer/gateway) carry cheap, adjustable rate limits (their numbers: 1,666 creates/hr, 11,666/day per identity); moderation ships as subscribable labels (≈ lenses), annotating rather than deleting.
4. **Sidetree's per-operation fee insight:** if registration is enumerable and batched, charge per op, never per anchor — otherwise aggregation makes admission free.
5. **OpenTimestamps' aggregation:** provide the free tier deliberately — existence/ordering proofs cost ~nothing at the margin; don't pretend they're a spam price.
6. **ENS's decaying-premium release** (if EFS ever has a contested transferable surface): expiry with Dutch-auction re-release beats one-time pricing.
7. **Deterministic IDs' own anti-squatting property:** unowned Schelling objects + idempotent instantiation make name-squatting meaningless — document this as a designed spam/economics property, not an accident.
8. **Verification ordering:** lens-membership check before signature check before byte fetch — cheap-first verification as an SDK-normative rule.

**Avoid:**
1. **PoW stamps as write cost:** quantitatively dead since 2004 (5.8–346 s/message to matter; blocks 1–13% of legitimate senders; 4–360× hardware variance; outsourceable anyway). Nostr's revealed preference confirms: the portable-records world tried it and routed around it.
2. **Storage rent as spam control:** Farcaster is the controlled experiment — $7/yr rent, 82–91% of paying accounts spam-labeled, and the actual filter was a centralized classifier. Rent priced for infrastructure never exceeds adversary EV in financialized environments.
3. **Any lapse⇒deletion mechanism near the permanent record:** rent may gate service admission, never retention. Farcaster's prune-on-expiry is the anti-LOCKSS.
4. **Staked/challenge curation of shared registries (TCRs):** free-riding, no standards, whale capture. Curation must be per-curator publication (lens-as-LIST), not a global staked game.
5. **Relying on gas prices for index integrity:** Dec 2023 inscriptions took down the exact class of chain EFS plans to write on; the $450–4,500 poisoning number only gets cheaper. Fix index *shape* (per-attester primary), don't lean on price.
6. **One-time cheap fees for scarce/contested surfaces:** Namecoin — 196,023 names, 28 real uses.
7. **Tunable economic parameters in Etched contracts, and price oracles in the trust base:** every deployed price needed retuning within ~2 years; EFS's immutability doctrine makes mispricing permanent. Prices belong on redeployable surfaces only.
8. **Invite codes as architecture:** launch-phase governor at best; they get sold and phished (Bluesky), and they gatekeep exactly the permissionless publishing EFS exists for.
9. **A reputation monoculture in the defaults:** Warpcast's single-classifier regime (91% labeled, shadow-banning disputes) is what EFS's competing-lens market must not collapse into — treat default-lens stewardship as constitutional (ties into holistic redesign §3.2).
10. **Conflating anchoring's two meanings:** existence/ordering (free via aggregation, not spam control) vs registry admission (must be per-op priced). Every "free records, costly anchors" sentence in future EFS docs should say which one it means.

---

## 6. Sources

**Primary (spec/protocol/first-party):**
- Laurie & Clayton, "Proof-of-Work" Proves Not to Work, WEIS 2004 — https://www.cl.cam.ac.uk/~rnc1/proofwork.pdf (read in full; all §2.1 numbers)
- Nostr NIP-13 — https://github.com/nostr-protocol/nips/blob/master/13.md ; NIP-11 — https://nips.nostr.com/11
- Farcaster FIP-6 — https://github.com/farcasterxyz/protocol/discussions/98 ; FIP Farcaster Pro — https://github.com/farcasterxyz/protocol/discussions/236 ; docs — https://docs.farcaster.xyz/learn/what-is-farcaster/messages , https://docs.farcaster.xyz/reference/contracts/reference/storage-registry
- Warpcast spam-label dataset — https://github.com/warpcast/labels (a.k.a. merkle-team/labels)
- Bluesky rate limits — https://docs.bsky.app/blog/rate-limits-pds-v3 , https://docs.bsky.app/docs/advanced-guides/rate-limits ; moderation architecture — https://docs.bsky.app/blog/blueskys-moderation-architecture ; Ozone — https://github.com/bluesky-social/ozone
- SSB handbook — https://handbook.scuttlebutt.nz/concepts/ , https://github.com/ssbc/handbook.scuttlebutt.nz/blob/master/stories/design-challenge-sybil-attacks.md ; Kermarrec et al., DICG 2020 — https://dicg2020.github.io/papers/kermarrec.pdf
- Sidetree spec — https://identity.foundation/sidetree/spec/ ; ION — https://github.com/decentralized-identity/ion ; Microsoft Entra did:ion removal — https://learn.microsoft.com/en-us/entra/verified-id/whats-new
- OpenTimestamps — https://opentimestamps.org/ , https://github.com/opentimestamps/opentimestamps-server
- ENS pricing/rationale — https://docs.ens.domains/faq/ , https://support.ens.domains/en/articles/7900605-fees , https://medium.com/the-ethereum-name-service/new-decaying-price-premium-for-newly-released-names-72080a650c15 ; Vitalik on ENS fees — https://vitalik.eth.limo/general/2022/09/09/ens.html
- Kalodner et al., Namecoin empirical study (Princeton CITP, 2015) — https://blog.citp.princeton.edu/2015/05/21/an-empirical-study-of-namecoin-and-lessons-for-decentralized-namespace-design/
- MetaX adChain TCR post-mortem — https://www.adtoken.com/blog/learnings-from-metax-on-launching-the-first-token-curated-registry-tcr
- Dedaub Arbitrum outage RCA — https://dedaub.com/blog/arbitrum-sequencer-outage/
- Arweave endowment — https://permaweb-journal.arweave.net/article/storage-endowment-explained.html
- nostr.wine / filter relay — https://nostr.wine/ , https://nostr-wine.github.io/filter-relay/

**Commentary/secondary (used with attribution; treat numbers as indicative):**
- farmap label analysis — https://github.com/cazeth/farmap ; pichi label analyses — https://paragraph.com/@pichi/the-unwritten-rules-of-warpcast-avoiding-spam-labels (82–91% figures: community analysis of the primary dataset)
- BlockEden Farcaster 2025 retrospective — https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/ (DAU/revenue decline figures; single-source, slanted)
- TechCrunch on Farcaster raise/DAU — https://techcrunch.com/2024/05/21/farcaster-a-crypto-based-social-network-raised-150m-with-just-80k-daily-users/
- MacRumors Bluesky open-registration — https://www.macrumors.com/2024/02/07/bluesky-ends-closed-beta-period/ ; arXiv Bluesky measurement papers — https://arxiv.org/pdf/2408.03146 , https://arxiv.org/pdf/2404.18984
- Hive/Steem RC community posts — https://hive.blog/steem/@astromaniak/resource-credits-effectively-block-spam-on-steem , https://hive.blog/wiki/@propolis.eng/resource-credits (self-reported, no independent measurement)
- dTech Farcaster storage explainer — https://dtech.vision/farcaster/hubs/howdoesfarcasterstoragework/ ; Pinata on Farcaster+Arweave — https://pinata.cloud/blog/ipfs-as-an-archival-solution-for-farcaster/
- The Bitcoin Manual on paid relays — https://thebitcoinmanual.com/articles/paid-nostr-relay/ ; Nostr WoT article — https://medium.com/nostr-wot/nostr-solved-censorship-now-lets-solve-trust-cc776bbd0f8f
- The Block / Cointelegraph on inscriptions outages — https://www.theblock.co/post/267950/arbitrum-says-all-systems-are-operational-after-surge-of-inscriptions-caused-outage-earlier-in-day , https://cointelegraph.com/news/arbitrum-network-goes-offline-december-15
- Born City on Bluesky invite malware — https://borncity.com/win/2023/11/13/stop-bluesky-fake-invites-dropping-malware/

**Staleness notes:** Farcaster label percentages are Jan–Feb 2025 snapshots of a weekly-updated dataset (a binary label scheme replaced the three-tier one on 2025-05-22, so the exact percentages are not reproducible today, but the order of magnitude is the finding). Bluesky rate-limit numbers are from the 2023 announcement and current 2026 docs (unchanged as of retrieval). Nostr relay pricing fluctuates with sats/USD; figures are ~2024–2025. No quantitative measurement of NIP-13 relay-enforcement share was found — that adoption claim rests on qualitative ecosystem commentary.

**Repo files read:** `/Users/james/Code/EFS/planning/Designs/deterministic-ids.md`, `/Users/james/Code/EFS/planning/Designs/efs-v2-holistic-redesign.md`, `/Users/james/Code/EFS/planning/Designs/efs-v2-transition-plan.md`; grep confirmed `contracts/docs/adr/0013-lens-scoped-mirror-selection.md` as the only ADR mentioning spam.
