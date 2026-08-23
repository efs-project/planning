# EFS 2.0 — owner guide

**Status:** reference — plain-language map of the adopted direction, provisional engineering candidate, and later owner choices
**Audience:** the project owner first; designers and product leads second
**Depends on:** [[owner-rulings]], [[system-constitution]], [[core-architecture-candidate]], [[v2-contract-readiness-program]]
**Last reconciled:** 2026-08-23

#status/reference #kind/note #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/human-overview

## EFS v2 in one sentence

EFS v2 is a shared Ethereum data layer designed for permanent, reconstructible
public records: anyone can define a kind of data, publish exact records, link
them together, and build applications over them without depending on one
company, website, indexer, or official database. Offchain byte availability is
a separate, honestly reported fact; a Record cannot guarantee that every photo
replica survives.

It is closer to a public, typed filesystem and database than to Dropbox or a
single application.

The most important idea is:

> EFS preserves exact evidence. It does not declare one universal truth.

Different people and contracts can choose which authors and evidence they
trust. The underlying records remain inspectable, linkable, exportable, and
reusable.

## The basic nouns

These are the current working nouns. The adopted part is the distinctions and
outcomes they preserve, not these exact names, formulas, or primitive set.

| Noun | Plain meaning | Example |
|---|---|---|
| **Realm** | One independently operated EFS Core deployment and its ordered state. It is more specific than a chain ID. | A fresh EFS deployment on one qualifying L3. |
| **Type** | A permanent, exact recipe for what a value means, how its bytes are encoded, what values are valid, and what it may reference. | `Photo`, `Comment`, `GameRelease`, or `GitReview`. |
| **Record** | One immutable value of an exact Type. It is author-neutral. | A photo digest, dimensions, media type, and artifact references. |
| **Publication** | A signed package saying which exact Records one author attested together. | Alice signs the photo, its locator, and an album entry as one publication. |
| **Occurrence** | One Record appearing in one particular Publication. | Alice and Bob can publish the same Record while preserving two distinct provenances. |
| **Admission** | A Realm accepted a Publication or Occurrence under an exact revision, policy, verifier, and order. | Realm R accepted Alice's photo publication at admission 42. |
| **Binding** | A Principal-controlled current pointer with compare-and-set history and tombstones. | Alice's `/photos/profile` currently points to Photo A. |
| **QueryProfile** | A separately versioned index/coverage definition. A Realm must explicitly activate it under a stated authority and cost policy; the definition cannot declare its own support or completeness. | List every admitted Photo by Alice at one exact Realm basis. |
| **Lens** | An explicit, deterministic reader policy for resolving plural evidence. | Prefer a family curator, then Alice, then Bob for album metadata. |
| **SDK** | The developer layer that generates ordinary APIs while preserving the exact evidence underneath. | An application uses a generated `Photo` object rather than hand-building hashes. |

These separations prevent convenient software from changing history. A Record
does not become trusted merely because somebody published it. A Publication
does not become accepted merely because it was signed. Admission does not make
an assertion universally true. A current Binding does not erase its history.
An empty partial query does not prove that nothing exists.

## Example — Alice publishes a photo

1. Alice's software hashes the photo bytes. The bytes may have several exact
   replicas or locators; a URL alone is not the photo's identity.
2. The SDK creates a `Photo` Record with the durable digest, media type,
   dimensions, and required typed references.
3. It creates separate Locator Records saying where verified bytes may
   currently be fetched. A dead gateway does not erase the Photo Record.
4. Alice signs a Publication containing those Records. Each Record has an
   Alice-authored Occurrence without putting Alice inside the reusable Record.
5. Alice submits a destination-specific Admission Plan. The Realm validates
   every Type and Record, checks authority and replay protection, updates all
   declared indexes and any requested Binding effects atomically, and retains
   an Admission receipt.
6. Alice may point `/photos/summer/cover` at the Photo. The earlier Binding
   remains historical evidence and a deletion cannot silently resurrect it.
7. A guest opens a link in a self-hosted Web Client without creating an
   account, connecting a wallet, booting EFS OS, or using EFS Commons.
8. The SDK reports the exact Realm basis and query completeness, fetches bytes,
   verifies their digest, and tries another locator if the first is corrupt.
9. If authors disagree about captions or album membership, the viewer's richer
   client/OS Lens selects what to show. `EXP-C0`'s contract Lens is the smaller
   bounded point-resolution subset. The competing evidence remains visible.

## Why this can support hyperstructures

EFS Core does not need a special Photo, GitHub, Arcade, Achievement, package,
or agent primitive. Applications compose the same small pieces:

- immutable Types and Records are reusable data legos;
- Publications preserve authorship without capturing the underlying content;
- Realms admit and index facts under explicit rules;
- Bindings provide controlled current names and pointers;
- QueryProfiles make discovery honest about coverage;
- Lenses let communities coordinate around trust without owning the data; and
- SDKs and applications provide many interfaces over the same public graph.

