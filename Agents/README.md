# EFS agent roles

Portable operating briefs for named roles, independent of model, harness, or chat title. Start or resume with [the shared launch contract](./launch.md); [harness loading](./harnesses.md) and an optional [handoff template](./handoff-template.md) support that same contract. The General PM's existing [brief](./pm.md) and [launch prompt](./pm-launch.md) keep their paths.

## Roster

This table is the sole registry of IDs, names, exact aliases, brief paths, and use classifications. Match IDs, names, or semicolon-separated aliases case-insensitively; do not guess a fuzzy match. `established` means an established role definition, **not a running task, permission, product approval, or design freeze**. `on-demand` roles start only for a bounded assignment. Historical model-shaped slugs cannot be reliably mapped to a single role; preserve their history unchanged.

<!-- role-registry:start -->
| Role ID | Name | Aliases | Brief | Use |
|---|---|---|---|---|
| pm | EFS Project Manager | Project Manager; General PM; EFS General PM | [PM SOUL](./pm.md) | established |
| v2-pm | EFS v2 PM | v2 PM | [SOUL](./v2-pm/SOUL.md) | established |
| web-client-os-pm | EFS Web Client / OS PM | Web Client / OS PM | [SOUL](./web-client-os-pm/SOUL.md) | established |
| sdk-pm | EFS SDK PM | SDK PM; EFS v2 SDK PM; v2 SDK PM | [SOUL](./sdk-pm/SOUL.md) | established |
| git-forge-pm | EFS Git / Forge PM | Git / Forge PM | [SOUL](./git-forge-pm/SOUL.md) | established |
| arcade-pm | EFS Arcade PM | Arcade PM | [SOUL](./arcade-pm/SOUL.md) | established |
| native-filesystem-pm | EFS Drive / Native Filesystem PM | Drive / Native Filesystem PM; OS Drivers PM; EFS OS Drivers PM; OS Drives PM; EFS OS Drives PM | [SOUL](./native-filesystem-pm/SOUL.md) | established |
| app-store-pm | EFS Open Web App Store PM | Open Web App Store PM | [SOUL](./app-store-pm/SOUL.md) | established |
| data-explorer-pm | EFS Files / Data Explorer PM | Files / Data Explorer PM; Data Explorer PM; EFS Data Explorer PM; Data Explorer PM (Files app); EFS Data Explorer PM (Files app); Files PM; EFS Files PM | [SOUL](./data-explorer-pm/SOUL.md) | established |
| media-library-pm | EFS Media Library PM | Media Library PM | [SOUL](./media-library-pm/SOUL.md) | established |
| booru-pm | EFS Booru PM | Booru PM | [SOUL](./booru-pm/SOUL.md) | established |
| contracts-dev | EFS Contracts Dev | Contracts Dev | [SOUL](./contracts-dev/SOUL.md) | established |
| web-client-dev | EFS Web Client Dev | Web Client Dev | [SOUL](./web-client-dev/SOUL.md) | established |
| sdk-dev | EFS SDK Dev | SDK Dev | [SOUL](./sdk-dev/SOUL.md) | on-demand |
| integration-test-lead | EFS Integration & Test Lead | Integration & Test Lead | [SOUL](./integration-test-lead/SOUL.md) | on-demand |
| security-reviewer | EFS Security Reviewer | Security Reviewer | [SOUL](./security-reviewer/SOUL.md) | on-demand |
<!-- role-registry:end -->

**Split legacy label:** `Media Library / Booru PM` (also `EFS Media Library / Booru PM`) is intentionally not an automatic alias. Ask which assignment is intended: shared media infrastructure/personal playback → `media-library-pm`; tagged gallery/discovery/curation → `booru-pm`. A task spanning both names one acceptance owner and the other as collaborator; it does not recombine the roles. The media brief explicitly separates its shared-infrastructure and provisional personal-library product hats.

## Maintenance and authority

Briefs are name-stable living operations documents, never numbered or promoted through the protocol-design ceremony. General PM curates this registry; each role may refine its operational notes within an authorized scope. Ownership, authority, cross-role boundaries, and global workflow changes require owner approval. [Human authority](../Onboarding/authority.md) remains unchanged; reusable professional briefs grant no accounts, credentials, private context, or authority to another human.

Keep current tasks on the existing [Kanban](../Kanban.md), decisions in their owning queues/history, and exact source revisions in task handoffs. Do not add a per-role status database, shadow board, mandatory empty handoff, scheduler, or independent per-harness persona. Design maps may be branch-visible; the [launch contract](./launch.md#resolve-the-source-not-just-the-folder) explains source resolution. A missing map is not evidence that its work does not exist.
