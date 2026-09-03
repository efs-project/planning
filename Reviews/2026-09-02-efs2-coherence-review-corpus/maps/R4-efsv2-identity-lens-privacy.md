# R4 — efsv2 Identity/KEL, Lenses, read-lens spec, privacy pass — reader map (2026-09-02)

Lane: `R4-efsv2-identity-lens-privacy`. Read-only over the planning vault. All paths repo-relative.

## 0. Headline

This set is **twelve documents of which ten are July evidence and two are current authority** (`Designs/efsv2/owner-rulings.md`, `Designs/efsv2/README.md`). The July docs are internally rich and mostly self-consistent *as a July system* (KEL → lens-consumes-KEL → privacy-consumes-both), but the 2026-08-12 greenfield reset (`owner-rulings.md` §2026-08-12) reopened every mechanism they define, and **none of the ten July docs says so about itself**. The *actual* current identity/lens design for this lane lives outside the assigned files: `system-constitution.md` §"Authorship and authority" / §"Lenses for contracts and people" / §"Privacy, safety, and execution", `core-architecture-candidate.md` §Principal / §Contract Resolution Plan, and the Stage A chapters `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md` and `b0-lens.md`. Those are coherent with the owner rulings and with each other. The two seams that are *not* settled and matter for an MVP are (a) whether the MVP write path is account-Principal-only or needs the multi-controller "managed Principal" that the owner's own client direction 7 example describes, and (b) whether a basic File Browser write costs one wallet signature or two. The privacy rulings (public by default, mandatory indexing exposes the graph, contracts cannot decrypt) are correctly visible in the constitution; the owner-named "sensitivity policy layer" is designed nowhere.

**Maturity:** `historical-evidence` for the ten July docs; `reference` for `owner-rulings.md`/`README.md`. **Cohesion:** high inside July, high inside August, low *between* them because the July docs carry no reset banner and the August ledger stops on 2026-08-12 while owner directions kept arriving until 2026-08-23 in a different folder.

## 1. Per-document summaries, standing, and defined terms

Standing is per `Designs/efsv2/README.md` §"Evidence map" (L95–111) and §"Hard holds" (L129–138), the 2026-08-12 ruling (`owner-rulings.md` L169–221), and each doc's own status line. **Git cannot verify any July "Last touched" date:** the clone is shallow (50 commits, all dated 2026-08-13 or later) and every lane doc was *added* in commit `c48f252` (2026-08-13, "design: make Stage A preflight sequential", 561 files). Dates below are the docs' own claims.

| Doc | Own status line | Standing (README / inbox) | Says it is superseded by the 08-12 reset? |
|---|---|---|---|
| `kel.md` | "draft candidate profile; topology under owner validation" (L3), last touched 2026-07-12 | Evidence: README L101 "[[kel]] and KEL/account review corpus … Full KEL/topology must re-earn inclusion" | **No.** Its banners (L12–18) are July self-corrections; §23 still lists "Decisions for James" 1–5 |
| `identity.md` | "draft", last touched 2026-07-07 (L3, L7) | Not indexed by README; superseded by `kel.md` per its own L11 banner | **No.** Still says "Frozen now: the bytes32 identity-word shape taxonomy…" (L16) |
| `lens-spec.md` | "draft seed — the successor entry point for the reopened [[read-lens-spec]]" (L3), 2026-07-28 | Evidence: README L100 "Old grammar is not frozen"; inbox L208–252 marks LP-1…LP-10 superseded/restated | **No.** Calls itself the successor entry point; asks James for LP-1…LP-10 (L106) |
| `read-lens-spec.md` | "draft" (L3), 2026-07-12; banner L16–18 "REPLACED as entry point … Tier: REOPENED DURABLE DRAFT (historical)" | Not indexed by README; historical per its own banner | **Partly** — says historical vs lens-spec (07-28), not vs 08-12 |
| `lens-pass-synthesis.md` | "draft — ruling record of the dedicated lens/resolver pass" (L3), 2026-07-28 | Evidence: README L100 | **No** |
| `lens-read-gotchas.md` | "draft — reference companion to [[lens-spec]]" (L3), 2026-07-28 | Evidence: README L100 | **No** (L54 "Nothing here is frozen or built" is a July caveat) |
| `privacy.md` | "draft — consolidated from the 2026-07-10 FS pass; validation round RUN 2026-07-11" (L3) | Evidence: README L104 "[[privacy-pass-synthesis]] and privacy corpus … Old crypto/profile bytes are candidates" | **No.** Open question L182 still routes the public/private posture to `fs-pass-james-decisions` decision 4 |
| `privacy-pass-synthesis.md` | "draft — ruling record of the 2026-07-11 deep privacy pass" (L3) | Evidence: README L104; inbox N6 (L272–275) "Exact old policy and crypto profiles are not batch-adopted" | **No** |
| `privacy-freeze-reservations.md` | "draft — ceremony input; merges into [[fs-pass-freeze-reservations]] / [[freeze-gates]] §C at the next re-cut" (L3) | Not indexed; ceremony it targets no longer exists (README L129–138) | **No** |
| `privacy-james-decisions.md` | "draft — decisions from the 2026-07-11 deep privacy pass" (L3) | Not indexed; JD items appear nowhere in `Open-Decisions.md` (L43–58 efsv2 = V2-E1…F2 only) | **No.** §1 still says "Decide before the ceremony" for JD-8/JD-36 (L13–17) |
| `owner-rulings.md` | "reference — append-only, dated ruling ledger. NOT a design" (L3), last touched 2026-08-12 | **Current authority** (constitution L24 precedence 1) | n/a — it *is* the reset (L169–221) |
| `README.md` | "Current status: James has ratified the greenfield direction…" (L9) | **Current** phone summary | n/a |

