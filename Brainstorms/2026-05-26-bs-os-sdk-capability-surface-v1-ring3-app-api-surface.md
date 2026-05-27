---
agent: bs-os-sdk-capability-surface-v1
date: 2026-05-26
status: raw
anchors:
  - area: sdk
  - area: client
  - brainstorm: 2026-05-26-pm-client-os-architecture
---

# EFS OS SDK — Ring 3 capability surface (brainstorm)

Raw enumeration of capabilities to expose on the `efs.*` proxy endowed into Ring 3 App SES Compartments. Goal is to surface the *shape* of the OS SDK so a future Client design thread can prune, group, and harden it. Each entry sketches a TS signature, the permission token an App's `manifest.json` would declare, what the capability does, and the worst-case abuse if granted. Permissions assume a coarse `efs.<ns>.<verb>[:scope]` naming convention — scoping syntax (subtree path, schema UID, attester whitelist) is left for the design thread. Curators should expect 30–50% of these to collapse into broader verbs once we see usage patterns.

## Namespace: efs.fs

Path-shaped filesystem reads/writes layered over the on-chain Anchor/DATA/TAG model. The Ring 3 mental model is a virtual filesystem; the Kernel handles the EAS resolution under the hood.

- `efs.fs.read(path: string, opts?: { editions?: string[] }) => Promise<Uint8Array>`
  - **Permission:** `efs.fs.read` (default-allow with subtree scope; e.g. `efs.fs.read:/apps/myapp/*`)
  - Reads the DATA bytes at a path, going through the Kernel's edition-resolved router. Apps need this to load their own assets, user docs, etc.
  - **Risk:** broad `efs.fs.read:/*` lets an app exfiltrate any path the user opens, including other apps' private subtrees and bookmarked content.

- `efs.fs.stat(path: string, opts?) => Promise<{ size, contentType, dataUID, attester, mirrors[] }>`
  - **Permission:** `efs.fs.read` (same scope as read)
  - Lightweight metadata for a path: contentType (PROPERTY), size (DATA), winning edition attester. No bytes fetched.
  - **Risk:** mostly information disclosure; pairs with `read` to enumerate.

- `efs.fs.list(path: string, opts?: { schema?, limit, cursor, sortInfoUID? }) => Promise<DirEntry[]>`
  - **Permission:** `efs.fs.read`
  - Directory listing — Anchor children of a folder Anchor, optionally filtered by schema (file vs. property vs. sort_info) and through a SORT_INFO overlay.
  - **Risk:** allows broad enumeration of the user's view; basis for fingerprinting installed apps.

- `efs.fs.resolve(path: string, opts?) => Promise<{ anchorUID, dataUID?, attester? }>`
  - **Permission:** `efs.fs.read`
  - Path → UID resolution without fetching content. Useful for apps that want to operate on attestation primitives directly.
  - **Risk:** low alone; combined with `attestations.*` enables targeted queries.

- `efs.fs.write(path: string, bytes: Uint8Array, opts?: { contentType?, mirrors?: TransportPreference[] }) => Promise<WriteReceipt>`
  - **Permission:** `efs.fs.write:<subtree>` (default-deny; subtree scope mandatory)
  - High-level "save a file at a path" — wraps DATA + MIRROR(s) + PROPERTY(contentType) + ANCHOR + TAG in a single user-consented bundle. The Kernel batches into `multiAttest` and prompts the user once.
  - **Risk:** unbounded gas spend on user's burner wallet; can spam an anchor with junk DATA under user's attester identity, polluting their edition view from the outside.

- `efs.fs.placeAt(path: string, dataUID: string) => Promise<TagReceipt>`
  - **Permission:** `efs.fs.write:<subtree>`
  - Place an existing DATA at a path — issues a single TAG. Cheaper than write; useful for cross-referencing.
  - **Risk:** can junk-fill arbitrary path nodes if subtree scope is loose.

- `efs.fs.unplace(path: string, dataUID: string) => Promise<TagReceipt>`
  - **Permission:** `efs.fs.write:<subtree>`
  - Supersedes the user's active TAG with `applies=false`, removing the file from the user's edition at that path.
  - **Risk:** can delete the user's own placements within scope (intended), but a misbehaving app can quietly clean up evidence of its own writes.

