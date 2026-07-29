---
agent: pm
date: 2026-07-29
status: reference
anchors:
  - area: efsv2
  - area: preservation
  - area: apps
  - area: sdk
  - area: agents
source: James product-priority steering, the local v2 corpus, and primary-source research
---

# Credibly neutral Git forge + agent artifacts — priority brief

Priority and research brief, not an adopted architecture. James has made the
workload important; the mechanism and exact v1 boundary still need a dedicated
design pass.

## Executive read

**Product priority:** EFS should treat credibly neutral Git code hosting as a
core use case and a standing v2 benchmark. The first claim to earn is not
"GitHub clone." It is:

> A public Git repository can be cloned, fetched, pushed, browsed, verified,
> mirrored, exported, and recovered without its identity or history depending
> on one EFS-operated domain or database.

The strongest architecture direction is **Git as a first-class compatibility
profile over generic EFS primitives**, not Git as EFS's universal data model
and not a new implementation of Git.

This same substrate is a natural base for public, versioned Agent Skills and
project instructions. It is **not** a reason to make personal agent memory,
chat history, or session context public. Those are separate security and
lifecycle classes.

## Four connected products, not one blob of scope

1. **Public Git host:** ordinary repositories, branches, tags, clone, fetch,
   push, browse, import, export, and durable mirrors.
2. **Git workspaces for EFS files:** an explicit folder/workspace mode where
   users can see status, diff, commit, branch, and restore EFS-backed work
   through Git semantics.
3. **Portable forge collaboration:** issues, patches/pull requests, reviews,
   comments, releases, notifications, and later CI/package metadata.
4. **Agent artifact platform:** public skills, instructions, tools,
   references, tests, and shared knowledge distributed as versioned,
   reviewable artifacts.

They share immutable objects, mutable authenticated refs, indexes, identity,
provenance, and availability machinery. They do not need the same trust,
execution, privacy, retention, or moderation rules.

## Correction to the existing Git ruling

The 2026-06-10 [[Decisions]] entry — **"Git is a MIRROR transport, not a
special case"** — remains right for an ordinary EFS file mirrored at a
commit-pinned URL.

It does not resolve this workload. A Git host must preserve and serve Git's
native object graph and ref state, accept authorized pushes, and round-trip
through ordinary Git. That is an application/profile over EFS, not merely one
more URI on a file.

Keep the identifier layers distinct:

- an EFS repository identity is stable across hosts;
- a Git object ID remains the algorithm-tagged native Git OID;
- an EFS byte/content digest verifies its storage representation;
- a host URL is only a serving location.

Do not rewrite Git objects to make their IDs look like EFS IDs, and do not
promote Git SHA-1 into a universal EFS identifier.

## What “credibly neutral” must mean

Neutrality is not "no service exists" and not "every provider must serve every
object." An ordinary Git gateway may be the fast path. It is credible only
when the gateway is replaceable.

Minimum properties:

- **Location-independent identity.** Moving between gateways must not create a
  new repository or new authority root.
- **Unmodified Git compatibility.** Standard anonymous clone/fetch and
  authenticated HTTPS or SSH push work without requiring an EFS-only client.
  An `efs://` remote helper may be useful later, but cannot be the sole path.
- **Byte-exact round trip.** Git objects, refs, object-format algorithm, and
  reachable history survive import/export unchanged.
- **Portable ref history.** A host database is not the sole record of branch
  movement, force pushes, tags, or authority-policy changes.
- **Plural, verifiable availability.** More than one provider can serve the
  same verified repository; content addressing never masquerades as proof
  that somebody is retaining the bytes.
- **Complete exit.** A fresh operator can reconstruct a working Git endpoint
  from documented exports and surviving mirrors without EFS domains, APIs,
  databases, employees, or signing services.
- **Discovery is not authority.** Search, stars, rankings, default gateways,
  and ENS names help people find a repo; none defines its authentic state.
- **Serving policy is separate from validity.** Gateways and indexes can
  decline malware, illegal content, spam, or secrets without rewriting the
  repository's identity or claiming the material never existed.

## Recommended v1 line

