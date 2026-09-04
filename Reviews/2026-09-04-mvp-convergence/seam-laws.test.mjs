// Disposable law-level counterexamples only. Not Core, a Type parser, a wallet,
// signature verifier, or an admission implementation. Synthetic member bodies
// exercise the exact B0 group-hash dependency without claiming valid schemas.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';

const cast = process.env.C0_CAST || 'cast';
const hash = value => execFileSync(cast, ['keccak', value], { encoding: 'utf8' }).trim();
const u16 = n => n.toString(16).padStart(4, '0');
const word = n => BigInt(n).toString(16).padStart(64, '0');
const join = (...hex) => '0x' + hex.map(h => h.replace(/^0x/, '')).join('');
const groupDomain = hash('efs2/typeschema-group/1');
const typeDomain = hash('efs2/typeschema/1');
const declared = ['alpha', 'beta', 'gamma', 'delta'];
const members = [
  { name: 'alpha', bytes: '0xa1' },
  { name: 'beta', bytes: '0xb1b2' },
  { name: 'gamma', bytes: '0xc1' },
  { name: 'delta', bytes: '0xd1' },
];

function groupBytes(list) {
  return '0x' + u16(list.length) + list.map(m => {
    const bytes = m.bytes.slice(2);
    return u16(bytes.length / 2) + bytes;
  }).join('');
}

function ids(list) {
  const groupHash = hash(join(groupDomain, hash(groupBytes(list))));
  return list.map((_, i) => hash(join(typeDomain, groupHash, word(i))));
}

function legacyMembers(list) {
  const derived = ids(list);
  return list.map((member, i) => ({ member, id: derived[i] }))
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    .map(item => item.member);
}

function selectMembers(list) {
  const byName = new Map(list.map(member => [member.name, member]));
  if (list.length !== declared.length || byName.size !== declared.length ||
      declared.some(name => !byName.has(name))) throw new Error('member inventory mismatch');
  return declared.map(name => byName.get(name));
}

// These models assume all non-grant authorization checks and a valid session
// signature over the supplied plan. They isolate whether the signed nonce lane
// selects one grant, not whether an EFS signature/route/budget is otherwise valid.
function registerGrant(state, grant) {
  if (grant.nonceKey <= 0 || state.grants.has(grant.id) ||
      [...state.grants.values()].some(old =>
        old.principal === grant.principal && old.nonceKey === grant.nonceKey)) return false;
  state.grants.set(grant.id, structuredClone(grant));
  return true;
}

function writeWithGrant(state, signedPlan, grantId) {
  const grant = state.grants.get(grantId);
  if (!grant || grant.revoked || grant.key !== signedPlan.key ||
      grant.principal !== signedPlan.principal || grant.nonceKey !== signedPlan.nonceKey) return false;
  state.head += 1;
  grant.used += 1;
  return true;
}

function stateWithTwoGrants() {
  const state = { head: 4, grants: new Map() };
  registerGrant(state, { id: 'G1', principal: 'P', key: 'K', nonceKey: 1, revoked: false, used: 0 });
  registerGrant(state, { id: 'G2', principal: 'P', key: 'K', nonceKey: 2, revoked: false, used: 0 });
  return state;
}

test('member identity is assigned from declared order, never from its derived hash', () => {
  const selected = selectMembers([members[2], members[0], members[3], members[1]]);
  assert.deepEqual(selected.map(m => m.name), ['alpha', 'beta', 'gamma', 'delta']);
  assert.equal(groupBytes(selected), '0x00040001a10002b1b20001c10001d1');
});

test('legacy hash sorting changes its own ID preimage', () => {
  const sorted = legacyMembers(members);
  assert.notEqual(groupBytes(sorted), groupBytes(members));
  const before = ids(members), after = ids(sorted);
  assert.notDeepEqual(after, before);
});

test('missing or duplicate declared members cannot silently change local reference indexes', () => {
  assert.throws(() => selectMembers(members.slice(1)), /inventory mismatch/);
  assert.throws(() => selectMembers([members[0], members[0], members[2], members[3]]), /inventory mismatch/);
});

test('substituting a different compatible grant must not consume head or budget', () => {
  const state = stateWithTwoGrants(), before = structuredClone(state);
  assert.equal(writeWithGrant(state, { principal: 'P', key: 'K', nonceKey: 1 }, 'G2'), false);
  assert.deepEqual(state, before);
});

test('revocation cannot reroute an existing signature through another grant', () => {
  const state = stateWithTwoGrants();
  state.grants.get('G1').revoked = true;
  const before = structuredClone(state);
  assert.equal(writeWithGrant(state, { principal: 'P', key: 'K', nonceKey: 1 }, 'G2'), false);
  assert.deepEqual(state, before);
});

test('a session lane cannot be reassigned, including after revocation', () => {
  const state = stateWithTwoGrants();
  state.grants.get('G1').revoked = true;
  const before = structuredClone(state);
  assert.equal(registerGrant(state, { id: 'G3', principal: 'P', key: 'K', nonceKey: 1, revoked: false, used: 0 }), false);
  assert.deepEqual(state, before);
});

test('the correctly linked live grant still permits the modeled write', () => {
  const state = stateWithTwoGrants();
  assert.equal(writeWithGrant(state, { principal: 'P', key: 'K', nonceKey: 1 }, 'G1'), true);
  assert.equal(state.head, 5);
  assert.equal(state.grants.get('G1').used, 1);
  assert.equal(state.grants.get('G2').used, 0);
});

test('the direct EOA lane is unavailable for session-grant registration', () => {
  const state = stateWithTwoGrants(), before = structuredClone(state);
  assert.equal(registerGrant(state, { id: 'G0', principal: 'P', key: 'K', nonceKey: 0, revoked: false, used: 0 }), false);
  assert.deepEqual(state, before);
});
