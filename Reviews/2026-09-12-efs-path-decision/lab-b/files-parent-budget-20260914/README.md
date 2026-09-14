# Cold parent-body validation diagnostic

Three focused Foundry tests passed; independent review found no malformed-fixture
false positive. This is a **demonstrated limitation**, not a repaired feature:

| Parent read inside the same 300,000-gas rule | Actual result |
| --- | --- |
| Warm, 8,192 bytes | Valid child accepted and indexed |
| Cold, 8,192 bytes | Exact mandatory-rule refusal; tested state rolls back |
| Cold, 64 bytes | Valid child accepted and indexed |

The child needs only the parent's Type and first word, but `Ledger.record` loads
all words. The maximum-size parent requires 256 cold body-slot reads, exceeding
the rule budget before overhead. The exact refusal alone does not identify OOG;
the paired controls and mandatory full-load source explain the mechanism.

Source is `test/FilesParentBudget.t.sol` against unchanged Ledger at base
`0d28b0f`. The manifest pins every frozen compiler input, including unrelated
archive work present in the private snapshot. The retained diagnostic and relevant
Ledger/LabBase/Actor hashes match the independent review. The run's test-harness
initcode warning is not a deployable Core size result.

This uses Foundry's `cool` control, not a separately paid transaction. It neither
prices the operation nor proves every Files profile fails. No Core/storage,
Type identity, validation-budget, or production design change was made.

The four gzip files preserve the original log, run manifest, diagnostic source
and independent review verbatim. `manifest.json` records compressed/raw SHA256
and lengths. Existing query and archive evidence is unchanged. The source-based
next remedy is bounded metadata/body reads; that remedy is not tested here.
