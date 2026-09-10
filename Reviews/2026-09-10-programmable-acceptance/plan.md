# Programmable acceptance laboratory — implementation plan

> For agentic workers: use `superpowers:subagent-driven-development` to execute and review these bounded tasks. This is disposable evidence, not a protocol selection.

**Execution record (2026-09-10):** this plan has been executed and independently
reviewed. The original task checklist below is retained as the requirements
record, not an open work queue. See [results](results.md) for completed checks,
review disposition and the distinct real-Core integration follow-up; do not
restart this implementation from the unchecked historical boxes.

**Goal:** mandatory developer rules, atomic stateful acceptance, generated developer helpers and a separately authored contract consumer.

**Architecture:** an isolated small acceptance coordinator exercises the proposed boundary without modifying the pinned Files Core. Immutable Type descriptors commit a mandatory rule; each local activation commits the actual executor and configuration. Ordered plans enter one guarded writer. Receipts and exact bodies are state-readable without callbacks. Two ordinary applications supply the custom logic.

**Tech stack:** Solidity 0.8.30/Cancun, Foundry, Node, the existing pinned ethers/TypeScript dependencies, and static HTML for inspection. No service backend, public deployment or extra language implementation.

**Spec:** James's authorized prompt is retained as `mission.md`. Design input is `cf352ed6bd5e2396550cbba068f56c1986d069c6`, especially `Designs/efsv2/programmable-type-acceptance.md`; runtime control is `92f2d6bd7d021f2dc5488482fe29f68bbef41d38`. Read design through `git show` at that pin; do not merge its unrelated history.

## Global Constraints

- Disposable local experiment only. No permanent protocol choices, production repositories, public deployment, real funds, or merging main.
- All new implementation lives under `Reviews/2026-09-10-programmable-acceptance/`. Do not modify Fable's worktree, browser/export/wallet source or running environment.
- No generic activation registry or cross-chain code-equivalence framework. Retain exact local code/configuration and distinguish rule identity from trusted activation.
- No developer delegatecall. Every accepting mutation shares one reentrancy-guarded boundary. Read-only validation uses bounded STATICCALL; stateful validation uses bounded ordinary CALL.
- Authenticated author/context, authenticated executor caller, exact intent, atomic rollback, explicit item ordering, and no double charge on retry are required.
- Ordinary reads do not rerun hooks. A raw relation cannot impersonate an accepted action. Adding an application Type/rule must not require upgrading the coordinator.
- Avoid arbitrary first-claim Principal ownership. Use intrinsic account authority for this arm, without claiming managed identity, smart-wallet or cross-chain identity completeness.
- Generated helpers compose the existing five SDK seams; do not build another whole SDK. Handwritten application code should use named fields, not manual byte/ID ceremony.
- Actual runtime tests, retained failure cases and independent review are the evidence. Mark standalone results as standalone, not full C0/Files integration or whole-MVP completion.

## Engineering choices for this round

- A finite flat ABI-word schema is sufficient: uint256, address, bytes32 and bool, with a small experimental field/batch cap. Exact length and canonical address/bool words are structural obligations. This is not the final Type codec.
- The descriptor, ordered field-kind vector and mandatory rule commitment all affect exact Type identity. Human version labels do not confer compatibility.
- Rule definition must bind actual executable code and semantic configuration. Merely asking arbitrary code to return a claimed RuleId is insufficient. Prefer constructor-independent runtime code plus explicit local deployment bindings; do not claim that a matching hash proves arbitrary state equivalence.
- No-rule Types explicitly use the no-rule commitment. They cannot manufacture a receipt for a ruled Type.
- The coordinator has no privileged acceptance bypass. Type registration/activation, any application policy administrator and any unavailable migration/upgrade path must be inventoried separately.
- Plan identity binds author, exact ordered items including local activation, per-item value, nonce, expiry, chain/coordinator and any selected executor constraints. A direct transaction can use intrinsic sender authority; relayed/controller/import/reuse routes must preserve exact signed authority. Use an EIP-712 plan domain to align with the existing SDK seam.
- Local activations are content-addressed and explicit in plans/consumer policy. Permissionless registration must not give the first registrant control over which local executor may realize a portable Type. A different constructor Core/admin/state binding must not inherit trust merely because runtime code is identical.
- Exact repeated plans return the earlier retained outcome only with zero fresh value. Reject over/under funding before hooks. No push-refund machinery is needed when exact-value funding is required; forced ETH is not an admission credit and must be reported separately.
- Receipts bind author, Type, body, rule, activation, application basis, plan/order and block/chain/coordinator context. New use requires a new accepted action, even when the body or old item is reused.

