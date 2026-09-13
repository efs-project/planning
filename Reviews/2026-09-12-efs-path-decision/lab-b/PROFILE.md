# Road B public signature profile — compiled diagnostic `dcc7b94`

**Standing:** candidate-authored declaration of the disposable lab's observed source behavior. It gives an independent checker literal bytes to interpret; it is not an independent oracle, an adopted EFS v2 ABI/profile, a deployment recommendation, or a permanence claim.

## Exact pin

- Source commit: `dcc7b946d2ac8dfcf22103069127a9d1809df974`.
- `src/Ledger.sol`: Git blob `c454e2699b9335c0a23bbfb6ed72e1ba0e5c7a14`.
- `src/Keys.sol`: Git blob `a291be9446ed1e4c2cb9bb14608ae7ca06a1c238`.
- `src/Interfaces.sol`: Git blob `3155357f6d3e58c910828df2eb798ecb53ea24f9`.
- Rule-context sources: `src/TypeRegistry.sol` blob `235174fb951ba28084723448bd89ecfda340a6ec`; `src/IndexModule.sol` blob `3c624e7b91fd61c09accc916bbf6edadc36e3c69`.
- The retained diagnostic is commit `322b320`, packet SHA-256 `7bd5409a4b306d8e0705187094fa482b31efcad471260ae93f57eebd0b22fcce`. It compiled Solidity `0.8.30+commit.73712a01`, optimizer 200, via-IR, Cancun. The source pin and diagnostic packet are distinct.

The literal vector is [`vectors/profile-b.json`](vectors/profile-b.json). Its run-derived context is chain `31337`, Ledger `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`, and Ledger runtime codehash `0xb2bbbd7b94f6398de8c783f7a3d2e6accc8e651d3302c404db1cd66e13195465`. These identify one diagnostic deployment; they do not make its ABI or profile durable.

## Action tuple and ordered semantics

`Action` is this exact static tuple, in this order:

```text
(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)
```

The enum values are `PUBLISH=1`, `REUSE=2`, `BIND=3`, `UNBIND=4`, `CREATE=5`, `WITHDRAW=6`. Values outside `1..6` fail. `Action[]` order is semantic: actions are applied left to right, a later action may observe an earlier action in the same publication, and any failure reverts the entire transaction.

Unused fields and the matching `bodies[i]` must have these shapes:

| kind | used action fields | required zero/empty shape |
|---|---|---|
| `PUBLISH` | `typeId`, `bodyHashOrRecordId = keccak256(bodies[i])` | `purpose`, `subject`, `role`, `target`, `expectedRevision`, `salt` are zero; body is at most 8192 bytes |
| `REUSE` | `typeId`, `bodyHashOrRecordId = existing recordId` | the same six action fields are zero; `bodies[i]` is empty |
| `BIND` | `purpose` (nonzero), `subject`, `role`, existing `target` (nonzero), `expectedRevision` | `typeId`, `bodyHashOrRecordId`, `salt` are zero; body is empty. `subject` and `role` may be zero |
| `UNBIND` | `purpose` (nonzero), `subject`, `role`, `expectedRevision` | `typeId`, `bodyHashOrRecordId`, `target`, `salt` are zero; body is empty. `subject` and `role` may be zero |
| `CREATE` | `salt` | every other action field is zero; body is empty. A zero salt is not shape-rejected |
| `WITHDRAW` | `target = bytes32(uint256(admissionOrdinal))` | every other action field is zero; body is empty |

The outer ingress also requires `1 <= actions.length <= 64` and `bodies.length == actions.length`. `expectedRevision` is the signed CAS expectation for bind/unbind. Runtime existence, Type, reference, acceptance, nonce, deadline, and index checks still apply; a valid signature alone is not admission.

## Action commitment

```text
actionsHash = keccak256(abi.encode(actions))
```

