import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { AbiCoder, Interface, keccak256, toUtf8Bytes } = require('ethers');

const HEX = /^0x[0-9a-fA-F]*$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HASH = /^0x[0-9a-fA-F]{64}$/;
const ZERO_WORD = `0x${'00'.repeat(32)}`;
const STATUSES = new Set(['OBSERVED_MATCH', 'OBSERVED_MISMATCH', 'UNKNOWN', 'UNSUPPORTED']);

function outcome(status, reason, extra = {}) {
  if (!STATUSES.has(status)) throw new TypeError(`INVALID_RPC_OBSERVED_STATUS:${status}`);
  return { status, reason, ...extra };
}

function normalizeHex(value, label, bytes) {
  if (typeof value !== 'string' || !HEX.test(value) || value.length % 2 !== 0) {
    throw new TypeError(`MALFORMED_${label}: expected even-length 0x-prefixed hex`);
  }
  if (bytes !== undefined && value.length !== 2 + (bytes * 2)) {
    throw new TypeError(`MALFORMED_${label}: expected ${bytes} bytes`);
  }
  return value.toLowerCase();
}

function normalizeAddress(value) {
  if (typeof value !== 'string' || !ADDRESS.test(value)) return null;
  return value.toLowerCase();
}

function blockKey(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value);
  if (typeof value === 'bigint' && value >= 0n) return value.toString();
  if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)) return BigInt(value).toString();
  if (typeof value === 'string' && /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(value)) return BigInt(value).toString();
  return null;
}

function plain(value) {
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') return HEX.test(value) ? value.toLowerCase() : value;
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !/^\d+$/.test(key))
      .map(([key, child]) => [key, plain(child)]));
  }
  return value;
}

function exactFunctionData(iface, name, data) {
  const normalized = normalizeHex(data, 'CALLDATA');
  const decoded = iface.decodeFunctionData(name, normalized);
  const canonical = iface.encodeFunctionData(name, [...decoded]).toLowerCase();
  if (canonical !== normalized) throw new TypeError(`NON_CANONICAL_CALLDATA:${name}`);
  return decoded;
}

function exactFunctionResult(iface, name, data) {
  const normalized = normalizeHex(data, 'RAW_RETURN');
  const decoded = iface.decodeFunctionResult(name, normalized);
  const canonical = iface.encodeFunctionResult(name, [...decoded]).toLowerCase();
  if (canonical !== normalized) throw new TypeError(`NON_CANONICAL_RETURN:${name}`);
  return { decoded, normalized };
}

function pinsAreIndependent(options) {
  return options?.pinStanding === 'INDEPENDENT_SYNTHETIC_TEST_VECTOR';
}

function abiFragments(profile, surface) {
  const declarations = profile?.artifacts?.[surface]?.abi;
  if (!Array.isArray(declarations)) throw new TypeError(`MISSING_ABI_SURFACE:${surface}`);
  return declarations.map(({ selector: _selector, ...fragment }) => fragment);
}

function buildAbiIndex(profile) {
  const interfaces = {};
  const selectors = new Map();

  for (const [surface, artifact] of Object.entries(profile?.artifacts ?? {})) {
    const iface = new Interface(abiFragments(profile, surface));
    interfaces[surface] = iface;
    for (const declaration of artifact.abi) {
      const fragment = iface.getFunction(declaration.name);
      const derived = fragment.selector.toLowerCase();
      if (typeof declaration.selector !== 'string' || declaration.selector.toLowerCase() !== derived) {
        throw new TypeError(`ABI_SELECTOR_MISMATCH:${surface}.${declaration.name}`);
      }
      const existing = selectors.get(derived) ?? [];
      existing.push({ surface, name: declaration.name, selector: derived });
      selectors.set(derived, existing);
    }
  }
  return { interfaces, selectors };
}

export function recordIdFromRawBody(rawBody, expectations) {
  const body = normalizeHex(rawBody, 'RAW_BODY');
  const record = expectations?.recordIdentity;
  if (!record || typeof record.typeDomainText !== 'string' || typeof record.recordDomainText !== 'string') {
    throw new TypeError('MISSING_RECORD_IDENTITY_EXPECTATION');
  }
  const typeId = keccak256(toUtf8Bytes(record.typeDomainText));
  const bodyHash = keccak256(body);
  const domain = keccak256(toUtf8Bytes(record.recordDomainText));
  const preimage = AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'bytes32', 'bytes32'],
    [domain, typeId, bodyHash],
  );
  return { typeId, bodyHash, recordId: keccak256(preimage) };
}

function classifyItems(items, expectedValue, label) {
  if (items.length === 0) return outcome('UNKNOWN', `RAW_RETURN_OMITTED:${label}`);
  if (items.some((item) => item.status === 'OBSERVED_MISMATCH')) {
    return outcome('OBSERVED_MISMATCH', `MALFORMED_RAW_RETURN:${label}`, { observations: items });
  }
  if (items.some((item) => item.status === 'UNKNOWN')) {
    return outcome('UNKNOWN', `RAW_RETURN_OMITTED:${label}`, { observations: items });
  }
  const values = items.map((item) => JSON.stringify(item.value));
  if (new Set(values).size !== 1) {
    return outcome('OBSERVED_MISMATCH', `CONFLICTING_RAW_RETURNS:${label}`, { observations: items });
  }
  const value = items[0].value;
  if (expectedValue !== undefined && JSON.stringify(value) !== JSON.stringify(expectedValue)) {
    return outcome('OBSERVED_MISMATCH', `UNEXPECTED_DECODED_VALUE:${label}`, {
      expected: expectedValue,
      observed: value,
      observationCount: items.length,
    });
  }
  return outcome('OBSERVED_MATCH', `RAW_RETURN_DECODES_AS_EXPECTED:${label}`, {
    observed: value,
    observationCount: items.length,
  });
}

function addBasis(map, number, hash, source) {
  const key = blockKey(number);
  if (key === null || hash === undefined || hash === null) return;
  const normalized = typeof hash === 'string' && HASH.test(hash)
    ? hash.toLowerCase()
    : `MALFORMED:${source}`;
  const entry = map.get(key) ?? new Map();
  const sources = entry.get(normalized) ?? [];
  sources.push(source);
  entry.set(normalized, sources);
  map.set(key, entry);
}

function buildBasisMap(packet, cell, raw) {
  const map = new Map();
  addBasis(map, packet?.sealedInitialState?.blockNumber, packet?.sealedInitialState?.blockHash, 'sealedInitialState');
  addBasis(map, cell?.afterRevert?.blockNumber, cell?.afterRevert?.blockHash, 'cell.afterRevert');
  for (const [index, tx] of (cell?.transactions ?? []).entries()) {
    addBasis(map, tx?.receipt?.blockNumber, tx?.receipt?.blockHash, `cell.transactions[${index}].receipt`);
  }
  for (const [index, observation] of raw.entries()) {
    addBasis(map, observation?.blockTag, observation?.blockHash, `cell.raw[${index}].blockHash`);
  }
  return map;
}

