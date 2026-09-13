import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  AbiCoder,
  Interface,
  keccak256,
  toUtf8Bytes,
} = require('ethers');

const PROFILE_GIT_BLOB = '367c836d1952c19c16b3bdf6738675e3ea91233d';
const HEX = /^0x[0-9a-fA-F]*$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HASH = /^0x[0-9a-fA-F]{64}$/;
const STATUSES = new Set(['OBSERVED_MATCH', 'OBSERVED_MISMATCH', 'UNKNOWN', 'UNSUPPORTED']);

function bytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  return Buffer.from(value);
}

export function gitBlobHash(value) {
  const content = bytes(value);
  return createHash('sha1')
    .update(Buffer.from(`blob ${content.length}\0`))
    .update(content)
    .digest('hex');
}

function parseJson(value, label) {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes(value));
    return JSON.parse(text);
  } catch (error) {
    throw new TypeError(`MALFORMED_${label}:${error.message}`);
  }
}

export function parsePinnedRichConsumerProfile(profileBytes) {
  if (gitBlobHash(profileBytes) !== PROFILE_GIT_BLOB) {
    throw new TypeError('RICH_CONSUMER_PROFILE_BLOB_MISMATCH');
  }
  const profile = parseJson(profileBytes, 'RICH_CONSUMER_PROFILE');
  if (profile?.kind !== 'EFS_RICH_CONSUMER_OBSERVATION_PROFILE'
    || profile.version !== 1
    || profile.frozenBeforeNewPacket !== true
    || !Array.isArray(profile.getters)
    || profile.getters.length !== 7) {
    throw new TypeError('INVALID_RICH_CONSUMER_PROFILE');
  }
  return profile;
}

export function parsePinnedRpcAbiProfile(abiProfileBytes, profile) {
  if (gitBlobHash(abiProfileBytes) !== profile?.source?.publicAbiProfile?.gitBlob) {
    throw new TypeError('RICH_CONSUMER_ABI_PROFILE_BLOB_MISMATCH');
  }
  const abiProfile = parseJson(abiProfileBytes, 'RICH_CONSUMER_ABI_PROFILE');
  const consumerEvidence = abiProfile?.artifactEvidence?.find(
    ({ artifact }) => artifact === profile.source.consumerArtifact.artifact,
  );
  if (abiProfile?.candidateSourceAssociation !== profile.source.coreSourceAssociation
    || consumerEvidence?.sha256 !== profile.source.consumerArtifact.sha256
    || consumerEvidence?.gitBlob !== profile.source.consumerArtifact.gitBlob) {
    throw new TypeError('RICH_CONSUMER_ABI_PROFILE_SOURCE_MISMATCH');
  }
  return abiProfile;
}

function outcome(status, reason, extra = {}) {
  if (!STATUSES.has(status)) throw new TypeError(`INVALID_RICH_CONSUMER_STATUS:${status}`);
  return { status, reason, ...extra };
}

function combine(label, parts, extra = {}) {
  if (parts.some((part) => part?.status === 'OBSERVED_MISMATCH')) {
    return outcome('OBSERVED_MISMATCH', `${label}:AT_LEAST_ONE_COMPONENT_MISMATCH`, {
      components: parts,
      ...extra,
    });
  }
  if (parts.some((part) => part?.status === 'UNSUPPORTED')) {
    return outcome('UNSUPPORTED', `${label}:AT_LEAST_ONE_COMPONENT_UNSUPPORTED`, {
      components: parts,
      ...extra,
    });
  }
  if (parts.some((part) => part?.status === 'UNKNOWN')) {
    return outcome('UNKNOWN', `${label}:AT_LEAST_ONE_COMPONENT_UNKNOWN`, {
      components: parts,
      ...extra,
    });
  }
  return outcome('OBSERVED_MATCH', `${label}:ALL_COMPONENTS_MATCH`, {
    components: parts,
    ...extra,
  });
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeHex(value, label, exactBytes) {
  if (typeof value !== 'string' || !HEX.test(value) || value.length % 2 !== 0) {
    throw new TypeError(`MALFORMED_${label}: expected even-length 0x-prefixed hex`);
  }
  if (exactBytes !== undefined && value.length !== 2 + (exactBytes * 2)) {
    throw new TypeError(`MALFORMED_${label}: expected ${exactBytes} bytes`);
  }
  return value.toLowerCase();
}

function normalizeAddress(value) {
  return typeof value === 'string' && ADDRESS.test(value) ? value.toLowerCase() : null;
}

function normalizeHash(value) {
  return typeof value === 'string' && HASH.test(value) ? value.toLowerCase() : null;
}

function blockKey(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value);
  if (typeof value === 'bigint' && value >= 0n) return value.toString();
  if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)) {
    return BigInt(value).toString();
  }
  if (typeof value === 'string' && /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(value)) {
    return BigInt(value).toString();
  }
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

function comparison(computed, supplied) {
  const left = plain(computed);
  const right = plain(supplied);
  return {
    status: JSON.stringify(left) === JSON.stringify(right) ? 'MATCH' : 'MISMATCH',
    computed: left,
    supplied: right,
  };
}

function deriveIdentity(profile) {
  const record = profile.recordIdentity;
  const rawBody = normalizeHex(record.quote3100RawBody, 'QUOTE_3100_RAW_BODY');
  const typeId = keccak256(toUtf8Bytes(record.typeDomainText));
  const bodyHash = keccak256(rawBody);
  const recordId = keccak256(AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'bytes32', 'bytes32'],
    [keccak256(toUtf8Bytes(record.recordDomainText)), typeId, bodyHash],
  ));
  const compared = {
    typeId: comparison(typeId, record.comparisonOnly.typeId),
    bodyHash: comparison(bodyHash, record.comparisonOnly.bodyHash),
    recordId: comparison(recordId, record.comparisonOnly.recordId),
  };
  return {
    derived: { typeId, bodyHash, recordId },
    comparisons: Object.fromEntries(Object.entries(compared)
      .map(([name, result]) => [name, result.status])),
    details: compared,
  };
}

