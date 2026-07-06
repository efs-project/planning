# EFS substrate investigation — apps-requirements report

**Agent:** apps-requirements | **Date:** 2026-07-02
**Task:** THE grounding exercise. Enumerate ~10 concrete applications EFS wants to host, derive their substrate requirements from first principles + external evidence, produce a requirements matrix and the top-5 substrate requirements ranked by how many apps need them. No property gets marked required without naming the app and interaction that requires it.

---

## 0. Method, honesty rules, and cost baselines

**Method.** Ten apps drawn from the mission statement. For each: write patterns, read patterns, who pays and tolerance, latency/UX, revocation/edit needs (with a precise meaning of "delete"), portability needs, on-chain composability needs, spam exposure, privacy needs. Each dimension is grounded either in first-principles arithmetic (assumptions stated) or in a real deployed analogue with cited data. Primary sources are marked (P); commentary/aggregator sources marked (C). Staleness flags where data is fast-moving.

**Counting rule for the matrix.** H (hard) = the app is broken or non-competitive without it, and I name the interaction. S (soft) = valuable, degraded without it. — = not needed. The top-5 ranking counts H only; S counts shown in parentheses.

**Cost baselines used throughout** (assumptions: L1 base fee 1 gwei, ETH = $3,000; both fluctuate an order of magnitude — treat as mid-2026 order-of-magnitude anchors):

