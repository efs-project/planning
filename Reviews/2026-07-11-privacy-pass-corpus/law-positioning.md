# EFS v2 — Positioning, legal reality, and the Ethereum-privacy horizon

**Lane:** POSITIONING + LEGAL REALITY + Ethereum-privacy horizon (deep privacy pass, 2026-07-11)
**Status:** review input — one lane of the multi-agent privacy pass
**Ground truth read in full:** [[privacy]] (Designs/efsv2/privacy.md), [[fs-pass-freeze-reservations]], [[identity]], [[codex-kinds]], attack-privacy.md (2026-07-10 red team)
**Primary sources fetched this session:** EDPB Guidelines 02/2025 **v2.0, adopted 2026-07-07** (full PDF text extracted); Fileverse `walk-away` repo; ~15 dated secondary sources cited inline
**We are not lawyers.** Everything in §2 is an engineering-facing risk map for design decisions, not legal advice. Before launch, the specific questions flagged `⚖-COUNSEL` go to actual counsel.

---

## 0. How to read this file

Four deliverables, in order: (§1) the exact positioning words, ready to paste; (§2) the mid-2026 regulatory map and the operator doctrine it implies; (§3) the walk-away test as a runnable, shipped release gate; (§4) the "Ethereum will be private" horizon and the honest inherits/never-inherits split. Then the mandated sections: freeze-sensitive reservations (§5), decisions for James (§6), confidence (§7).

The one-sentence thesis of the whole lane: **the legal system in mid-2026 is converging on rewarding exactly the properties EFS's mission already demands — no control, no custody, no fees, no discretion — so credible neutrality is not just the cypherpunk posture, it is the load-bearing legal architecture; and the honest positioning language is the cheapest legal defense EFS will ever buy.**

---

## 1. The honest positioning statement (exact words, ready to paste)

Rules that generated these words, so future edits stay honest:

- **Never** use: "anonymous," "untraceable," "GDPR-compliant," "censorship-proof," "your data is safe," "impossible to trace." Each is either false or a litigation exhibit waiting to happen (Samourai's marketing copy was read aloud in court — see §2.1.4).
- **Always** split the privacy claim into the two layers ([[privacy]] §0): confidentiality (real, cryptographic) vs graph/metadata privacy (bounded, chosen). Never let one word cover both.
- Every "can't" gets a "because": the visible graph is the price of verify-don't-trust + hyperlinkable + composable, stated as a trade EFS chose, not a bug it apologizes for.
- Deletion answers always name the forward-only law and crypto-shred, in that order.

### 1.1 README paragraph

> **EFS is a public, permanent filesystem — most of what you put on it is public forever, and you should plan accordingly.** For things that shouldn't be public, EFS supports client-side encryption: file contents and even file and folder names can be confidential, readable only by people you give keys to, and an encrypted file can later be *crypto-shredded* — destroy the key, and what remains on-chain is permanent noise. What EFS does not and cannot hide is the shape of the public record: which addresses wrote records, when they landed, and how records connect to each other. That is not an oversight. An archive that anyone can verify without trusting an indexer is an archive whose structure anyone can see; EFS chose verifiability, hyperlinks, and on-chain composability, and visible structure is the price. In one line: **EFS offers confidentiality, never anonymity — encrypt what must stay secret, assume the graph is visible, and never write anyone else's personal data into a permanent public ledger.**

### 1.2 One-liners

Primary (docs, talks, the site):

> **Confidential when you choose it. Public by default. Anonymous never.**

Secondary (for the privacy page specifically, from [[privacy]] §2, kept because it is the most honest sentence the project has produced):

> **EFS can keep your bytes secret; it cannot keep your existence secret. Design as if the graph shape is visible — because it is.**

### 1.3 FAQ answers

**Q: Is EFS private?**

> Partly — and we'll tell you exactly which part. Two different questions hide inside that one.
>
> *Can other people read my files?* Not if you encrypt them. EFS supports client-side encryption for file contents and for file/folder names; only key-holders can read them. This is real, boring, well-understood cryptography — the same family of tools as Signal or an encrypted disk — and in the EFS OS your personal tier is encrypted by default.
>
> *Can other people see that I'm active — when I wrote, how much, and how my records cluster?* Yes. EFS is a public, verifiable ledger, and the record graph is visible by design; that visibility is what lets anyone verify the archive without trusting a company or an indexer. If your safety depends on hiding the *fact* of your activity — not just its content — EFS alone is not the tool, and we would rather tell you that here than have you discover it later.

**Q: Can I delete my data?**

> Three honest answers, strongest first.
>
> **You can revoke.** A revoked record disappears from normal reads. But revocation is forward-only: anyone who already read or copied the record keeps their copy, and the public history that the record existed does not vanish.
>
> **You can crypto-shred.** If a file was *born encrypted*, destroying its key makes the surviving on-chain ciphertext permanent, unreadable noise. This is the only real "truly gone" a permanent archive can offer, and it's the reason the EFS OS encrypts your personal tier by default: a file born encrypted is a file that can still be taken back.
>
> **You cannot delete published plaintext.** EFS is a permanent, replicated archive. Treat public writes like speech: you can retract, you cannot unsay. There is no quiet delete button, and we won't pretend there is one.

**Q: Is EFS anonymous?**

> No. Every EFS record is signed by an author key, and every author's public activity — what they wrote, when, and how records connect — is visible to anyone, forever. *Pseudonymous* is the strongest claim available: an address is not a legal name until something links it, but chain-analysis links addresses to people routinely (payment trails, key reuse across contexts, timing correlation). EFS supports multiple personas per person, which is useful compartmentalization — and is not anonymity, because the compartments can leak into each other through exactly those channels. If you need real anonymity, you need a different toolchain (starting at the network layer: Tor, mixnets), and our docs point at those honestly instead of selling you an imitation.

**Q: Why not make it private like Zcash?**

> Because then it couldn't be EFS. Zcash hides the graph — senders, receivers, amounts — and pays for it with opacity: you can't hyperlink into a shielded pool, a smart contract can't read one, and you can't verify an archive you can't see. EFS's entire point is the opposite trade: a filesystem you can link into, verify without trusting an indexer, and compose with on-chain. Those three properties *require* the graph's shape to be visible. So EFS takes confidentiality everywhere it doesn't break them — encrypted payloads, blinded file names, capability links — and tells you plainly what stays visible. A fully-shielded EFS is a legitimate, different product. Claiming both trades at once is how projects end up lying about privacy, and we won't.

**Q (recommended addition): Is EFS GDPR-compliant?** *(§2.2 is the basis)*

> That's not a property a protocol can have — GDPR compliance is about what *you* process and publish, and for whom. What we can tell you: the EU data-protection regulators' final blockchain guidance (EDPB, July 2026) says personal data — plain, encrypted, *or* hashed — generally should not be recorded on a public blockchain at all, and EFS's guidance agrees: **do not publish other people's personal data on EFS.** For your own private-tier data, crypto-shredding is genuine harm reduction and tracks the direction regulators point (render the on-chain remainder unusable), but no court has blessed it as Article-17 erasure, and the public claim graph around your records cannot be erased by anyone. If you're building an app on EFS that touches other people's personal data, EFS is the wrong home for that data — keep it off-chain and put commitments on EFS, which is exactly the architecture the regulators recommend.

**Q (recommended addition): Can someone force EFS to take content down?**

> Nobody — including us — can delete records from the EFS kernel: it ships with no admin, no upgrade path, and no delete function, on purpose. What law can reach is the *serving* layer: any specific gateway, app, or index operates under its local law and can decline to serve specific content (EFS's read-lens machinery exists partly for this). So a takedown order changes what a particular door shows, never what the archive holds — and anyone can verify the archive directly. That split is deliberate: neutral record, accountable doors.

### 1.4 The anti-dismiss counterweight

The statements above guard against overselling. The mirror failure is letting "EFS is not anonymous" collapse into "EFS has no privacy," which is also false. The sentence to keep in docs wherever the limits are stated:

> The confidentiality layer is not a fig leaf: encrypted payloads, blinded names, capability-scoped sharing, crypto-shred, and post-quantum-hybrid key wrapping are the same tools the best E2EE products ship, applied to a permanent public substrate — and the parts of metadata privacy EFS does not solve are the parts *no* verifiable public archive has solved, stated openly instead of papered over.

---

## 2. Regulatory reality as of mid-2026

Everything here is date-stamped; verification grades in §7. This section answers: what does the legal environment actually look like for a credibly-neutral permanent archive, and what operator doctrine follows.

### 2.1 The Tornado Cash arc and the developer-liability trend line

**2.1.1 Van Loon (Fifth Circuit, 2024-11-26) — immutable contracts are not sanctionable "property."** The Fifth Circuit held OFAC exceeded its IEEPA authority by designating Tornado Cash's immutable smart contracts: they lack "ownership, control, and exclusivity" — nobody, including the original developers, can control them ([Steptoe summary](https://www.steptoe.com/en/news-publications/international-compliance-blog/treasury-department-delists-tornado-cash-following-the-fifth-circuits-decision.html)). **Design consequence: the property that made the contracts unsanctionable is exactly EFS's Etched artifact posture — no admin, no proxy, frozen forever.** An upgrade key or kill switch is not only a neutrality failure; it is the thing that would have made Van Loon come out the other way.

**2.1.2 OFAC delisting (2025-03-21).** Treasury removed Tornado Cash from the SDN list, framing it as discretionary rather than compelled by the ruling, and then sought mootness in the district court — plaintiffs argue this preserves the option to re-designate ([Venable](https://www.venable.com/insights/publications/2025/04/a-legal-whirlwind-settles-treasury-lifts-sanctions), [Paul Hastings](https://www.paulhastings.com/insights/crypto-policy-tracker/a-whirlwind-of-change-the-delisting-of-tornado-cash)). So: the delisting is real, the precedent is only circuit-level, and the re-designation door was deliberately left ajar. Do not treat this as settled law; treat it as a strong tailwind with a known reversal mechanism.

**2.1.3 United States v. Storm — the live wire (as of 2026-07-11).** Verified via the [DeFi Education Fund's case tracker](https://www.defieducationfund.org/u-s-v-storm-2026-update/) and [The Block](https://www.theblock.co/post/392937/roman-storm-tornado-cash-retrial) / [CoinDesk](https://www.coindesk.com/business/2026/03/10/u-s-requests-october-retrial-for-tornado-cash-developer-roman-storm):
- 2025-08-06: jury convicted Storm on **one count — conspiracy to operate an unlicensed money-transmitting business (18 U.S.C. §1960)** — and hung on money-laundering and IEEPA-sanctions conspiracy.
- 2025-09-30: Rule 29 acquittal motion ("a failure to prevent a bad act is not the same as an agreement to assist it"); oral argument held 2026-04-09; Judge Failla remarked the "stability of the verdict is very much in play" and pushed back on the government's "maintaining Tornado Cash was a crime" theory; **no ruling reported as of 2026-07-11**.
- 2026-03-09: DOJ noticed intent to **retry the two hung counts, proposing October 2026**. Sentencing on the §1960 count is pending.
- Context cutting the other way: in a **March 2026 report to Congress under the GENIUS Act**, Treasury stated that lawful users may use mixers to preserve financial privacy — shielding "personal wealth, business payments, charitable donations, and consumer spending habits" from public exposure — the first official filing to recognize privacy-preserving use cases ([Treasury PDF](https://home.treasury.gov/system/files/246/GENIUS-Act-Illicit-Finance-Innovation-Congressional-Report-March-2026.pdf), [CoinDesk](https://www.coindesk.com/policy/2026/03/09/u-s-treasury-signals-shift-on-crypto-mixers-acknowledges-legitimate-privacy-uses)). The same report distinguishes custodial services (FinCEN-registrable) from non-custodial mechanisms.

The Storm pattern to internalize: *writing and publishing* the code was conceded non-criminal even by the prosecution at the April hearing; the conviction attached to *operating* — the relayer infrastructure, the fee capture, the maintained front-end. The government's theory of liability lives entirely in the operational layer.

**2.1.4 Samourai Wallet (sentencing 2025-11).** Rodriguez: 5 years; Hill: 4 years; $250k fines each; ~$6.37M forfeiture of fees ([DOJ press release](https://www.justice.gov/usao-sdny/pr/founders-samourai-wallet-cryptocurrency-mixing-service-sentenced-five-and-four-years)). Guilty pleas to §1960 conspiracy. Two lessons: (1) again the charge is *money transmission as a business* — coordinating servers, collecting fees; (2) **their own marketing convicted them** — DOJ quoted their solicitations of criminal-source funds. Positioning language is legal surface. This is why §1.0's banned-words list exists.

**2.1.5 Pertsev (Netherlands).** Convicted of money laundering 2024-05-14 (64 months); released to electronic monitoring in early 2025 to prepare the appeal at 's-Hertogenbosch; appeal ongoing through 2026 with expert briefs (Coin Center) on whether immutable contracts can be "controlled" ([Coin Center](https://coincenter.org/expert-opinion-to-the-court-of-appeal-in-the-netherlands-supporting-alexey-pertsevs-appeal-in-the-tornado-cash-case/)). Could not verify current 2026 hearing schedule. The EU criminal-law read is meaningfully harsher than the US arc: the Dutch court treated "facilitating" laundering via published code + operated UI as sufficient. EFS's EU exposure analysis should not assume Van Loon logic travels.

**2.1.6 The trend line, synthesized.** Across Van Loon (no control → no sanctionable property), Storm (creation conceded lawful; operation charged), Samourai (custody-adjacent operation + fees + marketing → prison), the April 2025 DOJ charging-policy shift away from "regulation by prosecution" (PLAUSIBLE — the Blanche memo; not independently verified this session), and Treasury's March 2026 privacy-legitimizing report: **as of mid-2026, liability attaches to control, custody, fee-taking, and marketing — not to publishing immutable code.** The trend is real but young, one election or one catastrophic misuse away from reversal, US-centric (the EU line is harsher), and the §1960 "money transmitting" hook specifically requires *money* — which matters for EFS, next.

**2.1.7 What's different about EFS (both directions).** EFS records are *information*, not value transfer. No EFS component takes custody of funds or transmits money; §1960 and FinCEN MSB analysis should not reach a data-record relay at all (⚖-COUNSEL to confirm, especially for any fee-charging relay service someone builds). US sanctions law also contains the **Berman Amendment carve-out (50 U.S.C. §1702(b)(3))**: IEEPA generally cannot regulate the import/export of "information or informational materials" — a structurally favorable fact for an information archive that a mixer could never claim (PLAUSIBLE — statute recalled, not re-read; OFAC construes it narrowly; ⚖-COUNSEL). In the other direction: a permanent public archive has a nightmare a mixer doesn't — **illegal content that cannot be deleted** (§2.4).

### 2.2 GDPR: the right to erasure vs crypto-shred — where the regulators actually landed

**The controlling document arrived four days ago.** EDPB **Guidelines 02/2025 on processing of personal data through blockchain technologies, Version 2.0, adopted 2026-07-07** after public consultation ([final PDF](https://www.edpb.europa.eu/system/files/2026-07/edpb_guidelines_202502_blockchain_v2_en.pdf)). I extracted and read the full text (VERIFIED, primary). What it actually says:

- **Encrypted personal data on-chain is still personal data**, and — the sentence that should be pinned above EFS's PQ-hybrid ruling — "*even state-of-the-art encryption perfectly implemented will be overtaken by time if the blockchain is retained indefinitely*" (para 51). The EDPB reasons about the harvest-now-decrypt-later horizon exactly the way [[privacy]] §3 does. Key deletion makes ciphertext unintelligible "at least until the algorithm is broken … or if the key had already been compromised" — a conditional, not an endorsement.
- **Keyed/salted hashes on-chain are also personal data** (para 52); after deletion of the key/salt "the hash *should not* be linkable to the original data, provided the algorithm has not been broken, the keys were not compromised, and the salt was not leaked or poorly chosen." Unsalted hashes are called out as generally insufficient.
- **The gold standard is the perfectly-hiding commitment** (para 53): delete the original data and witness, and the on-chain commitment is "useless … neither possible to recover nor to recognise the original personal data." Para 54: whenever data must touch the chain, store only proof-of-existence forms (pointer, commitment, keyed hash) with the verifiable data held off-chain under high confidentiality.
- **Erasure**: paras 102–104. It "might be technically impracticable" to actually delete from a blockchain, so controllers must design so personal data "can be effectively rendered anonymous" on request — which "presupposes that the relevant transaction data … does not allow the direct identification of the data subject and that any additional (off-chain) data … is erased." And the blunt one: "**It is therefore not advisable to register personal data in [clear text, encrypted or hashed] forms on a blockchain. Instead, personal data in those forms should be stored off-chain**" (para 104).
- Consent (Rec. 9, para 116): consent-based processing is effectively barred unless the architecture can render the data anonymous via off-chain erasure. Retention (Rec. 11, para 120): "If such solution does not exist, then no personal data should be stored on the chain."
- Roles (paras 36–44): fact-specific; nodes doing mechanical validation "might not be considered controllers" (para 42), but public-permissionless nodes *may* be controllers or joint controllers where they exercise "decisive influence" (para 43). On-chain metadata — "transaction identifiers, wallet addresses, event logs, receipts, state transitions and smart contract storage" — "may constitute personal data" when it enables identification (fn 12). Organisations are told to *prefer permissioned chains* and to reconsider using blockchain at all (para 40) — the EDPB's center of gravity is visibly hostile to the public-permissionless shape as a home for personal data.

**Second controlling development, cutting the other way: CJEU, *EDPS v SRB*, C-413/23 P, 2025-09-04** (VERIFIED-secondary: [curia press release](https://curia.europa.eu/site/upload/docs/application/pdf/2025-09/cp250107en.pdf), [FPF analysis](https://fpf.org/blog/rethinking-personal-data-the-cjeus-contextual-turn-in-edps-vs-srb/)). The Court confirmed personal data is a **relative, contextual** concept: pseudonymized data may be personal data for the party holding the re-identification key and *not* personal data for a recipient with no reasonable means to re-identify. And the pending **Digital Omnibus** (Commission proposal 2025-11; GDPR strand still in Parliament/Council as of mid-2026, adoption expected late 2026 — [IAPP](https://iapp.org/news/a/eu-digital-omnibus-analysis-of-key-changes)) proposes codifying exactly that relative approach. This is the doctrinal crack that could, over years, soften the "every address is personal data for everyone" maximalism — but it does not help the *author* whose own activity graph identifiably clusters, and it does not exist as enacted law today.

**CNIL (2018, still-cited baseline):** key destruction "comes closer" to erasure "without resulting in strictly identical effects" ([CNIL](https://www.cnil.fr/en/blockchain-and-gdpr-solutions-responsible-use-blockchain-context-personal-data)). Careful: CNIL said *approaches*, not *is*. Secondary sources claiming regulators "accept" crypto-shred as valid erasure overstate the record; attack-privacy.md S5 made this exact catch and the EDPB final text vindicates it.

**What this means for EFS, plainly:**

1. **The claim graph is personal data and is un-erasable — full stop.** Author addresses + timestamps + record linkage are on-chain metadata squarely inside EDPB fn 12 and mainstream CJEU identifiability doctrine. No EFS mechanism erases them. EFS therefore cannot honor Article 17 for an identifiable author's graph. Say it in the docs (the §1.3 GDPR FAQ does), never claim otherwise, and stop at that — this is a *chosen* structural property, the same one that makes the archive verifiable.
2. **Crypto-shred is harm reduction that tracks the regulators' direction, not a compliance mechanism.** The EDPB's own logic (delete key → unintelligible; delete salt → unlinkable; delete witness → useless commitment) is the crypto-shred logic; but their conclusion is "so keep personal data off-chain," not "so on-chain ciphertext is fine." Position crypto-shred as: the strongest erasure-*equivalent* physically available on a permanent ledger, contested as legal erasure, conditional on genuine key irrecoverability (attack-privacy S2's enclave-bound-shred-root rule is also the *legal* load-bearing condition — a passphrase-derived root fails both the security and the legal test).
3. **The EDPB-blessed architecture is expressible on EFS today, and docs should teach it as "the GDPR shape":** personal data off-chain; on-chain only REF-layout records carrying commitments/keyed-hashes; salted TAGDEFs for names; `claimedAt=0`; erasure request → delete the off-chain data + salts → the on-chain residue is an unlinkable commitment (the para 53/64 "anonymised transaction that lost its semantics but still verifies the chain"). Sufficiency check: this needs REF layout (frozen), EFSBytes-optional off-chain bytes (true — REF targets don't require on-chain bytes), salted family (reserved D3/D4), `claimedAt=0` rider (reserved). **Nothing new to freeze.** (§5 item R4.)
4. **PQ-hybrid wrapping now has a regulatory citation, not just a threat-model one.** Para 51's "overtaken by time" sentence should be quoted in the keyWrap/contentEncryption row rationale (§5 item R7).
5. The EU trajectory (EDPB hostility to public chains + Omnibus relativism, unresolved) means EFS's GDPR posture must be robust to *both* outcomes: never claim compliance; never depend on the Omnibus passing.

### 2.3 EU DSA, chat control, and the encrypted-relay environment

**DSA (Reg. 2022/2065, fully applicable since 2024-02).** The intermediary safe harbors carried over from the eCommerce Directive: **Art. 4 mere conduit, Art. 5 caching, Art. 6 hosting** (liability only upon actual knowledge + failure to act expeditiously), **Art. 7** Good-Samaritan protection for voluntary checks, **Art. 8 no general monitoring obligation**, Arts. 9–10 orders to act against specific illegal content / provide information ([DSA library](https://dsa-library.com/chapter/2/)). VERIFIED-secondary. Mapping to EFS components (engineering read, ⚖-COUNSEL for anyone actually operating in the EU):
- **A public EFS gateway** (serves bytes over HTTP) is plausibly *hosting* or *caching*; it keeps its safe harbor by responding to Art. 9 orders and notices — i.e., by **not serving** specific content. It never needs kernel-level deletion to comply, because DSA duties attach to the service, not the ledger. This is the legal argument for the kernel/door split in §1.3's takedown FAQ, and it is why the read-lens deny machinery is not optional UX — it is the gateway operator's compliance mechanism.
- **A neutral record relayer** (pushes signed envelopes to chains, no selection, no modification) fits *mere conduit* better than anything else in the taxonomy; Art. 8 protects it from being conscripted into scanning. A relayer that *selects* records is a different animal — one more reason relay-neutrality is doctrine (§2.5).
- Transparency/due-diligence tiers (statement-of-reasons, notice mechanisms) scale with service size; a small gateway's duties are modest; none of them touch protocol design.

**Chat control, as of this week** ([The Register, 2026-07-09](https://www.theregister.com/security/2026/07/09/meps-fail-to-prevent-chat-control-snoopfest-revival/), [Euronews 2026-07-07](https://www.euronews.com/my-europe/2026/07/07/eu-to-extend-temporary-message-scanning-regime-to-detect-child-sexual-abuse-online), [Breyer tracker](https://www.patrick-breyer.de/en/posts/chat-control/)): the temporary derogation (Chat Control 1.0) lapsed 2026-04-04 after Parliament initially refused extension; the Council reinstated it through **April 2028** via a first-reading position (2026-07-02), and Parliament's rejection attempt on 2026-07-09 failed to reach the absolute-majority threshold (reported 314 against vs 276 for, needing 361 — PLAUSIBLE on the exact numbers). An adopted amendment **excludes E2EE communications from the voluntary-scanning track**. The permanent CSA Regulation (Chat Control 2.0) remains in trilogue with client-side-scanning obligations still on the table for encrypted *interpersonal communication services*; next substantive session expected September 2026. **EFS read:** EFS is a filesystem, not an interpersonal communications service, so the CSAR's scanning mandates don't naturally reach it — but (a) an EFS-based *messenger* built by anyone would be in scope, (b) the political direction (scan-before-encrypt) is the live threat to the whole E2EE layer EFS's confidentiality story sits on, and (c) the E2EE carve-out surviving in the voluntary track is the first hard evidence the EU will blink on breaking encryption when forced to choose. Watch, don't design against it yet.

**EU Data Act, Art. 36 "smart contract kill switch"** (applicable 2025-09-12): essential requirements — including safe termination/interruption — for smart contracts *executing data sharing agreements*. Facially in tension with an admin-less frozen kernel; in practice scoped to vendors of smart contracts for regulated data-sharing arrangements, and — decisively — the Commission's November 2025 Digital Omnibus **proposes deleting Article 36 without replacement** ([Bird & Bird](https://www.twobirds.com/en/insights/2025/eu-digital-omnibus-package-major-changes-to-the-data-act-proposed), [eu.ci explainer](https://eu.ci/data-act-article-36-smart-contracts-explained/)). Status mid-2026: still law, deletion pending. **Ruling for EFS: never add a kill switch or admin path to satisfy it** (§5 item R1) — the provision is scoped away from EFS's shape, is being repealed as unworkable, and complying would destroy the Van Loon-grade property that actually protects the project.

### 2.4 The permanent-archive problem: illegal content, sanctions, and the residual nobody can design away

**CSAM is the hard case, and honesty requires naming it.** A 100-year public archive with permissionless writes *will* eventually be used to store illegal content, including CSAM — IPFS, Arweave, and even Bitcoin's witness data have all faced this. No kernel mechanism can delete it. The design answer is the layer split, stated without flinching:
- The **kernel** is neutral and cannot moderate — the same fact that makes it credibly neutral and (per Van Loon) hard to characterize as anyone's controllable property.
- Every **serving-layer operator** (gateway, app, pinner, indexer) carries jurisdiction-local duties: US interactive service providers have NCMEC reporting duties on actual knowledge (18 U.S.C. §2258A, expanded by the REPORT Act 2024 — PLAUSIBLE, recalled); EU hosts have DSA notice-and-action; everyone can and should consume shared **deny/blocklists** (hash-match lists, deny-advisory lenses). EFS's deny-advisory + lens machinery means a gateway can do this *without* any protocol change — the compliance surface is entirely at the read layer. (§5 item R2 shows why this needs no frozen surface.)
- **Encrypted blobs are unscannable by construction.** Same trade every E2EE system makes; EFS should say what Signal says: the operator cannot scan what it cannot read, reporting duties attach on knowledge, and knowledge lives at the serving/client layer.
- The **relayer** question (does relaying an envelope containing bad bytes create liability?) is the least-settled: a relayer never stores and never serves reads, which is mere-conduit-shaped, but ⚖-COUNSEL before EFS-the-project operates any default relay with VAL-payload visibility.

**Sanctions for a neutral archive.** Post-delisting, the specific "the software is an SDN" theory is wounded (§2.1.1–2). The residual exposures for operators: (a) **transacting with SDNs** — a gateway/pinning service with paying customers must sanctions-screen its *customers* like any business; (b) **facilitating** — serving or pinning content *for* an SDN could be a prohibited service; the Berman informational-materials carve-out is the counter-argument for pure information (PLAUSIBLE; ⚖-COUNSEL); (c) **re-designation risk** — Treasury preserved the option (§2.1.2). None of these touch protocol design; all of them touch who EFS-the-project chooses to bill, host, and market to.

**Copyright.** Gateways want DMCA §512 safe harbor: registered agent + notice-and-takedown at the serving layer. Same lens/deny mechanics. Routine; listed for completeness.

### 2.5 The operator doctrine

What EFS-the-project **runs**:
1. **Specs, code, vectors, docs** — published, versioned, signed. Publishing code is the activity the entire 2024–2026 arc converged on protecting; it is also the mission.
2. **The freeze ceremony** — a one-time deployment of an admin-less artifact, after which the project *provably* cannot control the kernel. The ceremony transcript is a legal asset: it is the evidence-of-no-control that Van Loon turned on. Publish it accordingly.
3. **The reference SDK and the walkaway artifact** (§3) — client-side software; no service relationship.
4. **A devnet** (already doctrine: no auth, low balances, drain accepted).
5. **Optionally, one demonstration gateway** — under a separate legal entity, with a DSA/DMCA-compliant notice pipeline, a *published* blocklist policy ("this gateway does not serve records on deny-list L; the archive is unaffected; run your own gateway"), and sanctions-screening for any paid tier. If the project can't staff that pipeline, don't run the gateway — link to community gateways instead.

What EFS-the-project **never runs**:
1. **Custody of anything** — keys, funds, escrow. (Every conviction in §2.1 lives within reach of custody/control/fees.)
2. **A fee-taking relay or "official" relayer with discretion.** Relaying must be permissionless-and-fungible; the moment one relayer is special, it is an operator with a control point — legally and neutrally fatal. If the project subsidizes relaying (hackathon gasless-drip), it does so as a faucet, content-blind.
3. **Any moderation authority over the kernel**, including "emergency" powers. No such power can exist post-freeze; the marketing must never imply one does ("we can't" must always be literally true — it is the defense).
4. **Key escrow / recovery services** for user keys.
5. **Promises of deletion, compliance, or takedown** beyond the gateway-scope described above.

**Credible neutrality is also a legal posture** — the paragraph, ready to reuse:

> Every enforcement action that landed in 2024–2026 landed on a control point: a maintained relayer taking fees (Storm's §1960 count), coordinated servers monetizing criminal flow (Samourai), an operated UI treated as facilitation (Pertsev). Every doctrinal win protected the absence of control: immutable contracts that nobody — not even their authors — could steer (Van Loon), delisting once "property" required control, a Treasury report that now distinguishes custodial from non-custodial by exactly that line. EFS's mission constraints — no admin, no fees in the kernel, signature-is-authorization, anyone-can-relay, verify-don't-trust — were chosen for neutrality, but they double as the strongest liability architecture available to a permanent archive: **the project's safety and the mission's integrity fail together or hold together.** The corollary binds too: any EFS-branded *service* re-enters ordinary law — takedown duties, sanctions screening, reporting obligations — so services stay structurally separate from the protocol, operationally boring, and honest about their discretion. And because prosecutors read marketing as intent, EFS describes itself in the vocabulary regulators have already blessed — shielding "personal wealth, business payments, charitable donations, and consumer spending habits from public exposure" (US Treasury, March 2026) — and never as a way to evade the law.

---

## 3. The walk-away test as a shipped ritual

### 3.1 Prior art (verified against the repo)

Fileverse ships [`walk-away`](https://github.com/fileverse/walk-away) — a static page ([walkaway.fileverse.io](https://walkaway.fileverse.io/)) that recovers and decrypts dDocs/dSheets with **zero Fileverse infrastructure**: inputs are the user's backup keys (portal address + owner/portal/member key pairs); it talks directly to Gnosis and IPFS; decryption is local (per-file AES key wrapped into owner/portal/link "locks"); outputs are usable files (PDF/MD/CSV). README framing: "keep end-to-end control of your files, without depending on centralized servers." The shape to steal: **a named artifact + a public URL + a repo, that turns "you can always leave" from a whitepaper claim into a button.** The shape to exceed: theirs is a manual escape hatch; EFS's should also be a *machine-enforced release gate*, and EFS's verify-don't-trust architecture makes the stronger version natural.

### 3.2 The EFS Walkaway Gate — specification

**The promise, in one sentence (this is the conformance statement):**

> With **only (a) your keys and (b) any public RPC endpoint** for a chain carrying your records — no EFS-project server, no indexer, no gateway, no SDK-hosted service — you can recover and verify: your public tree, your private tree, your shared files, and your configuration.

**Deliverable 1 — the tool.** `efs walkaway` (SDK subcommand) **and** a single-file static HTML page (Fileverse shape; auditable, mirrorable, works when npm is down):

```
efs walkaway --key <mnemonic|keyfile|hardware> [--rpc <url>] [--out <dir>] [--level 0..4]
```

Behavior: derive identity address(es) and, via the same HKDF tree, the private-tier salts and self-escrow occurrence keys; enumerate all own-author records from the chain **via logs + kernel reads only** (E9's re-cut event set carries full record bodies — log-only sync is the load-bearing property here); rebuild the public tree (recompute every tagId derivation, verify path → file → EFSBytes chunk SHA-256 → bytes); rebuild the private tree (re-derive salted tagIds, unwrap self-escrow keyWraps, decrypt); recover shared files (wraps addressed to the user's published `encryptionKey` for public-convenience shares; the user's own share-acceptance records for private-tier shares); emit config (lens configs, persona links, roaming client config).

**Output: a recovery manifest** — machine-readable, listing for every object: `RECOVERED+VERIFIED` (bytes match commitments), `RECOVERED-UNVERIFIED` (bytes obtained, no on-chain commitment to check — should be rare), or `UNRECOVERABLE(reason)` where every `reason` must be one of a *closed, documented* list (`forward-only-revocation`, `crypto-shredded`, `cap-never-held` — an unacknowledged private share, see §3.4, `venue-not-queried`, `off-chain-bytes-unpinned`). An unrecoverable item with an undocumented reason is a **bug in EFS**, by definition. That closed list is the honesty contract: every hole in walkaway must map to a law EFS states publicly, or walkaway fails.

**Deliverable 2 — the release gate.** CI job on every SDK (and kernel-tooling) release:
1. **Hermetic run**: fixture identity (keys in the repo, funded on a fork/devnet with a fixture corpus: public files, private folders, shares in both directions, revoked records, one shredded file, EFSBytes large file) inside a network namespace where **only the RPC endpoint resolves** — any other DNS lookup or socket fails the gate. That is the executable meaning of "no EFS infra."
2. **Byte-compare** the recovery manifest + recovered corpus against golden fixtures. The revoked record must be `UNRECOVERABLE(forward-only-revocation)`; the shredded file `UNRECOVERABLE(crypto-shredded)`; the unacknowledged private share `UNRECOVERABLE(cap-never-held)` — the gate asserts the *holes* as strictly as the recoveries, because the holes are the honesty claims.
3. **Version lock**: any change to a private-tier convention (salt derivation, wrap format, escrow rule, padding, config-record shape) that lands without a corresponding walkaway fixture update fails CI. **This makes the walkaway suite the executable spec of the privacy conventions** — conventions being non-frozen is safe only if something executable pins them; this is that something.
4. **Self-hosting**: the walkaway static page's own bytes are published *on EFS* (a DATA record + EFSBytes), and the release gate recovers the walkaway page with the walkaway tool. The recovery tool being recoverable is the credibility signal, and it exercises the public-tree path on a real artifact every release.

**Deliverable 3 — the ritual.** Levels, so the gate and the marketing say the same thing:
- **WA-0** public tree (paths, files, bytes, all verified) — table stakes; verify-don't-trust made flesh.
- **WA-1** private tree with keys only (HKDF salts + self-escrow wraps re-derived; nothing stored but the key).
- **WA-2** shared files (public-convenience wraps + acknowledged private shares; the documented hole for unacknowledged ones).
- **WA-3** configuration (lenses, personas, client config roam back).
- **WA-4** adversarial ritual: once per release cycle (and publicly, once a year), run the full gate on a machine where every `*.efs.*` / project domain is black-holed, from a clean OS image, and publish the manifest. The annual public run is the Fileverse move upgraded into a ceremony — cheap theater-proofing against the accusation that the gate is theater.

Launch bar recommendation: WA-0–3 as hard release gates; WA-4 as the shipped ritual. (Decision D3, §6.)

### 3.3 Why this belongs to the *positioning* lane

The walkaway gate is the mechanical proof of the §1 positioning claims: "confidentiality is real" (WA-1 passes with keys only), "revocation is forward-only" (the gate asserts the hole), "crypto-shred is real" (asserted hole), "no trusted indexer" (hermetic network rule), "we can't delete" (nothing in the tool can). Each FAQ answer maps to an assertion in the fixture corpus. When a regulator, journalist, or user asks "prove it," the answer is a command line, not an essay. It is also the *operator-doctrine* proof: a project that ships walkaway is a project whose users demonstrably do not depend on it — the strongest practical evidence that EFS-the-project is a publisher of software, not an operator of a service.

### 3.4 The one honest hole, ruled explicitly

Random occurrence keys (the A1 oracle-closure ruling in E5) mean private-tier wraps are deliberately **not** addressable by recipient — so keys-only recovery cannot *discover* a private share the recipient never acknowledged before losing their device: discovery would require scanning every keyWrap ever written and trial-decrypting (unbounded at archive scale), and anything better *is the oracle we closed*. The ruling: **WA-2's scope is "shares you accepted or whose caps you hold," stated in the closed unrecoverable-reason list, and the SDK's accept-share flow writes a recipient-authored acknowledgment record (own-author, so WA-2 finds it by self-scan) as the default.** Post-freeze-addable convention (ordinary own-author records; §5 item R5). The alternative — a recipient-addressed hint row — is the public `H(recipientEncKeyId)` convenience that already exists for the public tier, with its leak named. There is no third option that keeps the oracle closed; the walkaway spec says so rather than implying magic.

---

## 4. The "Ethereum will be private" horizon

James's calibration to test: *"privacy is secondary … I expect Ethereum itself to be private in the future."* Grounded against what actually exists as of 2026-07-11:

### 4.1 What is actually on the Ethereum privacy roadmap (dated)

- **2025-04:** Vitalik publishes the privacy push — "why I support privacy" + a **"maximally simple L1 privacy roadmap"**: shielded balances by default via existing pools (Railgun/Privacy Pools) integrated into wallets, per-dapp addresses, AA+FOCIL for censorship-resistant private inclusion, keyed nonces, RPC-privacy work (TEE now, PIR later) — deliberately light on consensus changes ([The Defiant](https://thedefiant.io/news/blockchains/vitalik-buterin-unveils-roadmap-for-improving-privacy-on-ethereum)). VERIFIED-secondary.
- **2025-09:** PSE rebrands **Privacy Stewards of Ethereum**, publishes the end-to-end roadmap: **private writes, private reads, private proving** ([The Block](https://www.theblock.co/post/370532/ethereum-foundation-sets-end-to-end-privacy-roadmap-with-private-writes-reads-and-proving)). VERIFIED-secondary.
- **2025-10-08 → Devconnect 2025-11:** EF unveils **Kohaku** — privacy-first wallet SDK + reference extension: per-dapp addresses, shielded-pool integrations (Railgun operational with 4337 relaying; Tornado Cash & Privacy Pools in progress), IP/metadata minimization, Helios light-client + TEE direction; a ~47-person Privacy Cluster around it ([github.com/ethereum/kohaku](https://github.com/ethereum/kohaku), [The Defiant](https://thedefiant.io/news/blockchains/ethereum-foundation-kohaku-sdk-privacy-wallet-integration-bb4t52)). Status mid-2026: **alpha** (v0.0.1-alpha.x), production wallets (e.g. Ambire) preparing integrations. VERIFIED-secondary.
- **L1 forks:** **Fusaka** shipped 2025-12 (PeerDAS scaling — no privacy content; PLAUSIBLE on exact date). **Glamsterdam** (next; final devnets June 2026, H2-2026 target): headliners are ePBS (EIP-7732) + Block-Level Access Lists (EIP-7928) — **no direct privacy content** ([ethereum.org](https://ethereum.org/roadmap/glamsterdam/)). **Hegotá** (after Glamsterdam): **FOCIL (EIP-7805) selected as headliner** per EF Checkpoint #9 (2026-04), plus account-abstraction work — censorship-resistance, the privacy-adjacent piece ([blog.ethereum.org](https://blog.ethereum.org/2026/04/10/checkpoint-9)). Realistically 2027. VERIFIED-secondary.
- **Encrypted mempool:** live via Shutter on Gnosis Chain; coming to Ethereum **out-of-protocol first** (Shutter × Primev mev-commit, PBS-side); the in-protocol proposal (EIP-8105) is a draft explicitly *not* headlining the first 2027 fork ([Shutter blog](https://blog.shutter.network/the-first-encrypted-mempool-is-coming-to-pbs-on-ethereum/), [Cointelegraph via TradingView](https://www.tradingview.com/news/cointelegraph:8ac236f4b094b:0-eip-8105-a-new-design-for-ethereum-s-encrypted-mempool/)). VERIFIED-secondary.
- **Stealth addresses:** ERC-5564/6538 final and deployed by apps — Fluidkey live on mainnet + 5 L2s, Umbra reporting ~77k stealth addresses ([eips.ethereum.org/EIPS/eip-5564](https://eips.ethereum.org/EIPS/eip-5564)); **no L1 privacy precompile scheduled in any planned fork**. VERIFIED-secondary (adoption figures weakly sourced).
- **The institutional wobble, 2026-06-23:** EF restructuring — 54 roles cut (~20%), 40% budget reduction toward an endowment model, reorganization into five clusters, and **PSE (Privacy Stewards) disbanded as a unit**; "L1 privacy" survives as a Protocol-cluster research goal but the EF's applied-crypto execution bench is dispersed (Kohaku continues; ex-EF researchers spun out to Ethlabs) ([CoinDesk](https://www.coindesk.com/tech/2026/06/23/vitalik-buterin-says-ethereum-foundation-will-cut-budget-40-in-major-reset), [The Defiant](https://thedefiant.io/news/blockchains/ethereum-foundation-cuts-20-of-staff-in-sweeping-reorganization)). VERIFIED-secondary.
- **US policy tailwind:** Treasury's March 2026 report (§2.1.3) legitimizes privacy tooling — the political risk of *using* shielded funding rails is materially lower than in 2022–2024.

**Realistic timeline synthesis:** Ethereum privacy through ~2028 arrives at the **wallet/app layer** (shielded pools + Kohaku-class wallets + per-dapp addresses + RPC privacy), not the protocol layer. L1 gets *censorship-resistance* (FOCIL, ~2027) before it gets *privacy*; encrypted mempools are out-of-protocol experiments first, in-protocol 2028+ if ever; native shielded state on L1 is not on any scheduled fork. And after June 2026, the institutional carrier of the privacy roadmap is thinner than when James formed the prior. "Ethereum itself will be private" is directionally right for **transport, funding, and wallet UX on a 2–4 year horizon**, with real schedule risk — and categorically wrong, at any horizon, for the layer below.

### 4.2 The honest split: inherited vs never-inherited

| EFS privacy problem | Upstream fix coming? | Verdict |
|---|---|---|
| **Who funded/sent the write transaction** | Shielded balances + relayers + AA paymasters | **INHERITS — already ~free.** EFS's own design (signature-is-authorization, msg.sender ignored, anyone relays) severed author-from-tx-sender on day one; upstream shielded gas makes the relayer's own funding private too. Nothing for EFS to build. |
| **Network/RPC metadata on reads** (who fetched what) | Kohaku-class wallet stack: RPC privacy, light clients, TEE now / PIR research | **PARTIALLY INHERITS.** This is [[privacy]] P8; the SDK should *ride* the wallet stack (document OHTTP/Tor today, adopt wallet-layer PIR when it lands) rather than build a bespoke read-privacy layer. |
| **Censorship of writes** (can a relayer/builder exclude EFS records) | FOCIL (EIP-7805), headliner of the fork after Glamsterdam | **INHERITS (~2027).** Strengthens the credible-neutrality story: even hostile builders can't keep records out. |
| **Pre-inclusion timing/content snooping** | Encrypted mempools (out-of-protocol now, EIP-8105 draft) | **INHERITS EVENTUALLY, and it's marginal** — hides records only *until* inclusion; `admittedAt` and the public record body are the point of EFS. |
| **Authorship at the record layer** | Nothing upstream can touch it | **NEVER.** The signature IS the authorship — a fully shielded transport still delivers an envelope that names its author by construction. Unlinkability here is EFS's own problem (personas today; stealth-address-class derivation if the frontier lane lands it). |
| **Graph shape: co-occurrence, container clustering, record linkage** | Nothing | **NEVER.** The EFS graph is EFS's own application-layer data structure. L1 privacy hides who *sent* a transaction, not what the signed record *says*. If the archive is public, it is public — forever, on every chain it's replicated to. |
| **Ciphertext sizes, write cadence** | Nothing | **NEVER.** Padding/bucketing and timing conventions are EFS MUSTs (already reserved as conventions). |
| **Recipient sets (who can decrypt)** | Nothing | **NEVER.** keyWrap slot design (random occurrence keys, A1) is the whole defense; upstream is irrelevant. |
| **Erasure/crypto-shred** | Nothing | **NEVER.** Key management is EFS/SDK-side by design. |
| **Post-quantum HNDL on wraps** | Lean-Ethereum PQ work helps *consensus*, not your 2026 ciphertext | **NEVER retroactively** — which is why PQ-hybrid wrap is a MUST *now* (and see EDPB para 51 for the regulatory echo). |

**Calibration answer for James:** treating privacy as secondary is a defensible *budget* decision, and for transport + funding + read-path it is also correct *strategy* — those genuinely arrive from upstream, and EFS should deliberately not build them. But for everything in the NEVER rows, "wait for Ethereum" is a category error, not an optimism error: no future Ethereum hides EFS's own data structure. The only items in the NEVER rows with a **deadline** are the freeze-sensitive ones (salted family, encryptionKey, keyWrap semantics — all already reserved — plus the stealth meta-address hedge, §5 R6). Everything else in the NEVER rows can ship late; nothing in them can be outsourced.

---

## 5. Freeze-sensitive reservations

This lane is positioning/legal/horizon — its natural outputs are words and rituals, not rows. The adversarial pass over everything above, item by item, tagged ROW / CONVENTION / REJECT, each tested for sufficiency (what shipping later actually requires, and whether that is reserved-now or post-freeze-addable):

**R1. REJECT — any kill switch, admin path, pause, or "compliance mode" in kernel or EFSBytes (Data-Act-Art.-36-shaped pressure).** The legal record affirmatively rewards its absence (Van Loon: no control → no sanctionable property; §2.1.1), Art. 36 is scoped to data-sharing-agreement vendors and is proposed for deletion in the Digital Omnibus (§2.3), and any such surface would be the single most valuable target a future plaintiff or regulator could ask for. Sufficiency of rejection: nothing that ever needs to ship requires it; every takedown/compliance need is met at the serving layer (R2). *This REJECT is itself freeze-sensitive in the good direction — record it so no future "regulatory readiness" argument reopens it.*

**R2. CONVENTION (no new frozen surface) — the legal-compliance serving layer.** DSA Art. 9 orders, DMCA notices, NCMEC reporting, sanctions screening: all attach to gateway/app/pinning operators and are all satisfiable by *not serving* — deny-advisory records + lens exclusion + gateway-local blocklists. Sufficiency check: (a) deny advisories are ordinary graded TAGs (read-lens §3.4, confirmed by the 2026-07-10 red team) — exist; (b) lens exclusion is read-layer — exists; (c) gateway-local lists are off-protocol — trivially addable; (d) nothing requires kernel awareness of any jurisdiction. **No reserved row wanted; explicitly rejecting an on-chain "jurisdiction/compliance flag" row** — it would be junk on the frozen surface and a neutrality wound (the kernel must not have a takedown vocabulary).

**R3. CONVENTION — all §1 positioning texts, §2.5 operator doctrine, marketing-language rules.** Documents and governance practice; zero protocol surface. Also REJECT the tempting variant: a human-readable disclaimer/positioning record minted in genesis. Adversarial check: could a frozen disclaimer ever be *needed*? No — disclaimers must evolve with law and product; freezing one guarantees it goes stale and wrong, and a wrong frozen disclaimer is a liability, not a shield. Anything worth anchoring on-chain later (e.g., a signed policy document) is an ordinary DATA record — addable any day.

**R4. CONVENTION (ratify in docs) — the "GDPR shape" write pattern** (§2.2 item 3): personal data off-chain; on-chain REF-only commitments/keyed-hashes; salted names; `claimedAt=0`; erasure = off-chain deletion + salt destruction. Sufficiency audit against the frozen surface: REF layout (frozen kind table) ✓; off-chain bytes without EFSBytes (REF target semantics) ✓; salted TAGDEF family incl. resolver-gate (reserved, D3/D4) ✓ — **this pattern is a second, independent consumer of D3/D4, raising the cost of dropping them at the ceremony**; `claimedAt=0` rider (reserved, A2/F13) ✓. Nothing new to freeze; one docs obligation (teach the pattern as *the* answer for personal-data-adjacent apps).

**R5. CONVENTION — WA-2 share-acknowledgment records** (§3.4): recipient-authored own-key records marking accepted shares so keys-only recovery self-scans. Ordinary PIN/TAG under the recipient's own author — post-freeze-addable by construction (shown: no new kind, no reserved key required; a registry key-TAGDEF suffices). The walkaway spec depends on the *convention existing*, not on any frozen surface.

**R6. ROW-adjacent, seconded to the frontier lane — the stealth meta-address reservation.** My lane's horizon evidence strengthens the case already flagged in [[privacy]] §9: ERC-5564/6538 are final with live multi-chain deployments; Kohaku is normalizing per-dapp/fresh-address UX; upstream wallets will *expect* meta-address-class publishing. If the frontier lane doesn't converge on a full design before the ceremony, reserve the minimal hedge: **one ADDRESS-parent PIN VAL reserved row (working name `stealthMeta`, algo-tagged from the KEM/KEX registry — NOT the signature registry, per attack-privacy S1) + one reserved derivation-domain constant for stealth-derived author words.** Sufficiency sketch: with (a) a publishable meta-address, (b) the KEM registry, (c) personas (D2), an ERC-5564-style flow is client-computable — announcements ride ordinary records, scanning is client-side, no kernel change. Without the row + domain constant, the capability is un-addable post-freeze (new reserved-key rows and new derivation domains are ceremony-only). Ownership of the exact shape stays with the frontier lane; this lane's finding is that the *horizon justifies paying for the hedge now* even under uncertainty.

**R7. CONVENTION amendment (one sentence in a reserved row's rationale) — cite EDPB para 51 in the PQ-hybrid MUST.** "Even state-of-the-art encryption perfectly implemented will be overtaken by time if the blockchain is retained indefinitely" (EDPB 02/2025 v2.0, adopted 2026-07-07) is a regulator independently stating the HNDL threat model; the row rationale should carry it so the MUST survives future cost-cutting arguments. No surface change.

**R8. Freeze-adjacent SUFFICIENCY GAP found — E5's reserved self-occurrence-key escrow must be pinned as *deterministically re-derivable from the author's key material* (HKDF-family), not merely "reserved."** Walkaway WA-1 (private tree with keys only) is the test: if the self-escrow occurrence key may be random-and-stored-locally, a lost device makes the owner's own wraps undiscoverable by scan (same unbounded trial-decrypt hole as §3.4, but against yourself), and "recover your private tree with only your keys" fails — quietly falsifying both the positioning claims (§1.3 "Is EFS private?") and the walkaway promise. Because occurrence-key semantics are frozen row semantics (per the A1/E5 ruling that put occurrence-key rules in the row spec's normative text), this one line must be in the row text at the ceremony: **"the reserved self-escrow occurrence key MUST be deterministically derived from the owner's key hierarchy (HKDF), so it is re-derivable after total device loss; recipient-facing occurrence keys remain random."** Interaction with G9 (wrap targets independent of the identity signing key) checked: the *occurrence key* is a slot coordinate, not a wrap target — deriving it from the key hierarchy does not couple decryption to the signing key, so G9 is not violated; but the derivation input should be the encryption-key branch of the hierarchy, not the signing key itself, to keep the domains clean. Flagged for the crypto lane to ratify the exact derivation input.

**R9. CONVENTION (ratify as release policy) — the Walkaway Gate itself** (§3.2): CI mechanics, fixture corpus, closed unrecoverable-reason list, self-hosting rule, WA-4 annual ritual. Depends on already-ceremony-blocking items — E9 full-body events (log-only sync is what makes indexer-free self-recovery possible at all; **walkaway is a second independent consumer of E9**, strengthening it) and B1/B3 spine reads — plus D3 (HKDF salts), C3 (encryptionKey), E5 (as amended by R8). Sufficiency: with those, every WA-0..3 step is client-computable from logs + kernel reads; shown above. No new frozen surface of its own.

Net new demands on the ceremony from this lane: **R8 (one normative sentence in the E5 row text)**, a **second** for R6 *only if* the frontier lane fails to deliver a full stealth design, and two recorded REJECTs (R1, R2's flag-row, R3's genesis disclaimer) so silence doesn't decide. Everything else is conventions, docs, and CI.

---

## 6. Decisions for James

**D1 — Adopt the positioning language (§1) as the project's official words?**
Plain English: these are the exact sentences the README, site, and FAQ will use about privacy and deletion. Example of what changes: today a user asking "can I delete?" gets whatever a doc author improvises; after adoption they get the three-answer structure (revoke / shred / can't-unsay) everywhere, verbatim, and the Samourai lesson says improvised marketing is legal surface.
- (a) Adopt as-is; changes require a design-round edit. **(recommended)**
- (b) Adopt the rules (§1.0's banned/required lists) but let docs paraphrase freely. — cheaper, but paraphrase drift is exactly how "confidential" becomes "private" becomes "anonymous."
- (c) Defer until the frontier lane rules on stealth/ZK — the words above deliberately don't promise any frontier capability, so there's nothing to wait for.

**D2 — What does EFS-the-project actually operate?** (§2.5)
Plain English: the legal record punishes operating and rewards publishing; every service EFS runs is surface. Example: if EFS runs the default gateway and someone pins CSAM, EFS-the-gateway-operator must run a notice-and-takedown pipeline and file NCMEC reports; if a community member runs it, that duty is theirs.
- (a) Code-only: publish everything, run nothing but the devnet. Cleanest liability; weakest first-run UX.
- (b) Code + one demonstration gateway under a separate entity with a published blocklist policy and a staffed notice pipeline. **(recommended — the UX matters and the doctrine makes it survivable, but only if the pipeline is actually staffed; if not, fall back to (a))**
- (c) Code + gateway + an "official" relayer. Not recommended: an official relayer is a control point (§2.5 never-runs #2); subsidize relaying content-blind (faucet) instead.

**D3 — Walkaway Gate: adopt as a release gate, and at what level?** (§3)
Plain English: a CI job that proves, on every release, that a user with only their keys and a public RPC gets everything back — and that the *holes* (revoked, shredded, never-accepted shares) are exactly the documented ones. Example: a release that accidentally makes lens config unrecoverable without EFS's indexer fails CI instead of shipping.
- (a) WA-0..3 as hard release gates + WA-4 as an annual public ritual. **(recommended)**
- (b) WA-0..1 only at launch, WA-2..3 within two releases — acceptable if the share/config conventions are still moving.
- (c) Ship a Fileverse-style manual page only, no CI gate — rejected by this lane: unenforced rituals rot, and this one is the mechanical proof of the positioning claims.

**D4 — Ratify the GDPR posture** (§2.2): never claim compliance; docs say "EFS is not a home for other people's personal data"; teach the off-chain+commitment pattern as the answer for personal-data-adjacent apps; describe crypto-shred as the strongest available erasure-equivalent, contested as legal erasure.
Plain English example: a team building a CRM-on-EFS gets told, in the docs, "customer data goes off-chain; EFS holds commitments; here's the pattern" — instead of discovering GDPR in production.
- (a) Ratify, and add the two §1.3 recommended FAQs (GDPR, takedown) to the official set. **(recommended)**
- (b) Ratify the posture but keep GDPR out of the FAQ (answer only when asked) — under-serves EU builders who will ask first.
- (c) Seek a formal legal opinion first (⚖-COUNSEL items in §2 go to counsel regardless; the *posture* shouldn't wait on it).

**D5 — The horizon calibration** (§4): confirm the split — transport/funding/read-path privacy are deliberately *left to upstream Ethereum* (SDK rides Kohaku-class work, documents Tor/OHTTP meanwhile); the NEVER rows (graph, authorship-at-record-layer, recipient sets, sizes, shred) are EFS-owned, and only their freeze-sensitive members have deadlines.
Plain English: this is the "how much privacy work do we fund, and which half" decision. Example: after confirming, nobody spends a sprint building an EFS-bespoke private-RPC scheme (upstream owns it), and nobody defers the stealth meta-address reservation "until Ethereum ships privacy" (upstream will never own it).
- (a) Confirm the split as stated. **(recommended)**
- (b) Confirm, plus fund one EFS-owned metadata mitigation beyond reservations this year (padding/timing conventions hardening) — defensible if budget allows.
- (c) Reject: treat all privacy as post-launch. Rejected by this lane — the freeze-sensitive subset (R6, R8) cannot move post-ceremony at any price.

**D6 — The minimal stealth hedge if the frontier lane doesn't converge** (§5 R6): reserve `stealthMeta` row + derivation-domain constant at the ceremony even without a full design?
Plain English: one registry row and one constant, costing a line in the manifest, that keep ERC-5564-style unlinkable authorship *possible* forever; without them it is impossible forever. The wallet ecosystem is moving to fresh-address-per-context UX (Kohaku); EFS authors will eventually expect the same.
- (a) Reserve the minimal hedge now regardless of the frontier lane's verdict. **(recommended — reserving is cheap, omission is permanent, and the shape is small enough to be exact)**
- (b) Reserve only if the frontier lane's deep pass endorses stealth addresses. — acceptable; requires that lane to land before the ceremony sheet closes.
- (c) Skip; personas are enough forever. Rejected: personas don't compose with upstream wallet UX and don't give per-record unlinkability.

---

## 7. Confidence

**VERIFIED (primary source read this session):**
- EDPB Guidelines 02/2025 **v2.0 adopted 2026-07-07**; all quoted paragraphs (36–44, 50–55, 63–65, 102–106, Recommendations 9/11/16, fn 12) extracted from the official PDF and quoted from the extracted text.
- Fileverse `walk-away` repo: purpose, inputs (portal address + owner/portal/member keys), Gnosis+IPFS, local decryption, static-page hosting (fetched from github.com/fileverse/walk-away).
- The EFS ground-truth docs (privacy.md, fs-pass-freeze-reservations.md, identity.md, codex-kinds.md, attack-privacy.md) — all reasoning about reserved rows, A1/E5/E9/D3/G9 interactions reproduced from those texts, not recalled.

**VERIFIED-secondary (multiple independent, dated news/law-firm/official-adjacent sources; primary document not read end-to-end):**
- Van Loon (5th Cir. 2024-11-26, immutable contracts not "property"); OFAC delisting 2025-03-21 + mootness maneuvering.
- Storm: 2025-08-06 split verdict (§1960 conviction; hung on ML + IEEPA); Rule 29 argued 2026-04-09, undecided; DOJ retrial notice 2026-03-09 targeting Oct 2026; sentencing pending. (DeFi Education Fund tracker + The Block + CoinDesk.)
- Samourai sentences (DOJ press release: 5y/4y, Nov 2025, $250k fines, ~$6.37M forfeiture).
- Treasury GENIUS-Act report to Congress, March 2026 (official PDF located; mixer-privacy language quoted via multiple outlets).
- CJEU *EDPS v SRB* C-413/23 P (2025-09-04, relative concept of personal data) — curia press release + four firm analyses.
- Digital Omnibus: Nov 2025 proposal; GDPR strand pending mid-2026; Data Act Art. 36 deletion proposed; AI strand agreed May/June 2026.
- Chat control: derogation lapsed 2026-04-04, Council reinstated to Apr 2028, Parliament rejection failed 2026-07-09, E2EE excluded from voluntary track; CSAR trilogue ongoing.
- DSA Arts. 4/5/6/7/8/9 structure and content.
- Ethereum: Vitalik Apr-2025 roadmap; PSE→Privacy Stewards Sept-2025 roadmap (writes/reads/proving); Kohaku (Oct-2025 unveil, SDK alpha, Railgun+4337 operational, per-dapp addresses); Glamsterdam headliners ePBS+BALs, devnets June 2026; FOCIL selected for Hegotá (EF Checkpoint #9, Apr 2026); EIP-8105 draft not headlining; Shutter live on Gnosis, Shutter×Primev out-of-protocol L1 path; EF restructuring 2026-06-23 (54 cut, −40% budget, PSE disbanded, five clusters); ERC-5564/6538 final, Fluidkey multi-chain.
- CNIL 2018 "comes closer … without strictly identical effects" framing.

**PLAUSIBLE (recalled or single-source; use with care):**
- Berman Amendment scope (50 U.S.C. §1702(b)(3)) and its application to a data archive — statute is real, application untested here; ⚖-COUNSEL.
- DOJ "Blanche memo" (Apr 2025) narrowing crypto charging policy — widely reported at the time; not re-verified this session.
- 18 U.S.C. §2258A / REPORT Act 2024 reporting-duty contours — recalled.
- Exact chat-control vote tallies (314/276/361) and some fine dates in that timeline — single outlet each.
- Fusaka mainnet activation date (Dec 2025) — recalled; the fork itself and PeerDAS content are certain.
- Umbra/Fluidkey/Railgun adoption figures — weak sources.
- Pertsev current appeal posture (released to monitoring early 2025; appeal ongoing at 's-Hertogenbosch) — the ongoing-in-2026 status is inference from absence of a reported judgment.

**Could not verify:**
- Any ruling on Storm's Rule 29 motion as of 2026-07-11 (none found — treated as pending).
- The Pertsev appeal's 2026 hearing schedule or outcome.
- Whether the EDPB v2 text changed materially from the April-2025 draft (I read only v2; the version-history page confirms consultation happened, not what moved). If another lane cites draft paragraph numbers, re-check against v2 — paragraph numbering may have shifted.
- OFAC's narrow constructions of the informational-materials exemption as applied to hosting/relaying for SDNs — needs counsel, not search.

**Honesty self-check on my own deliverables:** the §1 words and §3 gate contain no claim not grounded in the frozen/reserved design as of 2026-07-10 (they promise confidentiality, forward-only revocation, crypto-shred, keys-only recovery — all designed or reserved; they promise no stealth addresses, no ZK, no graph privacy). The one place this file *depends on* an unshipped ruling is R8 — if E5's self-escrow key is not pinned HKDF-derivable, the WA-1 promise in §1.3/§3.2 must be weakened to "with your keys *and your escrow backup*," which is a materially worse sentence. That coupling is called out rather than hidden.
