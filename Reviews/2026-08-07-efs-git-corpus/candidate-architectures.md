# EFS Git — candidate architectures and adversarial comparison

**Status:** deep-dive comparison, 2026-08-07. Four genuinely distinct shapes, each pushed until it broke or held. Recommendation at the end, with falsifiers.

#kind/review #status/done #repo/planning #topic/efsv2 #topic/git

## Candidate A — "Standard Git + replaceable gateway + generic signed records" (the smallest additive option)

**Shape:** conventional smart-HTTP/SSH gateway serving bare repos; EFS adds only ordinary records: a repo descriptor (repoId), ref-transition claims *as evidence* (no specified fold), placement receipts for periodic bundles. No new profile, no collaboration objects, no wiki UX. Canonical heads = whatever the gateway serves; the records let anyone audit it after the fact.

- **Canonical state:** gateway bare repos (operationally); EFS records (forensically).
- **Write path:** stock push → gateway CAS → gateway operator batch-publishes ref claims + bundles.
- **Read path:** stock clone; anonymous browse via any Git web UI.
- **Failure behavior:** gateway loss → restore from last bundle + claims, with a manual reconciliation step (claims have no specified deterministic reading).
- **Interop:** perfect (it *is* stock Git).
- **Cost/latency:** lowest; publish cadence is the operator's batching choice.
- **Freeze impact:** zero.
- **Security:** replay/stale-serving only *detectable*, not neutralized — with no normative fold, two auditors can disagree about the canonical head after a contested sequence; the gateway is a de facto authority while it lives.
- **What EFS contributes:** identity + archival evidence + exit. Genuinely useful — this is "GoE done right."

**Verdict:** necessary but not sufficient. It passes G-HOST minimally and G-EXIT, but fails the differentiation test exactly where GoE fails it (authority evolution, authenticated ref *history with a defined reading*, plural views) and delivers no wiki. **Kept as milestone 1 of candidate B** — every artifact of A is a strict subset of B.

## Candidate B — Git-workspace profile over generic records (recommended)

**Shape:** everything in A, plus: the `GIT-REF/1` typed fold over admission-ordered ref claims (CAS/replay/policy-epoch semantics as a *read profile*), closure-before-advertise with digest-addressed containers, dual-digest OID binding, page-identity sidecar, minimal proposal/acceptance objects, LFS mapping, wiki UX on the clientv2 surfaces, GATE-connected skill releases. Kernel: **zero new surface**. Full model: [state-model](./state-model.md), [storage-closure-recovery](./storage-closure-recovery.md), [wiki-and-collab](./wiki-and-collab.md).

- **Canonical state:** Git object graph (content) + admitted ref-claim history (ref truth) + derived heads (deterministic fold). Gateways are rebuildable caches.
- **Failure behavior:** gateway loss → mechanical rebuild (trace T14); contested writes → deterministic, universally identical resolution + preserved evidence; carrier loss → repair from any survivor, identity unchanged.
- **Interop:** stock clone/fetch/push preserved; the fold only governs *which heads EFS advertises as canonical*, which the gateway materializes into ordinary refs.
- **Cost/latency:** edits local and free; publish = one envelope + container upload; reads free at G0/G1.
- **Freeze impact:** none on the kernel; riders on P-1 (needs the authority lane for the strongest grade) and E2 (ref-claim cost fixture); AMBIENT/1 owed for guests. See [freeze-impact](./freeze-impact.md).
- **Security:** replay defeated by first-admission immutability + predecessor witnesses + the one-shot rule; policy rollback by epoch binding; partial multi-ref states excluded by transaction commitments (`txnRoot`/`refCount`) even against subset-carrying relayers; force-push evidence durable; ancestry and availability verified by object-bearing readers above the fold. Residuals named in [threat-and-economics](./threat-and-economics.md).
- **What EFS contributes:** the full differentiation sentence, each clause load-bearing ([primitive-fit-gap](./primitive-fit-gap.md) §4).

**Where it could break (attacked):** (1) if the fold cannot be specified deterministically across implementations — and this must be faced at its honest size: `GIT-REF/1` is an order-dependent transactional state machine (transaction grouping, predecessor witnesses, four intents, glob policy matching, THRESHOLD quorum, epoch windows, degraded rungs) — GATE/1-scale, which is precisely why the two-implementation vector suite is the non-negotiable gate; (2) if per-publish admission cost is unaffordable — E2 fixture decides; degraded rungs exist meanwhile; (3) if browser Git can't carry the editor. On (3) the browser lane's verdict is directly supportive: wiki-sized repos (tens of MB, thousands of files) are comfortably inside the 2026 client-side envelope with two viable engines (isomorphic-git v1.40, wasm-git/libgit2-on-OPFS at ~1 MB), and the mitigation ladder is exactly this design's shape — shallow/single-branch working sets, pack-not-loose storage on OPFS, server-prepared bundle bootstrap, and a github.dev-style virtual-FS default tier for reading (GitHub itself runs no client-side Git for its web editor). Monorepos and media-heavy repos are outside the envelope and stay on the power path ([prior-art/browser-git-and-opfs](./prior-art/browser-git-and-opfs.md)).

## Candidate C — chain-maximal: Git semantics in contract state (rejected)

**Shape:** GoE extended to the finish: every ref a contract slot with contract-enforced CAS/fast-forward, per-object or per-pack on-chain commitments, maybe objects-as-records.

