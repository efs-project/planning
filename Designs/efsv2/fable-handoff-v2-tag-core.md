# Fable handoff — v2 tag-core context

**Status:** draft
**Target repos:** planning, contracts, sdk
**Depends on:** [[efs-substrate-decision]], [[deterministic-ids]], [[efs-v2-holistic-redesign]]
**Reviewers:** —
**Last touched:** 2026-07-02

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk

## How to read this doc

This is **context and current thinking to accelerate you, not a spec to obey.** You (Fable) have authority to overturn anything here — including the ANCHOR ruling and the substrate direction — if deeper work finds a better answer. That is expected, not a deviation. The pattern we keep hitting: something sounds right in conversation, then falls apart under adversarial review. Assume some of the leanings below are in that category and hunt for which ones.

The **only** things treated as fixed are the mission ends (next section) — because they're the *goal*, not a means. Everything else is a means and is in play.

Confidence markers on each leaning:
- **[investigated]** — survived a multi-agent adversarial pass (substrate investigation `wyi9v61od`, or the anchor workflow `w0v4u85g2`). Higher confidence, still overturnable with cause.
- **[reasoned]** — thought through in discussion only, *not* adversarially tested. **Treat as a hypothesis to validate**, not a decision.
- **[open]** — genuinely undecided.

Where a leaning is [reasoned], the reasoning is given so you can weigh it — not so you defer to it.

## The mission (the fixed ends)

EFS = an on-chain **file system + graph database** bringing the web into blockchains. The properties we will not trade away (everything else serves these):

