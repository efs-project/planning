# Upgradeable testnet: pattern choice and EFS-specific hazards

**Status:** research and source-audit input; recommended architecture, no implementation result
**Date:** 2026-09-08
**Source basis:** planning `50ffe46e01927f71cac92aea4faf415fe74bb602` plus the pre-existing local fixed-read-library/deployment draft; last independently checked published checkpoint `719dd6403e282e9a005947e54f000a6d58371aff`
**Consumer:** [[Designs/efsv2/testnet-files-mvp-plan]]

#kind/research #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2

## Recommendation

For the frequently changing testnet, start with OpenZeppelin **Transparent
proxies + ProxyAdmin**, not a bespoke diamond. Use ERC-7201 storage namespaces
and keep the currently proposed fixed libraries as release-pinned dependencies.
This is an EFS-specific engineering recommendation, not an owner choice or a
claim that Transparent is universally superior.

The reason is operational: keeping the upgrade entry point outside the
rapidly changing application implementation reduces the chance that a bad
application revision accidentally removes our repair path. It does not undo
storage corruption or protect against a malicious administrator. UUPS remains
a sound alternative and is OpenZeppelin's increasingly preferred lighter
pattern. The first bounded upgrade test can change our choice if Transparent
adds more coordination complexity than it saves.

| Pattern | Actual benefit | EFS cost and disposition |
|---|---|---|
| Transparent + ProxyAdmin | Separate proxy/admin upgrade entry point. | Extra deployment/admin surface; recommended for this testnet's repairability. |
| UUPS + ERC-1967 proxy | Upgrade logic belongs to the implementation; lightweight proxy. | Authorization and continued upgrade support must survive every implementation release. Valid alternative, not a second simultaneous upgrade path. |
| ERC-2535 diamond | Many facets behind one address; replace selected function mappings. | Selector inventory, cuts, initialization and shared-storage discipline add work. Adopt only for a measured module/size need. |
| Beacon fleet | One implementation change updates many proxies. | No demonstrated fleet requirement; unnecessarily couples independently interpreted Realms. Defer. |

