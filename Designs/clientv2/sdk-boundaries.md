# EFS SDK vs EFS OS SDK — the developer platform
**Status:** draft
**Target repos:** planning, sdk, client
**Depends on:** [[web-os-thesis]], [[sdk-vs-client-responsibilities]], [[read-lens-spec]], [[codex-envelope]], [[codex-kinds]], [[deterministic-ids]], [[apps-cookbook]]
**Reviewers:** —
**Last touched:** 2026-07-22 — codex-gpt-5 (app-model research correction; original fable-5)

#status/draft #kind/design #repo/planning #repo/sdk #repo/client

## Problem

v2 has two developer surfaces that are one npm-install apart and a trust-universe apart: the **protocol SDK** any web page can use, and the **app runtime SDK** a Ring-3 compartment lives inside. Every dead web-OS precedent that blurred this line paid for it — Chrome Apps died as a private API platform at ~1% adoption; Snaps stays healthy partly because a snap is still recognizably a JS module (Reviews/2026-07-07-clientv2-corpus/research/webos-precedents.md). Meanwhile the existing boundary doc ([[sdk-vs-client-responsibilities]]) is written in EAS-era vocabulary (delegated attestations, 7702 tuples, `multiAttestByDelegation`) that the native envelope kills. This doc restates the two-SDK doctrine for the native-envelope era, fixes the ownership matrix, and defines the developer platform around it: dual-target apps, dev mode, typed contracts, versioning, conformance, naming, and what belongs in neither package.

The ruling in one line: **`@efs/sdk` is the protocol as a pure library; `@efs/os-sdk` is the capability veneer of one particular OS; the Kernel and Shell are implementation.** Dependency direction is law: `@efs/os-sdk` depends on `@efs/sdk`; never the reverse; neither depends on Kernel internals.

## The design

### `@efs/sdk` — pure protocol and data [research-grounded]

The test from [[sdk-vs-client-responsibilities]] survives verbatim: *if it requires a secret, a long-running process, a DOM, or a product decision, it is not the SDK's.* What changes is everything under the test. `@efs/sdk` owns, in the native-envelope era:

- **Record building** — typed constructors for the five kinds + two ops ([[codex-kinds]]): TAGDEF, DATA, LIST, PIN, TAG; ASSERT/REVOKE. Canonical body encoding (NFC name profile, VAL tails, `MAX_VALUE_BYTES`, `expiresAt` word placement), reserved-key row typing (`mirrors`, `supersededBy`, `home`, …).
- **Deterministic IDs** — the frozen math of [[deterministic-ids]] + the v2 delta: `tagId`, `dataId`, `listId` (config fold), `propertyId` interning, `claimId = keccak256(DOMAIN_CLAIM_V1, author, seq, recordDigest)`. This is the `@efs/ids` successor named in [[codex-envelope]]; it ships as `@efs/sdk/ids` and is the golden-vector generator the freeze gates depend on.
- **Envelope assembly** — TID/seq minting, positional Merkle tree (domain-separated constants, odd-node promotion, single-leaf proofs), EIP-712 digest under the chain-free `("EFS","1")` domain, **signing payload preparation** (`eth_signTypedData_v4`-ready structs). Never the signature itself.
- **Resolve + verify per [[read-lens-spec]]** — the §3.1 resolution algorithm as a pure, differential-testable function; grade computation (§2 closed set + currency qualifiers + flags); deny composition (§3.4); classifier + web3:// grammar (§6); verification order lens → signature → bytes (RR9); checkpoint/freshness-horizon math (§5). RR1–RR12 are `@efs/sdk`'s conformance contract — a third-party client that uses the SDK resolver inherits them.
- **The honesty kit as data** — the shared string catalog the thesis mandates ("STALE-vs-REVOKED wording cannot fork per client") ships *in this package*, as versioned data: string IDs with required slots (venue, N, age), not hardcoded English. Localization rides language packs; certification is against IDs + slots.
- **The pending-state ladder as types** — the enum `draft → … → replicated`, legal transitions, and runtime validators live here so third-party outboxes and plain-web apps share one vocabulary. The outbox *machinery* does not (see Private, below).
- **Submission strategies via seams** — strategy code (direct RPC write, sponsored-bundle POST, offline `.efs-bundle` export/import) against injected interfaces. The SDK opens no sockets of its own in OS context; a plain-web adapter (`@efs/sdk/web`) provides fetch-based `Transport`/`Provider` defaults.

