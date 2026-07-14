# Red-team attack report — ops-economics-honesty.md

**Role:** Red team · **Date:** 2026-07-07
**Target:** `/private/tmp/claude-501/-Users-james-Code-EFS/089e21d8-6171-40d6-9cac-1d2e941506f9/scratchpad/efsv2/ops-economics-honesty.md`
**Ground truth checked against:** carrier decision 2026-07-07 (kernel sketch, checkpoint op, Codex replicated-read rule, per-lens freshness horizons), arch-B native kernel (TID future-bound line 150, admission pipeline line 204, prev semantics line 144, duplicity lines 149/272/293), substrate decision (portable-currency kill list, §3.6 read grades), settled direction 2026-07-07.
**Method:** each commissioned surface attacked with concrete adversary scenarios; every finding carries severity, whether a fix exists *inside* the current design, and the minimal fix. Findings I could not make bite are listed in §G (what survived) so the target's authors know what was tried.

**Headline:** the doctrine largely survives — it is honest where most docs lie, and its named-failure-mode register is real. **No unconditional fatal.** One **conditionally fatal dependency ambiguity** (checkpoint machinery: the entire §3 grading apparatus rests on a mechanism the settled direction can be read as having dropped) must be reconciled before any doc adopts §3 verbatim. Twelve serious findings, all fixable inside the design. The single biggest *substantive* blind spot: **§3 builds a safety doctrine for exactly the use cases where key compromise is the dominant real-world threat, and never mentions key compromise once** — and v2 bare-EOA identity has no rotation.

---

## 0. Severity table (all findings)

