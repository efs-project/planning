# EFS v2 on-chain-completeness audit — RED TEAM: attacking the "off-chain is fine" rulings

**Auditor key:** attack-offchain
**Role:** Red team. Attack every Tier-3 defer the other six lanes called "legitimately deferrable." Attack the multi-tag-AND / unbounded-query line. Attack every durability-lane "spine-recoverable ⇒ Tier 2" grant for *feasible-and-bounded* reconstruction, not infinite-gas theory. Ensure NOTHING is silently Tier 3 without an explicit James sign-off row.
**Date:** 2026-07-10
**Read:** all six lane files (durability-spine, keep-demote-line, graph-queries, read-resolution-lens, identity-content, filesystem-ops) + corpus (native-kernel §4.2/4.3/§8; query-graph-boundary.md) + v1 code (EFSIndexer.sol, EFSRouter.sol).

---

## 0. The one move that unlocks every attack: DURABILITY ≠ QUERYABILITY

The three-tier model is a **queryability** taxonomy — "can a reader/contract get THE ANSWER with bounded resources and no trusted third party." The durability lane (D-1) relabels four demoted indices from "event-derived (T3)" to "**Tier-2 spine-recoverable**" on the grounds that a full-body-spine scan reconstructs them. **That relabel silently swaps the axis.** It proves the *bytes survive EIP-4444 pruning* (a durability property) and then claims the *query is Tier 2* (a queryability property). Those are different guarantees, and the second does not follow from the first.

The design authors say so in their own words. native-kernel corpus **line 251**:

> "the spine … is ordered-by-admission, carries **no per-target/per-author keying, and is never a read index**; reads that would need demoted indices answer from events or from a **state-walk replay, both labeled untrusted-discovery**."

"Never a read index" + "labeled untrusted-discovery" is the authors conceding that the replay path is **not a usable query path**. To answer "which records point at X" or "list author A's claims" via the spine you must download and scan `allClaims[]` — *every claim ever admitted to the venue*, for a 100-year global archive — and filter in local memory. That is O(total-chain-history), unbounded, and grows forever.

**The red-team ruling on the tier axis (applies to every "spine-recoverable ⇒ T2" grant in every lane):**

| Property | Full-body spine gives you | Does NOT give you |
|---|---|---|
| **Durability** (survives pruning) | ✅ YES — bytes are in state, not logs | — |
| **Bounded queryability** (bounded reader answers it) | ❌ NO — requires a keyed on-chain index (B3/P12/author-index) | a global full-history scan is not "reconstructs it locally" in any operational sense |

An index that is *only* reconstructable by unbounded global replay is **durability-safe but query-Tier-3.** "Run your own full-history scan" and "trust The Graph" differ in *trust* but are identical in *cost*: both mean a normal reader/contract cannot answer the query. James's mission bar — "must not depend on The Graph or any trusted off-chain indexer for core queries" — is about not forcing users to run/trust an indexer. A capability that forces every reader to *become* an indexer over 100 years of state fails that bar just as surely.

**Consequence:** the durability lane's D-1 relabel must be **split, not accepted as written.** Keep the anti-pruning half ("the bytes are not lost"). **Reject the query-tier half** ("therefore Tier 2"). For any BASIC query, spine-recoverability is *necessary* (else the fix is impossible) but *not sufficient* — the bounded keyed index (B3/P12/author-index) is the thing that makes it a real Tier-2 query. The keep-demote lane got this exactly right for `_allReferencing`/`_receivedAttestations` (its §0: "the only on-chain answer is 'replay the entire chain' — no bounded read … unbounded-replay does not satisfy it"). The durability lane then over-granted it to all four. **The keep-demote §0 formulation wins; the durability D-1 "all four are T2" formulation loses.** This is a genuine cross-lane contradiction and James must be shown both.

---

## 1. ATTACK — "authorship enumeration is analytics" is WRONG. It is `ls ~`, and it regressed. (FATAL)

Both keep-demote (§2, I11/I12) and graph-queries (§5) file **`_sentAttestations` — "list everything author A published"** as **ANALYTICS → legitimately Tier-3**. This is the single worst mis-classification in the audit set, and I attack it head-on.

**What the query actually is.** For a self-sovereign 100-year archive whose entire pitch is "your files are yours, on-chain, verify-don't-trust," *"enumerate everything I authored"* is not analytics — it is:
- **`ls ~`** — the root listing of your own filesystem.
- **account/client recovery** — you lost your laptop; you reconnect your key; the *first* thing any client must do is enumerate your claims to rebuild your namespace. If that requires The Graph, then **"recover your own data without a trusted party" is false.**
- **backup/export** — "give me all my records" is the archival read the 100-year mission most obviously owes.

