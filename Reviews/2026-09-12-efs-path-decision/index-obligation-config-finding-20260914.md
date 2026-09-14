# A signed write must bind the query promises it relies on

**Date:** September 14, 2026

**Standing:** executed, independently reviewed prototype finding; proposed
production remedy, not a permanent design decision or a waived requirement.

## In ordinary language

Suppose an app signs “save this note” expecting the required index to support
complete discovery. Our current compact prototype binds the index contract's
address and code, but not every setting inside it. The admin can change a
required family's coverage declaration while the signature is waiting. The
write still goes through, even though the old discovery promise is no longer
reported as COMPLETE.

We reproduced that exact sequence. **The note and its index entry were not
lost.** This is a missing signed-configuration guarantee, not a broken signature
or an attack available to any user. It belongs in the pre-MVP execution-contract
design instead of being hidden in SDK documentation.

## What the test actually establishes

At B `f05cf59`, a real signed seed establishes from-genesis COMPLETE coverage.
The next genuine EOA publication is signed before mutation. Non-admin
redeclaration rejects; actual admin redeclaration changes the family to
optional/from-admission-2. Module obligation hash, codehash, generation, nonce
and admission counts are unchanged by that metadata operation. Submitting the
untouched signature then creates the exact fresh Record, advances nonce and
counts, and appends the ordinary by-Type posting. Coverage stays PARTIAL even
after indexing catches up.

Solidity 0.8.30 compiled successfully; the one characterization test passed.
The independent reviewer approved it without rerunning. Retained source,
compiler input/output, reports and review:
[index-config packet](https://github.com/efs-project/planning/tree/eda7a0c/Reviews/2026-09-12-efs-path-decision/lab-b/index-config-20260914).
Source digest: `2f3166aed720a12afbee6af89199432bf09dc40d6dac7bcea89ee1acf5ea8a78`.
No paid cost or consumer-refusal measurement is inferred from test gas.

## Recommended design direction

1. **Freeze mandatory query obligations within an execution configuration.**
   An optional-index declaration must not silently replace a required family's
   definition. Replacing the configuration is an explicit operation, not a
   mutation hidden behind an unchanged address/codehash.
2. **If obligation-affecting settings are mutable, bind their commitment to
   pending intents.** Their family/profile set and coverage-start semantics
   matter. A changed execution configuration should require a new signature.
   Do not include constantly moving processed counters: that would invalidate
   unrelated queued writes every time anyone used the system.
3. **Treat actual coverage as a separate condition.** A configuration hash does
   not prove an index is caught up. If an action requires particular COMPLETE
   queries at admission, that is an explicit checked precondition. A consumer
   that requires COMPLETE must still check coverage at its read basis.

The smallest fix to this demonstrated example is rejecting redeclaration of
an already-mandatory family. That alone does not solve every future mutable
module setting. The prototype test deliberately records current behavior and
should be retired or inverted when its chosen repair lands.

## Consequence for the path decision

This does not reverse [[provisional-recommendation|B first]], remove required
indexing, or change the already measured cost table. It gives the contracts and
SDK teams a concrete configuration/authentication boundary to close. The
ongoing [[files-joined-implementation-plan-20260914|Files reader experiment]]
separately tests fail-closed coverage and explicit tag-subject handling.
