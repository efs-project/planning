// Throwaway finite-model evidence only: no Solidity, cursor-word, gas or
// state-integrity proof. Run: node reference/unique-prefix-model.mjs (Core cwd).
import assert from 'node:assert/strict';

let predicates = 0, pages = 0;
function reference(a, H, live, start, budget) {
  const end = a.filter(x => x <= H).length;
  assert.ok(start >= 0 && start <= end);
  let i = start, coverage = 0;
  while (i < end) {
    const selected = i++;
    coverage++;
    if (live[selected]) return { found: true, next: null, coverage };
    if (i === end) return { found: false, next: null, coverage };
    if (coverage === budget) return { found: false, next: i, coverage };
  }
  return { found: false, next: null, coverage };
}
function direct(a, H, live, start, budget) {
  const inRange = i => i < a.length && a[i] <= H;
  let i = start, coverage = 0;
  while (inRange(i)) {
    const selected = i++;
    coverage++;
    if (live[selected]) return { found: true, next: null, coverage };
    // This is an uncharged boundary inspection, NOT a sequential visit.
    // A specification must explicitly permit/account for this check; it is
    // not silently compatible with a literal ban on every prefetch.
    if (!inRange(i)) return { found: false, next: null, coverage };
    if (coverage === budget) return { found: false, next: i, coverage };
  }
  return { found: false, next: null, coverage };
}

for (let mask = 0; mask < 256; mask++) {
  const a = Array.from({ length: 8 }, (_, i) => BigInt(i + 1))
    .filter((_, i) => mask & (1 << i));
  for (let h = 0n; h <= 9n; h++) {
    const end = a.filter(x => x <= h).length;
    for (let i = 0; i <= a.length; i++) {
      assert.equal(i < end, i < a.length && a[i] <= h);
      predicates++;
    }
    for (let life = 0; life < (1 << a.length); life++) {
      const live = a.map((_, i) => Boolean(life & (1 << i)));
      for (let start = 0; start <= end; start++) {
        for (let budget = 1; budget <= 5; budget++) {
          assert.deepEqual(direct(a, h, live, start, budget),
            reference(a, h, live, start, budget));
          pages++;
        }
      }
    }
  }
}

// Same relation near the physical width boundary, without Number narrowing.
const guard = (1n << 48n) - 1n;
const wide = [1n, (1n << 32n), guard - 2n, guard - 1n];
for (const h of [0n, 1n, (1n << 32n) - 1n, 1n << 32n, guard - 2n, guard - 1n]) {
  const end = wide.filter(x => x <= h).length;
  for (let i = 0; i <= wide.length; i++) {
    assert.equal(i < end, i < wide.length && wide[i] <= h);
    predicates++;
  }
}

// The ascending-state precondition is load-bearing, not an omitted guarantee.
const unordered = [2n, 1n];
assert.notEqual(0 < unordered.filter(x => x <= 1n).length, unordered[0] <= 1n);

console.log(JSON.stringify({ predicates, pages,
  result: 'finite ordered-list predicate and inner-stop equivalence',
  limitation: 'explicit uncharged boundary peek required; not a gas/storage/Core test' }));
