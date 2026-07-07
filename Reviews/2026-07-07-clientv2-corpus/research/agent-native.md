# Agent-native systems, protocols, and safety — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** agent-native. **Date:** 2026-07-07.

## Executive summary

The agent-protocol layer consolidated hard in the last 18 months: MCP won as the tool-connection standard (donated to the Linux Foundation's Agentic AI Foundation, Dec 2025; ~97M monthly SDK downloads, 10k+ public servers), A2A became the LF-hosted inter-agent standard (150+ orgs, v0.3 with signed AgentCards), and the browser vendors started shipping page-level agent contracts (WebMCP in Chrome Canary, still a W3C Community Group draft with **zero** mainstream agent consumption as of mid-2026). Meanwhile the security record is unambiguous: prompt injection in browsing/computer-use agents is **unsolved and vendor-admitted-unsolvable** ("unlikely to ever be fully 'solved'" — OpenAI, Dec 2025; "no browser agent is immune" — Anthropic, Nov 2025). Every deployed system converged on the same compensating architecture: capability scoping, plan-before-read, human confirmation for irreversible actions, watch modes on sensitive sites, and spend mandates. The academically strongest defense line (CaMeL and the six design patterns) says the quarantine must be **structural**: untrusted content may fill data slots but must never select actions. This is a near-perfect endorsement of the EFS client v2 pipeline (typed plan → dry-run → approve → execute → receipt, Kernel-enforced) — EFS should treat that pipeline as the *load-bearing security boundary*, not a UX nicety, and treat MCP/WebMCP/A2A as derived bridge surfaces compiled from app-manifest action catalogs. The sharpest protocol-level frictions for EFS v2: permanent records amplify agent compromise (an injected agent's flushed envelope is forever), the envelope has no actor/on-behalf-of dimension (agent writes are indistinguishable from human writes to lenses), and read grades carry no machine-readable taint/provenance dimension for agent consumption policies.

---

## 1. What exists today (shipped)

### 1.1 MCP — the de facto tool protocol

- **Spec 2025-06-18** (current-1): added **elicitation** (server pauses tool execution to ask the user for structured input), **structured tool output** (`structuredContent`), resource links in tool results, OAuth: MCP servers classified as OAuth **Resource Servers**, clients MUST implement RFC 8707 Resource Indicators (anti token-theft), removed JSON-RPC batching, added Security Best Practices page (token passthrough, confused deputy, session hijacking). Source: modelcontextprotocol.io changelog.
- **Spec 2025-11-25** (current stable): **experimental Tasks** (durable requests, polling, deferred results), **URL-mode elicitation** (hand the user a browser flow — i.e., protocol-level secure-prompt handoff), tool calling inside sampling, OIDC Discovery for auth servers, OAuth Client ID Metadata Documents, icons metadata, incremental scope consent via `WWW-Authenticate`, JSON Schema 2020-12 baseline, formal governance + working groups + SDK tiering.
- **Adoption reality**: OpenAI, Google DeepMind, Microsoft all ship MCP clients. ~97M monthly SDK downloads (Python+TS); >10,000 active public servers; an independent Q1 2026 census indexed 17,468 servers across registries. Anthropic **donated MCP to the Agentic AI Foundation** (Linux Foundation directed fund) on 2025-12-09, alongside Block's goose and OpenAI's AGENTS.md; platinum members AWS, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI.
- **MCP Registry**: launched preview 2025-09-08; **still preview as of mid-2026** (data resets and breaking changes allowed; ~2,000 entries). Third parties (JFrog, AWS) shipped their own GA registries first. Lesson: the official discovery layer trails the ecosystem by a year, and listing is not vetting.

### 1.2 A2A — inter-agent protocol under the Linux Foundation

- v0.3 spec: **signed AgentCards** (JWS per RFC 7515 over JCS/RFC 8785 canonicalized JSON), gRPC + JSON-RPC + REST transports, task lifecycle, five production SDK languages. Draft v1.0 in progress.
- One-year milestone (April 2026): 150+ supporting orgs; native integration in Azure AI Foundry, Amazon Bedrock AgentCore, Google Cloud; production use in supply chain, financial services, insurance, IT ops. 22k GitHub stars.
- Honest read: adoption is real but enterprise-B2B-shaped; nothing in A2A addresses end-user client OS concerns directly. Its durable contributions for EFS: the **signed, canonicalized capability card** pattern and task-state lifecycle vocabulary (submitted/working/input-required/completed/canceled/failed).

