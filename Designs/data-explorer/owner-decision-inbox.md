# EFS Data Explorer — owner decision inbox

**Status:** reference — compact live queue; all mechanisms remain evidence-gated
**Audience:** James first; Data Explorer and adjacent-lane designers second
**Last reconciled:** 2026-08-22
**Inputs:** [[README]], [[architecture-and-state]], [[views-extensions-and-capabilities]], [[experiments-and-stop-conditions]]

#status/reference #kind/decision #repo/planning #repo/client #repo/sdk #topic/efsv2 #topic/read-path #topic/graph-queries #topic/app-model #topic/privacy

> **Decide now: nothing.** James has delegated the durable Data Explorer product
> experience and authorized research, design and disposable experimentation.
> The recommended workbench, product horizons, view model, extension lanes and
> implementation sequence remain proposals. No owner decision is needed to run
> the bounded first experiment round.

## Decide after evidence — do not answer yet

### DATA-E1 — product/package boundary

After E1a proves deterministic UI/result isolation and E1b proves the same
qualified guest results through cold direct public reads in both direct and
OS-hosted profiles, decide whether the first production Explorer ships as a
separately versioned built-in App package, an independently deployable direct
client that the Shell can host, or another reversible packaging arrangement.

**Escalate only if:** packaging choices materially change guest boot weight,
self-hostability, update/recovery authority or semantic parity. Repository and
deployment selection before that evidence would create needless permanence.

### DATA-E2 — published saved views

After E2/E3 prove the local view configuration and lossless exit, decide
whether a published `ExplorerViewSpec` becomes a durable EFS Type, maps to a
more general adopted artifact, or stays outside protocol scope.

**Escalate only if:** at least two independent products need interoperable
published view state and the alternatives have meaningfully different
authorship, migration, privacy or permanence consequences. Local saved views
need no owner decision.

### DATA-E3 — executable extension ceiling

After E5 compares declarative, host-owned capability RPC and opaque-origin Web
surfaces, decide whether any executable third-party Explorer extension class
is worth supporting and which shared OS capability/isolation profile may host
it.

**Escalate only if:** one or more arms pass all isolation/revocation/exit gates
and a real use case cannot be met by built-ins or inert declarative
projections. A sandbox failure closes or narrows the lane; it is not an owner
choice to waive the safety property.

### DATA-E4 — write-capable MVP label

After the shared Files/Web Client/OS action boundary exists, E6a determines
whether the first production slice can honestly include certified Files writes.

**Escalate only if:** the read product passes but write evidence remains
inconclusive and delaying the entire product versus shipping explicitly
read-only has a real strategic tradeoff. The Explorer cannot invent a direct
write path to satisfy a label.

## Delegated feedback required from owning lanes

These are bounded interface reviews, not owner questions and not transfers of
mechanism ownership.

### Core / Realm

- Confirm that the Explorer's qualified outcome axes and raw/evidence path do
  not add a second truth or Lens reducer.
- Identify the minimum observable evidence for an exact basis, historical
  authority, Realm admission/current selection and complete-vs-incomplete
  enumeration; confirm whether complete Binding enumeration is required or
  provide a smaller equivalent.
- Confirm that unsupported consumer projection and missing/tampered bytes can
  remain independent of semantic presence without a new Core noun.
- Review E1a/E1b/E4 falsifiers and name any case that cannot be reconstructed
  from canonical inputs without a privileged index.
- Confirm that the E1a/E1b disposable qualified facts-matrix crosswalk
  preserves the umbrella presence/coverage/support/validation/authority/
  lifecycle/selection/observation/bytes/effect distinctions without adopting
  their candidate names or bytes in the Explorer.

### Files

- Supply or critique stable product-facing outcomes for open, qualified
  listing/pages, exact citations, revision/content identity and verified byte
  acquisition; preserve every attempt and causal failure.
- State the exact law for directory completion, pagination/order, masked names,
  duplicate/conflicting candidates and cross-Realm mounts needed by tree/list.
- Confirm which proposed writes can be certified, which preconditions and
  authority roles the planner owns, and which operations are non-atomic or
  compensating.
- Name private, encrypted, writable and native-mount cases that must remain out
  of the first public guest fixture.
- Confirm the canonical public inputs required for E1b's fixed-basis pages,
  raw fallback, verified bytes and cold reconstruction after optional indexes
  and warm caches are removed.

### SDK

- Demonstrate provider-neutral, raw-preserving decoders for exact Types,
  unknown/unsupported data and versioned domain DTOs without collapsing
  qualified outcomes into value/error.
- Provide a candidate paged result with explicit source, query/profile, basis,
  order, cursor/resume, coverage and completeness plus opaque or exportable
  evidence handles.
- Demonstrate verified metadata/range handles that retain corrupt/unavailable
  attempts and do not expose provider credentials.
- Map one deterministic action request/plan/receipt/read-back fixture without
  defining product UX or assuming permanent API/bytes.
- Supply the real disposable adapter arm for E1b and a dependency/network trace
  surface sufficient to compare every qualified fixture fact with E1a while
  proving that no optional indexer or ambient system service supplies truth.

### Web Client / OS

- Review the six application-boundary journeys in
  [[architecture-and-state#Smallest journeys that can falsify the split]] and
  confirm whether Data Explorer can remain a trusted built-in App over the same
  guest adapter rather than Kernel or a second resolver/verifier.
- Confirm the ownership split: Explorer navigation/views/selection/bulk UX/
  Inspector/local policy; shared Reader/Files/SDK semantics; System Chrome
  grants/signing/install/recovery ceremony.
- Identify the smallest stable resource/page/artifact/evidence/action surfaces
  the App may consume and the raw Inspector escape; keep generated semantic
  machinery under the adapter in ordinary app code.
- Evaluate the three ordered extension lanes—inert descriptors, host-owned
  semantic surfaces over capability RPC, opaque-origin Web surfaces—and reject
  any installation path that injects custom elements or active HTML into the
  trusted Shell realm.
- Assign ownership for offline storage quotas/migrations, safe preview, app
  recovery and extension grants without making those services direct guest
  boot dependencies.
- Review E1b's cold-browser/module/storage/network trace and confirm that the
  App reaches direct public Realm reads only through the shared guest Reader/
  Files adapter, without System Kernel/full-OS/Shell-service, account, profile,
  catalog or warm-cache hydration; E1a alone is insufficient. The candidate
  Reader Kernel label does not put Explorer inside the Kernel or give it a
  second resolver/verifier.

## Recording and escalation rule

A future question appears in only one live queue. Core/Files/SDK/Web Client/OS
mechanism choices stay in their owning design sets. Data Explorer records only
the product consequence and accepted interface version. After James answers a
real product question, record the attributed ruling before changing authority
labels. A prototype pass, fixture, review approval or permission to draft is
not adoption of text, bytes or implementation.
