# EFS Arcade — v2 pressure and migration report

**Status:** draft
**Target repos:** planning
**Depends on:** [[playable-archive-requirements]], [[apps-cookbook]], [[boot-and-profiles]], [[packages-and-updates]], [[kernel-capability-model]], [[deterministic-ids]], [[Designs/arcade/owner-decision-inbox|owner-decision-inbox]]
**Last touched:** 2026-08-12 — correction banner over 2026-08-07 pass

#status/draft #kind/design #repo/planning #topic/games #topic/arcade

> **Initial-pass draft:** the EFS 1.5 migration frame below is historical.
> GameProject, immutable GameRelease, ArtifactManifest, curator selection,
> locator, and runner policy remain application-profile pressure, but Arcade now
> targets [[../efsv2/system-constitution|EFS 2.0 Core]] behind a provisional
> adapter. There is no v1 migration or durable EAS-bridge seed requirement.

## Historical purpose and posture

The initial pass proposed a labeled public demo on the v1 Sepolia stack. That
proposal is superseded as current implementation scope, but this remains a
**pressure instrument**: each workaround is evidence, a named gap, or debt.
This historical document does three things and nothing else:

1. Classifies every load-bearing Arcade element against v2 (§1).
2. Routes each pressure finding TO the design doc that owns it (§2). This doc **decides nothing** — findings are evidence for the owning docs' authors, several of which touch owner-level rulings.
3. States what the Arcade must NOT do to v2 under deadline pressure (§3).

Two standing facts frame everything (both verified this pass): v1 is officially "evidence, not baseline" and v2 plans to supersede the v1 schema/UID set ([memory + Milestones, restated in the falsification lane](../../Reviews/2026-08-07-arcade-corpus/research-alternatives-and-falsification.md) Q3, grade A); and in [the EFS v2 owner inbox](../efsv2/owner-decision-inbox.md) **N5 is undecided** — the playable archive is NOT yet the joined-system reference app. The Arcade generates evidence for that decision; it does not make it.

## 1. Mapping table: v1 Arcade elements against v2

Classifications: **SURVIVES** (unchanged), **ADAPTER** (needs adapter/migration), **DISPOSABLE** (deliberately disposable v1 workaround), **COVERED** (existing v2 primitive already covers it), **SPEC-DEBT** (exposes existing spec debt), **MISSING** (genuine missing capability — named failing acceptance test required).

