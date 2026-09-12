// Shared local environment: seeded world + router + browser server.
// Used by the interactive runner, the browser journeys and the walkthrough.
import { Interface, Wallet } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { nestedFixture } from '../test/nested-fixture.mjs';
import { routerFixture, compileRouter } from '../test/router-fixture.mjs';
import { authorityFixture } from '../test/authority-fixture.mjs';
import { WRITE_SUPPORT_SELECTORS, router2Interface, core3Interface, carrier3Interface } from '../sdk/files-actions.mjs';
import { startBrowserServer } from './server.mjs';

const READ_CONTROLS = ['bootstrap', 'configuration', 'currentRevision', 'revisionAt', 'fixtureReadContext', 'counts', 'preparationHelper', 'preparationCodehash', 'admissionLibrary', 'admissionCodehash', 'owner',
  'getRecord', 'getRecordsChecked', 'getRecordsCurrent', 'getOccurrence', 'getOccurrenceByOrdinal', 'getBindingHead', 'getBindingAtBasis', 'readHistory', 'pagePostingsHydrated', 'resolve', 'validatePlan', 'hasFixtureBytes', 'readFixtureBytes',
  'chunkStatus', 'hasChunk', 'readChunk'];

export async function startEnvironment(lab, { write = true, relay = true, sponsor = true } = {}) {
  const sponsorWallet = new Wallet(word(0x5905905905n));
  await lab.rpc('anvil_setBalance', [sponsorWallet.address, '0x3635c9adc5dea00000']);
  const f = await nestedFixture(lab);
  const r = await routerFixture(lab); // pre-upgrade continuity + type group
  const auth = await authorityFixture(lab); // revision-3 authority world
  const carrierIface = new Interface(['function hasFixtureBytes(bytes32) view returns (bool)', 'function readFixtureBytes(bytes32) view returns (bytes)',
    'function chunkStatus(bytes32) view returns (uint32,uint32,uint64,uint32,bytes32)', 'function hasChunk(bytes32,uint32) view returns (bool)', 'function readChunk(bytes32,uint32) view returns (bytes)']);
  const selectors = new Set();
  for (const iface of [lab.readIface, lab.iface, carrierIface, new Interface(['function owner() view returns(address)'])]) {
    for (const fragment of iface.fragments) if (fragment.type === 'function' && READ_CONTROLS.includes(fragment.name) && ['view', 'pure'].includes(fragment.stateMutability)) selectors.add(fragment.selector);
  }
  const addresses = [...Object.values(auth.expected.components).map(c => c.address), ...Object.keys(auth.expected.implementations)];
  const carrier = lab.expected.execution.carrier;
  const config = {
    kind: 'DISPOSABLE_FILES_BROWSER',
    scenario: 'Local upgradeable testnet: trip/ with a nested photos/ folder, real staged bytes, two claim sources and a removable/renameable history. All state is disposable.',
    expected: auth.expected, mounts: f.mounts, plans: f.plans,
    root: f.root, rootLabel: 'trip',
    authors: { A: r.A, B: r.B },
    knownTags: ['ocean', 'draft'],
    writeConfig: {
      label: 'DISPOSABLE_LOCAL_TEST_SIGNERS',
      authorityVersion: 3,
      router: auth.router, routerCodehash: auth.routerCodehash, carrier, core: lab.core,
      // Explicit, replaceable submitter+payer for wallet-signed intents.
      // Only the ADDRESS and endpoint are served; the key stays server-side.
      ...(sponsor ? { sponsor: { url: '/sponsor', payer: sponsorWallet.address, label: 'Local disposable sponsor (pays gas, cannot alter signed intents)' } } : {}),
      // The author identity a real wallet may claim. Reserved and UNCLAIMED:
      // it is a source in the aFirst/bFirst plans, so wallet-authored files
      // are actually visible and readable. No key — the wallet holds it.
      walletPrincipal: f.walletPrincipal,
      // NO operator key: the author-intent signature is the only authority
      // the served app can exercise.
      authors: {
        A: { principal: auth.A, key: word(0xa11cen), label: 'Author A' },
        B: { principal: auth.B, key: word(0xb0bn), label: 'Author B' },
      },
    },
  };
  const latestSelectors = [
    ...WRITE_SUPPORT_SELECTORS,
    router2Interface.getFunction('execute').selector,
    core3Interface.getFunction('principalNonce').selector,
    core3Interface.getFunction('principalAccount').selector,
    carrier3Interface.getFunction('chunkStatus').selector,
    carrier3Interface.getFunction('hasChunk').selector,
    carrier3Interface.getFunction('readChunk').selector,
    carrier3Interface.getFunction('stageChunk').selector,
  ];
  const rpcUrl = auth.expected.source.replace(/^managed-anvil:/, '');
  const server = relay ? await startBrowserServer({
    config, rpc: lab.rpc, addresses, selectors: [...selectors],
    write: write ? { router: auth.router, carrier, core: lab.core, latestSelectors, ...(sponsor ? { sponsorKey: sponsorWallet.privateKey } : {}) } : null,
  }) : null;
  return { f, r, auth, server, config, rpcUrl, sponsor: sponsorWallet };
}
export { compileRouter };
