# Road B lab — compact EFS ingestion kernel

**Disposable lab, no protocol claim.** 2026-09-12. Built for the [path-decision sprint](../README.md) as the Road B discriminating experiment ([road-b.md](../road-b.md) §6/§8, plus the coordinator's deltas and pre-seal checks). Nothing here is compiled, run or measured yet: see `TODO.md` for compile risks and the lease request, `MANIFEST.draft.json` for the run contract. Every gas figure anywhere in this directory is **ESTIMATED**.

## What this is

Four contracts with one responsibility each, no dependencies (no forge-std, no remappings):

| file | responsibility |
|---|---|
| `src/Ledger.sol` | single-pass ingestion kernel: admits typed, content-addressed records under an authenticated author; ordered-prefix batch (`execute`), signed envelopes (`executeSigned`, EIP-712 `PublicationIntent`), import with separate destination authorization (`importPublication`); writes the minimum durable set (Record, Subject, Admission rows with re-encodable effect fields, Evidence cell per publication, Binding head with CAS/previous admission, shared PositionCell); keeps **no list**. |
| `src/IndexModule.sol` | the separate index responsibility: every posting list (scope, history, backlinks, by-Type, by-author) as five-48-bit-ordinals-per-word lists with a head word; called once per publication with a bounded CALL; a revert there reverts the publication; `coverage(family, scope)`. |
| `src/LensReader.sol` | path resolution, budgeted listing and as-of history under an ordered lens; mask beats fallthrough; no-tiebreak returns CONFLICT; cursors are bound to (basisAdmission, indexGeneration, rulesEpoch, coreCodeCommitment, scopeKey, lensHash, position). |
| `src/TypeRegistry.sol` | Type id → acceptor address + pinned codehash + checked-reference table; binding-role → expected target Type; rules epoch. |
| `src/Keys.sol`, `src/Interfaces.sol` | identity derivations copied byte-for-byte from `Reviews/2026-09-05-c0-core` (record id, position/binding/scope keys, posting keys) plus the lab-new subject and contract-principal domains; `IAcceptor`, `IIndexModule`, `ITypeRegistry`. |
| `src/LabHarness.sol` | `MockAcceptor` (accept / return-false / revert / burn-gas), `FailingIndexModule`, `Actor` (a genuine contract author), `Consumer` (paid reads that store what they read), `Reconstructor` (state-only re-encoding of a publication and source/destination digest checks). |

Tests: `test/LabBase.sol` (hand-declared `Vm`, `require` assertions), `test/LedgerMatrix.t.sol` (the §6 matrix), `test/LedgerEvidence.t.sol` (signature binding, portability, reconstruction, listing law, batch law), `test/LedgerImport.t.sol` (pre-seal checks 1–4). Measurement: `script/measure.mjs` (ethers v6; receipts per operation of the ingress × multiplicity cells, each from a sealed initial state; no ablation or interaction term).

## What is persisted, and why (ESTIMATED fresh slots)

| durable fact | slots | outcome it serves |
|---|---|---|
| Record: typeId, meta (first admission, length, occurrence count), body words (no `bytes` length slot) | 2 + ⌈len/32⌉ | portable data identity, dedup by id, "what still asserts this record" |
| Subject: subject id → create admission; `subjectId = keccak(efs2/subject/1, creatorPrincipal, salt)` | 1 | stable File identity independent of any path; same signed create ⇒ same id on any deployment |
| Admission row: kind, leaf, publication, binding ordinal, expected revision, withdrawn flag; `a`/`b` effect words | 1–3 | one row per action; a clean reader re-encodes the signed Action tuple from rows `firstAdmission..+leafCount` |
| Evidence cell per publication: author, proof kind, (r, s, v), nonce, deadline, acceptance profile, index obligations, actions hash, first admission, leaf count, basis, imported flag | 5 native / 7 signed | authorship closure recoverable from state alone; native ingress = chain-state witness, labelled |
| Source evidence (imports only): source realm, code commitment, intent context, signature, source principal, grade | 9 | source acceptance retained as evidence, never as destination authority |
| Binding head: state, revision, admission, previous admission, binding ordinal, target (BindingFold bit layout) | 2 | CAS; rename/move/remove keep evidence; c0's `unpack` reads it |
| PositionCell (purpose, subject, role) once per position, shared by all authors; binding ordinal → position | 3 (+1 per fresh key) | reconstruction and lens merge recover the preimage of a position hash |
| Counters (one word), nonces, publicationId → ordinal | 1 rewrite, 1, 1 | replay protection; exact retry ⇒ `AlreadyAdmitted`, no new rows |
| IndexModule lists (scope, history, backlink, by-Type, by-author) | ~0.4 fresh + 1 head rewrite per append (fresh list ≈ 2) | required discovery with a completeness witness; as-of reads by bisection |

Not persisted: journal, canonical envelope bytes, ordinal mirrors, per-record occurrence rows (the Admission rows are the occurrences). The matched control `ebc7d54` already has no journal; **no journal-removal saving is claimed**. What is tested is the fact set and its representation.

## Semantics the tests pin

- **Identities** are c0-core byte-for-byte: `recordId = keccak(abi.encode(keccak("efs2/record/1"), typeId, keccak(body)))`, position/binding/scope keys and posting keys (kinds 1/4/5/8/10) unchanged. Lab-new: `subjectId`, and contract principals `keccak(efs2/principal/1, 2, realmOrigin, address)` with `realmOrigin = keccak(chainId, coreCodeCommitment)`; EOA principals stay the padded address.
- **Bindings** are generic `(author, purpose, subject, role) → target`; the lab uses three purposes: placement `(FOLDER, folderId, nameHash) → subjectId`, head `(HEAD, subjectId) → recordId`, tag `(TAG, subject|record, concept) → stance`. A binding target must be an existing record (typed) or subject (untyped); a role may demand a Type.
- **Batch law**: ordered-prefix observation with sequential guarded writes and whole-transaction revert; `I → O` in one batch succeeds, `O` before `I` fails, wrong-Type `I` fails. Every publish/reuse re-runs references and the acceptor, dedup and reuse included. `publicationId = keccak(author, nonce, keccak(actions))`.
- **Signature** covers realm, code commitment, author, nonce, deadline, acceptance profile, index obligations and the full action tuples (unused fields must be zero). Domain = `EIP712Domain(name, version)` only, so the same signed publication can be imported into a second deployment with the same realm and code (then `importPublication` demands destination authorization anyway).
- **Point reducer**: first lens principal with any binding decides — live ⇒ FOUND, removal ⇒ MASKED (never fall through); absent ⇒ next principal. `resolveNoTiebreak` returns all live candidates and CONFLICT when there is more than one or a live next to a removal.
- **Listing law**: budgeted candidate scan; `items, scanned, hydrations, rawTotal, selectedSoFar, status ∈ {UNKNOWN, PARTIAL, COMPLETE}, mutated`; selected total only when the raw lists are exhausted; a stale cursor reverts; the same name under several authors is one selected entry (mask).
- **Index split**: the Ledger calls `IndexModule.onAdmission` once per publication; a revert rolls the publication back; coverage is COMPLETE only from admission 1 with no gap; optional families are declared and report PARTIAL.

## How to build and run (only under a granted lease)

```sh
cd Reviews/2026-09-12-efs-path-decision/lab-b
export FOUNDRY_OUT=/private/tmp/claude-501/-Users-james-Code-EFS/089e21d8-6171-40d6-9cac-1d2e941506f9/scratchpad/build/lab-b/out   # run-owned scratch; or use --out
forge build --use 0.8.30 --offline
forge test --use 0.8.30 --offline -vv
forge inspect Ledger storage-layout            # verify the ESTIMATED slot numbers in Ledger.sol
EFS_ETHERS_PATH=<node_modules/ethers> node script/measure.mjs --anvil   # spawns a finite-history Cancun Anvil (run-owned --cache-path) on a free loopback port, deploys, seals the state, runs every cell from it, kills Anvil; writes <scratch>/measure.json and <scratch>/lab-addresses.json
```

`script/measure.mjs` needs ethers v6: set `EFS_ETHERS_PATH` to a `node_modules/ethers` directory (it looks in `planning/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers` and the `planning-efs21` sibling worktree by default). Artifacts are read from `FOUNDRY_OUT` (fallback `./out`, read-only); every output goes under the run-owned scratch root (`EFS_LAB_SCRATCH`, default: the parent of `FOUNDRY_OUT`), never into this directory. It asserts the four exact payload controls' Keccak-256 values from `run-manifest.md` before doing anything and records the Anvil PID, port, argv and start/stop times. Options: `--rpc URL --deploy`, `--rpc URL --addresses <scratch>/lab-addresses.json`, `--out <file>`, `--skip-without-index`, `--mnemonic`.

What the script records: per cell of the **ingress × multiplicity** experiment (`native-one`, `signed-one`, `native-two`, `signed-two`) and per fixture (`quote` 32 B, `binary` 41 B): `create` (subject + record + head + placement, plus a state-only reconstruction check), `edit` (fresh body + CAS head rebind), `create-competing` (second author), paid consumer `read-resolve`, `read-resolve-second-first`, `read-list`, `read-history-asof`, and an `eth_call` estimate for the browser row. Every cell starts from the **same sealed initial state** (`evm_snapshot` after setup, `evm_revert` + re-snapshot before each cell) and writes a pre-state and post-state probe (the four control Record ids absent before the cell, author nonces, counters, scope/by-Type/by-author list heads). Then, each from the sealed state: the freshness controls (`contract-fresh-body` with a proved pre-absence, `contract-existing-body` with a proved pre-presence, exact-operation retry), the failure rows (wrong-Type/missing reference, stale CAS, failed acceptance) and the without-index-module pass. This is **not** the protocol's capability ablation (neither/authorship/selection/both) and no interaction term is computed; that ablation is listed as a later gate in `MANIFEST.draft.json`. A page with `mutated == true` is a mixed-basis page and must not be treated as COMPLETE by any caller. Fresh-slot counts are not traced; the JSON carries the design's estimates, labelled.
