# EFS v2 + OS — owner decision inbox

**Status:** draft decision packet; no choice here is adopted until James answers and it is copied into [[owner-rulings]]
**Audience:** James first; designers second
**Last reconciled:** 2026-07-21
**Inputs:** [[owner-rulings]], [[assumptions-and-requirements]], [[fs-pass-james-decisions]], [[privacy-james-decisions]], [[onchain-completeness]], [[client-os-pressure-report]], and [Client v2 open questions](../clientv2/open-questions.md)

#status/draft #kind/decision #repo/planning #topic/efsv2 #topic/clientv2 #blocked-on/human-decision

> **This is the one phone-friendly inbox for owner choices.** The source documents remain the detailed reason trail. Future agents must not ask James to re-answer a source question that this packet classifies as settled, deferred pending evidence, or superseded.

## How to answer

Reply with codes, for example: `A1, B1, C1, D1`. Add exceptions in plain English. An answer such as `B1 except lens ceiling` adopts the cluster except for the named part.

There are **four useful choices now**. Everything after them either needs measurements first or is a launch/operations choice that should not interrupt constitutional design.

## Decide now

### A — Strong authority without a cross-chain empire

This resolves [[assumptions-and-requirements]] D-1 through D-7 as one coherent architecture instead of seven accidentally incompatible answers.

- **A1 — Adopt the recommended minimum strong-authority profile.** Require protection from post-revocation backdating; use one measured fixed EFS authority domain for the v2 protocol profile; let zero-setup EOAs publish portable evidence immediately but grant strongest authority only after admission; clients may verify the authority domain remotely, while foreign contracts need an explicit adapter or disclosed local commitment; do not build a universal cross-chain hub; do not support same-principal home migration in v2; define a narrow same-domain successor mechanism for future signature suites. **Recommended.**
- **A2 — Portable evidence only.** No canonical admission witness. Simpler and more sovereign per object, but current authorization and post-revocation backdating remain policy-dependent and ambiguous.
- **A3 — Per-principal authority homes.** Preserve individual venue choice now, accepting locators, multi-home reads, adapters, migration, and much larger proof/recovery scope.

**What A1 does not decide:** the actual authority venue, exact receipt bytes, finality profile, or successor ABI. Those require the authority prototype and measurements.

### B — Ratify the system boundaries

- **B1 — Adopt the following constitutional boundary set. Recommended.**
  - “100 years” means active preservation: live authoritative reads, exports, independent reconstruction, repair, format migration, and cryptographic renewal—not passive storage.
  - “Works on-chain” means complete durable state plus bounded keyed queries on the authority venue; clients compose global/cross-chain views.
  - Lenses are typed, purpose-scoped policies compiled reproducibly into bounded execution policies; the risk bearer chooses the policy.
  - Content is public by default; sensitive or opted-in content is encrypted; EFS promises confidentiality where specified, never anonymity.
  - EFS OS is least-authority: apps have no ambient network, wallet, identity, decryption, filesystem, DOM, or trusted-pixel power.
  - Packages are reproducible hash-addressed closures; activation creates health-gated, rollback-capable generations; updates fail closed under purpose-specific policy.
  - Recoverable and shreddable private data use independent random roots; shared data is not honestly shreddable; encryption roots never come from wallet signatures.
  - Browser-first remains the distribution goal, but confinement claims ship only on measured host lanes. A served-header or native lane is allowed where the static-browser cage is insufficient.
  - Design for a 50-principal normal lens case and a 256-principal portable ceiling, but make the final ceiling conditional on independent compiler and mobile benchmarks.
- **B2 — Amend specific bullets.** Name only the exceptions; the rest can be ratified together.
- **B3 — Do not constitutionalize this cluster yet.** This keeps the joined protocol/OS recut blocked and invites later documents to choose incompatible boundaries.

This cluster corresponds to D-8 through D-16, but deliberately leaves exact algorithms, UI schemas, quotas, and host implementation to evidence and replaceable specifications.

