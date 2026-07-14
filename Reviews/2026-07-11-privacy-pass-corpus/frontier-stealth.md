# Stealth addresses for EFS v2 — deep pass and RESERVE ruling

**Lane:** frontier-stealth (2026-07-11 deep privacy pass)
**Charge:** build-grade RESERVE vs REJECT ruling on ERC-5564/6538-class stealth addresses, with the exact minimal freeze reservation set.
**Ground truth read in full:** privacy.md, fs-pass-freeze-reservations.md, identity.md, codex-kinds.md, codex-envelope.md, attack-privacy.md, read-lens-spec.md §§1–3.
**Date-stamp:** all ecosystem-state claims are as of 2026-07-11.

---

## 0. The ruling in one paragraph

**RESERVE — confirmed, but with a smaller and different set than privacy.md §9 assumed.** Stealth authorship needs **zero kernel change** (verified against codex-envelope §Adopted-core: the recovered signer is the author, msg.sender is ignored, any address-shaped secp256k1 signer is admissible — a stealth address *is* one). The **derivation-domain constant that privacy.md flagged as now-or-never is not freeze-sensitive at all** — the kernel never recomputes stealth derivation, so it is a Durable SDK/registry spec (overturned with the adversarial check in §C-R4). What *is* now-or-never is exactly two rows: (1) a **`stealthMeta` reserved-key PIN row** on the identity (the portable, replicable, algo-agile replacement for ERC-6538), and (2) a **genesis `/.well-known/stealth/announce` TAGDEF** (the canonical announcement feed anchor — genesis well-known membership is ceremony-frozen per fs-pass E12), plus a **stealth schemeTag registry family** minted in the same ceremony batch as the C3 KEM registry. Everything else — derivation spec, view-tag encoding versioning, scanning, relayer conventions, fleet key management, ZK set-membership, private fleet maps — is post-freeze addable and is shown to be so item by item. The one big strategic finding: **EFS is structurally a *better* home for stealth addresses than payments are**, because the classic stealth deanonymizer (the gas/funding/withdrawal trail — the thing that let researchers deanonymize 48.5% of Umbra mainnet payments) mostly does not exist for signed-record authorship; and the one big honesty finding: **announced (sender→recipient) stealth linkage is quantum-retro-linkable on a permanent archive** — it is time-locked pseudonymity with a CRQC shelf life, and must be sold as exactly that, while **self-derived fleets put no DH material on chain and are not retro-linkable, only forgeable like every other secp256k1 author**.

---

# Part A — Research (primary sources)

## A1. ERC-5564: the mechanics (VERIFIED — EIP text read)

Source: https://eips.ethereum.org/EIPS/eip-5564 — **status Final.**

