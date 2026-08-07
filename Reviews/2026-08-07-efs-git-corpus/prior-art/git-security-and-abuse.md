# Git Security, Abuse, and Moderation — the threat evidence base

**Lane:** Git-specific security, abuse, and moderation — researched 2026-08-07

Evidence labels used throughout: **[SHIPPED]** = implemented/observed behavior, **[INTENT]** = documented plan, **[REC]** = my recommendation for EFS, **[SPEC]** = speculation. Every load-bearing claim is linked.

---

## 1. Malicious packs: what a server that admits untrusted objects must survive

### 1.1 Git bombs — exponential tree expansion

**[SHIPPED]** Kate Murphy's `git-bomb` (Oct 2017) is **12 objects total**: one blob, referenced ten times by a tree, then nine successive layers of tree objects each holding ten references to the layer below, with the ref pointing at the top tree. It materializes to **~1 billion files** ([kate.io/blog/git-bomb](https://kate.io/blog/git-bomb/)). Assigned **CVE-2017-15298**; disclosed through GitHub's HackerOne with a bounty in Oct 2017.

The failure mode matters for EFS: it is **OOM, not disk exhaustion** — "git builds the tree in memory before writing files to disk," so `git status` / `git checkout` dies before writing much ([kate.io](https://kate.io/blog/git-bomb/)). A second variant uses ~15,000 *nested* trees and "ends up blowing up the stack and causing a segfault." The mechanism is git's own deduplication of tree objects, exactly analogous to the XML billion-laughs attack ([kate.io/blog/making-your-own-exploding-git-repos](https://kate.io/blog/making-your-own-exploding-git-repos/), [The Register, 2017-10-14](https://www.theregister.com/2017/10/14/git_it_and_quit_it_tiny_code_repository_will_knock_your_machine_over/)).

**Key structural point for EFS:** expansion happens at **materialization** (checkout, tree walk, render), not at **admission**. A component that only stores and serves packs is unaffected. A component that renders Markdown, builds a file tree for a lens, computes a diff, or runs a wiki index **is** the vulnerable surface. There is no git config that bounds tree fan-out or nesting depth.

### 1.2 zlib / delta amplification — a live 2026 example

**[SHIPPED]** **CVE-2026-47734** (dulwich), published 2026-06-08, CVSS 3.1 **5.7** (`AV:N/AC:L/PR:L/UI:R/S:U/C:N/I:N/A:H`), CWE-400 + CWE-789, affects 0.1.0 → 1.2.4, fixed in **1.2.5** ([GitLab Advisory DB](https://advisories.gitlab.com/pypi/dulwich/CVE-2026-47734/), GHSA-xrvj-v92f-53gj). A client with push access sends a **~174-byte crafted thin pack** whose delta header declares a huge `dest_size`; `add_thin_pack` / `apply_delta` allocates hundreds of MB with no relationship to bytes received — **>1000× amplification**. Impacts anything built on `dulwich.server`, the HTTP smart server, or `ReceivePackHandler`.

Dulwich's fix bounds zlib decompression of pack entries and loose objects, caps inflated size at the declared `decomp_len`, and honors `receive.maxInputSize` ([jelmer/dulwich releases](https://github.com/jelmer/dulwich/releases)). A companion bug, **CVE-2026-42305**, is arbitrary file write via NTFS-hostile tree entries on Windows ([GLAD](https://advisories.gitlab.com/pypi/dulwich/CVE-2026-42305/)).

**[REC]** This is the single most transferable finding in the lane. EFS will almost certainly not use canonical C git for admission — it will use `go-git`, `gitoxide`, `dulwich`, `isomorphic-git`, or JGit. **Each has its own pack parser and its own class of these bugs.** Whatever implementation admits packs must (a) enforce a byte cap on the input stream, (b) enforce a separate cap on *inflated* size per object and per pack, and (c) reject declared-size headers that exceed the remaining input by an implausible ratio.

### 1.3 The standard hardening knobs, precisely

| Config | Documented behavior | What it does *not* do |
|---|---|---|
| `receive.maxInputSize` | "If the size of the incoming pack stream is larger than this limit, then git-receive-pack will error out." ([receive.adoc](https://raw.githubusercontent.com/git/git/master/Documentation/config/receive.adoc)) | Bounds **compressed wire bytes only**. Does nothing about inflated size, delta expansion, or tree fan-out. A git bomb is ~kilobytes. |
| `receive.fsckObjects` | "If it is set to true, git-receive-pack will check all received objects." Falls back to `transfer.fsckObjects`. | Structural/semantic object checks; not resource limits. |
| `transfer.fsckObjects` | Fallback for both fetch and receive. Aborts "if malformed objects or nonexistent links are detected, including security checks for `.GIT` directories and malicious `.gitmodules` files" ([transfer.adoc](https://raw.githubusercontent.com/git/git/master/Documentation/config/transfer.adoc)). | — |
| `receive.fsck.<msg-id>` / `receive.fsck.skipList` | Per-check severity override and hash skiplist, receive-side only. | — |
| `transfer.unpackLimit` | **Default 100.** Below the limit → loose objects; at/above → stored as a pack after adding missing delta bases. | Choosing loose-object storage on small pushes is an **inode-exhaustion** lever for an attacker who sends many 99-object pushes. |
| `receive.denyDeletes` / `receive.denyNonFastForwards` | Deny ref-deleting updates / non-fast-forward updates. | Ref policy, not object policy. Relevant to EFS's append-only ambitions. |
| `git index-pack --max-input-size=<size>` | "Die, if the pack is larger than `<size>`." ([git-index-pack](https://git-scm.com/docs/git-index-pack)) | Same limitation as above. |
| `git index-pack --strict` / `--fsck-objects` | `--strict` dies on broken objects *or links*; `--fsck-objects` dies on broken objects but tolerates broken links (needed for thin/partial packs) and prints the hash of any `.gitmodules` blob it could not resolve, "for the caller to check." | — |

### 1.4 What `fsck` on receive actually catches

From [git-fsck(1)](https://git-scm.com/docs/git-fsck), the security-relevant message IDs and their **default severities**:

- `gitmodulesUrl` (**ERROR**) — invalid submodule URL. This is the check that stops the `ssh://-oProxyCommand` class of submodule RCE.
- `gitmodulesPath` (**ERROR**), `gitmodulesSymlink` (**ERROR**) — `.gitmodules` path invalid / is a symlink.
- `gitattributesSymlink`, `gitignoreSymlink`, `mailmapSymlink` (**INFO** — i.e. silent by default).
- `hasDot`, `hasDotdot`, `hasDotgit` (**WARN**) — tree entries named `.`, `..`, `.git`.
- `fullPathname` (**WARN**) — path starting with `/`. `largePathname` (**WARN**) — default max 4096 bytes.
- `badFilemode` (**INFO**), `zeroPaddedFilemode` (**WARN**), `duplicateEntries` (**ERROR**), `nullSha1` (**WARN**).
- Core integrity: `hash mismatch` (object whose hash doesn't match the DB value — "a serious data integrity problem"), `missing <type> <object>`, `unreachable`.

**[REC] Two traps.** (1) **WARN and INFO do not abort.** `hasDotgit` — the tree-level primitive behind the `.git`-directory-write CVEs — is only a WARN by default. If EFS enables fsck at admission it must explicitly raise `hasDotgit`, `hasDotdot`, `gitattributesSymlink`, `nullSha1`, `zeroPaddedFilemode` to `error` via `receive.fsck.<msg-id>=error`. (2) **fsck is not free operationally.** Enabling `transfer.fsckObjects` historically broke clones of real projects with legacy-but-benign objects (see [pallets/flask#2065](https://github.com/pallets/flask/issues/2065), [ohmyzsh#4963](https://github.com/ohmyzsh/ohmyzsh/issues/4963) `zeroPaddedFilemode`). git's own docs acknowledge fsck "may find issues with legacy data which wouldn't be generated by current versions of git" ([transfer.adoc](https://raw.githubusercontent.com/git/git/master/Documentation/config/transfer.adoc)). For a **permanent** store this is a one-way door: strictness you don't apply at admission can never be applied later.

### 1.5 commit-graph / multi-pack-index — mostly a non-issue, with one exception

**[SHIPPED]** commit-graph and midx are **local accelerator files built from the object store**, not objects carried by the wire protocol ([gitformat-chunk](https://git-scm.com/docs/gitformat-chunk), [multi-pack-index](https://git-scm.com/docs/multi-pack-index)). Historical parser bugs exist (e.g. [SZEDER's chunk-lookup fix, 2020](https://public-inbox.org/git/20200529085038.26008-3-szeder.dev@gmail.com/); [peff's "segfault & other fixes for broken graphs", 2019](https://public-inbox.org/git/20190501183108.GE4109@sigill.intra.peff.net/t/)) but they are reachable only if you *accept* a peer-supplied graph file. I found no CVE for commit-graph/midx parsing from an untrusted remote in 2022–2026.

**The exception is bundle URIs.** `transfer.bundleURI` (default `false`) makes clone fetch and apply remote-supplied *bundle* files ([transfer.adoc](https://raw.githubusercontent.com/git/git/master/Documentation/config/transfer.adoc)) — and **CVE-2025-48385** is exactly a "bundle validation bypass during clone ... protocol injection and potential code execution via arbitrary file writes," fixed in 2.50.1 ([GitHub Blog, 2025-07-08](https://github.blog/open-source/git/git-security-vulnerabilities-announced-6/)). This matters because bundle-URI is precisely the mechanism a chain-anchored system reaches for to bootstrap clones from cheap storage (Arweave / EthStorage).

**[REC]** Never accept a peer-supplied commit-graph, midx, bitmap, or bundle as authoritative. Regenerate accelerators locally; if bundles are used for bootstrap, verify the bundle's tip OIDs against the on-chain record *before* applying, and keep `transfer.bundleURI` off for the general client path.

### 1.6 Git CVEs 2022–2026 relevant to handling untrusted repos/packs

| CVE | Date / fix | Mechanism | Relevance to EFS |
|---|---|---|---|
| CVE-2022-23521 | 2023-01 / ≥2.30.7…2.39.1 | Integer overflow parsing `.gitattributes` (too many patterns / attributes / long names) → undersized alloc → heap overflow. Lines >2KB are truncated when read from a file but **not** when read from the index ([SentinelOne](https://www.sentinelone.com/vulnerability-database/cve-2022-23521/), [Atlassian advisory](https://confluence.atlassian.com/security/multiple-products-security-advisory-git-buffer-overflow-cve-2022-41903-cve-2022-23521-1189805967.html)) | Any lens that honors repo-supplied `.gitattributes` inherits this parser. |
| CVE-2022-41903 | 2023-01 / same | `size_t` stored as `int` in `pretty.c::format_and_pad_commit()` padding operators (`%<(`, `%>(`…) → arbitrary heap writes → RCE. Reachable via `git log --format` **and via `git archive` with `export-subst`** | A server rendering commit metadata with user-controlled format strings, or serving archives, is exposed. |
| CVE-2024-32002 | 2024-05-14 / 2.45.1 | **Critical.** Submodules + case-insensitive FS + symlinks → git writes "files not into the submodule's worktree but into a `.git/` directory," so hooks execute during clone ([GitHub Blog](https://github.blog/open-source/git/securing-git-addressing-5-new-vulnerabilities/)) | Clone-time RCE from repo content alone. |
| CVE-2024-32004 | 2024-05-14 / 2.45.1 | High. Crafted local repo posing as a partial clone → "arbitrary code during the operation with full permissions of the user performing the clone" | Any EFS worker that clones a locally-materialized repo. |
| CVE-2024-32465 | 2024-05-14 / 2.45.1 | High (Jeff King). A `.zip` containing a full repo carries configured hooks and "should not automatically be considered safe" | Kills the "just ship a repo tarball" import path. |
| CVE-2024-32020 / -32021 | 2024-05-14 / 2.45.1 | Low. Insecure hardlinks; symlink abuse hardlinking arbitrary user-readable files into `objects/` | Multi-tenant workers sharing a filesystem. |
| CVE-2025-48384 | 2025-07-08 / 2.43.7, 2.44.4, 2.45.4, 2.46.4, 2.47.3, 2.48.2, 2.49.1, 2.50.1 | CVSS **8.0**. Git strips trailing CRLF on config *read* but doesn't quote trailing CR on *write*; a submodule path with trailing CR checks out to the wrong location; a symlink there pointing at the submodule hooks dir makes `post-checkout` execute ([NVD](https://nvd.nist.gov/vuln/detail/cve-2025-48384)) | Pure repo-content → code execution. Two years after 32002, same class. |
| CVE-2025-48385 | 2025-07-08 / 2.50.1 | Bundle validation bypass during clone → protocol injection / arbitrary file write | See §1.5. |
| CVE-2025-48386, -46334, -46835, -27613, -27614 | 2025-07-08 / 2.50.1 | Wincred buffer overflow; Git GUI / gitk arbitrary file write and script execution from crafted repos ([GitHub Blog](https://github.blog/open-source/git/git-security-vulnerabilities-announced-6/)) | Client-side; matters for a desktop EFS client. |
| CVE-2026-47734 | 2026-06-08 / dulwich 1.2.5 | 174-byte thin pack → hundreds of MB alloc | §1.2. |
| CVE-2026-3854 | reported 2026-03-04, fixed same day; GHES 3.14.25+, 3.15.20+ | **GitHub-specific, not upstream git.** User-supplied `git push` **option values** were incorporated into internal metadata "without sufficient sanitization"; a delimiter character let an attacker inject fields a downstream service treated as trusted internal values → RCE ([GitHub Blog](https://github.blog/security/securing-the-git-push-pipeline-responding-to-a-critical-remote-code-execution-vulnerability/), [Wiz](https://www.wiz.io/blog/github-rce-vulnerability-cve-2026-3854)) | **Most relevant single CVE for EFS.** The bug was not in git; it was in the glue that carried untrusted push metadata into a trusted internal format. EFS's admission path is exactly that glue. |

**[SHIPPED]** Git's own posture: it has **no LTS**. "Fixes to vulnerabilities are made for the maintenance track for the latest feature release and merged up to the in-development branches"; "The Git project makes no formal guarantee for any older maintenance tracks to receive updates" ([SECURITY.md](https://raw.githubusercontent.com/git/git/master/SECURITY.md)). The project's stated bar is that "cloning even untrustworthy repositories should be a safe operation" ([GitHub Blog, 2024-05-14](https://github.blog/open-source/git/securing-git-addressing-5-new-vulnerabilities/)) — an aspiration the CVE record shows is violated roughly annually.

Transport allowlist **[SHIPPED]**: `protocol.<name>.allow` takes `always` / `never` / `user`; `user` means "only when `GIT_PROTOCOL_FROM_USER` is either unset or has a value of 1." `file` and `ext` default to `user` specifically so recursive submodule init cannot invoke them "without user input" ([protocol.adoc](https://raw.githubusercontent.com/git/git/master/Documentation/config/protocol.adoc)).

---

## 2. SHA-1 in 2026: the actual risk model

### 2.1 Attack cost, current

- **[SHIPPED]** SHAttered, **2017-02-23**: identical-prefix collision, ~9 quintillion SHA-1 computations ≈ **6,500 CPU-years + 110 GPU-years**, demonstrated as two PDFs sharing `38762cf7f55934b34d179ae6a4c80cadccbb7f0a` ([shattered.io](https://shattered.io/)).
- **[SHIPPED]** SHA-mbles, **Jan 2020**: first **chosen-prefix** collision, ~**US$45k** of rented GPU, two months on 900 GTX 1060s; authors projected **<$10k by 2025** ([sha-mbles.github.io](https://sha-mbles.github.io/), [eprint 2020/014](https://eprint.iacr.org/2020/014.pdf)).
- **[SHIPPED]** drand's 2025-01-31 recomputation: RTX 5090 ≈ **68 GH/s** SHA-1 (4090 ≈ 51 GH/s). Identical-prefix (2^61.6) ≈ **1.61 GPU-years**; chosen-prefix (2^63.4) ≈ **5.6 GPU-years**, i.e. **8× rented RTX 4090s for under 5 days at ~$12,000**, or two retail 5090s (~$3,998) plus ~413 days of electricity (~$5,065) for **under $10,000** — the 2020 prediction held. Attack complexity fell 110 GPU-years (2017) → ~8 (2020) → **<2 today** ([drand blog](https://docs.drand.love/blog/2025/01/31/how-many-5090-to-break-sha1/)).

**Bottom line:** in 2026 a chosen-prefix SHA-1 collision is a **five-figure, sub-week** expense for anyone with a credit card. It is not nation-state-only.

### 2.2 SHA-1DC — what it does and precisely where it stops

**[SHIPPED]** Git v2.13.0+ uses hardened SHA-1 and "is not vulnerable to the SHAttered attack" ([hash-function-transition](https://git-scm.com/docs/hash-function-transition)). The library monitors **32 top disturbance vectors** and detects "any cryptanalytic collision attack against SHA-1 using any of the top 32 SHA-1 disturbance vectors **with probability 1**," false-positive probability **< 2^-90**, at **less than 2×** the cost of plain SHA-1. "Safe-hash" mode returns the true SHA-1 for clean input but an unpredictable different hash when an attack is detected ([sha1collisiondetection README](https://raw.githubusercontent.com/cr-marcstevens/sha1collisiondetection/master/README.md)).

Three limits that matter:

1. It detects **known attack families**, not collisions in general. A new disturbance vector defeats it. The README is explicit that "theoretically other collision methods could exist."
2. It converts a collision into a **denial of service** — git dies rather than silently mis-resolving. For EFS that is the *right* failure, but it is a failure: an attacker who finds any DV-32 collision can make specific objects permanently un-ingestable.
3. **It only protects bytes that are hashed by a SHA-1DC implementation.** This is the crux for EFS.

**[REC] The EFS-specific risk.** If EFS records signed statements that pin a 40-hex git OID — "principal P attests that `refs/heads/main` of repo R is `abc123…`" — then the *signature* covers the OID string, not the object bytes. SHA-1DC gives you nothing unless the verifier that maps OID → bytes is itself SHA-1DC-hardened. Any of the following bypasses it: an EVM contract comparing 20-byte digests; a mirror that indexes with plain SHA-1; a JS/Rust client using a stock SHA-1; a content-addressed blob store keyed on plain SHA-1. **If EFS ever hashes git object bytes outside canonical git, it must use SHA-1DC or refuse SHA-1 repos.**

### 2.3 SHA-256 transition state as of August 2026

**[INTENT]** Per git's own [BreakingChanges](https://git-scm.com/docs/BreakingChanges) doc, Git 3.0 will: default **new** repos to SHA-256 (SHA-1 object format is **not removed**); default the ref backend to **reftable**; default the branch name to `main`; flip `safe.bareRepository` from `all` to `explicit` (refusing implicit discovery of bare repos via directory traversal — a hook-execution hardening); and make **Rust mandatory** (Meson auto-detect in 2.52, default-enabled in both build systems in **2.55**, mandatory in 3.0). Removals include graft commits, `git-pack-redundant`, `.git/branches/` and `.git/remotes/`, `git-whatchanged`, `core.preferSymlinkRefs=true`. The doc states **no release date is planned**; the LTS plan is that the last pre-3.0 release gets 4 cycles of bug fixes and 6 of security fixes.

**[SHIPPED]** Building Git 2.51+ with `WITH_BREAKING_CHANGES` already defaults to SHA-256 ([git commit c79bb70](https://github.com/git/git/commit/c79bb70a2e7d9158ec165ea16ad45371cd6e350d), [Phoronix](https://www.phoronix.com/news/Git-2.51-rc0)). Git 2.52 (Nov 2025) continued interop work and added `git refs list` / `git refs exists` ([GitHub Blog: Highlights from Git 2.52](https://github.blog/open-source/git/highlights-from-git-2-52/)).

**[SHIPPED, blocking]** **GitHub still does not support SHA-256 repositories** ([community discussion #12490](https://github.com/orgs/community/discussions/12490)). Press consensus targets late 2026 for 3.0 but flags the forge ecosystem as the gate. Git-LFS interop is still an open design issue ([git-lfs#6190](https://github.com/git-lfs/git-lfs/issues/6190)).

### 2.4 Algorithm confusion in a mixed SHA-1/SHA-256 world

From the [hash-function-transition](https://git-scm.com/docs/hash-function-transition) design (all **[INTENT]**, partly shipped):

- **The same logical object has different bytes under each hash.** SHA-1 content references other objects by SHA-1 names; SHA-256 content references them by SHA-256 names. **Only blobs are byte-identical** across formats (they contain no references). Round-tripping requires a full translation table (`loose-object-idx` plus pack index **v3** carrying parallel tables for both formats).
- Consequences: **no shallow clones, no unfetched submodules, no `objects/info/alternates`** across formats — the translation table needs every referenced object. `git notes` migration is explicitly deferred.
- Signatures: new `gpgsig-sha256` header alongside `gpgsig`. Three modes — SHA-1 only, both, SHA-256 only. **Mode 3 (SHA-256-only) appears *unsigned* to older git.** That is a silent verification downgrade, not an error.
- The design doc names its own residual ambiguity: a signed payload containing `object e7e07d5a…` (40 hex) "no longer explicitly names which hash was used" if another 40-digit hash is ever adopted.
- Serving SHA-1 clients from a SHA-256 repo requires expensive on-the-fly re-encoding and is "**strongly discouraged**" for public-facing servers.

**[REC]** Every EFS record that pins a git OID **must carry an explicit algorithm tag and the repo's `objectFormat`**, and lenses must refuse to resolve an OID whose algorithm is not stated. Otherwise a single 40-hex string is ambiguous across (a) SHA-1 content, (b) a future 40-digit hash, and (c) the SHA-1 *view* of an object whose canonical SHA-256 identity differs. Signature-over-OID does not disambiguate; only an explicit tag does. **[SPEC]** If EFS launches SHA-256-native it dodges this entirely but cuts itself off from importing existing repos without a translation table it must then store permanently.

---

## 3. Ref/signature replay: stale-but-validly-signed state

### 3.1 The attack class is 10 years old and well characterized

**[SHIPPED]** Torres-Arias, Ammula, Curtmola & Cappos, **USENIX Security '16**, "On Omitting Commits and Committing Omissions": metadata-manipulation attacks are a distinct threat class against VCSs. They "provide inconsistent views of a repository state to different developers," causing "omitting security patches, merging untested code into a production branch, and even inadvertently installing software containing known vulnerabilities," and are "**subtle by nature and leave no trace after being executed**" ([NYU CCS](https://cyber.nyu.edu/2016/08/10/omitting-commits-committing-omissions-preventing-git-metadata-tampering-re-introduces-software-vulnerabilities/), [paper PDF](https://ssl.engineering.nyu.edu/papers/torres_toto_usenixsec-2016.pdf)). Their defense is a cryptographically signed log of developer actions — the **Reference State Log (RSL)**.

The essential point: **signed commits and signed tags do not bind *which ref points where, when*.** Every object a replay attacker serves is validly signed. The missing property is freshness/monotonicity of the *ref → OID* mapping.

### 3.2 TUF snapshot + timestamp — the canonical fix, stated precisely

From the [TUF specification](https://theupdateframework.github.io/specification/latest/):

- **snapshot** "signs a metadata file that provides information about the latest version of all targets metadata on the repository." `snapshot.json` maps metadata paths → **version numbers**, optionally with length and hash. Because a single signed document fixes the version of *every* targets file simultaneously, it prevents **mix-and-match attacks** (splicing metadata from different points in time) and enables **rollback detection** (version numbers must not decrease).
- **timestamp** lists the current snapshot version plus snapshot's hash and length, is re-signed frequently on a **short expiry**, and is the only role that must hold an **online key**. It defeats **indefinite freeze / replay**: an attacker "cannot provide the same, outdated metadata without the client being aware of the problem." The spec notes the online-key risk is "minimal" precisely because timestamp has narrow authority — it vouches only for snapshot, never for targets.
- **Freshness check:** "the expiration timestamp in the new [timestamp/snapshot] metadata file MUST be higher than the fixed update start time" — the client pins a start time and rejects anything expiring before it.
- **Endless-data defense:** clients download metadata "up to either the number of bytes specified in the [prior metadata] file, or some [application-defined] number of bytes," so a malicious mirror cannot stream unbounded data.

So the canonical fix is three orthogonal things, not one: **(1) monotone version numbers, (2) short-lived signed freshness attestation from an online key with narrow authority, (3) hard byte caps derived from prior signed metadata.**

### 3.3 gittuf — git-native TUF, and its own rollback CVE

**[SHIPPED]** gittuf applies this to git directly. It is a "platform-agnostic Git security system" whose enforcement is independent of the forge, removing "the forge as a single point of trust"; it is an **OpenSSF Supply Chain Integrity WG incubating project** and explicitly **in beta**, recommended "in addition to existing repository security mechanisms" rather than as a replacement ([gittuf README](https://raw.githubusercontent.com/gittuf/gittuf/main/README.md)).

Mechanics: the RSL lives at **`refs/gittuf/reference-state-log`** and policy at `refs/gittuf/policy`, in the `refs/gittuf/*` namespace. It is "similar to Git's reflog but actually embedded in the repository and authenticated using signatures on each individual entry," recording branch movements **and policy changes** as a hash chain ([LWN, 2024-05-08](https://lwn.net/Articles/972467/)). Users record with `gittuf rsl record`; verification is `gittuf verify-ref` against a `targets` policy file signed by root-designated keys, initialized with `gittuf trust init` ([get-started.md](https://raw.githubusercontent.com/gittuf/gittuf/main/docs/get-started.md)). Formalized in NDSS 2025, "Rethinking Trust in Forge-Based Git Security" ([paper](https://www.ndss-symposium.org/wp-content/uploads/2025-1008-paper.pdf)).

Stated limits: gittuf "doesn't prevent code from being malicious — only that policies were followed before merge," and cannot stop social-engineering like the xz incident ([LWN](https://lwn.net/Articles/972467/)).

**[SHIPPED — and the most instructive datapoint in this section]** **CVE-2026-44544**, published **2026-05-07** (upd. 2026-05-14), CVSS **5.3** (`AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:N`), CWE-639, all versions **< 0.14.0**, fixed in **0.14.0** (commit `dd76efa5`): "An attacker with push access to gittuf's Reference State Log (RSL) can roll back the current policy to any previous policy trusted by the current set of root keys" ([GLAD](https://advisories.gitlab.com/golang/github.com/gittuf/gittuf/CVE-2026-44544/), GHSA-vxvc-cg7j-rwqj).

**Lesson:** a system purpose-built for anti-rollback shipped a rollback bug because it enforced monotonicity on the *ref state* but not on the *policy state*. Any EFS design with a mutable-but-signed policy/lens/ACL object needs the same monotone-version discipline as the data it governs.

### 3.4 Witness cosigning

**[SHIPPED]** The [C2SP `tlog-witness`](https://github.com/C2SP/C2SP/blob/main/tlog-witness.md) protocol: a witness is an HTTP service with a name and public key that, before cosigning a new checkpoint, **verifies a Merkle consistency proof** that the new checkpoint extends the state it previously observed. Output is a **timestamped cosignature**; "the timestamp MUST NOT be zero"; witnesses should refresh served checkpoints within an hour. Goal: "it must not be possible to partition clients from monitors, either by splitting the tree or by serving a stale view." This defeats **split-view / equivocation** and staleness simultaneously.

**[REC] The EFS mapping.** An EFS on-chain ref record *is structurally* TUF's timestamp+snapshot and a tlog witness, if and only if clients use it that way:

1. **Bind every ref-advance record to a block number/height.** Chain consensus supplies the witness (many independent parties see one ordering) and the monotone counter (height) for free — this is EFS's genuine structural advantage over forges.
2. **Clients must check recency, not just signature validity.** Reject a served ref state whose anchoring record is older than the newest record the client has *ever seen for that repo* (a local high-water mark — TUF's version check), and warn/refuse past a staleness horizon in blocks (TUF's expiry).
3. **Bound bytes by prior signed metadata.** Record the expected pack/object byte size in the on-chain record so mirrors cannot mount an endless-data attack against a client that trusts the record (TUF §endless data).
4. **Apply the same monotonicity to lens/policy state** (per CVE-2026-44544).

---

## 4. Secrets committed to public history — scale, and what remediation actually is

### 4.1 Scale

**[SHIPPED]** GitGuardian **State of Secrets Sprawl 2026** (published ~March 2026), analysing billions of public GitHub commits ([report blog](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/), [PR](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026-pr/)):

- **28.65 million** new hardcoded secrets in public GitHub in 2025, **+34% YoY** — "the largest single-year jump we've recorded." Since 2021, leaked secrets grew **152%** while the public developer base grew 98%.
- **64% of credentials confirmed valid in 2022 were still exploitable in January 2026.** This is the remediation-reality number.
- AI-service secrets: **1,275,105** (+81% YoY), including **113,000 leaked DeepSeek API keys**; 8 of the 10 fastest-growing detector types are AI services.
- **Internal/private repos are ~6× more likely** than public repos to contain hardcoded secrets.
- AI-assisted commits leak at **3.2%** vs a **1.5%** baseline across all public GitHub commits.
- ~**28%** of incidents originate entirely outside repositories (Slack, Jira, Confluence).

**[SHIPPED]** GitHub-side: 39M secrets leaked platform-wide in 2024, with push protection catching 4.4M — meaning **~34.6M got through** ([GitGuardian analysis](https://blog.gitguardian.com/github-push-protection-enhancing-open-source-security-with-limitations-to-consider/)). Push protection scans at push time across CLI, web UI, file upload, REST API and the GitHub MCP server; it "**is enabled by default**" for pushes to public repositories, and bypass requires a stated reason that is logged to the audit log and raises an alert ([GitHub Docs: Push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)). Detector coverage continues to expand ([GitHub Changelog, 2026-03-31](https://github.blog/changelog/2026-03-31-github-secret-scanning-nine-new-types-and-more/)).

### 4.2 Remediation reality — GitHub's own position is "rotate, don't delete"

**[SHIPPED]** From [GitHub's own docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository):

> "if the sensitive data you need to remove is a secret (e.g. password/token/credential)…you need to revoke and/or rotate that secret. Once the secret is revoked or rotated, it can no longer be used for access, and that may be sufficient to solve your problem."

and, on why deletion doesn't work even on a mutable forge — deleted commits remain accessible:

> "In any clones or forks of your repository; Directly via their SHA-1 hashes in cached views on GitHub; Through any pull requests that reference them"

and, on the limits of support-assisted removal:

> "GitHub Support won't remove non-sensitive data, and will only assist in the removal of sensitive data in cases where we determine that the risk can't be mitigated by rotating affected credentials."

Forks are explicitly not cleaned: "If the commit that introduced the sensitive data exists in any forks, it will continue to be accessible there."

**[REC] What this means for an undeletable history.** This is the strongest empirical argument that EFS's undeletability is *survivable for credentials specifically*: the industry's own remediation standard is rotation, and deletion on GitHub is already unreliable in practice (forks, caches, PR refs). EFS is not creating a new problem class for secrets — it is removing a comfort blanket that was already thin. **But** the 64%-still-valid-after-three-years figure says rotation frequently does not happen. Since post-hoc rewrite is unavailable to EFS **by construction**, the *only* place EFS gets leverage is the write path. Push-time secret detection should be a **hard gate at admission**, not an advisory alert, and the bypass path should be an explicit, signed, publicly visible record.

**The real undeletability problems are not API keys.** Rotation cannot fix: personal data (GDPR erasure), doxxing, non-consensual imagery, CSAM, copyrighted works under valid DMCA, or long-lived code-signing keys with an installed trust base. Those categories are why §5.3's serving/storage separation exists.

---

## 5. Forge abuse: spam, malware, and the moderation precedents

### 5.1 Current abuse scale (2025–2026)

- **FakeGit, July 2026** (Island researchers, following Straiker AI and Derp.ca): ~**7,600 malicious repositories** across ~6,600 profiles; **>800 posing as AI skills or MCP servers**; payload SmartLoader → StealC infostealer, delivered as ZIP archives via **GitHub Release assets** with a LuaJIT loader chain; **>14 million downloads** across ~200 campaign repos; **>600 listings on public MCP/skill registries** (LobeHub, Glama, MCP.so, MCP Market) for laundered legitimacy. The report names an "**AgentBaiting**" technique in which AI coding agents autonomously discover and execute the malicious repos ([The Hacker News, 2026-07](https://thehackernews.com/2026/07/fakegit-campaign-uses-7600-github.html)).
- **June 2026 cloning campaign:** ~**10,000 cloned repositories** with realistic commit history and contributor names, malware behind a README download link; attackers re-push identical commits every few hours to stay "active" in listings.
- **Typosquatting:** `@acitons/artifact` (missing `t`) with a payload that fires **only inside GitHub Actions**, **>47,000 downloads** ([SC Media](https://www.scworld.com/news/malicious-npm-package-uses-typosquatting-to-infect-legitimate-github-repo)).
- **Mutable-tag supply chain: `tj-actions/changed-files`, CVE-2025-30066**, March 14–15 2025, CVSS **8.6**, EPSS 72.4% (99th pct). Attackers **retroactively repointed multiple version tags** (v1.0.0, v35.7.7-sec, v44.5.1, …) at a malicious commit `0e58ed86…`; the payload scanned Runner Worker memory for secrets, base64'd them, and **logged them into public build logs**. **>23,000 repositories** affected; fix in v46.0.1; official remediation is **pin actions by commit SHA, not by tag** ([GHSA-mrrh-fwg8-r2c3](https://github.com/advisories/ghsa-mrrh-fwg8-r2c3)).

**[REC/observation]** The tj-actions attack is the strongest *positive* argument for EFS's model in this entire lane: **the whole attack was mutable name→content binding.** Content-addressed, append-only, signed ref history structurally eliminates it. Say so explicitly in the design rationale — but note the corollary in §7: EFS only gets this if its *human-readable* names are also non-reclaimable.

### 5.2 Moderation and takedown precedents

**[SHIPPED]** GitHub 2025 transparency report (reported 2026-04-19): **2,661 DMCA notices processed**, **47,228 repositories/projects removed** (**+51.6% vs 2024**), **645 §1201 anti-circumvention claims** (**+41% YoY**, up from 18 in 2015 and 365 in 2022). Two months accounted for nearly half the year — **12,030 in August and 11,357 in November** — i.e. enforcement is dominated by bulk complaints, not steady-state ([TorrentFreak, 2026-04-19](https://torrentfreak.com/github-reports-dmca-takedown-record-and-surging-anti-circumvention-claims/), [Gigazine](https://gigazine.net/gsc_news/en/20260421-dmca-github/)). A single Nintendo circumvention notice in March 2025 removed **>4,300 repositories**.

**[SHIPPED]** Process details from [GitHub's DMCA Takedown Policy](https://docs.github.com/en/site-policy/content-removal-policies/dmca-takedown-policy):
- Users get "**approximately 1 business day** to delete or modify the content specified in the notice" before GitHub acts.
- **Forks are not automatically disabled**: "GitHub does not conduct any independent investigation into forks." Takedowns reach forks only "in rare circumstances when a claimant identifies all existing forks at the time of submission."
- Counter-notice: if the claimant does not file a court complaint within **10–14 days**, "GitHub will re-enable the disabled content."
- All notices published redacted at [github/dmca](https://github.com/github/dmca).

**[SHIPPED]** Policy stance: "restrict content in the narrowest way possible to address violations," give users a chance to appeal, and review each case individually rather than applying automatic three-strikes suspension — explicitly because open-source developers routinely fork ([GitHub Blog, 2025-09-26, upd. 2026-03-26](https://github.blog/news-insights/policy-news-and-insights/how-github-protects-developers-from-copyright-enforcement-overreach/)).

**[SHIPPED]** [GitHub Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies) define eleven prohibited categories. Notable for EFS: the CSAM clause bans content that "is sexually obscene or relates to sexual exploitation or abuse, including of minors"; the malware clause has an explicit **dual-use carve-out** — prohibited only where content "directly supports unlawful active attack or malware campaigns…with no implicit or explicit dual-use purpose prior to the abuse occurring" (security research and bug bounty work stay permitted); the spam clause covers "automated excessive bulk activity," cryptocurrency mining, fake accounts, and engagement "incentivized by…cryptocurrency airdrops, tokens, credits, gifts or other give-aways." Enforcement means are "account suspension, account termination, or removal of content."

### 5.3 Serving policy vs storage — the precedents EFS should copy

**[SHIPPED] IPFS Bad Bits.** A denylist of **hashed** CIDs flagged for "copyright violation, malware, etc.," whose purpose is "to allow IPFS node operators…to **opt into not hosting** previously flagged content" ([badbits.dwebops.pub](https://badbits.dwebops.pub/)). Legacy entries are SHA2-256 over base32 CIDv1 strings with optional paths; current entries use the **Compact Denylist Format**, supported by Kubo and rainbow. **Double-hashing** lets a blocklist be published without republishing the bad identifiers. Crucially, its scope is stated as **Protocol Labs' and the IPFS Foundation's own public-good gateways (`ipfs.io`, `dweb.link`) — not the network.** Gateways return **410 Gone** for non-legal blocks and **451 Unavailable For Legal Reasons** for legal ones ([IPIP-383 / ipfs/specs#299](https://github.com/ipfs/specs/pull/299), [Kubo content-blocking docs](https://github.com/Jaival/kubo/blob/master/docs/content-blocking.md)). Gateways "can select which lists they might subscribe to, or unsubscribe if the list no longer meets their expectations."

**[SHIPPED] Arweave / ar.io.** "Each gateway operating on the network has the **right and ability to blocklist** any content, ArNS name, or address that is deemed in violation of its content policies or non-compliant with local regulations," with distinct per-region blocklists ([ar.io docs](https://docs.ar.io/learn/gateways), [AR.IO whitepaper](https://whitepaper.ar.io/)). The whitepaper is explicit that "there are no built-in disincentives in the network's protocol to discourage censorship as there may be valid reasons such as blocking of copyrighted material or malicious programs." Base layer permanent; access layer discretionary.

**[SHIPPED] Regulatory pressure lands on the serving layer.** Ofcom opened an enforcement programme on **2025-03-17** into "measures being taken by file-sharing and file-storage services to prevent users from encountering or sharing CSAM," and issued a revised provisional notice of contravention to the Im.ge provider on **2026-07-29** ([Ofcom](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/enforcement-programme-into-measures-being-taken-by-file-sharing-and-file-storage-services-to-prevent-users-from-encountering-or-sharing-child-sexual-abuse-material-csam)). Separately the EU let the temporary ePrivacy derogation for voluntary CSAM detection **expire on 2026-04-03** without replacement, with the permanent CSAR stalled ([casescan analysis](https://casescan.com/blog/eu-eprivacy-derogation-csam-detection-platforms/)) — meaning the compliance landscape for *scanning* is currently less settled than for *serving*. US-side, over-reporting also carries liability: *Lawshe v. Verizon* let a suit over a mistaken CSAM report proceed ([Perkins Coie](https://perkinscoie.com/insights/blog/can-providers-be-sued-mistaken-csam-reports-maybe-says-new-ruling-0), [Goldman blog, 2025-03](https://blog.ericgoldman.org/archives/2025/03/verizon-and-its-cloud-vendor-must-face-lawsuit-for-reporting-csam-that-wasnt-lawshe-v-verizon-guest-blog-post.htm)).

**[REC] The three-layer separation EFS should adopt explicitly:**
1. **Chain / admission** — records signed claims. No deletion, no content policy, no discretion. This is what "credibly neutral" means and it is the only layer that must be neutral.
2. **Storage / mirrors** — replication. May decline to replicate anything; declining is not censorship because anyone can run another mirror.
3. **Gateway / lens** — named serving policy, per-jurisdiction. Double-hashed denylists (so the blocklist is publishable), **410 vs 451** status distinction (so blocks are auditable and their *reason class* is legible), and the policy itself **versioned, published, and attested on-chain** so a lens's neutrality claims are checkable. Multiple lenses over one substrate is the exit guarantee.

This is not a novel EFS invention; it is IPFS's and Arweave's shipped architecture, and EFS should cite them rather than re-derive.

---

## 6. Rendered-Markdown attacks and executable repo content

### 6.1 Markdown/HTML XSS on forges is a live, recurring class

- **GitLab CVE-2025-12716**, published **2025-12-10**, CVSS **8.7** with **changed scope** (`AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N`): "could have allowed an authenticated user to perform unauthorized actions on behalf of another user by **creating wiki pages with malicious content**." Affects 18.4 < 18.4.6, 18.5 < 18.5.4, 18.6 < 18.6.2 ([NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-12716)).
- Companions in the same window: **CVE-2025-8405**, **CVE-2025-12029**, **CVE-2025-9642**, and **CVE-2025-7739** (stored XSS via scoped label descriptions, 18.2 < 18.2.2). A GitLab Flavored Markdown stored XSS affected 18.2.2 → 18.5.5, 18.6 → 18.6.3, 18.7 → 18.7.1 ([cybersecuritynews summary](https://cybersecuritynews.com/gitlab-vulnerabilities/), [ZeroPath on CVE-2025-7739](https://zeropath.com/blog/gitlab-cve-2025-7739-stored-xss-summary)).
- Historically, **mermaid rendering in GitLab Flavored Markdown was itself an XSS vector** ([gitlab-ce#54231](https://gitlab.com/gitlab-org/gitlab-ce/-/issues/54231)); wiki-page stored XSS has been reported repeatedly via HackerOne ([report 526325](https://hackerone.com/reports/526325)).
- **Renderer DoS:** GitHub's `cmark-gfm` has a sustained record of polynomial-time-complexity bugs — **CVE-2022-39209** (autolink extension, fixed 0.29.0.gfm.6), **CVE-2023-22483** and **CVE-2023-22484** (plus -22485/-22486, fixed 0.29.0.gfm.7), where "various commands, when piped to cmark-gfm with large values, cause the running time to increase quadratically." A related unauthenticated DoS via the public markdown API was reported on HackerOne ([report 1619604](https://hackerone.com/reports/1619604)). Distros were still shipping fixes in 2025 ([USN-7319-1](https://ubuntu.com/security/notices/USN-7319-1)).

**[REC]** EFS's exposure is *worse* than a forge's, in one specific way: **on a forge you delete the malicious wiki page; under EFS you cannot.** A renderer bug is permanently exploitable against every future reader until every lens patches. Therefore: render in a **sandboxed origin/worker** with no ambient credentials, **allowlist-sanitize** output with no raw-HTML passthrough, apply **hard wall-clock and output-size budgets** to the parse, and treat client-side diagram/formula renderers (mermaid, KaTeX) as untrusted-input parsers with their own budgets. The Wikipedia-style editing UX EFS wants is exactly the surface that produced CVE-2025-12716.

### 6.2 Remote images and anonymous reading

**[SHIPPED]** GitHub proxies user-supplied images through **Camo**, generating "an anonymous URL proxy for each file" under `https://<subdomain>.githubusercontent.com/`, which "hides your browser details and related information from other users." GitHub's own stated caveat: "**Anyone who receives your anonymized URL, directly or indirectly, may view your image or video**" — Camo is an anonymity proxy, not an access control ([GitHub Docs: about anonymized URLs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls)).

**[REC] This is load-bearing for EFS's anonymous-reading claim.** A single `![](https://attacker.example/pixel.png)` in a permanent README is a **permanent, undeletable reader-deanonymization beacon** — it leaks IP, User-Agent, and read timing to a third party on every render, forever, to every reader. The same applies to remote CSS, webfonts, iframes, `<video>` posters, and SVG `<image href>`. A Camo-equivalent proxy in the lens, plus a strict CSP that forbids third-party subresource loads entirely, is **mandatory**, not a nicety. Note also that nft.storage / w3link documented pairing badbits denylists with CSP for exactly this reason ([w3link post](https://blog.web3.storage/posts/badbits-and-goodbits-csp-in-w3link)).

### 6.3 Executable repo content — confirming what does and does not transfer

**[SHIPPED, confirmed]** **Hooks and local config are NOT transferred by clone, fetch, or push.** Hooks live in `.git/hooks`, which is not under version control and is not part of the wire protocol. `git clone --local` copies "`HEAD` and everything under objects and refs directories" — objects, refs, HEAD; **not** hooks and **not** `.git/config` ([git-clone docs](https://git-scm.com/docs/git-clone)). Hooks in a fresh clone come from the **template directory** applied at `init`/`clone` time ([githooks(5)](https://git-scm.com/docs/githooks)). `git clone` also **fails** if `$GIT_DIR/objects` is or contains a symlink, "a security measure to prevent the unintentional copying of files by dereferencing the symbolic links," and `--local` "does not work with repositories owned by other users for security reasons."

**But the CVE record is largely about *breaking* that boundary**, which is why the guarantee should be treated as a property to be defended rather than assumed:

- **CVE-2024-32002** — submodule + case-insensitive FS + symlink → writes into a `.git/` directory → **hook runs during clone**.
- **CVE-2025-48384** — trailing-CR config round-trip → submodule checked out to the wrong path → symlink there into the submodule hooks dir → **`post-checkout` executes**.
- **CVE-2024-32465** — a `.zip` containing a full repo carries hooks, so archives "should not automatically be considered safe."
- **CVE-2024-32004** — a crafted local repo posing as a partial clone executes code on clone.

**[SHIPPED]** `.github/workflows` is **inert to git** — it is just a tree entry. It becomes executable only because a CI system reads and runs it. That is a forge-layer decision, not a git property. **[REC]** EFS must never auto-execute anything derived from repo content, and any EFS-side CI must treat workflow files from untrusted contributions as data (the `pull_request_target` "pwn request" class and the tj-actions incident are the ambient evidence).

### 6.4 Symlinks in trees

fsck's symlink checks are **asymmetric by default**: `gitmodulesSymlink` is **ERROR** but `gitattributesSymlink`, `gitignoreSymlink`, `mailmapSymlink` are **INFO** — silent. Tree entries named `.`, `..`, `.git` are **WARN**. **[REC]** For EFS admission, promote all of these to `error` explicitly (§1.4).

---

## 7. Repo-jacking / namespace reuse

**[SHIPPED]** Aqua Security (June 2023) sampled **1.25 million repository names** (1% of the 125M in GHTorrent) and found **36,983 exploitable — a 2.95% hit rate**; extrapolated across GitHub's 300M+ repositories that is "millions of vulnerable repositories," including repos belonging to Google and Lyft ([Aqua](https://www.aquasec.com/blog/github-dataset-research-reveals-millions-potentially-vulnerable-to-repojacking/), [Dark Reading](https://www.darkreading.com/application-security/millions-of-repos-on-github-are-potentially-vulnerable-to-hijacking)).

**Mechanism:** renaming a user or org leaves a redirect from the old namespace. "Once someone creates both `username_A` and the repository `repo_A`, the link…breaks" — the attacker now serves content at the historic URL that thousands of build files still reference. Triggers: username change, org rename, and account deletion during M&A.

**Mitigation and its failures:** GitHub's "popular repository namespace retirement" retires namespaces for repos with **>100 clones in the week before the rename**. It has been bypassed at least four times — two independent Checkmarx bypasses in 2022; a third by Joren Vrancken via account delete-and-restore resetting the retirement flag; and a fourth in **September 2023**, a race condition during account deletion/recreation that left **>4,000 packages across Go, PHP, Swift and GitHub Actions** exposed ([Checkmarx](https://checkmarx.com/blog/persistent-threat-new-exploit-puts-thousands-of-github-repositories-and-millions-of-users-at-risk/), [Checkmarx: exploited in the wild](https://checkmarx.com/blog/github-repojacking-weakness-exploited-in-the-wild-by-attackers/)). Aqua also notes the threshold "does not cover repositories that were not popular in the past but gained popularity after ownership was transferred."

**[REC] The EFS reading.** Repo-jacking is a **name-binding** failure, not a content failure — precisely the failure EFS's stable-principal + content-addressed model exists to prevent. But the guarantee is conditional: it holds only if the human-facing name resolves through a **signed, monotone principal→repo binding**, never through a re-registrable string. Any ENS-style, handle-based, or expiring-lease repo naming that permits **release-and-reclaim reintroduces repo-jacking wholesale**, and does so with *worse* consequences than GitHub because the historic references are permanent and the audience is unbounded in time. Either names must be non-reclaimable, or resolution must pin the principal ID and hard-fail (not warn) on principal change. **[SPEC]** A middle path: allow name transfer but make every resolution return `(name, principal, first-seen-height)` so clients can pin trust-on-first-use and refuse silent principal rotation.

---

## 8. Condensed implications for EFS

1. **Admission is glue code, and glue code is where the RCE was.** CVE-2026-3854 was not a git bug — it was unsanitized push metadata crossing into a trusted internal format at GitHub. EFS's chain-admission path is the same shape. Treat every field derived from a push (ref names, push options, object headers) as hostile at the serialization boundary.
2. **Bound the *inflated* size, not just the wire size.** `receive.maxInputSize` is necessary and insufficient; CVE-2026-47734 is 174 bytes → hundreds of MB. Whatever non-canonical git implementation EFS uses needs its own inflate cap.
3. **Enable fsck at admission and raise the WARN/INFO checks to ERROR.** Permanence makes admission-time strictness a one-way door: you can loosen later, never tighten.
4. **Bomb-resistance belongs in the renderer/lens, not the chain.** Nothing in git bounds tree fan-out or depth; the git-bomb only detonates at materialization.
5. **Never accept peer-supplied accelerators or bundles as authoritative** (CVE-2025-48385).
6. **SHA-1DC protects only bytes hashed by SHA-1DC.** If EFS verifies OIDs anywhere outside canonical git, use SHA-1DC or go SHA-256-native. A five-figure chosen-prefix collision is within reach in 2026.
7. **Tag every pinned OID with its hash algorithm and the repo's `objectFormat`.** The transition design guarantees the same logical object has different bytes under each hash; a bare 40-hex string is ambiguous, and `gpgsig-sha256`-only signatures read as *unsigned* to older git.
8. **Freshness is a distinct property from signature validity.** Signed commits do not bind ref→OID→time. Implement the TUF triad — monotone versions, short-lived witnessed freshness attestation, byte caps from prior signed metadata — using block height as the counter and consensus as the witness, and make clients actually check recency against a local high-water mark. Apply the same monotonicity to **policy/lens state** (CVE-2026-44544 is the cautionary tale).
9. **Undeletable history is survivable for credentials** — the industry standard is rotation, and forge deletion is already unreliable — but only if EFS makes push-time secret detection a **hard admission gate**, since post-hoc rewrite is structurally unavailable. The genuinely hard categories are personal data, illegal imagery, and valid copyright claims, not API keys.
10. **Copy the IPFS/Arweave three-layer separation verbatim:** neutral admission, discretionary replication, named per-jurisdiction serving policy with double-hashed denylists and 410/451 distinctions. Publish and attest the lens policy so neutrality is checkable rather than asserted.
11. **Camo-equivalent proxying plus a strict CSP is mandatory for the anonymous-reading claim.** A remote image in permanent Markdown is a permanent deanonymization beacon.
12. **Content-addressed append-only refs structurally kill the tj-actions attack class** — but only if human-readable names are non-reclaimable (§7). Do not give back at the naming layer what the object layer just won.

---

## Sources

- https://github.blog/open-source/git/git-security-vulnerabilities-announced-6/
- https://github.blog/open-source/git/securing-git-addressing-5-new-vulnerabilities/
- https://github.blog/security/securing-the-git-push-pipeline-responding-to-a-critical-remote-code-execution-vulnerability/
- https://github.blog/open-source/git/highlights-from-git-2-52/
- https://github.blog/news-insights/policy-news-and-insights/how-github-protects-developers-from-copyright-enforcement-overreach/
- https://github.blog/changelog/2026-03-31-github-secret-scanning-nine-new-types-and-more/
- https://www.wiz.io/blog/github-rce-vulnerability-cve-2026-3854
- https://raw.githubusercontent.com/git/git/master/Documentation/config/receive.adoc
- https://raw.githubusercontent.com/git/git/master/Documentation/config/transfer.adoc
- https://raw.githubusercontent.com/git/git/master/Documentation/config/protocol.adoc
- https://raw.githubusercontent.com/git/git/master/SECURITY.md
- https://git-scm.com/docs/git-fsck
- https://git-scm.com/docs/git-index-pack
- https://git-scm.com/docs/git-clone
- https://git-scm.com/docs/githooks
- https://git-scm.com/docs/gitformat-chunk
- https://git-scm.com/docs/multi-pack-index
- https://git-scm.com/docs/hash-function-transition
- https://git-scm.com/docs/BreakingChanges
- https://github.com/git/git/commit/c79bb70a2e7d9158ec165ea16ad45371cd6e350d
- https://www.phoronix.com/news/Git-2.51-rc0
- https://github.com/orgs/community/discussions/12490
- https://github.com/git-lfs/git-lfs/issues/6190
- https://public-inbox.org/git/20200529085038.26008-3-szeder.dev@gmail.com/
- https://public-inbox.org/git/20190501183108.GE4109@sigill.intra.peff.net/t/
- https://github.com/pallets/flask/issues/2065
- https://github.com/ohmyzsh/ohmyzsh/issues/4963
- https://kate.io/blog/git-bomb/
- https://kate.io/blog/making-your-own-exploding-git-repos/
- https://www.theregister.com/2017/10/14/git_it_and_quit_it_tiny_code_repository_will_knock_your_machine_over/
- https://advisories.gitlab.com/pypi/dulwich/CVE-2026-47734/
- https://advisories.gitlab.com/pypi/dulwich/CVE-2026-42305/
- https://github.com/jelmer/dulwich/releases
- https://nvd.nist.gov/vuln/detail/cve-2025-48384
- https://nvd.nist.gov/vuln/detail/CVE-2025-12716
- https://www.sentinelone.com/vulnerability-database/cve-2022-23521/
- https://confluence.atlassian.com/security/multiple-products-security-advisory-git-buffer-overflow-cve-2022-41903-cve-2022-23521-1189805967.html
- https://nvd.nist.gov/vuln/detail/cve-2024-32465
- https://shattered.io/
- https://sha-mbles.github.io/
- https://eprint.iacr.org/2020/014.pdf
- https://docs.drand.love/blog/2025/01/31/how-many-5090-to-break-sha1/
- https://raw.githubusercontent.com/cr-marcstevens/sha1collisiondetection/master/README.md
- https://theupdateframework.github.io/specification/latest/
- https://cyber.nyu.edu/2016/08/10/omitting-commits-committing-omissions-preventing-git-metadata-tampering-re-introduces-software-vulnerabilities/
- https://ssl.engineering.nyu.edu/papers/torres_toto_usenixsec-2016.pdf
- https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/torres-arias
- https://lwn.net/Articles/972467/
- https://raw.githubusercontent.com/gittuf/gittuf/main/README.md
- https://raw.githubusercontent.com/gittuf/gittuf/main/docs/get-started.md
- https://www.ndss-symposium.org/wp-content/uploads/2025-1008-paper.pdf
- https://advisories.gitlab.com/golang/github.com/gittuf/gittuf/CVE-2026-44544/
- https://github.com/C2SP/C2SP/blob/main/tlog-witness.md
- https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/
- https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026-pr/
- https://www.gitguardian.com/state-of-secrets-sprawl-report-2026
- https://blog.gitguardian.com/github-push-protection-enhancing-open-source-security-with-limitations-to-consider/
- https://docs.github.com/en/code-security/concepts/secret-security/push-protection
- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls
- https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies
- https://docs.github.com/en/site-policy/content-removal-policies/dmca-takedown-policy
- https://github.com/github/dmca
- https://torrentfreak.com/github-reports-dmca-takedown-record-and-surging-anti-circumvention-claims/
- https://gigazine.net/gsc_news/en/20260421-dmca-github/
- https://thehackernews.com/2026/07/fakegit-campaign-uses-7600-github.html
- https://www.scworld.com/news/malicious-npm-package-uses-typosquatting-to-infect-legitimate-github-repo
- https://github.com/advisories/ghsa-mrrh-fwg8-r2c3
- https://www.aquasec.com/blog/github-dataset-research-reveals-millions-potentially-vulnerable-to-repojacking/
- https://www.darkreading.com/application-security/millions-of-repos-on-github-are-potentially-vulnerable-to-hijacking
- https://checkmarx.com/blog/persistent-threat-new-exploit-puts-thousands-of-github-repositories-and-millions-of-users-at-risk/
- https://checkmarx.com/blog/github-repojacking-weakness-exploited-in-the-wild-by-attackers/
- https://badbits.dwebops.pub/
- https://github.com/ipfs/specs/pull/299
- https://github.com/Jaival/kubo/blob/master/docs/content-blocking.md
- https://blog.web3.storage/posts/badbits-and-goodbits-csp-in-w3link
- https://docs.ar.io/learn/gateways
- https://whitepaper.ar.io/
- https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/enforcement-programme-into-measures-being-taken-by-file-sharing-and-file-storage-services-to-prevent-users-from-encountering-or-sharing-child-sexual-abuse-material-csam
- https://casescan.com/blog/eu-eprivacy-derogation-csam-detection-platforms/
- https://perkinscoie.com/insights/blog/can-providers-be-sued-mistaken-csam-reports-maybe-says-new-ruling-0
- https://blog.ericgoldman.org/archives/2025/03/verizon-and-its-cloud-vendor-must-face-lawsuit-for-reporting-csam-that-wasnt-lawshe-v-verizon-guest-blog-post.htm
- https://cybersecuritynews.com/gitlab-vulnerabilities/
- https://zeropath.com/blog/gitlab-cve-2025-7739-stored-xss-summary
- https://gitlab.com/gitlab-org/gitlab-ce/-/issues/54231
- https://hackerone.com/reports/526325
- https://hackerone.com/reports/1619604
- https://ubuntu.com/security/notices/USN-7319-1
- https://github.com/github/cmark-gfm/releases
