# Can the cheaper Files kernel use real EFS Types?

2026-09-12 · source preflight, not implemented or adopted

**Yes, a meaningful bridge appears feasible:** reuse the actual structural parser/validator in a fresh native typed-byte profile, with canonical EFS Type/Record IDs. This would not automatically acquire full-C0 admission, portable authorship, Binding effects, arbitrary developer callbacks or declared-index completeness. Its complete transaction costs remain unmeasured.

Evidence bases: reviewed native`4cb004273982411d4699fa15d388750638cd1358` and full-C0`8688d5299eac8d9f83264806c32de471f427bbb2`. Two bounded read-only expert passes traced both helper semantics and the existing producer/consumer/browser integration. Root checked the actual helper/reference and native registry/kernel/caller seams. No source was changed.

## The reusable part is real

`PreparationHelper.compileGroup` uses `TypeGroupParser.parseWithDependencies` and produces exact member IDs and compiled caches. `prepareRecord(...,bodyOnly=true)` still runs `RecordBody.validate`, including canonical structural encodings, nested containers, constraints and reference extraction. It skips occurrence-key derivation and `BindingFold.decode`.

A fresh registry could expose group registration, validate through its own authenticated caches, retain canonical group bytes/origins, verify external Type dependencies and install a group's caches atomically. Conflicting cache registrations must reject. The kernel stores/read-backs immutable Records using the exact formulas:

```text
groupId  = keccak256(abi.encode(keccak256("efs2/typeschema-group/1"), keccak256(groupBytes)))
typeId   = keccak256(abi.encode(keccak256("efs2/typeschema/1"), groupId, memberIndex))
recordId = keccak256(abi.encode(keccak256("efs2/record/1"), typeId, keccak256(body)))
```

The existing native profile uses validator runtime hashes in Type identity and a different `EFS21_RECORD_V1` Record formula. **Its IDs cannot be relabelled.** This bridge needs a distinct fresh-genesis profile and explicit reader support; old demos/evidence remain unchanged.

## Semantic obligations that cannot be wished away

- Structural reference parsing does not establish a target's existence, exact Type or authority. Full-C0 checks those separately. A Record-reference profile can check an existing target and its expected Type in the native registry; Object references additionally require the exact ObjectGenesis Type, not a native File handle. Occurrence/Principal/other unsupported classes require explicit refusal, not a false guarantee.
- The smallest proposed first browser slice is reference-free schemas, with schema-level refusal even when this particular body's optional reference is empty. Supporting exact Record references is a distinct possible next slice. Neither choice has been selected or measured yet.
- `SELF` means the containing exact TypeId. It is not the submitter, current file or an authority grant. Group references resolve to sibling TypeIds. Publisher fields in bytes remain claims; author-neutral storage does not establish a maintained charter.
- `bodyOnly` skips Binding effect decoding—including target exclusivity—and posting-key derivation. CAS and withdrawal application live separately in StateKernel and are not provided by this bridge. For a bounded structural profile, deny direct storage under the exact pinned full-C0 BindingSet/BindingTombstone/Withdrawal Types; intrinsic group material uses group registration only. Apply refusal through direct storage, create/edit and duplicate submissions. Names or copied field shapes are not reserved identity.
- Preserve canonical index declarations and expose the storage profile's actual support. Do not advertise full admission or COMPLETE declared queries from structurally checked bytes. The exact index-policy treatment needs to agree with [[2026-09-12-efs21-index-policy-boundary]] before an implementation claims Type-declared obligations are enforced.
- This is a fixed reviewed structural interpreter, **not arbitrary programmable acceptance**. James's developer-defined validation requirement remains separate; this experiment must not substitute a few handwritten validators or structural checks for it.

## It can connect to the existing Files path

Keep the native Files facade's create/edit/read interfaces, namespace ownership, CAS, history, Navigation and mandatory RecordInventory behavior. Native File handles remain chain/kernel/owner/nonce-derived and are not ObjectGenesis IDs. Replace registry registration/metadata, both Record-ID implementations, default Type setup and source qualification. Do not fabricate old `(schemaHash,validator,codeHash)` metadata for an interpreter/cache graph.

Two fixture Types are the smallest useful starting point:

| Type | Canonical body | Effect on callers |
|---|---|---|
| One UINT(32) field | Exactly32bytes | Existing quote producer's `abi.encode(value)` and reader's decode can remain; exact TypeId changes. |
| One BYTES field | Two-byte length followed by payload | SDK/browser/download/history paths must encode/decode explicitly. Empty payload is`0x0000`, not an empty canonical body. |