This makes a hyperstructure-grade deployment possible, but the label must be
earned. Production Core must be permissionless, independently reconstructible,
usable without EFS-hosted services, and ownerless or credibly immutable. A
versioned successor may coexist without reinterpreting the old deployment, but
a governance path that can replace current Core behavior is not itself a
hyperstructure. Neither is an upgradeable experiment.

## How expressive is the Type system?

Application authors may publish permissionless exact Types with distinct
meaning, structured values, bounded collections and variants, recursive groups,
and typed relations to other EFS objects. New applications do not require a
new Core noun or an EFS administrator's approval.

The permanent onchain validator is intentionally not a general programming
language. It uses a small, deterministic, non-callback grammar whose work can
be bounded before execution. Bounded structural validation can compile into an
exact Type. Richer validation, compatibility analysis, projections, interfaces,
taxonomies, and behavioral claims run offchain or become ordinary plural
evidence; they do not become hidden Core callbacks.

That split is how EFS combines power with century-scale safety: unbounded
creativity in the data graph, bounded work in the shared state machine.

## What is already adopted

The project owner has adopted the direction and layer boundaries, not the final
mechanisms:

- EFS 2.0 is the single greenfield successor; v1 and July designs are evidence.
- Core is standalone; Commons, the Web Client, and EFS OS are separate layers.
- A fresh qualifying EVM Realm works without Commons or another home chain.
- Direct guest reading is required.
- Portable semantic content remains separate from Realm-local admission,
  currentness, canonicality, and finality. Portable authorship is an `EXP-C0`
  candidate, not yet an adopted outcome.
- Useful typed onchain queries and a bounded contract Lens are required.
- Raw evidence, `UNKNOWN`, `PARTIAL`, provenance, exact bytes, and independent
  reconstruction remain honest through SDK and product layers.
- Core stays generic across Files, Git, Arcade, packages, achievements, agents,
  media, and future applications.
- No permanent Commons or canonical EFS chain has been selected.

## The provisional engineering candidate

`EXP-C0` is the current disposable control for design and throwaway
experiments. It is a reversible engineering selection, not frozen law:

- one flat exact nominal Type contains every intrinsic accepted-value rule and
  closed reference role;
- a separate QueryProfile owns index policy; Realm-qualified activation state
  owns authority, cost basis, historical coverage, and terminal completeness;
- layered semantic, shape, representation, and View descriptors remain useful
  compiler/catalog artifacts and hostile comparison arms, not assumed Core
  identities;
- Records are immutable and author-neutral;
- a portable ordered PublicationSet carries authorship, while a separate
  Admission Plan authorizes destination-Realm effects;
- one full-width `PrincipalId` API covers zero-setup accounts and leaves an
  additive path to managed identity;
- a self-authenticating Realm bootstrap and append-only Realm revisions expose
  execution, verifier, policy, and every possible administration power;
- Binding uses compare-and-set history, tombstones, and no resurrection;
- query answers always carry exact basis and coverage;
- the contract Lens is a finite point-resolution plan selected by the party
  bearing the risk; and
- the first implementation control, when authorized, is one deliberately
  simple monolithic state owner checked against an independent model.

Every selection has a written falsifier. Evidence can replace it without
rewriting an owner ruling.

## What remains genuinely open

- ceremony-final encodings, hashes, IDs, limits, signatures, and contract ABIs;
- whether any first-class reusable Data View earns permanent Core inclusion;
- the final Publication and Occurrence carrier;
- exact Realm identity and upgrade or succession law;
- the mandatory index bundle and its affordable limits;
- Lens grammar and maximum size;
- physical contract topology;
- production immutability versus narrowly governed upgrades;
- Commons venue and operation;
- the first permanent product and whether its Web Client includes writes; and
- managed identity, recovery, delegation, private profiles, and future
  signature suites.

## Choices the owner should make later

The project owner should not have to choose codecs or storage layouts blind.
Engineering should return those as measured recommendations. The genuine
product and value choices are:

1. **First product promise.** Is the first permanent proof primarily a
   guest-readable public filesystem/data browser, a developer data protocol,
   or a small creation and publication tool?
2. **Permanent onchain cost.** Which query and reconstruction guarantees are
   valuable enough to charge every writer for, after aggregate measurements?
3. **Immutability posture.** Should production Core be ownerless from launch,
   or have a narrow correction period followed by an irreversible freeze?
4. **Commons posture.** Should EFS endorse or operate a popular shared Realm,
   or provide neutral Core while several Commons compete?
5. **Default product policy.** Should guests initially see raw plural evidence,
   or an accessible default Lens/catalog with a clear path to inspect and
   replace it?

Until those choices are ripe, agents may keep selecting reversible engineering
controls, preserve losing alternatives and falsifiers, and return only forks
whose consequences cannot be derived from evidence.
