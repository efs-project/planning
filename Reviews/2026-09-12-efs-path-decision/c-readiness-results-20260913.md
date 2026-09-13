# MUD candidate: consumer readiness repaired, paid comparison next

September 13, 2026 · retained local test evidence, not an architecture decision

The bounded C repair succeeded. It fixes three ways a paid consumer or its
measurement harness could accept an incompletely checked result: a mismatched
read basis, a cursor from a different query context, and a replay whose full
returned value differed from its event. These were concrete checking defects,
not evidence that MUD cannot support the requested semantics.

Source is `2ca7349e5d683c3ff10651c0fc106c10da946145`; retained evidence is
`e5d7568` on `codex/efs-warroom-c-run`, under
`lab-c/evidence/readiness-20260913T145917Z`. Claude's original checkout remains
untouched at `9a4e766`. The isolated successor changes only the consumer/test
checks and measurement helper, not Ledger, indexing, MUD vendor code or the
public consumer ABI.

## What was actually checked

- Independent source review approved spec compliance and task quality.
- A fresh source-archive build at **14:59 UTC** used Solc 0.8.30, Cancun,
  via-IR, optimizer 200, ordinary code-size limits, and run-owned output/cache.
  **80/80 Forge tests and 72/72 Node tests passed**, with no skipped tests.
- All 112 compiled artifacts fit the normal runtime and creation-bytecode
  ceilings. Ledger is 23,204 runtime bytes; the paid consumer is 15,445.
  Creation sizes exclude constructor arguments; these are not deployment gas
  receipts. The future run separately pins the complete initcode.
- The consumer's **46 ABI entries and 13 selectors match the baseline**.
  Baseline compilation required normalizing invalid numeric NatSpec tags in
  comments only. Top-level ABI entries were sorted for comparison; nested
  input/output/tuple order was preserved.

The build retains an unchanged-source shadowing warning and existing Forge
lint warnings; this is not a warning-free build or a security audit. Two failed
run-local configuration attempts were caught before the successful archive
build: one compiled nothing, one rejected a nonstandard config filename.
They are operational failures, not passing test runs.

Raw `build3.log` is preserved byte-for-byte, including compiler-generated
trailing spaces and its terminal blank line; it is excluded from prose/source
whitespace checks rather than rewritten to make those checks green.

## Next, without another design expansion

An independent offline preparer has supplied the positive C fixture's eight
deployments, exact signed/native publications, table reads and four paid
consumer calls. The manifest is separately reviewed and pinned **before** any
chain result is read. A small runner integration will require separate checks
before fixture publication and after the competing-author state is established.
The existing B input/controller pins remain unchanged.

No C paid receipt is claimed here. Matched rollback, portable contract-origin
evidence, broader Files behavior and historical interpretation after upgrades
remain open gates. A smaller integration deadline or missing C evidence must
not be presented as a failure of the MUD architecture.

The compile slot is released; at 15:55 UTC no Forge, Solc or Anvil process was
visible. Compile scratch is 42 MB and free disk is 274 GiB. A future chain run
requires its own finite lease.