### 1.1 `kel.md` — EFS v2 KEL identity and account foundation (943 lines)
A full identity architecture: stable `bytes32` principal with a slow control plane (KEL: `ControlPolicyV1`, `ControlStateV1`, `nextControlStateHash`, `RecoveryPolicyV1`, events `LEGACY_COMMIT/INCEPT/ROTATE/RECOVERY_*/MIGRATE_PREPARE/DEACTIVATE/DISAVOW_INTERVAL`) and a fast actor plane (`GrantBodyV1`/`GrantCertificateV1`, `AudienceScopeV1`, `ResourceScopeV1`), an authority home per principal selected by a sparse Ethereum-L1 `HomeRegistry` (§4.5), admission-time authorization with persisted `EnvelopeAuthReceiptV1`/`ClaimAdmissionV1` (§8.2), an envelope amendment adding `authorityId`+`authEpoch` (§8.1), read grades (`HOME-ADMITTED-AUTH`, `SNAPSHOT-AUTH@H`, `PORTABLE-SIGNATURE-ONLY`, `RECOVERY-PENDING`, `DISPUTED-INTERVAL`, `KEL-UNKNOWN`… §15), and a Tier-1 ABI (`resolveHome`, `getIdentity`, `verifyAction`, `resolveMany` §15). Its §12 forbids ERC-1271/6492 for envelope/KEL authority (L622); §23 asks James five topology decisions. **Terms:** Principal/identity, Authority domain, Authority home, Control key, Record signer, Delegation authority, Actor, Grant, Persona, `authorityId`, `authEpoch`, `controlEpoch`, `securityFloor`, `KeyDescriptorV1`, `keyId`, `keyMaterialId`, `GenesisBodyV1`, `IdentityStateV1`, `EventHeaderV1`, `ActionContextV1`, `AuthProof`. **Standing:** July evidence; the L1 locator / per-principal home / migration topology is explicitly *not* inherited (`owner-decision-inbox.md` P-5 L119–122, P-1 L96–100).

### 1.2 `identity.md` — bare-EOA now, succession reserved with a deadline (47 lines)
The 2026-07-07 identity ruling: bare EOA identity (`identityWord = bytes32(uint160(eoa))`), digest-shaped words reserved (`ReservedAuthorShape`, ID-SHAPE-1), "No ERC-1271 anywhere, ever" (L18), a ~2030 KEL deadline tied to PQ (L19, amendment 7), eight red-team amendments (LOSS/THEFT/ENCRYPTION rows, `successor` demoted, org-as-lens-list, `KEL-CONTESTED`). L11 banner: superseded by `kel.md` for KEL/account architecture. **Terms:** identity word, ID-SHAPE-1, `ReservedAuthorShape`, TID, `successor` row, `KEL-CONTESTED`, `metaHash`. **Standing:** historical; superseded twice (07-11 by kel.md, 08-12 by the reset). Its "No ERC-1271" is the direct opposite of the current constitution (L132).

### 1.3 `lens-spec.md` — Lens family specification, replacement seed (115 lines)
The 2026-07-28 lens pass's routing spec: a lens is "a typed, purpose-scoped, reproducibly compiled policy over authenticated evidence" (`EvidenceGraph + BasisVector + EffectiveLens + Context → ResolvedView + ViewReceipt`, §0.1); naming family Lens/View/Starter Pack/Follow/Channel/Labeler/Action Map/Roster/Plan/GATE (§0.2); three tiers CORE/RICH/ENHANCED with a no-Graph line (§1); client CBOR `LensSourceV2`/`EffectiveLensV2` and contract `PlanV1` (packed, CREATE2/SSTORE2 store — §2); LR-1/LR-2/LR-3 (§3); profiles FS-LENS/1, GATE/1, ADVISORY/1, DISCOVERY/1, AMBIENT/1 (owed — §4); composition (§5); 6+1 result axes + `AcceptanceMatrixV1` (§6); channels reuse KEL (§7); views/links/guest ladder G0–G3 + NS-1…NS-11 floor (§8); scale 15–55 centre, CORE cap candidate 64, client ceiling 256, `MAX_LENSES = 20` retired (§9). **Terms:** as listed, plus `LensObjectRefV1`, `sliceCommitment`, `GateConfig`, `kernelRef`, `policyMaxAge`, `minAuthEpoch`, `derivationKind`, `PRIVATE_HANDLE`, `RecoveryBundleV1`, `ViewV1`. **Standing:** evidence; inbox LP-3 L220–222 replaces the naming with "`ResolutionPlan` is a current candidate contract term", LP-4 L223–225 superseded by V2-E2.

