# Fable kickoff prompt - official client v2

**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[fable-client-v2-handoff]], [[os-research-compass-for-fable]], [[agent-native-os-compass-for-fable]]
**Supersedes:** -
**Reviewers:** -
**Last touched:** 2026-07-07 - codex-gpt-5

#status/draft #kind/prompt #repo/planning #repo/client #repo/sdk

## Prompt

You are Fable 5. Please begin the official EFS client v2 design exploration.

The goal is not to execute a checklist or obey prior assumptions. The goal is to design, from first principles and with current research, a unified direction for the new official EFS client as a web OS. Treat the linked notes as helpful context, pressure, and ingredients. You may reframe, merge, reject, or replace any of them if better research or design reasoning points elsewhere.

Start by reading:

- [[fable-client-v2-handoff]]
- [[os-research-compass-for-fable]]
- [[agent-native-os-compass-for-fable]]
- [[fable-handoff-v2-tag-core]]
- [[read-lens-spec]]
- [[apps-cookbook]]
- [[sdk-vs-client-responsibilities]]
- [[mirror-scheme-policy]]

Ignore the old `/client/` repo as a source of current design truth. It may contain implementation history, but it predates the official client v2 design direction.

Please do real research before settling foundations. Use current primary sources where possible and cite dated sources. In particular, look broadly across modern OS research, browser/web platform security, local-first/offline systems, package/update systems, capability OSes, NixOS/Guix, Fuchsia, Plan 9, Qubes, WASI/components, app sandboxing, wallet/session-key UX, agent-native systems, accessibility, i18n/locale systems, and privacy-preserving network design.

Please keep the work broad and creative. Do not merely validate the current notes. Hunt for better primitives, better metaphors, and better boundaries.

The current north star to pressure-test:

```text
EFS OS is self-sovereign, user-first, privacy-focused, reliable,
offline-capable, cypherpunk, global, agent-ready, and built around
standard web technologies.
```

Important ingredients to preserve or explicitly challenge:

- The official client may be best understood as `Bootstrapper -> Kernel -> Shell -> Apps`.
- The Kernel should be the stable trust base.
- The Shell might be fixed, modeful, configurable, replaceable, or plural. Please gut-check this deeply.
- Apps should be untrusted Ring 3 guests with explicit capabilities.
- The EFS SDK and EFS OS SDK should likely be separate concepts.
- Fast deep-link load matters. Users may arrive directly at files, apps, citations, permission prompts, sync states, packages, or OS profiles.
- The client should be offline-capable as far as it can be without lying about freshness or trust.
- Caching, local write journals, signed checkpoints, wallet batching, and flush/sync queues may be core OS plumbing.
- HTTP/network access is a privacy-sensitive capability. There should be no ambient OS HTTP and no app HTTP by default unless you find a better model with clear privacy properties.
- Locale, language, accessibility, input methods, fonts, text direction, formatting, search/collation, and translation packs should be foundation-level OS services.
- Agents should be first-class actors without turning the product into agent wallpaper. Every important human action should also have a structured, typed, auditable path an agent can use safely.
- Accessibility and assistive technology support should be treated as foundation-level OS design, not a late UI pass.
- No forced upgrades. Users should control update policy, package channels, endpoints, cache retention, Shell choice where safe, and app permissions.

Please produce design work that is useful even if some conclusions are tentative:

- A research digest with primary-source links and dates.
- A web OS thesis: what old OS assumptions EFS should reject and what new primitives it should adopt.
- A boot/profile/deep-link model.
- A Kernel/Shell/App/component/capability model.
- A Shell/session model, including whether Shell plurality is worth it.
- A package/update/generation/rollback model.
- An offline/cache/journal/checkpoint/flush model.
- A wallet/action batching model.
- A network privacy and endpoint-permission model.
- A global locale/accessibility model.
- An agent-native model.
- A first-party app and system surface map.
- A threat model.
- A developer platform model for EFS SDK versus EFS OS SDK.
- A list of open questions and recommended next investigations.

If you discover that an official client OS feature is unsupported by current EFS v2 designs, made awkward by them, or simply not considered yet, do not hide the problem inside the client design. Add a section to the relevant `Designs/efsv2/` file, or create a focused new note under `Designs/efsv2/`. Capture the problem, why it matters, current mismatch, possible solution paths, risk of deferring, and open questions. It is fine to say "needs research" when that is the honest answer.

Tone and posture:

- Be creative and expansive first, then converge.
- Prefer grounded research and clear tradeoffs over premature certainty.
- Separate what exists today, what is emerging, and what would be an EFS-specific invention.
- Treat the current docs as context, not constraints.
- Keep humans first-class, agents first-class, and privacy non-negotiable.
- Do not force the final answer to look like macOS, Linux, mobile OSes, ChromeOS, or any one precedent.
