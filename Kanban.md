---

kanban-plugin: board

---

## Backlog

- [ ] Schema spec freeze — confirm the moment PR #20 merges (7→9 schemas locked). #repo/contracts #depends-on/lists-merge
- [ ] Freeze smart-contract .sol file list — lock the set the moment PR #20 merges. #repo/contracts #depends-on/lists-merge
- [ ] **Implement OnionDAO subset of [[sdk-architecture]]** — read/write so entrants can add data; the near-term subset of the full SDK design (now In Flight). Separate CODE thread, after the design is frame-reviewed; final wiring gated on Lists→Sepolia. Target end of next week. #repo/sdk #depends-on/sdk-architecture-design #depends-on/lists-sepolia-deploy
- [ ] **Discuss + draft OnionDAO entrant onboarding + flyers** — @james will initiate a separate discussion fork before drafting; PM resurfaces each session until started. Needs: "add your first data to EFS in 5 min" doc + flyer copy (tracks, prizes, dates, start-here URL). #repo/planning #blocked-on/human-decision
- [ ] Build On-Chain SDK (folder management, permissions) — full impl of [[sdk-architecture]] on-chain surface; the "OnionDAO subset" card above is the near-term cut #repo/sdk #depends-on/sdk-architecture-design
- [ ] Build Off-Chain DB SDK (core ops, tombstoning, caching) — full impl of [[sdk-architecture]] off-chain surface #repo/sdk #depends-on/sdk-architecture-design
- [ ] Deploy core contracts to Sepolia (OnionDAO 2026-06-01) #repo/contracts #depends-on/lists-merge
- [ ] Plan OnionDAO hackathon logistics — venue/dates/prize amounts/judging/onboarding docs/comms plan #repo/planning
- [ ] **Fix contracts spec drift** — `contracts/specs/` still uses "edition" (now "lens" per ADR-0043) and "TagResolver" (now "EdgeResolver" per ADR-0041). `specs/overview.md` says 6 core contracts; actual on `custom-lists` is different — needs reconciliation. Vocab audit (`bs-vocab-coherence-audit-v1` 2026-05-26) found 7 high-severity drift instances + 14 Glossary gaps. Small contracts-repo doc task; can be agent-driven. #repo/contracts
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

- [ ] **EFS Lists — almost done** (PR #20, `custom-lists`→`main`). LIST + LIST_ENTRY (7→9 schemas) + resolvers + ListReader, per ADR-0044/0046. PM-reviewed 2026-05-30 → ready to merge after 2 trivial CI fixes (dev's); review findings live on the PR, not here. Keystone for OnionDAO; schema freeze + Sepolia deploy gated on merge. #repo/contracts
  — @james + dev, PR #20, expires 2026-06-01 (PM watching for merge)



## Blocked



## Under Review

- [ ] **[[sdk-architecture]] — SDK design at #status/review** — awaiting @james's promote/revise + Q1 fork (in For-James ⚡). Q2–Q6 resolved; reframed to on-chain Solidity lib + off-chain TS. #repo/sdk #kind/design
  — @sdk-designer → awaiting @james, no expiry (Under Review cards don't expire per [[conventions]])
- [ ] **PM SOUL [[Agents/pm]]** drafted, at #status/review — awaiting @james promote (low priority, not OnionDAO-blocking). #repo/planning #kind/design
  — @pm → awaiting @james, no expiry


## Done

- [x] Promote [[0001-design-system]] — meta-design promoted 2026-05-21 by @james (delegated)





%% kanban:settings
```
{"kanban-plugin":"board","list-collapse":[false,false,false,false,false]}
```
%%