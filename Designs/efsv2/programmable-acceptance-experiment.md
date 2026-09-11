# Programmable acceptance — isolated implementation evidence

**Status:** reference — disposable experiment, not a frozen Core mechanism
**Target repos:** planning, contracts, sdk, client
**Last touched:** 2026-09-10

#status/reference #kind/note #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2

## Why this exists

James requires Type developers to be able to run custom validation before data
is accepted. The proposed mandatory Type-rule design was recorded at
`cf352ed6bd5e2396550cbba068f56c1986d069c6` in
`Designs/efsv2/programmable-type-acceptance.md`. This experiment deliberately
starts from runtime pin `92f2d6bd7d021f2dc5488482fe29f68bbef41d38` and reads that
design separately; it does not merge both long-lived branch histories.

The code and exact result ledger live in
[the isolated acceptance lab](https://github.com/efs-project/planning/blob/e358ad66bb6471e1d89b1327d03c5ba7a286b116/Reviews/2026-09-10-programmable-acceptance/README.md)
and [its evidence ledger](https://github.com/efs-project/planning/blob/e358ad66bb6471e1d89b1327d03c5ba7a286b116/Reviews/2026-09-10-programmable-acceptance/results.md).
It is not wired into the existing C0 writer, Files indexes, wallet, carrier or
upgrade system. Fable's simultaneous export/recovery and real-wallet work remains
a separate lane.

## Concrete engineering direction

- Exact Types commit their mandatory rule. No-rule Types are explicit and
  cannot grant the ruled Type's acceptance.
- A plan names an exact local activation. No first registrant may select the
  executor for everybody who uses a portable Type. Code/configuration checks
  accompany the consumer's explicit activation trust.
- One guarded accepting writer authenticates the author, ordered effects and
  local execution constraints. Read-only rules use STATICCALL; stateful rules
  use ordinary CALL with atomic EVM rollback and exact funding. Developer code
  never executes by delegatecall in Core storage.
- Retained receipts distinguish the authenticated author from the original
  immediate Core caller, which may be a controller contract. They do not
  universally identify the transaction sender, ultimate fee/value funder, or
  gas payer/sponsor. Exact retries return the old outcome without fresh rule
  value or a new action; retry gas is separate.
- Outfit compatibility and current Equip eligibility are separate. An explicit
  application policy can preserve historical equipment after a rule update.
  An arbitrary link to an old Outfit is not an accepted new Equip.
- A generated additive Outfit revision keeps the original compatibility rule.
  An older exact-Type editor refuses it instead of deleting unfamiliar data or
  treating a version label as a compatibility proof.

The lab uses a small flat ABI-word schema to isolate these questions. It is not
the final codec, complete layered Type interpreter, managed-Principal surface,
index/query implementation, lifecycle engine or a guarantee about all future
rule programs.

## Implications and remaining gates

[Design follow-through](https://github.com/efs-project/planning/blob/e358ad66bb6471e1d89b1327d03c5ba7a286b116/Reviews/2026-09-10-programmable-acceptance/design-followthrough.md)
records simplicity tradeoffs, the Type/profile comparison and explicit limits.
[Integration obligations](https://github.com/efs-project/planning/blob/e358ad66bb6471e1d89b1327d03c5ba7a286b116/Reviews/2026-09-10-programmable-acceptance/integration.md)
identify the actual Core/SDK seams and regression needed before testnet use.

Executable local acceptance, generated cross-language helpers and an independent
consumer are evidence toward V2-E8. They do not by themselves close historical
upgrades, full-C0 bypass/index rollback, real-wallet UX, export authentication,
or permanent Type/query identity choices. Existing V2-E5/F1/F2 owner gates remain
unchanged. No immediate owner questionnaire or public deployment is implied.
