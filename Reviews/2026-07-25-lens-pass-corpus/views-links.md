# Views, links, and the anonymous viewer — the shareable-read lane

**Lane:** VIEWS + LINKS + ANONYMOUS VIEWER (gap G-A of the 2026-07-25 joined pass; dedicated lens/resolver pass)
**Question owned:** the saved/linkable View object; the successor of the [read-lens-spec §6](../../Designs/efsv2/read-lens-spec.md) URL grammar; the no-account guest read path; the malicious-link fence; the precise enhanced-tier (no-Graph) line.
**Status:** reconciliation/design input — not canon, not freeze, no MVP claim. Consumes [FS-LENS/1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) as settled chapter one, the [2026-07-11 lens architecture review](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) as the working base, the [consumer register](./use-pressure.md) (LC-rows cited throughout), the [research lane](./research.md), and the guest deep-link requirement ([Ideas — Instant guest deep links](../../Ideas.md), James 2026-07-28).
**Rails honored:** six-part read tuple (never two labels); four PROVEN-ABSENT sources; risk-bearer picks policy; genesis ships no default lens; contracts consume public data only; three-tier steer; kill list (checked — nothing reinstated).
**Naming:** uses the pass seeds conservatively — **Lens** (end-user read-view policy), **GATE** (contract/installer trust function), **View** (saved, linkable config *referencing* a lens), **Roster** (shared trust-list primitive). The taxonomy lane owns final names; every rule here survives a rename.
**Marking:** every substantive claim is **VERIFIED** (named file/source/computation) or **PLAUSIBLE** (constructed; needs vectors). §8 lists what could not be verified.

#status/draft #kind/review #repo/planning #topic/lenses #topic/links #topic/guest #topic/efsv2

---

## 0. Verdict and the taxonomy, stated once

> **A Lens says whom you trust. A View says where you are looking and how it is shown, and it *references* a lens — it never contains one. A Citation says exactly what was seen, at exactly which basis, under exactly which pinned policy. A link can carry any of the three, and the only thing a link can never do — by construction, not by good behavior — is change whom you trust or what the safety layer shows you.**

This is the View-vs-Lens-vs-citation distinction the mission requires stated once. It is the conservative reading of the register's naming pressure ([use-pressure §6](./use-pressure.md)): LC-2 links, LC-12 guest starter packs, LC-13 citations, and LC-14 merged trees all pass around "saved lens ref + location + presentation," and none of them needs — or may have — the power to *edit* trust in passing. (VERIFIED against the register rows; the never-contains rule is this lane's binding design choice, coordinated with the taxonomy lane by being the weakest claim.)

