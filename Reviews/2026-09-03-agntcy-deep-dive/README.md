# AGNTCY and EFS — agent profiles, skills, and shared public data

**Date checked:** 2026-09-03 (America/Chicago)

**Audience:** James; EFS, SDK, Git/Forge, Open Web App Store, Web/OS, and NANDA designers

**Status:** dated research and recommendations, not an adopted architecture, integration commitment, or production-readiness claim.

## Executive answer

**AGNTCY is serious prior art and a direct competitor to a thin “global agent profiles and skills directory.” It is also a strong interoperability target.** It already publishes content-addressed agent descriptions, distributes actual skill files/bundles, signs records, supports discovery and replication, and connects with existing agent protocols. EFS should not claim those capabilities are unique.

The promising EFS contribution is a **shared, permissionless information layer**: independent people and agents publish reusable configuration, data, relationships, reviews and authorized updates over common subjects; consumers choose whose statements to use; Ethereum contracts can validate and consume bounded parts of that state. That is broader than finding an agent or downloading its skill. It is also a target EFS must demonstrate, not a shipped advantage.

**Recommended next step:** one disposable comparison using the same public agent profile and skill package, first with ordinary Git/OCI + AGNTCY, then with an optional EFS-backed claims/history adapter. Include a second independent contributor and one contract consumer. If the second arm adds no useful capability, keep AGNTCY as the solution to that job.

This is not a reason to abandon EFS, add an agent-specific Core kind, or accelerate protocol freeze. It is a reason to sharpen the proposed agent product before investing in another registry.

## 1. What AGNTCY is trying to build

AGNTCY's goal is an interoperable Internet of Agents across frameworks, vendors and organizations. It started as Cisco open source in March 2025, with LangChain/Galileo collaboration, and moved under Linux Foundation governance in July 2025. Discovery, identity, messaging and observability are separate components rather than one mandatory application framework. [Linux Foundation announcement, 2025-07-29](https://www.linuxfoundation.org/press/linux-foundation-welcomes-the-agntcy-project-to-standardize-open-multi-agent-system-infrastructure-and-break-down-ai-agent-silos).

| Component | Job | Relevance to James's idea |
|---|---|---|
| OASF | Extensible agent-description schemas, capability taxonomies, integration modules and artifacts | Common vocabulary and import/export format, not a replacement for every document format |
| Directory / ADS | Publish, store, discover, verify and synchronize agent records | Direct overlap with a shared agent/skill directory |
| Identity | Identifiers, signed badges/credentials and policy-oriented verification | Publisher/workload trust; not automatic EFS account authority |
| SLIM | Secure interactive messaging, streaming and group communication | Possible transport for agents that also use EFS |
| SHADI | Agent runtime, scoped secrets, OS sandboxing and encrypted local memory | Relevant prior art for host/OS boundaries, not just metadata |
| Observability, evaluations, CSIT | Trace/evaluate workflows and test component integration | Useful evidence producers; not objective truth about an agent |

