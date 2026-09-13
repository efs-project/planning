# Independent B expected runtimes — disposable pre-run preparation

`paid-runtime-b.mjs` derives addresses, complete expected deployed runtime
bytes, and full deployment initcode before fixture execution. It does not compile, run initcode, start Anvil,
read RPC, read files, import candidate helpers, or consume candidate measured or
expected outputs. It imports only ethers and the independently authored
`paid-vectors-b.mjs`. This is not a chain-state proof or a measurement.

## Inputs and provenance boundary

The caller supplies compiler artifacts and source-unit ASTs from one independently
verified build. Artifact keys are exact `source:contract` pairs, for example
`src/Ledger.sol:Ledger`; AST keys are exact source names, for example
`src/Ledger.sol`. Each artifact must include parsed `metadata`, `abi`,
`bytecode.linkReferences`, and `deployedBytecode`. Forge `--ast` artifacts can
provide the corresponding source-unit AST through their `ast` field.

The root coordinator owns source, compiler, configuration, dependency and
artifact provenance, and the final pre-run byte seal. This module validates
structural correspondence, not the authenticity of a supplied AST or artifact.
Metadata's single compilation target must match the exact requested source and
contract. Source AST `absolutePath` must match; immutable IDs are resolved from
that exact contract's direct immutable declaration **names**, never numeric
guesses. Any unexpected inherited immutable reference therefore fails closed.

The retained `2859147` build lacks ASTs: its lightweight `build-info` contains
only source-path IDs, not immutable variable declarations. It cannot alone
satisfy this module. The coordinator independently rebuilt pinned `2859147`
with `--ast` for this source-preparation test. Candidate head `7c292e0` is the
declared runner/document pin; source/build equivalence remains a coordinator
check, not an assumption this module can authenticate.

The public profile is a fresh Anvil chain `31337`, the public default test
mnemonic, deployer derivation `m/44'/60'/0'/0/0`, and the declared CREATE schedule
in B's `FIXTURE-MAP.md` / `CONTROLLER-INTERFACE.md`. No worked candidate address,
Type ID or runtime hash is embedded as an expected answer.

## Constructor derivation

The 17 target keys and CREATE nonces are:

| Targets | Nonces |
|---|---|
| registry, acceptor, quoteAcceptor, labelAcceptor | 0, 1, 2, 3 |
| ledger, index, failingIndex, lens | 4, 5, 6, 7 |
| actorA, actorB, consumer, recon | 8, 9, 10, 11 |
| strictAcceptor, quoteRule, pairRule, statelessConsumer | 12, 13, 14, 15 |
| joinedConsumer | 25 |

Noncreation transactions consume nonces 16–24: setIndexModule, six Type
registrations, then two policy activations. CREATE addresses are derived from
the public wallet, not read from an observed deployment packet.

Constructor immutable values come from reviewed public constructor declarations:

- TypeRegistry and Ledger admin are the deployer. Ledger also binds registry,
  `keccak256(utf8('lab/realm/1'))`, and its declared domain separator.
- Ledger's domain separator is
  `keccak256(abi.encode(keccak256('EIP712Domain(string name,string version)'),
  keccak256('EFS2-RoadB-Lab'), keccak256('1')))`. There is no chain ID,
  verifying-contract or Realm field in that domain.
- IndexModule binds Ledger, deployer admin, and `attachedFrom = 1`. Its
  constructor reads the freshly deployed Ledger's admission count, which is
  zero under this public deployment schedule. That is a source-derived initial
  condition; later attachment to populated state is not supported here.
- LensReader, Actor instances, Consumer and StatelessConsumer bind their
  declared Ledger/Index/Lens addresses. MinBodyAcceptor thresholds are 32 and
  96, producing different expected runtime hashes.
- JoinedConsumer binds Ledger, Lens and the independently derived QUOTE_J,
  PAIR, ITEM and LABEL Type IDs. Its Type dependencies come from
  `deriveBInputs` using the five already-constructed expected runtime hashes.

