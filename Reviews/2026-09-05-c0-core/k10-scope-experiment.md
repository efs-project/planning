# Fresh-only K10 comparison arm

**Status:** disposable current-Cancun evidence, not a protocol freeze or populated-store migration.

Source baseline: `5a3520d599ad68292bf9901356fa6a8e667692e1`. This work changes only the experimental Core writer/read family and its independent reconstruction. Legacy mode remains the default. No public deployment, funds, main merge, or external worktree import is authorized.

## Initialization and representation

`StateStore.Store.scopeLayout` is one appended **uint256** slot. Valid values are exactly 0 (legacy admission-anchor layout) and 1 (K10 global-binding-key layout). This is a native-word discriminator, not a byte whose upper bits can be silently truncated.

A new host opts in by calling `StateKernel.selectScopeLayout(s, 1)` **before** `StateKernel.initialize(s, init, config)`. Selection requires zero realm/revision and all eight zero counters. It refuses even after initialization with no admissions. Existing hosts call their unchanged initializer and retain default zero. There is no populated reinterpretation API, migration, or automatic layout detection.

Selection and initialization reject unknown values with `InvalidScopeLayout(uint256)`. Admission rejects an uninitialized realm or unknown layout with `InvalidInitialization()`; checked query reads reject unknown layout with `ErrReadState`. The comparison harness exposes the full-word `scopeLayout()` getter. A production comparison host must similarly expose and pin the mode; this patch does not add a public administrative selector to existing hosts.

## Three ordinal domains

| Value | Legacy mode 0 | K10 mode 1 |
|---|---|---|
| Scope position / cursor offset | Zero-based position within one scope | Same |
| Kind-10 physical u48 lane | First admission ordinal of that binding | Global one-based binding-key ordinal |
| Raw `PageResult.items` | Admission ordinals | Binding-key ordinals |
| Hydrated `PageResult.items` | Admission ordinals | Binding-key ordinals |
| Hydrated row `ordinal` | First admission ordinal | First admission ordinal recovered through kind 8 |
| Kind-10 `counts(...).last` | Admission ordinal | Binding-key ordinal |
| Page high-water / requested basis | Admission ordinal | Admission ordinal |
| Kind-8 history values | Mutation admission ordinals | Unchanged |

Five u48 values remain packed into each word, with upper 16 bits reserved. The exhaustion guard remains `2^48 - 1`; last usable value is `2^48 - 2`. Type, Record, Envelope and Occurrence identities do not change.

Only first binding creation appends kind 10, using the planner's updated `p.count.bindingKeys`. Rebinding, exact replay, old-binding withdrawal and selected-binding withdrawal do not create another scope entry. Other posting families retain their original domains.

## Checked reads and continuation

K10 physical head/word bounds use global binding-key count, not admission high-water. For historical eligibility the reader resolves the key inventory entry, validates its binding head and kind-8 head, and reads the first kind-8 admission. Missing key/row/history, reserved bits, guards and inspected order violations refuse. Hydration uses that first admission and original occurrence identity. Both physical and recovered admission order are checked for consumed rows.

Cursor transport stays PageCursorV1, but context modes are explicitly disjoint: legacy raw/hydrated 1/2; K10 raw/hydrated 3/4. Scope, kind, requested admission basis and read revision remain bound. Append continuation must pass the original nonzero admission basis. No semantic identity is inferred from equal numeric values.

The existing bounded `bindingKeyAt(uint64)` plus checked K10 raw page suffices for a generic contract consuming scope entries. No direct scope-position API or reverse locator is added. The test-only `scopeLookup` consumer demonstrates that composition; it is not a new production API.

Like the control, pages validate inspected metadata, not an exhaustive body-membership or global-storage proof. Full independent reconstruction verifies the complete first-seen key/scope membership. Historical bisection inspects a bounded subset; it is not a full corruption scan.

## Independent consumer

`foldAdmissions(entries, ids, scopeLayout = 0)` independently derives legacy admission anchors or global first-seen binding ordinals from the same events. It imports no writer/fold helper from Solidity. Both live collection and offline verification require explicit `expected.scopeLayout` (0 or 1). The comparison path requires the observed snapshot mode; live collection pins its getter. Unknown full-width values refuse before narrowing.

Trusted caller configuration may explicitly select `expected.scopeLayoutProfile = "legacy-fixed-v0"` **and** `expected.scopeLayout = 0` for an identified, source-pinned legacy-only host/execution. Only this profile permits a retained snapshot's missing observed field and getter-free collection. The default strict profile is `"comparison-v1"`; other profile values refuse. A missing expected mode always refuses. Source profiles are trusted execution expectations, not self-asserted snapshot capabilities: copying a profile field into the snapshot or removing a supplied ABI getter never selects legacy compatibility. Existing fixture builders now configure their known fixed-legacy sources explicitly; comparison hosts must override that source profile.

Verification rejects missing or mismatched comparison-layout tags even for empty snapshots. Relabeling nonempty physical words also fails reconstruction. Real local tests deploy both modes with source-pinned library/runtime bytes, test missing expected/observed tags and stripped ABIs, admit matching publications, compare historical raw/hydrated pages, and verify unchanged occurrence and kind-8 identities.

## Integration cautions

