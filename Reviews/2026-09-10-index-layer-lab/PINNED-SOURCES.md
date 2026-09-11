# Pinned sources

Vault HEAD when the lab was created: `c833ecd508643852aea372400bd44a771f50641c` (branch `fable/2026-09-09-files-browser`).
Last commit touching `Reviews/2026-09-05-c0-core/src`: `bcd0643a9bd5f4d16711680e811ef1e266813438`.
Last commit touching `Reviews/2026-09-08-upgradeable-foundation/src`: `bcd0643a9bd5f4d16711680e811ef1e266813438`.

## src/ — byte-identical copies of Reviews/2026-09-05-c0-core/src (23 files, verified with cmp)

```
b9051ba86b537a3009e7aefa72ec9e863c76deb451244f0e083b6d72ae9d8a6b  AdmissionLibrary.sol
cf910ecaf1d052f31af1cc0b708f7bf03d05b2544ee9c698649ca5bb9bbe5b7e  AuditPageCursor.sol
60c77bc852696038db3004839178e212798befe87def329833c7a88db5b5b793  BindingFold.sol
d30e55ad0e2f745d3898bfed097d2d6a6ce4433c9b076191a35f261d2c46ca4a  C0BatchEvidence.sol
6a22bb14be970c5b6de13bd1948cdb0160329ade91971212793d5801fb8b7dc3  C0InitializationSelection.sol
68dff8d1ce4b1e14c34644935ca0ccd37ed8b7d0fb8f88e15fbf437cffe01d4d  C0PlanCodec.sol
186391d95700d7a90857cef611a15b4310fba3ff488d1334f8da86f8c424713a  C0Request.sol
7cacffd4bdda83577c8ad4f017913443e1cd50858c7a98327cf4a9e63c566178  C0RunCodecV2.sol
7f7fb43c04d860b8e23c9c58395c200acf1d29ff05aac98e255740f070b8f7e2  IndexKeys.sol
de0bf7dc02f2aed645bee86f1b67c1208a4b003f52549946f33bcf01f4806021  LensPlan.sol
ea29633cb408f56038104e7f1d599fd40df6497ccf757ba9ad063254286d500e  PointReadLibrary.sol
d1a19cf6e0b0e46f108c9793f9e6aa1e0e884729be41c175bfe55241a26b9351  Preparation.sol
ec406f2f233b04ce52370999781f9fe9fec9ce17cce74289eeea8b141eef03ab  PreparationHelper.sol
55f099288ee982590a999e048e7bbe86525f0e3c94220de1262bee4818184965  QueryReadLibrary.sol
dd40a71f4469977e867d59a751c7de35c268de57aca56da223df0c32f547bfff  RecordBody.sol
c2d87349809b4253683c8a950cc972899dcff394172482279451c6b9deb8be8d  StateAuditPages.sol
c079c8e898aee1ad76b4690543b1d3b569fdac7d54dcecec81291914601d6220  StateBindingReads.sol
3de963a06a1fa6f74a66d41a407176f9de7d74367663f3e28c7650e48b8e2f10  StateKernel.sol
e908de2f6491168ad2f019610f9ad77bdebb2b3ea354810d99dd8852022093cb  StateLensReads.sol
218c62a44626c6756e92acb8569087667924c9a2289af9e8780998e25a3fe1ba  StatePointReads.sol
8b0ed02e911d27ac873050bed01eee75ea3819e96a36a3727762cbc4e0dfd2de  StateReadPrimitives.sol
363519eb2fe1b683a9f7873ea8f482bcf8f7e11193c230ba090db3f2cdb87ffa  StateStore.sol
78748bfc0ca870e0e008ba85258c79fa87d5ae2aab31f605a03afabe0328dea7  StorageByteView.sol
```

## foundation/ — copies of Reviews/2026-09-08-upgradeable-foundation/src (5 of 6 files)

One edit: `UpgradeableFixtureCore.sol` marks `executeFixture` `virtual` (two comment lines added) so the U4 core can retire the un-hooked operator path. Original sha256 of that file: `c2b328a33d70504c849ae99538975a45c77c0838ed1e68992f9bcdf1e3926a44`.