### 1.3 Computer-use / browsing agents and their guardrails (deployed HITL patterns)

- **Anthropic Claude for Chrome** (limited beta Aug 2025 →): site-level permissions, mandatory confirmation before high-risk actions (purchases, sharing personal data), blocked site categories (financial services, adult), injection classifiers that force user-confirmation when triggered. Measured attack success rate (ASR) trajectory: 23.6% unmitigated → 11.2% autonomous-mode with safeguards (Aug 2025) → **~1% vs an internal adaptive attacker with 100 attempts/environment** (Claude Opus 4.5, research post 2025-11-24); browser-specific vector suite 35.7% → 0%. Anthropic's own framing: 1% "still represents meaningful risk"; "no browser agent is immune to prompt injection." Defenses: RL training on injected content, content classifiers, continuous red-teaming.
- **Anthropic computer-use API guidance**: run in VMs/containers with minimal privileges; avoid access to sensitive accounts/data; allowlist domains; human watches and can kill the container; classifiers auto-steer the model to ask confirmation when injections detected in screenshots.
- **OpenAI Operator system card (2025-01) → ChatGPT agent (2025-07) → Atlas browser (2025-10)**: layered mitigations — explicit **confirmations** before financial transactions/sending email/deleting events (100% confirmation rate on financial-transaction evals), **watch mode** on sensitive sites (execution pauses if the user navigates away or goes inactive), **takeover mode** (user types credentials themselves; agent doesn't see them), **logged-out mode** (agent browses without the user's sessions — default-deny of ambient authority), no code execution / downloads / extension installs in the agent browser context. Dec 2025 hardening post: RL-trained automated attacker for long-horizon (100+ step) injection campaigns; official position that prompt injection is a permanent, unsolvable-in-general threat class managed like scams/social engineering.
- **Brave research on Perplexity Comet** (Aug + Oct 2025): indirect injection via hidden page content and **unseeable screenshot injections** (faint text invisible to humans, extracted by OCR and executed as commands); demonstrated exfil of emails/OTPs via the agent's ambient logged-in authority. Brave's conclusion: systemic to AI browsers, not a Comet one-off — the browser cannot distinguish user intent from page content.

### 1.4 MCP security incident record (the confused-deputy canon)

- **Tool poisoning** (Invariant Labs, Apr 2025): hidden instructions in a tool *description* got Cursor to read `~/.ssh` keys and exfiltrate.
- **GitHub MCP cross-repo exfiltration** (Invariant Labs, 2025-05-26): injection in a public issue steered the victim's agent to read private repos and write contents into a public PR. Classic lethal-trifecta.
- **Supabase MCP leak** (mid-2025): agent ran with `service_role` (RLS-bypassing) credentials while reading attacker-authored support tickets; SQL in a ticket got executed, tokens dumped into the public thread.
- **Asana MCP cross-tenant bleed** (May–Jun 2025): server bug leaked ~1,000 customers' data across MCP instances — multi-tenant server-side state is itself a hazard.
- **mcp-remote CVE-2025-6514**: critical RCE in a 558k-download npm bridge package — supply chain applies to agent plumbing too.
- **Microsoft advisory (June 2026)**: poisoned MCP tool descriptions cause agent data leaks — the vector is still live a year after first disclosure.

### 1.5 Spend, budgets, payments

- **AP2 (Agent Payments Protocol)** — Google Cloud + Coinbase + 60-org coalition, Sept 2025; v0.2.0 Apr 2026. Core object: the **Mandate** — *open mandates* (user constraints: budget cap, allowed merchants/instruments, validity window, for autonomous execution) vs *closed mandates* (authorization of one finalized transaction). Verifiable-credential based; the A2A x402 extension is production-ready for crypto payments (x402 V2 Dec 2025: wallet-based identity, multi-chain); card rails still maturing.
- **Visa Trusted Agent Protocol** (signed, purpose-identifying, time-boxed credentials in request headers) and **Mastercard Agent Pay** (Agentic Token binding cardholder + registered agent + mandate scope; network enforces spend limits before auth) + **Verifiable Intent** (SD-JWT delegation chain binding identity→intent→action with selective disclosure). Shipped 2025–2026.
- **Cost blowouts as a forcing function**: agentic coding tasks consume ~1,000× the tokens of a single-turn query (GitHub research, May 2026). Uber burned its entire 2026 AI budget in 4 months of Claude Code (Dec 2025 rollout → Apr 2026); a widely reported $500M single-month overrun at another firm; Microsoft canceled internal licenses before fiscal close. Anthropic shipped **Claude Enterprise spend controls** (model-level entitlements, spend-threshold alerts, SCIM dashboards) only on 2026-07-02 — i.e., budget governance was a *retrofit* everywhere.

