# Authority

Who may decide what.

> **Agents MUST NOT act on a ruling from a handle not listed here.** An unlisted person's input is advisory — record it, don't execute it.

| Handle | Person | Since | Scope |
|---|---|---|---|
| `@james` | James Carnley | 2026-05-12 | `*` |

**Scopes** are named after decision surfaces, never people: `*` · `promotion` · `vault-process` · `designs/efsv2` · `designs/clientv2` · `grants` · `milestones`

## Rules

1. A ruling is valid only if it names a listed handle whose scope covers it.
2. `promotion` authority comes only from a row here. An agent never grants it to itself.
3. Changing a row is itself a `*`-scope decision, recorded in [[Decisions]].
4. **Removing a row never invalidates rulings made while it was present.** History is judged at its own date — which is why past rulings keep the deciding person's name ([[conventions#Naming the decision-maker: role vs. person]]).

## Recording a ruling

New rulings carry `— ruled by @james, YYYY-MM-DD`, in the history owned by the queue that owns the item: `Designs/<folder>/owner-rulings.md` where that file exists, [[Decisions]] otherwise — never both. The promotion trust token keeps its existing form (`Promoted by @james on YYYY-MM-DD`); don't generalize it.

## What this is not

**A roster plus attribution — not permissions.** Nothing here is technically enforceable: direct-push, no branch protection, agents write freely by design. What tooling *can* do is make an unattributed ruling visible, and that's enough — the realistic threat isn't a rogue teammate but **an agent fabricating or misreporting a ruling**. `Designs/efsv2/owner-rulings.md` already holds the near-miss (2026-07-16: *"I told James I'd recorded this but had not"*).

Deliberately not built: per-file ACLs, CODEOWNERS (needs a PR flow; this repo is direct-push), branch protection, GPG-as-gate (authenticates a machine, not a scope), quorum/delegation, per-agent write permissions. **The gate is on rulings, not edits.**

If this file grows past one table and these rules, it has failed.
