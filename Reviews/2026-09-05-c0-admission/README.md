# Actual Type bytes through a partial C0 admission path

This experiment connects the [sixteen temporary Type inputs](../2026-09-05-mvp-build-start/type-inputs/README.md)
to Solidity admission and an independent cold reader. It is a separate
local-chain experiment, not a replacement for the working SDK/static-SPA demo,
a complete C0 ceremony, or a production contracts repository.

## What this tests

An explicitly configured synthetic schema author signs one C0-shaped
WritePlan for each of the four real TypeSchemaGroup Records. A separate
synthetic payer submits it. The probe checks the publication, exact local
effects and witness, parses the group onchain, and commits the Record,
attribution, admission, parsed caches and automatic indexes together.

The cached Types are not booleans called a registry: caches contain parsed
field shapes, bounds, resolved reference roles, index declarations and
constraints. The canonical group bytes remain intact. An independent reader
reconstructs all IDs and signature preimages from retained state and compares
every cache, rather than trusting a contract `valid=true` flag or an event.

There are two different retry cases:

- The same authenticated publication returns its existing admission without
  consuming a nonce or adding history, even after its original deadline.
- A newly signed publication of the same Record creates new attribution and
  history while reusing the existing Record and equal Type caches.

A malformed schema must fail even when its bytes are deliberately included in
the configured inventory and properly signed. Underfunding a transaction must
not leave a partially registered Type, consumed authorization nonce or partial
index. The payer still pays gas and advances its transaction nonce: rollback
claims concern the probe's state, not the whole chain or payer balance.

## Run locally

Use the existing rehearsal's installed ethers and Foundry toolchains; no new
dependencies, wallet installation, public RPC URL or secrets are needed.
The JavaScript runner creates and destroys its own loopback Anvil process,
funds only a synthetic payer, and fixes its chain/execution profile.

```sh
forge test --root Reviews/2026-09-05-c0-admission --use "$EFS_C0_SOLC"
node --test Reviews/2026-09-05-c0-admission/integration.test.mjs
node Reviews/2026-09-05-c0-admission/scripts/measure.mjs
```

`EFS_C0_SOLC` should name a local native Solidity 0.8.30 binary. The JS runner
discovers the previously installed macOS compiler by default, or accepts that
same explicit variable. The build profile is Cancun, optimizer 200, via IR;
Anvil and Foundry versions and source hashes are retained with measurements.
The run ceiling is 16,777,216 gas per transaction, even though the synthetic
chain executes Cancun. This does not claim every L2 has that execution profile.

Without a flag, the measurement program reruns the experiment and prints a
summary without changing retained evidence. `--write` deliberately refreshes it.
Do not hand-edit generated numbers. The proof is reproducible execution under
the named toolchain, not a permanent deployment address.

## Measured result

Fresh controller verification: **28 Solidity tests (including 128 fuzz runs)
and 19 Node tests pass**. [Verification notes](verification.md) distinguish
the tested result, review repairs and remaining full-C0 work.

The retained [measurement packet](measurements.json) includes source hashes,
exact local transaction receipts, run inputs and a cold-readable state snapshot.
Its independently reconstructed snapshot has 17 Types (one intrinsic plus
the sixteen candidates), 4 unique Records and 5 admissions after the
new-envelope reuse case. Exact retry adds no admission.

| Operation | Transaction gas |
|---|---:|
| Probe deployment | 5,927,021 |
| Foundation/content group, 6 Types | 9,210,433 |
| Binding declarations, 3 Types | 6,005,546 |
| Files declarations, 6 Types | 12,717,326 |
| Temporary seal declaration, 1 Type | 6,132,712 |
| Authenticated exact retry | 68,807 |
| New envelope, same first-group Record | 3,117,199 |

Runtime is **18,739 bytes**; initcode including constructor inputs is
**30,648 bytes**. The worst group has about 4.06 million gas of room under
the selected transaction ceiling. That is useful feasibility evidence for
this slice, not a budget allocation for the rest of Core.

## Engineering boundaries

[run-codec.md](run-codec.md) is the exact shared experiment ABI and its choice
ledger. Important limits:

1. **Partial bootstrap, not full C0.** The intrinsic meta-Type has explicit
   temporary metadata. A named probe commitment substitutes for full C0's
   seed/deployment commitment. The declaration inventory is documentary, not
   a claim that all G3 capabilities exist. The byte-store address is inert.
2. **Narrow admission.** One Record/leaf, one configured EOA schema author,
   four ordered groups and sixteen candidate Types. No Files mutations,
   sessions, managed Principals, validators, Withdrawal or Binding/Lens effects.
3. **Descriptor validation, not all data validation.** The parser handles
   ASCII and DIRECT reference roles with conservative depth/extraction bounds.
   It retains index and constraint declarations, but does not validate future
   application Record bodies or execute their scalar/digest/Binding indexes.
   It is not full Unicode/SR-17 conformance.
4. **Logical evidence, not final storage layout.** The state ABI preserves the
   needed identities, witness and automatic metadata/postings for this leaf.
   It does not implement the entire Stage A physical receipt/index layout or
   a general COMPLETE QueryProfile. Unavailable reads remain UNKNOWN.
5. **Engineering gas, not an optimization claim.** ABI-word cache storage
   intentionally favors inspection over compactness. These are schema
   bootstrap transactions, not the price of making a note or changing a file.
   Full Core with Binding, Lens and the rest of genesis has not been shown to
   fit the runtime/deployment envelope by this experiment.
6. **One synthetic signature, not a real-wallet UX pass.** The signed content
   and local effect commitments are exercised; no popup, hardware wallet,
   relayer service, smart account or session UX has been validated here.

The independent reader uses separate parsing and preimage construction from
the producer and Solidity, but shares ethers cryptography. Its verified
result is qualified by a fixed local-chain block and expected run inputs;
it is not a cryptographic proof of a remote RPC's honesty.

## What this changes for the MVP

The next implementation can work from concrete, tested admission and cache
boundaries instead of prose-only Type IDs. The clean SDK boundary remains
prepare → approve → submit → independently verify, with declaration parsing
below it. The app need not learn the parser's internal cache ABI or maintain a
second signing stack, and static hosting need not perform validation server-side.

The next larger integration step is still ordered Core initialization and
the Binding/Lens/Files path, followed by the nine joined C0 journeys. Treat
this implementation as evidence and test input for that work, not code to
copy wholesale into an immutable production Core. No new owner mechanism
decision is needed merely to continue reversible implementation experiments.
