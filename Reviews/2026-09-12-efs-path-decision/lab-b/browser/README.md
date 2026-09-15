# Clickable compact Files prototype

## Guarded byte carriers and Concept labels (Task 4B)

Run `node script/carrier-browser.mjs` with the existing ethers/Anvil/artifact
environment below. This starts a **fresh** guarded proxy/Directory fixture plus
a separate ephemeral raw-byte transport. It never connects to the owner's legacy
server or chain. Ctrl-C closes the browser server, raw transport and owned Anvil.
`script/directory-browser.mjs` remains the Task 4A inline-only fixture;
`script/compact-browser.mjs` remains the older unguarded explicit-mount fixture.

Select a File and choose **Open verified bytes**. No external payload is fetched
from a list or merely selecting a row. Each external open requires the visible
origin checkbox. Download is exact inert `application/octet-stream`, including
NUL, invalid UTF-8 and genuinely empty files. Text editing is explicitly UTF-8;
there is no filename-based media inference. Preview accepts only CRC-checked,
successfully decoded static RGBA8 PNG, at most 2048 pixels per dimension and
1,048,576 total pixels. HTML/SVG and other image profiles remain inert downloads.

New-file upload offers onchain inline (8160 stored payload bytes) or the explicitly
named **local external fixture** (1 MiB stored bytes). The latter is a byte-only
PUT/GET driver, not a Files backend or IPFS durability service. It independently
checks SHA-256 before retaining an object, allows only the current loopback UI
Origin for browser writes, refuses redirects/credentials, and is limited to 32
objects / 8 MiB total. It refuses excess data instead of evicting another object.
Objects disappear when the fixture stops; a successful byte upload followed by a
cancelled/failed Ledger action may leave an unreferenced object until then.
Transport permission and 5-second timeout / 1 MiB streaming cap are host controls.

Optional supplied 32-byte hexadecimal AES-GCM keys encrypt before publication.
The 16-byte authentication tag counts toward storage limits. The sample
`encrypted.bin` uses the **public disposable key `11` repeated 32 times** (also
printed by the runner), not secret data. Missing key is OPAQUE, wrong-key/auth
failure has its own reason, and corrupt ciphertext fails digest verification
before decryption. Keys are not written to the SDK journal. Public names,
metadata and plaintext hashes remain visible: this is not private enumeration,
key distribution, recovery, or a full privacy claim.

Exact new ordinary Types, only under `contentProfile: raw-sha256-aesgcm-v1`:

- Bytes: `[SHA256(payload), payload]`, no Record refs, 32–8192 body bytes.
  Mandatory rule hashes supplied calldata once. Descriptor checks later use
  the pinned Bytes Type, retained length and digest header, not a cold full-body
  rehash. This compositional check keeps the unchanged 300k acceptance gas cap.
- ContentDescriptor: 352 bytes / 11 words: Bytes Record ref, version=1,
  carrier (0 inline / 1 raw external), hash algorithm=1 (SHA-256), stored length,
  stored digest, authored media (0 binary / 1 UTF-8 / 2 PNG), cipher (0 / 1
  AES-256-GCM), left-aligned nonce12 with zero padding, plaintext length and
  plaintext digest. External descriptors reference the canonical empty Bytes
  sentinel; they do not put a URI into identity. Identifier is exactly
  `efs-raw-sha256:<64 lowercase hex>`, not an arbitrary IPFS DAG root.
- Carrier root revision `[descriptor, File]`; child `[parent, descriptor, File]`.
  Exact refs are `[Content]` / `[any Record, Content]`. The finite parent set is
  old inline Root/Child and new carrier Root/Child, with same-File checks.
  Old inline Types and their offsets remain unchanged; no reverse transition
  into their old child rule is claimed.
- Concept: nonzero 32-byte namespace + 1–128 printable ASCII label bytes.
  Its Record ID is the existing TAG role. UI label lookup uses the root Directory
  namespace, or an exact supplied Concept ID. Equal labels do not imply global
  authority. File versus selected-revision tags stay distinct; Directory tags
  apply only to the stable Directory descriptor, never to all descendants.
  Missing label bytes remain unknown. Legacy `id(text)` tags are not reinterpreted.

`createFilesCompactSdk` injects pure content codecs into the **same guarded SDK
engine**, not another Files engine or journal. `prepare` accepts
`content: {bytes, media?}` or `{descriptor, bytes?}`; external descriptors do not
require a transport inside signing. `readContent({file, record?, context,
authors|principals, loadCarrier?, signal?, maxBytes?, key?})` returns separate
AVAILABLE_VERIFIED / UNAVAILABLE / CORRUPT / OPAQUE / UNSUPPORTED states, pinned
File/revision/basis, and verified bytes only when available. `record` explicitly
opens historical immutable content without moving HEAD. `readConcept`,
`conceptId` and generic `readTag` retain label and TAG qualifications.

The required `FilesCarrierIndex` composes the accepted Directory/Names index and
adds carrier-child parent postings. Ledger is unchanged. Admission validates
onchain descriptors and retained references, **not unprovided remote bytes or
plaintext**. SDK download integrity, ciphertext authentication and plaintext
commitment checks are separate evidence. The old joined Solidity consumer remains
an inline-profile consumer; a contract can inspect new structured metadata using
Ledger records, but remote payload use requires supplied bytes or a separately
supported witness. No portable state proof, broad paid-read adapter, global tree,
public deployment, real wallet or all-in chain fee is claimed here.

