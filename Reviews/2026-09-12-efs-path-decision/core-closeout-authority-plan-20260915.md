# Core closeout: smart-wallet authorization and native source evidence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Validate two distinct missing authority paths: a deployed wallet authorizes a guarded publication using ERC1271, and somebody else can retain authenticated evidence of a native contract's source publication without acquiring its authority.

**Architecture:** Fixed bounded wallet-signature ingress; separate checkpoint/proof/archive contracts for native source evidence. Historical source acceptance, present authorization, mathematical proof integrity and chain-root trust remain separate results.

**Spec:** [[core-design-audit-20260915]], packet5; [[core-closeout-results-20260915]]. Source/code/execution profiles are explicit, not universal claims about arbitrary wallets, proxies or foreign chains.

## Global Constraints

- Existing prototype; one source/build/chain owner. No owner-demo mutation, production repository, public transactions, Fable, unbounded traces or package installation. Parent owns main docs and publication. Exact task commits followed by independent review.
- Preserve ordinary15M/hard16,777,216 transaction caps, runtime24,576/initcode49,152, existing EOA/native meanings, signed read-set/acceptance/index/execution commitments and full rollback.
- Retention is not destination admission, original-author authority or current source validity. Never manufacture an EOA signature for contract-authored data. Rule/account code today does not prove historical execution.
- Publish supported profiles and unproven boundaries plainly. A proof anchored in an arbitrary supplied root is not a consensus-authenticated foreign-chain proof.

## Task 1: Deployed ERC1271 wallet ingress and retained historical authorization

**Execution status September16:** complete and independently reviewed `ab55ca6..7e2b5bf`; paid source `9941d3b`, later runner guards/evidence/test-only strengthening explicitly separate. Existing fixed caller-preserving preparation plus an immutable evidence Store implements the bounded profile; no new storage roots. [[core-closeout-results-20260915|Results and limits]]. Task2 waits for final source/layout anchors after live Files and stance tags; local wallet retention is not its state-proof result.

**Files:** minimal Ledger ingress/integration, fixed signature module/evidence carrier if runtime requires it, qualified companion SDK/archive support, focused wallet and cost tests.

- [ ] Add an explicit guarded ERC1271 ingress/proof kind3, retaining the existing guarded intent digest and ordinary origin-qualified contract principal. Native calls and signature-authorized calls from the same ordinary wallet share its nonce. Do not collapse EOA signatures, native authority and wallet validation evidence into one proof kind.
- [ ] Bounded STATICCALL validates the exact guarded digest through the actual wallet before publication effects. Wallet observes Ledger/proxy as caller; if dispatch is extracted use a fixed Ledger-pinned delegate module with unchanged caller semantics. Reject malformed/noncanonical magic, revert, over-budget validation, code absence or unsupported account class. First profile targets ordinary deployed wallets,4KiB signature/300k verification; canonical empty approved-hash signatures are allowed. ERC6492/undeployed/delegated-key variants remain explicitly unsupported.
- [ ] Retain exact original signature bytes, wallet runtime hash, digest and fixed verification profile separately from existing EOA r/s. A namespaced, write-once signature-evidence carrier may be keyed by actual Ledger/publication; creator/caller cannot forge another Ledger's evidence. Missing bytes differs from an authentic empty signature. Validate all evidence joins and fixed dependencies.
- [ ] Preserve storage roots and old proof interpretation. If the new profile uses the proof-kind3 r/s words as a typed evidence pointer/hash union, expose that through an exact typed getter and reject use through EOA readers. Check all helper/runtime/initcode and ordinary unlinked Node deployments.
- [ ] Actual deployed wallet controls: opaque and empty signatures, permitted relayer, wrong digest/principal, shared nonce races with native calls, mutable owner/controller rotation, caller-sensitive verification, forbidden static writes/reentrancy, gas/return/signature bounds and complete rollback after later rule/index/app failure.
- [ ] Retention after wallet changes/offline keeps the original bytes and historical local-Ledger context. Do not rerun today's wallet and label the result historical proof. Separate retained-unverified-source from a deliberately anchored local-Ledger acceptance profile; reject counterfeit source/execution evidence. Foreign provenance waits for an authenticated root profile.
- [ ] Price first/repeated/empty/large signatures, signature retention and whole guarded publication separately; focused EOA/native/upgrade/archive covering checks, exact commit/report and independent review.

