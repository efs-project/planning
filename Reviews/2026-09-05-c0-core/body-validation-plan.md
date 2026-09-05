# C0 application-body validation implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Turn admitted schema caches into reusable checked application-body values for the joined Core, with independently derived reader evidence.

**Architecture:** A pure Solidity library consumes `TypeGroupParser.SchemaCache` from the existing admission cache and returns canonical top-level field slices and role-tagged reference instances. State lookup, authority, Files semantics and mutation remain outside this parser. A separate JavaScript decoder consumes the independent descriptor parser's trees, not Solidity output, and a local-chain comparison reads the actual admitted cache.

**Tech Stack:** Solidity 0.8.30, Cancun, optimizer 200, via IR; Node 26 and existing ethers 6.15.0. No new runtime dependencies.

**Spec:** [Joined track](README.md); Stage A [encoding §§2.2–2.7, 3.1, 3.5](../2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md), exact sixteen candidates in [inputs](../2026-09-05-mvp-build-start/type-inputs/inputs.v1.json), and the existing [cache contract](../2026-09-05-c0-admission/src/TypeGroupParser.sol).

## Global Constraints

- Disposable local synthetic work only; no product repository, public deployment, main merge, durable data or protocol freeze.
- Preserve the existing sixteen candidate descriptor bytes and source commitments. Do not modify the prior admission experiment or its historical evidence.
- `MAX_BODY_BYTES=8192`, `REF_INSTANCES_MAX=16`, `MAX_NEST_DEPTH=4`; the accepted schema parser already bounds descriptor grammar and extraction walks. Do not silently accept unsupported descriptor selectors.
- Validate all fourteen MC/1 field kinds. STRING admission checks well-formed RFC 3629 UTF-8; it does not claim NFC/Unicode-16 assigned-codepoint conformance.
- BOOL and OPTION flags are exactly 0 or 1; MAP keys sort strictly by complete canonical encoded bytes, including prefixes. No trailing bytes, truncation, oversized counts/lengths, sentinel REF or malformed DIGEST.
- PRINCIPAL remains full-width raw structural bytes; semantic Principal validity belongs to the later state/authority layer. OCCREF instance extraction must preserve its full envelope ID and uint16 leaf index; stateful occurrence membership is not proved by parsing.
- Execute INT_RANGE, NONEMPTY and NAME_PROFILE constraints on their declared top-level fields, distinguishing signed INT from unsigned UINT without narrowing. NAME_PROFILE rejects empty strings and C0/C1 controls; NFC and assigned-codepoint checks remain separately unproved.
- Canonical Record IDs remain ordinary Stage A Record IDs over exact body bytes. No test-only mutation path or arbitrary Type callback is added.
- Test expectations must include hand-framed literals and invalid-but-self-consistent bodies; never compute every expected result with the implementation under test.
- Use exact-path staging and commit-message files with `Agent: v2-pm`, `Harness: codex`, and actual-model coauthor trailers. Root coordinates publication; workers do not push.

## Task 1: Pure Solidity body validation and extraction

**Files:** create `src/RecordBody.sol`, `test/RecordBody.t.sol`, and `foundry.toml` inside this directory. Import the existing parser at `../../2026-09-05-c0-admission/src/TypeGroupParser.sol` from `src/` and `test/` as appropriate. A test-only external harness belongs in `test/`, not the library.

**Interfaces:**

```solidity
library RecordBody {
    struct ReferenceValue { uint8 roleIndex; bytes32 targetId; uint16 leafIndex; }
    struct CheckedBody { bytes[] fields; ReferenceValue[] references; }
    error InvalidBody(uint16 code);
    function validate(TypeGroupParser.SchemaCache memory schema, bytes memory body)
        internal pure returns (CheckedBody memory);
}
```

`fields[i]` is the exact complete canonical encoding of top-level field i,
including OPTION/count/length prefixes. References are in body traversal order,
including each present OPTION and each supported ARRAY element. `roleIndex`
points to the admitted schema's cached role, not a body-supplied role number;
REF uses leafIndex=0 and OCCREF retains its encoded value. Reference class and
expected Type are recovered from that role by the stateful consumer. Do not
conflate zero references with absent data.

