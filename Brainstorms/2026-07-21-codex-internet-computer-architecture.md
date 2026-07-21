---
agent: codex-gpt-5
date: 2026-07-21
status: reference
anchors:
  - area: efsv2
  - area: apps
  - area: storage
  - area: client
source: Internet Computer official canister, cycles, certification, and snapshot documentation, reviewed 2026-07-21
---

# Internet Computer — full-stack on-chain application architecture

Durable prior-art note for future EFS application, hosting, runtime, and preservation design. This is not an adopted platform decision.

## Executive read

The Internet Computer (ICP) is the strongest comparison for the broad claim "host the whole application on a blockchain." A canister combines WebAssembly code, replicated persistent state, HTTP serving, timers, external calls, and chain-key signing. Static assets can be served with subnet-certified responses that ordinary browsers receive through HTTP gateways.

That integration produces a smoother full-stack story than EFS currently has. It also couples the application to a paid runtime, controller model, subnet, gateway/certificate root, and upgrade discipline. Canister storage is durable while funded; a canister that exhausts cycles can ultimately be deleted with its state.

ICP is less a direct filesystem competitor than an architectural challenge: EFS must explain why a portable evidence/filesystem substrate plus replaceable runtimes is preferable to putting both state and execution in one replicated service.

## Architecture

- A canister bundles a Wasm module, heap, stable memory, queues, cycle balance, controllers, and settings.
- Stable memory persists across upgrades and currently supports up to 500 GiB per canister; ordinary Wasm heap has smaller limits and different upgrade behavior.
- Controllers may upgrade code, change settings, stop, or delete a canister. Control can be single-key, multisig, governance, or empty.
- Emptying the controller list makes a canister immutable, but also removes the upgrade/recovery path.
- Canisters pay continuously for storage and for computation/messages using cycles. A freezing threshold creates a warning/stoppage zone; eventual exhaustion can delete the canister and its data.
- Certified HTTP responses commit paths, headers, and body hashes into a Merkle tree whose root is included in subnet-certified state. Gateways verify a subnet BLS certificate plus witness before serving the response.
- Controller-authorized snapshots can capture Wasm, heap, stable memory, certified variables, and chunk storage; snapshots can be downloaded and uploaded to another canister.

## What EFS should borrow

### 1. Make verified web serving boring

ICP's asset canister automatically certifies paths, response bodies, status, and selected headers. EFS's `web3://` and gateway stack should aim for the same developer experience:

- upload/deploy assets;
- receive a stable address;
- serve ordinary browser responses;
- verify body and security-relevant headers;
- require no application-specific verification code for the standard path.

### 2. Certify the response, not only the file bytes

Content integrity alone does not protect `Content-Type`, CSP, status codes, redirects, or path resolution. EFS serving receipts should bind the resolved file/version and the response metadata that changes browser behavior.

### 3. Make control state visible

ICP explicitly surfaces whether a canister is centrally controlled, multisig/governed, or immutable. EFS apps and packages need a similarly legible distinction between:

- immutable release bytes;
- mutable channel/pointer owner;
- package publisher identity;
- runtime operator;
- gateway operator;
- lens/policy authority.

### 4. Treat snapshots as disaster-recovery artifacts

Downloadable canister snapshots are good operational prior art. EFS should go further by ensuring the export format is protocol-owned, self-verifying, and usable by an independent implementation—not merely restorable into the same platform.

### 5. Price sustainability in the object itself

ICP's reverse-gas model gives users fee-free interactions because the application pays. EFS relayers and preservation services may offer the same UX, but the client must surface who funds ongoing service and what happens when funding stops.

## What EFS should not copy

### Runtime liveness described as permanence

Replicated stable memory is not self-funding. Cycle exhaustion and controller deletion are explicit destruction paths. EFS's archival claims must remain grounded in preserved records/bytes and independent exports, not a running application's current health.

### Controller authority hidden behind "on-chain"

A controller can replace code or delete state. An immutable canister removes that risk but also forecloses upgrades. EFS's separation of immutable objects, signed mutable pointers, and replaceable readers/runtimes offers a more granular choice and should stay visible.

### Gateway verification as the only verification path

Certified ICP domains are verified by boundary nodes; raw domains are not. EFS should support transparent gateways while preserving direct client verification and multiple independently operated gateways.

### Platform-native snapshots as the only exit

Controller-only snapshots are useful, but a user without controller access cannot rely on them. EFS applications should publish user-owned, continuously exportable state in documented formats rather than waiting for an operator disaster-recovery action.

## Concrete EFS design questions

1. Which response headers must an EFS serving receipt or gateway proof bind?
2. Can the OS display package-byte authority, channel authority, runtime authority, and gateway authority separately without overwhelming users?
3. What EFS export corresponds to a full canister snapshot: records, byte placements, app state, policy, and executable package?
4. Can a third-party runtime restore that export without contacting the original EFS client or origin chain beyond standard data access?
5. Who pays for recurring availability checks and renewals while reads remain free?

## Recommended benchmark

Deploy the same static site plus small mutable application on ICP and EFS. Compare first deploy, update, certified browser load, offline/export recovery, authority inspection, monthly storage cost, and recovery after removing the original developer, gateway, and frontend. Include the no-controller/immutable configuration and document what becomes impossible afterward.

## Sources

- Canister model, memory, controllers, and lifecycle: https://docs.internetcomputer.org/concepts/canisters/
- Cycles and deletion risk: https://docs.internetcomputer.org/concepts/cycles/
- Current cycle costs: https://docs.internetcomputer.org/references/cycle-costs/
- HTTP response certification: https://docs.internetcomputer.org/guides/frontends/certification/
- Canister snapshots: https://docs.internetcomputer.org/guides/canister-management/snapshots/
- Canister migration: https://docs.internetcomputer.org/guides/canister-management/canister-migration/
