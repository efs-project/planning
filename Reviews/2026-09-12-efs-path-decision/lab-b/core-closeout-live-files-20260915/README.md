# LiveFiles Task 1 — bounded local evidence

Status: implementation complete for independent review; not production/provider-universal acceptance. Base `7e2b5bfda859ca8994c95c5102a920d871d59f6c`. Final source is the commit containing this packet; its exact hashes are below and in `paid-final.json.gz`. Earlier packets are explicitly intermediate, never relabelled final-source evidence.

## Result and finite profile

An ordinary retained descriptor, live-root and live-child compose through mandatory checked references above the unchanged kernel. The actual page reader, explicit mounted reader/paid consumer and SDK recognize exact live Types. No generic Core noun, provider call during publication/replay, implicit EFS provider-update write, owner-demo deployment or new browser static import was added.

`quote-u128-bool-v1` supports this independently selected **direct** provider runtime only: `0xc449a341cc268a12a496b3aa7806c7c63410b2de54d44b50037e9ce1cf696da5`. Selection comes from the reviewed `LiveQuoteProvider` artifact, not the provider's getters or observed output. The descriptor rule and adapter bind this hash immutably. A different reviewed runtime requires its own explicit rule/profile binding. This is not a Core/global whitelist, generic proxy detector, arbitrary existing-contract adapter or proof of mutable implementation/dependency history. A callable mutable delegate-proxy control is rejected by the selected profile.

The exact descriptor is 384 bytes, twelve canonical ABI words:

| Word | Meaning / admitted value |
|---|---|
| 0 | version = 1 |
| 1 | current chain ID; fixture 31337 |
| 2 | venue = keccak256(`evm/cancun/staticcall/1`) |
| 3 | exact provider address, canonical address padding |
| 4 | selected expected provider runtime hash above |
| 5 | bytes4 selector = first four bytes of keccak256(`quote(bytes32)`); zero right padding |
| 6 | one bytes32 key; every key admitted, fixture 7 |
| 7 | exact output Type `0xf9f2da264a1b672648a8463e5daec67cb1fb446a852ff8e5805579907eb63b5e` |
| 8 | representation = 1, canonical `(uint128,bool)` in 64 bytes |
| 9 | provider STATICCALL gas = 50,000 |
| 10 | maximum and exact success return = 64 bytes |
| 11 | declared adapter caller, canonical address padding |

Root body is `[descriptor, File]` / 64 bytes / one exact descriptor checked reference. Child is `[parent, descriptor, File]` / 96 bytes / wildcard Record parent plus exact descriptor reference; the mandatory rule additionally enforces the finite exact parent matrix and same-File identity. File must exist. Descriptor and parent must precede the child. Neither an arbitrary Record reference nor a shape label grants ancestry.

| Child family | Inline root/child parents | Carrier root/child parents | Live root/child parents |
|---|---|---|---|
| Existing inline child | yes | no | no |
| Existing carrier child | yes | yes | no |
| New live child | yes | yes | yes |

The five configured new-child parent Type IDs are immutable code constants, not constructor-initialized mutable storage; incoming exact live-child Type supplies the sixth edge. Solidity readers and SDK implement the same matrix. Generic reference postings append each retained edge once, including REUSE/replay. Existing rule source files, kernel `src/`, roots0–15, authority, wallet/signature, readset and index storage ownership remain unchanged against BASE.

Observation status: 0 invalid descriptor, 1 shape-only success, 2 unsupported context, 3 descriptor caller mismatch, 4 code drift/unselected runtime, 5 provider revert/resource/caller-sensitive refusal, 6 oversize, 7 malformed. Fixed-size output scratch space precedes STATICCALL; returndata length is inspected before any dynamic result allocation. A valid zero and false produce status1 plus 64 bytes. Empty is malformed for this representation, not empty-file success. Public descriptor/code identity is not plaintext privacy.

