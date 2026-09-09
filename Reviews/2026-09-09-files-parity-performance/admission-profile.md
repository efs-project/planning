# Admission call-tree probe — September 9

**Status:** diagnostic baseline; inclusive call-frame gas, not an opcode-level storage/journal attribution.

Using the unchanged September 8 managed host, replayed its saved four Type
groups, root publication and exact seven-leaf `filePublication`, then requested
Anvil `debug_traceTransaction` with `callTracer`. The metadata publication
succeeded with **14,150,093 receipt gas**. Content staging was deliberately
excluded from this admission-only probe; it is separately measured by the
full lifecycle. This does not certify byte availability or Files semantics.

Source at probe: branch HEAD `11de27e`, unchanged StateKernel source keccak256
`0x0d4372dce8b35f1f893ac841ce0acf8e74774e2800dd208d97d7b16878729742`.
The runner freshly compiled/source-checked the installed dependencies and
used its existing transaction/code limits and loopback-only lifecycle.

| Trace frame | Gas |
| --- | ---: |
| Full receipt | 14,150,093 |
| Admission library delegatecall (inclusive of helper calls) | 13,928,262 |
| Seven PreparationHelper staticcall frames combined | 703,653 |
| Individual helper frames | 62,587; 119,398; 58,129; 125,018; 119,398; 99,725; 119,398 |

The helper callee frames are roughly 5% of the receipt. The remaining
admission work includes journal scans/allocation, references, indexing,
encoding, replay/prestate checks, persistent writes and external-call overhead.
**It is not valid to label that remainder “journal gas.”** This probe does
justify testing the known repeated journal scans before weakening Type
validation. An unchanged-semantics source A/B test is the useful next measurement.

## Reproduction shape

From the planning worktree, import `compileUpgrade` / `withUpgrade` from
`Reviews/2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs` and
`publication` / `groupLeaf` from the existing local-stateful runner. Read
`Reviews/2026-09-08-upgradeable-foundation/fixtures/managed-upgrade.json`.
Inside `withUpgrade`, publish each group with nonce 1 through 4, then the
saved `rootPublication` and `filePublication`. Require every receipt status
to be `0x1`, then call:

```js
const trace = await lab.rpc('debug_traceTransaction', [
  written.tx.hash, { tracer: 'callTracer' }
]);
```

Inspect nested `gasUsed` values. Do not sum a parent and its children as
independent costs. The seven helper frames are direct children of the
admission delegatecall, selector `0xb565fb09`; helper selector `0xf973541e`.
This is a local source-observed diagnostic, not an Ethereum storage proof,
real-wallet measurement or a production performance guarantee.
