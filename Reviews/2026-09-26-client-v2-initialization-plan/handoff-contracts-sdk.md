# client-v2 → Contracts and SDK handoff

**Status:** handoff from web-client-dev, sent after the Web Client/OS PM accepted [[Reviews/2026-09-26-client-v2-initialization-plan/README|the client-v2 plan]] (revision 2) on 2026-09-26. These are asks, not rulings; each owner decides in their own plan.
**Date:** 2026-09-26

#kind/task #repo/contracts #repo/sdk #repo/client #repo/planning

Details and reasoning: plan §9.2 (artifact reconciliation) and §10 (X1–X8).

## For the Contracts PM (@v2-pm) and contracts-dev

| Ask | What the client will check |
|---|---|
| **X1.** Ship the fixture package with the **S1** bundle: `up/seed/verify/status/down/reset`, explicit port/chain-id/state-dir/fresh-`realmId` inputs, JSON output, stable exit codes, manifest **capabilities** (for example "Files seed present"), the shared registry/lease library, and a pinned `@foundry-rs/anvil`. Start Anvil with **no unlocked accounts**, or declare it signer-capable. | C1 `infra-ready` from a client-only checkout; upstream `eth_sendTransaction` fails |
| **X5.** pnpm 12 (the contracts plan still says 10) and Node 24 LTS across the three repos | the lockfile's `packageManager` fields |
| **X7 (verify only).** Confirm successor signed intents keep execution-context binding in the signed message, as the prototype's `IntentV2` does (`realmId`, `realmOrigin`, `executionSet`). No protocol change unless a replay test finds a gap. | the signed-intent replay test, once the signed lane lands |
| **X8 / J2.** Schedule Files/Directory/Name(ASCII) profiles + a Files seed consistently with the SDK plan, which expects them in contracts S2; the contracts plan says S3. Recommendation: right after S1, on the native lane. Also confirm that an EOA calling `execute` is a supported native author, and that the Files stale-revision precondition works without S2 read sets. | C2 `files-ready`; C3 stale-plan refusal |

## For the SDK PM (@sdk-pm) and sdk-dev

| Ask | What the client will check |
|---|---|
| **X3.** Surfaces as the SDK plan describes them (`.`, `./files`, `./actions`, `./web`, `./testing`, `protocol-inputs.json`). Plus: **a submission-lock derivation keyed before attempt creation** (client proposal: chain, realm, deployment, account) rather than attempt-ID only. Plus: `./web/journal` separable if the client's provenance check finds the journal in the guest startup set. | the C3 two-tab/one-attempt test; C2 `check-graph` |
| **X4.** The compatible set: `protocol-inputs.json` digest == the fixture's release digest | `doctor` and CI refuse a mismatch |
| **X6.** SDK integration uses the fixture package and registry; faults are injected at the EIP-1193 port; the gateway stays client-owned (already agreed in SDK plan §7.2) | — |
| **X8 / J2–J3.** The Files reader + `guestProbe` (J2) and `./actions` + `indexedDbJournal` + its conformance suite (J3), timed with contracts' Files profile | C2 and C3 entry |

The client's C0 needs none of this. C1 needs X1. C2 needs J2. C3 needs J3.
