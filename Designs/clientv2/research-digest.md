# Research digest — client v2 corpus (consolidated)
**Status:** draft
**Target repos:** planning
**Depends on:** [[web-os-thesis]], [[fable-client-v2-handoff]], [[read-lens-spec]]
**Reviewers:** —
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/research #repo/planning

## What this rules

This is the **reference tier** of the client v2 design set: the consolidated index of the 14-lane research corpus at `Reviews/2026-07-07-clientv2-corpus/`, deduplicated into the cross-cutting findings that shaped [[web-os-thesis]], with the best dated primary sources for each. Design docs in this folder should cite *this digest or a lane file*; this digest cites *primary sources with dates*. It makes no design rulings — where it disagrees with the thesis or finds a protocol gap, that goes to Open questions and the efsv2 pressure report, not into silent divergence. All sources were fetched or verified **2026-07-07** unless noted.

### How to use it

1. Writing or reviewing a clientv2 doc → check §Cross-cutting findings for the evidence behind the ruling you're touching, then the lane file for depth.
2. Challenging a ruling → attack the sources here first; a ruling whose evidence row falls is fair game for amendment.
3. Approaching an implementation freeze → walk §Watch list; every row has a "re-check" trigger.
4. Filing protocol pressure → the per-lane "where EFS v2 under-supports" sections are the raw feed; the consolidated pressure report (Designs/efsv2/) is the sink.

### Corpus map

| Lane | File | Lane question |
|---|---|---|
| closures-generations | Reviews/2026-07-07-clientv2-corpus/research/closures-generations.md | How shipped systems name bootable closures, pin graphs, manage generations/rollback/GC |
| fuchsia-components | Reviews/2026-07-07-clientv2-corpus/research/fuchsia-components.md | Component manifests, resolvers/runners, sessions; Android intent routing autopsy |
| capability-os | Reviews/2026-07-07-clientv2-corpus/research/capability-os.md | Ocap lineage (KeyKOS→seL4/Genode; E→SES), powerboxes, petnames, revocation patterns |
| web-isolation | Reviews/2026-07-07-clientv2-corpus/research/web-isolation.md | What the 2026 web platform can actually deny (CSP/workers/iframes/SES) |
| local-first | Reviews/2026-07-07-clientv2-corpus/research/local-first.md | Journals, outboxes, rebase discipline, CRDT relevance, signed-but-unsubmitted precedents |
| wallet-standards | Reviews/2026-07-07-clientv2-corpus/research/wallet-standards.md | Signing/batching/session ERCs, passkeys, clear-signing, drainer incident record |
| package-trust | Reviews/2026-07-07-clientv2-corpus/research/package-trust.md | TUF/Sigstore/store models, supply-chain incidents, update semantics |
| network-privacy | Reviews/2026-07-07-clientv2-corpus/research/network-privacy.md | What a fetch leaks; relays, OHTTP, timing attacks, private read paths |
| i18n-a11y | Reviews/2026-07-07-clientv2-corpus/research/i18n-a11y.md | Intl/ICU4X/MF2, fonts, bidi security, IME, WCAG 2.2, Shadow-DOM ARIA |
| agent-native | Reviews/2026-07-07-clientv2-corpus/research/agent-native.md | MCP/A2A/WebMCP, prompt-injection defenses, budgets, receipts |
| webos-precedents | Reviews/2026-07-07-clientv2-corpus/research/webos-precedents.md | Autopsies: Firefox OS→Urbit→Solid; living relatives: Snaps, IWA, ATProto |
| secure-ui | Reviews/2026-07-07-clientv2-corpus/research/secure-ui.md | Trusted chrome, spoofing, blind signing, prompt/warning research |
| storage-durability | Reviews/2026-07-07-clientv2-corpus/research/storage-durability.md | Quota/eviction reality, OPFS/SQLite, multi-tab coordination, encryption at rest |
| boot-deeplinks | Reviews/2026-07-07-clientv2-corpus/research/boot-deeplinks.md | Fragment secrets, unfurl bots, URL budgets, SW cold start, import-map boot (landed on retry — see §Methodology) |

## Cross-cutting findings that shaped the thesis

Deduplicated across lanes; each with its strongest dated primary sources and the rulings it feeds.

**1. Verified reads were never shipped by the dweb.** Every dweb stack routes through gateways users must trust; the IPFS project itself calls unverified gateway trust an anti-pattern, and the largest crypto theft ever was a *frontend* integrity failure. Client-side verification of every byte is buildable from shipped parts today and no one has assembled it — the thesis's headline differentiator. → thesis §The thesis, F4, F5, F11; [[packages-and-updates]], [[network-privacy]].
- "The State of Dapps on IPFS" — blog.ipfs.tech, 2024 ("users cannot benefit from the integrity IPFS provides without running their own node")
- @helia/verified-fetch — blog.ipfs.tech/verified-fetch, 2024-04 (integrity solved as a library; interest privacy explicitly not)
- Bybit hack analyses — NCC Group / Certora, 2025-02-21 incident ($1.4–1.5B via compromised Safe{Wallet} frontend, no SRI)
- EthStorage Colibri client-side gateway verification — blog.ethstorage.io, 2025 (still a prototype)

