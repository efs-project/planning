# Nostr and P2P Git: Repo Announcements, Ref Attestations, and Patch Objects as Replicated Data

**Lane:** NIP-34 and lightweight repo-announcement/patch models — researched 2026-08-07

This lane surveys the "lightweight object" school of decentralized git: systems where the collaboration layer (who maintains a repo, what its refs are, what changes are proposed) is a small set of signed, replicated data objects, and git object transport is delegated to dumb interchangeable servers. Covers NIP-34/grasp (current, active), the email/public-inbox lineage (proven at kernel scale), git-ssb (dead, instructive), and IPFS git experiments (dead as of last week, instructive).

---

## 1. NIP-34: the object set (implemented/shipped spec, actively evolving)

[NIP-34 "git stuff"](https://github.com/nostr-protocol/nips/blob/master/34.md) defines git collaboration as nostr events. Current kind set ([spec text](https://raw.githubusercontent.com/nostr-protocol/nips/master/34.md), fetched 2026-08-07):

| Kind | Object | Notes |
|---|---|---|
| 30617 | Repository announcement | addressable event; identity = (author pubkey, `d` tag) |
| 30618 | Repository state | signed refs assertion |
| 1617 | Patch | git-format-patch content in event body |
| 1618 | Pull request | branch-reference form (added Oct 2025) |
| 1619 | PR update | new tip for an existing PR |
| 1621 | Issue | markdown body, `subject` tag |
| 1630–1633 | Status | Open / Applied-Merged / Closed / Draft |
| 10317 | User grasp-server list | `g` tags, ordered by preference |

**Repo announcement (30617).** Only `d` (identifier) is required; everything else — `name`, `description`, `web`, `clone` (git clone URL list), `relays` (where to watch for patches/issues), `maintainers`, `t` hashtags — is optional. Two structurally important tags: `r` with marker `euc` = "earliest unique commit" ID, a convention that groups forks/copies of the same project across different announcers; and `u` = fork subordination (added June 2026), without which "the author asserts themselves as a maintainer of the primary project" ([spec](https://raw.githubusercontent.com/nostr-protocol/nips/master/34.md)). So maintainership is **self-asserted per pubkey**, and multiple maintainers each publish their own 30617/30618; clients merge across the `maintainers`/`euc` graph. This is convention-heavy: the spec normatively defines tag shapes, but "who is the real maintainer set" is a client-side trust decision, not protocol-enforced.

**Repo state (30618).** Tags of the form `refs/<heads|tags>/<name>` → commit ID, plus `HEAD` → a branch ref. This is the load-bearing object: a **signed ref attestation** that outranks whatever the git server says. Clients/ngit fetch from any `clone` URL and verify the tips against the maintainer's latest 30618. Refs were added to 30618 in Aug 2024; an unused refs-tag extension was removed Apr 2026 ([commit history](https://github.com/nostr-protocol/nips/commits/master/34.md)).

**Patches vs PRs.** Patches (1617) carry `git format-patch` output inline and "SHOULD be used if each event is under 60kb, otherwise PRs SHOULD be used" ([spec](https://raw.githubusercontent.com/nostr-protocol/nips/master/34.md)). Patches can carry `commit`, `parent-commit`, `commit-pgp-sig`, and `committer` tags so the applied commit ID is stable/reproducible. PRs (1618, added Oct 16 2025, [PR #1966](https://github.com/nostr-protocol/nips/commits/master/34.md)) instead point at a branch on a `clone` URL — i.e. big changes fall back to server-hosted branches, only the *reference* is a portable object. Threading uses NIP-10 reply tags.

**Statuses (1630–1633).** "The most recent Status event (by `created_at` date) from either the issue/patch author or a maintainer is considered valid" ([spec](https://raw.githubusercontent.com/nostr-protocol/nips/master/34.md)). Merged status (1631) carries `merge-commit` / `applied-as-commits`. Note the authority rule is *latest signed timestamp wins*, and nostr `created_at` is self-asserted — forgeable ordering, no total order. (EFS gets block ordering for free; see §7.)

**Change velocity (pinned dates, from [34.md history](https://github.com/nostr-protocol/nips/commits/master/34.md)):** initial spec Mar 5 2024; statuses Apr 2024; 30618 refs Aug 2024; PRs 1618/1619 Oct 16 2025; `nostr://` clone-URL spec Apr 10 2026 (#2312); `u` fork-subordination + GRASP-06 Jun 24 2026 (#2395); grasp hosting text trimmed Jul 26 2026 (#2423). The spec is under active churn in 2026 — treat kind numbers as stable, tag details as moving.

**`nostr://` clone URLs** (Apr 2026): `nostr://<naddr>` or `nostr://<npub|nip05>/<relay-hint>/<identifier>`, percent-encoded per RFC 3986 — the repo's *name* is an identity + identifier, not a host ([spec](https://raw.githubusercontent.com/nostr-protocol/nips/master/34.md)).

## 2. Grasp: nostr-authorized dumb git servers (implemented, young)

[Grasp](https://ngit.dev/grasp/) ("Git Repositories Authorized via Signed-Nostr Proofs", spec site [gitgrasp.com](https://gitgrasp.com/)) defines a server that is simultaneously a smart-HTTP git server and a nostr relay. Design stance: servers are "dumb data relays"; nostr events are the source of truth. There is **no account system** — maintainers "pre-authorize pushes via signed Nostr events, then any compliant server can host your repo"; pushes are validated against the latest signed repo state ([ngit.dev/grasp](https://ngit.dev/grasp/)). Repos live at `/<npub>/<identifier>.git`. Users advertise preferred grasp servers via kind 10317. Sub-specs are numbered (GRASP-01 = Nostr-authorised HTTP git server; GRASP-06 = personal forks, referenced from the June 2026 NIP-34 change) ([gitgrasp.com](https://gitgrasp.com/), [NIP-34 history](https://github.com/nostr-protocol/nips/commits/master/34.md)).

Implementations as of Aug 2026 ([ngit.dev/grasp](https://ngit.dev/grasp/)): **ngit-grasp** (reference), **pyramid** by fiatjaf (multi-purpose relay with GRASP-01), **n34-relay** (WIP), **ngit-relay** (archived/superseded). Public instances: relay.ngit.dev, gitnostr.com. Community reception ([Lobsters, Apr 21 2026](https://lobste.rs/s/ual4t5/grasp_simple_protocol_for_decentralized)): "resembles Radicle but uses Nostr for coordination"; key critiques were keypair-management burden ("like managing your own pgp keys"), and the canonical-place objection — "The primary benefit of a forge is that it _isn't_ decentralized" — plus predictions it stays "permanently niche."

## 3. Ecosystem state, August 2026 (implemented, real but small — with one big new entrant)

- **ngit** ([DanConwayDev/ngit-cli](https://github.com/DanConwayDev/ngit-cli)) is at **v2.6.3, released 2026-07-10** ([releases feed](https://github.com/DanConwayDev/ngit-cli/releases.atom)); active monthly releases through 2026. Ships `git-remote-nostr` so plain `git clone nostr://…` / push / fetch work; open PRs appear as `pr/` remote branches. The README is explicit that "a git server is still required for data storage and syncing state" and that "multiple git servers can be used for redundancy and… seamlessly swapped out by maintainers" ([repo](https://github.com/DanConwayDev/ngit-cli)). Repo has ~64 stars — small.
- **gitworkshop.dev** — the web client for NIP-34 ("Git collaboration, without the platform", [gitworkshop.dev](https://gitworkshop.dev/about)); browsing, issues, patches/PRs, grasp integration. It is a JS SPA; content is not crawlable — a reminder that "credibly neutral" also needs *readable-without-special-client* surfaces.
- **Adoption**: as of July 2026, a soapbox.pub survey found gitworkshop's main index showing on the order of ~55 nostr-hosted repos with Shakespeare (an AI app-builder with one-click nostr push) as "the first major source of adoption", plus NostrHub ([soapbox.pub, Jul 21 2026](https://soapbox.pub/blog/what-is-ngit)). Genuinely tiny before Buzz.
- **Block's Buzz** (launched **Jul 21–22, 2026**): open-source (Apache 2.0, [github.com/block/buzz](https://github.com/block/buzz), v0.4.21 at launch) team workspace combining chat, **git hosting on nostr**, and AI agents; self-host or managed at buzz.xyz ([Decrypt](https://decrypt.co/374026/jack-dorseys-block-launches-buzz-a-nostr-based-slack-and-github-rival-for-ai-agents), [cryptobriefing](https://cryptobriefing.com/block-launches-buzz-nostr-workspace/)). Block's framing is exactly the walk-away-exit thesis: "If Buzz disappears, your identity and signed history still verify" ([soapbox.pub](https://soapbox.pub/blog/what-is-ngit)). This is the largest corporate bet yet on the announcement+attestation+patch model; too new to judge (2 weeks old).

## 4. The email lineage: proof that patch collaboration objects are plain replicated data (implemented, decades, kernel scale)

- **git format-patch / send-email / am** is the original portable proposal object: a change serialized as text, signed-off, threaded by Message-ID, applied anywhere. No forge required; this is documented core git behavior ([git-scm](https://git-scm.com/docs/git-format-patch)).
- **public-inbox** (the engine behind [lore.kernel.org](https://www.kernel.org/lore.html)) stores the mail archive *in git*. The v2 format shards each list into time-based "epochs" of roughly 1GB git repos; each commit's tree holds a single file `m` (message) or `d` (deleted); Xapian/SQLite search indices are **derived local state, not replicated data** ([public-inbox-v2-format man page](https://www.mankier.com/5/public-inbox-v2-format)). Old epochs' packs are stable, so clients "clone only the epochs they are interested in." Replication is literally `git clone --mirror` (wrapped by [public-inbox-clone](https://www.mankier.com/1/public-inbox-clone)/grokmirror); Konstantin Ryabitsev: public-inbox "relies on git as the mechanism to store messages," which "makes the entire archive collection very easy to replicate" ([mirroring lore, 2019 — archives already >20GB then](https://people.kernel.org/monsieuricon/mirroring-lore-kernel-org)). Anyone can mirror the whole kernel development record; lore replicas sync within ~60s.
- **b4** (v0.15.2, Apr 9 2026, [PyPI](https://pypi.org/project/b4/)) turns the archive into a workflow tool: fetch a whole series by Message-ID, apply, track revisions, send. **patatt** adds end-to-end cryptographic attestation: DKIM-style `X-Developer-Signature` headers, ed25519/OpenPGP/OpenSSH keys, with contributor public keys "tracked in the git repository itself" ([patatt](https://github.com/mricon/patatt), [b4+patatt attestation](https://people.kernel.org/monsieuricon/end-to-end-patch-attestation-with-patatt-and-b4)).
- **Why this matters for EFS**: this stack demonstrates, at the largest scale in existence, every property the EFS git deep-dive wants — append-only signed proposal objects, archives replicated as dumb data, derived indices rebuilt locally, anonymous reading (clone the archive; browse via lei/NNTP/HTTP with no account), and total exit (your mirror *is* the archive). Its weaknesses are UX (email ergonomics) and identity (email addresses + optional keys), not architecture.

## 5. git-ssb: historical lessons (dead; archived 2019)

[git-ssb](https://github.com/clehner/git-ssb) put git hosting on Secure Scuttlebutt: repos were SSB messages (`ssb://%<hash>.sha256` as the git remote), and "commits, branches, issues, and pull requests are encoded into log entries on each participant's personal log," replicated by follow-graph gossip; git-ssb-web gave a GitHub-like UI ([git-ssb-intro](https://github.com/hackergrrl/git-ssb-intro)). Because anyone could push to the shared logical remote asynchronously, it auto-created "conflict branches" prefixed by SSB message IDs ([git-ssb-intro](https://github.com/hackergrrl/git-ssb-intro)).

Lessons (recommendation-grade inference from documented history):

1. **Replication scoped to a social graph couples repo availability to the follow graph** — no follow path, no data. A neutral host set (grasp/lore model) avoids this.
2. **Dogfooding into a niche substrate destroys the record**: the GitHub repo was archived Nov 22 2019 with development "migrated to git-ssb" inside SSB itself ([clehner/git-ssb](https://github.com/clehner/git-ssb)); today scuttlebot.io doesn't even resolve (DNS dead, checked 2026-08-07). The project's own history is now effectively unreachable — the *opposite* of walk-away exit. Permanence of the substrate matters more than elegance of the protocol.
3. Per-user append-only logs made "the repo" a derived merge over feeds — workable, but every reader needed the full SSB machinery; no dumb-data read path.

## 6. IPFS git experiments: why naive content-addressing underperformed (dead; archived July 2026)

[git-remote-ipld](https://github.com/ipfs-shipyard/git-remote-ipld) (the ipfs-shipyard remote helper using Kubo's git IPLD codec) was **archived Jul 31, 2026** as unmaintained, still targeting Go 1.17 / 2019-era IPFS libs, with the IPNS ref-pointer helper never completed — usage required passing raw hashes like `ipld://2347e110…` by hand ([repo](https://github.com/ipfs-shipyard/git-remote-ipld), [IPNS issue #4](https://github.com/ipfs-shipyard/git-remote-ipld/issues/4)). Documented reasons the approach underperformed (from the various remote-helper projects' own notes, e.g. [git-remote-igis](https://github.com/da2x/git-remote-igis), [dhappy/git-remote-ipfs](https://pkg.go.dev/github.com/dhappy/git-remote-ipfs)):

1. **Hash mismatch**: git's SHA-1 is computed over `"<type> <size>\0" + content`, so raw git blocks stored in IPFS carry headers that make blobs unreadable as plain IPFS files, and vice-versa — two content-addressing schemes that almost, but don't, compose.
2. **Loose objects lose packfiles**: storing every git object as its own block forfeits delta compression — "terribly inefficient" versus git's packed wire/disk format ([git-remote-igis](https://github.com/da2x/git-remote-igis)).
3. **Block size limits**: IPFS's ~2MB block cap forces special-casing large objects out of the IPLD graph.
4. **Mutable refs were never solved**: content addressing handles objects, but HEAD/branches need a mutable signed pointer; IPNS was too slow/unfinished, so every push minted a new root CID exchanged out-of-band and pinned forever.

Distilled: **content-addressing the object store is the easy 80%; the hard 20% is the signed mutable ref layer and the transport efficiency** — precisely the parts NIP-34/grasp (30618 + smart-HTTP servers) and lore (git-native transport) got right. EFS should treat "put git objects in a content-addressed store" as necessary-but-insufficient, and put its design effort into the ref-attestation and transport story (EthStorage/GoE serving real packfiles, not per-object blobs).

## 7. Distilled minimal object set for EFS (recommendation)

Synthesizing NIP-34, grasp, and the email lineage, the smallest portable object set that supports credibly-neutral git hosting is **five record types**:

1. **Repo announcement** — principal-scoped identifier (KEL principal + name, analog of `npub`+`d`), clone/mirror URL list, optional grouping key (euc-style earliest-unique-commit) for fork identity, optional fork-subordination pointer, maintainer list. Self-asserted; trust resolved at read/lens level.
2. **Ref attestation** — signed map `{refs/heads|tags/* → commit-id, HEAD → ref}` per maintainer. Latest-per-principal wins; this is what makes any host a *verifiable* dumb mirror. (NIP-34's single most transferable idea; EFS improvement: chain ordering replaces forgeable `created_at`.)
3. **Proposal object** — dual-mode, following NIP-34's 60kb lesson: inline patch (format-patch text, with commit/parent-commit pins for stable IDs, patatt-style signature) for small changes; branch-reference (clone URL + tip commit + base) for large ones. Threaded via reply references.
4. **Status object** — open/draft/applied(merge-commit, applied-as-commits)/closed; authority = proposal author or a maintainer, per the announcement's maintainer set.
5. **Host/mirror preference list** (grasp-list analog) — optional, per-principal, orders writeable mirrors.

Issues/wiki-talk are just proposal-thread objects without a diff (NIP-34's 1621 shows they need nothing extra but a `subject`).

**Known failure modes to design against** (all observed in the surveyed systems):

- **Relay/host dependence & clone-list rot** — nostr events persist only while relays keep them; grasp mitigates with multi-server lists but the list itself rots. EFS's permanent record layer (on-chain + Arweave) removes this class entirely for the *objects*; only bulk git data keeps a host dependency (EthStorage/mirrors), which ref attestations make verifiable.
- **Identity weakness** — raw keypairs with no recovery/rotation was the top practitioner complaint about grasp ([Lobsters](https://lobste.rs/s/ual4t5/grasp_simple_protocol_for_decentralized)) and a git-ssb burden. EFS's KEL (stable principal + rotatable scoped actor keys) is a direct answer; NIP-34 has nothing comparable.
- **Spam** — open kinds (1621/1617) on open relays are writable by anyone; nostr's answer is client filtering and relay policy, i.e. re-centralization at the relay. EFS admission (gas/faucet-drip economics + lens-level read policies) is a built-in rate limit and a *typed* filter — statuses from non-maintainers can be lens-excluded, matching NIP-34's authority rule but enforceable at read time.
- **Ordering forgery** — latest-`created_at`-wins is gameable; block ordering fixes it.
- **Maintainer-set forks** — two principals publishing rival attestations for the "same" repo is unresolvable in-protocol everywhere surveyed; euc-grouping plus explicit fork-subordination is the state of the art, and the resolution is social/lens-level. Don't try to solve it on an immutable contract.
- **No canonical place / unreadable clients** — the strongest anti-decentralization critique ([Lobsters](https://lobste.rs/s/ual4t5/grasp_simple_protocol_for_decentralized)); gitworkshop's uncrawlable SPA illustrates it. A canonical *contract + lens* read surface (with plain-HTTP mirrors, lore-style) answers "where is the project" without a privileged host.

## Sources

- https://raw.githubusercontent.com/nostr-protocol/nips/master/34.md
- https://github.com/nostr-protocol/nips/commits/master/34.md
- https://ngit.dev/grasp/
- https://gitgrasp.com/
- https://ngit.dev/relay/
- https://github.com/DanConwayDev/ngit-cli
- https://github.com/DanConwayDev/ngit-cli/releases.atom
- https://gitworkshop.dev/about
- https://soapbox.pub/blog/what-is-ngit
- https://lobste.rs/s/ual4t5/grasp_simple_protocol_for_decentralized
- https://decrypt.co/374026/jack-dorseys-block-launches-buzz-a-nostr-based-slack-and-github-rival-for-ai-agents
- https://cryptobriefing.com/block-launches-buzz-nostr-workspace/
- https://www.mankier.com/5/public-inbox-v2-format
- https://www.mankier.com/1/public-inbox-clone
- https://people.kernel.org/monsieuricon/mirroring-lore-kernel-org
- https://korg.docs.kernel.org/lore.html
- https://www.kernel.org/lore.html
- https://pypi.org/project/b4/
- https://github.com/mricon/patatt
- https://people.kernel.org/monsieuricon/end-to-end-patch-attestation-with-patatt-and-b4
- https://github.com/clehner/git-ssb
- https://github.com/hackergrrl/git-ssb-intro
- https://github.com/ipfs-shipyard/git-remote-ipld
- https://github.com/ipfs-shipyard/git-remote-ipld/issues/4
- https://github.com/da2x/git-remote-igis
- https://pkg.go.dev/github.com/dhappy/git-remote-ipfs
- https://git-scm.com/docs/git-format-patch
