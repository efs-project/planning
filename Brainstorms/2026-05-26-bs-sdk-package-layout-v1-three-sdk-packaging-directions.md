---
agent: bs-sdk-package-layout-v1
date: 2026-05-26
status: raw
anchors:
  - area: sdk
---

# Three SDK packaging directions

EFS has committed to three SDK types per the 2026-05-26 decision: an **on-chain SDK** (read/write/graph primitives wrapping the contracts), an **off-chain TypeScript SDK** (ergonomic wrappers + caching), and the **EFS OS SDK** (the `efs.*` capability proxy endowed into Ring 3 SES Compartments per the OS architecture brainstorm). They sit at very different layers — the OS SDK is a *security boundary*, not a developer-convenience layer — and they have very different update cadences. This brainstorm explores three packaging shapes: **three independent repos**, **one monorepo with three packages**, and **one repo with a single namespaced package surface**. Each is laid out at equal depth; the final table is for quick scanning and the closing questions name the decisions James has to actually make.

---

## Direction 1: Three independent repos

### Layout

Three top-level sibling repos under `efs-project/`, mirroring the existing `contracts/` and `client/` pattern noted in `AGENTS.md`.

```
/efs/
  contracts/             (existing)
  client/                (existing)
  planning/              (existing)
  sdk-onchain/           NEW  → npm: @efs/onchain
  sdk-offchain/          NEW  → npm: @efs/offchain
  sdk-os/                NEW  → npm: @efs/os-sdk
```

Each repo: its own README, its own CI, its own `package.json`, its own release cadence, its own ADR folder (`docs/adr/`), its own `AGENTS.md`. `sdk-offchain` depends on `@efs/onchain` as a regular npm dependency. `sdk-os` depends on `@efs/offchain` (the capability proxy ultimately calls off-chain methods that call on-chain methods).

### Update cadence implications

Each SDK ships on its own clock. The on-chain SDK can stay nearly frozen (it only moves when contracts move — and contracts are designed to be immutable). The off-chain SDK can ship weekly (caching tweaks, ergonomics). The OS SDK can ship hourly during the post-OnionDAO design churn without dragging anyone else along. Independent versioning is the entire point.

### Dependency management

Plain npm semver between the three. Off-chain pins on-chain (e.g., `"@efs/onchain": "^1.2.0"`), OS pins off-chain. Downstream apps pick whichever SDKs they need and pin them independently. The cost: when on-chain ships a breaking change, off-chain has to do a coordinated bump-and-release dance before OS SDK can consume the new behavior — a three-step coordination cascade that's invisible inside a monorepo but very visible here.

### Semver implications

Cleanest possible isolation. A breaking change in `@efs/os-sdk` is invisible to a hackathon dev using only `@efs/offchain` — their lockfile literally doesn't list it. This is the strongest answer to "I only use the off-chain SDK, leave me alone." Cost: when the on-chain primitive surface genuinely changes, three repos have to release in order, and downstream `peerDependencies` mismatches become a real support burden.

### Contributor onboarding

Lowest friction *within* one SDK: clone one small repo, install, hack, PR. Highest friction *across* SDKs: a bug that turns out to span on-chain and off-chain requires two clones, two branches, two PRs, and possibly a yalc/`npm link` dance to test the cross-cut. For an external contributor wanting to fix one bug, this is the friendliest direction.

### Ecosystem discoverability

Three separate npm pages, three READMEs, three GitHub repos. A hackathon dev Googling "EFS SDK" finds whichever has the best SEO and may not realize there are siblings. Mitigated by good cross-linking in READMEs and a top-level meta-README in the planning vault, but real risk of "I built on `@efs/onchain` not knowing `@efs/offchain` existed."

### Repository governance

Three issue trackers, three PR queues, three CI configs, three release pipelines. For a tiny team (James + agents), this is a real tax. Counter: each repo's surface is small enough that drift is unlikely, and labels/templates can be cloned. The 2026-05-26 "SDK + Client are rotting" Decisions entry already flags maintenance bandwidth as a constraint — three repos amplifies that.

### Downstream `package.json` example

```json
{
  "dependencies": {
    "@efs/onchain": "^1.2.0",
    "@efs/offchain": "^0.8.1"
  }
}
```

An OS-app developer adds `"@efs/os-sdk": "^0.3.0"` only if they're targeting the Ring 3 environment.

---

## Direction 2: One monorepo, three published packages

### Layout

Single `sdk/` repo at the workspace root, pnpm/yarn/npm workspaces, three publishable packages under `packages/`.