**2. Workers are the only airtight cage.** DOM contexts leak through at least three vectors CSP cannot close (WebRTC egress, frame self-navigation, DNS-prefetch/prerender side channels); a dedicated Worker structurally lacks all of them, and a `blob:` worker inherits the page CSP — enforceable with no server headers. → thesis F1, F2; render-surface + OS-SDK docs (in flight).
- CSP3 spec + `navigate-to` removal — W3C / mdn-content issue #21114, removed 2022-09
- WebRTC not covered by `connect-src`; no worker `RTCPeerConnection` — w3c/webrtc-extensions #77; Chromium issue 40188662
- Blob-worker CSP inheritance — whatwg/wpt discussion, web-platform-tests #35641 (verified 2026-07-07)
- Prerender stealth CSP bypass — brokenbrowser.com, 2026-05-09 (DOM cages keep springing leaks)

**3. Designation is authorization.** The 40-year capability lineage and the shipped powerboxes (Sandstorm, iOS PHPicker, Android SAF) converge: the act of picking a resource *is* the grant; yes/no dialogs are the anti-pattern. → thesis F8; System Chrome pickers in [[shell-and-sessions]].
- Norm Hardy, "The Confused Deputy" — SIGOPS OSR, 1988-10
- Miller/Yee/Shapiro, "Capability Myths Demolished" — SRL2003-02, 2003
- Sandstorm powerbox docs — docs.sandstorm.io ("never a yes/no security dialog"), current
- iOS `PHPickerViewController` out-of-process picker — WWDC20, 2020-06

**4. Prompt fatigue is quantified, not folklore.** Hundreds of millions of real prompts show grants are mostly unwanted noise; over-prompting destroyed UAC; the platform itself now quiets and auto-revokes. Budget modals for the few irreversible checkpoints. → thesis F3, honesty doctrine #3; [[shell-and-sessions]].
- Bilogrevic et al., "Shhh… be quiet!" — USENIX Security 2021 (800M+ prompts; ~10% desktop notification grant rate)
- Wijesekera et al., "Android Permissions Remystified" — USENIX Security 2015 (80%+ wanted to block ≥1 request)
- CHI 2024 prompt-sentiment study — dl.acm.org/10.1145/3613904.3642252 (25,706 decisions)
- Chrome automatic notification-permission revocation — blog.chromium.org, 2025-10

**5. Generations stop at mutable data.** Every atomic-update system (OSTree, Android A/B, NixOS, ChromeOS) rolls back code, never state; forward migrations are the one-way door, and ChromeOS chose "rollback = wipe." The migration boundary is the product problem. → thesis rejected-assumptions table; [[boot-and-profiles]], [[persistence-and-sync]].
- OSTree deployment model (`/var` never touched; `/etc` 3-way merge) — ostreedev docs, current
- Android A/B + `markBootSuccessful`, userdata never duplicated — source.android.com/docs/core/ota/ab, current
- NixOS `system.stateVersion` semantics — Mayflower blog, 2021-01-28
- ChromeOS enterprise rollback powerwashes — support.google.com/chrome/a/answer/12569990, current

**6. The update channel is the attack surface.** Essentially every store/registry incident weaponized *updates after trust was earned*, not installs; mutable names are standing grants to whoever controls them tomorrow; cooldowns work because detection is faster than patching victims. → thesis F4 (zero-power install, cooldowns from chain admission, disable-until-approved); [[packages-and-updates]].
- Cyberhaven Chrome-extension compromise — 2024-12-24 (auto-update pushed malware to ~2.6M users in hours)
- Shai-Hulud npm worm — CISA alert 2025-09-23; 2.0 in 2025-11 (ambient publish credentials ⇒ exponential spread)
- polyfill.io domain sale — sansec.io, 2024-06-25 (mutable-name dependency = future code-exec grant)
- pnpm 11 `minimumReleaseAge` default 24h — pnpm.io, 2025–26 (first default-on cooldown; most attack windows <1 week)

**7. A signed artifact is a live grenade.** Bitcoin treats partially-signed transactions as sensitive air-gapped material; Safe's public queue is front-runnable; the 7702 wave showed programmable signing moves the whole attack surface into the prompt. Settles draft-first (F7) and bundle custody rules. → thesis F6, F7; [[wallet-and-actions]], [[persistence-and-sync]].
- BIP-174 PSBT roles — bips.dev/174 (Creator/Signer/Finalizer separation), 2017→
- Safe transaction service public queue / front-running — docs.safe.global + ecosystem analyses, current
- Wintermute "CrimeEnjoyor": >97% of early 7702 delegations were sweepers — CoinDesk, 2025-06-02
- Permit2 signature phishing: ~$494M / 332k victims in 2024 — ScamSniffer annual report

