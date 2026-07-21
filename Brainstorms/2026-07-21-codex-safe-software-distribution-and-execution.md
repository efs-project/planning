---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: client
  - area: sdk
  - area: apps
  - area: security
  - area: efsv2
source: Parallel primary-source review of Nix, Guix, TUF, Uptane, Sigstore, Flatpak, WASI/Wasmtime, and Endo/SES
---

# Safe software distribution and execution — lessons for EFS OS

## Executive conclusion

No single package/runtime system supplies EFS OS’s whole requirement. The strongest design composes five distinct mechanisms:

- **Nix/Guix:** immutable dependency closures and atomic generations;
- **TUF/Uptane:** scoped update authority, rotation, rollback/freeze defense, and recovery;
- **Sigstore:** publisher identity and transparency evidence, not authorization;
- **Flatpak:** portal-shaped user grants, separate app data, and permission-aware updates;
- **WASI/SES:** no ambient authority, explicit host interfaces, and auditable endowments.

The critical distinction is:

> **Content identity says what the bytes are. Authorization says who may advance a name. Transparency says an event was recorded. Sandboxing says what the bytes may do. None substitutes for the others.**

## Closures and generations — Nix and Guix

Nix’s useful object is a **closure**: an installed root is complete only when every transitively referenced store object exists. Copying a path can copy its dependency closure. Profiles retain immutable generations and activation is effectively an atomic pointer change, enabling rollback without mutating old bytes.

Important qualification: traditional Nix store paths are generally input-addressed through the derivation/build graph, not direct identities of realized output bytes. Substituted outputs therefore rely on authorized cache signatures. Fully content-addressed store conversion exists but has had experimental status. EFS should commit directly to realized bytes and a canonical closure manifest; reproducible rebuilding is corroboration and supply-chain evidence, not the only identity check.

Guix adds authenticated channel history from a trusted introduction, retained profile generations, explicitly authorized substitute keys, and independent rebuild comparison. Its own documentation does not pretend every build is automatically bit-identical.

**Do not copy:** treating a build sandbox as runtime confinement. Nix build sandboxes exist primarily for purity and may be relaxed; fixed-output derivations may use the network.

