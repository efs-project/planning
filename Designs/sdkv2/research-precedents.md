# EFS v2 SDK precedent research

**Status:** reference — dated official-source research; evidence, not an adopted SDK or protocol design
**Target repos:** planning, sdk, contracts, client
**Depends on:** [[README]]
**Reviewers:** @offchain-precedents (2026-08-22), @onchain-precedents (2026-08-22), @wallet-account-standards (2026-08-22), @evm-execution-standards (2026-08-22), @rpc-data-interfaces (2026-08-22)
**Last touched:** 2026-08-22

#status/reference #kind/research #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2 #topic/onchain #topic/read-path

## Scope and method

This pass asks what modern schema, code-generation, contract, and negotiation
systems can teach a century-preserving EFS SDK. It uses primary specifications,
official documentation, and maintainer repositories checked on 2026-08-22.
The important comparison is not popularity. It is whether a precedent helps
EFS preserve exact evidence, evolve without silent reinterpretation, generate
usable application and contract surfaces, reconstruct offline, and replace
tooling without replacing truth.

The existing `sdk/` repository is also evidence. Its viem boundary, injected
read source, profile-stamped artifacts, typed error hierarchy, and concern for
raw provenance are worth preserving. Its EAS substrate, identities, writer
graph, fixed API/package shape, and v1-specific compile-in rationale are not a
v2 baseline.

The Ethereum-specific follow-up metadata-screened every proposal in exact
official EIP/ERC repository snapshots and deeply reviewed the relevant
provider, RPC, transaction, wallet, account, signature, proof, content,
deployment, EVM, future-fork, and agent families. Its dated classifications,
requirements, falsifiers, exit paths, and PM routing are in
[[ethereum-standards-census]]. It is deliberately a census of useful pressure,
not a claim that EFS should implement every proposal.

## Research conclusions

1. **Copy governance and tooling patterns, not another system's wire bytes.**
   Protobuf, Buf, Smithy, WIT, GraphQL, Solidity ABI, and EAS solve different
   problems and leave gaps EFS cannot inherit.
2. **Generation and runtime interpretation are complements.** Generated exact
   façades make known Types pleasant and auditable; a raw-preserving runtime is
   still required for unknown evidence, archival forwarding, capability
   reporting, and reconstruction.
3. **Canonical bytes must be EFS-defined and independently vectored.** Neither
   Protobuf serialization nor Solidity ABI is a self-describing, permanent
   Type system.
4. **Version negotiation is an acceptance proof, not a string comparison.** It
   must bind protocol/result ABI, exact Type or approved finite mapping,
   limits, features, Realm and basis, and any helper code identity.
5. **A generated or deployed adapter is a consumer.** It can validate and
   present EFS evidence; it cannot become the source of Type meaning, Realm
   authority, completeness, or currentness by convenience.

## Offchain schema and SDK precedents