```
/efs/
  sdk/                              NEW
    package.json                    (workspace root, private)
    pnpm-workspace.yaml
    packages/
      onchain/      → npm: @efs/onchain
      offchain/     → npm: @efs/offchain
      os/           → npm: @efs/os-sdk
    docs/
      adr/                          (single ADR thread spanning all three)
    .changeset/                     (Changesets for coordinated releases)
    AGENTS.md
```

`packages/offchain` declares `"@efs/onchain": "workspace:^"`. `packages/os` declares `"@efs/offchain": "workspace:^"`. Releases via Changesets — each PR includes a changeset entry per package it touches; CI publishes whichever packages have queued changesets.

### Update cadence implications

Each package can still ship independently (Changesets is designed for exactly this), but releases tend to *cluster* because PRs that touch multiple packages produce coupled version bumps. The OS SDK can still ship hourly without dragging the others if its PRs only touch `packages/os/`. The practical effect: independent in theory, gently lockstep in practice.

### Dependency management

Inside the repo: workspace protocol, no version dance. Outside the repo: same semver story as Direction 1 — downstream apps depend on published packages, not on the workspace. The win: cross-cutting refactors (e.g., a shared types package, a shared error class) are a single PR instead of a three-repo cascade.

### Semver implications

The cleanest path to per-package semver of any direction *if* discipline holds. Changesets enforces explicit per-package version bumps in each PR, so "off-chain SDK consumers are unaffected" remains true even when OS SDK breaks. The risk is sloppy changesets — devs (or agents) tagging unrelated packages and producing unnecessary major bumps. Process discipline matters more here than in Direction 1, where the repo boundary enforces isolation automatically.

### Contributor onboarding

Single clone, single install, single test command. A contributor fixing a cross-cutting bug touches one PR. A contributor fixing a one-SDK bug still has to install the whole workspace (larger initial download, more deps). For an external hackathon contributor wanting to fix one typo in the off-chain README, this is more friction than Direction 1 but less than Direction 3.

### Ecosystem discoverability

Three npm packages but **one GitHub repo**, one README, one issue tracker. The repo can host a clear "which SDK do you need?" decision tree at the top. Best of both: separable consumption, unified marketing surface.

### Repository governance

One issue tracker (with labels: `area:onchain`, `area:offchain`, `area:os`), one PR queue, one CI matrix. Releases automated via Changesets bot. For a small team this is the lowest ongoing tax. Cost: the CI config is more complex (matrix builds per package), and a broken CI blocks all three SDKs.

### Downstream `package.json` example

Identical to Direction 1 from the consumer's view — they see published packages, not the workspace:

```json
{
  "dependencies": {
    "@efs/onchain": "^1.2.0",
    "@efs/offchain": "^0.8.1",
    "@efs/os-sdk": "^0.3.0"
  }
}
```

The workspace shape is invisible downstream. This is the key property: monorepo internally, multi-package externally.

---

## Direction 3: One repo, one package, three namespaces

### Layout

Single `sdk/` repo, single published package `@efs/sdk`, three entry points exposed as subpath exports.

```
/efs/
  sdk/                              NEW
    package.json                    → npm: @efs/sdk
    src/
      onchain/index.ts              → "@efs/sdk/onchain"
      offchain/index.ts             → "@efs/sdk/offchain"
      os/index.ts                   → "@efs/sdk/os"
      index.ts                      → re-exports all three
    docs/adr/
    AGENTS.md
```

`package.json` declares `"exports"` map. Consumers import `import { read } from "@efs/sdk/onchain"` or `import { efs } from "@efs/sdk/os"`. One version number governs everything.

### Update cadence implications

Lockstep by construction. Every release bumps every namespace's version, even if only one changed. The on-chain namespace — which should be near-frozen — gets dragged through version bumps every time OS SDK churns. Conversely, the OS SDK can't ship hourly without dragging on-chain along, which feels wrong given on-chain wraps immutable contracts.

### Dependency management

Trivial internally — they're just folders. Trivial downstream — one dependency line. The cost is hidden: a downstream app pulling in `@efs/sdk` for off-chain functionality also pulls in OS SDK bundle weight (mitigatable with tree-shaking, but only if every namespace is carefully ESM-pure). For a hackathon entrant who just wants `read()` and `write()`, this ships them the OCap capability proxy machinery they'll never use.

### Semver implications

Worst answer to "I only use the off-chain SDK, leave me alone." A breaking change in the OS SDK *forces* a major bump on the whole package; off-chain consumers see a major in their dependency feed and have to read the changelog to confirm they're unaffected. SemVer purists will argue this violates the spirit of semver (breakage signal without actual breakage). Pragmatists will say it's fine — just communicate clearly in the changelog.