| Storage lane | Cost | Basis |
|---|---|---|
| L1 calldata | ~$48/MB (≈$0.05/KB) | 16 gas/nonzero byte |
| L1 SSTORE2 (contract-code bytes) | ~$600/MB | ~200 gas/byte code deposit |
| OP-Stack L2 tx, blob era | median L2 tx fee fell ~$0.05 → ~$0.0015 (Jan 2024 → Mar 2026); Base ~$0.02 for a USDC transfer | [thirdweb blob-economics (C)](https://blog.thirdweb.com/ethereum-blob-space-explained-how-eip-4844-is-reshaping-l2-economics-for-web3-developers/), [spotedcrypto L2 comparison (C)](https://www.spotedcrypto.com/ethereum-l2-defi-comparison-2026/) — post-Fusaka (Dec 2025) numbers, volatile |
| Arweave (bytes, one-time, permanent) | official gauge ~$2–5/GB; one 2025 market analysis cites ~$0.48/GB — AR-price-dependent | [ar-fees.arweave.net (P)](https://ar-fees.arweave.net/), [permaweb journal (C)](https://permaweb-journal.arweave.net/article/economics-storing-large-data-on-arweave.html), endowment model assumes Kryder's-law cost decline (~38%/yr historical) |
| Farcaster storage unit | $7/yr = 5,000 casts + 2,500 reactions + 2,500 links ⇒ ≈ **$0.0014/cast** | [Farcaster storage docs (P)](https://docs.farcaster.xyz/reference/contracts/reference/storage-registry), [dtech.vision (C)](https://dtech.vision/farcaster/hubs/howdoesfarcasterstoragework/) |
| EFS v2 small-file write | ~9–10M gas (per [[deterministic-ids]] §12) ⇒ ~$30 on L1 @1 gwei; ~$0.15 on an L2 at 0.005 gwei effective (assumption-dependent; cents-to-tens-of-cents is the honest range) | repo doc + arithmetic |

**One structural observation up front.** The ten apps split cleanly into three write-economics classes, and this drives everything:

- **Class 1 — owner-writes, low rate** (personal site, photo archive, NFT metadata, DAO docs, collections/lenses): one identity writes into its own namespace, 10⁰–10¹ writes/day, tolerance $0.01–$1/write or one-time $/GB. Gas-as-write-cost works fine here.
- **Class 2 — stranger-writes, high rate** (blog comments, social feed, dapp reviews/forum): mutually-distrusting parties write into shared/hot namespaces, and the demonstrated willingness-to-pay ceiling is **~$0.001/interaction** (Farcaster) with mainstream expectation of $0. Gas-as-write-cost is at or below viability here, and these are also the max-spam apps.
- **Class 3 — bulk-bytes** (photo archive bytes, web-archive mirror, registry tarballs, NFT images): the bytes must not live on the consensus substrate at all; only identity + hash + claims can. 10GB of photos as L1 calldata is ~$490k; the same on Arweave-class storage is $20–50.

---

## 1. Personal site / file browser

The mission's home app: a person's `/home/alice` tree of pages, documents, and media, browsed via web3:// or a gateway.

- **Write patterns.** One writer (the owner). Bursty: initial upload of 10–500 files (0.5–50MB total: HTML/MD 1–100KB, images 100KB–5MB), then edits weekly-to-monthly. ~10²–10³ writes/year steady-state.
- **Read patterns.** Anyone, anonymous, web-shaped: path→file→bytes resolution, directory listing (the file browser), recursive walk to render a site. Reads ≫ writes by 10³–10⁶. Freshness: minutes-stale fine.
- **Who pays / tolerance.** Owner. Anchors: shared hosting/Netlify $0–10/mo, ENS renewal ~$5/yr; ArDrive users demonstrably pay Arweave's one-time $2–5/GB for permanence. A 10MB site: $0.05–0.50 one-time at Arweave prices; ~$480 as L1 calldata; ~$6,000 as L1 SSTORE2. ⇒ text-tree on-chain is affordable; images need the mirror lane. Per-file EFS write at L2 prices (cents) is fine.
- **Latency/UX.** Publish in minutes OK; page render <1–2s (client/gateway caching, not substrate block time).
- **Revocation/edit.** Edits common (supersession). "Delete" = **stop resolving at the path by default** (unpublish); permanent history surviving is Wayback-like and acceptable, but must not be the default render. Drafts should be publishable-then-revealable (blinded anchors fit).
- **Portability.** High — this is the app's pitch. GeoCities: 38M users' sites destroyed in 2009; volunteer rescue saved ~1M accounts / ~2–5TB, the rest is gone ([Archive Team wiki (P)](https://wiki.archiveteam.org/index.php/GeoCities), [TIME (C)](https://time.com/archive/6906661/internet-atrocity-geocities-demise-erases-web-history/)). Pew: 38% of 2013's webpages were gone by Oct 2023; 25% of all pages that existed 2013–2023 are inaccessible ([Pew 2024 (P)](https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/)). Links into the tree must survive substrate death.
- **On-chain composability.** None. No contract reads a homepage. (Adoption evidence check: ENS+IPFS dwebsites exist — [ENS docs (P)](https://docs.ens.domains/dweb/intro/), eth.limo gateway — but no public count was found; honest reading is that adoption is thin, so this app is aspirational demand, not proven demand.)
- **Spam exposure.** Low (own namespace). Name squatting handled by paths-under-address doctrine.
- **Privacy.** Public by design; drafts + some subtrees private (blinded/salted anchors, encryption). Reader privacy is off-chain (reads never touch chain) — a genuine EFS advantage worth stating.

## 2. Blog with comments

Author-owned posts + open comment section. The comments half is a different app than the blog half — split accordingly.

- **Write patterns.** Author: 1–4 posts/mo, 5–50KB each. Commenters: **strangers**, 0.1–100 comments/day per blog, 0.1–2KB each. First app where the write side is adversarial.
- **Read patterns.** Public. Post: path lookup. Comments: **inverted query** — "all claims targeting this post, across unknown attesters," then lens-filtered. Freshness ~10s–minutes.
- **Who pays / tolerance.** Author: Substack-class $0–50/mo tolerance. Commenter: **~$0**. A $0.30 comment doesn't happen; $0.001–0.01 is crypto-native-tolerable only. Sponsored/gasless writes (dapp pays, author-as-attester preserved) is the only mainstream path — the kernel-recovers-author-from-signature prize applies exactly here.
- **Latency/UX.** Comment visible <10s. 2s L2 blocks fine.
- **Revocation/edit.** Authors edit posts routinely (typo class: 24% of tweet deletions happen <2 min after posting; deliberate class: ~35% of deletions come >1 week later — [deleted-tweets research (C)](https://www.researchgate.net/publication/266653444_Tweets_are_Forever_A_Large-Scale_Quantitative_Analysis_of_Deleted_Tweets), [www16 study (P)](https://cs.mu.edu/~keke/papers/www16.pdf)). Comment moderation is existential (below). "Delete" for a comment = removed from every honest default read; archival persistence is legally exposed (GDPR: EDPB Guidelines 02/2025 say technical impossibility does not excuse non-erasure; recommended pattern is personal data off-chain or renderable-anonymous — [EDPB (P)](https://www.edpb.europa.eu/system/files/2025-04/edpb_guidelines_202502_blockchain_en.pdf); note: adopted for consultation Apr 2025, final text may differ).
- **Portability.** Posts: high (link-rot data above; 23% of news pages already contain ≥1 broken link). Comments: medium.
- **On-chain composability.** None.
- **Spam exposure.** **Maximal.** Web ground truth at $0/write: up to 85% of comments on popular WordPress sites are spam; spam:ham ≈ 3:1; Akismet has blocked 554B+ spam comments ([Akismet (P)](https://akismet.com/), [wpbeginner (C)](https://www.wpbeginner.com/beginners-guide/akismet-101-guide-for-all-wordpress-users/)). At the $0.001–0.01 price the app needs, 10k spam comments cost $10–100 — gas alone cannot be the defense; attester-scoped lenses (show comments from: identities the author trusts / anyone-with-X-attestation / moderator-curated list) are the actual mechanism. Also the index-poisoning surface: a hot post's anchor is exactly the "hot shared folder" whose global scan path can be permanently bloated for ~$450–4,500 ([[efs-v2-holistic-redesign]] §2.8) — per-attester/lens-scoped enumeration is required, not optional.
- **Privacy.** Pseudonymous commenting standard; commenter identity linkage across sites is a real (accepted?) cost of one-address identity.

## 3. Social feed

Microblogging: posts, replies, likes/reactions, follows, profiles.

- **Write patterns.** Ground truth: Bluesky ~3–4M DAU producing 1.4M–3.9M posts/day (sources disagree 3×: [backlinko (C)](https://backlinko.com/bluesky-statistics), [sociallyin (C)](https://sociallyin.com/resources/bluesky-statistics/); both aggregators — stale/fuzzy) but **>2,000 events/s sustained** (~170M events/day) on the firehose once likes/follows are counted ([Bluesky relay ops (P)](https://docs.bsky.app/blog/relay-ops)). Likes and follows dominate posts by ~10–50×; Farcaster's storage-unit ratio (5,000 casts : 2,500 reactions : 2,500 links) encodes the same shape. Farcaster scale for comparison: ~62.6M total casts 2021–2024, DAU 40–60k in late 2025, declining ([The Block (C)](https://www.theblock.co/data/decentralized-finance/social-decentralized-finance/farcaster-daily-users), [BlockEden (C)](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/)). Item sizes: ≤300B posts, ~tens of bytes for likes.
- **Read patterns.** Timeline assembly = reverse-chron merge over N followed attesters, freshness seconds; notifications = inverted query "who referenced me." This is a firehose+indexer workload; per-item verify-on-click is realistic, verified timeline assembly is not (light-client verifying 170M events/day is a non-goal).
- **Who pays / tolerance.** Demonstrated ceiling: **$7/user/yr all-in** (Farcaster), i.e. ~$0.0014/message; Bluesky users pay $0. A like priced at even $0.005 is felt. Practical implication: likes/reactions probably shouldn't be consensus writes at all (or must ride sponsored batches).
- **Latency/UX.** Post visible to followers <5s. L2 2s blocks pass; L1 12s marginal.
- **Revocation/edit.** Heavy: ~28% of tweets end up withdrawn; ~⅓ of sampled tweets gone when revisited, >21% within 6 months (studies above). Deletes must propagate to default views network-wide; Nostr's advisory NIP-09 ("relays may honour or ignore"; clients told to warn users deletion isn't guaranteed — [NIP-09 (P)](https://github.com/nostr-protocol/nips/blob/master/09.md)) is the documented anti-pattern, bad enough that NIP-62 "Request to Vanish" was added on top ([NIP-62 (P)](https://nips.nostr.com/62)). Doxxing/harassment/minors content makes delete a safety feature, not a preference.
- **Portability.** Identity + graph portability is the entire sales pitch of this category, and migrations happen on 3-year horizons, not 100: Lens moved Polygon→Lens Chain in Apr 2025, carrying ~650k profiles, 28M follows, ~16M posts (~125GB) ([lens.xyz (P)](https://lens.xyz/news/migrating-the-lens-ecosystem-to-lens-chain), [The Block (C)](https://www.theblock.co/post/349582/socialfi-protocol-lens-releases-lens-chain-mainnet-with-avail-da-and-zksync-tech); profile/post counts differ slightly between the two — flagged). Chain-free IDs would have made that migration a replay instead of a bespoke 125GB ETL.
- **On-chain composability.** Not required. Tipping/token-gating read balances and attestation registries, not posts.
- **Spam exposure.** High (sybils, reply spam, follow spam). Farcaster's storage rent exists explicitly as spam control and roughly works at its scale; but note its other edge: FIFO pruning + 30-day expiry means **unpaid rent silently deletes your history** — the opposite of an archive ([Farcaster docs (P)](https://docs.farcaster.xyz/learn/what-is-farcaster/messages)).
- **Privacy.** Deleted-post persistence is a privacy failure class here; blocks/mutes reveal social relationships; DMs are out of scope (E2E encryption, not an archive problem).

## 4. Personal photo archive

Family photos, "the shoebox that survives to 2126."

- **Write patterns.** One writer (or household). Average phone library ~1,600–3,000 photos ([surveys, all (C)](https://photutorial.com/photos-statistics/), [pix11 (C)](https://pix11.com/news/local-news/phone-photo-libraries-mostly-contain-selfies-and-pets-survey-finds/)), ~6 new photos/day; 2–5MB each (HEIC/JPEG) ⇒ ~5–10GB library, growing 2–7GB/yr with video pushing far higher. Background batch sync, latency-insensitive.
- **Read patterns.** Owner + small trusted set. Album/date enumeration, thumbnail grid scan (thumbnails must be first-class derived files or browsing is unusable), point fetch of full-res. Freshness: days.
- **Who pays / tolerance.** Owner. Anchor: iCloud/Google One $12–36/yr for 50–200GB. One-time-permanence framing: 10GB ≈ $20–50 at Arweave prices — genuinely competitive with a decade of subscription. On-chain bytes are absurd (~$490k calldata) — this app **forces** the two-plane architecture: identity/hash/claims on consensus, bytes on replicated cheap storage verified by contentHash.
- **Latency/UX.** Browse <1s (cache); ingest minutes.
- **Revocation/edit.** Deletes are routine (blurry/duplicate) and occasionally urgent (sensitive/embarrassing). **This is the app where "you can't un-sign a signature" bites hardest — and the honest answer is that delete for private data must mean key destruction.** Default-encrypted storage, per-file random content keys; delete = destroy key + revoke mirrors + unpin. That is also the only GDPR-compatible story (EDPB: design so data can be rendered anonymous/inaccessible on request). Public shared albums are the exception and inherit the social-app advisory-delete risk.
- **Portability.** Emotionally maximal (the 2126 grandkids persona), and it's a *replication* need: family archive must survive any one chain/host. Dead-attester limit of replication model A ([[deterministic-ids]] §9) is tolerable here only because heirs hold keys — worth noting inheritance/key-succession is an unsolved persona requirement.
- **On-chain composability.** None.
- **Spam exposure.** None (own namespace).
- **Privacy.** **Maximal — and this breaks the naive "public permanent web" framing: most photos are private.** 58% of stored photos are selfies (survey above); EXIF carries GPS. Encryption is not an optional convention here but the default; harvest-now-decrypt-later makes PQ-hybrid wraps (already in [[efs-v2-holistic-redesign]] §2.3) load-bearing for a century archive.

## 5. Curated collections / lens subscriptions ("follow my lens")

Curation as a first-class object: reading lists, moderation lists, registries-of-good-things; subscribing = adopting someone's trust scope.

- **Write patterns.** Curator: tens of tiny (32B-ref) LIST_ENTRY appends/removals per week. Subscriber: one write per follow/unfollow. Demand evidence: Bluesky has 40,000+ custom feeds and a stackable labeler system (up to 20 labeler subscriptions per user) ([Bluesky moderation architecture (P)](https://docs.bsky.app/blog/blueskys-moderation-architecture), [feed docs (P)](https://docs.bsky.app/docs/tutorials/custom-feeds)) — curation-as-object has real product traction.
- **Read patterns.** **Every other app's reads consume this app's writes.** Query: dereference lens list at read time (must always get *current* contents), then scope all other queries by it. Freshness: minutes — but see revocation.
- **Who pays / tolerance.** Curators pay (tiny writes, cents — fine). Subscribers pay one cheap write, or zero if subscription is client-side config.
- **Latency/UX.** One extra lookup per read; must be O(1)-ish and cacheable with fast invalidation.
- **Revocation/edit.** **Curation IS mutation.** Removing an entry (spam, malware link, retracted item) must apply promptly and reliably on every honest reader — a lens whose removals don't propagate is a broken moderation system and collapses the whole EFS trust model. This app converts revocation from a nice-to-have into the substrate's core liveness requirement. Advisory deletion is disqualifying here, full stop.
- **Portability.** Lens lists must replicate wherever the graph replicates; a lens referencing cross-chain objects requires chain-free target IDs (deterministic IDs deliver exactly this).
- **On-chain composability.** Plausible-soft: a contract gating on "target ∈ curator's list" (cf. Coinbase Verifications gating pools, below). No demonstrated demand yet; keep possible, don't build for it.
- **Spam exposure.** Lens *discovery* is spammable (fake "official" lenses); lens *contents* are themselves the anti-spam mechanism. Petname/verification UX matters more than substrate machinery.
- **Privacy.** Subscriptions are public speech (subscribing to a blocklist is a visible political act — a recurring Bluesky drama source). Private subscriptions = client-side lens config that never serializes on-chain; that option must stay open.

## 6. Dapp structured records (reviews, forum, app-owned graph data)

Dapps using EFS as their database: product/dapp reviews, forum threads, user-generated registries.

- **Write patterns.** Strangers at dapp scale: 10–10k records/day per namespace, 0.5–5KB typed records. Shared, hot namespaces ⇒ same bloat surface as comments.
- **Read patterns.** Database-shaped: "all reviews for X," sort by weight/recency, paginate, **aggregate** (avg rating, counts). Aggregation is inherently an indexer/view concern; freshness minutes.
- **Who pays / tolerance.** Reviewer's own gas is acceptable to crypto-natives at cents; mainstream needs dapp-sponsored writes **with attester = user preserved** (the memory note on write-UX attester applies: no shared relayer identity, or lenses break).
- **Latency/UX.** Minutes fine.
- **Revocation/edit.** Users edit reviews (post-support-fix updates) and delete accounts; revocable claims fit exactly.
- **Portability.** Medium: reputation data has long-term value but is anchored to per-chain dapps.
- **On-chain composability.** **The honest adjudication the mission asked for.** Real, deployed precedent exists for contracts consuming *attestation-shaped* records: Coinbase Verifications on Base — EAS attestations with a permissioned resolver, consumed by contracts to gate pools/apps ([coinbase/verifications (P)](https://github.com/coinbase/verifications)); Gitcoin/Human Passport onchain stamps read by a Decoder contract for sybil-gating ([Passport docs (P)](https://docs.passport.xyz/building-with-passport/smart-contracts/overview)). But note the shape: **point lookups of small fixed-size typed records (score, verification, membership) by (subject, schema, attester), on the same chain, synchronously.** No deployed contract wants to read prose reviews, walk a folder tree, or aggregate ratings on-chain. So: composability demand = point-readable typed-claim registry; NOT EVM-readable filesystem.
- **Spam exposure.** High: review-bombing, sybil reviews. Gas insufficient (a $50 bribe buys 5,000 fake $0.01 reviews); defense = lens on attester qualification (e.g., "reviews from Coinbase-verified accounts" — composability and spam-defense meet here) + dapp-side curation.
- **Privacy.** Pseudonymity; proof-of-purchase without identity leak wants future ZK, out of substrate scope.

## 7. NFT / token metadata backing

Collections' metadata JSON + assets; the "your JPEG shouldn't die with a Heroku app" use case.

- **Write patterns.** Mint-time bulk: 10k JSON files (0.5–2KB) + 10k images (50KB–5MB); afterwards near-zero (reveal event, rare dynamic updates).
- **Read patterns.** Three readers: marketplaces/indexers (off-chain, hours-stale fine), wallets (point fetch), and **contracts** — the fully-on-chain subset (Loot, Nouns, Blitmaps) assembles art by reading other contracts' bytes inside `tokenURI()` eth_calls ([fullyonchain.art (C)](https://www.fullyonchain.art/articles/why-fully-on-chain)).
- **Who pays / tolerance.** Creator, one-time, at mint; $0.001–0.01/NFT for metadata storage is noise against historical mint costs. High tolerance.
- **Latency/UX.** On-chain reader: synchronous same-chain eth_call — hard constraint. Off-chain: relaxed.
- **Revocation/edit.** ~None — **immutability is the feature** ("frozen metadata"). The demand proof for EFS-grade permanence is the failure data: ~20% of ~498k sampled NFTs had unresolvable tokenURIs ([alwaysNFT study (C)](https://medium.com/alwaysnft/when-good-nfts-go-bad-bd4ab48b0a9f)); ~45% of sampled ERC-721 metadata sits on centralized mutable storage ([arXiv 2209.14517 (P)](https://arxiv.org/pdf/2209.14517)); of assets on centralized platforms (~79% of off-chain assets), only ~34% could be retrieved ([arXiv 2408.13281 (P)](https://arxiv.org/pdf/2408.13281)). This is the strongest quantified market failure EFS addresses.
- **Portability.** Nuanced: the token contract is chain-bound anyway, so metadata portability = "readable from the token's chain + survivable if storage layer dies," not cross-chain identity. NFT bridging is niche.
- **On-chain composability.** **Hard requirement, for the on-chain-renderer subset only**: `tokenURI()` must synchronously read EFS-stored bytes (dataId → mirror → SSTORE2 chunk reassembly) in Solidity on the same chain. This is the one app-interaction that requires the on-chain byte tier + contract-readable resolution — mirrors/off-chain lanes can't serve it.
- **Spam exposure.** Low (own namespaces).
- **Privacy.** None (public by definition).

## 8. DAO document store

Governance proposals, meeting notes, charters, financial reports, legal wrappers.

- **Write patterns.** Low rate: 1–20 docs/mo, 10–500KB (PDF/MD). Writers: **organizations** — Safes, Governors, councils; authorized-writer semantics wanted (EFS answer: publish from the org's smart account, viewers lens on it).
- **Read patterns.** Members + public; audit-shaped: "what did the doc say when we voted" ⇒ version-at-time queries; temporal provenance essential. Freshness minutes.
- **Who pays / tolerance.** Treasury — **highest tolerance of all ten apps** ($1–100/doc is nothing against audit budgets). Even full on-chain bytes for constitutional docs is affordable ($600/MB L1: a 200KB charter = $120).
- **Latency/UX.** Minutes fine.
- **Revocation/edit.** Append-mostly; amendments = supersession with visible history; deleting the audit trail is an anti-feature. Rare legal redaction ⇒ viewer-sovereign hiding (WHITEOUT) + personal data kept off-chain.
- **Portability.** Strong and *proven*: DAOs migrate chains (Lens itself; Polygon-era DAOs generally); governance history must survive the move, and an L2 can simply shut down. Cautionary structural fact: OpenZeppelin Governor stores only the descriptionHash on-chain; proposal text lives in the `ProposalCreated` **event log** ([OZ docs (P)](https://docs.openzeppelin.com/contracts/5.x/api/governance)) — under EIP-4444 history expiry that text has no guaranteed on-protocol home. Snapshot puts proposals/votes on IPFS with EIP-712 sigs, chain only for execution ([IPFS case study (P)](https://docs.ipfs.tech/case-studies/snapshot/)) — governance-record permanence today is a patchwork EFS can strictly improve (state-based, state-walk-reconstructible).
- **On-chain composability.** Medium-real: Governor/executor contracts verify descriptionHash / doc-hash point lookups at propose/execute time; "current constitution hash" reads. Small typed point reads again — never byte walks.
- **Spam exposure.** Low (org namespace + lens on org account).
- **Privacy.** Mostly public; some docs encrypted (legal/HR).
- **The identity sting:** the publisher is a **contract account** (Safe/Governor). ERC-1271 signatures don't travel chains and die with the contract — this app pins hard part (e) directly: portable authenticity for org publishers is unsolved, and this is a top-3 portability app.

## 9. Package / software registry

npm/crates/PyPI-shaped: named packages, versioned releases, manifests + tarballs, install-time resolution.

- **Write patterns.** Publishers (devs/CI): npm hosts 3.1M+ packages ([Wikipedia (C)](https://en.wikipedia.org/wiki/Npm)); thousands of versions/day ecosystem-wide (exact legit-publish rates not found — flag). Per release: manifest 1–5KB + tarball 10KB–10MB.
- **Read patterns.** Extreme read amplification: billions of downloads weekly ecosystem-wide; install = exact `name@version` manifest+tarball fetch, **already hash-verified by lockfiles** — verify-don't-trust is mainstream practice here, at scale, today. Version-range resolution (`^1.2.x`) needs an enumerable version index with fast "what's current."
- **Who pays / tolerance.** Publishing free today; maintainers would tolerate cents/publish. Per-download cost must be zero (EFS reads are off-chain — fine).
- **Latency/UX.** Publish→installable ~1 min (CI flows).
- **Revocation/edit.** **The canonical validation of EFS's objects/claims split.** Registry history: left-pad (2016, unpublish broke the ecosystem, npm force-restored — [npm unpublish policy (P)](https://docs.npmjs.com/policies/unpublish/), now 72h window); crates.io: "yank never deletes; the registry is a permanent archive that does not change over time" ([cargo yank (P)](https://doc.rust-lang.org/cargo/commands/cargo-yank.html), [RFC 3660 (P)](https://rust-lang.github.io/rfcs/3660-crates-io-crate-deletions.html)); PyPI PEP 763 proposes the same 72h limit after the atomicwrites (2022) and codecov (2023) deletion incidents ([PEP 763 (P)](https://peps.python.org/pep-0763/)). Convergent evolution across three ecosystems: **bytes immutable forever; "removal" is a revocable advisory claim (yank) that resolvers/installers honor by default.** That is byte-for-byte EFS's immutable-objects + revocable-claims model. Malware takedown = curation-lens removal, not byte deletion.
- **Portability.** High: mirrorability is a norm (npm mirrors, Verdaccio, crates.io git index anyone can clone); an ecosystem must be replayable onto a new substrate. LOCKSS-shaped.
- **On-chain composability.** None-to-weak (build provenance attestations are consumed by tooling, not contracts).
- **Spam exposure.** **Extreme, and fee-resistant:** 67,000+ fake packages flooded npm in a worm-like campaign at ~17k/day, reported as farming tea.xyz token rewards ([The Hacker News 2025 (C)](https://thehackernews.com/2025/11/over-46000-fake-npm-packages-flood.html)) — **incentive-driven spam is positive-EV and shrugs off small fees**; a $0.01 publish fee on 67k packages is $670 against token rewards worth more. Global flat namespace = squatting economy (EFS's paths-under-address kills this, at the cost of friendly global names ⇒ community lens = the "default registry" trust map).
- **Privacy.** None needed (public code; pseudonymous publishers fine).

## 10. Web-archive mirror

Wayback-style: URL+timestamp → page snapshot; citation permanence (perma.cc-class) at the small end, bulk crawl at the large end.

- **Write patterns.** Bulk, batched, bot-written, latency-insensitive. Scale honesty: Common Crawl ingests 2.44B pages / 424 TiB **per month** ([commoncrawl.org (P)](https://commoncrawl.org/blog/august-2025-crawl-archive-now-available)); the Wayback Machine holds >1T pages / ~99PB unique ([Wikipedia (C)](https://en.wikipedia.org/wiki/Wayback_Machine), late-2025). No consensus substrate touches these byte volumes; even Arweave pricing on one CC month is ~$0.9–2M. Viable EFS shapes: (a) curated citation archives — court/paper-cited pages, thousands–millions of items, $0.01–1/page tolerable; (b) structure+hash layer over off-chain byte stores for bigger corpora.
- **Read patterns.** Researchers, citation followers. Query: URL+timestamp→snapshot; **temporal provenance is the datum itself** (a snapshot without a trustworthy time is worthless). Freshness: none.
- **Who pays / tolerance.** Institutions/grants (IA-class budgets; libraries pay perma.cc). One-time per-item pricing fits grant economics better than perpetual rent.
- **Latency/UX.** None on write; read seconds.
- **Revocation/edit.** Never edit (fidelity is the point). Takedowns (copyright, personal data) are gateway/lens-policy, not protocol deletion — matching IA practice of removing from *serving* on request.
- **Portability.** **Defining.** The app is LOCKSS. It also stresses the dead-attester limit of replication model A hardest: an archival org's key dies, and its owned objects (dataIds) can never instantiate on a new chain — anchors/properties replicate, citation-form links to the org's owned objects don't. This app is the reason model C exists as an option; the tension must be adjudicated with this app on the table.
- **On-chain composability.** None.
- **Spam exposure.** Moderate: fake snapshots ("this is what cnn.com said") — pure attester-trust/lens problem; provenance claims + trusted-archivist lenses solve it structurally.
- **Privacy.** Caught-in-the-net personal data ⇒ GDPR pressure lands on gateways/lenses, reinforcing viewer-sovereign hiding as the compliance surface.

---

## 11. Requirements matrix

Legend: **H** = hard (app broken without it; interaction named in the app section), **S** = soft/valuable, — = not needed.

| Substrate requirement | 1 Site | 2 Blog+cmt | 3 Social | 4 Photos | 5 Lenses | 6 Reviews | 7 NFT | 8 DAO | 9 Registry | 10 Archive | **H count** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| R1 Verifiable permanent content identity (path→file→bytes, hash-verified) | H | H | S | H | S | S | H | H | H | H | **7** (+3S) |
| R2 Two-plane economics: identity/claims on consensus, bulk bytes replicated off-chain under contentHash (+ repair via any-attester mirror) | H | S | — | H | — | — | H | S | H | H | **5** (+2S) |
| R3 Revocation honored by default read path (unpublish / delist / yank — claim revocation, never byte deletion) | S | H | H | H | H | S | — | — | H | S | **5** (+4S) |
| R4 Encryption + key destruction as the real delete for private data | S | S | S | H | — | — | — | S | — | — | **1** (+4S) |
| R5 Chain-free replicable IDs (LOCKSS replay; links survive substrate death) | S | S | S | S | S | — | — | H | H | H | **3** (+6S) |
| R6 Portable authenticity (verify author after origin chain dies) | S | S | S | S | S | — | — | H | H | H | **3** (+6S) |
| R7 ~$0.001-class stranger writes / sponsored-gasless with attester=user | — | H | H | — | S | H | — | — | S | — | **3** (+2S) |
| R8 Sub-5s write visibility | — | S | H | — | — | — | — | — | — | — | **1** (+1S) |
| R9 Lens-scoped inverted queries ("claims targeting X by trusted attesters") without indexer trust | — | H | H | — | H | H | — | — | S | S | **4** (+2S) |
| R10 Attester-scoped curation as the primary spam defense (gas is a rate limiter, not the defense) | — | H | H | — | H | H | — | — | H | S | **5** (+1S) |
| R11 On-chain synchronous readability by contracts | — | — | — | — | S | S | H | S | — | — | **1** (+3S) |
| R12 Cheap lens-scoped enumeration (children/versions/current, cost scales with lens content, not global writes) | H | H | S | H | H | S | — | H | H | H | **7** (+2S) |
| R13 Temporal provenance surviving replication | S | S | S | S | — | — | S | H | S | H | **2** (+6S) |
| R14 Org/rotatable publisher identity (smart accounts) that still satisfies R5/R6 | S | — | S | S | S | — | S | H | H | H | **3** (+5S) |
| R15 Hot-shared-namespace write-bloat protection | — | H | S | — | — | H | — | — | H | — | **3** (+1S) |

## 12. Top 5 substrate requirements (ranked by hard-requirement app count)

1. **R1 — Verifiable permanent content identity (7H, 10 total).** Site pages that outlive GeoCities-class death; blog posts against 38%/decade link rot; photos for 2126; frozen NFT metadata (the quantified market failure: ~20% dead tokenURIs); DAO audit trails; registry releases (lockfile verification is already mainstream verify-don't-trust); archive snapshots. This is EFS's core and the apps unanimously confirm it.
2. **R12 — Cheap lens-scoped enumeration/current-state reads (7H).** File browser directory listings; comment threads; album grids; lens contents; proposal lists; version resolution (`^1.2.x` → current); URL snapshot timelines. Every app is read-dominated and half its queries are "list/latest under X as seen through my lens" — with cost scaling with the lens's content, not with global (spammable) write volume. Under-glamorous, universally load-bearing.
3. **R3 — Revocation the default read path honors (5H).** Comment moderation; social deletes (28% of tweets get withdrawn); lens entry removal (curation IS mutation); registry yank (left-pad/atomicwrites/codecov forced three ecosystems to converge on exactly this semantics); shared-photo removal. Critical nuance: **all five need claim revocation ("stop resolving by default"), zero need byte un-existence.** No app requires un-signing a signature; every app requires consensus on current claim-state. This is the strongest apps-derived argument for keeping a consensus substrate (or equivalent) in the loop, and the precise reason Nostr-style advisory deletion is disqualifying.
4. **R2 — Two-plane storage economics (5H).** Photos (10GB ≈ $490k as calldata vs $20–50 on Arweave-class), archives (424 TiB/mo exists), NFT images, registry tarballs, site media. Bulk bytes never live on consensus; identity+hash+claims do; third-party re-mirror with contentHash verification (holistic §2.4) is the mandatory repair mechanism — the NFT studies show what happens without it.
5. **R10 — Attester-scoped curation as the spam defense (5H).** Comments (85% spam at $0 write cost), social sybils, review-bombing, registry floods (67k fake npm packages farming token rewards — fees don't stop positive-EV spam), lens discovery. Gas is a useful rate limiter but cannot be the defense at the ≤$0.01 price stranger-write apps require; lenses are the defense. (R9, its query-shape twin, is 4H and rides with it.)

**Near-misses, stated honestly:**
- **R5/R6 portability+portable-authenticity (3H each, 6S)** rank below the top-5 by hard count, but they are the only requirements that are **irretrofittable** (the v2 docs' own finding) and they are hard-required precisely by the apps whose payers have the deepest pockets and longest horizons (DAO, registry, archive — institutions). Ranked by app count they're #6; ranked by "cost of being wrong" they're #1.
- **R7 cheap stranger writes (3H)** is existential for the social cluster (blog comments, social feed, reviews) — it decides whether EFS hosts Class-2 apps at all, or concedes them to hybrid designs (Snapshot pattern: signatures + content-addressed storage for high-volume writes, consensus for anchoring).
- **R11 on-chain composability (1H + 3S)** — the possibly-deciding-factor question comes back **narrow**: one hard consumer (fully-on-chain NFT renderers needing same-chain synchronous byte reads) plus point-lookups of hashes/typed claims (DAO verification, Coinbase-Verifications-style gating). No app needs contracts walking trees, aggregating, or reading cross-chain. Verdict for architects: keep a same-chain point-readable registry + optional on-chain byte tier; do NOT let "contracts must read everything" drive the substrate.

## 13. What the apps say about the five hard parts

**(a) Revocation without a consensus substrate.** The apps split "delete" into three distinct operations, none of which is un-signing: (1) *claim revocation* — stop resolving in default views (5 apps hard); (2) *key destruction* — real delete for encrypted private data (photos, hard); (3) *viewer-sovereign hiding* — WHITEOUT/gateway policy for legal takedowns (archive, blog). (1) requires shared, orderable, current claim-state — the thing a chain provides and signature-gossip doesn't; Nostr's NIP-09 is the documented failure and even Nostr had to bolt on NIP-62. A substrate without consensus must reconstruct "current claim-state everyone converges on" somehow; the apps say that property is non-negotiable, not that the EVM is.

**(b) Spam without gas.** Three data points triangulate: Akismet (85% spam at $0), Farcaster ($7/yr works at small scale, explicitly designed as spam control), npm token-farm flood (fees fail against positive-EV spam). Conclusion: gas is neither necessary nor sufficient; the architecture is lens-scoped reads + per-attester indices (write-side bloat contained by R15/R12) with gas as a rate limiter. Since Class-2 apps need ≤$0.001 writes anyway, no design gets to lean on gas as its spam story.

**(c) Consensus on "what exists/what's current."** The apps mostly need **per-attester current state** (my latest post version, the curator's current list, the org's current charter) — a weaker requirement than global consensus, satisfiable by per-attester ordered logs (cf. AT Protocol per-user repos + firehose). Global consensus is needed only at Schelling points: shared anchors (first-wins races) and registry version indices. This suggests the consensus surface can be much smaller than "everything," but not zero.

**(d) On-chain composability.** See R11 verdict: real, narrow, same-chain, point-read-shaped, plus one byte-tier consumer (on-chain renderers). Coinbase Verifications and Gitcoin Passport are the entire deployed demand evidence; both are EAS-shaped typed claims. Losing native composability kills one sub-app (on-chain renderers) and inconveniences DAO hash checks; it does not touch the other eight apps.

**(e) Signature portability vs identity durability.** The apps force the conflict rather than resolve it: the three hardest-portability apps (DAO, registry orgs, archive institutions) are exactly the publishers that need smart accounts (rotation, succession, multi-sig, bus-factor) whose ERC-1271 signatures don't travel. Individual-persona apps (site, photos, blog author) can live on EOAs/passkey-derived keys. Any reconciliation (e.g., device/session EOAs certified by the smart account with portable cert chains; or key-history-as-replayable-claims) must be evaluated against the org-publisher personas specifically — "everyone just uses an EOA" fails the three apps with the most money and the longest horizons. Also: model A's dead-attester replication limit lands hardest on the archive app — institutions outlive keys; adjudicate §9 with that persona at the table.

## 14. Copy / avoid lessons (external systems → EFS)

**COPY**
1. **Registry yank semantics** (crates.io/npm-72h/PEP 763): immutable bytes + revocable advisory delisting honored by default resolvers — three ecosystems converged on EFS's objects/claims split after repeated incidents; treat this as the strongest external validation EFS has.
2. **Farcaster's storage-unit pricing** as the calibration point: ~$0.0014/message, $7/yr/user is the demonstrated tolerable cost for social-class writes; also copy the honesty that storage priced per-unit forces explicit pruning policy — and then reject the pruning (see AVOID 5).
3. **Lockfile-style hash verification** (npm/cargo): verify-don't-trust reads are already mainstream developer practice at billions of fetches/week; EFS's contentHash conventions should speak that idiom (multihash, per [[deterministic-ids]] §13.5.8).
4. **Bluesky's stackable moderation** (labelers, 40k custom feeds): market-proof that lens-shaped curation is a product people adopt, and that the moderation layer must be subscribable and composable, not baked into the substrate.
5. **Snapshot's hybrid** (EIP-712 signatures + content-addressed storage for high-volume/zero-value writes; chain only for execution/anchoring): the escape valve for Class-2 write economics without giving up authenticated data.
6. **AT Protocol's per-attester repos**: per-user ordered logs give "current per-attester state" cheaply and match (c)'s finding that most consensus needs are per-attester, not global.

**AVOID**
1. **Nostr advisory deletion** (NIP-09): "relays may ignore" fails 5 of 10 apps; deletion-as-request without a convergent claim-state layer is the category's documented dead end.
2. **Hash-on-chain/bytes-anywhere without a repair path**: the NFT record (20% dead tokenURIs; ~34% retrievability on centralized hosts) shows exactly how R2 rots without third-party re-mirror + hash-verified fallback; EFS's mirror-fallback convention (holistic §2.4) is mandatory, not optional polish.
3. **Global flat name registries**: npm squatting/typosquatting/spam floods and ENS's squatting economy; paths-under-address + community trust lenses (already EFS doctrine) is the right call — the apps confirm it, and the registry app shows the residual need is a *trust map* (curated lens), not a name market.
4. **Assuming gas stops spam**: token-incentivized spam is positive-EV (npm/tea.xyz flood); price is a rate limiter, lenses are the defense.
5. **Rent-or-perish storage for archival apps** (Farcaster FIFO pruning + 30-day expiry): correct for a social feed, fatal for an archive — EFS must never let a permanence-class object depend on ongoing payments by the original author (third-party re-mirror + one-time on-chain lanes cover this).
6. **Event-log-only persistence for century data**: OZ Governor keeps proposal text only in logs; under EIP-4444 that's homeless — EFS v2's state-walk reconstructibility requirement is validated by a real, deployed governance system getting this wrong.
7. **Treating "public permanent by default" as universal**: the photo app (and half of personal-site content) is private-first; default-encryption conventions with key-destruction-as-delete are the only GDPR-compatible (EDPB 02/2025) and the only humane answer; harvest-now-decrypt-later makes PQ-hybrid non-deferrable.

## 15. Data staleness and confidence notes

- Bluesky/Farcaster activity stats: 2024–2026, fast-moving, aggregator-sourced where noted; Bluesky posts/day sources disagree ~3× (1.4M vs ~3.9M implied); firehose 2k ev/s is primary (Nov 2024).
- Arweave pricing: AR-denominated and volatile; the $2–5/GB vs $0.48/GB spread reflects source date/AR price, not disagreement about mechanism.
- L2 fees: post-Fusaka (Dec 2025), still compressing.
- EDPB Guidelines 02/2025: adopted for public consultation; final text may shift — direction (design-for-erasability, off-chain personal data) is stable.
- npm legit publish/day rate: not found; total-package and spam-incident figures used instead.
- ENS dwebsite counts: no public figure found; personal-site demand is partially aspirational — flagged rather than asserted.
- Lens migration counts differ slightly between lens.xyz (647k profiles/31M publications) and The Block (650k profiles/16M posts/28M follows/125GB); both cited.

## 16. Source index

Farcaster: https://docs.farcaster.xyz/reference/contracts/reference/storage-registry · https://docs.farcaster.xyz/learn/what-is-farcaster/messages · https://caststorage.com/ · https://dtech.vision/farcaster/hubs/howdoesfarcasterstoragework/ · https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/ · https://www.theblock.co/data/decentralized-finance/social-decentralized-finance/farcaster-daily-users
Nostr: https://github.com/nostr-protocol/nips/blob/master/09.md · https://nips.nostr.com/62 · https://github.com/nostr-protocol/nips/issues/343
Bluesky/AT: https://docs.bsky.app/blog/relay-ops · https://docs.bsky.app/blog/jetstream · https://jazco.dev/2024/09/24/jetstream/ · https://docs.bsky.app/blog/blueskys-moderation-architecture · https://docs.bsky.app/docs/tutorials/custom-feeds · https://backlinko.com/bluesky-statistics · https://sociallyin.com/resources/bluesky-statistics/ · https://en.wikipedia.org/wiki/Bluesky
NFT metadata: https://medium.com/alwaysnft/when-good-nfts-go-bad-bd4ab48b0a9f · https://arxiv.org/pdf/2209.14517 · https://arxiv.org/pdf/2408.13281 · https://www.fullyonchain.art/articles/why-fully-on-chain
Registries: https://docs.npmjs.com/policies/unpublish/ · https://doc.rust-lang.org/cargo/commands/cargo-yank.html · https://rust-lang.github.io/rfcs/3660-crates-io-crate-deletions.html · https://peps.python.org/pep-0763/ · https://en.wikipedia.org/wiki/Npm · https://thehackernews.com/2025/11/over-46000-fake-npm-packages-flood.html
Storage/econ: https://ar-fees.arweave.net/ · https://permaweb-journal.arweave.net/article/economics-storing-large-data-on-arweave.html · https://blog.thirdweb.com/ethereum-blob-space-explained-how-eip-4844-is-reshaping-l2-economics-for-web3-developers/ · https://www.spotedcrypto.com/ethereum-l2-defi-comparison-2026/
Permanence/link rot: https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/ · https://wiki.archiveteam.org/index.php/GeoCities · https://commoncrawl.org/blog/august-2025-crawl-archive-now-available · https://en.wikipedia.org/wiki/Wayback_Machine
Deletion behavior: https://www.researchgate.net/publication/266653444_Tweets_are_Forever_A_Large-Scale_Quantitative_Analysis_of_Deleted_Tweets · https://cs.mu.edu/~keke/papers/www16.pdf · https://www.statista.com/statistics/935314/adults-usa-have-deleted-any-social-media-posts-in-past-year/
Spam: https://akismet.com/ · https://www.wpbeginner.com/beginners-guide/akismet-101-guide-for-all-wordpress-users/
Legal: https://www.edpb.europa.eu/system/files/2025-04/edpb_guidelines_202502_blockchain_en.pdf
Composability: https://github.com/coinbase/verifications · https://docs.passport.xyz/building-with-passport/smart-contracts/overview · https://docs.openzeppelin.com/contracts/5.x/api/governance
Governance/DAO: https://docs.ipfs.tech/case-studies/snapshot/
Social migration: https://lens.xyz/news/migrating-the-lens-ecosystem-to-lens-chain · https://www.theblock.co/post/349582/socialfi-protocol-lens-releases-lens-chain-mainnet-with-avail-da-and-zksync-tech
Photos: https://photutorial.com/photos-statistics/ · https://pix11.com/news/local-news/phone-photo-libraries-mostly-contain-selfies-and-pets-survey-finds/
Repo docs read: /Users/james/Code/EFS/planning/Designs/deterministic-ids.md · efs-v2-holistic-redesign.md · efs-v2-transition-plan.md
