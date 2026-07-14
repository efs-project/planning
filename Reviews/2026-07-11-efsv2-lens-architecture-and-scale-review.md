# 2026-07-11 — EFS v2 lens architecture, trust, and 50+ principal review

**Status:** point-in-time research review and candidate vNext architecture; research current through 2026-07-11; not canon, not a decision record, and not a freeze/promotion claim.

**Scope:** EFS v2 lenses as the mechanism by which a reader selects, combines, explains, shares, and gates claims. This includes identity and device delegation, namespace overlays, dataset curation, discovery/follows, moderation and advisories, graph queries, on-chain resolution, privacy, reproducible links, recovery, and the OS/app trust boundary. It audits the current local [[efsv2/README|EFS v2 design set]], the relevant v1 contracts and ADRs, and the assumptions in [[efsv2/owner-rulings]]. It is the lens-focused continuation of the [century-storage review](./2026-07-10-efsv2-century-storage-and-cypherpunk-os-review.md) and [cypherpunk OS/coherence audit](./2026-07-10-cypherpunk-os-state-of-art-and-coherence-audit.md); their preservation and OS-layer findings remain in force.

**Method:** direct design/code audit; lower-bound and adversarial complexity analysis; primary-source research across distributed authorization, linked local namespaces, package/update security, reproducible systems, graph data, social/moderation systems, and current Ethereum execution/storage constraints; independent specialist passes on semantics, precedents/UX, on-chain algorithms, and red-team failure modes. The isolated gas model is preserved in the [review corpus](./2026-07-11-efsv2-lens-review-corpus/README.md), and the material challenges/closures are archived in its [peer-review log](./2026-07-11-efsv2-lens-review-corpus/peer-review-log.md). The planning worktree already contains substantial in-flight design work, so this review intentionally changes no canonical design document.

#status/review #kind/review #repo/planning #topic/lenses #topic/trust #topic/onchain #topic/efsv2

---

## Executive judgment

The vision is good, important, and more general than a filesystem preference list. EFS is trying to preserve one shared, addressable evidence graph while allowing each person, application, community, and contract to derive a different usable view without surrendering that choice to a platform indexer. That is a sound cypherpunk direction.

The present model is not ready to freeze. “Lens” currently means too many different things:

- an ordered namespace overlay;
- a list of people someone follows;
- a device/app signer roster;
- a set of dataset curators;
- a moderation or deny-source set;
- a discovery/indexing hint;
- a trust or authorization policy;
- a link parameter;
- and sometimes the resolved view itself.

Those acts do not carry the same authority and must not share one universal combining rule. Following a friend must not let that friend publish an OS update. Trusting an app key to write one app directory must not make it outrank a person across the filesystem. Accepting a malware label must not imply accepting the labeler’s filenames. A display preference must never become an authorization credential.

The most important vNext correction is therefore:

> **A lens is a content-addressed, reproducible policy over authenticated EFS evidence—not merely a list of authors.**

Internally, EFS should distinguish three layers:

1. **EvidenceGraph** — objective signed bytes, admission, revocation, slot state, and rebuildable indices at an explicit chain basis.
2. **LensPolicy** — the reader’s scoped authority, selection, combination, discovery, and advisory rules.
3. **ResolvedView** — derived values plus grade, completeness, provenance, and a machine-checkable explanation.

This preserves the cypherpunk principle. The substrate does not impose one universal social truth, but it does make the evidence and derivation objectively checkable.

### Bottom-line rulings

1. Retain “lens” as the human-facing word. Make `LensPolicy` the exact technical object and `ResolvedView` the output.
2. Keep ordered first-attester behavior only as a named combiner, `PRIORITY_FIRST_PRESENT`, for cardinality-one overlay slots such as a pathname. “First” means policy priority, never time.
3. Add typed combiners: `EXACT`, `PRIORITY_FIRST_PRESENT`, `UNION_SET`, `ONLY_ONE`, `THRESHOLD`, explicit `MERGE`, and advisory action rules. There is no safe universal combiner.
4. Make every accepted-authority rule scope-limited by immutable root, predicate/definition, kind, statement class, purpose/app, and the existing `GATE`/`INTERACTIVE` evaluation context. Scope can narrow through delegation; it can never widen. Actual write/decrypt/execute capability remains separate.
5. Collapse routine device and app keys behind the user’s stable KEL-style principal and scoped delegation. Twelve operational keys should not normally consume twelve top-level semantic priorities.
6. Separate mutable lens channels, immutable source revisions, fully expanded compiled policies, and exact resolution receipts. This is the Nix-style source/lock/result distinction EFS links need.
7. Compile and flatten nested lenses before reads. Reject cycles, prohibit implicit transitive trust, and make resource limits explicit. Never silently truncate.
8. Retire v1’s semantic `MAX_LENSES = 20`. A portable v2 reference profile should support at least 256 expanded principals, while every individual read is governed by explicit probe/scan/gas budgets and resumable cursors.
9. Freeze policy-neutral on-chain state, not per-lens materializations: coherent current author slots (plus an explicit decision on optional same-slot collision evidence), bounded lens-channel anchor summaries, semantic-position lifetime claimant rosters, per-author child candidate streams, typed target/predicate reverse indices, and self-enumeration. These proposed shapes are not all present in the current Etched set; each is a new/reconciled freeze decision.
10. Resolve each **known venue-local semantic position** with a measured choice between direct priority probing (bounded by `K`) and the venue’s complete lifetime claimant roster `P_v` plus rank intersection. A sparse roster often wins, but `P_v < K` does not guarantee lower total gas. This does not make whole-directory discovery `O(min(K,P))`.
11. Define “works on-chain” at three levels: state/evidence completeness, bounded candidate/point resolution, and transaction composability. A 50-principal directory can have bounded on-chain candidate enumeration and exact venue-local point resolution, then deterministic client materialization at one block. Append-ordered streams can emit each resolved position once under a carrier rule, but globally sorted/top-N pages need a shared ordered index or a materialized/proven snapshot.
12. Treat personal lens configuration as sensitive even when EFS content is public. Do not serialize a person’s full friend/curator/moderator graph into ordinary URLs or public transactions.
13. Make the risk bearer choose the policy: the viewer chooses display policy; the resource or gate owner pins authorization policy; a caller never supplies the lens that authorizes that same caller.
14. Do not freeze until same-author/same-sequence semantics, identifier grammar, author width, required index shapes, subscription update rules, link forms, and on-chain capability levels are coherent across the v2 corpus.

### Is 50+ practical?

**Conditionally yes.** Venue-local point resolution and ordinary sparse-lifetime directory workloads appear practical under the corrected model and measured prototype. The current implementation is not. A fast fresh bootstrap after decades of append-only tombstones remains conditional on a current-live/compaction design and production-kernel benchmarks.

- A 50-principal point lookup is already reasonable as a worst-case fallback: 50 cold storage reads alone are about 105,000 gas under EIP-2929, before normal overhead.
- The current nested directory design is not reasonable. With three advisory match keys, 64 items × `(50 allow principals + 3 × 8 advisory principals)` is 4,736 logical slot probes: a 9.95M-gas cold-storage floor before calls, hashing, state checks, or response encoding. At 128 items the same additive model approaches 19.9M gas, beyond the 16,777,216 transaction cap on chains applying EIP-7825.
- For a known single-venue semantic position, the correct design chooses a measured cheaper plan: direct priority probes or a complete lifetime claimant roster plus rank intersection. Sparse rosters can reduce slot probes substantially, but total work is not literally `O(min(P,K))` once roster reads and membership lookup are counted.
- Directory discovery costs the selected authors’ candidate contributions, `T`, plus point resolution. In an adversarial all-overlap case, `T` can still be `K × M`. The result remains honest and resumable through per-author budgets/cursors; the SDK deduplicates and sorts at one pinned block.
- An outsider cannot enter a selected principal’s candidate stream, but outsider Sybils can inflate the shared lifetime claimant roster for a hot exact position and force the resolver back toward `K` direct probes. A malicious selected author can also bloat its own stream. Both costs must be priced, bounded, attributable, and resumable.

The Graph, a local database, or another indexer can accelerate this. None is required to obtain or verify the answer.

---

## 1. What a lens means

### 1.1 The philosophical core

EFS should not say “there is no truth.” It should say:

> There is objective evidence, and there can be multiple explicit policies for interpreting it.

Signature validity, claim bytes, a home-chain admission, revocation state, and the contents of a slot at a pinned block are not matters of taste. Whether Alice or Bob is authoritative for `/research/result.csv`, whether two opinions should be unioned, and whether a “malware” label means warn or reject are policy decisions.

This distinction is the foundation of trust without a platform oracle:

- The substrate proves **who said what, where, under which key history, and at which evidence basis**.
- A lens declares **whose statements matter for this purpose and how disagreements combine**.
- A resolved view proves **how the declared policy produced the displayed answer**.

EFS can still have canonical views **within a declared institution or resource**. A dataset can publish and sign its release policy; a contract can pin its gate policy; a container owner can recommend a view channel. What EFS should reject is one silent protocol-wide policy pretending to be canonical for every reader and purpose.

A lens is therefore closer to a tiny, reproducible policy program than a social list. The closest precedents each illuminate one aspect, but none should be copied whole:

- Plan 9 union namespaces show how ordered overlays can give one process a personal namespace.
- SDSI/SPKI and RT show scoped local names, roles, and verifier-controlled authorization.
- TUF shows scoped, ordered, terminating, and threshold delegation for high-risk update metadata.
- CSS shows that several typed precedence dimensions can be deterministic without pretending every rule is one flat global rank.
- Nix lock files show why a mutable source reference and its fully locked dependency graph need separate identities.
- RDF datasets show how multiple graphs can remain distinct; EFS must separately define author/venue/basis provenance rather than inheriting it from a graph name.
- AT Protocol labels show why signed labels and the consumer’s moderation actions are separate layers.

### 1.2 A lens is not a capability

A lens controls interpretation and selection. It does not grant decryption keys, filesystem handles, wallet authority, or app capabilities.

An EFS OS needs a separate capability system:

- A `LensPolicy` may say an app signer is authoritative for claims under `/apps/notes/`.
- A capability grant may let the running app write to a local handle corresponding to that path.
- A key envelope may let the app decrypt a private object.

These three facts can align, but none implies the others. Conflating them creates confused-deputy failures: a source trusted for display could become able to write, or a process able to write could become globally trusted.

### 1.3 A lens is not the evidence graph

The lens must not rewrite or erase evidence. Denied or losing claims remain inspectable, citable, and available for another policy. The resolved view can hide them by default, but should preserve a provenance path.

This is the difference between pluralism and mutability of history. EFS can offer different namespaces without letting one viewer’s policy alter another viewer’s evidence.

### 1.4 The risk bearer chooses

The party carrying the risk chooses or pins the relevant policy:

| Situation | Policy controller | Reason |
|---|---|---|
| Human browsing a directory | viewer | the viewer bears interpretation and attention risk |
| Rendering a sender’s exact citation | citation pins a policy/basis, viewer sees that fact | reproducibility, not ambient authority |
| Contract gate or permission check | gate/resource owner | a caller cannot choose the rule that approves itself |
| OS package activation | device owner’s update policy | the device owner bears execution risk |
| Shared dataset publication | dataset/channel owner | defines the accepted publication process |
| Local moderation display | viewer | labels are evidence; actions are personal policy |
| Community moderation gate | community owner/governance | the resource defines its admission policy |

This rule should be constitutional. A `lens` query parameter can request a view; it must never be treated as authentication.

### 1.5 What it means to share a path

A shared EFS path is a shared **question/coordinate**, not necessarily a promise that every reader receives the same object:

```text
(root, segment sequence, read purpose) + recipient policy + evidence basis -> resolved object/view
```

This is the useful heart of the vision: two people can discuss `/community/research/latest` while one sees the owner’s version, another sees a delegated curator’s overlay, and both can inspect why. When they need to discuss identical bytes, they share an exact object/claim citation instead.

“Only see what I need” has two separate meanings:

- **attention/relevance:** discovery and resolution policy omit unselected evidence from the normal view while preserving inspectability;
- **confidentiality:** encryption and capabilities prevent unauthorized plaintext access.

A lens provides the first. It cannot honestly provide the second by hiding public graph rows.

---

## 2. Split the overloaded primitive

The human interface can still say “View through my Research lens.” The normative model should compile these distinct objects:

| Primitive | Responsibility | Examples |
|---|---|---|
| `Principal` | stable EFS identity being trusted as an author | KEL-style EFS identity; current v2 excludes ERC-1271 contract authors |
| `PrincipalSet` | named membership without semantics | devices, friends, curators, labelers |
| `AuthorityRule` | whose claims may speak for which scope and statement class | Alice’s placement claims under `/photos/`; committee approvals for `releaseOf` |
| `Combiner` | how admissible claims become values | priority, union, threshold, conflict |
| `DiscoveryPolicy` | candidate/follow/replication selection | friends’ activity, curator feeds |
| `AdvisoryPolicy` | label sources and label-to-action mapping | warn on spam; reject known malware |
| `PrivacyCaps` | access to ciphertext/plaintext and execution handles | decrypt this collection; write this app directory |
| `LensPolicy` | compiled composition of authority, combination, discovery, and advisories | “My everyday view” |
| `ResolvedView` | values, provenance, grade, completeness, explanation | one rendered directory page |

The separation is functional, not bureaucratic. It prevents dangerous semantic inheritance.

### 2.1 Trust is typed and scoped

“Trust Alice” is not a sufficient operation. The UI and policy should say one of:

- follow Alice for discovery;
- accept Alice’s filenames under `/shared/photos/`;
- accept Alice’s `curates` statements for dataset X;
- accept Alice’s malware labels, with action `warn`;
- permit Alice’s key lineage to approve release metadata, threshold 2-of-3;
- accept claims signed by this delegated app actor for this subtree until this epoch (a separate OS capability controls whether the running app can actually write/publish).

Suggested scope dimensions:

```text
Scope = {
  roots:        set<ImmutableScopeRoot>,
  predicates:   set<DefinitionId>,
  subjectKinds: set<Kind>,
  claimRoles:   set<placement | metadata | label | approval | delegationEvidence>,
  purposes:     set<PurposeId>,
  contexts:     set<INTERACTIVE | GATE>,
  temporal:     set<TemporalWindow>
}

TemporalWindow = {
  clockDomain,
  domainRef,
  notBefore?: uint,
  notAfter?:  uint
}
```

Scopes intersect at each delegation or import. In each authority dimension, an empty intersection grants nothing and an every-universe wildcard must be explicit; omission never silently means “all.” The temporal conjunction is the one exception to that set intuition: `temporal = []` means no time restriction.

`temporal` is a canonical conjunction, not one global interval. Each window is `[notBefore, notAfter)`, with `null` as an unbounded endpoint. Windows with the same `(clockDomain, domainRef)` normalize to the tightest intersection; windows in different domains remain independent predicates that must all pass. A contradictory same-domain interval grants nothing. A compiler never compares or discards constraints from incomparable clocks merely to fit them into one pair.

Normative scope roots should be immutable, domain-separated container/definition identities, not display path strings whose meaning depends on the very lens being compiled. A human path prefix is authoring sugar resolved at an explicit basis to a pinned anchor and descendant rule. Descendant tests must name which structural relation and authority define ancestry; they cannot recursively depend on the candidate lens result.

`citation` and `replication` are purposes/modes wrapped around evaluation, not new read contexts. The current read spec deliberately closes `ReadContext` to `GATE | INTERACTIVE`; reopening that enum would require a separate normative decision and vectors.

The same scope/attenuation algebra must be used by the freeze-sensitive `act` delegation row. EFS must not freeze one grammar for delegation evidence and another for lens authority. Actual authority to emit a claim is established by identity/delegation/capability evidence; the lens rule only says whether the resulting authenticated claim is accepted in this view.

Overlapping multidimensional scopes do not have an implicit “most specific” order. Every authority, advisory, and discovery source rule carries an explicit class-local `rulePriority`; each import carries a `mountPriority`. Compilation creates a lexicographic priority path `[outerMount, …, innerMount, localRulePriority]`. For a concrete query and the same class-specific policy key, the greatest applicable path supplies the rule configuration; equal-path overlaps must have identical executable semantics or compilation fails. There is no implicit cross-rule merge. The keys are authority claim role/definition, advisory `labelDefinitionId`, and the named discovery mode/purpose. Different advisory definitions or explicitly composable discovery modes run as separate pipelines, then combine only through the named resolver profile. Scope containment by itself never invents precedence.

### 2.2 Typed combiners

The resolver needs an explicit combiner per scope/definition, not one global algorithm.

| Combiner | Meaning | Appropriate uses | Unsafe uses |
|---|---|---|---|
| `EXACT(principal)` | only this principal is admissible | owner metadata, self namespace | social aggregation |
| `PRIORITY_FIRST_PRESENT` | first policy-ranked live claim wins; unknown higher priority blocks finality | pathname overlay, preferred metadata, search path | comments, votes, general truth |
| `UNION_SET` | retain all admissible distinct values under a named dedup key | comments, follows, tags, discovery | single executable or filename slot |
| `ONLY_ONE` | exactly one value or explicit conflict | unique binding requiring collision visibility | feeds |
| `THRESHOLD(k,n)` | accept value supported by threshold within a fixed committee | releases, safety approvals, high-assurance facts | open social reputation |
| `MERGE(strategyId)` | apply a named deterministic fold/CRDT | collaborative documents with a defined algebra | arbitrary objects |
| `ADVISORY(actions)` | select signed labels, then map to warn/hide/block/reject | moderation, malware, quality signals | primary content authority |

`PRIORITY_FIRST_PRESENT` should replace “first-attester-wins” in normative prose. “First attester” sounds chronological. Chronology is neither required nor safe; priority is declared by the policy.

Combiner details must be exact:

- `EXACT` requires one applicable stable principal and does not consult a fallback tier unless the rule separately declares a handoff.
- `PRIORITY_FIRST_PRESENT` evaluates tiers in order; an equal-rank tier with different live values is `CONFLICT`, not an address/hash tie-break. Only the declared absence/fallback mode advances tiers.
- `UNION_SET` deduplicates by a named canonical value/claim/operation key. A multiset or author-attributed duplicates require a different strategy ID.
- `ONLY_ONE` returns the value only if all applicable live claims normalize to one value; otherwise it returns the competing values and provenance.
- `THRESHOLD(k,n)` requires a duplicate-free closed committee and `1 <= k <= n`; it counts each stable principal at most once toward the same canonical value digest. Unknown/revoked committee evidence blocks a decision whenever unseen votes could change or create a competing outcome. High-assurance profiles normally require quorum intersection (`2k > n`) or a stronger application rule. If two different values satisfy threshold, the result is `CONFLICT` and the policy/profile is unsafe.
- `MERGE(strategyId)` commits the versioned code/semantics identity, exact algebra, operation identity, causal-closure rule, resource bounds, and implementation vectors. “Merge” without that commitment is invalid.
- Advisory combination selects signed labels first; action precedence (`reject > block > hide > warn`, or another table) belongs to the consuming policy and is committed explicitly.

There should be no universal cross-author “latest wins.” Authors’ sequence numbers and clocks are not globally comparable, and an attacker controls its own clock. Dynamic reputation scores should also remain outside kernel semantics. They are Sybil-sensitive, hard to reproduce, hard to explain, and tend to recreate an indexer oracle.

### 2.3 Mirrors are transport policy, not content authority

Mirror resolution is a two-stage operation:

1. `LensPolicy` resolves the trusted content/metadata claim, including its basis-pinned `contentHash` or representation commitment. The underlying EFS DATA identity is owner/salt-derived and the trusted hash claim may change at a later basis.
2. A separate deterministic transport policy ranks the winning authority’s primary mirror plus applicable active mirror TAGs. A third party may advertise or carry the bytes only if the retrieved representation verifies against the already trusted content hash.

A mirror outage must not silently make a lower-ranked content author authoritative. The resolver may try another verified carrier for the **same** content, return bytes-unavailable, or apply a separately declared content fallback rule.

The v1 best-of-N mirror view is core behavior that the current v2 corpus regressed to “off-chain or fail.” Restore a bounded on-chain view/query over the already-kept mirror facts, with explicit rank inputs, probe/scan limits, and result provenance. The separately committed transport policy decides which mirror assertions/carriers are eligible—including third-party carriers when desired; carrier eligibility never grants content authority. Hash verification against the basis-pinned trusted content commitment decides whether bytes are acceptable. Availability, latency, price, and privacy preferences belong to transport policy and do not rewrite the content winner.

### 2.4 Directory semantics are two operations

A directory view needs both union and priority:

1. **Enumerate candidate names** as the union of names contributed by selected principals.
2. **Resolve each same-name position** using the rule for that position, normally `PRIORITY_FIRST_PRESENT`.

This borrows union namespaces’ concatenated enumeration plus priority lookup. EFS still has to define its own exact-position dedup, equal-rank conflict, provenance, and hostile-stream rules. Treating the whole directory as either “first author only” or “union every competing object” loses the intended behavior.

### 2.5 Equal-rank groups

Humans should usually rank semantic groups, not forty individual friends:

```text
Tier 0: me / my stable identity
Tier 1: explicitly delegated co-owners
Tier 2: selected dataset curators (equal rank)
Tier 3: followed friends for discovery only
Tier 4: app/operator recommendations (labeled, never implicit)
```

Within an equal-rank tier:

- `UNION_SET` retains all values under its named dedup rule;
- `ONLY_ONE` produces a conflict if values differ;
- a gate fails closed unless its policy provides a deterministic threshold or tie rule;
- an interactive overlay can show alternates but must not invent an arbitrary global priority between people.

Sorting equal-rank identities by bytes can make execution deterministic, but it must not silently convert byte order into semantic authority.

---

## 3. Identity, devices, apps, and delegation

### 3.1 Stable principals, replaceable keys

The semantic roster should contain stable principals, not every operational signing key. The default path is:

```text
stable user principal (KEL lineage)
  ├── phone key: scoped device delegation
  ├── laptop key: scoped device delegation
  ├── notes app actor: accepted placement claims under /apps/notes/*
  └── photo importer actor: accepted append-shaped claims under /photos/inbox/*
```

A key rotation should not reorder the user’s namespace. A lost phone should be revoked without rewriting every friend’s lens. An app reinstall should not become a new top-level social identity.

Collapse only keys cryptographically authorized to sign **as** the stable lineage under the KEL rules. A scoped app/session key remains an actor with enforceable delegation evidence even if the resolver attributes its claim to the stable principal for ranking. Every result retains both stable author principal and actual signer/delegation path. Otherwise “collapse devices” would hand a compromised app the user’s full namespace authority and erase useful provenance.

An intentional persona or independent institution may remain a distinct principal. The rule is not “always collapse keys”; it is “do not let operational key count become semantic authority count.”

### 3.2 Delegation constraints

Delegation should be monotonic in authority:

- delegated scope is an intersection with the delegator’s scope;
- delegation depth is bounded;
- expiry/revocation is explicit and evaluated at the evidence basis;
- an app/device cannot re-delegate unless that operation is explicitly granted;
- the policy explains the full authority path;
- cycles are invalid;
- unknown revocation/key-history evidence never becomes “valid by fallback” for a gate.

This follows the useful parts of SDSI/SPKI, KeyNote, RT, TUF, and capability systems: local names and explicit authorization chains, with the verifier deciding what suffices.

### 3.3 Curators do not confer facts

A curator’s inclusion means:

> Curator X recommends principal/object Y for scope S under policy revision R.

It must not be rendered as:

> Y objectively belongs to category S.

For social curation, a subject may publish a disavowal that the viewer can choose to honor. For malware/security advisories, the subject cannot veto the label evidence; only the consumer decides its effect.

---

## 4. Reproducible, mutable, and hyperlinkable lenses

One identifier cannot simultaneously mean “follow future edits,” “name executable semantics,” and “reproduce the exact old answer.” Use five identities plus a local private handle.

| Identifier | Meaning | Mutable? | Used for |
|---|---|---:|---|
| `LensChannelId` | stable share/subscription handle controlled by a publisher | yes, points forward | human subscriptions and named views |
| `LensRevisionId` | immutable canonical source manifest at one revision | no | review, editing history, import input |
| `EffectiveLensId` | immutable fully expanded/compiled semantics | no | execution, caches, exact links, gates |
| `LensCompilationId` | signed source-to-effective binding, compiler/profile, pinned import closure, and provenance | no | audit and source conformance without contaminating semantic identity |
| `ViewReceiptId` | exact policy + basis + context + clock/horizons + resolver + result/provenance | no | reproduction, audit, citations |

`PrivateLensHandle` is a randomized/keyed local database handle, not a portable content ID. It prevents routine disclosure of the deterministic effective ID; it is never used as a public proof.

This is the Nix distinction between an original/floating reference, a lock graph, and the resulting closure applied to view resolution:

- Subscribe to a channel when the desired semantics are “follow future curation.”
- Pin a revision when discussing what the curator published.
- Pin the effective policy when requiring the exact compiled authority rules.
- Pin a compilation record when proving how a source/import closure produced those rules.
- Pin a receipt when requiring the exact answer at the exact evidence basis.

### 4.1 Semantic identity is not a locator

A semantic digest proves bytes after retrieval; it does not tell a fresh client where those bytes live. Because EFS `DATA` IDs are owner/salt-derived, every public import/link uses a locatable reference:

```text
LensObjectRefV1 = [
  venueRef,             ; chainId + kernel address + expected codehash/profile
  carrierKind,          ; 0=EFS_DATA in portable public v1
  carrierId,            ; ordinary owner/salt-derived EFS dataId
  semanticKind,         ; REVISION / EFFECTIVE / COMPILATION / RECEIPT / CHANNEL_STATE
  semanticDigest        ; LensRevisionId / EffectiveLensId / ...
]

LensChannelRefV1 = [
  venueRef,
  controllerPrincipal,
  channelAnchorId,      ; domain-separated kernel key for controller + channelId
  channelId
]
```

The candidate portable EVM venue wire form is also fixed-width where possible:

```text
VenueRefV1 = [
  1,                    ; venue-ref version
  0,                    ; chain namespace: EIP-155/EVM
  chainId,              ; uint
  genesisBlockHash,     ; bstr .size 32
  kernelAddress,        ; bstr .size 20
  kernelRuntimeCodehash,; bstr .size 32
  kernelImplementationCommitment, ; bstr .size 32; zero only for a non-proxy
  kernelSemanticsProfileId         ; bstr .size 32
]
```

For a proxy or modular kernel, `kernelImplementationCommitment` binds the complete implementation/codehash and storage-schema graph required by the semantics profile at the receipt basis; the proxy shell’s runtime hash alone is insufficient. A kernel upgrade therefore creates a new venue reference. `chainId + genesisBlockHash` distinguishes accidental private/L3 chain-ID reuse; a later fork is distinguished by the explicit basis and fork policy.

In the portable profile, `carrierKind` and `semanticKind` are preferred-shortest uint discriminants, `carrierId` and `semanticDigest` are exactly 32-byte strings, and channel controller/anchor/channel IDs are exactly 32 bytes. These locator arrays obey the same strict CBOR rules and golden vectors as the lens source.

Resolution fetches `carrierId` from `venueRef`, decodes the declared semantic kind, and verifies `semanticDigest`. A hash-only reference is allowed only when the object is already locally available; it is not a shareable bootstrap reference.

The channel anchor is policy-neutral state-backed discovery **and** a bounded current-state commitment. At an explicit basis, it exposes the unique head reference/generation when one exists, the last unambiguous state, contested/tombstoned status, an order-independent admitted-state-set root, and an optional authenticated checkpoint reference; paged candidates remain available for audit. It does not bless the referenced lens contents: clients still fetch by carrier and verify semantic digests. Private local policies use `PrivateLensHandle` and an encrypted recovery locator instead of pretending a hidden digest is publicly fetchable.

This avoids a new global hash registry. If EFS later wants `semanticDigest -> carrier[]` discovery, that is a separate policy-neutral on-chain reverse-index decision with spam/bounds; correctness never depends on one hosted locator.

### 4.2 Canonical source manifest

A `LensRevision` can be carried in an ordinary EFS `DATA` object. The ordinary EFS `dataId` remains owner/salt-derived; `LensRevisionId`, `EffectiveLensId`, and `LensCompilationId` are semantic content digests stored in or alongside that object, not replacements for the EFS object ID. An EFS `LIST` may be an editor-friendly projection or roster primitive. Current TAG membership already carries `weight=order`; the missing pieces are a frozen snapshot plus lens-specific tie, nesting, scope, combiner, and update semantics.

Illustrative source model:

```text
LensRevisionV1 = {
  format:            "efs-lens-source",
  version:           1,
  channel?:          LensChannelId,
  label?:            string,
  purpose:           PurposeId,
  rules:             [AuthorityRuleSource],
  advisories:        [AdvisoryRuleSource],
  discovery:         [DiscoveryRuleSource],
  imports:           [LensImport],
  limits:            ResourceProfile,
  extensions?:       map<ExtensionId, bytes>
}

LensImport = {
  mountPriority: uint32,
  referenceMode: PINNED_REVISION | FOLLOW_CHANNEL,
  target: LensObjectRefV1 | LensChannelRefV1,
  importClass: AUTHORITY_RULES | ADVISORY_RULES | DISCOVERY_RULES,
  transitivity: LEAF_ONLY | ALLOW_NESTED,
  scope: Scope,
  maxDepth: uint8
}
```

Use a strict EFS deterministic-CBOR profile based on RFC 8949, not the vague phrase “CBOR” or even “DAG-CBOR” alone. The candidate v1 wire form below permits arrays/scalars only:

- definite-length arrays/strings only;
- RFC 8949 preferred shortest serialization for every major-type argument, including integer values and all byte/text/array lengths;
- no floating point;
- no maps and no CBOR tags in v1 (a future map-bearing profile would have to choose RFC 8949 §4.2.1 bytewise key ordering explicitly);
- fixed bytes rather than human strings for protocol identifiers;
- fixed-width `bytes32` principals in the portable profile;
- text strings are valid UTF-8 and committed byte-for-byte; there is no implicit Unicode normalization;
- priority arrays preserve declared order;
- semantic sets are sorted and deduplicated by canonical bytes;
- unknown critical fields fail closed;
- extensions are explicitly namespaced and committed;
- maximum source bytes, entries, import depth, and compiled expansion are explicit;
- golden vectors exist for Solidity, Rust, TypeScript, and any reference client.

#### Candidate v1 wire grammar

The map-shaped model above is for human readability. A strong candidate wire form uses fixed-length CBOR arrays with integer discriminants. That removes map-key spelling/order ambiguity and makes strict Solidity/Rust decoding easier. This is a proposal to vector-test, not a frozen schema:

```text
LensSourceV1 = [
  1,                    ; format version
  semanticsProfileId,   ; bstr .size 32
  purposeId,            ; bstr .size 32
  label,                ; tstr / null, display only
  authorityRules,       ; [* AuthorityRuleSource], ascending rulePriority
  advisoryRules,        ; [* AdvisoryRuleSource]
  discoveryRules,       ; [* DiscoveryRuleSource]
  imports,              ; sorted-set [* LensImportSource]
  resourceProfile,      ; ResourceProfile
  extensions            ; [* Extension]
]

Principal = [
  principalKind,        ; uint: 0=EFS_KEL32 in the portable v1 profile
  principalBytes        ; bstr; exactly sized by kind
]

Scope = [
  roots,                ; sorted-set [* ScopeRoot]
  predicates,           ; sorted-set [* bstr .size 32]
  subjectKindBits,      ; bstr, minimal trailing-zero-free bitstring
  claimRoleBits,        ; bstr, minimal trailing-zero-free bitstring
  purposes,             ; sorted-set [* bstr .size 32]
  contextBits,          ; uint bitset: INTERACTIVE/GATE only
  temporalWindows       ; sorted-set [* TemporalWindow]
]

TemporalWindow = [
  clockDomain,          ; uint registry
  domainRef,            ; canonical ClockDomainRef for that domain
  notBefore,            ; inclusive uint / null
  notAfter               ; exclusive uint / null
]

ScopeRoot = [
  relationProfileId,    ; bstr .size 32
  rootKind,             ; uint
  rootId                ; bstr .size 32
]

AuthorityRuleSource = [
  rulePriority,         ; uint, unique within this source revision
  Scope,
  Combiner,
  authorityGroups,      ; [* AuthorityGroup], ascending tier
  relinquishMode,       ; 0=FALLTHROUGH_ON_RELINQUISH, 1=STOP
  ruleFlags             ; uint, unknown bit fails
]

AuthorityGroup = [
  tier,                 ; uint; unique within rule
  effect,               ; uint registry: AUTHORITATIVE/FALLBACK/APPROVER...
  principals            ; sorted-set [* Principal]
]

Combiner =
  [0, null]             ; EXACT (exactly one applicable principal required)
  / [1, null]           ; PRIORITY_FIRST_PRESENT
  / [2, dedupProfileId] ; UNION_SET
  / [3, null]           ; ONLY_ONE
  / [4, thresholdK]     ; THRESHOLD
  / [5, strategyId]     ; MERGE

AdvisoryRuleSource = [
  rulePriority,         ; uint, unique within advisory rules in this revision
  Scope,
  labelDefinitionId,    ; bstr .size 32
  sourceGroups,         ; [* AuthorityGroup]
  actionTable,          ; sorted [* [labelValue, action, severity]]
  freshnessProfileId,   ; bstr .size 32 / null
  ruleFlags
]

DiscoveryRuleSource = [
  rulePriority,         ; uint, unique within discovery rules in this revision
  Scope,
  sources,              ; sorted-set [* Principal]
  discoveryMode,        ; uint
  perSourceBudget,      ; uint
  ruleFlags
]

LensImportSource = [
  mountPriority,        ; uint; forms the next priority-path component
  referenceMode,        ; 0=PINNED_REVISION, 1=FOLLOW_CHANNEL
  targetRef,            ; LensObjectRefV1 / LensChannelRefV1, consistent with mode
  importClass,          ; 0=AUTHORITY_RULES, 1=ADVISORY_RULES, 2=DISCOVERY_RULES
  transitivity,         ; 0=LEAF_ONLY, 1=ALLOW_NESTED
  Scope,
  maxDepth              ; uint
]

ResourceProfile = [
  maxImportDepth,
  maxImportNodes,
  maxImportEdges,
  maxEffectivePrincipals,
  maxRules,
  maxAdvisorySources,
  maxSourceBytes,
  maxCompileWork
]

Extension = [
  extensionId,          ; bstr .size 32
  critical,             ; false / true
  payload               ; bstr, interpreted only by named extension
]
```

Canonicalization rules:

1. Every version-1 array has exactly the stated length; optional values occupy their slot as `null`.
2. Every CBOR major-type argument—including integer values and every byte-string, text-string, and array length—uses RFC 8949 preferred shortest serialization. No tags, floats, maps, or indefinite-length items appear in this profile. Text strings are valid UTF-8 and their exact bytes are committed; the protocol performs no implicit Unicode normalization. Security-relevant identifiers use fixed bytes, not text.
3. A `sorted-set` is strictly increasing by the complete canonical encoding of each element. Duplicate or out-of-order entries are invalid.
4. Each of `authorityRules`, `advisoryRules`, and `discoveryRules` is strictly ordered by its own unique local `rulePriority`; imports are ordered by unique `mountPriority`; authority groups are ordered by ascending tier. Other semantic sets use canonical set order. Presentation-only source ordering belongs in a separate committed editor field, not execution semantics.
5. Tier values are strictly increasing and unique. Principals inside one equal-rank tier are a set, not a hidden byte-order priority.
6. Scope normalization sorts sets, merges windows with the same clock key by intersection, retains different clock keys as a conjunction, rejects contradictory same-domain intervals, and rejects a wildcard not explicitly represented by the profile. Equal compiled priority-path overlaps with different semantics are invalid.
7. Unknown enum values, flag bits, principal kinds, combiner tags, critical extensions, or semantics profiles fail closed.
8. Decoders consume the complete byte string and reject trailing bytes.
9. The publisher signs the domain-separated source digest, not an implementation’s in-memory object.
10. Human labels never participate in authority comparisons but remain committed because changing the signing ceremony text should produce a new source revision.

The effective semantic wire form removes `FOLLOW_CHANNEL`, stores normalized query-purpose slices, and contains only execution-affecting bytes. Cosmetic source/provenance changes must not change `EffectiveLensId`:

```text
EffectiveLensV1 = [
  1,
  semanticsProfileId,
  purposeId,
  compiledSlices,       ; sorted by canonical normalized Scope then rule order
  compiledAdvisories,
  compiledDiscovery,
  sliceCommitment,      ; root/hash committing every executable scope slice
  resourceProfile
]

LensCompilationRecordV1 = [
  1,
  sourceRevisionRef,
  effectiveLensRef,
  semanticsProfileId,
  compilerNormalizerVersion,
  pinnedImportRevisionRefs, ; locators + semantic digests
  compilationBasis,
  compilerEvidenceDigest,
  publisherOrAcceptorPrincipal,
  signature
]
```

`compiledSlices` may be projected into an ABI structure for EVM execution, but the ABI projection must round-trip to the same canonical semantics and reject malleable encodings. The EVM projection is not a second policy language.

The portable baseline permits only the stable EFS/KEL-style `bytes32` principal kind. Current [[efsv2/identity]] explicitly rejects ERC-1271 authors because signature validity is contract-state/venue dependent. A later contract-author proposal would have to overturn that ruling and commit full chain/venue/code-state semantics; a bare 20-byte address is not globally meaningful. Supporting it is a separate identity review and semantics-profile change, not a permissive decoder extension.

### 4.3 Compiled effective policy

The compiler resolves imports at pinned bases, intersects scopes, validates principals/key lineages, detects cycles, expands groups, deduplicates semantically, and emits a flat EVM-friendly plan.

The compiled plan is the normative executable object. Source syntax is authoring sugar. A published compilation binds:

```text
(sourceHash,
 effectivePlanHash,
 semanticsProfileId,
 compilerNormalizerVersion,
 immutableImportRevisionRefs)
```

This does not require everyone to trust one compiler. The semantics profile normatively defines compilation; independent implementations are conformance targets and reproduce the plan hash. A runtime verifies the authenticated compilation record or recompiles before accepting source-derived authority. If conforming implementations disagree, the profile/vectors are defective and the affected source-to-plan binding is rejected; disagreement does not “magically” stop unrelated runtimes. Unknown versions/critical fields, trailing bytes, nonzero ABI padding, duplicate canonical entries, unsorted canonical tables, invalid scope encodings, and unknown flags are rejected rather than partially interpreted.

The source revision is authenticated by its publishing principal. A public curator can sign `LensCompilationRecordV1`; a personal/local policy records the user’s acceptance of that record. The record pins the immutable import closure and the venue bases at which floating channels were locked. A gate stores or otherwise owner-pins the effective plan hash directly. Merely finding an unsigned plan that claims to compile a trusted source does not grant authority.

The compilation signature covers a domain-separated digest of every record field preceding `signature`; `LensCompilationId` hashes the complete canonical signed record. Equivalent executable semantics from a different source/provenance can share `EffectiveLensId` while having a different `LensCompilationId`.

Illustrative compiled projection:

```text
EffectiveLensV1 = {
  domain:          bytes32("EFS_LENS_POLICY"),
  version:         uint16(1),
  semanticsId:     bytes32,
  purpose:         bytes32,
  rules: [{
    scopeId:       bytes32,
    combiner:      uint8,
    threshold:     uint16,
    principals: [{ principal: bytes32, tier: uint16, flags: uint16 }]
  }],
  advisoryRules:   [...],
  discoveryRules:  [...],
  sliceCommitment: bytes32,
  resourceProfile: {...}
}
```

The simple `principal -> rank` table exists only after compiling a **query-purpose/scope slice**. The same principal can legitimately have different rank/effect through different imports for placement, metadata, mirrors, membership, advisories, and gates. Applicability is resolved by the committed lexicographic import/rule priority path, not an invented multidimensional “specificity” order; equal-path conflicting overlaps fail compilation.

An EVM call either supplies the full canonical plan, loads a small owner-stored gate plan, or supplies a slice plus a membership/order proof against `sliceCommitment`. A caller-supplied rank table without that binding is unauthenticated and cannot support a gate, receipt, or cursor claiming an `EffectiveLensId`.

Recommended identity:

```text
EffectiveLensId = keccak256(
  DOMAIN_EFS_LENS_POLICY_V1 ||
  keccak256(canonicalEffectiveLensBytes)
)
```

The outer domain/version prevents another object type or later semantics from reusing the same byte digest. The exact hash suite and algorithm-agility envelope should follow the wider EFS deterministic-ID decision; the important lens property is that the compiled semantics, not a mutable pointer, is committed.

### 4.4 Nix-style source versus lock

`FOLLOW_CHANNEL` is useful in source configuration but forbidden in an executed effective policy. Compilation resolves it to a pinned revision and records what was observed. This is the equivalent of generating a lock file.

Two clients compiling the same source at different times may produce different effective IDs if a followed channel advanced. That is correct. Their compilation records show the different locked revisions/bases; they should not pretend the source alone was reproducible.

#### Channel update protocol

A usable `LensChannelId` needs more than a mutable pointer:

```text
LensChannelStateV1 = {
  channelId,
  controllerPrincipal,
  controlEpoch,
  generation,
  sourceRevisionRef,
  previousStateRef?,
  recoveryEvidenceRef?,
  issuedAtBasisRef,
  recoveryProfileId,
  tombstone,
  signature
}
```

- `channelId` is derived from controller + domain + salt, not the latest revision.
- `sourceRevisionRef` is a locatable `LensObjectRefV1`; compilation fetches its carrier and verifies that its semantic digest is the claimed `LensRevisionId`. Channel admission does not interpret that lens object.
- `recoveryProfileId` names one closed, frozen recovery verifier implemented by the venue kernel profile; portable v1 does **not** execute an arbitrary fetched lens/policy object during admission. A future custom verifier requires an explicitly compatible kernel/profile, not a hash that the minimal kernel is expected to fetch and run.
- Genesis is control epoch/generation `(0,0)` with no previous or recovery-evidence reference. An ordinary state keeps its parent’s `controlEpoch`, has no recovery evidence, and is valid when `previousStateRef` locates an already admitted parent for the same channel/epoch, its verified digest matches the reference, and `generation = parent.generation + 1`. Validity is relative to the referenced parent, **not** the anchor’s current head.
- Any valid signed state with an admitted parent is admitted regardless of arrival order. A missing parent is `PENDING_PARENT` and retryable, not permanently rejected; invalid signatures, channel IDs, control epochs, or generation links fail. Distinct valid genesis states or two children of any admitted state make the current control epoch `CHANNEL_CONTESTED`; never choose the greatest/longest branch silently.
- An existing subscriber records the exact observed unique head and advances only to its unique next child at a later basis, preventing rollback and branch jumping. If a valid sibling is admitted later, the commutative anchor becomes `CHANNEL_CONTESTED` and following stops until explicit recovery; prior arrival order never erases the fork.
- The kernel derives `ChannelAnchorSummary` commutatively from the complete admitted state set: `EMPTY | ACTIVE | CHANNEL_CONTESTED | TOMBSTONED`, unique head ref/digest/generation when one exists, last unambiguous state, control epoch, admitted-state-set root, and optional checkpoint ref. The admitted-state-set commitment uses a frozen order-independent authenticated-set profile keyed by state digest; a venue-local append/log root may also exist but is nonsemantic.
- A valid competing branch makes `CHANNEL_CONTESTED` sticky for that control epoch regardless of transaction arrival order. Only a bounded proof accepted by the prior epoch’s frozen recovery verifier can create `controlEpoch = priorEpoch + 1, generation = 0`.
- Recovery binds an immutable, state-proof-verifiable `ChannelEpochCheckpointV1`: channel/epoch, explicit finalized venue basis, admitted-state-set root and status **at that basis**, plus the proposed new genesis/profile. The caller supplies the checkpoint/proof bodies during admission; `recoveryEvidenceRef` durably locates matching canonical bytes. Missing bodies are `PENDING_EVIDENCE` and retryable.
- Recovery validity is relative to that immutable checkpoint and proof, never to the mutable “latest old-epoch root.” Once an authorized recovery transition is admitted, the prior epoch is sealed for **current-head selection**. A valid prior-epoch sibling submitted later is still admitted into that epoch’s historical/audit set and may update its present-day audit root/status, but it cannot retroactively invalidate the recovery or compete in the new epoch. If several valid recovery transitions target the same next epoch, their distinct genesis states contest that new epoch. These rules converge under every arrival permutation.
- Ordinary descendants repeat `recoveryProfileId` unchanged; choosing a different frozen profile requires authorization by the old profile during the epoch transition. The summary has no unique accepted head while its current epoch is contested.
- A new subscriber obtains the bounded anchor summary at an explicit block/state basis and verifies it with the same kernel-codehash/state-proof trust grade as other EFS state. Under `ACTIVE` or `TOMBSTONED`, it fetches and verifies the unique head and source revision by their locatable refs; under `CHANNEL_CONTESTED`, compilation stops and no head is invented. This proves current venue state and fork status without replaying a century of updates.
- Full historical audit uses the accumulator plus durably locatable authenticated checkpoint-and-delta evidence. A deployment without the anchor summary must honestly classify fresh current bootstrap and fork-absence checking as `O(channel history)`; it does not satisfy the portable reference profile. A deployment with the summary but without checkpoints can still bootstrap current state in bounded work, but a full historical audit remains `O(channel history)`.
- Controller rotation/recovery follows the stable identity policy and is visible in provenance.
- A tombstone stops following; it does not fall back to an app default.
- Finality/fork policy and venue basis are explicit. A reorg can move a not-yet-final observation back to pending.
- Compilation pins one accepted channel state. No resolver dereferences the live channel mid-read.

### 4.5 View receipt

The exact resolution function is:

```text
resolve(
  EvidenceGraph,
  BasisVector,
  EffectiveLens,
  ReadContext,
  ResolverSemantics,
  ClockAndFreshness
) -> ResolvedView
```

A receipt commits at least:

```text
ViewReceiptV1 = {
  effectiveLensRef,
  lensCompilationRef?,
  query,
  basisVector: [{
    venueId, chainId, kernelAddress, kernelCodehash,
    blockHash, blockNumber, stateRoot,
    finalityGrade, canonicalityForkPolicy
  }],
  evaluationContext: INTERACTIVE | GATE,
  purpose: BROWSE | CITATION | REPLICATION | INSTALL | ...,
  resolverSemanticsId,
  logicalCostScheduleId,
  executionPlanIds,
  identityAndDelegationProfileIds,
  advisorySnapshotRefs,
  clockAndHorizons,
  budget,
  completeness,
  resultDigest,
  provenanceDigest,
  evidenceBundleOrWitnessRefs,
  continuation?
}
```

There is no fictional global cross-chain instant. A cross-chain result uses a basis vector, may be non-atomic, and says so. A block hash alone does not guarantee that an old remote node will still serve historical state. A century-reproducible receipt must carry or reference durably available authenticated claim bodies, slot/revocation/identity evidence, and state witnesses—or point to the full EFS state spine from which those facts can still be replayed and proven. A digest without available evidence is an audit promise, not reproduction.

#### Clock and epoch domains

No naked “epoch” or “now” is comparable across chains. Encode every temporal bound:

```text
TemporalBound = [
  clockDomain,          ; VENUE_BLOCK_TIMESTAMP / VENUE_BLOCK_NUMBER /
                        ; CHANNEL_GENERATION / KEL_CONTROL_EPOCH /
                        ; LOCAL_INTERACTIVE_WALLCLOCK
  domainRef,            ; canonical ClockDomainRef below
  value
]

ClockDomainRef =
  VENUE(VenueRef)
  | CHANNEL(LensChannelRefV1, anchorSemanticsProfileId, forkPolicyId)
  | KEL(principalId, kelHomeStateLocator, kelSemanticsProfileId, forkPolicyId)
  | LOCAL(localClockProfileId)

ClockObservation = [
  ClockDomainRef,
  basisRef,             ; exact block/state/checkpoint basis that yielded the value
  observedValue,
  observationStatus
]
```

Rules:

1. Bounds compare only when `clockDomain` and the complete canonical `ClockDomainRef` match, unless a semantics profile defines a verified conversion.
2. Claim `expiresAt`/freshness is evaluated under the explicitly named venue clock/basis. A cross-venue result carries one evaluation per relevant venue; it never takes a maximum timestamp and calls it global time.
3. On-chain `GATE` uses the executing venue’s block clock or a verified checkpoint/bridge time under the owner-pinned gate profile. Missing or incomparable time fails closed.
4. `LOCAL_INTERACTIVE_WALLCLOCK` may drive UI warnings but never an on-chain gate or portable proof without an external signed time source.
5. Channel generation is bound to a specific venue anchor and fork policy, not a naked `ChannelId`; `CHANNEL_CONTESTED` has no unique current generation for portable evaluation. A KEL epoch is likewise bound to the principal’s locatable home-state/profile/fork policy unless the principal kind uniquely fixes those fields.
6. Channel generation and KEL control epoch are logical counters/digests in their own domains, not Unix time.
7. The receipt’s `clockAndHorizons` lists every `ClockObservation`, basis, status, and freshness rule actually used.
8. A reorged/orphaned block basis changes canonicality grade. A cached receipt under that basis becomes orphaned/pending under its fork policy and is re-resolved; it is not silently treated as final.
9. Safety profiles maintain monotone local security-time/accepted-generation floors so system rollback cannot re-enable expired or superseded authority.

### 4.6 Link grammar

Use three deliberately different link forms:

| Form | Semantics | Carries |
|---|---|---|
| Ambient path | “open this path through your current policy” | locatable root/container + path |
| Sender-hinted path | “open this path with this named/compiled view if you choose” | path + `LensObjectRefV1` for effective plan, or `LensChannelRefV1` |
| Exact citation | “reproduce this claim/view at this basis” | locatable object/claim + locatable effective/compilation/receipt reference + basis |

An ordinary link should not contain fifty principal IDs. That leaks the sender’s social and moderation graph, is unwieldy, and makes private policy public to gateways/RPCs/recipients. A receiver must see when a link requests a foreign lens and must be able to open it ambiently instead.

---

## 5. Nesting, subscriptions, and resource bounds

### 5.1 Typed imports

Imports have three orthogonal dimensions:

1. **Reference mode:** `PINNED_REVISION` uses a locatable immutable revision; `FOLLOW_CHANNEL` is source-time convenience and compilation pins the observed channel state/revision.
2. **Import class:** `AUTHORITY_RULES`, `ADVISORY_RULES`, or `DISCOVERY_RULES`. Importing one class never imports the others.
3. **Transitivity:** `LEAF_ONLY` imports only the selected class of the child’s local rules and does not traverse any child import edge. `ALLOW_NESTED(maxDepth)` traverses only child edges with the same selected `importClass`, under the parent’s remaining depth/work/scope bounds; differently classed child edges are not imported by that outer edge.

Every imported rule—authority, advisory, or discovery—receives `intersection(parentImportScope, childRuleScope)`. For authority this limits accepted claim positions; for advisories it limits where labels and actions can apply; for discovery it limits which roots/kinds/purposes can be enumerated. Numeric depth/work/result/privacy budgets attenuate by the stricter remaining bound. Attenuation never changes a rule’s class, label definition, action table, or discovery mode into a more powerful one.

This can express “follow Alice’s channel for discovery only” and “pin this reviewed revision’s authority rules” without overloading one enum. The target reference kind must match the reference mode. Both transitivity cases are deterministic even when the child contains imports of several classes. There is no implicit transitive trust: “I accept Alice’s authority rules here” does not mean “I accept everyone Alice imports” unless `ALLOW_NESTED` says so, and that permission never crosses into advisory or discovery rules.

### 5.2 Compilation rules

1. Resolve all mutable channels to immutable revisions at explicit bases.
2. Build an import DAG; reject cycles before expansion.
3. Intersect parent and child scopes at every policy-bearing edge, including advisory and discovery imports; same-clock temporal windows tighten, different-clock windows remain a canonical conjunction, and numeric resource/privacy bounds take the stricter remaining value.
4. Preserve declared group/tier order.
5. Deduplicate the same principal only where scopes and effects are semantically identical; otherwise retain separate scoped rules.
6. Reject contradictory rules unless a named conflict rule resolves them.
7. Emit a provenance map from each compiled rule to its source revisions and delegation path.
8. Enforce size/depth/profile limits at compilation, never by dropping tail entries.
9. Produce a semantic diff against the previously accepted effective policy.

### 5.3 Limits

Suggested reference profile, to benchmark rather than canonize blindly:

```text
recommended import depth:       4
hard import-depth ceiling:      8
expanded principals per plan:   256
compiled authority rules:       1024
advisory principals per rule:   256
source manifest bytes:          256 KiB
compiled manifest bytes:        512 KiB
import nodes + edges:            explicit bounded profile
compiler normalization work:    explicit bounded profile
```

These are interoperability/resource profiles, not claims that identity 257 is semantically irrelevant. A larger policy can be split by purpose/scope or compiled under a higher profile. A read also has independent `maxProbes`, `scanLimit`, `maxResults`, response-byte, and gas limits.

Any limit failure returns a typed error or incomplete result with progress. The compiler memoizes repeated immutable imports and rejects exponential diamond expansion even when depth is small. Silent truncation is forbidden because it changes authority semantics. V1’s `MAX_LENSES = 20` parser behavior must not survive into v2.

### 5.4 Subscription update polarity

The current intuition “removals reduce trust and are therefore safe” is false for ordered fallback. Removing the high-priority author can expose a malicious lower-priority value. Reordering can change every contested filename.

Update policy is role-specific:

| Change | Default treatment |
|---|---|
| Add/remove/reorder namespace authority | semantic impact preview; explicit adoption for sensitive scopes |
| Add update/release authority | explicit adoption; usually threshold/root ceremony |
| Remove compromised update authority | emergency fail-safe path, monotone security floor |
| Add a deny/advisory source or stronger action | can be fail-safe for a gate if owner policy preauthorizes it; otherwise preview |
| Remove a deny source or weaken an action | prompt; expands accepted set |
| Add discovery-only source | may auto-follow within resource/privacy budget |
| Add replication target | prompt if it leaks data or incurs cost |

Every channel update should show affected scopes, principal changes, priority changes, newly reachable fallbacks, and representative changed positions. Hash changes alone are not a usable trust ceremony.

---