| v1 Arcade element | Class | v2 story + evidence |
|---|---|---|
| Stable `/arcade/<slug>` + anchor-path share URLs | **ADAPTER** | v2 recut supersedes v1 UIDs; path names survive as petnames but the resolving substrate changes. Needs the portable-ID forwarding story in [[deterministic-ids]] + [[efs-v2-transition-plan]]. Failing test named in §2a. |
| DATA identities (EAS UIDs on Sepolia) | **ADAPTER** | v1 UIDs are chain-bound EAS artifacts; v2 record IDs are deterministic and client-computable ([[deterministic-ids]]). Every on-chain star/curation claim targeting a v1 UID needs a mapping record at recut time. |
| `contentHash` = `f1220` sha-256 PROPERTYs | **COVERED** (value) / **SPEC-DEBT** (v1 data) | The canonical multihash convention (contracts specs/10, James-ratified ADR-0064) is exactly v2's byte-commitment shape. But 67 durable Sepolia files carry non-canonical `0x`-keccak values and **zero conformant writers exist** ([verification-contenthash-writers](../../Reviews/2026-08-07-arcade-corpus/verification-contenthash-writers.md) §1–3, grade A). Reconciliation order is defined there; the datasets seeder fix is THE gate before durable re-seeding. |
| `ipfs://` MIRRORs (+ CIDv1 `cid` PROPERTY) | **COVERED** | Generic v2 mirror/placement facts. v1 debt: exactly one mirror per file was attested, origin = one devnet VPS Kubo node ([verification-games-deployment](../../Reviews/2026-08-07-arcade-corpus/verification-games-deployment.md) §2, grade A/B). Mirror plurality is operational work, not protocol work. |
| Curator content lens (`EFS_CONTENT_LENS` 0x11CbE1…9912 in the default chain) | **COVERED** | v2 lens-as-LIST / [[read-lens-spec]] subsumes it; curation claims migrate as curator collections without discarding history. See also §2g for where the lens model does NOT fit. |
| Sandboxed-iframe compat runner (`sandbox="allow-scripts"`, never `allow-same-origin`) | **MISSING** (at the ruling level) | The clientv2 kernel forbids iframe-hosted app logic (Ring-3 = SES worker; iframes = render service for untrusted *documents* only — [[kernel-capability-model]] "Why iframes are demoted"). A game is untrusted *app logic* in an iframe. PAF-5's open question asks v2 to approve or defer the isolated compatibility lane explicitly. §2c. |
| giscus comments + periodic EFS archiver | **DISPOSABLE** | Deliberate, labeled workaround (this pass's recommendation, owner decision pending). The native path is blocked on real v2-era machinery (§2d), not on schema shapes. The archive job preserves the corpus so migration discards nothing. |
| GitHub data-repo curation workflow (PR intake + fixed seeder) | **DISPOSABLE** | osgameclones-shaped trusted workflow for September; migration path = curation claims move on-chain (curator LISTs, lens-scoped claims) post-September. Contributor history survives via git + archived receipts. |
| Burner-session on-chain star (single TAG via PR #39 flow) | **ADAPTER** | TAG-slot like/follow algebra is already blessed in [[apps-cookbook]] (social feed row). What breaks at recut: the star targets a v1 DATA UID and the burner attester identity is v1-bound. Stars are low-value enough to accept loss, but say so in product copy. |
| Committed deployment receipts | **MISSING** (convention) | Zero receipts committed for the June 2026 Sepolia seed; the chain itself is the only record ([verification-games-deployment](../../Reviews/2026-08-07-arcade-corpus/verification-games-deployment.md) §1, grade A). Routes to the `.efs-bundle` / conventions-registry ask, §2h. |
| Static-export Next.js shell + guest read path (viem publicClient, baked addresses, hardcoded lens list) | **DISPOSABLE** | The v1 explorer boot it bypasses is itself the evidence (§2b). v2 replaces the whole shell with Bootstrapper + Kernel slice + minimal viewer closure ([[boot-and-profiles]] §3). The Arcade's guest path is a hand-rolled preview of exactly that architecture. |
| Single-file `PlayablePackage` profile (profile 1 = one `index.html`) | **ADAPTER** → **COVERED** | Deliberately the degenerate case of v2's closure manifest ([[packages-and-updates]] §3, PAF-2). Multi-file games fail with a clear unsupported-package error in September. §2e. |
| Mirror-ladder fetch → verify-before-execute → sandbox render | **COVERED** (design) / **SPEC-DEBT** (v1 impl) | This IS PAF-3. v1 today verifies nothing: `verifyContentHash` has zero callers and the render path discards the DATA UID it would need ([verification-execution-mirrors-enumeration](../../Reviews/2026-08-07-arcade-corpus/verification-execution-mirrors-enumeration.md) §1.1–1.3, grade A). The Arcade build spike inserts verification client-side; the durable home is the SDK (§2f). |

## 2. Pressure findings and where they route

### 2a. Stable-URL identity across the v2 recut → [[deterministic-ids]] + [[efs-v2-transition-plan]]

The #1 honest-copy problem (this pass's judgment, and the falsification lane's "awkward stable-URL fact", [research-alternatives-and-falsification](../../Reviews/2026-08-07-arcade-corpus/research-alternatives-and-falsification.md) Q3, grade A on the underlying status): the Arcade promises share links on a substrate the project plans to supersede.

**Named failing acceptance test — `ARC-V2-LINK-1`: a game share link minted in September 2026 resolves to the same verified bytes after the v2 recut, with no operator-run database or redirect service in the loop.** Today this test has no passing design: v1 anchor paths resolve through frozen Sepolia contracts keyed to UIDs that v2 will not carry. What the owning docs need to produce: a portable-ID forwarding convention (old-UID → deterministic-ID mapping records, publishable by anyone, lens-verifiable) and a ruling on whether v1 Sepolia resolution stays alive as a read-only shim. Until then, Arcade product copy must scope the promise ("names outlive operators; the current resolver is v1 Sepolia") — that wording is an Arcade-side obligation, not a v2 ask.

### 2b. Guest boot budget → [[boot-and-profiles]] (feed measurements; first real exerciser)

The v1 explorer boot gates on **7 serial contract reads** (rootUID + 6 schema UIDs) before rendering anything, then 1–2 sequential reads per path segment, then a lens-filtered directory walk — on a public RPC with no multicall, ~6-connection browser cap, and a 12 s timeout to an error screen ([verification-routes-and-links](../../Reviews/2026-08-07-arcade-corpus/verification-routes-and-links.md) §2, grade A). The Arcade guest path bypasses all of it (baked addresses, baked lens list, dedicated RPC).

[[boot-and-profiles]] §3.3 budgets the v2 answer: ≤3.0 s to interactive verified viewer, ≤1.2 MiB critical path, ≤2 serialized RTTs, guest generations, minimal viewer closures. The [../../Ideas.md](../../Ideas.md) instant-guest-deep-links section makes this a product requirement. **The Arcade is the first surface to exercise those numbers against real users.** Obligation: instrument the Arcade guest path (time-to-catalog, time-to-Play-ready, RTT count, bytes) and file the measurements to [[boot-and-profiles]] as calibration evidence. If the hand-rolled v1 path cannot meet ~3 s on a P75 device, that is a finding about the budget, not a reason to relax it silently.

### 2c. The isolated-compatibility-runner ruling ask → [[kernel-capability-model]] + [[playable-archive-requirements]] PAF-5 (+ the clientv2 owner inbox if it becomes a thesis amendment)

[[kernel-capability-model]] rules: Ring-3 app logic runs in SES workers; iframes hold exactly one job — the render service for untrusted *documents*, never app logic. [[playable-archive-requirements]] PAF-5 already names the collision: "Legacy direct execution is a compatibility runner, not a Ring-3 EFS app… v2 must either approve this isolated compatibility lane explicitly or defer legacy-direct launch," and carries it as an open question.

The Arcade **needs the lane**: every catalog game is unmodified third-party HTML that can only run as a legacy-direct iframe. Routed strictly as evidence: the Arcade demonstrates the lane is load-bearing for the entire single-file-game content class, with the exact v1 posture (opaque-origin `allow-scripts` sandbox, verify-before-execute, no capabilities, escape controls outside the frame) as the working precedent. **This doc does not decide the ruling.** The decision belongs to the kernel doc's owner via PAF-5, and plausibly to the owner inbox if it becomes a thesis amendment. Failing test if deferred: no legacy game is launchable in the v2 client at all — the Arcade's whole catalog goes dark on migration.

### 2d. Comments/social → [[apps-cookbook]] P13 (blessed social pattern) + indexer lane

The comments lane's conclusion ([research-comments-approaches](../../Reviews/2026-08-07-arcade-corpus/research-comments-approaches.md), grade A/B): EFS-native comments as the primary September loop are not credible — no spam defense (free gas + one-click Sybil, sole moderator away two weeks), no read indexer (~100–150 raw calls to render 50 comments), permanent free-text legal exposure. Hence the hybrid (giscus + on-chain star + archiver) — an owner decision, presented honestly.

Routes as evidence to the **P13 social-app blessed pattern** request already standing in [[apps-cookbook]] Open questions: the Arcade is a live customer for feed/comment ordering, moderation-as-lens-limits (§2g), and stranger-write economics. The economic blocker — someone must fund and operate spam-resistant stranger writes — is the sibling of the proposer-funding contradiction the wiki lane hit; P13's owner should treat them as one problem. The indexer dependency routes to the SDK lane (post-hackathon by ruling, [../../Reviews/2026-08-07-arcade-corpus/verification-sdk-pr1.md](../../Reviews/2026-08-07-arcade-corpus/verification-sdk-pr1.md)).

### 2e. Single-file package profile → [[packages-and-updates]] closure manifest + PAF-2/PAF-3

The Arcade's internal `PlayablePackage` abstraction with profile 1 = single `index.html` is deliberately the degenerate closure manifest: one entry, one byte commitment, one entrypoint. The **#1 post-September content unlock** is the folder-bundle lane (2048, A Dark Room, other multi-file marquee titles — deferred by this pass's catalog proposal).

**Named failing acceptance test — `ARC-PKG-2`: a multi-file web game loads relative JS/CSS/images/audio from one locked, verified generation, with escaping/ambiguous paths rejected, without touching the client origin.** This is PAF-3's own acceptance test restated; it fails today by construction (multi-file → explicit unsupported-package error). What the owning docs must settle before the lane opens: the package-serving topology (PAF-3's "dedicated runtime origin" requirement) and the manifest path-semantics table (case, percent-decoding, dot segments). The Arcade should not invent a bespoke folder format in the meantime — see §3.

