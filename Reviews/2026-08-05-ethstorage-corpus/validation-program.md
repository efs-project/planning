# EthStorage integration and walk-away validation program

**Status:** proposed evidence program; no implementation, funding, carrier endorsement, or milestone is authorized

#kind/review #status/done #repo/planning #topic/efsv2 #topic/storage #topic/preservation

## Purpose

Convert the proposed EFS/EthStorage boundary into a falsifiable experiment:

> An EFS object may use EthStorage for bytes and proof evidence, but its identity, authority, semantics, history, and recovery must survive removal of EthStorage and every EFS-operated service.

The experiment should test the existing generic EFS placement/manifest direction. It must not begin by adding EthStorage-specific kernel fields.

## Test corpus

Use deterministic, redistributable data with recorded source and expected digest:

1. 1 KiB text/Markdown file.
2. 100 KiB mixed small-file tree.
3. 1 MiB binary file.
4. 100 MiB chunked file.
5. 10,000-small-object synthetic repository-shaped set.
6. One ordinary public Git repository, using the separate GoE plan.
7. One static web application with JavaScript, WASM, media, content type, and security-header requirements.

For every case preserve a canonical EFS object/version ID, full digest, deterministic manifest, source fixture, and alternate placement.

## Phase A — write and cost

For each payload:

1. Calculate and record expected EFS and EthStorage commitments before submission.
2. Upload through the supported EthStorage SDK/FlatDirectory blob path.
3. Record every wallet prompt, Ethereum transaction, blob count, execution gas, blob gas, EthStorage upfront payment, retries, and partial failures.
4. Record time to Ethereum inclusion, provider pickup, first accepted proof, and first successful independent retrieval.
5. Interrupt one upload and test safe resume from another process/account where allowed.
6. Update an existing key and record how old/new payloads and EFS version history differ.

Report costs separately. Do not publish a single “cost per GB” number that hides execution, blob, contract, storage, verification, and future operational costs.

## Phase B — read and verification

Retrieve each object through:

- both official EthStorage-aware RPC endpoints;
- the official blob archiver where relevant;
- an independently operated non-mining `es-node`;
- any independently identified third-party provider endpoint;
- an ordinary gateway/client path with local commitment verification;
- the alternate non-EthStorage placement.

For every read record:

- endpoint/operator/failure domain where known;
- cold and warm latency;
- bytes and request count;
- range-read behavior;
- proof/state/commitment evidence used;
- locally recomputed full EFS digest;
- stale, missing, corrupted, or inconsistent results;
- what the client can honestly say when an endpoint withholds.

Inject one corrupted response and one script-substitution response. The verifier must reject both before sensitive execution.

## Phase C — provider and proof reality

1. Run a non-mining node from a documented clean machine.
2. Record disk, bandwidth, sync time, shard behavior, peer discovery, configuration, license requirements, and operational dependencies.
3. If authorized and economically bounded, test the current mining/whitelist path; otherwise document the exact permission gate.
4. Track one object's proof observations over several proof windows.
5. Compare proof events with actual whole-file retrieval from each available operator.
6. Determine whether any source exposes a defensible complete-replica or independent-operator count. Report `UNKNOWN` if not.

The test fails if the UI/data model converts proof submission into an unsupported replication or permanence statement.

## Phase D — carrier migration

1. Place the same EFS version on EthStorage and at least one unrelated carrier.
2. Remove all EthStorage retrieval hints from the active client configuration.
3. Reconstruct the file from the alternate placement.
4. Add a new placement under a different EthStorage contract/key or later network version.
5. Verify that the EFS object ID, authority, paths, references, schema relationships, version history, and Git identity did not change.
6. Verify that the old placement remains attributable as historical evidence rather than silently rewritten.

Failure means the integration boundary is too deep.

## Phase E — walk-away drill

Starting from a clean environment, assume unavailable:

- every EFS-operated API, domain, gateway, database, indexer, relayer, and signing service;
- official EthStorage RPCs and blob archiver;
- the original publishing workstation;
- one of the surviving carriers.

Provide only:

- public specifications and open/reusable implementation source;
- ordinary Ethereum access;
- documented EFS exports/recovery material;
- independently operated surviving placements;
- user-controlled authority/recovery material.

A fresh operator must:

1. verify the EFS object and authority chain;
2. reconstruct paths, versions, schemas, relationships, and placements;
3. retrieve and verify bytes;
4. serve the object under a new domain/gateway;
5. repair a missing placement;
6. continue authorized updates without changing the object's identity.

If a private EFS database, one official RPC, one admin signature, or the official OS is indispensable, the walk-away claim has failed.

## Phase F — web application closure

For the static application fixture:

1. Bind every executable/resource dependency in a complete manifest.
2. Authenticate the relevant Ethereum state.
3. verify each returned payload and response/security metadata locally;
4. block execution until the required closure is verified;
5. demonstrate an injected mutable third-party script is rejected;
6. run the same package through an alternate carrier without changing release identity;
7. record which capabilities remain outside the byte verifier, including sandbox, privacy, and availability.

This should compare directly with EthStorage's client-side verifier rather than invent a competing benchmark definition.

## Success criteria

- All canonical EFS identifiers remain unchanged across placement failure and migration.
- An independent client recomputes every expected commitment/digest.
- Public reads work without an account, wallet, or full OS boot.
- At least two independently controlled carrier domains can reconstruct the selected object.
- Loss/withholding produces an honest graded result, not “not found” or silent fallback.
- Proof observations and retrieval observations remain separately queryable.
- No EthStorage-specific value is required to interpret the base EFS object.
- A clean-room operator restores and continues service without EFS-operated infrastructure.
- Costs and operational requirements are reproducible from retained evidence.

## Failure and design-handoff rules

| Failure | First design destination |
|---|---|
| EFS ID changes with carrier | identity/placement boundary |
| no generic way to express proof/retrieval evidence | availability-evidence/library design |
| no safe streaming/range verification | large-file manifest/read design |
| app executes before closure verification | client package/runtime design |
| official endpoint required for recovery | adapter/node/export design |
| OS required to recover portable state | protocol/client boundary |
| ordinary contract must synchronously read payload | state/bytecode or supplied-witness tier |
| provider proof cannot support preservation policy | monitoring/repair policy, not kernel |

Only a reproduced generic failure should reopen the EFS kernel. EthStorage API inconvenience alone is an adapter/SDK problem.

## Outputs to retain

- scripts and exact versions;
- deterministic test corpus and manifests;
- transaction/proof/retrieval receipts;
- cost and latency tables;
- node configuration and hardware record;
- failure-injection logs;
- independent-verification results;
- migration diff proving stable EFS identity;
- clean-room restore instructions and recording;
- explicit unresolved unknowns.

## Sequencing

1. Run read-only/source and inexpensive testnet work first.
2. Require a production-scoped independent GoE security review before writing valuable repositories through its deployed contracts.
3. Keep mainnet expenditure bounded and separately authorized.
4. Feed generic failures into the owning design pass.
5. Ask the owner about default-carrier/partnership positioning only after evidence exists.