Calling the root-listing of a user's own data "analytics" is the tell that the line was drawn on *gas*, not *is-it-core* — the exact failure the mission charter warns about.

**It is a REGRESSION, verified.** v1 served it on-chain, bounded, paginated, contract-answerable:
- `_sentAttestations[attester][schema]` decl `EFSIndexer.sol:194`, populated `:1123`, read `getOutgoingAttestations(attester, schema, start, length, reverseOrder, showRevoked)` `:774–783` — a **paginated slice** (`_sliceUIDsFiltered`), revoked-filtered. This is a bounded Tier-1/2 read in v1. v2 demotes it to the spine-scan (native-kernel:251 "never a read index") = **query-Tier-3 by §0**.

**The "it's unbounded" defense is false.** It is bounded *by one author's output* — exactly as `discover(tagId)` is bounded by one container and `discoverByTarget(X)` by one target. The auditors *fight for* container-scoped forward enumeration (P12/amendment-9) and target-scoped reverse enumeration (B3) as core, then wave off **author-scoped forward enumeration** as analytics. **All three are the identical one-word-postings shape** (`author(160) | spineIdx(64) | flags(32)`, query-graph-boundary §3.4/line 117). The asymmetry is unprincipled: per-author is *more* obviously core than per-container ("my files" beats "this folder's cross-author contents").

**It is cheap.** The spine already exists. An author-keyed index is either `authorClaims[author] => uint64[] spineIdx` or a per-claim `prevByAuthor` linked-list pointer — one amortized word per claim, same order of cost as the B3 postings the auditors already want reserved. The auditors didn't cost it because they filed it as analytics. `authorHead(author)` is kept (Read ABI, codex-kernel G5) but gives only the **tip** (highest seq), not the enumeration — it is a currency hint, explicitly "never enumeration."

**Ruling (red team):** authorship enumeration is **CORE (self-restore / `ls ~`), a v2 regression from v1 `_sentAttestations`, and freeze-sensitive now-or-never.** Either (a) ship a bounded author-keyed forward index `discover(author)` (same reservation class as B3/P12), or (b) James signs an **explicit, named** row: *"a user cannot enumerate their own authored claims on-chain without a trusted indexer; self-restore is an indexer-dependent operation."* That sentence, said out loud, is very hard to accept for a self-sovereign archive — which is the point. It must not pass by being silently filed under "analytics."

---

## 2. ATTACK — the multi-tag-AND line, as restated in the audit, CONCEDES QUERIES EFS CAN SERVE ITSELF (SERIOUS)

The graph-queries audit (§2.1) draws the AND line as: **bounded k≤3 AND over a *bounded container* (folder/list) = T2-core; intersection over an *unbounded global tag population* = T3, "The Graph's job."** The "must be a named container" framing is **more conservative than the substrate actually supports**, and if James reads the audit file's wording he will concede queries EFS can answer without an indexer.

**The corpus already drew the correct, sharper line** (query-graph-boundary §3.3, line 107, verified):

> "bounded k-tag AND is a view-contract convenience … whenever the **rarest** conjunct's postings fit a few pages … `k ≤ 4`, driving enumeration ≤ 4 pages (1,024 entries). … the tag count k barely matters (probes are cheap); **what matters is the rarest conjunct's postings size.**"

The join is **enumerate-rarest + hash-probe** (§3.2): iterate the *smaller* conjunct's postings once (the ONE permitted enumeration), and for every candidate do an O(1) TAG-slot point read `(author, definitionId, targetId)` against the other conjuncts — because **the slot table IS a native hash index** (§3.1: "the classic hash-join beats the merge-join whenever one side has a hash index — and EFS's hottest read path *is* that hash index").

**Therefore the honest predicate is SELECTIVITY, not container-membership.** `#photo AND #2026` over a user's *whole store* is Tier-2 client-serveable at one bounded enumeration + point reads **whenever at least one conjunct is selective** (its postings fit a few pages) — no container required, no indexer required. The graph-queries §2.1 "bounded container" restatement quietly throws all *tag-population* ANDs to The Graph, which:
1. Understates EFS by exactly the headline that embarrasses a graph database ("can't do `#photo AND #2026` without The Graph" — false when one tag is selective), and
2. Concedes to off-chain a query class the design's own machinery serves at Tier 2.

