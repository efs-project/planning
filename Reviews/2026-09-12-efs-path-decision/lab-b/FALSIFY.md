# Phase 1 — falsifiers against the current source (lab-b-authority, 2026-09-13)

**Standing.** Written under the no-compile rule (no `forge`, `solc`, `anvil`, `node`, `npm`); every "fails" below is desk-checked, not observed. Target: branch `fable/2026-09-12-road-b-lab` head `e77f36d`; the Core blobs are byte-identical to the `dcc7b94` profile pin (`src/Ledger.sol` `c454e26`, `src/Keys.sol` `a291be9`, `src/Interfaces.sol` `3155357`, `src/TypeRegistry.sol` `235174f`). Line numbers cite those blobs.

The Phase 1 test file as written against that source is retained verbatim at [`FALSIFY.phase1.t.sol.txt`](FALSIFY.phase1.t.sol.txt) (it compiles against `e77f36d` only). The live `test/Falsify.t.sol` is the Phase 2 (flipped) version.

Each F-test asserts the **safe** behaviour and is expected to **fail** on `e77f36d`; the `probe:` requires that precede the final assertion pin down the exact unsafe outcome so a failure cannot be an unrelated revert. F2 is the negative and is expected to **pass**.

## F1 — grade-0 native-source import mints and controls a claimed principal's subject

| | |
|---|---|
| Tests | `test_F1a_grade0_import_mints_subject_under_claimed_eoa_principal`, `test_F1b_grade0_import_mints_subject_under_claimed_contract_origin_principal` |
| Outcome on `e77f36d` | **FAIL (unsafe).** F1a: `eoaB` presents a packet with `v == 0`, `author = eoaB`, `sourcePrincipal = Keys.principal(eoaA)`, signs destination authorization for itself; the destination mints `subject(principal(eoaA), salt)`, binds `eoaB`'s head to it, the lens resolves it `FOUND` with author `eoaB`, the packet is retained as grade-0 "source evidence" naming `eoaA`'s principal, and `eoaA`'s own later `create(salt)` at the destination reverts `E_SUBJECT_EXISTS` (the id is squatted). F1b: an unrelated `Importer` contract claims the producer contract `alice`'s origin-qualified source principal through the `msg.sender == src.author` path with the same result; a second claimant is then refused, i.e. first claim wins the id. |
| Evidence | `src/Ledger.sol:257-272` — the `src.v != 0` branch verifies the signature and `sourcePrincipal == Keys.principal(src.author)` (`:264`); the `else` branch (`:266-272`) checks **nothing** and only sets `src.grade = 0`. `:276` `p.creator = src.sourcePrincipal` — the claimed principal becomes the subject-minting creator. `:280-284` the unsigned destination path checks only `msg.sender == src.author`, never the principal, and nothing checks that `src.author` was a contract at the source. `:286-300` the signed destination path checks the destination intent only. `:598` `Keys.subject(p.creator, x.salt)` mints under the claim. `:303` `_source[publication] = src` retains the claim. `src/LabHarness.sol:201-203` and `test/LedgerImport.t.sol:139-155` treat this path as supported ("origin-qualified id preserved"). `TODO.md` §B.6 / §F MAJOR-1 recorded it as deferred. |
| Why unsafe | "Unverified source claims must not mint/control source Subjects" (coordinator scope; README handoff "Unverified native import"). The packet is a bare claim; retaining it as attributed evidence would be acceptable, minting under it is not. |

## F2 — signed import path: negative verified (safe)

| | |
|---|---|
| Test | `test_F2_signed_source_packet_authorizes_nothing_at_the_destination` |
| Outcome on `e77f36d` | **PASS (safe).** (a) a signed packet whose `sourcePrincipal` names another principal → `E_SOURCE_SIGNATURE` (`:264`); (b) relabelling `src.realmId` to the destination's realm breaks recovery → `E_SOURCE_SIGNATURE` (`:262-263`); (c) an unrelated `msg.sender` with an empty destination signature → `E_DESTINATION_AUTH` (`:281`); (d) the source intent through `executeSigned` at the destination → `E_INTENT(1)` (`:219`); nothing written; (e) the legitimate path still imports at grade 1 with the id preserved. |
| Known gap not asserted | The EIP-712 domain is `(name, version)` only (`:133-136`, `:188-190`); the same signature executes on any second deployment with the same `(realm, code)` (`test/LedgerEvidence.t.sol:85-109` relies on it). PROFILE.md "FUTURE replay-domain repair" and TODO §F MAJOR-2 keep it out of this scope; it is a replay-domain item, not a source-authority one. |

## F3 — Type identity drifts under re-registration

