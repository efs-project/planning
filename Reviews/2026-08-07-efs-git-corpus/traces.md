# EFS Git — grounding traces

**Status:** deep-dive traces, 2026-08-07. The fifteen required state-transition walkthroughs, run against the candidate-B model ([state-model](./state-model.md), [storage-closure-recovery](./storage-closure-recovery.md), [wiki-and-collab](./wiki-and-collab.md)). Notation: `J` = journal (local, Tier B/C), `A` = authority-lane admission with ordinal, `fold` = `GIT-REF/1` derivation. Experiment references (E1–E11) are in [prior-art/local-git-experiments](./prior-art/local-git-experiments.md).

#kind/review #status/done #repo/planning #topic/git

## T1 — Trusted maintainer edits and publishes one page

1. Alice (roster `ADVANCE`) opens `Garden.md`; edits autosave to `J` (draft chip).
2. "Publish" → local commit `c₁` (edit summary = message) → `rev-list head..c₁` = {commit, tree, blob} (E10) → increment container built, digest `d₁`, placed on configured carriers; one independent retrieval verified.
3. One envelope: `GitRefClaimV1(refs/heads/main, expectedOld=h₀, new=c₁, ADVANCE, closure→d₁)` → `A` ordinal 4102, receipt stored.
4. `fold`: expectedOld matches, epoch current, tier sufficient → applies. Gateways reconcile bare repos via `update-ref --stdin` CAS (E5).
5. Alice's chip walks the ladder to "Published · confirmed"; guests see the new revision at G1 with verifiable claim+container evidence.

## T2 — A reader without an account proposes a correction (pseudonymous and permanent — not anonymous)

1. Reader has no account: reading needs none (G1). To *propose*, they need a principal — bare-EOA zero state suffices (kel §4.1); the guest→account ceremony is chrome-owned, never started from page content (LP-8), and carries the confidential-never-anonymous + permanence copy (threat doc §4b).
2. Client materializes sparse working set for the page → local commit `p₁` under their own namespace ref `refs/efs/proposals/<bob>/1` → closure placed → envelope: proposal ref claim + `ProposalV1` → `A`. **Funding is the named open problem** (threat doc §4): self-paid bounds spam but is drive-by-fatal friction; sponsored restores onboarding but needs sponsor-side ceilings/deposits — this trace runs either way, and acceptance test 20 must pin who pays.
3. Nothing touches the canonical branch; the wiki's proposal view lists it (lens-filtered).
4. Maintainer reviews diff, merges locally, publishes per T1 with `mergeOf → ProposalV1`; `ProposalStatusV1 = ACCEPTED`.
5. Bob's contribution is permanently attributable (his signature on `p₁`'s claims); the canonical commit records the Git-native authorship as merged.

## T3 — Two editors, same paragraph, concurrently

1. Alice and Carol both start from `h₀`, both edit paragraph 3 of `Policy.md`, both commit locally.
2. Alice publishes first (T1) → main = `c_A` at ordinal N.
3. Carol's publish: gateway fast path rejects CAS (expectedOld `h₀` ≠ `c_A`); client auto-rebases; same-paragraph → merge conflict (E9) → two-versions UI; Carol picks/combines → merge commit `c_M` → publish with expectedOld `c_A` → applies at ordinal N+k.
4. Suppose instead both envelopes hit `A` in the same window: fold applies the earlier ordinal (which of two valid racers wins is submission-path-influenceable — disclosed), records the later as inapplicable-conflict; Carol's client sees this deterministically, surfaces the **conflicted-publish** state (fees spent; her unmerged content permanently public under her identity — disclosed, wiki doc §3), and enters the same resolution flow. No state is lost; every fold-running reader derives the identical sequence.

## T4 — One atomic edit across several linked pages

