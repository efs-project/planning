# The filesystem + graph-DB feature space, mapped against tag-core

**For:** Fable 5, the FILESYSTEM FEATURES design pass (Pass 1)
**Kind:** cartography — material to think with, not a spec to execute
**Last touched:** 2026-07-10

## How to read this

This is a **map of the territory**, not a route through it. James's instruction for the whole pass: *"informational and helpful only. Not telling it what to do. Let it be creative and go as wide and as deep as it can. It's smarter than us so let's just help it and kick it off."* So treat every cluster below as a place worth standing and looking around — not a task, not a checklist, not a ruling. The bias throughout is **surfacing good questions over supplying answers.** Where I state an answer, it's to give you a foothold to push off from, not to defer to.

Confidence markers, same convention as [[fable-handoff-v2-tag-core]]:
- **[settled]** — survived the 2026-07-07 adversarial round or a James ruling; the stable base ([[confidence-and-open-decisions]]). Overturnable with loud, specific cause.
- **[reasoned]** — thought through here or in discussion; *not* adversarially tested. A hypothesis to validate.
- **[open]** — genuinely undecided; the good questions live here.

If anything below conflicts with a mission end (permanent & credibly neutral, portable, verify-don't-trust, cypherpunk, hyperlinkable, a real FS + graph DB people build on), the end wins and I'm wrong.

---

## 0. The one structural fact that reframes every filesystem feature

Before the clusters: there is a single property of tag-core that bends *every* classic FS/DB feature into a new shape, and if you internalize only one thing from this map, make it this one. **Read it first; each cluster below is really a corollary of it.**

Classic filesystems have **one mutable object per name.** `/etc/passwd` is a thing; you `open()` it, you `write()` it, the bytes change, everyone who reads that path sees the change. Permissions gate *who may mutate the one object.* Almost every FS feature — locking, ACLs, quotas, snapshots, undo — is machinery for **coordinating many writers around one shared mutable cell.**

Tag-core has **no shared mutable cell.** [settled] Its atoms:

- **Objects** (TAGDEF, DATA, LIST) are **permanent and unrevocable.** A TAGDEF path node and a DATA file identity, once minted, exist forever and cannot be destroyed or changed. DATA is *owned* (author+salt in the id preimage — unforgeable, unsquattable); TAGDEF is *unowned* (a shared Schelling point — `tagId = keccak(DOMAIN, parentTagId, keccak(name), kind)`, so anyone who spells the same path derives the same node).
- **Edges** (PIN cardinality-1, TAG cardinality-N) are **revocable claims**, and — this is the pivot — **every edge slot is keyed by its author.** A "slot" is `(author, key)`. There is no `/projects/plan.md → v3` slot that Alice and Bob both write. There is Alice's slot and Bob's slot. The reader's **lens** (ordered trusted-author list, first-attester-wins) decides *whose* slot is "the" answer at read time.
- **Writes are permissionless.** [settled] Anyone can ASSERT any edge targeting anything — nobody needs permission to write, because writing doesn't mutate anyone else's view. The permissionless byte pool is a ruled invariant.

So the classic frame **inverts**:

| Classic FS asks… | Tag-core makes it… |
|---|---|
| Who is *allowed to write* the object? | Everyone writes; **whose writes does a reader's lens honor?** (control moved from write-time to read-time) |
| How do writers not clobber each other? | They can't clobber each other — separate author slots. **How does a reader reconcile N authors who all wrote?** |
| How do I delete the file? | You can't destroy the object (permanent). **You revoke your edge to it** — the slot reads EMPTY under your authorship, the bytes may persist forever elsewhere. |
| How do I lock it during my write? | Writes never conflict at the slot level. **Locking is a read-time coordination convention, if it exists at all.** |
| Who owns the directory? | TAGDEFs are unowned. **"Ownership" of a namespace is a lens/curation fact, not a kernel fact.** |

**The sharp meta-question for the whole pass:** which classic FS features are *essential semantics* users will demand (and must be re-homed onto lens + edges + curation), versus which are *artifacts of the one-mutable-cell architecture* that simply evaporate here and should be declared gone rather than simulated? A lot of the design work is that sorting. Simulating a shared mutable cell on top of per-author slots (to make EFS "feel like" POSIX) may be exactly the wrong instinct — or exactly the adoption bridge. That tension recurs in every cluster.

Prior art that lives natively in this inverted world (worth Fable holding in mind throughout, not just where cited): **git** (content-addressed objects, mutable refs are the only mutable thing, merge is explicit and human), **Datomic** (immutable facts + time; "the database is a value"; nothing is ever updated in place), and **RDF/triplestores** (the world is a set of `(subject, predicate, object)` assertions by various speakers; "truth" is a named-graph/provenance question, not a cell value). EFS is closer to *Datomic-facts-under-RDF-provenance-with-git-refs* than to POSIX. Where a cluster below strains, the strain is almost always "we reached for a POSIX reflex in a git/Datomic/RDF world."

---

## 1. Write-sharing / access control / delegation

**What tag-core enables cheaply.** Read-side access control is the *native* model and it's genuinely strong. A reader's lens is an allow-list of authors; a deny-set subtracts advisories after resolution (§3.4 read-lens-spec). "Who can I see writing in this folder" is fully expressible and portable. Delegation-of-*trust* (I trust whoever Alice trusts) composes by putting Alice's published lens (a LIST) into your lens chain. [settled for reads]

**Where it strains.** *Write*-sharing in the POSIX sense — "grant Bob write access to `/projects`" — **has no referent.** Bob can already write; nobody can stop him. What the user *means* is one of at least four different things, and untangling them is real work [open]:
1. *"Bob's writes should show up in the canonical view of /projects"* → a **lens/curation** act: whoever curates the canonical view adds Bob as a trusted author for that container. This is expressible today (add Bob to the container's published lens).
2. *"Bob may write **as** the team / under the team's authority"* → **delegated authorship.** This is the hard one. Today there is exactly one author (the recovered signer). Bob cannot sign *as* the team without the team's key. There is no `act`/on-behalf-of credential (P4, reserved-not-built). A shared team key is the only mechanism now, and it's the "one key = identity" trap at org scale.
3. *"Only Bob and Alice may write here, nobody else"* → **not expressible and arguably shouldn't be** — it contradicts permissionless writes. The closest honest thing is a curated container whose lens admits only Bob and Alice, so third-party writes exist but are invisible to that view. "Exclusion" is a read-fact, never a write-gate.
4. *"Bob may write but I want to revoke that later"* → **delegated revocation doesn't exist** (`revoker == claim.author`, P4). If Bob writes under his own key, Alice can eject Bob from the lens (prospective) but cannot revoke Bob's already-made claims. If Bob writes under a shared key, nobody can single out Bob's writes to revoke.

**The sharp open questions.**
- Is "write access" the wrong primitive to port at all — should the pass reframe the whole cluster as **"curated-view membership + optional delegated authorship"** and say so loudly, so app developers stop reaching for `chmod`? [open]
- Capabilities-as-links: Tahoe-LAFS makes a *write-cap* a literal string (the key rides in the URL fragment). EFS already reserves the fragment-carried capability pattern for read privacy (P9). Is there a **write-capability** analog — a delegable, attenuable token that lets a holder produce claims a lens will honor as the delegator's — that fits without new Etched surface, or does it *require* the reserved KEL/`act` slot to be cryptographic rather than conventional? The P4 finding says the client-side `efs.os/persona` owner-labeled roster ships the *presentation* today, but only the reserved credential ever makes it *cryptographic*. Is that the whole answer for v2, or is there a sharper interim?
- **Bounded pre-authorization** (P4: "admit up to N records of kinds K under path P before expiry" — the AP2 open-mandate / macaroon analog). Does an attenuable, expiring, offline-verifiable grant have any honest form in a permissionless-write world, or is it inherently a read-side "honor grants from these authors" convention?

**Prior art worth studying.**
- **Tahoe-LAFS** — read-cap / write-cap / verify-cap as the *entire* access model, keys in the capability string, no server-side ACL. The cleanest existing "capabilities not ACLs" filesystem; maps unusually well onto EFS's fragment-capability instinct.
- **Macaroons** (Google) and **UCAN** (Fission/IPFS ecosystem) — attenuable, delegable, offline-verifiable bearer credentials with caveats; the modern "delegation without a central authority" designs. UCAN in particular is *the* decentralized-web answer to exactly EFS's P4 gap and is worth a hard read.
- **Plan 9** factotum/secstore and the `9P` permission model — for contrast: what a genuinely networked FS did for auth when it couldn't assume a shared kernel.

---

## 2. Multi-writer collaboration (where the single-author model strains most)

This is the cluster the scope doc flags hardest ("where the single-author model may strain… CRDTs were dismissed early; the shared-folder story needs a real check"). Give it the most adversarial depth.

**What tag-core enables cheaply.** Two collaboration shapes are *native*:
1. **Accumulation** (many authors, additive, no conflict): a comment thread, a like set, a tag cloud, a citation graph. Each author's TAG (cardinality-N) into a shared container just coexists; the container-scoped **discovery index** enumerates them all; the reader's lens grades each. Wikis-as-append, social feeds, collaborative bibliographies — all fall out cleanly. [settled — this is what the 10-app grounding mostly exercised]
2. **Curation** (many candidate versions, one wins per reader): five people each PIN their version of `/wiki/pizza.md`; each reader sees the first author their lens trusts who wrote one. No merge, no lock — *reconciliation is deferred to read time and personalized.* [settled]

**Where it strains — and this is the real frontier.** The case that has *no clean story* is **convergent shared mutable state**: one logical document that five editors are supposed to co-own, where the *intended* semantics is "everyone sees everyone's latest merged edits," not "everyone sees their most-trusted author's version." Concretely: a shared design doc, a jointly-maintained config file, a Google-Docs-style surface. Here the per-author-slot model fights the user's mental model:
- There is no single "current text." There are five authors' latest PINs. A reader picks one via lens; the other four's edits are *invisible*, not *merged*.
- If you try to make one shared slot, you can't — slots are author-keyed by construction, and that's load-bearing for the whole convergence/replication story.
- **CRDTs were dismissed early.** [reasoned, not re-tested] The dismissal deserves a real adversarial look *in this pass specifically*, because this is exactly the cluster where CRDTs are the industry answer. The honest tension: CRDT merge produces a *derived* state that no single author signed — which fights "author = recovered signer" (who authored the merge?). But CRDT *operations* are individually author-signed; the merge is a deterministic read-time function over the op-set, much like slot resolution already is. **Is CRDT-merge-at-read-time a lens-resolution variant EFS could bless as a convention (op-log = per-author TAGs, merge = a read-time fold), or does it genuinely break something?** This is possibly the single highest-value question in the pass. [open]
- Even without CRDTs: what is the **blessed pattern** for "collaborative document"? Options to weigh: (a) *single-writer-of-record + suggestions* — one author owns the canonical PIN, others write suggestion-TAGs the owner merges by re-PINning (git-maintainer model); (b) *last-writer-wins over a shared curated lens* — the container's lens admits all editors, `(order, recordDigest)` picks the latest, edits clobber (Dropbox-conflict-copy model); (c) *fork-per-author + explicit merge* (git model, merge is a human act producing a new signed DATA); (d) *operational log + CRDT fold* (above). Each has a different honesty profile and a different failure mode. The pass could map these to app archetypes rather than pick one. [open]

**The order/claimedAt/admittedAt angle** (fresh, 2026-07-08 — verify it's current). Collaboration ordering is exactly where the new time model bites. "Whose edit is newer" across authors is **not** answerable from author-claimed `order` or `claimedAt` (both untrusted, back-datable) — a collaborator can back-date to win a slot. The only trustworthy cross-author ordering is **admission order** (the discovery index, venue-labeled) or **admittedAt** (P1, if it lands in the read ABI). So any multi-writer merge rule that depends on "latest wins" must define *latest* as admission-time, not claimed-time, or it's gameable. **A blessed collaboration pattern is downstream of the P1 admittedAt decision** — flag that dependency early (it's freeze-sensitive).

**Prior art worth studying (the scope doc's own list, annotated for *what to steal from each*).**
- **git** — the reference design for "many writers, content-addressed immutable objects, one mutable ref, merge is explicit and produces a new signed object." EFS's DATA-objects + PIN-refs are structurally git. The question git answers that EFS hasn't: *what is the merge operation, and who signs the result?*
- **Datomic** — immutable facts, time as a first-class axis, "the database is a value," readers see a consistent snapshot as-of a `t`. EFS's supersession + checkpoints are Datomic-shaped. Steal: the *as-of* read and the accretion-only write model as a collaboration substrate (no one overwrites; everyone appends facts; conflicts are queries not crashes).
- **RDF named graphs / triplestores** — every triple has a *speaker*; "the graph" is a union of per-speaker assertions; provenance and trust are named-graph operations. This is *almost exactly* EFS's per-author-slot + lens model at the data-model level. Steal: the vocabulary for talking about multi-speaker truth (this is how the graph-DB literature already frames what EFS calls lenses).
- **Automerge / Yjs (CRDTs)** — the thing that was dismissed; re-read with the specific question "can the op-log be per-author signed TAGs and the merge be a read-time fold?"
- **dat / hypercore** — single-writer append-only logs, multi-reader, with `hyperbee`/`autobase` layering multi-writer on top of single-writer logs. This is *structurally very close to EFS* (per-author append-only signed log = the author's claim stream). **Autobase's approach to multi-writer-over-single-writer-logs is probably the closest existing prior art to what EFS needs and is under-studied.** Strong recommend.
- **Perkeep** (formerly Camlistore) — content-addressed personal-data store, permanodes (mutable handles over immutable blobs via signed claims), claim-based mutation. **Perkeep's "permanode + signed claims" is nearly isomorphic to EFS's DATA + PIN/TAG** — it independently invented the same shape for the same reasons. If any single system's design docs should be read cover-to-cover, it's Perkeep's.
- **Fossil/Venti** — snapshotting FS over a content-addressed append-only block store; the archival-permanence half of EFS's story with a different mutability layer.
- **Tahoe-LAFS** — for the collaboration-under-encryption case (Pass 2 overlap): mutable files via signed capabilities, multi-reader.

---

## 3. Versioning / history / snapshots / undo / time-travel

**What tag-core enables cheaply.** History is *inherent* — nothing is ever destroyed. [settled]
- **Per-slot version chain:** supersession keeps `supersessionCount + priorClaimId` per slot (O(1) words in `getSlot`), and superseded claims stay reachable by `getClaim` (SUPERSEDED disposition, never silently absent). `supersededBy` reserved key (dual-role PIN/TAG) expresses many-to-one supersession. "Show history / restore v3" = walk the chain, re-ASSERT the old body. **Undo is re-assert-the-prior-claim** — clean and native.
- **`relatedVersion`** (TAG) for non-linear version relationships; **citation-form links** pin an exact claimId (reproducible, git-commit-like) vs path-form (mutable, git-branch-like) — §1.2.
- **Snapshots / as-of reads:** **checkpoints** (reserved key, `throughSeq + stateRoot`) are a native "the author's whole state as of seq N" — a Datomic-style as-of axis. A checkpoint is an ordinary signed claim, zero kernel machinery (P7, pending James ratification).

**Where it strains.** [open]
- **Cross-object / directory-level snapshots.** Per-slot history is easy; "**snapshot the entire `/projects` tree as it was on Tuesday**" (ZFS/btrfs snapshot, Time Machine) is not a primitive. A checkpoint covers *one author's* state, not a *subtree across many authors* under a reader's lens. Is a directory-snapshot just "resolve every path under the tree as-of each author's checkpoint N"? That's coherent but potentially expensive and lens-relative (your snapshot ≠ my snapshot of the same tree). **What does "restore the folder to Tuesday" even mean when the folder is a lens-reconciled union of many authors?** Sharp and unresolved.
- **Global time-travel.** "Show me everything as of last Tuesday" wants a trustworthy global clock EFS deliberately doesn't have. As-of is per-author (`order`/checkpoint) or per-chain (admittedAt); there is no portable global `t`. Datomic gets a global `t` for free (single writer); EFS cannot. The honest primitive is **per-author as-of, unioned under a lens** — worth stating plainly so apps don't promise Time Machine.
- **Undo across a batch.** One signature covers many actions sharing one `order`. Undoing *one* action within a batch is fine (revoke that claim). But "undo my last *operation*" when the operation was a 200-record batch — is that 200 revokes, or is there a batch-scoped undo convention? [open]
- **Storage cost of infinite history.** Never-destroy means the version chain and the enumeration spine grow forever (~22–27k gas/record). This is a *feature* (100-year archive) and a *cost*. No pruning primitive exists by design. Is there any tension with quota/sustainability (§7) worth surfacing? [reasoned]

**Prior art worth studying.**
- **Datomic** — the gold standard for "history is inherent, time is a query axis, as-of/since/history filters." EFS's supersession + checkpoints reinvent a slice of this; read Datomic's `db.asOf`, `db.since`, `db.history` API design for the *read-side vocabulary* of time-travel done right.
- **ZFS / btrfs snapshots + COW** — for the *directory-tree-snapshot* semantics EFS lacks: how copy-on-write makes a whole-subtree snapshot O(1). The contrast is instructive precisely because EFS *can't* do the O(1) shared-root trick (no shared mutable root).
- **git reflog** — the model for "undo is just moving a ref back to a prior immutable object"; EFS's re-assert-prior-claim is the reflog move.
- **Fossil/Venti, Plan 9's history** — snapshot-of-the-whole-namespace as a first-class archival operation.

---

## 4. Move / rename at scale + symlinks / hardlinks / mount

**What tag-core enables cheaply.**
- **Rename / move** = **`movedTo`** (PIN, auto-follow, §4.3) over immutable tagIds. The old path node persists (path permanence — links never structurally 404); a resolver auto-follows `movedTo` to the new location, rendering a provenance breadcrumb. Rename never rewrites children. [settled, but walk it end-to-end]
- **Symlink** = **`symlink`** reserved key (PIN, auto-follow, counts against `MAX_AUTO_FOLLOWS = 8`, cycle-detected). A pure alias. [settled]
- **`sameAs`** (TAG, never auto-followed) = a weaker "these denote the same thing" edge — closer to `owl:sameAs` than to a symlink; render-only.

**Where it strains.** [open — the scope doc explicitly says "walk it end-to-end"]
- **Move-a-folder-with-10k-children.** Because `tagId = keccak(…, parentTagId, …)`, a child's id is *derived from its parent's id.* So a folder's children's tagIds are structurally bound to the old parent. Moving the folder can't re-derive 10k child ids (they're immutable and permanent). So a "move" is really: mint a `movedTo` PIN at the folder node, and **every child path continues to resolve under the old parent, reachable via the parent's redirect.** Questions: Does deep-path resolution correctly compose *multiple* `movedTo` redirects along a path (move A→B, then B→C)? Does it stay within `MAX_AUTO_FOLLOWS=8` for deep trees? What's the cost/UX of a path that's been moved 9 times? Is there a **path-compaction** convention (re-publish canonical placements at the new location)? [open]
- **Link integrity under move.** Old citation-form links (`~claim:`) pin exact claims and are unaffected (good). Old path-form links follow `movedTo` (good, until budget exhaustion). But a link *into the middle* of a moved subtree — does it follow? The redirect is at the folder node; a deep link resolves the deep path, which walks *up* to the moved parent... does the walk see the redirect? Trace this concretely. [open]
- **Hardlinks.** POSIX hardlinks = two names, one inode, *symmetric* (no primary), file persists until last link removed. EFS has no symmetric multi-name primitive and no refcount-GC (objects are permanent — a "file" never gets collected). The honest mapping: **there are no hardlinks; there is one DATA object and any number of PINs pointing at it from different path slots.** That's *better than hardlinks* in one way (arbitrarily many names, all first-class) and different in another (no "last link deleted frees the file" — nothing is ever freed). Worth stating: **hardlinks are subsumed by "many PINs → one DATA," and refcount-GC is deliberately absent.** Does any app actually need hardlink *semantics* (the refcount) rather than hardlink *effect* (multiple names)? [reasoned]
- **Mount / namespace grafting** (see also §9). `symlink`/`movedTo` are within-namespace. Grafting *another author's subtree* into your namespace (Plan 9 union mounts, `mount --bind`) is a different operation — is it a symlink to another ADDRESS container's path? A lens-level "include this author's tree at this mount point"? [open]

**Prior art worth studying.**
- **Plan 9** — the deepest thinking on move/mount/namespace ever done. Per-process namespaces, union directories, `bind`. EFS's "graft another container's subtree" question is Plan 9's home turf.
- **git** rename detection — git *doesn't store renames*; it infers them from content similarity across immutable blobs. A provocative contrast: EFS *does* store the rename (`movedTo`) explicitly. Is explicit-rename right, or should some renames be *inferred* from DATA-content identity (same dataId under a new path = a move, for free)?
- **inode vs dentry** (POSIX) — the name/object split is exactly EFS's PIN(name)/DATA(object) split; hardlinks are the canonical illustration of "names are not the object." Good for precision when explaining why EFS has no hardlinks.

---

## 5. Trash / soft-delete / deletion — and the permanence tension

**What tag-core enables cheaply.**
- **Soft-delete is the native and only delete.** [settled] "Delete a file" = **REVOKE the placement PIN.** The slot reads EMPTY (empty-on-revoke, P2); the DATA object and its bytes persist (permanent); the author can re-ASSERT to "undelete." This is *exactly* trash/soft-delete semantics, for free, with infinite undo.
- **Trash-as-a-view:** revoked-but-recoverable placements are enumerable (SUPERSEDED/REVOKED dispositions reachable via history views). A "Trash folder" is a UI over the author's revoked placements. [reasoned]

**Where it strains — and this is partly out-of-scope-but-must-be-named.** [open / policy]
- **Hard delete does not exist and cannot.** Bytes on-chain are permanent; the graph shape is permanent; revocation hides but never destroys. For a permanent archive this is *the point* — but it collides head-on with:
  - **Right-to-erasure / GDPR / illegal content.** The scope doc explicitly defers "deletion / illegal content / operator liability" to a policy pass, but the FS-features pass will keep bumping into it: users *expect* delete to mean *gone*. The honest FS-feature answer is "delete = revoke = hidden-not-gone; true erasure is impossible by construction," and that needs to be *said*, prominently, as a known-tradeoff (the P13c "what this design gives up" instinct). **The WHITEOUT reserved slot** (freeze-gates §C additive-later) is the nearest thing to a "tombstone that asks everyone to stop serving this" — worth surfacing what it can and can't promise. [open]
  - **Encryption-as-deletion** (crypto-shredding): if the payload is encrypted and you destroy the key, the bytes are permanent but inert. This is the *only* honest "make it truly gone" primitive on a permanent chain — and it's a Pass 2 (privacy) dependency. Flag the cross-pass link: **real deletion is a privacy-tier feature, not an FS-tier feature.** [reasoned]
- **Whose trash?** Because delete is per-author revocation, "deleting" a file only empties *your* slot. If three authors PINned the same DATA into a shared container and one revokes, the file is still there under the other two. "Delete for everyone" is not expressible (and shouldn't be — it'd be a write-gate over others). The moderation analog is **deny-advisories** (§3.4): a trusted moderator publishes a deny-TAG, and subscribing readers subtract it. **Community "removal" is deny-shaped (subtractive, per-reader), never destruction.** [settled mechanism, novel framing]

**Prior art worth studying.**
- **Crypto-shredding / Boojum** (the classic "delete by destroying keys" pattern) — the only deletion story that survives permanence.
- **Bluesky labelers / RustSec / OSV / npm audit** — deny-shaped moderation done at ecosystem scale; the read-lens-spec §3.4 already models EFS's deny-composition on these. For the *deletion-as-moderation* framing, they're the reference.
- **IPFS pinning / unpinning** — the "you can unpin locally but can't force others to forget" reality; EFS's revocation is the signed, portable version of the same limit.

---

## 6. Quotas / accounting / resource limits

**What tag-core enables cheaply.** **Gas is the quota.** [settled — falls out of permissionless-writes + everyone-pays-their-own-writes] Every write costs the writer gas; there is no shared pool to exhaust, no per-user allocation to enforce, no quota daemon. Spam is "absorbed at the writer's gas" (the discovery-index doctrine); poisoning is contained to one container. This is a genuinely elegant answer to a whole class of FS quota machinery: **it doesn't exist because the economic layer already meters it.**

**Where it strains.** [open, mostly mild]
- **List cardinality caps** are *not* enforced at write time (that would break replication-convergence): `maxEntries` is a **read-time filter** (envelope amendment 1). So a LIST's "quota" is advisory-on-read, not enforced-on-write — beyond-cap entries admit normally and are labeled `beyond-charter-cap`. Is there any app that *needs* a hard write-time cap and is hurt by read-time-only? (The grounding said no; the re-check trigger would be a scarcity-semantics app — e.g. "only 100 of these NFTs.") [reasoned]
- **Accounting/reporting** ("how much storage does Alice use," "how many files under `/projects`") is an *enumeration/indexer* question, not a kernel quota. The container-scoped discovery index gives bounded per-container counts; whole-subtree accounting is a The-Graph/off-chain job. Consistent with "EFS doesn't ship a query language." [settled boundary]
- **The sustainability tension** (deferred to policy): no-token means volunteer mirrors keep bytes alive; "quota" in the sense of *who pays to keep 100-year bytes available* is unanswered and named as out-of-scope. Worth a one-line acknowledgment that FS-features-quota (write metering, solved by gas) is a *different question* from archive-sustainability-quota (unsolved, policy pass). [settled deferral]

**Prior art worth studying.** Mostly a place where FS prior art *doesn't* transfer (quota daemons assume a controlled pool). The interesting contrast is **Filecoin / Arweave** endowment models (pay-once-store-forever economics) vs EFS's pay-your-own-write + volunteer-mirror model — for the sustainability side, not the write-metering side.

---

## 7. Locking / concurrency control / transactions / atomicity

**What tag-core enables cheaply.**
- **Atomic multi-record writes are native.** [settled — highest-confidence thing in the design] One signature over a Merkle root commits an arbitrarily large batch atomically (single revert scope). "Create a folder tree + place 50 files + tag them" is one atomic act. This is *stronger* than most filesystems' atomicity (POSIX has no multi-file atomic op).
- **No write-write conflicts to lock against.** Separate author slots mean two authors never race for the same cell. Optimistic-concurrency-by-construction.

**Where it strains.** [open]
- **Locks have no referent — and that's mostly fine, but not entirely.** POSIX advisory locks / `flock` coordinate writers around a shared cell; EFS has no shared cell. But some *app-level* invariants still want mutual exclusion — e.g. "only one CI job should publish `latest` at a time." Since anyone can write, the honest answer is: **you can't prevent the concurrent write; you reconcile it at read time** (LWW by `(order, recordDigest)` / admission order). Is there any app whose correctness *requires* write-time exclusion and cannot be expressed as read-time reconciliation? (Marketplace/auction/"claim this unique name first" smells like it — and note TAGDEFs are first-derived-wins Schelling, DATA is owned-unsquattable, so *some* uniqueness is native.) [open]
- **Cross-author transactions.** The atomic batch is *single-author* (one signature). "Alice and Bob both must sign or neither's write lands" (a 2-party atomic swap of edges) is **not** expressible in one envelope — two signatures, two envelopes, no atomicity across them. Multi-sig / co-signed envelopes are not in the format (the KEL reservation might eventually allow multi-key identities, but that's succession, not co-authorship). **Is cross-author atomicity a real FS need or a DB/smart-contract need that EFS correctly punts to the chain layer?** [open]
- **Read-your-writes / consistency across replicas.** Within one chain, admitted = visible. Across replicas, a copy may lag; a reader sees the venue's admitted set. This is the UNKNOWN-CURRENCY / checkpoint machinery, not a locking question — but apps used to POSIX consistency will trip on "my write isn't visible on that replica yet." Worth a consistency-model statement (EFS is per-venue-consistent, eventually-replicated, never globally-linearizable). [reasoned]

**Prior art worth studying.**
- **git** again — no locks, optimistic, conflicts surfaced at merge. The whole "distributed VCS never locks" design is EFS's concurrency model.
- **Datomic** — single writer (transactor) gives serializable transactions *for free*; the contrast shows what EFS gives up (global serializability) to gain permissionless multi-writer. Instructive on the exact tradeoff.
- **Google Docs / OT / CRDTs** — the "many concurrent writers, never lock, merge live" end of the spectrum (see §2).
- **AFS / NFS byte-range locks** — the POSIX networked-lock machinery, for the record of what EFS *isn't* doing and why that's mostly a relief.

---

## 8. Multi-tag selection & the graph-query boundary

**The scope doc wants a clear line drawn here:** *"multi-tag AND-selection works up to here on-chain/indexer; richer search is a The Graph feature."* James wants multi-tag select (tag A AND tag B AND tag C) if it's cheap.

**What tag-core enables cheaply.** [settled boundary, some open cost questions]
- **Single-tag selection is native and bounded:** the **container-scoped discovery index** (per-tagId, paginated, `discover(tagId, cursor, limit≤256)`) enumerates all authors' claims into one container/tag. "All files tagged X" = enumerate tagId X's index. Each result is DISCOVERY-flagged and must be lens-graded. [settled — pending James's cost sign-off on the index]
- **The index is per-tagId**, so it's a set of postings lists — which is *exactly* the substrate an AND-query wants.

**Where it strains — the actual open question James flagged.** [open — this is a design deliverable]
- **AND across tags** = intersect N postings lists. Off-chain / in an indexer / The Graph, this is trivial and clearly the intended home for anything rich. On-chain, a view contract *could* intersect two bounded discovery-index pages, but: cost grows with list sizes; the result is venue-relative and DISCOVERY-graded (never authoritative); and it's an enumeration, which the doctrine keeps firmly out of consensus/slot-resolution. **The honest line to draw:** likely *"bounded 2–3-tag AND over small containers is a view-contract convenience; anything unbounded, ranked, or NOT/OR is an off-chain/The-Graph job."* The pass should pin exactly where the boundary sits with a cost model, not build a query engine. [open — cost-driven]
- **NOT / OR / range / full-text** — explicitly off-chain. EFS ships clean subgraph-indexability (log-only-sync, bodies-in-state), *not* a query language. [settled — this is a ruled non-goal]
- **The subgraph-indexability proof obligation.** The pass's real job here (per the scope doc) is to **confirm every FS operation stays cleanly subgraph-indexable** — that the event set for placement/move/tag/revoke/supersede is log-derivable so The Graph can index it without special-casing. This is a *verification* task more than a design task: walk each FS operation and confirm its events. [reasoned — should be provable]

**Prior art worth studying.**
- **The Graph** (subgraph mappings) — the intended off-chain home; confirm EFS's events map cleanly. This is the target, and "works great when devs use The Graph" should already be true.
- **Tantivy / Lucene inverted indexes** — postings-list intersection is the classic AND-query mechanism; the discovery index *is* a postings list, so the literature on cheap intersection (skip lists, roaring bitmaps) is directly relevant to any bounded on-chain AND.
- **Datomic Datalog / SPARQL** — what "real" graph query looks like (recursive joins, traversal, aggregation); useful as the *explicit non-goal boundary marker* — "EFS provides the indexable substrate; this is what lives above it, off-chain."
- **Tag filesystems: TagFS, Tagsistant, Gmail labels, Google Drive** — the UX prior art for "files have many tags, select by combination"; worth studying for what users *expect* multi-tag select to do (saved searches, virtual folders) even if the engine is off-chain.

---

## 9. Naming / mounting / federation across containers

(Partial overlap with Pass 3 naming/hyperlinks — but the *structural* FS side belongs here.)

**What tag-core enables cheaply.**
- **Every author has a namespace root** (their ADDRESS container); paths are `web3://host/<addr>/<path>` resolved under the reader's lens. TAGDEF hierarchy is the directory tree. [settled — see read-lens-spec §6]
- **The container classifier** (ADDRESS / TAGDEF / DATA / LIST / PROPERTY / CLAIM / name, §6) is the post-EAS "what does this 64-hex word denote" resolver, with an explicit-prefix escape hatch (`~data:`, `~claim:`, `~name:`…). [settled]

**Where it strains.** [open]
- **Cross-container mounting / federation.** Grafting author B's subtree into author A's namespace (so `A/shared/` shows B's `/projects/`) — is this a `symlink` PIN across containers? A lens-include? A first-class "mount" reserved key? Plan-9-style union mounts (overlay several authors' trees at one point, first-hit wins) map *beautifully* onto first-attester-wins lenses — arguably EFS's lens *is* a union mount over authors. **Is "mount" just "lens," or is there a distinct spatial-grafting primitive?** Possibly the most elegant unification available in this pass. [open — worth chasing]
- **Federation across chains/replicas.** A path that spans venues (part of my tree lives on chain X, part on chain Y) — how does resolution compose across venues, and how does currency grade (UNKNOWN-CURRENCY on the foreign part)? Replication gives *snapshots*, not live federation (settled limit), so "federated namespace across live chains" is bounded by the no-cross-chain-currency ruling. [settled limit, open UX]
- **Global naming / discovery.** "Find *the* `/pizza` folder" has no answer — there's no global root, only per-author roots reconciled by lens (`"You never see 'the' /readme; you see the /readme of the first author you trust who wrote one."`). ENS/human-names are the Pass-3 bridge. Worth noting the FS-structural fact: **EFS has no single namespace; it has as many namespaces as there are lenses.** That's a federation feature, not a bug — but it reframes "mount" and "discovery" entirely. [settled framing]

**Prior art worth studying.**
- **Plan 9 per-process namespaces + union mounts** — *the* prior art; first-hit-wins union directories are lens resolution avant la lettre. If Fable reads one thing for this cluster, this.
- **ENS / DNS / Handle System / IPNS** — human-name → machine-id bridges (Pass 3, but the structural hooks are here).
- **Union/overlay filesystems (OverlayFS, unionfs, Docker layers)** — layered namespaces with lower/upper/whiteout; the WHITEOUT reserved slot is literally borrowed from here. How overlay FS handles deletion-in-a-lower-layer (whiteouts) is directly relevant to EFS's deny/revoke-across-authors problem.
- **AFS / DFS global namespace** — the "one global `/afs` tree federated across cells" model, for contrast with EFS's deliberately-per-lens namespace.

---

## 10. Graph-DB-native features (the half the "filesystem" framing under-serves)

EFS is a *file system **and graph database***. The FS clusters above are well-trodden; the graph-DB feature space is less exercised against tag-core and is where under-explored value may hide. Go wide here.

**What tag-core enables cheaply.**
- **Edges are first-class, typed, weighted, directional, author-attributed.** TAG (cardinality-N, weighted) and PIN (cardinality-1) with REF (→ another object) or VAL (→ a value) layout. Reserved-key edges (`sameAs`, `relatedVersion`, `mirrors`, `supersededBy`…) are typed relations. This is a **property-graph** substrate with signed, revocable, per-speaker edges. [settled]
- **Reification is native.** In RDF, "who said this edge, when, with what confidence" requires painful reification. In EFS, *every edge is already a signed claim with an author, an order, an expiry, a weight* — reification is the default, not an add-on. **This is a genuine strength worth foregrounding: EFS is a natively-reified, natively-provenanced property graph.** [reasoned — underappreciated]
- **Provenance / trust-scoped subgraphs** = lenses. RDF named-graphs-per-speaker + trust policies = EFS lens resolution. [settled]

**Where it strains / open graph-DB questions.** [open — lots of white space]
- **Traversal / path queries.** Graph DBs do multi-hop traversal (friends-of-friends, ancestor-of, shortest-path). EFS does *bounded* walks (parent-walk for containment, `MAX_AUTO_FOLLOWS=8` for symlink/move chains). Anything deeper is off-chain (consistent with no-query-language). But **is there a cheap on-chain bounded-traversal primitive worth blessing** (e.g. "is X transitively under /pizza" — the parent-walk already does one axis), or is *all* traversal an indexer job? Where's the line, and does it mirror the §8 multi-tag line? [open]
- **Aggregation** (count, sum, group-by over edges) — the discovery index gives bounded counts; everything richer is off-chain. Consistent. But note: **counts are never GATE-consumable** (indexer artifacts) — an important honesty constraint graph-DB apps will trip on ("N likes" is never a trustable on-chain number). [settled constraint, under-advertised]
- **Reactive queries / subscriptions / watch (inotify).** Graph DBs and filesystems both offer "notify me when this changes" (inotify, Datomic's tx-report queue, Neo4j triggers, RDF stream reasoning). EFS has **no push** — it's a pull/poll world (read the chain, diff). Is there a blessed subscription pattern (poll `authorHead`/discovery-index deltas, subgraph subscriptions via The Graph, admittedAt-ordered event streams)? Clients will *all* need "did anything under this path change" — worth a blessed pattern even if the mechanism is off-chain polling. [open — every real app needs it]
- **Schema / ontology / constraints.** Graph DBs have schema (Neo4j constraints, SHACL/ShEx for RDF, Datomic's schema-as-data). EFS has almost none by design — string-only values, permissionless edges, no type enforcement beyond the closed targetKind enumeration and reserved-key rows. Is that a feature (credibly-neutral, no gatekeeper defines valid shapes) or a gap (apps want validation)? The honest position is probably **"schema is a read-side/app-side lens concern, never kernel-enforced"** — but say it, because DB people will look for `CREATE CONSTRAINT`. LIST charters (appendOnly, targetKind) are the *only* write-time-enforceable constraint — the exception that proves the rule. [open framing]
- **Secondary indexes.** Classic DB feature; EFS's discovery index *is* the one blessed secondary index (per-tagId). Everything else is off-chain/The-Graph. Confirm that's the whole story. [reasoned]
- **Backlinks / inverse edges.** "What links *to* this object?" is a core graph-DB/wiki feature (Roam, Obsidian backlinks). Forward edges are cheap (you author them from your slot); *backlinks* require enumerating all authors' edges targeting an object — an index/discovery job. The discovery index is keyed by `definitionId == tagId` (the container/tag), so backlinks-into-a-container work; backlinks-into-an-arbitrary-DATA-object (who mirrored/cited this file) need the target to be an index key too. **Is target-keyed backlink enumeration in the discovery index, or off-chain?** Bibliographies, "cited by," "who embedded this image" all ride on this. [open — high-value, check the index's key shape]

**Prior art worth studying.**
- **RDF / SPARQL / named graphs / SHACL** — the whole "assertions by speakers, provenance, trust, reification, ontology" stack; EFS is a signed-reified property-graph and should be read against RDF's 25 years of exactly this. Named graphs ≈ lenses; SHACL ≈ the schema-as-lens question; reification ≈ what EFS gets for free.
- **Datomic** — facts as `[entity attribute value tx op]` 5-tuples with time; EFS's claims are strikingly close (`author, key, value, order, assert/revoke`). Datalog for traversal; the tx as a reification handle. Probably the single most convergent design in the DB world.
- **Neo4j / property graphs** — the mainstream property-graph model (typed weighted edges, indexes, constraints, traversal); good for the *expectations* graph-DB devs bring and the traversal/aggregation boundary.
- **TerminusDB / Dolt** — *version-controlled* graph/SQL databases (git-for-data); the collaboration + history + graph combination EFS is reaching for, already attempted. TerminusDB's delta-encoding + provenance and Dolt's cell-level history are directly relevant.
- **Roam / Obsidian / logseq** — backlinks and bidirectional-link UX; the user-facing side of the backlink question.
- **Solid (Inrupt / Berners-Lee)** — personal-data-pods + per-resource ACLs + RDF; the closest "decentralized personal graph with access control" system philosophically, and a useful contrast (Solid uses server-side WAC ACLs where EFS uses read-side lenses — the exact access-control fork from §1).

---

## 11. The long tail: real-FS features tag-core hasn't been tested against

A grab-bag of things every mature FS or DB has, that none of the design rounds explicitly checked. Most probably resolve to "native," "subsumed," or "explicitly out" — but the *value is in confirming each has a coherent story or is deliberately gone*, so app developers hit a stated answer, not a silent gap. [mostly open, low-to-medium each — a checklist to run, not a conclusion]

- **Extended attributes / metadata (xattrs, resource forks, alternate data streams).** → Native and better: VAL-layout reserved-key edges (`contentType`, `lang`/`dir` if minted, `size`, `contentHash`) *are* xattrs, per-author and signed. Confirm the reserved-key table covers the xattrs apps expect; `lang`/`dir` is a live P2 candidate. The macOS resource-fork / NTFS alternate-data-stream pattern (multiple named byte-streams per file) maps to multiple mirrors/DATA under one node. [reasoned]
- **Watch / notify / inotify** → see §10 (no push; blessed poll pattern needed). Flagged as high-value.
- **Content-addressed storage / dedup** → Native: DATA identity is *not* content-derived (ADR-0049 — identity is the DATA record, not the bytes), but bytes are content-verified against `chunksRoot`/CID. Two identical files are two DATA objects (owned, distinct) that may share mirror bytes. **Dedup at the byte layer is possible (same CID), dedup at the identity layer is deliberately absent** (owned identity ≠ content hash). Worth stating — CAS people will assume content = identity and be surprised. [settled, under-explained]
- **Sparse files / holes** → No native concept; probably N/A (files are mirror-pointers + optional on-chain chunks). Confirm out. [reasoned]
- **Compression / encoding** → `contentEncoding` reserved-key territory; largely a mirror/transport concern. [reasoned]
- **Encryption at rest** → Pass 2. `contentEncryption`/`keyWrap` reserved keys already reserved. Cross-pass link. [settled deferral]
- **Copy-on-write / reflink** → No shared-mutable-root means the ZFS/btrfs COW trick doesn't apply; "copy" is a new DATA + PINs (cheap — pointer copy) or a `sameAs` edge. Directory-tree COW-snapshot is the §3 open question. [reasoned]
- **Journaling / crash-consistency / fsck** → The chain *is* the journal; admission is the commit; there's no partial-write-corruption (atomic batch or nothing). "fsck" as integrity-check = re-verify signatures + chunksRoots (the dead-chain fire drill). No repair needed because nothing corrupts — but *availability* fsck (are my mirrors alive?) is a real, different check. [reasoned]
- **Case sensitivity / Unicode normalization / reserved names** → Partly settled: canonical-name **NFC** profile enforcement is in the kernel (codex-kinds amendment / attack-envelope C4). Confirm the full profile (case-folding? forbidden characters? length limits? reserved segment names like `.`/`..`/`~`-prefixes?) — the `~` sigil and `~name:` escape already interact with segment grammar (read-lens-spec §6.3). Path-segment grammar is freeze-sensitive (it's in the tagId derivation). [open — check completeness]
- **Path length / depth limits** → Each segment is a TAGDEF (gas per segment); no hard limit but a cost gradient. `MAX_AUTO_FOLLOWS=8` bounds redirect chains. Any depth-related DoS or cost cliff worth stating. [reasoned]
- **Streaming / partial reads / range requests / mmap** → Large-file chunking + proof-streaming exists (EFSBytes, resumable-by-anyone); range-reads over chunks are a transport concern. Confirm the streaming-read story for a 4 GB on-chain file is coherent. [reasoned]
- **Special files (devices, FIFOs, sockets)** → N/A (no live I/O); explicitly out. [reasoned]
- **Directory listing semantics / pagination / ordering** → Discovery index (paginated, admission-ordered, ≤256/page). Ordering is venue-local admission order, *not* a global truth. Confirm listing UX (sort? filter? the multi-claimant marker §4.4) is coherent for a busy shared folder. [reasoned]
- **Timestamps (atime/mtime/ctime/birthtime)** → The whole `order`/`claimedAt`/`admittedAt` model (2026-07-08) *is* the timestamp story, and it's subtler than POSIX: **mtime is untrusted (author-claimed), ctime is trustworthy-but-per-chain (admittedAt), atime doesn't exist (reads leave no trace — a privacy feature).** This is freeze-sensitive and the collaboration-ordering dependency (§2). Worth a clean "EFS timestamps ≠ POSIX timestamps" statement — it's a top P13 footgun. [settled model, needs FS-framing]
- **Free space / statfs** → No global free space (permissionless pool); "space" = gas. §6. [settled]

**Prior art for the long tail.** POSIX itself (as the spec of expectations to consciously accept-or-reject), **ZFS/btrfs** (the modern FS feature ceiling — snapshots, COW, checksums, send/receive), **NTFS/APFS** (xattrs, streams, clones — the desktop feature set users expect), and **9P/Plan 9** (the minimal-elegant FS that consciously *dropped* most of the long tail — a model for "declare it gone" done well).

---

## 12. Cross-cutting: the freeze-sensitive reserved slots this pass should surface early

Per the scope doc's cross-cutting rule, deep design is staged but **freeze-sensitive reserved slots from every pass must converge before the ceremony.** Filesystem features touch the frozen surface in these places — flag them early against [[freeze-gates]] §C even if the full design comes later. [reasoned — a starter list for Fable to extend or prune]

- **Reserved-key rows** the FS clusters imply, to decide row-vs-convention-vs-reject *now*: a **mount / graft** relation (§9); a **backlink/target-index** key or an index-key-shape decision (§10); **`lang`/`dir`** (already a P2 candidate; §11 xattrs); anything the collaboration pattern (§2) needs as a uniform lens-legible shape (suggestion-edge? merge-parent?); a **lock/lease** convention word *if* write-time coordination is ruled in (§7 — probably not, but decide). Every row not minted should be an explicit "convention, not row" ruling, not silence.
- **The time fields** (`order` rename, optional `claimedAt`, and P1's `admittedAt` in the read ABI) are envelope/read-ABI surface and are load-bearing for collaboration ordering (§2), versioning as-of (§3), and the timestamp story (§11). **The blessed multi-writer pattern is downstream of the `admittedAt` decision** — surface that dependency so P1 doesn't get decided without the FS-collaboration input.
- **Path-segment grammar** (NFC profile, reserved names, `~` sigil interaction, 64-hex-name escaping) is in the tagId derivation = Etched (§11 case/normalization). Confirm completeness before the derivation freezes.
- **WHITEOUT** (already additive-reserved) is the nearest thing to cross-author "removal/tombstone" (§5, §9 overlay-FS) — the FS pass may want to pin what it should promise before it's specced.
- **The `successor`/`act`/delegation slots** (P4, reserved-not-active) gate the write-sharing/delegation cluster (§1) — the FS pass should state what delegated-authorship *needs* from these so the reservation shape is right, even though the machinery is post-freeze.

---

## 13. A short list of the sharpest questions, if you read nothing else

Not a ranking of importance — a ranking of *where the good questions are densest.* Everything here is [open].

1. **Is the whole "access control" cluster mis-framed?** Should the pass retire "write permission" and replace it with "curated-view membership + delegated authorship + deny-subtraction," loudly, so devs stop reaching for `chmod`? (§1)
2. **Can CRDT-merge be a read-time lens-resolution variant** (per-author signed op-TAGs, deterministic merge fold), dissolving the collaboration strain — or does it genuinely break "author = recovered signer"? The early dismissal deserves a real adversarial re-test *here*. (§2) — probably the highest-value single question.
3. **Is "mount" just "lens"?** Union-directory federation and first-attester-wins are suspiciously isomorphic; unifying them (or cleanly separating them) is elegant either way. (§9)
4. **What does "snapshot/restore the folder to Tuesday" mean** when the folder is a lens-reconciled union of many authors with per-author (not global) as-of? (§3)
5. **Where exactly is the multi-tag-AND and bounded-traversal on-chain/off-chain line**, with a cost model — and is it the *same* line for both? (§8, §10)
6. **Does the discovery index key on edge *targets*, enabling native backlinks** ("cited by," "who mirrored this"), or is that off-chain? A small index-shape decision with large app consequences. (§10)
7. **Trace move-a-deep-subtree end-to-end**: multi-hop `movedTo` composition, deep-link resolution through a moved parent, `MAX_AUTO_FOLLOWS` budget, path-compaction. Does it actually hold at 10k children? (§4)
8. **State the consistency/deletion/timestamp tradeoffs as first-class "what this gives up":** no hard delete (crypto-shred is a Pass-2 dependency), no global linearizability, mtime-is-untrusted. These are the P13 footguns in FS clothing. (§5, §7, §11)

---

## Appendix: the tag-core primitives this map leaned on (quick reference)

So Fable can check my framing against ground truth ([[codex-kinds]], [[codex-kernel]], [[codex-envelope]], [[read-lens-spec]], [[confidence-and-open-decisions]]):

- **5 kinds:** TAGDEF (unowned namespace: paths/folders/keys, permanent, `tagId = keccak(DOMAIN, parentTagId, keccak(name), kind)`), DATA (owned file identity, author+salt, permanent), LIST (owned collection charter, appendOnly/targetKind/maxEntries-read-filter), PIN (cardinality-1 edge), TAG (cardinality-N weighted edge). + ASSERT/REVOKE ops. Edges REF (→object) or VAL (→value ≤8192 bytes, string-only).
- **Slots** are `(author, key)`; per-slot LWW by `(order, recordDigest)`; **revoked reads EMPTY** (no resurrection); revocation is a monotone G-set, `revoker == author`.
- **Objects permanent & unrevocable; only claims/edges revocable.** Writes permissionless; everyone pays own gas.
- **Reserved keys** (~13 rows, freeze surface): `mirrors`, `name`, `contentType`, `contentHash`, `size`, `contentEncryption`, `keyWrap`, `sameAs`, `relatedVersion`, `symlink`, `movedTo`, `supersededBy`, `home`; `successor`/`checkpoint` reserved-not-active. `lang`/`dir`, persona-link, handler-binding, freshness-beacon, receipt/grant are P2 candidates.
- **Reads:** lenses (ordered trusted-author list, first-attester-wins) + deny-sets (advisory subtraction). Grades: position PRESENT/PROVEN-ABSENT/UNKNOWN (only PROVEN-ABSENT yields — anti-fallthrough); dispositions LIVE/STALE/REVOKED/SUPERSEDED/EQUIVOCAL/CONTESTED; currency HOME-LIVE/AS-OF(N)/UNKNOWN-CURRENCY.
- **Discovery index:** container-scoped per-tagId, bounded, paginated (≤256), admission-ordered, DISCOVERY-flagged, enumeration≠endorsement, counts never GATE-consumable. (Pending James cost sign-off; indexer-lane fallback specced.)
- **Time (2026-07-08):** `order` (per-batch portable ordering, untrusted-as-clock), `claimedAt` (per-action user claim, untrusted), `admittedAt` (per-chain kernel-stamped, trustworthy, P1). `expiresAt` per claim body (stale-not-dead).
- **No cross-chain currency; portability = replication (copy records+bytes, read natively), snapshot-not-feed.** Atomic multi-record single-author batch via one Merkle-root signature.
- **Container classifier / URL:** `web3://host/<addr>/<path>`; classes ADDRESS/TAGDEF/DATA/LIST/PROPERTY/CLAIM/name; `~`-prefix escapes; path-form (mutable, lens-resolved) vs citation-form (`~claim:`, pinned).

*Everything above is context to accelerate you, not scripture. The pattern this project keeps hitting: something sounds right in conversation, then falls apart under adversarial review. Assume some of my framings are in that category and hunt for which ones. Go wider than this map — it's a floor on the territory, not a ceiling.*
