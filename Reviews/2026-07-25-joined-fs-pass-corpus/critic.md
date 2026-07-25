# Completeness critic — binding consolidation of the 2026-07-25 joined KEL × authority × lens filesystem pass

**Lane:** completeness critic — the binding consolidation the synthesis is built from
**Charge:** dispositions of every FATAL/SERIOUS red-team finding; cross-lane adjudication; the reconciliation master table; the owner-packet assembly; the dependency-map check; completeness vs the charge; the kill list; the source-precedence audit
**Corpus adjudicated (all read in full):** [use-cases](./use-cases.md), [aa-inversion](./aa-inversion.md) (foundations); [authority-model](./authority-model.md), [filesystem-core](./filesystem-core.md), [large-files](./large-files.md), [local-mode](./local-mode.md) (design lanes); [attack-authority](./attack-authority.md), [attack-fs](./attack-fs.md) (red teams)
**Ground truth held against:** [[owner-rulings]], [[owner-decision-inbox]], [[assumptions-and-requirements]] (read in full by this critic), [[human-overview]] §7, [[ethereum-first-efs-and-os]] §11–12, [[kel]] §§0–4/23, [[README]]
**Status:** reconciliation input; binding on the synthesis; nothing here is ceremony-final. **Anything not in this file or a file it blesses does not reach the synthesis.**

#status/draft #kind/review #repo/planning #topic/efsv2 #kind/critic

---

## 0. Verdict in one page

The pass **did its job**. Both red teams found **zero FATAL** findings; all fifteen SERIOUS findings are confirmed by this critic's own re-derivation (one partially overruled in severity, §1 D-13) and every one has a named repair that survives its own break analysis. The four tensions T1–T4 were reconciled **explicitly in every lane that touched them, with independent convergence** — not fudged (§2.7–§2.10). The two-grade authority hypothesis survives as a *theorem about the authorization axis* with two refinements and one binding presentation rule (§2.2). The L1 pointer is **designed, judged, and shelved conditionally** — with two red-team corrections that change the pricing but not the recommendation (§2.3). The residual EFS identity layer is **R1–R6 plus one parametric field**, not R1–R7 as the inversion lane first claimed (§1 D-6).

The pass's largest structural weakness, named once so the synthesis cannot soften it: **the three FS lanes are strong at one pinned basis over a self-hosted node or bundle, and weak at exactly the boundary the mount ruling lives on — an ordinary user, a hosted RPC, a real file manager** ([attack-fs §0](./attack-fs.md)). The repair set (snapshot/bundle as the ordinary-app profile + a fourth graded absence source + handle-scoped `getattr`) resolves it, and it is an owner-visible product-line call (packet item P-16).

The second-largest: **liveness meets integrity** at the authority boundary — promotion across a revocation (F-1), revocation-censorship (F-2), censorship escape (F-7). The strong grade's integrity derivation is airtight; adversary-controlled *admission timing* is where honest pricing had gaps, now priced (§1 D-1/D-2/D-4).

What this pass does **not** contain, so nobody pretends it does: a full typed-lens replacement spec (only the FS profile chapter exists — §6 gap G-A); any measurement (E1/E2/E6/E10 all still open; every lane says so); the coordinated envelope/kernel recut (seams 1–5 have requirements and gates stated, not bytes); the privacy tier (hooks reserved per ruling 8, correctly).

How this file breaks: if the synthesis treats a REPAIRED-BY disposition as "already fixed in the lane text," it ships the pre-repair claims — every repair below is **owed text**, tracked in §3's ledger and §6's gap list, not yet applied to the lane files.

---

## 1. Dispositions — every SERIOUS red-team finding, re-derived

No FATAL findings existed to disposition. All fifteen SERIOUS findings re-derived by this critic against the primary texts. Verdict vocabulary: **KILLS** (a named claim dies; see §7), **REPAIRED-BY** (named repair adopted into the surviving design; owed to the named owner), **OVERRULED** (finding rejected, with reason). Ordering: authority set first, FS set second.