**What is *genuinely* Tier-3 (the correctly-narrowed concession):** unbounded-∩-unbounded (both conjuncts huge, result tiny — adversarial selectivity where even the rarest conjunct won't page-bound), **ranked/sorted-by-value**, **NOT/open-world negation** (query-graph-boundary §3.5 — non-monotone, needs PROVEN-ABSENT which enumeration never supplies), **OR-with-ranking**, **counts/aggregates**, **full-text**. These are legitimately off-chain and already have sign-off (fs-pass-synthesis).

**Ruling (red team):** the concession is **drawn in the wrong place in the audit file.** Redraw it to the corpus's selectivity predicate: *k-tag AND is Tier-2 client-computable (view-contract convenience) whenever the rarest conjunct is page-bounded, container or not; it degrades to Tier-3 only for unbounded-∩-unbounded / ranked / NOT / OR / count / full-text.* Contingent — as the auditors note — on P12 `discover(tagId)` shipping AND the O(1) `(author,definitionId,targetId)` membership slot staying kernel state. **Caveat that keeps the concession honest:** the AND result is always DISCOVERY-flagged and **never GATE-consumable** (query-graph-boundary §3.1/read-lens §7.2) — no contract may gate on an AND at any price. So this is a convenience-tier line for interactive/off-chain readers, not a composability line — which is *why* it's safe to serve the selective case at T2 without a contract-answerability obligation.

---

## 3. ATTACK — "which lists contain X" and "cited-by" are correctly called core, BUT default to Tier-3 by silence (SERIOUS, escalation)

graph-queries (items 5, 6) and keep-demote (G1, A1/G2) both recommend **REQUIRED** for reverse-list-membership and REDIRECT-cited-by. Good — nobody conceded these to off-chain. **But** both are *conditional*: they are Tier-2 **only if** (a) B3 `discoverByTarget` ships AND (b) LIST-membership TAGs and REDIRECT `targetId`s are *routed into* the postings. The **cheapest freeze outcome — do nothing / don't route — is Tier-3.**

This is not a disagreement with the auditors; it is an escalation of a risk they under-weight: **the default is the wrong answer.** "Which collections is this file in" and "what supersedes this document" are textbook graph-database reads. AliasResolver v1 wrote **zero** reverse state (AliasResolver.sol:38, verified by keep-demote A1) — so REDIRECT cited-by is a **new immutable write path** that must be added at freeze or never. If the routing decision is deferred or lost in the gas bundle, EFS ships unable to answer "what points here" for its own version-chains and lists, and the failure is *silent* (no error — the query just isn't on-chain-answerable). Must be an **affirmative** signed "route these in," not a default.

---

## 4. ATTACK — the CONTINGENCY CASCADE: the cheapest resolution of EVERY open freeze item is a Tier-3 EFS (FATAL, the headline the red team adds)

No single lane sums this, so nobody sees it. Tabulating every "pending James / NEEDS-JAMES / CONFIRM" item across all six lanes, **against the capability it floors and the outcome if the item is refused (the do-nothing / gas-cheapest path):**

| Open freeze item | Floors (core capability) | Outcome if refused (= cheapest default) | Lane |
|---|---|---|---|
| **Full-body spine** (vs objects-only) | the ENTIRE claim/edge/revocation layer — every PIN/TAG/MIRROR/LIST_ENTRY/REDIRECT/REVOKE | **T3** — objects-only demotes all claims to envelope-archive (event-only). Forward *and* reverse graph gone. | durability D-3 |
| **B3 `discoverByTarget`** | backlinks, which-lists (§3), cited-by (§3), hardlink-reverse, DATA-placement-reverse, persona-reverse, keyWrap-set, who-mirrored | **T3** — reverse graph is spine-scan-only (§0) | graph-queries, keep-demote, identity-content, filesystem-ops |
| **P12 / amendment-9 `discover(tagId)`** | cross-author **directory listing** (`ls` of a folder), the enumeration leg of multi-tag AND, comment/discovery lists | **T3** — read-lens §7.3 indexer-lane | filesystem-ops 2b, read-lens (7), graph-queries |
| **Author-keyed index** (my §1) | **`ls ~` / self-restore / backup** | **T3** — spine-scan-only | (missed by all lanes — filed as analytics) |
| **P7 checkpoint reserved-key** | on-chain currency / AS-OF freshness gating, snapshot/restore basis | non-functional — no state to read | read-lens (3), filesystem-ops 6 |
| **`admittedAt` exposure** | *trustworthy* on-chain checkpoint-age | gate on author-forgeable clock | read-lens F2 |
| **E10 CONFIRM** (tagParent/tagChildren survival) | containment, both directory-listing modes | 2b falls to T3 | filesystem-ops |
| **Duplicity read surface** (my §6) | EQUIVOCAL fail-closed gating | contracts can't detect equivocation | read-lens F1 |

**The pattern the red team names:** these are not independent "nice-to-haves." **Every one of them is a floor of the graph-database / self-sovereign-archive claim, and on every one, the do-nothing / gas-minimizing outcome is the Tier-3 outcome.** If the freeze ceremony resolves the open items by budget-default (the path of least resistance under gas pressure), EFS ships as a **Tier-3 graph database that needs The Graph for: backlinks, directory listing, list-membership, cited-by, self-restore, and currency gating** — i.e., for nearly everything a graph DB is *for*. Per James's ruling ("every off-chain deferral EXPLICIT + signed"), **each of these must be resolved by an affirmative signed decision in the T1/T2 direction; silence = Tier-3 = mission failure.** The gas snapshot (freeze-gates A2) must price all reverse/enumeration reservations as **ONE bundle** (keep-demote §5 says this too) precisely so James signs the *aggregate* T1/T2 commitment once, rather than letting each item quietly default to T3 under its own local cost objection.

---

## 5. ATTACK — every spine-contingent Tier-2 grant is DOUBLY unverified (SERIOUS)

Even granting my §0 split (spine ⇒ durability, not queryability), the durability *floor* itself is not yet real:

1. **Full-body spine is unratified** (native-kernel §4.2/§15.6, line 537: "James call"). The recommended full spine costs ~22–27k gas/record (~7–15% of admission). If James takes the **objects-only fallback** under gas pressure, the ENTIRE claim layer becomes event-only Tier-3 (durability D-3) — not just "not queryable" but *not durable*. This is the load-bearing decision and it defaults the wrong way under budget silence.
2. **Body-elision perf lever is deferred, not foreclosed** (native-kernel line 216, verified: "Deferred perf lever … per-kind body elision … do not take it at freeze"). keep-demote §0 correctly flags this: if elision is *ever* taken post-freeze, every demoted index becomes truly event-only and the archive silently loses authorship/schema/reverse enumeration forever. **"No body elision" must be an Etched invariant, not a deferred-perf footnote** — a deferred lever on immutable-adjacent state is a time-bomb.
3. **The fire drill has NEVER been run** (native-kernel §8, false-confidence register #1: "it has never actually been run in any prior phase … MUST run before Etch"). So "Tier-2 spine-recoverable" is, today, an **unverified claim**. And the drill as written (durability D-2) tests only *forward* reconstruction ("resolves `/path` to bytes") — it does **not** assert reverse/backlink/authorship reconstruction, which is the one property most at risk. **Extend the acceptance test to a reverse-query assertion** before Etch, or the durability grant is untested precisely where it's weakest.

**Ruling:** treat every "T2 spine-recoverable" grant as **provisional** pending (a) full-spine ratification, (b) "no elision" as an Etched invariant, (c) the fire drill passing *including a reverse-query assertion*. Until then it is a promise, not a tier.

---

## 6. ATTACK — EQUIVOCAL is a SOUNDNESS hole for contracts, not merely a missing query (FATAL if contracts gate)

read-lens F1 correctly finds EQUIVOCAL (two signed records at same `(author, seq)`, different digest) is not contract-answerable — "no `(author,seq)` uniqueness or duplicity state; only `SeqCollision` events + full-spine scan" (verified, query-graph-boundary line 87: "Duplicity (EQUIVOCAL) … cannot be computed from kernel state … by design"). I **amplify** this from "completeness gap" to **soundness gap**:

- read-lens RR3: a reader must **never serve EQUIVOCAL as LIVE.** A gating contract that *cannot detect* equivocation will serve an equivocated value **as LIVE** — so a malicious author who double-signs at one seq can present **one state to an on-chain gate and a different state to off-chain readers.** That is precisely the "contract gets fooled about liveness" failure verify-don't-trust exists to prevent. It is worse than "a query we can't answer": it is a query whose *wrong* answer is served confidently.
- The "T2 client" escape hatch is the same §0 non-answer: detecting duplicity client-side is a **full-spine scan grouped by `(author,seq)`** — unbounded, not a point read, **not contract-answerable.** So for the one party that most needs it (a gating contract), EQUIVOCAL is **effectively Tier-3.**

**Ruling:** this is a **hard James decision that must not stay an "open question"** (read-lens G5): either (a) expose a bounded on-chain duplicity/`(author,seq)`-collision read so contracts can fail-closed (freeze-sensitive kernel state), or (b) James **explicitly signs** that *on-chain gates may only consume closed-author-set point reads and MUST NOT gate on any author capable of equivocation, accepting that contracts cannot fail-closed on double-signing.* Option (b) is a real security posture and may be acceptable — but it must be *stated and signed*, because the default (ship with `SeqCollision` events only) silently lets contracts serve equivocated values as LIVE.

---

## 7. ATTACK — mirror best-of-N ranked selection: a REGRESSION on the web3:// serving path, and the state to fix it is ALREADY kept (SERIOUS)

identity-content #6 already rules this CORE-must-fix; I confirm and amplify because it is the **content-serving path itself** (the thing web3:// is *for*), and the concession is gratuitous:

- **v1: on-chain, contract-answerable.** `EFSRouter._getBestMirrorURI` (EFSRouter.sol:1065) enumerates the per-attester mirror index on-chain (`getReferencingBySchemaAndAttester`, paginated :1088), ranks by transport priority web3>ar>ipfs>magnet>https (:1106–1124), lens-scoped, revoked-filtered — inside the contract serving ERC-5219 `request()` (:199).
- **v2: read-lens-spec:261 routes it off-chain** — "Mirror set = PIN (primary) ∪ active TAGs under `mirrors`; **Consumers' fallback when the PIN slot is empty: enumerate TAGs (off-chain) or fail — never guess.**" Only the single primary PIN mirror stays a T1 point read; the ranked best-of-N pick across additional mirrors is demoted to off-chain enumeration.

**The aggravating fact:** the additional-mirror TAGs are **already in kept on-chain state** — `referencingByAuthor[dataId][author]` is on the KEEP list (native-kernel:248). So a redeployable view contract *could* rank PIN ∪ author-scoped mirror-TAGs on-chain at T2 today. The read-spec's "off-chain or fail" is **stricter than the state requires** — a pure spec regression, fixable with a view contract at **zero new Etched cost.** For a "no-infra universal web3:// serving" pitch, requiring an off-chain hop to pick the transport that actually fetches the bytes is a direct hit on the headline.

**Ruling:** **CORE-must-fix.** Either (a) restore an on-chain best-mirror view contract ranking PIN ∪ kept author-scoped mirror-TAGs (T1/T2, v1 parity, zero freeze cost), or (b) James explicitly signs "only the single primary-PIN mirror is contract-answerable; multi-transport fallback is client-only." Do not let it inherit T3 by silence.

---

## 8. ATTACK — the "optional VAL-target trim" is anonymized; it IS on-chain content-dedup (SERIOUS, de-anonymize the coupling)

identity-content #8 and graph-queries both treat **VAL-target backlinks** ("who interned this value" / "which DATA has contentHash H") as "the one optional trim" of B3 — a nameless niche. I attack the *framing*, not the tier.

**What the VAL-target trim actually is:** reverse-by-contentHash is a `discoverByTarget` where the target is the contentHash PROPERTY value. So the "niche VAL trim" **is the CAS / content-dedup reverse** — "do I already have this content, so I hardlink instead of re-upload." For a system whose doctrine is literally "content-address the verifiable," dedup-reverse is not obviously niche.

**Concession (fair):** v1 *already removed* it — `EFSFileView.getCanonicalData` returns `bytes32(0)` (ADR-0049 made dedup best-effort client-side, verified via identity-content #8). So this is a **defensible pre-existing v1 defer, NOT a v2 regression**, and I do not demand it be restored.

**But the coupling must be de-anonymized before James rules the trim.** "Trim the optional VAL-target postings" and "EFS has no on-chain content-dedup" are the **same decision.** James should trim it *knowing that sentence*, not as a nameless cost-saving. Surface it as: *"VAL-target backlinks are trimmed; consequently reverse-by-contentHash (CAS dedup) stays client-side over the property index, consistent with ADR-0049."* Signed, explicit, named — then it's fine.

---

## 9. Completeness sweep — is anything SILENTLY Tier-3 (no named sign-off row)?

The mission's hard rule: nothing T3 by silent inheritance. Auditing the legit-T3 set for a **named** sign-off row:

| Legit-T3 item | Has a named sign-off row? | Red-team verdict |
|---|---|---|
| Unbounded-∩-unbounded / ranked / NOT / OR / count / full-text AND | ✅ fs-pass-synthesis master row | OK — but narrow to selectivity predicate (§2), don't over-concede tag-population AND |
| Global schema enumeration `_schemaAttestations` (all claims of kind S) | ✅ keep-demote §4b | OK — genuinely unbounded/global; T3 legit *with* the no-elision Etched condition |
| Subtree accounting / quotas / N-comments / N-likes | ✅ fs-pass-synthesis; read-lens §7.1 | OK |
| Cross-chain / cross-venue global listing | ✅ filesystem-ops §"legit T3" | OK (venue-relative by construction) |
| keyWrap "which wrap is Bob's" / recipient-set membership | ✅ identity-content #5 (privacy oracle-avoidance) | OK — deliberate privacy feature; keep the explicit row |
| CAS / contentHash-reverse (VAL-target trim) | ⚠️ present but **anonymized** | **De-anonymize (§8)** — name it "no on-chain dedup" |
| **Authorship enumeration `_sentAttestations` (`ls ~` / self-restore)** | ❌ **buried under "analytics"** | **NOT legit — contest (§1).** If it stays T3, needs a *named, un-euphemized* row: "no on-chain self-restore" |
| **The conditional-T3 set** (backlinks, directory-listing, which-lists, cited-by, currency-gating) | ❌ default-T3 if freeze items refused | **Must be affirmatively signed T1/T2 (§3, §4); silence ≠ sign-off** |
| **EQUIVOCAL for contracts** | ⚠️ open question (read-lens G5), not a decision | **Force a decision (§6)** — expose duplicity read OR sign the closed-author-set restriction |

Two items are **silently T3** today (authorship-enum euphemized as analytics; the conditional set defaulting T3). Two are under-specified (CAS coupling anonymized; EQUIVOCAL left open). These are the mission-rule violations.

---

## 10. Bottom line (red team)

The other lanes did honest work and correctly caught the backlink regression, the B3/P12 reservations, and the durability spine's importance. But three "off-chain is fine" rulings **concede too much**, and the durability lane's central relabel **over-grants**:

1. **`spine-recoverable ⇒ Tier 2` conflates durability with queryability (FATAL, §0).** Spine defeats *pruning*, not *unboundedness*. The design's own words ("never a read index," "untrusted-discovery," native-kernel:251) confirm the replay path is not a query path. Split the axes; keep the anti-pruning claim, reject the T2-query claim for every BASIC reverse/enumeration query. Keep-demote §0 already got this right — it must override durability D-1.
2. **Authorship enumeration is mis-filed as analytics (FATAL, §1).** It is `ls ~` / self-restore / backup, it regressed from v1 `_sentAttestations` (EFSIndexer.sol:194/:774, paginated), it is the same cheap one-word-postings shape as B3/P12, and its off-chain default means "recover your own data ⇒ trust an indexer." Ship `discover(author)` or make James sign that sentence.
3. **The contingency cascade defaults the whole graph DB to Tier-3 (FATAL, §4).** Full-spine, B3, P12, author-index, P7, E10, duplicity — on every one, the gas-cheapest freeze outcome is the T3 outcome. Price them as ONE bundle; require an affirmative T1/T2 signature; silence = mission failure.
4. **EQUIVOCAL is a soundness hole for gating contracts (FATAL-if-contracts-gate, §6).** Contracts serve equivocated values as LIVE. Decide it, don't leave it open.
5. **The multi-tag-AND concession is drawn too generously (SERIOUS, §2).** The corpus's selectivity predicate serves selective tag-population ANDs at T2; the audit's "named container" restatement hands those to The Graph. Redraw to selectivity.
6. **Mirror ranked-selection regressed on the web3:// path, fixable at zero Etched cost (SERIOUS, §7).**
7. **CAS-dedup coupling anonymized; spine grants doubly unverified (SERIOUS, §8/§5).**

The honest headline for James: **EFS is a Tier-2 graph database only if he affirmatively pays for and signs the full reverse/enumeration bundle (full-spine + B3 + P12 + author-index) as Etched state, keeps "no body elision" as an Etched invariant, runs the fire drill with a reverse-query assertion, and rules EQUIVOCAL. On the default/cheapest path, it is a Tier-3 graph database that needs The Graph for backlinks, directory listing, self-restore, list-membership, and cited-by — the very operations a graph database exists to serve.**
