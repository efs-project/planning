# An optional live-value view at a filesystem path

2026-09-11 · read-only expert preflight · not implemented or adopted

James's example is a contract publishing `/swaps/eth-usdc` for other contracts to read. We should test two useful products rather than assume they need identical storage:

| Path points to | What an update means | What EFS retains |
|---|---|---|
| Immutable saved value | Admit new typed bytes and select a new revision | Exact saved bytes and revision history |
| Explicit live-value descriptor | Update the source contract's own state | Descriptor and its history, **not each returned value** |

The second option could avoid an additional EFS write on every source update. That is a different retention promise, not a storage optimization preserving every guarantee. It would be additive; ordinary immutable files and explicit snapshot admission remain.

## Smallest experiment

No Kernel, registry, index, File, history or write-API changes. An application stores a descriptor as an ordinary file; `readRecord` continues returning that immutable descriptor, never substituting live output for its bytes.

Use the existing raw validator under a distinct application descriptor Type. A fixed descriptor can contain `(version, chainId, source, sourceRuntimeHash, key, resultTypeId)`. **Raw admission does not validate that structure.** The dedicated reader must validate its exact canonical shape; this is not fulfillment of richer mandatory Type validation. A future structural descriptor Type is a separate integration.

- A small `LiveQuoteProducer` has an operator-controlled uint256 mapping and an explicit post-deployment `publishPathOnce()`. Publish after deployment because its own eventual runtime is not available through `address(this).codehash` in its constructor. Later setters touch source state only.
- A stateless `LiveQuoteReader.observeAtPath` resolves the ordinary path, verifies the regular File and exact descriptor Type, reads the integrity-checked descriptor, then calls only the fixed `values(bytes32)` getter.
- Result is explicitly `LIVE_VALUE_VIEW`: typed bytes, source, descriptor FileId/RecordId/revision, execution chain and block number. No returned value RecordId, admitted status or value revision. A separate paid consumer can persist a digest of the observation for verification.

## Boundaries that must be tested

Pin the Kernel, descriptor Type, uint256 Type and permitted actual source runtime independently. A descriptor's self-declared code hash is not a trust policy. Start with one known mapping implementation and actual immutable configuration/runtime binding; arbitrary proxies, mutable configuration and unverified dependencies are unsupported, not assumed equivalent because their top-level code hash matches.

Validate descriptor size/version/canonical encoding/chain/source/code/key/result Type. Use a measured bounded STATICCALL allowance and copy at most32 result bytes; require success and exact32-byte output. Apply the existing bounded uint256 structural check without admitting it as a Record. Missing/malformed/exhausted source reads are unavailable, never a valid zero or empty file. The mapping getter itself may define unset keys as zero; that must not become proof of a stored publication, initialization or price freshness.

STATICCALL prevents writes, not stale/dishonest values or undeclared mutable dependencies. A known mapping runtime still supplies application data, not an endorsed market price. File authorship and source-contract identity remain separate facts.

Descriptor history is not source-value history. Historical RPC execution depends on available historical state; ordinary contracts cannot read arbitrary past storage. The current block hash is supplied by external canonical observation, not fabricated using `blockhash(block.number)`. No state-proof or archive-availability claim follows.

Explicit snapshot admission saves observed bytes as a separate immutable Record. Source/basis provenance is retained only if explicitly represented as well; an unqualified uint256 snapshot is not automatically a source attestation.

## Evidence needed before recommending it

Compare three named workloads: existing immutable QuoteProducer updates; direct source setters/getters; identical source setters with descriptor-path reads. Price deployment/registration/descriptor publication separately. Retain fresh/nonzero/zero/same-value setter receipts, direct versus path paid reads, failed reads, and explicit snapshot admission.

Prove descriptor revisions, EFS inventories and body-helper nonce do not change during source-only updates. Verify returned values at the actual receipt/block basis independently. Do not describe the marginal update reduction as equivalent immutable-file savings.

Suggested order: finish current checked reads and packed-presence task, then scope this small fixture before a general OS/driver framework. No requirement has been sacrificed or new Core noun selected. This preflight is a concrete option for James's eventual retention decision, not a demand that he decide tonight.

Source inspected: native `58e61c4`, especially [existing producer and reader](https://github.com/efs-project/planning/blob/58e61c4/Reviews/2026-09-11-efs21-pragmatic/contracts/src/Examples.sol), [registry restrictions](https://github.com/efs-project/planning/blob/58e61c4/Reviews/2026-09-11-efs21-pragmatic/contracts/src/ExpandedTypeRegistry.sol) and [immutable Record read](https://github.com/efs-project/planning/blob/58e61c4/Reviews/2026-09-11-efs21-pragmatic/contracts/src/NativeKernel.sol). No new receipt measurement was run for this proposal.
