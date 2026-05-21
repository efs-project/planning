# <Title>

**Status:** draft
**Target repos:** (any subset of: planning, contracts, client, sdk)
**Depends on:** — (optional, list `[[other-design-slug]]`)
**Supersedes:** — (optional, list `[[other-design-slug]]`)
**Reviewers:** — (appended by reviewing agents: `@<agent> (YYYY-MM-DD)`)
**Last touched:** YYYY-MM-DD — (optional; Obsidian Bases also derives this from file mtime)

#status/draft #kind/design

<!--
⚠️ DO NOT NUMBER THIS FILE. Save as `<slug>.md`, no `NNNN-` prefix.
Numbers are allocated only at the human-gated promotion ceremony.
See Onboarding/write-a-design.md for the full lifecycle.
-->

## Problem

What we're solving, and why now. One or two paragraphs; gory details go in Proposal.

## Proposal

The design itself. Hierarchical headers (`###`, `####`), tables for structured data, fenced code blocks for examples, `[[wiki-links]]` to related designs and `[[Glossary#term]]` for terminology.

## Open questions

List trackable items as `- [ ] description` checkboxes. The Obsidian Tasks plugin's global rollup will surface them. Resolve in place as the design matures.

## Pre-promotion checklist

Fill before requesting promotion. The human scans this rather than re-reading the whole design.

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

Optional. Repo-specific guidance for the implementing agent. Skip if there's nothing to add.

For multi-repo designs, track PRs here:

```
- [ ] contracts#NNN — <status>
- [ ] client#NNN — <status>
- [ ] sdk#NNN — <status>
```

Design status moves to `landed` only when all PR checkboxes check.
