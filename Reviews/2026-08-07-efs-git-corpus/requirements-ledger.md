# EFS Git — requirements ledger

**Status:** deep-dive working ledger, 2026-08-07. Separates what is adopted, what James wants, what is hypothesis, and what this pass recommends. Nothing here is an owner ruling; the recording rule in [[owner-decision-inbox]] applies unchanged.

#kind/review #status/done #repo/planning #topic/efsv2 #topic/git

## A. Adopted owner rulings that constrain this design (may not be reopened here)

| ID | Ruling | Source | Consequence for Git |
|---|---|---|---|
| A-1 | Chains persist and stay queryable | [[owner-rulings]] 2026-07-10 | no dead-chain machinery in the Git profile; authority reads are definite |
| A-2 | Public by default + sensitivity layer | same | public repos are the default product; private repos are privacy-pass scope, not v1 |
| A-3 | Mandatory automatic indexing; on-chain = everyone's to use | same, 2026-07-15 | repo descriptors, ref claims, and release claims are queryable by construction; no half-present repos |
| A-4 | `contentHash → file` index on-chain | same (item 13) | Git-LFS-style sha256 byte objects get native lookup for free |
| A-5 | No universal collision bit; untrusted safety gates use closed sets + challenge windows | same (item F) | ref policies use closed rosters (maintainer sets), never open-set equivocation detection |
| A-6 | `act` is provenance only; KEL grants authorize | same (item G/11) | "pushed on behalf of org" renders from `act`; authorization is the grant |
| A-7 | Read-only mount on three OSes | same, 2026-07-22 | a Git workspace's *published* state must project through the same mount profile; working trees are local client state outside the mount |
| A-8 | Storage = on-chain + Arweave, optional mirrors; durability tiering | same, 2026-07-10 | Git containers (packs/bundles) are placement-tier bytes with mirror claims, not kernel state |

The 2026-06-10 Decisions entry "Git is a MIRROR transport, not a special case" remains true for ordinary mirrored files and explicitly does *not* resolve this workload (the correction is the PM brainstorm [[2026-07-29-pm-credibly-neutral-git-forge-and-agent-artifacts]] — a reason trail, not an owner ruling): a Git host is an application/profile over EFS, not one more URI on a file.

## B. James's product goals (the brief this pass serves; not yet requirements text)

From the kickoff prompt, restated testably:

1. **G-HOST** — credibly neutral public Git repository hosting; ordinary clone/fetch/push/import/export.
2. **G-WORKSPACE** — Git-backed changes to *opted-in* EFS folders.
3. **G-WIKI** — Markdown/wiki editing with built-in history, diffs, edit summaries, restores; Git as the hidden revision engine; user vocabulary = Edit / Preview / Save draft / Propose changes / Publish / History / Compare / Restore.
4. **G-COLLAB** — portable collaboration objects: proposals, patches, reviews, releases.
5. **G-AGENT** — public Agent Skills, `AGENTS.md`, shared knowledge as versioned artifacts; meaningful capability diff before install.
6. **G-GUEST** — anonymous, fast, wallet-free browsing of public files, commits, diffs, history.
7. **G-EXIT** — complete walk-away recovery without EFS-operated domains, databases, gateways, or signing services.
8. **G-INTEROP** — technical users can clone and manipulate the same repository with standard Git; use existing systems where they work.

## C. Binding constraints this design holds itself to

Labeled per row — the vault's precedence discipline applies: only the `adopted`/`required-invariant` rows are beyond this pass's reach; `spine-draft` rows are the current design canon (changeable by its owners), and `held-rec` rows are recommendations/held arms this design deliberately aligns with without deciding them.

| ID | Constraint | Status | Source |
|---|---|---|---|
| C-1 | Admission confluence: no admission check reads revocable state except the comparator; nothing permanently rejects what another kernel could accept | spine-draft (Etched-candidate) | [[codex-kernel]] amendment 3 |
| C-2 | Unknown evidence never becomes absence; only PROVEN-ABSENT yields | required-invariant | [[assumptions-and-requirements]] R-L6, clientv2 CONF-R1 |
| C-3 | Carrier failure does not change authorship or content identity (R-M4) | required-invariant | assumptions ledger |
| C-4 | One actor witness authorizes an envelope; no `msg.sender`/relayer/1271 authorship (R-D8; v2 native-carrier ruling) | required-invariant + adopted | assumptions ledger; owner rulings |
| C-5 | Authority transitions are prospective; history is not rewritten (R-K7) | required-invariant | assumptions ledger |
| C-6 | No Git-specific kernel kinds or Git-specific kernel behavior without a failed generic acceptance test | standing research posture | GoE pressure test; brainstorm; PM position |
| C-7 | Public convergent CRDT documents are GONE (C7 impossibility half); public collaboration routes to revision-DAGs + curation (B2 half) | spine-draft; **the B2 half is held decision Q3 (arm Q3A)** — this pass adds evidence toward it and must not treat it as ruled | [[fs-pass-synthesis]]; [[owner-decision-inbox]] Q3 |
| C-8 | The risk bearer picks the policy; a caller never supplies the policy that authorizes itself (LP-1/R-L8) | spine-draft; LP-1 is an askable recommended arm | lens spec §0.4 |
| C-9 | Pending truth never renders as canonical; ladder vocabulary is normative | spine-draft (clientv2) | [[persistence-and-sync]] D4 |
| C-10 | Rung-label honesty (local-sovereign … chain-authoritative); no UI presents a lower rung as higher | held-rec (P-12) | owner-decision-inbox Tier 3 |

