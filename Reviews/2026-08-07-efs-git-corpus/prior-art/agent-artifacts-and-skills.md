# Versioned Agent Artifacts: Skills, AGENTS.md, and Supply-Chain Trust

**Lane:** versioned agent artifacts — Agent Skills, AGENTS.md, and software supply-chain trust as the "install a skill from a repo" evidence base — researched 2026-08-07

Legend used throughout: **[shipped]** = implemented/observable behavior; **[intent]** = documented intent/spec direction; **[rec]** = recommendation (this lane's or a cited author's); **[spec]** = speculation.

---

## 1. Agent Skills: the format, as of mid-2026

**[shipped]** A skill is a directory whose only required file is `SKILL.md`: YAML frontmatter + Markdown body. Required frontmatter is just `name` (≤64 chars, lowercase/hyphens, must match directory name) and `description` (≤1024 chars). Optional: `license`, `compatibility` (≤500 chars, environment requirements), `metadata` (arbitrary string→string map — note: **version lives here, as an unstandardized metadata key**, e.g. `metadata: {version: "1.0"}`), and `allowed-tools` (space-separated pre-approved tool patterns like `Bash(git:*) Bash(jq:*) Read` — explicitly marked **experimental**, "support may vary between agent implementations"). Conventional optional dirs: `scripts/` (executable code), `references/`, `assets/`. Loading is progressive: ~100-token metadata at startup → full SKILL.md on activation → bundled files on demand. Source: the authoritative spec at [agentskills.io/specification](https://agentskills.io/specification), with a reference validator [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref).

**[shipped]** Anthropic published Agent Skills as an open standard on 2025-12-18, releasing spec + SDK at agentskills.io and donating it to the Agentic AI Foundation; adopted by Claude, OpenAI Codex, Gemini CLI, Cursor, VS Code, GitHub Copilot and 20+ other platforms ([Unite.AI](https://www.unite.ai/anthropic-opens-agent-skills-standard-continuing-its-pattern-of-building-industry-infrastructure/), [Simon Willison, 2025-12-19](https://simonwillison.net/2025/Dec/19/agent-skills/)).

**Key gaps for EFS purposes:**
- **No version field in the spec proper** — versioning is a freeform `metadata` convention. **[shipped]**
- **No signing, provenance, or integrity mechanism anywhere in the spec.** **[shipped]**
- `allowed-tools` is the only capability-manifest-shaped thing, it is experimental, advisory in some hosts, and enforced only by some implementations (Claude Code enforces it; others vary). **[shipped/intent]**
- Anthropic's own security model is explicitly human judgment, not containment: "We recommend installing skills only from trusted sources. When installing a skill from a less-trusted source, thoroughly audit it before use" — no sandboxing or capability isolation is described ([Anthropic engineering, 2025-10-16](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)). **[shipped]**

## 2. How skills are distributed and updated today

**[shipped]** The dominant distribution channel is **git repos carrying JSON catalogs**. Claude Code plugin marketplaces (public beta Oct 2025, now stable): a repo hosts `.claude-plugin/marketplace.json` listing plugins; users run `/plugin marketplace add <repo>` and `/plugin install name@marketplace`; updates arrive via `/plugin marketplace update` (re-pull of the catalog repo). Per [the official docs](https://code.claude.com/docs/en/plugin-marketplaces):

- **Plugin sources** support `github`, git `url`, `git-subdir`, `npm`, and relative paths, each with optional `ref` (branch/tag) and **`sha` (full 40-char commit pin — the effective pin when both are set; checkout succeeds even if the ref was deleted upstream, as long as the commit is reachable)**.
- **Version resolution**: if a `version` string is set (in `plugin.json` or the marketplace entry), users only get updates when the string changes; if omitted, **the git commit SHA is the version** — every commit is a new release.
- **Release channels** are done by pointing two marketplaces at different refs/SHAs of the same repo and assigning them to user groups via managed settings.
- Installed plugins are copied to a local versioned cache (`~/.claude/plugins/cache`).
- **Anti-impersonation is name-based, not cryptographic**: a reserved-names list (`claude-plugins-official`, `anthropic-marketplace`, etc.) is re-checked on every load; nothing else authenticates a marketplace beyond its git URL. **No artifact signing, no provenance, no publisher identity beyond "who controls the repo."**

**[shipped]** Third-party aggregation is large and unvetted: e.g. [claude-code-plugins-plus-skills](https://github.com/jeremylongshore/claude-code-plugins-plus-skills) claims 471 plugins / 3,069 skills / 347 agents with its own `ccpi` CLI; Anthropic maintains a curated [claude-plugins-official](https://github.com/anthropics/claude-plugins-official) directory. So the ecosystem answer to "how are skills distributed" in mid-2026 is: **git repos + commit SHAs + curation lists; trust = repo ownership + human review**.

## 3. ClawHavoc: the control case for what "skills registry without trust infra" produces

**[shipped — incident record]** OpenClaw's ClawHub marketplace was poisoned at scale in early 2026: first malicious skill 2026-01-27, surge 01-31; on 2026-02-01 Koi Security counted **341 malicious of 2,857 listed skills (11.9% of the registry)**; Snyk's fuller campaign count reached ~1,467 malicious skills, ~91% combining prompt injection with conventional malware (staged downloads, Python reverse shells, credential/data exfiltration) ([Unit 42](https://unit42.paloaltonetworks.com/openclaw-ai-supply-chain-risk/), [Cybersecurity News](https://cybersecuritynews.com/openclaw-skill-marketplace-exposes-ai-agents/), [Termdock incident report](https://www.termdock.com/en/blog/clawhub-malicious-skills-incident)). Because a skill runs inside the agent's authenticated sessions, a malicious skill inherits the agent's identity wholesale. Remediation was reactive scanning (VirusTotal + ClawScan integration, verified-skill screening shipped ~2026-03-26 per [Reuters via TradingView](https://www.tradingview.com/news/reuters.com,2026-03-26:newsml_ACN105904:0-openclawd-ships-verified-skill-screening-after-security-researchers-find-12-of-openclaw-marketplace-skills-are-malware/)) — i.e., app-store-style post-hoc malware scanning, not provenance. **[rec]** This is the strongest recent evidence that a skills registry needs supply-chain trust *at admission time*, and that markdown-instruction artifacts are malware carriers even without binaries.

## 4. AGENTS.md and the Agentic AI Foundation

**[shipped]** AGENTS.md (released by OpenAI 2025-08) is a plain-Markdown, per-repo agent guidance file with **no schema, no capability semantics, no versioning** — adopted by 60k+ open-source repos and by Amp, Codex, Cursor, Devin, Gemini CLI, Copilot, Jules, VS Code ([openai.com/index/agentic-ai-foundation](https://openai.com/index/agentic-ai-foundation/)). **[shipped]** The Linux Foundation's **Agentic AI Foundation (AAIF)** launched Dec 2025 anchored by MCP (Anthropic), goose (Block), and AGENTS.md (OpenAI), plus Agent Skills; by 2026-05-18 it had ~180 member orgs ([Linux Foundation press](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation), [AIwire 2026-05-18](https://www.hpcwire.com/aiwire/2026/05/18/agentic-ai-foundation-adds-43-new-members-as-adoption-of-open-agent-standards-accelerates/)). **[intent]** Governance of skills/AGENTS.md/MCP is thus converging under one neutral foundation — an EFS-hosted registry would be aligning with a real, funded standardization track, not a single vendor. **[spec]** AAIF is the plausible future home for any skill signing/provenance profile; none exists today.

## 5. MCP server distribution and trust

**[shipped]** The official MCP Registry (registry.modelcontextprotocol.io, preview since 2025-09-08, still pre-GA as of mid-2026) is **metadata-only**: it hosts `server.json` entries, and namespace verification proves control of a GitHub account or DNS domain (reverse-DNS namespaces; keypair + TXT-record challenge via `mcp-publisher login dns`) — "not that a server is safe to install" ([registry repo](https://github.com/modelcontextprotocol/registry), [registry preview post](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/), [publishing guide](https://heyclau.de/entry/guides/publishing-an-mcp-server-to-the-official-registry)). Verification happens at auth time, not via a review queue. The MCP spec itself had a release candidate on 2026-07-28 ([MCP blog](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/)). **[intent/rec]** Academic and industry proposals exist for a "trustworthy MCP registry" adding Sigstore keyless signing of server artifacts, RFC 8615 well-known URIs for domain-bound discovery, and canonical-JSON integrity ([Future Internet 18(5):243](https://doi.org/10.3390/fi18050243)) — proposed architecture, **not shipped**. Net: MCP's answer to trust is *publisher authentication + namespace anti-squatting*, one notch above Claude Code marketplaces (reserved names only), still no artifact signing.

## 6. Supply-chain precedents: what "install versioned capabilities from a public repo" already has

### TUF and gittuf
**[shipped]** TUF (CNCF-graduated) gives the canonical role split for registry compromise resilience: **root** (key ceremonies, offline), **targets** (what artifacts are valid, with delegations per-namespace), **snapshot** (consistent repo view, anti-mix-and-match), **timestamp** (freshness, anti-rollback/freeze), all threshold-signed ([spec](https://theupdateframework.github.io/specification/latest/), [roles doc](https://theupdateframework.io/docs/metadata/)). Used by PyPI infra, Sigstore's root of trust, Docker/Notary. **[shipped/beta]** **gittuf** applies TUF-style policy *inside a git repository* — trust management, branch/path write policies, signing and independent verification "not tied to your source control platform," so any clone can verify that changes followed policy ([gittuf.dev](https://gittuf.dev/), [LWN writeup](https://lwn.net/Articles/972467/)); OpenSSF incubating project, in beta, with active 2026 mentorship investment ([OpenSSF](https://openssf.org/gittuf/)). **[rec]** gittuf is the closest existing artifact to "EFS git repo whose write policy is verifiable by any reader without trusting the host" — exactly the credible-neutrality property EFS wants, though EFS's KEL + on-chain records could replace gittuf's metadata channel.

### Trusted publishing + provenance attestations
**[shipped]** Trusted publishing (OIDC from CI → short-lived publish token, no long-lived secrets) is now cross-ecosystem: PyPI, npm, RubyGems, crates.io (RFC 3691, shipped July 2025; GitLab support in beta), NuGet ([crates.io docs](https://crates.io/docs/trusted-publishing), [Rust RFC 3691](https://rust-lang.github.io/rfcs/3691-trusted-publishing-cratesio.html)). npm auto-generates **Sigstore provenance attestations** (signed link: package version ↔ source commit ↔ build workflow, logged in a public transparency log) when publishing via trusted publishing from GitHub Actions/GitLab CI; verification via `npm audit signatures` ([npm docs](https://docs.npmjs.com/generating-provenance-statements/), [GitHub blog](https://github.blog/security/supply-chain-security/introducing-npm-package-provenance/)). PyPI PEP 740 attestations: on-by-default for trusted publishers since late 2024; 86 of top 360 packages attested (up 309% from Nov 2024) ([PyPI attestation docs](https://docs.pypi.org/attestations/publish/v1/)). Overall adoption still minority; self-hosted CI mostly unsupported ([Mondoo 2026 overview](https://mondoo.com/blog/npm-supply-chain-security-package-manager-defenses-2026)).

**[shipped — critique]** Two load-bearing caveats from 2026 commentary: (1) William Woodruff ("You shouldn't trust Trusted Publishing," 2026-07-07): it is **authentication only** — "anybody can use one, they can be used to upload anything, including malware"; PyPI deliberately shows no safety checkmark; compromised CI, malicious maintainers, and source-level attacks all pass through untouched ([yossarian.net](https://blog.yossarian.net/2026/07/07/You-shouldnt-trust-trusted-publishing)). (2) Andrew Nesbitt ("Two Kinds of Attestation," 2026-02-25): build-provenance attestations prove *how/where built*, are point-in-time, and are disjoint from human attestations about project health (EU CRA steward attestations — checklists "a maintainer could fill out in minutes") ([nesbitt.io](https://nesbitt.io/2026/02/25/two-kinds-of-attestation.html)). **[rec]** Provenance ≠ safety; an EFS registry should not render provenance as a trust badge.

### SLSA
**[shipped]** SLSA v1.1 approved April 2025 (Build track L0–L3: provenance exists → hosted+signed → isolated/hardened build platform); **v1.2 (Nov 2025) added the Source track**, which grades the *revision history* itself (two-person review, branch protection, provenance of source changes) ([slsa.dev v1.2 build-track basics](https://slsa.dev/spec/v1.2/build-track-basics), [SLSA blog](https://slsa.dev/blog)). **[rec]** For skills — which are typically *source-only artifacts* (no build step) — SLSA's Source track is the more relevant rubric than the Build track, and EFS's signed-record git hosting can plausibly deliver Source-track properties natively (every push is a signed on-chain record).

### xz backdoor lessons
**[shipped — incident record]** CVE-2024-3094: the backdoor lived in the **gap between the git tree and the release tarball** — hostile maintainer (multi-year social engineering), payload staged in binary "test files," activated by build-time M4 macro injection only under specific conditions; the git source read clean ([thesamesam gist](https://gist.github.com/thesamesam/223949d5a074ebc3dce9ee78baad9e27)). Community-standard mitigations: diff golden tarballs against `git archive` of the tag; treat opaque binary blobs in source trees as review failures; distrust artifacts that cannot be regenerated from the reviewed revision ([Invicti analysis](https://www.invicti.com/blog/web-security/xz-utils-backdoor-supply-chain-rce-that-got-caught), [Interlynk lessons](https://medium.com/@interlynkblog/xz-backdoor-5-lessons-008723b7cdc7)). **[rec]** For skills the equivalent rule is cheap to enforce: **the installed artifact must be byte-identical to a reviewed git revision** (skills need no build), and bundled non-text assets (`assets/`, binary files in `scripts/`) deserve the "opaque blob" treatment.

## 7. Capability-diff UX: what actually happens when permissions change

**[shipped]** **Chrome extensions** are the only mainstream precedent of a *blocking capability diff on update*: Chrome compares granted vs newly requested permission *warning messages*; if an update escalates (new non-messageless, non-subsumed permission), the extension is **disabled until the user re-accepts** ([permission warning guidelines](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings), [Chromium permissions design doc](https://chromium.googlesource.com/chromium/src/+/main/extensions/docs/permissions.md)). Two consequences: developers actively avoid adding permissions (the disable is a churn event), and optional permissions never trigger the flow. Chrome 130 (late 2024) reworked the chrome://extensions permissions UI toward per-site granularity ([chromium-extensions PSA](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/tqbVLwgVh58)).

**[shipped — evidence users ignore diffs]** The foundational data is Felt et al., SOUPS 2012 (n=308 survey + 25 lab): **17% of users paid attention to permission screens at install; 3% could answer three comprehension questions correctly** ([paper PDF](https://cups.cs.cmu.edu/soups/2012/proceedings/a3_Felt.pdf)). Android subsequently **abandoned install-time permission diffs entirely** (runtime/contextual permissions from Android 6.0), and the field-study literature (Wijesekera et al., "Android Permissions Remystified") showed decisions improve when the request is **contextual — asked at the moment of use, tied to a visible action** ([arXiv:1504.03747](https://arxiv.org/pdf/1504.03747)).

**[shipped — incident record]** **The Great Suspender** (2020–21): open-source extension sold to an unknown buyer (June 2020); v7.1.8 (Oct 2020) silently added tracking + remote code execution; discovery came via a GitHub issue, not the store; Google removed it Feb 2021 ([BleepingComputer](https://www.bleepingcomputer.com/news/security/the-great-suspender-chrome-extensions-fall-from-grace/), [GitHub issue #1263](https://github.com/greatsuspender/thegreatsuspender/issues/1263)). Lesson: **ownership transfer is the attack**, and stores that show permission diffs but not *maintainer-identity diffs* or *code diffs* miss it — the malicious update needed no new permissions.

**[rec — synthesis for meaningful diffs]** The evidence converges on four conditions for a capability diff users act on: (1) **rare** — only escalations interrupt (Chrome's messageless/subsumption collapsing); (2) **semantic** — capability-level ("can now send email"), not raw diff hunks; (3) **blocking** — the update does not apply until accepted; (4) **provenance-inclusive** — surface signer/maintainer changes and unreviewable content (new binary blobs, new network endpoints in `allowed-tools`/scripts), which permission systems today omit. Skills have an advantage here: they are small Markdown+scripts, so a *human-readable full diff* is actually feasible per update in a way it never was for compiled extensions.

## 8. Reproducible builds tie-in

**[shipped]** Reproducibility has crossed from aspiration to policy in 2026: 98.29% of Debian Forky's arch-independent packages reproduce (23,731 pass / 414 bad); on 2026-05-10 the Debian release team began **blocking non-bit-for-bit-reproducible packages from testing**, making Debian 14 "Forky" (exp. 2027) the first major distro to mandate reproducible builds; independent verification runs via rebuilderd + `.buildinfo` files at buildinfos.debian.net ([reproducible-builds.org May 2026 report](https://reproducible-builds.org/reports/2026-05/), [reproduce.debian.net](https://reproduce.debian.net/), [It's FOSS](https://itsfoss.com/news/debian-makes-reproducible-builds-mandatory/)). **[rec]** For skills the problem is *easier than* reproducible builds: a skill has no build step, so "verify against source revision" degenerates to **content-addressing — hash the tree, compare to the git commit tree hash**. EFS records already carry content hashes, so a skill install can be verified against the exact reviewed revision with no rebuild infrastructure at all. The reproducible-builds machinery only becomes relevant if skills ever bundle compiled artifacts (discourage this; see xz).

## 9. What the precedents provide vs leave open for an EFS skill registry

An EFS design of "skill/agent-artifact registry = git repos on EFS + signed releases + capability manifests + meaningful diffs before install" can import, off the shelf:

| Need | Provided by precedent | Status |
|---|---|---|
| Artifact format | Agent Skills spec (SKILL.md, dirs, progressive disclosure) | [shipped], AAIF-governed |
| Distribution shape | git repo + JSON catalog + commit-SHA pinning (Claude Code marketplaces) | [shipped], proven UX |
| Registry compromise model | TUF roles (root/targets/snapshot/timestamp, thresholds, delegation) | [shipped] framework |
| In-repo verifiable write policy | gittuf (TUF-over-git, host-independent verification) | [shipped/beta] |
| Publish authentication | trusted publishing (OIDC), or EFS-native: KEL actor keys signing release records | [shipped] pattern |
| Build/source provenance | Sigstore/in-toto attestations; SLSA v1.2 Source track rubric | [shipped] |
| Escalation-gated updates | Chrome's disable-until-reaccept diff algorithm (messageless/subsumption collapsing) | [shipped] pattern |
| Source-equals-artifact check | content addressing (trivial: skills are source-only) | [shipped] technique |

Left **open** by every precedent — i.e., where EFS would be doing new work:

1. **No capability manifest standard for skills.** `allowed-tools` is experimental, advisory, host-specific, and has no severity taxonomy (nothing like Chrome's warning-message equivalence classes). An EFS capability manifest + a subsumption lattice for "is this an escalation?" would be novel. **[rec]**
2. **No signing/provenance profile for skills at all** — the Agent Skills spec, Claude marketplaces, and the MCP registry all stop at repo/namespace ownership. EFS's signed records + KEL principals natively supply what npm needed Sigstore for: every release is a signed on-chain claim by a stable principal, with actor-key scoping and revocation. **[rec]**
3. **Maintainer-change visibility.** No ecosystem surfaces "the signer changed" at update time (Great Suspender, xz were both ownership/maintainer attacks). KEL makes principal continuity and key rotation *first-class, queryable events* — an update prompt can distinguish "same principal, rotated key" from "new principal now controls this skill." No precedent does this. **[rec]**
4. **Review/steward attestations as portable records.** Nesbitt's gap — machine provenance vs human review — maps directly onto EFS's portable proposals/reviews: a third-party audit of skill revision X can be a signed record any client renders, TUF-style delegation deciding whose reviews count. Precedents define the *formats* (in-toto statements) but no ecosystem ships a working third-party-review layer. **[rec]**
5. **Registry neutrality with reactive defense.** ClawHavoc's fix was centralized scanning + a "verified" tier — exactly the curatorial power a credibly-neutral EFS registry refuses to hold. The open design question: lens-based read policies as *pluggable curation* (multiple competing allowlists/scan-attestation feeds over one neutral record set) rather than one registry operator deciding admission. No precedent demonstrates this; it is EFS's distinctive bet. **[spec]**
6. **Freshness/rollback protection without a central timestamp server.** TUF's timestamp role assumes an online signing service; an EFS registry would need a chain-native equivalent (block timestamps / anchor records) — plausible but undesigned. **[spec]**

## Sources

- https://agentskills.io/specification
- https://github.com/agentskills/agentskills/tree/main/skills-ref
- https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- https://simonwillison.net/2025/Dec/19/agent-skills/
- https://www.unite.ai/anthropic-opens-agent-skills-standard-continuing-its-pattern-of-building-industry-infrastructure/
- https://code.claude.com/docs/en/plugin-marketplaces
- https://github.com/anthropics/claude-plugins-official
- https://github.com/jeremylongshore/claude-code-plugins-plus-skills
- https://unit42.paloaltonetworks.com/openclaw-ai-supply-chain-risk/
- https://cybersecuritynews.com/openclaw-skill-marketplace-exposes-ai-agents/
- https://www.termdock.com/en/blog/clawhub-malicious-skills-incident
- https://www.tradingview.com/news/reuters.com,2026-03-26:newsml_ACN105904:0-openclawd-ships-verified-skill-screening-after-security-researchers-find-12-of-openclaw-marketplace-skills-are-malware/
- https://openai.com/index/agentic-ai-foundation/
- https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation
- https://www.hpcwire.com/aiwire/2026/05/18/agentic-ai-foundation-adds-43-new-members-as-adoption-of-open-agent-standards-accelerates/
- https://github.com/modelcontextprotocol/registry
- https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/
- https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/
- https://heyclau.de/entry/guides/publishing-an-mcp-server-to-the-official-registry
- https://doi.org/10.3390/fi18050243
- https://theupdateframework.github.io/specification/latest/
- https://theupdateframework.io/docs/metadata/
- https://gittuf.dev/
- https://openssf.org/gittuf/
- https://lwn.net/Articles/972467/
- https://crates.io/docs/trusted-publishing
- https://rust-lang.github.io/rfcs/3691-trusted-publishing-cratesio.html
- https://docs.npmjs.com/generating-provenance-statements/
- https://docs.npmjs.com/trusted-publishers/
- https://github.blog/security/supply-chain-security/introducing-npm-package-provenance/
- https://docs.pypi.org/attestations/publish/v1/
- https://mondoo.com/blog/npm-supply-chain-security-package-manager-defenses-2026
- https://blog.yossarian.net/2026/07/07/You-shouldnt-trust-trusted-publishing
- https://nesbitt.io/2026/02/25/two-kinds-of-attestation.html
- https://slsa.dev/spec/v1.2/build-track-basics
- https://slsa.dev/blog
- https://gist.github.com/thesamesam/223949d5a074ebc3dce9ee78baad9e27
- https://www.invicti.com/blog/web-security/xz-utils-backdoor-supply-chain-rce-that-got-caught
- https://medium.com/@interlynkblog/xz-backdoor-5-lessons-008723b7cdc7
- https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings
- https://chromium.googlesource.com/chromium/src/+/main/extensions/docs/permissions.md
- https://groups.google.com/a/chromium.org/g/chromium-extensions/c/tqbVLwgVh58
- https://cups.cs.cmu.edu/soups/2012/proceedings/a3_Felt.pdf
- https://arxiv.org/pdf/1504.03747
- https://www.bleepingcomputer.com/news/security/the-great-suspender-chrome-extensions-fall-from-grace/
- https://github.com/greatsuspender/thegreatsuspender/issues/1263
- https://reproducible-builds.org/reports/2026-05/
- https://reproduce.debian.net/
- https://itsfoss.com/news/debian-makes-reproducible-builds-mandatory/