**8. Uniformity beats configurability (on the wire).** Tor's design doc and the RPC-timing result agree: per-user observable variation fragments anonymity, and polling cadence alone deanonymizes through encryption. The ecosystem's proven fix is bulk local snapshots over per-item lookups (OCSP→CRLite). → thesis F5 traffic discipline; [[network-privacy]].
- Tor Browser design doc — torproject.org ("uniformity beats configurability"; randomization rejected)
- "Time Tells All" — arXiv 2508.21440, 2025-08 (>95% IP↔address linkage from passive poll-timing)
- Let's Encrypt OCSP end-of-life — 2024-12-05 announcement → 2025-08-06 shutdown (read-path privacy leak killed)
- Firefox CRLite / Chrome CRLSets — locally-checked bulk revocation, current

**9. Display-vs-signed-bytes divergence is the dominant loss mode.** $2B+ walked out through UIs that showed one thing while the wallet signed another; wallets cannot expand a Merkle root, so batch legibility must live where the leaves live — the Shell — with a hardware-verifiable digest cross-check. → thesis F6, T4; [[wallet-and-actions]], [[shell-and-sessions]].
- Radiant Capital post-mortem — 2024-10-16 ($50M; simulation reviewed, Ledgers blind-signed)
- Bybit analyses — NCC/Certora/Cyfrin, 2025-02+ (multisig ≠ control when all signers trust one spoofable display)
- ERC-7920 wallet-display MUSTs + ≤10-message recommendation — eips.ethereum.org/EIPS/eip-7920, Draft 2025-03-20
- Address-poisoning study — USENIX/arXiv 2501.16681, 2025 ($83.8M; pure truncation failure)

**10. Sandboxes hold; consent UX breaks.** The production SES record (Snaps, Agoric, LavaMoat-stopped-Ledger) shows in-language cages survive contact; what fails in audits is origin display, consent flow, and prompt integrity. The prompt surface is the attack surface — hence System Chrome as the most conserved component. → thesis F3; [[shell-and-sessions]].
- Consensys Diligence meta-analysis of 40 Snap audits — metamask.io, 2023-12-12 (findings: consent UX + origin display, zero escapes)
- LavaMoat vs the Ledger connect-kit attack — metamask.io, 2023-12
- lavapack `with()` sandbox bypass — osec.io, 2024-06-10 (SES is hardening, not the boundary)
- Schechter et al., "The Emperor's New Security Indicators" — IEEE S&P 2007 (58/60 ignored the missing trust image)

**11. Architecture ≠ product; the steward can die.** Fuchsia's capability framework survived intact while the product ambition collapsed to three smart displays; Urbit reached "1990s Usenet parity" in 15 years and its foundation nearly went insolvent; Solid was handed off. Combine only proven pieces, ship a retention app, and hedge against our own mortality (pinned generations + Rescue Shell). → thesis §The thesis (2), F3, F11.
- Fuchsia contraction: 16% layoffs 2023-01; Chrome port ceased 2024-01 — Wikipedia/9to5Google; F30 still releasing 2026-04
- Urbit foundation crisis — CoinDesk 2024-08-21; governance wars through 2025-07
- Solid stewardship → Open Data Institute — theodi.org, 2024-10
- Firefox OS post-mortems — end announced 2015-12; carrier-incentive autopsy, retrospectives current

**12. Key-as-identity has no rotation story.** IWA derives app identity (and storage keying) from the signing key with rotation "planned… last resort"; Android needed APK v3 lineage retrofitted; Guix anchors trust in in-history authorization files instead. App identity must be (author identity, app-root record), never a raw key or vanity name. → thesis F4; [[packages-and-updates]].
- IWA signing-key management — chromeos.dev, 2024-10 (no rotation shipped)
- APK Signature Scheme v3 proof-of-rotation lineage — source.android.com, current
- Guix "Securing updates" (.guix-authorizations, channel introductions, fast-forward rule) — guix.gnu.org blog, 2020-07-01

## Per-lane summaries and top sources

### closures-generations
Nix/Guix/OSTree/Android/systemd all converge on the same skeleton — one artifact names the bootable closure; follow-vs-pin is a two-layer split; generations are append-only with health-gated activation; GC and rollback share one budget — and none of them combine output-addressing, author-signed channels, per-viewer trust, and evictable-browser reality. Sharpest traps: the flakes half-frozen-format ecosystem fork, `nix-store --export` dropping signatures, and browser eviction as an adversary GC. Feeds thesis closure-manifest/generation primitives and [[boot-and-profiles]].

| Source | Date | Load-bearing for |
|---|---|---|
| Nix 2.28 manual, `nix3-flake` (original/locked, follows) | 2025 | closure manifest lock-graph shape |
| Guix blog "Securing updates" | 2020-07-01 | introductions, fast-forward anti-downgrade |
| source.android.com A/B + Virtual A/B | current | health gate, keep-2, userdata wall |
| Shopify: import-map integrity ships (Chrome 127/Safari 18) | 2024 | browser-native module closure enforcement |
| MDN storage quotas & eviction | current | eviction as the GC we don't control |

