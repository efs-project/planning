# Core closeout: shared tag stances and keyed Concept queries

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Execute after reviewed origin-query and described-Type work, with one source/build/chain owner.

**Goal:** Measure a valid, recoverable ASSERT/DENY/SILENT tag profile with both query directions, without one fresh Record per statement or a Realm-wide scan.

**Architecture:** A new experimental purpose binds subject/Concept coordinates to three shared immutable tokens. A required, constructor-pinned Files index extension validates each coordinate before exposing its prefix and maintains one principal-qualified Concept-role inventory. Separate readers preserve origin, attribution and coverage; no old tag or folder behavior changes.

**Tech Stack:** Existing compact Solidity/Foundry/Node prototype, normal deployable EVM limits, independent retained-byte decoding and bounded local paid transactions.

**Spec:** [[core-closeout-tag-gaps-20260915]] plus the experimental contract below. Owner direction is [[../../Designs/efsv2/owner-rulings#Tags — rulings on the tag deep dive|same-Concept ASSERT/DENY/SILENT]]; this plan chooses reversible experiment mechanics, not permanent Type IDs, Commons normalization, or default UI behavior.

## Global Constraints

- One source/build/chain worker in the existing compact prototype. Parent owns canonical main documents and publication. No owner-demo changes, production scaffold, public deployment, dependency installation, Fable or unbounded traces/history.
- Preserve exact Type/Record identity, retained author evidence, all required generic postings/backlinks, shared live/replay folds, ordered acceptance, final Files checks and atomic rollback. New semantic/physical profiles have new honest manifest/execution identities.
- Preserve runtime24,576/initcode49,152 and ordinary15M/hard16,777,216 transaction limits. No smaller supported filename/body/Lens domain or omitted guarantee to make a price look good. A jointly impractical case is a reported limit, not implicit batch splitting.
- Only a closed, ordered Lens at one exact Realm/origin is complete here. Unrelated authors, other chains, tag inference, same-label Concepts, Commons normalization and optional all-author indexes are not silently included.
- Keep existing TAG, `addTag`/`removeTag`, UNBIND folder masks and old readers unchanged. New explicit APIs do not decide the owner's default removal UX. Token first-publisher is never the tag author.
- Value, attribution, basis and assessment stay together. Unknown history cannot fall through; a terminal page alone cannot certify a caller-supplied earlier prefix. Current actions still require current guards.

## Experimental contract and bounded choices

Use a new purpose domain `efs.lab/tag-stance/1` and a new family domain `efs.lab/tag-role-inventory/1`; these are disposable bytes. The coordinate remains `(Principal,purpose,subject,exactConcept)` and target is one of three exact32-byte tokens. Their described Type and retained profile map word1 to ASSERT, word2 to DENY and word3 to SILENT. The original Type declaration and token publisher do not author every use of the token.

Three explicit planner operations are `assertStance`, `denyStance` and `retractToSilent`; each BINDs the corresponding token with the ordinary coordinate CAS. For this new purpose only, generic UNBIND also reduces to semantic silence, retaining its tombstone and history. It never resets physical state to zero. Validate that path too; otherwise the publicly available generic operation would have undefined profile meaning. Do not expose it as a changed legacy UI default.

The one new inverse inventory is:

```text
key = keccak256(abi.encode(familyDomain, Principal, purpose, exactConcept))
value = existing bindingOrdinal
append iff effect.kind == BIND && effect.freshBinding
```

Subject-scope inventory already supplies the opposite direction. Transitions do not append inverse candidates, but still pay mandatory history and token-target backlink work. Candidate counts are retained coordinates, not current ASSERT cardinality. No additional seen map, subject mirror, all-author list, per-pair Record or Core opcode.

Every new-purpose BIND validates at its own admission cutoff, before inherited or new index postings are visible to the next rule. Token/Concept/subject dependencies must exist before this BIND. An invalid BIND followed by a valid overwrite in one publication still rejects. Final validation remains a backstop, not permission for temporarily invalid qualified prefixes. Existing Name-after-BIND terminal semantics remain unchanged.

The profile pins exact token identities, descriptor/preimages, Concept Type/rule, supported revision Types/rules/File offsets, Directory Type/rule, validation version and silence policy. Check actual retained token/Concept/subject identity and order, not caller-supplied classifications. Allowed subjects are an existing CREATE File, validated Directory, or a finite supported revision whose intrinsic File exists and whose parent/File relation follows its exact admitted rule. No inferred existence from a HEAD. No independent claimed-File field is smuggled into B: a revision stance is about its intrinsic File. A planner claiming a different File must refuse.

Historical replay uses the same per-BIND cutoff and the publication's own terminal basis, not today's state. WITHDRAW changes occurrence carriage, not authored stance, token meaning or retained subject identity. Failures unwind Core and every inherited/new index family.

Priority reduction is deliberately not generic first-found followed by token reinterpretation:

```text
for author in orderedClosedLens:
    observation = qualified coordinate history at origin
    UNKNOWN / malformed / unavailable -> UNKNOWN, stop
    proven never-touched / new-purpose tombstone / validated SILENT -> continue
    validated ASSERT or DENY -> return stance with author and evidence
return NOT_PRESENT with complete closed-Lens basis
```

DENY is a qualified negative statement, distinct from no qualifying statement. A diagnostic policy exposes disagreement with attribution; it does not compute objective truth.

## Task 1: Required tag profile and reproducible index

**Execution status September16:** active from independently reviewed live-Files checkpoint `6cffa37`; sole Astra Extra High source/build/bounded-chain worker. Parent owns canonical documents and publication. Consumes the explicit live revision matrix and separately pinned final Files validator; old semantic profiles and owner demo remain unchanged. No stance implementation or cost claim until the task's measurement/review gate.

**Measured-source identity boundary:** the required narrow `virtual` seams on `FilesCarrierIndex._foldEffect` and `LiveFilesIndex._manifestExtension` change compiler metadata and consequently exact rule hashes. Controller permits new exact Types in this fresh-genesis experiment with full source/artifact pins; earlier registered Types, Records and receipts are not relabelled. Inherit the existing live final hook unchanged. This is not an identity-preserving migration or a rule-semantics change; production old/new profile handling remains explicit.

**Files:** create focused `lab-b/test/TagStanceProfile.sol` and `TagStanceProfile.t.sol`; narrow virtual/composition seam in the final reviewed Files index; fixture support and evidence under `lab-b/core-closeout-tags-20260915/`. Reuse described Types; do not add another descriptor language.

**Interfaces:** consumes retained canonical coordinate getters, `Effect.freshBinding`, shared `_foldEffect`/`_validatePublication`, exact Files descriptor configurations and reviewed described-Type registration. Produces a constructor-pinned required profile, exact family-key recipe and replayable retained inventory consumed by Task2. Keep token/Concept/revision validation in one bounded unit shared by live/replay paths.

- [ ] Capture the existing capability gap with a bounded fixture: two authors, shared Concept C and same-label C2, placed Files F/G, orphan H, Directory D and two revisions of F. Existing target backlinks cannot answer the exact Concept-role query; old removal stops lower-priority fallback. These are controls, not edits to old semantics.
- [ ] Define and retain the actual described token/profile bytes before using their IDs. Deploy the full required Files profile from fresh genesis, not an empty replacement that falsely claims past coverage. Its semantic manifest commits every value listed above and its physical commitment pins any helper code/linkage.
- [ ] Implement the validated fold in this order: recover coordinate and verify author/key; validate new-purpose BIND/UNBIND at its own cutoff; run complete inherited fold; append the new inverse only for a fresh BIND. Reuse the existing packed ordinal inventory. Verify the inherited prefix/final hook call order instead of copying a second independent replay algorithm.
- [ ] Keep per-coordinate validation fixed and read-only. If runtime requires extraction, a separately deployed fixed validator may accept explicit Ledger/profile/cutoff inputs under a constructor-pinned codehash. No DELEGATECALL, admin replacement or canonical storage moves. Measure real runtime and initcode including constructor arguments; if this coherent unit still cannot fit or meet existing work bounds, preserve the exact deficit for a controller ruling rather than additional byte-golf.
- [ ] Focused negative controls: wrong token despite matching Type; missing/wrong Concept; future Concept/Directory; unsupported subject/revision; intrinsic File/parent mismatch; invalid-then-valid same-publication overwrite; malformed UNBIND coordinate; later data cannot repair earlier replay. Use actual public operations except explicit fault injection required to model corrupt retained input.
- [ ] Ordered-rule control: BIND-before-dependency with a later rule trying to consume the new tag prefix rejects atomically; dependency-before-BIND succeeds. Preserve old Name-after-BIND positive control. Compare nonce, counts, evidence, heads, inherited postings and new inventory before/after failed operations.
- [ ] Rebuild a detached new-profile index from canonical facts and compare every new list plus inherited affected families, manifest and coverage before checked cutover. ASSERT→DENY→SILENT→ASSERT and new-purpose UNBIND preserve one inverse coordinate, correct token backlinks and actual history. WITHDRAW does not retract the stance.
- [ ] Record ordinary code/initcode sizes and precise warnings; run only focused profile/replay/ordered-Files covering checks. Commit exact source/test/evidence files and return a task report for independent review. No push.

## Task 2: Origin-qualified queries, explicit planners and paid/source-off evidence

**Files:** new `lab-b/test/TagStanceReader.sol`, `TagStanceQuery.t.sol`, a narrow owned consumer reusing the reviewed query mechanism, `browser/tag-stance-profile.mjs` with focused tests, `script/core-tag-stance.mjs`, and the same evidence directory. No visual changes or default-menu integration.

**Interfaces:** consumes Task1's exact configuration/key/validation and reviewed origin-history/owned-prefix mechanism. Produces named `tagsOnSubject` and `subjectsForConcept` operations, separate stable/revision/selected-revision modes, and attributed `PRESENT | NOT_PRESENT | UNKNOWN | NOT_APPLICABLE` assessments compatible with SDK Task1. Pin the concrete reviewed query ABI at dispatch rather than an in-progress worker's ABI.

- [ ] Begin with literal reducer vectors: A SILENT/B ASSERT selects B; A DENY/B ASSERT selects A DENY; A UNKNOWN/B ASSERT stays UNKNOWN; both proven untouched are complete no-statement; new-purpose tombstone falls through; legacy tombstone still masks. Missing discriminants are UNKNOWN, never silent.
- [ ] Implement `tagsOnSubject` from principal-qualified subject lists and `subjectsForConcept` from principal-qualified Concept-role lists. Deduplicate exact roles/subjects, not text labels. Preserve orphan H and distinct C2. Retained inventory traversal pins origin prefix lengths, raw totals and required profile coverage using the reviewed query hooks; no new independent scan engine.
- [ ] The owned consumer fixes caller/session, Realm/profile/execution, closed Lens, exact Concept/subject/mode, origin and next cursor. Accumulate result commitment and unknowns from the beginning. A suffix, reset, forged total, changed origin/profile or failed higher-author history cannot produce COMPLETE absence. Budget exhaustion is PARTIAL, even with zero matches.
- [ ] Stable File, exact revision and Directory testimony remain distinct. Selected-revision mode resolves HEAD at the same origin and checks intrinsic File; a former/losing revision tag cannot become a current selected-File match. A conflicting/unknown HEAD is explicit. Change HEAD between pages and compare against the frozen-origin independent raw-history oracle.
- [ ] Add explicit planner operations only; no visual integration. Each checks exact subject class/Concept/token and creates the existing guarded/CAS publication. Selected-revision planning guards HEAD plus stance coordinate; a changed HEAD rejects. Explicitly tagging a supplied older revision is separately named and does not claim current selection. Test claimed-File mismatch before signing.
- [ ] Paid receipts, not only `eth_call`: matched native/signed first ASSERT on fresh coordinates with existing Concept; new-Concept-plus-ASSERT whole publication; repeated ASSERT→DENY→SILENT→ASSERT and UNBIND; guarded selected-revision tag; inverse-list counts1/2/5/6. Report token/Type/profile deployment, registration and setup separately. Every whole action includes required backlinks, guards, validation and evidence.
- [ ] Execute both query directions through the owned transaction consumer. Retain gas, actual scanned candidates, historical/prefix probes, joins, steps, result commitment and coverage. Use closed Lens sizes1/8/64 only where the real joint workload fits; retain refusal and finite supported combinations. Unrelated authors/Concepts must not increase queried candidate inventory. Relevant history churn may increase bisection work and is charged honestly.
- [ ] Independently interpret the retained archive with source RPC, original index and SDK token labels unavailable. Recompute token/Type IDs, profile mapping, coordinate preimages and `(author,Concept,subject,intrinsicFile,stance,basis)` from retained descriptors/history/evidence. Missing profile/meaning is opaque/PARTIAL, not guessed; byte retention does not authorize original-author replay.
- [ ] Self-review source hashes, raw receipts/calldata and semantic readback. Produce whole-operation, setup and success/refusal tables. No invented economic pass threshold, legacy one-BIND price or isolated append saving is the new full-operation price. Commit exact files; independent review before the final integrated resource run.

## Finish and deliberate nonclaims

This experiment closes a specific capability and measurement gap. It does not choose default remove UX, adopt Commons canonicalization, add all-author search, merge legacy/new semantics or freeze production bytes. Source-off signed/native authority inherits the separately measured supported evidence profile, not a new cross-chain proof claim.

Run after reviewed query/SDK/Types and the finite live-File profile so supported subject configuration is stable; before final native provenance pins and Resource Task2. If the full workload is too expensive, retain the measurement and identify the largest supported operation. Do not remove required indexing or validity while claiming the same guarantee. Candidate A is not another mandatory parallel architecture campaign.
