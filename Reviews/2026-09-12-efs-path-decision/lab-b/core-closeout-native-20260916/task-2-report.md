# Authority Task 2 — bounded native retained-state proof closeout

Date: 2026-09-16. Implementation complete for the qualified local profile; independent task review remains the next gate. No protocol adoption, public deployment, cross-chain consensus bridge, or general practical onchain native-retention claim.

## Outcome and prominent resource/provenance concerns

All four pieces execute: recent-header checkpoint, separate Solidity trie/semantic verifier and archive, independent JavaScript verifier/consumer, and the paid early/late/source-off journey. The final main run has 79 real signed transactions/receipts: 73 success and 6 expected reverts. Five regular witnesses were checkpointed, verified, retained by a third party and consumed onchain while the local chain was alive. Only then was its RPC stopped and all five independently verified and consumed offline.

Two material limitations must survive review and Resource2:

1. **Narrow affordability, not ceiling affordability.** Successful retention costs 11,617,114–13,382,546 gas for only 20,824–26,392 proof bytes, 94–105 nodes, 4–58 body bytes and 224–320 read-set bytes. The latest original-claim witness leaves 1,617,454 gas below the ordinary 15M cap. The single joint 8,192-byte body / 10,592-byte read-set experiment succeeds at the source but both verification-only and retention revert under the unchanged 15M cap. Its proof is only 39,094 bytes, far below the 262,144-byte safety ceiling. No general practical retention claim or affordable joint maximum follows.
2. **Exact retained mixed-cache artifacts, not clean-build identity.** Paid source is `86e10eee86bb4ce959c1c99b43d5591e67661825`, but source commit alone does not reproduce the paid artifacts with a clean default build. The new upstream import remapping is included in rebuilt native/rule artifacts; cached Ledger, PublicationSupport and ContractSignatureEvidenceStore artifacts retain empty metadata remappings and byte-identically match the prior wallet artifacts. A later forced layout inspection rebuilt Ledger with the remapping and changed its metadata/code identity. The exact paid artifacts, compiler settings and all source hashes remain retained; no receipt is relabelled. Resource2 must force a coherent clean build and use its actual new deployment, codehash and Type identities. Earlier proof runtime equivalence must be checked, not assumed.

The forced-layout Ledger runtime excluding its trailing compiler metadata matches the paid template; this limited comparison is not a deployed-runtime or execution-family equivalence proof. Its creation bytes also include helper metadata and are not byte-identical. Archive inspection creation bytes match. These precise comparisons are retained in `final-1/storage-layout.json`. Initial packaging correctly stopped at the stronger byte-exact Ledger assertion; the packaging rule was corrected to retain distinct inspection/paid settings and source joins, not to change the proof or its paid identity.

## Commits, files and evidence

Reviewed BASE: `a3ec1f011630ae901c6fd80d5c895be07cc7632a`.
Implementation and exploratory evidence: `86e10eee86bb4ce959c1c99b43d5591e67661825`.
Final evidence, report and ancillary instance/packaging scripts: the evidence commit enclosing this report. Those two ancillary scripts are SHA256-pinned by `final-1/manifest.json`; the paid runner remains pinned to the implementation commit.

New production-profile components are `src/RecentStateRootCheckpoint.sol`, `src/BoundedStateProof.sol`, `src/NativePublicationProof.sol`, `src/NativeClaimArchive.sol`, the MIT `src/vendor/optimism/` closure and `browser/native-proof.mjs`. `foundry.toml` adds the upstream import remapping; Ledger source is unchanged. Export/journey/fixture/instance/evidence scripts live under `script/native-*`, `script/measure-native-proof.mjs`, and `script/retain-native-evidence.mjs`. Focused tests are `test/NativeStateProof.t.sol`, `test/NativeSemantic.t.sol`, `test/NativeSemanticVector.sol`, `test/NativeClaimApplication.sol`, `test/NativeCounterfeit.sol`, and `browser/native-proof.test.mjs`.

