# EFS v2 — Privacy: design, research grounding, and the honest frontier

**Status:** draft — consolidated from the 2026-07-10 FS pass; **validation round RUN 2026-07-11** — rulings in [[privacy-pass-synthesis]] / [[privacy-freeze-reservations]] / [[privacy-james-decisions]]; corrections from that pass are applied in place below and marked
**Target repos:** contracts, sdk, planning
**Depends on:** [[fs-pass-synthesis]], [[fs-pass-freeze-reservations]], [[codex-kinds]], [[identity]], [[read-lens-spec]]
**Base text:** [deletion-trash-privacy.md](../../Reviews/2026-07-10-fs-pass-corpus/deletion-trash-privacy.md) + [attack-privacy.md](../../Reviews/2026-07-10-fs-pass-corpus/attack-privacy.md)
**Last touched:** 2026-07-11

#status/draft #kind/design #repo/contracts #repo/sdk #topic/privacy

> **Identity/privacy addendum (2026-07-11).** [[kel]] §11/§16 separates public device/app actors from genuinely unlinkable personas: the former collapse beneath one public principal; the latter require separate principals, KELs, recovery, encryption keys, and Ethereum accounts, with no public master roster by default. It also requires opaque grant/guardian commitments and keeps signing, vault, and KEM keys separate. Apply that model wherever this document says “persona.”

## 0. The one-paragraph honest frame

Privacy in EFS splits into **two layers that are not equally solved, and conflating them is the mistake that makes people say "privacy is impossible on blockchains."** Layer 1 — **confidentiality** (nobody reads my bytes / my names without a key) — is real, proven, and grounded in respectable-to-current cryptography; EFS's design here is sound. Layer 2 — **metadata / graph privacy** (nobody learns *who* relates to *whom*, *when*, and *which* records connect) — is the genuinely hard problem, it is where the "impossible" reputation actually comes from, and EFS today handles it with **honesty plus convention-level mitigations, not the cutting-edge techniques that could push it further.** This doc states exactly which half is which, cites what the design is actually based on, names the frontier it has *not* yet integrated, and defines the validation round. **The intellectually honest headline: EFS has good confidentiality by design and deliberately-bounded metadata privacy — and a chunk of that bound is a direct consequence of the mission ends themselves, not a fixable gap.**

## 1. The constraint that shapes everything

EFS is a **public, permanent, credibly-neutral, verify-don't-trust** ledger. Two consequences are non-negotiable and they cut opposite ways:

- **There is no read-ACL and there cannot be.** A public chain cannot enforce "only Bob may read this." So privacy is never a *permission* — it is **encryption + capabilities**. The model is Tahoe-LAFS, not POSIX: you hold a key/cap or you don't; "read-exclusion" means *you can't decrypt*, never *a server refuses you*.
- **The graph is verifiable, therefore the graph is visible.** The mission promises anyone can verify path → file → bytes *without trusting an indexer*. A structure you can independently verify is a structure whose *shape* you can see. So some metadata leakage is not a design failure — **it is the price of verify-don't-trust.** This is the deepest honest point in the whole doc and it must be said plainly to anyone who asks "why not just make it private like Zcash": because Zcash-for-files would forfeit the legible, hyperlinkable, composable public archive that *is* EFS.

## 2. Threat model (what we actually protect, against whom)