### C — Close the two privacy ceremony forks

- **C1 — Reserve the minimal announced-invite feed with an epoch; do not publish a stealth meta-address by default at onboarding. Recommended.** This keeps canonical stranger-to-stranger private invitations possible without committing EFS to a dedicated stealth record kind or forcing every user to scan by default. This is [[privacy-james-decisions]] JD-8(a), separated from the deferred default-onboarding choice.
- **C2 — Skip the canonical announced-invite feed.** Self-derived pseudonyms and direct sharing still work; stranger invitations use a later, less-canonical convention.

And independently:

- **C3 — Drop the broken subtree-bulk-unlock formula and freeze the honest negative sentence. Recommended.** Private dirnodes and explicit child capabilities remain; a future opt-in tree scheme can be added for new trees. This is JD-36 Option B.
- **C4 — Freeze the repaired bulk-unlock construction now.** This accepts whole-subtree rekeying when a folder is renamed.

### D — Use the playable archive as the anchor pressure application

- **D1 — Yes: make the playable software archive the first joined-system reference application, not the permanent definition of EFS OS. Recommended.** It sequences prototypes and acceptance tests for verified packages, byte retrieval, safe execution, capabilities, saves, curation, publishing, rollback, and provider exit. Only requirements proven irreducible should pressure frozen protocol bytes.
- **D2 — Use it only as one test fixture.** Choose another daily retention application before sequencing EFS OS delivery.
- **D3 — Choose a different anchor now.** Name it; the platform should not proceed anchor-first without one.

## Decide after evidence, not from prose

These are real owner decisions, consolidated here so they are not lost, but answering them now would replace measurement with taste.

| ID | Decision after evidence | Evidence required | Current leaning |
|---|---|---|---|
| **E1** | Name the fixed authority venue/finality profile | Admission/rotation/recovery gas; finality and force-inclusion model; proof size/latency; independent RPC reconstruction | Exactly one measured profile at v2 |
| **E2** | Full author index vs roots-forward plus orphan-tail index | Complete automatic-indexing gas/state snapshot and recovery benchmark | Roots-forward + smallest complete orphan-tail mechanism unless the full index is cheap |
| **E3** | Paginated definition/schema enumeration | Same gas snapshot plus two real contract consumers | Include if genuinely cheap; mandatory definition-keyed item enumeration is already ruled in |
| **E4** | Final 50/100/256 lens limits | Two compilers; mobile cold/warm benchmarks; adversarial policy fixtures | 50 normal, 256 portable ceiling |
| **E5** | Static-only, served-header, or native confinement support matrix | Chrome/Firefox/Safari/iOS cage matrix, including Kernel egress and Permissions Policy | Browser-first; publish per-lane claims, not one universal claim |
| **E6** | Surface-mode render vocabulary | A real Files/archive app over the Worker boundary; accessibility and frame-budget results | Small declarative vocabulary owned by System Chrome |
| **E7** | Merge-rule declaration location | Collaborative-container replay prototype and canonical encoding comparison | Keep protocol surface minimal; freeze only what deterministic replay cannot recover without |

The already adopted on-chain direction does **not** need another vote: mandatory automatic indexing for anything admitted on-chain; predicate-aware backlinks; address targets; reverse membership; REDIRECT cited-by; best-mirror view; revocation-aware live counts; content-hash lookup; full-body spine; and no body elision. The remaining sign-off is the aggregate measured cost and E2/E3.

## Decide later as launch or resourcing choices

These belong here for completeness but should not block the constitution or coordinated recut.