### Task 1: Guarded coordinator and two custom application cases

**Owner:** one contract implementer. Own only `contracts/` plus `contract-interface.md` in the lab. Other workers must not edit these paths until handoff.

- [ ] Write focused failing behavioral tests, then implement a small generic coordinator and contract-facing interface. Use `contracts/foundry.toml`, `contracts/src/AcceptanceCore.sol`, `contracts/src/AcceptanceTypes.sol`, `contracts/src/OutfitRules.sol`, `contracts/src/PaidClaimRule.sol`, and focused files under `contracts/test/`. Small justified test-helper files are allowed.
- [ ] Fix the public ABI in `contract-interface.md` early and notify the parent so generated tooling can consume it. Define descriptor/shape/Rule/activation IDs, signed plan hashing, read structs and hook result precisely. Do not silently leave an invented authority gap in an ambiguous signature.
- [ ] All aliases claiming accepted data (direct, batch, relayed, imported, reuse and controller) must use the same internal gate. If unnecessary aliases are omitted, demonstrate those workflows through the single entry rather than invent forwarding names that add no meaning. Provide an explicit raw/unaccepted relation fixture and show it is not an equip.
- [ ] Reject forged author, signature/chain/Core/intent substitution, direct executor spoofing, stale/expired plans, reentrancy into all relevant mutations, false/revert/no-code/malformed/oversized return, static-state mutation and hook gas exhaustion. Compare code/config bindings on registration/execution as appropriate.
- [ ] Precheck complete plan structure and funding; execute in signed order. Hook N sees successfully staged state/effects from earlier items. Late failure must revert receipts, nonces, uniqueness, dependent state and value transfers. Tests must inspect these effects, not only a revert flag.
- [ ] Exact retry returns the original outcome without another charge; fresh value on retry rejects. New nonce/action cannot borrow eligibility/payment from an old receipt. Same-batch duplicate and serial competing claims cannot both succeed. Reject mismatched funds; no silent trapping/refunds.
- [ ] Outfit creation checks compatible pieces. New Equip references an accepted exact Outfit and checks current eligibility. Rule-policy update preserves historical readability. Grandfathering is an explicit tested application policy. No game-specific Core primitive.
- [ ] Paid unique claim enforces one use plus fee/dependent counter state, authenticates the coordinator itself, and exposes complete rollback/retry tests.
- [ ] Register another Type and rule after deployment without upgrading Core; prove exact Type and local activation cannot be silently replaced. Demonstrate separate deployments can share a portable rule commitment while activation differs only where the actual commitments justify it.
- [ ] Measure representative gas and runtime size with Foundry; preserve test output and TDD evidence in the task report. Keep compiler warnings intentional and explained or fix them.

Verification: `forge test --root Reviews/2026-09-10-programmable-acceptance/contracts --offline -vv`; `forge build --root ... --sizes`. Commit only owned paths, with required v2-pm/Codex/model trailers; do not push. Parent supplies independent review.

### Task 2: Generated helpers, five-seam adapter and generic inspection

**Owner:** one SDK implementer after the contract ABI handoff. Own lab `declarations/`, `generator/`, `generated/`, `sdk/`, `web/`, `test/`, `scripts/` and package/config files, excluding any parent-owned integration file explicitly announced.