`core-closeout-native-20260916/final-1/paid.json.gz` retains complete header/proof packets, separately selected anchors, raw signed transactions, receipts, deployment context, successful onchain read-backs, negatives and source-off results. Eight byte-exact compiler artifacts sit beside it. `progress.json.gz` preserves the pre-offline checkpoint; `other-instance.json.gz` records the actual second-instance negative; `late-only-input.json` proves the fresh exporter input boundary. `manifest.json` hashes 13 evidence files, pins scripts and 22 source files, performs 115 artifact/source metadata joins, and supplies a compact transaction/witness/cost index. It is a retained consistency manifest, not independent chain membership or deployed-runtime reconstruction.

The parent separately reports a retained check passing 22 source files / 115 metadata joins, 8 artifacts, 79 raw transaction/receipt joins, 22 CREATE address/cap checks, 6 exact constructor joins and 5 offline/paid checkpoint-retain-consumer joins. This is parent evidence, not this worker's independent task review, and does not authenticate source-chain membership.

## Dependency and compiler provenance

Pinned Optimism source snapshot: `bf8daaed3e850a06fde4fb301ba70927dee815fa`. Only the five necessary MIT files are vendored: SecureMerkleTrie, MerkleTrie, Bytes, RLPReader and RLPErrors, plus the unchanged upstream root MIT LICENSE. Immutable raw GitHub bytes and local bytes were SHA256-compared; all six exact raw/local pins are in `src/vendor/optimism/NOTICE.md`. No floating branch, GPL substitute, installed dependency, upstream FFI test execution or tagged-release/audit claim. Local canonical/shape/budget checks wrap the unchanged upstream bytes. The JS trie walk is separately implemented with existing ethers Keccak/RLP primitives and does not call the Solidity verifier.

Actual artifacts use solc `0.8.30+commit.73712a01`, optimizer 200, viaIR, Cancun, IPFS metadata. Artifact settings—not an inferred global cache configuration—define each paid compilation. No new packages were installed.

The retained wallet-versus-final comparison finds Ledger/PublicationSupport/Store creation and runtime templates byte-identical, and actual direct Ledger/registry code hashes identical. Actual root/child/name rules, index, lens, Files, Names and application code hashes differ; the manifest preserves both sides. These changed code identities can affect code-derived Type IDs and execution commitments, so no old Type or receipt identity is carried forward by assumption. The final packet action Type and execution tuple are the actual measured final values. Source/rule behavior equivalence is not established merely by this hash comparison.

## Supported profile and mechanical layout

Profile string:

`efs.lab.native-state/1:direct-immutable:guarded-single-publish:30-positive-keys:cancun`

One guarded-native PUBLISH by an ordinary deployed application into a known direct immutable Ledger; nonzero selected index/generation; one exact body/read-set preimage. Zero/missing-field claims, general proxies, batches and future layouts/eras are unsupported. Final compiler layout was mechanically reconciled, retained and source-hash joined; remembered preflight offsets were not treated as authority.

| Rows | Exact profile keys |
| --- | --- |
| Evidence 5 | mapping root 6, offsets 0/3/4/5/6; native zero r/s excluded |
| Publication context 5 | root 13, offsets 0–4 |
| Historical execution tuple 10 | root 14, offsets 0–9 |
| Original admission 3 | root 5, offsets 0–2 |
| Publication-ID map 1 | root 7 |
| Record 2 | root 2, offsets 0–1 |
| Current counters 1 | root 1 |
| GENESIS / revision 2 | exact ExecutionSlots namespaces |
| Author nonce 1 | root 11 |

The decoder reconstructs origin and contract principal, exact single action/hash, guarded digest, publication ID, historical execution identity and Record ID, and matches all 30 derived unique keys. It validates shape/reserved bits, body and read-set preimages, direct implementation/shell codehash, positive activation, original acceptance basis and historical/current lower bounds. Acceptance requires `0 < B <= C < 2^40`; current revision must be at least historical revision >=1, current nonce at least originalNonce+1, and current counters at least historical A/P.

