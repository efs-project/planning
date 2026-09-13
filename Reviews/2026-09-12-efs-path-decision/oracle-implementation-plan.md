# Independent Lab Oracle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first disposable, independent offchain checker for Road B's sealed public profile and raw observation packet.

**Architecture:** A pure Node ESM module reconstructs candidate-profile commitments from raw bytes, then compares independently derived axes with candidate-native claims without merging them. Candidate-neutral expectations and hand vectors live outside implementation code; a thin CLI binds the exact profile/expectation file bytes to frozen Git blobs and emits JSON without RPC, filesystem discovery, or candidate executable dependencies. Packet-supplied RPC rows and proof grades remain raw observations, not authenticated conclusions.

**Tech Stack:** Node.js built-ins (`node:test`, `node:assert`, `node:fs`) and ethers 6.15.0 only for audited cryptographic primitives, resolved from the existing `planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules` tree without installing packages.

**Spec:** [[oracle-boundary]], [[sdk-fixture]], [[files-journey]], and [[run-manifest]].

## Global constraints

- Start branch `codex/efs-warroom-oracle` in sibling worktree `planning-warroom-oracle` from planning `32ed292af887455e690991d2fd642bebd4f47fef`; own only `Reviews/2026-09-12-efs-path-decision/lab-oracle/` there.
- Keep this plan on planning `main`, uncommitted for the coordinator; touch no other main file.
- Freeze neutral expectations from blobs `035aa6d9cb0dcd96517234a7ef1a160b45481abf`, `4a2864fc4670cf548f1efa7340041df0fec2b803`, `0c2aecc059e05e2251f06343c351ec3653b09ace`, and `0994c7125c5488d408a2519fdad45b91cd656ac0` before reading candidate details.
- Candidate B source is `727291aac717f4c4e38e9049e8c9328da94389b8`. Read only `lab-b/MANIFEST.draft.json`, public ABI metadata, and struct/interface declarations. Never read or import its Reconstructor, digest implementation, measurement script, SDK/helper, or verifier tests.
- Treat compiled ABI declarations from `dcc7b946d2ac8dfcf22103069127a9d1809df974` only as a separate diagnostic profile; they cannot silently complete or replace the `727291a` profile.
- No Forge, Solc, Anvil, RPC/network call, package installation, generated bindings, or shared build cache. Missing or changed public profile data yields an axis-local `UNSUPPORTED`, never a guessed formula.
- The packet format, names, encodings, and outcomes are lab-local evidence only; they freeze no Core or SDK API.

---

### Task 1: Seal neutral expectations and the public Road B profile

**Files:**
- Create: `Reviews/2026-09-12-efs-path-decision/lab-oracle/neutral-expectations.json`
- Create: `Reviews/2026-09-12-efs-path-decision/lab-oracle/profile-b.public.json`
- Create: `Reviews/2026-09-12-efs-path-decision/lab-oracle/hand-vectors.json`
- Create: `Reviews/2026-09-12-efs-path-decision/lab-oracle/README.md`

**Interfaces:**
- Consumes: the four neutral blobs above, then only the pinned candidate's public declarations.
- Produces: immutable JSON inputs for `reconstructCommitments(profile, input)` and `checkSealedPacket(packet, profile, expectations, inputBytes)`.

- [ ] **Step 1: Freeze neutral cases before candidate inspection.** Record literal semantic expectations for body mutation, committed-action mutation, missing evidence, response-ID reorder, separate source/destination authority, receipt/effect separation, and `FRESH | EXISTING | RETRY | INCONSISTENT` cost-state classification. Include source blob hashes and `frozenBeforeCandidateInspection: true`.
- [ ] **Step 2: Hash the neutral file.** Run `git hash-object Reviews/2026-09-12-efs-path-decision/lab-oracle/neutral-expectations.json` and retain the hash in the README before opening Road B files.
- [ ] **Step 3: Transcribe only public declarations.** Record the candidate source commit, manifest hash, inspected paths, domain fields, ordered struct fields, ABI types, and an explicit support/reason pair for record, subject, action, digest, and EOA recovery. Do not infer omitted fields.
- [ ] **Step 4: Construct independent literals.** Write exact input hex, manually concatenated/ABI-framed expected bytes, expected Keccak digests, deterministic signer/address/signature, and must-fail variants in `hand-vectors.json`. Compute only cryptographic primitives with ethers; do not call candidate code.
- [ ] **Step 5: Document trust boundaries.** State that retained RPC is not a state proof, native claims remain separate, public-profile omissions are `UNSUPPORTED`, and this checker is disposable.