### fuchsia-components
Component Framework v2 is the most complete deployed answer to "describe software declaratively, grant nothing, route everything": CML tri-partition manifests, resolvers/runners as capabilities, environments splitting infrastructure from authority, content-addressed blobs under TUF. The product collapsed; the architecture never broke — and Android's 15-year intent-security retrofit is the complete catalog of open-world routing failure. Feeds thesis F8 (manifests, resolvers, runners, collections) and the intent/chooser design.

| Source | Date | Load-bearing for |
|---|---|---|
| fuchsia.dev CF v2 docs (manifests, capabilities, resolvers, runners, environments) | current | manifest tri-partition; resolver returns (decl, content root) |
| RFC-0189 window management (element role deprecated) | 2022-09-20 | shell APIs churn; kernel contract must not |
| RFC-0212 package sets | 2023-03-07 | base/universe executability policy |
| developer.android.com implicit-intent-hijacking + App Links | current | "intent filters are not a security boundary" |
| Microsoft: TikTok CVE-2022-28799 | 2022-08-31 | deeplink + in-app bridge = 1-click ATO at 1.5B installs |

### capability-os
The ocap lineage is the only security tradition whose UX story *removes* prompts. Designation-is-authorization, caretakers/membranes for revocation, petnames over Zooko's triangle, Genode's live routing-table-as-data — all shipped somewhere. The graveyard (Capsicum stall, Polaris, CloudABI) died of retrofit cost, not the model; EFS Ring 3 is greenfield and dodges that. Feeds thesis F8, capability-table-as-data, petname doctrine.

| Source | Date | Load-bearing for |
|---|---|---|
| Miller/Yee/Shapiro, "Capability Myths Demolished" | 2003 | revocation = caretaker pattern; confinement is real |
| Genode Foundations 25.05 + Sculpt 26.04 | 2026-04-30 | routing table as live, user-inspectable data |
| Sandstorm powerbox + `save()`/`restore()` recheck | current | persisted grants re-evaluate policy on restore |
| Spritely petname papers | 2022-10 | phishing as a naming failure; petnames over lenses |
| CloudABI deprecation notice | 2020-10 | pure-capability ABI needs a native platform |

### web-isolation
No single primitive cages hostile JS; the deployed pattern is three independent layers (SES, browser boundary, CSP/Permissions-Policy). The decisive enforcement fact: a Worker's egress surface is a closed CSP-governable set, while DOM contexts keep three CSP-proof leaks. Safari is the compatibility floor (no `credentialless`, no `webrtc` directive). Feeds thesis F1/F2 wholesale.

| Source | Date | Load-bearing for |
|---|---|---|
| W3C CSP3 + MDN `connect-src` | current | what `'none'` actually denies |
| navigate-to removed from CSP | 2022-09 | self-navigation exfil unfixable in DOM contexts |
| w3c/webrtc-extensions #77 + Chromium 40188662 | current | WebRTC ≠ connect-src; absent in Workers |
| wpt #35641 blob-worker CSP inheritance | 2017→ | serverless CSP enforcement linchpin |
| osec.io lavapack `with()` escape | 2024-06-10 | SES = hardening, not the boundary |

### local-first
EFS is Figma/Linear-shaped (authoritative venue, per-field LWW), not CRDT-shaped. The transferable disciplines: durable journal as canonical pending truth, rebase-over-checkpoint (never advance past a slot with pending writes), single elected writer, honest pending-vs-confirmed labeling, and PSBT-grade custody of signed artifacts. Vendor sync engines die; own the journal. Feeds thesis journal/outbox/pending-ladder; [[persistence-and-sync]].

| Source | Date | Load-bearing for |
|---|---|---|
| PowerSync client architecture | current | checkpoint rule: never regress your own writes |
| reverse-linear-sync-engine (CTO-endorsed) | 2024–25 | durable transaction queue, `lastSyncId` total order |
| ElectricSQL write-patterns guide | 2024-11 | ephemeral optimistic state lies; rewrite lesson |
| BIP-174 PSBT | 2017→ | signed-but-unsubmitted as sensitive material |
| IETF RUFH draft-12 | 2026-07-06 | offset-probe-then-append resumable flush |

### wallet-standards
The EFS envelope pattern is now a drafted standard (ERC-7920 composite EIP-712; ERC-7964 for chain-free replay) — EFS rides a standards track rather than inventing one, but wallets cannot expand a Merkle root, so legibility is the Shell's job with an ERC-8213-style digest cross-check. P-256 verification is now cheap on L1 (EIP-7951, Fusaka). The 7702 drainer wave is the standing warning. Feeds thesis F6; [[wallet-and-actions]].

| Source | Date | Load-bearing for |
|---|---|---|
| ERC-7920 Composite EIP-712 | Draft 2025-03-20 | the envelope, standardized; ≤10-message display limit |
| ERC-7964 Crosschain EIP-712 | Draft 2025-06-05 | chain-free replay legitimized; nonce/dedup burden named |
| EIP-7951 P-256 precompile live on L1 (Fusaka) | 2025-12-03 | passkey signers cheap everywhere; pressure on 0x02 gating |
| EF Clear Signing / ERC-7730 registry | 2026-05-12 | publish descriptors for the envelope schema |
| Wintermute 7702 sweeper analysis | 2025-06-02 | programmable signing moves the attack to the prompt |

