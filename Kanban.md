---

kanban-plugin: board

---

## Backlog

- [ ] **Review the EFS Arcade design set and rule D1–D7** (@fable, started 2026-08-07) — the 2026-08-07 Arcade validation pass on branch `fable/2026-08-07-arcade` produced `Designs/arcade/` (11 docs, verdict: conditional go as a labeled demo/guest-UX probe, Sept-11 target) + `Reviews/2026-08-07-arcade-deep-dive.md` + a 13-lane corpus. Time-sensitive: the D1–D7 owner decisions gate the pre-away build window (~Aug 14), and the pass confirmed 67 durable Sepolia files carry non-canonical keccak contentHash values — the seeder fix gates ALL further durable seeding. Entry: [[Designs/arcade/README]]. #repo/planning #repo/contracts #repo/content #kind/design — make Git/forge a flagship v2 workload without adding Git-specific kernel primitives. V1 floor to pressure-test: stable host-independent repo identity; stock unauthenticated clone/fetch + authenticated push; byte-exact Git objects; atomic replay-safe ref history; guest file/commit/diff browsing; plural verified availability; ordinary Git import/export; and explicit Git workspaces for EFS files. Later: portable issues/patches/PRs/reviews. Thin agent slice: open Agent Skills + `AGENTS.md` repos and pinned releases; public shared knowledge stays distinct from private memory/context. Research and acceptance frame: [[2026-07-29-pm-credibly-neutral-git-forge-and-agent-artifacts]]. NANDA's skill-release slice is a downstream compatibility pressure: [[2026-07-29-pm-nanda-neutral-agent-infrastructure-pressure]]; its identity, evidence, index, and runtime requirements route to their existing passes, not this card. Feed generic gaps into the coordinated v2 recut before freeze; do not start a GitHub or NANDA clone. #repo/planning #repo/contracts #repo/sdk #repo/client #kind/design
- [ ] **Run portable schemas + validators + EAS interoperability deep dive** (@fable) — preserve EAS's good developer properties without reintroducing chain-bound identity: reusable application schemas, contract-verifiable shapes/policies, browsable types, bounded queries by type, and loss-aware real-EAS import/export/projection. Handoff is ready at [[fable-handoff-portable-schemas-and-validators]]. The lens pass has landed; run this before the coordinated envelope/kernel recut freezes Etched kind/body/ID/index surfaces, and reconcile its schema-trust/admission vocabulary with [[lens-spec]]. #repo/planning #repo/contracts #repo/sdk #kind/design
- [ ] **Run sovereign-OS competitive deep-dive program** — prioritized multi-agent dossiers and hands-on failure labs for Logos, Urbit, Sandstorm, DXOS, Anytype, Pear, Holochain, Solid, Snaps, Puter, ICP, ethOS, Fileverse, and security/browser precedents. Common method, evidence labels, waves, and completion gates live in [[2026-07-21-codex-sovereign-os-deep-dive-program]]; keep detail there rather than expanding this card. #repo/planning #repo/client #repo/sdk #kind/task
- [ ] **Fix contracts spec drift** — `contracts/specs/` still uses "edition" (now "lens" per ADR-0043) and "TagResolver" (now "EdgeResolver" per ADR-0041); `specs/overview.md` contract count/schema count is stale (now 10 schemas incl. WHITEOUT). (Glossary terms added 2026-07-23.) Vocab audit (`bs-vocab-coherence-audit-v1`) found 7 high-severity drift instances + 14 Glossary gaps. Small doc task; agent-driven. #repo/contracts #repo/planning
- [ ] **Reconcile the 2026-06-10 holistic review with the v2 redesign before implementation/mainnet work resumes** — [[Reviews/2026-06-10-holistic-review]] remains the canonical 79-finding v1 detail. G1/G2/G4/G5 landed; G3 is mostly moot and G6 is pre-mainnet inventory. Reclassify only the findings that survive the v2 constitution instead of keeping the old review permanently In Flight. #repo/contracts #repo/sdk #repo/client #repo/planning #kind/task
- [ ] **Plan an off-chain "EFS-in-Postgres" indexer pattern** — dev-UX brainstorm ([`bs-third-party-dev-ux-v1`](Brainstorms/2026-05-26-bs-third-party-dev-ux-v1-dev-friction-walkthroughs.md), [`bs-system-design-perspectives-v1`](Brainstorms/2026-05-26-bs-system-design-perspectives-v1-contract-surface-from-n-angles.md)) both flag this: every nontrivial dev abandons high-level read APIs within a day. A packaged off-chain indexer reference may matter more than SDK polish. #repo/sdk #kind/design
- [ ] **Explore `EFSUploadGateway` wrapper contract** — single change addressing multi-prompt MetaMask detonation + L2 gas budget + AA bundling. Surfaced by `bs-system-design-perspectives-v1` as highest-leverage. NOTE: the SDK's layered `multiAttest` + burner-session work already softened the write-UX pain — re-scope before building. #repo/contracts #kind/design
- [ ] **Retire stale v1 launch guidance in contracts** — draft PR [contracts #42](https://github.com/efs-project/contracts/pull/42) already marks `AGENTS.md`, `LAUNCH_CHECKLIST.md`, and `QUESTIONS.md` as v1/reference. It is mergeable and doc-only; CI has two green jobs and one `deploy-pin-check` infrastructure timeout to rerun/clear. #repo/contracts
- [ ] **Crypto-whitepaper reference dataset — seed if/when there's demand** — 20-coin dataset staged on-disk at `datasets/crypto-whitepapers/` (18 license-verified PDFs + markdown about-cards). Sepolia is live; only gate is pinning/Arweave creds + a seeding run. De-prioritized now the buildathon has wound down — keep as a ready demo asset. #repo/planning
- [ ] Build **EFS OS SDK** (capability surface for sandboxed Ring 3 Apps per [[Brainstorms/2026-05-26-pm-client-os-architecture]]) — deferred, not near-term #repo/sdk
- [ ] Build Client Skeleton (UI, media caching, thumbnails) — the standalone `client/` repo is hibernating; the live explorer lives in `contracts/packages/nextjs` #repo/client
- [ ] Formalize EFS design process (frame-first lifecycle) — from [[Brainstorms/2026-05-28-pm-design-process-synthesis]]; likely `Onboarding/design-process.md`. Blocked on James's frame review. #repo/planning #kind/design #blocked-on/human-decision
- [ ] Migrate clones to /efs/ home directory layout #repo/planning #blocked-on/human-decision


## In Flight

- [ ] **Target-community research — who are EFS's first real users?** (@communities, Codex) — the vault has abstract use cases and technical-competitor dossiers but **zero research on real communities with real populations**. Hypothesis: image/media galleries (pixiv, boorus, imageboards); scoped to research widely (fan archives, scanlation, emulation/preservation, open data, photography, zines, dead-platform diasporas). Wedge to find: **who has already lost an archive** — purges, payment-processor deplatforming, shutdowns. Includes an honest content-class risk column, since EFS content is permanent, public, and not centrally removable. Deliverables: dated corpus in `Reviews/`, ranked shortlist of 3–5, the requirements each implies (validates or breaks current designs), candidate first apps. **Parallel-safe**; barred from `Designs/efsv2/` and the inboxes. Frame in [[Decisions]] 2026-07-29. #repo/planning #kind/task
  — @communities, claimed 2026-07-29, expires 2026-08-05

- [ ] **Grants — research + tracker + submissions** (@grants) — funder-landscape research + a lightweight operational tracker in `Grants/` (README/programs/proposals/packet/research-log), + preparing James's actual submissions. First external anchor = the [EFS KarmaHQ page](https://www.karmahq.xyz/project/ethereum-file-system/about); first proposal row = Octant (rejected, competitive — keep the row + feedback). Tracking detail lives in `Grants/proposals.md` (not mirrored here); this card is just the swarm-visible pointer to the active work. James-actionable items (Karma cleanup: no team listed, funds raised = 0, bare "Path to Success"; program picks; submission sign-offs) route to [[Owner-Inbox]] only when they're real forks/deadlines. #repo/planning #kind/ops
  — @grants, structure blessed by @pm 2026-07-05, expires 2026-07-30

- [ ] **EFS v2 — "the one final freeze before mainnet"** (@fable / @codex-gpt-5) — a bounded, batched re-freeze of the data model, justified on **permanent properties** (portable/deterministic IDs → cross-chain replicability, offline/light-client verifiability, atomic+idempotent one-popup writes) that no additive overlay can retrofit. **Current shape (2026-07-07 carrier ruling): a native envelope kernel + tag-core, 9 record kinds collapsed to 5.** The earlier EAS-carried proposal is superseded; `deterministic-ids` is a reopened baseline and the umbrella/transition docs are historical inputs, not current authority. **Read `Designs/efsv2/README.md` for the current spine — this card is a pointer, not a summary.** Corpus in `Designs/efsv2/`, `Designs/clientv2/`, `Reviews/`. **Status: reconciliation-ready, not promotion-ready.** The efsv2 owner queue is under a **sequencing hold** (see the queue itself + `Open-Decisions.md` for its current terms) — an inventory, not a packet to batch-answer. Still proposes superseding the 2026-06-01 never-change-frozen-schemas commitment and the v1 Sepolia UID set. #repo/planning #repo/contracts #repo/sdk #kind/design
  **✓ KEL × authority × filesystem reconciliation pass LANDED 2026-07-25. ✓ Dedicated lens/resolver pass LANDED 2026-07-28.** The full revalidated packet (P-1…P-23 + LP-1…LP-10) is answerable, but the hold remains until James lifts it or answers an individual item; Q3/Q4 remain held. P-1 is the dependency root.
  **Input for the replacement spec (@pm surfaced 2026-07-29):** the read surface has no **diagnostic channel** — nothing carries *why* a read returned what it did. [[file-browser-requirements]] J9 ("why this file?") and the `UNKNOWN`/basis-pinning/fail-closed vocabulary both need it. Framing + the trap in [[Ideas]] § per-read diagnostic channel: derived diagnostics are reader-computed, **not portable and not a record kind**; authored claims are already TAG/PROPERTY/REDIRECT/WHITEOUT. What the frozen layer may need is only a **stable diagnostic vocabulary** + honest basis/`UNKNOWN` metadata in exports.
  — @fable passes complete; next: James lifts the hold or answers P-1 → coordinated envelope/kernel recut + replacement-spec completion

## Blocked



## Under Review

- [ ] **ArDrive product teardown → EFS File Browser feature requirements** (@ardrive-teardown) — all three deliverables landed 2026-07-29: teardown record [[2026-07-29-ardrive-product-teardown]] + 14-file corpus in `Reviews/`, [[file-browser-requirements]] draft in `Designs/clientv2/` (must-match / do-differently / can-skip + lenses-in-a-file-UI + mount constraints + 19 acceptance tests), positioning line included in both. Adversarially verified (7-reviewer pass: fact-check, rulings-consistency, conventions, 4 personas) and revised before landing. Awaiting review of the `#status/draft` requirements doc. #repo/planning #repo/client #kind/task
  — @ardrive-teardown (claude-fable-5) → awaiting review, no expiry
- [ ] **[[sdk-architecture]] — SDK design at #status/review** — awaiting @james's promote/revise. Open questions resolved; the SDK agent is already building against it (PR #1). Promoting just ratifies what's being built. #repo/sdk #kind/design
  — @sdk-designer → awaiting @james, no expiry
- [ ] **PM SOUL [[Agents/pm]]** drafted, at #status/review — awaiting @james promote (low priority). #repo/planning #kind/design
  — @pm → awaiting @james, no expiry


## Done

- [x] **FS deletion + pre-launch hardening (WHITEOUT = additive 10th schema)** — landed on contracts `main` (2026-06-23): per-name WHITEOUT deletion + cross-lens negative mask, anchor depth raised to 1024, redirect/contentHash specs, view-layer whiteout suppression, freeze/burn runbooks updated. Additive schema (schemas can be added freely) — no orphaning of the frozen 9.
- [x] **Instant Sepolia burner session** (PR #39) — merged to `main` 2026-06-23. Chain-aware burner wallet + network persistence + Sepolia-first public builds. Realizes the burner-wallet half of the [[Ideas]] entry; multi-wallet-as-one-identity-in-lenses still open.
- [x] **Easy-edits reliability (#41) + post-seal retry/smoke (#40)** — hardened burner connect, overview tag writes on wallet client, IPFS/Arweave gateway env normalization, sealed-retry smoke correctness. Merged to `main` 2026-06-23/24.
- [x] **🧅 BUILDATHON — "The Forever Files" — WOUND DOWN (low interest, 2026-07-01)** — full kit shipped (@oniondao): flyer + announcement + Discord pinned + templates + judging rubric + 4 sample datasets in `hackathon/`. Participant path went live (Sepolia explorer #30 + faucet #31 + minimal-clicks #36 + burner session #39). Flyers handed out 2026-06-23; turnout was low so James is likely cancelling — see For-James for the formal-cancel-vs-let-lapse call. Everything built is reusable for a future event.
- [x] **Debug explorer → live Sepolia** (@client-sepolia) — Sepolia + 3-network switcher (#30), gas-drip faucet (#31), minimal-clicks batch writes (#36), browser read caching (#38) — all merged 2026-06-23.
- [x] **web3:// file bytes — productionized** (@web3-uri) — `EFSBytesStore` ERC-5219 on-chain byte store (#29) + hardened web3:// serving (#32: pagination, parity, sanitize, chainId), merged 2026-06-21. Closes holistic SEC-1 + ARCH-4.
- [x] **Multi-chain deploy tooling** — per-chain `deployedContracts.ts` (#33) + env-config hardening (#28) + ADR renumbers (#35), merged 2026-06-21.
- [x] **🚀 EFS DEPLOYED TO SEPOLIA** (~2026-06-11, PR #24) — 9 schemas frozen + registered live, upgradeable resolvers, CREATE3/Safe deploy + SystemAccount. The keystone irreversible foundation (Lists → freeze → deploy) is DONE.
- [x] **Markdown README pane + on-chain exclude filtering** — contracts `main` 2026-06-10 (commit 60284dd). System-tagged README-per-item pane + `EFSFileViewFiltered` (excludes system items at the read layer) + sandboxed PDF preview.
- [x] **EFS Lists merged** — PR #20 → `main` 2026-06-01. LIST + LIST_ENTRY schemas (7→9) + resolvers + ADR-0044/0046/0047. Unblocked schema freeze + Sepolia deploy.
- [x] Promote [[0001-design-system]] — meta-design promoted 2026-05-21 by @james (delegated).




%% kanban:settings
```
{"kanban-plugin":"board","list-collapse":[false,false,false,false,false]}
```
%%