function consumerInterface(abiProfile, profile) {
  const declarations = abiProfile?.artifacts?.Consumer?.abi;
  if (!Array.isArray(declarations)) throw new TypeError('MISSING_RICH_CONSUMER_ABI');
  const iface = new Interface(declarations.map(({ selector: _selector, ...entry }) => entry));
  for (const getter of profile.getters) {
    const declaration = declarations.find(({ name }) => name === getter.name);
    const fragment = iface.getFunction(getter.name);
    if (!declaration || declaration.inputs?.length !== 0
      || declaration.outputs?.length !== 1
      || declaration.outputs[0].type !== getter.returnType
      || declaration.selector?.toLowerCase() !== getter.selector
      || fragment.selector.toLowerCase() !== getter.selector) {
      throw new TypeError(`RICH_CONSUMER_GETTER_ABI_MISMATCH:${getter.name}`);
    }
  }
  for (const stage of Object.values(profile.stages)) {
    const { name, selector } = stage.transaction;
    const declaration = declarations.find((entry) => entry.name === name);
    if (!declaration || declaration.selector?.toLowerCase() !== selector
      || iface.getFunction(name).selector.toLowerCase() !== selector) {
      throw new TypeError(`RICH_CONSUMER_TRANSACTION_ABI_MISMATCH:${name}`);
    }
  }
  return iface;
}

function issue(status, reason, extra = {}) {
  return { status, reason, ...extra };
}

function present(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function prepareTransactions(value, cellId) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError(`MALFORMED_RICH_TRANSACTIONS_CONTAINER:${cellId}`);
  return value.map((raw, index) => {
    if (!isObject(raw)) throw new TypeError(`MALFORMED_RICH_TRANSACTION_ENTRY:${cellId}:${index}`);
    const issues = [];
    let to = null;
    if (!present(raw, 'to')) {
      issues.push(issue('UNKNOWN', 'TRANSACTION_TARGET_MISSING'));
    } else {
      to = normalizeAddress(raw.to);
      if (to === null) issues.push(issue('OBSERVED_MISMATCH', 'TRANSACTION_TARGET_MALFORMED'));
    }
    let data = null;
    if (!present(raw, 'data')) {
      issues.push(issue('UNKNOWN', 'TRANSACTION_CALLDATA_MISSING'));
    } else {
      try {
        data = normalizeHex(raw.data, `RICH_TRANSACTION_CALLDATA_${cellId}_${index}`);
        if (data.length < 10) issues.push(issue('OBSERVED_MISMATCH', 'TRANSACTION_SELECTOR_MISSING'));
      } catch (error) {
        issues.push(issue('OBSERVED_MISMATCH', 'TRANSACTION_CALLDATA_MALFORMED', { error: error.message }));
      }
    }
    const selector = data?.length >= 10 ? data.slice(0, 10) : null;
    let block = null;
    let blockHash = null;
    if (!present(raw, 'receipt')) {
      issues.push(issue('UNKNOWN', 'TRANSACTION_RECEIPT_MISSING'));
    } else if (!isObject(raw.receipt)) {
      issues.push(issue('OBSERVED_MISMATCH', 'TRANSACTION_RECEIPT_MALFORMED'));
    } else {
      if (!present(raw.receipt, 'blockNumber')) {
        issues.push(issue('UNKNOWN', 'TRANSACTION_RECEIPT_BLOCK_NUMBER_MISSING'));
      } else {
        block = blockKey(raw.receipt.blockNumber);
        if (block === null) {
          issues.push(issue('OBSERVED_MISMATCH', 'TRANSACTION_RECEIPT_BLOCK_NUMBER_MALFORMED'));
        }
      }
      if (!present(raw.receipt, 'blockHash')) {
        issues.push(issue('UNKNOWN', 'TRANSACTION_RECEIPT_BLOCK_HASH_MISSING'));
      } else {
        blockHash = normalizeHash(raw.receipt.blockHash);
        if (blockHash === null) {
          issues.push(issue('OBSERVED_MISMATCH', 'TRANSACTION_RECEIPT_BLOCK_HASH_MALFORMED'));
        }
      }
      if (!present(raw.receipt, 'status')) {
        issues.push(issue('UNKNOWN', 'TRANSACTION_RECEIPT_STATUS_MISSING'));
      } else if (![1, '1', '0x1'].includes(raw.receipt.status)) {
        issues.push(issue('OBSERVED_MISMATCH', 'TRANSACTION_RECEIPT_NOT_SUCCESSFUL', {
          observed: raw.receipt.status,
        }));
      }
    }
    return { index, raw, to, data, selector, block, blockHash, issues };
  });
}

function validRpcId(value) {
  return typeof value === 'string' || (typeof value === 'number' && Number.isSafeInteger(value));
}