`uint128,bool` observation is **SHAPE_ONLY_NOT_EFS_ADMISSION**. The output Type's real mandatory predicate additionally requires value<=100; value150 is observed successfully but an actual Ledger publication reverts. The adapter never invokes an `IAcceptor` pretending to be Ledger. The independently stored snapshot88/false also passes actual output-Type admission before storage in a new File.

## Coherence, selection and snapshot evidence

- At admission29, SDK block76/hash `0x8841de3fcd4153c0ee0b093ae07763b4fbed21d18cd33bef2fba512b479defc1` returns42/true. A provider-only update produces block77/hash `0xe9950e69af56213572eca229b046614774d50708010595dbf94406ad415e1ac3` returning75/true. The old block-hash read still returns42. Ledger counts `[29,14,9,28]` and the File HEAD tuple are unchanged.
- Paid mounted read emits75/true at block78; matched stored read emits42/true at block79. One transaction updates then reads87/false at block80, separate from end-of-block RPC observations. Raw receipts/events and transaction inputs are retained.
- A continued native query selects EFS facts at origin admission39/block102, then sees provider99/false at block104; paid continuation emits it at block105. Origin A is **not** a historical provider-storage snapshot. The result separately returns selectionOrigin and observation block/chain/caller.
- Revert,4096-byte success return,noncanonical bool,gas exhaustion,empty return,uint128 overflow and caller-sensitive refusal never return successful file bytes or reveal the lower-priority File. Unsupported chain/caller recipes and a callable unselected proxy produce paid reverted admissions. Code drift is a Forge negative control, not an Anvil code-mutation claim.
- The same folder includes stored, live, unavailable external and opaque encrypted Files. Onchain returns external unsupported or encrypted opaque; SDK returns unavailable, not empty. HTTP/IPFS cannot be fetched by the onchain reader; no plaintext shape, secrecy of metadata or key-management system is inferred.
- Descriptor by-Type membership is COMPLETE; live-value filtering is `UNKNOWN_NOT_INDEXED`. A point observation is not a complete live-value filter/change feed. Provider-only writes do not advance EFS admissions.
- Snapshot publication stores exact64 observed bytes in an independent stored-root/new File, and 2,840 bytes of digest-prefixed recipe/provenance metadata. It records source File/revision/descriptor, exact call recipe, block hash/number, caller, shape-only qualification and `RPC_OBSERVED_NOT_SOURCE_CHAIN_PROOF`. Its real output admission is separate. After the source child process closes, offline verification recomputes Record IDs, compares saved bytes, and rehashes the provenance body. This proves retained bytes/recipe, not source-chain state proof or provider executability from an exported descriptor. SDK edit/restore from a live family explicitly requires a new snapshot File; no reverse ancestry is invented.

## Fit sequence and trust boundary

Normal runtime cap24,576; full initcode cap49,152. Solc0.8.30, optimizer200, viaIR, Cancun. No unlimited-code flag, cap increase, factory, setter, delegatecall execution helper, new storage owner or additional extraction.

| Candidate / final component | Runtime bytes | Actual initcode bytes | Evidence |
|---|---:|---:|---|
| Original inline LiveFilesIndex | 25,050 | 47,074 (800 args) | compile: runtime474 over |
| Index with nested fixed helper | 21,205 | 50,584 (800 args) | compile: initcode1,432 over |
| Final external-helper index | 20,981 | 43,928 (864 args) | ordinary paid deployment PASS |
| Final stateless Name/Directory helper | 5,417 | 7,297 (160 args) | ordinary paid deployment PASS |
| Adapter, including nested descriptor-rule CREATE | 2,618 | 4,726 (96 args) | paid deployment PASS |
| Nested descriptor rule | 1,238 | 1,542 (96 args) | paid within adapter receipt |
| Live child rule | 1,919 | 2,379 (160 args) | paid deployment PASS |
| Live page / mounted / paid consumers | 19,012 / 5,986 / 2,965 | 19,731 / 6,889 / 2,991 | paid deployments PASS |
| Direct provider / output predicate | 764 / 334 | 824 / 360 | paid deployments PASS |
| Ledger / baseline ProfiledFilesIndex | 24,538 / 24,491 | 39,310 / 44,737 | unchanged source; ordinarily deployed |