- `efs.fs.mkdir(path: string) => Promise<AnchorReceipt>`
  - **Permission:** `efs.fs.write:<subtree>`
  - Creates the chain of Anchors needed to materialize the path. Permanent, non-revocable.
  - **Risk:** anchor creation is irreversible — a malicious app can permanently pollute the user's namespace with names.

- `efs.fs.watch(path: string, opts?: { recursive?, schema? }) => AsyncIterable<FsChangeEvent>`
  - **Permission:** `efs.fs.read` + `efs.events.subscribe`
  - Streaming change feed at a path — new TAGs, new DATAs, new child Anchors. Backpressure-aware.
  - **Risk:** background telemetry channel; even within scope, lets the app know exactly when the user touches a path.

## Namespace: efs.attestations

Low-level escape hatch for apps that want to speak EAS directly rather than via the path-shaped facade. Power users: indexers, explorers, custom lens UIs.

- `efs.attestations.get(uid: string) => Promise<Attestation>`
  - **Permission:** `efs.attestations.read` (broad)
  - Fetches any attestation by UID via the Kernel's cache + EAS read path.
  - **Risk:** any UID readable — but EAS attestations are public anyway, so disclosure is moot. Real risk is the app *correlating* what the user is interested in.

- `efs.attestations.query(filter: { schemaUID?, attester?, refUID?, recipient?, limit, cursor }) => Promise<Attestation[]>`
  - **Permission:** `efs.attestations.read`
  - Indexed query over the Kernel's local mirror of EFSIndexer state. Cursored.
  - **Risk:** large queries can DoS the Kernel cache; needs rate limiting per app.

- `efs.attestations.write(schema: SchemaName, payload: object, opts?: { recipient?, refUID?, revocable? }) => Promise<{ uid }>`
  - **Permission:** `efs.attestations.write:<schema>` (default-deny; per-schema scope, e.g. `efs.attestations.write:PIN`, `efs.attestations.write:TAG`)
  - Direct attestation creation. Per-schema permissions because TAG, MIRROR, ANCHOR have very different blast radii.
  - **Risk:** ANCHOR writes permanently pollute namespace; TAG writes spoof user opinions; MIRROR writes claim retrieval URIs in user's name. Always-prompt by default.

- `efs.attestations.multiWrite(bundle: AttestationRequest[]) => Promise<{ uids: string[] }>`
  - **Permission:** union of constituent `efs.attestations.write:*`
  - Atomic batch — matches EFS's "upload flow = 8 tx" pattern. Single user prompt for the whole bundle.
  - **Risk:** large bundles hide individual actions in noise; UI prompt must summarize all writes legibly.

- `efs.attestations.revoke(uid: string) => Promise<void>`
  - **Permission:** `efs.attestations.revoke` (default-deny; only the original attester can revoke anyway, so EAS enforces auth, but the *intent* still needs consent)
  - Revokes one of the user's own attestations (revocable schemas only: MIRROR, TAG, PROPERTY, SORT_INFO).
  - **Risk:** silently revoke user's pinned files / mirrors / sort overlays — a cleanup-attack vector.

- `efs.attestations.subscribe(filter, handler) => Unsubscribe`
  - **Permission:** `efs.events.subscribe` + `efs.attestations.read`
  - Push subscription on the Kernel's attestation stream matching the filter.
  - **Risk:** background telemetry; firehose risk if filter is too broad.

- `efs.attestations.simulate(req: AttestationRequest) => Promise<SimResult>`
  - **Permission:** `efs.attestations.read`
  - Dry-run an attestation through resolvers without submitting — gas estimate, validation outcome. No tx.
  - **Risk:** very low; useful and cheap.

## Namespace: efs.wallet

Identity and signing. Every operation here implies a user-consented Confused-Deputy-resistant prompt rendered by the Shell on behalf of the Kernel.

- `efs.wallet.getAddress(opts?: { which?: 'native' | 'connected' }) => Promise<string>`
  - **Permission:** `efs.wallet.address` (default-allow per-app; one address by default)
  - Returns either the EFS-native burner address derived in the Kernel or the connected MetaMask address.
  - **Risk:** fingerprinting / on-chain correlation across apps. Should default to a per-app deterministic burner alias unless the app explicitly requests the real identity.

- `efs.wallet.sign(payload: SignRequest) => Promise<Signature>`
  - **Permission:** `efs.wallet.sign` (default-deny; always per-call user prompt regardless of grant)
  - Signs an EIP-712 / personal_sign / typed-data payload. Goes Kernel → Shell prompt → Bootstrapper → MetaMask (for connected wallet) or Kernel-internal (for burner).
  - **Risk:** signature reuse, off-chain auth bypass on third-party services, blind-signed typed-data approving a token transfer. The most dangerous capability on the surface.

