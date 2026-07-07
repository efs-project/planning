# Capability OS lineage and object-capability discipline — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** capability-os. **Date:** 2026-07-07.

## Executive framing

The capability lineage (KeyKOS → EROS → seL4/Genode; E → Caja/Joe-E → SES/Endo → Agoric/Spritely) is the only security tradition whose UX story *eliminates* permission prompts instead of multiplying them. Its core discipline — **designation is authorization**: the act of pointing at a resource IS the grant — maps almost one-to-one onto the EFS client v2 non-negotiables (Kernel as mediator, attenuated `efs.*` objects, picker-granted files, endpoint capabilities, no ambient HTTP). The lineage also has a graveyard (CloudABI, Polaris, CapDesk, Sandstorm-the-company, Morello follow-through) whose failure modes are well documented and mostly *not* about the security model: they are about retrofit cost, ecosystem economics, and pretending revocation/aggregation problems don't exist. EFS is greenfield, so it dodges the retrofit trap — the biggest single advantage it has over every failed system in this file.

---

## 1. WHAT EXISTS TODAY (shipped, production)

### 1.1 seL4 — verified microkernel, capability spaces
- Active, healthy cadence: **13.0.0 (2024-07-02)**, **14.0.0 (2023-12-11)**, **15.0.0 (2025-03-31)** — each a breaking release; 13.0.0/14.0.0 fixed kernel-crash and VCPU-bookkeeping bugs *in unverified configurations only* (the verified core has held since 2009). (github.com/seL4/seL4/releases)
- **2026-06-29:** Proofcraft completed functional-correctness verification of the MCS (mixed-criticality scheduling) configuration on RISC-V — the largest proof in the stack; Arm64 port next under DARPA PROVERS. MCS API ships in 15.0.0. (proofcraft.systems/news-2026)
- Architecture facts that matter for EFS: every kernel object is reached only through a capability in a per-thread **CSpace** (a tree of CNodes mapping local indices → capabilities); there is *no other* naming or access path. Authority to create objects is itself a capability (`Untyped` memory retyped into objects), so resource exhaustion is governed by the same discipline as access. Boot-time capability layouts are described declaratively in **capDL** (capability distribution language) — a machine-checkable spec of "who holds what at t₀."
- Deployment reality: high-assurance niches (defense, avionics, automotive), not general-purpose desktops. The lesson is not "microkernels lose" but "the capability kernel is the easy part; the userland and app ecosystem is the expensive part."

### 1.2 Genode / Sculpt OS — init as capability router, deploy/depot
- Cadence is exemplary for a small team: Sculpt OS **25.10 (2025-10-30)**, Genode **26.02 (2026-02-26**, XML replaced by a human-inclined "HID" config format**)**, Sculpt **26.04 (2026-04-30**, fully live declarative data model — "the entire construction plan of the system in the user's hands," changes take effect immediately**)**, Genode **26.05 (2026-05-29**, Codeberg migration complete**)**. 2026 roadmap theme: interoperability. (genode.org/news/2026)
- **Recursive system structure** (Genode Foundations 25.05, fetched): every component except core has a parent; the parent supplies the child's *entire* world — one parent capability at birth, nothing else. Services are announced upward (delegating a *root capability*); session requests flow upward and are **routed by policy at every node**; each intermediary can deny, serve locally, delegate down another subtree, or forward up, and can rewrite session arguments. After session establishment, client↔server communication is direct (policy at setup time, zero-cost at use time). Resource budgets (RAM/caps) are *traded* along the same tree — quota is part of the session protocol, so a server's memory for a client is paid by the client.
- **init is just a component** whose config is the routing table. Sculpt's killer UX move: the routing/deploy state is a *live, inspectable graph* the user edits; the depot is federated (Genode Labs + independent providers), content is fetched by version, images verified by signature/SHA256 with providers' public keys. Install = "add a depot source + wire routes," and the wiring diff IS the permission review. (genode.org/download/sculpt)
- This is the closest shipped analogue to the EFS Kernel-as-capability-router with user-controlled profiles.

