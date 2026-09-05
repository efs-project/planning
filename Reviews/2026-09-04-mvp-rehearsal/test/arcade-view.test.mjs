import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import * as games from '../web/game-source.mjs';
import * as utilities from '../sdk/index.js';
import { createLaunchCoordinator } from '../web/model.mjs';

const arcade = await import('../web/arcade-view.mjs').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});
const hex = byte => `0x${byte.repeat(32)}`;
const seed = hex('11');
const basis = { chainId: 31337n, blockNumber: 16n, blockHash: hex('88'), timestamp: 1700000000n };
const domain = { realmId: hex('66'), core: '0x4000000000000000000000000000000000000004', profile: 'efs-lab/1' };
const q = { coverage: 'COMPLETE', support: 'SUPPORTED', validation: 'VALID', authority: 'NOT_APPLICABLE', currentness: 'CURRENT_AT_BASIS', finality: 'UNKNOWN', integrity: 'NOT_APPLICABLE', availability: 'AVAILABLE', bytes: 'RETURNED', effect: 'NOT_APPLICABLE' };
const exact = (subject, value, qualification = {}) => ({ outcome: 'FOUND', domain: { ...domain, subject }, basis, value, qualification: { ...q, ...qualification }, evidence: [] });
const bytesResult = (value) => exact(utilities.deriveContentId(value), { bytes: value }, { integrity: 'VERIFIED' });

function packet() {
  const gamePayload = bytesResult('0x3c21444f4354595045');
  const payload = bytesResult(seed);
  const challengeSchemaId = utilities.deriveSchemaId('0x03');
  const challengeId = utilities.deriveRecordId({ schemaId: challengeSchemaId, data: seed });
  const config = { game: { fileId: hex('55'), revision: 2, contentId: gamePayload.domain.subject, challengeSchemaId, challengeIds: [challengeId], runnerProfile: 'opaque-scripts/1', capabilityCeiling: [] } };
  return {
    config, releaseLock: config.game, challengeId,
    selection: exact(config.game.fileId, { contentId: config.game.contentId, previous: hex('44') }),
    gamePayload, record: exact(challengeId, { schemaId: challengeSchemaId, contentId: payload.domain.subject }),
    schema: exact(challengeSchemaId, '0x03', { integrity: 'VERIFIED' }), payload,
    validation: { ...exact(challengeSchemaId, undefined, { integrity: 'VERIFIED', currentness: 'UNKNOWN' }), valid: true, descriptor: '0x03', computedSchemaId: challengeSchemaId, fields: [seed], references: [] },
  };
}

test('legacy release bytes remain byte-for-byte identical when challenge revision is added', () => {
  assert.equal(typeof games.legacyGameBytes, 'function', 'legacy export is required');
  assert.equal(createHash('sha256').update(games.legacyGameBytes()).digest('hex'), '075461bdfb4c40deec0090e68e373db3621e2b929aac37de34f0dcc9d2df019d');
  assert.notDeepEqual(games.gameBytes(), games.legacyGameBytes());
});

test('a challenge creates a repeatable integer obstacle sequence with no runtime randomness', () => {
  assert.equal(typeof games.deterministicObstacles, 'function', 'deterministic generator is required');
  const previous = Math.random;
  Math.random = () => assert.fail('gameplay must not call Math.random');
  try {
    const first = games.deterministicObstacles(seed, 128);
    assert.deepEqual(first, games.deterministicObstacles(seed, 128));
    assert.notDeepEqual(first, games.deterministicObstacles(hex('22'), 128));
    assert.equal(first.length, 128);
    for (const obstacle of first) {
      assert(Number.isInteger(obstacle.y) && obstacle.y >= 40 && obstacle.y <= 960);
      assert(Number.isInteger(obstacle.r) && obstacle.r >= 10 && obstacle.r <= 25);
      assert(Number.isInteger(obstacle.v) && obstacle.v >= 130 && obstacle.v <= 259);
    }
    assert.equal(games.obstacleSequenceHash(first), games.obstacleSequenceHash(games.deterministicObstacles(seed, 128)));
    assert.notEqual(games.obstacleSequenceHash(first), games.obstacleSequenceHash(games.deterministicObstacles(hex('22'), 128)));
  } finally { Math.random = previous; }
});

