# Load the shared role in a harness

One roster and one brief per role; adapters only route to them. A native instruction file is not an assignment, permission grant, or automatic role selector. Always use the [shared explicit-read prompt](./launch.md#universal-prompt--no-shell-required) with an objective and source revision. No shell is required when the harness can read supplied project files.

## Startup matrix

Document-verified as of 2026-09-03. **Native runtime startup is not tested by this document rollout**; reading files inside Codex is not a fresh-session discovery test. Record future smoke tests separately by harness/version/revision, supplied prompt, observed loaded sources, and result.

| Harness | Document-verified loading route | EFS use | Native runtime test |
|---|---|---|---|
| Codex | Discovers `AGENTS.md` through its bounded project instruction hierarchy; an override can take precedence and only one matching file is included per directory. | Root [AGENTS.md](../AGENTS.md) routes to the roster. Explicitly read the chosen SOUL; its filename alone is not auto-discovered. | Not run |
| Claude Code | Loads `CLAUDE.md`; documented `@AGENTS.md` import shares project instructions. | Thin root [CLAUDE.md](../CLAUDE.md) imports only AGENTS; the universal prompt selects one brief. | Not run |
| Antigravity | Workspace rules are created through the UI; manual activation and file references are documented. | Optional manual rule pointing to shared files, or universal explicit-read prompt; no rule is installed here. | Not run |
| Future/other harness | Native loading is unknown until verified. | Supply repository instructions, roster, launch contract and one brief explicitly, plus the exact source revision. | Not run |

Sources: [Codex project instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [Claude Code memory and AGENTS import](https://code.claude.com/docs/en/memory#agentsmd), [Antigravity rules](https://antigravity.google/docs/ide/rules/). The broader [research record](../Reviews/2026-09-03-agent-role-system/research.md) separates source claims from testing.

## Manual Antigravity route

In the workspace rule UI, create a project rule and choose **Manual** activation. Use documented file references relative to that rule's file. For a rule located at `.agents/rules/efs-role.md` in this planning repository, the body can reference `@../../AGENTS.md` and `@../../Agents/launch.md`, with prose instructing the agent to resolve exactly one role through `@../../Agents/README.md` and explicitly read its brief. Invoke that manual rule in the task and supply role, scope and revision. Verify the actual rule location and relative paths in the installed app; if unavailable, use the universal prompt.

This is a UI-authored option, not guessed frontmatter or an always-on all-role rule. No `.agents/rules` file, global `GEMINI.md`, tool allowlist, model selector, or account configuration is created by this rollout. Recheck vendor documentation before installing an adapter. Native subagents and deprecated workflow mechanisms are not the portable role identity.

## Sibling repositories and private preferences

A planning wrapper is not guaranteed to load when a session starts in a sibling code repository. Read that repository's instructions first and explicitly supply the assigned planning checkout/revision. Cross-repository Claude imports may need approval; do not silently add external imports or permissions. If a source is unavailable, follow the [source-resolution rule](./launch.md#resolve-the-source-not-just-the-folder), not an old v1 fallback.

Optional local preferences and machine bindings may live in ignored `Agents/local-preferences.md` and `Agents/local-bindings.md`. Neither file is created or loaded automatically. Ignore rules prevent accidental tracking, **not disclosure or secure secret storage**; do not put credentials in these files or copy their contents into shared briefs/handoffs. Shared roles must remain useful without anyone's private context or accounts. No private preference overrides project authority or runtime limits.