### Task 2: Reconstruct commitments and verify the signature

**Files:**
- Create: `Reviews/2026-09-12-efs-path-decision/lab-oracle/oracle.test.mjs`
- Create: `Reviews/2026-09-12-efs-path-decision/lab-oracle/oracle.mjs`

**Interfaces:**
- Consumes: `profile-b.public.json` and `hand-vectors.json`.
- Produces: `reconstructCommitments(profile, input)` returning independent axis objects `{ status, value?, reason?, evidence }`; `verifyEoaSignature(digest, signature, expectedAuthor)` returning `VALID | INVALID | UNSUPPORTED` without authorizing an action.

- [ ] **Step 1: Write failing literal-vector tests.** Import the not-yet-created module and assert exact Record and subject values from `hand-vectors.json`, explicit `UNSUPPORTED` results for undeclared action/digest framing, and deterministic recovery of the literal expected author for the standalone supplied-digest control.
- [ ] **Step 2: Verify RED.** Run `NODE_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules node --test Reviews/2026-09-12-efs-path-decision/lab-oracle/oracle.test.mjs`; expect `ERR_MODULE_NOT_FOUND` for `oracle.mjs`.
- [ ] **Step 3: Implement minimal reconstruction.** Strictly validate fixed-length hex and numeric bounds, encode only the ordered public profile, hash with ethers Keccak/typed-data primitives, and return axis-local `UNSUPPORTED` when profile material is absent.
- [ ] **Step 4: Verify GREEN.** Run the focused test; expect all literal commitment and recovery assertions to pass.
- [ ] **Step 5: Add RED mutations, then GREEN.** Flip a body byte while retaining the claimed identity and assert a mismatch. Mutate the standalone digest and, separately, one literal signature byte; assert generic recovery fails while candidate action/digest/signature binding remains `UNSUPPORTED` rather than borrowing the generic control.

### Task 3: Compare raw observations without manufacturing success

**Files:**
- Modify: `Reviews/2026-09-12-efs-path-decision/lab-oracle/oracle.test.mjs`
- Modify: `Reviews/2026-09-12-efs-path-decision/lab-oracle/oracle.mjs`

**Interfaces:**
- Consumes: a lab packet with separate `inputs`, `observations`, and `claims` sections.
- Produces: `checkSealedPacket(...)`, `correlateRpcResponses(...)`, and `classifyCostState(...)`; the report retains derived, claimed, evidence-grade, and discrepancy fields separately.

- [ ] **Step 1: Write failing behavior tests.** Assert: missing evidence remains `UNKNOWN`; reordered JSON-RPC replies correlate by ID; duplicate/missing IDs fail; source acceptance never creates destination admission; candidate booleans/opaque evidence cannot manufacture proof grade; receipt-shaped input cannot create `SUCCESS` or `COMMITTED`; and unsupported or unfamiliar claim axes cannot disappear from comparison.
- [ ] **Step 2: Verify RED.** Run the focused suite and confirm failures name the missing comparison functions.
- [ ] **Step 3: Implement minimal comparisons.** Bind exact profile/expectation bytes to their frozen blobs; reject malformed or mixed source/destination bases and identical authority in this fresh-destination fixture; preserve raw inputs, observations, claims, and results separately; cap unauthenticated observations at `UNKNOWN`; leave unpinned effect/query/selection closure `UNSUPPORTED`; require an explicit claim for every frozen axis; and report every omitted, unfamiliar, or mismatching claim without overwriting either side.
- [ ] **Step 4: Add cost-state tests and implementation.** From explicit actor, action shape, body size, state regime, exact current/before/after operation commitments, pre/post bases, provenance, identity presence, occurrence/effect deltas, and retry identity, provisionally classify supplied controls as `FRESH`, `EXISTING`, `RETRY`, or `INCONSISTENT`. Mark the classification `UNAUTHENTICATED_INPUT` and keep sealed cost truth `UNKNOWN`; never infer it from gas, a candidate label, or a caller-supplied retry boolean.
- [ ] **Step 5: Verify GREEN.** Run the full test file; expect every neutral mutation and honest-unknown branch to pass.

### Task 4: Add the file-boundary checker and evidence handoff

**Files:**
- Create: `Reviews/2026-09-12-efs-path-decision/lab-oracle/check.mjs`
- Modify: `Reviews/2026-09-12-efs-path-decision/lab-oracle/oracle.test.mjs`
- Modify: `Reviews/2026-09-12-efs-path-decision/lab-oracle/README.md`