### 1.4 `read-lens-spec.md` — Read & Lens Resolution Spec (573 lines)
The 2026-07-12 flat-lens reader spec: lens = ordered author list `L = [a₁…aₖ]` (§1.1 L59), deny set, GATE/INTERACTIVE context split, position states PRESENT/PROVEN-ABSENT/UNKNOWN with the anti-fallthrough rule (§2.1), closed dispositions EQUIVOCAL/CONTESTED/REVOKED/STALE/SUPERSEDED/LIVE (§2.2), currency HOME-LIVE/AS-OF(N)/UNKNOWN-CURRENCY (§2.3), the resolution pseudocode (§3.1), deny composition (§3.4), follow policies and `MAX_AUTO_FOLLOWS = 8` (§4.3), per-venue grade ceilings (§5), the `~addr:/~tag:/~data:/~list:/~prop:/~claim:/~name:` prefix grammar and `?lenses=`/`?deny=` query keys (§6), discovery reads (`MAX_PAGE=256`, §7), conformance LC1–LC6 / RR1–RR12 / 16 acceptance tests (§8). **Terms:** Venue, Lens, Deny set, Read context, Position, Data class, grades as above, `BYTES-UNAVAILABLE`, `DISCOVERY`, `DENIED`. **Standing:** historical (own banner L16–18); its §0 "Etched dependency pins" table assumes a kernel nobody is building.

### 1.5 `lens-pass-synthesis.md` — the lens/resolver pass synthesis (97 lines)
Ruling record of 2026-07-28: "the pass held on architecture and broke on artifacts" (L15); LN-1…LN-10; LR-1/2/3 binding repairs; EIP-7825 (16,777,216 gas tx cap) makes a 128-item × 55-principal contract-native directory page "permanently impossible" (LN-4 L27); §4 supersedes read-lens-spec as entry point; §6 owed work (RLS-R, KERNEL-R, E2, CLIENT, VECT, PRIV, `.efs-bundle`). **Standing:** evidence.

### 1.6 `lens-read-gotchas.md` — what every consumer must know (90 lines)
Honest-limitations digest: a read is six answers not a checkmark; never fall through on UNKNOWN; "a guest is never told a file does not exist" (L30, LP-5); wide sorted contract directories cannot be delivered (L34); install ceremony re-derives the current release (L38); contracts read public data only (L50); "Your trust list is private by default — and leaks if you are careless" (L55). **Standing:** evidence; its "For James" table (L61–71) maps to LP items the inbox has since superseded.

### 1.7 `privacy.md` — privacy design, research grounding, honest frontier (188 lines)
Two-layer frame (confidentiality solved; metadata bounded by choice, §0–§1); threat table §2; Layer 1 mechanics via reserved rows `contentEncryption`, `encryptionKey`, `keyWrap` (TAG-only), opaque occurrence keys, wrap-target independence from the signing key (§3.1); salted TAGDEFs vs encrypted dirnodes (§3.2, JD-6); forward-only re-key (§3.3); crypto-shred and the `private-recoverable`/`private-shreddable` split (§3.4, JD-1); Layer-2 leak table (§4); Fileverse autopsy (§7); frontier table (§6). **Terms:** as above plus `DOMAIN_ANCHOR_SALTED`, HNDL, PC-n, JD-n. **Standing:** evidence; README L104 "Old crypto/profile bytes are candidates". Its open question L182 still proposes "OS tier private-by-default" as a James decision — the 07-10 ruling already chose public by default (`owner-rulings.md` L31).

### 1.8 `privacy-pass-synthesis.md` — privacy canon PC-1…PC-14 (75 lines)
Headline: "privacy demands almost no frozen surface" (L15). PC-2 launch tiering; PC-5 X-Wing HPKE wraps + committing AEAD; PC-6 quantum-expiry honesty line; PC-8 stealth (self-derived fleets default, announced stealth rare); PC-10 read-path ladder (no silent RPC provider, OHTTP client half, PIR shelved); PC-11 what still leaks; PC-14 positioning ("Confidential when you choose it. Public by default. Anonymous never."). §3 L55 says the KEL owner owes reconciliation of JD-7/JD-38 into `kel.md` — never done there (kel.md L1 invariant 2 covers key separation; the hardware-wallet disclosure JD-38 is absent), though the constitution L252–253 carries the rule ("Signature-derived archive encryption keys are forbidden"). **Standing:** evidence; inbox N6.

### 1.9 `privacy-freeze-reservations.md` — ceremony input (73 lines)
Five row-text amendments A-1…A-6 (blinded-name function, "opaque" occurrence keys, self-escrow property, the open `encryptionKey` blob "THE LINCHPIN" L31, key-privacy sentence), optional B-1 (JD-8 stealth announce line) and B-2 (JD-36), convention ledger §C, promotions to MUST §D, REJECT list §E. **Standing:** evidence; the "ceremony" and the reserved-row table it amends (`fs-pass-freeze-reservations`, `freeze-gates` — L10 of `freeze-gates.md` says "no item below permits a freeze") are July artifacts the reset reopened.

### 1.10 `privacy-james-decisions.md` — JD-1…JD-38 (88 lines)
Decision sheet: JD-8/JD-36 "before the ceremony" (§1); product calls JD-1, JD-2+37, JD-6, JD-38, JD-9, JD-13, JD-16, JD-17, JD-22 (§2); technical ratifications JD-3…JD-30 (§3); gates JD-31…JD-35 (§4). **Standing:** evidence; none of it is in `Open-Decisions.md`; inbox N6 says old policy is not batch-adopted, but this sheet does not say so.

