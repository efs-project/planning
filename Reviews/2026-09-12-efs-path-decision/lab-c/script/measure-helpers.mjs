const cleanHex = (value, label) => {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]*$/.test(value) || value.length % 2 !== 0) {
    throw new Error(`${label} must be even-length hex`);
  }
  return value.toLowerCase();
};

const replaceBytes = (hex, start, length, replacement) => {
  const at = 2 + start * 2;
  return hex.slice(0, at) + replacement.slice(2) + hex.slice(at + length * 2);
};

export function readLeftUint(field, width) {
  const hex = cleanHex(field, "field");
  if (hex.length !== 66) throw new Error(`expected 32-byte field, got ${(hex.length - 2) / 2}`);
  if (!Number.isInteger(width) || width < 1 || width > 32) throw new Error(`unsupported uint width ${width}`);
  return BigInt(`0x${hex.slice(2, 2 + width * 2)}`);
}

export function verifyPatchedRuntime({ artifactRuntime, actualRuntime, immutableReferences, expected }) {
  const artifact = cleanHex(artifactRuntime, "artifact runtime");
  const actual = cleanHex(actualRuntime, "actual runtime");
  if (artifact.length !== actual.length) throw new Error("runtime length mismatch");
  const actualIds = Object.keys(immutableReferences ?? {}).sort();
  const expectedIds = Object.keys(expected ?? {}).sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    throw new Error(`immutable id set mismatch: artifact=${actualIds.join(",")} expected=${expectedIds.join(",")}`);
  }

  const ranges = [];
  for (const id of actualIds) {
    const spec = expected[id];
    const value = cleanHex(spec.value, `immutable ${spec.name}`);
    if (value.length !== 66) throw new Error(`immutable ${spec.name} must be 32 bytes`);
    const refs = immutableReferences[id];
    if (!Array.isArray(refs) || refs.length === 0) throw new Error(`immutable ${spec.name} has no references`);
    for (const ref of refs) {
      if (ref.length !== 32) throw new Error(`immutable ${spec.name} must be 32 bytes`);
      if (!Number.isInteger(ref.start) || ref.start < 0 || ref.start + ref.length > (artifact.length - 2) / 2) {
        throw new Error(`immutable ${spec.name} range out of bounds`);
      }
      ranges.push({ id, name: spec.name, start: ref.start, length: ref.length, value });
    }
  }
  ranges.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i].start < ranges[i - 1].start + ranges[i - 1].length) throw new Error("overlapping immutable ranges");
  }

  let patched = artifact;
  for (const range of ranges) patched = replaceBytes(patched, range.start, range.length, range.value);
  for (let byte = 0; byte < (actual.length - 2) / 2; byte++) {
    const inImmutable = ranges.some((range) => byte >= range.start && byte < range.start + range.length);
    const at = 2 + byte * 2;
    if (actual.slice(at, at + 2) !== patched.slice(at, at + 2)) {
      if (inImmutable) {
        const range = ranges.find((candidate) => byte >= candidate.start && byte < candidate.start + candidate.length);
        throw new Error(`immutable ${range.name} mismatch at byte ${byte}`);
      }
      throw new Error(`non-immutable runtime byte mismatch at byte ${byte}`);
    }
  }
  return { patchedRuntime: patched, ranges };
}