function prepareRaw(value, cellId) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError(`MALFORMED_RICH_RAW_CONTAINER:${cellId}`);
  return value.map((raw, index) => {
    if (!isObject(raw)) throw new TypeError(`MALFORMED_RICH_RAW_ENTRY:${cellId}:${index}`);
    const issues = [];
    let to = null;
    if (!present(raw, 'to')) {
      issues.push(issue('UNKNOWN', 'RAW_TARGET_MISSING'));
    } else {
      to = normalizeAddress(raw.to);
      if (to === null) issues.push(issue('OBSERVED_MISMATCH', 'RAW_TARGET_MALFORMED'));
    }
    let calldata = null;
    if (!present(raw, 'calldata')) {
      issues.push(issue('UNKNOWN', 'RAW_CALLDATA_MISSING'));
    } else {
      try {
        calldata = normalizeHex(raw.calldata, `RICH_RAW_CALLDATA_${cellId}_${index}`);
        if (calldata.length < 10) issues.push(issue('OBSERVED_MISMATCH', 'RAW_SELECTOR_MISSING'));
      } catch (error) {
        issues.push(issue('OBSERVED_MISMATCH', 'RAW_CALLDATA_MALFORMED', { error: error.message }));
      }
    }
    const selector = calldata?.length >= 10 ? calldata.slice(0, 10) : null;
    let returnData = null;
    if (!present(raw, 'returnData') || raw.returnData === null) {
      issues.push(issue('UNKNOWN', 'RAW_RETURN_MISSING'));
    } else {
      try {
        returnData = normalizeHex(raw.returnData, `RICH_RAW_RETURN_${cellId}_${index}`);
      } catch (error) {
        issues.push(issue('OBSERVED_MISMATCH', 'RAW_RETURN_MALFORMED', { error: error.message }));
      }
    }
    let block = null;
    if (!present(raw, 'blockTag')) {
      issues.push(issue('UNKNOWN', 'RAW_BLOCK_PARAMETER_MISSING'));
    } else {
      block = blockKey(raw.blockTag);
      if (block === null) issues.push(issue('OBSERVED_MISMATCH', 'RAW_BLOCK_PARAMETER_MALFORMED'));
    }
    let blockHash = null;
    if (!present(raw, 'blockHash')) {
      issues.push(issue('UNKNOWN', 'RAW_BLOCK_HASH_MISSING'));
    } else {
      blockHash = normalizeHash(raw.blockHash);
      if (blockHash === null) issues.push(issue('OBSERVED_MISMATCH', 'RAW_BLOCK_HASH_MALFORMED'));
    }
    if (!present(raw, 'source')) {
      issues.push(issue('UNKNOWN', 'RAW_SOURCE_MISSING'));
    } else if (typeof raw.source !== 'string' || raw.source.length === 0) {
      issues.push(issue('OBSERVED_MISMATCH', 'RAW_SOURCE_MALFORMED'));
    }
    if (!present(raw, 'rpcId')) {
      issues.push(issue('UNKNOWN', 'RAW_RPC_ID_MISSING'));
    } else if (!validRpcId(raw.rpcId)) {
      issues.push(issue('OBSERVED_MISMATCH', 'RAW_RPC_ID_MALFORMED'));
    }
    if (!present(raw, 'method')) {
      issues.push(issue('UNKNOWN', 'RAW_METHOD_MISSING'));
    } else if (raw.method !== 'eth_call') {
      issues.push(issue('OBSERVED_MISMATCH', 'RAW_METHOD_NOT_ETH_CALL'));
    }

    const request = raw.request;
    const response = raw.response;
    if (!present(raw, 'request') || !present(raw, 'response')) {
      issues.push(issue('UNKNOWN', 'RPC_REQUEST_OR_RESPONSE_MISSING'));
    } else if (!isObject(request) || !isObject(response)) {
      issues.push(issue('OBSERVED_MISMATCH', 'RPC_REQUEST_OR_RESPONSE_MALFORMED'));
    } else {
      if (request.jsonrpc !== '2.0' || response.jsonrpc !== '2.0') {
        issues.push(issue('OBSERVED_MISMATCH', 'RPC_JSON_VERSION_MISMATCH'));
      }
      if (!validRpcId(request.id) || !validRpcId(response.id)) {
        issues.push(issue('OBSERVED_MISMATCH', 'RPC_ID_MALFORMED'));
      } else if (request.id !== response.id) {
        issues.push(issue('OBSERVED_MISMATCH', 'RPC_ID_DISAGREEMENT'));
      } else if (present(raw, 'rpcId') && validRpcId(raw.rpcId) && request.id !== raw.rpcId) {
        issues.push(issue('OBSERVED_MISMATCH', 'RPC_FLAT_ID_DISAGREEMENT'));
      }
      if (request.method !== 'eth_call') {
        issues.push(issue('OBSERVED_MISMATCH', 'RPC_METHOD_DISAGREEMENT'));
      } else if (present(raw, 'method') && request.method !== raw.method) {
        issues.push(issue('OBSERVED_MISMATCH', 'RPC_FLAT_METHOD_DISAGREEMENT'));
      }
      if (!Array.isArray(request.params) || request.params.length !== 2
        || !isObject(request.params[0])) {
        issues.push(issue('OBSERVED_MISMATCH', 'RPC_PARAMS_MALFORMED'));
      } else {
        const callKeys = Object.keys(request.params[0]).sort();
        if (JSON.stringify(callKeys) !== JSON.stringify(['data', 'to'])) {
          issues.push(issue('OBSERVED_MISMATCH', 'RPC_CALL_OBJECT_FIELDS_SUBSTITUTED', {
            observedKeys: callKeys,
          }));
        }
        const requestTo = normalizeAddress(request.params[0].to);
        let requestData = null;
        try {
          requestData = normalizeHex(request.params[0].data, 'RICH_RPC_REQUEST_CALLDATA');
        } catch (error) {
          issues.push(issue('OBSERVED_MISMATCH', 'RPC_REQUEST_CALLDATA_MALFORMED', {
            error: error.message,
          }));
        }
        const requestBlock = blockKey(request.params[1]);
        if (requestTo === null || requestData === null) {
          issues.push(issue('OBSERVED_MISMATCH', 'RPC_REQUEST_CALL_MALFORMED'));
        } else if (to !== null && calldata !== null
          && (requestTo !== to || requestData !== calldata)) {
          issues.push(issue('OBSERVED_MISMATCH', 'RPC_REQUEST_FLAT_CALL_DISAGREEMENT'));
        }
        if (requestBlock === null) {
          issues.push(issue('OBSERVED_MISMATCH', 'RPC_REQUEST_BASIS_MALFORMED'));
        } else if (block !== null && requestBlock !== block) {
          issues.push(issue('OBSERVED_MISMATCH', 'RPC_REQUEST_FLAT_BASIS_DISAGREEMENT'));
        }
      }
      const hasResult = present(response, 'result');
      const hasError = present(response, 'error');
      if (hasResult === hasError) {
        issues.push(issue('OBSERVED_MISMATCH', 'RPC_RESPONSE_RESULT_ERROR_EXCLUSIVITY'));
      } else if (hasResult) {
        let result = null;
        try {
          result = normalizeHex(response.result, 'RICH_RPC_RESPONSE_RESULT');
        } catch (error) {
          issues.push(issue('OBSERVED_MISMATCH', 'RPC_RESPONSE_RESULT_MALFORMED', {
            error: error.message,
          }));
        }
        if (result !== null && returnData !== null && result !== returnData) {
          issues.push(issue('OBSERVED_MISMATCH', 'RPC_RESPONSE_FLAT_RETURN_DISAGREEMENT'));
        }
      } else if (!isObject(response.error)
        || !Number.isSafeInteger(response.error.code)
        || typeof response.error.message !== 'string') {
        issues.push(issue('OBSERVED_MISMATCH', 'RPC_RESPONSE_ERROR_MALFORMED'));
      } else if (returnData !== null) {
        issues.push(issue('OBSERVED_MISMATCH', 'RPC_ERROR_CONFLICTS_WITH_FLAT_RETURN'));
      } else {
        issues.push(issue('UNKNOWN', 'RPC_RESPONSE_EXPLICIT_ERROR'));
      }
    }
    return {
      index,
      raw,
      to,
      calldata,
      selector,
      returnData,
      block,
      blockHash,
      issues,
    };
  });
}