test('seed input rejects missing, partial, extra and script-shaped configuration', () => {
  assert.equal(typeof games.deterministicObstacles, 'function', 'deterministic generator is required');
  for (const bad of [undefined, '', '0x11', `${seed}11`, '<script>alert(1)</script>', new Uint8Array(32)]) {
    assert.throws(() => games.deterministicObstacles(bad), /seed/i);
  }
});

test('arcade links accept only one exact challenge ID or an explicit default', () => {
  assert.equal(typeof arcade.parseArcadeRoute, 'function', 'strict route parser is required');
  assert.equal(arcade.parseArcadeRoute(`#arcade?challenge=${seed}`, hex('22')), seed);
  assert.equal(arcade.parseArcadeRoute('#arcade', seed), seed);
  for (const route of ['#arcade?', '#arcade?challenge=', '#arcade?challenge=latest', `#arcade?challenge=${seed}&challenge=${seed}`, `#arcade?challenge=${seed}&extra=1`, `#files?challenge=${seed}`, '#arcade/extra']) {
    assert.throws(() => arcade.parseArcadeRoute(route, seed), /challenge|route/i);
  }
  assert.throws(() => arcade.parseArcadeRoute('#arcade'), /challenge/i);
});

test('release lock rejects unpinned revision, runner changes and any granted capability', () => {
  assert.equal(typeof arcade.arcadeReleaseLock, 'function', 'release lock is required');
  const good = packet().config;
  assert.equal(arcade.arcadeReleaseLock(good).revision, 2);
  for (const changed of [{ revision: 'latest' }, { revision: 1 }, { contentId: '' }, { challengeSchemaId: '' }, { runnerProfile: 'same-origin/1' }, { capabilityCeiling: ['wallet'] }, { capabilityCeiling: undefined }]) {
    assert.throws(() => arcade.arcadeReleaseLock({ game: { ...good.game, ...changed } }), /lock|release|capabilit|runner|revision|schema|content/i);
  }
});

test('only exact bound qualified game bytes and a verified validated inert seed are admitted', () => {
  assert.equal(typeof arcade.verifyChallengeLaunch, 'function', 'launch gate is required');
  const checked = arcade.verifyChallengeLaunch(packet(), utilities);
  assert.equal(checked.seed, seed);
  assert.deepEqual(checked.bytes, new Uint8Array([60, 33, 68, 79, 67, 84, 89, 80, 69]));
  assert.equal(checked.basis.blockHash, basis.blockHash);
});

for (const field of ['selection', 'gamePayload', 'record', 'schema', 'payload', 'validation']) {
  test(`mixed basis in ${field} blocks Play`, () => {
    assert.equal(typeof arcade.verifyChallengeLaunch, 'function', 'launch gate is required');
    const input = packet(); input[field] = { ...input[field], basis: { blockNumber: 17n, blockHash: hex('99') } };
    assert.throws(() => arcade.verifyChallengeLaunch(input, utilities), /basis/i);
  });
  test(`unsupported ${field} blocks Play`, () => {
    assert.equal(typeof arcade.verifyChallengeLaunch, 'function', 'launch gate is required');
    const input = packet(); input[field].qualification.support = 'UNSUPPORTED';
    assert.throws(() => arcade.verifyChallengeLaunch(input, utilities), /qualified|support|validat|bytes|schema/i);
  });
}

test('chain and timestamp drift cannot share a game basis despite matching block hash', () => {
  for (const field of ['chainId', 'timestamp']) {
    const input = packet(); input.payload.basis = { ...input.payload.basis, [field]: 999999n };
    assert.throws(() => arcade.verifyChallengeLaunch(input, utilities), /basis/i);
  }
});

