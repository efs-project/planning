---

kanban-plugin: board

---

## Backlog

- [ ] **Run sovereign-OS competitive deep-dive program** — prioritized multi-agent dossiers and hands-on failure labs for Logos, Urbit, Sandstorm, DXOS, Anytype, Pear, Holochain, Solid, Snaps, Puter, ICP, ethOS, Fileverse, and security/browser precedents. Common method, evidence labels, waves, and completion gates live in [[2026-07-21-codex-sovereign-os-deep-dive-program]]; keep detail there rather than expanding this card. #repo/planning #repo/client #repo/sdk #kind/task
- [ ] **Fix contracts spec drift** — `contracts/specs/` still uses "edition" (now "lens" per ADR-0043) and "TagResolver" (now "EdgeResolver" per ADR-0041); `specs/overview.md` contract count/schema count is stale (now 10 schemas incl. WHITEOUT). (Glossary terms added 2026-07-23.) Vocab audit (`bs-vocab-coherence-audit-v1`) found 7 high-severity drift instances + 14 Glossary gaps. Small doc task; agent-driven. #repo/contracts #repo/planning
- [ ] **Plan an off-chain "EFS-in-Postgres" indexer pattern** — dev-UX brainstorm ([`bs-third-party-dev-ux-v1`](Brainstorms/2026-05-26-bs-third-party-dev-ux-v1-dev-friction-walkthroughs.md), [`bs-system-design-perspectives-v1`](Brainstorms/2026-05-26-bs-system-design-perspectives-v1-contract-surface-from-n-angles.md)) both flag this: every nontrivial dev abandons high-level read APIs within a day. A packaged off-chain indexer reference may matter more than SDK polish. #repo/sdk #kind/design
- [ ] **Explore `EFSUploadGateway` wrapper contract** — single change addressing multi-prompt MetaMask detonation + L2 gas budget + AA bundling. Surfaced by `bs-system-design-perspectives-v1` as highest-leverage. NOTE: the SDK's layered `multiAttest` + burner-session work already softened the write-UX pain — re-scope before building. #repo/contracts #kind/design
- [ ] **Update LAUNCH_CHECKLIST.md (contracts repo)** — still cites April dates as the live launch plan (per rot audit). #repo/contracts
- [ ] **Crypto-whitepaper reference dataset — seed if/when there's demand** — 20-coin dataset staged on-disk at `datasets/crypto-whitepapers/` (18 license-verified PDFs + markdown about-cards). Sepolia is live; only gate is pinning/Arweave creds + a seeding run. De-prioritized now the buildathon has wound down — keep as a ready demo asset. #repo/planning
- [ ] Build **EFS OS SDK** (capability surface for sandboxed Ring 3 Apps per [[Brainstorms/2026-05-26-pm-client-os-architecture]]) — deferred, not near-term #repo/sdk
- [ ] Build Client Skeleton (UI, media caching, thumbnails) — the standalone `client/` repo is hibernating; the live explorer lives in `contracts/packages/nextjs` #repo/client
- [ ] Build EFS Development Tool App (standalone issue tracker for dogfooding)
- [ ] Formalize EFS design process (frame-first lifecycle) — from [[Brainstorms/2026-05-28-pm-design-process-synthesis]]; likely `Onboarding/design-process.md`. Blocked on James's frame review. #repo/planning #kind/design #blocked-on/human-decision
- [ ] Migrate clones to /efs/ home directory layout #repo/planning #blocked-on/human-decision


## In Flight

- [ ] **Grants — research + tracker + submissions** (@grants) — funder-landscape research + a lightweight operational tracker in `Grants/` (README/programs/proposals/packet/research-log), + preparing James's actual submissions. First external anchor = the [EFS KarmaHQ page](https://www.karmahq.xyz/project/ethereum-file-system/about); first proposal row = Octant (rejected, competitive — keep the row + feedback). Tracking detail lives in `Grants/proposals.md` (not mirrored here); this card is just the swarm-visible pointer to the active work. James-actionable items (Karma cleanup: no team listed, funds raised = 0, bare "Path to Success"; program picks; submission sign-offs) route to [[Owner-Inbox]] only when they're real forks/deadlines. #repo/planning #kind/ops
  — @grants, structure blessed by @pm 2026-07-05, expires 2026-07-30