The first two artifacts and source snapshots remain in this directory. Neither was attempted on ordinary Anvil; size controls are not labelled a Node rejection. Controller approved separately deploying the **same** coherent complete final Name+Directory unit after the nested-initcode deficit was surfaced. Final runtime later fell another224 bytes when an unnecessary live fold override was removed to restore the old rule source exactly; the corrected finite-provider pin increases adapter/rule setup, not the kernel.

The helper explicitly binds Ledger, Name Type/hash and Directory Type/hash, checks Names then Directories at the publication's terminal admission, and is stateless. The index constructor checks supplied address code/hash and all bound configuration; immutable helper address/hash affect actual index runtime and execution pins. Its logical manifest does not include a per-deployment helper address, so independent replay with a different honest helper can match semantics. Wrong/missing helper/hash/Ledger and helper-code-drift controls reject and roll back Ledger/index/ScopeState; historical invalid binding cannot be repaired by a later Name. The helper STATICCALL forwards at most existing `IndexWork.MAXIMUM`9,800,000 under the unchanged outer shared budget and transports only32 bytes.

Getter consistency or a caller-supplied hash alone is **not** honesty. The selected helper is authenticated by reviewed source, exact compiled creation/runtime templates, constructor args and the actual signed creation transaction. `paid-final.json.gz` contains artifact bytes/metadata/hashes, deployed runtime code, constructor args, exact signed transactions/receipts and dependency closure. Index nested dependencies retain replayDecoder4359/4744, ScopeState1527/1718 and fieldProfile1257/3350 runtime/initcode, constructor inputs and code pins. ScopeState writer remains the index; no canonical facts move into the helper.

## Actual gas and total context costs

All are paid local Cancun receipts, not Forge test gas estimates. Every transaction uses15,000,000 gasLimit (hard upper16,777,216), normal30M block gas. Gas depends on this fixture's cold storage/content/placements and is not a universal quote-provider price.

| Operation | Gas used |
|---|---:|
| Provider-only update | 49,401 |
| Provider update + duplicate typed EFS publication | 773,566 |
| Provider update + same-transaction mounted live read | 828,463 |
| Matched paid mounted live / stored reads | 822,830 / 806,038 |
| Paid retained-origin/current-provider read | 965,577 |
| Live descriptor/File/root/child/reuse/HEAD/Name/mount registration | 6,359,762 |
| Provider + output/descriptor/root/child profile setup and registrations | 2,561,231 |
| Index / separate final helper deployment | 7,818,141 / 1,289,395 |
| Index + helper combined | 9,107,536 |
| Adapter deployment (includes nested rule) | 929,351 |
| Live page / mounted / paid consumer deployments | 4,163,881 / 1,371,263 / 694,041 |
| Snapshot stored-root / recipe retention | 766,215 / 2,756,963 |
| Snapshot records incl actual output admission | 4,279,551 |
| Complete snapshot incl new File/HEAD/Name/placement | 7,046,974 |
| Actual 8 checked refs / 8192-byte nonzero body | 6,780,421 |
| Actual255-byte Name with two binds + final Name publication | 1,749,696 |

Provider setup alone240,881; output-rule125,431; live-root177,915; live-child472,444. Setup totals overlap component rows; do not add them twice. Registration includes the explicit REUSE negative-duplication control, disclosed rather than hidden. The duplicate-store update uses90/false whereas the standalone update uses75/true; both are nonzero-to-nonzero fixture updates, but caller-storage warming and call graph differ. No universal percentage saving is inferred.