### 1.6 Receipts / audit logs

- **OpenTelemetry GenAI semantic conventions**: client (inference) spans exited experimental in early 2026; **agent/framework/MCP-tool spans still "Development" status** with no committed stabilization timeline, though stable in practice; Datadog and others natively map them. The emerging receipt shape: every tool invocation logged with identity context, authorization scope, parameters, data touched, policy-check outcome.
- AWS Bedrock AgentCore ships OTel-compatible observability as a first-class platform feature; "enterprise guardrails that differentiate what humans can do and what agents can do" is now marketing copy — i.e., the human/agent authority split is a mainstream expectation.

### 1.7 llms.txt — adoption reality

- Proposed by Jeremy Howard (Answer.AI) Sept 2024. **No major LLM vendor consumes it.** Google explicitly: doesn't use it, "purely speculative," Gary Illyes "no plans"; John Mueller compares it to the keywords meta tag (self-declared, unverifiable, hence ignorable). Measured: 84 of 62,100 AI-bot requests (0.1%) touched llms.txt on one property; 408 of 500M AI-bot visits in a 90-day multi-site window. Mueller has said he prefers WebMCP. Verdict: generate it as exhaust if free; never load-bearing.

---

## 2. What is emerging (proposals, drafts, betas)

### 2.1 MCP next: the 2026-07-28 release (RC locked 2026-05-21; final in ~3 weeks)

- **Stateless protocol core**: `initialize` handshake and `Mcp-Session-Id` removed; client info rides in `_meta` per request; new `server/discover` capability check; scales on plain HTTP/load balancers. Roadmap adds `.well-known` static server metadata so capabilities are discoverable **without a live connection** — very friendly to content-addressed/offline-first clients.
- **Extensions framework** (reverse-DNS ids, independent versioning/governance) with two official extensions: **MCP Apps** (server-delivered interactive HTML in sandboxed iframes) and **Tasks** (promoted from experimental; server-directed, stateless task handles).
- **Authorization hardening**: RFC 9207 issuer validation, application-type declarations at registration — continued convergence on standards OAuth/OIDC.
- **Deprecations**: Roots, Sampling, Logging enter formal deprecation; ≥12-month deprecation→removal lifecycle policy. (Signal: the "client offers model access to servers" direction lost; MCP is settling into tools+resources+prompts+elicitation+tasks.)

### 2.2 WebMCP and browser-native agent-page contracts

- **WebMCP**: W3C **Web Machine Learning Community Group Draft Report** (first draft 2026-02-10; latest 2026-06-24) — *not* on the standards track. Editors from Microsoft + Google. API: `navigator.modelContext` / `document.modelContext` `registerTool()` — pages expose JS functions as agent tools with descriptions + JSON schemas; `ontoolchange`; permissions-policy default `'self'`; pages become "client-side MCP servers." Early preview in Chrome 146 Canary behind a flag (Feb 2026). **As of May 2026 no mainstream agent calls these tools**; analysts put meaningful adoption at mid-2027. Spec's own security section flags: tool descriptions/outputs treated as trusted context (injection), intent misrepresentation (description ≠ behavior, executing with inherited user auth), privacy over-extraction via tool parameters, cross-origin state leaks; proposed `untrustedContentHint` annotation.
- **Web Applets** (Unternet, a Mozilla Builders project): open spec + SDK; applets in iframes/webviews with a postMessage action/state protocol, indexable by anyone. Conceptual precursor running parallel to WebMCP; niche adoption; useful as prior art for "app declares actions + renders view, host mediates."

### 2.3 Agent identity & delegation (drafts, 2025–2026)

