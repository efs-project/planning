# EFS v2 + OS — owner decision inbox

**Status:** revalidated decision packet (2026-07-25 joined pass + 2026-07-28 lens pass) + held remainder; no choice is adopted until James answers and it is copied into [[owner-rulings]]
**Audience:** James first; designers second
**Last reconciled:** 2026-07-28
**Inputs:** [[joined-pass-synthesis]] + [joined critic](../../Reviews/2026-07-25-joined-fs-pass-corpus/critic.md), [[lens-pass-synthesis]] + [lens critic](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) (the packets' reason trails), [[owner-rulings]], [[assumptions-and-requirements]], [[multichain-dependency-map]], [[mountable-filesystem-semantics]], [[privacy-james-decisions]], [[solana]], [[ethereum-first-efs-and-os]]

#status/draft #kind/decision #repo/planning #topic/efsv2 #topic/clientv2 #blocked-on/human-decision

> **This is the sole live owner queue for EFS v2 and cross-cutting OS architecture.** Detailed documents remain the reason trail. Future agents must not revive a source checkbox classified here as settled, evidence-gated, delegated, or superseded.
>
> **Sequencing-hold status (2026-07-28):** the 2026-07-23 hold demanded a joined KEL/authority + lens/resolver revalidation before any packet. **Both passes have now run** ([2026-07-25-joined-fs-pass](../../Reviews/2026-07-25-joined-fs-pass.md); [2026-07-25-lens-pass](../../Reviews/2026-07-25-lens-pass.md)). Per their critics, **the hold is LIFTABLE across its full surface**: Tiers 1–2 (P-1…P-10, the authority/identity spine), Tiers 3–6 (revalidated product/projection calls), and **Tier 7 (LP-1…LP-10, the lens family — new this pass)**. Every item is answerable alone, none re-asks a settled item, and adopting one adopts nothing else. The lens pass also dispositioned the previously lens-held items: **N2c, D-9, and Q5 are folded into LP-1, LP-2, and LP-6's rider; E6's structure is LP-4** (its numbers stay evidence-gated); **Q3 and Q4 stay held** (no new evidence). Lifting the hold is James's call; he may also answer any single item without lifting anything.

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

## Decide now — Tier 7: the lens family (2026-07-28 lens pass; LP-1 is the root)

Full example/arm text for every item: [lens critic §4](../../Reviews/2026-07-25-lens-pass-corpus/critic.md). Independence-checked: answering one adopts nothing else.

### LP-1 — Ratify the typed-lens constitution (held D-13/N2c, revalidated)

**Example:** "lens" currently means your file view, your friend list, a labeler set, and the rule that gates an OS update. Ratifying says a lens is a **typed, purpose-scoped, compiled policy over evidence** — following a friend can never let them publish an OS update.
**Options:** (a) adopt the typed compiled-policy model ("lens" stays the human word; the flat ordered list survives as an editor projection and one execution slice) / (b) keep the flat ordered author list as the universal primitive.
**Rec: (a), high confidence** — two passes compiled every real consumer inside the grammar without extending it. Deliberately bundled (same constitutional act): no universal protocol content/advisory tail; personal policy local/encrypted by default; every exclusive **authority** rule declares fallthrough-or-stop, with packages/updates/security-config/gates stopping by default.
Trail: [lens critic LP-1](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) · [[lens-pass-synthesis]] LN-1 · [[assumptions-and-requirements]] D-13

### LP-2 — The on-chain lens promise (held D-9, restated with physics)

**Example:** "who is authoritative for this one name?" works on-chain in bounded gas at every size we care about. "Give me this whole 128-entry folder, sorted" **cannot be served**: the live EIP-7825 transaction cap (16,777,216 gas, Fusaka 2025-12) makes a 128×55 naive page (~29.5M) permanently impossible.
**Options:** (a) bounded candidate pages + exact venue-local point resolution + deterministic fixed-basis client materialization is the core promise; wide sorted directories are a client product, and contract consumers of whole directories use sparse-roster plans, a materialized/proven snapshot, or move to the client tier / (b) declare contract-native sorted pages mandatory and fund a separate ordered-index/proof program.
**Rec: (a), high confidence** — the 2026-07-11 "should not be promised" is now "cannot be delivered."
Trail: [lens critic LP-2](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) · [research §3](../../Reviews/2026-07-25-lens-pass-corpus/research.md) (cap VERIFIED live)

### LP-3 — Naming ratification

**Example:** every corpus accident of the form "contracts walk lenses" came from one word doing two jobs.
**Options:** (a) adopt the family — **Lens** (your read-view) · **View** (saved linkable lens+place+presentation; never contains trust) · **Starter Pack** · **Follow** · **Channel** · **Labeler**+**Action Map** · **Roster** (the trust-list primitive) · **Plan** (the executable contract slice) · **GATE** (install/contract trust) / (b) adopt with named changes / (c) defer to implementation.
**Rec: (a), high confidence** — GATE and the Roster/Plan split matter most (the pass's own lanes used "Roster" for two different objects).
Trail: [lens critic LP-3 + LR-1 §4](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) · [object-taxonomy §1](../../Reviews/2026-07-25-lens-pass-corpus/object-taxonomy.md)

### LP-4 — Lens-scale structure (held E6's structure; numbers stay evidence-gated)

**Example:** your real policy is ~10–50 people + 3–5 system principals — not "50 keys" (devices collapse behind KEL principals). Three numbers were conflated: what a normal policy holds (15–55), what a contract-readable plan may hold (CORE cap, candidate 64), and what the compiler accepts (client ceiling, candidate 256).
**Options:** (a) ratify the structure — two constants doing two jobs; per-read budgets independent of policy size; every limit fails typed, nothing truncates; hundreds-of-curators = a bespoke curation contract, not base-lens growth; web-of-trust stays out / (b) keep one number as "the lens limit" set by measurement (the `MAX_LENSES=20` shape).
**Rec: (a), high confidence.** Rider (yes/no): the client counts and shows **effective authority principals across all saved Views** against the 15–55 center — otherwise one-tap curator Views reach 245 principals while the people list reads 45.
Trail: [lens critic LP-4](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) · [use-pressure §2](../../Reviews/2026-07-25-lens-pass-corpus/use-pressure.md)

### LP-5 — The anonymous/guest viewer's default trust grade

**Example:** someone clicks an EFS link with no account. Their client can always verify who signed what and that bytes match; over a hosted endpoint it can never prove a file *isn't* there.
**Options:** (a) **G1 default** — client-verified authorship/bytes over a hosted endpoint; absence never claimed ("nothing found via this endpoint — unverified"); grades ratchet up as proofs arrive; gateway-rendered G0 pages only as the operator's labelled word / (b) require a proof-capable path for the ordinary guest (more honest, slower, needs infra that doesn't exist) / (c) accept G0 gateway rendering as ordinary.
**Rec: (a), medium-high confidence** — the only arm where the hyperlink product works day one and nothing unverified is claimed. Product copy must say: a guest is never told "that file does not exist."
Trail: [lens critic LP-5](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) · [[Ideas]] guest deep-links · [views-links §3](../../Reviews/2026-07-25-lens-pass-corpus/views-links.md)

### LP-6 — Ratify the GATE profile's hard rules

**Example:** installing an update is not browsing; install/update/security policies are a different kind of object whose rules no link, curator, or preference can relax.
**Options:** (a) ratify all: owner-pinned, never caller-supplied · fail-closed non-configurable · STOP on revocation (a lapsed publisher never hands the name to a squatter) · no discovery influence · closed enumerated authorities · unknown advisory label values map to NONE · freshness floors on evidence **and** on the policy generation itself (`policyMaxAge` — a withheld update channel fails loud, not silently frozen) · advisories over the whole pinned dependency closure · the install ceremony re-derives the candidate list under the GATE's own rules (a hostile browse page cannot steer you onto an old vulnerable release) / (b) ratify minus named items / (c) defer to a package/update pass.
**Rec: (a), high confidence** — three clauses exist because the red team found the corresponding attack alive.
**Rider (held Q5, now askable):** the reference SDK ships **fail-closed** as its single default; `--allow-stale` is an explicit disclosed policy, never a default.
Trail: [lens critic LP-6 + AV-15/16/17/19](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) · [profiles-composition §1.2](../../Reviews/2026-07-25-lens-pass-corpus/profiles-composition.md)

### LP-7 — Personal-policy privacy default

**Example:** your file contents can be public while **who you trust** stays yours — the policy names your friends, communities, moderators, and politics.
**Options:** (a) ratify: personal policy local/encrypted by default; publishing is a deliberate ceremony with a disclosure preview; the routine freshness check runs against **your own node/replica** by default (the remote batched check ships your whole roster to the endpoint on every app focus — a better identifier than a cookie); links never carry principal arrays; trust-adjacent link params ride the fragment / (b) same policy but keep the remote batched check as default / (c) defer to the privacy pass.
**Rec: (a), high confidence** — with the honest limit said in the same breath: a content-addressed public system cannot stop someone who correctly *guesses* your policy from confirming the guess; membership privacy comes from not publishing, not from cryptography.
Trail: [lens critic LP-7 + AV-27/AV-36/AO-14](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) · [[human-overview]] §7.12

### LP-8 — The link-safety floor (the non-suppressible set)

**Example:** a link may rearrange what you see; it must never hide *that* it rearranged it, hide a malware label, hide a look-alike name, hide that you changed chains, or start an identity ceremony.
**Options:** (a) ratify NS-1…NS-11 as **binding client conformance** (grades/basis · staleness · foreign-view banner + one-tap escape · advisory counts · conflict/attribution markers · authorship boundaries · citation-under-foreign-policy label · look-alike warnings carrying their own completeness · guest/write-lock state · degradation notices · policy-suppression disclosure), plus: realm changes are chrome-owned transitions, guest→account promotion never starts from page content, and the grant ceremony renders each scope root's resolved extent under your own plan, the count of positions inside it, and an explicit ancestor warning / (b) ratify a subset / (c) treat as guidance, not conformance.
**Rec: (a), high confidence** — a floor that is not conformance is decoration; three items exist because the red team found the attack.
Trail: [lens critic LP-8](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) · [views-links §4](../../Reviews/2026-07-25-lens-pass-corpus/views-links.md)

### LP-9 — Citation disclosure defaults

**Example:** you cite a file in a paper — should the link also carry *which of your trusted sources* selected it?
**Options:** (a) split the forms: object/claim citations carry **no policy reference by default**; view citations carry the policy and its disclosure preview (a deliberate act) / (b) one form that always carries the policy / (c) one form that never does.
**Rec: (a), high confidence** — the pass had the warning on the rare act (publishing) and off the frequent one (citing), which is backwards.
Trail: [lens critic LP-9 + AV-28/AV-7](../../Reviews/2026-07-25-lens-pass-corpus/critic.md)

### LP-10 — Computed membership: may a machine-derived trust list be followed?

**Example:** your achievement idea — an app publishes "everyone who earned X" as a channel advancing hourly; one subscribe, and an unbounded machine-derived set of strangers refreshes inside a user's compiled policy forever.
**Options:** (a) distinguish curated from computed: published policies declare `derivationKind: CURATED | COMPUTED(algorithmRef)`; computed sets are **pin-only** (never channel-followed), need a per-adoption ceremony for authority tiers, and count at full cardinality against the effective-principal budget / (b) allow computed sets to be followed with disclosure / (c) no distinction.
**Rec: (a), medium-high confidence** — Nostr's web-of-trust experiment is field evidence (no reproducible score, unsolved Sybil, centralization into scoring services); and this is the guardrail your own Ideas entry asks for ("without turning any of them into a generic green trust badge").
Trail: [lens critic LP-10 + AV-25](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) · [research §5](../../Reviews/2026-07-25-lens-pass-corpus/research.md) · [[Ideas]]

## Held from earlier passes — revalidate before asking

### N2 — Constitutional system boundaries

 Still held as one bundle with named-exception answering (`N2A` adopt all / `N2B` + bullet codes to change / `N2C` defer). The codes: **N2a** "100 years" = active preservation · **N2b** "works on-chain" = complete durable state + bounded keyed queries · **N2c** lenses are typed, purpose-scoped compiled policies — **revalidated by the lens pass; askable stand-alone as LP-1** (answering LP-1 answers N2c; the bundle's other codes are untouched) · **N2d** public by default; never anonymity · **N2e** least-authority OS · **N2f** reproducible hash-addressed package closures · **N2g** recoverable/shreddable independent random roots · **N2h** browser-first with per-measured-host-lane confinement claims · **N2i** 50 principals normal / provisional 256 portable ceiling — structure now LP-4. The joined pass *consumed* several boundaries as invariants (N2b via P-22; N2d; N2g) but did not revalidate the bundle's wording. Details: [[assumptions-and-requirements#11. Human decisions requiring eventual disposition]] D-8–D-16, [[ops-doctrine]], [[web-os-thesis]].
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
### Q3 / Q4 — still held (the lens pass added hooks, not evidence)

**Q3** (public collab = revision DAGs + curation, `Q3A` rec): the lens pass named five collaboration read-hooks (H-Q3-1…5 in [profiles-composition §1.5](../../Reviews/2026-07-25-lens-pass-corpus/profiles-composition.md)) without answering it. **Q4** (checkpoints stay ordinary claims, `Q4A` rec): untouched and consistent; the checkpoint's absence-prover role was already dead, its freshness-hint role survives. Both stay held — no new evidence would change an arm. The joined pass's FS profile and local mode were written against the A-arms and disclose the coupling ([joined critic §8.3](../../Reviews/2026-07-25-joined-fs-pass-corpus/critic.md)). **Q5 and D-9 left this queue:** revalidated by the lens pass and now askable as the LP-6 rider and LP-2 respectively. Details: [[fs-pass-james-decisions]], [[read-lens-spec#Open questions]].

## Decide after evidence — do not answer yet

These are real owner acceptance gates. Engineers choose exact mechanisms; James chooses whether measured cost, usability, or product degradation is acceptable.

| ID | Choice | Evidence required (incl. new this pass) | Recommendation after evidence | Details |
|---|---|---|---|---|
| **E1 Authority venue** | Base/L2, Solana, L3, or another fixed profile | admission/rotation/recovery cost; finality/force inclusion; proof latency; independent RPC/state reconstruction; mandatory bounded queries; **+3 riders: venue-class (P-5r1), revocation force-inclusion latency (P-5r2), shared-settlement embedding granularity**; evidence note (lens pass): FOCIL slipped to Hegotá ≥2027 — the P-5r2 rider prices rollup escape hatches meanwhile | exactly one measured v2 profile | [[assumptions-and-requirements#17. Current first-prototype hypothesis]], [[solana]], [research §3](../../Reviews/2026-07-25-lens-pass-corpus/research.md) |
| **E2 Aggregate kernel cost** | accept full promise, trim optional surfaces, or reject | one combined gas/state snapshot including every mandatory direction; **+4 joined-pass inputs: mount-budget ⇄ current-live index coupling; dual-digest leaf pricing; generation-churn fixture** (the `SAME_SLOT_COLLISION` line is deleted — settled item F controls, [lens critic §2.2 P-6](../../Reviews/2026-07-25-lens-pass-corpus/critic.md)); **+4 lens-pass inputs: ONE joint kernel-counter row (`viewMutationVersion` MUST-candidate / `positionSeq` option / claimant roster lean-adopt with the corrected ~4–7× decaying cost curve); LR-1 §3 plan-store economics; the corrected gas matrix on the real kernel; closure-wide advisory cost** | accept only against the complete bill, not isolated cheap calls | [[onchain-completeness]], [[freeze-gates]], [lens critic §2.3](../../Reviews/2026-07-25-lens-pass-corpus/critic.md) |
| **E3 `admittedAt`** | store + batch-read, or explicitly degrade trustless time | measured incremental cost + two consumers — **now priceable: both consumers exist** (legal chain-of-custody; poll close rule) | store if the complete snapshot is tolerable | [[fs-pass-james-decisions#1. The `admittedAt` + index bundle (P1) — the pass's biggest lever]], [use-cases](../../Reviews/2026-07-25-joined-fs-pass-corpus/use-cases.md) |
| **E4 Author enumeration** | full author index or roots-forward + orphan-tail | gas/state + recovery benchmark; restated with the admission-time root-reachability constraint | smallest mechanism that still guarantees complete discovery | [[onchain-completeness]], [filesystem-core §4.2](../../Reviews/2026-07-25-joined-fs-pass-corpus/filesystem-core.md) |
| **E5 Definition enumeration** | paginated schema/definition index or omit | same snapshot + two real contract consumers (released from FS pressure) | include only if genuinely cheap | [[onchain-completeness]] |
| **E6 Lens ceiling — numbers only; the structure is LP-4** | CORE per-plan cap (candidate 64) and client compile ceiling (candidate 256) as separate measured constants | two compilers; cold/warm mobile benchmarks; adversarial fixtures; month-scale local merge/conflict benchmarks; the real-kernel gas matrix | 15–55 design center; 64 CORE / 256 client if measured | [[lens-spec]] §9, [[read-lens-spec]] |
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
