# Wallet, signing, session, and batching standards — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** wallet-standards. **Date:** 2026-07-07.

## Thesis (read this first)

The single most important finding for EFS: **the exact EFS envelope pattern — one EIP-712 signature over a Merkle root of many independently-extractable records — is now a named, drafted Ethereum standard: ERC-7920 "Composite EIP-712 Signatures" (Draft, 2025-03-20).** A sibling draft, ERC-7964 "Crosschain EIP-712 Signatures" (2025-06-05), standardizes the chain-free / cross-chain-replayable half. EFS is not inventing a signing scheme; it is riding a young but real standards track. This is very good news, with two sharp edges:

1. **Wallets cannot expand a Merkle root.** A hardware or software wallet signing an EFS envelope sees a `bytes32` root plus whatever header fields the struct exposes — never the 400 records inside. Legible preview of "what am I committing" is therefore **the EFS Shell's job, not the wallet's.** The wallet's job shrinks to "you are signing multiple messages at once" (ERC-7920's own MUST) plus an ERC-8213-style digest the user can cross-check. This validates the handoff's "secure prompt surface" / Shell-owned checkpoint instinct.
2. **EFS identity is a smart account (per project memory), but EFS envelopes are off-chain EIP-712.** Off-chain signatures from a contract account are *not* verifiable with `ecrecover` — they need **ERC-1271** (`isValidSignature`) and, for not-yet-deployed accounts, **ERC-6492**. If EFS envelope verification is hard-wired to EOA `ecrecover`, it silently locks out smart-account identities, session keys, passkey/P-256 signers, and 7702-delegated accounts. This is the biggest protocol-level requirement surfaced by this lane.

Everything else (4337, 7702, 5792, 7715/7710, paymasters, passkeys, clear-signing) is infrastructure that either helps the flush engine or teaches it what not to do.

---

## A. WHAT EXISTS TODAY (shipped, in production mid-2026)

