# C0 engineering decisions and input inventory

**Status:** implementation recommendations for the next full C0 experiment;
not permanent protocol decisions. The workflow lab tests a smaller profile.

## Three explicit next-implementation recommendations

### Authenticated initialization

Recommend passing the complete canonical seed preimage to `initializeC0` as a
separate wrapper argument. Decode it using the already tested seed codec,
recompute the immutable constructor seed, and require the caller to equal the
seed's `bootstrapAuthorAddress`. Check the seed's Codex/capability/group roots,
actual chain configuration, salts, code templates and declared deployment
facts before accepting the unchanged Stage A InitConfig tuple. Check its
null-policy commitment using the final deployment commitment. An arbitrary
first caller therefore cannot become the authority or choose the configuration.

This does not append fields to Stage A InitConfig or add the final commitment
to the constructor. Core/carrier addresses remain computable before the final
deployment commitment. A factory may orchestrate deployment, but an initializer
call from the factory must not silently bypass the seeded bootstrap author.
An owner-signed exact initialization digest is an alternative for factory
batching if later evidence justifies that additional signature profile.

Required tests: hostile first caller; changed author/config/preimage; extra or
missing bytes; wrong chain/salt/runtime; second initialization; downstream seal
revert; exact before/after snapshot; independently regenerated Realm facts.

### Type identity before Type admission

G0 derives all group/member IDs from the ordered exact descriptor bytes. Core
may store the anticipated ChunkTree Type ID while G2 seals the carrier, but
must retain a distinct `admitted` state. The ID must be derived from the group
inventory committed by the seed, never supplied independently by the caller.
G4 admits that group through SR-17 and checks that its derived member equals
the anticipated ID. Runtime activation requires all 16 expected Types to be
admitted and all derived caches/index capabilities to match their commitments.

Required tests: supplied correct ID with missing group; reordered or substituted
member; correct group with wrong member index; attempt to use an anticipated
but unadmitted Type; partial materialization rollback. Merely knowing an ID
does not establish that its schema or instances have been admitted.

### Enforceable session budgets

For the first full C0 run, set native value and token spending to zero and
reject nonzero value at every entry point. Bind per-write payload/envelope byte
limits, cumulative bytes, operation count, root/Route, operation mask, expiry,
executor code and a never-recycled nonce lane in the exact approved grant.

The previous phrase "aggregate gas ceilings" is underspecified: contracts
cannot retrospectively bound the entire transaction cost, relayer overhead,
refunds or wallet gas pricing merely by checking `gasleft()`. Recommend a
named **execution gas budget** for the bounded Core operation frame, with
documented metering boundaries and atomic rollback on excess; relay fee/payment
budgets remain separate. Its own measurement overhead and the carrier call
must be included. Do not call this a maximum user fee or gas reimbursement.
Compare a bounded subcall stipend with conservative entry/exit gas metering
before encoding this field into the full C0 grant.

The workflow lab instead enforces operation count and aggregate payload bytes,
and explicitly makes no gas-grant conformance claim. This is a measured test
subset, not an implicit deletion of the full C0 experiment's requirement.

Root membership requires a finite selected ancestor proof under the same
Route/Plan/basis, bounded by the run profile. Raw existence or a lexical path
prefix does not prove authority. A single-parent laboratory tree can test
membership failures but does not validate the full multi-placement Files graph.

## Exact Type inventory

Member order is the source order, not an order sorted by hashes. Local group
references use assigned member indexes before hashing. The table defines the
implementation tasks; it does not pretend prose fields are encoded blobs.

