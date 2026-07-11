# Client OS pressure report — what official client v2 asks of EFS v2

**Status:** draft
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[web-os-thesis]] (and the full `Designs/clientv2/` set), [[codex-envelope]], [[codex-kinds]], [[codex-kernel]], [[read-lens-spec]], [[identity]], [[ops-doctrine]], [[large-file-uploads]], [[freeze-gates]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client

> **2026-07-11 identity-pressure resolution.** [[kel]] supersedes this report's P4 recommendation. P-256/WebAuthn cannot activate independently while `recovered == author` remains; device/app authors become scoped KEL actors under one stable principal; KEL grants and `AuthReceipt` are protocol state; `act` is provenance; privacy personas remain separate principals without a public master roster. Treat the older alternatives below as the problem record, not current guidance.

## What this is

The client v2 design round ([[web-os-thesis]] + thirteen model docs + the 14-lane research corpus in `Reviews/2026-07-07-clientv2-corpus/`) was run as a pressure test against the EFS v2 design set, per the handoff's feedback protocol. This note consolidates every place the client OS found the protocol design missing, awkward, or undecided. Each item: problem → mismatch → paths → defer-risk, compressed. Nothing here blocks reading the client set; several items **do** touch the one-final-freeze window and are flagged.

**Priority legend:**
- **[ETCHED-WINDOW]** — touches surface bound by the freeze pledge ([[freeze-gates]] §C); decide or reserve before the ceremony or it needs a second freeze.
- **[DURABLE]** — belongs in [[read-lens-spec]] or SDK specs; iterable, but should land before third-party clients fork.
- **[DOCTRINE]** — [[ops-doctrine]] / [[apps-cookbook]] additions.
- **[WORKSTREAM]** — new design work with no current home.

---

## P1. Read-ABI: verifiability, admission evidence, admission time — [ETCHED-WINDOW]

**Problem.** Three client needs press on the frozen read surface:
1. **Every read grade — including PROVEN-ABSENT — must be computable from state-backed reads provable via `eth_getProof`.** Helios-class light clients cannot verify log scans (2026); any grade that only derives from event enumeration is unverifiable *and* maximally observable. The client's "verified reads over untrusted endpoints" flagship depends on this.
2. **Batched per-claimId admission checks + bulk grade resolution.** Sync-center honesty ("which of this envelope's N records are admitted at venue V") needs a cheap batched read, or clients either lie or hammer RPCs per record. **Same shape, surfaced by the surface-mode spike:** a 2,000-row Files list needs the Kernel to resolve *N slots' grades in one call* (the honesty components — grade badge, `<efs-identifier>`, pending chip — must resolve through the Kernel so apps can't forge them; per-row round-trips don't scale). A **bulk grade-resolution read** belongs in the same freeze-window ABI decision.
3. **Admission-event time is not readable — and it is the trustworthy clock EFS actually has.** Update cooldowns, comment/feed ordering, the predate defense (P13), and cross-chain temporal honesty all want it. The author's TID is back-datable without bound ([[codex-envelope]]); the *block* the record landed in is a consensus-set timestamp no author or sequencer can forge — but `getSlot` exposes `seq`/`expiresAt`, not `admittedAt`. **Store `admittedAt[claimId]` = block.timestamp in kernel state** so it is `eth_getProof`-provable (deriving it from events fails Helios and the trustless story — item 1).
   - **Cross-chain admission trail (James's proposal, 2026-07-07; red-team-refined).** On replication, chain Y records *its own* `admittedAt` too, so a record accumulates a per-chain trail — "admitted on X at T_x, on Y at T_y," each entry trustworthy *on its own chain*. This is the honest cross-chain "when did a chain validate this," and the earliest trusted admission is an **"existed-by T" bound** (never a certificate of *genuine age*). **The refinement (don't over-claim):** the bound is only as strong as the earliest chain the reader **independently validates as live-at-that-time** — a forger-controlled or dead (long-range-forgeable) chain can mint a *false early* `admittedAt`, so the trail must be **restricted to weak-subjectively-trusted chains**, not "a forger has no early admission anywhere." And `admittedAt`-in-state is a **HARD dependency for the predate defense** — the enumeration spine gives admission *order* not *time*, and checkpoint age is author-TID; without state-resident `admittedAt`, P13's D2 has *no trustless implementation*. This is the single strongest freeze-window argument for path (a).
   - **Portability ceiling — say it plainly.** This is **not** a single global trustless timestamp. A contract cannot mint a *portable self-certifying signature* (the ERC-1271 reason EFS is native-envelope in the first place) — a chain's `admittedAt` is *state*, verifiable only by verifying that chain: a **light client** (fine while the chain lives; a dead PoS chain is long-range-forgeable) or a **trusted checkpoint** ("admitted before checkpoint N which I trust") or the reserved **witness/checkpoint layer** (Architecture E — portable EOA-signed attestation, but adds the witnesses as trust; post-freeze). So the deliverable is *per-chain-trustworthy, venue-labeled admission time*, **never** a global clock — consistent with the substrate ruling that portable currency isn't cheaply purchasable.

**Mismatch.** [[codex-kernel]] freezes the read ABI (G5) without these; the enumeration spine is state-resident (good) but per-claim admission-batching and admission-time are unspecified; discovery's indexer-lane fallback is explicitly not trustless.

**Paths.** (a) Extend the frozen ABI now (`isAdmitted(claimId[]) → bool[]`, **`admittedAt[claimId]` word per claim** in state — real Etched cost, measure it; enables the cross-chain trail above); (b) keep the kernel minimal and bless a *view-contract* recipe — but views cannot mint state the kernel didn't store, so admission time specifically is store-it-or-lose-it; (c) event-derived indexer lane for admission time, honestly labeled non-trustless (breaks the cooldown-anchor + predate trust story).

**Defer-risk.** Post-freeze this is unfixable at the trust level the client claims; auto-update cooldowns silently degrade to gameable or indexer-trusting.

- [ ] Decide (a)/(b)/(c) per item; fold chosen reads into the [[freeze-gates]] A2 gas bundle.

## P2. Reserved-key rows to mint before the table freezes — [ETCHED-WINDOW]

**Problem.** The reserved-key table ([[codex-kinds]] P9, 13 rows) is Etched; the client needs record shapes that want uniform, vectored, lens-legible semantics. Candidates surfaced independently by multiple docs:

| Candidate row | Client need | Cited by |
|---|---|---|
| `lang` (BCP-47) + `dir` (ltr/rtl/auto) | screen-reader lang tagging, font-pack selection, segmentation, reproducible rendering of signed content | locale doc G1 (top item) |
| persona-link relation | persona ↔ primary stitching, both-LIVE pair rule, compromise-revocation semantics that cannot fork per client | wallet doc, threat doc |
| handler binding ("type author endorses handler app") | open-with routing without squattable first-attester claims (assetlinks analog; Android's 2014–2025 retreat from declaration-wins) | kernel doc, fuchsia lane |
| freshness beacon (expiring head PIN convention) | TUF-timestamp analog for update channels; channel-staleness rendering that doesn't fork per channel | packages doc, system-surfaces doc |
| receipt/grant record schema | portable capability/settings receipts and audit exports lenses can reason about | kernel doc, capability-os lane |

**Mismatch.** The additive-later list in [[freeze-gates]] §C reserves KEL/WHITEOUT/salted-TAGDEF etc., not these. Permissionless user-key TAGDEFs *can* express some (handler binding, beacons) as conventions — at the cost of per-client dialects and no frozen vectors.

**Paths.** Mint reserved rows now (cheap: rows + vectors) for `lang`/`dir` and persona-link at minimum; rule the rest as cookbook conventions explicitly if not minted, so the "convention, not row" choice is a decision rather than silence.

**Defer-risk.** Reserved-key additions after the freeze are a pledge amendment; conventions minted under user keys fragment exactly where signed-data semantics should be uniform.

- [ ] James/design-round pass over the five candidates: row vs blessed convention vs reject, each.

## P3. Read-grade vocabulary extensions — [DURABLE → read-lens-spec]

**Problem.** The client hits states the CLOSED grade set (§2) cannot express; every Shell/client will invent presentation dialects exactly where honesty matters. Needed, consolidated:

1. **Cause taxonomy for UNKNOWN**: `NO-TRANSPORT` (no endpoint capability granted), `POLICY-DENIED` (budget/trifecta refusal), venue-miss — "not permitted to look" must never render as "not found". (Flagged by six of thirteen docs; the single most-repeated gap in the round.)
2. **PENDING-LOCAL overlay composition**: normative composition of the pending-state ladder with venue grades (what the local optimistic overlay renders as, and what agents see).
3. **Composite closure grades**: multi-record resolutions (generations, app closures) need a worst-of-inputs, venue-qualified composition rule + a closure-completeness predicate over `BYTES-*` ("bootable/installable offline" is currently undefined protocol-side).
4. **Grade→executability table**: LIVE/pinned = runnable; STALE = runnable-with-label; EQUIVOCAL = never auto-run — so all conforming clients gate *code loading* identically.
5. **Machine-readable provenance tuples** in resolver output (author, venue, grade, currency, byte-verification, discovery-vs-trusted) — agent taint-tracking needs data, not rendered enums.
6. **Post-local-state-loss degraded state**: after origin eviction, everything falls to venue-qualified UNKNOWN until re-verified — normative, so clients don't default optimistic.
7. **Rendering-locale-is-a-lens** note + locale/font/CLDR **pack-version staleness** disclosure hook for safety-critical identifier display.
8. **§6.5 grammar additions**: citation **lens-excerpt** form (disclose the resolving lens position without publishing the viewer's whole trust order); a sender-lens-hint / attestation-pin query key so path links can be made portable deliberately.

**Mismatch.** §2 is deliberately closed; extension is by spec revision — which is exactly what this requests. None of this is Etched.

**Defer-risk.** Third-party clients fork honesty vocabulary; the conformance suite (§8.3) tests a vocabulary that can't describe common OS states.

- [ ] Read-lens-spec revision pass adopting/rejecting each of the eight, with vectors for 1–4.

## P4. Actor and delegation dimension — [WORKSTREAM, with one ETCHED-WINDOW touchpoint]

**Problem.** The protocol has no authority level below the author key:
- Human, persona, and agent-mediated writes are **indistinguishable on-chain**; receipts lose third-party verifiability; post-compromise demotion of agent-written records has nothing to key on.
- **Delegated revocation doesn't exist** (`revoker == claim.author`): the primary cannot revoke a stolen persona's claims; pre-signed revoke ladders minted at persona creation are the only kill switch — fragile and easy to lose.
- **Bounded pre-authorization** ("admit up to N records of kinds K under path P before expiry" — the AP2 open-mandate analog) has no protocol form; the client substitutes personas + client policy.
- **P-256 (0x02) / WebAuthn (0x03) un-reservation has no schedule.** EIP-7951 put P-256 verification on L1 (Fusaka 2025-12); the remaining gate for 0x03 is byte-exact vectors from ≥2 authenticator families ([[codex-envelope]] amendment 7). The client's whole key-custody ladder (hardware-backed, passkey-native authorship; browser custody of secp256k1 is structurally impossible — WebCrypto has no secp256k1) upgrades the day 0x02 lands. **This deserves an owner and a date, decoupled from full-KEL delivery if at all possible.**

**Mismatch.** [[identity]] reserves KEL/succession only; agent-native and ocap practice (OAuth OBO `sub+act`, certificate capabilities) both want a delegation credential lenses can resolve.

**The client-side form that exists today (validated 2026-07-07).** The persona doctrine's **owner-labeled membership** ([[wallet-and-actions]] §Linking) *is* the path-(b) client-side version of this credential: the primary key owns a roster of persona addresses and stamps each a VAL-label (`human`/`agent`/`device`/`app`) via an `efs.os/persona` TAG — expressible now in the five kinds, resolved under the owner's lens. Its honest limit is exactly why the reservation matters: the label is **owner-asserted, not kernel-enforced** (a member self-labeling is graded untrusted, but only conforming clients honor the owner's label), and **removal is prospective un-endorsement, not retroactive disavowal** — the "was-me-until-block-N, thief-after-N" partition is inexpressible until the KEL's signed validity-windows exist. So path-(b) ships the *presentation*; only path-(a)'s reserved credential ever makes it *cryptographic*.

**Paths.** (a) Reserve a sibling slot next to the KEL reservation for delegated/attenuated signing + an `act` (on-behalf-of) convention word, **and the `efs.os/persona` link relation + `label` word** (also a P2 reserved-key candidate) — reservation only, no v2 machinery — keyed on the **primary's address word** (which never rewrites) so the future KEL/delegation backs it *additively*, not as a migration break; (b) explicitly rule agent/persona attribution client-receipt-only forever (also acceptable — but rule it, don't drift into it); (c) put the 0x02/0x03 un-reservation on the freeze-gates schedule with a named owner.

**Defer-risk.** (a)/(b) undecided means clients invent unverifiable attribution *and* the owner-label convention fragments per client; (c) deferred means the client ships its weakest custody story for years while the enabling precompile sits live on every chain.

- [ ] James: pick (a) or (b); if (a), reserve `persona`/`label`/`act` with P2; schedule (c).

## P5. Signing legibility and bundle custody — [DURABLE + DOCTRINE]

1. **Canonical envelope summary**: a deterministic summary (kinds, counts, targets, ordering) hashed into or alongside `recordsRoot`, so the human-readable preview is verifiable and "what you signed" is not client-relative. (Pairs with an **ERC-7730 descriptor** for the envelope schema submitted to the EF-stewarded clear-signing registry, and an ERC-8213-style digest cross-check in wallets.)
2. **Per-record risk-class taxonomy** (conventional, SDK-level, keyed to record kinds/reserved keys) so batch preflights can't hide one dangerous record among harmless ones — and so wallets/Shells don't fork dialects of "dangerous".
3. **`.efs-bundle` as a protocol artifact**: normative venue-neutral portable encoding (header + signed records + signature + submission progress), with the spec stating plainly that **any holder may submit it** and that admission is clock-free (expiry decays currency, never blocks admission).
4. **Pre-admission supersession semantics**: whether a later-signed same-slot higher-seq bundle safely defangs a leaked earlier unsubmitted bundle; plus the blessed **pre-signed revoke-all abort artifact** doctrine for interactive bundles.
5. **ERC-7920/7964 liaison**: EFS's envelope now has a standards-track twin; document the deliberate Merkle-profile divergence (positional tree, promotion, N=1 wrapped leaf) as a named profile and watch the drafts.

- [ ] Envelope-spec appendix for 1/3/4; cookbook for 2; a liaison line in [[freeze-gates]] watch items for 5.

## P6. Update-channel trust operations — [DOCTRINE → ops-doctrine]

An "update channels" section covering: per-channel monotonic high-watermarks; the fast-forward rule (auto-follow never moves backward; user rollback always legal); backward-head handling (EQUIVOCAL-style stop + explicit user action); the **curator-compromise recovery recipe** (REVOKE-sweep + lens repair), written *before* channels ship; a **deny-set freshness floor for auto-update** ("deny view no older than T, venue-qualified" — distinct from general read freshness, else offline-honest clients auto-install later-revoked malware); **k-of-n curator quorum** as a blessed client-layer convention (first-attester-wins is 1-of-n; grades cannot say "LIVE but below threshold"); the **channel-monitor role** commissioned as a real, funded workstream (CT's lesson: unmonitored transparency protects no one); and the pre-KEL **key-compromise incident-response playbook** (lens distrust + advisory subtraction is currently client folklore).

- [ ] Ops-doctrine revision adopting this section; monitor role gets an owner.

## P7. App-platform primitives — [DOCTRINE, borderline P2]

A blessed **app-package convention** in [[apps-cookbook]]: app identity = (author word, app-root record); manifest (CML-tri-partition shape) hashed into app identity; release/channel/provenance record shapes; and the **atomic resolve-closure-at-pinned-root** operation (manifest + content root as one consistent pair — per-record lens resolution can mix versions across an app's records; a partially-upgraded app is a security hazard). Language packs and font packs as signed-record patterns with lens-endorsed translations ride the same convention.

- [ ] Cookbook blessed-pattern additions; decide whether any part hardens into P2 rows.

## P8. Read-path privacy as a normative obligation — [DURABLE + DOCTRINE]

Deterministic, permanent, global record IDs make interest metadata compound forever; naive clients will default to Infura-style leak-everything. The protocol docs should carry a normative client/SDK privacy section: **bulk snapshot distribution** for lens lists, deny sets, discovery indexes, and checkpoints (the OCSP→CRLite move — live per-record lens-resolution traffic reconstructs the viewer's trust graph from query order alone); **one-head-per-venue revalidation semantics** blessed (what a single head/checkpoint fetch proves about the freshness of N cached records — the client's anti-timing-correlation invariant depends on it); **chunk-size normalization and prefetch/padding guidance** in the bytes spec (chunk fetch sequences fingerprint files through any relay); and OHTTP-cleanliness guidance (stateless, identifier-free read protocols) so relaying stays retrofittable.

- [ ] Read-lens-spec + codex-bytes privacy sections; SDK conformance items.

## P9. Private/encrypted record tier and the local-state ruling — [WORKSTREAM]

Five client needs converge on the same missing story: **journal escrow/backup**, **cross-device roaming** of profiles/lens-config/settings, **agent receipts** (sensitive, want portability + verifiability), **published OS profiles** (fingerprinting gifts if public), and **private persona linkage** (below). Today the only options are public-permanent records or evictable local storage. Needed: (a) an explicit blessing of the **encrypted-local/roaming tier** as NOT-records (config, default handlers, permission ledgers — the anti-shape of permanent public data); (b) an **encrypted-record convention** (extends [[efs-v2-holistic-redesign]] §2.3 + the substrate privacy workstream) for the roaming/escrow cases, HNDL-aware; (c) **lens/trust config restorable** (exportable or as records under the user's address) — a silent wipe changing what a user *sees* is a truth bug, the round's sharpest storage finding.

**Private persona linkage (validated 2026-07-07, the sharp new instance).** The persona-linking convention ([[wallet-and-actions]] §Persona privacy) ships a **plaintext, public, bidirectional pair by default** — so the feature whose entire value is *un*-correlation actively *publishes* the correlation of every persona to the primary. The **four privacy layers**, with EFS's honest status: **payload** = covered (opt-in, §2.3 reserved); **read** = covered and genuinely ahead of the ecosystem (client-side: [[network-privacy]] OHTTP/bulk-snapshots/verified-reads); **graph/authorship** = *fundamentally public* — `author = recovered signer` makes the who-authored-what edge and timing unhideable by construction (substrate §6.4 already concedes the passive form); **linkage** = public works, **private missing**. The private-link variant is **buildable from reserved parts, no new Etched surface**: a **salted-capability anchor** (handle in the web3:// fragment) + the **link body encrypted** to the chosen reader (`contentEncryption`/`keyWrap` to a per-link key, G9-compliant). Its **irreducible residual** — public author word + timestamp + funding/submitter trails — means *link-content* selective disclosure ships as a cookbook convention today, but true authorship+timing unlinkability needs zk/mixnet work that is in genuine tension with verify-don't-trust and is **out of scope**. Frame EFS honestly everywhere: **privacy-possible, not private-by-default, never anonymous** — cypherpunk on the read/custody side, publicly-verifiable-by-necessity on the write/graph side.

- [ ] Commission the private-records design note; rule (a) explicitly in ops-doctrine.
- [ ] Bless the **private persona-link convention** (salted anchor + encrypted body) in [[apps-cookbook]]; add the four-layer status + the "privacy-possible not private-by-default" framing to [[efs-substrate-decision]] §6.4 (it extends, not contradicts, the existing concession).

## P10. Multi-device authorship — [DURABLE/SDK]

Two offline devices of one identity can mint the same `seq` → admit-both makes the user **self-EQUIVOCAL**. The TID layout already carries 10 clockId/device bits (the SSB-death fix, [[efs-substrate-decision]] §3.5) — but no normative allocation convention exists. Needed: a blessed device-bit allocation + journal-handoff rule (or seq-range leases), owned by the SDK spec, with vectors.

- [ ] SDK-spec section; add a self-equivocation vector to the conformance suite.

## P11. Bytes and web-interop details — [ETCHED-WINDOW (EFSBytes) + standards work]

1. **SHA-256 digests alongside keccak in chunk manifests** ([[large-file-uploads]] / codex-bytes): native import-map/SRI integrity speaks SHA-256/384; without a per-chunk SHA-256 word the client re-hashes every module in the SW — slower, non-native, and it forfeits browser-enforced module pinning. Cheap field now; painful retrofit after EFSBytes freezes.
2. **Chunk-size normalization guidance** (privacy, P8).
3. **`web3://` has no browser on-ramp**: not on the `registerProtocolHandler` safelist (`ipfs`/`ipns`/`dweb` are). The client ships https-canonical links + a `web+efs://` alias lane; the ecosystem fix is standards work (safelist addition, coordinated with the ERC-6860 community) — worth a named liaison task.

- [ ] Codex-bytes: SHA-256 word decision before the EFSBytes vectors freeze; standards-liaison task filed.

## P12. Housekeeping: v1-stranded planning docs

[[efs-account-system]] (B′ smart-account identity, session keys, promptless-via-AA) and [[sdk-wallet-architecture]] + parts of [[sdk-vs-client-responsibilities]] are EAS-era and now contradict the identity/carrier rulings (no ERC-1271 ever; author = recovered signer; smart accounts cannot author). The client set replaces their UX layer with personas + submission-rails-only AA ([[wallet-and-actions]]). These docs need superseded-by banners or a v2 re-cut so future agents stop citing B′ as live doctrine. Also: a boot-artifact revocation-check policy ruling (may a user boot a REVOKED closure? client says yes-behind-loud-interstitial — confirm) and the [[web-os-thesis]] naming question ride the normal client thread, not this report.

- [ ] Banner/re-cut pass on the three docs; confirm the REVOKED-closure-boot posture.

## P13. Timestamp-free ID: the application-layer footguns nobody wrote down — [DURABLE + DOCTRINE, with P1 as the enabler]

**Problem.** Dropping EAS's timestamp-in-UID (the source of the many-clicks disease) was correct, but it means **the record carries no trustworthy "when."** The `seq`/TID is *author-asserted* and **back-datable without bound** (only future-dating is fenced, +600s). The one trustworthy clock is the **admission block** — which is per-chain, gone once the origin chain dies, and **not currently exposed to readers** (that is P1). The substrate investigation ruled this deliberately (per-author order travels; global/cross-author order and cross-chain currency do not, and were audited as not-needed for core reads) — but the *application-layer consequences* were never consolidated anywhere findable, and a naive app walks into every one of them. Surfaced by the client round's social-app pressure-testing (2026-07-07):

Table below **red-teamed and corrected 2026-07-07** (D2 and D4's completeness claim were wrong as first written; D1/D3 silently fail on the *default* path). Verdicts: D3 mechanism-sound, D1 sound-per-chain, D2/D4 sound-only-with-the-corrections shown.

| Footgun | Naive failure | Blessed defense (corrected) |
|---|---|---|
| **Chaotic ordering** (feed/comments) | sort by author-claimed TID ⇒ a commenter back-dates to the top; **or** a thin replica lacking the index silently falls back to the TID (the spec's own FM12) | order by the **origin venue's admission order** (enumeration spine / discovery index §7.1), **pinned to one canonical venue** — admission order is *never a cross-chain truth*, so a replica/no-index venue has **no trusted order and MUST NOT fall back to the claimed TID** (render it unordered/venue-relative). Trustless per-container order at scale leans on the P12 discovery index |
| **Fake predictions** ("I called 9/11") | trust the displayed TID as real time ⇒ unfalsifiable back-dated claim | admission time is a trusted **"existed-by T" bound** (never a certificate of *genuine age*, never a lower bound); a real prediction needs an early admission, a forgery has none ⇒ detectable — **but only via P1's state-resident `admittedAt` (HARD dependency: the spine gives admission *order* not *time*; checkpoint age is author-TID, not a clock — so this defense has NO trustless implementation today).** The earliest-admission bound is only as strong as the earliest chain the reader independently validates as **live-then** — a controlled or dead (long-range-forgeable) chain can mint a false early `admittedAt` |
| **Edit-after-reply gaslighting** | reply threads by **path form** — which §1.2 makes the *browsing default*, so a reply built from the copied browser URL re-resolves to the edited version and gaslighting succeeds | replies/quotes **MUST pin citation form `~claim:<claimId>`** (content-addressed; supersession never silently followed §4.3; a partial replica can only answer PRESENT or UNKNOWN, never a *different* version; superseded bodies stay reachable/SUPERSEDED). Render a cited parent that is UNKNOWN-at-venue as "context unavailable," never promoted. Client-renders-edit-history is an unenforced obligation — mandate both |
| **Cross-chain partial views** | render a fresh replica as complete/authoritative; **or omit a stranger's reply** — undetectable | grade machinery is sound for "never LIVE" (no covering checkpoint ⇒ UNKNOWN-CURRENCY §5.1/RR6; forged checkpoint needs the author's sig). **But checkpoints prove per-AUTHOR completeness-through-N, NOT cross-author *container* completeness** — an open comment set is a **floor** ("≥ these; more may exist"), and a silently-omitted stranger-reply has no claimId to prove absent. Render as a floor; **curate via a host approval LIST** so approved-set completeness becomes per-author-checkpointable |
| **Engagement counts** (likes/follows/replies) — *missed, highest* | show raw totals as authoritative | counts are **untrustworthy both directions** — sybil-inflatable up (N addresses = N reactions, only gas-gated), omission-deflatable down at a replica; **never GATE-consumable** (§7.1). Count only reactions from authors in the viewer's trust lens; label as lens-filtered/indexer-estimated |
| **Notification / @-mention / inbox completeness** — *missed* | trust the inbox as complete | inbox completeness = discovery completeness = **UNKNOWN**; a replica omitting your inbound mention is undetectable (censorship-by-omission), and inbox is unbounded-spammable. Lens-filter; never claim "all mentions" |
| **Self-equivocation in a feed** (P10) | render a user's two-device same-seq post as "forked/malicious" | expect **CONTESTED** and render the deterministic tie-break winner as a labeled "N other versions," not an attack |

**Mismatch.** The read-lens spec has the *machinery* (admission-order discovery index, citation-pins-not-follows, venue ceilings, SUPERSEDED grade) but states **no normative client/SDK rule** "never gate on the author-asserted TID as real time," and the **apps-cookbook has no social-app pattern** codifying the four defenses. The temporal-provenance-under-replication limit ([[efs-v2-holistic-redesign]] §3.3) is real but buried, which is why "I never heard the downsides" is a fair complaint.

**Paths.** (a) A normative **"author-time is untrusted; use admission-time / expiry / checkpoints" rule** in [[read-lens-spec]] (pairs with P1 exposing admission time and P3's grade work) — plus the **"no TID fallback on a thin/replica venue"** rule (D1) and the **"reply/quote MUST pin citation form"** rule (D3); (b) a **blessed social-app pattern** in [[apps-cookbook]] — the red-teamed do/don't list: order by origin-venue admission (no TID fallback), thread by `~claim:` (not path), render replica conversations as a *floor* + host approval-LIST for checkpointable completeness, treat counts as lens-filtered-never-trusted-integers, expect CONTESTED, predicate any "first-said" claim on trusted admission time; (c) **surface the timestamp-free-ID tradeoffs prominently** — a short "known tradeoffs of the timestamp-free ID" section (or promote §3.3) so the downside is stated once, findably, not only in the false-confidence register.

**Defer-risk.** Every third-party EFS social/forum/wiki/config app re-derives these badly and independently; the predate and edit-gaslight failures become "EFS is chaotic" folklore even though the primitives defend against them. Cheap to write now; expensive as ecosystem reputation later.

- [ ] read-lens-spec: the untrusted-author-time rule (+ its dependency on P1). apps-cookbook: the social-app blessed pattern. Substrate/holistic: promote the timestamp-free-ID tradeoffs to a findable section.

---

## Open questions

- [ ] P1 decision (read-ABI extensions vs view recipes vs indexer lane) — sequencing: must precede the freeze-gates gas snapshot.
- [ ] P2 five-candidate pass (row vs convention vs reject).
- [ ] P4: actor/delegation reservation vs client-only ruling; 0x02/0x03 un-reservation owner + date.
- [ ] P9 commissioning (private-records note).
- [ ] P13: the untrusted-author-time rule + social-app blessed pattern + surfacing the timestamp-free-ID tradeoffs (leans on P1).
- [ ] Which of P3/P5/P6/P8/P13 land in the current doc-revision round vs the next.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Cross-links added: [[read-lens-spec]], [[codex-kinds]], [[codex-kernel]], [[ops-doctrine]], [[identity]], [[large-file-uploads]], [[freeze-gates]], [[apps-cookbook]] each point here from their Open questions
- [ ] At least one round of `#status/review` with another agent or human comment