test('missing, corrupted, substituted and invalid challenge evidence never selects fallback seed', () => {
  assert.equal(typeof arcade.verifyChallengeLaunch, 'function', 'launch gate is required');
  const mutations = [
    input => { input.record.outcome = 'ABSENT_PROVEN'; },
    input => { input.record.domain.subject = hex('ff'); },
    input => { input.record.value.schemaId = hex('ff'); },
    input => { input.payload.qualification.integrity = 'FAILED'; },
    input => { input.gamePayload.qualification.integrity = 'FAILED'; },
    input => { input.payload.value.bytes = hex('22'); },
    input => { input.schema.value = '0x04'; },
    input => { input.validation.descriptor = '0x04'; },
    input => { input.validation.fields = [hex('22')]; },
    input => { input.validation.valid = false; },
    input => { input.validation.qualification.currentness = 'STALE'; },
    input => { input.validation.computedSchemaId = hex('ff'); },
    input => { input.gamePayload.domain.realmId = hex('ff'); },
    input => { input.selection.domain.subject = hex('ff'); },
  ];
  for (const mutate of mutations) { const input = packet(); mutate(input); assert.throws(() => arcade.verifyChallengeLaunch(input, utilities)); }
});

test('inspection pins every hop to the game selection basis and performs SDK typed validation', async () => {
  assert.equal(typeof arcade.inspectExactChallenge, 'function', 'exact inspection is required');
  const input = packet(); let validationCalls = 0;
  const sdk = {
    async readExact(request) {
      if (request.kind === 'revision') { assert.equal(request.file, input.releaseLock.fileId); assert.equal(request.revision, 2); assert.equal(request.blockTag, 'latest'); return input.selection; }
      assert.deepEqual(request.blockTag, basis);
      if (request.kind === 'record') { assert.equal(request.id, input.challengeId); return input.record; }
      assert.equal(request.kind, 'schema'); assert.equal(request.id, input.releaseLock.challengeSchemaId); return input.schema;
    },
    async readVerifiedBytes(request) { assert.deepEqual(request.blockTag, basis); return request.contentId === input.releaseLock.contentId ? input.gamePayload : input.payload; },
    async validateTypedPayloadAtBasis(request) { validationCalls += 1; assert.deepEqual(request.blockTag, basis); assert.equal(request.schemaId, input.releaseLock.challengeSchemaId); assert.equal(utilities.deriveContentId(request.data), input.record.value.contentId); return input.validation; },
  };
  const result = await arcade.inspectExactChallenge({ sdk, config: input.config, challengeId: input.challengeId, utilities });
  assert.equal(result.seed, seed); assert.equal(validationCalls, 1);
});

test('Stop fences delayed challenge inspection before a seed or bytes can mount', async () => {
  let finish;
  const coordinator = createLaunchCoordinator({
    select: () => new Promise(resolve => { finish = resolve; }),
    load: async (_context, selected) => selected,
    admit: ({ loaded }) => loaded,
    launch: () => assert.fail('cancelled challenge must not mount'),
  });
  const pending = coordinator.play({ challengeId: seed });
  coordinator.cancel(); finish({ seed, bytes: new Uint8Array([1]) });
  assert.deepEqual(await pending, { launched: false, cancelled: true });
});