Whole fixture109 transactions (105 success,4 intentional reverts),115,983,193 total gas; all deployment transactions60,915,752. This includes baseline graph plus replacement graph, adversarial fixtures, maxima and diagnostic actions; it is not minimal production setup. Total2,218 RPC/wire/HTTP calls,1,185 eth_calls,1,187,902 request bytes,6,155,566 response bytes,zero fallbacks. Five bounded callTracer trees have41/43/47/42/44 calls for descriptor/root/child/reuse/mount and **zero provider calls**. No opcode/storage trace. These totals include context validation and diagnostics, not only content-fetch calls. Actual maximal existing bytes/ref envelopes and fixed64 return are measured; no claim every64-action batch fits the independent gas venue.

## Verification and retained failure ledger

All commands run from `lab-b` with the assigned existing Foundry artifact/cache paths and ethers package; no install. See task report for machine-specific paths. Commands retain output rather than hiding warnings.

```sh
forge test --match-path test/LiveFiles.t.sol --match-test '<focused test name>' -vv
forge test --match-contract '^(LiveFilesTest|FilesNamesTest|FilesDirectoryProfileTest|FilesCarrierProfileTest|FilesPageReaderTest|CoreIndexReplayFilesTest|FilesQueryOriginTest|FilesRetainedQueryTest|LabelTypeTest|DescribedTypeProfileTest)$' -vv
node --test browser/live-profile.test.mjs browser/compact-sdk.test.mjs browser/compact-content.test.mjs browser/readset-profile.test.mjs browser/compact-read-cache.test.mjs browser/compact-paths.test.mjs
node --test browser/readset-profile.test.mjs
forge test --match-path test/LiveFiles.t.sol -vv
EFS_LIVE_EVIDENCE=paid-final node script/measure-live-files.mjs
```

- Focused RED/GREEN: exact descriptor/composition; bounded zero/false/shape observation; page dispatch; SDK exact-family dispatcher; mounted consumer; duplicate stored control; missing external helper; immutable parent identity; selected provider/proxy identity. Log filenames retain these stages. `mounted-green-parent-pin-red.log` is materially RED: a storage parent-array gave two configurations the same codehash. Immutable parents fix it.
- `profile-first-fit.log` includes the initial nonvirtual-override compile error; `inline-deployability-red.log` records a failed runtime assertion. Its shell pipeline originally lacked pipefail; the assertion itself, not the shell exit code, is the evidence. `profile-helper-fit.log` retains the later initcode warning. `node-fit.log` was an artifact-path/dependency preparation failure, not ordinary deployment rejection.
- `paid-sdk-red.json.gz` is an actual ordinary graph deployment followed by SDK dispatch failure. `paid-sdk-green.json.gz` and `paid-full.json.gz` are successful **intermediate** source runs, before final provider binding and old-source restoration. They remain labelled as such. Earlier `paid-full` cost summary selected the first duplicate deployment label (baseline index/joined) and snapshot total omitted new File/placement; final runner selects the last deployment and reports records-only versus all-in totals. Do not use those older summary rows for final costs.
- `affected-covering.log`:189/189 across10 suites on the provider-pinned source **before** final redundant-fold removal; not misrepresented as final-source189. `live-final-green.log`:31/31 final-source tests, including inherited Directory/rollback controls and generic references/replay after restoration. Older unrelated suites were not repeatedly rerun.
- `affected-sdk.tap`:65 pass,2 failed fixture setup,1 skipped. The two failures were `ENOENT .../lab-b/out/TypeRegistry...` because this command omitted the declared FOUNDRY_OUT, not SDK behavior. `sdk-artifact-path-green.tap` reruns that file with correct artifact/Anvil environment:8 pass,0 fail,1 existing opt-in historical matrix skipped. The original failures are preserved. No skipped control is called passed.
- `live-contracts-green.log` is despite its filename27 pass/1 harness failure: a combined chain-ID/code-drift test restored `block.chainid` from an optimizer-re-evaluated variable. Bounded `code-drift-diagnostic.log` proves the adapter correctly returned unsupported-context. Isolated chain and code-drift tests then pass (`context-controls-green.log` and final suite); no adapter relaxation was made.
- Compiler warnings are retained: existing name shadowing/view suggestions and intentionally enormous Forge test contracts. Test harness deployment is not deployability evidence; final ordinary receipts are.
- Exact old-rule source review found a metadata-identity pitfall: making `_foldEffect` virtual in `FilesCarrierProfile.sol` changes compiled rule metadata/codehash despite unchanged old-rule logic. The live override only repeated a strict admitted-header check and generic refs already handle the edges. Removed it and restored that entire old file byte-for-byte against BASE. Final reader change is only its existing helper becoming public virtual; old acceptor source dependencies are untouched.

