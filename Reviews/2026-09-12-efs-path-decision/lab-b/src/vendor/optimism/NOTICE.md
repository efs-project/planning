# Pinned Optimism inclusion-verifier source snapshot

Upstream: https://github.com/ethereum-optimism/optimism/tree/bf8daaed3e850a06fde4fb301ba70927dee815fa
Resolved commit: `bf8daaed3e850a06fde4fb301ba70927dee815fa` (source snapshot, not a tagged-release or audit claim).
Retrieved 2026-09-16 from immutable raw.githubusercontent.com URLs. Root MIT LICENSE retained unmodified; each Solidity file retains its MIT SPDX notice. These five Solidity files are the complete imported closure. No upstream tests or package dependency were installed.

All six files below are byte-identical to upstream. `foundry.toml` maps upstream `src/libraries/` imports to this directory without editing source. Local stricter RLP/path/budget checks live outside this snapshot in `BoundedStateProof.sol`. Offline traversal is independently implemented in `browser/native-proof.mjs`.

| Path (upstream libraries except root LICENSE) | Raw SHA256 | Local SHA256 |
| --- | --- | --- |
| LICENSE | 1c7806fae35858a40b2f69dfe2a08e5fabdabf658d8337759078767b96fa3b8c | 1c7806fae35858a40b2f69dfe2a08e5fabdabf658d8337759078767b96fa3b8c |
| trie/SecureMerkleTrie.sol | 755f79cb43e84d30dec6f1f535809bd4d18594c5d9bedf7407fdc6d374489980 | 755f79cb43e84d30dec6f1f535809bd4d18594c5d9bedf7407fdc6d374489980 |
| trie/MerkleTrie.sol | 9ce13ec201485c87989df0ec89407dde9da8d95d54baf3c4d68fbfeb9d421b0a | 9ce13ec201485c87989df0ec89407dde9da8d95d54baf3c4d68fbfeb9d421b0a |
| Bytes.sol | 235a1dcaf00fb7eeb2033033fdca135790c7415054aeb8303e5e070baca6e879 | 235a1dcaf00fb7eeb2033033fdca135790c7415054aeb8303e5e070baca6e879 |
| rlp/RLPReader.sol | 78b6bab28e975e14923202a9ac63a376a63e4f012c101a8f066891fc53074ca6 | 78b6bab28e975e14923202a9ac63a376a63e4f012c101a8f066891fc53074ca6 |
| rlp/RLPErrors.sol | c775036bad8a0e00beeeae9fd20c733dcfdc2ddc57464d70299cb5c148aeec60 | c775036bad8a0e00beeeae9fd20c733dcfdc2ddc57464d70299cb5c148aeec60 |

Production pragmas admit solc0.8.30. Upstream test pragmas0.8.15/FFI are not imported. Inclusion failure is never an authenticated zero or absence.
