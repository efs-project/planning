# Network privacy, metadata leakage, and private read paths — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** network-privacy. **Date:** 2026-07-07.

## Executive framing

EFS client v2 must fetch two things it cannot avoid: chain state (records, lenses, freshness) and content bytes (mirrors, IPFS, on-chain bytes). Every fetch has an observer. The 2026 state of the art splits the problem into three orthogonal properties that the client must track **separately** and never conflate:

1. **Integrity** — is the data authentic? (Solvable today: envelope signatures, CIDs, eth_getProof, Helios. Makes endpoints *safe*.)
2. **Identity privacy** — does the endpoint learn *who* is reading? (Partially solvable today: OHTTP, Private-Relay-class proxies, Tor. Makes endpoints *blind to the person*.)
3. **Interest privacy** — does anyone learn *what* is being read at all? (Essentially unsolved in production; PIR is research-stage. Endpoints remain *observant*.)

The realistic v2 posture: **verified reads over untrusted endpoints (safe-but-observant) as default, endpoint choice + relay policy as OS-level capability, and traffic-shape discipline (batching, caching, uniformity) to blunt the timing/pattern attacks that defeat everything else.**

---

## 1. What a fetch leaks (2026 reality) — SHIPPED behavior

- **IP address**: always, to every hop. This is the root identifier; everything else composes with it.
- **SNI / ECH**: TLS SNI is still cleartext for most of the web. ECH (encrypting SNI under an outer ClientHello) is enabled by default in Firefox 119+ and Chrome/Edge/Safari lines; Cloudflare enables it by default on Free zones (outer SNI becomes `cloudflare-ech.com`). But server-side adoption is thin — roughly 4.2% of top-10K and 9.2% of top-1M sites publish ECH configs (systemshardening.com survey, 2026), and ECH requires DoH-delivered HTTPS records to bootstrap. Practical takeaway: **assume the destination hostname is visible to the network path** unless you verified ECH end-to-end. Also note the censorship coupling: a single well-known outer SNI is a country-scale blocking handle.
- **DNS**: DoH is mainstream (Firefox default in US since 2020; Chrome auto-upgrades). ODoH (RFC 9230, June 2022) is *Experimental*, deployed only by Cloudflare (`odoh.cloudflare-dns.com`) with a handful of launch proxies; 50–100 ms/query overhead. Apple Private Relay uses ODoH-style padded/HPKE-encrypted DNS at scale.
- **Referrer**: browser default is now `strict-origin-when-cross-origin` — cross-origin requests leak only the origin, not the path. But an EFS client that embeds third-party fetches can still leak context via URL structure and per-app endpoints; the leak moved from headers to request *shape*.
- **Certificate revocation**: the OCSP leak is dead. Let's Encrypt removed OCSP URLs from new certs 2025-05-07 and shut its OCSP responders 2025-08-06, explicitly citing privacy ("CA learns which site which IP visits"); browsers use locally-checked compressed CRLs (Chrome CRLSets, Firefox CRLite). A good precedent: **the ecosystem killed an entire protocol because it was a read-path privacy leak.**
- **Timing/patterns**: the durable leak. Cache partitioning (all major browsers) killed cross-site cache probing, but the *server side* timing channel is wide open — see the RPC deanonymization result in §5. Request cadence, response sizes, and poll loops identify users and content even through encrypted relays.

## 2. Relay and anonymity layers — what exists today