Sources: [Nix closures](https://nix.dev/manual/nix/2.35/command-ref/nix-copy-closure.html), [Nix profiles](https://nix.dev/manual/nix/2.35/package-management/profiles.html), [content-address conversion](https://nix.dev/manual/nix/2.35/command-ref/new-cli/nix3-store-make-content-addressed.html), [store verification](https://nix.dev/manual/nix/2.35/command-ref/new-cli/nix3-store-verify.html), [sandbox configuration](https://nix.dev/manual/nix/2.35/command-ref/conf-file.html), [Guix manual](https://guix.gnu.org/manual/en/guix.pdf).

## Secure evolution — TUF and Uptane

TUF separates authority roles:

- **root** defines keys and thresholds;
- **targets** authorizes artifact hashes and lengths;
- **snapshot** binds a coherent metadata set;
- **timestamp** detects stale/frozen views;
- **delegations** attenuate authority to named paths/scopes.

Root rotation requires continuity: a successor root is accepted through both the previous root’s threshold and its own threshold, and clients walk adjacent versions. Version rollback is rejected, expired metadata cannot claim freshness, signed/local size bounds limit resource attacks, and failed updates must leave recovery possible.

Uptane adds two independent planes: an Image repository describes available software while a Director repository describes what a particular device should install. EFS need not copy a central Director. It should preserve the distinction between a publisher’s artifact assertion and a user/curator’s compatibility/channel decision. A provider satisfies neither role.

TUF expiry assumes a trustworthy clock and network opportunity. EFS must distinguish:

- “this exact historical closure remains authentic”; and
- “this mutable channel is currently fresh.”

An offline user may deliberately run a pinned historical closure while the client refuses to call its channel current.

Sources: [TUF specification](https://theupdateframework.github.io/specification/latest/), [Uptane standard](https://uptane.org/docs/2.1.0/standard/uptane-standard).

## Provenance is not authorization — Sigstore

Sigstore binds an ephemeral signing key to an OIDC identity, issues a short-lived certificate, records an event in transparency infrastructure, and can package the signature, certificate, timestamp, inclusion proof, and checkpoint for offline verification.

That is valuable provenance evidence. It still requires a verifier to know the expected identity and issuer. Compromise may create unauthorized but detectable certificates; detection requires monitoring. Logging proves the event was recorded, not that the artifact was safe, compatible, latest, or authorized to replace an installed EFS app.

EFS may accept Sigstore-style bundles as evidence attached to a release. EFS channel advancement must remain governed by scoped EFS policy.

Sources: [Sigstore security model](https://docs.sigstore.dev/about/security/), [verification bundles](https://docs.sigstore.dev/about/bundle/), [trust-root distribution](https://docs.sigstore.dev/cosign/system_config/custom_components/), [identity verification requirement](https://docs.sigstore.dev/about/the-importance-of-verification/).

## Portal authority and app-data separation — Flatpak

Flatpak’s best lessons are capability UX and lifecycle separation:

- user actions such as selecting a file become narrow portal grants;
- the document portal exposes only selected objects through a restricted view;
- grants can be transient/persistent and some can be revoked;
- application data has a stable app-identity namespace separate from executable code;
- self-update is safe only when requested permissions do not expand;
- OSTree commits retain older code generations;
- offline transfer and verification are supported.

Broad static grants can collapse the sandbox: host/home filesystem, full network, session bus, devices, host-command services, or dangerous IPC. Repository-wide signing also lets the repository operator become authority for everything in that repository. Application identity takeover/rebinding risks inheriting permissions and stored data.

EFS should make ordinary grants portal/powerbox-shaped. Broad path or network grants are exceptional administrative powers, not the primary API.

Sources: [sandbox permissions](https://docs.flatpak.org/en/latest/sandbox-permissions.html), [portal/permission APIs](https://docs.flatpak.org/en/latest/libflatpak-api-reference.html), [OSTree model](https://docs.flatpak.org/en/latest/under-the-hood.html), [offline distribution](https://docs.flatpak.org/en/latest/usb-drives.html).

## Explicit execution ABI — WASI Component Model

A component world declares imports and exports. Without imported filesystem, network, clock, randomness, secret, or device interfaces, a component has no route to those powers. Typed interfaces avoid ambient shared-memory coupling.

Wasmtime’s WASI context defaults to no filesystem preopens and can deny network addresses. Filesystem power is rooted in handles rather than global host paths.

Residuals remain load-bearing:

- every host implementation is trusted code;
- memory/CPU/output/storage/instance/host-call exhaustion needs explicit budgets;
- fuel or epochs do not interrupt every blocking host call;
- unsafe deserialization of untrusted precompiled/native cache bytes can cross the boundary;
- terminal/control output can itself become an escape surface.

Sources: [Component Model worlds](https://component-model.bytecodealliance.org/design/worlds.html), [components](https://component-model.bytecodealliance.org/design/components.html), [WASI context](https://docs.wasmtime.dev/api/wasmtime_wasi/struct.WasiCtxBuilder.html), [Wasmtime security](https://docs.wasmtime.dev/security.html), [resource/interruption configuration](https://docs.wasmtime.dev/api/wasmtime/struct.Config.html).

## JavaScript object capabilities — Endo/SES

SES Compartments begin without ambient host APIs such as `fetch`. `lockdown()` freezes/tames shared intrinsics; `harden()` makes endowed object surfaces immutable; only supplied globals, modules, and object references convey authority.

SES’s caveats matter for EFS:

- Compartments in one JavaScript agent share scheduling/resource fate;
- guest code may loop or allocate indefinitely unless placed behind stronger boundaries;
- incorrectly hardened or overpowered endowments defeat confinement;
- code executed before lockdown and attached debuggers belong to the trusted computing base;
- SES does not define save-data durability, updates, or package authorization.

SES is useful for JS confinement and capability membranes, but hostile apps need a Worker/process/Wasm/resource boundary too.

Sources: [Endo](https://github.com/endojs/endo), [SES package](https://github.com/endojs/endo/tree/master/packages/ses).

## Candidate durable EFS requirements

1. A release root commits to every executable, resource, runtime/component, import map, policy manifest, byte length, media type, and target profile needed to launch.
2. Runtime dependencies never resolve through an unpinned URL or mutable name.
3. Exact closure identity and mutable channel resolution are different objects.
4. Gateways, caches, indexes, catalogs, CDNs, and peers may supply bytes but cannot advance a channel.
5. Delegation states key set, threshold, app/namespace, channel, artifact/platform scope, expiry/freshness rules, and termination semantics.
6. Root succession has adjacent version continuity, old+new authorization, downgrade rules, and retained intermediate roots.
7. Automatic channel following never moves backward; deliberate historical closure launch remains possible and visibly historical.
8. Effective runtime authority is the intersection of the closure’s declared maximum, system policy, and explicit user grant.
9. Updates cannot silently expand authority.
10. Executable generations and save/config/cache data have separate identities and lifecycles.
11. Save migration is versioned, transactional, recoverable, and never silently makes downgrade destructive.
12. The complete closure verifies before one atomic activation pointer changes; any failure leaves the prior generation bootable.
13. Verification has length, graph, delegation-depth, recursion, decompression, and total-resource bounds.
14. Exports carry closure identity, authorization chain/root history, signatures, optional provenance/transparency evidence, and enough material for offline verification.
15. Apps declare typed imports; ambient filesystem, environment, process, socket, wallet, DOM, and privileged IPC powers are absent.

## Keep client/tooling policy

Do not freeze exact trusted curators, thresholds, signer membership, update cadence, expiry grace, offline warnings, retention periods, default grants, prompt copy, resource quotas, malware/reputation policy, providers/transports, or runtime implementation. Freeze the vocabulary, non-amplification rules, and verification semantics; let clients select values.

## Adversarial acceptance tests

1. Remove one transitive dependency; offline install/launch fails before execution.
2. Corrupt one byte; verification fails and active generation remains unchanged.
3. Exceed signed length/decompression/closure bounds; transfer terminates without exhausting storage.
4. Two providers equivocate for one ID; invalid bytes are rejected and neither provider gains update authority.
5. Mix valid components from two generations; coherent-closure verification fails.
6. Replay an older valid channel head; auto-follow rejects it while explicit historical launch remains possible and labeled.
7. Withhold updates past the freshness policy; the client reports stale/unknown rather than “current.”
8. Rotate roots; skipped versions, duplicate-key threshold inflation, and one-sided old/new authorization fail.
9. A delegated signer publishes outside its app/channel/platform scope; reject.
10. A provenance-valid but policy-unauthorized signer cannot advance the channel.
11. An update requests new network/file/device authority; staging may complete but activation waits for consent.
12. A zero-grant app cannot access files, environment, network, clock, randomness, devices, other apps, processes, wallet, identity, or trusted pixels.
13. Path/symlink/hard-link/mount/case/Unicode/TOCTOU attempts cannot escape a granted handle.
14. Selecting one file exposes only that file; transient grants expire and revocation stops future access where revocation is promised.
15. Fuzz every host interface for malformed handles, reentrancy, oversized values, cancellation, and capability forwarding.
16. Infinite loops, allocation bombs, output floods, decompression bombs, and blocking calls terminate within declared limits.
17. Upgrade, rollback, uninstall/reinstall, code GC, and provider loss do not silently delete saves.
18. Power-loss injection at every update/migration phase leaves either the complete prior or complete next generation, never a hybrid.
19. Vendor disappearance: export, reinstall, verify, run, and restore saves without the original provider.
20. A poisoned update/release key can be rotated and the client can resume from a last-known-good trust root without the compromised channel.

The design mnemonic is:

> **Immutable bytes, plural roots, scoped authority, explicit capabilities, separate saves, atomic recovery.**