- `efs.wallet.sendTransaction(tx: TxRequest) => Promise<TxHash>`
  - **Permission:** `efs.wallet.send` (default-deny; always per-call user prompt)
  - Submits an arbitrary tx. Distinguished from `attestations.write` because it lets apps interact with non-EFS contracts.
  - **Risk:** drain wallet, approve token spending, interact with malicious contracts. Should be heavily guarded; possibly off the surface entirely v1 and only `attestations.write` is exposed.

- `efs.wallet.attest(schema, payload, opts?) => Promise<TxHash>`
  - **Permission:** `efs.attestations.write:<schema>`
  - Convenience: shortcut for `attestations.write` that bundles burner-gas + EAS interaction. Effectively the same surface but framed as wallet usage.
  - **Risk:** same as `attestations.write`.

- `efs.wallet.getBalance(opts?) => Promise<bigint>`
  - **Permission:** `efs.wallet.address`
  - Returns the address's ETH (and optionally ERC-20) balance via Kernel-proxied RPC.
  - **Risk:** fingerprinting wealth; phishing tailoring.

- `efs.wallet.switchIdentity(addressOrAlias: string) => Promise<void>`
  - **Permission:** `efs.wallet.identity` (default-deny; system-level — probably Shell-only, not Ring 3)
  - Likely **not** exposed to Apps. Listed for completeness so design thread can rule it out explicitly.
  - **Risk:** confusion between identities; an app switching identities mid-flow could trick the user into attesting from the wrong account.

## Namespace: efs.network

Outbound HTTP/IPFS/Arweave fetches, mediated by the Service Worker (per Ring architecture §4C). CSP is locked down so this is the only path out.

