# Client v2 — decision framework (the forks)

**Corpus:** 2026-07-07-clientv2-corpus. **Author:** fable-5. **Status:** working notes — priors before research lands; the design docs in `Designs/clientv2/` are the ruling layer.

The load-bearing architectural forks, my prior on each from local context alone, and the evidence lane each waits on. A fork is only closed in a design doc, never here.

## F1. Ring-3 cage substrate

SES same-realm compartments (the 2026-05-26 Gemini sketch) vs sandboxed cross-origin iframes vs workers vs hybrid.

**Prior:** hybrid. App *UI* in sandboxed iframes (real origin isolation; the browser's only true protection domain), app *logic* optionally in Workers; SES/LavaMoat primarily for the OS's own supply chain and for headless plugin modules — not as the sole wall around hostile DOM-touching code. A "scoped DOM proxy" through a same-realm membrane is historically leaky (the DOM graph is full of back-references: `ownerDocument`, `event.target`, `getRootNode()`); treating SES as the *only* boundary around UI apps looks like the sketch's weakest load-bearing assumption. MetaMask Snaps (SES in workers/iframes, **no DOM at all** for snaps) is the closest production evidence.
**Waits on:** `web-isolation` (what iframe+CSP can actually deny), `webos-precedents` (Snaps autopsy).

## F2. Kernel placement and the real protection domain

Same-origin dedicated Worker (Gemini sketch) vs cross-origin Kernel frame vs SW-centric kernel.

The browser's protection domain is the **origin**, not the thread. A same-origin compromised Shell reads IndexedDB directly; the Kernel-in-a-Worker only protects *non-extractable* keys — and WebCrypto has **no secp256k1**, so EFS author keys are software keys in worker memory anyway (see F6). So "Kernel in a Worker" is an architecture for *modularity and crash isolation*, not a cryptographic enclave, and the design must say so honestly.

**Prior:** Bootstrapper + Kernel + Shell share one origin (static, IPFS-distributable, `file://`-tolerant); apps get opaque or synthetic origins (F1/F5). Kernel worker owns state + policy; keys encrypted at rest (wrap via WebCrypto AES, unlock via passkey PRF or passphrase); accept and document that Shell-origin compromise is fatal to local-state confidentiality, and spend the defense budget on the Shell's dependency diet + LavaMoat + CSP instead of pretending the worker boundary is one.
**Waits on:** `web-isolation`, `boot-deeplinks` (subdomain-gateway realities), `storage-durability`.

## F3. Shell plurality — and whether "Shell" is one thing

Fixed Shell vs modeful Shell vs replaceable Shell packages.

**Prior:** split the concept. What the handoff calls "Shell" is two trust classes fused: (a) **session presentation** — window/launcher/layout/navigation — replaceable in principle, mode-variant (desktop/mobile/kiosk/console/agent); (b) **system chrome** — secure prompts, permission center, pickers, wallet approval, install/update review, recovery — which must NOT be replaceable by the thing it supervises. If (b) is extracted into a Kernel-adjacent System Chrome component with its own compartment/surface, Shell plurality stops being dangerous and becomes cheap. V2 ships: one first-party Shell with modes + a Rescue Shell + the extracted System Chrome; the Shell contract is written so third-party Shells are *possible later* without ecosystem forks.
**Waits on:** `secure-ui` (is in-page unforgeable chrome even achievable), `fuchsia-components` (session framework contract shape).

## F4. Package trust: TUF-shaped metadata vs lens-native channels

**Prior:** EFS-native. EFS itself is the package registry (packages = DATA + manifest records; versions = immutable placements; channels = **lenses**; yank = revoke + advisory deny-claims — the cookbook already blessed this for generic package registries). What TUF adds that lenses lack is *threshold trust and key-rotation containment* — approximate with multi-curator quorum rules evaluated client-side (require K-of-N curator lenses to PIN the same package hash before auto-update), and by expiry-bounded channel pointers. Don't import TUF's role machinery wholesale; steal its threat model.
**Waits on:** `package-trust` (whether quorum-of-lenses holds against its incident catalogue).

## F5. How "no ambient network" is actually enforced

The mandate: no app network by default; every endpoint a capability. The mechanism is the open question, and there's a real tension: a sandboxed iframe **without** `allow-same-origin` has an opaque origin → *not* controlled by our service worker → its subresource fetches bypass our broker entirely; CSP must then arrive via the framed document's own headers/meta, which we only control if we serve the document — and the `csp=` iframe attribute is Chrome-only/experimental.

**Prior:** apps are served from SW-controlled synthetic scopes (per-app path or subdomain), *with* same-origin-to-themselves but partitioned storage, SW as packet filter (default-deny, Kernel-issued allowlist per app instance), belt-and-suspenders CSP injected into every app document by the SW, plus Permissions-Policy stripping (camera, mic, geolocation, …). Enumerate the residual exfil channels honestly (WebRTC, top-level navigation, `window.open`, timing) and state which are closed by policy headers vs which require the iframe's capability surface to never receive secrets.
**Waits on:** `web-isolation` (the decisive lane), `network-privacy` (endpoint classes + relay design).

## F6. Keys, personas, and app attenuation without protocol session keys

Protocol facts that bind us: author = recovered signer; **no session keys, no ERC-1271, ever**; secp256k1-only at v2 admission (P-256/WebAuthn reserved). So *any* signature by the user's main key is total authority over their namespace — attenuation cannot come from the signature layer.

**Prior:** attenuation via **personas**: per-app (or per-workspace) burner authors held by the Kernel, signing app-scoped writes without prompts under Kernel-enforced policy; the user's primary author signs only at explicit checkpoints through System Chrome. Lenses stitch personas into coherent views (author-first default lens under the user's container already exists). Tension to resolve against the account-system doctrine ("user = one address"): personas fragment authorship — need a doctrine for which writes deserve the primary author vs a persona, and a linking convention (persona TAGged under primary, revocable).
**Also:** WebCrypto's missing secp256k1 means burner keys are software keys — the OS's key-security story upgrades massively if/when P-256 (0x02) un-reserves → **efsv2 pressure item**: the client wants P-256/WebAuthn admission sooner than "KEL era".
**Waits on:** `wallet-standards` (passkey PRF wrapping, embedded-wallet practice), `secure-ui`.

