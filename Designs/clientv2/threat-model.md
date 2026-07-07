# Threat model
**Status:** draft
**Target repos:** planning, client, sdk, contracts
**Depends on:** [[web-os-thesis]], [[shell-and-sessions]], [[network-privacy]], [[wallet-and-actions]], [[packages-and-updates]], [[boot-and-profiles]], [[persistence-and-sync]], [[agent-native]], [[read-lens-spec]], [[identity]], [[ops-doctrine]], [[codex-envelope]], [[mirror-scheme-policy]]
**Reviewers:** —
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

> THE consolidated threat model for client v2. It does not re-argue any single ruling; it names the assets, enumerates the adversaries, draws attack trees for the crown jewels, maps mitigations to the architecture with an honest residual-risk table, re-cuts the handoff's truth-traps into testable conformance items, and defines the incident-response surfaces. Where a mitigation lives in a sibling doc, this doc cites it and states the residual it does not close. Evidence: Reviews/2026-07-07-clientv2-corpus/research/web-isolation.md, /secure-ui.md, /package-trust.md. Where this doc and [[web-os-thesis]] disagree, the thesis wins until amended; disagreements are declared in Open questions, not smuggled.

## What this rules

The blast-radius accounting for the whole OS. Three findings frame everything below and are treated as settled, not re-litigated. **[research-grounded]**

1. **No single primitive cages untrusted JS; only a defense-in-depth stack does** (web-isolation §bottom-line). Every layer has documented holes, so the model reasons in *layers and residuals*, never "the sandbox is secure."
2. **You cannot win the pixel-spoofing war with visual design** (secure-ui §BLUF). Security-critical decisions move *off* the spoofable surface or the spoofable secret is removed; everything else is negative-indicator hygiene.
3. **Updates, not installs, are the supply-chain threat surface** (package-trust §4 trap 1). Every store incident weaponized the auto-update channel after trust was earned.

Two invariants inherited and load-bearing: the cage denies network *by construction* (Ring-3 app logic in a `blob:`-URL Worker, `connect-src 'none'`, sole channel = postMessage to the Kernel — [[network-privacy]]); and key compromise is **not** defended by expiry or revocation in v2 — only lens distrust + advisory subtraction, no rotation until the KEL ([[read-lens-spec]] §2.5, [[ops-doctrine]] D4).

## 1. Assets — what an attacker wants

| Asset | Lives in | Need (C/I/A) | Consequence of compromise |
|---|---|---|---|
| **Primary author key** (secp256k1 software key) | Kernel worker memory; at rest wrapped by passkey-PRF / wallet-derived AES | C: critical, I: critical | Total, **unrotatable** authority over the address's namespace — the same-key war (§4.4). This is the crown jewel. |
| **Persona keys** (per-app / per-workspace burners) | Kernel worker memory, same wrapping | C: high, I: high | Scoped forgery under Kernel policy budgets; blast radius = the persona's subtree + budget, not the identity (§4.4). |
| **The journal** (encrypted append-only op log) | IndexedDB/OPFS, AES-wrapped | C: high, I: high, A: high | Pending truth: drafts, planned records, intents, deny facts, receipts. Leak = intent/behavior disclosure; corruption = lost unsubmitted work. |
| **Signed bundles** (EIP-712 envelopes, PSBT-shaped) | Journal, encrypted at rest | C: **high — live grenades** | Anyone holding a signed bundle can publish it, now or years from now — expiry only ages what readers make of it; the pre-signed abort artifact is the kill switch ([[wallet-and-actions]] §custody). Leak = involuntary publication. |
| **Lens config + capability table** | Kernel state, snapshots with each generation | I: critical | The user's entire notion of *who to trust* and *what is granted*. Poisoning corrupts every read and every authority decision (§4.3). |
| **User attention / trust** | The human | scarce, non-renewable | The real target of phishing, batch-hiding, habituation. Every prompt spent devalues the next (secure-ui T3). |
| **Authorship reputation** | The address (protocol-global) | I: critical, permanent | Content signed under a stolen key is permanently, provably "by" the victim; no takedown. |
| **Local caches** (record/byte/view/thumbnail) | Cache API/OPFS keyed by CID | I: high, A: medium | Integrity is re-verified on read (content-addressed), so the risk is *stale-as-fresh* (§4.3), not forged bytes. Confidentiality: what you've read. |
| **Locale profile** | Kernel; app-visible surface coarsened | C: medium | Fingerprint vector (language list + tz + fonts + collation); disclosure budget is the defense ([[locale-and-accessibility]]). |
| **The OS distribution itself** (Kernel/Shell/System-Chrome CIDs, closure manifest) | Content-addressed; first load is TOFU | I: critical | Compromise here compromises *everything downstream* — the Bybit lesson at OS scale (§4.5). |

