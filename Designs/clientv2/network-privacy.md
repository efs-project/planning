# Network privacy and endpoint capabilities
**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]], [[read-lens-spec]], [[codex-envelope]], [[codex-kernel]], [[fable-client-v2-handoff]]
**Reviewers:** —
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

> Elaborates thesis **F5** ("the broker owns every packet"). Evidence: Reviews/2026-07-07-clientv2-corpus/research/network-privacy.md and Reviews/2026-07-07-clientv2-corpus/research/web-isolation.md. Where this doc and [[web-os-thesis]] disagree, the thesis wins until amended; disagreements are declared in Open questions, not smuggled.

## What this rules

Every fetch has an observer. EFS reads carry deterministic, permanent, globally-correlatable IDs, so read-path metadata *compounds forever* — an endpoint that logs "who asked for claim X" is building a permanent interest database. This doc rules: how "no ambient network" is actually enforced; what an endpoint capability is; how the three privacy properties are kept separate and shown separately; the verified-read substrate; the OHTTP and Privacy Pass posture; the traffic-discipline invariants that keep honest clients from becoming timing beacons; endpoint onboarding without hidden vendor endpoints; and the Network Privacy Center. The realistic v2 promise, stated in the product's own words: **safe-but-observant by default, observer chosen by you, identity unlinkable where you configure it, interest privacy stated as unsolved — never faked.** [research-grounded]

### The two planes

The single most clarifying ruling in this doc:

| Plane | Traffic | Who holds the endpoint | App visibility |
|---|---|---|---|
| **Substrate plane** | chain-state reads, bytes fetches, venue head/checkpoint fetches, snapshots, outbox flush | the **Kernel**, always | apps see *grades and data*, never endpoints, never fetch timing |
| **App plane** | app-specific HTTP (`HttpOriginHandle`), inference endpoints | per-app grant via picker | app sees responses through the broker; origin knows it is being called |

Apps never learn which endpoint served a substrate read, and substrate traffic never varies per app. This is what makes the traffic-discipline invariants (§Traffic discipline) enforceable: there is exactly one network actor. [reasoned]

### The three properties, never conflated

1. **Integrity** — is the data authentic? **Solved and mandatory**: envelope signatures, contentHash/CID checks, `eth_getProof` via Helios. Unverified bytes never render (thesis promise 1).
2. **Identity privacy** — does the endpoint learn *who* reads? **Partial**: OHTTP (RFC 9458) is boring shipped infrastructure; no OHTTP-fronted RPC/IPFS gateway exists yet — wiring one is an EFS-specific assembly of shipped parts. [research-grounded]
3. **Interest privacy** — does anyone learn *what* is read at all? **Unsolved in production** (PIR is research-stage). Stated, never promised. Traffic discipline blunts it; nothing eliminates it.

Two independent UI indicators carry this, and they are never merged into one "secure" light:

- **data-verified** — a *negative-space* indicator per the honesty doctrine: verified is the unmarked default (verification is mandatory for render); the loud states are `UNVERIFIED-LANE` (indexer/discovery-derived, per [[read-lens-spec]] DISCOVERY flag) and `VERIFY-FAILED` (never rendered as content). No green checkmark, ever. [reasoned — resolves a tension inside the thesis; see Open questions]
- **endpoint-privacy-class** — a neutral factual chip on every surface that discloses an endpoint: `self-hosted / relayed / trusted-paid / public-observed`, with one-line copy stating exactly who sees what (schema below). Verification does not remove observation; the chip says so.

## Enforcement: the cage, the broker, the register

### Zero network in Ring 3 [research-grounded]

Per F1, app code runs in SES compartments inside dedicated Workers spawned from `blob:` URLs, inheriting the page CSP (`connect-src 'none'` baseline). Three independent layers deny egress: no network endowment in the compartment; the Worker boundary (no DOM, no `RTCPeerConnection`, no navigation, no `window.open`, no prefetch/speculation APIs); CSP `connect-src 'none'` covering the entire scriptable egress set (`fetch`/`fetchLater`, XHR, WebSocket, EventSource, `sendBeacon`, WebTransport, `importScripts`, nested workers). The only outward channel is `postMessage` to the Kernel. This is the only configuration the research found that can be made airtight for scripted egress (web-isolation digest, enforcement table).

