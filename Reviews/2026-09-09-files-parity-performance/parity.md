# V1 feature parity: what earns a pass

**Status:** acceptance inventory for the disposable v2 build, not a parity claim.
Source: sibling v1 contracts at `c6b4075`; current v2 upgrade foundation at
`03825f1`, plus the explicitly identified follow-on experiment here.

The target is user/contract-visible capability, not copying v1's internal
schemas. Passing generic storage checks alone does not satisfy a Files row.

| Capability | V1 reference | V2 pass requires |
| --- | --- | --- |
| Directory listing, empty folders, pagination | EFSFileView / EFSIndexer | Real bounded Binding-scope enumeration, pinned basis, no omissions after churn; a usable guest list |
| File creation / metadata / retrieval | EAS + resolvers + Router | Exact admitted file/revision/entry, Files profile/authority guards, staged bytes verified on read |
| Edit / historical versions | PIN replacement + previousVersion property | Stable File ID, new immutable revision, race-safe head update, old links readable |
| Second placement / hardlink | Multiple PINs to DATA | Same File Object at two names; removing one placement leaves the other |
| Rename / move | Placement/revocation/whiteout primitives | Atomic source mask and destination placement, contract preconditions, stable descendants on folder move |
| Copy | Client publication composition | New File identity with shared exact content permitted; edits independent |
| Delete overlay / undo | WHITEOUT/revoke | No lower-Lens reappearance after remove; restore checks collision; bytes/history never claimed erased |
| Removed-items UX | Not equivalent to merely revoking an edge | Ordinary removal marker + current Binding; rename masks do not appear in Trash |
| Lens selection | EFSRouter / EFSFileView | Actual contract A-first/B-first/EXACT behavior and identical SDK/browser result; unknown higher tier cannot silently fall through |
| Tags / filters | TAG + active slots / EFSFileView | Current attributed assertions, A untag preserves B, scoped positive/negative filters with honest coverage |
| Properties / extensible typed data | PROPERTY/schema/resolvers | Exact Type and reference validation, explicit application semantics, supported typed table and unknown-Type retention |
| Multiple mirrors / transport fallback | MIRROR / Router | Locator/authority handling, corrupt-source rejection and a verified alternate source; not an invented availability guarantee |
| Onchain bytes / chunked reads | EFSBytesStore / Router | Empty, small and multi-chunk cases, bounded resource use and reconstruction from retained data |
| Collections / list membership | ListResolver/ListEntryResolver/ListReader | Ordinary Types and contract-readable ordered membership with defined duplicate/removal/authority semantics |
| Redirects / aliases / symlinks | AliasResolver + reader rules | Explicit supported redirect meanings; cycle/hop bounds, Lens scope and useful refusal outcomes |
| Sorting | EFSSortOverlay + sort functions | Explicit scoped ordering; page-local sort cannot claim global ordering over partial input |
| Testnet upgrades | Proxy-ready resolvers | Same addresses/data, old evidence interpretation, stale-plan refusal, new writes and full walkthrough after upgrade |
| Independent Solidity consumer | Router / FileView / ListReader | A deployed local consumer reads the same Lens/files result without relying on a JS-only reducer |

## Current boundary and next join

September 8 proved the real typed Store, current Binding effects and retained
state across a Core/carrier upgrade. Its canaries also exposed that structural
validity alone does not enforce Files names/charters or automatic old-Type
compatibility. The lifecycle/performance runner in this directory extends
that evidence; it is not a certified FilesRouter or static browser.

The next consumer join remains [the existing one-screen checkpoint](../2026-09-08-upgradeable-foundation/consumer-checkpoint.md):
bounded reads and actual contract Lens/Files preconditions, exposed through one
shared Reader/Actions API to a dumb-host static SPA. Do not replace it with a
parallel browser-side authoritative tree. Full real-wallet evidence and the
sixteen-row [owner walkthrough](../../Designs/efsv2/testnet-files-mvp-plan.md)
remain separate completion gates.

**Scope discipline:** v1 collections, transports, redirects and sorting are
tracked here so they cannot disappear behind a claim that generic Types can
express them. Their product priority can be decided after the first usable
Files loop; this inventory does not silently declare all of them implemented
or block reversible work until every advanced feature is finished.
