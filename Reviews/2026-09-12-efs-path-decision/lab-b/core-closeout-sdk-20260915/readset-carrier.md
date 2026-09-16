# Additive immutable read-set experiment

**Standing:** selected local experiment, 2026-09-16; independent review required.
Not protocol adoption, mainnet readiness, or a change to the running owner demo.
BASE is `6869e2680d75521de851eaa67631cc05a1eb35a9`.
Selected implementation/runner commit is
`6d54ee86ae389fee26da3df5606ee51f696f5856`; every final packet source SHA256 pin
was independently compared with that commit after committing. The packet's
`candidateParent` records the pre-commit parent, not a false clean-source claim.

**Review fix 1:** [per-implementation qualification correction](carrier-fix1.md)
supersedes this note's shared-ABI qualification wording below. Recognized legacy
labels cannot skip actual runtime evidence. The original paid packet retains its
original SDK provenance; the fix has separate focused compatibility evidence.

## Selected policy and physical profile

Keep sequential root15 **exactly** `mapping(bytes32 => bytes) _readSets`.
The [compiler storage layout](carrier-storage-layout.json) records every
sequential root0–15 and confirms that root15 value type remains dynamic bytes.
Read legacy bytes first; otherwise read an additive mapping from the same
canonical read-set hash to a STOP-prefixed immutable code carrier. All previously
unretained format2 read sets use that carrier. A duplicate found in either
representation deploys nothing. Native/signed semantics and canonical ABI/hash
are unchanged. Unknown remains `0x`; empty remains its224-byte canonical preimage.

The compatible roots0–15 `LAYOUT_ID` is unchanged so the actually deployed old
proxy can admit a populated upgrade. It is **not** a claim that root15 enumerates
every read set. The exact physical identities are:

- Legacy profile: `keccak256("efs.lab.read-set-storage/1:root15-bytes")` =
  `0xca3d48cbf6e3554318963f596d8d6f0f9326a1a1820f6cfc845c9c5a25415721`.
- Selected profile: `keccak256("efs.lab.read-set-storage/2:root15-legacy-first:namespaced-stop-code:all-new")` =
  `0xf039563da83570a25f2fc53844be5598ef5fd2e10017731c1be51cd65c3a8e51`.
- Additive mapping root: `keccak256("efs.lab.ledger.read-set-carriers/1")` =
  `0x3915c3a57eb73ff86f1946881d285deb2de55ee21f6b1ad7230e3828668dea7e`.
  The address occupies the low160 bits at `keccak256(abi.encode(key, root))`.
  This root differs from0–15 and all existing ExecutionSlots/proxy metadata.

`readSetStorageProfile()` declares the selected physical codec. The SDK manifest
pins it per actual implementation address/codehash, with the fixed publication
support address/codehash. At a fresh exact-block pin, a declared carrier profile
must return the exact profile/root and support identities. Failed probes do not
fall back to legacy. Old saved ABIs/manifests still select their old adapter;
an ABI advertising the new getter requires explicit per-implementation profiles.
No browser import was added, and the demo allowlist/startup/state was untouched.

The code reader bounds runtime225–10,593 bytes and32-byte body alignment, checks
STOP, recomputed runtime codehash, canonical top-level tuple offset32, and the
requested domain-separated read-set hash before returning bytes. Creation,
pointer, publication evidence, author nonce and the creator's CREATE nonce all
share EVM rollback. No delegate target, permission or helper framework was added.

## Exact gate inventory