| Precedent | Useful evidence | Copy into experiments | Reject as an EFS assumption |
|---|---|---|---|
| [ABIType](https://abitype.dev/) and [viem contract reads](https://viem.sh/docs/contract/readContract) | Literal ABI artifacts can drive strong TypeScript inference without a mandatory code-generation service. Viem separates public reads from wallet-capable writes. | Immutable ABI inputs, inferred exact contract calls, a narrow injected EVM adapter, and wallet-free reads. Measure browser, worker, server, and bundle costs. | Solidity ABI as the EFS Type system; wallet availability as a read prerequisite; an ABI filename or package as authority. |
| [ethers Interface](https://docs.ethers.org/v6/api/abi/) and [TypeChain](https://github.com/dethcrypto/TypeChain) | Runtime ABI interfaces remain valuable for incumbent integration. TypeChain's maintainers now describe it as legacy and point new users toward ABIType/viem. | A small optional ethers compatibility adapter where real integrations require it. | A new long-lived public surface centered on generated TypeChain wrappers. |
| [Protobuf unknown fields](https://protobuf.dev/programming-guides/proto3/#unknown-fields) | Binary readers can retain unknown fields, but JSON conversion and field-by-field copying can discard them. | Always retain exact raw bytes and make lossless forwarding an explicit operation. Test nested unknowns, malformed inputs, and copy/relay paths. | DTO-to-JSON-to-DTO as an evidence-preserving path. |
| [Protobuf canonicality warning](https://protobuf.dev/programming-guides/serialization-not-canonical/) | Protobuf explicitly does not promise canonical serialization. | A separately specified EFS canonical encoder with cross-language vectors; hash retained canonical bytes, not library reserialization. | Signing or identifying whatever a Protobuf runtime happens to serialize. |
| [Protobuf JavaScript generation](https://protobuf.dev/protobuf-javascript/) | The official JavaScript implementation does not preserve unknown fields. | Treat unknown retention in TypeScript as a tested EFS invariant, never as a format-level assumption. | Choosing a JS library merely because the schema language advertises forward compatibility. |
| [Protobuf field presence](https://protobuf.dev/programming-guides/field_presence/) | Explicit presence distinguishes unset from a present default value. | Generated DTOs that distinguish absent field, present zero/empty, unavailable bytes, unsupported field, and invalid evidence. | Collapsing `undefined`, empty, zero, absence, and retrieval failure. |
| [Buf breaking-change checks](https://buf.build/docs/breaking/) | Compatibility can be checked against named baselines at source/package, wire, and JSON surfaces. | Separate semantic, canonical-byte, generated-source, result-ABI, query-coverage, and operational compatibility reports. | One undifferentiated `backwardCompatible: true`. |
| [Buf lockfiles](https://buf.build/docs/configuration/v1/buf-lock/), [remote plugin pinning](https://buf.build/docs/bsr/remote-plugins/), and [generated SDKs](https://buf.build/docs/bsr/generated-sdks/) | Schema commits, plugin versions/revisions, generated native packages, and docs can be locked together. Unpinned plugins can resolve to changing output. | Retain source closure, compiler and plugin identity, runtime compatibility, output digests, docs, vectors, and a clean-room regeneration recipe. | A hosted registry or `latest` generator as a historic decode dependency or durable authority. |
| [Smithy evolution](https://smithy.io/2.0/guides/evolving-models.html) | Optional members can be additive; clients need an explicit unknown union case. | Directional evolution reports and unknown branches that also preserve the exact unknown bytes. | Exhaustive closed unions at a trust boundary with no future/unknown case. |
| [Smithy code generation](https://smithy.io/2.0/guides/building-codegen/overview-and-concepts.html) | Generated clients can be independent of the source model at runtime; Smithy also supports model validation and pluggable code generation, but that does not prove portable validator behavior. | Standalone generated DTOs, codecs, docs, bounds, references and vectors; EFS separately binds exact validator implementation/profile/vector evidence. | Runtime access to a mutable schema service as a prerequisite to understand retained evidence, or a model validator name as a portable validation guarantee. |
| [Smithy model validation](https://smithy.io/2.0/spec/model-validation.html) | A validator name in a model does not itself provide every implementation. | Exact validator profile/version and a typed unsupported result when an implementation is absent. | Treating a validator reference as proof validation occurred. |
| [WIT worlds](https://component-model.bytecodealliance.org/design/worlds.html) | Worlds declare explicit imports and exports; absent capabilities are genuinely unavailable to a component. | A later optional resolver/codegen world with explicit network, storage, clock, and signing imports. | Ambient wallet, filesystem, network, or Kernel access. |
| [WIT packages](https://component-model.bytecodealliance.org/design/wit.html) and [Component Model scope](https://github.com/WebAssembly/component-model) | WIT provides interface vocabulary, while package resolution, persistence, and distributed partial failure remain outside its scope. | WIT as an optional replaceable execution boundary after browser/toolchain evidence. | WIT package names as EFS identity, distribution, evidence retention, or full version negotiation. |
| [GraphQL Code Generator client preset](https://the-guild.dev/graphql/codegen/plugins/presets/preset-client) | Exact operations can generate precise client result types. | Pin indexer schema plus exact operations and generate adapter-local DTOs. | A GraphQL object type as a complete EFS Record or a stable protocol Type. |
| [Apollo normalized cache](https://www.apollographql.com/docs/react/caching/overview) | A replaceable local cache can accelerate product reads. | Cache only qualified results under their full Realm, basis, profile, policy, completeness, and byte identity. | Cache hit/miss as authority, currentness, completeness, or absence. |
| [GraphQL over HTTP draft](https://graphql.github.io/graphql-over-http/draft/) | Explicit response media types and partial result/error shapes are useful transport evidence. | Measure an optional typed indexer transport; preserve partial/error provenance. | Draft transport behavior as permanent EFS law or an indexer as a required truth source. |
| [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html) and [media-type registration](https://www.rfc-editor.org/rfc/rfc6838.html) | `Content-Type` and `Accept` provide explicit representation negotiation; sniffing is unsafe. | Strict, versioned HTTP representations with typed unsupported/downgrade outcomes. Keep durable encoding identity inside EFS evidence as well. | Sniffing, nearest-version fallback, URL-only format identity, or a `+json` suffix for non-JSON bytes. |

## Ethereum and Solidity precedents

| Precedent | Useful evidence | SDK consequence |
|---|---|---|
| [Solidity ABI specification](https://docs.soliditylang.org/en/latest/abi-spec.html) | ABI data is not self-describing and assumes types are statically known when compiling. Error bytes may be forged or bubbled from another call. | Generate exact-Type consumers. Use explicit result structs/enums for expected read states; reserve custom errors for local programmer/input failures. Never infer authority from revert data. |
| [Solidity libraries](https://docs.soliditylang.org/en/latest/contracts.html#libraries) | `internal` library functions compile into the consumer; external/public Solidity library functions use library calling conventions and `DELEGATECALL`. | Exact generated codecs/validators should be `internal pure/view`. Any optional deployed helper exposes an ordinary contract interface and is called with `STATICCALL`, never as an authority-bearing external Solidity library. |
| [Solidity immutables](https://docs.soliditylang.org/en/latest/contracts.html#constant-and-immutable-state-variables), [metadata](https://docs.soliditylang.org/en/latest/metadata.html), and [compiler output](https://docs.soliditylang.org/en/latest/using-the-compiler.html) | Constructor values, compiler settings, sources, paths, link references, and metadata influence deployed bytes. | A Solidity release packet retains standard JSON input/output, compiler binary/version, sources, remappings, constructor args, immutables, metadata, ABI, vectors, and runtime/initcode hashes. |
| [ERC-165](https://eips.ethereum.org/EIPS/eip-165) | An interface ID is a cheap optional capability claim, not a semantic/version proof. | Use only as an early probe. Exact accepted capability tuples still bind result ABI, Type/descriptor, limits, features, and code identity. |
| [ERC-1820](https://eips.ethereum.org/EIPS/eip-1820) | Registrations are manager-mutable and cached capability answers can become stale. | No required global EFS codec/helper registry. Discovery is inert evidence and never silently selects semantics. |
| [ERC-1967](https://eips.ethereum.org/EIPS/eip-1967) and [EIP-1052](https://eips.ethereum.org/EIPS/eip-1052) | Proxy implementation/admin state can change; `EXTCODEHASH` identifies the code at the queried address, not hidden proxy semantics or mutable contracts/data the code reads. | Experimental helpers are direct deployments with no proxy, beacon, or diamond. Pin address/code plus semantic/result/limits and finite dependency/basis commitments, or restrict the helper to caller-supplied bytes. |
| [EIP-170](https://eips.ethereum.org/EIPS/eip-170) and [EIP-3860](https://eips.ethereum.org/EIPS/eip-3860) | EVM runtime code is capped at 24,576 bytes and initcode at 49,152 bytes. | Generated code size is a first-class gate. Keep deliberate headroom and stop before size pressure drives an upgradeable or generic schema VM. |
| [EIP-2929](https://eips.ethereum.org/EIPS/eip-2929) and [EIP-150](https://eips.ethereum.org/EIPS/eip-150) | Cold account access and call gas forwarding make deployed helpers materially costly under composition. | Compare cold/warm and nested calls; a helper must win end-to-end lifecycle measurements, not an isolated microbenchmark. |
| [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193), [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963), [EIP-1898](https://eips.ethereum.org/EIPS/eip-1898), [EIP-234](https://eips.ethereum.org/EIPS/eip-234), and [EIP-7910](https://eips.ethereum.org/EIPS/eip-7910) | Provider discovery, exact block-hash qualification, log-basis coherence, and execution-config observation can replace proprietary environment assumptions. | Keep provider selection explicit; separate accepted from observed capabilities; resolve finality tags once and pin the logical read. Provider metadata/config is evidence, not authority or proof. |
| [EIP-712](https://eips.ethereum.org/EIPS/eip-712), [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271), [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492), [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702), and [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) | Modern Ethereum signing is strategy- and basis-dependent: EOAs can delegate code, contract validity can change, and counterfactual/account-abstraction paths depend on factories and infrastructure. | Produce one exact typed EFS plan; keep EOA/1271/6492 signature verification separate from transaction, `userOpHash`, delegation-tuple and wallet/bundler authorization/submission receipts while binding each back to that plan and canonical read-back. Never permanently classify a signer from current code presence. |
| [EIP-2718](https://eips.ethereum.org/EIPS/eip-2718), [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559), [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930), and [EIP-5792](https://eips.ethereum.org/EIPS/eip-5792) | Typed transactions, modern fees/access lists, and capability-shaped wallet call batches are established interoperability surfaces. | Preserve unknown transaction envelopes raw, inject transaction construction, and treat wallet bundle status as submission evidence followed by canonical read-back. |
| [EIP-4444](https://eips.ethereum.org/EIPS/eip-4444), [EIP-7642](https://eips.ethereum.org/EIPS/eip-7642), and [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) | Execution history and blob bytes are not guaranteed to remain available from ordinary nodes. | Make history/archive/byte availability explicit and reconstruct from retained durable evidence. Blob references are an optional ephemeral transport, never century storage. |
| [EAS contracts](https://github.com/ethereum-attestation-service/eas-contracts), [EAS SDK](https://github.com/ethereum-attestation-service/eas-sdk), and [SchemaResolver](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/resolver/SchemaResolver.sol) | EAS separates schema registration, attestations, and optional executable resolver policy. | EAS remains an optional attributable carrier adapter. Bind chain/address plus the exact schema text/UID/resolver/revocability tuple and independently decode payloads. Resolver code hash is only extra qualification: it neither proves immutable policy nor pins a proxy-backed resolver. No v2 identity or migration promise follows. |

## What this research supports

The evidence supports architecture arm C in [[architecture-candidate]]:

- a small offchain model/codec/result/reconstruction runtime;
- deterministic Type compilation into exact standalone façades;
- explicit environment and transport adapters;
- generated internal Solidity leaf libraries plus a narrow Core ABI;
- a structural generic probe that never interprets arbitrary Type semantics;
- an optional helper lane that must beat conservative size/gas/security
  tripwires and always has a local generated fallback.

It does **not** select canonical Type bytes, Protobuf, JSON, Solidity ABI, WIT,
GraphQL, EAS, viem, npm package names, or any deployed reader as EFS protocol.

## Research gaps carried into experiments

1. Compare candidate canonical encoding profiles with independent
   implementations; the precedents do not choose one for EFS.
2. Test JavaScript/browser raw preservation explicitly, including nested
   unknown data, structured clone, worker transfer, storage, and JSON escape
   paths.
3. Measure TypeScript facade ergonomics and guest bundle/parse cost on actual
   Files, Git, Nanda, and contract-reader fixtures.
4. Measure inline Solidity, bounded generic probes, and a stateless helper at
   complete consumer lifecycle cost, under cold calls and hostile inputs.
5. Prove exact regeneration without a package registry, source website,
   publisher, original indexer, or mutable network read.
6. Refresh the EIP/ERC snapshot before any release packet and prove each
   advertised chain/provider/wallet/account/precompile/factory capability with
   exact conformance vectors rather than proposal status or marketing labels.