function basisResult(number, observations, basisMap) {
  const key = blockKey(number);
  if (key === null) return outcome('UNKNOWN', 'BLOCK_NUMBER_UNAVAILABLE', { blockNumber: 'UNAVAILABLE', blockHash: 'UNAVAILABLE' });
  const missingIndexes = observations
    .map((item, index) => (!item || item.blockHash === undefined || item.blockHash === null ? index : null))
    .filter((index) => index !== null);
  const explicit = observations.map((item, index) => {
    if (!item || item.blockHash === undefined || item.blockHash === null) return null;
    if (typeof item.blockHash !== 'string' || !HASH.test(item.blockHash)) {
      return { malformed: true, index, supplied: item.blockHash };
    }
    return { malformed: false, index, hash: item.blockHash.toLowerCase() };
  }).filter(Boolean);
  const malformed = explicit.filter((item) => item.malformed);
  if (malformed.length > 0) {
    return outcome('OBSERVED_MISMATCH', 'MALFORMED_EXPLICIT_BLOCK_HASH', {
      blockNumber: key,
      observations: malformed,
    });
  }
  if (explicit.length === 0) {
    return outcome('UNKNOWN', 'BLOCK_HASH_UNAVAILABLE', { blockNumber: key, blockHash: 'UNAVAILABLE' });
  }
  const explicitHashes = [...new Set(explicit.map((item) => item.hash))];
  if (explicitHashes.length !== 1) {
    return outcome('OBSERVED_MISMATCH', 'CONFLICTING_EXPLICIT_BLOCK_HASHES', {
      blockNumber: key,
      blockHashes: explicitHashes.sort(),
    });
  }
  const [blockHash] = explicitHashes;
  const knownAtNumber = basisMap.get(key);
  const conflicts = knownAtNumber
    ? [...knownAtNumber.entries()].filter(([knownHash]) => knownHash !== blockHash)
    : [];
  if (conflicts.length > 0) {
    return outcome('OBSERVED_MISMATCH', 'EXPLICIT_BLOCK_HASH_CONFLICTS_WITH_RETAINED_BASIS', {
      blockNumber: key,
      blockHash,
      conflictingBlockHashes: conflicts.map(([hash, sources]) => ({ hash, sources })),
    });
  }
  if (missingIndexes.length > 0) {
    return outcome('UNKNOWN', 'BLOCK_HASH_UNAVAILABLE_FOR_EVERY_OBSERVATION', {
      blockNumber: key,
      blockHash: 'PARTIALLY_AVAILABLE',
      suppliedBlockHash: blockHash,
      missingObservationIndexes: missingIndexes,
      suppliedObservationIndexes: explicit.map((item) => item.index),
    });
  }
  return outcome('OBSERVED_MATCH', 'EXACT_BLOCK_HASH_PRESENT_ON_OBSERVATION', {
    blockNumber: key,
    blockHash,
    observationIndexes: explicit.map((item) => item.index),
  });
}

function prepareRaw(raw, abiIndex) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const calldata = typeof item?.calldata === 'string' && HEX.test(item.calldata) && item.calldata.length >= 10
      ? item.calldata.toLowerCase()
      : null;
    const selector = calldata?.slice(0, 10) ?? null;
    const candidates = selector ? (abiIndex.selectors.get(selector) ?? []) : [];
    const to = normalizeAddress(item?.to);
    const block = blockKey(item?.blockTag);
    return {
      index,
      raw: item,
      to,
      targetMalformed: item?.to !== undefined && item?.to !== null && to === null,
      calldata,
      selector,
      block,
      blockMalformed: item?.blockTag !== undefined && item?.blockTag !== null && block === null,
      candidates,
    };
  });
}

function prepareTransactions(transactions, abiIndex) {
  if (!Array.isArray(transactions)) return [];
  return transactions.map((item, index) => {
    const data = typeof item?.data === 'string' && HEX.test(item.data) && item.data.length >= 10
      ? item.data.toLowerCase()
      : null;
    const selector = data?.slice(0, 10) ?? null;
    const to = normalizeAddress(item?.to);
    const block = blockKey(item?.receipt?.blockNumber);
    return {
      index,
      raw: item,
      to,
      targetMalformed: item?.to !== undefined && item?.to !== null && to === null,
      data,
      selector,
      candidates: selector ? (abiIndex.selectors.get(selector) ?? []) : [],
      block,
      blockMalformed: item?.receipt?.blockNumber !== undefined
        && item?.receipt?.blockNumber !== null && block === null,
    };
  });
}

