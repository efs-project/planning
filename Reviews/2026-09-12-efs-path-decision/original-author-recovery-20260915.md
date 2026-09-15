# Original-author recovery: can the restored filesystem keep working?

September 15, 2026 · v2 PM · core-recovery-spike-20260915

**Status:** completed bounded experiment; independent review found no Critical
or Important defect in scope. Parent reran all 12 focused contract checks and
the real source-off integration successfully. Not a permanent migration protocol.

**Outcome:** the restored filesystem works, including subsequent owner and
native-contract writes, without changing Ledger/Core. This closes a practical
EOA reconstruction gap, not every portability requirement. Recovery is still
expensive and requires fresh author approval.

## Why this experiment

The [[compact-core-feasibility-20260914|previous core pass]] proved cold export,
offline byte/Type/signature verification and permissionless archive retention.
It did **not** prove that the recovered data becomes a usable filesystem under
the original authors, or that subsequent reads and writes still work.

The question here is deliberately concrete: export a small signed Files history,
stop its source, restore it into another deployment, independently read its names,
contents, tags and Lens results, then continue owner and contract writes.
The existing Ledger, Type identity, mandatory index and admission rules remain
unchanged. This tests a separate recovery helper, not another kernel rewrite.

## What needed care before writing code

1. **A retained signature is not destination permission.** The original EOA must
   authorize the destination operation afresh. A third party can retain evidence
   without acquiring the author's namespace. Recovery without the original key
   remains a different, unsolved requirement.
2. **Equal revision numbers can conceal different histories.** A destination
   HEAD at revision 2 might name a completely different record from source
   revision 2. Ordinary compare-and-swap does not prove they are the same.
   This first experiment requires a fresh author namespace and a contiguous
   source nonce prefix; arbitrary merge into populated author state is excluded.
3. **Withdrawals name local admission ordinals.** Copying a source ordinal to
   another chain might target an unrelated occurrence there. The helper rejects
   every withdrawal rather than guessing a mapping. Normal remove/mask/unbind
   operations are separate from occurrence withdrawal.
4. **The signature must name the history it endorses.** Simply finding similar
   source and destination actions does not establish the author's chosen lineage.
   One extra ordinary provenance statement is included in the destination signed
   action vector. The helper checks the copied source prefix and statement.
   The statement alone is an author assertion; verified correspondence requires
   the archive, helper association and exact destination evidence together.
5. **A valid signed transaction can arrive by another route first.** The same
   destination operation may be submitted directly to Ledger before the helper.
   Exact reconciliation must not duplicate effects or accept intervening writes.

These are real design boundaries found by source analysis and independent
review, not five newly demonstrated failures of the running browser.

## What the run established

The source created a standalone Alice-owned Directory, two named Files under
Alice/Bob, an edit, stable-File and revision tags, a mask, a rename and a REUSE
claim. A separate process exported nine signed publications from chain 31338.
The source was then stopped; offline verification succeeded and a missing-byte
control correctly remained incomplete.

On a fresh chain-31337 deployment with a different origin, another account retained
the archive without changing filesystem state or acquiring either author's
authority. Nine fresh author signatures restored the exact source action prefixes,
with new local publication/admission coordinates and source-bound statements.
A new destination reader recovered exact old/current bytes, `renamed.txt`, both
Lens orders, the mask, File/revision tag distinction and prior HEAD history.
Alice then made another edit. A separate real contract read and checked those
bytes, published its own child revision and changed its own HEAD without changing
Alice's nonce. Wrong-operator and wrong-byte-check transactions reverted.

This establishes **bounded, freshly authorized reconstruction**: same original
EOAs, File/Directory/record identities and logical filesystem state; new destination
admissions and validation context. It does not establish source admission,
source guard truth, source-history completeness, lost-key recovery or native-contract
source proofs. The joined run uses inline unencrypted raw-SHA256 carriers;
encrypted/external-content migration is not claimed.
The destination deployed matching reviewed Type/rule fixtures and checked their
identities; it did not automatically install arbitrary unknown validator code
or recover every possible validator dependency from an export.

The exact experiment starts source nonces at zero and does not allow same-author
destination writes to interleave during restoration. Other authors may interleave.
The extra statement consumes one action, so at most 63 source actions fit the
existing 64-action destination cap. No Core cap is raised. Ordinary source record
identities remain unchanged; total destination author-record counts intentionally
include new provenance statements and therefore need not match the source.

The first implementation also requires one fresh destination signature **per
source claim**, not one approval for an entire migration. Scripted fixture keys
are not evidence of a convenient wallet journey. Bundle authorization is a
follow-up, not a hidden feature of this helper.