These are current documented project surfaces; their maturity and versions differ. [AGNTCY documentation](https://docs.agntcy.org/). No single “AGNTCY version” establishes compatibility across all of them.

There is more substance than a vision page: Directory v1.7.0 was released August 18, 2026, including HTTP search and taxonomy-extraction APIs alongside existing CLI/SDK/gateway support. [Release notes](https://github.com/agntcy/dir/releases/tag/v1.7.0). Webex reports Directory and Identity integration in its Agent Central Service for MCP onboarding/discovery and badges; its February announcement still described A2A registration and automatic external federation as future work. This is credible first-party adoption evidence, not an independently measured public network. [Webex, 2026-02-27](https://developer.webex.com/blog/webex-leverages-agntcy-directory-and-identity-for-agentic-apps).

## 2. How the Directory works

A typical flow is:

1. Describe an agent/tool/package in OASF, or import an existing format.
2. Validate the record against the configured schema service.
3. Store the content-addressed record in an OCI-backed store.
4. Attach signatures and, where configured, assessment evidence.
5. Announce availability to the directory network.
6. Discover candidates, retrieve an exact record and its artifacts, verify relevant claims, then explicitly decide whether to install or invoke anything.

The network does not turn a catalog entry into a running agent. Directory includes installation tooling, but execution and access remain separate decisions.

### OASF records: more than a business card

A record includes such information as name, version, authors, description, creation time, capability taxonomy labels, domains, locations and modules. Modules can represent MCP servers, A2A cards, prompt-related information or Agent Skills. **OASF `skills[]` capability labels are not themselves `SKILL.md` packages**; the latter are carried by a dedicated module. [OASF record guide](https://docs.agntcy.org/oasf/agent-record-guide/) and [released skill translator](https://github.com/agntcy/oasf-sdk/blob/e0c46da35f6133c500dbba658c005f2a5c523846/pkg/translator/agentskills.go).

Taxonomy improves shared discovery, but a label is a claim, not demonstrated competence. Capability interpretation, prompt wording and importer correctness still matter. Prefer existing external taxonomies where useful while retaining the original artifact and any independently published evaluations.

### Storage and IDs

The released Go implementation stores canonicalized whole-record JSON as one OCI blob, with a manifest tagged by its CID. The enclosing manifest has its own OCI identity. Its CID calculation uses SHA-256 and CIDv1; it is not simply an IPFS UnixFS file CID. [Record encoding](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/api/core/v1/record.go), [CID code](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/api/core/v1/cid.go), [OCI implementation](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/server/store/oci/oci.go).

**It identifies this exact description, not “the same agent forever.”** A changed description or timestamp changes the record CID even when the skill payload is unchanged. Keep distinct:

- stable agent/project subject;
- exact OASF record revision;
- exact skill/archive bytes;
- currently selected revision;
- running instance and its authorization.

The same distinction already matters for EFS Files, Arcade projects/releases and Git artifacts. A universal content ID does not settle naming, authorship, latest state or availability.

### Discovery and replication

Directory uses libp2p DHT provider announcements and, in the inspected implementation, GossipSub label propagation into peer-local caches. Local SQL search, local-provided-record listing and cached remote routing search are different query surfaces. Remote results are not an exhaustive global inventory. [Routing implementation](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/server/routing/routing_remote.go), [usage scenarios](https://dir.agntcy.org/latest/dir/dir-features-scenarios/).

OCI synchronization and optional authenticated-peer autosync support replication and offline copies. They do not promise indefinite public retention; someone still operates and retains those stores. “No results here” must not become “no such agent exists.” EFS likewise needs explicit query scope, basis, coverage and availability, rather than using a chain or content hash as a substitute for them. [Routing/sync docs](https://dir.agntcy.org/latest/dir/dir-component-routing/), [autosync source](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/server/routing/autosync/autosync.go).

## 3. How much of the skill/file idea is already solved?

**A substantial amount.** Released Directory v1.7.0 pins an OASF SDK that retains original Markdown and gzip-compressed tar bundles; this is not just an unreleased September feature. The CLI also imports/exports bundles and can install into supported agent skill folders after a preview/confirmation flow. [Dependency pins](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/cli/go.mod#L21-L33), [bundle translator](https://github.com/agntcy/oasf-sdk/blob/e0c46da35f6133c500dbba658c005f2a5c523846/pkg/translator/agentskills_bundle.go#L37-L85), [install command](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/cli/cmd/install/install.go).

For James's proposed tool, the important qualifications are:

- **Original file vs reconstructed metadata:** when the stored original Markdown is available, export preserves it. Without it, export reconstructs frontmatter only, not the instruction body.
- **Full bundle vs one facade:** CLI/API/SDK bundle support does not imply bundle support in the released MCP wrapper; that wrapper calls single-Markdown functions.
- **File bytes vs filesystem fidelity:** regular companion files are packaged, but symlinks, empty directories and executable mode bits are not preserved by the inspected importer. Release-pinned archive mtimes can also make rebuilt archives differ.
- **Stored bytes vs truthful projection:** static review found a simplified YAML parser and a separately supplied Markdown/archive path that does not compare both copies of `SKILL.md`. Search metadata can therefore disagree with retained instructions.
- **Described integrity vs checked integrity:** some export helpers decode stored bytes without checking their declared digest/size; verification must be explicit at the consuming boundary.
- **Package size vs publishability:** SDK archive limits are larger than Directory's 4 MiB protobuf-record cap, which includes inline base64 data.

These are interoperability and validation work items, **not reproduced exploits or evidence that the project is unsafe overall**. Exact sources, version caveats and untested paths are in [the source audit](source-audit.md#skills-and-artifact-fidelity).

The ordinary [Agent Skills format](https://agentskills.io/specification) already accommodates Markdown instructions plus scripts, references, assets and other companion files. EFS should preserve it, not invent a competing EFS-only skill format.

## 4. Profiles, SOUL documents and memory are different jobs

“Profile” is overloaded. OASF schema profiles are attribute overlays, not agent personalities. OASF can describe agents and carry arbitrary artifacts, but this pass found no established `SOUL.md` lifecycle specifying authority, precedence, adoption, delegation and updating across runtimes. SHADI has real encrypted local memory, not an evidenced global public-memory exchange. [OASF profile schema](https://github.com/agntcy/oasf/blob/3d1b83b6410f222ba2f920e31728041f517ecc9e/schema/metaschema/profile.schema.json), [SHADI architecture](https://github.com/agntcy/shadi/blob/3c712854a5e8999b5c6f9dc3f34fedb276ce105e/docs/content/architecture.md).

James's idea separates into useful products:

| Thing being shared | Appropriate treatment |
|---|---|
| Public profile/capability description | Discoverable, attributed claims; map to OASF/A2A where appropriate |
| Public SOUL/role/instruction document | Exact versioned artifact, with named publisher and explicit consumer adoption |
| Skill/tool package | Ordinary external format plus exact closure, provenance and compatibility evidence |
| Shared knowledge, configuration or results | Typed, attributed public data reusable by multiple agents/apps |
| Private memory, conversations and credentials | Local/encrypted access-controlled state; not publicly published by default |
| Running agent/session permissions | Host/account authorization; not inherited from a document or directory listing |

This decomposition is an EFS product recommendation, not an adopted schema. A `SOUL.md` can be a useful file without creating a new identity standard.

A concrete example: James publishes a public “research librarian” role and an exact skill revision. Another person publishes a review of that revision; a third contributes a compatible dataset; two communities recommend different versions. Agents can read the same underlying contributions and choose different trust policies. Only the local host/operator decides which instructions to adopt and what tools or signing powers to grant. **Retrieved instructions are data until explicitly adopted; discovering a profile must never overwrite the agent's own policy.**

The concurrent internal EFS role-system work is related but separate: it defines James's repo-local roster, briefs and handoffs. It neither publishes those briefs globally nor transfers James's permissions with a role name. See the reviewed branch snapshot in [local evidence](#10-efs-state-and-routing).

## 5. Identity, trust and governance: do not flatten the layers

There are several distinct checks:

1. Do these bytes match the expected content ID?
2. Is a signature cryptographically valid?
3. Does the accepted publisher/domain/issuer control the signing key?
4. Is the claim fresh, unrevoked and relevant?
5. Has the local operator authorized this action?

Directory uses signatures/referrers, including self-managed keys and Sigstore flows; domain-name verification uses published JWKS; workload/channel identity can use SPIFFE. These are not the same mechanism as the separate Identity service. [Directory trust model](https://dir.agntcy.org/latest/dir/dir-component-trust-model/), [signing source](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/client/sign.go).

AGNTCY Identity supports self-signed registration as well as IdP-backed issuers and revocation. Its inspected identifier generator is not uniformly a W3C DID: it includes provider-prefixed identifiers. SHADI separately uses `did:key`; its security notes explicitly say the human-to-agent relationship is not yet verified at on-wire admission. Avoid mapping any of those identities automatically to an ENS name or EFS Principal. Such a mapping needs its own evidence and scope. [Identity ID generator](https://github.com/agntcy/identity/blob/452077220fc5b7c5c5198251b945df5fe61628f2/internal/node/id_generator.go), [issuer CLI](https://github.com/agntcy/identity/blob/452077220fc5b7c5c5198251b945df5fe61628f2/cmd/issuer/README.md), [SHADI security notes](https://github.com/agntcy/shadi/blob/3c712854a5e8999b5c6f9dc3f34fedb276ce105e/docs/content/security.md).

**AGNTCY is genuinely open source; dismissing it as a proprietary Cisco registry would be wrong.** Its adopted charter provides open participation, public technical governance, Apache-2.0 code, CC-BY-4.0 documentation and formal voting rules. The reviewed TSC roster spans six companies, although Cisco has three of eight listed members and all five listed Core working-group leads. This shows meaningful institutional openness alongside leadership concentration, not a measured company-level share of all engineering. [Technical charter](https://github.com/agntcy/governance/blob/02a14eb4eb771f74c13d612b18b69b00ea3f7b32/CHARTER.pdf), [TSC](https://github.com/agntcy/governance/blob/02a14eb4eb771f74c13d612b18b69b00ea3f7b32/CONTRIBUTING.md), [working groups](https://github.com/agntcy/governance/blob/02a14eb4eb771f74c13d612b18b69b00ea3f7b32/working-groups/WORKING-GROUPS.md).

Foundation governance, deployment autonomy, admission permissionlessness, payload durability and globally agreed state are separate axes. Neither LF stewardship nor Ethereum settlement automatically supplies every axis. A self-hosted Directory can admit anyone; an EFS deployment can still have infrastructure dependencies, fees, censorship and payload loss.

## 6. The concrete current-state distinction

The most relevant source finding is Directory's convenient `name[:version]` resolution:

- The server returns matching records from its local database.
- Multiple CIDs can have the same name/version.
- Default ordering uses **local database ingestion time**, then CID—not semantic-version ordering or a shared consensus head.
- The CLI selects the first result.
- Domain-name verification is a separate operation, not required by that resolver.

Consequently, two peers with different ingestion histories can resolve the same shorthand differently. That is an inference directly from the inspected lookup/order path, not a reproduced network experiment. [Naming controller](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/server/controller/naming.go#L164-L213), [database ordering](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/server/database/gorm/record.go#L385-L423), [CLI selection](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/cli/util/reference/reference.go#L99-L135).

Legacy records have predecessor fields, while the inspected OASF v1 adapter does not supply one. Unpublishing removes local routing state but does not retract remote announcements. This pass did not establish an enforced revision-transition or durable signed withdrawal protocol across peers. This is **not** a claim that Identity lacks credential revocation. [Adapters](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/api/core/adapters/oasf_v1.go), [routing unpublish](https://github.com/agntcy/dir/blob/64ed9299436df9277d3d0bebede73630c26dffba/server/routing/routing.go).

EFS's candidate advantage is explicit, replay-safe authorized state changes and policy-qualified resolution. But **EFS also does not have one magically global “latest.”** Its state is qualified by Realm, authority, policy and observation basis. Chain-independent identity is not global agreement over selections. Keep exact revision links usable even when current-state resolution is unavailable.

## 7. Where EFS competes, complements or should concede

| User need | AGNTCY assessment | EFS implication |
|---|---|---|
| Publish/discover a profile or skill | Substantial released support | Direct competition; use as baseline |
| Export exact skill files and replicate records | Already supported with qualifications | Content hashes/export/mirrors alone are not differentiation |
| Cross-organization messaging and enterprise trust | Dedicated components and integration evidence | Prefer integration; do not build a competing transport just for EFS |
| Local secrets and private agent memory | SHADI overlaps this space | Study host patterns; do not move private memory onchain |
| Open publishing of shared configuration/data beyond agents | Extensible records can represent much of it | EFS must demonstrate better reusable cross-app semantics, not merely more fields |
| Independent reviews, relationships, competing curators | Representable through extensions/referrers and app logic | Test the value of common typed queries and attributed public history; not an exclusive EFS idea |
| Authorized current head, conflict handling, bounded contract consumption | Not established by inspected Directory semantics | Strongest EFS candidate value; requires an actual useful contract/application consumer |
| Permanent availability or universal truth | Neither guaranteed by the reviewed stack | EFS must also separately solve custody, coverage and trustworthy policy |

The strongest case **against** using EFS here: a publisher with its own Git repo, OCI registry and Directory can already ship signed versioned skills cheaply, mirror them and connect agents. Public disclosure, gas, chain choice, finality, onboarding and extra identity mappings may make EFS worse for that job. Signed catalogs, transparency logs or conventional replicated databases may also meet a particular shared-history requirement. The comparison must allow those alternatives to win.

The strongest case **for** EFS: collaborators who do not share one service operator need public, composable statements and qualified state that ordinary applications and contracts can independently consume. This directly serves James's “everyone has a voice” and reusable shared-data goal; operator exit is one supporting property, not the whole product.

## 8. Interoperate at the edges, not by replacing standards

Recommended layering, **not a frozen architecture**:

- Preserve original `SKILL.md`, companion files, A2A cards and MCP descriptors. Native package formats remain authoritative for their own meaning.
- Carry OASF as an external description/projection, with explicit schema/importer revision and original bytes. Do not silently translate unknown fields away.
- Let an optional EFS profile link the stable subject, exact native artifact and independent claims. Preserve the native Directory CID and any separate EFS ID; never claim they are the same identifier.
- Let Directory/AI Catalog/NANDA help agents discover candidates. Discovery results authorize nothing and are not proof of complete public coverage.
- Use the existing protocol appropriate to interaction—MCP, A2A or possibly SLIM. Do not put every ephemeral conversation or tool call onchain.
- Keep installation, SOUL adoption, secrets, spending and EFS writes behind the host's existing consent and capability policy.

Agent Skills, OASF, OCI and established identifier formats are **reuse candidates with different jobs**, not one universal format to adopt wholesale. ADS and SLIM are currently individual IETF Internet-Drafts, not finalized RFCs. AI Catalog/ARD is another evolving discovery effort; version-pin any projection instead of claiming permanent compatibility. [ADS status](https://datatracker.ietf.org/doc/draft-mp-agntcy-ads/), [SLIM status](https://datatracker.ietf.org/doc/draft-mpsb-agntcy-slim/), [AI Catalog](https://github.com/Agent-Card/ai-catalog), [ARD proposal](https://agenticresourcediscovery.org/spec/).

No evidence in this pass establishes an existing EFS–AGNTCY or NANDA–AGNTCY integration/partnership. Compatibility is an investigation, not a relationship to announce.

## 9. One useful next experiment

**Working question:** can an EFS adapter add a valuable shared-data capability without forcing agents out of normal formats and tooling?

Use synthetic, explicitly public inputs: two independently operated agents, one small skill folder, one role/SOUL document, one shared dataset and one independent review. No James private memories, personal role context, real credentials or production records.

### Baseline first

Pin Directory v1.7.0 and its dependencies. Exercise import → validate → push locally → exact retrieval → export, then a second local peer. Do not publish to the public network. Check that all original payload bytes survive; document import/extraction differences. Measure cold/warm retrieval, package size, setup effort and actual calls; report observations without inventing success thresholds.

### Add only the missing shared-data job

Using the v2 owner's **supplied disposable EFS revision**, represent the public subject and independent claims; retain native OASF and payload IDs. Have one consuming app and, only when the experimental Core supports it, a tiny contract consumer use the same selected data. An unavailable/unsupported Core interface is an honest result, not authority to design another one.

Run these falsifiers:

1. Two different CIDs claim the same agent name/version; peers ingest in opposite orders.
2. The publisher legitimately updates a role; another signer tries to overwrite it.
3. A reviewer disagrees, later withdraws its own review, and both histories remain distinguishable.
4. A profile's discovery description differs from its bundled instructions.
5. The primary copy is corrupt or unavailable; an exact independent copy exists—or all copies are absent.
6. A name/JWKS/schema/identity service is unavailable or returns stale evidence.
7. A discovered SOUL asks the consumer to alter its own rules, exfiltrate memory or sign a transaction.
8. The agent's actual A2A/MCP endpoint changes behavior despite an unchanged descriptor.
9. The index omits an existing claim; “not found” remains scoped rather than global absence.
10. Remove the EFS adapter: ordinary skill export and non-EFS operation still work.

Return one table: requirement, conventional baseline result, incremental EFS result, dependency/cost, and whether EFS was actually needed. **Stop without further platform work if EFS only duplicates storage and search.** If the advantage is real, route the narrow generic gap to the existing owner rather than adding an Agent/Soul kernel kind.

Not authorized by this research: a public directory, new standard, durable chain writes, production deployment, installed third-party skills, onboarding contacts, a new milestone, or automatic publication of internal EFS role files.

## 10. EFS state and routing

The comparison is to **EFS v2's current design target**, not a claim that it is deployed. Main was read at `8ae846a`; the active MVP-C0 branch was additionally inspected at `12ef4c5b929759c87fcf4886a1619734a6f9a044`. Its disposable control and session/first-use-cost work do not turn experimental interfaces into permanent protocol approval.

Current reading routes:

- [EFS v2 map](../../Designs/efsv2/README.md) and [constitution](../../Designs/efsv2/system-constitution.md): generic shared-data/authority/query target.
- [Open Web App Store](../../Designs/open-web-app-store/README.md): packages, plural evidence and distribution versus activation.
- [NANDA pressure intake](../../Brainstorms/2026-07-29-pm-nanda-neutral-agent-infrastructure-pressure.md): downstream interoperability; historical mechanisms must be rechecked.
- [Git and agent-artifact intake](../../Brainstorms/2026-07-29-pm-credibly-neutral-git-forge-and-agent-artifacts.md): ordinary formats, public artifact versus private memory.
- Role-system branch `codex/agent-role-system`, implementation contract `709297633de3ed48fe10149e24426223e625e310`, operating-doc snapshot `f01bff5`: repo-local role portability, not global identity or execution grants. Inspect the assigned revision if these files are not on your checkout; do not infer absence of work.

**Routing:** General PM retains this research. Git/Forge and App Store owners can use the native-artifact/fidelity findings; SDK and v2 owners can use exact-ID, current-state and coverage falsifiers; Web/OS owns instruction adoption and runtime authority; NANDA owners decide which discovery interfaces have actual consumers. No owner decision queue or design body was changed. No new immediate decision is required from James.

## 11. Method, confidence and remaining unknowns

Three independent read-only lanes audited (a) Directory storage/routing/state, (b) OASF/skill fidelity and dependency pins, and (c) governance/identity/runtime. The coordinating PM checked the high-impact released bundle, CID, name-resolution/ordering, Identity identifier and SHADI linkage claims against source and checked the EFS main/active-branch boundary.

This was documentation, released-source and current-source review, **not a runtime benchmark, deployment, security audit or executed conformance suite**. No public writes, installs, identity registration, scans of real third-party agents or skill execution occurred. Source tests were inspected, not run. Static discrepancies are labeled accordingly.

The unresolved questions that matter are actual cross-peer behavior under faults, cross-language CID canonicalization, release-pinned MCP import/validation compatibility, fresh revocation and recovery, operator/federation participation at scale, runtime identity-to-endpoint binding, real user demand and the measured incremental benefit/cost of EFS. See [version pins, contradictions and follow-up evidence](source-audit.md).

Research stopped once each question had primary support or a bounded unknown; further broad surveying would not resolve the remaining implementation and adoption questions. A disposable comparison is now more valuable than another abstract landscape pass.