### Must earn before calling the product a Git host

1. **Stable repository identity and authority**
   - repository identity independent of host/domain;
   - explicit owner/delegate policy and recoverable key/account rotation;
   - genesis declares the Git object format and initial/default ref.

2. **Stock Git read and write**
   - anonymous `clone` and `fetch`;
   - authorized `push` over standard Git HTTPS/SSH behavior;
   - atomic compare-and-swap ref updates, including multi-ref atomic pushes if
     the gateway advertises that Git capability;
   - default fast-forward protection with explicit, auditable policy for
     force pushes.

3. **Replay-resistant ref history**
   - each accepted update binds at least repository, ref name, old OID, new
     OID, actor, prior event or monotone sequence, and authority-policy epoch;
   - a valid signature alone never proves freshness;
   - concurrent writers retain their own views; canonical refs are derived by
     explicit repository policy rather than one host silently winning.

4. **Git-native preservation and exit**
   - preserve byte-exact objects and algorithm-tagged OIDs;
   - validate packs, reachability, and declared object closure;
   - full and incremental Git bundles are strong transport/recovery
     candidates, not a push surface;
   - packfile layout/deltas are reconstructible caches, not canonical
     repository identity;
   - publish a clean-room restore procedure and run it.

5. **Anonymous human read path**
   - files, trees, commits, branches, tags, history, diffs, and source archives
     load through the fast guest/deep-link path;
   - no wallet, EFS account, or full OS boot is required to read a public repo.

6. **Host and mirror interoperability**
   - import, mirror, and export to ordinary Git hosts;
   - no EFS-only metadata is required to recover a valid Git repository;
   - EFS-specific identity, availability, and provenance metadata travel in a
     documented sidecar/export.

7. **Honest public-host operations**
   - quotas and defenses for malicious packs, decompression/object bombs,
     spam, and abusive histories;
   - explicit retention rules for objects made unreachable by force-push;
   - a leaked-secret warning: durable public replication makes reliable
     erasure impossible;
   - published moderation and gateway-index policies.

If v1 only imports a repository and publishes a downloadable bundle, call it a
**Git archive/prototype**, not yet a Git host.

### Thin agent-artifact slice that can ride v1

- host ordinary repositories containing `AGENTS.md` and open Agent Skills;
- discover and index `SKILL.md` metadata;
- publish/install an immutable commit/tree or release digest, never an
  unpinned mutable branch;
- add an outer EFS release record for publisher, version/channel, license,
  compatibility, dependencies, requested capabilities, audit/evaluation
  attestations, and supersession;
- show capability and executable-file changes before install/update.

Later, the crowdsourced agent layer can add skill forks and PRs, signed
evaluation/test attestations, compatibility matrices, dependency review,
catalogs, and reputation/curation lenses. Repository popularity must never be
treated as permission to execute.

### Later forge scope

- issues, patch/pull-request revisions, reviews, inline comments, labels, and
  releases as portable signed application objects;
- repository roles, CODEOWNERS, protected branches, merge queues,
  notifications, projects, and organizations;
- Git LFS and partial-clone/promisor optimization if they do not fit v1;
- code and semantic search through replaceable, coverage-labeled indexes;
- CI/actions/runners and package registries only after the untrusted-code,
  token, secret, and fork-PR security model is real;
- private repositories only after EFS has encrypted object closure,
  membership/key rotation, recovery, and honest metadata-leak guarantees;
- ForgeFed, F3, NIP-34, Radicle, and conventional-forge adapters.

The existing Kanban idea for a standalone EFS issue tracker should fold into
this later forge layer rather than become an unrelated product.

## Architecture hypothesis to test, not adopt yet

