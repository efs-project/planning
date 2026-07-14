# EFS v2 — Read-path privacy: who learns what you read, and the honest ladder

**Lane:** READ-PATH PRIVACY (deep privacy pass, 2026-07-11)
**Charge:** validate the P8 floor (bulk snapshots, one-head-per-venue revalidation, chunk-size normalization + padding, OHTTP-cleanliness), build the full ladder above it, adversarially check freeze-sensitivity.
**Ground truth read:** [[privacy]], [[fs-pass-freeze-reservations]], [[identity]], [[codex-kinds]], [[onchain-completeness]], [[os-pass-handoff]], [[large-file-uploads]], [[read-lens-spec]] (§0 read-ABI pin, §5 ceilings), attack-privacy.md (2026-07-10 red team).
**Date-stamp:** all market/deployment claims are as of 2026-07-11.

#kind/review #topic/privacy #topic/read-path

---

## 0. Verdict in one paragraph

Read privacy is the one place EFS's architecture is *accidentally excellent*: because records are chain-free self-authenticating envelopes and IDs are deterministic, **any untrusted channel — a snapshot torrent, a mirror, a PIR server, a friend's laptop — can serve EFS data verifiably**. Verify-don't-trust composes with every read-privacy technique instead of fighting it (the exact opposite of the write path, where the graph must stay visible). The dominant leak today is boring and non-cryptographic: **the default RPC provider sees every query plus your IP**, and any PIR discussion that skips this is theater. The honest ladder is: full local replica (leaks only participation) > scoped snapshot (leaks scope-level interest) > OHTTP/mixnet-fronted verified RPC (leaks query content but not who) > raw provider RPC (leaks everything). The size math says the full-replica endgame is *real*: EFS state growth is fee-metered at roughly **$1M–$10M of gas per terabyte of record spine**, so for any adoption level short of tens-of-millions-of-dollars-a-year of write spend, a full replica fits on a 2026 laptop and a scoped replica fits on a phone. Single-server PIR is no longer vibes — Apple ships keyword PIR to every iPhone; YPIR-class schemes process ~12 GB/s/core — and EFS's slot reads are almost the ideal PIR shape; it is a genuine post-launch upgrade path, not a launch requirement. **Adversarial freeze check result: nothing on the read path demands a new frozen row.** The read path rides two reservations that already exist on the ceremony sheet (full-body spine + no-body-elision; the spine enumeration read ABI) — both must survive — plus one REJECT-guard: no on-chain read-side state, ever.

---

## 1. The EFS read model — who is actually in the path

A "read" in EFS never touches the chain as a transaction. Reads are `eth_call`s against the kernel's frozen read ABI (`getObject`, `getSlot`, `getClaim`, `isRevoked`, `allClaims(i)`/`claimCount()`, `getValue`, `authorHead`, plus the discovery index reads) and `extcodecopy`-backed byte reads from EFSBytes, resolved through the client-side lens algorithm. Consequences, stated once:

1. **The venue learns nothing.** There is no on-chain trace of a read — no atime, no receipt, no msg.sender (an `eth_call` is not a transaction). This is already the strongest read-privacy property EFS has, and it is structural.
2. **Everything a read leaks, it leaks to intermediaries**: the RPC endpoint you query, the gateway that serves web3:// URLs, the DNS resolver that resolved either hostname, and the network path (IP, SNI, packet timing/sizes — content is TLS-protected).
3. **Query content is self-identifying even without an account.** A `getSlot` call body contains the exact keys being read: author addresses, tagIds, dataIds, occurrence keys. Reading *your own* home tree announces which author's tree is being walked. Hiding *who is asking* (transport privacy) and hiding *what is asked* (PIR / replicas) are different problems; the ladder must say which rung solves which.
4. **Deterministic IDs make point reads single-shot.** Because `tagId = keccak(domain, parent, name, kind)` and slot keys are client-derivable, a client that knows a path computes every key locally and issues non-interactive point lookups — no server-side path walk that leaks the traversal structure round-by-round. This is an EFS-specific, PIR-friendly property most systems don't have.
5. **Reads split into four shapes** with different privacy economics: (a) **slot/object point reads** (keyed, small, derivable — the hot path); (b) **enumeration reads** (postings pages, folder listings, discovery index — variable-length answers); (c) **byte fetches** (EFSBytes chunks, ~24 KB each, content-addressed); (d) **currency reads** (venue head, checkpoints, revocation reconciliation — consulted on *every* resolution, hence the highest-frequency leak surface).

---

## 2. THE DOMINANT LEAK: the RPC provider (and the doctrine)

### 2.1 What a default-provider read leaks (priced with real evidence)

Normal wallet users read through Infura/Alchemy-class providers. This is not hypothetical surveillance: ConsenSys's own November 2022 privacy-policy update confirmed Infura collects **IP address and wallet address** for MetaMask users on the default RPC, later reduced to short retention and separated storage after backlash ([The Block](https://www.theblock.co/post/189717/consensys-says-it-collects-ip-addresses-of-metamask-users-via-infura), [Decrypt](https://decrypt.co/115486/infura-collect-metamask-users-ip-ethereum-addresses-after-privacy-policy-update)) — VERIFIED (contemporaneous reporting of the policy text). Retention promises are policy, not protocol: they can change silently, and a 100-year archive should assume the adversary keeps logs forever.

What the provider sees per EFS read session, concretely:

| Signal | Content |
|---|---|
| Identity | IP address; API key (most endpoints require one — a persistent pseudonym stronger than an IP); User-Agent; TLS/HTTP fingerprint |
| Query stream | every key read: which authors' trees, which tagIds, which dataIds, which chunk stores — i.e. **your entire reading history at item granularity** |
| Timing | when you're online, per-device rhythms, cross-correlation between devices sharing an API key (James's desktop-wallet + phone-wallet user is linked *by the provider account* even if the wallets are distinct — a leak personas cannot fix) |
| Write linkage | the same provider typically relays your transactions, binding reader-identity to author-identity |

**Any read-privacy design that leaves this default in place while adding cryptography elsewhere is security theater.** This is the first thing the SDK doctrine must say.

### 2.2 The RPC-leak doctrine (proposed normative SDK text)

1. **No silent default provider.** The SDK MUST NOT hard-code a logging third-party RPC as an invisible default. First-run venue configuration is explicit: own node / light-client-verified endpoint / chosen provider — with a one-line honest label ("this provider can see everything you read and your IP").
2. **Verification and privacy are orthogonal — ship the verification half unconditionally.** Bundle a Helios-class embedded light client ([a16z/helios](https://github.com/a16z/helios) — Rust, syncs in seconds, no storage, WASM-embeddable, Ethereum + OP-stack support; VERIFIED from repo README) so every RPC answer is Merkle-verified against a consensus-verified header. This removes *integrity* trust in the provider (a lying Infura can no longer forge slot state — it can only see and stall). It does **not** hide the read set: Helios fetches exactly the keys you ask about, plus proofs, from the untrusted RPC. Say so in the docs; do not sell light clients as privacy. Caveats, honestly: L1 verification rests on the sync-committee honest-majority assumption; OP-stack venue heads are sequencer-signed pre-finality — the trust reduction is large but not zero.
3. **Separate identity from queries.** In any fronted/anonymous mode the SDK MUST strip API keys, wallet-linked headers, and provider cookies. An OHTTP-relayed request carrying an API key is theater — the key re-identifies through any relay. Keyless public endpoints or blinded-token auth (Privacy Pass architecture, RFC 9576 family — PLAUSIBLE on RFC numbers) are the only compatible auth shapes.
4. **OHTTP-front the point-read path where relays exist.** RFC 9458 (Oblivious HTTP, Jan 2024 — VERIFIED, [rfc-editor](https://www.rfc-editor.org/info/rfc9458/)) splits who-you-are from what-you-ask between a relay and a gateway: the relay sees your IP but only ciphertext; the gateway (and the RPC behind it) sees the query but not your IP/identity. This is deployed at planetary scale in 2026: Chrome Safe Browsing via Fastly's relay ([Fastly/Google](https://www.fastly.com/blog/fastly-and-google-partner-to-enhance-your-privacy-while-protecting-chrome)), Apple Private Cloud Compute via Cloudflare/Fastly relays, Meta/WhatsApp "Private Processing", Cloudflare Privacy Gateway (2022) — all search-verified 2026-07-11. (Apple's iCloud Private Relay is the *cousin* — two-hop MASQUE proxying, not OHTTP — PLAUSIBLE.) **Gap named honestly: I could not verify that any public Ethereum RPC provider offers an OHTTP endpoint today.** The SDK can still ship the client half plus a self-hostable OHTTP-gateway-to-RPC adapter (~small proxy), so any two parties can stand up a relay/gateway pair; and JSON-RPC point reads are exactly the request/response shape OHTTP was built for. Residual: relay+gateway collusion; timing correlation for a global observer; query *content* still visible to the gateway (which is fine when content isn't self-identifying, and precisely not fine for own-tree reads — that's what rungs 4–6 are for).
5. **Coalesce currency reads.** One head fetch + one checkpoint read per venue per refresh (the P8 rule) — never per-item revalidation pings. Validated below (§7).
6. **DNS is part of the path.** Gateway and RPC hostnames leak through plaintext DNS; recommend DoH, note ODoH (RFC 9230, experimental) exists — PLAUSIBLE.
7. **Transport add-ons are documented, not built:** Tor works today for keyless endpoints (some providers throttle/block exits — PLAUSIBLE, unverified per-provider); Nym is live with a shipping consumer product and ~500 mixnodes (their claim — [nym.com](https://nym.com/), FOSDEM 2026 talk; VERIFIED that it ships, their-numbers on scale); HOPR's RPCh — the one purpose-built private-RPC product — is **development-paused** (VERIFIED: the [repo](https://github.com/hoprnet/RPCh) description itself says "-development paused-"). Lesson from RPCh: a privacy transport with no sustainable funding model dies; don't make EFS's read privacy depend on one.
8. **Writes read too.** Nonce checks, gas estimation, and receipt polling traverse the same RPC and deanonymize the *author* side; the write-path lane owns that leak, but the doctrine is one doctrine — same transport rules apply.

---

## 3. The full-replica endgame — the size math from first principles

The ultimate read privacy is having everything: a query against a local replica leaks nothing to anyone. Whether that's real depends entirely on state size, so: the math.

### 3.1 The fee-metered growth bound

Every spine record costs ~22–27k gas to admit (given, kernel design). What a replica must hold is the record bodies + revocation set (slots and indexes are recomputable): typical REF-layout claim ≈ 200–400 B of body + bookkeeping; VAL-layout up to 8,192 B. I use **500 B/record average including local index overhead** (assumption, stated; VAL-heavy corpora run larger, REF-heavy smaller).

Anchor prices (order-of-magnitude, PLAUSIBLE — L2 fees fluctuate): Base-class execution gas at 0.005–0.05 gwei, ETH ≈ $4,000. Then:

- **Per record:** 25k gas → **$0.0005–$0.005**.
- **Per TB of record spine** (2×10⁹ records at 500 B): 5×10¹³ gas → **≈ $1M–$10M of cumulative gas spend**.
- **EFSBytes tier-0 bytes** (SSTORE2, ~200 gas/byte): **≈ $4–$40 per MB → $4M–$40M per TB**.

This is the deep structural fact: **EFS state cannot outgrow consumer hardware without someone burning millions of dollars a year in fees.** Storage growth is not adversary-free (spam is just gas — ruled), but it is *dollar-metered*, and the dollar meter runs far ahead of disk prices.

Throughput cross-check against real venues: Base ran at 125 Mgas/s in Nov 2025 targeting 150, with a stated 400–500 Mgas/s target for early 2026 (VERIFIED reporting: [Yahoo/CoinDesk](https://finance.yahoo.com/news/network-increases-gas-limit-125-190944252.html), [Base blog](https://blog.base.dev/scaling-base-in-2025)). If EFS consumed a full 1% of Base-at-125M forever, that's ~50 records/s ≈ 0.8 TB/year — i.e. even implausibly heavy sustained usage keeps annual growth in single-digit TB.

### 3.2 Scenario table (cumulative record-spine state, per venue, 500 B/record)

| Scenario (sustained avg write rate) | Year 1 | Year 5 | Year 20 | Implied gas spend/yr | Full replica feasible on… |
|---|---|---|---|---|---|
| **A. Niche archive** (0.03 rec/s ≈ 1M/yr — EAS/ENS-class early adoption) | 0.5 GB | 2.4 GB | 9.4 GB | ~$500–$5k | phone, trivially |
| **B. Solid success** (1 rec/s ≈ 32M/yr) | 16 GB | 79 GB | 315 GB | ~$16k–160k | laptop trivially; phone holds a scoped subset |
| **C. Breakout** (30 rec/s ≈ 1B/yr) | 0.5 TB | 2.4 TB | 9.5 TB | ~$1M–10M | laptop with big SSD → NAS by mid-life; phone scoped-only |
| **D. Gas-ceiling** (2,000 rec/s = 10% of a 500 Mgas/s venue) | 32 TB | 158 TB | 630 TB | ~$60M–600M | datacenter replicas only |

Calibration anchors: a 2026 Ethereum L1 full node fits "comfortably on a 2 TB disk" post-partial-history-expiry (VERIFIED — [EF blog, 2025-07-08](https://blog.ethereum.org/2025/07/08/partial-history-exp)); consumer 4 TB NVMe is commodity. EFSBytes tier-0 byte corpora are separately dollar-bounded ($4M–40M/TB) and dedup content-addressed across files and chains.

**Readings:** (i) For years 1–5 in every scenario short of D, **full replica on a laptop is not just feasible — it's cheap**, and it should be the flagship "cypherpunk mode." (ii) The phone's honest ceiling is a *scoped* replica (your own trees + subscribed lenses + deny/checkpoint lists — the working set is MBs-to-GBs). (iii) Scenario D means EFS is a civilizational utility burning nine figures a year in fees, at which point funding public mirrors, snapshot CDNs, and PIR farms is a rounding error — the privacy story degrades gracefully into funded infrastructure exactly when the money to fund it exists. (iv) Cross-venue: records are chain-free and dedup by claimId; the union replica ≈ largest venue + unique tails, not the sum.

### 3.3 Why replicas are trustless (the mission-fit jackpot)

A replica or snapshot needs **no trusted source**: record envelopes are self-authenticating (recovered signer = author), IDs re-derive, slots and indexes recompute from the record set, and freshness anchors against venue heads (one-head-per-venue) + the D5 checkpoint recency beacon. A hostile mirror can only *omit* or *stale-serve* — both detectable against the head/checkpoint, both graded (UNKNOWN/stale ceilings), never forgeable. This is the deepest synthesis of the lane: **verify-don't-trust is what makes read privacy cheap.** Systems that need a trusted indexer can't do private reads without trusting the indexer's logs too; EFS can pull its data through *anything*.

Two requirements this rides on (see §8 — both already on the ceremony sheet, both must survive):
- **Full-body spine + no-body-elision**: post-EIP-4444 (rolling expiry is the roadmap — VERIFIED direction), a *new* replica builder in year 30 reconstructs from **state**, or from someone's charity. Bodies-in-state is what makes permissionless late-joining replicas possible at all.
- **`allClaims(i)`/`claimCount()` spine enumeration** in the frozen read ABI (read-lens-spec §0 P8 row): the permissionless "give me everything" primitive that snapshot builders and replicas consume.

### 3.4 Scoped snapshots — extending the P8 floor

P8 made bulk snapshot distribution normative for lens/deny/index/checkpoint lists. Extend the same mechanics to *any subtree or scope*:

- **Format (convention, SDK-owned):** a snapshot = deterministic enumeration (venue spineIdx order) of all records in scope + the scope definition + venue head/checkpoint anchor + content digest. Reproducible byte-for-byte by anyone with a replica → snapshot digests are *comparable across independent publishers* (the ≥2-independent-snapshotters rule from §H already anticipates this).
- **Distribution:** any dumb channel — HTTPS mirror, torrent, IPFS. Fetching a snapshot leaks only **scope-level interest** ("someone pulled the daily /music bundle"), and popular snapshots have large anonymity sets. Optionally OHTTP/Tor-fetch the snapshot for IP privacy too.
- **Anchoring (ordinary records, post-freeze addable):** the snapshot digest can be published *as an EFS claim* under a convention key by the publisher — making snapshot integrity itself lens-graded. No new kind, no new row; the generic record model already expresses this.
- **Group reads:** a shared private folder's members subscribing to the same scope snapshot get a group-level anonymity set for free — collaboration reads (James's use case) fall out without new machinery.

---

## 4. THE LADDER (the deliverable table)

Each rung graded by the adversary it defeats — cumulative with transport add-ons. "Provider" = RPC/gateway operator; "observer" = network-level watcher; "global" = an adversary seeing both sides (NSA-class).

| Rung | What you do | Leaks remaining | Defeats | Cost (client) | Status |
|---|---|---|---|---|---|
| **0. Raw provider RPC** | default wallet behavior | everything: identity + IP + full item-level read history + timing | nothing | zero | today's default; must never be EFS's silent default |
| **1. Verified RPC (Helios-class)** | embedded light client verifies answers | same as rung 0 (this rung fixes *integrity*, not privacy) | lying providers (forged state) | seconds of sync, ~zero storage | shippable now; SDK bundle |
| **2. OHTTP/mixnet-fronted verified RPC** | rung 1 through RFC 9458 relay (or Tor/Nym), keyless/blinded auth | query *content* + timing to gateway; relay sees IP; collusion or global observer re-links | provider learning **who** reads; IP harvesting | +1 RTT; relay availability | client half shippable now; **no known public OHTTP-RPC endpoint yet** — needs a relay/gateway pair someone runs |
| **3. Scoped snapshot** | bulk-fetch lens/deny/index/checkpoint lists + subscribed subtrees; resolve locally | scope-level interest, once per sync; timing of syncs | item-level profiling entirely, for covered scopes | MBs–GBs storage; periodic sync | **the P8 floor — normative already**; extend to arbitrary scopes (convention) |
| **4. Full replica** | sync everything; all reads local | participation ("this IP replicates EFS") + sync timing | provider AND gateway AND content-based inference — everything except membership | §3.2: GBs (yr-1) to low TB (breakout yr-5); laptop-class | real and cheap for the plausible decade; the cypherpunk flagship |
| **5. Single-server PIR** | encrypted point queries against an untrusted PIR server | that you queried, when, how many times, which DB/scope; not *what* | the server learning the item — even for uncovered scopes on thin clients | ~KB–MB/query up; server compute linear in DB (§5) | credible post-launch upgrade; deployed-in-industry tech (Apple), no EFS blocker |
| **6. (orthogonal) cover traffic / batching** | scheduled syncs, padded batches, dummy queries | reduces timing/count inference at every rung | traffic-analysis sharpening | bandwidth waste | convention guidance only; effectiveness honestly modest |

**Reading the ladder honestly:** rung 3 is mandatory floor (already ruled); rung 4 is the endgame and is *cheaper than everyone assumes* (§3); rung 2 is the best available for thin clients today but depends on relays existing; rung 5 is the only rung that hides item-level reads from a server without local state, and it is real technology with real costs (§5). Nothing on the ladder — nothing — hides *that* you use EFS from a global observer; only Nym-class mixnets even attempt that, and EFS should document, not build, them.

---

## 5. Cryptographic PIR, priced with real numbers

### 5.1 State of the art, mid-2026 (PART A findings)

Single-server PIR (no non-collusion assumption — the only honest kind for EFS):

| Scheme | Class | Headline numbers | Source |
|---|---|---|---|
| **SimplePIR/DoublePIR** (USENIX Sec '23) | LWE, linear scan, client hint | ~10 GB/s/core (paper claim); measured 12.5 GB/s/core on YPIR's hardware, but needs a **724 MB client hint for a 32 GB DB** | [repo](https://github.com/ahenzinger/simplepir); YPIR paper (VERIFIED via fetch) |
| **FrodoPIR** (Brave, 2022) | LWE, stateful client | SimplePIR-adjacent lineage; basis of ChalametPIR | PLAUSIBLE (not re-verified) |
| **Spiral** (S&P '22) | RLWE/FHE, small comm | low-bandwidth, slower server; basis of Blyss | [talk](https://www.cs.utexas.edu/~dwu4/talks/Spiral0723.pdf) |
| **YPIR** (USENIX Sec '24) | LWE, **silent preprocessing — no hint** | **12.1 GB/s/core**, 2.5 MB total comm, 32 GB DB, ~83% of memory bandwidth; CT-auditing cost cut 8× vs prior PIR | [eprint 2024/270](https://eprint.iacr.org/2024/270) — VERIFIED via fetch |
| **Respire** (CCS '24) | RLWE, small records | 1M × 256 B records: **6.1 KB online communication**/query; several hundred MB/s throughput; batch mode 3.4–7.1× comm reduction | [eprint 2024/1165](https://eprint.iacr.org/2024/1165) — VERIFIED abstract |
| **ChalametPIR** (CCS '24) | **keyword PIR** = FrodoPIR + binary fuse filters | key-value lookups (no dense index needed), 6–11× cheaper than prior keyword PIR; scales to 2⁴² entries | [eprint 2024/092](https://eprint.iacr.org/2024/092), [Rust impl](https://github.com/claucece/chalamet) — VERIFIED abstracts |
| **Piano** (S&P '24) / **RotPIR** (2026) | client-preprocessing, **sublinear online** | client streams whole DB once, keeps Õ(√n) state; online queries ~√n — 10–300× faster online than linear-scan schemes; active 2026 lower-bound literature ([eprint 2026/1384](https://eprint.iacr.org/2026/1384)) | [eprint 2023/452](https://eprint.iacr.org/2023/452), [RotPIR 2026/1336](https://eprint.iacr.org/2026/1336) — VERIFIED abstracts |

**Deployment reality check:** this is production technology now. Apple ships keyword PIR (BFV homomorphic encryption, [swift-homomorphic-encryption](https://github.com/apple/swift-homomorphic-encryption)) to every iPhone for **Live Caller ID Lookup** in iOS 18+ (VERIFIED via Apple/Swift.org announcements). Google/Chrome ships OHTTP (not PIR) for Safe Browsing. Blyss commercialized Spiral (status in 2026 unverified — could not confirm alive or dead). The YPIR paper's certificate-transparency costing shows daily private CT audits are AWS-affordable — the closest published analog to "audit an append-only public log privately," which is structurally EFS's exact problem.

### 5.2 Which EFS query shapes fit PIR (with the §3 sizes)

- **Slot/object point reads — the near-ideal case.** Keys are client-derivable (deterministic IDs → single-shot, non-interactive) and the answer is small and fixed-size (slot cell: claimId + order + digest + disposition ≈ ~100–150 B). The PIR database = all slot cells (+ small interned VALs). Sizes: scenario B year-5 ≈ 200M slots ≈ 20–30 GB → **YPIR: ~2.5 core-seconds and 2.5 MB of traffic per query ≈ $0.00003 of compute at $0.04/core-hr**; ChalametPIR handles the keyword (hash-keyed, sparse) shape natively. Feasible *today* at any plausible pre-breakout size. Respire-class gets per-query communication to ~6 KB for exactly this record size if bandwidth matters more than server cores.
- **Currency reads (heads/checkpoints)** — don't PIR these; they're the same for everyone. Broadcast/snapshot them (rung 3). A per-user PIR of a global head would be pure waste.
- **Postings/enumeration reads (folder listings, discovery, backlinks)** — messier: variable-length answers. Encode as keyword-PIR over `(scopeKey, pageNo) → fixed-size page`; the server re-indexes postings into padded pages offline. Works, costs one query per page, leaks page *count* consumed unless padded. MEDIUM feasibility; snapshots are usually the better answer for anything you enumerate repeatedly.
- **EFSBytes chunk fetches** — fixed ~24 KB records, content-addressed: shape is perfect, *scale* is the problem. A 100 GB chunk corpus → ~8 core-s/chunk (YPIR-class); a 1 MB file = 43 chunks ≈ 6 core-minutes ≈ $0.01 of compute — fine for *one sensitive document*, absurd for browsing. Verdict: PIR the pointer graph, snapshot/replicate the bytes; single-chunk private fetches are the credible niche.
- **Graph browsing / lens resolution over many authors** — NOT a PIR shape (dependent multi-query walks leak structure through timing/count and multiply costs). That's what rungs 3–4 are for.

**Integrity composes (the §3.3 jackpot again):** PIR servers return records that self-verify (signatures + digests); slot-state answers verify against the client's one-head-per-venue anchor via storage proofs, or the client PIRs the *records* and recomputes the slot locally. A malicious PIR server degrades to omission/staleness — graded, never trusted. No other archive gets this for free.

**Sharding warning (freeze-adjacent honesty):** any sharding of the PIR DB (by author range, by time, by kind) makes the *shard choice* visible — the leak-unit becomes the shard. Full-DB scans or honest labels; no silent sharding.

### 5.3 Who runs the PIR server, and why (economics)

Costs, concretely: a 30 GB slot DB wants ~64 GB RAM (YPIR runs at memory bandwidth) — a $150–400/month cloud box (PLAUSIBLE pricing) sustains roughly 5–25 queries/second on 16 cores; per-query marginal cost ~$0.00003–0.0001 compute + ~2.5 MB egress. So ~**thousands of private point-reads per dollar**. Candidates:

1. **Public-good mirrors** (the same parties running snapshot mirrors — archival orgs, EF-adjacent, EFS.eth itself). Cheap enough that goodwill covers early scale.
2. **Wallet/OS vendors** subsidizing their users (Apple's model — Live Caller ID is exactly this shape, vendor-funded).
3. **Paid privacy tier** (Blyss's model; also RPCh's model — and RPCh died. Honest lesson: subscription privacy infra for crypto users has no proven market yet).
4. **No protocol-native incentive exists and none should be added** — EFS has no token and read-side incentives would be write-side state (see §8 REJECT-guard).

Privacy trust vs availability trust split cleanly: a PIR server **cannot learn or lie**, only refuse — so the failure mode of "the PIR economy collapses" is rungs 2–4 still standing. That's the right dependency direction.

**Piano-class synthesis (the elegant bit):** client-preprocessing PIR's "stream the whole DB once" IS the snapshot fetch. EFS's rung-3 bulk-snapshot machinery doubles as PIR preprocessing transport: a phone streams the 20 GB slot snapshot once (without storing it), keeps a ~√n hint (hundreds of MB), and then does *sublinear* private online queries. The ladder's rungs compose rather than compete. No protocol surface required; SDK-layer entirely.

---

## 6. Gateway / web3:// reads

- **What a gateway sees:** w3link/w3eth-class gateways (run by EthStorage — [web3url-gateway](https://github.com/ethstorage/web3url-gateway)) are ordinary HTTPS servers: they see IP, full web3:// path (names, tagIds, dataIds — for salted trees, the *blinded* IDs only), headers/Referer, timing. Their actual logging practice: **could not verify** — assume full logs. Capability fragments never reach any server (URL fragment; re-confirmed by attack-privacy V4, including the two residuals: browser history cloud-sync uploads full URLs, and a JS client-side-resolving gateway could read the fragment — both carried into guidance).
- **Normalization guidance (convention):** (i) gateways are interchangeable commodities — the served bytes verify against the author-committed chunk roots/content hashes, so *any* gateway including your own localhost one serves identical verifiable content; the SDK ships `efs gateway` as a one-liner. (ii) Client-side resolution (native web3:// handling over your own rung-1/2 RPC) removes the gateway entirely — EthStorage's own client-side-verification direction ([blog](https://blog.ethstorage.io/client-side-verification-for-on-chain-frontends/)) confirms the pattern. (iii) Hosted-gateway doctrine → James decision 4. (iv) OHTTP can front a gateway exactly as it fronts an RPC.
- **Chunk fingerprinting (validating the P8 item):** chunk-fetch sequences fingerprint files through any relay — store-id + chunk count ≈ file identity + size, even over OHTTP/Tor (the relay hides *who*, not *which store*). Chunk-size normalization (SDK-default uniform chunkSize) plus **bucketed total-size padding for private-tier files** (pad ciphertext to chunk-count buckets, e.g. powers of two — real cost: up to ~2× byte gas on small files, so private-tier-only, author-opt-out) is the honest mitigation; it defeats size-classification, NOT which-store-was-fetched. Which-store requires rung 4/5. Grade: partial, worth shipping, never oversell.

**ORAM — gateway-side note only (as chartered):** ORAM hides *access patterns* to a store you revisit, at ~O(log n) overhead per access with server state — the natural fit is a personal encrypted-cache relay (your own pinning service not learning which of your own files you re-read). It solves a hosting-operator problem, not a protocol problem; one paragraph in the ops cookbook, no EFS surface.

---

## 7. Validation of the P8 floor (each item: real or theater?)

| P8 floor item | Verdict | Notes |
|---|---|---|
| Bulk snapshot distribution (lens/deny/index/checkpoint lists) | **REAL — the single highest-value floor item.** | These lists are consulted on *every* resolution and are the most sensitive reads there are (your lens list = whose content you consume; deny-list checks = what you're about to read). Per-item fetching of them would leak continuously; bulk fetch reduces the leak to scope-level, and they're small and universally shared (big anonymity sets). Extended into rung 3/§3.4. |
| One-head-per-venue revalidation | **REAL.** | Kills the per-item freshness-ping side channel *and* is the freshness anchor that makes untrusted snapshots/PIR safe (staleness detection). Double-duty; keep normative. |
| Chunk-size normalization + padding | **PARTIAL — keep, with the §6 honesty note.** | Defeats size-fingerprinting of encrypted content; must bucket chunk **count** (total size), not just tail-pad the last chunk, or it does nothing; does not hide which store was fetched. |
| OHTTP-cleanliness | **REAL but under-specified until now.** | §2.2 rule 3/4 defines "clean": no API keys/bearer identity through relays, uniform request shapes, keyless or blinded-token auth, padded encapsulated bodies. Without the API-key rule, OHTTP is theater. |

Floor verdict: **validated — all four survive adversarial reading**, two needed sharpening (padding must bucket counts; cleanliness needed the auth rule). Nothing in the floor is freeze-sensitive; all of it is SDK/convention.

---

## 8. Freeze-sensitive reservations

**Headline: NONE NEW.** The read path is off-chain by construction, and the adversarial check below shows every capability on the ladder is either already reserved, post-freeze-addable, or deliberately rejected. Each candidate foreclosure was tested by asking: *what does actually shipping this rung in 2031 require, and is any requirement on the frozen surface?*

| # | Candidate | Class | Adversarial check → verdict |
|---|---|---|---|
| RP-1 | **Full-body spine + no-body-elision Etched invariant** (onchain-completeness §3 items 17/18 — already ⚖ on the ceremony sheet) | **ROW-class (existing — CO-SIGN, do not re-mint)** | Rung 4 (full replica) and rung 3 (snapshots) for *late joiners* require reconstructing the record set from **state** — post-EIP-4444 rolling expiry, event logs are gone (partial expiry already shipped on L1, 2025-07-08). If bodies are ever elided, permissionless replicas die for everyone who wasn't already syncing, and with them the strongest privacy rung. **Read-privacy is a second, independent load-bearing argument for Etching no-body-elision.** Nothing new to reserve; the refusal memo must list this dependency. |
| RP-2 | **Spine enumeration read ABI** (`allClaims(i)`/`claimCount()` — already in the frozen read-ABI pin, read-lens-spec §0 P8) | ROW-class (existing — confirmed sufficient) | Sufficiency test: a snapshot/replica builder needs (a) enumerate all records → `allClaims/claimCount` ✓; (b) record bodies → RP-1 ✓; (c) revocation set → `isRevoked` + G-set state ✓; (d) deterministic order for reproducible digests → venue spineIdx ✓; (e) freshness anchor → head + D5 checkpoint recency beacon (reserved) ✓. **All present; nothing missing.** |
| RP-3 | PIR-friendly index/postings layout in the kernel | **REJECT (no reservation needed — show the check)** | A PIR database is an arbitrary deterministic *re-encoding* of replicated state, built off-chain by the PIR operator (matrices, binary fuse filters, padded pages). No PIR scheme surveyed — SimplePIR/YPIR/Respire/ChalametPIR/Piano — consumes the server's *source* layout; they all preprocess. Kernel storage layout therefore cannot foreclose PIR. The only genuine PIR prerequisites are RP-1/RP-2 (rebuild the DB permissionlessly) — already held. Same check clears the B4 postings redesign: whatever shape B4 lands in (predicate word or sub-index), PIR and snapshots are indifferent; my lane takes **no position** on B4 and demands nothing from it. |
| RP-4 | Uniform chunk size / bucketed padding | **CONVENTION** | `chunkSize` is a runtime manifest field (large-file-uploads §mechanism, never hard-coded); SDK defaults + private-tier bucket guidance need no frozen surface. A 2031 PIR chunk server can even re-cell stored chunks internally — clients re-verify reassembled bytes against the per-chunk SHA-256 words (C4, minted) and `chunksRoot`. Addable forever. |
| RP-5 | Snapshot manifest / snapshot-digest anchoring records | **CONVENTION (already reserved in spirit)** | Expressible as ordinary DATA + claims under a registry convention key; "snapshot/basis records" is already a §H convention row in [[fs-pass-freeze-reservations]]. The generic five-kind model is the reservation. Post-freeze-addable trivially. |
| RP-6 | OHTTP / transport / light-client anything | **CONVENTION (SDK)** | Zero on-chain surface by definition; RFC 9458, Helios, Tor/Nym all sit outside the artifact. |
| RP-7 | **REJECT-guard: no read-side state on-chain, ever** | **REJECT (recorded so silence doesn't decide)** | Any future "read receipt," reader registration, per-reader access log, query-metering, or reader-gating row would (a) create the read-side surveillance surface this whole lane exists to avoid, (b) violate the master confluence invariant (read-side admission state), (c) break gateway/replica permissionlessness. Checked the current reserved-row set and §H conventions: **nothing proposed anywhere adds one** — this guard exists so nothing ever does. Reads must remain off-chain forever; "atime doesn't exist" is a feature to defend at the ceremony, not an accident. |

**Sufficiency conclusion:** shipping every rung of the ladder in the future requires exactly: bodies-in-state (RP-1, on the sheet), spine enumeration (RP-2, frozen already), the D5 recency beacon (reserved), C4 per-chunk SHA-256 (minted), and SDK conventions (RP-4/5/6). No new row, no new domain constant, no derivation change, no ABI addition. The read path is the rare lane that can honestly report: **the frozen surface is already sufficient; the only freeze-relevant act is *not deleting* two things other lanes already fight for, plus one standing REJECT.**

---

## 9. What remains leaked at the top of the ladder (the honesty section)

Even a full-replica user on Nym: (1) **participation** — someone at this IP replicates EFS; (2) **sync timing** — when your replica pulls; (3) **write-side linkage** — the moment you *write*, the whole write-path metadata story (other lane) applies, and your reads were never the hard part; (4) **social inference from the public graph** — read privacy does nothing about what the public graph itself says about you (chosen leakage, per the mission); (5) **query-count/timing at rung 5** — PIR hides which, never that/when/how-often. EFS remains "confidential and honestly-bounded," never "anonymous." No rung above changes the README one-liner.

---

## 10. Decisions for James

Plain English, with examples. Recommendation marked ★.

### Decision 1 — What does the SDK do by default when someone reads?

When Alice opens her EFS drive on a new laptop, the SDK needs a chain connection. Whoever provides it can see everything she looks at, plus her IP — that's how Infura/MetaMask works today.

- **(a) Default to a big provider silently** (what every wallet does). Easiest; silently donates every user's reading history.
- **(b) ★ No silent default: first-run picker + embedded light client.** Options shown: "your own node," "verified light client + a provider you pick" (answers get cryptographically checked, provider still *sees* reads — say so on the label), or a big provider with the honest one-liner. Ship Helios-class verification always-on.
- **(c) (b) + bundle an OHTTP/Tor "private transport" toggle now.** More engineering, and today there's no public OHTTP-RPC relay to point it at — the toggle would mostly be dark at launch.

★ Recommend (b) at launch, with the OHTTP client half built into the SDK so (c) lights up the day a relay pair exists. Matches "EFS working well first; privacy secondary."

### Decision 2 — Who publishes the bulk snapshots the floor already requires?

P8 already says lens/deny/index/checkpoint lists ship as bulk bundles. Someone has to actually build and publish them nightly.

- **(a) Document the format only** — anyone can publish; nobody committed. Risk: the floor stays theoretical.
- **(b) ★ EFS.eth publishes reference snapshots, digest-anchored as ordinary EFS records; anyone mirrors** (torrent/IPFS/HTTPS). Cost: a cron job + a few GB of egress; independent parties can byte-compare because snapshots are deterministic.
- **(c) Fund ≥2 independent snapshot publishers** from day one (the "two independent snapshotters" rule applied to infrastructure).

★ Recommend (b) now, (c) when there's a community to fund. Zero protocol surface either way.

### Decision 3 — PIR: build, pilot, or shelf?

Private lookups where even the server can't tell what you asked — Apple ships this to iPhones for caller ID today. For EFS it fits point reads (slots) beautifully, costs ~2.5 MB traffic and fractions of a cent per query at plausible sizes, and needs zero frozen surface (§8 RP-3).

- **(a) ★ Shelf it, on the record**: this document is the roadmap note; revisit when (trigger) the slot DB passes ~5–10 GB or a phone-first EFS client ships without local snapshots.
- **(b) Post-hackathon pilot**: YPIR/ChalametPIR over a devnet slot dump, wired to `getSlot` in the SDK behind a flag — ~weeks of work, would make EFS the first chain-archive with a working private-read mode.
- **(c) Launch-blocking integration.** Fights the hackathon scope ruling and the correct→easy→fast SDK ordering; not recommended.

★ Recommend (a) with (b) as the named next step. Nothing rots while shelved — that's what §8 establishes.

### Decision 4 — Official gateway posture

If EFS.eth runs a web3:// gateway (nice for adoption), it becomes a read-surveillance point.

- **(a) Run none** — link to third-party gateways + self-host docs. Cleanest hands; worst onboarding.
- **(b) ★ Run one with a published minimal-log policy** (no query-path retention beyond a short abuse window, no IP+path joins), interchangeability stated ("any gateway serves identical verifiable bytes — including yours: `efs gateway` is one command"), and client-side verification pushed as the real answer.
- **(c) (b) + OHTTP-front it** so even the official gateway can't see who reads what.

★ Recommend (b), adding (c) when the relay ecosystem makes it a config line. Note honestly: a log *policy* is a promise, not a protocol — the docs must say that too.

---

## Confidence

**VERIFIED (primary source read, or arithmetic reproduced here):**
- YPIR: 12.1 GB/s/core, 2.5 MB total communication, 32 GB DB, no offline hint; SimplePIR comparison incl. 724 MB hint; CT-audit 8× cost claim ([eprint 2024/270](https://eprint.iacr.org/2024/270), fetched).
- Respire: 6.1 KB online communication for 256 B records at 1M-record scale; several hundred MB/s ([eprint 2024/1165](https://eprint.iacr.org/2024/1165) abstract).
- ChalametPIR: keyword PIR via binary fuse filters over FrodoPIR; 6–11× improvement claims; 2⁴² entry scaling ([eprint 2024/092](https://eprint.iacr.org/2024/092) + crate docs).
- Piano: sublinear single-server PIR with client preprocessing, Õ(√n) amortized ([eprint 2023/452](https://eprint.iacr.org/2023/452) abstract); RotPIR and 2026 lower-bound work exist ([2026/1336](https://eprint.iacr.org/2026/1336), [2026/1384](https://eprint.iacr.org/2026/1384) — existence verified, contents not read).
- RFC 9458 Oblivious HTTP published Jan 2024; Chrome Safe Browsing uses a Fastly OHTTP relay; Cloudflare Privacy Gateway exists ([rfc-editor](https://www.rfc-editor.org/info/rfc9458/), [Fastly blog](https://www.fastly.com/blog/fastly-and-google-partner-to-enhance-your-privacy-while-protecting-chrome)).
- Apple Live Caller ID Lookup = keyword PIR over homomorphic encryption, shipped, open-sourced ([swift-homomorphic-encryption](https://github.com/apple/swift-homomorphic-encryption), Swift.org announcement).
- Helios: WASM-embeddable light client converting untrusted RPC into verified local RPC; Ethereum + OP-stack ([a16z/helios](https://github.com/a16z/helios) README).
- RPCh development paused (the [repo](https://github.com/hoprnet/RPCh)'s own description string).
- Infura/MetaMask IP + wallet-address collection, Nov 2022 policy + aftermath ([The Block](https://www.theblock.co/post/189717/consensys-says-it-collects-ip-addresses-of-metamask-users-via-infura), [Decrypt](https://decrypt.co/115486/infura-collect-metamask-users-ip-ethereum-addresses-after-privacy-policy-update)).
- Ethereum partial history expiry shipped 2025-07-08; ~300–500 GB reduction; 2 TB-disk full node ([EF blog](https://blog.ethereum.org/2025/07/08/partial-history-exp)).
- Base at 125 Mgas/s (Nov 2025), 150 target, 400–500 Mgas/s early-2026 target ([Base blog](https://blog.base.dev/scaling-base-in-2025) + reporting).
- All §3/§5 arithmetic (state-size scenarios, $/TB, PIR core-seconds) — reproduced in-session; inputs are the assumptions stated inline.
- Ground-truth EFS claims (read ABI pin, D5 beacon, C4 SHA-256 word, §H snapshot convention, chunkSize-runtime, fragment-never-sent) — read directly from the cited design docs this session.

**PLAUSIBLE (recalled or secondary-sourced; not independently verified):**
- Current L2 gas prices (0.005–0.05 gwei band) and cloud pricing ($0.04/core-hr, RAM-box rates) — fee/market levels drift; the *structure* of the $/TB bound is arithmetic, the dollar figures are ±5×.
- 500 B/record average replica footprint (stated assumption; VAL-heavy corpora larger).
- Apple PCC and Meta WhatsApp OHTTP usage (search-level corroboration only); iCloud Private Relay being MASQUE two-hop; Privacy Pass RFC numbers (9576-family); ODoH = RFC 9230.
- Nym scale ("500 nodes, 50 nations") — operator's own numbers.
- Tor-exit blocking by specific RPC providers; SimplePIR's original "10 GB/s/core" (paper recalled; YPIR-measured figure used where it matters).

**Could not verify:**
- Blyss's 2026 operating status (no shutdown or health evidence found either way).
- Any public Ethereum RPC provider offering an OHTTP endpoint (found none; absence claim, weakly held).
- w3link/w3eth gateway logging practices (assume full logging).
- Portal Network readiness for state-serving at EFS-relevant scale (specs live, clients "experimental" per ethereum.org — not load-bearing for any conclusion here).