**Interfaces:**
- Consumes: `node check.mjs <packet.json> <profile.json> <expectations.json>`.
- Produces: deterministic JSON on stdout; exit `0` for a fully evaluated honest result (including declared `UNSUPPORTED`), exit `1` for malformed evidence or expectation mismatch, and no network or writes.

- [ ] **Step 1: Write a failing CLI test.** Spawn `process.execPath` against temporary JSON files and assert exact stdout/exit code for a matching packet, an empty/omitted required-claims packet, a claim-upgrade mutation, and a substituted profile/expectations input.
- [ ] **Step 2: Verify RED, implement the thin CLI, then verify GREEN.** The CLI performs only parsing, delegates to `checkSealedPacket`, and emits the returned report.
- [ ] **Step 3: Run final checks.** Run the full `node --test` command, `node --check` on both modules, `git diff --check`, and `./scripts/open-decisions.sh --check`; inspect `git status --short` to prove only `lab-oracle/` changed in the branch.
- [ ] **Step 4: Independent review.** Give reviewers the base/head commits, this plan, the public-profile read restrictions, and the full test output. Fix every critical/important finding through a new failing test, including circular input seals, manufactured proof grades/effects, silently skipped claims, incomplete cost controls, and mixed observation bases.
- [ ] **Step 5: Commit exact owned files.** Use a message file with subject `chore: add disposable independent Road B oracle` and `Agent: sdk-pm`, `Co-authored-by: GPT-5 <noreply@openai.com>`, `Harness: codex`; report commit, tree/blob hashes, command results, and every exact profile input still required.

## Completed handoff

- **Source:** branch `codex/efs-warroom-oracle`, base `32ed292af887455e690991d2fd642bebd4f47fef`, final commit `0e19d2746acffd1a6686301e494542d1fffada57`, tree `48ecb647544bd52ec1c0dc2f0a72d4678a88f943`.
- **Pins:** candidate B `727291aac717f4c4e38e9049e8c9328da94389b8`; neutral freeze commit `f060524edb189adf976645c64b8d2c3a52b2c410`; expectations blob `a9d6c9afb5f51d0f786e006b7b5df667ae69710e`; public-profile blob `06106fe3bc717ed4638612f2ef8b90d502c705b8`; hand-vectors blob `c58df6c533509109bd33c2e8ad44a15a609304aa`.
- **Coverage:** independently recomputes Record/subject identities; exercises generic digest and signature-byte mutations; preserves raw inputs/observations/claims/results; checks required claims, response IDs, distinct source/destination authority, structural bases, and provisional cost controls. Candidate action/digest/signature binding remains `UNSUPPORTED`; unauthenticated RPC-shaped semantic observations remain `UNKNOWN`; effect/query/selection closure remains `UNSUPPORTED`. Exit `0` is only agreement with this limited oracle, never a candidate pass.
- **Verification:** root and reviewers reproduced 33/33 tests; syntax, JSON, diff, and open-decision checks passed; three independent final reviews returned GO; implementation worktree was clean.
- **Remaining inputs:** ordered Action and PublicationIntent schema/framing, complete EIP-712 domain, replay/nonce and principal derivation rules, candidate signature vector, exact effect/query/selection closure, and a real proof-bearing raw packet.
- **Ownership:** implementation and this handoff are complete; ownership is explicitly returned to root for publication. No push, merge, or promotion was performed.
- **Not started:** a future `RPC_OBSERVED` layer may independently decode and compare supplied raw RPC bytes under an explicit observation assumption while leaving the existing strict proof-result layer unchanged; it must not imply chain inclusion or state-proof validity.

## RPC_OBSERVED handoff intake — September 13, 03:09 UTC

The separate extension returned local commit `0b9fbaff3d503f542b21e2ff42a60a98dbaf3725`
after expectation freeze `6c4ef635dde7a9cd90d80d006a817648cd5ecbff`.
Root reran 33 strict plus 52 extension tests: 85/85 pass. The strict source,
CLI and neutral expectations are unchanged. A fresh extension CLI invocation
produced byte-identical output to its retained report: 1 `OBSERVED_MATCH`,
0 `OBSERVED_MISMATCH`, 11 `UNKNOWN`, 4 `UNSUPPORTED`, and
`candidatePass: NOT_EVALUATED`. The sole match concerns signed-write raw
tuple/body-hash/Record-target/revision/order consistency, not authorization,
Type meaning, inclusion or semantic effect.

**Publication is held for one confirmed checker-input bug.** Independent
review identified malformed containers/entries being mistaken for omission.
Root reproduced `raw = {}`, `raw = [5]`, and `raw = [[]]`: zero mismatches and
process exit 0 despite malformed evidence structure. `transactions = [5]`
or `[[]]` also silently loses the malformed entries. In contrast,
`transactions = {}` already throws during basis-map construction and produces
exit 2; the review's broader wording was corrected rather than treating it as
another demonstrated bypass. None of these results asserts a candidate pass.