Only admission withdrawal bit 148 is masked when reconstructing original immutable acceptance. Withdrawal and the correctly bounded 32-bit Record occurrence count are separate C observations. Current count zero does not erase retained authorship. Historical claim identity excludes C and mutable observations; witness identity commits C's state root and every proof/body/read-set byte. No current registry/index/policy/app is used as an oracle for historical execution.

The exporter snapshots both physical read-set carriers through exact profile/getter checks: current namespaced STOP-code carrier in the five real witnesses; legacy root-15 carrier in the separately untrusted counterfeit fixture. Root-15 zero is not treated as missing data. Convenience RPC value/storageHash/codeHash/nonce/balance fields are ignored for authentication.

Safety ceilings: exactly 30 unique keys, each account/storage path 1–65 nodes, <=1,024 bytes/node, <=262,144 aggregate node bytes, <=1,024-byte header, <=8,192-byte body and <=10,592-byte canonical read set. They bound work, not price or guaranteed completion under 15M.

## Root, source and consumer trust

Checkpoint accepts only a canonical exact 20-field Cancun RLP header, bounded lengths/widths/minimal integers and complete consumption. It extracts number/root, hashes the supplied bytes and checks recent EVM BLOCKHASH for a nonzero past block, age <=256; there is no arbitrary-root/admin setter. Current/future/expired/malformed/unknown-format/mismatched headers reject. Roots are write-once; identical retry remains available after the window (actual paid retry 126,780 gas). Checkpoint persistence is still subject to underlying canonicality/finality assumptions.

Exporter uses real EIP-1186 proofs at C and reconstructs the canonical raw header, checking its hash. Hash-pinned RPC was supported for this run. Number fallback exists only for unsupported hash parameters and rechecks C's hash before/after; that fallback was not exercised by this provider. C >= B proves retained historical rows at C, not B's block hash or transaction inclusion. Guarded pre-state was not independently re-executed.

Separately selected source anchor for final-1:

- chain ID 31337; instance/genesis hash `0x3372bc7310ee0d5dc7f38d5f030aec2b363994de71bcc2d2368f4dcb2a850c5b`;
- Ledger `0xe7f1725e7734ce288f8367e1bb143e90bb3f0512`; actual codehash `0x4e53240893eb8f06e6cec24f00baaabd275e166262174c5f9a151ae81023645f`;
- realm `0xd2c0689ece09797951177e2e3edb01a8e7a5f57d5a22904b28c16d802e732135`;
- deployment ID `0x4e96fd96ea84b711c8e33c8cacc7ca41deacfd0bb9cdca68b31f6b4178f92bdc`;
- helper identity `0x806da9dfdbe5d815a57a3c56a6f3d69ff509b02b883b776c83b792f4e2b26ed5`.

Deployment ID commits the actual deployment transaction hash, block hash, constructor-inclusive initcode hash and helper identity. GENESIS storage contains chain ID, not unique instance identity. The trust assumption is independently selected trustworthy direct deployment/initialization context; a packet or codehash alone cannot create that context. The retained report includes genesis, signed deployment receipt/transaction and exact helper family:

| Component | Address | Actual codehash |
| --- | --- | --- |
| PublicationSupport | `0xCafac3dD18aC6c6e92c921884f9E4176737C052c` | `0xf938d7073125562684049367689d60ad689ebd41533c9ba35ca3f5fc95fff34b` |
| SignatureStore | `0xAe367415f4BDe0aDEE3e59C35221d259f517413E` | `0x58feea84e174636712d19ad1a6983773508796512cae564d0dfec000868a7752` |
| Checkpoint | see paid contracts and root anchors | `0x58380236f34882b398a98247428b6e7363087f5c0b9f3b4c27875bbb6bd3ac16` |
| Native verifier | see paid contracts | `0x969db98e7a7b5a4f9dfe1ab6a10cce0332030e546b3dd082e6c070a2d9ed256e` |
| Archive | see paid contracts | `0x8acc084bc328f38b2f9b176f78ded7e5eddf59a9a99c4bfcd2aa13ddfd2eec75` |
| Consumer | see paid contracts | `0x09e0e00e0d261490ef20ea951c2b0d8b7e323205d90363bdc0ef5b06327a27fa` |