| ID | Finding | Severity | Fix inside design? | Section |
|---|---|---|---|---|
| E6 | Checkpoint-machinery dependency vs settled direction "no HEAD/CHECKPOINT machinery" — §3.6/§3.7/X6 collapse under one reading | **CONDITIONALLY FATAL — reconcile before adoption** | Yes (either reading has a coherent repair; pick one explicitly) | §E |
| D4 | Key compromise defeats expiry AND revocation; bare-EOA v2 has no rotation; §3 never says so | Serious | Yes (honesty sentences + register entry; machinery correctly stays reserved) | §D |
| D1 | Revocation-latency window: revoked-yesterday data grades LIVE-as-of-N under a *fresh* checkpoint; no normative freshness horizon; courier/pull are SHOULDs | Serious | Yes (port carrier decision's per-lens freshness horizons; MUST-pull for safety class) | §D |
| D3 | Deny-semantics deferral (§1.4/§7.1) is load-bearing for the package-registry safety story; the doc never connects them | Serious | Yes (client-side advisory-composition convention now; pre-freeze forcing case) | §D |
| D2 | Opt-out equilibrium: immutable-version registries will set expiry=0; fail-closed STALE breaks builds; flagship class likely opts out of its own fuse | Serious | Yes (split mutable-pointer vs immutable-version doctrine; name adoption risk) | §D |
| D5 | Renewal ladder inverts the fail-safe for the safety-critical class + unexamined `prev`-chain interaction + zombie-rung TID already known | Serious | Yes (prohibit ladder for 30–90d class; flag prev to envelope red team) | §D |
| C1 | Revoke-selective sequencer: "home chain = certain" grade is certainty over *admitted* state; a censored REVOKE renders revoked data LIVE-with-certainty for the force-inclusion window | Serious | Yes (grade footnote + multi-venue revoke broadcast doctrine + register entry) | §C |
| E1 | Read-grade set missing EQUIVOCAL: kernel emits duplicity evidence, grades ignore it | Serious | Yes (add disposition; evidence machinery already exists) | §E |
| B1 | Curation bribery: token incentives attack lens membership (the admission credential AND the reach mechanism), not the relayer | Serious | Yes (revocable vouching, paid-inclusion disclosure, register entry) | §B |
| A3 | SDK-default loophole: C1–C5 bind clients; the SDK upstream of all clients is unbound | Serious | Yes (extend C2/C3 to SDK defaults explicitly) | §A |
| A1 | Canary metric (default-read concentration) is unmeasurable as stated — L5's safeguard is currently empty | Serious (trivial fix) | Yes (observable proxies; admit lossiness) | §A |
| E2 | STALE display "author went silent" slanders live authors on lagging replicas — the doc's own venue-relativity applied to its own UI rule | Serious (trivial fix) | Yes (venue-horizon-qualified display) | §E |
| B2 | Sponsored-replay drain: idempotent resubmission of *public* envelopes burns sponsor gas / author budgets at zero attacker cost | Survivable | Yes (reference-relayer dedupe + pre-submit chain check) | §B |
| B3 | "~50 LoC relayer" vs effective borrowed-scarcity admission is a real tension; plurality-by-cheapness erodes under adversarial load | Survivable | Yes (honesty sentence; cheap-default admission pairing) | §B |
| C2 | "Censorship must stop every possible submitter" oversells at the sequencer layer (content-filtering is submitter-independent) | Survivable | Yes (wording) | §C |
| C3 | "Any willing submitter" under sanctions ignores submitter legal exposure (Tornado-Cash-shaped) | Survivable | Yes (jurisdiction sentence in §5 note) | §C |
| C4 | No home-chain migration story: permanently censored/dead home chain leaves old-venue readers reading author-silence forever | Survivable | Yes (MOVED-home convention record + courier propagation; no machinery) | §C |
| A2 | C1–C5 unenforceable against a dominant nonconforming client | Survivable (inherent) | Partially (say enforcement = interop + fork pressure, i.e. reputational) | §A |
| A4 | "Fork = zero switching cost" conflates artifact with labor; a forked lens decays immediately | Survivable | Yes (wording) | §A |
| E4 | No disposition for authenticated-claim-with-unfetchable-bytes (storage-depth dependent) | Survivable | Yes (placeholder grade) | §E |
| E5 | SUPERSEDED disposition implicit, never named | Survivable | Yes (one line) | §E |
| F1 | Spam-posture "valid under either storage-depth outcome" is true but gas-meter weakens sharply in cheap-blob regimes | Survivable | Already covered by demotion doctrine; add one sentence | §F |
| A5 | §1.1's "shrinks by ~three quarters" is rhetoric, not measurement | Survivable | Yes (soften to qualitative) | §A |

---

## A. Lens discovery — does §1 prevent monoculture or describe hope?

**Direct answer to the commissioned question: it describes hope, and it says so.** §1.3's "exit is cheap; plurality is NOT guaranteed" is the honest sentence and L5 codifies it. The manifest + starter-pack + conformance apparatus is discovery *plumbing*, not an anti-monoculture *force*; the actual forces are cross-client interop, lens-as-forkable-data, and per-viewer composition — and §1 correctly refuses to promise they win. I could not construct an attack that §1 *claims* to prevent and fails to prevent. What I could attack is the safeguard layer around the hope:

### A1. The canary is unmeasurable — L5's monitoring clause is currently empty. **Serious (trivial fix).**
"Supermajority of default-configured S3/S4 reads across major clients resolves through lens publishers under common control" — reads are client-side, off-chain, private. Nobody can observe them. As written, the one operational safeguard in L5 cannot be operated: the monoculture would be detected the way it was detected in email — retrospectively, when it's the water.
**Fix inside design: yes.** Replace the read-share canary with observable proxies, and say they are lossy: (a) on-chain lens LIST subscription counts / LIST_ENTRY graph concentration (public by construction — this is the one genuinely new measurement EFS enables vs email); (b) shipped-default manifests of known clients (C2 makes them public data — enumerable); (c) gateway serving-lens disclosures (C1). Add: "the canary is a proxy; concentration can hide below it."

### A2. C1–C5 bind only the willing. **Survivable (inherent).**
The dominant client is precisely the one with the least incentive to conform (disclosure, eject, published defaults all reduce its editorial power). There is no protocol surface that detects or punishes a nonconforming client, and there shouldn't be (that would be worse). The Warpcast precedent the doc itself cites is a client that would have failed C2 and thrived anyway.
**Fix inside design: partially.** State the enforcement mechanism honestly: conformance is *reputational + competitive* — a nonconforming client can be forked-around because the substrate is shared (unlike Farcaster, where the data moat rode the client). One sentence; the claim is defensible, the silence isn't.

### A3. The SDK-default loophole. **Serious.**
§1.2 says "clients ship defaults; the protocol ships none." The SDK is neither — and it is upstream of most clients. If the reference SDK ships a default lens list, default starter-pack market source, or default relayer list as *code*, every downstream client inherits an invisible default that satisfies the letter of C2 for no one. This is the single most likely mechanical path to the monoculture: not a hostile platform, but EFS's own convenience defaults metastasizing. (The relayer analogue: SDK "takes a relayer list with failover" — whose list is in the box?)
**Fix inside design: yes, one clause.** Extend C2/C3 explicitly to the SDK and reference clients: the SDK ships **no** default lens and **no** default relayer endpoint; reference-client defaults are published-on-EFS artifacts under the same disclosure/eject rules; example code uses placeholder endpoints that fail loudly.

### A4. "Fork = copy a LIST" conflates the artifact with the labor. **Survivable.**
§1.3 claims "C2 makes every default forkable at zero switching cost." True for the *subscriber* switching lenses; misleading for the *ecosystem*: forking a curated lens copies a snapshot that starts decaying immediately — the valuable good is the update stream (the doc knows this: "curation is labor"), and Gmail's corpus was never the artifact. Forkability disciplines a curator's *pricing and policy* (credible exit threat); it does not replicate curation capacity.
**Fix: yes** — say exactly that sentence instead of "zero switching cost."

### A5. The "three quarters" shrinkage is rhetoric. **Survivable.**
§1.1's decomposition is genuinely good (S1 lens-free by construction is the strongest single point in the doc). But "most of the mission's reads are S1/S2" and "shrinks by ~three quarters" are asserted, not measured — and the web analogy cuts back: users reach S1 containers *via* S4 (search/discovery). If discovery is the funnel to everything, the cold-start quarter is the front door, not a quarter.
**Fix: yes** — keep the decomposition, drop the fraction, add: "S4 is small in read *volume* and large in read *causation*; the funnel position is why starter-pack capture (§6) is ranked high."

---

## B. Relayer economics under adversarial token incentives

The §2.3 admission menu and the token-farm end-to-end walk are the strongest applied-economics content in the doc; the Laurie–Clayton framing (deny reach, not existence) is correct and corpus-grounded. Three holes:

### B1. Curation bribery — the token attack goes around the relayer, into the lens. **Serious.**
The §2.3 walk assumes farmers, blocked at relayer admission, "self-pay gas and flood the chain directly," where lenses deny them reach. But the walk hands the attacker their next move in its own text: **reach = lens membership, and lens membership is purchasable.** If a rewards protocol pays per publish-with-presence (tea.xyz paid on *registry presence + dependents*; attention-mining tokens pay on *reach*), the profit-maximizing farmer doesn't fight the relayer — they pay lens curators for inclusion (follower markets, SEO link farms, paid app-store placement: this market always emerges). Two-sided damage: (a) spam is now *inside* trusted lenses — strictly worse than chain flood, because it defeats the one defense the whole doctrine leans on; (b) where relayers use **lens vouching** as an admission credential (§2.3 menu row 3), the same purchase ALSO buys sponsored gas — the credential and the reach collapse into one bribable point. §1.3 gestures at "watch for concentration coupling" but never names bribery.
**Fix inside design: yes — the sovereignty escape works, but only if wired up:** (1) relayers MUST treat lens-vouching admission as *revocable in bulk* (curator found selling inclusion → de-admit the whole vouched cohort; cheap, since admission is relayer state); (2) lens manifests SHOULD declare paid-inclusion policy — a lens that sells slots and says so is an ad channel, a lens that sells and doesn't is fraud the market can punish (subscribers fork away: this is where A4's "exit disciplines policy" actually cashes); (3) add **"curation bribery / paid-inclusion capture"** to the §6 register with the counter: per-viewer composition means a captured lens loses subscribers, not the network — but detection lag is real and undetected capture is reach. The honest sentence: *lenses move the spam fight from gas prices to curator integrity; curator integrity is purchasable and the defense is plural curators plus cheap desertion, not incorruptibility.*

