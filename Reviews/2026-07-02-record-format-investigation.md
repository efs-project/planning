# 2026-07-02 — Record-format investigation (envelope vs W3C VC/SD-JWT; signing granularity)

**Context:** Before handing v2 to Fable, James challenged whether the "Portable Authorship Envelope" belongs in the fixed-decisions tier — worried the envelope has too many edge cases (batch-coupling: sign 20 records as a package → copy one drags 19; updates awkward), and asked whether an existing verifiable-data standard (W3C Verifiable Credentials, DIDs, SD-JWT) could give portability with fewer downsides and whether Ethereum wallets even support them. 4-agent workflow (`whgyrq33q`): 3 evaluators (format options + wallet support; on-chain verification cost; signing granularity/lifecycle) + adversarial synthesis.

## Rulings

**Format: custom minimal EIP-712 envelope, Merkle-batched, chainId-free domain. Do NOT adopt W3C VC / SD-JWT / JSON-LD as the record format.** Two independent disqualifiers, both physics not fashion:
1. **On-chain composability.** The Microsoft-config-on-a-new-L3 case needs a *contract* to verify a copied record natively. `ecrecover` = precompile 0x01, ~3k gas, from the bytes alone, any EVM chain, forever. VC/SD-JWT on-chain = RS256 (SHA-2 + 2048-bit modexp) + JSON parsing (~750k+ ZK constraints, dollars/verify); JSON-LD adds RDF canonicalization no contract can run. A VC format forces every destination contract through an off-chain oracle/ZK verifier — negating replication portability. Corroborated by `research-onchain-composability.md` (replication→native SLOAD is the composability mechanism; every proof/coprocessor path is 4–6 orders more expensive, async, hard-fork-fragile, vendor-mortal — Axiom died in 18 months).
2. **Native wallet production.** MetaMask/Rabby/Coinbase/Ledger/AA all produce EIP-712 via `eth_signTypedData_v4` natively; **none** produce SD-JWT/JSON-LD VCs without a dedicated identity wallet or embedded lib. The only stock-wallet VC on-ramp — did:pkh + EthereumEip712Signature2021 — is a W3C-CCG **draft marked "DO NOT use in production"** and is still on-chain-hostile. Adopting a standard costs both composability AND 1-click UX to buy a compatibility label EFS's actual consumers (contracts) can't consume. Keep did:pkh export as an optional cosmetic interop skin only.

Sources: EIP-712 / `eth_signTypedData_v4` (MetaMask docs); ERC-7920 Composite EIP-712 Signatures (Draft 2025-03-20, eips.ethereum.org/EIPS/eip-7920); zkLogin arXiv 2401.11735 and RareSkills RSA-in-Solidity (VC on-chain cost); w3c-ccg/ethereum-eip712-signature-2021-spec README ("under development; DO NOT use in production"); Trinsic VC-adoption post-mortem; eIDAS 2.0 sidelining W3C VC for SD-JWT/mdoc.

**Granularity: per-record-leaf, Merkle-batched (ERC-7920 *shape*, not a wallet dependency).** Leaf = one record/claim (the logical unit deterministic IDs already make client-computable; the write DAG *is* the tree). User signs ONE root (one click); each record carries an O(log N) inclusion proof and verifies independently of the other N-1 → copy one config item without dragging 19; edit one → re-sign only its leaf. At N=1 the root = the leaf hash → byte-identical drop-in for `eth_signTypedData_v4`. Build the tree/proofs in EFS's own signing code (no wallet v5 dependency). Beats flat-hash (couples all N), per-unit multi-sign (N prompts), and BLS aggregation (not EVM-native, not ecrecover-cheap).

**Identity: ship the envelope with the 32-byte identity-word + KEL/pre-rotation succession + P-256/passkey path (EIP-7951) reserved.** Bare-ecrecover-forever is the "one key = identity" trap and quantum-doomed on the ~2030s horizon; the EOA is the degenerate single-event KEL. Aligns with substrate-decision §3.2.

