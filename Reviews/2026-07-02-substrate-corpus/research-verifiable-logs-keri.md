# Verifiable logs & portable identity without a blockchain
## Autopsies: Certificate Transparency / Trillian, Sigsum, KERI, Datomic — copy/avoid lessons for EFS

**Agent:** verifiable-logs-keri · **Date:** 2026-07-02 · **Status:** research report for the EFS substrate investigation
**Question under investigation:** how do deployed (or seriously specified) systems get "what exists / what's current" guarantees and durable *rotating* identity WITHOUT a full blockchain — and what should EFS copy or avoid?

Confidence markers: [PRIMARY] = read from a primary source this session; [COMMENTARY] = secondary source; [ASSESSMENT] = my synthesis; [VERIFY] = plausible but re-check before load-bearing use.

---

## 0. TL;DR verdict table

| System | What it proves without a blockchain | What it explicitly does NOT solve | One-line EFS takeaway |
|---|---|---|---|
| **CT / Trillian** | Existence + append-only history of a single-operator log, at web scale (billions of entries) | "What's current"; identity; revocation; and its own gossip story (never deployed — browser policy is the real backbone) | A verifiable log is now a static file layout + one signing key; the hard part is *non-equivocation governance*, which CT solved socially, not cryptographically |
| **Sigsum** | Offline-verifiable "this was published" proofs whose validity is *defined* as witness-quorum cosignature; spam control without payment (DNS rate limiting) | Currency; content storage (deliberately); rich semantics (deliberately) | The cosigned checkpoint is a portable, offline, no-RPC trust artifact — exactly the shape an EFS archival proof bundle should have |
| **KERI** | Durable, rotatable, ledger-free identity: self-certifying prefix + hash-chained key-event log + pre-rotation + witness receipts + first-seen + duplicity evidence | Global "current key state" (it is per-validator by design); adoption beyond one ecosystem (GLEIF vLEI); operational simplicity | The direct blueprint for EFS hard part (e); its first-seen policy is EFS's first-attester-wins wearing different clothes |
| **Datomic** | That an immutable accumulate-only fact model with retraction-as-new-fact is a *shipped, ergonomic* database — given ONE thing: a single writer imposing total order | Multi-writer / multi-substrate ordering (the transactor IS its blockchain); event-time vs recording-time (uni-temporal) | Revocation-without-deletion is a solved *data model* problem; the open problem is only *ordering*, and Datomic proves how much you buy once you have any total order at all |

---

## 1. Scope, method, staleness

Researched via primary specs and operator writeups fetched 2026-07-02. CT ecosystem material is current through ~mid-2025 (witness network, static-ct); KERI material through late 2025 (GLEIF hackathon, data-insights API); Sigsum docs are the project's own (design doc is labeled v0 with a shipped v1 ecosystem — noted inline). Nothing here depends on 2026-only events; where sources are older than ~18 months I say so.

Local context read: `planning/Designs/deterministic-ids.md`, `efs-v2-holistic-redesign.md`, `efs-v2-transition-plan.md` (v2 deterministic-ID design, replication models A/C, temporal-provenance workstream, first-attester-wins doctrine).

---

## 2. Certificate Transparency / Trillian — autopsy

### 2.1 Architecture primer

CT (RFC 6962; RFC 9162 "CT 2.0" — note: real deployments still run 6962 + the newer static API, not 9162) is an ecosystem of independent, single-operator, append-only Merkle-tree logs of TLS certificates. Core artifacts:

- **STH / checkpoint** — a signed (tree_size, root_hash) statement by the log.
- **SCT** — the log's signed promise to include a certificate within the **MMD** (maximum merge delay, typically 24h). Certificates embed SCTs; browsers require them.
- **Inclusion proof** — O(log N) Merkle path from a leaf to an STH.
- **Consistency proof** — O(log N) proof that STH₂'s tree is an append-only extension of STH₁'s.
- **Monitors** — parties that download *everything* and look for bad entries (misissued certs). **Auditors** — parties that check the log's promises (SCT ⇒ inclusion; STH ⇒ consistency).