### package-trust
TUF is the reference threat model (roles, thresholds, freshness, anti-rollback) but deploying it raw stalls (PEP 458, ~6 years unshipped); the mapping onto EFS records — targets→release records, snapshot→LIST head, timestamp→freshness beacon, root→lens entry — keeps the threat model and discards the ops burden. Transparency without monitors protected no one; chain admission gives EFS the log for free but not the monitoring. Feeds thesis F4; [[packages-and-updates]].

| Source | Date | Load-bearing for |
|---|---|---|
| TUF spec v1.0.34 | 2026-01-22 | attack taxonomy: rollback/freeze/mix-and-match |
| PEP 458 accepted-but-unshipped record | 2020→2026 | elegant metadata dies on operational cost |
| Chrome permission-warning diff / disable-until-approved | current | the shipped update-capability-diff semantic |
| Cyberhaven extension compromise | 2024-12-24 | review-once + silent auto-update = betrayal |
| Rekor v2 GA (tiled logs, scope cuts) | 2025-10-10 | even flagship transparency logs shrink to stay operable |

### network-privacy
Split integrity (solved: Helios + proofs + CIDs), identity privacy (partial: OHTTP is boring shipped infra, but no OHTTP-fronted RPC/IPFS gateway exists — an EFS assembly), and interest privacy (unsolved; PIR is research). Timing beats encryption: poll one venue head, distribute hot indexes as bulk snapshots, normalize request shapes. Feeds thesis F5; [[network-privacy]].

| Source | Date | Load-bearing for |
|---|---|---|
| RFC 9458 Oblivious HTTP | 2024-01 | two-hop who/what split, deployed at scale |
| "Time Tells All" arXiv 2508.21440 | 2025-08 | poll loops deanonymize >95%; one-head-per-venue rule |
| Helios v0.11.1 (WASM, eth_getProof; no getLogs verify) | 2026-02 | safe-but-observant default substrate |
| Let's Encrypt OCSP shutdown | 2025-08-06 | replace per-item lookups with local bulk snapshots |
| Chrome 142 Local Network Access permission | 2025-10 | localhost/self-hosted onboarding must handle the prompt |

### i18n-a11y
Engine `Intl` is offline-by-construction (a gift) but non-deterministic across engines (a collision with signed receipts) — hence two-track rendering with pinned ICU4X-WASM + CLDR packs for canonical output. Bidi is a security surface; locale is a ~50–60-bit fingerprint; EditContext/VirtualKeyboard are Chromium-only mirages; Shadow DOM silently breaks cross-root ARIA. Feeds thesis F10; [[locale-and-accessibility]].

| Source | Date | Load-bearing for |
|---|---|---|
| ICU4X 2.0 (data slicing: 5MB→~8KB) | 2025-05-29 | deterministic canonical formatter, content-addressed packs |
| Unicode: MF2 spec-stable in CLDR 47 | 2025-03-13 | message syntax to adopt (via library; `Intl.MessageFormat` unshipped) |
| W3C font-i18n-privacy note | 2024-09 | ship own fonts; `local()` is a fingerprint/i18n trap |
| BiDi Swap / Trojan Source reporting | 2021→2025 | `<efs-identifier>` LTR-isolation mandate |
| WCAG 2.2 (ISO/IEC 40500:2025) + WebAIM Million | 2023-10-05 / 2026 | the a11y floor; ARIA misuse evidence |

### agent-native
The protocol layer consolidated (MCP→Linux Foundation, A2A, WebMCP-draft) while both major vendors admitted prompt injection is permanently unsolved — so the boundary must be structural: CaMeL-shaped plan-freezing, lethal-trifecta denial, budgets as primitives (every deployed system retrofitted them after blowouts). llms.txt is dead as anything load-bearing. Feeds thesis F9; [[agent-native]].

| Source | Date | Load-bearing for |
|---|---|---|
| CaMeL — arXiv 2503.18813 | 2025-03 (rev 06) | plan-then-execute with interpreter-enforced provenance |
| Willison, lethal trifecta | 2025-06-16 | static Kernel invariant, not model vibes |
| Anthropic injection-defense research (~1% adaptive ASR) | 2025-11-24 | attenuation ≠ boundary; plan for compromise |
| MCP 2026-07-28 RC (stateless core, `.well-known` metadata) | RC 2026-05-21 | derived-bridge fit for a static offline client |
| AP2 mandates (open/closed) | 2025-09; v0.2 2026-04 | budget vocabulary for agent sessions |

### webos-precedents
Every dead web OS died of distribution owned by misaligned partners, proprietary packaging vs the open web, or platform-first novelty with no retention app. The living relatives prove the pieces: Snaps (SES in production; failures are consent UX), IWA (packaging semantics worth copying, enterprise-gated), ATProto (schema-first works; the expensive layer recentralizes). Feeds thesis §The thesis (2) and the "retention app first" posture.

