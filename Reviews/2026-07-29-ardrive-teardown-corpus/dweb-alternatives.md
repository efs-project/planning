# Other Decentralized Drives — Alternative Answers to the Same Problem

Lane report for the ArDrive competitive teardown. Scope: product/UX/business, not architecture. All claims dated; live-verified 2026-07-29 unless noted. Where a claim rests on a single secondary source, that is flagged.

## Summary

The "decentralized drive" category that ArDrive lives in has an extraordinary body count, and the deaths cluster around four causes: VC-subsidized free storage with no path to revenue (Skiff, Skynet Labs, Fleek hosting, web3.storage/nft.storage), identity/brand churn that torched user trust and URLs (web3.storage→Storacha→Fil One; Akord→Tusky; Filebase quietly dropping its decentralized backends), share links welded to a company-owned gateway domain (siasky.net is now literally a squatted Indonesian gambling site — every old Skynet share link on the web resolves to it), and crypto-shaped payment/onboarding friction that consumers simply refuse. The survivors with real users are instructive precisely because none of them is a "dweb drive" in the pure sense: Internxt (~1M active users, profitable since Q4 2024) won by quietly abandoning its decentralized network and selling zero-knowledge encryption with credit cards and lifetime plans; Pinata (600k developers) won by repositioning IPFS pinning as a boring developer files API and now de-emphasizes web3 entirely; Fileverse is earning genuine Ethereum-native goodwill (Vitalik endorsement, ENS/Gnosis backing) with a no-signup, gasless, local-first suite. The category's clearest lesson for EFS: decentralization is a retention feature (exit rights, walkaway guarantees), never an acquisition feature — users arrive for a working drive with boring payments and stay because the data outlives the company. The single best idea in the graveyard is Akord Weave: a read-only client deployed on the storage layer itself, so vault access survives the company's death — the strongest possible product expression of what EFS already believes.

## Findings

### 1. Akord → Tusky (Arweave exit; rebuilt on Walrus/Sui)

