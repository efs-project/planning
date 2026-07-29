# Red team — profiles, composition, Views, and links

**Lane:** RED TEAM / ATTACK (gap G-A of the 2026-07-25 joined pass; dedicated lens/resolver pass)
**Targets under attack:** [profiles-composition.md](./profiles-composition.md) and [views-links.md](./views-links.md), read in full; [core-onchain.md](./core-onchain.md), [object-taxonomy.md](./object-taxonomy.md), [research.md](./research.md), [use-pressure.md](./use-pressure.md) read in full for the consistency sweep.
**Job:** break the design, not improve it. Repairs appear only after a break is established and are labelled **Repair (suggestion)** — they are not fixes, they are the cheapest thing I could see, and the lane owners may have better ones.
**Status:** adversarial review input. Nothing here rules, freezes, or picks an MVP.
**Marking:** each finding is **VERIFIED** (I traced the exact text/mechanism in a named file) or **PLAUSIBLE** (constructed; needs vectors). §10 names what I could not verify.

#status/draft #kind/review #repo/planning #topic/lenses #topic/efsv2 #topic/redteam

---

## 0. Verdict and the ledger

**One sentence:** the two lanes are strong on the attacks they anticipated and weak in three places they did not — (a) **CH-1 is false as a theorem** because scope gerrymandering redirects a position onto the one-source ambient baseline where closure is cheap, so composition *can* mint `ABSENT_PROVEN` over a live claim; (b) **the link-safety invariant is stated over an incomplete link toolkit** and its two behavioural branches (preview-vs-prompt, fetch-vs-no-fetch) are a network-observable oracle on the private policy the same design says must stay private; (c) **GATE isolation isolates the policy but not the choice** — the human picks the release from a browse view a hostile link controls, and every GATE check then passes on the attacker's preferred artifact.

Nothing below asks to reopen an adopted ruling. Two findings (AV-11, AV-19) argue that a claim the lanes present as structural is only conditional, which is a correction to the *text*, not to a ruling.

| # | Finding | Severity | Kills |
|---|---|---|---|
| **AV-11** | CH-1 mints `ABSENT_PROVEN` via scope gerrymander onto the one-source ambient baseline | **FATAL** (as a theorem) | [profiles-composition §2.7 CH-1](./profiles-composition.md) |
| AV-12 | `INCOMPLETE_BUDGET` launders into absence source 3 through snapshot build | SERIOUS | profiles-composition §3.2 MOUNT-SNAPSHOT, §2.6; views-links §1.4 |
| AV-19 | GATE isolates the policy, not the *selection* — presentation-layer rollback | SERIOUS | views-links §2.5 ex.4, §4.3, ledger D5 |
| AV-1 | VL-HINT-2's displacement branch is a personal-policy scope oracle | SERIOUS | views-links §4.2 VL-HINT-2, §4.6 |
| AV-2 | Preview "never persisted" is false: history + promotion carry it | SERIOUS | views-links VL-HINT-1, §3.4, ledger D11 |
| AV-3 | Name-form `?view=` is a delayed-detonation mutable pointer with no diff-on-open | SERIOUS | views-links §2.3, §1.4 |
| AV-4 | `location`/`basisPin` inside ViewV1 vs path/`asof=` outside — no precedence law | SERIOUS | views-links §1.1, §2.4, §2.5 ex.3 |
| AV-5 | NS-8's pre-filter confusable check has no completeness axis | SERIOUS | views-links §4.4 NS-8 |
| AV-6 | "Unlock the view" + G0 degradation notices = a trained credential-bait surface | SERIOUS | views-links §3.2, §1.4, §4.5 |
| AV-7 | `excerpt=` reinstates a one-principal `lenses=` in the query, by default | SERIOUS | views-links §2.2, §4.6 |
| AV-10 | Wrong-realm look-alike: `realmRef` inside a View silently moves the reader's chain | SERIOUS | views-links §1.1, §4.4 NS-1 |
| AV-13 | Whiteout has no non-suppressible floor item; the two lanes disagree | SERIOUS | views-links §4.4 vs profiles-composition §2.4 |
| AV-14 | Equal-path compile failure bricks first-run and speaks duplicity-shaped English | SERIOUS | profiles-composition §2.2.3, §7.3 |
| AV-15 | TUF **freeze** survives: no expiry on the accepted GATE policy generation | SERIOUS | profiles-composition §1.2 rules 4/6/9 |
| AV-16 | GATE advisory pass is per-position, not per-closure — transitive deps unguarded | SERIOUS | profiles-composition §1.2 rule 8, §1.3 |
| AV-17 | Ceiling-clamp lets an enumerated labeler pick the consequence after all | SERIOUS | profiles-composition §2.4, §1.3 |
| AV-20 | ADVISORY/1 declares no source-level relinquish: a dead deny feed reads clean | SERIOUS | profiles-composition §1.3, §1.0 |
| AV-21 | CONFLICT carrier is byte-ordered ⇒ grindable presentation authority | SERIOUS | filesystem-core §1.4.1 as consumed; profiles-composition §4.1 |
| AV-22 | Promotion offers to save every *visited* View — offer→trust by ceremony | SERIOUS | views-links §3.4(b) vs §3.4(c) |
| AV-24 | One-off Views grow authority horizontally; nothing counts the total | SERIOUS | profiles-composition §4.2, §6 |
| AV-25 | The achievement standard is a live computed-principal-set pipeline into the hook | SERIOUS | profiles-composition §1.4 rule 4; [Ideas](../../Ideas.md) |
| AV-27 | The batched dependency-head vector *is* remote `resolveMany`, on every focus | SERIOUS | profiles-composition §5.1, §6.2 vs seam 12 |
| AV-28 | Citations disclose the citer's plan; the disclosure preview is on the wrong item | SERIOUS | views-links §4.6 item 4 |
| AV-31 | No back-pointer from a compiled rule to its people-list origin | SERIOUS | profiles-composition §4 headline |
| AV-32 | Scope-root grant ceremony trusts a suggester's ID↔name binding | SERIOUS | profiles-composition §4.1 |
| AV-33 | `?lenses=`/`deny=` deleted here, shipped verbatim in the client design | SERIOUS (consistency) | views-links §2.2 vs [boot-and-profiles §1.2](../../Designs/clientv2/boot-and-profiles.md) |
| AV-34 | Trust-adjacent params in the query; the client design puts links in the fragment | SERIOUS (consistency) | views-links §2.2 vs boot-and-profiles §1.3/§2.1 |
| AV-35 | Threat toolkit omits `pr`/`gx`/`gf`/`a`/`sy`/`k` link classes | SERIOUS (consistency) | views-links §4.1, §4.7 |
| AV-36 | `lensRef` has no private variant — the dictionary-oracle ID is in a shareable record | SERIOUS (consistency) | views-links §1.1 vs object-taxonomy PP-2 |
| AV-8, AV-9, AV-18, AV-23, AV-26, AV-29, AV-30, AV-37, AV-38, AV-39 | see sections | NOTE | — |

**Ledger arithmetic for views-links §4.7's own invitation** ("the critic should hunt for a 14th row"): I found five rows the ledger does not cover — AV-19 (selection upstream of the gate), AV-10 (wrong realm), AV-1 (the oracle *created by* the defence), AV-6 (the ceremony phishing surface the design trains), AV-35 (the link classes not in the toolkit).

---

## 1. The malicious link, exhaustively

### AV-1 — VL-HINT-2's displacement branch is a personal-policy scope oracle (SERIOUS, VERIFIED)

**The text.** [views-links §4.2](./views-links.md) VL-HINT-2: *"Preview-by-default is allowed only where it displaces nothing: a guest, or an account holder with **no personal policy covering that location**. Where the viewer's own policy covers the location, the hint must not auto-preview — it prompts."* The lane calls the predicate "a scope-intersection check against the compiled personal policy."

**Attack.** Actor: anyone who can get a link opened and observe either the page or the network.
1. Attacker publishes a throwaway View at location `X` and sends `…/X/?view=attacker.eth/views/probe`.
2. Two observable behaviours follow. If the viewer's compiled policy has no rule covering `X`, the client auto-previews: it **fetches the View object, its `lensRef`, and that lens's pinned import closure** by carrier (views-links §1.3 "fetch-trust is not view-trust"). If the viewer's policy *does* cover `X`, the client prompts and fetches nothing until consent.
3. Fetch-vs-no-fetch is directly visible to whoever hosts the carrier and to the RPC — which, at rung G0/G1 (the default per §3.3), is frequently the attacker.
4. Repeat with probes at `/finance/`, `/health/`, `/dao-x/whistleblower/`, `/work/employer/`. Each probe returns one bit: *does this person's private policy cover this scope?*