### ERC-4337 — Account Abstraction via alt-mempool (Final; EntryPoint v0.8 shipped)
- **Reality by the numbers (BundleBear, live dashboard 2026-07):** ~61.6M smart accounts that have sent ≥1 UserOp; ~1.19B UserOps lifetime; ~$13.0M cumulative gas covered by ERC-4337 paymasters. (Note: AI-content-farm summaries claiming "$180M sponsored" and "40M accounts" are **unverified**; BundleBear's on-chain-measured $13M is the defensible floor. Much Base sponsorship happens outside the standard 4337 paymaster metric, so real sponsorship is higher than $13M but nowhere near $180M.)
- **EntryPoint v0.8** (2025, address `0x0000000071727De22E5E9d8BAf0edAc6f37da032` for v0.7; v0.8 is a new deploy) added **native EIP-7702 support**, an EIP-712-based UserOp hash, and a **`Simple7702Account`** reference wallet — a fully audited minimal SCA any EOA can delegate to. This is the "one contract does both 7702 and 4337" convergence.
- **Bundler concentration is real** (Pimlico, Alchemy/Coinbase dominate the long tail). For EFS this matters only if EFS ever routes through a bundler; the privacy lens (a bundler is an HTTP observer that sees your UserOp) applies.

### EIP-7702 — Set Code for EOAs (Final; live on mainnet since Pectra, 2025-05-07)
- Tx type `0x04` carries an `authorization_list` of `[chain_id, address, nonce, y_parity, r, s]`. Processing writes a 23-byte delegation indicator `0xef0100 || address` into the EOA's code slot; all `CALL`/`DELEGATECALL` then run the delegate's code in the EOA's context. Revoke by re-delegating to the zero address. `chain_id = 0` = valid on any chain (dangerous). Nonce increments before execution.
- **Adoption:** MetaMask, Rabby, Trust, Ambire and others shipped 7702 delegation UX through late 2025. >11,000 authorizations in the first week post-Pectra; steady Type-4 growth since. The dominant deployment shape is a **dual-mode wallet contract** supporting both plain 7702 txs and 4337 UserOps.
- **Spec-level security warnings** (baked into the EIP): "a poorly implemented delegate can allow a malicious actor to take near-complete control of a signer's EOA"; storage-collision risk when migrating delegates (use ERC-7201 namespaced storage); relayer griefing (delegated account can sweep/invalidate mid-tx).

### EIP-5792 — Wallet Call API (Final)
- Methods: `wallet_sendCalls`, `wallet_getCallsStatus`, `wallet_showCallsStatus`, `wallet_getCapabilities`. This is the **on-chain batch** rail (send N calls, atomically if the wallet supports it).
- **`atomic` capability** has three states: `supported` (atomic + contiguous), `ready` (can upgrade pending user approval), `unsupported`. Requests set `atomicRequired`. Status codes: 1xx pending, 2xx confirmed, 4xx off-chain failure, 5xx chain failure.
- **Capabilities are the extensibility spine** the whole modern stack hangs off: `paymasterService` (ERC-7677), `sessionKeys` (ERC-7715), `flow-control`, `auxiliaryFunds`. Support as of 2026: MetaMask, Coinbase Wallet/Smart Wallet, Rainbow, Trust, thirdweb.
- **Note the distinction for EFS:** 5792 batches *transactions/calls*. The EFS envelope is *not* a 5792 batch — it is one off-chain EIP-712 signature (ERC-7920 shape) that is *later* submitted (possibly via a single tx or UserOp). 5792 is relevant only for the submission leg if EFS bundles the on-chain publish call with other calls.

### EIP-6963 — Multi Injected Provider Discovery (Final since Oct 2023; universal)
- Event-based (`eip6963:announceProvider` / `requestProvider`) replacement for the `window.ethereum` land-grab. Every major wallet ships it. Carries name, icon, UUID, rDNS.
- **For EFS this is the baseline for wallet selection** in the Bootstrapper/Shell — but note it is *injected-extension* discovery, which presumes an ambient extension in the page. In EFS's zero-ambient, Kernel-mediated model, 6963 is a discovery input the Kernel brokers, not something Ring-3 apps touch directly.

### EIP-712 + ERC-1271 + ERC-6492 — the signing substrate
- **EIP-712** (Final) is the typed-data signing EFS envelopes use. Wallets render struct fields; a `bytes32` (like a Merkle root) renders as an opaque hash. Rendering quality varies wildly by wallet; hardware wallets that can't page the full struct fall back to a digest (blind-sign threat model).
- **ERC-1271** `isValidSignature(bytes32,bytes)` (Final, widely adopted — OpenSea, Safe, all SCAs) lets a *contract* validate a signature. **Mandatory for any smart-account attester.**
- **ERC-6492** (backward-compatible with 1271 and EOAs, supports EIP-712) validates signatures for **counterfactual (not-yet-deployed) smart accounts** by wrapping a factory deploy in the sig blob. Essential so a brand-new EFS user with an un-deployed smart account can still sign a verifiable envelope. ethers.js/viem added utils through 2025.
- **EIP-5267** (`eip712Domain()`) lets a contract advertise its domain — relevant so verifiers/wallets can reconstruct the EFS domain separator for smart-account attesters.

### RIP-7212 → EIP-7951 — P-256 / secp256r1 precompile (L2s since 2024; **mainnet since Fusaka 2025-12-03**)
- **RIP-7212** put a secp256r1 verify precompile on L2s (Polygon Apr 2024, then OP Stack / Base / Arbitrum One+Nova / zkSync / Kakarot). Cost ~3,450 gas vs ~300k in Solidity.
- **EIP-7951** is the mainnet version, **Final, live on Ethereum L1 since the Fusaka upgrade (2025-12-03, slot 13,164,544)**, at address `0x100`, **6,900 gas**. It *supersedes* RIP-7212 with identical interface (160-byte input, 32-byte output) but fixes two RIP-7212 consensus bugs (point-at-infinity, modular `r` comparison). Same bytecode/callers work.
- **Why EFS should care:** this makes **passkey / WebAuthn (P-256) signatures cheaply verifiable on-chain everywhere, including L1.** A passkey can be a first-class EFS signer without a 300k-gas tax.

### WebAuthn passkeys as Ethereum signers (shipped)
- **Coinbase Smart Wallet** (GA 2024-06-05): ERC-4337 SCA whose *only* default signer is a **WebAuthn passkey (P-256)**, no seed phrase, up to 2^256 owners, each transacts independently. Signature is an ABI-encoded `WebAuthnAuth` struct verified against the P-256 curve (now via the precompile). Recovery = "log in on a new device, present passkey"; optional on-chain recovery key. **Failure mode: lose all synced devices + cloud backup = unrecoverable, same as any passkey login.**
- Passkeys sync via iCloud Keychain / Google Password Manager — convenient but means **the signer is escrowed to Apple/Google, not hardware-bound.** A device-bound (non-synced) passkey is more sovereign but loses cloud recovery.

### Embedded-wallet infrastructure (the "invisible wallet" market, consolidated 2025)
- **Privy** — acquired by **Stripe (2025-06)**. EOA-per-user model; key split across TEE + Shamir shares; email/social/passkey auth. Now inside Stripe/Bridge stablecoin rails.
- **Turnkey** — low-level TEE signer (100–150 ms), policy-engine, chain-agnostic (EVM/Solana/BTC/TRON). Treasury/operator-key positioning.
- **Dynamic** — acquired by **Fireblocks (2025-10)**; MPC, unified embedded+external, 40M+ users.
- **Coinbase CDP Embedded Wallets** — MPC + optional smart accounts.
- **MetaMask Delegation Toolkit / Smart Accounts Kit** — the 7715/7710/7702 stack (see below).
- **Pattern in the wild:** teams past ~100k wallets run *two* providers — a consumer embedded wallet (Privy/Dynamic/Coinbase) plus a policy signer (Turnkey/Fireblocks). Relevant to EFS's "persona wallets" instinct (main / burner / offline / app-hot-key).

---

## B. WHAT IS EMERGING (drafts, betas — status + date)

### ERC-7920 — Composite EIP-712 Signatures  ⭐ (Draft, 2025-03-20, Sola Ogunsakin)
**This is the EFS envelope, standardized.** Encode N EIP-712 messages as leaves of a keccak256 Merkle tree; the user signs only the `merkleRoot`. Verification is two-step: `ecrecover` the sig on the root, then a Merkle proof (`O(log2 N)`) for each message. Returns `{signature, merkleRoot, proofs[]}`. **Backward compatible: N=1 produces a byte-identical `eth_signTypedData_v4` signature.** Leaves padded to power of two, pairs sorted lexicographically.
- **Wallet display MUST:** "Wallets MUST communicate to users that they are signing multiple messages at once" and "MUST display all message types before signing." It **recommends a max of 10 messages** for digestibility.
- **Tension for EFS:** EFS bulk imports (photo archives, migrations, package registries) can be hundreds of records — an order of magnitude past the "10-message" comfort line. ERC-7920 gives the cryptographic shape but *not* a legibility answer for large batches; that remains EFS Shell UX.
- It recovers to an EOA via `ecrecover` — so for smart-account attesters EFS must layer ERC-1271/6492 on top (7920 as written assumes EOA).

### ERC-7964 — Crosschain EIP-712 Signatures (Draft, 2025-06-05, Ernesto García / OZ)
Omit `chainId` from the top-level `EIP712Domain`; put each operation's `chainId` inside the message array. **Intentionally enables replay across chains** — the same signature is meant to be usable on many chains, with nonces/deadlines/account-validation preventing *unauthorized* reuse. Requires EIP-712, **EIP-1271**, EIP-5267. This is the standards-track articulation of EFS's "chain-free envelopes, records independently replayable cross-chain, venue-relative truth." EFS's design instinct is validated by an active EIP.

### ERC-7677 — Paymaster Web Service Capability (Draft, but shipped by Pimlico/Biconomy/Coinbase)
A 5792 capability: `pm_getPaymasterStubData` (gas-estimation stubs, optional `isFinal`) and `pm_getPaymasterData` (final values). App passes a `{url, context}` and the wallet calls the paymaster service. **Key privacy pattern:** apps proxy through *their own backend* to keep paymaster API keys secret — meaning the paymaster/relayer sees the UserOp and can decline. This is exactly EFS's "sponsor/self-pay switchboard: the relayer can see content and is not the author."

### ERC-7715 (`wallet_requestExecutionPermissions`, formerly `wallet_grantPermissions`) + ERC-7710 (delegation) — session keys
- **ERC-7715** (Draft, 2024-05-24; authors incl. Dan Finlay, Derek Chiang, Pedro Gomes): DApp requests scoped, time-bounded permissions (a `PermissionRequest[]` with `type`, `isAdjustmentAllowed`, `data`, and rules like `ExpiryRule`). Response carries an opaque `context` (for revoke/redeem), a `delegationManager` address, and factory `dependencies` for counterfactual accounts.
- **ERC-7710** (delegation redemption interface): the on-chain half — `redeemDelegation()` against a delegation manager; caveat enforcers reject out-of-scope executions on-chain.
- **Who ships:** **MetaMask "Advanced Permissions"** went to production in **April 2026** (built on 7715 + 7710 + Delegation Framework; caveat-enforcer-based spend limits, periodic transfers, streaming allowances, revocation; human-readable approval showing asset/amount/duration). Also Rhinestone (7579 modules), Biconomy, Coinbase Smart Wallet. The Gator 7715 Snap got a Consensys Diligence review (2025-08). **Still Draft as an ERC despite multiple production implementations.**
- **Critical caveat for EFS:** these permissions are enforced **on-chain by a smart account** and are designed for *value* operations (spend limits, subscriptions, DCA, agent spending). They do **not** natively constrain *off-chain* EIP-712 envelope signing. A 7715 session key that signs an EFS envelope would produce a signature recovering to the *session key's address*, not the user's identity — breaking lens keying unless the attester is a smart account and the session key acts through it.

### ERC-7846 — Wallet Connection API (Draft, 2024-12-17, "conner" / Coinbase)
`wallet_connect` merges connect + auth in one call, building on 5792 capabilities; positioned as "on-chain-native OAuth" (SIWE, verifiable credentials, ZK/membership proofs at connect time). Debate over single-vs-multi account return and EVM-specificity vs CAIP-222/300. Relevant if EFS wants capability negotiation *at connect*, but note the chicken-and-egg: you can't request capabilities before a connection, so try/catch fallback is required.

### ERC-7730 (clear-signing descriptors) + ERC-8213 (digest fallback) — legibility rails
- **ERC-7730** (Draft, created 2024-02-07, schema v2, Ledger-origin): JSON descriptors that tell a wallet how to render **calldata, EIP-712 typed messages, UserOps (4337), AND EIP-5792 batches** in human-readable form (e.g. `uint256` → "1 DAI"). **It explicitly covers EIP-712 messages** — the schema is extracted from the type string in `display.formats`.
- **Governance shift:** Ledger **transferred stewardship of the Clear Signing registry to the Ethereum Foundation** (Trillion Dollar Security Initiative); EF launched "Clear Signing" publicly **2026-05-12** (clearsigning.org). Contributors: MetaMask, Ledger, Trezor, Keycard, Fireblocks, WalletConnect, Cyfrin, ZKnox. Registry is neutrally hosted and independently mirrorable.
- **ERC-8213** is the cryptographic **fallback**: when no 7730 descriptor resolves, the wallet displays a short deterministic **digest** the user can independently verify (e.g. `keccak256(len || calldata)` for calldata; the standard EIP-712 domain+message digest for typed messages). "What You See Is What You Sign" even without metadata.
- **For EFS:** EFS can publish a **7730 descriptor for its envelope EIP-712 schema** so clear-signing wallets render record counts / kinds / targets legibly. And for a Merkle-root batch that can't be expanded, **ERC-8213's digest is exactly the cross-check primitive** — the EFS Shell displays the full legible batch and its computed root; the wallet/device shows the same digest; user confirms they match.

### WebAuthn PRF & largeBlob — passkey-derived keys and blob storage
- **PRF extension** (WebAuthn L3, over CTAP2 `hmac-secret`): during `navigator.credentials.get()`, the RP supplies salt(s) and the authenticator returns a deterministic 32-byte HMAC-SHA-256 secret, usable as symmetric key material. **Support 2026:** Android/Google Password Manager broad (not Firefox); macOS 15+ Safari 18 / Chrome 132 / Firefox 139 via iCloud Keychain; iOS/iPadOS 18.4+ (18.0–18.3 had data-loss bugs); Windows 11 25H2 (Feb 2026 KB) + Chrome/Edge 147 / Firefox 148. **Crucially: PRF output stays stable when a passkey syncs across devices** — so passkey-derived keys survive device loss *iff* the passkey itself is synced (which re-introduces Apple/Google escrow).
- **largeBlob** (WebAuthn L2): store opaque bytes on the credential. **Much weaker support** — Chrome-led; Windows only ≥11, not Android's high-level API. Not a reliable cross-platform primitive in 2026.
- **EFS use:** PRF is a credible way to derive an at-rest encryption key for the EFS Kernel's encrypted local state / write journal, gated behind a biometric touch, *without ever putting a raw key in JS*. Far better than the burner-in-localStorage pattern (see traps). It is **not** by itself an Ethereum signer (P-256 passkey signing is the separate path above), but it can encrypt the vault that *holds* signers or seed material.

### CAIP-25 / Multichain API (`wallet_createSession`)
WalletConnect's CAIP-25 and MetaMask's Multichain API let one session span Ethereum + L2s + Solana with per-chain scopes; send to any chain in the session. Relevant to EFS's "truth is venue-relative" multichain reality — a single session can address multiple venues.

---

## C. LESSONS & TRAPS (from deployed systems)

1. **EIP-7702 turned the whole EOA base into a drainer surface overnight.** Within ~4 weeks of Pectra, Wintermute found **>97% of mainnet 7702 delegations pointed to copy-pasted "sweeper" contracts** ("CrimeEnjoyor"). Inferno Drainer drained a MetaMask 7702 user of ~$146k (2025-05-24, per SlowMist/Scam Sniffer); a single batch-transaction phishing hit cost one user **$1.54M** (Aug 2025), with >$2.5M lost that month. **None were bugs in 7702** — the lesson is that *making a wallet more programmable moves the entire attack surface into the signing prompt.* (Mordant footnote: the sweepers were barely profitable — ~2.88 ETH spent to authorize ~79k addresses, near-zero takings — but the phishing *layered on top* was very profitable.)
2. **The batch is a hiding place.** 7702 + batch transactions let an attacker slip one hostile action among benign ones; simulation tools miss proxy/conditional/obfuscated delegate logic. EFS's handoff already names this ("a bundled write prompt hides one dangerous action among harmless ones"). ERC-7920's own "MUST display all message types" is the standards-body admission that batch legibility is the hard part.
3. **Merkle-root signing destroys wallet-level transparency.** When N messages collapse to one `bytes32`, the wallet is back in the eth_sign / blind-sign threat model — it literally cannot show the leaves. Confirmed by the EIP-712 tooling literature and implicit in ERC-8213's existence. **Legibility must live where the leaves live: the EFS Shell.**
4. **localStorage burner keys are an XSS jackpot.** Any script in-origin (one bad dependency, one missed escape) reads `localStorage` synchronously. Private keys/seeds there are one XSS from gone. Industry guidance (OWASP, Auth0, multiple 2025 write-ups) is unanimous: don't hold secrets in web storage; prefer device-bound WebAuthn / non-extractable WebCrypto keys / encrypt-at-rest with a PRF-derived key.
5. **Passkey sync = convenience/sovereignty trade you must state honestly.** Synced passkeys (and their PRF outputs) are recoverable but escrowed to Apple/Google; device-bound passkeys are sovereign but lose cloud recovery. Silent "it's a passkey, you're safe" UX hides an escrow decision.
6. **Session keys/delegations are over-granted by default.** 7715's `isAdjustmentAllowed` and caveat enforcers exist precisely because early session-key UX handed dApps more than intended. Enforcement is on-chain and value-scoped; it does **not** cover arbitrary off-chain signing. Treat any session authority as a standing liability with an expiry and a revoke path (7710 `context`).
7. **Bundler/paymaster centralization = an HTTP observer with a kill switch.** A paymaster can decline; a bundler sees the UserOp. Sponsored submission is a privacy-and-liveness dependency, not free magic. Matches EFS's "sponsor is not the author, can see content, can decline."
8. **Clear-signing coverage is registry-gated, not universal.** 7730 only renders legibly for schemas *with a published descriptor*; everything else falls to 8213 digests or blind signing. EFS gets legible wallet rendering only if it *publishes and maintains* a descriptor for its envelope schema — and even then, not for the opaque root.

---

## D. EFS TRANSLATION (opinionated recommendations for client v2)

1. **Adopt ERC-7920 as the envelope's on-the-wire signing scheme, explicitly.** It is the standardized form of what EFS already wants (one sig, Merkle root, per-record proofs, N=1 == plain `signTypedData_v4`). Cite it in the spec, match its leaf construction (keccak256, power-of-two padding, lexicographic pair sort) so third-party verifiers and future clear-signing tooling interoperate. Where EFS diverges (e.g. record IDs as leaves vs message hashes), document the diff as a named profile.
2. **Make envelope verification signer-polymorphic from day one: `ecrecover` (EOA) → ERC-1271 (deployed SCA) → ERC-6492 (counterfactual SCA).** Because EFS identity is a smart account, EOA-only verification would silently exclude the canonical identity, passkey signers, and 7702-delegated accounts. This is a hard requirement, not an optimization. Add EIP-5267 `eip712Domain()` support so verifiers can reconstruct the domain for contract attesters.
3. **Own legibility in the Shell; give the wallet only a digest to cross-check.** The flush checkpoint (`ready_to_sign`) is a **Shell-owned secure prompt** that displays every record kind/target/count and the computed Merkle root. The wallet then shows an ERC-8213-style digest of that same root. The user's trust anchor is "the digest on my device equals the root the EFS Shell showed me," not "my Ledger enumerated 400 records" (it can't). This is the correct division of labor and it matches the handoff's secure-prompt instinct.
4. **Publish and maintain an ERC-7730 clear-signing descriptor for the EFS envelope schema**, and submit it to the EF-stewarded registry (clearsigning.org). This is the only way clear-signing wallets render EFS envelope *header* fields (schema, record count, attester, expiry) legibly instead of as hex. Cheap, high-leverage, and aligns with the "correct → easy → fast" priority.
5. **Cap and chunk batches for human digestibility; don't sign 400 leaves behind one "OK."** ERC-7920 recommends ≤10 messages. EFS's bulk-import reality (photo archives) needs a **"sign one root, submit chunks over time"** UX where the *human-reviewable summary* is grouped/aggregated ("312 files into /photos/2026, 4 new folders, 1 lens update") even though the cryptographic batch is large. Show the aggregate, let power users expand, keep the root singular.
6. **Session-scoped authority = a Kernel-held key + local policy, NOT a wallet standard, unless the attester is a smart account.** For low-stakes rapid EFS writes (tagging, pinning), let the Kernel hold a scoped signing key with per-scope limits (record kinds allowed, count ceiling, expiry, byte budget) enforced client-side. But be honest in the threat model: **client-side scope is not on-chain enforcement.** If EFS wants *on-chain-enforced* delegation (an agent that may write ≤N records/day as the user), that requires the attester to be a smart account and the session key to act through ERC-7710 redemption / caveat enforcers — which means the enforcement target must exist on-chain, which EFS records mostly don't. Prefer client-policy session keys for writes; reserve 7715/7710 for any value-bearing action.
7. **Passkeys, two roles, kept distinct:** (a) **P-256 passkey as an EFS signer** (verified via the now-mainnet EIP-7951 precompile — cheap on L1 and every major L2) for a seedless identity à la Coinbase Smart Wallet; (b) **WebAuthn PRF as the at-rest key-derivation** for the Kernel's encrypted state/journal, so the raw vault key never touches JS. Never store a raw private key or seed in `localStorage`/IndexedDB in the clear. State the sync-vs-device-bound escrow choice in first-run.
8. **Sponsored submission is a first-class, honestly-labeled route, via ERC-7677.** The flush engine's "sponsor/self-pay switchboard" should speak ERC-7677 (`pm_getPaymasterStubData`/`pm_getPaymasterData`) as one submission strategy, with the standard "proxy through your backend" privacy caveat surfaced: *this relayer can see your records, can decline, and is not the author.* Self-pay stays the sovereign default; sponsor is opt-in per flush.
9. **Wallet selection through EIP-6963, brokered by the Kernel.** Use 6963 discovery, but the Kernel mediates it — Ring-3 apps never see `window.ethereum`. Optionally track ERC-7846 `wallet_connect` for capability-at-connect, but it's Draft and Coinbase-centric; don't hard-depend on it.
10. **Treat the signed bundle as an authored artifact, not a draft — and design the UX around irrevocability.** This is EFS-native truth, not a wallet standard, but the wallet-world lesson (7702 phishing, batch-hiding) reinforces it: once the root is signed, anyone holding the envelope can submit it anywhere the domain allows. The `signed` state in the write-journal vocabulary must visually read as "committed & portable," never "private/pending."

