# Lens object, taxonomy, and channels — the keystone lane

**Lane:** OBJECT + TAXONOMY + CHANNELS (dedicated EFS v2 lens/resolver pass, gap G-A of the 2026-07-25 joined pass — [../../Designs/efsv2/joined-pass-synthesis.md](../../Designs/efsv2/joined-pass-synthesis.md) §6)
**Question owned:** the family of names so "lens" stops being nine things; the canonical lens-object encoding (portable source + compiled forms + the on-chain-readable trust-list artifact); device-loss survival; the seam-8 channel recut under KEL; the seam-12 personal/published separation; the import/composition encoding the profiles lane consumes.
**Status:** reconciliation + design input — candidate encodings with vector obligations. **Nothing here is a frozen schema**; this pass reconciles and designs, it does not freeze and does not pick an MVP.
**Primary base:** the [2026-07-11 lens architecture review](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) (the typed compiled-policy model, treated as the working architecture to refine); [FS-LENS/1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) §1 (settled chapter one — consumed, never reopened); [./research.md](./research.md) (technique menu); [./use-pressure.md](./use-pressure.md) (the consumer register — rows cited by LC-code); [../../Designs/efsv2/kel.md](../../Designs/efsv2/kel.md) §5/§7/§8/§9 (consumed shapes); [../../Designs/efsv2/owner-rulings.md](../../Designs/efsv2/owner-rulings.md) (binding).
**Marking:** every substantive claim is **VERIFIED** (checked against a named file/computation) or **PLAUSIBLE** (constructed here; needs vectors). §9 lists what could not be verified. **Pushback:** none required — no adopted ruling is contradicted (checked in §8.1).

#status/draft #kind/review #repo/planning #topic/lenses #topic/efsv2

---

## 0. Verdict in five sentences

1. The overloaded word "lens" resolves into a **twelve-name family** (§1) with one hard split: five human words (Lens, View, Starter Pack, Follow, Channel), one contract word (GATE), one shared primitive (**Roster** — the trust-list object), and five machinery identities carried from the review (Source Revision, Effective Lens, Compilation Record, View Receipt, Private Handle).
2. The encoding ruling (§2): **strict deterministic CBOR fixed-array bytes where only clients read; a packed static word-aligned layout where contracts read; a committed projection (`sliceCommitment`) binding the two.** The Roster is the ABI-side artifact James's steer demands — Solidity reads it by calldata slicing with zero dynamic offsets and zero CBOR parsing on-chain.
3. Device loss (§3) is survived by a **CXF-shaped encrypted Recovery Bundle** — an ordinary EFS DATA object in the privacy pass's *recoverable* tier — restorable from chain state + phrase with **no EFS-operated service**, with the honest loss line stated (inbound shares are NOT recovered until JD-32 lands; a stale bundle is a rollback vector answered by on-chain channel floors).
4. The seam-8 channel recut (§4) **deletes the channel's private control machinery** — control epochs, recovery verifiers, epoch checkpoints, the second guardian root — and replaces them with KEL facts already on the admission receipt: channel epoch = the receipt's `authEpoch`; fork repair = KEL rotation (which always bumps `authEpoch` in v1) + a reset head; honest same-epoch races repair with a two-parent adopt head.
5. The seam-12 separation (§5) is six normative rules: personal instances are local/encrypted with randomized handles and no deterministic-ID dictionary oracle; published curation is a deliberate authority-admitted editorial object carrying the eight-item disclosure list.

---

## 1. The naming taxonomy (deliverable 2 of the pass)

### 1.1 The family

The register's naming pressure ([./use-pressure.md](./use-pressure.md) §6) demanded exactly this split; the seeds (Lens, GATE, View, Roster) are adopted. Grades below: *mutable?* means "can the referent change under a stable name"; *public?* is the default, not a cap.