- [ ] Read `contract-interface.md` and `Designs/sdkv2/mvp-interface.md`; read only the contract APIs needed. Implement the smallest generator that reads one declaration per Type and emits consistent TS helpers and Solidity libraries, plus a generic inspector description. No hardcoded Outfit-specific decoder.
- [ ] Generated declaration should describe exact named fields, shape, version label, rule/artifact/config commitment inputs. The generator must fail on invalid/duplicate/ambiguous schema inputs; exact body encoding and IDs agree with Core. Solidity generated output goes under lab `generated/`, not Task 1's source tree.
- [ ] Use named-field object → generated encode/decode/registration helpers. Demonstrate Outfit, Equip, paid claim, and an additive revision. An old editor must explicitly refuse unknown exact Type before creating a write, or preserve all unknown bytes. Refusal is the smallest acceptable first result; old-reader projection must be explicitly structural only.
- [ ] Add a thin adapter within the five existing seams: exact read, scoped page support declaration, verified exact body read, plan/authorize/submit, canonical read-back. Do not imply unsupported pages or broad byte carriers are implemented. Keep raw plan, receipts and source basis; transaction success alone leaves effect unknown.
- [ ] Exercise real local contracts with generated helpers and one signed relayed plan, direct plan, malformed input, failed rule, exact retry, and read-back. Use separate Anvil instance and dynamically allocated localhost port; kill only the child process the test owns. Use pinned installed dependencies in the owned worktree, not Fable's.
- [ ] Static inspection view must render Type name/fields/rule and retained receipt basis from a generic descriptor/evidence bundle. Safely render data as text; no app-specific decoder or backend. Tests must exercise output, including hostile labels and unknown Type/edit refusal.
- [ ] Include a concise developer example that ordinary app code can follow without manual ABI/ID hashing. Capture tests, test-first evidence and remaining usability friction in the task report. Compile generated TS and Solidity, and test regeneration determinism.

Verification: Node tests under lab `test/`, TypeScript typecheck, deterministic regeneration check, Forge compile of generated helper imports, local Anvil integration. Commit only owned paths with required trailers; do not push. Parent supplies independent usability review.

### Task 3: Independent consumer, final attack and handoff

**Owner:** independent consumer/reviewer plus parent integration. Consumer owns lab `consumer/` only. Parent owns `README.md`, `mission.md`, `results.md`, `integration.md`, `design-followthrough.md` and final evidence/reporting.

- [ ] Independently write a Solidity consumer from the public interface and generated helper, pinning required Type/rule/activation and author where relevant. Ordinary reads inspect retained acceptance; refuse raw links, wrong author/Type/activation and new-use impersonation. Do not import application validation implementation or rerun its hooks.
- [ ] Test the independent consumer against the deployed coordinator and fixtures; measure complete representative write and read costs, state footprint and deploy/runtime sizes. Label constituent registration/deployment costs separately from per-write costs and narrow hook measurements.
- [ ] Independently review authorization/rollback and generator/usability diffs; fix important findings and rerun affected tests. Final whole-branch review covers interfaces and claims; do not claim full integration where only the separate coordinator is exercised.
- [ ] Record what is proved, proposed, unsupported, and what could use fewer concepts. Compare mandatory Type-rule with mandatory Type/profile pair in prose using observed tooling cost; no second framework.
- [ ] Write reproducible setup/test/walkthrough, acceptance/failure matrix, exact source pins, measured environment, migration/integration instructions for Fable, and remaining owner decisions with recommendations. Update only directly relevant design evidence, preserving original historical claims and no promotion.
- [ ] Run full lab verification, pinned control regression, whitespace/vault checks; append one dated agent-status line. Commit and push this branch only. Report a candid scoped build/no-build recommendation for the real testnet boundary; whole MVP remains separate.