// Small DOM boundary double: real launch coordinator, lease and evidence gate
// still run; only the browser DOM and Blob URL allocation are replaced.
function viewHarness(input = packet()) {
  class Element {
    constructor(tagName) { this.tagName = tagName; this.children = []; this.handlers = {}; this.attributes = {}; this.dataset = {}; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(type, handler) { this.handlers[type] = handler; }
    async dispatch(type) { return this.handlers[type]?.({ preventDefault() {} }); }
  }
  const allocated = [], revoked = [], events = new EventTarget();
  const document = {
    createElement: tag => new Element(tag), createTextNode: text => ({ textContent: text }),
    defaultView: { Blob, URL: { createObjectURL(blob) { allocated.push(blob); return `blob:lab-${allocated.length}`; }, revokeObjectURL(url) { revoked.push(url); } }, addEventListener: events.addEventListener.bind(events) },
  };
  const nodes = new Map(); const root = new Element('section'); root.ownerDocument = document;
  Object.defineProperty(root, 'innerHTML', { set(html) { for (const match of html.matchAll(/id="([^"]+)"/g)) nodes.set(match[1], new Element('div')); } });
  root.querySelector = selector => nodes.get(selector.slice(1));
  const sdk = {
    async readExact(request) { return request.kind === 'revision' ? input.selection : request.kind === 'record' ? input.record : input.schema; },
    async readVerifiedBytes(request) { return request.contentId === input.releaseLock.contentId ? input.gamePayload : input.payload; },
    async validateTypedPayloadAtBasis() { return input.validation; },
  };
  const evidence = [];
  return { root, nodes, sdk, input, allocated, revoked, events, evidence, create() { return arcade.createArcadeView({ root, sdk, config: input.config, utilities, onEvidence: (_label, value) => evidence.push(value), onStatus() {}, onBasis() {}, navigate() {} }); } };
}

test('guest inspection is inert; Play uses seed fragment and Stop revokes the unfragmented Blob URL', async () => {
  assert.equal(typeof arcade.createArcadeView, 'function', 'arcade view is required');
  const host = viewHarness(); const view = host.create();
  await view.open(`#arcade?challenge=${host.input.challengeId}`);
  assert.equal(host.allocated.length, 0);
  assert.equal(host.nodes.get('play-game').disabled, false);
  await host.nodes.get('play-game').dispatch('click');
  assert.equal(host.allocated.length, 1);
  const frame = host.nodes.get('game-stage').children[0];
  assert.equal(frame.src, `blob:lab-1#seed=${seed}`);
  assert.equal(frame.attributes.sandbox, 'allow-scripts');
  await host.nodes.get('stop-game').dispatch('click');
  assert.deepEqual(host.revoked, ['blob:lab-1']);
  assert.equal(host.evidence.at(-1).teardown.blobRevoked, true);
  view.deactivate(); assert.deepEqual(host.revoked, ['blob:lab-1']);
});

for (const exit of ['stop', 'navigation', 'pagehide']) {
  test(`${exit} suppresses delayed challenge launch and late status updates`, async () => {
    assert.equal(typeof arcade.createArcadeView, 'function', 'arcade view is required');
    const host = viewHarness(); const view = host.create();
    await view.open('#arcade');
    let finish;
    host.sdk.readExact = () => new Promise(resolve => { finish = resolve; });
    const pending = host.nodes.get('play-game').dispatch('click');
    if (exit === 'stop') await host.nodes.get('stop-game').dispatch('click');
    else if (exit === 'navigation') view.deactivate();
    else host.events.dispatchEvent(new Event('pagehide'));
    const finalStatus = host.nodes.get('game-byte-state').textContent;
    finish(host.input.selection); await pending;
    assert.equal(host.allocated.length, 0);
    assert.equal(host.nodes.get('game-byte-state').textContent, finalStatus);
  });
}

test('failed challenge inspection disables Play and preserves blocking evidence', async () => {
  assert.equal(typeof arcade.createArcadeView, 'function', 'arcade view is required');
  const input = packet(); input.payload.qualification.integrity = 'FAILED';
  const host = viewHarness(input); const view = host.create();
  await view.open('#arcade');
  assert.equal(host.nodes.get('play-game').disabled, true);
  assert.equal(host.allocated.length, 0);
  assert.equal(host.evidence.at(-1).launch, 'BLOCKED');
});

test('an invalid replacement route cannot retain the previous challenge as the failed target', async () => {
  const host = viewHarness(); const view = host.create();
  await view.open('#arcade');
  await view.open('#arcade?challenge=invalid');
  assert.equal(host.nodes.get('play-game').disabled, true);
  assert.equal(host.evidence.at(-1).challengeId, null);
  assert.notEqual(host.nodes.get('arcade-challenge-id').textContent, host.input.challengeId);
});
