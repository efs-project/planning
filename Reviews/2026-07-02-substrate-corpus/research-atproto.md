# AT Protocol (Bluesky) Autopsy — EFS Substrate Investigation

Research agent: "atproto". Date of research: 2026-07-02. All external claims cited; primary sources (atproto.com specs/blog, web.plc.directory spec, bsky.social/docs.bsky.app posts, engineer blogs) distinguished from commentary. Staleness noted per section — this ecosystem moves fast; numbers older than ~6 months should be re-checked.

---

## 0. TL;DR for architects

AT Protocol is the largest deployed system (42M+ registered accounts) built on the exact primitive EFS is converging toward: **self-authenticating, signature-authenticated (not msg.sender-authenticated), portable signed data repositories, with identity decoupled from hosting via a rotation-key log**. It deliberately rejected blockchains and then re-invented, one by one: content addressing (CIDs), deterministic Merkle structures (MST), per-author signed monotonic logs (commits + TID rev), and — critically — **a centralized sequencer (plc.directory + relays) to fill the consensus hole**. Every place atproto has a centralization critique is precisely a place where EFS's chain substrate provides the missing piece natively. Conversely, every place atproto is *cheap and fast* is a place where EFS's on-chain writes are expensive. The two systems are duals.

The single most transferable design: **did:plc** — durable, rotatable identity where the *control plane* (1–5 prioritized rotation keys, self-certifying genesis hash, append-only per-DID operation log, 72h fork-recovery window) is separated from the *data plane* (a replaceable signing key listed in the DID doc). Its only trust gap is the ordering/anti-equivocation role of the central directory — a role a blockchain performs natively. This is a near-complete answer to EFS hard part (e).

The most important negative result: with 42M registered users, **~70k active accounts (~0.17%) live on the ~2,800 independent PDSs**, essentially nobody holds their own rotation keys, one company runs the only full AppView that matters, and spam control at scale required a paid 24/7 moderation staff processing ~10M reports/year. Self-authentication was proven to *work*; self-custody and economic decentralization were **not** proven to be *wanted*.

---

## 1. System map

Four layers, deliberately separable ("credible exit" is the design goal Bluesky itself now uses):

1. **Identity**: DID (did:plc or did:web) ↔ handle (DNS name, bidirectionally verified) → DID document lists the current atproto **signing key** and the current **PDS host URL**.
2. **Data**: each account = one **repository**: a signed Merkle Search Tree (MST) of records, hosted at the user's PDS (Personal Data Server). Repos are **current state**, not history.
3. **Distribution**: **relays** crawl all PDSs and emit a unified **firehose** of verified commit diffs; **Jetstream** offers an unsigned JSON variant; **Hubble** (2026) is a public full-network archive mirror. Since Sync v1.1 relays are non-archival and cheap ($20–34/mo).
4. **Application**: **AppViews** consume the firehose and build indexed, queryable views (the Bluesky app is one AppView); **lexicons** define schemas; **labelers** emit signed moderation annotations composed client-side.

