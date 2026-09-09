# V1 executable comparison baseline — September 9

**Status:** fresh local test evidence, not a live-chain audit or matched per-file benchmark.

Inspected sibling contracts revision `c6b4075308dd37bb36665eabecb66ec8b47fc7dd`.
The checkout was clean before and after the first run. Existing dependencies
were used; no contract, config, deployment, schema or test source was edited.
The command compiled eight changed/cache-stale Solidity files successfully.

From the sibling `contracts/packages/hardhat` directory:

```sh
MAINNET_FORKING_ENABLED=false REPORT_GAS=true HARDHAT_CHAIN_ID=31337 \
  ../../node_modules/.bin/hardhat test --network hardhat \
  test/EFSDataModel.e2e.test.ts test/Whiteout.test.ts test/EFSFileView.test.ts
```

Result: **103 passing in 17 seconds**, zero failures. Hardhat's report identifies
Solidity 0.8.28, optimizer 200, via-IR, 30,000,000 block gas; compilation reported
Paris target. The repository also configures a 0.8.26 compiler. The run used a
local in-process Hardhat chain, with forking explicitly disabled. No wallet
prompt, RPC-provider latency, deployed-chain state or fee-price claim follows.

## Method-level costs reported by the existing gas reporter

| Method | Minimum gas | Maximum gas | Average gas | Reported calls |
| --- | ---: | ---: | ---: | ---: |
| EAS.attest | 223,770 | 1,383,786 | 724,948 | 2,498 |
| EAS.revoke | 84,997 | 203,612 | 158,929 | 22 |
| EAS.multiRevoke | — | — | 179,974 | 1 |
| SchemaRegistry.register | 73,344 | 139,260 | 100,622 | 1,296 |

These are **mixed fixture/setup/workflow method statistics**. Calls are the
reporter's accounting, not a count of user actions. An average `attest` cannot
be compared with v2's whole seven-leaf publication, and multiplying it by an
assumed upload attestation count would not create a trustworthy comparison.
V1's upload tests also do not all store actual file bytes or publish the same
metadata as the v2 fixture. A fair whole-operation benchmark must fix those
differences, compiler/chain settings, batching and initialized state first.

## Observed feature evidence

A second local run also passed **156 tests in 8 seconds** (zero failures):

```sh
MAINNET_FORKING_ENABLED=false REPORT_GAS='' HARDHAT_CHAIN_ID=31337 \
  ../../node_modules/.bin/hardhat test --network hardhat \
  test/EFSBytesStore.test.ts test/Lists.unit.test.ts test/AliasResolver.test.ts \
  test/EFSSortOverlay.test.ts test/UpgradeWithState.test.ts
```

That adds byte/chunk reads, typed list membership, redirects, sorting and
populated-state resolver upgrades. Across the two disjoint selections,
**259 v1 tests pass**. This is not a full v1 test-suite claim. The v1 checkout
remained source-clean after compilation and these runs.

- File placement, metadata rebind, historical version linkage, multiple mirrors
  and second placements are exercised in `EFSDataModel.e2e.test.ts`.
- Different authors at the same path, one author's withdrawal preserving another,
  per-author tags, negative-tag filtering and deep visibility are exercised.
- `Whiteout.test.ts` checks no fallthrough through negative masks, deep-link
  masking, stale mask revocation, folder masking/re-add and bounded listing scans.
- `EFSFileView.test.ts` checks opaque pagination and surfaces over 10,000 tagged
  folders without silent truncation. This is a dedicated test fixture, not
  evidence of acceptable wallet cost to create 10,000 folders.

The v1 baseline therefore includes actual **contract consumers** (router and
listing views), not just the ability to retain records. V2 parity must reach
that consumer level before the file lifecycle is called complete.

Fresh compiled artifact runtime lengths were also inspected: EFSIndexer
15,959 bytes; EFSFileView 16,151; EFSRouter 17,432; EdgeResolver 12,023;
MirrorResolver 5,059; WhiteoutResolver 5,577; ListReader 4,128;
ListEntryResolver 6,749; EFSSortOverlay 9,613. These exclude their EAS,
proxy and other dependencies. Comparing one of these with v2's host alone
would omit v2's linked admission and preparation machinery too; compare
complete dependency sets, not a cherry-picked contract.

## Performance questions to close

1. For identical small bytes and agreed metadata, measure setup separately from
   create/edit/rename/tag and read operations. Count actual transactions and
   calldata bytes as well as total gas; one wallet approval is a different metric.
2. Run fresh versus reused names/Types/content and two authors. A cached read or
   reused Record should not masquerade as the cost of a fresh publication.
3. Hold page size fixed while varying history churn, dead entries and Lens width.
   Record examined candidates and terminal coverage, not only returned row count.
4. For v2, profile before optimizing. Preserve raw bytes, every required index,
   current Binding semantics and atomic rejection when comparing implementations.
