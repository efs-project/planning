# Controller interface — opt-in pinned run controller for `script/measure.mjs`

**Status: implemented source-only on 2026-09-13; unit-tested and syntax-checked, gated Anvil run not yet executed.** `script/controller-gate.mjs` is the disposable adapter and `script/controller-gate.test.mjs` its boundary suite. Root owns the controller module and independently derived vectors; this lab owns only the runner integration, tests and this document. Candidate-authored; nothing here seals or repairs any completed run. The older worked example in `vectors/controller-interface.example.json` predates the binding amendments below and is illustrative rather than an executable pin.

## 1. Operator pins and CLI

| flag | value | source | rule |
|---|---|---|---|
| `--controller <path>:<sha256>` | ESM module file | operator-pinned | runner reads the bytes, `sha256(bytes)` must equal the pin, else `CONTROLLER_PIN_MISMATCH` before any chain call |
| `--expectations <path>:<sha256>` | Root's neutral-expectation file (labels only) | operator-pinned | same sha256 check; the runner reads bytes only to hash them and never parses them |
| `--arm-input <path>:<sha256>` | Root's B arm-input manifest | operator-pinned | same; read only as opaque bytes for the pin and never parsed by the runner |
| `--run-id <id>` (optional) | string | operator-pinned | default `runId = "b-" + sha256(canonical({controllerSha256, expectationsSha256, armInputSha256, startedAtUtc}))[0:16]` |

All three flags are required together; any one alone ⇒ `CONTROLLER_PINS_INCOMPLETE`, exit 2, before Anvil starts. Without the flags the run is **ungated**: `report.gating = "diagnostic"`, and `report.controller = null`. With them: `report.gating = "controller-gated"`. The two sealing cells (`joined/paid-slice`, `joined/a1-without-placement`) keep their existing `--anvil`-only rule; independently, `beforeFixture` gates whichever selected cell is first. The concrete `PaidResult` log and the cells themselves are unchanged.

## 2. Module loading contract

`await import(pathToFileURL(absPath))` after the sha256 check. `mod.default` must be an object with two `async` functions `beforeFixture(context)` and `afterB1(context)`; anything else ⇒ `CONTROLLER_MALFORMED_MODULE`. Each hook **returns** its ack object (the runner never reads an ack from disk); the runner awaits it under a bounded timeout of **120 000 ms** per hook (`Promise.race`), far inside the 25-minute watchdog. The hook receives the context object by value (a deep copy; mutations are ignored) plus nothing else — no RPC handle, no wallet, no packet. The controller may itself call the RPC URL given in `context.chain.rpc` read-only; it must not send transactions.

## 3. Hashing rules

Canonical JSON = keys sorted recursively (byte order), no whitespace, UTF-8, `null` kept, every hex string lowercase (`0x…` addresses/hashes/bytes), every EVM quantity (ordinals, block numbers, timestamps, mantissas, scale, proof kinds, budgets, gas) a **decimal string** without leading zeros; JSON numbers only for `chainId`, derivation indices, deployment nonces, `runtimeBytes`, receipt `status` and array lengths; booleans as JSON booleans. `sha256` = hex digest of the canonical UTF-8 bytes. `contextSha256` = sha256(canonical(context as sent)); `inputsSha256` = sha256(canonical(ack.inputs)); `ackSha256` = sha256(canonical(ack as received)).

## 4. When the hooks run

- `beforeFixture`: after `deployAll` + registry setup + `sealedInitialState` and BEFORE the first **selected** cell — `failure-rows` precedes the paid rows in plan order, so the hook gates whichever cell is first (`context.firstCell`).
- `afterB1`: inside `joined/paid-slice`, immediately after `sealState` and only the basis reads (`counts`, `generation`, `epoch`, `coreCodeCommitment`, `realmId` at the sealed block). It runs BEFORE every candidate `seal-placement` / `seal-no-b-placement` diagnostic and every paid row. The controller performs its own independent raw reads from `chain.rpc`; candidate-derived placement/no-B observations are not sent in the context. `joined/a1-without-placement` has no `afterB1` (no B1).

## 5. `beforeFixture` context (runner → controller)