### Oblivious HTTP — RFC 9458 (January 2024) — SHIPPED at scale
Client encapsulates a request under HPKE to a **gateway** key and sends it via a **relay**; relay sees who-but-not-what, gateway sees what-but-not-who. Designed for **transactional, stateless, cookie-free** exchanges — exactly the shape of JSON-RPC reads and CID block fetches. Production deployments (all 2023–2025):
- **Apple iCloud Private Relay** (the pre-RFC archetype, since 2021): dual-hop; Apple ingress sees IP, third-party egress (Cloudflare/Akamai/Fastly) sees destination; ODoH DNS; coarse geolocated egress IPs.
- **Cloudflare Privacy Gateway** (2022): OHTTP relay-as-a-service; the Flo period-tracking app uses it for "Anonymous Mode" — a direct precedent for "sensitive reads must not link to identity."
- **Google**: Fastly-run OHTTP relays for Safe Browsing lookups and Privacy Sandbox k-anonymity.
- **Meta/WhatsApp** (2025): "Private Processing" for AI requests via Fastly OHTTP.
- **Mozilla Firefox** (Oct 2023 →): OHTTP (Fastly relay) + DAP/Prio (Divvi Up) for telemetry.
- **Chrome IP Protection** (shipping to Stable from ~mid-2025): two-hop (Google hop + external CDN hop) proxy for third-party domains on a Masked Domain List, Incognito-only, RSA blind signatures so neither proxy links traffic to the Google account.

**Lesson:** the two-hop pattern is now boringly standard infrastructure across Apple/Google/Meta/Mozilla/Cloudflare/Fastly. What does NOT exist: any production **OHTTP-fronted Ethereum RPC or IPFS gateway**. Wiring RFC 9458 to `eth_call`/trustless-gateway fetches is an **EFS-specific assembly of shipped parts** (client OHTTP libs exist; relays are rentable).

### Privacy Pass — RFCs 9576/9577/9578 (May–June 2024) — SHIPPED
Architecture (9576), HTTP auth scheme (9577), issuance (9578: privately-verifiable VOPRF and publicly-verifiable Blind RSA). Apple shipped it as **Private Access Tokens** on ~1B devices (iOS 16/macOS Ventura, 2022): device attests to Apple (attester), Apple-blessed issuer (Cloudflare, Fastly live) issues unlinkable tokens, origins skip CAPTCHAs. The attester/issuer/origin split delivers "prove you're a real client without saying which one." **EFS relevance:** this is the standard answer to "how does a relayed/anonymous client still get rate-limited and abuse-filtered" — the missing companion to any OHTTP read path, and the pattern for paid-but-unlinkable endpoint access (Kagi already sells Privacy Pass-based anonymous search).

### Tor — SHIPPED, with censorship arms race
- Tor Browser design doc (torproject.org): the canonical lessons. **Uniformity beats configurability** — "each option that detectably alters browser behavior can be used as a fingerprinting tool"; they killed the Torbutton toggle model because per-user configuration fragments the anonymity set; privacy decisions are made **per URL-bar origin**, not via global settings; randomization rejected in favor of enforced identical values.
- Transports 2025: >300 WebTunnel bridges (HTTPS-mimicry, Tor blog 2024–2025 campaign); Snowflake (WebRTC) embedded in Tor Browser/Orbot. But April 2025 China reports: obfs4/meek/Snowflake unusable, WebTunnel connects then gets blocked within minutes. Circumvention is a treadmill, not a feature you ship once.
- A browser-delivered web OS **cannot embed Tor**; it can only be *Tor-compatible*: no fingerprinting surface, no traffic patterns that mark users, .onion endpoint support where offered (Flashbots Protect runs one).

### Mixnets — Nym — SHIPPED but niche
NymVPN launched March 2025 (2-hop WireGuard "Fast" mode; 5-hop Sphinx mixnet "Anonymous" mode with cover traffic; zk-nym unlinkable payments). Real latency costs; OS-level VPN, not embeddable in a web client. Treat as: **a thing the user may run under the client**, like Private Relay — the client's job is to not sabotage it.

## 3. Fingerprinting reality 2026

