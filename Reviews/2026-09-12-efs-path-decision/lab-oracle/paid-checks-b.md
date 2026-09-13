# Independent B raw checks — disposable paid slice

`paid-checks-b.mjs` maps the independently prepared B vectors to predeclared
public-ABI calldata and expected return bytes. It performs no RPC, candidate
import, build, fixture execution, file read or result-packet parsing. This is an
offline arm-authoring helper, not a second SDK or an authenticated state oracle.

## Inputs, seal and API

```js
const mapped = deriveBChecks({ inputs, coordinates, targets });
// inputs = deriveBInputs(...)
// coordinates = deriveBReadCoordinates(...)
// Each required target is { address, runtime }:
// ledger, registry, index, acceptor, quoteRule, pairRule, quoteAcceptor, labelAcceptor
// Arm fields: mapped.checks, mapped.initial, mapped.checkpoint
```

The vectors must come from the separately authored `paid-vectors-b.mjs`, rooted
in the exact neutral JSON SHA256
`ff7c4fc735504c9871e8241c7cc461293b7ffc37f3d5e9dd50840e005cc37795`.
This helper checks coordinate/ordinal consistency, independently reconstructs
all six Type IDs from shapes/ordered references/mandatory runtime hashes, and
checks record identity and body length. It does not authenticate a parsed input
object or independently redo the vector author's semantic mapping. Root must seal all input bytes before
fixture execution and verify source/build/runtime provenance independently.

Targets use lowercase addresses and complete nonempty lowercase runtime bytes.
`coreCodeCommitment = keccak256(targets.ledger.runtime)`, following the public
`Ledger.coreCodeCommitment()` formula. The Ledger address must match the vector's
independent CREATE coordinate, and its runtime must reproduce the vector's
`realmOrigin = keccak256(abi.encode(uint256(31337), coreCodeCommitment))` and
B principal. Mismatched origins, coordinates, ordinals and malformed byte fields
fail before checks are returned. The eight required target addresses must be distinct.

Both stages check `Ledger.indexModule() == targets.index.address`, so observing
the expected Index instance alone cannot substitute for checking its actual
attachment. Both stages also check the entire `typeInfo(bytes32)` tuple and
ordered `refTypes(bytes32)` array for all six Types; registry epoch 8 alone is
not a sufficient setup check.

| Type / `lab/type/<shape>/1` | Mandatory rule target | Ordered references | Additional policy / activation |
| --- | --- | --- | --- |
| QUOTE / `quote` | `quoteRule` | none | `acceptor` / 2 |
| BINARY / `binary` | none | none | none / 1 |
| ITEM / `item` | none | none | none / 1 |
| PAIR / `pair` | `pairRule` | ITEM, ITEM | `acceptor` / 2 |
| QUOTE_J / `quote-joined` | `quoteAcceptor` | PAIR | none / 1 |
| LABEL / `label` | `labelAcceptor` | none | none / 1 |

Every `typeInfo` result is registered=true and asserts mandatory address, its
runtime hash as ruleId, active policy address/codehash, reference count and
activation. "None" means zero address and zero hash. Additional policy hashes
derive from `targets.acceptor.runtime` (the pinned MockAcceptor), not from the
mandatory rule. Type identity independently derives as
`keccak256(abi.encode(DOM_TYPE,keccak256(utf8(shape)),keccak256(abi.encode(refTypes)),ruleId))`.
Caller-supplied Type IDs must match; changing a supplied non-record Type ID or
reusing stale mandatory runtime bytes fails closed.

The static checkpoint is exactly:

```json
{
  "frontier": { "admissions": "12", "records": "6", "bindings": "4", "publications": "4" },
  "indexGeneration": "0",
  "registryEpoch": "8",
  "coreCodeCommitment": "derived from independently pinned Ledger runtime",
  "realmId": "keccak256(utf8('lab/realm/1'))"
}
```

Block number/hash, timestamp and snapshot are deliberately absent from this
static object. The controller independently observes and retains them at the
post-B1 hook; they are not fabricated from expected setup results.

## Raw-call mapping

Each full assertion is `{label,to,data,expected}`. `data` includes the four-byte
Keccak selector and full ABI arguments. `expected` is the complete ABI return,
including dynamic offsets/length/body for `record(bytes32)`. No LensReader
decoded value supplies an expectation.