## 2. Adversaries and trust assumptions

Legend: **stops** = the mitigation that actually denies this actor; **does NOT** = the residual we accept and label.

| Adversary | Capability assumed | What stops it | What it does NOT stop |
|---|---|---|---|
| **Malicious Ring-3 app** | Arbitrary JS in its own compartment; hostile by default | SES `lockdown()` + Worker origin boundary + `connect-src 'none'`; no DOM/network/pixels ([[web-os-thesis]] F1) | Covert channels via postMessage volume/timing; abuse *within* a granted capability's allowlist (§4.2) |
| **Malicious package update** | Ships clean, flips post-review (Cyberhaven/Shai-Hulud) | Capability-diff-on-update (disable until approved), 24–72h cooldown from chain admission, k-of-n curator quorum ([[packages-and-updates]]) | Same-authority updates inside the cooldown pre-detection; a signer who is the attacker |
| **Compromised curator** | Holds a valid curator key, publishes hostile releases/attestations | Deny facts (presence-shaped, work when the author is hostile — [[read-lens-spec]] §3.4 r6); out-of-band lens distrust; quorum dilutes 1-of-1 | No key rotation until KEL; pre-detection installs; monitoring must stay funded |
| **Malicious / observant endpoint** (RPC, gateway, relayer, inference) | Sees every request; may lie about state | **Integrity solved**: envelopes + CIDs + `eth_getProof`/light-client verified in the client; a lying gateway cannot forge a read | **Interest privacy unsolved in production** (network-privacy §three-properties). The endpoint learns *what you asked*; OHTTP is partial, stated not promised. |
| **Compromised Session Shell package** (Ring 2) | Runs same-origin; can read IndexedDB directly | System Chrome (Ring 1½) is conserved and owns ceremonies/compositor; Shell delegates and cannot reimplement them ([[shell-and-sessions]]) | **Shell-origin compromise = local-state compromise** (F2). The worker boundary is modularity, not an enclave. Accepted; budget goes to dependency diet + LavaMoat + reproducible builds. |
| **Browser extension with `<all_urls>`** | Injects into the page, reads/rewrites DOM, MITMs fetch | Nothing we ship. **State plainly: SES cannot defeat a high-privilege browser extension** — it runs at a layer above ours (handoff truth-trap; secure-ui) | Everything. This is an **accepted residual** (§5). We never imply SES defeats it. |
| **Hostile mirror / document content** | Active HTML/SVG/PDF/JS bytes | Render service = sandboxed-iframe *document* lane, opaque origin, never the trusted origin, never app-logic lane ([[mirror-scheme-policy]]) | Timing/interaction side-channels within the iframe; user mistaking rendered content for chrome (negative-indicator hygiene) |
| **Prompt-injecting content against agents** | Untrusted bytes an agent reads, laced with instructions | CaMeL plan-freeze: plan compiled from trusted intent *before* untrusted content is read; data fills declared slots, never adds/reorders actions; lethal-trifecta is a static Kernel invariant ([[agent-native]]) | Model-level manipulation of *values within* declared slots; the Kernel validates structure, not semantics |
| **Phishing / BitB / lookalike links** | An in-page rectangle that looks like system chrome | Consequential ceremonies render off the spoofable surface (out-of-tab / passkey); interaction gating; negative indicators; T10 hardware cross-check (secure-ui T1/T5/T10) | BitB is page content — **no browser fix exists**; residual for the minority who never look; mitigated, not closed |
| **The platform itself** | Browser eviction; Apple policy; gateway legal pressure; steward death | Boot-wipe detection as an event ([[persistence-and-sync]]); user-pinned generations + Rescue Shell as steward-mortality hedge; multi-mirror + self-hosting tier | eth.limo precedent: gateway operators are legal chokepoints (federal trial testimony, DAO-reimbursed legal costs — webos-precedents). Apple can pull a wrapper. We hedge, we do not defeat. |