**Portability correction:** one broad `Transport`/`Provider` seam is not enough to describe Ethereum, Solana, local bundles, and cloud/content-addressed stores honestly. [[solana]] defines the conceptual split into artifact codec, signer suite, evidence replica, authority venue, query/proof, byte store, and workspace capabilities; exact SDK names remain part of the coordinated recut.

Never, structurally: keys, servers, DOM, UI, telemetry, ambient network, product policy. `npm install @efs/sdk` still runs nothing.

### The ownership matrix, re-cut for v2

| Concern | `@efs/sdk` | `@efs/os-sdk` | Kernel/Shell (private) |
|---|---|---|---|
| Build records + envelopes; deterministic IDs; encode/decode; hash | **owns** | re-exports types | uses |
| Signing payload preparation (EIP-712 envelope struct) | **owns** | — | consumes at ceremony |
| Sign / hold keys / personas | never | requests via outbox | **owns** (wallet ceremony, persona keys) |
| Resolve + grade + deny + classify (RR1–RR12) | **owns** (pure fn) | `efs.read` veneer | runs it inside the broker |
| Honesty strings, ladder vocabulary | **owns** (data + types) | surfaces them | renders them |
| Transport / RPC / gateway choice | seam (`Transport`) | never (no fetch at all) | **owns** (network broker, endpoint capabilities) |
| Mirror fetch + byte verification | verify logic **owns** | receives `Graded<bytes>` | fetch execution **owns** |
| Render / pixels | never | **owns the client side** (surface/canvas/document requests) | **owns compositing** |
| Storage | pure helpers only | `efs.storage` (quota'd) | journal, caches, capability table |
| Pickers, prompts, permission UI | never | **request** API | **owns** (System Chrome) |
| Dev tooling | vectors + simulators | probes API | dev resolver/runner |

**EAS-era rows that die** (they were "SDK owns" in [[sdk-vs-client-responsibilities]]): delegated-attestation EIP-712 (`multiAttestByDelegation`) — no EAS; the 7702 auth tuple — AA is at most a submission rail, never an authoring path; ERC-1271 anything — never admissible ([[codex-envelope]]); "attester" vocabulary — it is **author** now; the EAS schema-UID registry — replaced by kinds + reserved keys + TAGDEF. The **sponsorship seam survives with a new payload**: what gets POSTed to a sponsor endpoint is a signed envelope bundle (author = the user, carriage paid by the sponsor), and the censorship/observation caveat from the old doc carries over unchanged. [reasoned]

### `@efs/os-sdk` — the Ring-3 app runtime [research-grounded]

A thin, typed veneer over Kernel-minted MessagePorts (thesis F8). It contains **no protocol logic** — it imports that from `@efs/sdk` — and no privileged code; it is the client half of a wire protocol. Surface, by namespace (pruned from the 2026-05-26 brainstorm against F1/F5/F8; the brainstorm's `efs.network.fetch`, `efs.wallet.sign`, `efs.wallet.sendTransaction`, and app-rendered-DOM assumptions are ruled out):

- `efs.read` — lens-resolved reads returning `Graded<T>`; **`context: 'GATE' | 'INTERACTIVE'` is a required parameter, no default** (RR5/§3.3 enforced Kernel-side). Includes stat/list/resolve/watch shapes; watch events carry grade transitions, not just "changed".
- `efs.outbox` — `stage(records) → DraftRef`, `plan()`, `requestCheckpoint()` (asks System Chrome for the signing ceremony; never returns a signature to the app), ladder subscription per draft, per-record admission status, `export()` request (a Shell security event).
- `efs.pick` — typed picker requests: file/folder/subtree, lens, endpoint (with privacy class visible), persona, contact. Returns scoped capability handles; designation = authorization.
- `efs.surface` — render capabilities: commit a surface-mode UI tree (schema TBD per thesis open question), acquire an `OffscreenCanvas` (canvas mode, with mandatory semantic sidecar), request document-mode rendering of a `Graded<bytes>` via the render service.
- `efs.storage` — quota'd per-app KV + blob store; `quota()` first-class; eviction events surfaced honestly (thesis honesty doctrine #2).
- `efs.locale` — the `LocaleHandle`: methods, not data (format/collate/segment/pluralize/translate); full-profile access is a separate high-sensitivity capability request.
- `efs.actions` — registers the app's action catalog (root authority for agent tooling, F9); receives typed invocations with Kernel-validated args.
- `efs.meta` — `granted()`, `request()`, `manifest()`, `version()` (wire-protocol version + Kernel generation), `quotas()`, capability introspection for graceful degradation.
- `efs.crypto` — hash/verify re-exported from `@efs/sdk`, running in-compartment (no port round-trip); `encryptFor`/`decrypt` are capability requests.

Lifecycle: the runner starts the compartment with the attenuated `efs.*` object as its only endowment; handlers are time-bounded (Snaps `maxRequestTime` precedent); `suspend`/`resume`/`terminate` events are delivered, not negotiable; validated typed config (CML-style `config` block) arrives before first run.

### What is PRIVATE — Kernel/Shell implementation

Not API, not semver'd, changeable any release: the capability router and caretaker-proxy internals; membrane implementation; the journal schema and its materialized views; the capability table's storage format (the *diff* is user-visible data; the schema is not an API); System Chrome components and prompt layouts; the flush engine; persona key wrapping; venue courier scheduling. The rule: **apps and third-party clients may depend on wire contracts and on `@efs/sdk`; anything reachable only by being the Kernel is private.** Fuchsia's lesson is the reason: the kernel-layer contract held for a decade while shell-layer APIs were designed, shipped, and deprecated twice (research/fuchsia-components.md §1.10, lesson 5). We keep the narrow layer frozen and let the private layer churn.

### The dual-target pattern — every EFS app is also a web page [research-grounded]

The webos-precedents portability lesson is binding: *package standard web content; an `efs.*`-only app model that can't share code with the ordinary web is on the wrong side of the Chrome Apps grave.* Normative pattern:

```ts
// App core codes against a host interface, not against a platform.
interface EfsHost {
  read(q: ReadQuery, ctx: ReadContext): Promise<Graded<Record>>;
  stage(records: RecordDraft[]): Promise<DraftRef>;      // may throw HostCannotWrite
  pick(req: PickRequest): Promise<Handle[]>;              // web host: own picker UI
  locale: LocaleFormatting;                               // methods-only subset
}
// Target 1: EFS OS   — createOsHost() from @efs/os-sdk (ports, pickers, personas)
// Target 2: plain web — createWebHost({ transport, signer?, endpoints }) from @efs/sdk/web
```

The plain-web host wires its own wallet connection, endpoints, and DOM; it renders grades itself (using the same honesty catalog) and runs its own mini-outbox (same ladder types). Consequences: (a) an app's core logic is testable in Node with a fixture host; (b) the OS is an *upgrade* — personas, promptless scoped writes, pickers, quota'd storage — not a gate; (c) app developers adopt EFS before adopting EFS OS, which is the only adoption order that has ever worked. Surface-mode UI is the one non-portable part; the manifest may declare a `webFallback` entry (ordinary DOM build of the same core) and first-party app templates ship both targets from one repo. [reasoned]

### Dev mode — the loop a developer actually lives in

Ships as **`@efs/dev`** (CLI + Kernel dev-environment capabilities), never present in production closures (Fuchsia environments: the dev resolver exists only in the developer environment). [reasoned]

- **Dev resolver/runner** — `dev://localhost:<port>` scheme, loudly labeled in all chrome ("DEV APP — unpinned code"); each reload is an ephemeral generation; grants persist across reloads but are marked dev-scoped.
- **Manifest simulator** — validate + canonicalize + hash the manifest offline; show exactly what install review will show, including the **capability-diff preview** against the previously published version (the diff *is* the review, thesis §Adopted primitives).
- **Outbox inspector** — every staged record with its computed claimId, envelope preview, ladder position, and the honest string the user would see; "why is this stuck at `queued`" is a first-class query.
- **Read-grade probes** — force any grade/qualifier (STALE with age N, EQUIVOCAL, REVOKED, UNKNOWN-with-cause, BYTES-UNAVAILABLE) against fixture venues so app grade-handling is testable without staging real incidents. Conformance C2 (below) runs on these.
- **Devnet seeding** — one command seeds the community devnet fork (chainId 26001993 convention) with a fixture corpus: personas, lenses with deny facts, a contested slot, an expired freshness beacon, a package channel — the worked examples of [[read-lens-spec]] §9 as live data.

### Typed contracts discipline — one IDL, four artifacts [reasoned]

Every Kernel↔app message crosses a schema-versioned postMessage RPC: `{ v: WireVersion, id, method, params }`, validated both sides, unknown fields rejected (not ignored) at the Kernel boundary. The source of truth is **one IDL** (working name `efs-idl`; format is an open question below) from which we generate:

1. **TypeScript types** — what `@efs/os-sdk` exports;
2. **Runtime validators** — enforced at the membrane in both directions (the Tauri/Bishop-Fox warning: IPC *configuration* is what gets attacked);
3. **Reference docs** — per-method, with capability requirements and risk notes inline;
4. **Agent tool schemas** — the action-catalog and MCP/A2A exhaust (F9) emitted from the same definitions, so the agent-visible surface can never skew from the app-visible one.

Nothing hand-written may shadow a generated artifact; CI diffs generated output against the IDL. ATProto's lexicon-resolution retrofit is the cautionary tale for shipping typed schemas late.

### OS SDK versioning and compatibility [reasoned]

- The thing that is versioned is the **wire protocol** (the IDL), not the JS library; `@efs/os-sdk` npm majors track wire majors.
- **Manifests declare a range**: `program.osSdk: ">=1.2 <2"`. The manifest is compiled and hashed, so the declared range is part of app identity and of install review.
- **Kernel policy on mismatch** — refuse or attenuate, never emulate silently:
  - unknown **major** → launch refused with an honest, actionable label: *"This app requires OS interface v2; this generation speaks v1. Update the OS generation or install an older app version."* Rollback/pin links included (generations make "run the old one" a real option).
  - app built against a **newer minor** → launch permitted; unknown methods return a typed `CAP_UNSUPPORTED { method, sinceVersion }` — never `undefined`, never a stub. Apps feature-detect via `efs.meta.version()`.
  - app built against an **older minor** → full compatibility; additive-only evolution within a major is a hard rule (deprecations mark methods but never remove them inside a major).
- The Kernel supports a **window of wire majors** (target: current + previous); dropping a major is a generation-level event that install review and the app-compat report must surface.

### Conformance — the certifiable set for third-party clients [reasoned]

Anyone can build an EFS client; the ecosystem needs a way to say "this one won't lie to you." Three levels, each a runnable suite shipped in **`@efs/conformance`** (vectors generated by `@efs/sdk`, which is itself the reference implementation named in [[read-lens-spec]] §8.3's implementation notes):

| Level | Name | Contents |
|---|---|---|
| C1 | Conforming Reader | read-lens §8.3 acceptance tests + RR1–RR12 vectors; classifier + URL grammar; deny composition; GATE/INTERACTIVE split behavior |
| C2 | Honest Renderer | honesty-string catalog conformance (IDs + required slots rendered; no positive-trust chrome; STALE never conflated with REVOKED; UNKNOWN never rendered as absence); truth-trap checklist as assertions |
| C3 | Conforming Writer | envelope golden vectors (the 42-vector suite + amendments); ladder transition legality; idempotent resubmission on deterministic claimIds; default `expiresAt` on interactive bundles; export-is-a-security-event behavior |

Levels nest (C2 requires C1; C3 requires C2 for anything that renders). Certification results are published as EFS records by the steward and by independent curators — lenses are the registry, k-of-n applies, and a regression earns a deny fact exactly like a malicious package. A client may self-report; *verified* status requires a curator attestation naming the suite version and the tested client CID.

### Naming — the developer-facing split

- **`@efs/sdk`** — "the EFS SDK." Subpath exports: `/ids`, `/envelope`, `/resolve`, `/honesty`, `/ladder`, `/web` (plain-web adapters). The `@efs/ids` successor folds in as `/ids` rather than a separate package [open — freeze-gate tooling may want it standalone].
- **`@efs/os-sdk`** — "the EFS app SDK." One package, tiny (ports + generated types/validators + `@efs/sdk` re-exports); the size gate stays merciless here — heavy logic belongs Kernel-side or in `@efs/sdk`.
- **`@efs/dev`**, **`@efs/conformance`** — tooling, never in app bundles.
- Docs teach the split in one sentence: *"Building for the web? `@efs/sdk`. Building an app for EFS OS? Add `@efs/os-sdk`."* If the product gets a real name (thesis Naming is [open]), `os-sdk` keeps its package name — package identity should not chase brand identity.

### What belongs in NEITHER SDK

Per [[sdk-vs-client-responsibilities]], unchanged in spirit: anything with a key, a server, or an operating cost. The **relayer/sponsor reference implementation**, the **trustless gateway**, the **gas station/paymaster**, the **home-endpoint container** (F5), pinning services, and indexer services are client-owned infrastructure. We should still *ship* reference implementations (operators must not build them cold) — but in a separate `efs-infra` repo with its own release cadence, consuming the SDK's seams like any third party. Putting them under SDK semver would couple protocol-library releases to ops software and quietly re-privilege our infrastructure — the exact failure [[sdk-vs-client-responsibilities]] guards against.

### Agent lens

Agents change three things here. (1) **The IDL's fourth artifact is load-bearing**: agent tool schemas are generated exhaust of the same definitions apps use, so an agent's view of an app's actions can never diverge from the app's actual surface — no hand-maintained MCP server drift. (2) **Dry-run honesty is an SDK property**: deterministic IDs let `@efs/sdk` compute the exact claimIds, envelope digest, and ladder projection of a plan *before* signing; agent dry-runs (F9) call the same pure functions execution calls, making "what would happen" provably the same computation as "what happened". (3) **Conformance gates agent trust in clients**: an agent consuming grades or receipts from a third-party client should check its certification records (a GATE read) before treating that client's LIVE as LIVE; the conformance program is what makes that check possible. Dev-mode probes and the manifest simulator are themselves typed actions, so agent-driven app testing needs no bespoke harness.

### Honesty obligations

- **No bytes without a grade.** Every read API in both SDKs returns `Graded<T>`; there is no `readUnsafe`. BYTES-UNAVAILABLE is a distinct state (RR12), never an exception that loses the authenticated pointer.
- **UNKNOWN carries a cause.** The SDK resolver emits typed cause codes (no-transport-capability vs venue-miss vs policy-denied) so "not permitted to look" never renders as "not found" (thesis honesty doctrine #1). The protocol-level naming of this taxonomy is filed as a gap below.
- **Read context is mandatory.** `GATE`/`INTERACTIVE` is a required argument end to end; GATE stops at STALE mechanically (RR5) in the SDK resolver itself, not in caller discipline.
- **The ladder is the only "saved".** Neither SDK exposes `isSaved()`; state is a ladder rung with a catalog string. Apps that want to summarize must map rungs through the catalog, so no client can invent a dialect of "saved".
- **Strings are certifiable data.** The honesty catalog's required slots (venue, N, age) are validated at render registration; C2 conformance tests that a client cannot drop the qualifier and keep the string.

## Open questions

- [ ] IDL format: bespoke TS-first schema (zod-style source with codegen) vs an established IDL (JSON-Schema-based, Smithy-like, WIT, or another option). Agent tool-schema emission, multi-language bindings, resource/lifecycle semantics, and validator performance at the membrane are forcing functions. [[fable-third-party-app-model-handoff]] must test whether WIT is the source, an adapter generated from an EFS-owned schema, or unsuitable. Needs a prototype ADR (sdk repo). [open]
- [ ] Where the surface-mode render schema is specified — inside the os-sdk IDL or a separate spec shared with the Shell. Blocked on the thesis's surface-mode open question. [open]
- [ ] `@efs/sdk/ids` vs standalone `@efs/ids`: freeze-gate vector generation wants a minimal, auditable, contract-adjacent artifact; subpath export may be too entangled for external review. [open]
- [ ] Conformance governance: who may attest certification, suite-version pinning, deny-fact policy on regressions (k-of-n as in app curation, or steward-only at launch). [open]
- [ ] Are pre-`signed` ladder rungs (draft/planned/ready_to_sign) certifiable behavior or informative vocabulary? They are client-internal states a third-party client may legitimately collapse. [open]
- [ ] Does `@efs/sdk/web` ship default fetch transports in-core or as an optional adapter package, given the size gate? [open]
- [ ] Gap (filed for the efsv2 pressure report): no blessed app-package/closure record convention; no freshness-commitment primitive; UNKNOWN cause taxonomy; per-record risk classes; grade→executability table. See structured output; these bind this doc's conformance and dev-mode sections.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Depends-on chain verified against [[web-os-thesis]] and the efsv2 rulings (no contradictions)
- [ ] No AGENT-Q comments remain
- [ ] At least one round of `#status/review` with another agent or human comment