Sources: [AT Protocol docs](https://docs.bsky.app/docs/advanced-guides/atproto), [Federation architecture](https://docs.bsky.app/docs/advanced-guides/federation-architecture), [Wikipedia AT Protocol](https://en.wikipedia.org/wiki/AT_Protocol).

---

## 2. Data layer: signed repos + MST (primary source: [repository spec](https://atproto.com/specs/repository))

### 2.1 Commit object (v3)
Fields: `did` (account), `version` (=3), `data` (CID of MST root), `rev` (TID, **must increase monotonically**), `prev` (CID, nullable — normally **null** in v3; the history chain was deliberately dropped), `sig` (raw bytes). Signing: serialize unsigned commit as deterministic DAG-CBOR ("DRISL"), SHA-256, sign with the account's **current** signing key (secp256k1 or P-256).

- **TID** ("timestamp identifier") = 64-bit value, microsecond timestamp + clock ID, base32-sortable 13-char string. It's a **per-account logical clock**, not a global one. Future-dated revs beyond a fudge factor are rejected by consumers.
- **Key rotation re-anchors the whole repo**: "a new commit is created on every signing key rotation." Because the repo is current-state-only, **only the latest root signature ever needs to verify against the current key** — atproto never needs "was this key valid at time T" logic. (This trick does NOT transfer to a permanence-first system like EFS, where historical artifacts must remain independently verifiable; see §8e.)

### 2.2 MST structure
- Deterministic, **history-independent** authenticated map: same content ⇒ same tree ⇒ same root CID, regardless of insertion order. Keys = `<collection NSID>/<record-key>` UTF-8 paths, sorted lexically.
- Fanout 4: depth of a key = floor(count of leading binary zeros of SHA-256(key) / 2).
- Node = `l` (left subtree CID, nullable) + `e` (array of entries: `p` prefix-len shared with previous key, `k` key suffix, `v` record CID, `t` right subtree CID). Prefix compression within nodes.
- Anti-DoS guidance: cap TreeEntries per node and overall depth ("key mining" can be used to construct pathological trees).
- Records are DAG-CBOR, CID-addressed; export format is CAR v1, first root = latest commit; a streamable block ordering (commit, MST root, depth-first) is being standardized in Sync 1.1.
- Limits: commit diff blocks ≤ 2 MB, single record ≤ 1 MB, ≤ 200 ops per commit; repos "intended to store up to single-digit millions of records."

### 2.3 Deletion is a first-class structural operation
"Record deletion is supported **without leaving a trace or 'tombstone'** of previous contents." Delete = remove key from MST, sign new root with higher rev. This is the exact inverse of EFS's permanence property and is *the* reason atproto can offer GDPR-compatible deletion; see §8a.

### 2.4 Verification chain
Reader verifies: handle → DID (bidirectional: DNS TXT `_atproto.<handle>` or HTTPS `/.well-known/atproto-did`, and DID doc `alsoKnownAs` pointing back) → DID doc → signing key → commit sig → MST inclusion path → record bytes (CID). This is genuine verify-don't-trust for *authenticity*; it is NOT verify-don't-trust for *completeness or recency* (nothing stops a host serving you a stale-but-validly-signed repo; only the relay/firehose ecosystem provides freshness, socially).

---

## 3. Identity: DID:PLC — the crown jewel and the crux (primary source: [did:plc spec v0.1](https://web.plc.directory/spec/v0.1/did-plc))

PLC originally stood for "Placeholder"; rebranded "Public Ledger of Credentials." ~99%+ of atproto accounts use did:plc (did:web is the alternative; it ties identity durability to a DNS name, which is why almost nobody uses it).

### 3.1 Mechanics
- **Self-certifying genesis**: `did:plc:${base32(sha256(genesisOp)).slice(0,24)}` — the identifier *is* a truncated hash of the signed genesis operation. (bnewbold concedes the 24-char truncation + lack of domain separation was suboptimal; a known weakness, not yet exploited.)
- **Operation log**: each op is DAG-CBOR (≤7,500 bytes), containing the FULL current state (rotationKeys, verificationMethods incl. atproto signing key, alsoKnownAs handles, services incl. PDS endpoint), a `prev` CID pointer to the prior op, and an ECDSA-SHA256 signature (low-S enforced) by a **rotation key**.
- **Rotation keys**: 1–5, in descending priority order, secp256k1 or P-256 only. They are the *control plane* and never appear in the DID document. The atproto *signing key* (data plane) has no authority over the identity. **Copy this separation.**
- **Recovery/fork**: within a **72-hour window**, a HIGHER-priority rotation key may fork the log from any recent op, nullifying subsequent lower-priority ops. This gives compromise recovery (e.g., a malicious PDS that rotated your keys can be overridden by your personally held, higher-priority key) — but only if the user pre-registered their own key, which in practice ~nobody does (bnewbold concedes: "most DID PLC accounts lack independently controlled rotation keys").
- **Directory trust model**: plc.directory accepts ops via unauthenticated POST, validates signatures + recovery rules, **orders** ops, and publishes a complete, permanently public audit log (`/export`, paginated; WebSocket streaming added Jan 2026). Spec's own claim: the server's "attacks are limited to denial of service ... or misordering." It cannot forge ops (self-certifying), but it IS the anti-equivocation oracle — exactly the role a chain plays.

### 3.2 Governance status (fresh as of 2026)
- **Sept 19, 2025**: Bluesky announced an **independent PLC Directory organization, a Swiss Association**, to "set policies and rate-limits, hold IP, and coordinate future evolution"; explicitly provisional ("we do not expect a single global directory to be the final technical architecture"). Board/logistics were still being finalized at announcement; funding model unspecified. ([atproto.com/blog/plc-directory-org](https://atproto.com/blog/plc-directory-org))
- Oct 2025: invalid test ops purged for spec compliance; Jan 2026: WebSocket streaming; **Feb 2026: reference implementation of a PLC *replica*** — mirrors that serve the audit log independently. ([Spring 2026 roadmap](https://atproto.com/blog/2026-spring-roadmap))
- **Late March 2026: IETF formally approved creation of an ATP working group**; in-person participation planned at IETF Vienna, July 2026. (Same roadmap.)
- Centralization critique (Christine Lemmer-Webber, Nov 2024, [dustycloud.org](https://dustycloud.org/blog/how-decentralized-is-bluesky/)): Bluesky hosts the ledger AND holds most users' rotation keys via their PDS, "so can control their identity future." Still structurally true in 2026: replicas mitigate *availability/censorship-detection*, not *write-ordering* centralization.

---

## 4. Distribution: relays, firehose economics, Jetstream, Hubble

### 4.1 The economics flipped in 2025 (Sync v1.1)
- **Pre-2025 (archival relays)**: relay kept a full mirror of every repo to validate commits. July 2024: ~1 TB; Nov 2024: ~5 TB and growing; Christine's cost critique (~$500/mo storage, trending up) was accurate *for that architecture*, and bnewbold conceded ~16 TB NVMe for the reference relay ([reply post](https://whtwnd.com/bnewbold.net/3lbvbtqrg5t2t)).
- **Sync v1.1 (2025)**: relays became **non-archival** with **inductive validation**: each `#commit` event carries `prevData` (prior MST root CID) and a CAR diff; the relay verifies the signed diff applies cleanly to the last-seen root **without storing repo contents**. Result: a full-network relay on a **$34/month VPS** (8 vCPU, 16 GB RAM, 160 GB disk; ~30 Mbps sustained; ~600 events/sec typical peak in Apr 2025, historical spike ~2,000/s; 72h default replay window ≈ low-hundreds GB) — [bnewbold, Aug 2025](https://whtwnd.com/bnewbold.net/3lo7a2a4qxg2l), [Bluesky relay-sync blog](https://docs.bsky.app/blog/relay-sync-updates). Main bsky.network relay upgraded Jan 2026; `tap`, a self-hosted reference sync consumer, shipped Dec 2025.
- **Engineering lesson (huge for EFS LOCKSS replication)**: *chain-of-state-roots + signed diffs makes verification O(traffic), not O(corpus)*. A verifier only needs the previous root hash per author to validate the next update. This is the cheapest known honest-verification topology for a "shared heap."

### 4.2 Jetstream — the confession
[Jetstream](https://jazco.dev/2024/09/24/jetstream/) (Jaz, Sept 2024; officially adopted) strips signatures and MST nodes and re-serves the firehose as plain JSON: 232 GB/day → ~41 GB/day raw, >99% cheaper with compression + collection filtering. Official framing: "Authenticated Transfer is right in the AT Protocol acronym, so this is a pretty big deal... we suspect many projects are already skipping [verification]." In practice a large share of the ecosystem consumes **unsigned** data from a trusted relay. Lesson: if verification isn't nearly free at the consumer, real ecosystems silently drop it. EFS must make the verified path the lazy path (SDK does hashing/proofs by default).

### 4.3 AppView — where the real cost hides
Relays are now cheap; **full-network AppViews are not**. Network scale ~1,000 ev/s, **18.5 billion total records**; a naive TS consumer backfilling at ~90 rec/s would take 6.5 years ([bitcrowd PoC, Mar 2026](https://bitcrowd.dev/2026/03/30/building-a-performance-evaluation-toolkit-and-a-dataplane-poc-for-atproto/)); Bluesky production runs a closed-source, hardware-optimized dataplane. Partial AppViews scale linearly with the community indexed (Statusphere-class apps run on tiny instances). Lesson: the index, not the log, is the moat; EFS's on-chain indices (resolver-maintained) are a genuinely different answer here — composability at the storage layer instead of per-app reindexing.

### 4.4 Hubble — archival as a funded social role
[Hubble](https://atproto.com/blog/introducing-hubble-a-public-mirror-for-the-whole-atmosphere) (2026): independent full-network public mirror (no blobs), run by one person (fig/microcosm.blue) on a **$20k one-year grant from Bluesky**, purposes: account recovery when a PDS dies, backfill, research. It **"fully respects content deletion"** — archival compliance is voluntary/policy, not cryptographic. The permanent-archive role EFS treats as a core property is, in atproto, an unfunded-mandate afterthought patched with a grant.

---

## 5. Lexicons (primary source: [lexicon spec](https://atproto.com/specs/lexicon))

- Schemas for records/XRPC/streams, named by **NSID** (reversed domain name + name segment, e.g. `app.bsky.feed.post`). **Authority = DNS control**: `_lexicon.<authority-domain>` TXT → DID → repo → `com.atproto.lexicon.schema` record. Resolution shipped ~2025; `lex` tooling Jan 2026.
- Evolution rules: new fields must be optional; non-optional fields can't be removed; no type changes/renames; breaking change ⇒ new NSID. Unknown fields ignored; unions open by default.
- Conflict/authority-death story is thin: fork to a new namespace, or the ecosystem socially ignores the DNS chain in a crisis. Schema *records* live in a repo (portable), but schema *authority* hangs on DNS — a rented, revocable name. EFS's EAS-style schema UIDs (content-addressed, chain-anchored) are strictly more durable; keep that. But **copy** the mandatory forward/backward-compat rules and open-union semantics — they are why 100+ independent apps interoperate on one heap without coordination.

---

## 6. Labelers / moderation (primary source: [label spec](https://atproto.com/specs/label))

- A label = signed `{src: DID, uri: subject, val: string, neg?: bool, exp?: timestamp, cts, sig}`; signed with a dedicated `#atproto_label` key from the labeler's DID doc (DAG-CBOR → SHA-256 → sign). Distribution: `subscribeLabels` WebSocket + `queryLabels`; labels need not be publicly enumerable.
- **Retraction = negation record** (`neg: true`, same src/subject/val, later timestamp) — "does not mean the inverse is true, only that the previous label has been retracted." First-class *retraction-by-later-statement* in a signed system, without deleting anything. Directly reusable for EFS lens/claim semantics.
- **Stackable moderation**: clients pick which labeler DIDs to trust via `atproto-accept-labelers` header; AppViews hydrate labels from multiple sources; `!takedown`/`!suspend` with `redact` remove content at the service level. This is architecturally the same move as **EFS lenses (ordered trusted-attester lists)** — independent convergent evolution; validating for the lens design.
- Reality at scale ([2025 transparency report](https://bsky.social/about/blog/01-29-2026-transparency-report-2025)): 24/7 paid moderation, **9.97M user reports reviewed, 16.49M labels applied, 2.45M pieces removed, 14,659 permanent removals for ban evasion** in 2025. The composable-labeler marketplace exists (~dozens–100+ community labelers) but the dominant AppView's central moderation does the heavy lifting.

---

## 7. Account portability in practice — has anyone actually migrated?

**Yes, at four levels of realism:**

1. **Cooperative migration is a supported product path**: `goat account migrate` (official CLI): create deactivated account on new PDS under same DID → export/import repo CAR → migrate blobs + preferences → PLC operation (signed with a rotation key, typically via a `plc-token` emailed by the old PDS) updating signing key + PDS endpoint → activate new, deactivate old. Documented first-person walkthroughs: [bnewbold](https://whtwnd.com/bnewbold.net/3l5ii332pf32u), [benharri](https://benharri.org/bluesky-pds-migration-notes/), [fry69's guide](https://github.com/fry69/bluesky-migration-guide), [official ACCOUNT_MIGRATION.md](https://github.com/bluesky-social/pds/blob/main/ACCOUNT_MIGRATION.md) — which warns: "potentially destructive... you could be permanently locked out, and Bluesky will not be able to help you." Reported snags: blob import flakiness, handle re-verification; generally succeeds.
2. **Adversarial migration (old PDS dead or hostile) works IF pre-provisioned** ([David Buchanan](https://www.da.vidbuchanan.co.uk/blog/adversarial-pds-migration.html)): requires (a) a personally held rotation key **enrolled in advance at higher priority than the PDS's**, and (b) your own repo/blob backups (or a mirror like Hubble). Three PLC ops: enroll temp signing key, repoint PDS, strip old PDS's rotation keys. 72h window protects against a malicious PDS stripping *your* key — if you notice in time. Without pre-provisioning: identity recoverable only if the PDS cooperates; data only if backed up.
3. **Whole-stack exit exists**: **Blacksky** (Rudy Fraser, rsky in Rust) runs independent PDS + relay + AppView infra, subscription-funded, interoperating with the wider network; real users migrated with full continuity of posts/follows/handle ([Frank Hecker, May 2026](https://frankhecker.com/2026/05/16/from-bluesky-to-blacksky/)). Northsky, Habitat similar; **Bounce** ([A New Social](https://blog.anew.social/bounce-a-cross-protocol-migration-tool/), beta 2025) does hosted ATProto↔ActivityPub migration incl. follow graphs.
4. **The numbers** (mackuba, April 2026): **~2,800 independent PDSs, ~70k active accounts total, ~10k posting weekly (25k incl. Bridgy bridge accounts)** — against 42.3M registered / 3.68M DAU network-wide ([Bluesky 2025 transparency report](https://bsky.social/about/blog/01-29-2026-transparency-report-2025): 41.41M at end of 2025; [Backlinko 2026 stats](https://backlinko.com/bluesky-statistics)). **Portability is real and exercised by ~0.2% of users.**

Residual non-portables: DMs (fully centralized, conceded), the plc.directory write path, and the practical dependence of most handles on `.bsky.social` (Bluesky retains remapping authority — Christine's point).

---

## 8. The five EFS hard parts, as answered by atproto

### (a) Revocation/mutability without a consensus substrate
atproto's answer: **make the unit of authority "current signed state of one author," not "set of immutable statements."** Deletion = new signed MST root missing the record, tombstone-free; per-author monotonic `rev` (TID) settles which state is current *for that author*; no cross-author consensus needed. Beyond the first hop it is **policy, not cryptography**: sync spec obligates downstream services to honor deletes "within seconds or minutes"; Hubble complies voluntarily; an adversarial archive can keep everything (all data is public and signed — a scraper's dream). Nostr-style advisory deletion, but with a crucial upgrade: the author's *live repo* is authoritative current state, so honest software converges automatically.
**For EFS**: the "statements vs things" split maps exactly — immutable content (things) + a mutable, author-signed, monotonically-versioned pointer layer (statements). A chain gives EFS what atproto lacks: enforceable, timestamped, globally-ordered revocation *of the pointer layer*, while accepting that bytes-once-published are permanent. Do NOT promise deletion of content; DO promise authoritative, verifiable *current-state* resolution.

### (b) Spam/sybil without gas
Layered rate-limiting + choke points, no economic cost: (1) account-creation friction at PDS (email verification, captchas; historically invite codes); (2) per-account write rate limits at the PDS (points-per-hour/day scheme, [docs.bsky.app rate limits](https://docs.bsky.app/docs/advanced-guides/rate-limits)); (3) relay admission: PDSs must `requestCrawl`, get per-host rate limits and per-PDS account-count caps (a self-hosted PDS starts with a small quota); (4) app-layer: automated rules engines + paid 24/7 moderation + labelers (§6 numbers). **Verdict at 42M users: it works, but the load-bearing wall is a funded central moderator for the dominant app, plus identity-issuance gatekeeping at PDS hosts.** Nothing here transfers to EFS as-is *except* the observation that per-host/per-identity admission quotas at the replication layer (relay caps) are an effective sybil damper when identity issuance has any cost at all. Gas remains EFS's cleanest answer; if EFS relays gasless writes, it must recreate the PDS/relay quota structure (per-identity, per-sponsor caps).

### (c) Consensus on "what exists / what's current"
There is none, globally — and 42M users mostly don't notice. Per-author: signing key + monotonic rev. Cross-author: nothing (timestamps advisory; firehose seq numbers are per-relay). Equivocation (author/PDS signing two divergent repo states) is *detectable* downstream (`prevData` mismatch → consumer forces a `#sync` reset) but not *punishable*; relays function as de facto sequencer-observers, and "what exists" operationally means "what the big relay saw." The PLC directory plays the same sequencer role for identity ops.
**For EFS**: this is the strongest argument that EFS's chain substrate is not incidental — atproto had to *institutionalize* a sequencer (relay + directory + Swiss association) to fake one. A chain gives per-author ordering, cross-author ordering, timestamping, and equivocation-impossibility in one primitive. Keep the chain for the statement layer; copy atproto's *inductive validation* (`prevData` chains) for cheap off-chain replica verification of bucket state.

### (d) On-chain composability
atproto offers zero (no contracts read anything) — and yet hosts a thriving multi-app ecosystem (Bluesky, WhiteWind blogs, frontpage, Smoke Signal, Tangled, etc.) composing purely via **shared open data + per-app indexers + common lexicons**. Evidence that *read-composability of a common heap* is what apps actually need — but every app pays its own indexing bill (§4.3), which is exactly the cost EFS's on-chain, resolver-maintained indices amortize. atproto neither proves nor disproves the need for *contracts* as readers; it proves the need for a *canonical, cheaply-verifiable heap with schema discipline*.

### (e) Signature portability vs identity durability — THE answer to study
did:plc reconciles them: **signatures are plain ECDSA (k256/P-256), verifiable anywhere forever; durability/rotation lives in a self-certifying operation log, not in the key**. Control plane (rotation keys, prioritized, never in the DID doc) ≠ data plane (signing key, replaceable). The only consensus the log needs is *ordering + anti-equivocation* — currently a trusted directory whose worst-case power is DoS/misordering, being wrapped in a Swiss association with public audit log, replicas, and IETF standardization.
**For EFS**: anchor a did:plc-shaped rotation log **on-chain** (the directory role is a ~few-hundred-bytes-per-op ordering service — trivially a contract; EFS gets equivocation-proofness and timestamping for free, plus *key-validity-at-time* queries that atproto can't do and doesn't need because it re-signs current state on every rotation — EFS, being permanence-first, DOES need validity-at-time, and a chain-anchored log provides exactly that). This also collapses the ERC-1271 problem: verify raw ECDSA against the identity log's signing-key-at-time instead of calling a chain-bound contract; the smart account (B′) can still *be* the identity whose log lives on-chain. And it wins the stated prize: a kernel that recovers the author from signature + identity-log lookup gets gasless relaying for free — atproto PDSs are precisely "relayers" in this sense (the PDS submits; the signature authenticates).

---

## 9. What 40M+ users proved vs did not prove

**Proven:**
- Self-authenticating signed repos work at consumer scale and consumer UX; users never see keys or hashes.
- Identity/hosting separation with real, exercised migration (incl. a full parallel stack, Blacksky) — "credible exit" is mechanically real.
- Signature-authentication (not msg.sender / not host-authentication) is compatible with mainstream product quality.
- Verification can be made nearly free at the replication layer (inductive validation; $34/mo full-network relay).
- Deterministic authenticated maps (MST) as canonical repo format: no consensus needed for *format* convergence.
- Stackable, signed, retractable moderation labels compose across independent parties (validates EFS lenses).
- Schema evolution discipline (lexicons) lets 100+ uncoordinated apps share one heap.

**Not proven / disproven:**
- User demand for self-custody: ~0.2% on independent PDSs; ~nobody holds rotation keys. Defaults rule everything.
- Decentralized *indexing* economics: one closed-source dataplane serves the network; independent full AppViews remain heroic (18.5B records).
- Decentralized identity root: one write-path directory (now with replicas + Swiss association — governance mitigation, not architectural).
- Spam control without a funded central moderator.
- Deletion against adversaries: compliance is voluntary; public+signed data is maximally scrapeable.
- Any form of cross-author consistency/ordering.
- Long-term archival: relays went non-archival; the archive is one grant-funded mirror (Hubble) that honors deletion — i.e., **nobody in atproto is doing what EFS's 100-year property requires**. The niche is empty, not contested.

---

## 10. COPY / AVOID for EFS

**COPY:**
1. **did:plc's control/data-plane split** — prioritized rotation keys (control) never in the doc; replaceable signing key (data); self-certifying genesis (DID = hash of genesis op); append-only per-identity op log — but anchor the log on-chain, replacing the trusted directory and gaining validity-at-time + equivocation-proofness. Include a 72h-style recovery-priority window; it demonstrably enables adversarial escape from a hostile host.
2. **Inductive validation** (`prevData` chain-of-state-roots + signed diffs): verify replicated buckets in O(traffic) without storing the corpus. Directly applicable to LOCKSS replication and light verifiers.
3. **Deterministic, history-independent authenticated map** (MST-style) for any per-author state root: same content ⇒ same root; enables diffs, partial proofs, canonical replication. (Also adopt its anti-DoS caps: node width, depth, record/commit size limits.)
4. **Per-author monotonic rev (TID)** as the "which statement is current" tiebreaker for the mutable pointer layer — no global consensus needed for per-author currency; the chain then adds cross-author ordering on top.
5. **Retraction-by-negation** (labels' `neg` + later timestamp) — revoke claims by signed counter-statement, never by erasing; fits immutable substrates perfectly.
6. **Lexicon evolution rules** (new fields optional; never remove/retype; breaking ⇒ new name; open unions; ignore unknown fields) for EFS schemas — this is what makes an uncoordinated multi-app heap survivable.
7. **Stackable trust selection** — atproto's client-chosen labeler lists independently reinvented EFS lenses (ordered trusted-attester sets, service-side hydration). Keep lenses; study `atproto-accept-labelers` for the API shape.
8. **Signature-authenticated writes with host-as-relayer** (PDS model): author signs, host submits — the exact kernel shape that gives EFS gasless relaying while lenses stay keyed on the true author.
9. **"Credible exit" as an explicit, testable property** — publish the adversarial-migration runbook on day one; atproto's is an afterthought blog post by an outside researcher.

**AVOID:**
1. **A trusted ordering service as the identity root** (plc.directory): five years in, it's still the un-decentralized organ, now requiring a Swiss association, replicas, and an IETF WG to launder trust. EFS has chains; use them for exactly this.
2. **Verification that costs more than trust** — Jetstream proves developers will strip signatures for 99% bandwidth savings the moment verification is expensive or annoying. Make the verified path the default/lazy path in the SDK.
3. **Deletion promises you can't enforce** — atproto ships tombstone-free deletion and then admits compliance is policy; adversarial archives keep everything. EFS should promise the inverse honestly: permanence of bytes, authoritative currency of pointers.
4. **Renting schema/handle authority from DNS** — lexicon authority and handles both dangle off revocable domain names; EFS's content-addressed, chain-anchored schema UIDs are strictly better; don't regress.
5. **Assuming users will hold keys** — design every property (recovery, migration, rotation) to work when ~100% of users delegated key custody to a host, with a pre-provisionable escape hatch for the ~0.2% who won't.
6. **Letting the archive role be an externality** — non-archival relays + one grant-funded mirror is atproto's answer to permanence. EFS's whole thesis is that the substrate itself is the archive; never delegate permanence to a "someone will mirror it" social layer.
7. **Underestimating the index bill** — cheap logs, expensive views: every atproto app re-pays full-network indexing. EFS's resolver-maintained on-chain indices are a real differentiator; protect them when chasing gas efficiency.
8. **Hash truncation without domain separation** (did:plc's conceded 24-char regret) — EFS's deterministic IDs should use full-width, domain-separated hashes from day one.

---

## 11. Source list & staleness

Primary (specs/blogs by protocol authors):
- Repository/MST spec: https://atproto.com/specs/repository (current, fetched 2026-07)
- Sync spec (firehose, account states, inductive validation): https://atproto.com/specs/sync (current)
- did:plc spec v0.1: https://web.plc.directory/spec/v0.1/did-plc (current)
- Label spec: https://atproto.com/specs/label (current)
- Lexicon spec: https://atproto.com/specs/lexicon (current)
- PLC directory org announcement (Swiss association): https://atproto.com/blog/plc-directory-org (2025-09-19)
- Spring 2026 roadmap (IETF WG approved Mar 2026; tap; PLC replicas; permissioned data): https://atproto.com/blog/2026-spring-roadmap
- Relay sync v1.1: https://docs.bsky.app/blog/relay-sync-updates; relay ops: https://atproto.com/blog/relay-ops
- bnewbold, "$34/month full-network relay": https://whtwnd.com/bnewbold.net/3lo7a2a4qxg2l (2025-08-27)
- bnewbold, reply on decentralization: https://whtwnd.com/bnewbold.net/3lbvbtqrg5t2t (2024-11; relay costs section superseded by sync v1.1)
- bnewbold, goat migration walkthrough: https://whtwnd.com/bnewbold.net/3l5ii332pf32u (2024)
- Official migration doc: https://github.com/bluesky-social/pds/blob/main/ACCOUNT_MIGRATION.md
- Jetstream: https://jazco.dev/2024/09/24/jetstream/ + https://docs.bsky.app/blog/jetstream (2024-09/10)
- Hubble archive mirror: https://atproto.com/blog/introducing-hubble-a-public-mirror-for-the-whole-atmosphere (2026)
- Bluesky 2025 transparency report: https://bsky.social/about/blog/01-29-2026-transparency-report-2025 (2026-01-29)
- Rate limits: https://docs.bsky.app/docs/advanced-guides/rate-limits

Commentary / third-party (treated as such):
- Christine Lemmer-Webber critique: https://dustycloud.org/blog/how-decentralized-is-bluesky/ (2024-11; relay-cost numbers now stale, structural points stand)
- David Buchanan, adversarial PDS migration: https://www.da.vidbuchanan.co.uk/blog/adversarial-pds-migration.html
- mackuba, atproto intro + PDS stats: https://mackuba.eu/2025/08/20/introduction-to-atproto/ (PDS counts as of April 2026: ~2,800 PDSs / ~70k active)
- bitcrowd AppView PoC (18.5B records, backfill math): https://bitcrowd.dev/2026/03/30/building-a-performance-evaluation-toolkit-and-a-dataplane-poc-for-atproto/
- Frank Hecker, Bluesky→Blacksky migration: https://frankhecker.com/2026/05/16/from-bluesky-to-blacksky/
- Blacksky/rsky: https://github.com/blacksky-algorithms/rsky ; Bounce: https://blog.anew.social/bounce-a-cross-protocol-migration-tool/
- Free Our Feeds: https://freeourfeeds.com/ + https://techcrunch.com/2025/01/13/free-our-feeds-campaign-aims-to-billionaire-proof-blueskys-tech/ (2025-01)
- User stats 2026: https://backlinko.com/bluesky-statistics (42.3M registered / 3.68M DAU; secondary aggregator — cross-checked against official transparency report's 41.41M EOY-2025)

Known gaps / lower confidence: exact current relay-admission quotas for new PDSs (qualitative only); count of active community labelers (order-of-magnitude); Bluesky AppView's internal infrastructure cost (closed-source dataplane, no public numbers); Swiss association's finalized board/funding (unannounced as of research date).
