# GoE contracts and live Sepolia prototype

**Status:** pinned-source and bounded live-chain observation, verified 2026-08-05

#kind/review #status/done #repo/planning #topic/git #topic/onchain

## Contract topology

GoE uses three principal contract layers:

1. **`GoeHub`:** creates repositories, maps owner/name to repository clones, lists repositories, and selects the repository implementation and FlatDirectory factory used for future repositories.
2. **`GoeRepo`:** one clone per repository, holding name, default branch, active branches, branch heads, logical push-record history, creators, and access roles.
3. **FlatDirectory:** one storage contract created for each repository, holding Git packfile bytes through the EthStorage large-storage/SDK path.

Audited source: [`goe-contracts@89bf59a`](https://github.com/ethstorage/goe-contracts/tree/89bf59af4b2a123b2ad6abd761be4ea41a9f7089).

## Hub control and repository identity

`GoeHub` is owned. Its owner can replace:

- the implementation cloned for newly created repositories;
- the FlatDirectory factory used for new repositories.

Existing repository clones retain their selected implementation code and FlatDirectory address; they are not proxy-upgraded through the Hub. Their canonical `goe://` form uses the repository contract address plus chain ID.

The observed Hub owner was a single externally owned account when checked. That account controls the implementation/factory offered to future repositories, not the bytecode already fixed behind existing minimal clones. Refresh this before any governance claim.

This is a sensible prototype deployment model, but it creates three identity/control layers EFS must not conflate:

- Hub owner/name lookup — discovery convenience;
- repository contract address — one chain/deployment instance;
- portable EFS repository identity — must survive moving away from that contract/backend.

## Roles and branch state

Each repository initializes:

- `DEFAULT_ADMIN_ROLE`;
- `MAINTAINER_ROLE`;
- `PUSHER_ROLE`.

The creator receives all three. The public wrapper methods intend to let maintainers manage pushers and set the default branch; the default admin can add maintainers. In the deployed implementation, the inherited role-admin check makes the default admin the effective pusher-role administrator. The contract supports branch enumeration and a default branch.

There is an implementation mismatch in “maintainers can manage pushers”: `addPusher()`/`removePusher()` first accept a maintainer, but then call OpenZeppelin `grantRole()`/`revokeRole()`, whose default role-admin check still requires `DEFAULT_ADMIN_ROLE`. A maintainer without the default-admin role therefore cannot actually complete that operation. Treat the current default admin as the effective role administrator.

A branch records:

- current 20-byte Git OID;
- active push-record length;
- existence;
- original branch creator.

Normal `push()` requires a pusher/maintainer/admin and checks that the caller-supplied `parentOid` equals the current branch head. It then records the new OID, packfile key/size, timestamp, and Ethereum pusher address.

Force push and deletion are available to the original branch creator, maintainer, or admin. The branch creator privilege persists independently of the current pusher role. A dedicated design must decide whether that is intended ownership or an incomplete revocation model.

## Push-record history

Push records form a per-branch logical sequence. Force push can:

- delete the branch;
- replace the full logical history;
- truncate to a caller-selected prior record and append a new record.

The physical Solidity array may retain overwritten/truncated storage, but public query methods return only the current `activeLength`. Therefore GoE's normal interface does not provide an immutable, append-only, complete audit history of every displaced ref state.

Ethereum transaction/event history may retain evidence, but reconstructing it requires archive/index behavior outside the repository's current-state API. A portable Git profile should explicitly retain ref transitions, force-push displacement, authority epoch, and current policy rather than calling logical truncation “immutable history.”

## Fast-forward semantics

The normal contract path verifies only that the supplied `parentOid` equals the current head. The current helper separately uses native Git ancestry checks and builds a pack from the expected range.

That works for an honest official client. The contract itself does not parse Git objects or prove that `newOid` descends from `parentOid`. A modified authorized client can supply current-head equality without proving Git ancestry.

This is a policy-boundary lesson, not necessarily a reason to make Solidity parse Git packs. A standard Git gateway, reproducible verifier, or explicit signed policy result may enforce ancestry while the portable record preserves who asserted/accepted the transition.

## Storage integrity and availability

Before recording a push, `GoeRepo` asks FlatDirectory for the packfile size and requires it to match the supplied size. Later Git fetch downloads packfiles and uses `git index-pack`, which validates Git pack/object integrity. The current helper keys a pack by its ending commit OID rather than an immutable digest of the pack bytes, so different pack encodings ending at the same commit can collide at the storage layer.

That gives useful tamper detection. It does not guarantee:

- the packfile remains retrievable;
- every object needed for the advertised ref is present;
- the provider/storage contract cannot be deleted, withheld, or administratively changed;
- another carrier has a complete copy;
- the full repository can be reconstructed after some push records/packs fail;
- refs are atomically consistent across branches.

A Git OID protects object identity; it does not by itself provide retention or ref policy.

## Observed Sepolia deployment

The 0.2.0 CLI configures:

- Hub `0xe0CAb641c88d7E00D4fEfC91aD87657FFd2Af79E`;
- Sepolia chain ID `11155111`;
- one plain-HTTP Ethereum RPC endpoint;
- the official EthStorage testnet RPC.

A bounded event scan on 2026-08-05 observed:

- 29 `RepoCreated` events from 2026-01-08 through 2026-02-03;
- 17 repository contracts with ref-related activity;
- approximately 90 branch/ref update events across those active repositories;
- 22 names shaped as automated `goe-e2e-*` tests;
- a small `hello-world` example with several pushes by more than one pusher.

These counts establish that the implementation was deployed and exercised. They do not establish 29 users, 17 independent maintainers, production retention, mainnet readiness, economic sustainability, or meaningful public adoption.

## Credible-neutrality assessment

| Plane | Current GoE assessment |
|---|---|
| Git object integrity | promising: ordinary Git objects/packs and `index-pack` verification |
| Ref current state | Ethereum contract state, but one deployment and SHA-1-only fields |
| Ref history | incomplete through normal API after logical force-push truncation |
| Write authority | wallet roles in repository contract; rotation/recovery limited |
| Read access | public contract state, but official helper requires an unlocked wallet |
| Byte availability | EthStorage testnet plus configured endpoint; no plural-carrier proof |
| Endpoint diversity | one hardcoded Ethereum RPC and one EthStorage RPC in 0.2.0 |
| Standard Git exit | Git objects are native, but no documented clean-room/alternate-backend restore |
| Independent serving | no stock HTTPS/SSH gateway or independently operated public endpoints found |
| Governance | project-controlled Hub/factory for new repos; repository roles per clone |
| Security | testnet prototype pending production-scoped independent review; see threat-model companion |
| Forge | not present |

The fair label is:

> A real, installable, exercised Sepolia Git remote prototype with onchain refs and EthStorage packfiles—not yet a credibly neutral GitHub replacement.
