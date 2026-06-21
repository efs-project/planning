---

kanban-plugin: board

---

## Backlog

- [ ] **Holistic architecture review → freeze → Sepolia deploy** (James kicks off w/ system-architect skill). REFRAMED 2026-06-01: first a first-principles smoke-test of the whole contract + API stack (API completeness, human-understandability, coherence, industry-standard, 100-year use-case durability, right-contracts-right-shapes) — **ignoring existing ADRs/specs as constraints; do the right thing, fix what's not right** — THEN freeze schemas + deploy Sepolia with upgradeable contracts. Brainstorms/ = durability testbed. **Horizon split (one agent): SCHEMA SHAPES = deadline-critical + HIGH bar (hackathon seeds real datasets that MUST last; get shapes right, freeze, never change — frozen-schema changes orphan data); CONTRACT LOGIC = upgradeable, iterate freely (stable proxy addresses, never orphans data); deep 100-year review continues for non-schema parts + mainnet, non-blocking. (Corrected 2026-06-01: Sepolia data is NOT disposable. Schema UID = hash(fieldString,resolverAddr,revocable), no chainId — portable across chains if resolver address matches.)** Model DECIDED 2026-05-31: frozen schemas + stable resolver addresses (proxies) + upgradable logic; set stays flexible. Prompt finalized after 3 review rounds (human-gated schema freeze; initializer-guard + register-proxy-not-impl as hard gates), ready in chat. Sub-tasks if/when it proceeds: (1) freeze schemas (ASAP at merge); (2) put stateful resolvers (EFSIndexer, EdgeResolver, MirrorResolver, EFSSortOverlay, ListEntryResolver) behind stable proxies + storage-layout discipline; (3) **write a superseding ADR for the upgradeable-proxy model** (supersedes ADR-0030) — incl. the open **proxy-admin trust model** decision (multisig/timelock/announced/burn); (4) count-vs-discriminator sizing audit (ADR-0047 did maxEntries); confirm revocable flags; CREATE2-at-mainnet; adversarial-review hardening carry-overs. Canonical home = contracts repo (ADR + `docs/` checklist). **UNBLOCKED — Lists merged 2026-06-01; this is now the critical path.** PM launch prompt refactored (open/frame-first) + 3-subagent expert-reviewed, ready in chat. Review flags for the thread: sizing pass is now-or-never pre-freeze (widening changes the UID — NOT free); resolvers need immutable→proxy refactor (real scope) so the likely-fastest path = deploy Sepolia now in current shape, proxy refactor before mainnet; register the PROXY address not impl; UID-equality + storage-layout = blocking CI gates. #repo/contracts
- [ ] **Implement OnionDAO subset of [[sdk-architecture]]** — read/write so entrants can add data; the near-term subset of the full SDK design (now In Flight). Separate CODE thread, after the design is frame-reviewed; final wiring gated on Lists→Sepolia. Target end of next week. #repo/sdk #depends-on/sdk-architecture-design #depends-on/lists-sepolia-deploy
- [ ] **Discuss + draft OnionDAO entrant onboarding + flyers** — @james will initiate a separate discussion fork before drafting; PM resurfaces each session until started. Needs: "add your first data to EFS in 5 min" doc + flyer copy (tracks, prizes, dates, start-here URL). #repo/planning #blocked-on/human-decision
- [ ] Build On-Chain SDK (folder management, permissions) — full impl of [[sdk-architecture]] on-chain surface; the "OnionDAO subset" card above is the near-term cut #repo/sdk #depends-on/sdk-architecture-design
- [ ] Build Off-Chain DB SDK (core ops, tombstoning, caching) — full impl of [[sdk-architecture]] off-chain surface #repo/sdk #depends-on/sdk-architecture-design
- [ ] Deploy core contracts to Sepolia (OnionDAO) — UNBLOCKED (Lists merged); rolls into the freeze/deploy thread. "Try hard to keep data, but it's testnet" framing. #repo/contracts
- [ ] Plan OnionDAO hackathon logistics — venue/dates/prize amounts/judging/onboarding docs/comms plan #repo/planning
- [ ] **Fix contracts spec drift** — `contracts/specs/` still uses "edition" (now "lens" per ADR-0043) and "TagResolver" (now "EdgeResolver" per ADR-0041). `specs/overview.md` says 6 core contracts; actual on `custom-lists` is different — needs reconciliation. Vocab audit (`bs-vocab-coherence-audit-v1` 2026-05-26) found 7 high-severity drift instances + 14 Glossary gaps. Now also: add LIST/LIST_ENTRY (2-line stubs → ADR-0044/0046, specs/06) to `planning/Glossary.md`; reconcile schema count to 9. Small doc task; agent-driven. #repo/contracts #repo/planning
- [ ] **Plan an off-chain "EFS-in-Postgres" indexer pattern** — dev UX brainstorm + L2/indexer perspectives ([`bs-third-party-dev-ux-v1`](Brainstorms/2026-05-26-bs-third-party-dev-ux-v1-dev-friction-walkthroughs.md), [`bs-system-design-perspectives-v1`](Brainstorms/2026-05-26-bs-system-design-perspectives-v1-contract-surface-from-n-angles.md) 2026-05-26) both flag this. Every nontrivial dev abandons high-level read APIs within a day. Packaged off-chain indexer reference may matter more pre-launch than SDK polish. #repo/sdk #kind/design
- [ ] **Explore `EFSUploadGateway` wrapper contract** — single architectural change that addresses 8-prompt MetaMask detonation + L2 sequencer gas budget + AA-wallet bundling. Surfaced by `bs-system-design-perspectives-v1` 2026-05-26 as highest-leverage architectural ask; doesn't break any contract-decomposition direction. #repo/contracts #kind/design
- [ ] **Sync `contracts/` specs on `main` when Lists merges** — `main` is 40 days stale; lists-aware spec drift will detonate at merge. Per `bs-rot-audit-v1`. Plan for the spec-sync PR before Lists merges so it's ready to land same-day. #repo/contracts
- [ ] **Add `#status/shelved` (or `#status/hibernating`) to vocabulary** — rot audit flagged that `client/` (124 days quiet) and `contracts/main` (40 days quiet) should be labeled "hibernating" not "abandoned" but the vocab doesn't exist. Small vocab addition to [[conventions]] + [[design-system]]. #repo/planning
- [ ] **Update LAUNCH_CHECKLIST.md (contracts repo)** — still cites April dates as the live launch plan per rot audit. #repo/contracts
- [ ] Build **EFS OS SDK** (capability surface for sandboxed Ring 3 Apps per [[Brainstorms/2026-05-26-pm-client-os-architecture]]) — deferred, not OnionDAO-required #repo/sdk
- [ ] Build Client Skeleton (UI, media caching, thumbnails) #repo/client
- [ ] Build EFS Development Tool App (standalone issue tracker for dogfooding)
- [ ] Formalize EFS design process (frame-first lifecycle) — from [[Brainstorms/2026-05-28-pm-design-process-synthesis]]; likely `Onboarding/design-process.md`. Blocked on James's frame review of the proposal. #repo/planning #kind/design #blocked-on/human-decision
- [ ] Migrate clones to /efs/ home directory layout #repo/planning #blocked-on/human-decision


