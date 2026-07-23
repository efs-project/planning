# EFS v2 — Owner rulings & notes (James)

**Status:** reference — append-only, dated ruling ledger. NOT a design: decisions/directions only. The design docs get updated to match separately.
**Last touched:** 2026-07-23

#status/reference #kind/note

## 2026-07-10

### Simplifying assumption: chains don't die
- **ADOPTED (James): assume a blockchain persists indefinitely and stays queryable.** The design has been carrying a lot of dead-chain hedging; drop it.
- **Apply surgically — DROP these (chain-death machinery):** year-100 "verify offline from dead-chain headers" procedures; the dead-chain fire drill *as a survival gate*; chain-mortality tiers; checkpoint-recency framed as death-insurance; any "graded/UNKNOWN after the home chain is gone" language. Removing these makes identity and currency more *definite* (you can always query the authoritative home chain).
- **KEEP — these mention chains but for OTHER reasons, not death:**
  - **Cross-chain replication / portability** — motivated by **reach + composability** (copy data to the chain where a reader/contract lives, e.g. a new L3), *not* survival. Still wanted. Cross-chain copies remain best-effort snapshots; authoritative reads go to the home chain (which now always exists — simpler).
  - **Full-body spine + no-body-elision (Etched)** — addresses **history/log pruning** (EIP-4444: chain lives, prunes logs) and possible **state-expiry**, which are separate from chain death. Keep — it's cheap insurance, and "state persists forever" is a stronger bet than "chain persists forever." James is optimistic Ethereum solves state-rent/pruned-data-availability; treat that as upside, don't *depend* on it.
- **NET effect:** KEL and currency simplify most — "home-chain-authoritative + home chain always queryable" ⇒ "is key K current for I / is claim R revoked" is a definite on-demand read, not a cross-chain freshness nightmare.
- **Follow-up (cleanup, not now):** sweep the docs (read-lens-spec, identity, ops-doctrine, codex-*) and strip dead-chain hedging language; keep the pruning/reach justifications. Do NOT do this as design work — it's an editorial pass.

### KEL — design it
- **Ruling: YES, design it.** Bare-EOA stays the day-one identity; KEL is the upgrade path (rotation, recovery, delegation, session keys, personas, org/DAO, PQ).
- **Strategic fork ruled: home-chain-authoritative + graded elsewhere** (mirrors the revocation stance; now even cleaner under chains-don't-die).
- **Discipline: run as a major adversarial track** (independent designers + dedicated crypto red-team + external review before any Etched freeze). The risk is a rushed freeze, not the decision. No schedule pressure — take the time.
- Downsides acknowledged: highest-blast-radius subsystem; reference impls (KERI/Holochain) are immature; recovery UX is a general open problem. Accepted.

### Lenses — focused pass (likely Codex)
- **Concern (James): scale.** Realistic user = ~12 own keys + ~40 friends = **50+ attesters in one lens, resolved on every directory listing.** Fear: naive first-attester-wins is O(entries × attesters) and breaks; and we over-depend on lenses (most-cited, least-tested mechanism).
- **Concrete conflict:** MAX_LENSES = 20 (ADR-0026-era) vs. the 50+ target. Revisit.
- **Ready now**, runs in parallel with privacy. Assume **stable (KEL-style) identities** per lens entry, not raw keys. Key deliverable: the **lens-object canonical encoding** (unwritten; also what lets "what I see" survive device loss).

### Public-by-default + sensitivity policy layer
- **Ruling: public by default** (network effects, shared feel). Private only for items classed **sensitive** or where the user **opts in**.
- **New named deliverable: a "sensitivity policy layer"** — OS/app declares which record-classes/paths are sensitive-by-default (credentials, private messages, health, drafts, admin config); everything else born public; sensitive folders make children sensitive by inheritance; a "make private" action for opt-in. **Client/OS convention, iterable, NOT freeze-bound.** The classifier's defaults are the tuning knob between "viral/shared" and "safe."
- **Action:** fold into the in-flight privacy pass as a named subsystem, not a footnote.

### Storage
- **Direction (James):** on-chain (durable) + Arweave (permanent off-chain) now; possible Filecoin grant for IPFS pinning; bet that bigger on-chain files become normal within ~a decade.
- **Notes:** keep the design **size-agnostic** (it is — MIRROR is transport+URI; CREATE2 chunk recipe scales); **don't design *depending* on future scaling** (the full-body spine already hedges pruning). Durability tiering: **on-chain > Arweave > grant-pinned IPFS > volunteer IPFS** (IPFS pinning decays when grants lapse; Arweave's pay-once endowment is the more durable off-chain bet). Later (convention, not freeze-bound): a durability-labeling + mirror-health ("are my mirrors alive?") convention.

