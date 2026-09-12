# RecordBody.slice MCOPY — bounded paired results

Status: final source-pinned receipts retained; independent evidence review and root reproduction remain separate gates. Disposable same-semantics experiment, not protocol adoption.

Control Solidity24d74076d38d7b7758fc1eb222c8d7183da85c02. Product source67576fa07dbee2ad0ef98a2fab45cc4563f84272; complete runner/support30296a0313e1cfe5dbb98d903435ed7565debbbb frozen before both final arms. Only RecordBody.slice changed (including internal test visibility); TypeGroupParser and StateKernel copy loops, storage layouts and logical ABIs remain unchanged.

Complete41-byte Files create including149,369 staging: **5,257,364 →5,064,132 gas (−193,232;3.68%)**. It remains above5M. Complete edit including149,381 staging:2,758,979 →2,667,640. These are actual full operations, not extrapolations from the helper-only probe.

## Receipt comparison

All42 named operations per arm; complete transaction cost includes calldata and authorization. Signed consent differs with the independently authenticated execution graph, so small intrinsic-calldata differences remain visible. Withdrawals are direct-author Core calls, not a new Files-router API.

| Operation | Control gas | Candidate gas | Candidate minus control |
|---|---:|---:|---:|
| tag-first | 2,096,170 | 2,042,304 | -53,866 |
| tag-steady | 1,868,793 | 1,814,915 | -53,878 |
| binding-rebind | 1,623,022 | 1,559,525 | -63,497 |
| create-chunk-0 | 149,369 | 149,369 | 0 |
| create-7-leaf-41B | 5,107,995 | 4,914,763 | -193,232 |
| edit-chunk-0 | 149,381 | 149,381 | 0 |
| edit-3-leaf-41B | 2,609,598 | 2,518,259 | -91,339 |
| create-7-leaf-empty-file | 5,116,419 | 4,921,772 | -194,647 |
| partial-direct-author | 918,569 | 900,783 | -17,786 |
| mixed-ACTIVE-fresh | 1,396,057 | 1,342,179 | -53,878 |
| exact-ACTIVE-retry | 632,888 | 579,022 | -53,866 |
| old-signature-rejected | 356,066 | 356,078 | 12 |
| multiple-Type-groups | 2,228,774 | 2,169,973 | -58,801 |
| existing-Types-fresh-envelope | 827,417 | 788,539 | -38,878 |
| maximum-Envelope-one-selected-existing-Record | 1,283,662 | 1,244,784 | -38,878 |
| shared-scalar-Type-setup | 1,166,842 | 1,144,926 | -21,916 |
| 64-unique-ascending-RecordIds | 16,264,936 | 16,264,936 | 0 |
| 64-unique-reverse-RecordIds | 16,264,936 | 16,264,936 | 0 |
| 64-duplicate-selected | 10,351,537 | 10,325,745 | -25,792 |
| metadata-bytes-Type-setup | 1,185,297 | 1,163,110 | -22,187 |
| fresh-Record-tiny | 863,715 | 863,301 | -414 |
| existing-Record-new-occurrence-tiny | 598,278 | 597,864 | -414 |
| fresh-Record-near8192 | 4,864,176 | 2,546,769 | -2,317,407 |
| existing-Record-new-occurrence-near8192 | 3,064,342 | 746,935 | -2,317,407 |
| fresh-Record-zero-near8192 | 4,782,984 | 2,465,589 | -2,317,395 |
| metadata-reference-Types-setup | 2,394,791 | 2,268,776 | -126,015 |
| reference-existing-tiny | 1,043,073 | 1,034,180 | -8,893 |
| reference-existing-near8192 | 929,376 | 920,471 | -8,905 |
| reference-repeated-near8192 | 1,095,523 | 1,077,737 | -17,786 |
| reference-valid-Object | 1,003,447 | 994,542 | -8,905 |
| same-carriage-Record-reference | 1,256,855 | 1,247,253 | -9,602 |
| large-supported-Type-setup | 13,926,677 | 12,766,937 | -1,159,740 |
| Type-dependency-small | 1,267,837 | 1,228,393 | -39,444 |
| Type-dependency-large | 1,284,925 | 1,245,469 | -39,456 |
| same-carriage-Type-dependency | 1,965,474 | 1,904,680 | -60,794 |
| withdraw-tiny | 1,111,433 | 1,101,575 | -9,858 |
| withdraw-near8192 | 3,325,439 | 998,576 | -2,326,863 |
| withdraw-current-Binding | 1,196,617 | 1,141,450 | -55,167 |
| late-reference | 1,304,413 | 1,242,738 | -61,675 |
| late-CAS | 1,584,688 | 1,524,699 | -59,989 |
| cache-then-reference | 9,837,228 | 8,578,459 | -1,258,769 |
| cache-then-CAS | 9,827,852 | 8,570,778 | -1,257,074 |