## Task 2: Actual native state proofs with explicit root and source anchors

**Execution status September16:** complete and independently reviewed through
`86c3649`, with exact paid source`86e10ee`. Five actual paid/source-off journeys,
late-only recovery and adversarial source/instance controls pass. Parent fresh
20Forge/7Node and retained evidence checks pass; [[core-closeout-results-20260915]]
records the substantial cost limits, mixed-cache build provenance and unproven
foreign/proxy boundaries. Source/build ownership passes to final Resource2, which
must clean-build and use actual new identities. Original specification checkboxes
below are not a second pending implementation queue.

**Historical baseline resource finding, September16 (subsequently reviewed):**
the first corrected five-packet source-off journey succeeds, but onchain
retention costs12,643,943–14,994,650gas for20,824–26,360proof bytes. One matched
verify-only call costs12,445,456 versus12,643,943for retention: verification,
not archive storage, dominates. Preserve these baselines. The controller permits
one scratch-memory reuse experiment around the30scalar-returning storage-proof
calls; no upstream library, proof check, storage guarantee or cap may be removed.
Persistent inputs/results must stay outside reclaimed memory, dirty-memory
initialization must be safe, and independent decoded outputs plus adversarial
controls must match. This is a reversible implementation experiment, not a
measured saving or expanded proof envelope. The large safety ceiling is not an
affordability guarantee.

**Files:** separate `RecentStateRootCheckpoint`, `NativePublicationProof`, `NativeClaimArchive`, bounded proof libraries/NOTICE, independent `browser/native-proof.mjs`, focused tests and an actual Anvil export/offline runner. No Ledger growth required.

**Journey sequencing clarification, September16:** actual same-chain checkpoint,
third-party retention and onchain retained-claim consumption run while the local
chain is alive. After stopping its RPC, the independent verifier and a concrete
offline consumer must still recover/use the retained claim. A distinct live
destination chain needs a separately authenticated foreign root or an explicitly
TRUSTED adapter; it cannot inherit consensus verification from a stopped local
chain. Do not add an arbitrary-root setter to fake this distinction. This
reversible experiment boundary leaves foreign-finality integration explicit.