Solidity verifier reads only the pinned checkpoint and its own fixed source anchor, not the source, current author, wallet or current rules. Archive stores the verified result/body keyed by witness ID. The concrete consumer constructor pins intended archive address/codehash/verifier/source anchor and rejects a caller-supplied fake same-ABI archive. Nonzero importer testimony alone is not sufficient.

Offline grades are deliberately separate:

- integrity: VERIFIED_POSITIVE_INCLUSION;
- root: UNVERIFIED without an independent anchor, LOCAL_BLOCKHASH_CHECKPOINT with the selected local checkpoint context, or TRUSTED for an explicitly caller-trusted foreign root—not foreign consensus verified;
- source execution: UNVERIFIED or ANCHORED_DIRECT_DEPLOYMENT, separately from root authenticity;
- source admission: HISTORICAL_ACCEPTANCE only with the necessary qualified anchors;
- body: FULL_SELECTED_RECORD; currentness: CHECKPOINT_OBSERVATIONS_ONLY;
- authority: NONE; guardReexecution and foreignConsensus: NOT_PROVEN.

Packet-provided flags are ignored. The pure offline verifier and concrete body-consuming companion do not make network/source/current-rule/wallet calls. Retention neither admits an action to another Ledger nor transfers edit rights or synthesizes an EOA signature. No change was made to the separate EOA or ERC-1271 archive lanes.

## Decisive paid journey

The final fixture first selects generation 1 using the existing index setup operation. Source app writes commit through the actual guarded-native path. Empty app read-set encoding is 224 bytes; the nonempty example is 320 bytes. This tests the commitment, not independent guarded read re-execution.

| Witness | Original B / proof C | Body / reads bytes | Nodes / bytes | Current original withdrawn / Record count |
| --- | --- | --- | --- | --- |
| early P1 | 22 / 22 | 58 / 224 | 94 / 20,824 | false / 1 |
| nonempty P2 | 27 / 27 | 9 / 320 | 102 / 23,579 | false / 1 |
| zero-occurrences P1 | 22 / 34 | 58 / 224 | 103 / 25,473 | true / 0 |
| late-after-changes P1 | 22 / 358 | 58 / 224 | 105 / 26,345 | true / 1 |
| late-only P3 | 32 / 362 | 4 / 320 | 104 / 26,392 | false / 1 |

All regular paths are at most four nodes; largest node is 532 bytes. The runner actually reuses, withdraws every occurrence, reuses again, replays and replaces the index, changes/restores policy, rotates app controller, and advances revision 2 to 5. The same original P1 claim survives:

`0x992923a3d92d472266a956873e9aa97af2f4ec851424fcade216748c883dc380`

Early/zero/late witness IDs respectively:

- `0xca7e92bfa8c6cff980e45e24a63e58fd4567430a6c835d166461dc6fec0b4f04`;
- `0xb301e76640d7388d5e027e9b1553d03a2360dae84595e7690977dcda8ffabe96`;
- `0xaabbbdd4dc842eaa2f38edbee9358690ffb5cfe1eea65262a6b0d6e68f56aa3a`.

P3 has no early packet/header/checkpoint. Its separate fresh process accepts only RPC URL, source profile, ABI and publication number. At current height 358 the actual request for B=32 state fails `-32602 BlockOutOfRangeError`; its fresh C=362 witness then succeeds with B age 330. Original-day checkpointing and archival B state are therefore not prerequisites for this retained-row profile.

Third-party Bob pays retention; Alice exercises the pinned onchain consumer. After all paid work (including fixed negatives/limit probe), source RPC shutdown is confirmed and each ordinary packet independently verifies and yields the exact body/principal/Record with authority NONE. No transaction is claimed after shutdown.

## Actual costs and archive footprint