## F7. Write lifecycle default: draft-first vs sign-early

**Prior:** draft-first. A signed bundle is a permanent authored artifact anyone holding it can submit — that's a commitment, not a save. Ordinary "save" = local encrypted journal (drafts, no signature); signing is an explicit, legible checkpoint (System Chrome), yielding a portable signed bundle that can flush now/later/elsewhere. Offer "sign now, submit later" and offline signed-bundle export as first-class *user actions*, never as the silent default. seq/TID minted at sign time; past-dated submission is protocol-legal (600s future bound only).
**Waits on:** `local-first` (journal/outbox honesty patterns).

## F8. OS SDK transport: membrane object vs message-channel capabilities

**Prior:** **MessagePorts as capability tokens.** Kernel mints a port pair per granted capability; apps hold ports, not references — unforgeable, transferable (delegation!), revocable (close), and web-native (this is Fuchsia's channel model in browser primitives). The `efs.*` object apps see is a thin typed veneer over ports; schema-validated RPC (types + runtime validators generated from one IDL). Same-realm membranes only where an iframe boundary already exists behind them.
**Waits on:** `web-isolation`, `fuchsia-components`.

## F9. Agents

Mostly settled by the compass: agents = bounded principals (sessions) in the Kernel's capability machinery, sharing the SAME outbox/approval/receipt pipeline as humans; inference = endpoint capability with budgets; app action catalogs feed an OS tool registry; MCP/A2A are derived bridges, never root authority.
**Waits on:** `agent-native` (injection defenses to bake into the action pipeline).

## F10. Locale/a11y

Settled direction: OS service (LocaleHandle), signed content-addressed language/font packs, canonical-under-localized rendering for receipts, fingerprint budget for what apps may learn.
**Waits on:** `i18n-a11y` (ICU4X/MF2/EditContext reality).

## F11. Client self-trust (who verifies the verifier)

The OS is itself bytes fetched from somewhere. Options ladder: plain web origin (trust the gateway/host every load) → PWA + SW self-pinning (TOFU then pinned, updates gated through the package model) → Isolated Web App (signed bundle, Chrome-only) → native wrapper. **Prior:** ship the TOFU + self-pinning-SW + reproducible-build + multi-mirror story as default with the residual trust stated loudly; treat IWA as an offered hardened lane, not the default.
**Waits on:** `boot-deeplinks`, `package-trust`, `webos-precedents` (IWA shipping reality).

## F12. Deep links

web3:// grammar is owned by read-lens-spec §6.5 (path form, citation form, `~claim:`, fragment-carried capabilities). The OS adds: app links, OS-profile/closure links (F4), permission/sync-state links — as *query/fragment extensions*, never new derivation surface. Unfurl-bot leakage shapes what may ride the query vs fragment.
**Waits on:** `boot-deeplinks`.

## F13. Venue presentation

Truth is venue-relative (read grades, currency qualifiers). The OS must decide how visible venues/chains are in normal UX (home-venue-per-container with courier background checks vs explicit chain picker). **Prior:** venues invisible until they *change an answer* — grades and "as of" labels surface only when not HOME-LIVE; a Venue/Sync center owns the detail.
**Waits on:** nothing external — this is an EFS-native invention; grounded in read-lens-spec.
