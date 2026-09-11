import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createActionJournal } from '../web/action-journal.mjs';
// Execute the actual app's orchestration functions without booting its absolute
// browser-only module imports. This is behavioral execution, not a text assertion.
const app = await readFile(new URL('../web/app.mjs', import.meta.url), 'utf8');
function appFunction(name, globals = {}) {
  const source = app.match(new RegExp('^(?:async )?function ' + name + '\\([^]*?^}', 'm'))?.[0];
  assert(source, `app function ${name} is available`);
  return vm.runInNewContext('(' + source + ')', globals);
}
const context = { environmentId: 'source/core/deployment', principal: 'author' };
function signedJournal() {
  let saved = null;
  const journal = createActionJournal({ getItem: () => saved, setItem: (_, value) => { saved = value; } });
  journal.begin({ actionId: 'signed', label: 'signed', context, nonce: '7', deadline: '200' }); journal.mark('signed', { authorization: 'unknown' }); return journal;
}
test('actual sponsor refusal branch retains an already-created signature guard', async () => {
  const journal = signedJournal();
  const submit = appFunction('sponsorSend', { assertDeploymentContext: async () => {}, sponsorRequestIdentity: () => ({ requestId: 'r', requestCommitment: 'c' }),
    markAction: (action, patch) => journal.mark(action.actionId, patch), attempt: () => 'request-attempt', recordAttempt() {}, sponsorCostEvents: () => [], costEvent() {}, boundedJSON() {},
    sponsorSubmit: async () => { throw Object.assign(Error('refusal before broadcast'), { submitted: false, transactions: [] }); } });
  await assert.rejects(submit({ actionId: 'signed', context, transport: { source: {} }, sponsor: { url: '/sponsor', payer: 'payer' } }, {}), /refusal/);
  assert.equal(journal.entries()[0].authorization, 'unknown');
});
test('nonce or timestamp regression reactivates a retained signed guard', () => {
  const journal = signedJournal();
  assert.equal(journal.conflict(context, '7', '100').actionId, 'signed');
  assert.equal(journal.conflict(context, '8', '100'), null);
  assert.equal(journal.conflict(context, '7', '100').actionId, 'signed', 'nonce regression before deadline cannot revive an unguarded signature');
  assert.equal(journal.conflict(context, '7', '201'), null);
  assert.equal(journal.conflict(context, '7', '200').actionId, 'signed', 'chain-time regression to deadline reactivates guard');
});
test('a delayed resumed page cannot repaint a newer navigation generation', async () => {
  let release, started;
  const held = new Promise(resolve => { release = resolve; });
  const resumed = new Promise(resolve => { started = resolve; });
  let calls = 0, visible = ['new-folder'];
  const activeStream = { resume: async () => ({ status: 'RESUMED' }), loadMore: async () => {
    if (++calls === 1) return { rowsEvidence: 'PRIOR_SEALED', detail: 'request budget', basis: { blockNumber: 10n } };
    started(); await held; return { rows: ['old-folder'] };
  } };
  const state = { busy: false, generation: 1, main: { dataset: {} }, $: () => ({ setAttribute() {} }),
    acquire: work => work(), stream: activeStream, scope: { close() {} }, current: null,
    reader: { open: async () => ({ status: 'READY', scope: { close() {} } }) }, cancel: { signal: null }, acquisitions: 1,
    render: async result => { visible = result.rows; }, renderEconomics() {}, toast() {} };
  const load = appFunction('load', state), flight = load(1);
  await resumed; state.generation = 2; release(); await flight;
  assert.deepEqual(visible, ['new-folder']);
});