Ordinary transaction cap 15,000,000; hard cap 16,777,216; runtime 24,576; constructor-inclusive initcode 49,152. This native run explicitly uses a 15M block gas limit, bounded Anvil history 256/cache 512, and no traces. Local gas costs are observations, not public-network fees.

| Component | Runtime bytes | Actual initcode bytes incl. args | Deployment gas |
| --- | --- | --- | --- |
| Ledger | 24,538 | 39,310 | 8,438,552 |
| PublicationSupport | 11,880 | 13,882 | included in Ledger receipt |
| SignatureStore | 1,824 | 1,850 | included in Ledger receipt |
| Native app | 2,164 | 2,347 | 544,827 |
| Checkpoint | 3,058 | 3,084 | 714,310 |
| Native verifier | 13,452 | 14,313 | 3,131,888 |
| Archive | 3,069 | 3,235 | 718,471 |
| Pinned consumer | 2,834 | 3,532 | 680,030 |

Source writes: empty 1,117,450 gas / 804 calldata bytes; nonempty 866,378 / 868; late-only 697,709 / 868. Setup/registry/index/helper/app deployments and mutation costs remain separate rows in the retained transaction index; not hidden in source or retention prices. Ledger still has only 38 runtime bytes spare.

| Witness | Checkpoint gas | Verification-only gas | Retention gas | Retention calldata bytes | Onchain consumer gas |
| --- | --- | --- | --- | --- | --- |
| early | 168,851 | 11,417,611 | 11,617,114 | 32,836 | 98,875 |
| nonempty | 168,851 | 12,608,797 | 12,780,745 | 36,260 | 57,424 |
| zero-occurrences | 168,839 | 12,879,610 | 13,095,943 | 38,148 | 61,875 |
| late-after-changes | 167,190 | 13,166,273 | 13,382,546 | 39,172 | 59,075 |
| late-only | 168,076 | 13,039,923 | 13,211,811 | 39,204 | 57,424 |

Verification-only is a paid pinned consumer wrapper with result writes, not an isolated pure-call gas number. Its difference from archive retention is not a perfect storage-only decomposition. It does nevertheless show verification dominates the near-cap cost.

Archive mapping root 0 has eight fixed receipt slots: claim/Record/principal/root/source-anchor (0–4), packed C/B (5), packed importer/withdrawal/count (6), body (7). Bodies 58 bytes add two words; <=31-byte bodies fit inline. The five successful witness rows occupy 46 value words / 1,472 value bytes, excluding trie overhead and contract deployment. Full proof nodes/read-set bytes are not stored onchain; witness commitment binds the separately retained packet. Losing every retained packet loses recoverable full proof availability.

Main-process RPC meter: 681 calls / 681 HTTP requests, 2,771,649 request bytes, 3,153,862 response bytes, 8 eth_getProof calls. Fresh-child late-only RPC traffic is not included in that parent meter; second-instance control is also separate. Offline per-witness recorded 60.99–69.69 ms includes several trust-grade checks plus concrete consumption, not one isolated verification latency.

Single fixed joint-ceiling result: body 8,192 / reads 10,592; source succeeds at 11,596,247 gas / 19,300 calldata bytes; proof 129 nodes / 39,094 bytes, max path 6/node 532; checkpoint costs 168,783. Verification-only reverts at 14,784,186 gas / 72,292 calldata bytes; retention reverts at 14,784,117 / 72,260. Both were submitted at the ordinary 15M cap. No trace was taken to assert an exact internal revert cause. The export is independently inclusion-verifiable offline; there is no successful joint archive or onchain-consumer claim. No retry, cap increase or optimization tournament followed.

## Preserved experiments and the one authorized cost change

Attempt 1 stops at the positive profile's unsupported default generation zero, with 21 receipts. Its source cost 1,114,650 is stopped-fixture evidence, not final pricing. The initial error boundary did not retain the failed raw packet; this gap is disclosed. Using the existing generation setup before first publication satisfies the explicit brief, without weakening inclusion.