1. Renaming a concept touches `Garden.md`, `Seeds.md`, `index.md`: one working-set edit session → **one commit** touching three files → one ref claim.
2. Atomicity is Git-native (one commit) + envelope-native (one claim); there is no window where readers see half the rename. (Contrast: per-page repos would need cross-repo coordination — a reason for state-model §7's one-wiki-one-repo ruling.)

## T5 — Page renamed while old hyperlinks keep working

1. `Herbs.md → Botanicals.md` via editor rename: commit moves the file; EFS sidecar writes `movedTo` on the page's DATA identity and PINs it at the new path.
2. Old moving links `(repoId, main, Herbs.md)` resolve: path miss → sidecar redirect → `Botanicals.md` with a "renamed" breadcrumb. Old exact citations `(repoId, c_old, Herbs.md)` resolve unchanged forever.
3. Git-only consumers (plain clone) see a normal rename; `--follow` heuristics still work (E11); the sidecar is additive, not required for Git validity.

## T6 — Offline browser, several commits, late sync

1. Airplane mode: three edit sessions → three local commits in OPFS; ladder shows "saved on this device only"; time-at-risk nudges apply (persistence D8).
2. Reconnect: one publish batches `rev-list h₀..c₃` into one container + one ref claim (expectedOld `h₀`).
3. If main moved meanwhile: T3's path (rebase; conflicts to two-versions UI). If not: applies directly. Nothing was ever silently public before "Publish".

## T7 — Malicious/stale ref update rejected without losing evidence (both replay cases)

1. **Case (a) — re-carriage of an admitted claim.** Attacker re-submits Alice's month-old, already-applied transaction (main: `h₃→h₄`). The kernel's first-authoritative-admission rule makes this a no-op: the claim keeps its one immutable primary ordinal; re-carriage yields at most a supplemental receipt, which the fold ignores (primary admissions only). Nothing new derives anywhere.
2. **Case (b) — late first admission of a stale signed envelope** (the leaked-outbox grenade): the envelope was signed at `h₃` but never admitted; the attacker submits it now. It admits (confluence — C-1) at a fresh ordinal; fold: `expectedPriorClaimId`/`expectedOldOid` no longer match the applied chain → **recorded-but-inapplicable**, permanently visible, attributed to this submission.
3. **Case (c) — ABA:** if main had *returned* to `h₃` (delete/recreate, recovery force), the value witness alone would pass — the predecessor witness and one-shot rule still refuse the old claim.
4. Canonical head unchanged for every fold-running reader in all three cases; the incident is auditable. Radicle's replay class is neutralized the way its own postmortem recommends — predecessor binding — with a public total order instead of per-peer nonces.

## T8 — Canonical page restored without rewriting history

1. Vandal with `ADVANCE` publishes junk `c_V` (it applies — authorization ≠ quality).
2. Maintainer: "Restore revision N" → revert commit `c_R` (content = revision N) → `RESTORE` transaction → applies (CAS/predecessor match); object-bearing verifiers confirm its fast-forward property once the closure is fetched (the fold itself checks CAS, not ancestry — state-model §4).
3. History: …`c_V`, `c_R`… — nothing rewritten (H-10); UI renders the span as reverted; roster ejection follows per policy (curation, C-7). Wikipedia semantics achieved with zero force-push. (A vandal's *lying ADVANCE* — non-descendant `newOid` — would land on-chain but be flagged `ANCESTRY-VIOLATION` by every verifier and fail closed in default wiki Views.)

## T9 — Force-push displaces history; auditor recovers it

1. On a *forceable* branch (`refs/heads/experiments`), owner publishes `FORCE` to `h_new`, orphaning `h_old..`.
2. Fold applies it (policy permits); the superseded claim chain remains state-walkable (kernel read ABI: `priorClaimId`); `h_old`'s closure containers remain placed under retention (P-G5).
3. Auditor: walk slot history → displaced OID `h_old` → its `closureCommitment` → containers by digest → restore the exact pre-force repository. Contrast stock Git, where GC destroys it (E6), and GoE, where getters hide it.

## T10 — Markdown repo with large media via LFS

1. Author drags a 200 MB video into the wiki: client writes an LFS pointer blob into Git, uploads the sha256 object to carriers, `lfsOids` lands in the closure manifest.
2. Clone without LFS support: pointers, honestly (stock). Clone with LFS: batch API at any gateway maps oid→placement (contentHash index) → bytes verified against oid.
3. The repo stays text-sized; media durability is ordinary placement policy.

## T11 — Repository authority rotates/recovers; identity unchanged

1. Founder's phone stolen: KEL revocation of the actor; `authEpoch` bump; policy slot untouched. `repoId`, refs, history, links: all unchanged.
2. Full control recovery (kel §10) likewise never touches the repo namespace. Org handover = control succession on the org principal (P-6c shape).
3. The one Git-visible effect: future ref claims sign under new actors; the fold's authority checks follow the KEL automatically. No forge surveyed can do this without operator intervention.

## T12 — Exact citation vs moving link, opened anonymously

1. `efs://…/repo/<repoId>/blob/<commit>/Botanicals.md` (citation): guest client fetches the container slice via any gateway, verifies commit→tree→blob hashes locally (G1), renders with "exact revision" chrome. Rename-immune, gateway-immune.
2. `efs://…/repo/<repoId>/main/Botanicals.md` (moving): resolver runs the fold on the guest's default (owner-ambient) policy → current head → same verification; banner shows resolution basis (venue, ordinal). The two forms render visually distinct (Path vs Citation, clientv2 #13).

## T13 — GitHub/Forgejo round-trip without loss

1. Import: `git clone --mirror` from GitHub → genesis minted (algorithm from repo) → initial ref claims for all branches/tags at ordinal 1 → checkpoint container placed. Byte-exact objects; OIDs unchanged (E1-class property).
2. Work happens on EFS (T1–T9).
3. Export: `git push --mirror` to Forgejo, or hand over the checkpoint bundle — a complete ordinary repository, no EFS metadata needed (H-8). EFS-side provenance (proposals, ref history) exports in the sidecar; GitHub-side metadata (issues/PRs) was never claimed — the *Git* round-trip is lossless, and the honest boundary is stated.

## T14 — Every EFS-operated service removed; independent rebuild

1. Assume gone: all EFS gateways, indexes, databases, the org itself. Surviving: chain state, public specs, ≥1 carrier per container.
2. Operator: read genesis/policy/ref claims from state (full-body spine, no logs) → run fold → CAS-canonical heads → fetch containers by digest from any surviving placement → `index-pack` + connectivity + ancestry re-verification (completing the object-bearing half of head verification) → bare repos → serve smart-HTTP v2 + LFS + web views under their own domain.
3. Writers continue: their actor keys still authorize; new claims admit at the same authority home. Nothing about the repo referenced any dead service (P-G7). This is the validation-program Phase-E drill specialized to Git, and it must be *run*, not asserted — prototype milestone 4.

## T15 — Skill update changes capabilities; user sees the diff before install

1. Publisher releases skill v1.4: `SkillReleaseV1` binds (repoId, tag, commit OID + dual digest, capabilityManifestHash₄, `previousReleaseClaimId` → v1.3, `publisherContinuity`: same-principal / rotated-key / new-principal — the Great Suspender/xz ownership-transfer class made first-class).
2. User's install ledger (clientv2 #6) resolves the update through the skill's GATE plan: closed publisher roster, policy epoch, freshness floors.
3. Ledger diffs manifest₃→manifest₄ ("+ network: api.example.com" etc.) **and the pinned source trees byte-for-byte** — skills are source-only, so a full human-readable diff is feasible and is the actual defense (ClawHavoc's malicious skills were prompt-injection + scripts that no self-declared manifest would confess; a manifest diff alone compares two self-declarations). Broadened capability or a publisher-continuity change ⇒ disable-until-approved, blocking prompt (CONF-P1). Install pins the exact commit closure; popularity influenced nothing (A-3).