## 3. Attack trees for the crown jewels

### 3.1 Sign-what-you-didn't-mean — **[research-grounded]**, $2B+ of precedent

```
GOAL: user authorizes a write they did not intend
├─ Batch hiding: one dangerous record among harmless ones (7702 drainer wave, >97% sweepers)
│    ⊘ per-record risk classes; aggregate + expandable preview; a VAL/grant/export record
│      cannot render inside a "312 files" summary without its own risk chip ([[wallet-and-actions]])
├─ Preview divergence: display ≠ signed bytes (Radiant $50M, Bybit $1.5B)
│    ⊘ preview is DERIVED from the typed records and provably equal to the Merkle root signed;
│      not calldata-guessing. Hardware wallet recomputes the root (ERC-7730 descriptor, Safe-Utils lesson)
│    ⊘ RESIDUAL: the *rendering pipeline* itself (Shell) could lie — closed only by T10 for high-risk
├─ Address poisoning: substituted middle of a truncated address ($83.8M + a single $50M)
│    ⊘ <efs-identifier> renders full, LTR-isolated, chunked, confusable-checked; no truncation on
│      anything that authorizes value/trust; picker-over-paste (address book returns a scoped handle)
├─ Prompt mimicry inside the app's own surface / BitB
│    ⊘ apps own no pixels (F1) so an app cannot paint over System Chrome; ceremony off-surface;
│      Kernel-derived identity in every prompt (never app-asserted — modal-phishing lesson)
└─ Clickjacking / keyjacking the confirm
     ⊘ interaction gating: activation delay (~1–3s high-risk), no default-focus accept,
       ignore too-fast clicks, control at non-predictable location (secure-ui T5)
```

### 3.2 Exfiltrate-private-data

```
GOAL: move a secret (journal, key material, read history, locale) out of the OS
├─ Cage escape: SES containment bug / over-broad endowment (lavapack with()-bypass 2024)
│    ⊘ Worker origin boundary backstops SES; even a broken compartment has connect-src 'none'
│      and no DOM/WebRTC/navigation — the vectors CSP cannot close are structurally absent
├─ Granted-endpoint abuse: exfil within an allowed connect-src destination
│    ⊘ grants are narrow (exact endpoint), never wildcard-to-untrusted; broker logs every packet;
│      RESIDUAL: an app given a legit endpoint can encode data into legit-looking requests (policy, not platform)
├─ Covert channel: postMessage volume/timing between app and Kernel, or app↔app via shared timing
│    ⊘ RESIDUAL (accepted): rate/shape normalization on the membrane reduces, does not eliminate
├─ Cache-timing side channel: probe view/byte cache to infer what the user has read
│    ⊘ per-app partitioned caches; RESIDUAL: cross-principal timing is a policy problem
├─ Subresource / WebRTC / navigation beacon
│    ⊘ CLOSED by construction — a Worker has no <img>/CSS/RTCPeerConnection/location (web-isolation table)
└─ Browser extension reads it all
     ⊘ NOT CLOSED. Accepted residual (§5). Never implied otherwise in UI copy.
```

### 3.3 Corrupt-the-view — the honesty attack surface

