# Vendored MUD Store pin

Upstream: https://github.com/latticexyz/mud · release `@latticexyz/store@2.2.23` = commit `062bd8de4b8fa0f0ba609ec241b8aa9be5393499` ("chore: release v2.2.23 (#3775)", author date 2025-08-25 17:56 -0700; GitHub release timestamp 2025-08-26T01:05:18Z per the Road C review). Fetched into the scratch clone with `git fetch --depth 1 origin 062bd8de…` and checked out detached; copied with `cp -R packages/store/src/. vendor/@latticexyz/store/src/` plus `packages/schema-type/src/solidity/SchemaType.sol` (the only external import of `store/src`, verified by grep) and the repository `LICENSE` (MIT, "Copyright (c) 2022-present Lattice Labs Ltd."). No file was edited. Everything else in MUD (world, world-modules, store-sync, protocol-parser, TS codegen) is deliberately NOT vendored: this probe is Store-only and its table libraries are hand-written.

Verification command (run from `lab-c/vendor`): `find . -type f | sort | while read f; do shasum -a 256 "$f"; done` and diff against the list below. The four spot-checks against the upstream checkout (StoreCore.sol, Store.sol, SchemaType.sol, LICENSE) matched at copy time.

| sha256 | vendored path (under `lab-c/vendor/`) | upstream path (at 062bd8d) |
|---|---|---|
| `6cdbab6b6030c1816f51e525f57e9a6a684f68a064e2e14f98dd283b8a8dd3aa` | `@latticexyz/schema-type/src/solidity/SchemaType.sol` | `packages/schema-type/src/solidity/SchemaType.sol` |
| `4b1afa207a3013052f7192691fbdda304d60cab2ccbf97fa6cac37ba402f0178` | `@latticexyz/store/src/Bytes.sol` | `packages/store/src/Bytes.sol` |
| `f7d0de53f0146d351a3c127032377d9ae81fa14b946f11740db9842cb3cd7d41` | `@latticexyz/store/src/EncodedLengths.sol` | `packages/store/src/EncodedLengths.sol` |
| `43211915b15ab5d8ff0544e7d13c2dd5ec22343e8ca1e932ffe8f3e5a957a4d3` | `@latticexyz/store/src/FieldLayout.sol` | `packages/store/src/FieldLayout.sol` |
| `26ab7402b9f4bc15238374146f50d90b4c2869a3d6bc7e486c16504249276b51` | `@latticexyz/store/src/Hook.sol` | `packages/store/src/Hook.sol` |
| `0e3032017661160797da40b438ea0d95efab633bdbdcfcd428fc678e80a3da40` | `@latticexyz/store/src/IERC165.sol` | `packages/store/src/IERC165.sol` |
| `e1d6c7ac203f6795bc4eeb9e82d3d2a27c3c57e7c3b2fdf1980eea53e2e0a644` | `@latticexyz/store/src/IEncodedLengthsErrors.sol` | `packages/store/src/IEncodedLengthsErrors.sol` |
| `50cb7afc736f896a2f8c70a36e99a8547c9daf234e41362328fb53922c13bd8b` | `@latticexyz/store/src/IFieldLayoutErrors.sol` | `packages/store/src/IFieldLayoutErrors.sol` |
| `65a63c3a0fd36303c4b46244d2b861b688b8ca55df1fbbf7e9c6bb93f626d0f0` | `@latticexyz/store/src/ISchemaErrors.sol` | `packages/store/src/ISchemaErrors.sol` |
| `f11621f6ba369b1d452c8287cf543804dde80c2ad7abf0d4d6cf7ec6679409b7` | `@latticexyz/store/src/ISliceErrors.sol` | `packages/store/src/ISliceErrors.sol` |
| `c5d47273e97a961ee305f91ffe89309d4a7ed19a3c0800c4ef21d42f1ead24e7` | `@latticexyz/store/src/IStore.sol` | `packages/store/src/IStore.sol` |
| `f0b998b867e59452159dfc52f869597d33c14e9af508ba246fd24eea56f6b418` | `@latticexyz/store/src/IStoreErrors.sol` | `packages/store/src/IStoreErrors.sol` |
| `de03397e9107ae1a5b813d27458dee7e507a63faadf3b726abb55b8d8e416184` | `@latticexyz/store/src/IStoreEvents.sol` | `packages/store/src/IStoreEvents.sol` |
| `270ffc03946c49ca5115647b436b1eb6508277f8673dbcd3a8f5875a57543ffe` | `@latticexyz/store/src/IStoreHook.sol` | `packages/store/src/IStoreHook.sol` |
| `5e84f18d0bd195eacd88ebe41ba2e1c37d2ef22a8480fc032bbf90229b9cde8e` | `@latticexyz/store/src/IStoreKernel.sol` | `packages/store/src/IStoreKernel.sol` |
| `11b96d4e8527d79f6c8b8c334e63dc554abdbf905eed87cdda7d9e67ae62fa25` | `@latticexyz/store/src/IStoreRead.sol` | `packages/store/src/IStoreRead.sol` |
| `8317c9d2dcbd30628e82ddfabbe5a4dbb6f370d92c5588feeeb97476b33ba0a3` | `@latticexyz/store/src/IStoreRegistration.sol` | `packages/store/src/IStoreRegistration.sol` |
| `430c638c45b07869f9a376e67ab4acebdbfe6404176f54f303c24b9c61b11d11` | `@latticexyz/store/src/IStoreWrite.sol` | `packages/store/src/IStoreWrite.sol` |
| `4fa3bbf22c0c3c929320487316ad5d29fae03a78f2a04d1af70ff6e5c90732b7` | `@latticexyz/store/src/Memory.sol` | `packages/store/src/Memory.sol` |
| `69675fca632d55b77cf6990f33659e76997949b319b3a129ffc13389c1cf4a7a` | `@latticexyz/store/src/ResourceId.sol` | `packages/store/src/ResourceId.sol` |
| `24c93d78ad127436342622d7e55ee727c777d0d4e99cfc8d860f61f6a252b8ec` | `@latticexyz/store/src/Schema.sol` | `packages/store/src/Schema.sol` |
| `df72a8b210c8cfe71e49113f2b6324a774f86d88fbb705fcff49bb37751f3c52` | `@latticexyz/store/src/Slice.sol` | `packages/store/src/Slice.sol` |
| `eb627cc452bca8d7a082ab78f690febb206e41eaa349bdf3940e601f9b71c8ec` | `@latticexyz/store/src/Storage.sol` | `packages/store/src/Storage.sol` |
| `a91339663f4e6be661e58d8bab07bdce2224d7d1efe6c2fbabc3c29859698fd0` | `@latticexyz/store/src/Store.sol` | `packages/store/src/Store.sol` |
| `682cd5f28cc4a397de29f2c4cbab2d62975cc4439e032c1234543020ff9454b3` | `@latticexyz/store/src/StoreCore.sol` | `packages/store/src/StoreCore.sol` |
| `d016d968c9103af1750b40ee9de6434d7ff9bbdf348846949d3428368d5f1b44` | `@latticexyz/store/src/StoreHook.sol` | `packages/store/src/StoreHook.sol` |
| `acd40c785b81a16d68843bcdbd54a5cf2af031cc9bbeb911263822732fd9ac8a` | `@latticexyz/store/src/StoreKernel.sol` | `packages/store/src/StoreKernel.sol` |
| `35b979b21df8823c6232e5ba5ecfe182642bc16091b38618175192a20ad585ca` | `@latticexyz/store/src/StoreRead.sol` | `packages/store/src/StoreRead.sol` |
| `933e17160cd7ab21e6dcb406684164bccbb30cd1e1caff59a2769170283a8b6a` | `@latticexyz/store/src/StoreSwitch.sol` | `packages/store/src/StoreSwitch.sol` |
| `fd729b8ec9a247376ba0ca82a59c0e7f052512a4a835d89b0edfd93a32774abd` | `@latticexyz/store/src/codegen/index.sol` | `packages/store/src/codegen/index.sol` |
| `ee0a9274d60d494efb4dc6627d0406c9ca97200bb097dafb0802538720d46612` | `@latticexyz/store/src/codegen/tables/Hooks.sol` | `packages/store/src/codegen/tables/Hooks.sol` |
| `3e3eca5e7adebf909e49758c1ba58b8ee53a62a7b20828a6defc733e9fec0488` | `@latticexyz/store/src/codegen/tables/ResourceIds.sol` | `packages/store/src/codegen/tables/ResourceIds.sol` |
| `8e30cec7661d59aa14a45bcf4be11fa939ba96a208c0c600471819b710d0c978` | `@latticexyz/store/src/codegen/tables/StoreHooks.sol` | `packages/store/src/codegen/tables/StoreHooks.sol` |
| `96167c239a2a9545f596573ae692f98d6b39d731fed76cb8465cbe5020b32782` | `@latticexyz/store/src/codegen/tables/Tables.sol` | `packages/store/src/codegen/tables/Tables.sol` |
| `bd7ec64b1c4fcc7a15c86db31344e9ce3b4f3acb684e815d8ac5024a03ebb35d` | `@latticexyz/store/src/constants.sol` | `packages/store/src/constants.sol` |
| `104b3c298472a5cd0677ab09115ef5e1b38574045cb692130f4de2f050e516e6` | `@latticexyz/store/src/rightMask.sol` | `packages/store/src/rightMask.sol` |
| `98fd76d462cdba3c33c98c04ef9fec4e0e0cd7da27e61941f414981fe684d2c8` | `@latticexyz/store/src/storeHookTypes.sol` | `packages/store/src/storeHookTypes.sol` |
| `d0ac9be956573632e8bfdaec1fffd85d4ca9cc211879613a9a17ef02bd10bb27` | `@latticexyz/store/src/storeResourceTypes.sol` | `packages/store/src/storeResourceTypes.sol` |
| `40bfdde0799d13b49e4f800b4dc8c5de7d586d8a41a6f52ab3c737ee53ea96c2` | `@latticexyz/store/src/tightcoder/DecodeSlice.sol` | `packages/store/src/tightcoder/DecodeSlice.sol` |
| `2e51f6d14a41af5dd3dd4f91bbaae2a41237f145e46d6dbe0b6641802c2449bc` | `@latticexyz/store/src/tightcoder/EncodeArray.sol` | `packages/store/src/tightcoder/EncodeArray.sol` |
| `4869060542b60d70f3a60e32d61b5ab7a25d0aeba6ff3524070894f3968a9b7f` | `@latticexyz/store/src/tightcoder/TightCoder.sol` | `packages/store/src/tightcoder/TightCoder.sol` |
| `8eeed0c9ce72fb17351a09a7def73a23fb79b3b0ee07894abdfe5f746aa9e234` | `@latticexyz/store/src/version.sol` | `packages/store/src/version.sol` |
| `8282c6adeca422a4450a133e19accfc844cf1e9895fda52a632bf7d8d66ad4c5` | `LICENSE` | `LICENSE` |

Totals: 43 files, 10046 Solidity lines, 472 KiB.
