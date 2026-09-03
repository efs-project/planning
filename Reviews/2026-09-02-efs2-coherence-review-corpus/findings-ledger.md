# Findings ledger — EFS 2.0 coherence and MVP-readiness review

**Status:** preserved finding record for the [2026-09-02 review](../2026-09-02-efs2-coherence-and-mvp-readiness-review.md); dated observations, not rulings

#status/done #kind/review #repo/planning #topic/efsv2 #topic/coherence #pass/2026-09-02-coherence-review

Every row is a cluster: one underlying problem, merged from the lanes that found it independently. The `Verified` line records what actually happened to that row, and the two are not the same for every row.

**What verification covered.** The two-lens adversarial pass — one verifier testing textual accuracy and currency, one testing materiality and classification, each trying to refute the finding — was run over the clusters the lanes rated **blocking**, because those are the ones a decision would rest on. Every other row carries the corroboration it earned from independent lanes converging on it, and says so. A row reading "not separately verified" has not been attacked by a second reader: treat its citation as a pointer to check, not as an established fact. Findings a lens refuted, or showed already dispositioned in the vault, are listed at the bottom rather than deleted. Where a lens re-classified a surviving finding, the ledger follows the lens and records the change.

**Kept:** 267 · **Dropped in verification:** 1 · **Blocking:** 5 · **MVP-relevant:** 153 · **Two-lens verified:** 26

## Count by repair class and owning set

| Repair class | Kept | | Owning set | Kept |
|---|---:|---|---|---:|
| WRONG | 22 | | efsv2 | 108 |
| UNDECIDED | 65 | | web-client-os | 42 |
| DRIFT | 40 | | vault-process | 27 |
| MISSING | 48 | | owner | 25 |
| DIRECTION | 17 | | arcade | 15 |
| DEFECT | 49 | | media-library | 15 |
| CUT | 19 | | open-web-app-store | 11 |
| UNVERIFIABLE | 7 | | git-forge | 10 |
|  |  | | sdk | 10 |
|  |  | | clientv2 | 2 |
|  |  | | efs15 | 2 |

## WRONG — a design statement that is incorrect, unsound, or internally contradictory

### PRD-03 — Arcade sells 'verified'/'exact-artifact' Play from an open-egress frame the runtime law disqualifies

**Owner:** `arcade` · **Neighbours:** `web-client-os`, `efsv2` · **Severity:** important · MVP-relevant

app-runtime-and-direct-launch.md:64-68 rules that 'A profile that can acquire and execute mutable remote code is a separately labelled remote-code session, not an exact-qualified App launch', :646-648 makes a profile explicitly DIRECT_EGRESS absent a measured CSP design, and :652-661 says such a session 'requires explicit Launch, and loses exact-execution, offline and reproducibility qualifications'. Designs/arcade/player-security-model.md:39,:50 keeps srcDoc with meta-CSP rejected and 'Outbound network is NOT blocked', and :112 concedes the frame 'could still <script src>, fetch+eval, or navigate itself to remote content - unverified code inclusion the hash check cannot see', leaving curation as the only control, which the runtime doc does not accept. Measurements confirm public-internet fetch/WebSocket work and that the frame can navigate itself to any URL and stays sandboxed (browser-runner-measurements.md:27,:83,:86,:104-108); Andromeda's info screen does exactly that (andromeda-evidence-reproduction.md:96). Yet arcade/README.md:27,:31, september-plan.md:19 and acceptance item 5 (:99), Kanban.md:19 and ETHOnline-2026.md:51-56 sell 'exact-artifact + tampered-primary + verified-fallback' and 'fetch, digest verification, and launch - in that order'; app-runtime-and-direct-launch.md:862-863 contradicts its own law by ordering 'one exact opaque full-Web App/Arcade fixture with honest direct-egress labeling'. The slice may claim verified bootstrap bytes only, must carry the DIRECT_EGRESS / MUTABLE_REMOTE_EXECUTION_OR_DATA label, and app-runtime:862 must drop or condition 'exact'.

**Evidence:** `Designs/arcade/player-security-model.md:31, :39, :50, :73, :110-112` · `Designs/web-client-os/app-runtime-and-direct-launch.md:64-68, :644-661, :862-863, :1002-1003` · `Reviews/2026-08-13-claude-evidence-round/corpus/runner/browser-runner-measurements.md:27, :83, :86, :104-108` · `Reviews/2026-08-13-claude-evidence-round/corpus/arcade/andromeda-evidence-reproduction.md:96` · `Designs/arcade/README.md:27, :31; september-plan.md:19, :99` · `Kanban.md:19; ETHOnline-2026.md:51-56; Designs/open-web-app-store/architecture.md:500`

**Verified:** not separately verified; clustered from 4 independent lane findings · **Source lanes:** R9-wco-architecture-runt-04, R14-arcade-04, S2-arcade-x-appstore-x-r-03, S8-evidence-bindings-vs-08

### PRD-04 — Arcade README states the falsified mirror-kill beat as the product promise

**Owner:** `arcade` · **Neighbours:** `efsv2` · **Severity:** important · MVP-relevant

Designs/arcade/README.md:31 states the promise as 'at least one visibly EFS-only behavior (a mirror dies live; the link keeps working)'. product-and-communities.md:35 calls the mirror-kill/tamper/rebuild demos 'parity beats plus on-chain identity' and says only curator plurality is 'the one property no incumbent has'. Both falsification passes classify mirror-fallback CONVENTIONAL-BASELINE-SUFFICIENT and plurality UNRESOLVED and not blockchain-specific (pass 1 §Classification rows 3 and 5, lines 121-131; pass 2 rows 3 and 5, lines 112-122), and pass 2 names honest dead-link metadata as 'the only real gap found' (line 130). CORRECTIONS.md:25 scopes this as a hypothesis challenge that 'does not trigger STOP or settle product scope by itself' and :31 limits the v1 defect citations to product pressure - so the defect is not that the beat is dead but that README:31 states a falsified beat as the promise while README:35 already labels it parity, an internal contradiction inside one file. Repair: rewrite README.md:29-31 to name what is actually tested, or mark the mirror beat as parity.

**Evidence:** `Designs/arcade/README.md:29-35 (promise line 31; parity label line 35)` · `Designs/arcade/product-and-communities.md:35, :73` · `Reviews/2026-08-13-claude-evidence-round/corpus/arcade/arcade-falsification-pass-1.md:115, 121-131` · `Reviews/2026-08-13-claude-evidence-round/corpus/arcade/arcade-falsification-pass-2.md:112-122, :130` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:15, 25, 31`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R18-evidence-round-04, S8-evidence-bindings-vs-10

### CORE-13 — Three Type-object vocabularies and two RecordId preimages among current docs; the README's 'older files' claim is false

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `sdk` · **Severity:** important · MVP-relevant

Designs/efsv2/README.md:71-72 says 'TypeSchema is the current plain-language name; older files call similar concepts TypeRevision', but the README-designated current Type proposal layered-type-system-and-data-abi.md (2026-08-14, the newest spine doc) uses TypeRevisionId 12 times and TypeSchema zero times (:200, 344-353, 374-375) -- the claim is false for the doc it promotes. The two identifiers carry different RecordId preimages: core-architecture-candidate.md §Record (:115) defines RecordId = H(domain, typeSchemaId, canonicalBody) while layered:380 defines RecordId = H(DOM_RECORD, TypeRevisionId, H(canonicalBody)), a nested hash the candidate does not have, and no document maps the two formulas. A third spelling, TypeSchemaId, is used by hierarchical-files-and-folders.md (:369, 603, 1814), B0 (b0-encoding-and-ids.md:799) and Glossary.md:215, 240-242, while two product packets already export TypeRevision-family names durably (type-data-abi-boundary-pressure.md:81, 491 'EfsTypeRevision'; mvp-and-acceptance.md §I 690-730). candidate:68 calls TypeRevision 'confusing' and constitution:288 lists the name as not frozen; the candidate deferred the developer name until 'after the Fable review' (:444-445) -- the Fable pass ran on 2026-08-13 and did not decide it. The SDK needs one name now and there is no crosswalk sentence anywhere.

**Evidence:** `Designs/efsv2/README.md:71-72, 75-80` · `Designs/efsv2/layered-type-system-and-data-abi.md:200, 344-353, 374-375, 380 (TypeRevisionId x12, TypeSchema x0)` · `Designs/efsv2/core-architecture-candidate.md:68, 115 (§Record RecordId), 444-445; Designs/efsv2/system-constitution.md:288` · `Designs/efsv2/hierarchical-files-and-folders.md:369, 603, 1814; Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md:799; Glossary.md:215, 240-242` · `Designs/web-client-os/type-data-abi-boundary-pressure.md:81, 491; Designs/web-client-os/mvp-and-acceptance.md:690-730; README.md:direction 12`

**Verified:** not separately verified; clustered from 5 independent lane findings · **Source lanes:** R1-efsv2-spine-04, R2-efsv2-types-ids-oncha-01, S7-efsv2-object-model-co-01, J1-mvp-first-06, S13-never-decided-23

### CORE-15 — AdmissionIntent is optional in the candidate, mandatory with a different field list in B0/Files/MVP, unnamed in the constitution

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `sdk`, `owner` · **Severity:** important · MVP-relevant

core-architecture-candidate.md:143-158 sketches 'AdmissionIntent? {realmId, action, occurrenceRefs, nonce/expiry, authorization witness}' as optional ('can authorize local effects') and :416 keeps 'portable authored Envelope + Realm AdmissionIntent | deliberately Realm-bound Envelope' as an open bakeoff row. B0 fixes something else and makes it mandatory: SR-3 (b0-overview.md:104-143) pins {realmId, envelopeId, leafMask, action MBZ, expectedRevisions[], nonceKey, nonceSeq, notAfter} under a Realm-bound EIP-712 domain 'EFS2-AdmissionIntent' with 2-D nonce lanes (b0-authorship-envelope.md:822-867), and SR-12 makes it required for every BindingSet/BindingTombstone leaf. mvp-and-acceptance.md:74-78, 247-249 and acceptance C (:386-396) name SR-3's fields verbatim and the pressure matrix (:830) calls it 'Candidate requirement from B0/Files reconciliation'; hierarchical-files-and-folders.md §8.2 says B0's /1 cannot be FILES_PRECONDITION_CERTIFIED and proposes RoutedAdmissionIntent/1 instead. system-constitution.md has zero hits for AdmissionIntent (only the open question at :348-350), and STATUS.md:46 says no Stage A proposal is adopted. The bytes a wallet will actually sign exist only in an unadopted corpus while the spine implies they may be optional and the axis they sit on is an open bakeoff whose F3 arm removes the intent entirely -- so nothing tells the SDK whether to carry one arm or both.

**Evidence:** `Designs/efsv2/core-architecture-candidate.md:143-158, 416` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md:SR-3 lines 104-143; SR-12 lines 336-350` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-authorship-envelope.md:822-867, 1206-1210, 369-403` · `Designs/web-client-os/mvp-and-acceptance.md:74-78, 247-261, 386-396, 830` · `Designs/efsv2/hierarchical-files-and-folders.md:1138-1147, 1161-1167, 1173-1200` · `Designs/efsv2/system-constitution.md:348-350 (0 hits for AdmissionIntent); Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:3, 46`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R8-wco-product-mvp-priva-06, S6-sdk-and-mount-spread-05, S7-efsv2-object-model-co-04

### CORE-17 — The point-resolution outcome enum is spelled four ways across current docs; reconciling edit A4 is unapplied

**Owner:** `efsv2` · **Neighbours:** `sdk`, `web-client-os` · **Severity:** important · MVP-relevant

This is contract-facing ABI semantics, not prose. system-constitution.md:195-196 says 'FOUND, proved ABSENT, conflict, unsupported, or UNKNOWN' (mixed case); fable-efs2-core-engineering-kickoff.md:61 lists four outcomes 'FOUND/ABSENT/CONFLICT/UNKNOWN'; core-architecture-candidate.md:319-322 folds unsupported into UNKNOWN ('UNKNOWN is reserved for unsupported profiles, partial replicas ... a missing required basis') and never defines CONFLICT; b0-overview.md:50 and the b0-lens Presence enum pin exactly five upper-case outcomes with cause codes. Downstream the set keeps growing: hierarchical-files-and-folders.md:639-648 adds MASKED, MALFORMED_SELECTED and NOT_A_DIRECTORY, and mvp-and-acceptance.md:700-702 defines ResourceOutcome<T> as PARTIAL, typed UNKNOWN, proved ABSENT, MASKED, CONFLICT, INVALID, UNSUPPORTED which 'cannot collapse'. proposed-spine-edits.md A4 (:223-325) proposes one enum plus four cause codes and logs the contradiction (:856); it is unapplied. Separately the candidate calls the Plan 'the bounded immutable contract object' while hierarchical-files-and-folders.md:92, 504-506 treats it as a Record Type ResolutionPlan/1, and Stage A gap G-5 routes the whole result model to an 'SDK result-model lane' (STATUS.md:68) for which no v2 SDK design exists -- so the MVP's read contract is a superset nobody upstream ratified.

**Evidence:** `Designs/efsv2/system-constitution.md:195-196; Designs/efsv2/core-architecture-candidate.md:319-322` · `Designs/efsv2/fable-efs2-core-engineering-kickoff.md:61` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md:§1 line 50; chapters/b0-lens.md Presence enum` · `Designs/efsv2/hierarchical-files-and-folders.md:92, 504-506, 639-648; Designs/web-client-os/mvp-and-acceptance.md:700-702` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:§A4 lines 223-325; line 856; STATUS.md:68 (G-5)`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R6-stageA-overview-02, R1-efsv2-spine-09, S7-efsv2-object-model-co-07

### CORE-20 — FileRevision/1.parents is typed ref(record self), so the first Files Type evolution severs revision lineage

**Owner:** `efsv2` · **Neighbours:** `web-client-os` · **Severity:** important · MVP-relevant

hierarchical-files-and-folders.md:449-463 defines FileRevision/1 { ... parents array(max=8, ref(record self)) }. type-data-abi-boundary-pressure.md:512, 592-596 states the defect precisely: 'ref(record self) is exact-Type-revision self and therefore cannot cite /1 from /2', so 'If a /2 revision cites a /1 parent, exact ref(record self) is insufficient'; mvp-and-acceptance.md:733 repeats 'exact self does not cross /1 -> /2' and :723-726 defines the FileRevisionFixture/1 -> /2 evolution, with fixture TDAB-E2 requiring an explicitly finite {v1,v2} target set or a pinned View instead. Under either Type arm, publishing FileRevision/2 breaks Publish-revision history the first time the Files Type changes, and layered-type-system-and-data-abi.md:1025-1027 warns such field choices 'cannot be edited away'. The finding was produced by the product set on 2026-08-22 and has never been fed back: the Files proposal §3.3 mentions no finite target set or View, and §13 has no fixture for it. The fix -- a finite same-object target set, or ANY plus same-object validation -- must land before even disposable revision bytes are minted.

**Evidence:** `Designs/efsv2/hierarchical-files-and-folders.md:446-463 (parents array(max=8, ref(record self)))` · `Designs/web-client-os/type-data-abi-boundary-pressure.md:512, 559, 592-596` · `Designs/web-client-os/mvp-and-acceptance.md:723-737` · `Designs/efsv2/layered-type-system-and-data-abi.md:1025-1027`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R2-efsv2-types-ids-oncha-12, S7-efsv2-object-model-co-06

### CORE-35 — Owner ruling 13 (sha-256 to file) is marked COVERED although no content-layer Type declares DIGEST_EQ

**Owner:** `efsv2` · **Neighbours:** `arcade`, `open-web-app-store`, `media-library` · **Severity:** important · MVP-relevant

b0-indexes.md §3.5 (:940-963) realizes owner ruling 13 as KIND_DIGEST postings written only for fields declared DIGEST_EQ, and b0-content-locators.md §2 (:185-193) claims the lookup 'costs nothing extra' -- compute RecordId(ByteDigest/1{0x0012,d}), point-read, then 'walk declared backlinks (bindings, closures, locators)'. But §6 (:494-511) defines RepresentationBinding/1.externalDigest as a ByteDigestValue with only a subject backlink to ChunkTree/ArtifactClosure -- no REF to ByteDigest/1 and no DIGEST_EQ -- and Locator/1.observedDigest likewise; the strings DIGEST_EQ, KIND_DIGEST and lookupByDigest occur zero times in the content chapter while the §2 diagram still draws 'external' as an edge to ByteDigest/1. Consequently lookupByDigest(0x0012, sha256-of-a-released-closure) returns COMPLETE+empty, which b0-indexes §5.2 rule 1 defines as proven absence -- the 'confirmed, then unreadable' failure shape -- while traceability.md OR-13 (:302) still records COVERED via 'FX-ARC/FX-50GB digest lookups' although neither fixture declares a DIGEST_EQ field (the corpus's only declarer is GitObject/1 at harness:493).

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:§3.5 lines 940-963; §5.2 lines 1321-1332` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:§2 lines 155-193; §3 lines 239-247; §6 lines 494-511` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:OR-13 line 302` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:line 493; §2.1 lines 716-735; §2.8 lines 1114-1130` · `Designs/efsv2/owner-rulings.md:2026-07-15 item 13 line 63`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R7b-stageA-b0-indexes-le-04

### CORE2-11 — 'Mount' names two different things in current efsv2 docs and the Glossary defines neither

**Owner:** `efsv2` · **Neighbours:** `web-client-os` · **Severity:** important · not on the MVP path

`Designs/efsv2/mountable-filesystem-semantics.md` uses 'mount' for a host-side projection with a conceptual `EfsMountDescriptor { root, lens, evidenceSources, byteSources, basis, completenessPolicy, writeActor?, journal?, publishPolicy?, cachePolicy }` (lines 70-87) and an `efsd` daemon (§4 mount(...), 299-314). `hierarchical-files-and-folders.md` §3.4 (494-550) defines a Core Record Type `MountDescriptor/1 { rootNode, profileId, configRef }` as 'the extensible authority boundary' for a subtree's namespace/content Plans, with `mountOverride`, `FILES_PUBLIC_MOUNT_PROFILE_V1`, `PublicFilesMountConfig/1` and `FilesRouteConfig/1.rootMount`. The drive plan (`docs/superpowers/plans/2026-08-14-efs2-files-readonly-mounts.md`, Goal and Task 2 step 2) uses both senses in one document, and `Glossary.md` has no entry for Mount, MountDescriptor, EfsMountDescriptor, OS Drives or Protocol SDK, so reviewers and adapter authors will conflate a host mount with a Files authority boundary.

**Evidence:** `Designs/efsv2/mountable-filesystem-semantics.md:70-87, 299-314` · `Designs/efsv2/hierarchical-files-and-folders.md:494-550 (§3.4), 565-593 (§3.5)` · `docs/superpowers/plans/2026-08-14-efs2-files-readonly-mounts.md:Goal, Task 2 step 2` · `Glossary.md: no Mount/MountDescriptor/Drive/Protocol SDK headings`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R17-sdk-and-mounts-08

### PRD-22 — Edition sits inconsistently in the shared identity tree: Plex needs Work->Edition->Representation, the shared model makes them siblings

**Owner:** `media-library` · **Neighbours:** `efsv2` · **Severity:** important · MVP-relevant

plex-jellyfin-app.md:34-37 adopts 'Work -> Edition -> Representation -> Exact Blob' (Plex: Edition = director's cut, Version = encoding) and PLEX-02 (:117) needs several encodes per episode, but media-infrastructure.md:71-88 and booru-app.md:114-117 make AuthoredEdition/ReleaseClaim a sibling of Representation under CreativeWork with no Representation->Edition relation, and the intake's fixture-pressure-map.md:100-113 does the same. In the shared model a 1080p encode of the director's cut cannot be distinguished from a 1080p encode of the theatrical cut. Separately the shared tree nests Post/Submission under CreativeWork while booru-app.md:105-118 lets a Post present an exact Representation directly (its own open question 1). MEDIA-E3 (profiles) cannot close until this is fixed.

**Evidence:** `Designs/media-library/plex-jellyfin-app.md:34-37, :117 (PLEX-02)` · `Designs/media-library/media-infrastructure.md:71-88` · `Designs/media-library/booru-app.md:105-118` · `Reviews/2026-08-14-media-library-intake/fixture-pressure-map.md:100-113`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R13-media-library-09

### PRD-27 — TagAssertion has two incompatible shapes in one set; only the two-field shape supports the planned point probe

**Owner:** `media-library` · **Neighbours:** `efsv2` · **Severity:** important · not on the MVP path

booru-app.md:153-161 defines TagAssertion(target, tagConcept, polarity, scope, confidence?, evidenceRefs[]) while query-and-indexing.md:127-128 shape 1 is an 'exact author-neutral TagAssertion(target, tag) ... point-queryable liveness'. Only the two-field shape supports the same-basis point probe the set plans: under B0 the basis-pinned membership probe is a bounded KIND_BY_RECORD page for a known RecordId (b0-indexes.md:412,:415,:554-561,:1159-1174), which works only when the RecordId is derivable from (post, tag). Putting polarity in the body also makes ASSERT and DENY share the tag backlink key and liveCount, so separating them needs two Types, a compound key, or per-item body reads. (Correction to the R13 lane: B0 does provide basis-pinned membership; what it lacks is count-at-basis.) Repair: media picks one canonical shape - or two Types - before the Query Lab.

**Evidence:** `Designs/media-library/booru-app.md:153-161` · `Designs/media-library/query-and-indexing.md:127-128` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:412, :415, :554-561, :1159-1174, :2077-2080`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S3-media-x-types-x-index-02

### PRD-31 — PackageRelease version label: label-in in prose, testimony in OWS-R4, label-out in the fixture, identity-bearing under the store's own B0 mapping

**Owner:** `open-web-app-store` · **Neighbours:** `efsv2`, `web-client-os` · **Severity:** important · MVP-relevant

architecture.md:236-239 defines PackageRelease as 'an immutable authored claim connecting one Project, exact Manifest, exact payload closure, and human version label' while OWS-R4 (:74) says 'Labels such as 1.2.3 are testimony, never identity or global ordering', and the identity-changing list at :250-254 omits the label, leaving its role undefined. Under the store's own B0 mapping (:821) to ArtifactRelease/1, versionLabel is a Record body field (b0-content-locators.md:788-796) and RecordId = H(domain, typeSchemaId, canonicalBody) (core-architecture-candidate.md:115), so a relabel alone mints a new Release; the layered arm's TypePackageRelease/1 likewise carries releaseVersion in-body (layered-type-system-and-data-abi.md:658-664), and the OS lock commits to publisher-qualified ReleaseRefs (system-profiles-and-generations.md:260), so under label-in a relabel also makes a new lock. The 2026-08-22 fixture ran a label-out VersionLabelClaim/1 arm, says it 'intentionally pressures current prose' and recommends 'repair the draft toward label-out before promotion' (fixture README:61,:226-229). The repair is tracked nowhere: the store inbox was last reconciled 2026-08-14 and architecture.md §Open questions (965-990) is silent.

**Evidence:** `Designs/open-web-app-store/architecture.md:74 (OWS-R4), :236-258, :821, :965-990` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:788-796` · `Designs/efsv2/core-architecture-candidate.md:115; layered-type-system-and-data-abi.md:658-664` · `Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md:61, :226-229` · `Designs/web-client-os/system-profiles-and-generations.md:260` · `Designs/open-web-app-store/owner-decision-inbox.md:5`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R12-open-web-app-store-02, S1-appstore-x-os-x-types-02

### CLI-15 — README 'MVP critical path' routes through a fixture that cannot satisfy acceptance

**Owner:** `web-client-os` · **Neighbours:** `efsv2` · **Severity:** important · MVP-relevant

Designs/web-client-os/README.md §Current work sequence item 3 declares the "MVP critical path" to be freezing the symbolic inputs of type-data-abi-boundary-pressure.md and converting the guest-read and File Browser write journeys into "one disposable exact-Type fixture". mvp-and-acceptance.md §I last box says that experiment "contacts no live wallet, live Realm RPC or live carrier, uses only synthetic retained Realm/carrier fixtures", while acceptance C requires a real EIP-6963 provider and G requires clean-browser read-back from a named carrier — so the declared critical path cannot satisfy the acceptance it is supposed to lead to. README direction 12 also states the exact-Type adapter is "a reversible adapter recommendation and pressure fixture, not an inferred selection". product-constitution-and-roadmap.md §Staged roadmap Slices A-C never mention the Type adapter at all.

**Evidence:** `Designs/web-client-os/README.md:§Current work sequence item 3; §Direct owner direction item 12` · `Designs/web-client-os/mvp-and-acceptance.md:§I. Layered Type/Data-ABI boundary last checkbox` · `Designs/web-client-os/mvp-and-acceptance.md:§C. Official writes checkbox 3` · `Designs/web-client-os/product-constitution-and-roadmap.md:§Staged roadmap Slices A-C`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R8-wco-product-mvp-priva-04

### CLI-16 — Type/Data-ABI adapter claims arm-neutrality but uses Architecture-C vocabulary

**Owner:** `web-client-os` · **Neighbours:** `efsv2` · **Severity:** important · MVP-relevant

type-data-abi-boundary-pressure.md §Authority and non-adoption boundary says "This packet uses symbolic profile and Type references so neither arm becomes a de facto SDK ABI", and README direction 12 plus mvp-and-acceptance.md:912 say no Type/query-identity choice is inferred. Yet §Candidate adapter contract gives FilesConsumerAdapterDescriptor the fields requiredExactTypeQueries[]{queryProfileRef} and acceptedViewProjections[]{viewRevisionRef, viewBindingCommitmentRef, bindingPlacement}, and §Disposable evolution fixture step 1 mints a new LogicalShapeId/RepresentationId/TypeRevisionId (optionally SemanticSpecId) while step 7 says a v2 index "receives a new QueryProfile". Under the B0/Variant-A control — core-architecture-candidate.md §Type Schema Variant A "hashes semantic meaning, shape, validation, reference roles, and canonical index obligations into one TypeSchemaId", and layered-type-system-and-data-abi.md §A "an index or representation improvement changes the Type and all subsequent Record IDs" — none of those identifiers exists separately and TDAB-E1/Q1 cannot run as written. The app-facing DTOs and the ResourceOutcome law are genuinely neutral; the descriptor and the evolution fixture are not.

**Evidence:** `Designs/web-client-os/type-data-abi-boundary-pressure.md:§Authority and non-adoption boundary; §Candidate adapter contract (FilesConsumerAdapterDescriptor); §Disposable evolution fixture steps 1 and 7` · `Designs/efsv2/core-architecture-candidate.md:§Type Schema (Variant A / Variant B)` · `Designs/efsv2/layered-type-system-and-data-abi.md:§A — bundled exact Type` · `Designs/web-client-os/README.md:§Direct owner direction item 12; Designs/web-client-os/mvp-and-acceptance.md:912`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R10-wco-technology-stand-01

### CORE2-18 — Stage A CHAIN_HISTORY conflates blob DA with calldata and outranks funded pins

**Owner:** `efsv2` · **Neighbours:** `media-library`, `web-client-os` · **Severity:** minor · not on the MVP path

`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md` §10.1 (lines 857-872) defines DurabilityGrade ordinal 3 CHAIN_HISTORY as 'bytes rode a chain's history/DA, archival-grade' and ranks it above FUNDED_PINNED (2) and BEST_EFFORT (1), citing only EIP-4444 partial history expiry, and custodyFloor reads class >= F as satisfying a release floor — so a blob-carried chunk could satisfy a floor a funded pin cannot. The same-day evidence shows blob DA is protocol-guaranteed only 4,096 epochs ≈ 18.2 days, after which bytes survive only at Blobscan/commercial/volunteer archives while commitments persist (`l1-incidents-and-dead-data.md` §B7; `CORRECTIONS.md`:16), whereas calldata from block 15,000,000 was served by default on the test day: one ordinal cannot describe both. It also inverts the owner's own grading — `owner-rulings.md` 2026-07-15 item 16 grades chain-carried file bytes 'DA-tier, honestly graded @EPHEMERAL', and `large-file-uploads.md`:67, 81 reserves the blob tier citing the ~18-day prune — and it contradicts the evidence round's cross-domain failure shape, 'confirmed, then unreadable'. No current doc in Designs/ places durable data in blobs, so this bites only if Stage B adopts the ordinal; repair is to split CALLDATA_HISTORY from BLOB_DA or fold blob DA into EPHEMERAL.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:§10.1 lines 826-833, 857-873` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/l1-incidents-and-dead-data.md:§B7 lines 186-201` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:16, 28` · `Designs/efsv2/owner-rulings.md:§2026-07-15 item 16 (line 66)` · `Designs/efsv2/large-file-uploads.md:67, 81` · `Designs/media-library/media-infrastructure.md:186-189, 358`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R18-evidence-round-03, R3-efsv2-files-17, S8-evidence-bindings-vs-05

### CORE2-32 — Files read bounds and certified-write bounds are inconsistent and the consequence is unstated

**Owner:** `efsv2` · **Severity:** minor · not on the MVP path

`Designs/efsv2/hierarchical-files-and-folders.md` §2.5 (321-322) requires every Files/1 client to support at least 256 segments, 32,768 decoded path bytes and 64 mount transitions, while §8.2 (1302-1303) caps a certified FilesOperation at 'Source plus destination ... at most 64 segments and 4,096 name bytes'. A path every client must resolve can therefore never be certified-created, renamed or unlinked, and the document never states this consequence or names the result code such an operation returns.

**Evidence:** `Designs/efsv2/hierarchical-files-and-folders.md:§2.5 lines 321-322` · `Designs/efsv2/hierarchical-files-and-folders.md:§8.2 lines 1302-1303`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R3-efsv2-files-14

### PRD-24 — Media inbox lists the no-scrape / creator-consent rule as 'Already settled' with no ruling behind it

**Owner:** `media-library` · **Neighbours:** `owner`, `vault-process` · **Severity:** minor · MVP-relevant

Designs/media-library/owner-decision-inbox.md 'Already settled' (lines 62-74) states as settled that 'A public seed is creator/rightsholder/steward authorized ... do not scrape an incumbent booru or creator platform into permanent public bytes.' Designs/media-library/owner-rulings.md:13-39 records only the three-tracks and query rulings; neither Designs/efsv2/owner-rulings.md nor Decisions.md contains any such entry (grep), and the intake itself labels it a 'Mature research recommendation, not an owner ruling' (Reviews/2026-08-14-media-library-intake/README.md:71-83). The policy is sound; its authority label is not, and MEDIA-L1/L2 build on it as though the owner had ruled.

**Evidence:** `Designs/media-library/owner-decision-inbox.md:62-74` · `Designs/media-library/owner-rulings.md:13-39` · `Reviews/2026-08-14-media-library-intake/README.md:71-83` · `Decisions.md (grep media / 2026-08-14: no entry)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R13-media-library-12

### PRD-29 — liveCount is displayed as a post/curator count but counts Occurrences including denials and duplicate curators

**Owner:** `media-library` · **Neighbours:** `efsv2` · **Severity:** minor · not on the MVP path

B0 states that 'liveCount counts live Occurrences under a key' and explicitly 'does NOT claim: distinct Principals, distinct Records' (b0-indexes.md:919-921,:1470-1472). Media's Q2 lists 'Current live count' as an on-chain query class and Q3 steps 1-2 choose the rarer tag by that count (query-and-indexing.md:96,:116-117); under assertion shape 1 the key mixes ASSERT and DENY and every curator adds one, which the intake's FT-PRINCIPAL-COUNT falsifier states exactly (fixture-pressure-map.md:175-187). Harmless as a rarity heuristic, wrong as a displayed 'posts tagged X'. Repair: label counts() as an occurrence upper bound and derive post counts client-side or via the Binding shape.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:919-921, :1470-1472` · `Designs/media-library/query-and-indexing.md:96, :116-117` · `Reviews/2026-08-14-media-library-intake/fixture-pressure-map.md:175-187`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S3-media-x-types-x-index-07

### PRD-30 — 1/8/32/64-curator point policies are cited for tag claims that are not Bindings

**Owner:** `media-library` · **Neighbours:** `efsv2` · **Severity:** minor · not on the MVP path

Media's Stage B extension and BOORU measurements list 1/8/32/64-curator point policies over tag search, and Q2 pairs curator choice with Binding/Lens point reads (query-and-indexing.md:96,:129,:320; booru-app.md:352). The contract Lens resolves Binding heads at one PositionKey (core-architecture-candidate.md:314-315; system-constitution.md:194-196) and a TagAssertion Occurrence is not a Binding, so a 64-curator policy over assertions is a client-side fold over the principalIds of a hydrated page (intake FT-SET disposition, fixture-pressure-map.md:170-173). Only shape 2 - Position(target, tag) Bindings - puts the policy on-chain, at about 217k gas per Binding leaf and one Lens resolve per (post, tag) (b0-binding.md:624). Repair: state per measurement which shape it exercises, and do not cite Lens numbers for shape 1.

**Evidence:** `Designs/media-library/query-and-indexing.md:96, :129, :320; booru-app.md:352` · `Designs/efsv2/core-architecture-candidate.md:314-315; system-constitution.md:194-196` · `Reviews/2026-08-14-media-library-intake/fixture-pressure-map.md:170-173` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md:624`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S3-media-x-types-x-index-10

### PRO-52 — The ruling ledger contradicts itself on the persona model

**Owner:** `owner` · **Neighbours:** `efsv2`, `vault-process` · **Severity:** minor · not on the MVP path

owner-rulings.md §2026-07-15 (L72-79) records James: "the mainstream default is ONE root that recovers and manages all your addresses/personas… Unlinkable personas are an opt-in capability… unlinkable derived personas, opt-in (stealth-address pattern… all recoverable from one root)". The next day's agent entry (§2026-07-16 COURSE-CORRECTION, L88-91) says "The derived-stealth-persona hybrid in the 2026-07-15 persona note is MOOT — kel.md deliberately keeps stealth for disposable one-shots; durable pseudonyms = full KELs. Personas can't share a recovery root", inverting the ledger's own precedence (attributed rulings over designs, system-constitution.md L22-31). The July privacy pass (privacy.md L87, L165, L173; privacy-pass-synthesis.md PC-8 L33) blessed self-derived stealth fleets from one root — James's model — while kel.md §11.1 L578-589 requires separate KELs and recovery per persona. The 2026-08-12 reset reopens the mechanism so nothing current is broken, but the canonical record holds two incompatible models and nobody has said which sentence James actually holds.

**Evidence:** `Designs/efsv2/owner-rulings.md:2026-07-15 KEL persona model L72-79; 2026-07-16 COURSE-CORRECTION L88-91` · `Designs/efsv2/kel.md:§11.1 L578-589` · `Designs/efsv2/privacy.md:L87, L165, L173` · `Designs/efsv2/privacy-pass-synthesis.md:PC-8 L33` · `Designs/efsv2/system-constitution.md:L22-31 (source precedence)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R4-efsv2-identity-lens-p-05

### CLI-29 — Time budgets reference an undefined reference device; the evidence gate cannot pass

**Owner:** `web-client-os` · **Neighbours:** `vault-process` · **Severity:** minor · MVP-relevant

mvp-and-acceptance.md §Provisional performance budgets ties every time budget (<=500 ms warm and <=1.5 s cold frame, <=3 s useful listing, <=150 ms parse/compile, long tasks) to "the reference mid-tier device", which is defined nowhere, then says "The first experiment must select the normative device/browser/route/source matrix and replace these numbers. Until then, a missing measurement fails the evidence gate" — a gate that cannot pass until an unassigned selection is made. That selection is an open question in README.md §Open questions item 1, product-constitution-and-roadmap.md §Open questions last item and mvp-and-acceptance.md §Open questions item 6, with no owner and no client inbox to carry it. The source envelope's "each fixed Realm/RPC response TTFB <= 600 ms" and "one directory page" additionally presume a deployed Core and page ABI that do not exist. The byte budgets (15 KiB ingress, 250/400 KiB executable, 1.2 MiB viewer, <=2 waterfalls, 0 unrequested bytes) are measurable now and should be kept.

**Evidence:** `Designs/web-client-os/mvp-and-acceptance.md:§Provisional performance budgets table and envelope paragraph; §Open questions item 6` · `Designs/web-client-os/README.md:§Open questions item 1` · `Designs/web-client-os/product-constitution-and-roadmap.md:§Open questions last item`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R8-wco-product-mvp-priva-10

### CLI-32 — Two labels for one write state: UNSUPPORTED versus EXPERIMENTAL_DIRECT_CORE

**Owner:** `web-client-os` · **Neighbours:** `efsv2` · **Severity:** minor · MVP-relevant

ethereum-standards-and-interop.md §Typed actions, signatures, and historical verification says "If the current Core/adapter profile cannot name that consumer and prove the rule, the write profile is UNSUPPORTED; EIP-712 does not fill the gap." Designs/efsv2/hierarchical-files-and-folders.md §8.2 FilesRouter says B0 AdmissionIntent/1 "is bearer authorization to Core. It does not name an executor or commit to the complete routed operation ... No /1 operation may be reported as FILES_PRECONDITION_CERTIFIED." product-constitution-and-roadmap.md §Slice B and type-data-abi-boundary-pressure.md §Core pressure packet 2 label that same state EXPERIMENTAL_DIRECT_CORE with protocolConformance=false and filesPreconditionCertified=false, and let planning return PLAN_READY. Neither document says whether Core's nonce consumption satisfies the "authoritative consumer plus ordered effect commitment" rule for the Files-level effect, so the MVP write lane is simultaneously permitted and UNSUPPORTED. One reconciling sentence fixes it.

**Evidence:** `Designs/web-client-os/ethereum-standards-and-interop.md:§Typed actions, signatures, and historical verification (AuthorizationConsumptionProfile paragraph)` · `Designs/efsv2/hierarchical-files-and-folders.md:§8.2 FilesRouter` · `Designs/web-client-os/product-constitution-and-roadmap.md:§Slice B` · `Designs/web-client-os/type-data-abi-boundary-pressure.md:§Core pressure packet 2 (Interim); §Interface-bound actions`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R10-wco-technology-stand-15

### CLI-36 — Three current docs name a different 'first' runner fixture

**Owner:** `web-client-os` · **Severity:** minor · not on the MVP path

system-profiles-and-generations.md:964-991 calls the Core Wasm service lane the "Preferred first usable lane" and :1185-1194 orders a disposable Core-Wasm Worker fixture under MVP reservation. app-runtime-and-direct-launch.md:456 makes SES in a dedicated Worker the "Practical first JavaScript lane", its delivery sequence starts with ses-worker-bundle-v0 (:573-585) and its first third-party proof starts with a SES App (:855-868). product-constitution-and-roadmap.md:285-295 orders SES, then Wasm, then Arcade, while mvp-and-acceptance.md:677-682 requires only the Wasm fixture. The lanes serve different workloads, but the first disposable experiment is named inconsistently across four current documents.

**Evidence:** `Designs/web-client-os/system-profiles-and-generations.md:964-991; :1185-1194` · `Designs/web-client-os/app-runtime-and-direct-launch.md:456; :573-585; :855-868` · `Designs/web-client-os/product-constitution-and-roadmap.md:285-295` · `Designs/web-client-os/mvp-and-acceptance.md:677-682`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R9-wco-architecture-runt-12

## UNDECIDED — assumed by one or more sets; decided and owned by nobody

### CORE-05 — No byte carrier is designed or owned for the MVP 'create a file from local bytes' journey

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `sdk` · **Severity:** blocking · blocks the MVP

Slice C gates New file/Publish revision on 'one explicit content carrier, Locator, commitment, cleanup boundary, and verified read-back profile', and acceptance C requires the guest to verify 'the committed bytes from a named carrier' -- but no web-client-os document names a carrier (grep for Arweave, blob, 4844, IPFS pinning across README, product-constitution-and-roadmap, mvp-and-acceptance and privacy-and-agents returns zero hits). mvp-and-acceptance.md §Open questions item 2 still asks 'Which exact byte carrier and retention receipt can support clean-browser file read-back', and hierarchical-files-and-folders.md leaves 'Evidence gate - locator policy' open. The July storage direction (owner-rulings.md 2026-07-10 §Storage, 'on-chain + Arweave now') is a mechanism-level ruling the 2026-08-12 reset says must re-earn inclusion, so it cannot simply be inherited. The evidence closes the easy substitutes: CORRECTIONS.md records blob bytes guaranteed only ~18.2 days and ethereum-standards-and-interop.md:445 marks EIP-4844 'Negative evidence for durable storage'. The MVP's central write journey therefore has no design and no owner.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

No current byte-carrier design is owned for the MVP "create a file from local bytes" journey. Slice C gates New file/Publish revision on "one explicit content carrier, Locator, commitment, cleanup boundary, and verified read-back profile" (product-constitution-and-roadmap.md:279-280) and acceptance C requires the guest to verify "the committed bytes from a named carrier" (mvp-and-acceptance.md:413-414) — but no web-client-os document names one: "Arweave", "4844" and EIP-sense "blob" return zero hits across README, product-constitution-and-roadmap, mvp-and-acceptance and privacy-and-agents, and the IPFS mentions there (mvp:534-535, 551, 793, 804; README:523; privacy-and-agents:166) are client-hosting origins and endpoint classes to disclose, never a content carrier. The current Files proposal names none either (zero carrier hits in hierarchical-files-and-folders.md; `Locator/1` stays abstract and "Evidence gate — locator policy" is open at :2224-2226), and mvp-and-acceptance.md §Open questions item 2 still asks "Which exact byte carrier and retention receipt can support clean-browser file read-back". A July design does exist and is stranded: Designs/efsv2/large-file-uploads.md (2026-07-07 draft, not listed in the efsv2 README evidence map) specifies tier-0 SSTORE2/CREATE2, tier-2 calldata, `ipfs://`/`ar://`/`https://` mirrors, the `EFSBytes` contract, and an ADOPTED `contractReadable` floor, with the blob tier reserved on an 18-day prune — precisely the "exact index/storage machinery [that] must re-earn inclusion" under the 2026-08-12 reset (owner-rulings.md:178-181), alongside the 2026-07-10 storage direction "on-chain + Arweave now" (:36). Nobody owns re-earning it. The evidence closes the easy substitutes: blob bytes are guaranteed only ~18.2 days (CORRECTIONS.md:16) and ethereum-standards-and-interop.md:445 marks EIP-4844 "Negative evidence for durable storage". (Note for readers: Reviews/2026-07-07-carrier-decision.md decides the *record* carrier, not the byte carrier.) The MVP's central write journey therefore has no current design and no owner.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

The MVP's 'create a file from local bytes' journey has no *selected* carrier, and Slice C cannot ship without one: `product-constitution-and-roadmap.md:277-283` gates it on 'one explicit content carrier', acceptance C requires bytes verified 'from a named carrier' and rejects `BYTES_UNAVAILABLE`, `mvp-and-acceptance.md` Open questions item 2 still asks which carrier can support clean-browser read-back, and no branch names one. Correct the claim that nothing is designed: `hierarchical-files-and-folders.md` §7.1-7.3 specifies the Locator/ChunkTree/acquisition mechanism, and `Designs/efsv2/large-file-uploads.md:28,75` carries a full July carrier design (Tier 0 SSTORE2 default, Tier 2 calldata, `ipfs://`/`ar://` mirrors, blob tier reserved for the 18-day prune) plus an adopted 2026-07-07 `contractReadable` owner ruling — an orphan doc referenced by neither `Designs/README.md` nor `efsv2/README.md` and reset to evidence by the 2026-08-12 mechanism reset. So the repair is not 'design a carrier' but 'rule whether the July tiers re-earn inclusion for the MVP', which is small and has an obvious dev-Realm answer. Slices A and B can start immediately; this blocks only Slice C.

**Evidence:** `Designs/web-client-os/product-constitution-and-roadmap.md:§Slice C` · `Designs/web-client-os/mvp-and-acceptance.md:§C read-back checkbox; §Open questions item 2` · `Designs/efsv2/hierarchical-files-and-folders.md:§Open questions 'Evidence gate - locator policy'` · `Designs/efsv2/owner-rulings.md:§2026-07-10 Storage; §2026-08-12 'supersedes earlier mechanism-level rulings'` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:row 'Blobs expire in 18 days'; Designs/web-client-os/ethereum-standards-and-interop.md:445`

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R8-wco-product-mvp-priva-05

### CORE-09 — The client MVP critical path is gated on frozen-for-experiment Type/Files inputs no efsv2 document owns

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner` · **Severity:** blocking · blocks the MVP

web-client-os/README.md §Current work sequence step 3 defines the MVP critical path as 'freeze only the symbolic inputs in [[type-data-abi-boundary-pressure]], then ... one disposable exact-Type fixture against the current Core/Files candidates'. type-data-abi-boundary-pressure.md §Future disposable experiment gate requires 'a frozen-for-the-experiment B0 control and layered candidate descriptor/body vector closure from the Type lane' plus 'two independently implemented exact codec/validator results'. No efsv2 document names a frozen-for-experiment Type/Files input set as a deliverable -- layered-type-system-and-data-abi.md's T1 produces vectors, not a freeze -- and Open-Decisions.md (2026-08-21) lists V2-E4, V2-E8 and V2-F1 as 'Waiting on evidence' with Stage B unrun. The client therefore cannot start its first fixture and nobody in efsv2 is on the hook to unblock it.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Same finding with two additions. (1) The nearest efsv2 text is not nothing: `hierarchical-files-and-folders.md:2173-2177` step 1 "**Freeze-input preparation:** close the V2-E1 uniform-Principal experiment; pin the generic `ObjectGenesis/1` schema; mint candidate Files Type blobs and Unicode/name tables; repair empty `ChunkTree/1`; add `BindingScope` and `RoutedAdmissionIntent/1` ..." does name Files-side freeze inputs — but it carries no owner, lane or date, it is step 1 of an implementation sequence in a doc `Designs/efsv2/README.md:86-89` calls "a draft experiment target, not a frozen profile or owner decision packet", and it produces neither the B0 control nor the layered candidate vector closure the client's gate names. (2) Currency: on the readiness branch an explicitly frozen disposable input set now exists — `readiness:Designs/efsv2/exp-c0-v0-codec-domain-bounds-vector-contract.md:13-16` "This selects candidate bytes for the **one disposable micro-Realm only**" plus the three sibling `exp-c0-v0-*` profiles and the executed control at `readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/`. It is unmerged, invisible to `Open-Decisions.md`, and is a third arm (EXP-C0), not the B0-control-plus-layered-candidate pair `type-data-abi-boundary-pressure.md:775-776` asks for — so the client's first fixture is still blocked on main, but the fix now has a concrete branch precedent to adopt rather than being unowned everywhere.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Keep blocking, but restate the blocker. On main the claim holds exactly: 'frozen-for-the-experiment' appears in the vault only in Designs/web-client-os/type-data-abi-boundary-pressure.md:775, no efsv2 document owns producing that input set, and the client's own critical path (README.md:466-472) cannot start without it. The correction is that the work largely exists unmerged: readiness:Designs/efsv2/mvp-build-start-packet.md, the four exp-c0-v0-* profiles and readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/ supply vector closure plus independent JavaScript and Solidity implementations. Two residuals survive the branch and should be the finding's actual content: the branch supplies only the EXP-C0 flat-Type arm and defers the bundled/layered trace to a reopen trigger (readiness:core-architecture-candidate.md:564), so the client's required B0-control-plus-layered pair is still not closed; and the branch's first slice is the Data Explorer guest read, explicitly excluding Explorer writes (:206), so the write-capable File Browser is not the lane it serves. Route the finding to owner (V2-C1, ownerDecision = PENDING, recommendedOwnerAnswer = YES) and vault-process (these inputs are invisible to Open-Decisions.md, which reports 'Ask now: 0') as well as efsv2.

**Evidence:** `Designs/web-client-os/README.md:§Current work sequence step 3` · `Designs/web-client-os/type-data-abi-boundary-pressure.md:§Future disposable experiment gate` · `Open-Decisions.md:§Waiting on evidence (V2-E4, V2-E8, V2-F1)` · `Designs/efsv2/layered-type-system-and-data-abi.md:§T1 and §Implementation notes`

**Routing note from verification:** materiality lens: efsv2 + owner (V2-C1 is the live blocker) + vault-process (the inputs exist unmerged and are invisible to Open-Decisions.md)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R10-wco-technology-stand-02

### PRO-04 — 'Ask now: 0' cannot represent an authorization, the one decision that starts the MVP

**Owner:** `owner` · **Neighbours:** `vault-process`, `efsv2`, `web-client-os`, `arcade` · **Severity:** blocking · blocks the MVP

Open-Decisions.md (generated 2026-08-21, regenerated clean 2026-09-02) reports "Ask now: 0", but scripts/open-decisions.sh classify() (lines 59-72) recognises only decide-now / after-evidence / at-launch / settled / delegated / superseded / mirror — there is no bucket for an authorization — and Designs/web-client-os/ has no queue at all (Open-Decisions.md §Queue health, lines 69-78), so the wait is structurally invisible. Every active spine gates on exactly that authorization: Designs/web-client-os/README.md §Current work sequence step 3 ("after explicit experiment authorization") and step 10 ("do not scaffold or begin product implementation without explicit authorization"), plus §Explicit non-authorizations (lines 494-517) forbidding any webclient/os/sdk/core/drive repository; Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md ("No Solidity, TypeScript, or Rust prototype has executed the corpus"; §Next "Run the disposable Stage B program"); and the Kanban Core card "next: execute disposable Stage B … no owner ask" that expired 2026-08-16 (Kanban.md line 43). The PM Stage A directive said "Stop after Stage A for review" and Decisions.md records no Stage A/B release (grep "Stage": no hits), while the efsv2 inbox banner still assumes agents may prototype freely. Five lanes converge on one unblocking packet: authorize disposable Stage B plus the exact-Type File Browser fixture, name the container and the Realm, re-ask the lost Type-axis question (PRO-48), and route the first-user choice (PRO-50) as a second Owner-Inbox FJ item. The readiness-week branch already drafts precisely this as the vault's only Decide-now item, V2-C1 ("authorize replaceable nondeployable candidate engineering", recommendedOwnerAnswer = YES, ownerDecision = PENDING), unmerged and invisible to Open-Decisions.md.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

"Ask now: 0" cannot represent an authorization, the one decision that starts the MVP. Open-Decisions.md (generated 2026-08-21) reports "Ask now: 0" (line 8), but no queue on main carries the pending authorization and there is nowhere for it to live: scripts/open-decisions.sh discovers queues by `find "$DESIGNS" -name 'owner-decision-inbox.md'` (line 82) and `Designs/web-client-os/` has no such file, so the set whose README states the gate is structurally absent from the roll-up (confirmed by §Queue health, lines 69-78, which lists only arcade, clientv2, efsv2, media-library, open-web-app-store and Designs root). The script itself is capable of carrying an authorization — classify() maps any heading containing "decide now" to ASK (line 63), which is exactly the heading the readiness branch uses — so the invisibility is a routing gap, not a script defect. Every active spine gates on that authorization: Designs/web-client-os/README.md §Current work sequence step 3 (line 467, "then—after explicit experiment authorization") and step 10 (line 491, "do not scaffold or begin product implementation without explicit authorization"), plus §Explicit non-authorizations (494-517) forbidding any webclient/os/sdk/core/drive repository; Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:50 ("No Solidity, TypeScript, or Rust prototype has executed the corpus") and :84-89 §Next ("Run the disposable Stage B program"); and the Kanban Core card "next: execute disposable Stage B … no owner ask" that expired 2026-08-16 (Kanban.md:43). The PM Stage A directive ends "Stop after Stage A for review" and Decisions.md records no Stage A/B release (its only "Stage" hit, line 91, is an unrelated 2026-05-28 design-process entry), while the efsv2 inbox banner (lines 12-13) still says "The current work is to prototype and pressure-test the candidate." Five lanes converge on one unblocking packet: authorize disposable Stage B plus the exact-Type File Browser fixture, name the container and the Realm, re-ask the lost Type-axis question (PRO-48), and route the first-user choice (PRO-50) as a second Owner-Inbox FJ item. The readiness-week branch already drafts precisely this as the vault's only Decide-now item, V2-C1 ("Authorize replaceable nondeployable candidate engineering", recommendedOwnerAnswer = YES, ownerDecision = PENDING), unmerged and invisible to Open-Decisions.md.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Reword the mechanism: not 'there is no bucket for an authorization', but 'the authorization has never been filed as an owner item on main, and the one lane that owns the MVP (Designs/web-client-os/) has no owner-decision-inbox.md at all, so the script — which discovers queues by find — cannot surface anything from it. scripts/open-decisions.sh:63 already routes any "## Decide now" section to ASK; readiness:Designs/efsv2/owner-decision-inbox.md §V2-C1 sits under exactly that heading and would appear as Ask now: 1 on merge.' Add the internal contradiction: web-client-os/README.md gates work sequence steps 3 and 10 on explicit experiment authorization while §Open questions states 'No item currently needs an owner ruling'.

**Evidence:** `Open-Decisions.md:8 ('Ask now: 0'), 24-26, 43-56, 69-78` · `scripts/open-decisions.sh:classify() lines 59-72` · `Designs/web-client-os/README.md:§Current work sequence steps 3 and 10 (459-472); §Explicit non-authorizations 494-517` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:13-16, 50-55, 84-89; §What remains deliberately unclaimed` · `Reviews/2026-08-13-efs2-stage-a-corpus/pm-stage-a-directive.md:final line ('Stop after Stage A for review')` · `Kanban.md:37, 40, 42-43 ('expires 2026-08-16 … no owner ask')` · `Decisions.md:grep 'Stage' (no hits)` · `Designs/efsv2/owner-decision-inbox.md:opening blockquote ('The current work is to prototype')` · `branch readiness/: Designs/efsv2/owner-decision-inbox.md §V2-C1`

**Routing note from verification:** materiality lens: owner (missing-queue half: vault-process)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R19-process-rulings-ledg-06, J1-mvp-first-01, J2-cypherpunk-risk-first-12, J3-adoption-first-10, S13-never-decided-01

### PRD-10 — The Arcade recut the README demands never happened and has no owner, expiry or falsifiable question

**Owner:** `arcade` · **Neighbours:** `vault-process`, `owner` · **Severity:** important · MVP-relevant

Designs/arcade/README.md:44-46 names the highest-leverage next action as 'The owning Arcade thread should recut the one-game hypothesis against the recovered differentiation, Andromeda, and browser evidence before implementation or outreach.' Three weeks after the evidence landed no recut exists: the only commit touching Designs/arcade is c48f252 (2026-08-13), the card 'Reconcile and build the one-game EFS Arcade vertical slice' sits in Backlog (Kanban.md:20) with no '- @agent, claimed, expires' trailer unlike the Core-hardening and Git cards (Kanban.md:43, 45), and Open-Decisions.md:20 holds D1-D7 pending that recut. No agent is named, no expiry exists, and the recut has no falsifiable question, while product-and-communities.md:73 lists a STOP condition ('the differentiator demo cannot be made user-visible') that pass 2 §Recommendations item 3 argues is near for four of five beats. Underneath, ten of twelve docs still narrate the 2026-09-11 v1 plan and september-plan.md:76-82 gates G0 (Aug 14), G1 (Aug 29), G2 (Sep 5) have passed with none of the listed evidence; no /arcade route exists in any repository. The current direction has no design under it and the design has no direction over it.

**Evidence:** `Designs/arcade/README.md:44-46` · `Kanban.md:20 vs :43, :45 (claim trailers)` · `Open-Decisions.md:20` · `Designs/arcade/product-and-communities.md:73; september-plan.md:76-82` · `Reviews/.../arcade-falsification-pass-2.md §Recommendations item 3 (line 130)` · `git log -- Designs/arcade (single commit c48f252, 2026-08-13)`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R14-arcade-01, R18-evidence-round-06

### CORE-01 — Complete directory enumeration (BindingScope) is required, assumed by four sets, and owned by nobody

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `open-web-app-store`, `vault-process` · **Severity:** important · MVP-relevant

The constitution requires hard-bounded COMPLETE enumeration (system-constitution.md:207-209, 316) and owner ruling 2026-07-22 makes 'exact child and point-property enumeration' a data-model gate (owner-rulings.md:111), but core-architecture-candidate.md:272 offers only point Binding reads and :323-325 says 'Wide directory enumeration ... remain OS/client work'. hierarchical-files-and-folders.md §5.1 (660-667) states the gap -- 'Current B0 can read a Binding head and history only after the caller knows the BindingKey ... cannot prove the complete set of name positions under one directory' -- and §5.2 (671-701) proposes KIND_BINDING_SCOPE = 0x0a with 'BindingScope must exist at Realm genesis. An upgrade that begins indexing only future mutations cannot claim complete old directories'. B0 closes IndexKind/1 at 0x01..0x09 (b0-indexes.md:407-421), yet the primitive appears in no Stage A gap (STATUS.md:57-70 lists only G-2..G-5), no traceability row (C-FS-1/AT-14/OR-M 'DEFERRED(mount lane)'), no proposed spine edit (0 grep hits) and no efsv2 inbox item (LP-2 says only that wide sorted enumeration 'must earn separate mechanism and budget'); README.md:86-88 concedes 'neither is current B0'. Four consumers assume it anyway: the MVP makes read-after-create the write test and marks complete listing a 'Proposed dependency' (mvp-and-acceptance.md:827), the App Store routes finite catalog reconstruction to the same 'unproven BindingScope experiment' (architecture.md:847-852), and web-client-os/README.md:524-526 still asks whether BindingScope 'exactly or a smaller generic declared-index contract' is needed. Because adding an index kind after genesis is the PARTIAL-backfill-reads-as-absence hazard, the choice -- mint the scope index at genesis, or ship the labelled-PARTIAL listing mvp-and-acceptance.md:409-413 permits and write the waiver -- must precede initialize(); a hosted index would be the first hidden authority in the system.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Complete directory enumeration (BindingScope) is required by an owner ruling, assumed by four sets, and owned only by a proposal-stage evidence gate. The constitution requires every enumeration to be hard-bounded and honestly labelled `COMPLETE/PARTIAL/UNSUPPORTED/UNKNOWN` with "`UNKNOWN` is never absence" (system-constitution.md:207-209); the requirement that a directory listing actually be exact comes from the three-host-mount trace (:316) and owner ruling 2026-07-22, which makes "exact child and point-property enumeration" a data-model gate (owner-rulings.md:111). core-architecture-candidate.md:272 offers only point Binding reads and :324-325 says "Wide directory enumeration... remain OS/client work". hierarchical-files-and-folders.md §5.1 (660-667) states the gap and §5.2 (671-701) proposes `KIND_BINDING_SCOPE = 0x0a` with "`BindingScope` must exist at Realm genesis"; B0 closes IndexKind/1 at 0x01..0x09 (b0-indexes.md:407-421). The primitive appears in no Stage A gap (STATUS.md:57-70 lists only G-2..G-5), no traceability row (C-FS-1/AT-14/OR-M all "DEFERRED(mount lane)"), no proposed spine edit (0 grep hits) and no efsv2 inbox item (LP-2 says only that wide sorted enumeration "must earn separate mechanism and budget"); README.md:86-88 concedes "neither is current B0". Its single recorded disposition is the Files doc's own "Evidence gate — BindingScope" (hierarchical-files-and-folders.md:2203-2206), which orders the Codex delta "at genesis" and names an authenticated live-map fallback if it fails — an experiment arm inside a `#status/review` proposal, tracked by no queue, program or owner item. Four consumers assume it anyway: mvp-and-acceptance.md:161-166 defines `COMPLETE` as scope-index-from-genesis plus terminal pages, :827 marks complete listing a "Proposed dependency", open-web-app-store/architecture.md:847-852 routes finite catalog reconstruction to the same "unproven `BindingScope` experiment", and web-client-os/README.md:524-526 still asks whether BindingScope "exactly or a smaller generic declared-index contract" is needed. Because adding an index kind after genesis is the PARTIAL-backfill-reads-as-absence hazard, the choice — mint the scope index at genesis, or ship the labelled-PARTIAL listing mvp-and-acceptance.md:409-413 already permits and write the waiver — must precede `initialize()`; a hosted index would be the first hidden authority in the system. On the unmerged readiness branch this is materially advanced (`readiness:Designs/efsv2/v2-contract-readiness-program.md` G2 and Lane 5; `readiness:Designs/efsv2/exp-c0-v0-hello-files-trace.md` scope-key structure and falsifier) but still owed at scale.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Complete directory enumeration (BindingScope) is a real cross-set dependency that no main-branch queue item, Stage A gap, traceability row or proposed spine edit owns: `b0-indexes.md:407-421` closes IndexKind at 0x01..0x09, `hierarchical-files-and-folders.md:671-701` proposes KIND_BINDING_SCOPE = 0x0a and requires it 'at Realm genesis', and `efsv2/README.md:86-88` concedes 'neither is current B0'. It is not, however, MVP-blocking: `mvp-and-acceptance.md:409-413` and Slice A both accept a visibly qualified PARTIAL listing beside a proven point result, the 2026-07-22 enumeration gate is scoped to the three-host mount claim, and a Sepolia dev Realm is explicitly allowed to be an upgradeable disposable prototype, so the genesis-timing constraint is only irreversible at the later production genesis (V2-F1/F2). The actionable item for the PM is to give the primitive an owner and a decision date before any Realm anyone will link to is minted — and to note it is already carried, unowned by main, in `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md` Task 6 and in readiness:`Designs/efsv2/exp-c0-v0-data-structure-profile.md` collection 15.

**Evidence:** `Designs/efsv2/hierarchical-files-and-folders.md:§5.1 lines 660-667; §5.2 lines 671-701; §13.6 lines 2181-2183` · `Designs/efsv2/system-constitution.md:207-209, 316; Designs/efsv2/owner-rulings.md:2026-07-22 line 111` · `Designs/efsv2/core-architecture-candidate.md:272, 323-325; Designs/efsv2/README.md:86-88` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:149-152, 407-421; chapters/b0-binding.md:§6.1 855-858, §7 929-936` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:57-70; chapters/traceability.md:212, 242, 310` · `Designs/web-client-os/mvp-and-acceptance.md:161-166, 409-413, 827; README.md:524-526; Designs/open-web-app-store/architecture.md:847-852`

**Re-classified in verification:** severity blocking → important (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R7b-stageA-b0-indexes-le-01, R1-efsv2-spine-03, R3-efsv2-files-02, S7-efsv2-object-model-co-03, J1-mvp-first-02, J2-cypherpunk-risk-first-06, S13-never-decided-10, R12-open-web-app-store-06

### CORE-04 — The Principal the client was directed to use is not the Principal Core offers; V2-E1 blocks every signing surface

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `sdk`, `owner` · **Severity:** important · MVP-relevant

Owner direction 7 gives one Principal ('JamesCarnley.eth') three controller keys with a preferred routing account and direction 8 says 'Multiple controller keys do not consume multiple Lens positions; key authorization belongs inside Principal verification' (web-client-os/README.md:61-71). Core offers only AccountPrincipal/1 = {authorityKind, originIfRequired, accountOrKey} with managed Principals deferred (candidate:234-262), b0-principal-authority.md:129-132 says 'policy-bearing keys are exactly what the managed-Principal graduation adds later', and in B0 a Lens plan entry is a single bytes32 PrincipalId from one account/key descriptor (b0-lens.md §3.2 142-156; SR-14 397-404) -- so James's three keys are three PrincipalIds consuming three of the 64 entries, and FX-LENS's 64 plan principals are all single-key (harness:968-970). The 15-55 design centre b0-lens §3.4 borrows from lens-spec.md §9:97 explicitly assumes 'KEL collapses keys', so V2-E2 never measures the direction-8 model. Whether the official write-capable File Browser ships account-Principal-only or needs a Principal registry/graduation contract sets MVP contract scope and has no owner: mvp-and-acceptance.md:824 calls the 'exact Core mechanism and default-account storage' open and :182-185 hedges both ways, hierarchical-files-and-folders.md:121-124 calls the uniform PrincipalId surface the V2-E1 experiment arm, 'not owner law', with 'No permanent Files Type bytes may be minted until V2-E1 closes', traceability OR-2 is DEFERRED and G-2 a GAP, and Open-Decisions.md lists V2-E1 as waiting on evidence nobody is producing. The only signing designs on main (sdk-wallet-architecture.md attester invariant; efs-account-system.md 'user = ONE smart-account address') contradict directions 7/8, so no SDK signing or receipt contract can be specified.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

The Principal the client was directed to use is not the Principal Core offers; V2-E1 gates the Files Type bytes and the MVP's contract scope. Owner direction 7 gives one Principal ("JamesCarnley.eth") three controller keys with a preferred routing account, and direction 8 says "Multiple controller keys do not consume multiple Lens positions; key authorization belongs inside Principal verification" (web-client-os/README.md:61-71) — a rule the client set has already absorbed (mvp-and-acceptance.md:159-160 "key authorization is verified within each Principal"). Core offers only `AccountPrincipal/1 = {authorityKind, originIfRequired, accountOrKey}` with managed Principals deferred (candidate:234-262); b0-principal-authority.md:130-132 says "policy-bearing keys are exactly what the managed-Principal graduation adds later"; and in B0 a Lens plan entry is one full-width bytes32 PrincipalId derived from a single account/key descriptor, appearing at most once per plan (b0-lens.md §3.2 142-156; PrincipalId formula SR-14 at b0-overview.md:397-404) — so James's three keys are three PrincipalIds consuming three of the 64 entries, and FX-LENS's 64 plan principals are all single-key (harness-and-fixtures.md:968-970). The 15-55 design centre b0-lens §3.4 borrows from lens-spec.md §9:97 explicitly assumes "KEL collapses keys", so V2-E2 never measures the direction-8 model. Whether the official write-capable File Browser ships account-Principal-only or needs a Principal registry/graduation contract sets MVP contract scope and has no owner: mvp-and-acceptance.md:824 calls the "exact Core mechanism and default-account storage" open and :182-185 hedges both ways, hierarchical-files-and-folders.md:121-124 calls the uniform PrincipalId surface the V2-E1 experiment arm, "not owner law", with "No permanent Files Type bytes may be minted until V2-E1 closes", traceability OR-2 is DEFERRED and G-2 a GAP, and Open-Decisions.md lists V2-E1 as waiting on evidence nobody is producing. Main carries no current v2 SDK signing or receipt design at all: the only signing documents (sdk-wallet-architecture.md, efs-account-system.md) are already labelled "Historical" by Designs/README.md:82,86 and parked under "Dormant or historical — not live queues" with the Principal question explicitly reopened and routed to V2-E1/V2-E5 (Designs/owner-decision-inbox.md:67-70, 98-100) — so this is a MISSING v2 SDK signing design in the `sdk` set, not a live contradiction. The unmerged sdkv2 branch restates the direction (`sdkv2:Designs/sdkv2/README.md:143`) but adds "This does not freeze the Core authority mechanism", so the mismatch is unresolved there too.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Reduce this to the coherence gap that is actually open: owner direction 8 (multiple controller keys must not consume multiple Lens positions) is unsatisfiable under the account-Principal surface the Core candidate offers, because a `PrincipalId` is derived from one account/key descriptor (`core-architecture-candidate.md:234-262`; `b0-lens.md` §3.2) and managed Principals are deferred — and no document records whether direction 8 binds the MVP or is a post-MVP managed-Principal promise. It is not blocking: `mvp-and-acceptance.md:86-92` already defers multi-Principal write policy and ERC-1271 for this MVP, so an EOA account Principal writes the first file, and readiness:`owner-decision-inbox.md` gives V2-E1 a delegated build default ('Use one uniform full-width `PrincipalId` … including zero-setup account Principals'). Delete the claim that no SDK signing or receipt contract can be specified — the two contradicting docs are labelled historical in `Designs/README.md:82,86`, and sdkv2:`architecture-candidate.md:81-82` specifies signature-verification and account-authorization receipts without V2-E1 closing.

**Evidence:** `Designs/web-client-os/README.md:directions 7-8 lines 61-71` · `Designs/efsv2/core-architecture-candidate.md:§Principal L234-262` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:§2.2 L129-132; §6 L1195-1275; lines 1462-1465` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md:§3.2 142-156, §3.4 191-205, §6.5 548-568; chapters/harness-and-fixtures.md:968-970; Designs/efsv2/lens-spec.md:§9 95-97` · `Designs/efsv2/hierarchical-files-and-folders.md:121-124; Designs/web-client-os/mvp-and-acceptance.md:88-89, 182-185, 824` · `Designs/efsv2/owner-decision-inbox.md:§V2-E1 17-24, §P-8 133-136; Designs/sdk-wallet-architecture.md:§Principles item 7; Designs/efs-account-system.md:§Decision`

**Re-classified in verification:** severity blocking → important (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R1-efsv2-spine-11, R4-efsv2-identity-lens-p-03, J1-mvp-first-05, R7b-stageA-b0-indexes-le-03, R17-sdk-and-mounts-13

### CORE-07 — Files and the MVP need a B0-successor Codex nobody has cut; the frozen-corpus rule invalidates every cell measured first

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `vault-process` · **Severity:** important · MVP-relevant

hierarchical-files-and-folders.md:2173-2177 lists five freeze-input deltas against B0: (a) BindingScope at Realm genesis (:671, 699); (b) ChunkTree/1 empty form chunkCount=0, totalSize=0, merkleRoot=keccak256(0x02) (:1045-1053) versus B0's '1 <= chunkCount ... and totalSize >= 1' (b0-content-locators.md:352) -- and ChunkTree is named nowhere in the spine's content list (candidate:330-342, 0 hits) although the MVP's create-file/publish-revision units require it (mvp:233-245); (c) 'candidate pin is Unicode 17.0.0, replacing rather than coexisting with B0's proposed 16.0 pin' (:128-140 vs b0-encoding-and-ids.md:408); (d) RoutedAdmissionIntent/1 plus publish(..., uint8 consentKind, ...) (:1169-1225); (e) a pinned ObjectGenesis/1 schema (:369). Delta (d) exists because B0's AdmissionIntent/1 'is bearer authorization to Core. It does not name an executor ... a coordinator or mempool observer can submit one otherwise valid Envelope directly to Core, bypassing Router preconditions ... No /1 operation may be reported as FILES_PRECONDITION_CERTIFIED' (:1160-1167), and B0's only composition is a non-Core router whose every element needs explicit author intent (b0-authorship-envelope.md §5.4 1221-1229) -- so the write-capable File Browser ships either uncertified NOREPLACE/overwrite semantics or a Core consent change B0 does not contain. bakeoff-spec.md §6.2 is categorical: 'Any corpus change invalidates every previously measured cell ... Re-running is the only cure' (:762-782). Nobody owns re-cutting B0 before the corpus mints: STATUS.md names no successor, README.md:86-88 says 'neither is current B0', and the only place the successor is treated as buildable is docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md:24, outside Designs/. Running the nine cells first guarantees a full re-run.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Same finding with three fixes. (1) `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md:24` is a blank line; the "Governing draft: `Designs/efsv2/hierarchical-files-and-folders.md`" line is :25 and the buildable framing is the Architecture block at :11-18. (2) "STATUS.md names no successor" is too strong — `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:59` does say "The 20 DEFERRED rows have named successor homes"; the accurate claim is that STATUS names no owner, lane or date for re-cutting the B0 Codex itself before the corpus mints. (3) Currency: on the readiness branch the sequencing objection is materially answered — `readiness:Designs/efsv2/core-architecture-candidate.md:545-555` supersedes "the 2026-08-23 semantic seal's original blanket scheduling of all four losing-arm comparators", makes `EXP-C0` the implementation default with comparators as reopen triggers, and `readiness:Designs/efsv2/mvp-build-start-packet.md` + `v2-contract-readiness-program.md` (:152, :349, :798 on `BindingScope`) treat a candidate successor Core as buildable inside `Designs/efsv2/`, with an executed JS/Solidity control at `readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/src{,-sol}/`. So "the only place the successor is treated as buildable is outside Designs/" is true of main only.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

The B0-successor Codex the MVP's Files units need is specified but unscheduled, not undesigned. hierarchical-files-and-folders.md §14 step 1 already names the exact cut (pin ObjectGenesis/1, mint Files Type blobs and Unicode tables, repair empty ChunkTree/1, add BindingScope and RoutedAdmissionIntent/1), and README.md:86-88 flags 'neither is current B0' — what is absent is an owner, a date and a live queue card for that step; the Core-hardening Kanban card expired 2026-08-16. Keep two concrete sub-defects: ChunkTree/1 appears zero times in core-architecture-candidate.md although hierarchical-files-and-folders.md:338-345 lists it among the generic kernel Types the Files Types reuse (crosswalk gap — the spine's nearest name is ArtifactClosure/1, :330-342); and the empty-form ChunkTree the MVP needs contradicts b0-content-locators.md:350-352's '1 ≤ chunkCount' and 'totalSize ≥ 1'. Downgrade from blocking: the MVP is not stalled by the consent hole, because mvp-and-acceptance.md:246-261 already defines the labelled EXPERIMENTAL_DIRECT_CORE / filesPreconditionCertified=false path. The frozen-corpus 'nine cells then a full re-run' argument should be softened — readiness:core-architecture-candidate.md:544-555 retires the blanket losing-arm scheduling that argument assumes.

**Evidence:** `Designs/efsv2/hierarchical-files-and-folders.md:128-140, 369, 671, 699, 1045-1060, 1154-1200, 1169-1225, 2173-2177` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/bakeoff-spec.md:§6.2 lines 762-782 ('Any corpus change invalidates every previously measured cell')` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:340-352; chapters/b0-encoding-and-ids.md:396, 408, 414-416` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-authorship-envelope.md:§5.4 lines 1221-1229; chapters/b0-realm-admission.md:§5.4 lines 986-996` · `Designs/efsv2/core-architecture-candidate.md:330-342 (ChunkTree 0 hits); Designs/efsv2/README.md:82-89` · `Designs/web-client-os/mvp-and-acceptance.md:233-245, 254-261; docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md:24`

**Re-classified in verification:** severity blocking → important (materiality lens)

**Routing note from verification:** materiality lens: efsv2 + vault-process (the work item exists but is unscheduled; its Kanban card expired 2026-08-16)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R6-stageA-overview-05, S7-efsv2-object-model-co-05, R7a-stageA-b0-ids-envelo-15

### CORE-14 — Every Files write is a two-signature ceremony that no chapter, spine doc or product doc accepts, states or costs

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `sdk`, `owner` · **Severity:** important · MVP-relevant

Stage A SR-12 (b0-overview.md:336-347) makes implicit-sender intent 'legal only when the selected set contains none of the three kernel-effect Types. BindingSet and BindingTombstone require explicit intent plus expectedRevisions', repeated at b0-authorship-envelope.md §5.4 (:1206-1218), and every Files operation selects BindingSet leaves (hierarchical-files-and-folders.md:1138-1147). Each file or folder create therefore costs one chain-free 'EFS2-Envelope' eth_signTypedData_v4 signature plus one Realm-bound 'EFS2-AdmissionIntent' signature even when the author's own EOA sends the transaction (three prompts if byte publication needs its own, mvp:216, 970); mvp-and-acceptance.md:74-79, 247-261 states it downstream ('an implicit same-sender B0 admission path is insufficient') while no Stage A chapter, no efsv2 spine doc and no client README states it as a product cost. It runs against direction 1 ('Loading speed is a core product requirement'), direction 2's 'deliberately basic' MVP, and the vault's own v1 bar (sdk-minimal-clicks.md:16 'a single logical EFS write ... should cost the end user one wallet click ... not ~8'; file-browser-requirements.md A1). No open question in mvp-and-acceptance.md or product-constitution-and-roadmap.md names prompt count as a pressure, and nothing says what the wallet displays for each signature, in what order, or what happens when the first succeeds and the second is cancelled (fixture C names only 'user cancellation'). The cost cannot be wished away -- the Realm-bound intent with expectedRevisions is the only thing making a write CAS-safe -- so it must be accepted on the record or filed as a Core pressure packet on SR-12; Stage A already holds arm F3, which 'removes AdmissionIntent and signs this exact Realm-bound carrier' (b0-authorship-envelope.md:369-403; :320 'One signature, every Realm').

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md:SR-12 lines 336-350` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-authorship-envelope.md:§5.4 lines 1206-1219; lines 320, 369-403 (arm F3)` · `Designs/web-client-os/mvp-and-acceptance.md:74-79, 216, 247-261, 386-400, 893-915` · `Designs/efsv2/hierarchical-files-and-folders.md:1138-1147; §8.2 lines 1154-1180` · `Designs/web-client-os/README.md:directions 1-2 lines 41-47; Designs/sdk-minimal-clicks.md:16; Designs/clientv2/file-browser-requirements.md:A1 line 38` · `Designs/web-client-os/architecture-and-modules.md:969-970; Designs/efsv2/core-architecture-candidate.md:416`

**Verified:** not separately verified; clustered from 6 independent lane findings · **Source lanes:** R7a-stageA-b0-ids-envelo-16, R11b-clientv2-packages-w-04, R4-efsv2-identity-lens-p-08, J1-mvp-first-03, J2-cypherpunk-risk-first-07, S13-never-decided-07

### CORE-18 — Placeholder constants and an ungrammared policy hook make every RealmId uncomputable and the Authority Codex unmintable

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner` · **Severity:** important · MVP-relevant

b0-principal-authority.md §3.8 row 16 (:879) marks ERC1271_VERIFY_GAS as MEASUREMENT_PENDING and :896-902 say 'any module containing it is unmintable'; because codexConstantsBytes embeds authorityCodexBytes (b0-encoding-and-ids.md §1.6 214-218) and profileId/genesisCommitment commit codexConstantsHash (b0-realm-admission.md §2.3-2.4), which RealmId commits, even an EOA-only debug Realm has no conformant identity until a number is chosen. The Realm policy hook is worse than pending -- it is ungrammared: §2.4 line 207 requires initialPolicyCommitment 'MUST be nonzero'; §2.5 line 253 defines policyCommitment as 'hash of the active admission policy parameter set (§7.2)' but §7.2 (:1380-1443) defines no parameter set; §5.5 line 1184 gives POLICY_GAS_MAX = 200,000 '[PROPOSAL - value TBD-final by the V2-E4 costing]'; E_POLICY(uint16 code) has no code table; U-6 (:1442) says a sunset 'policyCommitment encodes FROZEN' with no encoding, and there is no spelling for 'no policy'. A Sepolia MVP cannot call initialize() without inventing an encoding, while the constitution's acceptance trace 'Type and admission validation' (:305-306) requires a bounded version-identified Realm validator whose basis the receipt exposes and the official MVP requires the guest route to parse 'Realm descriptor and revision/code/admission basis'. Each choice is a one-line engineering decision assigned to a lane that has not started ('the V2-E1 measurement pass' -- Open-Decisions.md:47 waiting on evidence; 'the V2-E4 costing'; 'the freeze ceremony'), and V2-E5 owns the descriptor but not this residue: a disposable Realm needs numbers, not gates.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:§3.8 line 879; lines 896-902; lines 1517-1522` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:§2.4 line 207; §2.5 line 253; §5.5 lines 1183-1190; §7.2 lines 1380-1443` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md:§1.6 lines 214-218` · `Designs/efsv2/system-constitution.md:305-306; §Open questions bullet 7` · `Designs/efsv2/owner-decision-inbox.md:§V2-E5; Open-Decisions.md:47` · `Designs/web-client-os/mvp-and-acceptance.md:§Required guest behavior bullet 2`

**Verified:** not separately verified; clustered from 4 independent lane findings · **Source lanes:** R7a-stageA-b0-ids-envelo-04, R7a-stageA-b0-ids-envelo-05, S13-never-decided-16, J1-mvp-first-07

### CORE-23 — The Binding withdrawal / no-resurrection / CAS state machine is a constitution requirement still sitting as an unticked checkbox

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `efs15` · **Severity:** important · MVP-relevant

system-constitution.md §One transaction and honest mutation requires 'Mutable state uses explicit predecessor/CAS rules where races matter' and that replacement must not 'unexpectedly resurrect an older value'. core-architecture-candidate.md names 'generic CAS current slots, withdrawal/lifecycle overlays' (module 5, :354) and 'no-resurrection rules' (:226) but its own checklist line 449 still reads '[ ] Define Binding/Withdrawal authority and no-resurrection state machine', routed to V2-E2. The vault already contains the only concrete state machine for this and nothing in the spine adopts or refutes it: efs15/efs-id-1-candidate.md §Receipt aggregation and slot resolution defines SlotState {slotRevision, headSemanticEdgeId, activationOrdinal, canonicalReceiptRef, createdFromSlotRevision}, a three-branch expectedSlotRevision fold, canonical-versus-inert receipts, and 'at most one state-changing activation per SlotId' per plan. The write-capable File Browser MVP depends on exactly this semantics (web-client-os/README.md:318), so an unticked checkbox is load-bearing.

**Evidence:** `Designs/efsv2/system-constitution.md:§One transaction and honest mutation bullets 2-3` · `Designs/efsv2/core-architecture-candidate.md:226, 354, 449 ('[ ] Define Binding/Withdrawal authority and no-resurrection state machine')` · `Designs/efs15/efs-id-1-candidate.md:§Receipt aggregation and slot resolution` · `Designs/web-client-os/README.md:318`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R15-efs15-evidence-03

### CORE-24 — Resolution Plan semantics are underspecified: revocation fallthrough, the 'conflict' outcome and boundedPointCombiner

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `open-web-app-store` · **Severity:** important · MVP-relevant

The 2026-07-11 lens review's decision packet item 7 asks James to 'confirm security/package/gate scopes do not automatically fall through on authority revocation/removal', and its coherence ledger row 'read-lens revocation fallback' calls fallthrough 'unsafe for security/package/config names'. core-architecture-candidate.md gives Binding a 'targetRef | tombstone' with 'no-resurrection rules' and its §'Worked example: smart-contract configuration through a Lens' says 'If the complete local map proves the Council binding absent, the Plan may use Alice's fallback' -- whether a tombstoned higher-tier head counts as 'absent' (letting a lower-tier Principal's feeBps win after the Council withdraws) is nowhere defined, and the inbox does not list the question as answered, superseded or held. The same section leaves 'conflict' hollow: the constitution promises an explicit 'conflict' outcome and the candidate gives the Plan 'orderedOrTieredPrincipalIds' and a 'boundedPointCombiner', but with one CAS head per Principal per position conflict can only arise between equal-tier Principals whose heads differ, and no doc says whether that yields conflict, first-listed-wins, or UNKNOWN. The lens review had defined exactly these typed combiners (EXACT, PRIORITY_FIRST_PRESENT, UNION_SET, ONLY_ONE, THRESHOLD) and §2.5 'Equal-rank groups'; the inbox's LP-1 disposition keeps only the requirement of an 'explicit purpose-scoped reader policy', and V2-E2 measures 'first/last/absent/conflict/unknown' without defining conflict.

**Evidence:** `Reviews/2026-07-11-efsv2-lens-architecture-and-scale-review.md:§21 Decision packet item 7; §16 coherence ledger (revocation fallback row); §Bottom-line rulings items 2-3; §2.5 Equal-rank groups` · `Designs/efsv2/core-architecture-candidate.md:§Binding and withdrawal; §Contract Resolution Plan (Lens); §Worked example: smart-contract configuration through a Lens` · `Designs/efsv2/system-constitution.md:§Lenses for contracts and people` · `Designs/efsv2/owner-decision-inbox.md:LP-1, V2-E2`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R20-older-reviews-04, R20-older-reviews-14

### CORE-25 — Rich Unicode names are owner-directed but only the ASCII Router arm is contract-checkable, and no doc reconciles the two

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner`, `efs15` · **Severity:** important · MVP-relevant

Owner direction 9 and WCOS-R12 make rich Unicode/NFC names 'permanent identity'; Slice C says 'accept canonical rich Unicode/NFC names' and mvp-and-acceptance.md §D box 1 (:428-430) requires emoji, RTL, CJK and native-IME name fixtures. hierarchical-files-and-folders.md §2.1 (:154-190) calls the rich name 'the primary experiment arm' but makes the first contract-checkable Router arm FILES_ROUTER_ASCII_NAME_V1 (1..255 bytes, every byte in [a-z0-9._-]) returning UNSUPPORTED(PROFILE_VALIDATION) for any rich name 'until a later immutable, codehash-pinned Router can prove the archived Unicode profile', keeps 'ASCII slug plus a separate Unicode display label' as a fallback arm, and leaves 'Evidence gate - Unicode: archive/hash the candidate Unicode 17 tables' open. Because the MVP write path is EXPERIMENTAL_DIRECT_CORE (mvp:254-256) this is not a contradiction, but MVP writes of rich names carry only EXACT_BYTES_ONLY and the acceptance text does not say so; no doc says how the File Browser labels a Unicode-named entry that can never be certified under the first Router, or how long the ASCII arm stands. The direction also reverses standing efs15 evidence, which concluded canonical names must be a contract-verifiable restricted-ASCII grammar with Unicode kept as display metadata and that 'an unverified client-side Unicode normalization boundary is not an acceptable fallback' -- the reversal adds a Unicode-proving Router as a hard dependency for certified rich-name writes and is recorded as a scope choice nowhere.

**Evidence:** `Designs/web-client-os/README.md:direction 9 lines 72-74; line 322` · `Designs/web-client-os/product-constitution-and-roadmap.md:WCOS-R12 and §Slice C; mvp-and-acceptance.md:§D lines 428-430; lines 254-256` · `Designs/efsv2/hierarchical-files-and-folders.md:§2.1 lines 154-190; §Open questions 'Evidence gate - Unicode'` · `Designs/efs15/requirements-and-boundaries.md:§R1 bullet 3; Designs/efs15/efs-id-1-candidate.md:§Canonical shared-name/path candidate final paragraph`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R8-wco-product-mvp-priva-08, R3-efsv2-files-05, R15-efs15-evidence-11

### CORE-26 — 'Qualifying EVM Realm' is used four times in the constitution and defined nowhere

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner` · **Severity:** important · MVP-relevant

system-constitution.md uses 'qualifying EVM Realm' / 'fresh qualifying L3' in the one-sentence model (:38), §EFS Core (:60), the 'Fresh qualifying L3' acceptance trace (:303) and an open question (:353) without ever stating what qualifies a chain; only Commons receives explicit CROPS criteria. core-architecture-candidate.md §Realm defines RealmId/RealmRevision and calls the descriptor 'a bakeoff target' but gives no qualification criteria. This is load-bearing for the MVP: the 2026-08-12 ruling requires a self-hostable Web Client to 'open an explicit Realm/L3', and mvp-and-acceptance.md's dependency row 'Explicit Realm and pinned read basis' is 'Candidate; exact bootstrap/finality bytes open'. The only proposal anywhere is b0-realm-admission.md §4.1 'The assumption set QR-1..QR-8', unadopted, and V2-E5 owns the descriptor without naming the qualification criteria as a deliverable.

**Evidence:** `Designs/efsv2/system-constitution.md:38, 60, 303, 353` · `Designs/efsv2/core-architecture-candidate.md:§Realm` · `Designs/efsv2/owner-rulings.md:2026-08-12 ('A direct guest File Browser path is required'); Designs/efsv2/owner-decision-inbox.md:§V2-E5` · `Designs/web-client-os/mvp-and-acceptance.md:dependency row 'Explicit Realm and pinned read basis'` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:§4.1 QR-1..QR-8`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R1-efsv2-spine-08

### CORE-36 — originRef bytes and the selfChainRefHash preimage are not pinned between the principal and realm chapters

**Owner:** `efsv2` · **Neighbours:** `sdk`, `web-client-os` · **Severity:** important · MVP-relevant

b0-realm-admission.md §1.2 (:65-77) pins ChainRef/1 = (bytes8 chainNamespace, bytes32 chainReference) and calls abi.encode(chainNamespace, chainReference) // 64 bytes the 'Preimage form', but never states that AccountPrincipal.originRef carries those 64 bytes rather than the 40-byte packed pair. b0-principal-authority.md §2.3 (:159-166) still reads 'dependsOn Lane 4: exact chainRef byte layout (ERC-7930 binary is the audit lane's candidate...)' and its open item 3 (:1525) remains open, while b0-encoding-and-ids.md open item 5 (:1493-1498) declares the same seam CLOSED. SELF_CHAIN_REF_HASH is consumed at realm:782 with no stated preimage and GenesisFactsView (:1643-1668) does not expose it. Every CONTRACT_ERC1271 PrincipalId depends on this byte string, so no ERC-1271 author can be given a conformant id today.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:§1.2 lines 65-77; line 782; lines 1643-1668` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:§2.3 lines 159-166; line 1525` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md:open item 5 lines 1493-1498`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R7a-stageA-b0-ids-envelo-03

### CORE-38 — Three Project/Release/Artifact vocabularies with three identity rules and two catalog shapes; nobody picks one

**Owner:** `efsv2` · **Neighbours:** `arcade`, `open-web-app-store`, `web-client-os` · **Severity:** important · MVP-relevant

core-architecture-candidate.md:363-387 uses GameProject/GameMetadata/ArtifactClosure/GameRelease/VerifiedLocator/CatalogMembership/SelectedRelease; Stage A defines ArtifactRelease/1 {subject, artifact, versionLabel, custodyFloor, runtime?, notes?} with versionLabel inside the hashed body, hence identity-bearing under RecordId = H(domain, typeSchemaId, canonicalBody) (b0-content-locators.md:788-797); the Store defines SoftwareProject/PackageManifest/PackageRelease/ArtifactClosure/ResolvedPackageSet, saying PackageRelease is 'a new application Type following ArtifactRelease/1's separation, or an explicit composition' because ArtifactRelease/1 'has no first-class Manifest field', under OWS-R4 'Labels ... are testimony, never identity'; Arcade uses a chain-free slug manifest with DATA UID/PIN/TAG/PROPERTY contentHash and PlayablePackage profile-1. The catalog shape forks too: per-member CatalogMembership plus per-Project SelectedRelease Binding (Core/Stage A) versus an immutable CatalogEdition snapshot with one Binding per catalog (store, 'rather than one Binding per mutable entry'). Andromeda instantiates the label hazard ('0.9.0' = two byte sequences). No Arcade doc references the store model -- grep 'SoftwareProject|PackageRelease|open-web-app-store|App Store' over Designs/arcade/*.md returns zero hits -- yet the store README (:188-191) says Arcade pressure is 'already incorporated' and mvp-and-acceptance.md:849 says Arcade 'Fits ... PackageHandoff'. Which object a one-game Andromeda slice would publish is unowned, and the Arcade docs (2026-08-07/12, queue held) predate the store (2026-08-14).

**Evidence:** `Designs/efsv2/core-architecture-candidate.md:115, 363-387` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:779-800; chapters/harness-and-fixtures.md:719, 729-730` · `Designs/open-web-app-store/architecture.md:74 (OWS-R4), 198-320, 236-243, 364-378, 821; README.md:188-191` · `Designs/arcade/mvp-architecture.md:116-135, 163-169; v2-pressure-and-migration.md:10-14; README.md:3, 19-20` · `Designs/web-client-os/mvp-and-acceptance.md:849; Reviews/2026-08-13-claude-evidence-round/corpus/arcade/andromeda-evidence-reproduction.md:24, 63`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R12-open-web-app-store-05, S2-arcade-x-appstore-x-r-02

### CORE-39 — No fixture has the candidate's shape, and FX-ARC phase G asserts a network property the assigned runtime lane cannot have

**Owner:** `efsv2` · **Neighbours:** `arcade`, `web-client-os`, `open-web-app-store` · **Severity:** important · MVP-relevant

Stage A's FX-ARC exercises a 96 MiB game.wasm plus 512 MiB assets.pak closure with RuntimeRequest/1 (wasm profile, 2 capabilities), and its phase G promises LAUNCH_DISPOSABLE with 'no ambient ... network authority ... every undeclared request is denied' -- deliverable in a Wasm Worker but not in the opaque-iframe lane the Web Client/OS assigns to games, where network is a construction-time profile the measurement shows the sandbox cannot deny; AT-8b names FX-ARC.G as the client's future conformance script, so it cannot be scored honestly as written. Meanwhile no fixture matches the actual candidate artifact: the store's is an unnamed 'zero-dependency active closure', the WCO's is 'one bounded legacy HTML profile', and the candidate is one 45,248-byte HTML file (sha256 61916fb0...4418) with no build, assets, network or storage. The repair is an FX-ARC variant with a single-file legacy-HTML closure and an opaque-iframe runtime profile tag, plus lane-qualifying phase G's network sentence.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:722-726, 751-757; chapters/traceability.md:234-235 (AT-8b)` · `Designs/open-web-app-store/architecture.md:914; Designs/web-client-os/product-constitution-and-roadmap.md:292-293; app-runtime-and-direct-launch.md:447, 646-648` · `Reviews/2026-08-13-claude-evidence-round/corpus/arcade/andromeda-evidence-reproduction.md:58-67, 95; corpus/runner/browser-runner-measurements.md:76-89`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S2-arcade-x-appstore-x-r-09

### CORE-42 — The Open Web App Store's Core-shaped needs are never filed in the efsv2 inbox despite the Store's own routing rule

**Owner:** `efsv2` · **Neighbours:** `open-web-app-store`, `web-client-os` · **Severity:** important · MVP-relevant

The Store routes finite catalog reconstruction to the Files proposal's 'unproven BindingScope experiment - not current B0/Core' (architecture.md:842-852), lists 'author+target intersections' and a digest index as residual work (:376-378, 827), and routes portable authorship to V2-E3 -- whose consumer list names Arcade, Git, EAP, Nanda, Markdown, Topic/literal and privacy but not packages. The Core candidate promises only scalar/reference/backlink indexes and point Binding reads, with compound keys 'only if a workload proves it' (:270, 274-279), and B0 rejects compound grammars outright (b0-indexes.md:1077). The efsv2 inbox has no BindingScope, enumeration, compound-key or package-authorship item -- LP-2 says only that wide enumeration 'must earn separate mechanism and budget' -- and the Store's own routing rule (open-web-app-store/owner-decision-inbox.md:27-28) says such seams must be filed upstream. Because the File Browser's complete listing rides on the same primitive, the gap is MVP-relevant even though the Store itself is not.

**Evidence:** `Designs/open-web-app-store/architecture.md:376-378, 827, 842-852, 970-977; owner-decision-inbox.md:27-28 (routing rule)` · `Designs/efsv2/owner-decision-inbox.md:§V2-E3 consumer list; §LP-2 (grep 'BindingScope' -> 0 hits in inbox/constitution/candidate)` · `Designs/efsv2/core-architecture-candidate.md:270, 274-279` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:1077 ('Compound and alternate grammars are [REJECTED for B0]')` · `Designs/web-client-os/README.md:524-526; mvp-and-acceptance.md:851`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S1-appstore-x-os-x-types-03

### CORE-43 — Curator plurality -- the one agreed EFS-specific property -- rests on a Lens seam with a disputed unit and unmeasured cost

**Owner:** `efsv2` · **Neighbours:** `owner`, `web-client-os`, `git-forge`, `media-library` · **Severity:** important · MVP-relevant

The Arcade falsification pass kept curator plurality as its only unresolved benefit, and the community research's core pattern is 'independent communities add attributed tags, collections, mirrors ... without taking ownership' (TC-09 'Multiple curators without a universal moderator') -- so plurality is the adoption differentiator research and falsification agree on. It rests on a seam nobody has sized: direction 8 sets the contract Lens target at 64 Principal entries where 'controller keys do not consume Lens positions', but in B0 an entry is one key/account and the owner's own three-key example needs the deferred managed Principal (b0-lens §3.2, §9; SR-14); directory listing under a K-Principal Plan is K scope pages plus M x K point probes (hierarchical-files-and-folders.md §5.3 705-726) with no cost model, and the roster lever that priced 50+ in July was dropped. A wiki with five admins fits at Plan size 8 today; the vault should say so and measure 64 later rather than let the adoption differentiator ride on an unpriced target.

**Evidence:** `Reviews/2026-08-13-claude-evidence-round/corpus/arcade/arcade-falsification-pass-1.md:§Classification (plurality UNRESOLVED)` · `Reviews/2026-07-29-target-communities/README.md:§Answer in one page; requirements-and-first-apps.md:TC-09` · `Designs/web-client-os/README.md:§Direct owner direction items 7-8` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md:§3.2, §9; chapters/b0-overview.md:SR-14` · `Designs/efsv2/hierarchical-files-and-folders.md:§5.3 lines 705-726; §13.6 line 2162`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** J3-adoption-first-12

### CORE2-04 — client-os-pressure-report is unowned, unindexed, and still a live decision sink against a superseded freeze

**Owner:** `efsv2` · **Neighbours:** `clientv2`, `arcade`, `web-client-os` · **Severity:** important · not on the MVP path

`Designs/efsv2/client-os-pressure-report.md` (Status draft, last touched 2026-07-07, Depends on [[web-os-thesis]]) marks P1/P2/P4c/P11 as [ETCHED-WINDOW] against `[[freeze-gates]]` §C, a freeze the 2026-08-08 greenfield ruling superseded (`Decisions.md`:23). It carries none of the 2026-08-12 correction banners that assumptions-and-requirements.md and human-overview.md received, is absent from the README evidence map (91-111) and from system-constitution.md, yet remains a decision sink (`Designs/arcade/player-security-model.md`:16) and a dependency (`Designs/efsv2/os-pass-handoff.md`:5), and `Designs/clientv2/README.md`:59 and `clientv2/open-questions.md`:20 still repeat 'P1/P2/P4c/P11 are freeze-window-relevant ... must precede the freeze-gates gas snapshot'. The clientv2 inbox says it is 'to be revalidated' (line 57) but names no owner. Some of its content silently landed with no back-pointer (P3's NO-TRANSPORT appears as NO_TRANSPORT in `Designs/web-client-os/mvp-and-acceptance.md`:170; P1's admittedAt-in-state relates to V2-E4/E5), so nobody can tell which pressures were absorbed and which were dropped.

**Evidence:** `Designs/efsv2/client-os-pressure-report.md:1-23` · `Designs/efsv2/README.md:91-111` · `Designs/clientv2/README.md:59; Designs/clientv2/open-questions.md:20; Designs/clientv2/owner-decision-inbox.md:57` · `Designs/arcade/player-security-model.md:16; Designs/efsv2/os-pass-handoff.md:5` · `Designs/web-client-os/mvp-and-acceptance.md:170-172` · `Decisions.md:23`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R11a-clientv2-thesis-ker-09

### CORE2-15 — No exit/notice threshold exists and V2-E7 has not absorbed the venue matrix

**Owner:** `efsv2` · **Neighbours:** `owner` · **Severity:** important · not on the MVP path

The evidence round found that no surveyed L2 met a 30-day notice/exit bar under every upgrade path — Base 2/2 (3/6+8/11) delay None, OP 2/2 None, Arbitrum SC 9/12 emergency None (regular 7-17 d unreconciled), Linea 5/9 None, Scroll 3/4 None, while L1 has no admin key (`commons-realm-venue-matrix.md` §2a row 'Exit window', Appendix C), and `CORRECTIONS.md` line 17 scopes the claim correctly. `system-constitution.md` §EFS Commons (83-90) and `owner-decision-inbox.md` §V2-E7 list 'exit' as a CROPS/matrix axis, but 'exit window' has zero hits in Designs/ and no threshold or conditionality sentence exists anywhere; V2-E7's text was reconciled 2026-08-12, the day before the matrix, and does not cite it or its disqualifiers D1-D8. The matrix's §6 Q1 also asks whether an Etched kernel 'tolerates a mutable machine underneath it' — a question no ruling answers, though `owner-rulings.md` 2026-07-10 item 18 etches 'no body-elision' as a 'permanent promise'. Deferring the venue choice to V2-E7 is correct and explicitly not MVP-blocking; the gap is that the gate carries no measurable bar for the axis the evidence says every candidate fails.

**Evidence:** `Reviews/2026-08-13-claude-evidence-round/corpus/venue/commons-realm-venue-matrix.md:§2a, §3 F4, §5 D1-D8, §6 Q1, Appendix C` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:line 17 ('Every L2 has no exit window')` · `Designs/efsv2/owner-rulings.md:§2026-07-10 item 18 (line 68); §2026-08-12 'No Commons home chain is selected'` · `Designs/efsv2/system-constitution.md:§EFS Commons lines 83-90; §Open questions bullet 9` · `Designs/efsv2/owner-decision-inbox.md:§V2-E7 lines 62-68` · `grep 'exit window' Designs/ → 0 hits`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R18-evidence-round-02, S13-never-decided-22

### CORE2-17 — Assumption A-1 'chains don't die' is neither reconciled nor reopened against the dead-chain evidence

**Owner:** `efsv2` · **Neighbours:** `owner` · **Severity:** important · not on the MVP path

`Designs/efsv2/owner-rulings.md` §2026-07-10 adopts 'assume a blockchain persists indefinitely and stays queryable' and drops 'any graded/UNKNOWN after the home chain is gone language'; `assumptions-and-requirements.md` A-1 (line 244) gives the reopen condition 'A chosen venue loses independent queryability, affordable inclusion, or reliable state'. The 2026-08-13 evidence documents Goerli with zero reachable RPCs, Holesky frozen ~2026-06-03 on one endpoint, Polygon zkEVM frozen 2026-07-03 with explorer NXDOMAIN, and 14 named dead L3s sharing a decommissioned Conduit load balancer (`l1-incidents-and-dead-data.md` §B6, §B8; `commons-realm-venue-matrix.md` §3 F9), and asks 'retained, scoped, or retired?' (§6 Q3). The evidence README routes this to V2-E5/V2-E7, but `owner-decision-inbox.md` (reconciled 2026-08-12) does not mention the assumption, and neither `system-constitution.md` nor `core-architecture-candidate.md` restates or retires it — while their flagship acceptance target is 'Fresh qualifying L3' (constitution line 303), the exact class the evidence calls mortal.

**Evidence:** `Designs/efsv2/owner-rulings.md:§2026-07-10 'Simplifying assumption: chains don't die' lines 10-17` · `Designs/efsv2/assumptions-and-requirements.md:A-1 line 244` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/l1-incidents-and-dead-data.md:§B6 133-182, §B8 212-225` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/commons-realm-venue-matrix.md:§1 item 7, §3 F9, §6 Q3` · `Reviews/2026-08-13-claude-evidence-round/README.md:§Held routing notes lines 210-212` · `Designs/efsv2/system-constitution.md:line 303`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R18-evidence-round-07

### CORE2-24 — Compound IndexSpec is gated circularly between Core and media, so neither can move

**Owner:** `efsv2` · **Neighbours:** `media-library` · **Severity:** important · not on the MVP path

`Designs/media-library/query-and-indexing.md`:99, 130 (Q5 and candidate shape 3) rely on 'one workload-proven small compound key'; `Designs/efsv2/core-architecture-candidate.md`:279 allows a compound IndexSpec 'only if a workload proves it'; Stage A marks compound grammars [REJECTED for B0] (`b0-indexes.md`:1077-1079) and the encoding chapter says the COMPOUND form 'must not mint' while still reserving DOM_VK_CMPD (`b0-encoding-and-ids.md`:111, 1510-1516). The only workload that could prove it is the media one, which is not scheduled for Stage B, and V2-E4 (`Designs/efsv2/owner-decision-inbox.md`:40-45) does not mention compound keys at all. Repair: efsv2 states in V2-E4 whether a compound IndexSpec is a bakeoff cell, and media either files the exact (tag x facet) trace as a fixture or drops the on-chain arm of Q5.

**Evidence:** `Designs/media-library/query-and-indexing.md:99, 130` · `Designs/efsv2/core-architecture-candidate.md:279` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:1077-1079` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md:111, 1510-1516` · `Designs/efsv2/owner-decision-inbox.md:40-45`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S3-media-x-types-x-index-01

### CORE2-30 — Directory-listing cost at 64 Principals is James's recorded fear with no cost model

**Owner:** `efsv2` · **Neighbours:** `web-client-os` · **Severity:** important · not on the MVP path

`owner-rulings.md` 2026-07-10 line 26 records the concern verbatim: '50+ attesters in one lens, resolved on every directory listing ... naive first-attester-wins is O(entries x attesters) and breaks', and `Designs/web-client-os/README.md` direction 8 sets a 64-Principal Lens target. `hierarchical-files-and-folders.md` §5.3 (705-716) lists by paging every Plan Principal's scope and then point-resolving each surviving role through the Plan — P scope pagings plus N x (up to 64) head probes per listing — and lines 723-726 admit 'A scope with 10,240 dead roles followed by 63 live roles may return ten empty PARTIAL pages'. §13.6 (2162-2163) only lists 'Plans 1/8/32/64 point and listing matrices' as a future gate and `core-architecture-candidate.md`:450 benchmarks 1/8/32/64 for point reads only. No listing cost model exists anywhere, in Core or in the client tier the design moves listings to.

**Evidence:** `Designs/efsv2/owner-rulings.md:2026-07-10 Lenses line 26` · `Designs/web-client-os/README.md:direction 8 lines 69-71` · `Designs/efsv2/hierarchical-files-and-folders.md:§5.3 lines 705-726; §13.6 lines 2162-2163` · `Designs/efsv2/core-architecture-candidate.md:Open questions line 450`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R3-efsv2-files-11

### CORE2-34 — The ~57-row requirements register was never traced into the constitution

**Owner:** `efsv2` · **Neighbours:** `owner` · **Severity:** important · not on the MVP path

`assumptions-and-requirements.md` line 131 calls its R-IDs 'stable handles for design reviews', but no current design cites any R- ID (a grep across Designs/ excluding the ledger hits only solana.md, multichain-dependency-map.md and joined-pass-synthesis.md) and the Stage A carry-in register cites only R-L8, R-L4, R-X2, R-K8 and §10/§12. Rows visibly carried: R-D2 (constitution 145-147), R-L8 (200-201), R-O10 (268-273), R-P7/P8 (250-256), R-M2 (306). Rows with no current home: R-M3 century drills, R-K6 recovery-cannot-seize-funds/decrypt, R-X7 local-commitment profile, O-1..O-4 obligations, V-1/V-2 acceptance decisions, D-K15 non-transferable principals. The ledger's line 19 still claims to 'govern classification and blocker status' while `system-constitution.md` lines 22-28 rank it fifth in precedence, so nobody can tell whether an untraced row was deliberately dropped or simply forgotten.

**Evidence:** `Designs/efsv2/assumptions-and-requirements.md:line 19; §4 line 131; R-M3 147, R-K6 176, R-X7 194, O-1..O-4 271-274, V-1/V-2 280-281` · `Designs/efsv2/system-constitution.md:22-28, 145-147, 200-201, 250-256, 268-273, 306` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/carry-in-register.md:74, 161-162, 469-470, 520-522`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R5-efsv2-context-require-02

### CORE2-35 — Admission time as a Core read: July-adopted pending James, never ruled, now absent

**Owner:** `efsv2` · **Neighbours:** `git-forge`, `open-web-app-store` · **Severity:** important · not on the MVP path

`client-os-pressure-report.md` P1 (26-41) argues admittedAt[claimId] in state is a hard dependency for the predate defence (P13 line 166: 'NO trustless implementation today'), for update cooldowns and for cross-chain existed-by bounds; `os-pass-handoff.md`:29 marked it 'ADOPT (James, in the P1 kernel-state bundle)' and `fs-pass-freeze-reservations.md`:31 'NEEDS-JAMES'. No ruling exists and the 08-12 reset dropped the mechanism: `core-architecture-candidate.md` AdmissionReceipt (193-209) carries admissionOrdinal only, and `system-constitution.md`:169 promises 'global admission order' but no time. Direction 19 (opt-in upgrades) removes the cooldown consumer, but the existed-by bound and Git/forge chronology do not go away, and no current doc re-decides whether Core exposes admission time.

**Evidence:** `Designs/efsv2/client-os-pressure-report.md:P1 lines 26-41; P13 line 166` · `Designs/efsv2/os-pass-handoff.md:line 29` · `Designs/efsv2/fs-pass-freeze-reservations.md:B1 line 31; line 83` · `Designs/efsv2/core-architecture-candidate.md:AdmissionReceipt lines 193-209` · `Designs/efsv2/system-constitution.md:line 169` · `Designs/web-client-os/README.md:direction 19 lines 107-116`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R5-efsv2-context-require-07

### CORE2-36 — Revocation-aware counts survive as a costed obligation without the sybil or scoping caveat

**Owner:** `efsv2` · **Neighbours:** `git-forge`, `owner` · **Severity:** important · not on the MVP path

`owner-rulings.md` 2026-07-15 item E (line 49) rules 'live count: revocation-aware, PAY for it', the 08-12 ruling (181) and `system-constitution.md` 180-182 keep it as a costed gate, and the 08-07 Git direction (163) maps stars/reactions onto that count. `client-os-pressure-report.md` P13 (169) established that engagement counts are 'untrustworthy both directions — sybil-inflatable up (N addresses = N reactions, only gas-gated) ... never GATE-consumable' and must be lens-filtered; revocation-awareness fixes deflation-by-revoke, not inflation. `core-architecture-candidate.md` (266-299) defines no count primitive at all, and no current doc says whether the count is Plan/Principal-scoped or global; ruling F (line 51, 'on-chain gates use closed, trusted author sets') implies scoped counts but nothing states it — so the most expensive index obligation in the bundle is being paid for without a stated meaning.

**Evidence:** `Designs/efsv2/owner-rulings.md:lines 49, 51, 163, 181` · `Designs/efsv2/system-constitution.md:lines 180-182` · `Designs/efsv2/client-os-pressure-report.md:P13 table line 169` · `Designs/efsv2/core-architecture-candidate.md:Indexes lines 266-299 (no count primitive)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R5-efsv2-context-require-08

### CORE2-42 — ERC-1271 authorship is a constitutional requirement with no owner ruling

**Owner:** `efsv2` · **Neighbours:** `git-forge`, `web-client-os`, `owner` · **Severity:** important · not on the MVP path

`system-constitution.md` L132 requires 'EOA and ERC-1271 authorship must work in a fresh supported Realm' and `owner-decision-inbox.md` P-6 (124-127) / P-9 (138-141) treat it as a greenfield requirement, but no entry in `owner-rulings.md` says this; the only owner trace is `Decisions.md` L37 (2026-07-25 'assume universal native smart accounts'), which calls itself 'coordination memory, not the canonical record'. The July evidence says the opposite with a security argument (`identity.md` L18 'No ERC-1271 anywhere, ever (chain-bound, state-dependent)'; `kel.md` §12 L622 'forbidden for envelope/KEL authority'), and Stage A re-earns it only as a PROPOSAL by pinning codehash+block at admission and never calling account code on reads (`b0-principal-authority.md` §5 L1151-1193). The consequence is unowned: a contract-account Principal is Realm-qualified, so the same Safe on two Realms is two Principals (`core-architecture-candidate.md` L245-247; constitution L142-144 'part of the prototype'), which collides with the 2026-08-07 forge direction that 'teams/orgs = org principals with KEL control succession' (owner-rulings.md L163) and the constitution's clonable-teams trace (L311). Not MVP-blocking: the client MVP is EOA-only and reports ERC1271_UNSUPPORTED (`mvp-and-acceptance.md` L101-103).

**Evidence:** `Designs/efsv2/system-constitution.md:Authorship and authority L130-147, L311` · `Designs/efsv2/owner-decision-inbox.md:P-6 L124-127, P-9 L138-141` · `Decisions.md:L37` · `Designs/efsv2/identity.md:L18; kel.md:§12 L622` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:§5 L1151-1193` · `Designs/efsv2/core-architecture-candidate.md:L245-251` · `Designs/efsv2/owner-rulings.md:2026-08-07 L163` · `Designs/web-client-os/mvp-and-acceptance.md:L101-103`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R4-efsv2-identity-lens-p-04

### CORE2-51 — App Store's Core mapping is B0-specific while its executed evidence assumes the layered ABI

**Owner:** `efsv2` · **Neighbours:** `open-web-app-store`, `web-client-os`, `owner` · **Severity:** important · not on the MVP path

`Designs/open-web-app-store/architecture.md`:816 says 'All mappings are candidate/B0 hypotheses, not adopted protocol'; the mapping table (818-830) uses B0 Type names and 854-857 rely on B0's 16-member closure limit and 64-Principal Lens. The fixture README instead sits 'above the candidate layered EFS Type and Data ABI' (line 7 inputs, line 13 verdict) and exercises Views, QueryProfiles, exact-revision SELF and sixteen direct roots plus nested closure (70-141) — concepts that exist only in `Designs/efsv2/layered-type-system-and-data-abi.md`. Owner direction 12 (`Designs/web-client-os/README.md`:81-84) says the Type/query-identity axis remains open and `Designs/efsv2/README.md`:75-80 calls the layered doc an experiment target, so until the arm is chosen the store cannot state which of Manifest/closure/ceiling/profile-ID/label/index declarations perturb PackageRelease or ResolvedPackageSet identity — and there is no arm-neutral identity statement to fall back on.

**Evidence:** `Designs/open-web-app-store/architecture.md:814-857` · `Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md:7, 13-19, 70-141` · `Designs/web-client-os/README.md:81-84` · `Designs/efsv2/README.md:75-80` · `Designs/efsv2/core-architecture-candidate.md:89-95`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R12-open-web-app-store-03

### PRD-43 — Three unreconciled Markdown revision models; the claimed decision slice expired with no output

**Owner:** `git-forge` · **Neighbours:** `efsv2`, `web-client-os`, `vault-process` · **Severity:** important · MVP-relevant

The corpus rules that 'EFS does not mint per-commit version records' and marks H-3 'Git is the canonical file/version history' as SURVIVES (state-model.md §3 line 58; requirements-ledger.md:107). Stage A FX-GIT mints both: wiki page bytes are stored as BLOB GitObject/1 payloads and as a WikiPageRev/1 chain (prev = predecessor occurrence) with a per-page current-rev Binding, '8 page revisions across 2 pages' (harness-and-fixtures.md:496,:796-799,:810). Files defines FileRevision/1 with 'parents array(max=8)' merges and 'Edit file = ChunkTree + FileRevision + file-head CAS rebind' (hierarchical-files-and-folders.md:446-462,:1142,:1151-1152) and names Stage A as a dependency (line 6) without reconciling. Greps: 'FileRevision' in Stage A = 0 hits; 'WikiPageRev' outside Stage A = 0 hits. @git-forge claimed exactly this fork - 'explicit Git-native versus EFS-native Markdown history' (Kanban.md:36-37) - promising 'a scoped design choice and exact Stage B application fixtures' (Daily Notes/agent-status.md:206); the card expired 2026-08-17 and the only commit is 8b81bdd, the claim itself. Recommended repair: FileRevision/1 as the product revision engine with an optional edit summary, WikiPageRev/1 retired or defined as a projection, Git-native kept as interop.

**Evidence:** `Reviews/2026-08-07-efs-git-corpus/requirements-ledger.md:107; state-model.md §3 line 58` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:496, :796-799, :810` · `Designs/efsv2/hierarchical-files-and-folders.md:6, :446-462, :1142, :1151-1152` · `Kanban.md:36-37 (expired 2026-08-17; only commit 8b81bdd)` · `Daily Notes/agent-status.md:206`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R16-git-forge-03, S4-git-x-types-x-core-03

### PRD-20 — Media is written against the bundled B0 index arm only; the layered Type/QueryProfile arm is unaddressed in the vault

**Owner:** `media-library` · **Neighbours:** `efsv2`, `owner`, `vault-process` · **Severity:** important · MVP-relevant

The media docs assume bundled B0 index identity - SCALAR_EQ/REF_BACKLINK/DIGEST_EQ declarations (query-and-indexing.md:57-64) - and never mention QueryProfileId, ViewQueryProfile, Data Views or TypeRevisionId; a grep over all seven media docs returns nothing. Designs/efsv2/layered-type-system-and-data-abi.md §7 (lines 387-426) is the other live arm and Designs/efsv2/README.md:75-80 lists it as the current technical candidate, while owner direction #12 (web-client-os/README.md:81-84) says 'The Type/query-identity axis remains open'. The evidence that media survives the layered arm exists only outside the vault: Daily Notes/agent-status.md:236 (2026-08-22) reports a 'Media Library x layered Type/Data ABI pressure pass in disposable experiment commit e9652d3' with 'seven exact-Type QueryProfiles ... two finite ViewQueryProfiles', and no Reviews entry or media doc records it. The set's entire Core mapping is written against one arm of an open bakeoff.

**Evidence:** `Designs/media-library/query-and-indexing.md:57-64` · `Designs/efsv2/layered-type-system-and-data-abi.md:387-426` · `Designs/efsv2/README.md:75-80` · `Designs/web-client-os/README.md:81-84 (direction #12)` · `Daily Notes/agent-status.md:236 (experiment commit e9652d3, outside the vault)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R13-media-library-05

### CORE-03 — Realm stewardship is unowned: no deployer, no churn ceremony, no successor, no client Realm list, no fork doctrine

**Owner:** `owner` · **Neighbours:** `web-client-os`, `owner` · **Severity:** important · MVP-relevant

Owner direction 2 requires the MVP client to 'debug the evolving contracts' and the client's Ownership table assigns 'Realm bootstrap' to EFS v2, but nobody is named to deploy, key, upgrade or succeed a Realm. core-architecture-candidate.md §Realm says only 'The exact descriptor and upgrade boundary remain a bakeoff target'; b0-realm-admission.md:352 puts RealmId distribution 'above Core', §7 U-1/U-3 (1416-1427) forbid semantic change under one RealmId ('Core has no successor pointer and no admin successor bit'), RealmSuccessor/1 is named at :1422 and never defined, and InitConfig/1 carries no deployer identity. The v1 Safe-keyed CREATE3 ceremony (Kanban.md:71; Decisions.md 2026-06-11) cannot be inherited under the 2026-08-08 greenfield ruling, and efsv2/README.md §Hard holds allows 'Upgradeable prototype contracts' without saying who holds the key; V2-E5 covers the descriptor, not deployment or custody. The same hole swallowed the 2026-07-01 adversarial review's top gap: three perspectives 'discharged a real finding onto "clients maintain a trusted-chain list" - an authority with no owner, update mechanism, or succession plan', plus a fork doctrine ('an ETH/ETC-style split yield two universes with identical IDs and diverging claims'), and neither is answered anywhere. Consequence: every semantic iteration mints a new RealmId that strands links made against the previous one, so the first user-visible failure will be dead links -- the 'confirmed, then unreadable' shape -- unless the client owns an explicit Realm list and old-Realm links resolve to UNSUPPORTED/UNKNOWN with a visible reason rather than to empty (mvp-and-acceptance.md:117-123).

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Realm stewardship is unowned: no named deployer or key holder, no churn ceremony, no successor, no fork doctrine. Owner direction 2 requires the MVP client to "debug the evolving contracts" (web-client-os/README.md:44-47) and the client's Ownership table assigns "Realm bootstrap" to EFS v2 (:410), but no document names who deploys, keys, upgrades or succeeds a Realm. core-architecture-candidate.md:61 says only "The exact descriptor and upgrade boundary remain a bakeoff target"; b0-realm-admission.md:352 puts RealmId distribution "above Core"; §7 U-3 (1418-1427) makes any semantic change a new RealmId ("Core has no successor pointer and no admin successor bit") and names `RealmSuccessor/1` at :1422 without defining it. The mechanism for custody exists and is empty, not absent: InitConfig/1 carries `upgradeAuthorityKind` plus a `bytes32 upgradeAuthorityRef` "immutable genesis controller ref" (:203-205) with append-only controller transitions (§7 U-1), and nothing in the vault says who holds it — while efsv2/README.md §Hard holds allows "Upgradeable prototype contracts" without naming a key holder and V2-E5 covers the descriptor, not deployment or custody. The v1 Safe-keyed CREATE3 ceremony (Kanban.md:71; Decisions.md 2026-06-11) cannot be inherited under the 2026-08-08 greenfield ruling. The same hole swallowed the 2026-07-01 adversarial review's top gap — three perspectives "discharged a real finding onto 'clients maintain a trusted-chain list' — an authority with no owner, update mechanism, or succession plan" — plus the fork doctrine. Both survive only as explicitly deferred items in historical July drafts (efs-v2-holistic-redesign.md:59, itself banner-marked "Historical umbrella — not current design authority"; fable-next-pass-scope.md:78 under "Explicitly deferred"), and neither is carried into any current document, queue item or ruling, on main or on the readiness branch (whose build-start packet explicitly excludes venue and deployment). Consequence: every semantic iteration mints a new RealmId that strands links made against the previous one, so the first user-visible failure will be dead links — the "confirmed, then unreadable" shape — unless the client owns an explicit Realm list and old-Realm links resolve to UNSUPPORTED/UNKNOWN with a visible reason rather than to empty (mvp-and-acceptance.md:117-123).

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Narrow this to what is actually unowned and MVP-relevant: nobody is named to deploy, key, and retire the Sepolia development Realm, and no churn ceremony exists for the RealmId turnover that owner direction 2 ('debug the evolving contracts') guarantees. That is an owner question (custody and operations), not an efsv2 design question — the descriptor and upgrade-authority design is already V2-E5's, with a delegated candidate default on the readiness branch. Drop the successor-pointer and fork-doctrine framing as blocking: `b0-realm-admission.md:1416-1427` refuses a Core successor slot deliberately and reasoned, P-5 defers succession past the MVP, and the ETH/ETC fork doctrine is a 50-year policy question that cannot block a Sepolia dev MVP. Drop the client-side dead-link claim as unmitigated: `mvp-and-acceptance.md:117-123` already requires an inspectable route table and `UNKNOWN/UNSUPPORTED` over silent fallthrough. Severity important, not blocking.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:352; §7.2 U-3 lines 1416-1427 (RealmSuccessor/1 at 1422); §2.4 InitConfig/1` · `Designs/web-client-os/README.md:direction 2 lines 44-47; §Ownership boundaries line 410` · `Designs/efsv2/core-architecture-candidate.md:§Realm lines 57-61; §Open questions line 443` · `Reviews/2026-07-01-v2-adversarial-review.md:§The trusted-chain-list punt (fork doctrine)` · `Designs/efsv2/owner-decision-inbox.md:§V2-E5 lines 47-52; Designs/efsv2/README.md:§Hard holds` · `Designs/web-client-os/mvp-and-acceptance.md:117-123, 338-341; Kanban.md:71; Decisions.md:2026-06-11, 2026-08-08`

**Re-classified in verification:** severity blocking → important (materiality lens); owning set efsv2 → owner (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** S13-never-decided-03, J2-cypherpunk-risk-first-10, R20-older-reviews-11

### PRO-02 — July outcome-level owner rulings were never ledgered; post-reset standing unknown

**Owner:** `owner` · **Neighbours:** `efsv2`, `vault-process`, `web-client-os` · **Severity:** important · MVP-relevant

Designs/efsv2/large-file-uploads.md §"James rulings (2026-07-07)" (lines 73-81) records five rulings — signed contractReadable floor, "Fully permissionless byte pool — RULED … there is no protocol takedown … filtering lives entirely at the edges", frozen EFSBytes, "L2/L3-first, L1 for the exceptional", reserve blob tier — and efs-substrate-decision.md §5 (lines 57-61, RULED 2026-07-02) records "EFS is a permanent archive — everyone pays for the data they write to the chain; there is no free ephemeral tier" plus content neutrality (line 69). Designs/efsv2/owner-rulings.md begins 2026-07-10 and holds none of them; Decisions.md line 37 (2026-07-25) lists nine James framing rulings — including "large on-chain files are first-class v2 (James overrode the PM's defer-bytes rec)" and "chains render like drives" — and says the design thread ratifies these into owner-rulings.md, which has no 2026-07-25 section. Stage A already leans on one of them: b0-content-locators.md line 826 cites "the July contractReadable ruling" the ledger does not hold. After the 2026-08-12 reset ("supersedes earlier mechanism-level rulings, not the problems they were solving", owner-rulings.md lines 178-181) nobody can say which outcome-level rulings still bind — and the "everyone pays / no free tier" half decides the payer question inside the MVP byte-carrier decision (PRO-14). The constitution's nearest sentence ("Core remains neutral evidence infrastructure") is compatible with the cypherpunk policy floor but is not a restatement of it.

**Evidence:** `Designs/efsv2/large-file-uploads.md:§James rulings (2026-07-07) lines 73-81` · `Designs/efsv2/efs-substrate-decision.md:§5 lines 57-61, 69` · `Designs/efsv2/owner-rulings.md:section list (2026-07-10, 07-15, 07-16, 07-22, 07-23, 08-07, 08-12 only); 178-181` · `Decisions.md:37 (2026-07-25 pointer entry)` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:826` · `Designs/efsv2/system-constitution.md:§EFS Core (Core remains neutral evidence infrastructure)`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R3-efsv2-files-07, S13-never-decided-19, J2-cypherpunk-risk-first-09

### PRO-17 — 'Chains don't die' is orphaned: premise gone, reopen condition met, disposition unowned

**Owner:** `owner` · **Neighbours:** `efsv2`, `vault-process`, `arcade`, `media-library`, `git-forge` · **Severity:** important · MVP-relevant

Designs/efsv2/owner-rulings.md §2026-07-10 ADOPTED "assume a blockchain persists indefinitely and stays queryable" and instructed to "DROP … chain-death machinery", with the NET effect that "the authoritative home chain … always exists"; §2026-08-12 removes any home chain ("No Commons home chain is selected"; the reset "does not … revive a global home chain") and says it "supersedes earlier mechanism-level rulings, not the problems they were solving" — and this is an assumption, not a mechanism, so it has never been retired. Its written reopen condition ("A chosen venue loses independent queryability, affordable inclusion, or reliable state", assumptions-and-requirements.md A-1 line 244) is met by the evidence: Polygon zkEVM frozen 2026-07-03 with archive RPC alive and explorer gone, dead Goerli/Holesky, "no surveyed L2 met the analyst-applied 30-day notice/exit" bar (CORRECTIONS.md:17), blob bytes ~18.2 days, and the venue memo's verdict "safe for L1, arguable for the top L2s, and empirically false for L3s" with its open question "retained, scoped, or retired?" (commons-realm-venue-matrix.md §1 item 7 line 36; §6 Q3 line 167); the 08-12 direction also widened the venue class from the ledger's D-5 "exactly one measured venue" to any qualifying L3 — the class D-5 warned about — without restatement. system-constitution.md and core-architecture-candidate.md never restate it (grep persist|dies|sunset|dead-chain: no hits, 2026-09-02), V2-E5/V2-E7 never name it although the round routes "chain mortality assumptions" to them, Stage A's per-Realm reframing (QR-1..QR-8 plus UNAVAILABLE_SOURCE_BASIS, b0-realm-admission.md §4) survives only as unadopted spine edit A2 (0 of 16 applied), and Retirements.md has no row. It is nevertheless still cited as in force by July spine docs (freeze-gates.md §B "Dead-chain fire drill … never yet run"; ops-doctrine.md amendments 3 and 7 "MUST-pull-home-chain"), by Stage A chapters (b0-content-locators.md:1113-1114; b0-realm-admission.md QR-1), and — with no banner — by two evidence documents: Reviews/2026-08-07-efs-git-corpus/requirements-ledger.md line 11 ("A-1 | Chains persist and stay queryable | owner-rulings 2026-07-10 | … authority reads are definite") and Reviews/2026-07-29-virtual-os-museum-deep-dive.md line 48, which lists the ruling among what makes the EFS catalog "the survivable object", i.e. conference-claim material that CORRECTIONS.md lines 41-44 require to be refreshed. The owner must retain, scope (per-Realm, operator-asserted, none for testnets or Realms EFS does not operate) or retire it; efsv2 then states the answer in the constitution and V2-E5/E7, and vault-process adds correction pointers to the two evidence docs. The same orphaning silently removed every dead-venue hedge the older reviews required (century C1 substrate-neutral export, its 'Before any 100-year claim' gates 1-2 and 6, the audit's P0-9 dead-venue export, the C2 crypto-epoch axis).

**Evidence:** `Designs/efsv2/owner-rulings.md:§2026-07-10 lines 10-17; §2026-08-12 lines 178-187, 193-197; line 144 ('L1 expensive / L2s transient')` · `Designs/efsv2/assumptions-and-requirements.md:A-1 line 244; D-5 lines 433-440` · `Designs/efsv2/system-constitution.md:§EFS Core ('A fresh qualifying L3'), 90, 214-216, 306` · `Designs/efsv2/owner-decision-inbox.md:V2-E5 47-52; V2-E7 62-68` · `Reviews/2026-08-13-claude-evidence-round/README.md:164-170, 183-195, 210-212; CORRECTIONS.md:16-17, 19, 29, 41-44` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/commons-realm-venue-matrix.md:§1 item 7 line 36; §6 Q3 line 167` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/l1-incidents-and-dead-data.md:§B6 149-182` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:A2 110-168; chapters/b0-realm-admission.md:§4 QR-1..QR-8, §8.2 1821-1824; chapters/traceability.md:OR-1` · `Designs/efsv2/freeze-gates.md:§B 'Dead-chain fire drill'; Designs/efsv2/ops-doctrine.md:§Amendments 3 and 7` · `Reviews/2026-08-07-efs-git-corpus/requirements-ledger.md:11; Reviews/2026-07-29-virtual-os-museum-deep-dive.md:48` · `Reviews/2026-07-10-efsv2-century-storage-and-cypherpunk-os-review.md:C1; 'Before any 100-year claim'` · `Retirements.md:§Active (empty)`

**Verified:** not separately verified; clustered from 8 independent lane findings · **Source lanes:** R19-process-rulings-ledg-05, R1-efsv2-spine-05, R5-efsv2-context-require-03, R20-older-reviews-01, S8-evidence-bindings-vs-04, S9-confirmed-then-unread-01, S13-never-decided-14, S9-confirmed-then-unread-09

### PRO-19 — 'Reconstruct from declared Realm state' does not say whether it survives the Realm's death

**Owner:** `owner` · **Neighbours:** `efsv2` · **Severity:** important · not on the MVP path

system-constitution.md lines 214-216 and the acceptance trace at line 306 promise reconstruction "from the declared Realm state"; §EFS Commons line 90 lists "reconstructability, and exit"; V2-E7 line 67 says "walk-away reconstruction"; assumptions-and-requirements.md R-M2 line 146 says "from chain state and documented exports". Stage A delivers only the weak reading — QR-6 (lines 411-419) says EFS never requires logs or history, and §8.2 (lines 1821-1824) reconstructs only at the basis the RPC serves — while the Commons criteria assume the strong one. The venue memo states the fork exactly (§6 Q2, line 165): "from venue state, or from the venue's parent after the venue dies? … satisfied on L1 forever … ~18 days on blob rollups, and never on AnyTrust L3s. R-M2 currently does not say which it means", and its D1 (line 146) proposes "reconstructible from a parent chain by permissionless software after all operators disappear". The two readings select different venues, so efsv2 should define two named grades (REALM_STATE, what B0 promises; PARENT_DA_OR_EXPORT, what a durable Realm must add) in V2-E5 and name the grade in the Independent-rebuild trace and RealmDescriptor/1, with the owner ruling which grade any "durable" product claim requires.

**Evidence:** `Designs/efsv2/system-constitution.md:90, 214-216, 306` · `Designs/efsv2/owner-decision-inbox.md:V2-E7 64-68` · `Designs/efsv2/assumptions-and-requirements.md:R-M2 line 146` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:QR-6 411-419; §8.2 1821-1824` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/commons-realm-venue-matrix.md:§5 D1 line 146; §6 Q2 line 165`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S9-confirmed-then-unread-05

### PRO-20 — 'No body elision — permanent promise' is unconditional on venues with zero-notice upgrades

**Owner:** `owner` · **Neighbours:** `efsv2` · **Severity:** important · not on the MVP path

Item 18 was ruled "a permanent promise never to do that" and survives as an acceptance obligation (owner-rulings.md:68, 183-187) and as a constitutional requirement ("never replaced by hash-only body elision", system-constitution.md:210-220). CORRECTIONS.md:17 records that "No surveyed L2 met a 30-day bar under all upgrade paths … several retain zero-delay emergency paths", and notes the 30-day bar "is L2BEAT's Stage 2 criterion, not an adopted EFS requirement"; grep 'exit window' Designs/ returns 0 hits, V2-E7 names "exit/successor behavior" with no threshold, and the constitution's only upgrade sentence covers EFS contracts, not venue keys. The venue memo's Q1 ("Does an Etched kernel tolerate a mutable machine underneath it?") is recorded nowhere. Because the greenfield spine no longer uses the word Etched, the promise is now a requirement about Realm state that can honestly be per-Realm and conditional on the Realm's upgrade authority — but no document says so. Repair: V2-E7 records (a) whether EFS adopts any notice bar and (b) the conditionality sentence, and V2-E5's Realm descriptor discloses upgrade authority; James rules only on (a).

**Evidence:** `Designs/efsv2/owner-rulings.md:68, 183-187` · `Designs/efsv2/system-constitution.md:87-90, 210-213, 217-220` · `Designs/efsv2/owner-decision-inbox.md:62-68 (V2-E7)` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:17` · `Reviews/2026-08-13-claude-evidence-round/README.md:170-174` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/commons-realm-venue-matrix.md:32, 155, 163`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S8-evidence-bindings-vs-03

### PRO-40 — The ETHOnline window that would give the slice a deadline lapses today

**Owner:** `owner` · **Neighbours:** `arcade`, `vault-process`, `web-client-os` · **Severity:** important · not on the MVP path

Kanban.md:19 and ETHOnline-2026.md:46-58 recommend "the one-game Arcade exact-artifact + tampered-primary + verified-fallback trace behind a provisional adapter" as the ETHOnline 2026 entry (event Sept 4-16; conservative internal signup cutoff September 3; official metadata September 6 — :16-19). ETHOnline-2026.md:7 still reads "Status (2026-08-11): tracked; no application or project submission is recorded yet" and Owner-Inbox.md:28-33 FJ-4 (apply or skip) is unanswered in the vault. Kanban.md:19 also says "Implementation repository is deliberately unchosen" and owner direction 11 forbids creating one this pass, so with no recut, no adapter and no repository the entry cannot be made by the cutoff unless James decides today (2026-09-03) — otherwise the window closes silently.

**Evidence:** `Kanban.md:19` · `ETHOnline-2026.md:7, 16-19, 46-58` · `Owner-Inbox.md:28-33 (FJ-4)` · `Designs/web-client-os/README.md:§Direct owner direction item 11`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R14-arcade-17

### PRO-44 — Media library: Booru-first contradicts the intake's local-first and collides with P-11

**Owner:** `owner` · **Neighbours:** `efsv2`, `media-library` · **Severity:** important · MVP-relevant

The 2026-08-14 intake recommends "personal/local-first" as the media V2-F2 input (Reviews/2026-08-14-media-library-intake/product-charter-and-roadmap.md:59-72, 97-101; candidate-fixture-evidence.md:396; Daily Notes/agent-status.md:205, 207), whereas Designs/media-library/owner-decision-inbox.md:23-27 says "If V2-F2 selects the media lane, the current evidence-backed sequence to evaluate there is Booru read-only discovery first, then Plex direct play", and the README build order (:177-191) puts Booru Slice 1 before Plex Slice 0 with no recorded reason for the reversal. Meanwhile Designs/efsv2/owner-decision-inbox.md P-11 (:149-151) says "Chain-free mode … Not part of the Core MVP … a local-only product mode may be reconsidered in EFS OS", which cuts against a local-only library (PLEX-10, Plex Slice 0) being a first EFS surface at all. Three positions, none reconciled; the owner decides through V2-F2.

**Evidence:** `Designs/media-library/owner-decision-inbox.md:23-27 (Decide after evidence)` · `Designs/media-library/README.md:177-191 (Proposed build order)` · `Reviews/2026-08-14-media-library-intake/product-charter-and-roadmap.md:59-72 (First-product ordering)` · `Designs/efsv2/owner-decision-inbox.md:P-11 149-151; V2-F2 87-92` · `Designs/media-library/plex-jellyfin-app.md:PLEX-10 (125); Plex Slice 0 (364-375)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R13-media-library-13

### PRO-48 — The owner's Type/query-identity answer was lost and nobody re-asked

**Owner:** `owner` · **Neighbours:** `efsv2`, `web-client-os`, `open-web-app-store` · **Severity:** important · MVP-relevant

Direction 12 (Designs/web-client-os/README.md line 81) says "The Type/query-identity axis remains open. The latest owner response was not interpretable, so this set infers no choice" — an answer existed, no queue carries a re-ask, and Open-Decisions.md cannot show it. The axis is on the MVP path: V2-E4 and V2-E8 in Designs/efsv2/owner-decision-inbox.md, the layered proposal's own §"Status and authority" ("does not … close V2-E4, V2-E8, or V2-F1"), and the client's §Current work sequence step 3 ("freeze only the symbolic inputs in [[type-data-abi-boundary-pressure]]"), which needs a "frozen-for-the-experiment" Type/Files input that no efsv2 doc names as a deliverable. Three arms exist with no crosswalk — B0 Variant A (core-architecture-candidate.md §Type Schema lines 89-95), Stage A F4 "SPLIT-ID" (bakeoff-spec.md:144, 357) and the layered Architecture C — and the Files MVP silently picked one: hierarchical-files-and-folders.md is B0-only (TypeSchemaId, KIND_BINDING_SCOPE to a successor B0 Codex, lines 6, 369, 671-676) while the README's "current Type-system proposal" is the layered arm, and type-data-abi-boundary-pressure.md claims arm-neutrality while its descriptor and evolution fixture use queryProfileRef/LogicalShapeId/SemanticSpecId that exist only under C. owner-rulings.md §2026-08-12 still calls it a "50-year bakeoff question, not ruled".

**Evidence:** `Designs/web-client-os/README.md:direction 12 (line 81); §Current work sequence step 3` · `Designs/efsv2/owner-decision-inbox.md:§V2-E4, §V2-E8` · `Designs/efsv2/layered-type-system-and-data-abi.md:§Status and authority` · `Designs/efsv2/core-architecture-candidate.md:§Type Schema 89-95` · `Designs/efsv2/hierarchical-files-and-folders.md:6, 369, 671-676` · `Designs/web-client-os/type-data-abi-boundary-pressure.md:§Candidate adapter contract; §Disposable evolution fixture; §Future disposable experiment gate` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/bakeoff-spec.md:144, 357 (F4 SPLIT-ID arm)` · `Designs/efsv2/owner-rulings.md:§2026-08-12 (50-year bakeoff question)`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R19-process-rulings-ledg-12, S13-never-decided-11

### PRO-49 — No agreed sequence to an MVP; the 2026-07-22 support matrix was skipped, not superseded

**Owner:** `owner` · **Neighbours:** `efsv2`, `web-client-os`, `vault-process` · **Severity:** important · MVP-relevant

Four sequences coexist: Designs/efsv2/README.md §Build order (prototypes → benchmarks → Fable pass → freeze, product slice in parallel); owner-rulings.md §2026-07-22 ("The contraction gate comes later. After the joined pass and comparable prototypes, reconcile the owner inbox, write the short constitution and explicit support matrix, and only then choose the MVP", the matrix distinguishing required / extension-ready / experimental / explicitly unsupported behavior, reaffirmed 07-23); Designs/web-client-os/README.md §Current work sequence step 3 ("freeze only the symbolic inputs in type-data-abi-boundary-pressure, then … one disposable exact-Type fixture"); and Stage A → Stage B (stage-a-report.md "Next: run disposable Stage B"; Kanban.md:43). The support matrix was never written — grep hits only the ruling, July ethereum-first-efs-and-os.md line 344, and Stage A proposed-spine-edits.md C9 ("fold into output 7 or retire — flag for PM") — yet direction 2 chose the MVP. The 2026-07-23 CORRECTION permits a voluntary isolated owner answer, so direction 2 legitimately wins, but no document says the 07-22 sequence is satisfied or superseded, and Stage A's contradiction ledger row 1 (which called the README/kickoff ordering BLOCKING and was resolved as a staged program) never changed the README. The missing matrix is exactly the artifact that would say which acceptance sections and Core capabilities the MVP requires.

**Evidence:** `Designs/efsv2/README.md:§Build order` · `Designs/efsv2/owner-rulings.md:§2026-07-22 Research sequencing; §2026-07-23 CORRECTION (voluntary isolated answers)` · `Designs/web-client-os/README.md:§Current work sequence item 3; §Direct owner direction item 2` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:§Contradiction ledger row 1; §C9` · `Kanban.md:42-43` · `grep 'support matrix' across Designs/ (only the ruling, ethereum-first-efs-and-os.md:344, C9)`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R1-efsv2-spine-02, S13-never-decided-20

### SDK-04 — The write seam is placed three ways and two of its named steps are specified nowhere

**Owner:** `sdk` · **Severity:** important · MVP-relevant

**Category** UNDECIDED · **Owning set** sdk · **Severity** important · **MVP-relevant** yes
**Members** `S6-sdk-and-mount-spread-04`
**Neighbours** web-client-os, efsv2 `web-client-os/README.md`:185 places "identity, wallet, planner, signer, submitter" inside a client module;
`ethereum-standards-and-interop.md`:551 says "Action/submission separation | SDK + Client System Chrome";
`mvp-and-acceptance.md`:834 says "Client/SDK requirement; current names illustrative" — one seam, three
placements. Two operations the MVP journey names are defined nowhere. "A raw EOA may be normalized by the SDK
into a zero-setup account Principal" (`mvp-and-acceptance.md`:182-184) names an operation no SDK or Core doc
defines: Stage A `b0-principal-authority.md`:131 makes AccountPrincipal/1 intrinsic with "no state to hold it",
and the only SDK normalization B0 mentions is low-s signatures (:499, :524). "Compile immutable ActionPlan from
trusted schemas" (:215) names ActionPlan/0, which exists only as an illustrative Type in
`type-data-abi-boundary-pressure.md`. Repair: sdk specifies `principalIdFor(kind, address)` and ActionPlan as
pure SDK functions, or web-client-os declares them client-owned — decided together with SDK-05.

**Evidence:** `b0-principal-authority.md` · `ethereum-standards-and-interop.md` · `mvp-and-acceptance.md` · `type-data-abi-boundary-pressure.md` · `web-client-os/README.md`

**Verified:** not separately verified · **Source lanes:** 

### SDK-05 — Files resolver placement is asserted three ways and never chosen

**Owner:** `sdk` · **Severity:** important · MVP-relevant

**Category** UNDECIDED · **Owning set** sdk · **Severity** important · **MVP-relevant** yes
**Members** `S6-sdk-and-mount-spread-03`
**Neighbours** web-client-os, efsv2 `architecture-and-modules.md`:1185 says the Protocol SDK "must not own Files paths" and :1186 gives "stable
Files resolution/listing/revisions" to "Shared Reader/artifact/Files modules"; `hierarchical-files-and-folders.md`
:118-119 says "The SDK, Web Client, OS, and mounts share one resolver core" and :2276 assigns "sdk — canonical
codec/resolver/view/citation/acquisition APIs"; on branch `codex/sdkv2-pm`@57d04f8 `Designs/sdkv2/README.md` says
"the SDK owns the lossless semantic adapter beneath both" Web Client/OS and Data Explorer.
`Designs/efsv2/mountable-filesystem-semantics.md`:554 requires the same resolver behind native adapters, so the
choice propagates. Repair: owner rules placement (recommended: one browser-neutral SDK package owns the resolver
core); the losing docs each update one sentence.

**Evidence:** `Designs/efsv2/mountable-filesystem-semantics.md` · `Designs/sdkv2/README.md` · `architecture-and-modules.md` · `hierarchical-files-and-folders.md`

**Verified:** not separately verified · **Source lanes:** 

### SDK-06 — Four result/error vocabularies and two shapes for source unavailability, with no law-owner

**Owner:** `sdk` · **Severity:** important · MVP-relevant

**Category** UNDECIDED · **Owning set** sdk · **Severity** important · **MVP-relevant** yes
**Members** `S6-sdk-and-mount-spread-06`, `R7a-stageA-b0-ids-envelo-06`
**Neighbours** efsv2, web-client-os Four result vocabularies exist with no owner for the law: client `ResourceOutcome<T>`
(PRESENT/PARTIAL/UNKNOWN/ABSENT/MASKED/CONFLICT/INVALID/UNSUPPORTED, `mvp-and-acceptance.md`:700-703); the Files
registry PRESENT_FILE…ABSENT_PROVEN…UNSUPPORTED_HOST_PATH with POSIX/WinFsp mappings
(`hierarchical-files-and-folders.md`:1489-1509, 1561-1578); B0 `Completeness {UNKNOWN, COMPLETE, PARTIAL,
UNSUPPORTED}` plus lens FOUND/ABSENT/CONFLICT/UNSUPPORTED/UNKNOWN with "The SDK result-model fixture must
include…" (`b0-lens.md`:704-725); and off-main `ResultV0` with ten profile axes and an effect axis
COMMITTED/NOT_COMMITTED_PROVEN/UNKNOWN/NOT_APPLICABLE (`Designs/sdkv2/exp-c0-mvp-packet.md` on `codex/sdkv2-pm`).
Inside that, source unavailability has two incompatible shapes: `b0-realm-admission.md` §4.2 (:445-465) defines
`BasisGrade.UNAVAILABLE_SOURCE_BASIS(sourceRealmId, requiredBasisKind)` as an orthogonal axis value with presence
pinned to UNKNOWN (H-1) and calls the wording a "verbatim adoption target for the SDK/result-model chapter",
while the corpus's own `corpus/proposed-spine-edits.md` §A2 (third bullet) says "a UNKNOWN result carrying the
cause code UNAVAILABLE_SOURCE_BASIS" and `hierarchical-files-and-folders.md` uses the cause-code shape
`UNKNOWN(HISTORY_UNAVAILABLE)` (:784, :1431) and never uses UNAVAILABLE_SOURCE_BASIS at all. Realm :1811-1819
admits `Completeness.UNKNOWN`, p

**Evidence:** `Designs/sdkv2/exp-c0-mvp-packet.md` · `STATUS.md` · `b0-lens.md` · `b0-realm-admission.md` · `corpus/proposed-spine-edits.md` · `hierarchical-files-and-folders.md` · `mvp-and-acceptance.md` · `open-web-app-store/architecture.md` · `owner-rulings.md`

**Verified:** not separately verified · **Source lanes:** 

### SDK-07 — The deterministic write plan and the pending-vs-admitted lifecycle were dropped without disposition

**Owner:** `sdk` · **Severity:** important · MVP-relevant

**Category** UNDECIDED · **Owning set** sdk · **Severity** important · **MVP-relevant** yes
**Members** `R15-efs15-evidence-04`
**Neighbours** web-client-os, efsv2 efs15 R15 (`Designs/efs15/requirements-and-boundaries.md` §R15 "Pin EAS behavior and persist deterministic write
plans") required the SDK to persist a deterministic write plan — canonical bytes, salts, IDs, dependency order,
expected CAS — with states draft/signed/submitted/admitted/finalized/superseded/failed, so at-least-once retries
reduce to inert duplicates. The 2.0 Core spine has zero hits for "write plan" or "outbox";
`hierarchical-files-and-folders.md`:689 mentions retry/failed-CAS append only in passing. Stage A `STATUS.md` §Honest
gaps lists G-5 "Pending/outbox data must never render as admitted/confirmed" with home "SDK result-model lane",
but no design document, queue item or Kanban card owns that lane. The official MVP is a write-capable File
Browser (`web-client-os/README.md`:318), so idempotent retry and honest pending-state rendering are on the MVP
path, not deferrable polish.

**Evidence:** `Designs/efs15/requirements-and-boundaries.md` · `STATUS.md` · `hierarchical-files-and-folders.md` · `web-client-os/README.md`

**Verified:** not separately verified · **Source lanes:** 

### CLI-01 — MVP wallet and signing stack decided in substance, never stated or costed

**Owner:** `web-client-os` · **Neighbours:** `sdk`, `efsv2`, `owner` · **Severity:** important · MVP-relevant

README.md line 3 still says "no ... wallet stack ... is authorized" and WCOS-R14 says only "connect a supported wallet", yet three docs fix it: mvp-and-acceptance.md §Required write behavior requires the author to "sign the authored PublicationEnvelope and the Realm-bound AdmissionIntent separately because every Files operation selects Binding leaves" (74-78, 218-219), §C narrows to EIP-6963 behind EIP-1193 with EIP-5792 sequential fallback, §Deliberately deferred requires an EOA-only adapter to report ERC1271_UNSUPPORTED, and ethereum-standards-and-interop.md:254-259 marks EIP-7702 "disabled by default" and ERC-4337 "design for". No doc contains any sponsorship, relayer, paymaster or faucet path, so the first official product is an injected-EOA, self-funded-gas path with two wallet popups per folder create and three per file create if a carrier authorization is needed. The doctrine that would have caught this was dropped: clientv2/system-surfaces.md:137-145 set "median session <=1 ceremony; a flow that provokes >3 is a design bug" (also shell-and-sessions.md:163-169), while the spine names no per-write budget — ethereum-standards-and-interop.md:633 only says one popup is not semantic success and direction 7's "reduce routine ceremony" (mvp:184-185) names no count. Whether one ceremony can carry both authorizations (EIP-712 nesting or an EIP-5792 batch) without collapsing authored publication into Realm admission is undecided and sits between web-client-os and the Files candidate. Nobody has written the sentence, costed two prompts against v1's measured one-click bar (sdk-minimal-clicks.md:16; sdk-write-ux.md §The constraint) or the buildathon faucet/burner workarounds (Decisions.md 2026-06-23), or asked James whether a Sepolia-faucet-dependent EOA path is acceptable for the first official product.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

MVP wallet and signing stack decided in substance, never stated or costed. `Designs/web-client-os/README.md:3` still says "no ... wallet stack ... is authorized" and WCOS-R14 (`product-constitution-and-roadmap.md:157`) says only "connect a supported wallet", yet three documents fix the stack in substance: `mvp-and-acceptance.md:74-78`/`:218-219` require the author to "sign the authored `PublicationEnvelope` and the Realm-bound `AdmissionIntent` separately because every Files operation selects Binding leaves"; §C. Official writes narrows discovery to EIP-6963 behind EIP-1193 (`:375-376`) with an explicit EIP-5792 sequential fallback (`:401`); §Deliberately deferred requires an EOA-only adapter to report `ERC1271_UNSUPPORTED` (`:101-102`); and `ethereum-standards-and-interop.md:254-257` makes EIP-5792 the "Preferred supported-wallet adapter", ERC-4337 "Design for" and EIP-7702 "Design for; disabled by default". Sponsorship is *named but not adopted*: `ethereum-standards-and-interop.md:259` parks ERC-7677 paymaster service at "Draft except Review ERC-7677; watch", and the one worked-out gas-sponsorship design (`Designs/sdk-write-ux.md:27,:48` — ERC-7677 paymaster plus an EAS-delegated-attestation relayer) is v1 SDK work that no web-client-os document adopts or cites. So the first official product defaults to an injected-EOA, self-funded-gas path whose per-write ceremony count nobody has stated: the operation sequence (`mvp-and-acceptance.md:207-221`) runs sign PublicationEnvelope -> sign AdmissionIntent -> submit `publish()`, and no document says how many wallet prompts that is. The doctrine that would have caught it was dropped with clientv2: `system-surfaces.md:145` set "median session <=1 ceremony; a flow that provokes >3 is a design bug" (also `shell-and-sessions.md:163-169`), while the current spine names no per-write budget — `ethereum-standards-and-interop.md:633` only says one wallet popup is not semantic success, and "reduce routine ceremony" (`mvp-and-acceptance.md:185`, the client's rendering of owner direction 7) names no count. The comparison is *not* against a one-click bar: `sdk-minimal-clicks.md:16` states one click as a Goal, and the vault's measured shipped v1 baseline is 2-3 popups, burner 0 (`Designs/efsv2/deterministic-ids.md:20`), with `efs-v2-holistic-redesign.md:25` recording that "the click-count argument was falsified against the shipped baseline". Whether one ceremony can carry both authorizations (EIP-712 nesting or an EIP-5792 batch) without collapsing authored publication into Realm admission is undecided and sits between web-client-os and the Files candidate. Nobody has written the sentence, costed the prompts, or asked James whether a Sepolia-faucet-dependent EOA path (`Decisions.md` 2026-06-23: faucet PR #31, instant Sepolia burner session PR #39) is acceptable for the first official product; `mvp-and-acceptance.md` §Open questions acknowledges only the adjacent "initial EOA arm" fixture question.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

MVP wallet and signing stack fixed in substance, never stated as a product decision or costed. mvp-and-acceptance.md:74-78 requires two separate signatures for *every* Files operation (authored `PublicationEnvelope` + Realm-bound `AdmissionIntent`), §C narrows to EIP-6963 behind EIP-1193 with sequential fallback (:375-376), and §Deliberately deferred requires an EOA-only adapter to report `ERC1271_UNSUPPORTED` (:102) — yet README.md line 3 still says no "wallet stack ... is authorized" and WCOS-R14 says only "connect a supported wallet". The client set names no sponsorship, relayer, paymaster or faucet path for the MVP: its only such entries are dispositions to watch (ethereum-standards-and-interop.md:259, ERC-7677 "Draft ... watch"; :256 ERC-4337 "Design for"), and the efsv2 community-relayer sponsorship doctrine (ops-doctrine.md:14; efs-substrate-decision.md:63) is never referenced by the client set. So the first official product is an injected-EOA, self-funded-gas path at two ceremonies per write. Sharper than the ceremony-budget point: mvp-and-acceptance.md is internally inconsistent with itself — the journey table at :285 lists a single "wallet ceremony" for folder create while :74-78 mandates two signatures. The dropped doctrine (clientv2/system-surfaces.md:137-145, "median session <=1 ceremony; a flow that provokes >3 is a design bug") has no successor budget; ethereum-standards-and-interop.md:633 only says one popup is not semantic success. Owner ask: is a two-ceremony, faucet-funded EOA path acceptable for the first official product, and may one ceremony carry both authorizations without collapsing authored publication into Realm admission?

**Evidence:** `Designs/web-client-os/README.md:line 3 (Status: 'no ... wallet stack ... is authorized')` · `Designs/web-client-os/product-constitution-and-roadmap.md:WCOS-R14` · `Designs/web-client-os/mvp-and-acceptance.md:74-78, 184-185, 218-219 (§Required write behavior); §C. Official writes; §Deliberately deferred (ERC1271_UNSUPPORTED)` · `Designs/web-client-os/ethereum-standards-and-interop.md:254-259 (5792 preferred; 7702 'disabled by default'); :633` · `Designs/clientv2/system-surfaces.md:137-145 ('median session <=1 ceremony ... >3 is a design bug')` · `Designs/clientv2/shell-and-sessions.md:163-169` · `Designs/sdk-minimal-clicks.md:16; Designs/sdk-write-ux.md:§The constraint, now proven at contract level` · `Decisions.md:2026-06-23 buildathon entry (faucet, burner session)`

**Re-classified in verification:** severity blocking → important (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R10-wco-technology-stand-06, R11a-clientv2-thesis-ker-07, S13-never-decided-06

### CLI-02 — Byte carrier for MVP file read-back undecided; inherited default is ruled out

**Owner:** `web-client-os` · **Neighbours:** `arcade`, `efsv2`, `owner` · **Severity:** important · MVP-relevant

Designs/web-client-os/mvp-and-acceptance.md §Open questions line 898 still asks "Which exact byte carrier and retention receipt can support clean-browser file read-back without becoming correctness authority?", the acceptance tests are carrier-generic, and §Content publication failure boundaries (262-274) makes BYTES_UNAVAILABLE an honest failure rather than a passing create; Designs/arcade/README.md §Current direction (12-21) leaves "serving custody" open. The inherited v1 path is a public IPFS gateway to a pin on one VPS (arcade/mvp-architecture.md:146 "IPFS mirror — the current Sepolia reality"; unknowns-and-experiments.md U16), which Reviews/2026-08-24-ipfs-maintainership-transition.md says "cannot be the only client bootstrap, discovery, or artifact path" — ipfs.io, dweb.link and trustless-gateway.link share one backend and Shipyard support ends 2026-09-30 — and andromeda-evidence-reproduction.md §Locators and custody (110-117) shows every live Andromeda locator is one operator. The only owner direction is pre-greenfield (owner-rulings.md §2026-07-10 Storage lines 35-37: "on-chain + Arweave now; possible Filecoin grant for IPFS pinning") and survives only in Stage A's proposal-level DurabilityGrade table, where b0-content-locators.md §10.1 ranks CHAIN_HISTORY (3) above FUNDED_PINNED (2) although blob bytes are guaranteed only ~18.2 days (CORRECTIONS.md). No current document adopts a carrier profile, and carrier extinction is not an MVP acceptance test: the one trace was appended to the Core hardening Kanban card that expired 2026-08-16 (Kanban.md:43).

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Byte carrier for MVP file read-back undecided; inherited default is ruled out. `Designs/web-client-os/mvp-and-acceptance.md:898-899` (§Open questions) still asks "Which exact byte carrier and retention receipt can support clean-browser file read-back without becoming correctness authority?", the acceptance tests are carrier-generic, and §Content publication failure boundaries (`:262-274`) makes `BYTES_UNAVAILABLE` an honest failure rather than a passing create; `Designs/arcade/README.md:12-21` leaves "serving custody" open. The inherited v1 path is a public IPFS gateway to a pin on one VPS (`arcade/mvp-architecture.md:146` "IPFS mirror - the current Sepolia reality"; `unknowns-and-experiments.md` U16 "SPOF today"), which `Reviews/2026-08-24-ipfs-maintainership-transition.md:127` says "cannot be the only client bootstrap, discovery, or artifact path" - ipfs.io, dweb.link and trustless-gateway.link share one backend (`:102-103`) and Shipyard support ends 2026-09-30 (`:25`) - and `andromeda-evidence-reproduction.md` §Locators and custody shows every live Andromeda locator is one operator. The only owner direction is pre-greenfield (`owner-rulings.md` §2026-07-10 Storage `:35-37`) and survives only in Stage A's proposal-level DurabilityGrade table, where `b0-content-locators.md` §10.1 ranks CHAIN_HISTORY (3) above FUNDED_PINNED (2) although blob bytes are guaranteed only ~18.2 days (`CORRECTIONS.md:16`). No current document adopts a carrier profile. The MVP acceptance list covers only the honest-failure half - `mvp-and-acceptance.md:359-364` requires that with "every eligible candidate unavailable, the semantic file remains inspectable and bytes are `BYTES_UNAVAILABLE`, never absence" - while the full carrier-extinction trace named at `Reviews/2026-08-24-ipfs-maintainership-transition.md` §Remaining operational gap (cold browser, every IPFS gateway/router/bootstrap disabled, *bootstrap the guest client*, then recover exact verified bytes from independently retained custody) is not an MVP acceptance item: it was appended only to the Core hardening Kanban card that expired 2026-08-16 (`Kanban.md:43`), and that review's own §Watch gate defers to a "Recheck before or shortly after 2026-09-30".

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

No carrier profile is chosen for the MVP write slice, and the inherited default has a dated expiry. mvp-and-acceptance.md §Open questions still asks "Which exact byte carrier and retention receipt can support clean-browser file read-back without becoming correctness authority?"; the acceptance tests are carrier-generic; §Content publication failure boundaries (262-274) makes `BYTES_UNAVAILABLE` an honest failure rather than a passing create. The inherited v1 path is a public IPFS gateway to a pin on one VPS (arcade/mvp-architecture.md:146), which Reviews/2026-08-24-ipfs-maintainership-transition.md says "cannot be the only client bootstrap, discovery, or artifact path" — ipfs.io, dweb.link and trustless-gateway.link share one backend and Shipyard support ends 2026-09-30, a date now three weeks out. Two corrections to the earlier framing: (a) §B lines 356-364 *do* test carrier extinction's unavailable branch (`BYTES_UNAVAILABLE`/`BYTE_STATUS_UNKNOWN`, "never absence"); the untested half is recovery from a second independent custody path, which no doc names; (b) an owner direction already exists — owner-rulings.md §2026-07-10 Storage: "on-chain (durable) + Arweave (permanent off-chain) now; possible Filecoin grant for IPFS pinning" — so the residual gaps are whether that pre-greenfield direction still stands, what retention receipt the client shows, and who owns the carrier-extinction recovery trace (the one trace was appended to the Core hardening Kanban card that expired 2026-08-16, Kanban.md:43). The 2026-08-24 review classifies all of this as "operations/profile work, not Core authority", so it gates the file-create definition of done, not the build start.

**Evidence:** `Designs/web-client-os/mvp-and-acceptance.md:§Open questions line 898; §Content publication failure boundaries lines 262-274; §B lines 356-364` · `Designs/arcade/README.md:§Current direction lines 12-21; Designs/arcade/mvp-architecture.md:146; Designs/arcade/unknowns-and-experiments.md:U16 line 36` · `Reviews/2026-08-24-ipfs-maintainership-transition.md:§Persistence and gateway facts, §Consequences for EFS, §Watch gate, §Remaining operational gap` · `Reviews/2026-08-13-claude-evidence-round/corpus/arcade/andromeda-evidence-reproduction.md:§Locators and custody lines 110-117` · `Designs/efsv2/owner-rulings.md:§2026-07-10 Storage lines 35-37` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:§10.1 custody table (CHAIN_HISTORY 3 > FUNDED_PINNED 2)` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md (blob 18.2-day guaranteed window)` · `Kanban.md:43 (Core hardening card 'expires 2026-08-16' with the 2026-08-24 trace appended)`

**Re-classified in verification:** severity blocking → important (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R18-evidence-round-09, J3-adoption-first-06

### CLI-07 — Update trust for first-party client releases is defined by neither the Store nor the OS

**Owner:** `web-client-os` · **Neighbours:** `open-web-app-store` · **Severity:** important · MVP-relevant

Designs/open-web-app-store/architecture.md:401-435 defines UpdateTrustPolicy (TUF-style roles, thresholds, epochs, freshness) and a local UpdateTrustState explicitly "Owned by the user agent/Web Client/OS" (esp. line 422). The OS never defines either: Designs/web-client-os/system-profiles-and-generations.md:388 is the sole mention vault-wide outside the Store and only says the objects "keep separate identities/lifecycles"; UpdateTrustPolicy appears in no file outside the Store; and neither is among the OS's eleven configuration objects (architecture-and-modules.md:627-684). The OS's own first-party posture instead uses ReleaseClosure, ChannelEnvelope, LocalSelectionState and ReleaseStore (architecture-and-modules.md:719-754), with :665-671 stating the first-party AppReleaseGeneration is never a PackageHandoff, and no anti-rollback state object at all. Direction 19's opt-in installed-client upgrade (README.md:107-116) therefore has no stated trust model, and the Store's inbox routes update UX back to the Client/OS owner (open-web-app-store/owner-decision-inbox.md:29-30), so the object has no defining owner in either direction. Repair named by two lanes: the OS adds UpdateTrustState as a configuration object or explicitly declines it, and the Store marks UpdateTrustPolicy as Store data with UpdateTrustState as an open OS ask.

**Evidence:** `Designs/open-web-app-store/architecture.md:401-435 (esp. l.422 'Owned by the user agent/Web Client/OS'); Designs/open-web-app-store/README.md:120` · `Designs/web-client-os/system-profiles-and-generations.md:388 (sole mention of UpdateTrustState)` · `Designs/web-client-os/architecture-and-modules.md:627-684 (the eleven configuration objects); :719-754 (ReleaseClosure/ChannelEnvelope/ReleaseStore); :665-671` · `Designs/web-client-os/README.md:107-116 (owner direction 19)` · `Designs/open-web-app-store/owner-decision-inbox.md:29-30` · `grep UpdateTrustPolicy|UpdateTrustState across vault: only that one line outside the Store`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R9-wco-architecture-runt-07, R12-open-web-app-store-04, S1-appstore-x-os-x-types-04

### CLI-14 — File Browser's trust placement unstated and contradicts product-constitution §4

**Owner:** `web-client-os` · **Neighbours:** `clientv2`, `open-web-app-store`, `efsv2` · **Severity:** important · MVP-relevant

architecture-and-modules.md:77-88 draws Data Explorer as a Layer-3 App ("MIN -->|default Data Explorer guest entry| APP"), :300-311 says it "is part of the MVP critical closure" and mvp-and-acceptance.md:781-790 lists it as "Trusted for MVP correctness", yet BootGeneration (:632-633: "exact conserved base, Reader Kernel, trusted Viewer Shell, System Chrome, fallback handlers") does not name it and "guest entry" is also the confined guestEntry package mode requiring an all-denied GrantDecisionGeneration (:332-341, :910); whether it lives inside BootGeneration or is the first module with a ModuleDescriptor and slot binding decides whether any of the module model is on the MVP path. As drafted it is trusted base: app-runtime-and-direct-launch.md:443 lists "built-in/reviewed base Apps" with "Broad origin authority; supply chain and base review are load-bearing", and owner direction 23 (README.md:132-137) says native Web Components "remain the trusted Shell and fast Files path". That contradicts July's forcing function, which made Files "an ordinary Ring-3 app" whose every power must be "a named, grantable, revocable capability that a third-party file manager could also request. If Files needs a backdoor, the platform has failed" (Designs/clientv2/system-surfaces.md:93-108), and the client's own product-constitution-and-roadmap.md:48-58 (§4), which says the default implementation "does not turn that slot into permanent first-party privilege" with the exception limited to boot verification, authority boundaries, ceremony and recovery. The MVP fixture only tests that crashing Data Explorer leaves the raw rescue (mvp-and-acceptance.md:351-354), never that a third-party file manager could reach parity. The speed-over-confinement trade may be owner-directed, but its consequence — the flagship app is TCB, not a module — is stated nowhere.

**Evidence:** `Designs/web-client-os/architecture-and-modules.md:77-88; :300-311; :332-341; :632-633; :910` · `Designs/web-client-os/mvp-and-acceptance.md:781-790; :351-354` · `Designs/web-client-os/app-runtime-and-direct-launch.md:443 ('Broad origin authority; supply chain and base review are load-bearing')` · `Designs/web-client-os/product-constitution-and-roadmap.md:48-58 (§4, 'does not turn that slot into permanent first-party privilege')` · `Designs/web-client-os/README.md:132-137 (owner direction 23)` · `Designs/clientv2/system-surfaces.md:93-108 ('If Files needs a backdoor, the platform has failed')`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R9-wco-architecture-runt-10, R11a-clientv2-thesis-ker-08

### CLI-17 — No document names which engines must pass Guest Reader versus go to rescue

**Owner:** `web-client-os` · **Neighbours:** `owner` · **Severity:** important · MVP-relevant

README direction 15 says "A current lag in one browser—especially iOS/Safari—does not veto the architecture; unsupported engines receive an explicit reduced/unsupported outcome or rescue path", and technology-foundation.md:594 allows a profile to "reject an inadequate engine with UNSUPPORTED_WEB_PROFILE and a link to the basic/rescue reader". WCOS-R42 lists Chromium, Firefox, WebKit automation, real desktop Safari, real iOS Safari and Android as measured profiles but sets no pass floor. web-platform-standards-and-forward-profile.md contains zero mentions of Safari, iOS or WebKit and lists the "exact first EfsWebProfileV0 feature and engine/AT matrix" as open research. Product success measure 1 ("A stranger can open an exact public folder") is therefore unmeasurable until someone says whether iPhone Safari gets the full Guest Reader or the rescue page.

**Evidence:** `Designs/web-client-os/README.md:§Direct owner direction item 15` · `Designs/web-client-os/technology-foundation.md:594 (UNSUPPORTED_WEB_PROFILE paragraph)` · `Designs/web-client-os/product-constitution-and-roadmap.md:WCOS-R42` · `Designs/web-client-os/web-platform-standards-and-forward-profile.md:§Pressure findings and open research (first bullet); zero mentions of Safari/iOS/WebKit`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R10-wco-technology-stand-11

### CLI-19 — Read-after-write has an outcome rule but no pending-row lifecycle

**Owner:** `web-client-os` · **Neighbours:** `efsv2`, `clientv2` · **Severity:** important · MVP-relevant

mvp-and-acceptance.md:275-277 states the outcome rule — "A local optimistic row is visually pending and never makes a directory listing complete. Read-after-create succeeds only when the authoritative listing/index path returns the admitted name at the pinned later basis" — and :409-416 tests it, but the completeness dependency is still a "Proposed dependency" (:827) and open (:900-901). July had the concrete lifecycle in Designs/clientv2/persistence-and-sync.md D4.2 ("the confirmed snapshot never advances past a slot with pending local writes ... On admission, the speculative row is dropped and replaced by the venue-derived record") plus D4.4-5 torn-tail and compaction rules (lines 74-82). The current spine says nothing about how long a pending row persists, which basis read-back polls, what the person sees between the admission receipt and BindingScope coverage, or when a pending row is declared failed — precisely the "confirmed, then unreadable" shape the evidence round named. privacy-and-agents.md:268-276 gives journal record shape but no lifecycle, and WCOS-R10/WCOS-R19 state the guarantee without a mechanism.

**Evidence:** `Designs/web-client-os/mvp-and-acceptance.md:275-277, 409-416, 827, 900-901` · `Designs/clientv2/persistence-and-sync.md:D4 lines 74-82 (D4.2 rule, D4.4-5 torn tail/compaction)` · `Designs/web-client-os/privacy-and-agents.md:268-276` · `Designs/web-client-os/product-constitution-and-roadmap.md:WCOS-R10, WCOS-R19`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R11b-clientv2-packages-w-13

### CLI-27 — Atomic whole-system generation versus independently updatable modules is undecided

**Owner:** `web-client-os` · **Severity:** important · not on the MVP path

README.md:388 (historical audit row) promises "Split base, handler, system-profile, install, and session generations so unrelated modules need not update atomically." system-profiles-and-generations.md:155-156 (product law 10) says "One local coordinator tuple selects one coherent system graph", :82-86 rejects a "Live collection of independently movable module pointers", and :526-555 and :847-872 make every module change a new SystemActivationGeneration through STAGED -> PREFLIGHT -> COMMIT -> BOOTING -> HEALTHY. README.md:536-537 still lists "Determine which security-critical modules may update independently and which must activate atomically" as open. The readings can be reconciled (bindings independent, selection atomic) but no document says which is meant or states the cost — that every retrieval-adapter update becomes a whole-system transaction with preflight and health (architecture-and-modules.md:34-37).

**Evidence:** `Designs/web-client-os/README.md:388; :536-537` · `Designs/web-client-os/system-profiles-and-generations.md:82-86; :155-156; :526-555; :847-872` · `Designs/web-client-os/architecture-and-modules.md:34-37`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R9-wco-architecture-runt-02

### PRO-14 — No byte carrier chosen for the MVP's 'create a file from local bytes'

**Owner:** `web-client-os` · **Neighbours:** `efsv2`, `web-client-os`, `arcade`, `vault-process` · **Severity:** important · MVP-relevant

Owner direction 2 (Designs/web-client-os/README.md lines 44-47) requires basic file creation, and mvp-and-acceptance.md lines 268-277 make it pass/fail: "Admission succeeding while all carriers fail leaves a real FileRevision with BYTES_UNAVAILABLE … not a passing file-create acceptance result", with the open question at lines 898-899 — "Which exact byte carrier and retention receipt can support clean-browser file read-back without becoming correctness authority?" No web-client-os document names a carrier; hierarchical-files-and-folders.md §7 (lines 1031-1084) models bytes only as ChunkTree plus plural Locator claims and selects nothing; Stage A b0-content-locators.md makes state-tier custody "an optional venue module" (line 757) and says the default 256 KiB chunk "cannot reach state-tier custody" (line 767). The only owner direction is pre-greenfield (owner-rulings.md §2026-07-10 Storage lines 36-37: on-chain > Arweave > grant-pinned IPFS > volunteer IPFS), superseded at mechanism level on 2026-08-12, and the inherited v1 default is ruled out for a guest path by Reviews/2026-08-24-ipfs-maintainership-transition.md ("A direct guest path cannot depend on a public utility"; Shipyard stops operating ipfs.io, dweb.link, delegated routing and bootstrap nodes on 2026-09-30; three gateway hostnames share one backend). Who pays is equally open — only a payerOrSponsor role field (mvp line 196), no sponsorship, paymaster, faucet or gasless path anywhere (grep verified), and the "everyone pays, no free tier" ruling never ledgered (PRO-02) — while the guest read-back requirement (system-constitution.md §EFS Web Client lines 64-75, no hosted indexer) forces bytes a clean browser can verify from Realm state or a public content-addressed network. An MVP claiming file-create without a chosen carrier is not honest; one that ships empty files and small state-custody revisions is.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Replace the "who pays" clause with: "Who pays is equally open — the MVP names only a `payerOrSponsor` role field (`Designs/web-client-os/mvp-and-acceptance.md`:196) and no current web-client-os or efsv2 document designs a sponsorship, paymaster or faucet path for the write MVP; `Designs/web-client-os/ethereum-standards-and-interop.md`:259 keeps ERC-7677 at watch status ('Any future session/sponsor path needs exact target/effects, scope, budget, expiry, payer, privacy, idempotency, revocation'). The only sponsorship/faucet designs in the vault are pre-greenfield or v1 evidence: `Designs/efsv2/efs-substrate-decision.md`:63 ('Sponsored writes take the community-relayer form, not corporate sponsorship', in a doc bannered as a historical carrier decision), `Designs/sdk-write-ux.md`:27/48 (v1 ERC-7677 layer), and `Designs/arcade/README.md`:42 (a v1 Sepolia faucet 'built and integrated but not deployed') — none of them an MVP path, and the 'everyone pays, no free tier' ruling (`efs-substrate-decision.md`:95, RULED 2026-07-02) is still absent from the `owner-rulings.md` ledger, which begins 2026-07-10."

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

The write MVP's file-create acceptance criterion cannot be satisfied because no document selects a byte carrier. mvp-and-acceptance.md:414 requires the client to verify "the committed bytes from a named carrier" and :271-274 rules that an all-carriers-fail `BYTES_UNAVAILABLE` revision "is not a passing file-create acceptance result", while :832 leaves "carrier adapters and retention evidence open", :898 still asks "Which exact byte carrier and retention receipt can support clean-browser file read-back", and product-constitution-and-roadmap.md:279 sequences Slice C "after one explicit content carrier … passes" without naming one. No efsv2 owner-queue item covers storage (owner-decision-inbox.md has V2-E1..E8, F1, F2 and no storage entry) and the July durability ruling (owner-rulings.md 2026-07-10 Storage) was reopened at mechanism level on 2026-08-12 ("exact index/storage machinery must re-earn inclusion"). This is a selection gap, not a design gap: Stage A already specifies and prices state-tier custody (b0-content-locators.md §8: `CHUNK_SIZE_STATE = 20,480`, ≈4.5M gas per chunk, an "optional venue module"), which a near-free Sepolia dev Realm can carry. web-client-os should either name state-tier custody as the MVP carrier and scope the acceptance criterion to it, or scope Slice C to folder-create plus empty/small-body files and say so; only a production durability-tier promise needs James. The who-pays question is not part of this: paymaster, sponsorship and faucet paths are documented (Designs/sdk-write-ux.md:27,48; assumptions-and-requirements.md E-2/E-3; arcade D6), and direction 10 makes Sepolia "near-free".

**Evidence:** `Designs/web-client-os/README.md:direction 2 (44-47)` · `Designs/web-client-os/mvp-and-acceptance.md:196 (payerOrSponsor), 268-277, 409-416, 898-899` · `Designs/efsv2/hierarchical-files-and-folders.md:§7 File bytes and retrieval 1031-1084` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:757 ('optional venue module'), 767 (CHUNK_SIZE_DEFAULT cannot reach state-tier custody)` · `Designs/efsv2/owner-rulings.md:2026-07-10 Storage 36-37; §2026-08-12 178-181` · `Reviews/2026-08-24-ipfs-maintainership-transition.md:§Verified event, §Consequences for EFS, §Watch gate` · `Designs/efsv2/system-constitution.md:§EFS Web Client 64-75` · `Decisions.md:37 ('large on-chain files are first-class v2')` · `Kanban.md:43`

**Re-classified in verification:** severity blocking → important (materiality lens); owning set owner → web-client-os (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R3-efsv2-files-06, J1-mvp-first-04, J2-cypherpunk-risk-first-05, S13-never-decided-05

### CORE-45 — Two Unicode pins: B0 proposes 16.0, the Files draft pins 17.0.0 'replacing rather than coexisting'

**Owner:** `efsv2` · **Neighbours:** `web-client-os` · **Severity:** minor · MVP-relevant

b0-encoding-and-ids.md §2.3 (:408) proposes UNICODE_PIN = 16.0 '[PROPOSAL - final pin at freeze ceremony]', while Designs/efsv2/hierarchical-files-and-folders.md §2.1 (:125-127) says the candidate pin 'is Unicode 17.0.0, replacing rather than coexisting with B0's proposed 16.0 pin'. docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md:32-33 requires 'one Unicode pin ... shared by MC/1 and Files' before any permanent Files bytes are minted. Neither value is ruled, the two current docs disagree, and B0 records no reconciliation -- and because on-chain accepts non-NFC bytes as distinct (b0-encoding-and-ids.md:414-416), the pin is identity-bearing rather than cosmetic. This is one of the five deltas that would force a B0-successor Codex re-cut (CORE-07).

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md:408; lines 414-416, 1484-1485` · `Designs/efsv2/hierarchical-files-and-folders.md:125-127` · `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md:32-33`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R7a-stageA-b0-ids-envelo-07

### CORE2-27 — Both consumer packets reject the layered doc's ANY target class; EXISTS undecided

**Owner:** `efsv2` · **Neighbours:** `open-web-app-store`, `web-client-os` · **Severity:** minor · not on the MVP path

`Designs/efsv2/layered-type-system-and-data-abi.md` (l.360-364, 1115-1116) lists ANY among its closed reference-target classes and T1 tests it, while the Store fixture's finding 1 says unqualified ANY is 'unnecessary and unsafe' and proposes an existence-only target (`Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md` l.70-87), and the OS packet says 'Unqualified ANY is never a closed target', feeds it back as item 8, and states its controls 'came from the parent Type pressure lane' (`Designs/web-client-os/type-data-abi-boundary-pressure.md` l.504-511, 753-756). The layered doc has 'Reviewers: —' (l.7) and is unchanged since 2026-08-14 (last commit 5d1242e), so both consumers are building against a vocabulary they refuse and nobody owns adding or rejecting a RECORD|OBJECT+EXISTS class. Repair: efsv2 accepts, rejects or defers the EXISTS target class before T1 vectors are built.

**Evidence:** `Designs/efsv2/layered-type-system-and-data-abi.md:l.7, 360-364, 1115-1116` · `Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md:l.70-87` · `Designs/web-client-os/type-data-abi-boundary-pressure.md:l.504-507, 511, 753-756` · `git log: layered doc last commit 5d1242e 2026-08-14`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S1-appstore-x-os-x-types-06

### CORE2-43 — The persona model is defined three times and owned by nobody after the reset

**Owner:** `efsv2` · **Neighbours:** `web-client-os` · **Severity:** minor · not on the MVP path

`Designs/clientv2/wallet-and-actions.md` §The persona architecture (31-95) defines Kernel-held burner keys, promptless under PersonaPolicy and an efs.os/persona TAG pair; its 2026-07-11 correction (line 10) defers to `[[kel]]` (separate principals); `owner-rulings.md`:72-79 rules the UX direction ('ONE root that recovers and manages all your addresses/personas'); and §2026-08-12 then says the 'July ... KEL topology ... must re-earn inclusion'. The spine's only word is 'Revise → Uniform PrincipalId' (`Designs/web-client-os/README.md`:393) and the MVP defers 'multi-Principal or delegated write policy' (`mvp-and-acceptance.md`:88-89), while `Designs/efsv2/client-os-pressure-report.md`:92 still calls the efs.os/persona convention 'the client-side form that exists today'. Not MVP-blocking, but the Personal-OS horizon (`product-constitution-and-roadmap.md`:248 'identities and recovery; signer broker') should not inherit a three-way-defined model by default.

**Evidence:** `Designs/clientv2/wallet-and-actions.md:10, 31-95` · `Designs/efsv2/owner-rulings.md:72-79; §2026-08-12` · `Designs/web-client-os/README.md:393; mvp-and-acceptance.md:88-89` · `Designs/efsv2/client-os-pressure-report.md:92, 132` · `Designs/web-client-os/product-constitution-and-roadmap.md:248`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R11b-clientv2-packages-w-10

### CORE2-52 — V2-E3's portable-Envelope bakeoff does not list packages, which the Store's exit story needs

**Owner:** `efsv2` · **Neighbours:** `open-web-app-store` · **Severity:** minor · not on the MVP path

OWS-R14 (`Designs/open-web-app-store/architecture.md`:84) and the 'Portable authorship' seam (842-846, 970-973) require the original authored claim to stay verifiable after mirroring into a second Realm, and the fixture README (220-223) admits its Occurrences are 'unsigned and include a Realm; mirroring reuses the retained source Occurrence rather than proving a portable envelope design'. `Designs/efsv2/core-architecture-candidate.md` 155-158 and bakeoff row 416 leave 'portable authored Envelope + Realm AdmissionIntent' versus 'deliberately Realm-bound Envelope' open, and `Designs/efsv2/owner-decision-inbox.md` V2-E3 (35-38) runs that bakeoff against 'Arcade, Git, EAP, Nanda, Markdown, Topic/literal, and privacy fixtures' — packages are absent, so a Realm-bound choice could silently break the store's steward-death story.

**Evidence:** `Designs/open-web-app-store/architecture.md:84, 842-846, 970-973` · `Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md:220-223` · `Designs/efsv2/core-architecture-candidate.md:155-158, 416` · `Designs/efsv2/owner-decision-inbox.md:33-38 (V2-E3)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R12-open-web-app-store-07

### CORE2-55 — Semantic expiry (stale-not-dead) for Bindings and Occurrences has no disposition in the 2.0 spine

**Owner:** `efsv2` · **Severity:** minor · not on the MVP path

`Designs/efs15/requirements-and-boundaries.md` §R10 required `expirationTime = 0` and semantic `expiresAt = 0` for the MVP and stated that adding expiry later 'is possible only with explicit stale-not-dead behavior in every resolver, index, read, fold, and UI; expiry must never silently fall through to older state', and `Reviews/2026-08-07-efs-v2-to-15-corpus/v2-disposition-ledger.md` classed expiry-aware claims as 'Additive later'. The 2.0 spine (README, system-constitution, core-architecture-candidate, hierarchical-files, owner-rulings, owner-decision-inbox) says nothing either way about Binding/Occurrence expiry; `core-architecture-candidate.md` lines 138/147 mention only Envelope signature 'nonce / expiry', and no P/LP item covers it. This is a silence rather than a contradiction, but it feeds the same open Binding state machine.

**Evidence:** `Designs/efs15/requirements-and-boundaries.md:§R10 final paragraph` · `Reviews/2026-08-07-efs-v2-to-15-corpus/v2-disposition-ledger.md:§Additive later` · `Designs/efsv2/core-architecture-candidate.md:lines 138, 147` · `Designs/efsv2/owner-decision-inbox.md:P-1..P-23, LP-1..LP-10 (no expiry item)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R15-efs15-evidence-06

### PRD-50 — The proposer-funding versus spam-bound contradiction is the corpus's self-declared sharpest risk and has no owner

**Owner:** `git-forge` · **Neighbours:** `web-client-os`, `efsv2`, `owner` · **Severity:** minor · not on the MVP path

Reviews/2026-08-07-efs-git-deep-dive.md §5 names the proposer-funding versus spam-bound reconciliation 'the sharpest single risk', §7 lists it first among unknowns, and kill condition 1b (§8) says the wiki differentiator narrows to trusted-editor workspaces without it; threat-and-economics.md §4 states 'This reconciliation is unresolved' and wiki-and-collab.md §2 makes acceptance item 20 depend on it. It touches the Web Client's payerOrSponsor role (mvp-and-acceptance.md:195) and B0's 'author Principal remains separate from relayer and payer' (core-architecture-candidate.md:253); neither designs sponsorship and nobody owns the question. It matters only if a public-proposal wiki stays in scope - if the Git-cut recommendation is taken it is deferred, not solved.

**Evidence:** `Reviews/2026-08-07-efs-git-deep-dive.md §5, §7, §8 item 1b` · `Reviews/2026-08-07-efs-git-corpus/threat-and-economics.md §4` · `Reviews/2026-08-07-efs-git-corpus/wiki-and-collab.md §2 (acceptance item 20)` · `Designs/web-client-os/mvp-and-acceptance.md:195; Designs/efsv2/core-architecture-candidate.md:253`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R16-git-forge-13

### PRD-51 — Whether a losing ref race must remain on-chain evidence is undecided: corpus 'recorded-but-inapplicable' versus B0 revert-leaves-no-state

**Owner:** `git-forge` · **Neighbours:** `efsv2` · **Severity:** minor · not on the MVP path

The corpus requires losing pushes to stay visible: they are 'recorded-but-inapplicable: permanently visible evidence' (state-model.md §4 line 101), a 'conflicted publish... fees spent; content permanently public' (wiki-and-collab.md:26,30), and traces T7 'rejected without losing evidence' and T9 'force-push displaces history; auditor recovers it' (traces.md:47,60), with P-G5 retention. B0 says the opposite by default: 'a reverted or rejected attempt normally leaves no state' (core-architecture-candidate.md:205-207) and the loser's envelope is 'off-chain evidence' (b0-binding.md:806-810); system-constitution.md:156 'History is append-only evidence' does not settle it. The behaviour is expressible in B0 - re-publish the losing GitPushTransaction/1 Record without Binding leaves - but is undesigned, as are FORCE intent, displaced-closure retention and policy epochs. Repair: git-forge decides whether T7/T9 are requirements; if yes it is an application pattern, not a Core change.

**Evidence:** `Reviews/2026-08-07-efs-git-corpus/state-model.md §4 line 101` · `Reviews/2026-08-07-efs-git-corpus/wiki-and-collab.md:26, 30; traces.md:47, 60` · `Designs/efsv2/core-architecture-candidate.md:205-207` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md:806-810` · `Designs/efsv2/system-constitution.md:156`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S4-git-x-types-x-core-07

### PRD-16 — 'Exact Blob = digest + exact length' has no single Core Type, and the digest index has no declarer

**Owner:** `media-library` · **Neighbours:** `efsv2`, `web-client-os` · **Severity:** minor · MVP-relevant

media-infrastructure.md MEDIA-02 (line 52) requires 'Every Exact Blob binds algorithm-tagged digest, exact length and, when needed, a chunk/range commitment independently of every Locator' and line 76 models ExactBlob as 'digest + length + optional chunk tree'; web-client-os/mvp-and-acceptance.md:143 likewise reads 'Verify digest, length, range/closure'. B0 defines ByteDigest/1 with 'No size, no media type, no name' (b0-content-locators.md §4 lines 306-326); only ChunkTree/1.totalSize (§5.1) commits a length and Locator/1.observedSize (§3) is per-locator testimony. So media either always mints a ChunkTree - making 'optional' wrong - or needs its own length-bearing ExactBlob Type, a second declarer of the same fact under the chapter's 'generic types suffice' claim (§0 lines 12-20). The seam has a second half: the candidate's IndexSpec[] carries no digest kind (core-architecture-candidate.md:274-279) while system-constitution.md:180-181 lists content-digest lookup as a costed gate and DIGEST_EQ is declared by none of B0's own content Types, yet media's Q1 exact-digest row assumes the index exists (query-and-indexing.md:95). Nobody owns this seam today.

**Evidence:** `Designs/media-library/media-infrastructure.md:52 (MEDIA-02), :76, :119` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md §0 lines 12-20; §4 lines 306-326; §5.1 lines 340-346; :494-505` · `Designs/efsv2/core-architecture-candidate.md:274-279; system-constitution.md:180-181` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:940-963` · `Designs/media-library/query-and-indexing.md:95; Designs/web-client-os/mvp-and-acceptance.md:143`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R7b-stageA-b0-indexes-le-11, S3-media-x-types-x-index-09

### PRD-37 — Whether PackageHandoff has semantic Record identity is open on both sides and tracked by neither

**Owner:** `open-web-app-store` · **Neighbours:** `web-client-os`, `efsv2` · **Severity:** minor · not on the MVP path

The 2026-08-22 fixture README:65 and its limits list say 'Whether a handoff needs semantic Record identity remains open' and that 'the product design has not decided that PackageHandoff needs stable semantic identity', and it forbids promoting its snapshot-Record modeling (:213-216). Designs/web-client-os/system-profiles-and-generations.md:243-244 says 'A PackageHandoff may transport those facts but is not itself assumed to have semantic identity', and its SystemResolutionReceipt (:233-239) can only reference package receipts 'or digest only after the package owner defines canonical receipt bytes'. architecture.md §Runtime-neutral handoff (525-554) and §Open questions (965-990) never state whether the handoff is a Record. The OS receipt format cannot freeze until the store answers, and the question sits in no inbox.

**Evidence:** `Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md:65, :213-216` · `Designs/web-client-os/system-profiles-and-generations.md:233-246` · `Designs/open-web-app-store/architecture.md:525-554, :965-990`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R12-open-web-app-store-11

### PRO-54 — The Devcon demo is unlocked and rests on v1 evidence the ruling calls disposable

**Owner:** `owner` · **Neighbours:** `arcade`, `efsv2`, `vault-process` · **Severity:** minor · not on the MVP path

Devcon/README.md (2026-08-11) records a submitted proposal "using live EFS on Sepolia and its independently reproducible proof as the case study" and says "v1 is live Sepolia evidence; v2 and the cypherpunk OS remain active design work unless their status changes before the talk". Milestones.md §Devcon presentation (2026-11) says "Hard requirements — None locked. James will add them when the v2 research and implementation shape are concrete enough", with speaker decisions expected by end of September, while its §Current inputs still names Designs/clientv2/README.md as the Client v2 design set. This is properly owned by James and gated on acceptance, but (inference) on current sequencing no v2 artifact will exist by November; the "independently reproducible proof" rests on v1 facts the brief marks unverified and Decisions.md 2026-08-08 calls "disposable"; and the Sepolia-permanence wording it would need is held in Arcade D7 rather than owned by V2-E5/E7.

**Evidence:** `Devcon/README.md:§Submitted application (Thesis); §After submission (boundary and single-point-of-failure rules)` · `Milestones.md:§Devcon presentation (2026-11) 'Hard requirements — None locked'; §Current inputs` · `Decisions.md:2026-08-08 ('The current owner-authored v1 data is disposable')` · `Designs/arcade/owner-decision-inbox.md:D7 (held)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S13-never-decided-24

### CLI-34 — INTERACTIVE-versus-GATE read context and policy-source disclosure dropped without disposition

**Owner:** `web-client-os` · **Neighbours:** `efsv2`, `efs15` · **Severity:** minor · MVP-relevant

Designs/efs15/requirements-and-boundaries.md §R12 bullets 5-6 required every read result to carry "whether the result is for interactive display or a security gate; and the source of the policy/lens used for that gate", and Reviews/2026-08-07-efs-v2-to-15-corpus/v2-disposition-ledger.md §Cheap seams kept INTERACTIVE versus GATE as a cheap seam. Designs/efsv2/system-constitution.md §Lenses for contracts and people carries the risk-bearer rule ("The party bearing risk selects or approves the Lens") and completeness/basis fields, but the spine has zero hits for an INTERACTIVE/GATE read-context flag, and Designs/efsv2/owner-decision-inbox.md §LP-6 keeps "the GATE profile's hard rules" only as "pressure evidence". For a Web Client that both displays and gates (installs, artifact runs), the flag is the difference between a display read and an authorization read.

**Evidence:** `Designs/efs15/requirements-and-boundaries.md:§R12 bullets 5-6` · `Reviews/2026-08-07-efs-v2-to-15-corpus/v2-disposition-ledger.md:§Cheap seams row 'Minimal read context'` · `Designs/efsv2/system-constitution.md:§Lenses for contracts and people bullet 4` · `Designs/efsv2/owner-decision-inbox.md:§LP-6`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R15-efs15-evidence-07

### CLI-37 — HEALTHY has no criterion or time bound in the activation protocol

**Owner:** `web-client-os` · **Neighbours:** `clientv2` · **Severity:** minor · not on the MVP path

July defined the health gate concretely: the Session Shell must call health.markSessionHealthy() within 20 s of the Kernel handshake plus first composited frame, three or more crashes in 10 minutes triggers Rescue, and failure boots N-1 (Designs/clientv2/shell-and-sessions.md:103-108; boot-and-profiles.md:132). The spine retains and strengthens the mechanism (system-profiles-and-generations.md:525-585: STAGED -> PREFLIGHT_PASSED -> COMMIT_PENDING -> BOOTING -> HEALTHY / POST_START_FAILED_ROLLED_BACK, CAS restore, ActivationHealthLease; mvp-and-acceptance.md §G lines 587-611) but defines HEALTHY only as "a successful host-check transaction" with no stated check, timeout or crash-loop rule. Not MVP-blocking, since Service Worker dependence is deferred (mvp-and-acceptance.md:90-94), but the offline-shell fixture cannot be written without it.

**Evidence:** `Designs/clientv2/shell-and-sessions.md:103-108; Designs/clientv2/boot-and-profiles.md:132` · `Designs/web-client-os/system-profiles-and-generations.md:525-585` · `Designs/web-client-os/mvp-and-acceptance.md:90-94; :587-611`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R11a-clientv2-thesis-ker-13

### CLI-39 — Whether srcdoc is an admitted construction mechanism is open on both sides

**Owner:** `web-client-os` · **Neighbours:** `arcade`, `open-web-app-store` · **Severity:** minor · not on the MVP path

Arcade mounts srcDoc={verifiedBytes} (Designs/arcade/player-security-model.md:39), while the runtime requires "verified closure-backed resource URLs or an immutable virtual mount", records the construction/CSP/blob mechanism in RunnerRealization, and lists srcdoc among unmeasured resource models in its research queue (app-runtime-and-direct-launch.md:605, :622-623, :1022-1025); the Store defers opaque-origin and sandbox behaviour to the runtime (Designs/open-web-app-store/architecture.md:500). The measured rig used srcdoc (browser-runner-measurements.md:155), so one data point exists. For one 45 KB file srcdoc may be the simplest immutable mount, but no document says so. Repair: the runtime names srcdoc-of-verified-bytes as an admitted single-document realization with navigation and fullscreen policy, or rules it out, and Arcade follows.

**Evidence:** `Designs/arcade/player-security-model.md:39` · `Designs/web-client-os/app-runtime-and-direct-launch.md:605, :622-623, :1022-1025` · `Designs/open-web-app-store/architecture.md:500` · `Reviews/2026-08-13-claude-evidence-round/corpus/runner/browser-runner-measurements.md:155`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S2-arcade-x-appstore-x-r-11

### CLI-43 — Web Client versus OS packaging answered by the product set but never fed back

**Owner:** `web-client-os` · **Neighbours:** `efsv2`, `owner` · **Severity:** minor · not on the MVP path

Designs/efsv2/owner-rulings.md §2026-08-12 lists under "Open, not ruled" whether "the direct Web Client and EFS OS are one package or distinct products", and V2-E6 carries "how it is packaged relative to EFS OS". The client set's working answer — "one layered, versioned module graph with several boot profiles, not ... two independently implemented products" (web-client-os/README.md §Current recommendation) and "one Web platform workspace with separately buildable entrypoints ... apps/webclient/ ... apps/os/ added only with an authorized OS slice" (architecture-and-modules.md:1146-1157) — is never fed back to V2-E6 or ratified. Not MVP-blocking, since the MVP is the webclient entrypoint either way.

**Evidence:** `Designs/efsv2/owner-rulings.md:§2026-08-12 'Open, not ruled'` · `Designs/efsv2/owner-decision-inbox.md:§V2-E6` · `Designs/web-client-os/README.md:§Current recommendation` · `Designs/web-client-os/architecture-and-modules.md:1146-1157`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S13-never-decided-21

## DRIFT — the owner decided and one or more documents still say otherwise

### PRO-01 — Twenty-eight owner directions live only in a draft README, outside every ledger

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `web-client-os`, `owner` · **Severity:** blocking · blocks the MVP

Designs/web-client-os/README.md §"Direct owner direction recorded for this round" (lines 35-170) records 28 requirements "supplied directly by James from 2026-08-14 through 2026-08-23" with no "— ruled by @james, date" marker and no per-item dates, inside a #status/draft doc that says they "do not freeze protocol bytes or bypass the normal design promotion ceremony". Onboarding/authority.md §Recording a ruling requires rulings in Designs/<folder>/owner-rulings.md or Decisions.md — "never both" — and James's own 2026-07-16 META direction (owner-rulings.md line 101) demands "ALL owner decisions in ONE canonical place going forward"; yet Designs/efsv2/owner-rulings.md is last touched 2026-08-12 and still reads "Open, not ruled: whether every author-facing API uses PrincipalId" (lines 216-219), and Decisions.md's last entry is 2026-08-13. The folder has neither owner-decision-inbox.md nor owner-rulings.md, so scripts/open-decisions.sh (queues discovered via find -name owner-decision-inbox.md) and Open-Decisions.md cannot see the set, and Onboarding/authority.md's scope list stops at designs/clientv2. Directions 2 (write-capable MVP), 7 (uniform PrincipalId), 8 (64-entry Lens), 9 (NFC names) and 10 (Sepolia dev Commons) bind Core, but system-constitution.md lines 337 and 358-359 still ask whether the first client writes and whether uniform PrincipalId beats tagged, V2-E6 still says "Then decide whether the first Web Client also needs writes", and hierarchical-files-and-folders.md L121-125 still calls uniform PrincipalId "the current V2-E1 experiment arm, not owner law". The README's own "Upstream synchronization note (2026-08-14)" admits the gap and claims "The EFS v2 PM has the exact reconciliation handoff" — a document that does not exist (grep hits only that line) — while the spine's pre-promotion checklist (lines 552-554) requires every requirement to "trace to owner direction", which is untraceable through the vault's ruling process today. The same recording failure swallowed the 2026-07-25 KEL frame that Decisions.md L37 says "the design thread ratifies … into Designs/efsv2/owner-rulings.md" (no 2026-07-25 section exists).

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Same finding, with two changes. Drop the clause "Onboarding/authority.md's scope list stops at designs/clientv2" — @james holds `*` scope, so the 28 directions are validly authorized; the defect is solely that they are recorded in a `#status/draft` README instead of a ruling ledger, and dropping the clause keeps the finding from being dismissed on it. Add the branch evidence, which strengthens rather than resolves it: `readiness:Designs/efsv2/owner-rulings.md` still ends at 2026-08-12, so no branch fixes the cause; the branch does delete the downstream symptoms (system-constitution's "Does the first Web Client ship only read-only Files plus one Arcade view, or also explicit writes?" is gone, and V2-E6 is replaced by V2-C2) but V2-C2 then names "the direct no-wallet raw Data Explorer plus the minimum Files profile" as the first vertical (readiness:Designs/efsv2/owner-decision-inbox.md:79-85) — a *no-wallet* first product, silently diverging from direction 2's write-capable File Browser. That is exactly the failure mode of unrecorded direction: a lane restates the MVP without the direction visible to contradict it. Repair remains one ledger entry: transcribe the 28 directions into Designs/efsv2/owner-rulings.md (or Decisions.md, never both) with dates and `— ruled by @james`, create Designs/web-client-os/owner-decision-inbox.md so scripts/open-decisions.sh can see the set, and either produce the promised reconciliation handoff or delete the sentence claiming it exists.

**Evidence:** `Designs/web-client-os/README.md:35-39, 61-71, 78-80, 333-339, 552-554` · `Onboarding/authority.md:§Recording a ruling; §Scopes` · `AGENTS.md:§Finding the owner's needed design decisions` · `Designs/efsv2/owner-rulings.md:101, 216-219 (last entry 2026-08-12)` · `Decisions.md:19-25, L37` · `Designs/efsv2/system-constitution.md:22-31, 337, 358-359` · `Designs/efsv2/owner-decision-inbox.md:§V2-E1 (17-24), §V2-E6, §Recording rule` · `Designs/efsv2/hierarchical-files-and-folders.md:121-125` · `scripts/open-decisions.sh:QUEUES=$(find … -name 'owner-decision-inbox.md')` · `Open-Decisions.md:3-8, 80-82`

**Verified:** text confirmed (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R19-process-rulings-ledg-02, R8-wco-product-mvp-priva-02, R10-wco-technology-stand-05, R11a-clientv2-thesis-ker-01, R4-efsv2-identity-lens-p-02, S13-never-decided-15, R6-stageA-overview-04

### PRD-01 — Arcade and efsv2 still route the iframe compat-runner ruling to the retired clientv2 kernel

**Owner:** `arcade` · **Neighbours:** `efsv2`, `web-client-os`, `clientv2` · **Severity:** important · MVP-relevant

Designs/arcade/player-security-model.md:16 says the runner is 'NOT a v2 Ring-3 app' and that the clientv2 kernel's 'no iframe-hosted app logic' rule is 'routed to the v2 pressure report ... not decided here'; v2-pressure-and-migration.md:40 and :63-67 grade the sandboxed-iframe runner 'MISSING (at the ruling level)' with its open question at :108 asking the '[[kernel-capability-model]] owner' to rule; Designs/efsv2/playable-archive-requirements.md:168 and :270 (PAF-5) still ask v2 to 'either approve this isolated compatibility lane explicitly or defer legacy-direct launch'. Owner direction #26 (Designs/web-client-os/README.md:150-155) already states 'opaque iframes remain the full-DOM lane', README.md:386 retires 'Fixed rings and one mandatory runner/cage set', and app-runtime-and-direct-launch.md:29-30, :441-448 define the opaque-origin iframe lane covering 'games, legacy HTML'. Designs/clientv2/README.md:8-16 marks the kernel doc as evidence, not adopted architecture, so the routing target no longer exists and client-os-pressure-report never received the question. The one-game slice runs in exactly this lane, and three current-lane documents still record its governing decision as open.

**Evidence:** `Designs/arcade/player-security-model.md:16` · `Designs/arcade/v2-pressure-and-migration.md:40, :63-67, :108` · `Designs/efsv2/playable-archive-requirements.md:168, :270 (PAF-5)` · `Designs/web-client-os/README.md:150-155 (direction 26), :386` · `Designs/web-client-os/app-runtime-and-direct-launch.md:29-30, :441-448` · `Designs/clientv2/README.md:8-16; Designs/arcade/README.md:54`

**Verified:** not separately verified; clustered from 4 independent lane findings · **Source lanes:** R9-wco-architecture-runt-05, R11a-clientv2-thesis-ker-04, R5-efsv2-context-require-05, R14-arcade-03

### PRD-02 — v2-pressure-and-migration.md routes most of its findings to superseded or historical owners

**Owner:** `arcade` · **Neighbours:** `clientv2`, `efsv2`, `open-web-app-store`, `web-client-os`, `sdk` · **Severity:** important · MVP-relevant

Its Depends-on line (:5) names playable-archive-requirements, apps-cookbook, boot-and-profiles, packages-and-updates, kernel-capability-model and deterministic-ids; the first two clientv2 docs carry 'Historical July 2026 research corpus; not active architecture' banners, kernel-capability-model is clientv2 evidence (clientv2/README.md:8-16), and deterministic-ids is 'superseded as an automatic baseline' (efsv2/README.md:106). Seven of nine routes are dead: §2a (:51-55) to deterministic-ids + efs-v2-transition-plan whose premise Decisions.md:23 voids; :46 grades the single-file profile 'ADAPTER -> COVERED - Deliberately the degenerate case of v2's closure manifest ([[packages-and-updates]] §3, PAF-2)' and :101 blocks the folder lane on 'the closure-manifest/serving-topology decisions' although web-client-os/README.md:387 rules 'Replace at the generic boundary - Consume the Open Web App Store's runtime-neutral PackageHandoff' and open-web-app-store/README.md:97-103 calls the July DATA/PIN/TAG/LIST mechanics 'not current'; §2f (:81-83) routes the verify choke point to the v1 SDK 'arcade-pin patch' after Kanban.md:62 stopped v1 SDK work; §2h to a 2026-07-07 report; §2i (:93-95) to N5, superseded at efsv2/owner-decision-inbox.md:267-270. The 2026-08-12 banner (:12-16) says Arcade 'now targets EFS 2.0 Core' but nothing below it was re-routed, and the doc never uses B0, ArtifactRelease/1, ArtifactClosure, PackageHandoff or RunnerRealization. Arcade is held, so harm is bounded - but this doc is the first thing the promised recut will read.

**Evidence:** `Designs/arcade/v2-pressure-and-migration.md:5, :12-16, :46, :51-95, :101` · `Designs/clientv2/boot-and-profiles.md, packages-and-updates.md (historical banners)` · `Designs/efsv2/README.md:106; owner-decision-inbox.md:267-270` · `Designs/web-client-os/README.md:386-387` · `Designs/open-web-app-store/README.md:97-103` · `Kanban.md:62; Decisions.md:23`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R14-arcade-06, R11b-clientv2-packages-w-06, S2-arcade-x-appstore-x-r-04

### CLI-09 — clientv2 hold's premise false since 2026-08-14; most held items answered by directions

**Owner:** `clientv2` · **Neighbours:** `web-client-os`, `vault-process`, `owner` · **Severity:** important · MVP-relevant

Designs/clientv2/owner-decision-inbox.md (Last reconciled 2026-08-12, lines 10-14) holds on the premise that "no July client/OS question is currently answerable; recut only after direct guest Files/Arcade and Core-reader evidence creates a real product fork" and says "Do not revive N2, OS1/OS2, E7/E8, L1-L7, or CL1/CL2". The direct owner directions of 2026-08-14 to 2026-08-23 answer most of them: direction 3 answers N2 (BIOS -> Kernel -> Shell -> Apps preserved, route-shaped, not mandatory full-OS, README.md:48-51); direction 6 answers OS2 (agents first-class, :58-60); directions 26/23/14/18 answer E7/E8 (SES-in-Worker leading candidate, opaque iframe full-DOM lane, native Web Components as the Shell/Files path, with the declarative Surface-IR retired at README.md:396); direction 19 answers L1 update trust (:107-116), recorded the same day in Daily Notes/agent-status.md 2026-08-14 line 215 ("Recorded James's opt-in stable-origin release direction"); direction 17 answers L7 translation ("foundations from the first slice, not post-launch translation work", :150-155); and system-profiles-and-generations.md:1160-1162 answers the REVOKED-closure boot posture left open at clientv2/open-questions.md:23. Only L4 monitoring, L5 product name, parts of L3/L6 endpoint defaults and CL1/CL2 (whose text no longer exists in the inbox, line 14) remain. Open-Decisions.md lines 21 and 74 still show clientv2 as HELD with 0 items, so the vault's live queue misrepresents the state; the hold can be closed or recut rather than kept.

**Evidence:** `Designs/clientv2/owner-decision-inbox.md:10-14 (opening blockquote, 'Do not revive N2, OS1/OS2, E7/E8, L1-L7, or CL1/CL2'); :16-47` · `Designs/web-client-os/README.md:48-51 (dir 3), :58-60 (dir 6), :107-116 (dir 19), :132-137 (dir 23), :150-155 (dir 17), :396 (Surface-IR retired)` · `Designs/web-client-os/system-profiles-and-generations.md:1160-1162; Designs/clientv2/open-questions.md:23` · `Daily Notes/agent-status.md:2026-08-14 line 215` · `Open-Decisions.md:21, :74 (clientv2 HELD, 0 items)`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R19-process-rulings-ledg-07, R11a-clientv2-thesis-ker-02

### CLI-10 — Most clientv2 files lack the historical banner; un-bannered docs cited as live rules

**Owner:** `clientv2` · **Neighbours:** `vault-process`, `web-client-os`, `arcade`, `efsv2` · **Severity:** important · MVP-relevant

The 2026-08-15 banner "Historical July 2026 research corpus; not active architecture" is present in only six of 22 clientv2 files (web-os-thesis.md:12, boot-and-profiles, packages-and-updates, network-privacy, agent-native, agent-native-os-compass-for-fable) and missing from kernel-capability-model.md (line 12 "This is THE component/capability architecture doc"), shell-and-sessions.md:12, system-surfaces.md:12, open-questions.md, threat-model.md (line 10 "THE consolidated threat model for client v2"), wallet-and-actions.md, persistence-and-sync.md, locale-and-accessibility.md, sdk-boundaries.md, file-browser-requirements.md, fable-third-party-app-model-handoff.md and research-digest.md. The omission is load-bearing twice over. Un-bannered docs are cited as live rulings elsewhere: Designs/arcade/v2-pressure-and-migration.md:65 and Designs/efsv2/playable-archive-requirements.md:168 both cite kernel-capability-model.md. And two un-bannered docs state rules the owner has since reversed: threat-model.md:192 (CONF-SC3 "never satisfiable by an agent alone") and :244, plus wallet-and-actions.md:183, contradict direction 6 (web-client-os/README.md:58-60), the audit row at README.md:394 ("not a permanent ban on explicitly delegated agent workflows") and mvp-and-acceptance.md:473-474; wallet-and-actions.md:23,29 ("no ERC-1271, ever") contradicts mvp-and-acceptance.md:101-103 and ethereum-standards-and-interop.md:201 ("Design for; MVP claim fixture-gated"). The folder README is the only guard, and it says "Everything remains #status/draft" (clientv2/README.md:80) while owner-decision-inbox.md:8 is #status/reference per Decisions.md:29.

**Evidence:** `Designs/clientv2/web-os-thesis.md:12 (banner present); kernel-capability-model.md:6-14; shell-and-sessions.md:6-14; system-surfaces.md:6-14 (banner absent)` · `Designs/clientv2/threat-model.md:10, 192 (CONF-SC3), 244; Designs/clientv2/wallet-and-actions.md:23, 29 ('no ERC-1271, ever'), 183` · `Designs/web-client-os/README.md:58-60 (direction 6), :394 (audit row)` · `Designs/web-client-os/mvp-and-acceptance.md:101-103, 473-474; Designs/web-client-os/ethereum-standards-and-interop.md:201` · `Designs/arcade/v2-pressure-and-migration.md:65; Designs/efsv2/playable-archive-requirements.md:168 (both cite kernel-capability-model as a live ruling)` · `Designs/clientv2/README.md:8-16, :80; Designs/clientv2/owner-decision-inbox.md:8; Decisions.md:29`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R11a-clientv2-thesis-ker-10, R11b-clientv2-packages-w-02

### CORE-11 — Owner directions of 2026-08-14 to 08-23 never entered the rulings ledger; the spine still poses answered questions

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner`, `vault-process` · **Severity:** important · MVP-relevant

web-client-os/README.md §'Direct owner direction recorded for this round' carries owner directions 1-28 dated 2026-08-14 to 08-23, including 2 (write-capable File Browser MVP), 3 (BIOS->Kernel->Shell->Apps), 7 (uniform PrincipalId), 8 (64-Principal Lens), 9 (rich Unicode names), 10 (Sepolia), 11 (repositories) and 12 (Type axis). owner-rulings.md -- which the 2026-07-16 META ruling made the one canonical place for ALL owner decisions -- ends at 2026-08-12, and git log shows no commit to system-constitution.md, core-architecture-candidate.md, owner-rulings.md or owner-decision-inbox.md after the 2026-08-13 import c48f252. So the Core spine still asks what the owner answered: constitution:358-359 'Does the first Web Client ship only read-only Files plus one Arcade view, or also explicit writes?'; V2-E6 (:54-60) 'Then decide whether the first Web Client also needs writes'; README build order step 6 (:125-127) describes a read slice plus an Arcade view; owner-rulings.md:216-219 still lists as 'Open, not ruled' whether author-facing APIs use PrincipalId and whether Web Client and OS are one package, while the client set states the opposite as 'Owner-adopted EFS-wide inputs' and V2-E1 says the uniform surface 'is not frozen until the comparison proves it honest and simpler'. web-client-os/README.md:333-339 admits the lag and says 'The EFS v2 PM has the exact reconciliation handoff'; no such handoff exists anywhere in the vault (grep). An engineer reading Designs/efsv2 builds a read slice with an Arcade view while one reading Designs/web-client-os builds writes, and Open-Decisions.md still shows V2-E6 as waiting on evidence.

**Evidence:** `Designs/web-client-os/README.md:§Direct owner direction items 2, 7, 8, 10, 11, 12 (lines 43-103); §Authority map 'Upstream synchronization note (2026-08-14)' lines 331-339` · `Designs/efsv2/owner-rulings.md:2026-07-16 §META (one canonical place); last entry 2026-08-12; lines 216-219 'Open, not ruled'` · `Designs/efsv2/system-constitution.md:358-359; Designs/efsv2/owner-decision-inbox.md:§V2-E6 lines 54-60; §V2-E1` · `Designs/efsv2/README.md:§Build order step 6 lines 125-127; Designs/efsv2/core-architecture-candidate.md:410` · `git log --since=2026-08-13 -- Designs/efsv2/{system-constitution,core-architecture-candidate,owner-rulings,owner-decision-inbox}.md -> c48f252 only` · `Designs/web-client-os/product-constitution-and-roadmap.md:WCOS-R14 line 157; Open-Decisions.md:52`

**Verified:** not separately verified; clustered from 7 independent lane findings · **Source lanes:** R1-efsv2-spine-01, R8-wco-product-mvp-priva-01, R9-wco-architecture-runt-06, R11a-clientv2-thesis-ker-03, R2-efsv2-types-ids-oncha-14, J1-mvp-first-10, R19-process-rulings-ledg-03

### CORE-21 — DurabilityGrade/1 ranks chain history/DA above a funded pin, against owner ruling 16 and the 18.2-day blob window

**Owner:** `efsv2` · **Neighbours:** `media-library`, `open-web-app-store`, `web-client-os` · **Severity:** important · MVP-relevant

b0-content-locators.md §10.1 (:845-877) defines ordinal 3 'CHAIN_HISTORY - bytes rode a chain's history/DA, archival-grade' above FUNDED_PINNED=2 and BEST_EFFORT=1, justified only as weaker than ENDOWED ('CHAIN_HISTORY is inserted below ENDOWED because EIP-4444 partial history expiry is live'). Owner ruling 2026-07-15 item 16 (owner-rulings.md:66) grades calldata file bytes 'DA-tier, honestly graded @EPHEMERAL', large-file-uploads.md:67 already knew 'blob bytes prune in 18 days' and :81 reserves the blob tier, and the evidence round confirms blob-sidecar service is guaranteed only 4,096 epochs ~= 18.2 days after which bytes exist only at volunteer or commercial archives. One ordinal cannot describe both calldata history (served by default post-Merge) and blob DA, and through ArtifactRelease.custodyFloor (§9 828-833) a blob- or calldata-carried chunk could satisfy a release floor that an inspectable funded pin cannot. No current design places durable data in blobs (ethereum-standards-and-interop.md:445 'Negative evidence for durable storage'), so the drift bites only through this table -- but this table is the one place the vault currently answers 'where do bytes live', and the MVP byte-carrier decision will read it.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:§10.1 lines 845-877; §9 lines 828-833` · `Designs/efsv2/owner-rulings.md:2026-07-15 item 16 line 66 ('DA-tier, honestly graded @EPHEMERAL')` · `Designs/efsv2/large-file-uploads.md:67; §James rulings item 5 line 81` · `Reviews/2026-08-13-claude-evidence-round/README.md:164-169; CORRECTIONS.md:16` · `Designs/web-client-os/ethereum-standards-and-interop.md:445, 635; Designs/media-library/media-infrastructure.md:186-188`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R7b-stageA-b0-indexes-le-05, J2-cypherpunk-risk-first-04

### CORE-27 — The 2026-07-15 item F equivocation non-guarantee and challenge-window ruling is absent from the constitution and candidate

**Owner:** `efsv2` · **Neighbours:** `web-client-os` · **Severity:** important · MVP-relevant

owner-rulings.md 2026-07-15 item F (:51-54) is 'RULED - SIGN THE LIMITATION (Option 2)' with wording 'to ratify': 'on-chain gates use closed, trusted author sets; EFS does not guarantee contracts can detect equivocation, and contracts needing certainty against untrusted authors must use a challenge-window (delay + re-check) pattern.' Neither system-constitution.md nor core-architecture-candidate.md mentions equivocation, TOCTOU or a challenge window (grep). pm-stage-a-directive.md:24 instructs 'Preserve the equivocation/TOCTOU lesson and challenge-window safety requirement, while leaving exact collision-state mechanics unfrozen', and proposed-spine-edits.md A1 proposes restoring the attributed content (contradiction ledger row 6); nothing was applied. Because item F is a non-guarantee statement rather than a mechanism, the 2026-08-12 'mechanism-level rulings superseded' clause does not remove it -- the spine is missing an attributed owner ruling that directly shapes the contract Lens semantics the MVP needs.

**Evidence:** `Designs/efsv2/owner-rulings.md:2026-07-15 item F lines 51-54` · `Designs/efsv2/system-constitution.md:§Lenses for contracts and people (no equivocation text); core-architecture-candidate.md grep equivocation/TOCTOU/challenge window -> 0 hits` · `Reviews/2026-08-13-efs2-stage-a-corpus/pm-stage-a-directive.md:line 24` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:§A1; contradiction ledger row 6`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R1-efsv2-spine-07

### CORE-28 — The write-capable MVP was chosen against the 2026-07-22 sequencing ruling, with no support matrix and no superseded note

**Owner:** `efsv2` · **Neighbours:** `owner`, `web-client-os`, `vault-process`, `arcade` · **Severity:** important · MVP-relevant

owner-rulings.md §2026-07-22 (:121) says 'The contraction gate comes later. After the joined pass and comparable prototypes, reconcile the owner inbox, write the short constitution and explicit support matrix, and only then choose the MVP', reaffirmed by the 2026-07-23 correction. Comparable prototypes (Stage B) have not run and the support matrix was never written -- grep 'support matrix' hits only the ruling, ethereum-first-efs-and-os.md:344, and a Stage A proposed edit C9 that says 'fold into output 7 or retire'. Owner direction 2 (2026-08-14) nonetheless chose a write-capable File Browser; the 2026-07-23 correction permits voluntary isolated answers, but no document records the 07-22 sequencing as satisfied or superseded. The consequence compounds the ledger gap: the Core spine still asks the question the direction answered (constitution:358, V2-E6, README build order step 6), and web-client-os/README.md:333-339 points at a reconciliation handoff that does not exist. Either the sequencing ruling is formally superseded in the ledger or the matrix is written; leaving both undone means the MVP rests on an unrecorded override.

**Evidence:** `Designs/efsv2/owner-rulings.md:§2026-07-22 line 121; §2026-07-23 CORRECTION` · `grep 'support matrix' -> Designs/efsv2/ethereum-first-efs-and-os.md:344 and Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:C9 only` · `Designs/web-client-os/README.md:§Direct owner direction item 2 (line 44); §Authority map lines 333-339` · `Designs/efsv2/system-constitution.md:line 358; Designs/efsv2/owner-decision-inbox.md:§V2-E6 lines 54-60; Designs/efsv2/README.md:§Build order step 6`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R19-process-rulings-ledg-01, J3-adoption-first-11

### CORE-40 — playable-archive-requirements.md is the load-bearing Arcade dependency but is un-bannered July text contradicting the inbox

**Owner:** `efsv2` · **Neighbours:** `arcade`, `clientv2`, `web-client-os` · **Severity:** important · MVP-relevant

Eight of eleven arcade docs list [[playable-archive-requirements]] as Depends-on and cite PAF-2/3/4/5/7 throughout, but the doc (Designs/efsv2/playable-archive-requirements.md, dated 2026-07-23) carries no greenfield banner, depends on ../clientv2/{packages-and-updates, kernel-capability-model, shell-and-sessions, persistence-and-sync} which are all historical, and states 'Owner status: [[owner-decision-inbox]] N5 remains undecided' (:18) while Designs/efsv2/owner-decision-inbox.md:267-270 says 'N5 ... Superseded as a single flagship choice'. It also keeps PAF-5's compat-runner question open (:168, :270) although app-runtime-and-direct-launch.md:441-448 answers it, and it is absent from the efsv2 README evidence map (:95-111). The stale N5 claim is then repeated downstream in product-and-communities.md:25, v2-pressure-and-migration.md:27 and :95, and arcade/owner-decision-inbox.md:70.

**Evidence:** `Designs/efsv2/playable-archive-requirements.md:1-10, 18, 168, 270` · `Designs/efsv2/owner-decision-inbox.md:267-270 ('N5 ... Superseded as a single flagship choice')` · `Designs/efsv2/README.md:95-111 (evidence map, doc absent)` · `Designs/arcade/product-and-communities.md:25; v2-pressure-and-migration.md:27, 95; Designs/web-client-os/app-runtime-and-direct-launch.md:441-448`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R14-arcade-15

### CORE2-10 — mountable-filesystem-semantics is cited as the adopted mount outcome but is mostly superseded July text

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `media-library`, `clientv2`, `owner` · **Severity:** important · not on the MVP path

`Designs/efsv2/README.md`:102 presents `mountable-filesystem-semantics.md` unqualified as 'Adopted three-host read-only outcome and projection acceptance gates', but the doc is #status/draft dated 2026-07-22, depends on `[[fs-pass-synthesis]]`, `[[codex-kinds]]`, `[[read-lens-spec]]` (line 5), and its §2 table (117-134) still maps 'Directory | TAGDEF structural namespace node' with union via PRIORITY_FIRST_PRESENT plus WHITEOUT while §3.3 (191-205) builds on path-derived TAGDEF identity and movedTo. `hierarchical-files-and-folders.md` line 9 explicitly supersedes 'the July path-derived TAGDEF, redirect/moved-to, global whiteout-object, and DATA/file-hybrid mechanisms' while keeping only the adopted outcome and tests, and answers the mount doc's open questions at lines 676 and 684 (§3.1:378, §2.2:208-209, §10:1704-1708/1778-1779 — whose grammar does not reject a leading '~'). The doc also still targets 'the selected Ethereum/EVM venue—potentially an L2 such as Base or Arbitrum' (lines 23, 586) against `owner-rulings.md` 2026-08-12 lines 193-197 ('No Commons home chain is selected') and web-client-os direction 10 (Sepolia first). Unlike `assumptions-and-requirements.md`, it received no correction banner separating the adopted parts (Primary validation target, §3.5, §4 contract, §10 profile items, §11-12 tests) from the superseded prose, so a reader cannot tell which half is live.

**Evidence:** `Designs/efsv2/mountable-filesystem-semantics.md:3-13, 23, 117-134, 191-205, 586, 670-700` · `Designs/efsv2/hierarchical-files-and-folders.md:line 9 (Supersedes); §3.1 378; §2.2 208-209; §10 1704-1708, 1778-1779` · `Designs/efsv2/README.md:102-103` · `Designs/efsv2/owner-rulings.md:106-114, 193-197` · `Designs/efsv2/assumptions-and-requirements.md (has a correction banner; contrast)`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R17-sdk-and-mounts-07, S6-sdk-and-mount-spread-09, R3-efsv2-files-13

### CORE2-25 — Layered Type proposal carries none of the 07-15 on-chain acceptance obligations

**Owner:** `efsv2` · **Neighbours:** `media-library`, `open-web-app-store` · **Severity:** important · not on the MVP path

`owner-rulings.md` 2026-08-12 lines 183-187 keep 'typed backlinks/reverse membership, revocation-aware current counts, content-digest lookup, authored-data enumeration, full state-readable Record bodies' as acceptance obligations. `layered-type-system-and-data-abi.md` has no revocation-aware count, no digest lookup, no author enumeration and no spine obligation (grep hits only the export-spine sentence at 918-921); its QueryProfile grammar `canonicalIndexSpecs` (line 393) is never enumerated and its Realm-activation rule ('explicit start, backfill, active/pending generation', 397-399) has no ABI or authority. `core-architecture-candidate.md`'s IndexSpec[] (274-279) also lacks a digest index and any counter, and only the unadopted Stage A chapter carries all of them (`b0-indexes.md` §2, §3.5, §6; `traceability.md` rows OR-A..OR-18 COVERED). If Architecture C wins the V2-E4 bakeoff the owner's own acceptance obligations have no home.

**Evidence:** `Designs/efsv2/owner-rulings.md:44-70, 183-187` · `Designs/efsv2/layered-type-system-and-data-abi.md:386-405, 918-921` · `Designs/efsv2/core-architecture-candidate.md:264-298` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:328-333, 900-960, 1414-1470` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:293-307`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R2-efsv2-types-ids-oncha-04

### CORE2-33 — Ledger and human overview still recommend a fixed authority domain the owner rejected

**Owner:** `efsv2` · **Neighbours:** `owner` · **Severity:** important · not on the MVP path

`assumptions-and-requirements.md` §9 Option B (337-353, 'Prototype Option B first'), §11 D-2 (413, 'Recommended first prototype'), §17 item 3 (634) and `human-overview.md` 1B (410) all recommend one fixed authority domain. `owner-rulings.md` 2026-08-12 (183-197) adopted 'a qualifying EVM Realm can stand alone; it does not ... revive a global home chain' and `owner-decision-inbox.md` P-2 (102-106) records 'Realm-qualified state and standalone Core are adopted' — the ledger's other option. The 08-12 banners say KEL homes are 'reopened' but never record that D-2 was answered in the opposite direction, so the ledger's recommendation still reads as live guidance to the next reader.

**Evidence:** `Designs/efsv2/assumptions-and-requirements.md:§9 Option B 337-353; §11 D-2 413; §17 634` · `Designs/efsv2/human-overview.md:§9 1B line 410` · `Designs/efsv2/owner-rulings.md:2026-08-12 lines 183-197` · `Designs/efsv2/owner-decision-inbox.md:P-2 lines 102-106`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R5-efsv2-context-require-01

### PRO-16 — MVP Principal: single-key in Core, multi-controller in the owner's directions

**Owner:** `efsv2` · **Neighbours:** `efsv2`, `web-client-os` · **Severity:** important · MVP-relevant

Direction 7 says "A Principal may have a mutable default/main controller account … JamesCarnley.eth may have three controller keys" and direction 8 says "Multiple controller keys do not consume multiple Lens positions; key authorization belongs inside Principal verification" (Designs/web-client-os/README.md lines 61-71). Stage A B0 has only AccountPrincipal/1, "an intrinsic zero-setup account Principal derived from an immutable authority reference" (core-architecture-candidate.md lines 236-241, which defers managed Principals to "later"), with account grading constant AUTH_OK (b0-overview.md SR-8) and the managed-Principal mechanism explicitly out of scope (b0-principal-authority.md §6 "Scope guard"); §6.3 lines 1308-1314 state "an ungraduated AccountPrincipal has no rotation — its authority reference is immutable", §6.1 line 1219 marks graduatePrincipal "RESERVED (not in B0)", and §4 rule 3 makes a 7702-delegated account authoring via ERC-1271 "a different Principal". In B0 three keys are therefore three PrincipalIds and three Lens entries, and FX-LENS benchmarks 64 single-key Principals; only the deferred managed-Principal design makes direction 8 true, and it is an open GAP — traceability.md defers the KEL round (C-AA-4, OR-2, OR-P, OR-R) and lists G-2 as a GAP, with no Kanban KEL/succession card. Meanwhile owner-rulings.md §2026-08-12 still lists PrincipalId as "Open, not ruled", V2-E1 (owner-decision-inbox.md lines 17-24, reconciled 2026-08-12) predates direction 7, and the MVP's own "EOA-only adapter must report ERC1271_UNSUPPORTED" silently makes it single-key without saying so — which also moots both product docs' open question about where a "mutable default/main account preference" is stored. Nobody has said whether the write MVP ships single-key Principals or makes the unowned KEL/succession round MVP-critical.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Fix the citation to: "`core-architecture-candidate.md` §Principal — lines 236-241 define the MVP candidate as 'an intrinsic zero-setup account Principal derived from an immutable authority reference' (`AccountPrincipal/1`), and line 253 defers the rest: 'Later managed Principals may add portable genesis, multiple actors, delegation…'." Everything else in the finding stands as written.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Owner direction 8 (Designs/web-client-os/README.md:69-71, 2026-08-14+) — "Multiple controller keys do not consume multiple Lens positions; key authorization belongs inside Principal verification" — has not reached the two artifacts that will test it. V2-E1 (owner-decision-inbox.md:17-24, last reconciled 2026-08-12) frames the Principal bakeoff without it, and the Stage A corpus predates it: core-architecture-candidate.md:236-241 has only `AccountPrincipal/1` with managed Principals "later", b0-principal-authority.md §6.1:1219 marks `graduatePrincipal` "RESERVED (not in B0)" and §6.3:1308-1314 states "an ungraduated `AccountPrincipal` has no rotation — its authority reference is immutable", so under B0 three controller keys are three PrincipalIds and three Lens entries. The FX-LENS grid therefore benchmarks `K_PLAN_N = {1, 8, 32, 64}` single-key Principals and cannot falsify or support direction 8. Fold directions 7 and 8 into V2-E1's comparison and into the FX-LENS/V2-E2 fixture before Stage B builds the benchmark; this is cheap now and expensive after the evidence is gathered. This does not block the MVP: mvp-and-acceptance.md:101-103 deliberately ships an EOA-only arm reporting `ERC1271_UNSUPPORTED`, and direction 10 keeps Sepolia development-only.

**Evidence:** `Designs/web-client-os/README.md:61-71 (directions 7, 8), 318-324` · `Designs/efsv2/core-architecture-candidate.md:§Principal 236-241 ('Later managed Principals')` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:§4 rule 3 1127-1131; §6.1 1219; §6.3 1308-1314; §6 Scope guard 1195-1197` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md:§2 SR-8, SR-13, SR-14` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:C-AA-4, OR-2, §7 G-2` · `Designs/efsv2/owner-rulings.md:216-219 ('Open, not ruled')` · `Designs/efsv2/owner-decision-inbox.md:17-24 (V2-E1)` · `Designs/web-client-os/mvp-and-acceptance.md:§Deliberately deferred (ERC1271_UNSUPPORTED); §Open questions item 4` · `Kanban.md: grep KEL/succession (no card); Open-Decisions.md:47`

**Re-classified in verification:** category UNDECIDED → DRIFT (materiality lens); severity blocking → important (materiality lens); owning set owner → efsv2 (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R6-stageA-overview-03, R7a-stageA-b0-ids-envelo-01, S13-never-decided-08, R8-wco-product-mvp-priva-18

### PRO-18 — The permanence promise is operator-conditional on a mortal venue class; nobody said so

**Owner:** `efsv2` · **Neighbours:** `efsv2`, `web-client-os`, `media-library`, `arcade`, `vault-process` · **Severity:** important · MVP-relevant

The unit of deployment is "a fresh qualifying L3" and "qualifying" is defined nowhere current (system-constitution.md lines 38, 60, 303, 353), while the evidence calls that class mortal: "safe for L1, arguable for the top L2s, and empirically false for L3s"; no surveyed L2 met a 30-day exit bar; AnyTrust L3s cannot reconstruct from parent DA; blob DA is guaranteed ~18.2 days; Polygon zkEVM frozen, Goerli dead, Holesky frozen — exactly the testnet/L3 class the design targets. Stage A's honest answer — persistence is "a named qualifying assumption per Realm … the Realm's operator asserts by deploying", and "no EFS promise survives its operator abandoning it. Deployment diligence, not protocol machinery, is the answer to Realm mortality" — is the unadopted spine edit A2, and the reconstruction walk "reconstructs state at the basis the RPC serves", with archive state "a bonus … never a requirement" (b0-realm-admission.md §8.2 lines 1821-1824). There is no dead-Realm export artifact anywhere current, so the no-elision "ETCH IT" promise, "independent reconstruction" (Designs/efsv2/README.md line 43) and every 50-year sentence are conditional on facts the constitution does not state. For a first user this is decisive: direction 10 makes Sepolia development-only, V2-E7 says "Do not select a chain yet" with no schedule, the efsv2 README Hard holds forbid any durable production seed before freeze, and the community research's TC-14 requires the publishing tool to say "public forever" before the first signature — so year-one adoption on a real venue is structurally impossible until V2-E5/E7/F1 close and no document says that plainly. The owner must answer the venue memo's three questions (Etched kernel on a mutable machine; reconstruct from venue state or from the parent after death; retain/scope/retire chains-don't-die) and the constitution must carry the answer.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Reword that sentence as: "Stage A's honest answer is split across two unadopted places — the B0 chapter itself calls persistence 'a named qualifying assumption per Realm' that 'the Realm's operator asserts by deploying' (`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md`:366, 379), and the proposed constitution text that would put it in the spine — 'A throwaway devnet or short-lived fork can run Core, but no EFS promise survives its operator abandoning it. Deployment diligence, not protocol machinery, is the answer to Realm mortality' — is spine edit A2 (`corpus/proposed-spine-edits.md`:120-137), which `STATUS.md`:46 records as unadopted along with every other Stage A proposal."

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

The constitution makes unconditional permanence claims while silently dropping the owner ruling they depend on. "Qualifying" carries the persistence assumption but is defined nowhere (system-constitution.md:38, 60, 303, 353), and grep for persist/dies/dead-chain/mortal across system-constitution.md and efsv2/README.md returns zero hits, so "independent reconstruction" (README.md:43) and the etched/no-elision language read as protocol guarantees rather than operator-conditional ones. Stage A already wrote the repair: proposed-spine-edits.md A2 supplies verbatim insert text — the persistence assumption is per-Realm, "no EFS promise survives its operator abandoning it. Deployment diligence, not protocol machinery, is the answer to Realm mortality", plus an `UNAVAILABLE_SOURCE_BASIS` cause code — and STATUS.md:46 records that no Stage A proposal is adopted. A2's own rationale confirms the 2026-07-10 chains-don't-die ruling "is carried nowhere in the spine", so restoring it (bullets 1 and 3) is an efsv2 spine edit needing no owner ask; only A2's second bullet, the per-Realm scope of that ruling, is James's. Do not attach a dead-Realm export artifact to this: the 2026-07-10 ruling explicitly dropped dead-chain survival machinery. Not MVP-blocking — direction 10 makes Sepolia development-only, efsv2/README.md §Hard holds bars any durable production seed pre-freeze, and V2-E7 plus arcade D7 already hold the venue question — but it becomes load-bearing the moment a production venue or a public permanence claim is made, and the unmerged sdkv2 branch raises the stakes (`sdkv2:Designs/sdkv2/owner-rulings.md` 2026-08-22 "century-preservation correction": a 100-year preservation horizon).

**Evidence:** `Designs/efsv2/system-constitution.md:38, 60, 303, 353; §Honest reads 214-216; grep persist|dies|sunset|dead-chain → no hits (2026-09-02)` · `Designs/efsv2/owner-rulings.md:§2026-07-10 10-17; §2026-08-12 184-187, 193-197` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:§4 358-380; §4.1 QR-1; §8.2 1821-1824` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:A2 110-168; STATUS.md:46 (no proposal adopted)` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/commons-realm-venue-matrix.md:§1 items 2, 3, 6, 7; §6 items 1-3` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:rows 'Blobs expire in 18 days, measured', 'Every L2 has no exit window', 'Polygon zkEVM'` · `Designs/web-client-os/README.md:§Direct owner direction item 10` · `Designs/efsv2/owner-decision-inbox.md:V2-E5 47-52; V2-E7 62-68` · `Reviews/2026-07-29-target-communities/requirements-and-first-apps.md:TC-14` · `Designs/efsv2/README.md:43; §Hard holds` · `Open-Decisions.md:8`

**Re-classified in verification:** category DIRECTION → DRIFT (materiality lens); severity blocking → important (materiality lens); owning set owner → efsv2 (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** J2-cypherpunk-risk-first-01, J3-adoption-first-08

### PRD-44 — GD-2 'wiki workspace is the first product' is overtaken by owner direction #2 and reconciled nowhere

**Owner:** `git-forge` · **Neighbours:** `web-client-os`, `efsv2`, `vault-process`, `owner` · **Severity:** important · MVP-relevant

Reviews/2026-08-07-efs-git-deep-dive.md §1 states that 'Git-backed Markdown/wiki workspaces on EFS... are the right first product' and §6 GD-2 proposes 'First proving workload and product target = the EFS Wiki workspace'; candidate-architectures.md §Recommendation line 66 repeats it. Owner direction #2 (web-client-os/README.md:42-47) says 'The first MVP must be an official write-capable File Browser' and the 2026-08-12 ruling requires the direct guest File Browser path (owner-rulings.md:211-215), while efsv2/owner-decision-inbox.md:88-93 (V2-F2) lists Git/Markdown only as a trace. Nothing records the change: owner-rulings.md:164 is the ledger's last Git sentence and still preserves wiki-first as the proving workload, the ledger ends 2026-08-12 while directions 1-28 live only in the web-client-os README, Decisions.md:33 (2026-07-29) still says 'The v1 product floor includes Git hosting' after the 2026-08-08 no-v1 ruling at Decisions.md:23, and Reviews/README.md:74 still advertises the wiki verdict as the pass's conclusion.

**Evidence:** `Reviews/2026-08-07-efs-git-deep-dive.md §1, §6 GD-2` · `Reviews/2026-08-07-efs-git-corpus/candidate-architectures.md §Recommendation line 66` · `Designs/web-client-os/README.md:42-47 (direction #2)` · `Designs/efsv2/owner-rulings.md:164, :211-215; owner-decision-inbox.md:88-93 (V2-F2)` · `Decisions.md:23, :33; Reviews/README.md:74`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R16-git-forge-05, S4-git-x-types-x-core-05

### PRD-46 — The Git corpus rests on the superseded July kernel with no greenfield banner; two of its binding constraints are reversed

**Owner:** `git-forge` · **Neighbours:** `efsv2`, `clientv2`, `vault-process` · **Severity:** important · MVP-relevant

The corpus maps every need onto the July 'five-kind tag-core + envelope + authority lane + lens family' (primitive-fit-gap.md §0, §2: 'Refs -> per-author cardinality-1 claims under (repoId, refName) key-anchor TAGDEFs... Nothing needs a sixth kind') and state-model.md §2/§4 relies on DATA salt identity, author-scoped slots, getSlot, priorClaimId, a genesis-pinned authorityHome and 'P-1 must be adopted'. The 2026-08-12 reset voids that substrate: owner-rulings.md:178-187 says the July kind table, envelope, KEL topology and fixed authority-home model must re-earn inclusion; owner-decision-inbox.md:96-100 marks P-1 'Superseded as a July KEL-specific mechanism packet' (only the ordinal survives as AdmissionReceipt.admissionOrdinal), :285-288 makes Q3 'historical issue inventory only', :208-211 says the LP-1 lens grammar is 'not inherited'; AMBIENT/1 and the G0-G3 guest ladder exist only in July lens docs (lens-spec.md:52 'owed - CR-3') and are absent from web-client-os (grep 0) while owner-rulings.md:211-215 redefines guest as 'unauthenticated, not network-anonymous'; '.efs-bundle' has zero hits in current docs; and P-G6 'Wiki page identity = EFS DATA identity + movedTo redirects' (requirements-ledger.md:125) is superseded by hierarchical-files-and-folders.md:9. Two self-imposed binding constraints are reversed outright: C-1 'Admission confluence: no admission check reads revocable state except the comparator' and C-4 'One actor witness authorizes an envelope; no msg.sender/relayer/1271 authorship' (requirements-ledger.md:45,48,90,93) versus admission-time CAS (core-architecture-candidate.md:223-228; system-constitution.md:153-156) and ERC-1271 authorship (:241-253; FX-GIT's ERC-1271 contributor, harness-and-fixtures.md:785-786) - and P-G3, P-G5, P-G8 rest on them. No corpus doc carries the 'Greenfield correction (2026-08-12)' banner that assumptions-and-requirements.md and clientv2/README.md received, while efsv2/README.md:109 still lists the deep dive as a current evidence input.

**Evidence:** `Reviews/2026-08-07-efs-git-corpus/primitive-fit-gap.md §0, §2, :21, :26, :44` · `Reviews/2026-08-07-efs-git-corpus/state-model.md §2, §4 (line 120); requirements-ledger.md:45, 48, 52, 90, 93, 105, 122, 125, 127` · `Designs/efsv2/owner-rulings.md:156-167, :178-187, :211-215` · `Designs/efsv2/owner-decision-inbox.md:96-100, :208-211, :227-229, :285-288` · `Designs/efsv2/core-architecture-candidate.md:223-228, :241-253; system-constitution.md:132-133, :153-156` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:785-786` · `Designs/efsv2/hierarchical-files-and-folders.md:9; lens-spec.md:52, :107` · `Designs/efsv2/README.md:109; Designs/clientv2/README.md:8-15`

**Verified:** not separately verified; clustered from 6 independent lane findings · **Source lanes:** R16-git-forge-01, S4-git-x-types-x-core-06, R16-git-forge-09, R16-git-forge-07, R16-git-forge-08, R11b-clientv2-packages-w-12

### PRO-05 — No repository for the first EFS 2.0 code; five documents name different containers

**Owner:** `owner` · **Neighbours:** `efsv2`, `web-client-os`, `vault-process`, `sdk` · **Severity:** important · MVP-relevant

Direction 11 (Designs/web-client-os/README.md lines 78-80) sets the end state — "rename legacy repos to *-v1 and reclaim contracts, sdk, webclient, and drive for active v2. No rename or repository creation is authorized in this pass" — but is recorded only in a draft README, never in Decisions.md. Four other documents name four other containers: Designs/efsv2/hierarchical-files-and-folders.md header line 5 ("Proposed new repos: core, os, drive; contracts/client remain legacy evidence"); docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md line 11 ("Create a new sibling repository, provisionally named core/"); Reviews/2026-08-13-efs2-stage-a-corpus/pm-stage-a-directive.md line 20 ("A later prototype may use a disposable contracts worktree/branch"); and Kanban.md line 19 ("Implementation repository is deliberately unchosen"). The client README's §Explicit non-authorizations simultaneously forbids "a new webclient, os, sdk, core, or drive repository". Per the brief no EFS 2.0 code exists in any repository, so Stage B cannot start until one container is named: the end state is decided-but-unrecorded (with DRIFT in the Files header), the first container is simply undecided.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Reclassify as DRIFT and retitle: 'The Files header and the core plan still propose repos core/os/drive after direction 11 chose reclaim-contracts/sdk/webclient/drive.' Drop Kanban.md:19 (ETHOnline card, different work) and the PM directive worktree line (compatible with direction 11) from the conflict list — the conflict is two-way, not five-way. Record direction 11 in Decisions.md, fix hierarchical-files-and-folders.md line 5, and fold the first-container pick into the PRO-04 authorization packet rather than tracking it as a separate blocker.

**Evidence:** `Designs/web-client-os/README.md:§Direct owner direction item 11 (78-80); §Explicit non-authorizations first bullet` · `Designs/efsv2/hierarchical-files-and-folders.md:header line 5 'Proposed new repos: core, os, drive'` · `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md:11-12, 45-49` · `Reviews/2026-08-13-efs2-stage-a-corpus/pm-stage-a-directive.md:20` · `Kanban.md:19` · `Decisions.md:2026-08 section (no repository entry, verified)`

**Re-classified in verification:** category UNDECIDED → DRIFT (materiality lens); severity blocking → important (materiality lens)

**Routing note from verification:** materiality lens: efsv2 + web-client-os (doc repair); owner only for the one-line container pick inside PRO-04

**Verified:** text confirmed (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** S13-never-decided-02, R6-stageA-overview-07

### SDK-02 — `sdk-v1-bridge-v2-compat-asks.md` still asks v2 for v1 compatibility the owner ruled out

**Owner:** `sdk` · **Severity:** important · MVP-relevant

**Category** DRIFT · **Owning set** sdk · **Severity** important · **MVP-relevant** yes
**Members** `R2-efsv2-types-ids-oncha-10`, `R15-efs15-evidence-01`, `R17-sdk-and-mounts-03`, `S6-sdk-and-mount-spread-07`
**Neighbours** vault-process, efsv2, owner `Designs/sdk-v1-bridge-v2-compat-asks.md` (`**Status:** review` / `#status/review`, Last touched 2026-08-07,
`#repo/planning #repo/sdk`) presents ten "ASKS on the v2 design" (:15): ask 1 "Commit a deterministic v1→v2
identity mapping … specialized to the nine Sepolia v1 schema UIDs, published in the Codex" and upgrade
`efs-v2-transition-plan` Phase 5 to a committed import rule (:19); ask 2 "Ratify the reserved-key names
verbatim" from codex-kernel's genesis manifest (:20); ask 3 admit the `f1220` contentHash convention (:21);
ask 4 "Freeze the identity-word shape taxonomy" (:22); ask 6 "Extend the v1 flat-lens import rule" (:24);
ask 8 seed freshness vocabulary from the v1 TrustDescriptor (:26); ask 9 "Keep the envelope stock-wallet-signable
through the KEL recut" (:27); plus "Pin the kernel read-ABI selector set early" (:25) and keeping all v2 logical
IDs `bytes32`. Its Open questions give ask 1 "a real deadline: before meaningful Nanda/Arcade data accumulates".
`Decisions.md`:23 (2026-08-08) rules "no v1 support, compatibility, migration, coexistence, or legacy-read
requirement"; `Designs/efsv2/README.md`:134 repeats it; `Designs/efsv2/owner-rulings.md`:178-187 (2026-08-12)
says the July kind table must re-earn inclusion. The doc carries no supersession banner, has **no row in
`Designs/README.md`** (grep "v1-bridge" → 0 hit

**Evidence:** `Decisions.md` · `Designs/README.md` · `Designs/efsv2/README.md` · `Designs/efsv2/owner-rulings.md` · `Designs/owner-decision-inbox.md` · `Designs/sdk-v1-bridge-v2-compat-asks.md` · `Retirements.md`

**Verified:** not separately verified · **Source lanes:** 

### SDK-03 — The pre-v2 SDK corpus never got the v1-profile labelling two separate items ordered

**Owner:** `sdk` · **Severity:** important · MVP-relevant

**Category** DRIFT · **Owning set** sdk · **Severity** important · **MVP-relevant** yes
**Members** `R17-sdk-and-mounts-04`, `R15-efs15-evidence-09`, `R5-efsv2-context-require-10`
**Neighbours** vault-process, efsv2 `Designs/owner-decision-inbox.md` §R1 re-cut (2026-08-08, :30): "What remains OWNER-level is only the corpus
LABELING: mark the pre-v2 SDK design docs as 'v1-profile design of record'"; the 2026-08-12 correction (:18-21)
then declared R1 "v1 packet history, not live choices". Nothing was applied. As of 2026-09-02
`sdk-architecture.md`, `sdk-read-surface.md`, `sdk-write-ux.md`, `sdk-wallet-architecture.md`,
`sdk-minimal-clicks.md`, `sdk-review-backlog.md`, `sdk-vs-client-responsibilities.md`, `efs-account-system.md`,
`mirror-scheme-policy.md` and `web3-standards-compliance.md` all still read `**Status:** review` with
`#status/review`, live v1/EAS content ("~13 dependent EAS attestations", refUID chains) and no banner; only
`sdk-one-signature-writes.md`:3 carries one, and it is superseded by another v1 doc. `sdk-architecture.md` still
ends its Open Questions with "One call left for James: promote vs. revise". `Designs/README.md`:79-86 marks some
rows "Historical", but the `sdk-read-surface` ("Read API shape"), `sdk-review-backlog` ("Reconciled build backlog")
and `sdk-vs-client-responsibilities` ("Boundary between SDK and client") rows carry no marker — and the files
themselves never say it either way. `Retirements.md` shows `pre-v2 SDK design corpus` cleared 2026-08-12, but
`needs-integration.sh` clears a row when the phrase reaches zero live hits, not when label

**Evidence:** `Designs/README.md` · `Designs/efsv2/client-os-pressure-report.md` · `Designs/owner-decision-inbox.md` · `Retirements.md` · `efs-account-system.md` · `mirror-scheme-policy.md` · `os-pass-handoff.md` · `owner-decision-inbox.md` · `sdk-architecture.md` · `sdk-minimal-clicks.md`

**Verified:** not separately verified · **Source lanes:** 

### PRO-06 — Two competing Stage B programs and three unrouted implementation plans, none authorized

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `web-client-os`, `sdk`, `owner` · **Severity:** important · MVP-relevant

Kanban.md lines 42-43 (In Flight, @fable/@codex-gpt-5, "expires 2026-08-16") says "next: execute disposable Stage B bytes/prototypes/measurements" per bakeoff-spec.md — 9 cells, 4 engines, corpus manifest and toolchain pin marked "Closed by: harness lane", a lane that has no card and no folder. In parallel three executable plans in docs/superpowers/plans/ (commit 02bdae9, 2026-08-14) prescribe different work: 2026-08-14-efs2-core-files-foundation.md creates ../core/ (Foundry, Solidity 0.8.34, Bun, Rust) with one monolith + FilesRouter + ERC-5219 adapter and no reference to any cell, axis or SIZE_6; 2026-08-14-efs2-files-sdk-web.md creates ../sdk/packages/v2/ plus ../os/; 2026-08-14-efs2-files-readonly-mounts.md creates a Rust ../drive/. Designs/web-client-os/README.md line 498 does not authorize "a new webclient, os, sdk, core, or drive repository" and direction 11 prescribes reclaiming legacy repos instead, while the branch SDK inbox (SDK-E2) says package topology is chosen only after logical boundaries are proved. The plans are linked from nowhere, sit outside Designs/ and outside the root README directory table (grep -rn 'superpowers/plans' → no vault references), so no script, content map, Kanban card, inbox or Decisions.md entry governs them — and the core plan's line 24 declares hierarchical-files-and-folders.md the "Governing draft", competing with the constitution's precedence order (system-constitution.md:22-34) under which core-architecture-candidate.md owns the object model and Files/1 is an application profile on it.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Two competing Stage B programs and three unrouted implementation plans, none authorized. Kanban.md:42-43 (In Flight, @fable/@codex-gpt-5, "expires 2026-08-16") says "next: execute disposable Stage B bytes/prototypes/measurements" per bakeoff-spec.md — 9 cells (~4 engines, line 826), with the corpus manifest and toolchain pin marked "Closed by: harness lane" (Open items 1-2, lines 935-939), a lane that has no card and no folder anywhere outside the Stage A corpus. In parallel three executable plans in docs/superpowers/plans/ (commit 02bdae9, 2026-08-14) prescribe different work: 2026-08-14-efs2-core-files-foundation.md creates ../core/ (Foundry, Solidity 0.8.34, Bun, Rust) with one monolith + FilesRouter + ERC-5219 adapter and no reference to any cell, axis or SIZE_6; 2026-08-14-efs2-files-sdk-web.md creates ../sdk/packages/v2/ plus ../os/; 2026-08-14-efs2-files-readonly-mounts.md creates a Rust ../drive/. Designs/web-client-os/README.md:498 does not authorize "a new webclient, os, sdk, core, or drive repository" and direction 11 (78-80) prescribes reclaiming legacy repos instead, while the branch SDK inbox (SDK-E2) says package topology is chosen only after logical boundaries are proved. The plans are linked from nowhere, sit outside Designs/ and outside the root README directory table (grep -rn 'superpowers/plans' → no vault references), so no script, content map, Kanban card, inbox or Decisions.md entry governs them — and the core plan's line 25 unilaterally names hierarchical-files-and-folders.md the "Governing draft", elevating one current candidate design above its peers when system-constitution.md:22-28 places every "current candidate design" at the same rank 4, below attributed rulings and promoted EFS 2.0 specifications. The readiness branch still carries all three plans unretired.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Reclassify as DRIFT (with a DEFECT component: the 4,707-byte Stage B claim, and the ../core/ creation instruction against README:498). Add that claim to the evidence. Restate severity as: not a start-gate, because it needs no owner ruling — but must clear before the first commit, since an agent handed V2-C1 YES would pick up an unrouted plan that names a demoted governing draft, a repo direction 11 contradicts, and a toolchain (Rust, Solidity 0.8.34) the readiness lane does not use.

**Evidence:** `Kanban.md:42-43` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/bakeoff-spec.md:Open items 1-2 ('Closed by: harness lane')` · `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md:7-20, 24, 32-33, 41-60` · `docs/superpowers/plans/2026-08-14-efs2-files-sdk-web.md:7-30 and Task 1 file list` · `docs/superpowers/plans/2026-08-14-efs2-files-readonly-mounts.md:7-30` · `Designs/web-client-os/README.md:78-80, 494-498` · `Designs/efsv2/system-constitution.md:22-34` · `GitHub Designs/sdkv2/owner-decision-inbox.md @4d3e736 §SDK-E2` · `README.md directory table (no docs/ entry); grep -rn 'superpowers/plans' → no vault references`

**Re-classified in verification:** category UNDECIDED → DRIFT (materiality lens); severity blocking → important (materiality lens)

**Routing note from verification:** materiality lens: vault-process (with efsv2 as doc owner)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R6-stageA-overview-06, R17-sdk-and-mounts-09, S7-efsv2-object-model-co-10

### PRO-39 — Five inconsistent sequencings of the one-game Arcade slice against the File Browser

**Owner:** `vault-process` · **Neighbours:** `web-client-os`, `efsv2`, `open-web-app-store`, `arcade`, `vault-process` · **Severity:** important · MVP-relevant

Direction 2 puts the write-capable File Browser first with guest reading independent; Designs/efsv2/owner-decision-inbox.md V2-E6 defines the slice as "a clean-browser direct guest File Browser plus one verified Arcade view behind an adapter … Then decide whether the first Web Client also needs writes" and Designs/efsv2/README.md build order step 6 says "in parallel", while system-constitution.md:358 still asks whether the first client ships read-only Files plus one Arcade view "or also explicit writes". The client set excludes "Arcade Play" from the MVP, requires that guest bundles contain no Arcade, puts Arcade detail/Play in the Near-term horizon, and gates the Arcade fixture "only after separate disposable-experiment authorization", third after SES and Wasm (mvp-and-acceptance.md:95-96, 514-515, 849; product-constitution-and-roadmap.md:247, 285-295; app-runtime-and-direct-launch.md:847-864). The Store adds a fourth order: the Arcade one-member fixture "begins only after the common identity mutation matrix and full-edition catalog reconstruction fixtures pass" (architecture.md:905-909). Arcade itself says the recut comes "before implementation or outreach" (not done; last commit 2026-08-13; Backlog card with no claim), while Kanban.md:19-20 recommends building the trace for ETHOnline Sept 4-16 and Owner-Inbox FJ-4 defaults to the one-game trace that ETHOnline-2026.md itself calls "the default, not an adopted scope ruling". Recommended ruling (proposal): a Core-level exact-artifact/tampered-primary/verified-fallback trace is a Stage B fixture that may accompany the File Browser and needs no runner; client-hosted Play follows the File Browser's Reader/Verifier and route parser; V2-E6 is reworded to direction 2; the store gate does not apply to a zero-dependency one-member trace.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Add to the finding: "A sixth ordering exists on the unmerged `origin/codex/v2-readiness-week` branch, which deletes V2-E6 from the queue entirely and replaces it with `readiness:Designs/efsv2/owner-decision-inbox.md`:79-85 V2-C2 — 'Use the direct no-wallet raw Data Explorer plus the minimum Files profile so Core, SDK, verified bytes, and a human-visible filesystem path are measured together' — a first vertical with no Arcade view at all, filed as a 'delegated candidate default' rather than an owner question. It is proposal-stage draft, invisible to `Open-Decisions.md`, and widens rather than settles the sequencing conflict." The title should read "Six inconsistent sequencings … (five on `main`, a sixth on the readiness branch)".

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Owner direction 2 settled the sequencing — "The first MVP must be an official write-capable File Browser, not a read product plus a substitute debug page … Guest reading remains independent of that path" (Designs/web-client-os/README.md:44-47) — and three current efsv2 documents still say otherwise: system-constitution.md:358 keeps the open question "Does the first Web Client ship only read-only Files plus one Arcade view, or also explicit writes?", owner-decision-inbox.md V2-E6 (:54-60) still defines the slice as a guest File Browser plus one Arcade view and "Then decide whether the first Web Client also needs writes", and efsv2/README.md:125-127 sequences the two "in parallel". Because V2-E6 is the item Open-Decisions.md surfaces to James, the owner-facing queue describes a slice the owner has already replaced. Reconcile V2-E6 and constitution:358 to direction 2 and note the supersession date; the client set already agrees (mvp-and-acceptance.md:95-96 defers Arcade Play, :514-515 bars Arcade from guest bundles). Do not count the Store as a conflicting order: open-web-app-store/architecture.md:907-909 says the program it gates "is not the product MVP", and its "Arcade one-member executable" (:913-915) is a Store conformance fixture, not the MVP's adapter-backed Arcade view. The only owner-sized residue is Owner-Inbox FJ-4 (ETHOnline entry, conservative cutoff September 3), which is urgent by date rather than by design incoherence.

**Evidence:** `Designs/web-client-os/README.md:44-47 (direction 2)` · `Designs/efsv2/owner-decision-inbox.md:54-60 (V2-E6); Designs/efsv2/README.md:125-127; Designs/efsv2/system-constitution.md:358` · `Designs/web-client-os/mvp-and-acceptance.md:95-96, 514-515, 849; product-constitution-and-roadmap.md:247, 285-295; app-runtime-and-direct-launch.md:847-864` · `Designs/open-web-app-store/architecture.md:905-909` · `Designs/arcade/README.md:44-46; Kanban.md:19-20` · `Owner-Inbox.md:FJ-4; ETHOnline-2026.md:1-20, 45-60` · `Reviews/2026-08-13-claude-evidence-round/README.md:§Arcade falsification`

**Re-classified in verification:** category UNDECIDED → DRIFT (materiality lens); severity blocking → important (materiality lens); owning set owner → vault-process (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** S2-arcade-x-appstore-x-r-06, S13-never-decided-13, R8-wco-product-mvp-priva-03

### SDK-01 — No EFS 2.0 SDK design of record exists on main

**Owner:** `vault-process` · **Severity:** important · MVP-relevant

**Category** MISSING · **Owning set** sdk · **Severity** blocking · **MVP-relevant** yes
**Members** `R8-wco-product-mvp-priva-19`, `R9-wco-architecture-runt-11`, `R10-wco-technology-stand-03`, `R11b-clientv2-packages-w-09`, `R3-efsv2-files-15`, `S6-sdk-and-mount-spread-02`, `J1-mvp-first-08`, `S13-never-decided-09`
**Neighbours** web-client-os, efsv2, clientv2, open-web-app-store, vault-process, owner Eight lanes independently found the same hole: at least six current documents hand the SDK
load-bearing MVP work, and no document defines that SDK. `mvp-and-acceptance.md` §Required write
behavior (:61-62) lazy-loads "the selected wallet connector, identity/controller resolver, action
planner, signer ceremony, submitter, and optional content publisher"; `ethereum-standards-and-interop.md`
§Architectural placement states "The future Protocol SDK owns canonical Ethereum encodings, low-level
RPC and contract calls, runtime validation, signature primitives, and raw evidence" and names
Protocol SDK/SDK lowest owner on all seven pressure rows (:540-552); `architecture-and-modules.md`
:1176-1181 defers "final repository placement … [to] the EFS v2 SDK/repository design";
`hierarchical-files-and-folders.md`:4 and :2276 assign "sdk — canonical codec/resolver/view/citation/
acquisition APIs"; `app-runtime-and-direct-launch.md`:789-800 hands generic contracts to "The SDK PM";
Stage A `STATUS.md`:67 routes gap G-5 to an "SDK result-model lane". That document does not exist:
every root `Designs/sdk-*.md` is v1/EAS dated 2026-06-20 under the `Designs/README.md`:72-75 banner
"not EFS 2.0 in

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Amend two details in the canonical text, leaving the finding otherwise intact. First: `Designs/web-client-os/ethereum-standards-and-interop.md` §"SDK and EFS v2 pressure packet" (heading :539; table :546-554) names Protocol SDK/SDK as lowest owner on **six of its seven** pressure rows — the seventh, "Event/table completeness", is owned by "Reader + domain adapter". Replace "names Protocol SDK/SDK lowest owner on all seven pressure rows (:540-552)" with "names Protocol SDK/SDK lowest owner on six of seven pressure rows (:546-554)". Second: replace "every root `Designs/sdk-*.md` is v1/EAS dated 2026-06-20" with "every root `Designs/sdk-*.md` is v1/EAS-era — seven dated 2026-06-18 to 2026-06-20, plus `sdk-v1-bridge-v2-compat-asks.md` (2026-08-07), itself a v1-bridge doc reversed by the 2026-08-08 greenfield ruling (`Kanban.md`:62)". Optionally add, for currency, that the unmerged `origin/codex/sdkv2-pm` branch supplies `Designs/sdkv2/` (11 files, README:3 "draft set — founder-authorized SDK experience and experiment program; no protocol bytes, package names, implementation, deployment, or release is adopted"), so the design of record is missing on `main` and exists only as invisible proposal-stage draft off it.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Main has no EFS 2.0 SDK design of record even though at least six current documents hand the SDK load-bearing MVP work (ethereum-standards-and-interop.md:540-552; architecture-and-modules.md:1176-1181; hierarchical-files-and-folders.md:4,:2276; app-runtime-and-direct-launch.md:789-800; mvp-and-acceptance.md:61-62; Stage A STATUS.md:67 gap G-5). The gap is not that nobody designed it: `sdkv2:Designs/sdkv2/owner-rulings.md` records a 2026-08-22 James ruling selecting `Designs/sdkv2/` as the current SDK source spine, and 11 unmerged files dated 2026-08-25 supply the architecture candidate, the result model that answers G-5, and an EXP-C0 MVP packet. The defect is that this ruling and lane are invisible to main: `Designs/README.md`:70-75 still presents only the pre-v2 SDK corpus and asserts "There is no live R1 owner choice", and `Open-Decisions.md` (generated 2026-08-21, "Ask now: 0") predates the mandate. Repair is reconciliation on main -- record the 2026-08-22 SDK mandate, repoint the SDK-owning references, and deconflict `Designs/sdkv2/` against the data-explorer branch's write arm, which names the same create-folder/create-file/publish-revision slice as the web-client-os MVP.

**Evidence:** `Decisions.md` · `Designs/README.md` · `Designs/clientv2/sdk-boundaries.md` · `Designs/efsv2/README.md` · `Designs/efsv2/hierarchical-files-and-folders.md` · `Designs/owner-decision-inbox.md` · `Designs/sdk-*.md` · `Designs/sdk-write-ux.md` · `Designs/sdkv2/ethereum-standards-census.md` · `Designs/sdkv2/exp-c0-mvp-packet.md`

**Re-classified in verification:** category MISSING → DRIFT (materiality lens); severity blocking → important (materiality lens); owning set sdk → vault-process (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** 

### PRD-12 — ARC-V2-LINK-1, U17 and the 'frozen v1 kinds' must-not are voided by the greenfield ruling

**Owner:** `arcade` · **Neighbours:** `efsv2` · **Severity:** minor · MVP-relevant

v2-pressure-and-migration.md:55 defines the failing test 'a game share link minted in September 2026 resolves to the same verified bytes after the v2 recut' (ARC-V2-LINK-1), and :99 requires 'Everything the Arcade writes durably uses the frozen v1 kinds'. Decisions.md:23 (2026-08-08) removes every v1 compatibility, migration, coexistence and legacy-read requirement and declares owner-authored v1 data disposable, and both Designs/arcade/README.md:19 and Designs/efsv2/README.md:135 say no durable Arcade write will occur - so no September 2026 v1 link will exist to forward and the frozen-kinds must-not is moot. unknowns-and-experiments.md:37 (U17), mvp-architecture.md:114 (capability row 28) and inbox D7 inherit the same voided frame.

**Evidence:** `Designs/arcade/v2-pressure-and-migration.md:55, :99` · `Decisions.md:23` · `Designs/arcade/README.md:19; Designs/efsv2/README.md:135` · `Designs/arcade/unknowns-and-experiments.md:37; mvp-architecture.md:114`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R14-arcade-07

### PRD-14 — Arcade's guest-boot measurement obligation targets the retired July budgets, not the MVP budgets

**Owner:** `arcade` · **Neighbours:** `clientv2`, `web-client-os` · **Severity:** minor · MVP-relevant

Designs/arcade/v2-pressure-and-migration.md §2b (lines 57-61) states '[[boot-and-profiles]] §3.3 budgets the v2 answer: <=3.0 s to interactive verified viewer, <=1.2 MiB critical path, <=2 serialized RTTs ... file the measurements to [[boot-and-profiles]] as calibration evidence', and its open question at :109 asks whether measurements go to boot-and-profiles or a clientv2 appendix. Designs/clientv2/boot-and-profiles.md:10 carries the historical banner with its budgets at :138-150, while the live budgets sit in Designs/web-client-os/mvp-and-acceptance.md:290-322 with different numbers: <=250 KiB guest-critical executable+CSS instead of <=0.62 MiB JS, a 10 Mbps/80 ms envelope instead of 9 Mbps/100 ms, 1.2 MiB kept only as a 'historical ceiling to remeasure', and the device left to the first experiment. Measurements filed against the July numbers will not calibrate the budget the MVP is acceptance-tested on.

**Evidence:** `Designs/arcade/v2-pressure-and-migration.md:57-61, :109` · `Designs/clientv2/boot-and-profiles.md:10, :138-150` · `Designs/web-client-os/mvp-and-acceptance.md:290-322`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R11a-clientv2-thesis-ker-05

### PRD-15 — playable-archive-requirements.md and every Arcade doc still treat N5 as an open owner question

**Owner:** `arcade` · **Neighbours:** `efsv2`, `clientv2` · **Severity:** minor · not on the MVP path

Designs/efsv2/playable-archive-requirements.md:18 says 'N5 remains undecided', and arcade/mvp-architecture.md:31, v2-pressure-and-migration.md:27 and :93-95, product-and-communities.md:25 and the museum review all describe N5/N5A as pending. Designs/efsv2/owner-decision-inbox.md:267-270 records the opposite: 'N5 - Joined-system anchor application: Superseded as a single flagship choice. Arcade, Git/Markdown, EAP, Nanda, mounts, contracts, and other cases jointly pressure-test Core.' The same PAF file still tests 'the five-kind model' (:266) and relies on the 'PIN channel head' (:95), neither inherited (owner-rulings.md:178-181), and its Depends-on chain (:5) points at four historical clientv2 docs.

**Evidence:** `Designs/efsv2/playable-archive-requirements.md:5, :18, :95, :266` · `Designs/efsv2/owner-decision-inbox.md:267-270` · `Designs/arcade/mvp-architecture.md:31; v2-pressure-and-migration.md:27, :93-95; product-and-communities.md:25` · `Designs/efsv2/owner-rulings.md:178-181`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R5-efsv2-context-require-06

### CLI-03 — Nobody owns client placement of the one-Arcade-view slice; two sets disagree

**Owner:** `efsv2` · **Neighbours:** `efsv2`, `arcade`, `open-web-app-store` · **Severity:** minor · MVP-relevant

Designs/efsv2/owner-decision-inbox.md:54-60 (V2-E6) and Designs/efsv2/README.md:124-127 describe one slice: "a clean-browser direct guest File Browser plus one verified Arcade view behind an adapter". The client set excludes it: mvp-and-acceptance.md:95-96 excludes "Arcade Play" from the MVP and :514-515 requires "Guest bundles contain no ... Arcade"; product-constitution-and-roadmap.md:247 puts "Arcade detail/Play" in "Near-term Web Client"; app-runtime-and-direct-launch.md:855-864 says the Arcade fixture is "Build only after separate disposable-experiment authorization". Designs/efsv2/system-constitution.md:358 still asks "Does the first Web Client ship only read-only Files plus one Arcade view, or also explicit writes?" although owner direction 2 settled the writes half. Designs/arcade/README.md:20 says "Client/OS placement ... remain open" and mvp-architecture.md:12 asks to "compare a lightweight standalone Arcade package against the forthcoming cypherpunk-OS client". No owner is named on either side, so the MVP's own scope statement differs between two current sets.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

efsv2's MVP scope text is stale against the product set that owns the MVP. Designs/efsv2/README.md:124-127 (build step 6) and owner-decision-inbox.md:54-60 (V2-E6) still describe the first slice as a "clean-browser direct guest File Browser plus one verified Arcade view behind an adapter", while Designs/web-client-os/mvp-and-acceptance.md:95-96 defers "Arcade Play" from the MVP, :514-515 requires "Guest bundles contain no ... Arcade", and product-constitution-and-roadmap.md:247 places "Arcade detail/Play" in Near-term. This is not an unowned decision: the arcade queue is under an explicit recorded hold (Open-Decisions.md §active holds, "Reconciliation hold (2026-08-08 / @pm)", which names client placement as unresolved; arcade/README.md:20 repeats it). It is stale cross-set text an efsv2 editor should reconcile, worth a one-line fix, and the readiness branch has already made it (V2-E6 replaced by V2-C2, readiness:Designs/efsv2/owner-decision-inbox.md:79-85). Note that the writes half of system-constitution.md:358 belongs to PRO-01 and double-counts here. Separately worth an owner's eye, but a different finding: V2-C2 on the branch names a *no-wallet* Data Explorer as the first vertical, which reads against owner direction 2's write-capable File Browser.

**Evidence:** `Designs/efsv2/owner-decision-inbox.md:54-60 (V2-E6); Designs/efsv2/README.md:124-127` · `Designs/web-client-os/mvp-and-acceptance.md:95-96, :514-515` · `Designs/web-client-os/product-constitution-and-roadmap.md:247` · `Designs/web-client-os/app-runtime-and-direct-launch.md:855-864` · `Designs/efsv2/system-constitution.md:358` · `Designs/arcade/README.md:20; Designs/arcade/mvp-architecture.md:12`

**Re-classified in verification:** category UNDECIDED → DRIFT (materiality lens); severity blocking → minor (materiality lens); owning set web-client-os → efsv2 (materiality lens)

**Verified:** text confirmed (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R14-arcade-08

### CORE-49 — The 2026-07-10 DROP clause would strip honest source-unavailability grades; the ruling text needs re-scoping, not the docs

**Owner:** `efsv2` · **Neighbours:** `owner`, `media-library` · **Severity:** minor · MVP-relevant

owner-rulings.md:12 orders dropping "any 'graded/UNKNOWN after the home chain is gone' language", and :17 calls it an editorial pass. Every current doc carries exactly that semantics, deliberately, because the PM directive and the evidence require it: pm-stage-a-directive.md:22; system-constitution.md:207-209; core-architecture-candidate.md:319-322 ('UNKNOWN is reserved for ... a missing required basis'); b0-realm-admission.md §4.2 UNAVAILABLE_SOURCE_BASIS lines 449-464 ('dead L3, all endpoints down'); media-infrastructure.md:358-361; hierarchical-files-and-folders.md UNKNOWN(HISTORY_UNAVAILABLE). This is benign drift, but a literal application of the ruling would strip honest result grades. Fix: append a dated scoping note under the 2026-07-10 entry (or re-rule via edit A2) limiting the DROP clause to chain-death survival machinery -- offline header verification, mortality tiers, fire drill -- and not to result grades.

**Evidence:** `Designs/efsv2/owner-rulings.md:§2026-07-10 lines 12, 17` · `Designs/efsv2/system-constitution.md:207-209; core-architecture-candidate.md:§Contract Resolution Plan lines 319-322` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:§4.2 lines 430-470; pm-stage-a-directive.md:22` · `Designs/media-library/media-infrastructure.md:358-361`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S9-confirmed-then-unread-02

### CORE-50 — Two current docs name different target repositories for the same code

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner` · **Severity:** minor · MVP-relevant

Designs/efsv2/hierarchical-files-and-folders.md header says 'Proposed new repos: core, os, drive; contracts/client remain legacy evidence' and docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md §Architecture says 'Create a new sibling repository, provisionally named core/'. Owner direction 11, dated the same day, says 'The eventual repository direction is to rename legacy repos to *-v1 and reclaim contracts, sdk, webclient, and drive for active v2. No rename or repository creation is authorized in this pass', and the client set's §Explicit non-authorizations lists 'a new webclient, os, sdk, core, or drive repository'. Nothing has been created and the sibling repos are all v1, so the cost today is only naming confusion in the two docs an engineer would read first.

**Evidence:** `Designs/efsv2/hierarchical-files-and-folders.md:header 'Proposed new repos'` · `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md:§Architecture` · `Designs/web-client-os/README.md:direction 11; §Explicit non-authorizations bullet 1`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R1-efsv2-spine-18

### CORE2-06 — playable-archive-requirements prescribes the retired channel model and a current media doc routes through it

**Owner:** `efsv2` · **Neighbours:** `media-library`, `arcade` · **Severity:** minor · not on the MVP path

`Designs/efsv2/playable-archive-requirements.md`:95 ('Follow the existing package convention for releases and channels: immutable release placement plus an append-only release or channel ledger, with a PIN channel head selecting the currently recommended manifest') is a verbatim summary of `Designs/clientv2/packages-and-updates.md` §1, and its line 5 depends on four clientv2 docs. `Designs/media-library/plex-jellyfin-app.md`:421-425 (2026-08-14, reviewed) cites it as the 'Verified player behavior and local continuation analogue' with no historical label, and the efsv2 README supersession list does not cover playable-archive-requirements at all. A current product doc therefore inherits a channel/PIN model the reset put back in play.

**Evidence:** `Designs/efsv2/playable-archive-requirements.md:5, 95` · `Designs/media-library/plex-jellyfin-app.md:1-10, 421-425` · `Designs/clientv2/packages-and-updates.md:§1 lines 18-45` · `Designs/open-web-app-store/README.md:97-100`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R11b-clientv2-packages-w-07

### CORE2-12 — Two current sets point at different repository topologies: core/os/drive versus contracts/sdk/webclient/drive

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `vault-process`, `owner` · **Severity:** minor · not on the MVP path

`Designs/web-client-os/README.md` direction 11 (lines 78-80) and `architecture-and-modules.md` §Product and repository boundaries record James's direction to 'rename legacy repositories to *-v1 and reclaim contracts, sdk, webclient, and drive for active v2'. `Designs/efsv2/hierarchical-files-and-folders.md` line 5 instead says 'Proposed new repos: core, os, drive; contracts/client remain legacy evidence', and `Kanban.md` line 15 repeats 'proposed core/os/drive repos'. Neither topology is authorized, but the drift is against a recorded owner direction and will be expensive to unwind once repositories exist.

**Evidence:** `Designs/web-client-os/README.md:§Direct owner direction item 11 (lines 78-80)` · `Designs/web-client-os/architecture-and-modules.md:§Product and repository boundaries` · `Designs/efsv2/hierarchical-files-and-folders.md:line 5 'Proposed new repos'` · `Kanban.md:15`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R8-wco-product-mvp-priva-17, R3-efsv2-files-12

### CORE2-31 — Lens-scale constants drift across 20/50/64/256 and the key-to-Principal relabel was never explained

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `media-library`, `open-web-app-store` · **Severity:** minor · not on the MVP path

`owner-rulings.md` L25-28 records '~12 own keys + ~40 friends = 50+ attesters in one lens' against 'MAX_LENSES = 20 (ADR-0026-era)' and in the same entry rules that lens entries are stable identities, not raw keys — making the realistic count ~41 Principals — but `assumptions-and-requirements.md` R-L4 (203), A-7 (250) and D-10 (467) restate '50 principals / 256 portable ceiling' without noting the relabel, and `human-overview.md` (350, 588) plans 50/100/256 benchmarks. The current numbers are: 20 = v1 ceiling (`Designs/efs15/requirements-and-boundaries.md`:774; `Designs/sdk-architecture.md`:886), retired by lens-spec.md §9; 15-55 = July design centre (lens-spec.md:37, 97); 64 = contract plan cap candidate (owner direction 8, `Designs/web-client-os/README.md`:69-71; Stage A `b0-lens.md`:70 and §3.4 189-205 with ≈549k gas worst case); 256 = client compile ceiling hypothesis (b0-lens.md:71; H-L1:296); 1/8/32/64 = V2-E2 benchmark sizes (`owner-decision-inbox.md`:26-31; constitution:309, LP-4 'Superseded by V2-E2'). Stage A's carry-in register (`corpus/carry-in-register.md`:520-522) still carries 'R-L4 (50+ owner concern; 256 measured unknown)' as a live centre for caps and page sizes, so the superseded numbers keep re-entering new work, and no document explains the key-to-Principal relabel to James.

**Evidence:** `Designs/efsv2/owner-rulings.md:2026-07-10 Lenses L25-28` · `Designs/efsv2/assumptions-and-requirements.md:R-L4 203, A-7 250, H-L1 296, D-10 465-469` · `Designs/efsv2/human-overview.md:350, 588` · `Designs/efsv2/lens-spec.md:§2.4 L37, §9 L97` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md:§2 L70-71, §3.4 L189-205` · `Designs/web-client-os/README.md:direction 8 L69-71, L521-523` · `Designs/efsv2/owner-decision-inbox.md:V2-E2 L26-31, LP-4 L223-225` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/carry-in-register.md:520-522`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R4-efsv2-identity-lens-p-10, R5-efsv2-context-require-14

### CORE2-37 — Ruling A's 'admit ADDRESS targets' was dropped and nobody told the owner

**Owner:** `efsv2` · **Neighbours:** `owner` · **Severity:** minor · not on the MVP path

`Designs/efsv2/owner-rulings.md` 2026-07-15 item A (line 46) rules 'backlinks incl. predicate-typed ... ON-CHAIN, indexed. Postings word carries definitionId ... + admit ADDRESS targets.' `b0-indexes.md` §3.5 (923-938) states 'There is no REALM, ADDRESS, or BYTEDIGEST ReferenceRole target class' and routes account concepts through application Records referenced as RECORD/OBJECT or through the PRINCIPAL class. The 2026-08-12 reset (owner-rulings 49-58) lets exact index machinery re-earn inclusion, so this is recordable drift rather than a violation — but 'who references this raw account that is not an EFS Principal' is unanswerable on-chain in B0, and no document records that the ADDRESS half of ruling A was dropped.

**Evidence:** `Designs/efsv2/owner-rulings.md:2026-07-15 item A line 46; 2026-08-12 lines 49-58` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:§3.5 lines 923-938`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R7b-stageA-b0-indexes-le-08

### CORE2-38 — The constitution omits the signed item-F equivocation limitation and the restoration edit is unadopted

**Owner:** `efsv2` · **Severity:** minor · not on the MVP path

`owner-rulings.md` 2026-07-15 item F (line 51) rules 'SIGN THE LIMITATION (Option 2)' with wording to ratify: 'on-chain gates use closed, trusted author sets; EFS does not guarantee contracts can detect equivocation, and contracts needing certainty against untrusted authors must use a challenge-window (delay + re-check) pattern.' A grep for 'equivoc' or 'challenge' in `system-constitution.md` returns nothing. Stage A noticed: `corpus/proposed-spine-edits.md` A1 (line 60) is titled 'Equivocation non-guarantee + challenge-window (item F restoration)' and contradiction-ledger row 6 (860) records 'Spine silence vs owner item F', but `STATUS.md`:46 says no Stage A proposal is adopted into Designs/efsv2/. A contract-Lens designer reading the constitution (source precedence #3) will not learn the limitation the owner signed.

**Evidence:** `Designs/efsv2/owner-rulings.md:51-54` · `Designs/efsv2/system-constitution.md:189-203 (no equivocation/challenge text)` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:60, 860` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:46`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R2-efsv2-types-ids-oncha-13

### CORE2-39 — The passkey-sync recovery ruling is RULED but carried by no current document

**Owner:** `efsv2` · **Neighbours:** `web-client-os` · **Severity:** minor · not on the MVP path

`owner-rulings.md` L83-86 records 'Passkey-sync is the mainstream default recovery ... honest minimum launch default = passkey-sync + one independent cold backup factor'. The mechanism it referenced (kel.md §10, §18, §20) is reopened by the 08-12 reset; `system-constitution.md` L137-139 lists recovery only as an 'extension requirement'; `owner-decision-inbox.md` P-8 (133-136) defers recovery 'beyond the account-Principal MVP'; Stage A `STATUS.md` L64 pushes it to a future KEL round; and web-client-os mentions passkeys only as a 'Required-forward identity/reauthentication portal' (`web-platform-standards-and-forward-profile.md`:294) and a later 'hardware/passkey-backed unwrap' seam (`privacy-and-agents.md`:95). The ruling was neither explicitly superseded nor carried forward as a product default, so the eventual managed-Principal round will either rediscover it or silently drop it.

**Evidence:** `Designs/efsv2/owner-rulings.md:2026-07-16 KEL recovery L83-86` · `Designs/efsv2/system-constitution.md:L137-139` · `Designs/efsv2/owner-decision-inbox.md:P-8 L133-136` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:L64` · `Designs/web-client-os/web-platform-standards-and-forward-profile.md:L294; privacy-and-agents.md:L95`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R4-efsv2-identity-lens-p-06

### CORE2-40 — keyWrap 'recipient-set stays off-chain' never reconciled with July on-chain keyWrap TAGs

**Owner:** `efsv2` · **Neighbours:** `web-client-os` · **Severity:** minor · not on the MVP path

`owner-rulings.md` L64 (2026-07-15 item 14) says 'keyWrap recipient-set stays off-chain because publishing it leaks who-can-read (privacy metadata)'. The privacy design four days earlier publishes keyWrap as TAG claims per recipient on-chain with opaque occurrence keys (`privacy.md` §3.1 L41-51) and admits 'wrap fan-out degrees and membership-change deltas' leak (`privacy-pass-synthesis.md` PC-11 L39) and that 'the ordinary keyWrap recipient graph ... is retro-linkable at CRQC' (PC-6 L29). The two can be read consistently (recipient identities hidden classically; counts and timing not), but the ruling's wording and the design's mechanism were never reconciled and privacy.md was last touched 2026-07-11. No current doc relies on either (`system-constitution.md` L246-253 keeps only generic seams; inbox N6), so this is a note for whoever designs the private tier.

**Evidence:** `Designs/efsv2/owner-rulings.md:2026-07-15 item 14 L64` · `Designs/efsv2/privacy.md:§3.1 L41-51` · `Designs/efsv2/privacy-pass-synthesis.md:PC-6 L29, PC-11 L39` · `Designs/efsv2/system-constitution.md:L246-253` · `Designs/efsv2/owner-decision-inbox.md:N6 L272-275`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R4-efsv2-identity-lens-p-12

### PRD-17 — media-library declares a Depends-on the historical clientv2 README instead of the web-client-os spine

**Owner:** `media-library` · **Neighbours:** `clientv2`, `web-client-os`, `efsv2` · **Severity:** minor · MVP-relevant

Designs/media-library/README.md:5 declares 'Depends on: [[Designs/efsv2/README]], [[Designs/clientv2/README]]'. Designs/clientv2/README.md:8-16 (the 2026-08-12 greenfield correction) says that set is 'evidence, not one automatically adopted client architecture ... The active product architecture and requirements now live in [[../web-client-os/README]]', and Designs/README.md:67 agrees; web-client-os/README.md:411 assigns 'Web/OS consumption, File Browser UX, module interfaces' to web-client-os and :414 assigns media semantics to the Media PM. Under the design-system promotion rule a Depends-on chain must be accepted or landed, so this is a lifecycle defect that also hides the set's real neighbour. What media actually takes from clientv2 is two July hypotheses (plex-jellyfin-app.md:421-424: persistence-and-sync offline/loss and file-browser-requirements folder ingest), now covered by web-client-os/privacy-and-agents.md:69-73,:164-177 and product-constitution-and-roadmap.md:247,:285-289. Repair: rewire Depends-on to web-client-os + hierarchical-files-and-folders and keep clientv2 as an Inputs line, as web-client-os/README.md:6 does.

**Evidence:** `Designs/media-library/README.md:5` · `Designs/clientv2/README.md:8-16; Designs/README.md:67` · `Designs/web-client-os/README.md:6, :411, :414` · `Designs/media-library/plex-jellyfin-app.md:421-425, :431-433` · `Designs/web-client-os/privacy-and-agents.md:69-73, :164-177; product-constitution-and-roadmap.md:247, :285-289`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R11a-clientv2-thesis-ker-14, R13-media-library-07

### PRD-18 — Media build order lets a disposable off-chain search provider ship before the on-chain Query Lab measurement

**Owner:** `media-library` · **Neighbours:** `owner`, `efsv2` · **Severity:** minor · MVP-relevant

Designs/media-library/README.md build order (lines 180-185) schedules 'Booru Slice 1: ... and a disposable search provider' as step 2, before step 3 'Query Lab: measure single-tag, hot-tag and selective 2/3/5-tag traces through Core and a redeployable bounded view before building the reference subgraph'. booru-app.md Slice 1 (lines 307-320, esp. :317-318) says enhanced queries go 'through the first provider proven necessary', which requires the Query Lab to have run first, and the 2026-08-14 media ruling says 'Try every practical bounded public media query onchain before deferring it' (owner-rulings.md:23-30). The set's build order contradicts both its own placement rule and the ruling above it. Repair: swap steps 2 and 3, or restrict Slice 1's provider to Core-only browse.

**Evidence:** `Designs/media-library/README.md:180-185` · `Designs/media-library/booru-app.md:307-320, :317-318` · `Designs/media-library/owner-rulings.md:23-30`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R13-media-library-08, S3-media-x-types-x-index-12

### PRO-26 — Onboarding and coordination docs still describe the pre-08-08 world

**Owner:** `vault-process` · **Neighbours:** `clientv2`, `sdk`, `web-client-os`, `efsv2` · **Severity:** minor · not on the MVP path

Milestones.md (last touched 2026-08-13) says "Current phase (2026-07-23) … EFS v2 is in constitutional reconciliation" and "The Client v2 design set is Designs/clientv2/README.md … implementation target remain evidence-gated", while Designs/clientv2/README.md §Status says the set "is now a client/OS research corpus, not the active product architecture. The next pass is now [[../web-client-os/README]]". Onboarding/repo-map.md repeats the error at lines 24-27 and 35 ("Current Client v2 architecture and open choices | planning/Designs/clientv2/"), lists no core, os, drive or web-client-os row, has no v2 SDK row, and does not say that the v1 SDK lives on branch chore/scaffold rather than main (line 11 calls it "unmerged pre-v2 SDK implementation; legacy input"). AGENTS.md §Sibling repos still says "sdk/ (JS/TS — exists and is in flight, branch chore/scaffold), client/ (v1 Vite/Lit client, hibernating)" although Kanban Done records "Stopped v1 SDK support/merge work" after the 08-08 ruling, and Onboarding/authority.md's scope list ends at designs/clientv2 with no names for the four newer design sets. Each is a few lines to fix, but together they route a new agent to the superseded set.

**Evidence:** `Milestones.md:opening blockquote; §Current inputs` · `Designs/clientv2/README.md:§Status; 8-16 (2026-08-12 correction banner)` · `Onboarding/repo-map.md:11, 24-27, 35, 38` · `AGENTS.md:§Sibling repos under /efs/` · `Kanban.md:Done 'Stopped v1 SDK support/merge work'` · `Onboarding/authority.md:Scopes line` · `Designs/README.md:67; Designs/web-client-os/README.md:78-80`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R19-process-rulings-ledg-14, R17-sdk-and-mounts-10, S6-sdk-and-mount-spread-13

### PRO-51 — The MVP write ceremony is two signatures, uncosted, and worse than v1's

**Owner:** `web-client-os` · **Neighbours:** `web-client-os`, `efsv2`, `sdk` · **Severity:** minor · MVP-relevant

mvp-and-acceptance.md lines 74-78 say that "under the current candidate, sign the authored PublicationEnvelope and the Realm-bound AdmissionIntent separately because every Files operation selects Binding leaves", and lines 247-252 say an implicit same-sender B0 admission path is insufficient; hierarchical-files-and-folders.md §8.2 (lines 1208-1215) confirms "Kind 0 keeps B0's exact leaf-mask-only branch" with no expected-revision CAS, and Stage A SR-12 (b0-overview.md:341-345) makes implicit-sender admission illegal for BindingSet leaves. The July one-signature thesis (large-file-uploads.md line 13; Designs/sdk-one-signature-writes.md) is not carried into the candidate; ethereum-standards-and-interop.md keeps EIP-7702 "design for; disabled by default" and names no sponsorship/paymaster/faucet path; README line 3 says no wallet stack is authorized. Net: an injected EOA, two popups per "New folder", self-funded Sepolia gas — below v1's measured "2-3 popups" problem (sdk-minimal-clicks.md line 16) and the SDK's one-click bar — and nobody has written that sentence or asked the owner whether "deliberately basic" writes (direction 2) may ship it, or whether a labelled implicit-sender/no-CAS mode is allowed. Separately an ungraduated AccountPrincipal has no rotation, so key theft means permanent capture, every directory entry is a Principal-owned CAS Binding, and no current doc states the limitation (grep theft|stolen|compromis in the efsv2 spine → 0): a steward's first two questions — "how many popups?" and "what if my key leaks?" — have no written answer.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

**The MVP write ceremony is two signatures plus a submission, uncosted, and never put to the owner.** `Designs/web-client-os/mvp-and-acceptance.md`:74-78 requires the user to "sign the authored `PublicationEnvelope` and the Realm-bound `AdmissionIntent` separately because every Files operation selects Binding leaves", and :247-249 rules an implicit same-sender B0 path insufficient; the operation sequence :207-227 then adds "submit publish()", so a plain injected EOA faces two typed-data signatures plus one transaction per "New folder". This is forced, not accidental: Stage A SR-12 (`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md`:336-343) makes `admitAsSender` legal "only when the selected set contains none of the three kernel-effect Types", and `Designs/efsv2/hierarchical-files-and-folders.md`:1211 (§8.2) keeps "Kind 0 … B0's exact leaf-mask-only branch". The v1 one-signature line is not carried forward — and the vault has already closed that question: `Designs/owner-decision-inbox.md`:18-22 marks ER1–ER2 "v1 packet history, not live choices" and forbids reviving "write-rail work as a successor dependency", and lists `sdk-one-signature-writes` as "Dormant or historical". What is genuinely undecided is narrower and still unwritten: (a) `Designs/web-client-os/ethereum-standards-and-interop.md` names every sponsorship rail but adopts none — EIP-7702 is "Design for; disabled by default" (:257), ERC-4337/7562 "Design for / watch" (:256), ERC-7677 paymaster service "Draft except Review … watch" (:259) — and `README.md`:3 authorizes no wallet stack, so no MVP funding or ceremony-reduction path exists even as a candidate; (b) no document states the resulting interaction count as a product fact or asks the owner whether "deliberately basic" writes (README direction 2, :44-47) may ship it — `Open-Decisions.md`:8 says "Ask now: 0"; (c) an ungraduated `AccountPrincipal` has "**no rotation** … key theft means permanent capture" (`b0-principal-authority.md`:1308-1311) while every directory entry is a Principal-owned CAS Binding, yet `mvp-and-acceptance.md` §Known residuals (:802-813) omits it and the efsv2 spine is silent (grep theft|stolen|compromis over the seven spine files → 1 hit, `owner-rulings.md`:86, about synced-passkey provider compromise, not Principal rotation) — even though `Designs/efsv2/read-lens-spec.md`:135 states "Every conforming client's grade documentation MUST carry this paragraph or an equivalent." Note the economic framing does not survive: v1's measured floor was 2–3 popups (`Designs/sdk-minimal-clicks.md`:51; `efs-v2-transition-plan.md`:20), so the candidate is comparable rather than worse, and `mvp-and-acceptance.md`:861-862 makes Sepolia "the active, near-free shared venue". Severity accordingly reduces to important: the ceremony is disclosed in the MVP doc itself, so this is an unwritten product statement and an unasked owner question, not a hidden design defect blocking a build start.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

`Designs/web-client-os/mvp-and-acceptance.md` does not carry a client obligation that Stage A imposes. `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:1308-1314` requires that the ungraduated `AccountPrincipal` cost -- no rotation, so key theft is permanent capture of that PrincipalId's future writes, with graduation as the remedy -- be rendered by clients, "not hide[n]". The MVP's Required write behavior (:59-82) and its acceptance checklist preview "signatures, fees, and failure modes" (:73) but never state the no-rotation cost, the two-signature count that :218-219 implies, or a Sepolia funding path. Add the Stage A honest-cost statement and an explicit signature count to the MVP acceptance criteria. The write ceremony itself is not a defect: it follows from SR-12, it is at parity with v1's 2-3 popups (burner: 0), and the one-signature thesis was deliberately demoted to a post-v2 enhancement by `Designs/efsv2/efs-v2-holistic-redesign.md:5,25`.

**Evidence:** `Designs/web-client-os/mvp-and-acceptance.md:§Required write behavior 74-78; §Operation sequence 247-252` · `Designs/efsv2/hierarchical-files-and-folders.md:§8.2 1208-1215` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md:SR-12 341-345` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:§6.3 1308-1314 (no rotation)` · `Designs/web-client-os/ethereum-standards-and-interop.md (EIP-7702 'Design for; disabled by default'; no paymaster path)` · `Designs/web-client-os/README.md:3; direction 2 (44-47)` · `Designs/efsv2/large-file-uploads.md:13; Designs/sdk-minimal-clicks.md:16; Designs/sdk-write-ux.md:§The constraint` · `Designs/efsv2/core-architecture-candidate.md:§Principal; grep theft|stolen|compromis in efsv2 spine → 0`

**Re-classified in verification:** severity blocking → important (accuracy lens); category UNDECIDED → DRIFT (materiality lens); severity important → minor (materiality lens); owning set owner → web-client-os (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R3-efsv2-files-16, J3-adoption-first-05

## MISSING — nobody has designed it

### CORE-02 — No genesis path: how Types reach a Realm, who ships the dev-Realm Type set, and how Files roots are created

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner` · **Severity:** blocking · blocks the MVP

A write needs concrete ObjectGenesis/1, DirectoryEntry/1, ChunkTree/1 and FileRevision/1 Types already present on the Realm the client opens, and no current Designs/ document says how any Type gets there: core-architecture-candidate.md:82-83 says a Type Schema is 'not identified by a registry transaction' and stops; layered-type-system-and-data-abi.md:62, 331 says 'Permissionless Type publication' and 'Registration verifies that each mapped field exists' without naming an operation; system-constitution.md:343-344 leaves creator limits open. Stage A SR-17 is the only mechanism ('TypeSchemas enter state as Records of the bootstrap meta-Type through ordinary admission', b0-overview.md:468-480), and STATUS.md:46 says 'No Stage A proposal is adopted into Designs/efsv2/'. On the Files side, hierarchical-files-and-folders.md defines MountDescriptor/1 and PublicFilesMountConfig/1 (§3.4 494-567), FilesRouteConfig/1 (§3.5), the ERC-5219/ENS route (§2.4, §6.3) and rootPlacementId (:1644-1646) but never a creation sequence for the root Directory Object, the root Mount and its immutable Plans, the Route record, or adapter/ENS discovery -- while mvp-and-acceptance.md:68-70 requires the client to pin Realm, parent Directory, exact Mount/config, namespacePlan and contentPlan before planning a New folder, and owner-rulings.md 2026-08-12 (:188-192) forbids relying on Commons/OS to supply them. Files also requires BindingScope 'at Realm genesis' (:699) while forbidding permanent Files Type bytes until V2-E1 closes (:121-123). Nobody owns the dev-Realm genesis manifest (Core profile + Files Types + BindingScope + route config) and no queue item asks for one.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

No document anywhere — main or branch — contains the dev-Realm bring-up manifest and ordering the MVP needs: which Types are admitted in what order, which index kinds are active at genesis (`hierarchical-files-and-folders.md:699` requires BindingScope 'at Realm genesis'), who publishes them, and how the root Directory Object, root Mount/`PublicFilesMountConfig`, immutable Plans and `FilesRouteConfig` are created before `mvp-and-acceptance.md:68-70` can pin them. Correct the finding's over-claim that the mechanisms do not exist: Type admission is designed in Stage A SR-17 (`b0-overview.md:468-480`, unadopted per `STATUS.md:46` 'No Stage A proposal is adopted into `Designs/efsv2/`'), implemented in `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md` Tasks 3-4, and readiness:`exp-c0-v0-hello-files-trace.md` H0 exports a `RealmBootstrap` — but every one of those either assumes the root Directory already exists or is unadopted, so the artifact and its owner are still absent. Blocking stands: Slice B cannot run without it.

**Evidence:** `Designs/efsv2/core-architecture-candidate.md:82-83 ('not identified by a registry transaction')` · `Designs/efsv2/layered-type-system-and-data-abi.md:62, 331; Designs/efsv2/system-constitution.md:343-344, 353-354` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md:315-317, 350, 468-480 (SR-17); STATUS.md:46` · `Designs/efsv2/hierarchical-files-and-folders.md:121-123, 699; §3.4 lines 494-567; §6.3 lines 878-921; §10 lines 1644-1646` · `Designs/web-client-os/mvp-and-acceptance.md:68-70 (Required write behavior)` · `Designs/efsv2/owner-rulings.md:2026-08-12 lines 188-192`

**Verified:** text confirmed (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R2-efsv2-types-ids-oncha-03, S13-never-decided-04, R3-efsv2-files-01

### PRD-07 — Arcade claims a mobile-capable target while the Safari/iOS measurements sit in no design doc

**Owner:** `arcade` · **Neighbours:** `web-client-os` · **Severity:** important · MVP-relevant

browser-runner-measurements.md:21-24 and :153-185 record a 3-second busy loop in an opaque child freezing Safari's host page for 3,027 ms where Chrome is out-of-process at 51 ms, Safari running opaque/cross-origin children at ~22 rAF/s while the host runs 60, and allow='fullscreen' disabling fullscreen in Safari; :208-216 records iOS Safari, Chrome Android, real touch and gamepad as 'entirely unmeasured'. The Arcade set nevertheless keeps 'mobile-capable' as a target (README.md:15-16), a touch bar and >=40% touch catalog share (catalog-plan.md:23,:28) and an iOS Safari acceptance item (september-plan.md:95), while player-security-model.md:31 still says 'srcDoc frames typically share the parent renderer process'. No Arcade or web-client-os design doc mentions the WebKit rAF throttle, fatal to action games on iOS where every browser is WebKit; only README.md:67 points at the measurements. Andromeda is a setTimeout loop at 50 fps tested on one Chromium tuple with emulated touch and 'No Safari/iOS WebKit or Firefox verification' (andromeda-evidence-reproduction.md:96,:106,:107). Under owner direction 15 (web-client-os/README.md:92-95) the honest outcome on every iPhone may be 'reduced/unsupported', a statement the slice does not make, and the memo's two runner-policy asks (fullscreen grant; info-screen self-navigation) are unplaced.

**Evidence:** `Reviews/2026-08-13-claude-evidence-round/corpus/runner/browser-runner-measurements.md:21-24, :27, :153-185, :208-216` · `Designs/arcade/README.md:15-20, :67; catalog-plan.md:23, :28; september-plan.md:95` · `Designs/arcade/player-security-model.md:31, :82` · `Reviews/2026-08-13-claude-evidence-round/corpus/arcade/andromeda-evidence-reproduction.md:96, :106, :107, :146` · `Designs/web-client-os/README.md:92-95 (direction 15)`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R14-arcade-05, S8-evidence-bindings-vs-12

### PRD-08 — No document owns the Arcade application profile; its objects have five spellings and it cites no current neighbour

**Owner:** `arcade` · **Neighbours:** `open-web-app-store`, `web-client-os`, `efsv2`, `media-library` · **Severity:** important · MVP-relevant

The same objects carry four current spellings and Arcade uses a fifth: core-architecture-candidate.md:372-381 (GameProject/GameMetadata/ArtifactClosure/GameRelease/VerifiedLocator/CatalogMembership/SelectedRelease); Stage A harness-and-fixtures.md:718-726 (ObjectGenesis/1, ArtifactRelease/1, RuntimeRequest/1, Locator/1, ArtifactClosure/1, and 'no dedicated GameMetadata type is minted'); open-web-app-store/architecture.md:219-266,:527-532 (Project/Release/ArtifactClosure/PackageHandoff); app-runtime-and-direct-launch.md:239-242 (AppReleaseRef/ResolvedPackageSet/PackageManifest/AppEntryDescriptor); and the Arcade bodies' v1 slug/sha256/DATA-UID/PIN/PlayablePackage plus a 'portable source manifest' (mvp-architecture.md:116-135,:163-169), the only v2 vocabulary being the efs15-era GameProject/GameRelease/ArtifactManifest banner (v2-pressure-and-migration.md:11). A grep for SoftwareProject|PackageRelease|PackageHandoff|ArtifactRelease/1|RuntimeRequest/1|ArtifactClosure under Designs/arcade/ returns zero hits and no Arcade doc mentions web-client-os, PackageHandoff or the Minimal App Host - yet mvp-and-acceptance.md asserts Arcade 'Fits Resolved<T>, Artifact Reader, PackageHandoff, Presentation Router, and app-activation flow' and roadmap Slice D makes it 'the first concrete opaque full-Web/product pressure test', so the fit claims are one-sided. Every neighbour delegates the semantics back (web-client-os/README.md:414; open-web-app-store/README.md:124) and the store checklist requires Arcade owner review (architecture.md:1011) while the Kanban card has no owner. Repair: one application-profile page naming, per object, which neighbour spelling it adopts.

**Evidence:** `Designs/efsv2/core-architecture-candidate.md:372-381` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:718-726` · `Designs/open-web-app-store/architecture.md:219-266, :527-532, :1011; README.md:124, :188-192, :264-265` · `Designs/web-client-os/app-runtime-and-direct-launch.md:239-242, :1128-1129; README.md:414` · `Designs/arcade/mvp-architecture.md:107, :116-135, :163-169; v2-pressure-and-migration.md:11` · `Designs/web-client-os/mvp-and-acceptance.md §Adjacent product pressure fixtures row Arcade; product-constitution-and-roadmap.md §Slice D` · `Kanban.md:20 (no claim trailer)`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R14-arcade-09, S2-arcade-x-appstore-x-r-01, R8-wco-product-mvp-priva-16

### PRD-13 — Andromeda's six open publication gates have no home in any design doc or ledger

**Owner:** `arcade` · **Neighbours:** `owner`, `vault-process` · **Severity:** important · MVP-relevant

The reproduction memo lists six gates still open on the single game the whole slice depends on: font glyph provenance and MIT permission-notice closure (both 'OWNER-OR-COUNSEL', andromeda-evidence-reproduction.md:22-27), the USPTO name pass the Arcade's own policy requires ('MISSING gate, not a finding against the game'), single-operator serving custody, '0.9.0' mapping to three different byte sequences, and no iOS Safari/Firefox tuple (:107,:112,:144-148). None has a home: unknowns-and-experiments.md:19-38 (U1-U18) has no Andromeda row, catalog-plan.md and rights-safety-and-operations.md never mention the game, the rights intake classes at rights-safety-and-operations.md:22-32 have never been applied to it in a design doc, and README.md:15-19 with Kanban.md:20 carry the list only as prose. The memo also records (:40) that 'There is no upstream repo, revision, digest, size, license analysis, locator list, or build story recorded anywhere in the vault'.

**Evidence:** `Reviews/2026-08-13-claude-evidence-round/corpus/arcade/andromeda-evidence-reproduction.md:22-27, :40, :107, :112, :144-148` · `Designs/arcade/unknowns-and-experiments.md:19-38` · `Designs/arcade/rights-safety-and-operations.md:22-32` · `Designs/arcade/README.md:15-19; Kanban.md:20`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R14-arcade-16

### CORE-06 — The Type/query-identity axis is unruled and every consumer silently assumes a different arm

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `open-web-app-store`, `media-library`, `owner` · **Severity:** important · MVP-relevant

owner-rulings.md:208-210 calls whether index declarations live inside Type identity or in a separate profile 'a 50-year bakeoff question, not ruled', and web-client-os/README.md direction 12 (:99-103) records that 'The latest owner response was not interpretable, so this set infers no choice' -- an owner answer was received and lost. Three identity shapes now exist with no crosswalk: B0 Variant A ('Under Type Variant A, a new canonical index means a new Type Schema', candidate:291-292), candidate Variant B / Stage A F4 SPLIT-ID (bakeoff-spec.md:144, 357-370), and layered Architecture C (TypeRevisionId keeps validation/roles/Views inside, only QueryProfileId outside; layered:195-217). Consumers pick silently: hierarchical-files-and-folders.md -- the doc the MVP builds on -- is B0-only (:6, 338-345, 369, 671), never cites the layered doc and never says the axis is open, while README.md:75-80 names the layered doc the current Type proposal; mvp-and-acceptance.md:912-915 says the axis is open then uses SemanticSpec/LogicalShape/Representation/ViewRevisionId in §I (695-727), which has no meaning under Variant A, beside B0 write units at :226-240. The Store maps every object onto B0 names in prose (architecture.md:53-55, 816-830) but its only executed fixture ran against the layered arm with no B0 control although the layered doc names A as the control, and that fixture's claim 'Adding an index changes the QueryProfile, not Type or Record IDs' is false under Variant A. All seven media docs name only SCALAR_EQ/REF_BACKLINK/DIGEST_EQ and never QueryProfile/ViewQueryProfile/TypeRevision (grep verified), with the only cross-arm evidence outside the vault (agent-status.md:236, commit e9652d3). Nothing says which arm a dev Realm will mint.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Same finding with three fixes. (1) Direction 12 is at `Designs/web-client-os/README.md:81-84`, not :99-103 (lines 99-103 are directions 16-17); the evidence array already has 81-84 right, the canonical detail does not. (2) "Under Type Variant A, a new canonical index means a new Type Schema" is at `core-architecture-candidate.md:294-295`, not :291-292. (3) Currency: on the unmerged readiness branch the axis now carries a proposed default — `readiness:Designs/efsv2/core-architecture-candidate.md:564` gives Type/query identity the `EXP-C0` default "flat exact Type + separate Realm-activated QueryProfile" with reopen triggers "fragmentation, activation/completeness, or required-contract-interop failure", and :553 "`EXP-C0` is the implementation default". That is proposal-stage, unmerged, and invisible to `Open-Decisions.md`, so main remains unruled and every main-side consumer mismatch stands — but the finding should say the branch proposes an arm rather than implying nothing anywhere names one.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

hierarchical-files-and-folders.md — the Files doc the MVP builds on — carries an unflagged Type-identity arm assumption and no crosswalk exists between the three shapes. It uses B0's `TypeSchemaId` and calls the generic schema/blob 'a B0 freeze obligation' (:369), has zero hits for QueryProfile / layered-type / Variant / bakeoff, and never notes that the axis is open, while README.md:75-80 names layered-type-system-and-data-abi.md the current Type proposal. Separately, web-client-os/README.md direction 12 records an owner response that 'was not interpretable, so this set infers no choice', yet no queue item exists to re-ask it (Open-Decisions.md: 'Ask now: 0'). Two cheap repairs: one crosswalk paragraph naming which arm hff assumes and that the axis is open, and one filed owner re-ask. The web-client-os set is already arm-neutral and explicitly reversible (mvp-and-acceptance.md:698-700, 912-915) and should be dropped from the list of silent consumers. Minor sub-defect: Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md:66 states 'Adding an index changes the QueryProfile, not Type or Record IDs' as a flat verdict-table fact when it holds only under the layered arm; that line needs an arm qualifier. Not MVP-blocking: hff:603 insulates Files positions from TypeSchemaIds, and readiness:core-architecture-candidate.md:564 already names a delegated candidate default.

**Evidence:** `Designs/efsv2/owner-rulings.md:208-210; Designs/web-client-os/README.md:81-84, 95-103 (direction 12)` · `Designs/efsv2/hierarchical-files-and-folders.md:6, 338-345, 369, 455, 671-676, 1852; Designs/efsv2/README.md:75-80` · `Designs/efsv2/core-architecture-candidate.md:89-95, 291-292, 413-414; Designs/efsv2/layered-type-system-and-data-abi.md:195-217, 344-353, 1234-1237` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/bakeoff-spec.md:81, 144, 194, 357-370` · `Designs/web-client-os/mvp-and-acceptance.md:226-240, 695-727, 912-915; Designs/open-web-app-store/architecture.md:53-55, 816-830` · `Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md:7, 13, 66, 70-141; Designs/media-library/query-and-indexing.md:59-64; Daily Notes/agent-status.md:236`

**Re-classified in verification:** category UNDECIDED → MISSING (materiality lens); severity blocking → important (materiality lens)

**Routing note from verification:** materiality lens: efsv2 (write the crosswalk) + owner (re-ask the axis in an interpretable form); web-client-os is not a delinquent consumer

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R2-efsv2-types-ids-oncha-02, S7-efsv2-object-model-co-02, S1-appstore-x-os-x-types-01, S3-media-x-types-x-index-06

### CORE-08 — The ONE gas snapshot named the July sign-off blocker is still unproduced; nobody can be quoted a price

**Owner:** `efsv2` · **Neighbours:** `owner`, `media-library`, `open-web-app-store`, `web-client-os` · **Severity:** important · MVP-relevant

owner-rulings.md 2026-07-15 line 69 states 'Blocker to final sign unchanged: the ONE gas snapshot (freeze-gates A2) is not yet produced', and freeze-gates.md:49 still shows it unticked. Stage A confirms nothing changed: STATUS.md:50-52 'No gas/state-growth measurement, independent reconstruction, deployment, or production-readiness claim exists'; b0-overview.md:563-566 'Every gas number in the chapters is schedule-derived arithmetic and is a [HYPOTHESIS]'; b0-indexes.md:1870-1880 describes pricing 'as ONE gas snapshot' in future tense; Kanban.md:42 still lists 'price the complete automatic query + Binding/Lens bundle' as Next; and no EFS 2.0 code exists in any repository. The only per-record numbers in the vault are July EAS-era estimates (codex-kernel.md:27 '~22-27k gas/record'). The bundle being priced is the most storage-heavy option in the set by ruling -- mandatory indexing, full-body spine 'PAY IT', no elision 'ETCH IT', plus backlinks, digest index, author index, revocation-aware counters and a per-Binding scope posting -- and candidate falsifier 14 (:437-438) rejects the architecture if 'aggregate gas/state for the mandatory index bundle is not economically credible'. Adoption is gated on the same missing number: the community research makes 'the steward accepts a measured one-year bill' a hard go/no-go and TC-16 asks for fixture bills at 10k items, so no steward can be quoted a price and every product set's on-chain-first posture rests on an unpriced bundle.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Same finding with three fixes. (1) Drop "`freeze-gates.md:49` still shows it unticked": :49 is a row in §B "Executable gates" with no tick state at all, and the file disqualifies itself as evidence — :10 "It is not the current protocol authority and no item below permits a freeze" and :14 "It remains a historical input until regenerated". The currency-safe citation for "still unproduced" is `STATUS.md:50-52` plus `b0-overview.md:563-566`. (2) "The only per-record numbers in the vault are July EAS-era estimates (codex-kernel.md:27)" is wrong twice: `codex-kernel.md:1` is "v2 Codex — Native kernel (Etched artifact)", the 2026-07-07 post-EAS native kernel, not EAS-era; and Stage A carries its own schedule-derived per-write figures (`b0-indexes.md:1491` "≈ 225,000 gas", :1904 "write ≈ +30k gas per"). Say instead: no measured number exists anywhere — every figure is either the July native-kernel estimate or Stage A arithmetic labelled [HYPOTHESIS]. (3) Currency: `readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md:321-333` now carries *executed* solc-0.8.30 gas numbers (first keyed write 44,700 uniform / 44,893 tagged), so "no EFS 2.0 code exists in any repository" is main-only; that same README:331-333 says "These are disposable harness call costs, not aggregate admission or production gas", so the ONE aggregate-bundle snapshot is still unproduced and no steward can be quoted a price.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

The full-bundle ONE gas snapshot (freeze-gates A2) is still unproduced, and the cross-set consequence stands: candidate falsifier 14 ('aggregate gas/state for the mandatory index bundle is not economically credible') is untested while every product set's on-chain-first posture and the community go/no-go both depend on it. Correct three things. (1) Not MVP-blocking: web-client-os/README.md direction 10 chooses Sepolia because it is 'the active near-free shared venue' and V2-E7 forbids venue selection, so this gates GO-FREEZE, falsifier 14 and steward adoption — set mvp_relevant to false. (2) Not undesigned: the measurement is specified and owned in freeze-gates.md:52, V2-E4 and the readiness program's G5, and is scheduled downstream of candidate engineering, so asking for it before the MVP inverts the project's own sequencing. (3) Update the factual claim that no numbers exist — readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md:322-332 now carries measured disposable-harness numbers (44,700 first keyed write; 616,577 then 220,280 for the 64-Principal Lens path), explicitly 'not aggregate admission or production gas'. The residue a PM should act on is a dependency map, not a new gap: name which downstream commitments would have to be reopened if falsifier 14 fires.

**Evidence:** `Designs/efsv2/owner-rulings.md:69-70 ('the ONE gas snapshot ... is not yet produced'); Designs/efsv2/freeze-gates.md:49` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:50-52 (§What remains deliberately unclaimed)` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md:563-566 ('[HYPOTHESIS]'); chapters/b0-indexes.md:1870-1880` · `Designs/efsv2/core-architecture-candidate.md:§Falsifiers item 14 lines 437-438; Kanban.md:42; Designs/efsv2/codex-kernel.md:27` · `Reviews/2026-07-29-target-communities/shortlist-red-team.md:§Portfolio-wide go/no-go gate item 4; requirements-and-first-apps.md:TC-16` · `Designs/efsv2/system-constitution.md:§On-chain graph and indexes ('return the specific capability to James rather than silently deleting it')`

**Re-classified in verification:** severity blocking → important (materiality lens)

**Routing note from verification:** materiality lens: efsv2 (unchanged) — but note this is an unrun gate with four existing records, not an undesigned one

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R2-efsv2-types-ids-oncha-06, J3-adoption-first-07

### CORE-16 — EIP-8037 appears in zero design or Stage A documents although every gas row assumes today's SSTORE schedule

**Owner:** `efsv2` · **Neighbours:** `owner`, `media-library`, `open-web-app-store`, `web-client-os`, `vault-process` · **Severity:** important · MVP-relevant

grep -rn 8037 over Designs/ and the Stage A corpus returns nothing (verified 2026-09-02), yet every price is derived from today's schedule: b0-indexes.md:1374-1379 takes the SSTORE schedule 'from memory' and §9 (:1826-1859) prices each accepted occurrence at 2 new log slots + 1 new overlay slot + ~13,420 per posting append (typical leaf ~187,100, worst ~656,800); b0-authorship-envelope.md §2.5 fixes G_SSTORE_NEW ~= 22,100, c_byte ~= 707 gas/byte, c_occ <= 90,000; b0-encoding-and-ids.md §2.6 budgets one 8,192-byte body at 5.12M gas = 30.5% of the EIP-7825 cap. The evidence round's qualified figure is 'about 4.9x for a net-new storage-slot component only; whole-transaction impact must be measured; L2 adoption unverified' (CORRECTIONS.md:20; state-rent-and-storage-cost.md §1h gives new-SSTORE 20,000->97,920, new account 25,000->183,600, code deposit 200->1,530/byte in a separate state-gas dimension). Applying it, a MAX_BODY_BYTES body would cost ~25M gas against the 16,777,216 cap -- un-admittable in one L1 transaction -- the three per-occurrence slots alone (~294k) exceed c_occ, and maximal T4 evidence (7,808 bytes) ~ 23.9M; because the full-body spine is owner-ruled (owner-rulings.md:67-68), SR-5's fallback of shrinking MAX_ENVELOPE_LEAVES cannot absorb it. Media's 2026-08-22 standards fold added eleven EIPs but not 8037. EIP-8037's own status is UNVERIFIABLE from the vault; the finding is the missing sensitivity row -- falsifier 14 ('aggregate gas/state ... not economically credible') can pass on today's schedule and fail after Glamsterdam, so V2-E4 and the Stage B harness need two schedule columns and V2-E7 an L2-adoption column.

**Evidence:** `grep -rn 8037 Designs/ Reviews/2026-08-13-efs2-stage-a-corpus/ -> 0 hits (2026-09-02)` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:20; README.md:176-181; corpus/venue/state-rent-and-storage-cost.md:§1h lines 129-150` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:§5.3 1370-1379; §9 1820-1859` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-authorship-envelope.md:§2.5 lines 420-458; chapters/b0-encoding-and-ids.md:§2.6 lines 505-527` · `Designs/efsv2/core-architecture-candidate.md:§Falsifiers item 14 line 437; Reviews/2026-08-13-efs2-stage-a-corpus/chapters/vectors-and-falsifiers.md:CF-14 line 1116` · `Designs/efsv2/owner-rulings.md:59, 67-69; Designs/efsv2/owner-decision-inbox.md:V2-E4 lines 40-45; Designs/media-library/media-infrastructure.md:179-206`

**Verified:** not separately verified; clustered from 6 independent lane findings · **Source lanes:** R7a-stageA-b0-ids-envelo-02, R7b-stageA-b0-indexes-le-10, R18-evidence-round-01, S8-evidence-bindings-vs-01, S3-media-x-types-x-index-05, J2-cypherpunk-risk-first-03

### CORE-19 — A stolen or lost EOA permanently captures every Binding the first writer owns, and no current document says so

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner` · **Severity:** important · MVP-relevant

The MVP deliberately ships without rotation or recovery (system-constitution.md:137-139 'A full custom KEL is not frozen into the MVP'; owner-decision-inbox.md P-8 'Deferred beyond the account-Principal MVP'), and its directory entries and file heads are Principal-owned CAS Binding heads (candidate §Binding 222-223). B0 states the consequence internally -- an ungraduated AccountPrincipal 'has no rotation - its authority reference is immutable, so key theft means permanent capture of that PrincipalId's future writes' (b0-principal-authority.md §6.3 1308-1314) -- but grep for theft|stolen|compromis over the efsv2 spine returns nothing and the constitution's acceptance table (:301-318) has no key-loss row. The 2026-07-11 KEL review had already ruled the mitigation and it was dropped: 'publish a salted independent future-control/recovery commitment at first onboarding ... Uncommitted legacy identities retain an explicit irreducible thief race' (P0, line 66), made 'default-on and sponsored' (:147) and recommended in 'Decisions for James' #3 (:201); the greenfield spine keeps only P-8's additive managed-Principal path and P-10, and no spine doc, V2-E1 or V2-F1 mentions the commitment, though the review's P0 says additivity without it is not free. Deferral is defensible; silence is not -- a permanent-public-data product that invites its first real writer needs a one-paragraph limitation and an acceptance row, or it re-introduces under a stronger permanence claim the exact class flagged for v1 (2026-07-10 review C4).

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:§6.3 lines 1308-1314; §6.1 graduatePrincipal RESERVED` · `Reviews/2026-07-11-kel-identity-foundation-review.md:P0 line 66; §User experience line 147; §Decisions for James #3 line 201` · `Designs/efsv2/system-constitution.md:137-139; acceptance table lines 301-318 (no key-loss row)` · `Designs/efsv2/owner-decision-inbox.md:P-8 lines 133-136; P-10; Designs/efsv2/core-architecture-candidate.md:222-223, 254-262` · `grep theft|stolen|compromis over the Designs/efsv2 spine -> 0 hits; Reviews/2026-07-10-efsv2-century-storage-and-cypherpunk-os-review.md:C4 lines 121-135`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** J2-cypherpunk-risk-first-08, R20-older-reviews-02

### CORE-22 — 'Revocation' has no candidate primitive, and the two costed-gate capabilities built on it are designed nowhere current

**Owner:** `efsv2` · **Neighbours:** `owner`, `web-client-os` · **Severity:** important · MVP-relevant

system-constitution.md treats revocation as Realm-qualified state (:107, :156 'Withdrawal, revocation, tombstones, and replacement do not erase prior bytes') and as a counted quantity (:181 'revocation-aware current counts'), but core-architecture-candidate.md §Binding and withdrawal defines only Withdrawal ('its issuer no longer maintains it. It does not delete the Record, retract another issuer's Occurrence, or rewind a Binding') and uses 'revocation' once (:64) with no primitive -- nothing says whether revocation is Withdrawal, a Binding tombstone, or a separate Occurrence-targeting Record, so the 2026-07-15 item E semantics ('count drops when endorsements are revoked') cannot be specified. Downstream, constitution §On-chain graph and indexes (:180-184) promises 'revocation-aware current counts, and deterministic best-locator selection from bounded declared evidence' as costed gates tracing to ruling items C ('best-mirror ranking: ON-CHAIN') and E ('live count: revocation-aware, PAY for it. Do NOT ship advisory only'), and adds 'If the aggregate budget fails, return the specific capability to James rather than silently deleting it'. The candidate has no count or ranking mechanism anywhere (grep 'count' and 'best' return nothing); its IndexSpec[] is scalar equality, reference equality, backlink and an optional compound key, and Locator/1 carries no ranking. Only b0-indexes.md §6 and §7 design them, proposal-only and unintegrated -- so an MVP that omits them owes an explicit owner ask by the constitution's own rule.

**Evidence:** `Designs/efsv2/system-constitution.md:107, 156, 180-184 (§On-chain graph and indexes bullet 6)` · `Designs/efsv2/owner-rulings.md:2026-07-15 items C and E` · `Designs/efsv2/core-architecture-candidate.md:§Binding and withdrawal; line 64; §Indexes; §Content and Locators (no count/ranking)` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:§6 Revocation-aware current counts; §7 Deterministic best-locator selection`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R1-efsv2-spine-06, R1-efsv2-spine-10

### CORE-29 — EIP-7825's 16,777,216 per-transaction gas cap appears nowhere in the current spine, so 'bounded gas' has no ceiling

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner` · **Severity:** important · MVP-relevant

lens-pass-synthesis.md LN-4 (:27) records EIP-7825 as live ('Fusaka, 2025-12-03 ... VERIFIED') and that a 128x55 naive directory page (~29.5M gas) is 'permanently impossible'; Reviews/2026-07-25-lens-pass.md headline 4 records that 'should not promise' became 'cannot deliver'; the 2026-07-10 audit's 'Bounded AND is a candidate generator' section demands two published budgets, a conservative on-chain composability budget well below the cap and a separate RPC eth_call budget. Grep on 2026-09-02 finds zero occurrences of '7825', '16,777,216' or '16.7M' in Designs/efsv2/README.md, system-constitution.md, core-architecture-candidate.md, owner-rulings.md, owner-decision-inbox.md or Designs/web-client-os/README.md. Consequently V2-E2 ('bounded gas'), V2-E4 and owner direction 8 ('64 Principal entries if measurement supports it') name no number the measurement must clear, and the constitution's Contract Lens acceptance trace ('in bounded gas') is unfalsifiable as written.

**Evidence:** `Designs/efsv2/lens-pass-synthesis.md:line 27 (LN-4)` · `Reviews/2026-07-25-lens-pass.md:Headlines item 4; Reviews/2026-07-10-cypherpunk-os-state-of-art-and-coherence-audit.md:§Bounded AND is a candidate generator` · `grep 7825|16,777,216|16.7M over the efsv2 spine and Designs/web-client-os/README.md -> 0 hits (2026-09-02)` · `Designs/efsv2/owner-decision-inbox.md:V2-E2, V2-E4; Designs/efsv2/system-constitution.md:§Architecture-level acceptance tests (Contract Lens row); Designs/web-client-os/README.md:direction 8`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R20-older-reviews-05

### CORE-30 — Sepolia is the first development Commons in five current docs and none says what happens to its data at deprecation

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner`, `arcade` · **Severity:** important · MVP-relevant

Sepolia is named in Designs/efsv2/README.md:9, 30, 44-46; web-client-os/README.md:75-77 (direction 10) and :312-314; product-constitution-and-roadmap.md:309-311; mvp-and-acceptance.md:862-866; Kanban.md:42 -- yet grep for Goerli|Holesky|Ropsten|Rinkeby|Kovan|testnet across the current efsv2 docs and all of Designs/web-client-os returns zero hits. The only lifetime language in the vault is v1-era Arcade text: rights-safety-and-operations.md:79 'Sepolia is a testnet with no guaranteed lifetime (Ropsten/Goerli precedent)' plus the held D7 packet. The evidence is explicit that deprecation destroys data: l1-incidents-and-dead-data.md §B6 (:137-182) 'none of these announcements says anything about preserving data', with Holesky frozen 2026-06-03 on one endpoint, and CORRECTIONS.md:27 records Sepolia permissioning unresolved. Meanwhile the MVP's exact links and receipts point at Sepolia (mvp:110; acceptance C box 11), efsv2/README.md:44 says 'Core and durable links cannot depend on [Commons]' one sentence before naming Sepolia, Stage A QR-1 makes persistence the operator's assertion though EFS does not operate Sepolia, RealmSuccessor/1 is undefined, and the Cross-Realm trace (constitution:315) keeps admissions and Bindings Realm-local -- so no export or re-carriage path exists. The repair is a Realm-deprecation paragraph naming what survives (portable Envelope + Record bytes + digests) and what does not (admissions, Bindings, ordinals), plus DEV_TESTNET labelling of MVP receipts and links.

**Evidence:** `Designs/efsv2/README.md:9, 30, 44-46` · `Designs/web-client-os/README.md:75-77, 312-314; product-constitution-and-roadmap.md:309-311; mvp-and-acceptance.md:110, 409-416, 862-866` · `Designs/arcade/rights-safety-and-operations.md:79; Designs/arcade/owner-decision-inbox.md:D7 lines 51-54` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/l1-incidents-and-dead-data.md:§B6 lines 137-182; CORRECTIONS.md:27, 29` · `Designs/efsv2/system-constitution.md:line 315 (Cross-Realm); Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:§4.1 lines 378-387 (QR-1)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S9-confirmed-then-unread-03

### CORE-31 — Type Schema availability is declared for bytes and only implicit for meaning: spec closures and vectors have no carrier

**Owner:** `efsv2` · **Neighbours:** `sdk`, `web-client-os` · **Severity:** important · MVP-relevant

The bytes are covered: system-constitution.md:210-213 requires Type bytes readable from state, Stage A SR-17 admits Types through ordinary publish, and codexConstants()/genesisFacts() are state-readable (b0-realm-admission.md:1471-1483, 1674-1675). Meaning is not. layered-type-system-and-data-abi.md:241-263 commits a normativeSpecClosureHash and says 'A prose URL alone is insufficient', but :935 makes specs 'Ordinary EFS Records' -- byte-carried content subject to the still-undecided carrier; mvp-and-acceptance.md §I:690-694 puts the 'generated codec closure' in the client adapter; the read ABI lives in §8.2 of a Review chapter; constitution §Freeze discipline 1 (:322-323) requires golden vectors with no retention or publication rule; grep for Sourcify or verified source in the realm chapter returns 0; hierarchical-files-and-folders.md §12 (:1932) lists Type schemas but not spec closures. No fixture anywhere tests state-present/meaning-absent, though the evidence round's cross-domain signal is exactly that shape (README:72-74, Flash-era runtime obsolescence with bytes intact). The repair: require the protocol spec closure (codec, read ABI, vectors) and each Type's normative spec closure to be publishable as EFS artifacts with a declared custody grade, plus a fixture returning UNKNOWN(SPEC_UNAVAILABLE).

**Evidence:** `Designs/efsv2/system-constitution.md:210-213; §Freeze discipline lines 322-323` · `Designs/efsv2/layered-type-system-and-data-abi.md:§1 lines 241-263; line 935` · `Designs/web-client-os/mvp-and-acceptance.md:§I lines 690-694` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:§8.1 lines 1471-1483; §8.2 lines 1674-1675` · `Designs/efsv2/hierarchical-files-and-folders.md:§12 line 1932; Reviews/2026-08-13-claude-evidence-round/README.md:§Cross-domain signal lines 72-74`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S9-confirmed-then-unread-06

### CORE-41 — No efs15 survivor-requirement mapping exists and Stage A carried zero efs15 mechanism-level lessons

**Owner:** `efsv2` · **Neighbours:** `efs15` · **Severity:** important · MVP-relevant

Designs/efs15/README.md rule 1 says 'Reuse a requirement, test, or failure analysis only after mapping it to [[../efsv2/system-constitution]]', and no such mapping exists anywhere in the vault. The Stage A carry-in register (corpus/carry-in-register.md, index OR-1..7/DI-1..14/HY-1..5/RJ-1..4/PR-1..5) imports lens-pass, KEL, privacy and on-chain-completeness lessons and itself complains that the spine carries results 'only at requirement level', while a grep of the whole Stage A corpus for efs15|efs-id-1|EFS-ID/1 returns zero hits outside a quotation of the 2026-08-08 ruling in corpus/proposed-spine-edits.md:824. The efs15 two-fold state machine, three-level idempotency fold, bounded-module discipline and roughly forty golden/failure vector categories therefore risk being rediscovered or contradicted in Stage B.

**Evidence:** `Designs/efs15/README.md:§Rules for reuse item 1` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/carry-in-register.md:header ('only at requirement level') and Index line` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:824 (only efs15 mention in the corpus)` · `Designs/efs15/efs-id-1-candidate.md:§Receipt aggregation and slot resolution; §Required golden and failure suite`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R15-efs15-evidence-02

### CORE2-14 — Mandatory index bundle: no gas snapshot, no EIP-8037, no venue set, no threshold

**Owner:** `efsv2` · **Neighbours:** `media-library`, `open-web-app-store`, `web-client-os`, `owner` · **Severity:** important · not on the MVP path

`owner-rulings.md` §2026-07-15 names 'the ONE gas snapshot (freeze-gates A2)' as the 'Blocker to final sign'; Stage A `STATUS.md` says 'No gas/state-growth measurement ... exists' and every Stage A gas row is '[HYPOTHESIS] schedule-derived arithmetic'. A vault-wide grep for 8037 returns zero hits in Designs/ and zero in the Stage A corpus, although `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md`:20 records 'about 4.9x for a net-new storage-slot component. Full EFS transaction impact depends on the final record/write layout and must be benchmarked; L2 adoption was unverified'. The mandatory bundle (full-body spine + general/predicate backlinks + digest index + author index + revocation-aware counters, plus one BindingScope posting per first Binding per `hierarchical-files-and-folders.md`:2151-2170) is the most storage-heavy choice in the set and the 07-15 ruling said 'PAY for it' with no numbers; at 4.9x one MAX_BODY_BYTES (8,192-byte) Record approaches the 16,777,216 EIP-7825 cap the chapters treat as hard physics, and the full-body spine is owner-ruled (items 17/18) so the exposure cannot be absorbed by shrinking leaf counts. `core-architecture-candidate.md` falsifier 14 ('aggregate gas/state for the mandatory index bundle is not economically credible on the intended L2/L3 profile') has no threshold and no such profile exists: V2-E4 (`owner-decision-inbox.md`:40-45) prices the bundle with no venue or schedule, V2-E7 lists 'fees' as a venue axis with no bundle and says 'Do not select a chain yet', Sepolia is development-only by direction 10, and 'Fresh qualifying L3' is undefined — while the evidence makes venue dominant (one 250k-gas record ≈ $0.025 on L1 / $0.00048 on OP at the 2026-08-13 snapshot, ≈ $29 on L1 at Dec-2024 gas, ≈ $120 under EIP-8037 at that gas). Repair: V2-E4 names a fixed benchmark venue set (L1 + one named L2 + Sepolia) and reports the bundle per venue, per schedule, with a current and an 8037 column.

**Evidence:** `Designs/efsv2/owner-rulings.md:§2026-07-15 (bundle blocker sentence), 49, 67-69` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:§What remains deliberately unclaimed` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:20-21; README.md:175-182` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/commons-realm-venue-matrix.md:32, 34, 86-93, 127` · `Designs/efsv2/core-architecture-candidate.md:§Falsifiers item 14, 437-438` · `Designs/efsv2/owner-decision-inbox.md:40-45 (V2-E4), 62-68 (V2-E7)` · `Designs/efsv2/hierarchical-files-and-folders.md:2151-2170` · `grep -rn 8037 Designs/ Reviews/2026-08-13-efs2-stage-a-corpus/ → 0 hits`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R2-efsv2-types-ids-oncha-05, J1-mvp-first-11, S8-evidence-bindings-vs-02

### CORE2-16 — 'Qualifying' Realm is load-bearing in the constitution and defined nowhere

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner` · **Severity:** important · not on the MVP path

`Designs/efsv2/system-constitution.md` line 38 ('a qualifying EVM Realm can deploy'), line 303 ('Fresh qualifying L3' as an architecture-level acceptance test) and `Designs/efsv2/README.md` line 45 all rely on the adjective, and the only related open item is the Realm-descriptor question (constitution:353; core-architecture-candidate.md:443; owner-decision-inbox.md §V2-E5). `Reviews/2026-08-13-claude-evidence-round/corpus/venue/commons-realm-venue-matrix.md` §5 proposes disqualifiers D1-D8 (reconstructible from parent by permissionless software; escape path without sequencer; proposer failure must not freeze withdrawals; two implementations; no RaaS key custody without handover/retention obligations; deleted-history record; silent guarantee downgrade; deterministic deployment + prerequisites), grounded in R-M2/E-4/R-D3/O-1 and explicitly 'not applied as verdicts', and notes CreateX/ERC-2470 are absent on Degen/Xai. None of this is cited from a current design, so the flagship acceptance test 'Fresh qualifying L3' is untestable as written.

**Evidence:** `Designs/efsv2/system-constitution.md:lines 38, 60, 303, 353` · `Designs/efsv2/README.md:line 45` · `Designs/efsv2/owner-decision-inbox.md:§V2-E5 lines 47-52` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/commons-realm-venue-matrix.md:§5 lines 140-155; §4 item 5` · `Designs/efsv2/assumptions-and-requirements.md:R-M2 (146), R-D3 (157), E-4 (263), O-1 (271)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R18-evidence-round-08

### CORE2-23 — No App Store, Media or realistic-package fixture in Stage A; nobody owns adding one

**Owner:** `efsv2` · **Neighbours:** `open-web-app-store`, `media-library`, `arcade` · **Severity:** important · not on the MVP path

`b0-content-locators.md` §7 (584-589) and §8.4 (746-754) pin MAX_CLOSURE_MEMBERS = 16 under the [HYPOTHESIS] REF_INSTANCES_MAX = 16, its own falsifier (b) (1177-1180) names 'real Arcade packages past nesting depth 4' as the risk, and §8.3 requires every member ChunkTree COMPLETE before execution — yet the corpus's largest closures are 2 members (FX-ARC, harness line 723) and 4 shards (FX-BROWSE, line 1210), and the fixture list §2.1-2.10 contains no App Store, Media or Files trace. `Designs/open-web-app-store/architecture.md`:854-857 says the 16-member limit, walk-depth bound, 64-Principal Lens and index bundle cost 'remain unmeasured'; `Designs/media-library/media-infrastructure.md`:119-125 cites the chapters as inputs only. On the media side the gap is explicit and circular: `Designs/media-library/owner-decision-inbox.md` MEDIA-E2 (29-37) is 'downstream of V2-E4' and needs 'the complete automatic index bundle, selective 2/3/5-tag traces, hot-tag/churn behavior', `query-and-indexing.md` (309-340) asks for p50 35 / p95 100 tags per public item at 10k and synthetic 1m 'beside—not silently inside—the generic Stage A corpus', while V2-E4's text (`Designs/efsv2/owner-decision-inbox.md`:40-45) names no such workload and the harness prices ONE aggregate bundle per corpus whose only tag rows are FX-TOPIC (40 TopicTag occurrences) and WL-HOT (20,000 refs across 1,000 targets) — no per-item tag density, intersection, denial churn or curator filter. The launch plan already specifies the fixture in prose and its confidence table says 'The 10k/1m economics and latency are viable — Unknown — must be measured' (`gallery-opportunity-ranking-and-launch-plan.md`:415). Repair: the efsv2 harness adds FX-MEDIA and a realistic-package/closure row or records a dated decline, and each product lane converts its prose fixture into a harness-shaped spec.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:§7 584-589; §8.3 712-728; §8.4 746-754; 1176-1182` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:§2.1 line 723; §2.6 1022-1037; §2.10 line 1210; §4 WL-HOT 1867-1875; 1782-1795` · `Designs/open-web-app-store/architecture.md:822, 854-857` · `Designs/media-library/media-infrastructure.md:119-125` · `Designs/media-library/owner-decision-inbox.md:MEDIA-E2 lines 29-37` · `Designs/media-library/query-and-indexing.md:309-340` · `Designs/efsv2/owner-decision-inbox.md:V2-E4 lines 40-45` · `Reviews/2026-07-29-target-communities/gallery-opportunity-ranking-and-launch-plan.md:183-192, 415`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R7b-stageA-b0-indexes-le-07, S3-media-x-types-x-index-03, R13-media-library-04

### CORE2-53 — The Graph fallback needs a Core/Realm event surface that no efsv2 doc owns

**Owner:** `efsv2` · **Neighbours:** `media-library` · **Severity:** important · not on the MVP path

`Designs/media-library/query-and-indexing.md` §Indexing inputs (219-224) requires that 'Core/Realm events must be sufficient to discover admissions, withdrawals, Bindings and other state changes' for the reference subgraph, and admits 'The current Stage A event parity is not yet proved'. `core-architecture-candidate.md` and `b0-overview.md` define no indexer event surface (grep 'event' returns only Occurrence-as-publication-event), and `system-constitution.md` 209-213 says only that canonical bytes are 'never replaced by ... event logs'. The July target 'confirm EFS stays cleanly subgraph-indexable' (`fable-next-pass-scope.md`:39) is historical evidence, so the Graph escape hatch named by the 2026-08-14 media ruling has no Core-side obligation feeding it.

**Evidence:** `Designs/media-library/query-and-indexing.md:Indexing inputs lines 219-224` · `Designs/efsv2/system-constitution.md:lines 209-213` · `Designs/efsv2/core-architecture-candidate.md (grep 'event' — no indexer surface)` · `Designs/efsv2/fable-next-pass-scope.md:line 39 (historical)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R13-media-library-06

### PRD-47 — No Designs/git-forge/ exists while three sets delegate to a Git/Forge PM; the card expired and GD-1..GD-5 vanished

**Owner:** `git-forge` · **Neighbours:** `vault-process`, `owner`, `web-client-os`, `open-web-app-store`, `efsv2` · **Severity:** important · not on the MVP path

ls Designs/ shows arcade, clientv2, efs15, efsv2, media-library, open-web-app-store, web-client-os and root sdk-*.md only - no git-forge folder. Three current sets delegate to that owner: web-client-os/README.md:414 ('Arcade, Media, Git/Forge, EAP, Nanda, and other PMs own their domain semantics and pressure fixtures') and :570 (Git/Forge owner review before promotion), mvp-and-acceptance.md:852, open-web-app-store/README.md:122 ('Git-native identity, clone/fetch/push, source collaboration, forge workflows, and Git transport stay with Git/Forge') and :264, plus Stage A traceability.md:237 deferring AT-9b to a 'Git client-profile lane'. The Kanban card claimed 2026-08-14 by @git-forge expired 2026-08-17 (scripts/stale-cards.sh, run 2026-09-02: 'STALE (expired 2026-08-17, today 2026-09-02)') after one commit (8b81bdd) and one status line. The owner packet GD-1...GD-5 (Reviews/2026-08-07-efs-git-deep-dive.md §6) appears in no live queue, no superseded list and no hold record - zero hits across both inboxes, Open-Decisions.md and Owner-Inbox.md - and owner-rulings.md §2026-08-07 explicitly 'does not ... answer GD-1...GD-5'. A minimal peer folder would need: README (standing plus greenfield banner and crosswalk), owner-decision-inbox (GD recut or held), requirements in Record/Occurrence/Binding vocabulary, an application-profile doc choosing GitPushTransaction/1 + Binding CAS versus the fold, a Markdown-history doc, an FX-GIT fixture delta, and a cut list.

**Evidence:** `Designs/ directory listing (no git-forge)` · `Designs/web-client-os/README.md:414, :570; mvp-and-acceptance.md:852` · `Designs/open-web-app-store/README.md:122, :264` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:237 (AT-9b DEFERRED)` · `Kanban.md:36-37; scripts/stale-cards.sh output 2026-09-02; Daily Notes/agent-status.md:206` · `Reviews/2026-08-07-efs-git-deep-dive.md §6 (GD-1..GD-5); Designs/efsv2/owner-rulings.md §2026-08-07` · `Open-Decisions.md, Owner-Inbox.md, both inboxes (zero GD hits)`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R16-git-forge-10, S4-git-x-types-x-core-08, S13-never-decided-18

### PRD-21 — No candidate IndexSpec declaration exists for any media profile Type although the ruling makes media the declarer

**Owner:** `media-library` · **Neighbours:** `efsv2` · **Severity:** important · not on the MVP path

The 2026-08-14 ruling makes the Type creator the declarer of indexes (Designs/efsv2/owner-rulings.md:203-205; system-constitution.md:171-174), and media says to 'choose only fields real media traces require' (media-infrastructure.md:116), lists media-query indexes as proposal-only and asks which fields justify indexes (query-and-indexing.md:392-393; README.md:94) - but no document lists even a disposable candidate. Unanswered: which roles carry REF_BACKLINK, whether ExactBlob declares DIGEST_EQ (without which Q1 exact-digest is not an on-chain query), whether evidenceRefs[] counts against REF_INSTANCES_MAX = 16, and how many of MAX_INDEX_SPECS = 8 each Type uses (b0-encoding-and-ids.md:482-483). The App Store fixture did exactly this for its Types; media's equivalent sits in experiment commit e9652d3 outside the vault. Without it the aggregate bundle cannot include media and per-leaf fan-out is unknown. Repair: a one-page disposable declaration table per profile Type.

**Evidence:** `Designs/efsv2/owner-rulings.md:203-205; system-constitution.md:171-174` · `Designs/media-library/media-infrastructure.md:116; README.md:94; query-and-indexing.md:392-393` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md:482-483`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S3-media-x-types-x-index-08

### PRD-28 — No first-order estimate of a booru post write cost exists although B0's rows permit one; p95 posts are multi-transaction

**Owner:** `media-library` · **Neighbours:** `efsv2` · **Severity:** important · not on the MVP path

Media refuses to 'invent gas limits' (query-and-indexing.md:363-364) and the launch plan says economics are 'Unknown - must be measured', but B0's [HYPOTHESIS] rows already permit an estimate (inference from b0-indexes.md:738-746,:1089-1094,:1826-1843,:1865-1866): one TagAssertion leaf with two reference roles is about 174k gas, with mandatory families dominating so declared IndexSpecs are not the lever; a p50 35-tag post is about 6.1M, roughly 36% of the 16,777,216 cap, before Post/Representation/ChunkTree/Locator leaves; a p95 100-tag post is about 17.4M, exceeding the cap and MAX_ENVELOPE_LEAVES = 64, so at least two transactions per post; every extra curator re-asserting pays again, and a 10k seed is about 7e10 gas. That makes Slice 2 signing and 'resumable signed batch ingest' structural rather than an optimization (booru-app.md:164-166,:323-326). Repair: media records the arithmetic as a design risk and names the multi-transaction post as a Slice 2 object; efsv2 names per-item reference density as a V2-E4 bundle dimension.

**Evidence:** `Designs/media-library/query-and-indexing.md:363-364` · `Reviews/2026-07-29-target-communities/gallery-opportunity-ranking-and-launch-plan.md:274, 369, 415` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:738-746, :1089-1094, :1826-1843, :1865-1866` · `Designs/media-library/booru-app.md:164-166, :323-326` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:50-51`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S3-media-x-types-x-index-04

### PRO-12 — OS Drives is a reviewer handle, not a lane: no folder, owner, queue, or card

**Owner:** `owner` · **Neighbours:** `efsv2`, `web-client-os`, `media-library`, `vault-process` · **Severity:** important · not on the MVP path

Designs/web-client-os/README.md line 7 records an "@os-drives-pm boundary review (2026-08-14)" and its §Ownership boundaries (line 413) assigns "native handles, host aliases, projection behavior, errors, metadata projection, daemons, packaging, and three-host validation" to OS Drives; mvp-and-acceptance.md:449 and 853, architecture-and-modules.md:1190, web-platform-standards-and-forward-profile.md:266 ("Native Drive adapters remain the OS Drives PM's lane") and Designs/media-library/plex-jellyfin-app.md §Tentative technical shape (lines 193-240: "Most of that work belongs on a trusted local media agent or home server, not in a browser, EVM contract or public index") all delegate to it. No Designs/*drive* folder, README, owner-decision-inbox, owner-rulings, Kanban card, Glossary entry, Onboarding/authority.md scope or agent-status line exists for the role — vault-wide the only "drive" hit is Reviews/2026-07-29-ardrive-teardown-corpus. Yet the adopted 2026-07-22 three-host read-only mount ruling (owner-rulings.md lines 104-120, reaffirmed 136; system-constitution.md line 316) and the V2-F2 release gate "mounted-filesystem traces" (owner-decision-inbox.md lines 87-92) depend on it, and Stage A marks C-FS-1/C-FS-2/AT-14 "DEFERRED(mount lane)" (traceability.md:212-213, 242). The projection design actually lives in hierarchical-files-and-folders.md §10 (lines 1580-1852), whose Target repos line 4 omits the drive repo its line 5 proposes, and the only concrete artifact — docs/superpowers/plans/2026-08-14-efs2-files-readonly-mounts.md (Rust ../drive/, libfuse3/macFUSE/WinFsp, Tasks 1-8, commit 02bdae9) — is referenced by nothing and sits outside Designs/ where no script or content map sees it. Media's Plex Slices 1-2 rest on the same unowned platform; the mount is correctly post-MVP, the missing lane is not.

**Evidence:** `Designs/web-client-os/README.md:7, 406-414 (Ownership boundaries), 78-80` · `Designs/web-client-os/mvp-and-acceptance.md:96, 449, 853` · `Designs/web-client-os/architecture-and-modules.md:1190; web-platform-standards-and-forward-profile.md:266; product-constitution-and-roadmap.md:246` · `Designs/efsv2/owner-rulings.md:104-120, 136; system-constitution.md:316` · `Designs/efsv2/owner-decision-inbox.md:87-92 (V2-F2 'mounted-filesystem traces')` · `Designs/efsv2/hierarchical-files-and-folders.md:4-5, §10 1580-1852, 2278` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:C-FS-1, C-FS-2, AT-14, OR-M, 212-213, 242` · `docs/superpowers/plans/2026-08-14-efs2-files-readonly-mounts.md:1-30; git log → 02bdae9 (2026-08-14)` · `Designs/media-library/plex-jellyfin-app.md:13-18, 193-240, 467-468` · `ls Designs/ (no drive folder); Glossary.md (no Mount/Drive); Onboarding/authority.md §Scopes; Kanban.md`

**Verified:** not separately verified; clustered from 5 independent lane findings · **Source lanes:** R3-efsv2-files-03, R17-sdk-and-mounts-06, S6-sdk-and-mount-spread-10, S13-never-decided-17, R13-media-library-11

### PRO-21 — Preservation operations and the durability economy have no owner after the reset

**Owner:** `owner` · **Neighbours:** `efsv2`, `open-web-app-store`, `arcade`, `media-library` · **Severity:** important · not on the MVP path

owner-rulings.md lines 36-37 (2026-07-10) set storage as on-chain + Arweave with optional IPFS; the 2026-08-12 reset (line 178) "supersedes earlier mechanism-level rulings" and never restates a durability baseline; system-constitution.md contains no "Arweave" or durability tier (grep), and solana.md §12 line 435 asks "does the current on-chain + Arweave ruling stay mandatory" with no answer anywhere. The century review's C5 ("Copyability is present; preservation operations are not") and C6 ("There is no durability economy… Admission gas funds admission. It does not fund a century of audits") and its recommended four-copies / three-administrators / funded-runway architecture were carried into assumptions-and-requirements.md only as "Proposed" rows R-M3 (line 147), O-2/O-3 (lines 272-273) and D-8 (line 456) — a document now demoted by its own 2026-08-12 greenfield banner — and a 2026-09-02 grep for century/custody/audit/funding/Century Profile finds zero hits in README.md, system-constitution.md, core-architecture-candidate.md, owner-rulings.md or owner-decision-inbox.md; the review is not indexed in Reviews/README.md and has zero Designs backlinks. The App Store borrows TUF freshness roles with no monitor (open-web-app-store/README.md:47-52), Arweave survives only as a transport adapter (architecture.md:195), and the funded channel-monitor P6 (client-os-pressure-report.md:112; os-pass-handoff.md:44 "James (resourcing)") appears nowhere current, while Designs/efsv2/README.md line 43 still promises "independent reconstruction" as a Core value. Not MVP-blocking — README Hard holds make MVP data disposable — but any public "durable" claim, and Designs/arcade/README.md line 41's single-VPS pins, rest on nothing.

**Evidence:** `Designs/efsv2/owner-rulings.md:36-37, 178` · `Designs/efsv2/assumptions-and-requirements.md:A-5 248; R-M3 147; O-2/O-3 272-273; D-8 456; Greenfield correction banner` · `Designs/efsv2/solana.md:§12 line 435` · `Reviews/2026-07-10-efsv2-century-storage-and-cypherpunk-os-review.md:C5, C6; §6 'Start with a plural replica policy'` · `Designs/efsv2/client-os-pressure-report.md:P6 line 112; Designs/efsv2/os-pass-handoff.md:44` · `Designs/open-web-app-store/README.md:47-52; Designs/open-web-app-store/architecture.md:195` · `Designs/efsv2/README.md:43; §Hard holds` · `Designs/arcade/README.md:41; Open-Decisions.md:D7`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R5-efsv2-context-require-04, R20-older-reviews-07

### PRO-25 — The Glossary defines the July vocabulary, not the current one; 'Kernel' collides

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `web-client-os`, `open-web-app-store` · **Severity:** important · MVP-relevant

Glossary.md (git last touch 2026-08-13) has no entries for Binding, BindingScope, ResolutionPlan (only parenthetically inside Lens), Locator (used inside the DATA, MIRROR and Realm entries but never defined), Context, Admission/receipt, PackageHandoff, File/Directory Object, FileRevision, FilesRouter, View/QueryProfile, CROPS, Stage A/B, or Reader Kernel/BIOS/Shell. Its "Kernel" entry defines only the v1 EFSIndexer.sol while Designs/web-client-os/README.md uses Kernel throughout ("BIOS -> Kernel -> Shell -> Apps", "Reader Kernel", "System Kernel services"), and "Durable (permanence tier)" still cites v1 devnet contracts and deployedContracts.ts. Alphabetical order is also broken (EFS Commons/Core/OS/Web Client between Attestation and DATA; Owner after Principal; Resolved view before PROPERTY). The vault's shared vocabulary therefore does not cover the terms the MVP write journey is specified in, and one term actively means two different things.

**Evidence:** `Glossary.md:entry list (## headings); §Kernel; §Durable (permanence tier); §Lens (candidate name: Resolution Plan)` · `Designs/web-client-os/README.md:§Current recommendation (Reader Kernel); 'BIOS -> Kernel -> Shell -> Apps'` · `git log -1 -- Glossary.md (2026-08-13)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R19-process-rulings-ledg-11

### PRO-33 — Stage A's deferrals and owner-routed items point at lanes and channels that do not exist

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `sdk`, `web-client-os`, `owner` · **Severity:** important · not on the MVP path

traceability.md §8 note (iii) names eight legal homes for the 20 DEFERRED and 4 GAP rows; of those only V2-E6 (Kanban line 11), the mount lane (Kanban line 15) and V2-E8-adjacent (Kanban line 21 backlog) have any vault work. The KEL/succession round (OR-2, OR-G, OR-P, OR-R, S-SUCC, G-2), the Stage-B crypto round (C-PS-4b, S-RP7, G-3), the client/lens-compiler lane (C-LN-3b) and the SDK/result-model chapter (G-5, S-G10) have no card and no folder, and the root Designs/sdk-*.md are v1 (sdk-architecture.md depends on ADR-0031/0041, last touched 2026-06-20). S-SUCC is marked "freeze-blocking" and §9 says V2-F1 blocks on "the succession vector classes", so the freeze gate depends on a round nobody owns; three rows (C-LN-2b "post-B0 lens round", C-LN-5b "OS/client lens lane", C-PS-2b "client/OS lane") name homes outside the eight-home list the table calls exhaustive. Two owner-routed items are also filed where James will never see them: b0-overview.md §5 item 1 says the per-Realm chains-don't-die scope "is surfaced to James only through the proposed spine edits (item A2), not asked now" and proposed-spine-edits.md §A2 calls itself "the sole owner-routed scope proposal", while traceability.md §7 G-6 says to carry the all-TypeSchemas index "as a one-line question in the synthesizer's James packet" — neither appears in owner-decision-inbox.md (V2-E5's text does not mention the persistence assumption), Open-Decisions.md reports "Ask now: 0", and no "James packet" exists.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:§6.2 S-SUCC, §7 G-2..G-6, §8 note (iii), §9 V2-F1 feed` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md:§5 item 1` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:§A2 Authority routing; Open items 1` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:§Honest gaps and deferrals` · `Kanban.md: grep KEL/succession/crypto/lens-compiler/SDK (no cards)` · `Designs/sdk-architecture.md:header lines 1-8` · `Designs/efsv2/owner-decision-inbox.md:§V2-E5; Open-Decisions.md:8 ('Ask now: 0')`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R6-stageA-overview-08, R6-stageA-overview-14

### CLI-06 — The vault's own 2026-08-13 Safari runner measurements are cited by no design document

**Owner:** `web-client-os` · **Neighbours:** `arcade` · **Severity:** important · MVP-relevant

Reviews/2026-08-13-claude-evidence-round/corpus/runner/browser-runner-measurements.md measured Safari 26.5.2 giving an opaque srcdoc child no process isolation (a three-second busy loop froze the host page 3,027 ms versus 51 ms in Chrome, lines 150-166), about 22 rAF/s and about 34 ten-millisecond timer ticks per second for any cross-origin child while the host ran 60 — a penalty that "follows cross-origin-ness, not the sandbox attribute" (173-185) — open fetch/WebSocket egress with a socket lingering about 5.6 s after iframe.remove() (187-216), and the inversion where allow="fullscreen" alone disables fullscreen while legacy allowfullscreen alone enables it, reproduced three times (137-148). Designs/web-client-os/app-runtime-and-direct-launch.md integrates only the hang and egress shapes in prose (:644-650 "Sandboxing does not by itself block HTTP, WebSocket..."; :707-710 "not proof that the frame had a separate renderer/process"), never cites the measurement file, omits the frame/timer throttle and the fullscreen trap entirely, and its "Current primary evidence" (:1037-1089) lists only external sources with Safari named merely as a future test target (:935, :1109); web-platform-standards-and-forward-profile.md §Named product profiles lists "direct egress/renderer DoS remain named residuals" with no citation. Designs/arcade/player-security-model.md:31 (T5) accepts hangs "at demo scope" and says frames "typically share the parent renderer process", while the candidate game runs a setTimeout loop at 50 fps and calls canvas.requestFullscreen() (andromeda-evidence-reproduction.md:96,:106,:107), so it would be timer-capped and possibly fullscreen-blocked in Safari. Greps across Designs/ for '22 fps', 'rAF/s', 'process isolation', 'browser-runner-measurements', '2026-08-13' and 'allowfullscreen' return zero hits. CORRECTIONS.md:24 limits all of it to one machine and mostly n=1, so the repair is measured-residual fields on RunnerRealization (frame/timer cap, observed process isolation, fullscreen-attribute form) plus an Arcade Safari/iOS smoke row — not a policy.

**Evidence:** `Reviews/2026-08-13-claude-evidence-round/corpus/runner/browser-runner-measurements.md:21-27, :137-148 (fullscreen inversion), :150-166 (3027 ms host freeze), :173-185 (~22 rAF/s, ~34 ticks/s), :187-216 (~5.6 s WebSocket linger)` · `Designs/web-client-os/app-runtime-and-direct-launch.md:644-650, :707-710, :935, :1037-1089, :1108-1109` · `Designs/web-client-os/web-platform-standards-and-forward-profile.md:§Named product profiles (Opaque Full-Web App row)` · `Designs/arcade/player-security-model.md:31 (T5), :79, :82; Designs/arcade/README.md:15-16` · `Reviews/2026-08-13-claude-evidence-round/corpus/arcade/andromeda-evidence-reproduction.md:96, :106, :107 (50 fps setTimeout loop; canvas.requestFullscreen)` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:24 ('Browser behavior is universal' correction, n=1 one Mac)` · `grep '22 ?fps|rAF/s|process isolation|browser-runner-measurements|allowfullscreen' Designs/ -> 0 hits`

**Verified:** not separately verified; clustered from 5 independent lane findings · **Source lanes:** R18-evidence-round-05, R9-wco-architecture-runt-03, R10-wco-technology-stand-12, S2-arcade-x-appstore-x-r-05, S8-evidence-bindings-vs-07

### CLI-08 — Signing ceremony has duties but no rendering rules, no visible-signing spec, no fixture

**Owner:** `web-client-os` · **Neighbours:** `clientv2`, `sdk`, `efsv2` · **Severity:** important · MVP-relevant

July specified the secure-prompt surface in mechanism — Designs/clientv2/shell-and-sessions.md:122-161 (T1-T12: full identifiers via <efs-identifier>, no default-focused accept, 500 ms/3 s activation delays, Kernel-derived requester identity, app-supplied strings quoted, an address-poisoning check, T10 external surface above a threshold, plus R0-R3 routing) and wallet-and-actions.md §The signing ceremony (141-183) — and the spine retained only duties: architecture-and-modules.md:275-297 (Layer 1.5 "interaction gating and external confirmation where policy requires it") and :957-975, WCOS-R25, and mvp-and-acceptance.md:71-79 ("Preview ... in trusted System Chrome" plus "sign ... separately"). No web-client-os document contains a rule for identifier rendering, gating or app-string quoting (greps for efs-identifier, full address, truncat, activation delay, negative indicator, poisoning return only unrelated hits). None says what the wallet displays for the envelope versus the intent, in what order, what happens when the first signature succeeds and the second is cancelled (fixture C, mvp:398-400, names "user cancellation" but not the half-signed case), whether a digest cross-check is required (ERC-7730 is "Draft; watch", ethereum-standards-and-interop.md:207), what the ActionReceipt contains ("current names illustrative", mvp:834), or what the person keeps afterwards beyond an "exact guest link" (mvp:223). MVP fixture §C (370-424) tests provider handling and plan fields, never ceremony rendering, yet the MVP threat model trusts "the exact client/BootGeneration bytes and conserved System Chrome" (mvp:781-789) — a write-capable MVP whose wallet preview can be spoofed by display has no defensible security claim. Repair: a trusted-ceremony-profile subsection under architecture-and-modules.md Layer 1.5 plus one fixture row in mvp §C, sourced from shell-and-sessions.md, wallet-and-actions.md and Reviews/2026-07-07-clientv2-corpus/research/secure-ui.md.

**Evidence:** `Designs/clientv2/shell-and-sessions.md:122-161 (T1-T12 secure prompts, R0-R3 routing)` · `Designs/clientv2/wallet-and-actions.md:§The signing ceremony lines 141-183` · `Designs/web-client-os/architecture-and-modules.md:275-297 (Layer 1.5); :957-975 (promotion sequence)` · `Designs/web-client-os/mvp-and-acceptance.md:71-79; :218-223; :370-424 (fixture C); :398-400; :834; :781-789 (threat boundary)` · `Designs/web-client-os/ethereum-standards-and-interop.md:200, 207 (ERC-7730 'Draft; watch'), 229-239` · `Designs/web-client-os/product-constitution-and-roadmap.md:173 (WCOS-R25)` · `grep 'efs-identifier|full address|truncat|activation delay|negative indicator|poisoning' Designs/web-client-os/ -> only unrelated hits`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R11a-clientv2-thesis-ker-06, R11b-clientv2-packages-w-03

### CLI-11 — Owner-named sensitivity policy layer designed by neither the privacy pass nor client/OS

**Owner:** `web-client-os` · **Neighbours:** `efsv2`, `owner` · **Severity:** important · not on the MVP path

On 2026-07-10 James ruled public-by-default and named a deliverable: "a sensitivity policy layer — OS/app declares which record-classes/paths are sensitive-by-default... sensitive folders make children sensitive by inheritance; a make private action for opt-in. Client/OS convention... fold into the in-flight privacy pass as a named subsystem, not a footnote" (Designs/efsv2/owner-rulings.md:30-33), calling it "the tuning knob between viral/shared and safe" and marking it iterable and NOT freeze-bound. The privacy pass ruling record Designs/efsv2/privacy-pass-synthesis.md §1 PC-1...PC-14 (17-45) contains no such subsystem, and Designs/efsv2/privacy.md:60 and :182 still propose "OS tier private-by-default" as an open James decision after the ruling. The constitution reduces it to two sentences (system-constitution.md:243-245, :254-256: "Client/OS sensitivity policy encrypts sensitive or explicitly private plaintext before signing or publication and warns about permanent metadata exposure"). The set assigned the convention has not designed it: Designs/web-client-os/privacy-and-agents.md never mentions it — greps for sensitiv, classifier and 'make private' across Designs/web-client-os/*.md return zero hits — and never restates "public by default"; it reserves zones and storage classes but no classifier, inheritance rule or make-private seam. Not MVP-blocking, since the MVP is public-only (privacy-and-agents.md:91) and the write preview shows "public permanence" (mvp-and-acceptance.md:71-73), but the named deliverable has no owner and no design.

**Evidence:** `Designs/efsv2/owner-rulings.md:§2026-07-10 Public-by-default lines 30-33` · `Designs/efsv2/privacy-pass-synthesis.md:§1 PC-1...PC-14 lines 17-45` · `Designs/efsv2/privacy.md:§3.4 line 60; Open questions line 182` · `Designs/efsv2/system-constitution.md:243-245, 254-256` · `Designs/web-client-os/privacy-and-agents.md:§Privacy constitution, §Data and execution zones, line 91` · `Designs/web-client-os/mvp-and-acceptance.md:71-73` · `grep 'sensitiv|classifier|make private' Designs/web-client-os/*.md -> 0 hits`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R8-wco-product-mvp-priva-13, R4-efsv2-identity-lens-p-07

### CLI-12 — July File Browser feature bar has no disposition; two-thirds vanished silently

**Owner:** `web-client-os` · **Neighbours:** `clientv2`, `vault-process`, `media-library`, `efsv2` · **Severity:** important · MVP-relevant

Designs/clientv2/file-browser-requirements.md (2026-07-29; MATCH/DIFFER/SKIP buckets, journeys J1-J13, 19 acceptance tests derived from the ArDrive teardown and a mainstream-drive baseline) is the vault's only competitive feature floor for the File Browser, and no file under Designs/web-client-os/ references it, ArDrive or the mainstream baseline (grep: zero hits). README.md §Historical Client/OS audit (374-401) has no row for it, the "Historical evidence retained" paragraph (356-361) does not name it, and the WCOS ledger has no Files-feature rows beyond reads (R7-R13) and the three MVP writes (R14-R19). Mapping the bar against mvp-and-acceptance.md and product-constitution-and-roadmap.md: of 15 MATCH items 5 are lost with no deferral (A2 ingest proof/dedupe/bulk receipt, A4 published size ceilings, A8 recents/activity, A11 usage meter and cost dry-run, A12 the "<5 min, $0, no token purchase" funnel); of 14 DIFFER items 9 are lost or half-lost (B4 three-act deletion vocabulary, B5 restore and derived-from, B6 publish-a-folder/mutable pointer/headless CI, B8 chains-as-drives, B9 daily-return, B10 succession packet and exit-grade .efs-bundle, B13 licensing, B14 fixity/durability audit, L2-L5 lens UI); of 19 acceptance tests only 3, 13, 15 and 19 survive intact. Meanwhile Designs/clientv2/README.md:69 still lists it as "Competitive input", the clientv2 inbox still marks it live product pressure, and Kanban.md:51-52 keeps an Under Review card with no expiry "Awaiting review of the #status/draft requirements doc". README.md:403-404 says "deferring a feature from the MVP does not discard its requirement" — true only if the requirement is written somewhere current; today the MVP's usability floor is defined by nobody.

**Evidence:** `Designs/clientv2/file-browser-requirements.md:1-40; §Bucket A lines 34-52; §Bucket B lines 54-79; §Acceptance tests lines 120-142` · `Designs/web-client-os/README.md:356-361, :374-404 (no row for file-browser-requirements)` · `Designs/web-client-os/mvp-and-acceptance.md:31-103, 279-288, 324-330` · `Designs/web-client-os/product-constitution-and-roadmap.md:125-249, :246-248` · `Designs/clientv2/README.md:69 ('Competitive input')` · `Kanban.md:51-52 (Under Review card, no expiry)` · `grep 'file-browser-requirements|ArDrive|mainstream-baseline' Designs/web-client-os/ -> 0 hits`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R11a-clientv2-thesis-ker-11, R11b-clientv2-packages-w-05

### CLI-13 — Queryable endpoint is an undeclared dependency with no unreachable outcome or loss tests

**Owner:** `web-client-os` · **Neighbours:** `efsv2`, `vault-process`, `arcade` · **Severity:** important · MVP-relevant

Designs/efsv2/system-constitution.md:38 and :214-216 promise reconstruction "without an EFS-operated indexer/service", but a node is assumed and never named (grep 'RPC provider|archive node|own node|light client' over the six current efsv2 docs: 0 hits); mvp-and-acceptance.md:157 makes the endpoint a "named input", :170 gives only transport words, and §Threat boundary :793 lists RPC endpoints as untrusted inputs rather than a dependency with a fallback. Stage A states but does not close the assumption: b0-realm-admission.md QR-2 (388-391) "Deeper archive reads are a bonus, never assumed"; rpcUrls[] are untrusted hints (:124-128); §8.2 reconstructs only "at the basis the RPC serves" (:1821-1824); UNAVAILABLE_SOURCE_BASIS is scoped to cross-Realm evidence (:432-436); V2-E7 (owner-decision-inbox.md:64-68) has "independent RPC and node operation" only as a Commons column, and ethereum-standards-and-interop.md:586-589 merely queues an archive-availability fixture. The evidence says this dependency dies first — l1-incidents-and-dead-data.md:161-170 (Goerli 0/8 RPCs; Holesky one endpoint) and :235 ("do not assume any third-party RPC or explorer will exist in ten years ... plan to be the 1"); CORRECTIONS.md:18 (zkEVM archive-RPC-only). Acceptance mirrors the gap: independent rebuild against a live Realm and carrier loss exist (system-constitution.md:303, 306, 314; Stage A GV-17 vectors-and-falsifiers.md:947-961, AT-4 traceability.md:230, FX-GIT.E harness-and-fixtures.md:814-819; mvp §B 360-364 and §C box 11) and STATUS.md:50-52 says none has been executed, while five loss shapes are missing: home-Realm endpoint loss; client bootstrap with the primary origin and ipfs.io/dweb.link/delegated routing disabled (only in Reviews/2026-08-24-ipfs-maintainership-transition.md:145-151, routed to the expired Kanban.md:43 card, grep in Designs/: 0, and the client is not itself an EFS-published artifact); reconstruction from a frozen Realm or exported snapshot; spec-closure unavailability; and carrier lapse after the declared horizon. Repair: web-client-os declares a per-Realm endpoint set, a typed REALM_UNREACHABLE(realmId, lastBasis) outcome distinct from UNKNOWN and a snapshot-import profile with three of those shapes MVP-required; efsv2 adds the rest beside GV-17 in the Stage B harness; vault-process re-cards the IPFS trace with an owner.

**Evidence:** `Designs/efsv2/system-constitution.md:§The one-sentence model line 38; §Honest reads lines 214-216; §Architecture-level acceptance tests lines 303, 306, 314` · `Designs/web-client-os/mvp-and-acceptance.md:invariant 2 line 157; invariant 6 line 170; §Threat boundary line 793; §B lines 360-364; §C lines 409-416; §G lines 533-536` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:§2.1 lines 124-128; §4.1 QR-2 lines 388-391; §4.2 lines 432-436; §8.2 lines 1821-1824` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/vectors-and-falsifiers.md:GV-17 lines 947-961; traceability.md:AT-4 line 230; harness-and-fixtures.md:FX-GIT.E lines 814-819; STATUS.md:50-52` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/l1-incidents-and-dead-data.md:161-170, 235; CORRECTIONS.md:18` · `Reviews/2026-08-24-ipfs-maintainership-transition.md:§Remaining operational gap lines 145-151; Kanban.md:43` · `Designs/efsv2/owner-decision-inbox.md:V2-E7 lines 64-68; Designs/web-client-os/ethereum-standards-and-interop.md:586-589; Designs/web-client-os/technology-foundation.md:610`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** S9-confirmed-then-unread-04, S9-confirmed-then-unread-07

### CLI-18 — No current threat model for the guest-read plus basic-write MVP

**Owner:** `web-client-os` · **Neighbours:** `efsv2`, `sdk`, `clientv2` · **Severity:** important · MVP-relevant

The only threat model in the vault is the historical Designs/clientv2/threat-model.md (2026-07-07; assets, adversaries and attack trees for a retired fixed-ring OS). Current coverage is Designs/web-client-os/mvp-and-acceptance.md §Threat boundary (779-813: trusted/untrusted lists plus five residual bullets) and scattered residual sentences (architecture-and-modules.md:291-298; privacy-and-agents.md:95, 299, 410-432). README.md:452 and product-constitution-and-roadmap.md:110 both say "a standards label never supplies a threat model", while app-runtime-and-direct-launch.md:529 and :1070 refer to "the EFS threat model" as if one existed. Nothing current enumerates adversaries with capabilities, pairs mitigations with residuals, or restates the sign-what-you-didn't-mean tree (threat-model.md §3.1 lines 56-76: preview divergence, address poisoning, browser-in-the-browser, clickjacking) for an MVP that asks a person to sign a PublicationEnvelope and an AdmissionIntent per operation (mvp:74-79) and introduces assets the July model never saw (CAS-bound AdmissionIntent; orphan-retention uploads, mvp:268-270).

**Evidence:** `Designs/clientv2/threat-model.md:§3.1 lines 56-76` · `Designs/web-client-os/mvp-and-acceptance.md:§Threat boundary lines 779-813; :74-79; :268-270` · `Designs/web-client-os/README.md:452; Designs/web-client-os/product-constitution-and-roadmap.md:110` · `Designs/web-client-os/app-runtime-and-direct-launch.md:529, 1070 ('the EFS threat model')` · `Designs/web-client-os/architecture-and-modules.md:291-298; Designs/web-client-os/privacy-and-agents.md:95, 299, 410-432`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R11b-clientv2-packages-w-01

### CLI-26 — No deployment, RealmId-distribution or Realm-churn ceremony for a Sepolia debug MVP

**Owner:** `web-client-os` · **Neighbours:** `efsv2`, `owner` · **Severity:** important · MVP-relevant

Designs/web-client-os/README.md:44-47 (direction 2) says the MVP client must "debug the evolving contracts", but Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md §7.2 U-1/U-3 (1388-1427) forbid any semantic change under one RealmId ("breaking = new Realm ... Core has no successor pointer and no admin successor bit"); RealmSuccessor/1 is named at line 1421 and left undefined; RealmId distribution is "above Core" (350-354); and InitConfig/1 (§2.4, 197-225) carries no deployer identity. README.md:410 assigns "Realm bootstrap" to EFS v2, while corpus/proposed-spine-edits.md §A2 says "whoever deploys or adopts a Realm accepts that assumption". Each semantic iteration during the debug MVP therefore creates a new Realm the client must discover by hand, and no set owns the deployment, distribution or churn process.

**Evidence:** `Designs/web-client-os/README.md:44-47 (direction 2); :410` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:§7.2 lines 1388-1427 (U-1/U-3; RealmSuccessor/1 at 1421)` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:350-354; §2.4 lines 197-225 (InitConfig/1)` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:§A2 second bullet`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R7a-stageA-b0-ids-envelo-14

### CLI-28 — July guest/link-safety floor (LP-5, LP-8, NS-1..11) neither adopted nor rejected

**Owner:** `web-client-os` · **Neighbours:** `efsv2` · **Severity:** important · MVP-relevant

The lens pass concluded that a guest is never told a file does not exist (Designs/efsv2/lens-read-gotchas.md:30, LP-5), that a View can never contain trust and link hints are "offered, never applied" (lens-spec.md §8.3 line 88), and that clients owe a non-suppressible floor NS-1...NS-11 including a foreign-view banner with one-tap escape (§8.6 line 91); Designs/efsv2/owner-decision-inbox.md LP-5 (227-229) and LP-8 (241-243) route these to V2-E6 and "Web Client/OS evidence". The current Files draft makes trust policy mount-local and publisher-chosen ("Plans are immutable and mount-local, never route-global ambient caller input", hierarchical-files-and-folders.md:544), so a guest reads through the mount publisher's Plan. Designs/web-client-os carries only fragments — "Lens hints from a shared link can nominate a choice but cannot persist it" (privacy-and-agents.md:156-158) and "General reader policy and the Files Plans must not be flattened into one ambient Lens" (mvp-and-acceptance.md:42-43) — with no foreign-view banner, escape, policy-suppression disclosure or guest-side Plan override (no hits for those phrases in web-client-os/*.md). Whose Lens a guest is looking through, and what the guest can do about it, is unowned for the guest MVP.

**Evidence:** `Designs/efsv2/lens-spec.md:§8 lines 86-92 (§8.3 line 88; §8.6 line 91 NS-1..NS-11)` · `Designs/efsv2/lens-read-gotchas.md:30 (LP-5), 55` · `Designs/efsv2/owner-decision-inbox.md:LP-5 lines 227-229; LP-8 lines 241-243` · `Designs/efsv2/hierarchical-files-and-folders.md:§3.4 line 544` · `Designs/web-client-os/privacy-and-agents.md:156-158 (Link hygiene); Designs/web-client-os/mvp-and-acceptance.md:42-43`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R4-efsv2-identity-lens-p-09

### CORE-46 — The 2026-07-01 salt-entropy rule has no counterpart for ObjectGenesis/1's publisher-plus-salt identity

**Owner:** `efsv2` · **Neighbours:** `arcade` · **Severity:** minor · MVP-relevant

Reviews/2026-07-01-v2-adversarial-review.md 'Critic adjudications' item 3 rules 'Salt entropy: >=128-bit CSPRNG or keyed derivation; public-input-derived salts forbidden (against graph-database's deterministic-salt retries; retry convergence via persisted WritePlan salt)'. core-architecture-candidate.md §Record introduces ObjectGenesis/1 whose 'RecordId can be the stable ObjectId', committing 'publisher Principal plus salt', and the Arcade worked example makes GameProject an ObjectGenesis/1 Record. No spine doc, V2-E3 or V2-F1 states salt width, source, retry-convergence rule, or the prohibition on deriving salts from public inputs, although the same squat and precompute attacks the July review analysed apply to a publisher-plus-salt genesis. Minor because the fix is one sentence in V2-F1 -- but it is exactly the class of unpinned constant the July second pass called freeze-blocking.

**Evidence:** `Reviews/2026-07-01-v2-adversarial-review.md:§Critic adjudications carried into the designs item 3; §Second pass (unpinned constants)` · `Designs/efsv2/core-architecture-candidate.md:§Record (ObjectGenesis/1, publisher Principal plus salt); §Worked example: Arcade without Arcade Core code` · `Designs/efsv2/owner-decision-inbox.md:§V2-F1`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R20-older-reviews-13

### CORE2-07 — Six PAF tightenings from the 2026-07-29 museum review were never folded in

**Owner:** `efsv2` · **Neighbours:** `arcade`, `web-client-os`, `open-web-app-store` · **Severity:** minor · not on the MVP path

`Reviews/2026-07-29-virtual-os-museum-deep-dive.md` lines 66-73 lists six 'proposed edits, not made': execute-critical vs streamable closure entries (PAF-2/3), range reads as a hard requirement (PAF-3), COOP/COEP isolation-profile declaration (PAF-5), overlay save shape (PAF-6), smoke-test claim tuple (PAF-7), and runtime source bundles (PAF-2/7). `Designs/efsv2/playable-archive-requirements.md` was last touched 2026-07-23 (line 8) and contains none of them. Only the smoke-test tuple reached Arcade (`Designs/arcade/curation-and-social.md`:108); the execute-critical/streamable split survives only in spirit in `system-constitution.md`:232-235; the COOP/COEP declaration and overlay-save proposals have no home in web-client-os or the App Store (grep for PAF/playable in app-runtime-and-direct-launch.md and open-web-app-store/architecture.md returns nothing).

**Evidence:** `Reviews/2026-07-29-virtual-os-museum-deep-dive.md:lines 3, 6, 66-73` · `Designs/efsv2/playable-archive-requirements.md:line 8` · `Designs/arcade/curation-and-social.md:line 108` · `Designs/efsv2/system-constitution.md:lines 232-235`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R5-efsv2-context-require-13

### CORE2-13 — OS Drives is named as reviewer and owner but no such set exists

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner` · **Severity:** minor · not on the MVP path

`Designs/web-client-os/README.md` line 7 lists '@os-drives-pm boundary review (2026-08-14)', §Ownership boundaries says 'OS Drives owns native handles, host aliases, projection behavior, errors, metadata projection, daemons, packaging, and three-host validation', and `mvp-and-acceptance.md` §D says 'Linux/macOS/Windows restrictions are tested by the OS Drives lane'. No Designs/os-drives folder or OS Drives document exists (ls Designs; grep 'OS Drives' hits only web-client-os files). The only mount design is `Designs/efsv2/mountable-filesystem-semantics.md` (draft, 2026-07-22, depending on July codex-kinds/read-lens-spec), which carries the adopted three-host read-only requirement from owner-rulings 2026-07-22 — so an acceptance obligation is assigned to a lane that does not exist.

**Evidence:** `Designs/web-client-os/README.md:line 7 Reviewers; §Ownership boundaries row Native mounts` · `Designs/web-client-os/mvp-and-acceptance.md:§D checkbox 6` · `Designs/efsv2/mountable-filesystem-semantics.md:header` · `Designs/efsv2/owner-rulings.md:§2026-07-22`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R8-wco-product-mvp-priva-15

### CORE2-28 — V2-E8 has no current brief; its only handoff targets the dead five-kind model

**Owner:** `efsv2` · **Severity:** minor · not on the MVP path

`Designs/efsv2/owner-decision-inbox.md` V2-E8 (70-75) says 'Run the focused portable-schema/validator pass against the minimal Type Schema candidate' but points to no brief. `fable-handoff-portable-schemas-and-validators.md` (2026-07-27) is written against the retired five-kind model ('Do not answer this pass with TAGDEF exists', line 24; candidate A 'enrich TAGDEF', line 157) and is absent from the README evidence map (91-112), as are fable-handoff-v2-tag-core.md and apps-cookbook.md; `layered-type-system-and-data-abi.md` explicitly does 'not ... close V2-E4, V2-E8, or V2-F1' (43-44). The handoff's R1-R10 requirements and eight grounding workloads (77-149, 295-306) remain the best statement of James's EAS-parity regression test and will be lost rather than re-cut if nobody re-briefs the gate.

**Evidence:** `Designs/efsv2/owner-decision-inbox.md:70-75` · `Designs/efsv2/fable-handoff-portable-schemas-and-validators.md:24, 77-149, 157, 295-306` · `Designs/efsv2/README.md:91-112` · `Designs/efsv2/layered-type-system-and-data-abi.md:39-47`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R2-efsv2-types-ids-oncha-09

### CORE2-44 — Three constitution freeze obligations have no owner or artifact: EAP, encrypted body, Git

**Owner:** `efsv2` · **Neighbours:** `git-forge` · **Severity:** minor · not on the MVP path

`system-constitution.md`'s acceptance trace 'EAP proposed fixture' ends 'This task-derived fixture must be backed by a durable EAP brief before freeze', but no EAP brief exists anywhere in the vault (find -iname '*eap*' returns nothing; grep 'EAP brief' hits only the constitution) and `Reviews/2026-08-13-efs2-stage-a-corpus/pm-stage-a-directive.md`:22 says 'Treat EAP as provisional until Codex supplies a durable brief'. §Privacy bullet 4 requires 'A supported encrypted-body profile [that] separates signing, encryption, scanning, recovery, wrapping, and shredding key roles; pins a versioned canonical AEAD' — no current doc designs it (Stage A `STATUS.md` gap G-3; privacy-pass-synthesis is July evidence). §One transaction requires 'Git multi-ref and similar all-or-nothing meaning lives in one typed transaction Record or an explicit bounded profile rule' — only `Reviews/2026-08-07-efs-git-deep-dive.md` (evidence) exists and the Kanban Git/forge prototype card expired 2026-08-17. None is needed for the File Browser MVP; each should be explicitly deferred rather than left standing as an ownerless freeze gate.

**Evidence:** `Designs/efsv2/system-constitution.md:'EAP proposed fixture' row; §Privacy bullet 4; §One transaction bullet 4` · `Reviews/2026-08-13-efs2-stage-a-corpus/pm-stage-a-directive.md:line 22` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:§Honest gaps G-3` · `Kanban.md:In Flight lines 36-37 (Git/forge card expired 2026-08-17)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R1-efsv2-spine-16

### CORE2-49 — No portable signed export bundle (.efs-bundle) has an owner though four lanes need one

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `open-web-app-store`, `arcade` · **Severity:** minor · not on the MVP path

`client-os-pressure-report.md` P5.3 (line 104) asks for a normative venue-neutral .efs-bundle; `joined-pass-synthesis.md`:66 and `lens-pass-synthesis.md`:85 elevated it as 'the walk-away vehicle'; `privacy-james-decisions.md` JD-11 (48) makes it a recovery-ladder file; `Designs/arcade/v2-pressure-and-migration.md` §2h (89-91) and its open question (112) ask it to absorb seeder receipts. The current set only gestures at the capability: `system-constitution.md` 'Independent rebuild' (306) reconstructs from Realm state, `Designs/open-web-app-store/README.md`:121 owns 'export/reconstruction obligations', and `Designs/web-client-os/README.md` principle 10 (453) says 'Exit is tested'. No named artifact, owner or fixture exists.

**Evidence:** `Designs/efsv2/client-os-pressure-report.md:P5 line 104` · `Designs/efsv2/joined-pass-synthesis.md:line 66; lens-pass-synthesis.md:line 85` · `Designs/efsv2/privacy-james-decisions.md:JD-11 line 48` · `Designs/arcade/v2-pressure-and-migration.md:§2h lines 89-91; line 112` · `Designs/efsv2/system-constitution.md:line 306` · `Designs/open-web-app-store/README.md:line 121; Designs/web-client-os/README.md:line 453`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R5-efsv2-context-require-09

### CORE2-54 — Stage A's domain registry does not mark the historical efs.*.v1 families never-mint

**Owner:** `efsv2` · **Neighbours:** `efs15` · **Severity:** minor · not on the MVP path

`Designs/efs15/README.md` rule 2 says 'Do not reuse an ID domain with a changed preimage. New semantic bytes require a new version/domain and fresh vectors.' Stage A `b0-encoding-and-ids.md` §1.3 states 'New domains are additive, never reused' and lists retired spellings, but every entry is an `efs2/...` string and conformance case H-DOMTABLE 'sweeps every chapter and implementation for `efs2/` strings' only. The efs15 family (`efs.id.tagdef.v1`, `efs.id.slot.v1`, `efs.type.descriptor.v1`, ...) and the July family are absent, and the two families still print incompatible layouts for the same `efs.id.slot.v1` string (`Designs/efs15/efs-id-1-candidate.md` §Candidate constants vs `Designs/efsv2/deterministic-ids.md`:43; also codex-kinds.md:52, privacy-freeze-reservations.md:20). The `efs2/` prefix makes accidental reuse unlikely, but nothing mechanical prevents a Stage B implementer from minting an old string with a new preimage.

**Evidence:** `Designs/efs15/README.md:§Rules for reuse item 2` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md:§1.3 ('[PROPOSAL] The table is closed'), H-DOMTABLE` · `Designs/efs15/efs-id-1-candidate.md:§Candidate constants; §Standing` · `Designs/efsv2/deterministic-ids.md:line 43`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R15-efs15-evidence-05

### PRD-42 — Two incompatible mechanisms for the constitution's atomic multi-ref push; neither cites the other and nobody owns the reconciliation

**Owner:** `efsv2` · **Neighbours:** `efsv2` · **Severity:** minor · MVP-relevant

Designs/efsv2/system-constitution.md:311 requires 'authenticated replay-safe push/intake, atomic multi-ref semantics' and :153-162 says multi-ref all-or-nothing meaning 'lives in one typed transaction Record or an explicit bounded profile rule'. The 2026-08-07 corpus answers with GIT-REF/1 and a read-time fold in which CAS is 'a deterministic read rule, not an admission rule', because July admission confluence forbade state-dependent admission (state-model.md §4 lines 72, 99-101, 120). Stage A B0 answers with admission-time CAS: expectedRevisions[] per Binding leaf in the AdmissionIntent with a whole-call ErrCasPredecessor revert (b0-binding.md:355-380,:561-575), realized as GitPushTransaction/1 + per-ref Bindings with MUST_FIT_ATOMIC (harness-and-fixtures.md:797-798,:842-845), and the candidate applies CAS at admission (core-architecture-candidate.md:205-207,:223-228). Greps show they never meet: 'GIT-REF' in the Stage A corpus = 0 hits; 'B0'/'GitPushTransaction' in the git corpus = 0; 'fold' in current efsv2 docs = 0. The constitution has effectively chosen the B0 shape but nobody has said so, and the fold-only properties - policy epochs, roster tiers, ADVANCE/FORCE/RESTORE, restoreOnly, force-with-lease, ancestry verification, displaced-history retention - have no B0 home; Stage A defers the rest to a 'Git client-profile lane' (traceability.md:236-237, AT-9b) with no owner and no document.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Two incompatible mechanisms for the constitution's atomic multi-ref push; neither cites the other and nobody owns the reconciliation. `Designs/efsv2/system-constitution.md:311` requires "authenticated replay-safe push/intake, atomic multi-ref semantics" and `:159-162` says multi-ref all-or-nothing meaning "lives in one typed transaction Record **or** an explicit bounded profile rule" - two permitted shapes. The 2026-08-07 git corpus took the second: `GIT-REF/1` and a read-time fold in which CAS is "a deterministic read rule, not an admission rule" (`state-model.md:101`), because July admission confluence forbade state-dependent admission (`:72`). Stage A B0 took the first: admission-time CAS via `expectedRevisions[]` per Binding leaf in the AdmissionIntent with a whole-call `ErrCasPredecessor` revert (`b0-binding.md:359-380, :561-575`), realized as `GitPushTransaction/1` + per-ref Bindings with `MUST_FIT_ATOMIC` (`harness-and-fixtures.md:797-798, :842-845`), and the candidate applies CAS at admission (`core-architecture-candidate.md:223-228`). Stage A *does* state its choice - `harness-and-fixtures.md:797` marks `GitPushTransaction/1` "[DERIVED INVARIANT - constitution: 'Git multi-ref and similar all-or-nothing meaning lives in one typed transaction Record', VERIFIED]" - but the two mechanisms never meet: `GIT-REF` in the Stage A corpus = 0 hits; `B0`/`GitPushTransaction` in the git corpus = 0 hits; and the corpus's read-time fold has no home in current efsv2 docs (the word "fold" survives there only as unrelated index vocabulary - `system-constitution.md:210,:215`, `core-architecture-candidate.md:28`). Nobody has written the reconciliation, and the fold-only properties - policy epochs, roster tiers, ADVANCE/FORCE/RESTORE, restoreOnly, force-with-lease, ancestry verification, displaced-history retention - have no B0 counterpart anywhere in Stage A (grep: 0 hits). Stage A defers the rest to a "Git client-profile lane" (`traceability.md:237`, AT-9b, "DEFERRED(V2-E6 / Git client-profile lane)") that has no document and no design folder; its only named owner is @git-forge (codex) on a Kanban In Flight card that expired 2026-08-17 (`Kanban.md:36-37`).

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

The Git ref-policy surface has no home and no document. system-constitution.md:311 asserts that "authenticated replay-safe push/intake, atomic multi-ref semantics" need no Git Core primitive, and Stage A discharges the atomicity half at specification level (b0-binding.md:355-380 admission-time `expectedRevisions[]` with whole-call `ErrCasPredecessor`; harness-and-fixtures.md:797-798 `MUST_FIT_ATOMIC`; traceability.md AT-9a "COVERED at specification/interface level; execution is Stage B"). What has no successor anywhere current is the ref-policy set the earlier 2026-08-07 git corpus carried — policy epochs, roster tiers, ADVANCE/FORCE/RESTORE, restoreOnly, force-with-lease, ancestry verification, displaced-history retention — and traceability.md:236-237 defers the lane that would own them (AT-9b, `DEFERRED(V2-E6 / Git client-profile lane)`) to a lane with no document and no named owner. The earlier corpus's read-time fold is not a competing live mechanism: it appears in no current doc (grep: 0 hits for "fold" in current efsv2 docs), so this is a MISSING backlog item, not an unreconciled fork. Nothing here touches the File Browser MVP — Git/Forge sits in the "Long-term extensible OS" row of product-constitution-and-roadmap.md:250 — so mvp_relevant should be false and severity minor.

**Evidence:** `Designs/efsv2/system-constitution.md:153-162, :311` · `Reviews/2026-08-07-efs-git-corpus/state-model.md §4 lines 72, 99-101, 120` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md:355-380, :561-575` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:797-798, :842-845` · `Designs/efsv2/core-architecture-candidate.md:205-207, :223-228` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:236-237 (AT-9b)`

**Re-classified in verification:** category UNDECIDED → MISSING (materiality lens); severity blocking → minor (materiality lens); owning set git-forge → efsv2 (materiality lens)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R16-git-forge-02, S4-git-x-types-x-core-01

### PRD-34 — Update-trust operations the July round said must ship before channels have no current home

**Owner:** `open-web-app-store` · **Neighbours:** `clientv2`, `web-client-os`, `efsv2` · **Severity:** minor · not on the MVP path

packages-and-updates.md §8 (the curator-compromise runbook that 'ships BEFORE channels', lines 145-157), §5 (deny-freshness gate with cooldown anchored to admission block time, lines 110-123), §9 FM-U12 ('monitoring must stay funded - the CT/PEP-458 lesson', line 174) and threat-model.md §6 (lines 235-240) map, in the current sets, only to open-web-app-store/architecture.md:740-746 ('Thresholds, cooldown/freshness, independent evidence, local UpdateTrustState ... can bound adoption only while at least one independently trusted policy authority remains uncompromised') and web-client-os/system-profiles-and-generations.md:1129,:1160-1162. Nothing is wrong today - the store MVP excludes auto-update (architecture.md:894) and owner direction 19 makes upgrades opt-in - but the recovery recipe, the deny-freshness floor (client-os-pressure-report.md P6 line 112; efsv2/ops-doctrine.md:38, still an open box) and the monitor-funding requirement appear in no current requirement ledger. Defer them on the record rather than by omission.

**Evidence:** `Designs/clientv2/packages-and-updates.md §5 lines 110-123, §8 lines 145-157, §9 FM-U12 line 174` · `Designs/clientv2/threat-model.md §6 lines 235-240` · `Designs/open-web-app-store/architecture.md:740-746, :894` · `Designs/web-client-os/system-profiles-and-generations.md:1129, :1160-1162; README.md:107-116` · `Designs/efsv2/ops-doctrine.md:38`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R11b-clientv2-packages-w-11

### PRD-35 — AppFollowResolutionReceipt is defined over an App channel/release-head object the store never specifies

**Owner:** `open-web-app-store` · **Neighbours:** `web-client-os` · **Severity:** minor · not on the MVP path

Designs/web-client-os/app-runtime-and-direct-launch.md:129-163 (esp. :150-158) defines AppFollowResolutionReceipt with channelBinding, channelHeadRevision, exact Project, Release and ResolvedPackageSet, and requires RESOLVED_FRESH before a follow launch. The store has only prose: architecture.md:709-735 says a publisher 'may maintain a Principal-qualified Binding at an application-defined release-head position' and that 'Channel is application-profile vocabulary, not a Core or Lens primitive', with no channel or release-head object in its object model (:198-467) and no fixture or receipt covering App channel resolution - while the OS says the store owns update candidates (system-profiles-and-generations.md:600-605,:1172-1173). The OS receipt is defined over a neighbour object that does not exist. Repair: the store names the release-head Binding position as an application profile, or explicitly delegates it to the OS.

**Evidence:** `Designs/web-client-os/app-runtime-and-direct-launch.md:129-163, :150-158` · `Designs/open-web-app-store/architecture.md:198-467, :709-735` · `Designs/web-client-os/system-profiles-and-generations.md:600-605, :1172-1173`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R9-wco-architecture-runt-15, S1-appstore-x-os-x-types-10

### PRD-36 — OS product law depends on a store package resolver that exists nowhere, not even as a fixture

**Owner:** `open-web-app-store` · **Neighbours:** `web-client-os` · **Severity:** minor · not on the MVP path

Designs/web-client-os/system-profiles-and-generations.md:227-231,:238-239 says 'the generic package resolver owned by the Open Web App Store produces the exact PackageHandoff/ResolvedPackageSet and ResolutionReceipt', and WCOS-R58 (product-constitution-and-roadmap.md:231) consumes exact ResolvedPackageSetIds and receipt values. The store's own fixture is explicitly 'not a semver, peer, hoist, optional-dependency, or authority-domain resolver' (fixture README:21-25,:191-193), the resolver is step 3 of the store's future-work sequence (open-web-app-store/README.md:225-227), canonical Set encoding is an open gate (architecture.md:967-969) and receipt bytes are undefined. Both sides know; neither labels the dependency. Repair: label SystemProfileRecipe package-range/channel/catalog inputs as gated on the store resolver, exact refs only until then.

**Evidence:** `Designs/web-client-os/system-profiles-and-generations.md:227-231, :238-239` · `Designs/web-client-os/product-constitution-and-roadmap.md:231 (WCOS-R58)` · `Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md:21-25, :191-193` · `Designs/open-web-app-store/README.md:225-227; architecture.md:967-969`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S1-appstore-x-os-x-types-05

### PRO-32 — No engineering size or schedule estimate exists for the greenfield Core

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `sdk`, `owner` · **Severity:** minor · MVP-relevant

Reviews/2026-07-07-carrier-decision.md estimated "Net new kernel ~ 500-900 LoC" and "+2-4 weeks + disproportionate verification", and Reviews/2026-07-07-efsv2-design-round.md §"What needs James" asked for an "honest LoC/schedule re-plan (~2,300-2,900 Etched LoC reviewed, not 500-900)". The greenfield core-architecture-candidate.md §"Modular contract shape to prototype" names seven modules (Codex, RecordStore, Admission, Index, Binding, LensResolver, byte stores/adapters) and Stage A is "complete at the specification/evidence level" with Stage B unrun, yet no document in the spine, in the inbox (V2-F2 "First product implementation scope") or in web-client-os carries any size, verification-effort or schedule estimate. For a review whose question is whether an MVP can start, the absence of any sizing after two July estimates that disagreed by 3-5x is a hole in the owner's packet.

**Evidence:** `Reviews/2026-07-07-carrier-decision.md:Ruling item 2; Q3 feasibility` · `Reviews/2026-07-07-efsv2-design-round.md:§What needs James` · `Designs/efsv2/core-architecture-candidate.md:§Modular contract shape to prototype` · `Designs/efsv2/owner-decision-inbox.md:V2-F2` · `Reviews/README.md:EFS 2.0 Core engineering pass — Stage A corpus`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R20-older-reviews-12

### PRO-50 — No first user is named; the commissioned community research feeds nothing

**Owner:** `vault-process` · **Neighbours:** `web-client-os`, `efsv2`, `arcade`, `media-library`, `vault-process` · **Severity:** minor · MVP-relevant

Direction 2 defines the MVP by its debugging purpose ("so the client can also debug the evolving contracts"); Designs/web-client-os/mvp-and-acceptance.md contains no community, steward, persona, first-user or audience (grep: zero hits), and product-constitution-and-roadmap.md §Product success measures (line 318) lists six technical properties and no community outcome. The 2026-07-29 target-community research James commissioned (landed 2026-08-07; Decisions.md line 31, "who has already lost an archive") is cited only by Designs/media-library/README.md:131-135 and booru-app.md:26-28; its own "highest-leverage next action" — a 10-day steward-proof sprint — has no Kanban card, and its evidence boundary states "No prospective steward or partner was contacted". The Kanban Done card closes the research with "Arcade is the current first-product hypothesis, not a permanent exclusion of stronger candidates", i.e. the pre-research hypothesis was kept unchanged. The project is designing for an imagined complete-OS user rather than a wedge for a steward nobody has asked, and the first-user choice has no queue to live in (PRO-04).

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

The 2026-07-29 target-community research James commissioned (Decisions.md:31, wedge = "who has already lost an archive") has no downstream home. Its own "Highest-leverage next action" — a 10-day steward-proof sprint — has no Kanban card and no recorded deferral, its evidence boundary states "No prospective steward or partner was contacted", and the only design references to it are Designs/media-library/README.md:131-135 and booru-app.md:26-28. Either card the sprint in Backlog or record explicitly why it is deferred, so a commissioned research deliverable is not silently orphaned. This is not an MVP blocker and is not evidence that the project has no audience: direction 2 defines the first MVP by its debugging purpose ("so the client can also debug the evolving contracts"), direction 10 makes Sepolia development-only, efsv2/README.md §Hard holds forbids any durable production seed pre-freeze, and the first-product question is already held (Open-Decisions.md arcade reconciliation hold; arcade/README.md bars outreach until the packet is reopened). The absence of persona language in mvp-and-acceptance.md is consistent with that scope, not a defect in it.

**Evidence:** `Designs/web-client-os/README.md:§Direct owner direction item 2` · `Designs/web-client-os/mvp-and-acceptance.md (grep communit|steward|first user|persona|audience → 0)` · `Designs/web-client-os/product-constitution-and-roadmap.md:§Product success measures (line 318)` · `Reviews/2026-07-29-target-communities/README.md:§Highest-leverage next action; §Evidence boundary ('No prospective steward or partner was contacted')` · `grep -rn target-communities Designs/ → only Designs/media-library/README.md:131-135, booru-app.md:26-28` · `Kanban.md:63 (Done card 'Target-community research'); Decisions.md:31`

**Re-classified in verification:** category DIRECTION → MISSING (materiality lens); severity blocking → minor (materiality lens); owning set owner → vault-process (materiality lens)

**Verified:** text confirmed (high confidence); materiality confirmed with correction (medium confidence) · **Source lanes:** J3-adoption-first-01

### CLI-33 — First-visit trust-on-first-use disclosure dropped from the installed-client story

**Owner:** `web-client-os` · **Neighbours:** `clientv2` · **Severity:** minor · MVP-relevant

July required the UI to say, at the moment it happens, that the first load trusts the serving origin ("first load: trusting <origin> to introduce this OS", Designs/clientv2/boot-and-profiles.md:150; honesty obligation :207; system-surfaces.md:163-164 first-run beat 1). Owner direction 19 (web-client-os/README.md:107-116) makes the returning-user guarantee conditional on persisted origin state and calls a stronger pin "a separate sovereign-client research problem"; WCOS-R27 (product-constitution-and-roadmap.md:175) says "first-visit limits remain explicit"; and mvp-and-acceptance.md §G (:562-569, :622-626) tests fresh-visit and site-data-clearing behaviour. None requires the UI to disclose the trust-on-first-use event. Permanence disclosure survived the transfer (plan preview, mvp:72); this one sentence and its fixture did not.

**Evidence:** `Designs/clientv2/boot-and-profiles.md:150, 207; Designs/clientv2/system-surfaces.md:163-164` · `Designs/web-client-os/README.md:107-116 (direction 19)` · `Designs/web-client-os/product-constitution-and-roadmap.md:175 (WCOS-R27)` · `Designs/web-client-os/mvp-and-acceptance.md:562-569, 622-626`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R11a-clientv2-thesis-ker-12

### CLI-40 — The 'sepolia' route label has no pinned CAIP/chain-identity pass behind it

**Owner:** `web-client-os` · **Neighbours:** `efsv2` · **Severity:** minor · not on the MVP path

ethereum-standards-and-interop.md §Cross-chain identity and messages says "EFS needs a separate pinned CAIP/chain-identity pass before freezing public chain/Realm serialization. Friendly labels such as sepolia remain replaceable route-table inputs", and §Research and coordination queue item 8 defers CAIP/ENSIP/WalletConnect pins. mvp-and-acceptance.md §Cold-browser guest journey nonetheless uses https://efs.eth.limo/#/sepolia/myfolder/file.jpg as the example route. Acceptable for an MVP with one route-table entry, but it must not be frozen as the public link grammar, and no document says who runs the CAIP pass.

**Evidence:** `Designs/web-client-os/ethereum-standards-and-interop.md:§Cross-chain identity and messages; §Research and coordination queue item 8` · `Designs/web-client-os/mvp-and-acceptance.md:§Cold-browser guest journey`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R10-wco-technology-stand-16

### CLI-42 — No document says whether the Web Client is ever a Store SoftwareProject

**Owner:** `web-client-os` · **Neighbours:** `open-web-app-store` · **Severity:** minor · not on the MVP path

The OS keeps the client's own release first-party: AppReleaseGeneration is "one exact EFS Web Client delivery envelope" with an immutable ReleaseClosure and a mutable ChannelEnvelope (architecture-and-modules.md:627-631, 721-730), and system-profiles-and-generations.md:443-444 says the install binding "is never folded into the first-party AppReleaseGeneration or runtime-neutral PackageHandoff", so owner direction 19 is satisfied there. The Store's product direction is a store that lists software (Designs/open-web-app-store/README.md:14-31) and owner direction 11 plans sdk and webclient repos (web-client-os/README.md:78-80), yet neither set states whether the client's updates will later flow through the Store or stay first-party forever. This confirms the File Browser MVP borrows nothing from the Store, but leaves the long-term relationship unowned.

**Evidence:** `Designs/web-client-os/architecture-and-modules.md:627-631, 721-730` · `Designs/web-client-os/system-profiles-and-generations.md:443-444` · `Designs/web-client-os/README.md:78-80, 107-116` · `Designs/open-web-app-store/README.md:14-31`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R12-open-web-app-store-15

## DIRECTION — the direction itself is questionable or over-scoped

### CORE-32 — Independent reconstruction cannot re-verify authorship because the envelope witness is deliberately not persisted

**Owner:** `efsv2` · **Neighbours:** `owner`, `sdk` · **Severity:** important · MVP-relevant

b0-authorship-envelope.md §4.3 (:766-774) and §10 (:1468-1476) state that 'Core intentionally does not persist the main envelope witness. getEnvelopeBytes therefore cannot replay a historic signature and a reader MUST NOT call the present ERC-1271 account ... Historical authorship grade comes from the receipt's immutable admission basis', and that 'absent an externally supplied original witness, historic signature verification is not replayable from state and is not claimed'. A second implementation therefore reconstructs only that this Core's verifier said an author signed -- a trust-me fact about the authority layer -- against a constitution promising 'A second implementation can reconstruct ... from the declared Realm state ... without an EFS-operated service' (:214-216). The asymmetry is the point: the owner paid for full bodies ('PAY IT', 'ETCH IT') and the design retains up to 7,808 bytes of pre-withdrawal evidence per effective T4, while an EOA witness is 65 bytes. For ERC-1271 accounts replay is genuinely impossible because code changes, so the receipt basis is right; for EOAs the omission was never put to the owner, and a verifier bug in one Core revision would attribute occurrences to Principals who never signed with no state-only way to detect it. Cheap to fix, but PAY-IT class, so it is an owner ask.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-authorship-envelope.md:§4.3 lines 766-774; §10 lines 1468-1476` · `Designs/efsv2/owner-rulings.md:2026-07-15 items 17-18 lines 67-68 (PAY IT / ETCH IT)` · `Designs/efsv2/system-constitution.md:§Honest reads lines 214-216; §Authorship lines 133-136` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:W-3 ('Do not claim to replay the unstored main witness')`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** J2-cypherpunk-risk-first-02

### CORE-34 — ERC-1271 authorship was reopened against three reviews and the lost offline/cross-Realm verifiability is recorded nowhere

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `sdk`, `owner` · **Severity:** important · MVP-relevant

Reviews/2026-07-07-carrier-decision.md Q1 made 'Verifiable via ecrecover (offline, year-100, no server)' the property that justified leaving EAS; Reviews/2026-07-11-kel-identity-foundation-review.md P1 (:84) ruled 'ERC-1271/6492 remain outside envelope/KEL authority'; the 2026-07-10 audit's standards table says ERC-1271/6492 are 'not portable EFS author proof because validity depends on chain code/state'. system-constitution.md §Authorship and authority now requires that 'EOA and ERC-1271 authorship must work in a fresh supported Realm', and owner-decision-inbox.md P-9 records it as 'Reopened by the greenfield EOA/ERC-1271 requirement' -- so the reversal itself is not silent. What is silent is the cost: core-architecture-candidate.md §Principal Realm-qualifies contract authority and keeps Lens reads off ERC-1271 callbacks, but nowhere states that a contract-account Occurrence cannot be verified without the Realm's historical state, that cross-Realm copies are unverifiable at the destination (constitution §Cross-Realm trace), or that this is sound only while the 'chains don't die' assumption holds. V2-E1/V2-E5 should carry that trade-off explicitly.

**Evidence:** `Reviews/2026-07-07-carrier-decision.md:§Answers to the five questions (Q1)` · `Reviews/2026-07-11-kel-identity-foundation-review.md:P1 line 84` · `Reviews/2026-07-10-cypherpunk-os-state-of-art-and-coherence-audit.md:§Adopt as stable adapters or constraints (ERC-1271/ERC-6492 row)` · `Designs/efsv2/system-constitution.md:§Authorship and authority; Designs/efsv2/owner-decision-inbox.md:P-9; Designs/efsv2/core-architecture-candidate.md:§Principal`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R20-older-reviews-03

### CORE2-29 — The common host alias rule base32-encodes most real filenames on every host

**Owner:** `efsv2` · **Neighbours:** `owner`, `web-client-os` · **Severity:** important · not on the MVP path

`Designs/efsv2/hierarchical-files-and-folders.md` §10 (1585-1607) emits a canonical name directly on a host only when it is lowercase ASCII [a-z0-9._-]+; every other name becomes `~efs~n-<base32>`, so README.md, Photo 1.JPG, Résumé.pdf and 猫.jpg would all display as ~efs~n-... in Finder, Explorer and ls. This exceeds `mountable-filesystem-semantics.md` §3.7 (289-297), which asks only for a reversible escape for names a host shell cannot represent plus deterministic disambiguation for case/normalization collisions; it undercuts the ruling's 'useful read-only mounted filesystem ... ordinary command-line tools and each platform's normal graphical file manager' (`owner-rulings.md` 2026-07-22, line 108); and it sits badly with owner direction 17 (i18n from the first slice, `Designs/web-client-os/README.md`:100-102). Inference: collision-only aliasing (alias every member of an actual collision class) would preserve determinism without this cost.

**Evidence:** `Designs/efsv2/hierarchical-files-and-folders.md:§10 Host projection lines 1585-1607` · `Designs/efsv2/mountable-filesystem-semantics.md:§3.7 lines 289-297` · `Designs/efsv2/owner-rulings.md:2026-07-22 line 108` · `Designs/web-client-os/README.md:direction 17 lines 100-102`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R3-efsv2-files-04

### CORE2-41 — The main envelope witness is never persisted, so authorship can never be independently re-verified

**Owner:** `efsv2` · **Neighbours:** `owner` · **Severity:** important · not on the MVP path

`b0-authorship-envelope.md` §4.3 (766-769) says 'Core intentionally does not persist the main envelope witness ... a reader MUST NOT call the present ERC-1271 account ... and treat that answer as the historic verdict', and §10 (1471-1474) that 'historic signature verification is not replayable from state and is not claimed'; `b0-realm-admission.md` W-3 (1502) repeats 'Do not claim to replay the unstored main witness'. Yet the same chapter retains abi.encode(TargetEnvelopeEvidence) including up to 4,096 witness bytes per effective T4 for pre-withdrawals (§5.1, 600-604) — an unargued asymmetry. The consequence: a verifier bug in one Core revision would attribute occurrences to Principals who never signed, and no second implementation could ever detect it from state; the receipt becomes a trust-me fact, which sits badly with the constitution's 'Honest reads and reconstruction'. The owner ruled 'PAY IT' only for bodies (`owner-rulings.md`:67); witnesses (65 bytes = 3 slots for an EOA) were never put to him.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-authorship-envelope.md:§4.3 lines 764-774; §10 lines 1468-1488` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:1495-1502; 600-604` · `Designs/efsv2/owner-rulings.md:line 67` · `Designs/efsv2/system-constitution.md:§Honest reads and reconstruction`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R7a-stageA-b0-ids-envelo-08

### PRD-45 — A Git-backed wiki duplicates the File Browser MVP's revision engine; right direction, wrong instrument

**Owner:** `git-forge` · **Neighbours:** `web-client-os`, `efsv2`, `open-web-app-store` · **Severity:** important · MVP-relevant

The MVP unit is 'publishing a new immutable revision of a controlled file' via 'Publish revision = ChunkTree + FileRevision + file-head CAS rebind' (mvp-and-acceptance.md:15-19,:238-243); Files' Edit file operation is the same unit (hierarchical-files-and-folders.md:1142), FileRevision/1 already carries a merge DAG (:446-462), and line 9 supersedes redirect/moved-to so rename-stable page identity is native. The wiki verbs Edit/Preview/Save draft/Publish/History/Compare/Restore (wiki-and-collab.md §1 lines 12-18) and traces T1/T4/T8 (traces.md:7,30,54) map onto FileRevision + head CAS + Binding history with no Git machinery, and what the wiki adds - Propose, Compare, conflict merge, edit summaries - is exactly what the MVP defers ('collaboration, conflict merge, and a rich document editor', lines 86-87). Running Git objects and an EFS revision chain as two engines for the same Markdown bytes is the conflict, and it is what FX-GIT specifies. The direction underneath is the vault's strongest adoption thesis - the 2026-08-07 ruling's 'every platform shutdown in the record preserved the code and lost the conversation' (owner-rulings.md:158-167, esp. 162) and the community research's rank-1 prospect, wiki-migration admins, who win only on 'shared revision ancestry/plural successor views' - but it is instrumented nowhere current. Recommendation: seed it as Markdown History/Compare/Restore inside the File Browser and keep FX-GIT/CV-GIT-STOCK as the interop fixture. Cut from any MVP: browser-side Git, stock-push gateway/proc-receive, credential ceremony, LFS, dual-digest, refs/efs/attest, sponsorship economics, GoE/EthStorage adapters, policy-epoch recovery, sealed-successor migration, the skills rider, any forge beyond FX-GIT.

**Evidence:** `Designs/web-client-os/mvp-and-acceptance.md:15-19, :86-87, :238-243` · `Designs/efsv2/hierarchical-files-and-folders.md:9, :446-462, :1142` · `Reviews/2026-08-07-efs-git-corpus/wiki-and-collab.md §1 lines 12-18, §2, :26` · `Reviews/2026-08-07-efs-git-corpus/traces.md:7, 30, 54 (T1/T4/T8)` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:796-799` · `Designs/efsv2/owner-rulings.md §2026-08-07 lines 158-167 (esp. 162), :164` · `Reviews/2026-07-29-target-communities/opportunity-map.md §Comparative scorecard rank 1`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R16-git-forge-06, S4-git-x-types-x-core-11, J3-adoption-first-03

### PRO-13 — Three native mount daemons gate the first permanent release

**Owner:** `owner` · **Neighbours:** `efsv2`, `web-client-os` · **Severity:** important · MVP-relevant

Designs/efsv2/owner-rulings.md line 111 requires one golden fixture "on all three hosts before EFS claims filesystem-semantic validation", and owner-decision-inbox.md V2-F2 (lines 87-92) gates "the first permanent contracts/SDK/Web Client release" on "mounted-filesystem traces". mountable-filesystem-semantics.md Phase 2 (lines 584-609, with 320-324) needs live mounts through libfuse3, macFUSE/FSKit and WinFsp driven from Finder/Explorer — i.e. daemons, packaging and notarization — while product-constitution-and-roadmap.md line 249 places "Linux/macOS/Windows Drive adapters" in the Long-term horizon after Near-term and Personal-OS, and nobody owns them (PRO-12). As written, the first permanent SDK/Web Client release waits on unowned native daemons. Proposal for the owner (not adoption): restate the gate as Phase 0 pure-resolver vectors (mountable-filesystem-semantics.md:558-576) plus the CommonHostAlias/1, DirectoryProjectionV1 and HostFileId golden vectors (hierarchical-files-and-folders.md:1585-1660, §13.5) executed by two independent resolvers, with the three live adapters as a separate later gate on the mount product claim.

**Evidence:** `Designs/efsv2/owner-rulings.md:108-111` · `Designs/efsv2/owner-decision-inbox.md:87-92 (V2-F2)` · `Designs/efsv2/mountable-filesystem-semantics.md:320-324, 558-576, 584-609` · `Designs/web-client-os/product-constitution-and-roadmap.md:246, 249` · `Designs/efsv2/hierarchical-files-and-folders.md:1585-1660, 2107-2149`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S6-sdk-and-mount-spread-11

### PRO-36 — The mandatory modern-Web guidance gate is over-scoped for a first disposable build

**Owner:** `owner` · **Neighbours:** `web-client-os` · **Severity:** important · MVP-relevant

Direction 24, §"Mandatory modern-Web guidance gate", WCOS-R65 and technology-foundation.md §Reproducible repository boundary require — "Before any authorized Web experiment or implementation" (README §Current work sequence step 2) — a guidance lock, a standards-evidence lock and closure, a feature-policy ledger, a measured browser-profile ledger, machine-readable evidence receipts, a CI verify:web-evidence gate, and a six-step per-change trace with an independent reviewer (§Required contribution trace); only "Protocol-only work is exempt". The mitigated risk (models lagging Baseline features) is small next to the MVP's real gaps — no Core, no byte carrier, no SDK — and this front-loads ledger infrastructure before the first guest-read byte. Keep it as the product-code gate and exempt disposable fixtures. Secondary: the Paul Irish modern-css reference has no resolved redistribution licence (README lines 279-283).

**Evidence:** `Designs/web-client-os/README.md:§Direct owner direction item 24; §Mandatory modern-Web guidance gate; §Current work sequence item 2; 279-283` · `Designs/web-client-os/product-constitution-and-roadmap.md:WCOS-R65` · `Designs/web-client-os/technology-foundation.md:§Required contribution trace; §Reproducible repository boundary`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R8-wco-product-mvp-priva-09

### PRO-38 — Arcade's founding-product claim has no evidence bar left; the D1 recut never happened

**Owner:** `owner` · **Neighbours:** `arcade`, `efsv2`, `web-client-os`, `open-web-app-store`, `vault-process` · **Severity:** important · MVP-relevant

Reviews/2026-08-13-claude-evidence-round/README.md:79-100 records that one adversarial workstream (two overlapping passes) found zero benefits uniquely EFS-specific for the tested js13k catalog — curator plurality is "UNRESOLVED — and not blockchain-specific" and "unexpressible in a single-operator site" (arcade-falsification-pass-2.md:114, 122, 130) — while CORRECTIONS.md:25 scopes this as challenging the hypothesis, not STOP. The set's own honesty box already calls mirror-kill/tamper/rebuild "parity beats plus on-chain identity" (product-and-communities.md:35) and its STOP trigger fires when "the differentiator demo cannot be made user-visible" (:73), yet Designs/arcade/README.md:31 still leads with "a mirror dies live; the link keeps working" and :14 keeps "possible founding product/community pilot". Every neighbour meanwhile treats Arcade as a Core/runtime pressure fixture, which the falsification does not touch: system-constitution.md:310, Stage A traceability.md:234-235 (AT-8a COVERED at spec level, AT-8b DEFERRED), core-architecture-candidate.md:363-388, open-web-app-store/architecture.md:914, app-runtime-and-direct-launch.md:862-863 and product-constitution-and-roadmap.md:288-293. The README's own "highest-leverage next action" — the recut "before implementation or outreach" — has not happened: no commit has touched Designs/arcade/ since the 2026-08-13 import, Kanban.md:20 carries no claim or expiry trailer, and Open-Decisions.md holds seven arcade items "Last reconciled 2026-08-08". Of D1-D7 only D3(a) survives unchanged — "cease our own distribution of tetris.html: unpin from the operator's Kubo node + revoke the curator's own MIRROR/PIN" (owner-decision-inbox.md:31; catalog-plan.md:68; rights-safety-and-operations.md:51 citing Tetris Holding v. Xio look-and-feel exposure), a cheap operator action on live v1 infrastructure that Decisions.md:23 makes easier, not moot; D1 must be re-asked as "fixture now; pilot only against a new bar not resting on preservation or single-operator plurality", D7's permanence wording migrates to efsv2 V2-E5/E7, and D2/D4/D5/D6/E1-E5/L1-L3 are moot for a no-write one-game slice.

**Evidence:** `Reviews/2026-08-13-claude-evidence-round/README.md:79-100, 205-212; CORRECTIONS.md:25; corpus/arcade/arcade-falsification-pass-2.md:114, 122, 130; pass-1.md:31` · `Designs/arcade/README.md:14, 31, 44-46; product-and-communities.md:35, 73; owner-decision-inbox.md:16-21, 31` · `Designs/arcade/catalog-plan.md:68; Designs/arcade/rights-safety-and-operations.md:51 (Tetris Holding v. Xio)` · `Decisions.md:21, 23` · `Designs/efsv2/system-constitution.md:310; core-architecture-candidate.md:363-388; Designs/efsv2/README.md:9, 108, 125-127` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:234-235 (AT-8a/AT-8b)` · `Designs/open-web-app-store/architecture.md:914-915` · `Designs/web-client-os/app-runtime-and-direct-launch.md:862-863; product-constitution-and-roadmap.md:290-293` · `Kanban.md:19-20; Open-Decisions.md:20, 73`

**Verified:** not separately verified; clustered from 4 independent lane findings · **Source lanes:** R14-arcade-10, S2-arcade-x-appstore-x-r-07, S8-evidence-bindings-vs-11, R14-arcade-13

### PRO-42 — The App Store lane has no consumer with a delivery date

**Owner:** `owner` · **Neighbours:** `open-web-app-store`, `arcade`, `web-client-os` · **Severity:** important · MVP-relevant

Within the next year the vault plans a File Browser MVP that excludes package installation (Designs/web-client-os/mvp-and-acceptance.md:95-100, 843-851), a one-game Arcade slice behind a provisional adapter with no durable write and a held owner queue (Designs/arcade/README.md:3, 19-20; arcade/owner-decision-inbox.md:12), and a first-party client release the OS deliberately keeps outside the store (system-profiles-and-generations.md:443-444). The store's own work sequence (README.md:220-232) proposes a "next disposable resolver arm" and a later slice with "one finite catalog edition… one exact executable package… one update/advisory transition", but no consumer requests any of it and its Kanban card (Kanban.md:13-14) sits in Backlog awaiting "James review". Recommendation (proposal, not adoption): keep the spine as the shared Project/Release/closure/handoff vocabulary once F2/F3/F5 are settled, freeze nothing, and start no resolver until Arcade's slice needs a second package.

**Evidence:** `Designs/open-web-app-store/README.md:220-232` · `Designs/web-client-os/mvp-and-acceptance.md:95-100, 843-851` · `Designs/arcade/README.md:3, 19-20; Designs/arcade/owner-decision-inbox.md:12` · `Designs/web-client-os/system-profiles-and-generations.md:443-444` · `Kanban.md:13-14`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R12-open-web-app-store-17

### PRO-45 — The Plex track is scoped as a full media server whose EFS-specific value is narrow

**Owner:** `owner` · **Neighbours:** `media-library`, `arcade`, `web-client-os` · **Severity:** important · not on the MVP path

Designs/media-library/plex-jellyfin-app.md PLEX-01..16 and §"Limitations and required research" (:435-463) describe a full media-server product — scanner, probe, metadata matching, a six-step playback ladder, transcode provenance, household users, remote access, NAS packaging — while the doc itself says EFS's contribution is "stable media identity, exact verification, plural Locators, derivative provenance, portable collections, public edition selection and walk-away reconstruction" (:20-23). The evidence round found zero uniquely-EFS benefits for the tested Arcade catalog and no equivalent falsification exists for Plex. The owner-directed three-track ruling stands (Designs/media-library/owner-rulings.md:15-21), but the track should be narrowed to "verified personal library + exit over shared identity" until a Plex-shaped differentiation test runs — otherwise planning effort goes into a Plex clone no current product set can host, on the unowned local-agent platform (PRO-12).

**Evidence:** `Designs/media-library/plex-jellyfin-app.md:20-23 (Problem); 114-131 (Requirements); 435-463 (Limitations and required research)` · `Designs/media-library/owner-rulings.md:15-21 (Shared foundation with two distinct applications)` · `Reviews/2026-08-13-claude-evidence-round/README.md:§Arcade differentiation finding`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R13-media-library-15

### CLI-20 — The MVP boundary is not marked inside architecture-and-modules.md

**Owner:** `web-client-os` · **Severity:** important · MVP-relevant

architecture-and-modules.md tags only three spots as guest/MVP-relevant (:239-241 "smallest guest build may call trusted Reader packages directly", :259-260 lazy services "absent from the guest critical path", :305-308 Data Explorer "part of the MVP critical closure"). Every other section — module descriptor, slots, trust classes and lifecycle (:343-459), spatiotemporal composition and the four service identities (:461-572), dependency and generation rules (:574-609), the eleven configuration objects and accepted-release boot (:611-901) — carries no MVP, reserved or later marker. The real boundary lives only in other files: mvp-and-acceptance.md:84-104, app-runtime-and-direct-launch.md:845-853, system-profiles-and-generations.md:1185-1194 and product-constitution-and-roadmap.md:244-305. A per-section tag would let a File Browser team read roughly 30 KB instead of 226 KB; as written the File Browser appears to inherit the whole module system.

**Evidence:** `Designs/web-client-os/architecture-and-modules.md:239-241, :259-260, :305-308 (the only MVP tags); :343-901 (untagged)` · `Designs/web-client-os/mvp-and-acceptance.md:84-104 (§Deliberately deferred)` · `Designs/web-client-os/app-runtime-and-direct-launch.md:845-853` · `Designs/web-client-os/system-profiles-and-generations.md:1185-1194` · `Designs/web-client-os/product-constitution-and-roadmap.md:244-305`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R9-wco-architecture-runt-09

### CLI-21 — Modern-Web guidance gate elaborated into a pre-code process precondition

**Owner:** `web-client-os` · **Neighbours:** `owner` · **Severity:** important · MVP-relevant

Owner direction 24 is one sentence ("must use the pinned modern-Web guidance and standards-evidence gate"). technology-foundation.md §Required contribution trace turns it into six steps per change by "the author and an independent reviewer", and §Reproducible repository boundary requires a guidance lock, a standards-evidence lock and closure, a roughly fourteen-field feature-policy ledger, a browser-profile ledger, evidence receipts and a verify:web-evidence gate that "rejects incomplete matrices, expired experimental reviews and missing result/build digests". README.md §Current work sequence step 2 makes all of it a precondition "Before any authorized Web experiment or implementation", and type-data-abi-boundary-pressure.md §Future disposable experiment gate requires the closure "before any UI or generated document is created" even for an offline Type fixture. The census itself is already done and reproducible; the ledger and CI machinery should follow the first profile release, not precede the first line of product code. Relaxing it needs the owner because direction 24 says "every".

**Evidence:** `Designs/web-client-os/README.md:§Direct owner direction item 24; §Current work sequence step 2; §Mandatory modern-Web guidance gate` · `Designs/web-client-os/technology-foundation.md:§Required contribution trace` · `Designs/web-client-os/technology-foundation.md:§Reproducible repository boundary (verify:web-evidence)` · `Designs/web-client-os/type-data-abi-boundary-pressure.md:§Future disposable experiment gate and TDAB-P1`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R10-wco-technology-stand-07

### CORE2-45 — 'Sepolia is the first development Commons' is ratified only in the client README

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `owner` · **Severity:** minor · not on the MVP path

`Designs/efsv2/README.md` §Current status says 'James has ratified ... Sepolia is the first development Commons, not a permanent or canonical venue selection' and §The current shape repeats it; git log -S shows the sentence entered the README in commit da5fcc3 (2026-08-14, 'draft modular Web Client and OS spine'). The only recorded owner source is `Designs/web-client-os/README.md` direction 10; `Designs/efsv2/owner-rulings.md` contains no Sepolia entry and `system-constitution.md` never mentions Sepolia — its §EFS Commons defines Commons as 'an optional shared Realm and/or replaceable services' with 'No home chain or operator is selected', so a venue is not a Commons. `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md` further leaves Sepolia's validator permissioning 'unresolved until an owning agent verifies' and records that Goerli/Ropsten/Rinkeby/Kovan were omitted from the reviewed archive registry. Harmless for disposable dev work; misleading as a 'ratified' status line and as Commons vocabulary.

**Evidence:** `Designs/efsv2/README.md:§Current status; §The current shape bullet 2` · `git log -S 'Sepolia is the first development Commons' -- Designs/efsv2/README.md (da5fcc3, 2026-08-14)` · `Designs/web-client-os/README.md:direction 10` · `Designs/efsv2/system-constitution.md:§EFS Commons` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:rows 'Sepolia is definitely permissioned', 'The reviewed archive registry lists none of the dead testnets'`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R1-efsv2-spine-14

### PRD-38 — The store calls its conformance slice an 'MVP' while the owner-defined MVP is the File Browser

**Owner:** `open-web-app-store` · **Neighbours:** `web-client-os`, `owner` · **Severity:** minor · MVP-relevant

Designs/open-web-app-store/architecture.md §Candidate product MVP (859-903) describes 'a reversible product and conformance skeleton... no execution is necessary to prove the generic package layer' together with an 'MVP product surface' including a polished catalog page. Owner direction 2 (Designs/web-client-os/README.md:44-47) fixes the first MVP as the official write-capable File Browser, and mvp-and-acceptance.md:95-100 excludes package installation from it. Two documents now use 'MVP' for different products, and a reader of the store alone could infer a second product commitment. Repair, independently recommended by the cross-set cut lane: rename it 'conformance slice' or 'identity spine fixture'.

**Evidence:** `Designs/open-web-app-store/architecture.md:859-903` · `Designs/web-client-os/README.md:44-47 (direction 2)` · `Designs/web-client-os/mvp-and-acceptance.md:95-100`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R12-open-web-app-store-12

### PRO-37 — A TC39 Stage 1 proposal is the selected state primitive

**Owner:** `owner` · **Neighbours:** `web-client-os` · **Severity:** minor · not on the MVP path

Direction 14 and technology-foundation.md §"Signals are the in-process state primitive" select the official Signals API with "one exact audited polyfill" and forbid "a second EFS-specific observable/store abstraction", while the vault's own Reviews/2026-08-23-web-platform-standards-screen/selected-status-ledger.tsv pins TC39 Signals at "Stage 1" and web-platform-standards-and-forward-profile.md law 1 says "Standards maturity is not product value". If the proposal stalls, the polyfill becomes a permanent EFS-maintained state framework — exactly what direction 13 says a 2026 library must not become. The docs bound the blast radius ("Signals never cross a durable or authority boundary"; a proposal-revision adapter is allowed), so this is minor, but the owner should see that the bet is on a Stage 1 API.

**Evidence:** `Designs/web-client-os/README.md:§Direct owner direction items 13 and 14` · `Designs/web-client-os/technology-foundation.md:§Signals are the in-process state primitive` · `Reviews/2026-08-23-web-platform-standards-screen/selected-status-ledger.tsv:TC39 Signals row (Stage 1)` · `Designs/web-client-os/web-platform-standards-and-forward-profile.md:§Product laws item 1`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R10-wco-technology-stand-09

### CLI-31 — 64-Principal target defensible only for point resolution; 15-55 to 64 change unrecorded

**Owner:** `web-client-os` · **Neighbours:** `efsv2` · **Severity:** minor · MVP-relevant

Reviews/2026-07-11-efsv2-lens-architecture-and-scale-review.md §9.1 gives "one point x 50 principals" = 105,000 gas cold-read floor (so 64 is about 134,400) but "64 items x 50 principals" = 6,720,000; §9.2's Foundry table gives naive rich K=50, M=64 = 28,333,925 gas and two-phase = 13,389,687, above or near the 16,777,216 cap, and only the dropped claimant-roster mechanism (LR-3, registered as dropped in Reviews/2026-08-13-efs2-stage-a-corpus/corpus/carry-in-register.md) reaches 1.34M. Designs/web-client-os/README.md direction 8 and line 323 state "A 64-Principal contract Lens is the measurement target" without the word "point", while mvp-and-acceptance.md:825-827 already keeps "Complete directory listing" client-side via BindingScope, consistent with the review's §18.1 item 11; path resolution multiplies the floor by depth (V2-E2 says "point/path"), which no document bounds. Separately, James's lens-pass steer was "15-55 principals as the honest design center" (Designs/efsv2/lens-pass-synthesis.md:13) and direction 8 raised it to 64 without noting the change — harmless since direction 8 is later, but unrecorded. The review's request to promote its Foundry harness "into the contracts benchmark suite before freeze" was never done, so V2-E2 restarts from zero.

**Evidence:** `Reviews/2026-07-11-efsv2-lens-architecture-and-scale-review.md:§9.1 Storage-read lower bounds; §9.2 Foundry experiment; §18.1 item 11` · `Designs/web-client-os/README.md:§Direct owner direction item 8 and line 323` · `Designs/web-client-os/mvp-and-acceptance.md:158-160, 342, 825-827` · `Designs/efsv2/lens-pass-synthesis.md:13 ('15-55 principals as the honest design center')` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/carry-in-register.md:§Why this register exists (LR-3 dropped)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R20-older-reviews-06

### CLI-41 — Control-pack and renderer bakeoffs are not independent; Web Awesome Core is Lit-based

**Owner:** `web-client-os` · **Severity:** minor · not on the MVP path

technology-foundation.md §Where Lit earns a place gates Lit on the native-versus-Lit Minimal Viewer benchmark. §Current control-pack comparison describes Web Awesome Core as an "Active MIT Lit-based project" and the provisional default, and §Critical-path and failure discipline keeps Web Awesome outside the guest closure but inside the write path. Selecting Web Awesome therefore ships Lit in the write/OS path regardless of the viewer benchmark result, so §Required experiments items 1 and 2 are not independent as written.

**Evidence:** `Designs/web-client-os/technology-foundation.md:§Where Lit earns a place` · `Designs/web-client-os/technology-foundation.md:§Current control-pack comparison` · `Designs/web-client-os/technology-foundation.md:§Critical-path and failure discipline; §Required experiments items 1-2`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R10-wco-technology-stand-17

## DEFECT — a concrete, checkable factual defect

### PRD-09 — player-security-model.md carries no scope banner, is v1 throughout, and repeats unre-verified 2026-08-07 code facts

**Owner:** `arcade` · **Neighbours:** `web-client-os`, `efsv2`, `vault-process` · **Severity:** important · MVP-relevant

Every other Arcade design doc carries a scope-correction banner pointing at the README; player-security-model.md:3 says only 'Status: draft' and its :12 banner corrects sandbox semantics alone. The body is v1 throughout: 'Defines how the Arcade runs untrusted game code for the 2026-09-11 demo ... Everything here is Ephemeral-tier client work in contracts/packages/nextjs' (:10), '12-18 curator-reviewed single-file games' (:21), a hardcoded v1 lens list [EFS_CONTENT_LENS 0x11CbE1b6..., SystemAccount] with EFSFileView calls (:62-65), and a giscus threat row beside burnerWallet.pk (:33). It also repeats two 2026-08-07 facts the brief flags as not re-verified: verifyContentHash has zero callers (:20) and 67 Sepolia files carry non-canonical hashes (:72). Meanwhile README.md:12-23 supersedes the 2026-08-07 pass as scope, Decisions.md:23 records the greenfield ruling and Kanban.md:62 records stopping v1 support work - and README.md:54 still advertises this doc as the current 'compat-runner (not Ring-3) statement'.

**Evidence:** `Designs/arcade/player-security-model.md:3, :10, :12, :16, :20, :21, :33, :62-65, :72` · `Designs/arcade/README.md:12-23, :54` · `Decisions.md:23; Kanban.md:62`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R14-arcade-02, R9-wco-architecture-runt-16, S2-arcade-x-appstore-x-r-10

### CORE-12 — Zero of the 16 proposed Stage A spine edits were applied; Designs/efsv2 is behind its own corpus and does not index it

**Owner:** `efsv2` · **Neighbours:** `vault-process`, `web-client-os` · **Severity:** important · MVP-relevant

corpus/proposed-spine-edits.md lists A1-A4, B1-B2, C1-C9, D1 with verbatim OLD/NEW text and routes A1/A3/A4/B1/B2/C1-C8 to 'PM applies'. Re-checked 2026-09-02: git log -- Designs/efsv2/ shows c48f252 (2026-08-13 import) then 02bdae9, da5fcc3, 5d1242e (2026-08-14), each touching only README.md plus its own new draft, so system-constitution.md, core-architecture-candidate.md, fable-efs2-core-engineering-kickoff.md and owner-rulings.md have no post-import commit at all. String probes for every edit's distinctive text (challenge-window, TOCTOU, UNAVAILABLE_SOURCE_BASIS, PARTIAL_REPLICA, PLAN_LIMIT_EXCEEDED, unlinkable personas, 'Stage A', 'Stage B', four-tier support matrix, EIP-7825/EIP-170) hit nothing in the spine; A4's targets (candidate 319-322, constitution 195-196) and B1's target (README step 6 at :125, still read-oriented plus Arcade) are unchanged, and kickoff:61 still says FOUND/ABSENT/CONFLICT/UNKNOWN with :132 still 'two Principals'. B2 asked for the Stage A doc set to be added to the README doc table: the README has no 'Stage' string anywhere, still labels the consumed kickoff the 'Focused next-pass prompt', and its build order 4 keeps the Fable pass after prototypes even though the contradiction ledger marked that ordering BLOCKING. Meanwhile hierarchical-files-and-folders.md:6 declares 'Depends on: ... the Stage A B0 candidate' and mvp-and-acceptance.md:247, 386-390 consume B0 field names, so downstream docs depend on a corpus the spine does not acknowledge; the corpus's 7-row contradiction ledger stays live, and the vault audit scripts run clean only because proposals are not retirements.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:47, 60-108, 110-168, 223-325, 331-450, 851-861; §Contradiction ledger row 1` · `git log --name-only -- Designs/efsv2/ (c48f252, 02bdae9, da5fcc3, 5d1242e)` · `Designs/efsv2/README.md:91-127 (no 'Stage' string; 'Focused next-pass prompt'; build order 4; step 6 at 125)` · `Designs/efsv2/system-constitution.md:195-196; core-architecture-candidate.md:319-322; fable-efs2-core-engineering-kickoff.md:61, 132, 148-153` · `Reviews/2026-08-13-efs2-stage-a-corpus/stage-a-report.md:verdict and Next; STATUS.md:46` · `Designs/efsv2/hierarchical-files-and-folders.md:6; Designs/web-client-os/mvp-and-acceptance.md:247, 386-390; Kanban.md:42-43`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R6-stageA-overview-01, R1-efsv2-spine-13, S7-efsv2-object-model-co-08

### CORE-33 — The Stage A envelope reservation (authorityRef, authEpoch) that makes 'KEL later' possible is missing from the candidate

**Owner:** `efsv2` · **Neighbours:** `web-client-os` · **Severity:** important · MVP-relevant

b0-principal-authority.md §6.2 G7 (:1265-1272) states, and labels BLOCKING, that 'The Envelope carries an optional authority-reference field, excluded from RecordId ... reserve (bytes32 authorityRef, uint64 authEpoch) with zero-values meaning bare account mode', because kel.md §3:94 showed a 'KEL added later as a peer' cannot be retrofitted. core-architecture-candidate.md §Envelope (:131-158) lists only an 'actor/account authority witness' and gives no such reserved pair, and system-constitution.md:137-139 promises rotation, delegation and recovery as extension requirements without naming the seam. If Stage B mints envelope bytes from the candidate doc rather than the Stage A chapter, the single reservation that keeps managed Principals additive is the easiest thing to lose -- this is the concrete seam the MVP must keep even after cutting the entire KEL.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:§6.2 G7 lines 1265-1272 (BLOCKING)` · `Designs/efsv2/kel.md:§3 line 94` · `Designs/efsv2/core-architecture-candidate.md:§Envelope lines 131-158` · `Designs/efsv2/system-constitution.md:137-139`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R4-efsv2-identity-lens-p-11

### CORE2-03 — Twenty July efsv2 docs claim authority with no supersession banner or README row

**Owner:** `efsv2` · **Neighbours:** `vault-process` · **Severity:** important · not on the MVP path

The 2026-08-12 ruling (`Designs/efsv2/owner-rulings.md` L178-187) says the July KEL topology, envelope and Lens grammar must re-earn inclusion, and the 2026-08-08 greenfield ruling (`Decisions.md` line 23) removes v1 coexistence, yet three separate doc families still read as normative. Mechanism docs: codex-envelope.md, codex-kinds.md and codex-kernel.md titles say '(Etched)'; onchain-completeness.md:3 'the authoritative on-chain/off-chain ruling'; deterministic-ids.md:30 'Derivation rules (byte-exact, frozen)'; fable-handoff-v2-tag-core.md:54 'Carrier: DECIDED ... [investigated + James-ruled]'. Identity/lens/privacy docs: none of kel.md, identity.md, lens-spec.md, read-lens-spec.md, lens-pass-synthesis.md, lens-read-gotchas.md, privacy.md, privacy-pass-synthesis.md, privacy-freeze-reservations.md or privacy-james-decisions.md carries the reset banner — kel.md L3 is still 'draft candidate profile; topology under owner validation', identity.md L16 still says 'Frozen now: the bytes32 identity-word shape taxonomy', lens-spec.md L3 still calls itself 'the successor entry point' and asks James for LP-1..LP-10 (all superseded, owner-decision-inbox.md L208-252), privacy-james-decisions.md L13-17 still says 'Decide before the ceremony'; five of them are absent from the README evidence map. Spine/planning docs: ten more (confidence-and-open-decisions, freeze-gates, efs-v2-transition-plan, efs-v2-holistic-redesign, joined-pass-synthesis, fable-next-pass-scope, ops-doctrine, os-pass-handoff, efs-substrate-decision, multichain-dependency-map) are unclassified by the README, and six have no banner — efs-v2-transition-plan.md Phase 5 still offers 'a re-attestation courtesy under v2 IDs' against the no-migration ruling, joined-pass-synthesis.md:17 points at the P-1..P-23 packet the inbox files under 'Superseded questions — never revive silently', and os-pass-handoff.md still lists 'Reserved surface you can rely on: WHITEOUT ships'. `Retirements.md` is phrase-based and shows 'v1 coexistence' Cleared, so the audit scripts cannot see any of this; `assumptions-and-requirements.md` L10-15 and `Designs/efs15/requirements-and-boundaries.md` lines 3, 12 show the banner these docs lack. This is the isolation failure James flagged on 2026-07-16 (owner-rulings.md L99-102).

**Evidence:** `Designs/efsv2/owner-rulings.md:2026-08-12 L178-187; L99-102` · `Designs/efsv2/README.md:§Evidence map L91-112; §Status; lines 99, 106` · `Designs/efsv2/codex-envelope.md:1,19; codex-kinds.md:1; codex-kernel.md:1` · `Designs/efsv2/onchain-completeness.md:3; deterministic-ids.md:30,83; fable-handoff-v2-tag-core.md:54` · `Designs/efsv2/kel.md:L3, §23; identity.md:L16; lens-spec.md:L3, L106; privacy-james-decisions.md:L13-17` · `Designs/efsv2/efs-v2-transition-plan.md:header 'Supersedes'; §2 Phase 5` · `Designs/efsv2/joined-pass-synthesis.md:§0 line 17; os-pass-handoff.md:§What changed` · `Decisions.md:2026-08-08 entry (line 23); Retirements.md:§Cleared` · `Designs/efs15/requirements-and-boundaries.md:3, 12 (contrast: has a banner)`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R1-efsv2-spine-12, R4-efsv2-identity-lens-p-01, R2-efsv2-types-ids-oncha-08

### CORE2-22 — Stage A gas arithmetic is stale or non-reproducing while STATUS claims no defect

**Owner:** `efsv2` · **Neighbours:** `git-forge` · **Severity:** important · not on the MVP path

`harness-and-fixtures.md` §2.2 (846-852) prices PUSH-WORST-20 'Using Lane 6 §3.6's <=90k/Binding-leaf estimate' at ≈2.07M gas ≈12.3% of the 16,777,216 cap with a ceiling of ≈166 ref updates/tx, but `b0-binding.md` §3.6 (616-648) now states ≈217,000 gas per Binding leaf and marks the 90k figure '[REJECTED — superseded] ... booked the dead history mapping and omitted Lane 5's mandatory per-leaf bundle'; recomputed at 217k the 21-leaf push is ≈4.55M ≈27% of the cap with a ceiling of ≈69 ref updates, so the claim that SR-5's 64-leaf structural cap is 'the predicted limiter' becomes marginal. Two further rows do not reproduce: `b0-lens.md` §3.4 item 2 (196-198) states the worst-case N=64 cold resolve as '≈549k gas' while its own §9 formula and table (851-860) give 551,072; and `b0-binding.md` §3.6 (619-621) books the 'Lane 5 mandatory bundle ... ~141,000 per the index chapter's §9 pricing' while `b0-indexes.md` §9 (1826-1842) reproduces ≈165k for a Binding-class leaf. All are labeled [HYPOTHESIS], but the corpus advertises cross-chapter exactness, the harness copies these rows into MeasurementRow baselines, and `STATUS.md` (18-29) asserts no open Important defect on the premise that chapters were repaired to match pins (b0-overview 3-11) — a premise this arithmetic falsifies.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:§2.2 lines 846-852` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md:§3.6 lines 615-648` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md:§3.4 191-198; §9 851-860` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:§9 1826-1842` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:lines 18-29` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md:lines 3-11`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R7b-stageA-b0-indexes-le-02, R7b-stageA-b0-indexes-le-12

### CORE2-56 — FX-GIT's adversarial cases contradict B0's Principal-scoped BindingKey and omit the load-bearing Git cases

**Owner:** `efsv2` · **Neighbours:** `git-forge` · **Severity:** important · not on the MVP path

`b0-binding.md` defines `BindingKey = keccak256(abi.encode(DOM_BINDING, principalId, positionKey))` (line 52), 'writers cannot bind another's key' (§1.3, 135-144) and 'only the key owner's admitted envelopes can touch the slot' (799-800). FX-GIT casts M1, M2 maintainers and D1..D4 contributors as distinct EOAs (`harness-and-fixtures.md` 785-786) and its adversarial (ii) says 'D1 and D2 race one ref with the same expectedRevision: exactly one admits' (823-826) — two Principals cannot share a slot, so the race cannot occur as written; nothing says whose Principal owns `refs/heads/main` or how a reader picks between M1's and M2's heads, and managed/shared Principals are a post-MVP graduation seam (`b0-principal-authority.md` §6 line 1195) although the Git corpus fold existed precisely for the roster-scoped multi-author head (`Reviews/2026-08-07-efs-git-corpus/state-model.md` §4 line 76). The same list (i)-(vii) also omits the two cases the Git corpus treated as load-bearing: the hostile-relayer subset-carried push (`TRUNCATED-TXN`, state-model.md §4 line 99) even though B0 'SUPPORTS strict-subset carriage and strict-subset admission' (`b0-authorship-envelope.md` 1284) and conclusion 7 says 'an envelope is not an application transaction' (1313), and the two-device same-author nonce collision (corpus G-8/OQ-1). Inference: the author-signed AdmissionIntent leaf mask plus REQUIRED `expectedRevisions[]` per Binding leaf (b0-binding.md 359-365) is the intended defence, but no Stage A sentence states it for Git. Repair: rewrite (ii) as a same-Principal two-device nonce-lane race, declare one publisher Principal per MVP repo, specify a maintainers' ResolutionPlan as the multi-maintainer selector, and add a subset-carried-push case.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md:52, 135-144, 359-365, 799-800` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:785-786, 798, 823-833` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-authorship-envelope.md:1284, 1313` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:line 1195` · `Reviews/2026-08-07-efs-git-corpus/state-model.md:§4 lines 76, 99; primitive-fit-gap.md:§3 G-8` · `Designs/efsv2/core-architecture-candidate.md:217-224`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** S4-git-x-types-x-core-02, S4-git-x-types-x-core-10

### PRD-19 — Media Foundation Slice 0 depends on a spec in a no-remote repository outside the vault

**Owner:** `media-library` · **Neighbours:** `vault-process` · **Severity:** important · MVP-relevant

Designs/media-library/README.md:177-179 (build order step 1) and plex-jellyfin-app.md:428-429 link ../../../experiments/efs-media-library-offline-loop/docs/superpowers/specs/2026-08-14-offline-personal-library-loop-design.md. No 'experiments' directory exists at /home/user/planning, at /home/user, or as a sibling, and the intake describes that fixture repository as local no-remote: 'It has no remote and was not pushed or published' (Reviews/2026-08-14-media-library-intake/candidate-fixture-evidence.md:333-337; intake README:134-139). Step 1 of the build order therefore cannot be reviewed, reproduced or assigned from the vault. The set is also unclear whether step 1 is done ('implement' in the README versus 'Current tiny local proof' at plex-jellyfin-app.md:428) and which experiment it is (browser-only per media-infrastructure.md:380-381 versus a Python/filesystem implementation per candidate-fixture-evidence.md:228).

**Evidence:** `Designs/media-library/README.md:177-179` · `Designs/media-library/plex-jellyfin-app.md:428-429` · `Reviews/2026-08-14-media-library-intake/README.md:134-139` · `Reviews/2026-08-14-media-library-intake/candidate-fixture-evidence.md:228, :333-337` · `Designs/media-library/media-infrastructure.md:380-381`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R13-media-library-01

### PRO-07 — Stage A and the Core plan cite evidence artifacts that are not in the vault

**Owner:** `vault-process` · **Neighbours:** `efsv2` · **Severity:** important · MVP-relevant

intake-findings.md, standards-audit.md (lines 5-6), carry-in-register.md, proposed-spine-edits.md, b0-encoding-and-ids.md (lines 40, 177) and b0-authorship-envelope.md (lines 32-33, 281, 333) mark standards claims "VERIFIED (lane)" against scratchpad/audit-lanes.json, but find /home/user/planning -name audit-lanes.json returns nothing — only transcriptions survive. proposed-spine-edits.md open item 6 admits the C6/C7 survivor-row texts were quoted only through that file, and C1/C3/C5/C6/C7 claim "PM adopted this amendment in the Stage-A reply (task directive, VERIFIED)" although the only preserved directive (pm-stage-a-directive.md) contains no such adoptions; STATUS.md §Review and repair trail cites the range "48bf72d..6ea657e" but git cat-file -t 48bf72d fails (the vault's root commit is c48f252, 2026-08-13). Separately docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md line 15 makes the physical Core split "a measured gate because the partial Stage B monolith left only 4,707 runtime bytes while still omitting important mechanisms" — no repository, worktree, report or Kanban entry preserves that build, and Designs/web-client-os/README.md line 348 says "Stage B implementation and conformance have not run". That number is exactly the SIZE_6 week-one fact bakeoff-spec.md §4.6 says "can decide the axis alone" against the EIP-170 24,576-byte limit (standards-audit.md §2.14), so it must be reproduced and recorded or the plan's architecture premise retracted. All chapter standards statuses (EIP-7825 cap, EIP-7951, ERC-7930 Review, EIP-8130 Draft, expired multihash draft) are as of 2026-08-12/13 and need refreshing before deployment.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/intake-findings.md:Provenance paragraph` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/standards-audit.md:5-6, §2.14` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:Verification key; §C1 rationale; Open items 6` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md:40, 177` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-authorship-envelope.md:32-33, 281, 333` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:14-16, §Review and repair trail` · `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md:10-18` · `Designs/web-client-os/README.md:347-349` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/bakeoff-spec.md:§4.6`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R6-stageA-overview-11, R6-stageA-overview-12, R7a-stageA-b0-ids-envelo-13

### PRO-09 — The only EFS 2.0 SDK design set is unmerged; four current docs cite it as evidence

**Owner:** `vault-process` · **Neighbours:** `sdk`, `open-web-app-store`, `media-library`, `web-client-os`, `owner` · **Severity:** important · MVP-relevant

Designs/sdkv2/ (11 files: README, sdk-pm-charter, architecture-candidate, developer-journeys, experiment-program, ethereum-standards-census, research-precedents, web-client-os-boundary-pressure, owner-rulings, owner-decision-inbox, exp-c0-mvp-packet) exists only on remote branch codex/sdkv2-pm (head 57d04f8, 2026-08-25); ls Designs/ has no sdkv2, git log --all -- Designs/sdkv2 is empty, the GitHub API returns 404 for the path on main, and main's Designs/README.md content map has no sdkv2 row while the branch's README does. Four current documents nonetheless cite it by commit permalink .../blob/4d3e736/Designs/sdkv2/ethereum-standards-census.md: Designs/open-web-app-store/README.md line 205, Designs/open-web-app-store/architecture.md line 7, Designs/media-library/media-infrastructure.md line 182 and Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md line 142 — the permalink still returns 200 upstream and the citing store commit da0aec2 is 17 minutes later than 4d3e736, so the links were valid when written, but the vault does not carry evidence three current spines rest on. The branch's owner-rulings.md records two 2026-08-22 founder rulings — "Designs/sdkv2/ selected as the current source spine" and "frozen/preservation horizon is 100 years … The later 100-year direction governs" — that appear in neither Decisions.md (no 2026-08-22 entry) nor Designs/efsv2/owner-rulings.md, while main still says "roughly 50-year horizon" (web-client-os/README.md:84-88) and "50-year bakeoff question" (owner-rulings.md:209). Kanban.md and Open-Decisions.md carry no SDK v2 item, so the owner must decide merge-or-reject and vault-process must either land the set as an ordinary draft with a content-map row and Kanban card, or rewrite the four permalinks to a retained copy and record the rejection.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Same finding, with one evidence line replaced: substitute "`git log --all -- Designs/sdkv2` is empty" with "no commit reachable from `main` touches `Designs/sdkv2` — `git log --all --oneline -- Designs/sdkv2` returns six commits (55fe3c2 → 57d04f8), all on `refs/remotes/origin/codex/sdkv2-pm`". Everything else in the canonical detail stands as written, including the 11-file list, the branch head 57d04f8 (2026-08-25), the four permalinks, the 17-minute gap between 4d3e736 (2026-08-22 23:09:47) and da0aec2 (23:26:33), the two 2026-08-22 founder rulings on the branch, and main's surviving "roughly 50-year horizon" (web-client-os/README.md:85) and "50-year bakeoff question" (efsv2/owner-rulings.md:209). The claim that the permalink still returns 200 upstream was not re-verified from here.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Keep DEFECT. Drop the 50-vs-100-year contradiction entirely (different subjects: application maintainability vs post-freeze preservation; the branch ruling explicitly disclaims applying to today's unfrozen bytes). Replace 'the vault does not carry evidence three current spines rest on' with 'four current documents carry permalinks into an unmerged branch that no vault process protects from deletion or force-push, while explicitly filing the census as dated, non-adopted evidence.' Note that per the brief branch text is proposal-stage, so whether James issued the two 2026-08-22 rulings is UNVERIFIABLE from here — the action is owner confirm-or-reject, then record in the owning queue's history.

**Evidence:** `git ls-remote --heads origin → refs/heads/codex/sdkv2-pm 57d04f8; GitHub listing Designs/sdkv2/ at 57d04f8 (11 files)` · `Designs/sdkv2/owner-rulings.md @4d3e736 §2026-08-22 (two RULED entries)` · `Designs/open-web-app-store/README.md:205; Designs/open-web-app-store/architecture.md:7` · `Designs/media-library/media-infrastructure.md:181-182` · `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md:142` · `Designs/README.md (main) §Content map — no sdkv2 row vs branch README Draft row` · `Designs/web-client-os/README.md:84-88; Designs/efsv2/owner-rulings.md:4, 209` · `Decisions.md:21-25 (no 2026-08-22 entry)` · `Daily Notes/agent-status.md:235, 237` · `Open-Decisions.md:8; Kanban.md (no SDK v2 card)`

**Re-classified in verification:** severity blocking → important (materiality lens)

**Routing note from verification:** materiality lens: vault-process (owner only for confirm-or-reject of the two branch rulings)

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R17-sdk-and-mounts-01, S6-sdk-and-mount-spread-01, R12-open-web-app-store-01, R10-wco-technology-stand-04, R13-media-library-02, S6-sdk-and-mount-spread-12

### PRO-11 — Pre-v2 SDK and efs15 docs still read as live; README rows lack historical labels

**Owner:** `vault-process` · **Neighbours:** `sdk`, `clientv2`, `efs15` · **Severity:** important · not on the MVP path

Thirteen root SDK docs keep **Status:** review/handoff with June 2026 dates and no v1 banner (sdk-architecture.md:3, sdk-read-surface.md:3, sdk-write-ux.md:3, sdk-wallet-architecture.md:3, sdk-review-backlog:3, sdk-vs-client-responsibilities.md:3, sdk-minimal-clicks:12, efs-account-system:12, mirror-scheme-policy:3, web3-standards-compliance:3, web3-bytesstore-sdk-followup:3, write-ux-options-ranked:12, sdk-v1-bridge-v2-compat-asks:3) although Designs/README.md:72-86 routes them as "Historical SDK API surface … superseded"; rows :80, :83, :84, :87, :88 carry no historical label and sdk-v1-bridge-v2-compat-asks has no row at all. The content map also misfiles write-ux-options-ranked under "Superseded / handed off" (:97) against its own #status/review, and its sdk-minimal-clicks row claims "V1 batched single-signature writes (shipped evidence)" while that document's shipped tier is 2-3 signatures and sdk-architecture.md §Implemented vs Designed marks efs.batch() one-signature "type-present, behavior-absent"; web3-standards-compliance.md is landed (contracts docs/adr/0057, 0058 exist) yet still "review", and clientv2/sdk-boundaries.md lacks the 2026-08-15 historical banner. The same defect hits efs15: Designs/README.md line 94 files efs15/ under "Superseded / handed off" with "Do not implement", but the "By target repo" table (lines 127-130) lists it for planning, contracts, client and sdk beside the active sets with no qualifier, so an agent scanning by repo could route contracts or sdk work to efs15. P12 asked for these banners on 2026-07-07 (Designs/efsv2/client-os-pressure-report.md:151-155, box still unchecked) and scripts/tri-sync-check.sh compares only word 1 of the prose status against the tag, so all of it passes green.

**Evidence:** `Designs/sdk-*.md status lines (:3 or :12) — all 'review'` · `Designs/write-ux-options-ranked.md:3, 12, 14 vs Designs/README.md:97` · `Designs/README.md:72-88 (rows 80, 83, 84, 87, 88 unlabeled), 94, 127-130` · `Designs/sdk-minimal-clicks.md:§The two viable tiers; Designs/sdk-architecture.md:§Implemented vs Designed (efs.batch())` · `Designs/web3-standards-compliance.md:3-4 with /home/user/efs-project/contracts/docs/adr/0057-production-erc5219-bytes-store.md and 0058-router-web3-serving-hardening.md` · `Designs/clientv2/sdk-boundaries.md:2 (no banner)` · `Designs/efsv2/client-os-pressure-report.md:151-155 (P12 box open)` · `scripts/tri-sync-check.sh (Check 1 prose vs tag only)`

**Verified:** not separately verified; clustered from 4 independent lane findings · **Source lanes:** S6-sdk-and-mount-spread-08, R11b-clientv2-packages-w-08, R17-sdk-and-mounts-05, R15-efs15-evidence-13

### PRO-22 — 'Feed the existing gates' produced pointer links, not gate-text changes

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `owner` · **Severity:** important · MVP-relevant

The 2026-08-13 evidence round routes its venue/L1 findings to V2-E5/V2-E7 (Reviews/2026-08-13-claude-evidence-round/README.md:160, 205-217), Designs/efsv2/README.md line 110 links the round, and Decisions.md line 21 records the routing — but Designs/efsv2/owner-decision-inbox.md is "Last reconciled: 2026-08-12", the day before the round, and the V2-E4/E5/E7 texts are unchanged. The inbox's recording rule (lines 290-298) has steps for an owner answer and none for evidence arriving, and the Kanban Core card that would have carried Stage B expired 2026-08-16. This is the mechanism behind the whole family of "evidence exists, gate text did not move" findings (PRO-17, PRO-19, PRO-20): add "evidence received — columns/scenarios added" as an inbox reconciliation step, amend V2-E4 (schedule columns), V2-E7 (notice bar, A-1 disposition, fee variance, L2 EIP-8037 adoption) and V2-E5 (define "qualifying"), and re-card Stage B.

**Evidence:** `Reviews/2026-08-13-claude-evidence-round/README.md:160, 205-217` · `Designs/efsv2/README.md:110` · `Decisions.md:21` · `Designs/efsv2/owner-decision-inbox.md:5, 40-68, 290-298` · `Kanban.md:42-43`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S8-evidence-bindings-vs-13

### PRO-23 — The Kanban board does not describe current work: expired, TTL-less, and invented cards

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `clientv2`, `open-web-app-store` · **Severity:** important · not on the MVP path

All three In Flight cards are expired as of 2026-09-02 — Git/forge prototype "claimed 2026-08-14, expires 2026-08-17", Grants "expires 2026-07-30", Core hardening "expires 2026-08-16" (Kanban.md lines 37, 40, 43) — and Daily Notes/agent-status.md already said "three In Flight cards are stale" on 2026-08-21. Five Backlog "Draft:" cards (layered Type/Data ABI, Web Client/OS, Open Web App Store, hierarchical Files, Media Library, lines 10-18) carry "started 2026-08-14" claims by named agents with no expires date, contrary to Onboarding/start-here.md lines 32-43 (claim = move to In Flight with expires), so @codex-gpt-5 holds three cards against AGENTS.md's "2 In Flight per agent"; Blocked is empty although everything waits on authorization, and git log 2026-08-22..30 shows the real work (WCO standards passes, PM idea routing) happening under Backlog cards and Ideas.md. A fourth stale card sits under "## Under Review" (line 51) — the file-browser-requirements doc "Awaiting review of the #status/draft requirements doc" — although the 2026-08-12 hold and Designs/clientv2/README.md:80-87 reclassified that doc as historical evidence, and no audit script flags Under Review staleness. The Store card (lines 13-14) still says "current step: James review … before disposable fixture plans" although the fixture ran and was recorded on 2026-08-22, whose two draft-changing outputs appear in neither the card, the Store inbox ("Last reconciled: 2026-08-14") nor the architecture's open questions. And line 16 claims "James review of the approved conceptual candidate and proposed core/os/drive implementation sequence" for hierarchical-files-and-folders.md although owner-rulings.md holds no Files ruling and the doc's own banner (lines 15-21) says it is "not an owner ruling, freeze, deployed interface" — the word "approved" invites an agent to treat the candidate as adopted.

**Evidence:** `Kanban.md:10-18, 13-14, 15-16, 37, 40, 43, 49-51` · `Daily Notes/agent-status.md:2026-08-21 @pm entry; 234` · `Onboarding/start-here.md:32-43; AGENTS.md:§Hard rules ('Respect card TTLs')` · `Designs/clientv2/owner-decision-inbox.md:1-14; Designs/clientv2/README.md:80-87; Open-Decisions.md:21, 74` · `Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md:65, 226-229; Designs/open-web-app-store/owner-decision-inbox.md:5; architecture.md:965-990` · `Designs/efsv2/hierarchical-files-and-folders.md:15-21; Designs/efsv2/README.md:82-88; Designs/efsv2/owner-rulings.md (last touched 2026-08-12, no Files ruling)`

**Verified:** not separately verified; clustered from 4 independent lane findings · **Source lanes:** R19-process-rulings-ledg-08, R11b-clientv2-packages-w-15, S1-appstore-x-os-x-types-09, R3-efsv2-files-09

### PRO-24 — Sepolia-first is presented as ratified by James but recorded in no ruling ledger

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `web-client-os`, `owner` · **Severity:** important · MVP-relevant

Designs/efsv2/README.md line 9 says "James has ratified the greenfield direction and the Core / optional Commons / Web Client and OS layer boundary. Sepolia is the first development Commons", and the Kanban Core-hardening card repeats "James ratified … optional Commons with Sepolia first for development"; Designs/web-client-os/README.md §Authority map files it under "Owner-adopted EFS-wide inputs" and mvp-and-acceptance.md §Development venue calls it "the definite first development Commons". Designs/efsv2/owner-rulings.md has zero Sepolia hits (grep verified) — its 2026-08-12 entry says only "No Commons home chain is selected" — and V2-E7 says "Do not select a chain yet"; grep across Designs/efsv2/*.md hits only README.md and two historical files. The only owner-attributed source is direction 10 in the client README ("Sepolia is the first development Commons because it is the active near-free shared venue"), so whether James said it on 08-12 or 08-14 is unverifiable from the vault. Both product docs also omit the caveat recorded for the venue they call definite: CORRECTIONS.md row "Sepolia is definitely permissioned — Raw lanes conflict … unresolved".

**Evidence:** `Designs/efsv2/README.md:9 (Current status blockquote)` · `Kanban.md:In Flight 'Harden EFS 2.0 Core' card` · `Designs/efsv2/owner-rulings.md:§2026-08-12 ('No Commons home chain is selected'); grep sepolia → 0 hits` · `Designs/web-client-os/README.md:direction 10 (line 75); §Authority map Owner-adopted EFS-wide inputs bullet 2` · `Designs/web-client-os/mvp-and-acceptance.md:§Development venue and repository posture` · `Designs/efsv2/owner-decision-inbox.md:§V2-E7 ('Do not select a chain yet')` · `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:row 'Sepolia is definitely permissioned'`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R19-process-rulings-ledg-04, R8-wco-product-mvp-priva-14

### PRO-28 — efsv2 document standing is unmarked: draft tags on historical docs, evidence-map gaps

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `arcade` · **Severity:** important · not on the MVP path

Onboarding/conventions.md line 95 defines #status/superseded for "A newer design replaced it", yet all six lane docs plus freeze-gates.md, apps-cookbook.md, os-pass-handoff.md, kel.md, read-lens-spec.md, codex-*.md, identity.md and ops-doctrine.md still carry #status/draft while Designs/efsv2/README.md line 5 and owner-rulings.md lines 176-181 call them evidence; ethereum-first-efs-and-os.md (line 3, "captures current owner intent"), solana.md, playable-archive-requirements.md and client-os-pressure-report.md carry no greenfield correction banner at all, unlike assumptions-and-requirements.md and human-overview.md. The README's evidence map (lines 95-111) omits those four files and also fs-pass-synthesis.md, fs-pass-freeze-reservations.md, fs-pass-james-decisions.md, fable-fs-kickoff.md and large-file-uploads.md — still linked from Designs/efsv2/solana.md line 5 and Designs/arcade/v2-pressure-and-migration.md — and omits Reviews/2026-08-13-efs2-stage-a-corpus/ although hierarchical-files-and-folders.md line 6 declares "Depends on: … the Stage A B0 candidate" and Reviews/README.md line 84 indexes it; Stage A's own proposal B2 ("Add the Stage A doc set + corpus to the README doc table") was never applied, so a reader entering through the efsv2 README cannot find B0. README line 142 ("The two active docs are #status/draft") is stale against four current docs. And fs-pass-james-decisions.md line 3 still reads "Status: draft — decisions pending James" with nine numbered decisions while Open-Decisions.md reports "Ask now: 0"; only two are marked superseded (owner-decision-inbox.md:277-283) and decisions 5-9 (keyWrap role, merge-rule declaration, B3 demotion, channel observatory, web3:// safelist owner) were neither ruled nor retired.

**Evidence:** `Onboarding/conventions.md:95 (#status/superseded)` · `Designs/efsv2/README.md:5, 82-88, 95-111 (evidence map), 142` · `Designs/efsv2/ethereum-first-efs-and-os.md:3; client-os-pressure-report.md:12; hierarchical-files-and-folders.md:3, 6` · `Designs/efsv2/fs-pass-james-decisions.md:3; Designs/efsv2/owner-decision-inbox.md:277-283` · `Designs/efsv2/owner-rulings.md:176-181` · `Designs/efsv2/solana.md:5; Designs/arcade/v2-pressure-and-migration.md (links large-file-uploads)` · `Reviews/README.md:84; Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:§B2` · `Designs/clientv2/README.md:59`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R5-efsv2-context-require-11, R3-efsv2-files-08, R7a-stageA-b0-ids-envelo-12

### PRO-46 — The Git forge owner packet GD-1..GD-5 is in no queue, hold, or superseded list

**Owner:** `vault-process` · **Neighbours:** `git-forge`, `owner`, `efsv2` · **Severity:** important · not on the MVP path

A vault-wide grep for GD-[1-5] outside the corpus hits only Reviews/README.md line 74, Designs/efsv2/owner-rulings.md line 164 ("does not … answer GD-1…GD-5"), Kanban.md line 36, Daily Notes/agent-status.md line 176 and Reviews/2026-08-07-arcade-corpus/research-alternatives-and-falsification.md line 39 ("GD-2, unanswered"). There are zero hits in Designs/efsv2/owner-decision-inbox.md — whose superseded list enumerates every July ID P-1…P-23, LP-1…LP-10, N2…N6, Q1…Q4 — and none in Designs/owner-decision-inbox.md, Open-Decisions.md ("Ask now: 0"; only arcade and clientv2 holds), Owner-Inbox.md or Retirements.md. The deep dive's own recording rule (§6, "adopt nothing until answered and copied into [[owner-rulings]]") presumed an inbox entry that was never created because the pass ran on a research branch (requirements-ledger.md §B line 36); the only implicit disposition is Kanban.md line 36 ("Treat all proposed mechanics as greenfield bakeoff inputs"). GD-2 is a product-priority fork that belongs in V2-F2 (owner-decision-inbox.md:88-93) and is absent there too. This is a process defect, not a hold: create Designs/git-forge/owner-decision-inbox.md (which open-decisions.sh discovers) with GD-1/3/4/5 marked superseded-pending-recut against B0 and GD-2 routed to V2-F2.

**Evidence:** `Reviews/2026-08-07-efs-git-deep-dive.md:§6` · `Reviews/2026-08-07-efs-git-corpus/requirements-ledger.md:36 (§B research branch)` · `Designs/efsv2/owner-rulings.md:164` · `Designs/efsv2/owner-decision-inbox.md:88-93; 94-288 (§Superseded questions)` · `Open-Decisions.md:4, 8, 24-27` · `Kanban.md:36; Reviews/README.md:74; Daily Notes/agent-status.md:176`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R16-git-forge-04, S4-git-x-types-x-core-04

### PRD-11 — The held Arcade decision inbox is stale while ETHOnline FJ-4, cutoff today, defaults to that slice

**Owner:** `arcade` · **Neighbours:** `vault-process`, `owner`, `sdk` · **Severity:** minor · MVP-relevant

Designs/arcade/owner-decision-inbox.md:6 says 'Last reconciled: 2026-08-08', predating the 2026-08-13 evidence round; :14 still says 'Decide now (target: before the away window, ~Aug 14)' and the D1-D7 deadlines at :21,:27,:33,:39,:44,:49 ('Aug 14 (G0)', 'before the Week-3 seed run', 'Aug 29') have passed, while its blockquote hold promises to 'recut only the decisions that still block the one-game slice'. Two internal references are also stale: the D4 note (:39) reports ADR-0016 superseding SDK ADR-0006 as 'already in flight' when that ADR landed only on sdk branch chore/scaffold on 2026-08-09 (main holds only a LICENSE) and Kanban.md:62 then stopped all v1 SDK support work; D7 cites a draft assuming v1 records and portable manifests, and 'Later' (:70) parks N5 in the efsv2 inbox where owner-decision-inbox.md:267-270 marks it superseded. Open-Decisions.md:73 (generated 2026-08-21) still counts 7 live HELD arcade items under 'Inventoried but not askable'. The held inventory hides a live dependency: Owner-Inbox.md §DECIDE NOW FJ-4 asks James to enter ETHOnline before 'the conservative September 3 cutoff' with the 'one-game Arcade verified-artifact/fallback trace' as default candidate - that cutoff is today.

**Evidence:** `Designs/arcade/owner-decision-inbox.md:6, :14, :21, :27, :33, :39, :44, :49, :70` · `Open-Decisions.md §Inventoried but not askable (7); :73` · `Owner-Inbox.md §DECIDE NOW FJ-4; Kanban.md Backlog ETHOnline 2026 card` · `sdk branch chore/scaffold docs/adr/0016-content-hash-multibase-multihash.md (2026-08-09); Kanban.md:62` · `Designs/efsv2/owner-decision-inbox.md:267-270`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R14-arcade-12, R19-process-rulings-ledg-13

### SDK-12 — The disposition ledger still obligates native v2 to preserve frozen 1.5 IDs

**Owner:** `efs15` · **Severity:** minor · not on the MVP path

**Category** DEFECT · **Owning set** efs15 · **Severity** minor · **MVP-relevant** no
**Members** `R15-efs15-evidence-12`
**Neighbours** vault-process `Reviews/2026-08-07-efs-v2-to-15-corpus/v2-disposition-ledger.md` §Successor compatibility contract binds
"native v2" to preserve 1.5 TagDef/DataId/… IDs "natively or expose the frozen 1.5 namespace as explicit legacy"
and demands the v2 drafts "adopt 1.5's final layouts or move to new domain/profile strings";
`Reviews/2026-08-07-efs-v2-to-15-deep-dive.md`'s status line reads "recommendation for the active
`Designs/efs15/` draft". Both are void under `Decisions.md` 2026-08-08 and `Designs/efs15/README.md` §Rules for
reuse item 3, and neither file carries a supersession pointer. Vault process treats Reviews as history
(`Reviews/README.md`:3; `needs-integration.sh` skips `Reviews/`), so this is tolerable — but a reader arriving
via the efsv2 README evidence map → efs15 → the ledger sees an unmarked obligation on 2.0. Separately, the
ledger's three `[[owner-rulings]]` wikilinks became ambiguous on 2026-08-14 when
`Designs/media-library/owner-rulings.md` was created.

**Evidence:** `Decisions.md` · `Designs/efs15/README.md` · `Designs/media-library/owner-rulings.md` · `Reviews/2026-08-07-efs-v2-to-15-corpus/v2-disposition-ledger.md` · `Reviews/2026-08-07-efs-v2-to-15-deep-dive.md` · `Reviews/README.md`

**Verified:** not separately verified · **Source lanes:** 

### CORE-47 — Stage A's locator fold ignores horizonClaim, so a custody claim whose declared horizon has passed keeps its class

**Owner:** `efsv2` · **Neighbours:** `media-library`, `web-client-os` · **Severity:** minor · MVP-relevant

b0-content-locators.md:848-854 defines DurabilityGrade/1 { class, fundingUri?, horizonClaim? -- OPTIONAL claimed unix seconds (testimony) } and :874 says 'A grade is a claim by its Occurrence author ... not a Core-verified fact', but §10.3 (:1004-1006) computes the effective grade as the max class over admitted DurabilityGrade/1 with no reference to horizonClaim or basis time, while health comes only from the latest AvailabilityObservation/1 (:1007-1010, UNPROBED if none). Inference: a lapsed FUNDED_PINNED locator whose horizon has passed and which has never been probed outranks a live BEST_EFFORT one -- the 'commitment survives, bytes do not' shape reproduced inside the evidence layer. The IPFS maintainership review asks the operational ledger to track 'funding horizon, repair owner' (:153-156) and owner-rulings.md:37 notes 'IPFS pinning decays when grants lapse'. Fix: make an expired horizonClaim demote the effective class at basis time or drop the field, and add the fixture 'grade with expired horizon and no probe'.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:§10.1 lines 845-876; §10.3 lines 1003-1011` · `Reviews/2026-08-24-ipfs-maintainership-transition.md:153-156` · `Designs/efsv2/owner-rulings.md:§2026-07-10 Storage line 37`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S9-confirmed-then-unread-08

### CORE-48 — '127 COVERED' is quoted bare in four summaries although the table's own counting rule hides a dozen half-deferred rows

**Owner:** `efsv2` · **Neighbours:** `vault-process` · **Severity:** minor · MVP-relevant

traceability.md §0.1 counts a row by its first status token, and §8 note (i) warns '127 COVERED must never be quoted as 127 requirements fully done'. Rows carrying a DEFERRED residual that still count as COVERED include C-LY-4 (venue), C-AA-4 (managed Principal), C-PS-7/C-PS-8 (OS cage, UI), AT-1 (Web Client build), AT-8a/AT-9a (Arcade player, Git product), AT-15/AT-16 (product parity, crypto), OR-4, OR-5, OR-B4, OR-B7, OR-12b, S-RX2 and S-RL1. STATUS.md deliverable 3, stage-a-report.md, Kanban.md:43 and Daily Notes/agent-status.md:201 all quote '127 COVERED / 20 DEFERRED / 4 GAP' without the caveat. The honest MVP reading is the opposite of the headline: every product surface -- Web Client, Arcade player, Git UI, mount, crypto, KEL -- sits outside the COVERED set.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:§0.1 Counting rule; §8 note (i); rows C-LY-4, C-AA-4, AT-1, AT-8a, AT-9a, AT-15, AT-16` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:deliverable 3 row` · `Kanban.md:43; Daily Notes/agent-status.md:201`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R6-stageA-overview-13

### CORE2-01 — Spine object names do not reconcile: TypeSchema vs TypeRevisionId, Context/Envelope, Binding, Withdrawal

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `open-web-app-store` · **Severity:** minor · not on the MVP path

Four current or near-current spine docs name the same objects differently and nothing bridges them. `Designs/efsv2/README.md` lines 71-72 ('TypeSchema is the current plain-language name; older files call similar concepts TypeRevision') and `core-architecture-candidate.md` §Type Schema ('Working replacement for the confusing name TypeRevision') pin TypeSchema, and B0 uses TypeSchemaId throughout, but `layered-type-system-and-data-abi.md` (2026-08-14, a current draft and live experiment target) uses TypeRevisionId 12 times and TypeSchemaId zero times (lines 200-204, 344, 367), and the whole client set inherited the replaced noun (`Designs/web-client-os/type-data-abi-boundary-pressure.md` §Names that must not collapse: EfsTypeRevision/exactTypeRevisionRef). The same unbridged drift runs through the rest of the object model: 'immutable shared Context' (system-constitution.md:286, 324, 351; README.md:64) versus PublicationEnvelope (candidate:134; B0 SR-2) with 'Context' at 0 hits in B0/Files/MVP; the candidate's single Binding struct (217-220) versus B0's BindingSet/1 + BindingTombstone/1 + Withdrawal/1 (b0-binding.md:274-305) which the MVP (247, 829) and Files (91) already use; 'revocation' (constitution:107,156,181; owner-rulings.md:49 item E) with no candidate primitive, realised in B0 as OccStatus.revokedAtOrdinal + liveCount; and 'Recognition Record' (candidate:188; b0-realm-admission.md:995) defined nowhere. Add to that the candidate-vs-B0 divergences on AdmissionIntent (occurrenceRefs vs envelopeId+leafMask), the Binding struct and the RealmRevision formula, and a reader of the current spine cannot reconstruct the object names Stage A actually pinned. Repair is one names table in the candidate mapping each spine word to its B0/layered refinement, plus defining or cutting Recognition Record.

**Evidence:** `Designs/efsv2/README.md:lines 64, 71-72` · `Designs/efsv2/core-architecture-candidate.md:§Type Schema lines 68-80; 134-141, 188, 217-220, 230-232` · `Designs/efsv2/layered-type-system-and-data-abi.md:lines 200-204, 344, 367; §5 Exact Type revision` · `Designs/efsv2/system-constitution.md:107, 156, 181, 286, 324, 351; §What is deliberately not frozen` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md:§1, SR-2, SR-3, SR-10, SR-11` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md:274-305` · `Designs/web-client-os/type-data-abi-boundary-pressure.md:§Names that must not collapse` · `Designs/web-client-os/mvp-and-acceptance.md:84-103, 247, 829`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R6-stageA-overview-15, R10-wco-technology-stand-10, S7-efsv2-object-model-co-09

### CORE2-02 — efsv2 README is stale: no Stage A rows, wrong status line, board disagrees

**Owner:** `efsv2` · **Neighbours:** `vault-process` · **Severity:** minor · not on the MVP path

`Designs/efsv2/README.md` §Evidence map (lines 91-112) and §Read this on a phone index no Stage A artifact at all (grep 'Stage' in the README returns nothing), so the corpus is findable only from `Reviews/README.md`. §Status line 141 says 'The two active docs are #status/draft' while four docs are current by the README's own text (constitution, candidate, layered [draft], Files [#status/review]) and the folder holds 40+ #status/draft files; `hierarchical-files-and-folders.md` line 13 is '#status/review' ('moved [[hierarchical-files-and-folders]] to review', Daily Notes/agent-status.md 2026-08-14 line 208) while `Kanban.md` line 15 still lists it as 'Draft: ... hierarchical files and folders' and the README calls it 'a draft experiment target'. The evidence map also omits fable-handoff-portable-schemas-and-validators.md, fable-handoff-v2-tag-core.md and apps-cookbook.md, `layered-type-system-and-data-abi.md` line 1323 ticks '[x] No design lifecycle dependencies' while its header (line 5) lists four design dependencies with 'Reviewers: —', and the label 'A2' means the gas snapshot in freeze-gates.md:49 / onchain-completeness.md:97 / owner-rulings.md:69 but the qualifying-Realm scope proposal in proposed-spine-edits.md:110 and STATUS.md:80-81. This is exactly the failure the 2026-07-16 META ruling named ('README.md is stale' as the reason designs were missed, owner-rulings.md line 100), and `proposed-spine-edits.md` §B2 exists to prevent recurrence and was not applied.

**Evidence:** `Designs/efsv2/README.md:§Evidence map lines 91-112; §Status lines 140-144` · `Designs/efsv2/hierarchical-files-and-folders.md:line 13 (Status: review)` · `Kanban.md:Backlog line 15` · `Daily Notes/agent-status.md:2026-08-14 line 208` · `Designs/efsv2/layered-type-system-and-data-abi.md:5, 7, 1323` · `Designs/efsv2/owner-rulings.md:line 100` · `Reviews/2026-08-13-efs2-stage-a-corpus/corpus/proposed-spine-edits.md:§B2 rationale; line 110` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:80-81`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R6-stageA-overview-16, R2-efsv2-types-ids-oncha-15, R19-process-rulings-ledg-15

### CORE2-05 — human-overview.md is still the named plain-English guide but teaches superseded kinds, IDs and decisions

**Owner:** `efsv2` · **Neighbours:** `vault-process` · **Severity:** minor · not on the MVP path

`Designs/efsv2/README.md` line 98 labels human-overview.md 'Historical synthesis until rewritten from the new constitution' and the file has a banner (lines 10-14), but its Status field (line 3) still reads 'draft synthesis and decision guide' and 676 lines of July content follow. §6 item 3 praises the 'Five-kind tag core. TAGDEF, DATA, LIST, PIN, and TAG' (line 190), which owner-rulings.md L178-181 says must re-earn inclusion; §2.5 'The DATA ID itself is owner/salt-derived, not a content hash' (line 95) contradicts `core-architecture-candidate.md` line 115 (RecordId = H(domain, typeSchemaId, canonicalBody)); §11 'James should ultimately dispose of D-1 through D-16' (line 541) contradicts `owner-decision-inbox.md` line 10 ('Nothing here needs an immediate owner answer'); 'Decision 6A — Rename seq to order' (485) is superseded by inbox Q1 (277); and 'Settled — no universal exact-slot collision bit ... must not be reopened' (495-497) has unstated standing under the 08-12 reset. `assumptions-and-requirements.md` §14 step 8 (line 568) planned the rewrite and none exists, so a newcomer sent to the only plain-English document is misled. Four different 'D-n' numberings (ledger D-1..D-16; human-overview Decision 4/6A/6B/8; multichain-dependency-map.md:20-24 D-1..D-5; pressure report D1-D4) compound the confusion.

**Evidence:** `Designs/efsv2/human-overview.md:3, 10-14, 95, 190, 485, 495-497, 541` · `Designs/efsv2/README.md:line 98` · `Designs/efsv2/core-architecture-candidate.md:line 115` · `Designs/efsv2/owner-decision-inbox.md:10, 277` · `Designs/efsv2/assumptions-and-requirements.md:§14 line 568` · `Designs/efsv2/multichain-dependency-map.md:20-24`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R5-efsv2-context-require-12

### CORE2-08 — lens-spec and lens-pass-synthesis assign work against the retired #efs1 link grammar

**Owner:** `efsv2` · **Neighbours:** `clientv2`, `web-client-os` · **Severity:** minor · not on the MVP path

`Designs/efsv2/lens-spec.md`:92 ('the OS link classes (pr/gx/gf/a/sy/k) — the client lane must attack them under the same invariant (GL-9); boot-and-profiles is amended for the grammar rulings') and `lens-pass-synthesis.md`:82 ('amend boot-and-profiles (link grammar + fragment placement)') target a grammar the spine retired as inherited bytes (`Designs/web-client-os/README.md`:396; `system-profiles-and-generations.md`:1422) and a gx behaviour explicitly superseded (`Designs/clientv2/boot-and-profiles.md`:10). The surviving requirement ('a hostile link may waste your time; it may never spend your trust') is already WCOS-R24 (`product-constitution-and-roadmap.md`:172), so the obligation should be re-pointed at the spine's route schema or closed rather than left pointing at dead work.

**Evidence:** `Designs/efsv2/lens-spec.md:92` · `Designs/efsv2/lens-pass-synthesis.md:82` · `Designs/clientv2/boot-and-profiles.md:10` · `Designs/web-client-os/README.md:396; system-profiles-and-generations.md:1422; product-constitution-and-roadmap.md:172`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R11a-clientv2-thesis-ker-17

### CORE2-09 — The reserved-blob ruling lives only in large-file-uploads.md, a doc with no declared standing

**Owner:** `efsv2` · **Neighbours:** `media-library`, `vault-process` · **Severity:** minor · not on the MVP path

`Designs/efsv2/large-file-uploads.md` §5 'Reserve the blob tier — RULED (A)' (line 81) and §'Two shipped tiers' are the only places the blob-tier ruling lives, and four sibling 2026-07-07 James rulings in the same file appear in no ledger (`owner-rulings.md` begins 2026-07-10). The file is omitted from the README §Evidence table (lines 95-112) — as are playable-archive-requirements.md, ops-doctrine.md, read-lens-spec.md and freeze-gates.md — while `system-constitution.md`'s 'Large content' acceptance row (line 314), `Designs/media-library/media-infrastructure.md` and Stage A `b0-content-locators.md` §10.1 all cite its BYTES grades. Neither system-constitution.md nor core-architecture-candidate.md restates the blob disposition (0 chain-sense 'blob' hits), so a reader cannot tell whether the ruling is current, historical, or reopened by the 2026-08-08 greenfield ruling. The posture is consistent wherever it appears: this is provenance, not design. Repair is one README row plus ledgering the 07-07 rulings or marking them superseded.

**Evidence:** `Designs/efsv2/large-file-uploads.md:1-14, 28, 67, 73-81` · `Designs/efsv2/README.md:§Evidence table lines 95-112` · `Designs/efsv2/owner-rulings.md:line 8 (ledger begins 2026-07-10)` · `Designs/efsv2/system-constitution.md:'Large content' row line 314` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:§10.1 line 857`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R18-evidence-round-13, S8-evidence-bindings-vs-06

### CORE2-19 — Stage A's cross-chapter ABI does not compile: read names, widths, return types

**Owner:** `efsv2` · **Neighbours:** `sdk` · **Severity:** minor · not on the MVP path

`b0-indexes.md` §3.6 (996-1003) and its Interfaces list (2054-2058) define getBindingHead(bindingKey) and getBindingAtBasis, while `b0-binding.md` §8 (1074-1114) defines readHead/readHeadByPosition/readHeadBatch/readHistory and says the Lens consumes readHead (Interfaces item 5, 1199-1200) — but `b0-lens.md` §5.2 line 365 consumes getBindingHead; `b0-lens.md` §4.1 line 270 and §7.1 line 592 read plan bytes through recordBody(recordId), which no other chapter defines (b0-indexes:762 defines getRecord), and b0-indexes uses both receiptOf (721) and getReceipt (783) for the same lookup. Widths and return types diverge too: `b0-realm-admission.md`:1738 getTypeSchema returns 'uint48 typeOrd' while :1703 typeSchemaIdByOrdinal takes 'uint64 typeOrdinal' against SR-4's 'ordinals are uint64 at every ABI' (b0-overview.md:160); :1804 readHistory returns 'uint8 completeness' instead of the Completeness enum defined at 1567-1572; `b0-principal-authority.md`:1216 returns 'PrincipalClass class' but :1493 returns 'uint8 class'. The overview's residue rule (593-596) only covers SR pins, none of which names read ABI, and the harness and realm chapters inherit both spellings, so each of these is a compile-time mismatch a Stage B TS/Rust SDK will have to reconcile by invention.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:§3.6 996-1003; 721, 762, 783; Interfaces 2054-2058` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md:§8 1074-1114; Interfaces item 5 1199-1200` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md:§4.1 270; §5.2 365-369; §7.1 592` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:1703, 1738, 1804, 1567-1572` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:1216, 1493` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md:160-164, 593-596`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R7a-stageA-b0-ids-envelo-10, R7b-stageA-b0-indexes-le-06

### CORE2-20 — upgradeAuthorityKind=1 classifies by code presence, which the principal chapter bans

**Owner:** `efsv2` · **Severity:** minor · not on the MVP path

`b0-realm-admission.md` §7.1 line 1348 states 'Kind 1 requires that account to have no code at activation; kinds 2 and 3 require code at activation.' `b0-principal-authority.md` AUTH-INV-2 (48-53) says the opposite for the same reason the set adopted EIP-7702 discipline: 'a delegated EOA has code while retaining key authority, so code-presence dispatch misclassifies', and the claimed kind — never account state — selects the algorithm. A 7702-delegated controller EOA therefore cannot be kind 1 and must claim kind 2 with a codehash that changes on every redelegation, which contradicts the chapter it shares a corpus with.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md:1344-1351` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:48-53 (AUTH-INV-2)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R7a-stageA-b0-ids-envelo-09

### CORE2-21 — Permanent domain-table defects: unhyphenated realmgenesis and a sketch-only DOM_LEAF inside the Core hash

**Owner:** `efsv2` · **Severity:** minor · not on the MVP path

`b0-encoding-and-ids.md` §1.3 line 104 mints DOM_REALM_GENESIS = 'efs2/realmgenesis/1', the only multi-word Core domain without a hyphen (cf. 'realm-revision', 'admission-intent', 'typeschema-group'), in a table whose own rule (line 74) is 'old constants are never reinterpreted' — so the spelling is permanent once minted. Line 95 lists DOM_LEAF as '§4.2b sub-variant only, not B0' yet gives it class 'id', while lines 138-139 say the Core subset entering codexConstantsHash 'is exactly the id/key/slot/tag rows' — so a formula B0 never uses moves the profile hash that identifies a Core revision.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md:74, 95, 104, 138-139`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R7a-stageA-b0-ids-envelo-11

### CORE2-26 — Layered Type doc carries the forge obligation as prose and mints a third vocabulary

**Owner:** `efsv2` · **Neighbours:** `git-forge` · **Severity:** minor · not on the MVP path

`layered-type-system-and-data-abi.md` §'Git objects, checkpoints, and Forge data' (871-879) names Issue, PatchRevision, Review, CheckEvidence and Release with no Type shapes or fixture rows, and T7 (line 1215) lists 'stock Git checkpoint reconstruction and Forge evidence' as one corpus item; grep for FX-GIT/GitObject/GitPushTransaction/WikiPageRev returns 0. Stage A's vocabulary is `Issue/1`, `PullRequest/1`, `Review/1`, `Reaction/1`, `TeamMembership/1`, `Edit/1`, `ArtifactRelease/1` (`harness-and-fixtures.md`:493-500) and the Git corpus's is `ProposalV1`, `ProposalStatusV1`, `SkillReleaseV1`, `mergeOf` (`Reviews/2026-08-07-efs-git-corpus/wiki-and-collab.md` §6) — three vocabularies for one workload with no crosswalk. The 2026-08-07 obligation ('E2 / portable-schemas fixtures should carry forge objects', `owner-rulings.md`:165) is honoured only by Stage A (traceability OR-G2:312, C-FS-4:215, AT-9a:236). Repair: the Type doc cites FX-GIT as its T7 Forge fixture or defines its own rows, and one vocabulary crosswalk lands in git-forge requirements.

**Evidence:** `Designs/efsv2/layered-type-system-and-data-abi.md:871-879, 1207-1215` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:493-500` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:215, 236, 312` · `Designs/efsv2/owner-rulings.md:line 165` · `Reviews/2026-08-07-efs-git-corpus/wiki-and-collab.md:§6`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** S4-git-x-types-x-core-09

### CORE2-46 — Stale file:line and path evidence in the on-chain and deterministic-ids docs

**Owner:** `efsv2` · **Severity:** minor · not on the MVP path

`Designs/efsv2/onchain-graph-queries.md` line 23 cites a machine-local path /Users/james/Code/EFS/contracts/packages/hardhat/contracts/. Checked against the v1 clone at /home/user/efs-project/contracts (HEAD 2026-06-25): EdgeResolver.sol lines 202/206/745/795/808 and AliasResolver.sol 37-38 match, but EFSIndexer.sol line numbers are off by ten (`_allReferencing` cited 215, actual 224; `getAllReferencing` 791 vs 801; `getIncomingAttestations` 762 vs 772; `getOutgoingAttestations` 774 vs 784; count 899 vs 909), and `onchain-completeness.md` R7 cites `EFSRouter._getBestMirrorURI :1065` where the actual line is 1225. `deterministic-ids.md` line 6 links `../../../contracts/docs/adr/0049-file-content-identity-hash-as-data.md`, which resolves to /home/user/contracts (absent here; the file exists under /home/user/efs-project/contracts/docs/adr/), and `Designs/cross-repo-reference-mirror.md` lines 10-19 document the /efs/ colocation assumption behind such paths. The symbols exist; only the numbers and paths are stale.

**Evidence:** `Designs/efsv2/onchain-graph-queries.md:23-35` · `Designs/efsv2/onchain-completeness.md:43-50` · `Designs/efsv2/deterministic-ids.md:6` · `Designs/cross-repo-reference-mirror.md:10-19` · `/home/user/efs-project/contracts/packages/hardhat/contracts/EFSIndexer.sol:224, 772, 784, 801, 909` · `/home/user/efs-project/contracts/packages/hardhat/contracts/EFSRouter.sol:1225`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R2-efsv2-types-ids-oncha-07

### CORE2-47 — Dead and ambiguous wiki-links in lane docs; the Stage A corpus index is misnamed

**Owner:** `efsv2` · **Neighbours:** `vault-process` · **Severity:** minor · not on the MVP path

`Designs/efsv2/efs-v2-holistic-redesign.md` §The honest justification (line 25) links '[[For-James]]'; no For-James.md exists in the vault, the live owner queue file is `Owner-Inbox.md`, and `Decisions.md` 2026-07-01 records the For-James lineage. `Designs/efsv2/owner-rulings.md` 2026-07-16 (lines 89 and 100) links '[[identity]]', which resolves to both `Designs/efsv2/identity.md` and `Reviews/2026-07-07-efsv2-corpus/identity.md`. Every other wiki-link and relative path checked resolves, including the README's evidence-round anchor '#realm-venue-and-l1-evidence'. Note for the lead: `Reviews/2026-08-13-efs2-stage-a-corpus/README.md` does not exist — the corpus index is STATUS.md.

**Evidence:** `Designs/efsv2/efs-v2-holistic-redesign.md:line 25 ([[For-James]])` · `Designs/efsv2/owner-rulings.md:lines 89, 100 ([[identity]])` · `find /home/user/planning -name For-James.md (none); -name identity.md (two hits)` · `Reviews/2026-08-13-efs2-stage-a-corpus/ (STATUS.md, stage-a-report.md; no README.md)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R1-efsv2-spine-17

### PRD-48 — Forge objects exist in Stage A fixtures in three unreconciled vocabularies with three acceptance suites, none executed

**Owner:** `git-forge` · **Neighbours:** `efsv2` · **Severity:** minor · not on the MVP path

Stage A defines GitObject/1, GitObjectClosure/1, GitPushTransaction/1, WikiPageRev/1, Issue/1, PullRequest/1, Review/1, Reaction/1, TeamMembership/1 and Edit/1 and reuses ArtifactRelease/1 (harness-and-fixtures.md:485-500, §2.2 FX-GIT lines 783-870), with traceability OR-G2 'fixtures carry forge objects (2026-08-07)' COVERED (:312) and AT-9a COVERED at specification level (:236). Designs/efsv2/layered-type-system-and-data-abi.md:871-879 names a different set - Forge Issue, PatchRevision, Review, CheckEvidence, Release - and the corpus a third: GitRepoGenesisV1, GitRefClaimV1, ClosureManifestV1, ProposalV1, ProposalStatusV1, SkillReleaseV1, mergeOf. No crosswalk exists. There are likewise three acceptance suites - the GoE pressure test, corpus items 1-22 (prototype-plan.md) and Stage A CV-GIT-STOCK - and none has run: STATUS.md:44-55 records 'No canonical Stage B corpus bytes... have been minted.'

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:485-500, :783-870` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:236-237, :312` · `Designs/efsv2/layered-type-system-and-data-abi.md:871-879` · `Reviews/2026-08-07-efs-git-corpus/wiki-and-collab.md §6, §7; prototype-plan.md §Executable acceptance suite` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:44-55`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R16-git-forge-11

### PRD-23 — Three verified-read state vocabularies inside one media set, plus B0's fourth

**Owner:** `media-library` · **Neighbours:** `efsv2`, `web-client-os` · **Severity:** minor · MVP-relevant

media-infrastructure.md:147-177 defines NOT_REQUESTED|FETCHING|PARTIAL_VERIFIED|COMPLETE_VERIFIED|UNAVAILABLE|MISMATCH|UNKNOWN; plex-jellyfin-app.md:263-288 defines 'not-requested -> fetching -> verifying -> playable | unavailable | mismatch | unsupported | resource-exhausted'; B0 defines A0-A4 plus BYTES_UNBOUND|BYTES_PARTIAL|BYTES_COMPLETE|CONTENT_MISMATCH (b0-content-locators.md §8.2 lines 669-711); and the intake's ML-BYTE-02 (line 88) speaks of 'five uppercase labels'. All are labelled non-wire, but the shared 'verified reader' interface (media-infrastructure.md §Scope) and the README acceptance that 'Booru and Plex surfaces resolve the same Work/Blob identities' need one contract, and web-client-os Slice D plans 'verified ranges for large passive content' (product-constitution-and-roadmap.md:285-289), so a fourth vocabulary is likely.

**Evidence:** `Designs/media-library/media-infrastructure.md:147-177` · `Designs/media-library/plex-jellyfin-app.md:263-288` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md §8.2 lines 669-711` · `Reviews/2026-08-14-media-library-intake/evidence-and-requirements.md:88 (ML-BYTE-02)` · `Designs/web-client-os/product-constitution-and-roadmap.md:285-289`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R13-media-library-10

### PRD-25 — Media README header and Reviewers clearance predate the 2026-08-22 edits to two member docs

**Owner:** `media-library` · **Neighbours:** `vault-process` · **Severity:** minor · not on the MVP path

Designs/media-library/README.md:6-7 says 'Last touched: 2026-08-14' and every doc carries 'Reviewers: 2026-08-14 - independent authority/architecture pass; no Critical or Important finding after repair'. Commit bda3a88 (2026-08-22, 'design: distinguish media history from carrier availability') then edited media-infrastructure.md, adding §'Ethereum history and content-resolution pressure' (lines 179-206), and query-and-indexing.md, adding Graph-reconstruction conditionality (lines 277-286); both now read 'Last touched: 2026-08-22'. Daily Notes/agent-status.md:237 records no review of those additions, so the README's 'no Critical or Important finding' clearance should not be read as covering the 2026-08-22 state.

**Evidence:** `Designs/media-library/README.md:6-7` · `Designs/media-library/media-infrastructure.md:6-7, :179-206` · `Designs/media-library/query-and-indexing.md:6-7, :277-286` · `git log -- Designs/media-library (bda3a88, 2026-08-22); Daily Notes/agent-status.md:237`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R13-media-library-14

### PRD-33 — Store pre-promotion checklists require reviews from EAP and Nanda owners who do not exist

**Owner:** `open-web-app-store` · **Neighbours:** `vault-process`, `efsv2`, `git-forge` · **Severity:** minor · not on the MVP path

Designs/open-web-app-store/README.md:124 says 'Arcade, Media, Nanda, EAP, and other PMs own their application semantics', and the pre-promotion checklists at README.md:265 and architecture.md:1011 require 'Nanda, and EAP owners review their boundary slices', with EAP and Nanda consumer fixtures defined at architecture.md:916-922. A directory listing of Designs/ on 2026-09-02 shows no EAP and no Nanda folder: Nanda exists only as Brainstorms/2026-07-29-pm-nanda-neutral-agent-infrastructure-pressure.md and EAP only as a fixture row in Designs/efsv2/system-constitution.md:312 and the OS consumer table. The checklist cannot be satisfied as written, and the 'consumer pressure already incorporated' bullets for EAP and Nanda (README:192-199) have no counterpart document to check against. The same shape applies to the Git/Forge reviewer required at README.md:264 (see PRD-47).

**Evidence:** `Designs/open-web-app-store/README.md:124, :192-199, :264-265` · `Designs/open-web-app-store/architecture.md:916-922, :1011` · `Designs/efsv2/system-constitution.md:312` · `Designs/ directory listing 2026-09-02 (no eap or nanda folders)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R12-open-web-app-store-09

### PRD-39 — 'Resolution' is overloaded across Core, store and OS and will collide in generated codecs

**Owner:** `open-web-app-store` · **Neighbours:** `web-client-os`, `efsv2` · **Severity:** minor · not on the MVP path

Designs/open-web-app-store/architecture.md §Vocabulary corrections (43-45) reserves 'Lens' for 'an explicit bounded ResolutionPlan', then names the store's own dependency-derivation artefact ResolutionReceipt (:322-337). Designs/web-client-os/system-profiles-and-generations.md defines SystemResolutionReceipt (:233) and FollowResolutionReceipt (:607), app-runtime-and-direct-launch.md:133 adds AppFollowResolutionReceipt, and Core carries ResolutionPlan/Lens (core-architecture-candidate.md:300-326). Harmless in prose, but five Resolution* names owned by three sets will collide in generated codecs and DTOs on the type-data-abi adapter lane and in agent tool vocabularies.

**Evidence:** `Designs/open-web-app-store/architecture.md:43-45, :322-337` · `Designs/web-client-os/system-profiles-and-generations.md:233, :607` · `Designs/web-client-os/app-runtime-and-direct-launch.md:133` · `Designs/efsv2/core-architecture-candidate.md:300-326`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R12-open-web-app-store-13

### PRO-10 — Every SDK seam the MVP calls is named on main and specified nowhere

**Owner:** `owner` · **Neighbours:** `web-client-os`, `efsv2`, `sdk` · **Severity:** minor · MVP-relevant

Designs/web-client-os/architecture-and-modules.md §Layer 1A (lines 142-160) assigns the "Protocol SDK" the IDs, canonical codecs, validators, Core ABI, proofs and exact-basis RPC/signature/receipt evidence, and lines 1176-1179 say final SDK repository placement "should follow the EFS v2 SDK/repository design" — a design that exists only on the unmerged codex/sdkv2-pm branch (PRO-09). mvp-and-acceptance.md line 834 calls ActionPlan/ActionReceipt "current names illustrative"; Stage A gate G-5 routes to an "SDK result-model lane" (STATUS.md line 67) with no owner or document on main; hierarchical-files-and-folders.md line 4 lists sdk as a target repo but says only that "the SDK, Web Client, OS, and mounts share one resolver core" (§1.2 lines 118-119). Onboarding/authority.md §Scopes has no sdk scope and Kanban.md has had no SDK card since the Done card "Stopped v1 SDK support/merge work". The write-capable MVP therefore calls an interface layer with no specification, no owner and no repository anywhere on the coordination surface.

**Corrected reading (textual accuracy and currency lens)** — this supersedes the wording above:

Every SDK seam the MVP calls is named on main and specified only on an unmerged branch. Designs/web-client-os/architecture-and-modules.md §Layer 1A (table lines 148-160) assigns the "Protocol SDK" the IDs, canonical codecs, runtime validators, Core ABI, proofs, low-level index reads and exact-basis Ethereum RPC/signature/receipt evidence, and lines 1176-1179 say final SDK repository placement "should follow the EFS v2 SDK/repository design" — a design that exists nowhere on main (PRO-09). mvp-and-acceptance.md:834 calls ActionPlan/ActionReceipt "current names illustrative"; Stage A gap G-5 names an "SDK result-model lane" as its home (STATUS.md:67, under §Honest gaps and deferrals) with no owner or document on main; hierarchical-files-and-folders.md:4 lists sdk as a target repo but says only that "The SDK, Web Client, OS, and mounts share one resolver core" (§1.2, 118-119). Onboarding/authority.md:11 §Scopes has no sdk scope and Kanban.md has had no SDK card since the Done card "Stopped v1 SDK support/merge work for Nanda + Arcade" (line 62). The only actual specification and the only named owner are on the unmerged codex/sdkv2-pm branch — sdkv2:Designs/sdkv2/architecture-candidate.md §"Result and error model" (`ResultV0`) plus its package-boundary table, SDK-E2 for package topology, and the 2026-08-22 founder ruling authorizing a durable SDK PM — so on the coordination surface the write-capable MVP still calls an interface layer with no specification, no owner and no repository.

**Corrected reading (materiality and classification lens)** — this supersedes the wording above:

Retitle to 'The SDK seams the MVP calls are specified only on the unmerged codex/sdkv2-pm branch' and merge into PRO-09 as a consequence rather than tracking it separately. Cite sdkv2:Designs/sdkv2/architecture-candidate.md §'Result and error model' (244-337) as the existing specification and as the answer to Stage A gate G-5. Drop the Onboarding/authority.md 'no sdk scope' evidence, or restate it as a general vault-process defect (the scope roster names no design set created after July). Keep only the distinct residue: web-client-os/architecture-and-modules.md:1176-1179 points at an 'EFS v2 SDK/repository design' that main does not carry, and mvp-and-acceptance.md:834 makes ActionPlan/ActionReceipt an MVP requirement while disclaiming their names.

**Evidence:** `Designs/web-client-os/architecture-and-modules.md:142-160 (Layer 1A table), 1176-1179, 1185` · `Designs/web-client-os/mvp-and-acceptance.md:821-836 (line 834 ActionPlan/ActionReceipt illustrative)` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:67 (G-5 → SDK result-model lane)` · `Designs/efsv2/hierarchical-files-and-folders.md:4, §1.2 118-119` · `Onboarding/authority.md:§Scopes (no sdk scope); Kanban.md (no SDK card since Done 'Stopped v1 SDK support/merge work')`

**Re-classified in verification:** category UNDECIDED → DEFECT (materiality lens); severity blocking → minor (materiality lens)

**Routing note from verification:** materiality lens: vault-process (neighbours sdk, web-client-os) — not owner

**Verified:** text confirmed with correction (high confidence); materiality confirmed with correction (high confidence) · **Source lanes:** R17-sdk-and-mounts-02

### SDK-10 — The Base native-AA review has no greenfield banner and its compatibility spike is orphaned

**Owner:** `sdk` · **Severity:** minor · not on the MVP path

**Category** DEFECT · **Owning set** sdk · **Severity** minor · **MVP-relevant** no
**Members** `R18-evidence-round-10`
**Neighbours** efsv2 (V2-E1/V2-E5), web-client-os `Reviews/2026-07-19-base-native-aa-impact.md` §"v1 / EAS writes" ("immediate architectural fit… EFSUploadGateway")
and its EAS `msg.sender` framing are superseded by `Decisions.md` 2026-08-08 (:23, no v1 compatibility) with no
correction banner, and `Designs/sdk-architecture.md`:752 (historical per `Designs/README.md`:79) still says to
re-evaluate EFSUploadGateway after the spike. The review's 8-item Vibenet compatibility spike "before the
KEL/envelope freeze" is cited only from July docs (`efsv2/kel.md`:627, `codex-envelope.md`:15,
`assumptions-and-requirements.md`:165, `ops-doctrine.md`:14, `large-file-uploads.md`:38,
`clientv2/wallet-and-actions.md`:137) and is absent from V2-E1/V2-E5 and from
`web-client-os/ethereum-standards-and-interop.md` §acceptance fixtures (:584-603). The interop doc's boundary
rows do carry the review's keep-out-of-frozen-formats rules (EIP-8130 "Draft; watch… Do not freeze a public
WriteMechanism enum"; EIP-5792 preferred with sequential fallback; ERC-2771 `msg.sender` ≠ Principal;
payer/sponsor role separation, :254-303). Whether Cobalt/8130 shipped in September 2026 is unverifiable here.

**Evidence:** `Decisions.md` · `Designs/README.md` · `Designs/sdk-architecture.md` · `Reviews/2026-07-19-base-native-aa-impact.md` · `assumptions-and-requirements.md` · `clientv2/wallet-and-actions.md` · `codex-envelope.md` · `efsv2/kel.md` · `large-file-uploads.md` · `ops-doctrine.md`

**Verified:** not separately verified · **Source lanes:** 

### SDK-11 — Stale internal facts in the historical SDK docs

**Owner:** `sdk` · **Severity:** minor · not on the MVP path

**Category** DEFECT · **Owning set** sdk · **Severity** minor · **MVP-relevant** no
**Members** `R17-sdk-and-mounts-14`
**Neighbours** — `sdk-architecture.md` §`efs.batch()` "Design note on content hashing" says contentHash "is a bare SHA-256
digest… SDK ADR-0006", but the SDK moved to multibase-multihash `f1220…` under ADR-0016 (sdk `chore/scaffold`
`content/hash.ts` header; `sdk-v1-bridge-v2-compat-asks.md` ask 3). `sdk-read-surface.md` §Contracts view-layer
additions instructs the fetch path to use `getDataMirrorsByAttester`, while `sdk-architecture.md`'s 2026-06-20
revision entry states "there is no `getDataMirrorsByAttester`" and points to
`EFSFileView.getDataMirrors(dataUID, attester, start, length)`. Harmless unless these docs are mined as evidence
without re-checking — which SDK-03 makes likely, since they still read as live review-status designs.

**Evidence:** `sdk-architecture.md` · `sdk-read-surface.md` · `sdk-v1-bridge-v2-compat-asks.md`

**Verified:** not separately verified · **Source lanes:** 

### PRO-03 — Ruling ledgers violate their own recording rules: reversals unmarked, one ruling in both

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `sdk`, `arcade`, `git-forge` · **Severity:** minor · not on the MVP path

Decisions.md's header says "Mark reversed/irrelevant decisions or delete outright", yet the two 2026-08-07 entries ("Open an EAS-backed EFS 1.5 bridge…" and "EFS v1 plus the existing SDK is the supported bridge for current Nanda and Arcade work; harden and merge the SDK", line 25) sit unmarked directly above the 2026-08-08 greenfield entry (line 23) that reverses them, a reversal Kanban.md line 62 states explicitly and Kanban Done records as "Stopped v1 SDK support/merge work"; Designs/sdk-v1-bridge-v2-compat-asks.md lines 3-13 (status review) still depends on the 08-07 ruling and names Arcade as the product it serves. The 2026-07-29 Git entry's "The v1 product floor includes Git hosting" (line 33) is likewise dead, and its brainstorm promise that "authenticated HTTPS or SSH push work without requiring an EFS-only client" (Brainstorms/2026-07-29-pm-credibly-neutral-git-forge-and-agent-artifacts.md:87-89) was retracted by Reviews/2026-08-07-efs-git-deep-dive.md §3 and requirements-ledger.md line 79. Inside Designs/efsv2/owner-rulings.md the 2026-07-15 "RULED — PAY IT"/"ETCH IT" items carry no note that §2026-08-12 reduced them to "acceptance obligations unless James explicitly reverses one after the aggregate cost pass". Conversely the 2026-08-08 greenfield ruling is recorded in both Decisions.md and owner-rulings.md §2026-08-12 against Onboarding/authority.md's "never both", while the 2026-07-25 framing rulings are recorded in neither as rulings — so chains-render-like-drives and two-grade authority exist only in a pointer entry and two more were superseded (P-5, P-11) without the source ever becoming a ruling. A reader of either ledger alone sees contradictory live rulings.

**Evidence:** `Decisions.md:header Pruning paragraph, 23, 25, 33, 37` · `Kanban.md:62; Done 'Stopped v1 SDK support/merge work'` · `Designs/sdk-v1-bridge-v2-compat-asks.md:3-13` · `Brainstorms/2026-07-29-pm-credibly-neutral-git-forge-and-agent-artifacts.md:87-89` · `Reviews/2026-08-07-efs-git-deep-dive.md:§3; Reviews/2026-08-07-efs-git-corpus/requirements-ledger.md:79` · `Designs/efsv2/owner-rulings.md:§2026-07-15 items 17-18; §2026-08-12 first and second bullets` · `Onboarding/authority.md:§Recording a ruling ('never both')` · `Designs/efsv2/owner-decision-inbox.md:§P-5, §P-11`

**Verified:** not separately verified; clustered from 4 independent lane findings · **Source lanes:** R19-process-rulings-ledg-09, R19-process-rulings-ledg-10, R14-arcade-18, R16-git-forge-15

### PRO-15 — IPFS carrier-extinction trace parked on an expired card; the 2026-09-30 watch is unscheduled

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `web-client-os` · **Severity:** minor · MVP-relevant

Kanban.md line 43 (Core-hardening card) says "expires 2026-08-16" and, in the same trailer, "2026-08-24 carrier evidence at [[Reviews/2026-08-24-ipfs-maintainership-transition]] adds one Stage B cold guest-read/client-bootstrap trace" — evidence appended eight days after the card expired, to a card nobody owns and to a Stage B nobody has authorized. The review's §Watch gate asks for a recheck "before or shortly after 2026-09-30" (named Kubo/Helia/Boxo maintainers, security path, funded operator per public utility), and no Kanban card, Routine or Open-Decisions.md scheduled item exists for it (Open-Decisions.md lists Scheduled: 2, neither is this). The one dated external dependency on the MVP's byte path therefore has no owner and no calendar entry.

**Evidence:** `Kanban.md:43` · `Reviews/2026-08-24-ipfs-maintainership-transition.md:§Remaining operational gap, §Watch gate` · `Open-Decisions.md:§Scheduled (2 items, neither this)` · `Daily Notes/agent-status.md:245`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R18-evidence-round-11

### PRO-27 — Owner-Inbox carries un-IDed items open for months; the root router omits the media inbox

**Owner:** `vault-process` · **Neighbours:** `media-library`, `owner` · **Severity:** minor · not on the MVP path

Owner-Inbox.md §WHEN YOU HAVE TIME lists "Vault process changes landed 2026-07-23 … One thing needs your nod: whether to keep the structural SOUL edits" (41 days old) and "Frame-review the proposed design process → [[Brainstorms/2026-05-28-pm-design-process-synthesis]]" (3 months old) without FJ- IDs, against the file's own rules ("Stable IDs, never bare ordinals"; "Prune ruthlessly"), and its §FYI still narrates the 07-23 script fixes. Designs/owner-decision-inbox.md's "Start here" router lists efsv2, clientv2, arcade and open-web-app-store but not the existing Designs/media-library/owner-decision-inbox.md, so one product queue is unreachable from the root router.

**Evidence:** `Owner-Inbox.md:§WHEN YOU HAVE TIME; §How agents use this file (Rules); §FYI` · `Designs/owner-decision-inbox.md:'Start here' blockquote list` · `Designs/media-library/owner-decision-inbox.md (exists, unrouted)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R19-process-rulings-ledg-17

### PRO-29 — Link hygiene: ambiguous bare wiki-links and unvalidated backticked anchors

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `media-library`, `clientv2`, `open-web-app-store`, `web-client-os` · **Severity:** minor · not on the MVP path

Designs/media-library/owner-rulings.md (created 2026-08-14) makes the bare link [[owner-rulings]] resolve to two files, so the constitution's own authority pointer is ambiguous in Obsidian (Designs/efsv2/system-constitution.md line 5 "Authority input: [[owner-rulings]]", efsv2/README.md line 18, owner-decision-inbox.md lines 6 and 294); [[identity]] in clientv2/web-os-thesis.md line 5, kernel-capability-model.md line 4 and shell-and-sessions.md line 4 resolves to both Designs/efsv2/identity.md and Reviews/2026-07-07-efsv2-corpus/identity.md; bare [[README]] (human-overview.md:6, system-constitution.md:15) competes with 39 README.md files and [[network-privacy]] (client-os-pressure-report.md:132) matches two. Separately four cross-set anchors target headings written with inline code — ### `InstallBindingGeneration` (system-profiles-and-generations.md:435), ### `RunnerRealization` (:316), ### `LocalSelectionState` and `SessionGeneration` (:483) — linked from open-web-app-store/README.md:143, architecture.md:444 and web-client-os/architecture-and-modules.md:367, :708; whether Obsidian resolves a heading link through backticks could not be executed here, and no vault script validates wiki-link anchors (scripts/*.sh contain no anchor or heading check; open-decisions.sh's anchor() only slugs its own generated links). Individually cosmetic; together they argue for one link-check script.

**Evidence:** `Designs/efsv2/system-constitution.md:5, 15; Designs/efsv2/README.md:18; Designs/efsv2/owner-decision-inbox.md:6, 294` · `Designs/media-library/README.md:111 (second owner-rulings.md)` · `Designs/clientv2/web-os-thesis.md:5; Designs/clientv2/kernel-capability-model.md:4` · `Designs/open-web-app-store/README.md:143; Designs/open-web-app-store/architecture.md:444` · `Designs/web-client-os/architecture-and-modules.md:367, 708` · `Designs/web-client-os/system-profiles-and-generations.md:316, 435, 483` · `scripts/ listing (no anchor or heading validation)`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R11a-clientv2-thesis-ker-15, R9-wco-architecture-runt-13, S1-appstore-x-os-x-types-11

### PRO-30 — Reviews bookkeeping: fourteen reviews unindexed, a date mismatch, an open checklist

**Owner:** `vault-process` · **Neighbours:** `efsv2` · **Severity:** minor · not on the MVP path

A per-file check on 2026-09-02 shows Reviews/README.md has no entry for fourteen top-level reviews — including 2026-07-01-v2-adversarial-review.md, 2026-07-07-carrier-decision.md, 2026-07-10-cypherpunk-os-state-of-art-and-coherence-audit.md, 2026-07-10-efsv2-century-storage-and-cypherpunk-os-review.md, 2026-07-25-joined-fs-pass.md, 2026-07-25-lens-pass.md and 2026-08-07-arcade-deep-dive.md — although the README's own preamble calls these "point-in-time outputs" that are the reference history; the two 2026-07-10 reviews additionally have zero inbound links from any Designs/ doc, Decisions.md, Kanban.md or the Stage A corpus, the clearest case of a review never registered rather than superseded. Reviews/2026-07-25-lens-pass.md line 1 is titled "2026-07-28" and Designs/efsv2/lens-pass-synthesis.md says the pass was "run 2026-07-28" while the file and its corpus folder are dated 07-25. Separately Reviews/2026-08-13-claude-evidence-round/RECOVERY.md Task 5 steps 4-5 (lines 106-107) remain unchecked although git log shows the corpus landed in c48f252 (2026-08-13) and corpus/README.md reports all 30 files, so the folder presents its own recovery as unfinished behind a stale "REQUIRED SUB-SKILL" preamble.

**Evidence:** `Reviews/README.md:§Contents (14 reviews unindexed)` · `Reviews/2026-07-25-lens-pass.md:1; Designs/efsv2/lens-pass-synthesis.md:Status line` · `Reviews/2026-08-13-claude-evidence-round/RECOVERY.md:106-107 (Task 5 steps 4-5)` · `git log --format='%h %ad %s' -- Reviews/2026-08-13-claude-evidence-round/ → c48f252 2026-08-13` · `Reviews/2026-08-13-claude-evidence-round/corpus/README.md:§Recovery result` · `Designs/efsv2/README.md:Evidence map`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R20-older-reviews-08, R18-evidence-round-12

### PRO-31 — The 2026-06-10 holistic review was never reclassified against the greenfield

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `web-client-os` · **Severity:** minor · not on the MVP path

Kanban.md line 24 carries an unchecked card: "Reconcile the 2026-06-10 holistic review with the v2 redesign before implementation/mainnet work resumes… Reclassify only the findings that survive the v2 constitution instead of keeping the old review permanently In Flight." No reclassification exists, and the brief's three expired In Flight cards do not include this one, so it persists silently. Several findings do survive at requirement level — ARCH-2 hash-algorithm identifier → the candidate's algorithm-tagged ByteDigest/1; ARCH-7 EIP-4444 → "never replaced by … event logs"; ARCH-11 name normalization → direction 9 NFC; GAS-3 unbounded scan → "hard-bounded"; UX-5 → "verify bytes" — while ARCH-8 (deployer EOA as permanent default lens), ARCH-9 (no lens key-rotation story) and ARCH-10 (moderation doctrine) map to still-open items (inbox LP-5 guest default policy waiting on V2-E6; P-8 recovery deferred). Only SEC-1 and ARCH-4 are recorded closed (Kanban.md line 69, 2026-06-21), leaving 79 v1 findings in an undefined state.

**Evidence:** `Kanban.md:24, 69` · `Reviews/2026-06-10-holistic-review.md:ARCH-2, ARCH-7, ARCH-8, ARCH-9, ARCH-10, ARCH-11, GAS-3, UX-5` · `Designs/efsv2/system-constitution.md:§Honest reads and reconstruction; §Files, bytes, and large content` · `Designs/efsv2/owner-decision-inbox.md:LP-5, P-8`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R20-older-reviews-09

### PRO-41 — The Arcade content repo is not cloned here; cross-repo relative links resolve to nothing

**Owner:** `vault-process` · **Neighbours:** `arcade` · **Severity:** minor · not on the MVP path

Designs/README.md:68 lists the arcade target repos as "planning, contracts, client, content" and five arcade docs name content (mvp-architecture.md:4, catalog-plan.md:4, curation-and-social.md:4, rights-safety-and-operations.md:4, september-plan.md:4). efs-project/content exists on GitHub (public, last push 2026-07-30) but only contracts, client and sdk are cloned under /home/user/efs-project/, and Onboarding/repo-map.md:3-13 assumes a /efs/ sibling layout, so ../../../content/… and ../../../contracts/… links from Designs/arcade/ resolve to nothing in this checkout. The contracts citations themselves do check out against the 2026-06-25 clone (FileBrowser.tsx sandbox= at 2136/2278 vs cited 2135-2141/2277-2280; EFSFileView.sol getFilesAtPath 1091 and getDataMirrors 1267 exactly as cited; ADR-0040/42/49/52/55/56/64 present). Designs/README.md:68 also lists client (no arcade doc does) and omits sdk/devnet (which september-plan.md:4 names).

**Evidence:** `Designs/README.md:68` · `Designs/arcade/mvp-architecture.md:4; Designs/arcade/september-plan.md:4` · `Onboarding/repo-map.md:3-13` · `GitHub org listing (efs-project/content pushed 2026-07-30)` · `/home/user/efs-project/contracts/packages/nextjs/components/explorer/FileBrowser.tsx:2136, 2278`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R14-arcade-14

### PRO-43 — Store and Web Client/OS spines depend on each other, blocking promotion of either

**Owner:** `vault-process` · **Neighbours:** `open-web-app-store`, `web-client-os` · **Severity:** minor · not on the MVP path

Designs/open-web-app-store/README.md line 5 declares "Depends on: [[Designs/efsv2/README]], [[Designs/web-client-os/README]]" and Designs/web-client-os/README.md line 5 declares a dependency back on the store README; open-web-app-store/architecture.md l.5 depends on the OS README, and three OS docs (system-profiles-and-generations.md, app-runtime-and-direct-launch.md, architecture-and-modules.md, each l.5) depend on the store architecture. Designs/0001-design-system.md line 133 makes "Depends on: chain — all dependencies accepted or landed" a pre-promotion requirement, so neither product spine can ever be promoted first, and scripts/promotion-check.sh does not check it (grep 'depend' empty). One direction should become an "Inputs:" line, or the design system should state a peer-spine exception.

**Evidence:** `Designs/open-web-app-store/README.md:5; Designs/open-web-app-store/architecture.md:5` · `Designs/web-client-os/README.md:5; system-profiles-and-generations.md:5; app-runtime-and-direct-launch.md:5; architecture-and-modules.md:5` · `Designs/0001-design-system.md:133` · `scripts/promotion-check.sh (grep 'depend' empty)`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R12-open-web-app-store-10, S1-appstore-x-os-x-types-08

### PRO-47 — Root inbox claims the SDK 'SHIPS' a v1 profile that exists only on a branch

**Owner:** `vault-process` · **Neighbours:** `sdk`, `efs15` · **Severity:** minor · not on the MVP path

Designs/owner-decision-inbox.md line 30 says "The SDK now SHIPS the corpus's API shell as the explicit EFS v1 profile (SDK ADR-0019: createEfsV1Client…)". Verified 2026-09-02 in /home/user/efs-project/sdk: createEfsV1Client (packages/sdk/src/index.ts) and docs/adr/0019-efs-v1-profile-boundary.md exist only on branch chore/scaffold, main has no code (brief: LICENSE only), and Kanban.md Done line 62 records "Stopped v1 SDK support/merge work". The section sits under "Superseded questions — do not ask" with a 2026-08-12 greenfield banner, yet R2B, R3B and R4A retain "Default if unanswered" clauses (R4A: createEfsV1Client goes archive-read-only) that a future agent could apply as standing defaults.

**Evidence:** `Designs/owner-decision-inbox.md:30 (R1 re-cut), 54 (R4A), R2B and R3B option lines, 18-22` · `Kanban.md:Done line 62` · `/home/user/efs-project/sdk: git branch -a; git grep -l createEfsV1Client chore/scaffold; git ls-tree chore/scaffold docs/adr/`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R15-efs15-evidence-10

### CLI-35 — Repository layout tags contradict the MVP write ceremony

**Owner:** `web-client-os` · **Severity:** minor · MVP-relevant

architecture-and-modules.md:1165 marks "system-chrome/ # later", but the MVP write promotion flow at :967 requires a "trusted System Chrome preview" and mvp-and-acceptance.md:67-70 requires the preview "in trusted System Chrome". Conversely :1161 lists "app-entry-preparer/" with no later tag although app-runtime-and-direct-launch.md:850-853 says the MVP "does not yet implement generic external-App package resolution". The illustrative layout (:1152-1174) is the only place the architecture document marks MVP versus later, and it is wrong on both counts.

**Evidence:** `Designs/web-client-os/architecture-and-modules.md:1152-1174 (esp. :1161, :1165); :957-975` · `Designs/web-client-os/mvp-and-acceptance.md:57-70` · `Designs/web-client-os/app-runtime-and-direct-launch.md:845-853`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R9-wco-architecture-runt-08

### CLI-38 — Circular Depends-on with the App Store; recorded review predates the current text

**Owner:** `web-client-os` · **Neighbours:** `open-web-app-store`, `vault-process` · **Severity:** minor · not on the MVP path

Designs/web-client-os/README.md:5 lists [[Designs/open-web-app-store/README]] as a dependency and Designs/open-web-app-store/README.md:5 lists [[Designs/web-client-os/README]]; under the design-system rule that dependencies must be accepted or landed before promotion, neither set can promote first. Separately, web-client-os/README.md:7-8 records reviewers dated 2026-08-14 while the file's Last touched is 2026-08-26 and direction 28 is dated 2026-08-23, so the recorded review covers an earlier version, and the pre-promotion checklist (:574-575) requires a review round on the current text.

**Evidence:** `Designs/web-client-os/README.md:5; :7-8; :574-575` · `Designs/open-web-app-store/README.md:5`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R11a-clientv2-thesis-ker-16

## CUT — scope to drop or park for an MVP

### PRD-05 — Cut the Arcade product/pilot framing; keep it as the Core pressure fixture its neighbours already assume

**Owner:** `arcade` · **Neighbours:** `web-client-os`, `efsv2`, `owner`, `vault-process` · **Severity:** important · MVP-relevant

Designs/arcade/README.md:14 keeps the 'possible founding product/community pilot' framing and :29-31 the 'visibly EFS-only' promise, while the set's own honesty box (product-and-communities.md:35) concedes parity and the 2026-08-13 round classified zero tested benefits as uniquely EFS-specific for the tested catalog. The community red team replaced 'rights-cleared playable commons' with an opt-in mod-maintainer collective and its top-5 does not contain Arcade (Reviews/2026-07-29-target-communities/shortlist-red-team.md §Verdict item 2). Every current neighbour already treats Arcade as a fixture: efsv2/system-constitution.md line 310 lists it as an architecture-level acceptance row, mvp-and-acceptance.md:95-96 defers Arcade Play and :514-515 says guest bundles contain no Arcade, and app-runtime-and-direct-launch.md:862 asks for one Arcade fixture. Adding the runtime-law problem (sandboxing is a lane, never an exactness or permanence promise) and the Safari measurements bound by no design doc, the recommendation is to cut the product framing, keep the fixture, and rewrite the README promise before it reaches product copy. Nothing is lost: D1-D7 are HELD with dead deadlines and the recut never happened, while Kanban still defaults the ETHOnline entry (cutoff 2026-09-03) to the Arcade trace.

**Evidence:** `Designs/arcade/README.md:10-21, :14, :29-31, :44-46` · `Designs/arcade/product-and-communities.md:35, :73` · `Reviews/2026-08-13-claude-evidence-round/README.md:132-147; CORRECTIONS.md rows on '0 EFS-specific' and 'Browser behavior is universal'` · `Reviews/2026-07-29-target-communities/shortlist-red-team.md §Verdict item 2 and revised-order table` · `Designs/web-client-os/mvp-and-acceptance.md:95-96, :514-515; app-runtime-and-direct-launch.md:862` · `Designs/efsv2/system-constitution.md line 310 (Arcade acceptance row)` · `Open-Decisions.md:20, 34-40, 73; Kanban.md:19-20`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** J2-cypherpunk-risk-first-11, J3-adoption-first-02

### PRD-06 — Arcade cut list: the README holds these items but six bodies still schedule them with dated tasks

**Owner:** `arcade` · **Neighbours:** `open-web-app-store`, `efsv2`, `web-client-os` · **Severity:** important · MVP-relevant

The README already holds these items (README.md:33-35) while the bodies enumerate them with August/September dates: comments in all forms (curation-and-social.md:16-43; mvp-architecture.md:63,:67,:100; september-plan.md:35 M6), on-chain star and Sepolia faucet/drips (curation-and-social.md:49-55; owner-decision-inbox.md:46-49 D6; september-plan.md:39 S1), the GitHub-PR curation repo and lifecycle machine (curation-and-social.md:84-115), the 12-18-game catalog and inline-fork pipeline (catalog-plan.md:34-52,:88-100), Tier-3 outreach and consent templates (catalog-plan.md:104-110), the 67-hash remediation/receipts/seeder plan (mvp-architecture.md:150-161; D4), brand/domain/Open Collective/FUTO/Show HN (sustainability-and-institutions.md:46-47,:66-74), the study collection and eight-name USPTO pass (catalog-plan.md:70; rights-safety-and-operations.md:51-56), and the video. Also cut the preservation framing and the inline historical plan from the README: both falsification passes (§Recommendations item 1 - pass 1 line 137, pass 2 line 128) find the js13k/public-GitHub catalog 'needs no rescuing' (js13kGames/games: 162 MB, 42 forks; continuous Software Heritage coverage), and preservation language collides with the held D7 Sepolia-permanence question (owner-decision-inbox.md §D7 line 51; rights-safety-and-operations.md:79); keeping that plan inline beside line 31 is what produces the README's internal contradiction. Keep: one game, digest-pinned identity, two independent locators, tampered-primary rejection, verified fallback, explicit Play, an honestly labelled opaque frame, the error taxonomy, rights classes applied to Andromeda, stranger reconstruction. Store side: the zero-dependency one-member fixture exercises none of the store's 'Smallest required slice' (open-web-app-store/architecture.md:865-880) and should not wait on identity-matrix, catalog-reconstruction or resolver fixtures.

**Evidence:** `Designs/arcade/README.md:31, :33-35, :56, :58` · `Designs/arcade/curation-and-social.md:16-55, :84-115; mvp-architecture.md:63-114, :150-161` · `Designs/arcade/catalog-plan.md:34-52, :70, :88-100, :104-110; september-plan.md:16-43` · `Designs/arcade/sustainability-and-institutions.md:46-47, :66-74; rights-safety-and-operations.md:51-56, :79` · `Reviews/.../arcade-falsification-pass-1.md §Recommendations item 1 (line 137); pass-2 (line 128)` · `Designs/arcade/owner-decision-inbox.md §D7 (line 51)` · `Designs/open-web-app-store/architecture.md:865-880, :905-909`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R14-arcade-11, S2-arcade-x-appstore-x-r-08, R18-evidence-round-14

### CORE-37 — An MVP cut list exists in fragments: Files router machinery, layered Views, VerifierVM/1, EAS adapter, four bakeoff cells

**Owner:** `efsv2` · **Neighbours:** `web-client-os`, `open-web-app-store`, `sdk`, `owner`, `arcade` · **Severity:** important · MVP-relevant

Five separable bodies of scope are off the MVP path, each with a seam to keep. (1) ~1000 lines of the Files proposal: RoutedAdmissionIntent/1 + FilesRouter + FilesOperation frame + Router receipts (§8.2 1154-1483), exact-citation transcript (§6.3 876-1025), ExternalFilesLinkConfig/1, web3://efs.eth via draft ERC-6944 and ENS (§2.4 273-316), RetrievalPrivacyReportBytesV1 (§7.4), xattr projection (§10.1), the daemon control-frame codec (§10 1704-1768) -- keep ObjectGenesis meanings, DirectoryEntry/FileRevision/ChunkTree, FilesName/1 and the URL grammar, point lookup (§4), result registry (§9), open-handle pinning (§7.3); mvp-and-acceptance.md:254-261 already says 'A later FilesRouter/certifier is a candidate mechanism, not an MVP assumption'. (2) The layered arm's Views, ViewQueryProfile, SEMANTIC_VIEW, catalogs, projections and Diamond arms (T3, T5-D, T6, T7, the Views half of T9, layered:1102-1264): the client packet rates View-wide COMPLETE 'No for MVP' (type-data-abi-boundary-pressure.md:28-29, 513) and Files listing uses BindingScope 'not ... this Type query' (:603-606); keep T1 vectors, T2 evolution, exact-Type T4, T8 and TypeSchemaGroup/1. (3) VerifierVM/1 (b0-principal-authority.md §3.8 693-1108), a 24-opcode machine serialized into authorityCodexBytes purely to byte-commit four verifiers, forcing a second implementation to interpret the VM and moving codexConstantsHash/profileId/RealmId -- the §3.4 pseudocode, §3.6 error table, §3.7 constants and AUTH-* vectors commit the same semantics. (4) The EAS adapter: optional and evidence-gated everywhere (README:72-73; Freeze discipline 3; candidate module 7; V2-E8), seam already specified (b0-realm-admission.md §8.3 'an EAS adapter is an ordinary author and calls typed publish; Core has no EAS entrypoint'), only executor an unclaimed undated Kanban backlog line. (5) Four of nine bakeoff cells: traceability §9 maps V2-E1->F2, V2-E3->F1/F5/X17, V2-E4->F4+M-AGG while V2-E2 runs ONCE on B0 and V2-E5 is build-once, so F3, F6 and F7/X17 answer no owner gate (SIZE_6 must still run). Also droppable with seams: on-chain selectBestLocator (no product consumes it; Locator/1 has no score field), the KIND_UNIQUE_BY_TYPE historical cursor, three-host mount adapters. One item cannot be cut silently: revocation-aware live counts are 'PAY for it' by ruling and the constitution requires returning the capability to James rather than deleting it.

**Evidence:** `Designs/efsv2/hierarchical-files-and-folders.md:§8.2 lines 1154-1483; §6.3 lines 876-1025; §2.4 lines 273-316; §10 lines 1704-1768` · `Designs/web-client-os/mvp-and-acceptance.md:254-261; type-data-abi-boundary-pressure.md:28-29, 513, 603-606; Designs/efsv2/layered-type-system-and-data-abi.md:1102-1264` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:§3.8 lines 693-1108; §3.4 lines 447-518` · `Designs/efsv2/README.md:72-73; system-constitution.md:§Freeze discipline item 3; core-architecture-candidate.md:module 7; owner-decision-inbox.md:§V2-E8; Reviews/.../b0-realm-admission.md:§8.3; Kanban.md:Backlog line 21` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:§9 Gate-coverage map; chapters/bakeoff-spec.md:§2 cell matrix, §6.1 Lens benchmarks row` · `Designs/efsv2/owner-rulings.md:2026-07-15 item E; Designs/efsv2/system-constitution.md:§On-chain graph and indexes (costed-gate bullet)`

**Verified:** not separately verified; clustered from 6 independent lane findings · **Source lanes:** J1-mvp-first-12, R3-efsv2-files-10, R2-efsv2-types-ids-oncha-11, R7a-stageA-b0-ids-envelo-17, R15-efs15-evidence-08, R6-stageA-overview-09

### PRD-32 — The App Store is over-designed with no year-one consumer; freeze the seam names and cut the rest

**Owner:** `open-web-app-store` · **Neighbours:** `web-client-os`, `media-library`, `arcade`, `efsv2`, `sdk` · **Severity:** important · MVP-relevant

The store's only near-term consumers are a File Browser MVP that excludes package installation (mvp-and-acceptance.md:95-100,:514) and a one-game Arcade slice with no durable EFS write (arcade/README.md:19-20) - no consumer with a delivery date - yet architecture.md carries 18 requirements and nine package profiles including 'Deployable EVM helper/module', 'Remote-service connector' and 'Tool or local service/agent' (:494-505), TUF-style UpdateTrustPolicy/State (:401-435), delta-chain CatalogEditions (:345-353,:373-378), SLSA/in-toto/Sigstore/SPDX/CycloneDX evidence (:380-399,:765-766), multigraph peer/hoisting semantics with a TS+Rust 10k-node resolver fixture (:287-300,:934), a 100k-catalog plus one-million-spam fixture (:933) and PresentationOffer (:584-605); even its 'Smallest required slice' (:865-880) demands a dependency Set, catalog edition, advisory, R2 update and export/reconstruction. The EVM helper profile is the sharpest case: commit da0aec2 (2026-08-22) added it with the CALM/CREATE2/proxy/diamond/delegatecall paragraph (:513-523), the 'EVM helper discovery/deployment drift' falsifier (:939) and README.md:204-212, all sourced from a Designs/sdkv2 census that exists only on unmerged branch codex/sdkv2-pm. Keep and freeze as reserved names: SoftwareProject + PackageRelease/Manifest + ArtifactClosure + Locators, one materialized CatalogEdition/Release, the inert PackageHandoff field/exclusion list, InstallBindingGeneration + InstallStatusLedger, per-unit RuntimeRequest; cut the rest until a consumer asks, including the OS recipe's package-range inputs. The same judgement applies to the Media Plex/Jellyfin track - a media-server clone whose native agent no set owns, with first-product scope deferred to V2-F2 - so both lanes should be frozen as vocabulary or fixtures.

**Evidence:** `Designs/open-web-app-store/architecture.md:287-300, :345-353, :380-399, :401-435, :494-505, :513-523, :584-605, :859-903, :865-880, :933-934, :939` · `Designs/open-web-app-store/README.md:204-212, :225-232, :230` · `git show da0aec2 --stat (2026-08-22; census only on branch codex/sdkv2-pm)` · `Designs/web-client-os/README.md:44-47, :473-478; mvp-and-acceptance.md:95-100, :514, :843-851` · `Designs/web-client-os/system-profiles-and-generations.md:227-231; architecture-and-modules.md:665-671` · `Designs/arcade/README.md:19-20` · `Designs/media-library/owner-decision-inbox.md:23-27; plex-jellyfin-app.md:195-240`

**Verified:** not separately verified; clustered from 4 independent lane findings · **Source lanes:** R12-open-web-app-store-08, S1-appstore-x-os-x-types-07, R12-open-web-app-store-16, J3-adoption-first-09

### PRO-35 — The nine-cell Stage B bakeoff is not the MVP critical path; one disposable slice is

**Owner:** `owner` · **Neighbours:** `efsv2`, `web-client-os` · **Severity:** important · MVP-relevant

Owner direction 2 wants a write-capable File Browser "so the client can also debug the evolving contracts", which needs some v2 contract, and none exists. Designs/web-client-os/README.md lines 347-352 say "Stage B implementation and conformance have not run. This design therefore depends on interfaces and outcomes, not those exact mechanisms. Adapters and shims must isolate the product from prototype churn"; Designs/efsv2/README.md build order step 6 says build the File Browser "behind an adapter so product work tests the model without freezing it by accident"; mvp-and-acceptance.md lines 21-26 allow that "A disposable empty-directory fixture may land first". Recommended cut (proposal, not adoption): run SIZE_6 and Engine alpha (B0 only, with the Files successor delta) plus the run-once V2-E2 benchmark; defer the F2/F3/F5/F7/X17 branches and the F4/F6 engines to the post-MVP V2-F1 program; treat the EAP fixture, three-host mount execution, the client 50/100/256 grid and axis 8 as non-MVP.

**Evidence:** `Designs/web-client-os/README.md:§Direct owner direction item 2; 347-352` · `Designs/efsv2/README.md:§Build order step 6` · `Designs/web-client-os/mvp-and-acceptance.md:21-26` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/bakeoff-spec.md:§4.6 SIZE_6; §7 engine table`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R6-stageA-overview-10

### SDK-08 — The designed SDK/mount surface is an order of magnitude past what the MVP needs

**Owner:** `sdk` · **Severity:** important · MVP-relevant

**Category** CUT · **Owning set** sdk · **Severity** important · **MVP-relevant** yes
**Members** `R17-sdk-and-mounts-12`, `S6-sdk-and-mount-spread-14`
**Neighbours** web-client-os, clientv2, efsv2, owner `Designs/clientv2/sdk-boundaries.md` specifies `@efs/sdk` subpaths, a nine-namespace `@efs/os-sdk`, `@efs/dev`,
`@efs/conformance` C1-C3, one IDL emitting four artifacts, wire-major versioning and a dual-target `EfsHost`
(:52-138) — a topology `web-client-os/README.md`:398 already says to "Retire as assumed topology"; branch
`Designs/sdkv2/architecture-candidate.md` @4d3e736 adds a deterministic Type compiler, fourteen logical modules,
per-Type Solidity leaves, a helper bakeoff, century replacement drills and experiments SDK-E1…E6. The
`mvp-and-acceptance.md` journeys (:283-288 — guest open folder/file; create folder, create file, publish
revision; agent parity) need only five seams: a wallet-free Realm reader with explicit basis, a Files resolver
with honest listing, verified byte acquisition, one plan→sign→submit→canonical-read-back path with a receipt that
never says confirmed before read-back, and a finite hand-written codec set. Owner direction 2 asks for
"deliberately basic folder and file creation/writes" (`web-client-os/README.md`:44-47) and the deferral list
(`mvp-and-acceptance.md`:84-103) already excludes native mounts, yet no SDK-facing document says what the SDK
*omits*, so the v1 corpus and the July topology remain the only SDK "designs" an implementer will find.
Recommended cuts: 7702/7579 in-account routines, paymaster/relayer sponsorship, session keys and 

**Evidence:** `Designs/clientv2/sdk-boundaries.md` · `Designs/sdkv2/architecture-candidate.md` · `efs-account-system.md` · `ethereum-standards-and-interop.md` · `hierarchical-files-and-folders.md` · `mvp-and-acceptance.md` · `sdk-minimal-clicks.md` · `sdk-wallet-architecture.md` · `sdk-write-ux.md` · `web-client-os/README.md`

**Verified:** not separately verified · **Source lanes:** 

### SDK-09 — Sibling v1 SDK code is EAS-bound end-to-end; only four patterns are reusable

**Owner:** `sdk` · **Severity:** important · MVP-relevant

**Category** CUT · **Owning set** sdk · **Severity** important · **MVP-relevant** yes
**Members** `R17-sdk-and-mounts-11`
**Neighbours** efsv2, web-client-os `sdk` branch `chore/scaffold` (HEAD 37badc4, 2026-08-09; ~20.9k LOC src, ~17.3k LOC tests, 19 ADRs, ~1.9k LOC
`@efs/solidity/src/v1`) is EAS-bound end-to-end: every `packages/sdk/src` file references attestations/schema
UIDs, ADR-0019 makes `createEfsV1Client` with `profile: 'efs/v1'` the factory, and `docs/specs/overview.md` opens
"built on EAS attestations"; it matches the root SDK docs' manifest exactly. Reusable as *patterns only*:
`reads/source.ts` (`ReadBasis{chainId, blockNumber?, blockHash?, finality?}` plus injected `ReadSource`),
`mirror/{fetch,transport,ssrf,web3}.ts` verified byte acquisition with gateway fallback, `artifacts.ts`
profile-stamped fail-closed serializers, and `errors.ts` typed codes. Not reusable: `names/segment.ts` (v1
percent-encoding vs owner direction 9's rich Unicode/NFC, `web-client-os/README.md`:72-74), `content/hash.ts`,
`lenses/resolve.ts` (address lenses), `writes/*` (13-attestation EAS DAG), `eas/*`, `chain/*`, all Solidity.
`contracts` (HEAD c6b4075; only `test/Mock*V2.sol` doubles carry "V2") and `client` (HEAD 85796b3, 2.5k LOC Lit +
eas-sdk, README banner marks it legacy) contain no v2 code.

**Evidence:** `docs/specs/overview.md` · `web-client-os/README.md`

**Verified:** not separately verified · **Source lanes:** 

### CLI-04 — MVP acceptance carries OS-scale fixtures and never says which sections are required

**Owner:** `web-client-os` · **Neighbours:** `efsv2`, `open-web-app-store`, `owner`, `vault-process` · **Severity:** important · MVP-relevant

mvp-and-acceptance.md is 930 lines while the write path is about 80 (178-277), and §Honest definition of done (874-881) says the MVP is done "only when all required acceptance fixtures pass" without ever naming which of A-J are required — only H, I and J carry "architecture fixture, not an MVP requirement" labels. §G (531-643) lists roughly twenty Service-Worker/generation fixtures (v12->v13 update refusal, kill-the-browser at every staging boundary, WorkerBootstrapGeneration separate from AppReleaseGeneration, InstallationScopeId namespaces, three retained generations booting offline) while the same doc defers "Service Worker dependence" (84-103); §H (645-682) requires a foreign SystemProfileGeneration Inspector, a synthetic thousand-module header and a disposable Core Wasm Worker behind a WIT interface; §I (684-745) "begins only after separate owner authorization"; §J (747-777) is direct-App non-regression; §F checkbox 3 demands "Two clean air-gapped builds ... retained immutable base image/VM/rootfs"; §D demands Arabic/Hebrew, CJK IME, Indic, Thai, Turkish and German release fixtures. §E boxes 3-4 ("Removing the agent's wallet/write capability fails before signer access; a page-advertised WebMCP tool cannot restore it") presuppose the capability grants, mandates and signer broker that product-constitution-and-roadmap.md §Slice E and the Personal OS horizon deliver later and that privacy-and-agents.md §Open questions item 5 has not defined; E1-2 are the legitimate seam. One lane estimates roughly 13% of the 226 KB client/OS set is load-bearing for guest read plus three writes, and this is the same over-scoping the spine faulted in the July round (README.md:356-361), relocated from architecture into acceptance. Compounding it, web-client-os has no owner-decision-inbox.md (folder verified 2026-09-02, 11 design files), so these open questions never reach Open-Decisions.md.

**Evidence:** `Designs/web-client-os/mvp-and-acceptance.md:§Honest definition of done lines 874-881; §Deliberately deferred lines 84-103 ('Service Worker dependence')` · `Designs/web-client-os/mvp-and-acceptance.md:§G lines 531-643 (checkboxes 8-21); §H lines 645-682; §I lines 684-745; §J lines 747-777` · `Designs/web-client-os/mvp-and-acceptance.md:§F checkbox 3 (two clean air-gapped builds); §E. Agent parity checkboxes 3-4; §write path lines 178-277` · `Designs/web-client-os/product-constitution-and-roadmap.md:§Slice E and §Feature horizons row 'Personal OS foundation' (line 246)` · `Designs/web-client-os/privacy-and-agents.md:§Open questions item 5` · `Designs/web-client-os/README.md:356-361 (the spine's own July over-scoping fault)` · `ls Designs/web-client-os/ — no owner-decision-inbox.md (verified 2026-09-02)`

**Verified:** not separately verified; clustered from 6 independent lane findings · **Source lanes:** R8-wco-product-mvp-priva-11, R8-wco-product-mvp-priva-12, R11b-clientv2-packages-w-14, J1-mvp-first-09, J3-adoption-first-04, S13-never-decided-12

### CLI-05 — OS-preservation and Wasm/WIT directions 20-24 written as first-slice requirements gating Files MVP

**Owner:** `web-client-os` · **Neighbours:** `efsv2`, `git-forge`, `media-library`, `open-web-app-store` · **Severity:** important · MVP-relevant

Designs/web-client-os/README.md §Current work sequence step 4 states that "Full Try, whole-system activation/rollback, thousand-module and Component/WASI execution experiments gate their later product lanes, not the Files MVP", and :473-478 narrows the OS-preservation track to "exact profile/lock/follow identity, the inert Inspector header and deletion/non-regression fixture. Only those interface and zero-guest-cost seams gate the Files skeleton." Directions 20-23 (Nix/Guix generations, System Configuration Manager, Wasm/WIT/Component Model) and 24 (the mandatory pinned modern-Web guidance gate) are nonetheless phrased as foundational requirements, and mvp-and-acceptance.md:645-684 (fixture H) plus system-profiles-and-generations.md:1185-1194 ("MVP reservation") re-impose the foreign-profile Inspector, the thousand-module header and "One disposable Core Wasm Worker behind a WIT-shaped, versioned interface" — while the same documents say profile management and Wasm execution are "not an MVP dependency" (mvp-and-acceptance.md:647-648, :679-682, :884-889). Only the final H bullet (delete every profile-manager/runner artifact and sections A-G still pass) is a genuine zero-cost seam. Sibling lanes already defer the same way: Designs/media-library/owner-decision-inbox.md §Decide after evidence says "The first EFS product implementation scope is already owned by V2-F2", and the Git/forge prototype is an expired Kanban In Flight card.

**Evidence:** `Designs/web-client-os/README.md:§Current work sequence step 4 and lines 473-478` · `Designs/web-client-os/README.md:directions 20-24; §Mandatory modern-Web guidance gate` · `Designs/web-client-os/mvp-and-acceptance.md:645-684 (fixture H); :647-648, :679-682, :884-889` · `Designs/web-client-os/system-profiles-and-generations.md:1185-1194 (MVP reservation)` · `Designs/media-library/owner-decision-inbox.md:§Decide after evidence (first paragraph)` · `Kanban.md:In Flight Git/forge prototype card (expired 2026-08-17)`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R19-process-rulings-ledg-16, R9-wco-architecture-runt-01

### CLI-22 — ~39-row required-forward Web surface far exceeds the MVP's needs

**Owner:** `web-client-os` · **Severity:** important · MVP-relevant

web-platform-standards-and-forward-profile.md carries roughly 39 "required"-class rows (Navigation API/URLPattern, Popover/invokers/CloseWatcher, import-map integrity, container queries, cascade layers/@scope/nesting, Color 4/5, Text 3/4, containment, Temporal, Explicit Resource Management, Transferable Streams, scheduler.postTask, Web Locks, OPFS, Storage Buckets, StorageManager, Manifest, Service Worker, CSP L3, Trusted Types, SRI 2, Permissions Policy, COOP/COEP, WebCrypto L2, WebAuthn, GPC, Pointer Events 3, Input Events 2, MF2, WebTransport...). §Disposition language obliges each with "a named reduced/unsupported/rescue outcome" and §Acceptance program item 2 with an independent kill-matrix run, so the acceptance program scales with the census. The MVP in product-constitution-and-roadmap.md §Feature horizons (MVP vertical row) needs about eight of them: HTML, Grid/container queries/logical properties, ESM, Fetch/Streams, IndexedDB, WebCrypto L1, hash routing and Manifest metadata. The rest should be relabelled post-MVP forward.

**Evidence:** `Designs/web-client-os/web-platform-standards-and-forward-profile.md:§Disposition language; §Selected standards foundation (all tables); §Acceptance program item 2` · `Designs/web-client-os/product-constitution-and-roadmap.md:§Feature horizons (MVP vertical row)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R10-wco-technology-stand-08

### CLI-23 — i18n/a11y release floor exceeds 'foundations from the first slice'

**Owner:** `web-client-os` · **Severity:** important · MVP-relevant

Direction 17 asks for i18n/a11y foundations from the first slice. technology-foundation.md §Locale and message contract instead requires "Freeze a tested EFS function subset [of MessageFormat 2] and interpret/compile it with pinned client-owned code" plus immutable language-pack manifests with translator provenance; §Accessibility release floor requires "manual desktop and mobile screen-reader/keyboard/switch/zoom passes across current Chromium, Gecko and WebKit" and "Real release fixtures include Arabic/Hebrew, Japanese/Chinese/Korean IMEs, an Indic script, Thai, Turkish casing, German expansion"; §Required experiments item 6 adds a global-use fixture before implementation selection. Foundations for the MVP are lang/dir, logical CSS, message IDs, NFC and bidi isolation, Intl for display and one en pack; the MF2 runtime, pseudo-locale generators and multi-script release matrix are post-MVP.

**Evidence:** `Designs/web-client-os/README.md:§Direct owner direction item 17` · `Designs/web-client-os/technology-foundation.md:§Locale and message contract` · `Designs/web-client-os/technology-foundation.md:§Accessibility release floor` · `Designs/web-client-os/technology-foundation.md:§Required experiments before implementation selection item 6`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R10-wco-technology-stand-13

### CLI-24 — Per-release 50-year retention ceremony the document's own framing disowns

**Owner:** `web-client-os` · **Severity:** important · MVP-relevant

technology-foundation.md §Greenfield build and release posture requires every release to retain "either an immutable complete base image/VM/rootfs including every base layer or a reproducible source/bootstrap path", a BuildPlatformDescriptor, and "Two clean network-disabled rebuilds from only the retained closure must succeed ... at least one begins from that retained environment on a fresh compatible host"; §Required experiments item 8 adds a cold-reconstruction fixture before implementation selection. The same document's §Decision frame says fifty years "is a dependency and interface strategy, not a promise that an unchanged 2026 binary or toolchain will run everywhere in 2076", so its own framing disowns the ceremony. The standards-first surface is compatible with shipping fast; the retention ceremony is what conflicts. MVP equivalent: a lockfile, retained dependency archives and one reproducible CI rebuild.

**Evidence:** `Designs/web-client-os/technology-foundation.md:§Greenfield build and release posture` · `Designs/web-client-os/technology-foundation.md:§Required experiments before implementation selection item 8` · `Designs/web-client-os/technology-foundation.md:§Decision frame (fifty years paragraph)` · `Designs/web-client-os/mvp-and-acceptance.md:§F checkbox 3 (air-gapped builds)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R10-wco-technology-stand-14

### CLI-25 — No v1 code, tooling or deployment should seed the MVP

**Owner:** `web-client-os` · **Neighbours:** `arcade`, `sdk`, `efsv2` · **Severity:** important · MVP-relevant

Reviews/2026-06-10-holistic-review.md UX-8 calls the Next.js explorer "the de-facto reference implementation, minus its IA leaks" and enumerates its debts: UX-5 High "Fetched content never verified against attested contentHash"; UX-12 "2MB file = ~85 sequential eth_calls... pagination not block-pinned"; UX-2 Critical non-resumable upload minting permanent orphans; UX-13 "Autofund is 31337-only... no faucet guidance"; UX-11 protocol nouns in copy; ENG-12 Scaffold-ETH leftovers; DX-1 SDK "100% stubs"; UX-8/ENG-4 the Lit client is "a different, dead product". That lineage produced real bad data: Designs/arcade/README.md:39-42 records "67 durable Sepolia files carry non-canonical keccak contentHash values... the seeder tooling of record was never merged", and the faucet is Scaffold-ETH tooling "built and integrated but not deployed". Decisions.md:23 (2026-08-08) bans v1 compatibility, and Designs/web-client-os/README.md directions 11 (rename legacy repos *-v1), 13 (50-year Web-standards surface), 14 (TC39 Signals) and 18 (Signals plus Web Components) exclude a Next.js/wagmi/Scaffold-ETH base. The only v1-era asset worth reusing is the 2026-07-11 Foundry lens harness (26 passing tests) as the V2-E2 template.

**Evidence:** `Reviews/2026-06-10-holistic-review.md:UX-2, UX-5, UX-8, UX-11, UX-12, UX-13, DX-1, ENG-4, ENG-12` · `Designs/arcade/README.md:39-42 (67 non-canonical contentHash files; seeder never merged; faucet not deployed)` · `Decisions.md:23 (2026-08-08 greenfield ruling)` · `Designs/web-client-os/README.md:§Direct owner direction items 11, 13, 14, 18` · `Reviews/2026-07-11-efsv2-lens-review-corpus/README.md:Foundry benchmark (26 passing tests)`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R20-older-reviews-10

### CORE-44 — The one-game Arcade view is still in the efsv2 first vertical after the product set and the evidence cut it

**Owner:** `efsv2` · **Neighbours:** `arcade`, `web-client-os` · **Severity:** minor · MVP-relevant

Designs/efsv2/README.md §Build order 6 (:125-127) still says 'build the narrow direct Web Client/File Browser + one-game Arcade slice behind an adapter' and owner-decision-inbox.md V2-E6 still says 'plus one verified Arcade view'. The product set has already excluded it: mvp-and-acceptance.md:95-96 defers 'package installation, third-party executable Views, full Session Shell, Arcade Play, native mounts, private folders, or a default Commons'; product-constitution-and-roadmap.md:246 excludes 'third-party executable modules, Arcade Play' from the MVP vertical; app-runtime-and-direct-launch.md:847-853 says the MVP 'does not yet implement ... a production-safe arbitrary third-party runner' and :857 gates the first third-party proof on 'separate disposable-experiment authorization'. The evidence and the queue agree: Open-Decisions.md shows the arcade queue HELD (D1-D7), and the 2026-08-13 falsification found zero benefits classifiable as uniquely EFS-specific for the tested catalog (one assessment feeding the held recut, not a STOP). The answer is confirm rather than re-decide: keep FX-ARC as a generic fixture and the Minimal App Host reservation, and run the one-game trace as Stage-B-shaped evidence.

**Evidence:** `Designs/efsv2/README.md:§Build order 6 lines 125-127; Designs/efsv2/owner-decision-inbox.md:§V2-E6 lines 54-60` · `Designs/web-client-os/mvp-and-acceptance.md:§Scope floor exclusions lines 95-96; product-constitution-and-roadmap.md:246` · `Designs/web-client-os/app-runtime-and-direct-launch.md:847-853, 857` · `Open-Decisions.md:§Do NOT ask these - active holds (arcade D1-D7); Reviews/2026-08-13-claude-evidence-round/README.md:§Arcade falsification; CORRECTIONS.md row '0 EFS-specific'`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R1-efsv2-spine-15, S8-evidence-bindings-vs-09

### CORE2-50 — Cut ethereum-first-efs-and-os.md and solana.md from the current reading path

**Owner:** `efsv2` · **Neighbours:** `web-client-os` · **Severity:** minor · not on the MVP path

A grep across Designs/ (excluding the two files) shows Shapes A-E, the L0-L4 ladder, VenueCapabilities, ObservationBasis and AUTHORITY_COLOCATED_ADMISSION are referenced only by July docs and by `owner-rulings.md`:149 ('≈ Shapes C/E ... NOT adopted — flagged as the shape to evaluate'); the 08-12 Core/Commons boundary (owner-rulings.md 188-197) effectively resolved that hypothesis without recording the mapping. `ethereum-first-efs-and-os.md` §11 (330-344), the basis of the 07-22 'research before MVP' direction (owner-rulings.md 116-122) and of `assumptions-and-requirements.md`:558, is superseded by the README build order (113-127) and the V2-E gates. Preserve three items in a paragraph elsewhere before cutting: the L0-L4 capability ladder as vocabulary for non-EVM carriers, `solana.md` §3 invariants 3/6/9/13/16 (69-82) as cross-checks on the Realm/Locator sections, and the 'do not build one FilesystemBackend' rule (§4, 87-133) as input to web-client-os direction 4.

**Evidence:** `Designs/efsv2/ethereum-first-efs-and-os.md:§8 215-261; §11 330-344` · `Designs/efsv2/solana.md:§2 51-61; §3 63-85; §4 87-133` · `Designs/efsv2/owner-rulings.md:116-122, 149, 188-197` · `Designs/efsv2/assumptions-and-requirements.md:line 558` · `Designs/efsv2/README.md:build order lines 113-127` · `Designs/web-client-os/README.md:direction 4 lines 51-54`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R5-efsv2-context-require-15

### PRD-49 — The skills-release rider overlaps the App Store's package/release model and should be handed off

**Owner:** `git-forge` · **Neighbours:** `open-web-app-store`, `efsv2` · **Severity:** minor · MVP-relevant

wiki-and-collab.md §7 and trace T15 define SkillReleaseV1 (publisher, repoId, tag, commit OID + dual digest, capability-manifest hash, previousReleaseClaimId, publisherContinuity) with install and update 'through GATE/1 unchanged' - GATE/1 being July lens-spec vocabulary the inbox says is not inherited (Designs/efsv2/owner-decision-inbox.md:208-211,:246-249). The store's OWS-R12 rules 'Git and builds are evidence, not package identity' (architecture.md:82) and README.md:122 splits ownership so package identity and handoff belong to the App Store while Git-native identity stays with Git/Forge; Stage A already uses ArtifactRelease/1 for repo releases (harness-and-fixtures.md:800). The corpus's claim that skills 'ride the same substrate one release-object later' (deep-dive §6 GD-2) leaves that split unstated. Repair: hand the rider to the App Store rather than keeping it in git-forge scope.

**Evidence:** `Reviews/2026-08-07-efs-git-corpus/wiki-and-collab.md §7; traces.md T15` · `Designs/open-web-app-store/architecture.md:82 (OWS-R12); README.md:122` · `Designs/efsv2/owner-decision-inbox.md:208-211, :246-249` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:800`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R16-git-forge-12

### PRD-26 — Media cut list: stop elaborating proposal-only surfaces and park the on-chain arms of Q4-Q8

**Owner:** `media-library` · **Neighbours:** `efsv2`, `owner` · **Severity:** minor · MVP-relevant

Stop elaborating, inside the set: the reference subgraph package (query-and-indexing.md §'Reference The Graph architecture', lines 149-286 - about 130 lines of entity projection, _meta/time-travel pagination and a failure table) before any recorded falsifier the media ruling requires; the ERC-3668/4804/5219/1577 and ERC-5564/6538 adapters (media-infrastructure.md:194-201); Sankaku parity debt and Danbooru/e621/Hydrus round-trips (booru-app.md:376-393, BOORU-14); the synthetic 1m gate; the later community surface (booru-app.md:328-333); Plex Slice 1+ (remux/transcode, DeviceCapabilityProfile, PlaybackSession, remote access PLEX-15 - plex-jellyfin-app.md:377-396); and the parked workload portfolio (Ideas.md:36-60) - all already labelled later or proposal-only, so the cut is to stop growing them until V2-F2 selects media. Also park the on-chain arms of Q4-Q8: system-constitution.md:185-187 already places range, prefix, collation, full text, global ranking, analytics and arbitrary joins off-chain until a contract workload proves otherwise and owner item 15 (owner-rulings.md:65) confirms ranked/full-text/aggregate search off-chain, yet media Q7 says 'first test exact materialized vocabulary keys' and Q5/Q6 name on-chain shapes for ranges and top-k (query-and-indexing.md:99-101). Scope the Query Lab to Q1-Q3 under both assertion shapes and bound alias/implication expansion depth. Keep the retained A/A-prime/V fixture, MEDIA-01/02/07/08/10, one Booru read-only guest gallery over a synthetic 10k corpus with Core-only bounded browse, and the BagIt walk-away export.

**Evidence:** `Designs/media-library/query-and-indexing.md:99-101, :149-286` · `Designs/media-library/media-infrastructure.md:194-201` · `Designs/media-library/booru-app.md:328-333, :376-393, :401-402` · `Designs/media-library/plex-jellyfin-app.md:377-396; Ideas.md:36-60` · `Designs/efsv2/system-constitution.md:185-187; Designs/efsv2/owner-rulings.md:65` · `Designs/media-library/README.md:183-185; owner-rulings.md:24-25`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R13-media-library-16, S3-media-x-types-x-index-11

### PRO-34 — On-chain selectBestLocator is consumed by no product and degenerates over Locator/1

**Owner:** `owner` · **Neighbours:** `efsv2`, `web-client-os`, `open-web-app-store`, `media-library` · **Severity:** minor · MVP-relevant

b0-indexes.md §7 (lines 1500-1757) adds SelectSpec, SELECT_CURSOR_V1, three limits, two errors and a fourth continuation family in indexCodexBytes (§0.1 lines 227-238), yet b0-content-locators.md §10.3 (lines 926-934) admits "Locator/1 declares no uint64 score field, so B0 on-chain selection … runs in … recency mode" over one caller-supplied trusted Principal, and lines 1743-1746 require the client to re-validate the winner and fall back to a client fold anyway. No product set consumes the selector on-chain: hierarchical-files-and-folders.md lines 1066-1077 uses client-bounded enumeration, open-web-app-store/architecture.md line 829 keeps "Locator scoring/rotation … above Core", and media-infrastructure.md line 120 keeps fetch/rotate/retry client-side. Owner ruling C (owner-rulings.md 2026-07-15, line 48) asks for the on-chain best-mirror view with zero new state; B0 honours the state constraint but ships an ABI and cursor grammar nobody calls. Candidate MVP cut: keep the ruling as a costed gate and drop the selector from the first Core surface.

**Evidence:** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:§7 1500-1757; §0.1 227-238` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md:§10.3 906-982; 1743-1746` · `Designs/efsv2/hierarchical-files-and-folders.md:1066-1077` · `Designs/open-web-app-store/architecture.md:829` · `Designs/media-library/media-infrastructure.md:120` · `Designs/efsv2/owner-rulings.md:2026-07-15 item C line 48`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R7b-stageA-b0-indexes-le-09

### CLI-30 — Client acceptance duplicates Core's 64-Principal Lens benchmark

**Owner:** `web-client-os` · **Neighbours:** `efsv2` · **Severity:** minor · MVP-relevant

mvp-and-acceptance.md §A checkbox 6 requires "The target 64-Principal Lens profile is measured for first, last, absent, conflict, and UNKNOWN" as a client MVP fixture, while Slice B uses "one same-Realm, single-Principal development fixture" and Designs/efsv2/owner-decision-inbox.md V2-E2 already owns prototyping "public Plans of 1, 8, 32, and 64 Principals". The client cannot measure a contract profile Stage B has not built. The box should consume V2-E2's result and display UNSUPPORTED otherwise, which the same box already allows.

**Evidence:** `Designs/web-client-os/mvp-and-acceptance.md:§A. Cold guest and exactness checkbox 6` · `Designs/web-client-os/product-constitution-and-roadmap.md:§Slice B` · `Designs/efsv2/owner-decision-inbox.md:§V2-E2`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R8-wco-product-mvp-priva-07

## UNVERIFIABLE — could not be checked from this session

### PRO-08 — Branch-only EXP-C0 artifacts contradict main's 'Stage B has not run / Ask now: 0'

**Owner:** `vault-process` · **Neighbours:** `efsv2`, `sdk`, `owner` · **Severity:** important · MVP-relevant

Branch codex/v2-readiness-week carries b9088d6 (2026-08-25, "source-lock disposable EFS v2 Core handoff … independently reproducible JavaScript and Solidity controls") and 2573f08 ("Route V2-C1 as the one answerable build-start choice"), plus Reviews/2026-08-23-efs2-exp-c0-semantic-seal/ (README.md and a 104 KB trace-manifest.json). Branch codex/sdkv2-pm head 57d04f8 carries Reviews/2026-08-25-sdkv2-exp-c0-mvp/ with check-core-consumption.mjs (33 KB), check.mjs, core-inputs/, core-source-lock-v0.json and sdk-consumption-v0.json, and an exp-c0-mvp-packet.md claiming "The first serialized Core-consumer packet is now source-locked and consumed" (inputs a68b00a, b9088d6). None of this is on main: ls Reviews shows no 2026-08-23/25 entries, Kanban.md records no EXP-C0 card, and Open-Decisions.md (generated 2026-08-21) still reports "Ask now: 0" while STATUS.md says no prototype has executed the corpus. Neither the Core commit nor the artifacts were reachable from this shallow clone, so whether they constitute EFS 2.0 code, whether Stage B has partially run, and whether V2-C1 is a live owner ask are unverifiable here — but main's decision surface does not reflect them, and "no EFS 2.0 code exists anywhere" holds only for the vault of record. Vault-process must reconcile the branches with Kanban.md before the review repeats that claim as fact.

**Evidence:** `GitHub: commits b9088d6 and 2573f08 on refs/heads/codex/v2-readiness-week` · `GitHub listing Reviews/2026-08-23-efs2-exp-c0-semantic-seal/ (README.md, trace-manifest.json)` · `GitHub listing Reviews/2026-08-25-sdkv2-exp-c0-mvp/ at codex/sdkv2-pm (7 entries incl. check-core-consumption.mjs)` · `Designs/sdkv2/exp-c0-mvp-packet.md @57d04f8 (Inputs a68b00a, b9088d6; §Disposable fixture)` · `Open-Decisions.md:header (Generated 2026-08-21; Ask now: 0)` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:3, 44-53` · `Kanban.md (no EXP-C0 card); ls Reviews on main (no 2026-08-23/25 entries)`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R17-sdk-and-mounts-15, S6-sdk-and-mount-spread-15

### SDK-13 — Live Sepolia inventory and live `MAX_ANCHOR_DEPTH` cannot be re-verified from here

**Owner:** `efs15` · **Severity:** minor · not on the MVP path

**Category** UNVERIFIABLE · **Owning set** efs15 · **Severity** minor · **MVP-relevant** no
**Members** `R15-efs15-evidence-14`
**Neighbours** — `Reviews/2026-08-07-efs-v2-to-15-deep-dive.md` §Live-v1 finding and `Designs/efs15/requirements-and-boundaries.md`
§Evidence and cautions report 1,654 indexed v1 records at Sepolia block 11,441,982 (517 ANCHOR / 372 PROPERTY /
107 DATA / 425 PIN / 138 TAG / 95 MIRROR, seven DATA attesters) and a live `MAX_ANCHOR_DEPTH` of 32 versus source
256. The chain is not reachable from this environment; the reviewer did confirm the source constant is still
`256` at `/home/user/efs-project/contracts/packages/hardhat/contracts/EFSIndexer.sol`:150 (shallow clone HEAD
2026-06-25). The numbers are moot for 2.0 (v1 data is disposable per `Decisions.md` 2026-08-08) but should be
cited only as dated 2026-08-07 observations. ---

**Evidence:** `Decisions.md` · `Designs/efs15/requirements-and-boundaries.md` · `Reviews/2026-08-07-efs-v2-to-15-deep-dive.md`

**Verified:** not separately verified · **Source lanes:** 

### CORE2-48 — Load-bearing verification claims leave no checkable artifact: vectors, passes, dates, EIPs

**Owner:** `efsv2` · **Neighbours:** `vault-process` · **Severity:** minor · not on the MVP path

Three families of claim cannot be checked from this checkout and should be cited as prose only. (a) Artifacts: `codex-envelope.md`:50 speaks of a '42-vector golden suite', `deterministic-ids.md` §13 (206-223) of ~50 golden vectors and a cross-language fuzz, `fable-handoff-v2-tag-core.md`:18, 45 cites workflow IDs `wyi9v61od` and `w0v4u85g2` and a '25-agent investigation', and `apps-cookbook.md`:11-26 reports ten-app verdicts — none has a runnable or byte-level artifact in the vault, and no EFS 2.0 code exists in any repository. (b) Review passes: `hierarchical-files-and-folders.md`:10 names '@files-core-exact-review, @files-requirement-matrix, and @files-schema-redteam (2026-08-14)' and its checklist (2263-2264) ticks 'Three independent #status/review passes found no remaining P0/P1 ... defect', but no Reviews/2026-08-14-*files* folder exists (only 2026-08-14-media-library-intake). (c) Dates and physics: the repo is a shallow clone (50 commits, is-shallow-repository true) whose first commit c48f252 (2026-08-13) added kel.md, identity.md, lens-spec.md, read-lens-spec.md, privacy.md and owner-rulings.md as new files, so every July 'Last touched' date rests on the docs' own say-so, and the load-bearing physics claims — 'EIP-7825's 16,777,216 tx cap is live (Fusaka, 2025-12-03)' (`lens-pass-synthesis.md` LN-4:27, reused by `b0-lens.md` §3.4:196-197) and 'EIP-7951 live on Ethereum mainnet' (`kel.md` §13:637, reused by `b0-principal-authority.md` §2.2:104-108 for KEY_P256) — are internally consistent but were not re-checked here.

**Evidence:** `Designs/efsv2/codex-envelope.md:50; deterministic-ids.md:206-223` · `Designs/efsv2/fable-handoff-v2-tag-core.md:18, 45; apps-cookbook.md:11-26` · `Designs/efsv2/hierarchical-files-and-folders.md:10, 2263-2264` · `Reviews/ directory listing (no 2026-08-14 Files corpus)` · `git: rev-list --count HEAD = 50; is-shallow-repository = true; git show --stat c48f252` · `Designs/efsv2/lens-pass-synthesis.md:LN-4 L27; Designs/efsv2/kel.md:§13 L637` · `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md:§3.4 L196-197; b0-principal-authority.md:§2.2 L104-108`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R2-efsv2-types-ids-oncha-16, R3-efsv2-files-18, R4-efsv2-identity-lens-p-13

### PRD-52 — Git deep-dive and Stage A evidence pins do not resolve from this clone; GoE deployment numbers not re-checked

**Owner:** `git-forge` · **Neighbours:** `vault-process` · **Severity:** minor · not on the MVP path

The deep dive pins 'the EFS v2 constitutional spine at 4fe845f' (Reviews/2026-08-07-efs-git-deep-dive.md line 5, echoed at Daily Notes/agent-status.md:176) and Stage A cites a repair series '48bf72d..6ea657e' (STATUS.md:9-10); this vault clone's root is c48f252 (2026-08-13, 50 commits), 'git cat-file -t 4fe845f' fails, and 'git log -- Reviews/2026-08-07-efs-git-corpus/' shows only the import commit, so neither pin resolves from here. The GoE deployment facts the corpus relies on - goe-cli 0.2.0, 29 repository-creation events, 22 goe-e2e repos, 735 npm downloads, a 145.7 MiB / 3h25m upload (Reviews/2026-08-05-goe-deep-dive.md §'Current deployment and maturity') - are 2026-08-05 point-in-time and were not re-verified. That pass's §Disposition step, 'run the thin portable-Git prototype against a production-reviewed GoE backend', never ran: no EFS 2.0 code exists in any repository.

**Evidence:** `Reviews/2026-08-07-efs-git-deep-dive.md line 5; Daily Notes/agent-status.md:176` · `Reviews/2026-08-05-goe-deep-dive.md §'Current deployment and maturity', §Disposition` · `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md:9-10` · `git log --oneline (root c48f252, 50 commits)`

**Verified:** not separately verified; clustered from 2 independent lane findings · **Source lanes:** R16-git-forge-14, S4-git-x-types-x-core-12

### PRD-40 — Store primary-source version pins and the 2026 PyPI incident figures could not be verified from this environment

**Owner:** `open-web-app-store` · **Severity:** minor · not on the MVP path

Designs/open-web-app-store/architecture.md §Current primary-source landscape (756-812) says the table was 'Checked 2026-08-14' against TUF 1.0.36, Uptane 2.1.0, SLSA 1.2, in-toto 1.2.0, SPDX 3.0.1, CycloneDX 1.7, OCI 1.1.1, Nix 2.35, the IWA docs and PyPI's 2026-04-02 LiteLLM/Telnyx report ('more than 119,000 LiteLLM downloads during a 2-hour-32-minute exposure window'). The egress proxy in this environment rejected every non-GitHub host (connect_rejected; blog.pypi.org returned 403), so none of these pins or figures could be re-checked. Nothing suggests an error - the claims are simply unverified from here. The fixture README's Node v26.0.0 timing figures are likewise unverifiable, though its structural results were reproduced.

**Evidence:** `Designs/open-web-app-store/architecture.md:756-812` · `Reviews/2026-08-22-open-web-app-store-type-data-abi-pressure/README.md:35-49`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R12-open-web-app-store-14

### PRD-41 — The store's pinned sdkv2 census link points at a path and commit that exist only on an unmerged branch

**Owner:** `open-web-app-store` · **Neighbours:** `sdk`, `vault-process` · **Severity:** minor · not on the MVP path

Designs/open-web-app-store/README.md:204-212 and architecture.md:7 cite 'Designs/sdkv2/ethereum-standards-census.md' through a GitHub URL pinned to commit 4d3e736524ca04cdadfb26fdd628fcd206fc8084. No Designs/sdkv2/ directory exists in the working tree and 'git cat-file -e 4d3e736...' fails in this clone, so the pin cannot be verified from main. Per the lead reviewer's addendum the directory does exist on the unmerged branch origin/codex/sdkv2-pm (worktree sdkv2/), so the citation is checkable there but not on the coordination surface - and the store's Deployable EVM helper profile (architecture.md:502,:513-523) draws its pressure from that census.

**Evidence:** `Designs/open-web-app-store/README.md:204-212` · `Designs/open-web-app-store/architecture.md:7, :502, :513-523` · `git cat-file -e 4d3e7365... fails in this clone; branch origin/codex/sdkv2-pm carries Designs/sdkv2/`

**Verified:** not separately verified; clustered from 1 independent lane finding · **Source lanes:** R9-wco-architecture-runt-14

### PRO-53 — Point-in-time venue, standards and v1 facts will be inherited as stale if cited today

**Owner:** `owner` · **Neighbours:** `efsv2`, `arcade`, `vault-process` · **Severity:** minor · not on the MVP path

None of the following was rechecked from this environment, and CORRECTIONS.md §Citation hierarchy (lines 41-44) already requires refresh before deployment, funding copy or conference claims: Sepolia validator admission ("unresolved", CORRECTIONS.md:27) and any deprecation date (no vault doc records one; the 2026-08-13 probe found Sepolia alive, l1-incidents-and-dead-data.md:172); Goerli/Holesky status as of 2026-08-13; EIP-4444 rolling post-Merge history expiry "ongoing, not shipped" as of 2025-07-08 (l1-incidents-and-dead-data.md:208); Glamsterdam/EIP-8037 activation (EIP-7773 activation table empty at check; Q4 2026 target) and L2 adoption of 8037 ("unverified"); Base Cobalt/EIP-8130 September 2026 activation (Reviews/2026-07-19-base-native-aa-impact.md §What changed); Degen Chain's reported 2026-08-31 sunset ("primary source 403'd; verify", commons-realm-venue-matrix.md §1 item 7 and Appendix F); the L2BEAT stage-change countdown to 2026-08-17; EIP-7773 SFI list stability; Firefox/iOS/Android runner behaviour ("entirely unmeasured", browser-runner-measurements.md:208-210); whether the js13k catalog is still the Arcade's intended catalog; and the v1 facts repeated in Designs/arcade/README.md lines 37-42 (verifyContentHash zero callers, 67 non-canonical hashes, one VPS pin, faucet undeployed), which CORRECTIONS.md:31 fences as v1 product-pressure evidence, not EFS 2.0 facts. Label all of these as dated on any use; efsv2/owner refresh them when a Realm is chosen.

**Evidence:** `Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:20, 27, 31, 41-44 (§Citation hierarchy)` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/commons-realm-venue-matrix.md:§1 item 7, Appendix F, 36, 265` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/l1-incidents-and-dead-data.md:172, 208, 249` · `Reviews/2026-08-13-claude-evidence-round/corpus/venue/state-rent-and-storage-cost.md:38-42` · `Reviews/2026-08-13-claude-evidence-round/corpus/runner/browser-runner-measurements.md:208-210` · `Reviews/2026-07-19-base-native-aa-impact.md:§What changed` · `Designs/arcade/README.md:37-42` · `Designs/efsv2/state-expiry-and-storage-rent.md:§Could not verify item 3`

**Verified:** not separately verified; clustered from 3 independent lane findings · **Source lanes:** R18-evidence-round-15, S8-evidence-bindings-vs-14, S9-confirmed-then-unread-10

## Dropped in verification

Preserved so the round can be audited. Each was refuted on its text, judged immaterial, or found already dispositioned in the vault.

| Cluster | Title | Why dropped |
|---|---|---|
| `CORE-10` | Two Media Library Core asks are filed nowhere and one is explicitly rejected for B0 | accuracy: already dispositioned — The mechanics are quoted correctly (`b0-indexes.md:1077-1079` "Compound and alternate grammars are **[REJECTED for B0]**"; Open items #2 at :2077-2080 "`liveCount` is current-basis / materiality: refuted — The premise 'filed nowhere' is false. `Designs/media-library/owner-decision-inbox.md` §MEDIA-E2 files exactly these asks — 'After Stage B plus the media query extension reports the |