### The Kernel broker is the sole egress

All real `fetch` happens in Kernel-owned code. Enforcement is layered, primary first:

1. **Broker policy (primary, dynamic):** every request is matched against the capability table — principal, endpoint grant, budget, batching window — before any socket opens. Denials are logged as denial receipts in the journal (auditable in the Privacy Center; "deny facts" stays reserved for advisory deny TAGs per [[read-lens-spec]] §3.4).
2. **Declarative backstop — the egress document [reasoned]:** document CSP is immutable after load, so "granted endpoint = narrower CSP" cannot be expressed by editing the page policy. Mechanism: the broker executes fetches inside a dedicated sandboxed egress iframe whose `srcdoc` carries a `<meta http-equiv="Content-Security-Policy">` with `connect-src` = the exact union of currently granted endpoint origins; on any grant-table change the egress document is torn down and rebuilt. If this proves brittle (blob/srcdoc semantics keep shifting — pin with tests), the backstop degrades to a page-level `connect-src` union refreshed at boot; broker policy remains the boundary either way.
3. **No credentials by default:** the egress lane sends no cookies, no `Authorization` unless the grant carries an explicit secret (trusted-paid); Privacy Pass tokens are preferred over API keys (§Privacy Pass).

### The residual-channel register [research-grounded]

Published in user-facing docs verbatim — accepted residuals are *stated*, not hidden:

| Channel | Status | How |
|---|---|---|
| fetch / XHR / WS / SSE / sendBeacon / WebTransport | **closed** | no endowment + `connect-src 'none'` |
| WebRTC (`RTCPeerConnection` → STUN/TURN) | **closed structurally** | does not exist in Workers; the `webrtc` CSP directive is not relied on (Chromium-partial) |
| top-level navigation, `window.open`, `<form>` | **closed structurally** | no DOM/window in Workers |
| DNS prefetch, speculation rules / prerender | **closed structurally** | no DOM; these bypass CSP in DOM contexts — decisive for the Worker choice |
| `importScripts` / nested Workers | **closed** | `script-src`/`worker-src` `blob:` only + SES module map |
| render-service (document lane) subresources | **closed by policy** | sandboxed iframe, `default-src 'none'`, per [[web-os-thesis]] F1; documents needing remote subresources fail visibly |
| postMessage volume/timing between colluding apps | **ACCEPTED** | covert channel; broker meters rates; no promise made |
| timing/shape of *granted* traffic | **ACCEPTED, mitigated** | traffic-discipline invariants below; a granted endpoint can be abused within its allowlist — that is a policy problem, stated |
| Spectre-class cross-origin leaks | **mitigated** | COOP `same-origin` + COEP `require-corp` (Safari floor) |
| user-action-correlated pulls (install-time MUST-pull, first fetch after wake) | **ACCEPTED** | inherent; batched into the next head window when currency horizons allow |

## Endpoint capability schema

Endpoint descriptors are content-addressed records; grants are rows in the capability table (F8): severable, attenuated, receipted, snapshot with the generation.

```ts
type PrivacyClass = 'self-hosted' | 'relayed' | 'trusted-paid' | 'public-observed';

interface EndpointDescriptor {                  // content-addressed; publishable on EFS
  endpointId: CID;
  kind: 'rpc' | 'ipfs-gateway' | 'arweave-gateway' | 'mirror' | 'http-origin'
      | 'ohttp-relay' | 'ohttp-gateway' | 'inference';
  origin: string;                               // exact https:// origin, or http://localhost:*
  operator: { name: string; identityWord?: bytes32 };  // petname-resolved for display
  class: PrivacyClass;                          // Kernel-validated, not operator-asserted (rules below)
  relay: { mode: 'none' | 'ohttp-pair' | 'onion'; relayEndpointId?: CID };
  payloadAudit: 'identifier-free' | 'carries-identity' | 'unaudited';   // §OHTTP
  proofSupport: { ethGetProof: boolean; trustlessGateway: boolean };
  abuseControl: 'none' | 'privacy-pass' | 'api-key';   // api-key caps class at trusted-paid
}

interface EndpointGrant {
  descriptor: EndpointDescriptor;
  principal: PrincipalId;                       // app instance | agent session | system service
  scope: 'exact-origin' | 'wildcard';           // wildcard: see below
  budget?: { requestsPerMin: number; bytesPerDay: number };
  expiresAt?: number;                           // wildcard grants MUST carry one
  pausedAfterIdleDays: number;                  // default 60; restore re-evaluates policy (F8)
  receiptId: LocalReceiptId;                    // local-first receipt; publishing = explicit write
}
```

