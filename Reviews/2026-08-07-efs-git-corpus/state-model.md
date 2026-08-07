# EFS Git — repository, ref, and authority state model

**Status:** deep-dive candidate model, 2026-08-07. This is the exact state model the recommended architecture (candidate B) uses. It adds **zero kernel kinds and zero admission behavior**; everything below is ordinary records + one typed read profile + gateway software. Freeze pressure is enumerated in [freeze-impact](./freeze-impact.md).

#kind/review #status/done #repo/planning #topic/efsv2 #topic/git

## 1. The four identity layers (never conflate)

| Layer | Identity | Mutable? | Who owns it |
|---|---|---|---|
| Repository | `repoId` — owner+salt-derived EFS DATA identity minted at genesis | never | the founding principal's KEL |
| Git object | `(algorithm, oid)` — native Git OID, SHA-1 or SHA-256 | never | Git's content addressing |
| Container | `containerDigest` — sha256 of an archived pack/bundle's exact bytes | never (a container is immutable once archived; new containers supersede) | placement layer |
| Serving location | gateway URL, contract address, `goe://`, `web3://` | freely | nobody — locations are discovery |

GoE's defect was collapsing 1 into 4 (contract address as identity) and 3 into 2 (ending-commit OID as mutable pack key). The layers are already distinct in the EFS record model; the profile just names them.

## 2. Repository descriptor

The genesis descriptor (canonical CBOR bytes per the client-side encoding rules):

```text
GitRepoGenesisV1 = {
  profileVersion,
  objectFormat,            // sha1 | sha256 — pinned forever (experiment E7: no interop)
  founderPrincipal,        // full bytes32
  initialPolicyRef,        // the first GIT-REF/1 plan (see §5)
  authorityHome,           // pinned fold venue: (realm/venue, authority-lane class) — the ONE ordering
                           //   domain whose admission ordinals move heads at the strongest rung (see §4)
  initialDefaultRefName,   // initial value only — the live default/HEAD selection is a GitRefPlanV1 field,
                           //   epoch-versioned and fold-derived, so renaming the default branch is a policy act
  workspaceClass,          // repo | wiki | skills — advisory product hint, not kernel semantics
}

repoId = the founder's DATA identity with salt = keccak256(canonical GitRepoGenesisV1 bytes)
```

**How the descriptor binds (kernel-accurate).** A v2 DATA body is pure identity — `bytes32 salt`, committing to attester+salt and *never* to content — so the genesis struct cannot live "in" the DATA record. The profile therefore uses the salt convention above (the identity thereby *commits to* the genesis bytes without the kernel ever reading them — anyone re-derives `salt == keccak(genesis)`), and the descriptor bytes travel like any file content: bound via the standard reserved rows (`contentHash` → canonical genesis bytes; `mirrors` → placements) and carried in every checkpoint container's sidecar. The fold pins genesis fields **at first sight**: the first admitted genesis binding at the fold venue is the one the profile honors; later re-bindings of the root DATA's content rows are flagged, never honored — so `objectFormat`/`authorityHome`/founder are immutable in effect even though reserved-row claims are formally supersedable.

Mutable repository state is ordinary claims keyed off `repoId` via shared key-anchor TAGDEFs. One kernel fact shapes everything below: **v2 slots are author-scoped** (`slotId` derives over the attester), so "the policy slot" and "a ref's slot" are *per-author* slots under a shared key — cross-author state is always a profile-derived read over the mandatory cross-author indexes, never one kernel cell. `getSlot` never answers "current canonical head"; generic surfaces (mount, index views) must render ref claims as opaque `GIT-REF/1` profile data, not naive per-slot winners.