- **Chrome**: minimal anti-fingerprinting; canvas/WebGL/Audio/fonts still give stable device-unique values. Worse, Google's *ads policy* reversal (effective 2025-02-16) explicitly permits advertiser fingerprinting — ICO called it "irresponsible." Direction of travel: fingerprinting is being normalized, not fixed, in the dominant browser.
- **Firefox**: RFP/"Fingerprinting Protection" normalizes signals (timezone→UTC, spoofed screen, canvas readback blocked); default in private windows, opt-in otherwise.
- **Brave**: farbling — per-session, per-site randomization of canvas/WebGL/audio.
- **Tor Browser**: uniformity, one fingerprint for all users.
- **Implication for a web OS**: EFS client v2 is itself a "site" whose users can be fingerprinted by the endpoints it contacts (headers, TLS stack, request order) and by any app-visible API surface it exposes (locale, fonts, timezone — exactly the LocaleHandle concern in the handoff). The OS cannot rely on the browser to fix this: it must (a) minimize what apps can read (Tor-style uniform defaults, capability-gated locale detail) and (b) minimize what endpoints can distinguish (identical request shapes across users — Tor's uniformity lesson applied to the *network protocol*, not just the DOM).

## 4. Content-byte fetch privacy (IPFS / gateways / web3://)

- **The gateway sees everything**: path-style gateway fetches reveal requester IP + full CID/path + timing. The IPFS blog ("The State of Dapps on IPFS," and verified-fetch post, 2024) is blunt: *trusting a gateway without verifying is an anti-pattern* — and even with verification, "gateways still observe which CIDs users request."
- **@helia/verified-fetch (April 2024, active 2025–26)** — SHIPPED: fetch-like API, verifies blocks against CIDs from *trustless gateways*, multi-source retrieval, falls back to recursive gateways; fixes **integrity and spoofing**, explicitly does not fix **interest privacy**. Delegated routing over HTTP (`delegated-ipfs.dev`) adds another observer: the routing endpoint learns which CIDs you're looking for even before you fetch.
- **Local browser node reality**: still poor. Browsers can't dial arbitrary peers without CA-signed certs; WebTransport/WebRTC-direct are improving this but the practical browser story in 2026 remains: verified fetch from gateways + optional Service Worker gateway (ipfs/service-worker-gateway) — i.e., **you choose which observer, you don't eliminate observation**.
- **Peer2PIR (arXiv 2405.17307, 2024)** — EMERGING: private queries for IPFS routing/retrieval via PIR; research-stage, no deployment.
- **web3:// (ERC-4804 final; ERC-6860 draft)**: on-chain sites via RPC calls; a web3:// *gateway* is just another observing endpoint; auto-mode resolution leaks the same as any RPC. Same privacy calculus as everything else: the scheme decentralizes *authorship*, not *observation*.

## 5. Chain-state read privacy (the EFS-critical lane)

- **What the RPC sees**: every `eth_call`, `eth_getLogs` filter, `eth_getBalance`, `eth_getProof` — with your IP, in order, with timing. MetaMask/Infura is the canonical bad example: one connection for all accounts, address↔IP linkage at unlock, telemetry; Infura handles a large share of all Ethereum RPC traffic (PSE's "Ethereum's Privacy Stack" HackMD calls the RPC gateway "the single biggest metadata chokepoint on Ethereum today" and says **"read privacy is almost entirely unsolved"**, with PIR/TEE-ORAM explicitly research-stage; PSE has made gateway read privacy its priority).
- **Timing beats everything** — "Time Tells All" (arXiv 2508.21440, Aug 2025): a *passive* network observer correlates public-ledger confirmation timestamps with the victim's encrypted status-polling TCP timing; >95% success linking IP↔address across Ethereum/Bitcoin/Solana, zero fees. Wallet-style poll loops (`eth_blockNumber` every N seconds, `eth_getTransactionReceipt` after submit) are the attack surface. **Any EFS freshness-polling design replicates this pattern unless deliberately shaped.**
- **Helios (a16z) — SHIPPED**: v0.11.1 (Feb 2026); Rust, compiles to WASM, runs in browsers/extensions; syncs sync-committee consensus in ~2s from a recent weak-subjectivity checkpoint; verifies account state/storage/calls via `eth_getProof` merkle proofs against authenticated headers; supports mainnet + OP Stack + Linea. Limits: needs an (untrusted) RPC that serves `eth_getProof`; **cannot yet verify `eth_getLogs` responses**; historical queries depend on endpoint retention; checkpoint must be fresh (~2 weeks). A repo-side "verifiable API" companion (server returns proofs alongside responses) is in development — EMERGING, watch it.
- **Portal Network — EMERGING, slipping**: history network functional (and now load-bearing: EIP-4444 partial history expiry shipped — pre-merge bodies/receipts droppable since May 2025, EF announcement 2025-07-08), but the **state network spec is explicitly "in flux/unstable"**; not a 2026-deployable read path for EFS state.
- **Broadcast privacy — SHIPPED**: Flashbots Protect (2M+ users) and MEV-Blocker route a large share of Ethereum transactions around the public mempool; Protect minimizes logging and offers a **Tor onion endpoint**. Trust-based (operator sees plaintext tx), but removes public-mempool IP-origin gossip analysis. For EFS writes (envelope flush), submission privacy is effectively a solved *procurement* choice.
- **PIR for reads — EMERGING**: OnionPIRv2 (ePrint 2025), SmartPIR (MICRO 2025), PSE's private-state-query work. Nothing production.
- **Local endpoint trap — SHIPPED browser change**: Chrome 142 (Oct 2025) ships **Local Network Access** permission (successor to abandoned PNA): a public-origin web app fetching `http://localhost:8545` (user's own node/IPFS daemon) now triggers a permission prompt and needs `targetAddressSpace: "local"` on the fetch. Any "connect to your own node" flow must handle this or silently break.

## 6. The ranked options (key design question)

For a client that must fetch chain state + bytes, ranked by "endpoint learns what the user reads," with 2026 deployability:

| # | Option | Endpoint learns | Deployable in-browser today? | Notes |
|---|---|---|---|---|
| 1 | **Local full/light node (self-run infra)** | Nothing (only ISP sees you talk to p2p nets) | Not *in* browser; adjacent via localhost | Gold standard; LNA prompt (Chrome 142) must be handled; power-user path, make it first-class not heroic |
| 2 | **Light-client verification (Helios WASM) over any endpoint** | Everything you query, minus ability to lie | **Yes** | Fixes integrity only — "safe-but-observant"; the correct *default substrate* |
| 3 | **OHTTP-relayed endpoint (relay + gateway, non-colluding)** | What is read, not who reads | Yes with EFS-built relay/gateway wiring (no off-the-shelf RPC OHTTP exists) | Ideal for identity-free public-data reads (EFS reads carry record IDs, not user IDs); timing/shape still leaks; needs Privacy Pass for abuse control |
| 4 | **Tor / mixnet / OS relay under the client** | What is read, not who (stronger anonymity set) | Only if user runs it (Tor Browser, NymVPN, Private Relay) | Client's duty: be compatible (uniform traffic, no fingerprint, .onion endpoints) |
| 5 | **Trusted paid endpoint (contractual no-logs)** | Who + what; promises not to remember | Yes | Weakest technical story; still better than default Infura; Privacy-Pass-style unlinkable payment is the upgrade path |
| 6 | **Shared public endpoint (Infura/public gateway default)** | Who + what, logged, correlated across apps | Yes | The status quo EFS must not default to |
| 7 | **PIR / ORAM reads** | Nothing, cryptographically | **No** (research) | Track PSE/OnionPIR; design read ABI to be PIR-friendly later |

**Deployable-today pattern that minimizes "endpoint learns what the user reads":** Helios-verified reads (2) over user-chosen endpoints (1/5), with an OS-level OHTTP relay policy (3) for the identity dimension, uniform+batched+cached traffic shape to blunt timing, and Tor/VPN compatibility (4) preserved. Nothing available deployable hides *what* from the serving endpoint; you can only choose *which* endpoint observes, and unlink it from *who*.

## 7. Lessons and traps from deployed systems

1. **"Decentralized" ≠ private.** IPFS/RPC/Arweave/web3:// gateways are observers; the IPFS project itself calls unverified gateway trust an anti-pattern, and verified-fetch still leaks CIDs-requested. The handoff's "protocol trust vs endpoint privacy" split matches deployed reality exactly.
2. **OHTTP hides who, not what — and only for identity-free payloads.** Flo/Meta/Google deployments work because request bodies contain no account identifiers. One wallet address inside an `eth_call` (e.g., balance-of-me) re-identifies the user through any relay. Read paths must be audited for payload identifiers before relaying is called "private."
3. **Timing side channels defeat encrypted transports.** >95% IP↔address linkage from polling cadence alone (arXiv 2508.21440). Poll loops, per-record freshness checks, and receipt-watch loops are the EFS-shaped versions of this trap.
4. **Uniformity beats configurability** (Tor Browser design doc). Every observable per-user option fragments the anonymity set. A user-sovereign OS with content-addressed profiles is in *direct tension* with this: profile diversity must stay out of observable network behavior.
5. **Two-hop guarantees are organizational, not cryptographic.** Apple/Google deliberately contract *external* egress operators. A project that runs both relay and gateway (or lets one vendor drift into both roles) has privacy theater. Also: single well-known privacy chokepoints (`cloudflare-ech.com`, WebTunnel bridges) become censorship handles — China blocked WebTunnel within minutes in April 2025 testing.
6. **The ecosystem will kill leaky read paths — eventually, and you can too.** OCSP died (Let's Encrypt 2024-12 announcement → 2025-08 shutdown) specifically because "CA learns which site each IP visits"; replaced by *locally checked* compressed data (CRLite). The general pattern — **replace per-item network lookups with locally checkable bulk snapshots** — is the single most reusable privacy move for EFS lens/freshness reads.

## 8. EFS translation — opinionated recommendations

1. **Make "safe-but-observant" the explicit default trust class.** Kernel ships Helios (WASM) as a system service; all chain reads verify via sync-committee headers + `eth_getProof` (+ envelope signatures for record content, CIDs for bytes). UI shows two independent indicators: *data verified* (integrity) and *endpoint privacy class* (self-hosted / relayed / trusted-paid / public-observed). Never let one imply the other.
2. **Endpoint capability objects carry a privacy class + relay policy.** `RpcEndpointHandle`/`IpfsGatewayHandle` grants should record: operator, privacy class, relay wrapping (none/OHTTP pair/onion), payload-identifier audit status. OS-level relay policy = user picks relay+gateway pairs (rentable today: Fastly/Cloudflare relays); Kernel wraps *any* HTTP endpoint in OHTTP encapsulation when a pair is configured. Design all EFS read protocols to be OHTTP-clean now: stateless, no cookies, no session tokens, uniform sizes where possible.
3. **Kill per-record polling; poll one head.** Venue freshness should be derived from a single checkpoint/head fetch per venue per interval (jittered), from which STALE/LIVE grades for *all* cached records are computed locally. This directly neutralizes the Time-Tells-All pattern and is also the offline-first design. Never emit a per-record freshness request loop.
4. **Bulk-snapshot the hot indexes (the CRLite move).** Lens lists, deny sets, discovery indexes, checkpoint data: distribute as content-addressed signed snapshots (IPFS/mirrors) that clients fetch as opaque blobs and query locally. Fetching "the snapshot" leaks ~nothing; querying a live index per-record leaks the user's whole interest graph and trust graph. Treat *lens resolution traffic* as the most sensitive traffic in the system.
5. **Traffic uniformity is an OS invariant.** All apps' network I/O goes through the Kernel broker; the broker normalizes request shape (batching windows, padding/rounding of sizes where cheap, fixed poll cadences, shared connection pool) so that app identity and user configuration are not recoverable from traffic shape. Tor-compat falls out for free; test the client under Tor Browser and NymVPN as CI-level scenarios.
6. **Adopt Privacy Pass for relayed abuse-control and paid endpoints.** If EFS or partners run relays/gateways/RPCs, rate-limit with RFC 9577 tokens instead of IPs/accounts; explore Blind-RSA tokens as the "paid endpoint without a linkable subscriber ID" mechanism (Kagi precedent).
7. **First-class self-hosting, with the LNA prompt handled.** Localhost node/gateway onboarding must set `targetAddressSpace` on fetches, explain Chrome 142's Local Network Access permission, and degrade gracefully. Consider shipping a one-container "EFS home endpoint" (execution RPC with `eth_getProof` + trustless IPFS gateway + optional OHTTP gateway) as the recommended sovereign tier.
8. **Locale/fingerprint hygiene follows Tor's rule.** LocaleHandle (format-without-disclosure) is correct; extend the same rule to network-visible behavior: no per-user Accept-Language on OS fetches, bundled fonts only, identical request ordering across profiles. Any observable config toggle is a fingerprint bit — budget them.

## 9. Where EFS v2 protocol design under-supports the client

1. **Log-shaped reads are unverifiable and unprivate.** If the codex-kernel read ABI/enumeration spine requires `eth_getLogs`-style event scans, clients can neither verify them (Helios limitation, 2026) nor hide them. The kernel read ABI should guarantee every read grade is computable from **state-backed reads provable via `eth_getProof`** (or bundled receipt proofs), including PROVEN-ABSENT (absence = provable empty slot, not "no events found").
2. **Read grades create polling pressure.** Venue-qualified freshness (LIVE vs STALE) semantically demands recurrent revalidation; without a protocol-level checkpoint/head object that covers many records at once, every honest client becomes a timing beacon. The spec should define what one head fetch proves about the freshness of N cached records.
3. **First-attester-wins lens resolution leaks the trust graph.** Resolving a path across an ordered author list means querying per-author slots in order — an eavesdropping endpoint reconstructs the user's lens chain from query order alone. Needs a protocol-blessed bulk/lens-snapshot form, or a resolution algorithm that fetches over-broad author sets uniformly.
4. **Deterministic global IDs maximize query identifiability.** claimIds/record IDs are stable, global, and low-entropy-to-correlate: any endpoint can build "who reads claim X" databases forever (and records are permanent, so interest metadata compounds). This is inherent to the design — the protocol docs should state that read-path privacy is a normative client obligation, so SDK/third-party clients don't default to Infura-style leak-everything behavior.
5. **Proof-streamed large files fingerprint themselves.** The large-file upload design (chunk manifests, on-chain resumable bitmaps) yields chunk-fetch sequences whose sizes/order identify the file through any relay. Chunk-size normalization and read-side prefetch/padding guidance belongs in the bytes spec, not as a client afterthought.

---

## Sources (fetched/verified 2026-07-07)

- https://www.ietf.org/rfc/rfc9458.html — Oblivious HTTP, RFC 9458 (Jan 2024)
- https://en.wikipedia.org/wiki/Oblivious_HTTP — OHTTP deployment roundup (Cloudflare/Google/Meta/Fastly, 2022–2025)
- https://www.apple.com/privacy/docs/iCloud_Private_Relay_Overview_Dec2021.PDF — Apple Private Relay dual-hop + ODoH (Dec 2021)
- https://blog.cloudflare.com/icloud-private-relay/ — Cloudflare as Private Relay egress (2021)
- https://hacks.mozilla.org/2023/10/built-for-privacy-partnering-to-deploy-oblivious-http-and-prio-in-firefox/ — Firefox OHTTP+DAP telemetry (Oct 2023)
- https://divviup.org/blog/ohttp-now-available/ — Divvi Up OHTTP gateway
- https://github.com/GoogleChrome/ip-protection — Chrome IP Protection two-hop proxy, MDL, blind signatures (shipping from ~mid-2025)
- https://www.rfc-editor.org/info/rfc9576/ https://datatracker.ietf.org/doc/rfc9577/ https://www.rfc-editor.org/rfc/rfc9578.html — Privacy Pass architecture/auth/issuance (May–Jun 2024)
- https://blog.cloudflare.com/privacy-pass-standard/ — Cloudflare Privacy Pass implementation, Silk extension, PAT relation (Jan 2024)
- https://webdecoy.com/blog/private-access-tokens-pat-apple-captcha-killer/ — PAT deployment reality (iOS 16, ~1B devices)
- https://blog.cloudflare.com/announcing-encrypted-client-hello/ https://developers.cloudflare.com/ssl/edge-certificates/ech/ — ECH at Cloudflare, cloudflare-ech.com outer SNI
- https://chromestatus.com/feature/6196703843581952 — Chrome ECH status
- https://support.mozilla.org/en-US/kb/faq-encrypted-client-hello — Firefox ECH (default 119+, DoH required)
- https://www.systemshardening.com/articles/network/encrypted-client-hello/ — ECH adoption %, 2026 gaps
- https://developers.cloudflare.com/1.1.1.1/encryption/oblivious-dns-over-https/ https://datatracker.ietf.org/doc/rfc9230/ — ODoH (Experimental, Jun 2022), Cloudflare target
- https://letsencrypt.org/2024/12/05/ending-ocsp https://letsencrypt.org/2025/08/06/ocsp-service-has-reached-end-of-life — OCSP retirement for privacy; CRL/CRLite replacement (2024-12 → 2025-08)
- https://2019.www.torproject.org/projects/torbrowser/design/ — Tor Browser design doc: uniformity vs configurability, randomization rejected
- https://blog.torproject.org/fighting-censorship-with-webtunnel/ — WebTunnel bridge campaign (300+ bridges)
- https://forum.torproject.org/t/feedback-from-china-april-2025-increased-gfw-censorship-obfs4-meek-snowflake-unusable-webtunnel-connects-but-is-quickly-blocked/18233 — GFW status (Apr 2025)
- https://snowflake.torproject.org/ — Snowflake status
- https://nym.com/ https://en.wikipedia.org/wiki/Nym_(mixnet) — NymVPN launch (Mar 2025), 5-hop mixnet mode
- https://webdecoy.com/blog/browser-fingerprinting-2026-what-still-works/ — fingerprinting 2026: Chrome exposed, Firefox RFP, Brave farbling
- https://www.bitdefender.com/en-us/blog/hotforsecurity/your-device-fingerprint-will-go-to-advertisers-starting-february-2025 https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2024/12/our-response-to-google-s-policy-change-on-fingerprinting/ — Google ads fingerprinting policy (effective 2025-02-16) + ICO response
- https://blog.ipfs.tech/verified-fetch/ — @helia/verified-fetch (Apr 2024): verification yes, gateway still sees CIDs
- https://blog.ipfs.tech/dapps-ipfs/ — trust vs verification on IPFS
- https://github.com/ipfs/service-worker-gateway — in-browser SW gateway
- https://arxiv.org/pdf/2405.17307 — Peer2PIR: private IPFS queries (2024, research)
- https://eips.ethereum.org/EIPS/eip-6860 — web3:// URL translation (draft; ERC-4804 final)
- https://hackmd.io/@aguzmant103/Byt5GFI_Wg — "Ethereum's Privacy Stack: What Leaks, What's Fixed, What's Missing" (PSE, 2025/2026): RPC = biggest metadata chokepoint; read privacy unsolved
- https://arxiv.org/abs/2508.21440 — "Time Tells All": passive timing deanonymization of RPC users, >95% (Aug 2025)
- https://github.com/a16z/helios — Helios light client: WASM, eth_getProof verification, v0.11.1 (Feb 2026), eth_getLogs unverified
- https://a16zcrypto.com/posts/article/building-helios-ethereum-light-client/ — Helios design
- https://blog.ethereum.org/2025/07/08/partial-history-exp — EIP-4444 partial history expiry shipped (Jul 2025)
- https://ethportal.net/resources/faq https://hackmd.io/@danielrachi/ry5aR6Tqn — Portal Network status: history done, state network unstable
- https://docs.flashbots.net/flashbots-protect/overview https://writings.flashbots.net/2m-protect-users — Flashbots Protect: private submission, 2M users, minimized logging, Tor onion endpoint
- https://developer.chrome.com/blog/local-network-access https://chromestatus.com/feature/5152728072060928 — Chrome 142 Local Network Access permission (Oct 2025), targetAddressSpace, PNA replaced