```
8183346e15e882eb75714956e4dd447738aded27726b0fffa797ec8551ea486b  UpgradeAdmissionLibrary.sol
28f02cb849703fa6158748a3f70108f092d4495f6bf42ef525c1606ab96038ec  UpgradeQueryReadLibrary.sol
aae25edb210402f5fa96cd145645e7e447d251d0c250d52ac32230da301c140f  UpgradeStorage.sol
601aa975c1cea949445c27dafa4264df769fa55141b194f9325ecc9e8954147f  UpgradeableFixtureCore.sol
c1d60b6f13ec9958d7b7e7e9ba9fdcd6294d82a712aa22c8fe6cee22ecddb32f  UpgradeableReadFixtureCore.sol
```

## lab/ — the lab's own contracts

```
2abfb045e7026bc1c7a667902935a43b345fdb8672637726f377131b3df5b0b8  FieldWalk.sol
d25c6a8e216ce12ada58722ca237e042aba952331a4db99df306befd3812bd78  IndexLayerModule.sol
d066811392602e02c64e52ec67ca655c254c0fd24864c37e7873ad67b2369e14  IndexLayerStorage.sol
2fa764d5e81960d8aadaac59d77ab42495b01af373d9fdb191cf8f381fb01ff5  IndexedAdmission.sol
6b6f494115d87ddf1267afe16e359c4618b3ac6439f11b51106043694857abd7  LabCoreU4.sol
```

## Second pin (round 2, 2026-09-10 late evening) — Codex's K10 patch applied to `src/`

Applied: `git diff 832c7ae..fe98f18 -- Reviews/2026-09-05-c0-core/src` (branch
`origin/codex/mvp-c0-coherence`, commits `5a3520d` → `c38b1f4` → `fe98f18`),
path-rewritten to this lab's `src/` and applied with `git apply` (clean; the
lab's first pin was byte-identical to `832c7ae`, verified with `cmp` against
`git show 832c7ae:…` before applying). The four patched files are now
byte-identical to `git show fe98f18:Reviews/2026-09-05-c0-core/src/<file>`
(verified with `cmp`); the other 19 files keep their first-pin hashes. The
shared `Reviews/2026-09-05-c0-core/src` was NOT touched.

```
9e5617a01b417b3ea1e5f2d86786b016c82f898fb8c5caaa2c538c48cea3d84a  StateStore.sol
b7b90cee7d348e544e832d69b79800e91227c3ac8f958857d9c8266edb2e6be8  StateKernel.sol
1ff08cce1085fc3802c0496c8d00f13d8b9dfa3901a0fa084c9f37750a075d2e  StateReadPrimitives.sol
7af536b6f09f03f646412d8909d8d62cfb7cce940473db71ffe004c81a253099  StateAuditPages.sol
```

What the patch changes for this lab: `StateStore.Store` gains one appended
`uint256 scopeLayout` (Store slot 28, after the six inventory mappings; nothing
before it moves), `StateKernel.selectScopeLayout` (pre-initialization only),
`initialize`/`admit` refuse unknown layouts, `bindingEffect` appends
`p.count.bindingKeys` instead of the admission ordinal to kind 10 in mode 1,
and the readers (`StateReadPrimitives.scopeBound` / `firstBindingAdmission`,
`StateAuditPages` prefix filtering + cursor contexts 3/4) recover admission
time through kind-8 word 0.