Here `actions` is one ABI argument of type
`tuple(uint8,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,uint32,bytes32)[]`.
Consequently the encoded value begins with the dynamic-value offset, then array length, then nine 32-byte words per element. It is not packed encoding, a concatenation of per-action hashes, or ABI encoding of nine parallel arrays. The vector provides the complete `actionsEncoded` bytes.

Bodies are not an additional EIP-712 field. A `PUBLISH` commits its bytes through `bodyHashOrRecordId`; `REUSE` commits the existing record ID and requires an empty body; every other kind requires an empty body. Thus changing a publish body without changing the signed action fails `E_BODY_HASH`, while changing the action invalidates the signature.

## `PublicationIntent` and digest

The Solidity `Intent` argument contains, in order:

```text
bytes32 realmId
bytes32 coreCodeCommitment
address author
uint64 nonce
uint64 deadline
bytes32 acceptanceProfile
bytes32 indexObligations
```

`actionsHash` is computed by the Ledger and appended only for the EIP-712 struct hash. The exact type string is:

```text
PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)
```

Its typehash is `0xa1f677df361c0235b1979e7c31d89bcad72b78744ae472963d3bc9f12b384374`. Framing is:

```text
structHash = keccak256(abi.encode(
  INTENT_TYPEHASH, realmId, coreCodeCommitment, author, nonce, deadline,
  acceptanceProfile, indexObligations, actionsHash
))

digest = keccak256(0x1901 || domainSeparator || structHash)
```

The current diagnostic domain is exactly:

```text
EIP712Domain(string name,string version)
name    = "EFS2-RoadB-Lab"
version = "1"
```

`domainSeparator = keccak256(abi.encode(domainTypehash, keccak256(bytes(name)), keccak256(bytes(version))))`; there is no chain ID or verifying-contract field. The vector includes the domain typehash, separator, struct encoding/hash, 66-byte final preimage, and digest.

## Signature bytes and recovery rules

The accepted `sig` is exactly 65 bytes: `r[32] || s[32] || v[1]`. Only `v=27` or `v=28` is accepted. `s` must be at most `0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0`. `ecrecover(digest,v,r,s)` must be nonzero and equal `intent.author`.

The signed ingress does not accept EIP-2098 compact signatures or ERC-1271 contract signatures. Contract authors use native ingress. A signed import with nonzero source `v` applies the same low-s/v/recovery rule to a source `Intent`; its retained source signature is evidence only, and separate destination authorization is still required. A source `v=0` is retained as an unverified grade-zero contract witness and does not prove source authorization.

## Identity and derived-key framing

All text below is UTF-8 and all multi-value derivations use standard `abi.encode`, never packed encoding.

```text
DOM_RECORD  = keccak256("efs2/record/1")
bodyHash    = keccak256(body)
recordId    = keccak256(abi.encode(DOM_RECORD, typeId, bodyHash))

EOA principal = bytes32(uint256(uint160(author)))
DOM_SUBJECT = keccak256("efs2/subject/1")
subjectId   = keccak256(abi.encode(DOM_SUBJECT, creatorPrincipal, salt))

position = keccak256(abi.encode(keccak256("efs2/position/1"), purpose, subject, role))
binding  = keccak256(abi.encode(keccak256("efs2/binding/1"), authorPrincipal, position))
scope    = keccak256(abi.encode(keccak256("efs2/vk/binding-scope/1"), authorPrincipal, purpose, subject))
```

For signed local ingress, `creatorPrincipal == authorPrincipal ==` the padded EOA address. Native contract principals use another origin-qualified derivation and are outside this signature vector. `folderId = keccak256(bytes("/swaps"))` and `nameHash = keccak256(bytes("eth-usdc"))` are explicit lab-fixture choices, not a general filename/path profile.

The retry key is `publicationId = keccak256(abi.encode(author, uint64(nonce), actionsHash))`. It is local replay bookkeeping and is not the EIP-712 digest.

## Rule and execution context actually covered

`executeSigned` requires `intent.realmId == Ledger.realmId` and `intent.coreCodeCommitment == address(Ledger).codehash`. The codehash also reflects compiled immutable values, including the registry address and realm ID.