| Labels | Public getter | Independently expected values |
| --- | --- | --- |
| before `counts` | Ledger `counts()` | `(0,0,0,0)` |
| post `counts` | Ledger `counts()` | `(12,6,4,4)` |
| `registryEpoch`, `indexGeneration` | Registry `epoch()`, Index `generation()` | `8`, `0` before and after fixture |
| `coreCodeCommitment`, `realmId` | Ledger same-named getters | pinned runtime hash, declared Realm id |
| `ledger.indexModule` | Ledger `indexModule()` | pinned Index address at both stages |
| `typeInfo.*`, `refTypes.*` | Registry same-named getters | six exact genesis rows above at both stages |
| `aPlacement` | Ledger `head(A_PLACEMENT)` | state `1`, revision `1`, admission `7`, previous `0`, binding ordinal `2`, target `FILE_QUOTE` |
| `bPlacementAbsent` | Ledger `head(B_PLACEMENT)` | entire six-field zero tuple |
| `aHead` | Ledger `head(A_HEAD)` | `(1,2,10,6,1,QUOTE_A2)` |
| `bHead` | Ledger `head(B_HEAD)` | `(1,1,12,0,4,QUOTE_B1)` |
| `aTag` | Ledger `head(A_TAG)` | `(1,1,8,0,3,FILE_QUOTE)` under the separately declared B marker convention |
| `scopeA`, `scopeB` | Index `postingHead(scopeList)` | A `(count=1,live=1,last=2,flags=1)`; B all zero |
| `scopeA.entry0` | Index `postingAt(A_scopeList,0)` | binding ordinal `2` |
| scope coverage | Index `coverage(FAMILY_SCOPE,scopeKey)` | native tuple `(2,1,12)` for each declared scope |

The helper also checks both principal getters, Realm origin, File creation at
admission 4, index attachment/frontier/gap state, all four binding positions,
the three position preimages, A-head history `[6,10]`, B-head history `[12]`,
placement history `[7]`, tag history `[8]`, all six immutable records and all
twelve admission rows. A's TAG scope contains exactly binding ordinal 3, with
raw header `(1,1,3,1)`, one matching entry and native scope coverage `(2,1,12)`.
The six first admissions are ETH `1`, USDC `2`, Pair `3`, A1 `5`, A2 `9`, B1 `11`;
each record has exactly one occurrence. Quote body contents and references are
the independent vector bytes, not bytes learned from a successful getter.

The ordinal derivation is the vector author's declared action schedule: three
bootstrap publishes; A1 create/publish/head/placement/tag; A2 publish/head;
B1 publish/head. This yields 12 admissions, six record identities, four binding
identities and four publications. A2 advances A's head from admission 6 to 10;
it does not advance or re-author placement admission 7. Registry epoch 8 is six
registrations plus two activations; generation remains 0 under this setup.

Scope and history posting keys use
`keccak256(abi.encode(DOM_POSTING,bytes32(0),uint256(kind),uint256(0),key))`,
with kind 10 and 8 respectively. Public list layout is count/live/last/flags;
each audit append adds one count and live and retains audit flag 1. The explicit
scope header, entry, coordinates, coverage/frontier and full binding counts
are combined evidence. An empty B head or zero posting slot alone is never
promoted to `ABSENT_PROVEN`, `COMPLETE`, or global completeness.

## Publication provenance: named words only

The controller must support the separately agreed assertion shape:

```js
{ label, to, data,
  expectedWords: { byteLength: 416, equals: { '0': '0x...64 lowercase hex digits...' } }
}
```

Exactly one of `expected` and `expectedWords` is present. Every partial assertion
requires the complete 13-word raw return length, but compares only explicitly
named whole ABI words; there are no masks or inferred values. The complete raw
reply must still be retained. `Ledger.evidence(uint64)` word indices are:

| Word | Public return field | Asserted here |
| --- | --- | --- |
| 0 | author address | A for publications 2/3; actorB for publication 4 |
| 1 | proofKind | signed `2` for 2/3; native `1` for 4 |
| 2 | v | zero only for native publication 4 |
| 3 | leafCount | `5`, `2`, `2` |
| 4 | firstAdmission | `4`, `9`, `11` |
| 5, 6 | r, s | zero only for native publication 4 |
| 7 | nonce | `0`, `1`, `0` |
| 8 | deadline | retained, not asserted |
| 9 | execution basis | retained, not asserted |
| 10 | acceptanceProfile | retained, not asserted |
| 11 | indexObligations | retained, not asserted |
| 12 | actionsHash | retained, not asserted |