### B2. Sponsored-replay drain. **Survivable (fix trivial, but it must ship).**
§4.1 lists idempotent resubmission as an improvement ("front-running lands *their* state at *your* cost") — true on-chain, inverted at the relayer edge. Envelopes are public data once admitted anywhere. An attacker scrapes Alice's admitted envelopes and feeds them to every relayer that sponsors Alice: each submission is a *valid, admission-passing* envelope that lands as an idempotent no-op — the relayer pays ~21k+ gas for nothing, and per-identity budget accounting debits *Alice*. Zero cost to the attacker, kills the free tier for targeted authors (budget-drain griefing variant the §2.3 threat model missed: shape 2 executed *through* shape "replay," attributed to the victim).
**Fix inside design: yes:** reference relayer MUST (a) check `(author, seq)` against chain state before submitting (one RPC), (b) keep a submitted-digest dedupe cache, (c) never debit budgets for already-admitted envelopes. Add one row to the §4.1 delta table: "idempotency is free for the chain, not for whoever pays gas for no-ops — dedupe is a relayer conformance rule."

### B3. The 50-LoC claim and the admission menu pull in opposite directions. **Survivable.**
Signature-check-and-submit is 50 LoC. A relayer that survives B1/B2 plus token-farm pressure runs: aged-identity lookups, funded-account checks, per-identity budget state, dedupe cache, vouching-lens subscription + revocation watch, abuse ops. That is a stateful service with a database and an on-call human. "Plurality by cheapness" (§2.4 rule 2) is the load-bearing anti-gatekeeper argument, and under adversarial load the cheap relayer is drained and the surviving relayer is expensive — concentration pressure at the relayer layer mirroring §1.3, unnamed.
**Fix inside design: yes:** (1) honesty sentence: "the 50-LoC floor is the *protocol's* guarantee; the *market's* equilibrium under attack is fewer, heavier relayers — acceptable because R1 makes relayer concentration a UX oligopoly, never a data/identity one" (this is actually the design's best card and it's not played); (2) ship the reference relayer with the cheap-but-effective default pair (funded-account OR aged-identity — both checkable via one RPC, no state) so the entry-level relayer stays near the floor.

### B4 (attempted, failed): relayer-as-farmer double-dip; storage-as-product freeloading; admission-credential resale. All land in "pays own gas → admitted, unreachable, unrentable" (R6) or linear-cost admission. No finding.

---

## C. The self-submit censorship floor on real single-sequencer L2s

§2.5 is the most honest censorship treatment I have seen in this corpus — the three named holes, the training-knowledge flags, and the recursion trap are all real and correctly stated. The layer table survives. What it misses:

### C1. The revoke-selective sequencer — the floor's blind spot is *inside the read-grade table*. **Serious.**
A single-sequencer L2 filters by **content**, cheaply and selectively. The highest-value record to censor is not a post — it is a **REVOKE** (and its sibling, the fresh CHECKPOINT that would prove the revoke's existence). Scenario: author's key leaks; attacker (or attacker-bribed / attacker-operated sequencer — several "hundreds of L2s/L3s" targets are one-operator chains) suppresses the author's REVOKE txs while admitting everything else. Now §3.7's home-chain column asserts "Is C revoked? **Certain** — one lookup, live." Every reader grades the venue as ground truth while it serves revoked-in-intent data as LIVE-with-certainty. The force-inclusion counter exists but is (a) author-initiated, (b) L1-priced, (c) hours-delayed — and *readers have no signal to look elsewhere*, because the venue is "live" and "certain." The table's "certain" quietly means **certain over admitted state, not over author intent** — nowhere stated, and the omission is exactly where a copied-chain reader's paranoia (checkpoint age displayed) exceeds a home-chain reader's (none).
**Fix inside design: yes, three pieces, no machinery:** (1) table footnote, normative: home-chain revocation certainty = certainty over *admitted* state; on floor-bearing chains the suppressed-revoke window is bounded by the force-inclusion delay (~hours–1 day); on floorless chains it is unbounded. (2) Doctrine: REVOKEs SHOULD be broadcast **multi-venue by default** — a revoke is self-verifying and anyone can submit it, so the SDK's revoke path submits to the home chain AND hands the envelope to couriers/other chains in the same act (cheap, and it converts the doc's own "any willing submitter" strength from a censorship counter into a standing practice). (3) Register entry: **"revoke-selective sequencer"** — the one censorship attack whose victim is the *reader*, not the author.

### C2. "Censorship must stop every possible submitter" — true at row 2, false at row 3, stated as if general. **Survivable.**
Coordinated *relayer* refusal must indeed stop every submitter. A censoring *sequencer* filters the envelope bytes in calldata — submitter-independent; a thousand willing submitters change nothing. The bolded sentence sits in row 2 but reads as the section's thesis, and a doc adopter will quote it against row-3 adversaries where it's wrong.
**Fix: wording** — scope the sentence to sponsorship-layer censorship; the sequencer-layer counters are exactly two: force inclusion and another chain.