function integrityOutcome(raw, transactions) {
  const entries = [
    ...raw.flatMap((item) => item.issues.map((entry) => ({ ...entry, source: 'raw', index: item.index }))),
    ...transactions.flatMap((item) => item.issues
      .map((entry) => ({ ...entry, source: 'transaction', index: item.index }))),
  ];
  const ids = new Map();
  for (const item of raw) {
    if (!validRpcId(item.raw.rpcId)) continue;
    const indexes = ids.get(item.raw.rpcId) ?? [];
    indexes.push(item.index);
    ids.set(item.raw.rpcId, indexes);
  }
  for (const [rpcId, indexes] of ids) {
    if (indexes.length > 1) {
      entries.push(issue('OBSERVED_MISMATCH', 'DUPLICATE_RPC_ID', { rpcId, indexes }));
    }
  }
  if (entries.some(({ status }) => status === 'OBSERVED_MISMATCH')) {
    return outcome('OBSERVED_MISMATCH', 'SCOPED_INPUT_CONTAINS_MALFORMED_OR_CONFLICTING_ENTRY', {
      issues: entries,
    });
  }
  if (entries.some(({ status }) => status === 'UNKNOWN')) {
    return outcome('UNKNOWN', 'SCOPED_INPUT_MISSING_REQUIRED_FIELD', { issues: entries });
  }
  return outcome('OBSERVED_MATCH', 'EVERY_SCOPED_INPUT_ENTRY_VALIDATED');
}

function exactPin(observed, expected, label) {
  if (observed === undefined || observed === null) {
    return outcome('UNKNOWN', `${label}_PIN_MISSING`, { expected });
  }
  if (observed !== expected) {
    return outcome('OBSERVED_MISMATCH', `${label}_PIN_MISMATCH`, { expected, observed });
  }
  return outcome('OBSERVED_MATCH', `${label}_PIN_MATCH`, { expected, observed });
}

function provenanceOutcome(profile, pins, input) {
  return combine('RICH_PROVENANCE', [
    exactPin(pins?.standing, profile.pinContract.standing, 'PIN_STANDING'),
    exactPin(
      pins?.measurementSourceAssociation,
      profile.source.measurementSourceAssociation.commit,
      'MEASUREMENT_SOURCE_ASSOCIATION',
    ),
    exactPin(
      pins?.coreSourceAssociation,
      profile.source.coreSourceAssociation,
      'CORE_SOURCE_ASSOCIATION',
    ),
    exactPin(input?.profileGitBlob, PROFILE_GIT_BLOB, 'RICH_PROFILE_GIT_BLOB'),
    exactPin(
      input?.abiProfileGitBlob,
      profile.source.publicAbiProfile.gitBlob,
      'PUBLIC_ABI_PROFILE_GIT_BLOB',
    ),
  ]);
}

function targetPinOutcome(pins) {
  if (pins?.consumerTarget === undefined || pins.consumerTarget === null) {
    return outcome('UNKNOWN', 'INDEPENDENT_CONSUMER_TARGET_PIN_MISSING');
  }
  const target = normalizeAddress(pins.consumerTarget);
  if (target === null) {
    return outcome('OBSERVED_MISMATCH', 'INDEPENDENT_CONSUMER_TARGET_PIN_MALFORMED', {
      observed: pins.consumerTarget,
    });
  }
  return outcome('OBSERVED_MATCH', 'INDEPENDENT_CONSUMER_TARGET_PIN_WELL_FORMED', { target });
}

function entryIssuesOutcome(issues, label) {
  if (issues.some(({ status }) => status === 'OBSERVED_MISMATCH')) {
    return outcome('OBSERVED_MISMATCH', `${label}_ENTRY_MALFORMED_OR_CONFLICTING`, { issues });
  }
  if (issues.some(({ status }) => status === 'UNKNOWN')) {
    return outcome('UNKNOWN', `${label}_ENTRY_REQUIRED_FIELD_MISSING`, { issues });
  }
  return outcome('OBSERVED_MATCH', `${label}_ENTRY_FIELDS_PRESENT_AND_WELL_FORMED`);
}