---

## E. Where EFS v2 protocol may conflict with / under-support the client OS need (feed back to Designs/efsv2/)

1. **Off-chain envelope + smart-account identity ⇒ ERC-1271/6492 are mandatory, not optional.** If the v2 envelope spec assumes `ecrecover` (EOA) attester recovery, it under-supports the project's own "identity = one smart-account address" decision. Verifiers (and lenses' first-attester-wins keying) must accept contract-signature validation, including for counterfactual/undeployed accounts. **This needs to be explicit in the envelope + lens specs.** Risk of deferring: passkey/session/7702 users can't be canonical authors; lens resolution silently drops them.
2. **Lens keying vs session keys/relayers.** Lenses key on the attester address. A session key or relayer with a *different* address as signer would either (a) break lens keying or (b) force the attester to be a smart account with the session key acting through it. The protocol needs a defined rule: *the attester recorded on a record is always the smart-account identity, and signature validity is checked via 1271/6492 against that identity* — never the raw session-key EOA. Otherwise "improve write UX" and "lenses key on the attester" (project memory) are in tension.
3. **Merkle-root legibility is unspecified at the protocol layer.** ERC-7920 punts large-batch legibility to the wallet/app; EFS punts it to the Shell. But the *protocol* should define a canonical, deterministic **envelope summary/manifest** (record kinds, counts, targets, ordering) that the Shell renders and that hashes into (or alongside) the root, so the human-readable preview is itself verifiable and not app-forgeable. Without a protocol-level manifest, every client invents its own preview and "what you signed" becomes client-relative. This is arguably a new EFS-specific invention worth making.
4. **Chain-free replay (ERC-7964 shape) needs per-record nonce/dedup semantics defined by the protocol, not the client.** ERC-7964 warns that cross-chain replay is *intended* and safety comes from nonces/deadlines/account-validation. EFS's "records independently extractable/replayable cross-chain" inherits exactly this: the protocol must specify how a record's deterministic ID + venue admission prevents *unwanted* double-admission while permitting *wanted* multi-venue replay. If left to the client, two clients will disagree about whether a record is "already published."
5. **Read grades vs partial batch admission is a client/protocol seam.** The write-journal states (`partially_admitted`, `complete_on_chain`) and the read grades (LIVE/STALE/…, venue-qualified) must share one vocabulary for "how much of this signed envelope actually landed at venue V." ERC-5792's `getCallsStatus` (1xx/2xx/5xx, partial-revert) is a useful precedent for *submission* status, but EFS needs its *own* record-level admission status because an envelope's records can land at different venues at different times. Ensure the protocol defines record-level admission proof, not just tx-level.

