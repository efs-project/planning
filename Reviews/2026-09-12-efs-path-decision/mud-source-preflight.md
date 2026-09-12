# MUD: a credible reuse candidate, not yet a cost winner

September 12, 2026 · Codex source preflight, incorporating independent MUD research · no clone/install/build/deployment or benchmark

**Scope:** James excluded an EAS implementation from this sprint. MUD remains a real candidate, not just a source of ideas. Claude's independent Road C proposal is still to come; read this after writing that proposal to reduce anchoring.

Inspected source revision: `0e49b51ba934438e49c7f098e78d6e3ddf7567fb`, resolved by the researcher from the MUD remote. The public documentation shows 2.2.23; do not assume it corresponds to that commit. Pin a release/compiler/dependency set explicitly before any comparison run.

## Most useful candidate to test

Proposed, not adopted:

`EOA / contract → dedicated World → non-root EFS admission System → write-protected Store tables + separate required-query contract`

Keep canonical EFS content, subject identities and authored evidence independent of physical table IDs and the World address. Admission validates the required EFS rules and updates mandatory discovery atomically. Optional indexes have separate coverage and no ability to rewrite evidence.

MUD's Store provides schema-described storage, packed representations, generated table wrappers, generic contract reads and mutation events. World adds permissioned dispatch and namespace access management. Store-only is also possible, but EFS would need its own authorization/routing; it is not automatically simpler. These are worthwhile infrastructure components to evaluate, rather than reimplement by default. [Store introduction](https://mud.dev/store/introduction), [World introduction](https://mud.dev/world/introduction).

EFS still supplies the semantic layer: canonical exact identities, portable author evidence, stable Files and history, checked references, pinned acceptance rules, competing selections/Lenses and qualified query completeness. A MUD table schema is not automatically an EFS Type. That custom work is the object of the comparison, not a reason to disqualify reuse.

## Source-backed traps for the comparator

1. **Public entrypoints versus mandatory acceptance.** World's raw mutation functions check table access and call Store directly. An account with table write access need not enter the EFS System. Restrict raw writes to trusted admission machinery, enumerate all set/splice/delete routes and test them. “Write-protected” does not mean confidential: table data remains public. [World source](https://github.com/latticexyz/mud/blob/0e49b51ba934438e49c7f098e78d6e3ddf7567fb/packages/world/src/World.sol#L137), [access control](https://mud.dev/world/namespaces-access-control).

2. **Hooks are not a permanent trust policy.** Store hooks can run around record mutations, but root execution and namespace administration need explicit treatment. World documentation warns that root Systems can bypass ordinary access control; namespace owners can manage Systems and hooks. Keep testnet upgrades, disclose their powers, and design permanent constraints separately. Simply installing a hook does not prove that future privileged actions cannot bypass EFS acceptance. [Store hooks](https://mud.dev/store/store-hooks), [World introduction](https://mud.dev/world/introduction), [access control](https://mud.dev/world/namespaces-access-control).

3. **Event-only tables change the promise.** In inspected `StoreCore.setRecord`, an offchain-table write emits an event and returns before state persistence or hooks. It cannot be substituted for the required contract-readable EFS state to claim a saving. [StoreCore source](https://github.com/latticexyz/mud/blob/0e49b51ba934438e49c7f098e78d6e3ddf7567fb/packages/store/src/StoreCore.sol#L290).

4. **Stock index helpers are not our bounded query implementation.** The inspected `KeysWithValueHook` records `keyTuple[0]` against a hash of the complete value. Removing a match reads, filters and replaces the matching array. This is not evidence of a scalable composite-key, paged, Lens-consistent folder/tag query. We need a deliberately bounded required-query implementation, including backfill and coverage. [Pinned hook source](https://github.com/latticexyz/mud/blob/0e49b51ba934438e49c7f098e78d6e3ddf7567fb/packages/world-modules/src/modules/keyswithvalue/KeysWithValueHook.sol#L146).

These findings were independently rechecked by the coordinator against the cited documentation and pinned source excerpts. They are integration constraints, not claims that MUD is unsafe or unsuitable.

## What to measure next

Use the [[overhead-and-selection|shared semantic fixture]]: a revision-preserving quote File, checked pair reference, developer acceptance, EOA and genuine contract authorship, two selected histories, required folder/tag query, unrelated contract read and independent export/import. Reuse semantic code where it isolates storage overhead, but permit a better MUD physical representation if meaning and reconstruction remain identical.

Compare the MUD-backed version with the best eligible compact/custom implementation. Include setup, writes, paid reads, required index maintenance, state growth, clean-reader acquisition and implementation effort. Neither raw table-write gas nor package reuse alone answers whether MUD wins.

The critical question is: **does using MUD remove enough maintained infrastructure and integration risk, at an acceptable complete cost, to be the better EFS foundation?** This source pass makes that question concrete; it supplies no gas answer yet.
