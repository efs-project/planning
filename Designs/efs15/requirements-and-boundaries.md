# EFS 1.5 bridge — requirements and boundaries

**Status:** draft
**Target repos:** planning, contracts, sdk, client
**Depends on:** —
**Supersedes:** —
**Reviewers:** @codex-gpt-5 (2026-08-07, identity, adversarial-risk, and source-precedence lanes)
**Last touched:** 2026-08-07

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efs15 #topic/requirements #topic/lenses

## Problem

Nanda and Arcade need a usable EFS before the native v2 design is ready. Using
v1 unchanged would let real data accumulate behind unpredictable, chain-local
EAS UIDs and would preserve several assumptions that are expensive to unwind.
Waiting for every v2 portability, authority, and filesystem question would
make the product evidence depend on an open-ended redesign.

EFS 1.5 is the deliberate middle: keep the working EAS-backed system, but fix
the identity and graph seams that would otherwise make links unstable, writes
multi-stage, and later migration needlessly destructive.

## Status ledger

The labels in this table are normative for reading this draft. They prevent a
useful simplification from silently becoming permanent architecture.

| Class | Current statement |
|---|---|
| **Adopted owner direction** | v1 plus the existing SDK is the supported bridge for current Nanda and Arcade work. |
| **Adopted owner direction** | EFS 1.5 backports universal EFS object IDs and a limited/tag-oriented graph vocabulary from v2 into an EAS-backed design. |
| **Required consequence** | EAS attestation UIDs are carrier receipts only. They do not appear in stable links, semantic references, object/slot identity, or canonical indexes. |
| **V1.5 MVP assumption** | one visible identity address per author; one explicit visible identity address/principal per lens entry. This is not the claim that one human has one key forever. |
| **Candidate mechanism** | device/app/session keys may act through one stable smart-account address so EAS still records one attester. The authenticated path is not yet a shipped Arcade dependency. |
| **Candidate convention** | separate addresses may be linked bilaterally for display only. A link is not authority, key delegation, authorship, lens inheritance, or recovery. |
| **Open design** | the exact ID formulas, canonical name grammar, minimum kind set, EAS schema/resolver changes, deployment strategy, and old-record handling. |
| **Explicitly outside 1.5** | full KEL, chain-free portable statements, portable current-state/revocation proofs, cross-chain global-current claims, and the complete v2 lens/authority model unless an MVP requirement forces one forward. |

## Requirements

### R1 — Universal IDs name EFS things

Every EFS object and logical slot intended for stable semantic linking has a
deterministic `bytes32` EFS ID that can be computed before submission and
reused across chains, deployments, RPCs, and offline packages. A comment,
review, or other item that needs a durable hyperlink must be modeled as an EFS
object or explicitly exposed as a realm-qualified EAS receipt.

At minimum, the derivation must:

- exclude chain ID, EAS deployment, schema UID, resolver address, block data,
  timestamp, transaction hash, and EAS attestation UID;
- use versioned domain separators, unambiguous canonical encoding, and frozen
  kind/role constants;
- define byte-exact name/path rules, including Unicode normalization, case,
  separators, escaping, root handling, and trailing-slash behavior;
- publish matching Solidity and TypeScript golden vectors, collision tests,
  and malformed-input vectors before durable writes;
- keep paths such as `/Arcade/` as shared Schelling-point subjects rather than
  claims owned by the first person to instantiate them; and
- make concurrent byte-identical instantiation of a shared subject idempotent,
  non-owning, and safe inside a dependent batch. A same-ID/different-preimage
  case must fail deterministically.

“Universal ID” means the subject keeps one name. It does **not** mean every
chain, lens, or reader agrees on its current contents. Current/effective reads
remain qualified by realm, deployment, lens, and basis.

The deep dive must keep four namespaces mechanically distinct:

| Identifier | Meaning | Portability |
|---|---|---|
| **Object/SubjectId** | a topic, data object, list, or other stable thing | universal within the frozen 1.5 derivation profile |
| **SlotId** | the stable semantic coordinate over which claims compete, supersede, or coexist | universal within the frozen 1.5 derivation profile |
| **LogicalClaim/EdgeId** | canonical semantic assertion used for replay deduplication and provenance grouping | chain-independent only if its exact canonical inputs are frozen |
| **EasReceiptUid** | one EAS-carried statement/admission receipt on one realm and deployment | chain/deployment-local |

One logical claim may have several EAS receipts. EFS indexes deduplicate by the
logical claim/slot rules while retaining a realm-qualified receipt multimap.
Revoking one receipt affects that receipt in that realm; it does not silently
revoke copies elsewhere. The exact duplicate, supersession, and partial-
revocation fold is a freeze item, not an SDK guess.

### R2 — EAS UIDs are receipts, never semantic references