Every constructor ABI type sequence is checked against these declarations.
The full `expectedInitcode` is compiler `bytecode.object` concatenated with the
independently ABI-encoded actual constructor arguments, not merely the compiler
template. `initcodeHash` is Keccak-256 of those full deployment-transaction data
bytes; `initcodeBytes` includes the arguments. Missing, empty, odd-length or
nonhex templates fail closed. Each deployed role has its own initcode result:
quoteRule and pairRule deliberately differ despite sharing one artifact.

Every immutable word is independently ABI-encoded. Missing/unexpected values,
unresolved/duplicate AST IDs or names, incomplete references, non-word offsets,
overlap, out-of-bounds writes, nonzero placeholders and malformed runtime fail
closed. Runtime/initcode link references and configured libraries are unsupported
and rejected. Solc's omitted `immutableReferences` field is accepted only when
the exact contract AST declares no immutables and no values are supplied.

## API

```js
const { targets, runtimeCodehashes } = deriveBRuntimeTargets({
  artifacts,  // { 'src/Ledger.sol:Ledger': parsedArtifact, ... }
  sourceAsts, // { 'src/Ledger.sol': sourceUnitAst, ... }
  neutral,   // parsed sealed requirements; caller verifies original file bytes
  chainId: 31337
});
```

The result additionally includes `chainId` and lowercase `deployer`. Each target
contains `sourceName`, `contractName`, `address`, `nonce`, `expectedRuntime`,
`runtimeCodehash`, `runtimeBytes`, `expectedInitcode`, `initcodeHash`,
`initcodeBytes`, and `substitutions`. Each substitution records
`name`, `astId`, the lowercase bytes32 `value`, and all byte `offsets`.

`runtimeCodehashes` has exactly `quoteRule`, `pairRule`, `quoteAcceptor`,
`labelAcceptor`, and `ledger`, ready for `paid-vectors-b.mjs`. Full expected
runtime bytes must still be sealed and compared with qualified runtime reads;
hash format or internal agreement alone does not establish deployment identity.

`instantiateBRuntime({ artifact, sourceAst, sourceName, contractName,
immutableValues })` exposes the narrow substitution operation for independent
hand-vector tests. It does not modify caller inputs.

## Verification and remaining gates

Run with the already-installed ethers dependency; no package installation:

```sh
NODE_PATH=../planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules node --test Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-runtime-b.test.mjs
```

Set `B_RUNTIME_ARTIFACT_DIR` to the coordinator-verified Forge output directory
to include the real artifact/AST mapping test. Without it that test is explicitly
skipped; synthetic test success is not reported as real build verification.

Source-preparation check on 2026-09-13: **52 tests passed, no failures or skips**
with the coordinator's fresh `--ast` artifacts. The first 44 tests failed before
implementation. The compiler's omitted-empty-reference behavior was separately
reproduced as a failing test before supporting it.
The full-initcode extension also failed its new concatenation, propagation and
malformed-template tests before implementation.

Real expected-runtime derivation covered 17 target instances / 15 unique
artifact contracts, 22 per-instance immutable declaration bindings, 101
32-byte substitution slots, and 66,380 aggregate runtime bytes. Ledger was
17,280 bytes and JoinedConsumer 13,852 bytes. These are offline artifact sizes,
not deployment gas or measured chain outputs.

Hand tests use literal ABI words and direct RLP byte layout for CREATE, exact
contract/name checks with shifted AST IDs, all listed rejection paths, distinct
thresholds, Ledger's independent domain tuple, initial index attachment, and
Type dependency propagation into JoinedConsumer runtime and initcode. Initcode
tests hand-concatenate one/two-word constructor arguments and distinguish a
template change from a runtime change. Both implementation and tests
use the installed ethers Keccak primitive; this is not an independent
cryptographic implementation.

Still required: coordinator review and byte/provenance seals, verified startup
and zero-state assumptions, live runtime comparison at a committed basis,
controller integration, authored-effects checks and qualified paid execution.
Nothing here makes the candidate eligible, proves portability, authenticates
chain state, or retrospectively seals an earlier run.
