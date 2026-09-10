# Disposable generated-helper consumer

This standalone acceptance experiment is not the production SDK, a C0 adapter,
or a full Files-browser result. Its exact receipts, flat ABI-word bodies and
EOA author model intentionally cover less than the imported five-seam design.

## Clean-checkout verification

From this lab directory, with Node >=24.11, npm and Forge/Anvil 1.7.1 on PATH:

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm run verify
```

Verification runs deterministic regeneration checking, TypeScript compilation,
Node unit tests, actual headless Chromium hostile-label rendering, generated
Solidity compilation and local Anvil integration. The test allocates a fresh
localhost port, starts one child Anvil, and terminates only that child. It never
uses Fable's services. Runtime observed here: Node 26.0.0, ethers 6.17.0,
TypeScript 5.9.3, Playwright 1.62.1, Solidity 0.8.30/Cancun/via-IR/200 runs.

`npm run generate` updates all generated artifacts from one JSON declaration
per Type. Exact ordered fields, labels, rule artifact name, semantic and local
binding input schemas, mode and gas budget enter the descriptor commitment.
Actual runtime code hash and semantic config additionally enter Rule/Type ID.
Duplicate JSON keys/names/fields, invalid identifiers, unsupported field kinds,
unknown declaration keys and out-of-bound rules are refused. Supported fields
are uint256, address, bytes32, bool, max eight flat words; this is not the final
EFS codec. Generated libraries are genuine named-field Solidity codecs, not
handwritten per-application decoders.

## Setup: choose code and constructor policy explicitly

```ts
const outfit = await registerKnownRule(provider, core, Outfit, outfitArtifact,
  {}, outfitHookAddress, { core: coreAddress });
const equip = await registerKnownRule(provider, core, Equip, equipArtifact,
  { outfitType: outfit.registration.typeId }, equipHookAddress,
  { core: coreAddress, admin: policyAdmin });
const paid = await registerKnownRule(provider, core, PaidClaim, paidArtifact,
  { fee: 1000n }, paidHookAddress,
  { core: coreAddress, treasury: treasuryAddress });
```

These helpers compare deployed runtime to the chosen compiled artifact, then
compare its known binding ABI to named expected semantic/local inputs. That is
known-code/configuration trust, not a proof of arbitrary contract semantics.
The helper computes all Type/Rule/activation hashes. No first-registration
ownership or default activation is introduced. The setup receipt proves local
registration progress, not application effect; normal writes use read-back.

## Ordinary application path

The executable, integration-tested example is `example.ts`:

```ts
const planned = planOutfitAndEquip({
  context, author, executor, nonce, deadline, outfit, equip,
  fields: { species: 1n, shirt: 1n, pants: 1n }, sourceReads
});
const prepared = await authorize(planned, authorSigner); // one EIP-712 plan
const submitted = await submit(prepared, relayer);       // effect UNKNOWN
const basis = await pinBasis(independentReadProvider, context);
const result = await readBack(independentReadProvider, submitted, basis);
// Only result.effect === 'COMMITTED' means matching canonical read-back.
```

For direct EOA submission, use `submit(direct(planned), authorSigner)` with no
preceding signature. An exact retry uses the unchanged prepared plan and
`submit(prepared, submitter, { exactRetry: true })`; it supplies zero new value.
Never use a new nonce as recovery from unknown submission without reconciliation.

`equipPreviousOutfit` means the immediately preceding staged item under this
specific Equip rule. Its encoded zero is a relative-reference convention,
not a literal accepted receipt ID. The rule still checks prior index, exact
Outfit Type and author. Reordering the plan changes its signed digest.

## Evolution, inspection and boundaries

OutfitV2 adds `badge` but preserves the mandatory Outfit rule; badge has only
structural uint256 meaning. Old editors call `Outfit.edit(exactType, ...)` and
refuse unknown exact Types before preparing bytes. A forged registration ID
cannot bypass that check. No safe write-back projection or automatic compatible
Type promotion is claimed. An old reader may manually project common named
fields only as a structural view, never inherit acceptance or edit authority.

The generic inspector (`../web/inspector.ts`) displays a descriptor/evidence
bundle without an Outfit decoder or backend. It escapes every data value.
Descriptor labels are explicitly local display metadata; matching the supplied
descriptor hash alone does not claim chain-bound labels. Exact receipt/Type
evidence, body bytes, application basis and pinned block basis remain separate.
The generated `../web/example.html` is a captured local run, not live state.
To explicitly refresh committed example/evidence snapshots after verification,
run `node scripts/snapshot-evidence.mjs` from the lab directory. Routine tests
write only ignored local captures, keeping the committed snapshot stable.

Five seams remain visible: exact historical acceptance read; scoped-page
support explicitly UNSUPPORTED; exact verified body bytes only (no broad byte
carriers); plan/authorize/submit; independent pinned canonical read-back. Reads
retain raw calldata/result bytes and per-call basis, with local-RPC authority
and no state-proof/finality claim. Failed/missing/reorged evidence stays UNKNOWN.
No generic `read<T>()`, universal validity flag, session delegation, paginator,
or arbitrary policy revalidation is implemented. Current policy and consumer
pin matching remain NOT_EVALUATED in the generic inspector.

Paid uniqueness is per hook deployment. Two activations sharing a hook share
its `used` state; different hook deployments do not share a global claim map.
The policy-admin/hook binding choice remains an explicit setup trust decision.

The initial ethers 6.15.0 pin brought two npm-audit findings through `ws`.
This lab independently updates to ethers 6.17.0 with a fresh lockfile; sibling
rehearsal dependencies are untouched. Review dependencies again before reuse;
an audit pass alone does not establish production safety.

`../evidence.local.json` contains actual gas, transaction hashes, source basis,
read RPC count/timing and address-qualified final storage diffs. Slot diffs
exclude trie overhead and transient writes restored before transaction end;
they are not a full storage-cost or throughput claim.
`observed-run.json` retains one full observed run for review after Anvil exits.
