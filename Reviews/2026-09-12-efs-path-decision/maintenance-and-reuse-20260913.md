# MUD reuse: a real substrate benefit, not an EFS implementation for free

September 13, 2026 · bounded primary-code review for the provisional decision;
no engineering-hour estimate or current upstream maintenance claim

**C replaces generic storage plumbing, not EFS semantics.** That is meaningful
reuse, but the current Store-only lab does not demonstrate a lower maintenance
burden or a ready-made EFS client stack. Conversely, B's lower measured gas does
not eliminate its obligation to maintain and verify custom storage/getters.

Source roots below are each candidate's
`Reviews/2026-09-12-efs-path-decision/lab-{b,c}/`: B `c5561e2`, C compiled
source `2ca7349`, C runner `58dd3d7`. This complements the actual
[[b-parity-paid-results-20260913|receipt comparison]] and
[[required-index-gap-20260913|required-query gap]], not an independent gas run.

| C actually reuses | What EFS still owns |
| --- | --- |
| StoreCore physical table registration, static/dynamic storage and codecs | EFS table schemas/IDs, hand-written wrappers, absence markers and compatibility rules |
| Generic StoreRead schema/layout/record/field/slice ABI | EFS meaning: Type/Record/Principal identity, references, mandatory acceptance, signatures/replay, CAS and proof grades |
| Store metadata and mutation-event conventions | Mandatory indexes, coverage, Lenses, history, evidence/import, semantic SDK/browser adapters and recovery |

Primary source: C `src/EfsStoreCore.sol`, `src/tables/LedgerTables.sol`,
`src/tables/IndexTables.sol`, `src/ActionLib.sol`, `src/ImportLib.sol` and
`src/LensReader.sol`. The actual boundary composes **StoreRead + StoreCore**;
it does not expose raw Store write/registration selectors or adopt World
authority. Its semantic consumer still pins table coordinates and decodes
them explicitly (`test/MeasurementConsumer.sol`).

`vendor/PIN.md` records MUD Store **2.2.23** at upstream
`062bd8de4b8fa0f0ba609ec241b8aa9be5393499`, plus SchemaType, as the vendored
substrate. World, world-modules, store-sync, protocol-parser and TypeScript
codegen are absent. Vendored upstream-generated internal tables are **not** a
working EFS code-generation pipeline. Road C's earlier proposed client/codegen
benefits therefore exceed the demonstrated reuse. Generic tools might work,
but compatibility and reduction of custom integration must be exercised.

B uses local Solidity imports and bespoke packed rows/posting arithmetic/public
getters (`foundry.toml`, `src/Ledger.sol`, `src/IndexModule.sol`). This avoids
the external Solidity dependency, not the storage audit burden. Neither lab
demonstrates populated contract upgrades or the entire semantic SDK; those
remain finalist work, not a bonus assigned by choosing one source tree.

For C, future Store adoption requires checking persistent layout, event/read
compatibility, decoders and linked code identity. An upstream change is not
automatically safe to copy into a long-lived system. No claim about current
upstream staffing, support or audit coverage is needed for this conclusion.

**What could reverse the non-gas comparison:** demonstrate an independent
generic reader handling previously unknown EFS table layouts from Store
metadata and authoritative state, using EFS's required key inventory, while
preserving absence/coverage/provenance. Compare the custom adapter needed by B.
That would earn C reusable integration value; it would not prove saved
engineer-hours, free migration or that table introspection explains EFS Types.
Retain this as a specific challenge, not an excuse to prolong three architectures.
