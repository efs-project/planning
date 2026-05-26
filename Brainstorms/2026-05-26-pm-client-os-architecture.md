---
agent: pm
date: 2026-05-26
status: reference
anchors:
  - area: client
  - area: sdk
source: Gemini chat (https://gemini.google.com/share/bb9682dab203) — James-collaborated design session on EFS Official Client architecture
---

# EFS Official Client — OS architecture (captured from Gemini chat)

PM-captured reference. Pasted by @james 2026-05-26 during chat with PM after Gemini share link was auth-walled. Preserves the full architecture spec so it isn't lost and is available when a Client design thread is spun up post-OnionDAO.

**Status of this content:** Conceptual spec, agreed between @james and Gemini. The current `client/` repo (Lit + libefs + libeas + shell + apps) is a much earlier/simpler version. This document describes the **target** OS architecture, not what's deployed.

**Why this is `reference` not a draft Design:** The PM does not write Designs. When James (or a designated design agent) is ready to draft `Designs/client-os-architecture.md`, this is the primary input. Until then it lives here as durable context.

---

## 1. Architectural overview & core principles

The EFS client is designed as a sovereign, zero-trust, offline-capable web operating system. Deployed as a single static bundle to IPFS.

- **Offline-first & decentralized.** Static SPA at a single IPFS CID. Loads via IPFS gateway, standard web server, or local `file://`.
- **Object-Capability (OCap) security.** Strict least-privilege; apps access only what's explicitly granted.
- **Zero-trust memory.** Cryptographic keys never touch the main execution thread or persistent disk in plaintext.
- **Hostile environment assumption.** Architecture assumes browser extensions and third-party UI dependencies may be compromised.

## 2. Technology stack

- **UI components:** Web Awesome Free (MIT, framework-agnostic, bundled locally — no CDN).
- **Component framework:** Lit.
- **Security sandbox:** SES (`@endo/ses` by Agoric) — mathematical freezing of JS intrinsics, strict Compartment isolation.
- **Bundler:** Vite (relative base paths for IPFS CID compatibility).

## 3. Execution topology — The Ring Architecture

Four execution boundaries.

### Ring 0 — Bootstrapper (Hypervisor)

- **Location:** base `index.html` on the Main Thread.
- **Privileges:** total raw access to browser globals (`window`, `document`, `navigator.serviceWorker`, `window.ethereum`).
- **Role:** initialize environment, wire communication channels. Registers Service Worker, spawns Kernel Web Worker, creates `MessageChannel` linking them. Initializes SES Compartment for Shell, passes virtualized DOM endowment, then relinquishes control. **Renders no UI.**

### Ring 1 — Kernel (Secure Enclave)

- **Location:** dedicated Web Worker.
- **Privileges:** Web Crypto API, IndexedDB, MessageChannel ports. **Zero DOM access.**
- **Role:** cryptographic heart of the OS. Derives keys, encrypts/decrypts master config, manages native EFS burner wallets, maintains App Permission Ledger. Acts as strict verifiable reverse proxy for all network requests and cryptographic signing.

### Ring 2 — Shell (System UI)

- **Location:** Main Thread, locked inside an SES Compartment.
- **Privileges:** stripped of global `window` and `document`. Endowed only with a scoped DOM proxy (e.g., `document.getElementById('os-desktop')`) and safe Lit/Web Awesome rendering capabilities.
- **Role:** renders OS desktop, window manager, system prompts. Translates user input into RPC calls to the Kernel. **Cannot directly do network, native storage, or MetaMask.**

### Ring 3 — Sandboxed Apps (User Space)

- **Location:** Main Thread, in strictly constrained SES Compartments within the Shell's view.
- **Privileges:** only the exact APIs explicitly approved by the user at installation.
- **Role:** third-party community apps loaded dynamically. Interact with OS exclusively through an injected proxy `efs.*` object reference.

## 4. Core subsystems

### A. Inter-Process Communication (IPC)

RPC wrapper (Comlink or Penpal) for clean Promise-based DX.

- **Thread-to-thread** (Kernel ↔ Shell/Bootstrapper): async `postMessage` with serialized JSON over `MessageChannel`.
- **Compartment-to-compartment** (Shell ↔ Apps): direct Object References (Endowments). App calls `await efs.fs.read()` → proxy stub in Shell → serialized `postMessage` down to Kernel Web Worker.

### B. Storage & key management

- **In-memory security:** keys derived via Web Crypto API into Kernel's RAM, flagged `extractable: false`. Raw private key cannot be extracted by JS — mathematically protected even if Kernel logic is tricked.
- **Persistent state:** Kernel uses AES-GCM to encrypt state and App Permission Ledger. Encrypted ciphertexts in IndexedDB.
- **Threat mitigation:** malicious app escaping SES + compromising Shell (XSS) can only read encrypted blobs — cannot access plaintext keys isolated in Web Worker.

### C. Network proxy & CSP bypass

Bootstrapper enforces strict `<meta>` CSP blocking external HTTP from Main Thread (protects from extension exfiltration).

1. App requests data via endowed `fetch` proxy.
2. Kernel verifies app's manifest permissions.
3. If approved, Kernel passes request via `MessageChannel` to Service Worker.
4. Service Worker executes external HTTP (bypasses HTML CSP), returns data to Kernel via private channel.

### D. MetaMask & third-party wallet flow

Workers can't access `window.ethereum`. Signature flow:

1. App requests signature.
2. Kernel verifies app's permission ledger.
3. Kernel commands Shell to render user-consent prompt (prevents malicious apps from spamming Bootstrapper).
4. On user approval, Kernel sends specific IPC command up to Ring 0 Bootstrapper.
5. Bootstrapper triggers `window.ethereum.request(...)`, routes signed payload back to Kernel.

## 5. Application lifecycle

- **App Manifest:** apps provide `manifest.json` declaring identity, requested OS capabilities (e.g., `efs.fs.*`, `efs.wallet.sign`), specific network endpoints (`connect-src`).
- **Installation:** Shell parses manifest, prompts user for explicit consent.
- **Endowment:** on launch, Kernel reads approved ledger, passes `efs` proxy into App's SES Compartment containing only permitted functions. Unauthorized calls dropped at sandbox boundary.

## 6. Known trade-offs & future horizons

- **Confused Deputy (UI Spoofing):** Kernel has no DOM, relies on Shell to render permission prompts. Compromised Shell could spoof a prompt to trick user into approving malicious tx while seated at the machine. Mitigations: aggressive session timeouts, future smart-wallet account abstraction.
- **Browser extensions:** highly privileged extensions with `<all_urls>` can bypass SES and DOM isolation. EFS opsec assumes users interact via clean extension-free browser profiles.
- **Future upgrades:**
  - **Passkeys (WebAuthn):** replace master passwords for decrypting Kernel state. Eliminates password fatigue + phishing vectors.
  - **WebAssembly (Wasm) sandboxing:** tools like Extism for multi-language App execution with stricter linear memory isolation than SES.

---

## Why this matters to the planning vault

- **The "EFS OS SDK" is the `efs.*` proxy endowed into Ring 3 Apps.** That's the third SDK type James named — distinct from on-chain and off-chain SDKs because it's a *capability surface for untrusted apps*, not just a developer-convenience wrapper.
- **The current `client/` repo is far behind this target.** Bridging is a substantial design effort (post-OnionDAO).
- **Tech stack commits (Lit, Web Awesome Free, SES, Vite) are real decisions.** When the Client design thread spins up, these are starting constraints.
- **Security model is mature and load-bearing** — anyone proposing changes to the Client should be familiar with the Ring architecture and OCap commitment, not redesign from scratch.

## Next steps (when bandwidth allows)

- Spawn a Client design thread post-OnionDAO. This brainstorm is the input.
- Stress-test the Ring model against concrete app scenarios via `bs-edge-cases` brainstorms.
- Map the `efs.*` capability surface to specific on-chain and off-chain SDK calls — clarifies the layering between the three SDK types.
