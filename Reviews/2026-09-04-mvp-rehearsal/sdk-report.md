# SDK rehearsal report

**Status:** disposable local experiment implemented and exercised against the
real rehearsal contracts. This is not an adopted v2 SDK, C0 conformance result,
wire-format freeze, package release, or production recommendation.

## Delivered

- `sdk/index.js`: browser-compatible ESM façade over injected EIP-1193 read,
  wallet, relay, and session transports. It implements exact reads, bounded
  pages, verified immutable bytes, plan/prepare/submit, and independent
  canonical read-back.
- `sdk/index.d.ts` and `sdk/sample.ts`: TypeScript-facing contract and a minimal
  relayed-flow example, including a discriminated `CanonicalReadBack` result.
  The pinned TypeScript 5.9.3 strict compiler gate checks the sample.
- `test/sdk-unit.test.mjs`: synthetic seam/fault tests for exact bytes and IDs,
  domain binding, the strict schema subset, exact `Missing()` discrimination,
  descriptor-identity substitution, page scope, corrupt bytes, runtime mismatch,
  unavailable basis, numeric precision, transport separation, and lossless
  evidence serialization.
- `test/sdk-authority.test.mjs`: real-chain fault regression proving unavailable
  direct transaction evidence and a contradictory relayed receipt signer cannot
  produce `READ_BACK_VERIFIED` or `effect=COMMITTED`.
- `sdk-design.md`: the five-seam interface, explicit provider boundary, ABI
  needs, strict reference encoding, and Solidity consumer relationship.

The implementation imports only ethers 6.15.0 and local rehearsal artifacts;
it imports no v1 EFS package, contract, address, or deployment default.

## What the real-chain run demonstrated

The focused Anvil integration (`node --test test/integration.test.mjs`) passed
11/11 subtests on 2026-09-04 after compiling/deploying the real Solidity lab:

- guest exact reads and an independently recomputed root identity;
- relayed owner EIP-712 write, direct owner transaction, and bounded session
  write with distinct wallet/relay/session transports;
- inclusion remaining `effect=UNKNOWN` until state and receipt read-back;
- independent receipt digest, operation bytes, result/revision IDs, recovered
  low-s signer, historical grant boundary, state tuple, directory membership,
  carrier bytes, and schema/reference validation;
- later revision and grant revocation not erasing an earlier accepted effect;
- cold current/historical byte recovery without original input buffers;
- stale CAS, substituted signature, incompatible typed reference, corrupt
  carrier response, provider failure, and partial-page behavior.

Canonical success now requires both complete state equality and recovered
historical admission authority. `stateEffect=OBSERVED_AT_BASIS` remains separate
so a caller can see that state matched even when direct transaction evidence is
unavailable or signer/grant evidence conflicts; in those cases top-level effect
stays `UNKNOWN`.

All semantic calls use EIP-1898 `{blockHash, requireCanonical:true}`. Before
interpreting a value, the SDK checks the supplied Core/carrier runtime hashes
and Core `runId`, `rootId`, `owner`, and `byteStore` facts at that same basis.
Unsupported pinned calls, non-`Missing()` reverts, malformed pages, unavailable
bases, and missing carrier evidence remain qualified `UNKNOWN`/unavailable;
they do not become absence, completeness, valid data, or success.

Exact and typed schema reads independently recompute
`deriveSchemaId(returnedDescriptor)`. A valid-shaped substituted descriptor is
retained in raw provider evidence and exposed as an observed value, but receives
`integrity=FAILED`, `validation=INVALID`, and no trusted decoded value.

## Evidence boundary and remaining gaps

The synthetic 6/6 SDK unit run, real 11/11 workflow run, 1/1 real authority
fault run, and strict TypeScript sample check are lab evidence only.
They do not establish browser interoperability until the separate Chromium run,
nor full C0, protocol, security, gas, finality, archive-provider, or adversarial
RPC conformance.

Known deliberate limits:

- runtime hashes and deployment facts enter through `/config`; the SDK verifies
  their local consistency but does not establish their external authority;
- EIP-1898 support is mandatory for qualified semantics; there is no silent
  number/latest fallback;
- receipt search, directory traversal, session history, and ancestry checks are
  bounded. Exceeding a bound yields `UNKNOWN` rather than a false conclusion;
- direct-write authority is independently recoverable only while the
  transaction body is available; stored signer data alone is never proof;
- only EOA low-s 65-byte signatures and the lab's five strict schema tags are
  covered. EIP-1271/6492, ERC-4337/7702, production session policy, richer
  codecs, proofs, quorum/finality, caching, and multi-network discovery remain
  outside this experiment;
- the compile-in Solidity helper is a separate bounded consumer experiment. It
  is not a deployed SDK service or a frozen cross-language API.

Promotion requires owner review of the exact ABI/codecs/limits, independent
cross-implementation vectors, expanded fault/fuzz coverage, a reproducible CI
gate, and the full C0 acceptance suite. Nothing here authorizes copying the lab
surface into a permanent SDK repository unchanged.
