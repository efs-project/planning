# WebAssembly + WASI Component app platform

**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]], [[kernel-capability-model]], [[sdk-boundaries]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-07-22 — codex-gpt-5

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/clientv2 #topic/wasm #topic/wasi

## Problem

EFS OS needs an application substrate that can outlive today's JavaScript framework cycle, support many implementation languages, remain portable across browser and future native hosts, and make authority visible at the app boundary. The existing Client v2 set correctly isolates apps in Workers, but treats a WebAssembly Component runner as “later” and leaves the language-neutral ABI implicit.

James ruled on 2026-07-22 that EFS OS apps must be designed around WebAssembly, WASI, and the surrounding Component Model ecosystem as the likely long-term platform. This design makes that direction precise without turning “WASI” into ambient POSIX authority or making current browser tooling part of the permanent contract.

The timing is favorable. [WASI 0.3 was ratified on 2026-06-11](https://wasi.dev/releases/wasi-p3), adding native `async func`, `stream<T>`, and `future<T>` to the Component Model. WIT expresses language-neutral interfaces and resource handles. Browsers can execute core WebAssembly today but do not yet execute components directly; [jco currently transpiles components](https://component-model.bytecodealliance.org/language-support/javascript.html) into JavaScript wrappers plus core Wasm modules. Therefore EFS must freeze semantic interfaces and adapters, not one temporary loader.

## Proposal

### The ruling: WASM-first, not WASM-only

The EFS application platform is designed around **WebAssembly Components + WIT worlds** as the language-neutral execution and interface model.

- WebAssembly is a first-class app payload and runner target, not a deferred plugin experiment.
- WIT is the canonical semantic description of app imports, exports, resources, streams, and lifecycle calls.
- Rust, C/C++, C#, Go, JavaScript/TypeScript, Python, and later languages may target the same app world as their toolchains mature.
- JavaScript/TypeScript remains a supported authoring lane. It may run through the SES Worker runner, componentize through `jco`, or use generated adapters; EFS does not require every small app to ship a language runtime.
- The OS UI ABI remains [[kernel-capability-model#Render surface modes|EFS Surface IR]]. Blazor/Razor, an HTMX-like EFS hypermedia layer, and other frameworks are adapters that produce the same surface operations; none owns the DOM.
- Every app instance retains a dedicated Worker/protection domain. Stored runtime blobs may deduplicate by content hash; live untrusted app instances do not share authority or mutable runtime state.

“WASM-first” does **not** mean compiling the Kernel, Shell, or every app to Wasm immediately. It means no foundational app API may depend on JavaScript object identity, DOM objects, browser-global authority, or a framework-specific lifecycle that cannot be expressed across the Component boundary.

### WASI is an interface vocabulary, not the sandbox

WASI does not grant safety by itself. The host decides which imports exist, and a browser Worker still exposes dangerous JavaScript APIs unless the runner removes or mediates them. The structural Worker cage, CSP lane, package verification, capability table, quotas, and System Chrome remain the security boundary.

An app receives exactly the imports named by its selected WIT world and instantiated grants. Importing an interface declares a **capability ceiling**; receiving a live resource handle is the actual grant.

| Interface family | EFS posture | Reason |
|---|---|---|
| `efs:ui/*` | Provide typed surface, canvas, locale, and sanitized-event resources | System Chrome owns pixels, DOM, accessibility, and trusted status components |
| `efs:fs/*` | Provide picker-minted file/folder resources | Preserve designation-as-authorization; never expose a root path |
| `efs:records/*` | Provide graded query/watch resources | Preserve venue, grade, policy, and rate limits |
| `efs:storage/*` | Provide app-local quota and journal-backed resources | No access to other apps or ambient origin storage |
| `efs:outbox/*` | Provide typed intents and dry-run resources | No generic signing or transaction API |
| `efs:net/*` | Provide endpoint handles only after an explicit grant | No URL-shaped ambient network authority |
| `efs:time/*` | Provide policy-selected monotonic/coarsened clocks | Wall time is authority and a privacy surface |
| `efs:random/*` | Provide bounded cryptographic randomness | Host-quality entropy without exposing unrelated platform state |
| `wasi:filesystem` | Deny by default; optionally virtualize private scratch storage only | POSIX preopens would bypass EFS handles and grades |
| `wasi:http` / sockets | Deny direct imports | Network must traverse the Kernel broker and endpoint policy |
| `wasi:cli/environment`, args, stdio | Fixed non-secret values or deny | Avoid ambient configuration, secrets, and host fingerprinting |
| threads/shared memory | Explicit runner feature + quota | Requires host support and creates denial-of-service/covert-channel pressure |

Where ecosystem libraries require ordinary WASI, the runner may interpose a compatibility component that implements the requested interface over narrower EFS resources. Adapters may attenuate authority; they may never synthesize broader authority than the manifest and live grant table provide.

### The EFS app world

The first versioned package should be shaped like this illustrative WIT—not frozen byte-for-byte by this design:

```wit
package efs:os-app@0.1.0;

interface lifecycle {
  record app-context {
    instance-id: string,
    generation: string,
  }
  record sanitized-event {
    handler: u32,
    payload: list<u8>,
  }
  variant app-error {
    revoked,
    denied,
    exhausted,
    internal(string),
  }
  init: async func(context: app-context) -> result<_, app-error>;
  event: async func(event: sanitized-event) -> result<_, app-error>;
  suspend: async func() -> result<_, app-error>;
}

world app {
  import efs:ui/surfaces@0.1.0;
  import efs:storage/local@0.1.0;
  import efs:meta/runtime@0.1.0;

  // Picker-, policy-, and ceremony-minted resources are delivered at runtime.
  // Importing their interface does not grant an instance.
  import efs:fs/handles@0.1.0;
  import efs:records/queries@0.1.0;
  import efs:outbox/intents@0.1.0;

  export lifecycle;
}
```

Use WASI 0.3's native async/stream/future shapes where toolchains support them. The host also supports a pinned WASI 0.2 compatibility profile during migration. Package identity includes the exact WIT package versions and adapter hashes; “latest WASI” is never an implicit dependency.

Resource handles map naturally to the existing Kernel model:

```text
WIT resource handle
        │
        ▼
runner-owned binding
        │
        ▼
Kernel-minted MessagePort / caretaker proxy
        │
        ▼
scoped backing service
```

Dropping a WIT resource closes or releases its child grant. Revoking the Kernel grant invalidates the binding and returns a typed revoked error. Borrowing and ownership in WIT must never bypass the capability table's parent/child revocation graph.

### Browser execution today, native component execution later

The runner contract has two implementations behind the same app ABI:

1. **Browser lane now:** verify the component and its pinned adapters, transpile at build/package time with `jco` where required, load the resulting JS wrapper + core Wasm modules inside the app Worker, and provide only generated EFS imports. No runtime CDN or root-relative `_framework` fetch is permitted.
2. **Native-component lane later:** instantiate the same component directly when browsers expose Component Model support or when EFS runs in a native host. Replace the adapter, not the app contract.

Packages must contain or content-address every loader, adapter, runtime, core module, binding, and WIT dependency required to reproduce execution. A generated wrapper is part of the verified closure. App startup performs no ambient dependency discovery.

### Framework adapters

Frameworks sit above the component boundary:

- **Blazor/C#:** a .NET runtime runs inside the app Worker. A custom EFS renderer emits Surface IR; normal Blazor DOM ownership and unrestricted JS interop are unavailable. Identical .NET runtime assets may deduplicate in storage but each app keeps an isolated runtime instance.
- **HTMX-like authoring:** use a constrained EFS hypermedia vocabulary, local handler/capability identifiers, surface-local node targets, and closed UI fragments. Literal HTMX cannot run the UI from a Worker because Workers have no DOM; arbitrary HTML swapping, scripts, eval, CSS, URLs, and direct AJAX remain forbidden.
- **JavaScript/TypeScript:** the existing SES runner exposes generated bindings matching the same semantic app world. Framework-specific objects do not cross the Kernel boundary.
- **Rust and other component-native languages:** compile directly to the EFS app world when bindings support the pinned profile.

No adapter receives a private alternate API. The conformance suite runs the same capability, lifecycle, rendering, revocation, and denial fixtures against every runner.

### Packaging and compatibility

Extend `program` in the app manifest without changing the capability ceiling model:

```jsonc
{
  "program": {
    "runner": "wasm-component@1",
    "entry": "component.wasm",
    "world": "efs:os-app/app@0.1.0",
    "wasi": ["0.3.0", "0.2-compat"],
    "adapters": ["sha256:…"],
    "features": ["async", "streams"]
  }
}
```

- Component imports are displayed in install/update review beside manifest capability ceilings.
- An update that adds an imported interface or broadens a world is capability-broadening and cannot silently auto-activate.
- WIT packages, bindings, adapters, and conformance vectors are content-addressed closure members.
- The Kernel supports a bounded compatibility window. Dropping a world major or WASI profile is a generation-level, user-visible compatibility event.
- Surface IR and EFS semantic APIs version independently from WASI. A WASI release must not force an EFS app API major.

### Resource and denial-of-service policy

WebAssembly improves portability and import visibility; it does not prevent CPU or memory abuse. Each instance receives explicit limits for:

- initial/maximum linear memory and table growth;
- compilation and startup time;
- CPU slices and runaway-call interruption;
- number of component instances, nested components, futures, streams, and resource handles;
- bytes and messages crossing component boundaries;
- surface nodes, patches, signals, and event rate;
- thread/shared-memory use where enabled.

Exceeding a limit pauses or terminates the app with a System Chrome explanation and a local receipt. The host never silently drops state-changing messages.

### What is constitutional versus replaceable

**Constitutional app-platform requirements:** language-neutral typed boundaries; deny-by-default imports; resource-shaped capabilities; per-app protection domains; no app-owned DOM/network/wallet; reproducible closures; and one conformance model across runners.

**Replaceable implementation choices:** jco version, engine, bindings generator, component cache, adapter implementation, .NET runtime version, JS authoring framework, hypermedia syntax, and whether a particular release ships native Component Model support.

## Open questions

These are engineering/evidence gates, not James decisions:

- [ ] Prototype `efs:os-app@0.1.0` in WIT and map every resource to the existing capability-table parent/child lifecycle.
- [ ] Run the same Files/archive surface in SES/TypeScript, a jco-transpiled component, and Blazor-in-Worker; measure compressed closure size, cold/warm startup, memory, patch latency, and mobile Safari behavior.
- [ ] Select the launch compatibility floor: WASI 0.2 component profile with 0.3 opt-in, or 0.3 primary with pinned 0.2 adapter, based on browser toolchain support.
- [ ] Determine whether package-time transpilation is reproducible across platforms and pin all jco/adapter outputs with golden fixtures.
- [ ] Specify interruption/fuel/time-slice mechanics for the browser runner; a Worker `terminate()` fallback is required even if cooperative yielding exists.
- [ ] Define the private scratch-filesystem compatibility adapter and prove it cannot resolve EFS user data or other apps' state.
- [ ] Decide how WIT semantic types, canonical CBOR port messages, runtime validators, and agent tool schemas are generated from one source without semantic drift.
- [ ] Add adversarial fixtures for forbidden `wasi:http`, sockets, root filesystem, environment, DOM, dynamic import, and unpinned loader fetches.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [x] `**Target repos:**` confirmed: planning, client, sdk
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [x] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

- The first implementation artifact should be a small WIT package and conformance harness, not a general-purpose runtime.
- Keep WIT package versions explicit in manifests and generated bindings.
- Treat browsers' lack of native Component Model execution as an adapter concern; do not fork the semantic app API for browser versus native hosts.
- Do not expose a generic WASI command world and then attempt to revoke powers inside app code. Instantiate only the purpose-built EFS app world plus explicit compatibility adapters.