```
GOAL: make the client render a false answer as true
├─ Lens poisoning: discovery/enumeration results shown as endorsed
│    ⊘ DISCOVERY flag; enumeration ≠ endorsement; MUST be lens-graded before trusted render;
│      counts never GATE-consumable ([[read-lens-spec]] §2.4, §7)
├─ UNKNOWN-as-absence fallthrough: data gap silently promotes a lower-trust author
│    ⊘ anti-fallthrough rule: only PROVEN-ABSENT yields; UNKNOWN STOPs (§2.1). First-attester-wins is
│      anti-monotone under missing data — the single most important read-side invariant
├─ Stale-cache-as-fresh: cached AS-OF(N) rendered as HOME-LIVE
│    ⊘ currency qualifiers are kernel state; UNKNOWN-CURRENCY never renders LIVE; never advance the
│      confirmed snapshot past a slot with pending local writes (PowerSync rule, [[persistence-and-sync]])
├─ Equivocation served as truth: forked author log, two records at one (author, seq)
│    ⊘ EQUIVOCAL is NEVER LIVE at any venue; display all branches; lens distrust is the resolution
├─ Deny-set staleness: an offline client treats a later-revoked release as LIVE-at-checkpoint
│    ⊘ PARTIAL — deny-set freshness floor for auto-update is a protocol gap (G3, §7); today: honest label
└─ NO-TRANSPORT rendered as "not found": the cage denied the read, UI says absent
     ⊘ "not permitted to look" ≠ "not found"; distinct state (thesis honesty item 1). Protocol gap: no
       NO-TRANSPORT qualifier in the read-grade vocabulary yet (G-transport, §7)
```

### 3.4 Take-over-authorship

```
GOAL: sign as the user, permanently
├─ Primary key theft (malware, extension, physical, phishing the unlock)
│    ⊘ at-rest AES wrap via passkey-PRF (survives origin eviction, re-openable);
│      external signer (wallet/hardware) for high-risk (T10) keeps the primary key off the software path
│    ⊘ POST-THEFT: same-key war — thief renews, re-asserts, counter-supersedes. Expiry/revocation DO NOT
│      defend. Working defense = out-of-band lens distrust + advisory subtraction; no rotation until KEL.
│      Detection-before-KEL-inception is the security-critical window ([[identity]] THEFT row)
├─ Persona hot-key theft (app-scoped burner in Kernel memory)
│    ⊘ Kernel-enforced budgets/kinds/subtrees cap blast radius; unexpected-claims monitor warns;
│      revoke = drop the persona from the stitching lens (link is revocable — [[wallet-and-actions]])
└─ Leaked signed bundle (exported .efs-bundle, or read from an unencrypted store)
     ⊘ encrypted at rest; pre-signed abort artifact is the kill switch; export is a Shell security event with
       permanence copy ("anyone holding this can publish it, now or years from now — expiry only ages
       what readers make of it")
```

### 3.5 Supply-chain — our own dependencies, curators, and build

```
GOAL: land hostile code in the OS or an app
├─ Dependency compromise (chalk/debug clipper, XZ-style maintainer capture)
│    ⊘ LavaMoat per-package policy + globalThis scuttling over OUR graph; reproducible builds;
│      cooldowns; a clipper that rewrites addresses is defeated by <efs-identifier> + preview-from-records
├─ Update-channel capture (auto-update is the distribution arm — Cyberhaven, GlassWorm worm)
│    ⊘ cooldown from chain admission (unforgeable, un-backdatable); capability-diff blocks broadened authority;
│      quorum dilutes a single captured curator
├─ Curator compromise
│    ⊘ deny facts + lens distrust (§2); RESIDUAL: pre-detection window; no rotation until KEL
├─ Invisible-Unicode / homoglyph smuggling in manifests/names/code (GlassWorm)
│    ⊘ package intake normalizes and flags variation selectors/PUA/confusables ([[packages-and-updates]] §publish)
└─ Our own build / first load
     ⊘ reproducible build + provenance records on EFS; Bootstrapper verifies Shell/Kernel/System-Chrome CIDs
       against the pinned closure before boot; refuse/rescue-boot on mismatch
     ⊘ RESIDUAL: the FIRST load of the Bootstrapper is a TOFU event on whatever gateway served it (§5)
```