| Name | What it is | Who authors it | Mutable? | Public by default? | Tier that consumes it | Must NEVER be confused with |
|---|---|---|---|---|---|---|
| **Principal** | stable KEL identity ([kel §5](../../Designs/efsv2/kel.md)); the only thing a trust entry may name | the identity's controller | state evolves; word is stable | yes (public identity) | all three | a key, device, or address — SCALE-1: keys are not principals ([./use-pressure.md](./use-pressure.md) §2.1) |
| **Roster** | THE shared trust-list primitive: one purpose/scope slice — ordered tiers of principals + combiner + relinquish mode + deny-source entries — in a packed static layout a contract reads directly (§2.2) | whoever owns the consuming rule (user, curator, gate owner) | **no** — content-addressed; change = new Roster | on-chain when a gate stores it; may stay local | **CORE/CONTRACT** natively; RICH projects onto it | a Lens (a Roster has no imports/advisories/discovery — it is one compiled slice); a follow list (Roster entries carry authority) |
| **Lens** | the end-user read-view: "my everyday files", "strict research view" — a person's compiled trust policy for a purpose. The ONLY user-facing word for the policy machine | the viewer (risk bearer) | via new revisions | **no — personal policy is private by default** (§5) | RICH (client resolves it); CORE sees only projected Rosters | the evidence graph; a capability; a GATE; the resolved answer |
| **Source Revision** (`LensRevisionId`) | immutable authored source manifest — rules, imports, limits (§2.3) | the lens/curator author | no | only if deliberately published | RICH (compiler input) | the compiled semantics (a source with `FOLLOW_CHANNEL` imports is not executable) |
| **Effective Lens** (`EffectiveLensId`) | immutable fully-expanded compiled semantics — the normative executable object (§2.4); informally "the plan" | the compiler, accepted by the user or signed by the curator | no | no for personal (handle only, §5); yes for published | RICH executes; CORE verifies slices against its `sliceCommitment` | the source (Nix lock ≠ flake); a locator (it is a digest, not an address) |
| **Compilation Record** (`LensCompilationId`) | signed source→effective binding: compiler/profile version, pinned import closure, lock bases | compiler operator / accepting user / signing curator | no | follows the policy's mode | RICH (audit); gates may pin it | the Effective Lens itself (same semantics can have many provenances) |
| **View** | a saved, linkable lens+location+presentation: the [five-part view identity](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) (realm+code basis, lens version, evidence basis, completeness policy, evaluation time) **plus presentation config**. What links, mounts, and citations pass around | whoever saves/shares it | the *saved object* is immutable; a View naming a Channel follows it | sharable by construction; private until shared | RICH; the mount descriptor IS a View | the answer (a View is a question+policy, the Receipt is an answer); a URL parameter that authorizes anything |
| **View Receipt** (`ViewReceiptId`) | exact result at exact basis: query + effective lens + basis vector + clocks + budgets + completeness + result/provenance digests ([review §4.5](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) | the resolver that ran the read | no | disclosure is deliberate (leaks the plan — §5) | RICH mints/verifies; LC-13 consumers | reproduction (a digest without durable evidence is an audit promise, not reproduction — carried verbatim) |
| **Channel** | the mutable subscription handle: a principal-owned pointer stream `channelId → head Source Revision`, KEL-controlled, fork-visible (§4) | the controlling principal (via KEL actors/grants) | **yes** — points forward | the anchor is on-chain state; unannounced channels hide behind salt | CORE holds `channelAnchorSummary` state; RICH subscribes | the revision it currently points at; an identity; a recovery root (it has none of its own — §4) |
| **Starter Pack** | a *published curator View* intended for onboarding: deliberate, labeled, forkable editorial speech (§5.3–5.4) | a curator/app publisher, authority-admitted | via its Channel | **yes — that is its point** | RICH; the guest path's main policy source (LC-12) | a protocol default (genesis ships none — [read-lens-spec P13](../../Designs/efsv2/read-lens-spec.md), carried); the user's own policy after adoption (fork = copy) |
| **GATE** | the contract-gating / installer / app-store trust function: a purpose-locked, owner-pinned policy — stored Roster(s) or an `EffectiveLensId`+`sliceCommitment` pin — fail-closed, rollback-protected, never caller-supplied | the resource/gate owner (risk bearer) | only through the owner's declared governance | yes (it is contract state) | **CORE** natively; installers at RICH under the GATE profile | the viewer's social Lens (every corpus accident — "contracts walk lenses" — came from sharing the word); a Roster (a GATE *uses* Rosters plus purpose profile rules) |
| **Labeler** + **Action Map** | Labeler: a principal issuing signed labels (advisory evidence). Action Map: the consumer's committed label→warn/hide/block/reject table | Labeler: itself. Action Map: the risk bearer | labels accrete; maps change by policy revision | labels yes; maps follow the policy's mode | labels are chain evidence (CORE-readable point reads); maps are policy (RICH; reject-only in CORE deny entries) | each other — the labeler NEVER controls the action ([review §6.6](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)); content authority |
| **Follow** | a discovery-class rule: budgeted candidate source. Proposes, never disposes | the viewer | by policy revision | private by default | RICH only | authority in any form — discovery output never enters slot resolution (kill list) |
| **Private Handle** (`PrivateLensHandle`) | randomized/keyed **local** identifier for a personal policy instance | the local store | rebindable locally | **never** — it exists to avoid publishing the deterministic ID | RICH local storage | a portable content ID or public proof (it is neither) |
| **Recovery Bundle** | typed encrypted export of every personal object above (§3) | the owner's client | new bundle per export | ciphertext public (ordinary EFS DATA); plaintext never | RICH restore ceremony | a second recovery *root* (it is data under KEL/privacy recovery, not machinery) |

VERIFIED: the five review identities, `PrivateLensHandle`, and the risk-bearer/no-default rulings are carried byte-compatibly from [review §4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) and [read-lens-spec §8.1](../../Designs/efsv2/read-lens-spec.md). PLAUSIBLE: the View = five-part-identity + presentation packaging (constructed; the FS lane's mount descriptor is the existence proof).

### 1.2 The UX-philosophy test (users follow people; the machinery hides)

Test applied to each name — *can a person use the word in a sentence about people, not cryptography?*

- **Passes as a human word:** "open it through my **Lens**" · "here's a **View** of the archive" · "install the club's **Starter Pack**" · "I **Follow** her for finds" · "subscribed to Maria's **Channel**" · "that **Labeler** flags malware." Each sentence is about a person or an act of choice. VERIFIED against the register's UI rows (LC-1/2/3/8/16, [./use-pressure.md](./use-pressure.md)).
- **Deliberately NOT human words:** Roster, Effective Lens, Compilation Record, Receipt, Private Handle — expert/inspection surfaces only ("Why this?" expansion, [review §13.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). A UI that surfaces "roster" or "effective lens id" in a first-run flow has failed this test.
- **GATE is intentionally machine-cold.** It names a function contracts and installers perform; a user meets it only as "this app store's install policy." The coldness is the feature — warmth here invited the lens/gate conflation.
- **One rename applied:** the review's `LensRevisionId` object is called **Source Revision** in prose (not "revision" bare) so it can never be read as a document-version of the *answer*.
- **Banned phrasings (string-catalog rule, extending [FS-LENS/1 §1.4.1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)):** "contracts walk lenses" · "the lens's key" (a lens has principals, not keys) · "default lens" without "starter" (genesis ships none) · "trust X" bare — always the typed verb ("accept X's filenames under…", [review §13.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) · two-labels grade talk (F-15, binding).

### 1.3 Fixed inputs never renamed

`AUTHORITY-ADMITTED` at ordinal N, `PORTABLE-EVIDENCE`, `EVIDENCE-ORDERED@N`, the six-part read tuple, and the four PROVEN-ABSENT sources are consumed verbatim from the joined pass ([../../Designs/efsv2/joined-pass-synthesis.md](../../Designs/efsv2/joined-pass-synthesis.md) JR-1/JR-5). The lens family is topology-blind: nothing in this file computes an authorization grade, and no name above may be repurposed to describe one.

---

## 2. The canonical lens-object encoding (the flagged unwritten keystone)

### 2.1 The ruling: two byte-families, one binding

The review left one open point flagged hardest: strict-CBOR profile vs a simpler fixed ABI-struct encoding, with James's requirement that **the trust list itself be on-chain-representable so a contract can read it**. Decision:

> **ENC-1.** The **Source Revision** and **Effective Lens** are strict deterministic-CBOR fixed-array bytes (the [review §4.2 profile](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), amended below). They are authored, compiled, diffed, and executed **only by clients**; no contract ever parses them.
> **ENC-2.** The **Roster** is a **packed static word-aligned layout** (no CBOR, no ABI dynamic offsets — §2.2). It is the ONLY lens-family byte format a contract decodes, and it is decodable by calldata slicing in a bounded loop.
> **ENC-3.** The Effective Lens commits a **`sliceCommitment`** — a Merkle root over the `RosterId` of every projected (purpose, scope) slice — so a contract can verify a supplied Roster belongs to a claimed `EffectiveLensId` without parsing the CBOR. The projection is normative and round-trips: `project(EffectiveLens, sliceKey) → RosterV1 bytes` is deterministic, and the vectors prove it.

Why this beats both pure alternatives (each weighed, as the mission requires):

- **Pure CBOR everywhere** fails James's steer: a Solidity CBOR parser is per-byte gas plus a fresh attack surface (every strictness rule in [review §4.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) becomes on-chain code), and no deployed EVM policy system does it — Zodiac Roles v2, the strongest shipped compiled-policy-on-EVM precedent, stores flattened packed arrays the compiler produces and the EVM walks ([./research.md](./research.md) §1.2, VERIFIED). The chain consumes compiled artifacts, not authoring formats.
- **Pure ABI-struct everywhere** fails the client side: `abi.encode` of dynamic structures carries offset/padding malleability that would need its own strictness profile (re-deriving everything the CBOR profile already states), is markedly less compact for scope sets and temporal windows, and would make the EVM projection the *primary* language — exactly the "second policy language" inversion [review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) forbids.
- The split gives each tier its native format and pays one binding cost (`sliceCommitment` + projection vectors), which the review already required for the slice-proof path. VERIFIED that this matches review §4.3's "ABI projection must round-trip" clause — ENC-2/ENC-3 make that clause a first-class named object instead of an aside.

### 2.2 RosterV1 — the CORE/CONTRACT artifact (exact layout)

The steer's tier-1 object, designed first. One purpose/scope slice: a small ordered set of trusted principals + keyed resolution, revocation-aware, `PRIORITY_FIRST_PRESENT`-capable, deny-capable, on-chain-representable.

```text
RosterV1 (big-endian, 32-byte words; total = 96 + 64·N bytes exactly)

word 0  header:
  [0]      uint8   version         = 1
  [1]      uint8   combiner        ; 0=EXACT 1=PRIORITY_FIRST_PRESENT 2=UNION_SET
                                   ; 3=ONLY_ONE 4=THRESHOLD  (MERGE deliberately absent: client-only)
  [2]      uint8   relinquishMode  ; 0=FALLTHROUGH_ON_RELINQUISH 1=STOP_ON_FORMER_AUTHORITY
  [3]      uint8   rosterFlags     ; unknown bit ⇒ reject (fail closed)
  [4:6]    uint16  thresholdK      ; 0 unless combiner=THRESHOLD; then 1 ≤ k ≤ approverCount
  [6:8]    uint16  entryCount N    ; 1 ≤ N ≤ 64
  [8:32]   bytes24 reservedZero    ; MUST be zero

word 1  bytes32 purposeId          ; committed purpose (FS_BROWSE, GATE_INSTALL, …)
word 2  bytes32 scopeId            ; commitment to the canonical Scope slice this roster
                                   ; serves; 0 = gate-local unscoped

entries (N × 2 words), strictly ordered by (tier asc, principal bytes asc):
  word A  bytes32 principal        ; full-width stable KEL principal — NEVER truncated
  word B:
    [0:2]  uint16 tier             ; equal tier = equal rank (a set, never byte-order authority)
    [2:4]  uint16 effect           ; 0=AUTHORITATIVE 1=FALLBACK 2=APPROVER 3=DENY_SOURCE
    [4:6]  uint16 entryFlags       ; unknown bit ⇒ reject
    [6:32] bytes26 reservedZero    ; MUST be zero

RosterId = keccak256(DOMAIN_EFS_ROSTER_V1 ‖ rosterBytes)
```

Canonicality (each rule is a rejection vector): exact byte length `96 + 64·N`; all reserved bytes zero; entries strictly increasing by `(tier, principal)`; a principal appears at most once in the whole roster; `THRESHOLD` requires ≥ k APPROVER entries; unknown version/combiner/effect/flag rejects; trailing bytes reject. Because the layout is offset-free and fixed-width, **there is no encoding malleability class at all** — canonical bytes are the only parseable bytes, and the checks are one bounded loop (~N iterations) any Solidity view can run. Deny capability rides `effect=DENY_SOURCE` entries: a gate consults those principals' advisory slots (keyed point reads, [read-lens-spec §3.4](../../Designs/efsv2/read-lens-spec.md) shape carried) and fails closed on a live hit — CORE-tier advisory action is reject-only; warn/hide are client vocabulary. PLAUSIBLE (constructed; needs the vector suite §2.8 and one Foundry decode fixture).

Size check at the design center: 55 entries = 3,616 bytes ≈ 113 storage slots ≈ 2.5M gas to store once via the register-once pattern ([./research.md](./research.md) §1.3 arithmetic, PLAUSIBLE), or ~3.6 KB calldata per supplied-and-verified call; a 5-entry gate roster (the LC-9 modal shape, [./use-pressure.md](./use-pressure.md) §2.2) is 416 bytes. The 64-entry cap is a typed limit: exceeding it fails compilation loudly — larger sets are by construction a materialized/proven view (Level 3 boundary, [review §10](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)), never a silent truncation. `MAX_LENSES = 20` is retired by this cap-plus-budgets structure, not by a bigger constant.

### 2.3 LensSourceV2 — the portable source form (deltas over the review's candidate)

The [review §4.2 wire grammar](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) is adopted as the base — definite-length fixed-position CBOR arrays, integer discriminants, preferred-shortest serialization, no maps/tags/floats, sorted-set canonical order, unknown-critical fails closed, publisher signs the domain-separated digest. Reproduced here only where changed; everything unlisted carries verbatim:

```text
LensSourceV2 = [
  2,                    ; format version (v2 of the candidate grammar)
  semanticsProfileId,   ; bstr .size 32
  purposeId,            ; bstr .size 32
  label,                ; tstr / null — display only, committed, never compared
  authorityRules,       ; [* AuthorityRuleSource]   (unchanged shape)
  advisoryRules,        ; [* AdvisoryRuleSource]    (unchanged)
  discoveryRules,       ; [* DiscoveryRuleSource]   (unchanged)
  imports,              ; [* LensImportSource]      (§6 — field-identical, constraint-tightened)
  resourceProfile,      ; ResourceProfileV2         (§2.7 — right-sized)
  editorHints,          ; bstr / null — committed but NON-SEMANTIC (presentation ordering etc.;
                        ;   changing it changes LensRevisionId, never EffectiveLensId)
  extensions            ; [* Extension]             (unchanged; critical-unknown fails closed)
]

Principal = [0, bstr .size 32]   ; portable v2 profile admits ONLY kind 0 = EFS_KEL32.
                                 ; ERC-1271/contract authors stay banned (JR-4; a later
                                 ; proposal is a semantics-profile change, not a decoder extension)
```

Deltas, each justified: (a) `editorHints` promoted from a footnote to a fixed slot — the review's canonicalization rule 4 demanded a home for presentation-only ordering and this closes it; (b) principal kinds hard-closed to `EFS_KEL32` (the review permitted it; v2 states it); (c) the resource profile is re-sized (§2.7). Everything security-relevant stays fixed-bytes; text remains UTF-8 committed byte-for-byte with no Unicode normalization. VERIFIED against review §4.2's rule list; the delta set is PLAUSIBLE.

`LensRevisionId = keccak256(DOMAIN_EFS_LENS_SOURCE_V2 ‖ keccak256(canonicalSourceBytes))`.

### 2.4 EffectiveLensV2 — the compiled form

```text
EffectiveLensV2 = [
  2,
  semanticsProfileId,
  purposeId,
  compiledSlices,       ; sorted by canonical (purpose, scopeKey); every FOLLOW_CHANNEL
                        ;   resolved away; only execution-affecting bytes
  compiledAdvisories,
  compiledDiscovery,
  sliceCommitment,      ; bstr .size 32 — Merkle root, leaves = keccak256(sliceKey ‖ RosterId)
                        ;   for every slice that projects to a RosterV1 (ENC-3)
  resourceProfile
]

EffectiveLensId    = keccak256(DOMAIN_EFS_LENS_POLICY_V2 ‖ keccak256(canonicalEffectiveBytes))
LensCompilationRecordV2 = as review §4.2 (sourceRevisionRef, effectiveLensRef, profile,
  compilerNormalizerVersion, pinnedImportRevisionRefs, compilationBasis, evidence digest,
  publisherOrAcceptorPrincipal, signature) — carried unchanged, over the V2 IDs
```

Rules carried unchanged and load-bearing: cosmetic/provenance changes never change `EffectiveLensId`; `FOLLOW_CHANNEL` is forbidden in the executed form (compilation locks it — the Nix source/lock distinction); a caller-supplied rank table without the plan, an owner-stored plan, or a slice+proof against `sliceCommitment` is unauthenticated and supports no gate, receipt, or cursor ([review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), VERIFIED). The equal-priority-path overlap rule, lexicographic `[outerMount,…,localRulePriority]` applicability, and compile-fails-on-conflicting-equal-paths all carry verbatim.

### 2.5 Identity and domain constants

One derivation shape for the whole family — `keccak256(DOMAIN ‖ keccak256(canonicalBytes))`, outer domain preventing cross-type digest reuse ([review §4.3 rationale](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), carried): `DOMAIN_EFS_ROSTER_V1`, `DOMAIN_EFS_LENS_SOURCE_V2`, `DOMAIN_EFS_LENS_POLICY_V2`, `DOMAIN_EFS_LENS_COMPILATION_V2`, `DOMAIN_EFS_VIEW_RECEIPT_V2`, `DOMAIN_EFS_CHANNEL_STATE_V2` (§4), `DOMAIN_EFS_RECOVERY_BUNDLE_V1` (§3). Exact hash-suite agility follows the wider deterministic-ID decision (unchanged posture). All IDs are digests, never locators — carriage is §2.6.

### 2.6 Carriage: how the object travels

Adopted from [review §4.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) unchanged, restated as the binding rule set:

1. **Every lens-family object is carried as ordinary EFS DATA** (owner/salt-derived `dataId`); the semantic digest lives in/alongside the carrier. The EFS object ID is never the semantic ID and never replaced by it.
2. **Every public import/link uses the locatable `LensObjectRefV1`** `[venueRef, carrierKind, carrierId, semanticKind, semanticDigest]` — with `semanticKind` extended by one discriminant: `ROSTER` (joining REVISION / EFFECTIVE / COMPILATION / RECEIPT / CHANNEL_STATE). Resolution fetches the carrier at the venue, decodes, verifies the digest. A hash-only reference is legal only for locally-present objects — it is not a bootstrap reference. Channels use `LensChannelRefV1` unchanged.
3. **An EFS LIST is an editor projection only.** A weighted TAG list ("my curators, ordered") is authoring sugar that must pass through the ordinary compiler into a Source Revision; LIST weights/ties acquire semantics **only** via the compiler profile ([review §16 ledger rows](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) on lens-as-LIST and codex-kinds weighted LIST, carried; [../../Designs/efsv2/codex-kinds.md](../../Designs/efsv2/codex-kinds.md) confirms TAG weight=order exists with no lens semantics attached — VERIFIED).
4. **Registered plans (the Story-shaped registry, [./research.md](./research.md) §1.3):** a permissionless `register(rosterBytes | effectiveBytes) → id` store is an OPTIONAL CORE convenience — registration never blesses (the gate owner still pins the id), and it is state-growth priced by gas like everything else. PLAUSIBLE; E2-bundle priced.

### 2.7 Size and limits, right-sized to the 15–55 center

The review's reference profile was sized for 256 expanded principals (256 KiB source / 512 KiB compiled / depth 8). Re-centered — with the E6 portable ceiling kept as *compile-time headroom*, not the design center:

```text
ResourceProfileV2 (recommended reference values — benchmark-gated, E6/E2):
  maxAuthorityPrincipalsPerRule   64      ; = the RosterV1 cap; typed failure past it
  maxEffectivePrincipals          256     ; compile-time portable ceiling (E6 pending)
  maxRules                        128     ; down from 1024
  maxAdvisorySourcesPerRule       8       ; measured labeler reality (research §5.1)
  maxAdvisorySourcesPerPolicy     32
  maxImportDepth (authority)      2       ; LEAF_ONLY default; ALLOW_NESTED needs explicit depth
  maxImportDepth (advisory/disc.) 4       ; halved from the review's hard 8
  maxImportNodes / maxImportEdges 32 / 64
  maxSourceBytes                  64 KiB  ; down from 256 KiB
  maxCompiledBytes                128 KiB ; down from 512 KiB
  maxCompileWork                  explicit bounded profile (benchmark value, not a guess)
```

Rationale: at 55 entries a full multi-rule source with imports fits comfortably under 16 KiB (55 principals ≈ 1.9 KiB of entry bytes; scopes/windows dominate); 64 KiB is 4× headroom without inviting the imported-blob anti-pattern ([./use-pressure.md](./use-pressure.md) §2.3 breakage 3 — human legibility fails before bytes do). Authority-import depth 2 is SCALE-2's watch item made structural: friends-of-friends cannot creep in through nesting because the compiler rejects it, while a friend's *published* View imports cleanly at depth 1 (subscription to an explicit object, not transitive trust). Every limit failure is a typed error; nothing anywhere truncates. What breaks past 55 is not restated here — [./use-pressure.md](./use-pressure.md) §2.3 owns it; the encoding's contribution is that the CORE cap (64) and the compile ceiling (256) are *different numbers doing different jobs*, and conflating them was the old MAX_LENSES mistake. All numbers PLAUSIBLE (benchmark-gated).

### 2.8 Golden-vector obligations (the price of two byte-families)

Cross-language (Solidity, Rust, TypeScript minimum — the Cedar-style differential-conformance method, [./research.md](./research.md) §4.2):

1. Canonical encode/decode for RosterV1, LensSourceV2, EffectiveLensV2, CompilationRecordV2, ChannelStateV2 — fixed expected bytes + IDs for empty/one-rule/max-profile instances.
2. **Rejection vectors per strictness rule:** non-shortest CBOR ints, indefinite lengths, unsorted sets, duplicate principals, wrong-length arrays, trailing bytes, nonzero reserved bytes (Roster), unknown version/combiner/effect/flags/critical extensions, THRESHOLD with k>n, contradictory temporal windows.
3. **Projection round-trip:** `project(EffectiveLens, sliceKey) → RosterV1` byte-exact in all three languages; `sliceCommitment` membership proofs verify on-chain (one Foundry fixture); a Roster that decodes but fails membership is rejected by the gate.
4. The import matrix (`referenceMode × importClass × transitivity`) compile vectors and diamond/cycle/depth failures — carried from [review §19.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), re-cut over V2 bytes.
5. The dictionary-attack demonstration vector (§5.2) and the arrival-permutation channel vectors (§4.6).

### 2.9 How the encoding breaks

| Attack | Answer | Residual |
|---|---|---|
| CBOR malleability (same semantics, different bytes → two IDs) | the strict profile admits exactly one encoding; decoders reject rather than normalize; vectors 2.8.2 | a buggy lenient decoder in some third-party tool creates local confusion, never protocol state — its IDs simply won't match |
| ABI-side malleability | RosterV1 has no offsets, no padding freedom, no dynamic heads — canonical bytes are the only parseable bytes | none identified (PLAUSIBLE until the Foundry fixture) |
| Projection skew (Roster diverges from the CBOR slice it claims) | the projection is normative + vectored; `sliceCommitment` binds; conforming runtimes recompute | a gate that pins a bare RosterId without a plan binding gets exactly what it pinned — correct, and the SDK templates say so |
| Semantic-ID-as-locator confusion | carriage rule 2: every public ref is locatable; hash-only refs are non-bootstrap | a stale carrier (venue pruned the DATA) is an availability failure, never absence — tuple axis honesty |
| Editor-projection laundering (a weighted LIST treated as policy) | carriage rule 3: LISTs compile or they are nothing | UI that renders a LIST *as if* live policy — string-catalog ban (§1.2) |

---

## 3. Device-loss survival

### 3.1 The Recovery Bundle — a typed export format

CXF-shaped ([./research.md](./research.md) §6.1: typed entries, unknown-type preservation for third-party round-trip, **explicit ceremony per export/restore** — the industry's now-mainstream answer): `RecoveryBundleV1`, deterministic-CBOR under `DOMAIN_EFS_RECOVERY_BUNDLE_V1`, containing typed entries for the [review §11.4 list](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), verbatim adopted and typed:

1. every personal **Source Revision** + channel names/petnames/purpose labels;
2. pinned dependency revisions and import modes (the lock graph);
3. compiled **Effective Lens** bytes + last-accepted `EffectiveLensId` per purpose;
4. policy-update history + **rollback/security floors** (per-channel monotone `(authEpoch, generation)` floors, §4.5);
5. device/app delegation **references** (grant IDs + descriptors — the grants themselves are KEL state, not bundle payload; the bundle never becomes a second authority store);
6. local overrides + advisory **Action Maps**;
7. venue high-watermarks/bases needed to resume sync;
8. resolver/semantics-profile versions;
9. the **Private Handle table** (handle ↔ deterministic ID map — this is what keeps §5's oracle closed after restore);
10. recovery instructions + integrity metadata (bundle sequence number, export basis, self-digest).

### 3.2 Where it lives, and what restores with no EFS-operated service

- **Tier ruling:** the bundle is an encrypted EFS DATA object in the privacy pass's **`private-recoverable` tier** — phrase/escrow-backed by design, **never shreddable** ([../../Designs/efsv2/privacy-pass-synthesis.md](../../Designs/efsv2/privacy-pass-synthesis.md) PC-4). Justification: losing local policy must not silently reinstall an app default that changes what the user sees or trusts (review §11.4's closing rule, carried) — a lens policy is therefore recoverable-class *by definition of its threat model*. A user who wants a shreddable view configuration is running a separate persona (separate KEL, separate bundle), not a flag.
- **Discovery on restore:** the bundle pointer rides the privacy pass's **owner self-escrow index (F-4)** — the already-ruled structure whose purpose is "recovery never replays history" ([privacy-pass-synthesis PC-7](../../Designs/efsv2/privacy-pass-synthesis.md)). No new reserved row is minted. Fallback path with zero extra state: owner self-enumeration (E4 — roots-forward walk) finds the bundle DATA like any owned object. VERIFIED that both structures exist in the ruled set; the specific piggyback is PLAUSIBLE (one line owed to the F-4 spec owner).
- **The restore walk, end to end, EFS-service-free:** phrase/escrow → KEL recovery (independent outcome, KEL's machinery — [kel §10](../../Designs/efsv2/kel.md)) → archive-key recovery unwraps the bundle DEK → fetch bundle ciphertext from any mirror/chain by content commitment → decrypt, verify self-digest → re-verify every pinned revision by semantic digest via its locatable ref → **re-pin against live chain state**: read each subscribed channel's `channelAnchorSummary` at a fresh basis, replay the update ceremony for anything newer than the bundle, recompute floors as `max(bundle floor, chain-observed floor)`. Every step uses ordinary venue state + the mandatory index bundle; no EFS-operated endpoint appears anywhere in it (LC2-6 conformance: the SDK ships no default relayer — carried).

### 3.3 The honest line: what the phrase alone does NOT restore

Stated for the packet, coupled to the privacy pass's caveat:

- **Accepted inbound shares do not survive phrase-only recovery** until JD-32's standing recovery-KEM entry and fixture land ([privacy-pass-synthesis](../../Designs/efsv2/privacy-pass-synthesis.md) §1 PC-2 amendments / kill #23 — VERIFIED). A restored lens can *name* a friend's shared folder and be structurally unable to decrypt it; the walk-away claim must exclude it meanwhile. The lens pass adds no machinery here — it inherits the gap and must not paper over it.
- Anything never exported: policies authored after the last bundle, local drafts, un-exported Private Handles (those policies survive only if their ciphertext objects are independently discoverable via F-4/E4 — else they are gone and the restore ceremony says so, listing what it could not find).
- Scan/mailbox cursors: not lost, re-derived by self-scan (PC-7) — cost, not loss.
- **The phrase restores identity + recoverable ciphertext. It does not restore the *currency* of trust:** the bundle is a snapshot, and §3.4 is what keeps that honest.

### 3.4 Recovery-bundle staleness (the breakage pair)

Attack: an adversary (or accident) restores an OLD bundle — one that still trusts a since-ejected curator, or carries a lower security floor that would re-accept a rolled-back channel revision.

Answers, in order of force: (1) **floors are max-merged with chain state** — the channel anchor's admitted-state set and epoch are venue facts at a fresh basis, so a stale bundle floor cannot roll back what the chain already shows (the on-chain anchor is the anti-rollback root; the bundle only ever *raises* local floors); (2) the restore ceremony is a **mandatory semantic-diff ceremony** ([review §13.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) between the bundle's policies and current channel heads — restored-then-changed trust is shown, not silently re-adopted; (3) bundle sequence numbers + export basis make "you are restoring bundle 41 of an identity whose F-4 index shows 47" detectable. Residual, stated plainly: a user who restores an old bundle **and** declines the ceremony **and** whose newer bundles were never written has genuinely reverted their own trust — that is data loss honestly surfaced, not a protocol failure. PLAUSIBLE (ceremony construction; needs a restore fixture).

---

## 4. Channels under KEL — the seam-8 closure

### 4.1 What survives from `ChannelStateV1`, what is deleted

The [review §4.4 channel protocol](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) solved fork-visibility and bounded bootstrap but minted a second identity system. The seam-8 ruling direction ([../../Designs/efsv2/human-overview.md](../../Designs/efsv2/human-overview.md) §7.8) is applied literally:

| `ChannelStateV1` element | Disposition | Where the job went |
|---|---|---|
| `channelId` (controller+domain+salt) | **survives** | unchanged; salt keeps unannounced channels unlisted (§5) |
| `generation`, `previousStateRef`, parent-linked admission, arrival-order independence | **survive** | lens-specific state — exactly what seam 8 says the channel keeps |
| fork detection → `CHANNEL_CONTESTED` sticky | **survives** | §4.3 |
| `tombstone` (stop-following, never fall back to a default) | **survives** | terminal per epoch; §4.3 |
| subscriber rollback floors | **survive** | re-keyed to `(authEpoch, generation)` — §4.5 |
| `controlEpoch` (channel-local) | **DELETED** | the KEL `authEpoch` on the admission receipt ([kel §8.2](../../Designs/efsv2/kel.md) `EnvelopeAuthReceiptV1.authEpoch`) |
| `recoveryProfileId`, `recoveryEvidenceRef`, frozen channel recovery verifiers, `ChannelEpochCheckpointV1` | **DELETED** | KEL recovery/rotation ([kel §6/§10](../../Designs/efsv2/kel.md)); no channel-local recovery exists at all |
| channel-local signature/controller-rotation rules | **DELETED** | ordinary envelope actor signature under a KEL grant; controller rotation is invisible to the channel (the principal is stable) |
| any second guardian root | **never existed after this recut** | — |

### 4.2 `ChannelStateV2` — an ordinary authority-admitted claim

```text
ChannelStateV2 = [
  2,
  channelId,            ; bstr .size 32 = keccak256(DOMAIN_EFS_CHANNEL_V2 ‖ controller ‖ salt)
  stateKind,            ; 0=GENESIS 1=ADVANCE 2=ADOPT 3=RESET 4=TOMBSTONE
  generation,           ; uint; GENESIS/RESET = 0, ADVANCE/ADOPT = parent max + 1
  sourceRevisionRef,    ; LensObjectRefV1 → the head Source Revision (null for TOMBSTONE)
  parentRefs,           ; [0..2 × stateDigest] — 0 for GENESIS/RESET, 1 for ADVANCE/TOMBSTONE,
                        ;   exactly 2 for ADOPT (the two contested branch heads)
  channelFlags          ; unknown bit fails closed
]
```

There is **no signature field and no controller field in the state itself**: a `ChannelStateV2` is the body of an ordinary claim by the controlling principal, admitted through the authority lane like any record. Its authorization is the envelope's `authorityId` grant; its epoch is the admission receipt's `authEpoch`; its ordering evidence is the home admission ordinal. "Someone signed this" is insufficient for a gate-consumed head after actor removal — and now structurally cannot occur, because channel currency is read from admission receipts, not from portable signatures (closes the seam-8 second paragraph). VERIFIED against [kel §8](../../Designs/efsv2/kel.md) shapes; the claim-body packaging is PLAUSIBLE (needs the reserved channel definition row in the kinds recut).

### 4.3 Epochs, forks, and repair — reusing KEL control exactly

- **Channel epoch := the `authEpoch` under which a state was admitted.** Not stored in the state; read from `EnvelopeAuthReceiptV1`. One fact, one owner.
- **CONTESTED:** two admitted children of one parent at the same epoch (or two same-epoch GENESIS/RESET states) make the current epoch `CHANNEL_CONTESTED` — sticky regardless of arrival order; following stops; no head is invented (carried from the review verbatim).
- **Honest-race repair — `ADOPT`:** a two-parent state at the *same* epoch naming both contested heads resolves CONTESTED → ACTIVE at the adopt head. Any currently-authorized actor can issue it (a thief with a live current key could adopt its own branch — but such a thief can already publish heads; adoption grants nothing extra, and the ceremony diff shows the adopted content).
- **Compromise repair — `RESET`:** a zero-parent state admitted at `authEpoch` strictly greater than every contested state's epoch seals all lower-epoch states for current-head selection (they remain admitted audit history). Because **v1 `ROTATE` always bumps `authEpoch`** ([kel §6](../../Designs/efsv2/kel.md), VERIFIED), the repair ceremony for a forked channel is exactly one KEL rotation + one RESET claim — the channel reuses KEL's control transition as its fork-recovery authority, which is seam 8's ruling made mechanical. A full KEL recovery (also epoch-bumping) repairs channels for free as a side effect, fleet-wide, O(1).
- **Competing RESETs** at the same new epoch contest that epoch (same rule, one level up). **TOMBSTONE** is terminal within its epoch; only an epoch-bumped RESET can deliberately revive a channel — un-tombstoning is thus exactly as loud as compromise recovery, by construction.
- **Kernel state:** `channelAnchorSummary(controller, channelId)` survives in the mandatory bundle ([../../Designs/efsv2/onchain-completeness.md](../../Designs/efsv2/onchain-completeness.md) posture; [human-overview §7.16](../../Designs/efsv2/human-overview.md)) with one field amendment for the recut: `controlEpoch` → `headAuthEpoch` (the admission epoch of the unique head). Summary = `{status: EMPTY|ACTIVE|CHANNEL_CONTESTED|TOMBSTONED, head ref/digest/generation, headAuthEpoch, last unambiguous state, order-independent admitted-state-set root, basis}`. A fresh subscriber bootstraps current head + fork status from this bounded summary at one basis, state-proof grade — no history replay, no indexer (the LC-16 fresh-L3 sentence, [./use-pressure.md](./use-pressure.md) §4, stands). The author-signed checkpoint reference is dropped from the summary: checkpoint-grounded anything is dead (kill list), and the anchor is venue state, which is strictly stronger.

### 4.4 Grant-scoped channel administration

A curator team runs a channel without sharing control keys, via [kel §7.2](../../Designs/efsv2/kel.md) verbatim: a grant whose `resourceScopes` names the channel (`EXACT_ID` = the channel anchor id) and whose `actionSet` carries the new closed actions `CHANNEL_ADVANCE` (publish ADVANCE/ADOPT states) and — separately grantable — `CHANNEL_TOMBSTONE`. `RESET` is **never grantable**: it requires an epoch bump, which only control transitions produce; therefore a stolen session/admin actor can fork or advance a channel but can never seal history or survive a rotation. `AudienceScope` + expiry + `maxUses` bound the blast radius exactly as for any actor; recovery bumps `authEpoch` and the entire channel-admin fleet dies O(1) (kel §7.2's own property, inherited free). VERIFIED shapes; the two action names are PLAUSIBLE additions to the closed action set (kinds/KEL recut item).

### 4.5 Subscription semantics

- **Pin vs follow:** `PINNED_REVISION` imports an immutable Source Revision; `FOLLOW_CHANNEL` is source-form convenience that compilation locks to the observed head (Compilation Record records the lock — §2.4). No resolver dereferences a live channel mid-read. Carried unchanged.
- **Update polarity is role-specific** ([review §5.4 table](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), adopted normatively): the old read-lens-spec §4.5 default "live-follow removals, prompt on additions" is **dead** — removing a high-priority author can expose a malicious lower value, so namespace-authority removals get semantic-impact preview; adding a deny source can be fail-safe auto-adopted where the owner preauthorizes; discovery-only additions may auto-follow within budget. The ceremony shows affected scopes, principal/priority changes, newly-reachable fallbacks, representative changed positions — hash diffs are not a trust ceremony.
- **Subscriber floors:** each subscriber records the exact observed head and a monotone `(authEpoch, generation)` floor (lexicographic); advance only to the unique child at a later basis; RESET is a loud ceremony (it is, by construction, evidence that control acted); ADOPT is an ordinary diff. A cached View naming a channel re-pins only at generation boundaries ([filesystem-core §6.2](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md), carried).
- **Generations of the consuming mount/View** and channel generations compose but are distinct counters — the mount's five-part identity names `EffectiveLensId` + acceptance floor, so a channel advance enters a mount only through recompilation at a generation swap.

### 4.6 How channels break (the fork-race pairs)

| Race | Outcome | Why it is honest |
|---|---|---|
| Curator equivocates: different heads to different subscribers | both admitted → `CHANNEL_CONTESTED` sticky; following stops for everyone | detection not prevention — carried posture; the anchor's admitted-set root makes the fork provable to a third party |
| Stolen admin actor publishes a hostile ADVANCE before revocation | subscribers who accepted it keep it until the ceremony diff (their declared policy); controller revokes grant, rotates, RESETs | the theft window equals grant-revocation latency — the same D-2/P-5r2 parameter that bounds every authority window; nothing channel-specific to fix |
| Thief races the RESET with its own RESET | both at the new epoch → that epoch contests; controller rotates again | a thief who can keep producing epoch-N+k admissions holds current control keys — that is a KEL compromise, and the channel correctly refuses to out-decide the KEL |
| Two honest devices race an ADVANCE | same-epoch fork → CONTESTED → either device ADOPTs both heads | one extra ceremony; no rotation needed; converges under every arrival permutation (vector obligation: the review §19.1.10 permutation suite re-cut for GENESIS/ADVANCE/ADOPT/RESET/TOMBSTONE) |
| Subscriber offline across a RESET | floor comparison `(authEpoch, gen)` accepts the reset head as strictly higher; ceremony shows it as a control event | rollback within an epoch stays impossible; the floor is monotone across epochs |

PLAUSIBLE (state machine constructed; the permutation vectors are the check — same discipline the V1 protocol carried).

---

## 5. Personal vs published — the seam-12 closure

Normative rules PP-1…PP-6; each names its attack.

**PP-1 — Personal instances are local/encrypted by default.** Authoring, compiling, or *using* a Lens never publishes source, effective bytes, or membership as a side effect. The reference OS resolves from a local replica or bulk authenticated snapshots by default; if a remote RPC is used, the client discloses that the provider learns the queried principals ([human-overview §7.12](../../Designs/efsv2/human-overview.md), carried — including its OHTTP honesty: no funded relay/gateway pair exists; until one does, local replica and snapshots are the strong modes).

**PP-2 — Private local handles; no deterministic-ID dictionary oracle.** The deterministic `EffectiveLensId` is computed and used *inside* the resolver/cache; a private store exposes only the randomized **Private Handle**. An unsalted digest over a small guessable membership set is a dictionary oracle — an observer enumerates plausible friend/labeler sets offline and matches the hash ([review §11.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), VERIFIED). A secret salt only helps while secret, so it cannot make a public citation both reproducible and membership-private: **publishing an `EffectiveLensId` or a Receipt is deliberate disclosure of the plan**, and the share ceremony says so (LC-13's mis-served row). Vector obligation: the dictionary-recovery demonstration (§2.8.5).

**PP-3 — Published curation is speech: a deliberate, signed, authority-admitted editorial object.** A public curator Lens/Channel revision carries the [review §12.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) disclosure list, extended by one measured item: (1) author/publisher principal; (2) purpose and scope; (3) exact Source Revision + Effective Lens refs; (4) change history; (5) conflict/update rules; (6) sponsorship/operator relationship; (7) intended consumption class — discovery / authority / advisory / gate; (8) **paid-inclusion policy** — monetized curation arrived in production within a year of open feeds ([./research.md](./research.md) §5.4 Graze evidence), so the read-lens-spec §4.5 disclosure survives the recut as a curator-manifest field. Gate-consumed revisions require authority-admitted authorization, not portable signatures (§4.2 gives this structurally).

**PP-4 — Starter Packs are publications, not defaults.** Genesis ships no protocol lens; a client's shipped starter policies are published, inspectable, forkable EFS objects under the same disclosure list (LC2/LC6 conformance carried); plural packs are shown without a hidden universal tail ([review §12.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). Adoption forks or pins — the user's instance is thereafter personal (PP-1) unless they deliberately subscribe (then §4.5 governs updates).

**PP-5 — The guest path needs no personal policy, ever.** The no-account viewer runs entirely on the ambient owner baseline + published Starter Packs/Views + declinable sender hints ([./use-pressure.md](./use-pressure.md) LC-12, VERIFIED) — which makes this seam the guest product's load-bearing wall, and is why publication (PP-3/PP-4) gets first-class encoding rather than an afterthought.

**PP-6 — No publication path is implicit.** Personal and published objects never share a storage/derivation path such that a bug or a default publishes a personal instance ([review §19.6.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) conformance test, carried): personal = encrypted DATA + Private Handle + F-4 escrow (§3); published = plaintext DATA + authority-admitted revision + Channel. The two constructors are different API calls with different ceremony copy. Fleet/persona trust configuration additionally stays in client-config per the privacy pass's JD-25 carve-out ([../../Designs/efsv2/privacy-pass-synthesis.md](../../Designs/efsv2/privacy-pass-synthesis.md) PC-8 — VERIFIED); a persona-linking lens row is rejected there and stays rejected here.

---

## 6. Import/composition encoding (what the profiles/composition lane consumes)

The three orthogonal dimensions are carried field-identical from [review §5.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), with V2 constraint tightenings marked ▲:

```text
LensImportSource = [
  mountPriority,        ; uint — next lexicographic priority-path component
  referenceMode,        ; 0=PINNED_REVISION  1=FOLLOW_CHANNEL (compile-time locked; §4.5)
  targetRef,            ; LensObjectRefV1 (mode 0) / LensChannelRefV1 (mode 1) — kind must match mode
  importClass,          ; 0=AUTHORITY_RULES 1=ADVISORY_RULES 2=DISCOVERY_RULES — a firewall:
                        ;   importing one class NEVER imports another, at any depth
  transitivity,         ; 0=LEAF_ONLY  1=ALLOW_NESTED — nested traversal follows ONLY
                        ;   same-class child edges under remaining depth/scope/work bounds
  Scope,                ; intersected with every imported rule's scope (below)
  maxDepth              ; uint ▲ authority: LEAF_ONLY default, ALLOW_NESTED ⇒ maxDepth ≤ 2
                        ;        advisory/discovery: ≤ 4
]
```

Composition algebra the lane can rely on (all carried, none weakened): every imported rule receives `intersection(parentImportScope, childRuleScope)`; per-dimension empty intersection grants nothing; wildcards are explicit, omission never means "all"; **temporal is the one conjunction exception** — same-`(clockDomain, domainRef)` windows tighten to their intersection, different-domain windows remain independent predicates, contradictory same-domain intervals grant nothing, and `temporal = []` means unrestricted; numeric budgets attenuate to the stricter remaining bound; attenuation never changes a rule's class, label definition, action table, or discovery mode into a more powerful one; equal compiled priority-paths with different semantics fail compilation; cycles reject before expansion; diamonds memoize and bounded work rejects exponential expansion. The compiler additionally emits the **exemptions ledger** ([./research.md](./research.md) §7.2, adopted): the diffable list of scopes reachable in the consuming View that no authority rule covers — surfaced at the update ceremony, so composition gaps are acknowledged instead of silent.

▲ The one V2 tightening is the authority-depth cap (SCALE-2 structural guard, §2.7). A friend's published View still imports at depth 1; a curator-of-curators pack still compiles at depth 2; friends-of-friends web-of-trust cannot enter through this door, and the field evidence for keeping it out is now recorded ([./research.md](./research.md) §5.3 Nostr WoT — the oracle failure observed in the wild). The future-safe hook remains exactly: an application may *publish a resulting explicit policy* which users deliberately import — scores never enter kernel semantics.

---

## 7. Consolidated breakage table (this lane's objects only)

| # | Break | Section that answers it | Residual honestly carried |
|---|---|---|---|
| 1 | Encoding malleability (CBOR or ABI side) | §2.9 | none identified pending vectors |
| 2 | Dictionary attack on effective IDs | §5 PP-2 | public citation ⇒ plan disclosure, by user choice |
| 3 | Projection skew Roster↔plan | §2.9 | bare-RosterId gates get exactly what they pinned |
| 4 | Channel fork races (5 variants) | §4.6 | equivocation detected not prevented; theft window = revocation latency |
| 5 | Recovery-bundle staleness/rollback | §3.4 | user may decline the ceremony; loss is surfaced, not silent |
| 6 | Inbound shares lost on phrase-only restore | §3.3 | inherited JD-32 gap; walk-away claim excludes it until fixed |
| 7 | Starter-pack monoculture | §5 PP-4 + review §12.2 | defaults still dominate socially; plurality is operational, not guaranteed |
| 8 | Import-depth trust creep | §6 ▲ | a *published* aggregation can still be socially over-trusted — disclosure (PP-3), not prevention |
| 9 | LIST-as-policy laundering | §2.6 rule 3 | UI string-catalog discipline required |

---

## 8. Reconciliation and routing

### 8.1 Rulings check (no pushback required)

Checked against every adopted ruling in the rails: mandatory indexing (consumed — §4.3 anchor, §3.2 E4/F-4); no collision bit (untouched; channel CONTESTED is channel state, not a slot bit); contracts-read-public-only (Roster/GATE consume public state; personal policies never reach contracts); chains-don't-die (no dead-chain machinery anywhere above); six-part tuple + fixed authorization labels (§1.3); four absence sources (§4.3 drops the checkpoint ref *because* of it); FS-LENS/1 (consumed §1.1, never reopened); KEL-principal entries (§1.1 Principal row, SCALE-1); seam-8 direction (§4 implements it); no-default-lens + risk-bearer (§5); no MVP/freeze claims (§0). Kill-list scan: no checkpoint-grounded absence, no global same-order equivocation, no MUST-pull-home, no preferredTier, no two-label grades, no 160-bit truncation (RosterV1 word-width principals), no silent truncation (typed caps), no discovery-into-resolution, no caller-supplied gate policy, no cross-author latest-wins, no reputation scores. VERIFIED by direct comparison this pass.

### 8.2 Items routed onward

- **Kinds/kernel recut:** the reserved channel-definition row + `CHANNEL_ADVANCE`/`CHANNEL_TOMBSTONE` grant actions (§4.2/§4.4); `channelAnchorSummary` field amendment `controlEpoch → headAuthEpoch` (§4.3); the Roster/plan registry as an E2-priced optional (§2.6.4).
- **Privacy/F-4 owner:** the bundle-pointer piggyback line (§3.2); JD-32 remains the walk-away gate (§3.3).
- **Profiles/composition lane:** consumes §2.2 (RosterV1), §2.4 (`sliceCommitment`), §6 verbatim; GATE purpose profiles build on the Roster without re-encoding it.
- **Conformance program (G-D / Phase 1):** the §2.8 vector suite + §4.6 permutation suite + §3.4 restore fixture, under the differential-conformance method.
- **E6:** every number in §2.7 is its evidence input, not a freeze claim.
- **New for James (small):** none beyond the standing packet — this lane deliberately surfaces no new owner decision; the two shaped-for-owner items it touches (E6 ceiling, P-16 profiles) already exist in [../../Designs/efsv2/owner-decision-inbox.md](../../Designs/efsv2/owner-decision-inbox.md).

---

## 9. Confidence

**VERIFIED (read directly this pass):** the full 2026-07-11 review (five identities, §4.2 grammar + canonicalization rules, §4.3 compiled-plan/slice rules, §4.4 channel protocol V1, §4.5 receipt, §5 imports/limits/polarity, §11.2/§11.4 privacy+recovery, §12 defaults/curation, §17.6/§18 freeze package); read-lens-spec (banners, salvage set, LC1–LC6, §4.5, §6 grammar); FS-LENS/1 §§1–8 + five-part identity + generations; joined-pass-synthesis JR-1..10 + D-ledger + kill list; kel.md §5 (control state), §6 (ROTATE always bumps authEpoch — the §4.3 load-bearing fact), §7 (grants/scopes), §8 (receipts/authEpoch), §9; owner-rulings (every entry cited); owner-decision-inbox (held/settled/superseded lists); onchain-completeness Line; human-overview §7 seams 6–9, 12, 16; privacy-pass-synthesis PC-2/4/7/8 + kill #23 (JD-32) + JD-25 carve-out; codex-kinds (TAG weight, reserved-row discipline); research.md and use-pressure.md in full; the 96+64·N size arithmetic and §2.2 gas scalings (schedule arithmetic).

**PLAUSIBLE (constructed here; vectors/benchmarks are the check):** the RosterV1 layout and its no-malleability claim; the ENC-1/2/3 split as stated (the review permits it; the specific binding is mine); every §2.7 number; the ChannelStateV2 machine (ADOPT/RESET semantics, epoch-from-receipt) and its convergence under arrival permutations; the CXF-shaped bundle typing and the F-4 piggyback; the restore/staleness ceremony; the View = identity+presentation packaging; the two grant action names; the taxonomy's never-confuse column as a complete list.

**Could not verify:** any real-kernel gas number (E1/E2 open — all cost lines are schedule arithmetic or interpolation, per the standing "none of the chain/authority space is measurement-backed" caveat); the exact F-4 wire shape (cited via privacy-pass-synthesis, not read from the freeze-reservation text); privacy-james-decisions JD-32's current draft text (cited via the synthesis's kill #23); whether `channelAnchorSummary` survives E2 pricing (named conditional, carried from the register); the kinds-recut feasibility of the reserved channel row (routed §8.2); [[assumptions-and-requirements]] row-level cross-check beyond §11 D-10/D-13 (read directly) — the same debt the sibling lanes recorded.
