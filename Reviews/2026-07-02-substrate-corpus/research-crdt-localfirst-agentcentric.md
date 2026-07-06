# Research: CRDTs / Local-First, Holochain, Urbit — merge semantics an EFS-like FS+graph actually needs

**Agent:** crdt-localfirst-agentcentric · **Date:** 2026-07-02 · **For:** EFS substrate investigation, architect phase
**Repo grounding:** `planning/Designs/deterministic-ids.md`, `planning/Designs/efs-v2-holistic-redesign.md`, `contracts/docs/adr/0031` (lenses, first-attester-wins), `contracts/docs/adr/0041` (PIN/TAG cardinality + O(1) supersession), `contracts/specs/overview.md`, `contracts/docs/QUESTIONS.md` (open multi-lens merge question).

---

## 0. Executive verdict

**CRDTs are a solution to a problem EFS has mostly designed away.** The CRDT problem statement is: *replicas accept concurrent writes with no shared authority and must converge deterministically.* EFS, on a single chain, has a shared authority — consensus totally orders every write, `multiAttest` batches are atomic, and PIN supersession is a last-writer-wins register whose "clock" is block order. Cross-**author** conflict is dissolved by construction: lenses partition state by attester and first-attester-wins (ADR-0031) is *read-time precedence over trusted authors*, not a merge. That is precisely the "agent-centric" insight Holochain built an entire platform around — and EFS gets it on a substrate that also gives total order, atomicity, and contract-readable state, which Holochain does not have.

The residual conflict surfaces are exactly three, and none of them wants a merge algorithm frozen into Etched contracts:

1. **One author, multiple devices** (same smart-account attester from two laptops) — a *lost-update UX problem*, not a convergence problem; the chain serializes the writes, the archive keeps both, the loser is recoverable.
2. **Cross-chain replication (model A)** — the only place true CRDT-style concurrency exists in the design. Two chains are two replicas with no shared order. Per-chain supersession + explicit provenance claims (holistic §3.3) is the honest, deferrable answer — **provided enough author-signed ordering metadata exists in the data from day one**. This is the single actionable freeze-adjacent finding (see §6.4).
3. **Chain forks** (ETH/ETC-style) — a multi-value register moment: the correct CRDT lesson is *surface both values, never silently LWW across forks*; policy/lens chooses. Matches the fork-doctrine workstream (holistic §3.2).