---

## Sources (dated; raw URLs)

Primary specs (fetched 2026-07-07):
- EIP-5792 Wallet Call API (Final): https://eips.ethereum.org/EIPS/eip-5792
- EIP-7702 Set Code for EOAs (Final): https://eips.ethereum.org/EIPS/eip-7702
- EIP-6963 Multi Injected Provider Discovery (Final, Oct 2023): https://eips.ethereum.org/EIPS/eip-6963
- EIP-712 Typed Structured Data: https://eips.ethereum.org/EIPS/eip-712
- ERC-1271 Contract Signature Validation: https://velvetshark.com/erc-1271 ; https://eips.ethereum.org/EIPS/eip-1271
- ERC-6492 Signature Validation for Predeploy Contracts: https://eips.ethereum.org/EIPS/eip-6492
- RIP-7212 secp256r1 precompile: https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md
- EIP-7951 secp256r1 precompile mainnet (Final): https://eips.ethereum.org/EIPS/eip-7951
- ERC-7677 Paymaster Web Service Capability (Draft): https://ercs.ethereum.org/ERCS/erc-7677
- ERC-7715 Request Permissions from Wallets (Draft, created 2024-05-24): https://eips.ethereum.org/EIPS/eip-7715
- ERC-7710 Smart Contract Delegation: https://eips.ethereum.org/EIPS/eip-7710
- ERC-7846 Wallet Connection API (Draft, 2024-12-17): https://ethereum-magicians.org/t/erc-7846-wallet-connection-api/22245 ; https://eips.ethereum.org/EIPS/eip-7846
- ERC-7730 Structured Data Clear Signing Format (Draft, created 2024-02-07): https://eips.ethereum.org/EIPS/eip-7730
- ERC-7920 Composite EIP-712 Signatures (Draft, 2025-03-20): https://eips.ethereum.org/EIPS/eip-7920
- ERC-7964 Crosschain EIP-712 Signatures (Draft, 2025-06-05): https://eips.ethereum.org/EIPS/eip-7964
- ERC-7766 Signature Aggregation for ERC-4337: https://eips.ethereum.org/EIPS/eip-7766

