# Mandatory PostingStore: failed bounded size probe

**NOT deployable. NOT complete. No gas result.** This branch checkpoints known-incomplete prototype code, not a passing implementation or protocol decision. Reviewed control remains `ebc7d540570827c5f5052af83d2cbd80f54092a7` on `codex/efs21-direct-apply`; preservation branch is `codex/efs21-posting-store-size-probe`. No push or adoption is implied.

The all-ten-family extraction hit actual U3 EIP-170 size limits before deployment, full regressions or economics. Five independently bounded probes compiled the real browser/U3 dependency closure. Ordinary runtime limit24,576 and initcode limit49,152 were not raised. Init sizes below are compiler templates, not complete constructor-argument deployment measurements.

| Actual source probe | U3 runtime | U3 init template | Over runtime cap | Admission runtime | Query runtime |
|---|---:|---:|---:|---:|---:|
| Reviewed control |24,141|—|within435|22,392|20,558|
|1. Inline new Store configuration |24,863|25,806|287|22,214|20,705|
|2. Outline only new configuration |24,778|25,714|202|22,454|20,705|
|3. Fixed-calldata scalar READ experiment |24,852|25,788|276|22,445|20,688|
|4. Three raw posting getters outlined |24,760|25,696|184|22,847|20,705|
|5. One shared raw posting dispatcher |24,761|25,697|185|22,861|20,705|

Store runtime1,440/init1,605 and Point runtime15,092/init15,122 were unchanged across all five candidates. Probe5 is the checkpointed source. The fixed-calldata experiment was rejected and original `abi.encodeCall` READ transport restored. All mutation transport remained unchanged during these size contingencies.

## What was and was not established

The initial behavioral RED used actual admission: the assertion that retired Core posting-head storage was empty failed while its logical posting was nonzero (0pass/1fail). After minimal Store/StateKernel/harness routing the same test passed (1pass/0fail), checking separate physical owner, exact writer and logical head/word/key inventory equality. This establishes that focused state-ownership seam, not all ten-family equivalence or actual proxy deployment.

Four wire suites compared actual calldata against `abi.encodeCall` for all four scalar methods, zero/max/dirty-high-u64 values, malformed0/1/31/33/65,536-byte responses, failure, noncanonical writer and memory canaries/allocator behavior. Before fixed transport:3pass/1expected allocation failure; after:4pass. On restoring the allocating transport, only zero-allocation was changed to the honest allocating-buffer expectation; canary/zero-slot/later-allocation checks remain. **That adapted test and the later raw outlines were not rerun:** the approved size-first probes failed and work stopped.

UNRUN: complete constructor caller updates; full Core/foundation tests; dispatcher/high-bit/invalid-kind/overflow/order fixtures; real Store corruption and late cross-account/helper-CREATE rollback; actual proxy/static consumer/direct transaction checks; source-aware SDK configuration/Store graph qualification; explicit browser/Node/TypeScript/format/layout/error-union gates;150,000-gas peer configuration gate; complete initcode/deployment bounds; all paid writes/reads/RPC and matched worlds. Existing constructor callers remain incomplete. Compiler success is not a green full tree. Historical evidence and previous replay controls were not rewritten.

## Scope and execution dependency

New `PostingStore` physically owns packed heads/words/key mirrors with exact immutable Core-proxy writer. `StateStore` appends a route after bindingKeys, reserves old mappings/enums and disables retired dispatcher writes. `StateKernel` coalesces per-key mutation and obtains old family3 head from the first mutation. Checked primitives route to Store. Core/ReadCore/U3 constructors, initialization, new configuration wrapper and factory genesis/activation checks carry Store identity. Test harness routing and the initial ownership/wire tests are included. SDK/deployment harness completion is not included.

The final library ABI adds `rawPostingRead(storage,uint8,bytes32,uint64)->uint256` (0=head,1=word,2=key; other kinds refuse). Core external signatures and full256-bit return values remain. Word keeps head→checked `uint64(head)+4`→InventoryBounds→word order. Core keyAt checks its count bound before delegation; unused arguments are zero. InventoryBounds is declared in Core and library; any union ABI qualification remains to be completed and tested.

This introduces an **explicit trusted raw execution dependency** on the existing admission library. There is no new per-raw-call code-hash check. Constructor/init/configuration and a completed qualified reader must authenticate the library graph; raw getters do not self-qualify. Missing/replaced-library failure behavior is not claimed unchanged. DELEGATECALL is not intrinsically read-only in a direct transaction: a substituted library could mutate caller storage. Authentic-graph read-only behavior and qualified refusal still require the listed tests. No new module address, authority change, index-family removal, helper rewrite or qualified-query simplification was bundled.