| | |
|---|---|
| Test | `test_F3_type_identity_drifts_under_reregistration` |
| Outcome on `e77f36d` | **FAIL (unsafe).** After a record is admitted under `QUOTE` (0 refs, MockAcceptor), `register(QUOTE, QuoteAcceptor, [ITEM])` succeeds: `typeInfo(QUOTE)` now names another acceptor codehash and `refCount 1`, `refTypes(QUOTE)[0] == ITEM`; the old record still says `typeId == QUOTE` but a reuse of it fails `E_REF_MISSING` because its first body word is now read as a checked ITEM reference; an unsent signature over the same actions no longer matches `acceptanceProfileOf` (the receipt-bound half is safe: `E_INTENT(3)`); the old admission's stored profile commits to the old codehash, which no longer exists anywhere in state. |
| Evidence | `src/TypeRegistry.sol:13-14` — "Re-registration is allowed on purpose"; `:42-55` `register` has no `registered` check; `:51-52` overwrite `_types[typeId]` and `_refTypes[typeId]` in place; `:53` only the global `epoch` moves. `src/Ledger.sol:448` and `:468` read the **current** `typeInfo`/`refTypes` for every admission, dedup and reuse included (by design), so the reinterpretation is immediate. `src/Ledger.sol:656-666` the acceptance profile folds `(typeId, current codehash, epoch)`: it detects the change for unsent signatures but records nothing recoverable. `test/LedgerMatrix.t.sol:202-220` exercises the overwrite (`register(PAIR, …, tighter)` twice) as the way to "change a rule". |
| Why unsafe | "Exact shape/ref/rule identity must not silently change under one Type ID" (coordinator scope); README handoff "Exact Types": the registry "is not yet an immutable, reconstructible Type description". |

## F4 — no acceptance-policy layer separate from identity; historical basis lost

| | |
|---|---|
| Test | `test_F4_policy_activation_rewrites_identity_and_loses_historical_basis` |
| Outcome on `e77f36d` | **FAIL (unsafe).** "Activating fixture rule v2" (`StrictQuoteAcceptor`, cap 2.5e9 — sdk-fixture step 10) for `QUOTE` can only be expressed as `register(QUOTE, v2, [])`. Afterwards `typeInfo(QUOTE)` reports v2 as the Type's rule; the global epoch moved (safe half); the v1-era record `q(3e9)` is retained and its reuse now fails `E_REJECTED` (re-admission under today's policy is the intended law); but no retained state names the rule that admitted it: the evidence cell holds an opaque running hash of `(QUOTE, codehash, epoch)`, the admission row holds no basis, and the registry no longer holds the v1 codehash — only a reader who already knows it can confirm the basis. |
| Evidence | `src/TypeRegistry.sol:16-28` — one `TypeInfo` per id, no policy table, no activation history; `:51` overwrite. `src/Ledger.sol:83-84` `AdmissionRow` has no acceptance basis field; `:87-88`, `:424-436` the evidence cell stores only the running `acceptanceProfile`; `:731-746` `admission()` exposes none; `:656-666` the profile is a hash, not a record. `src/Interfaces.sol:41-56` the registry interface has no history/policy surface. |
| Why unsafe | sdk-fixture step 10 requires "A1/A2/B1 retain their v1 source admission and history at the original basis" with the current v2 assessment separate; "later Realm policy activation stays separate" (coordinator scope). Today the only policy lever rewrites identity retroactively. |

## Summary

| F | Class | Outcome on `e77f36d` | Repair (Phase 2) |
|---|---|---|---|
| F1 | source authority | unsafe — mints under a bare claim | R1 fail-closed `E_SOURCE_UNSUPPORTED` when `src.v == 0` |
| F2 | source authority | safe (negative holds) | none; replay-domain gap stays FUTURE |
| F3 | Type identity | unsafe — in-place overwrite | R2 descriptor-derived `typeId`, registration refused when the id exists |
| F4 | policy vs identity | unsafe — conflated, basis lost | R2 policy table with append-only activations; per-admission basis; `acceptanceBasis()` |

## F5 — a policy activation replaces the only validator (coordinator, 07:50; found against `aaecfed`)

| | |
|---|---|
| Tests | `test_F5a_activate_zero_must_not_remove_the_declared_rule`, `test_F5b_permissive_policy_must_not_replace_the_declared_rule` (Phase 1 text retained verbatim at [`FALSIFY.phase1-F5.t.sol.txt`](FALSIFY.phase1-F5.t.sol.txt); compiles against `aaecfed` only) |
| Outcome on `aaecfed` | **FAIL (unsafe).** Register T with `StrictQuoteAcceptor` (cap 2.5e9); `publish(T, q(3e9))` → `E_REJECTED` (probe). `activate(T, address(0))` (F5a) or `activate(T, PermissiveAcceptor)` (F5b) → the same body is **admitted** under T: `record(id).typeId == T`, `acceptanceBasis` names row 2 and the policy acceptor; the declared rule never ran. Retaining the old admission's basis does nothing for future records: the Type's fixed meaning is not enforced. |
| Evidence | `src/TypeRegistry.sol@aaecfed` `register` writes the declared acceptor only as policy row 1 and `activate` appends a **replacing** row; `typeInfo` returns the active row alone; `src/Ledger.sol@aaecfed` `_applyPublish` runs `if (acceptor != address(0)) _accept(...)` with that row only, so `address(0)` means "no validation". |
| Addendum (independent review) | `LabHarness.MockAcceptor` mutates `mode`/`minBody` with an unchanged codehash — pinning its codehash pins nothing about its behaviour; at `aaecfed` it was QUOTE's and PAIR's registration-time (mandatory) rule in the fixtures and the runner. |
| Repair | REPAIR.md "F5": mandatory rule pinned in the descriptor and always run (refusal final, `E_REJECTED`); `activate` installs an additional policy that may only add constraints (`E_POLICY_REJECTED`); `activate(0)` = no additional policy; profile folds `(typeId, ruleId, policyCodehash, epoch)`; `acceptanceBasis` records both; fixtures' mandatory rules are stateless/immutable-configured (`MinBodyAcceptor`), the mock is policy-only; the mutable-mandatory gap is demonstrated (`test_F5d_…`) and documented, not repaired. |
