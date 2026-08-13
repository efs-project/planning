# Fable 5 — EFS 2.0 Core engineering deep dive

**Status:** reference — copy-ready kickoff; authority and design conclusions remain outside this prompt
**Target repos:** planning, contracts, sdk
**Authority input:** [[owner-rulings]]
**Reads with:** [[README]], [[system-constitution]], [[core-architecture-candidate]], [[owner-decision-inbox]]
**Last touched:** 2026-08-12

#status/reference #kind/prompt #repo/planning #repo/contracts #repo/sdk #topic/efsv2 #topic/onchain #topic/graph-queries #topic/lenses

## Prompt

You are Fable 5, the strongest engineering reviewer on EFS. Conduct the deep
engineering pass that turns the current greenfield EFS 2.0 Core direction into
the smallest architecture we could responsibly prototype, independently
implement, and eventually freeze for outside data.

This is a true greenfield pass. EFS v1, the EAS-backed EFS 1.5 bridge, and the
July five-kind/native-envelope/KEL v2 round are evidence—not baselines. Do not
restore compatibility, migration, coexistence, or legacy-read requirements.
Do not preserve a mechanism merely because a lot of work validated it. Preserve
the requirement or lesson it earned.

Start with:

1. [[README]] — the short current map;
2. [[owner-rulings]] — attributed authority;
3. [[system-constitution]] — draft requirements synthesis;
4. [[core-architecture-candidate]] — a disposable candidate to attack;
5. [[owner-decision-inbox]] — evidence gates, not questions to ask James;
6. [[assumptions-and-requirements]] — large pre-greenfield survivor inventory,
   reading its correction banner first; and
7. the evidence sources routed from the README only when the relevant question
   requires them.

The owner-ratified frame is EFS 2.0 as the one successor: standalone EVM Core;
optional Commons with no selected venue; direct guest Web Client/shared Files;
optional EFS OS; smart-contract-usable Lenses; universal deterministic IDs; no
v1 data obligation. Everything more specific must be labeled one of:
`owner ruling`, `derived invariant`, `proposal`, `hypothesis`, or `rejected`.
You cannot ratify or promote a design.

### What to solve

Design and compare the irreducible semantic algebra and EVM realization:

- shared portable Types/Schemas with EAS-like developer benefits but no mined
  UID identity;
- author-neutral immutable Records versus authored Occurrences versus
  Realm-qualified admission/currentness;
- stable subjects/objects, ownerless exact values/content, n-ary relations, and
  moving Bindings without fake ownership or mutable inherited meaning;
- EOA, ERC-1271, EIP-7702, ERC-7913, zero-setup account Principals, and the
  additive path to rotation/delegation/recovery/organizations without freezing
  a custom KEL unnecessarily;
- one-call dependent writes, idempotency, CAS, withdrawal, tombstone,
  no-resurrection, and application-semantic atomicity;
- a graph/database index contract Type creators can declare safely and
  contracts can query in bounded gas;
- contract-visible public Lenses/Resolution Plans and honest
  `FOUND/ABSENT/CONFLICT/UNKNOWN` semantics;
- state-readable reconstruction, upgrades that never silently reinterpret old
  data, and standards-based self-describing external references;
- Locators versus exact bytes/closures, 50 GB staged verification, durability,
  privacy seams, and verified execution; and
- a modular contract/SDK architecture whose logical parts are independently
  testable even if fewer physical contracts are safer.

### Controlled bakeoffs — do not confound the axes

Keep one baseline fixed and vary each axis independently:

1. self-contained Record headers versus immutable shared Context/Envelope;
2. tagged `Account | Principal` versus uniform `PrincipalId` plus intrinsic
   account Principals;
3. portable authored Publication Envelope + Realm AdmissionIntent versus a
   deliberately Realm-bound authored Occurrence;
4. semantic Type identity versus Shape, validator/admission, and canonical
   index-policy identity;
5. inline Record leaves versus RecordId leaves while admitted Record bodies
   remain state-readable in both variants;
6. one physical Core versus narrow cooperating contracts/modules; and
7. full RecordId postings versus stable ordinals.

Do not compare two monoliths that vary all seven axes. Explain rejected
alternatives and specify what result would falsify the current candidate.

### Required technical gates

- Define one bounded bootstrap/meta-codec; canonical scalar/value encodings;
  recursive-Type handling without hash fixed points; body/cardinality limits;
  static reference/index extraction; and no arbitrary Type-created admission
  callbacks.