SDK PM has a 20-minute regression-first fix in its existing `lab-oracle/`
scope: distinguish genuinely missing observations from present malformed
cells/containers/entries, add API and CLI regressions, preserve sealed inputs,
strict files and the valid retained report, and return a new commit. No main
write, push, network, chain or compiler run is authorized by that fix. After
review/rerun, root publishes the branch. Public B profile `885d9f9` is now
available for a later bounded signature-binding extension, not this repair.

### Repair closed — source `52dae42`, September 13

The scoped re-review found the input-shape issue fixed with no material
regression. Root reran the original malformed-container/entry reproductions:
all now reject explicitly. Combined tests pass 112/112 (79 extension, 33
strict). The retained report is byte-identical and its conclusions remain
unchanged; frozen profile/expectations and the original strict files are
unchanged. Branch `codex/efs-warroom-oracle` is pushed at
`52dae42d239e135f3d4ff04642908b23eb01a720`. Publication hold is closed.
An unexplained untracked `.codex-commit-message` is preserved, not committed
or deleted. No prototype code was merged into planning/main.

## Next bounded task: independent signature binding

**Purpose:** complete the previously unsupported commitment/signature part of
Task 2 against the now-published diagnostic declaration. This is a separate
candidate-specific extension, not a rewrite of either existing checker or an
adoption of B's known-incomplete replay domain.

**Owner / base:** existing SDK PM, existing isolated `planning-warroom-oracle`
branch at `52dae42`; 40 minutes from dispatch. Node/ethers only; no network,
compiler, chain, package install, main edits or push. Root reviews/publishes.
Use this section as the brief and the existing handoff as the progress record;
do not create another agent framework or worktree.

**Allowed new inputs:** B `PROFILE.md` and `vectors/profile-b.json` at
`885d9f9`, blobs `ca39c29416ffa79231e48a52bef1e5403f563198` and
`8d92f5806911d50427901cda12441f65c74bc309`. They describe source `dcc7b94`.
Retained measurement packet and ABI-only declarations already authorized for
the RPC probe remain allowed. Do not open/import B's verification script,
Reconstructor, contract implementations, measurement code or tests. A public
declaration is an interpretation input, not proof of deployment or authority.

1. Freeze the input blobs and new mutation expectations **before** coding.
   Keep the original strict/RPC profiles, expectations, implementations and
   retained reports byte-identical. Use a separately named module/test/profile
   and a short report under the owned `lab-oracle/` directory; avoid a new CLI
   framework. Extend its README with the source, command and actual limits.
2. Write RED tests, then independently encode Action-array ABI bytes, compute
   its commitment, EIP-712 domain/struct/digest, and recover the expected EOA
   under exact 65-byte/low-s/v rules. Derive values from literal input fields,
   not the vector's supplied digest/encoded-output fields. Standard ethers
   primitives are allowed; compare computed results to the public vector.
3. Test changed body under unchanged actions, changed/reordered action fields,
   changed Intent fields, wrong signer, malformed widths/ranges, signature
   mutation, high-s and invalid v. Keep body commitment, signature binding and
   runtime acceptance as separate outcomes: a signature can bind an action
   that runtime rules reject. No Type/schema/authority success is inferred.
4. If time permits, decode the retained `signed-one/quote` create/edit calldata
   through the authorized public ABI and recompute those signatures too.
   Report missing bytes as unsupported/unknown; do not borrow the candidate's
   digest, pass flag or decoded summary as the answer. A cryptographic match
   does not authenticate the packet, target deployment, source state, nonce,
   current permission, admission, selected effect or query completeness.
5. Preserve and expose the current domain's absent chain/deployment fields;
   do **not** silently substitute the future replay fix. Rerun existing 112
   tests and the focused new tests, self-review, commit exact owned files and
   return the concise report. Stop at the bound with explicit remaining gaps.

Only this light extension is assigned; it grants no heavy-run lease and no
other worker may alter its files. Root supplies the independent task review,
so the SDK implementation does not launch duplicate reviewer tasks.

### Signature handoff review and bounded repair — September 13