### In-flight / status pointers
- Privacy pass: **launched.** On-chain-completeness bundle: **freeze-gates decision 9** (one priced gas-bundle; recommend accept). Lens pass: **prompt ready** (below / handed to Codex).

## 2026-07-15

### On-chain sign-off — partial rulings (the 18-item list, onchain-completeness §3)
- **Overall stance (James): lean hard on-chain.** Everything important works on-chain; The Graph only for what's absolutely needed — genuinely unbounded/heavy search (ranked, full-text, global aggregates). Matches "The Line."
- **A — backlinks incl. predicate-typed (items 1–4): ON-CHAIN, indexed.** Slam-dunk. Postings word carries `definitionId` (the headline freeze change) + admit ADDRESS targets.
- **B — reverse membership + REDIRECT cited-by (items 5–6): ON-CHAIN.** Now-or-never; build the indexes.
- **C — best-mirror ranking (item 7): ON-CHAIN.** Restore the on-chain best-mirror view; **zero new state** (mirror hierarchy already kept). James: "we have the hierarchy."
- **E — live count (item 10): revocation-aware, PAY for it.** Do NOT ship "advisory only." Revocation-aware state (count drops when endorsements are revoked) is core to EFS.
- **D — self-enumeration (item 8): PENDING, needs numbers + design detail.** Disentangled from KEL: KEL restores *keys* (not EFS's job); enumerating *your own authored data* once you hold the key IS EFS's job (a plain author-keyed reverse index). Open sub-question: full author index vs. **covered by recovering on-chain roots and forward-walking (already Tier-1, ~free), with orphan claims (loose edges not under any owned folder) as the residual gap.** Lean: roots-forward covers most for near-zero cost; author index is the smaller add for the orphan tail. Decide against the costing pass.
- **F — equivocation/freshness gating (item 9 / F1–F2): RULED — SIGN THE LIMITATION (Option 2).** Do NOT reserve the on-chain collision bit. Wording to ratify: *"on-chain gates use closed, trusted author sets; EFS does not guarantee contracts can detect equivocation, and contracts needing certainty against untrusted authors must use a challenge-window (delay + re-check) pattern."*
  - **Mechanism (for the record):** chain keeps the LWW *winner*, not the *conflict*; no duplicity/collision bit today; apps/clients ALREADY detect equivocation by scanning (this decision doesn't touch them); only autonomous *contracts* are blind (they read one slot). A collision bit would be Etched kernel state + a write-path tax.
  - **The clinching argument (James):** the bit is TOCTOU-defeated. It only reflects equivocation already on-chain at read time; a contract that already acted is not retroactively protected; and the attacker controls timing (sign good value → wait for contract to act → then sign conflicting value), so the bit stops only clumsy simultaneous equivocation, never timed. Real defense = trusted closed author sets, or a contract-side challenge window — neither needs the kernel bit.
  - **Caveat:** the bit is now-or-never (Etched). Accepted — the bet is "contracts gate on trusted authors (or self-impose a delay window)" is a safe permanent rule.
- **G — `act` delegation (item 11): PENDING, downstream of KEL.** Graph labels are permissionless (anyone can write "I act for T"), so authorization must read KEL's bounded grant/epoch ABI, never infer authority from `act` edges. `act` = provenance/UI only. Rides out of the KEL pass; nothing to decide now.
- **12 — schema enumeration: RECLASSIFIED → ON-CHAIN (James corrected my EAS claim).** EAS's on-chain `Indexer.sol` already does paginated on-chain enumeration by schema (`getSchemaAttestationUIDs(schema,start,length)` + count) — enumerate-by-type is a proven on-chain, bounded, paginated pattern; my "only via GraphQL" was wrong. EFS matches it:
  - **List all records/items of a given definition → ON-CHAIN** (keyed, paginated; = the definition-keyed index already in the A–E bundle). Slam dunk, in regardless.
  - **List all definitions/schemas themselves → cheap paginated index, James's call.** (Base EAS SchemaRegistry appears to be `mapping + getSchema(uid) + Registered` event — full type-list via events/indexer, not an on-chain registry array; VERIFY against EAS source. EFS can add a paginated definitions index cheaply if the full type-list on-chain is wanted.)
  - **RULED (James) — MANDATORY automatic indexing; EAS opt-in REJECTED (bundle-wide, not just item 12).** Anything written on-chain through EFS (kernel entrypoints / EFS APIs) is **force-indexed** so everyone can reuse it freely — indexing is what makes EFS work as a shared substrate, so it is not optional. Rationale: opt-in would allow on-chain-but-un-queryable "half-presence" data; forcing it guarantees everything on-chain is genuinely usable by the network. Kills the "is X indexed?" conditional — everything on-chain is queryable.
  - **Escape hatch = the client.** You may sign data and keep it **client-only** (don't pay the index cost, don't expose it) — that's the opt-out. But the moment it goes on-chain via EFS, indexing is mandatory. Clean line: *private/local = your business; on-chain = everyone's to use.*
  - **Costing pass simplified to ONE model (automatic).** No opt-in variant to price.
  - **Privacy-pass boundary (hand over as firm):** forced indexing makes the on-chain **graph structure** (who→what edges, authorship, targets) public by construction — the index covers ciphertext/metadata even when content is encrypted. So: *on-chain = metadata-exposed, full stop; the client is the only true metadata-privacy path in base EFS.* Sharpens the confidentiality-vs-metadata split; graph-hiding needs client-side or the metadata-privacy frontier (stealth addresses, etc.).
- **13 — content-hash lookup: RECLASSIFIED → partly ON-CHAIN.** James wants "given a sha256, find the file on-chain." That's a KEYED lookup (bounded by matches) = same shape as the backlink index → **add a `contentHash → DATA/file` index to the A–E bundle.** Only the unbounded global dedup *sweep* ("list every duplicate everywhere") stays off-chain. (Large-file BYTES may be free via content-addressed storage — address derivable from the hash; the file-node index is the cheap add.)
- **14 — keyWrap / contract decryption: CONFIRMED off-chain, by physics.** An on-chain contract CANNOT decrypt private data — all contract state is public, so a contract holding a key ⇒ key is public ⇒ no privacy. **Principle: contracts operate on PUBLIC data; private data is client/device-decrypted only.** keyWrap recipient-set stays off-chain because publishing it leaks who-can-read (privacy metadata). Frontier exceptions (FHE/TEE/ZK) = privacy-pass future research, out of base scope. Rule of thumb: if a contract must read a value, don't encrypt it.
- **15 — ranked/full-text/aggregate search: CONFIRMED off-chain** (heavy search = The Graph's job).
- **16 — calldata file bytes: CONFIRMED off-chain (DA-tier).** **James's governing definition adopted: if a contract can't read it in bounded gas, it's off-chain** (matches the audit's composability axis; the chain is "just DA" for these). File BYTES fail this (past-tx calldata isn't contract-readable) → DA-tier, honestly graded @EPHEMERAL. Distinct from record BODIES (which stay on-chain forever per 18). Contracts read file *metadata* (hash/size/mirror pointers, in state), never raw bytes. Note the middle tier: client-verifiable-without-trust but not contract-composable — better than The Graph, but by James's def still not fully on-chain.
- **17 — full-body spine: RULED — PAY IT.** The load-bearing yes; without it the whole claim/edge/revocation layer is event-only = everything above collapses to off-chain. Also what preserves both siblings for F's equivocation-detectability.
- **18 — no body-elision: RULED — ETCH IT.** Explained to James: 'body' = a record's full content; 'elision' = a future space-saving optimization that drops bodies on-chain, keeping only a hash. Etching 'no elision' = permanent promise never to do that, so the on-chain guarantees just bought can't be silently undermined later. Locks out a future chain-shrink option — accepted (consistent with 'bigger on-chain is the bet' + chains-don't-die). Applies to record BODIES, not large file BYTES (those stay ephemeral per 16).
- **Bundle now includes the `contentHash → file` index (from 13).** Blocker to final sign unchanged: **the ONE gas snapshot (freeze-gates A2) is not yet produced.** A costing pass is needed to sign the bundle against real per-write numbers (A–E + D's author-index option + the new content-hash index).
- **Still open:** 12's optional enumeration index (James to say if wanted); the gas snapshot / costing pass.

### KEL — persona model, UX-first ruling
- **Ruling (James): the mainstream default is ONE root that recovers and manages all your addresses/personas.** One-place recovery + management is "a huge win for an OS most people will use" — prioritize it. Unlinkable personas are an **opt-in capability, not the paranoid default.** True isolation = **separate roots**, which hardcore cypherpunks will do anyway (and would use a dedicated isolation tool we build for that regardless). Don't sacrifice the mainstream recovery/management UX to give one root perfect NSA-grade persona unlinkability — that's the wrong trade for the default.
- **This resolves the persona keystone in the UX direction** (was the gating fork for lenses/privacy/OS/addressing). Hand to KEL as the leading **hybrid** hypothesis to *build on and attack*, not re-survey:
  - **One root** → recovery + management anchor (model 2's strength; proven: Farcaster IdRegistry recovery-address, Coinbase passkey-sync, Argent guardians, Safe modular recovery).
  - **Unlinkable *derived* personas, opt-in** (Monero-subaddress / stealth-address ERC-5564 pattern — unlinkable to outsiders yet all recoverable from one root; in production via Fluidkey). Gives privacy where wanted without a second root.
  - **Selective disclosure for linking** (prove "these two are me" with a viewing key) instead of a permanent public link label (avoids the `act`/Nostr-NIP-26 permissionless-label trap).
  - **True isolation = separate roots**, explicitly out of the one-root convenience path.
- **Cross-checks for KEL:** must reconcile with the mandatory-indexing / on-chain-metadata boundary (on-chain = graph metadata exposed; unlinkable personas fight this at the crypto layer, not the index layer) and with single-sig authorship. EIP-7702 (shipped Pectra 2025) is the real in-place EOA→smart-account upgrade precedent; P256/passkey precompiles (RIP-7212 / EIP-7951) make passkey signers cheap; honest cost: PQ sigs ~2.4KB.

## 2026-07-16

### KEL recovery — RULED
- **Passkey-sync is the mainstream default recovery.** Start there; add social/guardian recovery later. (Recording now — I told James last turn I'd recorded this but had not actually written it to the file.)
- Already architected this way in [[kel]] §10/§18/§20: recovery *machinery* (RecoveryPolicyV1, propose/finalize/veto, threshold) is freeze-sensitive + designed; recovery *default composition* is CONVENTION (not Etched) → passkey-sync-first + guardians-later = **zero freeze change.**
- **Caveat (kel.md §20 REJECT + §21):** a LONE synced passkey is rejected as sole root (synced-provider compromise = single point of failure). Honest minimum launch default = **passkey-sync + one independent cold backup factor**; full social/guardian recovery = deferred opt-in.

### COURSE-CORRECTION — a full KEL pass already exists (missed it earlier)
- **[[kel]] (2026-07-12, 24 §) + [[assumptions-and-requirements]] (2026-07-12) already exist.** The KEL foundation pass ran, deeply. `kel-kickoff.md` (built on the superseded [[identity]]) was REDUNDANT → **deleted 2026-07-16.**
- **Persona keystone already resolved in kel.md** (§11/§18-fork-2): separate-KEL personas grouped in the local OS profile (one place to manage; unlinkable on-chain; true isolation = separate roots). The derived-stealth-persona *hybrid* in the 2026-07-15 persona note is MOOT — kel.md deliberately keeps stealth for disposable one-shots; durable pseudonyms = full KELs. Personas can't share a recovery root (would relink them); "manage in one place" = local OS, not one key.
- **The real blocker is JAMES'S DECISIONS, not another design round.** [[assumptions-and-requirements]] holds D-1..D-16 (D-1/D-2/D-3 gate almost all KEL + cross-chain scope) + kel.md §23. Next step = a decision session, not a pass.

### Portability model (James asked; = the crux of D-1/D-2)
- **DATA is truly portable** (record bytes, logical IDs, actor signatures = copyable to any chain as evidence, verifiable without trusting the copier). **AUTHORITY is homed** (current key-state, ordering, revocation need a canonical "authority home" to be definite/enforceable). A signature proves *who signed what*, never *when* or *whether authorized at the time*.
- James's instinct ("a home chain gives anchors to enforce ordering + revocation") = exactly the design's reasoning → leans **D-1 = yes, D-2 = one fixed home, D-3 = no cross-chain hub.**
- **D-2 = the home-chain question James raised.** Sub-choice: one fixed authority home for all EFS (simplest; design-recommended = Option B) vs per-principal home + L1 locator + migration (maximal; design recommends deferring).
- **D-3 recommended = NO hub.** EFS does NOT build cross-chain bridges/light-clients; clients verify, foreign contracts use adapters/snapshots. The "nearly impossible to build" hub is explicitly NOT required.

### META — the design set is disjointed (James flagged); consolidation wanted
- **James: the designs are hard to wade through, isolated, not cross-linked** — which is exactly why kel.md / assumptions-and-requirements / the D-decisions were missed earlier. Concrete evidence: **README.md is stale** — still lists [[identity]] as primary and does NOT index [[kel]] or [[assumptions-and-requirements]] (the two most important current docs).
- **Project direction (James):** (1) a PM consolidation + linking pass; (2) ALL owner decisions in ONE canonical place going forward (owner-rulings + the D-ledger are currently separate — merge/cross-link); (3) enforce linking/referencing so isolation misses don't recur.
- **The consolidation plan already exists:** assumptions-and-requirements.md §14 lays out the reconciliation order (adopt D-1..D-16 into owner-rulings → write `system-constitution.md` → re-cut the core docs together → …). It's blocked on the top decisions. So: **decisions first, then consolidation.**

## 2026-07-22

### Cross-platform read-only mounted EFS — REQUIRED

- **ADOPTED (James): EFS v2 must expose a useful read-only mounted filesystem on Linux, macOS, and Windows.** It must work through ordinary command-line tools and each platform's normal graphical file manager. A Linux-only prototype does not finish the requirement.
- **Linux FUSE is an adapter and likely first implementation path, not the canonical protocol API.** The design target is one platform-neutral resolved-filesystem contract with Linux, macOS, and Windows adapters. Current leading candidates are libfuse3, macFUSE/FSKit, and WinFsp; exact adapters, versions, packaging, licensing, and support floors remain evidence-driven Durable choices.
- **The required common profile is deliberately read-only:** deterministic directories, regular files, stable file identity, pinned handles/directory snapshots, verified range reads, honest absence versus `UNKNOWN`, bounded metadata, and read-only failure for every mutation. Writable mounts remain later research.
- **Cross-platform validation is a data-model gate.** Portable filename presentation/collisions, exact child and point-property enumeration, basis pinning, missing/corrupt bytes, adapter error categories, and metadata bounds must pass one golden fixture on all three hosts before EFS claims filesystem-semantic validation.
- **EFS properties project to xattrs/EAs, but xattrs are not the canonical property model.** Short bounded public scalar/diagnostic metadata may appear as read-only `user.efs.*`; the complete property graph, provenance, grades, and pagination require a lossless control/API surface.
- **Plan 9 is adopted as design precedent, not a fourth launch requirement.** A process-local namespace is a strong analogue for an EFS resolved view, and ordered union lookup models the simple priority-lens subset. EFS lenses remain richer authenticated policies with WHITEOUTs, basis/completeness, and fail-closed `UNKNOWN`; exact resolution stays inside the EFS resolver.
- **This mount track remains separate from Solana/substrate portability.** The first required mounted view is Ethereum/EVM EFS; making that view work on three desktop OSes neither chooses nor rejects Solana support.

### Research sequencing before an MVP pass — DIRECTION

- **Do another joined deep pass before contracting to an MVP.** KEL/authority and lenses/resolution are the first two foundations to revisit. Then re-check their coupling to required on-chain enumeration, Solana/independent realms, local or networked storage, privacy, and the Linux/macOS/Windows read-only mount.
- **This supersedes the 2026-07-16 “decisions first, then consolidation” sentence as sequencing guidance only.** Adopted rulings remain adopted. Unanswered N/Q/D choices remain useful issue inventory, but their wording, grouping, options, and recommendations must be revalidated before James is asked to answer them as a packet.
- **Use the new cases as pressure tests, not automatic requirements.** Keep Ethereum/EVM as the reference and intended strongest/composable profile; use Solana, signed local/network realms, and native mounts to detect accidental coupling and missing semantics.
- **The contraction gate comes later.** After the joined pass and comparable prototypes, reconcile the owner inbox, write the short constitution and explicit support matrix, and only then choose the MVP. The matrix should distinguish required, extension-ready, experimental, and explicitly unsupported behavior.
- **Research may expand possibilities without flattening guarantees.** Portable artifacts, authority, query completeness, byte availability, native program/contract readability, and host projection remain separately named capabilities throughout the pass.

## 2026-07-23

### CORRECTION — agent synthesis was not an owner ruling

Commit `471a2ca` incorrectly promoted several integration-agent conclusions to **RATIFIED** owner rulings and overstated one exploratory question as a James requirement. They are corrected as follows:

- **Cross-chain bridges, hubs, and locators in the v2 baseline are UNDECIDED.** “Do not add them without a demonstrated application” remains a useful research stop rule, not an adopted architectural prohibition.
- **Splitting N1 is an agent recommendation for producing an answerable packet, not an adopted architecture choice.** The bundled N1 remains held and must expose its independent axes before any answer is interpreted broadly.
- **The sequencing hold blocks agents from presenting N1–N6/Q1–Q5 as a batch with stale recommendations.** It does not prevent James from voluntarily answering an isolated choice; any such answer is recorded and its affected axes are reconciled.
- **Decision routing is vault process, not an EFS architecture ruling.** The current inboxes and generated [[Open-Decisions]] view may be improved during consolidation without changing protocol semantics.
- **EFS support for every chain or every new L3 is NOT a requirement.** The requirement is to avoid accidental design coupling while the pass evaluates Ethereum-first, independent-realm, Solana, and non-chain possibilities.

The 2026-07-22 cross-platform read-only mount requirement and research-before-MVP direction remain adopted. The corrected open axes are tracked under held N1 and N5 in [[owner-decision-inbox]].

— ruled by @james, 2026-07-23

### Deferred — James needs to think (NOT rulings yet)
- **"KEL introduces no cross-chain machinery; per-principal L1 homes/migration rejected"** — deferred; KEL-coupled, belongs to the re-run pass.
- **"Do not bake a specific venue into the protocol; venue stays evidence-gated (E1)"** — deferred, same reason.
- Explicitly NOT ruled (these are the held N1 question in disguise): one-chain-as-user-anchor; OS-useful-before-any-chain; portability-worth-weaker-authority.
- **Honest status: none of the chain/authority space is measurement-backed yet.** E1 (venue admission/rotation/recovery cost, finality, force inclusion), E2, E6, E10 are all open. The N1A recommendation is architectural reasoning + prior art, not benchmarks. James's "L1 expensive / L2s transient" objection is exactly what E1 would settle with numbers.

### UNDECIDED hypothesis — the OS and filesystem may need different authority models
- **Question raised by James:** a shared venue is attractive for social/OS network effects, while a user may care only about one L2/L3 and should not necessarily need Ethereum L1 gas or a universal home. Could the filesystem be self-sufficient in a realm while the social/OS layer uses another shared anchor? This is a pressure test, not a requirement that EFS work on every chain.
- **Assessment: sound and important, with one hard consequence.** "FS works on any chain with zero dependency on another chain" and "one global identity/social graph" cannot both hold: an L3-local EFS either has **realm-local identities** (fragmented; authority becomes realm-qualified) or its users **depend on the anchor chain** for identity — the cross-chain dependency being avoided. This is an inherent tension, not a design gap; [[assumptions-and-requirements]] R-K11 already states two domains cannot both claim unqualified `CURRENT` for one principal.
- **Where it points:** **realm-local/self-sufficient filesystem deployments (≈N1B independent realms) + an optional shared anchor for the OS/social layer** (≈ [[ethereum-first-efs-and-os]] Shapes C/E). NOT adopted — flagged as the shape to evaluate.
- **Question for the re-run pass:** *"Does the filesystem require the same authority venue as the social/OS layer?"* is one explicit N1 axis.

### Decision-routing structure — agent audit note, not an owner ruling
- The hierarchical inboxes remain the current process implementation, not permanent protocol or product architecture.
- The subsequent PM hardening pass added the generated [[Open-Decisions]] roll-up and propagated active holds. Consolidating historical rulings remains editorial work for the holistic documentation pass.