EAS continues to identify a particular chain-local statement and supplies
attester authentication/provenance, chain-local admission/block time,
revocation, and a resolver hook. EFS separately identifies the thing, logical
claim, or slot that statement concerns. EAS does not by itself authenticate an
internal smart-account actor or establish human identity.

Therefore:

- public semantic routes, SDK handles, graph edges, cache keys, canonical
  semantic index keys, and new EFS resolver events key on EFS IDs;
- resolvers derive or validate every claimed EFS ID;
- SDK receipts may return both `efsId` and one or more `easUid` values, with
  distinct types and names;
- native EAS events, receipt/provenance views, carrier receipt maps, and EAS
  revocation calls retain typed `EasReceiptUid` values alongside the relevant
  EFS ID;
- any retained EAS `refUID` is explorer convenience only and cannot be index
  authority; and
- a mined EAS UID can never become a semantic parent, target, definition, slot,
  or the input needed solely to construct a dependent object in the next
  block.

This separation is what makes dependent writes precomputable and allows a
high-level action to be atomic and idempotent where EAS batching permits it.

### R3 — Preserve a full-width principal seam without building KEL

New ID and SDK semantics use a full-width `bytes32 PrincipalId`. EFS 1.5
accepts only the address-shaped profile:

```text
PrincipalId = bytes32(uint256(uint160(authoringAddress)))
```

Owned-object and slot formulas consume that full word. A v1.5 resolver may
derive it from the EAS attester, but no new semantic boundary should truncate
an arbitrary future principal to `address`.

APIs and receipts reserve three separately typed fields even when the v1.5
bare-EOA path makes some values coincide:

- **principal/author** — durable identity shown by EFS;
- **actor/signer** — optional key evidence that authorized an action; and
- **submitter/payer** — account that delivered or funded it.

No actor is asserted unless an account adapter supplies verifiable evidence;
`actor = principal` is not a filler value. EFS 1.5 does not implement
EFS-native independent-actor authority or portable relaying. The full-width
seam avoids foreclosing the intended in-place KEL path; the eventual KEL
compatibility matrix must prove that no object rekey is required before that
path is promised.

Universal owned IDs are stable across chains only for the exact same
`PrincipalId`. The same-looking smart-account address may be undeployed or
controlled by different code, owners, or session policy elsewhere. EFS 1.5
does not synchronize account deployment or controller state; authoring remains
single-realm unless deterministic deployment and equivalent control are
independently verified.

### R4 — Use a bounded graph vocabulary, not “everything is one blob”

The direction is tag-oriented, not literally one undifferentiated record.
At least these semantic distinctions must survive:

- a permanent shared definition/topic identity;
- a permanent owned data/file identity;
- a revocable cardinality-one binding (`PIN`-like); and
- a revocable cardinality-many membership (`TAG`-like).

`LIST` or another constrained collection object remains only if an Arcade,
Git, or schema use case needs immutable list policy that ordinary tags cannot
enforce. Properties, mirrors, redirects, and entries should be tested as
reserved definition roles over the small core before receiving distinct
record types.

The exact five-kind v2 proposal is **not** adopted here. EFS 1.5 must select
the smallest set that satisfies concrete product traces while preserving
cardinality, ownership, revocation, bounded reads, and resolver checks.

### R5 — Keep the good developer properties of EAS

Dropping EAS UIDs as object identity must not accidentally drop what makes EAS
useful. EFS 1.5 must demonstrate an end-to-end loop in which:

- developers publish, reuse, and cite shared schemas/types;
- users and indexers enumerate and search those types;
- contracts and apps query records by known type with bounded reads;
- deterministic shape checks and stateful resolver/application checks are
  distinguishable;
- invalid data is not presented as admitted merely because bytes exist; and
- real EAS tools/data can be projected or imported with explicit loss labels.

The deep dive must decide whether application schema identity also receives a
universal EFS ID in 1.5 or remains an explicitly chain-local EAS facility. It
must not let “TAGDEF exists” stand in for a complete shared-schema workflow.

### R6 — Keep identity simple at the EFS layer

The MVP rule is:

> One lens entry is one visible authoring address/principal, not necessarily
> one human and not necessarily one private key.

A raw EOA satisfies the rule with the least machinery. If a user later needs
multiple device or app keys, the preferred bridge is for those keys to execute
through one stable smart-account address. EAS then records the account as the
attester, so attribution, first-attester-wins resolution, revocation, and
cardinality still operate over one visible address.

That invariant holds only when the device/session key causes `EAS.attest` to
execute through the account context. A child key that attests directly or uses
a delegation path that records the child as attester violates it. Before this
mode ships, the account authorization must be reviewed and every write path
must assert post-submit that `attester == expectedPrincipalAddress`.

This reuses the useful core of [[efs-account-system]], but does not adopt that
historical design wholesale. In particular, the authenticated in-account SDK
routine is not currently a reviewed, shipped Arcade prerequisite. Anonymous
play and read-only browsing must not wait for any account path.

