# Integration notes for Codex — export/wallet lane, 2026-09-10

Written for the programmable-Type-acceptance lane. Everything here is local,
disposable prototype work on `fable/2026-09-09-files-browser`; nothing is
frozen, deployed, or proposed for promotion.

## The one shared-contract change you must know about

**`contracts/src/FilesRouterV2.sol` now enforces `intent.byteCommitment`.**
Before this pass it was signed but never compared to anything — the previous
checkpoint's claim that it "constrains content" was wrong, and the
data-readiness review was right to call it audit metadata.

What the router now does, immediately before `core.executeAuthorized`:

| Op kind | Required `intent.byteCommitment` |
| --- | --- |
| `CREATE_FILE` | `keccak(abi.encode(treeId, keccak(treeBody)))` from the publication's **own** leaf 2 (ChunkTree), and leaf 3's `FileRevision.content` must equal that leaf's record id |
| `EDIT` | same, derived from leaf 0 (ChunkTree); leaf 1's `FileRevision.content` must equal it |
| everything else (`CREATE_DIR`, `COPY`, `RENAME_MOVE`, `REMOVE`, `RESTORE`, `TAG`, `UNTAG`, placement) | **zero** |

New error `ErrByteCommitment(bytes32 expected, bytes32 got)`; the
revision/tree mismatch reuses `ErrTemplate` with code `8`.

**The integration hazard:** this is fail-closed. Any *new* content-carrying
op kind you add must set `expectedByteCommitment`, or correctly-formed
operations will be refused at the router with `ErrByteCommitment(0, …)`.
Conversely, any new non-content kind must send zero. `COPY` is deliberately
in the zero row: its bytes are already pinned through `revision.content`
inside the signed publication hash, so a second commitment would be
redundant, not stronger.

`contracts/src/AuthorityUpgrade.sol` is **unchanged** this pass.

## Things that will surprise you if you reuse the fixture

- `test/nested-fixture.mjs` now reserves an **unclaimed** wallet principal
  (`WALLET_PRINCIPAL`) and re-mounts the `aFirst`/`bFirst` lenses so it is a
  real source in both the namespace and content plans. **Mount ids for those
  two lenses changed.** The `exact` lens is deliberately untouched: it means
  unanimity, and a third never-claiming source would make every name ABSENT.
- Consequence for measurements: each listing costs exactly **one extra page
  read** (the reserved principal holds no claims but is still enumerated).
  Churn numbers were re-measured; `evidence/churn-perf.json` is current.
- Why this exists at all: a freshly claimed principal authors records that no
  lens selects. Writes confirm on-chain and are then invisible — the
  "confirms-but-unreadable" shape. Reserving a principal that is *in the
  plans* is what makes a real wallet usable here.
- `scripts/environment.mjs` `writeConfig` gained `sponsor` (url, payer
  address, label) and `walletPrincipal`. **No sponsor key is ever served**;
  it stays in the relay process.

## What the export format now guarantees (and what it does not)

`EFS_FILES_EXPORT_V1` — `sdk/export-bundle.mjs` assembles,
`scripts/verify-export.mjs` verifies offline. If you consume exports, read
the tier labels rather than the exit code:

- **SELF-CONSISTENT** — recomputed from the bundle's own bytes (record ids,
  chunk trees by the record's own geometry, the selection graph, the
  DirectoryEntry chain from the mount root). A fabricated-but-coherent bundle
  reaches this tier too. The verifier never says "exists" here.
- **TRANSCRIPT-ATTESTED** — which revision is current, and record existence,
  supported by the retained pinned RPC transcript. Evidence, not proof.
- **ANCHOR-DECLARED** — chain id, block hash, Core address, mount/subject.
  The bundle cannot prove its own anchor. `--recheck-manifest` emits the
  consumed reads so any RPC you trust can replay them; that replay is what
  promotes transcript claims.
- **NOT-PROVABLE-OFFLINE** — authorship. Author signatures are checked at
  admission time on-chain and are not exportable, and operator-era admissions
  are indistinguishable from author-intent admissions in record content.

Closing the fabricated-anchor gap properly needs `eth_getProof` state proofs
against `header.stateRoot`. That is real new scope and is **not** built.

## Boundaries respected

No edits to your worktree, no programmable-Type acceptance work, no main
merge, no deployment, no protocol freeze, no real funds. Own local chain and
ports throughout; every signer is disposable and generated per run.