| Adversary | Protected? | By what |
|---|---|---|
| Passive reader of the chain wanting your **file contents** | **Yes** | payload encryption (Layer 1) |
| …wanting your **file/folder names** | **Yes** | encrypted dirnodes + private-tier metadata suppression at launch (JD-6/JD-19, ruled 2026-07-11); salted/blinded TAGDEFs are the reserved post-freeze addressable tier (Layer 1) |
| …wanting to know **whether a specific person is a recipient** | **Partially** | random occurrence keys close the O(1) oracle; correlation still possible (Layer 2) |
| …wanting your **social graph / collaborators / team structure** | **No, bounded** | personas + convention mitigations; co-occurrence leaks (Layer 2) |
| …wanting **which files you read** | **Partially** | reads leave no on-chain trace (atime gone); gateway sees fetches → P8 read-path privacy (Layer 2) |
| …**forcing you to reveal** (coercion / rubber-hose) | **Partially** | plausible-deniability via blinded paths is *possible*, not *default* |
| A **future quantum adversary** harvesting ciphertext now | **Contents yes** (X-Wing PQ-hybrid wraps, ruled 2026-07-11); **recipient unlinkability no** — classical-only, retroactively exposed at CRQC (PC-6 quantum-expiry line; kill #19) | HNDL is real on a permanent chain |
| A **global network observer** (who fetched what, from where) | **No** | out of protocol scope; needs mixnets/Tor/OHTTP at the transport layer |

The honest one-liner for the README: **confidentiality is achievable; anonymity is not; design as if the graph shape is visible.**

## 3. Layer 1 — Confidentiality (decided; grounded in real crypto)

### 3.1 Private files = encrypted content
Bytes are ciphertext; three reserved-key rows carry the mechanics:
- **`contentEncryption`** (PIN, cardinality-1) — marks the file encrypted; the scheme lives folded into the AEAD header so the on-chain tag does not fingerprint the format.
- **`encryptionKey`** (PIN VAL, full-width principal parent) — publishes a principal's algorithm-tagged public encryption key(s), via a **separate KEM/KEX algoTag registry that is NOT the identity signing-key registry** (a red-team catch: reusing one key for signing and encryption couples two failure domains). The earlier ADDRESS-only parent is superseded so digest-shaped born-KEL principals are not excluded.
- **`keyWrap`** (**TAG-only**) — the per-file content key wrapped to each recipient.

Two rulings, both from red-team findings:
1. **Occurrence keys are random by default in the private tier.** The tempting slot key `H(recipientEncKeyId)` is a **public O(1) recipient-confirmation oracle** — anyone could probe "is Bob a recipient of F?". Instead the granter keeps a *local* recipient→key map and recipients trial-decrypt; the addressable form survives only as a public-sharing convenience with the leak named in the row spec. **2026-07-11 refinement (A-3/F-3):** the frozen E5 wording is **"opaque"** — computationally unlinkable to recipient identity by non-holders — with uniformly random as the degenerate case; structured-but-opaque keys (view-tag scan, PRF pairwise mailboxes, the owner self-escrow key) are equally conforming.
2. **Wrap targets must be independent of the identity signing key.** This is the only *catastrophic, non-monotone* coupling in EFS: if wraps targeted your signing key, key theft = **retroactive decryption of your entire archive**. Enforced as a rule.

Wraps are **PQ-hybrid MUST** (HNDL on permanent storage).

### 3.2 Private folders = salted / blinded paths
Normal `tagId = keccak(parent, name, kind)` is a Schelling point — guess the name, derive the node. A **salted TAGDEF** (`DOMAIN_ANCHOR_SALTED`, blinded-name-in-body) breaks that: the tagId derives from a salt only capability-holders know; non-holders see opaque directory entries. Sharing is a **capability in the URL fragment** (Tahoe read-caps — the fragment never reaches a server or the chain). *(2026-07-11, JD-11: raw fragment caps are same-device/air-gapped hand-off only — they leak via clipboard/history/message-store sync; durable shares are wrapped to the recipient's key.)* **HKDF-derived salts are legal**, so a user's own devices re-derive their private tree after device loss with no server. *(Reserved-and-pinned in v2, including the resolver in the gate set — a red-team catch: without that reservation the whole family ships un-addable after freeze — but activation is post-freeze.)* **2026-07-11 ruling (JD-6):** because activation is post-freeze, salted trees are NOT the launch private-folder story — **encrypted dirnodes** (one encrypted DATA whose padded content is the child table) are the launch default, and they leak less (no topology, ~40× fewer records). The salted family remains the reserved addressable/disclosable tier; its derivation math is completed by A-1 (blinded-name pinned, four-pinned) and the frozen family text explicitly does NOT promise subtree bulk-unlock ([[privacy-freeze-reservations]] §A).

### 3.3 Sharing, un-sharing, and the forward-only law
Add a reader = wrap the key to them; remove a reader = **re-key** (re-encrypt, re-wrap to the remaining set). The law, surfaced *at grant time*: **revocation is forward-only — you cannot un-share what was already decrypted.** EFS refuses to pretend otherwise. This is the classic lazy-re-encryption problem; Cryptree and MLS are the reference designs for making the re-key cheap on a tree.

### 3.4 Hard delete = crypto-shredding
Soft-delete only *hides* (revoke placement → EMPTY, bytes persist). The **only** honest "truly gone" on a permanent chain: encrypt, then destroy the key → ciphertext survives as noise. This is EFS's honest right-to-erasure answer, and the main reason the OS personal tier is proposed **private-by-default** ("permanent ≠ public") — a file born encrypted is a file that *can* be shredded. **2026-07-11 ruling (JD-1):** recover-after-total-loss and crypto-shred are mutually exclusive for one key hierarchy — the tier splits into `private-recoverable` (default; phrase/escrow-backed; NOT shreddable) and `private-shreddable` (enclave-bound keys, never escrowed or passphrase-derived; total loss = permanent loss). Shared/team content is recoverable-only, forever.

## 4. Layer 2 — Metadata / graph privacy (the honest limit)

Even with every payload encrypted, the **claim graph is public.** What leaks, and today's mitigation:

| Leak | Today's mitigation | Grade |
|---|---|---|
| Social graph (who wraps to whom) | random occurrence keys; **personas** (unlinked author identities) | convention; partial |
| Ciphertext sizes | padding / bucketed sizes (MUST-level convention) | convention |
| Timing (when writes landed) | `claimedAt=0` rider kept but it is **NOT timing privacy** (`order` carries the author's microsecond clock — ruled 2026-07-11, kill #7); the real lever is per-tier TID coarsening at a supersession cost (JD-22); `admittedAt` is an unfuzzable floor | near-theater (coarsening only) |
| Key-rotation events | visible; no mitigation | unmitigated |
| Co-occurrence (which files cluster under which container) | none — **clusters teams regardless of encryption** | unmitigated |
| Which files you *read* | atime doesn't exist (no on-chain trace); gateway still sees fetches → **P8** OHTTP + chunk normalization + bulk snapshots | partial |

The mitigations are the **responsible floor, not the frontier.** They are honest conventions, not cryptographic guarantees. This is precisely the layer the validation round must attack — and where the cutting-edge techniques in §6 live.

## 5. What the design is actually based on (real prior art — this part is solid)

The **confidentiality** layer is not hand-waving; it stands on respectable, in-some-cases-current work:

| Technique EFS uses | Source | Status |
|---|---|---|
| Capability-based access (read-caps in URL fragments; no ACLs) | **Tahoe-LAFS** (Wilcox-O'Hearn et al., ~2008) — "least-authority filesystem" | foundational, proven at production |
| Hybrid public-key encryption for wraps | **HPKE / RFC 9180**; **age** (Valsorda) | current standard |
| Group key management + cheap re-key on a tree | **MLS / RFC 9420 (TreeKEM)**; **Signal sender keys** — *reference designs only; ruled 2026-07-11: pairwise + team-key ≤50, no MLS/TreeKEM on-chain ever (kill #4)* | current, cutting-edge for messaging |
| Encrypted-folder key hierarchy (lazy re-encryption) | **Cryptree** (Grolimund et al. / Wuala, 2006) | canonical reference |
| Unlinkable authorship (nascent) | **personas** (EFS identity round) — a poor-man's stealth address; *2026-07-11: self-derived stealth fleets blessed as the default (PC-8)* | EFS-native, upgraded by the pass |

**Verdict on Layer 1:** grounded, defensible, would survive a competent cryptographer's review of the *confidentiality* claims. The gap is not here.

## 6. The frontier EFS has NOT yet integrated (this is the "hit it hard" list)

These are the techniques people mean by "cutting-edge blockchain privacy." **None was surveyed or adversarially integrated in the FS pass.** Each gets a first-pass mission-fit read — several fight the mission ends and must be rejected honestly, a few are high-value real integrations:

| Technique | What it would buy EFS | Mission fit (first read) |
|---|---|---|
| **Stealth addresses (ERC-5564 / ERC-6538)** | Unlinkable per-write author addresses → breaks the social-graph leak at the root; composes with personas | **HIGH — likely the single highest-value real integration.** Fits authorship unlinkability without opacifying the graph. Validate first. |
| **Private Information Retrieval (PIR)** — SealPIR, single-server PIR | Read without revealing *what* you read → the strong version of P8 | **RULED 2026-07-11: shelved with a named trigger** (PC-10). OHTTP note: client half only — no operational relay/gateway pair exists or is funded as of 2026-07 (RF-1); PIR needs zero frozen surface. |
| **ZK membership / nullifiers** — Semaphore, Railgun, Aztec (Noir), Aleo, Penumbra, Zcash Orchard | Prove "authorized / a member / this claim exists" without revealing which member or which edge | **LOW–MEDIUM, and in tension.** Full ZK privacy fights verify-don't-trust + hyperlinkable + composable. Narrow use (anonymous membership in a lens, anonymous deny-advisory) may fit; ZK-the-whole-graph does not — that's Zcash-for-files, a different product. |
| **Private Set Intersection (PSI)** | The "am I a recipient" problem has a cryptographic answer beyond random occurrence keys | **RULED 2026-07-11: subsumed** — adds nothing over opaque occurrence keys + high-entropy `encryptionKey` blobs; narrow OPRF home in the share-to-email flow only (PC-13). |
| **FHE / threshold FHE** — Zama fhEVM, Fhenix | Compute lens resolution / membership on encrypted state on-chain | **LOW for v2.** Heavy, immature, and fights on-chain composability's cost model. Watch, don't build. |
| **TEEs / encrypted mempools** — Oasis Sapphire, Secret Network, Flashbots SUAVE | Confidential state / hidden ordering via trusted hardware | **REJECT as core** — trusted-hardware breaks credible neutrality + verify-don't-trust. Optional operator tier at most. |
| **ORAM (oblivious RAM)** | Hide *access patterns* even from the storage layer | **LOW — client/gateway concern**, not protocol. |
| **Mixnets / Nym / Tor** | Network-layer sender anonymity (who fetched from where) | **Out of protocol scope**, but the SDK should document it as the transport-layer answer. |

**The honest synthesis:** the frontier that *fits EFS* is **stealth-address-class authorship unlinkability + PIR-class read privacy** — techniques that reduce metadata leakage *without* making the graph unverifiable. The frontier that *doesn't* fit is **ZK/FHE-everything** — because it would trade away the legible, composable, verify-don't-trust public archive that is the entire point. A validation round's most valuable output is a rigorous ruling on exactly where that line sits.

## 7. Prior art in the wild — Fileverse (the closest live product)

Researched 2026-07-10 from primary sources (github.com/fileverse, blog.fileverse.io, FAQ, iq.wiki; docs render client-side so GitHub/blog were the ground truth). Fileverse is a decentralized document/file collaboration suite (dDocs, Portal, dSheets) on **Gnosis Chain** — the closest shipping mirror of what EFS's OS reaches for, and instructive precisely because it made the **opposite mission choice on permanence** (mutable/deletable by default; permanence is opt-in Arweave). That divergence sharpens every lesson.

**Their architecture in one line:** a per-user/team **Portal smart contract** registers content hashes + access config (never bytes); encrypted blobs live on IPFS (deletable) or Arweave (permanent); real-time collab is **Yjs CRDT deltas, client-side-encrypted, relayed through a stateless self-hostable server that only ever holds ciphertext**.

**What validates our Layer 1 almost point-for-point** (independent convergence, high confidence): client-side E2EE (AES-256-GCM via Transcend's widely-used, open-source *Penumbra* streaming lib — **correction 2026-07-11: no published audit of the lib was located; soften the earlier "audited" claim**); a **per-file symmetric key wrapped into multiple "locks"** (Owner / Portal / Link) — structurally identical to our key-wrap-to-recipients model, and their **Link Lock is our capability-in-URL fragment**; user-held keys (**correction 2026-07-11: the recovery path uses RSA keypairs, not wallet-derived keys**); a shipped **"Walkaway" recovery tool** that decrypts with zero Fileverse infra. Audits by Nethermind / Dedalo / X41 are claimed for the platform; reports not public.

**Where Fileverse looked ahead of us — corrected 2026-07-11: it isn't.** Their `zk-granular-permissions` uses **vOPRF-blinded identifiers + encrypted Merkle membership** to hide *who your collaborators are* on a public chain, today, in production. Their own repo is honest that it still **leaks permission existence and update timing** — and EFS's opaque occurrence keys already close the same recipient-identity oracle. **KILLED FRAMING (2026-07-11, verified from source):** despite the repo name there is **no ZK anywhere in it** — no circuit, no SNARK, no verifier; the mechanism is **vOPRF + Merkle-as-key-derivation + AES**, i.e. OPRF-hardened key distribution. EFS's opaque-occurrence-key + high-entropy-`encryptionKey` design already dominates it on EFS's threat model (PC-9/PC-13 in [[privacy-pass-synthesis]]); the production ZK-membership reference is **Semaphore**, not Fileverse.

**Where they're no better:** deterministic key derivation → no forward secrecy — *which the 2026-07-11 pass ruled structurally impossible on a permanent archive for EFS too (kill #5; EFS claims forward-only re-key + crypto-shred, never "forward secrecy")* — and revocation = "regenerate + re-encrypt everything" (their repo says so). Our opaque occurrence keys + crypto-shred are the better instinct — treat this as confirmation, not a task.

**Transferable — folded into the validation round (§9) and future research (§10):**
1. **The encrypted-CRDT-relay collaboration pattern** — `encrypted_yjs_update` over a stateless, self-hostable, ciphertext-only relay is a *proven, shipping* answer to the FS pass's hardest open question (fine-grained collaboration without a trusted server, without breaking author=signer). Maps directly onto our per-file content keys. **Investigate as the collab-transport story rather than inventing one.**
2. **vOPRF private membership as an opt-in mode** *(corrected 2026-07-11: this is OPRF key distribution, not ZK — see above)* — steal the *technique*, reject it as a *default*. **Ruled:** subsumed by EFS's existing recipient-privacy design; the OPRF variant earns one narrow home, the OS "share to an email/name" flow (PC-13 in [[privacy-pass-synthesis]]).
3. **The "walk-away test" as a named, shipped ritual** — a recovery script + a testable "can you recover everything with only your keys + a public gateway?" gate. Our verify-don't-trust ethos should make this trivial; making it *explicit* is a credibility signal worth copying.
4. **Reuse widely-used, open-source browser crypto** (Penumbra AES-GCM streaming — no published audit located, per the 2026-07-11 correction above; `@noble/*`) for the SDK's client-side encryption hot path rather than hand-rolling — consistent with the SDK-owns-hashing/encryption boundary.

**The anti-lessons:** don't adopt deterministic per-file keys (their documented revocation trap); and borrow **nothing** on the permanence/erasure axis — their design *minimizes* the on-chain footprint that ours deliberately *is*. Their metadata leakage is a threat they fight; ours is inherent-and-intended. Missions diverge cleanly there.

*Open gaps from the research (for the validation round to close): the actual audit reports (only auditor names are public); a formal Fileverse threat model; their exact ECIES curve (likely secp256k1 to match wallet keys — unconfirmed). Full research memo lives in the session record; re-run against their repos before citing specifics in a frozen doc.*

## 8. What "privacy isn't possible on blockchains" gets right and wrong

- **Right:** *Metadata* privacy on a public verifiable ledger is genuinely hard, and naive "just encrypt the payload" designs leak the graph — most on-chain "private" apps are exactly this and the critique lands.
- **Wrong:** *Confidentiality* is easy and solved (encrypt client-side, manage keys with MLS/Cryptree, share with caps) — and *bounded* metadata privacy via stealth addresses + PIR + mixnets is a real, active research frontier, not a dead end.
- **EFS's specific position:** a chunk of EFS's residual leakage is **chosen, not failed** — it is the cost of verify-don't-trust + hyperlinkable + composable. EFS should market **"confidential and honestly-bounded,"** never **"anonymous,"** and should treat the stealth-address/PIR frontier as the roadmap for pushing the bound, not as a prerequisite it's failing to meet.

## 9. Freeze-sensitivity (what's reserved now vs. what the validation round may still move)

Reserved/decided (see [[fs-pass-freeze-reservations]]): `encryptionKey` row (C3), `contentEncryption` (E6), `keyWrap` TAG-only + opaque occurrence keys (E5/C6, as amended by A-3), salted-TAGDEF family fully pinned incl. resolver-gate reservation (D3/D4), PQ-hybrid-wrap MUST, `claimedAt=0` rider, padding/bucket conventions.
**RULED 2026-07-11 — all three hedges adjudicated, two killed:** the **stealth derivation domain** is Durable, NOT freeze-sensitive (client-side EC math; the kernel recomputes nothing — kill-list #2); the **ZK commitment/nullifier row** is REJECTED (ordinary kinds + read-side/sibling-contract verification suffice; the master admission invariant already forbids write-time gating — kill-list #3); the read path demands **no index-shape reservation** (adversarially confirmed). The actual ceremony delta is five row-TEXT amendments (A-1 blinded-name, A-3 "opaque" occurrence keys, A-4 self-escrow property, A-5 the open `encryptionKey` blob — the linchpin that makes stealth meta-addresses and future KEMs post-freeze-addable, A-6 key-privacy sentence) plus the optional stealth announce genesis line (JD-8) and the optional F-2+F-2b pair (JD-36) — see [[privacy-freeze-reservations]].

## 10. The validation round (RUN 2026-07-11 — results in [[privacy-pass-synthesis]])

Run as scoped, plus a metadata adversary, an OS-tier design lane, a law/positioning lane, and a repair round; corpus in [2026-07-11-privacy-pass-corpus/](../../Reviews/2026-07-11-privacy-pass-corpus/). The original scope, kept for the record:
1. **Cryptographer red-team of Layer 1** — the wrap scheme, the KEM/signing separation, the re-key/forward-only claims, PQ-hybrid choice, the salted-TAGDEF derivation — against a competent attacker and against the real prior art (does it actually match HPKE/MLS/Cryptree correctly, or cargo-cult them?). Include a **cross-check against Fileverse's shipped locks/Penumbra stack** — where they diverge from us, one of us is wrong.
2. **Frontier integration study** — drive §6 to ground: rigorous mission-fit rulings on stealth addresses (the likely yes), PIR (the read-privacy upgrade), ZK-membership (the narrow-yes / broad-no line), with freeze-sensitive reservations surfaced. **Use Fileverse's `zk-granular-permissions` (vOPRF + encrypted Merkle membership) as the reference implementation** for the private-membership ruling — it is the frontier item with a live production instance.
3. **Metadata-leak adversary** — a dedicated "deanonymize an EFS user from the public graph alone" red team, to price how bad Layer 2 really is and which mitigations actually move the needle vs. security theater.
4. **The collab-transport study** — evaluate the Fileverse **encrypted-CRDT-relay** pattern (client-side-encrypted Yjs deltas over a stateless ciphertext-only relay) as EFS's live-collaboration transport, composed with per-file content keys; this is where §7 lesson 1 meets the FS pass's multi-writer open questions.
5. **The honest positioning statement** — the exact words EFS uses about privacy, so no one oversells "private" and no one dismisses it as "just encryption."
6. **The walk-away test as a deliverable** — a shipped recovery ritual + the conformance gate (§7 lesson 3).

## 11. Future research — the wider map (beyond the validation round)

Standing research questions worth a dedicated pass *later*, roughly ordered by leverage. Not blocking the freeze; several inform whether a freeze-sensitive slot should be reserved (flagged where so).

**Products/systems to autopsy** (the Fileverse treatment, applied wider):
- **Skiff** (E2EE workspace, acquired/shut by Notion 2024) — the *failure* case: why did E2EE-workspace economics collapse, and what does that say about EFS's no-token sustainability of a private tier?
- **Peergos** — capability-based E2EE filesystem with post-quantum + social login; arguably the closest architectural cousin to our Tahoe-caps + PQ-wrap design. High-value autopsy.
- **Cryptee, Standard Notes, Proton Drive** — mature consumer E2EE; key-management UX and recovery (what real users survive).
- **Iron Fish, Aztec, Aleo, Penumbra, Railgun, Zcash (Orchard)** — the ZK-privacy chains; what their *shielded pool* model teaches about the narrow-yes/broad-no line, and why "shield everything" is the wrong shape for a legible archive.
- **Nym, HOPR** — mixnet transport privacy for the read path (network-layer, SDK-documented, likely out of protocol).
- **Signal (sealed sender), MLS deployments (Wire, Matrix MIMI)** — metadata-minimization *at scale* in messaging; sealed-sender is a direct analog to authorship unlinkability.
- **Ceramic/OrbitDB/Fluence** — decentralized-data prior art on the mutable side; contrast for what permanence buys and costs.

**Techniques to drive to a build-or-reject ruling:**
- **Stealth addresses (ERC-5564/6538)** for authorship unlinkability — **RULED 2026-07-11: validated, and NOT freeze-sensitive** (the derivation domain is Durable — kill #2; the meta-address rides the open `encryptionKey` blob, A-5); self-derived fleets blessed as the default; the only ceremony remnant is the optional announce-feed genesis line (JD-8). See PC-8.
- **vOPRF private membership** — **RULED 2026-07-11: subsumed** by the existing recipient-privacy design (PC-13), with a narrow home in the OS share-to-email/name flow; **no commitment/nullifier reservation** (killed — kill #3); and not "Fileverse-proven ZK" (their repo contains no ZK).
- **Single-server PIR / OHTTP** for read-path privacy — measure the real cost curve; OHTTP ships now, cryptographic PIR is the upgrade.
- **Private Set Intersection** against the keyWrap recipient-oracle specifically — **RULED 2026-07-11: adds nothing** (PC-13; the oracle is already closed by construction).
- **Structured encryption / encrypted search indexes** — can lens/tag queries run over encrypted metadata without an FHE hammer? (searchable-symmetric-encryption literature.)
- **Anti-correlation at write time** — timing decorrelation (batch/delay), dummy-write cover traffic, size-bucket padding as *protocol convention* vs client-only. How much does it actually buy? (this is the "security theater vs real" audit.)

**Deeper open questions:**
- **The persona-link visibility question** — should the "these addresses are me" record be public, private, or blinded by default? **RULED 2026-07-11 (C-H/PC-8):** public personas use the D2 rows; private fleet links are encrypted CONTENT, never claims (a private persona-link row is rejected — a slot keyed on the primary would leak persona existence/count). Not freeze-adjacent.
- **Coercion / plausible deniability** — is a deniable-blinded-path tier worth designing, or explicitly out of scope? (rubber-hose threat.)
- **The regulatory reality of on-chain privacy** — Tornado Cash sanctions, mixer liability, the operator-liability note; what a credibly-neutral permanent archive can offer without becoming a sanctions target.
- **Sustainability of a private tier with no token** — who pays to keep encrypted archival bytes alive; the Skiff lesson.

## Open questions

- [x] ~~Greenlight the validation round~~ — RUN 2026-07-11; rulings in [[privacy-pass-synthesis]].
- [x] ~~Reserve a stealth derivation domain + meta-address row?~~ — DISSOLVED: neither is freeze-sensitive (§9 as ruled); the only live remnant is the optional announce-feed genesis line, now **JD-8** in [[privacy-james-decisions]].
- [ ] The dual-posture ratification (public archive public-by-default; OS tier private-by-default) — still James decision 4 in [[fs-pass-james-decisions]]; the tier itself now splits per JD-1.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] Validation round run; Layer 1 cryptographer-reviewed; the §6 line ruled
- [ ] At least one round of `#status/review` with another agent or human comment
