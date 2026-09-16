# Core closeout — engineering choices retained for James

September 16, 2026 · v2 PM · prototype engineering record, not owner adoption or permanent protocol choices.

Entries 1–70 are the exact controller `Ruling:` entries from the ten coordinated closeout ledgers through prototype `c9cc15b`; entry 71 is the final review disposition, appended after that review. Each preserves its original reason and cost/risk if wrong. They document reversible implementation choices made while executing the authorized experiments; they do not waive requirements, grant public-deployment authority, or replace [[../../Designs/efsv2/owner-rulings|James's rulings]]. Current outcomes and readiness are in [[core-closeout-results-20260915]]; implementation sequence is [[compact-mvp-build-plan-20260914]].

This appendix is grouped by source ledger and captured line, not claimed to be a global chronological ordering: some ledgers prepend newer checkpoints. Historical instructions and then-pending tasks below are retained provenance, not new work orders. The original `.superpowers/sdd/` files remain in the preserved prototype workspace. Nothing was deleted to produce this record.

## 1. core-closeout-acceptance-plan-20260915:20

Ruling: mandatory final phase requires an exact acknowledgement, not low-level call success — an old permissive fallback otherwise skips final Files obligations — costs a callback ABI revision and a small return check.

## 2. core-closeout-acceptance-plan-20260915:22

Ruling: constructor-created fixed stateless IndexDispatch is the permitted extraction — ordinary Node deployments do not resolve library links — costs one dependency deployment and an immutable address/hash pin; no arbitrary target or shared storage writer.

## 3. core-closeout-acceptance-plan-20260915:24

Ruling: registry epoch and execution identity must remain stable after every prefix callback and at final commit — trusted-admin callbacks otherwise change the signed validation basis mid-publication — costs bounded repeated observations and bytecode; ordinary data/coverage progress must remain outside execution identity.

## 4. core-closeout-acceptance-plan-20260915:26

Ruling: one bounded assembly rewrite of dispatch allocation/copy/accounting is permitted after measured 24,698-byte runtime — preserve the private wire format, Ledger-side codehash check, shared allowance and bounded return behavior — costs additional focused assembly review. If still over limit, use a larger coherent module extraction rather than repeated unrelated byte shaving.

## 5. core-closeout-acceptance-plan-20260915:28

Ruling: measured complete repair is25,018 runtime bytes; extract read-set shape/hash and registry-only acceptance-profile calculation into fixed stateless publication support — preserves canonical state/rule enforcement in Ledger and avoids continued byte shaving — costs STATICCALL overhead and changes readSetHash source mutability from pure to view, not its selector or output. Verify exact legacy hash vectors, dependency pins, initcode and normal deployment.

## 6. core-closeout-acceptance-plan-20260915:30

Ruling: warm Name255 success does not close the real cold full-stack failure (E_INDEX,871,092 paid gas) — optimize only the same ASCII grammar and rerun the actual cold transaction with independent equivalence controls — costs another narrowly reviewed byte-work change; no rule/pin/domain/budget waiver. The earlier reviewed byte-copy/KMP repair remains valid within its measured warm scope.

## 7. core-closeout-authority-plan-20260915:13

Ruling: preserve the final-1 native paid packet as the exact retained mixed-cache artifact set, with complete per-artifact compiler/settings/source identities, rather than relabel it as the output of a clean default build — worker's later forced layout compile shows the newly global import remapping changes clean Ledger metadata even though final-1 reused the older byte-identical Ledger artifact; the actual proof/deployment anchors still name what ran — cost if wrong is a reproducibility or profile-equivalence overclaim, so the task review must inspect this concern, final resource work must start from a coherent clean build with actual new hashes/Types, and no prior proof/runtime/receipt is silently assigned those identities. No packaging redesign or repeat proof tournament is authorized by this ruling; a correctness gap remains review-blocking.

## 8. core-closeout-authority-plan-20260915:25

Ruling: permit one bounded scratch-memory reuse experiment around the30primitive-returning storageValue calls in the separate verifier — actual same-proof verify-only12,445,456 versus retain12,643,943gas attributes almost all cost to verification, and source shows cumulative discarded trie/RLP allocations — cost if wrong is memory aliasing/dirty-memory corruption of verification, so persistent witness/account/root/result/value buffers must stay outside the reclaimed region, only copied uint256 values escape, dirty-memory initialization must be justified or cleared, and independent decoded results/adversarial controls plus scoped review must match. Preserve byte-exact upstream code, all canonical/path/shape/duplicate/key/size checks, storage semantics and normal caps. Retain baseline packets; one matched measurement and relevant complete journey/negative controls, not an optimization tournament or general multiproof/staging redesign. No saving or broader supported envelope is claimed until measured.

## 9. core-closeout-authority-plan-20260915:27

Ruling: sequence the native journey as paid same-chain checkpoint/retention/consumer first, then stop the source RPC and independently verify/consume the retained claim offline — stopping the local chain prevents further same-chain transactions and must not be hidden by a fake foreign checkpoint — cost if wrong is that an additional foreign-finality/destination-consumer integration remains to be built; this task does not establish cross-chain consensus verification or waive it. This clarifies execution order only, preserves the decisive source-off recovery test, and grants no arbitrary-root setter or public deployment authority.

## 10. core-closeout-authority-plan-20260915:62

Ruling: allow shared private guarded-signature ingress serialization, then only if needed optimize the existing _prepare typed-result-to-Pub mapping — the duplicate ingress and fixed17-field copy are coherent serialization units, with no new mutable target or storage ownership — cost if wrong is serializer/caller/field corruption, requiring focused EOA/native/wallet preparation and rollback checks plus independent review. Preserve typed abi.decode/canonical fields,544-byte success and existing error-copy bounds; first13 static fields align but later fields cross mutable counters/readBytes, so no unchecked whole-struct cast. If both attempts still fail, report measured deficit before further decomposition. Normal caps stay unchanged.

## 11. core-closeout-authority-plan-20260915:64

Ruling: expose exact typed signature evidence on its immutable caller-namespaced Store rather than duplicate raw bytes getter on Ledger — the existing proofkind3 pointer/hash can anchor the Store and avoids kernel getter growth — cost if wrong is a join/UX footgun; companion/archive must verify proofkind, selected source Ledger, digest, profile, code and pointer/hash, and EOA readers must reject kind3. This is within the task's typed-getter requirement, not authorization to trust an arbitrary Store response or adopt permanent ABI.

## 12. core-closeout-bytework-plan-20260915:12

Ruling: Start bounded A2/A3 waste removal while A1/A4 design preflights run read-only — avoids idle time without concurrent edits — if API preflights change affected code, reconcile and rerun its focused tests before integration.

## 13. core-closeout-index-plan-20260915:14

Ruling: materialize retained generic references and every required family, then price the full cold profile — cheaper partial bundles cannot establish the promised whole-system cost — may expose a higher whole-write floor or require an explicit finite joint work envelope.

## 14. core-closeout-index-plan-20260915:16

Ruling: try inline singleton posting headers first — they remove a redundant fresh word while preserving getter semantics — costs a declared physical layout change and a more expensive second append; actual lifetime/receipt savings must be measured.

## 15. core-closeout-index-plan-20260915:18

Ruling: task 2 follows task 1 before paid query implementation — query coverage and scope mutation must build on the real live/replay fold — costs sequencing time but avoids two incompatible coverage rewrites.

## 16. core-closeout-index-plan-20260915:20

Ruling: preserve widespread base/Files constructor signatures with a virtual empty-profile accessor and thin immutable profiled wrappers — avoids unrelated deployment churn while exercising actual Files indexing — costs explicit per-profile wrappers. Manifest commits specs/data as well as code identity; initialization order must not cache unset derived immutables. Disposable profile bounds16Types/four scalars/one digest are explicit; later fields require rebuild, not declaration-only completeness. Main docs own agent-status.

## 17. core-closeout-index-plan-20260915:22

Ruling: original350k actual cold evidence succeeds for8refs without fields (1,017,982whole gas) and refuses8refs+one scalar+digest (1,133,618; unchanged counts). After singleton savings, permit initial fixed-helper work formula200k+150k/actions+30k/checked-ref+35k/declared scalar-or-digest+100/maxBodyWord for publish/reuse, ceiling9.8M (original64-action allowance). This is a bounded declared-work model, not module-supplied gas or venue inflation. Bind work-model/spec identity, calibrate cold8+4+digest and Files Name255, and measure quote overhead for ordinary zero-ref/field calls. No all-maxima guarantee; allowance is not actual spent gas.

## 18. core-closeout-index-plan-20260915:24

Ruling: one cross-Type algorithm+digest posting replaces the intermediate per-Type digest key — basic hash discovery should not require probing every declared Type — no duplicate mirror. Source Type stays available per Record; per-Type filtered counts require qualified pagination. COMPLETE remains finite-manifest-scoped. Test cross-Type shared digest and algorithm separation; disclose intermediate-key measurement differences instead of claiming strictly budget-only comparison.

## 19. core-closeout-index-plan-20260915:34

Ruling: observed ordinary whole-publication delta satisfies Task1's added-cost gate with its explicit non-isolated label — no pure quote-cost claim is made. Isolated attribution remains a final decomposition gap; no duplicate paid campaign solely to isolate roughly8k overhead here.

## 20. core-closeout-index-plan-20260915:50

Ruling: include FilesPageReader, FilesJoinedConsumer and compact SDK's old attachedFrom==1 gates in Task2 replacement qualification — an index-only success with broken actual consumers does not establish usable rebuild — costs a narrow consumer/mock delta and focused replacement read evidence, not a general SDK rewrite.

## 21. core-closeout-index-plan-20260915:52

Ruling: preserve live ordered-prefix COMPLETE within the staged publication for later developer rules, while readiness excludes active publication and detached incomplete replay — reviewed ordered acceptance needs prefix queries, which are not final publication certificates — costs explicit distinction and controls in replay/readiness tests; conflating the two would either break atomic applications or overstate replacement readiness.

## 22. core-closeout-index-plan-20260915:56

Ruling: the new replayDecoderCodehash auto-getter is not a required public interface; keep the immutable expected hash private while enforcing it on every decoder call and exposing decoder address/module runtime identity — removes unnecessary new ABI surface without sacrificing a historical getter or check — costs absence of an ABI convenience for expected helper hash; deployment/source/runtime verification remains explicit.

## 23. core-closeout-index-plan-20260915:58

Ruling: measure the equivalent static-tuple legacy intent serializer first; if still necessary, move only its pure digest codec to the existing fixed PublicationSupport boundary — preserves exact domains/digest bytes and Ledger signature/nonce authority while freeing real runtime — costs call/serialization gas and requires independent legacy/guarded digest vectors plus relevant signed/native/import controls. Losing request-memory encoding is reverted; no broad kernel rewrite or cap inflation.

## 24. core-closeout-index-plan-20260915:60

Ruling: retain the old attachedFrom gate only for the already-pinned legacy SDK manifest ABI without provenFrom; new supported manifests use provenFrom and never fall back on RPC failure — owner demo serves changing SDK files but retains its old deployment ABI, so unconditional new calls break refresh — costs one explicit compatibility branch and targeted controls, not a weaker new-index coverage rule. Parent read-only60608/config.json confirmed the existing index exposes attachedFrom only; no demo restart or state mutation.

## 25. core-closeout-index-plan-20260915:64

Ruling: require a genuinely fresh64×4 full-field guarded follow-up instead of labelling reused preimage pricing as cold — old cheap comparison reused10,592 retained bytes — costs one focused paid run, which measured11,851,195gas rather than4,517,851deduplicated. Both conditions and receipts remain retained; no all-maxima or8KiBbody claim.

## 26. core-closeout-live-files-plan-20260915:11

Ruling: bind the first descriptor rule to an immutable expected provider runtime hash, enforcing it at admission and explicit observation — the finite direct-provider experiment must not imply that a pinned proxy shell proves its mutable implementation/dependency history — costs separate exact rule/profile binding for a different reviewed runtime. This is not a Core/global provider whitelist, proxy detector, or universal existing-contract claim. Retain a rejected proxy/delegation-shaped control; report setup costs and exact measured-source differences. Prior paid SDK GREEN covers old block42/fresh75 with unchanged EFS state, same-tx87/false, failure masking, mandatory rejection150 and source-off snapshot88; final-source matched/economics checks remain pending review.

## 27. core-closeout-live-files-plan-20260915:18

Ruling: after nested-helper actual initcode50,584 exceeds49,152 by1,432 despite runtime21,205, deploy the same fixed stateless immutable helper separately and pass address plus independently selected runtime hash, with exact config checks and runtime/execution dependency pins — avoids embedding helper creation code in parent initcode without moving state or weakening validation — costs an extra separately managed deployment/verification step and separately priced setup, and a trust footgun if matching getters are mistaken for reviewed runtime. Brief/constraints/canonical plan now carry full boundaries; no factory, mutable setter or further split. The initial Node attempt failed on a missing baseline consumer artifact before trying live deployment, so no onchain size rejection is claimed from it.

## 28. core-closeout-live-files-plan-20260915:20

Ruling: helper forwarding uses existing IndexWork.MAXIMUM inside the unchanged shared outer budget instead of provisional3M — preserves the existing finite joint allowance rather than silently narrowing it — costs measured call overhead/EIP150 forwarding; focused heavy final checks must price remaining feasibility. Worker independently identified this before continuing. Current4test baseline uses provisional output/caller fixtures only; executable observation and snapshot are still pending.

## 29. core-closeout-live-files-plan-20260915:24

Ruling: first finite provider recipe is same-chain Cancun `quote(bytes32) -> (uint128,bool)`, exact64-byte canonical result and50k call bound, with descriptor-pinned adapter caller/output Type/provider codehash — this instantiates the brief's one bounded read profile rather than inventing a universal provider ABI — if insufficient, a later explicit profile is needed; no guarantee is waived. Valid zero/false must remain data, not failure sentinels. Worker reports baseline carrier check passed and first RED compiling; no live success/fit claim yet.

## 30. core-closeout-live-files-plan-20260915:42

Ruling: choose the finite independent observation/new stored File Save snapshot journey, not an unimplemented in-place live-to-old-child transition — old Type validators cannot accept future parents without changing identity — costs leaving cross-family in-place editing as a named follow-up; no owner requirement is waived or falsely counted complete.

## 31. core-closeout-live-files-plan-20260915:44

Ruling: live output carries explicit shape/observation qualification, never implied full EFS admission — provider reads do not run the Ledger acceptance pipeline and legacy acceptors have Ledger-caller semantics — costs a separate admitted snapshot when applications require retained accepted data, plus explicit SDK result grading.

## 32. core-closeout-live-files-plan-20260915:46

Ruling: if the actual extension exceeds normal code size, allow one fixed stateless Name/Directory final-validation extraction with measured actual initcode and calls — it is a coherent existing final-hook unit without moving state/index authority — costs another deployment/call and possibly larger initcode; if it still fails, report before further decomposition.

## 33. core-closeout-query-plan-20260915:13

Ruling: repair the discovered incoming-quote API mismatch before optional query-cost tuning; retain its existing honest PARTIAL vocabulary while keeping folder-origin COMPLETE gates — current base has a real unsupported query due to wrong semantic coverage scope, plus outdated fixtures — cost is one small scoped implementation/review and an explicit distinction between two existing read contracts, not a coverage waiver or new architecture. Cost task is renumbered3; historical Task2 references below name the formerly queued cost experiment.

## 34. core-closeout-query-plan-20260915:44

Ruling: select one small separate selection-head getter experiment rather than join batching or normalizing the existing raw getter — absent target-slot loads are avoidable while raw guard/proof congruence and diagnostic observability stay intact — costs one prototype view/internal seam, changed execution code pins and a finite paid/review gate; discard the implementation if no worthwhile same-guarantee win or ordinary fit.

## 35. core-closeout-query-plan-20260915:46

Ruling: use10% P64 whole continuation/query saving and no greater than5% P1/P8 step regression as this experiment's retention gate — bounds tuning effort before a one-candidate measurement instead of chasing unspecified savings — costs potential deferral of smaller wins; not an adopted protocol price, width limit or claim of practicality.

## 36. core-closeout-query-plan-20260915:60

Ruling: include local folder mutation versions in the shared live/replay fold rather than a live-only callback — rebuilt indexes must offer the same query liveness guarantee — costs one extra scope slot and rewrites, explicitly priced in the paid query packet.

## 37. core-closeout-query-plan-20260915:62

Ruling: keep the current TAG binding encoding in this task unless the parent has separately approved a tag-profile task — first close A4 without coupling a new tag representation to cursor correctness — costs a later matched tag-profile join regression, while global Concept lookup/explicit silence remain disclosed gaps until then.

## 38. core-closeout-query-plan-20260915:64

Ruling: permit read-only helper decomposition only at existing pinned read boundaries if the measured assembled profile exceeds runtime limits; no kernel authority or storage rewrite — module placement should not weaken origin/coverage checks — costs external-call/returndata work and explicit source/code pins which must be measured.

## 39. core-closeout-query-plan-20260915:68

Ruling: refine the earlier read-only-only fit suggestion to permit one constructor-fixed, index-write-only FilesScopeState companion for the existing dense arrays/offsets plus exact scope mutation stamps — that coherent state unit is the code being extended, while Ledger and generic index authority stay unchanged — costs extra calls, physical-profile qualification and a paid overhead measurement. No independently attachable coverage/admin/mutation path; shared live/replay and inherited final hooks remain authoritative. Measure full composed runtime/init before claiming fit; do not run byte-golf alternatives if it fails.

## 40. core-closeout-query-plan-20260915:70

Ruling: historical unresolved coverage must revert into existing Files unavailable handling instead of returning numeric0 — old history UNKNOWN0 and point ABSENT0 are distinct vocabularies — costs a failed-read path and focused negative control, preserves known-negative integrity without redesigning all result ABIs.

## 41. core-closeout-query-plan-20260915:82

Ruling: attempt the task's existing retained-inventory alternative through protected scan/head hooks and a separate retained Lens, deriving origin prefix lengths by bisection over first binding admissions and pinning their hash/raw total in the owned accumulator — the current obstacle is unimplemented integration, not evidence of impossible snapshot traversal — costs length-discovery reads and lifetime-candidate scans, potentially expensive P64/deep-inventory initialization. One bounded churn fixture and actual fit/cost determine the supported envelope; no trees, new index extraction, inflated caps or assumed joint maxima. Fast and retained profiles must remain separately identified.

## 42. core-closeout-query-plan-20260915:100

Ruling: carry wide/deep paid-query optimization as an explicit performance follow-up rather than expanding this origin-correctness task into an unbounded tuning campaign — finite supported and failed combinations are now measured, and later integrated economics must retain them — if wrong, later consumers may require a same-guarantee batch reader before practical deployment; neither P64 affordability nor universal retained-lifetime progress is approved.

## 43. core-closeout-resource-plan-20260915:5

Ruling: include one existing exact-Record paid typed consumer control in the final integrated native journey, explicitly separate from mounted/path/Lens selection — live mounted reads at822830gas should not be mistaken for the irreducible cost of every contract data read, nor an older122495gas Note receipt relabelled final-source evidence — costs one small final-fixture control and extra setup disclosure, not a new architecture/benchmark lane. Its narrower guarantees are labelled; no promise of equivalent-workload savings.

## 44. core-closeout-resource-plan-20260915:19

Ruling: preserve the current uint32 public count ABI and add fail-closed full-word checking — closes a concrete truncation bug without an unreviewed width redesign — a production width change still needs all raw decoders/ABIs reviewed; this prototype cannot claim unlimited count/revision capacity.

## 45. core-closeout-resource-plan-20260915:21

Ruling: first enforce final whole-operation accounting, not an irreducible-floor claim — receipt totals plus bounded attribution expose practical cost without a profiler campaign — some internal gas remains unallocated or estimated and must be labelled.

## 46. core-closeout-resource-plan-20260915:23

Ruling: keep tracing to ordinary transactions with wire/time/node bounds and no opcode fallback — prevents another runaway Anvil/disk episode — maximal guards/query/replay have receipt/state evidence without detailed call attribution.

## 47. core-closeout-resource-plan-20260915:25

Ruling: actual small descriptor-backed user operation may span transactions and must count them all — the existing capability should be measured honestly rather than made artificially atomic for the benchmark — atomicity/wallet-prompt limits may remain a disclosed integration finding.

## 48. core-closeout-resource-plan-20260915:27

Ruling: Base's local-receipt-plus-live-oracle sum is a cross-venue model, and Era remains unmeasured until its native execution/fee profile runs — avoids false precision from incompatible gas units — no public-deployment or general Era-readiness claim is earned by this pass.

## 49. core-closeout-resource-plan-20260915:35

Ruling: after the full shifted-count bound proves the complete metadata word below the32-bit occurrence ceiling, an unchecked increment is permitted with its arithmetic proof documented — the new stronger check guarantees a result below2^112 and replaces the generic uint256 overflow case — costs dependence on retaining this guard/packing relationship; MAX/high-bit tests and review must verify it. Worker may compare the minimal checked and proven-unchecked forms once before reporting a size deficit, not run a byte-golf sequence or weaken any bound.

## 50. core-closeout-resource-plan-20260915:39

Ruling: extend this task with one coherent native/signed/guarded/import preparation extraction into existing fixed PublicationSupport — the correct minimal guard cannot deploy and later approved features also need room — costs delegate/codec/read overhead and a larger scoped caller/rollback/upgrade review; no core state ownership, legacy behavior or limit is waived. Static preparation output is bounded544bytes, current guard bytes stay Ledger-owned, and the outer helper ceiling12M is not a caller reserve or additive gas promise. Canonical `Measured fit extension` and task-1-fit-extension.md bind the resumed worker; if this boundary still fails, report measured deficit before another extraction.

## 51. core-closeout-resource-plan-20260915:43

Ruling: early admission preparation rejects0/>64actions using E_BOUNDS(0) before expensive profile/hash/signature loops; preserve realm/code/deadline checks and in-bound read-set hash-before-stale precedence — finite preparation cannot intentionally run unbounded candidate loops — costs a different error winner for multiply-invalid oversized/signature candidates. Public oversized-candidate profile hashing is unchanged, no accepted publication changes and no general ingress decoder is introduced.

## 52. core-closeout-resource-plan-20260915:59

Ruling: final ordinary Files/native-action measurements use the existing TagStanceIndex composition with its inherited full generic, carrier, live and stance obligations, not compact-environment's default older index — final joint-profile economics would otherwise silently omit the newer required validation/manifest work — cost if wrong is a small fixture/manifest/reader-wiring correction or more setup overhead, not changed kernel semantics or a new architecture. Reuse createTagEnvironment as an exact profile/setup aid and wire its real selected index/readers into the measured SDK; do not leave old manifest aliases pointing at the detached initial index. Four-scalar custom Record stress may use its separately declared ProfiledIndexModule configuration, explicitly labelled as such, because TagStanceIndex's existing immutable field declaration selects Content fields, not arbitrary new four-scalar Types. This ruling does not authorize new field/index behavior or merging distinct configurations into a false matched price.

## 53. core-closeout-sdk-plan-20260915:5

Ruling: fix tagCoverage from actual requested tag assessments, not query match — a positive OR match does not prove every join known — costs a small qualified-result correction. Preserve positive match semantics.

## 54. core-closeout-sdk-plan-20260915:7

Ruling: explicit PRESENT/NOT_PRESENT/UNKNOWN/NOT_APPLICABLE tag assessment plus nullable boolean, and strict existing consumers — makes unavailable harder to mistake for absence without rewriting Result APIs — costs an internal prototype shape extension and narrow fixture updates. Nullable boolean alone is insufficient. Current consumers already guard evaluation; do not claim an observed false-absence bug.

## 55. core-closeout-sdk-plan-20260915:9

Ruling: preserve current fallback valid AND exclusion under a proven false predicate — different diagnostic retention from joined matcher is not inherently incorrect — document/test the distinction rather than add UI behavior under an audit pretext.

## 56. core-closeout-sdk-plan-20260915:30

Ruling: permit explicit `tagCoverageScope:'PAGE'` on successful and unavailable joined-page responses — page-local assessment should not masquerade as an owned whole-query certificate, and app cumulative PARTIAL is preserved — costs one additive prototype result field and consistent fixture updates; no broad coverage API redesign.

## 57. core-closeout-sdk-plan-20260915:52

Ruling: permit export of the existing guarded protocol factory solely as the existing createCompactEngine fixture-injection seam for1×1/8×4/64×4 authorization/preflight measurements — public Files recipes generate at most two positions, while four-coordinate read sets are already supported by the protocol — costs one additive prototype export and a clearly labelled lower-level measurement; it does not establish a Files-generated maximum or a paid joint-publication fit.

## 58. core-closeout-sdk-plan-20260915:54

Ruling: explicitly disable cache in legacy mocks that intentionally mutate state under an unchanged block hash while preserving their original semantic controls — that fixture violates exact-block immutability and cannot model a real cache-safe chain — costs a disclosed uncached legacy test mode; separate real-block/hash-transition cache controls must carry the new safety evidence, never merely remove the failing test.

## 59. core-closeout-sdk-plan-20260915:70

Ruling: refine matched-transport equality to strict per-operation non-receipt method counts, retaining separate actual receipt polling and unnormalized total traffic — refreshed fix-source eight fixtures succeeded but aggregate equality differed286vs285 and discarded detailed phase/method evidence before its assertion; receipt polling is scheduling-dependent — cost if wrong is hiding a read-work regression, so only observed eth_getTransactionReceipt variation may be excluded, all other counts/payload/gas equality remain strict, failed transcript is retained and one committed-source refresh must identify the actual differing method. No semantics or broad test expansion.

## 60. core-closeout-sdk-plan-20260915:80

Ruling: retain the roots0–15 LAYOUT_ID family for actual existing-proxy compatibility while separately declaring/pinning the additive physical read-set profile — existing proxy upgrade gate fixes the old root-family ID, and roots0–15 truly remain unchanged — costs separate root-layout versus read-set-encoding support checks and an explicit SDK/archive inventory; if implemented ambiguously it could falsely certify raw root15 absence. Therefore actual implementation/codehash/profile gates must distinguish encodings, failed new probes cannot fall back to old, and new-profile root15 zero is not absence. This is the scoped experiment's compatibility mechanism, not permission for arbitrary storage upgrades or permanent profile adoption.

## 61. core-closeout-sdk-plan-20260915:100

Ruling: include the one browser/app.mjs transport edit that retains structured rpcError on the existing thrown Error — the current browser discarded code/data, making a strict positively-classified legacy EVM revert indistinguishable from provider failure and breaking the old demo's current SDK pin — cost if wrong is a transport error-shape regression, bounded by focused adapter controls and scoped re-review. No UI behavior, new static imports, server restart, owner deployment or stored-state change; never replace this distinction with error-message matching.

## 62. core-closeout-tags-plan-20260915:24

Ruling: after new inherited TagStanceReader measured27,496runtime (2,920over24,576) with5/5 focused behavior controls, allow one new-only composition into separately predeployed fixed TagStanceLens (inherited history/origin-prefix inventory) and TagStanceReader (profile/mode/stance joins/paging) — mirrors existing read-only Lens/page boundaries without changing predecessor rules/index/Core — costs an extra deployment, external-call/returndata work and exact helper/configuration pins, plus possible initcode pressure. Preserve caller-bound cursor, UNKNOWN/refusal, domain and whole-consumer measurements. Retain failed source/artifact/log; actual constructor arguments count; no embedded creation or further split hiding an ordinary-size failure. This is a reversible packaging experiment, not permanent API adoption.

## 63. core-closeout-tags-plan-20260915:26

Ruling: include the third one-keyword virtual seam, `FilesLiveNamesIndex._extensionEntry`, alongside the previously named fold/manifest seams — the new required inverse family must have an explicit discoverable manifest entry, and the inherited implementation is unchanged — costs the same disclosed compiler-metadata/exact-Type churn in this fresh-genesis fixture; no additional algorithm/extraction or old identity relabelling. This was made explicit at handoff before independent review.

## 64. core-closeout-tags-plan-20260915:28

Ruling: allow the two narrow virtual seams required by the planned tag extension (`FilesCarrierIndex._foldEffect` and `LiveFilesIndex._manifestExtension`), with fresh-genesis, newly registered exact rule/Type identities and complete new source/artifact pins — they expose the inherited fold/manifest without copying a second algorithm; Solidity metadata changes mean behavior-equivalent builds are still different exact code identities — costs losing byte-identical earlier Type IDs in the new fixture and requiring explicit old/new profile handling in a production migration. Earlier registered Types/Records/evidence remain unchanged and must never be relabelled. This authorizes no semantic rule change, identity-preserving migration claim, owner-demo redeploy or old-source receipt reuse as final-source evidence. Native-proof and final cost tasks consume the new exact profile. Parent confirms this is a reversible experiment ruling, not a permanent protocol/owner decision.

## 65. core-closeout-tags-plan-20260915:30

Ruling: execute shared-token candidate B first, not a second per-pair-record architecture arm — retained coordinates already commit the statement and B tests the missing inverse/retraction capability with less duplicated data — if wrong, a bounded experiment is reworked and its measured comparison remains; this does not freeze B or waive independently referenceable statements.

## 66. core-closeout-tags-plan-20260915:32

Ruling: new-purpose generic UNBIND reduces to silence alongside explicit SILENT BIND, while every legacy purpose is unchanged — the generic Core operation is public and the experimental profile must define its meaning — if wrong, the disposable purpose/reader changes; it does not change default user removal behavior or rewrite historical masks.

## 67. core-closeout-tags-plan-20260915:34

Ruling: new tag dependencies must precede every BIND, even one overwritten in the same publication — later developer rules may consume indexed prefixes, so final-head-only validation is insufficient — if wrong, some otherwise batchable new-tag recipes need reordered leaves; existing Name-after-BIND remains valid.

## 68. core-closeout-tags-plan-20260915:36

Ruling: this packet promises Concept-keyed search within a pinned closed Lens, not a universal all-author inventory — avoids silently adding another mandatory write mirror and matches reviewed Lens coverage — if a product later requires all-author keyed discovery, its separate inventory/coverage/cost needs an explicit design, not a claim this fixture already provides it.

## 69. core-closeout-types-plan-20260915:7

Ruling: optional presence applies to non-reference fields in this first finite descriptor; leading REF fields remain required and optional-REF descriptors must refuse — existing fixed leading32-byte checked references cannot insert presence bytes or point to absent zero without changing Ledger validation/layout — cost if wrong is a later explicit nullable-reference profile, not a silent claim that all field kinds already support null. This experiment does not adopt a permanent expressiveness limit. Parent supplied the boundary to worker before descriptor implementation and updates canonical brief/plan for review.

## 70. core-closeout-types-plan-20260915:9

Ruling: interpret "up to16 fields" as0..16, allowing a described unit/marker Type only with exactly empty body while retaining nonempty semantic description and authorized declaration — existing zero-reference/empty-body Records need no invented dummy field, and no recursive/parser feature is introduced — cost if wrong is one additional finite boundary requiring decoder parity, not new authority. Parent caught the draft WIRE1..16 restriction before final literal vectors and requested valid-empty/nonempty-refusal controls; worker must flag a concrete conflict rather than silently narrow the brief.

## 71. Final combined-review disposition — September16

Ruling: close the authorized bounded prototype pass at c9cc15b without a further source-fix wave — the independent assembled review identifies no Critical/Important defect and verifies current mounted results, while the six carried Minor issues concern future harness assertions or honestly limited historical evidence — cost if wrong is a weaker future regression guard, so all six remain in the published review/build handoff; missing historical bytes, warning debt and unsupported native/public/scale profiles are not erased. The historical described-Type archive adapter must keep rejecting the final clean wrapper until a separately reviewed explicit adapter/profile and source-off journey support it; this is a production packaging gate, not permission to relax hash checks or claim final-build portability. Keep prototype code/workspace in place, publish shared documents on main, and preserve all original evidence. Production repositories, public deployment, launch limitations and permanence remain owner-gated.