function transactionCallSetOutcome(transactions, profile) {
  const selectors = new Set(Object.values(profile.stages)
    .map(({ transaction }) => transaction.selector));
  const unexpected = transactions
    .filter((item) => item.selector !== null && !selectors.has(item.selector))
    .map((item) => ({ index: item.index, selector: item.selector }));
  if (unexpected.length > 0) {
    return outcome('OBSERVED_MISMATCH', 'SUBSTITUTED_OR_UNDECLARED_SCOPED_TRANSACTION', {
      unexpected,
    });
  }
  const multiplicities = Object.fromEntries(Object.entries(profile.stages)
    .map(([stageId, stage]) => [stageId, transactions
      .filter(({ selector }) => selector === stage.transaction.selector).length]));
  if (Object.values(multiplicities).some((count) => count > 1)) {
    return outcome('OBSERVED_MISMATCH', 'DUPLICATE_SCOPED_TRANSACTION', { multiplicities });
  }
  if (Object.values(multiplicities).some((count) => count === 0)) {
    return outcome('UNKNOWN', 'REQUIRED_SCOPED_TRANSACTION_MISSING', { multiplicities });
  }
  return outcome('OBSERVED_MATCH', 'EXACTLY_ONE_TRANSACTION_PER_SCOPED_STAGE', {
    multiplicities,
  });
}

function transactionForStage({ transactions, profile, iface, pins, cellId, stageId }) {
  const stage = profile.stages[stageId];
  const matching = transactions.filter(({ selector }) => selector === stage.transaction.selector);
  if (matching.length === 0) {
    return {
      outcome: outcome('UNKNOWN', `TRANSACTION_MISSING:${stage.transaction.name}`),
      item: null,
      block: null,
      blockHash: null,
    };
  }
  if (matching.length > 1) {
    return {
      outcome: outcome('OBSERVED_MISMATCH', `TRANSACTION_DUPLICATED:${stage.transaction.name}`, {
        indexes: matching.map(({ index }) => index),
      }),
      item: null,
      block: null,
      blockHash: null,
    };
  }

  const [item] = matching;
  const parts = [entryIssuesOutcome(item.issues, `TRANSACTION_${stage.transaction.name}`)];
  const targetPin = targetPinOutcome(pins);
  if (targetPin.status !== 'OBSERVED_MATCH') {
    parts.push(targetPin);
  } else if (item.to === null) {
    parts.push(outcome('UNKNOWN', 'TRANSACTION_TARGET_UNAVAILABLE'));
  } else if (item.to !== targetPin.target) {
    parts.push(outcome('OBSERVED_MISMATCH', 'TRANSACTION_TARGET_DIFFERS_FROM_INDEPENDENT_PIN', {
      expected: targetPin.target,
      observed: item.to,
    }));
  } else {
    parts.push(outcome('OBSERVED_MATCH', 'TRANSACTION_TARGET_MATCHES_INDEPENDENT_PIN', {
      target: item.to,
    }));
  }

  if (item.data === null) {
    parts.push(outcome('UNKNOWN', 'TRANSACTION_CALLDATA_UNAVAILABLE'));
  } else {
    try {
      const decoded = iface.decodeFunctionData(stage.transaction.name, item.data);
      const canonical = iface.encodeFunctionData(stage.transaction.name, [...decoded]).toLowerCase();
      parts.push(canonical === item.data
        ? outcome('OBSERVED_MATCH', 'TRANSACTION_CALLDATA_CANONICAL', {
          decodedCoordinates: plain([...decoded]),
        })
        : outcome('OBSERVED_MISMATCH', 'TRANSACTION_CALLDATA_NON_CANONICAL', {
          canonical,
          observed: item.data,
        }));
    } catch (error) {
      parts.push(outcome('OBSERVED_MISMATCH', 'TRANSACTION_CALLDATA_DECODE_FAILED', {
        error: error.message,
      }));
    }
  }

  const stagePin = pins?.cells?.[cellId]?.[stageId];
  if (!isObject(stagePin) || !present(stagePin, 'coordinates')) {
    parts.push(outcome('UNKNOWN', `INDEPENDENT_QUERY_COORDINATES_PIN_MISSING:${stageId}`));
  } else if (!Array.isArray(stagePin.coordinates)) {
    parts.push(outcome('OBSERVED_MISMATCH', `INDEPENDENT_QUERY_COORDINATES_PIN_MALFORMED:${stageId}`));
  } else {
    try {
      const expectedData = iface.encodeFunctionData(
        stage.transaction.name,
        stagePin.coordinates,
      ).toLowerCase();
      parts.push(item.data === expectedData
        ? outcome('OBSERVED_MATCH', `TRANSACTION_COORDINATES_MATCH_INDEPENDENT_PIN:${stageId}`, {
          coordinates: plain(stagePin.coordinates),
        })
        : outcome('OBSERVED_MISMATCH', `TRANSACTION_COORDINATES_DIFFER_FROM_INDEPENDENT_PIN:${stageId}`, {
          expectedCalldata: expectedData,
          observedCalldata: item.data ?? 'UNAVAILABLE',
          pinnedCoordinates: plain(stagePin.coordinates),
        }));
    } catch (error) {
      parts.push(outcome('OBSERVED_MISMATCH', `INDEPENDENT_QUERY_COORDINATES_PIN_INVALID:${stageId}`, {
        error: error.message,
      }));
    }
  }

  return {
    outcome: combine(`TRANSACTION_${stage.transaction.name}`, parts, {
      transactionIndex: item.index,
      receiptBasis: {
        blockNumber: item.block ?? 'UNAVAILABLE',
        blockHash: item.blockHash ?? 'UNAVAILABLE',
        standing: 'ACTUAL_TRANSACTION_RECEIPT_BLOCK_END',
      },
    }),
    item,
    block: item.block,
    blockHash: item.blockHash,
  };
}