| Layer | Reuse rather than reinvent | EFS responsibility |
|---|---|---|
| Git data | Git blobs, trees, commits, tags, packs, bundles, object algorithms | verified placement, closure/retention evidence, plural mirrors |
| Git protocol | `upload-pack`, `receive-pack`, smart HTTP/SSH, protocol v2 | replaceable gateway and rebuildable bare-repo cache |
| Repository identity | standard Git repository contents plus studied Radicle-style self-certification | stable repo ID, authority history, mutable naming outside the ID |
| Ref updates | Git compare-and-swap/fast-forward and signed-push precedents | authenticated, atomic, replay-safe ref events and policy epochs |
| Forge data | Radicle COBs, Forgejo behavior, F3/ForgeFed schemas as evidence | portable signed application schemas and lens-derived views |
| Discovery | forge UI/search/API conventions | replaceable indexes with basis, coverage, and provenance |

The official service may keep bare Git repositories and indexes for speed.
The neutrality test is whether that state is reproducible, not whether the
service has zero state.

### Git-tracked EFS files

Do **not** make every EFS folder implicitly Git-versioned.

Recommended research frame:

- **Explicit Git workspace:** a folder opts into repository semantics; the OS
  file browser can expose Git status/diff/commit/branch/restore.
- **Normal Git mode:** file bytes are ordinary Git blobs. This has the
  cleanest interop and is the v1 baseline.
- **Large EFS-file mode:** use the existing Git LFS pointer and batch/transfer
  protocols with EFS-backed bytes rather than inventing a new pointer syntax.
  A normal clone honestly yields LFS pointers until an LFS-capable client
  fetches the bytes.
- **Native EFS history:** ordinary EFS folders retain their own version and
  provenance model without needing Git.

The deep dive should test whether one stored EFS byte object can safely expose
both its EFS digest and algorithm-tagged Git blob OID without duplicate bytes.
Correctness and normal Git export matter more than dedup elegance.

## Agent artifacts: one substrate, separate safety profiles

| Profile | Default visibility/lifecycle | Required treatment |
|---|---|---|
| Agent Skill release | public, immutable, versioned software | pinned release, provenance, license, dependencies, capability preview, sandbox, review/evals |
| Project instructions (`AGENTS.md`) | repository-scoped source | normal Git review and branch policy |
| Shared knowledge/evidence | public or scoped, supersedable data | sources, provenance, scope, confidence, curation lens; grants no capability |
| Personal/team memory | private, mutable, lifecycle-managed | encryption, ACL, subject/agent/thread scope, TTL/retention, deletion/export, provenance |
| Session context/chat history | ephemeral by default | explicit promotion before durable storage or sharing |
| Embeddings/search indexes | derived and replaceable | inherit source ACL and retention; never become canonical memory |

“Crowdsourced memory” should normally be called **shared knowledge/evidence**
at the protocol layer. Popular text can contain prompt injection or poisoned
claims. It must never become trusted instructions or gain capabilities merely
because many agents retrieved it.

The current client design already separates an Agent Memory Vault from public
EFS and defers it on the unsolved private-state boundary. Keep that honesty.
Public skills can proceed independently.

## What v2 already supplies, and what this workload exposes

| Concern | Current direction | Gap exposed by Git/forge |
|---|---|---|
| immutable data + plural placements | central EFS thesis | exact Git object/pack/bundle profile and closure/retention accounting |
| authenticated claims + authority | active v2/KEL work | stable repo genesis, delegate policy, multi-writer namespace, ref-update authorization |
| reader-sovereign lenses | active lens work | derive canonical refs/social views without deleting peer views |
| bundle/export/walk-away | standing requirement | exact repository + forge-history clean-room restore |
| fast guest links | now parked as OS requirement | anonymous repo/file/commit/diff cold start |
| portable app schemas/validators | queued deep dive | portable issue/patch/review/release schemas and validator policies |
| package/update trust | client-v2 requirement | pinned skill releases, capability diffs, dependency closures, provenance |
| private agent memory | explicitly deferred | encryption, access, lifecycle, and context-injection defenses remain unsolved |

The local primitive audit is encouraging but not completion:

- [[assumptions-and-requirements]] and
  [[mountable-filesystem-semantics]] already require immutable bytes, version
  history, plural sources, and clean-room export/import. A Git object can fit
  as byte-exact data while retaining its separate native OID.
- [[codex-kinds]] gives head-like cardinality-one PIN/slot state and
  append-only LIST/TAG building blocks with retained history. It does not
  define Git refs, repository genesis, or delegate policy.
