# Clickable compact Files prototype

September 14, 2026. Disposable integration, not production SDK or protocol bytes.
This screen uses compact B, not the earlier fuller-model browser. Filenames,
content, selection and tags are read from the deployed contracts; configuration
contains no authoritative filename map or file data. No `/api/files` service.

## Run locally

From this code worktree's root:

```sh
cd Reviews/2026-09-12-efs-path-decision/lab-b
export EFS_ETHERS_PATH="/path/to/existing/node_modules/ethers"
export FOUNDRY_OUT="$(mktemp -d)/out"
forge test --offline --out "$FOUNDRY_OUT" --cache-path "${FOUNDRY_OUT%/out}/cache"
node --test --test-concurrency=1 browser/compact-sdk.test.mjs browser/files-view.test.mjs browser/integration.test.mjs
node script/compact-browser.mjs
```

Use existing ethers **6**, Node 24+, Foundry and solc 0.8.30. Set `ANVIL_BIN`
if Anvil is not on PATH. Nothing installs automatically. Open the printed URL.
Ctrl-C stops this runner and its child Anvil; restarting makes a fresh chain.
Both servers bind loopback. The runner uses a run-owned cache and finite history
(`--prune-history 256`, transaction keeper 512), no fork or full storage traces.

Guest reads need no signer. **Use disposable demo signer** enables only public
Anvil test keys on chain 31337. Never fund these addresses or connect a real
wallet to this experiment. The local key route is a demo facility, not a hosted
production API or an authorization system. The native modules are static SPA
code; a standalone key-free distribution/wallet adapter is not packaged here.

## Try it

1. Open `meeting.txt`, switch **Alice → Bob** / **Bob → Alice**, then
   **Advanced: conflict review (diagnostic)**. Ordered Lenses take the first
   authored entry; a deliberate mask stops fallback. Conflicts have candidates,
   not a fabricated winning document. Conflict review applies only to HEAD;
   placements remain explicitly Alice → Bob.
2. Enable Alice's disposable signer. Create a small lowercase `note.txt`.
   Edit, rename, move to Archive, remove its placement, restore it.
3. Add a concept tag to **File identity**, then to **Selected revision**. Edit
   the file and inspect/filter the two subjects separately. A File tag follows
   the file; an exact revision tag does not silently move to its successor.
4. Reload and open the result again. Filenames and bytes come from the chain,
   not the local activity journal. Local history is only witnessed revision-ID
   navigation hints, not a complete onchain version inventory.
5. The floating cost meter leads with **estimated Base USD**, with actual
   recorded local receipt gas on a separate line. Expand for recent actions
   and the running total: Action, Gas, Ethereum L1, Base, ZKsync. Duplicate
   transaction hashes count once; reverted included transactions count; missing
   or contradictory receipts stay unknown and qualify the known subtotal.
   Ethereum/Base execution-only estimates use the server's dated snapshot and
   **exclude L2 data/operator fees** unless manually entered. Advanced assumptions
   are editable for those two modeled networks and retained during this page
   session; the old config's other networks are filtered out by ID in the browser.
   **ZKsync is Not measured**: EraVM pricing is not local EVM gas times a fee,
   and this screen deliberately provides no numeric ZKsync model. None of these
   numbers are live quotes, all-in fees, or cross-chain benchmarks.

One logical write is an exact signed plan and atomic Ledger batch. The demo
signs both the EFS intent and the outer local transaction in software; this
does **not** establish real-wallet popup count, sponsorship or account-abstraction UX.
Receipt matching establishes RPC-observed direct transaction attribution, not
a state proof. Canonical EFS effect reconciliation remains a separate check.

## Measure and test

```sh
node script/compact-browser.mjs --measure
EFS_LISTING_MODE=audit node script/compact-browser.mjs --measure
```

Run one at a time. Each fresh run deploys under normal 24,576-byte runtime,
49,152-byte initcode and 30M block limits, measures actual signed receipts and
checks EFS effects. Reports and journals go to a printed run-owned temporary
directory; retain wanted reports before cleaning temporary storage. Deployment
and paid-wrapper deployment costs are separate from file-action costs.

Default `live-positive` maintains live FOLDER candidates alongside retained
audit/history. Its swap-removal order is not a filename sort or change feed;
continuations require the exact same admission/block basis. A late index does
not claim complete coverage. `audit` is the historical candidate implementation
for a matched comparison, not a second product direction.

The measured workload prices 0/41/1024/4096/8160-byte documents; file/revision
tags; lifecycle operations; an unrelated approval-and-publication contract;
paid reads with 1/8/32/64 authors; and 128 renames of one file beside four other
live files. It is not a 1,000-live-entry, global-tag or worldwide-scale result.

## Deliberate limits

- Explicit Files and Archive mounts, not a nested Directory/path profile.
- ASCII lowercase names, inline bytes, 8192-byte record bodies (prefix included).
  These are lab limits, not frozen product requirements. No image MIME preview,
  IPFS/Arweave backend, encrypted directory or live-contract-file adapter here.
- Structural acceptance and selection are distinct from an app's current
  policy truth. A retained revision is not eternally valid under every policy.
- Cross-author selection dependencies are checked before broadcast, not
  atomically at inclusion. Own authored HEAD changes use onchain CAS.
- Native contract authors work locally, but native source-state proof/import,
  stable historical identity across upgrades and recovery are not completed.
- Synthetic EIP-7702 marker tests are not a real Prague authorization run.
- Direct deployments only; no claim that the populated compact state is
  upgrade-safe. The fuller prototype's upgrade evidence does not transfer here.

Source anchors: [adapter](compact-sdk.mjs), [real-chain journey](integration.test.mjs),
[third-party app](../test/FilesApplication.sol), [live index](../test/FilesLiveIndex.sol).
The canonical planning/main completion report and build plan are in
`Reviews/2026-09-12-efs-path-decision/compact-prototype-results-20260914.md` and
`compact-mvp-build-plan-20260914.md`.
