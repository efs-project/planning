# FS Pass — Lane report: Namespaces, mounting, federation, move-at-scale

**Lane:** kickoff Q3 (is "mount" just "lens"?), Q7 (move-a-deep-subtree at 10k children), hardlinks, path-segment grammar, container-classifier interplay. Privacy pulled in per James's instruction.
**Ground truth used:** [[fable-fs-kickoff]], [[read-lens-spec]] (§1–§7, esp. §4.3 follow policies, §6 classifier), [[codex-kinds]] (reserved-key table, amendments), [[codex-kernel]] (read ABI, amendment 12), [[codex-envelope]], [[deterministic-ids]] (§1 derivation, canonical-name profile, §8 salted/blinded), [[freeze-gates]] (§C additive-reserved), [[client-os-pressure-report]] (P7, P8, P9), [[fs-feature-space]] (§4, §9), [[state-brief]].
**Status:** design-pass output; normative-*shaped* where marked (R-rules), but nothing here is ratified.

---

## 0. Verdicts up front

1. **"Mount" is NOT "just lens" — and it is not a new primitive either.** Plan 9's union mount is a *bundle* of two orthogonal axes that EFS already factors apart: the **who-axis** (N authors' versions of one key, ordered, first-hit-wins — that IS the lens, exactly) and the **where-axis** (continue resolution of a path suffix under a different container id — that IS the existing `symlink` reserved row, used cross-container). A third case people call "mount" — "let B's stuff show up in my folder" — needs *neither*: it is shared-container membership (B writes at A-rooted tagIds permissionlessly; A's lens admits B). No `mount` row should be minted. What IS missing are **three unwritten read rules** (lens re-anchoring at container boundaries, graft union order, graft gate-opacity) — all Durable, specced in §2.
2. **The 10k-child move HOLDS — but only after one semantic repair.** As currently worded ("`movedTo` = auto-follow"), a lazy folder move breaks *old* deep links, and an un-choreographed move breaks *new* ones. The repair is one rule with three arms — **content-first, follow-on-PROVEN-ABSENT, stop-on-UNKNOWN** (R-M1) — which is exactly grade-aligned with the anti-fallthrough doctrine and makes lazy O(1) moves, eager O(n) compaction, and every mixed state resolve coherently under one algorithm. This requires re-wording the frozen `movedTo` follow-policy column **before the reserved-key vectors freeze** (flagged loudly in §9).
3. **The follow budget as written breaks legitimate federation.** `MAX_AUTO_FOLLOWS = 8` *per resolution* means a 12-segment path crossing 9 one-hop grafts is UNRESOLVABLE even though no chain is longer than 1. Recommend re-cutting to **per-segment budget** (8 follows without consuming a segment; global visited-set for cycles) before the constant is vectored (§3.7).
4. **Hardlinks: subsumed and better; refcount-GC declared gone.** Many PINs → one DATA; nothing is ever freed; the namespace is a **graph, not a tree** — cycles are legal to write and safe to read (§4).
5. **The path-segment grammar has real holes** (`.`/`..`, leading `~`, bidi controls, empty segment, length cap) that sit inside the tagId derivation = Etched. Checklist with recommendations in §5; all freeze-sensitive.
6. **Privacy composes mechanically but leaks socially**: a public graft to a salted tree is a disclosure event; a `movedTo` into a private tree is a doxxing edge; the forwarding address must be optional (§7).

---

## 1. The namespace model, stated precisely (the federation framing)

EFS has no single namespace; it has **as many namespaces as lenses** — this is settled framing. This lane sharpens it into a definition:

> A **namespace** is the triple `(root, L, G)`: a root container (an ADDRESS word or any tagId), the viewer's lens `L`, and the **graft set** `G` — the set of redirect edges (`symlink`, `movedTo`) that resolve LIVE *under L* along any path from the root.

The consequence worth engraving: **in Plan 9 the namespace is per-process config held outside the filesystem (the mount table dies with the process); in EFS every namespace-shaping edge is itself a first-class signed record IN the filesystem, and only the trust order is per-viewer config.** Mounts are content; trust is config. This is strictly stronger than Plan 9: namespaces are shareable, forkable, diffable, and survive the device (they are records, so P9's "lens config must survive device loss" concern shrinks to just the lens list itself).

Federation across chains needs no link-level concept at all, because **tagIds are chain-free**. "B's /photos" denotes the same tagId on every chain; a graft targets an *id*, never a *venue*. What varies is which venue has admitted which claims — and the existing grade machinery (HOME-LIVE / AS-OF / UNKNOWN-CURRENCY, `home` hints) already prices that. There are no "remote paths"; there are ids, and venues that know more or less about them. Portability = replication applies unchanged: copy B's log to your chain and the graft resolves locally.

**Disposition ledger for this section:** per-process namespaces → **native, stronger** (lens); `/etc/fstab` / mount tables → **declared gone** (an artifact of namespace-as-local-config; edges are records); autofs/automount → **declared gone** (a daemon to materialize remote mounts on demand; every EFS read is already on-demand and there is no mount *state* to materialize); AFS/DFS-style single global root → **declared gone, on purpose** (as many namespaces as lenses); volumes/drive letters → **gone**; venues are not volumes (ids are chain-free; a venue is a knowledge horizon, not a storage location).

---

## 2. Q3 — Mount vs lens: the factoring

### 2.1 Three different wants hide inside "mount B's /photos at A's /shared/photos"

1. **"I want B's photos to *appear* in my shared folder"** — if the folder is a place both write to, this is **shared-container membership**: B (or anyone) can already claim at A-rooted tagIds (TAGDEFs are unowned, writes permissionless); whether B's claims *show* is A's-lens membership. No mount machinery at all. This covers most collaborative-folder cases — the mount reflex here is a POSIX artifact (in POSIX, B cannot write into A's tree without a mount/permission; in EFS B always could).
2. **"I want B's *existing* subtree — already keyed under B's root — reachable at my path"** — spatial grafting. B's content is keyed at tagIds derived under `bytes32(uint160(B))`; those ids cannot be re-rooted (child ids derive from parent ids). The only possible mechanism is a **resolution retarget**: an edge at A's mountpoint that makes the resolver continue the remaining suffix under B's node. That edge already exists: **`symlink` (PIN, REF → tagId, auto-follow)** used cross-container. Nothing about the row is within-namespace-only — a tagId is a tagId.
3. **"I want several subtrees overlaid at one point, ordered"** — the Plan 9 union directory. Split it on the axis:
   - Overlay of **N authors' versions of the same subtree** (same tagIds): that is **the lens**, literally — ordered author list, first-attester-wins per key. Plan-9 union directories are lens resolution avant la lettre *along the author axis*. This half of the isomorphism is real and total.
   - Overlay of **N different subtrees** (different tagIds) chosen by one author: the lens cannot express this (a lens unions authors *at one key*, never keys). This is the only genuinely new shape — §2.4.

### 2.2 The ruling

**Unify nothing; separate cleanly.** "Mount" in EFS decomposes without remainder into: **lens** (who-axis), **cross-container `symlink`** (where-axis), **shared-container membership** (the degenerate case needing neither), plus a thin **union convention** (§2.4). Reject a `mount` reserved row (§9-1). The reason Plan 9 needed one mechanism is that Plan 9 had no author axis — one file server was authoritative per tree. EFS's factoring is strictly more expressive: you can graft without unioning, union without grafting, and compose both.

### 2.3 The graft, mechanically — and the three unwritten rules

A graft is: Alice asserts `symlink` PIN at `tagId(A/shared/photos)` → REF `tagId(B/photos)`. Resolution of `A/shared/photos/2024/beach.jpg` follows the symlink (budget-counted, cycle-detected) and derives `2024/beach.jpg` under B's node, where B's claims live. Three rules nobody wrote:

**R-A1 — Lens re-anchoring at container boundaries (Durable, read-lens-spec).** The *default* lens for container reads is `[containerAuthor, viewer, …]`. When an auto-follow crosses into a subtree rooted at a different ADDRESS container, the container-author-first *default* MUST re-anchor to the target root's author for the remaining segments. An explicit `?lenses=` chain never re-anchors (explicit beats defaults, and citation-form reproducibility depends on it).
*Why it's load-bearing — the mount-shadowing attack:* writes are permissionless, so Alice **can** claim at B-rooted tagIds. If the default lens stays `[Alice, viewer, B]` inside what the user perceives as "B's photos," Alice's pre-placed hostile `beach.jpg` at the B-rooted tagId **wins over B's own file inside B's own tree**. The user believes they are reading B; they are reading the mounter. Re-anchoring makes B first-attester in B's tree — which is what the perception contract says. The attribution chip (U1) still discloses everything; R-A1 fixes the *default*, not the disclosure. One hostile vector required for the conformance suite.

**R-A2 — Graft union order: direct-first, then grafted (Durable).** After a graft exists at node M → T, both M-keyed claims (written by people who spelled the M path) and T-keyed claims (the grafted tree) are reachable at M. Resolution order per segment: (1) run full §3 lens resolution at the **direct** (M-derived) id; (2) on `AbsentEverywhere` — and only then — follow the graft and resolve at the T-derived id; (3) UNKNOWN at either layer STOPS (anti-fallthrough is layer-blind). Listings union both layers, each entry labeled with its layer (extend the U1 chip with "via graft at M"). This is OverlayFS's upper-wins made lens-compatible; the reserved **WHITEOUT** slot, when specced, should be pinned to mask graft-lower names for viewers honoring it (§9-8).

**R-A3 — Grafts are never GATE-transparent.** On-chain consumers gate on closed author sets and point reads (§3.3 read-lens-spec); a contract MUST NOT be handed a path and expected to discover grafts. A gate consuming grafted content is given the *resolved* id (or the graft edge as explicit, checked input). This keeps grafting a pure read-layer feature with zero admission surface.

### 2.4 Multi-target union at one point: convention, not row

One author overlaying N different subtrees at one mountpoint (Plan-9 `/bin` = union of arch-bin, rc-bin, home-bin; Docker layers; theme/font fallback chains). Cardinality-1 `symlink` can't hold N targets. The shape that fits without any new kind: **TAGs under a spec-named user-key TAGDEF (e.g. `efs.fs/union` as a child key of the mountpoint), REF → target tagIds, weight = order**; resolution = R-A2 iterated over targets in weight order, each follow budget-counted. This is fully expressible today (TAG slot key `(author, definitionId, targetId)` lets one author hold N such edges) and resolution is Durable read-side text — so it needs **no reserved row**, only a blessed shape in read-lens-spec so clients don't dialect. Lean recorded in §9-2 with a named re-check trigger: zero of the ten grounded apps needed it; the OS pass's handler-chain / package-overlay pressure is the thing that could flip it to a row (frozen vectors), and P2's `handler-binding` candidate covers the sharpest handler case by other means.

### 2.5 Pinned grafts (the git-submodule contrast): reject a row; pinning is link-layer

A live graft resolves the target's *current* state under your lens — a branch, not a commit. Git submodules pin an exact state; P7's app-package ask ("atomic resolve-closure-at-pinned-root") is the same want. Ruling: **do not put the pin in the graph.** The pinned form already exists at the link layer — citation form pins claimId + lens chain + `asof` — and at the doctrine layer (P7 manifest hashing the closure). A `mountPinned` row (or an `asOf` word appended to the symlink body) would smuggle version-selection semantics into an Etched row for a need the link grammar already serves, and every consumer would still need the link-layer form for reproducibility. Reject (§9-5).

### 2.6 Federation UX rule (Durable)

When a graft target's container carries a `home` hint naming a venue this reader doesn't hold, the position state at this venue is UNKNOWN — and the resolver SHOULD surface the hint: render "content homed at venue Y; not known here," never a bare 404 and never a fallthrough. A dead-venue graft degrades to the honest §5.1 offline-bundle grades. No URL surface changes: chain-relative rules and `home` cover it.

---

## 3. Q7 — The 10k-child move, traced end-to-end

### 3.1 Setup, and why the naive reading breaks

Folder `F` = `A/projects/website`, `tagId_F` derived under A's root. 10k children keyed under `tagId_F`'s chain (each child TAGDEF derives from its parent's tagId; placements are PINs at the child file nodes). Move to `A/archive/website-old` (`tagId_F′`). Child ids are structurally bound to `tagId_F` and cannot be re-derived — settled.

The current row says `movedTo` = PIN at old node, **auto-follow**. Walk both directions:

- **Old deep link** `…/website/img/photo1.jpg`: the resolver derives old ids segment-by-segment; at `tagId_F` it finds `movedTo → tagId_F′` and — per unconditional auto-follow — retargets the suffix under `tagId_F′`. But in a lazy move the claims still live at **old** ids. The resolver just walked *away from the content*. Old links break. This violates path permanence, the promise the whole redirect design exists to keep.
- **New deep link** `…/archive/website-old/img/photo1.jpg`: derives new ids. Nothing is keyed there. `movedTo` points old→new — there is **no edge new→old**, so forward resolution at the new path finds nothing. New links break too.

So the written design, read literally, moves a folder such that *neither* the old nor the new path serves the children. The trace question ("does it HOLD?") answers: **not as written**. It holds after the following repairs, none of which needs a new record kind.

### 3.2 R-M1 — The repaired follow semantics: content-first, follow-on-absence

For a node with a LIVE `movedTo` winner under the viewer's lens, at any position in a path walk:

1. **PRESENT** (the resolution target at the old ids resolves): **serve in place; render the breadcrumb; consume no follow.** `movedTo` is provenance + canonical-name migration, not transport.
2. **PROVEN-ABSENT** (the old-id resolution comes up AbsentEverywhere for the suffix segment being resolved): **retarget the unresolved suffix under the movedTo target** (this consumes a follow, budget-counted, cycle-detected).
3. **UNKNOWN**: **STOP** (Unresolved). Following a redirect on missing data would substitute different content for a data gap — the same anti-monotonicity argument as lens anti-fallthrough, and the rule falls out of the existing grade algebra with zero new vocabulary.

This one rule makes lazy moves, eager moves, and every partially-compacted intermediate state resolve correctly under a single algorithm (traces in §3.5). It is grade-aligned by construction: absence-with-a-bound is the only license to redirect, exactly as it is the only license to fall through.

**Freeze note (loud, see §9-3):** the reserved-key table's follow-policy column for `movedTo` currently reads "auto-follow." That column is part of the Etched table (read-lens-spec pin P9). The wording must become **"conditional follow: serve-on-PRESENT with breadcrumb / follow-on-PROVEN-ABSENT / stop-on-UNKNOWN"** before the per-row golden vectors are cut. `symlink` stays unconditional (it is transport by definition; there is deliberately nothing "in place" at a symlink node — and if someone does place content at a symlink node, R-A2's direct-first order already answers it).

### 3.3 The two move shapes, choreographed (SDK verbs, Durable + doctrine)

**Lazy move — O(1), the default.** One envelope:
1. Mint the new path chain TAGDEFs as needed (idempotent for already-spelled segments).
2. `movedTo` PIN at `tagId_F` → `tagId_F′` (provenance + canonical name migration).
3. **Continuity graft:** `symlink` PIN at `tagId_F′` → `tagId_F` (this is the missing reverse edge — new-path resolution transports into the old-keyed subtree).

Cost: 2 claims + ≤depth TAGDEF mints. Constant, a few hundred k gas, one signature, atomic. Old links: arm 1 of R-M1 (serve in place + breadcrumb). New links: symlink transport → old ids → content. Listings at new: follow the graft, enumerate old (R-A2). **A folder move is a rename of the handle, not a migration of the content — that is the design's actual (and correct) shape, and it should be said this plainly in the cookbook.**

**Eager move (compaction) — O(n), optional hygiene.** Re-assert each child's placement under new-derived ids, mint the new child TAGDEFs, REVOKE the old placements, and **REVOKE the continuity symlink at `tagId_F′`** (see the cycle trap below). At 10k children this is ~30k records (10k TAGDEFs + 10k PINs + 10k REVOKEs); at spine + storage costs call it order-of-a-billion gas — tens of L2 blocks. One *signature* still covers it (one Merkle root; `submitSubset` admits it in chunks, monotone), so the signed intent is atomic while admission is incremental. State the mid-flight honesty rule: during chunked admission a venue serves the admitted prefix — children flicker old→new individually, each transition itself atomic per child if the SDK orders each child's (new-TAGDEF, new-PIN, old-REVOKE) into the same subset chunk. **The SDK compaction verb MUST chunk per-child, not per-record-type** — per-type chunking (all revokes first) makes the whole folder vanish transiently. This is a rule nobody wrote; it costs nothing and prevents the worst mid-move render.

**The cycle trap (named failure mode).** Compacting content while leaving both edges live creates: new → (symlink) → old → (EMPTY, movedTo) → new → … The visited-set catches it (UNRESOLVABLE), but a correctly-choreographed compaction never creates it: revoke the continuity symlink in the same envelope that re-homes the content. Doctrine sentence for the SDK move/compact verbs.

### 3.4 Multi-hop composition A→B→C, and who can compact what

Each moved node keeps its own `movedTo`; a twice-moved suffix costs two follows. Chains self-heal by **slot supersession**: when moving an already-moved node B→C, the SDK SHOULD also supersede the *A* node's `movedTo` to point directly at C (the mover owns that slot — `(author, movedTo@A)`), collapsing A→B→C to A→C while B→C remains for B-links. O(1) per historical hop, done by the only party who *can* do it (the slot's author). Readers cannot compact chains they don't own — they can only re-link; say so. Breadcrumb rendering walks the chain for full provenance ("was /projects/website, then /archive/website-old, now …") — render-only, consumes no budget.

### 3.5 Worked traces (each exercises the normative path)

**T1 — old deep link, lazy move.** `A/projects/website/img/photo1.jpg`. Segments derive old ids; every position PRESENT; at `website` the resolver notes `movedTo` (breadcrumb; arm 1; 0 follows). Content serves from the old-keyed placement. Grades unchanged; budget 0.

**T2 — new deep link, lazy move.** `A/archive/website-old/img/photo1.jpg`. `website-old` node: direct id has no placement for the suffix (its own container holds the symlink) → R-A2 layer 2 → follow symlink (1 follow) → derive `img/photo1.jpg` under old `tagId_F` → PRESENT → serve. Attribution chip: "via graft at website-old." Budget 1.

**T3 — old deep link after full compaction.** Old ids: `website`'s child suffix now PROVEN-ABSENT at home (placements revoked) → arm 2 → retarget suffix under `tagId_F′` (1 follow) → new-keyed placement PRESENT → serve + breadcrumb. Budget 1. On a replica missing the revokes: old placement still PRESENT → serves the *old* claims, venue-qualified AS-OF — honest, converges when the revokes replicate.

**T4 — twice-moved + one graft, deep tree.** Path crosses a graft (1) then a compacted A→B→C ancestor whose A-slot was self-healed to A→C (1, not 2). Budget 2 of 8. Without self-healing: 3. The budget only threatens *un-compacted long chains* and *deep federations* — hence §3.7.

**T5 — third-party write after lazy move (the split-spine).** Carol browses `/archive/website-old/`, drops `notes.md`: her client derives the path she sees → her claim keys under **new** ids. A's legacy content keys under **old** ids. The folder is now a **two-spine union container**: listing = direct(new) ∪ grafted(old), per R-A2, labeled. Anyone following an old link and tagging a file writes at **old** ids — both spines keep accruing. Steady state without compaction is permanent bi-location; R-A2 makes it coherent, compaction makes it clean. **Answer to the kickoff's discovery question ("old parent, new parent, or both?"): claims enumerate wherever they are keyed — legacy at old, post-move at new, both until compacted; a listing is the labeled graft-union of the two.** (Child enumeration itself is the parent-walk over child TAGDEFs plus placement grading, per kernel amendment 12 — the union rule applies identically to it.)

### 3.6 Does it hold at 10k? The verdict

**Yes — because the design's real move is O(1) and content-stationary.** The 10k-child number stresses only the *eager* path, which is correctly an optional, chunkable, monotone background job, not the move itself. What was missing was not capacity but **rules**: R-M1 (content-first follow), the lazy-move two-edge choreography (§3.3), per-child chunking for compaction, the cycle-trap discipline, R-A2 for the split-spine, and chain self-healing (§3.4). All Durable/SDK/doctrine — except the `movedTo` follow-policy re-wording, which touches the Etched table (§9-3).

### 3.7 The follow budget needs a re-cut (flagged before the constant freezes)

`MAX_AUTO_FOLLOWS = 8` is **per resolution**. A 12-segment path crossing 9 healthy one-hop grafts is UNRESOLVABLE — the budget converts *federation depth* into a protocol accident, punishing exactly the composition §2 blesses. Recommend: **8 follows per path segment consumed** (kills chains and cycles locally; total work bounded by 8 × segments, which the client already bounds by accepting the path), with the **global visited-set unchanged** (cycles across segments still die). The constant is read-lens-spec-owned but flagged `[→ Codex]` for vectoring — re-cut it before vectors. If the global cap is kept for defensive reasons, raise it and add the per-segment rule as the primary bound; either way the current shape is the bug.

### 3.8 Edge cases with stated answers

- **Move into own descendant** (`A/x → A/x/y/z`): inexpressible to *forbid* (permissionless, no global check); read-time visited-set makes deep resolutions UNRESOLVABLE rather than infinite; SDK move verb refuses client-side. Named, accepted.
- **Competing `movedTo` by different authors at one node**: ordinary multi-claimant key — lens picks, U2 marker shows "N other claims." A stranger's redirect is invisible unless your lens trusts them. For A-rooted trees the container-author default makes A's redirect win. For **neutral-rooted containers** (paths rooted at a bare TAGDEF, no ADDRESS root) there is *no* natural container author: a `movedTo` there is purely lens-relative, and clients MUST NOT render any single author's redirect as "the folder moved" without the chip. Worth one conformance vector.
- **Revoked `movedTo`** (author withdraws the forwarding address): old node stops redirecting for current reads; the node persists (path permanence promises the *node*, not the forwarding). History views still show the revoked crumb.
- **`asof` reads through moves**: redirect edges are ordinary claims, so an `asof=N` resolution naturally excludes later-asserted `movedTo`/`symlink` — historical paths resolve as they were, for free. Caveat inherited from the time model: `asof` is per-author, and a multi-author path's "as of Tuesday" is the snapshot lane's problem — flagging the touch, not owning it.

---

## 4. Hardlinks — and the shape of the namespace

**Disposition: subsumed, better in one way, minus one property that is declared gone.**

- POSIX hardlink = two dentries, one inode, symmetric, file freed at `nlink == 0`. EFS: **one DATA object, any number of placement PINs from any paths by any authors.** All names first-class; no primary (an author may designate one by convention; the protocol doesn't). Cross-author, cross-"filesystem" hardlinks — impossible in POSIX — are native.
- **No refcount, no GC — nothing is ever freed.** "Remove the last link and the file is deleted" has no referent: objects are permanent, bytes persist, delete = revoke-your-edge. Say it in exactly those words in the cookbook; CAS/POSIX people will assume otherwise.
- `st_nlink` (how many names does this file have?) = **backlink enumeration** — "who PINs this DATA" — which rides the target-keyed-index decision (kickoff Q6, graph lane's call). This lane consumes it softly if it lands ("mounted where?", loop diagnostics); no independent ask.
- **Directory hardlinks**, forbidden in POSIX for cycle-safety, are *inherently representable* here (grafts/symlinks at folder nodes; even placement graphs can cycle). The honest statement: **the EFS namespace is a graph; treeness is a per-view rendering discipline.** Cycles are legal to write and safe to read — budget + visited-set turn them into UNRESOLVABLE errors, never hangs. Declare it a feature with a named cost (UIs must handle "this folder contains an ancestor of itself").

---

## 5. Path-segment grammar — the freeze-sensitive confirm checklist

Settled base: NFC canonical bytes, pinned Unicode version, reject unassigned codepoints (IDNA2008-style), byte-exact case sensitivity forever, percent-encoding profile, `salt=0` rejected, names pre-hashed (labelhash) into the derivation. The grammar is **inside the tagId derivation = Etched**; every item below must be decided before the derivation freezes, and each needs golden vectors. Recommendations:

| Item | Recommendation | Why |
|---|---|---|
| `.` and `..` as segment names | **REJECT in the canonical profile** | otherwise `..` is a mintable name and rendered URLs become traversal-spoofing surfaces; `..` stays client sugar only |
| empty segment (`""`) | **REJECT** | double-slash ambiguity; also `keccak("")` is a perfectly derivable tagId today — close it |
| leading `~` (0x7E) | **REJECT as first byte** | collides with the `~prefix:` sigil grammar (§6.3–6.4); mid-path a literal name spelled `~tag:…` would be undisambiguable from a prefix jump. Forbidding the first byte is the cheapest total fix; `~name:` remains the escape for anything else |
| bidi control codepoints (U+202A–202E, U+2066–2069) | **REJECT** | RTLO path spoofing (`gpj.exe` classics) inside signed, permanent names; rendering can't be trusted to defuse what the derivation admits |
| other invisibles (Cf category, variation selectors) | **REJECT except IDNA2008-permitted joiners** | confusable/steganographic names; adopt the IDNA2008/UTS-46 reject set by reference and pin it |
| length cap | **freeze `MAX_NAME_BYTES`** (recommend 512) | names ride record bodies into state; a malformed-body revert is legal under the master invariant; an uncapped name is a UX/DoS gradient with no upside |
| case sensitivity | **keep byte-exact; declare case-insensitivity GONE** | case-folding is locale-dependent (Turkish-i) — precisely what a frozen Schelling derivation cannot carry. `Readme.md` ≠ `readme.md` is permanent; confusable-pair warning is client-layer |
| 64-hex-shaped names | keep legal + SDK warn + `~name:` escape at root | already ruled; no change |
| homoglyph/confusable names | **accepted residual** | not rejectable without a gatekeeper over scripts; defense is rendering (confusable highlighting) + lens; name it in the footgun list |
| enforcement split | **confirm**: kernel enforces the byte-profile checks it can (forbidden bytes/ranges, length, round-trip percent-encoding); full NFC verification is SDK-owned with the kernel storing canonical bytes | codex-kinds delta 6 vs deterministic-ids' "on-chain NFC validation impossible" need one reconciled sentence |
| Unicode version pin | **confirm the pin covers normalization corrigenda** | NFC stability argument depends on it |

---

## 6. Container classifier & URLs under grafts and moves

- **"Current parent" needs a definition.** §6.3's rule 3 ("non-root bare word = NAME under the current parent") must define *current parent* as the **post-follow** container id — after any symlink transport, movedTo suffix-retarget (R-M1 arm 2), or graft-union layer selection (R-A2). One sentence in §6.3; without it two conforming resolvers can diverge on any grafted path.
- **Direct id jumps compose cleanly**: `web3://efs.eth/~tag:<tagId_F′>/img/photo1.jpg` enters at the new node and the same R-A2/R-M1 rules run. A `~tag:` jump to the *old* node of a moved folder serves the container view with the breadcrumb (arm 1). No classifier changes.
- **Query surface**: no new keys needed. `?lenses=` (explicit chain, never re-anchors — R-A1), `?asof=` (works through moves for free, §3.8), `home` hints for federation UX (§2.6). Resist a `?venue=` key: venue selection is the reader's client/transport config, not link content — a link that pins a venue is a link that lies when the venue dies.
- **Rendering rule (Durable doctrine)**: a grafted item renders under the path the user browsed, with the attribution chip carrying its true home (`B/photos/2024/beach.jpg via graft at A/shared/photos`). This is §4.2's authorship-boundary discipline extended to grafts — same phishing shape, same defusal.

---

## 7. Privacy in this lane (pulled into Pass 1 per James)

Mechanically, salted/blinded TAGDEFs compose with everything above — ids are ids; grafts, moves, unions, and the classifier are salt-blind. The leaks are relational:

1. **A public graft to a salted tree is a disclosure event.** A `symlink` PIN's target rides in a plaintext claim body. Grafting `A/shared → saltedTagId(B-private)` publishes (a) that the salted node exists, (b) that A is connected to it, (c) a stable rendezvous id for traffic analysis. And a *usable* public graft is worse: readers need the capability, and a capability published next to the graft **is** the disclosure. The little theorem, stated for the cookbook: **mount privacy = min(edge privacy, target privacy).** Private grafting has exactly two honest forms: keep the edge itself private (client-side config, or the P9 encrypted-link convention — salted-capability anchor + `contentEncryption`/`keyWrap` body), or accept that the mount is public and only the *names* below stay blinded.
2. **`movedTo` is a potential doxxing edge.** Moving a public folder into a salted tree with a forwarding crumb links the public history to the private destination, permanently (the claim can be revoked, but it was published). The SDK move verb MUST support — and warn toward — **move-without-forwarding-address**: revoke placements in place, rebuild privately, no `movedTo`. Silence is a legal move; the breadcrumb is a courtesy, not an obligation. (Converse also true: `movedTo` from a salted node to a public path is a voluntary de-blinding — fine, but the verb should say so.)
3. **Salted-tree *activity* is public even when names aren't.** Claims at salted tagIds are enumerable (the spine and any per-tagId index are public); observers see write cadence, author words, and sizes. Consistent with P9's four-layer honesty (graph/authorship fundamentally public); restate it here because "private folder" will be read as more than it is. Reads, as ever, leave no trace (no atime — the lane's one free privacy win, worth advertising).
4. **Breadcrumbs are archaeology.** A long `movedTo` history is a permanent map of how an author reorganized their life. Not fixable (permanence is the product); the mitigation is the same as (2): forwarding is optional, and clients could offer "quiet moves" as the privacy-default for salted destinations.

---

## 8. Classic-FS disposition table (lane scope; rule 3 of the pass)

| Classic feature | Disposition | How / why |
|---|---|---|
| `mount` / `mount --bind` | **re-homed** | cross-container `symlink` graft + R-A1/R-A2/R-A3 (§2.3) |
| union directories / OverlayFS layers | **re-homed, split** | author-axis → lens (native); multi-subtree-one-author → blessed `efs.fs/union` TAG convention (§2.4) |
| mount table / fstab / automount (autofs) | **declared gone** | artifacts of namespace-as-local-config; namespace-shaping edges are signed records; reads are already on-demand |
| submodule / pinned mount | **re-homed to link layer** | citation form (claimId + lenses + asof) + P7 closure manifest; no graph pin (§2.5) |
| `mv` / rename (file) | **native** | `movedTo` + re-PIN + revoke, 3–4 records |
| `mv` folder (deep) | **re-homed** | lazy two-edge rename-of-handle O(1) (§3.3); eager compaction O(n) optional; R-M1 semantics |
| hardlinks | **subsumed** | many PINs → one DATA; all names first-class; cross-author works (§4) |
| refcount / free-on-last-unlink / GC | **declared gone** | nothing is ever freed; permanence is the point |
| symlinks | **native** | the `symlink` row, budget re-cut pending (§3.7) |
| directory-hardlink prohibition | **declared gone** | namespace is a graph; cycles read-safe via visited-set (§4) |
| `..` traversal | **client sugar** | forbidden as a mintable name (§5); resolution is forward-only |
| case-insensitive lookup | **declared gone** | locale-dependent folding can't live in a frozen derivation (§5) |
| per-process namespaces (Plan 9 / CLONE_NEWNS) | **native, stronger** | the lens; namespaces shareable/forkable as data (§1) |
| global network-FS root (AFS/NFS) | **declared gone, on purpose** | as many namespaces as lenses; federation = venue-plural reads of chain-free ids (§1, §2.6) |
| volumes / drive letters / statfs | **declared gone** | venues are knowledge horizons, not storage locations; "space" = gas |
| atime | **declared gone (privacy feature)** | reads leave no trace |

---

## 9. FREEZE-SENSITIVE RESERVATIONS (the loud section)

Row vs convention vs reject, per the pass rule. Items 3 and 4 are the two that can actually bite the ceremony.

1. **`mount` reserved row — REJECT.** Grafting is the existing `symlink` row used cross-container; membership is the lens; union is (2). A mount row would be a second spelling of symlink (the dual-encoding sin the kinds ruling spent itself killing).
2. **`union` multi-target row — CONVENTION, not row** (explicit ruling, not silence): blessed `efs.fs/union` user-key TAG shape + Durable resolution text in read-lens-spec. **Re-check trigger:** an OS-pass grounding (handler chains, package overlays) that needs frozen per-row vectors; if it fires, the row is TAG-role, REF→TAGDEF, weight-ordered, follow only inside graft resolution.
3. **`movedTo` follow-policy column re-wording — ROW AMENDMENT, REQUIRED BEFORE VECTORS.** The Etched reserved-key table (pin P9) currently says "auto-follow" for `movedTo`. Must become **conditional: serve-on-PRESENT (+breadcrumb) / follow-on-PROVEN-ABSENT / stop-on-UNKNOWN** (R-M1), else the frozen vectors will bake in semantics under which lazy folder moves break old links (§3.1). Three vectors minimum: PRESENT-with-movedTo, ABSENT-retarget, UNKNOWN-stop. This is the lane's #1 freeze item.
4. **Path-segment grammar deltas — ETCHED (inside tagId derivation), decide-before-freeze:** reject `.`/`..`/empty-segment; forbid leading `~` (0x7E); reject bidi-control and Cf-invisible codepoints per a pinned IDNA2008/UTS-46 profile; freeze `MAX_NAME_BYTES`; confirm the Unicode-version pin covers normalization corrigenda; reconcile the kernel-vs-SDK enforcement sentence (§5). Each needs golden vectors. None of these is a new row; all are derivation-profile surface.
5. **Pinned-graft row (`mountPinned` / `asOf` word on symlink bodies) — REJECT.** Pinning is link-layer (citation form + `asof`) + P7 manifest doctrine (§2.5). Adding an asof word to a reserved row's body is format surface with no consumer the link grammar doesn't already serve.
6. **`symlink` / `movedTo` legal-targetKind sets — CONFIRM before the table freezes** that both rows admit TAGDEF targets of the kinds grafting needs (KIND_GENERIC and KIND_DATA nodes at minimum; LIST arguable) and nothing restricts targets to same-root ids. Cross-container grafting is this lane's whole §2; it must not die in a table cell nobody re-read. (OPAQUE stays forbidden per amendment 5 — no change asked.)
7. **`MAX_AUTO_FOLLOWS` shape — re-cut to per-segment before the `[→ Codex]` constant is vectored** (§3.7). Not a row; a frozen-constant shape.
8. **WHITEOUT (already additive-reserved) — pin one promise when specced:** a whiteout honored by the viewer masks graft-lower names in R-A2's union (the OverlayFS behavior it was borrowed from). No new reservation; a semantic sentence to attach to the existing slot so the FS and privacy passes don't spec it divergently.
9. **No new time/actor/index words from this lane.** Moves and grafts ride existing claims (`claimedAt`, if minted, applies to them as to any claim). Backlink/target-keyed indexing (kickoff Q6) is consumed opportunistically, not required — the graph lane owns that call.

---

## 10. Named failure modes (register)

- **FM-mount-shadow:** mounter out-ranks target author inside the grafted tree absent R-A1 re-anchoring → phishing inside "B's" tree. Defused by R-A1 + chip; hostile vector required.
- **FM-move-dark:** unconditional movedTo-follow walks away from lazily-moved content (both directions broken) — the §3.1 defect; defused by R-M1 + choreography.
- **FM-cycle-trap:** compaction that re-homes content but leaves the continuity symlink + movedTo pair live → UNRESOLVABLE ring; defused by SDK verb discipline (§3.3).
- **FM-split-spine:** lazily-moved folders accrete claims under two id spines forever; coherent under R-A2, clean only after compaction; must be documented or it becomes "EFS loses my files" folklore.
- **FM-budget-federation:** global follow budget kills legitimate deep grafts (§3.7).
- **FM-mid-move-void:** per-record-type chunked compaction makes the folder vanish transiently; per-child chunking rule (§3.3).
- **FM-movedTo-squat:** untrusted authors assert redirects at nodes they don't control — lens-graded (invisible), but neutral-rooted containers have no default winner; conformance vector (§3.8).
- **FM-doxx-forward:** movedTo into a salted tree links public past to private present (§7.2); quiet-move option.
- **FM-mount-disclosure:** public graft to a salted tree, or capability shipped beside the graft (§7.1).
- **FM-spoof-name:** bidi/invisible/confusable segments in signed permanent names (§5) — grammar rejects the controllable subset; confusables are an accepted, named residual.

---

## 11. Prior-art notes (what was actually taken from each)

- **Plan 9:** the factoring target. Its one mount mechanism = EFS lens (author axis) × symlink-graft (space axis); its per-process namespace = the lens, with EFS strictly stronger because namespace-shaping edges are shareable signed data (§1). Its `..`-in-union ambiguity is why `..` dies in the grammar rather than in resolution rules.
- **OverlayFS:** upper-wins layer order → R-A2 direct-first; whiteout semantics → §9-8's pin on the reserved slot; the lesson that layer order must be *stated*, not emergent.
- **git submodules:** the pin-vs-track distinction → §2.5's ruling that pins live in links (citation form), not in the graph; also the warning story (submodule UX pain came from pinning-by-default — EFS defaults to live grafts and offers pins, the reverse and, for a browsing medium, the right way round).
- **autofs / fstab:** the entire category of mount-materialization config is an artifact of one-machine namespaces — declared gone with reasons (§1, §8).
- **AFS:** the global-root contrast that makes "as many namespaces as lenses" a feature statement rather than an apology (§1).
- **POSIX inode/dentry:** the name/object split used to state hardlink subsumption precisely (§4).

## 12. Handoffs

- **Snapshot/versioning lane:** `asof`-through-moves works per-author for free (§3.8); the multi-author folder-as-of question is yours; movedTo/symlink claims being ordinary claims is the property you get to lean on.
- **Graph lane (Q6):** target-keyed index would give "grafted-where"/st_nlink UX (§4); this lane consumes but does not require it.
- **Collaboration lane:** the split-spine container (§3.5 T5) is a mild instance of your multi-author reconciliation problem; R-A2's labeled union is the read-side shape you may want to generalize.
- **OS pass:** R-A1's re-anchor default, the union convention's fate (§9-2), quiet-move UX (§7), and the P7 pinned-closure link form are your inputs; the namespace triple (§1) is offered as the OS's definition of "a place."
