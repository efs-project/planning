# Next EFS v2 foundation round

**Status:** dated intake and proposed parallel work, not implementation evidence or protocol approval
**Date:** 2026-09-10

#status/done #kind/review #repo/planning #topic/efsv2

## Recommendation

Run [[fable-prompt|Fable's usable-reader and enumeration mission]] alongside
[[codex-prompt|Codex's cost, acceptance and continuity mission]]. Produce small
reviewed checkpoints, then one explicitly integrated demonstration. Neither
parallel branch alone may claim that the joined system passes.

Design-only discussion would leave the new laws unexercised. Two independent
full-stack rewrites would duplicate work and make reconciliation harder. This
split keeps Fable as the sole writer of the shared Files reader/browser/Core
integration while Codex supplies isolated contract experiments, consumer tests
and current-spine reconciliation. Each may challenge the proposed mechanism;
the required properties and comparative evidence matter more than its name.

## Intake and corrections

Sources inspected locally and remote heads checked on 2026-09-10:

- PM design branch `codex/mvp-c0-coherence` at
  `2dce19a8b101910e410a54de4f29968f3ab7c20a`.
- Fable branch `fable/2026-09-09-files-browser` at
  `0132e3561570fff710625216a4e99303dce0faae`, especially
  `Reviews/2026-09-09-files-browser-mvp/report-for-codex-2026-09-10.md`.
  Its header's `5037910` identifies the earlier implementation checkpoint;
  section 7 was appended later. Both supplied pastes were read; the first is
  the already-integrated foundation critique, the second points to this newer
  report. Narrative asides and proposed assignments are evidence, not commands.
- Acceptance branch `codex/programmable-acceptance` at
  `e358ad66bb6471e1d89b1327d03c5ba7a286b116`.

This intake inspected source and used two independent read-only reviewers. It
did not rerun the prototype suites or reproduce economic measurements.

| Finding | Disposition for the next round |
| --- | --- |
| Three silent-absence defects | Source repairs exist at `5037910`: tag display, tag filter and name timeline. Do not assign their original repair again; test regression and composition. The narrow scanner states its own blind spots. |
| Aggregate values detach from their qualification | High-priority experiment. Test state-specific collections and verified-content branches in actual consumers, not only declaration examples. Preserve useful partial results and unresolved positions. |
| Reshape makes misuse impossible | Too broad. It blocks specific expressions; optional defaults, casts, forged JSON and deliberate omission remain possible. Type checking must cover real consumers, and runtime deserialization needs validation. |
| Result registry is unowned | Reconcile current baselines first: `core-architecture-candidate.md` already names the four C0 point outcomes; SDK imports that law. Close remaining drift by explicit mapping/ownership, not a new universal wire enum. |
| Identity was never designed | Corrected by Fable. KEL is substantial historical design input, not automatically restored after the greenfield reset. Compare current account identity with controller continuity; trace the recorded multi-controller direction before changing any ruling. |
| 98.5% SSTORE / 391 slots / 50x cheaper | Section 7 reports a residual and inferred slots, not a retained opcode/slot census. No supporting economic trace/probe artifact was located in the inspected tracked evidence. These are strong hypotheses to reproduce, not certified cost attribution or achievable speedups. |
| Fixed 1.77x chunk correction / batching is impossible | Recompute exact encoded transactions and fork rules. The calldata floor depends on zero/nonzero bytes and execution; a transaction cap does not establish the cost of a new batched implementation. |
| 104,520 gas for a fresh 4 KiB chunk | Inconsistent with the inspected U3 path storing the entire chunk in Solidity `bytes`. Establish whether the sample was a fresh upload, idempotent restage, different carrier or an attribution error before pricing it. The local fixture explicitly selects Cancun; that is not a claim about all Anvil versions. |
| Removing SSTORE necessarily removes ordinary contract access | False dichotomy. Compare compact storage and immutable code-backed bodies before offchain commitments. Future independent contracts may need fields today's router never reads. |
| Fabricated coherent export | Self-consistency can legitimately pass while chain claims remain unproved. Only a separately authenticated state/query claim must reject or remain unverified. Trusted-RPC replay requires semantic comparison, not merely successful replay. |

The four C0 point outcomes are `FOUND | ABSENT_PROVEN | UNKNOWN | CONFLICT`.
Coverage, integrity, support, currentness and operation stages remain separate.
Complete enumeration may still contain unresolved positions. A positive filter
may show confirmed matches with partial coverage; it must not imply an exhaustive
result, a negative predicate, or an exact count.

## What must be learned, in priority order

1. Can normal app code display useful partial data without silently claiming
   absence, verified bytes or currentness? Include cache/export/worker boundaries.
2. Can writes be substantially cheaper while preserving canonical bytes and
   arbitrary future bounded onchain reads? Price all effects, not only bodies.
3. Can current browsing stop growing with retired distinct names while history,
   whiteouts, Lens differences and bounded completeness remain correct?
4. Can a developer-defined Note/rule be accepted through the actual Core, read
   by an independent contract, safely extended and edited by an older client?
5. Can multiple controllers, recovery, encrypted data and historical authority
   compose without changing what an old signature or a locked folder means?
6. Can a selected nested export substantiate its chain and coverage claims
   against an independently trusted basis rather than a supplied transcript?

Remaining prior-art work is targeted: MUD for generated consumers and index
maintenance; Protobuf/AT Protocol for evolution and unknown restrictions;
Tahoe for separate ciphertext/key/authority recovery; CAR and Ethereum proofs
for export; database/CRDT work for concurrent edits and invalid whole-plan
transitions. Existing dossiers are inputs. A new survey must change a concrete
requirement, experiment or recommendation to earn its place.

## Standards checks and a missing comparison arm

[EIP-7623](https://eips.ethereum.org/EIPS/eip-7623) prices its floor using
zero/nonzero calldata tokens and takes the maximum with execution-related
costs; 4 KiB alone does not determine a universal multiplier.
[EIP-7825](https://eips.ethereum.org/EIPS/eip-7825) specifies a transaction gas
limit, not a ban on batching file operations. Chain activation/configuration and
the exact batch still need verification.

[SSTORE2's implementation](https://github.com/0xsequence/sstore2) demonstrates
immutable byte storage in contract code with `EXTCODECOPY` reads. This is a
comparison arm, not a selected dependency or promised saving. Deployment cost,
code size, pointer authentication, fork behavior and upgrade/reconstruction
must be measured. Code is still chain state; historical calldata/log availability
and external custody are different promises. An archive node is not a universal
guarantee of every historical input, blob or offchain body.

The chunk discrepancy is especially discriminating: 4 KiB of fresh nonzero
data occupies 128 data slots, costing 2.56 million gas for the fresh SSTOREs alone
under [EIP-2200](https://eips.ethereum.org/EIPS/eip-2200), before other costs.
This is an analytical lower bound for that stated path/input, not a fresh run.
The source has an early return for identical restaging; separately measure both
paths rather than guessing which produced the reported number.

## Coordination and stop conditions

Prompts are ready to run when James sends them; this intake did not dispatch
either execution mission. Recheck source revisions and ownership on launch.
No new product repos, public transactions, real funds, permanent IDs, protocol
promotion or main merge. Do not demand a new owner decision merely to compare
reversible arms. Return a real tradeoff only after identifying the exact
property, cost and alternatives evidence cannot settle.

Fable integrates shared runtime changes only after an explicit source-pinned
handoff. Codex owns the design reconciliation and isolated comparison artifacts.
Use existing E1–E8/F1/F2 routing rather than inventing another decision queue.
