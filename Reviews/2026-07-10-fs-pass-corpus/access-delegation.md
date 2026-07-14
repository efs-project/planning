# FS pass, Lane: Access control & delegation

**Adjudicates:** kickoff open question 1 ("is 'write permission' mis-framed entirely?"), OS ask P4, the `successor`/`act`/delegation reservation shape, delegated revocation, deny-subtraction-as-exclusion, and the privacy face of access control (pulled into this pass by James).
**Ground truth relied on:** [[fable-fs-kickoff]], [[fs-feature-space]] §1, [[state-brief]], [[read-lens-spec]] (§1–5, §8), [[codex-kinds]], [[codex-envelope]], [[identity]], [[client-os-pressure-report]] P4/P2/P9, [[wallet-and-actions]] (persona architecture), [[freeze-gates]] §C, [[ops-doctrine]].
**Confidence markers:** [ruling-proposed] = this lane's answer, argued and ready for red-team; [confirmed-native] = already expressible today, walked here; [rejected] = examined and refused with cause; [dependency] = lands on another lane or a James decision.

---

## 0. Verdict in six lines

1. **"Write permission" is mis-framed — retire it.** [ruling-proposed] It has no referent in a system with no shared mutable cell and permissionless writes. It decomposes, completely, into five separable wants (§1), every one of which has a native or cleanly re-homed answer. Nothing in the decomposition is lost; POSIX write-gating is an artifact of the one-mutable-cell world and is **declared gone** (§9).
2. **Curated-view membership is the replacement for "grant Bob write access"** and is expressible today with LIST + TAG + lens mechanics — but it needs one blessed encoding (the lens-object convention, Durable) and it has **two distinct modes** (author-mode vs record-mode, §3.2) whose retraction semantics differ in exactly the way teams care about.
3. **Delegated authorship is a READ-side feature, not a kernel feature.** [ruling-proposed] The kernel never verifies delegation — author = recovered signer is inviolable. "Write as the team" = the team publishes an `act` claim (delegate + scope + expiry); delegation-aware **resolvers** expand the team's lens position to in-scope delegate records, rendered dual-attributed. This is the validated persona-stitching construction generalized from self-fleet to team, with attenuation added. Machinery is Durable and **can ship in v2**; only the reserved-key **row** is freeze-bound.
4. **Delegated revocation stays out of the kernel.** [rejected as kernel change] `revoker == author` survives. The team-shaped needs are covered by (a) routing canonical placements through curator-authored claims, (b) deny-advisories — which are, precisely, *permissionless delegated revocation scoped to consenting readers* — and (c) pre-signed revoke ladders, whose custody can be delegated as pure convention.
5. **Exclusion is two different things and neither is a write-gate:** exclusion from the *canonical view* = lens membership + deny-subtraction (native); exclusion from *reading at all* = salted TAGDEF + encrypted bodies — capability-shaped, already reserved, with honestly stated costs (removal = re-salt + re-key; the roster and co-occurrence graph still leak, §6).
6. **Freeze-sensitive output:** mint the `act` row and the persona-link/`label` row (RESERVE); everything else in this lane is convention or Durable spec (§10, loud). One hard dependency: **time-windowed membership/delegation is only honest if P1 `admittedAt` ships** — order/claimedAt are back-datable into any window.

---

## 1. The reframe: what "grant Bob write access to /projects" actually means

POSIX asks *who may mutate the one object*. EFS has no one object: every edge slot is `(author, key)`, writes are permissionless [ruled], and control lives at read time [settled]. So the sentence "grant Bob write access" is a bundle of five different wants. The decomposition below is intended to be **complete** — each want is stated with its EFS answer and its POSIX ancestor, so a developer reaching for `chmod` finds the real primitive instead:

| # | The want, in the user's words | POSIX ancestor | EFS answer | Status |
|---|---|---|---|---|
| **W1 Visibility** | "Bob's writes should show up in the project's canonical view" | `w` bit / ACL grant | **Curated-view membership**: add Bob to the view's lens (a curator-owned LIST) | native today (§3) |
| **W2 Authority** | "Bob may write **as** the team, under the team's name" | ACL grant on a group-owned dir; sudo -u | **Delegated authorship**: team-authored `act` claim + delegation-aware resolution | read-side, ships with the `act` row (§4) |
| **W3 Read-exclusion** | "people outside the project can't see it" | `r` bit removal / dir `x` | **Capability privacy**: salted TAGDEF (hidden coordinates) + encrypted bodies (keyWrap) | reserved (Pass-2 machinery), shape confirmed here (§6) |
| **W4 Write-exclusion** | "nobody else may write here" | `w` bit removal | **Declared gone.** No write-gate exists or can (permissionless pool [ruled]). Honest approximations: outsiders can't write *into the canonical view* (W1 does that), and can't even *address* a salted container (W3 does that) | gone, correctly (§9) |
| **W5 Retraction** | "and I want to take it back later" | ACL edit / chown | Three distinct sub-wants: **prospective** (eject from lens — native), **retroactive-of-view** (deny/eject removes past claims from the view — native, with a tension §3.3), **retroactive-of-authority** ("was-authorized-until-N" as a portable fact — needs `admittedAt` for windows now, KEL validity-windows for the cryptographic version) | §3.3, §5 |

Two education framings worth adopting verbatim in dev docs:

- **git commit vs push.** Anyone can commit (permissionless writes: your slots are your repo); "push to the canonical branch" is curation (lens membership / curator placement); the maintainer's merge is record-mode curation (§3.2). Developers already run this exact trust model daily; say so and the `chmod` reflex dies faster.
- **Zanzibar, read-side.** Google's Zanzibar does authorization as *relation tuples stored as data, checked at action time* — not as mode bits on objects. EFS lenses are Zanzibar-shaped: membership is data (LIST entries), "check" happens at resolution, groups-of-groups = lens-includes-lens, and Zanzibar's zookies (consistency tokens) map onto checkpoints/AS-OF(N). The industry's biggest authorization system already moved to read-side relations; EFS is not being eccentric here.

**The one thing the reframe must say loudly** (mission-end honesty): there is no root. No superuser, no administrative override, no "protocol takes it down." That is not a missing feature; a root would be a write-gate over every reader's view — the antithesis of credible neutrality. Everything below is built without one.

---

## 2. Substrate this lane builds on (one paragraph, for citation)

Slots are `(author, key)`, LWW by `(order, recordDigest)`, empty-on-revoke [settled]. Lenses are ordered trusted-author lists, first-attester-wins, PROVEN-ABSENT-only fallthrough; deny-sets subtract after resolution and never re-open it [settled, read-lens-spec §2–3]. TAG slot key is `(author, definitionId, targetId)` — so per-target membership/advisory/act claims are O(1) point reads. Revocation is the monotone G-set with `revoker == author` [Etched]. The persona architecture ([[wallet-and-actions]]) already validated the exact construction this lane generalizes: an owner-authored VAL-layout TAG roster (`efs.os/persona`, target = member address, VAL = label, LWW per member; add = assert, relabel = re-assert, remove = REVOKE), read-side stitching as a *derived lens view* with mandatory disclosure, and the rule that **GATE reads never expand**.

---

## 3. W1 — Curated-view membership: the mechanics of "add Bob to the project view"

### 3.1 The concrete shape [confirmed-native, one convention gap]

A **project view** = (a namespace anchor, a lens, a deny-set):

- **Namespace anchor:** a TAGDEF subtree under some identity's container — the steward's (`/0xAlice…/projects/`) or a team anchor identity's (§4.6). (Whether a *neutral*, no-address Schelling root is expressible is a naming-pass question; this lane doesn't need it — the view, not the anchor, is what's shared.)
- **Team lens `L_T`:** a LIST owned by the curator; members = TAG entries with `definitionId = listId`, `target =` member address word. Slot key `(curator, listId, member)` ⇒ one LWW membership slot per member — add = ASSERT, remove = REVOKE (slot reads EMPTY), re-add = re-ASSERT. Lens **position** (first-attester-wins order) rides the TAG **weight** word [convention-proposed — see the gap below]. Nested composition ("include the design-guild lens here") = an entry targeting another LIST, resolved recursively with a **`MAX_LENS_INCLUDE_DEPTH`** budget (Durable constant for read-lens-spec, cycle-detected, same shape as `MAX_AUTO_FOLLOWS`).
- **Deny-set `D_T`:** advisory authors whose deny-TAGs subtract (read-lens-spec §3.4, unchanged).
- **Subscription:** members and readers subscribe with pin-and-diff (§4.5): removals live-follow, additions/reorders prompt. Note the consequence honestly: *membership propagation is per-reader and eventual* — "Bob is in the project" becomes true for each subscriber as their pinned lens updates. There is no instant, global membership flip, and cannot be.

**The convention gap (Durable, flag to read-lens-spec/SDK):** [[read-lens-spec]] §1.1 says a lens "is data (a LIST) or client config" but **no normative lens-object encoding exists** — ordering encoding, subtree scoping (this lens governs `/projects/`, not my whole world), deny-set reference, include-depth. Delegation-aware resolution (§4) and team folders both need it. This is *exactly* where per-client dialects would fork trust behavior, so it should be a blessed SDK/read-lens-spec convention with vectors — but it is **not freeze-sensitive** (LIST + TAG + weight suffice; no new record shape).

Cost profile, stated because it's a genuine advantage: adding or removing a member is **one claim** (~22–27k gas), nothing re-encrypts, nothing re-keys, no subtree rewrite — contrast Cryptree/Tahoe-style capability filesystems where group change is a re-encryption cascade. (The cascade returns only when the folder is *private* — §6.3 — which is the honest capability-systems tax, not an EFS regression.)

### 3.2 The two membership modes — the real design content of W1 [ruling-proposed]

"Bob is in the view" can bind at two different granularities, and the difference is the whole retraction story:

- **Author-mode** (trust the author): Bob's address in the lens. Everything in-scope Bob writes resolves, past and future. **Ejection removes his entire history from the view at the next resolution** — because lens membership is evaluated at read time, not at write time.
- **Record-mode** (trust the record): the curator counter-signs specific claims — an approval TAG targeting the claimId (or the curator re-PINs / places Bob's DATA under the canonical path themselves). The approved records resolve under the *curator's* authorship or approval slot, independent of Bob's lens status forever.

Neither mode is "the" right one; they fail in opposite directions, and the pass should say so instead of picking:

| Event | Author-mode outcome | Record-mode outcome |
|---|---|---|
| Bob's key is **stolen** | eject → thief's writes AND Bob's history leave the view (fail-safe, exactly right) | approvals of pre-theft records survive (right); new thief records were never approved (right) — but the curator must notice and stop approving |
| Bob **retires** amicably | his contributions vanish from the view (wrong — the "alumni problem") | contributions persist (right) |
| Bob turns **spammy** | eject = lose history; or keep + deny each bad claim (tedious) | just stop approving (right) |

**Blessed team pattern = both, layered:** author-mode membership for the live working window (cheap, promptless for the curator), plus **periodic record-mode approval sweeps** (one atomic batch envelope — one signature over N approval TAGs — makes a sweep cost one ceremony) so that anything worth keeping survives ejection. The SDK verb for "remove member" should *offer the sweep* ("Keep their 47 contributions in the project view? [approve all] [review] [drop]") — that single affordance dissolves the alumni problem.

The deny-set is the third tool and completes the matrix: **deny is per-claim subtraction without ejection** (keep Bob, kill the one bad claim), and it works when the author is hostile or absent — the read-lens-spec §3.4 machinery, unchanged, no new surface.

### 3.3 Time-windowed membership and the `admittedAt` dependency [dependency — flag loudly]

Guest-for-a-week (§8.C) wants membership **bounded in time**: entry claim with `expiresAt = now + 7d` is native and correct for *the live window* (entry goes STALE; a STALE membership entry MUST be treated as not-in-lens for GATE resolution — expired authority never authorizes; INTERACTIVE may label). But the subtler want is **"honor records Bob wrote while he was a member"** — a window test per record. The only honest comparand is **`admittedAt`** (P1): `order` and `claimedAt` are author-asserted and back-datable, so a window test against them lets an ejected Bob **back-date new records into his authorized window** — a live exploit, not a corner case. Consequences to state normatively:

1. Window semantics on membership/delegation are **venue-relative** (admittedAt is per-chain) and unavailable at all if P1 is refused — in which case windowed membership degrades to "live window only" and the record-mode sweep is the *only* way to keep a departed member's work. **P1 is load-bearing for this lane**; add that to the P1 decision inputs in [[freeze-gates]].
2. The portable, venue-independent alternative is always record-mode (approval pins claimIds — content-addressed, carriage-independent). Blessed guidance: **windows for convenience, sweeps for permanence.**

---

## 4. W2 — Delegated authorship: write-as-the-team

### 4.1 The reframe that dissolves most of the problem [ruling-proposed]

P4 framed delegation as a missing *credential the kernel would verify*. But the kernel never needed to verify it: writes are permissionless and the kernel's one authorship fact — author = recovered signer — must never bend (it is the portability and verification model). "Bob writes as the team" is entirely a question of **how a reader resolves the team's namespace**: does the resolver, at the team's lens position, honor Bob's in-scope records? That is lens semantics — Durable, read-side, per-viewer. So:

> **Delegated authorship = an authority fact published by the team (the `act` claim) + a resolver rule that consumes it (delegated resolution). Kernel: nothing, ever.**

This is not a new invention — it is the *already-validated* persona construction ([[wallet-and-actions]] §Linking, red-team-confirmed) generalized: persona-stitching expands "primary" to "primary + linked personas" as a derived lens view; delegation expands "team" to "team + in-scope delegates." One mechanism, two instantiations (self-fleet; team). The unification is itself a finding: **the persona architecture IS the delegation architecture at n=1 trust distance**, and the org key / member key custody split below (§4.6) is the primary/persona custody table at org scale.

### 4.2 The candidate mechanisms, adjudicated

| Mechanism | Verdict | Why |
|---|---|---|
| **Per-team shared EOA** | acceptable floor, never the recommendation | No per-member attribution (audit gone); no member-granular retraction (rekey = new identity pre-KEL); theft = identity death (same-key war); m-of-n custody exists but m-of-n *authorship* doesn't ([[identity]] am.3). It is what small DAOs will do anyway (apps-cookbook row) — bless it only as the **cold anchor** in §4.6, not the daily writer |
| **Macaroons** | **[rejected]** | HMAC caveats verify only against a shared secret — no public verifiability. Fails verify-don't-trust at the first hurdle. Steal nothing but the *attenuation* idea |
| **UCAN-style offline bearer certs** | rejected as carrier; **grammar adopted** | Public-key cert chains fit the grain, but a purely offline credential has UCAN's own unsolved problem: revocation needs a mutable, discoverable store — *which is exactly what EFS is*. Publishing the credential AS a claim buys: REVOKE (monotone, portable, multi-venue broadcast), `expiresAt` (currency), lens-legibility, disclosure, and the same grading machinery as everything else. Adopt UCAN's scope/attenuation semantics (resource + ability + expiry; no ambient authority) into the claim body; drop the bearer-token carrier |
| **KEL session/sub-keys** | right long-term for *identity*, wrong tool for *teams* | KEL delegation makes Bob's key sign *as the team word* — indistinguishable authorship. For teams that's a bug: you *want* dual attribution ("Bob for ACME") and per-member blast radius. KEL solves rotation, validity windows, and succession for the team's OWN key (§4.5); it complements, not replaces, `act` |
| **`act` reserved claim + delegated resolution** | **[ruling-proposed] — the answer** | Detailed below |

### 4.3 The `act` claim, specified

**Record shape** (freeze-sensitive: the ROW; semantics Durable):

- **Kind:** TAG (cardinality-N — many delegates), **VAL layout**, under the delegator's ADDRESS container, reserved key `act`.
- **Target:** the delegate's address word. Slot key `(team, act, delegate)` ⇒ **one LWW authority-policy slot per delegate**: grant = ASSERT, re-scope = re-ASSERT at higher order (whole-policy replacement — deliberately no accumulation of grant fragments; one authoritative policy object per delegate, mirroring `PersonaPolicy`), retract = REVOKE (empty-on-revoke; prospective).
- **VAL tail — the scope grammar** (string, canonical encoding fixed with vectors; UCAN-derived): `{ roots: [tagId…], kinds: subset of {PIN, TAG}, keys: allow/deny of reserved-key rows, flags }`. Normative floor:
  - **Objects (DATA/LIST/TAGDEF minting) are never delegated** — they are the delegate's own regardless; delegation governs whose *edges* the team's view honors.
  - **Identity rows are never in scope** (`home`, `checkpoint`, `successor`, persona-link, `act` itself): a delegate MUST NOT mint delegations or identity facts — **no re-delegation in v2** (depth 1). UCAN's chained attenuation is where its audit pain lives; revisit post-KEL with cause.
  - Scope membership test for a record = "is the record's slot anchor transitively under some `roots[i]`" — the existing bounded parent-walk, plus kind/key word checks. Everything is derivable from the record + the policy; no extra state.
- **Expiry:** `expiresAt` on the act claim = the validity window. STALE act = not-authority (GATE: stop; fail closed), same fail-safe rule as membership (§3.3), with the same `admittedAt` dependency for testing *records* against the window.

**Resolver rule — "delegated resolution"** (read-lens-spec extension, Durable):

1. At lens position `team` for key `K`: resolve `(team, K)` normally. The team's own claim, if any, **always outranks** any delegate's (the principal speaks for itself).
2. Else, if the reader has delegation-resolution enabled for this position: enumerate the team's LIVE `act` slots (bounded point reads / small enumeration under the team's container), filter to policies whose scope covers `K`, resolve `(delegate_i, K)` for each; pick by the act claims' weight order (delegate precedence is the team's to declare), then `(order, recordDigest)`.
3. Any result is rendered **dual-attributed — "Bob for ACME," never "ACME"** — with the act claim one interaction away (the U1 attribution chip, extended). Rendering a delegated record under the bare principal name is a conformance violation (the authority-laundering defense, §11.1).
4. **GATE reads never expand implicitly** (same rule as persona expansion). A machine consumer that wants delegates does it **explicitly and two-step**: first resolve the delegation set as its own graded read (act claims must be LIVE under §3.3 GATE rules — REVOKED/STALE/EQUIVOCAL act = fail closed), then consume from that now-closed author set. On-chain gates keep consuming closed author sets and point reads — a lens-walking contract remains an anti-pattern; contracts that want org+delegates read the act slots directly (point reads by construction) or stick to org-authored claims.
5. Duplicity/compromise hygiene: an EQUIVOCAL *delegate* poisons only their own records (blast radius contained — the point of per-member keys); an EQUIVOCAL *team* author poisons the act claims themselves ⇒ delegation resolution stops (fail closed).