### 1.11 `owner-rulings.md` — the ledger (221 lines)
Entries: 2026-07-10 (chains don't die; **KEL — design it**; **Lenses — scale concern, MAX_LENSES=20 vs 50+**; **public-by-default + sensitivity policy layer**; storage), 2026-07-15 (18-item on-chain sign-off incl. **F sign-the-limitation**, **12 mandatory automatic indexing + "on-chain = metadata-exposed"**, **14 contracts cannot decrypt**; **KEL persona model UX-first**), 2026-07-16 (**passkey-sync default recovery RULED**; course-correction "kel-kickoff deleted"; portability model; META consolidation), 2026-07-22 (three-host read-only mount; research-before-MVP), 2026-07-23 (correction of commit 471a2ca; deferred items), 2026-08-07 (Git/forge direction), 2026-08-12 (**greenfield boundary**; "Open, not ruled: whether every author-facing API uses `PrincipalId` with raw accounts represented as zero-setup single-account Principals" L216–219). **No entry after 2026-08-12.**

### 1.12 `README.md` — greenfield design set (144 lines)
Phone summary; evidence map; build order; hard holds ("No … Principal/KEL mechanism, Lens grammar … is frozen" L130–132). Says "Names and exact bytes are open" (L71). Active docs are `system-constitution` and `core-architecture-candidate` (L140–142).

## 2. Lane question 1 — current vs July, and self-awareness

Answered in §1's table. Summary: **two current** (`owner-rulings.md`, `README.md`); **ten July evidence**; **zero of the ten carry a 2026-08-12 reset banner**. `read-lens-spec.md` is the only one that calls itself historical (relative to the 07-28 lens pass, not the reset). `assumptions-and-requirements.md` (not in this lane) shows what the banner should look like (L10–15: "Greenfield correction (2026-08-12): … a pre-August-8 requirements inventory … Read [[system-constitution]] first"). Five lane docs (`identity`, `read-lens-spec`, `privacy`, `privacy-freeze-reservations`, `privacy-james-decisions`) are not named in the README evidence map at all; they are reachable only through wiki-links from other evidence. This is the same isolation failure James flagged on 2026-07-16 (`owner-rulings.md` L99–102: "the designs are hard to wade through, isolated, not cross-linked").

## 3. Lane question 2 — the current Principal model and where it is decided vs open

**The current model (consistent across four current/Stage-A sources):**
- `system-constitution.md` L130–147: author/actor/submitter/payer distinct; "EOA and ERC-1271 authorship must work in a fresh supported Realm"; historical admission records the authority basis; "Key rotation, delegation, recovery, organizations, and future signature suites remain extension requirements. A full custom KEL is not frozen into the MVP merely to reserve them"; "The current candidate exposes one `PrincipalId` semantic author surface and represents an EOA or smart account as a zero-setup account Principal"; full-width `bytes32 PrincipalId` everywhere.
- `core-architecture-candidate.md` §Principal L234–262: `AccountPrincipal/1 = { authorityKind, originIfRequired, accountOrKey }`, `PrincipalId = H(domain, canonical(AccountPrincipal/1))`; EOA chain-independent, contract account Realm-qualified; no `hasCode ? ERC1271 : ecrecover`; "Later managed Principals may add … behind the same semantic `PrincipalId` API"; bakeoff vs tagged `AuthorRef`; falsifier 1 L422 "first EOA/smart-account authorship needs a separate registration block" → reject.
- Stage A `chapters/b0-principal-authority.md` §2.1–2.4 (L92–193): `AuthorityKind/1` enum {1 `EOA_SECP256K1`, 2 `CONTRACT_ERC1271` (originRef required), 3 `KEY_P256`, 4 `KEY_RSA`}; `PrincipalId = keccak256(abi.encode(DOM_PRINCIPAL, uint256(authorityKind), keccak256(descriptorBytes)))`; §5 ERC-1271 admission-time only with codehash+block pinned, never on read/Lens paths, ERC-6492 pre-flight only; §6 graduation seam `principalGovernance()` / `graduatePrincipal()` with invariants G1–G8 (G7: envelope reserves `(bytes32 authorityRef, uint64 authEpoch)` pre-freeze, "BLOCKING").
- `Designs/web-client-os/README.md` direction 7 (L61–68): "The client uses one uniform `PrincipalId` surface. A Principal may have a mutable default/main controller account… `JamesCarnley.eth` may have three controller keys while preferring `0xaCf4…88b9` for routine routing"; authority map L318–321 restates it.

**Where decided vs open:**
- **Decided (client scope, owner direction 7, 2026-08-14→23):** the client's public action surface is `PrincipalId`; default controller is a UX preference; signer descriptor and account are recorded exactly. Restated as WCOS-R18 (`product-constitution-and-roadmap.md` L161) and `mvp-and-acceptance.md` L63–67.
- **Open (Core scope, V2-E1 `owner-decision-inbox.md` L17–24 and `owner-rulings.md` L216–219):** whether *Core's* author/Lens/index API is uniform `PrincipalId` or tagged `Account | Principal`; "James's preference is one semantic Principal surface; it is not frozen until the comparison proves it honest and simpler." `hierarchical-files-and-folders.md` L121–125 repeats: "The uniform `PrincipalId` surface used below is the current V2-E1 experiment arm, not owner law."
- **Is that DRIFT?** Not a contradiction in substance: a client can present `PrincipalId` over either Core arm through an adapter (the client README's own L333–339 "Upstream synchronization note" says exactly this). The drift is *process*: the Core-relevant parts of directions 7 and 8 (a multi-controller Principal; a 64-entry contract Lens target) were never appended to `owner-rulings.md`, the one canonical ledger James asked for on 2026-07-16 (L101 "ALL owner decisions in ONE canonical place going forward"). And the *example* in direction 7 (one Principal, three controller keys) is a **managed** Principal, which the Core MVP candidate does not provide (see §6 and finding F3).
- **"KEL later":** consistent everywhere — 07-10 "KEL — design it … no schedule pressure" stands as direction; 08-12 reopens the *topology*; constitution defers the mechanism; Stage A reserves the seam (G1–G8). Inbox P-8 L133–136 defers recovery; Stage A STATUS L64 lists G-2 "Managed-Principal recovery must not imply funds custody or decryption recovery → future managed-Principal/KEL round".

## 4. Lane question 3 — lens scale numbers, reconciled

| Number | Where | What it counts | Status today |
|---|---|---|---|
| `MAX_LENSES = 20` | `owner-rulings.md` L27 (ADR-0026-era); `Designs/efs15/requirements-and-boundaries.md` L774 "V1 lens ceiling … excess URL entries are silently truncated"; `Designs/sdk-architecture.md` L886/L1089/L1436 (v1 SDK, renamed `MAX_EDITIONS`) | v1 URL lens entries (addresses) | **v1 evidence only.** `lens-spec.md` §9 L97: "retired by the two-caps-plus-budgets structure [LP-4]"; no `Retirements.md` row (only `identity = EAS UID`, L28) — acceptable since it is a mechanism, not a ruling phrase |
| "~12 own keys + ~40 friends = 50+ attesters" | `owner-rulings.md` L26 | raw keys/addresses per lens, resolved on every directory listing | The same entry (L28) rules "stable (KEL-style) identities per lens entry, not raw keys", so the realistic count becomes ~41 *Principals*. `assumptions-and-requirements.md` R-L4 L203 ("roughly 50 principals") and D-10 L465–469 ("50-principal normal case, 256-principal portable ceiling") silently re-label keys as principals |
| 15–55 design centre (10–50 trusted + 3–5 system principals) | `lens-spec.md` §2.4 L37, §9 L97; `lens-pass-synthesis.md` LN-10 L39 | Principals in one compiled policy | Evidence; carried as HYPOTHESIS into Stage A `b0-lens.md` §3.4 L191–195 |
| CORE per-plan cap **candidate 64** | `lens-spec.md` §2.4 L37 "(candidate 64, benchmark-set)"; Stage A `b0-lens.md` §2 L70 `MAX_PLAN_ENTRIES_CORE = 64` [PROPOSAL], §3.4 L189–205 (worst-case cold resolve at N=64 ≈ 549k gas ≈ 3.3% of the EIP-7825 cap; `entryCount` is uint16 so raising is a constant change) | Principal entries in one contract `ResolutionPlan/1` | **Owner direction 8** (`web-client-os/README.md` L69–71): "The contract Lens target is 64 Principal entries if measurement supports it"; `mvp-and-acceptance.md` invariant 3 L157–160 and L342; `architecture-and-modules.md` L170–172; `open-web-app-store/architecture.md` L854–856 "64-Principal Lens … remain unmeasured"; `layered-type-system-and-data-abi.md` L1261 |
| client compile ceiling **256** (E6) | `lens-spec.md` §2.4 L37; `assumptions-and-requirements.md` R-L4 L203, H-L1 L296, D-10; `kel.md` §22 gate 6 L878 "50–256-principal `resolveMany`"; Stage A `b0-lens.md` L71 `MAX_PLAN_ENTRIES_CLIENT = 256` [HYPOTHESIS] | Principals a client compiler must handle | Evidence/hypothesis; not enforced by Core |
| **1 / 8 / 32 / 64** benchmark profiles | `owner-decision-inbox.md` V2-E2 L26–31, LP-4 L223–225; `system-constitution.md` L309 acceptance row "Contract Lens"; `core-architecture-candidate.md` L450; `hierarchical-files-and-folders.md` L654–656, L1999, L2162; `media-library/booru-app.md` L352, `query-and-indexing.md` L142/L320 | measurement sizes | **Current evidence gate** |
| 16 segments × 128 total Plan candidate evaluations | `hierarchical-files-and-folders.md` L331–334 | per-path deployment floor for the friendly adapter | Files draft proposal |
| 128 × 55 page "permanently impossible" under EIP-7825 (16,777,216) | `lens-pass-synthesis.md` LN-4 L27; `lens-read-gotchas.md` L34; `lens-spec.md` §1 L30 | contract-native sorted directory page | Physics claim; **UNVERIFIABLE** from here (activation date "Fusaka, 2025-12-03"); consistent across docs and reused by Stage A §3.4 |
| `MAX_AUTO_FOLLOWS = 8`, `MAX_PAGE = 256` | `read-lens-spec.md` §4.3 L302, §7.1 L448 | follow budget / discovery page | Historical |

**Reconciliation:** the numbers are consistent once the axis is named — 20 is v1; 50+ was the owner's *key* count and is ~41 in Principals; 64 is the *point-resolution* plan cap (direction 8, V2-E2 top size); 256 is the *client compile* ceiling; 1/8/32/64 are the measurement points. The owner's original fear ("resolved on every directory listing") is answered not by a bigger cap but by moving listings off the contract tier (`lens-spec.md` §1 L30; `hierarchical-files-and-folders.md` L654–656 "Wide directory sorting/merging stays client-tier"). What remains unmeasured is the *client* cost of a complete listing at 64 Principals × N names (`web-client-os/README.md` open question L521–523; V2-E6).

## 5. Lane question 4 — the privacy pass decisions and their visibility

| Ruling | Ledger | `system-constitution.md` | `web-client-os/privacy-and-agents.md` |
|---|---|---|---|
| Public by default; private only for sensitive classes or opt-in | `owner-rulings.md` 2026-07-10 L31 | **Yes** — L243 "Public is the default. Client/OS sensitivity policy encrypts sensitive or explicitly private plaintext before signing or publication and warns about permanent metadata exposure" | Implicit only: L91 MVP "public Files content only; no confidentiality claim"; L37–40 private *local* state has a home outside EFS. No "public by default" statement for EFS Records |
| Sensitivity policy layer = named client/OS convention, classifier of record classes/paths, inheritance, "make private" | L32–33 ("fold into the in-flight privacy pass as a named subsystem, not a footnote") | One sentence (L243–245) + L254 "Sensitivity defaults, opt-in privacy, and any inherited privacy label are explicit client policy" | **Absent** — no hit for "sensitiv"/"classifier"/"make private" in any `web-client-os/*.md`; the July privacy pass (`privacy-pass-synthesis.md` PC-1…14) never named it either |
| Mandatory automatic indexing; "on-chain = metadata-exposed, full stop; the client is the only true metadata-privacy path" | 2026-07-15 item 12 L59–62; 2026-08-12 L203–210 | **Yes** — L171–174 "every matching item is indexed automatically; individual writers cannot opt out"; L241–242 "Public on-chain metadata is public. Encryption may protect payload bytes but does not erase authorship, timing, graph, endpoint, or traffic leakage" | Partly — L35–36 "encrypted bytes can still expose graph and timing metadata"; L51–53 "Encryption cannot erase public metadata" |
| Contracts cannot decrypt; operate on public data | 2026-07-15 item 14 L64 | **Yes** — L245 "Contracts consume public values, not secrets" | Not stated (a Core fact; not needed there) |
| Equivocation: sign the limitation, challenge window | 2026-07-15 F L51–54 | Implicit; Stage A `b0-lens.md` §11 carries it explicitly | n/a |

The privacy pass's own crypto results (PC-5 X-Wing wraps, committing AEAD, encrypted dirnodes, opaque occurrence keys, `encryptionKey` open blob) survive only as the constitution's generic seams (L246–253: distinct domains, salted/ciphertext bodies, key-role separation, versioned AEAD, "Signature-derived archive encryption keys are forbidden") and as the Privacy acceptance trace (L318). That is the intended outcome of inbox N6. One July-doc-vs-ruling drift: `privacy.md` §3.4 L60 proposes "the OS personal tier … private-by-default" and its open question L182 still treats the posture as undecided, four days after James ruled public-by-default; no current doc relies on the private-by-default proposal.

## 6. Lane question 5 — what an MVP write path needs from identity

**What the current client MVP says it needs** (`Designs/web-client-os/mvp-and-acceptance.md` §"Required write behavior" L57–83): a wallet connector; an "identity/controller resolver"; `PrincipalId` at the boundary with a mutable default controller; pinning Realm/Mount/Plans/Binding heads; and "Under the current candidate, sign the authored `PublicationEnvelope` and the Realm-bound `AdmissionIntent` separately because every Files operation selects Binding leaves" (L74–78). Deferred (L84–103): "arbitrary multi-Principal or delegated write policy beyond the fixed fixtures"; "ERC-1271 claims until a fixed smart-account fixture passes; an EOA-only adapter must report `ERC1271_UNSUPPORTED`". L182–185: "A raw EOA may be normalized by the SDK into a zero-setup account Principal… For a managed Principal, the user may choose a local/private default controller account."

**What Core currently offers:** `AccountPrincipal/1` kind 1 (`EOA_SECP256K1`) with EIP-712 signing under a chain-free constant domain (`b0-authorship-envelope.md` L87–89, L277–303); admission-time verification persisting an `AuthorityBasis` (`b0-principal-authority.md` §3.5); no registry (falsifier 1; seam invariant G5 "zero-setup preserved"). **Nothing is frozen** (V2-F1; `README.md` L129–138).

**Decided:** EOA signing with zero setup (constitution L140–141; candidate falsifier 1); `PrincipalId` as the client surface (direction 7); no full KEL in the MVP (constitution L137–139); ERC-1271 required *eventually* (constitution L132) but fixture-gated for the MVP (client L101–103); EIP-7702 "Design for; disabled by default" (`ethereum-standards-and-interop.md` L257).

**Undecided:** (i) whether the MVP File Browser needs a **managed Principal** (multi-controller, the direction-7 example) or ships account-Principal-only — nobody has said; (ii) one signature or two per basic write (Envelope + `AdmissionIntent` vs the Stage A F3 single Realm-bound carrier, `b0-authorship-envelope.md` L373); (iii) V2-E1 uniform vs tagged in Core; (iv) how "a Principal's mutable default account [is] stored and synchronized" (client open question L903–905).

**Cut for the MVP:** KEL/managed Principals (all of `kel.md`), personas/stealth fleets (PC-8, JD-9, JD-20, JD-25), recovery machinery (kel §10; JD-11; passkey-sync ruling), ERC-1271/6492 verification (keep the enum value, report `ERC1271_UNSUPPORTED`), `KEY_P256`/`KEY_RSA` verifiers (keep enum values reserved), the private tier entirely (PC-2…PC-7, JD-1…JD-38), lens objects/Views/Channels/Starter Packs/`RecoveryBundleV1` (lens-spec §2, §7, §8), advisory/deny plan sections and GATE/1 (lens-spec §3–§4; already out of `ResolutionPlan/1`), the PATH profile (b0-lens §10, already deferred).

**Seams that must stay reserved:** full-width `bytes32 PrincipalId` in every ID/ABI/storage/index/Binding/Lens key (constitution L145–147); `authorityKind` as an append-only enum inside the Principal preimage (Stage A §2.2 evolution rule); the authority basis persisted in the admission receipt, never on the Binding head (constitution L134–136; b0-lens §1); the graduation seam G1–G8 and, concretely, an Envelope field pair `(bytes32 authorityRef, uint64 authEpoch)` excluded from `RecordId` with zero meaning bare-account mode (b0-principal-authority §6.2 G7, "BLOCKING") — this last item is not yet in `core-architecture-candidate.md` §Envelope L131–158, which only says "actor/account authority witness"; the `minAuthFloor` field reserved per plan entry (b0-lens L150); "no registration block" (falsifier 1).

## 7. Neighbour assumptions and whether the neighbour agrees

| About | This set assumes | Neighbour says | Agrees? |
|---|---|---|---|
| Core object model | Binding heads keyed by `H(principalId, PositionKey)`; Lens = point resolution over heads; authority basis in receipts | `core-architecture-candidate.md` L213–232, L300–326 | yes |
| Type system | Lens/Plan reads are a measurement gate at 64 Principals | `layered-type-system-and-data-abi.md` L1261 | yes |
| Files | Plans are `ResolutionPlan/1`, 1/8/32/64; uniform `PrincipalId` is an experiment arm | `hierarchical-files-and-folders.md` L121–125, L504–506, L544, L654–656 | yes on identity; **partial** on lens sovereignty — Files makes Plans mount-local and publisher-chosen (L544), while lens evidence makes the viewer the risk bearer with a non-suppressible floor (`lens-spec.md` §0.4, §8.6) |
| Web Client/OS | uniform `PrincipalId`, default controller, 64-entry contract Lens; managed Principal may exist | `README.md` directions 7–8; `mvp-and-acceptance.md` L63–67, L157–160, L182–185 | yes on surface; **no** on managed Principal availability (Core MVP = account only, F3); **silent** on the sensitivity layer (F7) and the link-safety floor (F13) |
| App Store | GATE/1 hard rules (lens-spec §3.3) | `open-web-app-store/README.md` L87–90 (Principal/succession and Lens not frozen); `architecture.md` L854–856 ("64-Principal Lens … unmeasured"); inbox LP-6 L231–233 "Application/package gates remain pressure evidence" | yes (as evidence) |
| Arcade | no identity needed for guest play | `arcade/september-plan.md` L95 "without login, wallet, KEL, signing prompt" | yes |
| Media | curator Lenses at 1/8/32/64; moderation Lens = presentation only | `media-library/booru-app.md` L352; `README.md` L206 | yes |
| Git/forge | "teams/orgs = org principals with KEL control succession and scoped actor grants" | `owner-rulings.md` 2026-08-07 L163; constitution L311 (teams clonable) — but Core MVP orgs = ERC-1271 account Principals, Realm-qualified, no succession (candidate L245–247; Stage A §2.3) | **partial** — expressible only after managed Principals; org identity fragments per Realm today (F4) |
| SDK | envelope stays stock-wallet-signable "through the KEL recut" | `Designs/sdk-v1-bridge-v2-compat-asks.md` L27; Stage A EIP-712 chain-free domain L277–303 | yes (phrase "KEL recut" is stale) |
| Mounts | Lenses richer than Plan 9 union: WHITEOUTs, basis/completeness, fail-closed UNKNOWN | `owner-rulings.md` 2026-07-22 L113; `hierarchical-files-and-folders.md` L55–56 `DirectoryWhiteout/1` | yes |
| Realm/venue | `kel.md` §4.5 needs an Ethereum-L1 `HomeRegistry` | `owner-rulings.md` 08-12 L193–197 no home chain; inbox P-5 L119–122 "No L1 locator … is inherited" | **no** — assumption is historical and explicitly dropped |

## 8. Decided / undecided / disagreeing docs

**Decided (ruling location → who disagrees):**
1. Public by default; sensitivity policy = client/OS convention — `owner-rulings.md` L30–33 → `privacy.md` L60, L182 (July, not relied on).
2. Mandatory automatic indexing; graph metadata public by construction — L56–62, L203–210 → none.
3. Contracts cannot decrypt — L64 → none.
4. Equivocation: sign the limitation; challenge window; no collision bit — L51–54 → `lens-pass-synthesis.md` §2.1.6 already corrected FS-LENS/1; none current.
5. Lens entries are stable identities/Principals, not keys — L28; direction 8 → none.
6. Smart-contract-usable bounded Lens profile is Core — L198–202 → none.
7. KEL: design it, adversarial track, bare EOA day one — L19–23; topology re-earns — L178–187 → `kel.md` §23 still asks for topology ratification (July).
8. Passkey-sync default recovery — L83–86 → **no current doc carries it** (F6).
9. Persona model UX-first (one root, derived unlinkable personas opt-in) — L72–79 → **contradicted inside the ledger** by the 07-16 agent note L90 (F5) and by `kel.md` §11.1.
10. Greenfield boundary; `PrincipalId` question open — L169–221.
11. Client uses uniform `PrincipalId` + mutable default controller; 64-entry contract Lens target — `web-client-os/README.md` L61–71 (**not in the ledger**, F2).

**Undecided (owner → blocks MVP?):**
- MVP write path: account-Principal-only vs managed Principal — James via V2-E1/V2-E6; efsv2 + web-client-os → **yes (scoping)**.
- One vs two wallet signatures per basic Files write — efsv2 (V2-E3 F1/F3 carriers) + web-client-os → **yes (ceremony budget)**.
- V2-E1 uniform vs tagged in Core — efsv2 bakeoff → no (adapter isolates).
- ERC-1271 authorship requirement provenance; Realm-qualified contract-account identity for orgs — efsv2 (V2-E1/E5) + owner → no.
- Guest default trust policy / adoption of the July link-safety floor — web-client-os (V2-E6) → **yes (guest MVP)** but cheap.
- Sensitivity policy layer design — web-client-os → no.
- Recovery default and managed-Principal round — efsv2 → no.
- "What I see survives device loss" (lens object roaming; 07-10 key deliverable L28) — web-client-os/OS → no.
- Privacy ceremony items JD-8/JD-36 — superseded by N6 implicitly; sheet should say so — vault-process → no.

## 9. Concrete defects and stale facts

1. Ten July docs, zero reset banners; five not indexed by `README.md` (§2 above).
2. `owner-rulings.md` has no entry after 2026-08-12 while `web-client-os/README.md` records owner directions dated 2026-08-14→23 including Core-relevant ones (7, 8, 10, 12).
3. `owner-rulings.md` 2026-07-16 L90 declares the 2026-07-15 owner persona ruling "MOOT" on the authority of `kel.md` — the ledger inverting its own precedence.
4. `privacy-pass-synthesis.md` §3 L55 assigns JD-7/JD-38 reconciliation into `kel.md`; never landed there (JD-38 hardware-wallet disclosure absent from `kel.md`; the rule itself survives in the constitution L252–253).
5. `privacy.md` L182 and `privacy-james-decisions.md` §1 still present James decisions the 07-10 ruling and the 08-12 reset have overtaken.
6. `identity.md` L16 "Frozen now: …" and `read-lens-spec.md` §0 "Etched dependency pins (what this Durable spec assumes is frozen)" contradict `README.md` L129–132 (nothing frozen) without saying so.
7. `kel.md` §15 L710 "`resolveMany` supports 50+ lens principals" and §22 L878 "50–256-principal `resolveMany`" are an ABI no current doc carries.
8. Decisions.md L37 (2026-07-25 KEL frame: "assume universal native smart accounts… dependency direction stays KEL → smart account") says "the design thread ratifies these into `Designs/efsv2/owner-rulings.md`" — there is no 2026-07-25 section in `owner-rulings.md`.
9. `lens-spec.md` §8.7 / `lens-pass-synthesis.md` §6 owe an amendment to `Designs/clientv2/boot-and-profiles.md` (delete `?lenses=`); moot under the clientv2 hold (`Open-Decisions.md` L21) but never closed.
10. Wiki-links: every `[[…]]` and relative link I relied on resolves (checked 27 wiki targets and 26 relative paths); `Designs/efsv2/kel-kickoff.md` is absent, consistent with `owner-rulings.md` L89 "deleted 2026-07-16". `Reviews/2026-08-13-efs2-stage-a-corpus/README.md` does not exist (the entry file is `STATUS.md`) — `hierarchical-files-and-folders.md` L7 links `STATUS.md` correctly.
11. UNVERIFIABLE from here: all July "Last touched" dates (shallow clone; everything added 2026-08-13 in `c48f252`); "EIP-7825 live (Fusaka 2025-12-03)" and "EIP-7951 live on mainnet" (load-bearing for the 64-cap gas arithmetic and the `KEY_P256` kind); "EIP-7702 live since Pectra 2025-05".

## 10. Solid enough to build on now vs settle first

**Solid now (consistent from July evidence through constitution to Stage A):** full-width `bytes32 PrincipalId` everywhere; admission-time authority validation with a persisted basis and prospective revocation (kel §8.2 → constitution L134–136 → Stage A AUTH-INV-1/3); no code-presence dispatch (7702-safe); zero-setup EOA authorship with no registration block; Lens entries are Principals; risk-bearer rule; `UNKNOWN` ≠ absence; contract Lens = bounded point resolution with `EXACT`/`PRIORITY_FIRST_PRESENT`/`THRESHOLD` and a 64-entry candidate cap; public by default; mandatory indexing; contracts read public values only; no protocol default lens (July) realized as mount-local Plans (current).

**Settle first:** F3 (account-only vs managed Principal for the MVP write path); F11 (signature count per write); F2 (ledger synchronization so directions 7/8 and the 07-25 frame have one home); F13 (guest trust-policy posture and the link-safety floor).

**Cut:** see §6.

## 11. Candidate findings (detail in the structured summary)

F1 DEFECT — July lane docs carry no reset banner; five unindexed.
F2 DRIFT/vault-process — owner directions 7/8 (and the 07-25 KEL frame) are not in `owner-rulings.md`.
F3 UNDECIDED — MVP write path: account Principal vs the managed Principal in direction 7's example.
F4 UNDECIDED — ERC-1271 authorship requirement has no attributed ruling; Realm-qualified org identity.
F5 DEFECT — ledger contradicts itself on the persona model (07-15 owner vs 07-16 agent "MOOT").
F6 DRIFT — passkey-sync recovery ruling carried nowhere.
F7 MISSING — sensitivity policy layer never designed.
F11 UNDECIDED — two signatures per basic Files write vs one.
F13 MISSING — July link-safety floor / guest trust posture not adopted or rejected by web-client-os.
F15 DRIFT (minor) — 07-15 "keyWrap recipient-set stays off-chain" vs the July per-recipient on-chain `keyWrap` TAG design.
F17 UNVERIFIABLE — July dates and EIP activation facts.
F20 DEFECT (minor) — the Stage A G7 envelope reservation `(authorityRef, authEpoch)` is not reflected in `core-architecture-candidate.md` §Envelope.
