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

// ---------------------------------------------------------------------------------------------------------------
// Sealed paid point/list slice helpers (pure; unit-tested in measure-helpers.test.mjs). No ethers, no chain, no
// module-scope state: every function takes retained observations and returns or throws. The runner records
// observations (input evidence grade RPC_OBSERVED); the expectation, arm-input and basis seals belong to the
// independent run controller, never to these helpers.
// ---------------------------------------------------------------------------------------------------------------

// ---- cell selection / run flags -------------------------------------------------------------------------------
export const DEFAULT_CELLS = ["typed-joined", "c32-native-producer-framed", "c32-signed-framed", "record-fresh-isolated", "record-reused-isolated"];
export const OPTIONAL_CELLS = ["typed-joined/a1-without-placement"]; // paired control: selected only by its exact name
export const ANVIL_ONLY_CELLS = ["typed-joined", "typed-joined/a1-without-placement"]; // they seal, revert and set block timestamps

export function parseRunArgs(argv) {
  const out = { anvil: false, cells: null };
  const list = (raw, flag) => {
    const cells = String(raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (cells.length === 0) throw new Error(`${flag} requires a comma-separated list of cell keys`);
    return cells;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--anvil") out.anvil = true;
    else if (arg === "--cells") { if (i + 1 >= argv.length) throw new Error("--cells requires a comma-separated list of cell keys"); out.cells = list(argv[++i], "--cells"); }
    else if (arg.startsWith("--cells=")) out.cells = list(arg.slice("--cells=".length), "--cells");
    else throw new Error(`unknown argument ${arg}`);
  }
  return out;
}

export function selectCells(requested, { defaults, optional }) {
  if (requested === null || requested === undefined) return [...defaults];
  const known = [...defaults, ...optional];
  const seen = new Set();
  for (const key of requested) {
    if (!known.includes(key)) throw new Error(`unknown cell ${key} (known: ${known.join(", ")})`);
    if (seen.has(key)) throw new Error(`duplicate cell ${key}`);
    seen.add(key);
  }
  const selected = known.filter((key) => seen.has(key));
  if (selected.length === 0) throw new Error("no cell selected");
  return selected;
}

export function assertAnvilOnlyCells(selected, anvil, anvilOnly = ANVIL_ONLY_CELLS) {
  const blocked = selected.filter((key) => anvilOnly.includes(key));
  if (blocked.length && !anvil) {
    throw new Error(`cell(s) ${blocked.join(", ")} run only on an owned --anvil chain (they evm_snapshot, evm_revert and evm_setNextBlockTimestamp); refusing before any chain call: pass --anvil or deselect them with --cells`);
  }
  return blocked;
}

// With any sealing cell selected the chain must identify as Anvil (web3_clientVersion "anvil/..."), checked before any STATE call.
export function assertAnvilClient(clientVersion, blockedCells) {
  if (blockedCells.length && !/^anvil\//.test(String(clientVersion ?? ""))) {
    throw new Error(`cell(s) ${blockedCells.join(", ")} require an owned Anvil chain; web3_clientVersion is ${clientVersion}: refusing before any state call`);
  }
  return clientVersion;
}

// The paid caller must be unrelated to every fixture role: not the deployer, not AUTHOR_A's wallet, not the producer or any lab contract.
export function assertUnrelatedCaller(caller, related) {
  const lower = (v) => String(v).toLowerCase();
  if (!caller || !/^0x[0-9a-fA-F]{40}$/.test(String(caller))) throw new Error(`paid caller ${caller} is not an address`);
  for (const [role, address] of Object.entries(related)) {
    if (address && lower(address) === lower(caller)) throw new Error(`paid caller ${caller} is not unrelated: it is the ${role}`);
  }
  return true;
}

// ---- MUD packed static-region decoders (runner-side mirror of README "Fixture coordinates"; candidate-side, labelled) ----
export function wordAt(hex, offset) {
  const clean = cleanHex(hex, "static region");
  const length = (clean.length - 2) / 2;
  if (!Number.isInteger(offset) || offset < 0 || offset + 32 > length) throw new Error(`short reply: ${length} bytes, word at ${offset} needs ${offset + 32}`);
  return `0x${clean.slice(2 + offset * 2, 2 + (offset + 32) * 2)}`;
}

export function uintAt(hex, offset, width) {
  const clean = cleanHex(hex, "static region");
  const length = (clean.length - 2) / 2;
  if (!Number.isInteger(width) || width < 1 || width > 32) throw new Error(`unsupported uint width ${width}`);
  if (!Number.isInteger(offset) || offset < 0 || offset + width > length) throw new Error(`short reply: ${length} bytes, uint${width * 8} at ${offset} needs ${offset + width}`);
  return BigInt(`0x${clean.slice(2 + offset * 2, 2 + (offset + width) * 2)}`);
}

const exactLength = (hex, bytes, table) => {
  const clean = cleanHex(hex, `${table} static region`);
  if ((clean.length - 2) / 2 !== bytes) throw new Error(`${table} static region must be ${bytes} bytes, got ${(clean.length - 2) / 2}`);
  return clean;
};

export function decodeRecordStatic(hex) {
  const s = exactLength(hex, 40, "Records");
  return { typeId: wordAt(s, 0), firstAdmission: uintAt(s, 32, 8) };
}

export function decodeBindingStatic(hex) {
  const s = exactLength(hex, 44, "Bindings");
  return { target: wordAt(s, 0), revision: uintAt(s, 32, 4), admission: uintAt(s, 36, 8) };
}

export function decodeAdmissionStatic(hex) {
  const s = exactLength(hex, 262, "Admissions");
  return {
    publicationId: wordAt(s, 0), kind: uintAt(s, 32, 1), typeId: wordAt(s, 33), digestKind: uintAt(s, 65, 1), digest: wordAt(s, 66),
    purpose: wordAt(s, 98), subject: wordAt(s, 130), role: wordAt(s, 162), target: wordAt(s, 194), expectedRevision: uintAt(s, 226, 4), salt: wordAt(s, 230),
  };
}

export function decodeEvidenceStatic(hex) {
  const s = exactLength(hex, 325, "Evidence");
  return {
    author: wordAt(s, 0), proofKind: uintAt(s, 32, 1), r: wordAt(s, 33), s: wordAt(s, 65), v: uintAt(s, 97, 1), nonce: uintAt(s, 98, 8), deadline: uintAt(s, 106, 8),
    acceptanceProfile: wordAt(s, 114), indexObligations: wordAt(s, 146), actionsHash: wordAt(s, 178), firstAdmission: uintAt(s, 210, 8), leafCount: uintAt(s, 218, 2), basis: uintAt(s, 220, 8),
    realmId: wordAt(s, 228), coreCodeCommitment: wordAt(s, 260), importOf: wordAt(s, 292), sourceGrade: uintAt(s, 324, 1),
  };
}

// C proof kinds (EfsTypes PROOF_NATIVE = 1, PROOF_EOA_SIG = 2) -> experiment-local evidence categories; an unknown kind throws (never a default).
export function evidenceCategoryOf(proofKind, effect = false) {
  const categories = { 1: "CONTRACT_ORIGINATED_PUBLICATION", 2: "EOA_SIGNED_PUBLICATION" };
  const category = categories[String(proofKind)];
  if (!category) throw new Error(`unknown proof kind ${proofKind}: no evidence category (1 = contract-originated/native, 2 = EOA-signed)`);
  return effect ? `${category}_EFFECT` : category;
}

// ---- observation comparison / abstract row -------------------------------------------------------------------
// The MeasurementConsumer's PaidObserved event / return tuple, field by field (C-native fields; physical ids and ordinals).
export const SELECTION_FIELDS = ["basisAdmission", "indexGeneration", "rulesEpoch", "coreCodeCommitment", "realmId", "lensHash", "subject", "selectedHead", "selectedRevision", "selectedAdmission", "selectedBindingKey", "selectedPublication", "selectedAuthor", "selectedProofKind", "selectedSourceGrade", "quoteFirstAdmission", "pairId", "itemA", "itemB", "mantissa", "scale", "observedAt", "note"];
export const PLACEMENT_FIELDS = ["folder", "name", "target", "actor", "revision", "admission", "bindingKey", "publicationId", "proofKind", "sourceGrade", "basisAdmission", "pageStatus", "rawTotal", "scanned", "hydrated", "selected", "endPosition", "ended", "coverageStatus", "coverageThrough"];
// The arm-neutral "Common comparison row" (sdk-fixture appendix): every field required, none defaulted.
export const ABSTRACT_FIELDS = ["operation", "lens", "realm", "execution", "profile", "observationBasis", "executionBasis", "queryCoordinate", "presence", "support", "admission", "selection", "selectedFile", "selectedHead", "selectedRevision", "selectedPhysical", "selectedAuthor", "selectedAuthorEvidenceCategory", "placementCoordinate", "placementProvenance", "quoteCheck", "pairCheck", "itemChecks", "candidateCoverage", "pageCoverage", "rawEvidence", "paidExecution"];

const norm = (v) => (typeof v === "boolean" ? String(v) : String(v).toLowerCase());

export function compareObservation(observed, expected) {
  const fields = {};
  let ok = !!observed;
  for (const [k, v] of Object.entries(expected)) {
    const equal = !!observed && norm(observed[k]) === norm(v);
    fields[k] = { expected: norm(v), actual: observed ? norm(observed[k]) : null, equal };
    if (!equal) ok = false;
  }
  return { ok, fields };
}

const ZERO_PLACEMENT = Object.fromEntries(PLACEMENT_FIELDS.map((k) => [k,
  k === "ended" ? false : /^(folder|name|target|actor|bindingKey|publicationId)$/.test(k) ? `0x${"00".repeat(32)}` : 0,
]));

function compareCompleteObservation(observed, reference, names) {
  const fields = {};
  for (const k of names) {
    const expected = reference?.[k] == null ? null : norm(reference[k]);
    const actual = observed?.[k] == null ? null : norm(observed[k]);
    fields[k] = { expected, actual, equal: expected !== null && actual !== null && expected === actual };
  }
  return { ok: Object.values(fields).every((field) => field.equal), fields };
}

// Both decoded tuples must independently reproduce their commitments and agree on EVERY field, including physical
// witnesses the runner does not pin (hydrated). The runner's expectations remain a separate subset check.
// paidPoint returns no Placement: its commitment uses the canonical zero tuple, never placement copied from the log.
export function paidObservationMatch({ logCount, fromLog, fromReplay, operation, expectedKind, expectedSelection, expectedPlacement, recompute }) {
  const lower = (v) => String(v).toLowerCase();
  const logPresent = logCount === 1 && !!fromLog;
  const kindOk = logPresent && lower(fromLog.kind) === lower(expectedKind);
  let recomputedCommitment = null;
  let recomputeError = null;
  if (logPresent) {
    try { recomputedCommitment = recompute(fromLog.kind, fromLog.selection, fromLog.placement); } catch (error) { recomputeError = String(error?.message ?? error); }
  }
  const commitmentRecomputedOk = logPresent && !!recomputedCommitment && lower(recomputedCommitment) === lower(fromLog.commitment);
  const selectionFromLog = compareObservation(fromLog ? fromLog.selection : null, expectedSelection);
  const placementFromLog = compareObservation(fromLog ? fromLog.placement : null, expectedPlacement);
  const replayDecoded = !!fromReplay && !fromReplay.error;
  const replayPlacement = operation === "PAID_POINT" ? ZERO_PLACEMENT : fromReplay?.placement;
  const replayPlacementOk = operation === "PAID_POINT"
    ? fromReplay?.placement == null || compareCompleteObservation(fromReplay.placement, ZERO_PLACEMENT, PLACEMENT_FIELDS).ok
    : fromReplay?.placement != null;
  const replayExpectationOk = replayDecoded && replayPlacementOk && compareObservation(fromReplay.selection, expectedSelection).ok && compareObservation(replayPlacement, expectedPlacement).ok;
  const selectionLogReplay = compareCompleteObservation(fromReplay?.selection, fromLog?.selection, SELECTION_FIELDS);
  const placementLogReplay = compareCompleteObservation(replayPlacement, fromLog?.placement, PLACEMENT_FIELDS);
  let replayRecomputedCommitment = null;
  let replayRecomputeError = null;
  if (replayDecoded && replayPlacementOk) {
    try { replayRecomputedCommitment = recompute(expectedKind, fromReplay.selection, replayPlacement); } catch (error) { replayRecomputeError = String(error?.message ?? error); }
  }
  const replayCommitmentRecomputedOk = replayDecoded && !!replayRecomputedCommitment && lower(replayRecomputedCommitment) === lower(fromReplay.commitment);
  const replayOk = replayExpectationOk && replayCommitmentRecomputedOk && selectionLogReplay.ok && placementLogReplay.ok;
  const commitmentsAgree = logPresent && replayDecoded && lower(fromLog.commitment) === lower(fromReplay.commitment);
  const match = logPresent && kindOk && commitmentRecomputedOk && selectionFromLog.ok && placementFromLog.ok && replayOk && commitmentsAgree;
  const reason = match ? null
    : !logPresent ? `no single PaidObserved log (logCount ${logCount})`
    : !kindOk ? `log kind ${fromLog.kind} != expected ${expectedKind} for ${operation}`
    : !commitmentRecomputedOk ? `recomputed commitment ${recomputedCommitment} != logged ${fromLog.commitment}${recomputeError ? ` (${recomputeError})` : ""}`
    : !replayDecoded ? "the eth_call replay did not decode"
    : !commitmentsAgree ? "the replay commitment differs from the log commitment"
    : !replayExpectationOk ? "the replay observation differs from the runner expectation"
    : !selectionFromLog.ok || !placementFromLog.ok ? "the log observation differs from the runner expectation"
    : !replayCommitmentRecomputedOk ? `recomputed replay commitment ${replayRecomputedCommitment} != returned ${fromReplay.commitment}${replayRecomputeError ? ` (${replayRecomputeError})` : ""}`
    : "the complete log and replay observations differ or have missing fields";
  return { logCount, kindOk, expectedKind, recomputedCommitment, recomputeError, commitmentRecomputedOk, selectionFromLog, placementFromLog, replayRecomputedCommitment, replayRecomputeError, replayCommitmentRecomputedOk, selectionLogReplay, placementLogReplay, replayOk, commitmentsAgree, match, reason };
}

// Build one abstract comparison row from retained observations only. A missing or unknown field throws, so an absent
// observation can never read as a passing row; selectedRevision must be the fixture LABEL (A2 / B1), never an ordinal;
// a PAID_POINT row must state that it charged no directory lookup; a PAID_LIST page that is not COMPLETE is not a pass.
export function abstractRow(fields) {
  const missing = ABSTRACT_FIELDS.filter((k) => fields[k] === undefined || fields[k] === null);
  if (missing.length) throw new Error(`abstractResult: missing field(s) ${missing.join(", ")}`);
  const extra = Object.keys(fields).filter((k) => !ABSTRACT_FIELDS.includes(k));
  if (extra.length) throw new Error(`abstractResult: unknown field(s) ${extra.join(", ")}`);
  if (!["PAID_POINT", "PAID_LIST"].includes(fields.operation)) throw new Error(`abstractResult: operation ${fields.operation} is not PAID_POINT | PAID_LIST`);
  if (!["LENS_A_FIRST", "LENS_B_FIRST"].includes(fields.lens)) throw new Error(`abstractResult: lens ${fields.lens} is not LENS_A_FIRST | LENS_B_FIRST`);
  const selfCheck = fields.rawEvidence && fields.rawEvidence.selfCheck;
  if (!selfCheck || typeof selfCheck.match !== "boolean") throw new Error("abstractResult: rawEvidence.selfCheck.match (boolean) is required");
  const isLabel = typeof fields.selectedRevision === "string" && /^[A-Z][0-9]$/.test(fields.selectedRevision);
  if (!isLabel && fields.selectedRevision !== "UNKNOWN") throw new Error(`abstractResult: selectedRevision ${fields.selectedRevision} must be the fixture label (A2 / B1) or UNKNOWN, not an ordinal`);
  if (fields.operation === "PAID_POINT" && fields.placementCoordinate.lookedUpByThisRow !== false) throw new Error("abstractResult: a PAID_POINT row must not charge a directory lookup");
  if (fields.operation === "PAID_LIST" && !["COMPLETE", "UNKNOWN"].includes(fields.pageCoverage.status)) throw new Error(`abstractResult: a PAID_LIST row with pageCoverage ${fields.pageCoverage.status} is not a pass`);
  const outcomes = ["presence", "support", "admission", "selection"].map((k) => fields[k].outcome);
  if (selfCheck.match) {
    if (outcomes.includes("UNKNOWN") || !isLabel || fields.candidateCoverage.status !== "COMPLETE") throw new Error("abstractResult: a passing self-check must carry the established outcomes, labels and coverage");
  } else if (outcomes.some((o) => o !== "UNKNOWN") || isLabel || fields.selectedHead !== "UNKNOWN" || fields.selectedFile !== "UNKNOWN" || fields.candidateCoverage.status !== "UNKNOWN" || (fields.operation === "PAID_LIST" && fields.pageCoverage.status !== "UNKNOWN")) {
    throw new Error("abstractResult: a failed self-check may not carry a derived success claim");
  }
  const row = { inputEvidenceGrade: "RPC_OBSERVED", standing: "candidate-side observations retained by this runner, never expected answers; the expectation, arm-input and basis seals are authored and hashed by the independent run controller" };
  for (const k of ABSTRACT_FIELDS) row[k] = fields[k];
  return row;
}

// Seal/revert ordering of the paid rows. `events` is the ordered ledger the cell records:
//   {kind:'seal', block, hash, timestamp} | {kind:'revert', block, hash, nextTimestamp, pool:{pending, queued}} |
//   {kind:'tx', label, block, parentHash, timestamp, txIndex, txCount, onlyTx} | {kind:'retained', label}
// Each paid row must be the FIRST and ONLY transaction after a revert whose observed head IS the seal, mined at
// seal.block + 1 on seal.hash at timestamp seal.timestamp + 1, and retained before the next revert. Any violation throws.
export function checkPaidRowOrdering(events) {
  const seal = events[0];
  if (!seal || seal.kind !== "seal") throw new Error("paid-row ordering: the first event must be the seal");
  if (typeof seal.timestamp !== "number") throw new Error("paid-row ordering: the seal carries no timestamp");
  const expectedTimestamp = seal.timestamp + 1;
  const rows = [];
  let open = null;
  let armed = false;
  for (const ev of events.slice(1)) {
    if (ev.kind === "seal") throw new Error("paid-row ordering: a second seal");
    if (ev.kind === "revert") {
      if (open) throw new Error(`paid-row ordering: revert before row ${open.label} was retained`);
      if (ev.block !== seal.block || ev.hash !== seal.hash) throw new Error(`paid-row ordering: after the revert the head is ${ev.block} ${ev.hash}, not the seal ${seal.block} ${seal.hash}`);
      if (ev.nextTimestamp !== expectedTimestamp) throw new Error(`paid-row ordering: next block timestamp set to ${ev.nextTimestamp}, expected ${expectedTimestamp}`);
      if (!ev.pool || ev.pool.pending === undefined || ev.pool.queued === undefined) throw new Error("paid-row ordering: the revert carries no txpool_status proof");
      if (Number(ev.pool.pending) !== 0 || Number(ev.pool.queued) !== 0) throw new Error(`paid-row ordering: the transaction pool is not empty after the revert (pending ${Number(ev.pool.pending)}, queued ${Number(ev.pool.queued)})`);
      armed = true;
    } else if (ev.kind === "tx") {
      if (!armed) throw new Error(`paid-row ordering: row ${ev.label} is not the first transaction after a revert to the seal`);
      if (ev.block !== seal.block + 1 || ev.parentHash !== seal.hash) throw new Error(`paid-row ordering: row ${ev.label} mined at ${ev.block} on ${ev.parentHash}, expected ${seal.block + 1} on ${seal.hash}`);
      if (ev.timestamp !== expectedTimestamp) throw new Error(`paid-row ordering: row ${ev.label} executed at timestamp ${ev.timestamp}, expected ${expectedTimestamp}`);
      if (ev.txIndex !== 0) throw new Error(`paid-row ordering: row ${ev.label} has transactionIndex ${ev.txIndex}, not 0`);
      if (ev.txCount !== 1 || ev.onlyTx !== true) throw new Error(`paid-row ordering: row ${ev.label} is not the only transaction in its block (${ev.txCount} transactions)`);
      armed = false;
      open = { label: ev.label, block: ev.block, timestamp: ev.timestamp, txIndex: ev.txIndex, txCount: ev.txCount };
    } else if (ev.kind === "retained") {
      if (!open || open.label !== ev.label) throw new Error(`paid-row ordering: retained ${ev.label} without that row open`);
      rows.push({ ...open, retained: true });
      open = null;
    } else {
      throw new Error(`paid-row ordering: unknown event kind ${ev.kind}`);
    }
  }
  if (open) throw new Error(`paid-row ordering: row ${open.label} was never retained`);
  if (rows.length === 0) throw new Error("paid-row ordering: no paid row");
  const timestamps = new Set(rows.map((r) => r.timestamp));
  if (timestamps.size !== 1) throw new Error(`paid-row ordering: the paid rows executed at different timestamps ${[...timestamps].join(", ")}`);
  return rows;
}

// Point/list agreement from two retained PaidObserved selections (same lens). A missing selection is reported as unknown, never as agreement.
export function checkAgreement(pointSelection, listSelection, ignore = ["lensHash"]) {
  if (!pointSelection || !listSelection) return { unknown: "a PaidObserved selection is missing or its self-check failed", consequence: "no agreement claim" };
  const differingFields = SELECTION_FIELDS.filter((k) => !ignore.includes(k) && norm(pointSelection[k]) !== norm(listSelection[k]));
  return { identicalSelection: differingFields.length === 0, differingFields, selectedHead: pointSelection.selectedHead, selectedAuthor: pointSelection.selectedAuthor };
}

// Derive one abstract comparison row from a paid-observation check, its replay observation and the row's retained context.
// PURE. No field derived from the PaidObserved log may claim success unless the check passed entirely (one log, decodable
// replay, replay commitment == log commitment, every pinned field equal to the runner's candidate-side expectation).
// Otherwise every derived label, outcome and coverage is UNKNOWN with the reason, while the raw observations stay retained;
// only fields a SEPARATE retained observation establishes (seal replies, receipt/block) keep values, each naming its source.
export function deriveAbstractResult({ check, replay, evidenceFor: ev }) {
  const lower = (v) => String(v).toLowerCase();
  const isList = ev.operation === "PAID_LIST";
  const logPresent = !!check && check.logCount === 1 && !!check.fromLog;
  const replayDecoded = !!check && !!check.fromReplay && !check.fromReplay.error;
  const ok = logPresent && replayDecoded && check.commitmentsAgree === true && check.replayOk === true && check.match === true;
  const reason = ok ? null
    : check && typeof check.reason === "string" ? check.reason
    : !logPresent ? `no single PaidObserved log in the receipt (logCount ${check ? check.logCount : "unknown"})`
    : !replayDecoded ? "the eth_call replay at the receipt block did not decode"
    : check.commitmentsAgree !== true ? "the replay commitment differs from the log commitment"
    : check.replayOk !== true ? "the replay observation differs from the runner expectation"
    : "the log observation differs from the runner expectation";
  const consequence = "row is not a pass; the mismatch fails the run; raw observations retained";
  const unknown = () => ({ outcome: "UNKNOWN", reason, consequence });
  const s = ok ? check.fromLog.selection : null;
  const p = ok && isList ? check.fromLog.placement : null;
  const labelOf = (map, key, what) => { const v = map[lower(key)] ?? map[key]; if (!v) throw new Error(`abstractResult: no fixture label for ${what} ${key}`); return v; };
  const [headLabel, revisionLabel] = ok ? labelOf(ev.headLabels, s.selectedHead, "selected head") : ["UNKNOWN", "UNKNOWN"];
  const [authorLabel, authorKind] = ok ? labelOf(ev.authorLabels, s.selectedAuthor, "selected author") : ["UNKNOWN", "UNKNOWN"];
  const sealPl = ev.placementAtSeal; // a SEPARATE retained observation (seal raw replies), independent of this row's log
  // placement labels are DERIVED from the observed actor / publication through the fixture maps (never constants); an unknown value throws
  const placementLabels = (actor, publicationId) => ({ sourceStep: labelOf(ev.publicationLabels, publicationId, "placement publication"), actor: labelOf(ev.authorLabels, actor, "placement actor")[0], labelledBy: "authorLabels[actor] / publicationLabels[publicationId] of the fixture map" });
  const fromSeal = (why) => ({ ...placementLabels(sealPl.author, sealPl.publicationId), actorPrincipal: sealPl.author, evidenceCategory: evidenceCategoryOf(sealPl.proofKind, true), publicationId: sealPl.publicationId, admission: sealPl.admission, revision: sealPl.revision, bindingKey: sealPl.bindingKey, basis: ev.sealBasis.admissionFrontier, independentOfContentSelection: true, establishedBy: why });
  const outcome = (name, how) => (ok ? { outcome: name, establishedBy: `${how} AND a passing self-check (rawEvidence.selfCheck)` } : unknown());
  const txRef = `operations[cell typed-joined, operation ${ev.row.operation}]`;
  return abstractRow({
    operation: ev.operation, lens: ev.lens,
    realm: { chainId: ev.chainId, realmId: ev.sealBasis.realmId, realmOrigin: ev.sealBasis.realmOrigin, ledger: ev.addrs.ledger, coreCodeCommitment: ev.sealBasis.coreCodeCommitment, establishedBy: "raw replies at the seal block (observations typed-joined:seal:*), a separate observation" },
    execution: { consumer: ev.addrs.consumer, consumerCodeCommitment: ev.consumerCodehash, lensReader: ev.addrs.reader, indexModule: ev.addrs.index, importLib: ev.addrs.importLib, ledgerCodeCommitment: ev.ledgerCodehash, deploymentEvidence: "artifacts[] of this run (runtime-verified deployments); the sealed run uses the independently retained deployment facts (appendix pin 3)" },
    profile: ev.profile,
    observationBasis: { admissionFrontier: ev.sealBasis.admissionFrontier, indexGeneration: ev.sealBasis.indexGeneration, rulesEpoch: ev.sealBasis.rulesEpoch, coreCodeCommitment: ev.sealBasis.coreCodeCommitment, sealBlock: ev.seal.number, sealBlockHash: ev.seal.hash, sealTimestamp: ev.seal.timestamp, consumerObserved: ok ? { basisAdmission: s.basisAdmission, indexGeneration: s.indexGeneration, rulesEpoch: s.rulesEpoch, coreCodeCommitment: s.coreCodeCommitment, realmId: s.realmId } : unknown(), establishedBy: "the seal raw replies (a separate observation); consumerObserved is the log's view of the same basis (pinned by BasisMismatch); never an unqualified latest" },
    executionBasis: { block: ev.row.block, blockHash: ev.row.blockHash, parentHash: ev.executed.parentHash, timestamp: ev.executed.timestamp, transaction: ev.row.hash, txIndex: ev.executed.txIndex, txCount: ev.executed.txCount, establishedBy: "the receipt and eth_getBlockByNumber(block, false) retained with the row; separate from the observation basis; seal + 1 with the matched parent hash and timestamp across the four rows" },
    queryCoordinate: isList
      ? { labels: { parent: "/swaps", name: "eth-usdc", page: `one bounded page, budget ${ev.budget}, fresh cursor`, endCondition: "status COMPLETE and the scan consumed every raw scope entry (next.position == rawTotal == scanned)" }, physical: { folder: ev.coordinates.folder, name: ev.coordinates.name, subject: ev.coordinates.subject }, exactBytes: `${txRef}.exact.transaction.input` }
      : { labels: { file: "FILE_QUOTE" }, physical: { subject: ev.coordinates.subject }, exactBytes: `${txRef}.exact.transaction.input` },
    presence: outcome("FOUND", "LensReader.resolveAt status P_FOUND at the pinned basis inside the consumer (NotSelected otherwise)"),
    support: outcome("SUPPORTED", "exact Type ids and canonical abi.encode(bytes32[] refs, bytes payload) frames of the Quote, the Pair and both Items, each admitted at or before the basis, inside the consumer (WrongType / MalformedFrame / RecordAbsent / NotAtBasis otherwise)"),
    admission: outcome("ADMITTED", "the head's admission is a BIND of exactly that target inside its publication's admission range, whose retained Evidence names the selected author under the expected proof category and Realm/code commitments (AdmissionShape / EvidenceBounds / AuthorMismatch / ProofCategory / ProofShape / RealmMismatch otherwise)"),
    selection: outcome("SELECTED", "ordered-lens selection (the first principal with a HEAD binding decides) equal to the expected author, head id and revision, with the sealed Quote fields equal (SelectionMismatch / ClosureMismatch otherwise); a status-1 receipt cannot fill this field"),
    selectedFile: ok ? "FILE_QUOTE" : "UNKNOWN", selectedHead: headLabel, selectedRevision: revisionLabel,
    selectedPhysical: ok ? { subject: s.subject, head: s.selectedHead, revisionOrdinal: s.selectedRevision, admission: s.selectedAdmission, bindingKey: s.selectedBindingKey, publicationId: s.selectedPublication, quoteFirstAdmission: s.quoteFirstAdmission, standing: "physical ids/ordinals retained separately from the labels; the revision ordinal is arm-local, not a cross-arm ordinal" } : unknown(),
    selectedAuthor: ok ? { label: authorLabel, principal: s.selectedAuthor, principalKind: authorKind } : unknown(),
    selectedAuthorEvidenceCategory: ok ? evidenceCategoryOf(s.selectedProofKind) : "UNKNOWN",
    placementCoordinate: isList
      ? { lookedUpByThisRow: true, parent: "/swaps", name: "eth-usdc", physical: ok ? { folder: p.folder, name: p.name, bindingKey: p.bindingKey } : unknown() }
      : { lookedUpByThisRow: false, parent: "/swaps", name: "eth-usdc", physical: { folder: ev.coordinates.folder, name: ev.coordinates.name, bindingKey: ev.coordinates.placementBindingKey }, standing: "not charged to the point transaction; retained and joined from the seal raw replies (observations typed-joined:seal:placement-*)" },
    placementProvenance: isList && ok
      ? { ...placementLabels(p.actor, p.publicationId), actorPrincipal: p.actor, evidenceCategory: evidenceCategoryOf(p.proofKind, true), publicationId: p.publicationId, admission: p.admission, revision: p.revision, bindingKey: p.bindingKey, basis: s.basisAdmission, independentOfContentSelection: true, establishedBy: "paid: MeasurementConsumer placement window + provenance checks (PlacementWindow / PlacementMismatch / ProofCategory / EvidenceBounds otherwise) AND a passing self-check" }
      : fromSeal(isList ? `this row's log failed its self-check (${reason}); these values are the SEPARATE seal raw replies (placementAtSeal.byLens.${ev.lens}), not this transaction` : `raw replies at the seal block: LensReader.resolveAt under ${ev.lens} (placementAtSeal.byLens.${ev.lens}) + Admissions + Evidence rows; not this transaction`),
    quoteCheck: ok ? { typeId: ev.types.QUOTE_T, head: s.selectedHead, firstAdmission: s.quoteFirstAdmission, refs: [s.pairId], mantissa: s.mantissa, scale: s.scale, observedAt: s.observedAt, noteCommitment: s.note, establishedBy: "exact Quote Type + canonical frame with exactly one reference + the sealed fixture fields (mantissa, scale, observedAt, note commitment) compared inside the consumer against the caller's inputs (WrongType / MalformedFrame / ClosureMismatch otherwise)" } : unknown(),
    pairCheck: ok ? { typeId: ev.types.PAIR_T, pairId: s.pairId, orderedRefs: [s.itemA, s.itemB], establishedBy: "exact Pair Type + canonical frame with exactly two ordered references equal to the expected Items (WrongType / ClosureMismatch otherwise)" } : unknown(),
    itemChecks: ok ? [{ label: "ITEM_ETH", typeId: ev.types.ITEM_T, id: s.itemA }, { label: "ITEM_USDC", typeId: ev.types.ITEM_T, id: s.itemB }] : [unknown()],
    candidateCoverage: { status: ok ? "COMPLETE" : "UNKNOWN", ...(ok ? {} : { reason, consequence }), universe: "HEAD bindings of the lens principals at (HEAD, FILE_QUOTE, role 0) at the observation basis; ordered-lens selection", lens: ev.lensArr, basis: ev.sealBasis.admissionFrontier, endCondition: `ordered lens of ${ev.lensArr.length} principals; the first principal with a HEAD binding decides (target -> FOUND, whiteout -> ABSENT_PROVEN masks lower principals, never fall-through), so every candidate up to the deciding principal is visited by construction of LensReader.resolveAt`, sameForPointAndList: true, standing: "point and list qualify the same candidate universe at the same basis; physical witnesses (hydrated reads, page bytes) may differ" },
    pageCoverage: isList
      ? (ok ? { status: "COMPLETE", rawTotal: p.rawTotal, scanned: p.scanned, hydrated: p.hydrated, selected: p.selected, endPosition: p.endPosition, ended: p.ended, coverageStatus: p.coverageStatus, coverageThrough: p.coverageThrough, rows: 1, standing: "fixture/profile-scoped coverage (IndexModule FAMILY_SCOPES COMPLETE through the basis + the scan consumed every raw scope entry), not authenticated global completeness; PARTIAL / UNKNOWN revert (PlacementWindow / IncompleteCoverage)" } : { status: "UNKNOWN", reason, consequence })
      : { status: "NOT_APPLICABLE", standing: "a File-keyed point read performs no directory lookup" },
    rawEvidence: { transaction: { operation: ev.row.operation, hash: ev.row.hash, calldata: `${txRef}.exact.transaction.input`, receiptLogs: `${txRef}.exact.receipt.logs`, blockTransactions: ev.executed.txHashes }, paidObservedLog: logPresent ? check.fromLog : null, replay: { rpcId: replay.rpcId, from: replay.from, blockTag: replay.blockTag, returnData: replay.returnData, error: replay.error }, selfCheck: { match: ok, ref: check ? check.label : null, reason, logCount: check ? check.logCount : null }, seal: { observations: ["typed-joined:seal:*", "typed-joined:seal:placement-*", "typed-joined:seal:no-b-placement-*"], slice: "slices['typed-joined'].seal / placementAtSeal / noBPlacement" }, bodiesAndIds: "slices['typed-joined'].fixtureMirror (candidate-side: exact bodies, ids, binding keys)" },
    paidExecution: { caller: ev.caller.address, callerDerivation: ev.caller.derivationPath, callerIndex: ev.caller.index, consumer: ev.addrs.consumer, targets: { ledger: ev.addrs.ledger, lensReader: ev.addrs.reader, indexModule: ev.addrs.index }, codeCommitments: { ledger: ev.sealBasis.coreCodeCommitment, consumer: ev.consumerCodehash }, transaction: ev.row.hash, receiptStatus: ev.row.status, gasUsed: ev.row.gas, returnData: { raw: replay.returnData, source: `eth_call replay at block ${replay.blockTag} (rpcId ${replay.rpcId})`, decoded: ok ? { commitment: check.fromReplay.commitment } : unknown() }, revertData: replay.error ? replay.error : null },
  });
}