- Rebuild and repin both AdmissionLibrary and the separately compiled UpgradeAdmissionLibrary, plus QueryReadLibrary and any host embedding it. A passing ordinary-Core size check does not prove the upgrade wrapper fits.
- Bind the full-word getter and expected layout before enabling a K10 consumer. Existing legacy fixture, SDK and browser assumptions must not be pointed silently at K10 raw output.
- The initializer/selector are internal seams. Existing upgrade fixtures remain mode 0; upgrading populated storage to mode 1 is neither implemented nor authorized.
- No per-binding reverse map is written. Posting word count and key/history row families are unchanged; selection adds one nonzero discriminator slot in K10. Read costs, initialization write cost and mutation transaction cost are separate questions.
- Admission body-budget simplification retains checked cumulative addition and `total > 8192`; the former individual `leaf.body.length > 8192` predicate was logically redundant because lengths are nonnegative. Single-body and cumulative overflow cases remain covered.

Pinned-source integration check against Fable's `cb6e76e`: among the twelve
delivered paths, only `Reviews/2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs`
had changes relative to the K10 base. Its watchdog/CORS/step-tracing hunks are
separate from the provenance/layout additions; preserve both. This was a
read-only Git-object comparison, not a cherry-pick attempt, inspection of newer
U3 work, or proof the combined build fits. Rebuild/repin the actual joined head.

No 10k-scale or total transaction savings are claimed. Reproduction and review
closeout below preserve the durable handoff independently of task scratch files.

## Measured evidence (2026-09-10)

Final Solidity 0.8.30, optimizer 200, via-IR, Cancun runtimes: AdmissionLibrary **24,520 bytes**, UpgradeAdmissionLibrary **24,553**, QueryReadLibrary **21,415**, UpgradeQueryReadLibrary **21,557**. Both admission wrappers pass ordinary deployment checks. The upgrade wrapper has **23 bytes** below EIP-170: sufficient for this pinned handoff, but a blocker to unreviewed feature stacking. Repin and remeasure any change.

Test-only consumer, seven actual first-tombstone keys in one scope after three unrelated admissions; both modes have identical logical final data. Gas is measured around host calls with `gasleft()`, excluding transaction base/calldata charges, deployments, initialization, admissions and warmth-reset cheatcodes. Cold runs reset host and linked-query warmth; warm runs repeat immediately. Lookup means a checked one-item raw page plus key resolution. Legacy resolution hydrates the first admission and reads its three binding-position fields; K10 resolves the key dictionary directly. History means that same lookup followed by `readHistory(key, 1, 1)`; its rows are returned but discarded in the measured caller and checked separately.

| Measured call work (gas) | Legacy | K10 |
|---|---:|---:|
| Cold scope-to-key | 109,091 | 69,068 |
| Warm scope-to-key | 34,583 | 27,060 |
| Cold scope-to-key + first hydrated history | 157,862 | 162,333 |
| Warm scope-to-key + first hydrated history | 71,868 | 64,339 |

The cold lookup benefit is **40,023 gas** in this fixture. Cold lookup plus hydration is **4,471 gas more expensive**, not cheaper. These measurements do not cover 10k keys, arbitrary history depth, bulk write transactions, reverse lookup, full-page traversal, or changing hardware/provider costs.

Fresh verification: Core Forge **210/210** (200 control tests + 10 K10 tests); upgrade Forge **19/19**; K10 independent/live Node **2/2**; legacy audit/binding Node **2/2**; upgrade chain/read Node **15/15**.

## Reproduction and review closeout

Run from the planning repository root with the existing lab dependencies:

```sh
forge test --root Reviews/2026-09-05-c0-core --summary
forge test --root Reviews/2026-09-08-upgradeable-foundation --summary
forge test --root Reviews/2026-09-05-c0-core --match-test testMeasureColdAndWarmLookupAndHistory -vvvv
node --test --test-concurrency=1 Reviews/2026-09-05-c0-core/test/k10-scope.test.mjs Reviews/2026-09-05-c0-core/test/audit-pages.test.mjs Reviews/2026-09-05-c0-core/test/binding-reads.test.mjs Reviews/2026-09-05-c0-core/test/stateful-chain.test.mjs Reviews/2026-09-08-upgradeable-foundation/test/upgrade-chain.test.mjs Reviews/2026-09-08-upgradeable-foundation/test/upgrade-reads.test.mjs
```

The controller independently reproduced **210 Core + 19 upgrade Forge tests**,
**30 Node tests** (including 11 stateful-chain tests), and all four gas figures.
Tests start and stop disposable local chains; their passing status is not
evidence of a public deployment. Incremental build-info selection now requires
creation bytecode, deployed bytecode and immutable-reference metadata to match.
If no coherent full compiler evidence exists, rebuild the relevant Foundry lab
with `--force --ast --build-info`; a mismatched AST is not accepted as fallback.

Retained test-first failures before implementation were: physical scope lane 4
instead of required key ordinal 1; then wrong hydrated admission domain after
the writer-only change; and the independent fold returning `[[4n]]` instead of
`[[1n]]`. Each became green after its corresponding implementation change.
Task review then found offline missing-layout fallback to mode0. The new
zero-binding test reproduced **VERIFIED** with a missing expected mode before
the fix. Explicit trusted source profiles closed that gap; scoped re-review
found the issue addressed with no new breakage. Code checkpoints: `c38b1f4`
(writer/readers) and `fe98f18` (offline qualification fix).