## 6. Failure semantics and grades

### 6.1 Per-author slot state is a prerequisite

Cross-author lens resolution begins only after each author-local slot has one exact state. Define:

```text
semanticPositionId = H(
  DOMAIN_SEMANTIC_POSITION_V1,
  claimRole,
  container/definition/list coordinates,
  target kind,
  occurrence/value key where applicable
)

slotId = H(DOMAIN_SLOT_V1, authorPrincipal, semanticPositionId)
```

This deliberately differs from the current read-spec term “Position,” which includes `(author,key)`. The new authorless object should be called `semanticPositionId` or `crossAuthorPositionId`, never the existing `positionId` without qualification.

The current envelope permits sparse, nonunique, envelope-wide `seq`. Every legitimate multi-record envelope can therefore contain several different record digests at the same `(author,seq)` while targeting different slots. That is categorically normal, not just a rare multi-device edge case.

The lowest-change coherent baseline is the current author-local LWW rule, stated without the read-spec’s false global equivocation inference:

1. Consider admitted claims for exactly `(author, semanticPositionId)`.
2. Select the total winner by `(seq, recordDigest)` as the current kernel specifies.
3. The TID admission profile bounds future time to approximately venue `now + 600 seconds`; a signer cannot jump to the protocol maximum and permanently pin the slot. A compromised same key can still keep racing, which remains the bare-EOA/KEL problem.
4. Same-`(author,seq)` records in different semantic positions are normal. Two different admitted digests at the same exact slot and the current winning sequence may set an orthogonal `SAME_SLOT_COLLISION` evidence flag and expose a bounded commitment to the alternatives, but the baseline still has one deterministic winner. A later greater sequence clears the current flag; historical collision evidence remains auditable. A high-assurance policy may choose to stop on the current flag if the kernel makes it queryable.
5. Revoking the deterministic winner yields `RELINQUISHED`/EMPTY and never resurrects the previous or alternate claim. This is deliberate, defined current behavior—not an undefined merge.
6. Additive positions use their declared set/operation semantics and do not become conflicts merely because records share a sequence.

This preserves set-union confluence, subset replication behavior, and the current storage model while fixing the categorical batch/equivocation contradiction.

An author-local predecessor/head-set model remains a serious **alternative**, not a prerequisite for lens scaling. It would represent concurrent writes as heads, merge by naming all parents, and use KEL control epochs for reset. That may better fit collaborative author intent, but it adds envelope fields, parent-list availability, conflict-set storage/enumeration, merge gas, subset-replication rules, revocation semantics, and a full vector rewrite. Price and red-team it as a separate envelope/kernel redesign before overturning LWW/empty-on-revoke.

### 6.2 Evidence states and policy transitions

Keep three vocabularies separate.

`AuthorSlotState` at one author/semantic-position/basis is one of:

- `PRESENT(value, provenance, temporalMetadata)`
- `NEVER_CLAIMED(proof/bounded slot result)`
- `RELINQUISHED(revokedHeadEvidence)`
- `UNKNOWN(reason, dependency)`
- `WHITEOUT(maskScope, provenance)`
- `HANDOFF(successor, transitionEvidence)`

`CandidateFreshness` is resolver-derived as `FRESH | STALE(profileId, clockEvidence) | UNKNOWN_FRESHNESS(dependency)`. The same policy-neutral `PRESENT` evidence can be fresh under one lens/profile and stale under another; freshness is therefore never stored as an author-slot state.

`ResolutionStatus` is `FINAL | PROVISIONAL | INCOMPLETE_BUDGET | UNKNOWN_DEPENDENCY`. `AdvisoryResult` is `UNCHANGED | WARNED | HIDDEN | DENIED/REJECTED`. Budget, freshness, and deny are not author-local evidence states.

`SUPERSEDED` and directly dereferenced `REVOKED` claims remain historical claim dispositions, not competing current slot states. Invalid/unverifiable identity or delegation evidence yields `UNKNOWN` for a source whose authority cannot be established; it is not absence.

The policy transition is total:

| Evidence state | `PRIORITY_FIRST_PRESENT` behavior |
|---|---|
| `PRESENT` + `FRESH` | select candidate and stop authority selection; an optional `SAME_SLOT_COLLISION` flag follows the rule’s declared stop/show behavior |
| `PRESENT` + `STALE` or `UNKNOWN_FRESHNESS` | stop final resolution; interactive UI may show a provisional result where allowed |
| `NEVER_CLAIMED` with complete proof | fall through |
| `RELINQUISHED` | follow the rule’s `FALLTHROUGH_ON_RELINQUISH` or `STOP` mode |
| `WHITEOUT` | mask the declared lower scope; stop |
| valid `HANDOFF` | follow only the named, verified transition rule; do not scan arbitrary lower tiers |
| `UNKNOWN` | stop final resolution; interactive UI may show a provisional result where allowed |

If the query exhausts its declared budget, the outer `ResolutionStatus` is `INCOMPLETE_BUDGET` with continuation; no author state is invented and the result is never treated as absence.

Whiteout and handoff are authenticated EFS evidence, not fallback enum values. `LensPolicy` consumes the existing planned whiteout encoding (`/.well-known/whiteout` plus ordinary REF-PIN; cross-author removal remains an advisory convention) rather than minting a second wire mechanism.

### 6.3 Interactive provisional results

Strict unknown-stops-finality is correct for gates, but one unavailable high-priority principal can otherwise wedge a large interactive view. Add:

```text
PROVISIONAL(candidate, blockedBy, provenance)
```

Rules:

- It is visibly incomplete.
- It is never serialized as the definitive winner.
- It never satisfies `GATE`.
- It retains the unresolved higher-priority dependency.
- A cache cannot upgrade it to final merely because time passed.

This gives a usable UI without turning outage into an authority change.

### 6.4 Same-sequence collision

The current corpus is contradictory: the envelope treats same-author/same-sequence/different-digest records as admitted and not duplicity, while the read-lens spec calls the condition equivocal/contested. Because `seq` is envelope-wide, one ordinary batch already creates several same-`(author,seq)` record digests; the current read rule could brand normal batched writes equivocal.

Recommended rule:

- `seq` is an author-local hint/order field and may be sparse or nonunique.
- Two claims sharing author and sequence are not a conflict merely because of sequence equality.
- Under the lowest-change LWW baseline, exact-slot alternatives are ordered by `(seq, recordDigest)`; the winner remains deterministic and a revoked winner yields `RELINQUISHED`/EMPTY without resurrecting alternatives.
- If the kernel preserves `SAME_SLOT_COLLISION` evidence, a policy may stop or warn when two different admitted digests share the exact author + semantic position + current winning sequence. That flag is orthogonal evidence, not a second winner and not a global same-sequence test; a later greater sequence clears the current flag while history remains auditable.
- A predecessor/head-set alternative would define conflict through multiple unsuperseded exact-slot heads, but only if EFS separately adopts and vectors that larger envelope/kernel redesign.
- If the product wants sequence uniqueness, redesign and enforce it at admission; do not infer it inconsistently at read time.

The lens resolver should reason about exact positions, not naked sequence numbers.

### 6.5 Revocation, relinquishment, and whiteout

Revoking or removing a high-priority claim can expose a lower-priority squatter. That may be desirable in a shell-like union overlay; it is dangerous for package names, security configuration, identity roots, and gate policy.

Each exclusive rule declares one relinquishment behavior:

- `FALLTHROUGH_ON_RELINQUISH`: ordinary overlay behavior;
- `STOP_ON_FORMER_AUTHORITY`: revocation at the authoritative tier blocks lower tiers.

`WHITEOUT` and `HANDOFF` are separate live evidence states handled by the table in §6.2, not values of this policy enum.

Resolver-derived `STALE` freshness and author-slot `UNKNOWN` never trigger fallback in a safety context. Revocation is not automatically equivalent to “lower-ranked author now becomes trusted.” The FS distinction between relinquish and whiteout should be surfaced in `LensPolicy`.

### 6.6 Advisory actions never silently reselect authority

Authority selection happens first. Advisory evidence then transforms the selected result:

```text
PRESENT -> PRESENT | WARNED | HIDDEN | DENIED/REJECTED
```

The default v1 advisory profile never falls through to a lower-ranked author after hiding or rejecting the winner. That would let a label source promote a lower malicious claim. If an application ever wants advisory-driven reselection, it needs a separately named combiner with explicit UI/gate semantics and vectors; do not smuggle it into `deny`.

### 6.7 Completeness is part of the result

Every page/result says whether it is:

- complete at the named basis and within the named policy scope;
- partial with a cursor/high-watermark;
- provisional due to unknown evidence;
- incomplete due to budget;
- cross-basis/non-atomic;
- dependent on optional acceleration but independently verifiable.

A page that returned ten matches after scanning ten postings is not equivalent to a page that returned ten matches after exhausting the index. `scanLimit` counts entries examined, not only matches emitted.

---

## 7. The unavoidable on-chain complexity choice

For an exact semantic position, a resolver must obtain enough information to answer:

> Which selected principal is the highest-priority live claimant here?

Without a trusted indexer, one of three things must exist:

1. probe the `K` selected principals;
2. enumerate the venue-local lifetime claimant roster `P_v` and intersect it with the selected principals;
3. maintain policy-specific/materialized winners.

There is no fourth data-structure trick that eliminates this information requirement. EFS should support the first two and choose the cheaper per position. It should not etch the third into the universal kernel.

Per-lens materialization is the wrong default because it creates state proportional to `(policies × positions)`, makes updates expensive, privileges popular policies, leaks policy membership, and turns a subjective view into shared permanent state. Optional materializers may publish basis-bound caches or proofs, but they are accelerators, never truth.

### 7.1 Required policy-neutral state shapes

These are the freeze-sensitive generic indices the kernel needs if EFS is to work independently on a new L3.

#### A. Current exact slot

```text
slotHead(author: bytes32, semanticPositionId: bytes32) -> SlotHeadSummary
slotRecord(claimId: bytes32) -> SlotRecord
slotCollisionSummary?(author: bytes32, semanticPositionId: bytes32) -> CollisionSummary
```

`semanticPositionId` is the canonical cross-author coordinate defined in §6.1. The baseline cheap packed summary exposes the deterministic current winner/state before the resolver requests richer records. EFS must separately decide whether optional same-slot collision evidence earns Etched storage and a bounded summary ABI. A predecessor/head-set design is a different envelope/kernel alternative, not an assumed requirement of the lens resolver.

#### B. Claimants by exact position

```text
claimantCount(venue, semanticPositionId) -> uint64
claimantAt(venue, semanticPositionId, index) -> bytes32 principal
```

Append each full principal at most once per position. Revocation does not remove history; live slot state determines whether the claimant currently contributes. `P_v` therefore means **distinct principals that have ever claimed the position at this venue**, not current/live claimants.

Roster update and first-seen dedup must be atomic with every kernel transition that can create a live slot. The authoritative count is the actual array length; an omitted claimant is a correctness failure, not a planning hint. An inflated roster can increase cost but cannot change the answer because every candidate is checked against live slot state. Any detected count/page inconsistency fails closed.

The roster can reduce candidate **slot probes** to at most the smaller execution plan, but it also costs `P_v` roster reads and rank intersection. With binary-search membership, total comparison work is roughly `O(P_v log K)`; a sorted merge is `O(P_v + K)`; a venue ordinal/rank map can approach `O(P_v)`. It is different from a global reverse posting at the target: it is keyed by the exact semantic position the combiner resolves.

#### C. Per-principal child candidate stream

```text
childCount(parent, principal) -> uint64
childAt(parent, principal, index) -> ChildCandidate
```

The stream is append-once and deduplicated by exact child position for that principal. Current slot/containment state decides whether the candidate is live. Directory reads over a lens enumerate only selected principals’ streams. The existing global structural enumeration can remain useful for global discovery, but it is not the safe plan for lens-scoped pages.

This stream returns **raw candidates**, not a magically canonical directory page. Its order is first-touch/append order, not a common name order. The specification must state direct-child versus ancestor propagation, permanent anchor versus active placement, the dedup key, whiteout behavior, cursor order, and high-watermark. The current documents do not yet do so.

The current corpus is specifically inconsistent here: the native base/holistic text assumes `childrenByAuthor`, while a later kernel amendment removes ancestor visibility machinery in favor of read-time parent walking, and freeze reservations leave related author enumeration unsettled. V2 must say whether this index contains direct structural children only or propagated visible descendants; the recommendation is direct semantic child positions only, with ancestor visibility resolved separately.

#### D. Typed target/predicate reverse index

```text
referenceCount(targetKind, targetId, definitionId, principal?)
referenceAt(targetKind, targetId, definitionId, principal?, index)
```

Backlinks, advisories, denies, mirrors, `supersededBy`, and graph navigation need the predicate/definition in the key or posting. Target ID alone is insufficient. Address, list, redirect, data, and other target domains must not collide.

#### E. Self-enumeration

An identity needs to recover everything it authored/admitted without The Graph or historical log availability. If [[efsv2/onchain-completeness]] keeps self-enumeration as core, the apparent rejection of author-filtered enumeration in [[efsv2/fs-pass-freeze-reservations]] must be reconciled before freeze.

#### F. Bounded batch/page views

All enumerators expose:

- basis/high-watermark;
- start/opaque cursor;
- `scanLimit` entries examined;
- `maxProbes` storage/slot probes;
- `maxResults` emitted;
- explicit complete/incomplete status;
- next cursor if progress is possible.

A cursor is bound to query, effective policy, venue, and basis. Reusing it under a changed policy or basis fails rather than splicing two views.

#### G. Century-scale current enumeration or explicit deferral

Append-only candidate streams preserve evidence but accumulate tombstones forever. Fair paging prevents one source from starving another; it does not let a fresh client skip 100 years of an honest author’s revoked/moved children.

Before claiming fast century-scale no-indexer bootstrap, EFS must choose and benchmark one of:

- an exact kernel-maintained current-live per-author/per-parent enumerable set;
- an authenticated current-set/compaction structure whose completeness a fresh client can verify from current state;
- a dense epoch snapshot plus exact delta with a non-omission proof and durable bytes;
- or an explicit weaker promise that first bootstrap is `O(author history)` while warm incremental reads are efficient.

This is a new freeze-sensitive state/query decision. A signed author snapshot alone cannot prove that the author did not omit an admitted live claim, and an off-chain compacted list without a state commitment recreates the indexer dependency.

#### H. Bounded lens-channel anchor

```text
channelAnchorSummary(controller: bytes32, channelId: bytes32) -> ChannelAnchorSummary
channelHistoryPage(controller: bytes32, channelId: bytes32, cursor, limit) -> states
```

Admission adds every valid parent-linked state independent of arrival order and updates the summary plus order-independent admitted-state-set root atomically. The summary’s unique head (when one exists), last unambiguous state, generation, control epoch, contested/tombstoned status, checkpoint reference, and set root are complete current state at one venue basis; a partial history page can never prove fork absence. Recovery seals an old epoch for current selection at an immutable finalized checkpoint, while later old-epoch admissions update audit history only. This state cost is the price of bounded no-indexer current bootstrap. The paged history is for audit and checkpoint deltas, not for reconstructing ordinary current state on every fresh client.

### 7.2 Never truncate principals

The proposed `author(160) | spineIdx(64) | flags(32)` posting shape is incompatible with v2’s `bytes32` and KEL/digest-shaped principal future. It is not a harmless compression. Two full identities can share the same low 160 bits and become indistinguishable.

Safe options:

- store a full `bytes32` principal in the posting; or
- store a lossless venue-local ordinal and maintain an exact `ordinal <-> bytes32 principal` dictionary.

An ordinal is a storage encoding, never a semantic identity. Any compiled ordinal plan is scoped to `(chainId, kernel address, kernel codehash/dictionary epoch)`. Results and lens manifests always expose the full principal.

The benchmark below found venue ordinals about 8.4–8.7% cheaper for one common roster read workload. Under the current EIP-2200/2929 schedule, a steady append is roughly 27.1k gas for a one-word ordinal posting versus 49.2k for a two-word full-identity posting; a bidirectional ordinal registration costs roughly 49k once, so the write-side break-even is around three postings per identity. Those are schedule/layout estimates, not freeze promises. Ordinals add mapping and portability complexity and should be adopted only after write/read/calldata totals win in the real kernel—not because 160-bit truncation seems convenient.

---

## 8. Resolution algorithms

### 8.1 Point resolution

Inputs:

- exact `semanticPositionId`;
- compiled, scope-filtered priority table `rankOf(principal)`;
- `K` selected principals;
- complete venue-local lifetime claimant count `P_v`;
- context and budget.

```text
resolvePoint(semanticPositionId, plan, basis, budget):
  P_v = claimantCount(venue, semanticPositionId)

  schedule = resolverSemantics.logicalCostSchedule
  directCost = schedule.directPriorityCost(plan, slotHeadABI)
  rosterCost = schedule.rosterCost(P_v, rankIndexShape, slotHeadABI)
  executionPlan = chooseLowestCostPlanThatFitsDeclaredBudgets(
    directCost, rosterCost, budget
  )

  if executionPlan == ROSTER:
    candidates = []
    for i in page(0, P_v):
      budget.consumeScan(1)
      principal = claimantAt(venue, semanticPositionId, i)
      rank = plan.rankOf(principal)
      if rank exists:
        candidates.push(principal, rank)
    sort candidates by semantic tier/rank
    probe live slot for candidates until combiner can decide
  else:
    probe live slot for plan principals in semantic order

  apply combiner
  attach provenance, grade, completeness, and explanation
```

`P_v < K` is not by itself a correct cost test: the roster path pays roster reads, membership/rank work, and matching slot reads, while direct priority probing may exit early. The view chooses with a measured schedule/model, and either plan must return identical semantics.

Plan selection is deterministic over declared resolver semantics, counts/index shapes, and logical `maxScan/maxProbes` budgets. It never depends on ambient EVM warmness, gas price, or RPC cache state. The receipt commits `logicalCostScheduleId` and `executionPlanId`. Warm/cold state may change transaction gas or cause the whole call to revert, but it cannot change final-versus-incomplete semantics for the same declared inputs; callers reduce/retry the page rather than accepting a different authority answer.

For `PRIORITY_FIRST_PRESENT`, the claimant scan must still evaluate higher-priority unknown/revocation dependencies correctly. The useful bound is on candidate slot probes, not total CPU/calldata: at most the chosen direct `K` probes or the roster-matched candidates, plus `P_v` roster work.

