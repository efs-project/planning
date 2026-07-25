# AA inversion — the smallest EFS identity layer that survives universal smart accounts

**Lane:** inverted-framing pass, 2026-07-25 joined KEL x authority x lens filesystem reconciliation
**Question owned:** assuming universal protocol smart accounts (ERC-4337 / EIP-7702 / ERC-7913 / native AA), what is the SMALLEST residual EFS-specific identity/authority layer that permanence + portability + verify-anywhere-forever actually forces?
**Status:** reconciliation input; nothing here is ceremony-final
**Inputs:** [[kel]] (read in full), [[owner-rulings]], [[owner-decision-inbox]], [[assumptions-and-requirements]] §§8–11, [[human-overview]] §7, [[identity]] (historical), [Base native-AA impact review](../2026-07-19-base-native-aa-impact.md), primary web sources dated below
**Audience:** the pass synthesizer and critic first; James's packet second

#status/draft #kind/review #repo/planning #topic/efsv2 #topic/kel #topic/aa

---

## 0. Verdict in one page

The headline frame survives contact with the evidence, with one sharp boundary. Mid-2026 account abstraction genuinely provides — in production, audited, at scale — almost everything [[kel]] builds for **current execution authority**: signer rotation, passkeys, session keys, sponsorship, threshold control, guardian recovery, and (on Base's schedule) native protocol accounts. EFS should consume all of it and build none of it. That deletes or demotes roughly a third of [[kel]] (the parts that were quietly re-implementing a wallet).

What no part of the account layer provides — and, on the evidence below, structurally *cannot* provide — is **authorization as durable evidence**: an answer to "was this signature authorized for this principal *at that time*, provable to anyone, anywhere, forever." Every account-layer mechanism answers "is this authorized *now*, *here*," by reading mutable chain-local state. The four candidate gaps in the charge all confirm as real, each with a concrete use case (§3). The residual EFS layer is therefore not an identity system in the wallet sense; it is an **evidence layer over authorization**: a chain-free principal word, a signed authority seam on the envelope, a minimal pre-rotating key-event chain, admission receipts at an ordering witness, portable proofs, and evidence renewal. Seven pieces, enumerated in §3.6; everything else in [[kel]] is mapped KEEP / REPLACE / SIMPLIFY / DROP in §5.

The shrink test (§4) gets a split answer: **yes** for cryptographic verification — ERC-7913 is Final with shipped OpenZeppelin verifiers and EFS should adopt its `(verifier, key)` shape as the suite-dispatch abstraction rather than inventing one; **no** for the authorization state machine — native AA converged *narratively* in 2026 (EIP-7701 Withdrawn, superseded by EIP-8141; Base committing EIP-8130 for September) but everything is Draft, chain-bound, transaction-shaped, and history-free. The residual cannot yet shrink to a pure adapter; it shrinks to a **thin event machine + receipt store that consumes account-layer verifiers and account-layer recovery factors**. §4 names exactly what would change this answer.

The two-grade working hypothesis (James ruling 3 for this pass) falls out of the inversion rather than being assumed by it: the weak grade is precisely what signatures alone can promise on any chain with zero setup (`PORTABLE-EVIDENCE`), and the strong grade is precisely what requires an ordering witness (`AUTHORITY-ADMITTED`). §6.4 keeps it separable from [[kel]]'s demoted maximal topology and from N1's axes, as required.

How this page breaks: if the reader takes "consume the account layer" to mean "let account state validate records," the archive inherits every failure in §2's right-hand column — the EIP-7702 sweeper epidemic being the loudest empirical warning that *current account state follows the thief*. The dependency direction stays KEL → smart account, never the reverse ([[kel]] §12, [[assumptions-and-requirements]] R-D8).

---

## 1. The mid-2026 account-abstraction state (research, date-stamped)

All claims below were checked 2026-07-25 against the cited sources. VERIFIED/PLAUSIBLE tags are consolidated in the Confidence section.

### 1.1 EIP-7702 — shipped, adopted, and adversarially instructive

- **Status: Final**; live on mainnet since Pectra, 2025-05-07. Delegation is set by a signed authorization tuple `[chain_id, address, nonce, y_parity, r, s]`; the account's code becomes the delegation indicator `0xef0100 || address`; delegation is cleared by authorizing the zero address, which resets the code hash to empty. `chain_id = 0` makes one authorization replay-valid on every chain, but it is *applied* per-chain against per-chain nonces — there is no atomic global delegation state. ([eips.ethereum.org/EIPS/eip-7702](https://eips.ethereum.org/EIPS/eip-7702), fetched 2026-07-25.)
- **Adoption is real:** MetaMask shipped 7702 as its Smart Account upgrade path in 2025; Trust Wallet, OKX, Ambire and others display and sign authorizations; industry estimates cite 200M+ smart wallets across 4337+7702 combined ([eco.com 7702 deep-dive, 2026](https://eco.com/support/en/articles/15254037-erc-7702-deep-dive-2026-eoa-becomes-smart-wallet); [Curvegrid, 2026-02-13](https://www.curvegrid.com/blog/2026-02-13-a-practical-look-at-eip-7702-and-wallet-delegation)).
- **Adversarial reality:** Wintermute's Dune analysis found the large majority of early delegations (>80%, later analyses >97% of delegation targets by code identity) were copies of a sweeper contract ("CrimeEnjoyor") installed on *already-compromised* EOAs to auto-drain incoming ETH ([Coindesk, 2025-06-02](https://www.coindesk.com/tech/2025/06/02/post-pectra-upgrade-malicious-ethereum-contracts-are-trying-to-drain-wallets-but-to-no-avail-wintermute); [dev.to CrimeEnjoyor analysis](https://dev.to/ohmygod/the-crimeenjoyor-epidemic-how-eip-7702-delegation-phishing-drained-450k-wallets-and-how-to-e2g)); a single 7702 batch-phishing loss of $1.54M was reported August 2025 ([Cryptopolitan](https://www.cryptopolitan.com/eip-7702-user-loses-1-54m-phishing-attack/)).
- **Why EFS cares:** this is field data for the central structural claim. A 7702 account's "current code" answer *follows whoever holds the key*: the EOA key can always re-delegate, so delegation is neither rotation (the key remains eternal root) nor a commitment (it is overwritable state). An archive that trusted account state for authorship would have recorded hundreds of thousands of thief-controlled "authorized" states. This is the how-it-breaks pair for every "just read the account" proposal in §2.

### 1.2 ERC-4337 — mature rails, still an execution system

EntryPoint v0.6/v0.7 remain widely deployed; **v0.8** (2025) added native EIP-7702 support; **v0.9** hardened execution (e.g. `handleOps` restricted to top-level EOA calls to stop UserOperation execution inside attacker-controlled frames) ([eth-infinitism releases](https://github.com/eth-infinitism/account-abstraction/releases); [ERC-4337 substack on v0.9](https://erc4337.substack.com/p/improving-useroperation-execution)). [[kel]] §12 checked reference release v0.9.0 on 2026-07-11; that remains current. 4337 gives EFS bundling, sponsorship, and account execution as a submission rail — it stores no authorization history and identifies no portable actor (UserOperationEvent logs are log-only and prunable under EIP-4444, which the full-body-spine ruling already refuses to depend on: [[owner-rulings]] 2026-07-10).

### 1.3 ERC-7913 — the verifier abstraction, now Final and shipped

- **Status: Final** (created 2025-03-21). One function: `verify(bytes key, bytes32 hash, bytes signature) → magic value`. A key is arbitrary bytes (P-256 point, RSA modulus, …); **"Verifiers SHOULD be stateless"** and `verify` should be pure — the spec explicitly warns against dependence on post-deployment-modifiable values ([eips.ethereum.org/EIPS/eip-7913](https://eips.ethereum.org/EIPS/eip-7913), fetched 2026-07-25).
- **Shipped implementations:** OpenZeppelin provides `ERC7913P256Verifier`, `ERC7913RSAVerifier`, `ERC7913WebAuthnVerifier`, the `SignerERC7913` abstract signer, `MultiSignerERC7913` / `MultiSignerERC7913Weighted` threshold signers, and `SignatureChecker` integration alongside ECDSA and ERC-1271 ([OZ docs: multisig](https://docs.openzeppelin.com/contracts/5.x/multisig), [accounts](https://docs.openzeppelin.com/contracts/5.x/accounts), [community contracts changelog](https://github.com/OpenZeppelin/openzeppelin-community-contracts/blob/master/CHANGELOG.md)).
- **What it gives and does not give:** suite-agnostic *cryptographic* verification with a clean stateless contract shape — exactly the "copy the abstraction" [[kel]] §12 asked for, now with Final status and reference code. It has **no notion of identity, rotation, authorization time, or history**; the spec addresses none of them (checked directly). And the threshold variants are necessarily *stateful* (signer sets live in account storage), which means the moment membership can change, you are back to mutable chain-local state — the membership state machine is exactly what 7913 does not standardize. That boundary is load-bearing for §4.

### 1.4 P-256 / passkeys — the gas blocker is gone

EIP-7951 (secp256r1 precompile) activated on Ethereum mainnet in **Fusaka, 2025-12-03 21:49:11 UTC** ([EF Fusaka mainnet announcement](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement), which lists EIP-7951 among the core EIPs); RIP-7212 predecessors were already live on major L2s. Passkey-signer smart wallets (Coinbase/Base wallet, Porto, etc.) verify cheaply on L1 and L2s. This retires the cost objection to P-256 actors but changes nothing about identity binding: WebAuthn RP/origin/UV policy, challenge-transcript binding, and the sole-synced-passkey rejection in [[kel]] §13 remain EFS's problem. [[owner-decision-inbox]] L16's gating (vectors, review, transition staffing) is unchanged; only its cost premise improved.

### 1.5 Native AA — narrative convergence, zero shipped surface

- **EIP-7701 is Withdrawn, superseded by EIP-8141** ([eips.ethereum.org/EIPS/eip-7701](https://eips.ethereum.org/EIPS/eip-7701), fetched 2026-07-25). EIP-8141 ("frame transactions": validation/execution/gas-payment decomposed into frames; accounts choose their own validation, including bespoke signature schemes) is **Draft, created 2026-01-29, scheduled for no fork** ([eips.ethereum.org/EIPS/eip-8141](https://eips.ethereum.org/EIPS/eip-8141), fetched 2026-07-25); community discussion places it as a Hegotá (H2 2026+) candidate and as Ethereum's signature-agility vehicle for PQ ([ethereum.org quantum-resistance roadmap](https://ethereum.org/roadmap/future-proofing/quantum-resistance/)).
- **EIP-8130 (Base native AA) is Draft**, committed by Base for the Cobalt upgrade September 2026, implementation live on Vibenet, OP Stack later — reviewed in depth in [Base native-AA impact](../2026-07-19-base-native-aa-impact.md) (2026-07-19), whose boundary ruling this lane re-affirms: 8130 answers *"which configured actor authorized this chain transaction and who pays,"* not *"which stable principal authorized this portable record and was it authorized then."*
- **Net for the shrink test:** the L1 track converged from three competing proposals to one (8141), and one major L2 has a shipping date for another (8130). But the two are different designs; both are Draft; neither is deployed; and both authenticate **chain-bound transactions**. "Native AA" in mid-2026 is a credible 2027 execution substrate, not an identity layer EFS can reference today. Do not Etch against either ([[kel]] §12's caveat stands, updated: 7701→Withdrawn, 8141 is the successor).

### 1.6 Session keys, permissions — ERC-7715 class

ERC-7715 (`wallet_grantPermissions`) remains **Draft** (as of April 2026 per secondary reporting) but is experimental-to-production: MetaMask ships it as Advanced Permissions in the Smart Accounts Kit / Delegation Toolkit; Coinbase, Biconomy, Rhinestone build the same shape ([MetaMask Advanced Permissions](https://metamask.io/news/introducing-advanced-permissions); [MetaMask 7715 docs](https://docs.metamask.io/delegation-toolkit/0.12.0/experimental/erc-7715-request-permissions/); [eco.com 7715 explainer](https://eco.com/support/en/articles/11953354-erc-7715-explained-wallet-permissions-sessions-and-subscriptions)). The permission vocabulary is **call/asset-shaped**: token allowances, periodic/stream spends, target contracts, expiries. Nothing in the class expresses record kinds, definitions, or namespace subtrees, and the grant artifact is wallet-side policy, not an admissible on-chain authorization object with a century lifetime.

### 1.7 Recovery modules — productized, mutable, chain-local

Safe supports modular (ERC-7579-style) social recovery on >$100B of assets; ZeroDev Kernel is the most-deployed ERC-7579 account with pluggable multisig/guardian validators; Coinbase Smart Wallet ties recovery to passkey quorums across the user's platform devices plus optional recovery keys; the dominant pattern is guardian-quorum-plus-timelock (24–72h) with owner cancel ([eco.com smart-wallet-recovery 2026 survey](https://eco.com/support/en/articles/15254048-smart-wallet-recovery-2026-social-multisig-passkey-options)). Argent's guardian model persists in that lineage. All of it is **mutable account state on one chain**: the current owner (i.e., whoever holds current keys — see §1.1) can typically reconfigure guardians subject only to module-specific delays, and no recovery event produces a portable transcript a third venue can verify later.

### 1.8 Post-quantum account work

FIPS 204 (ML-DSA) and 205 (SLH-DSA) have been final since 2024 ([[kel]] §14). Ethereum's stated plan routes account-level PQ through **signature agility via native AA (EIP-8141)** plus proposals like EIP-7932 (secondary signature algorithms), with core PQ infrastructure targeted ≈2029 ([ethereum.org quantum-resistance](https://ethereum.org/roadmap/future-proofing/quantum-resistance/); [pq.ethereum.org](https://pq.ethereum.org/); [ethereum-magicians EIP-7932 thread](https://ethereum-magicians.org/t/post-quantum-migrations-crypto-agility-and-how-to-prevent-eip-7932-from-failing/27836)). Nothing PQ-authoritative is deployable for accounts today. Critically for EFS: even when the account layer gets PQ agility, it migrates **current control**; it does nothing for the verifiability of **old records** as classical primitives age — that is evidence renewal, and it has no account-layer analogue ([[kel]] §14's RFC-4998 posture confirmed as residual).

---

## 2. The inversion table

For every capability [[kel]] builds: does the account layer already provide it? Verdicts are for **EFS's requirements** (permanence + portability + verify-anywhere-forever), not for wallet UX, where the account layer is uniformly excellent. Each row pairs the mechanism with how it breaks if EFS leaned on it.

| # | Capability ([[kel]] home) | Account-layer mechanism (dated) | Verdict | How the account-layer version breaks for EFS |
|---|---|---|---|---|
| 1 | **Stable principal across rotation** ([[kel]] §0, §1.1) | 4337/7579 account address survives signer swaps (live since 2023-2025); Safe owner rotation; 7702 re-delegation (Pectra 2025-05) | **PARTIALLY** — stable *address on one chain* for execution | The identifier's meaning is mutable code+storage; a 7702 "rotation" is fake (EOA key stays eternal root, §1.1); the address is chain-scoped; counterfactual same-address deployments on other chains can have *different owners* (classic Safe-replay loss pattern). Authorship pinned to an account address inherits all of this forever. |
| 2 | **Scoped actors / sessions** ([[kel]] §7) | ERC-7715 permissions (Draft; MetaMask/Coinbase shipping, §1.6); ERC-7710 delegations; 7579 session validators; EIP-8130 native session keys + subaccounts (Base Sept 2026) | **PARTIALLY** — fully for *execution* scopes; not for record scopes | Scopes are call/asset-shaped (spend X until T at contract C), not record-shaped (kinds, definitions, resource subtrees, record counts). The grant is wallet-side or account-storage policy: not admissible as a portable authorization object, not verifiable after the account mutates, no ancestry-revocation semantics for a century reader. |
| 3 | **Pre-rotation (committed next control)** ([[kel]] §5.3) | **None.** No AA standard commits to the next control state; owners rotate at will with current keys | **NOT AT ALL** | This is the sharpest gap: in every account system, *whoever holds current keys owns the future* — the 7702 sweeper data (§1.1) is this failure at scale. KERI-style full-next-state commitment is the one mechanism that makes theft of current keys non-total, and it exists nowhere in the account layer. |
| 4 | **Recovery** ([[kel]] §10) | Safe recovery modules, Kernel validators, Coinbase passkey quorums, guardian+timelock patterns (production, §1.7) | **PARTIALLY** — factors and UX: yes; commitment and evidence: no | Recovery *policy* is mutable account state (thief with current keys can strip or race guardians subject to module delay); recovery produces no portable transcript; recovery on chain A does nothing on chain B; and no module coordinates recovery with *record admission* (no pending-freeze, no disputed-interval semantics — the account has no records). |
| 5 | **Historical verification of old records** ([[kel]] §9) | ERC-1271 `isValidSignature` (current state); ERC-6492 (counterfactual, may execute arbitrary preparation code); ERC-7562 validation rules | **NOT AT ALL** | 1271 answers "valid NOW": rotate owners and yesterday's answer changes; upgrade the implementation and *anything* can validate (a malicious delegate returns the magic value for all inputs). It also identifies no actor — a receipt recording "1271 said yes" preserves no provenance. There is no account-layer question that even means "was this authorized at ordinal N." |
| 6 | **Admission receipts** ([[kel]] §8.2) | **None.** 4337 emits UserOperationEvent logs (prunable, execution-keyed); nothing binds a message to an authorization basis in state | **NOT AT ALL** | Logs die under EIP-4444; events carry no grant/scope/epoch; and no venue stores "actor K under grant G for principal P at ordinal N." Without receipts, anti-backdating (R-K3) is unimplementable regardless of account sophistication. |
| 7 | **Realm portability** ([[kel]] §1 portable-authorship; R-D1) | 7702 `chain_id = 0` authorizations replay everywhere but apply per-chain (divergent states, §1.1); CREATE2 same-address deployment (unsafe, row 1); nothing else | **NOT AT ALL — actively counter-provided** | Accounts are the *most* chain-bound identity available: address meaning = local state. The [Base review](../2026-07-19-base-native-aa-impact.md) confirmed the same for 8130's replayable config changes: replayable ≠ atomic global state. Any cross-realm identity story must be built above the account layer. |
| 8 | **PQ migration** ([[kel]] §14) | EIP-8141 signature agility (Draft, no fork); EIP-7932 (discussion); roadmap ≈2029 (§1.8) | **PARTIALLY, future** — current-control migration eventually; record-evidence aging never | Even shipped, account PQ agility rotates *current* verification. Old EFS records signed with secp256k1 still need graded verification and RFC-4998-style renewal before E(secp256k1) — a pure archive concern no execution layer will ever own. |
| 9 | **Org / threshold control** ([[kel]] §11.3) | Safe m-of-n (>$100B, audited, §1.7); `MultiSignerERC7913(Weighted)` (shipped, §1.3); FROST etc. off-chain | **PARTIALLY — the strongest consume case** | Coordination and approval ceremonies: consume wholesale. But membership lives in mutable storage (stateful by necessity, §1.3), approvals are transactions without portable transcripts, and history-of-control is unprovable off-venue. The org's *approval mechanics* are account-layer; the org's *control history* is not. |
| 10 | **Personas** ([[kel]] §11.1) | Counterfactual accounts are free until deployment; N accounts trivially | **PARTIALLY** — cheap execution-side unlinkability | The account layer neither links nor unlinks personas: grouping, recovery isolation, funding-route separation, and the do-not-share-factors discipline are client/OS work either way. Small residual (local grouping conventions), consistent with the adopted separate-KELs-grouped-locally ruling ([[owner-rulings]] 2026-07-16). |

**Adversarial honesty in the other direction** — things this table must not let EFS rebuild: gas payment, bundling, sponsorship, batching, wallet session UX, passkey enrollment/sync UX, guardian coordination UIs, threshold signing ceremonies, execution-account deployment, and PQ *transaction* formats. Every one of these has production account-layer owners; any EFS-side reimplementation is scope creep and should be cut on sight. [[kel]] mostly respects this already; §5 flags the places it drifts.

---

## 3. The residual argument, stated precisely

The charge named four candidate structural gaps. All four confirm. For each: the mechanism, the concrete use case smart accounts alone cannot serve, and the break analysis.

### 3.1 Gap (a) — a smart account is chain-bound mutable state; its answers are not portable evidence

**Confirmed.** An account's current-key answer is a storage read. Its history is a sequence of state transitions that were never *signed as history*: reconstructing "who controlled account A at block B" requires archival state (or event logs) plus a consensus/finality argument for that block — and the adopted chains-persist ruling deliberately does **not** assume archival logs survive (that is exactly why the full-body spine exists: [[owner-rulings]] 2026-07-10, KEEP list). On any *other* realm, the account's answer is not merely stale; it is undefined (row 7).

**Use case accounts cannot serve:** the walk-away test ([[human-overview]] §11 step 7; [[kel]] §17 Export). A century verifier holding an export bundle must re-derive who could act for Alice across her whole history *without* querying live Ethereum archival infrastructure. Signed KEL events + receipts do this; account state transitions do not — they are not self-authenticating artifacts.

**How the EFS answer breaks in turn:** a signed event chain can be *withheld* — a verifier shown events 1..k cannot know k+1 exists. That is why the residual needs the admission ordering witness (gap d / receipts) and why off-home verification is honestly graded `SNAPSHOT@H`, never current ([[assumptions-and-requirements]] §10). No security theater: the residual does not fix withheld heads either; it *names* them.

### 3.2 Gap (b) — address-as-identity breaks across rotation on other realms

**Confirmed.** Same address, different chain, different owner is a routine fact (row 1); rotation on the home realm does not propagate; and 7702's cross-chain replayable authorizations create *divergent* per-chain delegation states by design (§1.1). The [Base review](../2026-07-19-base-native-aa-impact.md) reached the identical conclusion for 8130 config changes.

**Use case:** James ruling 2 for this pass — chains render like drives, per-chain filesystems, with a future unified cross-chain view left possible. A file's author shown identically on two mounted chains requires an author identifier whose *meaning* does not depend on either chain's account state. That is the chain-free `bytes32` principal (born-KEL digest derivation, [[kel]] §4.4) with the bare-EOA address-shaped zero state ([[kel]] §4.1). No account construct can substitute.

**Break pairing:** the chain-free principal introduces its own hazard — *thief declares a different home*: with no binding, a thief who steals a bare key can incept "Alice's KEL" on a venue of their choosing. [[kel]] §4.2's first-use commitment is the mitigation; where the commitment lives is the T2 axis (§6.2). For born-KEL principals the hazard closes structurally: `GenesisBodyV1` commits `authorityHomeRef` *inside the identity word* — a thief cannot re-home a digest principal without changing the principal.

### 3.3 Gap (c) — ERC-1271 answers "valid NOW," not "authorized THEN"

**Confirmed by spec and by construction.** `isValidSignature` executes current account code over current storage. Three distinct failures for an archive: (i) **rotation flips history** — after an owner swap, signatures that were good verify bad and vice versa; (ii) **upgrade forges history** — a compromised or malicious implementation validates anything, so "1271 said yes at admission" is only as strong as the code that said it, which the receipt must therefore identify and which a century verifier cannot re-execute portably; (iii) **no actor provenance** — a magic-value answer names no key, so even an honest yes destroys the who. ERC-6492 adds arbitrary preparation-code execution during verification, which is why [[kel]] §12 bans it from canonical inception; that ban stands.

The important **nuance ERC-7913 adds**: a *stateless* 7913 verifier over explicit key bytes is time-independent for the cryptographic fact — "signature S verifies under key K" is eternally true or false. 7913 therefore cleanly splits the problem: **suite-agnostic signature verification is solved and consumable** (§4.1); **authorization of K for principal P at time T is not addressed at all** (the spec is explicitly silent on time and identity, §1.3). The residual is exactly the second half.

**Use case:** the stolen-phone scenario that motivates R-K3 ([[assumptions-and-requirements]] §8): Alice revokes the phone Tuesday; Friday the phone signs a note claiming Monday. Any current-state oracle — 1271, 7913, `getIdentity` — answers identically on Monday-the-claim and Friday-the-fact, because *signatures carry no trustworthy creation time*. Only an ordering witness that observed the record while the grant was live can separate them. This is [[kel]] §8.2's admission-time ruling, re-derived from the account layer's own limits.

### 3.4 Gap (d) — recovered-signer admission needs a signed seam binding an authority epoch

**Confirmed.** After recovery (account-layer or KEL), new-signer records and old-thief records coexist as bytes. Without `authorityId + authEpoch` in the signed envelope and an epoch bump at recovery, a reader cannot mechanically distinguish "authorized under the pre-theft regime," "authorized under the recovered regime," and "thief signing after the fact." Account-layer recovery makes this *worse*, not better: rotation happens with no protocol event a record could even reference. The envelope seam ([[kel]] §8.1) plus O(1) epoch invalidation of the actor fleet ([[kel]] §7.2) is the minimal mechanism; nothing in AA offers a substitute or an obstacle.

**Break pairing:** the seam is only as good as its freeze — [[human-overview]] §7 seam 2 (two competing envelope identities) must be resolved in the coordinated re-cut, or suites will sign different transcripts for the "same" envelope. This lane adds one input: prefer transcript preparations that keep 7913-shaped verifiers usable as implementations (sign-over-canonical-semantic-bytes with per-suite preparation, exactly [[kel]] §5.5's design).

### 3.5 Two near-gaps that turn out to be theoretical (drop pressure)

Adversarial honesty requires naming candidates that did *not* survive as forced residual:

- **EFS-native session UX.** [[kel]] §7's session/app grants are required *as record-authorization objects*, but every user-facing session behavior (enrollment prompts, expiry display, spending-limit-style meters) should be consumed from the wallet/OS layer (7715-class UX). The residual is the grant *bytes and admission checks*, not a session system. §5 marks the SIMPLIFY.
- **EFS-native threshold ceremonies.** Given `MultiSignerERC7913` and Safe, EFS's `ControlPolicyV1` should not grow past its deliberately non-general two-clause form ([[kel]] §5.2); every richer policy is an account-layer or off-chain coordination job that terminates in either one actor signature or one control event. Confirmed as designed; resist future growth.

### 3.6 The residual, enumerated

The smallest EFS-specific layer the mission fences force, given universal smart accounts (each item names its forcing constraint):

1. **R1 — chain-free stable principal word.** Born-KEL digest derivation + bare-EOA zero state ([[kel]] §4.1, §4.4). Forced by realm portability + rotation (gaps a, b).
2. **R2 — suite registry + purpose-separated transcripts.** Pinned suite profiles (secp256k1 low-S, raw P-256, WebAuthn policy profile, future PQ) with canonical semantic-byte preparation and Codex fallback semantics; **consumes 7913-shaped stateless verifiers as implementations** ([[kel]] §5.5, §13, §14). Forced by verify-anywhere-forever (a verifier address is not a century spec — §3.3.ii).
3. **R3 — the envelope authority seam.** `author, authorityId, authEpoch` signed into every record, plus grant objects with record-shaped scopes and mechanical attenuation ([[kel]] §8.1, §7.2). Forced by gap (d) and by lens/attribution semantics.
4. **R4 — a minimal pre-rotating key-event chain.** INCEPT / ROTATE (full next-state commitment) / RECOVER / DEACTIVATE, with materialized O(1) state ([[kel]] §5.3, §6). Forced by gap (a) (signed, portable control history) + inversion row 3 (nothing else defends against current-key theft).
5. **R5 — admission ordering + receipts.** `EnvelopeAuthReceipt` / `ClaimAdmission` in kernel state at the authority domain, with the evidence/authority lane split ([[kel]] §8.2–8.3). Forced by R-K3 **if D-1 = yes** (held in [[owner-decision-inbox]]; this lane's evidence strengthens the yes but does not answer it — §3.3's use case is unservable otherwise).
6. **R6 — portable proofs + evidence renewal.** `AuthProof` wrappers over finalized bases; RFC-4998-style renewal and algorithm-epoch grading ([[kel]] §9, §14). Forced by 100-year verification + PQ row 8.
7. **R7 (conditional) — a home-binding seam.** Only exists if the topology is not one fixed profile; the minimal shapes are genesis-committed (immutable, already inside R1's derivation) vs. an updatable L1 pointer. This is the T2 / James-axis item (§6.2), not a settled residual piece.

Everything in [[kel]] not covered by R1–R7 should be consumed from the account layer or demoted to convention. §5 does that mapping. Note what the list is *not*: no wallet, no funds recovery, no session UX, no threshold ceremony engine, no bridge, no locator (conditionally), no PQ transaction format. The residual is an evidence layer, roughly: **one ID derivation, one transcript discipline, one envelope seam, one small state machine, one receipt store, one proof/renewal format**.

---

## 4. The shrink test

**Question (ruling):** has 7913/native-AA converged enough that the EFS residual can shrink to a REFERENCE/BRIDGE (EFS consumes account-layer verification through an adapter) rather than a rebuild (EFS carries its own KEL event machine)?

**Honest answer: reference for cryptography, thin rebuild for authorization state — and the evidence says this split is stable, not transitional.**

### 4.1 Where the answer is "reference" — adopt it now

Suite-level signature verification should be consumed, not rebuilt:

- Adopt **ERC-7913's `(verifier, key)` abstraction** as the dispatch shape for actor witnesses. It is Final, stateless-by-spec, and shipped (OZ P-256 / RSA / WebAuthn verifiers, §1.3). [[kel]] §5.1's `KeyDescriptorV1` should be re-cut to make `(suiteId, canonicalPublicKey)` explicitly 7913-compatible (`keyFamilyId` normalization survives as EFS's addition; `verifierProfileHash` survives because 7913 carries no policy — RP/origin/UV profiles are EFS residual).
- Permanence constraint on the adapter: an immutable EFS kernel may *call* a pinned, immutable, stateless verifier contract, but the **Codex pins the verification semantics** and a fallback implementation, so a century verifier can re-verify without the contract ([[kel]] §4.1 already does this for secp256k1 against draft EIP-8151's state-dependent `ecrecover`; generalize the pattern). A verifier *address* is chain-local; a verifier *spec* is portable. Mutable or stateful verifiers (including 7913 threshold signers) never enter the authority path.

### 4.2 Where the answer is "rebuild (thin)" — and why the adapter cannot reach

The event machine (R4) and receipts (R5) cannot be an adapter over account state, for reasons that are structural, not maturity-gated:

1. **No account object is portable evidence** (gap a). An adapter can only re-expose chain-local answers; the export/walk-away and cross-realm-attribution use cases need signed artifacts.
2. **No account layer has pre-rotation** (row 3). Consuming account rotation as control rotation imports current-key-owns-the-future, which the 7702 crime data shows failing at population scale.
3. **No account layer records authorization history** (rows 5–6). Receipts are an EFS kernel behavior by definition — they exist at *record admission*, an event the account layer does not have.
4. **Native AA is transaction-shaped even when finished.** EIP-8141 lets an account choose validation *for its transactions*; EIP-8130 authenticates *transactions*. Neither touches a chain-free record witness ([Base review](../2026-07-19-base-native-aa-impact.md), reaffirmed).

### 4.3 What would change the answer

State the falsifiers so a later pass can re-run this test cheaply:

- **Would shrink R4/R5 to an adapter:** a shipped, credibly neutral, protocol-level *signed key-event registry* — i.e., someone else ships KERI-grade semantics (full next-state commitment, signed transcripts, ordering receipts) as an Ethereum-ecosystem standard with independent implementations. Nothing like it is proposed in the 4337/7702/7913/8130/8141 lineage (all checked 2026-07-25). did:plc is architecturally closest but is a single company-operated directory — it fails credible neutrality as-is.
- **Would shrink R6:** adopting a stronger reading of chains-don't-die — "archival state at historical blocks stays queryable forever" — would let receipt+state-proof substitute for part of the signed-transcript surface. That is an owner scope call on the T1 axis (§6.1), and even then receipts themselves (R5) remain EFS-side.
- **Would shrink R2:** EIP-8141 shipping with a canonical authenticator registry whose semantics are frozen and reimplementable could become *a* pinned suite source. Watch Hegotá; do not wait for it.
- **Would force re-expansion:** if E1 venue measurement selects a venue without adequate state-proof/finality access, R6's proof wrapper grows. Flagged for the E1 evidence gate ([[owner-decision-inbox]] E1).

### 4.4 Consequence for sequencing

Because the residual core (R1–R6) is invariant across every N1 topology option ([[assumptions-and-requirements]] §9 Options A–D differ only in *where* R5's witness lives and whether R7 exists), the coordinated re-cut of envelope/kernel/KEL can proceed on R1–R6 without waiting for the topology decision — with R5 written venue-parametric and R7 held. That is this lane's main de-risking gift to the pass: **the seam does not depend on the sovereignty answer.**

---

## 5. kel.md section map — KEEP-AS-RESIDUAL / REPLACE-WITH-ACCOUNT-LAYER / SIMPLIFY / DROP

Dependency direction throughout: KEL → smart account, never the reverse ([[kel]] §12; R-D8).

| [[kel]] section | Disposition | Reason |
|---|---|---|
| §0–§2 (decision page, invariants, terms) | **KEEP** (re-word) | The 12 invariants survive inversion intact; §0's topology paragraphs already carry the demotion banner. Terms table gains "verifier (7913)" as a distinct non-authority role. |
| §3 (why the old reservation fails) | **KEEP** as rationale record | Unchanged; historical. |
| §4.1 bare EOA zero state | **KEEP** (residual R1) | Adopted ruling; also the weak grade's anchor (§6.4). The EIP-8151 exclusion (state-dependent `ecrecover`) re-verified as the right call — Draft status unchanged. |
| §4.2 first-use legacy upgrade commitment | **SIMPLIFY / re-home** | The mechanism (salted commitment, committed-factors reveal, honest lost-preimage cost) survives; its *venue* is written L1-`HomeRegistry`-dependent and must be re-cut venue-parametric (authority-domain registry under fixed profile; L1 only if R7 chooses the pointer). Account layer offers no substitute: a 7702 delegation cannot serve as a theft-resistant commitment because the key can always overwrite it (§1.1). |
| §4.3 in-place EOA upgrade | **KEEP-SIMPLIFY** | Core path; strip locator references per §4.2's re-cut. |
| §4.4 born-KEL identity | **KEEP** (residual R1) | The chain-free principal is the load-bearing answer to gaps (a)/(b). Note: `authorityHomeRef` inside `GenesisBodyV1` *is* the immutable home-binding option for T2 (§6.2). |
| §4.5 HomeRegistry + migration | **DROP from v2 baseline; retain as research profile** | Already demoted by the correction banner and [[assumptions-and-requirements]] H-K1–H-K4; the inversion adds: no account-layer mechanism motivates resurrecting it (row 7). Migration deferred to successor-identity story (D-6 recommended arm). |
| §5.1 KeyDescriptor | **SIMPLIFY toward 7913** | Re-cut `(suite, key)` to be ERC-7913-compatible; keep `keyFamilyId`, `verifierProfileHash`, `role` as EFS additions (7913 has no policy/role carriage). §4.1 of this file. |
| §5.2 ControlPolicy | **KEEP small; REPLACE ceremonies** | The two-clause AND grammar stays (PQ hybrid needs it); all richer coordination is consumed (Safe, MultiSignerERC7913, FROST adapters) and terminates in ordinary events/signatures, as §11.3 already rules. Do not let clauses grow toward a policy VM. |
| §5.3 full pre-rotation commitment | **KEEP** (residual R4 core) | The single most valuable EFS-specific mechanism; zero account-layer analogue (inversion row 3). |
| §5.4–§5.5 materialized state, transcripts | **KEEP** (residual R2/R4) | Transcript discipline is what keeps 7913 verifiers safely consumable. |
| §6 event state machine | **KEEP core; DROP `MIGRATE_PREPARE`** | INCEPT/ROTATE/RECOVERY_*/DEACTIVATE/DISAVOW survive; migration event drops with §4.5 (re-add only if R7's pointer arm is ever adopted). |
| §7 actors and grants | **KEEP structure; SIMPLIFY grammar** | Grant bytes + admission checks are residual R3. Cuts: `privacyClassSet` (already killed by [[human-overview]] §7 seam 11); review `venueSet` under the venue-parametric re-cut; keep record-shaped scopes (7715's asset-shaped vocabulary cannot express them, §1.6). Session *UX* is consumed (Permission Center renders; wallets prompt). |
| §7.4 `act` provenance | **KEEP** | Adopted ruling; reinforced by §1.1 (on-chain delegation state ≠ intent — never infer authority from graph labels or account state). |
| §8 envelope seam + admission + confluence split | **KEEP** (residual R3/R5) | The irreducible core. Seam-2/seam-3 re-cuts ([[human-overview]] §7) proceed topology-independent per §4.4. |
| §9 current vs historical verification | **KEEP** (residual R5/R6) | This is the two-question split the account layer cannot make (gap c). |
| §10 recovery | **SPLIT: factors REPLACE, policy machine KEEP-SIMPLIFY** | Factors/custody/UX: consume account-layer products (passkey-sync + independent cold factor is already the adopted baseline, [[owner-rulings]] 2026-07-16). The EFS-native part is only what interacts with *admission*: proposal/delay/finalize with nonces, `RECOVERY-PENDING` freeze, `DISPUTED-INTERVAL` grading. Guardian Merkle-leaf machinery and veto-clause richness are candidates for deferral — James axis J-2 below. |
| §11 user/org/persona model | **KEEP direction; consume mechanics** | Personas: adopted (separate KELs, local grouping). Orgs: Safe/7913-multisig coordinate; one operational actor signs; control events are the only EFS-native part (inversion row 9). |
| §12 account compatibility table | **KEEP-UPDATE** | Updates from §1: ERC-7913 → **Final** with shipped OZ verifiers (upgrade from "model"); EIP-7951 → live on mainnet since 2025-12-03 (Fusaka); EntryPoint v0.9 confirmed; EIP-7701 → **Withdrawn, superseded by EIP-8141** (Draft 2026-01-29); EIP-8130 → Base Cobalt Sept 2026 per the [impact review](../2026-07-19-base-native-aa-impact.md); ERC-7715 still Draft. All boundaries in the table survive. |
| §13 passkeys/WebAuthn | **KEEP profile; consume implementations** | The strict profile (UV for control/recovery, RP/origin policy, DER/low-S handling) is residual R2; `ERC7913WebAuthnVerifier` becomes *one* candidate implementation to differential-test, not the spec. L16's gates unchanged. |
| §14 PQ + century evidence | **KEEP** (residual R6) | Evidence renewal has no account-layer analogue and never will (§1.8). Track EIP-8141 as the eventual *transaction* agility rail only. |
| §15 Tier-1 ABI + grades | **KEEP minus `resolveHome`** | Bounded reads and the grade vocabulary survive; `resolveHome` exists only under R7's pointer arm. Grades feed the mount check (§6.5). |
| §16–§19 impact/procedures/forks/loose-ends | **KEEP-RECUT** | Mechanical follow-through of the above; §18 fork 8 (per-principal homes) is already demoted — restate as held N1 axis. |
| §20 reservation ledger | **KEEP with re-tags** | Items touching HomeRegistry/migration move to the research profile; 7913-alignment adds one new vector family (verifier-spec vs verifier-contract divergence tests). |
| §21 failure register | **KEEP + add two rows** | Add: "malicious/compromised 7913 verifier contract" (mitigation: pinned spec + fallback + immutability requirement; residual: none if spec-first) and "account-adapter consumes forged account metadata" (mitigation: adapters treat account state as untrusted input, bounded parsing, no authority inference — the kernel-facing-daemon hazard named by the pass frame). |
| §22 verification gates | **KEEP + extend** | Add differential tests: 7913 verifier implementations vs Codex fallback; 7702-delegated EOA attempting KEL events (must be inert); account-upgrade-then-verify historical receipts. |
| §23 decisions for James | **SUPERSEDE items 1–2 wording; keep 3–5** | Item 1 (ratify §4.5 topology) is superseded by the held N1 decomposition; item 2 (ship vs reserve) is restated by this lane as the residual-boundary ratification (J-1). Items 3 (legacy commitment default-on), 4 (smart-account bootstrap), 5 (non-transferability) survive unchanged as inbox items. |

---

## 6. Tensions reconciled explicitly

### 6.1 T1 — chains-don't-die vs the dead-L2/L3-home worry

These reconcile by **scoping the adopted assumption**, not by picking a side. The 2026-07-10 ruling itself already contains the split ([[owner-rulings]]): *state persists and stays queryable* is assumed; *historical logs/archival availability* is explicitly NOT assumed (EIP-4444/state-expiry is why the full-body spine and receipts live in state). This lane adds the account-layer corollary: authorization evidence that depends on **archival account history** (what any read-the-account adapter needs) sits on the *unassumed* side of the ruling, while EFS receipts-in-state sit on the assumed side. So the residual design is compatible with chains-don't-die without extending it.

What remains genuinely open is the assumption's **membership scope**: "a blockchain persists" was ruled with Ethereum-class venues in mind; whether a two-year-old L3 qualifies is not answered anywhere ([[owner-rulings]] 2026-07-23 explicitly notes James's "L1 expensive / L2s transient" objection is an E1-measurement matter). This lane surfaces it as a **decision axis, not a silent default** — it is J-4's context and an explicit N1/E1 input: if the strong grade's home may be a transient L3, then either (i) the persistence assumption is qualified per venue class, or (ii) strong-grade homes are restricted to venues the assumption covers. Do not resolve here.

### 6.2 T2 — the candidate L1 pointer vs the cross-chain-machinery stop-rule

Per the 2026-07-23 correction, the stop-rule is a research posture, not a prohibition — so the pointer must be argued, not assumed away. Ruling 4 asks this lane to evaluate a minimal durable L1 pointer mapping an identity to its chosen L2/L3 home, with update semantics as the migration/home-death answer.

**Evaluation.** First, the account layer offers no alternative (inversion row 7) — if EFS wants per-identity home discovery, it builds the seam itself. The minimal shapes, priced honestly:

1. **No pointer (fixed profile / Option B).** Home is implicit in the protocol profile. Zero machinery, zero L1 cost, zero thief-re-home surface; the sovereignty cost is the known one ([[assumptions-and-requirements]] D-2 first arm). R7 vanishes.
2. **Genesis-committed home (Option C shape).** `authorityHomeRef` is already inside the born-KEL identity word ([[kel]] §4.4) — the principal *names* its home; discovery is free; a thief cannot re-home without changing the principal (§3.2). **Immutable = durable discovery, no same-principal re-home**; moving venues = successor identity with a continuity claim. No L1 dependency at all. Bare EOAs (no genesis) still need either the fixed default or a commitment row (§4.2's re-homed commitment).
3. **Updatable minimal L1 pointer (the ruling-4 candidate; kel.md `HomeRegistry` reduced).** Buys: same-principal re-home and a lightweight home-death answer; a re-pointer is not a state copy — but note it is also **not a rescue**: if the old home is truly unreadable, re-pointing does not recover the authoritative record graph, only future writes; and under chains-don't-die the old home *is* readable, which shrinks the pointer's main selling point to "cheap venue switching." Costs: every principal touches L1 once (fees/sponsorship); registry-version succession without an administrator (the hard problem [[kel]] §4.5 flags as a freeze blocker); update authorization = a new attack surface (a thief who wins control wins the *pointer* — re-homing becomes part of the theft playbook, mitigated only by the same delay/veto machinery as recovery); and a live cross-chain read (L1 → home) in every strongest-grade verification.

**This lane's recommendation:** shape 2 as the v2 design center — it satisfies ruling 4's "justify or prove unnecessary" by showing the *durable-discovery* half of the pointer's job is achievable with zero new machinery (it is already in the ID derivation), and the *re-home* half is deferrable to a successor-identity story consistent with the already-recommended D-6 arm. Shape 3 stays a research profile. This is recorded as J-4 for James because it constrains N1's axis 3 (none / adapters-only / locator) — under the sequencing hold it is an *input to the N1 decomposition*, not a batched answer.

### 6.3 T3 — large on-chain files vs the item-16 calldata line

Owned by the storage/large-files lane. This lane's only touchpoint: nothing in the residual layer (R1–R7) depends on file bytes being state-tier or calldata-tier — receipts, KEL events, and grant materializations are small state-tier objects under the full-body-spine ruling regardless. The identity layer imposes no new constraint on the T3 reconciliation; it only requires that *its own* artifacts never ride the DA-tier. No conflict.

### 6.4 T4 — two-grade hypothesis vs kel.md's maximal topology vs N1's axes: kept separable

Three objects, three different statuses, and the inversion keeps them apart:

- **The two-grade authority hypothesis** (James ruling 3, working hypothesis to validate or beat): the inversion *derives* it rather than assuming it. Weak grade = `PORTABLE-EVIDENCE` = what signature verification alone gives on any chain with zero setup; it structurally **cannot** promise anti-backdating, definite revocation, or absence ("no later record exists") — not from lack of engineering but because signatures carry no time and evidence chains can be withheld (§3.1, §3.3). Strong grade = `AUTHORITY-ADMITTED` = exactly what requires an ordering witness + receipt at an anchored home; its precise requirements are R5 + a finalized-basis read, and every read shows which grade it got ([[kel]] §15's vocabulary carries this). This answers charge ruling 7. The hypothesis is *validated as a floor/ceiling pair*; what the inversion does not settle is how many intermediate grades ([[assumptions-and-requirements]] §10's five-row axis) surface in product UX — a later lens/UX matter.
- **kel.md's maximal per-principal-home topology**: stays demoted ([[kel]] correction banner; H-K1–H-K4). The inversion neither revives nor buries it; it shows the residual core is invariant across topologies (§4.4), so the topology choice is *pure* N1 material.
- **N1's axes** ([[owner-decision-inbox]] N1's six-way decomposition): untouched and unanswered here. This lane feeds axis 1 (evidence that admission-time authority is what the strong grade *means*), axis 3 (the T2 evaluation above), and axis 6 (suite succession via R2/R6) — as inputs under the hold, per the 2026-07-23 correction.

### 6.5 The mount check (pass rule 9)

Every residual piece checked against the required read-only mount ([[mountable-filesystem-semantics]]): principals are fixed-width words (portable-name safe); authority grades are bounded enums projecting to `user.efs.*` xattrs within the adopted bounded-metadata profile; Tier-1 reads are O(1)/paginated ([[kel]] §15) so a mount resolver never replays a KEL; `UNKNOWN`/fail-closed grades map to the mount's honest-absence semantics; and nothing in R1–R7 requires interactive wallet state to *read* (verification is pure over public state + bundles). One flag: if J-2 keeps `RECOVERY-PENDING` freeze semantics, mounts must render pending-principal subtrees as stale-at-basis rather than absent — a resolver-contract line item for the mount lane, not a blocker.

---

## 7. What pure-local / chain-free mode keeps (brief; feeds the local-mode lane)

The weak grade *is* the chain-free identity story, and it is genuinely useful: signed envelopes + KEL event chains verify content, author-key binding, and internal order anywhere, forever, with zero infrastructure — good enough for personal archives, closed teams with out-of-band trust, and later bulk admission (evidence-promotion path, [[kel]] §8.1). The explicit cannot-do list without on-chain contracts: no anti-backdating (R-K3), no definite revocation or current-control answer, no absence/completeness claims, no admission receipts, no strongest grade, no contract composability. That list is exactly D-4's recommended arm restated; the local-mode lane owns the full treatment.

---

## Reconciliation ledger

Every existing choice/requirement this lane touched, with disposition:

1. **Headline frame (minimize EFS identity machinery; consume the account layer)** — **VALIDATED with a precise boundary** (§3.6, §4): consume crypto verification + execution/recovery products; residual = evidence layer R1–R7.
2. **KEL is required; bare EOA zero state; passkey-sync + cold factor baseline** ([[owner-rulings]] 2026-07-10/16) — **still-valid**; the inversion re-derives KEL's necessity from account-layer limits rather than weakening it.
3. **Dependency direction KEL → smart account; R-D8; ERC-1271/6492 ban for record authority** ([[kel]] §12; [[assumptions-and-requirements]]) — **still-valid, reinforced** by §1.1 field data and §3.3; nuance added: stateless 7913 verifiers admissible as pinned-spec implementations (this is not a 1271 exception — 1271 is stateful account code by definition).
4. **identity.md "No ERC-1271 anywhere, ever"** — **superseded-in-part already** by [[kel]] §12 (endpoint-UX evidence allowed); this lane confirms the surviving core (never record/KEL authority) and the 7913 nuance above.
5. **kel.md §4.5 per-principal L1 locator + migration** — **still-demoted; DROP from v2 baseline recommended** (§5); the account layer provides no motivation to revive it; re-home semantics re-homed to J-4/N1 axis 3.
6. **kel.md §23 decision 1 (ratify §4.5 topology)** — **superseded** by the held N1 decomposition ([[owner-rulings]] 2026-07-23); do not re-ask as written.
7. **kel.md §23 decision 2 (ship KEL-aware machinery vs reserve)** — **changed (restated)** as J-1 residual-boundary ratification; the underlying recommendation (build the seam before freeze) is unchanged.
8. **kel.md §23 decisions 3/4/5 (legacy commitment default-on; smart-account bootstrap; non-transferable personal principals)** — **still-valid** as inbox items; the bootstrap item gains support from §1 (deployed-account `msg.sender` inception remains the only account fact EFS should consume as a one-time chain-local event).
9. **kel.md §12 compatibility table** — **evidence-updated** (§5 row): 7913 Final+shipped; 7951 live 2025-12-03; EntryPoint v0.9; **EIP-7701 Withdrawn → superseded by EIP-8141 (Draft 2026-01-29)**; 8130 per [Base review](../2026-07-19-base-native-aa-impact.md); 7715 still Draft.
10. **`act` is provenance only; KEL grants authorize** (adopted) — **still-valid, reinforced** (§1.1: on-chain delegation state is routinely attacker-installed; never infer authority from it).
11. **Chains-don't-die** (adopted 2026-07-10) — **still-valid, scope-clarified** (§6.1): assumed = state persistence + current queryability; not-assumed = archival history; venue-class membership **newly-exposed** as an explicit axis (feeds E1/N1, J-4 context).
12. **Cross-chain bridge/hub/locator stop-rule** (2026-07-23 correction: research stop-rule, UNDECIDED) — **respected, not assumed**: T2 argued on merits (§6.2); recommendation defers the pointer without prohibiting it.
13. **Two-grade authority hypothesis** (this pass's ruling 3) — **validated as floor/ceiling** with exact content for each grade (§6.4); intermediate-grade surfacing left open.
14. **R-K3 / D-1 (anti-backdating)** — **still-held** in the inbox; this lane's §3.3 strengthens the "yes" evidence (no account-layer mechanism can substitute) without answering for James.
15. **L16 (P-256/WebAuthn activation)** — **evidence-gated, premise updated**: EIP-7951 live on mainnet since Fusaka (2025-12-03); gates (vectors, review, staffing) unchanged.
16. **Human-overview §7 seam 11 (`privacyClassSet` not verifiable)** — **still-valid**; §5 adopts the removal in the grant-grammar SIMPLIFY.
17. **Mount requirement as a data-model gate** (adopted 2026-07-22) — **checked and passed** for the residual layer (§6.5), one resolver line item flagged for the mount lane.
18. **Mandatory indexing / on-chain = metadata-exposed** (adopted 2026-07-15) — **still-valid, untouched**: grant first-use materialization and receipts are public graph metadata by construction; [[kel]] §7.2's disclosure-preview posture is the privacy answer, consistent with E11.
19. **kel.md §18 fork 8 ("per-principal co-located home selected by sparse L1 locator" ruled inside kel.md)** — **superseded** by the correction banner + this lane's §5/§6.2; restate as held N1 material wherever quoted.

---

## Decisions for James

Only genuinely-owner items. Under the 2026-07-23 sequencing hold these are **inputs to the revalidated packet**, not a batch to answer today; J-4 in particular feeds the N1 decomposition rather than standing alone. Reply with codes if answering voluntarily (e.g. `J-1A`).

### J-1 — Ratify the consume-vs-build boundary (the residual)

**Example:** a designer next month proposes an EFS-native session-key manager with its own enrollment UI. Under J-1A that proposal is rejected on sight: sessions-for-execution belong to wallets; EFS owns only the grant bytes and admission checks.

- **J-1A — Adopt the residual boundary: EFS builds only R1–R6 (§3.6) and consumes everything else (execution accounts, gas, sponsorship, passkey/guardian products, threshold ceremonies, session UX) from the account layer. Recommended.** This is [[kel]] §23 decision 2 restated with an exact perimeter, and it makes "no wallet rebuilding" enforceable in review.
- **J-1B — Adopt with named exceptions** (state which account-layer surface EFS should own anyway, and why permanence forces it).
- **J-1C — Keep the boundary advisory.** Every future pass re-litigates it; scope creep risk is the known cost.

Reason trail: §2 (inversion table), §3.6 (residual list), §4 (shrink test); [[kel]] §12; [[assumptions-and-requirements]] R-D8; [Base native-AA impact](../2026-07-19-base-native-aa-impact.md).

### J-2 — Recovery machinery locus

**Example:** Alice's keys are stolen; recovery is proposed. Under the full [[kel]] §10 design, EFS itself enforces the delay, a veto clause, and marks records arriving mid-recovery `DISPUTED-INTERVAL`. Under the consumed alternative, "recovery" is whatever rotates Alice's control factors (e.g. her account-layer guardian product), and EFS merely observes the new state at the next admission — simpler, but a reader can never distinguish records the thief slipped in during the contested window.

- **J-2A — Keep a minimal EFS-native recovery policy machine (propose/delay/finalize + nonces + `RECOVERY-PENDING` freeze + `DISPUTED-INTERVAL` grading), while consuming all recovery *factors* and coordination UX from account-layer products. Recommended.** Preserves the honesty guarantees that interact with admission; defers guardian-Merkle richness and exotic veto profiles.
- **J-2B — Fully consume recovery:** control rotation is an ordinary event however the factors were coordinated; drop pending-freeze and disputed-interval semantics. Smallest machinery; gives up the contested-window story entirely (and E10's recovery-acceptance gate then evaluates a weaker promise).
- **J-2C — Keep the full §10 design** including committed guardian trees and veto clauses at launch. Strongest semantics, largest freeze surface, most UX EFS must own.

Reason trail: §2 row 4, §5 (§10 split); [[kel]] §10, §21; [[owner-rulings]] 2026-07-16 (passkey-sync + cold factor); [[owner-decision-inbox]] E10, L17.

### J-3 — May a smart account BE a principal's ongoing control authority?

**Example:** a DAO wants "our Safe is our EFS identity — whoever the Safe says, EFS obeys, forever." Convenient, but the Safe is mutable code+storage on one chain: a century verifier of a 2027 record can only trust the receipt that the home once observed the Safe approve — there is no portable signed transcript of *why*, and a later malicious upgrade taints the meaning of "the Safe approved" (§3.3).

- **J-3A — No: accounts bootstrap (one-time inception call), bind as endpoints, and coordinate approvals that terminate in ordinary signed control events; the ongoing control authority is always KEL key material. Recommended** — this is [[kel]] §11.3/§12 continued; receipts stay actor-attributed and transcript-verifiable.
- **J-3B — Yes, as an explicitly weaker principal class** ("account-rooted": receipt-only control provenance, honestly graded, excluded from strongest-grade claims). Eases org onboarding; adds a permanent second control semantics and a new grade to every reader.

Reason trail: §3.1, §3.3; §2 rows 1/5/9; [[kel]] §11.3, §12 (bootstrap boundary), §21.

### J-4 — Home-binding seam shape (T2; feeds N1 axis 3 — do not answer as a topology adoption)

**Example:** Alice's strong-grade home is an L3 that she later wants to leave. Under a fixed profile there is nothing to decide. Under a genesis-committed home her principal *names* its home forever — discovery is free and a thief cannot re-home her, but leaving means a successor identity. Under an updatable L1 pointer she can re-home the same principal — and so can a thief who wins her control, after the same delay machinery as recovery; plus EFS must run an adminless L1 registry forever.

- **J-4A — Design center: home committed at inception (inside the born-KEL identity word; commitment row for bare EOAs); same-principal re-home deferred to a successor-identity continuity story; the fixed-profile case is the degenerate form. Recommended** (§6.2: the pointer's durable-discovery half comes free; its re-home half is its entire remaining value and is deferrable under chains-don't-die).
- **J-4B — Build the minimal updatable L1 pointer** now (ruling-4 candidate): buys lightweight re-home; costs L1 registration for every anchored identity, adminless registry succession, and a thief-re-home surface guarded by delay/veto.
- **J-4C — Fixed profile only, no per-identity binding at all** (pure Option B): zero machinery; the sovereignty cost is the D-2 first arm's known one.

Also decide the T1 scope question this rides on: does "chains don't die" cover any venue a user may anchor to, or only an explicit venue class (with E1 measuring candidates)? Reason trail: §6.1, §6.2; [[kel]] §4.4–4.5; [[assumptions-and-requirements]] §9 Options B/C/D, H-K1–H-K4; [[owner-rulings]] 2026-07-23 (stop-rule correction + L2-transience note); [[owner-decision-inbox]] N1, E1.

---

## Confidence

### VERIFIED (primary source, fetched 2026-07-25 unless noted)

- ERC-7913 status **Final**, created 2025-03-21; `verify(bytes,bytes32,bytes)` interface; "Verifiers SHOULD be stateless"/pure; no time/history/identity semantics in the spec ([eips.ethereum.org/EIPS/eip-7913](https://eips.ethereum.org/EIPS/eip-7913)).
- EIP-7702 status **Final**; delegation indicator `0xef0100||address`; zero-address clearing; `chain_id = 0` cross-chain authorization applied per-chain ([eips.ethereum.org/EIPS/eip-7702](https://eips.ethereum.org/EIPS/eip-7702)); shipped in Pectra 2025-05-07 (widely corroborated).
- EIP-7701 status **Withdrawn (superseded by EIP-8141)** ([eips.ethereum.org/EIPS/eip-7701](https://eips.ethereum.org/EIPS/eip-7701)).
- EIP-8141 status **Draft**, created 2026-01-29, frame transactions with account-chosen validation, no fork assignment in the EIP ([eips.ethereum.org/EIPS/eip-8141](https://eips.ethereum.org/EIPS/eip-8141)).
- EIP-7951 included in Fusaka; mainnet activation 2025-12-03 21:49:11 UTC ([EF blog](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement)).
- EIP-8130 Draft; Base Cobalt target September 2026; Vibenet live; boundary analysis — from the in-corpus [2026-07-19 review](../2026-07-19-base-native-aa-impact.md) (itself citing the EIP and Base's announcement).

### VERIFIED-secondary (consistent multi-source reporting; primary not re-fetched)

- EntryPoint v0.8 (native 7702 support) and v0.9 (top-level-EOA `handleOps` hardening) exist and are current ([eth-infinitism releases](https://github.com/eth-infinitism/account-abstraction/releases), [erc4337 substack](https://erc4337.substack.com/p/improving-useroperation-execution)); consistent with [[kel]] §12's v0.9.0 check of 2026-07-11.
- OpenZeppelin ships `ERC7913P256Verifier` / `ERC7913RSAVerifier` / `ERC7913WebAuthnVerifier` / `SignerERC7913` / `MultiSignerERC7913(Weighted)` / `SignatureChecker` integration ([OZ docs](https://docs.openzeppelin.com/contracts/5.x/multisig), [community changelog](https://github.com/OpenZeppelin/openzeppelin-community-contracts/blob/master/CHANGELOG.md)).
- ML-DSA/SLH-DSA final 2024; Ethereum PQ account path routes through native-AA signature agility with core infra targeted ≈2029 ([ethereum.org](https://ethereum.org/roadmap/future-proofing/quantum-resistance/), [pq.ethereum.org](https://pq.ethereum.org/)).

### PLAUSIBLE (directionally solid; exact figures not independently reproducible here)

- 7702 abuse statistics: ">80% of delegations linked to CrimeEnjoyor" (Wintermute, June 2025) and later ">97% of delegations to same-code sweepers"; $1.54M single phishing loss (Aug 2025). Sources are reputable ([Coindesk](https://www.coindesk.com/tech/2025/06/02/post-pectra-upgrade-malicious-ethereum-contracts-are-trying-to-drain-wallets-but-to-no-avail-wintermute), [dev.to](https://dev.to/ohmygod/the-crimeenjoyor-epidemic-how-eip-7702-delegation-phishing-drained-450k-wallets-and-how-to-e2g), [Cryptopolitan](https://www.cryptopolitan.com/eip-7702-user-loses-1-54m-phishing-attack/)) but the percentages are point-in-time Dune analyses. The structural argument (§1.1) does not depend on the exact figures.
- ERC-7715 "Draft as of April 2026"; "200M+ smart wallets" — aggregator reporting ([eco.com](https://eco.com/support/en/articles/11953354-erc-7715-explained-wallet-permissions-sessions-and-subscriptions)); MetaMask shipping Advanced Permissions is vendor-confirmed ([metamask.io](https://metamask.io/news/introducing-advanced-permissions)).
- `MultiSignerERC7913` stores signer sets in account storage (hence stateful) — inferred from OZ documentation of the design; the §4.1 argument survives even if the storage layout differs, since *changeable membership* is stateful by definition.
- Safe >$100B secured (early 2026), Kernel most-deployed ERC-7579 account, 24–72h guardian timelocks typical — 2026 survey reporting ([eco.com recovery survey](https://eco.com/support/en/articles/15254048-smart-wallet-recovery-2026-social-multisig-passkey-options)).

### Could not verify

- Whether EIP-8141 is formally proposed-for-inclusion in Hegotá (only social/secondary claims; the EIP itself names no fork). Treated as "candidate, unscheduled."
- Current (July 2026) 7702 delegation counts and benign/malicious ratio — no fresh primary dashboard fetched; only 2025-era analyses cited.
- Live status of every OZ verifier audit; treated as "shipped reference code," not "audit-passed for EFS use" — the §4.1 pinned-spec posture is designed so this does not matter.
- Whether any Ethereum-ecosystem project is building a signed key-event registry that would trigger §4.3's first falsifier — searched, none found; absence of evidence noted as such.