How the verdict breaks if violated: if a View may *contain* authority rules, then every shared link is a policy injection vector, the [review §15 threat table's](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) "caller-selected gate lens" and "default monoculture" rows reopen through the share sheet, and seam 12's starter-vs-personal separation ([human-overview §7.12](../../Designs/efsv2/human-overview.md)) collapses — a hostile "starter pack" becomes an installed trust change rather than a declinable reference. The reference indirection is the load-bearing wall of this whole lane.

---

## 1. The View object (VL-1)

### 1.1 Shape

A View is a small, canonical, content-addressed record:

```text
ViewV1 = {
  format:        "efs-view",             ; domain-separated, versioned
  location: {
    realmRef,                            ; VenueRefV1 (review §4.1) or AMBIENT_REALM
    rootId,                              ; ADDRESS container / TAGDEF / LIST / DATA / CLAIM
    path?,                               ; optional segment sequence below rootId
  },
  lensRef:       AMBIENT                 ; "recipient's own policy / owner baseline"
               | LensObjectRefV1(EFFECTIVE | REVISION)   ; pinned lens, by locatable ref
               | LensChannelRefV1,       ; followable lens channel (compiles per review §4.4)
  presentation: {
    sortKey, sortDir,                    ; closed vocabulary, §5.2
    layout?,                             ; advisory client hint (list/grid/gallery/table)
    kindFilter?,                         ; closed kind set; pre-filter warnings rule §4.4
    groupBy?,
    entryPoint?,                         ; item to focus/scroll to
    gradesDetail?,                       ; may RAISE detail above client default, never lower the floor
  },
  completenessPolicy: REQUIRE_PROVEN | ALLOW_GRADED,     ; a demand, never a suppression (§1.4)
  requiresEnhanced?: [enhancedFeatureId],                ; declared, never implied (§5.3)
  basisPin?:     null | BasisRef,        ; null = live View; set = reproducible snapshot View
  label?,                                ; display only, never compared for authority
}
viewId = H(DOMAIN_EFS_VIEW_V1, canonical(ViewV1))
```

Wire discipline is inherited wholesale from the review's deterministic-CBOR profile ([review §4.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)): definite lengths, no maps in v1, sorted sets, unknown critical fields fail closed, golden vectors owed. (PLAUSIBLE — shape constructed; canonical bytes + vectors are owed to the Phase-1 compiler/conformance workstream, same discipline as `LensSourceV1`.)

**What a View deliberately cannot express** (the fence, restated mechanically): no principal lists, no combiners, no tiers, no advisory source changes, no action-table changes, no relinquish modes, no import edges, no GATE references. The only trust-adjacent field is `lensRef`, and it is a *reference* with offer semantics (§4.2). A decoder that finds authority-rule-shaped content inside a View rejects the object. (VERIFIED as a consistency requirement against the review's source grammar — authority rules have their own carrier, `LensRevisionV1`; duplicating them here would create the second policy language the compiled-plan rule forbids, [review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md).)

### 1.2 Relation to the five-part view identity and the receipt

FS-LENS/1's naming law ([filesystem-core §2.2](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)) says every citable view names five things: realm+code basis, lens version, evidence basis, completeness policy, evaluation time. A View is exactly **a partial application of that identity**:

| Five-part component | In ViewV1 | Supplied when |
|---|---|---|
| realm + code basis | `location.realmRef` | authoring time (or AMBIENT → open time) |
| lens version | `lensRef` (channel resolves to a pinned revision at open, per [review §4.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) — no mid-read dereference) | authoring or open time |
| evidence basis | `basisPin` if set; else chosen at open | open time (live View) |
| completeness policy | `completenessPolicy` | authoring time |
| evaluation time | never stored in a live View | open time |

So: **opening a View = completing the five-part identity and running `resolve()`**; the completed identity plus the result *is* the `ViewReceipt` ([review §4.5](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). A live View is a question with display instructions; a receipt is an answer; a citation is a link that carries the answer's identity. One object family, three saturation levels. (VERIFIED against filesystem-core §2.2 + review §4.5; the partial-application framing is this lane's synthesis, PLAUSIBLE.)

### 1.3 Views as publishable EFS objects

A named View is an ordinary `DATA` object carrying canonical `ViewV1` bytes, published under its author's namespace like anything else — e.g. `alice.eth/views/climate-review`. Consequences, each free because Views ride existing machinery:

- **Locatable reference:** `LensObjectRefV1` gains one additive `semanticKind` row, `VIEW` — **loud flag: this is a proposed additive change to the review's locator enum** (REVISION / EFFECTIVE / COMPILATION / RECEIPT / CHANNEL_STATE / **VIEW**). Additive, not breaking; hash-only View refs remain non-shareable bootstrap per the existing rule ([review §4.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). (PLAUSIBLE; needs the locator vectors extended.)
- **Fetch-trust is not view-trust:** a published View is fetched and verified `EXACT(publisher)` — resolving the View *object* needs no trust decision beyond "these are the bytes Alice published," which the ambient owner baseline already provides ([review §12.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). Whether to *look through* the lens it references is the separate offer decision (§4.2). This two-step is what makes View links guest-safe: a guest can always fetch and inspect; adoption is never implied by fetch. (VERIFIED consistency with the owner-baseline ruling.)
- **View channels:** a curator who wants "my current dataset view" followable publishes the View through the same channel machinery as lenses (seam-8 posture: KEL-owned control/recovery, channel keeps only generation/fork/tombstone state — consumed from the channel lane, not redesigned here). Starter Views for clients are exactly this: published, forkable, diffable EFS objects (LC2/LC6 conformance rules carried verbatim from [read-lens-spec §8.1](../../Designs/efsv2/read-lens-spec.md)). (VERIFIED against seam-8 ruling direction + LC2/LC6.)
- **Mandatory indexing applies:** a published View is force-indexed like every on-chain write (owner ruling 2026-07-15, [owner-rulings](../../Designs/efsv2/owner-rulings.md)) — "which Views reference lens L / location X" is a typed reverse-index query, which is what makes curator-View discovery work on a fresh chain with no Graph. (VERIFIED against the mandatory-indexing ruling + [onchain-completeness](../../Designs/efsv2/onchain-completeness.md) The Line.)
- **Privacy default:** a *personal* View (your own saved arrangement) is local/private by default like personal policy (seam 12; [review §11](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)); publishing one is a deliberate ceremony in the share sheet (§4.6). A personal View whose `lensRef` points at your private lens must not be publishable as-is — the share sheet forces the reference swap or the publish-my-lens ceremony first. (VERIFIED against seam 12 / review §13.5.)

### 1.4 Completeness policy is a demand, and floors only ratchet up

`completenessPolicy` states what the View's author considers an honest render: `REQUIRE_PROVEN` (absence and enumeration must ground in the four PROVEN-ABSENT sources; anything less refuses to render as complete) or `ALLOW_GRADED` (venue-qualified grades acceptable, displayed). Two rules keep it safe:

1. **A View may raise strictness, never lower a surface's floor.** A mount already requires closure under the P-16a ordinary profile ([owner-decision-inbox P-16](../../Designs/efsv2/owner-decision-inbox.md)); a View saying `ALLOW_GRADED` there is ignored-with-label. A GATE consults no View at all (§4.3).
2. **An unsatisfiable demand degrades loudly, never silently.** A `REQUIRE_PROVEN` View opened at a hosted-RPC rung (which cannot prove absence — FSP-ABSENT-2, [filesystem-core §1.7](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)) renders in degraded mode with a non-suppressible notice ("this View demands proven completeness; this connection cannot provide it"), plus the upgrade affordance (§3.4). It does not pretend, and it does not blank the screen — the poll example (§2.5) shows why both halves matter.

How §1 breaks — **View-as-trust-smuggling attempts, each closed:** embedding rules in a View (rejected by decoder, 1.1); a View whose `lensRef` silently swaps content under a stable `label` (the label never participates in identity; the reference's semantic digest changes → the "same" View link is a *different* viewId, and channel-followed Views change only under the channel's update ceremony with diffs — [review §5.4/§13.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)); a View published at a look-alike path (`alice-eth.x/views/...`) relying on name confusion (the §4 chrome rules: publisher principal is always displayed with the View, not just the path). Residual accepted risk: a user who deliberately adopts a hostile curator's View — subscription is trust, surfaced not solved (same posture as FS-LENS/1 §1.5's curator-whiteout lesson). (PLAUSIBLE — attack shapes constructed; vectors owed.)

---

## 2. URL-driven Views — the §6 successor grammar (VL-2)

### 2.1 What is carried unchanged

From [read-lens-spec §6](../../Designs/efsv2/read-lens-spec.md), carried as-is (VERIFIED, and deliberately not reopened):

- **The classifier precedence** (§6.3): explicit prefix wins; root-position bare-word classification by registry kind; non-root bare word = always a NAME; registered classification permanent.
- **The closed prefix set** (§6.4): `~addr: ~tag: ~data: ~list: ~prop: ~claim: ~name:` — kept exactly. No new path prefix is added for Views (Views are referenced by query key, §2.2), so the closed set stays closed. The collision-safety argument (§6.2) is untouched.
- **The three link forms** ([review §4.6](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)): **ambient path** (recipient's policy), **sender-hinted** (path + a declinable view/lens reference), **exact citation** (pinned claim/object + pinned policy ref + basis).
- **Fragment capabilities:** `#k=<capability>` rides the fragment, never sent to servers or chain (§6.5 row 8).
- **Chain-relative hosts** and the `web3://<host>/<root>/<segments>` shape.
- Unknown query keys ignored — safe because every trust-adjacent key is in the closed set below; ignoring an unknown key can lose presentation sugar, never gain authority. (VERIFIED carry.)

### 2.2 What changes — flagged loudly

**CHANGE 1 (the big one): `?lenses=` and `?deny=` principal arrays are removed from the grammar.** The successor query-key set is:

```text
view=<ViewRef>        ; named/published View — the structured sender hint
lens=<LensRef>        ; raw lens REFERENCE (effective/revision/channel locatable ref)
                      ;   — the degenerate sender hint with no presentation
asof=<BasisRef>       ; evidence-basis pin (block/state ref; replaces old seq-based asof)
excerpt=<posLensRef>  ; citation lens-excerpt: disclose only the resolving position's
                      ;   rule/tier, not the whole trust order (client-os P3 item 8, adopted)
sort= dir= layout= kind= group= entry=    ; presentation directs (closed vocab, §5.2)
grades=full|normal    ; may RAISE detail; the floor of §4.4 is unaffected by any value
stale=show            ; 'hide' is DELETED as a value — staleness display is floor (§4.4)
```

Rationale, each grounded: principal arrays in URLs leak the sender's social/moderation graph and make personal policy public to gateways/RPCs/recipients ([review §4.6 + ruling 12](../2026-07-11-efsv2-lens-architecture-and-scale-review.md); seam 12 required resolution text, [human-overview §7.12](../../Designs/efsv2/human-overview.md) — "routine links use locatable channel/effective/receipt references, never full lenses=/deny= arrays"); arrays are unwieldy at any honest lens size; and reference-only links make **link size O(1) in lens size**, which retires the v1 `MAX_LENSES=20` URL pressure entirely — the URL layer becomes size-independent, and the cap question moves wholly to compiled profiles and budgets where the review already put it. (VERIFIED against the cited rulings; the O(1) observation is arithmetic.)

**Migration:** a legacy v1 `?lenses=0xA,0xB,…` link is accepted by clients under the Phase-4 rule — imported client-side as one explicit `PRIORITY_FIRST_PRESENT` source revision, order preserved, truncation-tail flagged ([review §20 Phase 4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) — and immediately re-offered as a hint (§4.2), never silently applied. New links are never minted in the old form. `?deny=` arrays map to an offered advisory-subscription suggestion, same treatment. (VERIFIED carry of the migration obligations, [use-pressure §3](./use-pressure.md) V1-1/V1-3.)

**CHANGE 2: `stale=hide` deleted; `grades` can only add.** The old spec allowed `stale=show|hide` as an INTERACTIVE toggle. Under the §4.4 non-suppressible floor, a *link* must never be able to hide staleness/grade banners; a *viewer's own persistent setting* may still tune verbosity above the floor. Loud because it deletes a normative query value from the old spec. (Design choice; PLAUSIBLE until the floor vectors exist.)

**CHANGE 3: `asof` becomes a basis reference** (block hash/number + realm-relative), not an author-seq — author sequences were the old currency model's unit; the six-part tuple pins evidence bases ([filesystem-core §2.2](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)). (VERIFIED consequence of the re-based basis model.)

### 2.3 ViewRef / LensRef value forms in URLs

Two forms, both fetch-verifiable; bare digests are banned as link bootstrap (carried from [review §4.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) — a hash-only reference is not shareable):

1. **Name form** — `<publisher>/<path>`: `?view=alice.eth/views/climate-review`. Resolved `EXACT(publisher)` at the link's realm (or the ref's own realm qualifier). Human-legible, follows the publisher's updates through the ordinary channel/update machinery.
2. **Locatable form** — compact encoding of `LensObjectRefV1`/`LensChannelRefV1` (venue + carrier + kind + digest), e.g. `?view=~data:0x77aa…be40+v:0x51ee…` (exact pinned View revision). Reproducible; survives publisher renames.

The name form is mutable (like a branch), the locatable form pinned (like a commit) — deliberately the same duality as path-vs-citation links ([read-lens-spec §1.2](../../Designs/efsv2/read-lens-spec.md), carried). Share UIs default: name form for "follow the curator," locatable form inside citations. (VERIFIED analogy carry; exact compact URL encoding is owed with the wire vectors.)

### 2.4 What params may set vs never set

| May set directly (apply immediately) | May set with OFFER semantics (§4.2) | May NEVER set, silently or otherwise |
|---|---|---|
| presentation: sort/dir/layout/kind/group/entry | `view=` (trust-bearing part), `lens=` | trust content: principals, tiers, combiners, advisory sources/actions, relinquish modes |
| `grades=` upward only | a citation's pinned policy (applies to that render, always labeled) | anything below the §4.4 floor (staleness, advisories, provenance banners) |
| `asof=` basis pin (labeled: "historical view") | | anything a GATE reads (§4.3 — URL params structurally never reach GATE evaluation) |
| `excerpt=` disclosure | | persistence: no param ever writes the recipient's saved policy or subscriptions |

(The middle column is the whole sender-hint mechanism; the right column is the fence, enforced by *where the data flows*, not by validation: the GATE entrypoint takes no URL-derived input, and the policy store has no URL-driven write path. VERIFIED against the risk-bearer ruling — "a caller never supplies the lens that authorizes itself," [review §1.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) — made mechanical.)

### 2.5 Concrete URLs (the four worked examples)

**1. Share a dataset through a curator's View** (LC-2 + LC-16):

```text
web3://efs.eth/0xA11c…/datasets/climate/v3/?view=onion-dao.eth/views/climate-review
```

Recipient opens the dataset location; the curator's View (name form → channel-followed) is offered/previewed per §4.2 with the banner "Viewing through OnionDAO's climate-review view — switch to plain view." Presentation (sort by the curator's declared weight column, table layout) applies immediately; the curator's lens governs which contributor files rank — visibly, escapably. A guest gets the identical experience (no account needed to look through a published View — LC-12).

**2. Link one person's files** (ambient form — the boring case that must stay boring):

```text
web3://efs.eth/alice.eth/photos/iceland-2026/
```

No params. An account-holding recipient sees it through their own policy; a guest sees the ambient owner baseline (`EXACT(alice)` + labeled discovery). Nothing to decline, nothing offered, no banner beyond the standard grade/basis line. (VERIFIED against the owner-baseline ruling, [review §12.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md).)

**3. A poll's results View** (LC-9's read side + LC-13):

```text
web3://efs.eth/0xDA0…/polls/2026-budget/results?view=0xDA0…/views/results-official&asof=0x9c41…
```

The DAO's published View: `lensRef` = the poll's pinned closer/moderator lens (the same Roster the on-chain closer used — referenced, not restated), `completenessPolicy = REQUIRE_PROVEN`, `basisPin`/`asof` = the close basis. Opened at a proving-capable rung, this renders the *reproducible* result set with receipts; opened at a hosted-RPC rung, it renders the degraded "cannot prove completeness here" mode of §1.4 with the upgrade affordance. A guest can open it and *verify* it (guest floor row 5, [use-pressure §5.2](./use-pressure.md)); the on-chain close itself never consumed any of this — the contract read its own pinned Roster (LC-9).

**4. A package page** (LC-6's browse face):

```text
web3://efs.eth/0xReg…/packages/foo/?view=0xReg…/views/package-page
```

The registry's View arranges the release list, readme, advisories panel. **The install button on that page does not consume the View or any URL param**: install runs the owner-pinned GATE policy (committee thresholds, advisory rejects, closed sets) exactly as if the page had been reached with no params at all. A hostile link to this page with `?lens=attacker-ref` changes at most what the *browsing* pane displays — labeled, escapable — and cannot touch the install decision. (VERIFIED composition of [review §10.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) + LC-6/LC-9.)

How §2 breaks: the grammar's residual ambiguities are unchanged from the old spec (64-hex literal names need `~name:`; classifier is venue-registry-dependent at root — both carried with their §6 mitigations). The new failure surface is ref-form confusion — a name-form `view=` resolves differently after the publisher moves/tombstones it; mitigation: name-form resolution failures render the "View unavailable — showing plain view" notice (never a silent plain render, which would make a tombstoned curator View indistinguishable from never-linked). (PLAUSIBLE; vector owed.)

---

## 3. The anonymous viewer (VL-3)

Terminology per the owner note: **guest / unauthenticated**, not "anonymous" — no account or login prerequisite; endpoint choice, reads, and timing still leak interest ([Ideas](../../Ideas.md), verbatim requirement). Guest is LC-12, a MUST (owner product requirement 2026-07-28).

### 3.1 What the guest can do (the floor, consumed)

The guest floor is [use-pressure §5.2](./use-pressure.md), consumed verbatim, not re-derived: browse any public path/View/citation (LC-1/2/3/4/5), see advisory labels under the client's *published* default action mapping (LC-7), labeled discovery (LC-8), open and verify citations/receipts (LC-13), verified byte fetch including `BYTES-PARTIAL` honesty (LC-15), side-by-side drives (LC-14), and the playable-archive browse→preflight→play journey. Signature and content-hash verification are on the guest's critical path — the "minimum trustworthy link-classification, data-resolution, and verification slice" of the Ideas entry is exactly: the §2 classifier, the resolver over the ambient baseline + published Views, and the envelope/hash verifier. (VERIFIED.)

### 3.2 What the guest defers, and the honest boundary line

Deferred (loaded lazily or on promotion, per [boot-and-profiles](../../Designs/clientv2/boot-and-profiles.md) and the Ideas modularity requirement): accounts/wallet/KEL, personal policy and subscriptions (LC-16), writes of any kind, GATE-authorized installs beyond sandboxed archive play, agent authority (LC-11), private stores, sync, package management, full Session Shell.

**The boundary line, in product words:** *"You're looking at other people's published stuff through a public window. Everything you see is checkable; nothing you do here changes anything or belongs to you. Rearranging the window is free; keeping your arrangement, trusting someone new, or touching anything means unlocking it — creating your identity."* Editing/saving/subscribing is the promotion trigger, never a silent escalation. (PLAUSIBLE — product copy; the underlying rule set is VERIFIED against the guest floor's exclusion list.)

Guest state is a client-side `ViewV1` value plus navigation history — which is precisely why promotion is lossless (§3.4).

### 3.3 How the guest resolves — the graded ladder and the default

Every rung is a disclosed grade on the tuple's availability/existence axes; no rung changes semantics, only what can be *proven*. The ladder (composing [P-16's profile split](../../Designs/efsv2/owner-decision-inbox.md), FSP-ABSENT-1/2, and the register's LC-2 honesty rules):

| Rung | Mechanism | Can prove | Cannot prove — and must say so |
|---|---|---|---|
| **G0 — gateway-rendered** | operator's server renders HTML (`web3://` gateway, LC-2) | nothing locally; everything is the operator's word | authorship, bytes, absence — page carries operator identity, basis, and the "rendered by gateway X, unverified" grade line; no trusted-UI claims possible (§4.5) |
| **G1 — client-verified over hosted RPC** (the guest default) | client-side resolver + verifier; slot/index reads from a hosted RPC | **authorship and bytes** (envelope signatures, content hashes verified locally — a hostile RPC cannot forge who said what) | slot currency, enumeration completeness, absence — all RPC-trust-graded; `UNKNOWN` renders as "nothing found via this endpoint (unverified)", never as proven-absent (FSP-ABSENT-2: hosted-RPC bare word never grounds absence) |
| **G2 — light-verified** | + state proofs (EIP-1186-class) against a light-client-verified header | slot state and **absence to positive closure** (absence source 2); admission receipts | cross-realm anything; still leaks queries to the proof endpoint |
| **G3 — own node / snapshot-with-closure** | full state or a venue-committed bundle (absence sources 1/3) | the full tuple at the strongest grades | nothing relevant — this is no longer a guest posture in practice |

**Default: G1, with progressive verification upward.** Render fast at G1 (the deep-link product lives or dies on time-to-first-view — Ideas), then upgrade in the background where the platform affords it: proofs arrive → displayed grades upgrade in place. **Grades ratchet up only; a verification failure downgrades loudly** (a G2 proof contradicting the G1 render replaces the content *with a visible correction*, never a silent swap — the honesty version of progressive enhancement). The authorization axis is displayed verbatim from venue admission state at the rung's trust grade; full KEL historical re-verification ([kel §9](../../Designs/efsv2/kel.md)) is available on demand but off the critical path. (Ladder composition VERIFIED against the cited absence/profile rules; the progressive-upgrade UX is PLAUSIBLE and owed a falsification fixture: G1 render that G2 later refutes.)

**Gateway-arrival reality** (the on-ramp, consumed from [client-os-pressure-report](../../Designs/efsv2/client-os-pressure-report.md) T-4): `web3://` has no browser handler safelist entry, so real inbound links are https-canonical gateway URLs. Rule: **the https wrapper is transport; the embedded `web3://` coordinate is identity.** Every gateway page and every share-sheet https link carries the canonical coordinate, so any client or rival gateway can re-resolve it — "a second, independent gateway can prove it wrong" ([use-pressure §4 LC-2 sentence](./use-pressure.md)) is only true if the coordinate survives the wrapper. A gateway URL that strips the coordinate is nonconforming. (VERIFIED need; wrapper format owed to the L5 standards-liaison track.)

### 3.4 Promotion without losing the view

Verbatim requirement ([Ideas](../../Ideas.md)): promotion preserves route/state and grants nothing silently. Mechanics, now nearly free because of §1: the guest's current position *is* a client-side `ViewV1` + basis; promotion (a) carries it across unchanged — same location, same presentation, same offered-View state, same scroll position; (b) offers — never auto-imports — saving it and any visited published Views into the new account's local policy; (c) any sender hint active at promotion time remains a hint: **crossing the promotion boundary never converts an offer into trust** (the single most tempting silent grant, named and banned). The new account starts with the same published starter Views the guest was using, now forkable/subscribable (seam 12's starter machinery is the guest's inheritance, [use-pressure §5.2](./use-pressure.md) design-lane consequence). (VERIFIED against the Ideas requirement; mechanics PLAUSIBLE.)

How §3 breaks — **gateway spoofing of the guest, per rung:** at G0 the gateway can fabricate everything (defense: labeled as such, canonical coordinate enables second-source checking; a G0 page claiming verified grades is nonconforming and the canonical client refuses to render its grade claims as its own). At G1 the RPC can omit, reorder, serve stale, or answer "no rows" (defenses: authorship/bytes unforgeable; absence never claimed; basis displayed; cross-endpoint sampling is a client feature worth shipping — same epistemic class as the research lane's filter-bundle sampling check, [research §7.1](./research.md)). At G2 residual: proof-endpoint liveness (availability axis, never absence). What no rung defends: a user who ignores every banner; endpoint learning of guest interest (guest ≠ anonymous, stated up front). (VERIFIED against rung capabilities; the sampling feature is PLAUSIBLE.)

---

## 4. The link safety model — the malicious-link fence (VL-4)

Design goal, restated as an invariant: **a hostile link may waste your time; it may never spend your trust.** Three sub-invariants: no silent trust install (§4.2), no suppressible safety surface (§4.4), no forgery rendered as trusted (§3.3's verification floor + §4.5's chrome ownership).

### 4.1 The threat actor's toolkit

A link controls: location, presentation params, a view/lens reference, a citation target, its own display text, and the choice of gateway host. It does not control (by §2.4): the recipient's policy store, the advisory layer, the grade floor, GATE inputs, or System Chrome. Every attack below is the actor trying to convert the first list into the second.

### 4.2 Offer semantics for sender-hinted views (VL-HINT)

The rails and the review agree on the principle — hinted views are **offered, not applied** ([review §4.6](../2026-07-11-efsv2-lens-architecture-and-scale-review.md): "must see when a link requests a foreign lens and must be able to open it ambiently instead"; §13.1: one-click ambient escape). This lane makes "offered" precise, because a blocking prompt on every curator link would kill the guest deep-link product, and silent application would kill safety:

- **VL-HINT-1 (offer ≠ adopt).** An offer may be *previewed* — rendered for the current navigation, always under the provenance banner (NS-3), always one-tap escapable to ambient, **never persisted**, never authority-bearing (no GATE, no write, no install flows through it). *Adoption* (entering the saved policy / subscribing) is a separate explicit System Chrome ceremony with the standard update-diff.
- **VL-HINT-2 (the displacement rule).** Preview-by-default is allowed only where it displaces nothing: a guest, or an account holder with **no personal policy covering that location**. Where the viewer's own policy covers the location, the hint must not auto-preview — it prompts, showing what would change — because a sender view silently replacing *your established view of a place you know* is the deception primitive (your `readme.md` swapped for theirs while the address bar reads the same). Principle: **a hint may furnish a view where you have none; it may never displace one you have without asking.** (PLAUSIBLE — this rule is the lane's synthesis; it needs UX vectors, and the "covers that location" predicate is a scope-intersection check against the compiled personal policy.)
- **VL-HINT-3 (advisory composition).** A hinted lens supplies selection/authority for display only. The active advisory layer — the viewer's own, or the client's published defaults for guests — **still applies on top and cannot be reduced by the hint** (subtract-after-resolve runs with the *viewer-side* advisory rules regardless of whose lens selected the winner). A hint can therefore show you a different file; it cannot show you a flagged file unflagged. (VERIFIED composition — deny-after-resolve is viewer-side policy per [read-lens-spec §3.4](../../Designs/efsv2/read-lens-spec.md)/FS-LENS/1, and nothing in the hint path feeds the advisory rule set.)
- **VL-HINT-4 (scope confinement).** A hint applies within the View's `location` subtree only. Navigating out drops to ambient (banner changes accordingly). A hinted lens must not follow the user across the namespace — that would turn one curious click into a whole-session foreign view. (PLAUSIBLE; cheap to enforce, needs a vector.)
- **VL-HINT-5 (citations pin).** An exact citation renders under its pinned policy for that render — that is its purpose — labeled as foreign (NS-7), and the pinned policy extends zero distance beyond the cited object: following any link out of a citation is a fresh §4.2 evaluation. (VERIFIED carry of [review §1.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) row 2 + §13.2.)

### 4.3 GATE isolation (restated once, mechanically)

No URL-derived value reaches GATE evaluation; the GATE entrypoint's inputs are the owner-pinned policy and chain state, full stop ([review §10.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md); kill-list item "caller-supplied gate policy"). The register's LC-2 attack row ("a link that carries the lens that authorizes its own content") is closed by dataflow, not by review. (VERIFIED.)

### 4.4 The non-suppressible set (NS) — what no View, link, or presentation param can hide

Named, closed, testable. Every conforming client renders these regardless of any View/link/presentation state; a View's `presentation` and a link's params operate strictly above this floor:

- **NS-1 — grade/basis line:** venue qualification, basis age, rung (G0–G3), UNKNOWN-vs-absent distinction, `INCOMPLETE_BUDGET` markers.
- **NS-2 — staleness:** STALE display with its venue-qualified wording (RR4 carried; `stale=hide` deleted, §2.2).
- **NS-3 — foreign-view provenance banner:** "viewing through X's view" + one-tap escape, whenever `lensRef ≠ ambient` and ≠ the viewer's own adopted policy.
- **NS-4 — advisory labels/actions** from the viewer-side advisory layer (VL-HINT-3), including "N items hidden by advisories."
- **NS-5 — conflict/attribution surfaces:** CONFLICT rows, U1 attribution chips, U2 multi-claimant markers in shared namespaces ([read-lens-spec §4.4](../../Designs/efsv2/read-lens-spec.md) carried).
- **NS-6 — authorship boundaries:** the sub-file hostile-child chip (§4.2 of the old spec, carried) and cross-author plain-name provenance (D-10 rule surface).
- **NS-7 — citation-under-foreign-policy label** (VL-HINT-5).
- **NS-8 — confusable/look-alike warnings**, computed over the **pre-filter** candidate set: a View's `kindFilter`/`groupBy` may hide rows from display, but name-collision and confusable-name detection runs before filtering, so hiding the real `Invoice.pdf` does not silence the warning about the fake one. Plus the filtered-count indicator ("14 items hidden by this View's filter").
- **NS-9 — guest-mode state and the write-lock line** (§3.2's boundary), plus promotion ceremonies.
- **NS-10 — degradation notices:** completeness-demand failures (§1.4) and enhanced-feature fallbacks (§5.3).

(The set is this lane's consolidation of obligations already normative piecemeal in the review §13.2 "always surface" list, read-lens-spec §4.4/§8, FS-LENS/1 §1.11, and P-17's tombstone ruling — VERIFIED per item against those sources; the *closure* of the set as a named floor is new normative surface, PLAUSIBLE until the conformance vectors exist. The old spec's LC1 disclosure rule — active lens chain always inspectable — is subsumed by NS-3 + the View inspector.)

### 4.5 What System Chrome owns vs what a page may draw

Consumed from [web-os-thesis](../../Designs/clientv2/web-os-thesis.md) (apps own no pixels outside their surface; the prompt surface is the attack surface) and applied to this lane:

- **System Chrome owns:** the NS floor's rendering, the address/coordinate display (full principal + path, no truncation-only display — the address-poisoning lesson), the offer/adopt/promote ceremonies, the share sheet, and the View inspector ("what is this View, who published it, what does its lens reference").
- **A page/app surface may draw:** everything else — including its own *duplicate* copies of provenance info (harmless: duplication is allowed, replacement is not).
- **The honest G0 caveat:** a gateway-rendered page has no System Chrome; it therefore may not imitate one. Conforming gateways render the NS content inline *as page content attributed to the gateway* ("gateway X reports: …"), and the canonical client never treats gateway-drawn chrome as its own. In-page imitation of chrome by hostile content inside the canonical client is structurally dead (no pixel access); imitation *of the whole client* by a hostile website remains ordinary web phishing — mitigated by the canonical-coordinate habit, not solved (§4.7). (VERIFIED against web-os-thesis F1/T10 posture; gateway rule PLAUSIBLE.)

### 4.6 The share sheet — privacy fence on the outbound side

Carried from [review §13.5](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) and made concrete against the new grammar. The share sheet emits exactly:

1. **Share path** (ambient) — default for locations; leaks nothing about the sharer's policy.
2. **Share through a published View** — name/locatable `?view=` ref; only for Views that are already deliberate publications.
3. **Publish my view as a View** — the explicit ceremony converting a personal arrangement into a published View object (§1.3), with the lens-reference swap or publish-my-lens sub-ceremony, and the disclosure preview ("publishing this reveals: the referenced lens's principal set …").
4. **Exact citation** — pinned object/claim + basis (+ optional `excerpt=` lens-excerpt disclosing only the resolving position — adopted from [client-os P3 item 8](../../Designs/efsv2/client-os-pressure-report.md); the whole-trust-order disclosure of a full effective-lens citation remains a labeled deliberate act per [review §11.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)).

**Banned outputs:** principal arrays in any form (§2.2); a personal `lensRef` in any emitted URL; capability keys anywhere but the fragment. The "personal lens in a URL" breakage from the mission brief is thus closed at the only place it could be minted. (VERIFIED against seam 12 + §11.2; the ceremony details are seam-12-lane surface, handed off.)

### 4.7 Attack ledger — defended and explicitly not

| # | Attack shape | Defense (rule) |
|---|---|---|
| D1 | Link silently installs trust (hostile "starter pack") | reference-only Views (§1.1) + offer semantics (VL-HINT-1) + no URL→policy-store dataflow (§2.4) |
| D2 | Sender view displaces the victim's known view of a known place | displacement rule (VL-HINT-2) |
| D3 | Hinted lens un-flags malware / hides advisories | viewer-side advisory composition (VL-HINT-3) + NS-4 |
| D4 | Look-alike / confusable name in a shared View; hidden-twin filter trick | NS-8 pre-filter warnings + NS-5/NS-6 attribution + D-10 authority-gated plain name |
| D5 | `?lens=` reaching an install/gate decision | GATE isolation (§4.3) — dataflow, not validation |
| D6 | Presentation params hiding staleness/grades/warnings | NS floor (§4.4); `stale=hide` deleted |
| D7 | Citation whose bytes are silently re-resolved/substituted | citations pin; `supersededBy` never auto-follows in citation mode (carried); NS-7 |
| D8 | Forged authorship on a rendered page | G1+ local signature/hash verification (§3.3); G0 labeled as unverified |
| D9 | Gateway fabricating content or absence | rung disclosure + canonical-coordinate re-check (§3.3/§3.4); absence never claimed at G0/G1 |
| D10 | Hint following the user across the namespace | scope confinement (VL-HINT-4) |
| D11 | Offer-to-trust conversion at account promotion | promotion never converts (§3.4) |
| D12 | Personal policy leaking via share links | share-sheet fence (§4.6) + grammar ban (§2.2) |
| D13 | In-client chrome imitation by content | no-pixels rule (§4.5) |

**Explicitly not defended** (each named so nobody claims otherwise): a viewer who deliberately adopts a hostile View/lens after the diff ceremony (subscription is trust); whole-client imitation by an arbitrary website (ordinary web phishing — canonical-coordinate habits and browser-level anti-phishing help; EFS does not solve the web); network/endpoint observation of guest reads (guest ≠ anonymous); a nonconforming client that ignores the NS floor (conformance suite territory, and the reason the floor must be vectored); social-engineering in link *display text* on third-party platforms (Reddit shows what Reddit shows — the coordinate is only checkable after the click); G0/G1 omission that the victim never cross-checks. (VERIFIED as honest limits against the threat rows in [review §15](../2026-07-11-efsv2-lens-architecture-and-scale-review.md); the ledger's completeness is PLAUSIBLE — the critic should hunt for a 14th row.)

---

## 5. The enhanced-tier demarcation — the no-Graph line for views and links (VL-5)

### 5.1 The exact enhanced-only feature list

Grounded in the adopted rulings ([owner-rulings 2026-07-15 item 15](../../Designs/efsv2/owner-rulings.md): ranked/full-text/aggregate off-chain; [onchain-completeness §2c/§6](../../Designs/efsv2/onchain-completeness.md); [use-pressure §4](./use-pressure.md) sentences, extended here to the View/link surface). Each row: enhanced-only, with its absent-on-fresh-chain sentence.

| # | Enhanced-only feature | Fresh-chain sentence (what a Graph-less L3 honestly says) |
|---|---|---|
| E-1 | Ranked search (relevance ordering) | "Search here is exact-key and bounded-candidate only; nothing is ranked until someone runs an indexer, and no base surface notices." |
| E-2 | Full-text search | "Text search is absent; name/path/prefix and typed-index lookups work completely." |
| E-3 | Trending / popularity / most-cited charts | "No trending exists here; revocation-aware live counts per target work on-chain, but nothing orders the universe by them." |
| E-4 | Cross-realm search (one query over many realms) | "Each drive answers for itself; asking five chains is five queries a client composes, labeled per-realm." |
| E-5 | Historical analytics (activity time-series, growth curves) | "History is replayable from the spine, but no precomputed time-series exists; analytics are an application's own index." |
| E-6 | Recommendation / similarity / embeddings (incl. agent semantic retrieval) | "Nothing here knows what is 'similar'; an agent's correctness never depends on it (LC-11 sentence carried)." |
| E-7 | Advisory analytics (a labeler's full history, ranked/aggregated) | "Every deny decision is a keyed point read; a labeler's history pages from the typed reverse index; rankings over it are indexer work." |
| E-8 | Mirror health analytics / uptime scoring | "Best-mirror selection is the bounded on-chain view; health *statistics* are an operator's dashboard, not a resolution input." |
| E-9 | Notification fan-in / cross-realm activity feeds | "Feeds in admission order work per-realm from chain state; unified inboxes are client/indexer composition." |

Everything else consumed by this lane — classifier, ambient/hinted/citation links, View fetch+verify, guest browse/enumerate/point-read/verify, best-mirror, channel bootstrap via `channelAnchorSummary`, citation re-verification, revocation-aware counts — is base tier and carries the register's fresh-L3 sentences unchanged (LC-1..5, 12, 13, 15, 16: "none" in the enhanced column — VERIFIED against [use-pressure §4](./use-pressure.md)).

### 5.2 The base sort vocabulary (what a View may ask of a fresh chain)

`presentation.sortKey` has a closed base range, each computable from the mandatory index bundle at one pinned basis by the SDK materializer ([review §8.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) — sorting is client materialization, never an on-chain page property): `name` (portable-name collation profile), `admission-order` (venue-local bookkeeping, labeled as such — carried from [read-lens-spec §7.1](../../Designs/efsv2/read-lens-spec.md)), `size`, `kind`, `basis-age`, `declared-weight` (an author/curator's explicit order field — data, not reputation). A distinct enum range holds **enhanced sorts** (`relevance`, `trending`, `popularity`, `similar-to`), and any View or `?sort=` using one must also carry the base `fallbackSort`. (PLAUSIBLE — vocabulary constructed; the collation profile is the FS lane's portable-name work, consumed.)

### 5.3 The no-silent-dependency rule

**VL-ENH-1.** No View, link, or client surface may *silently* depend on an enhanced feature. Mechanically: (a) a View using an enhanced sort/feature declares it (`requiresEnhanced`, §1.1) and carries its fallback; (b) on a chain without the feature, the client renders the fallback **with the NS-10 degradation notice** ("sorted by name — 'trending' is not available on this chain"); (c) a View whose *substance* is enhanced (a saved search-results View over full-text) renders the honest refusal ("this View needs a search indexer this chain does not have") rather than an empty-but-plausible page — absence of an indexer is an availability fact, never an empty result set (the same never-manufacture-absence discipline as FSP-ABSENT, applied to features). (VERIFIED as a consequence of the tier steer + the register's "no base feature notices" sentences; the mechanism is this lane's design, PLAUSIBLE.)

**VL-ENH-2 (accelerator honesty).** A client MAY fill *base* results from an indexer for speed, in exactly the epistemic class of a cache: re-derivable, verifiable against chain state, spot-checked (the sampling discipline from [research §4.1/§7.1](./research.md)), and never upgrading the displayed grade beyond what was actually verified. An indexer-filled base render at G1 is still G1. (VERIFIED against the review's "accelerators are replaceable and verify against the same semantics" rule, §20 Phase 5.)

How §5 breaks — **enhanced-tier silent dependencies**, the named regression paths: a client shipping `trending` as its default guest sort (guest product now dies on fresh chains — caught by VL-ENH-1(b) + the conformance seed "no base feature notices"); a popular curator View using `relevance` with no fallback (rejected at View validation — `requiresEnhanced` without `fallbackSort` is invalid); an app treating E-9's unified feed as the only read path (its fresh-chain sentence is the test). The subtle one: an indexer-backed gateway whose G0 pages *are* enhanced-sorted with no label — nonconforming under VL-ENH-1, and the reason gateway conformance needs its own vector set. (PLAUSIBLE — regression fixtures owed.)

---

## 6. Tier placement summary (the steer, applied to this lane)

| Piece | Tier | Note |
|---|---|---|
| View object fetch/verify, viewId, reverse-indexed View discovery | CORE state + RICH resolution | rides existing carriers/indexes; zero new kernel state beyond the additive locator enum row |
| URL grammar, classifier, offer semantics, NS floor | RICH (client/SDK/gateway) | pure Durable surface; no Etched cost (carried from the old spec's posture) |
| Guest ladder G0–G3 | RICH, over CORE state | rung ≠ semantics; G2 leans on state proofs (cheaper under EIP-7864 direction, [research §3.2.4](./research.md)) |
| GATE isolation | CORE | dataflow rule; no gate reads URLs |
| Enhanced sorts/search/trending | ENHANCED | §5.1 list, degradation-labeled |

Nothing in this lane touches the frozen-surface bundle except the flagged additive `semanticKind = VIEW` row and the (Durable) query-grammar changes. (VERIFIED against the tier steer.)

## 7. Handoffs and coordination

- **Taxonomy lane:** final names for View/Lens/GATE/Roster; this file's rules are name-independent; the §0 sentence is offered as the distinction text.
- **Channel/seam-8 lane:** View channels reuse whatever the lens-channel ruling lands; nothing here adds channel machinery.
- **Seam-12/starter lane:** share-sheet publish ceremony details (§4.6 item 3); starter Views as the guest's world.
- **FS lane (settled):** portable-name confusable rules consumed by NS-8; five-part identity consumed by §1.2.
- **Conformance/vector program:** ViewV1 canonical bytes + golden vectors; NS-floor vectors; VL-HINT-2 displacement predicate; G1→G2 refutation fixture; VL-ENH degradation fixtures; gateway conformance (coordinate preservation, G0 labeling).
- **L5 standards liaison:** https-canonical wrapper + `web+efs://` alias carrying the embedded coordinate (§3.3).
- **Owner surface:** nothing here needs a new James decision; LC-12 is already an owner requirement, and this lane's loud flags (locator enum row; `?lenses=`/`?deny=`/`stale=hide` deletions) are design-lane surface for the pass synthesizer/critic, escalating only if the critic finds a product-visible break.

**Pushback:** none. No adopted ruling required contradiction. The one deliberate tension management: the rails' "sender-hinted views are OFFERED not applied" is implemented as VL-HINT-1/2's preview-with-banner-and-escape rather than a universal blocking prompt — this is a *strengthened reading* (offers never persist, never displace, never authorize) chosen so the guest deep-link requirement and the safety rule hold simultaneously; if the critic reads "offered" as "always a blocking prompt," that conflict goes to the synthesizer as a UX-severity call, with this lane's evidence being the Ideas entry's time-to-value requirement.

## 8. Confidence

**VERIFIED (against named files this pass):** the three link forms, prefix grammar, classifier precedence, fragment rule, and LC/RR conformance rules ([read-lens-spec](../../Designs/efsv2/read-lens-spec.md) §1.2/§6/§8, read in full); five-part identity and FS-LENS/1 consumption ([filesystem-core](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) §1–2); locator/channel/receipt shapes, share modes, privacy rules, risk-bearer table, owner baseline ([review](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) §1.4, §4.1–4.6, §11–13); the guest requirement verbatim ([Ideas](../../Ideas.md)); guest floor + LC rows + fresh-L3 sentences ([use-pressure](./use-pressure.md)); mandatory indexing + off-chain items 15/16 ([owner-rulings](../../Designs/efsv2/owner-rulings.md), [onchain-completeness](../../Designs/efsv2/onchain-completeness.md)); seams 7/8/12 ([human-overview §7](../../Designs/efsv2/human-overview.md)); P-16/P-17 arms ([owner-decision-inbox](../../Designs/efsv2/owner-decision-inbox.md)); P3 item 8 + T-4 on-ramp ([client-os-pressure-report](../../Designs/efsv2/client-os-pressure-report.md)); chrome ownership ([web-os-thesis](../../Designs/clientv2/web-os-thesis.md)); kill list + D-ledger checked row-by-row ([joined-pass-synthesis](../../Designs/efsv2/joined-pass-synthesis.md)).

**PLAUSIBLE (constructed; vectors are the check):** ViewV1's exact field set and wire bytes; the partial-application framing; the `VIEW` locator row; the closed NS set *as a closure*; VL-HINT-2's displacement predicate; VL-HINT-4 confinement; the G0–G3 ladder's UX (progressive upgrade/refutation); the base sort vocabulary; VL-ENH mechanisms; the attack ledger's completeness; all product copy.

**Could not verify:** [boot-and-profiles](../../Designs/clientv2/boot-and-profiles.md) details (cited via the Ideas entry's summary only — its guest-generation mechanics should be reconciled with §3.4 by the client round); the taxonomy lane's final naming (ran in parallel; coordinated by the conservative reference-only rule); whether any deployed `web3://` gateway implementation constrains the query-grammar changes (no implementation inventory existed in the corpus); the exact compact URL encoding for locatable refs (owed with vectors).