## Final reproducibility pins

`paid-final.json.gz` SHA256 `772ec10fa8245fca324577c6f3a64ceaaf3315857f3e7e598dee70f2b9493393`.

| Source | SHA256 |
|---|---|
| `test/LiveFilesProfile.sol` | `510928ccefb17414f2419b8b5f729d2cf327194ee8b2946cbb52c996aaf843fe` |
| `test/FilesFinalValidator.sol` | `17b9d1ff8e637146da348ac1ac6b6a38d9187a3ee94b8d622d85a23ce41c3f04` |
| `test/LiveFilesAdapter.sol` | `f19bf339aafdd8f3b8a28e43d94a8c1e9bd0a8ed109ef2e09e293437b380bf47` |
| `test/LiveFilesReader.sol` | `2d6f1cd4afa9bd0b8e6f929d41a45428576b5de733e82bfeb81b928c85420e8e` |
| `test/LiveFiles.t.sol` | `23660b778da2da59e6537d24c55fd63de79d94906cdc21159d4342ebccd2c930` |
| `browser/compact-sdk.mjs` | `308a541239acb3b804c40734011d8357fa2e8a5e729d791f76598c925901be16` |
| `script/measure-live-files.mjs` | `b6b99802c515697d4b847dcd76f7b00df161ebac5efde08e34158f397f3f3919` |

Full transitive source SHA/keccak, compiler settings, exact Type IDs, runtime code, artifact templates, constructor input arrays and signed receipt evidence live inside the final packet. Final index runtime hash `0x1346e4e867e934eba9d3560885e038ee241d9e8092ac929c1dde4616d3b46a3d`; final helper `0xc0cc8c5956fb8811de9c2e1ce64f967130284004dbc603d5030157e267d7162c`; adapter `0x67ab1fd0bd3f1d5b5f9427c2d1e68492012d8be29de39a0d7f4e8f42cdd2c7a8`. Values are deployment-specific immutables, not portable claims.

## Self-review, limits and cleanup

Self-review covered canonical descriptor padding, exact Type/ref identity, immutable required parameters, directed same-File ancestry, generic reference reuse, same-basis SDK transport, provider identity/caller/returndata caps, shape versus real admission, final-hook rollback/replay, historical origin versus current provider, unsupported/opaque selection, and snapshot provenance boundaries. Parent provides independent review; this is not a self-awarded external approval.

No universal provider feasibility, provider honesty/timeliness, old-state chain proof, proxy implementation history, cross-chain/HTTP execution, automatic live history, in-place cross-family conversion, production economics, or full64-action max-gas guarantee is established. The deterministic fixture provider is intentionally freely mutable and adversarial; production access policy is not provided. Application-owned manifests/runtime selection remain explicit trust inputs.

All owned disposable children closed in finally; final PID11620/loopback65387 is absent after completion. History256/cache512, bounded artifact/report data, no public RPC/transactions/install. Owner Anvil60599 remains running and UI60608 is untouched. Run directories retain small receipt/cache evidence; no broad filesystem cleanup was attempted. Unrelated untracked commit-message files are preserved. Source/build/disposable-chain ownership is released in the implementer handoff; canonical main writes, push and independent review remain with the parent.