- [ ] **EFS v2 — "the one final freeze before mainnet"** (@fable / @codex-gpt-5) — a bounded, batched re-freeze of the data model, justified on **permanent properties** (portable/deterministic IDs → cross-chain replicability, offline/light-client verifiability, atomic+idempotent one-popup writes) that no additive overlay can retrofit. **Current shape (2026-07-07 carrier ruling): a native envelope kernel + tag-core, 9 record kinds collapsed to 5.** The earlier EAS-carried proposal is superseded; `deterministic-ids` is a reopened baseline and the umbrella/transition docs are historical inputs, not current authority. **Read `Designs/efsv2/README.md` for the current spine — this card is a pointer, not a summary.** Corpus in `Designs/efsv2/`, `Designs/clientv2/`, `Reviews/`. **Status: reconciliation-ready, not promotion-ready.** The efsv2 owner queue is under a **sequencing hold** (see the queue itself + `Open-Decisions.md` for its current terms) — an inventory, not a packet to batch-answer. Still proposes superseding the 2026-06-01 never-change-frozen-schemas commitment and the v1 Sepolia UID set. #repo/planning #repo/contracts #repo/sdk #kind/design
  — @fable / @codex-gpt-5, claimed 2026-07-23, expires 2026-07-30; owner queue held

- [ ] **SDK build** (@sdk) — building [[sdk-architecture]] in `sdk/`, branch `chore/scaffold` (141 commits ahead of `main`). Read core + Tier-1 write + edge/value writes + lists (R/W) + REDIRECT + escape hatches + schema-UID integrity gate + AA-ready Submitter seam + `@efs/solidity` compile-in lib all built (~416 TS + ~48 forge tests, ~27 kB gzip). **PR #1 is open + CI-green but 22 commits behind `chore/scaffold`** — James to merge soon (repoint the PR at the live branch or catch it up first). Deferred/open: sorts (SORT_INFO unfrozen), one-signature `batch()`, mirrors writes. #repo/sdk
  — @sdk, repo efs-project/sdk (PR #1 open, CI green), claimed 2026-07-23, expires 2026-07-30
- [ ] **Act on holistic review** → [[Reviews/2026-06-10-holistic-review]] (canonical 79-finding detail; track WORK here by fix-group, not by finding). Findings resolve via PRs citing IDs (git = completion log).
  - [x] **G1 Reconciliation** — ✅ ENG-1 settled (froze uint16); ENG-2 split-brain resolved (schema-freeze merged to main).
  - [x] **G2 kernel/router fixes** — ✅ SEC-1 (header sanitize) + ARCH-4 (chainId) closed by @web3-uri PR #32; remaining GAS/guard items folded into the shipped freeze/deploy work.
  - [ ] **G3 Pre-freeze decision ADRs** (ARCH-1/2/3/8/12, DX-4 events) — mostly moot post-freeze; sweep for any that still matter pre-mainnet.
  - [x] **G4 SDK shape** (DX-2/3/8/11/13) — @sdk (built on `chore/scaffold`).
  - [ ] **G5 Hackathon UX** (UX-1/2/4/5/13/7/9/10) — landed via the live-Sepolia explorer + minimal-clicks + burner-session work.
  - [ ] **G6 Pre-mainnet backlog** (remaining ARCH/SEC/GAS/DX/ENG) — revisit before mainnet.
  — @pm tracks, claimed 2026-07-23, expires 2026-07-30; #repo/contracts #repo/sdk #repo/client #repo/planning

## Blocked



## Under Review

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