- [[codex-kernel]] gives signed, single-revert batch submission and a
  reconstruction spine. That helps publish object closure. It is **not
  automatically Git multi-ref CAS**: subset/resume exists, and the current
  admission-confluence rule rejects state-dependent admission behavior.
- The adopted mount target is read-only. Its later copy-on-write/journal work
  may improve the OS workspace, but ordinary local Git plus gateway push can
  prove core hosting first.
- The normative `.efs-bundle` is still owed in [[joined-pass-synthesis]].
  Git bundle/pack rules must feed that work without turning `.efs-bundle` into
  a renamed Git bundle.

### Potential freeze pressure

The kernel should not gain Git-specific record kinds or Git-specific branch
logic.

Before the coordinated envelope/kernel recut closes, this workload should
nevertheless test whether the **generic** substrate can express:

- authenticated ref-transition evidence with old/new state, prior
  event/sequence, policy epoch, and replay protection;
- one signed transaction object covering multiple ref changes atomically;
- complete child/object closure manifests;
- algorithm-tagged foreign object IDs;
- retained prior state and authority-policy epochs;
- bounded discovery/list reads needed for anonymous browsing;
- independently verifiable export coverage.

If the current generic machinery already satisfies these, keep every Git
semantic at the application/gateway layer. If not, surface the missing generic
requirement before freeze. Do not smuggle in a Git-shaped kernel primitive.

The first hypothesis to test is a **single signed generic ref-transaction
object** plus ordinary Git gateway CAS and deterministic lens/policy
validation. This may preserve the kernel's admission-confluence rule while
making conflicting transitions visible instead of silently choosing a host's
database. Only reopen the kernel for conditional-transition semantics if the
prototype falsifies that shape.

## Standing benchmark and first proof

Use real Git behavior to pressure the kernel, SDK, byte tiers, indexes, lenses,
guest path, economics, and walk-away claim:

- many tiny objects and a deep commit history;
- rapid branch/ref updates and a multi-ref atomic push;
- concurrent maintainers and conflicting views;
- a force-push plus recovery of the displaced history;
- a large monorepo, partial/blobless clone, and Git LFS;
- malformed/thin packs, object amplification, interrupted upload, and retry;
- anonymous single-file and diff deep links;
- a public Agent Skills repository with a safe update and a malicious update;
- removal of every EFS-operated service followed by clean-room reconstruction.

The first bounded prototype should:

1. import an ordinary public Git repository;
2. publish a stable EFS repository identity and verified full bundle;
3. serve anonymous clone/fetch through ordinary Git;
4. accept one authorized push and record a replay-safe ref transition;
5. render files/history/diffs through the guest path;
6. export and rebuild the endpoint under an independent hostname;
7. preserve one portable patch/review thread as a later-forge probe;
8. publish and install one pinned open Agent Skill release.

This is a prototype acceptance suite, not a promise to ship all forge features.

## Threats the dedicated pass must break

- replay, reordering, equivocation, stale-but-valid signed refs;
- compromised maintainer keys, authority rotation, and policy rollback;
- force-push ambiguity and retention/economic griefing of unreachable objects;
- pack/object bombs, hash-algorithm confusion, and partial-clone omission;
- private keys or secrets committed to an effectively non-erasable public repo;
- malware, illegal content, spam, and the difference between validity and
  provider serving/index policy;
- executable skill supply chains, capability escalation, dependency drift,
  and malicious update channels;
- prompt injection/data poisoning in shared knowledge;
- leakage of private memories, chats, embeddings, credentials, or tool traces.

## Questions for the dedicated deep dive

1. Is repository mode explicitly opted into? Recommendation: yes.
2. What makes a `repoId` stable while name, description, mirrors, owners, and
   policy evolve?
3. Can one signed generic ref-transaction plus gateway/lens validation provide
   atomic multi-ref Git semantics without violating the current
   admission-confluence rule? If not, what generic substrate is missing?
4. What exact signed ref event prevents replay and policy-epoch rollback?
5. Are packs/bundles only transport/cache objects, and what is the normative
   closure proof?