| ID | Later owner choice | Recommended trigger |
|---|---|---|
| **L1** | Default update curators and k-of-n quorum | Before third-party auto-update ships |
| **L2** | Default RPC/storage/relay endpoint set | Before public onboarding; publish the control and logging graph |
| **L3** | Whether a withdrawn/denied package remains manually bootable behind System Chrome warning | Before package beta; test rescue/forensics and ordinary-user harm |
| **L4** | Fund and staff a channel/transparency observatory | Before claiming monitored update or split-view protection |
| **L5** | Name the `web3://`/browser-standards liaison | Before EFSBytes/web serving is positioned as mainstream browser access |
| **L6** | Operate gateways/relays or remain code-only | Only after legal, logging, abuse-response, and succession operations are funded |
| **L7** | Product name | Launch, not design freeze |
| **L8** | Public preservation vocabulary | Before launch copy: recommend “preserved/reconstructable with current evidence”; treat “permanent” as mission/aspiration, not an unconditional object guarantee |
| **L9** | Preservation classes, horizons, and minimum independent fault domains | After the preservation-controller prototype prices critical roots, public packages, private data, caches, and ordinary user content separately |
| **L10** | Repair and renewal after EFS disappears | Before any long-horizon claim: choose an endowed keeper/bounty, institutional consortium, permissionless renewer, or explicit hybrid |
| **L11** | Publication-complete rule and poisoned-replica repair policy | Before storage UX ships: recommend no “preserved” status until independent full retrieval; conservative/quorum repair when corruption or malice is plausible |
| **L12** | Steward-exit/succession package | Before mainnet: publish graph+blob exports, Ethereum reconstruction material, formats/vectors, buildable clients, provider/renewal state, release/control succession, and independently hosted copies |

## Already settled — do not ask again

- Chains are assumed to persist and remain queryable; retain pruning/state-retrieval defenses, not chain-death machinery.
- KEL is required; a bare EOA remains the zero-state identity.
- Passkey sync plus an independent cold factor is the mainstream recovery default; guardians can follow.
- Durable unlinkable personas are separate KELs grouped locally by the OS. They do not share a public recovery root. Disposable stealth addresses remain one-shot privacy tools.
- Public by default plus a client sensitivity-policy layer.
- Storage direction is on-chain plus Arweave now, with optional replaceable mirrors; future cheap chain storage is upside, not a dependency.
- Graph labels such as `act` are provenance/UI claims, never authorization; KEL grants and admission control authority.
- Contracts operate on public data. Private content is decrypted on user devices, not inside public contracts.
- Ranked search, full text, unbounded set operations, and global aggregates remain off-chain. Bounded keyed queries required by core behavior stay on-chain.
- On-chain contracts do not receive a collision bit for universal equivocation detection; safety-critical untrusted-author use requires a challenge-window or tighter policy.
- Wallet-signature-derived archive encryption is forbidden.
- Private file metadata must not leak plaintext names, sizes, or content types through supposedly private records.
- No on-chain read receipts or seen markers.
- The old shared-root derived-persona hypothesis is superseded by the later KEL reconciliation noted above.

## Bulk ratifications that should ride B1 unless amended

The privacy pass contains many individually numbered recommendations. They should not become dozens of phone decisions. B1 is intended to ratify their shared product boundary. During the coordinated recut, the reviewed technical batch can be adopted together unless an implementation review finds a concrete defect: committing AEAD; PQ-hybrid wrapping profile subject to exact review/vectors; random archive roots; encrypted dirnodes at launch; explicit recovery artifacts; no recipient graph on-chain; eager/lazy member-removal honesty; client-side viewing keys; walk-away tests; and gates before shreddable/team/live-session claims.

Exact algorithms and vectors still require independent cryptographic review. Bulk ratification is not permission to freeze unreviewed bytes.

## Recording rule

When James answers:

1. append the answer, date, and any caveat to [[owner-rulings]];
2. mark the corresponding item here `ADOPTED`, `REJECTED`, or `DEFERRED`; and
3. update source decision sheets by linking here rather than copying a second live answer.

`owner-rulings.md` remains the authoritative history. This inbox remains the authoritative list of what still needs an owner answer.