- **Meta-address:** `st:eth:0x<spendingPubKey><viewingPubKey>` — dual-key (spend + view) or single-key degenerate form. The dual-key split is the load-bearing UX feature: the **viewing key can detect all your stealth addresses but cannot spend from them** (Vitalik's guide makes the same point: delegate scanning to a semi-trusted machine without giving it spend power).
- **Derivation (schemeId 1, SECP256k1 + view tags):** sender picks ephemeral key `p_e`; shared secret `s = p_e · P_view`; `s_h = h(s)`; **`P_stealth = P_spend + s_h·G`**; stealth address = `addr(P_stealth)`. Recipient recomputes `s = p_view · P_e` from the announced ephemeral pubkey. Stealth private key **`p_stealth = p_spend + s_h`**.
- **Announcement:** a singleton announcer contract (deployed deterministically at `0x5564…5564`) emits `Announcement(schemeId indexed, stealthAddress indexed, caller indexed, ephemeralPubKey, metadata)`. **First metadata byte MUST be the view tag** = first byte of `s_h`.
- **View-tag economics (VERIFIED from EIP text):** without the tag, a scan costs ~"2× ecMUL, 2× HASH, 1× ecADD" per announcement; the 1-byte tag lets the recipient stop after 1 ecMUL + 1 hash for 255/256 announcements → **~6× speedup**; false-positive rate 1/256, so full derivation runs on ~N/256 of N announcements. The EIP notes the tag reduces the scheme's privacy security margin "from 128 bits to 124 bits" (privacy, not theft, margin).
- **The gas-funding hole (VERIFIED from EIP text):** the EIP itself says the funding wallet "MUST NOT have any physical connection to the stealth address owner" — i.e. the standard *documents* the deanonymizer rather than solving it. Vitalik's guide (https://vitalik.eth.limo/general/2023/01/20/stealth.html) treats fee payment as the central open problem and offers only expensive answers: ZK-SNARK fee transfers ("hundreds of thousands of gas") or Chaumian-blinded fee-ticket aggregators. **Hold this — it is the exact hole EFS's relay model closes (§B2).**
- The EIP explicitly scopes beyond money: ENS names, POAPs, NFTs, soulbound tokens — "not just money and financial transactions" (Vitalik's guide). Authorship-of-records is a natural extension of the same shape.

## A2. ERC-6538: the meta-address registry (VERIFIED — EIP text read)

Source: https://eips.ethereum.org/EIPS/eip-6538 — **status Final.**

- Singleton at `0x6538…6538` (CREATE2 via the deterministic deployer): `mapping(registrant => mapping(schemeId => bytes)) stealthMetaAddressOf`; `registerKeys` (direct) and `registerKeysOnBehalf` (EIP-712 signature or **ERC-1271 contract signature**, per-registrant nonce).
- **Why it is anti-portable for EFS even though the *contract address* is portable:** CREATE2 gives the same address on every chain, but the **state is per-chain** — a mainnet registration does not exist on an L2 or a future chain; keeping a fleet's meta-address live everywhere costs a transaction per chain per update. EFS records replicate anywhere by anyone. And its signature path leans on ERC-1271, which EFS has banned from authorship forever (identity.md: "No ERC-1271 anywhere, ever"). An EFS-native reserved PIN row is strictly better on every mission axis (§B4).

## A3. Production state, mid-2026 (mixed VERIFIED/PLAUSIBLE)

- **Umbra (ScopeLift)** — the longest-running deployment (~70,000 registered recipients as of July 2023, VERIFIED from the anonymity paper, §A4). In 2026 ScopeLift still develops stealth tooling (stablecoin-payment focus per their 2025-in-review post, https://scopelift.co/blog/umbra-2025-in-review-and-the-year-ahead), **but Umbra took its hosted frontend offline in 2026** after ~$800k connected to the KelpDAO exploit (attributed to Lazarus) was routed through the protocol; contracts remain live and permissionless (multiple news sources, e.g. https://crypto.news/umbra-shuts-front-end-after-hackers-move-stolen-funds-through-protocol/ — PLAUSIBLE, news-sourced). **Lesson for EFS:** privacy front-ends are liability magnets; EFS's stealth machinery should live in the SDK + neutral protocol rows, with no EFS-operated "privacy service" to take down. This is the Tornado-Cash-shaped operator-liability lesson applied to stealth, and it *favors* the records-not-contracts design.
- **Fluidkey** — the most production-polished implementation (Base, Optimism, Arbitrum, Polygon, Gnosis, mainnet). Two design facts matter (VERIFIED from https://docs.fluidkey.com/technical-documentation/technical-walkthrough/):
  1. **It sidesteps scanning entirely.** Users derive keys from a wallet signature, then share a BIP-32 node of the *viewing* key (`m/5564'/0'`) with Fluidkey's server, which generates addresses and watches them. The flagship stealth product decided client-side scanning was bad enough UX to centralize it. EFS's self-fleet design (§B3-i) reaches the same UX **without the server**, because for your own fleet you can derive rather than scan.
  2. **Its stealth accounts are 1/1 Safes** (smart accounts) for gas-sponsorship UX. **These can never author EFS records** (ERC-1271 ban); only bare stealth EOAs can. EFS stealth is bare-EOA stealth by construction — which is fine, since EFS relaying removes the reason Fluidkey needed smart accounts (gas sponsorship).
- **Ecosystem tailwind (PLAUSIBLE, news-sourced):** the Ethereum Foundation's 2025/2026 privacy push (PSE "Privacy Stewards of Ethereum") has an end-to-end roadmap naming stealth addresses and the Kohaku wallet effort among private-writes workstreams (https://www.theblock.co/post/370532/…); 2026 roadmap coverage forecasts private transfers effectively "solved" by Devcon (Nov 2026), citing "35+ teams, ~13 approaches". A Feb 2026 developer write-up of native ERC-5564 rollout got wide coverage. **Direction of travel: wallet-level stealth support is arriving, which grows the tooling EFS can reuse and the population that has meta-addresses at all.** James's prior "I expect Ethereum itself to be private in the future" is consistent with what the EF is actually funding.
- **Could not verify:** current ERC-6538 registration counts (no public dashboard found); which wallets ship native 5564 scanning today.

## A4. The known attacks: what actually deanonymized stealth users (VERIFIED — paper PDF read)

Kovács & Seres, *Anonymity Analysis of the Umbra Stealth Address Scheme on Ethereum* (https://arxiv.org/abs/2308.01703): real recipients found for **48.5% (mainnet), 25.8% (Polygon), 65.7% (Arbitrum), 52.6% (Optimism)** of all Umbra payments. The four heuristics, verbatim from the paper's §6:

| # | Heuristic | What it exploits |
|---|---|---|
| 6.1 | **Registrant address reuse** | recipient withdraws the stealth funds *to the very address they registered in the stealth registry* |
| 6.2 | **Same sender and receiver** | withdrawal goes back to the payment's sender (testing/self-pay) |
| 6.3 | **Collector pattern** | many stealth addresses all withdraw to one collection address → clustered |
| 6.4 | **Unique `maxPriorityFeePerGas`** | withdrawal transactions share a "unique" fee-parameter fingerprint → linked across stealth addresses |

Countermeasures (paper §7.5): never reuse addresses, never withdraw to a registrant address — i.e. *the crypto held; the users' spending behavior leaked.* **Every one of the four heuristics attacks the withdrawal/spend side.** EFS records have no withdrawal side — but §B7 maps each heuristic to its EFS behavioral analogue (relayer choice, submitter clustering, timing, co-occurrence), because the lesson "behavior, not math, deanonymizes" transfers fully.

## A5. Post-quantum stealth (VERIFIED — paper PDF read)

Mikić, Srbakoski, Praška, *Post-Quantum Stealth Address Protocols* (arXiv:2501.13733, Jan 2025; journal-published Jan 2026): three lattice SAPs (LWE, Ring-LWE, **Module-LWE built on Kyber/ML-KEM**). Findings that matter for EFS:

- **PQ stealth is real and fast**: Module-LWE SAP scans ~66.8% *faster* than the best elliptic-curve SAP (ECPDKSAP/"Curvy") at 80k announcements; Kyber768 scan of 5,000 announcements ≈ 141 ms on an M2 laptop. View tags work in the lattice setting too — and can even be the *full* hash(S) without weakening security there; the paper still recommends 1 byte (the full-hash gain is 0.7% for much more storage).
- **The catch, stated by the authors themselves:** "the ML-WE SAP is not Ethereum-friendly and its implementation therefore requires Ethereum to become a PQ blockchain." A lattice-derived stealth *address* is not a secp256k1 EOA — it cannot ecrecover-sign. **For EFS this means PQ stealth authorship rides identity.md's exact five-conjunct PQ stack (KEL + NIST-final scheme + EVM verifier + minted algoTag + actual rotation, ~2030)** — it is not a stealth-specific gap, and nothing stealth-specific can be done about it now except algo-agility in the reserved shapes (§C R1/R3).
- On-chain size honesty (PLAUSIBLE from FIPS-203 parameter recall, not re-derived from the paper): ML-KEM-768 ephemeral material is ~1.1–1.2 KB per announcement vs 33 bytes compressed secp256k1 — a future PQ announcement is ~30× the calldata. Fits fine in a VAL body (≤8192), so the reserved announcement shape must not hard-pin a 33-byte ephemeral field (§C R2 pins a scheme-tagged variable-length encoding for exactly this reason).

---

# Part B — The EFS integration deep pass

## B1. Admission: zero kernel change — VERIFIED, and the verification shown

From codex-envelope §Adopted-core (read in full):

- The signed artifact is `Envelope(bytes32 author, uint64 order, bytes32 prev, bytes32 recordsRoot, uint32 count)` under constant chain-free domain `("EFS","1")`. The kernel checks `recovered == author`; v1 additionally requires an **address-shaped nonzero author**. Signature scheme 0x01 = 65-byte canonical low-S secp256k1.
- A stealth address derived per ERC-5564 scheme 1 is `addr(P_spend + s_h·G)` — an ordinary secp256k1 point → an ordinary 160-bit address-shaped word. Its holder signs envelopes exactly like any EOA. **No admission rule can distinguish a stealth author from a fresh wallet, by construction.**
- `msg.sender` is ignored everywhere in admission; anyone can relay; revocation effectiveness is `revoker == claim.author`, which the stealth key satisfies for its own records. Slots are per-author `(author, key)` — a fleet partitions its slot space cleanly, no collisions with the primary.
- The only kernel-adjacent touchpoints a fleet has are the ordinary ones: per-author `order` sequences, per-author `prev` chains, per-author checkpoints (if cross-venue currency is wanted), per-record admission gas.

**Ruling B1: stealth authorship is admissible in v2 as designed, with zero kernel change, zero new admission surface, zero new signature scheme.** Anything in this file that is "reserved" is reserved for *discovery and interop*, never for admission.

## B2. The funding-linkage synergy — does relayer submission close the hole?

**The payments problem (A1/A4):** a stealth payment recipient must eventually *transact from* the stealth address, which needs gas, whose source links them — and all four production deanonymization heuristics live on that spend side.

**The EFS situation:** an EFS author never transacts. Authorship is a signature over an envelope; *submission* is a separate act by whoever pays gas. So the stealth author needs no funds, ever — including for REVOKEs and for EFSBytes uploads (the submitter funds those too).

**Ruling B2a: the *cryptographic* funding-linkage hole is closed; a *behavioral* submission-linkage channel replaces it, and it is materially weaker but not zero.** Priced honestly:

1. **The submitter is permanently on-chain.** The kernel ignores `msg.sender`, but the chain archives it. If a user self-submits stealth envelopes from their known funded wallet, the linkage is public, permanent, and worse than the payments case (it is right there in `tx.from`, no heuristics needed). **Doctrine (MUST-level SDK convention): stealth-authored envelopes are never submitted by a wallet linkable to the owner.** The submission options, best to worst:
   - **Shared relayer / aggregator** (the OS gasless path — note the hackathon gasless faucet-drip is already the only must-have; the same channel is the natural stealth submitter). On-chain, the submitter is the relayer; the observer's anonymity set = all of that relayer's users.
   - **Per-user unlinked gas wallet** funded via an exchange/bridge hop — recreates the payments-grade funding trail; allowed but discouraged.
   - **Self-submission — forbidden** for stealth envelopes by SDK default.
2. **What the relayer itself learns:** envelope contents (public anyway), the submitter-side network identity (IP, session), **timing**, and — the sharpest item — **fleet co-membership**: envelopes for stealth authors S1…Sn arriving over one connection/API key are linkable *by the relayer* even though nothing on-chain links them. Mitigations, each real but partial: OHTTP/Tor to the relayer (this is exactly privacy.md's P8 transport posture — same answer, same limits); multiple independent relayers per fleet; client-side submission-time jitter. A relayer that logs is a subpoena target; a relayer that doesn't is a promise. **Say plainly: the relayer is the new trust locus. EFS converts "the chain proves your linkage forever" into "one operator might know it and the chain shows only relayer→kernel" — a large, honest improvement, not anonymity.**
3. **Batching discipline (new finding):** a submitter transaction that carries several envelopes creates *same-transaction co-occurrence*, permanently archived. A relayer that batches one user's fleet into one transaction has published the fleet linkage on-chain forever. **Convention: relayers MUST batch across users, never within a user's fleet** (or one envelope per transaction). This belongs next to the padding/claimedAt riders in the convention set (§C R9).
4. **Note on a stale prior:** the v1-era memory "no shared relayer — lenses key on the attester" dissolves in v2: the attester *is* the recovered signer, not msg.sender, so relaying no longer launders authorship. The old constraint should not be carried forward by habit.

**Ruling B2b:** the relayer answer also **de-fangs the ERC-5564 DoS note** (spam announcements externalize scan cost): EFS announcements cost real admission gas (~22–27k+, §B4), which is a stronger anti-spam economics than a bare event, and scanning is skippable entirely for self-fleets (§B3-i).

## B3. The lens tension — where stealth-authored content actually works

Lenses are ordered trusted-AUTHOR lists; first-attester-wins; a resolver never falls through UNKNOWN (read-lens-spec §2.1/§3.1). A fresh stealth author is in nobody's lens: to every normal reader, its records are **invisible in path resolution and untrusted (DISCOVERY-flagged at best) in enumeration**. This is not a bug to fix — it is the trust model doing its job. The four compositions, priced:

### (i) Private-tier self-fleet (lens = self) — **BLESS; this is the v2 core case**

Your own fleet writing your own private tree. Key insight the payments framing hides: **for a self-fleet you need no announcements and no scanning at all.** ERC-5564's non-interactive derivation exists so a *sender* can derive an address for a *recipient* they can't talk to. When owner = sender = recipient, deterministic derivation from your own seed (HKDF/BIP-32-hardened child keys) replaces the whole announcement apparatus — the same doctrine that already lets salted-TAGDEF trees re-derive after device loss ("HKDF-derived salts are legal", fs-pass D3). The client keeps (or re-derives) a local fleet map; each private subtree is authored by one fleet member; the per-subtree lens is that one author; reads are O(1) per key with the local map. Third parties see: unlinked fresh authors, each indistinguishable from any new EFS user — **the anonymity set of a clean self-fleet author is "all EFS authors," not "all registered stealth users."** This is strictly stronger than announced stealth and costs nothing reserved. Residuals: relayer/timing/co-occurrence channels (§B2, §B7) and content itself.

### (ii) Private persona-link records / disclosed-fleet lenses — **BLESS as the collaboration mechanism**

For collaborators who must *trust* your stealth-authored writes without the world linking them: disclose the fleet selectively. Mechanism: the fleet map is an ordinary **encrypted DATA file in your private tree** (rides D3/D4 salted paths + E5 keyWrap + E6 contentEncryption — zero new rows), shared by capability or wrapped to the collaborator's `encryptionKey`. The collaborator's client extends *their* lens with your disclosed fleet; your writes in the shared workspace resolve as trusted for them; public observers see unlinked authors. Two honesty riders:
- **Disclosure is forever** (the forward-only law's stealth analogue): a disclosee can retain and later prove the linkage — and if the fleet map is a signed record, the proof is cryptographic, not hearsay. Surface at disclosure time, like the re-key law is surfaced at grant time.
- **Do NOT mint a dedicated "private persona-link" reserved row.** A slot keyed on the primary — even with an encrypted body — publicly announces "this primary has N hidden personas" (the existence-leak twin of attack-privacy A1's occurrence-key oracle; same lesson, applied to ourselves). The D2 public persona rows stay public-personas-only; the private fleet map lives as content, not as claims. **REJECT recorded in §C R5.**

### (iii) ZK "author in trusted set" — the only path to *public* trust without linkage; interface stated, design deferred to the ZK lane

What it buys: a reader's resolver accepts a record because it carries a proof "author ∈ committed set of meta-addresses/authors" without learning which. What the stealth lane needs from the ZK lane (interface, not circuit):
1. **Statement shape:** for claimId C with author A (public inputs: C, A, set commitment M, announced ephemeral pubkey if announcement-based): prover knows `(P_spend, P_view) ∈ M` and `s_h` s.t. `A = addr(P_spend + s_h·G)` and `s_h = h(p_view·P_e)`. secp256k1 in-circuit + Merkle membership — prior art exists (PSE spartan-ecdsa / zk-attestation lineage — PLAUSIBLE, not re-verified this pass).
2. **Proof carriage:** an ordinary record (VAL ≤ 8192 bytes fits any Groth16/PLONK proof) citing C — a convention, not a row; claimId is content-addressed (P4) so the binding is clean.
3. **Grade semantics:** a new composite like `LIVE (author-proven-in-set)`. The grade vocabulary is **closed for v2 but Durable** — "extension is by Codex/spec revision only" (read-lens-spec §2) and the spec is explicitly "not Etched kernel surface." **So no ceremony reservation is needed for the grade** — the ZK lane should NOT ask for one.
4. **Set commitment source:** lens LISTs already exist; the commitment can be computed off-chain from any LIST of meta-addresses; an on-chain verifier (for contract consumers) is a new *deployable* contract reading frozen kernel state — post-freeze addable by anyone.

**Ruling: nothing here is freeze-sensitive; the composition is deferred to the ZK lane with this interface.** Until it ships, stealth content is trusted only via (i), (ii), (iv).

### (iv) Publish-then-claim-later — **BLESS as a convention; already fully expressible**

Write under a stealth author now; later publish the bidirectional link (primary TAGs persona per D2; persona PINs primary) — both signatures required, exactly the successor-pair discipline. The records were always validly signed; the claim upgrades their lens standing retroactively; `admittedAt` timestamps the embargo period with cryptographic force. Uses: embargoed journalism, sealed authorship, whistleblowing-with-later-attribution. Rider from attack-privacy V2, transferred: **a compelled claim-later is self-authenticating evidence against the author** — the disclosure records prove "you wrote this, then, there" more strongly than plaintext authorship would have. Document with the salt-compulsion caveat, same register.

### What EFS REJECTS

- **Stealth authors in public lenses without disclosure or proof** — impossible by construction (a lens is a trust statement about a known author); no kernel accommodation, no "trust unattributed content" grade, ever. The UNKNOWN/DISCOVERY treatment of un-lensed stealth content is correct and stands.
- **Any admission-time accommodation** (e.g. "stealth records get a grace visibility") — violates credible neutrality and the master confluence invariant; never proposed seriously; recorded so silence doesn't decide.

## B4. Registry + announcements, EFS-native

### The meta-address row (replaces ERC-6538)

**`stealthMeta`** — reserved-key **PIN, VAL layout, ADDRESS-parent, cardinality-1**, exactly the C3 `encryptionKey` pattern: value = multi-entry blob of `(stealthSchemeTag, meta-address bytes)` entries. One signed record; replicable by anyone to every chain; readable by contracts on any chain that carries it; supersessions rotate it; the KEL (when it ships) backs it additively like every ADDRESS-parent row. Compared head-to-head with ERC-6538: no per-chain registration transactions, no ERC-1271 dependence, no chain-bound state, one canonical Schelling point per identity — **the registry is the one place the EFS-native design is unambiguously superior to the deployed standard.** Scheme agility comes from the schemeTag registry (below), so a future ML-KEM meta-address is a new blob entry, not a new row.

- **Correctness-row argument (why ROW, not convention):** same class as C3 — a wallet that must *find* a counterparty's meta-address without configuration needs a canonical location; a misencoded or mislocated meta-address means a sender derives an author the recipient can never find or control — silent loss, the mis-encryption failure class. A post-freeze user-domain convention is *mechanically* possible (honest note in §C R1) but forfeits canonicality exactly where the whole feature is a Schelling point.
- **ERC-6538 interop:** optional SDK bridge (mirror your EFS meta-address into ERC-6538 on chains where you want payment-stealth interop). EFS-canonical, ERC-mirrored — never the reverse.

### The announcement feed

Announcements exist **only** for the counterparty-initiated flows — collaboration invites (Alice derives an author for Bob: a workspace membership Bob controls but nobody links to him), sender-private grants, stealth `act` delegations. Self-fleets skip them (§B3-i). Design:

- **Anchor:** genesis TAGDEF **`/.well-known/stealth/announce`** (one manifest line). Announcements are ordinary **TAG claims with `definitionId` = that tagId, VAL layout, random occurrence keys (MUST — an addressable occurrence key would be a recipient oracle, attack-privacy A1's lesson)**. Body encoding (Durable, registry-versioned with golden vectors): `stealthSchemeTag ‖ viewTag(1 byte) ‖ ephemeralPubKey(len per scheme) ‖ stealthAddress(20) ‖ optional app bytes`. Scheme-tagged variable-length so ML-KEM-sized ephemerals fit later (§A5).
- **Why genesis and not a post-freeze convention TAGDEF:** the mechanics work under any TAGDEF anywhere — but the *anonymity set* requires one feed everyone scans. Fragmented per-app feeds partition recipients into small scannable buckets and advertise which app family you use. Genesis `efs.well-known` membership is **ceremony-frozen** (fs-pass E12), so the single canonical anchor is now-or-never. This is the strongest now-or-never item in the whole lane.
- **Enumeration path:** container/tagId-scoped discovery (P12) or target-keyed postings (B3/R1) make the feed cheaply enumerable + paginated; **if both were refused, scanning degrades to indexer-lane or spine scan — workable (allClaims(i) always exists) but ugly.** Dependency flagged for the ceremony sheet; not a new ask, just a rider on decisions already before James.
- **Cost honesty:** an EFS announcement is a record admission (~22–27k gas + envelope amortization) vs ~2–5k (PLAUSIBLE estimate) for a bare ERC-5564 event — roughly 5–10×. It buys permanence, replication to every chain, and verify-don't-trust enumeration. Announcements are per-relationship-start, not per-write, so the cost is rare; acceptable.
- **Sender linkage:** the announcement's *author* is visible. An announcer who cares signs the announcement itself with a throwaway (relayed — §B2 turtles compose fine). The ERC-5564 `caller`-indexed field has the same property; nothing new leaks.

### The anonymity-set problem, priced honestly

Publishing a meta-address is a public "I can receive stealth" flag. If ~500 EFS users mint it, an announcement's recipient candidate set is ≤ those 500 — before auxiliary information (who collaborates with the announcer, timing vs a candidate's public activity, subsequent behavior) shrinks it much further; Umbra's 70k-user registry still yielded 48.5% deanonymization *from behavior alone* (§A4). Three honest statements:

1. **Self-fleet privacy does not depend on this set at all** — its set is "all EFS authors" (§B3-i). The small-set problem afflicts only announced, counterparty-initiated stealth.
2. **What actually grows the set: default-on.** Mint `stealthMeta` for every OS-tier user at onboarding, in the same breath as `encryptionKey` (one extra PIN, ~25k gas, one-time). Then holding the row signals nothing, and the candidate set becomes "all OS users." This is the single highest-leverage lever and it is an OS-tier product decision (James decision 2).
3. **Even then, announced-stealth anonymity is bounded** by timing + relationship priors — an announcement admitted the day Alice's project spins up, scanned against Alice's known collaborators, is weak pseudonymity. Never market it above that.

## B5. Identity interactions and key management

Each stealth address is a bare-EOA identity in the full identity.md sense: no KEL, no succession, only that key revokes its records, permanent-lockout on loss, same-key-war on theft.

- **Derivation: from the master, hardened — not random.** A fleet of hundreds of random keys is a backup catastrophe (lose the map, lose revocation rights over your own archive forever — LOSS row, fleet edition). Deterministic hardened derivation (HKDF from a fleet seed; per-persona/per-container paths) makes the whole fleet re-derivable after device loss — the P9/D3 recovery doctrine extended from salts to keys. Two footguns, both real:
  1. **Non-hardened/xpub derivation is a linkage oracle** — anyone holding the xpub derives every fleet *public* key → total retro-linkage. Hardened-only; never export a fleet xpub. (This is also why the fleet seed, not ERC-5564 sender-derivation, is the self-fleet mechanism.)
  2. **The ERC-5564 additive-key trap (for announced stealth):** `p_stealth = p_spend + s_h` means **one leaked stealth private key + the corresponding `s_h` (computable by anyone holding the view key) reveals the master spend key**. Whoever runs delegated scanning holds view keys (Fluidkey's whole model, §A3) — so a single hot-device stealth-key leak plus a scanning service equals master compromise. SDK rules: derived announced-stealth keys are sign-and-discard or immediately re-escrowed; the spend master lives at primary-custody tier; identity.md's "owner-key theft is fleet-wide" note now covers the fleet seed too.
- **Coupling-rule check (the one catastrophic law):** KEY-WRAP TARGETS MUST BE INDEPENDENT OF THE IDENTITY SIGNING KEY — deriving fleet *signing* keys from a master *signing* seed does not violate it (encryption keys stay in their own registry/derivation family; per-persona `encryptionKey` per attack-privacy V3). Theft of the fleet seed is forward-capture of the fleet (monotone, like all EFS key theft), not retroactive decryption. Verified consistent.
- **Multi-device (James's desktop + phone):** with the dual-key split: **share the view key (or a scanning node of it, Fluidkey-style `m/5564'/…`) across devices → both scan/see the fleet.** Spending (signing new records / revoking) requires the spend material: either (a) sync the fleet spend seed to both devices (both can author everywhere; custody bar = fleet-wide), or (b) per-device fleets + cross-wrap: each derived stealth key is escrowed to the *other* device's `encryptionKey` via ordinary keyWrap TAGs (E5's reserved self-occurrence-key escrow already anticipates exactly this). (b) is the recommended default: device loss costs nothing, device theft compromises one device's fleet only. Records authored by desktop-fleet keys remain revocable from the phone under (b) once escrow-unwrapped. All of this is convention on existing rows — nothing reserved.
- **Fleet-scale read/currency costs, priced:** per-author checkpoints mean cross-venue AS-OF currency for a 500-author fleet costs 500 checkpoint claims — do not checkpoint private fleets (home-live reads don't need it; private content has no cross-venue consumers). Self-reads are O(1) with the local map (§B3-i). Public enumeration of a fleet's containers is exactly as expensive as for any 500 strangers — which is the point.

## B6. PQ / HNDL honesty — the shelf life, stated plainly

- **Announced stealth linkage is harvest-now-decrypt-later material.** The link between an announcement and a meta-address is one secp256k1 ECDH away: a CRQC computes `s = p_e·P_view` from the *archived* ephemeral pubkey and the *archived* view pubkey (both permanently public in EFS), recomputes every stealth address, and **retro-links every announced stealth author to its meta-address, for the whole history of the feed, all at once.** On a 100-year archive the honest planning assumption is: *announced-stealth pseudonymity expires at CRQC arrival (working horizon: the identity doc's ~2030 NIST deprecation clock), and everything before that becomes public then.* This must be surfaced at meta-address mint / invite time the way the forward-only re-key law is surfaced at grant time. Never call announced stealth "anonymous"; call it **time-locked pseudonymity**.
- **Self-derived fleets have no such cliff.** No DH material touches the chain; linkage exists only in the owner's seed. A CRQC can forge any secp256k1 author (the archive-wide ~2030 problem identity.md already owns) but cannot *link* a clean self-fleet retroactively. **This asymmetry is a design-pressure argument: prefer self-derivation everywhere possible; reserve announcements for genuinely non-interactive counterparty flows.**
- **PQ stealth constructions exist and even scan faster than EC (§A5), but a lattice stealth author cannot sign EFS envelopes until the PQ authorship stack lands** (five conjuncts, ~2030, EF-dependent). What v2 can do now is exactly what it should: scheme-tagged meta-address blob + scheme-tagged announcement encoding (§C R1/R2/R3), so ML-KEM entries mint as registry additions, not surgery. A *hybrid* interim (EC-derived author + ML-KEM-wrapped announcement payload) protects announcement *content* but NOT the address-derivation linkage — do not sell it as PQ stealth; recorded to prevent security theater.

## B7. What stealth does NOT fix (scope-creep guard)

| Leak | Status under stealth | Owner |
|---|---|---|
| Ciphertext sizes | untouched — padding/bucket conventions still MUST | F9 conventions |
| Timing | `admittedAt` inherent; announcement time ≈ relationship start time | claimedAt=0 rider; accept |
| **Co-occurrence under a shared container** | **untouched and load-bearing**: a stealth author writing into a shared workspace is permanently a member of that workspace's cluster; stealth hides *who*, never *that someone* | accepted (the chosen leak) |
| Delegation/grant edges | an `act` grant from Alice to stealth-Bob publicly ties the stealth author to Alice's team — membership hiding, not relationship hiding, is the actual gain | doctrine text |
| Device-bit fingerprints | the 10-bit TID clockId is a cross-fleet fingerprint if stable — extend L2b: randomize device bits per stealth author | convention amendment (§C R9) |
| Same-tx envelope batching | relayer batching within a fleet publishes the linkage forever | convention (§C R9, from §B2-3) |
| Content/stylometry, read-path privacy, network observer | out of scope — P8/mixnets/PIR lanes | other lanes |

Stealth is authorship unlinkability, full stop. The graph stays visible; EFS stays "confidential and honestly-bounded," never "anonymous."

---

# Part C — What shipping stealth in 2028 requires, and the sufficiency test

The written requirements list, each mapped to reserved-now or post-freeze-addable:

| # | Shipping requirement (2028) | Reserved now? | Post-freeze addable? |
|---|---|---|---|
| 1 | Publish/rotate a meta-address any wallet can find | **R1 row** | degraded convention only (loses canonicality) |
| 2 | Sender derives + announces non-interactively | R2 anchor + R3 registry + Durable derivation spec | encoding/spec: yes (Durable) |
| 3 | Recipient scans economically | view-tag word pinned in R2 encoding; feed enumerable via P12/B3 (flagged rider) | scanning clients: yes |
| 4 | Stealth author admission | **nothing needed — verified §B1** | n/a |
| 5 | Gasless authorship (no funding trail) | nothing — relayer/faucet-drip is infra | yes |
| 6 | Revocation by stealth authors | existing `revoker == author` | n/a |
| 7 | Self-fleet derivation + recovery | nothing — HKDF doctrine (D3 precedent) | yes (SDK) |
| 8 | Multi-device scan/spend | nothing — view-key sharing + E5 keyWrap escrow | yes |
| 9 | Collaboration trust without public linkage | (ii) disclosed-fleet lenses: existing rows; (iii) ZK: Durable grade + proof convention | yes — ZK lane interface §B3-iii |
| 10 | PQ scheme migration | R1/R3 algo-agility (scheme-tagged blobs/encodings) | new schemeTag: yes; PQ *authorship*: external five-conjunct stack |
| 11 | Anonymity set worth having | OS default-on mint (James decision 2) | yes (product) |

Every row is either reserved below or shown post-freeze-addable. No requirement fails the test; the two ROW items are the only ones that would fail if omitted.

---

## Freeze-sensitive reservations

Each item: classification, exact shape, sufficiency check. Reserving is cheap; junk pollutes; these are cut to the bone.

### R1 — `stealthMeta` reserved-key row — **ROW (mint at ceremony)**
- **Shape:** reserved key `stealthMeta`, **PIN, VAL layout, ADDRESS-parent, cardinality-1**; value = canonical multi-entry blob `[(stealthSchemeTag uint8/uint16, bytes metaAddress)]`; OPAQUE n/a (VAL); golden vectors with the reserved-key table batch; per-persona guidance rider (a shared stealthMeta across public personas links them — attack-privacy V3's rule, extended).
- **Sufficiency:** covers req 1 (canonical location), req 10 (scheme-tagged entries admit ML-KEM later without a new row). Rotation = ordinary supersession; KEL backs it additively. Mirrors C3 `encryptionKey` exactly — same ceremony batch, same ADDRESS-parent family (home/successor/encryptionKey), NOT the closed 5-key virtual-anchor set (the A2 lesson: expand nothing silently).
- **Honest degradation if refused:** a post-freeze user-domain convention key works mechanically but every wallet needs out-of-band configuration to find it — the Schelling-point value, which is most of the value, is unrecoverable.

### R2 — genesis `/.well-known/stealth/announce` TAGDEF — **ROW (one genesis-manifest line)**
- **Shape:** one genesis TAGDEF object under the ceremony-frozen `efs.well-known` subtree (fs-pass E12). Announcements = ordinary TAGs with `definitionId` = its tagId, **VAL layout, random occurrence keys MUST** (recipient-oracle defense, A1 lesson). The body encoding — `stealthSchemeTag ‖ viewTag(1) ‖ ephemeralPubKey(scheme-length) ‖ stealthAddress(20) ‖ appBytes` — is **Durable registry text with vectors, not ceremony surface** (scanning clients version with the registry). The *view-tag word* (1 byte, position 2) is pinned inside that Durable encoding; it needs no independent freeze item.
- **Sufficiency:** covers req 2/3. Variable-length ephemeral field admits PQ schemes (req 10). Enumeration rides P12/B3 — **rider for the ceremony sheet:** if both P12 and B3 die, announcement scanning degrades to indexer/spine-scan; the feature survives degraded, so this is a dependency note, not a new demand.
- **Adversarial check on "why not convention":** any user can mint an announce-TAGDEF post-freeze and the *mechanics* are identical — but genesis membership is the only ceremony-frozen ingredient, and it is what makes ONE feed the Schelling point instead of per-app fragments that partition the anonymity set (§B4). ROW verdict stands on the anonymity-set argument alone.

### R3 — stealth schemeTag registry family — **ROW (registry constant, same batch as the C3 KEM registry)**
- **Shape:** a third algoTag family, disjoint from identity's *signature* registry and from the C3 *KEM/KEX* registry (the S1 category-error lesson: a stealth scheme bundles a signing-curve spend key + a DH/KEM view key + a derivation — it is neither of the other two). Mint `0x01 = secp256k1 + 1-byte-viewtag, ERC-5564-scheme-1-compatible semantics`; reserve the extension pattern (PQ entries minted when they exist, exactly the identity-doc PQ-algoTag discipline).
- **Sufficiency:** req 2/10. Without it, R1/R2's scheme tags would squat one of the wrong registries and re-create the S1 defect.

### R4 — stealth derivation-domain constants — **CONVENTION (Durable) — overturns privacy.md §9 and the privacy.md open-question framing, with the check shown**
- privacy.md §9 and its Open Questions flag "a stealth-address derivation would want a reserved derivation-domain … now-or-never." **The adversarial check:** enumerate every frozen surface a derivation constant could touch — envelope/wire (no: authors are opaque 160-bit words however derived), kernel state/ABI (no: admission checks `recovered == author`, nothing recomputes derivation), ID math (no: stealth output is an *author*, not a tagId/dataId — nothing registry-side re-derives it, unlike salted TAGDEFs whose resolver writes shared frozen state, which is exactly why D3 DID need reserving), reserved rows (only R1–R3 above). A domain constant like `"efs.stealth.v1"` in the HKDF/hash inputs is client-side interop text: two clients must agree or announcements are garbage — that is the *lens-spec class* of normativity (Durable, versioned, golden vectors), not the ceremony class. **Nothing about it is now-or-never.**
- **Ruling: pin it in the registry as Durable spec with vectors when stealth activates; do not spend ceremony surface on it.**

### R5 — private persona-link row — **REJECT (recorded so silence doesn't decide)**
- A reserved "encrypted persona link" claim row keyed on the primary would leak existence and count of hidden personas by slot inspection — the existence-leak twin of the A1 occurrence-key oracle. The private fleet map is **content** (encrypted DATA in the salted tree, rides D3/D4/E5/E6), never claims. D2's public persona rows remain public-personas-only.

### R6 — ERC-6538-style registry/announcer contracts in the EFS surface — **REJECT**
- Chain-bound state, per-chain registration cost, ERC-1271 dependence; fully dominated by R1/R2 (§B4). Optional SDK *mirroring* into the real ERC-6538 for payments-ecosystem interop is a convention, welcome, and touches nothing frozen.

### R7 — any kernel/admission accommodation for stealth — **REJECT**
- Verified unnecessary (§B1); any variant (grace visibility, stealth-aware admission, funding checks) would breach credible neutrality or the master confluence invariant.

### R8 — reserved read-grade name for ZK set-membership — **REJECT (cross-lane note)**
- Grades are Durable; extension is by spec revision (read-lens-spec §2 header). The ZK lane should not request ceremony surface for `author-proven-in-set`; interface in §B3-iii.

### R9 — convention amendments riding existing MUST-level conventions — **CONVENTION (three sentences, no new items)**
- (a) relayers MUST NOT batch one user's stealth envelopes in one submission tx (§B2-3); (b) randomize TID device bits per stealth author (L2b extended); (c) `claimedAt = 0` applies to all stealth-authored claims (F13 rider already covers the private tier; state that stealth authors are in it).

**Net new ceremony surface: two rows + one registry family constant + one genesis-manifest line.** Everything else in this lane is Durable or convention.

---

## Decisions for James

**1. Mint the stealth reservation set at the ceremony? (the now-or-never one)**
Plainly: to let people write under unlinkable one-time addresses later, we need two tiny permanent things baked in before the freeze — a standard "here is my stealth mailbox key" slot on every identity (like the encryption-key slot you already approved), and one well-known folder where "I left something for someone" notices go, so everyone scans one feed instead of fragments. Example: Alice invites an anonymous collaborator to a workspace; without the well-known feed, each app invents its own notice-board and a watcher can tell which app family you use and scan tiny buckets.
- **Option A (recommended): mint all three (R1 row + R2 genesis TAGDEF + R3 registry family).** Cost: one reserved-key row, one manifest line, one constant family. Everything stays dormant until activated.
- **Option B: mint R1 only.** Self-fleets and interactive invites still work forever; non-interactive announcements degrade to fragmented per-app feeds with weaker anonymity.
- **Option C: mint nothing.** Stealth authorship still *works* (no kernel change needed) but discovery is non-canonical forever; this is the only truly irreversible loss on the table.

**2. Default-on stealth meta-address at OS onboarding?**
Publishing the stealth slot is a public "I can receive private stuff" flag. If only enthusiasts do it, being on the list is itself revealing — like being one of 500 people in town with a P.O. box. If *every* OS account gets one automatically (minted alongside the encryption key, ~one extra cheap record), the flag means nothing and the crowd is everyone.
- **Option A (recommended): default-on for every OS-tier identity.**
- **Option B: opt-in.** Cheaper by one record; keeps the small-crowd problem forever.
- **Option C: defer to the OS pass** — fine, but record that the anonymity-set argument is already made here.

**3. Ship self-fleet personas in the v2 SDK, or reserve-only and wait?**
Your own privacy (desktop + phone, secret config, private files under throwaway authors) needs no announcements, no scanning, no new rows — just deterministic key derivation from a seed plus the relayer for gasless submission. Example: your phone writes health notes under authors nobody can connect to you, recoverable from your seed phrase if the phone dies.
- **Option A (recommended): ship self-fleet derivation + no-self-submission discipline in the v2 SDK** (it is the private tier's authorship story and exercises nothing unfrozen).
- **Option B: everything post-freeze.** No technical cost; the private tier launches with linkable authorship in the meantime.

**4. Relayer posture for stealth submission.**
Whoever submits your envelopes learns your IP, your timing, and — if careless — which throwaway authors belong together. On-chain, everyone forever sees *which submitter* posted each envelope. Example: if your own funded wallet submits your "anonymous" records, the chain itself links them to you permanently — worse than no stealth at all.
- **Option A (recommended): bless the OS gasless channel (faucet-drip) as the default stealth submitter, with the R9 batching discipline and OHTTP/Tor-to-relayer documented**, and state plainly that the relayer is a trust locus, not a cryptographic guarantee.
- **Option B: user-managed unlinked gas wallets.** More cypherpunk, recreates the payments-grade funding-trail problem the design just escaped.
- **Option C: both, defaulting to A** — probably where this lands in practice.

**5. The honesty sentence for the docs (ratify the wording).**
Recommended register: *"Stealth authorship gives you unlinkable pen names, not anonymity. Your own fleet, kept to yourself, is as unlinkable as any stranger's key — until your behavior, your relayer, or a future quantum computer says otherwise; announced invitations are pseudonymous until roughly 2030-class quantum machines, then permanently linkable on this permanent archive."* If that sentence is unacceptable, the feature's marketing is unacceptable, not the feature.

---

## Confidence

**VERIFIED (primary source read this pass):**
- ERC-5564 full text (Final; meta-address format, announcement event, view-tag math and 6× figure, 124-bit note, gas-funding MUST, deployment address) — eips.ethereum.org/EIPS/eip-5564.
- ERC-6538 full text (Final; mapping/interface, EIP-712 + ERC-1271 path, nonces, CREATE2 singleton at 0x6538…6538) — eips.ethereum.org/EIPS/eip-6538.
- Umbra anonymity paper (arXiv 2308.01703): the four heuristics as characterized in §A4, the 48.5/25.8/65.7/52.6% figures, ~70k registrants (July 2023), countermeasures — PDF read directly.
- PQ SAP paper (arXiv 2501.13733): three lattice SAPs, Kyber-based ML-WE fastest, 66.8% scan improvement vs ECPDKSAP, view-tag behavior in lattice setting, the authors' own "not Ethereum-friendly / requires a PQ blockchain" statement, Kyber512/768/1024 scan timings — PDF read directly.
- Vitalik's stealth guide (fee-payment problem framing, ZK/Chaumian options, dual-key delegated scanning, isogeny/lattice PQ candidates) — fetched.
- Fluidkey technical walkthrough (signature-derived keys, shared viewing-key node `m/5564'/…`, 1/1 Safe stealth accounts, independent-replay recovery, chains) — docs fetched.
- All EFS-internal claims (zero-kernel-change admission, address-shaped author requirement, revoker==author, lens/anti-fallthrough mechanics, D2/D3/E5/E6/E12/C3 shapes, closed-but-Durable grade vocabulary, A1/A2/S1/V2/V3 red-team lessons) — corpus docs read in full this pass.

**PLAUSIBLE (recalled or news-sourced; not primary-verified):**
- 2026 ecosystem state: EF/PSE end-to-end privacy roadmap naming stealth + Kohaku; "private transfers solved by Devcon Nov 2026 / 35 teams / 13 approaches"; Umbra frontend-offline-after-Kelp-exploit (consistent across several outlets; ScopeLift's own blog verified only for the 2025-review post).
- Gas figures: ~2–5k for a bare announcement event; EFS envelope amortization framing (the 22–27k/record spine figure is from the lane brief, taken as given).
- ML-KEM-768 sizes (~1.1–1.2 KB ephemeral material) — FIPS-203 parameter recall, not re-derived.
- ZK feasibility of secp256k1 derivation + membership circuits (PSE spartan-ecdsa lineage) — recalled prior art; the ZK lane owns verification.
- The `p_stealth = p_spend + s_h` single-key-leak→master-recovery footgun — algebraically immediate from the VERIFIED EIP formulas (my derivation, §B5), but I found no independent write-up to cite.
- ERC-5564 announce-event ≈6× / scan-op counts are VERIFIED as *claims in the EIP*; I did not re-benchmark them.

**Could not verify:**
- Current ERC-6538 registration counts / any live anonymity-set measurement (no public dashboard found; the 500-user framing in §B4 is a hypothetical, not a measurement).
- Which wallets ship native ERC-5564 scanning as of 2026-07.
- Whether ERC-6538 `registerKeysOnBehalf` signatures are chain-replayable (the spec's fork-handling note suggests chainId-bound domains; unconfirmed against the deployed bytecode).
- Fluidkey's exact server-side capabilities beyond the docs' statements (what the shared viewing-key node lets their server derive in practice).

**Sources (primary):** https://eips.ethereum.org/EIPS/eip-5564 · https://eips.ethereum.org/EIPS/eip-6538 · https://arxiv.org/abs/2308.01703 · https://arxiv.org/abs/2501.13733 · https://vitalik.eth.limo/general/2023/01/20/stealth.html · https://docs.fluidkey.com/technical-documentation/technical-walkthrough/ · https://scopelift.co/blog/umbra-2025-in-review-and-the-year-ahead · https://www.theblock.co/post/370532/ethereum-foundation-sets-end-to-end-privacy-roadmap-with-private-writes-reads-and-proving · https://crypto.news/umbra-shuts-front-end-after-hackers-move-stolen-funds-through-protocol/
