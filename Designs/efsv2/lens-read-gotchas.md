# EFS v2 — Lens reads: the gotchas (what every consumer must know)

**Status:** draft — reference companion to [[lens-spec]]; the honest-limitations digest of the 2026-07-28 lens pass
**Target repos:** planning, sdk, client, contracts
**Audience:** (1) James at owner-decision time — each gotcha names the LP/E item it bears on; (2) future design/SDK/client agents — what is settled vs designed-not-ratified vs unverified, and which traps not to reopen
**Depends on:** [[lens-spec]], [[lens-pass-synthesis]], [[joined-pass-synthesis]] (the six-part read tuple), [[owner-decision-inbox]]
**Last touched:** 2026-07-28

#status/draft #kind/note #repo/planning #repo/sdk #repo/client #topic/lenses #topic/efsv2

## The one throughline

**EFS can always prove *who said this and that it is real*. It often cannot cheaply prove *this is complete*, *this is the latest*, or *nothing is hidden*.** The entire lens design is disciplined to say the honest thing when it hits that wall — a graded "unknown / not-found-here / unverified" — rather than fake a clean answer. Every gotcha below is a face of that one fact.

Two rules that fall out of it and bind every reader:

- **A read result is six answers, never a checkmark** (the joined pass's F-15 tuple): *authorization* (was it authorized *when made*) · *existence* · *freshness/basis* · *availability* (are the bytes here) · *slot state* · *completeness*. A UI or API that collapses these to one green tick is non-conformant. A file can be "definitely signed by Alice" **and** "we cannot tell if this is her current version" simultaneously.
- **Never fall through on UNKNOWN.** First-trusted-wins is anti-monotone under missing data: if a higher-trust source is merely *unreadable* (not *proven-absent*), serving the next source down is a silent trust downgrade that better information could only reverse. So missing data **stops** resolution; only a *proof of absence* yields to the next source.

## Reading a file

- **There is no "the" file.** You get the first author *you* trust who placed one there; someone with a different lens sees a different file at the same path. "Share the file at `/x`" and "share *my* file at `/x`" are different acts — the second needs an exact **citation** (pins the claim + basis), not a path link.
- **Authenticity never degrades; currency does.** Off the file's home realm, "not revoked" and "latest" always carry a date ("as of block N, age 2d"). A copy structurally cannot promise more.
- **A stolen key *is* the author** until revoked/recovered. Signatures prove *who*, never *whether still authorized*. The defense is your lens dropping them or a security advisory — both work even when the author is the attacker; the signature does not.
- **"Authentic pointer, bytes missing here" is a real state** (`BYTES-UNAVAILABLE`). The record can be genuine while the bytes are unfetchable at your source; a gate that needs the bytes fails closed.

## Listing a directory

- **A listing is two operations:** enumerate candidate names (the union of what your trusted principals contributed) → resolve each name first-trusted-wins. One folder view is stitched from many people.
- **The hardest limit in the system: completeness is usually unprovable.** Over an ordinary hosted RPC, "that's all the files" cannot be proven — a server could hide one. So EFS **refuses the false negative**: "nothing found here — unverified," never "that file does not exist," unless it holds a real proof-to-closure (own node · a state proof to positive closure · a signed complete-bundle manifest). *A guest is never told a file does not exist* (**LP-5**).
- **One-basis rule (FSP-BASIS-1).** A listing and a point-lookup must be read at *one frozen snapshot* or they lie in both directions — an entry admitted between pages appears in lookup but not the listing (phantom); an entry revoked between pages appears in the listing but resolves empty (ghost). Never interleave paged `children` calls with `latest` point reads.
- **Equal-rank disagreement shows as a CONFLICT row, not a silent pick** — and the row shows *no claimant's* name/icon/preview, because the tie-break byte-ordering was grindable into a phishing surface (AV-21/AO-8).
- **A curator you trust can hide entries (whiteout).** You must see an attributed tombstone — *"3 items masked by OnionDAO"* (**NS-11**, independent of P-17) — never a silent disappearance. If you never look, that is the standing lesson that *subscribing is trusting*, surfaced not solved.
- **Sorting is a client snapshot, not a live truth**, and a fully-sorted contract-native page over a big folder **cannot be delivered** — the live EIP-7825 tx cap makes a 128×55 page physically impossible (**LP-2**). Wide sorted directories are a client-tier feature, full stop.

## Seeing apps in an app store (the GATE)

- **Installing is not browsing; the trusted screen wins.** The sharpest attack: a hostile page shows you an *old, vulnerable* version, you click install, and the bouncer says yes — it only asked "is *this* artifact OK?" (**AV-19**). The rule: the install ceremony **re-derives the real current release under the GATE's own rules, in System Chrome, discarding the page's ordering.** Practical takeaway for any client: trust the install dialog's own "publisher's current release is 1.4.1; you picked 1.2.0 (14 mo old, 2 advisories)" line, never the linking page.
- **A clean top-level app can hide a dirty dependency.** Advisories must be evaluated over the **whole pinned dependency closure**, not just the selected artifact (**AV-16**).
- **A withheld update can freeze your trust root silently** (TUF freeze). Everything reads green — basis fresh, floors monotone, channel active at its last-known generation — while you sit on a stale trust list. The fix is `policyMaxAge` (re-validate the policy within a window or fail loud) (**AV-15**).
- **STOP on revocation:** a lapsed publisher never hands the name to a squatter (GATE has no fallthrough). But a *stolen* publisher key still signs as the publisher until recovery — there, deny-lists from security labelers are the load-bearing defense.
- **A labeler cannot invent consequences.** A labeler says *"malware"*; the store owner's action table decides warn/block. Unknown/new label values map to `NONE` (render-only), so an enumerated labeler cannot unilaterally block anything by minting a value (**AV-17**).
- **"Everyone who earned achievement X" cannot be *followed* as a live trust feed** — that would grow your trust to an unbounded crowd of strangers on every hourly advance. Machine-computed member sets are **pin-only**, re-confirm-per-revision (**LP-10**).

## Loading configuration values

- **Config is usually a *gate read* — stricter than browsing.** An expired value or an *unknown-source* value **stops** resolution; it never falls through to a less-trusted answer.
- **Safety-critical config carries a freshness fuse.** A value read off a copy comes "as of block N, age X"; if too old for the decision, a machine **fails closed** rather than acting on stale trust. A publisher can also set an `expiresAt` so the value goes stale on its own if they vanish. (Note: the old "MUST-pull the author's declared home" machinery is **killed** — currency is now measured against the drive's own venue basis age, no per-principal locator.)
- **Judge staleness by the chain's clock, not the reader's wall clock** — a wrong local clock must never drive a real gate, only a labeled UI hint (**AV-39**).
- **Contracts read *public* data only, always.** A contract cannot read encrypted/private config: a contract holding a key ⇒ the key is public ⇒ no privacy. Rule of thumb: *if a contract must read a value, do not encrypt it.*

## Cross-cutting truths (hold these in your head for every read)

- **Nothing here is frozen or built.** This is a reconciled design; the hardest cost claims are E2-gated benchmarks and several safety rules above are *designed this pass, not yet owner-ratified*. The `PLAUSIBLE`-marked constructions (the highest-leverage being LR-1 §3's content-addressed plan store) are verification debts V-1…V-27, not settled facts.
- **Your trust list is private by default — and leaks if you are careless.** Publishing a View, or letting a *remote* server resolve your lens, ships your whole "who I trust" set to that server (a better fingerprint than a cookie — resolve against your own node/replica by default). And membership privacy is *"do not publish,"* not cryptography: someone who correctly *guesses* your list can confirm it. No product copy may claim otherwise (**LP-7**).
- **"Works on a brand-new chain" is a hard line.** Search, trending, and global aggregates may lean on external indexers (The Graph); *nothing a base feature needs* may — a fresh L3 will not have them. Every enhanced feature ships a fallback and a labeled degradation.
- **Same file on two chains = two views,** each realm-qualified; a merged cross-chain view is honest about being non-atomic, and *which realm is authoritative for a principal* is still an open decision (joined-pass P-5).

## For James — which gotcha each open decision is really about

| When you weigh… | You are deciding the limit… | Lives in |
|---|---|---|
| **LP-1** (typed lens) | whether "follow a friend" can ever leak into "install an app" — the whole typed/scoped premise | [[owner-decision-inbox]] |
| **LP-2** (on-chain promise) | that wide sorted contract directories *cannot* be delivered — accept the bounded-pages promise or fund a separate proof system | " |
| **LP-5** (guest default) | that a guest is never told "file does not exist," only "not found here — unverified" | " |
| **LP-6** (GATE rules) | the install-rollback, TUF-freeze, and transitive-advisory defenses — ratifying them *as conformance*, not guidance | " |
| **LP-7** (personal privacy) | that trust-graph privacy is "don't publish," not cryptography — and the remote-resolve leak | " |
| **LP-8** (link-safety floor) | the closed set of warnings a hostile link can never suppress | " |
| **LP-10** (computed membership) | whether a machine-derived set of strangers may auto-refresh inside your trust | " |
| **E2** (kernel cost) | whether the on-chain point/gate reads above actually fit in gas — every cost claim here is E2-gated | " (Decide after evidence) |
| **E6 / LP-4** (scale) | that the design is honest at 15–55 trusted principals; what breaks past it is gate composability first | " |

**Reading posture for the packet:** none of these ask you to accept a *capability*; each asks you to accept an *honest limitation* and how loudly the product states it. The recommendation on every LP item is "state the limit plainly" — the arms are mostly about *how much* honesty vs. convenience.

## For future design agents

- **Do not reopen the kill list.** The pass retired 31 phrasings ([lens critic §6](../../Reviews/2026-07-25-lens-pass-corpus/critic.md)); the ones a plausible-sounding "improvement" will most tempt you to revive: *checkpoint-grounded absence*, *MUST-pull-home*, *a registry that answers what a plan is*, *"identical plan semantics" unqualified*, *SAME_SLOT_COLLISION as a live E2 choice* (the on-chain collision bit is settled-rejected), and *following a computed member set*.
- **Absence is the tripwire.** Any new feature that emits "not found," "complete," or "these are all the entries" must trace to one of the four absence sources with the FINAL-scope precondition (AV-12). Budget exhaustion, a partial replica, a hosted-RPC bare word, a deny hit, a whiteout, and an author checkpoint **never** ground absence.
- **Two blocking gaps own the guest product and the recut:** `AMBIENT/1` (the owner baseline is only defined for ADDRESS containers today — CR-3) and the kernel **lane labels + authority-axis ABI** (H-1/H-2, now dated-blocking on the envelope/kernel recut). The lens family *consumes* both and can ship neither.
- **The owed chapters are in [[lens-spec]] §10 and [[lens-pass-synthesis]] §6:** AMBIENT/1, the v1 migration chapter (esp. ADR-0044's waterfall — silence is the one forbidden outcome), the consolidated acceptance suite (re-cut read-lens-spec §8.3's 16 tests), and the V-1…V-27 fixtures. Nothing above may be called "settled" until its V-obligation is discharged.

## Open questions

- [ ] None owner-facing — this is a digest of decisions that live in [[owner-decision-inbox]] (LP-1…LP-10) and the E-track.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] Cross-checked against [[lens-spec]] on each recut (this is a companion digest — it must not drift from the spec it summarizes)
- [ ] At least one round of `#status/review` with another agent or human comment