The roster optimization is valid only against a complete current-state index for the named venue/basis, or a proof/checkpoint that covers the queried position. Absence from a partial replica roster is not proof that a selected principal has no claim. In that case the resolver probes the relevant authoritative state or returns `UNKNOWN`; it never uses a small partial `P_v` to justify fallthrough.

Claimant rosters are venue-local. If applicable principals resolve authoritatively on several home chains, the client groups them by venue, obtains one complete `P_v`/slot result per required basis, then combines only after every higher-priority venue dependency is decided. There is no global claimant roster unless EFS has explicitly replicated all relevant claims into one venue.

With a sorted full-identity-to-rank table, membership/rank lookup can use binary search. For K around 50, a simple linear scan may be competitive once calldata and memory are included; benchmark both. A compiled venue-specific ordinal-to-rank vector can make intersection cheaper but is optional.

### 8.2 Directory discovery: the honest boundary

The exact directory semantics remain:

1. union the discoverable child **name/position set** from applicable principals;
2. resolve each colliding exclusive position with its declared combiner;
3. sort/render under an explicit client ordering.

But append-ordered per-author streams do not share a common total order. Therefore a stateless bounded view cannot simultaneously guarantee:

- a globally sorted/top-N prefix;
- complete first-eligible/conflict resolution;
- and bounded work across independent pages.

A stateless resolver **can** suppress duplicate exclusive positions without a `seen` set: resolve the exact position and emit it only from the winning principal’s deduplicated stream. For equal-rank conflicts, a deterministic carrier principal may emit one `CONFLICT` row; carrier byte order controls transport only and never authority. What append order cannot prove is that a later unseen candidate would not sort before rows already returned. A K-way **sorted** merge requires every stream to share a total key.

The portable core should therefore split the API.

#### On-chain raw candidate page

```text
candidatePage(parent, planSlice, cursors[], highWatermarks[], limits):
  schedule applicable author streams fairly
  for each scheduled stream:
    scan at most perAuthorScanLimit and totalScanLimit
    return (sourcePrincipal, semanticPositionId, historicalChildHint)
  return candidates + every per-author cursor + counts + basis
```

Properties:

- It is bounded and state-backed.
- The raw form never claims global sort order; an optional resolved form can emit each exclusive position once under the winner/conflict-carrier rule.
- It uses fair round-robin/deficit scheduling so one selected author with a million historical children cannot permanently starve later authors.
- It returns per-author progress even when no live result was emitted.
- Outsider spam does not enter selected author streams, though it can inflate a shared claimant roster for a hot position.
- A selected attacker can consume only its separately declared share of each page budget.

#### Deterministic SDK materialization

At one pinned venue block/state basis, the SDK:

1. exhausts or advances the required raw streams under an explicit overall budget;
2. deduplicates exact positions in local state;
3. calls adaptive point resolution for each position;
4. applies whiteout/advisory rules;
5. sorts by the requested stable presentation key;
6. caches the materialized view keyed by basis and `EffectiveLensId`;
7. emits a receipt saying complete or exactly where it stopped.