## 4. Mitigations mapped to the architecture

| Layer | Primary defenses | Threats it owns |
|---|---|---|
| **Bootstrapper (Ring 0)** | Verify closure CIDs against pinned generation; self-pinning SW; refuse-on-mismatch | Our-own-build tamper, generation swap (§3.5) |
| **Kernel + broker (Ring 1)** | Capability table as data; port-minted grants (severable); `connect-src 'none'` cage; journal encryption; key wrapping | Exfil (§3.2), key theft at rest (§3.4), granted-cap abuse |
| **System Chrome (Ring 1½)** | Off-surface ceremonies; interaction gating; Kernel-derived identity; preview-from-records; T10 hardware step-up; pickers-as-grant | Sign-what-you-didn't-mean (§3.1), prompt spoofing |
| **Session Shell (Ring 2)** | Delegates all ceremonies; owns no keys/no raw DOM for chrome; conformance-tested against the delegated-duty list | Confined blast radius of a bad Shell (still same-origin — §5) |
| **Ring-3 cage** | SES + Worker + CSP triple layer; personas with budgets | Malicious app (§3.2) |
| **Render service** | Sandboxed-iframe document lane, opaque origin, never trusted origin | Hostile mirror content (§2) |
| **Read/lens layer** | Anti-fallthrough; currency qualifiers; EQUIVOCAL-never-LIVE; deny subtraction; DISCOVERY flag | Corrupt-the-view (§3.3) |
| **Package/update** | Capability-diff, cooldown, quorum, deny facts, reproducible provenance | Supply-chain (§3.5) |
| **Agent plane** | Plan-freeze, lethal-trifecta invariant, never-satisfy-checkpoints-alone | Prompt injection (§2) |

### Residual-risk honesty table — what we accept and label

| Residual | Why we accept it | How we stay honest about it |
|---|---|---|
| **Extension threat** (`<all_urls>` extension) | Runs above our layer; no web mechanism defeats it | Never imply SES/cage defeats it; document in Security Center; recommend a clean profile for high-value ceremonies |
| **First-load TOFU** | The Bootstrapper's first fetch trusts a gateway — TUF's untrusted-root-bootstrap, unavoidable on the open web | "First run pins this OS; every later boot verifies it" — surfaced, not hidden; WAICT/WEBCAT tracked as the standards path |
| **Shell-origin compromise = local-state compromise** | Browser's protection domain is the origin; the Kernel-in-a-Worker is not an enclave (F2) | Say it out loud; spend budget on dependency diet + reproducible builds, not on pretending |
| **No secure attention key** | The web has no Ctrl-Alt-Del; the page can't be guaranteed-suspended (secure-ui G2) | Negative-indicator + passkey stack; PWA/window-frame as the nearest trusted boundary; documented residual |
| **Interest privacy unsolved** | No production OHTTP-fronted RPC/gateway exists; traffic shape leaks | Two indicators (data-verified vs endpoint-privacy-class), never conflated; "verification ≠ no observation" |
| **Key compromise before KEL** | v2 is bare-EOA; no rotation exists until the KEL (~2030) | same-key-war paragraph carried verbatim; detection-window UX; deny facts + lens distrust as the only working defense |
| **Covert timing channels** | postMessage volume and cache timing are policy problems, not platform holes | Rate/shape normalization; documented as reduced-not-eliminated |

## 5. Truth-trap conformance items (grouped by owning surface)

The handoff §Security-and-truth-traps, re-cut as testable client checks. Each is a CI/conformance assertion; a conforming client MUST pass all in its owned group.

**System Chrome / prompt surface**
- CONF-SC1: a bundled write prompt renders per-record risk classes; a grant/export/VAL record cannot be collapsed into a benign aggregate.
- CONF-SC2: identity in any prompt is Kernel-derived (CID/signer/manifest), never app-asserted; app-supplied strings are labeled unverified.
- CONF-SC3: consequential confirms (sign/publish/spend/install/grant/export/delete) are interaction-gated and never satisfiable by an agent alone.
- CONF-SC4: above the T10 risk threshold, Shell-only confirmation is refused; authorization routes to an out-of-EFS signer.
- CONF-SC5: no positive "green check = safe" badge is the primary trust signal; warnings fire on bad states.

