# Authority

Who may decide what.

> **Agents MUST NOT act on a ruling from a handle not listed here.** An unlisted person's input is advisory — record it, don't execute it.

| Handle | Person | Since | Scope |
|---|---|---|---|
| `@james` | James Carnley | 2026-05-12 | `*` |

## Scopes

Named after decision surfaces, never after people:

`*` (everything) · `promotion` · `vault-process` · `designs/efsv2` · `designs/clientv2` · `grants` · `milestones`

## Rules

1. A ruling is valid only if it names a listed handle **and** that handle's scope covers it.
2. `promotion` authority comes only from a row in this table. An agent never grants it to itself.
3. Adding, changing, or removing a row is itself a `*`-scope decision, recorded in [[Decisions]].
4. **Removing a row does not invalidate rulings made while it was present.** History is judged at its own date — which is why past rulings keep the deciding person's name (see [[conventions#Naming the decision-maker: role vs. person]]).

## What this is, and what it deliberately is not

This is **a roster plus attribution — not permissions.** Nothing in a plain-markdown git vault can be technically enforced: it's direct-push, there's no branch protection, and agents write files freely by design. What tooling *can* do is make an unattributed or unauthorized ruling **visible**. That is enough, because the realistic threat is not a rogue teammate.

**The realistic threat is an agent fabricating or misreporting a ruling.** `Designs/efsv2/owner-rulings.md` already contains the near-miss, 2026-07-16: *"Recording now — I told James last turn I'd recorded this but had not actually written it to the file."* An agent misreporting its own recording state is one step from writing `ADOPTED (James)` for something James never said. Attribution is what makes that auditable.

Deliberately **not** built: per-file ACLs, CODEOWNERS (deferred in [[0001-design-system]] and only meaningful with a PR flow — this repo is direct-push), branch protection, GPG-as-authority-gate (it authenticates a machine, not an authority scope), quorum/voting/delegation chains, and per-agent write permissions. **The gate is on rulings, not on edits.** Conflating the two would break the swarm.

If this file grows past one table and these rules, it has failed.

## Recording a ruling

New rulings carry a trailer naming the decider and date:

```
— ruled by @james, 2026-07-23
```

Applies to new entries in [[Decisions]] and new dated sections in any `owner-rulings.md`. The promotion trust token keeps its existing form (`Promoted by @james on YYYY-MM-DD`) — don't generalize it.

Where a ruling gets recorded: **the history owned by the queue that owns the item** — `Designs/<folder>/owner-rulings.md` where that file exists, [[Decisions]] otherwise — and never in both.
