# Fable next-pass scope — the EFS v2 "above transport" design rounds

**Status:** draft (scope LOCKED by James 2026-07-08; still refining the per-pass detail before handoff)
**Target repos:** planning, contracts, sdk
**Depends on:** [[README]] (the efsv2 set), [[confidence-and-open-decisions]], [[client-os-pressure-report]]
**Reviewers:** —
**Last touched:** 2026-07-08

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk

## How to read this

The transport layer (kernel, envelope, IDs, identity, large files) is deeply red-teamed and settled ([[confidence-and-open-decisions]]). What's thin is everything **above transport** — the parts that make EFS *a filesystem and graph database people build on*. This doc scopes the design rounds that fill that gap. **The scope and ordering are now locked (James, 2026-07-08); the per-pass detail is still being refined before each handoff.**

Markers: **[FREEZE-SENSITIVE]** = touches the one-final-freeze surface or is now-or-never (reserved slots / harvest-now-decrypt-later); **[POLICY]** = real but policy-shaped, its own later pass. Settled decisions every pass must respect (don't re-litigate without loud cause): native kernel, author-from-signature, no cross-chain currency, first-attester-wins lenses, string-only properties, permissionless byte pool.

## Locked plan — staged, in priority order (James 2026-07-08)

> **Pass 1 — Filesystem features (VERY IMPORTANT, first).**
> **Pass 2 — Privacy (research-first: find out what's even possible).**
> **Pass 3 — The rest (naming/hyperlinks, protocol migration, interop) — research heavily.**

**Cross-cutting freeze rule.** The deep *design* is staged, but each pass MUST surface its **freeze-sensitive reserved slots early** (record shapes, reserved keys) so that — even though Pass 1 designs before Pass 2 designs — the full set of "what must be reserved before the freeze ceremony" from all three passes converges *before* the ceremony. Staging the design does not mean staging the freeze reservations. This protects the one-freeze pledge while honoring the priority order.

---

## Pass 1 — Filesystem features [TOP PRIORITY]

The first 10-app grounding tested breadth (apps fit); it did **not** stress real filesystem *semantics*. This pass does, in depth, against tag-core. James: "ensuring we have all the filesystem features is VERY IMPORTANT."

**Surfaces to design + red-team:**
- **Write-sharing / access control** — there is no "grant Bob write access to /projects" today. EFS is read-curated by lenses but has no write-permission model. *Example: a shared team folder — who can write, how is it expressed, how is it revoked?*
- **Multi-writer collaboration** — one folder, many editors (wiki, shared doc) is where the single-author model may strain (whose version wins, how edits merge). CRDTs were dismissed early; the shared-folder story needs a real check. *Example: a wiki page with 5 editors.*
- **Versioning / history / undo** — `supersededBy` chains exist but there's no coherent "show history / restore v3" primitive. *Example: "restore yesterday's version."*
- **Move / rename at scale** — REDIRECT `movedTo` exists; walk it end-to-end. *Example: move a folder with 10k children — cost, link integrity, what the old paths do.*
- **Symlinks / hard links, trash / soft-delete, quotas, locking** — partial or untouched; confirm each has a coherent story or is explicitly out.
- **Search — multi-tag selection [James wants this if feasible].** Finding files that carry *several tags the user picks* (tag A AND tag B AND tag C). Investigate how far this goes: trivially an off-chain / The Graph query; possibly an on-chain view over the discovery index for bounded sets. *Deliverable: a clear line — "multi-tag AND-selection works up to here on-chain/indexer; richer search is a The Graph feature."* If it can't be cheap on-chain, search is explicitly an off-chain feature and that's fine.

**The Graph / indexability is a first-class requirement, not a query language.** James's call (refinement #1/#3): EFS should **not** ship its own query language — analysts export to a real DB or use The Graph / RPC-backed tooling. So this pass must *confirm EFS stays cleanly subgraph-indexable* (the v2 event set already targets log-only-sync — verify it holds for all FS operations here) rather than build query machinery. "Works great when devs use The Graph" is the target, and it should already be true — this pass proves it.

**Freeze-sensitivity:** likely reserved-key rows / record shapes for sharing, versioning, and collaboration. Surface them early against [[freeze-gates]] §C.

---

## Pass 2 — Privacy & encrypted records [FREEZE-SENSITIVE, research-first]

James: "I don't even know what privacy options we have. We should do heavy research and see what we can do." So this pass **opens with a research phase** (what is even possible on a permanent public chain?) *before* deciding how much to build.

**Research the option space first** — the honest menu of what privacy is achievable here, from the prior-art the substrate round already gathered plus fresh digging: encrypted payloads + key-wrapping, capability-URLs (Tahoe-LAFS style — the key rides in the link fragment, never on chain), convergent vs. random-key encryption, private set / stealth-address patterns, what metadata *cannot* be hidden (the public graph shape), and the post-quantum / harvest-now-decrypt-later constraint. Deliver the menu with honest costs before proposing a design.

**Then design against the three unsolved problems:**
- *Encrypted content* — storage, who holds the key, how it's shared, how access is revoked (you can't un-share a decryption key).
- *Metadata leakage* — even with encrypted payloads, the graph leaks who-follows-whom, who-commented-where, archive size. What's reducible vs. inherent.
- *Harvest-now-decrypt-later* — late conventions don't retro-protect already-published data; this is why reserved slots may need to beat the freeze.

**Depth decision deferred to the research output** (James didn't pre-commit): full encrypted-record design vs. reserve-the-slots-only vs. an explicit "public-only in v2, encryption is a v3 additive layer." The research phase produces the recommendation.

**Ratify project-wide framing (from the OS handoff, worth adopting now):** *"Privacy-possible, not private-by-default, never anonymous"* — cypherpunk on the read/custody side, but publicly-verifiable-by-necessity on the write/graph side (author = recovered signer makes authorship and timing public by construction). This line should be true and stated before the privacy pass, so it doesn't drift.

---

## Pass 3 — The rest: naming/hyperlinks, migration, interop [research heavily]

James: "Those seem important. Would love Fable to research them heavily and see what we can do." Three areas, promoted to full candidates:

- **Naming / hyperlink UX** — how humans find and link things: what a shareable EFS link looks like, memorable names, ENS integration, the container-classifier / URL surface (flagged unproven). *Example: `efs://james/photos` instead of a hex blob.* Most user-facing, currently thinnest.
- **Protocol migration / the v3 story** — how EFS itself upgrades over 100 years (keccak weakening, new features) without orphaning everything. The hash-migration playbook exists in outline; this hardens it.
- **Interop / export** — EFS data readable by existing tools (the EASExporter skin, W3C VC / did:pkh export, attestation explorers). *Example: "show my EFS record in easscan."*

May split into sub-passes; research first, then decide what (if anything) is freeze-sensitive.

---

## Explicitly deferred (named so they're not silently dropped) — [POLICY], own later passes

- *Deletion / illegal content / operator liability* — a permanent permissionless public archive will receive illegal content; zero coverage in every round; real operator legal exposure.
- *Sustainability / who-keeps-bytes-alive* — no-token means volunteer mirrors; comparable systems' volunteers decayed in 3–7 years.
- *Governance / trust-root stewardship* — who maintains the trusted-chain list, genesis, reserved-key registry over 100 years.

---

## OS handoff integration (input, not gospel — James 2026-07-08)

The client-v2 / web-OS round handed over findings ([[client-os-pressure-report]] P1–P13). Treated as input to adjudicate, not settled truth. What it changes here:

**Two red-teamed-confirmed findings (trust these):** the persona-group + owner-authored agent-label construction, and the persona-linkage privacy finding — both fit the 5 kinds, feed Pass 2 (privacy) and the P4 delegation reservation.

**Everything else in the report is an OS-side proposal — adjudicate, don't assume.**

**Four freeze-window items it prioritizes** (independent of Passes 1–3; they need decisions before the ceremony regardless — tracked in [[freeze-gates]] and its Open questions):
- **P1 read-ABI / the trustworthy clock** — store `admittedAt[claimId] = block.timestamp` in kernel state (getProof-provable), plus batched `isAdmitted(claimId[])`, and make every read grade (incl. PROVEN-ABSENT) state-provable not log-derived. The honest-framing line to ratify: *"the author-asserted timestamp is untrusted; the trustworthy clock is admission — per-chain, venue-labeled, never global; EFS reads need only per-author order."* Has a gas cost → measure in the [[freeze-gates]] A2 bundle.
- **P2 reserved-key rows** — row-vs-convention-vs-reject each, before the 13-row table freezes: `lang`/`dir`, persona-link (+ label/act word), handler-binding, freshness-beacon, receipt/grant schema.
- **P4 actor/delegation** — reserve a delegation/`act` (on-behalf-of) slot next to the KEL *or* rule it client-receipt-only forever (but rule it); and schedule the P-256 (0x02)/WebAuthn (0x03) un-reservation with a named owner + date (EIP-7951 is live on L1; the client's custody story is capped until it lands — decouple from full-KEL if possible).
- **P11 EFSBytes** — add a per-chunk SHA-256 word alongside keccak before the EFSBytes vectors freeze (native browser SRI/import-map integrity; painful retrofit after).

**Three root causes it names** (fix causes, not symptoms): no trustworthy time + no actor below the author (P1/P4/P13); no private/encrypted tier (P8/P9 → Pass 2); the closed read-grade vocabulary keeps hitting unnameable states (P3 → a read-lens-spec revision, e.g. `NO-TRANSPORT` "not permitted to look" ≠ "not found").

**One cheap meta-ask worth doing regardless (P13c):** surface the design's tradeoffs — the timestamp-free-ID and native-envelope downsides, currently scattered across the false-confidence register and temporal-provenance notes — in **one findable "What this design gives up" section**. A reader should hit the tradeoffs plainly, not reconstruct them.

## Refinement questions — RESOLVED (James 2026-07-08)

- [x] **Scope/ordering:** staged — **Filesystem first, Privacy second, the rest third.**
- [x] **Query language:** not EFS's job — export-to-DB / The Graph / RPC is the path; this pass *confirms clean indexability*, doesn't build a query language. Multi-tag AND-selection investigated in Pass 1 as an FS feature (on-chain if cheap, else off-chain).
- [x] **Privacy depth:** research-first; the option-space research produces the full-vs-reserve-vs-public-only recommendation.
- [x] **Areas to add:** naming/hyperlinks + migration + interop all promoted (Pass 3).
- [ ] **Freeze timing (still open):** confirm the cross-cutting rule — deep design staged, but freeze-sensitive reserved slots from all three passes converge before the ceremony. (Recommend: yes.)

## Next steps to finalize each handoff

- [ ] Extract **Pass 1 (filesystem)** into its own self-contained kickoff prompt (the immediate one) — this is what Fable tackles Saturday.
- [ ] Decide the two cheap standalone OS-handoff items now: ratify the two honest-framing lines project-wide, and greenlight the "What this design gives up" section (P13c).
- [ ] Confirm the freeze-timing cross-cutting rule.

## Pre-promotion checklist

- [ ] Pass 1 kickoff prompt extracted and self-contained
- [ ] Freeze-timing rule confirmed; framing lines + P13c greenlit or deferred
- [ ] At least one round of `#status/review` with another agent or human comment
