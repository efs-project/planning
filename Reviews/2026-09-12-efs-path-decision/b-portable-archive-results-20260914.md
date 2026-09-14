# Portable signed-claim archive — completed result

**September 14. Standing:** disposable semantic and representation experiment
complete; both task reviews and final integration review approve prototype
publication. No production release, protocol freeze or stronger proof claim.

## The useful result

Someone can retain an exact EOA-signed publication, recover only the available
selected data, and submit those bytes under today's destination rules without
replaying the original batch's stale head changes. The copy retains its content
identity and signature evidence. It does **not** magically inherit the original
author's authority on the new deployment.

The real joined test advances a destination head, verifies stale source CAS
refusal, retains the full signed claim anyway, and republishes selected bytes
as the actual importer without changing that head. A current destination policy
can still reject admission while the archive remains readable. Another file's
missing body does not prevent recovering the available file; missing action
tuples do, because the signature commits to the complete ordered vector.

This is materially better than making all historical recovery depend on the
author returning to re-sign. It is still only one layer of portability:
historical source admission and native-contract proof remain **UNSUPPORTED**.

## What the measurements say

| Whole receipt gas | Packed rows | Immutable code vector |
| --- | ---: | ---: |
| Retain 1-action signed claim | 429,833 | 456,481 |
| Retain 2-action signed claim | 578,709 | 585,046 |
| Retain 64-action signed claim | 9,817,718 | 8,571,876 |
| Paid first action read | 50,726 | 36,787 |
| Paid last action read, N2/N64 | 50,738 | 36,799 |
| Archive deployment | 1,387,764 | 1,423,208 |

Consumer deployment is 195,652 gas. N1 has two separate same-leaf paid reads,
both at the first-read figures. No estimated consumer overhead is subtracted.
These costs are **no-body archive retention/read costs**, not ordinary file
creation, attached-body storage, destination admission or total recovery cost.

**Keep packed for this prototype's default.** The rule chosen before measuring
required cheaper retention at both N2 and N64. Code storage saves 1,245,842 gas
at N64 and 13,939 per paid read, but costs 6,337 more at N2 and 26,648 more at N1.
The workload may justify a different choice for read-heavy or large archives;
we did not change the success rule after seeing those tradeoffs. Neither
representation is claimed universally cheapest. This reversible choice is not
a 50-year protocol commitment.

## Verification and retained evidence

- Full B suite **102/102**, including **17 archive tests**; compiling behavioral
  RED followed by GREEN, with explicit sparse-body coverage, malformed vectors,
  empty bytes, boundary lengths, retry no-writes and no duplicate postings.
- Packed/alias runtime 6,160 bytes; codeblob 6,324; consumer 658. Actual largest
  data carrier 18,497 bytes. Normal runtime/init and 30M block limits were used.
- One bounded private Cancun Anvil run: three deployments, six retention cells,
  twelve paid reads. All **21 unique transactions** and **six same-base branches**
  were independently joined to their raw RPC receipts, headers, logs, code and
  getter results. The node stopped and released the slot at 10:10:33 UTC.
- Independent checker derives fixtures/signatures separately from the runner
  and checks full compiler input/output/artifact joins. Six real-packet
  corruptions reject: missing transaction, wrong fixture hash, fabricated read,
  edited receipt gas, altered blob and failed snapshot restore.

Source commits `02c34a9` (Task1), `2e03588` (Task2), `08a4d0e` (two comment
trailing spaces only); evidence published at
[`af5764a`](https://github.com/efs-project/planning/tree/af5764a/Reviews/2026-09-12-efs-path-decision/lab-b/archive-task2-20260914).
That packet retains 31 compressed originals (~2.98 MB), including the full
compiler input/output, raw observations, exact measured runner, independent
audit/corruption controls and all reviews. The full measured source digest is
`2b9373560bd428de43f63c8190552752896b323f90a7415261321b5b29c35e62`;
raw packet SHA256 is
`87e0c642e9d2a923f01c9e2bbc57e28b4a553822c046bdbd98d6457a5c8a3177`.
The postmeasurement whitespace change is not relabeled as measured bytes.

Evidence level is **OWNED_LOCAL_RPC_OBSERVATION_NOT_STATE_PROOF**. A consistent
retained transcript is not authenticated historical chain state. Native-source
proof, destination authority and current accepted membership stay separate.

## Remaining minor notes and next work

The final reviewer found no Critical/Important issue. Three nonblocking notes
remain: unknown-kind=251 was tested against packed but not separately added to
the codeblob equivalence fixture; two intentional assertions produce lint
warnings; the Forge-only test harness is oversized for ordinary deployment.
Actual deployable candidates fit and were deployed under normal limits. These
notes do not justify rerunning the unchanged successful benchmark.

The archive lane is closed. The next executable work is the
[[files-joined-implementation-plan-20260914|joined real FileRevision experiment]]:
checked same-File parents, required retained backlinks, two-author heads, and
revision tags resolved after selecting the head. The
[[files-next-joined-gate-20260914|cold-parent control]] already demonstrated a
bounded-read remedy using existing Core functionality; its public SDK form is
still a design question. General Files completeness, cold filename reconstruction,
global tags and portable native proofs are not silently marked done.

## Reversible controller decisions

- Preserve exact B signing/identity and keep claim retention separate from
  destination execution; no forwarded-author Core surface. Risk: a later
  stronger portable admission path needs separate engineering.
- Require full signed vectors, explicit claim-local byte coverage and exact
  bounded descriptors; unknown native proof fails closed. Risk: selected-leaf
  recovery still requires unavailable unrelated action tuples.
- Use compiling behavioral RED, bounded owned runs and raw independent joins;
  retain original failed/pre-start evidence instead of overwriting it. Cost:
  additional temporary tooling, not a permanent product subsystem.
- Freeze no-body PUBLISH-only 1/2/64 fixtures before measuring and keep packed
  when the small-write conjunction fails. Risk: read-heavy applications may
  prefer the alternative; no universal optimum is claimed.
- Preserve the prototype worktree and its closed progress ledger, per James's
  preservation instruction; do not merge prototype code into planning/main or
  repeat unchanged builds. Cost: a small explicit retained workspace, not an
  active worker or background chain.
