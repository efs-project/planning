# EFS v2 — Privacy pass: the James decision sheet

**Status:** draft — decisions from the 2026-07-11 deep privacy pass
**Target repos:** planning
**Depends on:** [[privacy-pass-synthesis]], [[privacy-freeze-reservations]]
**Base text:** [critic.md](../../Reviews/2026-07-11-privacy-pass-corpus/critic.md) §4 as amended by [critic-addendum.md](../../Reviews/2026-07-11-privacy-pass-corpus/critic-addendum.md) §4 — fuller plain-English write-ups with all options live there; this sheet is the consolidated, decision-ready form.
**Last touched:** 2026-07-11

#status/draft #kind/design #repo/planning #topic/privacy

Every item has a recommendation; nothing is blocked waiting on you except the two ceremony items. Items marked ✅ can be approved in bulk ("approve all recommended") — each is a ratification of a reviewed result with no live counter-option the pass considers close.

## 1. Decide before the ceremony (the only two live now-or-never calls)

**JD-8 — Reserve the stealth "announce feed" genesis line?** To let strangers leave you private invitations later ("I left something for you" notices), everyone needs ONE well-known place to scan — and the frozen `/.well-known` list can only be set at the ceremony. Everything else stealth needs turned out to be addable later (the meta-address rides the encryptionKey blob; the math is client-side). Options: **(a) reserve the one line WITH the epoch field** (the field lets scanners process only new entries — without it, a $500 spammer imposes unbounded permanent scan cost on everyone); (b) skip — self-derived pen-name fleets (the main use) need no feed at all; announced invites would use a less-canonical convention feed later; (c) mint a full dedicated stealth row + registry — over-reservation, not recommended (the meta-address rides the encryptionKey blob; a dedicated row stays a DEFER option you could still mint as a Schelling point). **Recommend (a) IF you want canonical announced stealth as a product capability, else (b)** — the reservation is one cheap manifest line and the pass's only remaining irreversible-if-skipped item, but the critic's instruction is explicit: don't let that framing decide it. The real question is whether announced (rare-invite) stealth is something EFS should canonically support at all.

**JD-36 — Subtree bulk-unlock math: pin it or drop it?** The reserved "reveal one folder's key ⇒ unlock its whole private subtree" math was found internally broken (the frozen formula can't reach the children's salts). Options: **(a) Option B — drop it from the ceremony AND freeze the A-2 negative sentence in the family text** (the family explicitly does not promise subtree unlock — so no client ever assumes the broken property): single-node disclosure stays fully pinned (A-1); subtree sharing is carried by encrypted dirnodes (hand out child caps — and renaming doesn't re-key anything); bulk-unlock stays addable later for new trees as an opt-in convention (F-2b); (b) Option A — pin the repaired pair F-2+F-2b now, accepting that renaming a folder re-keys its whole subtree. **Recommend (a)/Option B.** ⚠ One dependency: B stays free only if the ceremony keeps A-1's salt a free input and D3's HKDF-salt permission — if either gets narrowed, this becomes now-or-never.

**Plus: ratify the ceremony batch** — the five ceremony amendments in [[privacy-freeze-reservations]] §A: one pinned derivation function with golden vectors (A-1 blinded-name, four-pinned) plus four row-text amendments (A-3 "opaque" occurrence keys · A-4 self-escrow property · A-5 the open encryptionKey blob (the linchpin) · A-6 key-privacy sentence with the classical qualifier). All five are red-teamed; A-5 is what makes everything else deferrable. ✅

## 2. Product and values calls

**JD-1 — Split the private tier: `private-recoverable` vs `private-shreddable` (amended).** You can't promise both "get everything back after losing all devices" and "crypto-shred means truly gone" for the same key. Example: your tax archive = recoverable (phrase-backed, never shreddable); a leaked-source document = shreddable (device-bound key, lose the device = gone forever). User picks per file/subtree; default recoverable. Amended by the repair round: **the shreddable choice exists only for unshared content** — team/shared files are recoverable-only forever (the curator's keys can always be re-derived). **Recommend adopt.** ✅

