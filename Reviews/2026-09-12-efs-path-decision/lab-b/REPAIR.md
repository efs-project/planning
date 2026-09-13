# Phase 2 — minimal authority repair (lab-b-authority, 2026-09-13)

**Standing.** UNRUN. Written under the no-compile rule (no `forge`, `solc`, `anvil`, `node`, `npm`); everything below is desk-checked. Pre-repair pin: branch head `e77f36d`, Core blobs identical to the `dcc7b94` profile pin. Post-repair pins: the working-tree blob hashes in the last section (uncommitted by rule; the coordinator publishes). Scope is exactly the 06:50 checkpoint: native-import/source-origin authority and exact Type identity versus separate Realm acceptance policy. No permanent bytes, no protocol choice, no third architecture, no owner ruling is claimed.

Findings that drove it: [FALSIFY.md](FALSIFY.md) (F1 unsafe, F2 safe, F3 unsafe, F4 unsafe).

## R1 — native-source import fails closed

**Change** (`src/Ledger.sol`):

| Where | What |
|---|---|
| `importPublication`, the `src.v == 0` branch (previously `src.grade = 0;` and continue) | `revert E_SOURCE_UNSUPPORTED();` before any write. |
| errors | `error E_SOURCE_UNSUPPORTED();` added. |
| `SourceEvidence.v` / `.grade` comments, `importPublication` NatSpec | Document that a native-source packet is unsupported here, why, and what would lift it. Struct and ABI unchanged. |

The EOA-signed import path (`src.v != 0`) is byte-for-byte the same logic: source signature verified over the claimed source context, `sourcePrincipal == Keys.principal(src.author)` enforced, separate destination authorization (signature under this Realm, or `msg.sender == author`), destination acceptance/CAS/index re-run, grade 1 retained.

**Effect on historical interpretation.** No grade-0 row can exist in state after this change (`grade` is always 1 in retained `SourceEvidence`). The retained diagnostic packets (`322b320`, `5960336`) contain no import cells, so nothing already measured is reinterpreted. `test_import_by_contract_author_keeps_source_subject` — which asserted the unsafe path as a feature — is replaced by `test_import_of_native_source_is_unsupported_and_fails_closed`.

**Effect on signatures/import.** None on signed packets. A contract author's publication cannot be moved to another Realm through `importPublication` at all; it can still be published natively at the destination as a new, destination-qualified subject (asserted in the replacement test). No source proof is invented: the packet's `realmId`/`coreCodeCommitment`/`sourcePrincipal` for a contract author remain claims that this Realm has no way to verify.

**Cost.** Grade-0 packets: one early revert, nothing written (strictly cheaper than before). Signed packets: unchanged (9 `SourceEvidence` slots + the publication, as estimated in `Ledger.sol`).

**What remains unsupported and why it is a limit, not a waiver.** Contract-author portability needs a declared source witness — (chain id, Realm deployment, account) qualification plus a finalized-state proof of the historical admission — verified at the destination. The handoff's "Native identity" bullet (qualify by original chain/Realm deployment and account, not codehash alone; `code.length` does not prove historical account kind) is the shape of that witness; this lab neither designs nor encodes it. Until it exists, the truthful answer to "import this native-source publication" is `UNSUPPORTED` (sdk-fixture step 10's rule: report the named check as unsupported, never wildcard success). Reporting `UNSUPPORTED` is not permission to drop the requirement.

## R2 — exact Type identity, separate Realm acceptance policy

### Identity (immutable, derived, reconstructible)

`src/Keys.sol`: `DOM_TYPE = keccak256("efs2/type/1")` and

```text
typeId = keccak256(abi.encode(DOM_TYPE, shape, keccak256(abi.encode(refTypes)), ruleId))
```