**What verifies when:** Year-0 (pre-KEL): everything above — resolvers verify act claims like any claims; the team is a bare EOA; retraction is prospective; "was-authorized-until-N" is venue-relative via admittedAt (§3.3) or portable via record-mode sweeps. Post-KEL: the team word gains rotation and signed validity windows; act claims keyed on the **address word** (which never rewrites — [[identity]] in-place succession) are backed additively; "thief-after-N" becomes cryptographic. The reservation must therefore key `act` on the identity *word*, exactly as P4 path (a) proposed.

### 4.4 Sharpening of P4 worth stating plainly

P4 offered (a) "reserve, no v2 machinery" vs (b) "client-receipt-only forever." Both under-shoot: **(a)'s row plus Durable resolver machinery is a shippable v2 feature** — nothing about delegated resolution touches the kernel, admission, or the freeze surface beyond the row itself. The P4 framing conflated "kernel machinery" (never needed) with "machinery" (a read-lens-spec §3 extension + SDK verbs). Adjudication: **pick (a), mint the row, and let the resolver semantics iterate in read-lens-spec** exactly as deny-composition does today.

### 4.5 Bounded pre-authorization (the AP2/open-mandate analog), adjudicated

"Admit up to N records of kinds K under path P before expiry" as an **admission gate: [rejected]** — it is a counter read at admission (breaks the master confluence invariant the same way the deleted ListFull did), a clock read at admission (banned), and a write-gate (mission grain). As **read-side semantics: native.** The act scope IS the pre-authorization (kinds, subtree, expiry); a count cap, if wanted, is a read filter with the exact `maxEntries` precedent (first N in-scope delegate records by min-`(order, recordDigest)`; the rest label `beyond-grant-cap`) — expressible, but recommend **v2 scope = {roots, kinds, keys, expiry} only**, count-caps deferred until an app demands them (they bound what *resolves*, which is the point — blast radius in the view — but add comparator surface for little demonstrated need).

### 4.6 The blessed org pattern (converges with the custody ladder)

**Org anchor key (raw cold EOA, hardware/threshold custody, successor-pair published)** signs only: lens roots, act grants/revokes, canonical placements/releases, checkpoints, `home`. **Member/employee keys (or their personas)** do all daily writing under act scopes. Three rungs, by stakes:

- (i) **Countersign rung** (record-mode): members author DATA + candidate claims; the org key signs the canonical placement per release. Strongest: GATE consumers read org-authored slots directly; per-release org ceremony is what release managers do anyway. This is the package-registry cookbook pattern, now with named provenance (the placement can TAG the member's candidate claim as its source).
- (ii) **Act rung** (author-mode): org key touches only grant/revoke; members' in-scope writes resolve via delegated resolution, dual-attributed. Right for docs/blogs/wikis — high-frequency, lower-stakes.
- (iii) **Shared-EOA rung**: the floor; only with hardware custody + the org-as-lens-list doctrine; named costs (§4.2).

---

## 5. W5 — Delegated revocation: does a team need more than `revoker == author`?

**No kernel change. [rejected, with the analysis]** The tempting extension — effectiveness = `revoker == author` OR revoker holds a LIVE revocation-delegation from the author — was examined and refused: it inserts revocable state into the Etched effectiveness predicate (recursion: who may revoke the revocation-delegation?), grows the one comparator every read runs, is freeze-bound forever, and its principal customer (identity succession/compromise) is precisely what the KEL delivers additively (~2030 obligation). Meanwhile the team-shaped needs decompose:

1. **"Remove Bob's file from the project"** → read-side removal is the real want: eject/deny at the lens (§3.2), or — in the countersign pattern — the curator REVOKEs *their own* approval/placement, which is `revoker == author`, native. Teams that route canonical placements through curator-authored claims never need to revoke anyone else's claim.
2. **"Kill the stolen persona's/delegate's claims"** → (a) REVOKE the act/membership claim (prospective, view-wide for subscribers); (b) **deny-advisories** — and name the frame: since "revocation" in EFS is already a read-side effect, *a deny-advisory is delegated revocation, permissionless, scoped to consenting readers*. You cannot revoke someone else's claim **for everyone** (that would be a write-gate over other readers — correctly impossible); you can advise, and every reader chooses whose advice subtracts. This is the cypherpunk-honest shape of takedown.
3. **"The org's own kill switch, operable by the security team"** → pre-signed revoke-ladder envelopes ([[ops-doctrine]], pre-revocation legal) with **custody delegated as convention**: an act-scope flag (`flags: revoke-ladder-custodian`) recording that Alice holds and may flush the org's ladder. Flushing needs no authority — revokes are self-verifying and anyone may submit [Etched] — so this is a custody-and-audit fact, not a protocol mechanism. Zero new surface.

Residual, stated honestly: between theft and detection, a thief with the team key wins every same-key race (the same-key war, §2.5 read-lens-spec) and no delegation design fixes that — only KEL rotation does. Do not let the act row be marketed as compromise protection; it is *blast-radius containment* (per-member keys mean member theft ≠ org theft).

---

## 6. W3/W4 — Exclusion, and the privacy face of access control (pulled into this pass)

### 6.1 Exclusion from the view [confirmed-native]

"Only Alice and Bob, nobody else" = a lens listing exactly `[curatorPlacements, Alice, Bob]` + deny-set. Third parties can still write records *targeting* the project's tagIds — permanently, into the container's discovery index — and those records are invisible to the view (not lens members), labeled DISCOVERY-only in untrusted views, and their spam is absorbed at the writer's gas, contained per container [settled doctrine]. **Graffiti exists; harm requires a reader who trusts the vandal.** That sentence should appear in dev docs.

### 6.2 Exclusion from reading — the capability analog of directory permissions

The nearest true ancestor of POSIX `r`/`x` on a directory is the **salted TAGDEF family** (already additive-reserved) + encrypted bodies (`contentEncryption`/`keyWrap` rows): outsiders cannot *derive the coordinates* (tagIds) of a salted subtree, so they can neither resolve names in it nor meaningfully target it. Read it as Tahoe-LAFS: **the salt+keys bundle is the cap**; holding it = you can address (and thus both read and write-into) the hidden namespace; the blinded-TAGDEF disclosure record ≈ the verify-cap. Honest divergence from Tahoe: a Tahoe write-cap mutates one shared object; the EFS "write-cap" is only *addressing + candidacy* — the lens still decides whose claims resolve. Capability + lens are orthogonal layers and both apply.

### 6.3 The honest costs (normative statements for the privacy pass to inherit)

1. **Caps cannot be un-shared.** Removing a reader = re-salt the subtree + re-encrypt forward content + re-wrap keys to the surviving members (the Cryptree cascade). Past content remains readable to the ejected member forever (they hold the old keys; the archive is permanent). Crypto-shredding only helps against parties who never had the key. State this in every private-folder UI.
2. **The membership roster is itself a leak.** A *public* team lens publishes who is on the team — often the most sensitive fact. Private teams need the roster to be an encrypted record (P9 encrypted-record convention) or client-local-with-escrow; flag as a P9 requirement from this lane: **lens/deny config must support the encrypted tier**, both for roaming (P9's truth-bug finding) and for confidentiality.
3. **Salting hides the WHAT, not the WHO-TOGETHER.** Authors are public by construction (author = recovered signer); N identities repeatedly writing claims into the same opaque container cluster into an obvious team by co-occurrence and timing, whatever the salt hides. Mitigations are partial and priced: per-member personas (per-team burner authors, private-linked), relayed/sponsored submission (breaks funding/submitter correlation), per-epoch container re-salting. The project framing line applies verbatim: **privacy-possible, not private-by-default, never anonymous.**
4. **Key-wrap coupling rule extends to teams** (G9): team content keys MUST NOT be wrapped to members' *author* keys — theft of an author key must not also decrypt the team archive. Wrap to independent encryption keys (passkey-PRF-derived per the custody ladder).

---

## 7. OS ask P4 — adjudication summary

- **P4(a) vs (b):** **(a)** — reserve `act` + persona-link/`label`, keyed on the primary/team **address word**; with the sharpening (§4.4) that resolver machinery is Durable and shippable in v2. Do NOT take (b): "client-receipt-only forever" would freeze delegation into per-client dialects at exactly the layer where divergent resolution = divergent trust.
- **Delegated revocation:** rule it **won't ship in the kernel, ever** (§5); the doctrine answers (deny, curator-authored placements, ladders) go in the cookbook; KEL covers succession.
- **Bounded pre-authorization:** read-side only (§4.5); admission-gate form rejected with the confluence argument.
- **P4(c) 0x02/0x03 un-reservation:** support scheduling with a named owner (out of this lane's core, but it feeds it: passkey-custody personas are the natural *delegate* keys; the custody quality of every delegate in §4.6 rides on it).

---

## 8. Three cases, walked end-to-end

### 8.A Five-person team folder

Team: Alice (steward), Bob, Carol, Dan, Eve. Anchor: `/0xAlice…/acme/projects/`.

1. **Create:** Alice mints the path TAGDEFs (shared Schelling — anyone re-derives the same ids); mints team lens `L_T` (LIST) and asserts 5 membership TAGs (one envelope, one signature: `(Alice, L_T, member)` slots, weights = positions `[Alice, Bob, Carol, Dan, Eve]`); publishes the lens at a well-known key. Everyone subscribes pin-and-diff.
2. **Bob adds a file:** Bob signs `DATA_b` + placement PIN at `(Bob, /acme/projects/plan.md)`. Kernel admits (permissionless); no permission checked, because none exists. Readers under `L_T` resolve `plan.md`: Alice's position first — PROVEN-ABSENT (she never wrote one) — falls through to Bob — PRESENT, LIVE → serves, attribution chip "Bob, lens position 2."
3. **Carol also writes `plan.md`:** her own slot. View still serves Bob (position order); the **U2 multi-claimant marker** shows "1 other version." Lens order is the team's declared tiebreak; teams wanting "latest-wins across members" are choosing the collaboration lane's LWW-over-curated-lens shape — whose "latest" MUST be admission-order, not claimed-order [P13]. (This lane supplies the candidate set; merge semantics are the collaboration lane's.)
4. **Spam incident:** Dan's account posts junk. Alice deny-TAGs the specific claims (subtract, Dan stays) — or ejects Dan (REVOKE membership; his whole history leaves the view — §3.2 tension) after an approval sweep preserves his good work.
5. **Compromise:** Eve's key stolen. Alice REVOKEs Eve's membership (subscribers' views drop everything Eve-authored — fail-safe); Alice publishes deny-advisories on known-bad claims for readers outside the lens; Eve's own pre-signed revoke ladder flushes multi-venue. Post-recovery Eve rejoins under a new key; her old good work returns via approval sweep (record-mode pins claimIds — key-independent).
6. **What never happened:** no chmod, no lock, no write rejected, no one waited for anyone.

### 8.B Company publishing under one identity, per-employee keys

ACME: org word `O` (raw cold EOA, threshold-custodied offline, successor pair published at creation [identity K7]); employees E1…E9 with personas.

1. **Grants:** `O` signs one envelope: act TAGs `(O, act, E1…E9)`, scopes e.g. `{roots: [/acme/blog], kinds: [PIN,TAG], exp: +90d}` for writers; release engineers get `{roots: [/acme/pkgs/candidates]}` only.
2. **Daily writing:** E4 publishes a post under her key; delegation-aware readers resolving `/acme/blog/…` under `[O]` render it "E4 for ACME" (dual-attributed, act claim one tap away). `O`'s key never comes out.
3. **Releases (countersign rung):** E7 authors `DATA_v1.4.2` + a candidate claim; the release manager ceremony has `O` sign the canonical placement + appendOnly ledger entry. Installers (GATE) consume `O`-authored slots directly — no delegation expansion in the install path, MUST-pull + deny-sets per read-lens-spec §9.B unchanged.
4. **Departure:** E3 leaves → `O` REVOKEs `act(E3)`. Prospective. Her blog history: still in-window vs the act claim's lifetime — honored where `admittedAt` proves in-window admission [P1 dependency], or preserved venue-independently by an approval sweep. Blog readers on chains without the revoke yet see it AS-OF/venue-qualified — normal currency honesty, nothing special.
5. **Member compromise:** E5's persona stolen → blast radius = E5's scope only; revoke act(E5) + E5's ladder. **Org-key compromise:** the same-key war — no delegation construct helps; custody tier + detection surfaces + KEL are the answers, say so.
6. **90-day expiries** on grants force a quarterly re-grant ceremony — a live audit of who still writes for ACME (TOFU decay, deliberate).

### 8.C Guest contributor for a week

Guest `G`, existing team from 8.A.

1. **Invite:** Alice asserts membership TAG for `G` with `expiresAt = now + 7d`, position last. (If G should write *as* the team — rare for guests — an act grant with the same expiry; usually plain membership is right: guests speak as themselves inside the view.)
2. **Gas:** G signs with her own key; the team's community relayer sponsors submission (author ≠ payer, stranger-write economics [cookbook]) — sponsorship changes liveness/privacy class, never authorship. A declining relayer is a liveness event; G can always self-submit.
3. **During the week:** G's claims resolve at her lens position. Misbehavior mid-week: deny her claims instantly, revoke the entry — both effective at next resolution.
4. **Expiry:** the entry goes STALE → not-in-lens for resolution (fail-safe, §3.3). G's contributions leave the live view — so the SDK's guest verb schedules the **closing approval sweep**: before expiry, Alice reviews and approval-TAGs keepers (one batch, one signature). Kept work persists under Alice's approval slots, attributed to G forever (claims are hers; approvals are Alice's).
5. **The back-date attack, defused:** after expiry G writes new records with `order`/`claimedAt` back-dated into her week. Any resolver testing windows against author time is fooled; the conformant test is against **`admittedAt`** — her new records admit *now*, outside the window, and fail it. Without P1, clients must not offer window-honoring guest semantics at all — live-window-only + sweeps. [dependency, flagged]
6. **Privacy variant:** for a private project, the invite = the cap bundle (salt + wrapped keys) delivered off-chain or as a keyWrap record; **G can read the folder's past by construction** (one key tree — disclose this in the invite UI) and her access after the week ends only by re-salt/re-key (§6.3).

---

## 9. POSIX dispositions (rule-3 statement: every classic feature touched, one verdict each)

| Classic feature | Disposition | One-line why |
|---|---|---|
| `w` bit / ACL write entries | **GONE** | no shared mutable cell to protect; writing never mutates another's view. Re-homed as W1 curation + W2 delegation |
| `r` bit / dir `x` (visibility) | **RE-HOMED** | canonical-view read = lens membership; true confidentiality = salted TAGDEF + encryption caps (§6) |
| execute bit (`x` on files) | **RE-HOMED (adjacent lane)** | "may this run" = handler-binding row (P2) + grade→executability table (P3); never a kernel bit |
| owner / `chown` | **RE-HOMED** | DATA/LIST owned by derivation (unforgeable, untransferable — "chown" = re-place under a new author's claims); TAGDEF unowned Schelling; *namespace* "ownership" is curation, a lens fact |
| groups as kernel principals | **RE-HOMED** | groups are LISTs — data, versioned, forkable, subscribed; membership is claims, not `/etc/group` |
| root / superuser / `sudo` | **GONE, forever** | an override is a write-gate over every reader's view; credible neutrality forbids it. No admin rescue exists — say it in every doc |
| setuid / setgid | **GONE** | no execution context to escalate; the nearest concept, writing-with-another's-authority, is the `act` claim — explicit, scoped, disclosed, revocable |
| sticky bit (shared-dir delete protection) | **GONE (vacuously)** | nobody can delete anyone else's entries anyway; per-author slots make it structural |
| umask / default ACLs | **RE-HOMED** | client/SDK defaults for new-container lens templates; policy, not protocol |
| ACL inheritance down a tree | **RE-HOMED** | a lens governs a subtree root; resolution walks parents (scoped-lens convention §3.1); no per-node ACL copies to drift |
| write-locks as access control (`flock` to fence writers) | **GONE** | nothing to fence; reconcile at read (locking cluster's lane) |
| "delete permission" / unlink rights | **GONE** | delete = revoke *your own* edge; removing others from a view = curation/deny; destruction impossible [settled] |
| append-only flag (`chattr +a`) | **NATIVE** | LIST `appendOnly` charter — stronger: enforced by read-filter + inert-refusal semantics, portable |
| immutable flag (`chattr +i`) | **NATIVE / partial** | objects are born immutable; a *claim* can't be made irrevocable-by-self (no burn-my-authority primitive pre-KEL — the honest gap; citation-form links + checkpoints are the freeze-a-view answer) |
| quota per user/group | **GONE** | gas meters writes; no shared pool (quota lane) |
| login sessions / seats | **RE-HOMED (client)** | personas + kernel-held policy are the session layer; protocol has no sessions by design |

---

## 10. FREEZE-SENSITIVE RESERVATIONS (the loud section)

Everything this lane wants from the Etched surface, each with row-vs-convention-vs-reject. Nothing else in this lane touches the freeze.

1. **`act` reserved-key row — RESERVE THE ROW (mint now).** TAG, VAL layout, ADDRESS-parent, cardinality-N; target = delegate **address word** (OPAQUE forbidden per the reserved-row rule; post-KEL identity words are address-shaped and never rewrite, so the row is KEL-additive by construction); VAL = canonical scope string (grammar + golden vectors frozen with the row; contents Durable-extensible via its own version word); `expiresAt` = validity window; weight = delegate precedence. **Why a row and not a convention:** delegation is the one place where per-client dialects diverge *trust* (two conforming clients disagreeing about who speaks for ACME is a security event, not a rendering skew); and a user-key convention can never be promoted to a row post-freeze. All resolution semantics stay in read-lens-spec (Durable). Kernel machinery: **none, ever** — the row is pure vocabulary.
2. **Persona-link relation + `label` word (P2/P4) — RESERVE THE ROW.** Same shape family as `act` (owner-authored VAL-layout TAG roster). Endorsed from this lane because §4's whole construction generalizes it; splitting `act` from persona-link is deliberate (persona = "is me," act = "acts for me, within scope") — conflating them is an authority-laundering invitation. Mint both; keep the relations distinct.
3. **Kernel delegated revocation (effectiveness-predicate extension) — REJECT.** Grows the Etched comparator with revocable-state recursion; KEL subsumes its main customer; §5's doctrine answers suffice. Record the rejection explicitly so it isn't re-litigated by silence.
4. **Write-time membership/ACL/write-gate state of any kind — REJECT** (re-affirm). Includes bounded-pre-auth admission counters (§4.5): counter-at-admission breaks the master confluence invariant; clock-at-admission is banned; both are the maxEntries lesson again.
5. **Membership / lens-entry / approval shapes — CONVENTION, NOT ROW (explicit ruling requested, not silence).** LIST + TAG + weight express all of §3; what's missing is a **normative lens-object encoding** (ordering, subtree scope, deny reference, `MAX_LENS_INCLUDE_DEPTH`) — Durable, read-lens-spec/SDK, vectors yes, freeze no.
6. **Receipt/grant schema (P2 candidate) — CONVENTION for the grant half.** The `act` row IS the grant record for authority; capability *receipts* (audit exports) stay cookbook/SDK pending the P2 pass. Don't mint a second grant-shaped row.
7. **Dependencies on other freeze items, so they're decided with this lane's weight on the scale:** **P1 `admittedAt`** — load-bearing here: without it, time-windowed membership/delegation is either gameable (author-time) or unshippable, and "honor the departed member's in-window work" loses its only honest comparand (§3.3, §8.C.5). **Salted-TAGDEF + blinded-disclosure + `keyWrap` (already additive-reserved)** — confirmed sufficient for this lane's W3; no new reservation; the G9 key-independence rule extends to team wraps (§6.4). **P4(c) 0x02/0x03 schedule** — feeds delegate-key custody quality.

---

## 11. Named failure modes (register entries)

1. **Authority laundering** — a delegated record rendered as the principal ("ACME" instead of "Bob for ACME"). Defense: dual-attribution is a conformance MUST (§4.3.3); GATE never expands implicitly; identity rows never in scope; no re-delegation.
2. **Back-date-into-window** — ejected member/guest back-dates `order`/`claimedAt` into their authorized window. Defense: window tests compare `admittedAt` only; without P1, window-honoring semantics MUST NOT be offered (§3.3, §8.C.5).
3. **Ejection-erases-history / alumni problem** — author-mode removal retroactively empties the view (right for theft, wrong for retirement). Defense: the removal verb offers the record-mode approval sweep (§3.2).
4. **Lens-order ambush** — inserting a member *above* others changes who wins existing contested names across all subscribers. Defense: pin-and-diff already prompts on additions/reorders (§4.5 read-lens-spec); the team-lens UI should preview name-winner diffs before publishing a reorder.
5. **Deny-vs-eject confusion** — moderators ejecting (losing history) when they meant deny (one claim), or denying when the author is compromised (leaving the rest live). Defense: the §3.2 matrix in the cookbook; distinct SDK verbs.
6. **Shared-EOA identity death** — org rekey = new identity; theft = same-key war; m-of-n authorship absent. Defense: §4.6 anchor/act split; named as the floor, not the pattern.
7. **Delegation-dialect fork** — clients inventing incompatible act conventions ⇒ divergent trust between conforming clients. Defense: the row + frozen scope-grammar vectors (§10.1).
8. **Relayer as covert gatekeeper** — a sponsoring relayer declining a guest's envelopes looks like "no write permission." It's a liveness event, never authority (mortality invariant); clients must render it as submission failure with self-submit fallback, or the write-permission myth reincarnates as UX folklore.
9. **Roster leak / co-occurrence clustering** — public team lens publishes membership; salted containers still cluster teams by author co-occurrence and timing. Defense: encrypted roster (P9), personas + relayed submission; honest framing (§6.3).
10. **Cap un-shareability surprise** — users expecting "remove reader" to un-read past content. Defense: re-salt/re-key cost and the departed-member-keeps-old-keys fact stated in the invite/removal UI (§6.3).
11. **Stale-grant creep** — eternal act grants accumulating (the TOFU disease). Defense: expiry-by-default on grants (90d class per the expiry doctrine's trust/authorization row) + the quarterly re-grant ceremony as a feature (§8.B.6).

## 12. Prior art, one line each on what was taken or refused

**Tahoe-LAFS** — caps-not-ACLs adopted for W3 (salt+keys = cap; disclosure record = verify-cap); write-cap ≠ EFS "write" (no shared object to mutate). **UCAN** — attenuation grammar (resource/ability/expiry, no ambient authority, aud=delegate) adopted into the act body; offline-bearer carrier refused (EFS is the better revocation/transparency store). **Macaroons** — refused (HMAC = no public verifiability); the caveat idea survives inside the scope grammar. **Solid WAC/ACP** — the server-enforced-ACL fork EFS didn't take; its WAC→ACP churn is evidence for keeping authorization semantics Durable rather than frozen. **Zanzibar** — read-side relation-tuples validate the whole frame; zookies ≈ checkpoints/AS-OF; userset-rewrite ≈ lens includes (with a depth budget). **git** — commit/push = write/curate is the developer education frame; maintainer-merge = record-mode. **Plan 9** — namespace-per-process ≈ lens-per-reader; its auth (factotum) needed a trusted server EFS doesn't have. **Cryptree (Wuala)** — the re-encryption cascade named as the honest cost of private-folder membership change.

## 13. Handoffs

- **To read-lens-spec (Durable revision):** lens-object encoding + include depth (§3.1); delegated-resolution section (§4.3); STALE-membership/act = not-authority GATE rule (§3.3); dual-attribution conformance rule + acceptance vectors (laundering, back-date, two-step GATE).
- **To codex-kinds / freeze-gates:** §10 items 1–2 (mint), 3–4 (record the rejections), 7 (P1 weight).
- **To the collaboration lane:** this lane delivers the candidate-set layer (who's in the view); merge/convergence semantics start where §8.A.3 stops; any "latest-wins" rule must be admission-ordered.
- **To the privacy pass:** §6.3's four normative statements; encrypted-roster requirement on P9; per-team personas as the co-occurrence mitigation to research.
- **To the cookbook:** §3.2 matrix, §4.6 org rungs, §8's three walkthroughs, failure-mode register §11.
- **To James:** ratify P4(a)-as-sharpened (§7), the two row mints, the two rejections (§10.3–4), and note this lane's +1 on P1.
