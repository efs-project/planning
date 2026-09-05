# What is ready, and what we build next

**Status:** engineering handoff from the disposable workflow rehearsal. It is
not a claim that the permanent EFS protocol or a public MVP is complete.

**2026-09-04 follow-up:** [workflow extension](extension-results.md) has now
implemented the first exact-schema table, small upload/download/history flows
and reproducible typed Arcade challenge named below. The remaining Core,
large-file, real-wallet and deployment gaps are unchanged; the map below is the
retained first-checkpoint handoff, not a claim those UI extensions are still absent.

## The useful result

There is now an actual connected path: browser -> SDK -> local EVM contracts
-> retained state/bytes -> fresh SDK read -> browser. It is not a JSON mock of
what contracts might eventually do. A separate Solidity consumer reads a file
and a strict typed score, without a deployed SDK service. The repository and
module boundaries can therefore be based on working interactions.

Keep the contracts/SDK/web split, guest-first reads, one explicit approval path,
separate session setup, immutable revisions, conflict-safe expected-revision
checks, qualified results, authority-checked read-back and inert game discovery.
Replace the lab's single-owner tree and narrow schema grammar with the actual
C0 identity, admission, Binding/Lens/index and Files definitions before calling
it an EFS v2 MVP. Those omissions are architectural work, not just UI polish.

## Requirement-to-evidence map

| Requirement | Executed lab evidence | Still needed for the EFS MVP |
|---|---|---|
| Open files without wallet setup | real guest browser + cold browser | explicit durable URL/deployment discovery and real C0 route |
| Create folder/file; revise file | three browser mutations, independent retained read-back | Binding-based full Files grammar; rename/move/delete are not implemented by this lab |
| One normal approval | observed relayed message and direct transaction provider traces | actual wallet extensions, rejection/network-switch/relay-failure matrix |
| Zero routine prompts | bounded session setup followed by two revisions | complete C0 grant frame, metering and smart-account comparison |
| Valid typed data | real strict payload and exact-schema reference rejection | full SR-17, 16 Type descriptors, index budget, custom validation policy experiment |
| Useful data browser | schema/payload inspector separate from Files | schema-driven table/view, presentation plugins and compatibility adapters |
| Onchain SDK | bounded compiled-in reader/typed consumer under real EVM | exact C0 ABI, contract Lens and independent Solidity/TypeScript vectors |
| Something showable | original Signal Drift, exact bytes verified before isolated Play | exact release lock and a typed seed driving a reproducible challenge; no trusted score claim |
| Survival beyond original client | cold browser and independent formula/receipt recomputation | full G0–G12 state reconstruction, retained bootstrap closure, independent provider/node |

## Cost finding that changes the implementation plan

[Measured costs](artifacts/measurements.json) for direct file creation include
semantic state, full carrier storage and retained operation history. A 1 KiB
file costs about 2.10 million gas; 4 KiB about 6.41 million; 16 KiB about 23.66
million. Core runtime is 15,624 bytes and the compiled-in consumer is 2,604
bytes. The measured consumer calls are about 45.8k and 50.8k gas including
transaction intrinsic cost, not inner-call-only costs.

**Do not copy the lab's full-payload receipt storage into the production design.**
Retain the evidence needed to reconstruct and authenticate an operation, but
compare a commitment plus state-readable retained payload reference against
duplicating those bytes. Reconstruct exactly the signed bytes and preserve
atomic rollback; a cheaper event-only receipt must not silently remove the
state-readable contract/recovery promise.

The lab intentionally uses Cancun with a 30m block budget and 29m transaction
gas requests. A chain enforcing [EIP-7825](https://eips.ethereum.org/EIPS/eip-7825)
rejects gas limits above 16,777,216, so the current launcher cannot be copied to
such a deployment even for small writes. Its 16 KiB storage case also exceeds
that cap in actual gas use. The next named execution-profile test must estimate
and bound requests per operation, split content materialization when needed,
and keep semantic publication atomic. This is one reason a local pass does
not establish generic EVM/L2 compatibility or a fee forecast.

## Ordered next build slices

1. **Full C0 inputs and first real admission.** Materialize the exact 16 Type
   descriptors and capability closure; implement one SR-17 materializer and
   independent parser. Use the seed-authenticated initializer and admitted-bit
   distinction in [engineering-inputs.md](engineering-inputs.md). First exit:
   independent reconstruction agrees after bootstrap and one admitted Record.
2. **Generic semantic state.** Implement intrinsic Principal, historical
   authority, BindingScope/indexes and bounded four-outcome Lens. First exit:
   exact file create/CAS conflict/qualified missing read through real Plans.
3. **Joined Files slice.** Connect the five SDK seams and this browser to full
   C0 artifacts; replace lab-specific encodings rather than aliasing their IDs.
   Execute and report each of the nine existing M0 tests separately.
4. **Named development profile.** Measure the complete storage/receipt path,
   exact fork limits and wallet matrix. Use one controlled local/dev-chain
   release; permanent bytes and public deployment stay separate decisions.
5. **Product polish and pressure.** Add Explorer's first schema-driven table,
   a real file upload/download path with chunked verified bytes, and Arcade's
   typed exact-challenge configuration. Do not expand into a complete OS.

The first three slices are engineering work with concrete pass/fail criteria;
there is no new owner questionnaire blocking them. Repo creation can package
this work when requested, without declaring protocol permanence. See
[repository-blueprint.md](repository-blueprint.md) for the initial trees and
published boundaries and [PM handoffs](pm-handoff.md) for the four reviewed
consumer slices. These are retained engineering recommendations, not new owner
approval gates for already authorized disposable work.