function rawCallSetOutcome(raw, selections, profile) {
  const getterSelectors = new Set(profile.getters.map(({ selector }) => selector));
  const knownBases = Object.entries(selections)
    .filter(([, selection]) => selection.item !== null && selection.block !== null)
    .map(([stageId, selection]) => ({ stageId, block: selection.block }));
  const allBasesKnown = knownBases.length === profile.scope.stages.length;
  const issues = [];

  const basesByBlock = new Map();
  for (const basis of knownBases) {
    const stages = basesByBlock.get(basis.block) ?? [];
    stages.push(basis.stageId);
    basesByBlock.set(basis.block, stages);
  }
  for (const [block, stages] of basesByBlock) {
    if (stages.length > 1) {
      issues.push(issue('OBSERVED_MISMATCH', 'RECEIPT_BLOCK_END_BASIS_AMBIGUOUS_BETWEEN_STAGES', {
        blockNumber: block,
        stages,
      }));
    }
  }

  for (const item of raw) {
    if (item.selector !== null && !getterSelectors.has(item.selector)) {
      issues.push(issue('OBSERVED_MISMATCH', 'SUBSTITUTED_OR_UNDECLARED_RAW_CALL', {
        rawIndex: item.index,
        selector: item.selector,
      }));
      continue;
    }
    if (item.selector === null || item.block === null) continue;
    const stages = basesByBlock.get(item.block) ?? [];
    if (stages.length === 0) {
      issues.push(issue(
        allBasesKnown ? 'OBSERVED_MISMATCH' : 'UNKNOWN',
        allBasesKnown
          ? 'RAW_CALL_AT_UNDECLARED_RECEIPT_BASIS'
          : 'RAW_CALL_CANNOT_BE_ASSIGNED_WITH_MISSING_RECEIPT_BASIS',
        { rawIndex: item.index, blockNumber: item.block, selector: item.selector },
      ));
    } else if (stages.length > 1) {
      issues.push(issue('OBSERVED_MISMATCH', 'RAW_CALL_STAGE_ASSIGNMENT_AMBIGUOUS', {
        rawIndex: item.index,
        blockNumber: item.block,
        stages,
      }));
    }
  }

  const multiplicities = {};
  for (const stageId of profile.scope.stages) {
    const block = selections[stageId].block;
    multiplicities[stageId] = {};
    for (const getter of profile.getters) {
      const count = block === null ? 0 : raw.filter((item) => (
        item.block === block && item.selector === getter.selector
      )).length;
      multiplicities[stageId][getter.name] = count;
      if (block === null) continue;
      if (count === 0) {
        issues.push(issue('UNKNOWN', 'REQUIRED_RAW_GETTER_MISSING', {
          stageId,
          getter: getter.name,
          blockNumber: block,
        }));
      } else if (count > 1) {
        issues.push(issue('OBSERVED_MISMATCH', 'DUPLICATE_RAW_GETTER', {
          stageId,
          getter: getter.name,
          blockNumber: block,
          count,
        }));
      }
    }
  }

  if (issues.some(({ status }) => status === 'OBSERVED_MISMATCH')) {
    return outcome('OBSERVED_MISMATCH', 'RICH_RAW_CALL_SET_MISMATCH', {
      issues,
      multiplicities,
      retainedObservationCount: raw.length,
    });
  }
  if (issues.some(({ status }) => status === 'UNKNOWN') || !allBasesKnown) {
    return outcome('UNKNOWN', 'RICH_RAW_CALL_SET_INCOMPLETE', {
      issues,
      multiplicities,
      retainedObservationCount: raw.length,
    });
  }
  return outcome('OBSERVED_MATCH', 'EXACTLY_SEVEN_GETTERS_AT_EACH_RECEIPT_BASIS', {
    multiplicities,
    retainedObservationCount: raw.length,
  });
}

