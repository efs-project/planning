# C0 commitment and batch-evidence codec checkpoint

**Status:** Both task reviews and the final joined codec gate are closed
through `1ce66df`, with fresh controller checks.
This is disposable bytes/hash evidence, not authenticated C0 or MVP completion.

## What this increment closes

The [two-task plan](authority-codec-plan.md) gives contracts and the later SDK
the same exact C0 WritePlan commitments and packed retained-evidence grammar.
The independent reader must reconstruct Solidity output without importing its
encoder or trusting a producer-supplied validity flag. Existing portable
Record/Envelope/Occurrence identities and archived candidate Type bytes remain
unchanged. Retention correctness does not establish authority or permission.

Task 1 is implemented in `bd32a9f` and test-hardened in `aff4d8c`:

- Pure publication/CAS/effects/domain/WritePlan hashes, with exact source
  strings and full-width integer commitments.
- Packed 220-byte Plan, 241-byte effects and bounded evidence framing:
  564 fixed bytes; composite at most 1,036, direct at most 948.
- Exact descriptor, branch, witness, code-observation and CAS guards before
  variable copying. No generic buffer framework, authorization verdict,
  session branch, evidence ID or additional public mutation interface.

Task 2 is implemented in `5f16e56`: a bounded independent JS cursor decoder
and strict publication/CAS/effects/domain/WritePlan hashing functions. It
decodes literal and actual Solidity output field-for-field, preserving full
integer widths and distinguishing malformed framing from unsupported tags.
Decoded data remains a plain object, not an authentication verdict.

The final fix at `1ce66df` rejects sparse Record/CAS arrays, including inherited
entries, before committing their contents. Missing positions cannot silently
become shorter vectors. Valid dense hashes and the legal empty CAS are unchanged.

The two 57-byte internal-library artifacts are compiler stubs, not proposed
deployed helpers. The 5,227-byte runtime / 5,253-byte initcode harness merely
exposes the pure functions for tests. Its fit cannot establish the future
authenticated Core's fit. Existing AdmissionLibrary remains 24,179 runtime
bytes with only 397 bytes spare.

## Execution and review basis

| Source basis | Executed check | Result |
|---|---|---|
| `bd32a9f` implementation | Focused codec tests | 20 pass |
| Same implementation | Full Core | 106 pass; independently reproduced by root |
| Same implementation | Admission/parser | 28 pass |
| Same implementation | Expanded Core/admission/Type-input Node | 62 pass |
| Same implementation | Fresh AST/build-info and ordinary size build | Pass; existing compiler/lint warnings remain disclosed |
| `aff4d8c` test-only hardening | Focused codec tests, formatting and whitespace | 21 pass; production sources unchanged |
| `5f16e56` independent reader | Expanded Core/admission/Type-input Node | 76 pass, including 14 new codec tests; independently reproduced by root |
| Same source | Full Core and admission/parser | 107 and 28 pass; independently reproduced by root |
| Same source | Actual local codec deployment and full bytes/hash agreement | Gas 1,183,550; runtime 5,227; initcode 5,253; exact code read-back and managed cleanup; independently reproduced by root |
| `1ce66df` final JS-only fix | Focused codec and expanded Node | 15 and 77 pass; root independently reproduced the covering 77 with the same actual deployment costs and cleanup |

The full 106/28/62 suite results are the original implementation's execution
evidence, not a claim they were rerun at the hardened head. The extra codec
test makes the later full Core execution total 107. The worker recorded an
initial explicit failing digest stub and a wider failing codec stub before
their respective green implementations; later fixture-sensitivity checks are
distinct from those implementation RED/GREEN runs.

Independent task review approved the production scope and recomputed all
five literal hash vectors. Two minor test gaps were fixed and scoped-review
approved: a nonzero 65-byte witness now catches content substitution, and a
simultaneously malformed witness plus invalid CAS vector locks error order.
The controller also corrected the report's mixed run bases and per-commit
path accounting with the original author before closing Task 1.

Task 2's explicit throwing decoder first failed its literal direct-frame
assertion and then passed after implementation. Subsequent hash/interface
tests initially failed on a missing export; that import failure is not
presented as a behavioral hashing failure. Its final-source full build needed
one corrected shell-variable invocation before compilation; no source bug or
silent toolchain substitution was involved. Root independently ran a fresh
20-file AST/build-info build before the covering Node deployment tests.

Task 2's independent review approved spec and quality with no blocking issue.
Root directly reproduced the reported executions and deployment observations,
resolving the review's execution-evidence qualification.

Final review covered every change from `61d86e0` through `bd07708`, including
both tasks, test hardening and the written authority/wrapper inputs. It found
one Important defect: JavaScript `Array.map` skips missing entries, so sparse
Record/CAS vectors could hash as shorter vectors. The original implementer
first reproduced a behavioral failure (14 focused tests pass, one fails with
`Missing expected exception`), then replaced both loops with bounded own-index
validation. Fully sparse, leading/interior/trailing holes and prototype-filled
positions now reject the exact `InvalidCodecError / INVALID_VALUE` result.
The same final wave added the two requested maximum-width assertions for
`plan.notAfter` and `previousSequence` in both branches.

The single scoped re-review approved `bd07708..1ce66df`, closing both findings
without new breakage. Root independently reproduced 77 final-source Node
passes and exact deployment agreement. Solidity sources are unchanged by the
fix; the preceding 107 Core / 28 parser execution and fresh AST/build evidence
remain correctly labelled rather than claimed as new runs. Existing unsafe-cast
warnings are a disclosed unchanged Core/test baseline, not pristine output.
The final codec gate is closed; authentication, state transitions and completed
C0 remain outside this increment.

## What could have gone better

Use distinct nonzero values for every retained field; all-zero fixtures can
prove framing while missing content loss. Combine invalid inputs when error
precedence matters. Keep every execution tied to its source basis instead of
placing historic full-suite results under a new-head heading. Tests written
from independently framed bytes and source preimages matter more than two
implementations sharing the same expected-output helper.

Include malformed host-language containers, not only malformed encoded bytes.
The original dense-array tests and cross-language agreement did not challenge
JavaScript holes; a short adversarial input probe found a real commitment bug.
The final fix deliberately stays at the two input boundaries, without adding a
generic collection framework or changing valid identities.

The next integration should use this common codec directly in an actual
authenticated write. Do not turn the prerequisite into a new serialization
framework or repeat the already closed body/stateful reviews.

## Remaining integration and owner followups

Next wire exact C0 authority programs, bounded outer request decoding,
operation-only preflight, fresh-only sequence consumption and per-batch
persistence around the existing state planner. All semantic checks must pass
before journal replay; the returned result is not a preflight object.

Session grants/metering, source-derived Codex/bootstrap, carrier/Files semantics,
actual 4/7/3-leaf Files resource profiles, all nine joined SDK/static-SPA journeys
and real-wallet observations remain open. Passing pure codec tests closes none
of those by implication. Two earlier nonblocking maintenance followups remain
in the [stateful retrospective](stateful-verification.md), not hidden here.

No immediate answer is needed from James. Product-repository creation, main
merge, public deployment, durable publication and permanent release/freeze
remain separately gated. The native integrated-MVP goal stays active.
