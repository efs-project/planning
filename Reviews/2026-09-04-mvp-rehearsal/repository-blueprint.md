# Repository and integration blueprint

**Status:** recommended engineering design informed by the local laboratory;
no product repositories have been created.

## Repository boundaries

Create three small repositories when implementation starts: Core contracts,
SDK and Web Client. Arcade begins as an application workspace/package in its
own later repository or in the web prototype until its package/runner contract
is stable. Data Explorer is a separate application and role, sharing Reader
and schema services with Files. It is not a required gateway for public links.
The choice of repository names can wait until creation without delaying code.

| Repository | Initial contents | Published interface |
|---|---|---|
| Core | Solidity modules, carrier, deploy/bootstrap scripts, Foundry tests, independent reference reader, exact vectors and compiler inputs | versioned ABI + runtime/code hashes + canonical codecs + run manifests; Type/index/grant fixtures and historical evidence |
| SDK | browser/Node TypeScript packages and a Solidity helper package; codecs, reader, planner, wallet/relay adapters, verification | explicit deployment/profile objects, five result-preserving seams, typed view adapters and compile-in contract interfaces |
| Web Client | static direct Reader, Files, raw Inspector, lazy wallet flow; shared accessible components and local test harness | versioned app/host and presentation interfaces; no hidden Core authority or independent protocol encoder |
| Arcade application | exact release descriptor, verified artifact acquisition, sandbox runner, input/accessibility/lifecycle adapter | inert application/package handoff plus explicitly requested execution |

The contracts tree starts with `src/`, `test/{unit,fuzz,invariant,integration}/`,
`reference/`, `fixtures/{golden,rejected}/`, `scripts/`, `artifacts/{consumer,runs}/`
and `docs/{spec,adr,runbooks}/`. Keep deploy targets explicit, generated caches
ignored, compiler inputs retained, and one local/CI check command. Carry v1
deployment lessons forward; its EAS/Scaffold-ETH code and network defaults are
not dependencies of this design.

For the laboratory retain Foundry 1.7.1, solc 0.8.30, Cancun, optimizer 200,
via-IR, Node 26.0.0 and ethers 6.15.0. These are reproducibility pins. The
production SDK/browser toolchains remain their PMs' measured implementation
choices: the Web Client's native HTML/CSS/ES-module boundaries survive changes
to its bundler, component library and framework decision.

## Contract interaction

One Core owns semantic writes, admission receipts, indexes, authority and
Bindings. Internal modules/libraries can have separate files without separate
deployed addresses. The carrier accepts writes only from that exact Core.
Publication, nonce/budget consumption, Binding CAS, index updates and carrier
writes commit together. Any downstream failure reverts the whole operation.

Deploy-time infrastructure creates the run; it acquires no permanent app or
user authority. Plans, routes, mounts, files and game releases are data.
Clients and app contracts consume bounded Core reads; they do not need a
deployed SDK service. Start with a compiled-in Solidity library and an explicit
Core/Realm/profile argument. An external stateless helper earns inclusion only
if measured code size, tooling or reuse makes it useful.

Ethereum's [runtime code limit](https://eips.ethereum.org/EIPS/eip-170) is a
measured architecture constraint. Compile the real baseline early. If a full
Core exceeds it, compare immutable fixed library/facet deployment with separate
state owners using the same tests; do not disable the limit to pass the demo.

## SDK contract

Use [sdk-design.md](sdk-design.md) for the actual lab interface. Production
packages should keep deterministic codecs separate from RPC and wallet code,
so Solidity, Node, browsers and third-party implementations can share vectors
without importing each other's implementation as an oracle.

Expose exact reads, bounded pages, verified bytes, plan/authorize/submit, and
canonical read-back. A convenience `saveFile` may compose them, but retains
the individual causal records. Guest reads never initialize a wallet. A user
may choose relayed approval, a direct transaction or an existing bounded
session. A failed path must not silently escalate to a stronger permission.

Onchain consumers require explicit limits and a conservative typed result.
Neither a missing provider response nor an unsupported schema is proof of
absence. ABI decoding and returndata allocation must themselves be bounded;
an interface return type alone does not enforce that.

## First build milestones

1. Materialize exact C0 inputs and real admission/index/authority modules.
2. Execute C0 genesis and one atomic file creation with independent read-back.
3. Bind the SDK and minimal Files UI to those serialized artifacts.
4. Demonstrate direct fallback, bounded sessions, cold reconstruction and
   contract consumption with the same expected values.
5. Add the Data Explorer's schema-driven table view and Arcade's exact-release
   launcher through those existing boundaries.
6. Rehearse one named development-chain deployment and wallet/browser matrix
   after the local tests provide the release evidence and scope is selected.

## Acceptance and build discipline

Retain a three-way mapping: user requirement -> executable test -> observed
artifact and source revision. The workflow lab is an integration test control;
the nine C0 M0 tests require the actual C0 profile. Do not use one green test
count for both. Lifecycle invariants need successful randomized operations and
call metrics, since a campaign whose every call reverts can otherwise appear
green. [Foundry invariant testing](https://getfoundry.sh/forge/invariant-testing)
and [replay](https://getfoundry.sh/forge/replay-testing) provide the harness,
while the EFS invariants define its meaning.

Core freeze needs bounded full-path costs, cross-implementation vectors,
reconstruction, security review and the owner decision. MVP implementation can
proceed from a reviewed local profile before those permanent choices are made.