function targetAnalysis(raw, transactions, options) {
  const targets = new Map();
  const observations = [...raw, ...transactions];
  const malformedTargets = observations
    .filter((item) => item.targetMalformed)
    .map((item) => ({
      source: raw.includes(item) ? 'raw' : 'transaction',
      index: item.index,
      surface: item.candidates.length === 1 ? item.candidates[0].surface : 'UNDECLARED_SELECTOR',
      supplied: item.raw?.to,
    }));
  for (const item of observations) {
    if (!item.to || item.candidates.length !== 1) continue;
    const { surface } = item.candidates[0];
    const set = targets.get(surface) ?? new Set();
    set.add(item.to);
    targets.set(surface, set);
  }
  const bySurface = {};
  let mismatch = false;
  for (const [surface, set] of [...targets.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    bySurface[surface] = [...set].sort();
    if (set.size > 1) mismatch = true;
  }
  if (malformedTargets.length > 0) {
    return outcome('OBSERVED_MISMATCH', 'MALFORMED_CALL_OR_TRANSACTION_TARGET', {
      bySurface,
      malformedTargets,
    });
  }
  if (mismatch) {
    return outcome('OBSERVED_MISMATCH', 'ONE_ABI_SURFACE_APPEARS_AT_MULTIPLE_RAW_TARGETS', { bySurface });
  }
  if (!pinsAreIndependent(options) || !options.expectedTargets || typeof options.expectedTargets !== 'object') {
    return outcome('UNKNOWN', bySurface.Consumer ? 'TARGET_AUTHORITY_UNPINNED' : 'CONSUMER_TARGET_UNAVAILABLE', {
      bySurface,
      internalConsistency: 'ONE_TARGET_PER_OBSERVED_ABI_SURFACE',
      pinStanding: options?.pinStanding ?? 'UNAVAILABLE',
    });
  }
  const comparisons = [];
  const missingPins = [];
  for (const [surface, observedTargets] of Object.entries(bySurface)) {
    const expected = normalizeAddress(options.expectedTargets[surface]);
    if (!expected) {
      missingPins.push(surface);
      continue;
    }
    comparisons.push({ surface, expected, observed: observedTargets[0] });
  }
  const conflicts = comparisons.filter((item) => item.expected !== item.observed);
  if (conflicts.length > 0) {
    return outcome('OBSERVED_MISMATCH', 'OBSERVED_TARGET_DIFFERS_FROM_INDEPENDENT_PIN', {
      bySurface,
      conflicts,
      missingPins,
      pinStanding: options.pinStanding,
    });
  }
  const missingObservedSurfaces = Object.entries(options.expectedTargets)
    .filter(([, target]) => normalizeAddress(target))
    .map(([surface]) => surface)
    .filter((surface) => !bySurface[surface]);
  if (!bySurface.Consumer || missingPins.length > 0 || missingObservedSurfaces.length > 0) {
    return outcome('UNKNOWN', 'INDEPENDENT_TARGET_PIN_OR_OBSERVATION_MISSING', {
      bySurface,
      missingPins,
      missingObservedSurfaces,
      pinStanding: options.pinStanding,
    });
  }
  return outcome('OBSERVED_MATCH', 'OBSERVED_TARGETS_MATCH_INDEPENDENT_PINS', {
    bySurface,
    comparisons,
    pinStanding: options.pinStanding,
  });
}

function canonicalTarget(targets, surface) {
  const values = targets?.bySurface?.[surface];
  return Array.isArray(values) && values.length === 1 ? values[0] : null;
}

function decodeReturn(rawItems, surface, name, iface) {
  return rawItems.map((item) => {
    if (item.raw.returnData === undefined || item.raw.returnData === null) {
      return { status: 'UNKNOWN', reason: 'RAW_RETURN_OMITTED', rawIndex: item.index };
    }
    try {
      const { decoded, normalized: returnData } = exactFunctionResult(iface, name, item.raw.returnData);
      const value = decoded.length === 1 ? plain(decoded[0]) : plain([...decoded]);
      return { status: 'OBSERVED_MATCH', value, rawIndex: item.index, returnData };
    } catch (error) {
      return { status: 'OBSERVED_MISMATCH', reason: 'ABI_RETURN_DECODE_FAILED', rawIndex: item.index, error: error.message };
    }
  });
}

function observeFunction({ raw, surface, name, selector, block, expected, iface, targets, basisMap }) {
  const expectedTarget = canonicalTarget(targets, surface);
  const atBlock = raw.filter((item) => item.block === block && item.selector === selector);

  if (atBlock.length === 0) {
    const unknownAtExpectedTarget = raw.some((item) => item.block === block
      && expectedTarget !== null
      && item.to === expectedTarget
      && item.candidates.length === 0);
    if (unknownAtExpectedTarget) {
      return outcome('OBSERVED_MISMATCH', `SELECTOR_SUBSTITUTION_OR_UNDECLARED_CALL:${surface}.${name}`, {
        expectedSelector: selector,
        expectedBlockNumber: block,
      });
    }
    return outcome('UNKNOWN', `RAW_CALL_OMITTED:${surface}.${name}`, {
      expectedSelector: selector,
      expectedBlockNumber: block,
    });
  }
  if (!expectedTarget) {
    return outcome('UNKNOWN', `TARGET_UNAVAILABLE:${surface}.${name}`, {
      observedTargets: [...new Set(atBlock.map((item) => item.to))].sort(),
    });
  }
  if (atBlock.some((item) => item.to !== expectedTarget)) {
    return outcome('OBSERVED_MISMATCH', `TARGET_MISMATCH:${surface}.${name}`, {
      expectedTarget,
      observedTargets: [...new Set(atBlock.map((item) => item.to))].sort(),
    });
  }
  const malformedCalldata = [];
  for (const item of atBlock) {
    try {
      exactFunctionData(iface, name, item.calldata);
    } catch (error) {
      malformedCalldata.push({ rawIndex: item.index, error: error.message });
    }
  }
  if (malformedCalldata.length > 0) {
    return outcome('OBSERVED_MISMATCH', `MALFORMED_CALLDATA:${surface}.${name}`, {
      observations: malformedCalldata,
    });
  }
  const value = classifyItems(decodeReturn(atBlock, surface, name, iface), expected, `${surface}.${name}`);
  const basis = basisResult(block, atBlock.map((item) => item.raw), basisMap);
  if (value.status === 'OBSERVED_MISMATCH' || basis.status === 'OBSERVED_MISMATCH') {
    return outcome('OBSERVED_MISMATCH', `${surface}.${name}:VALUE_OR_BASIS_MISMATCH`, { value, basis });
  }
  if (value.status === 'UNKNOWN' || basis.status === 'UNKNOWN') {
    return outcome('UNKNOWN', `${surface}.${name}:VALUE_OR_BASIS_UNKNOWN`, { value, basis });
  }
  return outcome('OBSERVED_MATCH', `${surface}.${name}:VALUE_AND_BASIS_MATCH`, { value, basis });
}

function combine(label, parts, extra = {}) {
  if (parts.some((part) => part?.status === 'OBSERVED_MISMATCH')) {
    return outcome('OBSERVED_MISMATCH', `${label}:AT_LEAST_ONE_COMPONENT_MISMATCH`, { components: parts, ...extra });
  }
  if (parts.some((part) => part?.status === 'UNSUPPORTED')) {
    return outcome('UNSUPPORTED', `${label}:AT_LEAST_ONE_COMPONENT_UNSUPPORTED`, { components: parts, ...extra });
  }
  if (parts.some((part) => part?.status === 'UNKNOWN')) {
    return outcome('UNKNOWN', `${label}:AT_LEAST_ONE_COMPONENT_UNKNOWN`, { components: parts, ...extra });
  }
  return outcome('OBSERVED_MATCH', `${label}:ALL_COMPONENTS_MATCH`, { components: parts, ...extra });
}

function transportCorrelation(raw) {
  if (raw.length === 0) return outcome('UNKNOWN', 'NO_RAW_CALL_TUPLES');
  const mismatches = [];
  const missing = [];
  const correlatedIds = [];
  for (const item of raw) {
    const tuple = item.raw;
    const request = tuple?.request;
    const response = tuple?.response;
    if (request === undefined || request === null || response === undefined || response === null) {
      missing.push({ rawIndex: item.index, field: 'request/response' });
      continue;
    }
    if (typeof request !== 'object' || Array.isArray(request)
      || typeof response !== 'object' || Array.isArray(response)) {
      mismatches.push({ rawIndex: item.index, reason: 'RPC_REQUEST_OR_RESPONSE_CONTAINER_MALFORMED' });
      continue;
    }
    if (request.jsonrpc !== '2.0' || response.jsonrpc !== '2.0') {
      mismatches.push({ rawIndex: item.index, reason: 'JSONRPC_VERSION_MISMATCH' });
    }
    if (request.id === undefined || response.id === undefined) {
      missing.push({ rawIndex: item.index, field: 'request.id/response.id' });
    } else {
      const validId = (id) => id === null || typeof id === 'string'
        || (typeof id === 'number' && Number.isSafeInteger(id));
      if (!validId(request.id) || !validId(response.id)) {
        mismatches.push({ rawIndex: item.index, reason: 'RPC_ID_TYPE_MALFORMED' });
      } else {
        correlatedIds.push({ rawIndex: item.index, id: request.id });
      }
      if (request.id !== response.id) {
        mismatches.push({ rawIndex: item.index, reason: 'REQUEST_RESPONSE_ID_MISMATCH' });
      }
      if (tuple.rpcId !== undefined && tuple.rpcId !== request.id) {
        mismatches.push({ rawIndex: item.index, reason: 'FLAT_REQUEST_ID_MISMATCH' });
      }
    }
    if (request.method !== 'eth_call'
      || (tuple.method !== undefined && tuple.method !== request.method)) {
      mismatches.push({ rawIndex: item.index, reason: 'RPC_METHOD_MISMATCH' });
    }
    if (typeof tuple.source !== 'string' || tuple.source.length === 0) {
      missing.push({ rawIndex: item.index, field: 'source' });
    }
    const params = request.params;
    if (!Array.isArray(params) || params.length !== 2
      || !params[0] || typeof params[0] !== 'object' || Array.isArray(params[0])) {
      mismatches.push({ rawIndex: item.index, reason: 'ETH_CALL_PARAMS_MALFORMED' });
      continue;
    }
    const unmodeledCallFields = Object.keys(params[0]).filter((key) => key !== 'to' && key !== 'data').sort();
    if (unmodeledCallFields.length > 0) {
      missing.push({ rawIndex: item.index, field: 'unmodeled eth_call transaction fields', keys: unmodeledCallFields });
    }
    try {
      const requestTo = normalizeAddress(params[0].to);
      const requestData = normalizeHex(params[0].data, 'RPC_REQUEST_CALLDATA');
      if (!requestTo || requestTo !== item.to || requestData !== item.calldata) {
        mismatches.push({ rawIndex: item.index, reason: 'REQUEST_FLAT_CALL_TUPLE_MISMATCH' });
      }
    } catch (error) {
      mismatches.push({ rawIndex: item.index, reason: 'REQUEST_CALL_TUPLE_MALFORMED', error: error.message });
    }
    const requestBlockParameterIsQuantity = typeof params[1] === 'string'
      && /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(params[1]);
    const requestBlock = requestBlockParameterIsQuantity ? blockKey(params[1]) : null;
    if (requestBlock === null || item.block === null) {
      mismatches.push({ rawIndex: item.index, reason: 'REQUEST_OR_FLAT_BLOCK_BASIS_MALFORMED' });
    } else if (requestBlock !== item.block) {
      mismatches.push({ rawIndex: item.index, reason: 'REQUEST_FLAT_BLOCK_BASIS_MISMATCH' });
    }
    const hasResponseResult = Object.prototype.hasOwnProperty.call(response, 'result');
    const hasResponseError = Object.prototype.hasOwnProperty.call(response, 'error');
    const hasFlatReturn = tuple.returnData !== undefined && tuple.returnData !== null;
    if (hasResponseResult === hasResponseError) {
      mismatches.push({ rawIndex: item.index, reason: 'RESPONSE_MUST_HAVE_EXACTLY_ONE_OF_RESULT_OR_ERROR' });
    }
    if (hasResponseResult !== hasFlatReturn) {
      mismatches.push({ rawIndex: item.index, reason: 'RESPONSE_FLAT_RETURN_PRESENCE_MISMATCH' });
    } else if (hasResponseResult) {
      try {
        const responseResult = normalizeHex(response.result, 'RPC_RESPONSE_RESULT');
        const flatReturn = normalizeHex(tuple.returnData, 'RAW_RETURN');
        if (responseResult !== flatReturn) {
          mismatches.push({ rawIndex: item.index, reason: 'RESPONSE_FLAT_RETURN_BYTES_MISMATCH' });
        }
      } catch (error) {
        mismatches.push({ rawIndex: item.index, reason: 'RPC_RESPONSE_RESULT_MALFORMED', error: error.message });
      }
    } else if (hasResponseError
      && (!response.error || typeof response.error !== 'object' || Array.isArray(response.error)
        || !Number.isSafeInteger(response.error.code) || typeof response.error.message !== 'string')) {
      mismatches.push({ rawIndex: item.index, reason: 'RPC_RESPONSE_ERROR_MALFORMED' });
    }
  }
  const seenIds = new Map();
  for (const { rawIndex, id } of correlatedIds) {
    const key = JSON.stringify([typeof id, id]);
    if (seenIds.has(key)) {
      mismatches.push({ rawIndex, reason: 'DUPLICATE_REQUEST_ID', firstRawIndex: seenIds.get(key), id });
    } else {
      seenIds.set(key, rawIndex);
    }
  }
  if (mismatches.length > 0) {
    return outcome('OBSERVED_MISMATCH', 'RPC_REQUEST_RESPONSE_CORRELATION_MISMATCH', {
      rawTupleCount: raw.length,
      mismatches,
      missing,
    });
  }
  if (missing.length > 0) {
    return outcome('UNKNOWN', 'RPC_REQUEST_RESPONSE_CORRELATION_INCOMPLETE_OR_UNMODELED', {
      rawTupleCount: raw.length,
      missing,
    });
  }
  return outcome('OBSERVED_MATCH', 'RPC_REQUEST_RESPONSE_ENVELOPES_CORRELATE_EXACTLY', {
    rawTupleCount: raw.length,
  });
}

function receiptStatus(receipt) {
  if (!receipt || receipt.status === undefined || receipt.status === null) {
    return outcome('UNKNOWN', 'TRANSACTION_RECEIPT_STATUS_UNAVAILABLE');
  }
  let status;
  try {
    if (typeof receipt.status === 'bigint' && receipt.status >= 0n) {
      status = receipt.status;
    } else if (typeof receipt.status === 'number'
      && Number.isSafeInteger(receipt.status) && receipt.status >= 0) {
      status = BigInt(receipt.status);
    } else if (typeof receipt.status === 'string'
      && (/^(0|[1-9][0-9]*)$/.test(receipt.status)
        || /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(receipt.status))) {
      status = BigInt(receipt.status);
    } else {
      throw new TypeError('receipt status is not a non-negative integer quantity');
    }
  } catch {
    return outcome('OBSERVED_MISMATCH', 'TRANSACTION_RECEIPT_STATUS_MALFORMED', {
      observedStatus: receipt.status,
    });
  }
  if (status !== 1n) {
    return outcome('OBSERVED_MISMATCH', 'TRANSACTION_RECEIPT_NOT_SUCCESS', {
      observedStatus: status.toString(),
    });
  }
  return outcome('OBSERVED_MATCH', 'TRANSACTION_RECEIPT_REPORTS_SUCCESS', { observedStatus: '1' });
}

function transactionFor(transactions, surface, name, selector, iface, targets, basisMap) {
  const matches = transactions.filter((item) => item.selector === selector);
  if (matches.length === 0) return outcome('UNKNOWN', `TRANSACTION_OMITTED:${surface}.${name}`);
  if (matches.length !== 1) return outcome('OBSERVED_MISMATCH', `CONFLICTING_TRANSACTIONS:${surface}.${name}`, { count: matches.length });
  const item = matches[0];
  if (item.blockMalformed) {
    return outcome('OBSERVED_MISMATCH', `TRANSACTION_BLOCK_NUMBER_MALFORMED:${surface}.${name}`, {
      observedBlockNumber: item.raw?.receipt?.blockNumber,
    });
  }
  const expectedTarget = canonicalTarget(targets, surface);
  if (!expectedTarget) {
    return outcome('UNKNOWN', `TRANSACTION_TARGET_UNAVAILABLE:${surface}.${name}`, {
      observedTarget: item.to,
    });
  }
  if (item.to !== expectedTarget) {
    return outcome('OBSERVED_MISMATCH', `TRANSACTION_TARGET_MISMATCH:${surface}.${name}`, {
      expectedTarget,
      observedTarget: item.to,
    });
  }
  try {
    const decoded = exactFunctionData(iface, name, item.data);
    const basis = basisResult(item.block, [item.raw?.receipt ?? {}], basisMap);
    const status = receiptStatus(item.raw?.receipt);
    const metadata = {
      transactionIndex: item.index,
      to: item.to,
      selector: item.selector,
      block: item.block,
      blockHash: typeof item.raw?.receipt?.blockHash === 'string'
        ? item.raw.receipt.blockHash.toLowerCase()
        : 'UNAVAILABLE',
    };
    return combine(`TRANSACTION:${surface}.${name}`, [status, basis], {
      item: metadata,
      args: plain([...decoded]),
      basis,
    });
  } catch (error) {
    return outcome('OBSERVED_MISMATCH', `TRANSACTION_CALLDATA_MALFORMED:${surface}.${name}`, { error: error.message });
  }
}

function preReadUnknownTransactions(transactions) {
  const recognizedReadIndexes = transactions
    .filter((item) => item.candidates.some(({ surface, name }) => surface === 'Consumer'
      && (name === 'readQuote' || name === 'readList')))
    .map((item) => item.index);
  const firstReadIndex = recognizedReadIndexes.length > 0 ? Math.min(...recognizedReadIndexes) : null;
  return firstReadIndex === null
    ? []
    : transactions.filter((item) => item.index < firstReadIndex && item.candidates.length === 0);
}

function nativeWriteConsistency(transactions, ledger) {
  const signedSelector = ledger.getFunction('executeSigned').selector.toLowerCase();
  const signedCalls = transactions.filter((item) => item.selector === signedSelector);
  if (signedCalls.length > 0) {
    return outcome('OBSERVED_MISMATCH', 'SIGNED_WRITER_PRESENT_IN_NATIVE_CELL', {
      transactionIndexes: signedCalls.map((item) => item.index),
    });
  }
  const unknownCalls = preReadUnknownTransactions(transactions);
  if (unknownCalls.length > 0) {
    return outcome('UNSUPPORTED', 'NATIVE_WRITE_CALLDATA_SELECTOR_NOT_DECLARED_BY_AUTHORIZED_ABIS', {
      selectors: [...new Set(unknownCalls.map((item) => item.selector ?? 'MALFORMED'))].sort(),
      scope: 'pre-read transaction ordering only; candidate labels and decoded summaries are ignored',
    });
  }
  return outcome('UNKNOWN', 'NATIVE_WRITE_TRANSACTIONS_OMITTED');
}

function signedWriteTupleConsistency(transactions, ledger, targets, basisMap, expectations) {
  const selector = ledger.getFunction('executeSigned').selector.toLowerCase();
  const candidates = transactions.filter((item) => item.selector === selector)
    .sort((a, b) => BigInt(a.block ?? 0) < BigInt(b.block ?? 0) ? -1 : 1);
  if (candidates.length === 0) {
    return outcome('UNKNOWN', 'SIGNED_WRITE_TRANSACTIONS_OMITTED');
  }
  if (candidates.length !== 2) {
    return outcome('OBSERVED_MISMATCH', 'EXPECTED_EXACTLY_TWO_SIGNED_WRITE_TRANSACTIONS', { observed: candidates.length });
  }
  const ledgerTarget = canonicalTarget(targets, 'Ledger');
  if (!ledgerTarget || candidates.some((item) => item.to !== ledgerTarget)) {
    return outcome('OBSERVED_MISMATCH', 'SIGNED_WRITE_TARGET_MISMATCH', {
      expectedTarget: ledgerTarget ?? 'CONFLICTING_OR_UNAVAILABLE',
      observedTargets: candidates.map((item) => item.to),
    });
  }

  const transactionEvidence = candidates.map((item) => {
    let parsed;
    let calldata;
    try {
      parsed = exactFunctionData(ledger, 'executeSigned', item.data);
      calldata = outcome('OBSERVED_MATCH', 'SIGNED_WRITE_CALLDATA_CANONICAL');
    } catch (error) {
      calldata = outcome('OBSERVED_MISMATCH', 'SIGNED_WRITE_CALLDATA_MALFORMED', { error: error.message });
    }
    return {
      item,
      parsed,
      calldata,
      receiptStatus: receiptStatus(item.raw?.receipt),
      basis: item.blockMalformed
        ? outcome('OBSERVED_MISMATCH', 'SIGNED_WRITE_RECEIPT_BLOCK_NUMBER_MALFORMED', {
          observedBlockNumber: item.raw?.receipt?.blockNumber,
        })
        : basisResult(item.block, [item.raw?.receipt ?? {}], basisMap),
    };
  });
  const evidenceMismatch = transactionEvidence.some(({ calldata, receiptStatus: status, basis }) => (
    calldata.status === 'OBSERVED_MISMATCH'
    || status.status === 'OBSERVED_MISMATCH'
    || basis.status === 'OBSERVED_MISMATCH'
  ));
  if (evidenceMismatch) {
    return outcome('OBSERVED_MISMATCH', 'SIGNED_WRITE_CALLDATA_RECEIPT_OR_BASIS_MISMATCH', {
      transactions: transactionEvidence.map(({ item, calldata, receiptStatus: status, basis }) => ({
        transactionIndex: item.index,
        calldata,
        receiptStatus: status,
        basis,
      })),
    });
  }

  const decoded = [];
  for (const { item, parsed, basis } of transactionEvidence) {
    try {
      const actions = [...parsed[1]];
      const bodies = [...parsed[2]].map((body) => normalizeHex(body, 'WRITE_BODY'));
      const matchingBodies = [];
      for (const body of bodies.filter((candidate) => candidate !== '0x')) {
        const identity = recordIdFromRawBody(body, expectations);
        const bodyActionIndexes = actions
          .map((action, actionIndex) => ({ action, actionIndex }))
          .filter(({ action }) => action.typeId.toLowerCase() === identity.typeId
            && action.bodyHashOrRecordId.toLowerCase() === identity.bodyHash)
          .map(({ actionIndex }) => actionIndex);
        if (bodyActionIndexes.length > 0) matchingBodies.push({ body, identity, bodyActionIndexes });
      }
      if (matchingBodies.length !== 1) {
        return outcome('OBSERVED_MISMATCH', 'RAW_BODY_TO_ACTION_HASH_BINDING_MISMATCH', {
          transactionIndex: item.index,
          matchingBodies: matchingBodies.length,
        });
      }
      const selected = matchingBodies[0];
      if (selected.bodyActionIndexes.length !== 1) {
        return outcome('OBSERVED_MISMATCH', 'CONFLICTING_RAW_BODY_ACTION_COMMITMENTS', {
          transactionIndex: item.index,
          bodyActionIndexes: selected.bodyActionIndexes,
        });
      }
      const targetActions = actions
        .map((action, actionIndex) => ({ action, actionIndex }))
        .filter(({ action }) => action.target.toLowerCase() === selected.identity.recordId
          && action.subject.toLowerCase() !== ZERO_WORD);
      if (targetActions.length !== 1) {
        return outcome('OBSERVED_MISMATCH', 'RECOMPUTED_RECORD_TO_SUBJECT_TARGET_BINDING_MISMATCH', {
          transactionIndex: item.index,
          recordId: selected.identity.recordId,
          matchingTargetActions: targetActions.length,
        });
      }
      decoded.push({
        transactionIndex: item.index,
        blockNumber: item.block,
        basis,
        rawBody: selected.body,
        bodyCommitmentActionIndex: selected.bodyActionIndexes[0],
        recordTargetBindingActionIndex: targetActions[0].actionIndex,
        bodyHash: selected.identity.bodyHash,
        recordId: selected.identity.recordId,
        typeId: selected.identity.typeId,
        subject: targetActions[0].action.subject.toLowerCase(),
        expectedRevision: targetActions[0].action.expectedRevision.toString(),
      });
    } catch (error) {
      return outcome('OBSERVED_MISMATCH', 'SIGNED_WRITE_TUPLE_MALFORMED', {
        transactionIndex: item.index,
        error: error.message,
      });
    }
  }

  const [create, edit] = decoded;
  if (create.recordId === edit.recordId
    || create.subject !== edit.subject
    || create.expectedRevision !== '0'
    || edit.expectedRevision !== '1'
    || (create.blockNumber !== null && edit.blockNumber !== null
      && BigInt(create.blockNumber) >= BigInt(edit.blockNumber))) {
    return outcome('OBSERVED_MISMATCH', 'WRITE_RECORD_SUBJECT_REVISION_OR_ORDER_MISMATCH', { create, edit });
  }
  const evidenceUnknown = transactionEvidence.some(({ receiptStatus: status, basis }) => (
    status.status === 'UNKNOWN' || basis.status === 'UNKNOWN'
  ));
  if (evidenceUnknown) {
    return outcome('UNKNOWN', 'SIGNED_WRITE_RECEIPT_OR_BASIS_UNKNOWN', {
      transactions: transactionEvidence.map(({ item, receiptStatus: status, basis }) => ({
        transactionIndex: item.index,
        receiptStatus: status,
        basis,
      })),
      create,
      edit,
    });
  }
  return outcome('OBSERVED_MATCH', 'RAW_ACTION_ARRAYS_CONTAIN_BODY_COMMITMENTS_AND_RECORD_TARGET_BINDINGS', {
    scope: 'separate actions in each canonical array carry the body-hash commitment and Record-target/subject/revision binding; action-kind and cross-action semantics are not asserted',
    create,
    edit,
  });
}

function observeRecord(raw, ledger, block, id, targets, basisMap) {
  const selector = ledger.getFunction('record').selector.toLowerCase();
  const expectedTarget = canonicalTarget(targets, 'Ledger');
  const atBlock = raw.filter((item) => item.block === block && item.selector === selector);
  const matching = [];
  const observedRecordIds = [];
  for (const item of atBlock) {
    try {
      const decoded = exactFunctionData(ledger, 'record', item.calldata);
      const observedRecordId = decoded[0].toLowerCase();
      observedRecordIds.push(observedRecordId);
      if (observedRecordId === id) matching.push(item);
    } catch (error) {
      return outcome('OBSERVED_MISMATCH', 'MALFORMED_RECORD_CALLDATA', { rawIndex: item.index, error: error.message });
    }
  }
  if (matching.length === 0) {
    return outcome('UNKNOWN', 'CONTROL_RECORD_RAW_CALL_OMITTED', {
      recordId: id,
      blockNumber: block,
      otherObservedRecordIds: [...new Set(observedRecordIds)].sort(),
    });
  }
  if (!expectedTarget) {
    return outcome('UNKNOWN', 'CONTROL_RECORD_TARGET_UNAVAILABLE', { recordId: id });
  }
  if (matching.some((item) => item.to !== expectedTarget)) {
    return outcome('OBSERVED_MISMATCH', 'CONTROL_RECORD_TARGET_MISMATCH', { recordId: id });
  }
  const values = decodeReturn(matching, 'Ledger', 'record', ledger);
  const expected = [ZERO_WORD, '0', '0', '0x'];
  const value = classifyItems(values, expected, `Ledger.record(${id})`);
  const basis = basisResult(block, matching.map((item) => item.raw), basisMap);
  return combine('CONTROL_RECORD', [value, basis], { recordId: id, basis });
}

function coordinateExpectation(options, cellId, name, observed) {
  if (!pinsAreIndependent(options)) {
    return outcome('UNKNOWN', `QUERY_COORDINATES_UNPINNED:${cellId}.${name}`, {
      observed,
      pinStanding: options?.pinStanding ?? 'UNAVAILABLE',
    });
  }
  const expected = options?.expectedCoordinates?.[cellId]?.[name];
  if (expected === undefined) {
    return outcome('UNKNOWN', `INDEPENDENT_QUERY_COORDINATE_PIN_MISSING:${cellId}.${name}`, { observed });
  }
  const normalizedExpected = plain(expected);
  if (JSON.stringify(observed) !== JSON.stringify(normalizedExpected)) {
    return outcome('OBSERVED_MISMATCH', `QUERY_COORDINATES_DIFFER_FROM_INDEPENDENT_PIN:${cellId}.${name}`, {
      expected: normalizedExpected,
      observed,
    });
  }
  return outcome('OBSERVED_MATCH', `QUERY_COORDINATES_MATCH_INDEPENDENT_PIN:${cellId}.${name}`, {
    expected: normalizedExpected,
    observed,
  });
}

function stageCallSet({ raw, surface, block, expectedSelectors, options, label }) {
  if (!pinsAreIndependent(options)) {
    return outcome('UNKNOWN', `STAGE_CALL_SET_UNPINNED:${label}`);
  }
  const expectedTarget = normalizeAddress(options?.expectedTargets?.[surface]);
  if (!expectedTarget || block === null) {
    return outcome('UNKNOWN', `STAGE_CALL_SET_TARGET_OR_BASIS_UNAVAILABLE:${label}`);
  }
  const expected = expectedSelectors.map((selector) => selector.toLowerCase());
  const observed = raw.filter((item) => item.block === block && item.to === expectedTarget);
  const counts = Object.fromEntries(expected.map((selector) => [selector, 0]));
  const unexpected = [];
  for (const item of observed) {
    if (item.selector !== null && Object.prototype.hasOwnProperty.call(counts, item.selector)) {
      counts[item.selector] += 1;
    } else {
      unexpected.push({ rawIndex: item.index, selector: item.selector ?? 'MALFORMED' });
    }
  }
  const missing = expected.filter((selector) => counts[selector] === 0);
  const duplicates = expected
    .filter((selector) => counts[selector] > 1)
    .map((selector) => ({ selector, count: counts[selector] }));
  if (unexpected.length > 0 || duplicates.length > 0) {
    return outcome('OBSERVED_MISMATCH', `STAGE_CALL_SET_SUBSTITUTED_OR_CONFLICTING:${label}`, {
      blockNumber: block,
      expectedTarget,
      missing,
      duplicates,
      unexpected,
    });
  }
  if (missing.length > 0) {
    return outcome('UNKNOWN', `STAGE_CALL_SET_INCOMPLETE:${label}`, {
      blockNumber: block,
      expectedTarget,
      missing,
    });
  }
  return outcome('OBSERVED_MATCH', `STAGE_CALL_SET_EXACT:${label}`, {
    blockNumber: block,
    expectedTarget,
    selectors: expected,
  });
}

function orderedAfter(earlier, later, label) {
  if (earlier === null || later === null) return outcome('UNKNOWN', `TRANSACTION_ORDER_UNAVAILABLE:${label}`);
  if (BigInt(earlier) >= BigInt(later)) {
    return outcome('OBSERVED_MISMATCH', `TRANSACTION_STAGE_ORDER_MISMATCH:${label}`, { earlier, later });
  }
  return outcome('OBSERVED_MATCH', `TRANSACTION_STAGE_ORDER_MATCH:${label}`, { earlier, later });
}

function analyzeCell(packet, packetKey, cellId, profile, expectations, abiIndex, options) {
  const cell = packet?.cells?.[packetKey];
  if (!cell) {
    const unknown = outcome('UNKNOWN', 'EXPECTED_CELL_OMITTED');
    return {
      cellId,
      packetKey: 'UNAVAILABLE',
      axes: {
        transportCorrelation: unknown,
        targetConsistency: unknown,
        writeSequence: unknown,
        bodyScalarSemantics: outcome('UNSUPPORTED', profile.bodyCodec?.reason ?? 'BODY_CODEC_UNSUPPORTED'),
        controlRecords: unknown,
        controlConsumer: unknown,
        paidQuoteRead: unknown,
        listing: unknown,
      },
    };
  }
  const raw = prepareRaw(cell.raw, abiIndex);
  const transactions = prepareTransactions(cell.transactions, abiIndex);
  const targets = targetAnalysis(raw, transactions, options);
  const basisMap = buildBasisMap(packet, cell, raw.map((item) => item.raw));
  const consumer = abiIndex.interfaces.Consumer;
  const ledger = abiIndex.interfaces.Ledger;
  const controlBlockInput = cell?.afterRevert?.blockNumber ?? packet?.sealedInitialState?.blockNumber;
  const controlBlock = blockKey(controlBlockInput);
  const controlBlockFormat = controlBlockInput === undefined || controlBlockInput === null
    ? outcome('UNKNOWN', 'CONTROL_BLOCK_NUMBER_UNAVAILABLE')
    : controlBlock === null
      ? outcome('OBSERVED_MISMATCH', 'CONTROL_BLOCK_NUMBER_MALFORMED', { observed: controlBlockInput })
      : outcome('OBSERVED_MATCH', 'CONTROL_BLOCK_NUMBER_FORMAT_VALID', { observed: controlBlock });

  const writeSequence = cellId === 'native-one'
    ? nativeWriteConsistency(transactions, ledger)
    : signedWriteTupleConsistency(transactions, ledger, targets, basisMap, expectations);
  let controlRecords;
  if (writeSequence.status === 'OBSERVED_MATCH') {
    controlRecords = combine('CONTROL_RECORDS', [
      targets,
      controlBlockFormat,
      observeRecord(raw, ledger, controlBlock, writeSequence.create.recordId, targets, basisMap),
      observeRecord(raw, ledger, controlBlock, writeSequence.edit.recordId, targets, basisMap),
    ]);
  } else if (writeSequence.status === 'OBSERVED_MISMATCH') {
    controlRecords = outcome('OBSERVED_MISMATCH', 'WRITE_IDENTITY_MISMATCH_PREVENTS_CONTROL_RECORD_CORRELATION');
  } else if (writeSequence.status === 'UNSUPPORTED') {
    controlRecords = outcome('UNKNOWN', 'CONTROL_RECORD_ABSENCE_NOT_OBSERVED_WITH_CORRELATABLE_RAW_CALLS', {
      blocker: 'write selector lacks an authorized ABI, so its Record identities cannot be selected without candidate summaries',
    });
  } else {
    controlRecords = outcome('UNKNOWN', 'WRITE_RECORD_IDENTITIES_UNAVAILABLE_FOR_CONTROL_LOOKUP');
  }

  const controlSpecs = [
    ['lastAdmission', '0x519ef1f8', undefined],
    ['lastCount', '0x6b16ad67', undefined],
    ['lastRevision', '0xe08871ca', '0'],
    ['lastScanned', '0x336d5392', undefined],
    ['lastStatus', '0xd6d86712', undefined],
    ['lastTarget', '0x36abbd1d', ZERO_WORD],
    ['lastValue', '0x43183834', '0'],
  ];
  const pinnedControl = pinsAreIndependent(options) && options?.expectedConsumerControl
    && typeof options.expectedConsumerControl === 'object'
    ? options.expectedConsumerControl
    : null;
  const controlObservations = controlSpecs.map(([name, selector, frozenExpected]) => observeFunction({
    raw,
    surface: 'Consumer',
    name,
    selector,
    block: controlBlock,
    expected: pinnedControl && Object.prototype.hasOwnProperty.call(pinnedControl, name)
      ? plain(pinnedControl[name])
      : frozenExpected,
    iface: consumer,
    targets,
    basisMap,
  }));
  const missingControlPins = controlSpecs
    .map(([name]) => name)
    .filter((name) => !pinnedControl || !Object.prototype.hasOwnProperty.call(pinnedControl, name));
  const controlPinAuthority = missingControlPins.length === 0
    ? outcome('OBSERVED_MATCH', 'FULL_CONSUMER_CONTROL_VECTOR_INDEPENDENTLY_PINNED', {
      pinStanding: options.pinStanding,
    })
    : outcome('UNKNOWN', 'FULL_CONSUMER_CONTROL_VECTOR_UNPINNED', {
      missingFields: missingControlPins,
      pinStanding: options?.pinStanding ?? 'UNAVAILABLE',
    });
  const controlCallSet = stageCallSet({
    raw,
    surface: 'Consumer',
    block: controlBlock,
    expectedSelectors: controlSpecs.map(([, selector]) => selector),
    options,
    label: `${cellId}.control`,
  });
  const controlConsumer = combine('CONTROL_CONSUMER', [
    targets,
    controlBlockFormat,
    controlPinAuthority,
    controlCallSet,
    ...controlObservations,
  ], {
    scope: 'all seven authorized Consumer getters; three values also come from the frozen matrix',
    basis: controlObservations.find((item) => item.basis)?.basis
      ?? basisResult(controlBlock, [], basisMap),
  });

  const readQuote = transactionFor(transactions, 'Consumer', 'readQuote', '0x6a59728b', consumer, targets, basisMap);
  let paidQuoteRead;
  if (readQuote.status !== 'OBSERVED_MATCH') {
    paidQuoteRead = outcome(readQuote.status, 'PAID_QUOTE_TRANSACTION_UNAVAILABLE_OR_INVALID', { transaction: readQuote });
  } else {
    const block = readQuote.item.block;
    const coordinates = coordinateExpectation(options, cellId, 'readQuote', readQuote.args);
    const callSet = stageCallSet({
      raw,
      surface: 'Consumer',
      block,
      expectedSelectors: ['0x36abbd1d', '0xe08871ca', '0x43183834'],
      options,
      label: `${cellId}.paid-quote-read`,
    });
    const targetExpected = writeSequence.status === 'OBSERVED_MATCH' ? writeSequence.edit.recordId : undefined;
    const target = observeFunction({
      raw, surface: 'Consumer', name: 'lastTarget', selector: '0x36abbd1d', block,
      expected: targetExpected, iface: consumer, targets, basisMap,
    });
    const revision = observeFunction({
      raw, surface: 'Consumer', name: 'lastRevision', selector: '0xe08871ca', block,
      expected: '2', iface: consumer, targets, basisMap,
    });
    const value = observeFunction({
      raw, surface: 'Consumer', name: 'lastValue', selector: '0x43183834', block,
      expected: '3100', iface: consumer, targets, basisMap,
    });
    const parts = [targets, readQuote, coordinates, callSet, target, revision, value];
    if (writeSequence.status === 'OBSERVED_MATCH') {
      parts.push(orderedAfter(writeSequence.edit.basis.blockNumber, block, 'edit-before-paid-quote'));
      parts.push(readQuote.args[2] === writeSequence.edit.subject
        ? outcome('OBSERVED_MATCH', 'READ_QUOTE_SUBJECT_MATCHES_EDIT_SUBJECT', {
          observedSubject: readQuote.args[2],
        })
        : outcome('OBSERVED_MISMATCH', 'READ_QUOTE_SUBJECT_DIFFERS_FROM_EDIT_SUBJECT', {
          expectedSubject: writeSequence.edit.subject,
          observedSubject: readQuote.args[2],
        }));
    }
    if (targetExpected === undefined && !parts.some((part) => part.status === 'OBSERVED_MISMATCH')) {
      parts.push(outcome(writeSequence.status === 'UNSUPPORTED' ? 'UNSUPPORTED' : 'UNKNOWN', 'EDIT_RECORD_ID_UNAVAILABLE'));
    }
    paidQuoteRead = combine('PAID_QUOTE_READ', parts, {
      selectedTargetExpectation: targetExpected ?? 'UNAVAILABLE',
      basis: target.basis ?? revision.basis ?? value.basis ?? basisResult(block, [], basisMap),
    });
  }

  const readList = transactionFor(transactions, 'Consumer', 'readList', '0xd67f2355', consumer, targets, basisMap);
  let listing;
  if (readList.status !== 'OBSERVED_MATCH') {
    listing = outcome(readList.status, 'LIST_TRANSACTION_UNAVAILABLE_OR_INVALID', { transaction: readList });
  } else {
    const coordinates = coordinateExpectation(options, cellId, 'readList', readList.args);
    const callSet = stageCallSet({
      raw,
      surface: 'Consumer',
      block: readList.item.block,
      expectedSelectors: ['0x6b16ad67'],
      options,
      label: `${cellId}.listing`,
    });
    const count = observeFunction({
      raw, surface: 'Consumer', name: 'lastCount', selector: '0x6b16ad67', block: readList.item.block,
      expected: '1', iface: consumer, targets, basisMap,
    });
    const parts = [targets, readList, coordinates, callSet, count];
    if (readQuote.status === 'OBSERVED_MATCH') {
      parts.push(orderedAfter(readQuote.item.block, readList.item.block, 'paid-quote-before-listing'));
    } else {
      parts.push(outcome(readQuote.status, 'PRIOR_PAID_QUOTE_TRANSACTION_UNAVAILABLE_OR_INVALID', {
        transaction: readQuote,
      }));
    }
    listing = combine('LISTING', parts, {
      scope: 'selected-name count plus independently pinned query coordinates when such a test-only pin is supplied',
      basis: count.basis ?? basisResult(readList.item.block, [], basisMap),
    });
  }

  return {
    cellId,
    packetKey,
    rawTupleCount: raw.length,
    transactionCount: transactions.length,
    axes: {
      transportCorrelation: transportCorrelation(raw),
      targetConsistency: targets,
      writeSequence,
      bodyScalarSemantics: outcome('UNSUPPORTED', profile.bodyCodec?.reason ?? 'BODY_CODEC_UNSUPPORTED'),
      controlRecords,
      controlConsumer,
      paidQuoteRead,
      listing,
    },
  };
}

function cellPacketKey(packet, cellId) {
  const quoteKey = `${cellId}/quote`;
  return Object.prototype.hasOwnProperty.call(packet?.cells ?? {}, quoteKey) ? quoteKey : null;
}

function statusSummary(cells) {
  const counts = { OBSERVED_MATCH: 0, OBSERVED_MISMATCH: 0, UNKNOWN: 0, UNSUPPORTED: 0 };
  for (const cell of cells) {
    for (const axis of Object.values(cell.axes)) counts[axis.status] += 1;
  }
  return counts;
}

export function analyzeRpcObserved(packet, profile, expectations, options = {}) {
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) throw new TypeError('MALFORMED_RPC_OBSERVED_PACKET');
  if (expectations?.assumption?.status !== 'RPC_OBSERVED') throw new TypeError('MISSING_RPC_OBSERVED_EXPECTATION');
  const abiIndex = buildAbiIndex(profile);
  const expectedCellIds = expectations.cells.map((cell) => cell.id);
  const cells = expectedCellIds.map((cellId) => {
    const key = cellPacketKey(packet, cellId);
    return analyzeCell(packet, key, cellId, profile, expectations, abiIndex, options);
  });
  const examinedKeys = new Set(cells.map((cell) => cell.packetKey).filter((key) => key !== 'UNAVAILABLE'));
  const unexaminedCellKeys = Object.keys(packet.cells ?? {}).filter((key) => !examinedKeys.has(key)).sort();

  return {
    kind: 'EFS_RPC_OBSERVED_REPORT',
    version: 1,
    assumption: 'RPC_OBSERVED',
    standing: 'raw-byte consistency under supplied observations; not authenticated chain truth or a candidate verdict',
    sourceLabel: options.sourceLabel ?? 'UNSPECIFIED',
    input: options.input ?? {},
    independentPins: {
      standing: pinsAreIndependent(options) ? options.pinStanding : 'UNAVAILABLE',
      targets: pinsAreIndependent(options) && options.expectedTargets ? 'SUPPLIED' : 'UNAVAILABLE',
      consumerControl: pinsAreIndependent(options) && options.expectedConsumerControl ? 'SUPPLIED' : 'UNAVAILABLE',
      queryCoordinates: pinsAreIndependent(options) && options.expectedCoordinates ? 'SUPPLIED' : 'UNAVAILABLE',
    },
    profile: {
      kind: profile.kind,
      candidateSourceAssociation: profile.candidateSourceAssociation,
      artifactEvidence: profile.artifactEvidence,
    },
    cells,
    unexaminedCellKeys,
    summary: statusSummary(cells),
    chainTruth: outcome('UNKNOWN', 'NO_AUTHENTICATED_STATE_PROOF_OR_INDEPENDENT_CHAIN_OBSERVATION'),
    sourceAuthority: outcome('UNKNOWN', 'ABI_AND_RETAINED_BYTES_DO_NOT_PROVE_SOURCE_OR_RUNTIME_AUTHORITY'),
    exactTypeSemantics: outcome('UNSUPPORTED', profile.bodyCodec?.reason ?? 'BODY_CODEC_UNSUPPORTED'),
    completeWorkflow: outcome('UNKNOWN', 'ONLY_FROZEN_MATRIX_AXES_AND_RETAINED_FIELDS_WERE_EXAMINED'),
    candidatePass: 'NOT_EVALUATED',
  };
}