The two64-unique workloads remain actual ordinary transaction-cap refusals, each16,264,936 gas.64 duplicates is an accepted distinct workload, not64 new immutable bodies. Late-reference/CAS failures were reached, replayed at their receipt basis, and rolled back Core/author nonce, postings and all helper children. Legal64-field24,960-byte caches still exceed24,575 code payload capacity; aggregate helper-output limitations remain unsupported. MCOPY does not solve those cache/transport/deposition constraints.

## Paid read and actual Files work

All9 read receipts have identical cost and logical return bytes after authenticating the one execution-set return field where applicable. **Paid scalar/repeated receipt-library gas remains UNMEASURED**; these actual Core reads do not substitute for it.

| Read | Control gas | Candidate gas |
|---|---:|---:|
| Envelope-create (getEnvelope) | 184,340 | 184,340 |
| Occurrence-create (getOccurrence) | 216,934 | 216,934 |
| Record-create (getRecord) | 178,256 | 178,256 |
| Type-Object (getTypeSchema) | 212,350 | 212,350 |
| Binding-create (getBindingHead) | 175,658 | 175,658 |
| Record-current-eight (getRecordsCurrent) | 293,455 | 293,455 |
| Envelope-maximum (getEnvelope) | 187,593 | 187,593 |
| Record-tiny (getRecord) | 178,095 | 178,095 |
| Record-near8192 (getRecord) | 194,042 | 194,042 |

Actual qualified directory traversal:114 RPC requests and2 cache hits each; control425,421 response bytes, candidate425,579 (+158 from the79-byte larger helper represented as hex). Both return COMPLETE with qualified pages. Measured wall times are retained but are not a latency performance claim.

## Runtime and complete initcode bounds

Fixed solc0.8.30/optimizer200/viaIR/Cancun, runtime24,576/initcode49,152/transaction16,777,216/block33,554,432 caps. All authenticated deployed modules below; complete initcodes include constructors (proxy/Admin child initcodes are source-backed openings of the paid atomic bootstrap).

| Module | Control runtime bytes | Candidate runtime bytes | Complete candidate initcode bytes |
|---|---:|---:|---:|
| FixtureDeployment | 9402 | 9402 | 9469 |
| PreparationHelper | 18953 | 19032 | 19058 |
| UpgradeAdmissionLibrary | 22392 | 22392 | 22424 |
| PointReadLibrary | 15092 | 15092 | 15122 |
| UpgradeQueryReadLibrary | 20558 | 20558 | 20588 |
| UpgradeableReadFixtureCore | 21420 | 21420 | 22377 |
| UpgradeableFixtureCarrier | 7637 | 7637 | 8273 |
| UpgradeableReadFixtureCoreU2 | 22148 | 22148 | 23105 |
| UpgradeableFixtureCarrierU2 | 7999 | 7999 | 8635 |
| core | 761 | 761 | 6207 |
| coreAdmin | 879 | 879 | 1120 |
| carrier | 761 | 761 | 3007 |
| carrierAdmin | 879 | 879 | 1120 |
| UpgradeableFixtureCoreU3 | 24141 | 24141 | 25112 |
| UpgradeableFixtureCarrierU3 | 10023 | 10023 | 10659 |
| FilesRouterV2 | 13289 | 13289 | 14840 |
| UpgradeStaticConsumer (test consumer) | 420 | 420 | 446 |

PreparationHelper grows79 bytes:18,953 →19,032; its actual deployment costs4,152,019 →4,169,067 (+17,048). U3 stays24,141 (435-byte margin), admission22,392. There is no headroom recovery claim. Other derived codehashes/constructor immutables or metadata are separately pinned; they are not silently treated as the old graph. The coherent old-helper expected profile refuses the new deployed runtime after RPC. The new source-backed profile qualifies. Consumer executable and constructor prefixes are exact after parsing trailing CBOR metadata extents; metadata differences are retained. Existing error-union/Core-only binding-generation qualification remains.

## All setup/deployment costs

Transactions0–79 are the retained common environment setup, including fixture seed publications and old/new router deployment. They are not charged to steady Files create. Transaction92 is the separately paid read-consumer deployment. Complete signed transactions and receipts for every seed publication remain in the bounded pair.

