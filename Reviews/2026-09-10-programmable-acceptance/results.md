# Acceptance laboratory — evidence ledger

**Status:** local execution verified; final review/publication disposition is recorded below. Standalone evidence only.

## Verified starting point

| Input | Exact revision / observation |
| --- | --- |
| Design | `cf352ed6bd5e2396550cbba068f56c1986d069c6`, read separately |
| Runtime and owned branch base | `92f2d6bd7d021f2dc5488482fe29f68bbef41d38` |
| New branch | `codex/programmable-acceptance` |
| Environment at baseline | macOS, Node v24.11.0, Forge 1.7.1 (`4072e48705af9d93e3c0f6e29e93b5e9a40caed8`), Solidity 0.8.30 |
| Dependency setup | Pinned lockfile `npm ci --ignore-scripts --no-audit --no-fund` in this checkout's rehearsal and upgrade-foundation labs; no use of Fable's writable dependency directories |
| Control run | `node --test --test-concurrency=1 Reviews/2026-09-09-files-browser-mvp/test/authority.test.mjs Reviews/2026-09-09-files-browser-mvp/test/router.test.mjs` |
| Control outcome | 2 tests passed, 0 failed; 39.30s including fresh compilation |

Baseline admission gas: authority directory **5,127,276**, three-chunk file
**8,615,221**. Routed control: create directory 5,154,271; create file
8,731,689; edit 4,215,287; rename 5,394,910; move directory 5,418,825; copy
7,630,497; placement 3,127,796; remove 5,084,476; restore 4,347,916; tag
3,079,254. These are prior full-C0 fixture operation measurements, not full
upload lifecycle costs or comparable costs for the smaller acceptance arm.

Generated control compiler artifacts were restored to the pin after the run;
only newly generated untracked compiler outputs were removed. No runtime source
was edited and Fable's checkout/environment was untouched.

The parent repeated the pinned control during final integration work: **2 passed,
0 failed**, 22.14s. Directory and three-chunk-file authority costs were identical;
small routed signature/calldata variations were at most a few dozen gas.
Regenerated control artifacts were again restored/removed only in this owned
checkout; the control source remains exactly at the pin.

## Architectural counterexamples found before implementation

1. **First activation squatting:** a public Type-to-first-executor slot lets an
   attacker preempt an honest deployment, even where both runtimes are identical.
   The local constructor state may bind another administrator or coordinator.
   Response: content-addressed explicit activations, pinned by the plan and
   consumer, with no first-writer-selected default.

The resulting explicit-activation checks are exercised in the executable suite;
the design observation alone was not counted as a test.

## Parent contract check before independent code review

Command: `forge test --root Reviews/2026-09-10-programmable-acceptance/contracts --offline -vv`.

Observed **33 tests passed, 0 failed, 0 skipped** across four suites; cached
compilation, 5.29 ms runner-reported wall time. This is a local Forge check of the
standalone boundary, not a deployment or a full-C0 integration test. The gas
test reports instrumented call costs: Outfit 451,428; Equip 395,583; paid claim
479,800; exact retry 27,518; warm receipt/body read 5,938. Whole transaction
costs, deployment/setup costs and independent consumer measurements are separate.

Passing groups cover intrinsic/relayed authorization and bound fields, exact
retries and retained submitter, canonical flat words, no-rule separation,
Outfit/Equip history and current-policy refusal, paid uniqueness and rollback,
controller/destination acceptance, explicit activations and hostile hook/value/
reentrancy cases. Independent review and the generated integration gate remain
required before the final verdict.

## Independent contract review

Commit `496eb1ddc1e5c1a90b44a14bf55e0368f1b1f0cb` received spec PASS and quality
PASS with minor findings from a separate contract reviewer. No Critical or
Important boundary defect was found in the scoped diff. This is not a formal
audit or verification of arbitrary external code.

Two minor follow-ups remain visible for the final review/implementation port:

- Strengthen signature-substitution tests so nonce/Type/activation/value and
  cross-Core alternatives are otherwise valid. They currently exercise safe
  rejection, but some would still fail a later validity gate if the relevant
  signed field were accidentally removed.
- A malformed binding return with noncanonical address upper bits safely
  reverts during ABI decoding instead of the ordinary `Refused()` error.
  Normalize that diagnostic or document the distinction in the real boundary.

The report candidly records that initial Core/rule/binding/diagnostic/submitter
behaviors had observed RED/GREEN runs, while some later hardening and the V2
prefix extension were regression-tested after implementation. The 33 passing
tests are not misrepresented as 33 separate test-first cycles.

## Acceptance and refusal matrix

| Case | Observed behavior / qualification |
| --- | --- |
| Compatible Outfit; valid new Equip | Accepted through the same ordered writer; staged earlier Outfit is visible to Equip. |
| Incompatible species/shirt or shirt/pants | Rule refuses; no accepted receipt. |
| New Equip after `setAllowed(false)` | Refused; historical Outfit/Equip remains readable; explicit grandfather policy remains separate. |
| Raw link to old Outfit presented as new Equip | Refused by the independent consumer; raw storage is not accepted action evidence. |
| First paid unique claim | Fee transferred, uniqueness consumed, counter incremented and receipt written atomically. |
| Same-batch / sequential competing duplicate | Cannot both succeed. This tests EVM-serialized competing transactions, not a distributed consensus simulation. |
| Paid claim followed by a failing item | Mined transaction status 0; no final Core/rule storage changes, no treasury increase or consumed right. Sender still pays EVM gas. |
| Exact retry | Original receipt retained, no new acceptance or dependent payment/counter change. |
| Fresh value on retry, over/under-funded new plan | Refused. No refund callback; exact funding is required. Forced ETH is not admission credit. |
| Direct, relayed, controller, destination/import or reuse | Same accepting entrypoint and exact author/plan requirements; source evidence does not grant destination acceptance. No separate privileged import bypass exists. |
| Spoofed hook caller / author / changed signed intent | Refused in the fixture. Signature test-isolation limitations are disclosed above. |
| False/revert/no-code/malformed/oversized/gas-exhausting hook | Safely refuses; fixed-size bounded return handling. Noncanonical binding diagnostic caveat disclosed above. |
| Static rule writes; reentry to mutators | Refused. Hooks can read prior staged state through public getters. |
| Add new Type/rule after deployment | Works without a Core upgrade; does not change earlier exact identity or activation. |
| OutfitV2 with added badge | Valid under the preserved prefix rule; older exact-Type editor/consumer refuses V2 as V1. |
| Missing/malformed/contradictory read evidence | Must remain UNKNOWN; SDK review uncovered and required stronger regressions before publication. |

### Mutation and privilege inventory

| Entry | Authority and acceptance effect |
| --- | --- |
| Core `execute` | Intrinsic author or exact EIP-712 author signature, plus any named executor restriction; only entry writing accepted receipts. |
| Core `registerType` | Permissionless, guarded, content-addressed registration; cannot grant an accepted occurrence. |
| Core `activate` | Permissionless, guarded, exact code/configuration checks; no global first-registrant default and no accepted occurrence. |
| Core `retainRaw` | Guarded, sender-attributed raw evidence in a separate domain/map; cannot grant acceptance. |
| Rule `accept` | Only its bound Core; static for Outfit/Equip, stateful for PaidClaim. No developer delegatecall. |
| Equip `setAllowed` | Only the explicitly selected policy administrator; updates future eligibility/version, not old receipts. |
| Rule constructors | Select Core, administrator/treasury and semantic inputs; those choices are explicit activation/Type trust inputs. |
| Upgrade, migration, operator bypass, acceptance import setter | Absent in this immutable lab, not proven safe in the existing upgradeable Core. Must be inventoried again during integration. |