## In Flight

- [ ] **OnionDAO hackathon bundle** (@oniondao + @james): building datasets + helping James with the flyer. One-pager + flyer copy + idea lists at `hackathon/onepager-draft.md`. ✅ **Sepolia is LIVE** → concierge entry (Discord → seeding script) is now viable. **2 forks still pending in For-James ⚡: entry path + prizes.** #repo/planning
  — @oniondao, claimed 2026-06-10, expires 2026-06-24
- [ ] **Seed whitepaper dataset** — Sepolia LIVE; ready to run. Pin PDFs to IPFS (one IPIP-499 profile) + Arweave (~<$0.10) → record contentHash+size+cid → seeding script attests DATA+MIRROR(s) to live Sepolia. **Only gate left: credentials (pinning-service key + funded Arweave wallet) — James-provisioned.** #repo/planning
  — needs @james credentials, then agent-runnable
- [ ] **Debug client → Sepolia support** (@client-sepolia) — nextjs explorer on live Sepolia + network switcher (**PR #30 OPEN**) + gas-drip faucet hook (**PR #31 OPEN**). The participant-facing UI. #repo/contracts
  — @client-sepolia, PRs #30/#31, claimed 2026-06-11, expires 2026-06-24
- [ ] **SDK build** (@sdk) — building against [[sdk-architecture]] in the `sdk/` repo; owns holistic-review SDK-shape fixes (DX-2/3/8/11/13, group 4). **Progress 2026-06-20 (branch `chore/scaffold`):** read core + Tier-1 write + edge/value writes (`graph.tags/props/pins`) + lists (read+write) + REDIRECT (write + opt-out read-time following) + escape hatches (`raw`/`eas`/`decode`) + schema-UID integrity gate (`verifyDeployment`) + AA-ready Submitter seam + `@efs/solidity` compile-in lib all built (~416 TS + ~48 forge tests, ~27 kB gzip). Manifest in [[sdk-architecture]] + [[sdk-review-backlog]] reconciled. **Deferred/open:** sorts (`@experimental`; SORT_INFO unfrozen), one-signature `batch()`/resume (type-present, behavior-absent), mirrors writes, folder Overviews + tag-exclusion filter (in progress), EFSBytesStore re-vendor (gated on contracts PR #29). **Noteworthy:** PROPERTY `forSchema` fix (key-anchors were invisible to spec readers); ADR-0050 redirect resolution spec unpinned (SDK fail-closes on cycle vs ADR lowest-UID-in-SCC) — surfaced upstream. #repo/sdk
  — @sdk, repo efs-project/sdk (PR #1 draft, CI green), claimed 2026-06-10, expires 2026-06-24
- [ ] **Act on holistic review** → [[Reviews/2026-06-10-holistic-review]] (canonical 79-finding detail; track WORK here by its fix-groups, not by finding). Findings resolve via PRs citing IDs (git = completion log).
  - [x] **G1 Reconciliation** — ✅ ENG-1 settled (froze uint16); ENG-2 split-brain resolved (schema-freeze merged to main 2026-06-11). Remaining doc-hygiene (ENG-3/6/7/8/9/10) folds into normal sweeps.
  - [ ] **G2 kernel/router fixes** (GAS-1/2/3/14, SEC-3 guard, DX-9, custom-errors) — partial: ✅ SEC-1 (header sanitize) + ARCH-4 (chainId validation) closed by @web3-uri PR #32 — @schema-freeze owns the rest
  - [ ] **G3 Pre-freeze decision ADRs** (ARCH-1/2/3/8/12, DX-4 events) — @james decides, @arch-review writes
  - [ ] **G4 SDK shape** (DX-2/3/8/11/13) — @sdk
  - [ ] **G5 Hackathon UX** (UX-1/2/4/5/13/7/9/10 — none freeze-gated) — client/hackathon work
  - [ ] **G6 Pre-mainnet backlog** (remaining ARCH/SEC/GAS/DX/ENG) — later
  — @pm tracks; #repo/contracts #repo/sdk #repo/client #repo/planning

## Blocked



## Under Review

- [ ] **[[sdk-architecture]] — SDK design at #status/review** — awaiting @james's promote/revise + Q1 fork (in For-James ⚡). Q2–Q6 resolved; reframed to on-chain Solidity lib + off-chain TS. #repo/sdk #kind/design
  — @sdk-designer → awaiting @james, no expiry (Under Review cards don't expire per [[conventions]])
- [ ] **PM SOUL [[Agents/pm]]** drafted, at #status/review — awaiting @james promote (low priority, not OnionDAO-blocking). #repo/planning #kind/design
  — @pm → awaiting @james, no expiry


## Done

- [x] **web3:// file bytes — productionized** (@web3-uri) — `EFSBytesStore` as ERC-5219 on-chain byte store (**PR #29**) + hardened web3:// serving: pagination, parity, sanitize, chainId (**PR #32**), both merged 2026-06-21. Bonus: closes holistic **SEC-1** (header injection) + **ARCH-4** (chainId validation). Designs `web3-standards-compliance.md` / `mirror-scheme-policy.md` in vault.
- [x] **Multi-chain deploy tooling** — per-chain `deployedContracts.ts` (**PR #33**) + env-config hardening (#28) + ADR renumbers (#35), merged 2026-06-21.
- [x] **🚀 EFS DEPLOYED TO SEPOLIA** (~2026-06-18, PR #24) — 9 schemas frozen + registered live, upgradeable resolvers, CREATE3/Safe deploy + SystemAccount. The keystone gate cleared; the hard irreversible foundation (Lists → freeze → deploy) is DONE. Unblocks dataset seeding + participant data-entry.
- [x] **Markdown README pane + on-chain exclude filtering merged** — contracts `main` 2026-06-10 (commit 60284dd, branch `markdown-for-items`). System-tagged README-per-item pane in the nextjs explorer + new redeployable `EFSFileViewFiltered` contract (excludes system items at the read layer, tested) + sandboxed PDF preview; external/Codex-reviewed. Realizes the readme-per-item model; no freeze impact (FileView is redeployable). Explorer now renders the whitepaper `.md` cards + hides system files — feeds the hackathon participant view.
- [x] **EFS Lists merged** — PR #20 → `main` 2026-06-01 (commit b1ac4e0). LIST + LIST_ENTRY schemas (7→9) + ListResolver/ListEntryResolver/ListReader + ADR-0044/0046/0047. Design doc landed frozen. Unblocks schema freeze + Sepolia deploy.
- [x] Promote [[0001-design-system]] — meta-design promoted 2026-05-21 by @james (delegated)





%% kanban:settings
```
{"kanban-plugin":"board","list-collapse":[false,false,false,false,false]}
```
%%