- [ ] Write literal tests before implementation. Start with one BOOL descriptor and bodies `00`, `01`, `02`, empty and `0100`; assert returned exact field bytes for valid values and the exact structural error for each invalid value. Stub `validate` with an explicit failing body until RED is observed, then implement.
- [ ] Extend RED/GREEN through UINT/INT/BYTES_FIXED, bounded BYTES/STRING, valid multi-byte UTF-8 and overlong/surrogate/truncated/out-of-range encodings, DIGEST table lengths, REF/OCCREF/PRINCIPAL, ARRAY/MAP/STRUCT/OPTION and empty collections. Parse hand-framed schema groups through the real parser where practical; keep any deliberately forged-cache defense cases labelled.
- [ ] Test constraint boundaries: signed negative INT, unsigned 256-bit values above int256 max, exact min/max, NONEMPTY vs absent OPTION, NAME_PROFILE empty/C0/C1 and valid non-ASCII names. Test canonical map ordering including length prefixes, duplicate keys, reference budget propagation and exact returned slices/role indexes.
- [ ] Load all four retained Type groups using Foundry read-file permission, derive caches with the real parser, and validate representative ObjectGenesis, BindingSet and FileRevision bodies with exact extracted refs/field bytes. These structural fixtures must not claim target existence or Files semantic validity.
- [ ] Run `forge test --root Reviews/2026-09-05-c0-core --use "$EFS_C0_SOLC"`; preserve RED/GREEN command output in the task report. Run whitespace checks; self-review, stage only owned paths and commit. Report current test count and any source ambiguity before implying completion.

## Task 2: Independent body reader and admitted-cache comparison

**Files:** create `reference/record-body.mjs`, `test/body-reader.test.mjs`, `test/admitted-body.test.mjs`, and `test/BodyHarness.sol`; implementation dependencies may import the existing Node crypto library and independent descriptor parser, never the Solidity validation algorithm or a producer decoder.

**Interfaces:**

```javascript
// schema is one member from the existing independent parseGroup() result.
export function decodeBody(schema, bodyHex) {
  // Returns { fields: string[], references: [{roleIndex,targetId,leafIndex}] }.
  // Invalid input throws a typed error carrying the MC/1 numeric code.
}
```

The test-only Solidity `BodyHarness` exposes the Task 1 library as a pure
external method with the exact `SchemaCache` and `CheckedBody` tuple shapes.
The test reads real `getTypeCache` rows after the prior managed local runner
admits its four signed groups. It decodes and independently checks that cache
using the existing reader before calling the harness; no caller-invented
`valid=true` or mirrored fixture registry stands in for admitted Types.

- [ ] Write independent literal decoder tests before implementation; require exact field/ref results, invalid flags, canonical MAP order, UTF-8, constraints and truncation behavior. Use Buffer/DataView byte reads, not Solidity cache-byte interpretation, for body parsing.
- [ ] Implement the reader and a local-chain differential test using the prior managed `withProbe`, `makePublication`, `submit` and independent `parseGroup` functions. Deploy only the test harness on that managed chain with its synthetic payer and normal runtime/gas ceilings.
- [ ] Compare Solidity and JS results for valid and deliberately malformed ObjectGenesis, BindingSet, DirectoryEntry, FileRevision, ChunkTree and nontrivial all-kind literal fixtures. Recompute Record IDs independently from ordinary domain/type/body preimages; mutations get new IDs rather than failing merely on stale hashes.
- [ ] Run Node tests and the full new Solidity suite. Recheck the original Type materializer and admission tests if unchanged dependency assumptions are in doubt; do not regenerate historical measurements. Record resources of the new validator harness as component evidence, not a full-Core fit claim.
- [ ] Write `verification.md` with commands/results, review findings, what could improve and explicit remaining gaps. Update this README and the existing MVP-C0 Kanban card/status once for this session. Root handles independent review, exact-path commit/push and then the next joined stateful admission/Binding step.
