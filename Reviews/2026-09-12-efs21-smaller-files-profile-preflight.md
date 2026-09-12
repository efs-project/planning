# Does every file need seven Records?

September 12, 2026 · source-backed design preflight, not an adopted profile or measured saving

**No.** Seven is the current fresh-create recipe. It is not a minimum imposed on all data by the Type system. The meaningful distinctions are stable identity, immutable revision/content, placement, and an author's mutable selections. Their representation can change, but a smaller recipe must say which independently useful operation or guarantee it removes.

Read-only expert preflight and root spot-check at full-C0 `d0a908de` and native `4cb0042`. The current SDK planner and contract router both enforce this recipe:

| Record in a fresh file create | What it means |
|---|---|
| ObjectGenesis | Stable file identity, nominated publisher, FILE meaning |
| Charter BindingSet | Publisher-authenticated establishment and independent maintenance of the file |
| ChunkTree | Exact content commitment and carrier geometry |
| FileRevision | Immutable file-specific revision, metadata and parent revisions, referring to content |
| Head BindingSet | Author's current revision choice, with independent CAS/history |
| DirectoryEntry | Immutable parent/name/child/optional-mount placement description |
| Name BindingSet | Author's selected occupant of that name slot, with independent CAS/history |

Seven selected leaves need not create seven new Record rows: exact bytes deduplicate, while fresh publication occurrences still need their own admission/lifecycle/index treatment. Envelope and Batch overhead are shared. Existing COPY already selects six leaves by reusing an admitted ChunkTree; that content's earlier creation must remain in setup/lifecycle pricing.

Source: `Reviews/2026-09-09-files-browser-mvp/sdk/files-actions.mjs` create/edit/copy branches; `contracts/src/FilesRouterV2.sol` CREATE_FILE/COPY template checks, at the full-C0 revision above. A custom “combined file operation” Type cannot silently perform multiple Binding mutations: Core's `BindingFold.decode` recognizes the exact configured mutation Types.

## Two smaller profiles worth distinguishing

### First experiment candidate: small values inline in revisions

Use a new exact revision Type with a bounded canonical payload, metadata and parent revisions. Start with a fixed32-byte quote value. Keep stable identity, charter, name and head Binding rules. Replace ChunkTree + FileRevision with one Record: six-leaf create and two-leaf edit.

The revision keeps its exact RecordId. A separately domain-separated content digest identifies the canonical value independently of file identity, parent revisions and path. **This is not the existing ChunkTree Record interface.** Content is no longer independently reusable/addressable as that Record; copies duplicate their embedded payload, and this profile does not support large/chunked/carrier-backed files. Existing FileRevision consumers need explicit support for the new exact Type.

This is the preferred first smaller-profile experiment because it changes bounded content representation without also changing authenticated establishment or Binding lifecycle. It might serve `/swaps/eth-usdc`; no cost reduction is established from leaf counting alone.

### Alternative: let the publisher's initial head establish a file

Keep the existing Record Types except omit the file charter Binding. Require the nominated publisher's authenticated revision-one head mutation to select a valid initial FileRevision for the Object. A publisher field in unsigned bytes is insufficient; source, mutation history and selected target must all be qualified. Directory charters stay unchanged.

This preserves ObjectId, separate content/revision IDs, placements, head/name CAS and history, but **couples establishment to content-head lifecycle**. There is no independently maintained/revocable file charter, and an invalid initial head cannot be repaired later to establish the file under this rule. Another publisher's head cannot establish it. Current reader `node()` deliberately separates historical charter validity from present maintenance; deleting one planner leaf without new router/reader qualification would be wrong.

This option is not selected for implementation. It changes a more fundamental application meaning than the inline-value candidate.

## Tag and native-profile boundaries

Stable file identity, exact revision and principal-qualified name slot remain distinguishable in either profile. A tag on the file can follow a move; one on an old revision should stay on it; one on a location can remain when a different file replaces that location. Identical payload content is another possible explicitly identified subject, not automatically synonymous with file revision.

Current `FileTagAssertion` targets ObjectGenesis and the router validates Object meaning. VERSION/LOCATION tagging is **not existing full-browser parity**. A future profile experiment must use explicit subject domains and test their movement/replacement semantics; it must not rename the existing `tag()` behavior and claim those cases were already implemented. This is an implementation gap, not proof that the Type model cannot express those relations.

The native candidate has compact direct FileInfo/history/navigation with caller ownership, one placement and one CAS counter covering edit/move/unlink. It does not have full-C0 Bindings, Occurrences, plural Lens selection or a revision DAG. Its revision identity is `(FileId, counter)`, not a separate FileRevision RecordId. Its much cheaper producer/consumer demo is useful evidence, not a price for identical guarantees.

## Proposed bounded falsifier, after physical-storage work

Compare unchanged Files against inline-quote Files in fresh worlds: create → edit → stale-edit refusal → rename/move → replace the old location → historical read. Include same-content edits and copy to expose lost content-sharing benefits. An unrelated paid consumer must check the exact value, content digest and revision identity. Explicit file/version/location tag fixtures should demonstrate their distinct subjects and late failure must roll back all effects.

Keep the current full-C0 signature/executor rules for this comparison. A contract forwarding a signed intent is not autonomous native contract authorship. Charge complete publication/staging, Type/profile setup, indexes, qualification and paid reads. Keep existing large-file support in the original profile; do not silently reinterpret old Types, drop indexes, or attribute independent storage improvements to the new recipe.

No implementation or gas result is claimed here. The immediate full-model task remains [[2026-09-11-efs21-shared-slab-plan|shared physical byte storage]], which keeps the existing seven facts while testing their storage cost. Smaller application profiles and the full-model kernel/index split are separate levers.