### 2f. Verification choke point → SDK ([[sdk-boundaries]] / the SDK repo)

v1 ships isolation without integrity: no read-path caller of any verify function, unverified bytes straight into the executing iframe, and a router that discards the DATA UID needed to even look up the hash ([verification-execution-mirrors-enumeration](../../Reviews/2026-08-07-arcade-corpus/verification-execution-mirrors-enumeration.md) §1, grade A). The Arcade build spike fixes this locally (fetch → verify vs canonical `f1220` → execute). Per the SDK-boundary ruling (client code stays thin; the SDK owns fetch/resolution/hashing), the durable home for the verify choke point is the SDK's read path — `readVerified()` must accept canonical multihash values (today it rejects both legacy and canonical formats as malformed, [verification-sdk-pr1](../../Reviews/2026-08-07-arcade-corpus/verification-sdk-pr1.md) unresolved P1 thread, grade A; the "arcade-pin patch" superseding SDK ADR-0006 is step 3 of the reconciliation order). Verified **range/streaming reads are irrelevant at Arcade scale** (games are KB-sized; whole-file hash-then-execute is correct) — do not let the Arcade generate pressure for the large-file machinery; that pressure belongs to [[large-file-uploads]] on its own evidence.

### 2g. Lens model vs cardinality-N social data → [[lens-spec]] / [[read-lens-spec]] (spec-debt note)