- **IETF draft-oauth-ai-agents-on-behalf-of-user** (v01): OAuth extension with `requested_actor` (authz request) + `actor_token` (token request); issued tokens carry `sub` = delegating human, `act` = acting agent — **both identities in every token**.
- **draft-niyikiza-oauth-attenuating-agent-tokens**: attenuation for multi-hop agent delegation chains (agent spawns agent spawns tool call).
- **draft-singla-agent-identity-protocol (AIP)**: decentralized identity + delegation — Credential Token (agent is who it claims) + Principal Token with delegation chain (a named human authorized it); companion arXiv paper spans MCP and A2A.
- **draft-klrc-aiagent-auth**: aligns agents with SPIFFE/WIMSE workload identity + OAuth/OIDC SSF.
- Reality check: none adopted; the *shipped* versions are proprietary payment-network constructs (Visa TAP headers, Mastercard agentic tokens, AP2 VC mandates) and "agent passport" startups (six launches Aug 2025–Feb 2026). The pattern that matters is stable across all of them: **verifiable (user, agent, scope, expiry) tuples with attenuation on re-delegation**.

### 2.4 Injection defenses that are architecture, not vibes

- **Lethal trifecta** (Willison, 2025-06-16): private data + untrusted content + external communication in one agent = exfiltration by construction. Defense is denying the conjunction, deterministically (e.g., OpenAI Lockdown Mode caps outbound with no model in the loop).
- **Six design patterns** (Beurer-Kellner et al., arXiv 2506.08837, June 2025): action-selector (no feedback from tools), plan-then-execute (tool outputs can't choose subsequent actions), LLM map-reduce (quarantined sub-agents return booleans/structs), dual LLM (quarantined model returns symbolic $VARs only), **code-then-execute** (privileged LLM emits a sandboxed DSL program; full dataflow/taint analysis), context-minimization. Willison's summary of the invariant: *"once an LLM agent has ingested untrusted input, it must be constrained so that it is impossible for that input to trigger any consequential actions."*
- **CaMeL** (Google DeepMind + ETH, arXiv 2503.18813, Mar 2025, rev Jun 2025): privileged LLM compiles the trusted user query into a Python-like program; quarantined LLM parses untrusted data with no tool access; a **custom interpreter tracks data provenance (capabilities) and enforces policy at every tool call**. 77% of AgentDojo tasks solved *with provable security* (vs 84% undefended). Ten months on, NeuralTrust's review notes almost no production system adopted it wholesale — cost/latency/expressivity — but its control/data-flow separation is the reference architecture.
- **NOVA / "CaMeLs Can Use Computers Too"** (arXiv 2601.09923, Jan 2026, Papernot/Tramèr et al.): extends CaMeL to computer-use via single-shot planning — trusted planner emits a complete **branching decision tree** upfront; a perception model only resolves runtime values (UI coordinates). Identifies "branch steering" as the residual attack. 57% utility retention vs frontier CUAs. Confirms: pre-committed plans survive contact with GUIs, at a utility cost.

### 2.5 Agent-OS academia — what survived contact

- **AIOS** (Rutgers, arXiv 2403.16971; COLM 2025): LLM-as-kernel with scheduler, context manager, memory/storage managers, tool manager, access manager; 2.1× serving speedups. What actually survived into products: **not** the LLM-kernel-scheduling framing, but the componentization — task queues (MCP Tasks, A2A tasks), scoped agent memory, tool registries, access managers (capability scoping), and observability. The scheduler/kernel metaphor stayed academic; the industry instead put the OS-like control plane in *platforms* (AgentCore, AgentKit) and *protocols* (MCP), which is the correct read for EFS: the Kernel mediates capabilities and budgets; it does not schedule model inference.

---

## 3. Lessons and traps from deployed systems

1. **Prompt injection is permanently unsolved; plan for compromise.** Both vendors say so on the record. ~1% ASR against an adaptive attacker means an agent doing thousands of actions *will* be steered eventually. Model-level robustness and classifiers are attenuation, not a boundary. The boundary must be capability scoping + plan freezing + human checkpoints — all Kernel-enforceable, model-agnostic.
2. **Tool/action metadata is an injection surface.** Tool poisoning worked via *descriptions*, not payloads; WebMCP's own spec flags the same. Any agent-readable catalog stored as EFS records is attacker-writable through the open-authorship protocol — catalogs must be provenance-checked through lenses and pinned, and third-party description text must enter the model as untrusted data, never as system-prompt-grade instruction.
3. **Ambient authority is the kill chain.** Every real incident (Comet, GitHub MCP, Supabase) was a confused deputy: the agent held the user's full session/keys/`service_role` while reading attacker content. OpenAI's logged-out mode and takeover mode are ad-hoc versions of what a capability Kernel gives you by construction.
4. **Budgets are retrofits everywhere — make them primitives.** ~1,000× token amplification broke every seat-based cost model; spend controls landed *after* nine-figure surprises. AP2's open/closed mandate split is the cleanest shipped vocabulary for pre-authorization vs per-action authorization.
5. **Self-declared, unverifiable metadata gets ignored or gamed** (llms.txt ≈ keywords meta tag; unsigned registry listings ≈ npm typosquats). Discovery ≠ endorsement — which EFS's lens doctrine already encodes; keep that discipline for agent tool catalogs.
6. **Server-side/multi-tenant agent state is a liability** (Asana bleed; MCP statelessness pivot). The industry moved state out of the protocol into the client — convenient for EFS, whose client already owns the journal/outbox.

---

## 4. What would be EFS-specific invention

- **Signed, replayable action receipts bound to protocol writes**: receipts that reference envelope claimIds, plan hash, capability set, venue, and read grades consumed — no shipped system does verifiable receipts; OTel spans are unsigned telemetry.
- **Lens-mediated tool-catalog trust**: using first-attester-wins + per-viewer lens ordering to decide *which* app action catalogs an agent may even see. Nothing like it exists; registries are flat and unvetted.
- **Read-grade-aware agent input policy**: feeding venue-qualified freshness/trust grades into a CaMeL-style interpreter as taint labels. Academic capability systems invent ad-hoc provenance; EFS already has a normative provenance vocabulary — wiring it to agent dataflow policy is novel.
- **On-chain-anchored delegation**: the IETF drafts assume an OAuth authorization server; EFS's user is a smart account. A signed "agent mandate" record (scope, budget, expiry, revocation via the normal REVOKE machinery) would be an EFS invention — with the permanence caveats below.

---

## 5. EFS translation — opinionated recommendations for client v2

1. **Agents are a fourth principal class** (user / app / system service / **agent session**), Kernel-registered with: goal statement, capability bundle, budget mandate, expiry, and the `sub`+`act` shape from the OAuth OBO draft — every journal entry and receipt records *both* the delegating human and the acting agent. Agents never hold signing keys; they enqueue intents into the same outbox humans use.
2. **Make the typed pipeline the security boundary, CaMeL-shaped.** Plan is compiled from trusted user intent *before* untrusted content (records, mirror bytes, tool outputs, other agents' messages) is read; untrusted data fills declared data slots but cannot add/reorder actions (plan-then-execute), and the Kernel — not the model — validates every step against the capability set at execution time (code-then-execute with the Kernel as interpreter). Dry-run = executing the plan against deterministic IDs and local state with zero side effects; EFS's client-computable IDs make dry-runs unusually honest — exploit that.
3. **Enforce the lethal trifecta as a static Kernel invariant**: no single agent session may simultaneously hold (a) private-data reads, (b) untrusted-content ingestion, (c) external network endpoints. Requesting all three triggers Shell-owned break-glass chrome, mirroring OpenAI watch-mode/Anthropic confirmation patterns for the irreversible subset (signing, publishing, spending, installing, granting).
4. **App-manifest typed action catalogs are root authority; MCP/WebMCP/A2A are derived surfaces.** Generate an MCP server (and, later, WebMCP registrations) *from* the verified manifest catalog; never import external MCP tools into Ring 3 without the same manifest review + capability attenuation as an app install. Track MCP 2026-07-28: the stateless core + `.well-known` static metadata fit a content-addressed static client perfectly; MCP Tasks map onto the outbox/task-queue; MCP Apps' sandboxed-iframe UI is the same isolation move as the EFS render service.
5. **Unify approval surfaces**: model Shell prompts on MCP elicitation/structured-output schemas so the Approval Queue serves both human UI and protocol bridges; URL-mode elicitation is precedent for "hand the human a Kernel-owned secure flow." One approval queue, one receipt stream, for humans and agents alike.
6. **Receipts: local-first, signed, structured.** Adopt an OTel-GenAI-compatible receipt schema (operation, actor pair, capability scope, params digest, data touched, policy outcomes) written to the encrypted journal by default; *publishing* a receipt to EFS is an explicit, previewed write. Receipts must cite plan hash and resulting claimIds so a third party can replay/verify the action chain.
7. **Budgets are Kernel meters with AP2 vocabulary**: open mandates (caps over gas / inference tokens / network bytes / record-count, with validity windows) authorize autonomous work; closed mandates authorize a single flush/purchase/signature. Thresholds alert, hard caps halt. Day one, not retrofit.
8. **Skip llms.txt as anything load-bearing**; emit it (and an MCP server card) as generated exhaust from the manifest catalog. Inference is an OS-mediated endpoint capability exactly like RPC/IPFS gateways — per-provider grants, per-agent budgets, data-sharing warnings, no ambient model access.

---

## 6. Where EFS v2 protocol design conflicts or under-supports

1. **Permanence amplifies agent compromise.** One steered agent + one human signature flush = irrevocable public records under the user's authorship; REVOKE only unlists. The protocol has no actor dimension — consider a reserved envelope/record word (or convention) marking agent-mediated authorship (`act` analog) so lenses/clients can demote or quarantine agent-authored records after a compromise window is discovered.
2. **Attester = user address erases the human/agent distinction that every other 2025–2026 identity effort is building** (OAuth OBO `sub`+`act`, Mastercard tri-identity tokens, AIP delegation chains). With bare-EOA identity and no session keys at protocol level, delegation is entirely client-side and receipts lose third-party verifiability. The identity doc's reserved KEL/passkey succession slot may need a sibling reservation for *delegated/attenuated signing* (agent sub-keys), or an explicit ruling that agent attribution is a client/receipt concern only.
3. **Read grades are human trust labels, not machine taint labels.** The agent pipeline needs structured provenance per resolved value (author, venue, grade, discovery-vs-trusted, byte verification status) to drive CaMeL-style flow policy. The lens spec should guarantee that resolution output carries machine-readable provenance metadata, not only the grade enum rendered for humans.
4. **One-signature flush vs long-running agents.** Agents accumulate intents but cannot commit without a human checkpoint — correct default, but there's no protocol story for *bounded pre-authorization* (an open-mandate analog: "sign now, admit up to N records of kinds K under path P before expiry"). Either add a scoped pre-signed envelope pattern or explicitly rule that agents always block on human signature (and design the outbox UX for that).
5. **Receipts-on-EFS collide with privacy.** Agent activity logs are sensitive; EFS records are permanent and public. Absent an encrypted-record story, receipts must stay in the encrypted local journal, which sacrifices portability/verifiability — worth a protocol-side note rather than a silent client workaround.

---

## Sources (dated)

- https://modelcontextprotocol.io/specification/2025-11-25/changelog — MCP 2025-11-25 key changes (spec release 2025-11-25; fetched 2026-07-07)
- https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/ — MCP 2026-07-28 RC (RC locked 2026-05-21)
- https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/ — 2026 MCP roadmap (working-group driven; `.well-known` metadata)
- https://forgecode.dev/blog/mcp-spec-updates/ — MCP 2025-06-18 changes (elicitation, structured output, OAuth RS, RFC 8707)
- https://modelcontextprotocol.io/registry/about + https://registry.modelcontextprotocol.io/ — registry preview status (launched 2025-09-08; preview through mid-2026)
- https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation — MCP → AAIF (2025-12-09)
- https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation — AAIF founding (MCP, goose, AGENTS.md; 2025-12-09)
- https://workos.com/blog/everything-your-team-needs-to-know-about-mcp-in-2026 — MCP adoption stats 2026 (97M monthly downloads, 10k+ servers)
- https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year — A2A one-year milestone (2026-04)
- https://a2a-protocol.org/v0.3.0/specification/ — A2A v0.3 spec (signed AgentCards JWS/JCS, gRPC)
- https://webmachinelearning.github.io/webmcp/ — WebMCP Draft CG Report (latest 2026-06-24; `document.modelContext`, `registerTool`, security considerations)
- https://studiomeyer.io/en/blog/webmcp-reality-check-may-2026 — WebMCP adoption reality check (Chrome 146 Canary flag; no mainstream agent consumption, May 2026)
- https://github.com/unternet-co/web-applets + https://builders.mozilla.org/project/web-applets/ — Web Applets spec/SDK (Mozilla Builders)
- https://www.anthropic.com/research/prompt-injection-defenses — Anthropic injection-defense research (2025-11-24; 1% adaptive ASR; layered defenses)
- https://claude.com/blog/claude-for-chrome — Claude for Chrome pilot (2025-08; 23.6%→11.2% ASR; site permissions, confirmations)
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool — Anthropic computer-use isolation/HITL guidance
- https://openai.com/index/hardening-atlas-against-prompt-injection/ — Atlas hardening w/ RL automated red teaming (2025-12)
- https://techcrunch.com/2025/12/22/openai-says-ai-browsers-may-always-be-vulnerable-to-prompt-injection-attacks/ — OpenAI "unlikely to ever be fully solved" (2025-12-22)
- https://openai.com/index/operator-system-card/ + https://cdn.openai.com/pdf/839e66fc-602c-48bf-81d3-b21eacc3459d/chatgpt_agent_system_card.pdf — Operator (2025-01-23) / ChatGPT agent (2025-07-17) system cards: watch mode, takeover mode, confirmations
- https://help.openai.com/en/articles/12628199-using-ask-chatgpt-sidebar-and-chatgpt-agent-on-atlas — Atlas logged-out mode, agent sandbox limits
- https://brave.com/blog/comet-prompt-injection/ — Comet indirect injection (2025-08)
- https://brave.com/blog/unseeable-prompt-injections/ — screenshot injections (2025-10-21)
- https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ — lethal trifecta (2025-06-16)
- https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/ — six design patterns commentary (2025-06-13)
- https://arxiv.org/abs/2506.08837 — Design Patterns for Securing LLM Agents (2025-06-10)
- https://arxiv.org/abs/2503.18813 — CaMeL: Defeating Prompt Injections by Design (2025-03, rev 2025-06-24)
- https://neuraltrust.ai/blog/camel-prompt-injection — ten-months-after CaMeL adoption review
- https://arxiv.org/abs/2601.09923 — CaMeLs Can Use Computers Too / NOVA (2026-01-14, rev 2026-06-04)
- https://arxiv.org/abs/2403.16971 — AIOS (COLM 2025)
- https://www.ietf.org/archive/id/draft-oauth-ai-agents-on-behalf-of-user-01.html — OAuth OBO for AI agents (`requested_actor`, `actor_token`, sub+act)
- https://datatracker.ietf.org/doc/html/draft-niyikiza-oauth-attenuating-agent-tokens-00 — attenuating agent tokens (2026)
- https://www.ietf.org/archive/id/draft-singla-agent-identity-protocol-00.html — Agent Identity Protocol (delegation chains)
- https://ap2-protocol.org/ — AP2 mandates (launched 2025-09; v0.2.0 2026-04)
- https://developer.visa.com/capabilities/trusted-agent-protocol/overview — Visa Trusted Agent Protocol
- https://www.fintechwrapup.com/p/deep-dive-mastercard-verifiable-intent — Mastercard Verifiable Intent vs Visa TAP (SD-JWT delegation)
- https://www.upguard.com/blog/mcp-security-incidents — six MCP incidents (Asana, Supabase, tool poisoning, CVE-2025-6514)
- https://thehackernews.com/2026/06/microsoft-warns-poisoned-mcp-tool.html — Microsoft tool-description poisoning warning (2026-06)
- https://www.pomerium.com/blog/when-ai-has-root-lessons-from-the-supabase-mcp-data-leak — Supabase service_role lesson
- https://www.forbes.com/sites/janakirammsv/2026/05/17/uber-burns-its-2026-ai-budget-in-four-months-on-claude-code/ — Uber budget burn (2026-05-17)
- https://www.techtimes.com/articles/319687/20260704/claude-enterprise-spend-controls-arrive-agentic-ai-bills-blow-past-budgets.htm — Claude Enterprise spend controls (2026-07-02)
- https://opentelemetry.io/blog/2026/genai-observability/ + https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/ — OTel GenAI semconv status (client spans stable early 2026; agent spans experimental)
- https://www.searchenginejournal.com/google-says-llms-txt-is-purely-speculative-for-now/577576/ — Mueller on llms.txt (speculative; keywords-meta-tag comparison)
- https://medium.com/@kaispriestersbach/the-llms-txt-is-dead-more-precisely-a-dud-ab7bee4f469c — llms.txt traffic measurements (0.1%)
- https://ahrefs.com/blog/what-is-llms-txt/ — llms.txt origin + skeptic take
