---

kanban-plugin: board

---

## Backlog

- [ ] Schema spec freeze — collapses into Lists merge (In Flight). Confirm freeze the moment Lists merges. #repo/contracts #depends-on/lists-merge
- [ ] Freeze smart-contract .sol file list — collapses into Lists merge (In Flight). Lock the set immediately after Lists merges. #repo/contracts #depends-on/lists-merge
- [ ] Design: on-chain + off-chain SDK architecture (dedicated AI design session — @james initiates via in-chat prompt) #repo/sdk #kind/design
- [ ] Build On-Chain SDK (folder management, permissions) — OnionDAO MVP #repo/sdk #depends-on/sdk-architecture-design
- [ ] Build Off-Chain DB SDK (core ops, tombstoning, caching) — OnionDAO MVP #repo/sdk #depends-on/sdk-architecture-design
- [ ] Deploy core contracts to Sepolia (OnionDAO 2026-06-01) #repo/contracts #depends-on/lists-merge
- [ ] Plan OnionDAO hackathon logistics — venue/dates/prize amounts/judging/onboarding docs/comms plan #repo/planning
- [ ] Build Client App SDK (iframe integrations) — deferred, not OnionDAO-required #repo/sdk
- [ ] Build Client Skeleton (UI, media caching, thumbnails) #repo/client
- [ ] Build EFS Development Tool App (standalone issue tracker for dogfooding)
- [ ] Migrate clones to /efs/ home directory layout #repo/planning #blocked-on/human-decision


## In Flight

- [ ] **Merge EFS Lists** (branch `custom-lists` on efs-project/contracts) — keystone for OnionDAO. Schema 6→7, reworks PROPERTY, adds `EdgeResolver.sol`, removes `TagResolver.sol`. Schema freeze + Sepolia deploy gated on this. James confirms 2026-05-26: "wrapping up the List design." T-6 days. #repo/contracts
  — @james, branch custom-lists, claimed 2026-05-21, expires 2026-05-29 (PM nudge if no merge by then)
- [ ] Draft the PM SOUL file at Agents/pm.md #repo/planning #kind/design
  — @pm, direct push to planning, claimed 2026-05-21, expires 2026-05-29 (low priority — not blocking OnionDAO)



## Blocked



## Under Review



## Done

- [x] Promote [[0001-design-system]] — meta-design promoted 2026-05-21 by @james (delegated)





%% kanban:settings
```
{"kanban-plugin":"board","list-collapse":[false,false,false,false,false]}
```
%%