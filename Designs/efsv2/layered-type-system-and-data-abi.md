# EFS 2.0 — exact Type system and layered Data ABI experiments

**Status:** draft — proposal and disposable experiment target; not adopted or frozen
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[system-constitution]], [[core-architecture-candidate]], [[hierarchical-files-and-folders]], [[ethereum-standards-and-execution-profile]], [[../web-client-os/README]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-23

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/onchain #topic/graph-queries #topic/app-model

## Problem

EFS is meant to become a durable shared data layer for contracts, independent
applications, people, agents, archives, and analytical tools. Its Types are
therefore more than serialization schemas. They are a coordination surface:

- authors use them to state what immutable bytes mean;
- contracts use them to decide what may affect shared state;
- applications use them to exchange and render data;
- indexers use them to construct complete typed queries;
- archives use them to decode data after the original publisher disappears;
- data tools use them to project one graph into other physical formats; and
- communities use them to recommend compatible Types without acquiring the
  power to rewrite old data.

The current B0 candidate proves that a small, closed meta-codec can make exact
typed Records bounded and reconstructible. Its all-in-one Type identity is a
strong control arm, but it couples semantic meaning, logical shape, physical
representation, validation, reference extraction, and indexes. An index
addition can therefore rename every future Record even when the data itself did
not change. At the other extreme, accepting anything with a similar shape or a
self-asserted trait would let malicious Types impersonate important meanings.

The goal is not to reproduce a general programming language or a universal
semantic reasoner on the EVM. The goal is a small Data ABI that supports
fifty-year exactness and deliberate, bounded cooperation.

## Status and authority

This document began as the leading layered-identity comparison. The subsequent
readiness reconciliation now selects a **flat exact nominal Type plus separate
QueryProfile** as the `EXP-C0` Core control. SemanticSpec, Shape,
Representation, compatibility, projection, and View descriptors remain useful
compiler/catalog outputs and controlled comparison arms. They have not earned
independent permanent Core identities.

That is a reversible engineering selection, not adoption. This document does
**not** freeze protocol bytes, authorize a permanent deployment, or close
V2-E4, V2-E8, or V2-F1. No immediate owner answer is required; a named
falsifier may reopen a losing arm.

## Goals

The Type system must provide all of the following together:

1. Immutable exact Records with portable, deterministic identities.
2. Nominal separation for same-shape, different-meaning data.
3. Structural information sufficient for deterministic decoding, validation,
   bounded reference extraction, and code generation.
4. Reusable contract-facing interfaces that allow new exact Types to cooperate
   without executing unbounded compatibility graphs.
5. Explicit reader/writer compatibility, unknown preservation, projections,
   migration evidence, and deprecation.
6. Automatic, basis-qualified queries with honest coverage and completeness.
7. Permissionless Type publication and discovery without turning registration,
   names, popularity, or tags into endorsement.
8. Cross-language reconstruction after publishers, websites, indexers, and
   original client implementations disappear.
9. A friendly SDK path that hides IDs and codec ceremony during ordinary use.
10. A small Core whose work and state growth are statically bounded.

## Non-goals

The first permanent Type layer does not:

- infer human meaning from field names or structural similarity;
- execute arbitrary Type-selected EVM, Wasm, JavaScript, SPARQL, or callback
  validators during admission or reads;
- implement general inheritance, higher-kinded types, typeclasses, row
  inference, theorem proving, or arbitrary refinement logic onchain;
- choose one global official Type, publisher, registry, namespace, or taxonomy;
- make a Type tag, family claim, successor edge, or popularity score sufficient
  authority for a state-changing contract;
- promise public semantic discovery for data intentionally hidden inside a
  neutral encrypted carrier; or
- make a relational, columnar, JSON, EAS, or host-filesystem projection the
  canonical Record.

## Direct answers

### Does modular contract design remove the code-size concern?

It changes the concern from a likely hard blocker into a design and measurement
constraint. EIP-170 limits each deployed runtime, not the total logic reachable
through calls. External libraries, separate modules, and ERC-2535 facets can
distribute logic across deployed runtimes. Final ERC-7201 supplies a namespace
annotation and slot formula, not compiler enforcement or a frozen layout;
Final ERC-8042 supplies a distinct Diamond Storage formula. A prototype must
name the formula used for every namespace and must not silently mix them.
ERC-1167 minimal proxies are only a cheap repeated-instance overlay: every
clone still delegates to one implementation that must independently fit the
runtime limit.

That does not make the choice free:

- ordinary calls add account-access, calldata, returndata, and failure-boundary
  costs;
- `delegatecall` facets share one state but also share storage-corruption,
  selector-routing, and audit risk;
- an upgradeable Diamond introduces an authority able to replace behavior;
- an immutable Diamond still needs an exact facet set, selector table,
  namespaced storage law, and reconstructible codehash manifest;
- several state-owning modules make atomicity, initialization, reentrancy, and
  cross-module invariant enforcement harder; and
- every module and consumer adapter still has its own code-size and complexity
  budget.

The design therefore does not assume a monolith. It compares a monolith, an
immutable facet router, and narrow state-owning modules using identical semantics
and state projections. Logical module count and physical contract count remain
separate questions.

Primary precedents: [EIP-170](https://eips.ethereum.org/EIPS/eip-170),
[ERC-2535](https://eips.ethereum.org/EIPS/eip-2535),
[ERC-7201](https://eips.ethereum.org/EIPS/eip-7201), and
[ERC-1167](https://eips.ethereum.org/EIPS/eip-1167).

### Does this enable hyperstructures and data interoperability?

Directionally, yes. Exact content-addressed Types and Records provide immutable
data legos. Generated exact-Type adapters and, if they earn inclusion, bounded
Views provide stable contract-facing sockets. QueryProfiles provide complete
typed discovery at a stated Realm basis. Ordinary evidence and Lenses let
communities evolve recommendations without mutating the substrate.

It would be premature to call an upgradeable prototype a hyperstructure. A
hyperstructure-grade deployment additionally needs an ownerless or credibly
immutable execution surface, permissionless use, complete state readability,
independent reconstruction, and no mandatory hosted service. This Type design
makes that deployment possible; it does not confer the label automatically.

### Is it friendly to developers?

The intended happy path is:

```text
find a Type package
    -> generate language types/codecs/docs
    -> construct ordinary values
    -> SDK emits canonical Record + Envelope + AdmissionIntent
    -> query through generated exact-Type or View APIs
    -> retain raw unknown data and explicit basis/completeness
```

Most developers should see a generated `ChatMessage`, `ImageAsset`, or
`AwardLifecycle` API, not a hash algebra. Experts and contracts can pin the exact
IDs and acceptance rules underneath it.

### Is it safe for permanent archives?

Yes, if the schema bytes, representation rules, normative semantic commitment,
and conformance vectors remain state-readable or have an exact durable closure.
Human names, websites, publisher availability, catalogs, and mutable paths are
not required to decode an exact Record. Old data is never reinterpreted in
place; evolution creates new immutable objects and explicit relationships.

## Candidate architectures

### A — bundled exact Type

```text
TypeId = H(meaning + shape + representation + constraints + references
           + validation + indexes)
```

**Strengths:** one equality check pins everything; the query obligation is
portable; admission is simple; there is little profile negotiation.

**Weaknesses:** an index or representation improvement changes the Type and all
subsequent Record IDs; shared data liquidity fragments; migration pressure
encourages readers to invent implicit equivalence.

**Use:** retain as the simplest B0 control arm.

### B — structural or shape-first typing

```text
TypeId approximately equals ShapeId
meaning, namespace, traits, and trust live elsewhere
```

**Strengths:** excellent structural reuse; easy generic tooling; similar to
structural languages and schema validators.

**Weaknesses:** meters and seconds, revocations and withdrawals, or image bytes
and executable bytes can have identical shapes but incompatible meaning.
Contract safety depends on an ambient mapping graph or human convention.

**Use:** reject as the canonical identity model; retain structural comparison as
an SDK analysis tool.

### C — flat exact Type, split QueryProfile, optional layers — `EXP-C0`

```text
canonical semantic commitment + logical shape + representation
        + intrinsic constraints + closed reference roles
        -> TypeSchemaId

TypeSchemaId + canonical body -> RecordId

TypeSchemaId + declared indexes -> QueryProfileId
```

**Strengths:** exact meaning, accepted values, bytes, and reference extraction
remain one equality check; indexes evolve without renaming data; the Core
language stays bounded and non-executable; richer layered descriptors and
mappings remain plural evidence; archives can reconstruct exact Types and
Records without trusting a catalog.

**Weaknesses:** a representation or intrinsic-validation change creates a new
Type even when applications consider it compatible; query coverage becomes an
explicit state machine; SDK quality is essential; generated interoperability
may fragment if common interfaces do not emerge.

**Recommendation:** use C as the one integrated `EXP-C0` control. Retain A as
the bundled-index control and the layered identities/View mechanisms below as
targeted ablations. Reopen them only if an `EXP-C0` falsifier fires; do not
schedule another symmetric architecture tournament by default.

### D — open ontology and executable adapters

Types, traits, subtype edges, validation programs, and projections form an open
graph that consumers traverse or execute dynamically.

**Strengths:** maximum theoretical expressiveness and community extension.

**Weaknesses:** attacker-shaped work, ambiguous trust, cycles, context-dependent
answers, callback and reentrancy risk, impossible complete enumeration, and
non-deterministic long-term behavior.

**Use:** ordinary offchain analysis and Lens-selected evidence only. Reject for
Core execution.

## Provisional exact-Type model and optional layers

The formulas below define conceptual separation, not final bytes or names.
Every identifier is versioned and domain-separated. In `EXP-C0`, only the exact
Type and separate QueryProfile are assumed Core identities. Sections 1–4 also
describe compiler/catalog outputs and hostile comparison arms; publishing one
does not make it authoritative.

### 1. Semantic specification

```text
SemanticSpecId = H(
  DOM_SEMANTIC_SPEC,
  specCodecVersion,
  qualificationMode,
  optionalQualifier,
  normativeSpecClosureHash
)
```

A semantic specification commits to the meaning that independent producers and
consumers claim to share. It does not certify that an author is honest.

- `qualificationMode = CONVERGENT` lets unrelated publishers converge on the
  same exact specification bytes.
- `qualificationMode = QUALIFIED` intentionally binds a publisher, project,
  standards body, or application identity where shared meaning would be false.
- display names, translations, examples, tutorials, websites, popularity, and
  mutable catalog paths stay outside the identifier.
- changing normative meaning creates a new `SemanticSpecId`; correcting only
  non-normative documentation does not.

The experiment must make the normative/non-normative boundary machine-readable
and independently hashable. A prose URL alone is insufficient.

### 2. Logical shape

```text
LogicalShapeId = H(DOM_LOGICAL_SHAPE, shapeCodecVersion, canonicalShapeBytes)
```

The logical shape is independent of human field names and physical byte layout.
It contains permanent numeric field and variant keys, product/sum structure,
presence, scalar kinds, collection bounds, recursion coordinates, and only the
structural carrier/class/cardinality of references. It does **not** name exact
target Types.

Retired keys are reserved forever within a consumer-accepted successor lineage
or package. Permissionless Core can reject duplicate or malformed keys inside
one exact shape, but it cannot police one global ownership history for every
publisher's numeric key.

Two Types may share a `LogicalShapeId` while having different meaning. Shape
equality proves structural agreement, not substitutability.

### 3. Representation

```text
RepresentationId = H(
  DOM_REPRESENTATION,
  representationCodecVersion,
  LogicalShapeId,
  canonicalRepresentationBytes
)
```

The representation specifies how the logical value becomes canonical bytes:
field ordering, width and endian rules, union discriminants, collection frames,
string/bytes handling, and any representation-specific bounds.

The first experiment compares positional MC-style encoding against a compact
tagged encoding. Numeric logical keys remain stable either way. Unknown-data
preservation means retaining the original canonical body and exact Type—not
round-tripping through an older lossy object model.

### 4. Bounded Data View — comparison arm

A `ViewRevision` is a small, nominal, immutable contract-facing interface over
data. It is closer to a WIT interface or a precisely specified ERC than to an
inheritance superclass.

```text
ViewRevision {
  viewSemanticSpecId
  ordered output slots[]
  slot kinds and bounds
  intrinsic view constraints
}

ViewRevisionId = H(DOM_VIEW_REVISION, canonicalViewBytes)
```

A comparison Type may commit a bounded set of `ViewBinding`s:

```text
ViewBinding {
  viewRevisionId
  for each output slot:
    directField(fieldKey) | exactConstant(value)
}
```

Registration verifies that each mapped field exists, has the exact permitted
kind and bound, and satisfies the View's structural obligations. Version 1 has
no arithmetic, string parsing, numeric coercion, branching, dereferencing,
callbacks, recursive mapping search, or composition of one ViewBinding through
another.

A ViewBinding proves only that the Type author committed a structurally valid
mapping. It does not prove offchain truth or make an unknown publisher trusted.
`EXP-C0` does not use such a mapping to authorize admission or contract effects;
consumers use exact Types or generated consumer-pinned adapters unless this arm
independently earns Core inclusion.

### 5. Exact Type schema

```text
TypeSchemaEnvelope = abi.encode(
  u16 codecVersion,
  bytes payloadBytes
)

TypeSchemaId = keccak256(abi.encode(
  DOMAIN_TYPE,
  u16 PROFILE_VERSION,
  u16 codecVersion,
  bytes payloadBytes
))
```

The exact Type is what validates and decodes a canonical body. Anything that
changes the accepted value set, reference extraction, body interpretation, or
normative meaning creates a new Type schema.

The bounded outer envelope is canonicalized before any codec dispatch. Its
exact bytes are the stored and exported Type value. A reader that does not know
`codecVersion` still retains the raw envelope and payload, recomputes the exact
ID, and reports `UNSUPPORTED`, `UNPROVEN`, and semantic reconstruction
`INCOMPLETE`; it never guesses codec 0. A Realm may interpret or admit only
codecs its exact revision supports. Malformed outer/payload bytes, known-codec
unknown coordinates, and wrong-key integrity failures remain distinct. This is
current disposable pressure-test law, not ceremony-final protocol bytes.

Codec 0's payload owns the canonical semantic commitment, logical shape,
representation, intrinsic constraints, and typed reference roles. It does not
repeat the outer codec coordinate.

`typedReferenceRoleBytes` is the sole owner of semantic reference targets. It
binds a field key to one closed target class: exact Type, Record/Object,
Occurrence, `SELF`, an exact member of the same Type-group, or a separately
bounded existence target if that arm survives measurement. Unqualified `ANY`
and View targets are not `EXP-C0` authority-bearing roles. Mutually recursive
exact Type roles use one canonical strongly connected component/group
commitment, so no identifier requires a hash fixed point.

SemanticSpec, LogicalShape, and Representation identifiers may be derived from
the three canonical byte regions for catalogs, compiler caching, compatibility
analysis, and ablation. Core need not register or trust them separately to
validate the flat exact Type. A detached Type-to-View mapping does not become
trusted merely by being well formed; the View arm must independently justify
its authority and identity model.

`Type` is the developer-facing shorthand. APIs and evidence use the exact
`TypeSchemaId` when ambiguity matters.

### 6. Record

```text
RecordId = H(DOM_RECORD, TypeSchemaId, H(canonicalBody))
```

Record identity remains author-neutral. Authorship, Realm admission, current
selection, and trust remain Occurrence, receipt, Binding, and Lens facts.

### 7. Query profile

```text
QueryProfileId = H(
  DOM_QUERY_PROFILE,
  queryCodecVersion,
  TypeSchemaId,
  canonicalIndexSpecs
)
```

Index declarations do not change `RecordId`. Profile identity grants no
authority and does not imply Realm support. A Realm-qualified
`QueryProfileActivation` names the exact Type/Profile, RealmRevision,
generation, activation high-water, historical interval, covered-through
high-water, `PENDING | ACTIVE_PARTIAL | TERMINAL_COMPLETE` state, and activation
policy basis. Only an accepted Realm transition creates or advances it. That
policy declares who may propose activation, who bears bounded backfill and
future-write costs, and the fee rules. Terminal completion is derived from the
state machine and an independently reconstructible postings commitment, never
self-asserted by a Type author, operator, or indexer. A consumer pins the exact
Type, QueryProfile, activation generation, and basis, usually through a reusable
`ConsumerProfile` Record.

This separation is the largest usability cost of `EXP-C0` and the main reason
Architecture A remains a control arm.

An exact-Type QueryProfile cannot by itself claim complete enumeration across
every Type that claims a View. T4 therefore includes a separate disposable
`ViewQueryProfile` arm:

```text
ViewQueryProfileId = H(
  DOM_VIEW_QUERY_PROFILE,
  queryCodecVersion,
  ViewRevisionId,
  TypeInventoryHighWater,
  sorted included TypeSchemaId -> QueryProfileId pairs,
  canonical membership and coverage rules
)
```

`COMPLETE` is legal only when the pinned Type inventory through the high-water
mark is completely classified, every included Type profile has terminal
historical coverage at the requested basis, and the result reports how later
Types are excluded or force `PARTIAL`. Hostile self-implementation claims must
not silently expand or poison a complete set. This is an experiment arm, not a
pre-adopted Core index or final identity.

### 8. Validation and acceptance

Validation grades remain separate:

1. **well-formed** — canonical bytes and envelope;
2. **Type-valid** — the closed portable interpreter accepts the body;
3. **View-projectable** — in the comparison arm, a committed direct binding
   yields the named View;
4. **Realm-admitted** — a named policy accepted the Occurrence at a basis;
5. **currently effective** — lifecycle/current folds pass at a basis; and
6. **endorsed** — a consumer or Lens accepts the Type, mapping, author, or
   evidence.

Only well-formedness and Type-validity are required portable `EXP-C0` results;
View projection is a portable result only inside that explicit comparison arm.
A Realm admission policy may reject an otherwise Type-valid Occurrence but may
not rename its Type/Record or claim portable invalidity. Stateful policies and
trust never enter portable Record identity, and every receipt names their exact
profile and result.

## Contract consumption modes

Contracts choose one explicit mode per action. They never traverse an ambient
compatibility graph.

### EXACT

The contract accepts a finite set of exact `TypeSchemaId`s and generated
decoders. This is the safest mode for financial and authority-sensitive logic.

### PINNED_VIEW_SET — comparison arm

The contract pins a `ViewRevisionId` plus a finite set of accepted exact Types.
Core performs the committed direct extraction. This reduces duplicated decoder
logic without permitting new Types automatically.

### SEMANTIC_VIEW — comparison arm

The contract pins both a `SemanticSpecId` and `ViewRevisionId`, and explicitly
declares that those two commitments contain every fact relevant to its action.
Future exact Type revisions may qualify if their committed ViewBinding passes
the closed verifier. This is the principal immutable-hyperstructure extension
seam.

Use it only when semantic sufficiency is true. A token-moving contract should
normally remain `EXACT` or use its own finite governance-approved set. A generic
archive, router, message store, or display registry may safely be more open.

This mode authorizes only decoding and the declared structural projection. It
does not confer producer, issuer, curator, lifecycle, currentness, or Realm
authority. Every state-changing action must independently pin and verify its
required authorship/issuer, Realm admission, lifecycle/current fold, and basis
predicates. Republishing the same public semantic specification and a valid
`exactConstant` mapping can make data projectable; it can never make the
attacker an authorized issuer.

### LENS_CURATED_VIEW

A consumer pins an immutable acceptance-plan algorithm and an explicit Realm
basis for evolving recommendations. This supports community curation, but the
result is basis-qualified and may change. It is inappropriate where an
immutable contract requires timeless interpretation of old actions unless the
historical plan/basis is retained in the action receipt.

No mode accepts caller-supplied Types, Views, projections, validators, or
Lenses as authority merely because the caller benefits.

## Small structural language

The candidate Core grammar contains only constructs that can be bounded before
execution:

- exact fixed-width integers and booleans;
- bounded bytes and UTF-8 byte strings where a profile requires them;
- algorithm-tagged digests and fixed IDs;
- products with permanent numeric field keys;
- explicit option/presence;
- closed and open-reader tagged sums with permanent variant keys;
- bounded lists and canonical maps;
- direct typed references;
- `SELF` and group-index references for statically bounded recursive Type
  definitions; and
- finite intrinsic predicates such as byte length, numeric range, cardinality,
  sortedness, uniqueness, and exact discriminant rules.

The schema admission cost model includes more than body bytes. It statically
caps decoded nodes, nesting, collection iterations, comparison work, reference
instances, index fan-out, View slots/mappings, and aggregate writes. A deeply
nested zero-width value must not bypass the work bound.

Composition belongs at authoring time: SDK mixins or reusable fragments flatten
into one exact `LogicalShape`. The flattened result—not an inheritance graph—is
what Core validates and hashes. General row polymorphism and refinement
unification remain SDK tools.

## Directional compatibility algebra

Compatibility is directional and operation-specific. One `compatible: bool`
would be dangerously vague.

Let `V(T)` be the valid value domain of exact Type or View `T`. Every relation
names its exact mapping function and domain; it is never inferred from similar
bytes alone. Let `W` be a writer Type and `R` a reader or View:

```text
W <=read[f] R       f is total on V(W) and invents no required semantic data
W <=preserve[f] R   f retains enough bytes/evidence to recover every W value
W ==iso[f,g] R      f and g are total and g(f(x))=x, f(g(y))=y
W ->proj[p] R       explicit p exists; its committed loss may be nonzero
Q1 <=query Q2       Q2 covers every obligation of Q1 at the named basis
W <=sem[L,B] R      Lens/acceptance plan L endorses the mapping at basis B
```

Exact total read mappings compose when their intermediate domains and evidence
are identical, and query-obligation inclusion composes at one compatible
basis. Lossy projections and semantic endorsements do not compose without a
new explicit mapping or endorsement. Isomorphism requires inverse functions,
not merely two unrelated lossless-looking conversions.

Evolution checks use the direction that matches the operation:

- old writer to new reader: `Old <=read NewReader`;
- new writer to old reader: `New <=read OldReader`;
- edit and reserialize without loss: `Writer <=preserve Editor`;
- analytical export: `Source ->proj Table` with an explicit loss receipt;
- contract action: one of the four named consumption modes above; and
- query absence: required `QueryProfileId`, terminal coverage, and `COMPLETE`.

## Evolution rules

| Change | Required result |
|---|---|
| Add optional field | New LogicalShape/Representation/Type revision; retain field keys and prior body; older exact readers say unsupported, while a compatible View may continue to work. |
| Add required field | New Type revision; no claim of forward compatibility without a total default/projection explicitly committed. |
| Retire field | New Type revision; reserve the numeric key forever; retain raw old Records. |
| Change field meaning | New SemanticSpec and Type revision even if bytes are unchanged. |
| Add enum/variant | New Type revision; open readers preserve or expose unknown, state-changing exhaustive readers reject unknown. |
| Change representation only | New Representation and Type revision; semantic spec may remain. |
| Add index | New QueryProfile; Record identity remains; coverage begins `PARTIAL` until backfill completes. |
| Tighten intrinsic validity | New Type revision because the accepted value set changed. |
| Change Realm policy | Same portable Record; new Realm revision and receipt basis. |
| Rename or translate display label | No semantic ID change; update ordinary metadata/catalog paths. |
| Deprecate or supersede | Add ordinary authored evidence; old identifiers and bytes remain valid history. |

Writers always emit one exact Type revision. Readers may support several exact
Types or a pinned View. No writer emits a body whose validity depends on an old
reader ignoring malformed fields.

## Projections and migrations

Rich conversion is immutable evidence, not implicit Core behavior:

```text
ProjectionDefinition/1 {
  exact source Type/View set
  target Type, external schema, or physical format
  algorithm/spec release
  field and variant mapping
  loss taxonomy
  reversibility claim
  required resources and bounds
}

ProjectionReceipt/1 {
  exact inputs
  projection definition
  tool implementation/version
  Realm/basis/coverage where applicable
  output closure/digest
  unmapped or approximated values
  result or failure
}
```

EAS, JSON, relational, Arrow, Parquet, host metadata, and legacy-v1 adapters use
the same pattern. A projected artifact does not impersonate the original
Record, author, Realm receipt, or current state.

## Type families, traits, and typeclasses

Rich relationships remain ordinary Records:

- `TypeSuccessor` — publisher claims a later revision;
- `TypeFamilyMembership` — curator or publisher groups Types;
- `TypeEquivalence` — named exact, projection, or semantic claim;
- `TraitClaim` — a Type is claimed to satisfy a richer interface;
- `ConformanceResult` — a tool evaluated a Type/implementation against vectors;
- `DeprecationNotice` — attributed reason and replacement guidance; and
- `ConsumerProfile` — exact accepted Types, Views, QueryProfiles, validation
  grades, and coverage requirements for one use.

These edges support discovery, code generation, and Lens curation. Core does
not search them transitively during admission, resolution, or contract actions.
Only the tiny directly committed Data View has first-class structural force.

This is analogous to Rust's coherence lesson: independently extensible traits
and independently extensible Types need an explicit owner of each implementation
relationship or conflicts become ambient. EFS uses exact attributed claims and
consumer-selected acceptance rather than one global instance table.

## Data Types are not behavior or capability Types

App and contract ecosystems also need typed operations. They are ordinary EFS
Records layered above the data ABI, not more Core Type semantics:

```text
InterfaceRevision/1 {
  operation keys
  exact request, response, and error Type/View IDs
  idempotence and retry contract
  payable/value behavior
  required authority and declared effects
}

WorldProfile/1 {
  imported and exported InterfaceRevision IDs
  requested capability ceilings
  runtime/profile requirements
}
```

These records can map to Solidity ABI, WIT, OpenAPI, agent tool schemas, or
local module interfaces. They describe requests such as publish, sign, pay,
decrypt, fetch, or execute; they never grant those capabilities. The Web
Client/OS chooses handlers and permissions. This preserves WIT's useful
separation between data shapes and component interfaces without importing a
runtime or effect system into Core.

## Type packages and publisher disappearance

An ordinary immutable `TypePackageRelease` closes over everything an
independent implementation needs without placing an unbounded reference array
in one Record:

```text
TypePackageRelease/1 {
  packageProjectObjectId
  releaseVersion
  bounded direct root Type/View IDs
  canonical ArtifactClosure root
  closureEntryCount and closureDigest
}
```

The nested ArtifactClosure carries the remaining exact Type, View, profile,
projection, dependency, vector, generator/source/toolchain, documentation,
license, and notice members. It is finite, sorted, content-addressed,
independently walkable, and subject to explicit node/depth/byte/work limits.
The experiment covers the 16/17 direct-reference boundary and a 10,000-member
nested package without changing Core reference caps.

Generated artifacts are conveniences whose outputs are checked against the
same vectors; they are not the source of identity. A publisher, catalog, forge,
package registry, or website may disappear without preventing exact decoding,
validation, or code regeneration **when the exact descriptor/vector closure is
still carried by at least one available verified replica**. Unavailable
non-normative documentation remains honestly unavailable rather than blocking
Type validation. A package Release can be mirrored or appear under many names
without changing any member identity.

## Tags and Topics

Three different uses of the word “tag” must remain separate:

1. **Wire field/variant keys** are permanent numeric schema coordinates. They
   are part of exact shape and representation.
2. **Semantic Tags or Topics** are ordinary stable Objects and authored
   relationship Records such as `TagAssertion(tag, target)`. They support
   media tags, GitHub topics, catalog categories, and user organization.
3. **Type traits/families** are attributed compatibility or curation evidence.
   They never become contract authority merely because they look like tags.

Relation Types use a closed tagged target union—or separate relation Types—for
Type, View, package, schema publisher, Record, Object, Occurrence, catalog, and
projection targets. No one unconstrained `ANY` reference smuggles an unindexed
target class into the tag model. Typed backlinks make them queryable. A Lens
decides which tag authors and definitions it trusts. Registration or tag
popularity never means “official,” “safe,” “implements,” or “executable.”

Large tag sets use ordinary relationship Records rather than expanding every
application Type or requiring a universal property bag.

## Human names and EFS folder hierarchy

EFS Files is an excellent **catalog and namespace layer** for Types, but a path
must not be the Type's canonical identity.

Example friendly catalog:

```text
/types/
  chat/
    message/
      1/
        type
        semantic-spec
        schema
        views/
        query-profiles/
        vectors/
        generated/
        docs/
        successors/
  media/
    image/
      1/
```

The path is a Files-compatible hierarchy. A package version entry targets a
Files `DIRECTORY` Object. That directory contains a `manifest` entry targeting
a Files `FILE` Object whose selected immutable `FileRevision` pins the exact
`TypePackageRelease`, Type IDs, package Project, and package artifacts. It does
not point a Files entry directly at a Project, Type, Release, or arbitrary
Record. The
Principal-qualified, Lens-resolved path supplies memorable organization,
metadata, documentation, localization, tags, vectors, and codegen artifacts.
It can change or disappear without changing the Type ID.

Consequences:

- several catalogs may give the same Type different names;
- one catalog may expose stable aliases such as `/latest`, but exact use pins
  the immutable Type ID, package Release, or a full Files exact citation;
- two publishers may use the same display path in different mounts/Plans
  without a global squatting winner;
- a Lens can curate `James/types/chat/message/1` and another community can
  curate a different mapping;
- renaming or moving a catalog entry does not break exact Records;
- a disappearing publisher does not prevent decoding if the exact descriptor
  and closure remain readable; and
- private Types may use a neutral sealed-carrier catalog or no public catalog
  entry at all.

A catalog package should contain or reference the exact schema bytes,
normative-spec closure, cross-language vectors, generated-source provenance,
compatibility evidence, and deprecation/successor records. Metadata placed next
to it is discoverable convenience, not identity.

`/types` is a useful client projection, not a reserved Files prefix. A real
directory entry may be named `types`; a Web Client or OS that presents a virtual
Type catalog must label its source and keep it outside the canonical namespace
unless the selected Files view actually binds that entry.

This follows the useful Unison separation: immutable content hashes are true
references while human names are mutable metadata. It also avoids inheriting
domain-name authority as Type truth, a limitation visible in AT Protocol NSIDs.

## Discovery and curation

Candidate discovery arms to measure rather than pre-adopt:

- exact point lookup by `TypeSchemaId` and QueryProfile, plus View lookup only
  in the explicit comparison arm;
- bounded canonical enumeration of raw Type revisions, if its cost and spam
  behavior fit;
- Types by `SemanticSpecId` and directly committed View, if those indexes fit;
- Records/Occurrences by known exact Type;
- explicit QueryProfile coverage and basis; and
- optional View-wide queries only through a declared, measured View query
  profile. View implementation claims alone cannot create complete history.

Ordinary graph discovery:

- Types by publisher/Principal;
- Type packages, names, tags, successors, families, traits, projections,
  conformance results, and deprecations; and
- catalog memberships and immutable catalog editions.

Replaceable indexers provide full text, ranking, popularity, similarity, and
recommendations. Results are reverified by exact IDs. A Lens or immutable
catalog edition selects defaults. There is no canonical “official Type.”

## Developer workflow

### Author a Type

1. Choose an existing `SemanticSpec`, View, or Type when it truly matches.
2. Otherwise author normative semantic bytes and a bounded logical shape.
3. Compose reusable SDK fragments, then flatten them into one exact shape.
4. Assign permanent numeric field and variant keys.
5. Choose a representation and direct typed reference roles.
6. Bind only Views whose slots the Type satisfies exactly.
7. Choose a bounded QueryProfile separately.
8. Generate Solidity, TypeScript, Rust, documentation, and adversarial vectors.
9. Independently reproduce every ID and vector before publication.
10. Publish an immutable Type package and optionally bind friendly catalog
    paths and tags to it.

### Consume data

1. Resolve a friendly catalog path or search result to exact IDs.
2. Pin an exact Type, finite View set, Semantic View, or explicit Lens-curated
   profile according to risk.
3. Verify Realm, admission, lifecycle, basis, query coverage, and completeness
   separately from Type validity.
4. Preserve raw bodies for unknown Types/fields/variants.
5. Return `UNSUPPORTED`, `CONFLICT`, `PARTIAL`, `OPAQUE`, or `UNKNOWN` instead
   of empty/default when the required claim cannot be proved.

### Evolve data

1. Classify the change with the compatibility algebra.
2. Mint new exact IDs for every changed semantic, shape, representation,
   intrinsic-validity, reference, or View-binding commitment.
3. Reserve retired field and variant keys.
4. Publish successor, projection, migration, and conformance evidence.
5. Add a QueryProfile generation and backfill without claiming completeness
   early.
6. Update mutable catalog aliases only after the exact package is durable.
7. Never rewrite old Records or make a mutable `latest` pointer their meaning.

## Pressure-test outcomes

### Shared chat history

Use a stable `Conversation` Object and a common `ChatEvent` View. Message,
edit, reaction, membership, moderation, and attachment Types remain exact
variants or independent Records. Old clients preserve any unknown event they
retrieve. They may visibly count **all** unknown events only when a common exact
carrier or a terminal ViewQueryProfile covers the pinned Type universe; without
that proof the thread result remains `PARTIAL` or `UNSUPPORTED`. New clients can
add Types without rewriting the thread. Replies and edits target exact
Record/Object/Occurrence roles; no chronological claim relies on author time.

Fail if an unknown Type silently disappears from a complete thread, one client
can reinterpret old bytes, or chat requires a custom Core primitive.

### Media, images, videos, thumbnails, and active content

Use common Views such as `MediaAsset` and `ExactRepresentation`, with narrower
image/video Types and separate derivation, metadata, rights, Locator, and
selection Records. A thumbnail is a derived representation, not a mutable field
inside the original. Type or MIME never authorizes execution; verified HTML,
SVG, PDF, Wasm, and scripts remain inert until an explicit runtime policy acts.

Fail if a generic “Media” Type erases format-specific guarantees, a tag implies
safe execution, or a transform overwrites source identity.

### Files, folders, metadata, and host projection

Stable File/Directory Objects, immutable FileRevisions, per-name Bindings,
typed properties, and exact content closures remain separate. A File View lets
generic tools find node/content facts, but host aliases, inode numbers, xattrs,
and case-folded names are lossy projections with receipts. Unknown properties
stay in the lossless control surface.

Fail if a Windows/macOS/Linux alias changes EFS identity, partial enumeration
becomes `ENOENT`, or Files paths become the canonical Type ID.

### Git objects, checkpoints, and Forge data

Native Git identity and a logical repository checkpoint remain application
semantics. Forge Issue, PatchRevision, Review, CheckEvidence, Release, comment,
and moderation Types may share Views but do not collapse into one universal
social row. Analytical export distinguishes native objects from Forge evidence.

Fail if EFS IDs impersonate Git OIDs, an index update renames immutable Git
facts, or a dead forge database is required to reconstruct conversation.

### Awards and credentials

Award, correction, suspension, resumption, expiry, issuer revocation, holder
response, and reader recognition remain distinct exact Types or variants under
small credential Views. Core Withdrawal means carriage lifecycle only. Point
gates use issuer-qualified current Bindings and return `true | false | unknown`.

Fail if one revoked bit becomes the whole lifecycle, a public assertion implies
holder acceptance, or semantic compatibility is inferred from EAS-shaped bytes.

### App/module catalogs and typed APIs

Data Types describe immutable manifests, releases, dependency sets,
capabilities requested, and evidence. Executable behavior uses a separate WIT,
ABI, or versioned application-API artifact. Catalog membership never installs,
authorizes, or runs code. Exact releases and resolved dependency closures
survive catalog disappearance.

Fail if a Type declaration grants a capability, a mutable URL chooses a
dependency, or data schemas are stretched into an unbounded RPC language.

### Private or encrypted data

A semantically named public Type leaks category, shape, author, timing,
references, sizes, and query patterns even if its payload is encrypted. The
privacy-preserving arm uses a neutral sealed-carrier Type; inner Type, graph
references, and values are encrypted before signing. It sacrifices public
semantic indexes and ordinary contract composability unless selectively
disclosed or proven under a separate bounded proof profile.

Fail if “encrypted” is presented as graph-private while public Type/ref indexes
reveal the relationship.

### Data-science export

Every export has two layers:

1. a lossless graph spine containing exact Type, Record, body, Occurrence,
   receipt, reference, Binding, basis, cursor, and coverage data; and
2. typed relational or Arrow/Parquet projections with explicit projection IDs,
   null/absence/unknown/redacted distinctions, and loss receipts.

`u256` and binary identifiers never silently become floating-point values.
Equivalent analytical tables need not have identical Parquet physical bytes;
only a separately pinned artifact hash claims byte identity.

## Candidate responsibility boundary

The experiment must validate this placement; the table is not an adoption of
every candidate mechanism.

| Layer | Candidate responsibility |
|---|---|
| Core | Domain-separated exact IDs; tiny Type meta-codec; canonical structural validation; bounded direct reference extraction; state-reconstruction inventory if measured viable; QueryProfile activation/coverage; bounded pages and exact result grades. SemanticSpec/View identity, extraction, discovery indexes, and View-wide completeness remain explicit comparison arms. |
| Ordinary EFS Records | Specs and packages; catalogs; tags; families; traits; successors; equivalence; projections; migrations; conformance; deprecation; consumer profiles; EAS/Arrow/Parquet/host mappings. |
| SDK and code generation | Authoring DSL; mixin flattening; compatibility analysis; generated Solidity/TS/Rust; unknown preservation; catalog UX; adapters; rich validators; test corpus production. |
| Realm | Admission policy, authority verification, query-profile generation, basis, receipts, and qualified current state. |
| Lens/consumer | Trust, accepted publishers/Types/projections, curation, ranking, and risk-bearing policy. |

## EVM physical architecture

The logical surface should be decomposed even if several units compile into one
physical contract:

1. hash/domain and descriptor codec;
2. exact Type registry, QueryProfile generations, and immutable descriptor bytes;
3. Record validation and storage;
4. Envelope/authorship and Realm admission;
5. Query-profile postings and coverage;
6. Binding/current folds;
7. Lens/acceptance-plan reads; and
8. optional profile readers and generated consumer adapters outside the
   state-owning Core.

Disposable implementations compare:

### M — monolithic state owner

Internal libraries and generated code share one call and storage context.
Atomicity and invariant review are simplest, but runtime size may fail as the
full feature set lands.

### D — immutable Diamond/facet router

One state address dispatches to facets with exact selector and codehash
manifest. ERC-7201-style namespaces or an equivalent pinned raw-slot law
separate storage. Removing `diamondCut` alone does not make the result
immutable. The experiment must prove that no reachable root or facet path can
mutate routing, authority, or the execution manifest; write another facet's
namespace; delegatecall an uncommitted target; or reach a mutable
proxy/implementation. An upgradeable Diamond is measured as a development
mechanism, not labeled a hyperstructure. Unknown selectors and default facets
revert. Build tooling rejects every selector collision and binds the full
ABI—not only four-byte selectors.

### C — narrow state-owning contracts

Type/Record, admission, index, Binding, and Lens modules own distinct state and
communicate through exact ABIs. Every stateful mutator is coordinator-only; the
coordinator aborts and bubbles every failed subcall, bounds returndata, and
guards the complete commit phase against reentrancy. T5 injects failure after
each preceding module write and requires the complete post-call state digest to
equal the pre-call digest. This supplies all-or-revert EVM atomicity without
leaving independently callable commit fragments. It reduces per-runtime size
but increases cross-call, reentrancy, initialization, address-manifest, and
reconstruction complexity.

The winner is the smallest architecture that preserves one semantic state
machine, exact reconstruction, atomic admitted writes, and acceptable gas. A
hybrid may use one state owner with stateless external readers.

Every modular arm uses immutable content-addressed `ExecutionManifestId`s. Each
manifest binds the root codehash, sorted selector/full-ABI routes, module and
linked-library addresses/codehashes, storage namespaces/layout schema, compiler
profile, and every surviving mutation path. Manifests are append-only and
enumerable; each Realm revision and admission receipt/high-water range pins the
applicable manifest. A clean reader must reconstruct every historical execution
graph and verify every codehash from state without events. Root codehash alone
is never presented as the implementation identity of a proxy, clone, facet
router, or linked-library deployment.

## Downsides and long-term hazards

### More concepts

Developers must sometimes distinguish `TypeSchemaId` from `QueryProfileId`
where EAS exposes one schema UID. Advanced compiler/catalog workflows may also
surface SemanticSpec, Shape, Representation, or View identifiers. Generated
APIs, package manifests, and diagnostics must show these layers only when
relevant.

### Ecosystem fragmentation

Permissionless publication can produce many nearly identical Types, Views,
names, and mappings. Exact IDs prevent corruption but not social fragmentation.
Catalogs, conformance packs, usage evidence, and Lenses help coordination; they
cannot force consensus.

### Semantic dishonesty

Core can prove structure and commitments, not that `meters` really means meters
or that an issuer's claim is true. Consumers still need authority and trust
policy. A first-class View must never be marketed as a semantic oracle.

### Permanent schema mistakes

Bad field keys, bounds, meanings, or privacy choices cannot be edited away.
Successors and projections mitigate mistakes but do not erase them. Tooling
needs strong preview, vector, lint, and hazard gates before publication.

### Query-profile complexity

Separating indexes preserves Record identity but introduces activation,
dual-write, backfill, coverage, and cursor rules. A bug can make absence
dishonest. Architecture A remains attractive if the operational cost exceeds
the identity benefit.

### Code and state cost

Views, descriptors, indexes, raw state readability, and versioned modules all
consume gas and permanent state. Modular deployment avoids one code-size wall,
not total cost. Every mandatory feature must pass aggregate workloads, not an
isolated microbenchmark.

### Canonicalization risk

One cross-language disagreement can fork IDs forever. Final encodings require
literal byte vectors, malformed corpora, independent implementations, and
reconstruction—not only prose or shared generated libraries.

### Cryptographic and specification aging

Hash suites, signature systems, Unicode tables, external standards, and
normative documents can age or become unavailable. Every identifier names its
algorithm/profile; a successor hash suite creates new identifiers plus explicit
equivalence/projection evidence rather than changing old IDs. Type packages
retain exact normative bytes and dependencies, not only URLs. No claim promises
that a broken old hash remains collision-resistant forever; archives preserve
the original fact and add stronger timestamped/rehashed evidence.

### Privacy leakage

Public Type and Query IDs reveal intent. The neutral sealed carrier preserves
privacy at the cost of search and contract use. No clever inheritance or trait
mechanism removes that tradeoff.

### Upgrade and governance risk

Facets and modules make code replaceable, but replacement authority can
reinterpret state or censor access. Production hyperstructure claims require
immutable code or a narrowly proven semantic-preserving successor model with
fully reconstructible revisions.

### Tooling dependence

The model is only friendly if SDKs, generators, explorers, catalogs, error
messages, and migration tooling are excellent. Exact raw access must remain
possible so the ecosystem is not trapped by one toolchain.

## Prior art and what EFS should copy

| System | Copy | Do not inherit |
|---|---|---|
| Protocol Buffers | Permanent numeric field/enum keys, reservation after deletion, unknown preservation, explicit compatibility rules. | Non-canonical serialization and semantic identity by external `.proto` name. |
| Cap'n Proto | Evolution-aware field ordinals, tagged unions, schema IDs, and explicit recursive structures. | Representation assumptions optimized for conventional memory rather than EVM validation/state. |
| Avro | Directional writer/reader schema resolution, aliases, defaults, and explicit unions. | Runtime resolution ambiguity or implicit lossy promotions in state-changing contracts. |
| IPLD Schemas | Separate logical Type from representation strategy; content-addressed typed links; explicit union representations. | Programmable advanced layouts inside permanent Core. |
| AT Protocol Lexicon | Shared schemas, generated clients, open/closed unions, and independent application interoperability. | Domain-authority names as durable semantic identity or one network's repository assumptions. |
| WIT / Component Model | Small nominal records/variants/interfaces separated from implementation; generated language bindings. | Treating behavior/API capability Types as ordinary persistent-data Types. |
| CUE | Constraint unification, closed/open structures, reusable authoring fragments. | General unification or dynamic constraints onchain. Flatten them before publication. |
| Smithy | Mixins and traits as authoring/codegen tools with a flattened effective model. | Ambient trait precedence or service-specific behavior in Core. |
| RDF/OWL/SHACL | Plural vocabularies, graph-shaped metadata, shapes as separate validation inputs, explicit validation reports. | Open-world reasoning, recursive/undefined validation, SPARQL callbacks, or global ontological entailment during contract reads. |
| Unison | Content-addressed immutable definitions, names as mutable metadata, canonical handling of recursive groups. | A general content-addressed programming language or executable dependency graph in Core. |
| Solidity ABI / ERCs | Exact nominal interfaces and ecosystem coordination through narrow standards. | Assuming selectors or shape alone specify behavior, trust, or query completeness. |
| Ethereum dType/table/representation proposals | Registry, schema, table, projection, and introspection mechanics plus useful attacks from ERC-1900/1921/2157/7208/7813/8074/8100/8119. | Mutable registry/admin meaning, four-byte or human-string identity, event-only completeness, or self-declared canonicality/authority. |
| Arrow / Parquet | Logical versus physical analytical representation and extension metadata. | Treating an optimized table file as the canonical graph or silently coercing unknown/large values. |

The research conclusion is not that EFS needs a more exotic type theory. The
best techniques converge on stable numeric coordinates, exact nominal identity,
separate logical and physical layers, explicit directional compatibility,
unknown preservation, flattened authoring composition, immutable interfaces,
and generated tooling. The EVM contribution is to make the smallest useful
subset bounded and contract-readable while leaving rich reasoning outside Core.

## Disposable comparison inventory

No result may set `protocolConformance=true`. T1–T9 below are the full
comparison/freeze inventory for V2-E4/V2-E8/V2-F1, **not** the current execution
plan. A losing arm, million-record sweep, three-topology build, or full
three-language SDK exercise runs only after an `EXP-C0` falsifier or when its
specific `GO-FREEZE` gate opens.

### `EXP-C0` minimum run

The next throwaway run is one micro-Realm trace corpus, independent pure model,
and monolithic Solidity SUT. It takes only these slices from the inventory:

| Inventory | Minimum now |
|---|---|
| T1 | one exact TypeSchema/Record candidate codec; product, option, bounded list, exact reference, one recursive group; noncanonical/unknown/absent-versus-zero twins; independent vector recomputation |
| T2/T3 | one bundled/layered/View comparator over identical accepted values; one same-shape wrong-meaning and caller-supplied View attack; exact-Type adapters remain the default |
| T4 | one QueryProfile activation from `PENDING` through partial backfill to state-derived terminal completion, plus mixed-basis/cursor and empty-partial failures |
| T5 | monolith only; record code/gas/state ceilings but build no facet/module arm unless the monolith fails a named profile |
| T6/T7 | Files and Git as the primary exact-reference/disappearance traces; Nanda, EAP, media, packages, and Arcade remain thin no-new-Core-noun canaries |
| T8 | one generated TypeScript façade over raw-preserving semantics; independent full SDK/codegen comparisons wait for G6/`GO-FREEZE` |
| T9 | the micro-profile's legal maxima and first failure points; 64-leaf, million-record, and full topology sweeps wait for their measured gate |

The run also includes two-leaf portable PublicationSet/destination AdmissionPlan,
EOA/ERC-1271 admission with retained historical verifier result, one Binding
CAS/tombstone/Withdrawal, one BindingScope page, 1/8/32/64 point Lens reads, and
state-only reconstruction. The active ordering and exit rules live in
[[v2-contract-readiness-program]].

### T1 — exact descriptor and Record vectors

Implement independent Solidity, TypeScript, and Rust encoders/decoders for:

- SemanticSpec, LogicalShape, Representation, ViewRevision, TypeRevision,
  QueryProfile, and Record IDs;
- products, options, closed/open-reader sums, lists/maps, references, and one
  recursive group;
- the closed reference-target vocabulary—exact Type, View, Record/Object,
  Occurrence, `ANY`, `SELF`, and group member—including one two-Type mutually
  recursive SCC with no identifier fixed point;
- positional and tagged representation arms;
- unknown field/variant preservation, absent-versus-canonical-zero, separated
  field-key and union-selector domains, retired coordinates, and malformed,
  out-of-range, incomplete, or unknown selectors; and
- malformed lengths, duplicate/reserved keys, non-canonical order, excessive
  depth/work, and trailing bytes.

Pass only if all implementations independently mint identical bytes and IDs and
reject the same malformed corpus.

### T2 — evolution and compatibility corpus

Exercise additive and breaking fields, retired keys, unknown variants,
same-shape/different-meaning Types, representation-only revisions, View
continuity, lossless/lossy projections, competing mappings, publisher
disappearance, and schema republication. Compare committed in-Type View
bindings against detached immutable consumer-pinned mappings, including the
identity churn of adding a View and malicious detached mappings. Exercise
cross-version chat replies and exact EAP lifecycle targets without traversing
family or trait graphs.

Add additive and retired fields, changed defaults, key/tag collisions,
unknown-selector preservation for open readers, fail-closed exhaustive
effectful readers, and a proof-bearing experimental representation whose field
coordinates either remain stable or force a new Representation revision. Do
not import unbounded-list or SSZ assumptions into Core merely because the
evolution fixtures were inspired by EIP-7495/7688/7916/8016.

Pass only if every writer/reader direction and information-loss result is
machine-readable and no test relies on a mutable name or publisher endpoint.

### T3 — immutable contract data-lego consumers

Build small consumers for `EXACT`, `PINNED_VIEW_SET`, and `SEMANTIC_VIEW`:

- chat event storage/router;
- media metadata reader that never authorizes execution;
- file-head reader;
- credential gate; and
- application-package inspector.

Attack with same-shape wrong-meaning Types, dishonest View claims, malformed
mappings, unknown variants, caller-selected acceptance, recursive mappings,
and returndata/memory grief. In particular, an attacker republishes the public
SemanticSpec, supplies a structurally valid `exactConstant` mapping, and
self-authors the Record; it may decode but must not gain issuer/producer/current
authority. Test `LENS_CURATED_VIEW` as a basis-qualified read or explicitly mark
that fourth mode deferred. Fail if Core follows an open graph or callback.

### T4 — query-profile evolution

Load old/new Type revisions with one active and one pending QueryProfile.
Measure admission fan-out, double writes, backfill, cursor invalidation,
coverage, reconstruction, and 99–100% dead-posting dilution. Prove that an
empty partial page is never absence.

Separately test the disposable ViewQueryProfile arm. Add a new implementing
Type before, during, and after backfill; inject hostile self-implementation
spam; pin the inventory high-water mark; and prove membership, per-Type
coverage, later-Type exclusion, cursor behavior, and `PARTIAL`/`COMPLETE`
transitions. Compare it with one exact common carrier Type.

### T5 — physical contract architecture

Implement the same state projection as:

1. monolith with internal libraries;
2. immutable facet router with pinned selectors, codehashes, and storage
   namespaces; and
3. narrow contracts plus atomic coordinator.

Measure runtime/initcode by module, deployment gas, cold/warm calls, complete
admission and View/query reads, revert atomicity, reconstruction inputs,
upgrade/freeze manifest, and adversarial reentrancy/storage/selector cases.

Run against a named conservative profile from an actually activated disposable
reference EVM environment and separately named future-scenario profiles; this
selects no venue and confers no qualifying-Realm status. Record runtime/initcode,
transaction/block gas, calldata/returndata, warm/cold access, state-write, and
precompile assumptions. Semantics must survive profile changes; feasibility
and topology conclusions remain profile-qualified.

Negative controls include ERC-7201/8042 namespace-formula mismatch, ERC-1167
dependency loss, mutable ERC-1967/ERC-2535 routes, runtime-only or optimistic
module manifests, and self-declared selector/interface mismatches.

Kill an individual physical arm if it exceeds the selected named profile's
predeclared safety margin or any test finds direct-call mutation, swallowed
failure, partial commit, reentrant half-state, selector/default-dispatch
collision, foreign-namespace write, route/manifest mutation, uncommitted
delegatecall, unreconstructible current or historical code/routing, or any
mutation path in an arm labeled immutable/hyperstructure.

### T6 — names, tags, and catalogs

Create two competing Type catalogs with Unicode Files names, shared exact
Types, conflicting aliases/tags/successors, a vanished publisher, and a private
sealed Type. Each package version node is a Directory Object containing a
manifest File Object; its selected FileRevision pins the exact package Project
and Release. Reject bare
Project, Type, Release, and arbitrary Record targets as malformed Files entries.
Exercise closed target-union tag relations, the 16/17 direct-reference package
boundary, and a bounded 10,000-member nested closure. Resolve friendly paths
through two Lenses, then remove catalogs, forge, registry, publisher, generator,
and unpinned hosts before reconstructing every still-carried exact descriptor.

Pass only if names/tags help discovery without changing identity or silently
granting compatibility.

### T7 — workload and export matrix

Run one frozen corpus containing:

- version-skew chat with an unknown event Type, partial pages, and hostile
  backlinks;
- inert verified HTML, SVG, Wasm, and active-media metadata;
- Files host projection where `UNKNOWN` never becomes `ENOENT`;
- stock Git checkpoint reconstruction and Forge evidence;
- Award issue, correction, suspension, resume, revocation, carriage-only
  Withdrawal, and a spam-bounded issuer gate;
- application API v1/v1.1/v2 with unknown method, field, and capability cases;
- sealed carriers with public-marker and residual-metadata leakage reports; and
- two independent Arrow/Parquet exporters followed by lossless re-import and
  exact ID checks.

The lossless graph spine retains descriptor/View/profile bytes, canonical body,
Envelope/signature, Realm revision/basis, receipts, lifecycle, references,
Bindings, cursors, and QueryProfile coverage history. Fail if any ordinary
workload needs an application-specific Core Type kind or hidden database, or if
an expected result above is absent from the retained machine-readable report.

For the application API fixture, an unknown major version refuses launch; an
unknown minor method returns typed `UNSUPPORTED` with no effect; unknown data
fields remain raw-preserved; and unknown capabilities are denied or attenuated,
never granted. Any silent dispatch, ignore, or privilege expansion fails.

### T8 — developer coordination and recovery workflow

Run a fixed author/consume/evolve/discover matrix against both bundled B0 and
the layered candidate from two clean SDK implementations. It includes:

- author one Type, publish its package, and generate Solidity/TypeScript/Rust;
- consume it in exact and View modes;
- add an optional field, add a View, add a QueryProfile, and publish one
  breaking successor;
- resolve two conflicting catalog/Lens recommendations with visible provenance;
- diagnose an empty `PARTIAL` query without reporting absence; and
- repeat generation with the publisher, registry, forge, and network offline
  using only the exact package closure.

Retain deterministic generated-output hashes, exact IDs, command count,
user-supplied protocol-field count, mutable-network-read count, diagnostics,
and every manual compatibility/trust choice. Pass only if independent SDKs
produce identical semantic outputs, offline generation succeeds with zero
mutable reads, no happy path asks the developer to manually compute canonical
bytes/IDs or envelope/index internals, unchanged-View author/consume command
count is no greater than B0, and the layered arm requires strictly fewer manual
protocol fields. Discovery must show both provenance and basis rather than
silently selecting one catalog.

### T9 — long-horizon and adversarial bounds

Sweep maximum legal descriptor/body/reference/index/View limits, 64-leaf
admission, 64-Principal Lens reads, hot-value churn, malicious schema spam,
million-record backfill, module code growth, and state-only reconstruction.

Return measured limits and first failure points. Do not select caps by prose.

## Experiment kill criteria

Reject or substantially redesign `EXP-C0` if any of these holds:

1. View registration or extraction needs an open graph, callback, recursion, or
   attacker-shaped work.
2. A View lets same-shape wrong-meaning data authorize a contract without an
   explicit consumer choice.
3. QueryProfile evolution can return `COMPLETE` before exact historical
   coverage or makes reconstruction depend on a hosted indexer.
4. Cross-language implementations cannot agree on exact bytes and rejection
   precedence without sharing one implementation.
5. Legal schema/body combinations exceed the intended Realm transaction or
   state-growth budget.
6. All viable physical layouts require unsafe mutable proxy authority or cannot
   preserve one atomic state machine.
7. T8 fails its deterministic-output, offline-recovery, zero-manual-ID, command,
   or strictly-lower manual-protocol-field thresholds against bundled B0.
8. A workload requires Core to infer semantic equivalence, run arbitrary
   validation code, or add an application-specific primitive.
9. Exact Type/package reconstruction fails after publisher, catalog, generated
   code, and project-operated indexer removal.
10. The neutral private carrier still leaks its inner Type or graph through a
    supposedly absent public index.

## Open questions

- [x] Which Type arm leads the disposable control? — `EXP-C0` uses flat exact
  Types, split QueryProfiles, generated exact-Type adapters, and no
  authority-bearing View mapping. This selects what to test, not a winner.
- [ ] Do first-class bounded Data Views falsify the exact-Type-only Core under
  T3/T5 while remaining bounded and unable to self-authorize?
- [ ] Does split QueryProfile identity survive the bundled B0 comparator and
  T2/T4/T9 usability, activation-authority, coverage, and reconstruction tests?
- [ ] Does excluding committed or detached View bindings from authority create
  unacceptable identity churn or prevent a required contract workload in
  T2/T3?
- [x] Is View-wide completeness required in `EXP-C0`? — No; use exact Types or
  a pinned finite Type inventory. T4/T7 may reopen it with a bounded
  counterexample.
- [ ] Which representation arm gives the best combination of EVM cost,
  canonicalization simplicity, and unknown preservation? Resolve with T1/T2.
- [ ] Which physical deployment shape preserves atomicity, immutability,
  reconstruction, and reasonable gas? Resolve with T5.
- [ ] Should production Core be immutable, or permit narrowly defined
  semantic-preserving upgrades whose full code/state basis is pinned? Return
  this to the owner only if both survive T5 and security review.
- [x] How does `EXP-C0` enumerate raw Types? — Through exact-Type QueryProfiles
  and ordinary catalogs, not SemanticSpec/View indexes. T4/T6/T9 may reopen
  that selection.
- [ ] Does a generic neutral sealed carrier meet the product privacy floor, or
  is selective disclosure/proof needed for the first release? Resolve with T7
  and the existing privacy gate.

None of these is an immediate owner decision. Each names the experiment that
must run before a decision packet is mature.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [x] `**Target repos:**` confirmed
- [x] No design lifecycle dependencies; [[owner-rulings]] is an authority input
- [x] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

No permanent implementation is authorized. `EXP-C0` permits design convergence
and disposable experiments without waiting for an owner mechanism choice. Keep
the B0 bundled Type arm and optional layers as targeted controls, retain exact
artifacts and independent reconstruction, and return only measured failures or
irreducible owner-value forks.
