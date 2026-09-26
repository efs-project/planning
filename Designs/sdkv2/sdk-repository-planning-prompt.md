# SDK repository initialization — developer planning prompt

**Status:** reference — assignment for a concrete plan and SDK PM review before repository creation
**Target repos:** planning, sdk, contracts, client
**Depends on:** [[repository-and-distribution-plan]], [[../efsv2/prototype-delivery-checklist]], [[../web-client-os/client-repository-and-development]]
**Last touched:** 2026-09-26

#status/reference #kind/prompt #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2

## Copyable assignment

You are drafting the initialization and architecture plan for EFS's clean `sdk-v2` repository. Return the plan to the SDK PM for review before creating repositories or implementing product code. The contracts and Web Client repositories are maintained separately and developed alongside this SDK.

Start with `AGENTS.md`, the planning repo guidance, current EFS v2 owner rulings and living delivery checklist, and `Designs/sdkv2/repository-and-distribution-plan.md`. Read the SDK result/architecture design, current M1–M2 briefs, prototype closeout and the Web Client repository proposal. Current owner direction controls; v1 SDK code and old design snapshots are evidence only. Use exact input revisions and identify stale/conflicting sources.

Design for three independently useful environments:

1. Portable TypeScript/JavaScript for static browsers, workers, Node servers, scripts and JS agent harnesses.
2. Source-distributed Solidity libraries/interfaces for contracts that read, validate and write EFS directly, preserving the consuming contract as caller/author.
3. Native and agent integrations through reusable Node services, CLI and an independently packaged MCP adapter; a small OpenAPI-described HTTP boundary when a non-JS consumer needs it. Compare a native Rust implementation only where platform or measured performance requirements warrant it. Native mount drivers and product installers remain a separate product responsibility.

Use one repo with independently buildable packages and shared semantic evidence. The proposal recommends `sdk`, `evm`, `solidity`, minimal `codegen`, and private conformance tooling first; `node`, `cli`, and `mcp` appear with their working slice. Package names are illustrative and may conflict with legacy npm names. Do not create empty future packages or a bespoke framework. Explain any departure with consumer evidence and maintenance consequences.

Deliver one concrete plan containing:

- Annotated repository tree, dependency directions, public exports and ownership. Show what a TS-only contributor, Forge-only contributor and ordinary package consumer must install. Include generated-code ownership and the separation of generic typed data, Files profiles, runtime and transport.
- Proposed `package.json`/workspace/tsconfig/Foundry settings as reviewable snippets, exact tool versions and reasons. Start with tsc ESM output and declarations, explicit exports, pinned pnpm, Forge/solc and no mandatory build orchestrator; justify bundling, CommonJS or native dependencies if needed. Browser guest imports must exclude wallet, Node, compiler and MCP code.
- Contracts input artifact/lock contract: interface sources, ABI/errors/events, profile/Type vectors, compiler/runtime/deployment identity and one shared local fixture recipe. Coordinate the manifest with Contracts and Web Client. The SDK must build/test from its own checkout; explicit local overrides must be diagnosed and excluded from releases.
- SDK facade and lifecycle examples: resolve/list/read with qualification, typed publish/update/staged save, explicit authorize/submit/reconcile, persisted ambiguous attempts and exact-build offline export/restore. Expected uncertainty stays data. Include raw evidence and capability escape hatches without forcing UI code to assemble internal rows.
- Solidity build/distribution design: isolated Foundry project; small generated internal libraries; exact upstream interfaces; caller attribution, code size and gas tests; npm source package plus deterministic standalone source archive and Git/remapping recipe. Prove fresh consumers need neither TypeScript nor codegen. A deployed helper requires separate measured justification.
- Native integration design: snapshot/live enumeration, wide offsets/range streams, verified byte grades, bounded cache, journal durability, reconnect/rescan, partial/unknown host errors and staged writes. Define one real non-JS consumer, sidecar process/authentication/packaging constraints, and measurable criteria for adding Rust. Do not promise POSIX atomicity/fsync or portable historical proofs the protocol cannot supply.
- MCP/HTTP plan: official MCP SDK with pinned supported spec/harness versions, stdio first, finite resources/tools with qualified structured results, explicit authorization, separate skill fetching and activation. Current MCP 2026-07-28 negotiation differs from legacy initialization; test the supported profiles. OpenAPI describes optional service operations; JSON schemas never define canonical EFS bytes. Verify generator preservation of decimal wide integers, byte encoding, unknown outcomes and stream metadata in another language.
- Release policy: package-specific changesets, protocol/profile/package version separation, exact compatibility manifest, prerelease naming, legacy npm namespace handling, OIDC trusted publishing, source licenses, packed-consumer checks, artifact digests/provenance and documentation/archive closure. Publish checked tarballs and explain recovery from partial multi-package publication. Do not assume a registry transaction is atomic.
- Proportionate CI graph: pure/type/format checks; generated drift; shared cross-language vectors with an independent oracle; Forge consumer; packed Node/JS/browser/Worker consumers; MCP/native round trips; hostile pagination/write-recovery cases; a joined contracts→SDK→static-client fixture and source-off recovery. Include Windows/macOS for surfaces that claim them. Default CI needs no paid service, wallet or public-network fork.
- Local development commands using the single contracts-owned fixture protocol. Support isolated workers/devnets and explicit shared attachments; manifest verification and owned process cleanup; preserve running user environments. Keep dev keys/control APIs outside shipped artifacts.
- Small public docs and agent workflow: runnable install recipes, support/limits table, evidence/error/retry guide, ADRs, generated API docs, package owners and lane checks. Public instructions must not require access to the private planning repo.

Separate established requirements, recommended reversible choices and unresolved release decisions. Do not restart a whole Core architecture comparison. Prioritize the expensive seams: protocol input authority, lossless result and serialized evidence contracts, Solidity import/ABI stability, native filesystem mismatch, namespace/versioning, release reproducibility and exact-build recovery.

End with staged acceptance and specific questions for the SDK PM:

1. Pack/install one exact Type in TS and Solidity from a SDK-only checkout.
2. Use one deployment/profile release for static guest list/open, an ordinary-wallet guarded mutation, lost-response reconciliation, an independent contract read/write, populated upgrade and cold reconstruction.
3. Reuse the same operations from a Node script, local MCP client and non-JS consumer; fetch/store one skill bundle without implicitly activating it; exercise the headless drive contract.
4. Rehearse the release into local artifacts, measure browser/native constraints, and return remaining namespace/tool/support choices before public publication.

This assignment requests a reviewable plan. Repository creation, product implementation, package publication, deployment and protocol freeze are separate later actions.