function rawGetterObservation({
  raw,
  selection,
  getter,
  iface,
  pins,
  cellId,
  stageId,
}) {
  if (selection.block === null) {
    return {
      raw: outcome('UNKNOWN', `GETTER_RECEIPT_BASIS_UNAVAILABLE:${getter.name}`),
      observed: 'UNAVAILABLE',
    };
  }
  const matching = raw.filter((item) => (
    item.block === selection.block && item.selector === getter.selector
  ));
  if (matching.length === 0) {
    return {
      raw: outcome('UNKNOWN', `GETTER_OBSERVATION_MISSING:${getter.name}`, {
        expectedBlockNumber: selection.block,
      }),
      observed: 'UNAVAILABLE',
    };
  }
  if (matching.length > 1) {
    return {
      raw: outcome('OBSERVED_MISMATCH', `GETTER_OBSERVATION_DUPLICATED:${getter.name}`, {
        rawIndexes: matching.map(({ index }) => index),
        expectedBlockNumber: selection.block,
      }),
      observed: 'UNAVAILABLE',
    };
  }

  const [item] = matching;
  const parts = [entryIssuesOutcome(item.issues, `RAW_${getter.name}`)];
  const targetPin = targetPinOutcome(pins);
  if (targetPin.status !== 'OBSERVED_MATCH') {
    parts.push(targetPin);
  } else if (item.to === null) {
    parts.push(outcome('UNKNOWN', `GETTER_TARGET_UNAVAILABLE:${getter.name}`));
  } else if (item.to !== targetPin.target) {
    parts.push(outcome('OBSERVED_MISMATCH', `GETTER_TARGET_MISMATCH:${getter.name}`, {
      expected: targetPin.target,
      observed: item.to,
    }));
  } else {
    parts.push(outcome('OBSERVED_MATCH', `GETTER_TARGET_MATCH:${getter.name}`, {
      target: item.to,
    }));
  }

  const canonicalCalldata = iface.encodeFunctionData(getter.name, []).toLowerCase();
  parts.push(item.calldata === canonicalCalldata
    ? outcome('OBSERVED_MATCH', `GETTER_CALLDATA_CANONICAL:${getter.name}`, {
      calldata: item.calldata,
    })
    : outcome('OBSERVED_MISMATCH', `GETTER_CALLDATA_SUBSTITUTED:${getter.name}`, {
      expected: canonicalCalldata,
      observed: item.calldata ?? 'UNAVAILABLE',
    }));

  if (selection.blockHash === null) {
    parts.push(outcome('UNKNOWN', `RECEIPT_BLOCK_HASH_UNAVAILABLE:${getter.name}`));
  } else if (item.blockHash === null) {
    parts.push(outcome('UNKNOWN', `GETTER_BLOCK_HASH_UNAVAILABLE:${getter.name}`));
  } else if (item.blockHash !== selection.blockHash) {
    parts.push(outcome('OBSERVED_MISMATCH', `GETTER_BLOCK_HASH_CONFLICT:${getter.name}`, {
      expected: selection.blockHash,
      observed: item.blockHash,
    }));
  } else {
    parts.push(outcome('OBSERVED_MATCH', `GETTER_BLOCK_HASH_MATCH:${getter.name}`, {
      blockNumber: selection.block,
      blockHash: item.blockHash,
    }));
  }

  const stagePin = pins?.cells?.[cellId]?.[stageId];
  if (!isObject(stagePin) || !present(stagePin, 'source')) {
    parts.push(outcome('UNKNOWN', `INDEPENDENT_VALUE_SOURCE_PIN_MISSING:${getter.name}`));
  } else if (typeof stagePin.source !== 'string' || stagePin.source.length === 0) {
    parts.push(outcome('OBSERVED_MISMATCH', `INDEPENDENT_VALUE_SOURCE_PIN_MALFORMED:${getter.name}`));
  } else if (!present(item.raw, 'source')) {
    parts.push(outcome('UNKNOWN', `GETTER_VALUE_SOURCE_UNAVAILABLE:${getter.name}`, {
      expected: stagePin.source,
    }));
  } else if (item.raw.source !== stagePin.source) {
    parts.push(outcome('OBSERVED_MISMATCH', `GETTER_VALUE_SOURCE_MISMATCH:${getter.name}`, {
      expected: stagePin.source,
      observed: item.raw.source ?? 'UNAVAILABLE',
    }));
  } else {
    parts.push(outcome('OBSERVED_MATCH', `GETTER_VALUE_SOURCE_MATCH:${getter.name}`, {
      source: item.raw.source,
    }));
  }

  let observed = 'UNAVAILABLE';
  if (item.returnData === null) {
    parts.push(outcome('UNKNOWN', `GETTER_RETURN_UNAVAILABLE:${getter.name}`));
  } else {
    try {
      const decoded = iface.decodeFunctionResult(getter.name, item.returnData);
      const canonical = iface.encodeFunctionResult(getter.name, [...decoded]).toLowerCase();
      if (canonical !== item.returnData || decoded.length !== 1) {
        parts.push(outcome('OBSERVED_MISMATCH', `GETTER_RETURN_NON_CANONICAL:${getter.name}`, {
          expectedCanonical: canonical,
          observedBytes: item.returnData,
        }));
      } else {
        observed = plain(decoded[0]);
        parts.push(outcome('OBSERVED_MATCH', `GETTER_RETURN_DECODES_AS_DECLARED:${getter.name}`, {
          returnType: getter.returnType,
          returnData: item.returnData,
          observed,
        }));
      }
    } catch (error) {
      parts.push(outcome('OBSERVED_MISMATCH', `GETTER_RETURN_DECODE_FAILED:${getter.name}`, {
        returnType: getter.returnType,
        error: error.message,
      }));
    }
  }

  return {
    raw: combine(`RAW_GETTER_${getter.name}`, parts, {
      rawIndex: item.index,
      blockNumber: selection.block,
    }),
    observed,
  };
}

function semanticOutcome(rawCollection, observed, expected, getterName, stageId) {
  if (rawCollection.status === 'OBSERVED_MISMATCH') {
    return outcome('OBSERVED_MISMATCH', `SEMANTIC_COMPARISON_BLOCKED_BY_RAW_MISMATCH:${stageId}.${getterName}`, {
      expected,
      observed,
    });
  }
  if (rawCollection.status === 'UNSUPPORTED') {
    return outcome('UNSUPPORTED', `SEMANTIC_COMPARISON_BLOCKED_BY_UNSUPPORTED_RAW:${stageId}.${getterName}`, {
      expected,
      observed,
    });
  }
  if (rawCollection.status === 'UNKNOWN' || observed === 'UNAVAILABLE') {
    return outcome('UNKNOWN', `SEMANTIC_COMPARISON_BLOCKED_BY_UNKNOWN_RAW:${stageId}.${getterName}`, {
      expected,
      observed,
    });
  }
  if (plain(observed) !== plain(expected)) {
    return outcome('OBSERVED_MISMATCH', `INHERITED_SEMANTIC_VALUE_MISMATCH:${stageId}.${getterName}`, {
      expected: plain(expected),
      observed: plain(observed),
    });
  }
  return outcome('OBSERVED_MATCH', `INHERITED_SEMANTIC_VALUE_MATCH:${stageId}.${getterName}`, {
    expected: plain(expected),
    observed: plain(observed),
  });
}