Announcements / status / dashboards:
- EF Clear Signing announcement (2026-05-12): https://blog.ethereum.org/2026/05/12/clear-signing-announcement
- Ledger: stewardship of Clear Signing to EF: https://www.ledger.com/blog-ledger-clear-signing-ethereum-foundation
- Ledger ERC-7730 v2 & evolution: https://www.ledger.com/blog-the-evolution-of-clear-signing
- The end of blind signing — ERC-7730/ERC-8213 deep dive (DEV): https://dev.to/aniket_misra_e47d1564ab7b/the-end-of-blind-signing-deep-diving-into-erc-7730-erc-8213-and-clear-signing-2af0
- Clear Signing registry (GitHub): https://github.com/ethereum/clear-signing-erc7730-registry
- Fusaka mainnet announcement (EF, 2025-11-06; activated 2025-12-03): https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement
- Fusaka activation (CoinDesk, 2025-12-03): https://www.coindesk.com/tech/2025/12/03/ethereum-activates-fusaka-upgrade-aiming-to-cut-node-costs-speed-layer-2-settlements
- BundleBear ERC-4337/7702 dashboard (live, 2026-07): https://www.bundlebear.com/overview/all
- ERC-4337 EntryPoint v0.8 released (erc4337 substack): https://erc4337.substack.com/p/entrypoint-v08-released
- eth-infinitism account-abstraction releases: https://github.com/eth-infinitism/account-abstraction/releases