| Source | Date | Load-bearing for |
|---|---|---|
| Snaps execution-environment docs + 40-audit meta-analysis | 2023-12-12 | the production SES platform and its real failure modes |
| blog.ipfs.tech "State of Dapps on IPFS" | 2024 | nobody shipped verified reads; the design docs exist |
| Chrome Apps deprecation ("~1% of users") | 2016-08-19 | proprietary packaged formats die |
| Urbit crisis timeline | 2024-08→2025-07 | steward mortality is a user-facing risk |
| Bluesky 2025 protocol roadmap + relay economics | 2025-03 | make the sovereign unit cheap; defaults are the product |

### secure-ui
The line of death is dead; in-page trusted pixels are unwinnable by visual design (BitB, fullscreen abuse, cursorjacking, SiteKey). What works: move decisions off the spoofable surface (out-of-process pickers, hardware clear-signing, passkeys), negative indicators, interaction gating, opinionated defaults. $2B+ of blind-signing losses make structured decoding a protocol-level requirement. Feeds thesis F3 (T1–T12); [[shell-and-sessions]], [[wallet-and-actions]].

| Source | Date | Load-bearing for |
|---|---|---|
| Stark, "The death of the line of death" | 2022-12-18 | negative indicators; unphishable credentials |
| mr.d0x Browser-in-the-Browser | 2022-03 | in-page fake chrome is trivial and unstoppable |
| NCC/Certora Bybit analyses | 2025 | display-vs-signed divergence at 30× scale |
| Felt et al., SSL warning redesign — CHI 2015 | 2015 | adherence via choice architecture (31→58%) |
| Chromium "Security considerations for browser UI" | living | activation delays, no default-accept, occlusion rules |

### storage-durability
The browser gives a large but revocable disk under three deletion authorities, with no eviction notification. `persist()` is weaker than its name (Chrome silently denies; Safari grants then ITP wipes anyway — bug open since 2020). Hence protection tiers, single-writer via Web Locks, sentinel-based loss detection wired into read grades, and keys that survive origin wipes (wallet-derived, passkey-PRF). Feeds thesis F2, honesty doctrine #2; [[persistence-and-sync]].

| Source | Date | Load-bearing for |
|---|---|---|
| MDN storage quotas & eviction criteria | current | origin-atomic LRU eviction; quota math |
| WebKit bug 209563 (persist() vs ITP, still NEW) | 2020→2025-07 | Safari-in-tab = 7-day lease, honestly labeled |
| Notion SQLite-WASM post-mortem | 2024-07-10 | single-writer topology; multi-tab corruption is real |
| PowerSync "SQLite persistence on the web" | 2026-05 | OPFSCoopSyncVFS proven >1GB; engine choices |
| Chrome IDB durability → relaxed default | 2023-11-03 | "committed" ≠ on disk; journal needs strict |

### boot-deeplinks
Fragment payloads never traverse servers but are readable by page JS and stored by chat platforms; unfurl bots fetch pasted links in seconds. Production fragment-key systems (Excalidraw, CryptPad) work; Firefox Send died of abuse economics. Budgets are physical: ~300 chars QR, 2,000 chars chat, ≤2 serialized RTTs and ~0.6MiB JS for a 3s P75 cold boot. Import maps are the browser-native generation manifest. Feeds thesis F12; [[boot-and-profiles]].

| Source | Date | Load-bearing for |
|---|---|---|
| W3C TAG capability-URL practices | 2014-10-30 | leak vectors + lifecycle checklist |
| Mysk & Bakry, "Link Previews" | 2020-10-25 | unfurl-bot architectures; what platforms store |
| Russell, "Performance Inequality Gap 2026" | 2025-11-24 | P75 device/budget math for cold boot |
| SW Static Routing API (Chrome 123) | 2024 | content-addressed assets skip SW wake-up |
| IPFS service-worker gateway / inbrowser.link | 2024-11-25 | the one shipped SW-verified-boot comparable |

## Exists today / emerging / EFS invention (consolidated)