Payoff: the shape of a policy that [human-overview seam 12](../../Designs/efsv2/human-overview.md) and [object-taxonomy PP-2](./object-taxonomy.md) exist to keep private — "friends and communities; political/social associations; moderation sources and blocked topics" ([review §11.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). Scope roots are *what the user cared about enough to configure*, which is often more sensitive than the principal set.

**What it kills.** VL-HINT-2 as written, and views-links §4.6's closing claim that *"the 'personal lens in a URL' breakage is thus closed at the only place it could be minted."* It is not: deleting `?lenses=` closed the request side; VL-HINT-2 opened a response side. The leak moved, it did not close.

**Repair (suggestion).** Remove the branch. One uniform path: always fetch and verify the referenced View (fetch ≠ adoption is already the lane's own rule), always render the viewer's own/ambient result first, and always offer the hint through the same persistent, non-modal affordance. Guests and account holders behave identically, so there is no bit to read. Product cost: a curator link no longer auto-renders through the curator's view for a fresh guest — one tap instead of zero. That is the honest price of a private policy.

### AV-2 — "Preview is never persisted" is false in practice (SERIOUS, VERIFIED)

**The text.** VL-HINT-1: an offer may be previewed, *"always one-tap escapable to ambient, **never persisted**."* §3.2: *"Guest state is a client-side `ViewV1` value plus navigation history."* §3.4(a): promotion *"carries it across unchanged — same location, same presentation, **same offered-View state**, same scroll position."*

**Attack.** Actor: a curator whose View is hostile in one small way (one file substituted, one competitor whiteouted).
1. Victim opens the link once. The hint enters navigation history and, per §3.2, *is* the guest's state.
2. The victim never adopts it. But the client restores sessions, honours bfcache, and — per §3.4(a) — carries the offered-View state across account creation.
3. The banner (NS-3) renders every time and is habituated within a day. The hostile view is now the victim's durable experience of that location, in an authenticated session, surrounded by their own real files.
4. Nothing entered the policy store, so §3.4(c)'s promise ("crossing the promotion boundary never converts an offer into trust") is *technically kept* and *operationally void*. The distinction is invisible to the victim and to any audit surface that inspects the policy store.

**What it kills.** VL-HINT-1's "never persisted"; ledger row D11.

**Repair (suggestion).** Define the persistence honestly and bound it: a previewed hint is session-scoped, expires on navigation out of the View's `location` subtree (VL-HINT-4 already says this — make it also apply on tab close and on promotion), and **promotion drops it to ambient** with an explicit "you were viewing through X — keep for this session?" The user is already in a ceremony; one more line is free there and nowhere else.

### AV-3 — Name-form `?view=` is a time bomb: mutable, re-resolved every open, with no diff and no floor (SERIOUS, VERIFIED)

**The text.** §2.3: *"The name form is mutable (like a branch) … follows the publisher's updates through the ordinary channel/update machinery."* §2.5 example 1 uses name form and annotates "(name form → channel-followed)". §1.4's break paragraph asserts channel-followed Views *"change only under the channel's update ceremony with diffs."*

**Attack.** Actor: a patient curator, or anyone who buys/steals a curator's channel-admin grant ([object-taxonomy §4.4](./object-taxonomy.md) makes `CHANNEL_ADVANCE` grantable).
1. Publish `climate-review` as a genuinely good View. Let the link circulate — Reddit, wikis, papers, chat pins, bookmarks. Name-form links are what the share sheet defaults to for "follow the curator" (§2.3).
2. Months later, advance the channel: swap `lensRef` for a hostile lens, or swap `location` (AV-4).
3. Every previously-shared link now renders the new content. **No ceremony fires**, because the update ceremony is a *subscriber* mechanism. A stranger opening a link has no previous accepted generation, no acceptance floor, no diff baseline, and no memory of the View at all.

The §1.4 defence is written for subscribers and asserted for everyone. For link-openers the name form is a plain mutable pointer with a trusted-looking human name.

**What it kills.** §2.3's "mutable like a branch" framing as benign; §1.4's breakage paragraph; and §2.5 example 1's guest claim ("A guest gets the identical experience") — identical, including identically undefended.

**Repair (suggestion).** Two cheap halves: (1) the client keeps a per-name-form *seen-revision* note in local state and renders "this view changed since you last opened it — see what changed" on any change (diff-on-open, not diff-on-subscribe); (2) the share sheet emits **locatable/pinned** form by default for anything leaving the client, and name form only when the sharer explicitly says "follow the curator." §2.3 already has both forms; the default is the whole finding.

### AV-4 — No precedence law between the View's contents and the URL's params (SERIOUS, VERIFIED)

**The text.** `ViewV1` carries `location {realmRef, rootId, path?}`, `basisPin`, `completenessPolicy`, `presentation`, `requiresEnhanced` (§1.1). URLs carry a path plus `asof=`, `sort=`, `kind=`, `grades=`, `stale=` (§2.2). §2.4's table says `asof=` "may set directly (apply immediately)". §2.5 example 3 sets **both** a published View with `basisPin` and an `&asof=` param. Nothing states which wins, anywhere.

**Attack A — relocation.** If View-`location` wins over the URL path, `?view=` is a third-party-controlled redirect: the address bar reads `alice.eth/photos/`, the content is the attacker's container. That defeats §3.3's "the embedded `web3://` coordinate is identity" and computes NS-8's pre-filter confusable set over the *wrong* container, so the look-alike warning cannot fire.

**Attack B — basis substitution.** If the URL's `asof=` overrides a published View's `basisPin` (which §2.4 permits — "apply immediately"), then a hostile link renders **the DAO's own official results View, at a basis the attacker picked**, with the DAO's branding, labelled only "historical view." Pre-scandal snapshots, pre-revocation membership lists, pre-correction figures — all under the victim organisation's published, trusted View object.

**Attack C — the bare `?view=`.** Nothing forbids a `?view=` with no path. Behaviour undefined.

**What it kills.** §1.1's field set as specified; §2.4's precedence table; §2.5 example 3.

**Repair (suggestion).** State one law: **URL params may narrow, pin, or decorate; they may never relocate and never loosen.** A View's `location` governs only when the URL carries no path; a URL path outside the View's `location` subtree makes the View inapplicable (drop to ambient with the §2.2 "View unavailable" notice — VL-HINT-4's confinement rule, applied in the other direction). A URL `asof=` that conflicts with a View's `basisPin` is an **error**, not a winner.

### AV-5 — NS-8's confusable check has no completeness axis, so it is both suppressible and a DoS (SERIOUS, PLAUSIBLE)

**The text.** NS-8: *"name-collision and confusable-name detection runs before filtering, so hiding the real `Invoice.pdf` does not silence the warning about the fake one."*

**Attack (suppression by budget).** The pre-filter candidate set is the `UNION_SET` enumeration of [FS-LENS/1 §1.3](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) — precisely the surface [review §8.6](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) prices as adversarially inflatable (`T = K × M`). A principal the viewer selects (or that a hinted View selects) floods the container with near-name entries until enumeration returns `INCOMPLETE_BUDGET`. Now: is the confusable check computed over the truncated set? The lane does not say. If yes, the attacker chooses which side of the cut their look-alike and the honest file fall on, and NS-8 renders **nothing**. If no (computed to closure regardless), the attacker has a cheap permanent DoS on every render of that directory.

Either answer is a bug, and the design does not pick one — which is the finding. Every other axis in this pass carries completeness ([profiles-composition §3.1 axis 6](./profiles-composition.md)); the safety floor does not.

**What it kills.** §4.4's framing of the NS set as "named, closed, **testable**." NS-8 as written is not testable, because its own completeness is unspecified.

**Repair (suggestion).** The NS floor carries the tuple like everything else: NS-8 renders its own completeness, and a *partial* confusable check renders a **stronger** warning ("look-alike check incomplete — this listing was truncated"), never a weaker or absent one. Fail loud.

### AV-6 — The design trains a credential-bait surface and then routes identity creation through it (SERIOUS, VERIFIED)

**The text.** §3.2 product copy, verbatim: *"…keeping your arrangement, trusting someone new, or touching anything means **unlocking it** — creating your identity."* §1.4 rule 2: an unsatisfiable `REQUIRE_PROVEN` View renders "a non-suppressible notice … **plus the upgrade affordance** (§3.4)." §4.5: "a gateway-rendered page has no System Chrome; it therefore may not imitate one … Conforming gateways render the NS content inline *as page content attributed to the gateway*." §4.7 lists whole-client imitation as **explicitly not defended**.

**Attack.** Actor: a phishing gateway (or any web page).
1. The design has now standardised: (a) frequent, urgent-looking, non-suppressible notices; (b) the word **unlock** attached to identity creation; (c) the norm that legitimate safety text appears *as page content* on gateway pages; (d) an **upgrade affordance** — a button that starts an identity ceremony — on the degraded rung, which §3.3 says is the **default** for link arrivals.
2. The attacker copies the canonical notice verbatim ("This View demands proven completeness; this connection cannot provide it") and the canonical affordance, and runs a fake promotion flow: seed phrase entry, or a passkey ceremony redirect, or a wallet-connect harvest.
3. The victim has been trained by the honest product to expect exactly this page, exactly this wording, on exactly this rung.

The design's own defence — "the canonical client never treats gateway-drawn chrome as its own" — is irrelevant, because at G0 the victim is in an ordinary browser on the attacker's page. [web-os-thesis](../../Designs/clientv2/web-os-thesis.md) already ruled this class ("the prompt surface is the attack surface"; the user-configured **negative** indicator; T10's "above a risk threshold, Shell-only confirmation is disallowed"). views-links consumes web-os-thesis for the chrome-ownership rule and **not** for the prompt-surface rules that govern the ceremony it is placing.

**What it kills.** §3.2's copy, §1.4's affordance placement, and §4.5's G0 caveat, jointly.

**Repair (suggestion).** (1) Guest→account promotion may never be initiated from page content or from any surface EFS does not draw; degradation notices on G0/G1 explain and offer *"open in the EFS client"*, never an in-page identity flow. (2) Drop "unlock" — it is the phishing verb. (3) Consume web-os-thesis T10 and the negative-indicator rule into the NS floor.

### AV-7 — `excerpt=` reinstates a one-principal `lenses=`, in the query, in the default citation flow (SERIOUS, VERIFIED)

**The text.** §2.2 keeps `excerpt=<posLensRef>` — *"disclose only the resolving position's rule/tier, not the whole trust order."* §4.6 item 4 offers it in the share sheet's citation mode. §4.6's **banned outputs**: *"principal arrays in any form."*

**Attack.** Citation is the *high-frequency* sharing act (quoting, arguing, sourcing). Every citation with `excerpt=` puts "the rule and tier that selected this" into a URL — hence into the gateway's logs, the RPC's request stream, the referrer, and Discord's permanent message store. Ten citations from one person reconstruct the shape of their tier order and the scopes each tier covers. §2.2's entire rationale for deleting `?lenses=` was that principal-bearing URL content leaks the sender's graph; an excerpt is a *smaller* array, not a different kind of object.

Worse, the excerpt faces a dilemma: to be useful for verifying a citation it must name the *winning principal* and the rule that admitted it — at which point it is literally a one-entry `lenses=` plus a tier number. If it does not name the principal, it is not verifiable and the field is decoration.

**What it kills.** §2.2's privacy rationale as a complete story, and §4.6's own banned-outputs list, which item 4 violates.

**Repair (suggestion).** `excerpt` becomes a **content-addressed reference to a published excerpt object**, not inline policy — the same reference-never-content discipline §1.1 applies to `lensRef`. It is off by default, and §4.6's disclosure preview (currently attached only to item 3) attaches to it.

### AV-8 — `REQUIRE_PROVEN` is a one-field habituation weapon (NOTE, PLAUSIBLE)

A hostile or merely careless curator sets `completenessPolicy = REQUIRE_PROVEN` on every View. At the default rung (G1, which by FSP-ABSENT-2 can never prove absence), every page renders the non-suppressible degradation notice. Cost to the attacker: one enum. Effect: the notice becomes wallpaper across the whole product, and AV-6's surface fires on every page instead of rarely. **Repair (suggestion):** a View that demands proof unreachable at the client's rung is flagged *at fetch time* as misconfigured-or-hostile; the notice's prominence scales with what the render actually claims, not with the author's demand.

### AV-9 — "grades may only be raised" is not automatically safe (NOTE, PLAUSIBLE)

§2.2 CHANGE 2 permits `grades=full` from a link on the theory that raising detail cannot harm. Attention is the safety surface: a wall of provenance chips buries NS-5's conflict marker and NS-8's confusable warning in noise, and a link controls it. **Repair (suggestion):** floor items keep fixed, reserved, prominent placement independent of verbosity; verbosity adds rows below the floor, never around it.

### AV-10 — Wrong-realm look-alike: a link silently moves the reader to another chain (SERIOUS, VERIFIED)

**The text.** `ViewV1.location.realmRef` is `VenueRefV1 | AMBIENT_REALM` (§1.1). NS-1 covers "venue qualification" as one element of a grade/basis **line**.

**Attack.** Chains-as-drives ([filesystem-core §2](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)) plus portable evidence make this cheap and it is a design *feature*, not a bug:
1. Attacker deploys a kernel on their own L3 and replays `alice.eth`'s entire container as portable evidence. Every signature is genuinely Alice's; every content hash matches.
2. Add one hostile file. Publish a View pinning `realmRef = attacker-chain`, `rootId = alice's container`. Share `?view=`.
3. The reader's client verifies everything and reports **`PORTABLE-EVIDENCE`** on the authorization axis — which is *correct*, and is also the only differing bit in the entire render.
4. The lens is deliberately topology-blind (the rails; FS-LENS/1 H-2): it surfaces the axis verbatim and does not judge it. The UI renders it as a chip in a line.

Payoff: a fully-verifying forgery of a whole namespace, distinguished from the real thing by one small label on the axis users have had the least reason to learn.

**What it kills.** views-links' handling of "wrong-realm look-alikes" (named in the lane's own remit, defended nowhere in §4); NS-1's sufficiency.

**Repair (suggestion).** Realm change via a link is a **chrome-owned transition**, as loud as an account switch: persistent frame, not a line; the realm's own identity and grade shown continuously. Plus a cheap heuristic worth having: a realm whose principals are overwhelmingly `PORTABLE-EVIDENCE` with a foreign authority home is a *replay realm*, and saying so costs nothing and catches the whole class.

---

## 2. False absence and false equivocation through composition

### AV-11 — CH-1 is FALSE: gerrymandering a scope redirects a position onto the one-source ambient baseline, where closure is cheap (**FATAL**, VERIFIED)

**The text.** [profiles-composition §2.7 CH-1](./profiles-composition.md), step 3: *"Composition only adds sources and narrows scopes… (monotone: more sources can only move a result away from `ABSENT_PROVEN`)."* Step 4 handles the gerrymander: *"the position then resolves under whatever rule remains (possibly the ambient baseline), and **that rule's own closure requirement still binds**. Absence still requires real closure from someone; the gerrymander can redirect trust … never mint proof."*

**Why step 4 fails.** The ambient baseline is `EXACT(owner)` ([review §12.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), carried at profiles-composition §4.2 and §2.5.3 verbatim: *"under `/software/…` you have no update authority configured; **the ambient owner baseline applies**"*). Under `EXACT(owner)`, `ABSENT_PROVEN` requires `NEVER_CLAIMED(closure)` for **one** source. Closure over one source at a proving-capable rung is exactly the cheap, routine case. So narrowing a scope so an honest curator's rule stops applying does not merely "redirect trust" — it **reduces the closure requirement from two sources to one**, and the surviving requirement is satisfiable. `ABSENT_PROVEN` is emitted at a position where a selected, trusted, present curator claim exists.

**Attack.** Actor: the author of a popular starter pack or curator View.
1. Bob's people-list gives Carol (honest curator) tier-2 authority over `/data/**`.
2. Bob adopts Mallory's pack. Mallory's compiled plan carries an `AUTHORITY_RULES` rule at a **higher mount priority** whose scope is `/data/2025/**` and whose policy key is the same class-specific key Carol's rule occupies. Per §2.2.1, *"for one concrete query and one class-specific policy key, the greatest applicable path supplies the rule configuration."* At `/data/2026/results.csv`, Mallory's rule is applicable (it wins the key) and Carol's configuration is not consulted; Mallory's rule's own scope excludes the position, so no rule of Bob's covers it.
3. `/data/2026/results.csv` resolves under the ambient baseline: `EXACT(container owner)`. The owner never claimed that name — Carol did.
4. Result: `existence = ABSENT_PROVEN(source 1, basis B)`, `completeness = FINAL`, `slot state = NEVER_CLAIMED(closure)`. Per §3.1 axis 3: *"mount maps only it to native not-found."*
5. `test -e /data/2026/results.csv` → **false**, at `ENOENT` grade, from a strict mount, with real closure, no `UNKNOWN`, no warning, passing MOUNT-STRICT's acceptance matrix cleanly.

Payoff: durable, honest-looking, machine-consumable false absence over a live claim, produced entirely by composition — the exact outcome CH-1 says is structurally impossible.

**The exemptions ledger does not save it.** §2.5.3's ledger surfaces "you have no rule covering `/data/2026/`" at ceremony time — as a benign-reading configuration note, indistinguishable from the hundreds of scopes a user genuinely has no rules for. It never says "your curator was scoped out of a folder they actively publish to."

**Why FATAL.** The system is not unfixable; the *theorem* is false, and §9 lifts it verbatim into the replacement spec as the composition chapter's **conformance gate**. A false theorem in a conformance gate is worse than no theorem: it retires the vectors that would have caught this.

**Repair (suggestion).** Two parts, both cheap:
1. **Restate CH-1 as relative and make the relativity part of the result.** "No composition can produce `ABSENT_PROVEN` without closure over every source applicable *under the compiled plan* — and the plan's coverage of the position is reported on the result." Concretely: the exemptions-ledger fact becomes a result annotation ("resolved under the ambient baseline; no rule of yours covers this scope"), so a mount consuming `ABSENT_PROVEN` at an uncovered position can refuse or label it. This turns a silent lie into a legible one.
2. **Forbid displacement-by-narrowing.** §2.2.2 attenuates what an import *brings* (`intersection(parentImportScope, childRuleScope)`); nothing forbids an import from *taking a policy key* with a narrower rule than the one it displaces. Add: an imported rule may take a class-specific policy key only if its scope is a superset of, or disjoint from, every scope the importer already held at that key; otherwise compilation fails with both scopes shown. This is a compiler check over data the compiler already has.

### AV-12 — `INCOMPLETE_BUDGET` launders into absence source 3 through snapshot build (SERIOUS, VERIFIED)

**The text.** §3.2's MOUNT-SNAPSHOT row: *"as strict, at the bundle's manifest basis; grade-free projection is legal **because every axis was checked at snapshot build**."* §2.6's cross-profile rule constrains the *basis* and says nothing about the *budget*. The four PROVEN-ABSENT sources include *"venue-committed bundle closure manifest."*

**Attack.** Actor: anyone who can inflate a container (roster inflation and candidate-stream floods are both priced-and-bounded per §7.5 — bounded in *cost*, not in *effect*).
1. Flood the target container so the snapshot builder's per-read budget trips. Enumeration returns `INCOMPLETE_BUDGET(continuation)`.
2. The builder emits a bundle. Nothing in profiles-composition, views-links, or the four-source rule states that a **closure manifest may only commit scopes enumerated to `FINAL`**. The manifest commits the container.
3. Every downstream consumer — mounts under P-16a's *recommended* ordinary-app profile, offline bundles, `REQUIRE_PROVEN` Views (views-links §1.4) — now derives honest-looking `ENOENT` for every entry past the budget cut, from absence **source 3**, with `completeness = FINAL` and a grade-free projection that shows nothing at all.

Payoff: signed, shareable, durable false absence at the strongest grade in the system, achieved by walking in the front door of a blessed absence source. Cost: gas for the flood.

**Second half of the same hole:** §2.6 makes composition *basis*-joint but not *completeness*-joint. A composed render whose FS enumeration is `INCOMPLETE_BUDGET` and whose advisory pass is `FINAL` has no stated rule for the composite's axis 6.

**Repair (suggestion).** One sentence each: (1) **a closure manifest may commit only scopes whose enumeration reached axis-6 `FINAL` at the manifest basis; budget-incomplete scopes are committed as `PARTIAL(cursor)` and no consumer may derive absence inside them**; (2) a composed result's axis 6 is the **minimum** over its members — `INCOMPLETE_BUDGET` dominates `FINAL` — stated next to §2.6's basis-joint rule.

### AV-13 — Whiteout has no non-suppressible floor item, and the two lanes disagree about whether it is visible (SERIOUS, VERIFIED)

**The text.** profiles-composition §2.4 assumes P-17's visible-inert-tombstone arm ("P-17's visible-inert-tombstone arm assumed"; §3.1 axis 3 note: "projections may omit them"). views-links §4.4's NS set — presented as **closed** and **testable** — contains no whiteout item. NS-4 covers *advisory* hides; whiteout is explicitly **authority-tier**, not advisory (§2.4: "a whiteout can never arrive through an `ADVISORY_RULES` or `DISCOVERY_RULES` import"). [P-17 is unanswered](../../Designs/efsv2/owner-decision-inbox.md) — it sits in the "Decide now" tier with a recommendation, not a ruling.

**Attack.** Censorious curator inside a popular starter pack whiteouts competitors' entries inside their import scope. Under views-links' floor, a conforming client renders **nothing** — no count, no attribution, no marker. profiles-composition's answer ("always attributed and inspectable") has no enforcement point in the client conformance set, and if P-17 lands on arm (b) it never will. The user's "why is this missing?" has no surface to hang on.

**Repair (suggestion).** Add **NS-11 — policy-suppression disclosure**: masked entries are always *counted and inspectable with their attributing principal and tier* ("3 items masked by OnionDAO"), independent of P-17. P-17 chooses whether a tombstone *entry* appears in `readdir`; the count-plus-inspector is a cheaper, separate obligation that should not wait on it.

### AV-14 — Equal-path compile failure bricks first-run and speaks duplicity-shaped English (SERIOUS, VERIFIED)

**The text.** §2.2.3: *"Two rules at the same priority path and same policy key with different executable semantics **fail compilation** with both provenance chains in the error."* §2.5.5: *"compile/update failures leave the previous accepted generation in force."* §7.3 calls composition wedges "update-time-only."

**Attack A — first-run brick.** A new user adopts two popular starter packs. There is **no previous accepted generation**. If the two packs declare equal-path rules about any shared principal, compilation fails and the user has no policy at all. A hostile pack author can *guarantee* this against a named rival pack by mirroring its mount priorities. §7.3's "update-time-only" claim is false at exactly the moment the product is most fragile (guest→account promotion, views-links §3.4, where the design *expects* multiple starter Views to be adopted at once).

**Attack B — defamation by error text.** The failure names "both provenance chains." Rendered for a human, that reads *"OnionDAO and ClimateWatch conflict about Alice"* — one short step from "Alice is contested." The string-catalog discipline that exists for exactly this ([FS-LENS/1 §1.4.1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md); [object-taxonomy §1.2](./object-taxonomy.md) banned phrasings) covers *resolution* vocabulary and has never been extended to **compilation-time errors**, which are the one place the system deliberately names two parties and a disagreement.

This is the reachable "false equivocation through composition." CH-2 is correct that no composition step writes claim evidence — and irrelevant, because the damage is done in the error surface, not the evidence surface.

**Repair (suggestion).** Equal-path conflict at first compile degrades to a **typed, named choice** ("two of your sources disagree about the rule for `/data/**` — pick one, drop one, or reorder"), never a bare failure with no serving generation. And the string catalog extends to compile errors: composition conflicts are described as *policy* conflicts attributed to *importers*, never in author-duplicity vocabulary.

---

## 3. Profile confusion, and the TUF catalog against GATE-CLIENT

### AV-15 — TUF **freeze** attack survives: nothing expires the accepted GATE policy generation (SERIOUS, VERIFIED)

**The text.** §1.2 rule 4 puts `maxBasisAge` on the **evidence basis**. Rule 6 puts monotone floors on `(EffectiveLensId acceptance, channel generation, slot order)`. Rule 9 freezes a `CHANNEL_CONTESTED` channel at the last accepted generation. [core-onchain §7.2](./core-onchain.md) has the same monotone `policyVersion` and the same gap.

**Attack.** Actor: anyone on the victim's network path, or a hostile RPC/carrier.
1. Let all *content* reads through, so every evidence basis is fresh and every rule's `maxBasisAge` is satisfied.
2. Block or indefinitely stall only the `channelAnchorSummary` read for the GATE's policy channel. Channel advance is pull-shaped (§2.3: "a followed channel advances → compilation *at acceptance time*"), so a client that cannot reach the anchor simply never advances.
3. The victim keeps installing under a policy generation that still lists a publisher key the vendor rotated away from, or still lacks the advisory feed the vendor added last month.
4. Every indicator is green: basis `FRESH`, floors monotone, channel `ACTIVE` at the last known generation, no `CHANNEL_CONTESTED`.

Payoff: compromise through a stale trust root, with no failing check anywhere.

TUF answers this with **expiry on the metadata roles themselves** (`timestamp` exists for precisely this). GATE/1 imported TUF's rollback protection and thresholds and dropped the one role that defends against withholding.

**Repair (suggestion).** Add `policyMaxAge` to the GATE profile: the accepted generation must have been **re-validated against the channel anchor within a declared window**, or the GATE fails closed. One field, one bounded anchor read per window, and it converts a silent stale-trust compromise into a loud "your update policy has not been checked in 30 days" refusal.

### AV-16 — The GATE advisory pass is per-position, not per-closure: transitive dependencies are unguarded (SERIOUS, PLAUSIBLE)

**The text.** §1.2 rule 8: the closure identity pins "artifact bytes, interfaces, runtime, **dependencies**." §1.2's vocabulary row and §1.3's match keys define the advisory pass over *the selected claim* — "exact claimId → target object id → position/anchor". Nothing states that the pass runs over the **transitive pinned closure**.

**Attack.** Actor: whoever compromises any package deep in a dependency graph.
1. A malware advisory (OSV-class, from a source the GATE owner enumerated) lands on a transitive dependency `D` of package `P`.
2. The user installs `P`. The GATE's advisory pass matches on `P`'s claimId, `P`'s dataId, and `P`'s position anchor. `D` is inside `P`'s pinned closure and is **not** a match key.
3. `P` installs clean. The advisory that exists, is fresh, is from an enumerated source, and names the actual malware, never fires.

This is how supply-chain advisories are actually consumed everywhere (`npm audit`, `cargo audit`, OSV scanners all walk the tree). A GATE that checks only the top-level artifact is checking the one node least likely to be compromised.

**Repair (suggestion).** State it: the GATE advisory pass runs over the **full pinned closure**, with match keys per closure member; a hit anywhere in the closure denies the parent. Then price it honestly — `|closure| × D × matchKeys` keyed point reads, which is the same O(D) shape [core-onchain §4.3](./core-onchain.md) prices, multiplied by closure size, and it needs a declared budget and a stated failure mode when the budget trips (fail closed, per rule 4's posture).

### AV-17 — The ceiling clamp is a ceiling, not a granularity control, so an enumerated labeler still picks the consequence (SERIOUS, VERIFIED)

**The text.** §2.4: *"the imported action table is **clamped** to the importing profile's `advisoryActionCeiling`… GATE ceiling: `BLOCK/REJECT` but only for sources the GATE owner enumerated."* §1.3's lattice: `REJECT > BLOCK > HIDE > WARN > NOTE > NONE`; "multiple hits combine by lattice max." §1.3's break claim: labeler-controls-consequence is *"structurally capped — the labeler controls only label values; the consumer's table controls actions."*

**Attack.** Actor: an enumerated labeler (an aggregator the GATE owner deliberately added — the normal, trusted case).
1. The GATE owner adopts the labeler's *published recommended action table* (the realistic flow; §2.4 explicitly permits imported tables under the clamp).
2. The GATE ceiling is `REJECT`. Clamping to a ceiling constrains the *maximum*, not the *mapping*. The imported table may map every label value it likes to `REJECT`, up to the ceiling — and the labeler authors both the table and the values.
3. The labeler invents a new label value tomorrow. If the owner's effective table is the imported one, the new value maps to `REJECT` on arrival.

Payoff: any enumerated labeler can unilaterally block any release, forever, by minting a label value. That is precisely "labeler controls the action" — the failure §1.3 claims is structurally impossible — reached through the composition mechanism the same file introduced to prevent it.

**Repair (suggestion).** The GATE's action table must be **closed over label values**: unknown or unenumerated values map to `NONE` (render-only), never to the ceiling. An imported table contributes *proposals* the owner accepts per value in the ceremony. One rule, and it restores the line between "the labeler names the fact" and "the owner names the outcome."

### AV-18 — Axis 7 has no value for "the advisory pass did not run" (NOTE, VERIFIED)

§3.1 axis 7's closed set is `UNCHANGED | NOTED | WARNED | HIDDEN | REJECTED`. `UNCHANGED` is what a *clean* pass emits and, by the letter of the table, also what an implementation emits when the pass could not run. §1.3 rule 3's prose ("a GATE-class consumer … that cannot reach its feed within the floor **does not proceed**") has no mechanical home on the tuple: axis 4 is per-claim freshness, axis 6 is resolution completeness, and neither covers the advisory pass's own reachability. The AcceptanceMatrix (§3.2) is a *membership test over axis values*, so a rule with no value is a rule that cannot be tested. **Repair (suggestion):** add `UNEVALUATED(reason)` to axis 7's closed set; GATE-CLIENT rejects it explicitly. This is also the mechanical home AV-20 needs.

### AV-19 — GATE isolation isolates the policy, not the **selection**: presentation-layer rollback (SERIOUS, VERIFIED)

**The text.** views-links §2.5 example 4: *"The install button on that page does not consume the View or any URL param: install runs the owner-pinned GATE policy … A hostile link to this page with `?lens=attacker-ref` changes at most what the *browsing* pane displays — labeled, escapable — and cannot touch the install decision."* §4.3 and ledger row D5 present this as closed by dataflow. profiles-composition §1.2 rule 2 agrees candidates are untrusted: *"Candidate versions arrive from a separate DISCOVERY/1 run (or user input) as untrusted proposals."*

**Attack.** Actor: anyone who can get a package-page link opened.
1. Send `…/packages/foo/?view=attacker.eth/views/package-page` (or just `?sort=`/`kind=`/`group=`, which §2.4 says apply **immediately** with no offer semantics at all).
2. The browse pane now orders, filters, and labels the release list. Put `1.2.0` (validly signed by the real publisher, and vulnerable) at the top; label it "recommended"; filter `1.4.x` out of the default view with `kind=`/`group=`.
3. The user clicks install on the row they were shown.
4. **Every GATE check passes.** The publisher is correct, the signature is correct, the threshold is met, the basis is fresh, the advisory pass on `1.2.0` may well be clean (a vulnerability with no published advisory, or an advisory the GATE owner's feed does not carry). GATE/1 rule 6's monotone floors are **per exclusive position the consumer has already acted on** — a first install has no floor.

Payoff: TUF's **rollback attack**, executed entirely through the presentation layer, defeating a defence the design describes as structural. The GATE was never asked the question "is this the current release?" — it was asked "may I install *this* artifact?", and the answer was honestly yes.

The design already knows candidates are untrusted (profiles-composition §1.2 rule 2) and then hands the human the untrusted list as the selection UI. Isolating the *policy* from URL input is necessary and not sufficient when the *choice* is upstream of the policy.

**Repair (suggestion).** The install ceremony **re-derives and displays the candidate set under the GATE's own rules**, in System Chrome, at ceremony time, discarding the browse view's ordering entirely: *"You selected 1.2.0. The publisher's current release is 1.4.1. 1.2.0 is 14 months older and has 2 advisories."* This is the missing half of §4.3 — dataflow isolation for the decision, plus **selection re-derivation** for the human.

---

## 4. Squatter and curator attacks, re-run against the new text

### AV-20 — ADVISORY/1 declares no source-level relinquish, so a dead deny feed reads clean (SERIOUS, VERIFIED)

**The text.** §1.0's `ProfileLaw` has `relinquishDefault`. §1.4 DISCOVERY/1 explicitly declares its (none — nothing to relinquish). §1.3 ADVISORY/1's "must never express" list **omits relinquish entirely**. §1.3 rule 5 covers the *claim* level ("the un-deny is REVOKE"); §1.2's break list covers *deliberate* source removal ("removing OSV re-enables 14 blocked releases" — with a ceremony). Nothing covers **involuntary source death**.

**Attack.** Actor: whoever can compel, compromise, or simply outlast an aggregator.
1. Cause the advisory source's principal to become unresolvable — KEL revocation, a rotation the consumer's plan does not follow, a channel tombstone, or plain abandonment.
2. No ceremony fires: the *user* did not remove anything, so §1.2's re-enablement preview never runs.
3. Every deny that source was carrying goes quiet. If the profile treats a dead source as "no hits," blocked malware silently re-enables across every consumer of that feed simultaneously.

The text does not say which way it goes, which is the finding. §1.3 rule 3's freshness floor covers *stale data from a live source*; it does not cover *a source that no longer exists*.

**Repair (suggestion).** ADVISORY/1 declares source-level relinquish explicitly: a relinquished, revoked, or unresolvable advisory **source** makes its rule `UNEVALUATED` (AV-18's new axis-7 value) — fail-closed for GATE, a visible persistent banner interactively — never silently clean. And `ProfileLaw.relinquishDefault` gains a source-level dimension alongside its claim-level one, so the omission is structurally impossible in the next profile.

### AV-21 — CONFLICT carriers are byte-ordered, and byte order is grindable, so it becomes presentation authority (SERIOUS, VERIFIED)

**The text.** [FS-LENS/1 §1.4.1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md), consumed unexamined by profiles-composition §4.1: *"the listing shows one deterministic **carrier row labeled CONFLICT** (carrier chosen by canonical byte order for transport determinism only — **byte order never becomes authority**)."* §4.1's UX mapping: *"Tier scheme: fixed group→tier numbers (0/1/2), **equal rank within a group**."*

**Attack.** Actor: any principal the victim places in the same group as an honest peer — which, under §4.1, is *every curator by default*.
1. Grind your own KEL principal word at inception for a low byte prefix. This is not a collision search; it is a leading-zeros grind on a word you are minting anyway. Three bytes is ~2²⁴ — minutes.
2. Claim the same names as the honest peer in a shared container. Equal rank ⇒ `CONFLICT` ⇒ a carrier row.
3. You are always the carrier. Byte order did not become *authority* — it became **the row's rendered content**: the displayed name form, the size, the type, the icon, the preview, the author chip, whatever `getattr` must answer.

Payoff: the attacker owns the presentation of every contested position in the victim's listing, permanently and deterministically, while the design's own text says byte order is "transport only." A conflict row that renders the attacker's filename and the attacker's preview is a phishing surface that the victim was told is a safety marker.

**Repair (suggestion).** (1) A `CONFLICT` row renders **no claimant-derived content** — synthetic name, no size/type/preview from any claimant, claimants listed in an order that is not principal-byte order (petname order, or explicitly unordered). (2) Better, upstream: **stop defaulting curators to equal rank** in §4.1's mapping. Group membership should produce a visible *default order* the user can see and reorder, so equal rank is opt-in rather than the resting state of every trust relationship.

### AV-22 — Promotion offers to save every *visited* View: offer→trust conversion by ceremony design (SERIOUS, VERIFIED)

**The text.** views-links §3.4(b): promotion *"offers — never auto-imports — saving it **and any visited published Views** into the new account's local policy."* §3.4(c), two lines later: *"crossing the promotion boundary **never converts an offer into trust**."*

**Attack.** The two sentences contradict each other and the attack lives in the gap. A guest who opened one hostile curator link three days ago arrives at account creation and is presented with a checklist of "views you've been using." Users in the middle of an identity ceremony accept the defaults; that is the single most reliable finding in consent UX. The hostile View enters the policy store *through the ceremony that exists to prevent exactly that*.

Compounded by AV-2 (the hint persisted through history, so it genuinely *was* "being used") and by AV-18/starter-pack monoculture below: the promotion checklist is where the whole session's accumulated hints get laundered into policy in one tap.

**Repair (suggestion).** Promotion offers **only** Views the guest explicitly saved or starred — visiting is not using. Each offered item shows provenance and acquisition ("suggested by a link you opened on 3 Aug from reddit.com"). Nothing is pre-checked.

### AV-23 — The removal ceremony's "newly reachable fallbacks" preview has no completeness statement (NOTE, VERIFIED)

§4.4 and §2.5.4: the ceremony shows "**representative** changed winners" via `eth_simulateV1` preview. Representative is a sample. An attacker who plants a dormant squatter at a position the sample misses gets the classic removed-curator activation with a clean-looking diff — the ceremony that §7.1 names as the answer to that attack. Same disease as AV-5: a safety surface with no completeness axis. **Repair (suggestion):** the diff carries its own completeness ("12 changed winners shown; preview covered 200 of ~4,300 positions"), and a *removal* that expands the reachable set states its count categorically — computed to closure, or explicitly estimated.

---

## 5. Web-of-trust creep and scale re-explosion

### AV-24 — One-off Views grow authority horizontally, and nothing counts the total (SERIOUS, VERIFIED)

**The text.** §4.2: *"'See folder X as Alice curates it' → a one-off View whose lens = base FS lens + one pinned import of Alice's published View, `importClass=AUTHORITY_RULES`, scope=X, depth 1 … One-off Views are the pressure valve that keeps the base list small (SCALE-2)."* §1.4 rule 2: discovery sources "may legitimately exceed 55 (following 500 people)."

**The creep.** SCALE-2's watch is aimed at *vertical* growth (`ALLOW_NESTED` depth > 1 — guarded by §2.2.4 and by [object-taxonomy §2.7](./object-taxonomy.md)'s depth-2 cap). The growth here is **horizontal**: each one-off View is a depth-1 authority import of one person, and there is no stated limit on how many a user accumulates. After a year of ordinary curiosity — sourced from an unbounded 500-person discovery pool, converted one legitimate tap at a time — the base people-list is still 45 and the **effective authority-bearing principal count across all saved Views is 245**. No surface in either lane counts it: §6's scale story counts the people-list, §5.1's cache vector counts "≈45 principals," and E6's ceiling is a *compile-time* number per plan, not a per-user total.

The conversion path is also the one the rails forbid in aggregate: *discovery result → "see it as they curate it" → authority import*. Each instance is deliberate and legitimate; the sum is friends-of-friends reached by attrition instead of by nesting.

**Repair (suggestion).** (1) Count and surface **effective authority principals across all saved Views**, one number in the policy inspector, budgeted against the 15–55 centre. (2) One-off Views are one-off: they expire or require re-confirmation, since they are named for transience and built for permanence. (3) The discovery→authority conversion names the tier and shows the running total at the moment of conversion.

### AV-25 — The achievement standard is a live computed-principal-set pipeline aimed at the blessed hook (SERIOUS, VERIFIED against [Ideas](../../Ideas.md))

**The text.** §1.4 rule 4 fences web-of-trust: *"The only ingestion path for computed social graphs is: an application publishes a resulting explicit policy (a signed curator View with evidence attached) which a user deliberately imports."* [research §5.3](./research.md) records the Nostr-WoT field failure and the creep watch: *"any proposal that puts a computed principal set inside a compiled plan without a signed source revision is this failure returning."*

**The attack is a product feature.** James's 2026-07-28 Ideas entry asks for an achievement standard with *"a configurable read-only eligibility function or validator: given a principal and an achievement, can this principal earn or claim it now?"*, per-app *"trusted issuer"* attestation, cross-app aggregation, and it explicitly worries about *"turning any of them into a generic green trust badge."* That is a principal→attribute oracle with issuers, at ecosystem scale.
1. An achievement app publishes a curator View whose membership is "everyone holding achievement X," with evidence attached. This **satisfies the fenced hook exactly**: signed, explicit, deliberately imported.
2. It publishes it as a **channel**, advancing hourly. The user subscribes once.
3. The result is a live, auto-updating, machine-derived principal set of unbounded cardinality sitting inside compiled plans, entering through the legal door, refreshing without a per-revision decision.

The hook's constraint is "signed source revision," and a channel produces a signed source revision on every advance. The clause does not distinguish *curated* from *computed* membership, so the guard passes on the one case it exists for.

**Repair (suggestion).** Add one field and two rules: a published View/lens revision declares `derivationKind: CURATED | COMPUTED(algorithmRef)`; a `COMPUTED` set (a) may not be followed as a channel — pin-only, re-adopt per revision with a diff and a count; (b) may not occupy an authority tier without an explicit per-adoption ceremony; (c) counts against AV-24's effective-principal budget at full cardinality. And flag to the owner that the achievement exploration must be commissioned with the lens/WoT rails attached — the Ideas entry's own last question ("without turning any of them into a generic green trust badge") is this finding, asked from the other side.

### AV-26 — The §5.1 cache vector is sized for the friendliest case and sold as the scale payoff (NOTE, VERIFIED)

§5.1 totals "≈130–180 words … **One pinned-basis batched call** refreshes the whole vector in one round trip — cheap enough to run on app-focus," and calls this "the concrete payoff of the 15–55 honesty." The sizing assumes one-to-three realms, ≈45 principals, ≤20 channels, and no saved-View set. Under LC-14 (entries × realms — [use-pressure §1.2](./use-pressure.md) prices a 20×3 = 60-row case as legitimate) the per-author `viewMutationVersion` and KEL-head rows multiply by realm count; under AV-24 each saved View adds channel generations and acceptance floors. **Repair (suggestion):** state the growth law — `O(realms × principals + views × channels + advisorySources)` — and give the honest number at the LC-14 and 200-saved-Views cases, so the payoff sentence survives contact with the product.

---

## 6. Privacy of personal policy

### AV-27 — The batched dependency-head vector **is** remote `resolveMany`, fired on every app focus (SERIOUS, VERIFIED)

**The rule it breaks.** [human-overview §7.12](../../Designs/efsv2/human-overview.md), binding: *"The reference OS **must not** send a personal lens's principal set through remote `resolveMany` by default; it should resolve from a local replica or bulk authenticated snapshot. If a remote RPC is used, disclose that the provider or OHTTP gateway learns the queried principals."*

**The text that breaks it.** §5.1: *"**One pinned-basis batched call (`eth_simulateV1` / multicall) refreshes the whole vector in one round trip** — cheap enough to run on app-focus, so 'is every cached view still valid?' is an O(1-round-trip) question at this scale."* §6.2: *"Vector check (1 batched call, amortized per focus event)."* The vector's contents (§5.1's table) include ≈45 per-author `viewMutationVersion` slots and ≈45 KEL heads — **the complete principal set of the personal policy**.

**Attack.** No cleverness required; it is the default hot path.
1. The client sends the user's entire trust roster to the configured RPC, in one request, **on every focus event**, whether or not the user reads anything.
2. Worse than per-read `resolveMany`: it is periodic, unprompted, complete, and independent of user activity.
3. The multiset of ~90 slot keys is a **stable cross-session identifier** — better than a cookie, surviving IP rotation and profile clearing. Two endpoints (or one RPC plus one gateway) can link a guest session to an account session the moment both warm the same vector.

§7.7 acknowledges the leak as a residual ("remote resolution of personal principal sets is a disclosed mode") — but §5.1 and §6.2, the sections an implementer reads, do not mark the mode and present the remote call as the design's headline efficiency win.

**Repair (suggestion).** Mark the mode where it is specified: the batched vector is a **local-node/replica** operation. Against a remote RPC it is a disclosed, non-default mode, and it must be split, padded, or decorrelated. Note that the same file already adopts the better answer at §5.5 — the CRLite/Clubcard basis-stamped filter bundle ([research §7.1](./research.md)) is exactly a *no-per-query-network-traffic* revocation/change check, which is why Mozilla built it. §5.1 and §5.5 should be connected rather than parallel.

### AV-28 — Citations disclose the citer's plan, and the disclosure preview is attached to the wrong share-sheet item (SERIOUS, VERIFIED)

**The text.** [object-taxonomy PP-2](./object-taxonomy.md) / [review §11.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md): publishing an `EffectiveLensId` or a receipt is **deliberate disclosure**, and an unsalted deterministic ID over a small guessable membership set is a dictionary oracle. views-links §0: *"A Citation says exactly what was seen … under exactly **which pinned policy**."* §4.6's disclosure preview appears under **item 3** (publish-my-view) and **not** under item 4 (exact citation). §4.7 lists citations as *defended* (D7).

**Attack.** Citation is the frequent act; publishing a view is the rare one. The design put the warning on the rare one. Every citation a person mints carries a policy reference sufficient to invert the dictionary over their (small, public, guessable) membership set for that scope — in a link that ends up in a paper, a forum, a chat log, and a gateway's request stream. A dozen citations from one person across a dozen scopes reconstructs their policy shape. The attacker's cost is reading public links.

**Repair (suggestion).** Citations default to a **receipt digest without a plan reference** — reproducible-by-the-citer, not reproducible-by-strangers — with full reproducibility as an explicit upgrade carrying §4.6's disclosure preview: *"include my policy so others can reproduce this exactly — this reveals which of your sources selected it."* Move the preview to item 4 as well as item 3.

### AV-29 — The guest's fetch pattern is the AV-1 oracle, network-side (NOTE, VERIFIED)

§3.3 opens honestly ("guest ≠ anonymous") and then designs a **progressive** verification ladder that increases the number and diversity of endpoints contacted per read. Combined with VL-HINT-2's branch, the gateway learns not merely "you fetched X" but "your client did/did not then fetch lens revision R" — the private-policy coverage bit, observed at the network layer. The §3.3 ladder's "cannot prove — and must say so" column does not name query-shape leakage. **Repair (suggestion):** name the row, and make the hint fetch unconditional. AV-1's repair closes this one too; one fix, two findings.

### AV-30 — Recovery-bundle metadata is public by construction and correlates with events (NOTE, VERIFIED)

[object-taxonomy §3](./object-taxonomy.md) stores the Recovery Bundle as an ordinary encrypted EFS DATA object, discoverable via the owner self-escrow index or roots-forward enumeration; profiles-composition §4.3 inherits this ("CXF-shaped export/recovery ceremony") without comment. Mandatory indexing means *existence, author, size, and update cadence* are public — [owner-rulings 2026-07-15](../../Designs/efsv2/owner-rulings.md): *"on-chain = metadata-exposed, full stop."* An observer learns: this principal maintains a trust policy, of roughly this size (⇒ roughly this many principals — the 15–55 centre makes size a good estimator), re-exported on these dates (⇒ trust changes correlated with world events: *"she re-exported the day after the protest"*). **Repair (suggestion):** pad bundle writes to size buckets, batch/decorrelate them in time, or hold the bundle off-chain by default with only a pointer committed.

---

## 7. UX-compilation honesty

### AV-31 — "Why is this file here?" is unanswerable across the list↔plan boundary, because nothing carries the back-pointer (SERIOUS, VERIFIED)

**The text.** §4's headline: *"the user maintains **one list of people** plus per-person purpose toggles; everything else is deterministic derivation."* §4.1 specifies the mapping as a pure function list→plan. Explanations run the other way ([review §13.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), §3.1 note ii): "rule: Curators tier / `PRIORITY_FIRST_PRESENT`; selected: Alice."

**The gap.** The user's real question is *"why is Alice's file here and not Bob's, and what do I change?"* — which requires **plan→origin** inversion: which list entry, toggle, group, override, import edge, saved one-off View, or starter pack produced that rule. §2.5.2's `LensCompilationRecord` carries provenance to *source revisions*, not to *UI rows*. `editorHints` ([object-taxonomy §2.3](./object-taxonomy.md)) is explicitly **non-semantic** and does not enter `EffectiveLensId` — so the UI-origin mapping is nowhere in the compiled bytes at all.

**The attack version.** A hostile rule that arrived through a starter pack is fully legible **in the plan** and entirely invisible **in the people list**. The user audits the surface the product told them is authoritative — "one list of people drives everything" — and sees nothing wrong. The framing is the vulnerability: imports, one-off Views (AV-24), and starter packs all add rules the list does not show, and §4 teaches the user that the list is the whole truth.

Add §4.2's saved one-off Views: a View saved six months ago outranks the base list inside its scope, and the item-level explanation never says "this came from a View you saved on 3 Aug."

**Repair (suggestion).** (1) The compiler emits a **provenance back-pointer per compiled rule to its authoring origin** (list entry / import edge / saved View / starter pack), carried in the Compilation Record — non-semantic, so `EffectiveLensId` is unchanged and the pure-function property survives. (2) The policy inspector's primary surface becomes **"everything that can name a file for me"** — one flat list of effective sources with origins — and the people list is presented as *one contributor to it*, not as the whole. That is the honest version of "one list drives everything": one list **edits** most of it; one inspector **shows** all of it.

### AV-32 — Hiding complexity hides the attack: the scope-root grant ceremony trusts the suggester's ID↔name binding (SERIOUS, PLAUSIBLE)

**The text.** §4.1: *"INNER + files(roots) → tier 1 authority **scoped to the named shared roots** (no global grant is derivable from a toggle — root naming is mandatory, **suggested-not-defaulted**)."* [review §2.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), correctly: scope roots are "immutable, domain-separated container/definition identities, **not display path strings**."

**Attack.** Who suggests? In the normal flow, the counterparty ("Alice wants to share this folder with you") or an app.
1. Mallory shares a folder. The accept ceremony renders "Give Mallory permission to name files under **/shared/mallory-photos/**".
2. The committed `ScopeRoot.rootId` is an **ancestor** — `/shared/`, or under FS-LENS/1's scope-root shapes, an ADDRESS container.
3. The correctness property that scope roots are IDs, not strings, is exactly what makes this invisible: the user reads a string the suggester chose; the plan commits an ID the suggester chose; the binding between them is asserted by the suggester at the moment of maximum social pressure.
4. Mallory now holds tier-1 authority over everything below the ancestor. Nothing in §4.1, §4.4, or views-links' NS floor requires the ceremony to render the root's resolved extent.

NS-6 covers authorship boundaries in *content*; NS-8 covers confusable names in *listings*. Neither covers the **grant ceremony**, which is the one place a name→ID binding is trusted with authority attached.

**Repair (suggestion).** The grant ceremony renders each scope root as: (a) its ID; (b) its path **as resolved under the user's own current plan**, not as the suggester spelled it; (c) the count of existing positions inside it; (d) an explicit warning when it is an ancestor of any folder the user already has ("this is an ancestor of 14 of your folders, including /shared/finance"). Add it to the NS floor.

---

## 8. Consistency sweep — lane vs lane, lane vs rails

### AV-33 — `?lenses=`/`?deny=` are deleted here and shipped verbatim in the client design (SERIOUS, VERIFIED)

views-links §2.2 CHANGE 1 removes principal arrays from the grammar and calls it "the big one." [boot-and-profiles §1.2](../../Designs/clientv2/boot-and-profiles.md), the client lane's link taxonomy, defines the **citation link class** payload as *"`~claim:` + `?lenses=` chain + `deny=` + `asof=` + hash-pin (§1.2/§6.5 citation form, **verbatim**)."* Two live design documents in one vault specify incompatible grammars for the same product's highest-security link class, and views-links §8 lists boot-and-profiles under **"could not verify,"** so the conflict is currently undetected. Whoever implements first wins; the citation class is precisely where §4.6's privacy argument is strongest. **Route:** one reconciliation ruling. views-links' deletion should win on the privacy argument; boot-and-profiles' *placement* should win on AV-34's argument.

### AV-34 — Trust-adjacent params live in the query here and in the fragment there (SERIOUS, VERIFIED)

boot-and-profiles §1.3–§2.1 puts the entire link taxonomy in the `#efs1.` **fragment**, with an alphabet invariant, a terminal `.k.` capability sub-segment, and a normative ingest order in which the shell's inline first script strips the capability before anything else runs — and explicitly *rewrites query→fragment via `replaceState()` as its first act* for alias ingress. views-links §2.2 defines `view=`, `lens=`, `asof=`, `excerpt=`, `grades=` as **query keys** — sent to gateways, logged by RPCs, stored by chat unfurlers, leaked in referrers. Given views-links' own §2.2 rationale, putting the trust-adjacent keys in the query is self-defeating: it shrinks the leak from "the sender's whole lens" to "the sender's chosen curator and resolving tier" without changing its kind. **Repair (suggestion):** every trust-adjacent key moves to the fragment; the query carries presentation sugar or nothing.

### AV-35 — The threat toolkit omits the link classes the client already ships (SERIOUS, VERIFIED)

views-links §4.1: *"A link controls: location, presentation params, a view/lens reference, a citation target, its own display text, and the choice of gateway host."* boot-and-profiles §1.2 ships seven classes, of which four are trust-bearing and none appears in the §4.7 ledger: **`pr`** (permission-prompt link → a System Chrome capability request), **`gx`/`gf`** (generation links → boot *someone else's entire OS closure*, with a full capability-table-diff install review on adoption), **`a`** (app link, "zero-power install if absent"), **`k`** (capability token). The lane's invariant — "a hostile link may waste your time; it may never spend your trust" — is asserted over an incomplete toolkit, and the single most dangerous link in the shipped taxonomy (`gx` — someone else's wiring) is absent from the lens pass's link-safety model entirely. **Route:** either views-links declares the OS link classes explicitly out of scope (client lane owns them) or extends the ledger. As written it reads as complete and is not.

### AV-36 — `lensRef` has no private variant, so the dictionary-oracle ID sits in a shareable record (SERIOUS, VERIFIED)

views-links §1.1: `lensRef: AMBIENT | LensObjectRefV1(EFFECTIVE|REVISION) | LensChannelRefV1`. [object-taxonomy PP-2](./object-taxonomy.md): the deterministic `EffectiveLensId` is used *inside* the resolver; a private store exposes only the randomized **Private Handle**, because an unsalted digest over a guessable membership set is a dictionary oracle. views-links §1.3 guards this with **policy**: *"A personal View whose `lensRef` points at your private lens must not be publishable as-is — the share sheet forces the reference swap."*

A personal View therefore has no correct value to store: `AMBIENT` is wrong (ambient ≠ my policy) and `LensObjectRefV1(EFFECTIVE)` embeds the deterministic ID in a record whose entire purpose is to be saved, synced, backed up, and possibly shared. The guard is a policy check on one code path (the share sheet) protecting against a **type-level** hazard. One mis-implemented export, one sync bug, one bundle inspection, and the ID is out — permanently, since it is deterministic.

**Repair (suggestion).** Add `PRIVATE_HANDLE` as a first-class `lensRef` variant that is **structurally unserializable in any publish path** — the encoder rejects it. Then the guard lives in the type system, not in a UI flow, and object-taxonomy's `PrivateLensHandle` finally has a place to appear in the object model that references it.

### AV-37 — "Grade-free projection is legal" vs the non-suppressible grade line (NOTE, VERIFIED)

profiles-composition §3.2's MOUNT-SNAPSHOT row: *"grade-free projection is legal because every axis was checked at snapshot build."* views-links NS-1 makes the grade/basis line **non-suppressible for every conforming client**; [FS-LENS/1 §1.11](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) requires `user.efs.grade` and `user.efs.basis` xattrs on the mount. The two lanes disagree about whether the ordinary-app profile — P-16a's *recommended* arm — shows grades at all. **Repair (suggestion):** "grade-free" must mean *per-entry grades collapse to one manifest-level statement*, never *no grade surface*; the manifest-level statement is NS-1's line.

### AV-38 — Two lanes each add "one" row to the same locator enum (NOTE, VERIFIED)

views-links §1.3 flags loudly: `LensObjectRefV1.semanticKind` gains **`VIEW`**. object-taxonomy §2.6 rule 2: `semanticKind` "extended by one discriminant: **`ROSTER`**." Neither cites the other; both present theirs as the single addition, and their vector obligations differ. Not a contradiction — an unreconciled pair that the synthesizer must land as one change with one vector set.

### AV-39 — views-links names no clock domain (NOTE, VERIFIED)

profiles-composition §1.2 rule 4 is explicit ("evaluated under the venue clock only; no wall clock in GATE, no author-asserted TID"). views-links has `stale=show`, staleness display in NS-2, and "basis age" in NS-1, and never names the clock domain any of it is evaluated in — while [review §4.5](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)'s rule 1 is that bounds compare only within identical `ClockDomainRef`s. One sentence, but a guest-tier client with a wrong wall clock currently has no rule telling it not to compute staleness from it.

---

## 9. What survived the attack (stated so the repairs do not overreach)

Honest positives, each of which I tried to break and could not:

- **The reference-not-content wall** (views-links §1.1's "what a View deliberately cannot express", plus the decoder-rejects rule). Every trust-smuggling attempt I constructed had to route around it rather than through it. AV-4 and AV-36 are holes *beside* the wall, not in it.
- **VL-HINT-3 (viewer-side advisory composition).** "A hint can show you a different file; it cannot show you a flagged file unflagged" holds under composition — I could not construct a path from a hinted lens into the advisory rule set. The rule is correctly grounded in deny-after-resolve being viewer-side.
- **The import-class firewall** (§2.1: "profiles never merge with each other"). No attack I built could move a discovery source into an authority slice or an advisory action into a placement rule. [research §5.4](./research.md)'s field evidence (no deployed feed system lets a feed operator alter name authority) is the right check and it holds.
- **The §1.0 purpose lock.** Profile confusion in its literal form (a browse lens consumed as a gate) really is designed out: the profile+purpose IDs are in the canonical bytes, mismatch is a refusal, and GATEs are not derivable from the people-list. AV-19 defeats the *outcome* without defeating the lock — the lock does its job and the job is not enough.
- **CH-2.** The type-level separation argument is sound: composition operates on rules about principals and never writes claim evidence. AV-14 attacks the error surface, not the argument.
- **The four-source absence rule as a rule.** Both breaks I found (AV-11, AV-12) work by *satisfying* a source, not by evading the rule. That is a good sign about the rule and a bad sign about the two sources involved.
- **`?lenses=` deletion.** Correct and load-bearing. AV-7 and AV-33 are about it being incompletely executed, not wrong.

---

## 10. Vector obligations this red team adds

Each is a fixture that would have caught its finding:

1. **CH-1 gerrymander fixture** (AV-11): three-import plan where an imported rule takes a policy key with a narrower scope than the rule it displaces; assert the position does **not** yield `ABSENT_PROVEN` at any consumer, and that the coverage annotation is present.
2. **Budget→manifest fixture** (AV-12): build a closure manifest from a flooded container whose enumeration returned `INCOMPLETE_BUDGET`; assert the manifest commits `PARTIAL(cursor)` and every downstream consumer refuses to derive absence inside it.
3. **Hint-branch indistinguishability fixture** (AV-1): identical network traces for a viewer with and without a policy covering the hinted location.
4. **Time-bomb View fixture** (AV-3): open a name-form `?view=`, advance the publisher's channel, re-open; assert a change notice fires with no prior subscription.
5. **Precedence fixture** (AV-4): View-`location` ≠ URL path; View-`basisPin` ≠ `asof=`; assert refusal/ambient-drop, never a silent winner.
6. **NS-8 truncation fixture** (AV-5): flooded container, budget-truncated candidate set; assert a stronger warning, never a weaker one.
7. **GATE freeze fixture** (AV-15): fresh evidence, stalled channel anchor; assert fail-closed at `policyMaxAge`.
8. **Transitive advisory fixture** (AV-16): advisory on a pinned transitive dependency; assert parent install denied.
9. **Unknown-label-value fixture** (AV-17): imported table + a label value the owner never enumerated; assert `NONE`, not the ceiling.
10. **Dead-advisory-source fixture** (AV-20): revoke the source principal; assert `UNEVALUATED`, GATE fail-closed, interactive banner — never clean.
11. **Ground-down principal fixture** (AV-21): equal-rank claimant with a low byte prefix; assert the CONFLICT row renders no claimant-derived content.
12. **Promotion-harvest fixture** (AV-22): guest visits three Views, saves none; assert the promotion checklist offers zero.
13. **Effective-principal-count fixture** (AV-24): 200 saved one-off Views; assert the inspector's total and the budget warning.
14. **Ancestor-scope fixture** (AV-32): grant ceremony where the suggested display path is a descendant of the committed root; assert the ancestor warning and the position count.
15. **Replay-realm fixture** (AV-10): a realm replaying another's principals wholesale; assert the chrome-owned realm transition and the mass-`PORTABLE-EVIDENCE` flag.

---

## 11. Confidence

**VERIFIED (traced to exact text this pass):** every quotation above, read in [profiles-composition.md](./profiles-composition.md) and [views-links.md](./views-links.md) in full; the ambient-baseline `EXACT(owner)` chain (profiles-composition §2.5.3 + §4.2 + [review §12.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) that grounds AV-11; the priority-path displacement mechanism (review §2.1 / profiles-composition §2.2.1); the four-source rule and FSP-ABSENT-1/2 ([filesystem-core §1.7](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)); seam 12's `resolveMany` prohibition and seam 19's package/update text ([human-overview §7](../../Designs/efsv2/human-overview.md)); the mandatory-indexing metadata consequence ([owner-rulings](../../Designs/efsv2/owner-rulings.md) 2026-07-15); P-16/P-17 status as *unanswered* ([owner-decision-inbox](../../Designs/efsv2/owner-decision-inbox.md)); the client-lane link taxonomy, fragment grammar, and ingest order ([boot-and-profiles §1.2–§2.1](../../Designs/clientv2/boot-and-profiles.md)); chrome/prompt-surface rules ([web-os-thesis](../../Designs/clientv2/web-os-thesis.md) F1/T10); the guest requirement and the achievement entry verbatim ([Ideas](../../Ideas.md), James 2026-07-28); the kill list and D-ledger ([joined-pass-synthesis](../../Designs/efsv2/joined-pass-synthesis.md)); `CHANNEL_ADVANCE` grantability and PP-1..PP-6 ([object-taxonomy §4.4, §5](./object-taxonomy.md)); the GATE dataflow and `policyVersion` floors ([core-onchain §7.2](./core-onchain.md)); labeler-ecosystem and Nostr-WoT field evidence ([research §5.1, §5.3](./research.md)); TUF's role set as the design precedent both lanes cite (review §17.2).

**PLAUSIBLE (constructed; the fixtures in §10 are the check):** the exact exploitability of AV-16 (depends on whether closure dependencies are content-pinned, which rule 8 does not state); AV-21's grinding cost (arithmetic on a leading-zeros grind, not measured); AV-32's ancestor-root expressibility under the final scope-root grammar; AV-5's suppression variant (depends on an unstated implementation choice — that it is unstated is the VERIFIED half); AV-25's channel-advance path (the hook's wording permits it; no implementation exists to test); all UX-habituation reasoning in AV-6/AV-8/AV-22; every repair suggestion.

**Could not verify:** whether the GATE closure pins dependencies by content or by name (profiles-composition §1.2 rule 8 is ambiguous and it decides AV-16's severity); whether `MOUNT-SNAPSHOT`'s builder is specified anywhere outside §3.2's one line (AV-12's blast radius depends on it); the final `ScopeRoot` grammar (AV-32); whether any deployed `web3://` gateway constrains the query grammar (the same gap views-links records); the exact compact URL encoding for locatable refs (owed with vectors, per views-links §8); [[assumptions-and-requirements]] row-level cross-check — consulted through citations only, the same debt every lane in this pass records.

**Pushback:** none against an adopted ruling. Two findings correct a lane's own claim rather than a ruling: **AV-11** (CH-1 is asserted as structural and is conditional) and **AV-19** (GATE isolation is asserted as complete and covers only half the dataflow). Both should be fixed in the text before §9's lift into the replacement spec, because both are currently written as conformance gates and a false gate retires the vectors that would catch the real thing.
