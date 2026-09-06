# Bounded C0 request checkpoint

**Status:** implementation, independent task review and final whole-increment
review pass. This is publication preparation, not authenticated Core or MVP
acceptance.

## What now executes

Implementation `0696b215db514937c72162cc076d3f565b47a968` adds exactly the
[internal request component](src/C0Request.sol),
[full-layout test receiver](test/C0RequestHarness.sol),
[Solidity adversarial tests](test/C0Request.t.sol) and
[independent deployed JS comparison](test/c0-request.test.mjs).
No existing kernel, Type candidate, codec, transport or source pin changed.

The component consumes the selected ten-argument call layout through the test
receiver, checks the [eight ordered guards](outer-request-boundary.md#first-implementation-boundary-publication-preparation-only),
then constructs the existing kernel Publication with derived identities/mask.
It has no storage mutation or authentication surface. Principal, witness,
effects and plan are deliberately not consumed by this stage; an accepted
bounded input is not an authorized request or a valid Files operation.

Real receiver tests now cover exact/over-limit call and payload lengths,
logical wire overhead despite legal aggregate body size, full count/index/CAS
bounds, bit 63, legal duplicate RecordIds and empty CAS, mismatch precedence,
and body-offset alias amplification. Decoder-accepted gap/alias/suffix variants
preserve semantic results; inaccessible live offsets refuse. The test does not
claim universal eager rejection of unused ABI padding.

The implementer inspected the pinned optimized-IR path: the full body-length
scan, wire guard and CAS scan precede body hashing, followed by bounded memory
materialization. This is a specific generated-path inspection, not a global
compiler or memory-safety proof. The initial compiling stub produced a real
behavioral RED, then eleven focused Solidity tests passed.

## Fresh controller verification

Root independently ran these covering checks on `0696b21` implementation
source, using the existing Solidity 0.8.30 compiler, Cancun, optimizer 200,
via-IR and normal managed-Anvil transaction limits:

```sh
forge build --offline --use "$C0_ROOT_SOLC" --ast --build-info --force
forge test --offline --use "$C0_ROOT_SOLC"
node --test test/*.test.mjs ../2026-09-05-c0-admission/integration.test.mjs \
  ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs
```

Run from this review directory; `C0_ROOT_SOLC` is the local pinned compiler
path, not a committed machine default.

- Fresh build: 23 Solidity files, successful.
- Core: 118 passed, zero failed/skipped, nine suites. Eleven tests are the
  new request matrix; existing suites keep their historical scope.
- Expanded Node set: 78 passed, zero failed/cancelled/skipped/todo, including
  actual managed receiver deployments and independent identity comparisons.
- Receiver runtime: 3,937 bytes; constructor-inclusive initcode: 4,096 bytes.
  Deployment gas: 905,621 at F=0; 905,633 at F=32/F=8,192.
- Existing linked stateful slice remains Core 6,186 / library 24,179 / helper
  18,805 runtime bytes. These are separate components/host, not the size of
  a complete initialized authenticated Core.

Managed transactions remain capped at 16,777,216 gas. Forge test-function gas
may combine setup and multiple calls; it is not a claim one product transaction
fits. F=0/32/8,192 and dummy body/CAS matrices are component fixtures, not a
selected run file cap or legal Files admission evidence. The older admission
probe's expired-retry test still describes that older probe, not C0's selected
current-authorization/deadline law.

Warnings are explicitly accepted at this checkpoint: the plan-prescribed
`view` could be `pure`, ceil32 triggers divide-before-multiply lint, and the
new bounded test casts trigger generic cast lint. The reviewer checked these
as safe here; root did not suppress them or change prescribed arithmetic merely
to quiet output. Unrelated historical cast warnings remain outside this task.
No claim that the output is warning-free is made.

## Review, retrospective and next step

The independent task gate approved both specification compliance and code
quality, with no Critical/Important findings. Its one Minor is the warning
noise above. The independent final gate reviewed `e1b0484..c13a368`, including
the code, this evidence and the real-bootstrap/SDK design handoff, and approved
with no new actionable findings. It used root's supplied execution evidence
rather than duplicating suites. The gate closes without a fix wave; it is
feature-branch handoff approval, not MVP, main/public/permanent approval.

What could have gone better: the test fixture initially used shortened ignored
Principal/witness inputs, so its call length was 1,668 rather than the intended
1,700. Correcting the fixture to the actual 20-byte account/65-byte witness
made the arithmetic meaningful. Test real transport shapes even when a stage
does not yet authenticate their contents.

The SDK PM also identified a useful naming trap: `C0Request.Prepared` must stay
bounded-input evidence inside PlannedWrite, not become SDK PreparedWrite/READY.
The [SDK snapshot contract](outer-request-boundary.md#sdk-stage-and-snapshot-contract)
now fixes original-array validation before copying, one private immutable
snapshot for hashing/ABI, three distinct budgets, and raw transport retention.
Those adapter tests remain future work; no sixth seam or extra signature is
needed.

Next is the actual owner/initialization/authentication join, followed by the
required capabilities, Files/Lens operations and SDK/static SPA. Complete
G0–G12, real 4/7/3-leaf Files costs, session evidence, real-wallet UX and all
nine joined journeys remain outstanding. No immediate owner answer is needed
for reversible work, and the native integrated MVP goal remains ACTIVE.