Transparent and UUPS must not be casually mixed: their shared implementation
slot can expose unintended upgrade routes. Follow one pinned supported
pattern. [OpenZeppelin proxy documentation](https://docs.openzeppelin.com/contracts/5.x/api/proxy).

A diamond's facets share the caller's storage through delegation; they are
not sandboxed plugins. ERC-2535 defines cut/loupe behavior, but does not choose
our authority policy or storage layout. Every facet still has deployment and
execution limits. A diamond acceptance gate would additionally cover selector
collisions, loupe/cut agreement, immutable selectors and malicious initializer
calls. [ERC-2535](https://eips.ethereum.org/EIPS/eip-2535).

The interrupted local fixed-library work suggests that splitting reads can
keep the individual modules within runtime limits. Its uncommitted build
artifacts are **not a reproducible published measurement report or a verified
complete deployment**. They weaken the argument that we need diamonds
immediately, but the full initialized facade, routed consent and proxy overhead
must still be measured under ordinary limits. No precise size result from
that unfinished increment is used as a release gate here.

## What changes, concretely

The existing [[Designs/efsv2/core-architecture-candidate|architecture candidate]]
already separates stable Realm identity from execution revisions. The
immutable C0 control was a deliberate simplification, not proof that v2 must
always be immutable during testing. An older Stage-A proposal restricts its
upgrade profile to UUPS; it is not an owner ruling. A Transparent testnet must
use a new explicitly named deployment/profile interpretation, not claim to be
that old profile.

The read-only upgrade audit found eight specific retrofit hazards:

| Existing assumption | Required testnet correction |
|---|---|
| `StatefulHarness` constructor initializes its own Store and immutables. | Initialize proxy storage atomically with deployment; disable direct implementation initialization. No unauthenticated harness entry points. |
| Proposed direct Core constructor pins per-instance genesis/configuration. | Put per-Realm configuration in namespaced proxy storage. Treat immutable library links or self-address markers as explicitly reviewed per-implementation values, not per-Realm state. |
| `StateKernel` accepts only revision ordinal 1. | Append execution-revision history; each admitted batch retains its actual revision and activation basis. |
| `WritePlan.executorCodeHash`/authority checks use `address(this).codehash`. | Commit and enforce executing revision/configuration: proxy shell hash does not change when its implementation changes. |
| `C0InitializationSelection` requires upgrade-authority kind/ref zero. | Introduce a distinct testnet selection; retain old bytes and fixtures as controls. |
| ByteStore's one-time seal pins direct Core runtime. | Preserve stable genesis endpoints but track and validate revision-specific Core/carrier implementations and dependency sets. |
| Flat `StateStore.Store` and linked functions share storage references. | Fixed namespaced roots, compiler/layout artifacts, append-compatible changes or explicit bounded migrations. |
| SDK evidence and lab cursors lack a complete upgrade basis. | Bind supported reads, manifests and opaque continuations to Realm/revision, dependency set, query, ordering, high-water and block basis. |

Source entry points: [[2026-09-05-c0-core/initialization-boundary]],
[[2026-09-05-c0-core/authority-module-boundary]],
[[2026-09-05-c0-core/browser-integration-handoff]], and
[[2026-09-05-c0-core/read-library-layout]]. Executable references are
`Reviews/2026-09-05-c0-core/{test/StatefulHarness.sol,src/StateKernel.sol,src/StateStore.sol,src/C0PlanCodec.sol,src/C0InitializationSelection.sol}`
and `Reviews/2026-09-04-mvp-c0-foundation/src/MvpC0StateByteStore.sol`.
The inspected uncommitted V3 deployment draft is local evidence only; do not
mistake its availability here for a published or validated deployment profile.

## Smallest upgrade lifecycle worth building

1. **Genesis:** deploy initialized Core/carrier proxies, locked implementations
   and fixed libraries. Retain source/compiler/settings/layout/ABI/runtime and
   dependency commitments. Configuration identifies the upgrade controller.
   Prefer a factory that deploys and initializes the complete pair and seals
   their relationship atomically. Predict coupled addresses without cyclic
   constructor commitments; initialization accounts for the factory being
   `msg.sender`. Do not leave permissionless initialization between transactions.
2. **Revision:** preserve stable Realm and file identities; append implementation
   address/codehash, dependency-set commitment, policy/authority basis,
   activation block and first admission ordinal. Retain historical decoding
   material. The revision unit is an ordered **execution set**: Core, carrier,
   any stateful FilesRouter, fixed libraries/helpers and their actual
   ProxyAdmins/controller references. Even unchanged members are committed.
   A changed implementation is not a new version of every Type.
3. **Preparation:** plans and execution checks bind the current revision,
   nonce and expiry. Reject pre-upgrade plans after activation. For the first
   testnet, bind session grants to the execution revision too; reapproval is
   explicit. This is intentionally conservative across upgrades, not an extra
   popup on every ordinary write. EIP-712 alone supplies no application replay
   policy. [EIP-712](https://eips.ethereum.org/EIPS/eip-712).
4. **Upgrade:** use a project-owner-controlled batch-capable account, such as
   Safe, to own the ProxyAdmins. Rehearse one atomic transaction that upgrades
   all coupled stateful endpoints, performs bounded migrations and activates
   the new configuration. Unchanged components still appear in that configuration.
   Safe's call-only multisend is an available atomic-call primitive, not an EFS
   activation protocol. Pin its actual release before use; verify inner
   execution and canonical post-state, not just the outer receipt.
   [Safe call-only multisend source](https://raw.githubusercontent.com/safe-global/safe-smart-account/main/contracts/libraries/MultiSendCallOnly.sol).
5. **Fail closed:** from U1, every ordinary mutation guards the coupled set's
   contract-observable implementation/configuration revisions and dependency
   commitments, not just its own implementation. It checks expected proxy
   runtime hashes and `ProxyAdmin.owner()` at the retained expected admin
   addresses. The SDK/independent reader separately reconstructs the actual
   immutable admin from pinned deployment/runtime evidence and compares the
   descriptor and admin slot; no nonexistent public actual-admin getter is
   assumed. If an admin upgrades one endpoint without activation, writes halt
   rather than use old consent. A script convention or Safe batch alone is
   insufficient. The guard needs a contract-callable peer/self configuration
   check: Solidity cannot directly read another proxy's ERC-1967 storage via
   an RPC call. The foundation spike must prove this check, including
   missing/mismatched peer responses.
   Reentrant admissions during migration must fail.
   An intentional malicious replacement could remove these guards: the testnet
   administrator remains trusted and visibly disclosed.
6. **Reader response:** current routes advertise the new revision; cached
   currentness is invalidated, exact historical bytes remain usable. Old pinned
   pages continue only under their original supported basis, otherwise the SDK
   reports an unsupported/unavailable continuation, never silently resumes on
   new state. Missing historical evidence remains `UNKNOWN` or `PARTIAL`.
7. **Recovery:** reverting compatible code is not reverting later data writes.
   Test the supported downgrade explicitly. A destructive layout/semantic
   change needs a forward repair or a new Realm plus verified export/import.
   Do not promise a universal undo or erase the original evidence.

Keep Core's generic authority/admission/index state separate from the Files
operation contract. A routed rename must bind both its checked operation and
the relevant execution configurations; upgrading either endpoint must not
leave an old signature usable against changed semantics. Stateless Lens/Files
helpers can be deployed per revision with explicit addresses; they do not all
need independent mutable proxy state.

## Modern patterns that earn their place

- **Namespaced storage:** ERC-7201 gives a recognizable storage-root scheme;
  it does not make arbitrary field reordering safe or isolate delegated code.
  [ERC-7201](https://eips.ethereum.org/EIPS/eip-7201).
- **Initialization and layout validation:** use checked initializers,
  reinitializers and reference-layout comparison. Constructor logic does not
  initialize the proxy's state. [OpenZeppelin upgradeable-contract guidance](https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable).
- **Recognizable proxy evidence:** use standard implementation-slot evidence
  at the EFS revision's block basis. [ERC-1967](https://eips.ethereum.org/EIPS/eip-1967).
  In OpenZeppelin v5 Transparent proxies the actual admin is immutable;
  the admin slot can diverge. Retain/reconstruct proxy runtime immutables,
  actual ProxyAdmin address and `ProxyAdmin.owner()` evidence, not just that
  slot. [OpenZeppelin Transparent proxy](https://docs.openzeppelin.com/contracts/5.x/api/proxy#TransparentUpgradeableProxy).
  In this proposed testnet profile, the authority descriptor records the
  immediate ProxyAdmin separately from its owner/controller (and any Safe
  governance evidence); `upgradeAuthorityRef` commits that descriptor, not an
  ambiguous address. This is a new profile interpretation, not changed B0 bytes.
- **Pinned build and CI:** use the official Foundry upgrade tooling and exact
  dependency/compiler versions. Major library updates are not presumed
  storage-compatible. [Foundry upgrades](https://docs.openzeppelin.com/upgrades-plugins/foundry/foundry-upgrades),
  [OpenZeppelin compatibility policy](https://docs.openzeppelin.com/contracts/5.x/backwards-compatibility).
- **Manual library review remains necessary:** upgrade tooling only partially
  supports external library linking. A narrowly justified linking exception
  is not proof of storage safety; never bypass all upgrade checks to get green
  output. [OpenZeppelin upgrade FAQ](https://docs.openzeppelin.com/upgrades-plugins/faq).
- **Measured safety:** bounded loops/return data, explicit errors, independent
  state models and invariants with nonzero successful mutation coverage.
  Foundry can report calls/reverts/discards; an all-reverting campaign is not
  meaningful lifecycle evidence. [Foundry invariant testing](https://getfoundry.sh/forge/invariant-testing).
- **Fork-specific optimizations:** transient-storage guards are an option only
  in a pinned execution profile that supports them. “Modern EVM” is not a
  compatibility specification. [EIP-1153](https://eips.ethereum.org/EIPS/eip-1153).

## First upgrade acceptance test

Populate U1 with Types, bytes, records, admissions, bindings, directory-scope
postings, two Lens authors, tags, removed placements, nonce lanes and a session
grant. Retain a pending signature, cursor and exact historical receipt.
Upgrade to U2 adding a real field/feature and repeat the Files walkthrough.

Require unauthorized/takeover/reinitialization attempts to fail; unchanged
state and IDs to compare exactly; the old signature/session to fail; newly
prepared writes to succeed; and historical receipts to remain attributable to
U1. Deliberately omit activation while the proxy codehash stays unchanged and
prove writes halt. Test Core-only, carrier-only and router-only upgrades,
coupled upgrades in both orders, direct ProxyAdmin `upgradeAndCall` without
activation, and divergence between the admin slot and actual immutable admin.
Corrupt a layout, remove required old index coverage, fail the second
endpoint/migration and test the supported recovery path. Newly
added indexes must remain partial until a complete backfill is proven.

Run at normal runtime/initcode/transaction limits. Independently read the
implementation slots, configuration history and retained objects. The browser
must explain an upgrade, denial or missing evidence in plain language.

**This pass performed research and source audits only. None of these new
upgrade tests has been run.** The foundation test belongs at the beginning of
the real build, not after all Files features have accumulated on an immutable
host. Only a specific unresolved architecture blocker justifies a further
throwaway spike before repository creation.

Integrated review closed the identified authority-source, actual-admin,
coupled-configuration, initialization and unpublished-measurement issues.
Documentation checks: recursive tri-sync, current decision roll-up, whitespace
and all fourteen wiki links in the two new documents passed. The retirement
scan had no active phrases; the new upgrade requirement is integrated by
explicit control-versus-testnet pointers, not by erasing immutable experiment
history. These checks concern this planning packet, not contract correctness.