| field | type | source | comparison rule |
|---|---|---|---|
| `schema` | `"efs-lab-b/controller-context/1"` | runner | must equal (`CONTROLLER_ACK_MALFORMED:schema` on the ack side) |
| `runId`, `stage` (`"beforeFixture"`), `sentAtUtc` | string | runner-observed | echoed in the ack; mismatch ⇒ `CONTROLLER_ACK_MISMATCH:runId` / `:stage` |
| `pins.{controller,expectations,armInput}.{path,sha256}` | string | operator-pinned | ack echoes the three sha256; mismatch ⇒ `CONTROLLER_ACK_MISMATCH:pins.<name>` |
| `chain.{chainId, rpc, source, anvilArgv}` | number, string, string, string[] | runner-observed | `rpc` is required so the controller can perform independent read-only RPC; the remainder is informational |
| `source.{commit, dirtyDiffSha256, sourceHashes}` | full 40-character commit, sha256, {path: sha256} | runner-observed | controller compares against the arm-input file; source hashes include every local script dependency; an empty-diff hash is reported only for a tracked-clean code worktree |
| `build.{solc, viaIR, optimizerRuns, evm, artifacts.<role>.{artifactSha256, initcodeHash, runtimeCodehash, runtimeBytes}}` | mixed | runner-observed (this run's build) | all 17 deployment roles are distinct keys (including `quoteRule` and `pairRule`); initcode hashes the complete compiler creation bytes plus encoded constructor arguments, and runtime hashes actual deployed code |
| `roles.{deployer, AUTHOR_A, paidCaller}.{address, derivationIndex}`, `roles.actorB.{address, deploymentNonce}` | string, number | runner-observed | compared against `ack.inputs.roles` (§7) |
| `deployment.<key>.{address, nonce, runtimeCodehash}` | string, number, string | runner-observed | informational |
| `typesObserved.<T>` (6) | bytes32 | runner-observed (TypeRegistered logs ≡ typeIdOf replies) | compared against `ack.inputs.types` |
| `registry.epochAfterSetup`, `sealedInitialState.{blockNumber, blockHash, snapshot}` | string | runner-observed | informational |
| `plannedCells`, `firstCell` | string[], string | runner-observed | informational |
| `mirror` | same shape as `ack.inputs` | runner's candidate-side mirror | compared field-by-field against `ack.inputs`; NEVER sent to the chain |
| `ackPath` | string | runner | where the runner will persist the ack as received |

## 6. `beforeFixture` ack (controller → runner)

| field | type | source | comparison rule |
|---|---|---|---|
| `schema` | `"efs-lab-b/controller-ack/1"` | controller-supplied | required |
| `runId`, `stage`, `issuedAtUtc` | string | controller-supplied | `runId`/`stage` must equal the context's |
| `decision` | `"ACK"` \| `"REFUSE"` | controller-supplied | anything but `"ACK"` ⇒ no downstream send |
| `reason` | string \| null | controller-supplied | retained verbatim |
| `pins.{controller,expectations,armInput}` | sha256 strings | controller-supplied (echo) | must equal the operator pins |
| `contextSha256` | sha256 | controller-supplied | must equal the runner's sha256 of the context as sent |
| `inputs.types.<QUOTE,BINARY,ITEM,PAIR,QUOTE_J,LABEL>` | bytes32 | controller-supplied | must equal `typesObserved` AND `mirror.types` |
| `inputs.fixture.<ITEM_ETH,ITEM_USDC,PAIR_ETH_USDC,QUOTE_A1,QUOTE_A2,QUOTE_B1>.{typeId, body, id}` | bytes32, bytes, bytes32 | controller-supplied | must equal the mirror (18 fields) |
| `inputs.subject.{FILE_QUOTE, salt, creatorPrincipal}` | bytes32 | controller-supplied | must equal the mirror |
| `inputs.roles` | as §5 | controller-supplied | must equal the observed roles (4 addresses + indices/nonce) |
| `inputs.lenses.{LENS_A_FIRST, LENS_B_FIRST}` | address[2] each, order-sensitive | controller-supplied | must equal the mirror; **consumed** as the paid calls' lens arrays |
| `inputs.expect.{A_FIRST,B_FIRST}` | the 12-field `Expect` (`subject, expectedHead, selectedAuthor, selectedProofKind, pairId, itemA, itemB, mantissa, scale, observedAt, noteCommitment, basisAdmission`) | controller-supplied | every field compared against the mirror (24 fields); **consumed** verbatim as calldata |
| `inputs.placementExpect` | the 6-field `PlacementExpect` (`folder, nameRole, actor, proofKind, publication, budget`) | controller-supplied | 6 fields compared; **consumed** verbatim |
| `inputs.ordinals.{placementAdmission, placementPublication, placementRevision, aHeadAdmission, aHeadRevision, bHeadAdmission, bHeadRevision, postB1Frontier, registryEpoch, indexGeneration}` | decimal strings | controller-supplied | compared against the runner's expected-under-this-runner constants; `placementRevision` is `"1"`; `postB1Frontier` must equal both `expect.*.basisAdmission` |
| `inputsSha256` | sha256 | controller-supplied | must equal the runner's sha256 of canonical(`inputs`); bound into `afterB1` |

## 7. Strict comparison and failure codes

The runner compares every listed field with lowercase-hex / decimal-string equality (arrays element-wise, order-sensitive). Any difference ⇒ `CONTROLLER_INPUT_MISMATCH:<dotted field path>`; a missing, extra or wrongly typed field ⇒ `CONTROLLER_ACK_MALFORMED:<path>`; meta mismatch ⇒ `CONTROLLER_ACK_MISMATCH:<field>`; `decision != "ACK"` ⇒ `CONTROLLER_REFUSED`; no return within 120 s or a rejected promise ⇒ `CONTROLLER_TIMEOUT` / `CONTROLLER_ERROR`. The ack's `inputs` are never merely hash-checked: each field is compared; on success the runner **consumes** `inputs.expect`, `inputs.placementExpect` and `inputs.lenses` for the paid calls and records `armInputs.standing = "controller-supplied (ack-beforeFixture inputsSha256 …)"` in place of the mirror caveat. On any failure: no transaction is sent for the gated cell (and no later cell), the cell is recorded as `CONTROLLER_REFUSED` or `CONTROLLER_TIMEOUT` with the failure code, `report.failure` is set, and the process exits **3**.

## 8. `afterB1` context (runner → controller)

| field | type | source | comparison rule |
|---|---|---|---|
| `schema`, `runId`, `stage` (`"afterB1"`), `sentAtUtc`, `pins`, `ackPath` | as §5 | runner / operator-pinned | as §5 |
| `inputsSha256` | sha256 | runner (from ack-beforeFixture) | binds the stages; the ack must echo it |
| `checkpoint.{blockNumber, blockHash, timestamp, snapshot}` | decimal string, bytes32, decimal string, string | runner-observed (ACTUAL post-B1 seal: `eth_getBlockByNumber`, `evm_snapshot`) | the ack's `sealedCheckpoint` must equal it |
| `checkpoint.frontier.{admissions, records, bindings, publications}` | decimal strings | runner-observed (`Ledger.counts` at the sealed block) | `admissions` must equal `inputs.ordinals.postB1Frontier` |
| `checkpoint.{indexGeneration, registryEpoch, coreCodeCommitment, realmId}` | decimal, decimal, bytes32, bytes32 | runner-observed (raw replies at the sealed block) | `registryEpoch`/`indexGeneration` must equal `inputs.ordinals.*` |
| `setupReceipts.{step1,A1,A2,B1}.{txHash, block, status, gasUsed, publication}` (+ `B1.actions`, `B1.folderBind=false`) | mixed | runner-observed | informational for the controller; `B1.folderBind` is `false` |

`observedOrdinals` and `noBPlacement` are deliberately absent from this context. The external controller owns the independently prepared raw calls that check those facts. Only after its `afterB1` ACK does the candidate runner execute and retain its existing `seal-placement` and `seal-no-b-placement` diagnostics.

## 9. `afterB1` ack (controller → runner)

| field | type | source | comparison rule |
|---|---|---|---|
| `schema`, `runId`, `stage`, `decision`, `reason`, `issuedAtUtc`, `pins`, `contextSha256` | as §6 | controller-supplied | as §6 |
| `inputsSha256` | sha256 | controller-supplied | must equal ack-beforeFixture's |
| `sealedCheckpoint.{blockNumber, blockHash, timestamp, snapshot, frontier.*, indexGeneration, registryEpoch, coreCodeCommitment, realmId}` | as §8 | controller-supplied (the checkpoint it accepted) | every field must equal `context.checkpoint` (`CONTROLLER_ACK_MISMATCH:sealedCheckpoint.<f>`) |

On `ACK` the runner continues with the placement replies and the four paid rows; each paid row still reverts to the sealed snapshot (`paid/ordering`), which is the checkpoint the controller accepted.

## 10. Retention (outside the packet) and packet summary

Under `<scratch>/controller/`, written as SEPARATE files before the next step and never copied into `measure.json`: `pins.json` (the three `path:sha256` plus the module load record and `runId`), `context-beforeFixture.json` and `context-afterB1.json` (as sent), `ack-beforeFixture.json` and `ack-afterB1.json` (as received, verbatim), `comparison-beforeFixture.json` and `comparison-afterB1.json` (every compared field with expected/actual/equal and the failure code, if any). The packet carries only `report.controller = { gating, runId, pins: {sha256 ×3}, stages: { beforeFixture: {contextSha256, ackSha256, decision, comparisonOk, failureCode}, afterB1: {…} } }` and, per paid row, `armInputs.standing` naming `inputsSha256`. Nothing in the packet can define or repair a seal: the expectation and arm-input files are read only as opaque bytes for pin verification and never parsed by the runner, and a controller failure leaves no downstream transaction to interpret.

## 11. Out of scope

No new oracle framework; no candidate verifier (Reconstructor, `verify-fixture-map-b.mjs`) may act as controller; no retrospective sealing of `5960336` or any completed run; no change to the consumer, the `PaidResult` log or the selected cells; ungated runs remain explicitly `diagnostic` and cannot be reported as controller-gated. The implemented adapter is still source-only until Root supplies final clean source/build/input pins and operates the bounded Anvil run.
