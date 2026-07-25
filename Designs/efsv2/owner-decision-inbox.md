# EFS v2 + OS — owner decision inbox

**Status:** revalidated decision packet (2026-07-25 joined pass) + held remainder; no choice is adopted until James answers and it is copied into [[owner-rulings]]
**Audience:** James first; designers second
**Last reconciled:** 2026-07-25
**Inputs:** [[joined-pass-synthesis]] + [critic.md](../../Reviews/2026-07-25-joined-fs-pass-corpus/critic.md) (the packet's reason trail), [[owner-rulings]], [[assumptions-and-requirements]], [[multichain-dependency-map]], [[mountable-filesystem-semantics]], [[privacy-james-decisions]], [[solana]], [[ethereum-first-efs-and-os]]

#status/draft #kind/decision #repo/planning #topic/efsv2 #topic/clientv2 #blocked-on/human-decision

> **This is the sole live owner queue for EFS v2 and cross-cutting OS architecture.** Detailed documents remain the reason trail. Future agents must not revive a source checkbox classified here as settled, evidence-gated, delegated, or superseded.
>
> **Sequencing-hold status (2026-07-25):** the 2026-07-23 hold demanded a joined KEL/authority + lens/resolver revalidation before any packet. That pass ran ([2026-07-25-joined-fs-pass](../../Reviews/2026-07-25-joined-fs-pass.md)). Per its critic, **the hold is LIFTABLE for the authority/identity surface — Tiers 1–2 below (P-1…P-10)** — every item is answerable alone, none re-asks a settled item, and adopting one adopts nothing else. Tiers 3–6 are equally revalidated product/projection calls. **Lens-coupled items stay held** pending the dedicated lens pass (gap G-A in [[joined-pass-synthesis]]): the [[assumptions-and-requirements]] D-13 typed-lens scope and seams 7/8/12/19. Lifting the hold is James's call; he may also answer any single item without lifting anything.

## How to answer

Reply with item codes and arms, e.g. `P-1 yes, P-2a, P-5a + r1: qualified, P-16a`. Every item is independently answerable; exceptions in plain English are fine (`P-6 all except the legacy default`). A **Rec:** label is the pass's recommendation with its confidence — advice, not an adopted answer. One language rule binds this whole page (F-15 in [[joined-pass-synthesis]] §1): a read result is a six-part tuple; "two grades" names the authorization axis only, never a two-label UI.

**Research posture, not another decision code:** [[ethereum-first-efs-and-os]] records James's desire to make EFS deeply useful to Ethereum while exploring a broader cypherpunk OS and avoiding premature universal abstractions. Its Shapes A–E remain hypotheses until evidence changes a choice here and James records a ruling.

## Decide now — Tier 1: the authority spine (P-1 is the root; in dependency order)

### P-1 — Adopt the strong authority grade (two-lane kernel + admission receipts)?

**Example:** Alice's phone key is stolen and revoked Tuesday; Wednesday the thief signs a record claiming it was made Monday. Only a venue that admitted records *in order against KEL state* lets any reader — forever — reject that backdate. Portable signatures alone can never promise it.
**Options:** yes (kernel gains an authority-admission lane + stored receipts) / no (EFS ships evidence-grade only; packages, org records, votes, and safety curation lose their floor).
**Rec: yes, high confidence** — the structural derivation, the account-layer inversion, and the forcing use-case classes all converge; only a product ruling that EFS ships no package/org/gate class could change it. Disclose the new price: **promote promptly** — promotion after a revocation cannot upgrade authorization (D-1); late evidence keeps its *dating* value only.
Trail: [authority-model §1](../../Reviews/2026-07-25-joined-fs-pass-corpus/authority-model.md) · [aa-inversion §3.3](../../Reviews/2026-07-25-joined-fs-pass-corpus/aa-inversion.md) · [critic P-1](../../Reviews/2026-07-25-joined-fs-pass-corpus/critic.md)

### P-2 — Realm-qualified authority + how many realms ship

**Example:** your identity's status reads "CURRENT *on this realm*" — like a passport naming its issuing country. Two realms can never both claim an unqualified global CURRENT for one principal (that incoherence is [[assumptions-and-requirements]] R-K11, now the invariant every arm obeys — disclosed: this **forecloses unqualified global CURRENT** under every option).
**Options (the lane's own arms):** (a) the invariant + ONE measured launch realm, extension-ready seams [A2a] / (b) the invariant + permissionless independent realms from day one — sovereignty first, realm-aware everything [A2b]. The per-principal-home arms (genesis-committed A2c; movable A2d) are topology arms dispositioned under **P-5**, not here.
**Rec: (a).** Rider (RT-2): rollup pairs sharing L1 settlement get a *provable* coarse cross-realm existence floor — adopt the qualified wording, it is stronger than policy-trust.
Trail: [authority-model AX-2](../../Reviews/2026-07-25-joined-fs-pass-corpus/authority-model.md) · [attack-authority F-10/F-11](../../Reviews/2026-07-25-joined-fs-pass-corpus/attack-authority.md)

### P-3 — The cross-realm consumption promise

**Example:** a contract on chain B wants to act on an authority fact from chain A. Zero current use cases force more than: *clients verify anywhere; foreign contracts need an explicit adapter or a disclosed pinned commitment.*
**Options:** (a) exactly that promise / (b) promise more (bridges/light-clients — rejected by every lane; no consumer exists).
**Rec: (a).** Trail: [authority-model AX-3](../../Reviews/2026-07-25-joined-fs-pass-corpus/authority-model.md) · [[multichain-dependency-map]] §2

### P-4 — Co-residency rule for filesystem vs OS/social venues

**Example:** your files could live on a cheap L3 while the social layer anchors on Base — fine, until a contract on one needs the other's authority facts in bounded gas; then they must co-reside (or accept adapter-grade).
**Options:** (a) adopt the co-residency rule (venues may differ; in-contract coupling requires co-residence or explicit adapters) / (b) require one shared venue for both.
**Rec: (a)** — a mechanical consequence of the co-location analysis; the shared-settlement floor (P-2 rider) softens the split for rollup families. This dissolves most of the 2026-07-23 "different authority models?" hypothesis; the residual is product acceptance.
Trail: [authority-model AX-4](../../Reviews/2026-07-25-joined-fs-pass-corpus/authority-model.md) · [[owner-rulings#2026-07-23]]

### P-5 — The re-home promise and the L1 pointer's disposition

**Example:** you anchored your identity to an L2 that later turns hostile or expensive. Can you move home without becoming a new identity? The pass designed the minimal L1 pointer and proved two things about it: a pointer adds **discovery, never authority security** (pointer-theft reduces to the same recovery machinery), and it **cannot deliver censorship escape** — leaving a home starts with an admission *at that home* (D-4).
**Options:** (a) **no re-home promise in v2** — genesis-committed home; discovery = digest-checkable hint convention; the pointer stays a designed shelf candidate; a censoring home is answered by evidence-lane-elsewhere + a successor identity / (b) voluntary re-home only (build the pointer, honestly labeled — it never escapes a censoring home) / (c) the full censorship-escape promise (adds an unsolved L1 departure-verifier, a new thief target, and a partial breach of "the registry is never an authority root").
**Rec: (a).** Compatible with every P-2 arm; (b)/(c) are re-openable later — the pointer design is on the shelf, not lost.
Trail: [authority-model §2](../../Reviews/2026-07-25-joined-fs-pass-corpus/authority-model.md) · [attack-authority F-6/F-7/RT-1](../../Reviews/2026-07-25-joined-fs-pass-corpus/attack-authority.md) · [[multichain-dependency-map]] §1

- **P-5r1 (answer separately):** does the adopted chains-don't-die assumption qualify *authority homes* by venue class — the class itself is part of the question — or is any venue an acceptable anchor with E1 measuring candidates? (T1's residue — data/read persistence is settled everywhere; this is only about where authority may anchor.)
- **P-5r2 (answer separately):** ratify **revocation force-inclusion latency as a security parameter of an acceptable authority home** — it bounds the stolen-key theft window under adversarial ordering (D-2); grant expiries are the backstop.

### P-6 — The four riders formerly bundled inside N1A (each its own code)

**a — Legacy-EOA upgrade commitment:** default-on at first use, explicit degraded opt-out. *(Your old wallet's records get a KEL upgrade path unless you decline.)*
**b — Smart-account inception:** one direct inception call for smart-account-only users; ERC-1271/6492 stay banned from canonical record authority. *(A Safe can create an identity; it never IS the ongoing record-signing authority.)*
**c — Personal principals non-transferable; organizations use control succession.** *(You can hand over a company, not a person.)*
**d — Signature-suite succession:** a frozen same-domain successor slot, no mutable verifier admin. *(Post-quantum arrives by successor suite, not by an admin key.)*
**Rec: all four.** Trail: [authority-model §4](../../Reviews/2026-07-25-joined-fs-pass-corpus/authority-model.md) · [[kel#23. Decisions for James]] items 3–5

## Decide now — Tier 2: the identity boundary

### P-7 — Ratify the consume-vs-build residual boundary

**Example:** EFS does not build session UX, threshold ceremonies, or recovery flows — the account layer (4337/7702/passkeys) does that in production today. EFS builds only what no account can: durable, portable, historically-verifiable *authorization evidence* — R1–R6, with R1's home-binding field held **parametric** until P-5 answers (D-6; freezing it now would pre-answer the topology).
**Rec: ratify.** Trail: [aa-inversion §3.6/§4](../../Reviews/2026-07-25-joined-fs-pass-corpus/aa-inversion.md)

### P-8 — Recovery machinery locus

**Options:** (a) minimal EFS-native policy machine (pending-freeze + `DISPUTED-INTERVAL` grading — survives under any arm) / (b) fully consume account-layer recovery / (c) the full [[kel#10. Recovery]] engine.
**Rec: (a).** The authority lane's sharpest line stands: *recovery composition is the real security budget.* Passkey-sync + independent cold factor stays the adopted baseline either way.
Trail: [aa-inversion J-2](../../Reviews/2026-07-25-joined-fs-pass-corpus/aa-inversion.md) · [authority-model §2.5](../../Reviews/2026-07-25-joined-fs-pass-corpus/authority-model.md)

### P-9 — May a smart account BE ongoing control authority?

**Rec: no** — accounts bootstrap, bind, and coordinate; KEL key material controls. (Chain-bound mutable state cannot be portable historical evidence.)
Trail: [aa-inversion J-3](../../Reviews/2026-07-25-joined-fs-pass-corpus/aa-inversion.md)

### P-10 — Does bare-EOA identity survive KEL inception?

**Example:** you used a plain wallet for a year, then upgrade to a full identity. Do your old files stay yours under the same name? **Yes — via the already-designed in-place upgrade ([[kel#4.3 In-place EOA upgrade]] preserves the identity word).** A deliberately *fresh* unlinkable principal is a new namespace + a signed redirect — said loudly, never implied to be free.
**Rec: confirm in-place as the promote-path default.** Trail: [attack-fs AF-5/JF-B](../../Reviews/2026-07-25-joined-fs-pass-corpus/attack-fs.md) · [critic D-11](../../Reviews/2026-07-25-joined-fs-pass-corpus/critic.md)

## Decide now — Tier 3: mode & product law

### P-11 — Chain-free mode: shipped, labeled product mode?

**Example:** EFS works on your laptop with no chain: same records, same IDs, honest labels. The ten structural losses (freshness, provable absence, canonical order, backdating rejection, contract composability, …) are the disclosure, each with its cheapest upgrade rung.
**Options:** (a) shipped labeled mode (the local→chain ladder) / (b) internal seam only / (c) defer to the OS pass.
**Rec: (a).** Trail: [local-mode](../../Reviews/2026-07-25-joined-fs-pass-corpus/local-mode.md) · [[multichain-dependency-map]] §3

### P-12 — Rung-label honesty as binding product law

Every surface names its rung (local-sovereign / network-replicated / provider-attested / witnessed / chain-authoritative); no UI may present a lower rung as a higher one. **Rec: adopt.** Trail: [local-mode §9.4](../../Reviews/2026-07-25-joined-fs-pass-corpus/local-mode.md)

### P-13 — Provider-attested freshness as an allowed labeled rung

A sync provider may countersign "newest head I've seen" — useful, honest, and clearly weaker than witnessing. Requires the durable-counter discipline (critic disposition D-13) so honest crashes are not framed as equivocation. **Rec: allow.** Trail: [local-mode §5](../../Reviews/2026-07-25-joined-fs-pass-corpus/local-mode.md)

### P-14 — Default head-anchoring posture

**Rec: opt-in witnessed mode; head *hint* default-on.** Trail: [local-mode JL-3](../../Reviews/2026-07-25-joined-fs-pass-corpus/local-mode.md)

### P-15 — Local-mode launch scope: single-principal realms

Teams stay unforeclosed via `memberSet`; multi-principal local realms come later. **Rec: yes.** Trail: [local-mode JL-4](../../Reviews/2026-07-25-joined-fs-pass-corpus/local-mode.md)

## Decide now — Tier 4: mount & filesystem projection

### P-16 — The ordinary-app mount profile (consolidates three prior items)

**Example:** `test -e missing-file` on a live mount over someone else's RPC *cannot honestly say "not found"* — no hosted RPC can prove absence; and `ls -l` can see ghost entries between its directory walk and its per-file stats (D-7/D-8).
**Options:** (a) **snapshot/bundle-with-closure-manifest is the required ordinary-app profile** (honest `ENOENT` via a signed closure manifest; no ghosts; self-contained bundles work offline); live mounts opt-in — own-node first-class, hosted-RPC live as a diagnostic surface; the graded/permissive mount stays research-only. Sub-choices inside: refresh is explicit; two shipped profiles / (b) keep the live hosted-RPC mount as the ordinary surface and accept degraded absence semantics.
**Rec: (a).** Trail: [attack-fs AF-1/AF-2/AF-10](../../Reviews/2026-07-25-joined-fs-pass-corpus/attack-fs.md) · [filesystem-core §6](../../Reviews/2026-07-25-joined-fs-pass-corpus/filesystem-core.md)

### P-17 — Subscribed-curator whiteout projection

**Example:** a curator you subscribe to masks a file. Silent disappearance (`ENOENT`) hides moderation from you; a visible inert tombstone (`user.efs.grade = WHITEOUT by <principal>`) shows it.
**Options:** (a) visible inert tombstone / (b) silent removal.
**Rec: (a).** Trail: [attack-fs AF-3](../../Reviews/2026-07-25-joined-fs-pass-corpus/attack-fs.md)

### P-18 — Authority vs kind for the plain name (cheap confirm)

A cross-author squatter must not evict a higher-authority file from its plain name: across principals, higher lens tier wins; kind priority only breaks same-author ties. Already adopted as design center — this confirm exists because it changes whose file owns a name.
**Rec: confirm.** Trail: [attack-fs AF-4](../../Reviews/2026-07-25-joined-fs-pass-corpus/attack-fs.md) · [critic D-10](../../Reviews/2026-07-25-joined-fs-pass-corpus/critic.md)

## Decide now — Tier 5: bytes & wording

### P-19 — DA-tier bytes: internal rail or user-facing tier?

**Rec: internal rail** (a delivery mechanism inside publishing flows, never a named storage product users pick). Trail: [large-files LF-J2](../../Reviews/2026-07-25-joined-fs-pass-corpus/large-files.md)

### P-20 — Ratify the tier-vocabulary honesty rule

Nothing may call DA-tier or mirror bytes "on-chain"; state-tier EFSBytes is the only tier passing the adopted bounded-gas test. This is the enforcement half of the T3 reconciliation.
**Rec: ratify.** Trail: [large-files §2.5](../../Reviews/2026-07-25-joined-fs-pass-corpus/large-files.md)

## Decide now — Tier 6: scope & messaging

### P-21 — Cardinality scope: high-frequency telemetry out of v2's on-chain admission scope

**Example:** a sensor writing 10^8 records/day is not an on-chain admission workload; the aggregate/checkpoint pattern is. **Rec: out of scope, aggregates in.** Trail: [use-cases J1](../../Reviews/2026-07-25-joined-fs-pass-corpus/use-cases.md)

### P-22 — "Contract-readable" wording

**Rec: same-venue program-readable under a named profile, with Ethereum/EVM as the required first/richest profile** (costs nothing today; all current consumers are EVM). Trail: [use-cases J2](../../Reviews/2026-07-25-joined-fs-pass-corpus/use-cases.md) · [[solana]]

### P-23 — Permanence-hazard intake guardrails now

PII/consent warnings, tooling refusal for obvious hazard classes, encrypted-commitment-only guidance — zero protocol surface, folds into L14. **Rec: adopt now.** Trail: [use-cases J5](../../Reviews/2026-07-25-joined-fs-pass-corpus/use-cases.md)

## Held from earlier passes — revalidate before asking (unchanged by the joined pass)

### N2 — Constitutional system boundaries

 Still held as one bundle with named-exception answering (`N2A` adopt all / `N2B` + bullet codes to change / `N2C` defer). The codes: **N2a** "100 years" = active preservation · **N2b** "works on-chain" = complete durable state + bounded keyed queries · **N2c** lenses are typed, purpose-scoped compiled policies · **N2d** public by default; never anonymity · **N2e** least-authority OS · **N2f** reproducible hash-addressed package closures · **N2g** recoverable/shreddable independent random roots · **N2h** browser-first with per-measured-host-lane confinement claims · **N2i** 50 principals normal / provisional 256 portable ceiling. The joined pass *consumed* several boundaries as invariants (N2b via P-22; N2d; N2g) but did not revalidate the bundle's wording. Details: [[assumptions-and-requirements#11. Human decisions requiring eventual disposition]] D-8–D-16, [[ops-doctrine]], [[web-os-thesis]].
### N3 — Canonical private invitation discovery

 `N3A` reserve a minimal announced-invite feed with an epoch (**rec**) / `N3B` don't (stranger invitations become a later convention). Not the L13 onboarding default. Details: [[privacy-james-decisions]] JD-8.
### N4 — Honest private-subtree behavior

 `N4A` drop the broken bulk-unlock formula, keep private dirnodes + explicit child capabilities (**rec**) / `N4B` freeze the repaired construction and accept rename-rekeys-the-subtree. Details: [[privacy-james-decisions]] JD-36.
### N5 — Joined-system anchor application (UNDECIDED)

 `N5A` playable software archive as the first joined-system reference app (**rec**) / `N5B` one test fixture only, pick another daily-retention anchor / `N5C` name a different anchor. The joined pass treated it as one fixture of twelve classes — compatible with any arm. Details: [[playable-archive-requirements]], [[apps-cookbook]].
### N6 — Ratify the reviewed privacy policy batch

 `N6A` ratify subject to technical gates (**rec**) / `N6B` ratify with named JD exceptions / `N6C` keep advisory. Details: [[privacy-pass-synthesis]], [[privacy-james-decisions]], [[privacy-freeze-reservations]].
### Q1 — `seq` to `order` rename

 `Q1A` rename (**rec**; regenerate type hash + vectors at the recut) / `Q1B` keep the misleading name forever. Details: [[fs-pass-james-decisions#3. `seq` → `order` rename (freeze-gates A.8a)]].
### Q2 — Always-present `claimedAt`

 `Q2A` include, `0` = absent, testimony only (**rec**) / `Q2B` omit forever. Details: [[fs-pass-james-decisions#2. `claimedAt` row (freeze-gates A.8b)]].
### Q3 / Q4 / Q5 / D-9 — still held, evidence added

**Q3** (public collab = revision DAGs + curation, `Q3A` rec) / **Q4** (checkpoints stay ordinary claims, `Q4A` rec) / **Q5** (SDK fail-closed default, `Q5A` rec) + **D-9** (on-chain lens promise): the joined pass's FS profile and local mode were written against the A-arms and disclose the coupling ([critic §8.3](../../Reviews/2026-07-25-joined-fs-pass-corpus/critic.md)); answering differently reworks [filesystem-core §1.3](../../Reviews/2026-07-25-joined-fs-pass-corpus/filesystem-core.md) and [local-mode §2](../../Reviews/2026-07-25-joined-fs-pass-corpus/local-mode.md). Details: [[fs-pass-james-decisions]], [[read-lens-spec#Open questions]].

## Decide after evidence — do not answer yet

These are real owner acceptance gates. Engineers choose exact mechanisms; James chooses whether measured cost, usability, or product degradation is acceptable.

| ID | Choice | Evidence required (incl. new this pass) | Recommendation after evidence | Details |
|---|---|---|---|---|
| **E1 Authority venue** | Base/L2, Solana, L3, or another fixed profile | admission/rotation/recovery cost; finality/force inclusion; proof latency; independent RPC/state reconstruction; mandatory bounded queries; **+3 riders: venue-class (P-5r1), revocation force-inclusion latency (P-5r2), shared-settlement embedding granularity** | exactly one measured v2 profile | [[assumptions-and-requirements#17. Current first-prototype hypothesis]], [[solana]] |
| **E2 Aggregate kernel cost** | accept full promise, trim optional surfaces, or reject | one combined gas/state snapshot including every mandatory direction; **+4 inputs: mount-budget ⇄ current-live index coupling; `SAME_SLOT_COLLISION` surface; dual-digest leaf pricing; generation-churn fixture** | accept only against the complete bill, not isolated cheap calls | [[onchain-completeness]], [[freeze-gates]] |
| **E3 `admittedAt`** | store + batch-read, or explicitly degrade trustless time | measured incremental cost + two consumers — **now priceable: both consumers exist** (legal chain-of-custody; poll close rule) | store if the complete snapshot is tolerable | [[fs-pass-james-decisions#1. The `admittedAt` + index bundle (P1) — the pass's biggest lever]], [use-cases](../../Reviews/2026-07-25-joined-fs-pass-corpus/use-cases.md) |
| **E4 Author enumeration** | full author index or roots-forward + orphan-tail | gas/state + recovery benchmark; restated with the admission-time root-reachability constraint | smallest mechanism that still guarantees complete discovery | [[onchain-completeness]], [filesystem-core §4.2](../../Reviews/2026-07-25-joined-fs-pass-corpus/filesystem-core.md) |
| **E5 Definition enumeration** | paginated schema/definition index or omit | same snapshot + two real contract consumers (released from FS pressure) | include only if genuinely cheap | [[onchain-completeness]] |
| **E6 Lens ceiling** | 50, 100, or 256 portable principals | two compilers; cold/warm mobile benchmarks; adversarial fixtures; + month-scale local merge/conflict benchmarks | 50 normal, 256 portable if measured | [[read-lens-spec]] |
| **E7 Host lanes** | static-only, served-header, and/or native support claims | Chrome/Firefox/Safari/iOS cage matrix | browser-first with honest per-lane claims | [[client-os-pressure-report]], [Client evidence queue](../clientv2/owner-decision-inbox.md#decide-after-evidence--do-not-answer-yet) |
| **E8 Render vocabulary** | small declarative schema, constrained HTML, or another IDL | a real Files/archive app; accessibility and frame budget | smallest System-Chrome-owned vocabulary that passes | [[kernel-capability-model]] |
| **E9 Merge-rule location** | protocol word, typed payload, or package convention | collaborative replay prototype + canonical encoding comparison | freeze only irreducible replay semantics | [[fs-pass-james-decisions]], [[apps-cookbook]] |
| **E10 Recovery acceptance** | ship mainstream flow, restrict it, or redesign | formal model plus nontechnical recovery trials | no mainstream claim until ordinary people recover safely | [[kel]], [[privacy-james-decisions]] |
| **E11 Public metadata budget** | accept, coarsen, or redesign KEL/receipt/index/funding metadata | minimization review and adversarial correlation analysis | publish the measured leakage plainly before acceptance | [[privacy-james-decisions]], [[kel]] |
| **LF-J1 Default publish ceremony** (new) | where bytes go by default | the E2 snapshot + de-risking slice | working default: commitment on-chain, bytes to Arweave | [large-files](../../Reviews/2026-07-25-joined-fs-pass-corpus/large-files.md) |
| **JF-E Mirror-tier authenticated seeking** (conditional) | only if the recut rejects offset-committing leaves (D-14) | recut outcome | adopt the leaves; else the honest no-random-access statement goes to James | [critic D-14](../../Reviews/2026-07-25-joined-fs-pass-corpus/critic.md) |
| **G-4 Mount budgets** (new) | daemon resource ceilings | adversarial fixtures | bound before any live-mount default | [filesystem-core](../../Reviews/2026-07-25-joined-fs-pass-corpus/filesystem-core.md) |

## Decide at launch or when resourcing exists

| ID | Choice with a simple example | Options | Recommendation / trigger | Details |
|---|---|---|---|---|
| **L1 Curators** | who may auto-update the default OS channel? | named first parties; independent set; user-only/manual | independent k-of-n before auto-update | [[packages-and-updates]] |
| **L2 Endpoints + RPC privacy** | first run needs RPC/storage without silently selecting an observer | first-party; community set; user-required; fund OHTTP relay | publish operators/logging/control graph; no silent RPC | [Client network privacy](../clientv2/network-privacy.md), [[privacy-james-decisions]] JD-13 |
| **L3 Denied package boot** | an investigator needs an old revoked game | forbid; manual behind warning; unrestricted | manual only behind System Chrome warning, after harm testing | [[boot-and-profiles]] |
| **L4 Observatory** | detect channel split views and compromised curators | fund/staff; community-only; make no monitored claim | fund before claiming monitoring | [[packages-and-updates]] |
| **L5 Browser liaison** | standards work affects `web3://` and EFSBytes access | name owner; consortium; defer mainstream claim | name before browser-mainstream positioning | [[ops-doctrine]] |
| **L6 Operate infrastructure** | EFS project runs gateways/relays that see abuse and metadata | operate; partner; code-only | only with legal/logging/abuse/succession capacity | [[ops-doctrine]] |
| **L7 Product name** | EFS OS vs Cyphos/Cypher OS | adopt; test shortlist; keep EFS OS | user test and trademark/domain review near launch | [[web-os-thesis#Naming — open]] |
| **L8 Preservation words** | may UI say "permanent"? | permanent; preserved; reconstructable-with-evidence | use "preserved/reconstructable with current evidence" | [[ops-doctrine]] |
| **L9 Preservation classes** | critical roots need more fault domains than cache data | one class; tiered horizons; user-configured | price separate classes after controller prototype | [[ops-doctrine]] |
| **L10 Renewal after EFS** | signatures/formats age after the project disappears | endowed keeper; consortium; permissionless bounty; hybrid | explicit funded hybrid before long-horizon claims | [[ops-doctrine]] |
| **L11 Publication complete + repair** | one replica says upload succeeded; another is corrupt | first copy; independent full retrieval; quorum | no "preserved" until independent full retrieval; conservative repair | [[ops-doctrine]] |
| **L12 Steward exit** | maintainers vanish | informal fork; signed succession; complete exit package | ship graph/blob exports, vectors, builds, provider state, and succession plan before mainnet | [[ops-doctrine]] |
| **L13 Stealth onboarding** | publish a meta-address for every new user? | default-on; explicit opt-in; omit | explicit opt-in after scanning/privacy costs are known | [[privacy-james-decisions]] JD-9 |
| **L14 Public disclosures** | users may confuse confidentiality with anonymity or quantum safety | concise labels; full ceremony; defer feature | exact privacy/quantum/GDPR/hardware-wallet disclosures before feature claims; **P-23 folds in here when adopted** | [[privacy-james-decisions]] |
| **L15 Timestamp privacy** | fine-grained times correlate a private user's activity | exact; coarsened private tier; user choice | coarsen privacy-tier defaults if it preserves needed semantics | [[privacy-james-decisions]] JD-22 |
| **L16 P-256/WebAuthn** | passkey can sign directly once the profile is safe | activate; keep wrapped software keys; staged opt-in | assign owner/date only after vectors, review, and transition staffing; **premise updated: EIP-7951 live on mainnet since Fusaka 2025-12-03** | [[kel]], [[client-os-pressure-report]] |
| **L17 Guardians** | social recovery can help or enable collusion | launch; later opt-in; do not support | mainstream base stays passkey sync + independent cold factor; guardians later | [[kel]] |

## Already settled — do not ask again

Unchanged from 2026-07-23, plus this pass's confirmations: native envelope kernel + five-kind tag-core · durable archive, no free ephemeral tier; writes paid on-chain with optional community relayers · chains persist and stay queryable (scope-sharpened: data/read persistence everywhere; authority-home venue-class is P-5r1) · KEL required, bare-EOA zero state, passkey-sync + cold factor baseline · durable unlinkable personas = separate KELs grouped locally; disposable stealth addresses one-shot · public-by-default + sensitivity layer; contracts consume public data only · read-only mount on three OSes, Linux FUSE alone not completion (now discharged into a conformance table) · on-chain + Arweave with replaceable optional mirrors · mandatory automatic indexing incl. required backlinks, address/list/redirect directions, best-mirror + content-hash lookup, full-body spine, revocation-aware live counts (boundary clarified: admission-coupled, never local) · no universal collision bit — untrusted safety-critical authors use closed sets + challenge windows (re-checked, untouched) · `act` provenance-only; KEL grants authorize · no wallet-signature-derived roots, no on-chain read receipts, no plaintext private metadata · `contractReadable` floor; EFSBytes immutable at freeze; bytes L2/L3-first; blob use reserved · ranked/full-text/global/unbounded analytics off-chain.

## Delegated technical gates — not owner votes

Protocol and security owners must resolve exact index layouts, live-count mechanism, receipt bytes, crypto suite/vectors, WebAuthn/PQ vectors, control maxima, event shapes, EIP-170 splitting, and the cross-platform mount adapters/name/error/metadata profile through prototypes, independent review, and conformance tests. **Escalate only if the result changes a boundary, safety promise, product degradation, or irreversible wire choice listed above.**

This pass's batch (highlights — full list + owners in [critic §4 DELEGATED](../../Reviews/2026-07-25-joined-fs-pass-corpus/critic.md)): the D-1 promotion-rule text + seam-3/4 recut · seam-4/5 binding vectors · the parametric `homeBindingMode` carve-out · FSP-HYBRID vectors · closure-proof wire shape · the fourth-absence-source shared sentence · handle-scoped `getattr` adapter obligation · durable-counter MUST · offset/length-committing leaves · geometry-bound stores + griefing fixture · `FileGenerationV1` recut + dual-digest vectors · the `.efs-bundle` normative spec (elevated: walk-away vehicle + snapshot-mount substrate) · the hint/preimage-replication discovery convention · kel.md §12 table updates.

Vault routing mechanics—the inbox hierarchy, generated roll-ups, and historical indexes—are delegated documentation process. They are not EFS architecture rulings and may be improved during consolidation.

## Superseded questions — never revive silently

- Per-principal L1 homes and migration text in [[kel]] is superseded by its correction banner and the P-5 disposition (pointer = designed shelf candidate); [[kel]] §23 items 1–2 as worded + §4.5 HomeRegistry/migration + §18 fork 8 → superseded.
- Reserve-KEL-until-2030 and smart-wallet exclusion text in [identity](./identity.md) is superseded by the KEL pass.
- Pre-KEL actor alternatives in [[client-os-pressure-report]] are historical.
- The proposed exact-slot collision summary conflicts with the adopted no-collision-bit ruling.
- Full-body/no-elision and mandatory indexing are adopted; old "pending ratification" labels are stale.
- The dual "public archive/private-by-default OS" posture is superseded by public-by-default plus sensitivity policy.
- EAS substrate and chain-death questions are historical inputs, not live v2 forks.
- **Held N1 as one bundled code** → superseded by the P-1…P-6 decomposition (independence-audited).
- [[read-lens-spec]] checkpoint-grounded absence, global same-order equivocation, MUST-pull-home → superseded by the FS profile.
- `preferredTier` manifest field → dropped. "Two grades as two labels" → banned phrasing (F-15).

## Recording rule

When James answers:

1. append the dated answer and caveat to [[owner-rulings]];
2. mark the item here `ADOPTED`, `REJECTED`, or `DEFERRED`;
3. replace conflicting source checkboxes with a link here instead of copying a second live answer;
4. add a [[Retirements]] row naming the phrasing the ruling kills, then run `./scripts/needs-integration.sh`.

`owner-rulings.md` is the authoritative history. This inbox is the authoritative list of what still needs an owner answer.
