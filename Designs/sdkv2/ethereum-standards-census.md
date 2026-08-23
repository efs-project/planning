# EFS v2 SDK Ethereum standards census

**Status:** reference — dated official-source census and proposed SDK integration posture; no protocol, package, ABI, address, chain profile, or deployment is adopted
**Target repos:** planning, sdk, contracts, client
**Depends on:** [[README]], [[research-precedents]]
**Last touched:** 2026-08-22

#status/reference #kind/research #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2 #topic/onchain #topic/read-path

## Verdict

EFS should use modern Ethereum standards aggressively at replaceable edges and
conservatively at truth boundaries.

- **Use directly** the stable provider, chain-binding, typed-transaction,
  typed-signing, block-qualified read, wallet-call, and established EVM safety
  standards that remove needless proprietary SDK behavior.
- **Offer optional adapters** for contract accounts, account abstraction,
  counterfactual signatures, content resolution, proofs, address formats, and
  privacy schemes when their exact capability and basis are explicit.
- **Experiment behind versioned seams** with evolving wallet, delegation,
  module, deployment-factory, clear-signing, and agent standards.
- **Monitor without reserving permanent bytes** for draft native account
  abstraction, cryptographic agility, post-quantum signatures, future forks,
  and new RPC methods.
- **Reject as EFS authority** every provider announcement, registry listing,
  interface claim, reputation score, proxy address, helper address, receipt,
  blob reference, or successful low-level call.

Final EIP/ERC status means the proposal process is complete. It does not prove
that a chain implements the proposal, that a wallet/provider implements it
correctly, or that it is suitable for EFS's century-preservation contract.

## Method and exact source snapshot

On 2026-08-22 this pass metadata-screened all 1,196 proposal documents in the
official registries—584 EIPs and 612 ERCs—and then read the relevant proposal
families and linked specifications in depth. The exact inputs were:

- [`ethereum/EIPs` at `f767a1e8078e17c9b381a91d35a09492189ede1b`](https://github.com/ethereum/EIPs/tree/f767a1e8078e17c9b381a91d35a09492189ede1b/EIPS);
- [`ethereum/ERCs` at `9c718c7c02372a6b7e300990511cd6fdff7f1dfa`](https://github.com/ethereum/ERCs/tree/9c718c7c02372a6b7e300990511cd6fdff7f1dfa/ERCS); and
- [`ethereum/execution-specs` at `78d8b0db6070c4962f9544277876b080b137c984`](https://github.com/ethereum/execution-specs/tree/78d8b0db6070c4962f9544277876b080b137c984) to distinguish proposal status from activated Mainnet fork behavior.

This is a relevance census, not a claim that every proposal received equal
technical review. Statuses below are those in the exact snapshots. Proposals
migrated from the EIP repository use the canonical ERC status. A future SDK
release packet must refresh status, specification bytes, chain activation,
wallet/provider interoperability, and security evidence rather than copying
this date indefinitely.

## Classification law

| Class | Meaning | Exit or replacement rule |
|---|---|---|
| **USE** | A first-party SDK path should implement the exact stable standard where the selected environment supports it. | Capability failure returns a typed unsupported/provider result or selects a separately authorized fallback; it never changes EFS evidence. |
| **OPTIONAL ADAPTER** | Useful interoperability isolated behind an explicit injected capability and exact profile. | Removing the adapter leaves raw EFS evidence, local generated paths, and reconstruction intact. |
| **EXPERIMENT** | High-value but evolving or security-sensitive. No stable public API, frozen bytes, or durable dependency yet. | Proposal revision, interoperability failure, or adversarial falsifier destroys/relabels the experiment. |
| **MONITOR** | Design the seam so adoption remains possible, but emit no proposal-specific durable bytes or promises. | Re-evaluate only after official status, activation, vectors, implementations, and an EFS journey justify it. |
| **REJECT AS AUTHORITY** | May still be parsed or displayed, but cannot establish EFS identity, validity, completeness, authorization, admission, currentness, or permanence. | A future use requires a new evidence packet and explicit owner/Core decision where protocol truth would change. |

## Baseline provider, chain, transaction, and read standards

| Standards and snapshot status | Posture | Proposed SDK requirement, caveat, and falsifier |
|---|---|---|
| [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) Final; [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963) Final | **USE** | Keep the provider boundary to `request` plus lifecycle events; discover multiple injected providers and require explicit app/user selection. RDNS, icon, name, announcement order, and provider presence are untrusted metadata. Chain/account/provider changes invalidate pending plans and basis-sensitive caches. Duplicate, malformed, replaced, or disagreeing providers must not be auto-selected. |
| [EIP-3085](https://eips.ethereum.org/EIPS/eip-3085) Stagnant; [EIP-3326](https://eips.ethereum.org/EIPS/eip-3326) Stagnant | **OPTIONAL UX ADAPTER** | Add/switch-chain requests are explicit user-facing conveniences. Independently re-read chain ID, accepted execution profile and EFS deployment/code identities after the wallet returns. Rejection, wrong chain or untrusted RPC metadata leaves the original plan invalid rather than triggering a hidden fallback. |
| [EIP-155](https://eips.ethereum.org/EIPS/eip-155) Final; [EIP-695](https://eips.ethereum.org/EIPS/eip-695) Final | **USE** | EIP-155 chain-binds legacy transaction signatures and EIP-695 exposes `eth_chainId`; transaction builders recheck the exact observed/accepted chain before submission. ERC-191/EIP-712 signatures are chain-bound only when their own verified envelope/domain/application fields include the chain. Chain ID is not an EVM-fork or contract-capability profile. Any requested/provider/plan/receipt mismatch invalidates the plan. |
| [EIP-2718](https://eips.ethereum.org/EIPS/eip-2718) Final; [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) Final; [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) Final | **USE** | Preserve transaction type and raw envelope; support modern fee and optional access-list construction through injected transaction builders. Unknown transaction types remain raw plus `UNSUPPORTED`, never coerced into legacy transactions. |
| [EIP-5792](https://eips.ethereum.org/EIPS/eip-5792) Final | **USE where wallet-supported** | Capability-gate call batches and status polling. Wallet acceptance or bundle status is transport evidence, not authorship, Realm admission, final EFS effect, or proof that dependent calls were semantically correct. Canonical read-back is mandatory. |
| [EIP-1898](https://eips.ethereum.org/EIPS/eip-1898) Final; [EIP-234](https://eips.ethereum.org/EIPS/eip-234) Final | **USE** | Resolve `safe`/`finalized` once, retain the explicit block hash/number, and pin every logical read, page, call, and log filter to that basis with canonicality requirements where supported. Provider refusal, pruned history, fork mismatch, or a page crossing basis becomes `UNKNOWN`/`PARTIAL`, never absence. |
| [EIP-1474](https://eips.ethereum.org/EIPS/eip-1474) Stagnant | **USE narrowly** | Reuse strict JSON-RPC `Quantity`/`Data` codecs and preserve raw error code/message/data. Do not treat its status or error table as universal endpoint behavior. Timeout, rate limit, null, empty array, and `-32xxx` errors require typed provider/history/capability outcomes. |
| [EIP-7910](https://eips.ethereum.org/EIPS/eip-7910) Final, Osaka | **USE as observation** | Parse `eth_config` into observed provider evidence, then compare it with the caller's accepted execution profile and direct code/precompile checks. It is capability discovery, never a trust root. A stale or lying response must be detected or yield an unsupported/unknown result. |
| [ERC-7950](https://eips.ethereum.org/EIPS/eip-7950) Final | **USE as codec** | Provide lossless chain-qualified transaction-reference parsing/formatting. The string identifies a chain and transaction hash; it does not prove inclusion, finality, canonicality, semantic effect, or EFS authority. |

## Signing, wallets, contract accounts, and delegation

| Standards and snapshot status | Posture | Proposed SDK requirement, caveat, and falsifier |
|---|---|---|
| [ERC-191](https://eips.ethereum.org/EIPS/eip-191) Final; [EIP-712](https://eips.ethereum.org/EIPS/eip-712) Final | **USE** | Use an explicit versioned message envelope only for named authentication/message journeys. Use EIP-712 for exact human/agent-reviewable action plans bound to chain, verifying contract, profile/Realm, nonce, expiry, calldata/effect commitments, and replay policy. EIP-712 supplies hashing, not replay protection or clear signing by itself. Preview/sign/submit digest drift is fatal. |
| [ERC-2098](https://eips.ethereum.org/EIPS/eip-2098) Final | **OPTIONAL CODEC** | Accept compact secp256k1 signatures at the boundary and normalize without changing the signed digest or receipt strategy. Malformed encoding and noncanonical/high-`s` signatures remain invalid; public plan APIs need not require the compact form. |
| [ERC-5267](https://eips.ethereum.org/EIPS/eip-5267) Final; [ERC-7730](https://eips.ethereum.org/EIPS/eip-7730) Draft | **OPTIONAL ADAPTER / EXPERIMENT** | Inspect contract EIP-712 domains where available. Generate context-bound clear-signing descriptors from the exact action plan, ABI/code identity, chain, and profile, but treat them as presentation artifacts rather than authority. Absent/mismatched domains or any descriptor/calldata substitution blocks authorization. |
| [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271) Final; [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492) Final | **OPTIONAL ADAPTER** | One basis-aware verifier must distinguish deployed contract validation from counterfactual validation, bind code/factory/init evidence, cap work and returndata, and report simulation assumptions. The public verify API allows only non-persistent `eth_call`/revert simulation; persistent prepare/deploy is a separately planned and authorized action. Magic value or simulated success is mutable basis-qualified evidence, not eternal Principal authority. |
| [ERC-7913](https://eips.ethereum.org/EIPS/eip-7913) Final; [EIP-7951](https://eips.ethereum.org/EIPS/eip-7951) Final, Osaka | **OPTIONAL ADAPTER** | Support address-less verifier/public-key identifiers and the P-256 precompile only under exact verifier/code/fork profiles. EIP-7951 does not require low-`s`: SDK-produced EFS action signatures use a declared low-`s` canonical policy; a named compatibility verifier may accept high-`s` only while marking it noncanonical. Raw signature bytes never identify an action or replay key. Raw P-256 validity is not WebAuthn ceremony validity, account control, or EFS authority. |
| [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) Final; [ERC-7562](https://eips.ethereum.org/EIPS/eip-7562) Draft; [ERC-7769](https://eips.ethereum.org/EIPS/eip-7769) Draft; [ERC-7677](https://eips.ethereum.org/EIPS/eip-7677) Review | **OPTIONAL ADAPTER / EXPERIMENT** | Isolate account, EntryPoint, ERC-7562 validation-scope/stake/reputation rules, bundler RPC, and paymaster versions in a pinned account profile and raw error taxonomy. A UserOperation validates its EntryPoint/version-specific `userOpHash`, not the EFS EIP-712 digest; the receipt separately binds both commitments. Bundler reputation/acceptance and paymaster sponsorship are infrastructure evidence, not EFS authority, and canonical EFS read-back remains mandatory. |
| [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Final | **EXPERIMENT** | Treat EOAs as potentially code-bearing/delegated at a pinned basis and track delegate code identity separately from account identity. Only wallet-owned, audited flows may create authorizations; the public app SDK must not ask users to sign arbitrary raw authorizations. Foreign or changed delegation forces refusal/re-plan. |
| [EIP-2255](https://eips.ethereum.org/EIPS/eip-2255) Final; [ERC-4361](https://eips.ethereum.org/EIPS/eip-4361) Final; [ERC-5573](https://eips.ethereum.org/EIPS/eip-5573) Draft | **OPTIONAL ADAPTER / EXPERIMENT** | Wallet permissions may gate account exposure; SIWE/ReCaps may create a relying-party service session. None maps silently to an EFS grant, Lens authority, admission, or OS capability. Audience, origin, URI, nonce, time, resource, expiry, revocation, and signature failures terminate only the session path. |
| [ERC-7739](https://eips.ethereum.org/EIPS/eip-7739) Draft | **EXPERIMENT** | Evaluate defensive nested typed signatures for smart accounts without weakening concrete chain/contract/nonce/effect binding. Lack of exact account support keeps the path unavailable. |
| [ERC-6900](https://eips.ethereum.org/EIPS/eip-6900) Draft; [ERC-7579](https://eips.ethereum.org/EIPS/eip-7579) Draft; [ERC-7710](https://eips.ethereum.org/EIPS/eip-7710) Draft; [ERC-7715](https://eips.ethereum.org/EIPS/eip-7715) Draft; [ERC-7821](https://eips.ethereum.org/EIPS/eip-7821) Draft; [ERC-7836](https://eips.ethereum.org/EIPS/eip-7836) Draft | **MONITOR / isolated experiments** | Preserve capability-shaped account/delegation/batch/preparation seams. Do not expose proposal-specific stable SDK contracts, infer account-module compatibility, or equate wallet delegation with EFS authority. Every experiment needs explicit install, scope, expiry, revocation, code, plan, and receipt vectors. |

Signer classification is always basis-dependent. Empty code cannot permanently
prove an EOA because accounts can be counterfactual or delegated; code presence
cannot prove the controlling key or semantic verifier. A candidate
`SignatureVerificationReceipt` therefore covers only the exact EFS plan/message
digest plus EOA/ERC-1271/ERC-6492/ERC-7913/P-256 strategy, canonicality policy,
account/key/verifier, chain/Realm/block and direct/factory code basis, result and
availability. A separate account-authorization/submission receipt recomputes
and binds transaction/calls, ERC-4337 `userOpHash`, EIP-7702 authorization tuple
and wallet/bundler receipts to that exact plan and canonical read-back. Neither
name nor its bytes are frozen; one receipt never substitutes for the other.

## EVM generation, calls, deployment, and reproducibility

| Standards and snapshot status | Posture | Proposed SDK requirement, caveat, and falsifier |
|---|---|---|
| [EIP-150](https://eips.ethereum.org/EIPS/eip-150), [EIP-170](https://eips.ethereum.org/EIPS/eip-170), [EIP-211](https://eips.ethereum.org/EIPS/eip-211), [EIP-214](https://eips.ethereum.org/EIPS/eip-214), [EIP-2929](https://eips.ethereum.org/EIPS/eip-2929), [EIP-3860](https://eips.ethereum.org/EIPS/eip-3860), all Final | **USE** | Generate against explicit call-gas, cold-access, runtime/initcode-size, static-context, and bounded-returndata rules. Unknown-size calls start with zero output area, inspect `RETURNDATASIZE`, enforce a caller limit before copying, and treat revert bytes as untrusted diagnostics. Max+1 success/revert payloads must return typed too-large/invalid outcomes rather than OOG. |
| [EIP-1153](https://eips.ethereum.org/EIPS/eip-1153) Final, Cancun | **PROFILE-GATED EXPERIMENT** | Do not emit transient-storage action helpers by default. If measured, namespace keys and test nested calls, delegatecall ownership, reentrancy, static context, and frame reverts. A pre-Cancun profile is unsupported. |
| [EIP-1052](https://eips.ethereum.org/EIPS/eip-1052) Final | **USE with existence/account guard** | Code-hash evidence distinguishes non-existent, extant empty-code, ordinary contract and delegated-account cases only when paired with exact account-existence and fork semantics. Never classify an EOA or helper solely from `EXTCODEHASH`; test non-existent, prefunded empty, precompile, contract and EIP-7702 delegation states. |
| [EIP-3541](https://eips.ethereum.org/EIPS/eip-3541) Final; [EIP-3855](https://eips.ethereum.org/EIPS/eip-3855) Final; [EIP-5656](https://eips.ethereum.org/EIPS/eip-5656) Final; [EIP-7939](https://eips.ethereum.org/EIPS/eip-7939) Final | **COMPILER-ONLY, PROFILE-GATED** | Legacy code must not begin with reserved `0xef`; `PUSH0`, `MCOPY`, and `CLZ` are optimization choices for Shanghai, Cancun, and Osaka profiles respectively, never a portability baseline. Preserve a conservative legacy-bytecode backend and differential vectors. |
| [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) Final, Prague; [EIP-7951](https://eips.ethereum.org/EIPS/eip-7951) Final, Osaka | **PROFILE-GATED OPTIONAL ADAPTER** | Precompile addresses and behavior enter an accepted chain profile only after activation/capability proof. Strictly validate length, field, subgroup/curve, gas, and return conventions. Final status does not make a precompile available on every EVM chain. |
| [EIP-7823](https://eips.ethereum.org/EIPS/eip-7823), [EIP-7825](https://eips.ethereum.org/EIPS/eip-7825), [EIP-7883](https://eips.ethereum.org/EIPS/eip-7883), all Final, Osaka | **USE in Osaka transaction profile** | Respect the MODEXP input bounds, `2^24` transaction gas cap, and repricing. Large deployments/migrations must split or become explicitly unsupported; pre-Osaka estimators cannot be reused as proof. |
| [EIP-7623](https://eips.ethereum.org/EIPS/eip-7623) Final, Prague; [EIP-7691](https://eips.ethereum.org/EIPS/eip-7691) Final; [EIP-7840](https://eips.ethereum.org/EIPS/eip-7840) Final; [EIP-7892](https://eips.ethereum.org/EIPS/eip-7892), [EIP-7918](https://eips.ethereum.org/EIPS/eip-7918), [EIP-7934](https://eips.ethereum.org/EIPS/eip-7934), all Final, Osaka | **PROFILE ECONOMICS / MONITOR** | Treat calldata pricing, blob target/max/schedule/base-fee coupling and execution-block RLP size as execution-profile inputs to estimation and batching, not application invariants. A transaction valid by gas can still be unpackageable or uneconomic; old estimators and static blob assumptions are falsified by the selected fork profile. |
| [EIP-1014](https://eips.ethereum.org/EIPS/eip-1014) Final; [EIP-684](https://eips.ethereum.org/EIPS/eip-684) Final | **USE for reproducibility** | Recompute CREATE2 from exact factory, salt, and creation initcode—including constructor, linked addresses, and metadata—and retain collision evidence. Address alone never proves runtime code or dependency identity. |
| [EIP-7997](https://eips.ethereum.org/EIPS/eip-7997) Review | **EXPERIMENT only after activation proof** | A deterministic-factory adapter must pin exact factory runtime code and protocol, handle its unpadded 20-byte success return, and retain the inline local deployment path. No chain profile may assume the factory before exact code is observed and accepted. |
| [ERC-7744](https://eips.ethereum.org/EIPS/eip-7744) Last Call | **OPTIONAL DISCOVERY ADAPTER** | A code index can locate candidates; it cannot establish helper identity, safety, version, dependency closure, or authority. Direct code and deployment-manifest verification remain mandatory. |
| [ERC-8152](https://eips.ethereum.org/EIPS/eip-8152) Review | **COPY MANIFEST IDEAS; REJECT DEFAULT EXECUTION MODEL** | Reuse content-addressed capability/impact/dependency manifest concepts in reproducibility experiments. Do not make registry-selected modules, proxy storage, or `delegatecall` a default EFS helper path. |
| [ERC-7201](https://eips.ethereum.org/EIPS/eip-7201) Final | **CONDITIONAL** | Use namespaced storage only if a future generator deliberately emits storage-bearing modules. The present default is pure/view internal code with no SDK-owned storage. |
| [EIP-6780](https://eips.ethereum.org/EIPS/eip-6780) Final | **REJECT lifecycle dependency** | Never rely on `SELFDESTRUCT` for deletion, upgrade, cleanup, or address recycling. CREATE2 plus later destruction does not create a reusable permanent helper address. |

A candidate `EvmProfile` separates chain ID from exact fork/capabilities,
compiler version/settings/`evmVersion`, runtime and initcode limits, transaction
gas cap, gas schedule, precompiles, system contracts plus code hashes/ABIs, and
deterministic factory address/code hash/protocol. A provider's observed profile
is evidence; the caller's accepted profile is policy. Unknown opcode,
precompile, transaction type, system contract, or fork behavior returns
`UNSUPPORTED` while retaining raw input.

A candidate `ReadBasis` separately records chain/Realm, explicit block hash and
number, requested and observed finality, canonicality request/result, source,
evidence kind (`rpc-observation`, `state-proof`, `receipt-proof`, or
`local-recomputed`), coverage/completeness and causal availability. Resolving a
tag or reaching provider quorum is source policy, not proof of EFS truth.

A candidate `DeploymentManifest` retains Solidity standard JSON input/output,
compiler binary/version/settings/`evmVersion`, sources, remappings, licenses,
link references, constructor/immutable inputs, initcode/runtime bytes and
hashes, factory/code hash/protocol, salt, expected address, dependency graph,
and observation basis. Neither name is an adopted SDK API.

## Proof, history, content, address, and privacy adapters

| Standards and snapshot status | Posture | Proposed SDK requirement, caveat, and falsifier |
|---|---|---|
| [EIP-1186](https://eips.ethereum.org/EIPS/eip-1186) Stagnant | **OPTIONAL ADAPTER** | Locally verify account/storage Merkle proofs against an authenticated state root and report exact requested slots, basis, and coverage. It does not prove logs, receipts, finality, historical completeness, or omitted slots. Invalid/missing nodes are proof failure/unknown, not absence. |
| [EIP-4444](https://eips.ethereum.org/EIPS/eip-4444) Stagnant; [EIP-7642](https://eips.ethereum.org/EIPS/eip-7642) Final | **DESIGN REQUIREMENT** | Assume ordinary nodes may not serve old bodies/receipts. Expose archive/history capability and availability explicitly; reconstruction cannot depend on one current RPC. History loss must never become negative evidence. |
| [EIP-4788](https://eips.ethereum.org/EIPS/eip-4788) Final; [EIP-2935](https://eips.ethereum.org/EIPS/eip-2935) Final | **NARROW PROFILE ADAPTERS** | Treat the beacon-root and recent-block-hash system contracts as code/profile-pinned bounded windows, not century history or generic finality proofs. Missing/out-of-window state is unavailable/unknown. |
| [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) Final; [EIP-7516](https://eips.ethereum.org/EIPS/eip-7516) Final | **OPTIONAL EPHEMERAL DA ADAPTER** | Contracts can observe versioned hashes and blob base fee but cannot retrieve blob bytes, and retention is not a century guarantee. Persist independently verified bytes in a durable lane before expiry; never identify EFS content solely by blob availability. |
| [ERC-3668](https://eips.ethereum.org/EIPS/eip-3668) Final | **OPTIONAL ADAPTER** | An opt-in CCIP Read resolver enforces URL scheme/host/redirect/SSRF, privacy, size, time, recursion, callback, and same-basis policies while retaining request/response/callback bytes. Gateway data is untrusted until the onchain callback validates it. |
| [ERC-4804](https://eips.ethereum.org/EIPS/eip-4804) Final; [ERC-5219](https://eips.ethereum.org/EIPS/eip-5219) Final; [ERC-1577](https://eips.ethereum.org/EIPS/eip-1577) Stagnant | **OPTIONAL IMPORT/RESOLUTION ADAPTERS** | Resolve `web3://`, contract resources, and ENS `contenthash` to inert located bytes with exact name/resolver/contract/basis/provenance, then verify bytes independently. None creates EFS authority, permanence, MIME truth, or safe rendering. |
| [ERC-7930](https://eips.ethereum.org/EIPS/eip-7930) Review; [ERC-7950](https://eips.ethereum.org/EIPS/eip-7950) Final | **VERSIONED CODECS** | Offer lossless parse/format adapters for interoperable addresses and chain-qualified transaction references. Unknown chain types/references remain opaque; these formats do not authenticate a chain or contract. |
| [ERC-55](https://eips.ethereum.org/EIPS/eip-55) Final; [ERC-1191](https://eips.ethereum.org/EIPS/eip-1191) Last Call; [ERC-3770](https://eips.ethereum.org/EIPS/eip-3770) Draft | **USE 55 FOR DISPLAY; OPTIONAL UI PARSERS** | Canonical SDK identity remains the full numeric chain ID plus raw 20-byte address and separate authority domain. Checksums and human chain prefixes are presentation/input validation only. Unknown, duplicate or mutable shortname mappings cannot enter durable identity. |
| [ERC-5564](https://eips.ethereum.org/EIPS/eip-5564) Final; [ERC-6538](https://eips.ethereum.org/EIPS/eip-6538) Final | **OPTIONAL PRIVACY ADAPTERS** | Treat stealth meta-addresses, announcements, viewing/spending keys, and registry observations as privacy/locator evidence under an explicit scheme. They do not replace full EFS Principal/authority qualification or imply registry trust. |

There is no adopted generic receipt/log proof RPC. EIP-1186 is state-only;
ordinary receipts and logs are provider observations unless a separate adapter
verifies canonical receipt bytes, transaction index/path and proof against an
authenticated header's `receiptsRoot` under an exact fork/encoding profile.

## Monitor without freezing proposal-specific APIs

- Wallet and account evolution: [ERC-7902](https://eips.ethereum.org/EIPS/eip-7902),
  [ERC-7871](https://eips.ethereum.org/EIPS/eip-7871),
  [ERC-7679](https://eips.ethereum.org/EIPS/eip-7679),
  [ERC-7846](https://eips.ethereum.org/EIPS/eip-7846),
  [ERC-8019](https://eips.ethereum.org/EIPS/eip-8019),
  [EIP-8130](https://eips.ethereum.org/EIPS/eip-8130),
  [EIP-8141](https://eips.ethereum.org/EIPS/eip-8141), and
  [EIP-8164](https://eips.ethereum.org/EIPS/eip-8164).
- Signature/transaction agility and post-quantum research:
  [EIP-8197](https://eips.ethereum.org/EIPS/eip-8197),
  [EIP-8202](https://eips.ethereum.org/EIPS/eip-8202),
  [EIP-8051](https://eips.ethereum.org/EIPS/eip-8051),
  [EIP-8052](https://eips.ethereum.org/EIPS/eip-8052),
  [EIP-8292](https://eips.ethereum.org/EIPS/eip-8292), and
  [EIP-8310](https://eips.ethereum.org/EIPS/eip-8310). SDK signatures must be
  strategy-tagged and replaceable now; none of these draft bytes are reserved.
- Submission and RPC observation: [EIP-7966](https://eips.ethereum.org/EIPS/eip-7966)
  synchronous raw-transaction submission,
  [EIP-8072](https://eips.ethereum.org/EIPS/eip-8072) inclusion subscriptions,
  [EIP-8123](https://eips.ethereum.org/EIPS/eip-8123) transaction-gas-cap
  discovery, and [EIP-8304](https://eips.ethereum.org/EIPS/eip-8304) proposed
  proof-bearing log/transaction indexes. All are Draft. Do not make blocking
  submission or an index mandatory; ambiguous errors, channel loss, missing
  history and incomplete proof coverage remain non-negative, and canonical
  read-back remains required.
- Future EVM forks: the [EIP-7773](https://eips.ethereum.org/EIPS/eip-7773)
  Glamsterdam meta proposal and its candidate code-size, calldata/state-price,
  access-list, and deterministic-factory changes, plus the later
  [EIP-8081](https://eips.ethereum.org/EIPS/eip-8081) Hegotá meta proposal.
  An unscheduled or draft fork never enters generated bytecode because a
  provider labels itself compatible.
- EOF proposals are Stagnant. Keep the legacy-bytecode generator and do not
  reserve an EOF helper/API path until an activated profile and modern compiler
  evidence make that a new experiment.

## Explicit non-dependencies and rejected shortcuts

- [EIP-3074](https://eips.ethereum.org/EIPS/eip-3074),
  [EIP-5003](https://eips.ethereum.org/EIPS/eip-5003), and
  [EIP-7701](https://eips.ethereum.org/EIPS/eip-7701) are Withdrawn; generate
  no integration.
- [ERC-8074](https://eips.ethereum.org/EIPS/eip-8074) Draft 4-byte EIP-712
  selectors are not EFS Type identity: collisions, unknown fields, and open
  evolution require EFS's own exact evidence commitments.
- [ERC-8001](https://eips.ethereum.org/EIPS/eip-8001) Final,
  [ERC-8126](https://eips.ethereum.org/EIPS/eip-8126) Final,
  [ERC-8196](https://eips.ethereum.org/EIPS/eip-8196) Final,
  [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) Draft, and
  [ERC-8257](https://eips.ethereum.org/EIPS/eip-8257) Draft may be optional
  upper-layer agent/discovery integrations. Mutable registries, verification
  providers, reputation/risk scores, and wallet classifications are evidence,
  never generic EFS agent authority or safety truth.
- [ERC-1820](https://eips.ethereum.org/EIPS/eip-1820) registrations,
  [ERC-165](https://eips.ethereum.org/EIPS/eip-165) interface answers,
  [ERC-1967](https://eips.ethereum.org/EIPS/eip-1967) proxy slots,
  [ERC-1167](https://eips.ethereum.org/EIPS/eip-1167) clones, and
  [ERC-2535](https://eips.ethereum.org/EIPS/eip-2535) diamonds cannot be the
  default helper identity or semantic negotiation law. If integrated, every
  implementation/facet/dependency and upgrade authority is explicit evidence.
- [ERC-2470](https://eips.ethereum.org/EIPS/eip-2470) Stagnant singleton-factory
  addresses and deployment folklore are chain-local discovery evidence only.
  Exact factory runtime/protocol plus a verified local fallback are required.
- [ERC-838](https://eips.ethereum.org/EIPS/eip-838) Draft and application ABI
  error selectors may improve diagnostics, but revert bytes can be forged or
  bubbled and never prove semantic result, absence or authority.
- [EIP-2771](https://eips.ethereum.org/EIPS/eip-2771) trusted-forwarder suffixes
  never become implicit EFS author identity.
- Low-level success, revert bytes, receipt status, address, code presence,
  registry membership, interface support, provider metadata, and feature probes
  are insufficient semantic acceptance individually or together.

## Cross-PM routing

This table routes pressure evidence; it transfers no product or protocol
ownership and adopts none of the names above.

| Counterpart | Standards to read first | Design pressure to carry |
|---|---|---|
| **Web Client/OS PM** | 1193, 6963, 2255, 3085/3326, 5792, 4337/7562/7769/7677, 7702, 4361, 5573, 7715, 7730, 7910, 1898 | Direct guest remains wallet/provider-discovery free. Write/auth lanes explicitly select the provider; chain/account changes invalidate plans. Wallet/service permissions never become OS grants. Clear-signing descriptors are exact generated presentation inputs. Signature verification, `userOpHash`, delegation authorization, wallet/bundler status and canonical effect stay separate; raw 7702 authorization is wallet-owned, not app-owned. |
| **Data Explorer PM** | 1898, 234, 1186, 1474, 4444/7642, 4788, 2935, 4844, 7950, 7930, 3668/4804/5219 | Pin every multi-call/page/log read to one explicit basis; distinguish provider observation, proof, finality, coverage, and history availability. Old-history or blob loss is `UNKNOWN`, never absence. Address/transaction/content formats are display/import adapters, not authority. The direct guest E1b slice keeps zero wallet/indexer dependency. |
| **Core/contracts architecture and implementation PMs** | 712/5267/7739, 1271/6492/7913/7951, 7702, 150/170/211/214/2929/3860/1153/6780, 2537, 7823/7825/7883, 7910, 1014/7997, 8152, 7201, 4444/7642 | Provide bounded ABIs/result states and exact profile inputs; test full-width Principals and code/delegate/factory drift. Generated code retains a conservative profile and bounded returndata. Helpers remain direct, stateless, reproducible, optional, and locally replaceable. SDK research does not select Core bytes. |
| **Files/artifact, OS Drives and Web product PMs** | 3668, 4804, 5219, 1577, 5564, 6538, 7930, 7950 | Keep one canonical route/name/byte resolver with qualified paging and verified ranges. External locators return inert evidence; content type, safety, currentness, permanence and host projection are separately verified. |
| **Open Web App Store PM** | 8152, 1014/7997, 7744, 1167/1967/2535, 3668/4804/5219 | CALM's content-addressed capability/impact manifest is useful precedent, not a reason to adopt registry-selected delegatecall modules. Package/helper identity retains exact source, build, runtime, factory, dependency and authority evidence; code indexes and external locators are discovery only. |
| **Agent/service PMs** | 712, 4337/7562/7769, 4361/5573, 7710/7715/7836, 8001/8004, 8126, 8196, 8257 | Agents receive exact plans, explicit sessions/delegations, bounded effects, separately bound signature/account/submission receipts, and canonical read-back. Bundler, registry, reputation, risk-score, tool-listing, and wallet-verification evidence is not authority or endorsement. |

## Integration plan and stop rule

1. Add the proposed execution, RPC/read-evidence, wallet/account, signature,
   and deployment profiles to the shared disposable fixture vocabulary—not to
   permanent public APIs.
2. Generate exact EIP-712 plan vectors and experimental ERC-7730 presentation
   descriptors from the same source, then mutate every context field.
3. Exercise EOA, deployed ERC-1271, non-persistent ERC-6492, ERC-7913 and P-256
   through one plan-signature verification algebra; exercise transactions/
   calls, ERC-4337 `userOpHash` and EIP-7702 authorization tuples through a
   separate account/delegation/submission algebra. Independently recompute and
   bind every digest/tuple to the same exact EFS plan/effect commitment.
4. Run block-hash-pinned direct calls, pages, logs, proof adapters, provider
   failover, history loss, and liar-provider cases.
5. Compile the same generated Solidity fixture under an explicitly selected
   conservative control—Paris is one experiment candidate, not an adopted
   default—plus Cancun, Prague, and Osaka profiles; test absent opcodes/
   precompiles, size/gas caps, returndata bombs, delegation, deterministic
   deployment, and dependency drift.
6. Publish an adapter only after its specification snapshot, implementation
   matrix, security review, raw-preservation behavior, failure algebra,
   replacement path, and exact falsifiers are in the release packet.

Production implementation stops if a standard is the only source of EFS truth,
if the selected chain/wallet/provider capability is not independently
qualified, if unknown behavior is coerced into absence/success, if a draft
proposal's bytes leak into a frozen API, or if removing the adapter prevents
offline interpretation and reconstruction of exact EFS evidence.
