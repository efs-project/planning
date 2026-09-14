# Required-query independent input/source review — 2026-09-14

**Input/source gate: PASS for the exact retained offline fixture.** No blocking input defect found. This is not a paid-execution result, gas/price conclusion, runner approval, production approval, or authority to launch.

Reviewed input: `/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/inputs.json`, SHA256 `077f59b735d2ddb3fbd9c3d432f306b0f919929b20e9a6d5402459790e96788c`. `inputs-reproduced.json` has the same freshly checked hash. The input correctly retains `launchReady=false`; its empty `missingData` means complete offline values, not completed execution/reviews.

## Findings

- **No P0/P1/P2 input/source finding.** All finite checks below passed against the retained JSON and current pinned source/artifact files.
- **P3 — nonblocking frozen-spec wording:** [independent schedule, line 11](/tmp/efs-required-query-independent-schedule-20260914.md:11) says B is stricter in “note/maximum magnitude.” Only the note part is true: [B LabAcceptors.sol, lines 18–30](../../../planning-warroom-b-run/Reviews/2026-09-12-efs-path-decision/lab-b/src/LabAcceptors.sol:18) caps at `type(uint128).max`, while [C FixtureActors.sol, lines 19–27](../../../planning-warroom-c-run/Reviews/2026-09-12-efs-path-decision/lab-c/test/FixtureActors.sol:19) caps at `10_000_000_000`. C is stricter on maximum magnitude. All frozen literals satisfy both, so this changes no byte, signature, admission, page, or gate result. Record this clarification with the experiment; do not silently mutate the hash-frozen schedule.

## Scope and method

Read the handoff and README, all of `prepare.mjs`, `runtime.mjs`, `prepare.test.mjs`, and `runtime.test.mjs`, then the frozen logical/physical documents and relevant primary source formulas/constructors. The previously reviewed B/C reader algorithms and unit phase were not broadly re-audited. Narrow consumer source inspection is described below.

No compiler, Anvil, RPC, chain, builder, runtime-helper function, or test-suite execution was performed. No input/source/repository edits or commits were made. The only created file is this report. Fresh Node checks read the retained JSON/artifacts and independently decoded, re-encoded, hashed, recovered, and compared values; they did not import either fixture builder or helper. These checks answer whether the *retained output*, rather than merely a generator run, satisfies the input seal.

The retained [root-tests.log, lines 1–25](/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/root-tests.log:1) reports 17 passes and zero failures. I inspected its contents and the test sources; I did not rerun it or treat self-tests as an independent semantic oracle. In particular, tests reproduce the builder's page schema and literal schedules, so independently checking the frozen specification remains necessary.

## Fresh verification results

All three read-only retained-data checks exited 0:

1. **Integrity and encoding:** 71 source Keccak hashes, 100 retained file pins, all local script hashes, both frozen-document hashes, 21 constructor/runtime targets, 222 substituted physical spans including creation-library links, 25 EIP-712 app signatures, 82 signed Ethereum transaction envelopes, and 25 Page ABI/event encodings.
2. **Independent frozen values:** 54 fresh data Records across three separate graphs, 52 named runtime values (51 Solidity immutable-declaration values plus the compiler's ImportLib deployment-self-address value), all constructor arguments, all signature contexts, and all 25 complete Page/cursor objects against literal frozen schedules.
3. **Build reconciliation:** all 16 distinct original/AST artifacts have identical full creation/runtime executable strings, library-link spans, physical immutable spans, ABIs, and source-metadata hashes; their AST-artifact file hashes match the retained reconciliation rows.

Fresh source HEAD checks matched B `d547890e57fb0c1ba2ef4d9f8b18b519946197b8` and C `3f5702f1d7acc39c1d62a5b1a0795f3fe579ebce`. The current source hashes matched all 71 retained expected hashes. Existing unrelated untracked worktree files were left untouched.

## Why the input seal is sufficiently precise

### Source/artifact/helper boundary

[prepare.mjs, lines 17–35 and 55–96](/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/prepare.mjs:17) gates the 16 original artifact SHA256 values and compiler profile, compares every original/new executable byte and physical patch span, checks AST-build ABI equality, and checks the 71 exact source hashes. The frozen logical and physical document hashes are required at [lines 211–214](/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/prepare.mjs:211). Script and helper hashes are retained in the output, not represented as proof of chain state.

The current AST path is `/tmp/efs-required-query-ast-20260914.hrHCoQ/{b-out,c-out}`. The resolver does not reuse the earlier AST-missing snapshot or assign compiler numeric IDs by guess. [runtime.mjs, lines 17–31](/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/runtime.mjs:17) identifies the exact source/target contract, walks direct bases, compares the reached set with complete linearized ancestry, and rejects missing/ambiguous inherited declarations. This specifically covers the B selective index's inherited `ledger/admin/attachedFrom`, both B readers' inherited reader immutables, and C's store/interface ancestry.

I also independently reconstructed declaration-to-reference mappings and substituted all physical runtime words from the retained ASTs, checked non-overlap and zero placeholders, and compared the *entire* resulting runtime, including every unpatched byte. Each creation input was independently linked and concatenated with ABI constructor encoding. CREATE addresses were checked from account 0's exact nonces, including setup nonces.

### Exactly what reused helpers were checked

- [runtime.mjs, lines 7–15 and 34–47](/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/runtime.mjs:7): all three helper/dependency hashes are checked before import; only the generic B runtime-instantiation function or narrow C link/self-address function is invoked. No old fixture/answer derivation is called.
- [paid-runtime-b.mjs, lines 17–109](../../../planning-warroom-oracle/Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-runtime-b.mjs:17): exact AST contract identity, complete inheritance, declaration-ID/name uniqueness, complete supplied-value/reference inventories, rejection of unsupported links, bounds, 32-byte words, overlapping spans, zero compiler placeholders, and literal preservation outside substitutions. I inspected its import/top-level boundary and the separate old `deriveBRuntimeTargets` path at lines 139–190 to confirm the required-query adapter does not call that old graph constructor.
- [paid-vectors-b.mjs, import/top-level lines 8–19](../../../planning-warroom-oracle/Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-vectors-b.mjs:8): its pinned import provides pure old vector functions; those functions are not called by the required-query path. No filesystem/RPC/candidate-result access appears in that dependency. I did not use its old graph or expected answers for this review.
- [C runtime.mjs, lines 8–47](/tmp/efs-c-control-independent-prep-20260913.MkbdXi/runtime.mjs:8): exact source/contract/constructor inventory; ImportLib's compiler self-address marker; the single qualified `src/ImportLib.sol:ImportLib` link in creation and runtime; complete Ledger immutable references; bounded/nonoverlapping substitutions; exact placeholder checks; and unchanged surrounding bytes. The new adapter rejects inherited immutable omission before taking this linked branch.

This is a narrow mapping/substitution/circular-oracle review, not a broad approval of the reused runners or old fixture suites.

### Constructor inputs and trust pins

[prepare.mjs, lines 229–267](/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/prepare.mjs:229) derives the 21 deployments from the frozen account/nonces and constructor formulas. I checked every named immutable value and constructor argument against those formulas and the current constructors: deployer/admin, B minimum body 96, B realm/domain, index `attachedFrom=1`, selective profile, C zero poison, C deployment-qualified realm, C library address, and all reader Ledger/index/Type/rule pins. Reader pins are derived from artifact-based exact runtimes, not learned from `eth_getCode` or a candidate result.

Neither the builder nor its reached helper paths use any observed chain answer as a trust pin. C runtime code copied into input is independently linked and instantiated before signing; it is not an observed runtime passed back into its own expected answer.

### Graph, authoring, and signatures

[prepare.mjs, lines 110–186](/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/prepare.mjs:110) implements the frozen canonical bodies, Type/Record IDs, principal/Subject formulas, action vectors, and signed publication contexts. Independently checked all four Type descriptors per arm and all 18 fresh Record bodies/IDs per arm, including reversed Pair Q, non-Quote R1, canonical C outer framing, and exact Quote payload constants. Both reuses provide the existing Record ID and empty body. No auxiliary or A3 HEAD is introduced.

The two authors are the same mnemonic-derived EOA accounts 1 and 2 in all three arms. Every one of the 25 app signatures was recovered against an independently constructed EIP-712 schema and compared with the intended EOA. Checked B's zero-starting and C's one-starting application nonces, C's initial four-Type admission batch, action ABI hashes, signature context, B acceptance-profile folding at registry epoch 4 with no extra policy, and index obligations. The current B formulas are [Ledger.sol, lines 735–807](../../../planning-warroom-b-run/Reviews/2026-09-12-efs-path-decision/lab-b/src/Ledger.sol:735); the C digest/author context is [ActionLib.sol, lines 70–110](../../../planning-warroom-c-run/Reviews/2026-09-12-efs-path-decision/lab-c/src/ActionLib.sol:70). No native-contract-author parity is claimed.

### Signed transport, order, and envelope

[prepare.mjs, lines 215–227 and 257–280](/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/prepare.mjs:215) preserves 82 transactions: 21 deployments, 11 other setup transactions, 25 publications including C Types, and 25 paid pages. Independent recovery/decoding checked all signed raw bytes and hashes, sender, target, calldata, value zero, chain 31337, type 0, 2 gwei, fixed 15M/8M/5M gas limits, exact per-account Ethereum nonces `[32,19,6,25]`, CREATE addresses, and block/arm/role ordering. Publication and page calldata join to their independently sealed app objects. The frozen B blocks 1–35 / 36–59 and C blocks 60–82, including Type publication at block 66 and reader/consumer at 67–68, are preserved.

Block numbers and positive status are *expected schedule fields*, not fabricated receipt evidence. There are no observed `gasUsed`, receipt block hashes, or paid outcomes in this input claim.

### Pages, cursors, and paid-consumer commitment

[prepare.mjs, lines 37–53 and 191–205](/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/prepare.mjs:37) encodes a seven-field Page with its full twelve-field Cursor. I independently compared the artifact function-result ABI to both the stored Page objects and stored bytes, and checked the complete cursor identity, runtime pins, realm origin, source Type, ordinal 0, Pair P, old/current admission basis, generation, and position for every page. Both ABIs have reader selector `0x9fe8fb7f` and paid-consumer selector `0x65faab2b`.

All six frozen page sequences match, with current raw counts **15 / 4 / 5 even for old-basis queries**, B old/current bases 21/24 and C 25/28. B-old examines 13 entries but returns terminal position 15; those two unexamined tail entries are not counted as scanned. Selective old/current terminal positions remain 4, C remains 5. Partial cursors point to the next unexamined position; complete cursors retain identity and never become zero restarts. B logical header/body and C logical-header counters agree with the frozen preflight, without asserting equal physical internal call counts.

The two complete consumer contracts are exactly [B IncomingQuotes.t.sol, lines 408–416](../../../planning-warroom-b-run/Reviews/2026-09-12-efs-path-decision/lab-b/test/IncomingQuotes.t.sol:408) and [C IncomingQuotes.t.sol, lines 321–329](../../../planning-warroom-c-run/Reviews/2026-09-12-efs-path-decision/lab-c/test/IncomingQuotes.t.sol:321). Each has one nonpayable external wrapper, calls `reader.incomingQuotes`, emits non-indexed `PageRead(keccak256(abi.encode(page)))`, and returns that same Page. There is no storage state, inheritance, alternate entrypoint, fallback, or extra mutation in either consumer. All 25 event topics/data were independently encoded from these ABIs. A successful mined transaction still would not alone establish returned Page bytes; the runner must retain the frozen pre/post-call and receipt checks.

## Remaining gate

Root can use this exact input hash as the reviewed finite input/source seal. The separate runner/source review, explicit launch seal, startup/runtime verification, joined raw transaction/receipt/header evidence, and post-publication/page state audit remain required. No paid-query result, gas measurement, automatic-index general conformance, authenticated-state proof, broader graph completeness, production cap, or production readiness follows from this PASS.