**Class validation rules (Kernel-enforced, not operator-asserted):** `self-hosted` requires a local/LAN address space; `relayed` requires `relay.mode ≠ 'none'` **and** the relay and gateway operators to be distinct identity words — same operator on both hops degrades the displayed class to `public-observed` with the reason shown ("relay and destination are run by the same operator"). Two-hop guarantees are organizational, not cryptographic; the UI says so in the class detail. `trusted-paid` requires a disclosed operator identity; the copy is honest: "sees who and what; their contract says they don't keep it." Anything else is `public-observed`: "sees who you are and what you read, and may log it." [research-grounded]

**Class chips, exact copy:** `self-hosted — only your network provider sees traffic` · `relayed — <relay op> sees who; <gateway op> sees what; neither sees both` · `trusted-paid — <op> sees who and what; no-logs by contract, not by math` · `public-observed — <op> sees who and what, and may keep it`.

**Wildcard = major warning + receipt.** `scope: 'wildcard'` (any-origin HTTP for one app) is grantable only through a System Chrome ceremony with interaction gating (activation delay, deny focused by default): *"Allow <App> to contact any server? Anything this app can see, it can send anywhere on the internet. Most apps never need this."* Defaults: `expiresAt = now + 7 days`, never silently renewed; every use journaled; the grant appears permanently in the Wildcard audit (§Privacy Center) with its receipt. Agent sessions can never hold wildcard (lethal-trifecta invariant, F9). [reasoned on the 7-day constant]

## Verified reads: the default substrate [research-grounded]

- **Helios (WASM) is a Kernel system service.** Sync-committee consensus sync (~2s from a fresh checkpoint, ≤2-week weak-subjectivity window — checkpoint rides the closure manifest and is refreshed with generations); every chain-state read is an `eth_getProof`-verified point read against authenticated headers. The RPC endpoint is *untrusted for integrity by construction* — endpoint choice becomes purely a privacy/availability decision, which is exactly what the class chip expresses.
- **Bytes verify against contentHash/CID** (envelope signature + hash check in the Kernel; @helia/verified-fetch pattern for IPFS). **Gateways are dumb pipes**: capability-chosen, class-labeled, never trusted. Trustless-gateway support (`proofSupport.trustlessGateway`) is preferred at pick time.
- **No `eth_getLogs` on the client read path.** Helios cannot verify log responses (v0.11.x); log-shaped reads are both unverifiable and maximally observable. The client computes all read grades from state-backed point reads and checkpoint claims per [[read-lens-spec]] P7/P8. Where the protocol spine would force event scans, that is a protocol gap, filed (§Open questions → efsv2 pressure).
- **Fallback ladder when proofs are unavailable** (endpoint lacks `eth_getProof`, historical state pruned): the read degrades to the indexer lane and is **flagged `UNVERIFIED-LANE`** — consumable by INTERACTIVE surfaces with the label, never by GATE consumers ([[read-lens-spec]] §3.3). No silent fallthrough from verified to trusted.

## OHTTP posture [research-grounded]

RFC 9458 relaying is designed for exactly the shape of EFS substrate reads: transactional, stateless, cookie-free, identifier-free (EFS reads carry record IDs, not user IDs). Rulings:

1. **All EFS read protocols are designed OHTTP-clean now**, whether or not a relay is configured: stateless, no cookies/session tokens, no client identifiers in payloads, uniform request shapes and (where cheap) response size classes. This is an SDK-level conformance rule, not a client nicety — it keeps the relay option real.
2. **Payload-identifier audit is a first-class descriptor field.** OHTTP hides *who*, not *what* — one wallet address inside an `eth_call` re-identifies the user through any relay. The Kernel refuses to label traffic "relayed" unless the request template is `payloadAudit: 'identifier-free'`. Balance-of-me-style reads route direct (or self-hosted) and say so.
3. **The non-colluding pair is user-configurable.** Privacy Center lets the user pick a relay descriptor + gateway descriptor; the Kernel HPKE-encapsulates any substrate read to a configured pair. Distinct-operator rule enforced (§schema). Relays are rentable today (Fastly/Cloudflare precedents: Apple Private Relay, Flo, Chrome IP Protection).
4. **No OHTTP-fronted RPC or IPFS gateway exists in production.** Shipping one (an OHTTP gateway in front of a getProof-capable RPC + trustless gateway) is an **EFS-specific assembly opportunity** — all parts are shipped; only the wiring is novel. Candidate first workload: venue-head fetches and snapshot fetches, the two highest-volume identifier-free reads. [reasoned on sequencing]
5. **Tor/mixnet/VPN compatibility, not embedding.** The client cannot ship Tor; it must not sabotage it: uniform traffic, no fingerprint surface, `.onion` endpoint descriptors supported where offered (Flashbots Protect precedent for outbox flush). CI runs the client under Tor Browser and NymVPN as scenario tests.

## Privacy Pass [research-grounded]

Abuse control for relayed and paid endpoints must not re-link identity. Adopt RFC 9576/9577/9578:

- EFS-operated (or partner) relays/gateways/RPCs rate-limit with **RFC 9577 token challenges**, not IPs or accounts.
- **Blind-RSA (publicly verifiable) tokens** are the paid-endpoint mechanism: buy a token batch linked to payment once; spend tokens unlinkably (Kagi precedent). This upgrades `trusted-paid` from "no-logs by contract" toward "cannot correlate requests to subscriber," and the class detail copy reflects which variant an endpoint runs.
- The Kernel holds and spends tokens; apps never see them. Token top-up is a System Chrome flow with a receipt.

## Traffic discipline invariants (NP1–NP8)

Normative for the broker; conformance-testable; violations are bugs, not tuning choices. The enemy is the >95% passive timing deanonymization result and the Tor uniformity lesson. [research-grounded]

- **NP1 — One head per venue.** Venue freshness for **all** cached records derives from a single jittered head/checkpoint fetch per venue per interval (defaults: 30s foreground on the active venue, 5min background, ±20% jitter). STALE/LIVE and currency qualifiers are computed locally from that head. **Per-record freshness polling is forbidden** — apps cannot emit it (no network), and the SDK exposes freshness only as Kernel-derived grades.
- **NP2 — Bulk snapshots for hot indexes (the OCSP→CRLite move).** Lens lists, deny sets, discovery indexes, checkpoint sets, freshness-beacon sets, and the default endpoint-set distribute as content-addressed **signed snapshots** fetched as opaque blobs and queried locally. Fetching "the snapshot" leaks ~nothing; querying a live index per-record leaks the user's interest and trust graphs. **Lens-resolution traffic is the most sensitive traffic in the system** — resolution walks run against local snapshot state, never as ordered per-author network queries.
- **NP3 — Batching windows and shared pool.** Broker coalesces substrate requests into windows (defaults: 500ms interactive, 5s background), one shared connection pool, fixed cadences. Individual user gestures do not map 1:1 to packets.
- **NP4 — Normalized request shape.** No per-user headers: `Accept-Language` stripped from all OS fetches (locale never rides the wire — [[web-os-thesis]] F10), no per-app UA decoration, identical request ordering across profiles, size-class rounding where cheap. Padding beyond that is best-effort and **never presented as a privacy feature**.
- **NP5 — Profile diversity stays off the wire.** User-sovereign profiles (lenses, workspaces, generations) are in direct tension with anonymity-set uniformity; the resolution is that *no observable network behavior varies with profile configuration*. Any config knob that would alter traffic shape is either removed or made non-observable. Every observable option is a fingerprint bit; budget them at review time.
- **NP6 — Receipt/watch loops are shaped.** Post-submit watching (outbox flush, `partially_admitted` tracking) rides the NP1 head cadence, never a dedicated tight poll — wallet-style poll loops are the canonical deanonymization surface.
- **NP7 — Chunk normalization for large files.** Chunk fetch/upload sequences fingerprint files through any relay; the broker fetches in normalized sizes/order with limited prefetch. Real fix belongs in [[large-file-uploads]] (pressure item).
- **NP8 — No telemetry, no phone-home, ever.** Endpoint health metrics (latency, failure rate, last-OK) are computed and stored locally only. There is nothing to disclose because nothing leaves.