- `policy` claims (cardinality-1 per author): current `GitRefPlanV1` reference + monotone `policyEpoch`. Fold applicability rule, not a write gate: a policy claim applies only when its admission receipt shows a designated policy-admin grant class (the founder's direct-authority ROOT grant, or a grant the current plan names for policy administration) — routine pusher grants never qualify. This is the "protected branch settings" analogue and the rollback floor.
- `describe` slot: name, description, topics — pure discovery, never authority.
- `mirrors` reserved key (existing dual-role row): primary + additional container/gateway placements.
- `checkpoint` claims: periodic full-bundle references (see [storage-closure-recovery](./storage-closure-recovery.md)).

**Renames, carrier moves, gateway moves change none of the above identities.** Authority rotation/recovery is KEL machinery operating on the founder principal (or an org principal) — `repoId` never moves. This discharges the "durable identity when name/authority/gateway/contract/chain/carrier change" question by construction: everything mutable hangs off an immutable id owned by a rotatable principal.

**Ownership transfer and home migration (the two hard cases, stated rather than assumed):**

- *Ownership transfer.* The founder principal is part of the identity derivation and never changes. Effective control transfers the way v2 already transfers control: for org-owned repos, KEL control succession on the org principal (the P-6c shape) — nothing repo-specific; for personally-founded repos, a **policy handover** — the current policy epoch installs a successor policy-admin authority (a new principal or org), after which the founder's remaining role is historical. A clean-break sale/spinoff is the labeled successor operation: new genesis (new `repoId`) + `supersededBy`/`movedTo` rows from the old descriptor — continuity is claimed, never silently inherited (consistent with personal principals being non-transferable).
- *Home migration.* v1 makes **no re-home promise** — deliberately the same arm as the identity layer's P-5(a). The designed-but-not-promised convention for voluntary moves: a **sealed-successor migration** — at the old home, a final policy-admin-authorized `SEAL(newAuthorityHome, cutoverHead)` transaction; the fold treats the old home as read-only at the seal, and consumers continue at the new home whose fold starts from the sealed head (its genesis-successor descriptor names the seal). One-shot, no dual-admission window, both homes' histories preserved. A *hostile* old home (censoring the SEAL itself) is the same unsolved case P-5 discloses for identity homes — the answer is the same: evidence elsewhere + a labeled successor repo, not a protocol promise. Roster members homed elsewhere remain what §4 makes them: evidence/proposal contributors bridged by co-homed acceptance.

## 3. What is canonical where (the H-3 ruling, sharpened)

| State | Canonical home | Explicitly NOT canonical |
|---|---|---|
| File contents + per-file version history | **Git object graph** (commits/trees/blobs) | EFS does not mint per-commit version records |
| Ref *current values* | derived — the `GIT-REF/1` fold over admitted ref claims (§4); **CAS-canonical from chain state alone; ancestry-verified only by object-bearing readers** | any gateway's bare repo (a cache); any single claim; any naive per-slot reading |
| Ref *history*, incl. displaced/force-pushed states | **EFS ref-claim history** (per-author claim chains + the spine, merged by the profile in admission order) | Git reflogs (E6: unreachable objects die at GC; reflogs are private, non-replicated) |
| Authorship of a commit | Git's self-asserted author/committer fields, honestly labeled | never presented as EFS-verified identity |
| Who *published/accepted* a state | **EFS ref claims + proposal/acceptance claims** (KEL actors, admission receipts) | commit metadata |
| Page identity across renames | **EFS sidecar**: DATA identity + `movedTo` (E11: Git has no rename facts) | Git similarity heuristics |
| Byte availability | placement receipts + mirror claims + container digests | "it's content-addressed" (addressing ≠ retention) |

The two histories do not compete: Git records *what the files were*; EFS records *what the repository's advertised state was and who moved it*. Git cannot durably do the latter (E6); EFS should not redo the former.

## 4. Ref transactions — CAS under admission confluence

### The problem

Kernel admission is confluent (C-1): admission cannot reject a claim because a slot currently holds a different value. So Git's compare-and-swap ("reject if `main` ≠ expectedOld") **cannot be an admission rule** — and must not become one (that would be Git-specific, state-dependent kernel behavior, doubly prohibited).

### The shape that works

A ref transaction is one envelope containing one claim per ref. Each claim is an ordinary cardinality-1 claim **in its author's own slot** under the shared `(repoId, refName)` key-anchor; the fold's input is the roster-scoped *union* of these per-author claims, enumerated through the mandatory cross-author indexes (A-3; codex-kernel amendment 9) — never one kernel cell:

```text
GitRefClaimV1 = {
  algorithm,
  newOid,                  // 0 = delete
  newOidEfsDigest,         // sha256 of the exact bytes of the object newOid names (commit OR tag/blob/tree),
                           //   plus peeledTarget for annotated tags — head binding only; the interior graph
                           //   below it remains SHA-1 in sha1 repos (detection-only via SHA-1DC)
  expectedOldOid,          // CAS value witness — what the signer believed the ref was
  expectedPriorClaimId,    // CAS *predecessor* witness — the claimId of the currently applied transaction
                           //   for this ref (0 for create). The Radicle lesson applied: bind to the
                           //   predecessor, not just the value, or ABA histories replay
  policyEpoch,             // the repo policy epoch the signer acted under
  intent,                  // ADVANCE | FORCE | DELETE | RESTORE
  txnRoot, refCount,       // transaction commitment: all sibling ref claims of this publish share txnRoot
                           //   and declare the sibling count — a relayer admitting a proper subset yields a
                           //   visibly TRUNCATED-TXN group, never a partially applied transaction
  closureCommitment,       // hash of the ClosureManifest for the closure delta (§ storage doc)
  containerRefs[],         // digests of the placed containers covering that closure
}
```

- **Atomicity:** all claims of one publish share `txnRoot`/`refCount` and normally ride one envelope (single-transaction full-envelope submission is atomic by the existing single-revert rule). Because `submitSubset`/resume — or a hostile relayer carrying only the leaves it prefers — can admit a proper subset, **transaction completeness is an applicability precondition**: the fold evaluates a transaction only at the ordinal where all `refCount` siblings sharing its `txnRoot` are admitted. An incomplete group is a named `TRUNCATED-TXN` evidence state — pending if the remainder can still arrive, permanently visible either way, never partially applied. The partial multi-ref states observed in GoE and stock non-atomic push (E4) cannot occur at any conforming reader, including against a partisan relayer.
- **Ordering — one pinned venue:** admission ordinals exist per authority home, and homes are per-principal, so a roster spanning homes has no shared order. The profile therefore pins the fold's ordering domain: `GitRepoGenesisV1.authorityHome` names the ONE venue/lane whose admission ordinals move heads at the strongest rung. Roster participation at head-moving tiers implies co-residency there (the P-4 co-residency rule applied to repositories); claims admitted elsewhere are evidence/proposals, never head-moving. Wall time and author `order` sequence nothing.
- **CAS as a deterministic read rule, not an admission rule:** the fold processes the pinned venue's ref claims in admission order. A transaction **applies** iff every sibling is admitted (txn completeness), and for every ref claim: `expectedOldOid` equals the currently derived value, `expectedPriorClaimId` equals the claimId of the currently applied transaction for that ref, the `intent` is permitted by the policy at its `policyEpoch`, and that epoch is current at its ordinal. **One-shot rule:** a claim identity applies at most once, at its first evaluation; any later re-appearance derives inapplicable-duplicate. Failing transactions are **recorded-but-inapplicable**: permanently visible evidence, never silently discarded, never applied. Two racing maintainers produce one applied and one visibly conflicted transaction — the same answer for every fold-running reader, with no gateway in the *verification* path. (Two disclosed limits: the sequencer/submission path can influence *which* of two racing valid transactions wins — admission order is tamper-evident, not neutral, per the fs-pass consistency statement — and the fold is pure over chain state, so byte *availability* is never a fold input; availability grading is a separate, explicitly non-deterministic serving/client annotation.)
- **Replay, split into its three real cases:** (a) *re-carriage of an already-admitted claim* — the kernel's first-authoritative-admission rule binds a claim to one immutable primary ordinal; re-submission creates at most supplemental receipts, which the fold ignores (primary admissions only). Nothing new derives. (b) *Late first admission of a stale signed envelope* (the leaked-outbox case): fresh ordinal, but `expectedPriorClaimId`/`expectedOldOid` no longer match → recorded-but-inapplicable. (c) *ABA histories* (delete→recreate, force A→B→A, tag moves) — defeated by the predecessor witness (which every intent, FORCE included, must satisfy) plus the one-shot rule; a recurring *value* never re-legitimizes an old claim, and a *newly signed* rollback by a currently-authorized actor is authorized behavior, not replay. This is the same predecessor-binding lesson Radicle learned in production, with a public total order instead of per-peer nonces as the arbiter.
- **Fast-forward honesty — what the fold can and cannot check:** ancestry ("`newOid` descends from `expectedOldOid`") lives in Git object bytes, which chain state does not contain. **Fold-level heads are therefore CAS-canonical, not ancestry-verified.** Enforcement is layered: gateways refuse non-fast-forward `ADVANCE` at intake (`receive.denyNonFastForwards`-class checks with objects in hand) on the fast path; every object-bearing verifier (G2+ clients, gateways, auditors) deterministically re-checks descent once the closure is fetched and flags a violating transaction `ANCESTRY-VIOLATION` — a disclosed, policy-consumable fact (default wiki Views fail closed on it; the flag is deterministic *given the objects*). A lying `ADVANCE` from an authorized actor can therefore land on-chain, but it cannot survive verification, its displacement evidence is durable (P-G5 retention keys on observed displacement), and roster ejection is the curation answer. `RESTORE` marks intent; verifiers confirm its fast-forward property the same way.
- **Force-push is force-with-lease, always:** `intent = FORCE` never relaxes the *witnesses* — `expectedOldOid` and `expectedPriorClaimId` must match the currently applied state exactly like ADVANCE (Git's own safer `--force-with-lease` shape; a delayed old signed FORCE can therefore never overwrite newer state). What FORCE changes is only what *verifiers and policy* demand: no descent expectation, and applicability requires the policy to grant that actor force authority on a ref declared forceable. Canonical wiki branches declare `restoreOnly`: routine rollback is `RESTORE` (a new revert commit), and the only escape is a **policy-epoch-gated recovery ceremony** — a policy change (quorum per plan) that re-classes the branch for one explicit recovery FORCE, disclosed by construction (H-10's "ceremony, never a routine op", which also keeps an unfetchable-head mistake from bricking a branch forever). The displaced closure stays placed under the retention rule (P-G5).
- **REVOKE:** revoking one's own ref claim never rewinds a derived head — applied transactions stand via the one-shot/predecessor chain (history is not rewritten, C-5); the revocation renders as a disclosed evidence event on the transaction. Revocation only *hides the claim in its author's own slot* for generic readers — one more reason generic surfaces must not naive-read ref slots.
- **Refname discipline:** the fold enforces `check-ref-format` grammar and a deterministic directory/file-conflict rule (the earlier-ordinal holder of `refs/heads/x` blocks later `refs/heads/x/y` and vice versa; losers derive inapplicable-conflict) so derived ref sets are always materializable by a real Git backend (E5's `update-ref --stdin` transaction is the reconciliation primitive and would otherwise abort).
- **Policy rollback resistance:** `policyEpoch` is monotone in the policy claims and ref claims bind the epoch they acted under; an old policy cannot be replayed to re-legitimize a superseded authority set (same shape as GATE's `policyVersion` floor, LP-6).
- **Reader cost and checkpoints:** deriving heads replays the repo's ref-claim history, which grows with publish count. The bounded-read answer is a **derived-head attestation convention**: any party may publish signed "fold state at ordinal N" claims (and gateways expose them as `refs/efs/attest`); they are verifiable hints — spot-checkable by replaying since the attested ordinal — never authority. Named as a Durable gap (G-9) in [primitive-fit-gap](./primitive-fit-gap.md); until it lands, full-fold reads are a chain-connected (G2+) operation and G1 guests consume heads as the endpoint's word, honestly labeled.

### Ref classes

The fold is uniform over ref names: branches (`refs/heads/*`), tags (`refs/tags/*` — annotated tag *objects* travel in the closure like any object; the claim carries the tag ref's target plus its peeled commit; tags are create-once by default and moving one is FORCE-class, since tags have no ancestry for ADVANCE to mean anything; closure recipes special-case non-commit tips), and proposal namespaces (`refs/efs/proposals/<principal>/*`, owner-scoped by construction). `HEAD` is not a claim: the served symbolic HEAD derives from the current `GitRefPlanV1`'s default-ref field (genesis supplies only the initial value), so it is fold-derived and epoch-versioned; gateways materialize it as the bare repo's HEAD symref. Notes/replace refs are out of the v1 profile (rejected at intake, like GoE — but stated). Deletion is `newOid = 0` with the same CAS discipline.

### Degraded modes (honest rungs)

Without the authority lane (local mode, plain evidence lane, chain-free realms), there is no admission ordinal. The fold then runs over venue-local order (provider-attested or witnessed rungs, P-13/P-14) or, at the floor, per-author LWW with visible conflicts. Every derived head carries its rung label (C-10). Nothing pretends: a chain-authoritative canonical head requires the authority lane; a local workspace still works and says what it is.

### What this dissolves

The kickoff's admission-confluence question — "can the generic record model express a replay-resistant, policy-epoch-bound, atomic CAS ref transaction without Git-specific kernel behavior?" — **yes, with its limits named**: transaction commitments + predecessor witnesses in ordinary claim bodies, admission ordinals at one pinned home (existing, P-1), and a typed read profile (the lens machinery's exact job, LP-1). The kernel learns nothing about Git. Honesty notes: the fold delivers CAS-canonical heads — ancestry, like availability, is verified by object-bearing readers above it; and the profile is **GATE/1-scale, not trivial** — an order-dependent transactional state machine (txn grouping, four intents, glob policy matching, THRESHOLD quorum, epoch windows, degraded rungs), which is exactly why the two-implementation vector suite is its non-negotiable gate. The one genuine dependency: **P-1 must be adopted** for the strongest grade; this workload joins packages/orgs/votes as a forcing use-case for it.

Field evidence that the external total order is the right arbiter ([prior-art/radicle](./prior-art/radicle.md) §3): Radicle shipped ~18 months with a signed-refs snapshot lacking predecessor binding; the replay attack this enabled cost three emergency releases, a permanent feature-level compatibility tax, an opt-in-by-default fix, and the silent dropping of *legitimate* rollback pushes. Its own stated future direction is push certificates + transparency-log shapes — the pattern EFS gets natively. Radicle's canonical-ref quorum also **stalls silently on delegate divergence**; the fold instead applies the earlier ordinal and marks the loser visibly, which is the right answer for a wiki. NIP-34's `latest created_at wins` is the same problem from the other side — self-asserted timestamps are forgeable ordering ([prior-art/nostr-and-p2p-git](./prior-art/nostr-and-p2p-git.md) §7).

## 5. Authority mapping — Git roles onto KEL

| Git-world credential | EFS mapping | Notes |
|---|---|---|
| Repo owner | founder/org principal's KEL control | rotation/recovery = KEL machinery; `repoId` unaffected |
| Maintainer | principal in the repo's `GitRefPlanV1` roster at tier `MAINTAIN` | roster entries are principals, never raw keys (lens spec §0.3) |
| Pusher / write access | roster tier `ADVANCE` on a ref pattern | scoped: which refs, force or not |
| CI credential | short-lived session grant (kel §7): generic closed actions scoped by `kindSet`/`definitionSet` (the `efs.git/*` key-anchors) + `resourceScopes={repoId}`, fixed expiry, byte/use caps | the kel session-actor shape with *generic* vocabulary — no Git-named KEL action is introduced; lives in CI secrets; leaks are time-boxed |
| SSH key (developer machine) | either (a) gateway-local authentication mapped to the user's pending-signature outbox (P-G8), or (b) the SSH key registered as an actor key if its suite exists | (b) needs an ed25519 actor suite — currently absent from the KEL suite set; flagged as a KEL rider, not assumed |
| Commit signature (gpg/ssh/gitsign) | untouched, optional, displayed as Git-native evidence | never conflated with EFS authorization |
| GitHub-style "verified" badge | EFS renders *publisher* verification (ref claim signer) and *proposer* verification (proposal signer); commit-author claims stay self-asserted | the UI split the kickoff demands |
| Branch protection rules | the `GitRefPlanV1` policy: per-ref-pattern tier requirements, force/restore flags, optional quorum (`THRESHOLD` combiner over a closed roster, per adopted item F) | policy is owner-pinned (C-8); a pusher cannot loosen it |

Signing seats: **authorship** (commit) = Git-native, self-asserted. **Proposal** = proposer's actor signature over a proposal claim. **Acceptance/merge** = maintainer actor signature over the applying ref transaction (+ optional `mergeOf` provenance claim). **Publication** = the ref transaction itself. **Org attribution** = `act` provenance row (A-6). One actor signature per envelope throughout (C-4); no ERC-1271, no gateway signing as users (P-G8).

Three bridges the signing lane surfaced ([prior-art/git-signing-and-identity](./prior-art/git-signing-and-identity.md)):

- **`GitRefClaimV1` is a push certificate done right.** Git's own `push --signed` certificate signs exactly `(destination, refName, old, new)` with a server nonce — the correct unit — but almost nobody consumes it; the chain replaces both the nonce channel and kernel.org's hand-built transparency log.
- **allowed_signers as a compiled lens artifact.** The SDK can deterministically compile "KEL state as of basis B" into a stock `allowed_signers` file (+ KRL revocation file): principal string, per-key `valid-after`/`valid-before` from KEL events, `namespaces=git`. Any stock Git ≥ 2.34 then verifies commit signatures offline against KEL-derived truth — zero new client code for technical users. Caveat carried from the lane: Git feeds the *committer date* (attacker-controlled) to the validity check, so display-time verification is advisory; authorization truth stays admission-time (exactly R-K3's argument, independently rediscovered by Git's own design gap).
- **Ethereum keys stay off-band.** OpenSSH has no secp256k1; no maintained wallet→git-signing bridge exists. Wallet/KEL involvement is the EFS record layer signing ref/release claims over commit digests — which is this design — never in-commit signatures.

Proposals additionally key on the cross-tool **`change-id` commit header** (Gerrit/Jujutsu/GitButler convergence) where present, so a proposal survives rebases without losing identity ([prior-art/forges-and-formats](./prior-art/forges-and-formats.md) §6).

## 6. Wiki-canonical branch profile

For `workspaceClass = wiki`, the recommended default plan: canonical branch `refs/heads/main` with `restoreOnly` (routine force never applicable; rollback = RESTORE revert commits; the only escape is the disclosed policy-epoch recovery ceremony above — H-10), `ADVANCE` for trusted editors, proposals from anyone via per-proposer namespaced refs (`refs/efs/proposals/<principal>/<n>` — proposer-owned slots, no permission needed, invisible to the canonical fold until accepted), acceptance by maintainer tier or quorum. Vandalism response = `RESTORE` (revert commit) + optional roster ejection; the vandal's proposal claims remain as evidence (revoke-hides under their own slots), the canonical history never rewrites. What durable storage means for *content* that must stop being served (doxxing, illegal material) is a serving-policy question, handled in [threat-and-economics](./threat-and-economics.md) §5 — validity and serving are separate planes (the moderation split the neutrality brief demands).

## 7. One wiki = one repository?

Recommended: **one wiki (or skills collection) = one repository = one opted-in folder**, sharded only when scale demands (namespace shards as sibling repos under one descriptor family). Grounds: browser-side Git and anonymous cold-start both degrade with repo size; per-page repos destroy atomic multi-page edits (trace T4 requires one commit touching several pages); per-wiki repos keep the atomic-edit unit, the policy unit, and the clone unit aligned. Cross-wiki links are ordinary EFS links (repoId+path), so sharding is invisible to readers.