### 1.3 Capsicum — capability mode in a mainstream Unix
- Shipped, on by default since FreeBSD 10.0 (2014); used by tcpdump, dhclient, etc. (USENIX Security 2010 paper; Cambridge/Google). Adoption **stalled**: retrofitting programs that "name resources late" is painful; you cannot open arbitrary paths inside capability mode, so everything must be pre-opened or brokered; developers must know the whole program before capsicumizing. FreeBSD Foundation still runs internships to capsicumize more of the base system — a signal of both life and struggle. (freebsdfoundation.org; cdaemon.com/posts/capsicum)

### 1.4 CloudABI — dead, instructively
- CloudABI (Nuxi, Ed Schouten): Capsicum-based pure-capability ABI — no global namespace at all; a program's argv *is* its capability set. **Deprecated October 2020 "for lack of interest," explicitly in favor of WASI**, whose design it inspired. (github.com/NuxiNL/cloudlibc README; lwn.net/Articles/674770)
- Cause of death was not technical: it demanded a parallel software universe (own libc, own package set) with no migration path and no killer host platform. **Lesson: a pure-capability runtime only survives if it is the *native* ABI of a platform people already want** (WASI got the wasm platform; CloudABI had none). EFS Ring-3 is exactly such a native ABI — apps are written *for* the EFS OS, so there is no retrofit population to lose.

### 1.5 Hardened JavaScript (SES/Endo) — ocap JS in production
- `ses` (lockdown + Compartment + harden) is production infrastructure: **MetaMask Snaps** runs third-party wallet plugins in SES compartments inside LavaMoat inside an iframe; **Agoric** runs SES smart contracts on a public chain (SwingSet). Endo README: "Agoric and MetaMask rely on Hardened JavaScript … to sandbox third-party plugins or smart contracts and mitigate supply chain attacks for production web applications, web extensions, and build systems." Formal verification work on the Agoric kernel "found the object capability model that ses provides to be sound." (github.com/endojs/endo)
- **LavaMoat** demonstrably stopped a real attack: the December 2023 Ledger connect-kit supply-chain compromise did not affect MetaMask because runtime policy denied the injected code its needed authority. (metamask.io/news/lavamoat-and-the-ledger-software-supply-chain-attack)
- **Agoric the product** pivoted: Orchestration API (July 2024), Fast USDC; governance Proposal #93 (**2025-05-01**) sunset the Inter Protocol stablecoin. The ocap kernel (SwingSet/Zoe) works in production; the *business* had to chase a different market. Lesson: ocap correctness ≠ product-market fit; budget for the product story separately. (agoric.com blog; messari.io Agoric reports)

