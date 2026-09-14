# Freeze required declarations in the disposable index profile

September14. Reversible compact-B repair, **not** a permanent restriction on
future Types, user-configurable indexes, upgradeable testnets or proxy design.
The [[index-obligation-config-finding-20260914|executed admin-downgrade finding]]
has independent review and retained historical evidence. Ledger currently signs
module address/code identity but an optional setter can overwrite a required
declaration. Required configuration must not silently change behind that identity.

## Narrow choice

For these direct-deployed prototype modules only, mandatory families and their
start admissions are fixed in construction. New optional declarations remain
allowed; ordinary processing, active occurrence counts and cursor generation
keep moving. Replacing the required configuration uses an explicitly attached
new module, which changes the existing signed obligation. This is the smallest
repair without adding an execution-time external configuration getter to Core.

Enforce in internal `_declare`, not merely the public setter: reject replacing
an existing mandatory family, and reject adding/promoting a mandatory family
after deployment. Current base and specialized constructors must still work.
The direct-contract construction check is **not proxy initialization guidance**.
Future same-address mutable configuration may instead need an explicit semantic
commitment/epoch; nothing here freezes that future protocol decision.

Actual coverage remains separate. Detach/write/reattach can leave the same
module PARTIAL despite unchanged configuration. Do not claim this patch proves
COMPLETE-at-write, reconstructs missing history or implements optional backfill.
Do not put routine processed frontiers into signatures. The SDK must retain
qualified reads and may eventually expose explicit coverage preconditions.

### Task 1: Real RED, narrow guard, preserved coverage controls

Worker owns only `lab-b/src/IndexModule.sol`,
`lab-b/test/IndexConfigExpectation.t.sol`, `lab-b/test/IncomingQuotes.t.sol`,
`lab-b/test/FilesJoined.t.sol` and its assigned report. Prepare drafts outside
the lab while the separate withdrawal-reader gate owns its frozen sources.
Do not install these edits until root explicitly releases that gate.

1. Invert the actual signed-downgrade characterization into precise refusal:
   retain genuine pre-mutation signing, non-admin E_ADMIN, required declaration
   refusal, unchanged counters/nonce/coverage after refusal, then successful
   untouched signed input with exact new posting and COMPLETE coverage.
2. Add a test-only derived declaration helper to try required addition,
   optional promotion, mandatory start change and optional overwrite after
   deployment. Each must fail; inherited and both existing specialized
   constructors still install their required families. Sign an Alice action,
   perform a real unrelated Bob action, declare an optional family and bump
   generation, then submit the unchanged Alice action: ordinary progress must
   not change the configuration commitment. Check old cursor invalidation
   separately, with honest optional/PARTIAL and unset-index behavior.
3. Replace only the IncomingQuotes downgrade setup with precise base/specialized
   required-family refusal and actual healthy query controls. Preserve its
   existing genuine late-attachment and detached-gap PARTIAL cases.
4. Replace only FilesJoined's now-prohibited coverage-downgrade setup with an
   actual detached write, reattachment and indexed write. Assert current scope
   and parent coverage PARTIAL and folder E_INCOMPLETE; exact point still reads
   the same bytes/tags without consuming enumeration. Use a fresh Basis and
   compare payload, not full encodings across changed basis. This combines
   partial families; do not claim isolated single-family degradation evidence.
5. Preserve/add actual module-replacement stale-signature refusal and existing
   required-callback rollback. Do not weaken old unknown/stale/corrupt/rollback
   cases. If already exact, reference those tests rather than duplicate them.

Root observes focused compiling RED before implementation. A new error selector
may be declared for compilation, but no enforcing guard before actual RED.
After root authorizes GREEN, add only the two internal declaration conditions
and concise lifecycle comments. No Ledger/Interfaces/schema/paid-runner/oracle
change. Root then runs relevant/full tests and normal sizes at one final frozen
input, followed by independent review of the exact diff and actual outputs.

Worker runs no Forge/compiler/Anvil/RPC/git/subagents. No new paid measurement;
old costs remain pinned to their old implementation. If the guard exposes an
unanticipated semantic mismatch, report it before expanding scope or weakening
assertions. Hard morning cutoff remains14:00UTC.

## Not claimed

No arbitrary malicious callback/reentrancy proof, universal mutable-index ABI,
authenticated state proof, historical native portability, production upgrade
policy or full EFS readiness. Required indexing is preserved, not waived;
late optional indexing remains honestly partial in this limited lab. Publish
the corrected boundary and remaining coverage precondition clearly for SDK and
contracts design rather than describe the whole index layer as solved.