**JD-2 + JD-37 — Adopt the positioning statement + the quantum-expiry line as official words.** The exact README/FAQ language ("Confidential when you choose it. Public by default. Anonymous never."), the banned-words list (never "anonymous," "untraceable," "forward secrecy," "GDPR-compliant"…), plus the honesty line — plain-English gloss: file contents stay secret even against future quantum computers; who-you-shared-with does not (exact MUST text to adopt: the PC-6 quantum-expiry line in [[privacy-pass-synthesis]]). Improvised marketing is legal surface (Samourai's copy was a courtroom exhibit). **Recommend adopt verbatim with the four markups.** ✅

**JD-6 — Private folders: encrypted dirnodes at launch.** A private folder = one encrypted file listing its children (chain sees one blob + edit cadence), vs salted trees (chain sees an opaque cluster: "something with 40 children, edited Tuesdays" — and their resolver only activates post-freeze anyway, so they can't ship at launch). ~40× fewer records, less leakage, same sharing power. Salted trees stay reserved as the later "addressable/disclosable" tier. **Recommend adopt.** ✅

**JD-38 — Disclose the hardware-wallet gap.** A Ledger/Trezor protects your *signing* key but cannot hold your *encryption* root (and the coupling rule rightly forbids deriving one from the other) — so a hardware-wallet user's private archive is only as safe as their computer's software keystore. Unfixable; must be said plainly (like the smart-wallet authorship exclusion). **Recommend a dedicated FAQ + enrollment-time note.** ✅

**JD-9 — Default-on stealth meta-address at OS onboarding: DEFER to the OS pass, with the pricing now broader.** Publishing the slot for everyone makes holding it signal nothing (good), but every device pays permanent scan cost, and — per the repair round — the CRQC retro-linkage baseline already covers the ordinary recipient graph, not just stealth. **Recommend defer with the pricing attached.** ✅

**JD-13 — Read-path default: no silent RPC provider.** Whoever provides your chain connection sees everything you read + your IP. First-run picker + embedded light client (integrity), OHTTP client half built in (honest note: no operational OHTTP relay pair exists or is funded as of 2026-07). **Recommend adopt.** ✅

**JD-16 — Operator doctrine.** Run nothing, or run a demo gateway under a separate legal entity with a published minimal-log policy and an actually-staffed notice pipeline; never custody, never a fee-taking discretionary relayer, never kernel moderation. **Recommend code-only unless the pipeline is staffed.** ✅

**JD-17 — GDPR posture.** "EFS is not a home for other people's personal data"; off-chain+commitment is *the* taught pattern; crypto-shred described as the strongest-available erasure-equivalent (contested as legal erasure). **Recommend adopt.** ✅

**JD-22 — Timing posture.** Every record's `order` word is a microsecond wall-clock stamp (timezone/schedule leak); zeroing `claimedAt` does NOT fix it. Per-tier: honest timestamps in the public archive, coarsened TIDs in the private/OS tier (small supersession-priority cost), `admittedAt` stated as the unfuzzable floor. **Recommend per-tier.** ✅

## 3. Technical ratifications (all recommended, bulk-approvable) ✅

- **JD-3** Committing AEAD MUST — prevents one file decrypting to different documents for different people; ~zero cost.
- **JD-4** X-Wing PQ-hybrid wraps now under our own algoTag `0x01`, don't wait for the IETF stamp (every meanwhile-wrap is quantum-harvestable).
- **JD-5** The three-lane scan/discovery convention (+ A-3/F-3's "opaque" wording that keeps it legal), plus opt-in indexer delegation for those who accept the receipt-pattern leak.
- **JD-7** Master secret = random root wrapped to devices; **signature-derived roots banned** (any dapp that gets that signature owns your archive forever).
- **JD-10** Groups: pairwise wraps + team-key indirection (≤~50 members); no on-chain MLS. Removing one of 10 members ≈ pennies.
- **JD-11** Recovery ladder: phrase (mandatory prompt) + `.efs-bundle` file + opt-in Shamir social recovery (archive root only, never the shred root); durable shares are wrapped-to-recipient, never bearer links (raw cap URLs leak via clipboard/history sync).
- **JD-12** Walkaway test as hard CI gates (amended: the inbound-share assertion waits for JD-32).
- **JD-14** EFS.eth publishes reference snapshots (digest-anchored, anyone mirrors); fund independent publishers when a community exists.
- **JD-15** PIR shelved with a named trigger (slot DB > ~5–10 GB, or a phone-first client without local snapshots).
- **JD-18** Horizon split confirmed: transport/funding/read-path privacy arrives from upstream Ethereum — ride it; graph shape, authorship, recipient sets, sizes, shred are EFS-owned forever — no future Ethereum fixes them.
- **JD-19** Private files carry no plaintext name/size/contentType rows (a private file named `divorce-settlement.pdf` has leaked the point).
- **JD-20** Unlinkable personas default to sponsored/relayed writes + refuse linked-wallet funding; private-tier writes under a public persona break the promptless path loudly (amended: the sponsor trust is named per persona — a logging/shared sponsor re-links the fleet).
- **JD-21** Member removal: explicit eager-vs-lazy choice, priced at removal time ("clean now ~$X; or free, but K cold files stay readable by the removed member forever").
- **JD-23** The viewing-key ritual as a named feature ("Disclosure Key for /taxes/2026").
- **JD-24** Hard REJECT on-chain read receipts / seen-markers / acks (Signal was deanonymized in ~5 messages by delivery echoes; ours would be public and permanent).
- **JD-25** Fleet trust lives only in per-viewer client-config lenses (carved out of the lens-publish rule) — a published lens naming your pen-name fleet clusters it in one artifact.
- **JD-26** Team folders: per-member pointers + CRDT merge, with causally-complete reads (amended by C-M; the cheaper read is legal only with the invisibility window documented).
- **JD-27** The shred keyring (over mesh-only shred-key distribution) — now gated by JD-31.
- **JD-28** Device enrollment: full-trust default for personally-held devices, scoped "travel mode" as the alternative, honesty box at enrollment.
- **JD-29** Ratify R-GAP3 (the FEK-rotation discipline; the pass's arm-(B) sketch is withdrawn — a removed member holds all the inputs to any epoch-counter-based deterministic successor; determinism survives only from the curator's own secret root, which is R-GAP3.2).
- **JD-30** Collab relay: async collaboration at launch; a reference live-relay only under the JD-16 posture when resourced.

## 4. Gates on future tiers (approve the gating; the OS/collab lane owes the specs — launch unaffected)

- **JD-31** Shreddable tier gated on the shred-ring single-writer discipline + concurrent-shred fixture (two devices shredding concurrently must never fork the ring: else one device locks out AND the "shredded" file quietly survives). Interim: shreddable ships single-device-only.
- **JD-32** Inbound-share recovery: publish the recovery key as a standing blob entry so accepted shares re-open with the phrase after total loss (today they wouldn't — the walkaway gate must not claim it until this lands).
- **JD-33** Rotation serialization law (read-your-latest-epoch; rebase stale rotations) + roster rule (LWW-by-rotation-order, removes monotone, never OR-set union — union re-admits concurrently-removed members).
- **JD-34** Live-session eviction on member removal: re-key the session best-effort + state the residual honestly ("a removed member retains live-session access until the current session ends").
- **JD-35** Class-(a) secrets (OAuth tokens etc.): platform-keychain vendor-escrow named as the default for re-auth-expensive items; tier tables state shared ≠ shreddable.

## Standing items from before the pass (for completeness)

- **keyWrap TAG-only** — stays settled (the dual-role PIN remains killed; no lane reopened it). No action unless you want to override.
- **The old "reserve a stealth derivation domain?" question** — dissolved: not freeze-sensitive (killed hedge); JD-8 is its only live remnant.
- Carried, not this pass's: channel-observatory resourcing (FS-pass D8), web3:// liaison owner (FS-pass D9).

## Open questions

- [ ] JD-8 and JD-36 ruled before the ceremony.
- [ ] Bulk ratification (or line-item edits) of §2–§4.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] Rulings recorded back into [[freeze-gates]] §A at the next re-cut
- [ ] At least one round of `#status/review` with another agent or human comment