Core continues to report `isImported=false`. This is a periphery-verified
re-publication path, not an implementation of guarded Core import.

The helper trusts its configured Ledger and archive implementations. The retained
deployment manifest must qualify the actual reviewed Core, archive, helper and
statement-rule code. The helper constructor does not authenticate arbitrary
archive implementations, and a contract falsely returning a verified-proof flag
is not a valid substitute. This prerequisite belongs in any reader's trust model.

## Measurements and handoff

These are real local receipt gas figures from the retained worker run, not
test-function gas or public-network dollar fees. The parent reproduced the
workflow independently; small signature/calldata differences changed aggregate
gas by a few hundred, not the conclusion.

| Work | Receipt gas | Interpretation |
| --- | ---: | --- |
| Nine ordinary direct control publications | 10,863,658 | Same original actions, authors, bodies, order and destination read-set recipe; no archive/helper/statement |
| Nine restored publications plus linkage | 15,139,228 | Includes the first direct submission and separate exact reconciliation; about 39% above this control |
| Retain nine source claims in archive | 9,281,681 | Additional to restoration, not included in the previous row |
| Continue with a normal owner edit | 1,710,017 | Successfully read back afterward |
| Native app read/check/write | 1,404,097 | App-authored child/HEAD, not impersonated owner |

The archive plus active restoration totals **24,420,909 gas across transactions**,
before deployments/registration and excluding deliberate negative/retry controls.
The largest restoration transaction was 2,746,265 gas. This demonstrates bounded
feasibility, not cheap bulk migration or an irreducible overhead floor. Later
recovery rows include accumulated extra-statement state, so the difference is
a recipe comparison, not a universal fixed helper surcharge.

Archive deployment costs 2,350,812 gas, the statement rule 124,723 and the helper
1,463,235; Type registration, baseline world setup and the native fixture's
1,252,483 deployment remain separately retained. These are shared periphery
deployments, not costs for every File. Nine deliberate duplicate transactions
cost another 1,017,037, and the post-edit duplicate 100,244: retries are safe,
not free. No gas/runtime cap was raised. Ledger remains 24,173 runtime bytes;
the helper is 6,332 and native consumer 5,421, outside Core.

The whole cold-read verification recipe—two Lens listings, old/current content,
three tag queries and HEAD-history checks including its pin—used 198 RPC calls,
57,300 request bytes and 301,551 response bytes. This is neither one directory
listing's cost nor a public-RPC latency forecast. SDK transport optimization
remains worthwhile; the recovery work did not change it.

Focused checks cover source realm/origin changes, source-prefix gaps, mismatched
heads, lineage tampering, unsupported withdrawals/legacy source, action limits,
direct-submission races, duplicate reconciliation, other-author interleaving,
and full rollback on rejected policy or required index. A malformed submitted
read-set preimage on the duplicate path was caught by a failing check and fixed.
The independent final source/evidence review found no Critical/Important issue;
parent verification was 12/12 contract checks plus 1/1 source-off workflow.

## Consequences for the MVP

- Keep the compact Ledger/required-index direction. This functionality did not
  require more Core code or sacrificing ordinary Type/Files semantics.
- Offer archive retention and active restoration as different operations with
  different authority and cost. Do not market this narrow helper as generalized
  import or as a one-click wallet migration.
- Before broad recovery, address selective merge into populated author state,
  stable occurrence mapping for withdrawals and convenient batch authorization.
  Those are concrete missing capabilities, not an excuse for another broad
  architecture tournament or a silent waiver of the goals.
- The next unimplemented core-usefulness probe is
  [[../2026-09-12-efs21-live-contract-files#Compact prototype preflight — September 15|typed live contract-backed Files]].
  Source analysis says it needs explicit Files-profile/index/reader extensions,
  not a Ledger change. An opaque wrapper is not a substitute for testing
  admission-checked typed backing. Public-network costs/access and authenticated
  native-source proofs also remain unproven.

Source workspace: existing `planning-warroom-b-run`, branch
`codex/efs-warroom-b-run`, initial checkpoint `abf0ab1`, completed code/evidence
checkpoint `23a331e468102512d01acbf422dbf8a9349ee7b3`. The four new code files
are `src/GuardedRecovery.sol`, `test/GuardedRecovery.t.sol`,
`test/RecoveryCarrierApplication.sol` and
`browser/guarded-recovery.integration.test.mjs`, relative to
`Reviews/2026-09-12-efs-path-decision/lab-b/`. The adjacent
`guarded-recovery-20260915/` packet retains source/runtime pins, original signed
transactions, source bundles, receipt reports and RED/GREEN evidence. All new
verification worlds were closed. No prototype migration, new production
repository, public deployment or owner-demo replacement occurred.