`hashPlan`, receipt/Type/activation/body getters and policy getters are read-only.
Stateful hooks may call external application code; Core's shared lock blocks all
four Core mutators during execution, not arbitrary state changes elsewhere in
the EVM. If a rule depends on mutable external state, that is part of its
application policy and must be deliberately declared/tested. A successful hook
does not prove arbitrary environmental assumptions.

## Actual whole transactions and state cost

The committed [run capture](sdk/observed-run.json) includes transaction hashes,
block basis and address-qualified `prestateTracer` final storage diffs from a
fresh local Anvil chain. It initially used Node v26.0.0; the parent independently
ran the same suite under Node v24.11.0. Timings and signed-calldata gas vary.

| Representative whole transaction | Gas, final saved run |
| --- | ---: |
| Deploy standalone Core | 1,760,198 |
| Deploy Outfit / Equip / PaidClaim rule | 267,040 / 605,097 / 376,405 |
| Register Outfit; activate Outfit | 184,290; 129,234 |
| Publish Outfit + Equip, signed relay | 808,940 |
| Exact zero-value retry | 50,200 |
| Paid claim, direct | 457,921 |
| Paid exact retry | 43,648 |
| Mined paid-then-invalid-Outfit failure | 478,454 |
| Publish additive OutfitV2 | 462,965 |

These small flat-body costs are **not a v1/v2 efficiency comparison**, a mainnet
fee quote, or complete Files publication costs. Setup is separate from writes.
The final two-receipt read-back used **25 RPC requests and 204.38 ms** on localhost;
the parent's independent runs observed **210.53 ms** and **220.38 ms**, also 25 requests.
Original-execution provenance adds three requests over the initial 22-request
164.37 ms capture. These final measurements supersede that initial read cost.
No internet-latency, wallet-interaction, cold browser or production-RPC SLA is
inferred from it.

| Transaction | Changed final storage slots | New nonzero slots |
| --- | ---: | ---: |
| Register Outfit | 7 | 7 |
| Activate Outfit | 4 | 4 |
| Outfit + Equip | 30 | 30 |
| Paid claim | 17 | 16 |
| OutfitV2 write | 18 | 17 |
| Either exact retry | 0 | 0 |
| Mined failed paid + Outfit | 0 | 0 |

Counts cover final differences across participating contracts. They exclude
trie overhead and temporary writes restored within the transaction (such as the
guard); they do not mean retries perform no SSTORE instruction. Reverted
transactions still consume gas even when final storage is unchanged.

Core runtime: 7,893 bytes. Outfit rule: 875; Equip rule: 2,021; PaidClaim rule:
1,170. These are fixture build observations, not forecasts for the full Core.
The final Core run repeated all 33 tests successfully and reproduced those sizes.
Forge's timestamp lint warning is intentional: signed expiry uses the chain's
block timestamp, not an independently precise wall clock or randomness source.

## Independent Solidity consumer

Parent freshly ran `forge test --root
Reviews/2026-09-10-programmable-acceptance/consumer --offline -vv`: **16 passed,
0 failed, 0 skipped** at initial consumer commit `bfe7f0e`. Separate read-only
review returned spec PASS and quality Approved with no Critical/Important.
The reviewer checked public dependencies to confirm reads do not re-enter hooks.
The generated-API adaptation was reviewed separately as described below.

The consumer pins exact Core/chain/author/Type/rule/activation, verifies receipt
identity and body commitment, then uses generated decoding. Hand-derived field
expectations supplement encoder/decoder agreement. Its explicit policy getter
first proves historical Equip; no generic “safe to use now” flag is invented.

Initial Forge measurements: 3,742-byte runtime, 6,479-byte initcode excluding
constructor arguments, 1,003,699 deployment gas; cold complete Outfit read
46,262 gas, repeated warm 11,675. Raw receipt+body read was 38,507 cold / 6,384
warm. These are instrumented nested-call measurements, not complete transaction
or RPC `eth_estimateGas` costs. An explicitly calculated external-transaction
upper estimate was 67,826, including intrinsic and exact calldata byte costs.