`acceptanceProfile` starts at zero. The Ledger reads `epoch = registry.epoch()` once, then for each `PUBLISH` or `REUSE`, in action order:

```text
profile = keccak256(abi.encode(profile, action.typeId, registry.typeInfo(action.typeId).acceptorCodehash, epoch))
```

The vector's setup has epoch `5` and QUOTE acceptor codehash `0x1a61860433c036adda04e35df85a7b9ce063f5a575653a4483c30705c3a2cca7`, producing `0x78cd688361e28884caa52d836072ca40405f892f7043df1604c22e7fc47a1788`.

`indexObligations` is zero when `indexModule == address(0)`; otherwise it is `keccak256(abi.encode(indexModule, indexModule.codehash))`. The vector uses module `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`, codehash `0x10371a99cf35210c84c10599e43704ef1387fd159f5e4a18a91af5aac1f0d075`, producing `0xdc27cb459ba876c3519801545173e56b4d7cd46068219d0bb1d62863fc772ebe`.

The signature therefore directly covers the action tuple bytes, realm, Ledger runtime code, author, nonce, deadline, the acceptance profile, and index-module identity/code. It does **not** directly serialize registry state such as acceptor address, reference count/types, or binding-role expected Types; it relies on the registry's global epoch changing with those rules. A publication with no publish/reuse actions has a zero acceptance profile and does not commit even that epoch. Admission also depends on current nonce/prior-publication state, timestamp, record/subject existence, current CAS revisions, acceptor result, mandatory index success, and sufficient gas. Those are runtime predicates, not signed snapshots.

## FUTURE replay-domain repair (not this profile)

The name/version-only EIP-712 domain is a known diagnostic gap. It does not bind a signature to a source chain or a specific Ledger deployment; identical intent fields and compatible nonce state can therefore authorize execution elsewhere. The coordinator requires future execution authorization to bind source chain and Ledger deployment, while portable evidence remains separately transferable and import still obtains destination authority.

That repair is **FUTURE and intentionally not designed or encoded here**. It will require a new declared profile/type or domain version and new vectors. An independent checker must interpret this file's literal bytes as the pinned `dcc7b94` diagnostic behavior, never retrofit the future domain into them.

## Raw-source coverage and unsupported claims

The declaration covers the `Action`/`Intent` ABI, action commitment, EIP-712 digest, signature parsing/recovery, record/subject/position/binding/scope IDs, publication retry ID, acceptance-profile fold, index obligation, and the signed/import ingress distinctions visible in the pinned sources.

It does not establish authenticated chain provenance, contract deployment authenticity, runtime equivalence beyond the supplied pins, correctness of candidate reconstruction helpers, complete rollback, export/import completeness, label-byte retention, a stable Type-description profile, ERC-1271 support, or a permanent SDK ABI. The vector is a literal positive cryptographic case with one explicit mutation expectation; the independent SDK checker remains responsible for interpreting supplied raw RPC bytes without candidate helpers.

## Changed after `dcc7b94` — authority repair (2026-09-13; COMPILED AND TESTED at `ca1a228`: 43/43, no via-IR stack error; runner UNRUN; the declared vector for this profile is produced from the receipt run's retained packet, as the `dcc7b94` vector was)

Everything above this heading describes the pinned `dcc7b94` diagnostic and is left as written. The working tree after the authority repair (REPAIR.md; source pins there) differs from that profile in exactly the following ways. An independent checker must NOT apply these to the retained `322b320`/`5960336` packets or to `vectors/profile-b.json`; a new declared vector is owed after a build.