All multicalls use one fixed block tag/state basis; [EIP-1898](https://eips.ethereum.org/EIPS/eip-1898) is the relevant Ethereum RPC consistency convention. Across later blocks there is no snapshot isolation unless EFS materializes a snapshot. Sorting an incomplete materialization produces a **preview**, not a stable sorted prefix; call the order canonical only after the required candidate space is exhausted at the pinned basis.

EIP-1898 does not authenticate a remote RPC response. “Trustless” here requires the user’s own consensus-derived node, verified Ethereum state/execution proofs under a light client, or another explicitly modeled verification path. A normal hosted `eth_call` is replaceable and convenient, but trusted for response correctness unless independently checked.

#### If contract-native canonical pages are required

Globally sorted/top-N contract pages are a separate freeze-sensitive feature, not something the current streams deliver. Candidate designs include:

- a global unique name/position index sorted by a canonical key, accepting its outsider-spam/filter cost;
- a persistent authenticated trie/tree keyed by `(parent, canonicalName, kind)`;
- a policy-specific materialized snapshot/root with explicit update economics;
- a supplied sorted result plus Merkle/ZK/optimistic proof.

Each changes state, gas, privacy, or liveness materially. Price it as a separate product decision. The default recommendation is bounded state-backed candidate enumeration + exact on-chain point resolution + deterministic local materialization.

### 8.3 Adaptive plan selection

When a global unique candidate index is already small/clean, scanning it can be cheaper than selected author streams. Counts let a client choose:

```text
R_i = min(directCost_i, rosterCost_i) under the deterministic logical schedule

cost(authorStreams) ~= T + sum(i in U_T, R_i)
cost(global)        ~= G + sum(i in U_G, R_i)
```

`T` is the number of trusted-stream candidate contributions and can be `K × M` under adversarial overlap; `G` is the global-stream contribution count. `U_T` and `U_G` are the unique semantic positions discovered by the respective plans. Both plans pay adaptive point resolution for every discovered unique position and feed the same fixed-basis SDK materializer. When the unique-position sets are identical, the point term cancels for plan comparison; it must not be omitted from an absolute cost estimate. Plan selection changes cost, not semantics.

### 8.4 Denies and advisories

The current `D × 3 match keys × M items` pattern is another nested scan. Resolve advisory positions adaptively too:

```text
advisoryPosition = (definitionId, targetKind, targetId, optionalQualifier)
```

For each applicable advisory rule:

- when the complete venue-local lifetime advisory roster is cheaper than direct probes, enumerate it and intersect with the selected advisory principals;
- otherwise probe the `D` selected principals;
- resolve the signed label evidence;
- map label values to the consumer’s actions only after evidence selection.

This keeps `warn`, `hide`, `block`, and `reject` out of the labeler’s control. A label source says what it observed; the viewer/gate policy decides the consequence. The action transforms the already selected result and does not fall through to a lower authority under the baseline profile.

For large result pages, group target/predicate reverse queries can amortize work, but the exact match keys remain typed and independently checkable.

### 8.5 Graph queries

Lenses are a view over a graph, but EFS should not embed a general graph database query optimizer in the kernel.

The kernel supplies bounded adjacency primitives:

- outgoing exact slots by author/position;
- children by parent and author;
- reverse references by target kind, target, predicate, and optionally author;
- list membership and reverse membership where declared core;
- stable counts, bases, and cursors.

The client or view contract composes these into bounded one-hop/two-hop operations. Arbitrary traversal uses an explicit depth/edge/probe budget and returns continuations. A local SQLite/RocksDB/graph cache can rebuild these relations for speed. The Graph can do the same. Neither receives epistemic authority merely by answering quickly.

### 8.6 Why an included attacker cannot be made free

No exact design can guarantee cheap enumeration of an adversarial author whose unbounded stream the user deliberately selected. EFS can ensure:

- nonselected authors cannot bloat a selected principal’s candidate stream, but can inflate a shared lifetime claimant roster and force the bounded direct-`K` fallback;
- each selected author’s cost is measurable, fairly scheduled, and separately budgeted;
- duplicate and dead-posting ratios are visible;
- raw candidate pages are resumable with per-author cursors/high-watermarks;
- a policy can quarantine or demote a pathological source;
- gates use closed, bounded sets and point checks;
- an attacker cannot turn budget exhaustion into proven absence.

Claimant-roster spam and permanent state growth need separate economic measurements. The roster protects correctness and sparse-position efficiency; it does not make outsider contention free. Choosing a source authorizes consideration of its evidence, not unlimited computation.

---

## 9. Quantitative analysis and actual benchmark

### 9.1 Storage-read lower bounds

[EIP-2929](https://eips.ethereum.org/EIPS/eip-2929) charges 2,100 gas for a cold `SLOAD`. These figures are lower bounds before external calls, hashing, memory, loop logic, grade/revocation checks, and result encoding:

| Workload | Cold-read probes | Storage-read floor |
|---|---:|---:|
| one point × 50 principals | 50 | 105,000 gas |
| 64 items × 50 principals | 3,200 | 6,720,000 gas |
| 64 items × `(50 allow + 3 keys × 8 advisory)` | 4,736 | 9,945,600 gas |
| 128 items × 50 principals | 6,400 | 13,440,000 gas |
| 128 items × `(50 allow + 3 keys × 8 advisory)` | 9,472 | 19,891,200 gas |
| 256 items × 50 principals | 12,800 | 26,880,000 gas |

These are logical cold-read floors for the exact additive formula `M × (K + 3D)`, not predictions of one optimized implementation. The current v1 file branch has an additional resolved-DATA/definition nesting shape, so it must be benchmarked from code rather than summarized as a misleading `M × K × D` slogan.

[EIP-7825](https://eips.ethereum.org/EIPS/eip-7825) defines a 16,777,216 per-transaction gas cap on chains applying it. New-chain/L3 portability means EFS must discover or configure chain limits rather than hardcode mainnet assumptions; the newer [EIP-8123](https://eips.ethereum.org/EIPS/eip-8123) capability-discovery proposal is directionally useful but too new to be a required dependency.

### 9.2 Foundry experiment

An isolated benchmark was run for this review and preserved as [LensGas.t.sol](./2026-07-11-efsv2-lens-review-corpus/benchmark/test/LensGas.t.sol) with:

```text
cd Reviews/2026-07-11-efsv2-lens-review-corpus/benchmark
forge test -vv
Forge 1.7.1
solc 0.8.30
Osaka EVM
via-IR optimizer
```

The preserved amended harness reruns cleanly: **26 passed, 0 failed**. Source hashes and limitations are recorded in the corpus README.

It models a redeployable resolver making external calls to a kernel-like store. A “rich” current-slot getter returns three storage words; a two-phase getter reads a one-word head and requests rich state only on a hit. It models the current single-winner shape, not optional same-slot collision evidence or the separate predecessor/head-set alternative. Principals are digest-shaped `bytes32`. Setup writes and intrinsic transaction/calldata gas are excluded; view execution, external-call overhead, storage reads, and checksum return work are included.

| Resolver shape | K | M | Execution gas |
|---|---:|---:|---:|
| naive rich | 50 | 20 | 8,244,392 |
| naive rich | 50 | 64 | 28,333,925 |
| naive rich | 100 | 20 | 17,052,108 |
| naive rich | 100 | 64 | 62,502,074 |
| naive rich, matched `P_v=2`, winner rank 10 | 50 | 64 | 5,781,037 |
| naive rich, matched `P_v=2`, winner rank 10 | 100 | 64 | 5,785,400 |
| naive two-phase | 50 | 20 | 3,763,319 |
| naive two-phase | 50 | 64 | 13,389,687 |
| naive two-phase | 100 | 20 | 8,026,436 |
| naive two-phase | 100 | 64 | 31,235,580 |
| naive two-phase, matched `P_v=2`, winner rank 10 | 50 | 64 | 2,980,570 |
| naive two-phase, matched `P_v=2`, winner rank 10 | 100 | 64 | 2,984,933 |
| claimant roster, `P_v=2`, venue ordinals | 50 | 20 | 433,205 |
| claimant roster, `P_v=2`, venue ordinals | 50 | 64 | 1,338,318 |
| claimant roster, `P_v=2`, venue ordinals | 100 | 20 | 458,981 |
| claimant roster, `P_v=2`, venue ordinals | 100 | 64 | 1,390,597 |
| claimant roster, `P_v=2`, full `bytes32` identities | 50 | 64 | 1,465,290 |
| claimant roster, `P_v=2`, full `bytes32` identities | 100 | 64 | 1,518,037 |
| author-stream prototype priority scan | 50 | 20 | 507,344 |
| author-stream prototype priority scan | 50 | 64 | 1,495,710 |
| author-stream prototype priority scan | 100 | 20 | 533,073 |
| author-stream prototype priority scan | 100 | 64 | 1,547,839 |
| author-stream prototype full duplicate scan | 50 | 20 | 867,713 |
| author-stream prototype full duplicate scan | 50 | 64 | 2,384,270 |
| author-stream prototype full duplicate scan | 100 | 20 | 1,063,978 |
| author-stream prototype full duplicate scan | 100 | 64 | 2,633,601 |

The original worst-case naive corpus and sparse-roster corpus are deliberately different: the `K=50` naive corpus proves absence through all ranks, `K=100` finds a winner at rank 99, while the roster corpus has two live claimants at ranks 10 and 40. Those rows show cliffs, not apples-to-apples speedup ratios. Four added “matched” tests run naive and roster point resolvers over the same `P_v=2`, rank-10-winner positions.

The significant result is the shape:

- Naive rich `K=50, M=64` is already about 28.3M execution gas before deny/advisory work or real results.
- A two-phase getter helps but at about 13.4M leaves little portable transaction headroom.
- On the matched `K=50, M=64, P_v=2` point workload, the full-identity roster is 3.95× below naive rich and 2.03× below naive two-phase; venue ordinals are 4.32× and 2.23× below them. At `K=100`, the matched full-identity ratios are 3.81×/1.97× and ordinal ratios are 4.16×/2.15×.
- Increasing `K` from 50 to 100 barely moves the sparse-roster common case because its dominant work follows `P_v`; worst-case direct probing still grows with `K`.

The author-stream prototype is priority-ordered and measures scan/reconciliation work for its seeded layout. It is not the fair raw-page scheduler recommended in §8.2 and does not prove globally sorted/top-N stateless pages. A fair-scheduler benchmark remains required.

The figures are not production gas promises. Missing work includes deny/expiry/equivocation logic, full result encoding, signature/key-history proof paths, fair paging, compaction/current-set enumeration, and the exact v2 storage layout. `P_v=2` represents a sparse lifetime roster, not an adversarial or century-old maximum. The harness is preserved in the review corpus and should be promoted into the contracts benchmark suite before freeze.

### 9.3 Calldata

Flat 50-element `bytes32` arrays are not free, but storage/execution dominates the naive design. Benchmark ABI sizes were:

| Shape | K/M | ABI bytes including selector/padding |
|---|---|---:|
| naive two arrays | 50/20 | 2,372 |
| naive two arrays | 50/64 | 3,780 |
| naive two arrays | 100/64 | 5,380 |
| prototype hybrid four arrays | 50/64 | 7,108 |
| prototype hybrid four arrays | 100/64 | 11,908 |
| author-priority page | 50 | 5,060 |
| author-priority page | 100 | 9,860 |

[EIP-2028](https://eips.ethereum.org/EIPS/eip-2028) and [EIP-7623](https://eips.ethereum.org/EIPS/eip-7623) make data-heavy transaction pricing relevant, but the prototype also duplicated sorted identity/rank arrays. A canonical compiled-lens adapter can avoid that duplication. Do not prematurely encode bitmaps: a bitmap only helps after a stable, explicitly scoped ordinal universe exists.

### 9.4 Benchmark acceptance matrix

Before freeze, measure at least:

```text
K = 1, 10, 50, 100, 256
M = 1, 20, 64, 128, 256
P_v lifetime-roster distribution = 0, 1, 2, 5, K, 2K, adversarial/century-old
D = 0, 4, 8, 32
live/dead posting ratio = 100%, 50%, 10%
duplicate position distribution = none, ordinary, adversarial
identity encoding = bytes32, venue ordinal
calldata plan = raw policy, compiled adapter, cached plan
context = eth_call, transaction gate
```

Report:

- execution gas;
- calldata gas and bytes;
- persistent write gas/state bytes;
- RPC response bytes;
- probes/postings scanned;
- wall-clock in at least two clients;
- worst-case and percentile distributions from a realistic seeded corpus;
- behavior on a conservative L3 gas/RPC profile.

---

## 10. What “works on-chain” should mean

The phrase needs three explicit levels.

### Level 1 — On-chain evidence and index completeness

All evidence and policy-neutral index state needed to reconstruct the answer exists in ordinary current chain state. A fresh client with a normal node can rebuild its cache without The Graph, an EFS server, or archive logs.

This is mandatory for core EFS. It does not by itself promise fast fresh bootstrap over century-old append streams; §7.1G is an unresolved current-live/compaction freeze decision.

### Level 2 — Bounded state-backed candidate and point resolution

Reference view code can answer an exact venue-local point and return bounded candidate pages with explicit bounds, basis, completeness, and continuation. A node’s local call cap may require smaller pages, but the semantics do not change. The SDK can deterministically materialize a resolved directory at one pinned block. Stateless calls may deduplicate by winner/conflict carrier, but do not claim a globally sorted/top-N prefix.

Correctness comes from consensus-derived state, not the method name `eth_call`. A local verified node can execute directly; a remote provider response requires state/execution proofs, light-client verification, or an explicit RPC-trust grade.

This is mandatory for normal 50+ lens browsing and graph navigation.

### Level 3 — Transaction composability

Another contract can obtain the answer within the chain’s transaction gas cap. Point checks, small fixed sets, and owner-pinned gate policies should satisfy this. An arbitrary 50-principal × hundreds-of-items directory should not be promised at this level.

If a product needs wide Level-3 composition, it must choose and pay for one of:

- a policy-specific materialized root with update rules;
- a basis-bound Merkle commitment and proofs;
- an optimistic result with challenge/finality rules;
- a succinct/ZK proof system with an independently specified circuit and data-availability path.

These are optional accelerators. The basic state-backed resolver remains the source from which they are verified.

### 10.1 Gate profile

A gate policy must be:

- pinned by the resource/gate owner;
- immutable or updated through the owner’s declared governance;
- small/closed or proof-backed;
- explicit about unknown/stale/revoked behavior;
- fail-closed on incomplete evidence;
- protected against policy rollback;
- unable to accept a caller-supplied replacement policy.

The current phrase “contracts never walk lenses” should be replaced by the three levels. Contracts can resolve a bounded compiled lens; they should not recursively dereference mutable social lists during a gate transaction.

### 10.2 No log-history dependency

The owner assumption “chains do not die” removes elaborate dead-chain policy from normal lens semantics, but it does not make old logs a current-state query API. [EIP-4444](https://eips.ethereum.org/EIPS/eip-4444) itself is currently Stagnant, but Ethereum clients have already begun [partial pre-Merge history expiry](https://blog.ethereum.org/2025/07/08/partial-history-exp). Core bootstrap/recovery therefore cannot require every ordinary node to retain century-old receipts/logs.

Current keyed indices and the v2 durability spine must preserve rebuildability. Future trustless log-index proposals such as [EIP-7745](https://eips.ethereum.org/EIPS/eip-7745) may improve proofs/discovery, but EFS cannot assume every L3 has them.

---

## 11. Privacy and metadata

### 11.1 Public content does not make trust configuration public

A personal lens reveals:

- friends and communities;
- political/social associations;
- moderation sources and blocked topics;
- applications/devices in use;
- datasets of interest;
- trust priority and potential attack paths.

That graph should be private by default even if ordinary published EFS objects are public. Deliberately published curator/starter lenses are a separate mode.

### 11.2 Storage modes

Support:

1. local-only source + encrypted recovery bundle;
2. encrypted EFS object whose ciphertext and access pattern are still public metadata;
3. deliberately public curator lens/channel;
4. selective disclosure of one effective excerpt or receipt.

If a private lens is sent as calldata in a transaction, it is public forever. If passed to `eth_call`, the chain does not record it, but the RPC provider, network observer, browser/runtime, and any gateway may still learn it. The UX must not call either path “private” without a context matrix.

An unsalted `EffectiveLensId` over a small, guessable set of public identities is also a dictionary oracle. A party can enumerate likely friend/labeler sets and compare hashes. The canonical effective ID should remain deterministic **inside** the resolver/cache; a private store exposes only a randomized or keyed local handle and does not publish the deterministic ID. A secret salt helps only while it stays secret and therefore cannot make a public exact citation both reproducible and membership-private. Public citations disclose a plan/receipt only when the user deliberately chooses reproducibility over membership privacy. Exact public-EVM execution of a secret policy is impossible without a materially different ZK/FHE/secure-computation design.

### 11.3 Private membership proofs are optional later work

Merkle roots, vector commitments, accumulators, or ZK membership/nonmembership proofs could hide portions of a gate roster while proving a bounded decision. They add setup/circuit/update/prover complexity and often reveal access patterns or the final policy effect.

Do not make them a prerequisite for core lenses. First freeze exact public semantics, full-identity indices, bases, and receipts. A privacy proof can then prove the same resolver rather than invent a second policy language.

### 11.4 Recovery

An encrypted lens backup needs more than the current member list:

- source manifest and channel names;
- pinned dependency revisions/import modes;
- local petnames and purpose labels;
- compiled effective policy and last accepted ID;
- policy-update history and rollback/security floors;
- device/app delegation records;
- local overrides and advisory action mappings;
- venue high-watermarks/bases needed to resume sync;
- resolver/profile versions;
- recovery instructions and integrity metadata.

Losing local policy must not silently reinstall an app/operator default that changes what the user sees or trusts.

---

## 12. Defaults, pluralism, and monoculture

### 12.1 No universal protocol lens

There is no honest global default list of trusted humans, curators, app publishers, or moderators. Encoding one at protocol level converts EFS from user-chosen interpretation into project governance by default.

The minimum address-container baseline can be:

```text
EXACT(container owner / stable self principal)
```

Anything else is an explicitly labeled user, app, community, or resource policy.

Protocol metadata may require a separate narrow trust domain—for example, the contract/codehash and schema semantics a client supports. That is not a tail appended to every user content lens. It is part of the client’s implementation/update trust plane and should be visible as such.

### 12.2 App/operator recommendations

An app can offer:

- a starter lens;
- a curator directory;
- a moderation profile;
- a migration from an old v1 default;
- an explanation of why each source is included.

It must not silently merge its recommendations into the user’s policy. The user can fork the source, pin an effective revision, replace individual sources, or leave entirely.

Cheap exit is necessary but not sufficient to prevent monoculture. Defaults, social proof, app-store distribution, recovery flows, and link compatibility all create coordination gravity. EFS should make plurality operational:

- multiple starter packs shown without one hidden universal tail;
- forkable, content-addressed policies;
- semantic diffs rather than opaque “updated” prompts;
- independent implementations and compiler conformance;
- export/import that preserves provenance and local changes;
- no EFS-operated service required to resolve a standard lens;
- no “official” curator whose failure turns into protocol failure.

### 12.3 Published curation is speech

A public lens is a signed editorial object. It should expose:

- author/publisher;
- purpose and scope;
- exact revision/effective plan;
- change history;
- conflict/update rules;
- sponsorship or operator relationship where declared;
- whether it is intended for discovery, authority, advisory action, or a gate.

This makes curation composable without laundering it into objective protocol fact.

### 12.4 Sybil resistance belongs to the application

A static, explicit lens does not need universal Sybil resistance: the user chose its principals. Open popularity rankings, voting, “trending,” reputation, and curator markets do need an application-specific cost/identity/governance model.

Do not push those economics into `LensPolicy` kernel semantics. A curator app can publish a resulting explicit policy plus evidence/algorithm. Another app can disagree. The EFS resolver needs only deterministic membership, scope, and combining.

---

## 13. User experience

Fifty sources cannot mean fifty badges on every row. The interface should present the policy at three levels.

### 13.1 View-level summary

Show:

- view name and purpose: “James’s everyday files,” “OnionDAO dataset review,” “Strict OS updates”;
- whether it is local, subscribed, public, or sender-requested;
- last compiled revision and whether the channel has a pending update;
- high-level groups/tiers and affected scopes;
- completeness/basis status;
- privacy status: local/encrypted/public;
- a one-click ambient-view escape when a link suggests someone else’s policy.

### 13.2 Item-level explanation

For a normal winner, one compact source indicator is enough. Expand “Why this?” to show:

```text
/datasets/climate/latest.csv
  selected: Alice Research KEL
  signer: Alice laptop key 3
  delegation: Alice KEL -> device key, scope /datasets/climate/*
  rule: Curators tier / PRIORITY_FIRST_PRESENT
  evidence: venue X block Y, live slot Z
  alternatives: Bob supplied another value
  advisory: MalwareWatch says clean as of horizon H
  completeness: final at named basis
```

Always surface:

- a non-owner winner for an owner-looking path;
- equal-rank conflict;
- denied/hidden content and the action source;
- provisional/unknown/incomplete state;
- policy fallback caused by revocation/removal;
- an exact citation being rendered under a foreign policy.

### 13.3 Policy editing vocabulary

Replace generic “trust” with verbs that name the effect:

- Follow for discovery
- Accept published claims under this root
- Accept metadata from
- Use labels from
- Block when this source says
- Allow this device/app to act as me under
- Require approvals from
- Use as a lower-priority fallback
- Subscribe to policy updates

### 13.4 Update ceremony

For a new channel revision, show semantic impact:

```text
Adds 2 discovery-only sources
Removes 1 malware labeler (may re-enable 14 cached objects)
Moves Bob above Alice for /datasets/X/* (changes 3 known winners)
Adds app key K for /apps/notes/* until epoch E
No change to OS update or gate authority
```

“Hash changed” and raw principal diffs are available for experts, but they are not the primary human ceremony.

### 13.5 Sharing modes

The share sheet should offer:

1. **Share path** — recipient uses their view; private by default.
2. **Suggest my view** — share a public effective policy or minimal scoped excerpt; recipient must opt in.
3. **Exact citation** — pin object/claim, policy, and basis; warn that trust graph/provenance may be disclosed.
4. **Publish curator lens** — deliberate public editorial action, not a side effect of copying a URL.

---

## 14. How lenses fit the EFS OS

Lenses should be one policy plane used consistently across filesystem and OS surfaces, but not the only security plane.

### 14.1 Filesystem namespace

For `/people/alice/docs/x` or an address-rooted container:

- the container owner is the default exact/root authority;
- additional publishers receive scoped rules;
- directory names are discovered as a union of applicable contributions;
- exact `(parent, name, kind)` collisions use the declared exclusive combiner;
- whiteout/handoff behavior is explicit;
- the displayed path carries provenance and basis.

### 14.2 Application data

An app gets:

- an OS capability to a local/remote storage handle;
- a scoped signing/delegation key if it may publish;
- a `LensPolicy` rule governing how its claims rank in the user’s view;
- no ambient authority over unrelated paths, metadata, label policy, package updates, or wallet actions.

The signer/delegation remains visible even when the stable user principal is the semantic author.

### 14.3 Packages and updates

Do not use a casual social lens for executable updates. Package activation uses a purpose-specific policy resembling TUF:

- stable owner-controlled root;
- scoped delegated roles by package/path;
- immutable release/artifact identity;
- thresholds for high-risk roles;
- explicit expiry/security time;
- terminating/closed delegation where needed;
- independent advisory policy;
- rollback and freeze protection outside a rollbackable system generation.

The same policy language may express this, but the profile is strict: closed authorities, no unknown fallback, no discovery-only influence, and gate-safe evaluation.

### 14.4 Search and discovery

Discovery policies can be broad and forgiving because they propose candidates, not authority. A friend list, curator feed, or starter pack can populate search without allowing those principals to override exact paths.

Search results should say which discovery source led to the item and which authority rule, if any, makes it part of the resolved filesystem.

### 14.5 Moderation and malware

Labels are signed evidence with source, target, value, and basis/freshness. The user or resource policy maps them to actions. A package gate may hard-reject `malware` from a closed security committee; an interactive social feed may merely warn on the same label.

This separation supports plural moderation without pretending every labeler’s taxonomy or remedy is universal.

### 14.6 Collaboration

For collaborative content, the policy selects authorized operation authors and a named merge algebra. A lens does not make an arbitrary last-write-wins document safe. The document type must define operation identity, causality, conflict, compaction, and verification.

An ordered lens can select between whole document branches; a CRDT/merge combiner can combine operations. Those are different user choices.

### 14.7 AI/agent use

Agents need the same separation:

- a lens selects trusted context/evidence;
- capability handles control files, network, wallets, and messages;
- untrusted retrieved content remains tainted;
- a model cannot turn a cited source into authority to execute;
- every consequential answer/action can attach a view receipt and provenance.

An “agent lens” can be useful, but it must never be an ambient capability grant.

---

## 15. Threat model and failure analysis

| Threat/failure | Naive failure | Required defense |
|---|---|---|
| outsider directory spam | global scan grows forever | selected per-author raw streams; global plan only when demonstrably cheaper |
| selected-author stream flood | later honest sources starve | per-author scan budgets, fair scheduling, cursors, visible cost/quarantine |
| late duplicate/sort key across pages | winner-carrier can dedup, but a later row may sort before the prior page | label unsorted pages; local fixed-basis sort after exhaustion; or shared ordered index/snapshot |
| lens tail truncation | omitted authorities silently change winner | typed limit failure/incomplete; never truncate |
| higher authority unavailable | lower attacker becomes final | `UNKNOWN` blocks finality; interactive provisional only |
| high-rank removal/revocation | dormant lower squatter activates | explicit fallthrough/stop/whiteout/handoff; impact preview |
| caller-selected gate lens | attacker authorizes itself | risk bearer/resource owner pins gate policy |
| unscoped friend/app trust | authority crosses paths/purposes | mandatory typed scope and least authority |
| app key collapsed as user | app compromise gains full identity power | cryptographic KEL actor distinction; enforce delegation; retain signer provenance |
| same-sequence multi-device writes | false equivocation wedges view | conflict defined at exact exclusive position, not sequence alone |
| author truncated to 160 bits | two stable identities alias | full `bytes32` or lossless nonsemantic venue ordinal |
| target-only reverse index | unrelated predicates/kinds collide or require full scan | domain-separated target kind + predicate + exact position |
| mutable nested lens at runtime | nonreproducible/cyclic/unbounded gate | compile pinned imports; cycle/work bounds; effective hash |
| compiler disagreement | same source yields different authority | source binds effective plan/profile/compiler; golden vectors; fail closed |
| caller substitutes compiled slice | call claims one `EffectiveLensId` while executing another rank table | full plan, owner-stored gate plan, or slice proof against committed root |
| plan hash without basis | “same lens” yields different view | receipt pins blocks/state, clock, horizons, semantics, evidence |
| old receipt loses state | digest remains but evidence/witness is unavailable | durable evidence bundle/state witnesses or replayable full state spine |
| lens hash fingerprint | friend/moderator set guessed offline | local keyed/randomized IDs; deliberate public disclosure only |
| private policy in calldata/RPC | social graph leaks | honest context warning; local resolution; optional later proofs |
| advisory source controls action | labeler can censor universally | signed label evidence separate from consumer action mapping |
| stale local cache | revocation, KEL/delegation, semantics, reorg, or expiry change omitted | complete dependency-head vector + local timer boundaries; never one author count |
| max sequence as cache revision | late/same-seq admission invisible | monotone view-affecting mutation version/delta, not `max(seq)` |
| cursor replay | pages splice policy/venue/block | bind cursor to plan slice, query, venue, codehash, basis, high-watermarks |
| old log pruning | fresh node cannot rebuild core view | current keyed indices + full durability spine; logs are not sole index |
| century-old candidate tombstones | fresh directory bootstrap scans an author’s whole history | current-live enumerable/verified compaction, or explicit `O(history)` limitation |
| hosted `eth_call` lies | pinned block gives consistency but not authenticity | own verified node, state/execution proof/light client, or explicit RPC-trust grade |
| bridge/cross-chain non-atomicity | view claims one global instant | explicit basis vector and cross-basis grade |
| default monoculture | app operator becomes de facto truth | no universal content tail; forkable labeled starter policies |
| materializer/indexer capture | fast server becomes authority | verification against on-chain state/receipt; replaceable local cache |

### 15.1 Incremental cache invalidation

A useful no-indexer client cache is an incrementally maintained local materialized view:

```text
cache key = (
  chain/venue,
  kernel codehash,
  EffectiveLensId,
  advisory policy ID,
  query scope,
  basis/high-watermarks,
  resolver semantics
)
```

`authorHead = max(seq)` is not a sound revision token because EFS permits late lower-sequence and same-sequence admissions. A simple claim count is also insufficient: revocation may change a view without advancing that count, and KEL/delegation/policy/definition changes may alter authority without touching the content author’s stream.

Cache reuse requires a complete dependency-head vector:

```text
(
  venue block/state root + finality/reorg policy,
  kernel address/codehash/dictionary epoch,
  EffectiveLensId + compilation/channel acceptance floor,
  per-applicable-author viewMutationVersion,
  KEL/key-state versions,
  delegation/act-state versions,
  advisory-source mutation versions,
  definition/resolver semantics versions,
  bridge/replication commitment versions,
  next local expiry/freshness boundary
)
```

The proposed `viewMutationVersion(author)` must increment for every venue transition that can change an accepted claim’s slot/advisory/delegation disposition, including revokes, not merely new content claims. Its delta stream maps changes to affected semantic positions. Until that invariant and ABI are frozen, no fixed “58 checks” shortcut is sound. This remains local incremental view maintenance, not trust in a centralized indexer.

### 15.2 Cross-chain limitation

If selected stable principals have authoritative evidence on different home chains, a client can group and parallelize reads and produce a basis vector. A contract on chain X cannot synchronously inspect arbitrary state on fifty other chains without replicated commitments or bridges.

Therefore:

- cross-chain interactive/citation views are client-resolved and explicitly cross-basis;
- transaction gates use locally available replicated/bridged commitments under a gate-owner policy;
- bridge security becomes part of provenance;
- “chains do not die” does not remove asynchronous cross-chain consistency.

---

## 16. Current-corpus coherence ledger

This is the amendment list a new lens spec should close. It is intentionally precise; no item below should remain as an implicit interpretation.

| Current location/claim | Problem | vNext amendment |
|---|---|---|
| [[efsv2/owner-rulings]]: 50+ identities | conflicts with router `MAX_LENSES=20` silent truncation **and** `EFSFileView`’s independent `MAX_ATTESTERS_PER_QUERY=20` reverts/address ABI; exclusion definitions are separately capped at 8 | migrate parser + view ABI to stable `bytes32` principals; explicit compiled profile/per-call budgets; fail on excess, never truncate |
| [[efsv2/read-lens-spec]]: lens is ordered `bytes32[]` | cannot express scope, grouping, combiner, import, privacy, or purpose | replace normative input with compiled `LensPolicy`; keep flat slice as execution projection |
| [[efsv2/efs-v2-holistic-redesign]]: lens-as-LIST | mutable weighted TAG list lacks an exact snapshot and lens-specific tie/nesting/scope/combiner/update semantics | LIST may be source/editor projection; exact semantic digests live inside/alongside ordinary EFS DATA carriers |
| holistic `?lens=<listId>` vs read-lens `?lenses=` | two incompatible link grammars and mutable/exact semantics | ambient, sender-hinted, and exact-citation forms; channel/revision/effective/receipt IDs |
| semantic lens digest stored in owner/salt-addressed DATA | digest-only imports/links are not fetchable by a fresh client | locatable `(venue, carrierDataId, semanticDigest)` references and state-backed channel anchors |
| old import-mode sketch mixes snapshot/follow with delegate/discovery | reference mutability, imported rule class, and transitivity cannot be composed independently | split `referenceMode`, `importClass`, and `transitivity` fields |
| [[efsv2/codex-kinds]] weighted LIST | no rule maps weights/ties/nesting to exact lens order/effect | weights are application/source sugar unless compiler profile defines exact tier semantics |
| v1 ADR-0044 whole-LIST waterfall | first lens with any entries replaces the entire list, unlike per-element union/priority | migration profile explicitly preserves wholesale replacement or converts with an acknowledged semantic diff; add vectors for dataset curation |
| current `ReadContext` closed to `GATE` and `INTERACTIVE` | draft link/replication use could accidentally add undeclared contexts | keep citation/replication as purposes around one of the two contexts, or formally reopen and re-vector the enum |
| read-lens “deterministic” input set | omits context, policy revision, basis vector, clock/freshness, resolver version | freeze full resolution function and receipt |
| read-lens first-attester-wins everywhere | overlay rule overloaded into trust/feeds/moderation | named typed combiners per scoped semantic position |
| read-lens mirror union + holistic cross-attester fallback vs on-chain-completeness best-of-N regression | content authority, eligible mirror assertions, carrier ranking, and hash verification are conflated/partly deferred | two-stage content-then-transport policy; restore bounded on-chain best-of-N mirror view; third-party bytes accepted only against trusted content hash |
| read-lens `UNKNOWN` stop | correct but can wedge interactive view | retain finality rule; add visibly provisional display result, forbidden for gates |
| read-lens removal/subscription safety | removal can activate lower malicious fallback | semantic impact diff; explicit stop/whiteout/handoff; role-specific adoption |
| read-lens revocation fallback | unsafe for security/package/config names | fallthrough only where policy declares overlay semantics |
| read-lens full `lenses=`/`deny=` URLs | leaks social/moderation graph and produces huge links | IDs/excerpts; private local policy; deliberate exact disclosure |
| owner ruling “chains do not die” vs dead-chain branches | needless contradictory state machine | remove `DEAD` as ordinary resolution state; retain unknown/unreachable and cross-basis evidence rules |
| [[efsv2/codex-envelope]] same sequence is nonunique/envelope-wide vs read-lens equivocation | every ordinary multi-record envelope can have several different record digests at one `(author,seq)` and be falsely branded equivocal | scope any collision signal to the exact author + `semanticPositionId`; same-sequence records in different positions are normal; retain current `(seq,recordDigest)` LWW unless a separate redesign overturns it |
| current argmax slot winner + empty-on-revoke | behavior is defined and confluent, but digest LWW hides alternatives and revoking the winner deliberately leaves EMPTY rather than resurrecting an older value | lowest-change baseline documents those semantics plus the bounded future-TID rule; decide whether optional same-slot collision evidence earns state; price predecessor/head-set as a separate envelope/kernel alternative |
| read-lens “contracts never walk lenses” | ambiguous against no-indexer/on-chain requirement | three capability levels; compile before gate; exact point + raw candidate primitives on-chain |
| proposed B4 `author(160)` | truncates KEL/digest identities | full `bytes32` or explicit lossless venue ordinal; never semantic truncation |
| [[efsv2/deterministic-ids]] `uint160(author)` in `dataId`/`listId`/`slotId` formulas vs substrate full `bytes32` identity ruling | truncation already exists in semantic ID derivation, not only B4 postings | redesign and re-vector every affected formula with full principal identity before freeze |
| B4 target posting lacks predicate/live semantics | typed reverse queries remain global scans/inflatable | index by target kind + target + definition/predicate; slot state supplies live truth |
| tempting reuse of B4 reverse postings as a claimant roster | target backlinks are not exact-position claimant discovery; current corpus does not actually claim they are | add a distinct domain-separated `claimantsBySemanticPosition` mapping only if the measured freeze bundle accepts it |
| [[efsv2/codex-kernel]] global discovery/parent-walk amendment vs holistic/native per-author children assumption | per-author lens-safe enumeration and direct-child/ancestor semantics are not coherently frozen | specify direct-child `childrenByAuthor`, ancestor visibility, dedup, liveness, and exact Etched status |
| [[efsv2/fs-pass-freeze-reservations]] B7 rejects author enumeration vs [[efsv2/onchain-completeness]] self-enumeration core | recovery and cache invalidation have no stable ruling | separate per-parent author candidates, global author spine/self-recovery, and rejected broad query shapes |
| append-ordered per-author streams | winner-carrier dedup is possible, but canonical sorted/top-N stateless pages are not | candidate/resolved-unsorted ABI + fixed-basis SDK materializer; separate ordered-index decision if required |
| append-only per-author streams over 100 years | fair paging still scans honest historical tombstones on fresh bootstrap | exact current-live enumerable/compaction commitment, or explicit `O(history)` first-bootstrap limitation |
| current holistic/read-lens defaults `[segmentAddr/containerAuthor, caller/viewer, system,…]` plus old v1 priority ADRs | conflicts with the recommended exact owner baseline and no universal content tail | explicitly supersede for v2; separate content authority from narrow system-metadata trust; app/operator policies stay labeled/user-controlled |
| mutable lens subscription | source revision and executed semantics conflated | source/channel -> pinned immutable imports -> effective plan; bind compilation tuple |
| naked `EvidenceEpoch`/clock/freshness | cross-chain time bounds are incomparable and reorg behavior is implicit; imported scopes can accumulate constraints from several clocks | domain-tagged `TemporalBound`, conjunctive `TemporalWindow` sets in scopes, per-venue evaluation, receipt clock vector, fork/finality/security floors |
| one global rank per principal | scoped imports can give same principal different authority | compile purpose/scope-specific slices with defined overlap algebra |
| freeze-sensitive `act` scope grammar vs lens `Scope` | two attenuation grammars could disagree about app/KEL delegation authority | one shared canonical scope algebra and cross-vectors; lens acceptance remains distinct from capability to publish |
| device keys placed directly in lens | rotation/session churn changes semantic priority | stable lineage + enforceable scoped delegation + signer provenance |
| current identity doctrine says “No ERC-1271” | generic Ethereum contract-signer advice would contradict stable portable authorship | v1 lens authors remain accepted EFS/KEL-style `bytes32` principals; contract authors require a separate overturning review |
| current read-spec `Position=(author,key)` vs new authorless claimant key | terminology collision can make roster key useless | call it `semanticPositionId`; derive `slotId=H(author,semanticPositionId)` with vectors |
| EFS DATA ID is owner/salt-derived | “content-addressed lens” can be mistaken for the DATA object ID | semantic lens digests live inside/alongside ordinary DATA carrier IDs |
| “on-chain directory page” shorthand | overclaims sort/snapshot properties | distinguish candidates, dedup-by-winner rows, exact points, local sorted materialization, and optional authenticated snapshot |

### 16.1 Documents that need coordinated amendment

At minimum:

- [[efsv2/read-lens-spec]] — replace the flat universal model with policy/compiler/resolver semantics.
- [[efsv2/codex-envelope]] — settle sequence and exact-position conflict semantics.
- [[efsv2/deterministic-ids]] — remove existing `uint160(author)` truncation and re-vector full-principal IDs.
- [[efsv2/codex-kernel]] — reserve exact required state/index/ABI shapes and clarify redeployable views.
- [[efsv2/onchain-completeness]] — add raw-candidate versus resolved-directory distinction.
- [[efsv2/onchain-graph-queries]] — type reverse indices and place claimant/author streams correctly.
- [[efsv2/fs-pass-freeze-reservations]] — reconcile B4/B7 and price the index bundle.
- [[efsv2/fs-pass-synthesis]] — surface union-name versus exclusive-position and whiteout/handoff behavior.
- [[efsv2/identity]] — define stable principal versus signer/delegated actor.
- the freeze-sensitive `act` scope grammar — share one canonical attenuation algebra with lens scopes.
- [[efsv2/privacy]] — classify lens source, effective ID, calldata, RPC, cache, link, and recovery leakage.
- [[efsv2/efs-v2-holistic-redesign]] — replace mutable lens-as-LIST shorthand and link grammar.
- [[efsv2/ops-doctrine]] — define cache/index rebuild and fixed-basis RPC behavior.
- client/OS designs — separate display policy, app capabilities, decrypt authority, and update trust.

No one-file lens edit can make the system coherent. The model crosses kernel state, identity, filesystem semantics, graph APIs, privacy, links, and OS ceremonies.

---

## 17. Research synthesis: what to borrow and what not to borrow

### 17.1 Namespace, authorization, and policy systems

| System/concept | Useful lesson for EFS | What not to import blindly | Primary source |
|---|---|---|---|
| Plan 9 private/union namespaces | one shared resource universe can yield process-local namespaces; union directories concatenate components and lookup takes the first match | Plan 9 does not supply EFS exact-position dedup/conflict or hostile global-index semantics | [Plan 9 system](https://9p.io/sys/doc/9.html), [namespaces](https://9p.io/sys/doc/names.html) |
| SDSI | linked local names and groups avoid one global naming authority | name resolution alone does not specify EFS combining, freshness, or privacy | [Rivest/Lampson SDSI](https://people.csail.mit.edu/rivest/pubs/RL96.ver-1.1.html) |
| SPKI | authorization is verifier-controlled and certificates can be scoped/delegated | certificate-chain validity is not a complete filesystem view | [RFC 2693](https://www.rfc-editor.org/rfc/rfc2693) |
| KeyNote | monotonic local trust-management assertions and explicit policy compliance | a generic assertion language may be too heavy/opaque for the Etched resolver | [RFC 2704](https://www.rfc-editor.org/rfc/rfc2704) |
| RT family | typed roles, linked role expressions, and credential discovery clarify trust graph semantics | unrestricted role intersection/delegation can make compilation/query cost unpredictable | [RT framework](https://theory.stanford.edu/people/jcm/papers/rt_discex03.pdf) |
| Zanzibar/ReBAC | relationship tuples, revision tokens, consistency, and explainable authorization graphs | global service assumptions, centralized tuple storage, and massive server infrastructure | [Google Zanzibar paper](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/) |
| Cedar | explicit principal/action/resource/context policy and forbid-overrides-permit discipline | central application schema/engine as a required EFS dependency | [Cedar](https://cedarpolicy.com/), [authorization model](https://docs.cedarpolicy.com/auth/authorization.html) |
| XACML | “first applicable” is one combiner among several; combining algorithms must be named | XML/general enterprise policy complexity and ambiguous extension ecosystems | [OASIS XACML 3.0](https://docs.oasis-open.org/xacml/3.0/xacml-3.0-core-spec-cos01-en.html) |
| CSS cascade | deterministic precedence can be typed by origin, layer, specificity, and order rather than one global score | CSS rules are presentation-specific; Level 6 scope work is exploratory, not a security-policy standard | [CSS Cascade Level 5 CR](https://www.w3.org/TR/css-cascade-5/), [Level 6 Working Draft](https://www.w3.org/TR/css-cascade-6/) |

**Synthesis:** use a deliberately small typed policy algebra. Scope and purpose first; combiner second; declared tier/order only inside the applicable slice. Keep the compiled execution plan auditable enough to explain without a general theorem prover.

### 17.2 Reproducibility, delegation, and update security

| System/concept | Useful lesson | EFS adaptation | Primary source |
|---|---|---|---|
| Nix flakes/lock graph | floating source references resolve to a transitive locked graph | channel/revision/effective policy/compilation/receipt identities | [nix.dev flakes](https://nix.dev/concepts/flakes.html), [stable lock-file manual](https://nix.dev/manual/nix/stable/command-ref/new-cli/nix3-flake.html#lock-files) |
| TUF | root roles, thresholds, scoped ordered delegations, termination, expiry, rollback/freeze defense | a strict `GATE`/package lens profile separate from social browsing | [current TUF specification](https://theupdateframework.github.io/specification/latest/), [metadata model](https://theupdateframework.io/docs/metadata/) |
| KERI/KEL | self-certifying stable identifiers and key-event state motivate stable-principal rotation | ToIP released KERI specification v1.1 on 2026-01-21, but KERI is still not an Ethereum or EFS standard; EFS must freeze its own deliberately selected identity profile/vectors rather than inherit an evolving suite implicitly | [ToIP KERI v1.1 specification](https://trustoverip.github.io/kswg-keri-specification/), [ToIP deliverables/release date](https://www.trustoverip.org/our-work/deliverables/) |
| GnuPG Web of Trust | owner trust and key validity are different judgments | distinguish “I trust this curator’s judgment” from “this signer/key is valid” | [GnuPG manual](https://www.gnupg.org/documentation/manuals/gnupg24/gpg.1.html), [handbook](https://gnupg.org/gph/en/manual.html) |
| SLSA/in-toto style evidence | provenance statements do not themselves define who the verifier trusts | package lens selects acceptable builders/rebuilders/advisories; evidence remains separate | [in-toto](https://in-toto.io/), [SLSA](https://slsa.dev/spec/) |

Nix flakes remain explicitly experimental in current Nix documentation. EFS should borrow the source/lock distinction, not claim that one Nix interface is a finalized universal standard.

### 17.3 Graph and data representation

| System/concept | Useful lesson | EFS adaptation | Primary source |
|---|---|---|---|
| RDF datasets/named graphs | datasets demonstrate keeping multiple graphs separate | RDF 1.2 (currently a Candidate Recommendation Snapshot) does not make a graph name denote its graph or define provenance; EFS must define author/venue/basis semantics itself | [RDF 1.2 Concepts](https://www.w3.org/TR/rdf12-concepts/) |
| deterministic CBOR | canonical bytes require more than compatible decoding | freeze an EFS-specific deterministic profile and rejection rules | [RFC 8949](https://www.rfc-editor.org/rfc/rfc8949.html) |
| DAG-CBOR/IPLD | useful content-addressed restrictions and link conventions | adopt only rules EFS states normatively; do not outsource the whole semantic profile | [DAG-CBOR specification](https://ipld.io/specs/codecs/dag-cbor/spec/) |
| incremental view maintenance | derived views can update from small input deltas | local cache keyed by policy/basis and a complete dependency-head vector + exact deltas | [DBToaster paper](https://www.vldb.org/pvldb/vol5/p968_yanifahmad_vldb2012.pdf), [Differential Dataflow](https://www.microsoft.com/en-us/research/publication/differential-dataflow/) |
| roaring/bitmap indexes | dense ordinal sets can be fast locally | use in replaceable caches or measured venue encodings, not portable semantic identities | [Roaring publications](https://roaringbitmap.org/publications/) |

The graph-database lesson is to store policy-neutral adjacency and provenance, then materialize query-specific views. Trying to store every lens-resolved graph onchain duplicates subjective state; trying to store only raw events makes bootstrap depend on a century scan.

### 17.4 Social, moderation, and curation systems

| System | Useful lesson | Failure/limit to avoid | Primary source |
|---|---|---|---|
| AT Protocol labels | signed free-standing label evidence; consumers subscribe and apply policy | labeler/default concentration and transport limits should not become EFS semantics | [label spec](https://atproto.com/specs/label), [moderation guide](https://atproto.com/guides/moderation) |
| Nostr lists | public and encrypted list forms; simple replaceable follow/mute/people sets | relay event retrieval is not current-state on-chain queryability; replaceable events alone do not define scoped authority | [NIP-51 lists](https://github.com/nostr-protocol/nips/blob/master/51.md), [NIP-02 follows](https://github.com/nostr-protocol/nips/blob/master/02.md) |
| Bluesky starter packs | people want shareable curated onboarding bundles | a starter pack is discovery/curation, not automatic authority; the launch-era 150-person/3-feed product limit illustrates that product caps are not protocol truth | [Starter Packs launch post](https://bsky.social/about/blog/06-26-2024-starter-packs) |
| Mastodon collections | follows/lists/filters are distinct user collections | do not compress follow, list, moderation, and publication authority into one “trust” toggle | [Mastodon client collections](https://docs.joinmastodon.org/client/collections/) |
| Farcaster links | protocol-enforced per-type link counts demonstrate abuse/resource tradeoffs | a social product cap must not become EFS’s semantic lens ceiling | [Link storage discussion](https://github.com/farcasterxyz/protocol/discussions/85) |
| Lens ecosystem | modular social actions/graphs show demand for portable social primitives | product/platform nomenclature must not substitute for exact EFS policy semantics | [Lens architecture](https://lens.xyz/news/introducing-the-new-lens) |

The Nostr public/private list split is especially relevant: personal policy configuration is sensitive, while public curation should be a deliberate publish act. EFS needs stronger exact resolution and state-backed enumeration than a relay protocol, but can preserve that user-facing distinction.

### 17.5 Ethereum standards and constraints

| EIP/ERC/primitive | Lens relevance | Ruling | Primary source |
|---|---|---|---|
| EIP-712 | human-readable typed signatures for source/compilation/update acceptance | use for wallet ceremonies where compatible; canonical EFS bytes remain independently specified | [EIP-712](https://eips.ethereum.org/EIPS/eip-712) |
| ERC-1271 | contract signatures are an important Ethereum alternative | current EFS identity explicitly rejects state-dependent contract authors; revisiting that requires a separate venue/code-state/portability design | [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271) |
| ERC-5267 | retrieves EIP-712 domain metadata | useful for clear domain binding; never let domain upgrade make old policy ambiguous | [ERC-5267](https://eips.ethereum.org/EIPS/eip-5267) |
| EIP-1186 | account/storage proof RPC | useful state-proof building block for remote verification; does not by itself prove arbitrary view execution or enumeration completeness | [EIP-1186](https://eips.ethereum.org/EIPS/eip-1186) |
| EIP-1898 | JSON-RPC block-hash state query convention | pin multicall pages consistently where supported; it does not authenticate remote RPC answers | [EIP-1898](https://eips.ethereum.org/EIPS/eip-1898) |
| EIP-2200/2929 | storage write/read metering | benchmark exact index layouts; cold probes make nested `M×K` expensive | [EIP-2200](https://eips.ethereum.org/EIPS/eip-2200), [EIP-2929](https://eips.ethereum.org/EIPS/eip-2929) |
| EIP-2028/7623 | calldata and data-heavy transaction pricing | compiled/cached plan adapters can reduce repeated lens calldata | [EIP-2028](https://eips.ethereum.org/EIPS/eip-2028), [EIP-7623](https://eips.ethereum.org/EIPS/eip-7623) |
| EIP-7825 | per-transaction cap | keep gates small; do not promise giant transaction-native directories | [EIP-7825](https://eips.ethereum.org/EIPS/eip-7825) |
| EIP-8123 | proposed RPC discovery of transaction cap | useful future capability hint; do not require it for portable EFS | [EIP-8123](https://eips.ethereum.org/EIPS/eip-8123) |
| EIP-4444 / deployed partial expiry | old history cannot be assumed at every ordinary node | the EIP is Stagnant, but partial pre-Merge history expiry is deployed; core query/recovery needs current state/spine, not old logs only | [EIP-4444](https://eips.ethereum.org/EIPS/eip-4444), [Ethereum Foundation implementation note](https://blog.ethereum.org/2025/07/08/partial-history-exp) |
| EIP-7745 | proposed trustless log/tx index | promising optional future discovery/proof substrate, unavailable as a universal L3 assumption | [EIP-7745](https://eips.ethereum.org/EIPS/eip-7745) |
| EIP-2930 | access lists | modest discount only after keys are known; does not solve lens intersection | [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) |
| EIP-1153 | transient storage | useful for state-changing transaction scratch space, but `TSTORE` is not available under static context and cannot be the portable view dedup answer | [EIP-1153](https://eips.ethereum.org/EIPS/eip-1153) |
| EIP-2537/BLS | aggregate signature operations | admission may benefit elsewhere; it does not reduce state probes after signatures are admitted | [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) |
| OpenZeppelin Merkle/bitmap utilities | implementation precedents for proofs/ordinal sets | optional accelerators; neither discovers an unknown intersection by itself | [cryptography](https://docs.openzeppelin.com/contracts/5.x/api/utils/cryptography), [BitMaps](https://docs.openzeppelin.com/contracts/5.x/api/utils#BitMaps) |

Ethereum gas schedules continue to evolve. Freeze semantic bounds (`maxProbes`, explicit incomplete) and benchmark chain profiles; do not freeze conclusions that rely on one fork’s exact gas price.

### 17.6 Tempting techniques that do not solve the core problem

| Technique | Why it is insufficient as the core |
|---|---|
| Bloom filter | false positives cannot prove absence, so it cannot justify priority fallthrough |
| Merkle/sparse-Merkle root | proves supplied membership/nonmembership but does not discover which of K principals claim an unknown position |
| cryptographic accumulator | same discovery problem; dynamic witness availability becomes infrastructure |
| BLS aggregation | reduces signature verification, not slot/index reads after admission |
| bitmap alone | requires a stable ordinal universe and still needs semantic priority/rank |
| per-lens kernel cache | state explosion, update fanout, privacy leakage, popular-lens privilege |
| The Graph | excellent replaceable accelerator; unavailable/untrusted as a universal source of completeness |
| ZK resolved-view proof | powerful optional accelerator, but prover/data availability/circuit version become new dependencies |
| EVM transient seen set | cannot provide cross-call/page memory; static-view constraints remain |
| cross-author latest-wins | author clocks/sequences are not comparable and are attacker-controlled |
| dynamic reputation score | Sybil/opacity/reproducibility/indexer problems; policy becomes an oracle |

---

## 18. Freeze package

### 18.1 Decisions recommended now

These are coherent enough to adopt as direction:

1. `EvidenceGraph -> EffectiveLens -> ResolvedView` is the normative architecture.
2. “Lens” remains the user word; `LensPolicy`/`EffectiveLens` and `ViewReceipt` are technical terms.
3. Authority is always typed/scoped; display, discovery, advisory, capability, and decryption are separate.
4. `PRIORITY_FIRST_PRESENT` is one combiner for exclusive overlay positions, not universal trust.
5. Mutable channel, immutable source revision, executable effective semantics, signed compilation record, and exact view receipt have separate identities.
6. Source imports compile to pinned immutable snapshots; the compiled plan is normative executable semantics.
7. No runtime recursive social-list walking in a transaction gate.
8. No silent truncation anywhere in parsing, compilation, querying, or paging.
9. Full stable principal identity survives every semantic boundary.
10. Exact single-venue point resolution may choose a measured cheaper direct-priority or complete lifetime-roster plan; the plans have identical semantics.
11. On-chain core exposes bounded candidate enumeration and exact venue-local point resolution; fixed-basis SDK materialization supplies sorted ordinary directories. Remote RPC correctness is separately verified or graded.
12. Personal policy is private/local or encrypted by default; public curator policy is deliberate.
13. Resource/gate owner pins gate policy; caller cannot self-select it.
14. Unknown never becomes absence; interactive provisional answers never satisfy gates.
15. Content authority resolves before transport; restore the bounded on-chain best-of-N mirror view and verify every fallback carrier against the trusted content hash.

### 18.2 Decisions that require a measured freeze choice

1. Whether same-slot collision evidence needs an Etched bit/view under the current LWW/empty-on-revoke baseline; any predecessor/head-set alternative requires its own measured envelope/kernel redesign, confluence/reset rules, and vectors.
2. Exact `semanticPositionId` grammar for every exclusive claim role, plus `slotId = H(author, semanticPositionId)` vectors.
3. Whether `claimantsBySemanticPosition` earns permanent state cost, after the full gas/write/read/spam bundle benchmark.
4. Exact semantics and Etched status of `childrenByAuthor`.
5. Separate global author spine/self-enumeration design and B7 reconciliation.
6. Full-identity postings versus lossless venue-local ordinals.
7. Predicate/target-kind reverse index word/key shape.
8. Packed current-slot summary/batch ABI and, if chosen, bounded same-slot collision evidence.
9. Reference policy/compiler resource profiles and the channel-anchor/checkpoint storage profile.
10. Exact current-live author/parent enumeration or compaction needed for fast century-scale fresh bootstrap.
11. Whether contract-native globally sorted/top-N directory pages are actually a requirement. If yes, choose and price a new ordered index/materialization/proof design.
12. Gate profile maxima by chain deployment profile.

### 18.3 Do not freeze until

- same-sequence and exact-slot collision semantics are one rule across envelope, kernel, resolver, and client;
- the per-author exclusive-slot LWW/revocation ABI is total, including optional collision behavior when that capability is present;
- exact-position identity is specified and collision-tested;
- all principal encodings round-trip `bytes32` without truncation;
- source/plan/receipt hashing has cross-language golden vectors;
- scope overlap, explicit import/rule priority paths, tiers, equal-rank conflict, and dedup algebra are normative;
- every public import/link has a state-backed locator plus verified semantic digest;
- clock domains, temporal comparisons, reorg/finality handling, and security floors are normative;
- mutable imports cannot enter executed plans;
- channel generation/fork/rollback/recovery/finality semantics are specified;
- compiler cycle, diamond, exponential work, and unknown-version behavior fail closed;
- candidate/resolved-unsorted pages are not mislabeled as canonical sorted prefixes;
- cursor/basis/high-watermark semantics survive append-between-pages tests;
- revocation/removal fallback is explicitly per scope;
- advisories cannot silently promote a lower authority;
- privacy claims include URL, hash dictionary, calldata, RPC, cache, and recovery observers;
- the actual kernel benchmark covers 50/100/256 principals and adversarial streams;
- century-old honest tombstones have an accepted current-live/compaction story or an explicit `O(history)` bootstrap limitation;
- the B4/B7/on-chain-completeness reservations agree.

---

## 19. Required conformance and adversarial vectors

### 19.1 Canonical encoding/compiler

1. Empty, one-rule, max-profile, and multi-purpose policies have fixed expected bytes/hashes.
2. Map-order, integer-width, duplicate-key, indefinite-length, Unicode, trailing-byte, nonzero-padding, and unknown-critical-field vectors.
3. Same source imported through a diamond compiles once with deterministic provenance.
4. Mutable-channel cycle, immutable cycle, maximum-depth fanout, and shallow exponential graph all fail within a bounded compiler budget.
5. Duplicate principal with disjoint, identical, nested, and partially overlapping scopes.
6. Equal-rank exclusive values produce conflict, never address/hash tie-break authority.
7. Authenticated compilation record binds source/effective hash/profile/compiler/import revisions/bases; a mismatch is rejected by conforming runtimes.
8. `PINNED_REVISION`/`FOLLOW_CHANNEL` × authority/advisory/discovery × leaf/nested import matrix compiles without semantic aliasing.
9. Every public reference fetches by venue/carrier and verifies semantic digest; hash-only bootstrap, wrong carrier bytes, and unavailable carrier fail explicitly.
10. Permute arrival order for genesis, linear updates, late siblings, temporarily missing parents/evidence, recovery checkpoints, and recovery states: every valid state is eventually admitted, each epoch’s set derivation converges, a late current-epoch sibling contests an existing subscriber, and an authorized checkpoint-bound recovery seals the old epoch for current selection. A late sealed-epoch sibling changes audit history only; competing next-epoch recoveries contest. A new subscriber obtains bounded current/fork state from a state-proof-verified anchor summary; no partial page proves fork absence.
11. Temporal bounds compare only within identical complete `ClockDomainRef` values; naked channel IDs, mismatched venue anchors/KEL homes/fork policies, contested channels, orphaned bases, and security-floor rollback fail closed.

### 19.2 Identity and delegation

1. KEL rotation key signs as stable principal and preserves semantic rank.
2. Scoped app actor’s claims cannot exceed root/predicate/claim-role/expiry delegation scope; OS write capability is tested separately.
3. Result retains stable principal, signer, and delegation chain.
4. Revoked app/device produces unknown/revoked per basis, never lower fallback unless declared.
5. Same `(principal, seq)` records in different positions are normal. Under the baseline, exact-slot alternatives choose the greatest `(seq,recordDigest)`; an optional same-slot collision flag is deterministic, the TID future bound is enforced, a compromised current key can still race until KEL recovery, and revoking the winner yields EMPTY without ancestor resurrection. Run separate branch/merge vectors only if the predecessor/head-set alternative is adopted.
6. Full digest identities differing only in the top 96 bits remain distinct through posting, roster, cache, receipt, and URL/citation projections.

### 19.3 Point resolution

For `K = 1, 10, 50, 100, 256` and complete venue-local lifetime `P_v = 0, 1, 2, 5, K, 2K`:

- winner at each rank;
- all absent;
- all revoked;
- stale/unknown rank 1;
- equal-rank conflict;
- budget ending before decision;
- roster path and direct-probe path return identical semantics/provenance;
- an inflated but otherwise complete roster affects planning cost but not truth;
- an omitted claimant/undercount violates the atomic kernel invariant and fails conformance/correctness.

### 19.4 Directory/raw enumeration

1. 50 principals × 100 names: disjoint, all-overlap, and mixed distributions.
2. One selected author with 1,000,000 unique historical children; later authors still make progress through fair scheduling.
3. Duplicate name contributions separated by many pages; raw API remains honest and fixed-basis SDK emits one resolved position.
4. Global container poisoned by 100,000 outsider names; selected-author plan cost is unchanged.
5. One selected author poisoned; only its budget share is consumed and result is explicitly incomplete until continued/quarantined.
6. Empty-result pages still advance/report scanned entries and every cursor.
7. Append between pages under fixed high-watermarks cannot corrupt the scan; replay under a new plan/parent/block/venue/version fails.
8. A test demonstrates winner/conflict-carrier stateless dedup, and separately proves that append-ordered pages are not a globally sorted/top-N prefix.
9. Century-old honest tombstones exercise the chosen current-live/compaction path or document the measured `O(history)` bootstrap.

### 19.5 Update/fallback/advisory

1. Remove rank 1 and reveal malicious rank 2: safety policy stops/prompts; overlay policy falls through only if declared.
2. Revoke rank 1 with a lower squatter: `STOP` and overlay relinquishment modes differ; separately encoded `WHITEOUT` and `HANDOFF` evidence produce their specified stop/transition result.
3. Advisory removal re-enables malware and therefore requires the configured review path.
4. Signed label evidence stays constant while two consumer action policies yield warn versus reject.
5. Discovery-only import cannot influence an exclusive winner or gate.
6. Winning content’s primary mirror unavailable: an eligible third-party carrier with matching content hash succeeds; wrong-hash bytes fail; no lower content author is promoted.

### 19.6 Privacy

1. Demonstrate dictionary recovery of an unsalted hash over a small public membership set.
2. Document/automate calldata, RPC, gateway, local-cache, and link observer tests.
3. Public curator policy and private personal policy never share an implicit publication path.
4. Recovery restores the last accepted effective policy and security floor without contacting an official service.

### 19.7 On-chain/gas

1. Run the matrix in §9.4 on the actual kernel, not only the isolated model.
2. Include write-state cost and chain-state growth for claimant, author, child, and reverse indices.
3. Include result ABI, advisory rules, KEL verification, expiry, conflicts, and cursor construction.
4. Test at conservative node `eth_call` and transaction caps on a fresh L3 deployment.
5. Verify no function silently changes semantics when a budget is exceeded.
6. Verify remote responses with the selected state/light-client proof path or grade them RPC-trusted.
7. Benchmark bounded best-of-N mirror selection and prove it requires no external indexer.

---

## 20. Proposed migration and implementation sequence

### Phase 0 — settle semantics before storage

1. Write the lens constitution and terminology.
2. Define purposes/scopes and typed combiners.
3. Confirm and vector the bounded current LWW/empty-on-revoke baseline while removing global same-sequence equivocation; separately decide whether same-slot collision evidence or a predecessor/head-set alternative justifies its storage and semantic cost.
4. Define revocation/relinquish/whiteout/handoff.
5. Define channel/revision/effective/compilation/receipt identities, locatable carrier references, and link forms.
6. Define temporal clock domains, comparison, finality/reorg, and security floors.

### Phase 1 — reference compiler and vectors

1. Freeze deterministic source and effective-plan grammars.
2. Implement two independent compilers, preferably Rust and TypeScript first.
3. Publish golden/negative vectors and semantic-diff fixtures.
4. Build the scope-slice/rank representation used by Solidity views.
5. Add private local policy storage/export/recovery before public subscriptions.

### Phase 2 — index prototype and gas bundle

In a non-Etched prototype:

1. implement exact-semantic-position lifetime claimant roster with atomic completeness invariant;
2. specify/implement per-parent author candidate streams;
3. implement author spine plus a complete view-affecting mutation/delta mechanism for cache invalidation;
4. implement typed reverse index;
5. compare full identities and venue ordinals;
6. implement head/batch slot getters;
7. run the full benchmark/adversarial corpus;
8. prototype current-live enumeration/compaction for century-old author streams;
9. price writes, reads, calldata, state growth, and long-horizon recovery as one bundle.

Do not independently approve the cheapest-looking index if the combination still leaves a core query dependent on The Graph.

### Phase 3 — portable resolver

1. exact venue-local point resolver with measured adaptive direct/complete-roster execution;
2. fair candidate-page plus optional dedup-by-winner/conflict-carrier ABI;
3. typed advisory resolver;
4. full grades/provenance/completeness;
5. fixed-basis client materializer and incremental cache;
6. view receipts, durable evidence/witness references, and explanation trees;
7. gate profile for small owner-pinned policies.

### Phase 4 — UX and migration from v1

1. Import every v1 ordered `?lenses=` array as one explicit `PRIORITY_FIRST_PRESENT` source revision.
2. Preserve order exactly and flag any tail previously lost to `MAX_LENSES=20` rather than guessing intent.
3. Preserve ADR-0044’s whole-LIST waterfall only under an explicit legacy combiner; converting to elementwise union/priority requires a semantic diff and consent.
4. Migrate both router and `EFSFileView` limits/ABIs; the latter independently rejects more than 20 attesters and caps exclusion definitions at 8.
5. Do not auto-append old/current system or deployer defaults; offer a labeled migration choice and keep system-metadata trust separate.
6. Split old deny arrays into advisory sources + user action mapping.
7. Encourage users to group only cryptographically authorized rotation keys under stable identity; scoped app actors retain delegation and signer provenance.
8. Replace huge links with ambient/hinted/citation forms and clear disclosures.

### Phase 5 — optional accelerators

Only after exact semantics and core state exist:

- local bitmap/Roaring intersections;
- community/public materialized lens snapshots;
- Merkle proofs for pinned gate rosters;
- optimistic or ZK resolved-view proofs;
- The Graph subgraphs and other hosted query services;
- privacy-preserving membership/gate proofs;
- a contract-native ordered directory index if a real use case justifies its permanent cost.

Every accelerator is replaceable and verifies against the same evidence/policy semantics.

---

## 21. Decision packet for James

The highest-leverage human decisions are:

1. **Meaning:** approve “lens = scoped compiled policy over evidence” rather than “lens = ordered author list.”
2. **On-chain promise:** approve “bounded candidates + exact venue-local point resolution + fixed-basis SDK materialization” as core, or declare globally sorted/top-N contract pages mandatory and fund a separate ordered-index design.
3. **Permanent state budget:** authorize one benchmark bundle for claimant roster, per-author child stream, author spine/self-enumeration, typed reverse index, and slot-head ABI before individual freeze choices.
4. **Identity encoding:** rule out all lossy 160-bit principal encodings; decide whether the complexity of venue ordinals is acceptable after measurement.
5. **Defaults:** confirm no universal content/advisory tail; app starter policies are labeled, forkable, and opt-in.
6. **Privacy:** confirm personal trust configuration is private by default even though published EFS content is public by default.
7. **Safety fallback:** confirm security/package/gate scopes do not automatically fall through on authority revocation/removal.
8. **Language:** retain “lens” for users, while adopting `LensPolicy`, `EffectiveLens`, `ResolvedView`, and `ViewReceipt` normatively.

My recommendation is **yes** on all except globally sorted/top-N contract-native directory pages. Keep those out of the mandatory core until a concrete contract use case shows that candidates + exact points + a proof/materialized root are insufficient. Fast century-scale fresh bootstrap remains a separate current-live/compaction decision, not a solved consequence of append streams.

---

## 22. Final verdict

EFS lenses are not an accessory feature. They are the constitutional boundary between a common evidence substrate and personal or institutional meaning. Done well, they let two people share the same path while preserving different, explainable views; let applications and devices act under least authority; let communities publish curation without becoming protocol sovereigns; let moderation remain plural; and let a new-chain deployment work from ordinary on-chain state without The Graph.

The current ordered list contains the seed of that design, especially for namespace overlays. It should not be thrown away. It should be demoted from “the lens algorithm” to one explicit combiner inside a typed, scoped, reproducible policy system.

The 50+ requirement is not the reason to weaken semantics or depend on an indexer. It is the forcing function that reveals the correct architecture:

```text
objective evidence
  + stable principals and scoped delegation
  + immutable compiled policy
  + policy-neutral on-chain indices
  + adaptive venue-local semantic-position resolution
  + bounded candidate enumeration
  + fixed-basis local materialization
  + provenance/completeness receipts with durable evidence/witnesses
=> target: plural, reproducible, no-indexer EFS views
```

The most important restraint is also clear: do not claim more on-chain page semantics than append streams can provide. Under the proposed indices, venue-local candidates and exact point evidence are obtainable from current state; a verified client can assemble a sorted directory after exhausting the required streams at a pinned basis. Cross-venue aggregation, remote-RPC verification, historical witnesses, and century-old current-set compaction remain explicit work. If another contract needs a whole globally ordered directory, it must receive a deliberately materialized/proven snapshot or EFS must freeze a materially different ordered index.

With those boundaries, 50–100-principal **venue-local point reads and sparse-lifetime-roster pages are benchmark-promising**, not yet production-proven. A 256-principal portable reference profile is a plausible target awaiting the §9.4 matrix. The full directory claim depends on the actual kernel benchmark and the current-live/compaction decision. Without these corrections, the current design either silently changes authority, leaks private trust graphs, becomes multiplicatively expensive, or quietly recreates The Graph as a requirement.
