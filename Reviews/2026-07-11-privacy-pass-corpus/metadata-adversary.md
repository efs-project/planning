# EFS v2 — The Metadata-Leak Adversary: the honest leak ledger

**Pass:** Deep Privacy Pass, 2026-07-11
**Lane:** Metadata-leak adversary — *deanonymize an EFS user from the PUBLIC GRAPH ALONE.*
**Assumption (given):** Layer 1 is perfect. Every payload is ciphertext, every private path is salted, every wrap occurrence key is random. I attack only what remains **visible by construction** on a public, permanent, verifiable, composable ledger.
**Deliverable:** attack playbooks with effort/confidence pricing; a real / partial / theater grade for every existing mitigation; a frontier kill-map (which technique kills which attack); the irreducible residual; freeze-sensitive asks.
**Status:** draft — adversarial record for the critic. #status/draft #kind/review #topic/privacy #pass/deep-privacy

---

## 0. The one-paragraph verdict

With Layer 1 perfect, EFS still leaks a **social, temporal, and structural skeleton** that is enough to reconstruct org charts, link a person's personas, timezone-locate authors, and detect membership changes — **not because the confidentiality failed, but because a graph you can independently verify is a graph whose shape you can see, and an author you can trust in a lens is an author you can cluster.** The single largest leak is not inside EFS at all: the **author word is a bare-EOA Ethereum address**, and that address is very likely reused or fundable-linkably to the user's existing on-chain life, which the published deanonymization literature already dismantles. Personas, random occurrence keys, salted paths, and `claimedAt = 0` are **real work that raises attacker cost from an O(1) query to a sustained correlation campaign** — but none of them delivers anonymity, and one of them (`claimedAt = 0`) is close to theater because the `order` word already leaks the same timestamp. The honest headline for the positioning statement: **EFS is confidential, not anonymous; the graph's topology, timing, and authorship-anchor are inherent to being a public verifiable composable archive, and no known technique removes them without removing the mission.** Almost nothing new needs to be *reserved* to add the privacy frontier later — the techniques that fit (stealth addresses, PIR, full-replica reads, ZK-membership) are client-side, off-chain, or ride already-reserved surface — which means the correct freeze move is mostly **anti-reservation with the sufficiency proof shown, plus two confirmations**.

---

## 1. What the public spine exposes (the leak inventory, with citations to the frozen surface)

Every record on the enumeration spine, with all payloads encrypted, still publishes:

| Field / structure | Source (frozen surface) | What it leaks |
|---|---|---|
| **author** (bytes32, address-shaped) | `codex-envelope` §core: `Envelope(author,…)`, `recovered == author` | A **stable Ethereum address** per record. Not pseudonymous-in-isolation — see §2. |
| **order** = TID `seq` (64-bit: bit63=0, **53-bit microseconds**, **10-bit clientId/device bits**) | `codex-envelope` §core; `identity` TID layout | **Author wall-clock time at microsecond resolution** + **which of ≤1024 devices** wrote it. Future-bounded `≤ now+600s`, **past-unbounded**. This is the timing *and* device fingerprint, and it is **mandatory and signed**. |
| **prev** (per-author back-pointer) | `codex-envelope` §core (signed evidence + replication hint; never read by kernel, but visible) | Chains an author's records into an ordered hash-chain: cadence, session boundaries, co-batching. |
| **recordsRoot + count** | `codex-envelope` §core | How many records share one envelope (batch size), and that they were written **atomically at one instant on one device**. |
| **admittedAt** (uint64, per venue, kernel state) | `fs-pass-freeze-reservations` B1 | **Block-time** the record landed. Chain-set, not author-set — cannot be fuzzed without withholding the record. Cross-author co-admission. |
| **claimedAt** (uint64 body word, 0=absent) | `fs-pass-freeze-reservations` A2; private tier writes 0 | Performed-at testimony where nonzero → timezone. **But redundant with `order` — see Playbook 2.** |
| **record kind + REF/VAL + VAL length** | `codex-kinds` | Kind (TAGDEF/DATA/LIST/PIN/TAG), layout, and byte-length (≤8192) of every VAL — a size fingerprint. |
| **REF targets** (unless salted) | `codex-kinds` | Which object a record points at — the edge itself. |
| **the target-keyed discovery / backlink index** ("which records point at X", authored-by whom) | `fs-pass-freeze-reservations` B3/B4; `read-lens-spec` §7 — **REQUIRED, on-chain** | The **co-occurrence engine.** Counts and authors of every reverse edge, including edges into **salted (opaque) nodes**. This is the single most useful structure for the adversary, and the mission *requires* it. |
| **slot structure** (author,key) LWW | `read-lens-spec` §1.3 | keyWrap TAG fan-out (count of recipients per file), encryptionKey PIN, contentEncryption PIN, salted-TAGDEF children (opaque but **countable under a parent**). |
| **EFSBytes manifest** (chunk count, per-chunk SHA-256, total size) | `codex-kinds` (sibling EFSBytes); C4 per-chunk SHA-256 | File **size to chunk granularity** — a strong known-file/traffic-analysis fingerprint. |
| **revocation G-set** (revoker, claimId), monotone | `codex-envelope` §core | Every **revocation / re-key / removal event**, forever, with its `admittedAt` timing. |
| **published lens LISTs + deny advisories** | `read-lens-spec` §8 LC2 (default lens MUST be a **published** lens on EFS), §3.4 | Published **trust graphs** and **deny graphs** — voluntary, but real auxiliary structure. |

**The framing that organizes the rest:** salting hides **labels**; random keys hide **which slot maps to whom**; encryption hides **bytes**. None of them hides **topology, cardinality, timing, or the authorship anchor** — and those four are what deanonymization actually runs on.

---

## 2. Playbook 0 — the master leak: the author word is a reused Ethereum address

Before any EFS-specific attack, note the starting condition. EFS authorship is **bare-EOA secp256k1** (`identity.md`: "key = identity"). The author word is an ordinary Ethereum address. Three consequences dominate everything below:

1. **Address reuse.** The overwhelming default in crypto-native populations is to reuse one address across dApps. If the EFS author address is the same address the user uses for DeFi/NFT/ENS/Farcaster, then **EFS inherits the entire existing Ethereum deanonymization surface for free.** Béres et al. (2021), *Blockchain is Watching You*, show Ethereum users are profilable and deanonymizable from **time-of-day activity, transaction-fee (gas) behavior, and transaction-graph structure**, and demonstrate address-linking and a value-fingerprinting attack that links Tornado Cash mixing parties ([arXiv:2005.14051](https://arxiv.org/abs/2005.14051)). Victor's Ethereum clustering heuristics (deposit-address reuse, airdrops, self-authorized transfers) compound this (PLAUSIBLE — recalled: Victor, *Address Clustering Heuristics for Ethereum*, FC 2020).

2. **Funding provenance is the master key.** To write to EFS an address needs gas. Gas comes from somewhere — an exchange withdrawal (KYC'd), a bridge, another address. Meiklejohn et al. (2013), *A Fistful of Bitcoins*, established the template: the **multi-input / co-spend heuristic** ("all inputs of a transaction are one entity") and the **change-address heuristic** cluster wallets from funding flows ([UCL PDF](https://discovery.ucl.ac.uk/1490261/1/Meiklejohn%20et%20al%20A%20fistful%20of%20bitcoins.pdf)). The Ethereum analog: **whatever funded the EFS author address links it to its funding source.** This is the attack that collapses personas (§ Playbook 7).

3. **No blank anonymity set.** Because the author is a real chain address, EFS does *not* start each user at a fresh, empty anonymity set the way a purpose-built shielded pool tries to. Kappos et al. (2018), *An Empirical Analysis of Anonymity in Zcash*, showed that even a dedicated shielded pool's anonymity set **shrinks dramatically under simple usage-pattern heuristics** — and that founders+miners accounted for ~66% of shielded value, i.e. a low-diversity set is a weak set ([USENIX '18](https://www.usenix.org/conference/usenixsecurity18/presentation/kappos)). EFS has *no* shielded pool at all at the identity layer; the anonymity set is "every address that ever wrote to EFS," pierced by the auxiliary chain graph.

**Effort:** passive, cheap (public chain + one auxiliary dataset). **Confidence:** HIGH that an EFS author address can be joined to its on-chain twin when reused; MEDIUM-HIGH that funding provenance links a "fresh" persona to a KYC'd source. **Seed dependency:** low — the auxiliary Ethereum graph is the seed.

**This is not fixable inside EFS.** It is the identity model (frozen bare-EOA). Personas and stealth-recipient addresses (§Frontier) fragment it; the residual is funding-linkage, which is a client/wallet-hygiene problem, not a protocol one. **Honesty demand:** the positioning statement must not imply EFS authorship is anonymous-by-default. It is *as anonymous as the address you sign with is unlinked* — which, for most users, is not very.

---

## 3. The attack playbooks

Pricing scale — **Effort:** `passive` (full node + index, no interaction) / `moderate` (build auxiliary datasets, sustained collection) / `active` (inject records, run a relay). **Confidence:** probability the attack yields its claimed output. **Seeds:** how many known identities the attack needs to bootstrap (Narayanan-Shmatikov seed-and-extend).

### Playbook 1 — TEAM CLUSTERING (reconstruct the org chart)

**Goal:** from wrap patterns, shared containers, and curation membership, recover *who works with whom* even under random occurrence keys.

**Mechanisms, strongest first:**

1. **Co-authorship cliques over shared containers (the dominant leak).** A team collaborating on a file/folder writes records *into the same container node* — placements, annotations, comment TAGs, replies. The backlink index (§1) publishes, for every node, **the set of authors who wrote records targeting it** — and it does so **even when the container is a salted TAGDEF with an opaque id.** Salting blinds the *name*; it does not blind the *fact* that authors {A, B, C} all point at opaque-node X. Repeated across many shared nodes, {A, B, C, …} forms a co-occurrence clique = a team. This is **correlation, not the O(1) oracle** — random occurrence keys do nothing against it.
   - *Literature:* structurally identical to the Bitcoin **multi-input heuristic** (co-participation ⇒ common control; Meiklejohn 2013) applied to co-authorship instead of co-spend, and to **Narayanan-Shmatikov graph deanonymization** (De-anonymizing Social Networks, IEEE S&P 2009 — a target graph plus an auxiliary graph re-identifies **~1/3 of common users at ~12% error** via structural seed-and-extend; [dl.acm.org/10.1109/SP.2009.22](https://dl.acm.org/doi/10.1109/SP.2009.22)). The co-authorship clique is the target graph; ENS/Farcaster/GitHub org membership is the auxiliary graph; **one publicly-named team member is the seed** that labels the rest by propagation.

2. **keyWrap fan-out cardinality + timing.** For file F granted by Alice, there are N keyWrap TAGs (authored by the granter). Random occurrence keys hide *which* recipient each slot is; they **do not hide N** (the team size for F) or **when** the wraps were authored. "Alice shares F with N people, and re-wrapped on D1, D2" is a visible time-series of team size per artifact.

3. **Published curation / lens membership.** `read-lens-spec` §8 LC2 mandates that a client's default lens be a **published, inspectable lens on EFS**. A team that uses a shared curation LIST or lens publishes its roster as on-chain TAGs. This is *chosen* transparency (the mission wants legible trust), but it is a literal published org roster.

**Effort:** passive-to-moderate (build the co-occurrence graph: O(records); join to an auxiliary identity graph: moderate). **Confidence:** HIGH for the *existence and shape* of the team clique; MEDIUM-HIGH for *mapping it to real identities* given ≥1 seed; without a seed you still get a de-identified org chart (size, structure, tempo — itself valuable). **Seeds:** 1 named member typically suffices (Narayanan-Shmatikov propagation).

**What kills it:** nothing on a verifiable composable graph fully kills co-occurrence (see §5, §6). Stealth-*recipient* addresses (§5) blunt mechanism 2 (wrap fan-out) but not mechanism 1 (write-back co-authorship). Blinding the *container* to a salted id does not help — the index counts opaque targets.

### Playbook 2 — TIMING

**Goal:** timezone-locate an author, fingerprint their schedule, correlate co-active authors.

**Mechanisms:**

1. **Author wall-clock from `order` (the TID).** The 53-bit microsecond field of `seq` is **author-asserted wall-clock time** and is mandatory and signed on every record. A histogram of an author's write times over UTC yields **time-of-day activity** — Béres et al. show this is a working Ethereum quasi-identifier ([arXiv:2005.14051](https://arxiv.org/abs/2005.14051)). Sleep gaps localize the home timezone to roughly a longitude band; weekday/weekend structure separates work from personal.
2. **`admittedAt` co-clustering.** Who writes in the same blocks / short windows. Weak per-block (many users share a block), but **repeated** co-admission over time is a correlation signal — the intersection-attack shape (Danezis, *Statistical Disclosure Attacks*, 2003 — PLAUSIBLE, recalled). Because `admittedAt` is **chain-set**, the author cannot fuzz it without withholding the record entirely.
3. **`claimedAt` timezone (where nonzero).** Public-tier records may carry a real performed-at, leaking timezone directly.

**The sharp finding — `claimedAt = 0` is near-theater for timing.** The private-tier rider "writes `claimedAt = 0`" (`fs-pass-freeze-reservations` §H, F13) is presented as a timing-privacy measure. It is **redundant**: the `order`/TID word *already* encodes author wall-clock microseconds, is mandatory, is signed, and is the LWW ordering key. Zeroing `claimedAt` removes a *second copy* of the timestamp while the *primary* copy remains. **A privacy-conscious author's only real timing lever is to fuzz the TID microsecond field downward** (past-unbounded is legal) — but that **trades away supersession priority** (a lower TID loses the LWW race to any honest later write in the same slot) and still leaves `admittedAt` (block time) as a coarse floor. So:

**Timing privacy is largely UNMITIGATED at the protocol level.** The best available lever (coarse/quantized TID) is a client convention with an ordering-resolution cost, and `admittedAt` sets an unbeatable coarse floor.

**Envelope co-batching (the ruling James asked for).** Records sharing one envelope share `author`, `order`, `prev`, and `recordsRoot`, and are proven written **atomically, at one instant, on one device**. Two structural facts:
- **Cross-persona co-batching is impossible.** An envelope carries **one signature** and the recovered signer **is** the author; you cannot put persona-A and persona-B records in one envelope. So co-batching can never *directly* merge two personas. Good — structural, free.
- **Same-author cross-tier co-batching links a private record to a public one.** If a salted/private record rides the *same envelope* as an identifiable public record (e.g. a public post under the user's ENS-named identity), the private record's **existence, exact instant, and device** are pinned to that identity. **RULE (convention): the SDK MUST place private-tier and public-tier writes in separate envelopes**, and SHOULD not co-batch records the user would not want temporally correlated. This is a **CONVENTION, not a freeze item** (the envelope shape is already frozen; behavior is SDK). Its value is modest — the two envelopes still share the author and near-identical `order` — so it mainly removes the *same-instant + count* correlation, not the author link. Grade it partial.

**Effort:** passive (timing is in the spine). **Confidence:** timezone-band HIGH from a few dozen records; schedule-fingerprint HIGH; co-active-author correlation MEDIUM (needs sustained collection). **Seeds:** none for profiling; timing is a *feature* input to persona-linkage (Playbook 7), not a standalone identifier.

### Playbook 3 — DEVICE FINGERPRINTING

**Goal:** count and profile an author's devices; use them as a persona-linkage feature.

**Mechanism.** The TID's **10 clientId/device bits** (`clientId = f(author, deviceBits)`, `fs-pass-freeze-reservations` §H, P10) reveal *which of the author's ≤1024 devices* wrote each record. Over time: **device count** and **per-device usage profile** (device 1 = weekday-daytime "work", device 2 = evenings/weekends "phone"). The design's own convention already flags "randomize/rotate device bits per persona."

**Assessment — real but self-inflicted and mitigable.** The device bits are part of the *mandatory* `seq` word, so *something* always occupies them — but a single-device or privacy-conscious user can pin `clientId = 0`, collapsing the multiplicity signal (at the cost of the multi-device SeqCollision-avoidance the bits provide). So:
- The **default** roster-assigned clientIds leak device multiplicity and per-device schedule → a persona-linkage feature (two personas each showing exactly 2 devices with identical weekday/weekend split is a strong link).
- The **mitigation** (single clientId when unlinkability matters; random per-persona assignment) is **REAL** — it genuinely removes the multiplicity signal — not theater.
- **Residual:** the field is always present, so you can hide *how many* devices but not *that a device wrote it*; and cross-persona device-bit *values* are not intrinsically linkable (bits are per-author space) — the cross-persona link is *behavioral* (same device ⇒ same latency/timing), not the bits themselves.

**Is it worth a mitigation? Yes — a convention, already listed** (§H "device-bit allocation + clientId derivation, SDK-normative"). I'd sharpen it: **when a persona is meant to be unlinkable, the SDK SHOULD pin `clientId = 0` and forgo multi-device convenience for that persona.** Grade: PARTIAL (secondary leak, genuine convention-level mitigation, inherent residual).

**Effort:** passive. **Confidence:** device-count HIGH; as a *linkage* feature MEDIUM (corroborating, not conclusive).

### Playbook 4 — SIZE / SHAPE

**Goal:** fingerprint files and folder trees without decrypting them.

**Mechanisms:**

1. **File size (EFSBytes).** Chunk count + total size to chunk granularity is a strong fingerprint. Website/traffic-fingerprinting literature repeatedly shows object sizes uniquely identify content within a corpus (PLAUSIBLE — recalled: Panchenko et al.; Wang-Goldberg website-fingerprinting). Per-chunk SHA-256 (C4) is over *ciphertext*, so it does **not** match known-plaintext chunks unless the key+nonce are also known — but **size alone** already fingerprints. Padding/bucketing (the MUST convention) blunts this but is **coarse** and, on a **permanent** chain, **you pay for the padding bytes forever**.
2. **Salted-subtree fan-out (the honest limit).** A salted folder with 47 opaque children is a fingerprint: the **count** and the **sub-tree topology** (depth, branching, update cadence) are visible via the backlink index even though every name is blinded. **Salting hides labels, not shape.** If the adversary knows the target's tree shape from any other source (a leaked directory listing, a once-public mirror), the salted tree's topology matches it — Narayanan-Shmatikov structural matching, applied to a directory tree.
3. **VAL lengths.** Reserved-key VAL edges leak byte-length. `contentEncryption` is the worst case: a **mandatory plaintext interned VAL** (must be parsed before you have a key), low-entropy and shared across all private-tier files → a **cross-file corpus fingerprint** ("all files using the OS default private config"), the S4 finding from the prior red team. **Grade of the fix:** folding the format into the AEAD ciphertext header (so no on-chain plaintext format VAL exists) is **REAL**; keeping an on-chain tag "with per-file entropy" is PARTIAL and easy to get wrong.

**Effort:** passive. **Confidence:** known-file confirmation HIGH given a candidate plaintext + size; tree-topology matching MEDIUM-HIGH given an auxiliary shape. **What kills it:** padding/bucketing partially (permanent cost); nothing fully kills tree-topology on a verifiable tree.

### Playbook 5 — KEY-ROTATION EVENT GRAPH

**Goal:** detect membership changes and their timing from re-key activity.

**Mechanism.** Removing a reader = **re-key**: re-encrypt (new FEK), re-wrap to the *remaining* set, often supersede the `encryptionKey` PIN. This produces a **visible burst**: a cluster of new keyWrap TAGs (new random occurrence keys) with a **cardinality delta** N → N−1, all at one `admittedAt`. Even with random occurrence keys — which hide *which* recipient left — the **event, its timing, and the direction (add vs remove, from the count delta)** are public. Correlate the re-key event to a real-world timeline (an employee's last day, a public falling-out) and you have "person X was removed from project F on date D" without ever breaking a single wrap.

**Literature:** this is the **statistical-disclosure / intersection** shape (Danezis 2003, PLAUSIBLE) and mirrors observable **group re-key after member departure** in group messaging (MLS/TreeKEM re-key is an observable metadata event; PLAUSIBLE). You don't need the identity — you need the change-event stream and an auxiliary timeline to intersect against.

**Grade: UNMITIGATED** (the design honestly says so: "key-rotation events: visible; no mitigation"). Cover-traffic mitigations (re-key on a schedule regardless of membership; pad the recipient set to a bucket size with dummy wraps) **blur but do not hide**, and on a permanent chain they impose a **forever storage cost** — grade them PARTIAL-if-adopted, weak.

**Effort:** passive. **Confidence:** detecting *that* a membership change happened + *when* + *direction*: HIGH. Identifying *who* left: MEDIUM (via temporal join to write-back cessation, Playbook 8). **Seeds:** an auxiliary event timeline.

### Playbook 6 — LENS / TRUST GRAPH

**Goal:** read the published trust graph; enumerate what each lens posture leaks.

| Posture | What lives on-chain | Leak |
|---|---|---|
| **Published community lens** (LC2 default) | A LIST authored by the curator + trusted-author TAGs | **Full trust roster public** by design — an auxiliary social/trust graph (Narayanan-Shmatikov fuel). *Chosen* leak (legible trust is a mission feature). |
| **Deny / advisory set** (§3.4) | Advisory authors' TAGs, point-readable | Who subscribes to which moderators/deny-lists (disclosed per LC1). Chosen. |
| **Private / personal lens** (salted, P9 roaming via salted family + HKDF) | Salted LIST; set of trusted authors blinded | Set is hidden, but **entry count leaks** (countable), and **citation-form links disclose lens members** — a `web3://…?lenses=0xA,0xB` link (`read-lens-spec` §1.2, §6.5) publishes a *slice of your lens* every time you share a reproducible reference. |

**Assessment.** The lens layer's leakage is **mostly chosen** — the mission *wants* published, forkable, diffable trust (LC1/LC2). The genuine *residual* leaks are: (a) **private-lens entry count** (structural, minor), and (b) **citation-link lens disclosure** — sharing a reproducible link leaks the lens authors you used to resolve it. Grade: chosen-transparency (not a failure) + a partial residual on citation links. **Mitigation for (b):** the design already has it — "wrap caps/lens references to the recipient's `encryptionKey` for durable shares; raw only for ephemeral" (attack-privacy V4). Confirm that citation-form links carrying a private lens SHOULD be wrapped, not raw.

**Effort:** passive. **Confidence:** HIGH for published lenses (it is literally published); MEDIUM for private-lens shape.

### Playbook 7 — PERSONA LINKAGE

**Goal (James's use case):** a user has ≥2 wallets (desktop + phone) and uses personas for unlinkability. Link them.

**Linking features, strongest first:**

1. **Funding provenance (the closer).** Two persona addresses funded from the same exchange withdrawal, the same bridge, or one from the other are linked by the **multi-input/change-address** template (Meiklejohn 2013) and Ethereum clustering (Victor 2020, PLAUSIBLE). This is usually the feature that pushes a probabilistic timing/behavior match to near-certainty. James's memory already bars a *shared relayer* (write-ux-attester) — good — but it cannot bar the user funding two persona addresses from one source, which is a **wallet-hygiene** problem.
2. **Write-time circadian match (Béres).** Two personas that both write predominantly 09:00–17:00 in the same timezone with the same lunch gap and weekend dropoff are behaviorally the same person. Time-of-day is a demonstrated Ethereum quasi-identifier ([arXiv:2005.14051](https://arxiv.org/abs/2005.14051)).
3. **Cadence / batch-size / device habits.** Inter-write intervals, envelope `count` distributions, and (Playbook 3) device multiplicity are corroborating features.
4. **Interaction linkage (the Signal lesson).** If persona A shares with persona B, or they co-author under a common container, they out themselves. Martiny et al. (2021), *Improving Signal's Sealed Sender*, is the sharp analog: sealed-sender one-sided anonymity **fails to compose over a conversation**, and the attacker can **link sealed-sender users in as few as 5 messages** using the **delivery-receipt** side channel — critically, "particularly effective against users that employ Tor or VPNs," because it is an **application-layer** attack ([NDSS 2021](https://www.ndss-symposium.org/ndss-paper/improving-signals-sealed-sender/)). The EFS analog of a delivery receipt is a **write-back**: the reply is the receipt.
5. **Curation-taste overlap.** Two personas trusting the same unusual author-set or citing the same niche content fingerprint each other (interest-graph / stylometric linkage).

**How many records to merge at 90%?** Honest, literature-anchored answer:
- **Closed-set linking** ("are these two suspected personas the same?"): reachable at **90%+ in dozens of co-active records** once a hard corroborator (shared funding, or a single interaction/write-back per the Signal 5-message result) is present. Timing + cadence alone often gets there in a small closed set.
- **Open-world attribution** ("which of 1M addresses is persona B?"): timing/cadence alone narrows to a **candidate set** but rarely reaches 90% **without a hard identifier** — funding provenance is the usual closer. Stylometry over public payloads needs thousands of words for open-world author-id (Narayanan et al., *On the Feasibility of Internet-Scale Author Identification*, 2012 — PLAUSIBLE, recalled: ~20% top-1 over ~100k authors from blog text; sharper for small candidate sets).

*(Marked PLAUSIBLE/analogy: there is no EFS-measured N. The mechanisms and orders of magnitude are from the cited literature; an EFS-specific study would need a corpus.)*

**Effort:** moderate (build the timing/funding/interaction features). **Confidence:** closed-set HIGH with a corroborator; open-world MEDIUM without funding, HIGH with it. **Seeds:** the two candidate personas (closed) or an auxiliary identity graph (open).

**Grade of the "personas" mitigation:** PARTIAL — genuinely fragments the author anchor and defeats naive single-address clustering, but it is a "poor man's stealth address" (privacy.md's own words): personas merge behaviorally and collapse on funding provenance. Each persona is *itself* a stable, clusterable key.

### Playbook 8 — THE RECIPIENT-CORRELATION RESIDUAL

**Goal:** after random occurrence keys close the O(1) "is Bob a recipient" oracle, recover the recipient graph anyway.

**What correlation still recovers:**

1. **Wrap-count deltas over membership changes** (Playbook 5): fact + timing + direction.
2. **Temporal join of wraps to write-backs (the Signal residual).** Alice creates F and wraps to N recipients at T. Shortly after, some distinct addresses begin **writing under F's container** (replies, annotations, re-shares). Join the wrap event to the subsequent co-authoring set → recover the subset of recipients **who acted**. This is exactly sealed-sender's failure: **anonymity does not compose over interaction; the reply is the receipt** (Martiny 2021). Random occurrence keys hide the *slot→recipient* map but not the *recipient→write-back* map.
3. **Cross-file recipient-set intersection (the SDA).** Files F1, F2, … each wrapped to hidden sets S1, S2, … with the same count and the same subsequent-writer set ⇒ infer S1 ≈ S2 = Alice's team. Repeated intersection sharpens the estimate — the classic statistical-disclosure intersection attack (Danezis 2003, PLAUSIBLE; Kappos' deposit/withdraw value+time matching is the on-chain instance — [USENIX '18](https://www.usenix.org/conference/usenixsecurity18/presentation/kappos)).
4. **The convenience-form full oracle.** If **any** client uses the addressable `H(recipientEncKeyId)` occurrence-key form (demoted to "public-sharing convenience," `codex-kinds`/synthesis C6), *that* recipient is confirmed **O(1)** — the oracle the random default closed reopens per-opt-in.

**Grade of "random occurrence keys":** **REAL for the O(1) oracle** it targets — it genuinely converts an anyone-can-run one-shot confirmation into a sustained correlation campaign, a real cost increase — but **PARTIAL overall**: write-back joins, count-deltas, and cross-file intersection recover much of the recipient graph over time. The honest one-liner: **random occurrence keys buy you "not instantly confirmable," not "unlinkable."**

**Effort:** moderate (sustained temporal collection). **Confidence:** recovering *active* recipients: HIGH; recovering *passive* (read-only, never-write-back) recipients: LOW — **this is the one place the design genuinely protects a recipient: a reader who never writes back leaves no on-chain trace** (atime is gone). **Seeds:** the wrap events + the write-back stream.

---

## 4. Mitigation grades — every mitigation in privacy.md §3–4 + the reservations, against the playbooks

Grade key: **REAL** (moves a real adversary), **PARTIAL** (raises cost / narrows but doesn't stop), **THEATER** (does not move the adversary it's sold against).

| Mitigation | Sold against | Grade | Why (which playbook) |
|---|---|---|---|
| **Payload encryption** (Layer 1) | content readers | **REAL** | Given (assumption). Not a metadata mitigation; noted for completeness. |
| **Salted / blinded TAGDEF** | name/path recovery | **REAL for labels, PARTIAL overall** | Hides names (P4 defeated for labels). Does **not** hide tree topology, fan-out, or timing (Playbook 4). "Labels, not shape." |
| **Random occurrence keys (keyWrap)** | recipient-set oracle | **REAL for the O(1) oracle, PARTIAL overall** | Closes anyone-can-probe confirmation; recipient graph still recovered by write-back join + count-delta + cross-file intersection (Playbook 8). |
| **`H(recipientEncKeyId)` convenience form** | (it *is* the oracle) | **NEGATIVE** | Any opt-in use = O(1) recipient confirmation (Playbook 8.4). Keep it demoted; name the leak in the row text (already ruled C6). |
| **Personas** | social-graph / authorship linkage | **PARTIAL** | Fragments the anchor; merges behaviorally (timing/cadence/device) and collapses on funding provenance (Playbook 7). "Poor man's stealth address." |
| **`claimedAt = 0` (private tier)** | timing / timezone | **THEATER-leaning-PARTIAL** | `order`/TID already leaks author wall-clock microseconds, mandatory + signed (Playbook 2). Removes a redundant copy only. Sharpen the doc: it is *not* timing privacy. |
| **Padding / bucketed sizes (MUST)** | size fingerprint | **PARTIAL** | Blunts file-size fingerprint; coarse; **permanent storage cost**; does nothing for tree fan-out (Playbook 4). |
| **`admittedAt` fenced from comparators** | (correctness, not privacy) | **REAL (for its purpose), irrelevant to leak** | Prevents venue-relative forks; `admittedAt` still **leaks coarse timing** to any reader — chain-set, unfuzzable (Playbook 2). |
| **atime gone (reads leave no on-chain trace)** | "which files you read" | **REAL** | The genuinely strong metadata win: a read-only recipient who never writes back is invisible on-chain (Playbook 8 residual). |
| **P8 read-path: OHTTP + chunk normalization + bulk snapshots** | gateway sees fetches | **PARTIAL** | Moves trust to the OHTTP relay; a colluding gateway+relay still correlates. **Full-replica reads** are the real fix; **PIR** the strong crypto fix (§5). |
| **Distinct `encryptionKey` per persona** (V3) | persona linkage via shared enc key | **REAL — but currently only a convention** | A shared `encryptionKey` links personas (every wrap to it is cross-persona). One line; must be normative, not optional (Playbook 7). |
| **Device-bit randomization / single clientId per persona** (§H) | device fingerprint | **PARTIAL** | Removes multiplicity signal (Playbook 3); residual = field always present; genuine, not theater. |
| **Fold `contentEncryption` into AEAD header** (S4) | private-tier corpus fingerprint | **REAL if header-folded; PARTIAL if on-chain tag kept** | Removes the mandatory-plaintext low-entropy VAL that dedup-links every private file (Playbook 4.3). |
| **PQ-hybrid wrap MUST (HNDL)** | future quantum harvester | **REAL (confidentiality)** | Not a metadata mitigation; correct and not premature (client-side decrypt, ML-KEM-768 final). |
| **Anon / dummy wraps, cover traffic** (§H, optional) | recipient count / timing | **PARTIAL, weak** | Blurs count/timing; **permanent forever-cost** on an immutable chain; raises the noise floor, doesn't hide the signal (Playbooks 5, 8). |
| **crypto-shred hard-delete** | erasure | **REAL for bytes; leaves the metadata skeleton** | Shredding destroys payload recoverability; the **claim graph (existence, size, timing, authorship) survives forever** — shred does not erase the metadata record of the file. State this. |
| **Published-lens transparency (LC1/LC2)** | (it is *chosen* publicity) | **N/A — chosen leak** | A published trust graph is an auxiliary graph for the adversary (Playbook 6), but that publicity is a mission feature, not a mitigation failure. |

**The one-line audit:** the two mitigations most at risk of being *oversold* are `claimedAt = 0` (near-theater for timing) and "personas" (partial, funding-collapsible). The two most *undersold* wins are **atime-gone** (genuinely strong) and **random occurrence keys** (a real cost increase against the specific oracle). The two conventions that must be **promoted to normative** are **distinct-encryptionKey-per-persona** and **separate-envelope-per-tier**.

---

## 5. The frontier kill-map — which technique kills which attack

For each frontier technique: what it kills, what it doesn't, and the EFS-fit ruling.

### Stealth addresses (ERC-5564 / ERC-6538)
ERC-5564 uses secp256k1 with **view tags** for scanning; ERC-6538 is the **stealth meta-address registry** ([EIP-5564](https://eips.ethereum.org/EIPS/eip-5564); growing tooling — ScopeLift SDK). The whole derivation is **client-side elliptic-curve math**; the chain stores only the meta-address (registry) and an announcement (ephemeral pubkey + view tag).

- **Kills:** the **persistent-author cluster for one-shot / recipient-side records.** A **stealth recipient address per share** kills Playbook 8's wrap-target correlation and Playbook 7's shared-encryptionKey linkage: each share targets a fresh unlinkable address, so cross-file recipient intersection and the encryptionKey anchor both break.
- **Does NOT kill:** the **owned-mutable-slot core.** EFS slots are owned by a *stable* author (LWW by author), and lenses trust *stable, predictable* authors. A fresh stealth address per write **breaks supersession** (you can't supersede your own PIN from a new author) and **breaks lens trust** (you can't pre-trust an unpredictable author). So stealth-**per-write** fights the model hard. It also does **not** kill write-back co-authorship (Playbook 1.1) — if the recipient replies from a stable identity, they re-cluster.
- **Ruling:** **NARROW YES.** Fits **stealth *recipient* addresses for wraps** and **anonymous one-shot claims** (where ownership and lens-trust aren't needed). Does **not** fit the owned FS tree. This is sharper than privacy.md's "HIGH value, validate first": the value is real but **bounded to the recipient/one-shot surface**, not the graph at large.

### ZK membership / nullifiers (Semaphore, Railgun-class)
- **Kills:** "prove you are an authorized reader / a group member / that a claim exists **without revealing which one**." Enables **anonymous lens membership**, **anonymous curation**, **anonymous advisories**.
- **Does NOT kill:** co-occurrence — you still emit records that cluster — **unless the writes themselves are ZK**, at which point you lose author attribution and forfeit the lens/verify model (Zcash-for-files).
- **Ruling:** **NARROW YES (read-side / sibling-verifier), REJECT for the graph.** Anonymous set-membership proofs fit *around* EFS; ZK-the-graph is a different product.

### PIR (SealPIR / single-server PIR)
- **Kills:** the **read-path leak** (gateway sees *which* file you fetch) — the strong version of P8.
- **Does NOT kill:** anything write-side (authorship, co-occurrence, timing, sizes) — writes are public by necessity.
- **Ruling:** **MEDIUM, read-only, off-chain.** A real upgrade over OHTTP for read privacy; expensive; client/gateway concern, no kernel surface.

### Full-replica reads (run your own node)
- **Kills:** the read-path leak **without any new crypto** — fetch everything, reveal nothing (the cypherpunk answer). Costs bandwidth/storage.
- **Does NOT kill:** write-side anything.
- **Ruling:** **the pragmatic read-privacy kill.** Ship the SDK to support it; it is the honest baseline P8 answer and it composes with the permanent-archive ethos (you already want full replicas).

### Mixnets / OHTTP / Tor (network layer)
- **Kills:** *who fetched from where* at the IP layer. Out of protocol scope; SDK-documented (as privacy.md §6 says).
- **Does NOT kill:** anything in the on-chain graph.

### Dummy / cover traffic (protocol convention)
- **Kills:** nothing cleanly. Blurs timing/count/recipient-cardinality; **permanent forever-cost**; raises the noise floor only.
- **Ruling:** weak; optional; never sell it as a fix.

**Kill-map summary table:**

| Attack | Stealth (recipient) | ZK-membership | PIR / full-replica | Cover traffic | Anything kills it fully? |
|---|---|---|---|---|---|
| P0 reused author address | partial (recipient side only) | no | no | no | **No** (identity model) |
| P1 co-occurrence clustering | no | no (unless ZK-graph) | no | weak | **No** |
| P2 timing | no | no | no | weak | **No** (`admittedAt` floor) |
| P3 device bits | n/a | no | no | no | convention (single clientId) |
| P4 size / tree shape | no | no | no | weak (padding) | **No** for shape |
| P5 key-rotation events | partial (stealth recipients blur count) | no | no | weak | **No** |
| P6 lens/trust graph | no | **yes** (anon membership) | no | no | ZK for the *membership* case |
| P7 persona linkage | partial | no | no | weak | **No** (funding residual) |
| P8 recipient graph | **yes** (stealth recipients) for wrap-target; **no** for write-back | no | read-side only | weak | recipient must also never write back |

---

## 6. The irreducible residual — what NO known technique fixes on a public verifiable graph

State this plainly; it feeds the positioning statement.

1. **Topology.** As long as the graph is **verifiable** (shape visible), **composable** (backlink index public and required), and **attributable** (lenses need stable trusted authors), the **who-relates-to-what-over-time structure is inherent.** You can hide labels (salt), sizes (pad, weakly), recipients (random keys, weakly), and read-access (PIR/replica) — but the **co-authorship/co-occurrence topology** cannot be hidden without ZK-everything, which forfeits verify-don't-trust + composability = a different product.
2. **The timing skeleton.** `admittedAt` is **chain-set**; you cannot hide *when* a record was admitted without withholding the record. `order` timing can be fuzzed but not removed. A **coarse per-author activity timeline is inherent.**
3. **The existence / cardinality skeleton.** Record counts, envelope sizes, wrap fan-outs, salted-child counts, chunk counts — all **countable because verifiable.**
4. **The authorship anchor.** Ownership (LWW by author) and lens trust both require a **stable key**, and stable keys cluster. Personas fragment the anchor but each fragment is itself a stable clusterable key, and fragments merge behaviorally + on funding provenance.

**This is the sentence for the README / positioning statement:**
> **EFS gives you confidentiality, not anonymity. Your bytes and your names can be hidden; the *shape* of your activity — who you write with, when, how much, and how your circle changes over time — is visible by construction, because it is the same structure that lets anyone verify the archive without trusting an indexer. Design as if the graph shape is public, because it is.**

A chosen chunk of this is the **price of the mission ends** (verify-don't-trust + hyperlinkable + composable), not a fixable gap — never paper over it, and never call EFS "anonymous."

---

## 7. Freeze-sensitive reservations

**Headline: I ask for almost nothing new to be Etched — and I actively recommend NOT reserving two things privacy.md floated (a stealth derivation domain and a ZK commitment/nullifier row), because the sufficiency check shows they are post-freeze-addable.** Reserving them would be junk on a frozen surface. What I *do* ask for is two CONFIRMATIONS on already-reserved surface, one CONVENTION ruling, and one CAVEAT on a freeze decision James is already making.

### 7.1 REJECT (not freeze-sensitive) — with the sufficiency proof shown

**R1 — Stealth-address support needs NO new frozen row and NO reserved derivation domain.**
*The claim tested:* privacy.md §9 floats "a stealth-address derivation would want a reserved derivation-domain + possibly a meta-address registry row (now-or-never)."
*Sufficiency check — what shipping ERC-5564-style stealth later actually requires:*
- **Publish a stealth meta-address** (spend pubkey + view pubkey). → **Already reserved:** the `encryptionKey` row (C3: PIN VAL, ADDRESS-parent, **algo-tagged multi-key blob**, separate KEM/KEX algoTag registry) is the natural home — a stealth meta-address is expressible as an algo-tagged entry (`algoTag = stealth-meta-secp256k1`). Requires only a **new algoTag value in the KEM registry**, which is a Durable/extensible registry addition, *not* a frozen row. **Addable post-freeze** ✔ (contingent on 7.2 C1).
- **The stealth address itself (per-write ephemeral author).** → It **is** a bare-EOA address. The kernel already admits any address-shaped author. **Nothing needed** ✔.
- **The announcement (ephemeral pubkey R + view tag) so the recipient can scan.** → Durable/convention: publish as a VAL under the stealth address, or fold into the wrap blob (Durable, off-chain-interpreted). **Addable post-freeze** ✔.
- **The stealth-address *derivation* (P = spendPub + H(viewSecret·R)·G, view tag).** → **Entirely client-side elliptic-curve math**; the chain derives nothing. **No frozen derivation-domain constant is needed** — this is the crux that overturns the privacy.md hedge. ✔.
*Ruling:* **REJECT the reserved stealth derivation domain / dedicated stealth row.** Instead, **document the `encryptionKey` + KEM algoTag registry as the designated future home for stealth meta-address publication** so it is not accidentally designed out (that documentation is Durable, costs nothing frozen). *Caveat honestly stated:* stealth-per-write cannot be used for the owned-mutable-slot core without losing supersession + lens trust (§5) — so this reservation is *sufficient for the recipient/one-shot surface, which is the only surface stealth fits anyway.*

**R2 — ZK anonymous-membership needs NO reserved commitment/nullifier row.**
*The claim tested:* privacy.md §9 floats "a ZK-membership primitive would want a reserved commitment/nullifier row."
*Sufficiency check — what Semaphore-style anonymous membership later requires:*
- **A commitment set (Merkle tree of member commitments).** → Expressible as a **LIST + VAL/TAG entries** using existing kinds. **No new row** ✔.
- **Nullifiers (double-use prevention).** → Published values under a nullifier-namespace TAGDEF — existing kinds. **No new row** ✔.
- **Verification.** → **Off-chain (a reader verifies the proof) or in a sibling verifier contract** (composability reads). The **master admission invariant forbids write-time membership/uniqueness gates** (`codex-envelope` §master invariant), so nullifier-uniqueness cannot and must not be enforced at admission anyway — it is enforced **read-side** (a reader rejects a proof whose nullifier already appeared). **No kernel change, no frozen row** ✔.
*Ruling:* **REJECT the reserved commitment/nullifier row.** The capability is fully post-freeze-addable via existing kinds + read-side/sibling verification, *and the master invariant that makes read-side ZK possible is already frozen.* The one thing that would be now-or-never — **admission-time ZK verification** — is already rejected by the master invariant and fights verify-don't-trust; do not reopen it.

**R3 — Metadata-blinded / count-hiding envelopes are a SIBLING-artifact concern, not a kernel reservation.**
*Sufficiency check:* a future envelope that hides `count`/`author` (ZK authorship) would be a **new signed crypto surface** — but that is a **separate domain / sibling contract** (the way EFSBytes is a sibling), deployable as a new Etched artifact **without touching the frozen kernel**. The envelope's constant domain `("EFS","1")` is not a version field to extend; a privacy-envelope is `("EFS-private","1")`, a new deployment. **Addable as a sibling post-freeze** ✔.
*Ruling:* **REJECT reserving envelope space for metadata-blinding.** Note it in the roadmap as a sibling-artifact option.

### 7.2 CONFIRM (already-reserved surface — confirm the shape supports the frontier)

**C1 — Confirm the `encryptionKey` KEM algoTag space is OPEN-ENDED (reserved-for-future values), not a closed enum frozen to today's KEMs.**
*Why freeze-sensitive:* if the algoTag field is a closed set frozen to `{x25519, ml-kem-768, hybrid}`, then **stealth-meta-address publication (R1) and future KEMs cannot be added** without a post-freeze amendment — silently defeating R1's "addable later." The **field width and open-endedness** are the reservation.
*Ask:* pin the KEM/KEX algoTag field as an **open numeric space with reserved-for-future values** (the same pattern as identity's algoTags with the P4(c) un-reservation schedule), and **document that a stealth-meta-address algoTag is an anticipated future value.** Classification: **CONVENTION on the registry shape** (the registry is Durable; the *field's open-endedness* is the freeze-adjacent bit). Cheap, exact, and it is the linchpin that makes R1 true.

**C2 — Confirm `claimedAt = 0` is documented as NOT timing privacy, and the TID-fuzz lever is named.**
*Why freeze-sensitive-adjacent:* `claimedAt` is a frozen body word (A2); the *rider* "private tier writes 0" (F13) is a convention. The freeze-relevant honesty is that **the frozen `order` word carries the same timestamp**, so no future reader should treat `claimedAt = 0` as a timing-privacy guarantee. This is a **documentation ask on frozen surface**, not a new reservation.
*Ask:* in the A2/F13 row text, state: "`claimedAt = 0` removes a redundant testimony copy only; `order` still encodes author wall-clock. Timing privacy, if wanted, requires client-side TID coarsening at a supersession-priority cost, plus the inherent `admittedAt` floor." Classification: **CONVENTION / doc rider.**

### 7.3 CONVENTION (SDK-normative rulings, no frozen surface)

**V1 — Separate envelopes per privacy tier (the ruling James asked for).** The SDK MUST place private-tier and public-tier writes in **separate envelopes** (never co-batch a salted/private record with an identifiable public one — it pins the private record's existence + exact instant + device to the public identity, Playbook 2). *Freeze test:* the envelope shape is already frozen; this is pure SDK behavior. **Not freeze-sensitive.** Note the structural freebie: **cross-persona co-batching is already impossible** (one signature per envelope), so co-batching can never directly merge personas.

**V2 — Promote two conventions to NORMATIVE (currently listed as optional/one-liners):**
- **Distinct `encryptionKey` per persona** (V3 from attack-privacy) — a shared enc key links personas; make it a MUST, not guidance.
- **Single `clientId` (device bits = 0) for unlinkable personas** — forgo multi-device convenience where unlinkability is the goal (Playbook 3).
These are §H registry rulings; no frozen surface. **Not freeze-sensitive**, but launch-blocking for the persona story.

**V3 — Wrap citation-form lens references for durable shares.** A `?lenses=…` citation link discloses a slice of a private lens (Playbook 6); the SDK SHOULD wrap durable lens references to the recipient's `encryptionKey`, raw only for ephemeral shares (confirms attack-privacy V4). Convention.

### 7.4 CAVEAT on a freeze decision James is already making (B4)

**The B4 reverse-index enrichment is a freeze-sensitive PRIVACY trade-off.** `fs-pass-freeze-reservations` B4 (the "headline freeze change") proposes the postings word carry the **predicate/definitionId** and admit **author-keying**. That enrichment is a **composability win and a clustering win at the same time**: an **author-keyed, predicate-typed reverse index makes "all `member`/`act`/annotation edges authored by X pointing at container-class Y" a cheap on-chain query** — which is exactly the Playbook 1 co-occurrence engine, sharpened. This is **not my reservation to add** — it is an **input to the B4 shape decision James already owns.**
*Ask:* when ruling B4's shape, **record the privacy consequence explicitly**: richer reverse-index keying lowers the cost of team-clustering. If the **VAL-target postings** trim (the one optional trim, B3) is on the table, note that **trimming it also modestly reduces the clustering surface** — a rare case where the privacy interest and the gas-trim interest point the same way. Composability is a mission end and clustering-resistance is not, so the likely ruling is **accept-and-disclose**, but it must be a *conscious* freeze choice, not silent. Classification: **CAVEAT on B4 (existing freeze item).**

### 7.5 The sufficiency ledger (does shipping each frontier feature later have everything it needs?)

| Future feature | Needs | Reserved now / addable later? |
|---|---|---|
| Stealth recipient addresses for wraps | meta-address publication | **encryptionKey + KEM algoTag (C1) ✔**; announcement = Durable blob ✔; derivation = client-side ✔ |
| Anonymous lens/curation membership (ZK) | commitment set + nullifiers + verify | existing kinds (LIST/TAG/VAL) ✔; read-side/sibling verify ✔; master invariant already frozen ✔ |
| PIR / full-replica read privacy | client/gateway only | no kernel surface ✔ |
| Metadata-blinded envelopes | new signed surface | sibling artifact, new domain ✔ (not the frozen kernel) |
| Timing coarsening | TID fuzz | already legal (past-unbounded TID) ✔; documented (C2) |
| Persona unlinkability hygiene | conventions | V2 conventions ✔ |

**Every frontier feature that fits EFS is either client-side, off-chain, a sibling artifact, or rides already-reserved surface. The only genuinely now-or-never bits are C1 (keep the KEM algoTag space open-ended) and the B4 caveat (a decision already on James's desk).** Everything else is anti-reservation with the proof shown.

---

## 8. Decisions for James

Plain-English, with examples and options. My recommendation is marked ★.

### Decision 1 — How do we talk about EFS privacy in public?
*Plain:* metadata leaks a real skeleton no matter how good the encryption. If we say "private," we will be embarrassed by a grad student with a full node. If we say nothing, critics will call it "just encryption."
- **(a)** Market it as "private." → **Reject** — false; the graph shape is visible.
- **(b) ★ "Confidential, not anonymous — designed as if the graph shape is public."** Ship the §6 positioning sentence verbatim. Honest, defensible, cypherpunk-credible.
- **(c)** Say nothing / bury it. → Cedes the narrative to critics.
*Recommendation:* **(b).** It is the only statement a competent cryptographer won't tear down, and it turns the honesty into a credibility asset.

### Decision 2 — Do we reserve a stealth-address slot before the freeze?
*Plain:* privacy.md floated "reserve a stealth derivation domain + meta-address row now, now-or-never." I checked what stealth actually needs later (§7.1 R1) and it needs **none of that frozen** — the math is client-side and the meta-address rides the encryptionKey row we already reserved.
- **(a)** Reserve a dedicated stealth row + derivation domain "to be safe." → **Reject** — junk on a frozen surface; the sufficiency proof shows it's addable later.
- **(b) ★ Reserve nothing new; instead (i) confirm the KEM algoTag space is open-ended (§7.2 C1), and (ii) write one Durable paragraph naming the encryptionKey/KEM registry as the future stealth-meta-address home.** Cheap, exact, sufficient.
*Example of why (b) is safe:* ERC-5564 stealth addresses on Ethereum today store only a meta-address in a registry + an announcement event; the chain computes no derivation. EFS's encryptionKey blob is already an "algo-tagged multi-key" registry — a stealth meta-address is just another algo-tag.
*Recommendation:* **(b).** Reserving is cheap but *junk* reservations pollute a frozen surface permanently; here the honest move is the open-ended KEM space (C1), nothing more.

### Decision 3 — Same question for ZK anonymous membership (Semaphore-style)?
*Plain:* the frontier study will look at anonymous lens/curation membership. It needs a commitment set + nullifiers. I checked (§7.1 R2): both are expressible with the **kinds we already have**, and verification is read-side because the kernel is forbidden from write-time gates anyway.
- **(a)** Reserve a commitment/nullifier row now. → **Reject** — post-freeze-addable via existing kinds; the master invariant that enables read-side ZK is already frozen.
- **(b) ★ Reserve nothing; keep the master "no write-time gates" invariant (already frozen) and note existing kinds as the commitment/nullifier home.**
*Recommendation:* **(b).**

### Decision 4 — Default timing posture (honest TID vs coarse TID)?
*Plain:* every record's `order` word is a microsecond wall-clock timestamp — it leaks your timezone and schedule. `claimedAt = 0` does **not** fix this (it's a redundant second copy). The only real lever is coarsening the TID, which costs ordering precision and can lose supersession races.
- **(a)** Honest TID everywhere (microsecond truth). → Best usability/ordering; leaks timing fully.
- **(b)** Coarse TID everywhere (e.g. hour buckets). → Blunts timezone; more SeqCollisions, weaker supersession, still has the `admittedAt` floor.
- **(c) ★ Per-tier default: honest TID in the public archive tier, coarsened TID (+ the documented supersession-cost) offered in the private/OS tier; document that `admittedAt` remains an unbeatable coarse floor and `claimedAt=0` is not timing privacy (C2).**
*Recommendation:* **(c)**, and update the doc so no one sells `claimedAt=0` as timing privacy.

### Decision 5 — keyWrap recipient-privacy posture?
*Plain:* random occurrence keys stop anyone from instantly checking "is Bob a recipient." They do **not** stop an attacker who watches over time (Bob writes back; the recipient count drops when someone's removed; the same team recurs across files).
- **(a) ★ Ship random occurrence keys now (already ruled), be honest it's "not instantly confirmable, not unlinkable," and put stealth-recipient addresses on the roadmap as the real upgrade (kills wrap-target correlation).**
- **(b)** Add dummy/cover wraps now. → Permanent forever-cost for weak blur; not worth it at freeze.
- **(c)** Claim the recipient graph is protected. → **Reject** — false (Playbook 8).
*Recommendation:* **(a).** And promote **distinct-encryptionKey-per-persona** to a MUST (§7.3 V2) — it's a one-liner that closes a hard persona link.

### Decision 6 — Read-path privacy default?
*Plain:* on-chain, no one can see which file you *read* (atime is gone — a genuine win). Off-chain, whoever serves you bytes can. Three answers, increasing cost.
- **(a) ★ Ship SDK support for full-replica reads (fetch everything, reveal nothing — free of new crypto, fits the permanent-archive ethos) + OHTTP for light clients; document mixnets/Tor as the network-layer answer; PIR as research.**
- **(b)** OHTTP only. → Light, but trusts the relay.
- **(c)** PIR now. → Strong, expensive, premature.
*Recommendation:* **(a)** — the replica read is the cypherpunk baseline and you want full replicas for permanence anyway.

### Decision 7 — B4 reverse-index enrichment (privacy caveat on a decision you already own)
*Plain:* the on-chain "who points at X" index is required for composability — and it is exactly the tool that reconstructs org charts. The B4 redesign wants to make it richer (author + predicate keyed), which makes both composability *and* clustering cheaper.
- **(a) ★ Accept the enrichment (composability is a mission end) and disclose the clustering consequence in the row text; if the VAL-target postings trim is taken for gas, note it also trims clustering surface.**
- **(b)** Trim the reverse index for privacy. → Fights the on-chain-graph mission end; **reject** as a privacy move.
*Recommendation:* **(a)** — make it a *conscious* freeze choice, not a silent one. Composability wins; the honesty is the mitigation.

---

## 9. Confidence

### VERIFIED (read the primary design docs / reproduced the reasoning in this session)
- **EFS frozen-surface mechanics** used in every playbook: envelope shape `(author, order/seq, prev, recordsRoot, count)` and one-signature-per-envelope (`codex-envelope`); TID = 53-bit microseconds + 10 device bits, future-bounded/past-unbounded (`codex-envelope`, `identity`); keyWrap TAG-only + random occurrence keys + `H(recipientEncKeyId)` demoted (`codex-kinds`, `fs-pass-synthesis` C6); salted TAGDEF hides names (`fs-pass-freeze-reservations` D3); the target-keyed backlink index is REQUIRED and on-chain (`read-lens-spec` §7, `fs-pass-freeze-reservations` B3/B4); `admittedAt` chain-set + fenced from comparators (B1); `claimedAt=0` rider (A2/F13); atime gone (`fs-pass-synthesis` master table); encryptionKey separate KEM registry (C3); master "no write-time gates" invariant (`codex-envelope`). All read directly.
- **The `claimedAt=0`-is-redundant-with-`order` finding**, the **envelope co-batching ruling**, the **stealth-needs-no-frozen-domain** and **ZK-needs-no-frozen-row** sufficiency proofs, and the **B4 clustering caveat** — these are my reasoning, reproduced from the frozen surface above; internally verified, but they are *arguments*, and a critic should re-run the sufficiency checks.
- **Literature existence + headline results** (via search + abstract fetch this session): Narayanan-Shmatikov, *De-anonymizing Social Networks*, S&P 2009 — ~1/3 of common users re-identified at ~12% error, seed-and-extend ([dl.acm.org](https://dl.acm.org/doi/10.1109/SP.2009.22)). Martiny et al., *Improving Signal's Sealed Sender*, NDSS 2021 — SDA via delivery receipts, "link sealed sender users in as few as 5 messages," app-layer defeats Tor/VPN ([NDSS](https://www.ndss-symposium.org/ndss-paper/improving-signals-sealed-sender/)). Meiklejohn et al., *A Fistful of Bitcoins*, IMC 2013 — multi-input + change-address heuristics ([UCL](https://discovery.ucl.ac.uk/1490261/1/Meiklejohn%20et%20al%20A%20fistful%20of%20bitcoins.pdf)). Kappos et al., *An Empirical Analysis of Anonymity in Zcash*, USENIX '18 — shielded-pool anonymity shrinks via usage heuristics, founders+miners ~66% of pool value ([USENIX](https://www.usenix.org/conference/usenixsecurity18/presentation/kappos)). Béres et al., *Blockchain is Watching You*, 2021 — time-of-day + gas + graph quasi-identifiers, Tornado value-fingerprinting ([arXiv:2005.14051](https://arxiv.org/abs/2005.14051)). ERC-5564/6538 — secp256k1 + view tags + meta-address registry ([EIP-5564](https://eips.ethereum.org/EIPS/eip-5564)).

### PLAUSIBLE (recalled, not re-verified this session — treat as directional)
- **Béres per-quasi-identifier accuracy and value-fingerprint success probabilities** — the abstract confirms the quasi-identifiers and the attack; the *numbers* are recalled, not extracted (the full PDF returned binary this session).
- **Signal SDA beyond the "5 messages" headline** — the realistic message count under noise is higher; recalled, not extracted (full paper PDF returned binary).
- **Victor, *Address Clustering Heuristics for Ethereum*, FC 2020** (deposit-reuse/airdrop/self-authorized heuristics); **Möser et al. Monero traceability** (zero-mixin/temporal); **Danezis, *Statistical Disclosure Attacks*, 2003** and Danezis-Serjantov intersection attacks; **Narayanan et al., *Internet-Scale Author Identification*, 2012** (~20% top-1 over ~100k authors); **Harrigan-Fretter, *The Unreasonable Effectiveness of Address Clustering*, 2016**; **website-fingerprinting file-size results** (Panchenko/Wang-Goldberg). All recalled; cited as analogy, not as extracted fact.
- **The persona-linkage "N records for 90%" estimates** — analogy from the above, **not** an EFS-measured number. Explicitly a reasoned range, not a result.

### COULD-NOT-VERIFY (this session)
- **Full text of the two most load-bearing papers** (Béres 2005.14051 PDF; Martiny NDSS PDF) — both returned binary/undecoded via WebFetch; I have abstracts + search summaries only, so deeper per-attack numbers are unconfirmed. A critic should pull the PDFs directly.
- **EFS-specific quantities** — real team wrap fan-out sizes, real chunk-size distributions, real persona-merge N — there is no implementation to measure; every EFS-specific "HIGH/MEDIUM confidence" is a *structural* judgment (the leak exists and is exploitable), not a measured success rate.
- **ScopeLift/ERC-6538 adoption specifics and any 2026 "Ethereum integrates ERC-5564" reporting** — surfaced in search, not independently confirmed; treat adoption claims as unverified.