Browser opens reuse the accepted navigation/read-generation lifecycle. Navigation,
selection and Lens changes cancel obsolete results and release old preview URLs.
Only the new carrier entrypoint imports carrier modules; the legacy app's closed
allowlist has no reverse imports. Tests: `compact-content.test.mjs`,
`compact-carrier-host.test.mjs`, `carrier.integration.test.mjs`, the existing route
regressions, and `test/FilesCarrierProfile.t.sol` (including inherited Directory
bypass/rollback tests under the composed index).

## Guarded typed Directory graph (Task 4A)

The separate `node script/directory-browser.mjs` entrypoint starts a **fresh**
private loopback chain/proxy and selects `manifest.filesProfile =
'typed-directory-v1'`. Use the same existing ethers/Anvil/artifact environment
described below. It does not attach to, restart, or migrate the original demo.
The required Directory index is installed before admission one; the real root
is then CREATE + PUBLISH, not a magic mounted hash. Config anchors only that
root, never child labels or a directory inventory. Ctrl-C closes both servers.

Select a Directory row, then **Open directory**. Breadcrumbs and the `#/...` URL
are exact Lens-relative navigation routes, re-resolved on refresh/Lens changes,
direct hash edits and browser back/forward. Superseded reads cannot replace the
current view; a route change closes the old write dialog and prevents any not-yet
broadcast transaction from that dialog. Already broadcast actions remain in Local
activity for reconciliation. Malformed routes refuse navigation, not infer empty.
They are not parent ownership. The new dialog creates directories; moving uses
an exact destination path with verified child browsing. An occupied selected
destination or mask requires explicit replacement confirmation before signing.
Removal masks one placement; restoring or reusing a name does not erase retained
records. New-file upload accepts up to 8160 exact bytes (including invalid UTF-8);
downloads remain inert binary. This Task 4A runner has no carriers/encryption;
use the separately pinned Task 4B runner above for those behaviors.

Shared SDK additions, only enabled by the guarded typed manifest:

- `readDirectory({directory, context})`: exact pinned descriptor/seed validation.
- `readPlacement({folder, name, authors | principals, context})`: qualified edge
  and target kind, separate from a File HEAD.
- `listFolder(...)`: `kind: file | directory | unknown | invalid` rows, with
  `kindCoverage` separate from membership and name coverage. Unknown kinds retain
  membership. Existing cumulative continuations remain same-instance/same-basis.
- `prepare({operation: 'createDirectory', name, salt, folder, ...})`: CREATE seed,
  immutable Directory descriptor and named placement. `plan.file` is the shared
  placement-target field and holds the Directory descriptor ID here. No HEAD.
- Existing `rename`, `move`, `remove`, `restorePlacement` accept File subjects or
  valid Directory IDs. Selected/masked destinations require `replace: true`.
  Exact source/destination heads for all declared Lens principals are guarded;
  writer CAS is retained separately, never added as a 65th principal.
- `compact-paths.mjs`: `encodePath`, `decodePath`, and `resolvePath({sdk, root,
  segments, authors | principals, context, budget})`. Status distinguishes PRESENT,
  ABSENT, MASKED, UNKNOWN, INVALID, PARTIAL, NON_DIRECTORY, and CYCLE. The budget
  counts root/edge operations, not RPC calls; 1–256 operations, default 64. Every
  observed edge retains selected author/revision/admission provenance.

This is a Directory **graph**, not a globally acyclic filesystem. A path detects
repeated Directory IDs only on that route. Aliases are valid. A new unasserted
`A/new → D` can appear after preflight; then moving A under D can succeed and form
a cycle without changing either guarded position. The real-chain test retains
this mixed-author phantom counterexample. No descendant preflight or optional
helper is claimed to constrain raw Core ingress. The required index enforces
typed parents/targets/self-link rejection while attached; malicious administration
remains outside that posture. No Core growth, portable source-state proof,
production wallet, hosted release, fee guarantee or joined-page/scale claim.

Tests: `browser/compact-paths.test.mjs`, `browser/directory-routing.test.mjs`, `browser/directory.integration.test.mjs`,
and `test/FilesDirectoryProfile.t.sol`. The separate entrypoint loads new modules;
the live legacy `app.mjs` imports none of them and its old allowlist is unchanged.

## Legacy explicit-mount runner only

Everything below describes `script/compact-browser.mjs`, the earlier unguarded,
explicit-mount experiment, including its historical test commands and limitations.
It is **not** the guarded Directory runner above. Toolchain setup is shared; after
building the artifacts, select `node script/directory-browser.mjs` for Task 4A and
use the Directory tests listed above. The preflight-only, synthetic-Prague and
direct-deployment limitations below belong to the legacy runner, not the guarded
profile's separately accepted evidence.

September 14, 2026. Disposable integration, not production SDK or protocol bytes.
This screen uses compact B, not the earlier fuller-model browser. Filenames,
content, selection and tags are read from the deployed contracts; configuration
contains no authoritative filename map or file data. No `/api/files` service.

### Run locally — legacy only

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

### Try it — legacy only

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

### Measure and test — legacy only

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

### Deliberate limits — legacy only

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