EIP-7702 security incidents:
- Wintermute "CrimeEnjoyor" / 97% sweeper delegations (CoinDesk, 2025-06-02): https://www.coindesk.com/tech/2025/06/02/post-pectra-upgrade-malicious-ethereum-contracts-are-trying-to-drain-wallets-but-to-no-avail-wintermute
- $1.54M 7702 batch-phishing loss (Cryptopolitan): https://www.cryptopolitan.com/eip-7702-user-loses-1-54m-phishing-attack/
- EIP-7702 wallet security — auditor checklist (Zealynx): https://www.zealynx.io/research/smart-contracts/eip-7702-wallet-security
- Inside wallet drainers & EIP-7702 exploits (Three Sigma): https://threesigma.xyz/blog/opsec/ai-phishing-wallet-drainers-eip7702-part-2

Passkeys / WebAuthn / embedded wallets:
- WebAuthn PRF for E2E encryption, 2026 support matrix (Corbado): https://www.corbado.com/blog/passkeys-prf-webauthn
- WebAuthn PRF extension (Yubico): https://developers.yubico.com/WebAuthn/Concepts/PRF_Extension/
- WebAuthn largeBlob (Chromium Intent-to-Ship): https://groups.google.com/a/chromium.org/g/blink-dev/c/guUJ9FuOIfc
- Coinbase Smart Wallet (GitHub + passkeys in practice): https://github.com/coinbase/smart-wallet ; https://splits.org/changelog/coinbase-smart-wallet-passkeys/
- MetaMask Advanced Permissions (7715, GA 2026-04): https://metamask.io/news/introducing-advanced-permissions
- MetaMask Delegation / Smart Accounts Kit: https://docs.metamask.io/smart-accounts-kit/concepts/delegation/
- Embedded wallet infra comparison (Fireblocks): https://www.fireblocks.com/report/compare-embedded-wallet-infrastructure
- localStorage/XSS key-storage risk (OWASP WSTG): https://owasp.org/www-project-web-security-testing-guide/v41/4-Web_Application_Security_Testing/11-Client_Side_Testing/12-Testing_Browser_Storage
- CAIP-25 / MetaMask Multichain API: https://docs.metamask.io/wallet/reference/multichain-api/

Caveat on secondary sources: several "eco.com/support/*" and similar AI-generated explainer pages surfaced in searches; their specific numbers (e.g. "$180M sponsored", "40M accounts") were **not** used where they conflicted with primary/dashboard data (BundleBear). Treat those pages as leads, not evidence.
