# Admission checkpoint verification

Point-in-time disposable evidence on `codex/mvp-c0-coherence`, based on
`499bfca98e47ad2aa16244045c844a66710a62e4`. No full C0, production deployment,
main merge or permanent protocol adoption.

## Fresh controller verification

- **28 Solidity tests pass**: 15 descriptor-parser tests, including 128
  truncation-fuzz runs, and 13 admission tests. The tests use all sixteen
  unchanged candidate Types and independent literal framing/identity vectors.
- **19 Node tests pass** against managed local Anvil, including actual
  transactions, signature/effects/nonce cases, all cache/index read-back,
  exact retry, new-envelope reuse, corrupt evidence, source-qualified
  UNKNOWN/INVALID, and a mined 6-million-gas failure with probe-state rollback.
- **Prior exact-input materialization check passes**, preserving the four
  6/3/6/1 candidate groups and their source hashes. No earlier demo source or
  candidate descriptor was edited by this slice.
- Decision roll-up, design tri-sync and whitespace checks pass. Final
  prepublication checks are rerun after coordination notes are updated.

Commands are in [README](README.md); the local compiler is native Solidity
0.8.30. [measurements.json](measurements.json) records compiler/Node/Anvil
versions, source and executable-dependency hashes, exact receipts, byte sizes,
temporary inputs and the independently verifiable retained snapshot.

## Review repairs

1. **Wrong-reason negative tests.** Some invalid semantic inputs retained old
   enclosing hashes. Their tests could pass even if their dedicated guard was
   deleted. The repaired tests rebuild the affected commitments and sign the
   invalid-but-self-consistent request. A positive control covers the helper;
   thirteen isolated guard-deletion experiments each fail because invalid
   input was accepted. The live contract implementation was not changed.
2. **Missing intrinsic provenance check.** The cold reader now rejects a
   substituted intrinsic member index, including the reproduced value 65535.
3. **Lost failure context.** UNKNOWN retains expected source pins and
   requested/attempted basis without claiming a verified block. Malformed
   returned evidence stays INVALID. Before- and after-basis failure cases are
   covered, and reused encoder/parser hashes are retained explicitly.
4. **Nullish failures escaping the result boundary.** Final joined review
   reproduced collector rejections with `null` and `undefined` throwing from
   the error formatter. Both now return qualified UNKNOWN with `basis:null`;
   focused regressions and the final nineteen-test Node run pass.

The contract/parser and reader task reviews, their scoped re-reviews, and
the final joined review plus scoped repair review all approve this bounded
checkpoint for feature-branch publication. No Critical/Important findings
remain. No main merge or permanent protocol decision follows from that approval.

## What the evidence does not buy

No generic caller-supplied schema registry, generic Record instance validator,
full Unicode implementation, complete G3 capability manifest, initialized C0
Realm, Binding/Lens/Files operation, session wallet or nine-test joined C0
journey was implemented or declared passing here. Automatic postings concern
the admitted TypeSchemaGroup leaves; hypothetical instances' index declarations
are parsed and retained, not executed.

The runtime is 18,739 bytes and the most expensive measured group is
12,717,326 gas. This answers whether this straightforward finite admission
slice fits its selected envelope. It does **not** prove the complete Core fits
or that this ABI-word cache representation should become permanent.

## Implementation handoff

Use the exact inputs and adversarial cases to design the real admission
module, retaining an independent reconstructor as its consumer. Keep its
parsed-cache details below the SDK's prepare/approve/submit/verify boundary.
The remaining integrated build step is full initialization plus Binding/Lens
and the three Files mutations, then the nine joined C0 journeys. These remain
engineering work, not a new list of philosophical questions for James.