Each of these publications also has a full `isImported(publication) == false`
assertion. The placement admission identifies publication 2 independently of
whether a later paid read selects A2 or B1. This checks the onchain evidence
category and actor against pinned runtime under the RPC assumption; it does
**not** independently recover the EOA signatures. Signed v/r/s and the remaining
unasserted fields require an independently specified pre-run publication plan
and separate verification before those stronger claims can be made.

## Read boundary and remaining gaps

Semantic inputs were the sealed neutral JSON/Markdown and the independent vector
module/API. Candidate reads were limited to public ABI/type/constant declarations,
raw getter return layouts, key/packing formulas and physical fixture declarations.
No runner, measurement helper, candidate verifier, result packet or candidate
execution reply was used to define an expected answer. A heading-search command
on `FIXTURE-MAP.md` inadvertently displayed worked values alongside declaration
locators; those values were not copied into the implementation or used as test
expectations. Numeric expectations derive from the independent action schedule;
hashes derive afresh from the independent vectors/public formulas.

Public sources were read in the Road B worktree at
`7c292e0f8395f52c6d214a8a11a4efa23069859b`, with the relevant paths clean. Source
SHA256s at inspection were:

| Source under `lab-b/src/` | SHA256 |
| --- | --- |
| `Ledger.sol` | `7576874b52a81ebc0f7b64640332b345096e0c09000ed4f09811bdc21dd6c3d5` |
| `IndexModule.sol` | `e384475c12379208dbdf31eb66972ccbf9895e951494b236e5e9ab6cab539cce` |
| `Keys.sol` | `ebb6b95b4eb689c01020670e1a2ae003433c7f1500d2e32510432e384fea02b6` |
| `Interfaces.sol` | `5c8c5cf858c48fa814bf212b8922def0ca05e98b9c11248bc149a5f8f44af4b7` |
| `TypeRegistry.sol` | `ef2bd89de58298977058ba98a4ac2c03416a3fde991d74cc52fdc00634c09459` |

On September 13, before any new run, the coordinator explicitly settled the
remaining B arm-only tag representation: `TAG_MARKET` is a positive marker for
the stable File. At `(TAG, FILE_QUOTE, hash('market'))`, A binds target
`FILE_QUOTE`, revision 1/admission 8/binding ordinal 3, leaf 4/publication 2/CAS 0.
The mapper derives all bytes from the independent inputs/coordinates and checks
the head, admission, history and TAG scope. This is a pre-run physical fixture
convention, not a new neutral requirement or an EFS protocol decision; the
neutral JSON seal is unchanged and C may encode the same marker differently.

Bootstrap publication 1's authorship tuple remains outside this mapping.
This and the partial-publication gaps are returned in `unverified`, not silently
scored as passes.

All conclusions stop at `RPC_OBSERVED`. The native coverage flag is an asserted
native fact, not an independent operation-status oracle. There is no authenticated
Ethereum state, portable contract-origin proof, paid point/list selection result,
rollback-control result, cost result or finalist eligibility here. Required-index
rollback needs its own pre-sealed operation and pre/post checks. Existing oracle
diagnostics and signature checks are not transferred into this paid slice.

## Local verification

```sh
NODE_PATH=../planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules node --test Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-checks-b.test.mjs
```

Tests were written and observed failing before implementation. They hand-layout
ABI words/offsets independently of the mapper's Interface encoder and cover
tuple order, retained A1 placement versus A2/B1 heads, scope/history entries,
record bodies, CAS rows, partial evidence word indices, malformed inputs and
runtime-origin mismatch. Follow-through tests cover actual index attachment,
all six Type rows and their independently hand-built identities/ordered refs,
stale mandatory runtimes, and the separately declared tag marker. Both sides
use the installed ethers Keccak primitive;
this is not an independent cryptographic implementation. No compiler, Anvil,
installation or chain execution is used. Root owns publication and the aggregate
session-status entry.