## Endpoint onboarding UX

**Zero baked-in vendor endpoints.** The client binary/closure contains no hard-coded operational endpoint. Extending [[read-lens-spec]] LC6 from lenses to endpoints: the shipped default is a **published-on-EFS endpoint-set record** (a LIST of `EndpointDescriptor`s signed by a named curator), whose *content is pinned inside the closure manifest* — so first boot has an inspectable, diffable default without a bootstrap fetch, and generation updates diff endpoint changes like any other capability change (F4 install review). Disclosed, subscribable, forkable, ejectable in one interaction (LC2/LC3 semantics). [reasoned — extends LC6 beyond its letter; flagged below]

First-run flow (System Chrome, before any packet leaves):

1. **"Choose how EFS reaches the network."** Three tiers, honestly labeled with class chips: **Published set** (default; shows curator, operators, classes — "You can change or remove any of these later"); **Self-hosted** (localhost detection + guided setup); **Manual** (enter origins; class computed, not chosen).
2. **First network use requires the ack.** Zero-power install extends to zero-network boot: until the user confirms an endpoint tier, the OS runs fully local and every read grades UNKNOWN with the "no transport granted" qualifier — never rendered as absence (honesty doctrine addition 1).

**Self-hosting is first-class, not heroic:**

- **Chrome 142 Local Network Access:** all localhost/LAN fetches set `targetAddressSpace: 'local'` and the flow pre-explains the browser prompt: *"Your browser will ask permission to reach devices on your network. This is your own node — allow to continue."* Feature-detected; Safari/Firefox paths degrade gracefully. Failure states are explicit ("blocked by browser permission" ≠ "node down").
- **The `efs-home` container [reasoned]:** one published container image = getProof-capable execution RPC + trustless IPFS gateway + optional OHTTP gateway, with a printed one-liner and a QR pairing flow. This is the recommended sovereign tier and the answer to "self-hosted for people who won't run three daemons." Ships post-launch if capacity demands; the descriptor format above already models it.

## The Network Privacy Center (System Chrome surface)

One surface owns network truth; per F13, endpoints are otherwise invisible until they change an answer.

| Panel | Contents |
|---|---|
| **Endpoints** | active descriptors with class chips, operator petnames, relay pairing, payloadAudit status, proof support; eject/replace per LC3 |
| **Per-app grants** | every `EndpointGrant` by principal: scope, budget, expiry, last use, pause/revoke; restore re-evaluates policy |
| **Recent use** | journaled broker activity by endpoint and principal (local only), including denial receipts ("blocked: no grant") |
| **Endpoint health** | locally computed latency/failure/last-OK; degraded endpoints suggest failover *within the same or better privacy class* — never silently downgrade class for availability |
| **Wildcard audit** | permanent list of all wildcard grants ever made: app, dates, receipt, use count; badge count surfaces on the Center's icon while any wildcard grant is live |
| **Relay setup** | OHTTP pair picker, distinct-operator check result, Privacy Pass token balances |

Every grant/deny/change/wildcard event yields a local-first receipt; publishing a receipt to EFS is an explicit previewed write, never automatic.

## What deep links and OS profiles may NOT do

**Endpoints enter the capability table through exactly two doors: the endpoint picker, and install/update review.** [reasoned]