6. What retains every object reachable from advertised refs, and what happens
   to objects made unreachable by force-push?
7. Which per-writer views are retained, and what policy derives the canonical
   default branch?
8. How are SSH keys, HTTPS credentials, wallets, smart accounts, and recovery
   bound without making the gateway an identity root?
9. How does an ordinary Git push become an EFS-authorized update without a
   wallet prompt per object or per ref? Which states are local, gateway
   accepted, author-signed, and strongly admitted?
10. Who pays for object retention, ref admission, and continued replication,
    and what degrades when that funding stops?
11. What is the minimum rebuildable state for a standard Git smart-HTTP
   gateway?
12. What moderation, quarantine, takedown, and leaked-secret behavior can a
    provider exercise without corrupting neutral verification?
13. Can Git LFS map cleanly onto EFS byte storage and retention evidence?
14. What exact outer release/trust manifest does an open Agent Skill need?
15. Which “memory” artifacts are actually public knowledge, and which must be
    private or ephemeral?

## Prior art to carry into the pass

- [Git object model](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects),
  [repository layout](https://git-scm.com/docs/gitrepository-layout),
  [protocol v2](https://git-scm.com/docs/protocol-v2),
  [receive-pack](https://git-scm.com/docs/git-receive-pack),
  [partial clone](https://git-scm.com/docs/partial-clone),
  [bundles](https://git-scm.com/docs/git-bundle), and
  [bundle URIs](https://git-scm.com/docs/bundle-uri) — preserve standards and
  native behavior.
- [Radicle protocol](https://radicle.dev/guides/protocol) — closest
  local-first/self-certifying forge precedent: per-peer namespaces, signed
  refs, policy-derived canonical branches, and collaborative objects.
- [Radicle's 2026 signed-ref replay disclosure](https://radicle.dev/2026/03/30/disclosure-of-vulnerability-in-signed-references)
  — a valid signed snapshot without prior-state binding can be replayed.
- [Forgejo user surface](https://forgejo.org/docs/latest/user/) and
  [architecture](https://forgejo.org/docs/latest/contributor/architecture/)
  — later feature checklist; also the cautionary Git-plus-SQL portability
  split.
- [Friendly Forge Format](https://f3.forgefriends.org/) and
  [ForgeFed](https://forgefed.org/spec/) — later export/federation candidates,
  not v1 authority.
- [NIP-34](https://nips.nostr.com/34) — evidence for separating Git hosting
  from relay-distributed repository announcements, refs, patches, PRs, and
  issues; still draft/optional.
- [Software Heritage architecture](https://docs.softwareheritage.org/devel/architecture/overview.html)
  — preservation, content-addressed object storage, graph/index, vault/export,
  and replayer precedent; not a collaboration design.
- [Agent Skills specification](https://agentskills.io/specification) and
  [AGENTS.md](https://agents.md/) — interoperability floor. Do not invent a new
  skill directory format.
- [MCP resources](https://modelcontextprotocol.io/specification/2025-11-25/server/resources)
  — a future access adapter, not durable storage, package identity, or trust.

## Local corpus this graduates

- [[2026-07-21-codex-radicle-signed-repositories]]
- [[2026-07-21-codex-decentralized-data-landscape-synthesis]]
- [[2026-07-21-codex-efs-v2-design-intelligence-synthesis]]
- [[Ideas]] — guest deep links and agent/OS ideas
- [[fable-handoff-portable-schemas-and-validators]]
- [[fable-client-v2-handoff]]
- [[system-surfaces]]
- [[threat-model]]

## PM recommendation

- Put this at the top of Backlog as a **flagship requirements/deep-dive
  workload**, feeding the current v2 recut before any final freeze.
- Keep the initial pass design/research-only: requirements, current-primitive
  fit/gaps, candidate system shapes, threat model, v1 line, prototype plan, and
  agent-artifact boundary.
- Do not start a feature-complete forge or add Git-specific kernel machinery.
- Fold the standalone issue-tracker idea into the later forge scope.
- No James decision is needed to preserve or prioritize the work. The
  dedicated pass should return only the genuinely architectural forks.
