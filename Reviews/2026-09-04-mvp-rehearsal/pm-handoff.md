# Consumer PM handoff

Read-only reviews requested and received during the 2026-09-04 rehearsal.
These are next engineering slices, not product/profile adoption. PMs inspected
the in-flight worktree before final publication; subsequent final verification
and the source/output manifest supersede their untracked-snapshot caveat.

## SDK

Retain the five seams and evidence discipline. Start one ESM TypeScript
package with subpath exports for result/evidence types, pure generated codecs,
qualified readers, write lifecycle, optional EIP-1193 adapters and Files
projections. Root/reader imports must not initialize wallet code or choose a
default provider, account, chain, Realm or profile. Keep Solidity as a separate
source package of generated exact-profile interfaces/codecs and conservative
bounded internal readers; no deployed SDK helper without measured need.

First shared milestone: one sealed small-file packet independently encoded and
decoded in TypeScript and Solidity, then carried through all five seams of a
real relayed C0 create. Mutate profile/run/runtime, plan/CAS, cursor/basis,
bytes/authority, unknown Type and hostile returndata. Do not silently reuse lab
IDs as C0 IDs. Schema/grant registration convenience methods in the lab are
setup tools, not a second permanent write API. Retain direct transaction-body
availability as an explicit authority recovery dependency.

## Web Client / OS

Keep the thin native HTML/CSS/ESM prototype. Next browser slice: exact nested
File/revision link, retained page continuations, unavailable/corrupt/interrupted
reads, and per-journey resource/timing measurements. Then observe one pinned
disposable wallet extension: explicit Connect, relayed/direct/session arms,
rejection and post-plan account/chain change. Record Web-client confirmations,
EIP-1193 method calls and wallet-owned windows separately. No hidden fallback.

Chromium/Firefox/Playwright-WebKit automation is useful; WebKit is not Safari,
and a narrow viewport is not an iPhone test. Do not expand this into OS boot or
copy the planning demo gateway into a production backend. The final repository
toolchain can change without changing the shared SDK/reader boundaries.

## Data Explorer

The next slice is one read-only exact-schema table, not a universal grid.
Group the finite loaded inventory by exact schema; show ordinal/type columns,
Record and Status, with other schemas and failed/unsupported rows visibly
accounted for. Add loaded-row sort/filter/copy, keyboard selection and a
composite Inspector. Refresh clears selection or marks its old basis stale.

Fixture: three ASCII+u64 records with 42, 9007199254740993 and
18446744073709551615, one different-schema record and unavailable/corrupt bytes.
Preserve full u64 precision, raw evidence and shared basis across every
page/record/schema/bytes/validation hop. The SDK owns descriptor-ID checking;
the PM found that omitted check in this lab and the final checkpoint includes
the fix, a negative test and independent re-review. Typed DTOs should preserve field index/path, declared
kind and value state. No new Files route, query grammar or second write stack.

## Arcade

The PM recommends **Signal Drift: Exact Challenge** before a score write path.
An ordinary typed `bytes32` seed Record configures the game's deterministic
obstacle sequence. A lab-only release lock names the exact File/revision/content,
single-artifact closure, scripts-only runner, denied capabilities and expected
configuration schema. A link names that lock and the Challenge Record.

Guest inspection and explicit Play validate the record and game at one basis;
only verified bytes plus validated inert seed configuration can launch. A new
game revision consumes the seed, preserving revision 1. Same release/Challenge
must produce the same obstacle-sequence hash in a fresh browser; a different
Challenge must differ. Missing, invalid, unsupported, mixed-basis or corrupt
inputs block Play rather than silently selecting randomness. Browse/Play need
no wallet. Export the lock, record/schema, basis, content commitment and teardown.

This is generic typed data changing a game, not an Arcade-specific Core noun.
It is the next experiment, not implemented by the current random-obstacle
fixture. Defer score publishing and its game-to-host channel to a later slice;
client-reported scores must never be presented as verified fair-play evidence.