**Fewer-downsides verdict:** no option beats the envelope; it is the least-bad, independently re-deriving EFS's own conclusion. Standards buy off-the-shelf verifiers + a credential-wallet display + a "W3C-compliant" label — for consumers EFS doesn't have — and cost the two properties the design rests on, plus proof-suite proliferation (VC 2.0 spans ecdsa/ecdsa-sd/bbs/JOSE/COSE/SD-JWT; conformant stacks routinely can't verify each other) and negative adoption evidence.

## Honest edge-case ledger (the winning design)

| Edge | Status | Note |
|---|---|---|
| Partial / cherry-picked copy | authenticity **fixed** (Merkle proof); semantics **inherent** | a lone copied item verifies as the author's, but may be semantically incomplete without siblings — app-level fix: publish self-contained units |
| Updates / latest-ness cross-chain | **inherent** (portable currency ruled unbuyable) | home chain: live, one-SLOAD. Copied L3: a **provable snapshot, not a live feed** — Microsoft updates don't auto-propagate without re-replication. Honest, labeled, never faked |
| Dangling cross-chain references | **inherent** | a dead attester's owned dataId/listId can't be re-instantiated elsewhere; surfaced as "unknown," never faked (read-grade vocab) |
| Revocation portability | **inherent, a wash across all formats** | envelope no worse (arguably better via author-signed advisory revocation that replicates with the data); NOT a reason to adopt a standard |
| Wallet support | **fixed** | N=1 works in every wallet today; Merkle-root path built in EFS code, user signs the root as normal typed data |
| Author equivocation on replication | **fixed** | byte-identical dup = idempotent no-op; different payload = equivocation evidence; TID device bits prevent false positives |
| Quantum / suite obsolescence | **fixed iff succession reservation ships** | KEL + algorithm-tagged keys + P-256 path |

## Decision rule + experiment

**Flips to a standard only if BOTH:** (1) the native-on-chain-read requirement is dropped (no destination *contract* needs to verify copied records — conceivable since 8/10 apps need zero composability, if dapp-structured-records is declared out of scope) AND (2) a cheap native/precompiled on-chain VC verifier lands at ecrecover-comparable gas (4–6 orders off today). Absent both, the envelope wins.

**Smallest experiment (days, no wallet changes, no mainnet):** on an unmodified-EAS devnet fork, sign N config records as one Merkle root via stock `eth_signTypedData_v4`; write a ~30-line Solidity verifier that takes one leaf + its proof + the root signature and returns the ecrecover'd author — proving a destination contract reads a **cherry-picked single copied record** as provably the author's, no oracle. Then kill the devnet and re-verify that leaf from exported calldata alone (the dead-chain fire drill). Gate: verifier <~10k gas + survives chain-death replay ⇒ envelope+Merkle de-risked end-to-end, standards question closed for the composability-bearing path.

## Addendum — plain-language portability + deployment notes (2026-07-02, informational)

**What the copy-paste database gives you, and doesn't** (descriptive, not prescriptive):
- Records are self-verifying signed artifacts → a subtree (e.g. Microsoft's config) copies to any chain / disk / USB and its authorship verifies from the bytes alone. The copy-paste database is real.
- It's a **snapshot, not a synced feed**: you copy what exists at copy time; origin updates don't auto-propagate (re-copy to refresh).
- **Per-author ordering travels**: a sequence number in the signed payload lets anyone tell which of an author's records supersedes which, on any chain, with no clock. Sequence numbers order the records you *hold*; whether a newer one exists back on the origin is the same snapshot/completeness limit.
- **A sequence number (or author-chosen timestamp) does NOT reintroduce EAS's timestamp-in-UID problem.** That problem was the *chain* stamping mine-time into the *identity hash*, so IDs were unknowable until mined. A payload sequence number is author-chosen at signing time and never enters ID derivation (EFS IDs derive from author+salt / parent+name, never from time). Ordering metadata is therefore free to add — avoiding that trap is the point of the deterministic-ID design.
- **Trustworthy global cross-author ordering, and instant cross-chain "is-this-latest/revoked," do not travel** (they need a consensus substrate). EFS's reads were audited to need only per-author order, so the un-portable properties are ones EFS does not consume.

**Deployment / gas economics** (descriptive):
- **Correction to an earlier note in this session (it was wrong):** gasless relaying does **not** require the envelope. EAS's native **delegated attestation** (`attestByDelegation`; verified EAS.sol:112 + :445) already lets a VPS submit while EAS records the **signer** as attester, not the relayer. So on devnet, standard EAS delegation replaces the Sepolia faucet (user signs a chain-bound delegation, VPS pays + submits, attester = user, fully legible to all tooling) — no wasted drips, no user gas token. The chain-free envelope is a **separate** layer whose unique job is cross-chain **portability** (the delegation signature is chainId-bound and doesn't travel). The two were conflated earlier; they are distinct, and how EFS combines them (attester-via-delegation vs envelope-author keying) is the open legibility fork now tracked in the handoff.
- Click ladder on real chains: **2 clicks** bare self-pay (sign + tx on plain MetaMask) · **1 click** if anyone sponsors (an app/dataset/community running the same relay pattern; cents on an L2) · **1/0 clicks** with smart wallets / session keys. Bare self-pay is the sovereign floor, not the default for app-mediated writes.
