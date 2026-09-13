# Sealed neutral expectations — disposable paid point/list slice

Authored September 13, 2026 by the independently assigned semantic expectation
author. Data-only comparison artifact; no implementation, candidate integration,
gas result, architecture recommendation or production API adoption.

The companion `paid-neutral-expectations.json` fixes the seven semantic rows:
A1/A2/B1 setup, then paid point and list under each of A-first and B-first.
The JSON has literal named fixtures, shared checks, row expectations and small
negative/control lists. It is data for an independent comparator, not a new
checker framework. Setup rows apply `setupCommon`; paid rows apply
`paidCommon` and `paidControls`; a selected quote joins `fixtures.quotes` and
`fixtures.quoteCommon` by its label. Lists additionally apply `listPageCoverage`.
History and candidate-head arrays express membership, not physical order. The
Pair's `orderedItems` array is intentionally ordered ETH, then USDC.

## Source boundary and provenance

Read inputs were limited to `planning/AGENTS.md` and the neutral
`sdk-fixture.md`, `overhead-and-selection.md` and `oracle-boundary.md` in this
review directory. No candidate lab code, runner, fixture map, test, result
packet or checker was opened. No candidate-derived expected value was used.
No build, deployment, network call, commit or push was performed. The root PM
owns publication and the aggregate session-status line.

Source files were clean in the index/worktree when read on planning `main`,
revision `8dfe27a4e611a5d0cf9e3a599edde9e2b70724b8`. Their Git blob identities and
SHA256s of the literal current file bytes are recorded in JSON `sources`.
All source paths there are relative to the planning repository. Current-byte
Git hashes matched the indexed blobs. This pins the requirements read, not any
candidate implementation or evidence result.

The JSON `sourceRequirements` keys are new locator shorthand for existing
source passages, not new requirement identifiers or additional normative rules.
The uppercase setup/change/role/basis labels and `ADMITTED` are comparison-local
spelling for source meanings, not candidate ABI values or production enums.
`newTestConditions` is empty: no additional acceptance criterion is being
silently imposed. Explicit reversed Pair order is the negative of the source's
ordered ETH/USDC requirement, not an inferred candidate representation.

## Meaning fixed before candidate evidence

The source explicitly establishes `observedAt=1800000000` and note bytes
`0x7265666572656e63652071756f7465`, UTF-8 `reference quote`
(`sdk-fixture.md:62-65`). The note literal is therefore source data, not an
invented example. The commitment algorithm and carrier representation remain
arm-local; a commitment must independently match these bytes under that sealed
rule. The source does not specify Item body fields beyond the admitted Item
labels/Types and checked references, so this manifest invents none.

At the post-B1 basis there is exactly one A placement:
`/swaps` + `eth-usdc` -> `FILE_QUOTE`. Its retained provenance is always
`A1` / `AUTHOR_A` / `EOA_SIGNED_PUBLICATION_EFFECT`, including when B-first
selects `QUOTE_B1`. The retained placement source-acceptance basis is distinct
from the post-B1 observation basis. B creates only a competing content head.
A1 is retained history; A2 and B1 are the two qualified current content heads.

A-first selects A2 (`2502000000`, scale 6), authored by A with
`EOA_SIGNED_PUBLICATION`; B-first selects B1 (`2501000000`, scale 6), authored
by B with `CONTRACT_ORIGINATED_PUBLICATION`. Both read forms independently
check all Quote fields, resolve its Pair, check Pair Type and ordered ETH/USDC
references, then resolve and check both Item Types at the same arm-local basis.
Signer, author, submitter, payer and placement actor are not collapsed. No EOA
signature substitutes for B's actual producer-contract origin.

Both read forms qualify the same content-candidate universe. Each list is
exactly one placement in its pre-sealed page/window with checked end evidence;
this is scoped observed coverage, not a global completeness proof. The point
read joins independently retained placement evidence outside its paid lookup;
it need not perform or pay for an otherwise unrelated directory read.

Each paid row is the first transaction from its arm's cloned/reverted sealed
post-B1 snapshot through a pinned unrelated caller/consumer and public read
interfaces. All four rows share that semantic observation basis; execution
blocks are separately recorded. Cross-arm controls match logical state,
caller roles, block/time and cold-transaction conditions, not physical IDs,
body sizes, block hashes, deployment graphs or snapshots. No cost numbers are
fixed here. The one placement is charged once at A1 and disclosed separately.

## Failure, evidence ceiling and unresolved inputs

All semantic conclusions in this slice stop at `RPC_OBSERVED`. A successful
receipt, matching hash, decoded candidate value or native status is not an
independent semantic check and does not authenticate Ethereum state. Report
observed agreement/disagreement or a named unsupported/inconclusive check;
do not upgrade contract origin, state effects or coverage to portable or
authenticated proof. Preserve `INVALID`, `ABSENT_PROVEN`, `UNSUPPORTED`,
`PARTIAL` and `UNKNOWN` where supported; absence is never inferred from a
timeout, unavailable target, omission or empty page.

The small negatives cover extra/duplicated placement, point/list selection
disagreement, provenance laundering, missing or wrong closure checks,
wrong-Type/missing/unavailable targets presented as valid, mixed bases or
candidate universes, bad coverage, unsupported projection and receipt-only
success. The source also requires the bounded matched acceptance/index-failure
rollback control: independent pre/post observations must show no new intended
effect partly visible and prior facts unchanged. Its exact operation,
pre-state and failure trigger were not specified in these permitted sources;
they remain a required separately sealed control input, not a guessed test.
The referenced `matched-cost-scope-review` was not opened under this author's
neutral-source read boundary.

The source-neutral expectations are defined; the run is not thereby ready.
JSON `unresolvedArmInputPins` names the remaining exact physical vectors,
Item bodies/bounds, ABI/artifacts, clean source/configuration/profile pins,
deployment/caller facts, page/window/end condition, basis/snapshot controls
and matched rollback trigger. These must be independently supplied and sealed
at the source-prescribed times. Candidate packets may echo pins but cannot
define or repair them. Any semantic ambiguity encountered during mapping must
stop the affected check for clarification, not adopt the candidate's answer.

This seal covers only the seven success rows and stated small controls. It
does not run or waive the full finalist journey, tag paid-query costing,
move/path-reuse/remove/restore, import, rule/account drift, permanent protocol
decisions or later authenticated-proof requirements. It alters no older
oracle profile, frozen call set or diagnostic packet's evidence status.
