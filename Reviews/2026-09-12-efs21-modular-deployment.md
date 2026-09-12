# EFS2.1 — contract size is a modularity task

**Standing:** engineering recommendation following James's September 12 question; source review, not an implemented facet, measured saving, permanent topology choice or protocol promotion.

Independent source review approved one bounded typed-facet experiment. Root read
the source review and incorporated its early gates: both `counts` overloads and
Record batch selectors, preserved rejection order, actual transitive code pins,
the 150,000-gas peer-configuration budget, and a legal eight-record response of
67,264 ABI bytes. A generic 64 KiB router return cap would break that response.
The byte count is derived from the existing ABI, not a measured gas result.

## Short answer

James is right: facets, external libraries and separate state-owning contracts
are ordinary ways to build systems larger than one EVM contract. The prototype
has separate admission, preparation and read algorithms, but its final Core
implementation still inherits many raw and checked read adapters, ABI encoders,
control functions and authority functions. An ordinary upgrade proxy replaces
that implementation; it does not divide the implementation's code.

The full-model mandatory-index extraction reached **24,761 bytes against the
24,576-byte runtime cap** after five retained probes. This is a real refusal
for that artifact, not a reason to abandon index separation, Types, Lenses or
history. The effort spent shaving a few wrappers over-prioritized the current
prototype packaging. A coherent module boundary is the next engineering step.
The incomplete extraction remains separately preserved at `f873890`; the
reviewed full-model control remains `ebc7d54`. See the
[[2026-09-12-efs21-posting-store-plan|extraction record]].

## Proposed next experiment

The [[2026-09-12-efs21-typed-read-facet-plan|reviewed two-stage implementation plan]]
names the exact selector/storage/configuration boundary, tests actual complete
deployment first, then qualifies and prices unchanged-storage operations. It is
staged separately from the active canonical-Type bridge; no facet result yet.

Use a **typed read facet**: one separately deployed contract containing the
existing read adapters, behind a fixed, explicitly enumerated Core selector
router. Applications continue making normal typed calls to the Core address.
Delegation lets the facet read the same namespaced Core storage; no new opaque
bytes API, duplicate state exporter or feature reduction is inherently needed.
Keep writes, authority, execution configuration and the small read-context
endpoint local. Keep the facet free of admission, initialization and upgrade
entrypoints.

This is diamond-style routing, not a claim of full ERC-2535 conformance. A full
diamond's cuts, loupe, events and upgrade controls are worth evaluating if their
management/tooling benefits justify them. The first experiment needs only a
fixed read module selected by an explicitly versioned implementation release;
it need not add a second independently mutable upgrade authority.

The evaluation order matters:

1. Split the read code against `ebc7d54`, preserving its existing storage and
   all logical APIs. Compile and deploy the complete linked graph under normal
   caps, with useful headroom rather than a handful of spare bytes.
2. Check existing FilesRouter calls, same-basis reads, authority and upgrade
   behavior. Price real contract-paid reads and complete Files operations,
   including extra routing/context calls and deployment costs.
3. Reapply the mandatory index-store extraction to that module-shaped control.
   Compare both arms with the same code topology so index costs are attributable.

The canonical-Type/native-Files experiment already in progress is separate.
Its narrower authority and collaboration profile must not be advertised as the
same guarantees at a lower price. Likewise, a facet result cannot substitute
for testing canonical Types in that cheaper path.

## Ordinary engineering gates, not new product requirements

- **Actual code placement:** remove read implementations from Core inheritance;
  forwarding to them while retaining inherited copies does not solve the cause.
- **Typed ABI and routing:** publish the composed ABI and complete selector set;
  a compiler's Core-only ABI omits fallback-served functions. Reject unknown
  selectors and collisions with local or outer-proxy control methods.
- **Storage and callers:** preserve the fixed storage namespace and caller
  behavior. A delegated call retains the caller; a separate ordinary call has
  different storage and caller context. A checked facet's self-call to the local
  context endpoint must terminate, and its changed nested caller must not
  silently become an authorization input.
- **Authentic execution:** bind the actual facet, linked read libraries and
  selector profile into deployment/execution qualification. A stable proxy
  address or self-reported module list is not sufficient. Preserve failed
  upgrade rollback and the existing bounded peer-configuration call.
- **Read-only behavior:** typed view consumers use STATICCALL, whose restriction
  propagates through delegation. A direct transaction is not automatically
  static; test authentic no-write behavior and substituted modules explicitly.
- **Future freezing:** disabling one diamond cut method is insufficient if an
  outer proxy or factory can still replace behavior. Testnet upgradeability and
  eventual permanent immutability remain distinct requirements.

No runtime size, gas price or feature parity is claimed for the proposed facet
yet. **Partitioning code and reducing write amplification are different jobs.**
Both matter, but neither needs to be mistaken for a fundamental limit on the
other.

## Primary sources

[ERC-2535](https://eips.ethereum.org/EIPS/eip-2535) defines the facet/delegation
pattern and the additional requirements for standard-conforming diamonds.
[EIP-170](https://eips.ethereum.org/EIPS/eip-170) specifies the per-runtime cap
used by this experiment. Solidity's
[inheritance](https://docs.soliditylang.org/en/v0.8.30/contracts.html#inheritance)
and [library](https://docs.soliditylang.org/en/v0.8.30/contracts.html#libraries)
documentation explains why inherited/internal code still compiles into the
caller, while external library calls can place code elsewhere. Sources checked
September 12; these are implementation precedents, not EFS protocol adoption.