## D. Standing hypotheses this pass was told to attack (kickoff §"Starting hypothesis")

| ID | Hypothesis | Verdict after this pass | Where argued |
|---|---|---|---|
| H-1 | Folder explicitly opts into Git-workspace mode; Git is not the universal EFS data model | **SURVIVES** — every alternative (implicit versioning, universal Git) fails cost, mount, and interop tests | [candidate-architectures](./candidate-architectures.md) |
| H-2 | Git blobs/trees/commits/tags/OIDs/packs/bundles remain native Git | **SURVIVES** — byte-exact interop is unimplementable otherwise | [state-model](./state-model.md) §2 |
| H-3 | For an opted-in workspace, Git is the canonical file/version history; no second per-commit EFS history | **SURVIVES with a sharpened edge** — EFS keeps a *ref-transition* history (which Git does not durably keep, per experiment E6) and a *page-identity* sidecar (which Git cannot keep, per E11); neither competes with Git's file history | state-model §3; [prior-art/local-git-experiments](./prior-art/local-git-experiments.md) |
| H-4 | EFS wraps Git with repository identity, KEL authority, authenticated ref transitions, placement evidence, recovery, portable collaboration objects | **SURVIVES** — and the generic record model can express all of it (fit/gap) | [primitive-fit-gap](./primitive-fit-gap.md) |
| H-5 | Packs are regenerable transport/cache artifacts, not repository identity | **SURVIVES** (E3) — with the addition that *archived container digests* are availability evidence | storage doc §2 |
| H-6 | Publication uploads required objects before advertising the new ref | **SURVIVES** — closure-before-advertise is implementable with stock plumbing (E10) | storage doc §3 |
| H-7 | Exact links = repo+commit+path; moving links = repo+policy-selected ref+path | **SURVIVES** — maps onto the existing Citation/Path link split verbatim | wiki doc §5 |
| H-8 | Ordinary Git clone/bundle is the minimum exit | **SURVIVES** (E1/E2) | storage doc §6 |
| H-9 | Large media = standard Git LFS with EFS-backed bytes | **SURVIVES** — LFS oids are already sha256; A-4's contentHash index fits | storage doc §5 |
| H-10 | Canonical knowledge branches prohibit force-push; restore = revert commit | **SURVIVES and generalizes** — force-push on a canonical branch is a policy-epoch ceremony, never a routine op | state-model §6 |

## E. New requirements this pass proposes (recommendations, not adopted)

| ID | Proposed requirement | Rationale |
|---|---|---|
| P-G1 | A repository's EFS identity (`repoId`) is an owner+salt-derived EFS object identity, independent of name, gateway, contract, chain, carrier, and authority state | direct application of R-M4/R-D1; kills the GoE contract-address-as-identity defect |
| P-G2 | Every Git OID in an EFS record is `(algorithm, digest)`-tagged; SHA-1 commits additionally bind an EFS sha256 digest of the same commit object bytes (dual digest) in ref transactions and release claims | E7 (no interop); SHA-1 risk isolation; matches E2's existing dual-digest rider |
| P-G3 | A ref transaction is an ordinary signed EFS claim batch: per-ref claims carrying value + predecessor witnesses (`expectedOldOid`, `expectedPriorClaimId`) and a transaction commitment (`txnRoot`/`refCount`), normally one envelope; canonical heads derive from a typed read-time fold over admission-ordered claims at the genesis-pinned authority home (profile `GIT-REF/1`) — CAS-canonical, with ancestry verified by object-bearing readers — never from gateway state | admission-confluence-compatible CAS; see state-model §4 |
| P-G4 | Publication advertises a ref only after its required object closure is verifiably placed; the closure commitment travels in the ref claim | H-6; GoE's missing-closure defect |
| P-G5 | Displaced-by-force-push closures and their ref claims are retained under an explicit retention rule; recovery of displaced history is a supported read | E6: Git guarantees nothing here |
| P-G6 | Wiki page identity = EFS DATA identity + `movedTo` redirects, layered over (repo, path); exact citations pin (repoId, commit, path) and are immune to renames | E11; B-goal G-WIKI |
| P-G7 | The gateway is rebuildable: bare repos, indexes, and web views are derived caches reconstructible from chain state + placed containers; no gateway database is the sole record of anything | G-EXIT; validation-program phase E |
| P-G8 | Stock-Git write path: SSH/HTTPS pushes are accepted as *proposal intake* at the gateway and become authoritative only when signed by a KEL actor of the repository's policy (possibly automated); the gateway never signs as the user | C-4; write-UX attester constraint |

## F. Explicitly out of scope for v1 (deferred, not denied)

- Private repositories and encrypted drafts (privacy-pass dependency; metadata honesty unresolved).
- Full forge parity: issues at scale, CI/runners, package registries, org hierarchies, merge queues.
- CRDT/AST real-time co-editing (C-7 boundary; AST merge helpers may *assist* interactively without entering deterministic replay).
- Cross-format (SHA-1→SHA-256) repository migration (history rewrite; new repo epoch — a labeled successor operation, not v1 machinery).
- A protocol incentive layer for storage (A-8 posture: use existing carriers + funded preservation).
