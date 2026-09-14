# Required-query paid plan coherence review — 2026-09-14

**PASS for bounded implementation-plan coherence. No Important blocker or unresolved issue found after the two targeted root edits.** This is disposable local planning evidence, not runner approval, paid execution, production approval, or launch authority.

## Scope

Read the complete paid implementation plan, state recipe, retained independent input/source review, frozen paid preflight, and frozen logical schedule. Then reread only the root's exact permit-schema paragraph and bounded receipt-poll clarification. Both are coherent with the shared interfaces and close the identified narrow ambiguity; no prior source gates were reopened.

No source/unit reader gate was reopened. No task code, test, compiler, RPC, blockchain, benchmark, commit, push, repository edit, or delegation was performed. Only read-only file commands and this report write were used. Arithmetic below is document reconciliation, not observed execution evidence.

## Reconciled checks

- **Finite transaction schedule:** B scan blocks1–35 contain12 setup +8 common +15 pages; B selective blocks36–59 contain12 setup +8 common +4 pages; C blocks60–82 contain6 initial setup +1 Type publication +2 reader/consumer deployments +8 common +6 pages. Total82; the cross-arm cost partition21 deployments +11 other setup +1 Type +24 common +25 pages also totals82. Old/current seal blocks19/20,54/55,75/76 match the frozen order. All25 pages occur after the tail, with old-basis pages before current-basis pages per arm.
- **C Type staging:** block65 uses `typesAdmitted=false`, zero high-water/nonces, attachment/layout checks and absent data rows. Block66 checks the separate Type publication delta plus highWater4, A lastnonce1/B0, Type Records/Occurrences and the initial TYPE_META/ByAuthor lists. Reader/consumer deployment67/68 then permits the full Type/profile initialization before common1 at69. No circular requirement to inspect deployed reader code before it exists, and no omitted C Type publication cost.
- **Checkpoint/delta split:** all24 common publications receive new admission/evidence deltas and complete current state; C Types adds one;25 page poststates produce50 mutation/page checkpoints. Common7/8 already are the old/tail seals and are not counted twice. Three pre-admission zero-state checks and initialization calls are additional, not part of50. Immutable admission/evidence rows need not be reread after every page. The full current-state snapshots do preserve Record bytes/firstAdmission/occurrences, counters/nonces, heads, scope/history and maintained posting inventories.
- **B packed inventories:** complete `postingHead` plus all `ceil(count/5)` whole 256-bit words containing five 48-bit ordinal slots preserve contents, ordering, unused-bit zeros and count/live/last/flags. The current Quote list of 15 needs 3 words; author A's 18 needs 4; selective Q's 9 needs 2 and P's 4 needs 1. Reuse increments Quote/author occurrence postings but does not duplicate selective references. The A1→A2 move preserves history while decrementing A1's binding-backlink live count. B scan's undeclared reference family is checked as absent, not mislabeled complete.
- **C differences:** shared HEAD scope, unique-Record ByType/Backlinks, all-kind ByAuthor, C Type rows separate from18 data Records, and stored-last nonce remain explicit. Raw mandatory coverage `(true,true,0,0)` is not replaced by synthesized API through; the absent binding-live counter is disclosed. P includes R1 and yields5 current entries; Item backlinks retain[P,Q].
- **Expected-value independence:** the sealed input fixes graph/action/signature/runtime/Page bytes; the transport-free oracle folds executed sealed actions and source layouts. No candidate Page, returned cursor, observed code hash or runner PASS field becomes its own expectation. Literal-golden tests and a root review gate precede Task2. The pure auditor replays retained raw observations instead of accepting the runner summary.
- **Bounds and evidence:** the rough6650 request estimate is not a measurement or exact allocation. The mandatory offline exact inventory/worst-case poll count is the real admission check and must remain≤8192; the extra zero-state snapshots still leave plausible headroom. Response streaming,2MiB response cap,64MiB combined request/response bytes,30s timeout,12 polls and failure-prefix retention are all specified. Runtime code,83 parent-joined headers,82 signed transports/receipts/transactions and50 page return calls are included. Actual full-map feasibility remains an implementation gate, as it should.

## Targeted edits verified

Task2 Step1 now explicitly reconciles the generic required-null rejection, exact missing/extra observation rule and12-poll ceiling with the one bounded variable-length step:

> An `eth_getTransactionReceipt` step permits0..11 exact-ID `result:null` pending replies followed by one matching non-null receipt, at most12 polls total. Null is fatal for all other required observations. Only pending receipt reads may repeat. `maximumRequests` budgets12 polls; replay validates the consumed prefix and rejects any poll after the terminal receipt. Twelve nulls fail without another send.

The inserted text also requires attempt-numbered labels, no skipped polls and no post-terminal polls. This is consistent with the existing bounded-poll intent and is not a new observation family or permission to retry an ambiguous send. Focused implementation tests should exercise first-poll success, one pending then success, twelve pending failures, and an extra poll after success. The ambiguity is resolved at plan level.

The shared permit paragraph now fixes schema identity, exact input hash, exact freshly hashed dependency-path map, normalized endpoint, chain/cap settings and safe-integer time window no longer than30minutes. Independent source/artifact/helper pins remain separately checked before the first request. This coherently binds the later reviewed implementation without changing the retained `launchReady=false` input. It is a schema, not a usable permit or launch approval.

## Remaining gates

Task1 implementation plus literal tests and root review; Task2 implementation plus transport/replay tests and exact finite request map; exact runtime permit and root lease/startup checks; one retained82-transaction attempt and independent raw replay. None is satisfied by this plan review.