1. **Type id derivation.** `TypeRegistry.register(bytes32 shape, address acceptor, bytes32[] refs) returns (bytes32 typeId)`. The first argument is a shape commitment, no longer the id. `typeId = keccak256(abi.encode(DOM_TYPE, shape, keccak256(abi.encode(refTypes)), ruleId))` with `DOM_TYPE = keccak256("efs2/type/1")` and `ruleId` = the acceptor's codehash at registration (0 without an acceptor). Registration of an existing id reverts `E_TYPE_EXISTS(typeId)`. The lab fixtures keep their names as shapes (`QUOTE_SHAPE = keccak256("lab/type/quote/1")` …), so every `Action.typeId`, `recordId`, `actionsHash`, `acceptanceProfile` and digest for the same fixture differ from the pinned vector.
2. **Registry surface.** `typeInfo` returns `(registered, acceptor, acceptorCodehash, refCount, activation)` — the acceptor/codehash are the active policy row. New: `activate(typeId, acceptor) returns (uint16)`, `descriptor(typeId)`, `activation(typeId, index)` (reverts `E_ACTIVATION` when absent), `typeIdOf(shape, acceptor, refs)`. Events `TypeRegistered(typeId, shape, ruleId, refCount)`, `PolicyActivated(typeId, activation, acceptor, codehash, epoch)`. `epoch` also bumps on `activate`.
3. **Acceptance profile.** Fold formula unchanged (`keccak256(abi.encode(profile, typeId, codehash, epoch))`); `codehash` is the active policy row's, so a policy activation (not only a registration) invalidates unsent signatures.
4. **Admission row.** `AdmissionRow.meta` bit 152..167 = the policy row index that admitted a publish/reuse. New view `Ledger.acceptanceBasis(uint64) returns (typeId, activation, acceptor, acceptorCodehash, epoch, activatedAt)`; `E_NO_BASIS(uint64)` for other kinds. `admission()`/`evidence()` ABIs unchanged.
5. **Import.** `importPublication` reverts `E_SOURCE_UNSUPPORTED()` when `src.v == 0`; retained `SourceEvidence.grade` is therefore always 1. The signed path, `SourceEvidence` layout and every other check are unchanged.
6. **Unchanged.** `Action` tuple and shapes, `Intent`, `INTENT_TYPEHASH`, domain `(name, version)`, signature parsing/recovery rules, record/subject/position/binding/scope ids, `publicationId`, `indexObligations`, cursor semantics, the FUTURE replay-domain item.
7. **F5 (mandatory rule vs additional policy; after `aaecfed`).** `typeInfo` returns `(registered, mandatoryAcceptor, ruleId, policyAcceptor, policyCodehash, refCount, activation)`; `descriptor` returns `(shape, ruleId, mandatoryAcceptor, refCount, activations, registeredAt)`; policy row 1 written by `register` is `(address(0), 0)` = no additional policy; `activate(typeId, acceptor)` appends a row that must ALSO accept. The Ledger always runs the mandatory rule (`E_REJECTED`, final; codehash re-verified, `E_ACCEPTOR_CODE`) then the policy acceptor (`E_POLICY_REJECTED(uint256 leaf, bytes32 typeId)`, new error). Acceptance profile fold is now `keccak256(abi.encode(profile, typeId, ruleId, policyCodehash, epoch))` (five fields). `acceptanceBasis` returns `(typeId, activation, mandatoryAcceptor, ruleId, policyAcceptor, policyCodehash, epoch, activatedAt)`. `TypeRegistered(typeId, shape, ruleId, mandatoryAcceptor, refCount)`. Fixture convention: mandatory rules are stateless or immutable-configured (`MinBodyAcceptor(32)` for QUOTE, `MinBodyAcceptor(96)` for PAIR; `QuoteAcceptor`, `LabelAcceptor`), so QUOTE's and PAIR's ids now commit to those codehashes, not to `MockAcceptor`'s; the mutable `MockAcceptor` is installed only as policy row 2 through `activate`. Ledger publish path split into helpers (`_beginPublication`/`_endPublication`/`_applyOne`/`_typeOf`/`_bodyOf`/`_checkRefs`/`_acceptAll`/`_admitRecord`) for the via-IR stack — no ABI or state-layout change.
