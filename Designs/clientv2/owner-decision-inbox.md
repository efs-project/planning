# Client v2 — owner decision inbox

**Status:** draft decision packet; no choice is adopted until James answers and it is recorded in the owning history
**Audience:** James first; client/OS designers second
**Last reconciled:** 2026-07-22
**Inputs:** [[web-os-thesis]], [[open-questions]], [[wallet-and-actions]], [agent-native](./agent-native.md), and the [EFS v2 owner queue](../efsv2/owner-decision-inbox.md)

#status/draft #kind/decision #repo/planning #repo/client #repo/sdk #topic/clientv2 #blocked-on/human-decision

> **This is the sole live owner queue for Client v2-specific product architecture.** Cross-cutting EFS/OS decisions stay canonical in the [EFS v2 inbox](../efsv2/owner-decision-inbox.md). This page gives the client example and link but never creates a second answer state.

## How to answer

The Client-specific recommended reply is `OS1A, OS2A`.

If you answer [EFS N2A](../efsv2/owner-decision-inbox.md#n2--constitutional-system-boundaries), the Client v2 thesis is adopted as the working architecture automatically unless you name Client-specific exceptions. You do not need to answer it twice.

## Inherited architecture choice — answer in EFS v2

### EFS N2 — Ratify Client v2 as an OS, conditionally

**Example:** a user opens an archived application. The Kernel verifies it; System Chrome owns permissions, trusted rendering, and signing; the replaceable Session Shell arranges it; the app receives explicit handles instead of browser powers.

- **N2A — Adopt the thesis as the working architecture, conditional on cage/render experiments. Recommended.** This includes the Kernel/System Chrome/Session Shell split, least authority, draft-first writes, generations/rollback, truthful grades, no telemetry, and no ambient app HTTP. It does not freeze the exact browser lane or render vocabulary.
- **N2B — Adopt with named exceptions.**
- **N2C — Build only a browser/file client and defer the OS architecture.** Smaller scope, but likely hardens assumptions that later obstruct capabilities, apps, and agents.

Canonical answer: [EFS v2 N2](../efsv2/owner-decision-inbox.md#n2--constitutional-system-boundaries). Details: [[web-os-thesis#The thesis]], [[web-os-thesis#The architecture ruling]], and [[system-surfaces#The surface map]].

## Decide now — Client-specific choices

### OS1 — Mainstream authorship onboarding

**Example:** a new phone user wants to save, publish, or comment without first installing MetaMask. Where does their durable primary signing key live?

- **OS1A — Browse immediately; unlock authorship with either an external wallet or a passkey-protected local key, with tested independent recovery before consequential use. Recommended.** Mainstream onboarding without pretending a browser-held key is hardware-secure.
- **OS1B — Require an external wallet for all primary authorship.** Clean custody boundary, large onboarding cliff.
- **OS1C — Allow an ordinary device-local primary after a warning.** Fastest signup, but browser eviction can destroy the identity and same-origin compromise can steal it. Not recommended.

OS1A uses passkey-derived vault protection around a current signing key; it does not assume native P-256 authority. Exact account provisioning waits for KEL evidence in [root ER1](../owner-decision-inbox.md#er1--accountonboarding-default). Details: [[wallet-and-actions#The key custody ladder]], [[wallet-and-actions#Open questions]], and [[persistence-and-sync#D6. Keys and re-openability (Tier D)]]. Use the KEL correction banner in `wallet-and-actions`; its old persona-authority model is not live.

### OS2 — Agent foundations or agent retrofit

**Example:** an archive agent classifies 5,000 packages. If agent identity, budgets, frozen plans, approvals, and receipts are absent from the Kernel, a later agent feature may need a privileged side door.

- **OS2A — Put safe agent primitives in the foundation; defer the full Agent Center UI. Recommended.** Ship the agent-session principal, capability restrictions, budgets, approval queue, outbox integration, and receipts.
- **OS2B — Defer agents entirely until after the archive/client core.** Smaller initial Kernel, but safety becomes a retrofit.
- **OS2C — Ship the complete agent product at launch.** Strong differentiation with substantial launch scope.

Details: [agent principal](./agent-native.md#principals-and-the-agent-session-principal), [action pipeline](./agent-native.md#the-action-pipeline--the-security-boundary-camel-shaped), [lethal-trifecta boundary](./agent-native.md#the-lethal-trifecta-invariant--break-glass), and [[system-surfaces#The surface map]].

## Decide after evidence — do not answer yet

### EFS E7 — Supported host/browser lanes

**Example:** Safari leaves an egress path open that Chromium blocks.

- **A:** use a served-header or stronger native host on that platform;
- **B:** support verified browsing there but no executable Ring-3 apps;
- **C:** run with a weaker warning-only boundary—**not recommended**.

**Recommendation:** browser-first, but publish honest per-lane guarantees; never weaken silently. Evidence: completed cross-browser cage matrix. Canonical decision: [EFS E7](../efsv2/owner-decision-inbox.md#decide-after-evidence--do-not-answer-yet). Details: [cage-matrix spike](./spikes/spike-1-cage-matrix.md) and [[kernel-capability-model#The three-layer cage (F1, mechanism)]].

### EFS E8 — Application rendering model

**Example:** the Files/archive prototype cannot express accessible drag-and-drop through the declarative surface schema.

- **A:** keep System-owned declarative surfaces with narrow measured canvas/document lanes;
- **B:** enlarge the typed component catalog while retaining the trusted compositor;
- **C:** permit app-owned DOM/iframe UI, which requires an explicit security recut;
- **D:** defer third-party executable apps instead of weakening confinement.

**Recommendation:** A if the prototype passes; D is the safe fallback. Evidence: Files/archive surface prototype with accessibility, performance, and authoring-ergonomics results. Canonical decision: [EFS E8](../efsv2/owner-decision-inbox.md#decide-after-evidence--do-not-answer-yet). Details: [surface-mode spike](./spikes/spike-2-surface-mode.md) and [[kernel-capability-model#Render surface modes]].

Other spike outcomes should follow their written pass/fail thresholds unless they force an owner-level product-support tradeoff: cold boot, journal recovery, verified reads, OHTTP assembly, and ceremony usability. See [[open-questions#Recommended next investigations (cheap, ordered — the client analog of the efsv2 B-gates)]].

## Decide before beta or launch

The first five rows elaborate canonical EFS launch choices. Answer the **EFS code**, not a second Client code.

| Canonical code | Client example and options | Recommendation | Details |
|---|---|---|---|
| **EFS L3 — dangerous package boot** | A researcher needs a revoked emulator: forbid boot; isolated guest/forensics boot; or normal-profile warning | isolated guest only, with no standing grants, identity, signing, or ambient network | [[boot-and-profiles#4.4 Boot-time revocation posture — open — protocol gap]], [[packages-and-updates#6. Rollback — research-grounded]] |
| **EFS L1 — update trust** | one steward; independent thresholds; or manual-only | separate disclosed forkable threshold sets for OS and apps; broadening updates always require review | [[packages-and-updates#7. The client's own distribution — research-grounded]], [[packages-and-updates#8. Curator-compromise recovery — the runbook ships BEFORE channels — research-grounded]] |
| **EFS L2 — endpoint/privacy defaults** | manual/self-hosted; operator-diverse defaults; or one first-party endpoint | closure-pinned named operator set, explicit first-run acknowledgment, easy replacement, and distinct relay/destination operators | [endpoint onboarding](./network-privacy.md#endpoint-onboarding-ux), [OHTTP posture](./network-privacy.md#ohttp-posture-research-grounded) |
| **EFS L4 — monitoring promise** | funded global observatory; local subscriber checks; or none | local checks with explicit limits until an independent observatory is funded | [[packages-and-updates#8. Curator-compromise recovery — the runbook ships BEFORE channels — research-grounded]], [[research-digest#Open questions]] |
| **EFS L7 — product name** | EFS OS; Cyphos; another screened name | use Cyphos as a working name only; decide after trademark/package/repo/domain/app-store screening | [[web-os-thesis#Naming — open]] |

### CL1 — Sovereign endpoint tooling schedule

**Example:** “bring your own endpoint” exists in settings, but a normal user cannot realistically run one.

- **CL1A — Documented bring-your-own endpoint at launch; polished `efs-home` container fast-follow. Recommended.**
- **CL1B — Make the one-container sovereign path launch-blocking.** Stronger position, more scope.
- **CL1C — Hosted endpoints only at launch.** Not recommended for EFS's cypherpunk positioning.

Details: [endpoint onboarding](./network-privacy.md#endpoint-onboarding-ux) and [open questions](./network-privacy.md#open-questions).

### CL2 — Locale and translation commitment

**Example:** an English-only prototype later discovers its identifier UI breaks bidirectional text and its input model breaks IMEs.

- **CL2A — Ship the global-correctness foundation at launch; fund a small translation set separately. Recommended.** Bidi-safe identifiers, input/IME correctness, canonical formatting, and accessibility are architectural; language count is resourcing.
- **CL2B — Commit to a broad multilingual first-party launch.** Higher reach and ongoing translation burden.
- **CL2C — Build English-only and retrofit.** Not recommended because some correctness failures are architectural.

Details: [[locale-and-accessibility#4. Language packs and font packs]], [[locale-and-accessibility#7. Accessibility foundation]], and [[locale-and-accessibility#Open questions]].

## Already settled — do not ask again

- System Chrome owns trusted DOM/compositing; Session Shell owns placement and workspace policy.
- System Chrome owns sync authority/loss ceremonies; Session Shell owns the dashboard.
- Break-glass is one of the eight ceremony classes.
- Kernel broker policy is primary network enforcement; per-endpoint CSP mechanics are only hardening.
- Verification success uses negative space—no green “safe” badge.
- Locale-returned strings consume a disclosure budget.
- F12 deep-link retry landed; Static Routing governs.
- Separate unlinkable personas are KEL principals grouped locally. Persona-per-app/workspace is now a reversible UX/funding default, not identity topology.

## Delegated to product and implementation teams

Do not ask James to choose constants or mechanics that prototypes and normal design review can settle: ceremony serialization/risk thresholds, expiry constants, cache watermarks, quota margins, UI placement, IDL syntax, package layout, high-bandwidth port mechanics, locale entropy constants, app migration ownership, and second-instance takeover behavior.

**Research directive, not a final lane/ABI decision:** open web standards and WebAssembly/WASI are the strong foundational prior. Fable should validate a likely multi-lane model—confined compiled apps driving OS-owned UI, full-web sandboxed iframes speaking typed messages/opcodes, and only evidence-earned specialist lanes—against Blazor/.NET, HTMX-inspired UI, JS/SES, Components/WIT, and alternatives using [[fable-third-party-app-model-handoff]]. Every lane shares one Kernel-resolved permission system; app-declared security tags/imports/options request but never grant authority. No James answer is needed until evidence produces a real product or permanence tradeoff.

## Protocol-owned — route to EFS v2

Batched admission/grade reads; closure grades; `.efs-bundle` encoding; multi-device ordering; actor/delegation records; P-256; EFSBytes hash words; deny freshness; grade-to-executability; path-link portability; and private roaming record tiers belong to [[client-os-pressure-report]] and the [EFS v2 inbox](../efsv2/owner-decision-inbox.md), not this queue.

## Superseded questions — never revive silently

- Pre-KEL persona linking, “primary cannot revoke persona,” smart-account identity, and ERC-1271 authority tensions are historical.
- “A cradle iframe fixes Kernel egress” is a category error; the cage spike determines the supported lane.
- An unchecked box in [[open-questions]] remains an engineering index item unless promoted into this page.

## Recording rule

When James answers a Client-specific code, record the dated ruling in `Decisions.md` and mark it here. When he answers an inherited EFS code, update only the EFS v2 canonical queue/history and leave a pointer here. Never copy a second live answer.
