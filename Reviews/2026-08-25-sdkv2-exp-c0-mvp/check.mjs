import { readFileSync } from 'node:fs';

const fixture = JSON.parse(readFileSync(new URL('./fixture.json', import.meta.url)));
const fail = (message) => {
  throw new Error(message);
};

for (const testCase of fixture.cases) {
  for (const field of fixture.requiredResultFields) {
    if (!(field in testCase)) fail(`${testCase.id}: missing ResultV0.${field}`);
  }
  for (const axis of fixture.requiredProfileAxes) {
    if (!(axis in testCase.profile)) fail(`${testCase.id}: missing profile.${axis}`);
  }
  if (testCase.profile.effect === 'EFFECT_REJECTED') {
    fail(`${testCase.id}: EFFECT_REJECTED is not a C0 canonical-effect value`);
  }
  if (testCase.profile.effect === 'NOT_COMMITTED_PROVEN' && testCase.payload.receipt?.canonicalEffect !== 'pre-post-equal') {
    fail(`${testCase.id}: proved non-commit requires exact pre/post equality`);
  }
  const cursor = testCase.payload.page?.cursor;
  if (cursor) {
    for (const coordinate of fixture.requiredCursorCoordinates) {
      if (!(coordinate in cursor)) fail(`${testCase.id}: cursor missing ${coordinate}`);
    }
  }
}

console.log(`PASS ${fixture.cases.length} EXP-C0 SDK MVP preservation cases`);