Attempt 2 is the original full five-packet baseline: late retention 14,994,650 gas, only 5,350 ordinary headroom. Its consumer was still unpinned and is not the final qualified consumer. Attempt 3 isolates same-shape cost: verification-only 12,445,456 versus retention 12,643,943. This attributes almost all cost to verification. Source inspection finds cumulative temporary RLP/trie allocations across 30 primitive-returning storageValue calls.

Under the parent's one-candidate ruling, final verifier saves the free-memory marker only after persistent witness/result/account-root/scalar-array allocations; each per-slot call returns a copied uint256; every reclaimed word is zeroed before resetting the marker. Thus no returned reference escapes and reuse does not assume dirty memory is fresh zero memory. No upstream byte/check, canonical/path validation, bound, storage meaning or cap changes. Heterogeneous real paths/value lengths and malformed/semantic controls still match independent JS outputs.

Attempt 4 is a pre-chain artifact/source mismatch guard after an internal decoder visibility change; it stops before Anvil with partial artifacts and no paid claim. Attempt 5 is the single scratch candidate plus pinned-consumer control: same 94-node / 20,824-byte shape, verification-only 11,417,623 and retention 11,617,126, about 1.03M gas / 8.1% lower. It is not an identical address/root experiment; consumer pinning changed too. Exact before/after artifacts and compiler source hashes are retained. Final-1 is the complete decisive journey at committed final source.

Attempts 1–5 recorded reviewed BASE as sourceCommit while new native files were uncommitted. Their README expressly says BASE did not contain those files: per-artifact metadata pins their actual code. They are not relabelled as final-1 or exact BASE behavior.

A concrete lower-cost option now is retain the full bounded packet and independently selected anchors and perform the already demonstrated verification/consumption offline. That preserves qualified evidence recovery but does not provide an onchain verified archive or destination admission. Any staging/multiproof redesign intended to restore large onchain affordability requires separate design and new verification; it was not implemented here.

## Falsifiers and rollback evidence

Focused Solidity and JS tests cover canonical RLP/minimal integers, exact account/storage tuple and secure key hashing, malformed embedded nodes, missing/trailing/tampered/duplicate nodes and keys, valid non-inclusion, bounded lengths, body/read-set/action/principal/origin/execution changes, immutable admission mutations, missing retained rows, C<B, uint40 era, reduced counters/nonce/revision, and successful zero occurrences/withdrawal. Inclusion failure never becomes an authenticated zero.

Real final onchain call refusals: missing-key, duplicate-key, trailing-node, missing-node, tampered-node, wrong-hash-key, body, read-set, mixed-root and unsupported-era. Fake same-ABI archive is refused by the selected consumer pin. These are eth_call falsifiers, not invented paid receipts.

Attacker-root fabricated state is semantically consistent in the test fixture but remains root/source UNVERIFIED without external anchors; packet trust flags cannot elevate it. Real counterfeit constructor installs fraudulent historical rows and returns the exact genuine Ledger runtime (6,247,752 gas, 27,830 initcode bytes). Its actual recent state root is checkpointed; it still gains no source execution trust from codehash. The selected genuine anchor and verifier refuse it. A malicious proxy actually fabricates history via a delegate writer then restores the genuine implementation; direct-profile export refuses it and the raw failed packet is retained. Present implementation identity is not historical provenance.

The separate actual second local instance has the same chain ID, deterministic Ledger address and runtime hash but a different genesis. It lacks the original publication; exporter refuses, original packet with the new selected instance anchor refuses, and a real valid non-inclusion proof is refused by positive-only verification. The instance closes in finally; evidence is retained separately.

Actual source failures and gas: rule refusal 651,067; prefix/final rollback 735,186; app rollback 916,356; final-index rollback 748,849. Runner read-backs confirm unchanged counters/nonce/app writes and zero next evidence/context, so no native claim commits. These four expected paid source failures plus the two joint refusals account for the six final reverts.

## Commands and verification