**What happened.** Akord was the closest thing ArDrive had to a direct competitor on Arweave: E2EE "vaults" with a consumer web app, API/SDK/CLI, and a cloud-vs-permanent tier split. In late 2024/early 2025 the team announced it was **sunsetting the entire Arweave product** — app, API, SDK, CLI — over a six-month wind-down, stopping subscriptions, and rebuilding on **Walrus (Sui)** under the new name **Tusky** ([docs.akord.com sunsetting FAQ](https://docs.akord.com/introduction/akord-arweave-sunsetting-faqs), [tusky.io/blog/akord-sunsetting-on-arweave](https://tusky.io/blog/akord-sunsetting-on-arweave), both surfaced via search 2026-07-29; exact announcement date not directly verifiable — both pages 403 automated fetchers).

**Onboarding/payment (Tusky).** Sign-up with **Google, Twitch, or any Sui wallet**; Tusky **sponsors gas** and abstracts Walrus entirely. 1 GB free; plans from **$1.49/mo for 50 GB** up to 5 TB ([tusky.io](https://tusky.io/), via search snippets 2026-07-29). Ran a testnet points campaign from June 30, 2025 with an expected token event ([usethebitcoin.com airdrop guide](https://usethebitcoin.com/airdrop/tusky-testnet-airdrop-guide/), 2025).

**Privacy/deletion.** E2EE vaults with user-held keys carried over from Akord. The stated reason for leaving Arweave is the product-shaped one: Walrus offers **both temporary and long-term storage** ([walrus.xyz blog on Tusky](https://www.walrus.xyz/blog/tusky-storage-solution-walrus), accessed 2026-07-29) — i.e., a drive product needs *deletable* and *expiring* storage tiers, and permanent-only storage kept fighting the product.

**The exit mechanism (the gem).** Akord committed to shipping **Akord Weave** — a **read-only dApp deployed on Arweave itself** that lets anyone with their backup phrase find, retrieve, and decrypt their old vaults forever, "regardless of what happens to Akord the company" ([docs.akord.com](https://docs.akord.com/introduction/akord-arweave-sunsetting-faqs); [akord.com/platform/explorer](https://akord.com/platform/explorer), accessed via search 2026-07-29). Permanent-vault data stays on Arweave; only the company's service layer died.

**Verdict for EFS.** Arweave's flagship *second* drive product concluded the consumer-drive business on permanent-only storage doesn't work, exited, and took venture interest to a hotter L1. **Steal:** the Weave pattern — an on-chain, company-independent read client. **Avoid:** betting a drive UX on a single permanence tier.

### 2. Fileverse (IPFS/EVM — the closest thing to an EFS sibling)

**What it is.** A privacy-first collaboration suite on Ethereum rails: **dDocs** (ddocs.new), **dSheets** (dsheets.new), and **Portal** (a drive-like shared workspace). Raised a **$1.5M pre-seed in Oct 2023 co-led by Gnosis and Factor**, with Safe, Mask, and Arweave-ecosystem participation ([CoinDesk](https://www.coindesk.com/business/2023/10/17/web3-powered-file-management-app-raises-15m-to-offer-alternative-to-google), 2023-10-17). dSheets launched June 2025 with an ENS co-marketing push ([The Block](https://www.theblock.co/post/358608/ethereum-startup-fileverse-open-source-private-google-dsheets); [@ensdomains](https://x.com/ensdomains/status/1935005091842637931), June 2025). Vitalik publicly recommended dDocs (X post, 2024-06-07, via [iq.wiki](https://iq.wiki/wiki/fileverse)).

**Onboarding.** The best in the category: **no sign-up at all** — ddocs.new/dsheets.new open straight into a working editor; data is **local-first (IndexedDB)** with *optional* publish to IPFS for sharing/sync ([fileverse.io](https://fileverse.io/), accessed 2026-07-29). Heavier "Portal" accounts deploy a **user-owned smart contract on Gnosis Chain** as the drive root, with **ERC-4337 + Pimlico paymasters making it gasless** and social-login-friendly ([Gnosis Builders on Medium](https://medium.com/gnosis-builders/get-to-gno-fileverse-the-future-of-on-chain-file-storage-d274b6f759b1), 2023).

**Payment.** Effectively free today (grant/pre-seed subsidized). No visible pricing page (fileverse.io, accessed 2026-07-29). This is the familiar countdown-timer risk — flagged, not yet detonated.

**Sharing/privacy.** E2EE by default; access control by **ENS name, email, or wallet address**; zk-flavored authentication ("vOPRF-ID"); opt-in *local* LLM for AI features; a **"Walkaway" recovery page** — static/onion recovery of your data with no dependence on Fileverse servers ([fileverse.io](https://fileverse.io/); [The Block](https://www.theblock.co/post/358608/ethereum-startup-fileverse-open-source-private-google-dsheets), June 2025).

**Deletion.** Local data is trivially deletable; once published to IPFS, standard unpin-doesn't-erase caveats apply — Fileverse doesn't foreground this (not addressed on marketing pages; unverified).

**Traction.** No published user numbers found (searched 2026-07-29). Signals are qualitative: ethereum.org apps listing, event portals for DappCon/Devcon, Vitalik/ENS endorsements. Real but small.

**Verdict for EFS.** This is the team competing for the *same* Ethereum-native users as the EFS Files app, with the same paymaster-style promptless-writes instinct. **Steal:** zero-signup instant-open documents; ENS-as-ACL; the Walkaway page as a productized exit right. **Watch:** they have no revenue story either.

### 3. Internxt — the one that actually got a million users (by becoming a normal cloud)

**What it is.** Valencia-based "privacy-first cloud": drive, VPN, antivirus. Started as a decentralized-storage ICO project (INXT token, distributed nodes), then **migrated from "an experimental platform relying on a distributed network" to "a more traditional cloud service"** ([Cloudwards review, updated 2026-04-03](https://www.cloudwards.net/review/internxt/)). The web3 substrate is gone from the product; the *privacy marketing* remained.

**Traction — the category's biggest.** **~1M active users in 100+ countries, profitable since Q4 2024**, €3.3M round in July 2025 (Prosegur Tech Ventures et al.), €40M valuation, partnerships with Revolut, Surfshark, Bitdefender ([EU-Startups](https://www.eu-startups.com/2025/07/spanish-startup-internxt-raises-e3-3-million-to-become-the-ethical-alternative-to-big-tech/), 2025-07; [Tech.eu](https://tech.eu/2025/07/16/internxt-raises-eur33m-to-build-a-privacy-first-alternative-to-big-tech/), 2025-07-16).

**Onboarding/payment.** Email sign-up, installers, done. Pricing is aggressive consumer SaaS: 70–79% first-year discounts (3TB at $3.33/mo intro, renewing $19.99/mo) and **lifetime plans (3TB for $450 one-time)**; 1 GB free ([Cloudwards](https://www.cloudwards.net/review/internxt/), 2026-04-03). Lifetime deals + AppSumo channel did the acquisition work.

**Privacy.** Client-side zero-knowledge E2EE; markets **post-quantum encryption (Kyber-512 + AES-256)**; GDPR/EU jurisdiction ([Cloudwards](https://www.cloudwards.net/review/internxt/)).

**Where users are unhappy.** Consistently the worst performer in reviewer speed tests (5GB up in ~8 min; a commenter: 13 hours for a 50GB backup); sync is one-directional in surprising ways; **Trustpilot reports of the desktop app deleting/losing files, uploads freezing at 3–5GB, and a 10TB lifetime buyer finding the CLI removed months after purchase with the company claiming it was never included** ([Trustpilot](https://www.trustpilot.com/review/internxt.com); [Cloudwards](https://www.cloudwards.net/review/internxt/); [Kripesh Adwani review](https://kripeshadwani.com/internxt-review/), all accessed 2026-07-29). Deleted files sit in trash indefinitely *and count against quota* (Cloudwards).

**Verdict for EFS.** Proof that ~1M consumers will buy "your files, encrypted, no one can read them" when payment is a credit card and the words "wallet", "token", and "gas" never appear — and proof that they'll churn loudly the moment sync eats a file. **Steal:** pricing presentation (boring money). **Avoid:** shipping a lossy sync client; retroactively removing features lifetime buyers paid for.

### 4. Storj (+ Filebase) — S3-compatible DePIN, now in Chapter 11

**What it is.** Developer/enterprise object storage over a network of independent node operators, sold almost entirely through **S3 compatibility** ($7/TB storage + $7/TB egress, up from $4; [storj.io](https://www.storj.io/object-storage/s3-compatibile-storage), accessed 2026-07-29). Never really a consumer drive — the consumer story was delegated to partners. Acquired GPU provider Valdi in July 2024 to chase AI compute ([CoinDesk](https://www.coindesk.com/business/2024/07/09/storj-acquires-cloud-computing-firm-valdi-terms-undisclosed)); acquired by Inveniam Oct 2025.

**The news.** **Storj Labs filed Chapter 11 on July 26, 2026** (N.D. West Virginia, case 5:26-bk-00512) — framed as a voluntary restructuring of "legacy liabilities" with operations continuing, and a floated (unapproved, detail-free) plan to give STORJ token holders equity in the reorganized company; token fell ~16% ([GlobeNewswire](https://www.globenewswire.com/news-release/2026/07/26/3333224/0/en/Storj-Announces-Voluntary-Financial-Restructuring-to-Resolve-Legacy-Liabilities-and-Position-the-Business-for-Growth.html), 2026-07-26; [CoinDesk](https://www.coindesk.com/business/2026/07/27/cloud-data-firm-storj-files-for-chapter-11-extending-a-week-of-crypto-failures-token-slides-16), 2026-07-27). Growth claims (7x YoY demand end-2024) did not save it from its 2017-token-era legacy.

**Filebase.** The S3 gateway that made Sia/Storj usable **quietly sunset its decentralized backends** and now runs on Filebase-operated infrastructure plus IPFS ([obsideo.io provider directory](https://obsideo.io/compare/), accessed 2026-07-29; corroborated by Filebase's own current marketing which no longer names Sia/Storj). The "S3 façade over dweb" pattern ended with the façade keeping the customers and dropping the dweb.

**Verdict for EFS.** S3 compatibility is a real adoption lever (meet developers where they are) — but both Storj and Filebase show that when the decentralized backend is invisible behind a familiar API, it is also *disposable*. And a token on the balance sheet is a nine-year liability tail. **Steal:** compatibility layers. **Avoid:** making the chain invisible — invisible decentralization gets amputated under cost pressure.

### 5. Sia / Skynet — the definitive postmortem

**What happened.** Skynet (2020) was Sia's CDN/file-sharing layer with real developer buzz. **Skynet Labs shut down in August 2022 after failing to raise** (had $3M from Paradigm in 2020) ([CoinDesk](https://www.coindesk.com/business/2022/08/12/blockchain-firm-skynet-labs-shutters-after-failing-to-get-new-funding), 2022-08-12). The architecture pitch was "the portal is just an access point — swap it for another any time" ([Skynet support guide](https://support.skynetlabs.com/getting-started/accessing-data-on-skynet), archived).

**What it looks like in 2026.** **siasky.net — the domain embedded in essentially every Skynet share link ever posted — is now a squatted Indonesian online-gambling site** ("ROYALTOGEL"; fetched 2026-07-29). The theoretical portal-swap never mattered: links were minted as `https://siasky.net/<skylink>`, so when the company died and the domain lapsed, the *entire shared-link graph* rotted to a lottery site. Sia itself (the Foundation, renterd) continues as infrastructure; the drive/CDN product layer is simply gone.

**Verdict for EFS.** The single most vivid warning in this file. Content addressing does not save you if the **canonical share format** users copy is a company-domain URL. **Avoid at all costs:** minting share links on `efs.something.com`. The canonical link must be the protocol-native form (`web3://`, `ar://`, ENS-based), with any https gateway explicitly framed as a disposable convenience mirror.

### 6. Skiff Drive — how not to shut down

**What it was.** E2EE mail/docs/drive suite; Drive launched March 2022 with 10GB free and an **opt-in IPFS storage backend** built with Protocol Labs ([IPFS blog](https://blog.ipfs.tech/2021-11-15-Skiff-Integrates-IPFS/), 2021-11-15; [TechCrunch on the $10.5M Series A](https://techcrunch.com/2022/03/30/skiff-series-a-encrypted-workspaces/), 2022-03-30). ~$14M raised, Sequoia among investors.

**The shutdown.** Acquired by Notion **Feb 10, 2024**; products discontinued after a six-month sunset — accounts didn't convert, they *stopped working* ([TechRadar](https://www.techradar.com/computing/cyber-security/skiff-gets-bought-by-notion-raising-privacy-concerns), 2024-02). The community reaction was ugly: the announcement was worded as "joining Notion" excitement with the discontinuation buried in FAQs; Discord and GitHub repos vanished immediately; the subreddit was locked; "completely open source" turned out to mean selected frontend components ([Notesnook postmortem](https://notesnook.com/blog/the-skiff-privacy-fiasco), 2024).

**Verdict for EFS.** Skiff proves an E2EE drive can be a genuinely lovely product and still evaporate in six months, taking user trust in the entire *category* with it. Its IPFS option also shows "decentralized backend" as a checkbox feature retains nobody. **Steal (from the postmortem, not the product):** publish your exit story while healthy — data export, open source of record, protocol-level survivability — because "what happens when you die" is now a question every burned Skiff/Skynet user asks first.

### 7. IPFS pinning products — Pinata, web3.storage/Storacha/Fil One, nft.storage, Fleek

This sub-ecosystem answered "where do my IPFS files live" and has churned brutally:

- **Pinata — the survivor.** "Autonomous File Storage… trusted by 600,000 developers"; IPFS is now *one feature* alongside Private IPFS, a general files API, CDN/gateways, and AI-agent hosting; free tier 1GB/500 files; paid from ~1TB tiers ([pinata.cloud](https://pinata.cloud/), fetched 2026-07-29). Survived by repositioning from "web3 pinning" to "boring file API for devs (and now AI)". No consumer drive at all.
- **web3.storage → Storacha → Fil One — three identities in ~3 years.** web3.storage deprecated uploads Jan 2024 and rebranded to Storacha (UCAN capability-based spaces, hot storage on Filecoin) ([filecoin.io](https://www.filecoin.io/blog/introducing-storacha---the-future-of-hot-decentralized-data), 2024; [GitHub deprecation](https://github.com/web3-storage/web3.storage)). Storacha announced "Forge" on Filecoin Onchain Cloud at $5.99/TB/mo (Nov 2025, [CoinDesk PR](https://www.coindesk.com/press-release/2025/11/19/introducing-filecoin-onchain-cloud-verifiable-developer-owned-infrastructure)). As of 2026-07-29, **storacha.network and docs.storacha.network 301-redirect to fil.one**, an S3-compatible "built for the AI era" service ($4.99/TB/mo) whose homepage mentions *neither* Storacha nor web3.storage. Legacy users must archaeologize their own storage provider.
- **nft.storage** decommissioned Classic uploads June 30, 2024; existing data "safe" but with degrading latency/availability ([github.com/nftstorage/nft.storage](https://github.com/nftstorage/nft.storage)).
- **Fleek** discontinued its entire IPFS hosting product **Jan 31, 2026** and pivoted to TEE-hosted AI agents; IPFS Shipyard published community migration guides, noting Infura's IPFS gateway deprecation in the same wave ([ipshipyard.com](https://ipshipyard.com/blog/2026-ipfs-self-hosting-migration/), 2026; [GitHub migration issue](https://github.com/ipshipyard/waterworks-community/issues/23)).

**Verdict for EFS.** The free-pinning era is over; every subsidized IPFS product either died, rebranded beyond recognition, or pivoted to AI. The one durable idea in the wreckage is **UCAN-style capability delegation** (Storacha's spaces): sharing/access as transferable, attenuable capabilities rather than server-side ACLs — conceptually adjacent to what EFS attestations can do natively. Also note: ArDrive's `ar://` permanence pitch gets *stronger* every time an IPFS pinning service dies, and EFS mirror policy (ar:// as byte carrier) inherits that same advantage over pin-dependent mirrors.

### 8. Swarm / Fairdrive — alive, unadopted

Fair Data Society's Fairdrive (drive UI + FairOS filesystem on Swarm, BZZ wallet) has years of development — 1,543 commits, latest push literally today (2026-07-29, [GitHub API](https://api.github.com/repos/fairDataSociety/fairdrive-theapp)) — and **21 stars**. A protocol-first drive with no distribution, no consumer payment story (BZZ postage stamps), and no discernible user base after ~5 years. Included here as the control group: continuous engineering effort with zero product traction. (Accessed 2026-07-29.)

### Comparison: who earned real users, and what kills dweb drives

| Product | Real users? | Why |
|---|---|---|
| Internxt | ~1M active, profitable | Normal cloud UX + card/lifetime payments; decentralization abandoned, privacy kept |
| Pinata | 600k developers | Dev API positioning; de-emphasized web3; never a drive |
| Fileverse | Small but genuine, growing | Zero-signup, gasless, local-first; Ethereum-native credibility |
| Tusky (ex-Akord) | Small; airdrop-inflated testnet | Web2 login + sponsored gas is right; had to abandon Arweave-permanence-only to get there |
| Storj | Enterprise customers, but Ch. 11 | S3 compatibility worked; token-era liabilities didn't |
| Skiff | Hundreds of thousands (then zero) | Great UX, VC-subsidized free tier — died on business model |
| Skynet | Dev buzz (then zero) | Portal-domain links rotted into a gambling site |
| Fairdrive | ~none | Protocol-first, no distribution, crypto-native payments |

**The four killers, ranked by body count:** (1) **business-model collapse** — free storage subsidized by VC/tokens is a countdown timer (Skiff, Skynet, Fleek, web3.storage, nft.storage); (2) **company-domain link rot** — share links die with the company (Skynet, and every dead pinning gateway); (3) **payment/onboarding friction** — tokens, wallets, and postage stamps stall consumer adoption at zero (Fairdrive, early Akord, early Storj consumer attempts), while credit cards + lifetime deals took Internxt to a million; (4) **permanence rigidity** — a drive needs delete, expiry, and cheap mutation, which is exactly why Akord left Arweave. Notably *absent* from the killer list: key loss. Every survivor either has real recovery UX (backup phrases, Walkaway pages, zk recovery) or doesn't do E2EE at all — the industry already learned that lesson before it could kill anyone at scale.

## Strengths (what this cohort does genuinely well)

- **Fileverse's zero-signup instant-open** (ddocs.new) is the best onboarding in all of web3 productivity — better than ArDrive's, better than most web2 tools. Gasless smart-contract "Portals" + paymasters show promptless EVM writes are shippable today.
- **Tusky's web2-login + sponsored-gas + $1.49/mo** package is the correct consumer answer to "how do I pay a blockchain": you don't; the product does.
- **Akord Weave** — the on-chain, company-independent, backup-phrase read client — is the most honest exit-rights feature any storage product has ever shipped.
- **Internxt's pricing presentation** (lifetime plans, boring checkout, GDPR flag-waving) proves the privacy-storage consumer market is real and seven figures deep.
- **Storacha's UCAN capability model** is genuinely good access-control design, even though the brand carrying it kept dying.
- **Pinata's discipline** in following developers' actual needs (files API, then AI) rather than the ideology is why it still exists.

## Weaknesses / user pain

- **Trust is the category's scarcest resource and everyone keeps burning it**: Skiff's euphemistic shutdown, web3.storage's serial rebrands (current homepage doesn't acknowledge its own predecessors), Filebase silently dropping decentralized backends, Internxt clawing back features from lifetime buyers, Storj's token-holders-last bankruptcy. Users now pattern-match *any* dweb drive to "this will be gone or renamed in 24 months."
- **Sync clients are where consumer trust actually dies**: Internxt's most severe complaints are not ideology, they're "the desktop app deleted my files" (Trustpilot, 2025). Nobody in this cohort ships a sync client users praise.
- **Deletion is handled badly everywhere**: permanent-storage products can't delete (Akord's reason for leaving), IPFS products unpin without erasing, and Internxt's trash counts against quota forever. No one has a clean, honest deletion story.
- **Token entanglement is pure liability at the product layer**: INXT (vestigial), STORJ (bankruptcy discount), BZZ (onboarding wall), Tusky's airdrop-farming testnet (inflates every traction metric).
- **Nobody has mobile worth mentioning.** Across the entire cohort, no credible mobile-first experience surfaced in any review or announcement checked (2026-07-29). ArDrive's (rough) mobile apps are, astonishingly, near the top of the category.

## Implications for the EFS file browser

1. **Make the canonical share link protocol-native, and treat gateways as disposable.** Skynet's link graph now resolves to a gambling site because the copyable artifact was a company-domain URL. Files should copy `web3://`/ENS-native links as the primary artifact, with any https convenience mirror visibly labeled as non-canonical. This is the cheapest catastrophic-failure insurance available.
2. **Ship the "Weave": a minimal read-only Files client that lives on-chain/on-mirror, independent of the EFS org.** Akord's sunset FAQ is the playbook — publish the walkaway story *while healthy*. For a project whose whole thesis is on-chain persistence, a company-independent reader is the proof, not the marketing.
3. **Decentralization retains; it does not acquire. Lead with a working drive and boring payments.** Internxt's million users came from credit cards, lifetime deals, and privacy copy; Tusky's relaunch leads with Google login and sponsored gas. EFS's gasless faucet-drip (already the hackathon must-have) is the right first domino; the wallet must never be the front door for read/browse flows.
4. **Design deletion/expiry as first-class UX, distinct from permanence.** Akord left Arweave because a drive without delete fights its users. EFS's layered model (on-chain FS + swappable byte mirrors) can honestly offer per-file lifecycle — "this file is on a deletable mirror" vs "this file is permanently mirrored on ar://" — which no product in this cohort managed to present clearly. Tiered-permanence vaults (Akord's cloud vs permanent split) are the proven presentation pattern.
5. **Steal Fileverse's onboarding shape, since they're aiming at the same users**: instant-open with local state, ENS-as-share-target, gasless contract deployment via paymaster, and a productized recovery page. Where EFS can beat them: they have no filesystem semantics and no revenue story.
6. **Never let the chain become invisible plumbing behind a compatibility façade.** Filebase kept the S3 customers and amputated Sia/Storj the moment economics tightened. If EFS ships S3/WebDAV-style compatibility layers (worth doing), the product must keep surfacing *why* the chain is there — verifiability, portability, walkaway — or the layer above will eventually discard it.

## Sources

- https://docs.akord.com/introduction/akord-arweave-sunsetting-faqs (via search, 2026-07-29; direct fetch 403)
- https://tusky.io/blog/tusky-formerly-akord-is-moving-to-walrus (via search, 2026-07-29; direct fetch 403)
- https://www.walrus.xyz/blog/tusky-storage-solution-walrus (accessed 2026-07-29)
- https://docs.tusky.io/about/about-tusky (via search, 2026-07-29)
- https://usethebitcoin.com/airdrop/tusky-testnet-airdrop-guide/ (2025)
- https://fileverse.io/ (fetched 2026-07-29)
- https://www.coindesk.com/business/2023/10/17/web3-powered-file-management-app-raises-15m-to-offer-alternative-to-google (2023-10-17)
- https://www.theblock.co/post/358608/ethereum-startup-fileverse-open-source-private-google-dsheets (June 2025)
- https://x.com/ensdomains/status/1935005091842637931 (June 2025)
- https://medium.com/gnosis-builders/get-to-gno-fileverse-the-future-of-on-chain-file-storage-d274b6f759b1 (2023)
- https://iq.wiki/wiki/fileverse (accessed 2026-07-29; Vitalik endorsement 2024-06-07)
- https://www.cloudwards.net/review/internxt/ (updated 2026-04-03; fetched 2026-07-29)
- https://www.trustpilot.com/review/internxt.com (accessed 2026-07-29)
- https://kripeshadwani.com/internxt-review/ (accessed 2026-07-29)
- https://www.eu-startups.com/2025/07/spanish-startup-internxt-raises-e3-3-million-to-become-the-ethical-alternative-to-big-tech/ (July 2025)
- https://tech.eu/2025/07/16/internxt-raises-eur33m-to-build-a-privacy-first-alternative-to-big-tech/ (2025-07-16)
- https://www.globenewswire.com/news-release/2026/07/26/3333224/0/en/Storj-Announces-Voluntary-Financial-Restructuring-to-Resolve-Legacy-Liabilities-and-Position-the-Business-for-Growth.html (2026-07-26)
- https://www.coindesk.com/business/2026/07/27/cloud-data-firm-storj-files-for-chapter-11-extending-a-week-of-crypto-failures-token-slides-16 (2026-07-27)
- https://www.coindesk.com/business/2024/07/09/storj-acquires-cloud-computing-firm-valdi-terms-undisclosed (2024-07-09)
- https://www.storj.io/object-storage/s3-compatibile-storage (accessed 2026-07-29)
- https://obsideo.io/compare/ (accessed 2026-07-29; Filebase backend history — single-source, corroborated by Filebase's current marketing)
- https://www.coindesk.com/business/2022/08/12/blockchain-firm-skynet-labs-shutters-after-failing-to-get-new-funding (2022-08-12)
- https://siasky.net/ (fetched 2026-07-29 — now a squatted gambling site)
- https://support.skynetlabs.com/getting-started/accessing-data-on-skynet (archived Skynet docs)
- https://notesnook.com/blog/the-skiff-privacy-fiasco (2024; fetched 2026-07-29)
- https://www.techradar.com/computing/cyber-security/skiff-gets-bought-by-notion-raising-privacy-concerns (Feb 2024)
- https://blog.ipfs.tech/2021-11-15-Skiff-Integrates-IPFS/ (2021-11-15)
- https://techcrunch.com/2022/03/30/skiff-series-a-encrypted-workspaces/ (2022-03-30)
- https://pinata.cloud/ (fetched 2026-07-29)
- https://www.filecoin.io/blog/introducing-storacha---the-future-of-hot-decentralized-data (2024)
- https://github.com/web3-storage/web3.storage (deprecation notice, Jan 2024)
- https://fil.one/ (fetched 2026-07-29; storacha.network and docs.storacha.network both 301 here)
- https://www.coindesk.com/press-release/2025/11/19/introducing-filecoin-onchain-cloud-verifiable-developer-owned-infrastructure (2025-11-19)
- https://github.com/nftstorage/nft.storage (decommission notice, 2024)
- https://ipshipyard.com/blog/2026-ipfs-self-hosting-migration/ (2026)
- https://github.com/ipshipyard/waterworks-community/issues/23 (Fleek hosting deprecation, Jan 2026)
- https://api.github.com/repos/fairDataSociety/fairdrive-theapp (fetched 2026-07-29)
- https://github.com/fairDataSociety/Fairdrive (accessed 2026-07-29)
