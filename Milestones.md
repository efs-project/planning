# Milestones

Cross-repo milestone tracking for EFS. Each section names a target with a date and the designs / Kanban items that must land for it to be hit.

**How to use this file** (for agents and James):

- Add a section per milestone. `## Milestone name (YYYY-MM-DD)`.
- Under each, list the designs (`[[NNNN-slug]]`) and the Backlog Kanban items required for that milestone.
- When a design or item lands, check it off rather than removing it (keeps history visible).
- A milestone is "hit" when all checkboxes check. Move closed milestones to the bottom under `## History`.

**Owners**: James adds/edits scope. Agents may check off completed items as part of their landing-ceremony commit but should not edit a milestone's scope without James's say-so (it's a Tier 1 action — see [[escalation]]).

---

## OnionDAO hackathon (2026-06-01 → 2026-06-30)

EFS hosts its first hackathon at OnionDAO across the month of June 2026. **Goals:** critical feedback on the system, and start a data network effect. **Prizes:** self-funded.

### Two tracks

1. **Interesting datasets** — entrants build curated content on EFS. Drives real content into the system.
2. **SDK builds** — devs use the EFS SDK to build apps and tools on top. Validates the dev experience.

### Hard requirements (must ship before 2026-06-01)

- [ ] **Schema spec freeze.** Once frozen, schema UIDs are stable. Any subsequent schema change creates a new UID and orphans prior attestations (per `contracts/AGENTS.md` Etched-tier rules). See `contracts/specs/02-Data-Models-and-Schemas.md` for the current schema set.
- [ ] **Smart contract `.sol` file list freeze.** Contracts will be **upgradeable to fix bugs**, but **adding or removing `.sol` files is much harder.** Decide which contracts exist by June 1; don't add new ones during hackathon. (Bug-fix upgrades to existing contracts remain possible.)
- [ ] **Core deployed to Sepolia.** EFS contracts live and reachable on Sepolia. Data added during OnionDAO should persist long-term (best-effort; see data-loss tolerance below).
- [ ] **SDK MVP for OnionDAO.** Two SDK packages needed for hackathon dev experience:
    - [ ] On-chain SDK — folder management, permissions, EAS attestation wrappers
    - [ ] Off-chain DB SDK — core ops, tombstoning, caching
  Client SDK (iframe integrations, OS-type stuff) is **NOT required for OnionDAO** — it's a later concern.

### SDK scope — what counts as SDK

- The **kernel, graph, and other contracts are NOT part of the SDK.** They're EFS proper: simple, immutable contracts that do their job.
- The **SDK is a separate set of upgradeable APIs** wrapping the contracts for dev ease-of-use. Lots of options, regularly improved by the EFS team.
- This split matters because contracts can't be updated freely once on mainnet; the SDK can. Devs build against the SDK; the SDK adapts.
- A dedicated AI design session is planned for SDK architecture — see [[Decisions]] 2026-05-21 entry. Don't start SDK code without that design landing.

### Data-loss tolerance during this phase

This is the **Sepolia phase** — devnet-grade, pre-mainnet. Data **may still be lost** in rare cases (state corruption, fork restart, etc.), but **we try REAL HARD not to**. Hackathon entrants should be told: their data should persist, but treat anything truly precious with care until mainnet.

Once we release to mainnet, data loss becomes a critical concern — that's a separate milestone with its own (much stricter) guarantees.

This distinction matters for: backup strategy, replay safety, snapshot tools, and what we communicate to entrants.

### Backlog items tied to this milestone

From [[Kanban]] Backlog. As work begins, each should move into In Flight with the standard claim annotation:

- [ ] Build On-Chain SDK (folder management, permissions) — **required** for SDK MVP
- [ ] Build Off-Chain DB SDK (core ops, tombstoning, caching) — **required** for SDK MVP
- [ ] Build Client App SDK (iframe integrations) — **deferred** (not OnionDAO-required; "later concern" per @james 2026-05-21)
- [ ] Build Client Skeleton (UI, media caching, thumbnails) — useful target for dataset-track entrants but not strictly required

Also needed (not yet a Backlog item — flagging here):

- [ ] **Decide and freeze the smart-contract `.sol` file list** before 2026-06-01. Likely a Tier-1 design conversation in `#repo/contracts`. Bug-fix upgrades stay possible after freeze; adding/removing files does not.

(The "EFS Development Tool App" Backlog item is internal dogfooding, not OnionDAO-blocking.)

### Stretch (nice-to-have)

*(open — fill in as priorities emerge)*

### Out of scope (deferred to later milestones)

- Production-grade data-loss guarantees (Sepolia is best-effort).
- Mainnet contract deployment.
- Production EFS client (the separate `efs-project/client` repo isn't built yet).

---

## Devcon presentation (2026-11)

Public talk at Devcon. Far enough out that scope is open; populate as the date approaches.

### Likely shape

- EFS overview + system architecture.
- Demo of working system (depends on OnionDAO outcome).
- Lessons learned from OnionDAO hackathon — content vs. dev tracks, data network-effect signal, what broke.

### Hard requirements

*(none locked in yet)*

---

## History

*(closed milestones land here as one-line summaries with their hit date)*

---

## Notes

- The contracts repo has `LAUNCH_CHECKLIST.md` covering contract-specific launch blockers. That file is authoritative for contracts-side blockers; this file is the cross-repo rollup that adds dataset, SDK, hackathon-coordination, and presentation scope on top.
- Milestone-scope discussion happens with James in chat, not via PR edits to this file.