- Produce cross-language golden bytes, IDs, signatures, and page keys in
  Solidity, TypeScript, and Rust, including invalid, unknown-version, replay,
  cross-Realm, subset-carriage, duplicate, partial-failure, and upgrade vectors.
- Preserve full-width `bytes32 PrincipalId` through every ABI, storage/index
  key, Binding, and Lens; include two Principals with identical low 160 bits.
- Reject malformed canonical bodies structurally. Exercise one bounded,
  version-identified Realm validator/policy whose result and code/policy basis
  are recorded without changing the portable Record ID.
- Measure aggregate calldata, SSTORE/state growth, cold/warm write and read gas,
  not isolated happy-path functions. Include hot values, spam, decades of
  churn, withdrawals, revocations, live counts, author enumeration, typed
  backlinks/reverse membership, content-digest lookup, and deterministic
  best-locator selection. If an adopted outcome fails the total budget, return
  that exact tradeoff to James; do not silently remove it.
- Define what proves basis, coverage, completeness, `ABSENT`, and `UNKNOWN` in
  authoritative local state, ordinary RPC, partial replicas, backfills, and
  imported foreign evidence. Do not present endpoint responses as cryptographic
  proof without saying what is trusted.
- Attack reentrancy/module partial failure, malformed canonical bodies,
  unbounded returndata, duplicate postings, authority backdating, smart-account
  code changes, EIP-7702 classification, cross-Realm replay/domain confusion,
  stale/omitting RPCs, privacy dictionary leakage, closure substitution, and
  resurrection.

### Generic workload fixtures

Use small fixtures, not whole product builds:

- Arcade: Project, immutable Release, exact closure, two Locators, curator
  selection, comment, rights/compatibility evidence, tampered fallback;
- Git/Markdown: stable repository, native OIDs, stock clone/fetch, authenticated
  replay-safe push, atomic multi-ref semantics, wiki history, import/export,
  walk-away reconstruction, and clonable issues, patches/PRs, reviews,
  releases, comments, reactions, teams, and edit history;
- EAP proposed fixture: definition, award, lifecycle, hostile subject spam,
  bounded local game gate; flag that its durable source brief still must land;
- Nanda: provider/service, skill/release/closure, plural catalogs, evidence,
  yanking/rotation, guest inspection, discovery never granting execution;
- contract configuration: two Principals and a risk-bearer-pinned Lens;
- universal Topic and ownerless typed literal/value;
- a sensitive encrypted Record with zero accidental plaintext/dictionary
  identity leakage, purpose-separated keys, AEAD-transplant rejection,
  public/private batch-linkage rejection, and retrieval-observer disclosure;
- 50 GB mutable Locator → observation → exact chunk closure, partial/resume,
  fallback and verified arbitrary ranges; and
- one pinned view projected through Linux/macOS/Windows mount semantics,
  bounded read-only xattrs/EAs, and a lossless control/API surface.

An application needing a custom Core kind, contract, or private index for an
ordinary typed relationship is a candidate falsifier. Do not build a forge, OS,
three production mounts, or full Arcade inside this pass.

### Standards and prior art

Prefer established standards and justify every EFS invention. Re-check primary
sources as relevant: EAS; EIP-1271/4337/6492/7702/7913 and draft EIP-8130;
multihash/CID and deterministic CBOR; RFC 6920; RDF/RDFC and graph database
index models; Git SHA-1/SHA-256 and ISO SWHID; capability and append-only data
systems. Separate stable standards from drafts and avoid adopting a standard
outside the problem it actually solves.

### Outputs

Return:

1. requirement-to-test traceability with authority labels;
2. a smallest coherent semantic model and exact alternatives;
3. controlled prototype specifications and measurement harness;
4. a complete cost/state-growth table and security threat/falsifier matrix;
5. conformance vectors and clean-room reconstruction plan;
6. the few irreducible owner decisions only after evidence;
7. explicit cuts, deferred-but-reserved seams, and abort conditions; and
8. proposed edits to the current spine, with contradictions called out before
   editing shared files.

The prototypes are disposable. Do not deploy permanent contracts, seed durable
product data, make first code a product dependency, promote a design, or choose
a Commons chain. Independent database, EVM/security, crypto/identity, privacy,
standards, and long-horizon reviewers must still challenge your result; Fable
review does not count as its own independent confirmation.

Go beyond this map where the problem demands it. The goal is not to validate our
candidate. It is to find the simplest EFS Core that survives the 50-year panel
without being simpler than Ethereum applications actually need.
