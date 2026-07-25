# Red team — the filesystem lanes attacked (2026-07-25 joined pass)

**Lane:** RED TEAM for the filesystem core, local mode, and large-files lanes — 2026-07-25 joined KEL × authority × lens filesystem reconciliation pass
**Targets attacked in full:** [[filesystem-core]], [[local-mode]], [[large-files]]
**Contract checked against:** [[mountable-filesystem-semantics]] (§§3–5, 9, 12), [[fs-pass-synthesis]] (C1–C14), [[owner-rulings]] (mandatory indexing, no-collision-bit, chains-don't-die, mount requirement), [[human-overview#7. The seams that must be closed]]
**Posture:** hostile implementer + hostile data author. Every finding carries a concrete record set, a severity, and a repair. Verdict per design at the end of §Verdicts.
**Status:** reconciliation input; the file is the record — a finding only in the digest does not exist.

#status/draft #kind/review #repo/planning #topic/efsv2 #topic/filesystem #topic/red-team

---

## 0. Verdicts up front

| Design | Verdict | Why |
|---|---|---|
| [[filesystem-core]] FS-LENS/1 + one-basis invariant | **REPAIRABLE** | The false-equivocation deletion (§1.8) and the one-basis invariant (§1.6) genuinely hold *within a snapshot*. Three defects survive: the ordinary-RPC live mount cannot honestly emit `ENOENT` (AF-1); `ls -l` reproduces ghost entries on a live-follow mount (AF-2); FSP-HYBRID lets a cross-author squatter relocate a file off its plain name (AF-4). None sinks the design; each is fixable and two argue for making the snapshot profile mandatory, not merely default. |
| [[local-mode]] signed-head realm + promotion | **REPAIRABLE** | Honest about withholding (§5, §9.1) — no over-claim on detection. Two real defects: the promotion-preserves-identity claim breaks for the mainstream bare-EOA→KEL journey (AF-5); the local-realm manifest→`ENOENT` mapping (§4) directly contradicts [[filesystem-core#1.7]]'s absence rule (AF-6). One honest-crash equivocation-evidence gap (AF-7). |
| [[large-files]] generation model + tier ladder | **REPAIRABLE** | "Manifest is the generation" (§1.2) is the right fix and closes the torn-generation crack. Two defects: mirror-tier files do **not** get the advertised O(chunk) authenticated seeking (AF-8, undercuts the §4.2 corollary); the §1.4 store-creation interface delta opens a permissionless geometry-griefing vector (AF-9). Tier honesty (§2.5) is genuinely tight. |

The load-bearing sentence of the whole attack: **the three lanes are internally strong at one pinned basis and over a self-hosted node or a closed bundle, and structurally weak at the exact boundary the owner's mount requirement lives on — an ordinary user, no wallet, a hosted RPC, and a graphical file manager that issues real `stat` and `read` storms.** Every FATAL-adjacent finding lands there.

---

## 1. FATAL / SERIOUS findings

### AF-1 (SERIOUS → escalates) — The ordinary-RPC live mount cannot honestly return `ENOENT`; every honest not-found degrades to a transient error

**Where:** [[filesystem-core#1.7 PROVEN-ABSENT vs UNKNOWN]] FSP-ABSENT-1/2; conformance row `lookup` marked **defined** in [[filesystem-core#5.1 The conformance table]].

**The construction.** Dana mounts a public drive with no wallet, backed by a hosted RPC (the [[large-files#4. The read/mount journey]] cast, and the [[mountable-filesystem-semantics#Executive judgment]] "ordinary tools that know nothing about blockchains" target). Directory `/etc/` legitimately does **not** contain `foo.conf`. A build tool runs `test -e /mnt/efs/etc/foo.conf` (or a shell tab-completes, or `git` probes for `.gitignore`).

- FSP-ABSENT-1 admits exactly three grounds for `ABSENT_PROVEN`: (1) *own node / verified execution* over total current state; (2) a *verified state proof* against the venue state root covering the slot **and the index pages to positive closure**; (3) a *closure-manifest bundle*.
- FSP-ABSENT-2 explicitly rejects "a hosted RPC's bare word without the proof of source 2" and says "a strict-profile mount refuses to map it to native not-found."
- A hosted RPC is not "own node / verified execution." So on Dana's mount, the only path to `ENOENT` is per-negative-lookup state proofs to positive closure over paged child indexes — a heavy multi-page `eth_getProof`-class operation **for every not-found**, which ordinary public RPCs do not cheaply serve and no ordinary tool knows to request.
- Result: **every honest negative lookup returns `UNKNOWN` → `EAGAIN`/`EIO`**, never `ENOENT`. `test -e` reports an I/O error instead of "absent"; the shell hangs on completion; `git` aborts.

**Why it is not caught by the doc's own break analysis.** [[filesystem-core#1.7]]'s "how it breaks" only covers the *withholding* case (censoring RPC → no closure → UNKNOWN — correct). It never addresses the **fully-cooperative-RPC honest-absent** case, and it silently assumes the live mount can execute source 1 ("own node"), which contradicts the no-wallet/hosted-RPC target. The conformance table calls `lookup` "defined," but the defined answer for the overwhelmingly common configuration is "UNKNOWN for every negative" — precisely the hand-wave the charge names ("a defined answer that just says UNKNOWN for everything").

**Severity rationale.** The 2026-07-22 owner ruling ([[owner-rulings#2026-07-22]]) requires a *useful* mount through *ordinary* file managers and CLI tools. A mount that cannot say "not found" is not useful to those tools. This is the single most consequential gap in the FS lanes.

**Repair.** State plainly that an *honest-`ENOENT`* live mount requires either (a) a self-hosted full/archive node (source 1), or (b) the snapshot/bundle profile with a closure manifest (source 3). Demote the hosted-RPC *live strict* mount from "ordinary-app surface" to "diagnostic/verification surface," and make the **snapshot-with-closure-manifest** profile the ordinary-app default the mount requirement is actually satisfied by. This is an owner-visible product-line call — see [[#Decisions for James]] JF-A.

---

### AF-2 (SERIOUS) — `ls -l` reproduces ghost entries on a live-follow mount: `readdir` (pinned handle) and the `fstatat` storm disagree

**Where:** [[filesystem-core#1.6 The one-basis agreement invariant]] (coherence claimed *within a directory snapshot*); [[filesystem-core#6.1 Live view and reproducible view]] ("never a moment when one recursive walk sees two bases"); [[filesystem-core#3.2 Stable file identity]] (open dir handle pins its snapshot).

**The construction.** Live-follow mount (J-FS1 option B, or any per-mount opt-in). Directory `D` under lens `L`:

- basis `B0`: `D = {a, b}`.
- venue advances to `B1`: record admitted placing `c`; a REVOKE admitted on `a`'s winning slot.

A user runs `ls -l /mnt/efs/D`. `ls -l` is **not one operation against the open dir handle** — it is `opendir`+`readdir` (returns names from the handle pinned at `B0` → `{a, b}`) followed by an independent `fstatat(D, "a")`, `fstatat(D, "b")` **as fresh lookups at the current mount generation `B1`**. At `B1`, `a` resolves EMPTY (empty-on-revoke, [[filesystem-core#1.10]]) → `ENOENT`. So:

```
$ ls -l /mnt/efs/D
ls: cannot access '/mnt/efs/D/a': No such file or directory
-rw-r--r-- ...  b
```

An entry `readdir` just returned is reported absent by the very next `stat`. This is the **ghost-entry** failure [[mountable-filesystem-semantics#12. Falsification tests]] test 5 exists to kill — resurfacing in the flagship `ls -l` because FSP-BASIS-1 guarantees coherence only *within one snapshot*, and `ls -l` deliberately mixes a pinned-handle enumeration with fresh-generation stats. The doc's §6.1 "one recursive walk" framing does not cover it, because `ls -l` is not one walk against one handle; it is a walk plus N independent lookups.

**Severity rationale.** Not a data-integrity break (each answer is honest at its own basis), but it makes the single most common listing command misbehave on any live mount. It is the concrete reason the snapshot profile must be **mandatory for ordinary apps**, not merely "recommended default."

**Repair.** Either (i) make the snapshot/generation profile the *only* ordinary-app profile (J-FS1 option A promoted from default to requirement, [[#Decisions for James]] JF-A), or (ii) require adapters to route entry `getattr` for names obtained through an open dir handle to **that handle's pinned basis** rather than the live generation — an adapter obligation the conformance table (§5.1) does not currently state. Add a falsification test: `ls -l` over a directory mutated between `opendir` and the stat storm must not report a just-listed entry absent.

---

### AF-3 (SERIOUS → escalates) — Whiteout-masked names render as `ENOENT` to ordinary tools: a subscribed curator can silently delete from the user's file manager

**Where:** [[filesystem-core#1.5 WHITEOUTs]] ("`readdir` omits it"; mask inspectable only via control API / `?grades=1`) vs [[filesystem-core#1.7]] host-mapping ("only `ABSENT_PROVEN` → `ENOENT`").

**The construction.** Alice subscribes to curator `C` for `/software`. `C` publishes a WHITEOUT ([[fs-pass-synthesis]] C5: genesis `/.well-known/whiteout` TAGDEF + REF-PIN) masking `/software/tools/scanner` (the doc's own competitor-suppression scenario). On Alice's mount:

- `readdir /software/tools` **omits** `scanner` (§1.5).
- `lookup /software/tools/scanner` → the name is masked-by-policy, not proven-absent. §1.7 says only `ABSENT_PROVEN` maps to `ENOENT`; a whiteout is explicitly "**not** PROVEN-ABSENT." So what does the mount return? If `ENOENT` (to match `readdir`'s omission), it is **false absence by policy** — exactly what §1.5 warns "would let any subscribed upper layer manufacture evidence-grade absence." If `UNKNOWN`/transient, the file manager shows a broken entry that `readdir` didn't list.

The two sections are unreconciled: §1.5 wants the name gone from the tree (⇒ `ENOENT`-like), §1.7 forbids anything but venue-closure from producing `ENOENT`. Whichever way it resolves, an ordinary tool that does not read `user.efs.*` xattrs (i.e. every ordinary tool, and the grade-free profile of [[filesystem-core#J-FS2]]) sees `scanner` as simply *gone*, indistinguishable from proven-absent, with no signal that curator `C` masked it.

**Severity rationale.** The user subscribed to `C` for curation, not for the power to make competitors vanish from Finder with no visible trace. This is the "false absence by policy" the design says it prevents, leaking through the mount projection to tools that cannot see the mask.

**Repair.** Rule the mount projection of a whiteout explicitly (owner-visible, [[#Decisions for James]] JF-C): either (a) render a masked name as a **visible inert tombstone entry** (e.g. a zero-byte entry whose `user.efs.grade = WHITEOUT by C` and whose open fails with a distinguishable error), so an ordinary `ls` still shows *something* changed; or (b) map to `ENOENT` **only** when the mask is authored by the mount's *own top tier* (the user), and to a distinguishable I/O condition when it is a *subscribed* mask. Do not leave §1.5 and §1.7 silently contradictory.

---

### AF-4 (SERIOUS → escalates) — FSP-HYBRID's "directory wins the plain name" lets a cross-author squatter relocate another author's file, ignoring lens authority

**Where:** [[filesystem-core#1.4.2]] projection rule FSP-HYBRID, step 4: "If both kinds hold *independent* winners at one presented name (Case B), the path-continuation winner (GENERIC) takes the plain name and the byte-serving winner (DATA) is projected under the deterministic decorated name."

**The construction.** In Alice's lens the position `(parent, "docs", KIND_DATA)` resolves to **Alice's** signed file `docs` (a report). Alice's lens also includes a discovery/curator overlay that ranks author `M` for some scope. `M` publishes `(parent, "docs", KIND_GENERIC)` — an empty folder. Now two *different positions* (different `kindclass`) both have winners at the presented name `docs`, from **different authors** (step 4 explicitly admits "possibly from different authors").

- §1.4.1's tier resolution does **not** apply — it arbitrates *within one exclusive position*; Case B is across two positions of different kindclass.
- The **only** arbiter is the kind-priority rule (GENERIC wins the plain name), which **ignores lens authority and tier entirely**.
- Consequence: `M`'s empty folder takes the plain name `docs`; Alice's report is shoved to a decorated name (§3.3 collision escape). `cat docs` now `EISDIR`s (or lists an empty folder); every path reference to Alice's `docs` breaks or hits `M`'s squat. On the mount this reads as a **rename Alice never performed, authorized by a lower-ranked stranger**.

The doc rates this "Delegated-technical … escalate only if the golden fixture shows product-visible harm" ([[filesystem-core#1.4.2]]). This construction *is* product-visible harm: cross-author demotion of a trusted author's file by an untrusted one, with no tier check.

**Severity rationale.** The kind-projection order silently overrides the lens authority order for the plain name — a squatting primitive. Any author who can win a GENERIC slot in the viewer's lens (discovery, a subscribed curator, an equal-rank group) can evict a higher-authority DATA file from its own name.

**Repair.** Gate the plain-name assignment on authority, not kind alone: when the GENERIC and DATA winners are **different principals**, the plain name goes to the **higher-lens-tier** winner; only when they are the same author (or same tier) does the "directory wins for subtree continuity" tiebreak apply. Accept subtree-decoration cost for a lower-ranked GENERIC squatter (its subtree is decorated, not the trusted file). Escalate to the owner via a golden fixture (this is the fixture); this is the [[#Decisions for James]] JF-D axis.

---

### AF-5 (SERIOUS → escalates) — Promotion is **not** identity-preserving for the mainstream bare-EOA → KEL journey

**Where:** [[local-mode#7.2 The promotion journey]] ("What did not change: claimIds, object IDs (owner/salt-derived, venue-free)"); [[local-mode#1.3]] (`claimId` excludes actor/grant carriage); [[local-mode#1.1]] (`principal` = "bare-EOA address-shaped **or** born-KEL bytes32").

**The construction.** The advertised mainstream path: Alice starts zero-state (bare EOA — [[owner-rulings]] "bare EOA is the zero-state path"), builds a local realm, authors files. Her `dataId = keccak(author, salt)` and her `claimId`s are computed with `author =` **her bare-EOA identifier**. Months later she incepts a KEL to earn the strong grade (the §7.2 journey, step 3 "Establish authority (KEL-mode)"). Her KEL principal is a **bytes32 digest** (per [[human-overview#7]] seam 1, full-width principals). This is a *different byte string* from the bare-EOA `author` word.

- Every `dataId` and `claimId` authored under the bare `author` is keyed to that word.
- Re-signing the same *logical records* under the KEL principal (§1.3's stale-epoch re-carriage keeps identity **only because the `author`/principal is unchanged**) does **not** apply here — the principal *itself* changes representation.
- So promotion from bare-local to KEL-authority **re-keys every object ID**: links break, history re-anchors, the "same claimIds" promise (§7.2) fails.

§1.3 hedges "Local mode inherits whatever the recut freezes," but §7.2's flat claim "claimIds, object IDs … unchanged" and §0's "preserves identity byte-for-byte" carry **no** caveat for the bare→KEL case — which is the mainstream journey, not an edge case. This collides with the still-open seam 1 (full-width principals) and the auto-memory caveat that the "one address" (B′) identity ruling is *partially invalidated* by the v2 native-carrier ruling.

**Severity rationale.** The product story ("local = sovereign, promote to earn grade, identity survives") is a headline of both this lane (§0, §7) and the owner frame. If the mainstream zero-state user's IDs die on KEL inception, the story is false for exactly the users it targets, and the choice — *does bare-EOA identity survive KEL inception, or is zero-state a throwaway namespace?* — is an owner decision, not a technical detail.

**Repair.** Either (a) require the KEL principal to *commit to / be derivable from* the founding bare-EOA (so the object-ID `author` word is stable across inception), preserving identity — at the cost of linking the KEL to the EOA; or (b) accept that bare-local identity is *throwaway* and say so loudly (promotion from bare = a fresh identity + a re-anchor/redirect from the old IDs), and strip the "byte-for-byte identity preserved" claim for the bare path. Add the caveat to §7.2 and §0 either way. Owner axis: [[#Decisions for James]] JF-B.

---

### AF-6 (SERIOUS) — Local-realm manifest→`ENOENT` (local-mode §4) directly contradicts [[filesystem-core#1.7]]'s absence rule

**Where:** [[local-mode#4. The completeness manifest]] ("a mounted realm snapshot renders … manifest-proven-absent-in-basis as absent *at this basis*"; "`UNKNOWN ≠ ENOENT` … generated at the source") vs [[filesystem-core#1.7]] FSP-ABSENT-1 (absence must be grounded in **venue-state closure** — source 1/2/3, all of which require a *venue state root*).

**The construction.** A pure local realm has **no venue** and **no venue state root**. Its `CompletenessManifestV1` carries `completeness: DECLARED, never PROVEN` (§4 discipline 1) — self-scoped signer testimony, explicitly unable to prove exclusion (§4 discipline 1, row 2). local-mode §4 nonetheless maps a name **not listed** in the manifest to *absent-at-basis* → `ENOENT` on the mounted realm snapshot.

- [[filesystem-core#1.7]] FSP-ABSENT-2 forbids grounding `ABSENT_PROVEN` in anything but venue-state closure; source 3 (the closest) requires "a closure manifest **that commits to the venue state root**." A local realm's manifest commits to a `recordSetRoot` signed by the owner, **not** a venue state root.
- Therefore, by [[filesystem-core]]'s own rule, a local-realm mount may **never** emit `ENOENT` — every not-found is `UNKNOWN`. local-mode §4 says it *does* emit absence. **The two lanes give opposite answers for the same mount operation.**

Either local-mode is manufacturing false absence (a DECLARED, signer-trust absence dressed as `ENOENT`), or filesystem-core's absence taxonomy is missing a fourth, honestly-graded source ("signed closure over a self-scoped realm, grade = signer-trust") — in which case the same source would also rescue AF-1's snapshot/bundle mount and should be named there too.

**Severity rationale.** This is the exact false-absence axis the charge targets, and it is an unreconciled contradiction between two lanes that both claim to satisfy the mount contract. Whichever resolution is chosen changes what `ENOENT` *means* system-wide.

**Repair.** Add a fourth `ABSENT_PROVEN` source to [[filesystem-core#1.7]]: **"a signed completeness manifest over a closed realm/bundle, carrying the signer-trust grade,"** and require the mount to surface that grade (so an ordinary tool's `ENOENT` from a local realm is honestly "absent per the realm owner's signed manifest," gradable, and never confused with venue-closure absence). Then local-mode §4's mapping becomes legal *and graded*. Reconcile both lanes to the same sentence.

---

### AF-7 (SERIOUS) — An honest crash manufactures "permanent equivocation evidence"; the convictability claim over-states without a durable-counter requirement

**Where:** [[local-mode#2.1 What names a head]] ("a device that signs two different heads at one counter [is] **permanently convictable** … transferable equivocation evidence"); [[local-mode#4]] discipline 3 (manifest + later record = "durable evidence of omission or device equivocation").

**The construction.** Device `X` signs `RealmHeadV1{counter: 40, recordSetRoot: R1}`, then crashes **before** durably recording that it consumed counter 40 (or mid-write, leaving a partial local set). On restart it re-derives its head, computes a *different* `recordSetRoot: R2` (because a partial write changed the folded set), and signs `RealmHeadV1{counter: 40, recordSetRoot: R2}`. Now two conflicting signed heads at counter 40 exist from an **honest** device.

- The design treats this as "permanent proof of misbehavior." It is not — it is proof of *either* equivocation *or* a crash/non-determinism. An honest device can self-frame, and a malicious peer holding both artifacts can present an honest device as an equivocator.
- The transparency-log property the doc imports (§2.1, §2.2) is sound **only** if the monotone counter is write-ahead-durable *before* signing — a requirement the lane never states. Without it, the "equivocation evidence" is unsound.

**Severity rationale.** The convictability/transparency claim is a load-bearing "strongest honest claim available" (§2.1, §0). If honest crashes forge the evidence, the claim is security theater at exactly the point the doc leans on it.

**Repair.** Add the invariant: a device MUST durably persist "counter N consumed" **before** emitting any head at counter N (write-ahead), and MUST make its head derivation a pure function of durably-committed set state — so two heads at one counter are provably intentional. State it as a device-hygiene MUST in §2.1 and in the conventions registry, and soften "permanently convictable" to "convictable *given the durable-counter discipline*."

---

### AF-8 (SERIOUS → escalates) — Mirror-tier large files do **not** get O(chunk) authenticated seeking; the §4.2 "manifest buys authenticated seeking" corollary fails for the default tier

**Where:** [[large-files#1.4 Range verification]] (leaf vector "makes seek-heavy mounts cheap"); [[large-files#4.2 The carrier range-verification table]] corollary ("the manifest, not the carrier, is what buys authenticated seeking … Even a dumb HTTPS mirror becomes chunk-verifiable"); [[large-files#1.4]] chunk-length exactness rule ("`submitChunk` MUST enforce this on-chain … every off-chain verifier MUST enforce the same rule").

**The construction (the geometry attack that the exactness rule only half-closes off-chain).** A malicious author signs a `FileGenerationV1` declaring **uniform** `chunkSize = 24 KiB`, `chunkCount`, `size`. The author builds a valid Merkle tree over chunks where **chunk 2 is 12 KiB** (short) and a later chunk is padded to compensate — every `leaf_i = keccak(DOMAIN, keccak(chunk_i), sha256(chunk_i))` correctly commits its actual bytes, so **every per-chunk verification passes**. The tree root matches the signed `chunksRoot`. The file lives **mirror-only** (Arweave + HTTP — the exact [[large-files#4]] flagship 2 GB video config; LF-J1 recommends mirror-default for ordinary files).

A mount serves a seek to logical offset `O` in chunk `k` (`k` past the short chunk 2). It computes `index = O / chunkSize`, fetches chunk `k`, checks `len(chunk_k) == chunkSize` ✓ (attacker kept chunk `k` full), verifies `leaf_k` ✓, and **serves chunk `k`'s bytes as offset `O`**. But because chunk 2 was short, the *true* logical byte at `O` lives elsewhere. The reader returns **bytes that verify and are the wrong logical bytes.**

- On-chain (`submitChunk`) enforces the exactness rule globally at write, so state-tier files are safe.
- **Off-chain, the leaf vector cannot rescue this cheaply.** `leaf_i` commits chunk bytes, **not** chunk length or cumulative offset. From the leaf vector alone a reader cannot verify geometry; it can only confirm a *fetched* chunk's length against `chunkSize`. To *detect* the short middle chunk on a skipping seek, the reader must fetch **every preceding chunk** — O(file), defeating O(chunk) seeking. The doc's "every off-chain verifier MUST enforce the same rule" is therefore either a full-linear-pass cost (not seeking) or unenforced-until-you-happen-to-read-the-short-chunk.

So the §4.2 corollary — that the signed manifest makes even a dumb HTTPS mirror support authenticated *seeking* — is **false for the geometry dimension on any file not submitted to an on-chain tier.** The signed `chunkSize` makes the fraud *attributable after a full pass* (`CONTENT-MALFORMED`, §5.3), but not *detectable on a seek*, which is what a mount needs.

**Severity rationale.** Mirror-tier is the recommended default for ordinary large files (LF-J1-A). The flagship mounted-2GB-video journey (§4) is mirror-only. So the vulnerable configuration is the *common* one, and the promised O(chunk) verified streaming is not actually verified against position for it.

**Repair.** Make geometry self-verifying from the tree: bind each leaf to its chunk **length or cumulative offset** (e.g. `leaf_i = keccak(DOMAIN, i, offset_i, keccak(chunk_i), sha256(chunk_i))`, or commit a running-offset vector alongside the leaf vector under `chunksRoot`). Then a reader validates position from the (self-verifying) leaf/offset vector in one pass without fetching bodies, and a short middle chunk fails the root. Alternatively, restrict "verified O(chunk) seeking" to state-tier files and downgrade mirror-tier files to "full-fetch-verify-before-serve" in [[large-files#4.2]] and [[mountable-filesystem-semantics#12]] test 16 — but that guts the mirror-default product. This is a delegated-technical gate that escalates because it changes the honest capability of the default tier ([[#Decisions for James]] JF-E note).

---

### AF-9 (SERIOUS) — The §1.4 store-creation interface delta opens permissionless geometry-griefing: an attacker front-runs the store with mismatched `chunkSize`/`size` and bricks the upload

**Where:** [[large-files#1.4]] ("the store must learn `{chunkCount, chunkSize, size}` at store creation … a small but real EFSBytes interface delta"); [[large-files#3.2]] (`storeId = keccak(DOMAIN_CHUNKSTORE_V1, chunksRoot, tier)` — **geometry not in the key**); [[large-files#3.1]] (`submitChunk` is permissionless, `msg.sender` ignored).

**The construction.** The author publishes a signed manifest committing `chunksRoot`, `chunkSize = 24 KiB`, `size`. The `chunksRoot` apex binds `chunkCount` (count-at-apex) but **not** `chunkSize` or `size` (only the count is at the apex). Store creation is permissionless. An attacker reads the public manifest, front-runs store creation for `(chunksRoot, STATE)` and initializes it with **`chunkSize = 8 KiB`** (consistent with the apex `chunkCount`, since count is not size). Because `storeId` excludes geometry, this is the *same* store slot — first creator wins.

- Now the author's legitimate `submitChunk` calls, enforcing `len(chunk_i) == store.chunkSize == 8 KiB`, **reject every one of the author's correctly-sized 24 KiB chunks**.
- The `(chunksRoot, STATE)` store is permanently bricked. The `contractReadable` floor (state-tier only, §5.1d) can **never** be satisfied → the file is `BYTES-PARTIAL` forever → never `COMPLETE`.

This griefing surface is **created by this lane's own exactness-rule fix** (§1.4), and the doc flags the interface delta as "small but real" without analyzing the attack it opens. It contradicts the permissionless-pool safety property [[large-files#3.3]] relies on (chunk admission authorization-free, front-running = harmless acceleration) — here front-running is *not* harmless because it fixes a *geometry* the manifest disagrees with.

**Severity rationale.** A cheap, permanent denial-of-completion against any state-tier / `contractReadable`-floored file (the exact high-value class of ruling 6 and [[large-files#2.3]]). One attacker transaction per target.

**Repair.** Bind the full declared geometry to the store identity so a mismatched creation is impossible: either fold `chunkSize`/`size` into the store commitment (`storeId = keccak(DOMAIN, chunksRoot, chunkSize, size, tier)`), or require store creation to present the **signed manifest** and verify `{chunkCount, chunkSize, size}` against it, so only geometry matching the author's signature can create the store. Add a griefing fixture to the [[large-files]] delegated-gate list ("differential fuzz of the dual-digest tree" already exists; add "adversarial store-creation").

---

## 2. NOTE-level findings (real, lower blast radius)

### AF-10 (NOTE) — Basis-pinned snapshot mounts assume archival historical-state availability that "chains-don't-die" does not provide

[[filesystem-core#5.1]] marks `open_dir` (snapshot pinning) and `read_dir` "defined," and [[filesystem-core#6.2]] pins generations to a basis. But reading a directory *as of block N* requires the venue's **state at N** (or a proof against N's state root). A non-archive full node serves historical state only ~128 blocks back; [[owner-rulings#2026-07-10]] chains-don't-die guarantees head-queryability and keeps EFS bodies in the spine, but does **not** guarantee arbitrary historical *state* proofs. So a long-lived pinned directory handle (or any snapshot older than the node's window) becomes unservable over an ordinary node → a directory read that started fine returns `EIO` mid-walk. **Repair:** name the requirement — snapshot mounts need an archive node **or** a self-contained bundle (the bundle carries its own state, [[filesystem-core#6.4]]); add to the conformance table's caveat column. Reinforces AF-1's snapshot/bundle escape and folds into JF-A.

### AF-11 (NOTE) — Graphical file-manager thumbnail/preview generation defeats the "metadata never hydrates bytes" budget for large media

[[large-files#4.1]] ("Metadata ops never hydrate bytes: `stat` storms, Explorer thumbnailing crawls … touch manifests only") mislabels thumbnailing. Finder Quick Look, GNOME/KDE thumbnailers, and Explorer preview issue real `open`+`read` of the first frame/MB — a *read*, not a metadata op. Browsing a folder of 100 large videos graphically (the mount requirement's own acceptance corpus includes "Finder/Quick Look," "Explorer preview" — [[mountable-filesystem-semantics#Phase 2]]) triggers 100 × (leaf-vector fetch + head-chunk fetch) — an availability/bandwidth storm the crawler defense does not cover. **Repair:** treat first-open reads from known thumbnailer processes under a bounded prefetch budget; document that preview generation is a read path, not a metadata path; feed the mount budget gate (G-4).

### AF-12 (NOTE) — Collision-decoration must be a pure function of the canonical name, or sibling insertion renames unrelated decorated entries

[[filesystem-core#3.3]] specifies "deterministic decoration for collisions" but does not pin decoration **stability under set change**. If the decoration suffix is a rank/counter among the colliding set (`docs~1`, `docs~2`), inserting an earlier-sorting collision **renumbers** the others across bases — a false rename, and a changed synthetic inode ([[filesystem-core#3.2]]) for an entry no one touched. **Repair:** require the decoration to be a pure function of the *canonical name alone* (e.g. a short hash of the canonical bytes), never of its position among current collisions. One sentence; feeds the §3.3 golden fixture (test 10).

### AF-13 (NOTE) — FSP-HYBRID Case A × Case B interaction is unspecified

[[filesystem-core#1.4.2]] step 3 (Case A: a DATA winner *with resolved children* → project a directory at the plain name, bytes at `<name>/~data`) and step 4 (Case B: a separate GENERIC winner → GENERIC takes the plain name) both claim the plain name when a node is DATA-with-children **and** an independent GENERIC winner exists at the same presented name. Which directory wins the plain name is undefined. **Repair:** specify the composed case in the FSP-HYBRID vectors (G-1); likely the same authority-gated rule AF-4 asks for resolves it.

### AF-14 (NOTE, cross-lane coherence) — [[filesystem-core#3.2]]'s file-handle tuple risks re-opening the torn generation that [[large-files#1.2]] closed

[[filesystem-core#3.2]] describes the pinned file handle as `(logical dataId, resolved metadata claim, logical size/encoding, content/chunk commitment, byte-source set, basis)` — phrased as if *metadata claim* and *content commitment* and *size/encoding* are separately resolved facts. [[large-files#1.1]]'s entire finding is that these being separate LWW slots is the torn-generation bug, fixed by making **the manifest the single winner** (§1.2). The two lanes are compatible but the filesystem-core wording invites the exact tear. **Repair:** filesystem-core §3.2 should cite [[large-files#1.2]] and collapse "metadata claim + size/encoding + content commitment" into "the single winning `FileGenerationV1` manifest," so the FS lane cannot be implemented as multi-slot assembly.

### AF-15 (NOTE) — SAME_SLOT_COLLISION vs benign multi-device concurrency: the FS may flag honest multi-device as collision

[[filesystem-core#1.8]] rule 2 sets `SAME_SLOT_COLLISION` for two digests at the same `(principal, semanticPositionId, winning order)`. [[local-mode#2.4]] establishes that two of Alice's own devices legitimately produce concurrent same-slot writes (same TID/order offline). The FS lane hands multi-device to the authority lane (G-5) but would *also* flag it `SAME_SLOT_COLLISION` — conflating honest multi-device concurrency with the duplicity signal the flag is meant to carry. **Repair:** the flag must exclude same-principal multi-device concurrency (distinguishable via the P10 `deviceBits` / [[local-mode#2.4]] vectors); coordinate the definition across the FS, local-mode, and authority lanes (H-5).

---

## 3. What survived the attack (verified-strong, stated so the synthesizer doesn't re-litigate)

- **The global same-`(principal, order)` equivocation deletion** ([[filesystem-core#1.8]] rule 1) genuinely closes seam-6 false equivocation. I could not construct a manufactured-equivocation case that survives it; batch records at one `(principal, order)` across different positions resolve normally. **VERIFIED.**
- **The one-basis invariant *within a snapshot*** ([[filesystem-core#1.6]]) holds because mandatory indexing is admission-atomic (force-indexed in the same kernel entrypoint = same block/state root), so point and page reads at one pinned block are coherent. The invariant's five consequences are sound *given* atomic indexing. **VERIFIED (conditional on same-transaction indexing atomicity — worth confirming in the kernel recut).**
- **"Manifest is the generation"** ([[large-files#1.2]]) is the correct structural fix for the torn-generation crack and preserves ADR-0049. **VERIFIED sound.**
- **Tier honesty kill-list** ([[large-files#2.5]]) is tight; I found no wording letting DA-tier read as contract-readable. `storeId` includes the tier, completeness is per-`(root, tier)`, bits never summed. **VERIFIED.**
- **Local mode's withholding honesty** ([[local-mode#5]], §9.1) does **not** over-claim detection — it explicitly states the single-dumb-provider-fresh-device case is uncatchable. No over-claim found. **VERIFIED honest.**
- **Chunk-proof splicing (a)-(d)** ([[large-files#5.1]]) are correctly closed by the Merkle construction. Only the *geometry* leg (e) has the off-chain hole (AF-8). **VERIFIED except AF-8.**

---

## Decisions for James

Only items the attack *genuinely* escalates to the owner (not the delegated-technical repairs, which go to vectors). Each carries a plain example, options, a recommendation, and the reason trail.

### JF-A — What is the ordinary-app mount profile: snapshot/bundle, or a live hosted-RPC mount?

**Example.** Dana, no wallet, mounts a public drive over a hosted RPC and runs `test -e /mnt/efs/etc/foo.conf` on a file that isn't there. On a live hosted-RPC mount she gets an I/O error, not "absent" (AF-1); and `ls -l` can report a just-listed entry as missing (AF-2). On a **snapshot-with-closure-manifest** mount (or over her own archive node), both behave correctly.

- **JF-A-1 — The ordinary-app mount is the snapshot/bundle profile; the live hosted-RPC mount is a verification/diagnostic surface, not an ordinary-app drive. Recommended.** It is the only configuration that delivers honest `ENOENT` (AF-1, AF-6), avoids the `ls -l` ghost (AF-2), and sidesteps archival-state dependence (AF-10). Promote [[filesystem-core#J-FS1]] option A and [[filesystem-core#J-FS2]] option A from "default" to "the required ordinary-app profile."
- **JF-A-2 — Keep the live hosted-RPC mount as a first-class ordinary-app surface.** Fresher, but requires per-negative-lookup closure proofs ordinary RPCs don't serve, and reproduces ghost entries — the mount reads as unreliable to exactly the tools the requirement names.

Reason trail: [[filesystem-core#1.7]], [[filesystem-core#5.1]], [[filesystem-core#6.2]]; AF-1, AF-2, AF-6, AF-10; [[owner-rulings#2026-07-22]] (useful mount through ordinary tools); [[mountable-filesystem-semantics#3.5 EFS absence can be UNKNOWN]].

### JF-B — Does zero-state (bare-EOA) identity survive KEL inception, or is bare-local a throwaway namespace?

**Example.** Alice uses EFS locally as a bare EOA for a year, then incepts a KEL to earn the strong grade. If her KEL principal is unrelated bytes, every file ID and link she made changes — her local history re-anchors (AF-5).

- **JF-B-1 — Bare-EOA identity must survive: the KEL principal commits to / is derivable from the founding EOA, so object IDs are stable across inception. Recommended if the mainstream "promote and keep your stuff" story is real.** Cost: the KEL is linkable to the founding EOA (fine for the mainstream default; unlinkable personas already use fresh KELs).
- **JF-B-2 — Bare-local identity is explicitly throwaway.** Promotion from bare = a fresh identity + a redirect from old IDs; strip "identity preserved byte-for-byte" from [[local-mode#7.2]] for the bare path and say so in the product.

Reason trail: [[local-mode#1.1]], [[local-mode#1.3]], [[local-mode#7.2]]; AF-5; [[human-overview#7. The seams that must be closed]] seam 1; the auto-memory caveat that the "one address" identity ruling is partially invalidated by the native-carrier ruling.

### JF-C — How does a subscribed-curator whiteout project onto an ordinary-tool mount?

**Example.** Alice subscribes to curator `C`. `C` whiteouts a competitor's `/software/tools/scanner`. In Alice's Finder the folder simply vanishes with no trace, indistinguishable from "never existed" (AF-3).

- **JF-C-1 — Render a subscribed-mask as a visible inert tombstone entry** (zero-byte, `user.efs.grade = WHITEOUT by C`, open fails distinguishably), so an ordinary `ls` still shows *something* was masked and by whom. **Recommended** — preserves the "false absence by policy" guard [[filesystem-core#1.5]] promises, at the boundary where tools can't read grades.
- **JF-C-2 — Map a subscribed-mask to `ENOENT`** (silent), accepting that a curator you subscribe to can invisibly delete from your file manager.

Reason trail: [[filesystem-core#1.5]] vs [[filesystem-core#1.7]]; AF-3; [[filesystem-core#J-FS2]] (grade-free ordinary-app mount).

### JF-D — Does kind-projection ever override lens authority for a plain name? (FSP-HYBRID cross-author case)

**Example.** A stranger `M` (in Alice's discovery overlay) publishes an empty folder named `docs`; Alice's own signed report `docs` is silently shoved to a decorated name and `cat docs` breaks (AF-4).

- **JF-D-1 — Authority wins the plain name across kinds: when the GENERIC and DATA winners are different principals, the higher-lens-tier winner takes the plain name; the kind tiebreak applies only within one author/tier. Recommended.** Closes the cross-author squatting primitive; a lower-ranked GENERIC squatter pays subtree-decoration, not the trusted file.
- **JF-D-2 — Keep kind-priority (GENERIC always wins the plain name).** Simpler projection, but any author who can win a GENERIC slot in a viewer's lens can evict a higher-authority file from its own name.

Reason trail: [[filesystem-core#1.4.2]] FSP-HYBRID; AF-4; [[filesystem-core#1.4.1]] (tier resolution, which does *not* reach across kindclasses). Flagged per the doc's own "escalate if the golden fixture shows product-visible harm" — this is that fixture.

*(Delegated-technical, fed not asked: AF-8 tree-geometry commitment and AF-9 store-geometry binding are EFSBytes-recut gates; AF-7 durable-counter discipline, AF-12 decoration purity, AF-13/AF-14/AF-15 cross-lane wording are conventions-registry/vector work. They escalate only if the recut cannot bind geometry cheaply, per JF-E note below.)*

**JF-E note (borderline):** AF-8 changes the honest capability of the *mirror default tier* (no verified O(chunk) seeking without a tree-geometry commitment). If the EFSBytes recut can add offset/length to the leaf cheaply, this stays delegated-technical; if it cannot, "mirror-tier large files stream but do not offer authenticated random access" becomes a product-honesty statement James should see. Reason trail: [[large-files#1.4]], [[large-files#4.2]], [[large-files#5.1]]; AF-8.

---

## Reconciliation ledger

Items the lanes marked reconciled/closed that the attack finds mis-marked or unreconciled.

1. **[[filesystem-core#8]] seam-6 "CLOSED (false absence)"** — **partially still-open.** The *equivocation* half is genuinely closed (verified). The *false-absence* half leaks at the mount boundary in three unreconciled places: hosted-RPC honest absence (AF-1), subscribed-whiteout projection (AF-3), and the local-realm manifest→`ENOENT` contradiction with [[local-mode#4]] (AF-6). Mark seam-6 "closed for equivocation; absence-projection to the host layer still open."
2. **[[filesystem-core#5.1]] `lookup` row "defined"** — **overstated.** Defined only for own-node / snapshot-bundle sources; for the hosted-RPC live case the defined answer is "UNKNOWN for every negative" (AF-1) — a hand-wave by the charge's test. Re-mark "defined for snapshot/own-node; degraded to UNKNOWN-only over hosted RPC."
3. **[[filesystem-core#5.1]] `open_dir`/`read_dir` "defined"** — **incomplete.** Does not account for archival historical-state availability of the pinned basis (AF-10) or the `ls -l` handle-vs-fresh-stat incoherence on live-follow (AF-2). Add the caveats.
4. **[[local-mode#4]] "`UNKNOWN ≠ ENOENT` … generated at the source"** — **contradicts [[filesystem-core#1.7]]** (AF-6). A DECLARED local manifest cannot ground `ABSENT_PROVEN` under filesystem-core's rule (needs a venue state root). Reconcile by adding the fourth signer-graded absence source to filesystem-core, or by demoting local-realm not-found to `UNKNOWN`.
5. **[[local-mode#7.2]] / [[local-mode#0]] "promotion preserves identity byte-for-byte"** — **false for the bare-EOA→KEL path** (AF-5). Add the caveat or resolve JF-B; do not carry the unqualified claim.
6. **[[large-files#4.2]] corollary "the manifest buys authenticated seeking [even on a dumb HTTPS mirror]"** — **false for the geometry dimension on non-submitted (mirror-only) files** (AF-8). The manifest authenticates chunk *content*, not chunk *position*; the exactness rule that closes position is enforced only on-chain. Re-mark: "authenticated *content* seeking on any carrier; authenticated *position* only for state-tier, or after a full linear pass, unless the tree commits offsets."
7. **[[large-files#5.1]] (e) "closed by the length-exactness rule at … first off-chain verification"** — **overstated.** "First off-chain verification" cannot be a cheap per-seek check; closing (e) off-chain costs a full pass (AF-8). Re-mark "closed on-chain; off-chain attributable-after-full-verify, not detectable-on-seek."
8. **[[large-files#1.4]] interface delta "small but real"** — **under-analyzed.** The permissionless store-creation griefing surface it opens (AF-9) is not small; it is a permanent denial-of-completion. Add the griefing analysis and the geometry-in-storeId repair.
9. **[[local-mode#2.1]] "permanently convictable" equivocation evidence** — **conditional, not stated.** Requires a durable-counter (write-ahead) discipline the lane omits; honest crashes forge the evidence otherwise (AF-7). Add the MUST.
10. **[[filesystem-core#1.8]] rule-2 `SAME_SLOT_COLLISION`** vs **[[local-mode#2.4]] benign multi-device concurrency** — **unreconciled** (AF-15). The flag would fire on honest own-device concurrency; exclude it and coordinate the definition across lanes (H-5).

---

## Confidence

**VERIFIED (constructed against the target files and the cited contract this pass):** the hosted-RPC `ENOENT` gap (AF-1) — FSP-ABSENT-1/2 text is explicit that only own-node/proof/bundle grounds absence, and a hosted RPC is none of those; the `ls -l` handle-vs-fresh-stat incoherence (AF-2) — follows directly from readdir pinning + fresh `fstatat` at the live generation; the §1.5/§1.7 whiteout-projection contradiction (AF-3); the FSP-HYBRID cross-author demotion (AF-4) — step 4 admits different authors and §1.4.1 tiering does not reach across kindclasses; the bare→KEL identity break (AF-5) — `dataId = keccak(author, salt)` with a changed principal representation; the local-manifest→`ENOENT` vs filesystem-core §1.7 contradiction (AF-6); the geometry attack surviving off-chain (AF-8) — the leaf construction `keccak(DOMAIN, keccak(chunk), sha256(chunk))` provably does not commit length/offset; the store-creation griefing (AF-9) — `storeId` provably excludes geometry, apex binds only count. The "what survived" list is verified by failed attack attempts.

**PLAUSIBLE (my analysis; falsifiable by the recut, vectors, or a lane author):** the *severity* ranking of AF-1 vs AF-6 as SERIOUS-not-FATAL (they are FATAL for the *live-RPC* profile but the snapshot profile is an existing escape, so the *design* is repairable); the decoration-instability claim (AF-12) — depends on an unspecified decoration function, so it is a defect-if-counter, not a proven bug; AF-11's thumbnailer-storm magnitude (depends on which file managers prefetch how much); AF-7's honest-crash frequency (real mechanism, unquantified).

**Could not verify:** whether mandatory indexing is truly same-transaction atomic (the one-basis invariant's soundness rests on it — I inferred it from "force-indexed at admission" but did not read the kernel entrypoint); the exact `submitChunk` proof-path index binding ([[large-files]] itself flags this as vector-gated); whether an ordinary public RPC can serve closure proofs at all (I assumed not, based on `eth_getProof` shape — a costing/prototype question, E2-adjacent); the final envelope/principal identity (seam 1/2 open — AF-5's severity depends on the recut's principal representation); no cost claim here is measurement-backed, consistent with [[owner-rulings#2026-07-23]] ("none of the chain/authority space is measurement-backed yet").