**Rejected because:** (1) contract-enforced fast-forward requires the contract to know Git ancestry — either parse packs on-chain (absurd gas) or trust the client (GoE's actual behavior — theater); (2) per-slot state-dependent rejection violates admission confluence and would be Git-specific kernel behavior (C-6) — the exact thing the kickoff forbids without a failed generic test, and the generic test *passes* (candidate B); (3) SHA-1-shaped permanent contract fields inherit E7's dead end; (4) it still doesn't deliver browsing, wiki, or exit — the hard product work remains after paying the highest protocol price. GoE's own implemented-vs-designed gap (atomicity, closure, recovery all TODO) is field evidence of this shape's gravity: the contract grows toward a forge and never gets there.

## Candidate D — P2P-first: adopt Radicle's replication layer (rejected as core; mined for parts)

**Shape:** Radicle-style peer namespaces + gossip as the canonical layer; EFS only archives bundles and anchors identities.

**Rejected because:** (1) two sovereign identity systems (Radicle DIDs/delegates vs KEL principals) with no clean subordination — repository authority would live outside KEL, forfeiting rotation/recovery/org succession, the layer EFS is best at (Radicle 2026: lost key = new identity, no org identities, multi-device "working on it"); (2) canonical-ref derivation from delegate quorums is a fixed policy that *stalls silently on divergence* where EFS has a typed policy family with a defined winner; (3) no anonymous web-grade read story (its own hosted Explorer got radicle.xyz ISP-blocklisted; the team blocks content on its own seeds) and no durable storage story (availability = someone's node is online; radicle.garden subscriptions are the sustainability plan) — the two most user-visible goals; (4) its CRDT-evaluated governance documents keep producing order-dependent bugs (identity-evaluation rework in 1.10.0 with an admitted unresolved redact/accept ambiguity) — exactly the class a total order deletes. **Mined:** per-peer namespaces (adopted as proposer-namespace refs), COBs-in-git precedent (informs the later forge layer), and the signed-refs replay incident (the forcing example for admission-ordered ref claims).

**The strongest counter-argument, answered head-on:** Radicle is the largest live sovereign forge (~8k repos, 600+ weekly nodes) and got there by *deleting* its Ethereum layer ([prior-art/goe-ethstorage-public-state](./prior-art/goe-ethstorage-public-state.md) §6). If "chain-anchored git" were simply better, Heartwood's arc falsifies naive versions of it. What the chain actually buys here — and what Heartwood demonstrably lacks — is specific: a total order for dispute/replay resolution (their #1 security incident), durable public ref *history* (their seeds serve current state only), identity recovery/rotation/organizations (their top user complaints), storage that outlives seeders, and anonymous verified reads without running a node. Candidate B spends the chain only on those five things; everything else stays native Git. That is also why the git-on-chain graveyard (Mango, GitTorrent, Pando, Gitopia, git3) doesn't apply: every one of those died at the collaboration/identity layer while over-building the storage layer — B's build is inverted.

## Comparison table

| Axis | A | B | C | D |
|---|---|---|---|---|
| Ordinary Git interop | ★★★ | ★★★ | ★★ (custom helper path) | ★★ (radicle tooling) |
| Neutral/rebuildable serving | ★★ (evidence only) | ★★★ (mechanical) | ★★ | ★★ (peer-dependent) |
| Authority evolution | ★ | ★★★ (KEL) | ★ (contract roles) | ★★ (delegates, no recovery) |
| Replay-safe ref history | ★ (detect) | ★★★ (neutralize) | ★★ | ★ (incident class) |
| Wiki product | — | ★★★ | — | ★ |
| Freeze pressure | none | none (riders only) | high (kernel) | none (but parallel stack) |
| Build cost | low | medium (gateway + profile + UX) | high | high (foreign stack) |
| Kills the differentiation sentence? | partly | no | no but unaffordable | yes (authority clause) |

## Recommendation

**Candidate B, built through A** (A's artifacts first, then the fold profile, then the wiki) — with the steelman named: **B buys a neutrality grade, not the wiki itself.** An A+wiki hybrid (A's substrate, the wiki editor, gateway-canonical heads honestly labeled) is a legitimate shape and is in fact *contained in the milestone ladder*: M1–M3 plus M5 running on venue-local order is shippable before the fold hardens, and P-11/P-12's rung labels are what make that honest rather than a betrayal. What the completed B adds above that hybrid is exactly the strongest-rung guarantees (replay-proof ref history, gateway-independent canonical heads for chain-connected readers) — the differentiation clause every surveyed competitor lacks. **First proving workload: the EFS Wiki workspace** — earned as workload, not assumed: the wiki exercises every layer (identity, refs, closure, guest reads, proposals) at a scale where every known risk (browser Git, admission cost, container size) is smallest; it applies the fs-pass draft canon's revision-DAG+curation shape (the held Q3's recommended arm — evidence toward Q3A, not a ruling); and it needs *none* of the deferred forge objects. Honesty note the product decision must carry: these three legs are all **supply-side**. The demand-side case (who edits this wiki, why, and against what cold-start plan — the Everipedia/NIP-54 lesson that community, not substrate, is the binding constraint on wikis) is deliberately left to the owner packet as an open product question, alongside the skills-first alternative whose demand evidence (ClawHavoc, marketplace trust gaps) this corpus also gathered. The skills registry rides the same substrate one release-object later either way. "Build GitHub" is explicitly not the target of any milestone in this pass.

**Falsifiers for B** (any one forces redesign, not patching): two independent implementations of `GIT-REF/1` cannot converge on the vector suite; the E2 fixture prices a wiki publish beyond batched-sponsorable range *and* P-13 provider-attested rungs are judged insufficient for canonical wikis; browser-side sparse checkout+commit proves infeasible on current phones *and* users reject gateway-assisted editing; or P-1 is rejected (no authority lane → no admission ordinals → the strongest replay story falls to venue-local order, i.e. candidate A grades).
