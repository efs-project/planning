# EFS v2 joined pass — use-case corpus + requirements register

**Status:** lane deliverable of the 2026-07-25 joined KEL × authority × lens filesystem reconciliation pass — the falsification target the other lanes design against
**Lane charge:** gather + generate the use-case corpus; write the MUST/NICE/DEFERRED requirements register tagged by capability axis and chain-locality; map what forces the L1 anchor, what depends on cross-chain, what local-only mode loses
**Inputs (read in full or per charge):** [[README]], [[owner-decision-inbox]], [[owner-rulings]], [[human-overview]], [[apps-cookbook]], [[playable-archive-requirements]], [[mountable-filesystem-semantics]], [[solana]], [[ethereum-first-efs-and-os]], [[large-file-uploads]], [2026-05-26 divergent use cases](../../Brainstorms/2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries.md), [2026-07-24 folder voting](../../Brainstorms/2026-07-24-codex-folder-voting-use-case.md), [2026-07-21 OS landscape + economic constitution](../../Brainstorms/2026-07-21-codex-efs-os-landscape-and-economic-constitution.md)
**Last touched:** 2026-07-25

#status/draft #kind/review #repo/planning #topic/efsv2 #topic/requirements #topic/use-cases

> **How to read this file.** Sections 1–2 are the corpus (existing + generated). Section 3 is the five mandatory anchor journeys, each paired with how it breaks. Section 4 is the ruling-5 deliverable (chain-free mode: what it keeps, what it structurally loses). Section 5 is the requirements register — the falsification target — with every row tagged by capability axis ([[owner-rulings#2026-07-22|the six separately-named capabilities]]: portable-artifact **PA**, authority **AU**, query-completeness **QC**, byte-availability **BA**, contract-readability **CR**, host-projection **HP**) and by chain-locality (**LOCAL-OK** = achievable chain-free / **CHAIN** = needs a venue but only one / **XCHAIN** = forces cross-chain machinery). Section 6 reconciles tensions T1–T4 as the use cases see them. Nothing here is ceremony-final; per [[README]] this corpus is reconciliation input, not freeze permission.

---

## 1. Gathered use cases (the existing corpus, consolidated)

Every previously-documented use case, with its source verdict and what it already forced upstream. IDs are referenced by the register in §5.

### 1.1 The ten cookbook apps — [[apps-cookbook]] (VERIFIED against the doc)

| ID | App | Verdict | What it forces (already adopted upstream) |
|---|---|---|---|
| UC-A1 | Personal file browser/site | works | SDK rename/update verbs; address containers as canonical personal namespace |
| UC-A2 | Blog + stranger comments | works-with-warts | discovery index; commenter-owned DATA + TAG into parallel container; stranger-write relayer economics ([[apps-cookbook#Blessed patterns]] #2) |
| UC-A3 | Social feed | works-with-warts | per-author feeds + TAG-slot like/follow algebra; notifications/counts = indexer lane; KEL session keys (named cost pre-KEL) |
| UC-A4 | Photo archive (1000 photos) | works-with-warts | sign-one-root / submit-in-chunks bulk ingest (blessed pattern #1); bulk-byte economics gate |
| UC-A5 | Curated collections + lens subscription | works | lens pin-and-diff + freshness conventions — strongest fit |
| UC-A6 | NFT/token metadata | works | state-resident bodies; primary-mirror PIN; frozen CREATE2 chunk-store recipe so replicated stores land at identical addresses |
| UC-A7 | DAO document store | works-with-warts | threshold custody of one org identity; rotating-signer authorization = KEL's first real customer |
| UC-A8 | Package registry | works-with-warts | **the stress case**: stale-not-dead + declared-home pull-latest + advisory deny-lists; appendOnly LIST charter; account-takeover as dominant threat |
| UC-A9 | Web archive mirror | works | ceiling = bulk-byte economics (unmeasured gas gate) |
| UC-A10 | Dapp structured records | works | on-chain consumer surface stays point-lookup-shaped; gates use closed author sets, never lens fallback |

Cookbook caveat carried forward: two verdicts (UC-A6 10k-collection, UC-A9 10k-URL) are hostage to the unproduced gas snapshot ([[apps-cookbook#Open questions]]); and the cookbook predates the KEL reopen, so its identity-shaped statements are evidence-gated (see Reconciliation ledger).

### 1.2 Playable archive — [[playable-archive-requirements]] (VERIFIED)

UC-P: browse → inspect → preflight → explicit Play → return, over PAF-1..PAF-8. Its protocol demand is deliberately minimal: stable DATA identities, generic byte commitments incl. large bytes, bounded collection membership + point reads, immutable release placement + append-only channel + PIN channel head, attributable lens-selectable facts ([[playable-archive-requirements#Protocol Boundary]]). PAF-2 (one portable name for exact canonical manifest bytes) is the one named direct pressure on the frozen data model. N5 (whether this is *the* anchor app) is held ([[owner-decision-inbox]] N5); this corpus treats it as one pressure fixture among twelve classes, which is compatible with either answer.

### 1.3 Mount stories — [[mountable-filesystem-semantics]] (VERIFIED)

UC-M: "mount Alice / mount Ethereum / mount this local archive" through ordinary shell + Finder/Explorer on Linux/macOS/Windows. Forces: deterministic tree projection, portable names, exact enumeration with basis-bound cursors, `UNKNOWN` ≠ `ENOENT`, pinned handles/dir snapshots, verified range reads, bounded metadata/xattr projection, history-amplification budgets, read-only failure of every mutation ([[mountable-filesystem-semantics#4. Cross-platform read-only mount contract]], [[mountable-filesystem-semantics#11. Suggested falsification ladder]]). Anchor journey (a) in §3 walks it record-by-record.

### 1.4 Solana / substrate pressure cases — [[solana]] (VERIFIED)

UC-S: the same signed artifact on Ethereum, Solana, a local bundle, S3, and IPFS must yield identical canonical bytes/IDs/lens results while guarantees stay venue-qualified ([[solana#2. Support is a ladder, not a boolean]] L0–L4, [[solana#11. Falsification plan]]). Pressure it contributes to this corpus: submitter ≠ author, PDA/locator ≠ identity, staged-commit atomic visibility for >1,232-byte envelopes, no false absence from partial replicas, program gates need small pinned policies (a naive 50-principal lens is not a credible program-gate ABI — [[solana#6.4 Queryability and state-only reconstruction]]), and the [[solana#7. Capability matrix beyond Solana]] matrix that this register's locality column mirrors.

### 1.5 The fifteen divergent-industry cases — [divergent brainstorm](../../Brainstorms/2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries.md) (VERIFIED as v1-era; re-read through v2)

UC-D01 botanical type-specimen registry · UC-D02 legal discovery chain-of-custody · UC-D03 CAD part library · UC-D04 citizen-science bird feed (~10⁸ obs/yr) · UC-D05 recipe fork tree · UC-D06 oral-history archive (CARE/consent) · UC-D07 firmware mirror network · UC-D08 sports stats corpus · UC-D09 RPG homebrew compendium · UC-D10 patient-controlled medical records · UC-D11 museum provenance · UC-D12 podcast permanent archive · UC-D13 coffee supply-chain · UC-D14 fanfiction archive (~7×10⁸ tags) · UC-D15 energy-grid telemetry (10⁸/day).

v2 re-read (my analysis, PLAUSIBLE): the v1 gaps it named are largely answered by v2 — typed/directed edges → TAGDEF definitions + `definitionId`-typed backlinks ([[owner-rulings#2026-07-15]] item A); reverse traversal → mandatory indexing; per-domain lens granularity → typed scoped lenses ([[human-overview#7. The seams that must be closed]] seam 7); mode distinction public/encrypted → public-by-default + sensitivity layer + privacy tier. What survives untouched as *live* pressure: (i) the two cardinality regimes — high-frequency telemetry (UC-D04/D15) vs curated long-tail (UC-D02/D06/D10/D11) — which the abstract EVM cost profile must either price or explicitly scope out (→ Decision J1); (ii) permanence-as-hazard classes (UC-D02/D06/D10) which force intake guardrails, not protocol change; (iii) mirror-cardinality (10–50 mirrors per DATA, UC-D07/D12).

### 1.6 The ethereum-first §11 pressure-story corpus — [[ethereum-first-efs-and-os#11. Research-to-MVP sequence]] (VERIFIED)

UC-E1 publish + enumerate a large folder · UC-E2 overlay several principals · UC-E3 distinguish proven absence from missing evidence · UC-E4 rotate/recover a key · UC-E5 copy historical evidence into another realm · UC-E6 reconstruct from an export · UC-E7 mount the same resolved view read-only. Step 1 of that sequence says to **freeze the pressure-test stories, not the architecture** — §3's anchor journeys are exactly UC-E1/E2/E4/E7 plus the large-file journey, elaborated to record level.

### 1.7 Folder-scoped polls — [folder voting](../../Brainstorms/2026-07-24-codex-folder-voting-use-case.md) (VERIFIED)

UC-V: 2-of-3 moderated daily poll; signed public votes; deterministic independent verifiers; result record is cache, not truth. Its twelve surfaced requirements ([folder voting §Requirements surfaced](../../Brainstorms/2026-07-24-codex-folder-voting-use-case.md)) are absorbed into §5, notably: placement ≠ authority, authority snapshots reproducible at a pinned basis, complete enumeration of all records referencing one object without an indexer, exact ordering/finality semantics, narrow signing capabilities, relayed gasless writes without relayer authority, and permanent-record economics at daily-app volume (0.8–1 B spine gas/yr at just 100 daily voters under one draft kernel estimate — conditional scenario, could-not-verify the number itself).

---

## 2. Generated use cases by app class

Format per case: **who** → journey in 3–6 steps → **FORCES** (register rows). Classes marked *(new pressure)* add demands not already in §1.

### 2.1 Personal files & sync — G-FILES

**G-FILES-1 — Two-device home folder.** Freelancer, no crypto knowledge. (1) Installs client; gets zero-state identity; creates `/docs/` locally. (2) Edits on laptop; journal coalesces saves into signed envelopes in the local replica. (3) Phone syncs via any dumb replica; conflicts render visibly. (4) Months later, picks one folder → "make permanent" → promotion to chain (anchor journey d). **FORCES:** R-PA1/2/3, R-MODE1/2, R-AU1, host-projection of the same tree (R-HP1). The chain must be an *upgrade ceremony*, never a prerequisite to opening a document ([[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]]).

**G-FILES-2 — Inheritance/estate handoff.** A person dies; executor holds the cold factor. Journey: recover principal per KEL recovery policy → enumerate everything the principal authored on-chain (no indexer, no old device) → export a complete bundle. **FORCES:** R-QC4 (author self-enumeration incl. orphan tail — the [[owner-rulings#2026-07-15]] item D "roots-forward + orphan tail" case), R-PA3, R-AU2. *(new pressure: self-enumeration is not a convenience — it is the estate/recovery floor.)*

### 2.2 Photos & media libraries — G-PHOTO

**G-PHOTO-1 — 20k-photo family archive.** (1) Bulk-import: one signed Merkle root over the whole write DAG, `submitSubset` across transactions ([[apps-cookbook#Blessed patterns]] #1). (2) Bytes to Arweave + optional tier-0 for the dozen "extremely important" originals ([[large-file-uploads#James rulings (2026-07-07)]] #4). (3) Faces/locations classed sensitive by the sensitivity layer → those stay client-side or encrypted ([[owner-rulings#2026-07-10]]). (4) Timeline view sorts on `claimedAt` testimony, never treats it as authority ([[owner-decision-inbox]] Q2). (5) Browse via mount: thumbnails are derived local cache, originals verified on open. **FORCES:** R-BA1/2/5, R-QC1 (paginated 20k enumeration), R-PRIV1, R-PA2. Breaks: a hostile mirror serves garbage → content-commitment check fails, `CONTENT-MISMATCH`, never silent wrong pixels.

### 2.3 Collaborative documents — G-DOCS

**G-DOCS-1 — Private team notebook.** Closed container, deterministic op-fold, encrypted; per Q3A op-folds are for private/closed containers ([[owner-decision-inbox]] Q3). **FORCES:** R-MODE1, R-PRIV1, merge-rule location stays E9-gated.

**G-DOCS-2 — Public standards document with stranger proposals.** (1) Editors publish revision DAG: each revision = new DATA + `previousVersion` edge + re-PIN by the editor group. (2) Strangers publish proposal records into a parallel container (commenter-owned DATA + TAG, relayer-paid). (3) The editor lens curates; readers on other lenses see the full dispute. (4) Old links resolve with SUPERSEDED grade ([[apps-cookbook#Blessed patterns]] #3). **FORCES:** R-QC2 (typed backlinks: "all proposals targeting §4"), R-AU4 (editor group = org threshold), R-MODE3 (relayed writes, author ≠ payer). Breaks: an editor equivocates two revision heads to different readers → checkpoint claims + curator cross-checks make it detectable, not preventable (no collision bit — [[owner-rulings#2026-07-15]] item F).

### 2.4 Software packages & updates — G-PKG

**G-PKG-1 — Library publisher + installer.** (1) Publisher signs release: immutable placement + appendOnly LIST ledger entry + PIN channel head. (2) Installer resolves channel under a **purpose-specific fail-closed gate lens** (never the user's social lens — [[human-overview#7. The seams that must be closed]] seam 19). (3) Installer pull-latest-before-trust from the declared home; deny-list advisories consulted. (4) Yank = revoke placement; lockfiles keep resolving the exact old bytes ([[apps-cookbook#Blessed patterns]] #5). **FORCES:** R-AU3 (this is the class that genuinely needs the *strong* authority grade: an account-takeover followed by a backdated "old stable release" is the canonical attack), R-QC5 (revocation-aware channel state), R-CR3 (a contract- or program-side gate wants the same check), Q5 fail-closed default. Breaks: publisher key stolen → thief publishes plausible history; weak grade cannot distinguish; strong grade rejects post-revocation admissions; the residual pre-revocation window is honestly irreducible ([[human-overview#2.1 Evidence is not authority]]).

### 2.5 Websites & publishing — G-WEB

**G-WEB-1 — Zero-infra personal site.** Publish site records + bytes; any reader resolves via `web3://`-class gateways or a verifying client with no author-run server (the universal zero-infra default per [[../../Brainstorms/2026-07-21-codex-efs-os-landscape-and-economic-constitution|economic constitution]] graceful-degradation rule and the mirror-scheme ruling). **FORCES:** R-BA2, R-HP1 (a site is also just a mountable folder), R-CR1 for on-chain tokenURI-class consumers.

**G-WEB-2 — Podcast that outlives its host** (UC-D12 v2 form). Episodes = DATA + mirrors; feed = derived view over the show container; silent re-edit impossible — new DATA + supersession is visible. **FORCES:** R-BA3 (10–50 mirrors/DATA cardinality), R-QC2 (episode enumeration in order), edit-history render conventions (client).

### 2.6 Social & curation — G-SOC *(FUTURE CONSUMER — needs noted, not designed)*

Per pass ruling 1, noted only. What a later social/curation layer will *ask of* this filesystem: admission-ordered feed reads (venue order, not claimed TID — [[apps-cookbook#Open questions]] P13); revocation-aware live counts (adopted — [[owner-rulings#2026-07-15]] item E); moderation/curation lenses at 50–256 principals (E6); durable unlinkable personas as separate KELs (adopted); and possibly a *shared* authority venue even where the filesystem itself is realm-local ([[owner-rulings#2026-07-23]] UNDECIDED FS-vs-OS venue hypothesis). **No register row below exists solely for social; where social would be the only forcer, the row says so and is graded accordingly.** Nothing in this corpus forecloses it: feeds, counts, personas, and curation all compose from already-forced primitives.

### 2.7 DAO & org records — G-ORG

**G-ORG-1 — DAO operating archive.** (1) Org principal, 2-of-3 control, one scoped operational actor posts minutes/treasury reports. (2) A signer leaves → rotate the actor; archive continuity unbroken; old records keep their grade. (3) Auditor replays: enumerate all org records at a pinned basis, verify receipts. (4) A governance contract reads the current ratified-budget PIN slot directly. **FORCES:** R-AU4, R-AU2, R-QC1/4, R-CR1. **G-ORG-2 — folder voting** = UC-V (§1.7). Breaks: ex-signer publishes "minutes" post-removal → evidence-only grade; strong grade + receipts make the cutoff objective.

### 2.8 Legal & compliance archives — G-LEGAL

**G-LEGAL-1 — Discovery production** (UC-D02 v2 form). (1) Vendor publishes 50k exhibits: batch sign-once; per-exhibit contentHash; Bates metadata as claims. (2) Opposing counsel's lens overlays privilege flags without touching the record layer. (3) In court: prove exhibit existed by admission basis (`admittedAt`-class evidence, E3), while `claimedAt` remains testimony. (4) PII intake guardrail: the tooling refuses un-reviewed uploads; redaction = client-side overlay + a redacted-mirror convention, never un-publication. **FORCES:** R-QC3 (contentHash → file lookup: "has this exact document been produced before"), R-PA3 (portable evidence bundles for the court), R-PRIV2 (intake guardrails — product, not protocol). *(new pressure: `admittedAt` has a paying consumer here — one of the two consumers E3 asks for.)*

### 2.9 Science & datasets — G-SCI

**G-SCI-1 — Type-specimen registry** (UC-D01; the strongest institutional early-adopter fit per the brainstorm). Deep TAGDEF hierarchy; competing taxonomies as competing lenses; consensus rendered, never kernel-enforced. **FORCES:** R-QC1 (deep-walk enumeration), typed edges via definitions (covered), R-BA1 (gigapixel scans mirrored).

**G-SCI-2 — Citable dataset pin.** A paper cites `dataset @ basis B, contentHash H`. Any reader, decades later, re-resolves the exact snapshot and byte-verifies it. **FORCES:** R-PA2, R-QC6 (basis-pinned reproducible reads / view receipts), R-BA1. This is the mission's "portable evidence" end in its purest form.

**G-SCI-3 — High-frequency observation feeds** (UC-D04/UC-D15). 10⁸ records/day does not fit any current on-chain admission profile at plausible cost. Honest classification: client/aggregate-first — devices sign locally (portable evidence, LOCAL-OK), communities publish periodic committed aggregates/checkpoint roots on-chain; raw firehose on-chain is **out of scope for v2** unless James rules otherwise (→ Decision J1). **FORCES (in aggregate form):** R-MODE1/2, R-PA1.

### 2.10 Games & playable archive — G-GAME

UC-P (§1.2) plus anchor journey (e). One addition: **G-GAME-1 — speedrun/replay evidence.** A runner publishes input-log + final-state hash as records against the archived game generation; a verifier package replays deterministically. Forces nothing new — pinned package generations (R-BA4) + citable basis (R-QC6) already cover it. Included to show the archive's *evidence* surface generalizes beyond launch.

### 2.11 AI-agent workspaces — G-AGENT

**G-AGENT-1 — Research agent with a scoped grant.** (1) User grants an agent actor a narrow KEL grant: scope = `/projects/x/`, expiry, rate/resource ceiling. (2) Agent drafts client-side (journal), cites sources as `(recordId, basis, contentHash)` triples. (3) User reviews the outbox; explicit flush publishes; `act` provenance labels the agent — provenance only, KEL grant is what authorized ([[owner-rulings]] adopted). (4) Grant expires or is revoked; agent's later signatures are evidence-only. **FORCES:** R-AU5 (scoped/expiring/budgeted grants — agents are the second real customer for grant attenuation after packages), R-MODE2 (draft-then-promote), R-QC6 (verifiable citations). Breaks: **malicious public data into an agent** — a hostile record's *content* instructs the agent; defense is lens-scoped source policy + capability confinement (OS), never kernel filtering; this is the agent-shaped instance of "malicious public data is an input to a kernel-facing daemon" ([[ethereum-first-efs-and-os#Joined blind spots to keep visible]]).

### 2.12 Contract-consuming dapps — G-DAPP (the on-chain-composability cases)

**G-DAPP-1 — Folder-gated mint.** A contract mints only to addresses listed in a curator's on-chain member list: bounded read of an exact LIST/PIN slot at call time, closed author set (the curator), no lens fallback. **FORCES:** R-CR1/2, R-AU3-lite (the gate trusts a named principal → needs its *current* key state resolvable on the same venue). **G-DAPP-2 — Fully on-chain NFT** (UC-A6 v2): tokenURI composes `getSlot` (primary-mirror PIN) + tier-0 bytes via `extcodecopy`. **FORCES:** R-CR1, R-BA5, the CREATE2 recipe. **G-DAPP-3 — Escrow releasing on an attested deliverable:** contract checks `contentHash → DATA` index + a client's acceptance claim after a challenge window (the ruled pattern for untrusted authors — [[owner-rulings#2026-07-15]] item F). **FORCES:** R-QC3, R-CR2, R-CR3. Breaks: TOCTOU equivocation against an autonomous contract → structurally unsolvable without closed authors or delay; this is *by ruling* not a gap.

---

## 3. Anchor journeys (mandatory, record-level)

Each journey names the records/reads involved, then **how it breaks**. These five are the falsification stories the other lanes must keep passing ([[ethereum-first-efs-and-os#11. Research-to-MVP sequence]] step 1).

### (a) Browse + enumerate a 10k-entry folder through a file explorer

Cast: Dana, a data journalist with no wallet, on Windows Explorer. Source: a public court-records folder on the selected EVM venue.

1. **Mount.** Daemon starts with a mount descriptor pinning `{root TAGDEF, lens revision, realm + code basis, finalized evidence basis, evaluation time, completeness policy}` ([[mountable-filesystem-semantics#4. Cross-platform read-only mount contract]]). No key, no wallet.
2. **Open folder.** Explorer `opendir` → daemon pins a directory snapshot: `children(folderTagId, cursor)` bounded keyed pages from the mandatory child index, each page carrying its basis; the terminal page carries positive closure ([[solana#3. What is actually portable]] invariant 9). 10k entries ≈ paged walk, cached against `(view, basis)` — never path-only.
3. **Render names.** Canonical TAGDEF segments → host presentation via the reversible name profile; collisions disambiguated deterministically; the canonical name stays readable via `user.efs.*` metadata.
4. **`stat` each entry.** Synthesized attributes from the resolved winner: DATA identity + selected content commitment + size from the coherent file generation (one tuple — size/codec/commitment/mirror must not resolve from different claims: [[mountable-filesystem-semantics#9. Ranked cracks and their likely homes]]).
5. **Open/copy a file.** Handle pins `(dataId, contentCommitment, basis)`; range reads fetched from the best mirror (bounded on-chain best-mirror view — adopted) and verified against the commitment (chunk proofs where the carrier supports them, else full-fetch-before-serve).
6. **Absence.** A name that provably isn't there (closure-proved page) → native not-found. A missing page / unreachable RPC → transient error, **never** not-found, never fallthrough.

**How it breaks:** withheld directory page → must surface `UNKNOWN`, or the mount silently lies about absence (falsification test 2, [[mountable-filesystem-semantics#12. Falsification tests]]). History amplification: same live 10k folder + years of revoked history must stay inside declared budgets (test 17) — this is a *kernel index-shape* obligation, not just daemon tuning. Hot-folder spam: the pool is permissionless ([[large-file-uploads#James rulings (2026-07-07)]] #2), so a spammed public folder is expected — the lens is the filter and pagination must not degrade with adversarial junk under other authors. Explorer's own crawlers (thumbnails, search indexers) must not hydrate gigabytes — metadata ops must not fetch bodies.

### (b) Overlay several curators' lenses on one folder

Cast: Bob overlays `/software/tools/` with: his own pins first, then Curator-X, then Curator-Y, with a deny on one actor.

1. **Subscribe.** Bob's client resolves each curator's channel: PIN channel head → `LensRevision` → compiled `EffectiveLens` (typed, scoped rules — the D-13 model, [[human-overview#Decision D-13 — Define a lens as a typed compiled policy]]); Bob's policy composes them with per-scope combiners: `PRIORITY_FIRST_PRESENT` for name slots, union+dedupe for discovery listing, WHITEOUT masks honored.
2. **Resolve.** For each name: gather candidates from the evidence graph at the pinned basis; apply deny; apply combiner; output = winner + provenance (which curator) + grade + completeness. `ResolvedView` + `ViewReceipt` make "what Bob saw" shareable/reproducible.
3. **Disagreement is a feature.** X and Y both claim `readme` → Bob's priority order decides; the loser stays inspectable (the museum-provenance property, UC-D11: competing claims legible, never erased).
4. **Curator revokes an entry.** Revocation-aware re-resolution; the *rule* declares `FALLTHROUGH_ON_RELINQUISH` vs `STOP_ON_FORMER_AUTHORITY` — overlay folders may fall through; gate-grade scopes stop ([[human-overview#7. The seams that must be closed]] seam 7).
5. **Mount it.** The same overlay projects through journey (a)'s contract — an overlaid folder is still one deterministic tree.

**How it breaks:** removed trusted curator silently activating a malicious lower-ranked source — the fallthrough/stop declaration exists precisely for this. Equivocating curator showing different channel heads to different readers — detectable via checkpoint claims and cross-reader comparison, not prevented (no collision bit; accepted TOCTOU logic — [[owner-rulings#2026-07-15]] item F). 50-principal fan-out cost is the E6 benchmark, and *if* principals could live on different authority homes it becomes 50-home fan-out — the register marks this the single biggest use-case-visible cost of the maximal topology ([[human-overview#7. The seams that must be closed]] seam 15). Personal-lens privacy: resolving Bob's full principal set through a remote RPC leaks his social/trust graph (seam 12) — local replica or bulk snapshot is the default posture.

### (c) Rotate/recover a key and keep old files valid

Cast: Alice, KEL-mode, phone stolen.

1. **Before.** Principal `P` (stable 32-byte word); phone actor key `A1` under a scoped grant at `authEpoch e`. Every record envelope names `P`, the grant reference, and epoch — never bare `A1` as author. All object IDs derive from `P` (+ salt/path), not from any key.
2. **Rotate.** From passkey-sync + the independent cold factor (adopted mainstream baseline — [[owner-rulings#2026-07-16]]), Alice signs KEL events: revoke `A1`'s grant, advance epoch, enroll `A2`. On the authority domain these are admission-ordered; the revocation is grow-only.
3. **Old records stay valid.** Strong grade: records admitted while `A1` was live carry `AuthReceipt`s — verifiable forever ("was authorized at admission ordinal N"). Weak/evidence grade: signature validity + observed-before-revocation heuristics; honest but weaker.
4. **Continuity.** `A2` publishes under the same `P`; every path, folder identity, backlink, and reader lens keyed on `P` is untouched. Readers notice nothing except a grade annotation during the disputed window.
5. **Pending-recovery hygiene.** The OS queues new work locally during recovery rather than publishing disputed records ([[human-overview#3. The system, from write to read]]).

**How it breaks:** the thief signs *backdated* records with `A1` before Alice revokes — pre-revocation-window forgeries are irreducible in any design; post-revocation backdating is exactly what the strong grade rejects and what the weak grade **structurally cannot promise** (pass ruling 7; the honest wording of the two-grade hypothesis). Thief-declares-a-different-home: under per-principal-home topologies the thief could point readers at a friendlier venue — only a canonical locator (the L1-pointer question) or a fixed profile closes it; under a fixed single profile the attack does not exist. Bare-EOA zero-state Alice has no journey (c) at all: key loss = identity loss; that is the advertised cost of zero setup ([[human-overview#2.1 Evidence is not authority]], D-4).

### (d) Personal chain-free sync, later promoted on-chain

Cast: Sam, two devices, a rented dumb replica (any object store), no chain until step 5.

1. **Write local.** Laptop journal coalesces edits → canonical signed envelopes (identical bytes to the on-chain format — one artifact family) stored in the local replica + pushed to the rented replica; device publishes a signed head/checkpoint.
2. **Sync.** Phone pulls envelopes + heads, verifies signatures + content commitments, folds deterministically (LWW per `(author,key)` slot); concurrent same-slot edits from both devices → both visible, deterministic winner, loser inspectable — the same-author multi-device rule the mount doc flags as unfinished ([[mountable-filesystem-semantics#Open questions]]).
3. **Live with honest grades.** Every read is labeled local-sovereign / replica-observed; no completeness or freshness claim beyond the replica's word ([[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]] product ladder).
4. **Promote.** Sam selects `/photos/2026/` → "publish": client submits the *already-signed* envelopes to the venue kernel (sign-once root, `submitSubset` chunks, resumable); admission mints receipts; mandatory indexing populates backlinks/enumeration automatically; bytes optionally replicated to Arweave.
5. **After.** Same IDs, same bytes — promotion changed the *evidence grade and venue*, not the object. Links made pre-promotion still resolve.

**How it breaks:** replica replays a stale head to a fresh device — signatures cannot prove newest; needs remembered basis, second replica, witness, an occasional chain anchor, or an honest `UNKNOWN-CURRENCY` (the freshness-bootstrap problem — [[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]]). Replica withholds one device's envelopes → view silently forks until any cross-check; local mode cannot prove completeness (§4). Sam's "order" words are self-declared: nothing in chain-free mode stops later backdating; on promotion, venue admission order becomes the objective ordering for anyone who needs it. If Sam expected promotion to *erase* the messy local history — it does not; promotion is additive.

### (e) Large on-chain file / playable archive: publish → verify → range-read → play

Cast: an archivist publishing a 40 MB legally-redistributable game; a player with no wallet. Mechanism: [[large-file-uploads]].

1. **Publish, one signature.** Toolchain chunks the package files, builds `chunksRoot` (count-at-apex); the archivist signs ONE envelope: DATA identities + `chunks` manifest rows + package release manifest (PAF-2 closure: every file's path/identity/commitment/size/type) + placement + appendOnly release-ledger entry + PIN channel head. Optionally sets the `contractReadable` floor on specific files ([[large-file-uploads#James rulings (2026-07-07)]] #1).
2. **Bytes stream permissionlessly.** A relayer submits the envelope then `submitChunk(chunksRoot, tier, index, bytes, proof)` — chunks carry no signature; admission = proof against the author-committed root. Relayer dies at 60% → anyone reads the on-chain bitmap (`missingChunks`) and finishes from a different account. Meanwhile the file reads honestly as `BYTES-PARTIAL(k/n)`.
3. **Player browses.** Catalog cards from ordinary records (journey (a) machinery); explicit click-to-play only ([[playable-archive-requirements#Core Experience]]).
4. **Preflight + verified launch.** Client resolves the exact manifest under the archive gate lens at a pinned basis; locks the generation; verifies launch-critical bytes *before* execution; large data range-reads incrementally — tier-0 via `extcodecopy` pages proven per chunk; IPFS/Arweave via their native Merkle verification; plain HTTPS mirrors full-fetch-then-hash.
5. **Play + return.** Isolated runtime, zero ambient authority (PAF-5); saves local per generation (PAF-6); exit back to catalog.
6. **Curate/yank later.** A rights problem → curator advisory + channel head moves; new launches warned/blocked per lens; the *bytes* remain — revoking the manifest hides the pointer, not the content ([[large-file-uploads#Mandatory fixes (applied — from the red teams)]] #3).

**How it breaks:** the tier trilemma — submitter picks the cheapest tier; only the signed `contractReadable` floor forces state-tier before `COMPLETE`. Unfunded upload → honest permanent `BYTES-PARTIAL` (funding is exogenous, unsolved — named, not hidden). Hostile package → the cage, not the archive metadata, is the defense. Whole-file-hash carriers cannot authenticate an arbitrary range early — the range-verification boundary must refuse unverified prefixes ([[mountable-filesystem-semantics#12. Falsification tests]] test 16). And T3 lives here: bytes in calldata (tier 2) are *not* contract-readable and grade @EPHEMERAL — first-class large files and the item-16 line coexist because "large on-chain file" means **tier-0 state bytes** when the promise is contract-readability/permanence, and DA-tier otherwise (§6, T3).

---

## 4. Chain-free/local mode: the explicit capability list (ruling 5 deliverable)

Chain-free = signed envelopes + content-addressed bytes + local journal + dumb replicas + the same lens engine ([[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]]).

**What pure-local/chain-free still does well (VERIFIED against the capability tables in [[ethereum-first-efs-and-os]] §6 and [[solana]] §7):**

1. Exact authorship evidence (signature over canonical bytes) and tamper-evidence.
2. Content integrity — every byte verifiable against commitments.
3. The full file/folder/tag/version data model, including history and supersession.
4. Deterministic lens resolution over whatever evidence is present, with honest grades.
5. Read-only mounting, export/import bundles, walk-away portability.
6. Multi-device sync with *visible* conflicts and deterministic folds.
7. Verified package execution of already-pinned closures; offline work.
8. Privacy — the best metadata privacy EFS offers is precisely *not* publishing (adopted: client-only is the privacy path).

**What it structurally CANNOT do without on-chain contracts (each row names the cheapest upgrade that fixes it):**

| # | Missing capability | Why signatures can't provide it | Cheapest fix |
|---|---|---|---|
| L1 | Freshness — prove a replica returned the *newest* head | any old signed head verifies | witness/quorum or periodic chain anchor of the head |
| L2 | Completeness / proven absence | absence of evidence isn't evidence of absence without a closed enumeration authority | committed closure manifest per snapshot; chain indexes for live views |
| L3 | Canonical public order + admission time | `order` is author-controlled testimony | venue admission ordering |
| L4 | Post-revocation backdating rejection (strong grade) | a stolen key signs "old-looking" records at will | admission co-ordered with KEL at an authority domain (D-1) |
| L5 | Contract/program composability | no autonomous third party can read your laptop | records + indexes in venue state (R-CR1/2) |
| L6 | Permissionless third-party durability | replicas are contracts with operators | on-chain state + Arweave (adopted baseline) |
| L7 | Credibly-neutral admission (censorship resistance) | your replica can refuse you; so can a provider | permissionless venue writes (+ relayer diversity) |
| L8 | Global discovery by strangers | nothing to query without shared infrastructure | on-chain force-indexed graph |
| L9 | Revocation-aware live counts / shared graph queries | requires one shared, complete, current view | the adopted mandatory index bundle |
| L10 | A public, transferable evidence *market* (anyone can relay/promote/finish an upload) | needs a shared permissionless coordination point | the venue + the one-signature manifest pattern |

This table is the honest product ladder: local-sovereign → network-replicated → witnessed → chain-authoritative ([[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]]). Contracts are EFS's unique power (L4/L5/L7/L10 are the ones nothing else in the market provides — cf. [[../../Brainstorms/2026-07-21-codex-efs-os-landscape-and-economic-constitution|the landscape scan]]: nobody combines these); pure-local files still carry a real product on rows 1–8 above.

---

## 5. Requirements register

Grades: **MUST** (v2 fails its mission or its adopted rulings without it) / **NICE** (real value, cheap or deferrable without breaking a MUST journey) / **DEFERRED** (explicitly later; must not be foreclosed). Axis: PA/AU/QC/BA/CR/HP as defined in the header — kept separately named per [[owner-rulings#2026-07-22]]. Locality: **LOCAL-OK** / **CHAIN** (one venue suffices — per-chain-local) / **XCHAIN** (forces cross-chain machinery). Every row lists forcing use cases and the **cheapest satisfier** — the smallest thing that satisfies it, so no use case smuggles in an architecture.

### 5.1 Portable-artifact (PA)

| ID | Requirement | Grade | Forced by | Locality | Cheapest satisfier |
|---|---|---|---|---|---|
| R-PA1 | Canonical chain-free envelope bytes + logical IDs, independent of venue/locator/submitter ([[solana#3. What is actually portable]] inv. 1–3) | MUST | all classes; UC-S; UC-E5/E6 | LOCAL-OK | the existing envelope recut + cross-language golden vectors |
| R-PA2 | Citable pinned reads: `(id, basis, contentHash)` triples that re-verify forever | MUST | G-SCI-2, G-LEGAL-1, G-AGENT-1, UC-D11 | LOCAL-OK (given the evidence) | ViewReceipt/basis conventions — no new kernel state |
| R-PA3 | Portable export/import bundle (`.efs-bundle`): records + receipts + proofs + bytes + manifests | MUST | UC-E6 walk-away; G-FILES-2; G-LEGAL-1; L12 steward exit | LOCAL-OK | one normative bundle spec + import rules ([[solana#9. Recommended design-time reservations]] #7) |
| R-PA4 | Suite-agile signatures: tagged suites, exact transcripts, PQ/Ed25519/P-256 seams reserved | MUST (seam) / activation DEFERRED | permanence mission; UC-S §6.1; L16 | LOCAL-OK | suite registry + domain-separated actor descriptors; no second suite shipped |
| R-PA5 | Full-width `bytes32` principals everywhere (no 160-bit truncation) | MUST | seam 1 [[human-overview#7. The seams that must be closed]]; UC-S inv. 16 | LOCAL-OK | bug-fix recut + regenerated vectors — ruled "not a James choice" |

### 5.2 Authority (AU)

| ID | Requirement | Grade | Forced by | Locality | Cheapest satisfier |
|---|---|---|---|---|---|
| R-AU1 | Zero-setup authorship: bare key publishes portable evidence immediately | MUST | ruling 3 (weak grade); G-FILES-1; UC-D04 contributors | LOCAL-OK | nothing — signature-only is the floor; grade it honestly |
| R-AU2 | Stable principal + rotation/recovery keeping all old objects/paths/links valid | MUST | journey (c); G-ORG-1; G-FILES-2; UC-A7/A8 | CHAIN (KEL home) | KEL with principal-derived IDs; recovery composition stays convention |
| R-AU3 | Strong grade: reject post-revocation backdated records via admission-ordered authorization + receipts | MUST *for the classes that need it* (G-PKG, G-ORG/UC-V, safety-critical curation); explicitly NOT needed by G-FILES/G-PHOTO/G-SCI browse paths | CHAIN | the evidence/authority two-lane kernel (seam 3); scope = one authority domain — **no cross-chain machinery required for any forcing use case** |
| R-AU4 | Org/threshold control with one scoped operational actor | MUST | G-ORG-1, UC-A7, UC-V (2-of-3) | CHAIN | KEL org control + grant; no new kind |
| R-AU5 | Scoped, expiring, resource-ceilinged grants (apps, agents, sessions) | MUST | G-AGENT-1; UC-A3 session keys; UC-V poll actor | CHAIN | grant grammar already in [[kel]]; agents add only ceiling semantics |
| R-AU6 | Grade visibility on every read (which grade did I get) | MUST | pass ruling 3; every journey | LOCAL-OK | grade axes in the resolver result; UI obligation |
| R-AU7 | Durable unlinkable personas = separate KELs grouped locally | NICE at launch (adopted direction) | G-SOC future; privacy | CHAIN | already-ruled model; no new machinery |
| R-AU8 | Current-authority discovery for a principal *from another chain's context* | DEFERRED / evidence-gated | only the unified cross-chain view (ruling 2) and per-principal-home topologies | **XCHAIN** | if fixed profile: not needed (the profile *is* the answer). Else: the minimal L1 pointer — this row is the pointer's only use-case demand (§5.4, §6 T2) |

### 5.3 Query-completeness (QC)

| ID | Requirement | Grade | Forced by | Locality | Cheapest satisfier |
|---|---|---|---|---|---|
| R-QC1 | Exact, paginated, basis-bound child/property enumeration with positive closure (10k+ entries) | MUST | journey (a); UC-E1; G-PHOTO-1; G-SCI-1 | CHAIN (live) / LOCAL-OK (manifested snapshot) | the adopted mandatory child index + cursor closure rules |
| R-QC2 | Typed backlinks keyed `(targetKind, target, definitionId)` + reverse membership + REDIRECT cited-by | MUST (adopted) | G-DOCS-2; UC-D05/D11; UC-A2 | CHAIN | the adopted A–B index bundle; shape/cost is E-gated only |
| R-QC3 | `contentHash → DATA` lookup | MUST (adopted) | G-LEGAL-1; G-DAPP-3; dedup checks | CHAIN | one more keyed index (ruled in, 2026-07-15 item 13) |
| R-QC4 | Author self-enumeration incl. orphan tail (recover *everything I authored* from key alone) | MUST (mechanism E4-gated) | G-FILES-2; UC-E4→E6; walk-away | CHAIN | roots-forward walk (≈free) + smallest orphan-tail index |
| R-QC5 | Revocation-aware live state (counts, channel/current summaries) | MUST (adopted — "pay for it") | G-PKG-1; UC-V; G-SOC future counts | CHAIN | the ruled revocation-aware count state; measured shape open |
| R-QC6 | Reproducible pinned-basis resolution + view receipts | MUST | G-SCI-2; UC-V verifiers; journey (b) | LOCAL-OK | canonical lens/basis encodings — resolver work, no kernel state |
| R-QC7 | Enumerate all records referencing one object, complete, indexer-free | MUST | UC-V req. 6; G-DOCS-2 | CHAIN | same machinery as R-QC2 with closure proofs |
| R-QC8 | History-amplification budgets: live-small/history-large stays within declared cost | MUST (newly exposed) | journey (a) breaks; UC-D04 spam legacy | CHAIN | index shapes that separate live from dead at read time; benchmark gate |
| R-QC9 | `admittedAt`-class trustless existence time, batch-readable | NICE→MUST if E3 lands (two consumers now named: G-LEGAL-1, UC-V close rule) | G-LEGAL-1, UC-V | CHAIN | E3's store+batch-read option, decided on the priced snapshot |
| R-QC10 | Ranked / full-text / global-aggregate search | explicitly OFF-CHAIN (adopted) | UC-D08/D14 leaderboards, catalog search | n/a | The-Graph-class indexers; never a kernel promise |

### 5.4 Byte-availability (BA)

| ID | Requirement | Grade | Forced by | Locality | Cheapest satisfier |
|---|---|---|---|---|---|
| R-BA1 | Content commitments selected before transport; every fetched byte verified | MUST | all byte-bearing classes | LOCAL-OK | already-designed content-before-carrier rule |
| R-BA2 | Multi-mirror per DATA + bounded on-chain best-mirror view; 10–50-mirror cardinality survives | MUST | G-WEB-2; UC-D07/D12; adopted item C | CHAIN (the view) / LOCAL-OK (mirrors) | dual-role mirror hierarchy (zero new state — ruled); revisit page caps with real data |
| R-BA3 | Large-file one-signature manifest (`chunksRoot`, count-at-apex) + permissionless proof-streamed chunks + resumability + `BYTES-PARTIAL(k/n)` grades | MUST (pass ruling 6) | journey (e); UC-A4/A9; G-GAME | CHAIN for state tiers | [[large-file-uploads]] A-mechanism as specced; run the de-risking slice |
| R-BA4 | Package-generation closures: one portable name for exact canonical manifest bytes (PAF-2) | MUST | UC-P; G-PKG-1; G-GAME-1 | LOCAL-OK | reconcile pure-DATA-identity vs body-bearing manifest — a recut item, not new surface |
| R-BA5 | `contractReadable` floor: author-committed capability floor, read-enforced | MUST (adopted 2026-07-07) | G-DAPP-2; journey (e) trilemma | CHAIN | the ruled boolean flag |
| R-BA6 | Permissionless tier promotion without re-signing | NICE (mechanism exists free) | journey (e); durability upgrades | CHAIN | falls out of proof-vs-root design; tooling later |
| R-BA7 | Mirror-health / durability labeling convention | NICE | UC-D07; L11 preservation | LOCAL-OK | Durable convention, explicitly not freeze-bound ([[owner-rulings#2026-07-10]] Storage) |
| R-BA8 | Range/chunk-verified reads; refuse unverified prefixes on whole-hash carriers | MUST | journey (a) step 5, (e) step 4 | LOCAL-OK | chunk proofs where available; full-fetch-then-serve rule elsewhere |

### 5.5 Contract-readability (CR)

| ID | Requirement | Grade | Forced by | Locality | Cheapest satisfier |
|---|---|---|---|---|---|
| R-CR1 | Record bodies + current slots contract-readable in state; full-body spine; no elision | MUST (Etched by ruling) | G-DAPP-1/2; UC-A6/A10; UC-V verifier basis | CHAIN | already ruled (items 17/18); E2 prices it |
| R-CR2 | Bounded keyed point/page queries callable in-transaction | MUST | G-DAPP-1/3; UC-A10 | CHAIN | same indexes as R-QC2/3 exposed via ABI; "works on-chain" = exactly this (N2b) |
| R-CR3 | Blessed gate patterns: closed trusted author sets + challenge windows; **no** interactive lens evaluation in contracts | MUST (doc/SDK, not kernel) | G-DAPP-3; adopted no-collision-bit ruling; [[solana#6.4 Queryability and state-only reconstruction]] | CHAIN | SDK templates + cookbook pattern; nothing frozen |
| R-CR4 | Foreign-venue consumption (a contract on chain B reads authority/state from chain A) | DEFERRED — no gathered or generated use case forces it in v2 | UC-A6's replication case avoids it by *re-homing state* (copy + local read), not proving across | **XCHAIN** | explicit adapter/commitment with named trust — only if a real app appears (stop-rule posture; §6 T2) |

### 5.6 Host-projection (HP)

| ID | Requirement | Grade | Forced by | Locality | Cheapest satisfier |
|---|---|---|---|---|---|
| R-HP1 | Read-only mount, Linux+macOS+Windows, ordinary shell + graphical file manager | MUST (adopted) | journey (a); UC-E7; every "ordinary tools" story | LOCAL-OK (snapshot) / CHAIN (live) | shared resolver core + three thin adapters ([[mountable-filesystem-semantics#7. Architecture sketch]]) |
| R-HP2 | `UNKNOWN` ≠ not-found at every host boundary; no silent fallthrough | MUST | journey (a)/(b) breaks | LOCAL-OK | the `PRESENT/ABSENT_PROVEN/UNKNOWN` lookup contract |
| R-HP3 | Portable-name profile: reversible presentation, deterministic collisions, golden fixture on all three hosts | MUST | journey (a); mount checklist | LOCAL-OK | the Durable name profile + vectors |
| R-HP4 | Pinned handles + stable directory snapshots while the venue advances | MUST | journey (a) step 2; falsification tests 4/5 | LOCAL-OK | opendir-pins-basis design |
| R-HP5 | Bounded `user.efs.*` xattr/EA projection + lossless paged control API | MUST (profile) | mount metadata stories | LOCAL-OK | the two-layer metadata contract |
| R-HP6 | Writable mount | DEFERRED (adopted) | G-FILES drag-drop desire | LOCAL-OK first | journal-backed staging per mount doc Phase 3 — must not be foreclosed by read-only choices (pass ruling 9 checked: no register row forecloses it) |

### 5.7 Modes, economics, privacy hooks (cross-cutting)

| ID | Requirement | Grade | Forced by | Locality | Cheapest satisfier |
|---|---|---|---|---|---|
| R-MODE1 | Chain-free local/replica mode with honest grades (the §4 ladder), same artifact family | MUST (design — pass ruling 5) | G-FILES-1; G-DOCS-1; G-SCI-3 | LOCAL-OK | signed heads + bundle + the existing lens engine; *shipped-mode status = Decision J3 |
| R-MODE2 | Promotion ceremony: local → on-chain without rewriting bytes/IDs | MUST | journey (d); G-AGENT-1 | CHAIN | submit the same envelopes; UX only |
| R-MODE3 | Relayed/sponsored writes with author ≠ payer, no relayer authority | MUST | UC-A2; UC-V; G-SCI-3 contributors; gasless-drip product floor | CHAIN | envelope-carried authorship (exists); relayer economics stay measured |
| R-MODE4 | Spam posture: paid + permissionless + lens-filtered; no protocol takedown | MUST (ruled) | journey (a) breaks; UC-D14 | CHAIN | nothing to build — budgets in indexes (R-QC8) are where cost lands |
| R-PRIV1 | Sensitivity layer + encrypted private tier hooks reserved; no privacy-tier design in this pass | MUST (hooks only — pass ruling 8) | G-PHOTO-1; G-DOCS-1; UC-D06/D10 | LOCAL-OK | the reserved seams from [[privacy-pass-synthesis]]; zero new frozen surface |
| R-PRIV2 | Intake guardrails for permanence-hazard classes (PII/consent warnings, tooling refusal) | MUST (product) | UC-D02/D06/D10; L14 | LOCAL-OK | client/tooling policy + disclosures; not protocol |
| R-XC1 | Unified cross-chain *client* view ("chains render like drives", one file manager over N chains) | NICE (design-so-possible — pass ruling 2) | multi-chain users; G-WEB readers | **XCHAIN (client-side only)** | mount N per-chain roots side-by-side; a *merged* view needs only client policy — no protocol machinery. Hard part named: one principal's `CURRENT` across realms is realm-qualified by R-K11-class rules; a merged view must show realm labels, or it lies |
| R-XC2 | Evidence replication to another chain (reach/composability) | NICE (mechanism free) | UC-A6 blessed pattern 7; UC-E5 | XCHAIN (mechanically trivial: re-submit) | already falls out of chain-free envelopes; staleness stays labeled AS-OF |
| R-XC3 | Durable L1 pointer: principal → chosen authority home | evidence-gated candidate | **only** R-AU8's consumers: cross-chain current-discovery + re-home; *no gathered/generated use case forces it under a fixed-profile topology* | **XCHAIN** | if built: minimal registry, pointer-not-state-copy; immutable ⇒ durable discovery/no re-home, updatable ⇒ re-home + bigger attack/goverance surface (journey (c) thief-declares-home). See §6 T2 and Decision J4 |

### 5.8 The deliverable-3 raw-material map

**Forces the L1 pointer (R-XC3):** nothing in the MUST set. Only: (i) per-principal-home topology (held N1D/D-2 option) — then the pointer is *constitutive*, not optional; (ii) same-principal re-home with continuity of *current-authority discovery* (not of old links — those stay resolvable on their original chain forever under chains-don't-die); (iii) a strictly *merged* (not side-by-side) cross-chain drive view that must answer "which realm is this principal's authoritative one" without user configuration.

**Depends on cross-chain machinery of any kind:** R-XC1 (client-side only), R-XC2 (trivial re-submission), R-CR4 (real bridges — deferred, zero forcing use cases), R-AU8/R-XC3 (topology-dependent). Everything else in the register is per-chain-local or fully local.

**What local-only mode loses:** exactly §4's L1–L10, which map to register rows: L1/L2→R-QC1/6 live forms, L3→R-QC9, L4→R-AU3, L5→R-CR1/2, L6→the storage baseline, L7→R-MODE3/4, L8/L9→R-QC2/3/5, L10→R-BA3's permissionless completion.

---

## 6. Tension reconciliations (as the use-case corpus sees them)

**T1 — chains-don't-die vs "dead L2/L3 home strands users."** The use cases show these operate at different layers. *Data/evidence* stranding is dissolved by the adopted assumption: every gathered case that stores on chain X keeps its records readable on chain X forever, so old links never break (R-PA2, R-XC2). The residual worry is *authority-home quality degradation* — a sequencer that censors, fees that spike, an L3 whose operator walks away while the state stays queryable. That is not chain-*death* but venue-*service* decline, and no gathered use case dies from it: reads continue (chains-don't-die), evidence exports continue (R-PA3), and re-home is a *current-authority* question (R-AU8), not a data question. **Reconciled scope: the adopted assumption holds for all venues as data/read venues; whether it extends to "any L3 is an acceptable authority home" is genuinely open and is precisely E1's measurement axis + Decision J4's re-home axis — surfaced, not silently picked.**

**T2 — L1 pointer candidate vs the cross-chain stop-rule.** The register's honest finding: **the use-case corpus does not force the pointer.** Under a fixed authority profile (the comparison prototype), discovery is the profile and R-XC3 has zero consumers. The pointer earns existence only from topology choices (per-principal homes) or a merged multi-realm drive UI, both undecided. Since the stop-rule is a research stop-rule, not a prohibition ([[owner-rulings#2026-07-23]] correction), the correct posture is: keep R-XC3 specified as a *candidate* with its two semantics priced (immutable vs updatable), and let the authority lane + E1 evidence decide — Decision J4 gives James the one axis that is genuinely his (is re-home a product promise?).

**T3 — large-files-first-class vs item-16 "calldata bytes are off-chain."** No conflict once tiers are named: ruling 6's first-class large on-chain file is **tier-0 state bytes** (contract-readable via `extcodecopy`, inside James's "bounded gas" definition — so item 16's own test *admits* them); calldata (tier 2) stays DA-tier @EPHEMERAL exactly as item 16 ruled. The `contractReadable` floor (R-BA5) is the bridge: authors name the capability, the system picks the tier, grades never lie about which tier the bytes landed in. Both rulings stand; the register encodes them as R-BA3+R-BA5 vs the @EPHEMERAL grades. Priced honestly: tier-0 permanence is expensive and L2/L3-first by ruling; the unmeasured part is E2's bill.

**T4 — two-grade hypothesis vs maximal per-principal-home topology vs N1 axes.** This corpus keeps them separable by construction: R-AU1/R-AU6 (weak grade + visibility) are topology-independent; R-AU3 (strong grade) requires *one* authority domain but is silent on how many exist or who picks; R-AU8/R-XC3 isolate the only rows where topology changes the answer. Use-case evidence relevant to held N1 (input, not an answer): the classes that *need* strong grade (G-PKG, G-ORG, UC-V, safety-critical curation) are exactly the classes that also want one stable, well-known venue — none of them wants per-principal homes; the classes that want venue freedom (G-FILES, G-SCI-3, realm-local communities) are the ones that don't need the strong grade. That asymmetry is the two-grade hypothesis surviving its first corpus contact — validated as *consistent*, not proven optimal.

---

## Reconciliation ledger

Existing choices/requirements this file touches, disposed explicitly:

1. **Chains-don't-die ([[owner-rulings#2026-07-10]])** — **still-valid**; scope sharpened by T1: covers data/read permanence on every venue; "acceptable authority home" quality is a separate, open E1/J4 axis. Newly-exposed: no use case requires chain-death machinery; none was added.
2. **Mandatory automatic indexing + the A–E bundle ([[owner-rulings#2026-07-15]])** — **still-valid and load-bearing**: journeys (a)/(b) and G-DAPP all stand on it. **Newly-exposed:** R-QC8 history-amplification budgets as a first-class index-shape requirement (from the mount falsification ladder), not just a daemon concern.
3. **Full-body spine + no-elision (items 17/18)** — **still-valid**; UC-V's independent-verifier replay and G-SCI-2 citations are new named consumers.
4. **No collision bit; closed sets + challenge windows (item F)** — **still-valid**; G-DAPP-3 and G-PKG-1 confirm the pattern suffices; R-CR3 turns it into a blessed SDK pattern.
5. **Self-enumeration (item D, pending)** — **still-valid as pending**; G-FILES-2 (estate/recovery) upgrades its urgency: register grades it MUST with mechanism E4-gated.
6. **`admittedAt` (E3)** — **evidence-gated, unchanged**; this corpus supplies the two consumers the gate asked for (G-LEGAL-1, UC-V close rule).
7. **Public-by-default + sensitivity layer ([[owner-rulings#2026-07-10]])** — **still-valid**; UC-D06/D10/D02 pressure lands on intake guardrails + L14 disclosures (R-PRIV2), not on the default.
8. **Storage = on-chain + Arweave + replaceable mirrors; L2/L3-first bytes** — **still-valid**; UC-D07/D12 mirror-cardinality flags the old v1 mirror-scan caps for re-measurement (Durable, not freeze).
9. **Large-file mechanism + 2026-07-07 rulings ([[large-file-uploads]])** — **still-valid**; elevated by pass ruling 6 into anchor journey (e); T3 reconciled via tiers; funding/completion stays honestly exogenous.
10. **`act` provenance-only; KEL grants authorize** — **still-valid**; G-AGENT-1 is the newest consumer and adds only ceiling semantics (R-AU5).
11. **Read-only mount requirement ([[owner-rulings#2026-07-22]])** — **still-valid**; journey (a) is its use-case-level acceptance shape; pass ruling 9 checked against every register row — none forecloses the mount (R-HP6 note).
12. **Q3 revision-DAG vs op-fold split** — **still-valid as held Q3**; G-DOCS-1/2 are written to be compatible with Q3A and would need rework under Q3B (noted, not decided).
13. **Ten-app cookbook verdicts ([[apps-cookbook]])** — **evidence-gated**: verdicts predate the KEL/envelope reopen and the gas snapshot; the two hostage verdicts (UC-A6/A9) stay hostage; identity-adjacent statements must be re-walked after the recut (cookbook's own pre-promotion checklist says so).
14. **Playable archive N5** — **held, unchanged**; treated here as one fixture of twelve classes, compatible with N5A/B/C.
15. **Flat ordered-author lens spec** — **superseded-pending-replacement** (per [[README]]); journey (b) is written against the typed compiled-policy model (D-13 choice A) and names what the replacement must keep: provenance, WHITEOUT, fallthrough/stop declarations, receipts.
16. **kel.md maximal per-principal-home topology** — **remains demoted to hypothesis**; register isolates its entire use-case-visible cost/benefit into R-AU8/R-XC3 + journey (b)'s 50-home fan-out and journey (c)'s thief-declares-home break.
17. **Cross-chain stop-rule ([[owner-rulings#2026-07-23]] correction)** — **still-valid as a stop-rule, not prohibition**; T2 discharge: corpus finds zero MUST-grade cross-chain consumers; R-CR4/R-XC3 stay explicit candidates.
18. **High-frequency cardinality (10⁸/day) classes** — **newly-exposed decision axis** (was an observation in the 2026-05-26 brainstorm; v2 has never disposed of it) → Decision J1.
19. **Gasless/sponsored writes** — **still-valid product floor** (R-MODE3); consistent with relayer-optional durable-archive posture ("writes are paid on-chain, with optional community relayers" — settled list in [[owner-decision-inbox]]).
20. **Research-before-MVP sequencing hold** — **complied with**: this file presents no N/Q bundle for batch answering; Decisions below are new use-case-shaped axes or explicitly-marked evidence inputs to held items.

---

## Decisions for James

Only genuinely-owner items surfaced *by this corpus*. Each: plain example → options → recommendation → reason trail. None of these re-asks a held N/Q item; J2/J4 feed held items and say so.

### J1 — Scale posture: which cardinality regimes is v2 for?

**Example:** eBird-class birding (UC-D04) writes ~10⁸ observations/year; a rooftop-solar network (UC-D15) writes 10⁸/day. A curated herbarium (UC-D01) writes thousands/year with deep metadata. The same kernel cannot honestly serve both without either pricing the firehose or scoping it out.

- **A — Declare high-frequency telemetry/observation classes out of v2's on-chain admission scope.** They participate as chain-free signed evidence + periodic committed aggregates/checkpoints on-chain (G-SCI-3 pattern). The abstract EVM cost profile is sized for curated long-tail + mid-scale + daily-app volume (UC-V's table is the ceiling fixture). **Recommended** — it matches the archive mission, keeps E2's bill answerable, and loses nothing: the aggregate pattern is honest and upgradeable.
- **B — Treat 10⁸/day as an in-scope L2/L3 cost target.** Forces the venue conversation toward dedicated app-chains now and makes E2 unanswerable at current gas realities.
- **C — Defer silently.** Worst option: every future lane re-litigates it.

Reason trail: [divergent brainstorm §Observations](../../Brainstorms/2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries.md) (two cardinality regimes), [folder voting §Scale and economics](../../Brainstorms/2026-07-24-codex-folder-voting-use-case.md), §2.9 G-SCI-3, register R-QC8/R-MODE1.

### J2 — What does "contract-readable" promise: EVM specifically, or same-venue program-readable?

**Example:** if a Solana-realm EFS ever exists (held N1B territory), does a Solana program reading a folder gate count as satisfying the on-chain-composability mission, or is the promise specifically "Ethereum contracts can read EFS"?

- **A — Same-venue program-readable under a named profile, with Ethereum/EVM as the required first and richest profile.** **Recommended** — it keeps the capability portable in name (the six-axis vocabulary) while Ethereum stays the proudly-richer profile ([[ethereum-first-efs-and-os#4. What Ethereum contributes that should not be abstracted away]]).
- **B — EVM-contract-readable specifically.** Simpler promise; forecloses nothing today (no second L3 profile exists) but bakes venue wording into the mission line.

This is the same question [[solana#12. Owner decisions this pass must not make]] logs as `nativeProgramReadable`; the use-case corpus adds: every gathered CR consumer (G-DAPP-1/2/3, UC-A6/A10) is EVM today, so A costs nothing now. Feeds held N1/E1; answerable independently of them.

### J3 — Chain-free mode: internal seam or shipped, labeled product mode?

**Example:** Sam (journey d) uses EFS for a year before ever touching a chain. Is that a supported story on the box, or an internal architecture property that the shipped product hides behind "connect a wallet to start"?

- **A — Ship it as an explicit labeled mode** (the local-sovereign / network-replicated / witnessed / chain-authoritative ladder), with §4's loss-list as the honest disclosure. **Recommended** — it is the OS adoption wedge ([[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]]), the landscape scan says no competitor combines it with later chain promotion, and the protocol cost is only the bundle + signed-head conventions the register already grades MUST.
- **B — Internal seam only; product is chain-first.** Cleaner single story (Shape A), loses the non-crypto on-ramp and makes journey (d) a demo, not a promise.
- **C — Defer to the OS pass.** Acceptable, but the *protocol-level* pieces (R-PA3, R-MODE1/2) should be graded now either way — they are, above.

Reason trail: §4, register R-MODE1/2, [[ethereum-first-efs-and-os#8. Coherent architecture shapes to keep alive]] Shapes B/E, [landscape scan §The OS is probably the adoption unlock](../../Brainstorms/2026-07-21-codex-efs-os-landscape-and-economic-constitution.md).

### J4 — Is same-principal re-home a product promise? (the only use-case-level input the L1-pointer needs)

**Example:** Alice anchors her strong-grade authority on L2 X. Three years later X's sequencer turns hostile (chain still queryable — data is safe). Does EFS promise Alice a way to move her *current-authority home* to L2 Y with her principal, links, and followers intact — or is the honest answer "your evidence is portable and readable forever; your authority home was a permanent choice (or a new-principal migration)"?

- **A — Re-home is NOT promised in v2.** Evidence stays portable (R-PA3/R-XC2); a user who must leave starts a successor principal with a signed handoff record; old links resolve forever on X. The L1 pointer then has **no v2 consumer** and stays a specified-but-unbuilt candidate. **Recommended** — zero gathered or generated use case pays for updatable-pointer machinery, the thief-declares-a-new-home attack (journey c) never exists, and chains-don't-die makes the stranding cost read-only-tolerable.
- **B — Re-home IS promised** → the updatable L1 pointer (or equivalent) becomes required v2 surface, with its governance/attack/finality design bill (journey (c) break, [[human-overview#7. The seams that must be closed]] seam 9's migration blockers).
- **C — Durable-discovery-only pointer (immutable, write-once).** Buys "where did this principal anchor" as a permanent public fact for merged multi-chain views (R-XC1's hard case) without re-home; cheap, but pays freeze bytes for a NICE.

This is deliberately narrower than held N1/D-2 (topology) — it is the *product-promise* axis (ruling 4's "update semantics are the migration + home-death answer") that the use cases can actually speak to, and it can be answered before topology without foreclosing it: A is compatible with every N1 option. Reason trail: §5.8, §6 T1/T2, register R-AU8/R-XC3.

### J5 — Permanence-hazard intake posture (product/messaging, cheap, launch-relevant)

**Example:** a legal-tech pilot (UC-D02) uploads a production set containing an unredacted SSN; an oral-history project (UC-D06) publishes elder-restricted recordings. Nothing can un-publish either.

- **A — Adopt an explicit intake-guardrail requirement now (R-PRIV2):** vertical onboarding warnings, tooling refusal for unreviewed PII-bearing bulk uploads, "encrypted-commitment-only" guidance for medical/consent classes, folded into the L14 disclosure work. **Recommended** — the brainstorm flagged cluster (c) as "most likely launch embarrassment," and the fix is product policy, zero protocol surface.
- **B — Leave it to per-vertical documentation later.** Defensible but historically how launch embarrassments happen.

Reason trail: [divergent brainstorm §Observations](../../Brainstorms/2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries.md) adversarial cluster (c), §2.8, register R-PRIV2, [[owner-decision-inbox]] L14.

---

## Confidence

**VERIFIED (read directly from the cited documents this pass):** the contents/verdicts of all §1 sources; every adopted ruling cited from [[owner-rulings]] and the settled list in [[owner-decision-inbox]]; the mount contract, falsification ladder, and adapter caveats from [[mountable-filesystem-semantics]]; the Solana capability ladder/matrix and portable invariants from [[solana]]; the large-file mechanism, trilemma, and 2026-07-07 rulings from [[large-file-uploads]]; the eleven seams from [[human-overview#7. The seams that must be closed]]; the §11 story corpus and stop-rules from [[ethereum-first-efs-and-os]]; the folder-voting requirements and gates.

**PLAUSIBLE (my analysis; falsifiable by later lanes):** every §2 generated journey and its FORCES mapping; the register's grades, locality tags, and cheapest-satisfier column; the §4 L1–L10 loss list as *complete* (individual rows are verified against the ethereum-first §6 table; completeness of the list is my judgment); the T1–T4 reconciliations; the claim that no MUST-grade requirement forces cross-chain machinery (§5.8) — this is the register's strongest and most falsifiable claim, and the authority/lens lanes should attack it; the claim that strong-grade-needing classes and stable-venue-wanting classes coincide (§6 T4).

**Could not verify:** the folder-voting gas figures (22–27k/record spine estimate — marked conditional in its own source); v1-era numbers repeated from the 2026-05-26 brainstorm (eBird/AO3/telemetry volumes, ADR-0020 caps) — treated as order-of-magnitude only; whether the cookbook's ten verdicts survive the envelope/KEL recut (flagged evidence-gated, ledger item 13); [[assumptions-and-requirements]] was consulted only at section-heading level for D-numbering and the R-K11 realm-qualification rule — a full cross-check of this register against its §4 requirements register is owed to the synthesis lane; no gas/cost claim anywhere in this file is measurement-backed (E1/E2 remain open, per [[owner-rulings#2026-07-23]] "none of the chain/authority space is measurement-backed yet").