- `efs.network.fetch(url: string, opts?: FetchOpts) => Promise<Response>`
  - **Permission:** `efs.network.fetch:<origin>` (default-deny; per-origin allowlist matching manifest's `connect-src`)
  - HTTP fetch via Kernel-validated Service Worker proxy.
  - **Risk:** data exfiltration to attacker-controlled servers if origin scope is loose; covert channel.

- `efs.network.fetchMirror(dataUID: string, opts?: { preferTransport? }) => Promise<{ bytes, transport, uri }>`
  - **Permission:** `efs.fs.read` (implicit — this is just the read path)
  - Resolves a DATA's best mirror and fetches the bytes. Goes through router-style transport priority.
  - **Risk:** low if implicit in `fs.read`; tracks user's content fetches.

- `efs.network.ipfsGet(cidOrPath: string, opts?) => Promise<Uint8Array>`
  - **Permission:** `efs.network.ipfs`
  - IPFS-specific fetch (subset of `fetchMirror`, useful when an app wants to pin/verify a CID directly).
  - **Risk:** same as fetch; IPFS gateways can correlate requesting IP.

- `efs.network.broadcastTx(rawTx: string) => Promise<TxHash>`
  - **Permission:** `efs.network.broadcast` (default-deny)
  - Submit a pre-signed tx to the configured RPC. Distinct from `wallet.sendTransaction` because it skips signing.
  - **Risk:** lets app spam an already-signed tx; less dangerous than sign, more than fetch.

- `efs.network.subscribeChain(filter: EventFilter) => AsyncIterable<Log>`
  - **Permission:** `efs.network.chain.subscribe`
  - Subscribe to chain logs (eth_subscribe / poll) via Kernel.
  - **Risk:** background telemetry; battery/bandwidth drain.

- `efs.network.estimateGas(tx) => Promise<bigint>`
  - **Permission:** `efs.network.fetch` (uses RPC quota)
  - Standard gas estimate.
  - **Risk:** minimal.

## Namespace: efs.storage

Per-app local persistence. Each app gets a namespaced IndexedDB-backed key-value space; no access to the Kernel's encrypted state.

- `efs.storage.get<T>(key: string) => Promise<T | undefined>`
  - **Permission:** `efs.storage` (default-allow; auto-scoped to app's UID)
  - Read from app's private kv.
  - **Risk:** none — scoped.

- `efs.storage.set<T>(key: string, value: T) => Promise<void>`
  - **Permission:** `efs.storage`
  - Write to app's private kv. Subject to size quota.
  - **Risk:** disk fill if no quota; needs per-app cap.

- `efs.storage.delete(key: string) => Promise<void>`
  - **Permission:** `efs.storage`
  - Delete a key.
  - **Risk:** none.

- `efs.storage.list(prefix?: string) => Promise<string[]>`
  - **Permission:** `efs.storage`
  - Enumerate keys.
  - **Risk:** none.

- `efs.storage.quota() => Promise<{ used: number; limit: number }>`
  - **Permission:** `efs.storage`
  - Reports current usage.
  - **Risk:** none.

- `efs.storage.openShared(namespace: string) => Promise<KVHandle>`
  - **Permission:** `efs.storage.shared:<namespace>` (default-deny; requires manifest declaration AND user consent)
  - Optional shared kv namespace (e.g. two cooperating apps share a clipboard).
  - **Risk:** cross-app data exfiltration if poorly scoped.

## Namespace: efs.ui

System-level UI affordances exposed to apps. Ring 3 apps render their own DOM into their scoped iframe / shadow root; the `ui` namespace is for things that must visibly belong to the OS, not the app.

- `efs.ui.confirm(spec: { title, body, severity? }) => Promise<boolean>`
  - **Permission:** `efs.ui.modal` (default-allow with rate limit)
  - Renders a Shell-owned modal confirmation. Critical: this MUST be visually distinguishable from app-rendered modals so a malicious app can't spoof system prompts.
  - **Risk:** prompt-fatigue / training the user to click "yes"; if visual distinction fails, full Confused-Deputy exploit.

- `efs.ui.notify(spec: { title, body, level?: 'info'|'warn'|'error' }) => Promise<void>`
  - **Permission:** `efs.ui.notify` (default-allow with rate limit)
  - Toast / OS notification.
  - **Risk:** spam, fake error messages that mislead user action.

- `efs.ui.pickFile(opts?: { startPath?, multiple?, schema? }) => Promise<string[]>`
  - **Permission:** `efs.ui.picker` (default-allow)
  - Opens Shell-rendered file picker over EFS. User explicit selection grants the app ambient `efs.fs.read` on just those paths (capability-by-selection).
  - **Risk:** if selection isn't visibly bound to the picker, app could trick user into selecting wrong files.

- `efs.ui.pickSavePath(opts?: { suggestedName?, startPath? }) => Promise<string>`
  - **Permission:** `efs.ui.picker`
  - Save-target picker — same capability-by-selection pattern.
  - **Risk:** can suggest deceptive default paths.

- `efs.ui.openWindow(spec: { url, title, size? }) => WindowHandle`
  - **Permission:** `efs.ui.windows` (default-deny; risk of UI clutter)
  - Open a new app window owned by the Shell's window manager.
  - **Risk:** window-spam, clickjacking via overlapping windows.

- `efs.ui.requestFocus() => Promise<void>`
  - **Permission:** `efs.ui.notify`
  - Request the user's attention (e.g. flash the app icon).
  - **Risk:** annoyance only.

- `efs.ui.theme() => Promise<ThemeTokens>` / `efs.ui.onThemeChange(handler)`
  - **Permission:** none (default-allow)
  - Returns design tokens so apps integrate visually.
  - **Risk:** none.

- `efs.ui.copyToClipboard(text: string) => Promise<void>` / `efs.ui.readClipboard() => Promise<string>`
  - **Permission:** `efs.ui.clipboard:write` / `efs.ui.clipboard:read` (read is default-deny)
  - Clipboard access via Shell (apps never touch `navigator.clipboard` directly).
  - **Risk:** read is high — covert exfiltration of unrelated copied content (passwords, seeds).

## Namespace: efs.events

Generic subscription primitives. Many of the `*.subscribe`-style methods above are sugar over this namespace.

- `efs.events.on(topic: EventTopic, handler) => Unsubscribe`
  - **Permission:** `efs.events.subscribe` (per-topic scope, e.g. `efs.events.subscribe:wallet.changed`)
  - Subscribe to a named system event topic. Topics include: `wallet.changed`, `wallet.locked`, `network.online`, `lens.changed`, `theme.changed`, `attestation.new`, `fs.changed:<path>`.
  - **Risk:** background telemetry — every event delivered is a chance for the app to act / phone home.

- `efs.events.emit(topic: AppEventTopic, payload) => void`
  - **Permission:** `efs.events.emit`
  - Apps emit events into their own namespaced topic; other apps can subscribe with explicit consent.
  - **Risk:** cross-app coordination channel — must be namespaced and audited.

- `efs.events.poll(topic, since: Cursor) => Promise<Event[]>`
  - **Permission:** `efs.events.subscribe`
  - Pull alternative to `on` for apps that can't hold a long-lived subscription (e.g. background-killed mobile contexts).
  - **Risk:** same as subscribe.

- `efs.events.onWalletChange(handler)`
  - **Permission:** `efs.events.subscribe:wallet`
  - Specifically: address changed, chain changed, lock state changed.
  - **Risk:** an app can detect wallet swap and immediately re-prompt for signing under a new identity.

- `efs.events.onLensChange(handler)`
  - **Permission:** `efs.events.subscribe:lens`
  - Fires when the user changes their `?lenses=` set (i.e. their attester trust list).
  - **Risk:** low — the lens set is user-controlled and visible.

## Namespace: efs.lens

Lens (formerly "edition") composition: which attesters' attestations shape the current view. Apps that *visualize* curation (explorers, social feeds) need to read and propose lens changes; apps that fight for attention should not be able to silently mutate them.

- `efs.lens.current() => Promise<{ lenses: string[]; caller?: string }>`
  - **Permission:** `efs.lens.read` (default-allow)
  - Returns the active lens list and fallback caller.
  - **Risk:** minor fingerprinting — reveals which curators the user trusts.

- `efs.lens.resolveAt(path: string, opts?: { lenses?: string[] }) => Promise<ResolutionResult>`
  - **Permission:** `efs.lens.read` + `efs.fs.read`
  - Re-run router resolution with a custom lens list (preview "what would I see if I added Alice's lens?"). No state change.
  - **Risk:** none significant.

- `efs.lens.propose(lenses: string[]) => Promise<boolean>`
  - **Permission:** `efs.lens.propose` (default-deny; always user-confirmed via `efs.ui.confirm`)
  - Asks the user to switch / extend their active lens list. App proposes; user decides.
  - **Risk:** social engineering — convincing user to trust an attacker-curated lens that injects malicious DATAs at common paths.

- `efs.lens.compose(...lensSets: LensSet[]) => LensSet`
  - **Permission:** `efs.lens.read`
  - Pure utility — combine lens sets with precedence rules. No state effect; useful for preview UI.
  - **Risk:** none.

- `efs.lens.diff(a: LensSet, b: LensSet, path: string) => Promise<DiffResult>`
  - **Permission:** `efs.lens.read` + `efs.fs.read`
  - "What changes at this path if I switch from lens A to lens B?" Useful for explorer/curator apps.
  - **Risk:** none beyond `fs.read` scope.

- `efs.lens.subscribe(handler) => Unsubscribe`
  - **Permission:** `efs.events.subscribe:lens`
  - Same as `efs.events.onLensChange`. Listed here for namespace ergonomics.

## Namespace: efs.crypto (emergent)

Pure crypto utilities that the Kernel can safely expose without giving up keys. Apps shouldn't bring their own crypto for things the Kernel already does well.

- `efs.crypto.hash(bytes: Uint8Array, alg?: 'keccak256'|'sha256') => Promise<string>`
  - **Permission:** none (default-allow)
  - Convenience for computing `contentHash` before writing.
  - **Risk:** none.

- `efs.crypto.verify(signature, payload, address) => Promise<boolean>`
  - **Permission:** none
  - Signature verification utility.
  - **Risk:** none.

- `efs.crypto.encryptFor(recipient: Address, plaintext) => Promise<Ciphertext>` / `efs.crypto.decryptFromMe(ct) => Promise<Plaintext>`
  - **Permission:** `efs.crypto.encrypt` / `efs.crypto.decrypt` (decrypt is per-call user consent)
  - Asymmetric envelope using the Kernel's keys. Decrypt requires user consent because the app is asking the Kernel to use the user's private key.
  - **Risk:** decrypt is high — app could trick user into decrypting arbitrary ciphertexts (e.g. someone else's private data they shouldn't see).

## Namespace: efs.meta (emergent)

Reflection on the app's own granted capabilities. Helps well-behaved apps degrade gracefully and prompts for missing permissions in-context.

- `efs.meta.granted() => Promise<Permission[]>`
  - **Permission:** none
  - Returns the app's currently granted permission set.
  - **Risk:** none.

- `efs.meta.request(permissions: Permission[]) => Promise<GrantResult>`
  - **Permission:** none (the *request* needs no permission; the user grants from the system prompt)
  - Trigger a Shell-rendered permission prompt for additional capabilities at runtime, not just install-time.
  - **Risk:** prompt fatigue — apps could spam requests until user clicks yes.

- `efs.meta.manifest() => Promise<AppManifest>`
  - **Permission:** none
  - The app's own manifest as parsed by the Kernel.
  - **Risk:** none.

- `efs.meta.version() => { os: string; sdk: string }`
  - **Permission:** none
  - Versions of the Kernel and SDK injecting this proxy.
  - **Risk:** none; needed for graceful capability detection.

## Cross-cutting questions

Things that emerged while enumerating and should be resolved in the Client design thread:

1. **`efs.wallet.sign` granularity.** Should the manifest-level `efs.wallet.sign` grant ever skip the per-signature user prompt (for high-throughput signing apps), or is *every signature always prompted* a hard rule? My instinct: always prompt, no exceptions for v1.

2. **`efs.wallet.sendTransaction` — on the surface at all?** Generic tx submission is the single biggest blast-radius capability. Could we ship v1 with only `efs.attestations.write:*` and force non-EFS contract interaction to a later, more constrained surface?

3. **Subtree-scoped permissions: syntax and enforcement.** Capabilities like `efs.fs.write:/apps/foo/*` are pervasive. Does the path-glob get matched at Kernel boundary, or do we precompile to Anchor UIDs at install time? The latter is safer but doesn't handle subtrees that grow.

4. **Capability-by-selection vs declarative.** Picker-granted access (user selects a file → app gets read on it) is much more user-friendly than manifest-declared subtrees. Should picker be the *primary* access pattern and declarative scope the escape hatch?

5. **Background-task budget.** Subscriptions (`fs.watch`, `events.on`, `network.subscribeChain`) all consume Kernel resources and battery. Per-app budget? Forced unsubscribe when app loses focus?

6. **Cross-app communication via `efs.events.emit`.** Is this a feature (cooperative app ecosystems) or an attack surface (covert channels)? Default-deny seems right, but then how do, e.g., a wallet app and a marketplace app coordinate?

7. **Burner-identity-per-app by default.** If `efs.wallet.getAddress` defaults to a per-app deterministic burner alias, what's the upgrade path when an app legitimately needs the user's real identity (e.g. ENS-linked profile)?

8. **System-prompt visual distinction.** The Confused-Deputy risk is concentrated in `efs.ui.confirm` and per-call sign prompts. Do we need a hardware-style "secure UI" indicator (e.g. an OS-rendered watermark in the chrome that an app cannot replicate)?

9. **Revocation UX for `efs.attestations.revoke`.** When the user revokes a permission, should the Kernel auto-revoke attestations the app made under that grant? Probably no (mass revocation is footgun-tier), but worth deciding loudly.

10. **Lens proposals (`efs.lens.propose`) as a vector.** Lens trust is more dangerous than file read — adding a bad lens can poison every path the user browses. Should propose be its own consent tier above other writes?

11. **What about Workers?** Apps may want to spin their own Web Workers for compute. Does the SDK expose a sandboxed `efs.worker.spawn(...)`, or do apps just use native `Worker` within their Compartment? If the latter, can those Workers reach the `efs.*` proxy?

12. **Quota and rate limits as first-class.** Most "Risk" entries above reduce to "do it a lot, do harm." A general quota/rate-limit policy at the proxy boundary may eliminate a class of design problems we'd otherwise solve per-capability.

13. **Storage migrations.** `efs.storage` is per-app and unversioned in this sketch. If an app is updated and its schema changes, who handles the migration — the app, the OS, or no one?

14. **Naming: `efs.fs` vs `efs.files` vs `efs.path`.** The Glossary distinguishes "Anchor" (technical) from "Topic" (user-facing). For the SDK exposed to *developers*, `efs.fs` reads correctly. But should there be a parallel ergonomic `efs.topics` namespace for social/forum-style apps?

15. **SDK vs. raw EAS.** Anything in `efs.attestations.*` is a thin wrapper over EAS. Do we instead inject a *capability-restricted* EAS client (so developers can use familiar `eas.attest()` idioms) and reserve `efs.*` for path-shaped sugar?
