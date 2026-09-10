# Programmable acceptance: a small, executable EFS v2 experiment

**Disposable local prototype.** This tests the proposed mandatory custom-rule
boundary and its developer tooling. It is not integrated with the Files Core,
not a public deployment, and not a permanent Type/Rule/activation ABI.

## The useful result

An application declares named fields and a mandatory developer-written rule.
Generated helpers prepare those fields; one authenticated contract boundary
checks the shape, executes the rule, and records acceptance. Another contract
can read that evidence without running the rule again.

The examples are deliberately different:

- **Outfit → Equip:** compatible clothing can be published; equipping it is a
  new action under current game policy. Turning off new equipment does not erase
  the old item or its acceptance. Keeping already-equipped items is explicit
  application policy, not a universal Core promise.
- **PaidClaim:** a unique claim consumes a local right, increments dependent
  state, and pays a treasury atomically. A duplicate refuses. If a later item in
  the transaction fails, all those effects roll back. Exact retries do not pay
  again and must carry zero fresh value.

This is the right scale to test whether programmable acceptance is workable.
It is intentionally much smaller than EFS's actual indexed, layered data model.

## Start here

| Want to… | Read/run |
| --- | --- |
| Inspect named fields and historical evidence | [Captured static inspector](web/example.html); it is a snapshot, not a live wallet app |
| Follow ordinary application code | [Named-field example](sdk/example.ts), [SDK notes](sdk/README.md) |
| See the one source declaration | [Outfit](declarations/Outfit.json) and its [generated TS](generated/Outfit.ts) / [Solidity](generated/OutfitCodec.sol) |
| Inspect actual contract semantics | [Interface](contract-interface.md), [Core](contracts/src/AcceptanceCore.sol) |
| Read from another contract | [Independent consumer](consumer/src/AcceptanceConsumer.sol) |
| Review costs, adversarial cases and limits | [Results](results.md) |
| Port the idea, without importing a new runtime | [Integration instructions](integration.md) |
| Understand remaining choices | [Design follow-through](design-followthrough.md) |

## Reproduce locally

From this planning worktree's root, use Node **24.11 or newer**, npm, Foundry
and Solidity **0.8.30**. Foundry must already have that compiler installed for
offline runs. The saved environment used macOS and Forge 1.7.1.

```sh
cd Reviews/2026-09-10-programmable-acceptance
npm ci --ignore-scripts --no-audit --no-fund
npx playwright install chromium
npm run verify
npm audit
forge test --root contracts --offline -vv
forge test --root consumer --offline -vv
forge build --root contracts --offline --sizes
forge build --root consumer --offline --sizes
```

`verify` checks deterministic generation, TypeScript compilation, Node and actual
Chromium behavior, generated Solidity, and an actual Anvil transaction/read-back
trace. The integration runner allocates its own local port/chain and stops only
its own child process. The public Anvil key is test-only. No wallet or public RPC
is needed. Browser installation is a setup step, not a running service.

Normal runs write ignored `evidence.local.json` and `web/example.local.html`;
the committed `sdk/observed-run.json` and `web/example.html` are deliberate saved
captures. To refresh those tracked captures after reviewing a successful run:

```sh
node scripts/snapshot-evidence.mjs
```

The original Files authority/router control is separately reproducible from
the worktree root after installing the rehearsal and upgrade-foundation lab
dependencies. Its evidence and exact commands are in [results](results.md).
It is not part of this acceptance lab's SDK test command.

## A developer walkthrough

1. **Declare the data and rule.** `Outfit.json` names `species`, `shirt`, `pants`
   and the mandatory rule artifact/configuration. Run `npm run generate`.
   Changing a declaration creates different exact identity; a friendly version
   label does not confer compatibility.
2. **Write/deploy the application rule.** The example rejects a forbidden
   species/shirt combination and incompatible shirt/pants. The coordinator
   itself knows nothing about goblins or clothing. Read-only rules use bounded
   `STATICCALL`; stateful rules use bounded ordinary `CALL`.
3. **Choose the local binding once during setup.** `registerKnownRule` compares
   deployed runtime with the chosen compiled artifact and checks declared local
   configuration. It registers the exact Type and activates that rule at this
   chain/coordinator. Selecting trusted code, configuration and administrators is
   still the application's responsibility; matching hashes do not confer trust.
4. **Use named fields.** `planOutfitAndEquip` takes
   `{ species: 1n, shirt: 1n, pants: 1n }`, the chosen bindings and normal plan
   context. It hides ABI/ID hashing. `equipPreviousOutfit` explicitly means the
   immediately preceding item, solving this fixture's same-plan reference cycle.
5. **Authorize, submit, read back.** `authorize` signs the exact unchanged plan;
   a relayer submits it. The direct path uses transaction authorship instead.
   Submission/mining leaves the effect `UNKNOWN`. `readBack` verifies the retained
   exact receipt and body at a pinned basis before reporting `COMMITTED`.
   This local runner does not prove real-wallet popup counts or sponsorship UX.
6. **Consume history without revalidation.** The independent Solidity consumer
   pins the required Type, rule, activation and author, then checks receipt/body
   commitments and uses generated decoding. Historical acceptance is separate
   from current eligibility and consumer trust.

The additive OutfitV2 fixture adds `badge` while preserving the original
mandatory compatibility rule. An OutfitV1 editor explicitly refuses that unknown
exact Type; it cannot silently rewrite V2 and drop the badge. Automatic old-reader
projections and lossless editing are future tooling, not claims of this arm.

## Scope and source history

- Runtime/base: `92f2d6bd7d021f2dc5488482fe29f68bbef41d38`.
- Design checkpoint read separately: `cf352ed6bd5e2396550cbba068f56c1986d069c6`.
- Work branch: `codex/programmable-acceptance`. No bulk design merge.
- Initial Core/rules commit: `496eb1ddc1e5c1a90b44a14bf55e0368f1b1f0cb`.
- Initial generator/SDK/inspector commit: `a44362e69e598afea41938e37b6416128eac101d`.
- Initial independent consumer commit: `bfe7f0e1415d83e2a1e4d902b51a2584f4ecd471`.
- Required SDK review fixes: `0403388d794f62498e3b945b2856e3c39ae986fc` and
  `9d2b1441e04f1c6868771f7155355d5fe4613c47`; consumer adaptation:
  `b90a55d658ff65785ed5a42a1e45d6819cc0bdc4`.
- Review corrections and final documentation are subsequent scoped commits;
  see `git log --oneline 92f2d6b..HEAD` on this branch. Do not cherry-pick only
  the initial commits while omitting their review fixes.

The [mission](mission.md) is the authorized scope. Fable's checkout, browser,
export, wallet source and running environment were not modified. Publication of
this branch does not merge main or authorize deployment. The final scoped
readiness decision and open port requirements are recorded in [results](results.md).