- **Permanent & credibly neutral** — anyone publishes/curates; nothing silently revised or deleted; a 100+ year archive.
- **Portable & substrate-independent** — a *deliberate capability goal*, not an unquestioned axiom: **permissionless cross-chain replication of authentic data** (canonical case: Microsoft publishes config; anyone spins up a new L3, copies it, apps read it as provably Microsoft's and keep working). Delivered by the envelope (below). **Bounded, honestly:** replication gives a *provable snapshot*, not a live cross-chain feed — updates don't auto-propagate. Per-author ordering *does* travel (a sequence number in the signed payload — which does **not** reintroduce EAS's time-in-identity problem, because it's author-chosen at signing and never enters ID derivation); trustworthy global cross-author ordering and instant cross-chain currency do **not** travel, but EFS's reads were audited to need only per-author order. Full plain-language explainer + deployment/gas notes: [[2026-07-02-record-format-investigation]] addendum.
- **Verify-don't-trust** — a reader can verify path → file → bytes without trusting an indexer.
- **Cypherpunk** — self-sovereign identity, censorship-resistant, no trusted intermediaries, privacy possible.
- **Hyperlinkable** by portable URIs across the graph and across chains.
- **A real FS + graph DB** people and dapps build on: files, folders, edges, string properties, collections, lenses (per-viewer trust scoping; ordered trusted-attester list; first-attester-wins).

If a leaning below conflicts with an end, the end wins and the leaning is wrong.

## The journey (why the leanings exist)

The thread that produced everything here: we started from "writes take many sequential clicks," pulled it to the foundation, and each pull moved identity/references/authenticity off EAS's native mechanisms.
1. EAS bakes `block.timestamp` into UIDs → children can't reference parents in one tx.
2. → deterministic, client-computable EFS IDs (references become chain-free math; one-tx atomic writes; portable links).
3. → for LOCKSS-style replication, identity from an owner field, not `msg.sender`.
4. → for authenticity after a chain dies, a chain-free author signature (the "envelope"), because on-chain attestations aren't portable signed artifacts (even EAS offchain attestations bind a chainId).

A 25-agent investigation then asked "is EAS even the right substrate?" and concluded: keep EAS as *carrier*, add the envelope, **reserve** the portable-identity machinery but don't build it, and refuse to promise cross-chain "currency" (is-this-current/revoked) because no design could deliver it honestly. That's the substrate ruling. Then a 6-agent pass resolved "should paths be tags?" → drop ANCHOR-the-object, keep a thin registration record.

## Current leanings (context, not constraints)

| Leaning | Confidence | The reasoning (weigh it, don't defer) |
|---|---|---|
| Deterministic, client-computable IDs | **[investigated]** | kills one-tx-per-layer; enables batch-deep creation and portable links |
| Portable Authorship Envelope = **custom minimal EIP-712, Merkle-batched (ERC-7920 shape), chainId-free domain**; NOT W3C VC/SD-JWT; author recovered from signature | **[investigated]** | on-chain composability + native-wallet production veto every standard (`ecrecover` ~3k gas vs VC verify impractical on-chain; MetaMask signs EIP-712 natively, not VCs). One signature over a Merkle root of per-record leaves = 1 click + each record independently copyable. See [[2026-07-02-record-format-investigation]] |
| Envelope is **always-on, not a user toggle**; UX solved at the submission rail (relayer/AA = 1 click) | **[investigated]** | a per-write toggle fragments the data; the Microsoft-config case wants broad replicability. 2-click only bites self-pay-plain-MetaMask (power-user fallback) |
| Carrier: **DECIDED — native envelope kernel + optional EAS export** (portability gate resolved, James 2026-07-07) | **[investigated + James-ruled]** | Full analysis: [[2026-07-07-carrier-decision]]. **The gate is now settled: cross-chain portability is a first-class requirement**, so native wins. Native kernel (chain-free EIP-712 Merkle-signed envelope; signature = auth; recovered signer = author) replaces EAS; a non-Etched `EASExporter` mints EAS attestations on demand for easscan (opt-in view, not lying carrier). Decisive reason: EAS *structurally cannot carry a chain-free signature* (domain binds chainId+contract), so staying pays the legibility-inversion lie *without* buying portability. Native is smaller (~500–900 LoC vs ~1,205), deletes footguns (timestamp-in-UID, bytecode pin, per-chain conformance), and uniquely delivers 1-signature portable writes with author-as-attester by construction. EAS is NOT a ratified EIP (one vendor's per-chain-divergent suite); the standard kept is EIP-712/ecrecover. **Not faith — a gated commit:** run the conformance harness → keep a v2-on-EAS abort ramp until independent external review of the signature/replay-domain spec passes → then freeze. The signature spec is THE irreversible Etched surface; external review of it is non-negotiable. Real cost = verification discipline (invariant suite + external review + executable Codex), not LoC; +2–4 wks. **Revocation caveat:** revoke *propagation* is free/portable (better than EAS), but revocation *completeness* is best-effort cross-chain (can't prove absence of a withheld revoke) — apps use expiry for safety-critical data; see [[2026-07-07-carrier-decision]] |
| Lenses / per-author logic key on the **envelope-recovered author** — RESOLVED by the native decision | **[investigated]** | The legible-vs-portable-vs-one-signature triangle that made this a fork was an *EAS* problem (delegation = chain-bound; envelope-with-relayer = lying attester). The **native kernel dissolves it**: the recovered signer IS the author of record, there is no separate attester field to lie in, and `msg.sender` (the submitter) is ignored. So lenses, first-attester-wins, supersession, mirror/property filtering, and visibility all key on the recovered author — legible + portable + one-signature by construction. (Third-party *resolvers* were never affected regardless — resolvers are schema-scoped.) `deterministic-ids.md §11`'s literal "attester = user" reconciles in the Codex to "author = recovered signer; submitter = anyone" |
| Reserve portable-identity/KEL + P-256/passkey succession, don't build it in v2 | **[investigated]** | every full portable-*currency* mechanism died under red team; and bare-ecrecover-forever is the "one key = identity" trap (quantum-doomed ~2030s) — ship the envelope with the 32-byte identity-word + succession reserved; EOA is the degenerate single-event KEL |
| Permanent archive; everyone pays their own writes; no free ephemeral tier | **[reasoned]** (James ruled) | a free tier is the only thing that made records-first win, and it isn't an archive; but this hasn't been stress-tested against real stranger-write apps |
| Sponsorship = optional community relayers (author stays signer) | **[reasoned]** | falls out of author-from-signature; abuse economics untested |
| Content neutrality; residual is an operator-doc note | **[reasoned]** (James ruled) | lenses + immutability; the operator-liability angle is un-analyzed |
| Properties string-only | **[reasoned]** | typed values force messy URI separators; Unix "everything's a string." **The on-chain-numeric-consumer cost is unmeasured** |
| Drop reserved metadata keys | **[reasoned]** | pure gas optimization, not extensible; optimize later with evidence |
| Identity = signing key for v2; reserve a 32-byte identity-word + KEL/passkey succession | **[investigated]** | key-is-identity now (EOA = degenerate single-event KEL); succession reserved so rotation/recovery/PQ is additive later, not a break |
| Keep container classifier: Address > Schema > Attestation > Tag | **[reasoned]** | how users view/link any on-chain object; the 64-hex collision-safety is unproven |
| Harberger public option | **[open]** | James's separate agent; likely an app-layer overlay on lenses — flag the neutrality interface |

## The ANCHOR question — resolved direction, with its costs exposed

**[investigated]** ruling (workflow `w0v4u85g2`, unanimous across 3 architects + red team + synthesis): **drop ANCHOR-as-graph-object; keep a thin registration record (call it TAGDEF).** Presented as reasoning + costs so you can re-weigh, not as a mandate:

- ANCHOR's only unique capability (refUID-referenceability) is already spent in v2, so dropping the *object* costs ~nothing there. A path becomes a derived `tagId`; hierarchy falls out of `tagId = keccak(DOMAIN, parentTagId, keccak(name), kind)`. Rename/subsume = REDIRECT over immutable IDs. "Is X under /pizza" = a cheap walk up the shared `_parents` pointer.
- **The honest caveat the red team surfaced:** a naive "no record at all, name rides in the first edge" version is fatal — keccak one-wayness makes a bare `tagId` unverifiable, and it silently drops two properties ANCHOR's resolver was quietly enforcing: **on-chain canonical-name validation** (a 50-year integrity property) and **path permanence** (non-revocable, so links never structurally 404). So the surviving record isn't ceremony — it carries those. If you find a way to keep those guarantees *without* a per-segment record, that's a real improvement worth taking; the red team didn't find one.
- **A precision worth keeping in mind:** "tags are the only core element" holds at the *identity/namespace* level (one derived-tagId space for paths/folders/tags), **not** at the edge level — merging PIN (cardinality-1) and TAG (cardinality-N) into one edge with a cardinality *field* breaks O(1) file-placement reads (cardinality lives in the schema for a reason). And DATA stays *owned* (unsquattable) vs tags *unowned* — opposite duplicate policies. Those two merges looked tempting and are traps; but if you see past them, say so.

**What would flip the ruling** (none holds today): v2 re-promotes refUID to semantic authority; a concrete need for an attestation to point *at a path node itself*; or name-validation can't be re-homed without full ANCHOR semantics.

Adjacent simplifications the same pass surfaced (all overturnable): drop LIST_ENTRY → cardinality-N edge with a kept LIST *declaration* node for gating; naming-slot = TAGDEF + one PIN (2 writes not 3); and two genuine *forks* it declined to force — MIRROR → reserved property key, REDIRECT → property — each trades a schema for re-homed enforcement.

## Open forks

- The two "consider" collapses (MIRROR, REDIRECT) — real forks, not free wins.
- Container classifier: bare-hex-plus-precedence only, or also an explicit-prefix escape hatch.
- Whether the per-segment TAGDEF cost model is right, or whether a cheaper canonical-fact registration exists.

## Deep analyses that would make the project great (suggestions, not a checklist)

These are where the value is, and where the "oops, disaster" usually hides. Pick what matters; invent others.

**Stress-test the leanings that haven't been:**
- Run the tag-only model end-to-end against the real app suite (file browser, blog, comments, social feed, photo archive, curated collections, DAO docs, package registry, NFT metadata, web archive). Where does TAGDEF-per-segment + naming/categorizing get awkward or expensive? This grounding was flagged as possibly decisive and still hasn't been done against the *tag* model.
- Adversarially design the **envelope / replay-domain** — the one must-be-perfect crypto surface. It deserves its own red team like the substrate one.
- Find a real app genuinely hurt by **string-only properties** (on-chain numeric consumers, sort/range) and confirm the workaround is acceptable — or discover it isn't.
- Prove or break the **container classifier**'s 64-hex collision-safety and cost.
- Pressure-test **identity = key + reserved slot** against "user loses key" and "org with rotating signers" — does real recovery UX force the KEL sooner than v2?

**The load-bearing unknowns flagged but never tested:**
- **The lens model at scale** — default-lens monoculture and discovery bootstrap were the investigation's most-cited, least-tested weakness. Design the discovery/curation/trust UX and show it doesn't collapse into a reputation oligopoly.
- **Community-relayer abuse economics** — who runs them, sybil resistance, token-incentivized spam.
- **Gas reality** — actually measure v2 write costs (per claim, per file, per TAGDEF) on a real L2. Everyone's been assuming numbers.

**Cheap executable checks:**
- **The envelope+Merkle rehearsal** (days, no wallet changes) — sign N config records as one Merkle root via stock `eth_signTypedData_v4`; write a ~30-line Solidity verifier taking one leaf + proof + root-sig → returns the ecrecover'd author, proving a destination contract reads a **cherry-picked** copied record natively with no oracle. De-risks the whole portability design end-to-end. Details in [[2026-07-02-record-format-investigation]].
- **The dead-chain fire drill** (never run) — fold into the above harness: kill the devnet, re-verify one leaf from exports alone. Validates or retracts the 100-year "verify offline" claim.
- The write-cost measurement above.

**Design when portability is actually built (reserved now):**
- Cross-chain replication mechanics (model A vs C from [[deterministic-ids]] §9).
- Privacy / encryption / harvest-now-decrypt-later conventions.
- The witness-quorum layer ("Architecture E") if cross-chain currency is ever wanted.

**Doctrine / housekeeping:**
- Disposition of the v1 prototype (existing devnet data/deployment).
- A written scope for the "one-final-freeze" pledge (what it does and doesn't bind).
- The illegal-content / operator-liability note.
- The Harberger overlay's interface with lens neutrality (James's separate agent — flag where they meet).

## Evidence corpus

Full research + architectures + red-team + judges: `planning/Reviews/2026-07-02-substrate-corpus/` and [[2026-07-02-substrate-investigation]]. The v2 ID math: [[deterministic-ids]]. The freeze bundle + gaps: [[efs-v2-holistic-redesign]]. Ground-truth contracts: `contracts/specs/` + `contracts/packages/hardhat/contracts/`.