**Session Shell**
- CONF-SH1: app modals cannot occlude or imitate System Chrome; apps hold no fullscreen/pointer-lock/keyboard-lock/PiP by default.
- CONF-SH2: a bad Shell cannot remove the user's ability to reach Rescue Shell, reset permissions, or inspect wallet prompts.

**Kernel / broker**
- CONF-K1: no ambient HTTP anywhere (fonts, avatars, telemetry, update checks); every endpoint is a capability; there is no telemetry.
- CONF-K2: wildcard network requires a loud, non-routine warning; deny facts are journaled.
- CONF-K3: capability revocation renders as authority-withdrawn, never as "prior writes disappeared."

**Read / lens layer**
- CONF-R1: UNKNOWN never falls through; only PROVEN-ABSENT yields.
- CONF-R2: STALE and REVOKED never share wording; "lapsed" ≠ "withdrawn."
- CONF-R3: EQUIVOCAL/CONTESTED never render as LIVE.
- CONF-R4: discovery results carry the DISCOVERY flag and are lens-graded before trusted render.
- CONF-R5: `UNKNOWN because no transport` renders as denied-by-policy, never absence.
- CONF-R6: AS-OF/UNKNOWN-CURRENCY reads never render as plain HOME-LIVE.

**Wallet / outbox**
- CONF-W1: a signed bundle renders as committed & portable, never as private/revocable draft.
- CONF-W2: "delete" is "unlist/withdraw placement" everywhere except local cache deletion.
- CONF-W3: sponsored and self-paid records render identically at read time.

**Render service**
- CONF-D1: active mirror content never renders in the trusted origin.

**Package / update**
- CONF-P1: broadened capability/endpoint/signer diffs block until approved (disable-until-approved).
- CONF-P2: "found on EFS" is never rendered as endorsed or safe.
- CONF-P3: first-party is a provenance fact, never a security boundary, in copy and in code paths.

**Locale**
- CONF-L1: format-for-user does not disclose the full locale profile; disclosure is a separate prompted capability.
- CONF-L2: signed receipts/timestamps/citations always carry a stable canonical value under the localized surface.

**Agent**
- CONF-A1: an agent cannot hold the full lethal trifecta without break-glass chrome.
- CONF-A2: tool/manifest/mirror/comment content cannot add or reorder plan actions.
- CONF-A3: agent memory is never silently written to public EFS.

## 6. Incident-response surfaces

- **Deny-fact latency.** A deny fact (advisory TAG, `expiresAt = 0`) propagates through the user's subscribed advisory lenses on the next head fetch for that venue. Offline floor: the client refuses *auto*-update / GATE consumption once the deny-set's covering checkpoint is older than the auto-update freshness horizon (protocol gap G3 — §7). Deny facts are presence-shaped: they work even when the hostile author still holds the key ([[read-lens-spec]] §3.4 r6).
- **Kill switches.** Every grant is a Kernel-minted port; **revocation = closing the port** (immediate, unforgeable). The Permission Center exposes: sever a capability, pause an endpoint (broker stops opening sockets), freeze the outbox (halt flush of queued/signed bundles), and quarantine an app (drop all its ports). A frozen outbox does not un-sign a bundle — it stops *submission*, which is the only reversible half.
- **Rescue boot.** A generation grades `successful` only after the Bootstrapper→Kernel→System-Chrome→Shell health checkpoint (Android `markBootSuccessful`); failure auto-falls-back to last-successful, failing twice lands in **Rescue Shell** (a permanent GC root in every manifest) — capability set per the closed list in [[shell-and-sessions]] §The Rescue Shell (illustratively, non-normative: generation rollback among locally verified generations, capability-table pause/revoke, journal/bundle export) ([[boot-and-profiles]], [[packages-and-updates]]).
- **Key-compromise playbook.** Because protocol rotation does not exist until the KEL, the playbook is: (1) **out-of-band lens distrust** — remove the compromised author from every lens that trusts it; (2) **advisory subtraction** — publish/subscribe deny facts against the hostile records (works while the thief holds the key); (3) for personas, drop the persona from the stitching link and rely on budget caps to bound what already leaked; (4) publish the reserved **successor pair** if one was pre-established at identity creation (never auto-followed; hostile MUST-NOT-authorize semantics — [[identity]] B1/B2); (5) accept that the compromised key remains a valid author on every inception-ignorant venue forever (rotation-locality, [[identity]] D1). Detection *before* any KEL inception is the security-critical window and the OS says so.