| Item | Status | As of | Source (lane) | Consumed by |
|---|---|---|---|---|
| Import-map `integrity` (per-module SRI) | shipped Chrome 127 / Safari 18 | 2024 | closures; web-isolation | [[boot-and-profiles]], F1/F4 |
| blob-Worker CSP inheritance | shipped (all engines) | ~2017, verified 2026-07 | web-isolation | F1 cage |
| SES/Hardened JS (`ses` shim) | production (Snaps, Agoric) | 2023→ | web-isolation; capability-os | F1 layer 1 |
| Trusted Types | Baseline (Firefox lands 2026-02) | 2026 | web-isolation | Shell renderer |
| Web Locks leader election | shipped all engines | 2022→ | local-first; storage | [[persistence-and-sync]] |
| OPFS + wa-sqlite CoopSyncVFS >1GB | shipped, proven | 2026-05 | storage | journal substrate |
| Passkey PRF key derivation | broadly shipped | 2025–26 | wallet; storage | F2 key wrapping, Tier D |
| EIP-7951 P-256 precompile (L1) | shipped (Fusaka) | 2025-12-03 | wallet | custody ladder; pressure report |
| EIP-7702 / EIP-5792 / EIP-6963 | Final, deployed | 2025 | wallet | submission rails, wallet discovery |
| OHTTP (RFC 9458) + Privacy Pass (9576-78) | shipped at scale | 2024 | network-privacy | endpoint privacy classes |
| Helios light client (WASM) | shipped v0.11.1 | 2026-02 | network-privacy | verified-read default |
| Chrome disable-until-approved permission diffs | shipped | current | package-trust | F4 update semantics |
| Cooldown defaults (pnpm 11, 24h) | shipped | 2025–26 | package-trust | F4 cooldowns |
| A/B health-gated activation | shipped (Android/ChromeOS) | current | closures | generations, Rescue Shell |
| CML manifest tri-partition; resolvers/runners | shipped (Fuchsia) | current | fuchsia | F8 manifest/runner model |
| `Intl` offline stack + Segmenter | Baseline | 2024-04 | i18n | display track |
| ICU4X 2.0 sliced data blobs | shipped | 2025-05-29 | i18n | canonical track |
| MCP (stable spec, LF governance) | shipped | 2025-12 | agent-native | derived agent bridges |
| AP2 mandates | shipped v0.2 | 2026-04 | agent-native | budget vocabulary |
| Compression Streams | Baseline | 2023-05 | boot-deeplinks | F12 link grammar |
| ERC-7920 / ERC-7964 | Draft ERCs | 2025-03 / 2025-06 | wallet | envelope alignment (watch) |
| ERC-7730 v2 + EF clear-signing registry | emerging (EF launch) | 2026-05-12 | wallet; secure-ui | ceremony descriptors |
| WAICT / WEBCAT | emerging drafts/beta | 2026-05 | package-trust | F11 standards path |
| Isolated Web Apps | enterprise-only | 2026-02 | web-isolation; webos | F11 hardened lane (format-convertible) |
| MCP 2026-07-28 (stateless, `.well-known`) | RC | 2026-05-21 | agent-native | agent bridge freeze timing |
| WebMCP | CG draft, zero consumption | 2026-06-24 | agent-native | generated exhaust only |
| MF2 syntax (stable) / `Intl.MessageFormat` (Stage ~2.7) | split status | 2025-03 | i18n | string layer via library |
| ShadowRealm (2.7) / Compartments (Stage 1) | emerging TC39 | 2025–26 | web-isolation | no hard dependency |
| Storage Buckets | Chromium-only | 2024-02 | storage | Tier-B enhancement only |
| SharedWorker on Android (Chrome 148) | just shipped | ~2026-05 | storage | don't floor on it yet |
| RUFH resumable uploads | IETF draft-12 | 2026-07-06 | local-first | flush engine shape |
| Closure manifest as signed EFS record; lens-resolved channels; composite generation grades | **EFS invention** | — | closures | [[boot-and-profiles]], F4 |
| Zero-power install; k-of-n curator quorum; chain-admission cooldowns | **EFS invention** | — | package-trust | [[packages-and-updates]] |
| Read-grade→executability policy; grade-labeled code loading | **EFS invention** | — | fuchsia; closures | [[packages-and-updates]]; pressure report |
| OHTTP-fronted RPC/IPFS gateway assembly | **EFS invention** (assembly of shipped parts) | — | network-privacy | [[network-privacy]] |
| Fragment-carried offline-attenuable capability tokens | **EFS invention** (biscuit-shaped) | — | boot-deeplinks | F12, [[boot-and-profiles]] |
| `LocaleHandle` + locale entropy budget; `<efs-identifier>` | **EFS invention** | — | i18n; secure-ui | [[locale-and-accessibility]] |
| Signed replayable action receipts; lens-mediated tool catalogs; grades-as-taint | **EFS invention** | — | agent-native | [[agent-native]] |
| Kernel-owned unspoofable surface inside one tab | **EFS invention** (G1 residual risk) | — | secure-ui | [[shell-and-sessions]]; render docs (in flight) |
| Tiered protection model + wallet-derived storage keys | **EFS invention** | — | storage | [[persistence-and-sync]] |
| Lenses as the app store (per-viewer curation) | **EFS invention** | — | webos; package-trust | [[packages-and-updates]] |

## Watch list — re-check before implementation freezes

