# B fixture map — semantic → physical (sealed paid point/list slice)

**CANDIDATE-AUTHORED. The independent run controller must re-derive every value below with its own implementation (sdk-fixture.md appendix, pre-run pins 2 and 4) and must not copy expected answers from this file, from `vectors/fixture-map-b.json`, or from any result packet.** Disposable lab, no protocol claim. Source commit `9c19164` (F5 Core at `ca1a228`, compiled 52/52 at `2859147`). Machine-readable twin: `vectors/fixture-map-b.json` (formulas as strings, raw inputs, worked hex, sha256 of the cited sources); `vectors/verify-fixture-map-b.mjs` recomputes every derivable value from the formulas and raw inputs (no chain, no build) — a self-consistency check of the candidate's own map, not the independent derivation.

## Raw inputs (assumptions)
- chain id `31337` (Anvil, `script/measure.mjs:257`); mnemonic `test test test test test test test test test test test junk` (`:86`, the public Anvil default — re-derive every wallet-derived value if the controller pins another); derivation `m/44'/60'/0'/0/<index>`; wallet indices deployer 0 / AUTHOR_A 1 / wallet 2 unused here / paid caller 3 (`:275`, `:1268`).
- A fresh chain: the deployer's nonce starts at 0 and the CREATE order is `deployAll` (`script/measure.mjs:1807-1822`; `setIndexModule` = nonce 16, six `register` = 17–22, two `activate` = 23–24, `JoinedConsumer` = 25 at `:1854`). The sealed post-setup snapshot holds 0 admissions / 0 publications.
- Fixture values: mantissas A1 `2500000000`, A2 `2502000000`, B1 `2501000000`, scale `6`, observedAt `1800000000`, note bytes = UTF-8 `"reference quote"` (`script/measure.mjs:109-114`); Items `abi.encode(uint256 1)` / `abi.encode(uint256 2)`, Pair payload word `1` (`:890-892`).

