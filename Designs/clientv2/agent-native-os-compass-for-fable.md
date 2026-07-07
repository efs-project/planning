# Agent-native OS compass for Fable

**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[fable-client-v2-handoff]], [[os-research-compass-for-fable]], [[sdk-vs-client-responsibilities]]
**Supersedes:** -
**Reviewers:** Codex research pass, 2026-07-07
**Last touched:** 2026-07-07 - codex-gpt-5

#status/draft #kind/research #repo/planning #repo/client #repo/sdk

## What this is

This is a focused addendum for designing the EFS web OS in an AI-agent-native world. Humans remain a first-class audience, but agents should also be treated as first-class citizens. That does not mean every screen should talk about agents. It means every important OS action should have a clean, typed, permissioned path that an agent can discover, understand, plan, execute, audit, and recover from.

The principle to test:

```text
Every action should be humane for people and structured for agents.
```

Agents should not have to depend on screenshots, brittle DOM scraping, or hidden UI conventions for normal OS work. Visual computer-use should remain available for fallback, testing, and genuinely visual tasks, but the durable interface should be the OS SDK: typed capabilities, resources, actions, plans, receipts, and audit trails.

## Primary sources to start from

Fable should expand this list with current papers and standards. This initial pass used:

- Model Context Protocol specification: https://modelcontextprotocol.io/specification/2025-06-18
- Agent2Agent protocol: https://github.com/a2aproject/A2A
- AIOS: LLM Agent Operating System: https://arxiv.org/abs/2403.16971
- OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments: https://arxiv.org/abs/2404.07972
- WebArena: A Realistic Web Environment for Building Autonomous Agents: https://arxiv.org/abs/2307.13854
- VisualWebArena: Evaluating Multimodal Agents on Realistic Visual Web Tasks: https://arxiv.org/abs/2401.13649
- OpenAI computer use guide: https://developers.openai.com/api/docs/guides/tools-computer-use
- Anthropic computer use docs: https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool
- W3C WebDriver BiDi: https://www.w3.org/TR/webdriver-bidi/
- OpenAPI Specification: https://github.com/OAI/OpenAPI-Specification
- WAI-ARIA overview and accessibility mappings: https://www.w3.org/WAI/standards-guidelines/aria/
- llms.txt proposal: https://llmstxt.org/
- Policy Cards for machine-readable runtime governance: https://arxiv.org/html/2510.24383v1

Key read from the research:

- MCP is useful precedent for tool/resource/prompt discovery, but EFS should not blindly become an MCP server. It should expose OS-native capabilities and optionally bridge them to MCP.
- A2A is useful precedent for agent discovery, task negotiation, and agent-to-agent collaboration.
- AIOS is useful because it treats scheduling, context, memory, storage, access control, and tool use as kernel-level services for agents.
- OSWorld/WebArena/VisualWebArena show that current agents struggle when forced through human-only GUI surfaces. EFS can do better because it is greenfield.
- Computer-use docs converge on the same safety advice: isolate the environment, treat page/content as untrusted, and keep humans in the loop for high-impact actions.
- Accessibility and machine-readable APIs are not side quests. Semantic UI, accessible names, OpenAPI-style descriptions, and typed action schemas all make the system more usable for humans and agents.

## Design thesis

EFS should not design agents as "bots pretending to be humans." It should design a layered action model:

1. **Structured OS actions:** preferred path. Typed, capability-gated, dry-runnable, auditable.
2. **Semantic UI:** visible human UI with accessible names, stable roles, action labels, and state summaries.
3. **Visual computer-use:** fallback path for legacy apps, visual verification, manual-like operation, and benchmark compatibility.

If an action is important enough to put in the Shell or a first-party app, it is important enough to expose as a structured action through the OS SDK or an agent bridge.

## Agent actors and identities

Agents need a real place in the OS security model:

- **Human user:** ultimate local authority for the user's device, keys, local cache, settings, and signing intent.
- **Agent instance:** a bounded runtime acting for a user, app, organization, or task.
- **Agent principal:** the identity attached to durable agent authority, logs, quotas, and possibly EFS records.
- **Agent session:** a temporary execution with a goal, scope, budget, expiry, model/provider, and granted capabilities.
- **Delegated agent:** an agent granted power to act within a limited namespace or workflow.
- **External agent:** an agent from another service, contacted through A2A-like or app-specific protocol.

Questions:

- Is an agent a kind of app, a kind of user, a service, or a principal that can be attached to any of those?
- Can an agent hold wallet/session-key authority, or only request Shell-mediated signing?
- Can an agent write EFS records as itself, as the human, or only as "human via agent" with provenance?
- Should agent-authored writes carry extra metadata: model/provider, task id, policy, review status, or user approval?

## OS surfaces for agents

Candidate system surfaces, all agent-specific:

- **Agent Shell:** optional presentation optimized for task graphs, structured actions, approvals, receipts, and machine-first navigation. It should use the same Kernel/OS SDK contracts as other Shells, not a secret automation channel.
- **Agent Center:** installed/active agents, goals, scopes, budgets, tools, recent actions, blocked prompts, approval queue, and kill switch.
- **Task Queue:** long-running jobs, checkpoints, progress, cancellation, retries, handoff, dependencies, and artifacts.
- **Approval Queue:** high-impact actions awaiting human review: signing, publishing, spending, installing, granting admin powers, deleting local data, exporting private context.
- **Agent Audit Log:** action plans, tool calls, capability use, file reads/writes, prompts shown, user approvals, signed receipts, errors, and recovery.
- **Agent Memory Vault:** scoped user-owned memories and task state, separate from chat history and separate from public EFS records.
- **Agent Tool Registry:** OS-native actions and optional MCP/OpenAPI/A2A bridges exposed to approved agents.
- **Inference Settings:** provider accounts/endpoints, local/cloud model choices, budgets, privacy policy, data-retention rules, and allowed apps/agents.

Do not over-surface this in normal UX. Users should see agent controls when they install, delegate, monitor, interrupt, or audit agents.

If Shells become configurable, Fable should decide whether the Agent Shell is a full Shell profile, a mode inside the default Shell, a developer/debug surface, or simply an app over the common agent APIs. The important invariant: agent capabilities, approvals, receipts, and safety should not depend on which Shell is active.

## OS SDK additions to consider

Possible EFS OS SDK namespace areas:

```text
efs.agent       task state, identity, goal, handoff, progress, cancellation
efs.actions     discover, plan, dryRun, execute, explain, undo/compensate where possible
efs.inference   model invocation through user-configured providers and policy
efs.context     retrieve scoped context, citations, memories, active workspace state
efs.tools       expose app actions to the OS tool registry
efs.approvals   request human review for high-impact actions
efs.audit       write receipts, read own action history, link artifacts to actions
efs.watch       subscribe to files, folders, lenses, sync states, and package changes
```

These should be capability-gated. A notes app should not automatically get inference, memory, watch, or signing power just because it runs inside the OS.

## Structured action model

Every consequential action should prefer this shape:

1. **Describe:** machine-readable action schema, inputs, outputs, side effects, required capabilities, risk class.
2. **Plan:** agent proposes an action plan with target objects, expected writes, wallet effects, network effects, and rollback/compensation notes.
3. **Dry run:** Kernel/Shell or app computes deterministic previews where possible.
4. **Approve:** Shell-owned prompt for high-impact actions, with human-readable and machine-readable summary.
5. **Execute:** Kernel/Shell executes through capability handles, not ambient app power.
6. **Journal:** local action journal records execution state.
7. **Receipt:** durable receipt records what happened, by whom, under which authority, and with which result.
8. **Recover:** retry, resume, compensate, or mark partial failure.

This matches the existing local write journal / flush engine idea. Agents should use the same outbox and checkpoint flow humans use, not a secret automation path.

## Inference as an OS service

End users should be able to connect web APIs for inference and let approved apps/agents use them to search, summarize, classify, plan, transform, and act. That should be an OS service, not every app hardcoding its own model account.

Questions:

- Does the OS expose an `InferenceHandle` that routes to OpenAI, Anthropic, local models, or future providers through user policy?
- Can the user set per-agent and per-app budgets, retention rules, allowed data classes, and approved model tiers?
- Can an app ask for "summarize these selected files" without gaining arbitrary access to all user files?
- Are inference outputs local-only by default unless explicitly written to EFS?
- How are model outputs labeled when used in public/signed records?
- Can the OS cache embeddings or semantic indexes locally without leaking private data?
- What warnings and receipts are required when an agent sends context to an HTTP inference provider?
- Can users require local models, self-hosted endpoints, Tor/I2P/proxy routing, or endpoint allowlists for agents?

## Locale and language context

Agents should be able to work in the user's language and locale, but locale is also private context. Language list, region, time zone, input method, fonts, calendar, numbering system, and writing direction can fingerprint a person.

Questions:

- Does an agent receive the user's full locale profile, a reduced task locale, or only OS-mediated formatting and translation services?
- Can the OS ask an agent to draft in one language while keeping region, time zone, and full language list hidden?
- How are multilingual tasks represented in plans, approvals, receipts, citations, and audit logs?
- Can agents use local translation/formatting packages offline before sending anything to an inference provider?
- How does the OS ensure agent-generated approval text, warnings, and receipts are understandable in the user's preferred language?

Agent-readiness tests should include non-English, right-to-left, mixed-direction, CJK, long-text, and locale-sensitive date/number/currency scenarios.

## Search, find, and knowledge work

Agents will be heavy users of "find things" workflows. EFS should design search as a capability-rich OS service:

- Structured file and record search with stable IDs and citations.
- Lens-aware search that states which trust order and deny set were used.
- Semantic search and embedding indexes with private/local vs public boundaries.
- Provenance-first results: why found, which claim, which lens, which content hash, which freshness.
- Watch queries for "tell me when this folder/lens/app changes."
- Saved searches as OS objects that humans and agents can share.

