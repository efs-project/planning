// Shared local environment: seeded world + router + browser server.
// Used by the interactive runner, the browser journeys and the walkthrough.
import { Interface } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { nestedFixture } from '../test/nested-fixture.mjs';
import { routerFixture, compileRouter } from '../test/router-fixture.mjs';
import { WRITE_SUPPORT_SELECTORS } from '../sdk/files-actions.mjs';
import { startBrowserServer } from './server.mjs';

const READ_CONTROLS = ['bootstrap', 'configuration', 'currentRevision', 'revisionAt', 'fixtureReadContext', 'counts', 'preparationHelper', 'preparationCodehash', 'admissionLibrary', 'admissionCodehash', 'owner',
  'getRecord', 'getOccurrence', 'getOccurrenceByOrdinal', 'getBindingHead', 'getBindingAtBasis', 'readHistory', 'pagePostingsHydrated', 'resolve', 'validatePlan', 'hasFixtureBytes', 'readFixtureBytes'];

export async function startEnvironment(lab, { write = true } = {}) {
  const f = await nestedFixture(lab);
  const r = await routerFixture(lab);
  const carrierIface = new Interface(['function hasFixtureBytes(bytes32) view returns (bool)', 'function readFixtureBytes(bytes32) view returns (bytes)']);
  const selectors = new Set();
  for (const iface of [lab.readIface, lab.iface, carrierIface, new Interface(['function owner() view returns(address)'])]) {
    for (const fragment of iface.fragments) if (fragment.type === 'function' && READ_CONTROLS.includes(fragment.name) && ['view', 'pure'].includes(fragment.stateMutability)) selectors.add(fragment.selector);
  }
  const addresses = [...Object.values(lab.expected.components).map(c => c.address), ...Object.keys(lab.expected.implementations)];
  const carrier = lab.expected.execution.carrier;
  const config = {
    kind: 'DISPOSABLE_FILES_BROWSER',
    scenario: 'Local upgradeable testnet: trip/ with a nested photos/ folder, real staged bytes, two claim sources and a removable/renameable history. All state is disposable.',
    expected: lab.expected, mounts: f.mounts, plans: f.plans,
    root: f.root, rootLabel: 'trip',
    authors: { A: r.A, B: r.B },
    knownTags: ['ocean', 'draft'],
    writeConfig: {
      label: 'DISPOSABLE_LOCAL_TEST_SIGNERS',
      router: r.router, carrier, core: lab.core,
      operatorKey: word(0xc009n),
      authors: {
        A: { principal: r.A, key: word(0xa11cen), label: 'Author A' },
        B: { principal: r.B, key: word(0xb0bn), label: 'Author B' },
      },
    },
  };
  const server = await startBrowserServer({
    config, rpc: lab.rpc, addresses, selectors: [...selectors],
    write: write ? { router: r.router, carrier, core: lab.core, latestSelectors: WRITE_SUPPORT_SELECTORS } : null,
  });
  return { f, r, server, config };
}
export { compileRouter };