The next step needs a separately reviewed module/code-placement boundary that creates measured U3 headroom while preserving public behavior and dependency qualification. These probes do not justify further scope, raised caps, a removed feature or a gas-saving claim.

## Reproduction and exact retained evidence

Compiler: `0.8.30+commit.73712a01.Darwin.appleclang`, binary SHA256 `738dcdc6afddeb505ee4e4ef24f1c1fdba2b8c924e614cbbf5801a5b062dd683`; optimizer200, viaIR, Cancun. No build flags changed between probes.

From `Reviews/2026-09-05-c0-core`:

```sh
forge test --offline --match-test testAdmittedPostingsOwnedBySeparateProxyWriterStore --match-contract '^StateKernelTest$' --out /tmp/efs21-posting-red-out --cache-path /tmp/efs21-posting-red-cache
forge test --offline --match-contract '^PostingAccessTest$' --out /tmp/efs21-posting-red-out --cache-path /tmp/efs21-posting-red-cache
```

From `Reviews/2026-09-09-files-browser-mvp/contracts` (historical source states, not five runs against the final source):

```sh
forge build --offline --out /tmp/efs21-posting-size-out --cache-path /tmp/efs21-posting-size-cache
```

The first probe also used `--sizes`. Exact complete compiler inputs (including untracked Store/access source contents), settings and outputs/ABI/runtime/initcode for all five probes are retained locally, not committed as duplicate source or binary blobs, under `.superpowers/sdd/2026-09-12-efs21-posting-store-plan/failed-probes/`. Each file is `<name>.build-info.json.gz`; deterministic gzip and offline byte-exact round-trip were verified. These archives contain actual earlier compiler outputs, not reconstructed snapshots. The adjacent scratch task report records compressed lengths/hashes too.

| Name / compiler build-info ID | Decompressed bytes | Decompressed SHA256 |
|---|---:|---|
|01-inline-24863 / ef1fac1e27649559|16,831,876|26bf8250805c71ab475cb2acce302f319c459279128ac04d64afd52d6537e8a5|
|02-config-outline-24778 / a003b1364b712cdf|16,849,167|630794e2decd1ee200b50691573be20237e86ef9ffa57ec8b202eb704e82384f|
|03-fixed-wire-24852 / 0d904f2f2df81e25|15,020,419|8272dc52806de7403777e60f5d573808d67f88faee55c22a8f935fbf8324f91b|
|04-raw-getter-outline-24760 / 10ab3aa005904253|15,020,878|8fcac1a5bac384efc46759c718751a573fdf4f040589614bad5daee0c7fb6a78|
|05-shared-raw-dispatch-24761 / 1ce26852db1d9a8d|15,027,726|0402ff7ec42a28af0e3fad402a3e9206a1d076a92e8b71cbfa275055d6c0a26a|

U3 runtime **template text** SHA256 below hashes the exact compiler `evm.deployedBytecode.object` ASCII string (no0x, including unresolved link placeholders). These are not deployed runtime identities; no candidate was deployed.

| Probe | Runtime template text SHA256 |
|---|---|
|1|754b4b629d88a0b3994b937ae9701c731458009d74b25afc85984788e6d2e233|
|2|d92c310605279ef2517c260fdd842553a792b6c37d268efb57403efba66e0716|
|3|1a0b932c30f2ec05b29279567373b6496036a1766e35314e70d14609efe5e553|
|4|eaa2f1d3611293dbbd4f6f630b80c9e0ea85b633df78740d1595c44b2afcc47b|
|5|e9ab394590c0ba8214f4f343b9e2117d19f06dd50ad066f45fa5eafb507242e3|

`evidence/posting-control-sources.json` separately freezes exact reviewed control:66source pins/12full artifact templates, canonical2,050,441bytes, keccak`0x41d9aea13d2a8b2109d034ef35b3a5c069c361ee5da32ac0ce6e38e7fdc2bf27`, lossless gzip. Its source-backed freezer ran before production edits; it only runs at exact control HEAD and refuses overwriting evidence.

No candidate Anvil/world was started. All owned compiler commands exited. Heavy/build/new-world slot explicitly released to root before this preservation-only checkpoint. Three demos and root control archives were untouched. Temporary stopped outputs and five scratch archives are retained for closure review; no broad cleanup occurred.