The old headerless-raw versus dynamic-ABI representation conversion is not preserved by renaming either one. A third BYTES wrapper around `abi.encode(payload)` is possible, but inner ABI canonicality would still require an application-codec check. Prefer a separately named two-Type bridge over silently presenting all three representations as unchanged.

Discovery currently authenticates the exact Uint256Validator runtime when attaching a numeric index. It must instead authenticate the exact single-UINT32 schema/profile while preserving namespace ownership, current-live-File population, backfill, health and maintenance rules. The scalar value decode can remain. Simply swapping registry addresses is insufficient.

The native4096-byte canonical-body cap would leave4094bytes of raw payload in the illustrated BYTES encoding. Supporting the full-C08192-byte body domain requires an explicit new profile and real bounds/read tests, including expanding the native sparse-body storage capacity. This is not free capacity from a TypeId change.

## Decisive experiments before claiming a bridge

1. Differential canonical groups/bodies: nested encodings, constraints, SELF/sibling dependencies and malformed inputs produce the exact EFS IDs and structural outcomes. Classify unsupported reference/profile cases separately from malformed bytes. Keep the independent oracle unchanged.
2. Actual Files producer → path lookup → unrelated paid consumer, plus browser create/edit/rename/history/reload/download under the new encodings. Missing/wrong-Type refs, spoofed publisher claims, reserved Types and substituted helper/cache/registry code cannot acquire unsupported guarantees. Late failure rolls back storage, Files and mandatory indexes.
3. Whole group setup/storage and paid reads under ordinary limits, including large bodies, the legal64-field cache and large-group helper output. The retained compact codec is **codec-only** evidence. It would have to compact inside helper output as well as storage to address both known blockers; no full-language feasibility claim follows before those cases run.

Source seams: full-C0 `PreparationHelper`, `Preparation`, `RecordBody`, `TypeGroupParser`, `StateKernel.group/references`; native `ExpandedTypeRegistry`, `NativeRecordKernel`, `NativeKernel`, `DiscoveryIndex`, `Examples`, `PayloadConsumer`, and `scripts/world.mjs` / `sdk/{qualification,client}.mjs`.

Independent source review approved after separating helper effect decoding from StateKernel's CAS/withdrawal application. This is an option for preserving useful Type expressiveness in the cheaper kernel, not a ruling to discard the fuller model. Current implemented results and other independent cost levers: [[2026-09-11-efs21-overnight]].

## Post-copy source preflight: a small integration boundary

Read-only comparison against reviewed full `ebc7d540570827c5f5052af83d2cbd80f54092a7` found that the helper's six-file closure differs from native `4cb0042` **only in `RecordBody.sol`**, by the reviewed MCOPY change. Root independently checked that exact Git diff. The closure is PreparationHelper, Preparation, RecordBody, BindingFold, IndexKeys and TypeGroupParser; no StateKernel, StateStore, authority adapter or full Files router needs importing. If selected, backport that exact reviewed helper delta and qualify the actual new native-build artifact. Equal compiler settings/executable behavior do not guarantee equal metadata or full runtime hashes under different source names.

A bounded implementation would separately deploy the helper, then thread its authenticated address/hash through Files → Record kernel → a new canonical registry. Do not embed its creation bytecode in the existing nested deployment graph. Registration must check every group member before installing caches; the first reference-free profile must refuse schema references/roles/external dependencies even when an optional body field is empty, and explicitly handle unsupported index declarations. Keep exact group bytes, origins, member associations and cache bytes/hash. Repeat registration must compare these and avoid redeployment, not merely find an existing TypeId. Those checks are bridge obligations, not claims about today's low-level cache accessor.

The registry validates Records through its own authenticated cache with `bodyOnly=true`; supplied cache bytes cannot bypass registration. Apply reserved mutation-Type/intrinsic-group refusals to every Record path, including dedup. Use a named canonical SDK profile rather than counterfeit old validator tuples. An initial fixed two-member UINT32/BYTES4094 group permits unchanged quote values and explicitly re-encoded file payloads under the existing4096 canonical-body cap. Retain source/compiler and old artifacts, differential group/cache/body evidence, setup/repeat-registration/whole-write/paid-read costs, and named legal large-cache/output failures. No cache compaction,8192 capacity or arbitrary acceptance is bundled. This remains a preflight, not a dispatched or priced integration.