| # | Finding | Critic re-derivation | Disposition |
|---|---|---|---|
| D-1 | **F-1** — promotion across a revocation boundary strands honest pre-`r` evidence ([attack-authority §1](./attack-authority.md)) | CONFIRMED. [[kel#8. Envelope and admission amendment\|kel §8.1]]'s "promoted exactly once after a valid home admission" names no check basis; a current-state check at promotion time fails the revoked-then-recovered victim whose record sits at evidence ordinal `w < r`. The witness fact anti-backdating needs is on-chain; the written rule cannot consume it. | KILLS the unqualified "ordered evidence is upgradeable via promotion / no new machinery" ([authority-model §1.3–1.4](./authority-model.md)). REPAIRED-BY **repair (a)** as design center: promotion requires live authorization at promotion time; a pre-`r` `EVIDENCE-ORDERED@N` ordinal refutes *dating claims* forever but never upgrades authorization; product copy says "promote promptly." **Repair (b)** (retro-basis promotion check as-of `N`) is priced as an E-class candidate only if a real journey demands it — no bounded-gas design exists. Owner: the seam-3/4 coordinated recut. |
| D-2 | **F-2** — selective censorship of the revocation transaction extends the theft window and mints genuine receipts ([attack-authority §1](./attack-authority.md)) | CONFIRMED. The sequencer that delays only the revocation while admitting the thief's flood produces receipts that are *correct* — the grant really was live at each ordinal. The window bound becomes venue force-inclusion latency, adversary-controlled. | REPAIRED-BY repricing [authority-model §1.7/§5.5](./authority-model.md): the pre-revocation window is bounded above by *revocation-inclusion latency under adversarial ordering*; **force-inclusion latency is a security parameter of the strong grade**, added as an explicit E1 rider (packet P-5r2). Fixed grant expiries ([[kel#7. Actor and session authorization]]) are the backstop and now carry this motivation. F-3 (mempool front-running of the revocation; private submission lanes) folds in as the sharp instance. |
| D-3 | **F-6** — "discovery is inside the ID" is factually wrong; genesis commitment gives verification, not location ([attack-authority §2](./attack-authority.md)) | CONFIRMED trivially: `identityWord = keccak256(…GenesisBodyV1)` ([[kel#4.4 Born-KEL identity]]) is one-way; `authorityHomeRef` is in the preimage. A reader holding only 32 bytes can *check* a claimed home, never *extract* it. | KILLS "a reader of the principal word knows the realm" ([authority-model §2.4/§2.5.3](./authority-model.md)) and "discovery is free" ([aa-inversion §6.2.2](./aa-inversion.md)). REPAIRED-BY: discovery bootstrap = a hint/preimage-replication **Durable convention** (safe because every hint is digest-checkable — unforgeable discovery), with A5c's write-once pointer re-priced upward as the fallback for un-hinted merged-multi-realm bootstrap. Security analysis (thief cannot re-home a digest principal) survives untouched. Owner: A5 trail (packet P-5). |
| D-4 | **F-7** — the designed pointer cannot deliver censorship escape; internal contradiction with §5.5 ([attack-authority §2](./attack-authority.md)) | CONFIRMED. Retarget step one is a `MIGRATE_PREPARE` admission *at the censoring home* ([authority-model §2.1](./authority-model.md); [[kel#4.5 Home topology: canonical locator plus co-located authority]]). Against an adversarial home the anti-theft delegation is a dead end; A5b as designed buys voluntary venue switching only. | KILLS the use of the censorship scenario as support for A5b-as-designed. REPAIRED-BY **RT-1's three-way split** adopted into the consolidated re-home decision (P-5): A5a (no promise; successor identity answers censorship), A5b-relabeled ("voluntary re-home only"), or A5b+L1-emergency-departure-verifier with its true bill (unsolved verifier, new thief target, partial breach of "registry is never an authority root"). The pointer-theft theorem gains its dual: *the pointer can never be stronger than the source home's willingness to admit the departure.* |
| D-5 | **F-10** — the co-location corollary overstates incomparability for rollups sharing L1 settlement ([attack-authority §3](./attack-authority.md)) | CONFIRMED. Two rollups posting batch commitments to one L1 have a verifiable coarse shared order (`b_w < b_r` is provable, one-directionally sound — finalized-before implies existed-before), which is exactly Theorem 2's needed direction. Granularity is batch-level; optimistic dispute windows grade the embedding, not void it. The [[solana#6.6 Authority and sovereignty]] citation covers sovereign pairs only. | REPAIRED-BY the **qualified corollary** (sovereign pairs: heuristic only; shared-settlement pairs: verifiable coarse embedding for existence/freshness bounds) + a settlement-anchored existence/freshness *form* added to the read vocabulary. The two-grade theorem is UNAFFECTED — authorization still runs only at the home; this critic verified the absorption into the freshness axis is clean, which is *evidence for* the taxonomy (F-15). Owner rider on A2/A4 (packet P-2/P-4, RT-2). |
| D-6 | **F-12** — R1 smuggles R7: `authorityHomeRef` inside `GenesisBodyV1` makes the "topology-independent recut" claim false as stated ([attack-authority §4](./attack-authority.md)) | CONFIRMED against [[kel#4.4 Born-KEL identity]]; [aa-inversion §5](./aa-inversion.md)'s own kel-§4.4 row concedes the field *is* the immutable home-binding option. Freezing R1 as written pre-answers A5. | KILLS [aa-inversion §4.4](./aa-inversion.md)'s "residual core R1–R6 invariant across every topology; recut can proceed" as stated. REPAIRED-BY the honest scope: **R2–R6 plus R1-minus-the-home-field are topology-invariant; the home field (presence, meaning, mutability) is held parametric** (explicit `homeBindingMode` discriminant or carve-out from the frozen preimage) until P-5 answers. The recut may still proceed on the invariant core — the de-risking gift survives, smaller. |
| D-7 | **AF-1** — the ordinary hosted-RPC live mount cannot honestly emit `ENOENT` ([attack-fs §1](./attack-fs.md)) | CONFIRMED. FSP-ABSENT-1's three sources ([filesystem-core §1.7](./filesystem-core.md)) all require own-node execution, state proofs to closure, or a bundle manifest; a hosted RPC is none. Every honest negative degrades to a transient error; `test -e`, tab-completion, and `git` probing all misbehave. The conformance table's "lookup: defined" is profile-unqualified. | KILLS "lookup: defined" as unqualified and the hosted-RPC live mount as the ordinary-app surface satisfying [[owner-rulings#2026-07-22]]. REPAIRED-BY **JF-A**: the snapshot/bundle-with-closure-manifest profile becomes the ordinary-app mount; the live hosted-RPC strict mount is a verification/diagnostic surface; own-node live mounts remain first-class. Consolidated with J-FS1/J-FS2 into packet P-16. AF-10 (archival-state needs of old pinned bases) folds in as a caveat: snapshot mounts need an archive node **or** a self-contained bundle. |
| D-8 | **AF-2** — `ls -l` ghost entries: pinned-handle `readdir` + fresh `fstatat` disagree on live mounts ([attack-fs §1](./attack-fs.md)) | CONFIRMED; `ls -l` is mechanically a walk plus N independent lookups — [filesystem-core §6.1](./filesystem-core.md)'s "one recursive walk" framing does not cover it. | REPAIRED-BY **both** repairs, adopted: (i) adapter obligation — `getattr` for names obtained through an open directory handle answers at **that handle's pinned basis** (added to the §5.1 conformance table regardless of profile); (ii) the snapshot ordinary-app default per P-16. New falsification test added to the [[mountable-filesystem-semantics#12. Falsification tests]] ladder. |
| D-9 | **AF-3** — subscribed-curator whiteouts project as silent `ENOENT`; §1.5 and §1.7 are unreconciled ([attack-fs §1](./attack-fs.md)) | CONFIRMED contradiction: §1.5 wants the masked name gone from the tree; §1.7 forbids anything but closure-grounded absence from mapping to native not-found; ordinary tools cannot read the mask. | REPAIRED-BY **JF-C** as an owner axis (packet P-17); critic recommendation = JF-C-1 (visible inert tombstone entry, `user.efs.grade = WHITEOUT by <principal>`, distinguishable open failure). Whichever arm wins, §1.5/§1.7 must resolve to one sentence. |
| D-10 | **AF-4** — FSP-HYBRID's kind-priority lets a cross-author GENERIC squatter evict a higher-authority DATA file from its plain name ([attack-fs §1](./attack-fs.md)) | CONFIRMED. §1.4.1's tier resolution arbitrates within one position; Case B is across kindclasses, so the only arbiter is kind priority — which ignores lens authority. The construction is the product-visible harm the lane's own escalation clause named. | REPAIRED-BY the **authority-gated plain-name rule** adopted as design center (JF-D-1): different principals ⇒ higher lens tier takes the plain name; kind tiebreak applies only same-author/same-tier. Also resolves AF-13's Case-A×Case-B composition. Kept in the packet as a cheap owner confirm (P-18) because it changes whose file owns a name. |
| D-11 | **AF-5** — promotion is not identity-preserving for bare-EOA → KEL ([attack-fs §1](./attack-fs.md)) | CONFIRMED as written, **PARTIALLY OVERRULED in severity**: the red team's construction assumes the KEL principal is a fresh digest — but [[kel#4.3 In-place EOA upgrade]] is the *designed mainstream path* and **preserves the address-shaped identity word**, so `dataId`/`claimId` stability across inception already exists for the default journey. The finding retains full force for (i) bare → fresh unlinkable digest principal, and (ii) any recut that forces digest-shaped principals. | REPAIRED-BY: [local-mode §0/§7.2](./local-mode.md)'s "identity byte-for-byte" claim gains the mandatory caveat (true via in-place upgrade; false for fresh-principal migration, which is a new namespace + signed redirect/continuity claim). **JF-B survives as a genuine owner axis with a sharpened default** (packet P-10): confirm in-place upgrade as the promote-path default (JF-B-1, effectively already designed) and ratify the throwaway-plus-redirect story for deliberate fresh-principal moves. |
| D-12 | **AF-6** — local-realm manifest→`ENOENT` contradicts FSP-ABSENT-1 ([attack-fs §1](./attack-fs.md)) | CONFIRMED: a `DECLARED` manifest commits to a signer's `recordSetRoot`, not a venue state root; by [filesystem-core §1.7](./filesystem-core.md) a local realm could never emit `ENOENT`, yet [local-mode §4](./local-mode.md) says it does. | REPAIRED-BY the **fourth absence source**, adopted: *"a signed completeness manifest over a closed realm/bundle, carrying the signer-trust grade"* — `ENOENT` becomes always grade-carrying; venue-closure absence and signer-manifest absence are distinguishable at the control surface. This also legalizes the P-16 snapshot/bundle profile's absence story (the same source rescues D-7). Consistent with R-L6 (absence names its authority and basis). Both lane texts owe the shared sentence. |
| D-13 | **AF-7** — honest crashes forge "permanent equivocation evidence" ([attack-fs §1](./attack-fs.md)) | CONFIRMED: without write-ahead durability of "counter N consumed," two same-counter heads prove equivocation *or* a crash; a malicious peer can frame an honest device. | REPAIRED-BY the **durable-counter MUST** (persist counter consumption before signing; head derivation a pure function of durably-committed state) + softening "permanently convictable" to "convictable given the durable-counter discipline." Conventions-registry item; delegated. |
| D-14 | **AF-8** — mirror-tier files get no authenticated *position* on seeks; the "manifest buys authenticated seeking" corollary fails for the default tier ([attack-fs §1](./attack-fs.md)) | CONFIRMED: `leaf_i = keccak(DOMAIN, keccak(chunk_i), sha256(chunk_i))` provably commits content, not length/offset; a short-middle-chunk tree passes every per-chunk check while range arithmetic misaligns; the exactness rule is enforced only where `submitChunk` runs. | REPAIRED-BY the **offset/length-committing leaf** adopted as design center (bind `i` and `offset_i` into the leaf preimage, or commit a running-offset vector under `chunksRoot`) — cheap now because no vectors are frozen. With it adopted, **JF-E's escalation condition collapses** and the corollary is restored honestly. If the recut rejects it, the product statement "mirror-tier large files stream but do not offer authenticated random access" goes to James — the named escalation survives as a conditional. Owner of repair: EFSBytes/manifest recut + vectors. |
| D-15 | **AF-9** — permissionless store creation with author-mismatched geometry bricks completion ([attack-fs §1](./attack-fs.md)) | CONFIRMED: `storeId = keccak(DOMAIN, chunksRoot, tier)` excludes geometry; the apex binds count only; the exactness-rule interface delta ([large-files §1.4](./large-files.md)) lets a front-runner fix wrong `chunkSize` and permanently deny the `contractReadable` floor. The griefing surface was created by the lane's own fix and under-analyzed. | REPAIRED-BY binding declared geometry to store identity (fold `chunkSize`/`size` into the store commitment, or require the signed manifest at creation). Delegated gate + adversarial store-creation fixture added to the large-files gate list. |

**NOTE-level findings:** all thirteen (F-3/4/5/8/9/11/13/14/15/16; AF-10/11/12/13/14/15) are ACCEPTED as marked, with these adjudications binding on the synthesis: F-5's named preconditions (open seams 4/5 are *assumptions* of the default-deny theorem — one sentence owed in [authority-model §1.5](./authority-model.md)); F-11's disclosure line in P-2 (all arms embed the realm-qualified invariant; the foreclosure of unqualified `CURRENT` is stated, not hidden); F-13's re-based reason for inversion row 3 (portability of transcripts + 7702-root-bypass, not impossibility); F-15's presentation rule (§2.2); AF-14's wording fix ([filesystem-core §3.2](./filesystem-core.md)'s handle tuple cites [large-files §1.2](./large-files.md) — the manifest *is* the tuple); AF-15's flag-scope fix (`SAME_SLOT_COLLISION` excludes same-principal multi-device concurrency, distinguishable via P10 `deviceBits`; coordinate across H-5).

---

## 2. Cross-lane adjudications

### 2.1 Absence semantics — one rule system-wide (resolves D-7/D-9/D-12)

Adopted: `ABSENT_PROVEN` has **four** sources — own-node total-state read; verified state proof to positive closure; venue-committed bundle closure manifest; **signed closed-realm/bundle manifest at signer-trust grade** — and every native not-found is grade-carrying at the control surface. `UNKNOWN` never maps to not-found; policy suppression (whiteout/deny) is neither, and its mount projection is P-17. This is the single sentence [filesystem-core §1.7](./filesystem-core.md) and [local-mode §4](./local-mode.md) both rewrite to.

### 2.2 The grade vocabulary — one result model (resolves F-15, F-10, T4)

Adopted as the replacement-spec input: a read result is the tuple **(authorization, existence bound, freshness/basis, availability, slot/resolution state, completeness)** — never one word.

- Authorization axis (the *two-grade* axis): `PORTABLE-EVIDENCE` → `AUTHORITY-ADMITTED`, with `EVIDENCE-ORDERED@N` as a read-vocabulary label, not a third authorization tier ([authority-model §1.4](./authority-model.md)).
- Freshness axis: `SNAPSHOT@H` / `CURRENT@H` **plus the settlement-anchored existence/freshness bound** for shared-settlement realm pairs (D-5).
- Availability axis: the `BYTES-*` family incl. `CONTENT-MALFORMED`, `MANIFEST-UNREASONABLE` ([large-files §2.6](./large-files.md)).

**Binding presentation rule (F-15):** the hypothesis is validated as *floor/ceiling of the authorization axis*; no owner packet, product copy, or UI may compress the tuple to "two grades = two labels." A client rendering the tuple as one green checkmark recreates seam 7's collapsed-Boolean failure ([[human-overview#7. The seams that must be closed]]).

### 2.3 The pointer/re-home question — one decision, three lanes superseded-in-form

[use-cases J4](./use-cases.md), [aa-inversion J-4](./aa-inversion.md), and [authority-model A5](./authority-model.md) are consolidated into **P-5**, amended by RT-1 (voluntary-move vs censorship-escape split), D-3 (discovery correction: hints + A5c re-priced), and the two riders (T1 venue-class scope; F-2 force-inclusion latency). The pointer remains **designed, judged conditionally unnecessary, shelved** — activated only by an owner choice of movable homes or the re-home promise. The §2.3 pointer-theft theorem and its F-7 dual are both carried: *a pointer adds discovery, never authority security, and never exceeds either the recovery machinery or the source home's cooperation.*

### 2.4 The residual identity layer

Endorsed: **R1–R6 with R1's home field parametric** (D-6), consuming ERC-7913-shaped stateless verifiers as pinned-spec implementations, account layer consumed for everything execution/recovery/ceremony-shaped ([aa-inversion §3.6/§4](./aa-inversion.md), standards table re-verified by [attack-authority F-14](./attack-authority.md)). J-1/J-2/J-3 stand as packet items (P-7/8/9). The kel.md section map ([aa-inversion §5](./aa-inversion.md)) is blessed as the recut work order, with the D-6 and F-13 corrections.

### 2.5 The FS profile and its consumers

FS-LENS/1 ([filesystem-core §1](./filesystem-core.md)) is blessed as the **replacement seed** for the reopened [[read-lens-spec]] — first chapter only; GATE/package/discovery profiles remain owed (§6 G-A). The one-basis invariant, the seam-6 closure text (equivocation half), FSP-HYBRID with the D-10 authority gate, the portable-name profile, and the five-part view identity are blessed. The conformance table is re-marked per D-7/D-8 (profile-qualified). The mount-budget ⇄ current-live index coupling ([filesystem-core §4.5](./filesystem-core.md)) is flagged as the sharpest new E2 input.

### 2.6 The byte model

"The manifest is the generation" ([large-files §1.2](./large-files.md)) is blessed as the structural fix for the torn-generation crack, with the D-14 offset-committing leaf and D-15 geometry-bound store amendments, the chunk-authorization-free invariant ([large-files §3.3](./large-files.md) — the concrete pushback text against any future epoch-checking of `submitChunk`), the two-axis grade algebra, and the §2.5 masquerade kill-list (enforcement = P-20). T3 is dissolved, not compromised: state-tier bytes pass item 16's own bounded-gas test; DA-tier stays off-chain @EPHEMERAL exactly as ruled.

### 2.7 T1 — RULED: reconciled, not fudged

Four lanes + one red team independently converged on the same split: **the adopted chains-don't-die ruling covers data/read persistence on every venue; authority-home *venue-class* membership is a separate open axis**, surfaced as the P-5 rider and an E1 measurement input — never silently picked ([use-cases §6 T1](./use-cases.md), [aa-inversion §6.1](./aa-inversion.md), [authority-model §2.6](./authority-model.md), [local-mode §10](./local-mode.md), [attack-authority §5.1](./attack-authority.md)). D-2 extends the rider: revocation force-inclusion latency is a qualifying property of an acceptable authority home. AF-10 adds the state-side sharpening: the ruling guarantees head-queryability, not arbitrary historical state proofs — snapshot mounts need archive nodes or bundles. **Verdict: explicitly reconciled.**

### 2.8 T2 — RULED: argued on merits, stop-rule respected

The pointer was designed then judged in three lanes with zero silent assumption in either direction; the [[owner-rulings#2026-07-23]] correction (research stop-rule, not prohibition) was quoted and obeyed everywhere; the use-case corpus's "no MUST-grade requirement forces cross-chain machinery" claim was attacked by the authority lane as instructed and survived, then corrected at the margin by D-3 (a NICE-grade discovery consumer exists for merged views) and D-5 (a free capability, not machinery, exists for shared-settlement pairs). **Verdict: explicitly reconciled; ruling 4's justify-or-unnecessary discharged at [authority-model §2.7](./authority-model.md) as amended.**

### 2.9 T3 — RULED: dissolved via the tier ladder

The apparent conflict was vocabulary, not design: ruling 6's first-class large on-chain file is the **state tier** (passes item 16's own test); the calldata rail stays DA-tier/@EPHEMERAL exactly as item 16 ruled ([use-cases §6 T3](./use-cases.md) sketched; [large-files §2.2](./large-files.md) proved at mechanism level; [attack-authority §5.3](./attack-authority.md) spot-confirmed the authority-side indifference). Enforcement of the reconciliation is the wording rule (P-20). Pricing is honest: gas arithmetic labeled as arithmetic, E2/E1 named as the gates at every use. **Verdict: explicitly reconciled.**

### 2.10 T4 — RULED: kept separable everywhere

The two-grade hypothesis (validated, §2.2), kel.md's maximal topology (demoted throughout; nothing revived it), and N1's axes (decomposed into AX-1..6, audited for independence by [attack-authority §3](./attack-authority.md) with two qualifications adopted: F-11 disclosure, F-10 floor correction) never re-fused in any lane. Availability grades compute identically under every topology; the FS profile is topology-blind; local mode is the weak grade's native habitat under every option. **Verdict: explicitly reconciled; the F-15 presentation rule is the one standing hazard and is now binding.**

---

## 3. The reconciliation master table

Every owner choice, requirement, and reopened seam this pass touched. Status ∈ still-valid / changed / superseded / evidence-gated / newly-exposed.

### 3.1 Adopted owner rulings

| Item ([[owner-rulings]]) | Status | Responsible lane + section |
|---|---|---|
| Chains don't die (2026-07-10) | **still-valid, scope-sharpened**: data/read persistence everywhere; authority-home venue-class + archival-state limits **newly-exposed** as P-5 rider / E1 input / mount caveat | all lanes; §2.7 here |
| KEL required; bare EOA zero state (2026-07-10/16) | **still-valid, re-derived** from account-layer limits rather than assumed | [aa-inversion §2–3](./aa-inversion.md) |
| Passkey-sync + independent cold factor baseline | **still-valid**; recovery locus question (P-8) is about machinery, not factors | [aa-inversion J-2](./aa-inversion.md) |
| Personas = separate KELs grouped locally | **still-valid** | [aa-inversion §2 row 10](./aa-inversion.md) |
| Public by default + sensitivity layer | **still-valid**; promotion pre-flight is where it earns its keep; intake guardrails **newly-exposed** (P-23) | [local-mode §7.2](./local-mode.md), [use-cases J5](./use-cases.md) |
| Mandatory automatic indexing + A–E bundle (2026-07-15) | **still-valid, load-bearing**; boundary clarified (admission-coupled, never local); R-QC8 history-amplification + mount-budget coupling **newly-exposed** for E2 | [filesystem-core §4](./filesystem-core.md), [local-mode ledger 3](./local-mode.md) |
| Full-body spine + no-elision (items 17/18) | **still-valid**; new named consumers (receipts-in-state, generation reconstruction, export replay) | [authority-model §1.2](./authority-model.md), [large-files ledger 2](./large-files.md) |
| No on-chain collision bit; closed sets + challenge windows (item F) | **still-valid, not reopened** — checked in every lane; `SAME_SLOT_COLLISION` is a different object, E2-gated, and now excludes multi-device concurrency (D-15/AF-15) | [filesystem-core §1.8](./filesystem-core.md), [authority-model §1.5](./authority-model.md) |
| `act` provenance-only; KEL grants authorize | **still-valid, reinforced** by 7702 field data (attacker-installed delegation state) | [aa-inversion §1.1](./aa-inversion.md) |
| contentHash→file index; best-mirror; live counts; self-enumeration pending | **still-valid**; E3 gains its two demanded consumers; E4 restated crisply with the admission-time root-reachability constraint; E5 released from FS pressure | [use-cases ledger 5–6](./use-cases.md), [filesystem-core §4.2–4.3](./filesystem-core.md) |
| Storage on-chain + Arweave; L2/L3-first bytes; EFSBytes immutable | **still-valid**; default ceremony = LF-J1, routed to E-track | [large-files §2.3](./large-files.md) |
| Large-file 2026-07-07 rulings (floor, permissionless pool, frozen store) | **still-valid**; extended by the authorization-free-chunks invariant; `FileManifest` field set **changed** (recut: +sha256, +geometry contract, −`preferredTier`, `expiresAt` advisory) | [large-files §1, ledger 3/7/13](./large-files.md) |
| Read-only mount required, 3 OSes (2026-07-22) | **still-valid, discharged into a conformance table**; ordinary-app profile question **newly-exposed** (P-16); no lane choice forecloses writable follow-up | [filesystem-core §5](./filesystem-core.md), [attack-fs AF-1/2/10](./attack-fs.md) |
| Six separately-named capabilities (2026-07-22) | **still-valid**; the register's axis tagging is built on it | [use-cases §5](./use-cases.md) |
| 2026-07-23 corrections (stop-rule UNDECIDED; N1 split; sequencing hold) | **complied with throughout**; the AX decomposition is the demanded revalidation; hold liftable for the authority surface (§4.0) | [authority-model §3](./authority-model.md); §8 here |
| FS-vs-OS venue hypothesis (2026-07-23) | **largely dissolved technically** (co-residency rule), qualified by D-5 for shared-settlement pairs; residual = product-acceptance (P-4) | [authority-model AX-4](./authority-model.md), [attack-authority F-10](./attack-authority.md) |
| Two-grade hypothesis (this pass's ruling 3) | **validated** as authorization floor/ceiling theorem + two refinements + binding F-15 presentation rule | §2.2 here |
| kel.md maximal topology / §18 fork 8 / §23 items 1–2 | **remains demoted; superseded** by the AX decomposition + P-5; §23 items 3–5 survive as P-6 | [aa-inversion §5](./aa-inversion.md), [authority-model ledger 5–7](./authority-model.md) |

### 3.2 Reopened surfaces and held items

| Item | Status | Lane |
|---|---|---|
| [[read-lens-spec]] flat lens, global same-order equivocation, old grades | **superseded** — FS-LENS/1 is the replacement seed; anti-fallthrough/deny/follow/acceptance discipline **carried re-typed** | [filesystem-core §1](./filesystem-core.md) |
| read-lens-spec §5.2 checkpoint-grounded absence | **superseded** by FSP-ABSENT-1/2 (+ fourth source, D-12); checkpoints stay ordinary claims (Q4A untouched) but lose the absence-prover role | [filesystem-core ledger 6](./filesystem-core.md) |
| read-lens-spec §5.4 MUST-pull-home via `home` row | **suspended** pending topology; `home` advisory-only under every candidate | [filesystem-core §1.9](./filesystem-core.md) |
| Held N1 | **superseded-in-form**: replaced by AX-1..AX-6 + the four riders (P-1..P-6), independence-audited | [authority-model §3](./authority-model.md), [attack-authority §3](./attack-authority.md) |
| Held Q1/Q2/Q5 | untouched; Q5's fail-closed posture assumed by every GATE rule (named, not answered) | [filesystem-core ledger 10](./filesystem-core.md) |
| Held Q3/Q4 | **still-held, evidence added for the A arms** (local mode validates both) | [local-mode ledger 4–5](./local-mode.md) |
| Held D-9 (on-chain lens promise) | **still-held, evidence added**: FS profile is choice A's strongest consumer — disclosed, not adopted | [filesystem-core ledger 9](./filesystem-core.md) |
| Held N5 (playable archive anchor) | untouched; corpus treats it as one fixture of twelve classes, compatible with any arm | [use-cases §1.2](./use-cases.md) |
| E1 | **changed (riders added)**: venue-class qualification; revocation force-inclusion latency; shared-settlement embedding granularity | §2.7, D-2, D-5 |
| E2 | **changed (inputs added)**: mount-budget ⇄ current-live coupling; `SAME_SLOT_COLLISION` surface; dual-digest leaf pricing; generation-churn fixture | [filesystem-core §4.5](./filesystem-core.md), [large-files](./large-files.md) |
| E3 | **evidence-gated, now priceable**: the two demanded consumers exist (G-LEGAL-1; UC-V close rule) | [use-cases ledger 6](./use-cases.md) |
| L16 (P-256/WebAuthn) | **evidence-gated, premise updated**: EIP-7951 live on mainnet since Fusaka 2025-12-03; gates unchanged | [aa-inversion §1.4](./aa-inversion.md), verified by [attack-authority F-14](./attack-authority.md) |
| Apps-cookbook verdicts | **evidence-gated** (predate KEL/envelope reopen + gas snapshot) | [use-cases ledger 13](./use-cases.md) |
| R-K11 | **elevated**: realm-qualified authority adopted as the invariant every AX-2 arm obeys, with the F-11 disclosure obligation | [authority-model AX-2](./authority-model.md) |
| identity.md ERC-1271 ban | **still-valid in core** (never record/KEL authority); stateless-7913-as-pinned-implementation nuance added | [aa-inversion ledger 3–4](./aa-inversion.md) |

### 3.3 The [[human-overview]] §7 seams — which this pass closes

(§7 enumerates 14 blockers + 5 measured questions; the pass frame's "eleven" undercounts — all 19 are dispositioned here.)

| Seam | Disposition after this pass | Owes |
|---|---|---|
| 1 full-width principals | **open, requirements stated** (H-3; R-PA5 "bug fix, not a choice"); AF-5/D-11 adds the bare→KEL continuity rider | envelope/IDs recut + vectors |
| 2 envelope identity | **open, two new recut gates**: offline-constructibility invariant (no venue-coupled signed field); `claimId` excludes actor carriage must survive | envelope recut (H-4) |
| 3 evidence vs authority lanes | **substantially advanced**: derived as theorem (W2/W3), lane-labeling requirement stated (H-1/H-2); **promotion-across-revocation newly-exposed as unspecified (D-1)** | kernel recut; conditional on P-1 |
| 4 revocation semantics / first-admission | **open**; now a *named precondition* of the default-deny theorem (F-5) | recut |
| 5 receipt binding | **open**; same precondition status (F-5) | recut |
| 6 false equivocation / false absence | **equivocation half CLOSED (verified by attack)**; absence half closes with the D-7/D-9/D-12 repair set (§2.1) | apply repairs; P-16/P-17 |
| 7 lens object too weak | **closed for the FS profile**; full typed replacement (GATE/package/discovery/moderation) **unowned in this corpus** | the lens/resolver lane (gap G-A) |
| 8 lens channels duplicate KEL | untouched | lens lane |
| 9 bare/stealth grade + home rule | **advanced**: D-4 arm recorded under AX-2; `home` row advisory-only everywhere; thief-declares-home closed per topology (§2.3) | P-2/P-5 |
| 10 private subtree proofs | untouched (correctly — ruling 8) | privacy × KEL pass |
| 11 `privacyClassSet` | **repair adopted**: removed in the grant-grammar SIMPLIFY | recut applies it |
| 12 starter vs personal policy | untouched beyond posture (local-replica default noted) | lens lane |
| 13 wallet/encryption roots | untouched; carried correctly (independent roots) | client recut |
| 14 suite succession | **direction recommended** (A6d/D-7 first arm; 7913-as-implementation) | design + review |
| 15 fifty homes | **dissolved under recommended arms** (A2a/A5a); benchmark still owed under any arm | E6 |
| 16 index bundle | **advanced**: consumer map, E4 restatement, E5 released; not settled | E2 |
| 17 append-only aging | **sharpened** into the mount-budget ⇄ current-live coupling — the pass's clearest new E2 lever | E2 |
| 18 KEL disclosure privacy budget | untouched | E11 |
| 19 package/update lens model | outside FS-LENS/1 by construction; stop-by-default carried | lens lane |

---

## 4. The owner packet — merged, deduplicated, dependency-ordered

### 4.0 Sequencing-hold statement

This packet is the **revalidated decomposition the 2026-07-23 hold demanded** for the KEL/authority surface: every item is answerable alone, none re-asks a settled item, and adopting one adopts nothing else. **The hold is liftable for P-1..P-10** once the synthesis lands. For the lens surface, only the filesystem slice is revalidated — lens-coupled holds (D-13's full scope, seams 7/8/12/19) stay held pending gap G-A. James may answer any single item at any time under the hold's own carve-out; the packet exists so he does not have to answer any of them as a batch.

**Assembly rules applied:** every lane's Decisions-for-James merged; consolidations named; each item classed **OWNER** (values/product call — stays), **E-TRACK** (evidence gate — routed), or **DELEGATED** (routed out). Re-bundling flags: (a) P-5 carries two riders — they are listed as separately answerable lines, not folded into the arm choice; (b) P-2 embeds the realm-qualified invariant in every arm — disclosed per F-11, since it forecloses unqualified `CURRENT`; (c) the F-15 rule binds the packet's own language (nothing here says "the two grades" as if two labels); (d) P-16 deliberately merges three prior items (J-FS1, J-FS2, JF-A) because D-7/D-8 collapsed them into one profile question — a merge, not a re-bundle, and the sub-choices are stated inside it.

### Tier 1 — the authority spine (in order; P-1 is the root)

- **P-1 (= A1 / D-1). Adopt the strong grade (two-lane kernel + receipts)?** Rec: **yes, high confidence** — structural derivation + account-layer inversion + forcing use-case classes all converge; only a product ruling that EFS ships no package/org/gate class could change it. Trail: [authority-model §1 + A1](./authority-model.md); [aa-inversion §3.3](./aa-inversion.md); [use-cases R-AU3](./use-cases.md). *New under-priced consequence to disclose: the D-1 promotion rule (promote promptly; late promotion after a revocation cannot upgrade authorization).*
- **P-2 (= A2 / D-2). Realm-qualified invariant + how many realms ship.** Rec: invariant + one measured realm, extension-ready (A2a). **Disclosure (F-11):** every arm embeds the invariant; unqualified global `CURRENT` is foreclosed by R-K11's dual-claim incoherence, stated not hidden. **Rider (RT-2):** the shared-settlement floor is stronger than sovereign-pair wording — adopt the qualified corollary. Trail: [authority-model AX-2/§3.8](./authority-model.md); [attack-authority F-10/F-11](./attack-authority.md).
- **P-3 (= A3 / D-3). Cross-realm consumption promise.** Rec: clients verify; foreign contracts need explicit adapters/pinned commitments (A3a) — zero consumers for more. Trail: [authority-model AX-3](./authority-model.md); [use-cases R-CR4](./use-cases.md).
- **P-4 (= A4). Co-residency rule for FS-vs-OS venues.** Rec: adopt (A4a) — mechanical consequence of the co-location corollary; **rider (RT-2)** applies (cross-realm floor is provable, not policy-trusted, for shared-settlement pairs). Trail: [authority-model AX-4](./authority-model.md); [[owner-rulings#2026-07-23]].
- **P-5 (consolidates use-cases J4 + aa-inversion J-4 + authority-model A5, amended by RT-1 + D-3). Re-home promise & pointer disposition.** Three arms with the corrected bills: **A5a** — no re-home promise; genesis-committed home as design center; discovery = digest-checkable hint convention; pointer stays a designed shelf candidate; censorship answered by evidence-lane-elsewhere + successor identity. **Recommended.** **A5b-relabeled** — voluntary re-home only (the designed pointer cannot escape a censoring home). **A5b+escape** — the full censorship-escape promise: adds an unsolved L1 emergency-departure verifier, a new thief target, and a partial breach of "the registry is never an authority root." Trail: [authority-model §2](./authority-model.md); [attack-authority F-6/F-7/RT-1](./attack-authority.md); [aa-inversion §6.2](./aa-inversion.md).
  - **P-5r1 (rider, answer separately): T1 scope** — does chains-don't-die qualify authority homes by venue class, or is any venue an acceptable anchor with E1 measuring candidates?
  - **P-5r2 (rider, answer separately): force-inclusion latency** is a qualifying security property of an acceptable authority home (bounds the theft window — D-2).
- **P-6 (= A6a–d; the old N1A riders, never again a topology side effect).** Four codes: legacy-EOA commitment default-on with degraded skip; smart-account one-time direct inception with 1271/6492 banned from canonical authority; personal principals non-transferable / org control succession; frozen same-domain suite successor, no mutable verifier admin. All recommended. Trail: [authority-model §4](./authority-model.md); [[kel#23. Decisions for James]] items 3–5.

### Tier 2 — identity boundary

- **P-7 (= J-1). Ratify the consume-vs-build residual boundary** (EFS builds R1–R6 with R1's home field parametric per D-6; consumes everything else). Trail: [aa-inversion §3.6/§4](./aa-inversion.md); D-6 here.
- **P-8 (= J-2). Recovery machinery locus** — minimal EFS-native policy machine (pending-freeze + `DISPUTED-INTERVAL` grading survives under any arm) vs fully consumed vs full §10. Rec: J-2A. Trail: [aa-inversion J-2](./aa-inversion.md); [attack-authority §5.2](./attack-authority.md) (recovery composition is the real security budget).
- **P-9 (= J-3). May a smart account BE ongoing control authority?** Rec: no — accounts bootstrap/bind/coordinate; KEL key material controls. Trail: [aa-inversion J-3](./aa-inversion.md).
- **P-10 (= JF-B, sharpened by D-11). Does bare-EOA identity survive KEL inception?** Rec: **yes via the already-designed in-place upgrade path** ([[kel#4.3 In-place EOA upgrade]] preserves the identity word) as the promote-path default; deliberate fresh-principal moves are a new namespace + signed redirect, said loudly. Trail: [attack-fs AF-5/JF-B](./attack-fs.md); D-11 here.

### Tier 3 — mode & product law

- **P-11 (= J3). Chain-free mode: shipped labeled product mode or internal seam?** Rec: shipped (the ladder + the §4/§6 loss list as disclosure). Trail: [use-cases J3](./use-cases.md); [local-mode](./local-mode.md).
- **P-12 (= JL-1). Rung-label honesty as binding product law.** Rec: adopt. Trail: [local-mode §9.4/JL-1](./local-mode.md).
- **P-13 (= JL-2). Provider-attested freshness as an allowed labeled rung.** Rec: allow. Trail: [local-mode §5/JL-2](./local-mode.md); requires the D-13 durable-counter discipline.
- **P-14 (= JL-3). Default head-anchoring posture.** Rec: opt-in witnessed mode; head hint default-on. Trail: [local-mode JL-3](./local-mode.md).
- **P-15 (= JL-4). Local-mode launch scope: single-principal realms.** Rec: yes; `memberSet` keeps teams unforeclosed. Trail: [local-mode JL-4](./local-mode.md).

### Tier 4 — mount & FS projection

- **P-16 (consolidates J-FS1 + J-FS2 + JF-A). The ordinary-app mount profile.** Rec: **snapshot/bundle-with-closure-manifest is the required ordinary-app profile** (delivers honest `ENOENT` via the §2.1 fourth source, kills the `ls -l` ghost, sidesteps archival-state limits); live mounts are opt-in (own-node first-class; hosted-RPC live = diagnostic surface); the graded/permissive mount stays research-only. Sub-choices inside: refresh = explicit (J-FS1-A); two shipped profiles (J-FS2-A). Trail: [attack-fs AF-1/AF-2/AF-10/JF-A](./attack-fs.md); [filesystem-core §6](./filesystem-core.md).
- **P-17 (= JF-C). Subscribed-curator whiteout projection.** Rec: visible inert tombstone (JF-C-1). Trail: [attack-fs AF-3](./attack-fs.md); D-9 here.
- **P-18 (= JF-D). Authority vs kind for the plain name.** Rec: authority wins across kinds (JF-D-1, adopted as design center; this item is the cheap owner confirm). Trail: [attack-fs AF-4](./attack-fs.md); D-10 here.

### Tier 5 — bytes & wording

- **P-19 (= LF-J2). DA-tier: internal rail or user-facing tier?** Rec: internal rail. Trail: [large-files LF-J2](./large-files.md).
- **P-20 (= LF-J3). Ratify the tier-vocabulary honesty rule + kill-list.** Rec: ratify; it is the enforcement half of T3. Trail: [large-files §2.5](./large-files.md).

### Tier 6 — scope & messaging

- **P-21 (= J1). Cardinality scope: high-frequency telemetry out of v2's on-chain admission scope** (aggregate/checkpoint pattern in). Rec: A. Trail: [use-cases J1](./use-cases.md).
- **P-22 (= J2). "Contract-readable" wording: same-venue program-readable with Ethereum as required richest profile.** Rec: A. Trail: [use-cases J2](./use-cases.md); [[solana]].
- **P-23 (= J5). Permanence-hazard intake guardrails now.** Rec: A. Trail: [use-cases J5](./use-cases.md).

### Routed to E-TRACK (evidence before decision)

**LF-J1** (default publish ceremony — decide against the E2 snapshot + the de-risking slice; working default = commitment on-chain, bytes to Arweave); **E1** with its three new riders (P-5r1 venue-class, P-5r2 force-inclusion, RT-2 embedding granularity); **E2** with the new inputs (§3.2); **E3** (now priceable — consumers named); **E4** (roots-forward + orphan-tail vs full index, with the admission-time-reachability constraint); **E6** (lens ceiling; plus month-scale merge/conflict-set benchmarks from [local-mode](./local-mode.md)); **JF-E** (only if the recut rejects the offset-committing leaf — D-14); **G-4** mount budgets.

### Routed out (DELEGATED technical gates — not owner votes)

F-1 promotion-rule text + seam-3/4 recut; F-5 precondition sentence; seam-4/5 binding vectors; the parametric `homeBindingMode` carve-out (D-6); FSP-HYBRID vectors (G-1, minus P-18's confirmed rule); closure-proof wire shape (G-2); `~`-grammar confirmation (G-3); handoffs H-1..H-6; the fourth-absence-source shared sentence (D-12); handle-scoped `getattr` adapter obligation (D-8); AF-7 durable-counter MUST; AF-8 offset-committing leaves; AF-9 geometry-bound stores + griefing fixture; AF-12 decoration purity; AF-14 tuple wording; AF-15 flag scope; `FileGenerationV1` recut + dual-digest vectors + EIP-7623 constant re-check; the `.efs-bundle` normative spec; kel.md §12 table updates + 7913 wording nit; the hint/preimage-replication discovery convention (D-3).

---

## 5. Dependency-map check (deliverable 3)

The [use-cases §5.8](./use-cases.md) map is **verified with three amendments and three holes**.

**Forces the L1 pointer:** confirmed — nothing in the MUST set; only (i) movable-home topology (where it is constitutive — [authority-model §2.4](./authority-model.md)), (ii) the re-home promise (P-5b arms), (iii) merged-view *bootstrap discovery*. **Amendment 1 (D-3):** item (iii) is stronger than the map stated — genesis commitment does NOT carry its own discovery; the merged-view case is a real NICE-grade consumer for the hint convention or the A5c write-once pointer. **Amendment 2 (D-4):** the pointer, even if built, does not serve censorship escape — remove that from any justification column. **Amendment 3 (D-5):** add a row for the shared-settlement embedding: a *free capability* (verifiable coarse cross-realm existence bounds for rollup pairs), not machinery, available without any pointer.

**Depends on cross-chain machinery:** confirmed as mapped (R-XC1 client-side; R-XC2 trivial; R-CR4 deferred with zero forcing cases; R-AU8/R-XC3 topology-dependent). The authority lane's independent attack on the "no MUST forces cross-chain" claim failed to break it ([authority-model ledger 17](./authority-model.md)); this critic accepts the claim as attacked-and-standing.

**What local-only loses:** L1–L10 + the structural-why table ([local-mode §6](./local-mode.md), one row added) — verified coherent against [[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]].

**Holes (owed to the register/synthesis):** (H1) **promotion semantics** — no register row covers promotion-across-revocation (D-1); add one (it is journey (c)×(d)'s intersection). (H2) **bare→KEL identity continuity** — R-AU2 asserts stable identity across rotation but the inception crossing was untagged (D-11); add the rider. (H3) the register was never byte-checked against [[assumptions-and-requirements]] §4 — this critic performed the **classification-level** cross-check (below, §6); the row-by-row check is owed to the synthesis.

---

## 6. Completeness audit vs the charge

**Rulings 1–9:** all addressed. (1) scope held — social/curation noted as future consumer only ([use-cases §2.6](./use-cases.md)); nothing forecloses it. (2) chains-as-drives designed ([filesystem-core §2](./filesystem-core.md)); merged-view hard parts named, the one non-client-policy part identified as exactly the held decision surface. (3) two-grade hypothesis validated-not-assumed (§2.2). (4) pointer designed + judged + amended (§2.3). (5) chain-free mode designed + the cannot-do ledger delivered ([local-mode §6](./local-mode.md)). (6) large files first-class at mechanism level with T3 dissolved ([large-files](./large-files.md)). (7) authority-strength puzzle solved by derivation with the weak grade's cannot-promises stated as theorems ([authority-model §1](./authority-model.md)). (8) privacy hooks reserved, no tier designed — checked in every lane. (9) mount checked in every lane, and the red team found where the check had been optimistic (D-7..D-10) — the repairs close it.

**Five anchor journeys end-to-end:** (a) browse/enumerate — designed; honest only under the P-16 profile ruling. (b) overlay lenses — designed. (c) rotate/recover — designed; D-1's promotion rule is the new caveat on its evidence-lane interaction. (d) local→promote — designed; D-11 caveat owed in text. (e) large-file publish/verify/range-read — designed; D-14/D-15 repairs owed. **No journey is unowned.**

**Inverted-framing pass before design:** VERIFIED — [aa-inversion](./aa-inversion.md) (03:27) and [use-cases](./use-cases.md) (03:24) predate all four design lanes (03:38–03:39), which cite them as built-on foundations. Not retrofitted.

**MUST-requirements falsification-tested:** **partial.** The red teams adversarially tested the absence/identity/coherence/byte/authority rows (AF-1..15, F-1..16). Untested MUST rows, named: R-MODE3 (relayer/sponsor separation under adversarial relayers), R-BA2 (mirror-cardinality page caps under 10–50 mirrors), R-QC2/R-QC7 adversarial closure at hot targets, R-PA3 (the bundle spec exists only as a reservation — nothing to falsify yet), R-AU5 grant-ceiling abuse. These go to the conformance/vector program, not another pass.

**Gaps — each with what closing it needs:**

- **G-A (largest): no full lens-replacement lane.** FS-LENS/1 is one chapter; GATE/package/discovery/moderation profiles, channel model (seam 8), starter-vs-personal separation (seam 12), and update policies (seam 19) are unowned in this corpus. Closing needs the dedicated lens/resolver pass the [[README]] sequence already names.
- **G-B: promotion-across-revocation semantics** (D-1) — needs the seam-3/4 recut design choice (repair a) and, if wanted, an E-priced retro-basis variant.
- **G-C: the coordinated envelope/kernel recut** — seams 1/2/4/5 have gates and requirements from this pass (offline-constructibility, claimId-actor-exclusion, full-width, receipt binding, lane labels) but no bytes; needs the recut itself.
- **G-D: no measurements** — E1/E2/E6/E10 all open; every lane was honest about it; the costing pass and the large-files de-risking slice are the cheapest converters.
- **G-E: filesystem-core G-1..G-6 + handoffs H-1..H-6** — tracked; none silent.
- **G-F: the `.efs-bundle` normative spec** — now elevated by two lanes (walk-away vehicle + snapshot-mount substrate under P-16); needs writing early.
- **G-G: same-author multi-device authoring rule** (G-5/H-5 + AF-15 scope fix) — owed to the envelope/authority recut.
- **G-H: the repair set is owed text** — every REPAIRED-BY in §1 must be applied to the lane files or carried by the synthesis explicitly; this file is the checklist.

**Classification cross-check against [[assumptions-and-requirements]]** (performed by this critic, read in full): no surviving claim contradicts a ratified invariant or required boundary; the pass supplies evidence rows for R-K3 (→P-1), R-K11 (elevated), R-D8 (reinforced), R-L6/R-X3 (absence/basis rules consumed), R-O10 (conformance walk); H-K1..H-K7 all remain hypotheses with H-K1/H-K2/H-K3 further demoted by P-5's analysis; no H-row was silently promoted. D-1..D-7 map onto P-1..P-6 without remainder; D-8..D-16 untouched by this pass except D-9 (evidence added, held).

---

## 7. The kill list — claims that did not survive

The synthesis must not reinstate any of these:

1. "A reader of the principal word knows the realm" / "discovery is free / inside the ID" ([authority-model §2.4/§2.5.3](./authority-model.md); [aa-inversion §6.2.2](./aa-inversion.md)) — killed by D-3.
2. "Ordered evidence is upgradeable via promotion; promotion is already designed, no new machinery" as unqualified ([authority-model §1.3/§1.4](./authority-model.md)) — killed by D-1; replaced by check-at-promotion + `EVIDENCE-ORDERED@N` dating value.
3. "Censorship is pure liveness, never integrity-adjacent" ([authority-model §1.7/§5.5](./authority-model.md) framing) — killed by D-2; the theft window is adversary-bounded by inclusion latency.
4. The censorship scenario as an argument for the pointer **as designed** ([authority-model §5.5](./authority-model.md) → A5b) — killed by D-4.
5. Universal cross-realm incomparability ("no verifiable mutual embedding," W1's unqualified row) — killed for shared-settlement pairs by D-5.
6. "The residual core R1–R6 is topology-invariant; the recut can proceed without the topology decision" as stated ([aa-inversion §4.4](./aa-inversion.md)) — killed by D-6 for R1's home field.
7. "Pre-rotation exists nowhere in the account layer / cannot exist" as the reason for inversion row 3 — killed by F-13; the verdict stands on portability + 7702-root grounds.
8. "Promotion preserves identity byte-for-byte" unqualified ([local-mode §0/§7.2](./local-mode.md)) — killed for the fresh-digest path by D-11; survives via in-place upgrade only.
9. "Two conflicting signed heads at one counter are permanent proof of misbehavior" unconditioned ([local-mode §2.1](./local-mode.md)) — killed by D-13; conditional on the durable-counter discipline.
10. "The manifest buys authenticated seeking even on a dumb HTTPS mirror" for the *position* dimension ([large-files §4.2](./large-files.md) corollary) — killed by D-14 pending offset-committing leaves.
11. "The store-creation interface delta is small" without the griefing analysis ([large-files §1.4](./large-files.md)) — killed by D-15.
12. "lookup: defined" and seam-6 "CLOSED" unqualified ([filesystem-core §5.1/§8](./filesystem-core.md)) — killed; profile-qualified and half-closed respectively until the repair set lands.
13. Checkpoint-grounded `PROVEN-ABSENT`; the global same-`(principal, order)` equivocation rule; MUST-pull-home via the `home` row ([[read-lens-spec]]) — superseded by the FS profile.
14. `preferredTier` as a manifest field — dropped ([large-files ledger 13](./large-files.md)).
15. kel.md §23 decisions 1–2 as worded; §4.5 HomeRegistry+migration as v2 baseline; §18 fork 8 — superseded/demoted (shelf, activated only by P-5b arms).
16. The N1A bundle as one answerable code — superseded by AX-1..AX-6 / P-1..P-6.
17. EFS-native session UX and threshold-ceremony engines — out of scope by the inversion (consume, don't build).
18. Any wording letting DA-tier or mirror bytes read as "on-chain" — the §2.5 kill-list, enforced by P-20.
19. "Two grades" rendered as two labels anywhere user- or owner-facing — the F-15 rule.
20. 7913 "has no notion of identity" — re-worded: no *stable identity across rotation*, no time, no history.

---

## 8. Source-precedence audit

Checked the surviving set (post-repair) against the precedence chain (adopted rulings → ratified requirements → constitution → specs → process → history):

1. **No adopted ruling is contradicted.** Specifically re-checked: the collision-bit settlement (untouched in all eight files; `SAME_SLOT_COLLISION` is a distinct, E2-gated object); mandatory indexing (boundary clarified using the ruling's own client-escape-hatch text, not weakened); chains-don't-die (scope-sharpened along lines the 2026-07-23 note itself opened; no chain-death machinery reintroduced anywhere — verified per lane); full-body spine/no-elision (consumed, never diluted); `act`-provenance; the mount requirement (strengthened); public-by-default; storage direction; recovery baseline.
2. **No settled/superseded inbox item is revived.** Checked the [[owner-decision-inbox]] superseded list item-by-item: per-principal-home text quoted only as demoted; identity.md reserve-until-2030 untouched; the exact-slot collision summary not revived; EAS/chain-death absent; the dual public/private posture absent.
3. **One disclosed borderline:** FS-LENS/1 and the local-mode design are *written against* held recommendations (D-9A, Q3A, Q4A, Q5A). Each lane disclosed this as evidence-for rather than adoption, which the hold permits; the packet presents D-9/Q3/Q4/Q5 with the new evidence attached, still held. If James answers any of them differently, [filesystem-core §1.3](./filesystem-core.md) and [local-mode §2](./local-mode.md) rework — the coupling is now on record.
4. **The sequencing hold is honored and made liftable, not bypassed** (§4.0): no lane batch-asked N/Q items; all new James items are new axes or amendments to lane-tabled items; the AX decomposition + independence audit is precisely the revalidation the hold required before N1 could be re-presented.
5. **Unchecked-checkbox discipline:** no lane treated a source checkbox as a live decision; the two red teams both cited the correction banner where kel.md's internal "v1 ruling" language appears ([[kel#4.5 Home topology: canonical locator plus co-located authority]]) — that text remains historical baseline under its banner.

---

## Confidence

**VERIFIED (this critic, direct reads this pass):** every corpus file in full; [[owner-rulings]], [[owner-decision-inbox]], [[assumptions-and-requirements]], [[human-overview]], [[ethereum-first-efs-and-os]], [[README]] in full; [[kel]] §§0–7 at line level plus §23–24 and the §4.3/§4.4/§4.5 constructions this consolidation's D-3/D-6/D-11 dispositions turn on. All fifteen SERIOUS findings re-derived against the quoted primary text; the D-11 partial overrule rests on [[kel#4.3 In-place EOA upgrade]]'s explicit "preserves the address-shaped identity word," which neither the local-mode lane nor the red team cited.

**PLAUSIBLE (this critic's judgment; falsifiable by the synthesis or the recut):** the adjudicated repairs chosen where a finding offered alternatives (D-1 repair-a as design center; D-8 both-repairs; D-10 authority-gated rule; D-12 fourth source; D-14 offset-leaf adoption); the packet's classing and ordering (P-1..P-23, the E-TRACK/DELEGATED routing); the seam-disposition table's advanced/closed judgments; the claim that the untested-MUST list (§6) is complete; the merge of J-FS1/J-FS2/JF-A into P-16.

**Could not verify:** whether mandatory indexing is same-transaction atomic (the one-basis invariant's stated precondition — kernel recut must confirm; flagged by [attack-fs §3](./attack-fs.md)); how much of `ActionContextV1` is author-signed (the offline-constructibility gate exists because this is ambiguous — [local-mode §1.3](./local-mode.md)); the EIP-8130/Base schedule (rests on the in-corpus 2026-07-19 review); any gas/latency/fan-out number (none exists in the corpus; none was invented here — E1/E2 remain the gates per [[owner-rulings#2026-07-23]]); whether a bounded-gas retro-basis promotion check (D-1 repair b) is designable at all; hint-convention availability over decades (D-3's residual, named in P-5's trail).