### Contributor onboarding

Lowest friction by a wide margin. One clone, one install, one test, one PR — no workspace tooling, no Changesets, no cross-repo coordination. For solo-James-plus-agents working through a small initial design phase, this is the path of least resistance. The cost compounds later as the codebase grows.

### Ecosystem discoverability

Single npm page, single README, single set of docs. A hackathon dev finds `@efs/sdk` and discovers all three surfaces from one place. Strongest discoverability story of the three directions. Cost: the README has to do triple duty and can become a "kitchen sink" doc that scares off devs who only need one surface.

### Repository governance

Easiest. One of everything. CI is one pipeline. Releases are `npm version patch && npm publish`. For early-stage SDK work this is the lowest-tax option. The tax appears later, when the three SDKs have grown asymmetrically and one of them wants to move on its own clock and structurally cannot.

### Downstream `package.json` example

```json
{
  "dependencies": {
    "@efs/sdk": "^1.4.0"
  }
}
```

And in code:

```ts
import { read, write } from "@efs/sdk/onchain";
import { cache } from "@efs/sdk/offchain";
import type { Endowment } from "@efs/sdk/os";
```

---

## Comparison table

| Dimension | D1: Three repos | D2: Monorepo, three packages | D3: One repo, one package |
|---|---|---|---|
| **Layout** | `sdk-onchain/`, `sdk-offchain/`, `sdk-os/` siblings | `sdk/packages/{onchain,offchain,os}` | `sdk/src/{onchain,offchain,os}` |
| **Update cadence** | Fully independent, real clocks | Independent per-package via Changesets; tends to cluster | Lockstep; every release moves all three |
| **Dep management (internal)** | Cross-repo npm semver dance | Workspace protocol, single PR | Trivial — they're folders |
| **Dep management (downstream)** | Pick what you need; three pins | Pick what you need; up to three pins | One pin, get all three |
| **Semver isolation** | Strongest — off-chain consumers truly never see OS SDK | Strong if Changeset discipline holds | Weakest — OS break forces whole-package major |
| **Contributor onboarding (single SDK)** | Lowest friction | Medium (workspace install) | Lowest friction |
| **Contributor onboarding (cross-SDK)** | Highest friction (multi-repo coord) | Lowest friction (one PR) | Lowest friction (one PR) |
| **Discoverability** | Weakest — three npm pages, easy to miss siblings | Strong — one repo, three packages, decision tree in README | Strongest — one package, one page, one README |
| **Governance load** | Highest — 3× CI, 3× issues, 3× releases | Medium — one repo, Changesets automation | Lowest — one of everything |
| **Bundle weight for partial consumers** | Optimal (pay for what you import) | Optimal (per-package) | Depends on tree-shaking discipline |
| **Best when** | SDKs evolve at radically different speeds and external contributors matter | Want internal cohesion + external separability | Earliest stage; one team; one clock |
| **Worst when** | Small team, lots of cross-cutting refactors | Discipline lapses on Changesets | One SDK matures and needs to move alone |

---

## PM's question for James

1. **OS SDK churn rate.** How often do you expect the OS SDK surface to break during early development — hourly during design churn, weekly during stabilization, or quarterly once the Ring 3 endowment shape is settled? If the answer is "hourly for months," Direction 3's lockstep cost is real; Direction 1 or 2 protects on-chain/off-chain consumers from the noise.
2. **External contributor priority.** During and after OnionDAO, do you want hackathon entrants and external devs filing PRs against the SDK? If yes, which SDK most — on-chain, off-chain, or OS? The answer changes whether Direction 1 (lowest single-SDK friction) or Direction 3 (lowest discovery friction) wins.
3. **Bundle weight tolerance for off-chain-only consumers.** Is it acceptable for a dev who only wants `read()` / `write()` to download the OCap proxy machinery? If no, Direction 3 needs perfect tree-shaking discipline or is off the table.
4. **Tooling appetite.** Are you (and the agent swarm) willing to run pnpm workspaces + Changesets from day one? Direction 2 is the most powerful but assumes that tooling is in place and stays maintained. Given the 2026-05-26 "SDK + Client are rotting" entry, adding tooling-debt at the wrong moment matters.
5. **Reversibility plan.** Which direction do you think is *easiest to migrate away from* if it turns out wrong? Direction 3 → Direction 2 is a mechanical refactor with no consumer impact. Direction 1 → Direction 2 means consolidating three git histories. Direction 2 → Direction 1 means splitting a monorepo. If you're not sure, pick the most easily-reversed and revisit at the post-OnionDAO SDK design thread.