| Group/member | Exact Type | Definition to materialize and exercise |
|---|---|---|
| 1/0 | ObjectGenesis/1 | publisher Principal, salt, optional meaning; charter authority remains a Binding fact |
| 1/1 | ResolutionPlan/1 | one bounded BYTES frame; exact frame grammar and finite Principals |
| 1/2 | ByteDigest/1 | tagged digest and size semantics from Stage A content chapter |
| 1/3 | ChunkTree/1 | chunkSize/count/totalSize/root; sole empty form; foundation vectors already available |
| 1/4 | Locator/1 | exact content reference and transport declaration; no authority from availability |
| 1/5 | RepresentationBinding/1 | exact representation/content linkage; no extra File identity |
| 2/0 | BindingSet/1 | three position words, exactly one target option, optional predecessor Occurrence |
| 2/1 | BindingTombstone/1 | three position words and predecessor; not an application whiteout |
| 2/2 | Withdrawal/1 | exact Occurrence reference; carriage withdrawal is not revocation of meaning |
| 3/0 | DirectoryEntry/1 | parent, name, child, optional Mount; contextual directory/mount rules |
| 3/1 | DirectoryWhiteout/1 | parent and name; hides lower selected tiers |
| 3/2 | FileRevision/1 | File, ChunkTree, MIME/charset/executable hint, up to eight sorted same-File parents |
| 3/3 | PublicFilesMountConfig/1 | namespace/content/metadata Plans and optional property profile |
| 3/4 | MountDescriptor/1 | root Object, profile and exact config; contextual config validation |
| 3/5 | FilesRouteConfig/1 | Realm/Mount/profile, basis/completeness/freshness and exact writer/code fields |
| 4/0 | MvpC0BootstrapSeal/1 | exact G11 commitment/Realm/code/roots/Principal/route and pre-seal admission high |

For each Type, write one machine-readable descriptor source with canonical
meaning/name/qualification, field tree, closed reference roles, index specs
and constraints. One independent encoder emits group bytes; another parser
recomputes them. Commit field labels, meanings and index declarations as
explicit temporary inputs; never silently hash paraphrased documentation.
Check the group carriage bound before any contract deployment.

## What remains between the workflow lab and full C0

1. The 16 exact blobs, capability/Codex closure and SR-17 parser/materializer.
2. The full author-neutral Record/Envelope/Occurrence/Principal spine, retained
   historical authority and mandatory generic indexes.
3. BindingScope and four-outcome Lens over actual C0 Plans, including complete
   historical scope enumeration and qualified conflict/absence.
4. CREATE2 provenance, G0–G12 state reconstruction and activation with the
   authenticated initializer above.
5. Exact C0 WritePlan/grant codecs, finite membership proof and metering.
6. Binding-based Files semantics and the existing foundation ChunkTree carrier.
7. Rebind the lab's browser/SDK acceptance tests to the actual serialized C0
   artifacts; run the nine M0 rows and report them individually.

All are engineering tasks with explicit pass conditions. None currently needs
a new product choice from James. A full Core that exceeds resource budgets or
fails bounded reconstruction would return a concrete measured design fork.

## Sources

- [C0 genesis](../../Designs/efsv2/mvp-c0-genesis-manifest.md), G0–G12.
- [C0 authorization and grants](../../Designs/efsv2/disposable-mvp-profile.md), section 4.
- [Stage A encoding](../2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md), MC/1 and SR-17.
- [Files fields and contextual rules](../../Designs/efsv2/hierarchical-files-and-folders.md), sections 3–8.
- [Tested seed/carrier codec](../2026-09-04-mvp-c0-foundation/run-codec.md).

## 2026-09-05 input-materialization correction

The table above is a historical task inventory, not the source of field bytes.
Materialization found that `ByteDigest/1` has exactly one `DIGEST` field and
**no size field**, per [content §4](../2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md).
The earlier "digest and size semantics" wording must not become a descriptor.
The same content chapter uses `expectedType = ANY` when a reference accepts a
profile-defined set of multiple TypeSchemas. The profile validates that set;
Core does not encode an invented set-valued reference constraint. This is
distinct from inventing an unqualified parent role or treating existence as
authority. Consume the [source-pinned input experiment](../2026-09-05-mvp-build-start/plan.md)
and its explicit temporary metadata/index choices, not prose paraphrase hashes.