`JamesCarnley.eth` is a display name resolved for the underlying address; ENS
is not the protocol identity. Interfaces should make the address inspectable
and avoid treating a mutable name resolution as historical authorship.

### R7 — Linked addresses, if ever shipped, are display-only

A one-sided `parentKey` property is unsafe: anyone could claim James as a
parent. A parent-authored list proves only that the parent made that claim; it
does not prove the child agreed or was controlled at the time of an old write.

The smallest tolerable convention is bilateral and one-hop:

1. the primary address asserts a cardinality-many link to the other address;
2. the other address asserts a cardinality-one acceptance back to the primary;
3. a client shows the link only when both claims are authenticated as authored
   by the exact endpoint addresses and are live under the same named realm and
   read basis; and
4. the UI says “currently linked to JamesCarnley.eth,” not “authored by
   JamesCarnley.eth.”

Even then the relationship is presentation metadata only. It grants no write,
revoke, namespace, curation, application, or lens authority. It does not merge
latest-wins state. Lenses must not auto-expand linked addresses for gates or
resolution. Current linkage must never silently relabel historical child
content as parent-authored.

Removing a link is prospective un-endorsement, not proof that a key was valid
before one block and stolen after it. Solving that requires temporal grants,
revocation ordering, and historical authority evidence—the KEL problem EFS
1.5 is intentionally deferring.

### R8 — Untrusted Arcade code never receives identity authority

Anonymous browsing and game execution are read-only by default. Comments,
curation, and other writes are initiated through trusted OS chrome. A game
does not receive a user's root EOA, account owner, unrestricted session key,
or the ability to turn a linked-address claim into authority.

If promptless writes later use an app/session key, the account layer must
scope it and make it act through the stable visible account address. The EFS
graph is not a substitute for account authorization.

## What must be fixed before durable Arcade data

| Gate | Why it cannot be deferred |
|---|---|
| Exact EFS ID grammar, domains, canonicalization, and cross-language vectors | Changing them later renames every durable link and object. |
| EAS-UID separation in contracts, SDK types, semantic indexes/routes, and new EFS events | Allowing both spellings creates split graphs and multi-block dependencies; native EAS receipt/audit surfaces remain explicitly typed. |
| Full-width principal input to new ID formulas | Cheap now; otherwise address truncation becomes a second identity migration. |
| Minimum graph roles and slot/cardinality rules | A wrong cardinality or dual encoding corrupts latest-wins and indexing. |
| Shared-subject duplicate/race behavior | The first caller or an honest concurrent batch must not own, poison, or brick `/Arcade/`. |
| Stable authoring principal for the official Arcade curator, plus initial realm, custody/recovery policy, and explicit single-chain or verified deterministic cross-chain account plan | Moving later to a different principal fragments curation, objects, reputation, and lenses forever; the same address alone does not prove the same controller elsewhere. |
| Shared-schema/resolver regression trace | Universal IDs are not a win if developers lose type sharing, discovery, or validation. |
| Inventory of live v1 data and consumers | “No meaningful data yet” is an assumption to verify before redeployment or incompatibility. |
| Canonical small-write and retry tests | A small Arcade write must fit one atomic EAS batch. Larger/gas-constrained exceptions may stage explicitly and retry idempotently, but no follow-up transaction may exist solely to discover a mined UID. |
| Lens-bound behavior | Current v1 caps lenses at 20 and silently truncates the rest. 1.5 must keep, raise, or replace the cap and at minimum make truncation a typed, visible outcome. |

## Acceptable, explicit MVP debt

- EAS remains the carrier and the chain-local attester-provenance, block-time,
  resolver, and revocation ledger.
- Statements, revocations, and resolver outcomes remain chain/deployment-local.
- Lenses remain ordered explicit address/principal lists.
- Ordinary low-stakes users may author through bare EOAs.
- No address-linking feature needs to ship.
- No portable current-state or cross-chain revocation promise is made.
- No KEL recovery, scoped portable actors, P-256/PQ principal, or threshold
  organization support is promised.
- Old EAS statements may later be imported as provenance-qualified evidence;
  they are not promised retroactive chain-free authorship.

## Known downsides we are choosing