## Domain tags and constants
| label | formula | source | worked |
|---|---|---|---|
| `DOM_RECORD` | `keccak256(utf8('efs2/record/1'))` | src/Keys.sol:15 | `0xa9b8140bd3398d14fe72a4e868ca64b6bb119c3ee51354b50457d56da12552e3` |
| `DOM_POSITION` | `keccak256(utf8('efs2/position/1'))` | src/Keys.sol:17 | `0x8d799c7b7064c52f591ec7dd83328143cf1489beb1af2c305d90cf2cde7407e3` |
| `DOM_BINDING` | `keccak256(utf8('efs2/binding/1'))` | src/Keys.sol:19 | `0xfbc7067cf7411d9b4b89871c89041dd259dadaba90b115026f41239cbbf53c06` |
| `DOM_SCOPE` | `keccak256(utf8('efs2/vk/binding-scope/1'))` | src/Keys.sol:21 | `0x92daa38d3049c86476ecdbfb3e06a74ab958d8ed37d583b3c0d9173128f840f3` |
| `DOM_POSTING` | `keccak256(utf8('efs2/pk/1'))` | src/Keys.sol:23 | `0x15362da6306364a58a4c0a713b93f4a9bbdeb993c835d3435f5c97c8d5a0afd2` |
| `DOM_SUBJECT` | `keccak256(utf8('efs2/subject/1'))` | src/Keys.sol:25 | `0xc0c0cdafc7b89f00f1f976e698195cb28121446967001f8bd7840204218bcb20` |
| `DOM_PRINCIPAL` | `keccak256(utf8('efs2/principal/1'))` | src/Keys.sol:29 | `0x7f4ebbf8f6e4cdd030c23f45748ab93cbccd84be9aa2ac2b542059e0052e46cb` |
| `DOM_TYPE` | `keccak256(utf8('efs2/type/1'))` | src/Keys.sol:37 | `0x44ac7bc1be9e89e7c6fc3842810f6c4a263682285ecc7f254d0a7fe7b2af799e` |
| `PURPOSE_HEAD` | `keccak256(utf8('efs2/purpose/head/1'))` | src/JoinedConsumer.sol:112 (HEAD), script/measure.mjs:154 | `0x07167a05890e9fcaccbdf11abbb65a3aa14bccfe41825ce441803003862ce5df` |
| `PURPOSE_FOLDER` | `keccak256(utf8('efs2/purpose/folder/1'))` | src/JoinedConsumer.sol:113, script/measure.mjs:154 | `0x58de23804076d1b785b7479ab38fe6ada246e62164776702f51a1c48ef98cf99` |
| `PURPOSE_TAG` | `keccak256(utf8('efs2/purpose/tag/1'))` | src/JoinedConsumer.sol:114, script/measure.mjs:154 | `0x073e0a1a729959d841354dbb760bf57802acc034630defb75862e5dda0f72c18` |
| `REALM_ID` | `keccak256(utf8('lab/realm/1')) — Ledger constructor arg` | script/measure.mjs:156, :1811 | `0x684016e05741dc9d511ff3520a16e1da90a35be14b76f9e12ef0287b9beae39f` |
| `NOTE_COMMITMENT` | `keccak256(utf8('reference quote')) == keccak256(0x7265666572656e63652071756f7465)` | script/measure.mjs:111-114 | `0xea51e8c38c6dcf2d50a91e3db4784be38aeaf3728d1ef153b525df484e652345` |
| `FOLDER_SWAPS` | `keccak256(utf8('/swaps')) — the folder subject key` | script/measure.mjs:155, :902 | `0x6b8f0ae148ccfbd232f2f5088f5758ca8158d5a69aaabdc7fd072cbf75be2dc9` |
| `NAME_ETH_USDC` | `keccak256(utf8('eth-usdc')) — the placement role (entry name hash)` | script/measure.mjs:155, :902 | `0xc7c63b8bafc33aa5221fea52672881776f7b9d1aa8eebc29f8c758178230dd1a` |
| `CONCEPT_MARKET` | `keccak256(utf8('market')) — the TAG role` | script/measure.mjs:902 | `0x8b30951df380b6b10da747e1167dd8e40bf8604c88c75b245dc172767f3b7320` |
| `SALT_FILE_QUOTE` | `keccak256(utf8('joined/FILE_QUOTE')) — the CREATE salt of FILE_QUOTE` | script/measure.mjs:897 | `0xcf07b0d8ffc6bbc434847a26612314f5d16dff5e83f165d7e460c7fc0e3a008a` |
| `WORD_ONE` | `abi.encode(uint256(1)) — the Pair payload word` | script/measure.mjs:892 | `0x0000000000000000000000000000000000000000000000000000000000000001` |

## Types (registry descriptor → id)
typeId = keccak256(abi.encode(DOM_TYPE, shape, keccak256(abi.encode(bytes32[] refTypes)), ruleId)); ruleId = the mandatory acceptor's runtime codehash (0 without a rule) — src/Keys.sol:69-70, src/TypeRegistry.sol:88-99 (register), :122-126 (_codehashOf), :137-138 (typeIdOf); registration plan script/measure.mjs:142-149