### C3. Willing-submitter legal exposure. **Survivable.**
Row 2's counter ("hand the envelope to ANY willing third party") assumes willing third parties are safe. Under sanctions-shaped coordination (the row's own example) submission-for-a-sanctioned-author is facilitation exposure in the coordinating jurisdictions — the pool of willing submitters is "anyone outside the sanctioning bloc," which is still the strength (it's the Tor bridge model) but is not "anyone."
**Fix: one sentence** in §2.5 or the §5 relayer row.

### C4. No home-chain migration story. **Survivable (but name it).**
The last row says home-chain currency is "delayed until some chain admits them" — for a *permanently* censoring or dead home chain, what happens? The author's slot-supersession and revocation-certainty venue is wherever readers look for it; readers keep reading the old venue as author-silence forever. Since no fork-choice/HEAD currency is sold (correctly), migration cannot be protocol-adjudicated — but it can be a *convention*: a signed "home moved to chain X as of seq N" record, published on the new venue and couriered everywhere (it's just a record; the old sequencer can't stop other chains from carrying it). Readers' lenses/couriers learn the new venue; old-venue-only readers degrade to checkpoint-grade — which is the honest outcome.
**Fix inside design: yes** — one paragraph in §2.5 or §3.6, plus a line in the courier duties.

**What survived here:** the Stage-0/validium hole, the L3 recursion, the L1-gas pricing of the floor, force-inclusion-as-delay — all already named by the target with correct honesty. I verified the arch-B TID/admission basis exists (arch-B lines 150, 204). The §2.5 [training-knowledge] flags are correctly placed and §7.3 correctly demands verification.

---

## D. Expiry doctrine vs the package-registry case

This is where the doctrine takes real damage. Walked concretely: publisher P ships package `lib` on EFS. The DATA bytes per version are objects (no expiry — correct). The mutable pointer (`latest → v4.2.0`, or a dependency pin consumed by builds) is a claim in the 30–90d class.

### D1. The revocation-latency window, and the seatbelt that doesn't reach the grade. **Serious.**
Day 10: v4.2.0 found malicious; P revokes on the home chain. A replica reader holds P's log through checkpoint N = day 9. §3.7 grades the pin **LIVE-as-of-N** (unexpired, non-inclusion proven), checkpoint age displayed: *one day* — reads as fresh, installs malware, for up to 80 days. The seatbelt (checkpoint-age display) measures the right quantity and does nothing: a *recent* checkpoint bounds staleness without bounding harm, couriers are SHOULD, pull-latest is SHOULD, and "recent checkpoint" in the composite row is undefined — there is **no normative maximum staleness at which LIVE-as-of-N stops being renderable as live, per data class**. Meanwhile npm's equivalent (registry takedown) propagates in minutes-to-hours. Expiry bounds *author silence*; nothing in the doctrine bounds *revocation latency* normatively.
**Fix inside design: yes — the pieces already exist upstream and weren't ported.** The carrier decision (line 220, 250) has **per-lens freshness horizons** as part of the Etched replicated-read rule. Port them into §3.5/§3.7: (1) the composite grade takes a freshness horizon H (per-lens or per-class); checkpoint older than H ⇒ **UNKNOWN-CURRENCY, not LIVE-as-of-N** — the horizon flips the grade, it doesn't decorate it; (2) for the safety-critical class, §3.6.3 upgrades SHOULD→**MUST**: a gate/installer acting on 30–90d-class data MUST pull the author's home chain when reachable, and MUST degrade to UNKNOWN-CURRENCY (fail closed or warn, per app) when not; (3) default H for the safety class: hours, not days.

### D2. The opt-out equilibrium — the flagship class will decline its own fuse. **Serious.**
Package registries are *immutable-version* ecosystems: npm/crates/PyPI never expire artifacts, and consumers pin versions for reproducibility. Under the doctrine, a 90-day expiry on pins means every downstream build fails closed at day 90 unless the publisher's cron renews (left-pad by cron failure; renewal-death cliff hits every abandoned-but-fine package — the npm norm is *unmaintained and harmless*). Ecosystem response is predictable: publishers set expiry=0, tooling defaults follow, and the security-critical class lands exactly in the **eternal-freshness default** the doc names — by choice. The doctrine's protection is opt-in, and the class it was built for has the strongest incentive to opt out.
**Fix inside design: yes — split the doctrine by mutability:** (a) *immutable version claims* (v4.2.0 = hash H): expiry **inappropriate** — permanence is correct, staleness is not the threat, *badness* is (→ D3); (b) *mutable pointers* (`latest`, dist-tags, live config, trusted-key lists): expiry appropriate, org-with-CI persona real, D1 horizons apply; (c) name the adoption risk in §3.3 plainly: "expiry only protects ecosystems that adopt it; the reader-side horizon (D1) is the layer that works without publisher cooperation — which is why it, not expiry, is the MUST."

### D3. The deferred deny-semantics is load-bearing here, and the doc doesn't say so. **Serious.**
What actually protects package consumers in every deployed ecosystem is the **advisory database** — a deny-list (RustSec, GitHub Advisories, npm audit, OSV): third parties assert "version X is bad" and *tooling subtracts*. EFS v2 lens composition is allow-shaped first-attester-wins; §1.4 defers deny entries as a pre-freeze question, and §3 builds the whole safety story on the two author-side levers (revoke, expire) — both of which fail when the author is absent, unaware (CVE found by a third party), or *is the attacker* (D4). For the package case the author-side levers are the weak pair and the deny-side lever is the proven one, and it's the one EFS deferred. The two sections never cite each other.
**Fix inside design: yes, without touching protocol:** (1) an advisory is just a claim by a security author (kind + body naming the target claim/object id) — needs no new kernel surface; (2) conformance convention now: clients/tooling consuming package-class data MUST compose subscribed advisory lenses as **deny-filters after allow-resolution** (client-side subtraction — legal today, exactly how Bluesky labelers compose); (3) §7.1's pre-freeze deny question gains the package case as its forcing example; (4) §3 doctrine sentence: "revocation and expiry are author-side; safety-critical consumption additionally requires third-party advisory subtraction, which is deny-shaped — see the lens deny fork."

### D4. Key compromise — the missing threat that dominates this exact use case. **Serious (the biggest substantive gap in the doc).**
§3 never contains the words "key compromise." The classic *reason* TLS has both revocation and short validity — the precedent §3.3 leans on — is compromised keys. The dominant real-world package-registry attack is publisher-account takeover (event-stream, ua-parser-js). Walk it under v2: attacker holds P's bare-EOA key. (a) Expiry: useless — the attacker renews (and re-points `latest` at malware with a fresh 90-day fuse; the ladder (D5) even lets them do it hands-free). (b) Revocation: a same-key war — P revokes attacker claims, attacker revokes P's revokes' effect by re-asserting at higher seq; slot supersession by (seq, idx) means **whoever signs latest wins**, and both are "the author." (c) Duplicity: only fires on same-(seq) conflicts; an attacker using fresh seqs is indistinguishable from the author, forever. (d) Rotation: none — bare-EOA is first-class, KEL is reserved; the identity is unrecoverable and *unretirable* (a "this key is dead" record is exactly as authentic from the attacker, who can also pre-revoke it). The honest status: **v2 has no answer to key compromise beyond lens-level distrust after out-of-band detection, and expiry — sold as the fuse for safety-critical data — does nothing against it.** That is a defensible v2 posture (it is exactly what the reserved KEL machinery buys, and the substrate decision's "author-signed completeness binds only honest authors" already implies it) but an *ops-honesty* doctrine that builds a safety table without stating it is not honest at the one point where its flagship use case actually bleeds.
**Fix inside design: yes — honesty, not machinery:** (1) §3 sentence, verbatim-grade: "Expiry and revocation defend against *withheld propagation* and *author silence*. Neither defends against key compromise: a compromised bare-EOA is the author, can renew, re-assert, and counter-revoke, and cannot be rotated in v2. The defense is lens-level: curators de-list compromised identities on out-of-band evidence. Scoped keys and rotation are the first purchase of the reserved KEL." (2) Register entry: **"same-key war"** — key compromise turns supersession into a signing race; detection is out-of-band; grade impact: none (that's the problem). (3) §3.7 gains one caveat row or footnote: every "Certain (ecrecover)" cell means "certainly *this key* — key-holder identity is out of scope." (4) Cross-reference from the package doctrine (D2/D3): advisories are also the working answer to compromised publishers — deny-lists don't care whether the author is absent or hostile.

### D5. The renewal ladder: two unexamined interactions. **Serious.**
The zombie-ladder trap is named and its mitigations are good (deterministic claimIds, revoke-all, K cap). Two things the design missed:
- **(a) The ladder inverts the fail-safe for exactly the class it serves.** Expiry's value proposition: safety-critical data must *actively affirmed* to stay live — silence fails safe. A K=12 ladder converts that to *actively denied* — the author's death, coma, or key loss no longer stales the data for K months; a compromised-then-recovered author must win a revoke-propagation race against their own pre-signed freshness (the exact propagation problem expiry exists to sidestep). Hands-free renewal of the 30–90d class is a contradiction in terms: the doctrine says this data needs a heartbeat, the ladder is a recorded heartbeat.
  **Minimal fix:** doctrine — the ladder is **prohibited for the 30–90d safety-critical class** (that class demands a live signer: CI hot key with documented risk, or a human); permitted for the ≤1y trust-claim class with the existing mitigations; cap K such that ladder horizon ≤ the class's expiry ceiling.
- **(b) `prev` was never considered.** Envelopes chain by `prev` (arch-B line 144: tamper-evidence; contiguity gives hash-chain integrity). K pre-signed rungs must fix their `prev` at signing time — but the author keeps writing envelopes for K months, so every rung's `prev` is stale on arrival: the log is permanently non-contiguous, degrading exactly the "log-scoped-through-checkpoint" verifiability §3.6 blesses, and rungs cannot carry the free-riding checkpoints the SDK appends (state root unknowable months ahead) — so heavy ladder use ALSO stretches checkpoint cadence, worsening D1's horizon for that author. Admission survives (prev mismatch is tolerated, seq orders), but the doc's own replication-grade doctrine downgrades the result and nobody noticed.
  **Minimal fix:** flag to the envelope red team (the doc already routes expiry placement there — add prev-semantics-under-pre-signing to the same docket); SDK rule: ladder rungs chain `prev` to each other (rung k → rung k−1), declared as a detached side-chain; document that ladder-heavy authors get coarser checkpoints.

---

## E. Read-grade table completeness

### E6. THE LOUD ONE — the checkpoint dependency is unreconciled with the settled direction. **CONDITIONALLY FATAL to §3. Reconcile before any doc adopts it.**
Everything in §3.6/§3.7/X1/X6 — "not revoked as of seq N," non-inclusion proofs, checkpoint age as the seatbelt, courier duties ("forwards REVOKEs and checkpoints"), the offline-bundle column, my own D1 fix (freshness horizons) — mechanically requires **author-signed checkpoint records** (signed state root over the active claim-set). Two ground-truth documents disagree on whether they exist:
- **Carrier decision** (the ruled kernel sketch): op=2 CHECKPOINT is in the Record enum (line 115–116); the kernel stores `latestCheckpointId` per author (line 185, 207); the Etched replicated-read rule says "non-inclusion against A's checkpoint" is what makes proven-absent checkable (line 220); per-lens freshness horizons ride on it (line 250).
- **Settled direction** (James, 2026-07-07, trumps): "No cross-chain currency sold (**no HEAD/CHECKPOINT machinery**, no earliest-anchor fork choice in frozen semantics)."

Reading (a): "no HEAD/CHECKPOINT *machinery*" kills head-currency semantics and fork choice — protocol never adjudicates which checkpoint is "the" head, never promises freshness from one — while CHECKPOINT *records* survive as informational grade-bounds. Under this reading the ops doc is consistent and §3 stands (this is also the only reading under which the settled direction's *own* read-grade clause — "proven-absent vs unknown" — remains checkable off the home chain, per the carrier decision's line-220 rule; the two clauses of the settled direction otherwise conflict with each other).
Reading (b): op=2 is dropped from the frozen kernel. Then: no signed state roots → no non-inclusion proofs → "not revoked as of N" is only obtainable by possessing the author's **complete contiguous log** and checking the prev-chain (O(full log), no spot-verification, and broken for any ladder-using author per D5b) → the copied-chain column of §3.7 collapses to UNKNOWN-CURRENCY for practical purposes, the courier design loses its cargo, the offline-bundle column loses its bound, and X6's "log-scoped-through-checkpoint" is vapor. §3 would need a structural rewrite, not a patch.

I believe reading (a) is intended (the carrier decision is the ruled kernel sketch, same date, and reading (b) makes the settled direction self-contradictory). **But the ops doc adopted checkpoints silently, without flagging the dependency, in a corpus whose substrate decision spent a page killing checkpoint-adjacent machinery.** That silence is the defect.
**Minimal fix:** one paragraph in §3.1: "This doctrine requires CHECKPOINT records as *informational, author-signed grade bounds* (carrier decision op=2). It does not require — and must never acquire — head-currency or fork-choice semantics from them: a checkpoint bounds staleness, never proves freshness; competing checkpoints are duplicity evidence, not a resolution problem. If the freeze drops op=2, §3.6–3.7 are void and must be redesigned around full-log possession." Plus: get the reconciliation ruled explicitly by James/the kernel spec before freeze. **Also carry the substrate decision's caveat with it:** author-signed completeness binds only honest authors with uncompromised keys (→ D4) — a checkpoint from a leaked key proves nothing about the true author's revokes.

### E1. Missing disposition: EQUIVOCAL. **Serious.**
The kernel detects and evidences duplicity — same (author, seq), different digest, portable proof (arch-B 149); cross-chain log forks are "surfaced as multi-value reads, never silently merged" (arch-B 272); the settled direction dropped earliest-anchor fork choice, so there is *no protocol winner* between fork branches. The read-grade set (LIVE / REVOKED / STALE / UNKNOWN-CURRENCY) has nowhere to put a claim from a forked region of an author's log: a venue holding branch A grades it LIVE while branch B exists elsewhere with equal authenticity. For "THE honest table," authenticated-but-equivocal is a missing truth value — and it is the grade that key compromise (D4) and cross-chain author forks actually produce.
**Fix inside design: yes — the evidence machinery exists, only the vocabulary is missing:** add **EQUIVOCAL**: duplicity evidence exists covering this claim's (author, seq) region ⇒ never LIVE regardless of venue; display both branches (multi-value read); lens-level trust action is the resolution path (already doctrine). One row in §3.5, one line in §3.7's reader-duty row ("check duplicity evidence for the author — it is portable and anyone may have filed it").

### E2. STALE's display rule slanders live authors on lagging venues. **Serious (trivial fix).**
§3.5: STALE displays as "author went silent." On a replica whose checkpoint predates the author's renewal, the claim is STALE-at-this-venue while the author renewed on time at home. The doc's own venue-relativity (§3.7) applied to its own UI rule: "went silent" is a *global* assertion no single venue can make — precisely the grade inflation X-rules prohibit, pointed the other way.
**Fix:** display = "no renewal known to this venue (completeness horizon: N, age X)"; "author went silent" is only assertable at a live home-chain read past expiry. Two sentences.

### E3. "Recent checkpoint" undefined → merged into D1 (freshness horizons flip the grade).

### E4. Missing disposition: bytes-unavailable. **Survivable.**
The storage-depth decision (state vs events+commitments) is deliberately open (§4.2). Under the events/commitment outcome, a venue can hold an authenticated claim whose DATA payload is unfetchable there. No grade covers "authentic pointer, absent bytes."
**Fix:** placeholder disposition (UNRESOLVED-BYTES or a flag orthogonal to currency), marked storage-depth-dependent, so the table doesn't silently assume the state outcome its own §4.2 refuses to assume.

### E5. SUPERSEDED never named. **Survivable.** Slot semantics handle it mechanically; non-slot claims "take latest unrevoked" — the *old* assertion's disposition needs one line (it is neither STALE nor REVOKED; it is superseded-at-this-venue, subject to the same as-of-N humility as row 4).

**What survived:** the LIVE/REVOKED/STALE/UNKNOWN-CURRENCY core is sound; pre-revocation (X7) is a genuine catch — I verified no prior doc states it and the convergence argument for it is correct; the "authenticity is unconditional" column is right (modulo the D4 footnote); the offline-bundle column is honest.

---

## F. Spam posture without EAS

The §4.1 delta table survives scrutiny: idempotency, submitOne, free identities, and TAGDEF floods are correctly assessed (TAGDEF unowned+idempotent ⇒ no squatting economy is right, and the enumeration residual is correctly demoted at birth). Index-shape classification (§4.2) is the strongest section in the doc — the primary-vs-demoted table with the verification-order rule is adoption-ready. Attacks tried:

- **Cheap-gas regime + storage-depth interaction. Survivable.** "Posture valid under either outcome" is true for *containment* (index shape and lenses are price-independent — that's the inscriptions lesson correctly applied). But under the events+commitments outcome plus blob-fee troughs, per-record cost can fall 10–100×, and "gas meters" (S1's first clause) approaches "gas whispers." The doctrine's defense doesn't break — it was never price-dependent — but S1's wording lets a reader believe the meter is load-bearing. **Fix:** one sentence: "the meter's height is chain policy and may approach zero; nothing in the posture depends on it staying high."
- **Duplicity-event flooding:** requires valid signatures on conflicting own-seq pairs — self-inflicted evidence, no third-party surface. No finding.
- **Registry growth via mass TAGDEF/object mints:** priced by gas, point-lookup only, monitored-not-defended — consistent with the posture. No finding.
- **Per-author index sybil (1M authors × 1 record):** hits only demoted surfaces and node storage; contained by design. No finding.
- **Shared-namespace squatting:** lens-relative resolution means a squat only "wins" for viewers whose lens admits the squatter — the owned-DATA/unowned-TAG duplicate-policy split (tag-core traps) holds. No finding.
- **The honeypot displacement** (§4.1 row 5: "the real new spam surface is the relayer") is correctly identified; findings B1/B2 are the cash-out of that row — the doc pointed at the surface and stopped one step short of the two concrete attacks.

**Net: spam posture holds.** With B1/B2 folded in at the relayer edge, this is the best-defended section of the doc.

---

## G. What survived (attacks attempted, no finding)

For the next phase's calibration — these were tried and the doc held:
1. **S1 lens-free-by-construction** (author-first default): could not break it; it is the doc's strongest structural claim and the correct scoping of the bootstrap problem.
2. **Relayer-mortality invariant** (§2.2): format-level, verified against the envelope design; relayer death genuinely cannot strand data or identity. The doc's best card.
3. **Genesis/protocol default-lens prohibition**: correct and complete; no bypass found (the SDK bypass is A3, adjacent but distinct).
4. **PoW prohibition**: evidence-based, correctly final.
5. **The token-farm end-to-end walk's on-chain half**: paid spam admitted-but-unrentable is right; the walk only misses the lens-purchase branch (B1).
6. **§2.5's three named holes**: all real, all correctly stated; the training-knowledge flags are exactly where they should be.
7. **Expiry placement Option B disqualification** (stripped-expiry copy): the attack is real and the disqualification correct; Option A's freeze-window routing is proper process.
8. **X7 pre-revocation**: correct, novel, and necessary — the convergence argument is airtight and the ladder-kill genuinely depends on it.
9. **§5 operator tiers**: the tier table's exposure ordering and the "we can stop serving it, we cannot make it never have been published" posture survive; the [verify] flags are honest. (One addition routed via C3: willing-submitter exposure.)
10. **TID future-dating bound**: verified real (arch-B line 150) — the ladder's maturity gating has a basis; note it is an *admission-time clock* and does not contradict "storage is clock-free" (expiry) — checked, no contradiction.

---

## H. Demanded register additions (§6)

| Name | Source | One line |
|---|---|---|
| **Curation bribery / paid-inclusion capture** | B1 | Token incentives buy lens membership (reach + relayer admission in one purchase); counter = revocable vouching, disclosure, cheap desertion |
| **Sponsored-replay drain** | B2 | Public envelopes replayed to sponsors burn gas/budgets as idempotent no-ops; relayer dedupe is conformance |
| **Revoke-selective sequencer** | C1 | Home-chain "certain" is certainty over admitted state; a suppressed REVOKE serves revoked data as LIVE until force-included |
| **Same-key war** | D4 | Key compromise makes supersession a signing race both sides win alternately; no v2 rotation; lens distrust is the only exit |
| **Ladder fail-safe inversion** | D5a | Pre-signed renewals turn affirm-to-live into deny-to-kill for the class that exists because silence must fail safe |
| **Ladder prev-break** | D5b | Pre-signed rungs carry stale `prev`, permanently de-contiguating the log and coarsening checkpoint cadence |
| **Checkpoint-dependency ambiguity** | E6 | §3's grades require op=2 CHECKPOINT records; settled direction reads as dropping them; reconcile or rewrite §3 |
| **Lagging-venue slander** | E2 | STALE-at-this-venue displayed as "author went silent" asserts globally what one venue cannot know |
| **Fork-blind grades** | E1 | Duplicity evidence exists in the kernel but no read grade consumes it; EQUIVOCAL is the missing truth value |
| **SDK default capture** | A3 | Conformance rules bind clients; the SDK upstream of all clients ships the defaults nobody inspects |

---

## Final verdict

**HOLDS WITH MANDATORY REPAIRS.** No unconditional fatal: nothing found overturns the native-kernel direction, the relayer model, the censorship posture, or the expiry mechanism itself. One **conditionally fatal** item (E6) — the checkpoint-machinery ambiguity — must be reconciled explicitly before §3 is adopted anywhere; under the unfavorable reading, §3.6–3.7 are void. The doc's honesty framework is genuinely good; its failures are almost all *incomplete honesty* (key compromise unnamed, home-chain certainty overstated, canary unmeasurable, adoption-equilibrium unnamed) rather than wrong mechanism — and every serious finding has a minimal fix inside the existing design, most of them one paragraph. The package-registry case is the crucible: it takes D1+D2+D3+D4 together to serve it honestly, and the single most important repair is admitting that for that case the working defense is reader-side horizons plus third-party advisories, not author-side expiry.