function analyzeStage({
  raw,
  profile,
  iface,
  pins,
  cellId,
  stageId,
  selection,
  provenance,
  targetPin,
  inputIntegrity,
  transactionCallSet,
  rawCallSet,
  identity,
}) {
  const getters = {};
  for (const getter of profile.getters) {
    getters[getter.name] = rawGetterObservation({
      raw,
      selection,
      getter,
      iface,
      pins,
      cellId,
      stageId,
    });
  }

  const rawCollection = combine(`RAW_COLLECTION_${cellId}_${stageId}`, [
    provenance,
    targetPin,
    inputIntegrity,
    transactionCallSet,
    rawCallSet,
    selection.outcome,
    ...Object.values(getters).map(({ raw: getterRaw }) => getterRaw),
  ], {
    standing: 'RAW_COLLECTION_CONSISTENCY_ONLY',
    receiptBasis: {
      blockNumber: selection.block ?? 'UNAVAILABLE',
      blockHash: selection.blockHash ?? 'UNAVAILABLE',
      statePoint: 'BLOCK_END',
      transactionIndexLocal: false,
    },
  });

  const stageProfile = profile.stages[stageId];
  const semanticNames = new Set(Object.keys(stageProfile.semanticComparisons));
  for (const getter of profile.getters) {
    if (!semanticNames.has(getter.name)) {
      getters[getter.name].semantic = outcome(
        'UNKNOWN',
        `NO_PREDECLARED_SEMANTIC_INTERPRETATION:${stageId}.${getter.name}`,
        { observed: getters[getter.name].observed },
      );
      continue;
    }
    const rule = stageProfile.semanticComparisons[getter.name];
    const expected = rule === 'DERIVE_QUOTE_3100_RECORD'
      ? identity.derived.recordId
      : rule;
    getters[getter.name].semantic = semanticOutcome(
      rawCollection,
      getters[getter.name].observed,
      expected,
      getter.name,
      stageId,
    );
  }

  const inheritedSemanticComparisons = combine(
    `INHERITED_SEMANTIC_COMPARISONS_${cellId}_${stageId}`,
    [...semanticNames].map((name) => getters[name].semantic),
    {
      standing: 'ONLY_PREDECLARED_INHERITED_COMPARISONS',
      comparedGetters: [...semanticNames],
    },
  );
  const semanticInterpretation = combine(
    `SEMANTIC_INTERPRETATION_${cellId}_${stageId}`,
    profile.getters.map(({ name }) => getters[name].semantic),
    {
      standing: 'UNINTERPRETED_GETTER_STAGE_PAIRINGS_REMAIN_UNKNOWN',
    },
  );

  return {
    transaction: selection.outcome,
    basis: {
      blockNumber: selection.block ?? 'UNAVAILABLE',
      blockHash: selection.blockHash ?? 'UNAVAILABLE',
      statePoint: 'ACTUAL_PAID_TRANSACTION_RECEIPT_BLOCK_END',
      transactionIndexLocalStateProof: false,
    },
    rawCollection,
    getters,
    inheritedSemanticComparisons,
    semanticInterpretation,
  };
}

export function analyzeRichConsumerObservations(packet, abiProfile, profile, pins, input = {}) {
  if (!isObject(packet)) throw new TypeError('MALFORMED_RICH_PACKET');
  if (packet.cells !== undefined && !isObject(packet.cells)) {
    throw new TypeError('MALFORMED_RICH_CELLS_CONTAINER');
  }
  const iface = consumerInterface(abiProfile, profile);
  const identity = deriveIdentity(profile);
  const provenance = provenanceOutcome(profile, pins, input);
  const targetPin = targetPinOutcome(pins);
  const cells = [];

  for (const cellId of profile.scope.cells) {
    const packetCell = packet.cells?.[cellId];
    if (packetCell !== undefined && !isObject(packetCell)) {
      throw new TypeError(`MALFORMED_RICH_CELL:${cellId}`);
    }
    const transactions = prepareTransactions(packetCell?.transactions, cellId);
    const raw = prepareRaw(packetCell?.raw, cellId);
    const inputIntegrity = integrityOutcome(raw, transactions);
    const transactionCallSet = transactionCallSetOutcome(transactions, profile);
    const selections = Object.fromEntries(profile.scope.stages.map((stageId) => [
      stageId,
      transactionForStage({ transactions, profile, iface, pins, cellId, stageId }),
    ]));
    const rawCallSet = rawCallSetOutcome(raw, selections, profile);
    const stages = Object.fromEntries(profile.scope.stages.map((stageId) => [
      stageId,
      analyzeStage({
        raw,
        profile,
        iface,
        pins,
        cellId,
        stageId,
        selection: selections[stageId],
        provenance,
        targetPin,
        inputIntegrity,
        transactionCallSet,
        rawCallSet,
        identity,
      }),
    ]));
    cells.push({
      cellId,
      scope: 'STORING_CONSUMER_ONLY',
      retainedRawObservationCount: raw.length,
      retainedTransactionCount: transactions.length,
      inputIntegrity,
      transactionCallSet,
      rawCallSet,
      stages,
    });
  }

  return {
    kind: 'EFS_RICH_CONSUMER_OBSERVATION_REPORT',
    version: 1,
    candidatePass: 'NOT_EVALUATED',
    evidenceCeiling: 'RPC_OBSERVED',
    standing: profile.standing,
    profile: {
      gitBlob: input.profileGitBlob ?? 'UNAVAILABLE',
      frozenBeforeNewPacket: profile.frozenBeforeNewPacket,
    },
    sourceAssociations: {
      measurement: pins?.measurementSourceAssociation ?? 'UNAVAILABLE',
      core: pins?.coreSourceAssociation ?? 'UNAVAILABLE',
      standing: 'COORDINATOR_EVIDENCE_NOT_AUTHENTICATED_CHAIN_CLAIM',
    },
    provenance,
    identity,
    cells,
    exclusions: profile.scope.excluded,
    doesNotProve: profile.doesNotProve,
  };
}
