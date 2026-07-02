---
title: EFS account system — one smart-account identity per user
status: active
tags: [status/review, sdk, identity, ux, contracts-coordination]
related: [[write-ux-options-ranked]], [[sdk-one-signature-writes]], [[sdk-write-ux]], [[efs-write-ux-attester]]
target-repos: [sdk, contracts]
last-touched: 2026-06-23
---

# EFS account system: one identity, many signers

> The popup/latency problem is solved by **removing the human from the signing loop** (a key the app signs with
> locally, no prompts). That only works if EFS has an **identity layer** tying every such signer back to one user.
> This doc specifies that layer. The clicks-per-write reduction it sits above shipped in **contracts PR #36**
> (layered `multiAttest` + pipelined chunk deploys + `data:` URI); this layer makes writes *promptless* and
> *attributable*.

#status/review #kind/design

## Decision (the north star): user = ONE smart-account address

**EFS identity = one smart-account address per user, holding many keys — NOT a union of many addresses.** This is
the "user = address" goal and the future-proof choice: it rides EIP-7702 / ERC-4337 / ERC-7579, is upgradeable in
place, recoverable, and same-address cross-chain. One identity model, three **on-ramps** (not three models):

1. **Smart-wallet user** (Safe / Coinbase SW / 7702-EOA) → reuse their account address. EFS deploys nothing.
2. **Classic wallet user wanting good UX** → 7702-upgrade their EOA (keeps their address) *or* get an
   EFS-provisioned smart account.