| Type | shape (utf8) | refTypes | mandatory rule (immutable config) | ruleId | typeId |
|---|---|---|---|---|---|
| `ITEM` | `lab/type/item/1` → `0x089e89ac79be382b5051ee54411ad06893426d15b1eb67458c48d95d3c8dd7ef` | [] → refsHash `0x569e75fc77c1a856f6daaf9e69d8a9566ca34aa47f9133711ce065a571af0cfd` | none (ruleId 0) | `0x0000000000000000000000000000000000000000000000000000000000000000` | `0x589d5624cb9167094eb8ee549683bdadc765c77ed4f894308dd376bbebc30019` |
| `PAIR` | `lab/type/pair/1` → `0x20bd50a4112086884183185adad5624590d31448d53976ac022d55bb46de0e98` | ['ITEM', 'ITEM'] → refsHash `0x1d4f32778deb35d60040b469f15ca2ad98e7781921849f27f4aec24d47c6829c` | MinBodyAcceptor {'minBody': 96} (nonce 14; src/LabAcceptors.sol:41-51) | `— needs the controller's own build of the pin (runtime codehash embeds the immutable / the Ledger code)` | `— needs the controller's own build of the pin (runtime codehash embeds the immutable / the Ledger code)` |
| `QUOTE_J` | `lab/type/quote-joined/1` → `0x4c7a4ec879e0f6bf18fb87b4dfe081dc3efec6a4c1096b49e5d74082703f2213` | ['PAIR'] → refsHash `— needs typeId(PAIR) (build-dependent)` | QuoteAcceptor {'BODY_LENGTH': 160, 'SCALE': 6, 'MAX_MANTISSA': 'uint128 max'} (nonce 2; src/LabAcceptors.sol:18-33) | `— needs the controller's own build of the pin (runtime codehash embeds the immutable / the Ledger code)` | `— needs the controller's own build of the pin (runtime codehash embeds the immutable / the Ledger code)` |

## Records
recordId = keccak256(abi.encode(DOM_RECORD, typeId, keccak256(body))) — src/Keys.sol:73-79; bodies script/measure.mjs:165, :890-900

| Record | body encoding | body (worked) | id (worked) |
|---|---|---|---|
| `ITEM_ETH` | `abi.encode(uint256(1))` | `0x0000000000000000000000000000000000000000000000000000000000000001` | `0xdcee1a18e773c4e23c675382b23918d0771ae6ff0a7f2c22d3e7298744331825` |
| `ITEM_USDC` | `abi.encode(uint256(2))` | `0x0000000000000000000000000000000000000000000000000000000000000002` | `0x22ad273e9b5cb707fadf826bf174c50a895a558924cc7ff0cca702bffbc6c4a2` |
| `PAIR_ETH_USDC` | `abi.encode(bytes32 ITEM_ETH.id, bytes32 ITEM_USDC.id, uint256 1) — 96 bytes; the two leading words are the checked, ORDERED references` | `0xdcee1a18e773c4e23c675382b23918d0771ae6ff0a7f2c22d3e729874433182522ad273e9b5cb707fadf826bf174c50a895a558924cc7ff0cca702bffbc6c4a20000000000000000000000000000000000000000000000000000000000000001` | `— needs typeId(PAIR)` |
| `QUOTE_A1` | `abi.encode(bytes32 pairId, uint256 2500000000, uint8 6, uint64 1800000000, bytes32 NOTE_COMMITMENT) — 160 bytes` | `— needs PAIR_ETH_USDC.id` | `— needs typeId(QUOTE_J), body` |
| `QUOTE_A2` | `abi.encode(bytes32 pairId, uint256 2502000000, uint8 6, uint64 1800000000, bytes32 NOTE_COMMITMENT)` | `— needs PAIR_ETH_USDC.id` | `— needs typeId(QUOTE_J), body` |
| `QUOTE_B1` | `abi.encode(bytes32 pairId, uint256 2501000000, uint8 6, uint64 1800000000, bytes32 NOTE_COMMITMENT)` | `— needs PAIR_ETH_USDC.id` | `— needs typeId(QUOTE_J), body` |

## Wallets (fixed ephemeral accounts; addresses only, no secrets)
| role | index | address |
|---|---|---|
| deployer — deployer; relays every signed publication and every Actor call (setup only) | 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| AUTHOR_A — AUTHOR_A (EOA; signs A1 and A2 via executeSigned) | 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| wallet2_signedB — unused by the paid slice (signedB in other cells) | 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| paidCaller — the pinned unrelated paid caller of the four paid rows | 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |

