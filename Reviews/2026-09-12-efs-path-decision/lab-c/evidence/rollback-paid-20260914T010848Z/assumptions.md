# Independent C physical preparation — task2

Scope: source-derived, unexecuted physical control inputs and an offline packet verifier. No compiler, Anvil, RPC, candidate rollback runner/test/result reads, commits or pushes. Source base and retained artifacts remain unchanged. Root owns independent reviews and any later finite execution lease.

Inputs: task-2-brief.md/shared-constraints.md (including metadata alignment23:02), production C code, existing FixtureActors declarations, retained compiler artifacts from `/tmp/efs-c-readiness-build-20260913.NoPDle/out`, and pinned vendored Store code. All transitive artifact metadata source keccaks are compared with local source bytes; their SHA256 values and six artifact SHA256s are retained. Node26.0.0 and ethers6.15.0 are used for pure derivation.

The root-approved scratch-only runtime adapter addresses two known incompatibilities with the B helper: C's genuine ImportLib link and the compiler's special library self-address substitution. It validates exact artifact target, exact qualified link placeholder, one20-byte link in Ledger creation/runtime, complete AST-name-resolved immutable inventory, zero32-byte placeholders, nonoverlap/bounds and literal preservation outside spans. ImportLib's special retained compiler self-address span is exactly32bytes at39. No byte masks or repository helper modification. Full linked creation/runtime/initcode bytes, constructor args and substitutions are in preparation-details.json, not extra deployment metadata fields.

## Hand derivation of state

- Prefix declares Item/Pair/Quote at1/2/3, admits ETH/USDC/Pair at4/5/6, with genuine Producer principal and nonce1. Type declarations also create Records, count as occurrences and ByAuthor entries. Each seven occurrence keys (including absent attempted Quote) is distinct and separately checked.
- A1 starts at7: Subject7, Quote8, HEAD9, FOLDER10, TAG11. Nonce1 only on successful calibration, highWater11. Its Evidence basis6 is the prepublication admission counter; prefix basis0. Execution blocks are8/9,17/18,26/27, not Evidence basis.
- C raw static packing is left-aligned big-endian bytes. Counter11 occupies `000000000000000b` then24zero bytes. ByAuthor's5 uint64 admissions occupy firstword7/8/9/10 then secondword11 plus24zero bytes, not B's48-bit ordinal packing. EncodedLengths for40bytes is40 in the low56bits plus40 shifted56bits. Tests contain independent literal words.
- Quote is framed `abi.encode(bytes32[] refs,bytes payload)` and has288bytes; all9 backing words are included even when absent. Every scope triple spans3words, each history one word, A ByAuthor2words. Expected dynamic capacity is fixed by the attempted operation, not current logical length.
- Evidence FieldLayout0x01451100 declares325static bytes,17static fields, zero dynamic fields. All11 static backing words are checked for both prefix and A1. No nonexistent dynamic Evidence field is fabricated. Types' dynamic reference words and Type/Item/Pair Record bodies are also covered; static fields for every declared row are checked.
- For a single bytes32 key, `H=keccak256(tableId||key)`; static slot is `keccak256("mud.store") XOR H`, dynamic field0 slot is `keccak256("mud.store.dynamicData") XOR H`, lengths slot is `keccak256("mud.store.dynamicDataLength") XOR H`. Subsequent data words use consecutive slots. Store getters hide backing data outside length; physical reads are therefore mandatory, not optional fallback.

## Complete finite inventory

Per arm59 logical Store rows:6 Type/TypeRecord,4 Records,11 Admissions,2 Evidence,1 Subject,3 Bindings,2 Nonces,1 Counter,7 Occurrences,4 ByType,2 ByAuthor,3 Backlinks,3 History,3 Scopes,7 Coverage. Add45 table metadata and22 identity/coverage reads:126 `eth_call` requests. Full touched static/dynamic capacity:261 `eth_getStorageAt` requests. Every request has literal S0/S1 bytes. Three arms ×two states gives756 logical +1566 physical =2322 observations. `rowManifest` in preparation-details.json exposes the capacity derivation.

Mandatory coverage comes from C's Ledger highWater, not an independent Index frontier; all six mandatory families are checked and all actual postings separately checked. Optional digest remains PARTIAL0, generation1, rulesEpoch1. Store protocol version is literal2.0.2; this is distinct from dependency release2.2.23.

## Commands and verifier boundary

Generate: `/opt/homebrew/bin/node prepare.mjs` (stdout JSON). `--header`, `--arm NAME` and `--runtime NAME` are output selectors used only to retain large pure outputs with apply_patch. Default output has the agreed exact metadata fields and decimal-string ABI numbers. A separate `--runtime` output holds full code/row manifests. Nothing is written by these commands.

Test: `/opt/homebrew/bin/node --test preparation.test.mjs`.18 tests cover positive hand derivations and finite rejected mutants: wrong alignment,48-bit packing, incomplete length encoding, missing hidden word, wrong tag role, bad signature, tx nonce/data/gas drift, runtime link/name/overlap/missing immutable and missing packet. No fabricated full passing packet or candidate result was used. Auditor syntax was checked; actual post-run audit remains unexecuted.

Audit: `/opt/homebrew/bin/node audit.mjs RESULT_DIRECTORY expectations.json`. Pins the sealed expectation hash, then requires strict HTTP200/JSON-RPC2.0 IDs/outcomes, all28 contiguous headers with gasLimit30M,27 independently hashed signed transactions and recovered senders,18 deployment/runtime identities, exact static/mined5M linkage, exact metadata/return/revert bytes and all2322 observations. The current generic transport code verifies signed type0 or type2 envelopes; the plan does not pin an EIP transaction type. Unsupported/missing transport data returns `FAIL_OR_GAP`, never an empty default. Report flags are not evidence.

Only RPC_OBSERVED can result: numeric-block reads joined to retained headers, not authenticated state proofs or EIP-1898 requireCanonical observations. No proof of internal writes is invented from logs. Full source/compiler provenance and the existing fault's placement remain root-reviewed prior inputs. No C/B feature parity, full Files, portability, normal product-price change or adoption claim follows.

Remaining integration check: candidate packet must carry the complete shared raw/report shape, including all headers, signed bytes, transaction/receipt joins and literal error.data. Any departure is a reported gap requiring scoped review; expected answers must not be adjusted to fit observations.
