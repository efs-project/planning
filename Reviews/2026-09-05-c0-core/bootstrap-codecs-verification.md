# C0 bootstrap input codecs: execution and handoff

**Status:** component implemented and independently task-reviewed; final
whole-increment review pending. Not an initialized Core or complete C0 run.

## Implemented boundary

`f29e4ad` adds the six files in the [bootstrap codec plan](bootstrap-codecs-plan.md).
`c2b5f7b` strengthens the independent deployed-reader test, without changing
Solidity or the reference encoder. The component supplies:

- V2 seed framing around the unchanged validated V1 seed; exactly one reserved
  configuration-selection commitment and five fixed suffix words.
- Exact four-component V2 deployment framing and run/profile commitments.
- Canonical selection/null-policy bytes and authenticated digest opening.
- Exact derived InitConfig equality, with no implicit caller authorization.

The public receiver is pure test scaffolding. It has no state initializer,
acceptance flag, caller-authority decision or source-provenance claim. The
actual Core must still authenticate the seed and selection, enforce the
one-time executor, check Codex/groups/actual deployment context, derive genesis,
and initialize/seal atomically.

## Fresh root verification

Root used Solidity0.8.30, Cancun, optimizer200/via-IR, existing Forge/Anvil1.7.1,
Node26 and ethers6.15. The cached compiler's independently checked SHA-256 is
`738dcdc6afddeb505ee4e4ef24f1c1fdba2b8c924e614cbbf5801a5b062dd683`.

```sh
forge build --offline --use "$C0_ROOT_SOLC" --ast --build-info --force
forge test --offline --use "$C0_ROOT_SOLC"
node --test test/*.test.mjs ../2026-09-05-c0-admission/integration.test.mjs \
  ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs
```

Run from this review directory with the local cached compiler path in
`C0_ROOT_SOLC`; it is not a committed machine-specific path. Root separately
ran the unchanged foundation's `node --test test/run-codec.test.mjs` and
`forge test --offline --use "$C0_ROOT_SOLC" --match-contract RunCodecTest`.

| Check | Fresh result |
|---|---|
| Forced Core build | 28 files compiled successfully. |
| Full Core Forge | 131 passed; zero failed/skipped; ten suites. |
| Expanded Node, repeated after the test-only fix | 91 passed; zero failed/cancelled/skipped/todo. |
| Focused fixed deployed-reader test | 13 passed, including exact cross-runtime fields and wide boundaries. |
| Unchanged V1 Node / Forge | 10 / 10 passed; zero failures. |
| Pure receiver runtime / constructor-inclusive initcode | 11,172 / 11,198 bytes. |
| Pure receiver deployment | 2,469,117 gas, normal local transaction ceiling16,777,216. |

Managed local node cleanup succeeded; no public RPC or personal wallet was
used. Existing expected normal-cap failures in the stateful sweep remain
failure classifications, not newly passing large writes. Receiver sizes/gas
do not measure complete Core initialization, Files or a valid G0 deployment.

Root also checked the compiler metadata's imported V1 source against the
actual unchanged sibling: keccak256
`0x4261278435a902ab92bbfa41dacf849a3822f705619dd7a93a1890f137915b08`.
The source-unit import uses the existing C0Admission remapping as an anchor;
no dependency/config/remapping edit or copied V1 parser was introduced.

## Review and retrospective

The task review found one Important test gap: the deployed comparison only
spot-checked some decoded fields. The original implementer fixed that in
`c2b5f7b`; scoped re-review found it addressed with no new breakage and approved
task quality. Every selection field, V1 base field/commitment entry, V2 suffix
and component field is now compared across the deployed receiver. All four
V1 u64 fields plus selected gas exercise their maxima through that receiver.

One Minor remains for final triage: bounded Solidity test-fixture narrowing
casts produce generic lint warnings. Existing mutability/cast/arithmetic
warnings also remain; the new source libraries/harness emitted no source
warning. Do not describe the output as warning-free.

What could have gone better:

- The physical-relative import and a shortened guess both failed under
  Foundry source-unit resolution. Verify actual compiler metadata before
  documenting a path as resolved. Those failures are setup evidence, not RED.
- The original compiling stub produced real behavioral RED; full-field
  cross-runtime assertions should have been present in the first GREEN run.
- Two fixture mistakes—changing an already-equal byte and decoding a return
  value from a void function—were corrected without relaxing production checks.
- The original implementation commit used a generic GPT-5 co-author label;
  the fix/report record the dispatch-confirmed GPT-5.6 Sol provenance without
  rewriting the reviewed commit.

## Designs refined in parallel

The [read overlay](read-overlay.md) now specifies original Type-group recovery,
shared query classification, unsupported counts, bounded history/cursors and
actual page ABI sizes. Read-only source review corrected one error-precedence
ambiguity; SDK PM review preserved the five seams and added pinned composite
Type evidence, separate temporal coordinates and precopy/gas limits. A
65,856-byte hydrated response needs a byte allowance wider than uint16.

The [Codex materialization decision](codex-materialization.md) selects two
independent full offchain encoders/readers plus compiled exact length/hash
acceptance, rather than a general onchain interpreter for one immutable run.
The explicit inventory does not advertise dormant B0 verifier paths or
unsupported machinery, and omits inapplicable proxy/storage slots. The complete
artifact and session/index/error rows still need materialization/implementation.

## Next step and owner followups

Implement the small shared Type/Record/Envelope read layer from the exact
overlay, compare it against all sixteen admitted Types and independently
decoded state, then proceed through bounded pages and the real owner join.
The cheap checked cache-header projection avoids copying a large cache just
to read two counts. Its original-byte projection still needs executed tests.

No immediate owner answer is needed. Complete Codex/session/authentication,
initialization, G0–G12, three Files mutations, Lens, typed SDK/static-SPA join
and nine acceptance journeys remain outstanding. Actual-wallet participation
and product/main/public/permanent authority are later explicit requests, not
permissions inferred from these passes. The native integrated goal stays active.