## Deployment addresses (CREATE from the deployer; `script/measure.mjs:1788-1806`)
| key | contract | nonce | address |
|---|---|---|---|
| `registry` | TypeRegistry | 0 | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| `acceptor` | MockAcceptor | 1 | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| `quoteAcceptor` | QuoteAcceptor | 2 | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| `labelAcceptor` | LabelAcceptor | 3 | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| `ledger` | Ledger(registry, REALM_ID) | 4 | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| `index` | IndexModule(ledger) | 5 | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` |
| `failingIndex` | FailingIndexModule | 6 | `0x0165878A594ca255338adfa4d48449f69242Eb8F` |
| `lens` | LensReader(ledger, index) | 7 | `0xa513E6E4b8f2a923D98304ec87F64353C4D5C853` |
| `actorA` | Actor(ledger) — the operator of step 1 | 8 | `0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6` |
| `actorB` | Actor(ledger) — AUTHOR_B, the producer contract | 9 | `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318` |
| `consumer` | Consumer(lens) | 10 | `0x610178dA211FEF7D417bC0e6FeD39F05609AD788` |
| `recon` | Reconstructor | 11 | `0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e` |
| `strictAcceptor` | StrictQuoteAcceptor | 12 | `0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0` |
| `quoteRule` | MinBodyAcceptor(32) | 13 | `0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82` |
| `pairRule` | MinBodyAcceptor(96) | 14 | `0x9A676e781A523b5d0C0e43731313A708CB607508` |
| `statelessConsumer` | StatelessConsumer(lens) | 15 | `0x0B306BF915C4d645ff596e518fAf3F9669b97016` |
| `joinedConsumer` | JoinedConsumer(ledger, lens, QUOTE_J, PAIR, ITEM, LABEL) | 25 | `0x4A679253410272dd5232B3Ff7cF5dbB88f295319` |

## Principals
EOA principal = bytes32(uint256(uint160(address))) (src/Keys.sol:53-55; src/Ledger.sol:241 for signed ingress); contract principal = keccak256(abi.encode(DOM_PRINCIPAL, uint256(2), realmOrigin, address)) (src/Keys.sol:58-65; src/Ledger.sol:219, :821-823); realmOrigin = keccak256(abi.encode(uint256 block.chainid, Ledger.codehash)) (src/Ledger.sol:815-817)

- `AUTHOR_A` (EOA, wallet 1): principal `0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8` — `bytes32(uint256(uint160(AUTHOR_A.address)))`.
- `AUTHOR_B` (contract `actorB`, CREATE nonce 9): `keccak256(abi.encode(DOM_PRINCIPAL, uint256(2), realmOrigin, actorB.address))` with `realmOrigin = keccak256(abi.encode(uint256(31337), keccak256(Ledger runtime code)))` — needs the Ledger runtime codehash from the controller's build (not derivable here).

## Subject, positions, binding keys, scope lists
- `FILE_QUOTE` subject: `keccak256(abi.encode(DOM_SUBJECT, AUTHOR_A.principal, SALT_FILE_QUOTE))` (src/Keys.sol:82-83, src/Ledger.sol:241-242, :673-680, script/measure.mjs:123, :898); creator = AUTHOR_A.principal (signed CREATE inside A1: p.creator = Keys.principal(intent.author)); worked `0x976c920188c61969cee3d77dc43128f58bc31006bcf4d201023eda31a20e1d1e`.
- positions (position = keccak256(abi.encode(DOM_POSITION, purpose, subject, role)) — src/Keys.sol:86-87, script/measure.mjs:124, :903):
  - `HEAD_FILE_QUOTE` = `position(PURPOSE_HEAD, FILE_QUOTE.id, bytes32(0))` → `0x46c9457ea8495d166749377981953b626521c3bf09a3aab681801ed83eabaa2d`
  - `PLACEMENT_SWAPS_ETH_USDC` = `position(PURPOSE_FOLDER, FOLDER_SWAPS, NAME_ETH_USDC) — the one placement` → `0x0ab270965ac71109062250c3555b016b9d24fd1adb8b8396802562de872bca1b`
  - `TAG_MARKET` = `position(PURPOSE_TAG, FILE_QUOTE.id, CONCEPT_MARKET) — bound inside A1 (target = FILE_QUOTE.id)` → `0x90318c3b7a1b2df43635aab75f52e867501cc6dfb77db49c129527a87dda66aa`
- binding keys (binding key = keccak256(abi.encode(DOM_BINDING, principal, position)) — src/Keys.sol:90-91; head rows are read by Ledger.head(key) (src/Ledger.sol:905)):
  - `A_HEAD` = `binding(AUTHOR_A.principal, HEAD_FILE_QUOTE)` → `0x27b46e4d452fea4e1e0d8bef9cc734cbfca677a94e756c6d801795a238ad222b`
  - `A_PLACEMENT` = `binding(AUTHOR_A.principal, PLACEMENT_SWAPS_ETH_USDC)` → `0xb23f09599ce3413bacd659d6bb3ea1e51a1040a430d2691baf19aed281dfccf4`
  - `A_TAG` = `binding(AUTHOR_A.principal, TAG_MARKET)` → `0xcb0f6b48fb4450f00a3eccbcb2dca29c3d52a060950c5837cc858304307da938`
  - `B_HEAD` = `binding(AUTHOR_B.principal, HEAD_FILE_QUOTE)` → `— needs AUTHOR_B.principal`
  - `B_PLACEMENT`: does not exist: B1 binds no FOLDER placement (script/measure.mjs paidA2B1: two actions); proven at the seal by head(binding(B, PLACEMENT)) state 0
- scope keys / posting lists (scope key = keccak256(abi.encode(DOM_SCOPE, principal, purpose, subject)) (src/Keys.sol:94-95); its posting list key = keccak256(abi.encode(DOM_POSTING, 0x0, uint256(10), uint256(0), scopeKey)) (src/Keys.sol:98-99, :114-116)):
  - `A_FOLDER_SWAPS`: scopeKey `0x7f0a83b679ef50bf2e9e356e8357f7defc18f606e56f6b5536c068abc535cc98`; scopeList `0xa452f1767b586ee61c51c3ec891c15877fda53318249a03b5ac0dd569d053f66`
  - `B_FOLDER_SWAPS`: scopeKey `— needs AUTHOR_B.principal`; scopeList `— needs AUTHOR_B.principal`

## Lens ids
lens id = keccak256(abi.encode(address[] orderedPrincipals)) (src/JoinedConsumer.sol:565-567 _lensId, script/measure.mjs:166); NOTE LensReader's cursor lensHash uses abi.encodePacked (src/LensReader.sol:142) — a different value, not the appendix's lens id

- `LENS_A_FIRST` = `keccak256(abi.encode(address[] [AUTHOR_A, actorB]))` → `0x5c839af09e1e7f37f5e1c5c17041d8fc6113dc53af25b15d433f2edc4a8edb04`
- `LENS_B_FIRST` = `keccak256(abi.encode(address[] [actorB, AUTHOR_A]))` → `0xaa9401e70338c6c79e7705da9b6d4e1ff54f83bd375f6e1716336733fce8f56f`

## Admission / publication ordinals and revision labels (expected under this runner)
EXPECTED UNDER THIS RUNNER from a fresh deployment: the sealed post-setup snapshot holds 0 admissions / 0 publications (setup only registers Types); cell joined/paid-slice then runs step1, A1, A2, B1 in that order (script/measure.mjs paidStep1 / paidA1 / paidA2B1). Ordinals are 1-based, one admission per action, one publication per transaction (src/Ledger.sol:406-446 _run).

| publication | transaction |
|---|---|
| 1 | step1 (actorA native: PUBLISH ITEM_ETH, ITEM_USDC, PAIR_ETH_USDC) |
| 2 | A1 (AUTHOR_A signed, 5 actions) |
| 3 | A2 (AUTHOR_A signed, 2 actions) |
| 4 | B1 (actorB native, 2 actions) |

| admission | action |
|---|---|
| 1 | ITEM_ETH |
| 2 | ITEM_USDC |
| 3 | PAIR_ETH_USDC |
| 4 | CREATE FILE_QUOTE |
| 5 | PUBLISH QUOTE_A1 |
| 6 | BIND A HEAD -> QUOTE_A1 (revision 1) |
| 7 | BIND A FOLDER /swaps eth-usdc -> FILE_QUOTE (revision 1) = the one placement |
| 8 | BIND A TAG market -> FILE_QUOTE (revision 1) |
| 9 | PUBLISH QUOTE_A2 |
| 10 | BIND A HEAD -> QUOTE_A2 (revision 2, CAS expected 1) |
| 11 | PUBLISH QUOTE_B1 |
| 12 | BIND B HEAD -> QUOTE_B1 (revision 1) |

| label | head | physical revision | admission | publication |
|---|---|---|---|---|
| `A1` | `QUOTE_A1` | 1 | 6 | 2 |
| `A2` | `QUOTE_A2` | 2 | 10 | 3 |
| `B1` | `QUOTE_B1` | 1 | 12 | 4 |
| placement (sourceStep A1) | FILE_QUOTE at /swaps/eth-usdc | 1 | 7 | 2 |

Post-B1 basis: admission frontier `12`, records `6`, bindings `4`, publications `4`, index generation `0`, registry epoch `8` (6 register (each calls _activate: ++epoch, src/TypeRegistry.sol:88-100, :112-120) + 2 activate (QUOTE, PAIR; script/measure.mjs:1845) = 8; expected under this runner); Ledger nonces after B1: actorA 1, AUTHOR_A 2, actorB 1.

## Evidence categories
Ledger proof kinds src/Ledger.sol:131-132; evidence cell written at src/Ledger.sol:465-476 (r, s only for PROOF_SIGNED; v packed from p.v); consumer mapping src/JoinedConsumer.sol:301-302, checks :455-465; placement effect category = the placement admission's publication category + '_EFFECT' (script/measure.mjs evidenceCategoryOf)

- `EOA_SIGNED_PUBLICATION` ↔ proofKind 2: v in {27, 28}, r != 0, s != 0 (ecrecover of the PublicationIntent, src/Ledger.sol:232-255); author = intent.author; rows ['A1', 'A2'].
- `CONTRACT_ORIGINATED_PUBLICATION` ↔ proofKind 1: v == 0, r == 0, s == 0 (nothing fabricated; src/Ledger.sol:213-221, :465-472); author = msg.sender (the Actor contract); rows ['step1 (actorA)', 'B1 (actorB)'].
- `EOA_SIGNED_PUBLICATION_EFFECT`: the placement's admission (7) belongs to publication 2, an EOA_SIGNED_PUBLICATION by AUTHOR_A; placement provenance is reported separately from selected-content authorship.

## Values that cannot be derived without the controller's build
`ruleId`/`typeId` of `PAIR` and `QUOTE_J` (runtime codehashes of `MinBodyAcceptor(96)` and `QuoteAcceptor`; the immutable `96` is embedded in the runtime code), hence `PAIR_ETH_USDC.id`, the three Quote bodies and ids (they embed `PAIR_ETH_USDC.id`), `QUOTE_J.refsHash`; `realmOrigin` and `AUTHOR_B.principal` (Ledger runtime codehash), hence `B_HEAD` and B's scope keys. `verify-fixture-map-b.mjs --codehashes <file>` derives them from the controller's `{quoteRule, pairRule, quoteAcceptor, ledger}` runtime codehashes; those values must never be committed into the map. Everything else (tags, ITEM type/record ids, Pair body bytes, wallets, CREATE addresses, FILE_QUOTE, positions, A's binding/scope keys, lens ids, ordinals) is derivable offline.