| Debt | Consequence in 1.5 |
|---|---|
| Bare address identity | Lost key means lost future control; stolen key is indistinguishable from the owner; there is no native recovery or safe rotation. |
| One visible address | Public activity is correlated; separate private personas must stay separate rather than be publicly linked. |
| Explicit address lenses | Changing the visible principal requires manual lens updates and can fragment reputation. Independent public device/app addresses cannot inherit the parent; account-internal signers may remain hidden behind the same address. |
| V1 lens ceiling | `MAX_LENSES = 20`; excess URL entries are silently truncated today. One identity per address reduces device fan-out but does not solve large community/curator sets. |
| No historical authorization ledger | A removed or compromised key cannot be cleanly classified “valid before T, invalid after T,” and strong backdating resistance is absent. |
| Smart-account escape hatch not yet shipped | Multi-device promptless authorship cannot be an Arcade launch assumption until the authenticated path is implemented and reviewed. |
| Address choice before write one | Moving from an EOA to a different deployed account later creates a second identity; only a same-address upgrade avoids the split. |
| Cross-chain account state | The same address on another chain does not prove the same deployment or controller. 1.5 authoring is single-realm until that equivalence is verified. |
| Future KEL activation race | Without an earlier upgrade commitment, a later EOA-to-KEL inception cannot distinguish the legitimate owner from a thief holding the EOA; first valid inception is an explicit residual risk. |
| EAS-local statements | The object ID can travel while its original attestation, revocation, and current-effective result remain realm-specific. |
| Universal subject, plural state | `/Arcade/` has one subject ID, but “official games now” still depends on a curator/lens and a named state basis. |
| Display links | Bilateral links still expose correlation, can be changed later, and prove association rather than delegation or historical control. |

## Pull KEL or stronger identity authority forward when

- an independent device/app key must author **as** the same principal and be
  separately revocable;
- identity must survive controller/signing-key replacement without relying on
  same-address account machinery;
- authorization at write time must remain provable after later revocation;
- a removed key must be unable to submit a backdated strongest-grade record;
- protocol-enforced scopes are needed rather than account/vendor policy;
- lens membership must survive key rotation without editing every lens;
- passkeys, P-256/PQ, threshold organizations, or non-address principals are
  MVP requirements;
- a linked address must mean “authorized to act for” rather than “displayed
  together.”

## Pull the portable envelope or native-v2 boundary forward when

- author and submitter must be independently verifiable rather than merely
  represented as separate API fields;
- portable relaying is required; or
- cross-carrier authorship must survive independently of EAS attester state.

## Open questions for the EFS 1.5 deep dive

- [ ] Freeze the exact canonical bytes and ID formula for the root,
  `/Arcade/`, child topics, owned data, and cardinality-one/many slots.
- [ ] Derive the smallest graph-kind/schema set from complete Arcade, Nanda,
  Git-backed Markdown, shared-schema, and ordinary file-browser traces.
- [ ] Decide whether 1.5 upgrades the current resolver set, deploys a parallel
  schema set, or performs a clean replacement after the live-data inventory.
- [ ] Choose the stable official Arcade curator identity before its first
  durable write and document recovery/custody expectations.
- [ ] Decide how universal application schema/type IDs, EAS schema UIDs, and
  resolver/policy identities relate without losing EAS tooling.
- [ ] Decide whether smart-account/session-key support belongs in the first
  1.5 implementation or remains a later additive identity adapter.
- [ ] Decide before valuable bare-EOA identities accumulate whether 1.5 needs
  a first-use future-upgrade commitment or explicitly accepts the later
  first-valid-KEL-inception race.
- [ ] Decide whether to retain, raise, or replace v1's 20-address lens cap and
  replace silent truncation with an explicit result.
- [ ] Specify old-v1 import/redirect behavior and the honest boundary between
  preserved evidence and re-authored 1.5 state.
- [ ] Produce contract/SDK/client handoffs, migration tests, gas measurements,
  and an explicit v2 compatibility matrix before implementation is called
  ready.

## Evidence and cautions

- [[deterministic-ids]] gives the failure analysis and an older EAS-carried
  direction, but its header forbids implementing the formulas without a
  coordinated re-cut.
- [[codex-kinds]] is the strongest current tag-core proposal, but remains a
  draft and must be grounded again for 1.5.
- [[efs-account-system]] explains why many independent attester addresses
  break latest-wins and why one account/many internal signers is cleaner. It
  is historical input, not current authority.
- [[wallet-and-actions]] contains the bilateral display-link fallback; its
  pre-KEL authority model is explicitly superseded.
- [[kel]] shows that address-shaped principals can later upgrade in place and
  names the recovery, actor, scope, and temporal-authority machinery omitted
  here.
- [[fable-handoff-portable-schemas-and-validators]] defines the EAS feature
  regression test that 1.5 should run even though portable signed data is out
  of scope.
- [ADR-0026](../../../contracts/docs/adr/0026-max-lenses.md),
  [ADR-0031](../../../contracts/docs/adr/0031-lenses-url-param-model.md), and
  [ADR-0039](../../../contracts/docs/adr/0039-default-lenses-priority-chain.md)
  are current v1 lens evidence; they do not establish the future principal
  model.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

No implementation is authorized by this draft. The next pass should produce
separate contract, SDK, and client handoffs only after the irreversible ID and
graph gates above are resolved.