### 1.6 Powerbox lineage — designation-based granting, shipped
- **Sandstorm powerbox** (docs.sandstorm.io, still the best-documented web powerbox): apps request a *type* (Cap'n Proto tag descriptor), never a specific resource; the platform renders the picker; "the user is never presented with a yes/no security dialog — instead of 'Is it OK for this app to access your calendar?' Sandstorm asks 'Which calendar should the app use?'" Persistence via claim/access **tokens** (`save()`/`restore()`), and restore re-checks `requiredPermissions` — so **grants die automatically when the user's own access dies**. That token-with-recheck design is the production answer to "capabilities are irrevocable."
- Browser platform quietly adopted the same idea: `<input type=file>` / `showOpenFilePicker()` are powerboxes (picker = grant); Chrome now **auto-revokes** notification permission from sites you stop engaging with (Chromium blog, 2025-10) — mainstream acknowledgement that permissions must be *live, decaying handles*, not booleans.

### 1.7 The theory canon (stable, load-bearing)
- **Confused deputy** (Norm Hardy, SIGOPS OSR 22(4), Oct 1988; cap-lore.com): programs wielding authority from two principals will be tricked; ACLs cannot fix this, capabilities do, because the designator and the authority travel together.
- **Capability Myths Demolished** (Miller, Yee, Shapiro; SRL2003-02, 2003; papers.agoric.com): kills the Equivalence myth (caps ≠ ACL columns — caps ban ambient authority and make delegation explicit), the Confinement myth (caps *can* confine; loader-controlled connectivity), and the **Irrevocability myth** (interpose a caretaker; revocation is a pattern, not a primitive).
- **Robust Composition** (Miller, PhD 2006): permission vs authority; POLA; the pattern toolbox — **facet** (narrow subset object), **attenuator** (wrap and restrict), **caretaker** (switchable forwarder = revocation), **membrane** (transitive caretaker/attenuator applied to every reference crossing a boundary, so a whole subgraph can be severed at once), **sealer/unsealer** (rights amplification). (wiki.erights.org Walnut "Capability Patterns"; worrydream.com PDF)
- **Yee, User Interaction Design for Secure Systems** (UCB TR 2002; ICICS 2002): ten principles — path of least resistance, appropriate boundaries, **explicit authorization** (grant by designation), visibility, **revocability**, expected ability, trusted path, identifiability, expressiveness, clarity. Still the best checklist for the Shell's prompt/picker surfaces.
- **Petnames** (Stiegler, "An Introduction to Petname Systems," skyhunter.com, ~2005; Spritely two papers, Oct 2022, files.spritely.institute): Zooko's triangle — global+secure+memorable: pick two. Keys are global+secure; nicknames global+memorable (forgeable!); petnames private+secure+memorable. "Mimicry is an emergent property of violating Zooko's triangle" — phishing is a *naming* failure. Petname UX = contact list over keys.
- **Polaris** (HP Labs HPL-2004-221; CACM Sept 2006 — Stiegler, Karp, Yee, Close, Miller): POLA retrofit on Windows XP; "no need to pop up security dialog boxes"; file-open dialog doubled as the grant. Died with the lab project; Direct3D bypassed its machinery (over half of games broke) — **retrofit again**. **Plash** (Mark Seaborn, plash.beasts.org): POLA shell + file powerbox on Linux via chroot'd file server — same designation-grant, same fate (unmaintained). **DarpaBrowser/CapDesk** (Combex final report, June 2002; Wagner–Tribble security review 2002-03-04): proved a *malicious* renderer could be confined by an E-language capability desktop; the hard residual problems were fidelity-of-designation (memoryless renderer) and covert channels, not the ocap core.

---

## 2. WHAT IS EMERGING (drafts, betas — dated)

- **OCapN** (ocapn.org; github.com/ocapn/ocapn): pre-standardization group (Spritely leading; Agoric, MetaMask, Sandstorm involved). Three draft specs — CapTP (messages, promises, promise pipelining, third-party handoffs), Netlayers (Tor/libp2p/I2P/IBC transports), Locators. Test suite exists; independent Haskell implementation passes it; IETF/W3C submission is the stated goal but **it is still draft** in mid-2026 (0.18.0 bumped the wire protocol incompatibly in April 2026).
- **Spritely Goblins v0.18.0 (2026-04-21)**: distributed ocap actors with transactional turns; new "sleepy actors" persistence/caching layer (actors hibernate to disk, wake on demand). **Hoot** (Scheme→Wasm compiler, Wasm GC + tail calls, runs in all major browsers) carries Goblins into the browser (v0.15.0 "Goblins in the browser"). **Brux** petname system: working prototype integrated with goblin-chat, early stage. (spritely.institute/news)
- **CHERI/CHERIoT**: hardware capabilities went commercial at the microcontroller end — CHERIoT ISA 1.0 (Microsoft, open-sourced; cheriot.org "last ten years," 2025-05-16); SCI Semiconductor ICENI chips shipping 2025; CHERI Alliance founded 2024. Arm **Morello has no announced production follow-up** — desktop/server CHERI stalled. Watch, don't depend.
- **Genode 2026 direction**: live declarative system model + HID format = the "OS as inspectable data" idea EFS wants for profiles/generations, now shipping in Sculpt 26.04.
- **WASI preview 2 / component model** (CloudABI's heir): capability-shaped imports at the component boundary; relevant if EFS ever runs Wasm apps in Ring 3.

---

## 3. LESSONS AND TRAPS (from deployed systems)

1. **Retrofit kills; greenfield wins.** Capsicum (late naming), Polaris (Direct3D), Plash (distro drift), CloudABI (parallel universe) all bled out on the cost of forcing capability discipline onto software that assumes ambient authority. Every success (seL4, Genode, Snaps, Agoric contracts, Sandstorm apps) made ocap the *native* contract of a new platform. EFS Ring 3 must be capability-native on day one — no "compat fetch," no escape hatches "for now."
2. **Yes/no prompts are the anti-pattern; pickers are the pattern.** CHI 2024 telemetry study (25,706 surveyed decisions, >100M Chrome installs) confirms prompt annoyance and habituation; Chrome now quiets and even auto-revokes. The powerbox line (CapDesk → Plash → Sandstorm → browser file pickers) shows the fix: ask *which*, never *whether*. Reserve modal ceremony for the few acts that are genuinely irreversible (in EFS: signing/flush).
3. **Revocation must be interposed at grant time or it never exists.** The Irrevocability Myth is only a myth if every grant is born behind a caretaker/membrane. Sandstorm's restore-time permission recheck is the deployable version. Also design for **revocation ≠ undo**: Sandstorm can cut a live capability but cannot unsend data already exfiltrated; EFS additionally cannot unwrite a chain.
4. **Aggregation of authority is where capability systems quietly rot.** Some components legitimately need broad authority (file manager, shell, sync daemon, agent runners). If the platform pretends everything is least-authority, these become unaudited super-apps (Genode solves it structurally: such things are *parents/servers* in the tree, not peers; Sandstorm punts them to the platform). Name the tiers explicitly (system service / admin capability), route them through the same ledger, and never let "first-party" substitute for a named grant.
5. **The router's own policy is the residual TCB — make it visible data.** In Genode, all security *is* the init config + routing; Sculpt's answer is to show the user the live graph. A capability OS whose routing policy is opaque JSON in a worker is just ACLs with extra steps. EFS profiles should make the Kernel's routing/grant table a first-class, diffable, content-addressed artifact.
6. **Ocap tech ≠ product.** Agoric's kernel works; its first product was sunset by governance vote (Prop 93, 2025-05-01). Sandstorm's tech outlived its company. Genode survives on consulting. Budget the EFS client's product story (files, sharing, trust UX) as the thing that carries the capability discipline, not vice versa.

---

## 4. EFS TRANSLATION (opinionated)

1. **Model the Kernel on Genode's init, not on a permission database.** One routing table, declarative, live: app compartment → named capability (FsScope, RpcEndpointHandle, HttpOriginHandle, LocaleHandle…) → route → attenuations. Policy is applied when a session/handle is created; use is then direct and cheap. The table is the OS profile's security half: content-address it, diff it on app update (Sculpt-style wiring diff = the install review), snapshot it per generation for rollback. capDL is prior art for "boot state as checkable capability graph."
2. **Permissions are live handles with lifecycle, never booleans.** Every grant = kernel-side caretaker proxy (MessagePort or brand-checked SES object) with: scope descriptor (printable → receipts), expiry/decay (Chrome's auto-revoke precedent), pause, revoke, and an audit trail of invocations. Revoking kills *future* use instantly (sever the port). Persisted grants are Sandstorm-style tokens whose `restore()` re-evaluates current policy — never rehydrate a raw capability.
3. **The membrane is the postMessage boundary — exploit it.** Ring-3 apps only ever hold *proxies*; the structured-clone boundary between compartment and Kernel worker is a natural membrane: nothing crosses except what the Kernel explicitly wraps. Compose attenuation there (read-only facet ∘ subtree scope ∘ rate limit ∘ logger) and enforce "deep attenuation": any object returned *through* a granted capability is wrapped in the same membrane, or confinement leaks on the first nested object.
4. **Pickers are the permission system.** File/folder/lens/endpoint/wallet-persona pickers, Shell-owned, request-by-*type* (Sandstorm descriptor model: app says "I need a writable folder / an RPC endpoint / an image," never a path). Designation = authorization; zero resource prompts. The only modal ceremony left is the flush/signing checkpoint — which is EFS's natural powerbox moment: the batch review *is* the authority review.
5. **Petnames everywhere trust is shown.** A lens's ordered trusted-author list is literally a petname directory (private, secure, memorable) over addresses (global, secure). The Shell must render authors/apps/endpoints via the user's petname service; raw addresses and ENS-style nicknames are *forgeable UI* (Zooko). Edge names (petnames learned via an already-trusted author's labels) map beautifully onto lens delegation chains — pursue this; it's the humane face of first-attester-wins.
6. **Ship on SES/Endo + LavaMoat; track OCapN, don't adopt yet.** SES compartments are the only browser ocap runtime with production miles (MetaMask, Agoric) and a real stopped-attack record (Ledger 2023). OCapN is the right *shape* for future cross-device/agent capability transfer (promise pipelining over relays fits offline-first), but its wire protocol still breaks between drafts (April 2026); mirror its concepts (locators ≈ saved grants, handoffs ≈ share links) without the dependency.
7. **Name the aggregation tier honestly.** Files-app, sync, agent runner: give them *admin capabilities* with the loudest receipts, not quiet ambient power; make them servers the Kernel routes to (Genode pattern) rather than peers with big grants where possible.
8. **Write the two-worlds rule into the Shell copy:** revoking an app/agent capability stops *future* action; it does not and cannot retract signed envelopes or on-chain records. Pair every revocation receipt with the honest state of what was already durably written (and the REVOKE-record path for the records themselves).

---

## 5. WHERE EFS v2 PROTOCOL MAY UNDER-SUPPORT THE CLIENT

1. **No delegated-authority artifact below the author.** Identity = one address; lenses key on attester = user's wallet (or app contract). Agents/apps acting via granted capabilities are therefore *indistinguishable on-chain* from the human. The client's capability ledger and action receipts are purely local — a verifier or another device cannot tell "user signed this personally" from "agent flushed it under a broad grant." Ocap practice (certificate-style caps, OCapN handoffs, session keys) wants a protocol-visible, attenuable delegation credential; EFS v2 reserves KEL/succession but has no session/sub-key attestation story lenses can resolve. Needs an efsv2 pressure note.
2. **Signed envelopes are bearer instruments.** Anyone holding a signed bundle can submit it anywhere, anytime (that's the feature). In capability terms this is an *unrevocable, unattenuable capability over the author's reputation*. `expiresAt` is the only interposition hook — the client should default-set tight expiries on anything delegation-shaped, and the protocol should say whether "expired but already-admitted" reads differ per venue.
3. **REVOKE ≠ revocation.** Protocol REVOKE is a G-set tombstone on records; capability revocation is severing future authority. The Shell vocabulary must keep these apart (withdrawn placement vs revoked grant), and read grades give no help for "this record was written under a grant later revoked" — probably fine (caveat emptor), but decide *explicitly* that provenance-of-grant is out of protocol, or reserve a tag key for it.
4. **TAGDEF namespaces risk Zooko violations.** Global human-meaningful namespace nodes invite mimicry/typosquatting (paypa1 problem) that first-attester-wins per lens *mostly* absorbs — but only if clients never render a raw namespace label as if it were trustworthy. The protocol could cheaply help: canonical-form/confusability metadata (or a normative "labels are nicknames, not identifiers" line in read-lens-spec) so all clients treat display names as forgeable.
5. **Grant/receipt records have no home.** The handoff wants capability receipts, settings receipts, audit exportable "itself written to EFS." Five kinds can encode this via TAG/DATA conventions, but without a blessed schema, every client invents one and lenses can't reason about them. A reserved-key convention for "receipt" records (attester = user, about = grant hash) would make audit logs portable — cheap, worth reserving pre-freeze.

---

## Sources (fetched or verified 2026-07-07)

- https://genode.org/news/genode-os-framework-release-26.02 (2026-02-26)
- https://genode.org/news/2026 (Sculpt 26.04 2026-04-30; Genode 26.05 2026-05-29; roadmap 2026-01-27)
- https://genode.org/download/sculpt (Sculpt 26.04, depot/providers/verify)
- https://genode.org/documentation/genode-foundations/25.05/architecture/Recursive_system_structure.html
- https://www.genode.org/news/2025 (Sculpt 25.10, 2025-10-30)
- https://github.com/seL4/seL4/releases (15.0.0 2025-03-31; 13.0.0 2024-07-02; 14.0.0 2023-12-11)
- https://docs.sel4.systems/releases/seL4.html
- https://proofcraft.systems/news-2026/ (MCS RISC-V verification complete, 2026-06-29)
- https://sel4.systems/Summit/2025/abstracts2025.html
- https://www.usenix.org/legacy/event/sec10/tech/full_papers/Watson.pdf (Capsicum, USENIX Sec 2010)
- https://freebsdfoundation.org/project/capsicum-internship/ ; https://cdaemon.com/posts/capsicum
- https://github.com/NuxiNL/cloudlibc (CloudABI deprecation notice, Oct 2020) ; https://lwn.net/Articles/674770/
- https://github.com/endojs/endo ; https://github.com/endojs/endo/tree/master/packages/ses (SES/Endo, production users, soundness note)
- https://metamask.io/news/lavamoat-and-the-ledger-software-supply-chain-attack (Dec 2023)
- https://docs.metamask.io/snaps/learn/best-practices/security-guidelines/ ; https://osec.io/blog/2023-11-01-metamask-snaps/
- https://agoric.com/blog/announcements/agoric-composable-smart-contract-framework-reaches-mainnet-1-milestone/ ; https://messari.io/report/agoric-the-cross-chain-orchestration-engine (Prop 93, 2025-05-01; Orchestration July 2024)
- https://docs.sandstorm.io/en/latest/developing/powerbox/ ; https://sandstorm.io/how-it-works
- https://ocapn.org/ ; https://github.com/ocapn/ocapn (draft specs, test suite)
- https://spritely.institute/news/spritely-goblins-v0-18-0-sleepy-actors.html (2026-04-21)
- https://spritely.institute/news/spritely-goblins-v0-15-0-goblins-in-the-browser.html ; https://spritely.institute/hoot/
- https://files.spritely.institute/papers/petnames.html ; https://files.spritely.institute/papers/implementation-of-petname-system-in-existing-chat-app.html (Oct 2022)
- http://www.skyhunter.com/marcs/petnames/IntroPetNames.html (Stiegler)
- https://papers.agoric.com/assets/pdf/papers/capability-myths-demolished.pdf (SRL2003-02, 2003)
- http://cap-lore.com/CapTheory/ConfusedDeputy.html ; https://dl.acm.org/doi/10.1145/54289.871709 (Hardy 1988)
- https://www2.eecs.berkeley.edu/Pubs/TechRpts/2002/5658.html (Yee 2002, ten principles)
- https://www.hpl.hp.com/techreports/2004/HPL-2004-221.html ; https://cacm.acm.org/research/polaris-2/ (Polaris, 2004/2006)
- http://plash.beasts.org/powerbox.html ; http://plash.beasts.org/index.html (Plash)
- http://www.combex.com/papers/darpa-report/html/index.html (DarpaBrowser final report, June 2002; Wagner–Tribble review 2002-03-04)
- http://wiki.erights.org/wiki/Walnut/Secure_Distributed_Computing/Capability_Patterns ; https://worrydream.com/refs/Miller_2006_-_Robust_Composition.pdf
- https://dl.acm.org/doi/10.1145/3613904.3642252 (CHI 2024 permission-prompt sentiment, 25,706 users)
- https://www.usenix.org/system/files/sec21summer_bilogrevic.pdf (Chrome prompt quieting)
- https://blog.chromium.org/2025/10/automatic-notification-permission.html (auto-revocation, Oct 2025)
- https://cheriot.org/cheri/history/2025/05/16/last-ten-years.html ; https://en.wikipedia.org/wiki/Capability_Hardware_Enhanced_RISC_Instructions (CHERI/CHERIoT/Morello status)