Where users genuinely need concurrent *content* merging (two devices editing one document offline), that is an **application-layer format decision**, not kernel semantics: an Automerge/Yjs/Loro document is just bytes in a DATA + an append-only op log rides naturally in an `appendOnly` LIST. The 2024–2026 industry consensus (Figma, Linear, ElectricSQL's pivot, Eg-walker) is that when you have an authority that orders events, you should *use it* and keep merge logic out of the substrate. EFS should stay a merge-agnostic event archive and let read-time policy evolve — which its append-only, nothing-silently-revised doctrine already guarantees is safe to defer.

---

## 1. Method and source hygiene

Primary sources (project docs/papers/blogs by the builders) are marked **[P]**; commentary/secondary **[C]**. Data staleness noted inline; today = 2026-07-02. One caveat: the Jeremy Tunnell Urbit post 404'd on direct fetch; its claims below come from search-result extracts and are corroborated by Compact Magazine's account **[C]**.

---

## 2. CRDT / local-first autopsy

### 2.1 What CRDTs actually buy, stated precisely

A CRDT guarantees **Strong Eventual Consistency**: replicas that have received the same set of updates are in the same state, regardless of order, with no coordination. The machinery is always some combination of: per-operation unique IDs, causal metadata (version vectors / parent hashes), and deterministic tie-breaks. Taxonomy relevant to a FS+graph:

- **Registers** — LWW-register (tie-break by timestamp/ID) or MV-register (keep all concurrent values, surface the conflict). EFS's PIN slot *is* an LWW register whose timestamp is consensus order.
- **Sets** — G-set (grow-only; trivially convergent) and OR-set (adds + tombstoned removes). EFS's append-only indices and idempotent shared-kind instantiation (deterministic-ids §6) are G-set-shaped already; "duplicate instantiation is an idempotent no-op" is literally a semilattice join.
- **Sequences** (RGA, YATA, Fugue) — where all the metadata pain lives (per-character IDs).
- **Trees with move** — the hardest case; see §2.4.

### 2.2 The metadata bill (what merge semantics cost)

The headline numbers, from the builders themselves:

- Automerge assigns **"a unique ID to every keystroke"** [P: automerge.org/blog/automerge-3/]. Uncompressed, history metadata ran ~**100:1 overhead** vs. raw text; the columnar encoding work got at-rest overhead to ~**30% over raw data** ("less than one extra byte per character" amortized) [P: github.com/automerge/automerge-perf columnar README; C: BigGo/anantjain summaries of "CRDTs: The Hard Parts"].
- But until **Automerge 3.0 (Aug 2025)** the compressed format was disk-only: loading ballooned memory. Pasting Moby Dick into Automerge 2 consumed **700 MB**; Automerge 3 = **1.3 MB** (~538×); one real document went from *17 hours to load* to 9 seconds. Fix: keep the columnar-compressed representation *at runtime* [P: automerge.org/blog/automerge-3/]. It took the flagship research-grade CRDT ~8 years to make its own history affordable.
- Yjs (YATA): tombstones for every deletion; **"Yjs can't garbage collect deleted structs while ensuring a unique order"** — it merges adjacent structs and GCs only under conditions [P: yjs INTERNALS.md]. Production reports: GC-disabled documents are "pretty awful for performance, disk space, and network throughput"; heavily-edited 1k-char docs accumulate 50k+ tombstones; text CRDTs generically run 16–32 bytes/char of metadata [C: discuss.yjs.dev GC thread; zylos survey]. The GC dial is a **data-loss dial**: Moment's engineering assessment — "keep the tombstones around for longer (chewing up memory), or forget them after some arbitrary time, which *will* lose data" [C/P: moment.dev "Lies I was Told, pt 2"].
- Moment also documents the *semantic* costs of Yjs in production: schema-validation failures propagate as permanent deletions to all peers; permission enforcement must be done by predicting the materialized effect of opaque updates; debugging is "100x harder." They chose server-rebased OT-ish `prosemirror-collab` instead.

**Transfer to EFS:** fine-grained merge semantics are paid for in *per-operation identity + causal context, kept forever*. On a chain, that cost is gas × permanence. EFS already pays for per-claim identity (EAS UID, attester, block position) at file/claim granularity — that is the right granularity for an archival FS. Per-character or per-property-keystroke CRDT on-chain is economically absurd; nothing in the local-first literature suggests otherwise.

### 2.3 Byzantine reality: vanilla CRDTs assume honest peers

Standard CRDT correctness proofs assume non-Byzantine replicas. Kleppmann's **"Making CRDTs Byzantine Fault Tolerant" (PaPoC 2022)** [P: martin.kleppmann.com/papers/bft-crdt-papoc22.pdf] fixes this by: identifying each update by its **hash**, linking updates into a **hash DAG** (Merkle-DAG of causal predecessors), signing updates, and having peers validate structure before applying. Result: strong eventual consistency among honest peers with *any* number of Byzantine nodes. Two explicit punts, in the paper's own framing:

- **Sybil**: unlimited cheap identities can still flood; identity/trust must come from outside the CRDT. (Follow-on work, e.g. the **Blocklace** [P: arxiv 2402.08068, 2024], detects equivocation but likewise does not rank authors.)
- **Eclipse/liveness**: convergence only among peers that can actually exchange updates; the CRDT layer cannot force delivery.

**This is the most important theoretical validation for EFS in the whole CRDT literature.** The BFT-CRDT recipe — *signed, hash-identified, causally-linked operations; state = deterministic fold over the valid-op set; trust in authors decided by the application* — is structurally identical to where the EFS v2 journey has been heading: deterministic IDs, portable authorship signatures, per-author supersession, lenses as the author-trust ranking. The academic frontier of CRDTs converged on EFS's shape, and it concedes that the two things it cannot supply (spam/sybil resistance and canonical "what exists" liveness) are exactly EFS hard parts (b) and (c) — for which EFS's current answers are gas and a consensus chain. Chain-free EFS would inherit precisely these two open problems, with no help from the literature.

Also note: authenticated signed ops make transport/msg.sender irrelevant — the BFT-CRDT model natively supports "recover author from signature," the property the kernel prize (gasless relaying) chases.

### 2.4 Trees and moves: the hardest problem — which EFS has already dissolved

Kleppmann et al., **"A Highly-Available Move Operation for Replicated Trees"** (IEEE TPDS 2021) [P: martin.kleppmann.com/papers/move-op.pdf]: concurrent moves in a replicated tree can create cycles/orphans; **bugs of this class were demonstrated in Google Drive and Dropbox**. The fix is heavy: a totally-ordered op log with undo/redo of conflicting moves (effectively local serialization), formally verified in Isabelle/HOL. Loro's movable-tree CRDT (1.0 in 2024) exists because this is *still* considered frontier work [P: loro.dev].

EFS's answer is architecturally cleaner: **paths are permanent commitments; there is no move**. "Move" = atomic batch creating destination anchors + re-PINs + `REDIRECT(kind=4 movedTo)` at vacated paths — "the web's 301, not POSIX rename(2)" (holistic §2.2), with O(1) subtree move explicitly rejected. Concurrent "moves" therefore can't corrupt the tree: anchors are immutable Schelling points (G-set), placements are per-author registers, redirects are advisory claims resolved read-time with a specified cycle rule (SCC-lowest-UID, ADR-0050 spec). The entire class of Drive/Dropbox/CRDT-tree bugs is unrepresentable. **This is a strong copy-validation: keep the no-move doctrine; never let a future UX request smuggle in mutable parent pointers.**

### 2.5 Local-first in production: what actually shipped, 2019 → 2026

- **Ink & Switch's founding essay (2019)** [P: inkandswitch.com/essay/local-first/] defined the 7 ideals and championed CRDTs, but was honest: prototypes "rarely encounter[ed] conflicts" and needed no custom merge semantics; history "piles up, but can't easily be truncated"; and it was "not yet advisable to replace a proven product like Firebase with an experimental project like Automerge in a production setting today." Seven years later Automerge 3 finally addressed the memory half; sync/networking remains "bring your own."
- **Figma** [P: figma.com/blog/how-figmas-multiplayer-technology-works/]: deliberately **not** CRDTs — server-authoritative **last-writer-wins per property**, "the server defines the order of events without needing timestamps"; "CRDTs are designed for decentralized systems... Figma is centralized, so we can simplify." This is EFS's same-chain model exactly, with consensus playing the server.
- **Linear**: custom server-authoritative sync engine over an ordered transaction log; not a CRDT [C: sync-engine surveys, adamnyberg.se 2025, syntax.fm #924].
- **Actual Budget** [P: localfirst.fm #7, James Long]: the best *shipped* one-author-many-devices system — per-row/column LWW messages ordered by **Hybrid Logical Clocks**, plus a Merkle trie over HLC timestamps to find divergence points cheaply. Personal finance synced across devices for years in production. Proof that the single-author/multi-device problem needs only *ordering metadata + LWW*, not sequence CRDTs.
- **Yjs** is genuinely dominant for collaborative **text** (TipTap/ProseMirror ecosystem, Jupyter extensions, AFFiNE, many editors) [P: yjs README/docs; C: npm ecosystem]. That is the one domain where sequence CRDTs earn their metadata.
- **ElectricSQL pivoted (2024)** away from client-side CRDT machinery to a server-only model streaming Postgres to clients [C: adamnyberg.se, syntax.fm]. The broader 2025–26 "sync engine" wave (Zero, LiveStore, InstantDB, PowerSync, Convex...) is overwhelmingly server-ordered, CRDT-free.
- **Eg-walker (EuroSys 2025, best-paper-tier)** [P: arxiv 2409.14252, Gentle & Kleppmann]: store the **event graph** (original editing events + causal parents); *derive* CRDT state transiently only when merging concurrent branches; an order of magnitude less steady-state memory than CRDTs, orders faster loads. The conceptual headline: **the durable artifact should be the event history, not the merge structure; merge semantics are a replayable interpretation.**
- **Keyhive/Beehive (Ink & Switch, 2024–26)** [P: inkandswitch.com/keyhive/notebook/]: the frontier attempt at *coordination-free access control* — CRDT group management with "coordination-free revocation" and causal-key E2EE. Still a lab notebook, not shipped. Relevant as evidence that **revocation without a consensus substrate (EFS hard part (a)) is an open research problem** even for the best-funded local-first lab; EFS's on-chain revocation via EAS is a real asset that a chain-free design would forfeit.

**Distilled industry lesson:** when an ordering authority exists, use it (Figma/Linear/Electric); CRDTs only pay when no authority can exist (offline P2P, multi-server, cross-chain); and even then, keep the event log primary and the merge derived (Eg-walker). EFS's chain is the ordering authority; EFS's archive doctrine already keeps the event log primary.

---

## 3. Holochain autopsy

### 3.1 Architecture (what it actually is)

- **Source chains**: each agent keeps a local, signed, hash-linked, append-only chain of their own actions — "per-author total order" as a first-class primitive [P: developer.holochain.org concepts].
- **Validating DHT**: entries/actions are published to a DHT; peers in the address "neighborhood" (self-chosen **arcs**) validate against app rules ("the DNA"), sign **validation receipts**, and on failure issue **warrants** — "a signed proof that the author has broken a rule" — gossiped as an "immune system" [P: developer.holochain.org/concepts/4_dht/, /7_validation/, glossary].
- **Consistency**: explicit **eventual consistency with partition tolerance**; partitions keep operating and re-sync; there is no global time and no global state — queries are per-app, link/anchor-based [P: DHT concepts page].
- **Countersigning**: when two agents *do* need cross-author atomicity, they must temporarily lock both source chains and co-sign one entry validated from every party's perspective [P: /concepts/10_countersigning/]. This is the price sticker for cross-author transactions without consensus: a bespoke locking protocol per interaction.
- **Sybil/spam**: per-app **membrane proofs** (join gate) + warrants; no global answer.
- **Identity/rotation**: **DeepKey/DPKI** (distributed PKI for key rotation and device management) has been "coming" since ~2018 and in Holochain 0.4 ships behind an **`unstable-dpki` flag** [P: github.com/holochain/deepkey; developer.holochain.org 0.3→0.4 upgrade notes]. Durable rotatable identity is *still not stable* after 8 years.

### 3.2 Honest maturity assessment

Timeline: founded Dec 2016 (roots in MetaCurrency/Ceptr, earlier); **ICO Mar–Apr 2018 raised ~$20.65M** [C: icomarks, cryptobriefing]; **Beta 0.1 shipped Feb 2023** — five years post-ICO [P: blog.holochain.org "Holochain Beta Released"]; 2025 spent on reliability: Kitsune2 networking rewrite, validation-pipeline overhaul, Wind Tunnel testing at ~250 nodes; 0.6 in progress ("67% complete") [P: blog.holochain.org "2025 at a Glance: Landing Reliability"; holochain.org/roadmap]. The most sympathetic community survey (mid-2025) concludes: **"Every major application remains in alpha"** (Acorn, Mewsfeed, hREA, Volla Messages...), Holo hosting has "no visible production scale," and production readiness is honestly "1–2 years" away [C: alternef.garden "Holochain Ecosystem in 2025: A Friendly Reality Check"]. HoloFuel, the mutual-credit currency the 2018 ICO presold hosting for, is still not generally live. Ten years, ~$20M+, zero at-scale production apps.

**Why (diagnosis):** the architecture is coherent, but agent-centricity pushes enormous complexity to the edges — every app defines validation rules, membranes, and its own consistency conventions; DHT liveness/visibility ("did my publish actually get validated and held?") took a decade of networking rewrites; and there is no composable global state for anything economic (hence countersigning, hence HoloFuel's endless delay). The 2025 pivot to boring reliability work is the tell: **the hard part was never the data model; it was (c) — dependable consensus on "what exists" over a permissionless DHT.**

### 3.3 What Holochain proves *for* EFS

- Per-author chains + app-level trust = a real, coherent alternative to global consensus; EFS's per-attester supersession + lenses is the same shape.
- Signed-by-agent-key everything → transport-independent authorship (their conductor doesn't care who delivers data). Supports EFS's portable-signature direction.
- **Warrants are what validation looks like without a chain**: EFS resolvers REVERT invalid writes at consensus time — strictly stronger; a chain-free EFS would need a warrant/receipt-like gossip layer and would inherit its liveness weakness.
- **Countersigning is the quantified cost of cross-author atomicity without consensus** — chain-locking choreography per transaction. EFS gets cross-author atomicity for free inside one block (and doesn't even need it often, because lenses de-couple authors).
- **DeepKey's decade of instability is the strongest available evidence on hard part (e)**: durable rotatable identity without a consensus registry is *the* unsolved piece of agent-centric systems. Urbit (below) solved rotation only by anchoring identity to Ethereum.

---

## 4. Urbit autopsy

### 4.1 Identity architecture (the part worth copying)

**Azimuth**: a general-purpose PKI as Ethereum contracts (`azimuth.eth`, ERC-721 points; governance at `ecliptic.eth`) [P: docs.urbit.org/urbit-id/azimuth-eth; github.com/urbit/azimuth]. Address space: 256 galaxies / 65,280 stars / ~4.29B planets / moons / ~18 quintillion free comets. Identity carries two counters: **life** (key revision) and **rift** (continuity breach count) — network peers always encrypt to the latest keys and detect resets; **keys rotate without changing identity** [P: docs.urbit.org "Life and Rift"]. In 2021–22 Tlon added **"naive rollups" (L2)**: batched identity transactions posted to Ethereum as calldata; **state transitions are computed client-side by every Urbit node rather than by the EVM** — Ethereum as pure data-availability, interpretation off-chain [P: developers.urbit.org L2 docs].

Three transferable facts: (1) even the most sovereignty-maximalist project in existence put its identity root on Ethereum, because rotation requires a consensus registry; (2) life/rift is a clean minimal schema for "same identity, new keys, detectable breach" — directly relevant to reconciling ERC-1271 smart accounts vs portable ECDSA (hard part (e)); (3) the naive-rollup pattern — **chain as DA, deterministic client-side interpretation** — is exactly EFS's "chains as data-availability substrates" ambition and its state-walk/log-only-sync doctrine, proven in the field.

### 4.2 Why Urbit stalled (multi-causal, all instructive)

Corroborated across Compact Magazine's account, the Tunnell post-mortem (via extracts), Wikipedia, and Zach's 2025 update [C all]:

1. **Totalizing stack reinvention**: Nock/Hoon/Arvo — new VM, new language, new OS — meant a decade of foundation-building before user value; developer onboarding stayed brutal; "most other Urbit apps are largely irrelevant these days" by 2025 [C: martiancomputing].
2. **Funding = address-space speculation**: galaxies/stars sold to fund development; the 2022 crypto crash gutted it. A protocol whose treasury is its own scarce namespace inherits crypto-cycle beta. Tlon laid off staff early 2023; a "mass exodus" of users/devs followed; **the Urbit Foundation ran out of money by Aug 2024**, fired ED Josh Lehman; Yarvin returned as de-facto "wartime CEO" (Jan 2025), foundation "scaled way down" [C: Compact, Tunnell extracts, Yahoo/CoinDesk].
3. **Sovereignty theater**: network **encryption remained "a work-in-progress"** while sovereignty was the marketing; Tlon killed Port (easy self-hosting), pushing users onto **Tlon's paid hosting — recreating the subscription cloud it promised to replace** [C: Compact]. Governance: Tlon + affiliates owned 185/256 galaxies and ~38k/65.5k stars (2019) — "transparent plutocracy," then warring factions with unclear authority.
4. **Scale**: active users "a few thousand" at peak (Sept 2022, Messari) [C]; the scarce-identity spam defense doubled as an adoption tax.

### 4.3 Lessons for EFS

- **Copy**: identity root on the most durable chain, rotation counters in the registry, signatures verifiable everywhere; DA-rollup pattern for cheap identity/claims state; "your data on your node" only counts if export/self-host stays first-class *forever* (EFS analog: state-walk reconstruction + client-computable IDs are the anti-Port guarantees — keep them freeze-gated as specced).
- **Avoid**: funding/permissioning via scarce identity (conflicts with permissionless publishing; EFS's no-token, gas-as-rate-limit stance is right); shipping "sovereignty" language ahead of the mechanism (EFS parallels: durability-class labeling honesty, encryption conventions *before* real data — holistic §2.3/§2.10 are the right instinct); single-institution bus factor (EFS's trust-root stewardship workstream §3.2 is precisely the missing Urbit document — write it).

---

## 5. Cross-system synthesis against the five hard parts

| Hard part | CRDT/local-first world | Holochain | Urbit | Net lesson for EFS |
|---|---|---|---|---|
| (a) Revocation w/o consensus | Tombstones = advisory; GC = data loss dial; Keyhive "coordination-free revocation" still lab-stage | Warrants (advisory, gossip); DeepKey unstable | Rift/breach counters — but anchored to Ethereum consensus | Real revocation needs a registry with total order. EAS-on-chain revocation is an asset; **revocation is also EFS's least *portable* primitive** (per-chain state — see §6.3) |
| (b) Spam/sybil w/o gas | Explicitly punted (BFT-CRDT paper) | Membrane proofs per app; unproven at scale | Scarce paid IDs — worked as spam control, failed as economics | No system has a better answer than "cost to write + trust-scoped reads." Gas + lenses is state of the art, not a gap |
| (c) What exists / what's current | Converge on op-*set*; currency = LWW w/ timestamps (lying clocks) or HLC; liveness punted | A decade of DHT reliability work; still eventual | Sponsor hierarchy for delivery; L1 for identity currency | Per-chain: consensus answers it. Cross-chain: nobody has an answer that beats "explicit signed provenance + reader policy" |
| (d) On-chain composability | None (no contracts read CRDT state) | None | None (Azimuth readable, data isn't) | If (d) matters at all, a chain must stay in the loop; all three alternatives are non-starters as the *only* substrate |
| (e) Signature portability vs identity durability | Raw ed25519 keys: portable sigs, zero rotation story | DeepKey: rotation designed, still `unstable` flag after 8 yrs | **Solved**: life/rift on Ethereum; sigs portable, identity durable | The one proven pattern: **portable signature scheme + consensus-registry rotation state**. Don't invent a third thing |

---

## 6. The core question: what merge/conflict semantics does EFS actually need?

### 6.1 Conflict inventory (every place concurrency can bite, and what resolves it today)

| # | Surface | Concurrency? | Current resolution | CRDT lens verdict |
|---|---|---|---|---|
| 1 | Cross-author, same path/slot, same chain | Yes, always | Lenses partition by attester; first-attester-wins read-time precedence (ADR-0031); recency-merge explicitly rejected ("substitutes recency for trust", holistic §4) | **No merge needed, ever.** This is per-author state + viewer-chosen precedence — strictly better than any cross-author CRDT merge, which would be a sybil/spam vector (BFT-CRDT paper concurs: author ranking is the app's job) |
| 2 | Same author, same slot, same chain (two devices / two dapps) | Yes | Chain totally orders; PIN re-attest supersedes O(1) (ADR-0041); 4337/EOA account nonce already serializes submission; history preserved (append-only + supersededUID + ADR-0051 opt-in full history) | LWW register with a *consensus* clock — Figma's exact model. Correct. Residual issue is **lost-update UX**, not convergence: device B can supersede A's unseen write. Fix is client-side: SDK stale-read detection (compare slot state/events before write), "changed on your other device" prompts. Zero kernel work |
| 3 | Same-block races on shared objects (ANCHOR/PROPERTY instantiation) | Yes | Deterministic-ids §6: duplicate instantiation = idempotent no-op success (first-wins registry, exactly-once events, visibility effects still run) | Already a semilattice join (G-set + first-wins register). Textbook-correct convergent design; keep it |
| 4 | Concurrent *content* editing (one doc, two offline devices) | Yes | None in kernel — by design (DATA immutable; new version = new DATA + REDIRECT/supersession) | **App-layer concern.** Kernel must stay merge-agnostic; see §6.2 |
| 5 | Cross-chain replication, same author (model A replay) | **Yes — the real one** | Per-chain registries; supersession never inferred across chains without explicit claims (holistic §3.3, planned convention) | The only genuine no-authority concurrency in EFS. See §6.4 |
| 6 | Chain fork (ETH/ETC) | Yes, rare | Fork doctrine = policy doc (holistic §3.2) | MV-register moment: identical IDs, divergent claim tails. **Never auto-LWW across forks; surface both; lens/policy chooses.** CRDT theory's one direct contribution to fork doctrine |

### 6.2 Answer to "does first-attester-wins + per-author supersession make CRDTs unnecessary?"

**Yes, at the kernel — with confidence, and with industry precedent.** Row 1 removes cross-author merge by construction (the *only* class of conflict CRDTs were invented for that EFS could otherwise hit at scale); rows 2–3 are already solved by consensus ordering plus EFS's convergent-by-design duplicate policy; rows 5–6 don't want an algorithm — they want *ordering metadata plus read-time policy* (§6.4). Figma, Linear, and the ElectricSQL pivot all demonstrate that systems with an ordering authority correctly refuse CRDT machinery; Eg-walker demonstrates that a system which durably keeps the **full causal event history** — which EFS's append-only, nothing-silently-revised archive is — can defer merge *semantics* indefinitely and compute any future interpretation retroactively at read time. Deferral is safe **except** for one thing: *metadata that was never signed cannot be retrofitted*. That is the entire content of §6.4.

The `docs/QUESTIONS.md` open item ("multi-lens merge semantics — users may expect merge-by-newest") should be answered A (keep first-wins, document loudly): options B/C (`?merge=newest`) reintroduce cross-author recency-trust, are a phishing/spam seam (newest attacker wins), and every system autopsied here that let recency beat trust regretted it.

### 6.3 Where conflicts still arise, concretely, and the designed response

1. **One author, two devices (row 2/4).** With identity = one smart account, this is real and daily. Slot-level: LWW-by-chain-order + client stale-detection is sufficient and matches Actual Budget's proven pattern (their HLCs exist only because they *lack* a server order; EFS has one). Content-level: two offline drafts of `notes.md` → two DATA mints, second PIN supersedes first; nothing lost, but a naive client silently shadows draft A. The SDK convention worth writing (Durable, not Etched): on publish, if the slot's current target ≠ the base the draft was made from, surface a three-way choice (keep mine / keep theirs / fork to sibling name or `relatedVersion` REDIRECT). This is git's index-vs-worktree check, ~20 lines of SDK, no schema impact.
2. **Collaborative editing apps on EFS (row 4).** EFS should *host* CRDTs, not *be* one: an Automerge/Yjs/Loro doc is bytes in DATA; incremental update batches ride an `appendOnly` LIST (the event graph, Eg-walker-style — causal parents inside the payload bytes); periodic compacted snapshots mint new DATA + supersession. Check the primitives support it: `appendOnly` LIST ✓, LIST_ENTRY identityKey = opaque update hash ✓, atomicity for snapshot+redirect batches ✓, per-author entries with lens-scoped read ✓. **No kernel change needed** — but stating this pattern in a conventions doc (like the encrypted-file conventions) would pre-empt apps inventing incompatible layouts. Note the economics honestly: per-keystroke on-chain is absurd; the convention is offline-accumulate → publish coarse batches, or keep live collab off-chain (Yjs relay) and archive checkpoints to EFS. EFS is the archive/backbone, not the 60fps sync plane.
3. **Cross-chain (row 5)** — next section.

### 6.4 The one freeze-adjacent finding: cross-chain currency needs author-signed ordering metadata, decided *before real data*

Under replication model A, the same attester replays writes on chain B; or writes fresh content on both chains while they coexist. "Which placement is current for this slot, across chains?" has no consensus answer. The design already (correctly) says supersession is per-chain and cross-chain currency needs explicit claims (holistic §3.3: `originalTime`/`originChain` provenance, "which clock does a 100-year citation trust"). CRDT/local-first research sharpens what those claims must contain for the answer to ever be *computable* rather than vibes:

- **Wall-clock claims alone are the weakest option** (lying clocks; the entire distributed-systems literature). Acceptable as display metadata, insufficient as ordering.
- **A per-author logical counter is the proven minimal fix** (Lamport/HLC — Actual Budget ships exactly this for exactly this topology: one author, several replicas, no shared server). A monotone per-author sequence number — per slot or global-per-author — embedded in the *signed* replica-provenance claim gives cross-chain LWW that is deterministic, chain-free, and cheap.
- **A per-author prev-hash chain is the stronger variant** (= Holochain's source chain, = BFT-CRDT hash DAG, = Blocklace): also makes cross-chain **equivocation detectable** (author claims seq 5 with two different payloads on two chains → provable fork of their own history). Costs one extra bytes32 per claim.
- Either way, **the counter/prev-pointer must be inside author-signed payload bytes from the first real write** — it cannot be retrofitted onto attestations that never carried it (the exact "conventions-before-data" class of holistic §2, alongside encryption conventions). It does *not* obviously need to ride the Etched schema freeze if it lives in the planned provenance-claim convention — but the convention must be specified before mainnet data exists, and if architects want kernel-verifiable ordering (resolvers checking monotonicity) it becomes a schema/freeze item. Flag it into the §3.3 temporal-provenance workstream now.
- Related honest note: **revocation is per-chain state** — a claim revoked on the origin chain stays facially active in a replica; a dead origin chain can never revoke again. Cross-chain conventions must say what a replica reader does about origin-chain revocations (replicate revocation as signed claims? treat model-A replicas as revocation-frozen snapshots?). No autopsied system solves this; Nostr-style advisory deletion is the failure mode to avoid *presenting* as real deletion.

### 6.5 Fork doctrine, one imported rule

From MV-register semantics: after an ETH/ETC-style fork, identical IDs carry divergent claim tails on two universes. Any client that silently picks one (by recency, by "the bigger chain") is fabricating a merge. Correct behavior: treat fork-divergent state as a **multi-value read** — surface both, resolve by explicit policy (the published trusted-chain list / lens choice). Cheap to write into the fork-doctrine policy doc now; expensive to bolt onto clients later.

---

## 7. Copy / avoid — consolidated for EFS

**COPY**
1. *Figma/consensus-LWW*: keep slot supersession as LWW-by-chain-order; never add timestamp-based cross-author merge (`?merge=newest` — reject; answer QUESTIONS.md item with option A).
2. *Eg-walker/event-graph*: the durable artifact is the signed event history; merge semantics stay a read-time, evolvable interpretation. EFS's append-only + state-walk + full-payload events doctrine is this — protect it in the freeze (it is what makes deferring merge semantics safe).
3. *BFT-CRDT recipe*: signed, hash-identified, causally-anchored ops + "app ranks authors" = academic validation of deterministic IDs + portable authorship signatures + lenses. Cite it in the v2 ADR lineage; it is also the theory basis for signature-recovered authorship (gasless relaying prize).
4. *Actual Budget HLC / Holochain source-chain*: put a per-author monotonic counter (minimum) or prev-hash (better, equivocation-evident) inside the signed replica-provenance convention **before real data** — the only retrofittable-never piece of cross-chain merge semantics (§6.4).
5. *Kleppmann tree-move paper (by contrast)*: permanent paths + REDIRECT(movedTo) dissolves the hardest replicated-FS problem (Drive/Dropbox concurrent-move corruption). Never reintroduce mutable parent pointers or O(1) subtree move.
6. *Urbit Azimuth life/rift + naive rollup*: identity root on the most durable chain, rotation counters in a consensus registry, signatures portable, interpretation client-side with chain as DA. The one field-proven answer to hard part (e).
7. *Holochain idempotent-validation posture*: EFS's §6 duplicate policy (idempotent no-op for shared kinds) is convergent-by-design; keep, and keep the resolver-REVERT for owned kinds under model A (coupled decision, as the design already notes).
8. *Host CRDTs, don't be one*: publish a conventions doc for collaborative-doc layouts on EFS (CRDT bytes in DATA, op batches in appendOnly LISTs, snapshot+supersession) so apps converge on one pattern.

**AVOID**
1. *Yjs/Automerge granularity on-chain*: per-op merge metadata (16–32 B/char, tombstones forever, GC=data-loss dial) is economically and semantically wrong for an archival substrate; EFS's file/claim granularity is correct.
2. *Cross-author recency merge*: every recency-over-trust mechanism autopsied is a spam/phishing seam; first-attester-wins stands.
3. *Chain-free convergence dreams*: BFT-CRDTs converge but punt sybil + liveness (the exact EFS hard parts b/c); Holochain spent a decade and ~$20M getting DHT "what exists" to beta. Keep a consensus chain in the loop for order, revocation, and existence.
4. *Advisory deletion presented as deletion* (Nostr/tombstone-GC failure mode): per-chain revocation honesty must extend to replicas (say what a replica reader does with origin revocations).
5. *Urbit's economic/political traps*: funding via scarce identity, sovereignty marketing ahead of mechanism, hosted-convenience quietly replacing self-host, undocumented mortal authorities (write the trust-root stewardship + fork doctrine docs — they are Urbit's missing documents).
6. *Silent cross-fork LWW*: fork-divergent state is a multi-value read; surface both, policy resolves.
7. *Waiting on identity-rotation research*: DeepKey's 8-years-unstable arc says don't invent novel rotation machinery; use the chain-registry pattern that works.

---

## 8. Sources

**CRDT / local-first**
- [P] Ink & Switch, "Local-first software" (2019): https://www.inkandswitch.com/essay/local-first/
- [P] Automerge 3.0 announcement (Aug 2025): https://automerge.org/blog/automerge-3/
- [P] automerge-perf columnar encoding: https://github.com/automerge/automerge-perf/blob/master/columnar/README.md
- [P] Yjs internals: https://github.com/yjs/yjs/blob/main/INTERNALS.md ; GC thread: https://discuss.yjs.dev/t/garbage-collection-and-version-snapshotting/1839
- [C/P] Moment devlog, "Lies I was Told, pt 2 — why we don't use Yjs": https://www.moment.dev/blog/lies-i-was-told-pt-2
- [P] Kleppmann, "Making CRDTs Byzantine Fault Tolerant" (PaPoC'22): https://martin.kleppmann.com/papers/bft-crdt-papoc22.pdf
- [P] Almeida & Shapiro et al., "The Blocklace" (2024): https://arxiv.org/abs/2402.08068
- [P] Kleppmann et al., "A Highly-Available Move Operation for Replicated Trees" (2021): https://martin.kleppmann.com/papers/move-op.pdf
- [P] Gentle & Kleppmann, "Collaborative Text Editing with Eg-walker" (EuroSys 2025): https://arxiv.org/abs/2409.14252 ; Loro's explainer: https://loro.dev/docs/concepts/event_graph_walker
- [P] Evan Wallace, "How Figma's multiplayer technology works" (2019): https://www.figma.com/blog/how-figmas-multiplayer-technology-works/
- [P] localfirst.fm #7 — James Long on Actual Budget HLC sync: https://www.localfirst.fm/7
- [P] Ink & Switch Keyhive notebook (2024–26): https://www.inkandswitch.com/keyhive/notebook/
- [C] Sync-engine landscape 2025: https://adamnyberg.se/blog/2025-02-11-real-time-sync-engines/ ; https://syntax.fm/show/924/sync-engines-and-local-data (ElectricSQL pivot, Zero/LiveStore/etc.)

**Holochain**
- [P] DHT: https://developer.holochain.org/concepts/4_dht/ ; Validation: https://developer.holochain.org/concepts/7_validation/ ; Countersigning: https://developer.holochain.org/concepts/10_countersigning/ ; Glossary (warrants, source chain): https://developer.holochain.org/resources/glossary/
- [P] Beta release (Feb 2023): https://blog.holochain.org/holochain-beta-released/ ; "2025 at a Glance: Landing Reliability": https://blog.holochain.org/2025-at-a-glance-landing-reliability/ ; Roadmap: https://www.holochain.org/roadmap/
- [P] DeepKey (unstable-dpki in 0.4): https://github.com/holochain/deepkey ; https://developer.holochain.org/resources/upgrade/upgrade-holochain-0.4
- [C] "The Holochain Ecosystem in 2025: A Friendly Reality Check": http://alternef.garden/blog/holochain-ecosystem-reality-check-2025
- [C] ICO ≈ $20.65M (2018): https://icomarks.ai/ico/holo ; https://cryptobriefing.com/holochain-hot-token-progress-report/

**Urbit**
- [P] Urbit ID: https://docs.urbit.org/urbit-id/what-is-urbit-id ; azimuth.eth: https://docs.urbit.org/urbit-id/azimuth-eth ; L2 naive rollups: https://developers.urbit.org/reference/azimuth/l2/layer2 ; https://github.com/urbit/azimuth
- [C] Compact Magazine, "The Rise and Fall of Urbit": https://www.compactmag.com/article/the-rise-and-fall-of-urbit/
- [C] Jeremy Tunnell, "Urbit is at a crossroads" (via search extracts; direct fetch 404'd): https://www.jeremytunnell.com/post/urbit-at-a-crossroads
- [C] Martian Computing, "Urbit Update 2025": https://martiancomputing.substack.com/p/urbit-update-2025
- [C] Messari, "Look to the Stars" (active users "a few thousand", Sept 2022): https://messari.io/report/look-to-the-stars-navigating-the-urbit ; https://en.wikipedia.org/wiki/Urbit

**Staleness notes:** Automerge numbers current to Aug 2025; Holochain status through early 2026 (0.6 in flight); Urbit status through ~April 2025 (post-Yarvin-return, pre-any-2026 developments — no reliable 2026 network metrics found); Keyhive still lab-notebook stage as of latest dispatches.