where `shape` is an opaque 32-byte shape commitment supplied by the registrant (the lab has no schema language; the lab's Type name hashes stand in), `refTypes` is the ordered list of expected Types of the leading checked-reference words (themselves exact ids, so the derivation is recursive), and `ruleId` is the declared rule identity = the acceptor's codehash at registration (0 = no rule).

`src/TypeRegistry.sol` (rewritten, same admin model):

| Surface | Before (`235174f`) | After |
|---|---|---|
| `register(bytes32 typeId, address acceptor, bytes32[] refs)` | caller-chosen id; **overwrote** `_types`/`_refTypes` in place; no return | `register(bytes32 shape, address acceptor, bytes32[] refs) returns (bytes32 typeId)`; id derived; `E_TYPE_EXISTS(typeId)` if it exists; stores the descriptor `{shape, ruleId, refCount, registeredAt}` and policy row 1 |
| `activate(bytes32 typeId, address acceptor) returns (uint16)` | — | appends a policy row (acceptor, codehash, epoch, block); identity untouched |
| `typeInfo(typeId)` | `(registered, acceptor, acceptorCodehash, refCount)` | `(registered, acceptor, acceptorCodehash, refCount, activation)` — acceptor/codehash are the **active policy row** |
| `descriptor(typeId)` | — | `(shape, ruleId, refCount, activations, registeredAt)`; reverts `E_UNKNOWN_TYPE` |
| `activation(typeId, index)` | — | `(acceptor, acceptorCodehash, epoch, activatedAt)`; reverts `E_ACTIVATION` for index 0 or > activations (no silent absence) |
| `typeIdOf(shape, acceptor, refs)` | — | the pure derivation as a view (for clients/checkers) |
| `setBindingRefType`, `refTypes`, `bindingRefType`, `epoch` | | unchanged; `epoch` now also bumps on `activate` |
| events | `TypeRegistered(typeId, acceptor, codehash, refCount)` | `TypeRegistered(typeId, shape, ruleId, refCount)` + `PolicyActivated(typeId, activation, acceptor, codehash, epoch)` |

`src/Interfaces.sol`: `ITypeRegistry.typeInfo` 5-way; `activation(typeId, index)` added.

Consequences: (a) a changed shape, ref list or declared rule is a **different Type id**, never a mutation of an existing one; (b) the identical descriptor cannot be registered twice; (c) the same descriptor registered on another Realm's registry yields the **same id** (asserted: `reg2.register(QUOTE_SHAPE, acceptor, []) == QUOTE`), so an imported record's Type means the same thing at the destination; (d) a clean reader recomputes the id from the retained descriptor without trusting the registry.

### Policy (append-only, per Realm registry)

`policy[typeId]` is the activation history: row 1 is written by `register` (the declared rule's acceptor), later rows by `activate`. `Ledger` reads the active row at every publish/reuse admission (dedup and reuse included, unchanged law), so activating fixture rule v2 changes future acceptance without touching the Type.

`src/Ledger.sol`:

| Where | What |
|---|---|
| `_applyPublish` | 5-way `typeInfo`; the active row index is packed into `AdmissionRow.meta` bits 152..167 (`activation u16@152`; no extra slot). |
| `acceptanceProfileOf` | 5-way destructure; formula unchanged: `profile = keccak256(abi.encode(profile, typeId, activeCodehash, epoch))`. |
| `acceptanceBasis(uint64 ordinal)` (new view) | `(typeId, activation, acceptor, acceptorCodehash, epoch, activatedAt)` of the row that admitted a publish/reuse admission, read from the admission row + registry history; reverts `E_NO_BASIS(ordinal)` for other kinds. |
| errors | `E_NO_BASIS(uint64)` added. |
| `AdmissionRow` layout comment | bit 152 documented. |

Binding-role target Types (`setBindingRefType`) are Realm placement policy, not Type identity; they stay mutable and epoch-bumping, as before. Activating `address(0)` (no enforcement) is allowed and recorded like any other row: a Realm weakening is a visible policy fact, not a Type change.

**Effect on historical interpretation.** Every publish/reuse admission now names the policy row that admitted it; historical reads report that basis (`acceptanceBasis`) rather than today's `typeInfo`. The signed `acceptanceProfile` in the evidence cell is unchanged in meaning and remains the author's commitment. For the retained `5960336` packet: its Type ids are name hashes under the pinned `dcc7b94` profile and stay interpreted under that pin; they are **not** the ids the repaired registry derives from the same names (see PROFILE.md "changed after dcc7b94"). Do not retrofit.

**Effect on signatures.** The profile fold is unchanged, and the epoch numbering for the same registration sequence is unchanged (one bump per `register`, `activate`, `setBindingRefType`). Two things differ: the `typeId` bytes inside `Action` tuples are now derived (so `actionsHash`, `acceptanceProfile` and the digest differ from the old vector for the same fixture), and the codehash folded is the **active** row's, so a policy activation makes every unsent signature over that Type stale (`E_INTENT(3)`) while every earlier admission keeps its recorded basis — the receipt-bound rule activation ruling E.B.4, now with the basis retained.

**Effect on import.** Destination acceptance runs under the destination registry's current row; the source basis (source profile, grade, realm) is retained verbatim in `SourceEvidence`; the destination's own admission rows carry the destination's row index. Asserted in `test_R3_import_reruns_destination_policy_and_retains_source_basis` (source v1 admits 3e9, destination v2 refuses it with `E_REJECTED` and nothing is written; a compliant packet imports with basis row 2 at the destination and row 1 at the source).

### Estimated cost deltas (fresh SSTORE = 22,100 pre-Glamsterdam / 110,020 under EIP-8037; rewrite 5,000 / 12,100; unmeasured)

| Operation | Before | After | Delta |
|---|---|---|---|
| `register` | 3 `TypeInfo` slots + (1 + n) ref slots + epoch rewrite | 3 descriptor slots + (1 + n) ref slots + 2 policy-row slots + epoch rewrite + 1 extra event | **+2 fresh slots** (~44k / ~220k gas) |
| `activate` | — (was an overwrite `register`: 3 rewrites + refs) | 2 fresh slots + 1 rewrite (`activations`) + epoch rewrite + event | new row: ~57k / ~247k gas |
| publish/reuse admission | 3 cold registry SLOADs in `typeInfo` | 3 cold registry SLOADs (descriptor header, policy header, policy codehash) + 1 return word; the row index shares the existing `meta` write | **~0** (no new slot; a few hundred gas) |
| `executeSigned` / `acceptanceProfileOf` | 1 `typeInfo` per publish/reuse | same count, one more return word | ~0 |
| signed import | unchanged | unchanged | 0 |
| grade-0 import | full publication + 9 slots | early revert | negative |
| `acceptanceBasis` (view) | — | 1 admission SLOAD (+1 record SLOAD for reuse) + registry `activation` (2 SLOADs) | read-only |

Ledger runtime was 16,699 bytes at `df23bbb`; the additions (one view, one packed OR, two errors) are a few hundred bytes — well under EIP-170.

## Tests

New `test/Falsify.t.sol` (Phase 2 form; the Phase 1 form that fails on `e77f36d` is retained at `FALSIFY.phase1.t.sol.txt`):

| Test | Asserts |
|---|---|
| `test_F1a_grade0_import_is_unsupported_and_mints_nothing` | `E_SOURCE_UNSUPPORTED`; no subject, publication, nonce or evidence row; the genuine holder then mints its own subject. |
| `test_F1b_grade0_import_by_contract_is_unsupported_and_mints_nothing` | same through the `msg.sender == author` path with a claimed contract-origin principal. |
| `test_F2_signed_source_packet_authorizes_nothing_at_the_destination` | negatives (a)–(d) and the legitimate grade-1 path (unchanged behaviour). |
| `test_F3_type_identity_is_exact_and_immutable` | changed descriptor = new id and `Keys.typeId` reconstructs it; `typeInfo`/`descriptor`/`refTypes` of QUOTE unchanged; old record reuses under row 1; stale epoch-N signature `E_INTENT`; old evidence reconstructs; identical descriptor `E_TYPE_EXISTS`; refs are identity; second registry derives the same id; `typeIdOf` agrees. |
| `test_F4_policy_activation_is_separate_from_identity_and_basis_is_recorded` | `activate` → row 2 active, descriptor untouched, epoch +1; retained v1-era record; reuse and new publish `E_REJECTED` under v2; `acceptanceBasis(1)` = row 1 (v1 acceptor/codehash/epoch), `acceptanceBasis(2)` = row 2; both rows readable; missing row and non-admission row revert loudly. |
| `test_R3_signature_under_epoch_N_rejected_after_activation_old_evidence_reconstructs` | stale signature `E_INTENT`, no write; epoch-N admission reconstructs (digest, recovered author) and keeps row 1; re-signed under N+1 admitted with row 2. |
| `test_R3_import_reruns_destination_policy_and_retains_source_basis` | destination registry with the same exact id and its own v2 row; rejected import writes nothing; compliant import retains the source profile/grade/realm, destination basis row 2 vs source row 1, id(F) preserved, both reconstructions hold. |

Adapted existing tests: `test/LabBase.sol` (ids derived in `setUp`, `*_SHAPE` constants, reconstruction check), `test/LedgerMatrix.t.sol` `test_checked_references_direct_batch_dedup_reuse` (tighter refs = new Type, PAIR untouched; the re-check lever is `activate` with a refusing MockAcceptor, `E_REJECTED` instead of `E_REF_TYPE`; basis rows asserted), `test/LedgerImport.t.sol` (grade-0 test replaced), `test/LabelType.t.sol` and `test/JoinedConsumer.t.sol` (derived `LABEL`/`QUOTE_J`). Expected count: 32 existing (one replaced) + 7 new = 39.

## Still unsupported / open after this repair

- **Native-source import** — unsupported by design until a verifiable source witness exists (R1). Local native authorship unchanged.
- **Replay domain** — the `(name, version)`-only EIP-712 domain (PROFILE.md "FUTURE replay-domain repair") is untouched; out of this scope.
- **Descriptor `shape` is opaque** — there is no schema language in the lab; a real Type description needs one. `ruleId = acceptor codehash` makes ids compiler-setting-dependent; a rule-id scheme is the fuller design's job.
- **Registry per Realm** — in the tests one registry serves both Realms unless a second is deployed; "Realm policy" means "the registry the Ledger pins".
- **`script/measure.mjs` adapted after the commits** (`node --check` only; TODO.md §H): ids resolved three ways from the registration receipts (log, `typeIdOf`, local derivation) and retained in `report.types`; `JoinedConsumer` deployed after registration; three new sealed cells `policy/activate`, `failure/refused-re-registration`, `failure/unsupported-native-import` (manifest rows updated). Still UNRUN.
- **`vectors/profile-b.json` stays the `dcc7b94` vector**; a new vector under the changed profile is owed after a build.

## Compile risks (desk-checked only)

1. `TypeRegistry.register` passes a `bytes32[] calldata` to `Keys.typeId(bytes32[] memory)` — implicit calldata→memory copy; fine in 0.8.30.
2. `try registry.activation(QUOTE, 3) { … } catch` / `try ledger.acceptanceBasis(3) { … }` / `try registry.register(…) { … }` — `try` on external calls with return values and no `returns` clause; allowed.
3. Return-variable names `activation_` / `epoch_` in `TypeRegistry` avoid shadowing the `activation` function and the `epoch` state variable; `Ledger.acceptanceBasis` names a return `activation` — `Ledger` has no member of that name.
4. `test/LabBase.sol` `QUOTE`/`BINARY`/`ITEM`/`PAIR` became storage variables; no test helper marked `pure` reads them (checked: only `quoteBody`, `fill`, `nm` are `pure` and use none).
5. Struct literal field order: `TypeInfo(true, refCount, 0, block, shape, codehash)` and `Activation(acceptor, uint48(e), uint40(block.number), codehash)` match the declarations.
6. New 5-way `typeInfo`, 6-way `acceptanceBasis`, 5-way `descriptor`, 4-way `activation` destructurings — arities checked by grep against the declarations.
7. `test/LedgerMatrix.t.sol` now imports `MockAcceptor` from `LabHarness.sol`; `refuser` shares MockAcceptor's codehash with `acceptor` on purpose (a policy row with a different address, same code).
8. `uint16` wrap guard in `_activate` (`index == 0` after `+1`) — unreachable in practice; harmless.

## Changed-source pins

Working-tree Git blob hashes (`git hash-object`) after the final desk-check; nothing committed (branch `fable/2026-09-12-road-b-lab`, base `e77f36d`). Pre-repair Core blobs are the PROFILE.md `dcc7b94` pins.

| File | Before (`e77f36d` = `dcc7b94` Core) | After |
|---|---|---|
| `src/Keys.sol` | `a291be9446ed1e4c2cb9bb14608ae7ca06a1c238` | `4386f0384b90be03d50cdfa4e109971511dd2c8f` |
| `src/Interfaces.sol` | `3155357f6d3e58c910828df2eb798ecb53ea24f9` | `8e22a8c5cbe3095fa9930223121c96c3a2eb0359` |
| `src/TypeRegistry.sol` | `235174fb951ba28084723448bd89ecfda340a6ec` | `d81a88ee987e8c4f5306cb7faacf2551d044de5c` |
| `src/Ledger.sol` | `c454e2699b9335c0a23bbfb6ed72e1ba0e5c7a14` | `a60ab9a419a26f7bb6139811f706e58e7e144af9` |
| `test/LabBase.sol` | (e77f36d) | `6a19dc46ec1b40f3c61e1ba48e09d41e3792c519` |
| `test/LedgerMatrix.t.sol` | (e77f36d) | `e82a8b30fed8d0d4d91c011435d421eab4b22764` |
| `test/LedgerImport.t.sol` | (e77f36d) | `3f74d63fdd623cca48c8a85dcb0b8e8f426c536e` |
| `test/LabelType.t.sol` | (e77f36d) | `01053f4b54a0fe9f303ea7e5efd3fa768705f925` |
| `test/JoinedConsumer.t.sol` | (e77f36d) | `8abc703279638b512273038057c3f0c7436aefed` |
| `test/Falsify.t.sol` | — (new) | `33c4adb3e52c292eee54d27222e5d2866aba0f9d` |

Untouched: `src/IndexModule.sol`, `src/LensReader.sol`, `src/LabHarness.sol`, `src/LabAcceptors.sol`, `src/JoinedConsumer.sol`, `test/LedgerEvidence.t.sol`, `script/measure.mjs`, `vectors/*`, `evidence/*`, `foundry.toml`.
