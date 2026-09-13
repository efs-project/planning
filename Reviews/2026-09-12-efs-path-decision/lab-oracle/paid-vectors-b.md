# Independent B physical vectors — disposable paid slice

`paid-vectors-b.mjs` independently translates the sealed neutral requirements into
the public B controller input shape. It does not import candidate implementation,
verifier, runner, tests, artifacts or result packets. No candidate worked hash is
an expected answer in this module or its tests.

## Inputs and authority

- Semantics: the requirements-only `paid-neutral-expectations.json` in the
  canonical planning review. SHA-256:
  `ff7c4fc735504c9871e8241c7cc461293b7ffc37f3d5e9dd50840e005cc37795`.
- Physical representation: the candidate's public `CONTROLLER-INTERFACE.md`,
  `FIXTURE-MAP.md`, and input declarations in `vectors/fixture-map-b.json`.
  Item bodies `abi.encode(uint256(1))` / `abi.encode(uint256(2))` and the Pair's
  trailing `uint256(1)` are representation declarations, not neutral semantics.
- Placement budget `16` is Root's pre-run pin from the public
  `controller-interface.example.json`. It is not a cost-derived success ceiling.
- The only supported account/deployment profile is a fresh Anvil chain `31337`,
  the public default test mnemonic, wallet indices deployer `0`, A `1`, paid
  caller `3`, actorB CREATE nonce `9`, and Ledger CREATE nonce `4`.
- Five nonzero bytes32 runtime hashes are mandatory caller inputs: `quoteRule`
  (MinBodyAcceptor 32), `pairRule` (MinBodyAcceptor 96), `quoteAcceptor`,
  `labelAcceptor`, and `ledger`. Hash format checks do not verify their source,
  immutable configuration, deployment or authenticity. Root must independently
  establish and seal those facts before any fixture operation.

The derivation functions accept a parsed neutral object. They validate the
supported fixture, coordinate, selection and author semantics, but cannot
authenticate the original JSON bytes from that object. The test reads and checks
the exact source file SHA; the controller must independently check its own input
file bytes against the same pin. These functions never read files or call RPC.

## API

```js
deriveBInputs({
  neutral,
  runtimeCodehashes: { quoteRule, pairRule, quoteAcceptor, labelAcceptor, ledger },
  chainId: 31337,        // optional; no other chain accepted
  placementBudget: '16' // optional; canonical positive uint256 decimal string
})
```

Returns only `types`, `fixture`, `subject`, `roles`, `lenses`, `expect`,
`placementExpect`, and `ordinals`. It contains all six Types and six records,
both full 12-field `Expect` values, the six-field `PlacementExpect`, and decimal
ordinals including `placementRevision`. Decimal strings and lowercase hex match
the public controller interface. Wallet indices and CREATE nonces remain JSON
numbers. No mnemonic or private key is returned.

`deriveBReadCoordinates(options)` accepts the same options and returns
`realmId`, `realmOrigin`, `deployment.ledger`, `principals`, `purposes`,
`positions`, `bindings`, `scopes`, `lensIds`, and `frontier`. These supplement
qualified read-back; they are deliberately not extra strict-interface fields.
`B_PLACEMENT` and `B_TAG` are keys to query, not claims that those bindings exist.

The declared contract-principal origin is
`keccak256(abi.encode(uint256(chainId), LedgerRuntimeCodehash))`. It is a known
prototype profile only, not a general contract identity rule or portable
authorship proof. Ledger address is independently CREATE-derived but is not
silently added to that origin formula.

## Tests and evidence limit

Run from the worktree root using the already-installed dependency directory:

```sh
NODE_PATH=../planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules node --test Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-vectors-b.test.mjs
```

The tests use synthetic runtime hashes. Their Type/Item checks construct literal
ABI words without `AbiCoder` or the module's helpers; Quote scalar words and the
contract-origin tuple also have hand-encoded checks. Other tests exercise rule
changes through the Type/record dependency graph, missing/malformed hashes,
wrong semantic labels/scopes, order-sensitive Lenses and A1 placement provenance
independent of selected B authorship. Both code and tests use the installed
ethers Keccak primitive; this is not an independent cryptographic implementation.

These tests establish offline vector behavior, not controller integration,
runtime-bytecode agreement, chain-state authentication, actual authored effects,
page completeness, successful paid execution, gas results or finalist eligibility.
Root still owns controller sealing, qualified read-back and any runtime evidence.