Sources: [RFC 6962](https://www.rfc-editor.org/rfc/rfc6962.html) [PRIMARY], [RFC 9162](https://datatracker.ietf.org/doc/rfc9162/) [PRIMARY], [Emily Stark, CT bird's-eye view](https://emilymstark.com/2020/07/20/certificate-transparency-a-birds-eye-view.html) [COMMENTARY].

### 2.2 The uncomfortable truth: gossip never shipped; policy is the backbone

RFC 6962 hand-waves that split views are "detected by global gossiping." In practice:

- The IETF TRANS working group's CT gossip drafts **expired without deployment**. No browser ever shipped STH gossip. [ASSESSMENT, widely corroborated; see the survey literature below]
- Chrome's actual deployed mechanism is **opt-in SCT auditing**: for Safe-Browsing-enabled users, a small sample of SCTs is checked via k-anonymous lookup against Google's own view ([Chromium CT docs](https://chromium.googlesource.com/chromium/src/+/master/net/docs/certificate-transparency.md) [PRIMARY]). This detects a log breaking its SCT promise *to Google's view* — it is not decentralized split-view detection.
- What actually keeps CT logs honest is **browser log policy**: Chrome and Apple each maintain a list of approved logs, require SCTs from multiple *independent log operators* per certificate, and **disqualify** logs for any consistency violation ([Chrome CT log policy](https://googlechrome.github.io/CertificateTransparency/log_policy.html) [PRIMARY]). CT's non-equivocation guarantee is, at bottom, *two vendors' willingness to execute logs in public*.
- Academic work formalized what gossip should have been: [Aggregation-Based Gossip for CT](https://arxiv.org/abs/1806.08817), [Chuat et al. / related PKI gossip work], and Google's own [Think Global, Act Local: Gossip and Client Audits in Verifiable Data Structures](https://arxiv.org/pdf/2011.04551) (Meiklejohn et al., 2020) — the last of which is the intellectual bridge from "reactive gossip" to "proactive witnessing" and is the design ancestor of today's witness network. The cosigning idea itself goes back to [Syta et al., "Keeping Authorities Honest or Bust" (CoSi, 2015)](https://arxiv.org/pdf/1503.08768) [PRIMARY papers].

**Lesson (the biggest single one in this file):** *reactive* verification schemes that require clients to talk to each other, or to phone home later, do not get deployed — for privacy, latency, and incentive reasons. Fifteen years of CT converged on **proactive witnessing**: make the artifact invalid-by-construction unless independent parties already cosigned it. Design the trust artifact so that verification is local and offline.

### 2.3 Split-view mitigation as actually built: the witness network

- A **witness** holds O(1) state per log (the last checkpoint it cosigned), demands a consistency proof for each new checkpoint, and cosigns iff append-only holds. A quorum of witness cosignatures on one checkpoint means: everyone who trusts that quorum sees *the same history*. ([transparency.dev, "Can I Get A Witness (Network)?"](https://blog.transparency.dev/can-i-get-a-witness-network) [PRIMARY])
- Protocol surface is standardized as small C2SP specs: **tlog-checkpoint** (checkpoint format), **tlog-witness** (witness API), **tlog-tiles** (storage). Witnesses are content-agnostic — they never parse log entries. ([C2SP](https://github.com/C2SP/C2SP) [PRIMARY])
- **OmniWitness** (witness-everything software) came first; **Armored Witness** is the hardened iteration: ~15 open-hardware, reproducible-firmware devices with custodians worldwide, cosigning Go sumdb, Sigstore, Sigsum, CT-adjacent logs. [PRIMARY, same transparency.dev post; count as of the post — VERIFY current count if load-bearing]
- Filippo Valsorda's [litetlog](https://github.com/FiloSottile/litetlog) shows a witness is now a *weekend-sized* piece of software compatible across the Sigsum and Omniwitness ecosystems.

**Lesson:** witnessing is cheap (O(1) state, no content inspection) precisely because **log identity, data identity, and witness identity are cleanly separated**. EFS has already internalized the same separation instinct (no schema UIDs / resolver addresses in ID derivations); keep it for any witness-shaped layer.

### 2.4 The static/tile revolution: logs became files

- Russ Cox's [Transparent Logs for Skeptical Clients](https://research.swtch.com/tlog) [PRIMARY] is the founding document: store the Merkle tree as fixed-size **tiles** served as static files (`/tile/H/L/K`); clients fetch tiles and compute their own inclusion/consistency proofs; a client holds its last (size, root) and verifies the new tree extends it — the **lock-step / "the server must keep up the lie forever"** model. Deployed at scale as the **Go checksum database** (sum.golang.org): one operator, no blockchain, hundreds of thousands of modules, verify-don't-trust for every `go get` on earth.
- CT itself adopted this: the [static-ct-api C2SP spec](https://github.com/C2SP/C2SP/blob/main/static-ct-api.md) (née "Sunlight API") serves the whole log as tiles from an S3 bucket + CDN; the only stateful component is the tiny sequencer that signs checkpoints. Implementations: [Sunlight](https://sunlight.dev/) (Filippo, [lessons-learned post](https://blog.transparency.dev/i-built-a-new-certificate-transparency-log-in-2024-heres-what-i-learned)), Cloudflare's [Azul](https://blog.cloudflare.com/azul-certificate-transparency-log/) on Workers, Itko. Chrome's log policy now admits static-ct-api logs. [PRIMARY]
- **Trillian is in maintenance mode**; Google directs new log operators to **Tessera** (tile-native successor) ([google/trillian README](https://github.com/google/trillian) [PRIMARY]). The gRPC-database-server generation of transparency logs is over.

**Lesson:** the log data plane converged on *dumb static storage + client-side proof computation*. That is exactly the LOCKSS-compatible shape EFS wants: a log that is "just bytes in a bucket" can be mirrored anywhere, including onto chains, IPFS, or tape. The signing head (sequencer + key) is the only non-replicable part — which is precisely the part a witness quorum disciplines.

### 2.5 Log mortality: the ecosystem is designed for its logs to die

Andrew Ayer's [How CT Logs Fail and Why It's OK](https://www.agwa.name/blog/post/how_ct_logs_fail) [PRIMARY] documents the failure ecology: since 2016 — excessive downtime (2016), key shared between prod and test logs (2016), database rollback breaking append-only (2017), operator simply vanishing (2017), failure to include submitted certs (2018 ×2), suspected key compromise (2020), and the famous **Yeti 2022** incident: a single bit flip in entry 65,562,066 ("hardware error or cosmic ray") made the log *mathematically unrecoverable* — fixing it would require a SHA-256 preimage. Detected by a monitor (Cert Spotter) on 2021-06-30 recomputing the root.

Why none of this kills the ecosystem:
- **Temporal sharding**: logs cover issuance-year shards; they are *born scheduled to die*.
- **Redundancy in the artifact**: certs carry 2–5 SCTs from independent operators; browsers require at least one from a currently-approved log.
- **Retired ≠ distrusted**: a dead log's old SCTs keep counting for the issuance-time requirement.
- **Monitors retain the data**: the certificates themselves outlive every log that carried them (see also [ct-archive](https://github.com/geomys/ct-archive)).

**Lesson (maps 1:1 onto EFS mission property 2):** *the data must outlive the log; the log is a mortal witness, not the archive.* CT achieves "data outlives any single substrate" not by making logs immortal but by (a) putting multiple independent proofs in the artifact and (b) having an economy of full-copy monitors. EFS's chains-as-DA-substrates framing is the same move; the design consequence is that **EFS proofs attached to data should reference N independent substrates/witnesses, not 1 chain**.

### 2.6 "What's current": verifiable maps died; key transparency is the one survivor

- Trillian's **verifiable map** (sparse Merkle key-value tree, giving "what is the current value for key K, with non-inclusion proofs") was **deprecated and removed** — `MAP` is a reserved tombstone in [trillian.proto](https://github.com/google/trillian/blob/master/trillian.proto) [PRIMARY]. The associated Google **Key Transparency** project stalled and its repo was archived [ASSESSMENT/VERIFY repo status; the map removal is primary]. Root cause per the docs and postmortems: maps at scale were operationally brutal (full-map revisions, huge sparse trees), and *the map alone proves nothing about history* — you need a **log-backed map** ("map of logs" / log of map roots) to prove correct evolution over time ([Trillian Verifiable Data Structures doc](https://github.com/google/trillian/blob/master/docs/VerifiableDataStructures-Latest.md) [PRIMARY]).
- The one deployed success for "current value of a key, verifiably": **key transparency** in messengers. WhatsApp shipped an **Auditable Key Directory** (AKD, open-sourced, NCC-audited 2023) in 2023 ([Meta engineering](https://engineering.fb.com/2023/04/13/security/whatsapp-key-transparency/) [PRIMARY]); **Cloudflare acts as third-party auditor** of its epochs ([Cloudflare](https://blog.cloudflare.com/key-transparency/)); Messenger followed in Nov 2025 ([Meta](https://engineering.fb.com/2025/11/20/security/key-transparency-comes-to-messenger/)). Architecture: single operator maintains the map; *auditors* verify append-only epoch evolution; clients verify their own key. Design lineage: CONIKS.
- The Go module ecosystem answers currency differently again: the sumdb answers "what is the hash of module@version" (immutable key→value, no updates), and *currency* ("what's the latest version") is answered by an **unverified index** — they simply did not solve verifiable currency, and it mostly doesn't matter because keys are immutable. [ASSESSMENT]

**Lesson:** across the entire transparency ecosystem, **nobody has decentralized "what's current."** The shipped options are: (1) don't need it (immutable keys — Go); (2) single operator + independent auditors + self-lookup (WhatsApp); (3) full blockchain. What CAN be had cheaply without consensus is **freshness-bounded per-key currency from a single authority, checked by auditors** — plus per-author currency via monotonic counters (see KERI, §4.4). This cleanly triangulates EFS hard part (c): EFS currently buys global currency from chain consensus; any post-chain/portable story must degrade to per-author currency + witnessed freshness, and the design should make that degradation graceful rather than pretending witnesses give global currency.

### 2.7 The revocation lesson from the same industry (CA world)

Not CT proper, but the same ecosystem answered "revocation without a consensus substrate" twice and both answers matter:

- **Advisory revocation failed.** OCSP (ask-the-CA-if-revoked) died of privacy, latency, and soft-fail uselessness; Let's Encrypt announced the end of its OCSP service (2024-12, completed 2025), moving to CRLs/browser-summarized CRLite ([Let's Encrypt announcement](https://letsencrypt.org/2024/12/05/ending-ocsp/) [PRIMARY/VERIFY exact URL]). Browsers never hard-failed on missing revocation info — an advisory deletion signal that readers may ignore rounds to Nostr-grade deletion.
- **Expiry beat revocation.** CA/Browser Forum ballot SC-081 (spring 2025) steps maximum TLS certificate lifetime down to **47 days by March 2029** [PRIMARY ballot, VERIFY exact schedule]. The industry's considered answer to "we cannot reliably un-say things" is: **say things that expire quickly, and re-say them continuously.**

**Lesson for EFS hard part (a):** in a no-consensus setting, revocation should be modeled as (i) retraction-facts in an append-only per-author status log (see Datomic §5, KERI TELs §4.1), PLUS (ii) **freshness horizons on trust**: a claim's validity requires a sufficiently recent witnessed checkpoint of its author's status log. That converts "did the author revoke this?" from an unanswerable global-currency question into a bounded-staleness local check. Where even that is too weak, the CA lesson says: make the *claims themselves* short-lived and re-attested. (For a 100-year archive: *objects* immutable forever; *claims* — placements, endorsements — are the revocable/expiring layer. EFS's object/claim split already matches this; keep revocation strictly on the claim side.)

### 2.8 CT copy/avoid for EFS

**Copy:**
1. Tile/static log layout for anything log-shaped EFS ever publishes (bucket-servable, CDN-able, chain-mirrorable; clients compute proofs).
2. Proactive witness cosigning over any "current root" artifact; validity = quorum in the artifact itself, verification offline.
3. Multiple independent proofs embedded in the durable artifact (N SCTs ≈ N chains/witnesses per EFS proof bundle).
4. Temporal sharding + planned log death + retired-status semantics: design witnesses/substrates as mortal from day one.
5. Monitors as first-class ecosystem role (EFS indexers/lens curators are monitors; the acceptance test "reconstruct all state from logs alone" is exactly monitor-enablement).
6. The claimant model discipline ([Trillian claimant model](https://github.com/google/trillian/docs/claimantmodel/CoreModel.md)): write down precisely WHO claims WHAT, who verifies, and who acts — CT's clarity here is why the ecosystem's social layer works.

**Avoid:**
1. Any design step that says "gossip will catch it" — reactive gossip has a 0-for-15-years deployment record.
2. Verifiable maps as a load-bearing component (deprecated by their own inventors at scale).
3. Baking log/operator identity into data identity (log key rotation and log death must not orphan artifacts) — EFS's spec-owned-constants rule is the same principle; extend it to any witness layer.
4. Advisory-only revocation with no freshness bound (OCSP soft-fail redux).
5. Assuming the existence proof is the whole story: CT works because *browsers enforce* SCT presence. A verify-don't-trust design still needs an enforcement locus (in EFS: the reader/SDK MUST refuse unproven reads, or the proofs decay into decoration).

---

## 3. Sigsum — autopsy

### 3.1 Design: militant minimalism

[Sigsum](https://www.sigsum.org/docs/) logs **signed checksums** only. Leaf = {checksum, Ed25519 signature over it, SHA-256 hash of signer pubkey} (the v0 design doc also had a shard_hint for scheduled log shutdown; the v1 protocol simplified — [design doc](https://git.sigsum.org/sigsum/plain/doc/design.md) [PRIMARY], marked v0; the ecosystem runs v1 [VERIFY leaf details against the v1 spec if load-bearing]). **The data itself never enters the log** — "logging arbitrary bytes can poison a log with inappropriate content." No SCTs, no ASN.1, no reactive gossip-audit protocols; the stated pillars are minimalism, distributed trust via witnesses, centralized (simple) log operations.

### 3.2 Witnessing built into validity ("proactive gossip")

Witnesses poll the log ≥1/minute, verify freshness (≤5 min) and append-only via consistency proof, cosign, and the log centralizes the cosignatures. A tree head is **not valid unless cosigned by a quorum** — the gossip-audit model is *in* the artifact, not bolted on. Trade-off accepted openly: 5–10 minutes of publication latency. Witness state is O(1) per log; "all the potentially intensive verification is deferred and delegated to monitors." [PRIMARY, design doc + docs index]

### 3.3 Trust policies: quorum as a user-side, versioned text file

A [policy file](https://www.glasklarteknik.se/post/named-policies-for-sigsum/) [PRIMARY] names logs (key hash + URL), witnesses (name + key hash), groups, and a quorum rule (k-of-n over groups, composable). Named built-in policies (e.g. `sigsum-generic-2025-1`) are **immutable once released** — changed circumstances mint a new policy name, never mutate an old one. Verification of a proof = check leaf signature, inclusion proof, tree head, and quorum cosignatures against the policy. Policy selection is explicitly the *relying party's* decision.

### 3.4 Spam control without gas: DNS rate limiting

Submitters prove control of a domain via TXT record `_sigsum_v0.<domain>`; logs rate-limit **per second-level domain**; the domain hint is *not logged* (privacy). Acknowledged as imperfect, but it makes large-scale spam expensive with zero payment rails. [PRIMARY]

### 3.5 Offline proof bundles

The end-user verifier receives {data, metadata, proof = inclusion proof + cosigned tree head} out of band (e.g., inside a software release) and verifies **with no network access at all**: signature valid, tree head reconstructs, quorum cosignatures present. "A proof of public logging cannot be more convincing than the tree head an inclusion proof leads up to" — hence cosigning. [PRIMARY]

### 3.6 Sigsum copy/avoid for EFS

**Copy:**
1. **The proof-bundle shape**: EFS's archival read path ("from Codex + chain snapshot alone") should emit a self-contained, offline-verifiable artifact: bytes + claims + inclusion/consistency material + quorum-of-substrates attestations. This is what a 2126 reader actually holds.
2. **Quorum-as-policy-file, immutable named policies**: EFS's trusted-chain list (holistic-redesign §3.2) should be exactly this — a versioned, immutable, named policy document (published on EFS), with new names superseding rather than edits; lens-choosable by readers. Sigsum has already invented the stewardship format.
3. **Never log content** — validate references/hashes, keep bulk data in the storage plane. (EFS's DATA-identity-not-content and mirror model already conform; hold the line under any future log layer.)
4. **DNS-style borrowed-scarcity rate limiting** as the gasless-write spam answer: rent scarcity from an existing namespace (domain, funded L1 account, aged smart account) instead of inventing tokens/PoW. Directly applicable to the gasless-relay prize: the relayer rate-limits per recovered author identity, where identity admission required a scarce external credential.
5. **Delegate expensive verification to monitors; keep the hot path O(1)** — the EFS kernel/witness analog should verify structure, and lens-layer monitors do semantics.

**Avoid:**
1. Sigsum-grade minimalism *as a data model* — it works because Sigsum refuses to be a database. EFS is a database; copy the trust machinery, not the scope.
2. Latency-free illusions: witness quorums cost minutes. Any EFS "witnessed checkpoint" layer must declare its staleness window honestly (cf. deterministic-ids' honesty norms).

---

## 4. KERI — autopsy

### 4.1 Mechanism (what is actually specified)

Primary: [ToIP KERI specification](https://trustoverip.github.io/kswg-keri-specification/) [PRIMARY], [original whitepaper (Smith, arXiv 1907.02143)](https://arxiv.org/pdf/1907.02143), Finema's Hitchhiker's Guide [COMMENTARY].

- **AID (autonomic identifier)**: self-certifying identifier derived from the inception event (hash of the initial key material + config). "A primary root of trust... purely cryptographic," requiring "no trust in external entities or even any blockchain network."
- **KEL (key event log)**: a hash-chained, signed sequence of events — **inception, rotation, interaction** — with monotonic sequence numbers and prior-event digests. Key state = fold over the KEL. Anyone can verify a KEL anywhere ("ambient verifiability") because every event is signed and chained.
- **Pre-rotation**: every event commits to a *digest of the NEXT key set*. The next keys are unexposed until used; rotation reveals them and commits to the following set. Because only hashes of future keys are public, rotation authority is resistant to Shor-style quantum attack on exposed keys, and **recovery from signing-key compromise = rotate using the pre-committed unexposed keys** (superseding recovery; the spec's "SQAR" framing).
- **Witnesses & receipts**: in indirect mode the controller designates a witness pool (in the KEL itself); each witness signs a **receipt** of each event; receipts circulate; **KAWA** (KERI's Algorithm for Witness Agreement) defines an M-of-N satisfaction threshold with formulas for tolerating F faulty backers. An event is "fully witnessed" when M valid receipts exist. The **toad** (threshold of accountable duplicity) is the controller-declared M.
- **First-seen policy** (verbatim from the spec): *"first seen, always seen, never unseen"* — a watcher/validator accepts the first verifiable version of an event at each sequence number and rejects later variants. "Any later compromise of the authoritative key state... cannot produce an alternate version of the event that could supplant the First-seen version for a given watcher. Therefore, it is in the best interests of every honest AID controller to have its original version be accepted as first-seen as widely and as quickly as possible."
- **Duplicity**: "an alternate but Verifiable KEL for an identifier" — nonrepudiable signatures make equivocation *provable*. **Watchers** keep divergent variants; **jurors** record and share duplicity evidence; **judges** adjudicate. Consequence: "an honest validator MUST trust when there is no evidence of duplicity and MUST NOT trust when there is any evidence of duplicity unless and until the duplicity has been reconciled" — irreconcilable duplicity means the identifier is dead to that validator. Equivocation is punished by **total trust destruction**, not by fork-choice.
- **TELs (transaction event logs)**: secondary hash-chained state logs (e.g., credential issuance/revocation registries for ACDCs) **anchored into the KEL** via digest seals — the KEL's key state authenticates the TEL, and revocation is an appended TEL event, never a deletion ([trustoverip/acdc wiki](https://github.com/trustoverip/acdc/wiki/transaction-event-log) [PRIMARY]). BADA-RUN ("Best Available Data Acceptance" / Read-Update-Nullify) gives monotonic ordering rules for mutable non-KEL data associated with an AID [VERIFY details; thinner sourcing].
- **CESR**: a bespoke dual text/binary self-framing encoding for all primitives; mandatory across the suite.
- **Portability**: "the composition of the Witness pool is under the ultimate control of the AID's controller... the controller MAY change the witness infrastructure at will" (rotation events update the witness list). Blockchains "may take the roles of KERI witnesses and watchers" — a ledger is just one possible witness. `did:webs` binds AIDs into DID-land with the KEL as the source of truth ([ToIP did:webs spec](https://trustoverip.github.io/tswg-did-method-webs-specification/)).

### 4.2 What KERI genuinely achieves

- **Durable rotating identity from pure signatures.** The identifier survives arbitrary key rotation, algorithm migration (rotation events can introduce new key types), witness migration, and substrate death, because the *identity is the event log*, and the log verifies anywhere ecrecover-style — no contract, no chain, no ERC-1271. This is the only serious specified answer to EFS hard part (e) found anywhere in this investigation.
- **Per-identity currency without consensus.** "Current key state" = highest fully-witnessed, first-seen, duplicity-free sequence number. Monotonic sn + digest chaining + witness receipts gives each validator a *locally consistent* current state and makes equivocation evidence portable and damning.
- **Honest refusal of global consensus.** KERI does not pretend watchers give one global truth; it gives *per-validator* truth plus provable-duplicity deterrence. (Same philosophical move as EFS lenses: per-viewer trust scoping instead of global view.)

### 4.3 Honest maturity assessment

- **Production ≈ one ecosystem.** GLEIF's **vLEI** (organizational credentials chained to the LEI registry) runs KERI+ACDC in production since late 2022/early 2023 ([keri.one announcement](https://keri.one/keri-in-production-for-gleifs-vlei/), [GLEIF vLEI](https://www.gleif.org/en/organizational-identity/introducing-the-verifiable-lei-vlei)). Qualified vLEI Issuers as of late 2025: roughly 8–10 (CFCA, CERTIZEN, Finema, Provenant, SHECA, Toppan, TradeGo, Global vLEI...) — i.e., adoption is real but *regulatory-institutional and small*; GLEIF ran a global hackathon in Oct 2025 to stimulate an ecosystem and opened a data-insights API (Sept 2025). No consumer-scale or web-scale deployment exists. [PRIMARY GLEIF pages + COMMENTARY]
- **Standards home is ToIP, not IETF.** The IETF individual drafts (draft-ssmith-keri) expired; specs moved to the Trust over IP Foundation in Sept 2023 ([kentbull.com](https://kentbull.com/2023/09/15/keri-specifications-have-moved-to-the-toip-foundation/)) and went through public review in 2024. This is a niche standards venue relative to IETF/W3C — deliberate (the community fell out with W3C-DID directions), but it caps mainstream adoption. [ASSESSMENT]
- **Implementations**: KERIpy (reference), KERIA (cloud agent) + Signify (edge signing), CESR libs in TS/Rust. Quality is workable-for-vLEI; the broader tooling ecosystem is thin. The **watcher/juror/judge layer — the entire duplicity-detection economy — is mostly unbuilt in practice**; vLEI leans on GLEIF-governed witnesses instead. [ASSESSMENT — corroborated by ecosystem discussions; treat as informed judgment]
- **Complexity reputation is deserved.** The suite (KERI+CESR+ACDC+OOBI+IPEX...) is a parallel universe with its own encoding, vocabulary ("toad," "duplicity," "OOBI"), and agent architecture; even sympathetic explainers open by acknowledging it's "one of the most misunderstood technologies" ([Finema guide](https://medium.com/finema/the-hitchhikers-guide-to-keri-part-1-51371f655bba)); the existence of a "KERI is not complex" apologia ([Henk van Cann](https://medium.com/happy-blockchains/keri-is-not-complex-or-complicated-instead-it-simplifies-da285b20a7db)) is itself evidence of the reputation. CESR in particular buys elegance at the cost of *every* adopter writing a new codec. [ASSESSMENT]

**Net:** KERI is a **conceptual gold mine and an adoption cautionary tale.** The ideas (pre-rotation, KELs, first-seen, duplicity-as-evidence, witness-agnostic identity) are sound and largely unrefuted after ~7 years of scrutiny; the packaging (CESR, bespoke stack, all-or-nothing suite) confined it to one funded regulatory niche.

### 4.4 KERI ↔ EFS mapping (the load-bearing section)

1. **Hard part (e) resolved in principle.** EFS wants: ECDSA-grade signature portability AND durable rotatable identity. KERI's construction: identity = hash of inception event; authorship signatures verify against *key state at a position in the author's event log*, and the log travels with the data. Concretely for EFS: an attester identity could be (or commit to) a **micro-KEL** — inception binds the first key (for EOA on-ramp: the EOA key), rotation events are plain ECDSA-signed artifacts committing to next keys. A portable authorship artifact = {claim bytes, signature, KEL slice up to the event authorizing that key}. Verifiable in 2126 with nothing but hash + ecrecover. Smart accounts stop being the *identity* and become one *controller/witness arrangement* for it; ERC-1271's chain-boundness stops mattering because 1271 checks are a chain-local convenience, not the durable authenticity artifact.
2. **Chains as witnesses.** KERI says a blockchain can be a witness. Inverted for EFS: each chain an EFS tree is replicated onto acts as a witness of the author's events (its consensus timestamps the receipt). Duplicity = conflicting same-sn events on different chains — detectable by any cross-chain watcher, provable forever, punishable at the lens layer (drop the attester). This gives EFS's multi-chain "one big portable database" a *coherence story that does not require cross-chain consensus*: per-author monotonic logs + duplicity evidence + lens-level trust destruction.
3. **First-seen == first-attester-wins.** EFS's lens rule (first-attester-wins) and KERI's first-seen are the same maneuver: replace global fork-choice with per-viewer determinism plus incentives to publish early and widely. EFS can cite seven years of KERI analysis as prior art that this is sound — and import the refinement EFS lacks: **first-seen needs an evidence-preservation rule** (KERI watchers *keep* the losing variants as duplicity evidence; EFS indexers currently have no doctrine for retaining conflicting claims as evidence rather than merely ignoring them).
4. **Revocation (hard part a).** KERI TELs: revocation is an appended, KEL-anchored status event; verifiers check the registry's latest witnessed state. Import wholesale for claim revocation in a portable/post-chain regime: per-author status log, anchored to the author's identity log, witnessed; validity checks carry a freshness horizon. Note EAS revocation *already is* retraction-as-new-fact on-chain; the work is making it *portable* (a revocation must be exportable as a signed artifact that travels with replicas — today it's chain state).
5. **Dead-author problem (replication model A's admitted limit).** KERI's answer for a dead controller: nothing new can be authorized, but **everything already signed remains verifiable forever, anywhere** — because authenticity rides signatures, not substrate identity (msg.sender). Deterministic-ids §9 model A fails exactly where it relies on msg.sender replay. A signature-based authorship kernel (the "prize" in the mission brief) is what makes dead authors' work replicable: anyone can carry the signed artifacts to a new chain; only *new* statements die with the author. This is the single strongest external argument for the portable-authorship-signature direction.
6. **What NOT to import.** The full agent stack (KERIA/Signify), CESR, ACDC graph credentials, jurors/judges machinery: EFS already has wallets, ABI encoding, EAS, and lenses filling those slots. Import the *event-log identity pattern and its doctrines*, not the stack. Also do not import KERI's per-validator-only currency as an excuse to weaken EFS's on-chain currency guarantees where a chain IS present (hard part d needs the chain anyway).

---

## 5. Datomic — the database-theory frame for revocation-without-deletion

### 5.1 The model

Datomic (Rich Hickey, 2012–) stores **datoms**: immutable atomic facts `[entity attribute value tx added?]`. Updates never mutate; a change is a new assertion, and **retraction is itself a new fact** (`added? = false`) appended to the log. The database is a value; `db.asOf(t)`, `db.since(t)`, `db.history()` are pure views folded from the log ([Datomic docs: History](https://docs.datomic.com/client-tutorial/history.html), [Glossary](https://docs.datomic.com/glossary.html) [PRIMARY]). "Current" = the fold of all assertions minus retractions up to the head.

The precondition for all of this ergonomics: **a single transactor serializes all writes into one total order**. Datomic's transactor is, functionally, its private single-node blockchain. Reads scale out (peers fold the immutable log); writes funnel through one orderer. [PRIMARY docs; ASSESSMENT framing]

### 5.2 Excision: the escape hatch, and its price

[Excision](https://docs.datomic.com/operation/excision.html) [PRIMARY] permanently removes datoms matching a predicate — provided for **legal compulsion only** (privacy law, data you had no right to store, liability windows): "this feature should never be used to fix mistakes." It is irrevocable; docs urge backup first. Instructive wart: excision had a long-standing bug where excised datoms **survived in asOf/history indexes** until release 1.0.7469 shipped a fix plus a detection/re-apply tool ([Pro changelog](https://docs.datomic.com/changes/pro.html) [PRIMARY]) — even in a closed, single-operator system, *retrofitted deletion from an immutability-native store is brutally hard to get right*. (Datomic Cloud reportedly never offered excision at all [VERIFY].)

### 5.3 Uni-temporal honesty: recording time ≠ event time

Precision matters: **Datomic is uni-temporal** (transaction time only). "Bitemporal" properly belongs to XTDB and SQL:2011-style systems (valid time + transaction time). Val Waeselynck's [analysis](https://vvvvalvalval.github.io/posts/2017-07-08-Datomic-this-is-not-the-history-youre-looking-for.html) [COMMENTARY, high quality] nails the trap: Datomic's history reifies *when the system learned things*, not *when things happened*; `:db/txInstant` cannot be backdated (breaks imports/replays); schema evolution breaks old asOf queries; therefore **domain-level history must be modeled explicitly as ordinary facts** (revision entities with their own time attributes), reserving log-time for audit/ops.

This is exactly EFS's **temporal provenance under replication** problem (holistic-redesign §3.3): a replica's block.timestamp is *recording time on that substrate*; original publication time is an *event-time fact* that must be explicitly asserted (and witnessed — an origin-chain checkpoint or receipt is the evidence), never inferred from any substrate's clock. Datomic's community learned this lesson the hard way in ordinary business apps; a 100-year archive gets zero slack on it.

### 5.4 Datomic copy/avoid for EFS

**Copy:**
1. **Retraction-as-new-fact as the only mutation** (EAS revocation already conforms; keep it under portability — a revocation must exist as a signed, appendable artifact).
2. **Current = fold(log)**; make the fold function explicit and versioned. EFS lenses are parameterized folds (per-viewer trust order) — Datomic proves parameterized pure views over one immutable log are ergonomically excellent.
3. **The entity/fact (thing/statement) split** — already the conceptual core of deterministic-ids §"Statements vs things"; Datomic's identity taxonomy (upsert key / minted id / interned value) is already cited there. Validated.
4. **Excision doctrine**: if EFS ever needs a legal-compulsion analog, Datomic's framing is right — a separate, loudly-labeled, never-for-mistakes mechanism at the *storage/serving* layer (EFS: mirror takedown + WHITEOUT), never identity or log surgery. And Datomic's excision-index bug is the cautionary tale for why EFS is correct to refuse protocol-level delete entirely.
5. **Model event time explicitly** (§5.3) — adopt as a Codex-level convention for replica provenance.

**Avoid:**
1. Assuming any of Datomic's ergonomics survive losing the single writer. They don't. Multi-substrate EFS is in KERI/CRDT territory the moment no one chain orders all writes: per-author total orders (each author's log is single-writer!) are the salvageable fragment — which is again the KERI construction.
2. Conflating log-position time with domain time anywhere in the Codex.

---

## 6. Synthesis — the five hard parts, answered from this corpus

**(a) Revocation/mutability without a consensus substrate.**
Composite answer: (i) revocation = appended retraction-fact in a per-author status log (Datomic/TEL), anchored to the author's identity log (KERI), exportable as a signed artifact; (ii) trust carries a **freshness horizon**: relying on a claim requires a witnessed checkpoint of the author's status log newer than T (Sigsum-style quorum makes the checkpoint trustworthy offline); (iii) where horizons are unacceptable, prefer **expiry + re-attestation** (the CA industry's 47-day verdict) for claim classes that need liveness. Advisory deletion à la Nostr differs from this in two ways EFS can articulate: bounded staleness (witnessed checkpoints) and provable equivocation (duplicity evidence). What no system provides: instant global revocation without consensus — do not promise it.

**(b) Spam/sybil without gas.**
Every functioning gasless log rents scarcity from an existing namespace: Sigsum → DNS domains (rate-limit per SLD, unlogged); CT → CA issuance as admission control; Go sumdb → module paths (again DNS). Pattern: **admission/rate-limiting keyed to an external scarce identity, checked out-of-band, not recorded in the artifact**. For EFS gasless relaying: rate-limit per recovered author identity, where identity admission cost something somewhere (funded/aged L1 account, DNS control, witness-endorsed inception). Avoid inventing token economics; avoid logging the rate-limit evidence (privacy).

**(c) "What exists / what's current" without a chain — split it into three grades:**
- *Existence* (this was published): Merkle inclusion proof against a checkpoint. Solved, cheap, static-servable.
- *Non-equivocation* (everyone sees the same history): witness quorum cosignatures on checkpoints. Solved in practice post-2020 (Sigsum, witness network, Armored Witness); reactive gossip is a proven dead end.
- *Currency* (this is the latest): **unsolved in general without consensus.** Deployed compromises: immutable keys (Go), single-operator map + auditors + self-audit (WhatsApp AKD), per-author monotonic sequence + first-seen (KERI). For EFS the honest portable story is **per-author currency**: each attester's state is a single-writer log (sn + prior digest); "current placement of /path per lens" = fold of the trusted attesters' logs at their latest witnessed checkpoints. Global currency remains what the chain is *for* — see (d).
- Design consequence: EFS should treat chain consensus as the *premium* currency grade and per-author-witnessed as the *degraded but survivable* grade, with the data model (per-attester keying, first-attester-wins — already in place) identical across both. That's graceful degradation across substrate death, which is mission property 2.

**(d) On-chain composability.**
Nothing in this corpus offers it. Logs, witnesses, KELs are all off-chain constructs; no contract can read them trustlessly without oracles/light clients. If real dapps need synchronous reads of EFS state (the "possibly deciding factor"), a chain remains the only substrate that provides it — which argues for the hybrid: **canonical home chain(s) for composability + log-shaped portability layer for survival**, not a chainless design. The CT lesson sharpens this: CT never needed composability because its *enforcement point* (browsers) is off-chain; EFS should inventory which of its consumers are browsers-shaped (SDK/readers — fine off-chain) vs contracts-shaped (need the chain).

**(e) Signature portability vs identity durability.**
KERI is the reconciliation: identity = self-certifying event log; rotation via pre-rotation commitments inside plain signed events; authenticity = ECDSA/EdDSA signatures that verify anywhere forever; substrate (witnesses/chains) swappable at will and recorded in the log itself. Smart accounts become *controllers/hosts* of an identity, not the identity. The gasless prize follows: a kernel that recovers the author from a signature is verifying a KEL-style artifact, so relayers/replicators are trust-free carriers (KERI witnesses are exactly "gasless relayers with receipts"). Costs to state honestly: per-author logs add sequence-number management and a first-seen/duplicity doctrine to the kernel; and ERC-4337/passkey-era keys (secp256r1, threshold custody) must be expressible as KERI-style key configs, which KERI's design (multi-sig thresholds, algorithm agility in rotation events) does support on paper.

**A concrete shape worth carrying to the architects** [ASSESSMENT]: an **EFS author log** — per-attester micro-KEL: inception (binds first key; AID-style prefix could even be the B′ address salt), ECDSA-signed rotation events with next-key digests, every EFS claim carrying (sn, prior-digest) into the signed payload; chains act as witnesses (inclusion = receipt); duplicity (same sn, different events, any two substrates) is provable forever and handled by lens-level trust destruction; revocations are TEL-style status events in the same log; Sigsum-style quorum policies name which chains/witnesses a reader requires. This composes with deterministic IDs (IDs stay chain-free; the author log orders an author's *claims*, closing model A's dead-attester gap for third-party carriage of already-signed artifacts).

---

## 7. Master copy/avoid list

**COPY**
1. Proactive witness cosigning; validity = quorum inside the artifact; verification offline (Sigsum/witness network).
2. Tile/static log layout — logs as dumb replicable files + one tiny signing head (tlog/static-ct; Trillian→Tessera).
3. Proof bundles: self-contained {bytes, claims, proofs, cosigned checkpoint} as the archival deliverable (Sigsum).
4. Immutable named trust policies (quorum-of-witnesses/chains as versioned text, superseded never edited) for the trusted-chain list (Sigsum).
5. Multiple independent proofs per durable artifact; substrates presumed mortal; retired≠distrusted semantics (CT SCTs, temporal sharding).
6. Monitors as first-class citizens; log-only/state-walk reconstruction is monitor-enablement (CT; already an EFS gate).
7. Per-author event logs: monotonic sn + prior digest + pre-rotation for rotating durable identity from pure signatures (KERI).
8. First-seen + duplicity-evidence-preservation doctrine for indexers/lenses (KERI; EFS has first-attester-wins but no evidence-retention rule).
9. Revocation = appended, signed, anchored status events + freshness horizons; expiry for liveness-critical claims (KERI TEL, Datomic retraction, CA 47-day lesson).
10. Rent scarcity from existing namespaces for gasless spam control; keep the evidence out of the log (Sigsum DNS).
11. Explicit event-time facts, never substrate-clock inference, for replica provenance (Datomic/valvalval).
12. Claimant-model style role tables (who claims/verifies/acts) in the Codex for every trust artifact (Trillian).

**AVOID**
1. Reactive gossip or any "clients will cross-check later" mechanism — 15 years, zero deployments (CT).
2. Verifiable maps as load-bearing "what's current" infrastructure — deprecated by Google at scale; currency without consensus is per-author or single-operator+auditors only.
3. Baking witness/log/operator identity into data identity (EFS rule already; extend to witness layer).
4. Advisory revocation without freshness bounds (OCSP's fate ≈ Nostr deletion).
5. Bespoke encodings and all-or-nothing stacks — CESR/KERI-suite confined a sound design to one niche; EFS should stay on boring ABI/EIP-712 rails.
6. Building the full adjudication economy (jurors/judges) before demand — KERI specced it; nobody built it; vLEI runs on governed witnesses instead.
7. Pretending witness quorums give global currency or composability — they give non-equivocation and bounded staleness; the chain remains the currency/composability engine while it lives.
8. Retrofitted deletion from immutability-native stores (Datomic excision bug) — EFS's no-protocol-delete stance is validated; keep deletion at serving/mirror layer only.
9. Assuming Datomic-grade ergonomics survive losing the single writer — only per-author single-writer orders survive; design around them.

---

## 8. Sources (annotated)

**CT / Trillian / tiles / witnesses**
- RFC 6962 https://www.rfc-editor.org/rfc/rfc6962.html [PRIMARY spec]
- RFC 9162 https://datatracker.ietf.org/doc/rfc9162/ [PRIMARY spec; little real deployment]
- Chrome CT log policy https://googlechrome.github.io/CertificateTransparency/log_policy.html [PRIMARY policy]
- Chromium CT design notes https://chromium.googlesource.com/chromium/src/+/master/net/docs/certificate-transparency.md [PRIMARY]
- transparency.dev witness network post https://blog.transparency.dev/can-i-get-a-witness-network [PRIMARY operator; ~15 Armored Witnesses figure]
- Russ Cox, Transparent Logs for Skeptical Clients https://research.swtch.com/tlog [PRIMARY design doc; basis of Go sumdb + tiles]
- C2SP static-ct-api https://github.com/C2SP/C2SP/blob/main/static-ct-api.md ; tlog-tiles https://github.com/C2SP/C2SP/blob/main/tlog-tiles.md [PRIMARY specs]
- Sunlight https://sunlight.dev/ ; lessons post https://blog.transparency.dev/i-built-a-new-certificate-transparency-log-in-2024-heres-what-i-learned ; Cloudflare Azul https://blog.cloudflare.com/azul-certificate-transparency-log/ [PRIMARY implementations]
- Trillian repo (maintenance mode; MAP reserved) https://github.com/google/trillian , https://github.com/google/trillian/blob/master/trillian.proto [PRIMARY]
- Trillian verifiable data structures doc https://github.com/google/trillian/blob/master/docs/VerifiableDataStructures-Latest.md [PRIMARY]
- Andrew Ayer, How CT Logs Fail https://www.agwa.name/blog/post/how_ct_logs_fail [PRIMARY-adjacent operator/monitor author; incident list incl. Yeti 2022 bit flip]
- Gossip literature: https://arxiv.org/abs/1806.08817 (aggregation-based gossip), https://arxiv.org/pdf/2011.04551 (Think Global, Act Local), https://arxiv.org/pdf/1503.08768 (CoSi witness cosigning) [PRIMARY papers]
- Let's Encrypt ending OCSP https://letsencrypt.org/2024/12/05/ending-ocsp/ [PRIMARY; URL from memory — VERIFY]; CABF SC-081 47-day lifetimes [VERIFY ballot text]

**Sigsum**
- Docs index https://www.sigsum.org/docs/ [PRIMARY]
- Design doc (v0 label) https://git.sigsum.org/sigsum/plain/doc/design.md [PRIMARY; v1 protocol differs in details — leaf shard_hint dropped]
- Named policies https://www.glasklarteknik.se/post/named-policies-for-sigsum/ [PRIMARY, maintainer company]
- litetlog https://github.com/FiloSottile/litetlog ; transparent keyserver design https://words.filippo.io/keyserver-tlog/ [PRIMARY-adjacent]

**KERI**
- ToIP KERI spec https://trustoverip.github.io/kswg-keri-specification/ [PRIMARY; quotes on KAWA, toad, first-seen, duplicity taken from here]
- Whitepaper https://arxiv.org/pdf/1907.02143 [PRIMARY, 2019 — old; spec supersedes]
- TEL/ACDC https://github.com/trustoverip/acdc/wiki/transaction-event-log [PRIMARY]
- did:webs https://trustoverip.github.io/tswg-did-method-webs-specification/ [PRIMARY, v0.9.x — pre-1.0]
- Specs moved to ToIP https://kentbull.com/2023/09/15/keri-specifications-have-moved-to-the-toip-foundation/ [COMMENTARY by community member]
- vLEI production https://keri.one/keri-in-production-for-gleifs-vlei/ ; GLEIF QVI list https://www.gleif.org/en/organizational-identity/get-a-vlei-list-of-qualified-vlei-issuing-organizations ; 2025 hackathon https://www.biometricupdate.com/202510/gleif-launches-global-vlei-hackathon-to-advance-digital-organizational-identity [PRIMARY GLEIF + COMMENTARY]
- Finema Hitchhiker's Guide pts 1–3 (mechanism explainer) https://medium.com/finema/the-hitchhikers-guide-to-keri-part-2-what-exactly-is-keri-e46a649ac54c [COMMENTARY]
- "KERI is not complex" https://medium.com/happy-blockchains/keri-is-not-complex-or-complicated-instead-it-simplifies-da285b20a7db [COMMENTARY/advocacy]

**Datomic / temporal**
- Excision https://docs.datomic.com/operation/excision.html ; history tutorial https://docs.datomic.com/client-tutorial/history.html ; Pro changelog (excision/asOf bug fix 1.0.7469) https://docs.datomic.com/changes/pro.html [PRIMARY]
- Val Waeselynck, "This is not the history you're looking for" https://vvvvalvalval.github.io/posts/2017-07-08-Datomic-this-is-not-the-history-youre-looking-for.html [COMMENTARY, high quality; 2017 but model unchanged]
- XTDB (true bitemporality, contrast) https://xtdb.com [PRIMARY, not fetched this session]

**Key transparency (currency case study)**
- WhatsApp AKD https://engineering.fb.com/2023/04/13/security/whatsapp-key-transparency/ ; Cloudflare as auditor https://blog.cloudflare.com/key-transparency/ ; Messenger rollout (2025-11) https://engineering.fb.com/2025/11/20/security/key-transparency-comes-to-messenger/ ; akd library https://github.com/facebook/akd [PRIMARY]