| Setup bucket | Control gas | Candidate gas |
|---|---:|---:|
| all environment setup (transactions0–79) | 134,560,650 | 130,766,930 |
| fixture seed publications (10–69, excluding chunk staging) | 84,094,785 | 80,283,993 |
| fixture byte staging | 875,200 | 875,212 |
| transaction0: FixtureDeployment | 2,084,328 | 2,084,328 |
| transaction1: PreparationHelper | 4,152,019 | 4,169,067 |
| transaction2: UpgradeAdmissionLibrary | 4,895,421 | 4,895,409 |
| transaction3: PointReadLibrary | 3,317,242 | 3,317,242 |
| transaction4: UpgradeQueryReadLibrary | 4,498,741 | 4,498,741 |
| transaction5: UpgradeableReadFixtureCore | 4,724,843 | 4,724,855 |
| transaction6: UpgradeableFixtureCarrier | 1,737,106 | 1,737,118 |
| transaction7: UpgradeableReadFixtureCoreU2 | 4,882,362 | 4,882,362 |
| transaction8: UpgradeableFixtureCarrierU2 | 1,815,397 | 1,815,397 |
| transaction9: atomic pair bootstrap | 2,337,485 | 2,337,485 |
| transaction70: router deployment | 3,423,024 | 3,423,024 |
| transaction71: fixture principal claim | 45,197 | 45,197 |
| transaction72: fixture principal claim | 45,221 | 45,221 |
| transaction73: AuthorityUpgrade.sol/UpgradeableFixtureCoreU3 deployment | 5,312,869 | 5,312,869 |
| transaction74: AuthorityUpgrade.sol/UpgradeableFixtureCarrierU3 deployment | 2,252,963 | 2,252,963 |
| transaction75: authority upgrade | 587,187 | 587,187 |
| transaction76: router v2 deployment | 3,322,232 | 3,322,232 |
| transaction77: fixture principal claim | 50,448 | 50,448 |
| transaction78: fixture principal claim | 50,472 | 50,472 |
| transaction79: external public helper CREATE | 56,108 | 56,108 |
| transaction92: paid read consumer | 144,233 | 144,233 |

Visible regressions: helper deployment+17,048; U1 Core and Carrier deployment+12 each; one fixture-staging receipt+12; old-signature rejection+12 (its calldata changes647→648 nonzero bytes, intrinsic36,588→36,600). No positive delta occurs among successful named recurring operations or paid reads. No opcode-level attribution or gas estimate is substituted for these receipts.

## Evidence, tests and bounded cleanup

Final pair: evidence/body-copy-control.json.gz and evidence/body-copy-candidate.json.gz, each with its exclusive manifest. Canonical JSON sizes29,104,092/29,478,082; gzip2,801,501/2,904,016, below32MiB/8MiB limits, no timestamps/filename fields in gzip headers.132 signed transactions and42 named operations per arm, full source/compiler/runtime pins, chronological actual helper/code/slice inventory and complete logical kernel inventories retained. Only independently authenticated revision-specific Core authority and execution-set identities are normalized. A helper hash is not a substitute for Core authority.

The actual old-helper RED and candidate microprobe, plus102 public-helper differential cases, are separate pre-freeze test evidence; see [[evidence/body-copy-tdd]]. The67576fa unpaired control is retained as evidence/body-copy-pre-withdrawal-control.json.gz and is explicitly preliminary, never a final pair.

Final comparison 13/13 and helper offline 2/2 pass. Full Core 250/250 and foundation 38/38 pass, including InitializationOutline using both test-only remappings; strict TS/exact fmt pass. Explicit serial SDK/reader/Chromium gate: 249 passes, one existing large-Type skip, zero failures (281.879 seconds). Including the 57 offline checks, total Node/offline coverage is 306 passes plus one skip. Historical evidence remains unchanged: the source-coupled shared-block-control layout check runs from the frozen 24d7407 control archive (3/3), not against a changed current RecordBody hash. Other 39 historical receipt checks pass.

Final control Anvil 21964 and candidate 22257 exited 0 and removed their own caches; both runner build directories were removed. The two identified failed rehearsal/freeze build directories were also removed after process exit; they held regenerable task artifacts only. Three pre-existing demos, the frozen control archive and the candidate canonical build are preserved. No tracing, limit overrides, new public networks, funds, migration or production deployment. Sole heavy ownership was explicitly released after confirming the Node gate exit and only the three preserved demo nodes remained. Root owns independent final review/reproduction/publication; branch is not pushed by this worker.