Compiled in the lab (solc 0.8.30, optimizer 200, via-IR, Cancun) after the
patch — runtime bytes: `UpgradeAdmissionLibrary` **24,553 (23 bytes of EIP-170
headroom, exactly Codex's figure)**, `UpgradeQueryReadLibrary` 21,557,
`PointReadLibrary` 12,103, `IndexedAdmission` **7,311** and `IndexLayerModule`
**11,715** (final round-2 artifacts, as recorded in every `environment.json →
codeSizes`; the 6,933 / 10,968 first noted here were the step-1 intermediate
build before `ScopeOrdinals`), `UpgradeableFixtureCoreU4` 21,854. After the post-review `ScopeOrdinals` fix (an
added revert; matrix re-run 2/2 green, `evidence/matrix-run.txt`) the lab
artifacts are `IndexedAdmission` 7,337 and `IndexLayerModule` 11,741 (+26 bytes
each); the measured runs in `evidence/n1000-*` used the 7,311 / 11,715 builds.

The **populated-pair path is unaffected by the patch**: `indexLayerFixture`
links the U4 core and the hook to the admission library the foundation
deployed at genesis (compiled from the shared, unpatched `c0-core/src`; the
controller pins its codehash), so that world stays on the legacy kernel and
`scopeLayout` reads 0. Expected and recorded: the lab-compiled
`UpgradeAdmissionLibrary` artifact differs from the genesis one and is only
ever deployed by the fresh-world arm (§9.3). Codex's `K10Scope.t.sol` /
`K10ScopeHarness.sol` were not brought over: the mode-selection seam they
demonstrate (`selectScopeLayout(s, 1)` before `initialize`) is reproduced by
the lab's own U1 core (`lab/LabWorld.sol`), and the forge test depends on
`BindingReadHarness` / `AuditPages.t.sol` / `StatefulHarness` and a
`vm.readFile` permission that the lab does not otherwise need.

Lab file hashed after the step-1 position fix (intermediate; superseded by the
inventory below once `ScopeOrdinals` was introduced):

```
96cb5e5033efa41486a9187f4dcc7133962fe654440d21b87656b69f166052ae  IndexedAdmission.sol  (step 1, superseded)
```

## Round-2 foundation and lab inventory (2026-09-10 late evening)

`foundation/` now holds 6 files. Two edits, both marked `LAB EDIT` in the
file: `UpgradeableFixtureCore.sol` has `executeFixture` `virtual` (round 1)
and `initialize` `virtual` (round 2, so the fresh-world U1 core can call
`StateKernel.selectScopeLayout` before `StateKernel.initialize`).
`UpgradeableFixtureCarrier.sol` is a byte-identical copy of the foundation's
(needed by the fresh-world deployer; the `C0Foundation/` remapping was added
to `foundry.toml` for its `C0ChunkTree` import).

```
8183346e15e882eb75714956e4dd447738aded27726b0fffa797ec8551ea486b  UpgradeAdmissionLibrary.sol
28f02cb849703fa6158748a3f70108f092d4495f6bf42ef525c1606ab96038ec  UpgradeQueryReadLibrary.sol
aae25edb210402f5fa96cd145645e7e447d251d0c250d52ac32230da301c140f  UpgradeStorage.sol
30e845def382a687309038a48b36396cec90f96b28b56f756997efd35db5f290  UpgradeableFixtureCarrier.sol
95ac7829173c70ed00ecaf838256e6a550dee1586985a33414472520c2efc3ae  UpgradeableFixtureCore.sol
c1d60b6f13ec9958d7b7e7e9ba9fdcd6294d82a712aa22c8fe6cee22ecddb32f  UpgradeableReadFixtureCore.sol
```

`lab/FixtureDeployment.sol` is a copy of
`Reviews/2026-09-08-upgradeable-foundation/test/FixtureDeployment.sol` (sha256
of the original `53fee31b4b27c22761ded6d900eb4fb705e3437ba8cc7dfa8ea02b656547830e`) with its three `../src/` imports rewritten to
`Foundation/` and a two-line header comment; `diff` against the original
shows nothing else.

Lab contracts after round 2 (re-hashed after the post-review `ScopeOrdinals` fix, 2026-09-11):

```
2abfb045e7026bc1c7a667902935a43b345fdb8672637726f377131b3df5b0b8  FieldWalk.sol
e91e02b90f8744863d89494c51aa32eb4c575979ee85771aa02a6793e329728e  FixtureDeployment.sol
0b9425abfd09e4dc0e5632e159490ba0b3c76e233192e794d275c5892f7e3489  IndexLayerModule.sol
d066811392602e02c64e52ec67ca655c254c0fd24864c37e7873ad67b2369e14  IndexLayerStorage.sol
61872f11bcb676086e0acf13eed3528567507a8494ec9a17252aef8d97cab46a  IndexedAdmission.sol
6b6f494115d87ddf1267afe16e359c4618b3ac6439f11b51106043694857abd7  LabCoreU4.sol
fdf210824afca95cc97e6088c939b296b22c300326aaf83fc21e61318bb86551  LabWorld.sol
cc5b82d317b0c9546366b93f78c3369954d13c7dec3d0ed11f4341b3a9e26fdf  ScopeOrdinals.sol
```