Questions:

- What can an agent search by default: current workspace, selected folder, installed apps, public EFS, local cache, memories?
- Can an agent request a scoped search capability without getting file contents?
- How does the UI show that an agent found something via discovery but it is not endorsed by the user's lens?

## Agent-readable apps

Every app inside the EFS OS should have an agent-readable manifest:

- App identity, package hash, signer, update channel, OS SDK version.
- Human-visible purpose and agent-visible action catalog.
- Tool schemas for app actions.
- Resource schemas for app-owned data.
- Risk classes and human approval requirements.
- Example workflows, constraints, and failure modes.
- Test fixtures or sample tasks for the app's agent surface.

This can produce optional outputs:

- MCP server bridge.
- OpenAPI-style document for structured actions, without implying ambient HTTP access.
- `llms.txt` or `llms-full.txt` for documentation.
- A2A Agent Card if the app/agent exposes external collaboration.

The OS should treat these as derived bridges, not the root authority model. The root authority is still the Kernel/Shell capability ledger.

Agent bridges must inherit the OS network privacy model. An agent-readable action is not permission to call arbitrary HTTP APIs. Any external endpoint, model provider, A2A peer, MCP server, webhook, or app API should be an explicit endpoint capability with scope, budget, audit, and user-visible receipts.

## Multi-agent workflows

The OS should assume multiple agents may operate at once:

- Agents need task ownership, leases, locks, and conflict detection.
- Agents need shared artifacts and handoff packets.
- Agents need cancellation, pause, resume, and checkpoint APIs.
- Agents need a way to ask for human clarification without blocking the whole OS.
- Agents need progress events and partial results.
- Agents need priority and budget scheduling across inference, network, storage, and wallet prompts.

EFS-specific angle:

- Two agents editing the same local journal should not silently race.
- Agent-created signed bundles need clear authorship and review status.
- Agents may batch many small writes, but the Shell must make dangerous batched effects legible before approval.
- External agents might exchange signed bundles, proofs, citations, or package manifests without sharing private memory.

## Agent safety and threat model

Agent-specific failure modes to design against:

- Prompt injection from files, mirror content, websites, comments, package metadata, or other agents.
- Tool injection: malicious app exposes a tool with a harmless name but dangerous side effects.
- Ambient authority: agent can use whatever the human is logged into.
- Silent public writes: agent publishes private data or signs irreversible records.
- Silent network leaks: agent sends file contents, search terms, paths, embeddings, prompts, or task state to HTTP endpoints.
- Infinite loops and spend leaks: agent burns inference, gas, relayer quota, or storage.
- Stale memory: agent acts on old facts as if current.
- Cross-agent leakage: one agent can read another agent's task state or private memory.
- UI spoofing: app pretends to be a Shell approval prompt.
- Partial failure blindness: agent says work is done while sync/sign/flush only partly succeeded.
- Provenance confusion: user cannot tell whether a claim was human-authored, agent-drafted, agent-authored, or human-approved.

Design guardrails:

- Capability handles, not global sessions.
- Human-in-loop for high-impact actions.
- Agent budgets and kill switches.
- Dry-run and receipt-first workflows.
- Structured action schemas with risk classes.
- Policy cards or equivalent machine-readable governance for deployed agents.
- Isolation for browser/computer-use harnesses.
- Content treated as untrusted unless explicitly promoted.

## Agent testing and evaluation

Fable should propose agent-readiness tests, not just design screens:

- Can an agent discover the app's actions without reading source code?
- Can an agent complete core workflows through structured actions alone?
- Can an agent recover after network loss, stale cache, denied approval, failed wallet prompt, or partial flush?
- Can an agent use semantic UI/accessibility fallback if structured tools are missing?
- Can an agent distinguish browse mode from citation mode and live data from cached/as-of data?
- Can an agent explain what it did using audit receipts and cited objects?

Inspired by OSWorld/WebArena, EFS should build its own benchmark tasks:

- Find a file by semantic query and produce a citation link.
- Create a folder/file offline, queue a signed bundle, and flush later.
- Install an app from a package channel after reviewing capability diffs.
- Compare two lens results and explain why they differ.
- Ask for human approval before publishing or spending.
- Recover from a partial transaction or missing mirror bytes.

## Design outputs to ask Fable for

Ask Fable for a small agent-specific section in each major design deliverable:

- **Agent actors:** what principals exist and what authority they can hold.
- **Agent action model:** how tasks become plans, approvals, executions, receipts, and recovery.
- **Agent OS SDK surface:** what apps expose and what agents consume.
- **Inference service:** provider routing, budgets, privacy, local/cloud policy.
- **Agent UX:** where humans inspect, approve, pause, revoke, or audit agents.
- **Agent safety model:** prompt injection, authority, public writes, spend, stale memory, and cross-agent leakage.
- **Agent evaluation:** benchmark tasks and pass/fail criteria.

Keep the main product language human-readable. Mention agents only where they change the design.