SDK returned `0e6e682` with expectations frozen at `469f0a0` / `d7e4199`.
Root reproduced **139/139 tests**; the positive report hashes to
`9471daecee08991c328ff95c76df3e928e3a612836c7202b23f8bb9c965e8e25`.
Independent review found and root reproduced two retained-input defects:
present malformed transaction containers/entries are treated as missing or
filtered out, and `[nonce 0, nonce 0]` or `[nonce 1, nonce 0]` satisfy a check
intended for the retained `[0, 1]` pair. The public vector and original pinned
packet's reported signature results are not invalidated by these mutations;
publication of the checker as reviewed waits for the repair.

SDK owns a source-only regression repair through **05:12 UTC** in the same
`lab-oracle/` worktree. Freeze additional malformed/ordered-pair expectations
separately, preserve existing strict/RPC fixtures and the positive report,
reject malformed-present data before filtering, and enforce the named
retained pair. Missing data cannot establish exact-pair agreement. This is
packet-input consistency, not chain nonce availability or runtime authority.
No new oracle capabilities, candidate implementation inputs, network, build,
Anvil, main edits, push or extra subagents are authorized by this repair.

**Repair closed:** SDK committed the supplemental expectations at `1b341f0`
and the main repair at `61805d4`. Root reproduced both original defects as
fixed and 145 passing tests. Review then identified a sparse-array edge in
the exported JavaScript analyzer (not representable in the retained JSON).
Root added its failing regression, changed validation to visit every array
slot, and reproduced **146/146 passing tests**. The scoped reviewer returned
GO; final branch `258e5c2` is pushed. The positive report and profile remain
byte-identical, including report SHA-256 `9471daec…8e25`. This closes the
bounded signature-binding checker work, not candidate eligibility or the
runtime/authority/provenance/effect gates.

### Predeclared richer-observation supplement — September 13, 05:25 UTC

**Standing:** independently specified interpretation plan, before receiving
the new B run's values; not implemented or a passing report. This responds
to Fable's seven-getter collection question and SDK's read-only advisory.
Keep the old checker, expectations and report unchanged. Do not move raw
observations to a later block to make an old exact-call-set gate pass.

Scope is the **storing Consumer** in `native-one/quote` and
`signed-one/quote`, at the actual paid `readQuote` and `readList` receipt
block-end basis. It does not interpret JoinedConsumer/stateless/label cells.
Associate the final measurement source before launch (currently reviewed
repair `e77f36dd7a0352a09a5198207fd1c3a56b2e0a63`, requiring the same-basis
collection correction); Core association remains
`dcc7b946d2ac8dfcf22103069127a9d1809df974` unless explicitly changed. This
association is coordinator evidence, not an authenticated chain claim.

Inherited semantic expectations blob:
`1fbe87f6b2bf1d095bb0979997573439a6c2bd88`; public ABI profile blob:
`6345c2246e287e9676f714491ce8aebf673f754a`. The SDK-only read checked old
checker blob `a25dcb7077c152137da476b748f052f784ad38a8`: its exact stage
call-set gate rejects extra same-target/same-block selectors. That report
describes its old packet; it is not the appropriate predicate for this
predeclared richer collection.

At **each** named receipt basis require exactly one of every getter below,
with exact target, calldata, declared return type, JSON-RPC ID/method,
request/reply correlation, block parameter, separately retained block hash
and source label. Reject malformed, conflicting or substituted observations;
missing required evidence is UNKNOWN, not agreement. If the actual runner
collects duplicates, retain them and declare that mismatch rather than
filtering to a convenient winner.

| Getter | Selector | Return |
|---|---|---|
| lastAdmission | `0x519ef1f8` | uint64 |
| lastCount | `0x6b16ad67` | uint64 |
| lastRevision | `0xe08871ca` | uint32 |
| lastScanned | `0x336d5392` | uint64 |
| lastStatus | `0xd6d86712` | uint8 |
| lastTarget | `0x36abbd1d` | bytes32 |
| lastValue | `0x43183834` | uint256 |

Only the inherited independent semantic comparisons apply: at paid quote,
lastTarget is the independently recomputed QUOTE_3100 Record, lastRevision
is 2 and lastValue is 3100; at listing, lastCount is 1. Every other getter/
stage pairing is **interpretation UNKNOWN** unless separately frozen before
viewing its result. ABI decoding/presence does not earn semantic agreement.
Addresses, query coordinates and value-source provenance must still be
independently pinned; missing pins retain the existing UNKNOWN behavior.

Any later implementation emits a separately named report. Ceiling remains
RPC_OBSERVED, not RPC honesty, inclusion/canonicality, runtime/storage proof,
historical source authority, immutable Type meaning, COMMITTED or candidate
PASS. Block-end state is not transaction-index-local state proof. Preserve
all raw evidence now; this light interpretation task does not hold B's build
or require another candidate oracle.