3. **Old-school wallet that refuses** → writes as its **raw EOA: still ONE address**, just eats per-write popups
   (reduced 11→3–4 by PR #36). Not stranded — **EOA → 7702 is in-place (same address)**, so it converges later
   with zero migration.

**"User = many addresses" is explicitly NOT the identity model.** It survives only as (a) the **lens/curation
view** — seeing many curators at once, e.g. `cars.eth` aggregating experts (a view, not an identity); and (b) an
**emergency migration bridge**. Both are views/fallbacks, never the default.

This is the **B′** model (below): identity is one contract/smart-account *attester*; the ordered-attester union is
reserved for the lens/curation view axis only.

## Problem

A wallet popup per attestation makes EFS writes unusable (a file ≈ 11 attestations across 3–4 dependent layers +
N storage deploys). The fix is a **delegated signer** — a key the app signs with locally, so the whole dependent
DAG fires back-to-back with no prompts. But a delegated signer is a *different address* than the user's main
wallet, and EFS lenses/visibility/cardinality all key on the EAS `attester`. So we need an explicit account model
so every signer resolves to one identity. The question is *where* the many-keys-to-one-identity collapse happens.

## The model (B′ — unify at write)

**Identity = a single smart-account-contract address that all the user's keys write *through*.** That contract is
the EAS `attester` for every write, so the chain sees one author. Keys are managed *inside* the account: a cold
**owner key** (admin, rarely used) authorizes hot **session keys** (the app-held signers). This is the
Farcaster/Safe/Coinbase shape — one account, many keys.

- **Read:** key on the one account address — single attester, O(1), zero fan-out, correct supersede.
- **Write:** any authorized session key signs locally → the account executes → `attester = account`.
- **Owner gates membership:** only the owner key can add/revoke session keys.

**Why B′ (decided 2026-06-22 after 5 expert passes — first-principles, prior-art, codebase, performance,
adversarial):**
- **Correct latest-wins supersede on-chain, for free.** EAS cardinality-1 (re-pin/move/delete supersedes your
  *own* prior PIN) keys on `(definition, attester, schema)`. With one attester, the frozen singleton rule just
  works. *(The alternative — many keys each writing as themselves, union'd at read — resolves by list **position,
  not timestamp**, so two devices editing one file return the **older** edit. For 100-year non-revocable data that
  is the one unreversible mistake. That is why linking-as-identity was rejected.)*
- **Gated revocation:** rotate a compromised key → its future writes are simply rejected; no permanent on-chain
  residue.
- **Same address on every chain** (CREATE2/CREATE3) and **7702-native** (the EOA *becomes* this account in place).
- **No freeze break:** a contract is just an ordinary attester — the frozen slot key doesn't care whether the
  attester is an EOA or a contract, and the read path already takes `address[]`. (The EFS schemas/kernel are
  frozen on Sepolia per PR #24; B′ needs no change to them.)
- **Ecosystem-proven:** Safe, Coinbase SW, Lens v3, 4337, 7702 are all unify-at-write; prior art confirmed *none*
  resolve identity via a read-time registry.

**Prior art (re-derivation, not invention):** Farcaster KeyRegistry (cold custody address authorizes hot signer
keys; content attributed to the FID); Lens delegated executors / v3 session keys; Safe / Coinbase multi-owner
accounts.

**Cost (performance pass):** per-user CREATE2 deploy (~50k–250k gas, lazy/once-per-chain, sponsorable) + ~+3k
gas/write routing — standard smart-account cost, negligible near-term, paymaster/faucet-sponsorable. Accepted vs.
the correctness + revocation + cross-chain + 7702 wins.

## Promptless UX = session keys (the actual product goal)

Identity (whose writes) and **promptlessness** (no popups) are separate; promptlessness is the real goal (≤1 popup
per high-level action, ideally 0). Both are delivered by the same thing:

**A session key is "the burner," bound to the account.** The app holds a key; the account authorizes it **once** —
scoped to EFS writes, time-limited (e.g. 7 days). After that the app **signs every write locally → 0 popups → web2
feel**, and because the session key acts *as the account*, writes attribute to the **one account address**. So
binding the burner to the account is exactly what makes "no popups" AND "user = one address" both true. *(A
standalone burner would be its own identity = the multi-address mess; a session key is just a signing instrument
of the one account.)*

**Promptlessness REQUIRES a smart account** — a bare EOA can't delegate signing, so every tx is a popup by
definition.

| Tier | Promptless? | Popups |
|---|---|---|
| Smart wallet / 7702 / EFS account **+ session key** | ✅ | 1 per session grant (weekly-ish), **0 per action**; gas paymaster-sponsorable → gasless |
| Raw EOA (no smart account) | ❌ | 1+ per action (PR #36 cut this 11→3–4) |

**So the real build is two layers:** (1) a **universal session-key signing layer** — the app holds a key, gets it
granted once by whatever account the user has, signs locally (this is the UX win, needed for ALL account types);
(2) the **EFS-provisioned account** — only for users without a smart-account-capable wallet, and passkey/no-wallet
signups.

## Onboarding flow: detect-and-reuse, no forced contracts

On connect, **capability-detect (`detect.ts` / AA SDK) and reuse the user's existing account when it can deliver
the promptless UX; provision a new EFS account only when it can't.** Don't force everyone onto an EFS contract —
that's redundant with smart wallets, replaces recognizable addresses, and makes everyone take the one-way trip.
Uniform UX comes from the **session-key layer**, not a uniform account type.

| What they bring | EFS does | Identity address | One-way trip? |
|---|---|---|---|
| Smart wallet w/ session keys (Safe/Coinbase/ZeroDev) | reuse; grant session key | their wallet | no |
| Smart wallet w/o session keys | install ERC-7579 session module | their wallet (unchanged) | no |
| MetaMask/EOA w/ 7702 | **today: batching only (1 popup/batch)** — promptless session keys are not GA (see Verification). Promptless needs an AA-SDK account *or* waiting for MetaMask session-key GA (then in-place on the same EOA) | their own EOA | no — same address |
| Plain EOA, no 7702 | provision EFS account (owned by the EOA) | new contract | **yes — the commitment** |
| Passkey / no wallet | provision EFS account owned by the passkey key | new contract | yes |
| Refuses everything | write as raw EOA, popups/action | their EOA | no (7702 later, same address) |

So "provision an EFS contract" shrinks to the tail: **non-7702 plain wallets + passkey/no-wallet signups.**

**There is no EFS "linking" of addresses.** When EFS does provision an account, the EFS identity is just the
**account address**; the owner EOA is the account's **owner/admin key** (a smart-account ownership relation), not a
second EFS identity that gets lens-linked. Name→account discovery (`james.eth → account`) is an **ENS record**, not
EFS linking.

**Rent the AA layer — the edge cases are mostly not EFS's to solve.** Adopt an AA SDK (ZeroDev / Biconomy /
thirdweb / Coinbase SW / Privy) for account deploy + session keys + paymaster + 7702 + recovery. EFS then owns
only three provider-agnostic things: **identity = the account address**, **session scope = EFS write selectors**,
and the **faucet** for gas. Phase it: v1 = one clean path (one AA SDK + single chain), then widen.

| Edge case | Who handles it |
|---|---|
| Wallet supports 7702? | capability detect (`detect.ts` / AA SDK) |
| Session key expired | re-grant, 1 popup (session SDK) |
| Gas for session-key txs | 4337 paymaster / faucet-drip |
| Account not deployed on a chain | counterfactual / lazy deploy (CREATE3 factory) |
| Lost owner key / recovery | recovery module set at creation (account SDK) |
| Same address cross-chain | CREATE3 + pinned recipe (see Interop) |
| Cross-chain key-state sync | open problem — defer via single-chain v1 |
| User declines AA | raw EOA + popups (graceful degradation) |

**Build tradeoff (decision for James):** *detect-and-reuse, 7702-preferred* (recommended — best UX, recognizable
addresses, least lock-in; cost: integrate each wallet's session-key dialect) vs *uniform "everyone gets an EFS
account"* (simpler one-path v1; cost: redundant deploys, contract addresses, everyone takes the trip).

## The signer (passkey paths)

A session key can be any app-held key. The attractive zero-friction source is a **passkey**:

- **Route A — passkey *is* the on-chain signer** (Coinbase-SW style; P-256 verified on-chain). **Now viable
  again:** RIP-7212 / P-256 precompile is live on Ethereum L1 (EIP-7951, Fusaka 2025-12) and all major L2s, so the
  "spotty precompile" reason we originally avoided it has decayed. Best custody (key never leaves the
  authenticator); sidesteps the derivation/sync fragility below. **Reconsider this vs Route B.**
- **Route B — passkey *derives* a secp256k1 key** via the WebAuthn PRF extension (no precompile, any chain;
  re-derived on demand, not persisted). Chain-portable, but carries the gotchas below.

**Passkey gotchas (verified):** Apple↔Google passkeys **do not cross-sync** (hard wall — different derived key per
ecosystem; so the account, not the passkey, is the identity, and a second ecosystem is a second *key* of the same
account); iOS/macOS <18.4/15.4 have a QR-vs-local PRF mismatch; there is **no spec guarantee** PRF syncs; YubiKey
PRF is per-device and excluded on iOS browsers. **Firefox PRF is shipped** (desktop) — no longer a blocker;
Firefox Android is a soft gap to test.

## Verification status (primary sources, June 2026)

**Source-verified in-repo (solid):** EAS UID embeds `block.timestamp` (EAS.sol:697); EFS lens reader unions an
**ordered attester list** (EFSRouter `_findDataAtPath` first-wins; EFSFileView `getDirectoryPageBySchemaAndAddressList`,
`MAX_ATTESTERS_PER_QUERY=20`); per-attester cardinality `_activeBySlot[def][attester][schema]`; `multiAttest`
semantics; EAS supports contract attesters (`EIP1271Verifier`).

**Confirmed via primary sources:** EIP-7702 Final, live since Pectra (2025-05-07); MetaMask Smart Accounts
auto-enabled for new users (batching + gas abstraction); 7702 is browser-independent. EIP-5792 `wallet_sendCalls`
Final; MetaMask v12+ atomic-only, **one confirmation per batch**. RIP-7212/P-256 precompile broad (L1 + major L2s).

**⚠️ The important correction:** **MetaMask session keys (ERC-7715) are NOT GA — Flask/`experimental` only.** A
production MetaMask user **cannot** grant promptless scoped signing today; the honest ceiling is **atomic batching,
1 popup per batch**. ERC-7715 and ERC-7579 are both still **Draft**. **Promptless session keys work in production
ONLY on dedicated AA-SDK accounts** (ZeroDev, Biconomy, thirdweb = GA; Coinbase Spend Permissions = Base-only;
Privy = signing primitive). ⇒ **Promptless UX today requires a dedicated AA-SDK account** (the EFS-provisioned
path) — so that path is the **primary** promptless route, not a fallback. **Track MetaMask session-key GA**; until
then the genuine fork is *keep-your-MetaMask-address + 1-popup-per-batch* vs *AA-SDK account for true promptless*.

## Interoperability & lock-in

**Core truth: EFS has no identity *migration*, only *accretion*.** EAS attestations are immutable → data is
permanently keyed to the authoring attester address. So **the identity address must be chosen once, before write
#1.** Interop is excellent *forward* (one address gains capabilities) and a one-way door *sideways* (changing which
address is the identity).

- **Smooth, same-address (in-place):** proxy implementation upgrades; plain EOA → 7702 the *same* EOA; 7702
  re-delegation; install ERC-7579 modules. One address carries owner-key + passkey-key + session-key + 4337 over
  time — add/rotate = install modules, no migration. Authoring under a contract attester forecloses nothing in EAS
  tooling.
- **One-way doors (new address = lossy union forever):** plain EOA → *separate* deployed contract; deployed
  contract → "my real EOA"; passkey-EOA → Safe; Safe ↔ Coinbase. A deployed contract can never be 7702'd (it has
  code) — but it doesn't need to; it gets smart-wallet powers via 4337+modules at the same address. The
  foreclosure is never "contract vs smart wallet" — it's **switching which address is the identity.**
- **MetaMask specifically:** EOA → 7702 is in-place (no split) — keep the EOA as identity; deploy a separate
  contract only when 7702 is unavailable.

**Onboarding invariants (must hold before write #1):**
1. **Never ship a single-key, no-recovery account** — admin-key loss = permanent identity *freeze*. Bake in a
   guardian / second-admin / recovery module at creation. (#1 silent trap.)
2. **Pin a same-address-cross-chain recipe before multi-chain authoring:** CREATE3 (CreateX, deployer-namespaced
   salt) + an upgradeable proxy (per-chain config in `initialize()` run atomically with deploy). **Today live
   deploys use nonce-CREATE, so multi-chain identity is NOT yet deterministic — don't let users author on multiple
   live chains until it is.** Silent forkers: factory missing on a chain (zkSync's different CREATE2; EIP-155-only
   chains); salt/initcode varying per chain.
3. **Per-chain key-state drift is an open problem** (same address, independent per-chain storage). Keep the initial
   key set identical at creation; Coinbase's `executeWithoutChainIdValidation` (replay owner-ops) is the practical
   pattern; keystore-rollups are the unsettled long-term answer.
4. **Identity = a recoverable, upgradeable, same-address smart account BEFORE write #1.** This single decision
   keeps every door open. The expensive, irreversible mistake is authoring under a bare single-key EOA, a
   non-deterministic per-chain address, or a throwaway.

## Group identity (cars.eth, DAOs, subreddits) — same mechanism

A group lens is the **same contract-as-attester** with a different authorization policy: `canWrite(addr)` is
member-gated (current mod set, token-gate, DAO vote) instead of owner-gated. The contract is the attester, so reads
are single-address and on-chain cardinality is clean — exactly like a personal account. Groups are the legitimate
"app's own contract" publisher case ([[efs-write-ux-attester]]); end-user value: `lens=cars.eth` → a curated list
maintained by the expert set, membership enforced on-chain. **One interface, two policies** — so personal and
group identity are not double work. (Design the interface now; build groups as a v2 follow-on.)

## Custody & recovery
- **Custody ranking:** passkey smart account (Route A — now viable) ≈ best; passkey-derived EOA (Route B) — good,
  chain-portable; standalone localStorage burner — worst (avoid as identity).
- **Lose a session key:** owner authorizes a new one, revokes the old. Old content stays readable; supersede is
  clean (one attester).
- **Lose the owner key:** catastrophic without recovery — hence invariant #1 (recovery configured at creation).
  Owner = well-secured, rarely-touched key (Farcaster custody-address model).

## Decisions for James
- [ ] **Confirm B′** (identity = one smart-account attester; union reserved for lens/curation views).
- [ ] **The bridge rule:** author seed datasets under a single attester from day one, so they converge to
      B′/7702 with no re-authorship of frozen non-revocable data.
- [ ] **Onboarding invariants** (recovery at creation; deterministic same-address recipe before multi-chain).
- [ ] **Build tradeoff:** detect-and-reuse (recommended) vs uniform EFS account.
- [ ] **Signer:** Route A (passkey smart account, now precompile-viable) vs Route B (secp256k1 derivation).

## Status / open items
- **Resolved:** lens reader *does* union an ordered attester set (verified — EFSRouter/EFSFileView); WebAuthn PRF
  support including Firefox (verified). D-ACC-1 (read-time account cardinality) is **moot** under B′ — supersede is
  on-chain because there's one attester.
- **Open:** MetaMask session-key GA timeline (gates "promptless on your own MetaMask address"); cross-chain
  key-state sync; CREATE3 same-address determinism on live chains (currently nonce-CREATE).
- **Spawns when promoted:** SDK identity surface (account resolution + session-key grant/scope); AA-SDK
  integration choice; the `canWrite(addr)` group interface; the deterministic-address + recovery deploy recipe.