Lenses answer "**whose** content wins at this path" — cardinality-1 resolution with fallback. Comments (and any social aggregate) inherently want "**all** attesters, then filter" — cardinality-N with moderation as explicit allow/deny data the client consults, not lens fallback. WHITEOUT is path-ANCHOR-only and cannot suppress a LIST entry ([research-comments-approaches](../../Reviews/2026-08-07-arcade-corpus/research-comments-approaches.md) mismatch note, grade A on the ADR reads). This is not a missing capability — TAG/LIST + client-side filtering works — but it IS spec debt: the lens docs present lenses as THE read-policy layer, and the first social surface immediately steps outside them. Filed as a note for the lens-spec owner: name the boundary explicitly (lenses govern slot resolution; set-shaped social reads compose attester filters, not lenses) so app authors stop rediscovering it.

### 2h. Receipts and export → `.efs-bundle` + conventions registry ([[client-os-pressure-report]] P7, [[apps-cookbook]])

The June seed left zero committed receipts; the promised `ADDRESSES.md` never materialized; a second operator today must re-derive everything from chain scans ([verification-games-deployment](../../Reviews/2026-08-07-arcade-corpus/verification-games-deployment.md) §1, grade A). The Arcade's second-operator-reconstruction differentiator demo makes this acute: "rebuildable from public records + receipts" requires receipts to exist in a defined format. September answer: committed JSON receipts per seed run (tx hashes, UIDs, CIDs, block range) in the data repo — a local convention. Routed ask: the standing P7 request for a portable `.efs-bundle` format + conventions registry should treat seeder receipts as an in-scope record type, so the Arcade's local format has a successor to migrate into rather than becoming accidental infrastructure.