- [ ] First exact profile is one guarded-native PUBLISH from an ordinary deployed app into a direct Ledger on Cancun. Pin actual final compiler layout/runtime/helper identities and source deployment/initialization anchor. Current proxy implementation/codehash alone is not a historical execution proof. Keep the existing EOA archive lane separate.
- [ ] Permissionless write-once checkpoint accepts a canonical20-field Cancun RLP header, extracts number/root and checks its hash against recent `BLOCKHASH`: past nonzero block, age≤256, exact hash. No arbitrary-root/admin setter. Identical retry is allowed; mutation, unknown fork/header, nonminimal integer/trailing data, current/future/expired block reject. Checkpoint remains usable after its acquisition window, subject to chain canonicality/finality assumptions.
- [ ] Export real `eth_getProof` at a retained-state checkpoint blockC at or after the stored acceptance blockB, capture raw header and recheck hash around number-pinned RPC fallback if hash pinning is unavailable. Verify every proof against C's state root; do not trust convenient RPC `value`, `storageHash` or `codeHash` fields. For this anchored direct immutable Ledger profile, old publications remain provable from later retained state: original-day checkpointing and B-state archival RPC are not prerequisites. Preserve complete C proof bytes before source shutdown/pruning. The checkpoint still must be acquired within256blocks of C; this does not authenticate B's block hash or transaction inclusion.
- [ ] Vendor only the necessary MIT Optimism inclusion-verifier dependency closure at a resolved immutable commit, with license/NOTICE and hashes. No floating develop dependency or archived GPL substitute. Implement the independent offline traversal separately using existing Keccak/RLP primitives. Check exact tuple/RLP/path/embedded-node rules and complete consumption; neither implementation may turn failed inclusion into authenticated zero/absence.
  - Provenance preflight selected [Optimism commitbf8daaed3e850a06fde4fb301ba70927dee815fa](https://github.com/ethereum-optimism/optimism/commit/bf8daaed3e850a06fde4fb301ba70927dee815fa): five-file MIT closure under`packages/contracts-bedrock/src/libraries/` (`trie/SecureMerkleTrie.sol`, `trie/MerkleTrie.sol`, `Bytes.sol`, `rlp/RLPReader.sol`, `rlp/RLPErrors.sol`). All production pragmas admit0.8.30; upstream tests pin0.8.15 and some use FFI, so they are vector references, not a drop-in test dependency. Preserve the pinned root LICENSE and exact raw/local hashes. This is a source snapshot, not a tagged-release/audit claim.
- [ ] Use a supported positive-slot profile: evidence5 + publication context5 + execution tuple10 + admission3 + publication-ID map1 + Record2 + counters1 + genesis/revision2 + nonce1 =30 storage keys, after mechanically checking actual solc layout. Reconstruct principal, exact action/hash, guarded digest/publication ID, execution identity and Record ID; verify supplied body/read-set preimages. Validate reserved bits and bounds. A changed layout requires a different decoder/profile, not unchecked offsets.
  - Later-checkpoint rules: require0<B≤C<2^40; preserve original evidence/context/historical ExecutionInfo and GENESIS. Mask only admission metadata's mutable withdrawal bit148 when reconstructing the original action; report withdrawal at C separately. Record Type/first-admission/length/body remain retained even when its current occurrence count is zero. Require current counters≥historical A/P, nonce≥originalNonce+1, and current revision≥historical revision≥1. Never substitute today's index/registry/epoch/policy for the historical execution tuple. Historical claim identity excludes C's mutable observations; witness identity includes C and its root. Do not depend on the packed mutable occurrence count for attribution; its width must be checked before presenting a count observation.
- [ ] Positive inclusion deliberately excludes absent/zero-field claims. Require exact unique keys and bounded proof paths/nodes/aggregate bytes before expensive decoding. Initial safety bounds may be65 nodes/path,1KiB/node,256KiB aggregate,1KiB header, existing8KiB body/10,592-byte read set; collect actual sizes first and report the ordinary affordable joint envelope separately from these ceilings.
- [ ] Same-chain verified retention reads the root from the pinned checkpoint, verifies the claim and writes exact source/root/profile context and body without calling the source author/current validator or granting destination edit rights. Full proof may remain in the retained offline packet; disclose when the archive stores only its commitment rather than all nodes.
- [ ] Offline output separates integrity, root authentication, source execution trust, source admission, body coverage, currentness and authority=NONE. Its trust context comes from the caller's independently selected anchor, never a packet `verified` flag. Foreign arbitrary root stays UNVERIFIED; an explicitly trusted foreign root is labelled TRUSTED, not consensus verified. A foreign finality adapter is a remaining integration boundary, not something EIP1186 supplies.
- [ ] Decisive journey: actual app→guarded Ledger write, real header/proofs, local checkpoint, third-party retain, stop source, independently verify offline, consume retained claim. Include empty and one nonempty app read set; do not claim all guarded pre-state was independently re-executed. Compare early and late witnesses after reuse, withdrawal of every occurrence, reuse again, index replacement/revision advance and mutable app/policy changes. Original claim stays identical while current observations differ. A separate late-only exporter must succeed after B ages beyond256blocks and B-state RPC is unavailable, without an early header/proof/checkpoint packet.
- [ ] Falsify tampered/missing/trailing/duplicate nodes and keys, wrong secure-trie key hashing, malformed embedded nodes, body/read-set/action/principal/origin/execution changes, valid non-inclusion, attacker-root fabricated state, same chain ID/address on another instance, counterfeit same-runtime/preloaded constructor and malicious-proxy-then-restored-implementation. The last two must not acquire anchored source-execution trust through codehash alone.
  - Late-proof negatives also reject C<B, unsupported uint40 era, mixed checkpoint roots, immutable admission mutations outside bit148, revision/counter/nonce lower than the historical claim, or missing retained rows. Zero current occurrences and a legitimately withdrawn original occurrence are not missing historical authorship. No source/current-rule/wallet calls are allowed during retained offline verification.
- [ ] Source rule/prefix/final/app rollback leaves no committed native claim. Later controller/policy/index changes do not rewrite proved historical acceptance. Report checkpoint, source write, verification/retention, calldata, archive bytes, RPC and offline cost separately. Exact commit/report and independent review.

## What this does not silently settle

The testnet experiment can anchor a known deployment and authenticate local roots. General foreign finality, arbitrary proxy upgrade history, availability after the last retained copy disappears, and universal wallet support are not solved by a passing local proof. They remain explicit adapter/deployment requirements, not reasons to weaken local validation or mislabel retained evidence.