- **MF2 / `Intl.MessageFormat`** — syntax stable (CLDR 47, 2025-03-13); native API stuck ~Stage 2.7. Re-check before the OS string layer freezes; swap library→native must stay cheap.
- **WAICT / WEBCAT** — browser-enforced web-app integrity drafts (RWC 2026; WEBCAT beta 2026-05). Re-check at F11 packaging freeze; alignment beats invention if enforcement lands.
- **MCP 2026-07-28 release** — RC locked 2026-05-21; final expected ~3 weeks after this corpus date. Confirm stateless core + `.well-known` metadata before the agent-bridge doc freezes.
- **ERC-7920 / ERC-7964 progress** — both Draft. Re-check leaf-construction details at envelope-alignment time; divergences must be documented as a named profile.
- **TC39 Compartments / ShadowRealm** — Stage 1 / 2.7. Re-check yearly; a native compartment would shrink the `ses` shim but must never be a dependency.
- **Storage Buckets cross-browser** — Chromium-only since 2024-02; Firefox positive, WebKit silent. Re-check before Tier-B design assumes independent eviction anywhere but Chromium.
- **IWA beyond enterprise** — allowlisted/managed as of Chrome 143. Re-check at each Chrome release; the packaging stays `.swbn`-convertible either way.
- **Chrome 142 Local Network Access** — shipped 2025-10; behavior may tighten. Re-test the self-hosted-endpoint onboarding flow against current stable.
- **P-256 wallet ecosystem post-EIP-7951** — precompile live 2025-12-03; watch wallet/AA adoption and any protocol movement on un-reserving 0x02 (pressure-report item).
- **Helios verifiable-API companion & `eth_getLogs` verification** — in development as of 2026-02; would widen the provable read ABI (interacts with the log-shaped-reads pressure item). Also sweep the table rows above marked "don't floor on it yet" (SharedWorker-on-Android; WebKit persist()-vs-ITP bug 209563).

## Methodology

- **Shape:** 14 parallel research lanes, one agent each, all lane digests dated 2026-07-07; this consolidation read all 14 in full. Kickoff requirement: "a research digest with primary-source links and dates" — this document is that deliverable; the lane files are its evidence base.
- **Verification discipline:** primary sources (specs, vendor docs, incident post-mortems, peer-reviewed papers) preferred; every load-bearing claim carries a date; secondary/AI-generated numbers were rejected where they contradicted measurable primaries (e.g., the wallet lane kept BundleBear's on-chain $13M paymaster floor over content-farm "$180M" claims). "Shipped / emerging / EFS invention" separation enforced in every lane.
- **The boot-deeplinks retry:** the lane failed its first run and was re-run; its digest landed 2026-07-07 17:07 — *after* the [[web-os-thesis]] draft, which still marks F12 "awaiting the boot-deeplinks lane retry." The lane is now complete and is incorporated here; the thesis wording is stale (see Open questions).
- **Known blind spots:** (1) single-day snapshot — fast-moving rows (MCP release, ERC drafts, Chrome release behavior) age in weeks, hence the watch list; (2) no hands-on verification — enforcement claims (blob-worker CSP inheritance per engine, OPFS behavior under quota pressure, LNA prompt flows) are documentation-grounded and need prototype confirmation before freezes; (3) lane digests are single-agent syntheses; cross-review happened only via this consolidation and the thesis — contradictions found are logged below, others may remain; (4) the corpus is browser-platform-heavy and thin on mobile-native wrappers by design (thesis treats iOS as a degraded-but-honest tier).

## Open questions

- [x] **Thesis F12 is stale:** the boot-deeplinks retry has landed. Amend F12 against its findings (three link-size tiers, kernel-eats-fragment rule, lens-relative link portability, single-origin economics, `web3://` safelist gap) or record "no change." — resolved by [[web-os-thesis]] Amendment 12 (2026-07-07); the lane landed and [[boot-and-profiles]] governs.
- [ ] **Intra-corpus conflict — closure identity anchor:** closures-generations recommends binding closures to "smart account / KEL reservation" identity, while thesis F6 rules the B′ smart-account path cannot author v2 envelopes and replaces it with personas. [[boot-and-profiles]] / [[packages-and-updates]] must name one identity anchor for closure/channel signing. [open]
- [ ] **Wallet-lane vs protocol — ERC-1271/6492:** the wallet lane calls signer-polymorphic verification "mandatory, not optional"; the protocol rules "no ERC-1271, ever." The thesis resolves via personas + EOA-only envelopes; confirm the pressure report captures what is *lost* (passkey-native authorship, counterfactual accounts) rather than treating the tension as closed. [open]
- [ ] **Channel monitoring — split ruled ([[web-os-thesis]] Amendment 13):** the client-side checks (equivocation, backward-head, deny-fact-flood on the channels this user subscribes to) ship at launch as courier/sync-service duties ([[system-surfaces]] #19); the **global observatory** (cross-user monitoring, mass-publish detection, ecosystem alerting) remains an uncommissioned workstream — commission it or explicitly accept the CT-gossip fate. [open]
- [ ] **Digest lifecycle:** frozen 2026-07-07 snapshot with per-freeze watch-list sweeps, or periodically refreshed? Recommend snapshot + sweeps; a silently-refreshed reference doc breaks citation stability. [reasoned]

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Depends-on chain verified ([[web-os-thesis]] amendments reconciled, lane files unchanged since 2026-07-07)
- [ ] No AGENT-Q comments remain
- [ ] At least one round of `#status/review` with another agent or human comment