The generated-rule compatibility change explicitly supplies the parameter
preimage to Type identity/registration helpers and preserves every consumer read
predicate. The two minor coverage follow-ups (wrong chain with correct Core;
invalid Type-pin constructor) were added in `b90a55d`. Scoped independent review
approved that adaptation with no remaining findings. Parent's fresh final run
passed **18/18**, zero failures. Runtime stayed **3,742 bytes**; initcode grew to
**7,139 bytes** and reported deployment gas to **1,017,030**. The increase is
constructor/setup verification, not a new ordinary-read hook.

## Review improved the experiment

The SDK's first passing tests missed four real defects found by the independent
reviewer: a forged structural-only registration could bypass the generated
mandatory-rule guard; permissive ABI decoding could accept malformed RPC return
envelopes; available Type-rule/execution-block contradictions were ignored; and
some reserved names generated uncompilable TS/Solidity. These are Important
findings, not waived because the original tests passed. Commit `0403388` adds
declaration-required rule checks to TS and Solidity, complete canonical-return
checks with raw malformed evidence, original execution provenance, and both
languages' identifier validation. Scoped re-review confirmed those four original
defects addressed but found a new generator parameter-shadowing case. The second
bounded fix (`9d2b144`) adds config-scope collision guards and real parameterized
compilation regressions; scoped independent re-review found it addressed with no
new Critical/Important breakage. Actual code/artifact trust remains explicit
setup policy, not a conclusion inferred from a caller-supplied hash.

Dependency verification also reproduced a vulnerable transitive `ws` release
in the initial ethers lock. Only this new lab moved to ethers 6.17.0 / ws 8.21.0;
its fresh npm audit reported zero known vulnerabilities. This is an audit result,
not a security guarantee; pinned runtime controls and Fable were not changed.

## Final parent verification

At final code checkpoint `9d2b144` (Core `496eb1d`, SDK review fixes `0403388` and
`9d2b144`, consumer adaptation `b90a55d`), the parent ran and read the complete
output of the following checks. Core and consumer runs preceded the final
identifier-only change, which changed no generated artifacts or contract ABI:

- `npm run verify && npm audit`: deterministic generation and TypeScript pass;
  **20/20 Node/Chromium/generator-compilation tests**, **13/13 actual Anvil tests**
  (one full transaction journey plus 12 named adversarial subtests); zero known
  dependency vulnerabilities.
- `forge test --root .../contracts --offline -vv` and `forge build --root
  .../contracts --offline --sizes`: **33/33** and sizes above.
- Equivalent consumer commands: **18/18** and final consumer sizes above.
- Pinned Files authority/router control: **2/2**, described above.

Expected refused writes and mined status-0 rollback are positive test outcomes,
not accepted data. Passing test counts do not waive later review findings. The
evidence retains a trusted-local-RPC/no-state-proof and local-unfinalized boundary.

## Readiness decision

**Engineering recommendation: implement this boundary in the real testnet Core
as a small reviewed vertical slice, subject to the final review disposition.
Do not deploy this standalone coordinator as EFS v2.**

The central architectural risk is tractable: custom validation can be mandatory,
stateful effects can roll back atomically, and generated/offchain/onchain readers
can consume retained acceptance without re-running arbitrary code. This gives
enough concrete evidence to stop open-ended acceptance brainstorming and begin
the integration described in [integration.md](integration.md).

Still unproved here: every actual C0/Files/upgrade/bootstrap mutation path,
Binding/index rollback, managed identity and smart wallets, real popup/funding
UX, export/recovery, finality or malicious-RPC state proofs, arbitrary proxy or
cross-chain program equivalence, and the permanent byte/ID/resource policy.
Those are named integration/product gates, not a claim that the experiment
solves all future EFS requirements. Whole-MVP readiness remains separate.
