# Credible Neutrality, Walk-Away Recovery, and Gateway Economics

**Lane:** credible neutrality, walk-away recovery, and gateway economics for public-good infrastructure — researched 2026-08-07

Legend used below: **[shipped]** = implemented/observed behavior, **[intent]** = documented intent, **[rec]** = this lane's recommendation/analysis, **[spec]** = speculation.

## 1. Credible neutrality applied to code hosting

- Vitalik Buterin's 2020 essay defines the test: "a mechanism is credibly neutral if just by looking at the mechanism's design, it is easy to see that the mechanism does not discriminate for or against any specific people" — and it must *visibly* be so to a large, diverse audience. Four rules: (1) don't write specific people or outcomes into the mechanism; (2) open source and publicly verifiable execution; (3) keep it simple; (4) don't change it too often ([essay, mirrored at balajis.com](https://balajis.com/p/credible-neutrality); the original `nakamoto.com/credible-neutrality/` returned HTTP 404 when checked 2026-08-07).
- The essay explicitly rejects neutrality maximalism: imperfectly neutral scaffolding is acceptable if time-limited and fitted with fail-safes/exit mechanisms ([balajis.com mirror](https://balajis.com/p/credible-neutrality)). **[rec]** This is the doctrinal license for EFS to run bootstrap services (gateways, indexers, faucets) *provided* they are explicitly labeled convenience, are fungible, and have a documented exit.
- Applied to hosting **[rec]**: GitHub-style hosting is operator-trust — admission, ranking, takedown, and namespace allocation are ToS discretion. A credibly neutral host must move those four functions into mechanism: content-addressed/signed admission rules, fee-based anti-spam instead of discretionary bans, on-chain namespaces, and read paths any third party can replicate. Rule 4 ("don't change it too often") aligns with EFS's frozen-schema instinct; rule 2 requires the *serving* path, not just the data, to be verifiable.
- Main critique line in subsequent discourse: protocol neutrality erodes at the intermediary layer. Post-Merge research found ~46% of Ethereum blocks were built by actors intending OFAC compliance — "credibly neutral protocol, non-neutral operators" is the recurring gap identified by legal scholarship on "legally credible neutrality" ([cryptofinreg.org](https://cryptofinreg.org/projects/legally-credible-neutrality/)). Everything in §3 and §5 below is empirical confirmation of this critique.

## 2. Walk-away case studies

### SourceForge (2015) — operator defection, not shutdown
- SourceForge took over the "GIMP for Windows" account, distributed an ads/adware-wrapped GIMP installer, and locked out the original maintainer, without GIMP's knowledge or permission; Audacity's page/traffic was similarly commandeered ([CIO](https://www.cio.com/article/247074/sourceforge-hijacks-gimp-wraps-it-inside-ads.html), [gHacks](https://www.ghacks.net/2015/06/01/sourceforge-adds-and-removes-adware-installers-to-abandoned-projects/)). SourceForge's defense was that the mirror account was "abandoned" and it was doing "editorial curation" ([SourceForge blog](https://sourceforge.net/blog/gimp-win-project-wasnt-hijacked-just-abandoned/)); after backlash it retreated to opt-in-only bundling ([The Register](https://www.theregister.com/2015/06/03/sourceforge_to_offer_only_optin_adware_after_gimp_grump/)). **[shipped]**
- Lesson **[rec]**: the host owned the *namespace and distribution channel*, so it could impersonate the project to its own users. Neutral hosting must make project identity (keys, signed releases) independent of the host — exactly EFS's signed-record/KEL premise.

### Google Code (2015–16) — orderly shutdown, still lossy
- Read-only 2015-08-24, closed 2016-01-25; Google shipped a Google-Code-to-GitHub exporter covering source, issues, and wikis ([Google OSS blog](https://opensource.googleblog.com/2015/03/farewell-to-google-code.html), [Archive Team wiki](https://wiki.archiveteam.org/index.php/Google_Code)). **[shipped]**
- The residual public archive is "missing some of the original information"; Archive Team began an independent crawl 2015-12-18; users argued unmigrated projects should have gone to archive.org rather than vanish ([Archive Team wiki](https://wiki.archiveteam.org/index.php/Google_Code), [LWN](https://lwn.net/Articles/636535/)). Lesson **[rec]**: even a well-resourced, year-long, tooling-supported shutdown loses metadata; the export format defines what survives.

### Bitbucket Mercurial cull (2020) — third-party rescue, public-only
- Atlassian removed Mercurial support and repos starting 2020-07-01 ([Packt summary](https://hub.packtpub.com/bitbucket-to-no-longer-support-mercurial-users-must-migrate-to-git-by-may-2020/)). All *public* hg repos were archived by Software Heritage with Octobus at `bitbucket-archive.softwareheritage.org`; *private* repos were unrecoverable after a grace period ending ~2022-03-30 ([Atlassian community threads](https://community.atlassian.com/forums/Bitbucket-questions/Recover-deleted-mercurial-repositories/qaq-p/2107026), [recovery writeup](https://7c0h.com/blog/new/recovering_mercurial_code.html); community-built exporter existed for issues/wikis: [bitbucket-hg-exporter](https://pypi.org/project/bitbucket-hg-exporter/0.2.2)). **[shipped]**
- Lesson **[rec]**: altruistic rescue reaches only what is publicly scrapeable, and mostly the repo bytes, not the collaboration metadata. Public-by-default (EFS's stance) is a *precondition* for community rescue.

### Gitorious (2015) — the best observed walk-away, and why
- GitLab acquired Gitorious; gitorious.org shut 2015-06-01. Archive Team took over the *domain itself* and served the content read-only — "cloning and fetching continued to work" at the same URLs — and a full copy went to Software Heritage ([Archive Team wiki](https://wiki.archiveteam.org/index.php/Gitorious), [Software Heritage](https://www.softwareheritage.org/2016/07/21/gitorious-retrieved/), [Lobsters announcement](https://lobste.rs/s/ka9p4y/gitorious_org_is_dead_long_live_gitorious)). **[shipped]**
- Lesson **[rec]**: continuity required transferring the *name*, which almost never happens (it required the dying operator's goodwill). Systems whose names are on-chain rather than rented DNS don't need this miracle.

### GitHub Arctic Code Vault / Archive Program — code survives, collaboration doesn't
- The cold-storage Arctic vault holds a snapshot of each active public repo's default branch (large binaries possibly excluded), with a contributor list appended — no issues, no PRs, no full history in the cold layer; "warm" layers (partners incl. Internet Archive, Software Heritage) capture history/issues/PRs on slower cycles ([GitHub Archive Program FAQ](https://archiveprogram.github.com/faq/), [Approach](https://archiveprogram.github.com/approach/)). **[shipped]**
- Lesson **[rec]**: even the archive designed by the dominant host treats issues/PRs/reviews as second-class. Git history replicates itself via clones; the collaboration record dies with the platform because it is not in the portable artifact. This is the single strongest prior-art argument for EFS-style portable proposals/reviews *as records in the repo's own data model*.

### GeoCities (2009) — the altruism baseline
- Yahoo shut geocities.com 2009-10-26 while it still drew ~11M uniques/month; Archive Team (founded for this) scraped Apr–Oct 2009 and released ~900GB–1TB as a torrent in Oct 2010; multiple rescue groups each captured partial, overlapping slices ([Techdirt](https://www.techdirt.com/2010/10/29/archive-of-geocities-released-as-a-1tb-torrent/), [Archive Team wiki](https://wiki.archiveteam.org/index.php/GeoCities), [Jason Scott](https://ascii.textfiles.com/archives/2720)). **[shipped]**
- Lesson **[rec]**: volunteer rescue is last-minute, lossy, and gated on scrape access; the torrent (self-certifying, seedable-by-anyone) is the durable artifact. Design the archive format *first*, not at shutdown.

## 3. Gateway economics: "protocol neutral, gateway centralized"

### IPFS — the full lifecycle, now concluded
- Cloudflare's public IPFS gateway: traffic redirected to ipfs.io/dweb.link from 2024-05-14; hostnames decommissioned 2024-08-14 ([Cloudflare blog](https://blog.cloudflare.com/cloudflares-public-ipfs-gateways-and-supporting-interplanetary-shipyard/)). Its abuse actions had jumped from 1,073 (H1 2022) to 10,139 (H1 2023) ([TorrentFreak](https://torrentfreak.com/cloudflare-ipfs-takedowns-skyrocket-but-not-for-long-240617/)). **[shipped]**
- ipfs.io/dweb.link are run by Interplanetary Shipyard for the IPFS Foundation, funded by "donors who wish to support digital public infrastructure," explicitly as-is / not-for-production, with a takedown flow feeding the shared Bad Bits denylist (410 responses) ([about.ipfs.io](https://about.ipfs.io/)). **[shipped]**
- Scale and breakdown: 614M requests / 45TB / 10M users daily; May-2025 traffic analysis: 67.4% of requests were backend/automated clients using ipfs.io "as a free CDN," 23.1% hot-linking, only 9.4% real browser visitors ([Shipyard, "A Post Gateway World", 2025-07-23](https://ipshipyard.com/blog/2025-a-post-gateway-world/)). **[shipped]**
- Endgame: on 2026-05-11 Shipyard began redirecting ipfs.io and dweb.link browser traffic to `inbrowser.link`, a Service Worker Gateway that runs in the user's browser and verifies content trustlessly; backend users are told to migrate to Verified Fetch or self-hosting (Rainbow/Someguy, delegated routing); further rate-limiting of the legacy gateways is planned through 2026. Stated reasons: donor funding "is inherently finite," gateways are "a single point of failure and operate on delegated trust" ([Shipyard redirect post](https://ipshipyard.com/blog/2026-ipfs-gateways-redirect-inbrowser-link/), [IPFS public utilities doc](https://docs.ipfs.tech/concepts/public-utilities/)). **[shipped]** — This is the most important recent event in the lane: the flagship dweb project concluded donor-funded neutral gateways do not scale, and the fix chosen was *moving verification into the client*, not better funding.
- Abuse context: IPFS gateways were extensively used for phishing/malware ("bulletproof hosting" dynamics) ([Cisco Talos](https://blog.talosintelligence.com/ipfs-abuse/), [Unit 42](https://unit42.paloaltonetworks.com/ipfs-used-maliciously/)). **[shipped]**

### Arweave — storage is incentivized, serving is not
- Arweave's protocol pays miners (partly via the ~200-year storage endowment) to *store* data, not to serve end-users; gateways get "no tokenomic incentives to offset these expenses," which is why the ecosystem consolidated on the single legacy arweave.net gateway ([ar.io gateway explainer](https://ar.io/articles/what-is-a-gateway/), [endowment explainer](https://permaweb-journal.arweave.net/article/storage-endowment-explained.html)). **[shipped]**
- AR.IO's answer: an incentivized gateway network — mainnet live 2025-02-20, ARIO token (1B fixed supply) staking + observer-protocol rewards for gateways, ArNS name resolution; claimed 1M+ monthly active users at launch ([GlobeNewswire launch release](https://www.globenewswire.com/news-release/2025/02/20/3029734/0/en/AR-IO-Launches-Mainnet-to-Power-First-Permanent-Cloud-Network.html), [whitepaper](https://whitepaper.ar.io/), [docs](https://docs.ar.io/learn/token)). Live gateway registry at [gateways.ar.io](https://gateways.ar.io/). **[shipped]**, but long-run sustainability of token-funded reads is unproven **[spec]**; current gateway count not verifiable via static fetch during this research.

### web3:// — small, operator-run, but structurally aligned
- ERC-4804 finalized (ERC-6860 supersedes/extends it) ([EIP-6860](https://eips.ethereum.org/EIPS/eip-6860)); the public gateways w3link.io (multichain) and w3eth.io are run by the EthStorage team, gateway code is open source ([web3url-gateway repo](https://github.com/ethstorage/web3url-gateway)). EthStorage Mainnet Alpha went live in 2025 (trusted-setup ceremony completed Aug 2025), and GoE (Git on EthStorage: native clone/push/pull with on-chain repo data) launched in 2025 ([EthStorage 2025 annual report](https://blog.ethstorage.io/ethstorage-2025-annual-report/)). **[shipped]** web3:// is pitched as eliminating DNS as a single point of failure **[intent]**, but until browsers speak it natively, access still flows through the operator's HTTPS gateways or an extension — same pattern.

### ENS gateways — DNS is where neutrality dies
- eth.link: registered by Virgil Griffith (then imprisoned); GoDaddy treated it as expired and it was auctioned, selling to Manifold Finance for $852k; ENS sued; the community fallback eth.limo took over, and eth.link is now powered by eth.limo ([The Defiant](https://thedefiant.io/news/defi/ens-godaddy-lawsuit), [eth.limo substack](https://ethlimo.substack.com/p/ethlink-is-now-powered-by-ethlimo)). **[shipped]**
- eth.limo itself was hijacked 2026-04-17/18 via a social-engineering account takeover at registrar EasyDNS — the wildcard record fronting ~2M .eth names was pointed at attacker nameservers for hours; DNSSEC limited user impact ([The Block](https://www.theblock.co/post/398005/easydns-accepts-responsibility-for-eth-limo-hijack-its-first-social-engineering-breach-in-28-years)). **[shipped]**
- Infura outage 2020-11-11 (Geth consensus bug): MetaMask and major exchanges froze ETH/ERC-20 withdrawals simultaneously — the canonical "neutral protocol, centralized access layer" incident ([Decrypt](https://decrypt.co/47846/ethereum-backbone-infura-suffers-major-damage)). **[shipped]**
- Pattern **[rec]**: every neutral protocol grows a centralized convenience layer that concentrates (a) cost, (b) abuse and legal exposure, (c) capture/seizure risk — and that layer is funded by one company or donations and eventually retrenches (Cloudflare exit → Shipyard redirect; arweave.net → AR.IO; eth.link → eth.limo). EFS should assume its own gateways will follow this curve and design for their disappearance from day one.

## 4. Anonymous read economics: who pays for free reads

Observed models, strongest evidence first:
1. **Endowment**: Wikimedia Endowment, a permanent fund of $150M+ (donors incl. Google.org, Amazon, Arcadia, Soros), exists precisely to keep free anonymous reads alive independent of annual fundraising ([Wikimedia Endowment 2024–25 annual report](https://wikimediaendowment.org/annualreports/2024-2025-annual-report/)). **[shipped]**
2. **State + philanthropy**: Tor: US government was 85% of funding in 2015, 35.08% in FY2023–24 ($2.56M, mostly State Dept DRL); individual donations 15.6%; relay bandwidth itself is volunteer-donated and unpriced ([Tor 2023–24 financials](https://blog.torproject.org/financials-blog-post-2023-2024/)). **[shipped]**
3. **Grants**: eth.limo runs on EF/ENS-DAO/Optimism-RPGF/Gitcoin grants; "finding reliable revenue streams is a priority" ([eth.limo FAQ post](https://ethlimo.substack.com/p/ethlimo-everything-youve-wanted-to)). **[shipped]**
4. **Corporate altruism**: has a hard ceiling — Cloudflare (resources were not the constraint) exited IPFS gateway service entirely in 2024 ([Cloudflare blog](https://blog.cloudflare.com/cloudflares-public-ipfs-gateways-and-supporting-interplanetary-shipyard/)). **[shipped]**
5. **Token-incentivized serving**: AR.IO staking/observer rewards (live since Feb 2025, unproven long-term) ([whitepaper](https://whitepaper.ar.io/)). **[shipped]/[spec]**
6. **Cost-collapse via client verification**: Shipyard's 2025–26 pivot — make the client verify and fetch from any provider so the "gateway" is a static service worker with near-zero marginal cost to the operator ([post-gateway world](https://ipshipyard.com/blog/2025-a-post-gateway-world/)). **[shipped]**

Key asymmetry **[rec]**: the free-CDN failure mode (67% of ipfs.io traffic was backends hotlinking) means unmetered anonymous *programmatic* read is what breaks altruistic gateways — human browser reads were under 10% of load. EFS can serve humans cheaply forever if machine traffic is pushed to verifying clients/self-hosting (which EFS's SDK direction already implies). An endowment sized to human-read serving costs is plausible; one sized to free-CDN abuse is not.

## 5. Legal reality of neutral hosting

- **US copyright**: DMCA §512 safe harbor requires notice-and-takedown machinery. Even *non-hosting* gateways attract complaint volume at scale (Cloudflare: 10,139 IPFS abuse actions in H1 2023 alone); EFF has defended an IPFS gateway operator against liability for third-party infringement, i.e., the question is live, not settled ([TorrentFreak](https://torrentfreak.com/cloudflare-ipfs-takedowns-skyrocket-but-not-for-long-240617/)). **[shipped]**
- **US CSAM**: 18 U.S.C. §2258A obliges providers to report apparent CSAM to NCMEC upon actual knowledge; the 2024 REPORT Act expanded covered offenses, extended CyberTipline evidence preservation to 1 year, and raised fines to ~$850k–$1M for patterns of violation. No general proactive-scanning duty in the US, but knowledge triggers duties, and takedown pipelines create knowledge ([statute](https://uscode.house.gov/view.xhtml?req=granuleid%3AUSC-prelim-title18-section2258A&num=0&edition=prelim), [Orrick on REPORT Act](https://www.orrick.com/en/Insights/2024/01/REPORT-Act-Expands-Online-Service-Provider-Obligations-Related-to-Child-Sex-Abuse-Material)). **[shipped]**
- **EU DSA**: hosting-liability shield holds only if the provider removes/disables access "expeditiously" on obtaining actual knowledge; voluntary good-faith scanning doesn't forfeit the shield, but detection = knowledge = duty to act ([Linklaters DSA overview](https://www.linklaters.com/en/insights/blogs/digilinks/2023/february/the-eu-digital-services-act---a-new-era-for-online-harms-and-intermediary-liability), [DSA Art. 6](https://dsa-library.com/article/6/)). The ePrivacy derogation that legalized voluntary CSAM scanning lapsed 2026-04-03, with mandatory-detection legislation (CSAR) still being negotiated — EU obligations are in flux as of this research ([IAPP](https://iapp.org/news/a/notes-from-the-iapp-europe-dsa-and-dma-enforcement-return-of-csam-detection)). **[shipped]/[intent]**
- **Tornado Cash boundary — code vs. operated service**: the Fifth Circuit (Van Loon, Nov 2024) held immutable smart contracts are not sanctionable "property"; OFAC delisted Tornado Cash 2025-03-21, and in April 2025 the district court permanently enjoined re-imposition against the immutable contracts ([Steptoe](https://www.steptoe.com/en/news-publications/international-compliance-blog/treasury-department-delists-tornado-cash-following-the-fifth-circuits-decision.html), [Paul Hastings](https://www.paulhastings.com/insights/crypto-policy-tracker/a-whirlwind-of-change-the-delisting-of-tornado-cash)). But Roman Storm was convicted (2025-08-06) of conspiracy to operate an unlicensed money-transmitting business — the theory being he *operated a service* (website, relayer, fees), not merely published code; DOJ moved (March 2026) for an October 2026 retrial on the deadlocked laundering/sanctions counts, with post-trial motions still pending ([Mayer Brown](https://www.mayerbrown.com/en/insights/publications/2025/08/the-tornado-cash-trials-mixed-verdict-implications-for-developer-liability), [DeFi Education Fund 2026 update](https://www.defieducationfund.org/u-s-v-storm-2026-update/), [The Block](https://www.theblock.co/post/392937/roman-storm-tornado-cash-retrial)). **[shipped]**
- **Cost evidence**: eth.limo — a nominally passive DNS/proxy resolver — spent ~$250k on legal fees in a few months responding to undisclosed "US federal requests," reimbursed by ENS DAO (EP 5.28, 240,632.38 USDC), and warned the costs threatened its ability to keep operating at all ([ENS EP 5.28](https://docs.ens.domains/dao/proposals/5.28/)). **[shipped]**
- Net **[rec]**: immutable protocol + published code sits on the (currently) protected side of the line; *any EFS-branded gateway, resolver, or default endpoint is an operated service* carrying DMCA/NCMEC/DSA duties, subpoena surface, and unbudgetable legal-defense costs, regardless of how neutral the protocol is. Neutrality claims do not reduce the legal bill — eth.limo's does not mention content moderation discretion at all and still paid $250k. Design consequences: takedown must be gateway-local (Bad-Bits-style denylists at the edge, never protocol-level deletion), gateways must be fungible and jurisdictionally diverse, and the flagship operator should hold a legal-defense reserve.

## 6. What "EFS-operated services all disappear and everything still works" requires

Systems that actually achieved operator-independence, and how:
- **Bitcoin**: no operating company; validation is done by every full node; the "mechanism = algorithm + incentives" pays strangers to keep it alive (Buterin's canonical credibly-neutral example: "anyone who mines a block gets the reward") ([balajis.com mirror](https://balajis.com/p/credible-neutrality)). **[shipped]**
- **BitTorrent**: The Pirate Bay shut its central tracker 2009-11-17 and "transfers did not slow or stop" — DHT and PEX took over peer discovery; in 2012 it stopped hosting .torrent files entirely, serving only magnet links (a hash), because the hash suffices to find both metadata and peers ([TorrentFreak 2009](https://torrentfreak.com/the-pirate-bay-tracker-shuts-down-for-good-091117/), [TorrentFreak 2012](https://torrentfreak.com/the-pirate-bay-will-stop-serving-torrents-120112/)). **[shipped]**
- **Tor**: thousands of volunteer relays make serving capacity operator-independent, though *development* funding remains concentrated (35% US gov) — operator-independence of the data plane, not the roadmap ([Tor financials](https://blog.torproject.org/financials-blog-post-2023-2024/)). **[shipped]**
- **Counter-example**: Gitorious survived only because the domain was hand-transferred; GeoCities/Google Code/Bitbucket survived only as partial third-party archives (§2). **[shipped]**

Common ingredients across the survivors **[rec]**:
1. **Self-certifying artifacts** — content hashes / signed records make any mirror verifiable, which is what lets strangers serve the data (magnet links, service-worker gateway verification, git clones, Software Heritage). EFS records already have this property; the *read path* must expose it.
2. **Peer/provider discovery nobody owns** — DHT/PEX, delegated routing; never DNS. Every gateway failure in §3 routes through a rented name (eth.link, eth.limo's EasyDNS account, gitorious.org). On-chain naming plus web3://-style resolution is the fix **[intent]**; HTTPS gateways over it reintroduce the weakness.
3. **A client that verifies** — full node, torrent client, Verified Fetch. Shipyard's 2025–26 arc is a live migration from trusted-gateway to verifying-client and is the strongest external validation of the EFS SDK direction.
4. **Marginal incentive (or near-zero marginal cost) to serve** — mining rewards, tit-for-tat, AR.IO staking, or static-asset cheapness. Pure altruism has a demonstrated ceiling (§4).
5. **The complete social artifact inside the replicated data model** — Git history survives every host death because clones carry it; issues/PRs/reviews die because they don't (Arctic Vault preserves code, not collaboration). EFS's portable proposals/reviews-as-records is precisely the missing piece; it should be treated as the core differentiator, not a feature.
6. **An operator-vanish drill** — enumerate everything that breaks if the EFS org disappears (gateways, indexers, docs sites, faucets, default RPCs); each item must be protocol-ized, mirrored by third parties, or explicitly labeled ephemeral convenience. Prior art shows the enumeration is never done until shutdown week.

## Sources

- https://balajis.com/p/credible-neutrality
- https://cryptofinreg.org/projects/legally-credible-neutrality/
- https://www.cio.com/article/247074/sourceforge-hijacks-gimp-wraps-it-inside-ads.html
- https://sourceforge.net/blog/gimp-win-project-wasnt-hijacked-just-abandoned/
- https://www.ghacks.net/2015/06/01/sourceforge-adds-and-removes-adware-installers-to-abandoned-projects/
- https://www.theregister.com/2015/06/03/sourceforge_to_offer_only_optin_adware_after_gimp_grump/
- https://opensource.googleblog.com/2015/03/farewell-to-google-code.html
- https://wiki.archiveteam.org/index.php/Google_Code
- https://lwn.net/Articles/636535/
- https://hub.packtpub.com/bitbucket-to-no-longer-support-mercurial-users-must-migrate-to-git-by-may-2020/
- https://community.atlassian.com/forums/Bitbucket-questions/Recover-deleted-mercurial-repositories/qaq-p/2107026
- https://7c0h.com/blog/new/recovering_mercurial_code.html
- https://pypi.org/project/bitbucket-hg-exporter/0.2.2
- https://wiki.archiveteam.org/index.php/Gitorious
- https://www.softwareheritage.org/2016/07/21/gitorious-retrieved/
- https://lobste.rs/s/ka9p4y/gitorious_org_is_dead_long_live_gitorious
- https://archiveprogram.github.com/faq/
- https://archiveprogram.github.com/approach/
- https://www.techdirt.com/2010/10/29/archive-of-geocities-released-as-a-1tb-torrent/
- https://wiki.archiveteam.org/index.php/GeoCities
- https://ascii.textfiles.com/archives/2720
- https://blog.cloudflare.com/cloudflares-public-ipfs-gateways-and-supporting-interplanetary-shipyard/
- https://torrentfreak.com/cloudflare-ipfs-takedowns-skyrocket-but-not-for-long-240617/
- https://about.ipfs.io/
- https://ipshipyard.com/blog/2025-a-post-gateway-world/
- https://ipshipyard.com/blog/2026-ipfs-gateways-redirect-inbrowser-link/
- https://docs.ipfs.tech/concepts/public-utilities/
- https://blog.talosintelligence.com/ipfs-abuse/
- https://unit42.paloaltonetworks.com/ipfs-used-maliciously/
- https://ar.io/articles/what-is-a-gateway/
- https://permaweb-journal.arweave.net/article/storage-endowment-explained.html
- https://www.globenewswire.com/news-release/2025/02/20/3029734/0/en/AR-IO-Launches-Mainnet-to-Power-First-Permanent-Cloud-Network.html
- https://whitepaper.ar.io/
- https://docs.ar.io/learn/token
- https://gateways.ar.io/
- https://eips.ethereum.org/EIPS/eip-6860
- https://github.com/ethstorage/web3url-gateway
- https://blog.ethstorage.io/ethstorage-2025-annual-report/
- https://thedefiant.io/news/defi/ens-godaddy-lawsuit
- https://ethlimo.substack.com/p/ethlink-is-now-powered-by-ethlimo
- https://ethlimo.substack.com/p/ethlimo-everything-youve-wanted-to
- https://www.theblock.co/post/398005/easydns-accepts-responsibility-for-eth-limo-hijack-its-first-social-engineering-breach-in-28-years
- https://decrypt.co/47846/ethereum-backbone-infura-suffers-major-damage
- https://wikimediaendowment.org/annualreports/2024-2025-annual-report/
- https://blog.torproject.org/financials-blog-post-2023-2024/
- https://docs.ens.domains/dao/proposals/5.28/
- https://uscode.house.gov/view.xhtml?req=granuleid%3AUSC-prelim-title18-section2258A&num=0&edition=prelim
- https://www.orrick.com/en/Insights/2024/01/REPORT-Act-Expands-Online-Service-Provider-Obligations-Related-to-Child-Sex-Abuse-Material
- https://www.linklaters.com/en/insights/blogs/digilinks/2023/february/the-eu-digital-services-act---a-new-era-for-online-harms-and-intermediary-liability
- https://dsa-library.com/article/6/
- https://iapp.org/news/a/notes-from-the-iapp-europe-dsa-and-dma-enforcement-return-of-csam-detection
- https://www.steptoe.com/en/news-publications/international-compliance-blog/treasury-department-delists-tornado-cash-following-the-fifth-circuits-decision.html
- https://www.paulhastings.com/insights/crypto-policy-tracker/a-whirlwind-of-change-the-delisting-of-tornado-cash
- https://www.mayerbrown.com/en/insights/publications/2025/08/the-tornado-cash-trials-mixed-verdict-implications-for-developer-liability
- https://www.defieducationfund.org/u-s-v-storm-2026-update/
- https://www.theblock.co/post/392937/roman-storm-tornado-cash-retrial
- https://torrentfreak.com/the-pirate-bay-tracker-shuts-down-for-good-091117/
- https://torrentfreak.com/the-pirate-bay-will-stop-serving-torrents-120112/