| Gate | Actual support and disposition |
| --- | --- |
| `Ledger.layoutId`, `test/UpgradeProxy.sol` | Sequential-root compatibility, deliberately unchanged; new physical getter is separate. Old proxy bytecode is actually exercised. |
| `browser/compact-sdk-v2.mjs` | Existing exact execution/implementation allowlist retained; additive physical profile and fixed support checks added. Canonicality, owned capabilities and exact block hashes remain required. |
| `script/compact-environment.mjs` | Each exact artifact ABI selects legacy or explicit new profile; no error-driven fallback. Records implementation/profile/support identities. |
| `SignedClaimArchive`, `browser/guarded-archive.mjs` | Canonical ABI and signer-committed execution-family reconstruction, not raw-root15 state decoding. Getter returns complete bytes under either implementation. No support assertion was relaxed. |
| `LensReader`, `FilesPageReader`, `FilesNameReader` | Unchanged family gate for unchanged heads/record/position roots and qualified canonical getters; none interprets root15 zero as absence. |
| `IndexReplaySource`, `PublicationSupport.checkReplacement` | Historical immutable publication/index facts from unchanged roots; no read-set raw decoder. Exact runtime/implementation/source gates remain. |
| `GuardedRecovery` | Source signed claims, fresh destination authorization; archive supplies read-set preimages. No new admission/proof assertion. |
| Proof tooling | No native read-set storage-proof verifier exists in this lab at BASE. Next proof task must prove legacy dynamic bytes OR the namespaced pointer plus carrier account/code under the selected implementation profile. A root15-zero proof alone is insufficient. |

Signed claim export/offline verification still proves **author signature only**,
not source admission, historical guard truth, authenticated execution, currentness,
or destination authority. Physical-profile metadata does not elevate that grade.

## Actual paid receipts

[Final source-pinned packet](readset-carrier-paid.json.gz) includes full receipts,
transactions, manifests, compiler/source hashes, exact runtime/code identities,
constructor arguments/initcode lengths, carrier deployment/readback, upgrade and
six offline results. [Runner](../script/measure-readset-carrier.mjs) compares
unchanged BASE artifacts with the candidate, never a test-only old-storage mock.

These are matched **whole guarded signed publication** receipts with one CREATE
action and required attached index, not marginal blob prices or whole Files
operation prices. The complete ABI preimages/actions and schedule match. New
implementation/execution hashes and signatures necessarily differ; their exact
calldata zero-byte effects are included, not normalized away. The empty first
row includes first-execution evidence recording in both arms. Later rows use the
same warmed publication state. Paid reads hash the entire returned preimage and
store its digest/length in the same consumer; first consumer initialization and
later update costs are matched per row, not claimed identical across sizes.

| Head set / ABI bytes | First old → new | Same-readset new publication old → new | Changed-head miss old → new | Full paid read old → new |
| --- | ---: | ---: | ---: | ---: |
| Empty /224 |943,752 →928,447|573,789 →576,284|not applicable|94,555 →86,177|
|1×1 /320|826,908 →704,593|584,279 →586,808|826,908 →704,593|67,023 →52,178|
|8×4 /1,632|2,015,063 →1,246,580|862,205 →865,379|2,015,063 →1,246,568|158,174 →54,997|
|64×4 /10,592|10,620,239 →5,441,882|3,251,089 →3,259,203|10,620,202 →5,441,845|782,251 →77,941|

Every carrier CREATE, code deposit, pointer SSTORE, dispatch, validation and
required index cost is paid in these receipts. Exact replay of an already
admitted publication reverts with no new carrier in both arms: old/new gas
162,937/163,047;173,407/173,539;451,216/452,030;2,839,400/2,845,142.

No crossover was observed among the finite supported fixtures: even the minimum
224-byte preimage wins on first retention. This is not a claim that arbitrary
smaller blobs win. Successful deduplicated publications regress by2,495/2,529/
3,174/8,114gas. Workloads dominated by repeated identical small sets can lose:
seven additional empty-set publications exceed that first-write saving when
ignoring reads/deployment. Keep the simplest all-new carrier experiment, with
that explicit tradeoff, rather than adding an unmeasured size-selection policy.

All transactions use normal15M gasLimit; hard16,777,216, runtime24,576 and
initcode49,152 remain unchanged. The largest measured first publication is
10.62M old/5.44M new. This does **not** establish maximal joint action/body/ref/
read-set publication fit. The fixture's2gwei execution price is recorded in every
receipt (64×4 first:0.021240478→0.010883764ETH), not an all-in L2 quote or USD price.

| Deployable | Runtime old → new | Actual initcode including arguments old → new | Whole deployment receipt old → new |
| --- | ---: | ---: | ---: |
| Ledger implementation |23,434 →24,126|35,535 →36,227|7,621,326 →7,770,923|
| Fixed PublicationSupport |11,185 unchanged|11,211 unchanged, no arguments|nested in the Ledger receipt above|

