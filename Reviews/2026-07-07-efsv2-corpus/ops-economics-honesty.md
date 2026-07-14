# EFS v2 — Operations & economics honesty doctrine

**Role:** Operations/economics honesty designer · **Date:** 2026-07-07
**Covers:** (1) lenses at scale (bootstrap, defaults, oligopoly, first-attester-wins UX), (2) community relayers (who/why, abuse economics, censorship floor, fees), (3) revocation/expiry doctrine end-to-end (mechanism, durations, renewal, read grades, propagation), (4) spam at the native kernel, (5) operator-liability residual note.
**Inputs:** carrier decision 2026-07-07, record-format investigation 2026-07-02, arch-B native kernel, coupling audit, spam-economics research, apps-requirements research, holistic redesign §2.6–2.8/§3, substrate decision §5–6.
**Confidence key:** **[investigated]** = rests on the adversarially-tested corpus · **[designed-here]** = new mechanism designed in this pass, self-attacked but not red-teamed · **[training-knowledge — verify]** = factual claim from model knowledge, MUST be independently verified before any doc adopts it verbatim.

Deliverable style: each section ends in a **DOCTRINE** block written to be adopted verbatim by the docs (normative MUST/SHOULD/MAY). Named failure modes are collected in §6.

---

## 1. Lenses at scale

### 1.1 The bootstrap, decomposed — what a lens-less user actually sees

"New user, empty lens — what do they see?" is four different questions, and three of them already have answers that need no default lens. Decompose before designing, or the design overweights the hard quarter:

| Surface | Needs a lens? | What a day-0 user sees with NO configured lens |
|---|---|---|
| **S1. Another author's container** (`/0xAlice/...`, the personal site, the DAO's docs, the package publisher's tree) | **No.** Author-first default order `[containerAuthor, viewer, system]` (holistic §2.6) resolves entirely from the container address. | Alice's content, exactly as Alice published it. This is the web-browsing case and it is lens-free by construction — the address in the link IS the trust anchor. |
| **S2. The user's own container** | No (self is always trusted for self). | Their own (empty) tree; system bootstrap objects. |
| **S3. A shared/hot namespace** (root-level shared paths, tag namespaces, comment threads under someone's post, shared folders) | **Yes** for third-party claims. The container author's lens position covers their own namespace (a blog author's comment thread defaults to the blog author's curation — the WordPress-moderation shape, free). | The namespace owner's claims + system objects. Third-party claims (comments by strangers) appear only if the namespace owner's lens (or the viewer's) admits them. Absent both: an honest client shows "N unverified claims exist — no trusted source admits them" with an explicit opt-in to browse untrusted. |
| **S4. Global discovery** (search, "what's new", trending, tag browsing across all authors) | **Yes — and this is the only surface with a genuine cold-start problem.** | Nothing trustworthy. Global enumeration is doctrine-demoted to labeled-untrusted discovery (holistic §2.8); a lens-less global feed is definitionally the spam bucket (Nostr public relays, pre-Ozone firehose — research-spam §2.3/§2.9). |

**The honest headline:** EFS without lenses is a fully working web of personal sites (S1/S2 — most of the mission's reads) and a useless commons (S3-stranger-writes/S4). The bootstrap problem is real but *narrower than feared*: it is "how does a new user acquire curation for shared namespaces and discovery," not "how does a new user see anything at all." Docs should say this in exactly these terms — the most-cited weakness shrinks by ~three quarters once the author-first default is counted. **[investigated** for the surface decomposition; the *scale* behavior of S3/S4 remains untested — nothing below removes that caveat**]**

### 1.2 The default-lens mechanism — who ships it, and the conformance rules

Who ships defaults: **clients ship defaults; the protocol ships none.** The genesis blob's system author (`keccak("efs.system.v1")`) publishes spec/bootstrap objects only. A genesis default lens would be the protocol shipping reputation — monoculture by construction, unfixable because genesis is Etched. This must be stated as a prohibition, not an omission.

The mechanism, concretely **[designed-here]**:

1. **Lens = LIST** (holistic §2.7, ports unchanged to the kernel: authors are bytes32 identity words). Publishing a lens costs one LIST + N LIST_ENTRY records — cents. Subscribing = one LIST_ENTRY in your own lens list, or zero-cost client-side config.
2. **Lens manifest convention.** A published lens SHOULD carry a manifest at a reserved well-known path under the publisher's container (`/.well-known/lens/<name>`): a small DATA (human-readable name, scope statement, moderation policy, contact/appeal route, pointer to the LIST id, pointer to the publisher's revoke-courier endpoint (§3.6)). The manifest is what marketplaces render; it needs no new schema (DATA + PROPERTYs).
3. **Starter packs.** A starter pack = lens LIST + follows LIST + manifest, published by any community (Bluesky starter-pack precedent; 40k custom feeds prove the product shape — research-apps §5). Clients MAY present a market of starter packs at onboarding. The market's *source list* is itself a lens the client ships — the regress is inescapable; the doctrine is to make the root choice **small, visible, and one-tap replaceable**, never to pretend it doesn't exist.
4. **Client-neutrality conformance rules** (same tier as ADR-0056's render-sandbox rule — a conforming-client rule, not machinery):
   - **C1 (disclosure):** any S3/S4 read MUST display the active lens chain (whose view is this?). The gateway lens-default honesty rule (holistic §3.4) generalizes to all clients.
   - **C2 (data, not config):** a client's shipped default lens MUST be a published lens ON EFS (inspectable, subscribable, forkable, diffable) — never opaque embedded config. A default nobody can fork is a platform.
   - **C3 (eject):** replacing or removing the default MUST be a first-class, persistent, one-interaction setting.
   - **C4 (no silent fallthrough):** on *unknown* (vs proven-absent) lens-author state, clients MUST NOT fall through to the next lens author — the read-grade rule (substrate decision §3.6), restated here because the bootstrap UI is where it will be violated first.
   - **C5 (untrusted is labeled, not hidden):** the opt-in untrusted view (S3/S4) MUST be visually distinct and MUST NOT be the default render for any shared namespace.

### 1.3 Anti-oligopoly: forces, counterforces, canary, honest limit

Name the forces pushing toward a reputation oligopoly, because they are real and none of them is defeated by architecture alone:

- **Scale economies in reputation**: the best spam/quality classifier is the one with the most data (email's endgame: Gmail + Spamhaus; Farcaster: one company's classifier labeling 82–91% of paying accounts — research-spam §2.4/§2.12).
- **Default stickiness**: most users never change defaults; whoever ships the dominant client's default lens holds de-facto editorial power.
- **Liability gravity** (§5): serving edges under legal pressure prefer few, defensible, insurable curators.
- **Curation is labor**: good lenses cost ongoing human effort; effort concentrates where funding is (the TCR/free-rider lesson — research-spam §2.6).

Counterforces EFS actually has **[investigated]**: viewer sovereignty (lens choice is per-viewer and per-read); lens-as-data (C2 makes every default forkable at zero switching cost — fork = copy a LIST); no platform choke point (any client, any gateway, same substrate); competing labelers on one substrate rather than per-platform moats (the Bluesky/Ozone shape, which is the *good* deployed precedent); and S1 reads never touching curation at all (the oligopoly's maximum blast radius is shared namespaces + discovery, not the web-of-sites core).

**The honest limit:** EFS can guarantee that *exit is cheap*; it cannot guarantee the *equilibrium is plural*. Email had cheap protocol-level exit too, and still concentrated, because reputation—not delivery—was the scarce good. Write this sentence into the docs. What EFS buys that email didn't have: forkability of the curator's actual artifact (the list itself is public data), and per-viewer composition (subscribe to 5 small lenses, not 1 giant one — the Bluesky stackable-labeler pattern, up to 20 subscriptions).

**Canary metric** (stewardship doctrine, not machinery): if a supermajority of default-configured S3/S4 reads across major clients resolves through lens publishers under common control, that is the monoculture flag. The response is stewardship (fund/qualify alternatives, rotate client defaults) — never a protocol change, because there is no protocol surface that can encode "be plural."

**Open interface flag:** James's Harberger-public-option agent may reshape lens/visibility economics (a paid "public slot" overlay). Interface requirement from this pass: any such overlay MUST compose as *one more lens author in the chain* (a lens the viewer can include or drop), never as a privileged resolution tier — otherwise it re-creates the protocol-shipped-reputation hole that C2 exists to close.

### 1.4 Protocol surface: what helps vs what stays client

| Candidate protocol surface | Verdict | Why |
|---|---|---|
| Lens-as-LIST (publish/subscribe/fork as records) | **Keep — already in** | The whole marketplace rides on it; zero new schemas [investigated] |
| Reserved well-known lens-manifest path | **Add (convention, not schema)** | Enables permissionless marketplaces + courier discovery (§3.6); costs one Codex line [designed-here] |
| Standardized lens-composition semantics (ordered chain, first-attester-wins, read grades) | **Keep — already normative** | Cross-client interop is the anti-monoculture force: a lens that renders identically in every client has no platform moat |
| Explicit deny entries / block-lists in lens semantics | **Defer, flag** | First-attester-wins is allow-shaped. Real moderation wants "admit everyone in lens A EXCEPT these" (Bluesky labelers are deny-shaped). Composition of allow+deny is client-side today; if it needs protocol semantics, that is a *pre-freeze* question for the lens resolution spec — flagged upward, not resolved here |
| Protocol default lens / genesis lens | **Prohibit** | Monoculture by construction; Etched reputation |
| On-chain lens registry/directory | **Prohibit** | A privileged directory is the plc.directory failure; discovery of lenses is itself a lens problem (correctly turtles) |
| Reputation scores, staking, lens ranking in protocol | **Prohibit** | TCR/free-rider/whale-capture record [investigated]; no tunable economics on Etched surface |

### 1.5 First-attester-wins UX at scale — whose `/readme` wins

The mental model for docs, verbatim: **"You never see 'the' `/readme`; you see the `/readme` of the first author *you trust* who wrote one."** Under author-first defaults, `/0xAlice/readme` is Alice's for every viewer — no ambiguity, links resolve identically for all recipients (the phishing-seam fix, holistic §2.6). Ambiguity exists only where namespaces are genuinely shared, and there it is a *feature* (per-viewer resolution) that must be made legible, not hidden:

- **U1 (attribution chip):** every resolved claim in a shared namespace MUST show who won and from which lens position.
- **U2 (contested marker):** contested anchors (≥2 attesters hold claims at the slot) are client-computable in O(claimants); conforming clients MUST mark contested paths and offer "N other versions" — the losing claims, ordered by the viewer's own lens, one tap away. Determinism is the promise: same lens chain ⇒ same winner, every client, every time.
- **U3 (link forms):** path-form links resolve under the *recipient's* lens (mutable, like a git branch); citation-form links pin id + explicit lenses + chain (reproducible, like a commit) (holistic §2.5). Share-UIs MUST expose both and default to path form for browsing, citation form for referencing/quoting.
- **Perf failure mode — the long-chain walk:** first-attester-wins over a k-author lens costs up to k slot probes per contested anchor. Per-author indices make each probe O(1) [investigated]; typical anchors have few claimants so early-exit dominates; but a 10k-author mega-lens over a hot namespace is an indexer workload, not a light-client one. Doctrine: indexers MAY precompute per-(lens, anchor) winners; clients MUST be able to verify any precomputed winner with k′ ≤ k point reads (verify-don't-trust preserved); SDK ships the verification.
- **Freshness:** curation IS mutation (research-apps §5 — lens-entry removal is the moderation mechanism and "must apply promptly on every honest reader"). Lens lists are dereferenced at read time; caches MUST honor short TTLs and SHOULD subscribe to the lens LIST's events for invalidation. A client that pins a stale lens copy is running a *different* lens and MUST say so (C1 applies to the cached version).

### 1.6 DOCTRINE — lenses at scale

> **L1.** The protocol ships no default lens. Genesis contains system/spec objects only. Clients ship defaults under conformance rules C1–C5 (§1.2): disclosed, published-on-EFS, one-tap ejectable, no silent fallthrough on unknown, untrusted views labeled.
> **L2.** Author-first resolution `[containerAuthor, viewer, …]` is the lens-free backbone: reading a container never requires curation. Curation is required only for third-party claims in shared namespaces and for discovery, and docs MUST scope the "empty lens" problem to those surfaces.
> **L3.** A lens is a LIST; a lens product is a manifest at `/.well-known/lens/<name>`; a starter pack is lens + follows + manifest. Marketplaces are permissionless renderers of manifests; no privileged directory exists or may be created.
> **L4.** Shared-namespace reads MUST attribute the winning author, mark contested anchors, and offer alternatives ordered by the viewer's lens. "You see the first author you trust" is the canonical explanation and appears in user-facing docs.
> **L5.** Monoculture posture: exit is guaranteed cheap (forkable lens artifacts, per-viewer composition, client interop); plurality is NOT guaranteed and is monitored as stewardship (canary: default-read concentration), never as protocol machinery.
> **L6.** Any future paid-visibility overlay (Harberger or otherwise) composes as an ordinary lens author in the viewer's chain, or it does not ship.

---

## 2. Community relayers

### 2.1 Who runs them and why — the honest taxonomy

A relayer is ~50 lines: verify signature, apply policy, submit, pay gas (arch-B §9). The question is never "can one exist" but "why would one persist." Taxonomy with motives and mortality:

| Operator | Pays for | Motive | Expected lifetime / mortality mode |
|---|---|---|---|
| **App/dapp operator** (blog host pays commenters' writes; dapp pays reviewers') | Its users' writes in its namespaces | Product: writes ARE the product; gas is CAC. The only model with revenue attached to every sponsored write | Lives with the app. Dominant early form; the Class-2 apps (comments/social/reviews, ≤$0.001 tolerance — research-apps §12.R7) exist only under this model |
| **Community/DAO** | Members' / topic writes | Mission, growth; treasury-funded | Governance-mortal (treasury votes rot); years |
| **Archival/public-good institution** | Specific authors/corpora (incl. replication + revoke couriering, §3.6) | Mandate; grants | Grant-mortal, 3–7 yr horizon (pinning-service record: NFT.Storage, web3.storage died — arch-B §11.2) |
| **Commercial relayer** | Subscribers' writes | Revenue: $/mo publish plans, fiat on-ramp, no token | Boring and durable while demand exists; the Nostr paid-relay shape (research-spam §2.3) |
| **Patron / self** | A named author's writes; own writes from a funded hot wallet | Vanity/support; sovereignty | Arbitrary |

Day-0 honesty: there are no users, so the first relayer is EFS's own faucet-drip successor on devnet (hackathon must-have) run at a loss. That is fine *because of* §2.2.

### 2.2 The relayer-mortality invariant (the one property that makes all of this safe)

The native kernel recovers the author from the envelope signature; `msg.sender` never enters the auth path **[investigated]**. Therefore:

- Nothing in the **signed bytes names a relayer**. The same envelope is submittable by any relayer, any friend, any archivist, or the author — byte-identical, idempotent on resubmission. This is a *format-level* guarantee and MUST be stated as one in the Codex: any future field that binds an envelope to a submission channel is a spec regression.
- Relayer death, refusal, or policy change is a **UX regression, never a data/identity/lens event**. A community can start or stop paying without touching anyone's identity (substrate decision §5). Sponsored writes are purely additive.
- Consequence for the docs' failure narrative: the year-3–10 "gasless edges rot" failure (arch-B §11.2) degrades consumer UX to "bring gas or find a new sponsor" — it never strands data.

### 2.3 Abuse economics

**Threat model.** The relayer pays real gas (cents/write on an L2) for author-signed envelopes. Three attacker shapes:

1. **Token-farm spam** — the npm precedent: 67,000+ fake packages, ~17k/day, farming tea.xyz rewards; a $0.01 fee is noise against token EV **[investigated]**. If writes are free to the author, the attacker's cost floor is zero and the relayer is the honeypot. Positive-EV spam *cannot be priced out* at any fee the legitimate tail tolerates (Laurie–Clayton asymmetry, quantitatively established — research-spam §2.1).
2. **Budget-drain griefing** — spend the relayer's gas to kill the free tier for everyone (no profit needed).
3. **Sybil identity minting** — bare EOAs are free to generate offline; naive per-identity budgets are trivially multiplied.

**Design: per-identity budgets × borrowed scarcity.** Per-identity budgets are necessary (Bluesky calibration: 5,000 pts/hr, 35,000/day, CREATE=3 ⇒ ~1,666 creates/hr — invisible to humans, binding on bots **[investigated]**) but insufficient alone, because EFS identities are free. Bluesky's budgets work because PDS accounts have admission control; a relayer must therefore bolt admission onto identity via **externally scarce credentials** — the Sigsum borrowed-scarcity pattern. Admission menu (a relayer picks ≥1; all are policy, none is protocol):

| Credential | Scarcity borrowed | Cost to sybil | Cost to legit user | Failure mode |
|---|---|---|---|---|
| Funded account (≥ dust balance or ≥N historical txs) | Capital + chain history | Real $ per identity | Near zero for anyone already on-chain | Excludes the truly gasless newcomer — the exact person sponsorship exists for; use only in combination |
| Aged identity (first-seen > T) | Time | Pre-farm identities T ahead (bounded by foresight) | Zero for existing users; T-day wait for newcomers | Farmers with patience; T is a knob, keep per-relayer |
| Lens vouching (member of a lens the relayer trusts) | Social trust | Compromise/spam a trusted curator | One ask ("get added to a community lens") | Turns curators into admission gatekeepers — acceptable because relayers are plural and the lens market is open; watch for §1.3 concentration coupling |
| Paid tier (cents–$/mo) | Fiat/crypto | Linear $ | Small; the Nostr.wine model (~$7/mo) works | Recreates a paywall — fine as ONE option among competing relayers, disqualifying as the only option |
| Third-party attestation gate (Coinbase-Verifications / Passport-style typed claims) | External KYC/personhood | High | One-time setup; deployed precedent [investigated] | Imports the attestor's politics; never a floor requirement |
| Proof-of-work stamp | Electricity | Outsourceable; quantitatively dead (5.8–346 s/msg to matter; blocks 1–13% of legit senders) | High, uneven (360× hardware variance) | **Prohibited by evidence** — do not let it back in via a relayer "feature" [investigated] |

**Policy-as-data:** a relayer SHOULD publish its admission policy + budgets machine-readably at `/.well-known/relayer` under its container (mirrors the lens manifest; Sigsum named-policy pattern). This makes the relayer market shoppable and keeps refusals auditable.

**The token-farm scenario, walked end-to-end (docs should carry this):** rewards protocol pays per EFS publish → farmers mint identities, hit relayers → relayers' borrowed-scarcity admission holds (each identity costs real $ or time) → farmers self-pay gas and flood the chain directly → **the kernel admits it all** (gas is the admission price; a permissionless permanent archive cannot and does not refuse paid writes) → lenses make it invisible to every scoped read; per-author index shape keeps shared surfaces unpoisoned (§4); no global surface amplifies it → residual cost = chain state growth, borne by node operators as with any chain spam. **The honest sentence: EFS does not stop paid spam from *existing*; it makes paid spam *unrentable* — no reach, no index poisoning, no namespace damage.** The tea.xyz farmers got paid because npm's flat namespace and global index gave their packages *presence*; EFS denies the presence, not the bytes.

### 2.4 Fee models that don't recreate gatekeepers

Four rules make any fee model safe; violating any one recreates a gatekeeper:

1. **Substitutability by format** (§2.2): the envelope never names a relayer; any relayer accepts any valid envelope for an admitted identity. Switching cost = one endpoint URL.
2. **Plurality by cheapness**: running a relayer stays ~50 LoC + a funded key; the reference implementation ships in the SDK repo. If running one ever requires a stake, license, or registry entry, that surface has been captured.
3. **No exclusive routes**: apps SHOULD accept a user-supplied relayer endpoint (SDK takes a relayer *list* with failover); an app that hard-wires its own relayer as the only path has built a platform, and conforming-client docs say so.
4. **The floor** (§2.5): self-submission with gas remains available and documented, permanently.

Priced models that pass these rules: per-write metering, subscriptions, community allowlists, sponsor-a-namespace, "first N writes free then pay." Models that fail: relayer-specific signature wrappers (breaks 1), staked relayer registries (breaks 2), app-locked relaying (breaks 3), any protocol fee (breaks 4 and the no-token doctrine).

### 2.5 Censorship posture — verifying the self-submit floor honestly

Claim under test: *"relayer refusal ≠ censorship, because self-submission with gas is the floor."* The claim is TRUE at the relayer layer and CONDITIONAL below it. The layer table, with the adversary's real power named:

| Layer refusing you | What they can actually do | Your counter | Honest cost of the counter |
|---|---|---|---|
| **One relayer** | Refuse to sponsor | Any other relayer (plural, permissionless, §2.4), or self-submit | ~zero |
| **All relayers** (coordinated policy, e.g. sanctions lists) | Deny sponsorship | Self-submit with gas; OR hand the envelope to ANY willing third party anywhere — submission is permissionless and the submitter needs no relationship to you | Gas (cents on L2) + finding one willing submitter. **This is the EFS-specific strength: censorship must stop every possible submitter, not just the author** — an envelope is a file; it travels by USB, email, Tor |
| **The L2 sequencer** (your home chain censors the tx that carries your envelope) | Delay inclusion | Force-inclusion via L1: OP-Stack deposit path (sequencing window ≈ 12–24h) or Arbitrum delayed-inbox `forceInclusion` (≈ 24h) — a censoring sequencer can *delay*, not *deny*, on a standard rollup **[training-knowledge — verify per chain before doc adoption]** | L1 gas (dollars, not cents) + hours of latency. The floor is real but expensive and slow — say both halves |
| **The whole stack for an L3** | Parent L2's sequencer can censor the L3's force-inclusion path | Recurse: force-include on the parent via L1 | The floor **recurses through every layer and is only as strong as the weakest**: an L3 on a censoring L2 with a broken/absent force-inclusion path has NO floor |
| **L1 builders/proposers** (OFAC-style filtering) | Delay (weak censorship) while ≥1 non-censoring proposer exists | Wait; direct-to-proposer channels | Measured as delay today, not denial **[training-knowledge — verify]**; a full-proposer-set censorship regime would break the floor and everything above it |
| **Every EFS chain simultaneously** | Block all *new* home-chain state changes for the author | Cross-chain portability: any submitter lands the envelope on any non-censoring EFS chain; the data exists, authenticated, readable | The author's *home-chain* currency (slot supersession, revocation-certainty venue) is delayed until some chain admits them; readers on other chains get checkpoint-grade state (§3.7) |

**The three holes, named plainly (these go in the docs, not in a footnote):**
1. **Not every chain has a floor.** "Hundreds of L2s/L3s" includes validiums, sidechains, and app-chains with no force-inclusion path at all, and Stage-0 rollups whose upgradable bridges/security councils can remove the path by governance **[training-knowledge — verify against L2Beat staging before adoption]**. Deploy-target doctrine: the canonical EFS home-chain recommendation MUST be a Stage-1+ rollup with a verified force-inclusion path, and the trusted-chain list (holistic §3.2 stewardship doc) gains a **force-inclusion status column** per chain — a living, redeployable document, real work, assigned to stewardship.
2. **The floor is priced in L1 gas.** For a Class-2 author (a commenter), the forced path costs ~1000× their write's value. Honest framing: the floor protects *publishers with stakes*, not *every interaction* — a censored commenter realistically routes via a different submitter or chain, not via force inclusion.
3. **Refusal ≠ censorship needs its full sentence:** relayer refusal is not censorship **iff** (a) relayers are substitutable (§2.4 rules hold), and (b) at least one reachable EFS chain has a working floor or a willing submitter. Both conditions are operational facts to be monitored, not axioms. When (a) or (b) fails, refusal IS censorship and the docs must not define the problem away.

### 2.6 DOCTRINE — relayers

> **R1.** Sponsorship is optional, plural, and format-invisible: no signed byte names a submitter; any envelope is submittable by anyone; relayer failure is a UX event, never a data/identity event. Any spec change that binds envelopes to submission channels is a regression.
> **R2.** Relayers are policy-free zones for the protocol and policy-rich zones for themselves: per-identity budgets (Bluesky-calibrated defaults in the reference relayer), borrowed-scarcity admission from the §2.3 menu, published machine-readable at `/.well-known/relayer`. PoW admission is prohibited by evidence.
> **R3.** No protocol fees, no relayer registries, no staking, no tunable economics on Etched surfaces. Prices and rate limits live only on redeployable service edges.
> **R4.** The censorship floor is stated with its costs: self-submission or any-party submission always exists; force inclusion makes sequencer censorship delay-not-denial ONLY on chains where the path exists and works; the trusted-chain list records force-inclusion status per chain; the canonical home-chain recommendation is a Stage-1+ rollup with a verified path.
> **R5.** The reference relayer ships with the SDK (~50 LoC + policy hooks), because plurality is a function of how cheap running one stays.
> **R6.** Spam that pays its own gas is admitted, invisible in scoped reads, and unrentable — the kernel never refuses paid writes and the docs never promise otherwise.

---

## 3. Revocation / expiry doctrine, end-to-end

### 3.1 The physics (recap, one paragraph)

A REVOKE is a signed record in the author's log: free to issue, portable, verifiable, replayable onto any chain — propagation is strictly better than EAS **[investigated]**. The gotcha is absence: to trust "not revoked" you must know you're not missing a withheld/uncopied REVOKE. On the live home chain, one lookup is certain. On a copied chain, the best purchasable grade is "not revoked **as of** the author's checkpoint N" (non-inclusion against a signed state root). Beyond that: *unknown*, never faked. Because completeness cannot be bought cross-chain, safety-critical data needs a fuse that fails safe on its own: **author-set expiry** (the TLS answer). Everything below turns that one sentence into mechanism, durations, UX, and tables.

### 3.2 The expiry mechanism — where the fuse lives **[designed-here — format-affecting; MUST enter the envelope spec red team]**

Three candidate placements, one of which is broken:

| Option | Mechanism | Verdict |
|---|---|---|
| **A. In-record signed field**: `expiresAt uint64` (0 = none) added to the Record struct and its digest preimage (`recordDigest = keccak(abi.encode(DOMAIN_RECORD_V1, op, kindTag, expiresAt, keccak(body)))`) | Uniform; readable without parsing bodies; one comparison for on-chain gates; +8 bytes calldata (~130 gas) | **Recommended.** Costs a freeze-window format decision — flag to the envelope red team now, because it is Etched |
| **B. Reserved property key** (`efs.expiry` as a separate PROPERTY claim) | No format change | **Broken — the stripped-expiry copy:** a copier (or attacker) replicates the data record *without* its expiry property; the copy verifies as the author's and now looks eternally fresh on the destination chain. The mitigation for withheld revokes must not itself be withholdable. Disqualified |
| **C. Per-kind body field** (safety-critical schemas define their own expiry inside `body`) | Unstrippable (inside signed body) | Workable but non-uniform: every reader/gate parses per-schema; expiry semantics fragment. Acceptable fallback if A loses the format argument; the doctrine below is placement-agnostic between A and C |

Non-negotiables regardless of placement:
- **Expiry expires currency, never authenticity.** An expired record still verifies as the author's and remains in the archive forever. It stops being safe to *act on*. (EAS's `expirationTime` was rejected in v1 because EFS reads filtered on revocation only — what returns here is a *read-grade input*, not a validity gate.)
- **Storage is clock-free; reads are clock-aware.** The kernel stores `expiresAt` and never enforces it at admission or in slot state — otherwise per-chain state would depend on submission clocks and the convergence property (arch-B §3.4: state = f(admitted set)) breaks. Expired records MUST remain admissible forever (archival replication of history). `getSlot`/`getClaim` return `expiresAt`; callers (SDK, gateways, the `EFSGate` reference contract) apply `block.timestamp`/wall-clock at read.
- **Expiry applies to claims** (placements, properties, trust/config assertions). Objects (DATA bytes, TAGDEFs, anchors) never carry expiry — path permanence and byte authenticity are the archive.

### 3.3 Duration doctrine — who sets, and what numbers

**The author sets expiry, at signing, in the signed bytes.** Nobody else can (it's inside the signature), and nobody else should (only the author knows the data's safety profile). Apps/SDKs set *defaults by data class*; the doctrine table (numbers are defaults, not protocol constants — there are no protocol constants):

| Data class | Default expiry | Rationale / precedent |
|---|---|---|
| Security-critical live config (the Microsoft/Vitalik config case: endpoints, trusted-key lists, dependency pins consumed by running systems) | **30–90 days** | The cert-industry direction: TLS max validity has been ratcheted from 398 days toward ~47 days by 2029 (CA/B ballot SC-081) because revocation-checking cannot be trusted to propagate — **the exact same failure EFS has cross-chain** [training-knowledge — verify numbers before doc adoption] |
| Trust/authorization claims (key endorsements, membership used for gating, allowlists) | **≤ 1 year** | Renewal doubles as an "author still stands behind this" heartbeat |
| Ordinary claims (placements, metadata, posts, reviews) | **None (0)** | Staleness is not dangerous; permanence is the product |
| Objects / bytes / namespace | **Prohibited** | §3.2 |

**The eternal-freshness default, named:** data with no expiry gives cross-chain readers no staleness bound at all — "not revoked as of checkpoint N" where N may be years old renders identically to fresh data unless clients surface checkpoint age. Doctrine: readers MUST surface the completeness horizon (checkpoint age / "home-chain live") for any claim consumed for a safety-relevant decision, expiry set or not. Expiry is the author's fuse; checkpoint-age display is the reader's seatbelt; they are independent and both normative.

### 3.4 Renewal UX — is re-sign-before-expiry a tolerable burden?

Renewal = re-assert (same kind/body, new `expiresAt`, new seq) before the old record lapses. Slot supersession by (seq, idx) makes the renewal current automatically **[investigated]**; for non-slot claims readers take the latest unrevoked assertion. Cost per renewal: one tiny record — cents relayed, one signature.

The honest persona split:

- **Org with CI (the actual safety-critical publisher):** trivial. Renewal is a cron job in the same pipeline that already rotates their TLS certs. The ACME/Let's Encrypt lesson: short-lived + automated beat long-lived + manual precisely because automation was made the default **[training-knowledge for the automation-share stat — the direction is safe]**. SDK MUST ship `renewExpiring()` as a one-call primitive.
- **Individual with a wallet:** a periodic one-click prompt ("3 records expire this month — renew?") via any client. Tolerable at low frequency; this persona should rarely hold 30-day safety-critical data.
- **The v2 automation gap, stated honestly:** hands-free renewal requires a signature without a human. With bare-EOA-first-class v2 identity (KEL/session-key machinery reserved, not built), the options are (a) a hot key in a cron job — real risk, must be documented as such, or (b) **the renewal ladder** below. Scoped renewal-only session keys are a *post-v2* KEL benefit — name it as one of the first things the reserved identity machinery buys.
- **Dead authors:** their safety-critical data goes stale and reads degrade to STALE (§3.5). **This is the feature, not a failure** — it is the entire reason expiry exists. An author who wants post-mortem freshness must arrange succession (org identity) or accept staleness. Docs say this plainly.

**The renewal ladder [designed-here]:** at authoring time, pre-sign K renewal records with future TIDs (month-1…month-K seqs). The kernel's future-dating bound (`tidTime(seq) ≤ now + 600`) means each ladder rung is *unsubmittable until it matures* — so the ladder can be handed to any courier/relayer as a dead-man's-switch renewal plan with **no hot key and no author liveness for K periods**. Change of mind: every rung's claimId = f(author, seq, idx) is client-computable in advance **[investigated — coupling-audit claimId property]**, so one revoke-all envelope kills the whole remaining ladder. **Spec dependency surfaced by this design:** the kernel MUST admit a REVOKE naming a *not-yet-admitted* claimId (pre-revocation, stored as monotone state keyed by claimId regardless of claim existence). Arch-B's convergence property already implies this — if REVOKE(X)-before-X were illegal, admission order would change final state and replay-order-independence breaks — but no document states it, and both the ladder kill and out-of-order cross-chain revoke replay silently depend on it. Add it to the kernel admission rules explicitly. **Named trap — the zombie ladder:** forgotten ladder rungs mature and re-assert content the author no longer stands behind, and (worse) a rung's TID may exceed a later hand-signed correction's TID, winning slot supersession. Mitigations (all MUST for the SDK): persist ladder claimIds with the WritePlan; register the ladder's existence as a property on the renewed claim (discoverable); default-revoke outstanding rungs whenever the author supersedes or revokes the underlying claim; cap default K (e.g. 12).

### 3.5 The read-grade extension: STALE is a first-class grade

The normative vocabulary (substrate decision §3.6) distinguishes proven-present / proven-absent / unknown. Expiry adds a third *disposition* for a present, authenticated, unrevoked claim. Full disposition set, normative:

- **LIVE** — present, signature-verified, unrevoked at this venue's grade, unexpired.
- **REVOKED** — an admitted REVOKE names it. Terminal, monotone.
- **STALE** — expiresAt < now and no admitted renewal. Authenticity intact; currency void. Default read paths MUST exclude STALE claims from *current* resolution (slot answers, gate checks) exactly as they exclude REVOKED, and MUST serve them under an explicit historical/stale flag on request — they never disappear (archive). STALE ≠ REVOKED in display: "author withdrew this" vs "author went silent"; conflating them slanders dead authors and MUST NOT happen in UI.
- **UNKNOWN-CURRENCY** — present and authenticated, but this venue cannot bound revocation/renewal completeness (no recent checkpoint). Never rendered as LIVE.

### 3.6 Revoke propagation mechanics — who carries revokes

Propagation is free and permissionless; the design task is making it *routine*. Mechanisms, in order of load-bearing-ness:

1. **Log-scoped replication (the default carrier).** The blessed replication unit is *an author's log through a checkpoint*, not a cherry-picked record. Whoever copies Alice-through-seq-N provably carries every REVOKE she issued through N **[investigated]**. Doctrine: a copier that ships a claim without the author's covering checkpoint (or with an older one) has produced a **lower-grade copy**, and destination readers grade it accordingly (§3.7). Cherry-picking stays legal (Merkle proofs make it verifiable) — it just honestly reads as UNKNOWN-CURRENCY.
2. **Revocation couriers [designed-here].** A courier watches a set of authors' home-chain logs and forwards REVOKEs (and checkpoints, and matured ladder rungs) to replica chains. Permissionless (revokes are self-verifying), cheap (~30–50k gas/revoke — arch-B §7), stateless, ~a filter + a funded key. Doctrine: **lens operators SHOULD run or subscribe to a courier covering their lens's author set** — this is the operational meaning of "lenses subscribe to authors' revoke feeds." A lens manifest (§1.2) SHOULD name its courier arrangement; a lens that curates authors but doesn't carry their revokes to the chains it serves is advertising currency it doesn't have.
3. **Pull-latest-before-trust.** Readers about to act on safety-relevant data SHOULD check the author's home chain (`authorHead` + revocation lookup — one RPC) when reachable. Cheap, kills the window entirely while the home chain lives.
4. **Expiry (§3.2–3.4)** — the backstop when 1–3 all fail: the data de-rates itself.

What is NOT built, restated: no revocation oracle, no cross-chain absence proofs, no witness quorum — refusing to fake completeness is the design **[investigated]**.

### 3.7 THE honest table — what each read grade promises, per venue

For a claim C by author A, adopt verbatim:

| Question | Home chain (live) | Copied chain (has A's log through checkpoint N) | Cherry-picked copy (record + proof, no checkpoint) | All A's chains dead (offline bundle) |
|---|---|---|---|---|
| **Is C authentic (A signed it)?** | Certain (ecrecover) | Certain | **Certain** — authenticity survives everything; this is the property that never degrades | Certain, from bytes alone (year-100 procedure) |
| **Does C exist / what's at this slot?** | Certain, total state | Certain over admitted set; slot answer = deterministic f(admitted set) | This record exists; slot context unknown | As of the bundle; proven-absent only against a checkpoint |
| **Is C revoked?** | **Certain** — one lookup, live | "Not revoked **as of seq N**" — provable by non-inclusion against A's checkpoint; freshness = N's age, displayed | **Unknown** — MUST NOT render as "not revoked" | "Not revoked as of last surviving checkpoint" — bounded staleness, labeled |
| **Is C current (latest)?** | Certain per-author (head of A's log) | As of N; a newer supersession may exist elsewhere — snapshot, not feed | Unknown | As of the bundle; never claimed further |
| **Is C safe to act on?** (composite) | LIVE if unexpired & unrevoked | LIVE-as-of-N if unexpired; UNKNOWN-CURRENCY if no recent checkpoint; STALE if expired | UNKNOWN-CURRENCY at best; STALE if expired | Historical evidence grade: "A said this, before epoch E, unrevoked as of N" |
| **Reader duty** | none extra | display N's age; courier/pull for safety reads | upgrade to log-scoped copy before trusting | label the grade; never simulate liveness |

One-line summary for docs: **authenticity is unconditional; absence-of-revocation is a freshness claim and always carries its date; expiry is the author's fuse for readers who won't check dates.**

### 3.8 DOCTRINE — revocation/expiry

> **X1.** A REVOKE is a signed record; propagation is permissionless; completeness cross-chain is checkpoint-bounded ("as of seq N"), never absolute. No mechanism may claim otherwise.
> **X2.** Expiry is author-set, inside the signed bytes of the record it governs (in-record field recommended; property-key placement prohibited — strippable). It expires currency, never authenticity; objects never expire; storage is clock-free, reads are clock-aware; expired records remain admissible forever.
> **X3.** Defaults by class: 30–90d for security-critical live config; ≤1y for trust/authorization claims; none for ordinary claims. Set by apps/SDK, never by protocol constants.
> **X4.** STALE is a first-class read disposition: excluded from current resolution like REVOKED, preserved and servable as historical, displayed distinctly from REVOKED ("author went silent" ≠ "author withdrew").
> **X5.** Renewal is re-assertion (new seq, new expiry); the SDK ships one-call renewal, expiring-soon surfacing, and the pre-signed renewal ladder with mandatory ladder-claimId bookkeeping and revoke-all. Hands-free renewal on bare EOAs otherwise means a hot key — documented as a risk, with scoped renewal keys named as reserved-KEL future work.
> **X6.** Blessed replication is log-scoped-through-checkpoint; cherry-picked copies read as UNKNOWN-CURRENCY. Lens operators SHOULD run/subscribe revocation couriers for their author sets and declare so in the lens manifest. Readers surface checkpoint age on every non-home read used for decisions; the §3.7 table is normative for client rendering.
> **X7.** Pre-revocation is a kernel admission rule: a REVOKE naming a not-yet-admitted claimId is valid and stored monotonically (required by convergence/replay-order-independence; consumed by out-of-order revoke replay and the renewal-ladder kill).

---

## 4. Spam at the kernel (no EAS)

### 4.1 What the carrier swap changes — and mostly doesn't

Per-record gas remains the on-chain admission price: storage is per-record, so batching amortizes only the envelope overhead (~21k + ~3k ecrecover + hashing) — the Sidetree per-op condition holds by construction **[investigated]**. The kernel neither improves nor worsens spam economics (arch-B §8.b/§12.6 said so; this pass re-checked the deltas):

| Delta vs EAS | Spam consequence | Verdict |
|---|---|---|
| Idempotent no-op on byte-identical resubmission | Replay-flooding costs the flooder gas and grows no state; front-running someone's submission lands *their* state at *your* cost | Self-defeating for the attacker — a small **improvement** |
| `submitOne` (single-leaf replication path) | Same per-record price + ~1–2k proof verify; bogus proofs revert at submitter's cost | Neutral |
| Duplicity events (same (author,seq), different digest) | Evidence in events, not state | Neutral |
| Free offline identity minting (bare EOAs, C2 digests) | Identity was never the priced resource; writes are | Neutral — budgets/admission live at relayers (§2.3) |
| Relayer edge becomes the default consumer UX | **The honeypot moves off-chain** — the real new spam surface is §2.3, not the kernel | Covered by R2 |
| TAGDEF (unowned namespace registration, tag-core) | Junk-name floods cost gas and squat nothing (unowned + idempotent = no squatting economy — the deterministic-ID anti-squatting property extends to tags [investigated]); the residual is **global tag enumeration**, which is exactly the `_children` problem again | Covered by the index-shape port below |

Nothing else is needed at the kernel — and critically, nothing else is *permitted*: no PoW, no deposits, no tunable prices on Etched surface (the v1 non-changes doctrine ports unchanged). The kernel's spam posture is: **gas meters, index shape contains, lenses defend.**

### 4.2 The index-shape doctrine, ported to kernel indices

The rule (holistic §2.8, inscriptions-hardened): index integrity MUST NOT depend on gas prices — the Dec-2023 inscriptions event took down the exact chain class EFS writes on, and $450–4,500 poisons a hot global scan path at *today's* prices **[investigated]**. Every kernel index gets classified at design time:

| Kernel index | Class | Doctrine |
|---|---|---|
| Per-author objects/claims/log (`authorHead`, per-author enumeration) | **Primary** | Cost of reading scales with that author's writes only; unpoisonable by third parties; the backbone of every lens-scoped read |
| Slot state (`getSlot`) | **Primary** | O(1) point read; per-(author, slot) by construction — cardinality lives in the record kind (the PIN/TAG non-merge trap, tag-core) |
| Path tree / children **per author** (K-way merge feed) | **Primary** | Lens-scoped listing cost scales with the lens's content |
| Global children / global tag buckets / any all-authors enumeration | **Demoted: labeled-untrusted discovery** | Never on a default read path; never an input to resolution; may bloat arbitrarily without harming any conforming read. TAGDEF namespaces inherit this line explicitly |
| Registry (id → entry) | Point-lookup only | Write-once; growth is a node-storage cost priced by gas — monitored, not defended |
| Duplicity/evidence | Events | No state to poison |

Plus the two SDK-normative rules that ride with it: **verification order** lens-membership → signature → byte fetch (never fetch bytes for an author the lens rejects — the verification-DoS rule) **[investigated]**; and **state-vs-calldata honesty** — how much spam permanently costs the *network* depends on the hard-part-(d) storage-depth decision (payload in state vs events+commitments); the spam posture above is deliberately valid under either outcome, so that decision stays free to be made on composability grounds alone.

### 4.3 DOCTRINE — kernel spam posture

> **S1.** Gas is the admission price and a rate limiter, never the defense; lenses are the defense; index shape is the containment. No PoW, deposits, fees, or tunable anti-spam parameters exist on Etched surfaces, ever.
> **S2.** Every kernel index is classified primary-per-author or demoted-global at spec time (§4.2 table is the classification); no default read path may traverse a demoted index; TAGDEF enumeration is demoted from birth.
> **S3.** Byte-identical resubmission is a cheap idempotent success; paid spam is admitted, invisible in scoped reads, and unrentable (§2.6 R6 restated at the kernel).
> **S4.** SDK verification order is normative: lens → signature → bytes.
> **S5.** Identity is free; budgets attach to identities only at service edges. The kernel never rate-limits an author.

---

## 5. Operator-liability residual (the one-page honest note)

*Doctrine note for infrastructure-operator documentation. Honest, jurisdiction-generic, NOT legal advice; obtain legal review before publication. Context: protocol content-neutrality is ruled (James 2026-07-02) — lenses govern what a reader **sees**, not what a node **stores and serves**. This note is the residual.*

**The hard edge first, plainly:** EFS on-chain bytes (SSTORE2/state) live in **every full node's state** of every chain that carries them, regardless of anyone's lens, and cannot be excised by a node operator without leaving consensus. Replay-anywhere means an author cannot keep their own signed records off any chain either (arch-B §12.3). Anyone who runs EFS infrastructure must understand which tier they operate, because exposure differs by an order of magnitude between tiers:

| Tier | What you physically store/serve | Exposure posture | Your controls |
|---|---|---|---|
| **Chain full node / RPC** | All state incl. every admitted EFS byte | Same class as running any Ethereum node today (chains have carried arbitrary illicit calldata since 2018; we know of no node-operator prosecution for it — **[training-knowledge — verify; untested legal ground]**). You do not select, render, or serve content to the public web | None per-record (consensus). Control = which chains you run |
| **Gateway (https/web3:// front-end)** | Nothing durable; you **serve to the public web** | **Highest tier.** You are a host/publisher-adjacent intermediary in most regimes (hosting safe-harbor + notice-and-takedown shaped: DMCA-class in the US, DSA hosting provisions in the EU — **[training-knowledge — verify]**) | Full: serving lens choice, per-item takedown at your edge, geo policy. Serving policy ≠ protocol censorship — the self-host floor makes your refusal survivable, which is also your best argument that you are infrastructure, not editor. Doctrine: gateways MUST publish a serving policy + notice channel; SHOULD default to disclosed curated lenses (C1); for the CSAM category specifically, SHOULD run serving-edge hash-matching against industry lists — the one category where reactive-only posture is untenable **[training-knowledge — verify obligations per jurisdiction]** |
| **Mirror / archival replicator (LOCKSS copy)** | Bytes you chose: **lens-scoped replication is liability-scoped replication** — you copy the author set you elected to trust | Between node and gateway: you store selectively but typically don't serve publicly | Author-set choice up front; WHITEOUT/exclusion lists; takedown from *serving* while retaining archive copies (the Internet Archive posture) |
| **Relayer** | Nothing; you pay gas to publish others' signed records | You cause publication but the **author signature is durable attribution evidence** in your favor; your admission policy (§2.3) is your screening. Screening cuts both ways: capability to filter can create knowledge-based duties in some regimes (moderation-paradox class) — keep policy mechanical (budgets, credentials), not content-editorial, unless prepared to operate it | Admission policy; refusal (floor makes it survivable) |
| **Indexer / courier** | Metadata, pointers, revokes | Lowest content exposure; discoverability amplification is the residual theory | Scope of what you index |

**The GDPR-shaped residual** (EDPB 02/2025 direction: technical impossibility does not excuse non-erasure **[investigated — corpus-cited; guideline was in consultation, verify final text]**): the compliance surface is (a) the serving layer (gateways/lenses can stop resolving), and (b) the write-side conventions — personal/private data encrypted by default with key-destruction-as-delete (holistic §2.3). An operator note cannot fix what an author publishes in plaintext; the SDK defaults are the real mitigation and this note should say so rather than imply gateways can absorb it.

**What EFS gives operators that raw chains don't:** disclosed-lens serving (you serve a named curated view, not "everything"), WHITEOUT, per-author scoping, hash-verified selective mirroring, and an author-attribution proof on every record. What it takes away: any pretense that "we can delete it" — the honest operator pitch is *we can stop serving it; we cannot make it never have been published*, which is exactly the crates.io/yank posture three package ecosystems converged on.

---

## 6. Named failure modes (register)

| Name | Section | One line |
|---|---|---|
| **Warpcast monoculture** | 1.3 | One default classifier becomes the de-facto editor; canary = default-read concentration; response is stewardship, not protocol |
| **Starter-pack capture** | 1.2 | The onboarding market's source list is itself a lens; make the root choice small/visible/replaceable — never invisible |
| **Lens-chain fallthrough** | 1.2 C4 | Resolving *unknown* as *absent* silently promotes the next lens author — the anti-monotone lens amplifier; prohibited |
| **Stale-lens shadow** | 1.5 | A cached lens copy is a different lens; disclose the version or you're lying about whose view it is |
| **Relayer honeypot drain** | 2.3 | Free-to-author writes make the relayer the economic target; budgets × borrowed scarcity bound the burn |
| **npm token-farm flood** | 2.3 | Positive-EV spam shrugs off fees; the answer is denying reach (lenses + index shape), not raising prices |
| **Recursive sequencer blockade** | 2.5 | An L3's censorship floor recurses through its parent; a broken link anywhere = no floor; track per-chain |
| **Stage-0 floor removal** | 2.5 | Governance-upgradable bridges can delete force-inclusion; the floor is a fact to verify, not an axiom |
| **Withheld-revoke serve** | 3.1 | A copied chain serves revoked data with a valid signature; bounded only by checkpoints + expiry |
| **Stripped-expiry copy** | 3.2 | Expiry as a separate property can be omitted by the copier — the fuse must live inside the signed record |
| **Eternal-freshness default** | 3.3 | No expiry + no checkpoint-age display = years-stale data renders as fresh; reader seatbelt is mandatory |
| **Zombie ladder** | 3.4 | Forgotten pre-signed renewals mature and resurrect withdrawn content; deterministic claimIds + revoke-all + SDK bookkeeping |
| **Renewal-death cliff** | 3.4 | Dead authors' safety-critical data goes STALE — by design; say so, don't soften it |
| **Global-index poisoning (incl. TAGDEF)** | 4.2 | Any all-authors enumeration is one cheap-gas regime away from ruin; demote at birth |
| **Moderation paradox (relayer)** | 5 | Content-editorial screening can create knowledge duties; keep relayer policy mechanical |

---

## 7. Not resolved here / handed upward

1. **Deny-semantics in lens composition** (§1.4): allow-shaped first-attester-wins vs deny-shaped labeler reality — whether deny entries need protocol-level lens semantics is a pre-freeze lens-spec question. Flagged, not answered.
2. **Expiry field placement is format-affecting** (§3.2): recommendation A (in-record `expiresAt` in the digest preimage) must go through the envelope red team inside the freeze window; option C is the fallback; option B is disqualified.
3. **Force-inclusion facts are training-knowledge**: the §2.5 windows (OP ~12–24h, Arbitrum ~24h), L2Beat staging, and builder-censorship-as-delay must be verified per chain before the trusted-chain list ships its force-inclusion column.
4. **Legal review** of §5 before any operator doc publishes it; DSA/DMCA/CSAM-obligation sentences are direction-correct but jurisdiction-unverified.
5. **The scale behavior of S3/S4 remains untested** (§1.1): this pass narrowed and mechanized the bootstrap; it did not run the discovery UX against real users. The lens model at scale is still the most-cited, least-tested mechanism — the honest status is now "designed, decomposed, conformance-ruled, still unfielded."
6. **Harberger interface** (§1.3): composition rule stated (overlay = ordinary lens author); the overlay itself is James's separate agent.