Commands run from the existing lab, with supplied no-install toolchain. Set `EFS_ETHERS_PATH` to the existing sibling planning-efs21 ethers installation; `ANVIL_BIN` to the supplied Anvil; `FOUNDRY_OUT=/tmp/efs-recovery-build-wPDyNv/out`, `FOUNDRY_CACHE_PATH=/tmp/efs-recovery-build-wPDyNv/cache`. Node is the existing Homebrew Node and Forge/Anvil the existing Foundry binaries. No owner UI/RPC60608/60599 access or mutation.

- `node --test browser/native-proof.test.mjs`: initial two tests RED (missing verifier behavior), then GREEN; final expanded run 7/7 PASS, retained `final-node.log`.
- Initial `forge test --match-contract NativeStateProofTest -vv`: missing-file compilation was setup failure, not a behavioral RED claim; then 3/3 PASS.
- Added semantic activation mutation exposed missing zero-activation rejection; the focused failing control led to the explicit >0 check in both implementations. No retained proof requirement was relaxed.
- `forge build --sizes`: compilation succeeded but command exit 1 from pre-existing oversized test fixtures (including WrongAdminFactory), not production component cap failure. Paid constructor-inclusive sizes above are the deployment evidence.
- `forge test --match-contract 'Native(StateProof|Semantic)Test|PublicationPreparationTest|ReadSetCarrierTest' -vv`: relevant covering run, 20/20 PASS (3 state-proof + 4 semantic + 9 preparation + 4 carrier). Repeated at handoff for fresh verification; retained `final-forge.log`.
- `node script/measure-native-proof.mjs core-closeout-native-20260916/attempt-N`: finite attempts 1–5 as explicitly qualified above, followed by `node script/measure-native-proof.mjs core-closeout-native-20260916/final-1`: exit 0 and all five paid/source-off cases succeed, with fixed negative/ceiling refusals.
- `node script/native-instance-control.mjs core-closeout-native-20260916/final-1`: exit 0; same-ID/address/runtime second-instance and non-inclusion controls all pass, closed=true.
- `forge inspect NativeClaimArchive storage-layout --json --force`: final mechanical layout inspection; its forced rebuild metadata consequence is prominently disclosed above. Earlier extra-output request was skipped by cache.
- `node script/retain-native-evidence.mjs`: first stops on Ledger inspection/paid bytecode mismatch; after explicit distinct-layout-provenance handling, exit 0; 13 hashed files, 22 sources, 115 metadata joins. No chain or proof rerun.
- `git diff --check`: clean before exact staging/commit.

No opcode tracing, package install, public transaction, owner-demo mutation, production repo change, general bridge or additional reviewer/subagent. All worker-owned bounded chains close; final main RPC shutdown is recorded. Parent owns publication and independent review.

## Self-review and remaining concerns

Reviewed trust separation, positive-only failure behavior, exact key derivation, packed widths/reserved bits, original-action withdrawal masking, present-observation isolation, independent body/read-set commitments, consumer pinning and scratch-memory lifetime/clearing. Complete source/artifact/receipt retention makes failures and claim qualifications inspectable.

The two foremost concerns are mixed-cache reproducibility and expensive/narrow onchain affordability, not just gas footnotes. A coherent clean final integration is still required; exact paid artifacts remain authoritative for this run. Solidity test compilation retains shadowing warnings (including a local test variable), and the prototype-wide size command still sees unrelated oversized test harnesses. No full prototype tournament or production audit was performed.

The profile excludes general proxy upgrade histories, absent/zero field claims, unsupported eras/header forks and arbitrary multi-action native authorship. Foreign finality/root authentication, destination consumer integration on another live chain, independent guarded pre-state re-execution, and availability after every packet copy disappears remain explicit unsolved boundaries. Source execution depends on the externally selected deployment context; historical acceptance does not mean current policy validity or edit authority.

TDD kept failure cases explicit; systematic debugging led to the generation-fixture correction and measured allocation-cost attribution; verification-before-completion required fresh focused/covering results and exact paid-artifact provenance. Independent task review is intentionally left to the parent after handoff.