### 2i. N5 → [the EFS v2 owner inbox](../efsv2/owner-decision-inbox.md)

N5 (joined-system anchor application) is undecided; N5A (playable archive as first reference app) is the recommended-but-unadopted arm. The Arcade at demo scope generates exactly the evidence N5A lacks: does anyone show up to a guest catalog; does the guest path hold its budgets; does the curation workflow attract one real outside contribution; do the differentiator demos land with a technical audience. Route the September retrospective's numbers to the N5 entry. **The Arcade shipping is not N5A being adopted** — conflating them under deadline pressure is the failure mode §3 exists to prevent.

## 3. What the Arcade must NOT do to v2

- **No bespoke schemas.** Everything the Arcade writes durably uses the frozen v1 kinds under existing conventions (specs/10 contentHash, standard MIRROR/PIN/TAG/LIST shapes). No arcade-specific PROPERTY vocabularies beyond what the curation workflow already defines, and none at all before the seeder emits canonical `f1220` (reconciliation step 1).
- **No private index.** If a read is too slow without an index (comments, star counts), the September answer is "don't ship that read natively" (hence giscus), not a closed-source indexer that becomes load-bearing. Anything indexed must remain rebuildable by a stranger from public records — that property is the product.
- **No bespoke multi-file package format.** The folder lane waits for the closure-manifest/serving-topology decisions (§2e). A quick Arcade-only manifest format would be a second half-frozen pinning format — the exact flakes lesson [[packages-and-updates]] is built on.
- **No editing canonical rulings under deadline pressure.** The iframe ruling (§2c), the lens boundary (§2g), N5 (§2i), and the v1-frozen-schema status are owned elsewhere. The Arcade files evidence and, where blocked, ships the labeled workaround — it never quietly amends the ruling, and it never claims "frozen forever" or "community-validated" in public copy.
- **No new permanent protocol surface, period.** PAF's own boundary rule applies verbatim: no contract field or read method for this archive unless a named acceptance test fails on the generic primitives. The two named tests here (`ARC-V2-LINK-1`, `ARC-PKG-2`) both route to design docs, not to contracts.

## Open questions

- [ ] `ARC-V2-LINK-1`: does [[deterministic-ids]] / [[efs-v2-transition-plan]] commit to a portable-ID forwarding convention that a September share link can honestly cite? (Blocks final product copy on URL permanence.)
- [ ] PAF-5 compat-runner ruling: approved lane, deferred, or thesis amendment? ([[kernel-capability-model]] owner; Arcade evidence filed in §2c.)
- [ ] Who receives the guest-boot measurements (§2b) — [[boot-and-profiles]] directly, or a clientv2 measurements appendix? Define the metric set before launch so instrumentation ships with the site.
- [ ] Does the P13 blessed-pattern owner accept the giscus-archive corpus + star data as formal evidence inputs (schema for the archived corpus files)?
- [ ] Star-TAG loss at recut (§1 table): accepted as disposable, or worth a mapping record alongside curation claims?
- [ ] Should the local receipts JSON (§2h) be pre-aligned with a draft `.efs-bundle` field set now, or converge later?

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