- A deep link (F12) may *reference* an endpoint-set record or preselect a picker entry; it may never confirm one. Opening a link never mutates the endpoint table.
- An imported OS profile / closure / generation that carries endpoint descriptors triggers the same System Chrome diff review as a capability-broadening app update (F4): additions prompt, removals may auto-apply (fail-safe asymmetry, pin-and-diff).
- App updates that add endpoints run under old grants or block until the diff is approved (Chrome disable-until-approved precedent, F4).
- Fragment-carried capabilities never include endpoint grants; nothing endpoint-shaped rides the query string (unfurl bots fetch pasted links).

### Agent lens

Agents are the fourth principal behind the same broker; nothing here has an agent side-door. Specifics: an inference provider is an ordinary `EndpointDescriptor` (`kind: 'inference'`) with a class chip — users see that their "private" assistant is `public-observed` if it is. The **lethal trifecta** is evaluated against the endpoint table: an agent session holding private-data reads plus untrusted-content ingestion cannot also hold app-plane endpoint grants without break-glass chrome; wildcard is never grantable to agents. Agent substrate reads ride the same NP1–NP4 shapes — agent cadence must not be distinguishable from human cadence on the wire, or agents become a traffic fingerprint. Plans declare endpoint use per step; receipts record actual endpoint + class per step, so "which operator saw this run" is answerable after the fact. Agents may propose an endpoint (surfaced as a picker preselection) but never introduce one — same two doors as deep links.

### Honesty obligations

- **"Not permitted to look" ≠ "not found":** reads with no transport grant render UNKNOWN with an explicit no-transport qualifier, never absence, never PROVEN-ABSENT. (Vocabulary gap filed — the read-grade set is closed and lacks this qualifier.)
- **Verification never implies privacy; privacy class never implies integrity.** Two indicators, never merged; "relayed" copy explicitly says the gateway still sees what is read.
- **Interest privacy is stated as unsolved** in user-facing docs, with the residual-channel register published verbatim. No "anonymous mode" naming anywhere; the strongest honest phrase is "unlinked from your identity at this endpoint."
- **GATE consumers** (installers, auto-update, agents) obey [[read-lens-spec]] §3.3 mechanically: UNVERIFIED-LANE, UNKNOWN-CURRENCY, and no-transport states are never GATE-consumable; safety-class MUST-pull failures degrade to fail-closed-or-warn, and the resulting punctual fetch is an accepted, stated residual.
- **Class chips are facts, not endorsements**; degraded class (colluding relay pair) is always displayed with its reason.

## Open questions

- [x] **Thesis refinement (conflict, declared):** F5/web-isolation phrase "granted endpoint = narrower CSP" is not directly implementable post-load (document CSP is immutable); this doc substitutes the rebuildable egress-document mechanism with broker policy as the primary boundary. Needs a thesis amendment line or acceptance of the refinement. — resolved by [[web-os-thesis]] Amendment 8 (2026-07-07)
- [x] **Indicator design (tension inside the thesis):** F5's "data-verified indicator" vs the no-positive-trust-chrome doctrine. Ruled here as negative-space (warn on UNVERIFIED-LANE/VERIFY-FAILED only). Confirm at secure-ui review. — resolved by [[web-os-thesis]] Amendment 9 (2026-07-07)
- [ ] LC6 extension: does the read-lens-spec's "no default relayer endpoint" rule formally cover *endpoint sets pinned in closure manifests*, or does LC6 need an amendment naming them?
- [ ] Wildcard constants: 7-day expiry, 60-day idle pause — pick with UX data or accept as launch defaults.
- [ ] Who operates the first OHTTP relay+gateway pair and the launch endpoint-set curation (k-of-n with F4 curators?); EFS running both hops is privacy theater and is ruled out — but the launch pairing needs named operators.
- [ ] `efs-home` container: launch-blocking or fast-follow? Which execution client satisfies getProof at acceptable footprint?
- [ ] Response-size classes for NP4: define the rounding table per request family, or drop rounding entirely rather than half-promise.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Depends-on chain checked against current [[web-os-thesis]] and [[read-lens-spec]] revisions
- [ ] No AGENT-Q comments remain in the text
- [ ] At least one round of `#status/review` with another agent or human comment