Ledger's raw creation artifact is35,471→36,163bytes; the64-byte constructor tuple
is included in the actual lengths above. No fit extraction was needed.450runtime
bytes remain. Carrier runtime/initcode are225/532,321/628,1,633/1,940 and
10,593/10,900bytes respectively; initcode includes the exact constructor bytes
and ABI argument. Final packet records runtime/codehash and initcode hash for
each actual observed carrier.

## Populated upgrade, downgrade, rollback and archive

The old implementation and old proxy are deployed from source-verified BASE
artifacts, populated with all four shapes and changed heads, then the proxy
activates the new implementation. Every old root15 header/ABI remains readable;
republication of the legacy empty key creates no carrier. A fresh8×4 key occupies
only the additive mapping and returns exact ABI bytes. A later failing unknown
Type publication retains no pointer, child code, author nonce or counter changes;
the focused required-index failure also tests evidence rollback.

Trusted downgrade to the actual old binary preserves legacy read access but its
getter cannot decode future carrier-only entries: `0x` causes the SDK archive
export to fail `ARCHIVE_READSET_MISSING` (**UNKNOWN, not absence**). Re-activating
the carrier-aware implementation restores exactly the same new bytes without
migration, under a fresh execution identity. No full backward-codec or arbitrary
downgrade compatibility is claimed. See exact before/downgrade/restored execution
pins in `upgrade` in the final packet.

After closing the source node, old-empty/old-max/new-carrier bundles are imported
into a distinct archive and re-exported. After closing both nodes a clean process
with network fetch disabled verifies all six original/re-exported bundles.
The pure verifier reports `AUTHOR_SIGNATURE_VERIFIED`, `sourceAdmission:NOT_PROVEN`.
No source endpoint, journal or source SDK cache is available in that last step.

## Verification and diagnostics

- Focused Solidity RED: new test initially produced two `missing additive carrier`
  failures against unchanged BASE and two existing-semantics passes. Initial
  `testFailure...` name was rejected by Foundry's removed `testFail*` convention;
  renamed before the meaningful RED. [First-fit GREEN](carrier-first-fit.log):4/4.
- [Profile RED](carrier-profile-red.tap): missing expected exception for unknown
  new physical profile. [GREEN](carrier-profile-green.tap), then expanded profile
  tests in [Node covering](carrier-covering-node.log):61/61, including cache,
  transport, archive, guarded order/upgrade, and profile failure qualification.
  [Final focused profile verification](carrier-profile-final.tap) also passed
  against final artifacts after the full build.
- [Full Forge covering](carrier-covering-forge.log):545pass/11fail out of556.
  The unfiltered `forge test -vv` selected all47 suites including inherited Files
  fixture tests; use named carrier/guarded/archive/upgrade suites next time.
  **Do not call the whole prototype green.** All11 failures are IncomingQuotes
  tests, reproduced unchanged by the [BASE-only scoped run](carrier-baseline-incoming.log)
  (5pass/11fail); names/error classes match exactly. No query code was repaired.
- Existing shadowing/mutability and oversized test-fixture initcode warnings are
  retained with exact paths/lines in the Forge transcript. The new composite
  `test/ReadSetCarrier.t.sol:15` test fixture is oversized; the deployed Ledger,
  support, carrier and paid-reader components are separately measured under caps.
- [Invalid first runner](carrier-paid-invalid-coordinate.log): an omitted
  `efs2/position/1` domain meant the mutation did not affect the watched coordinate;
  the changed-hash assertion stopped the run. It is not admissible cost evidence.
  The corrected finite runner and all final assertions passed. The earlier valid
  prefinal packet/log are retained separately, not overwritten or used as final pins.

Reproduce by building BASE in a disposable `git archive` snapshot with the same
Solc0.8.30/optimizer200/viaIR/Cancun settings; set `EFS_READSET_BASELINE_OUT` to
that output, `FOUNDRY_OUT` to the current output, and existing `EFS_ETHERS_PATH` /
`ANVIL_BIN`. From the lab directory run `node script/measure-readset-carrier.mjs`.
The runner verifies both artifacts against their actual source before deployment.
It uses only bounded loopback history256/transaction-block512 and closes nodes
in `finally`. No installs, owner-demo mutations, public deployments or spending.