### Agent lens

Agents are the fourth principal behind the same Kernel; nothing in this model has an agent side-door. Every §5 checkpoint (CONF-SC3, CONF-A1..3) is enforced against agent sessions specifically: an agent can prepare a release, draft a bundle, run the channel-monitor, and compile a trust dossier — all GATE-context reads that STOP mechanically on STALE/UNKNOWN/EQUIVOCAL ([[read-lens-spec]] §3.3) — but can never satisfy a sign/publish/spend/install/grant/export/delete ceremony alone. Prompt injection is treated as *permanently unsolved* (agent-native): the defense is capability scoping + plan-freeze, so injected content manipulates values inside declared slots at worst, never the action graph. The lethal trifecta (private reads + untrusted ingestion + external network) is a static Kernel invariant, not a model behavior. The one place agents *weaken* a defense is the human-presence gate (secure-ui G6): an agent cannot satisfy interaction gating, so the model forbids auto-approval of any gated action rather than letting agents inherit ambient authority.

### Honesty obligations

- This whole document is a **negative-indicator artifact**: it warns on bad states and accepted residuals; it does not claim "the OS is secure." The residual-risk table (§4) is the honest core.
- `verified ≠ private`: integrity mitigations (§2 endpoint row) never imply the endpoint didn't observe the request.
- `signed ≠ submitted ≠ admitted`: a kill-switched (frozen) outbox stops submission only; §6 says so.
- `revoked capability ≠ prior writes undone` (CONF-K3); `unlist ≠ delete` (CONF-W2).
- `certain` means **certainly this key** (§0 caveat carried from [[read-lens-spec]] §2.5) — no grade in this model survives key compromise, and the doc never implies one does.
- Every "stops" in §2 is paired with a "does NOT"; a mitigation stated without its residual is a bug in this doc.

## Open questions

- [ ] Deny-set freshness floor for auto-update (G3): the normative "deny-set no older than T, venue-qualified" gate is a protocol-side pressure item, unresolved here. [open]
- [ ] NO-TRANSPORT read-grade qualifier: the cage makes "denied by policy" a common state; the read-grade vocabulary has no name for it (thesis honesty item 1 / web-isolation gap 3). Filed as an efsv2 pressure item. [open]
- [ ] T10 risk-threshold constant and denomination (value, admin grants, key export) — owned by [[wallet-and-actions]]'s open question (T10 value threshold constant and denomination); tracked there, not duplicated here. [open — pointer]
- [ ] Covert-channel budget: is postMessage rate/shape normalization worth the latency cost, or accepted as pure policy residual? Needs a prototype measurement. [open]
- [ ] Extension-threat UX: do we ship a "clean profile / hardened lane" recommendation for high-value ceremonies, or only document the residual? [reasoned] toward documenting + recommending. [open]
- [ ] Steward-mortality: is the Rescue Shell + pinned-generation hedge sufficient, or do we need a signed "last-known-good" mirror list distributed out-of-band against gateway legal pressure (eth.limo precedent)? [open]

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (contracts included for the read-grade/deny-fact conformance items — confirm with the read-lens owner)
- [ ] Depends-on chain verified; sibling docs' mitigations cited match their current text
- [ ] No AGENT-Q comments remain
- [ ] At least one round of `#status/review` with another agent or human comment
