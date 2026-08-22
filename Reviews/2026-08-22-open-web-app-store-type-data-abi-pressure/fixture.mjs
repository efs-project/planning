import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import process from "node:process";

const FIXTURE_VERSION = "ows-type-data-abi-pressure/v1";
const FIXTURE_CODEC = "canonical-json-domain-sha256/v1";
const FIXTURE_QUALIFIER = "urn:efs-fixture:open-web-app-store:type-data-abi:v1";
const MAX_DIRECT_REFS = 16;
const MAX_VIEW_SLOTS = 8;

const checks = [];
const recordStore = new Map();
const occurrenceStore = new Map();
const objectStore = new Map();
const contentStore = new Map();
const typeStore = new Map();
const viewStore = new Map();
const queryProfileStore = new Map();

function utf8Compare(a, b) {
  return Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

function canonical(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new TypeError("fixture numbers must be safe integers");
    return String(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort(utf8Compare);
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  throw new TypeError(`unsupported canonical value: ${typeof value}`);
}

function digest(domain, value) {
  return `sha256:${createHash("sha256").update(canonical({ domain, value })).digest("hex")}`;
}

function byteLength(value) {
  return Buffer.byteLength(canonical(value), "utf8");
}

function check(name, condition, detail = {}) {
  assert.equal(Boolean(condition), true, name);
  checks.push({ name, result: "PASS", detail });
}

class FixtureValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FixtureValidationError";
    this.code = code;
  }
}

function defineView(name, slots, constraints = {}) {
  const canonicalView = {
    viewCodecVersion: FIXTURE_CODEC,
    qualificationMode: "QUALIFIED",
    qualifier: FIXTURE_QUALIFIER,
    semanticDigest: digest("FIXTURE_VIEW_SEMANTICS", { name, version: 1 }),
    slots: slots.map(({ key, kind, bound = null }) => ({ key, kind, bound })),
    constraints,
  };
  const view = {
    name,
    slots,
    canonicalView,
    viewRevisionId: digest("FIXTURE_VIEW_REVISION", canonicalView),
  };
  viewStore.set(view.viewRevisionId, view.canonicalView);
  return view;
}

function shapeField({ key, kind, required = true, bound = null }) {
  return { key, kind, presence: required ? "REQUIRED" : "OPTIONAL", bound };
}

function validateViewBinding(fields, view, mappings) {
  if (view.slots.length > MAX_VIEW_SLOTS) {
    throw new FixtureValidationError("VIEW_SLOT_LIMIT", "fixture View exceeds its disposable slot budget");
  }
  if (new Set(view.slots.map((slot) => slot.key)).size !== view.slots.length) {
    throw new FixtureValidationError("VIEW_DUPLICATE_SLOT", "fixture View repeats a slot key");
  }
  if (new Set(fields.map((field) => field.key)).size !== fields.length) {
    throw new FixtureValidationError("TYPE_DUPLICATE_FIELD", "fixture Type repeats a field key");
  }
  if (new Set(mappings.map((mapping) => mapping.slotKey)).size !== mappings.length) {
    throw new FixtureValidationError("VIEW_DUPLICATE_MAPPING", "fixture binding repeats a slot mapping");
  }
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const mappingsBySlot = new Map(mappings.map((mapping) => [mapping.slotKey, mapping]));
  for (const mapping of mappings) {
    if (!view.slots.some((slot) => slot.key === mapping.slotKey)) {
      throw new FixtureValidationError("VIEW_EXTRA_MAPPING", `unknown slot ${mapping.slotKey}`);
    }
  }
  for (const slot of view.slots) {
    const mapping = mappingsBySlot.get(slot.key);
    if (!mapping) throw new FixtureValidationError("VIEW_SLOT_MISSING", `missing slot ${slot.key}`);
    if (!new Set(["directField", "exactConstant"]).has(mapping.op)) {
      throw new FixtureValidationError("VIEW_BINDING_UNBOUNDED", `unsupported mapping ${mapping.op}`);
    }
    if (mapping.op === "directField") {
      const field = fieldsByKey.get(mapping.fieldKey);
      if (!field) throw new FixtureValidationError("VIEW_FIELD_MISSING", `missing field ${mapping.fieldKey}`);
      if (field.kind !== slot.kind) {
        throw new FixtureValidationError("VIEW_KIND_MISMATCH", `${field.kind} != ${slot.kind}`);
      }
      if (canonical(field.bound ?? null) !== canonical(slot.bound ?? null)) {
        throw new FixtureValidationError("VIEW_BOUND_MISMATCH", `bound mismatch for slot ${slot.key}`);
      }
    } else {
      validateScalar({ name: `constant slot ${slot.key}`, kind: slot.kind, bound: slot.bound }, mapping.value);
    }
  }
  return mappings
    .map((mapping) => ({ ...mapping }))
    .sort((a, b) => a.slotKey - b.slotKey);
}

function defineType(name, fields, { referenceRoles = [], viewBindings = [] } = {}) {
  const semanticSpec = {
    specCodecVersion: FIXTURE_CODEC,
    qualificationMode: "QUALIFIED",
    qualifier: FIXTURE_QUALIFIER,
    normativeSpecClosureHash: digest("FIXTURE_NORMATIVE_SPEC", { name, revision: 1 }),
  };
  const semanticSpecId = digest("FIXTURE_SEMANTIC_SPEC", semanticSpec);
  const logicalShape = {
    shapeCodecVersion: FIXTURE_CODEC,
    fields: fields.map(shapeField).sort((a, b) => a.key - b.key),
  };
  const logicalShapeId = digest("FIXTURE_LOGICAL_SHAPE", logicalShape);
  const representation = {
    representationCodecVersion: FIXTURE_CODEC,
    logicalShapeId,
    bodyEncoding: "canonical JSON object keyed by decimal permanent field key",
  };
  const representationId = digest("FIXTURE_REPRESENTATION", representation);
  const committedBindings = viewBindings
    .map(({ view, mappings }) => ({
      viewRevisionId: view.viewRevisionId,
      mappings: validateViewBinding(fields, view, mappings),
    }))
    .sort((a, b) => utf8Compare(a.viewRevisionId, b.viewRevisionId));
  const typeDescriptor = {
    typeCodecVersion: FIXTURE_CODEC,
    semanticSpecId,
    logicalShapeId,
    representationId,
    intrinsicConstraints: fields.map(({ key, required = true, bound = null }) => ({ key, required, bound })),
    referenceRoles: [...referenceRoles].sort((a, b) => a.fieldKey - b.fieldKey),
    viewBindings: committedBindings,
  };
  const type = {
    name,
    fields,
    fieldsByName: new Map(fields.map((field) => [field.name, field])),
    fieldsByKey: new Map(fields.map((field) => [field.key, field])),
    semanticSpecId,
    logicalShapeId,
    representationId,
    typeRevisionId: digest("FIXTURE_TYPE_REVISION", typeDescriptor),
    descriptor: typeDescriptor,
  };
  typeStore.set(type.typeRevisionId, type.descriptor);
  return type;
}

function validateScalar(field, value) {
  if (field.kind === "u8" && (!Number.isInteger(value) || value < 0 || value > 255)) {
    throw new FixtureValidationError("TYPE_VALUE", `${field.name} must be u8`);
  }
  if (field.kind === "u64" && (!Number.isSafeInteger(value) || value < 0)) {
    throw new FixtureValidationError("TYPE_VALUE", `${field.name} must be non-negative safe integer`);
  }
  if (field.kind === "bool" && typeof value !== "boolean") {
    throw new FixtureValidationError("TYPE_VALUE", `${field.name} must be bool`);
  }
  if (new Set(["id", "digest"]).has(field.kind) && !/^sha256:[0-9a-f]{64}$/.test(value)) {
    throw new FixtureValidationError("TYPE_VALUE", `${field.name} must be an algorithm-tagged fixture ID`);
  }
  if (new Set(["text", "token", "enum"]).has(field.kind) && typeof value !== "string") {
    throw new FixtureValidationError("TYPE_VALUE", `${field.name} must be text`);
  }
  if (field.kind === "text" && field.bound?.maxBytes && Buffer.byteLength(value, "utf8") > field.bound.maxBytes) {
    throw new FixtureValidationError("TYPE_VALUE", `${field.name} exceeds text bound`);
  }
  if (field.kind === "enum" && field.bound?.values && !field.bound.values.includes(value)) {
    throw new FixtureValidationError("TYPE_VALUE", `${field.name} has unknown enum value`);
  }
  if (field.kind === "list") {
    if (!Array.isArray(value)) throw new FixtureValidationError("TYPE_VALUE", `${field.name} must be list`);
    if (value.length > field.bound.maxItems) {
      throw new FixtureValidationError("DIRECT_REFERENCE_LIMIT", `${field.name} exceeds ${field.bound.maxItems}`);
    }
    if (field.bound.itemKind === "id") {
      for (const item of value) {
        if (!/^sha256:[0-9a-f]{64}$/.test(item)) {
          throw new FixtureValidationError("TYPE_VALUE", `${field.name} contains non-ID`);
        }
      }
    }
  }
  if (field.kind === "map") {
    if (value === null || Array.isArray(value) || typeof value !== "object") {
      throw new FixtureValidationError("TYPE_VALUE", `${field.name} must be map`);
    }
    if (Object.keys(value).length > field.bound.maxEntries) {
      throw new FixtureValidationError("TYPE_VALUE", `${field.name} exceeds map bound`);
    }
  }
}

function createRecord(type, namedValues, { retain = true } = {}) {
  const unknownNames = Object.keys(namedValues).filter((name) => !type.fieldsByName.has(name));
  if (unknownNames.length) throw new FixtureValidationError("TYPE_UNKNOWN_FIELD", unknownNames.join(","));
  const body = {};
  for (const field of type.fields) {
    const value = namedValues[field.name];
    if (value === undefined) {
      if (field.required !== false) throw new FixtureValidationError("TYPE_MISSING_FIELD", field.name);
      continue;
    }
    validateScalar(field, value);
    body[String(field.key)] = value;
  }
  const bodyHash = digest("FIXTURE_RECORD_BODY", body);
  const recordId = digest("FIXTURE_RECORD", { typeRevisionId: type.typeRevisionId, bodyHash });
  const record = { typeRevisionId: type.typeRevisionId, body, recordId };
  if (retain) recordStore.set(recordId, record);
  return record;
}

function readField(record, type, name) {
  const field = type.fieldsByName.get(name);
  if (!field) throw new Error(`unknown fixture field ${type.name}.${name}`);
  return record.body[String(field.key)];
}

function createOccurrence(record, authorPrincipalId, realmId, sequence, { retain = true } = {}) {
  const payload = { recordId: record.recordId, authorPrincipalId, realmId, sequence };
  const occurrence = { ...payload, occurrenceId: digest("FIXTURE_OCCURRENCE", payload) };
  if (retain) occurrenceStore.set(occurrence.occurrenceId, occurrence);
  return occurrence;
}

function referenceStores(overrides = {}) {
  return {
    records: recordStore,
    occurrences: occurrenceStore,
    objects: objectStore,
    types: typeStore,
    views: viewStore,
    ...overrides,
  };
}

function assessReferenceTarget(role, referenceId, sourceType, stores = referenceStores()) {
  const structural = {
    referenceId,
    targetClass: role.targetClass,
    exists: false,
    backlinkIndexable: true,
    archiveClosureDiscoverable: true,
    authority: "NOT_PROVEN",
    currentness: "UNKNOWN",
  };
  if (role.targetClass === "RECORD_OF_EXACT_TYPE") {
    const record = stores.records.get(referenceId);
    return { ...structural, exists: Boolean(record), valid: Boolean(record) && record.typeRevisionId === role.targetId, observedTypeRevisionId: record?.typeRevisionId ?? null };
  }
  if (role.targetClass === "RECORD_PROJECTABLE_AS_VIEW") {
    const record = stores.records.get(referenceId);
    const descriptor = record ? stores.types.get(record.typeRevisionId) : null;
    const valid = Boolean(descriptor?.viewBindings?.some((binding) => binding.viewRevisionId === role.targetId));
    return { ...structural, exists: Boolean(record), valid, observedTypeRevisionId: record?.typeRevisionId ?? null };
  }
  if (role.targetClass === "RECORD") {
    const exists = stores.records.has(referenceId);
    return { ...structural, exists, valid: role.constraint === "EXISTS" ? exists : false };
  }
  if (role.targetClass === "OBJECT") {
    const exists = stores.objects.has(referenceId);
    return { ...structural, exists, valid: role.constraint === "EXISTS" ? exists : false };
  }
  if (role.targetClass === "OCCURRENCE_OF_EXACT_TYPE") {
    const occurrence = stores.occurrences.get(referenceId);
    const record = occurrence ? stores.records.get(occurrence.recordId) : null;
    return {
      ...structural,
      exists: Boolean(occurrence && record),
      valid: Boolean(occurrence && record) && record.typeRevisionId === role.targetId,
      observedTypeRevisionId: record?.typeRevisionId ?? null,
    };
  }
  if (role.targetClass === "OCCURRENCE") {
    const exists = stores.occurrences.has(referenceId);
    return { ...structural, exists, valid: role.constraint === "EXISTS" ? exists : false };
  }
  if (role.targetClass === "TYPE_REVISION") {
    const exists = stores.types.has(referenceId);
    return { ...structural, exists, valid: role.constraint === "EXISTS" ? exists : false };
  }
  if (role.targetClass === "VIEW_REVISION") {
    const exists = stores.views.has(referenceId);
    return { ...structural, exists, valid: role.constraint === "EXISTS" ? exists : false };
  }
  if (role.targetClass === "SELF") {
    const record = stores.records.get(referenceId);
    return { ...structural, exists: Boolean(record), valid: Boolean(record) && record.typeRevisionId === sourceType.typeRevisionId, observedTypeRevisionId: record?.typeRevisionId ?? null };
  }
  if (role.targetClass === "RECORD_OF_FINITE_TYPE_SET") {
    const record = stores.records.get(referenceId);
    return { ...structural, exists: Boolean(record), valid: Boolean(record) && role.targetIds.includes(record.typeRevisionId), observedTypeRevisionId: record?.typeRevisionId ?? null };
  }
  return { ...structural, valid: false, reason: "OPEN_OR_UNKNOWN_TARGET_CLASS" };
}

function validateRecordReferenceRoles(record, type, stores = referenceStores()) {
  const results = [];
  for (const role of type.descriptor.referenceRoles) {
    const value = record.body[String(role.fieldKey)];
    if (value === undefined) continue;
    const references = Array.isArray(value) ? value : [value];
    for (const referenceId of references) {
      results.push({ fieldKey: role.fieldKey, ...assessReferenceTarget(role, referenceId, type, stores) });
    }
  }
  const invalid = results.filter((result) => !result.valid);
  return { status: invalid.length ? "INVALID" : "VALID", results, invalid };
}

function defineQueryProfile(type, indexSpecs) {
  const descriptor = {
    queryCodecVersion: FIXTURE_CODEC,
    typeRevisionId: type.typeRevisionId,
    indexSpecs: [...indexSpecs].sort((a, b) => utf8Compare(canonical(a), canonical(b))),
  };
  const profile = {
    typeRevisionId: type.typeRevisionId,
    descriptor,
    queryProfileId: digest("FIXTURE_QUERY_PROFILE", descriptor),
  };
  queryProfileStore.set(profile.queryProfileId, profile.descriptor);
  return profile;
}

function defineViewQueryProfile(view, inventoryHighWater, includedPairs, classifiedTypeRevisionIds) {
  const descriptor = {
    queryCodecVersion: FIXTURE_CODEC,
    viewRevisionId: view.viewRevisionId,
    inventoryHighWater,
    includedPairs: [...includedPairs]
      .map((pair) => ({ ...pair }))
      .sort((a, b) => utf8Compare(a.typeRevisionId, b.typeRevisionId)),
    classifiedTypeRevisionIds: [...classifiedTypeRevisionIds].sort(utf8Compare),
    completenessRule: "PINNED_FINITE_TYPE_INVENTORY_TERMINAL_COVERAGE",
  };
  return {
    descriptor,
    viewQueryProfileId: digest("FIXTURE_VIEW_QUERY_PROFILE", descriptor),
  };
}

function evaluateViewQueryProfile(profile, inventory, coverageByQueryProfile, inventoryTip) {
  const throughHighWater = inventory.filter((entry) => entry.position <= profile.descriptor.inventoryHighWater);
  const classified = new Set(profile.descriptor.classifiedTypeRevisionIds);
  const allClassified = throughHighWater.every((entry) => classified.has(entry.typeRevisionId));
  const everyIncludedTerminal = profile.descriptor.includedPairs.every((pair) => coverageByQueryProfile.get(pair.queryProfileId)?.status === "COMPLETE");
  const laterImplementers = inventory
    .filter((entry) => entry.position > profile.descriptor.inventoryHighWater && entry.position <= inventoryTip && entry.implementsView)
    .map((entry) => entry.typeRevisionId)
    .sort(utf8Compare);
  const pinnedStatus = allClassified && everyIncludedTerminal ? "COMPLETE" : "PARTIAL";
  return {
    pinnedStatus,
    currentOpenStatus: pinnedStatus === "COMPLETE" && inventoryTip <= profile.descriptor.inventoryHighWater ? "COMPLETE" : "PARTIAL",
    inventoryHighWater: profile.descriptor.inventoryHighWater,
    inventoryTip,
    laterImplementers,
    authority: "NOT_PROVEN",
    currentness: "QUALIFIED_BY_PINNED_BASIS_ONLY",
  };
}

const ClosureSummaryView = defineView("ClosureSummaryView/1", [
  { key: 1, name: "memberCount", kind: "u64" },
  { key: 2, name: "aggregateDigest", kind: "digest" },
]);
const ReleaseIdentityView = defineView("ReleaseIdentityView/1", [
  { key: 1, name: "projectId", kind: "id" },
  { key: 2, name: "manifestRecordId", kind: "id" },
  { key: 3, name: "payloadClosureRoot", kind: "id" },
]);
const CatalogMembershipView = defineView("CatalogMembershipView/1", [
  { key: 1, name: "targetProjectId", kind: "id" },
  { key: 2, name: "selectedReleaseRef", kind: "id" },
  { key: 3, name: "disposition", kind: "enum", bound: { values: ["SELECTED", "UNLISTED", "WITHDRAWN"] } },
]);
const EvidenceTargetView = defineView("EvidenceTargetView/1", [
  { key: 1, name: "targetReleaseRef", kind: "id" },
]);
const PackageHandoffView = defineView("PackageHandoffView/1", [
  { key: 1, name: "releaseRef", kind: "id" },
  { key: 2, name: "resolvedSetRecordId", kind: "id" },
  { key: 3, name: "runtimeRequestRecordId", kind: "id" },
]);

const ClosureMemberType = defineType("ClosureMember/1", [
  { key: 1, name: "path", kind: "text", bound: { maxBytes: 256 } },
  { key: 2, name: "contentDigest", kind: "digest" },
  { key: 3, name: "size", kind: "u64" },
  { key: 4, name: "role", kind: "token" },
]);
const ClosureLeafType = defineType(
  "ClosureLeaf/1",
  [
    { key: 1, name: "memberCount", kind: "u64" },
    { key: 2, name: "aggregateDigest", kind: "digest" },
    { key: 3, name: "memberRefs", kind: "list", bound: { maxItems: MAX_DIRECT_REFS, itemKind: "id" } },
  ],
  {
    referenceRoles: [{ fieldKey: 3, targetClass: "RECORD_OF_EXACT_TYPE", targetId: ClosureMemberType.typeRevisionId }],
    viewBindings: [{
      view: ClosureSummaryView,
      mappings: [
        { slotKey: 1, op: "directField", fieldKey: 1 },
        { slotKey: 2, op: "directField", fieldKey: 2 },
      ],
    }],
  },
);
const ClosureBranchType = defineType(
  "ClosureBranch/1",
  [
    { key: 1, name: "memberCount", kind: "u64" },
    { key: 2, name: "aggregateDigest", kind: "digest" },
    { key: 3, name: "childRefs", kind: "list", bound: { maxItems: MAX_DIRECT_REFS, itemKind: "id" } },
  ],
  {
    referenceRoles: [{ fieldKey: 3, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId }],
    viewBindings: [{
      view: ClosureSummaryView,
      mappings: [
        { slotKey: 1, op: "directField", fieldKey: 1 },
        { slotKey: 2, op: "directField", fieldKey: 2 },
      ],
    }],
  },
);

function normalizePath(path) {
  if (path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")) {
    throw new FixtureValidationError("CLOSURE_PATH", `unsafe path ${path}`);
  }
  return path;
}

function buildClosure(inputMembers, label, { retain = true, retainContent = true } = {}) {
  const normalized = inputMembers
    .map((member) => {
      const path = normalizePath(member.path);
      const contentDigest = member.contentDigest ?? digest("FIXTURE_CONTENT", member.content);
      const size = member.size ?? Buffer.byteLength(member.content ?? "", "utf8");
      if (member.content !== undefined && retainContent) contentStore.set(contentDigest, member.content);
      return { path, contentDigest, size, role: member.role };
    })
    .sort((a, b) => utf8Compare(a.path, b.path));
  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index - 1].path === normalized[index].path) {
      throw new FixtureValidationError("CLOSURE_DUPLICATE_PATH", normalized[index].path);
    }
  }

  const memberRecords = normalized.map((member) => createRecord(ClosureMemberType, member, { retain }));
  let level = [];
  for (let offset = 0; offset < memberRecords.length; offset += MAX_DIRECT_REFS) {
    const records = memberRecords.slice(offset, offset + MAX_DIRECT_REFS);
    const members = normalized.slice(offset, offset + MAX_DIRECT_REFS);
    const record = createRecord(ClosureLeafType, {
      memberCount: members.length,
      aggregateDigest: digest("FIXTURE_CLOSURE_RANGE", members),
      memberRefs: records.map(({ recordId }) => recordId),
    }, { retain });
    level.push({ record, members, depth: 1 });
  }
  let closureNodeCount = level.length;
  while (level.length > 1) {
    const next = [];
    for (let offset = 0; offset < level.length; offset += MAX_DIRECT_REFS) {
      const children = level.slice(offset, offset + MAX_DIRECT_REFS);
      const members = children.flatMap((child) => child.members);
      const record = createRecord(ClosureBranchType, {
        memberCount: members.length,
        aggregateDigest: digest("FIXTURE_CLOSURE_RANGE", members),
        childRefs: children.map((child) => child.record.recordId),
      }, { retain });
      next.push({ record, members, depth: Math.max(...children.map((child) => child.depth)) + 1 });
    }
    closureNodeCount += next.length;
    level = next;
  }
  const [root] = level;
  if (!root) throw new FixtureValidationError("CLOSURE_EMPTY", `${label} is empty`);
  return {
    label,
    rootRecordId: root.record.recordId,
    rootTypeRevisionId: root.record.typeRevisionId,
    memberCount: normalized.length,
    closureNodeCount,
    totalRecordCount: closureNodeCount + memberRecords.length,
    depth: root.depth,
    maxDirectRefs: MAX_DIRECT_REFS,
    aggregateDigest: digest("FIXTURE_CLOSURE_RANGE", normalized),
  };
}

function syntheticMembers(count, prefix, role = "FIXTURE_MEMBER") {
  return Array.from({ length: count }, (_, index) => {
    const suffix = String(index).padStart(5, "0");
    return {
      path: `${prefix}/${suffix}.bin`,
      contentDigest: digest("FIXTURE_SYNTHETIC_MEMBER", { prefix, index }),
      size: 32 + (index % 97),
      role,
    };
  });
}

const ProjectGenesisType = defineType("SoftwareProjectGenesis/1", [
  { key: 1, name: "purposeDigest", kind: "digest" },
  { key: 2, name: "genesisNonce", kind: "digest" },
]);
const RuntimeRequestType = defineType("RuntimeRequest/1-fixture", [
  { key: 1, name: "capabilitySchemaId", kind: "id" },
  { key: 2, name: "runnerProfileId", kind: "id" },
  { key: 3, name: "dimensions", kind: "map", bound: { maxEntries: 16 } },
  { key: 4, name: "requiredDimensions", kind: "list", bound: { maxItems: 16, itemKind: "text" } },
]);
const DependencyRequirementType = defineType("DependencyRequirement/1", [
  { key: 1, name: "projectId", kind: "id" },
  { key: 2, name: "authorityDomainId", kind: "id" },
  { key: 3, name: "predicateSchemeId", kind: "id" },
  { key: 4, name: "predicate", kind: "text", bound: { maxBytes: 128 } },
  { key: 5, name: "role", kind: "token" },
  { key: 6, name: "optional", kind: "bool" },
  { key: 7, name: "environment", kind: "token" },
  { key: 8, name: "allowedCatalogUniverseDigest", kind: "digest" },
], { referenceRoles: [{ fieldKey: 1, targetClass: "OBJECT", constraint: "EXISTS" }] });
const PackageManifestType = defineType(
  "PackageManifest/1",
  [
    { key: 1, name: "projectId", kind: "id" },
    { key: 2, name: "packageProfileId", kind: "id" },
    { key: 3, name: "payloadClosureRoot", kind: "id" },
    { key: 4, name: "runtimeRequestRecordId", kind: "id" },
    { key: 5, name: "dependencyRequirementClosureRoot", kind: "id" },
    { key: 6, name: "externalBoundary", kind: "enum", bound: { values: ["SELF_CONTAINED", "MUTABLE_REMOTE_SERVICE"] } },
    { key: 7, name: "stateContractId", kind: "id" },
  ],
  {
    referenceRoles: [
      { fieldKey: 1, targetClass: "OBJECT", constraint: "EXISTS" },
      { fieldKey: 3, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
      { fieldKey: 4, targetClass: "RECORD_OF_EXACT_TYPE", targetId: RuntimeRequestType.typeRevisionId },
      { fieldKey: 5, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
    ],
  },
);
const PackageReleaseType = defineType(
  "PackageRelease/1",
  [
    { key: 1, name: "projectId", kind: "id" },
    { key: 2, name: "manifestRecordId", kind: "id" },
    { key: 3, name: "payloadClosureRoot", kind: "id" },
    { key: 4, name: "packageProfileId", kind: "id" },
  ],
  {
    referenceRoles: [
      { fieldKey: 1, targetClass: "OBJECT", constraint: "EXISTS" },
      { fieldKey: 2, targetClass: "RECORD_OF_EXACT_TYPE", targetId: PackageManifestType.typeRevisionId },
      { fieldKey: 3, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
    ],
    viewBindings: [{
      view: ReleaseIdentityView,
      mappings: [
        { slotKey: 1, op: "directField", fieldKey: 1 },
        { slotKey: 2, op: "directField", fieldKey: 2 },
        { slotKey: 3, op: "directField", fieldKey: 3 },
      ],
    }],
  },
);
const VersionLabelClaimType = defineType("VersionLabelClaim/1", [
  { key: 1, name: "targetReleaseRef", kind: "id" },
  { key: 2, name: "schemeId", kind: "id" },
  { key: 3, name: "label", kind: "text", bound: { maxBytes: 64 } },
], { referenceRoles: [{ fieldKey: 1, targetClass: "OCCURRENCE_OF_EXACT_TYPE", targetId: PackageReleaseType.typeRevisionId }] });
const ResolvedPackageSetType = defineType("ResolvedPackageSet/1", [
  { key: 1, name: "rootReleaseRef", kind: "id" },
  { key: 2, name: "environment", kind: "token" },
  { key: 3, name: "graphSemanticDigest", kind: "digest" },
  { key: 4, name: "graphClosureRoot", kind: "id" },
  { key: 5, name: "nodeCount", kind: "u64" },
  { key: 6, name: "edgeCount", kind: "u64" },
  { key: 7, name: "activationSummaryDigest", kind: "digest" },
], {
  referenceRoles: [
    { fieldKey: 1, targetClass: "OCCURRENCE_OF_EXACT_TYPE", targetId: PackageReleaseType.typeRevisionId },
    { fieldKey: 4, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
  ],
});
const ResolutionReceiptType = defineType("ResolutionReceipt/1", [
  { key: 1, name: "resolvedSetRecordId", kind: "id" },
  { key: 2, name: "resolverId", kind: "id" },
  { key: 3, name: "resolverVersion", kind: "token" },
  { key: 4, name: "catalogBasisDigest", kind: "digest" },
  { key: 5, name: "policyDigest", kind: "digest" },
  { key: 6, name: "diagnosticsDigest", kind: "digest" },
], { referenceRoles: [{ fieldKey: 1, targetClass: "RECORD_OF_EXACT_TYPE", targetId: ResolvedPackageSetType.typeRevisionId }] });
const CatalogProjectGenesisType = defineType("CatalogProjectGenesis/1", [
  { key: 1, name: "charterDigest", kind: "digest" },
  { key: 2, name: "genesisNonce", kind: "digest" },
]);
const CatalogMembershipType = defineType(
  "CatalogMembership/1",
  [
    { key: 1, name: "targetProjectId", kind: "id" },
    { key: 2, name: "selectedReleaseRef", kind: "id" },
    { key: 3, name: "disposition", kind: "enum", bound: { values: ["SELECTED", "UNLISTED", "WITHDRAWN"] } },
    { key: 4, name: "rank", kind: "u64" },
    { key: 5, name: "rationaleDigest", kind: "digest" },
  ],
  {
    referenceRoles: [
      { fieldKey: 1, targetClass: "OBJECT", constraint: "EXISTS" },
      { fieldKey: 2, targetClass: "OCCURRENCE_OF_EXACT_TYPE", targetId: PackageReleaseType.typeRevisionId },
    ],
    viewBindings: [{
      view: CatalogMembershipView,
      mappings: [
        { slotKey: 1, op: "directField", fieldKey: 1 },
        { slotKey: 2, op: "directField", fieldKey: 2 },
        { slotKey: 3, op: "directField", fieldKey: 3 },
      ],
    }],
  },
);
const HostileCatalogPayloadType = defineType("HostileCatalogPayload/1-fixture", [
  { key: 1, name: "targetProjectId", kind: "id" },
  { key: 2, name: "autoInstall", kind: "bool" },
  { key: 3, name: "launchUrl", kind: "text", bound: { maxBytes: 256 } },
  { key: 4, name: "requestedCapabilityText", kind: "text", bound: { maxBytes: 256 } },
  { key: 5, name: "trusted", kind: "bool" },
  { key: 6, name: "buildHook", kind: "bool" },
], { referenceRoles: [{ fieldKey: 1, targetClass: "OBJECT", constraint: "EXISTS" }] });
const CatalogEditionType = defineType("CatalogEdition/1", [
  { key: 1, name: "catalogProjectId", kind: "id" },
  { key: 2, name: "rowClosureRoot", kind: "id" },
  { key: 3, name: "rowCount", kind: "u64" },
  { key: 4, name: "declaredCoverage", kind: "enum", bound: { values: ["FINITE_EXACT"] } },
  { key: 5, name: "basisDigest", kind: "digest" },
], {
  referenceRoles: [
    { fieldKey: 1, targetClass: "OBJECT", constraint: "EXISTS" },
    { fieldKey: 2, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
  ],
});
const CatalogReleaseType = defineType("CatalogRelease/1", [
  { key: 1, name: "catalogProjectId", kind: "id" },
  { key: 2, name: "editionRecordId", kind: "id" },
  { key: 3, name: "rowClosureRoot", kind: "id" },
  { key: 4, name: "rowCount", kind: "u64" },
], {
  referenceRoles: [
    { fieldKey: 1, targetClass: "OBJECT", constraint: "EXISTS" },
    { fieldKey: 2, targetClass: "RECORD_OF_EXACT_TYPE", targetId: CatalogEditionType.typeRevisionId },
    { fieldKey: 3, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
  ],
});
const AdvisoryType = defineType(
  "ReleaseAdvisory/1",
  [
    { key: 1, name: "targetReleaseRef", kind: "id" },
    { key: 2, name: "result", kind: "enum", bound: { values: ["AFFECTED", "NOT_AFFECTED", "UNKNOWN"] } },
    { key: 3, name: "severity", kind: "enum", bound: { values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] } },
    { key: 4, name: "evidenceDigest", kind: "digest" },
    { key: 5, name: "affectedRangeSchemeId", kind: "id" },
    { key: 6, name: "affectedPredicate", kind: "text", bound: { maxBytes: 128 } },
    { key: 7, name: "basisDigest", kind: "digest" },
  ],
  {
    referenceRoles: [{ fieldKey: 1, targetClass: "OCCURRENCE_OF_EXACT_TYPE", targetId: PackageReleaseType.typeRevisionId }],
    viewBindings: [{
      view: EvidenceTargetView,
      mappings: [
        { slotKey: 1, op: "directField", fieldKey: 1 },
      ],
    }],
  },
);
const YankClaimType = defineType("ReleaseYankClaim/1-fixture", [
  { key: 1, name: "targetReleaseRef", kind: "id" },
  { key: 2, name: "result", kind: "enum", bound: { values: ["YANKED", "AVAILABLE", "UNKNOWN"] } },
  { key: 3, name: "channelId", kind: "id" },
  { key: 4, name: "reasonDigest", kind: "digest" },
  { key: 5, name: "basisDigest", kind: "digest" },
], {
  referenceRoles: [{ fieldKey: 1, targetClass: "OCCURRENCE_OF_EXACT_TYPE", targetId: PackageReleaseType.typeRevisionId }],
  viewBindings: [{ view: EvidenceTargetView, mappings: [{ slotKey: 1, op: "directField", fieldKey: 1 }] }],
});
const CompatibilityType = defineType(
  "ReleaseCompatibility/1",
  [
    { key: 1, name: "targetReleaseRef", kind: "id" },
    { key: 2, name: "result", kind: "enum", bound: { values: ["PASS", "FAIL", "UNKNOWN"] } },
    { key: 3, name: "runnerProfileId", kind: "id" },
    { key: 4, name: "basisDigest", kind: "digest" },
    { key: 5, name: "environmentDigest", kind: "digest" },
    { key: 6, name: "testVectorClosureRoot", kind: "id" },
    { key: 7, name: "limitationsDigest", kind: "digest" },
  ],
  {
    referenceRoles: [
      { fieldKey: 1, targetClass: "OCCURRENCE_OF_EXACT_TYPE", targetId: PackageReleaseType.typeRevisionId },
      { fieldKey: 6, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
    ],
    viewBindings: [{
      view: EvidenceTargetView,
      mappings: [
        { slotKey: 1, op: "directField", fieldKey: 1 },
      ],
    }],
  },
);
const ProvenanceType = defineType("ReleaseProvenance/1", [
  { key: 1, name: "targetReleaseRef", kind: "id" },
  { key: 2, name: "sourceClosureRoot", kind: "id" },
  { key: 3, name: "forgeLocatorDigest", kind: "digest" },
  { key: 4, name: "result", kind: "enum", bound: { values: ["PASS", "FAIL", "UNKNOWN"] } },
  { key: 5, name: "outputClosureRoot", kind: "id" },
  { key: 6, name: "buildRecipeDigest", kind: "digest" },
  { key: 7, name: "basisDigest", kind: "digest" },
], {
  referenceRoles: [
    { fieldKey: 1, targetClass: "OCCURRENCE_OF_EXACT_TYPE", targetId: PackageReleaseType.typeRevisionId },
    { fieldKey: 2, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
    { fieldKey: 5, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
  ],
  viewBindings: [{
    view: EvidenceTargetView,
    mappings: [{ slotKey: 1, op: "directField", fieldKey: 1 }],
  }],
});
const PackageHandoffType = defineType(
  "PackageHandoff/1-fixture",
  [
    { key: 1, name: "releaseRef", kind: "id" },
    { key: 2, name: "manifestRecordId", kind: "id" },
    { key: 3, name: "payloadClosureRoot", kind: "id" },
    { key: 4, name: "resolvedSetRecordId", kind: "id" },
    { key: 5, name: "resolutionReceiptRecordId", kind: "id" },
    { key: 6, name: "runtimeRequestRecordId", kind: "id" },
    { key: 7, name: "selectedCatalogReleaseRef", kind: "id", required: false },
    { key: 8, name: "evidenceClosureRoot", kind: "id" },
    { key: 9, name: "discoveryGrade", kind: "enum", bound: { values: ["COMPLETE", "PARTIAL", "UNKNOWN", "UNSUPPORTED"] } },
    { key: 10, name: "coverageDigest", kind: "digest" },
  ],
  {
    referenceRoles: [
      { fieldKey: 1, targetClass: "OCCURRENCE_OF_EXACT_TYPE", targetId: PackageReleaseType.typeRevisionId },
      { fieldKey: 2, targetClass: "RECORD_OF_EXACT_TYPE", targetId: PackageManifestType.typeRevisionId },
      { fieldKey: 3, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
      { fieldKey: 4, targetClass: "RECORD_OF_EXACT_TYPE", targetId: ResolvedPackageSetType.typeRevisionId },
      { fieldKey: 5, targetClass: "RECORD_OF_EXACT_TYPE", targetId: ResolutionReceiptType.typeRevisionId },
      { fieldKey: 6, targetClass: "RECORD_OF_EXACT_TYPE", targetId: RuntimeRequestType.typeRevisionId },
      { fieldKey: 7, targetClass: "OCCURRENCE_OF_EXACT_TYPE", targetId: CatalogReleaseType.typeRevisionId },
      { fieldKey: 8, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
    ],
    viewBindings: [{
      view: PackageHandoffView,
      mappings: [
        { slotKey: 1, op: "directField", fieldKey: 1 },
        { slotKey: 2, op: "directField", fieldKey: 4 },
        { slotKey: 3, op: "directField", fieldKey: 6 },
      ],
    }],
  },
);
const TypePackageReleaseType = defineType("TypePackageRelease/1-fixture", [
  { key: 1, name: "packageProjectId", kind: "id" },
  { key: 2, name: "directTypeRootIds", kind: "list", bound: { maxItems: MAX_DIRECT_REFS, itemKind: "id" } },
  { key: 3, name: "directViewRootIds", kind: "list", bound: { maxItems: MAX_DIRECT_REFS, itemKind: "id" } },
  { key: 4, name: "artifactClosureRoot", kind: "id" },
  { key: 5, name: "closureEntryCount", kind: "u64" },
], {
  referenceRoles: [
    { fieldKey: 1, targetClass: "OBJECT", constraint: "EXISTS" },
    { fieldKey: 2, targetClass: "TYPE_REVISION", constraint: "EXISTS" },
    { fieldKey: 3, targetClass: "VIEW_REVISION", constraint: "EXISTS" },
    { fieldKey: 4, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
  ],
});

const LineageKeyView = defineView("LineageKeyView/1-fixture", [
  { key: 1, name: "payloadDigest", kind: "digest" },
]);
function lineageNodeType(name) {
  return defineType(name, [
    { key: 1, name: "payloadDigest", kind: "digest" },
    { key: 2, name: "priorRevisionRef", kind: "id", required: false },
  ], {
    referenceRoles: [{ fieldKey: 2, targetClass: "SELF" }],
    viewBindings: [{
      view: LineageKeyView,
      mappings: [{ slotKey: 1, op: "directField", fieldKey: 1 }],
    }],
  });
}
const LineageNodeV1Type = lineageNodeType("LineageNode/1-fixture");
const LineageNodeV2Type = lineageNodeType("LineageNode/2-fixture");
const FiniteLineageReferenceType = defineType("FiniteLineageReference/1-fixture", [
  { key: 1, name: "targetRecordId", kind: "id" },
], {
  referenceRoles: [{
    fieldKey: 1,
    targetClass: "RECORD_OF_FINITE_TYPE_SET",
    targetIds: [LineageNodeV1Type.typeRevisionId, LineageNodeV2Type.typeRevisionId].sort(utf8Compare),
  }],
});
const ViewLineageReferenceType = defineType("ViewLineageReference/1-fixture", [
  { key: 1, name: "targetRecordId", kind: "id" },
], {
  referenceRoles: [{ fieldKey: 1, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: LineageKeyView.viewRevisionId }],
});
const ExistenceLineageReferenceType = defineType("ExistenceLineageReference/1-fixture", [
  { key: 1, name: "targetRecordId", kind: "id" },
  { key: 2, name: "applicationValidationDigest", kind: "digest" },
], {
  referenceRoles: [{ fieldKey: 1, targetClass: "RECORD", constraint: "EXISTS" }],
});
const ReferenceSemanticsProbeType = defineType("ReferenceSemanticsProbe/1-fixture", [
  { key: 1, name: "recordExistsRef", kind: "id" },
  { key: 2, name: "objectExistsRef", kind: "id" },
  { key: 3, name: "exactTypeRecordRef", kind: "id" },
  { key: 4, name: "exactViewRecordRef", kind: "id" },
  { key: 5, name: "rawBytesDigest", kind: "digest" },
], {
  referenceRoles: [
    { fieldKey: 1, targetClass: "RECORD", constraint: "EXISTS" },
    { fieldKey: 2, targetClass: "OBJECT", constraint: "EXISTS" },
    { fieldKey: 3, targetClass: "RECORD_OF_EXACT_TYPE", targetId: PackageReleaseType.typeRevisionId },
    { fieldKey: 4, targetClass: "RECORD_PROJECTABLE_AS_VIEW", targetId: ClosureSummaryView.viewRevisionId },
  ],
});

const releaseQueryV1 = defineQueryProfile(PackageReleaseType, [
  { key: "by-project", fieldKey: 1, mode: "EQUALITY" },
]);
const releaseQueryV2 = defineQueryProfile(PackageReleaseType, [
  { key: "by-project", fieldKey: 1, mode: "EQUALITY" },
  { key: "by-manifest", fieldKey: 2, mode: "EQUALITY" },
]);
const catalogMembershipQuery = defineQueryProfile(CatalogMembershipType, [
  { key: "by-project", fieldKey: 1, mode: "EQUALITY" },
  { key: "by-selected-release", fieldKey: 2, mode: "EQUALITY" },
]);
const advisoryQuery = defineQueryProfile(AdvisoryType, [
  { key: "by-release", fieldKey: 1, mode: "EQUALITY" },
]);
const yankQuery = defineQueryProfile(YankClaimType, [
  { key: "by-release", fieldKey: 1, mode: "EQUALITY" },
]);
const compatibilityQuery = defineQueryProfile(CompatibilityType, [
  { key: "by-release", fieldKey: 1, mode: "EQUALITY" },
]);
const provenanceQuery = defineQueryProfile(ProvenanceType, [
  { key: "by-release", fieldKey: 1, mode: "EQUALITY" },
]);
const evidenceTypeInventory = [
  { position: 1, typeRevisionId: AdvisoryType.typeRevisionId, implementsView: true },
  { position: 2, typeRevisionId: CompatibilityType.typeRevisionId, implementsView: true },
  { position: 3, typeRevisionId: YankClaimType.typeRevisionId, implementsView: true },
  { position: 4, typeRevisionId: ProvenanceType.typeRevisionId, implementsView: true },
];
const evidenceViewQueryProfile = defineViewQueryProfile(
  EvidenceTargetView,
  2,
  [
    { typeRevisionId: AdvisoryType.typeRevisionId, queryProfileId: advisoryQuery.queryProfileId },
    { typeRevisionId: CompatibilityType.typeRevisionId, queryProfileId: compatibilityQuery.queryProfileId },
  ],
  [AdvisoryType.typeRevisionId, CompatibilityType.typeRevisionId],
);
const terminalEvidenceCoverage = new Map([
  [advisoryQuery.queryProfileId, { status: "COMPLETE", basis: digest("FIXTURE_QUERY_BASIS", "advisory-terminal") }],
  [compatibilityQuery.queryProfileId, { status: "COMPLETE", basis: digest("FIXTURE_QUERY_BASIS", "compatibility-terminal") }],
]);
const evidenceViewAtPinnedTip = evaluateViewQueryProfile(evidenceViewQueryProfile, evidenceTypeInventory, terminalEvidenceCoverage, 2);
const evidenceViewAfterLaterType = evaluateViewQueryProfile(evidenceViewQueryProfile, evidenceTypeInventory, terminalEvidenceCoverage, 4);
check("pinned finite View inventory can be scoped COMPLETE", evidenceViewAtPinnedTip.pinnedStatus === "COMPLETE" && evidenceViewAtPinnedTip.currentOpenStatus === "COMPLETE");
check("later implementing Type leaves old snapshot complete and open current query PARTIAL", evidenceViewAfterLaterType.pinnedStatus === "COMPLETE" && evidenceViewAfterLaterType.currentOpenStatus === "PARTIAL" && evidenceViewAfterLaterType.laterImplementers.includes(YankClaimType.typeRevisionId) && evidenceViewAfterLaterType.laterImplementers.includes(ProvenanceType.typeRevisionId));

const publisherA = digest("FIXTURE_PRINCIPAL", "publisher-A");
const publisherB = digest("FIXTURE_PRINCIPAL", "publisher-B");
const curatorA = digest("FIXTURE_PRINCIPAL", "curator-A");
const curatorB = digest("FIXTURE_PRINCIPAL", "curator-B");
const advisoryIssuerA = digest("FIXTURE_PRINCIPAL", "advisory-issuer-A");
const advisoryIssuerB = digest("FIXTURE_PRINCIPAL", "advisory-issuer-B");
const compatibilityTesterA = digest("FIXTURE_PRINCIPAL", "compatibility-tester-A");
const compatibilityTesterB = digest("FIXTURE_PRINCIPAL", "compatibility-tester-B");
const buildReproducerA = digest("FIXTURE_PRINCIPAL", "build-reproducer-A");
const resolverA = digest("FIXTURE_RESOLVER", "resolver-A");
const resolverB = digest("FIXTURE_RESOLVER", "resolver-B");
const realmA = digest("FIXTURE_REALM", "realm-A");
const realmB = digest("FIXTURE_REALM", "realm-B");

const commonProjectValues = {
  purposeDigest: digest("FIXTURE_PURPOSE", "read-only package inspector"),
  genesisNonce: digest("FIXTURE_NONCE", "project-genesis-1"),
};
const commonProjectRecord = createRecord(ProjectGenesisType, commonProjectValues);
const commonProjectRecordCopy = createRecord(ProjectGenesisType, commonProjectValues);
const projectOccurrenceA = createOccurrence(commonProjectRecord, publisherA, realmA, 1);
const projectOccurrenceB = createOccurrence(commonProjectRecord, publisherB, realmA, 1);
const projectIdA = digest("FIXTURE_PROJECT_SUBJECT", {
  genesisRecordId: commonProjectRecord.recordId,
  genesisOccurrenceId: projectOccurrenceA.occurrenceId,
});
const projectIdB = digest("FIXTURE_PROJECT_SUBJECT", {
  genesisRecordId: commonProjectRecord.recordId,
  genesisOccurrenceId: projectOccurrenceB.occurrenceId,
});
objectStore.set(projectIdA, { genesisOccurrenceId: projectOccurrenceA.occurrenceId, authorPrincipalId: publisherA });
objectStore.set(projectIdB, { genesisOccurrenceId: projectOccurrenceB.occurrenceId, authorPrincipalId: publisherB });
check("same Project body deduplicates as one author-neutral Record", commonProjectRecord !== commonProjectRecordCopy && commonProjectRecord.recordId === commonProjectRecordCopy.recordId);
check("publisher-qualified Project subjects remain distinct", projectIdA !== projectIdB);

const mirrorAdmissionA = digest("FIXTURE_ADMISSION", { occurrenceId: projectOccurrenceA.occurrenceId, realmId: realmA });
const mirrorAdmissionB = digest("FIXTURE_ADMISSION", { occurrenceId: projectOccurrenceA.occurrenceId, realmId: realmB });
check("Realm mirroring preserves source Project identity", projectIdA === digest("FIXTURE_PROJECT_SUBJECT", {
  genesisRecordId: commonProjectRecord.recordId,
  genesisOccurrenceId: projectOccurrenceA.occurrenceId,
}));
check("Realm admissions remain distinct", mirrorAdmissionA !== mirrorAdmissionB);

const lineageV1Root = createRecord(LineageNodeV1Type, {
  payloadDigest: digest("FIXTURE_LINEAGE_PAYLOAD", "v1-root"),
});
const lineageV1Child = createRecord(LineageNodeV1Type, {
  payloadDigest: digest("FIXTURE_LINEAGE_PAYLOAD", "v1-child"),
  priorRevisionRef: lineageV1Root.recordId,
});
const lineageV2CrossRevision = createRecord(LineageNodeV2Type, {
  payloadDigest: digest("FIXTURE_LINEAGE_PAYLOAD", "v2-cross-revision"),
  priorRevisionRef: lineageV1Root.recordId,
}, { retain: false });
const lineageV1SelfValidation = validateRecordReferenceRoles(lineageV1Child, LineageNodeV1Type);
const lineageV2CrossValidation = validateRecordReferenceRoles(lineageV2CrossRevision, LineageNodeV2Type);
const finiteLineageReference = createRecord(FiniteLineageReferenceType, { targetRecordId: lineageV1Root.recordId });
const viewLineageReference = createRecord(ViewLineageReferenceType, { targetRecordId: lineageV1Root.recordId });
const existenceLineageReference = createRecord(ExistenceLineageReferenceType, {
  targetRecordId: lineageV1Root.recordId,
  applicationValidationDigest: digest("FIXTURE_APPLICATION_VALIDATION", { acceptedTypes: [LineageNodeV1Type.typeRevisionId] }),
});
check("SELF reference accepts only the same exact Type revision", lineageV1SelfValidation.status === "VALID" && lineageV2CrossValidation.status === "INVALID");
check("finite exact Type set permits an explicit /2-to-/1 lineage reference", validateRecordReferenceRoles(finiteLineageReference, FiniteLineageReferenceType).status === "VALID");
check("pinned View permits cross-revision projection without claiming semantic authority", validateRecordReferenceRoles(viewLineageReference, ViewLineageReferenceType).status === "VALID");
const existenceLineageValidation = validateRecordReferenceRoles(existenceLineageReference, ExistenceLineageReferenceType);
check("existence-only cross-revision reference requires separate application validation", existenceLineageValidation.status === "VALID" && existenceLineageValidation.results.every((result) => result.authority === "NOT_PROVEN" && result.currentness === "UNKNOWN"));

const smallPayloadClosure = buildClosure([
  { path: "app/index.html", content: "<!doctype html><title>EFS fixture</title>", role: "EXECUTABLE_ENTRY" },
  { path: "app/inspector.wasm", content: "fixture-wasm-bytes-v1", role: "EXECUTABLE" },
  { path: "LICENSE", content: "Fixture-only license text", role: "NOTICE" },
], "small-payload");
const sourceClosure = buildClosure([
  { path: "src/main.ts", content: "export const fixture = true;", role: "SOURCE" },
  { path: "build/recipe.json", content: canonical({ command: ["fixture-build", "--offline"], toolchain: "fixture-ts/v1" }), role: "BUILD_RECIPE" },
], "source");

const capabilitySchemaV1 = digest("FIXTURE_CAPABILITY_SCHEMA", "capability-schema/v1");
const runnerProfileV1 = digest("FIXTURE_RUNNER_PROFILE", "inert-inspector/v1");
const runtimeRequestR1 = createRecord(RuntimeRequestType, {
  capabilitySchemaId: capabilitySchemaV1,
  runnerProfileId: runnerProfileV1,
  dimensions: { network: "none", storage: "none" },
  requiredDimensions: [],
});
const dependencyProjectGenesis = createRecord(ProjectGenesisType, {
  purposeDigest: digest("FIXTURE_PURPOSE", "schema/profile dependency"),
  genesisNonce: digest("FIXTURE_NONCE", "schema-pack-project"),
});
const dependencyProjectOccurrence = createOccurrence(dependencyProjectGenesis, publisherB, realmA, 1);
const dependencyProjectId = digest("FIXTURE_PROJECT_SUBJECT", {
  genesisRecordId: dependencyProjectGenesis.recordId,
  genesisOccurrenceId: dependencyProjectOccurrence.occurrenceId,
});
objectStore.set(dependencyProjectId, { genesisOccurrenceId: dependencyProjectOccurrence.occurrenceId, authorPrincipalId: publisherB });
const dependencyPayloadClosure1 = buildClosure([
  { path: "profiles/schema-v1.json", content: canonical({ profile: 1, fields: ["result"] }), role: "SCHEMA_OR_PROFILE" },
], "dependency-payload-v1");
const dependencyPayloadClosure2 = buildClosure([
  { path: "profiles/schema-v2.json", content: canonical({ profile: 2, fields: ["result", "reason"] }), role: "SCHEMA_OR_PROFILE" },
], "dependency-payload-v2");
const dependencyEmptyRequirements = buildClosure([
  { path: "requirements/empty.json", content: "[]", role: "NO_DEPENDENCIES" },
], "dependency-empty-requirements");
const dependencyPackageProfileId = digest("FIXTURE_PACKAGE_PROFILE", "schema-profile-pack/v1");
const dependencyStateContractId = digest("FIXTURE_STATE_CONTRACT", "immutable-data/v1");
const dependencyManifest1 = createRecord(PackageManifestType, {
  projectId: dependencyProjectId,
  packageProfileId: dependencyPackageProfileId,
  payloadClosureRoot: dependencyPayloadClosure1.rootRecordId,
  runtimeRequestRecordId: runtimeRequestR1.recordId,
  dependencyRequirementClosureRoot: dependencyEmptyRequirements.rootRecordId,
  externalBoundary: "SELF_CONTAINED",
  stateContractId: dependencyStateContractId,
});
const dependencyReleaseRecord1 = createRecord(PackageReleaseType, {
  projectId: dependencyProjectId,
  manifestRecordId: dependencyManifest1.recordId,
  payloadClosureRoot: dependencyPayloadClosure1.rootRecordId,
  packageProfileId: dependencyPackageProfileId,
});
const dependencyReleaseOccurrence1 = createOccurrence(dependencyReleaseRecord1, publisherB, realmA, 2);
const dependencyRelease1 = dependencyReleaseOccurrence1.occurrenceId;
const dependencyManifest2 = createRecord(PackageManifestType, {
  projectId: dependencyProjectId,
  packageProfileId: dependencyPackageProfileId,
  payloadClosureRoot: dependencyPayloadClosure2.rootRecordId,
  runtimeRequestRecordId: runtimeRequestR1.recordId,
  dependencyRequirementClosureRoot: dependencyEmptyRequirements.rootRecordId,
  externalBoundary: "SELF_CONTAINED",
  stateContractId: dependencyStateContractId,
});
const dependencyReleaseRecord2 = createRecord(PackageReleaseType, {
  projectId: dependencyProjectId,
  manifestRecordId: dependencyManifest2.recordId,
  payloadClosureRoot: dependencyPayloadClosure2.rootRecordId,
  packageProfileId: dependencyPackageProfileId,
});
const dependencyReleaseOccurrence2 = createOccurrence(dependencyReleaseRecord2, publisherB, realmA, 3);
const dependencyRelease2 = dependencyReleaseOccurrence2.occurrenceId;
const dependencyRequirement = createRecord(DependencyRequirementType, {
  projectId: dependencyProjectId,
  authorityDomainId: digest("FIXTURE_AUTHORITY_DOMAIN", "schema-pack-publisher/epoch-1"),
  predicateSchemeId: digest("FIXTURE_PREDICATE_SCHEME", "fixture-semver/v1"),
  predicate: ">=1.0.0 <2.0.0",
  role: "SCHEMA_OR_PROFILE",
  optional: false,
  environment: "all",
  allowedCatalogUniverseDigest: digest("FIXTURE_CATALOG_UNIVERSE", ["catalog-A", "catalog-B"]),
});
const dependencyRequirementClosure = buildClosure([
  {
    path: "requirements/0000.record",
    contentDigest: dependencyRequirement.recordId,
    size: byteLength(dependencyRequirement.body),
    role: "DEPENDENCY_REQUIREMENT",
  },
], "dependency-requirements", { retainContent: false });

const packageProfileId = digest("FIXTURE_PACKAGE_PROFILE", "confined-component/v1");
const stateContractId = digest("FIXTURE_STATE_CONTRACT", "stateless/v1");
const manifestR1 = createRecord(PackageManifestType, {
  projectId: projectIdA,
  packageProfileId,
  payloadClosureRoot: smallPayloadClosure.rootRecordId,
  runtimeRequestRecordId: runtimeRequestR1.recordId,
  dependencyRequirementClosureRoot: dependencyRequirementClosure.rootRecordId,
  externalBoundary: "SELF_CONTAINED",
  stateContractId,
});
const releaseRecordR1 = createRecord(PackageReleaseType, {
  projectId: projectIdA,
  manifestRecordId: manifestR1.recordId,
  payloadClosureRoot: smallPayloadClosure.rootRecordId,
  packageProfileId,
});
const releaseOccurrenceR1 = createOccurrence(releaseRecordR1, publisherA, realmA, 2);
const authoredReleaseR1 = releaseOccurrenceR1.occurrenceId;

const probeRawBytesDigest = digest("FIXTURE_CONTENT", "fixture-wasm-bytes-v1");
const referenceSemanticsProbe = createRecord(ReferenceSemanticsProbeType, {
  recordExistsRef: releaseRecordR1.recordId,
  objectExistsRef: projectIdA,
  exactTypeRecordRef: releaseRecordR1.recordId,
  exactViewRecordRef: smallPayloadClosure.rootRecordId,
  rawBytesDigest: probeRawBytesDigest,
});
const referenceSemanticsValidation = validateRecordReferenceRoles(referenceSemanticsProbe, ReferenceSemanticsProbeType);
const rawBytesObservation = {
  digestMatchesRetainedBytes: contentStore.has(probeRawBytesDigest),
  backlinkIndexable: false,
  authority: "NOT_PROVEN",
  currentness: "UNKNOWN",
};
check("closed Record/Object existence targets preserve structural discovery without authority", referenceSemanticsValidation.status === "VALID" && referenceSemanticsValidation.results.filter((result) => result.targetClass === "RECORD" || result.targetClass === "OBJECT").every((result) => result.exists && result.backlinkIndexable && result.archiveClosureDiscoverable && result.authority === "NOT_PROVEN" && result.currentness === "UNKNOWN"));
check("raw bytes and exact Type/View prove integrity or projection, never authority/currentness", rawBytesObservation.digestMatchesRetainedBytes && rawBytesObservation.authority === "NOT_PROVEN" && referenceSemanticsValidation.results.filter((result) => result.targetClass === "RECORD_OF_EXACT_TYPE" || result.targetClass === "RECORD_PROJECTABLE_AS_VIEW").every((result) => result.valid && result.authority === "NOT_PROVEN" && result.currentness === "UNKNOWN"));

const labelScheme = digest("FIXTURE_VERSION_SCHEME", "fixture-semver/v1");
const labelClaim100 = createRecord(VersionLabelClaimType, {
  targetReleaseRef: authoredReleaseR1,
  schemeId: labelScheme,
  label: "1.0.0",
});
const labelClaimStable = createRecord(VersionLabelClaimType, {
  targetReleaseRef: authoredReleaseR1,
  schemeId: labelScheme,
  label: "stable",
});
const labelClaim100Occurrence = createOccurrence(labelClaim100, publisherA, realmA, 4);
const labelClaimStableOccurrence = createOccurrence(labelClaimStable, publisherA, realmA, 5);
const labelInIdentity100 = digest("FIXTURE_LABEL_IN_RELEASE_ARM", { body: releaseRecordR1.body, label: "1.0.0" });
const labelInIdentityStable = digest("FIXTURE_LABEL_IN_RELEASE_ARM", { body: releaseRecordR1.body, label: "stable" });
check("label-out authored claims differ without changing the authored Release", labelClaim100Occurrence.occurrenceId !== labelClaimStableOccurrence.occurrenceId && labelClaim100.recordId !== labelClaimStable.recordId);
check("label-in arm would churn identity", labelInIdentity100 !== labelInIdentityStable);

const runtimeRequestR2 = createRecord(RuntimeRequestType, {
  capabilitySchemaId: capabilitySchemaV1,
  runnerProfileId: runnerProfileV1,
  dimensions: { network: "none", storage: "none", "wallet.sign.v2": "required" },
  requiredDimensions: ["wallet.sign.v2"],
});
const manifestR2 = createRecord(PackageManifestType, {
  projectId: projectIdA,
  packageProfileId,
  payloadClosureRoot: smallPayloadClosure.rootRecordId,
  runtimeRequestRecordId: runtimeRequestR2.recordId,
  dependencyRequirementClosureRoot: dependencyRequirementClosure.rootRecordId,
  externalBoundary: "SELF_CONTAINED",
  stateContractId,
});
const releaseRecordR2 = createRecord(PackageReleaseType, {
  projectId: projectIdA,
  manifestRecordId: manifestR2.recordId,
  payloadClosureRoot: smallPayloadClosure.rootRecordId,
  packageProfileId,
});
const releaseOccurrenceR2 = createOccurrence(releaseRecordR2, publisherA, realmA, 3);
const authoredReleaseR2 = releaseOccurrenceR2.occurrenceId;
check("capability-ceiling change creates a new Manifest", manifestR1.recordId !== manifestR2.recordId);
check("capability-ceiling change creates a new authored Release", authoredReleaseR1 !== authoredReleaseR2);

function evaluateRuntimeRequest(requestRecord, supportedSchemaId, knownDimensions) {
  const schemaId = readField(requestRecord, RuntimeRequestType, "capabilitySchemaId");
  const dimensions = readField(requestRecord, RuntimeRequestType, "dimensions");
  const requiredList = readField(requestRecord, RuntimeRequestType, "requiredDimensions");
  const required = new Set(requiredList);
  if (schemaId !== supportedSchemaId) {
    return { status: "UNSUPPORTED", unknown: Object.keys(dimensions).sort(utf8Compare), denied: Object.keys(dimensions).sort(utf8Compare), effectiveGrantCount: 0, sideEffects: 0 };
  }
  if (required.size !== requiredList.length) {
    return { status: "UNSUPPORTED", reason: "DUPLICATE_REQUIRED_DIMENSION", unknown: [], denied: requiredList, effectiveGrantCount: 0, sideEffects: 0 };
  }
  const missingRequired = requiredList.filter((key) => !Object.hasOwn(dimensions, key)).sort(utf8Compare);
  if (missingRequired.length) {
    return { status: "UNSUPPORTED", reason: "MISSING_REQUIRED_DIMENSION", unknown: missingRequired, denied: missingRequired, effectiveGrantCount: 0, sideEffects: 0 };
  }
  const unknown = Object.keys(dimensions).filter((key) => !knownDimensions.has(key)).sort(utf8Compare);
  const requiredUnknown = unknown.filter((key) => required.has(key));
  const invalidValues = Object.entries(dimensions)
    .filter(([key, value]) => knownDimensions.has(key) && !knownDimensions.get(key).has(value))
    .map(([key]) => key)
    .sort(utf8Compare);
  const requiredInvalid = invalidValues.filter((key) => required.has(key));
  return {
    status: requiredUnknown.length || requiredInvalid.length ? "UNSUPPORTED" : unknown.length || invalidValues.length ? "PARTIAL" : "COMPLETE",
    unknown,
    invalidValues,
    denied: [...new Set([...unknown, ...invalidValues])].sort(utf8Compare),
    effectiveGrantCount: 0,
    sideEffects: 0,
  };
}
const knownCapabilityDimensions = new Map([
  ["network", new Set(["none", "scoped"])],
  ["storage", new Set(["none", "ephemeral"])],
]);
const unknownCapabilityResult = evaluateRuntimeRequest(runtimeRequestR2, capabilitySchemaV1, knownCapabilityDimensions);
const missingRequiredRequest = createRecord(RuntimeRequestType, {
  capabilitySchemaId: capabilitySchemaV1,
  runnerProfileId: runnerProfileV1,
  dimensions: { network: "none" },
  requiredDimensions: ["wallet.sign.v2"],
});
const missingRequiredCapabilityResult = evaluateRuntimeRequest(missingRequiredRequest, capabilitySchemaV1, knownCapabilityDimensions);
check("unknown required capability is preserved and unsupported", unknownCapabilityResult.status === "UNSUPPORTED" && unknownCapabilityResult.unknown.includes("wallet.sign.v2"));
check("unknown capability produces no grant or side effect", unknownCapabilityResult.effectiveGrantCount === 0 && unknownCapabilityResult.sideEffects === 0);
check("missing required capability dimension cannot bypass deny-by-default", missingRequiredCapabilityResult.status === "UNSUPPORTED" && missingRequiredCapabilityResult.reason === "MISSING_REQUIRED_DIMENSION" && missingRequiredCapabilityResult.effectiveGrantCount === 0);

function validateSelectedGraph(graph) {
  const releaseRefs = graph.nodes.map((node) => node.releaseRef);
  if (new Set(releaseRefs).size !== releaseRefs.length) {
    throw new FixtureValidationError("GRAPH_DUPLICATE_RELEASE", "selected graph repeats a Release reference");
  }
  const releaseSet = new Set(releaseRefs);
  const edgeKeys = graph.edges.map((edge) => canonical(edge));
  if (new Set(edgeKeys).size !== edgeKeys.length) {
    throw new FixtureValidationError("GRAPH_DUPLICATE_EDGE", "selected graph repeats an edge");
  }
  if (graph.edges.some((edge) => !releaseSet.has(edge.from) || !releaseSet.has(edge.to))) {
    throw new FixtureValidationError("GRAPH_DANGLING_EDGE", "selected graph contains a dangling edge endpoint");
  }
  if (graph.activationUnits.some((unit) => !releaseSet.has(unit.releaseRef))) {
    throw new FixtureValidationError("GRAPH_DANGLING_ACTIVATION", "selected graph contains a dangling activation unit");
  }
}

function validateSelectedGraphPackages(graph, stores) {
  try {
    validateSelectedGraph(graph);
  } catch (error) {
    return { status: "INVALID", reason: error.code ?? "GRAPH_SYNTAX" };
  }
  const nodesByRelease = new Map(graph.nodes.map((node) => [node.releaseRef, node]));
  for (const node of graph.nodes) {
    const project = stores.objects.get(node.projectId);
    if (!project) return { status: "UNKNOWN", reason: "GRAPH_MISSING_PROJECT" };
    const occurrence = stores.occurrences.get(node.releaseRef);
    if (!occurrence) return { status: "UNKNOWN", reason: "GRAPH_MISSING_RELEASE_OCCURRENCE" };
    const release = stores.records.get(occurrence.recordId);
    if (!release || !verifyRecord(release) || release.typeRevisionId !== PackageReleaseType.typeRevisionId) return { status: "INVALID", reason: "GRAPH_WRONG_RELEASE_TYPE" };
    if (project.authorPrincipalId && project.authorPrincipalId !== occurrence.authorPrincipalId) return { status: "INVALID", reason: "GRAPH_RELEASE_AUTHORITY_MISMATCH" };
    if (readField(release, PackageReleaseType, "projectId") !== node.projectId) return { status: "INVALID", reason: "GRAPH_PROJECT_RELEASE_MISMATCH" };
    if (readField(release, PackageReleaseType, "manifestRecordId") !== node.manifestRecordId) return { status: "INVALID", reason: "GRAPH_MANIFEST_MISMATCH" };
    if (readField(release, PackageReleaseType, "payloadClosureRoot") !== node.payloadClosureRoot) return { status: "INVALID", reason: "GRAPH_PAYLOAD_MISMATCH" };
    const manifest = stores.records.get(node.manifestRecordId);
    if (!manifest || !verifyRecord(manifest) || manifest.typeRevisionId !== PackageManifestType.typeRevisionId) return { status: "INVALID", reason: "GRAPH_WRONG_MANIFEST_TYPE" };
    if (readField(manifest, PackageManifestType, "projectId") !== node.projectId) return { status: "INVALID", reason: "GRAPH_MANIFEST_PROJECT_MISMATCH" };
    if (readField(manifest, PackageManifestType, "payloadClosureRoot") !== node.payloadClosureRoot) return { status: "INVALID", reason: "GRAPH_MANIFEST_PAYLOAD_MISMATCH" };
    if (readField(manifest, PackageManifestType, "runtimeRequestRecordId") !== node.runtimeRequestRecordId) return { status: "INVALID", reason: "GRAPH_RUNTIME_REQUEST_MISMATCH" };
    const releaseReferences = validateRecordReferenceRoles(release, PackageReleaseType, referenceStores({ records: stores.records, occurrences: stores.occurrences, objects: stores.objects }));
    const manifestReferences = validateRecordReferenceRoles(manifest, PackageManifestType, referenceStores({ records: stores.records, occurrences: stores.occurrences, objects: stores.objects }));
    if (releaseReferences.status !== "VALID" || manifestReferences.status !== "VALID") return { status: "UNKNOWN", reason: "GRAPH_PACKAGE_REFERENCE_FAILURE" };
  }
  for (const activation of graph.activationUnits) {
    const node = nodesByRelease.get(activation.releaseRef);
    if (!node) return { status: "INVALID", reason: "GRAPH_ACTIVATION_RELEASE_MISMATCH" };
    if (node.runtimeRequestRecordId !== activation.runtimeRequestRecordId) return { status: "INVALID", reason: "GRAPH_ACTIVATION_REQUEST_MISMATCH" };
    const request = stores.records.get(activation.runtimeRequestRecordId);
    if (!request || !verifyRecord(request) || request.typeRevisionId !== RuntimeRequestType.typeRevisionId) return { status: "INVALID", reason: "GRAPH_ACTIVATION_WRONG_REQUEST_TYPE" };
  }
  return { status: "VALID", nodes: graph.nodes.length, activations: graph.activationUnits.length };
}

function canonicalGraph(graph) {
  validateSelectedGraph(graph);
  return {
    environment: graph.environment,
    nodes: [...graph.nodes].sort((a, b) => utf8Compare(a.releaseRef, b.releaseRef)),
    edges: [...graph.edges].sort((a, b) => utf8Compare(canonical(a), canonical(b))),
    activationUnits: [...graph.activationUnits].sort((a, b) => utf8Compare(canonical(a), canonical(b))),
  };
}

function graphToClosure(graph, label, retain = false) {
  const normalized = canonicalGraph(graph);
  const members = [
    ...normalized.nodes.map((node, index) => ({
      path: `nodes/${String(index).padStart(5, "0")}.record`,
      content: canonical(node),
      role: "SET_NODE",
    })),
    ...normalized.edges.map((edge, index) => ({
      path: `edges/${String(index).padStart(5, "0")}.record`,
      content: canonical(edge),
      role: "SET_EDGE",
    })),
    ...normalized.activationUnits.map((unit, index) => ({
      path: `activation/${String(index).padStart(5, "0")}.record`,
      content: canonical(unit),
      role: "ACTIVATION_UNIT",
    })),
  ];
  const closure = buildClosure(members, label, { retain, retainContent: retain });
  return { normalized, closure };
}

function createSetRecord(graph, rootReleaseRef, label, retain = true) {
  const { normalized, closure } = graphToClosure(graph, label, retain);
  const graphSemanticDigest = digest("FIXTURE_RESOLVED_SET_GRAPH", normalized);
  const record = createRecord(ResolvedPackageSetType, {
    rootReleaseRef,
    environment: normalized.environment,
    graphSemanticDigest,
    graphClosureRoot: closure.rootRecordId,
    nodeCount: normalized.nodes.length,
    edgeCount: normalized.edges.length,
    activationSummaryDigest: digest("FIXTURE_ACTIVATION_SUMMARY", normalized.activationUnits),
  }, { retain });
  return { record, normalized, closure, graphSemanticDigest };
}

const smallGraphR1 = {
  environment: "web-portable",
  nodes: [
    {
      projectId: projectIdA,
      releaseRef: authoredReleaseR1,
      manifestRecordId: manifestR1.recordId,
      payloadClosureRoot: smallPayloadClosure.rootRecordId,
      runtimeRequestRecordId: runtimeRequestR1.recordId,
      role: "ROOT",
    },
    {
      projectId: dependencyProjectId,
      releaseRef: dependencyRelease1,
      manifestRecordId: dependencyManifest1.recordId,
      payloadClosureRoot: dependencyPayloadClosure1.rootRecordId,
      runtimeRequestRecordId: runtimeRequestR1.recordId,
      role: "SCHEMA_OR_PROFILE",
    },
  ],
  edges: [{ from: authoredReleaseR1, to: dependencyRelease1, kind: "REQUIRED", slot: "profile" }],
  activationUnits: [{ releaseRef: authoredReleaseR1, runtimeRequestRecordId: runtimeRequestR1.recordId }],
};
const smallGraphR2Dependency = {
  ...smallGraphR1,
  nodes: [
    smallGraphR1.nodes[0],
    {
      projectId: dependencyProjectId,
      releaseRef: dependencyRelease2,
      manifestRecordId: dependencyManifest2.recordId,
      payloadClosureRoot: dependencyPayloadClosure2.rootRecordId,
      runtimeRequestRecordId: runtimeRequestR1.recordId,
      role: "SCHEMA_OR_PROFILE",
    },
  ],
  edges: [{ from: authoredReleaseR1, to: dependencyRelease2, kind: "REQUIRED", slot: "profile" }],
};
const smallGraphPackageValidation = validateSelectedGraphPackages(smallGraphR1, referenceStores());
const missingDependencyReleaseRef = digest("FIXTURE_MISSING_RELEASE", "dependency");
const missingReleaseGraph = {
  ...smallGraphR1,
  nodes: smallGraphR1.nodes.map((node) => node.releaseRef === dependencyRelease1 ? { ...node, releaseRef: missingDependencyReleaseRef } : { ...node }),
  edges: smallGraphR1.edges.map((edge) => ({ ...edge, to: edge.to === dependencyRelease1 ? missingDependencyReleaseRef : edge.to })),
};
const fakeDependencyProjectId = digest("FIXTURE_PROJECT_SUBJECT", "fake-dependency-project");
const projectMismatchObjects = new Map(objectStore);
projectMismatchObjects.set(fakeDependencyProjectId, { authorPrincipalId: publisherB });
const projectMismatchGraph = {
  ...smallGraphR1,
  nodes: smallGraphR1.nodes.map((node) => node.releaseRef === dependencyRelease1 ? { ...node, projectId: fakeDependencyProjectId } : { ...node }),
};
const manifestMismatchGraph = {
  ...smallGraphR1,
  nodes: smallGraphR1.nodes.map((node) => node.releaseRef === dependencyRelease1 ? { ...node, manifestRecordId: lineageV1Root.recordId } : { ...node }),
};
const payloadMismatchGraph = {
  ...smallGraphR1,
  nodes: smallGraphR1.nodes.map((node) => node.releaseRef === dependencyRelease1 ? { ...node, payloadClosureRoot: sourceClosure.rootRecordId } : { ...node }),
};
const activationMismatchGraph = {
  ...smallGraphR1,
  activationUnits: smallGraphR1.activationUnits.map((unit) => ({ ...unit, runtimeRequestRecordId: runtimeRequestR2.recordId })),
};
const selectedGraphNegativeSemantics = {
  missingRelease: validateSelectedGraphPackages(missingReleaseGraph, referenceStores()),
  projectMismatch: validateSelectedGraphPackages(projectMismatchGraph, referenceStores({ objects: projectMismatchObjects })),
  manifestMismatch: validateSelectedGraphPackages(manifestMismatchGraph, referenceStores()),
  payloadMismatch: validateSelectedGraphPackages(payloadMismatchGraph, referenceStores()),
  activationMismatch: validateSelectedGraphPackages(activationMismatchGraph, referenceStores()),
};
check("small selected Set validates every exact Project/Release/Manifest/payload/request relation", smallGraphPackageValidation.status === "VALID");
check("selected Set rejects missing Release, Project, Manifest, payload, and activation-request mismatches", Object.values(selectedGraphNegativeSemantics).every((result) => result.status !== "VALID"));
const smallSetR1 = createSetRecord(smallGraphR1, authoredReleaseR1, "small-set-r1");
const smallSetReordered = createSetRecord({
  ...smallGraphR1,
  nodes: [...smallGraphR1.nodes].reverse(),
  edges: [...smallGraphR1.edges].reverse(),
}, authoredReleaseR1, "small-set-r1-reordered", false);
const smallSetR2Dependency = createSetRecord(smallGraphR2Dependency, authoredReleaseR1, "small-set-r2-dependency");
check("input order does not change ResolvedPackageSet identity", smallSetR1.record.recordId === smallSetReordered.record.recordId);
check("transitive selection changes Set identity but not root Release", smallSetR1.record.recordId !== smallSetR2Dependency.record.recordId && readField(smallSetR2Dependency.record, ResolvedPackageSetType, "rootReleaseRef") === authoredReleaseR1);
let duplicateGraphError = null;
let danglingGraphError = null;
try {
  createSetRecord({ ...smallGraphR1, nodes: [...smallGraphR1.nodes, smallGraphR1.nodes[1]] }, authoredReleaseR1, "invalid-duplicate-graph", false);
} catch (error) {
  duplicateGraphError = error;
}
try {
  createSetRecord({ ...smallGraphR1, edges: [...smallGraphR1.edges, { from: authoredReleaseR1, to: digest("FIXTURE_MISSING_RELEASE", 1), kind: "REQUIRED", slot: "dangling" }] }, authoredReleaseR1, "invalid-dangling-graph", false);
} catch (error) {
  danglingGraphError = error;
}
check("selected graph rejects duplicate Releases and dangling endpoints before hashing", duplicateGraphError?.code === "GRAPH_DUPLICATE_RELEASE" && danglingGraphError?.code === "GRAPH_DANGLING_EDGE");

const receiptA = createRecord(ResolutionReceiptType, {
  resolvedSetRecordId: smallSetR1.record.recordId,
  resolverId: resolverA,
  resolverVersion: "resolver-a/1",
  catalogBasisDigest: digest("FIXTURE_CATALOG_BASIS", "catalog-A@basis-1"),
  policyDigest: digest("FIXTURE_RESOLUTION_POLICY", "policy-A"),
  diagnosticsDigest: digest("FIXTURE_DIAGNOSTICS", ["selected schema-pack-r1"]),
});
const receiptB = createRecord(ResolutionReceiptType, {
  resolvedSetRecordId: smallSetR1.record.recordId,
  resolverId: resolverB,
  resolverVersion: "resolver-b/7",
  catalogBasisDigest: digest("FIXTURE_CATALOG_BASIS", "catalog-B@basis-9"),
  policyDigest: digest("FIXTURE_RESOLUTION_POLICY", "policy-B"),
  diagnosticsDigest: digest("FIXTURE_DIAGNOSTICS", ["different path, same exact graph"]),
});
check("resolver and catalog evidence change Receipt but not Set", receiptA.recordId !== receiptB.recordId && readField(receiptA, ResolutionReceiptType, "resolvedSetRecordId") === readField(receiptB, ResolutionReceiptType, "resolvedSetRecordId"));
check("adding a QueryProfile does not change Type identity", releaseQueryV1.typeRevisionId === releaseQueryV2.typeRevisionId && releaseQueryV1.queryProfileId !== releaseQueryV2.queryProfileId);
check("adding a QueryProfile does not change an existing Record", releaseRecordR1.recordId === digest("FIXTURE_RECORD", { typeRevisionId: PackageReleaseType.typeRevisionId, bodyHash: digest("FIXTURE_RECORD_BODY", releaseRecordR1.body) }));

function projectSubject(record, occurrence) {
  return digest("FIXTURE_CATALOG_SUBJECT", { genesisRecordId: record.recordId, genesisOccurrenceId: occurrence.occurrenceId });
}
const catalogGenesisA = createRecord(CatalogProjectGenesisType, {
  charterDigest: digest("FIXTURE_CATALOG_CHARTER", "conservative catalog"),
  genesisNonce: digest("FIXTURE_NONCE", "catalog-A"),
});
const catalogGenesisB = createRecord(CatalogProjectGenesisType, {
  charterDigest: digest("FIXTURE_CATALOG_CHARTER", "experimental catalog"),
  genesisNonce: digest("FIXTURE_NONCE", "catalog-B"),
});
const catalogOccurrenceA = createOccurrence(catalogGenesisA, curatorA, realmA, 1);
const catalogOccurrenceB = createOccurrence(catalogGenesisB, curatorB, realmB, 1);
const catalogProjectA = projectSubject(catalogGenesisA, catalogOccurrenceA);
const catalogProjectB = projectSubject(catalogGenesisB, catalogOccurrenceB);
objectStore.set(catalogProjectA, { genesisOccurrenceId: catalogOccurrenceA.occurrenceId, authorPrincipalId: curatorA });
objectStore.set(catalogProjectB, { genesisOccurrenceId: catalogOccurrenceB.occurrenceId, authorPrincipalId: curatorB });

const membershipA = createRecord(CatalogMembershipType, {
  targetProjectId: projectIdA,
  selectedReleaseRef: authoredReleaseR1,
  disposition: "SELECTED",
  rank: 1,
  rationaleDigest: digest("FIXTURE_RATIONALE", "stable and no requested capabilities"),
});
const membershipB = createRecord(CatalogMembershipType, {
  targetProjectId: projectIdA,
  selectedReleaseRef: authoredReleaseR2,
  disposition: "SELECTED",
  rank: 1,
  rationaleDigest: digest("FIXTURE_RATIONALE", "experimental capability schema"),
});
const hostileCatalogPayload = createRecord(HostileCatalogPayloadType, {
  targetProjectId: projectIdA,
  autoInstall: true,
  launchUrl: "https://attacker.invalid/launch-now",
  requestedCapabilityText: "wallet+network+filesystem",
  trusted: true,
  buildHook: true,
}, { retain: false });
function catalogEdition(catalogProjectId, membership, label) {
  const rows = buildClosure([{
    path: "rows/0000.record",
    contentDigest: membership.recordId,
    size: byteLength(membership.body),
    role: "CATALOG_MEMBERSHIP",
  }], `${label}-rows`, { retainContent: false });
  const edition = createRecord(CatalogEditionType, {
    catalogProjectId,
    rowClosureRoot: rows.rootRecordId,
    rowCount: 1,
    declaredCoverage: "FINITE_EXACT",
    basisDigest: digest("FIXTURE_REALM_BASIS", label),
  });
  return { rows, edition };
}
const editionA = catalogEdition(catalogProjectA, membershipA, "catalog-A-edition-1");
const editionB = catalogEdition(catalogProjectB, membershipB, "catalog-B-edition-9");
const catalogReleaseRecordA = createRecord(CatalogReleaseType, {
  catalogProjectId: catalogProjectA,
  editionRecordId: editionA.edition.recordId,
  rowClosureRoot: editionA.rows.rootRecordId,
  rowCount: 1,
});
const catalogReleaseRecordB = createRecord(CatalogReleaseType, {
  catalogProjectId: catalogProjectB,
  editionRecordId: editionB.edition.recordId,
  rowClosureRoot: editionB.rows.rootRecordId,
  rowCount: 1,
});
const catalogReleaseOccurrenceA = createOccurrence(catalogReleaseRecordA, curatorA, realmA, 2);
const catalogReleaseOccurrenceB = createOccurrence(catalogReleaseRecordB, curatorB, realmB, 2);
const catalogReleaseA = catalogReleaseOccurrenceA.occurrenceId;
const catalogReleaseB = catalogReleaseOccurrenceB.occurrenceId;

const compatibilityVectorClosure = buildClosure([
  { path: "vectors/launch.json", content: canonical({ environment: "browser-fixture/v1", expected: "PASS" }), role: "COMPATIBILITY_VECTOR" },
], "compatibility-vectors");
const advisoryR1 = createRecord(AdvisoryType, {
  targetReleaseRef: authoredReleaseR1,
  result: "AFFECTED",
  severity: "MEDIUM",
  evidenceDigest: digest("FIXTURE_ADVISORY_EVIDENCE", "known parser bug"),
  affectedRangeSchemeId: labelScheme,
  affectedPredicate: "=1.0.0",
  basisDigest: digest("FIXTURE_ADVISORY_BASIS", "analysis-A"),
});
const advisoryCounterR1 = createRecord(AdvisoryType, {
  targetReleaseRef: authoredReleaseR1,
  result: "NOT_AFFECTED",
  severity: "LOW",
  evidenceDigest: digest("FIXTURE_ADVISORY_EVIDENCE", "conflicting independent analysis"),
  affectedRangeSchemeId: labelScheme,
  affectedPredicate: "=1.0.0",
  basisDigest: digest("FIXTURE_ADVISORY_BASIS", "analysis-B"),
});
const yankR1 = createRecord(YankClaimType, {
  targetReleaseRef: authoredReleaseR1,
  result: "YANKED",
  channelId: digest("FIXTURE_CHANNEL", "stable"),
  reasonDigest: digest("FIXTURE_YANK_REASON", "parser bug"),
  basisDigest: digest("FIXTURE_YANK_BASIS", "publisher-channel-12"),
});
const yankCounterR1 = createRecord(YankClaimType, {
  targetReleaseRef: authoredReleaseR1,
  result: "AVAILABLE",
  channelId: digest("FIXTURE_CHANNEL", "community-mirror"),
  reasonDigest: digest("FIXTURE_YANK_REASON", "retained mirror policy"),
  basisDigest: digest("FIXTURE_YANK_BASIS", "mirror-channel-4"),
});
const compatibilityR1 = createRecord(CompatibilityType, {
  targetReleaseRef: authoredReleaseR1,
  result: "PASS",
  runnerProfileId: runnerProfileV1,
  basisDigest: digest("FIXTURE_COMPATIBILITY_BASIS", "browser-fixture/v1"),
  environmentDigest: digest("FIXTURE_ENVIRONMENT", { browser: "fixture-browser-A", os: "fixture-os-A" }),
  testVectorClosureRoot: compatibilityVectorClosure.rootRecordId,
  limitationsDigest: digest("FIXTURE_LIMITATIONS", "one synthetic launch vector"),
});
const compatibilityFailR1 = createRecord(CompatibilityType, {
  targetReleaseRef: authoredReleaseR1,
  result: "FAIL",
  runnerProfileId: runnerProfileV1,
  basisDigest: digest("FIXTURE_COMPATIBILITY_BASIS", "browser-fixture/v2"),
  environmentDigest: digest("FIXTURE_ENVIRONMENT", { browser: "fixture-browser-B", os: "fixture-os-B" }),
  testVectorClosureRoot: compatibilityVectorClosure.rootRecordId,
  limitationsDigest: digest("FIXTURE_LIMITATIONS", "synthetic failure arm"),
});
const provenanceR1 = createRecord(ProvenanceType, {
  targetReleaseRef: authoredReleaseR1,
  sourceClosureRoot: sourceClosure.rootRecordId,
  forgeLocatorDigest: digest("FIXTURE_FORGE_LOCATOR", "https://forge.invalid/project/tree/exact"),
  result: "PASS",
  outputClosureRoot: smallPayloadClosure.rootRecordId,
  buildRecipeDigest: digest("FIXTURE_BUILD_RECIPE", { command: ["fixture-build", "--offline"], toolchain: "fixture-ts/v1" }),
  basisDigest: digest("FIXTURE_REBUILD_BASIS", "reproducer-A/run-1"),
});
const advisoryOccurrenceR1 = createOccurrence(advisoryR1, advisoryIssuerA, realmA, 1);
const advisoryCounterOccurrenceR1 = createOccurrence(advisoryCounterR1, advisoryIssuerB, realmB, 1);
const yankOccurrenceR1 = createOccurrence(yankR1, publisherA, realmA, 6);
const yankCounterOccurrenceR1 = createOccurrence(yankCounterR1, curatorB, realmB, 3);
const compatibilityOccurrenceR1 = createOccurrence(compatibilityR1, compatibilityTesterA, realmA, 1);
const compatibilityFailOccurrenceR1 = createOccurrence(compatibilityFailR1, compatibilityTesterB, realmB, 1);
const provenanceOccurrenceR1 = createOccurrence(provenanceR1, buildReproducerA, realmA, 1);
check("issuer-qualified advisory, yank, and compatibility claims may conflict over one unchanged Release", new Set([
  advisoryOccurrenceR1.occurrenceId,
  advisoryCounterOccurrenceR1.occurrenceId,
  yankOccurrenceR1.occurrenceId,
  yankCounterOccurrenceR1.occurrenceId,
  compatibilityOccurrenceR1.occurrenceId,
  compatibilityFailOccurrenceR1.occurrenceId,
]).size === 6 && releaseOccurrenceR1.occurrenceId === authoredReleaseR1);
check("evidence results do not mutate Release or resolved Set identity", readField(advisoryR1, AdvisoryType, "targetReleaseRef") === authoredReleaseR1 && readField(compatibilityFailR1, CompatibilityType, "targetReleaseRef") === authoredReleaseR1 && smallSetR1.record.recordId === readField(receiptA, ResolutionReceiptType, "resolvedSetRecordId"));
const evidenceClosureR1 = buildClosure([
  { path: "evidence/advisory.record", contentDigest: advisoryR1.recordId, size: byteLength(advisoryR1.body), role: "ADVISORY" },
  { path: "evidence/compatibility.record", contentDigest: compatibilityR1.recordId, size: byteLength(compatibilityR1.body), role: "COMPATIBILITY" },
  { path: "evidence/provenance.record", contentDigest: provenanceR1.recordId, size: byteLength(provenanceR1.body), role: "PROVENANCE" },
], "release-evidence", { retainContent: false });

const handoffR1 = createRecord(PackageHandoffType, {
  releaseRef: authoredReleaseR1,
  manifestRecordId: manifestR1.recordId,
  payloadClosureRoot: smallPayloadClosure.rootRecordId,
  resolvedSetRecordId: smallSetR1.record.recordId,
  resolutionReceiptRecordId: receiptA.recordId,
  runtimeRequestRecordId: runtimeRequestR1.recordId,
  selectedCatalogReleaseRef: catalogReleaseA,
  evidenceClosureRoot: evidenceClosureR1.rootRecordId,
  discoveryGrade: "COMPLETE",
  coverageDigest: digest("FIXTURE_DISCOVERY_COVERAGE", { catalogReleaseA, edition: editionA.edition.recordId }),
});
const directHandoffR1 = createRecord(PackageHandoffType, {
  releaseRef: authoredReleaseR1,
  manifestRecordId: manifestR1.recordId,
  payloadClosureRoot: smallPayloadClosure.rootRecordId,
  resolvedSetRecordId: smallSetR1.record.recordId,
  resolutionReceiptRecordId: receiptA.recordId,
  runtimeRequestRecordId: runtimeRequestR1.recordId,
  evidenceClosureRoot: evidenceClosureR1.rootRecordId,
  discoveryGrade: "COMPLETE",
  coverageDigest: digest("FIXTURE_DIRECT_EXACT_BASIS", { releaseRef: authoredReleaseR1, resolvedSetRecordId: smallSetR1.record.recordId }),
});
const forbiddenHandoffFieldNames = new Set([
  "RunnerRealization", "PreparedPackageSet", "InstallBindingGeneration", "InstallStatusLedger",
  "UpdateTrustState", "GrantDecisionGeneration", "GrantRevocationLedger", "StateBranch",
  "ProfileEvidenceSnapshot", "SystemActivationGeneration", "SystemActivationStatus", "LocalSelectionState",
  "effectiveGrants", "executionAuthority", "runtimeHandle", "localByteStatus",
]);
check("PackageHandoff Type excludes every named OS-local lifecycle field", !PackageHandoffType.fields.some((field) => forbiddenHandoffFieldNames.has(field.name)));

const strongerAdvisory = createRecord(AdvisoryType, {
  targetReleaseRef: authoredReleaseR1,
  result: "AFFECTED",
  severity: "HIGH",
  evidenceDigest: digest("FIXTURE_ADVISORY_EVIDENCE", "new independent analysis"),
  affectedRangeSchemeId: labelScheme,
  affectedPredicate: "=1.0.0",
  basisDigest: digest("FIXTURE_ADVISORY_BASIS", "analysis-A-revision-2"),
});
const evidenceClosureR1b = buildClosure([
  { path: "evidence/advisory.record", contentDigest: strongerAdvisory.recordId, size: byteLength(strongerAdvisory.body), role: "ADVISORY" },
  { path: "evidence/compatibility.record", contentDigest: compatibilityR1.recordId, size: byteLength(compatibilityR1.body), role: "COMPATIBILITY" },
  { path: "evidence/provenance.record", contentDigest: provenanceR1.recordId, size: byteLength(provenanceR1.body), role: "PROVENANCE" },
], "release-evidence-updated", { retainContent: false });
const handoffR1b = createRecord(PackageHandoffType, {
  releaseRef: authoredReleaseR1,
  manifestRecordId: manifestR1.recordId,
  payloadClosureRoot: smallPayloadClosure.rootRecordId,
  resolvedSetRecordId: smallSetR1.record.recordId,
  resolutionReceiptRecordId: receiptA.recordId,
  runtimeRequestRecordId: runtimeRequestR1.recordId,
  selectedCatalogReleaseRef: catalogReleaseA,
  evidenceClosureRoot: evidenceClosureR1b.rootRecordId,
  discoveryGrade: "COMPLETE",
  coverageDigest: digest("FIXTURE_DISCOVERY_COVERAGE", { catalogReleaseA, edition: editionA.edition.recordId }),
});
check("evidence update changes Handoff snapshot but not Release or Set", handoffR1.recordId !== handoffR1b.recordId && authoredReleaseR1 === readField(handoffR1b, PackageHandoffType, "releaseRef") && smallSetR1.record.recordId === readField(handoffR1b, PackageHandoffType, "resolvedSetRecordId"));

const osStateBeforeDiscovery = {
  preparedPackageSets: 0,
  grantDecisions: 0,
  installBindings: 0,
  activations: 0,
  effectiveCapabilities: 0,
};
function discoverCatalogMemberships(records, osState, effectSink, localByteCache) {
  const recognizedMemberships = records.filter((record) => record.typeRevisionId === CatalogMembershipType.typeRevisionId);
  return {
    candidates: recognizedMemberships.map((membership) => ({
      projectId: readField(membership, CatalogMembershipType, "targetProjectId"),
      releaseRef: readField(membership, CatalogMembershipType, "selectedReleaseRef"),
      disposition: readField(membership, CatalogMembershipType, "disposition"),
    })),
    unrecognizedEvidenceCount: records.length - recognizedMemberships.length,
    osState,
    effectCalls: { ...effectSink },
    retainedByteCount: localByteCache.size,
  };
}
const discoveryEffectSink = { prepare: 0, grant: 0, bind: 0, activate: 0 };
const discoveryByteCache = new Set();
const discoveryResult = discoverCatalogMemberships([membershipA, membershipB, hostileCatalogPayload], osStateBeforeDiscovery, discoveryEffectSink, discoveryByteCache);
check("fixture catalog adapter never installs, grants, binds, activates, or retains bytes", canonical(discoveryResult.osState) === canonical(osStateBeforeDiscovery) && Object.values(discoveryResult.osState).every((value) => value === 0) && Object.values(discoveryResult.effectCalls).every((value) => value === 0) && discoveryResult.retainedByteCount === 0);
check("hostile auto-install/capability/build-hook payload remains unrecognized evidence", discoveryResult.unrecognizedEvidenceCount === 1 && discoveryResult.candidates.length === 2);
check("catalog-free direct exact handoff remains independent of catalog selection", authoredReleaseR1 === readField(directHandoffR1, PackageHandoffType, "releaseRef") && readField(directHandoffR1, PackageHandoffType, "selectedCatalogReleaseRef") === undefined);

const keyReferenceValidations = [
  [manifestR1, PackageManifestType],
  [releaseRecordR1, PackageReleaseType],
  [labelClaim100, VersionLabelClaimType],
  [smallSetR1.record, ResolvedPackageSetType],
  [receiptA, ResolutionReceiptType],
  [membershipA, CatalogMembershipType],
  [editionA.edition, CatalogEditionType],
  [catalogReleaseRecordA, CatalogReleaseType],
  [advisoryR1, AdvisoryType],
  [yankR1, YankClaimType],
  [compatibilityR1, CompatibilityType],
  [provenanceR1, ProvenanceType],
  [handoffR1, PackageHandoffType],
  [directHandoffR1, PackageHandoffType],
].map(([record, type]) => ({ type: type.name, result: validateRecordReferenceRoles(record, type) }));
check("all package/catalog/evidence/handoff reference roles resolve to their closed target classes", keyReferenceValidations.every(({ result }) => result.status === "VALID"));

const wrongManifestReferences = createRecord(PackageManifestType, {
  projectId: projectIdA,
  packageProfileId,
  payloadClosureRoot: advisoryR1.recordId,
  runtimeRequestRecordId: runtimeRequestR1.recordId,
  dependencyRequirementClosureRoot: dependencyRequirementClosure.rootRecordId,
  externalBoundary: "SELF_CONTAINED",
  stateContractId,
}, { retain: false });
const wrongReleaseReferences = createRecord(PackageReleaseType, {
  projectId: projectIdA,
  manifestRecordId: advisoryR1.recordId,
  payloadClosureRoot: smallPayloadClosure.rootRecordId,
  packageProfileId,
}, { retain: false });
const smallPayloadLeaf = recordStore.get(smallPayloadClosure.rootRecordId);
const firstClosureMemberRecordId = readField(smallPayloadLeaf, ClosureLeafType, "memberRefs")[0];
const wrongBranchReferences = createRecord(ClosureBranchType, {
  memberCount: 1,
  aggregateDigest: digest("FIXTURE_WRONG_BRANCH", "member-record-child"),
  childRefs: [firstClosureMemberRecordId],
}, { retain: false });
const wrongReceiptReferences = createRecord(ResolutionReceiptType, {
  resolvedSetRecordId: advisoryR1.recordId,
  resolverId: resolverA,
  resolverVersion: "invalid/1",
  catalogBasisDigest: digest("FIXTURE_CATALOG_BASIS", "invalid"),
  policyDigest: digest("FIXTURE_RESOLUTION_POLICY", "invalid"),
  diagnosticsDigest: digest("FIXTURE_DIAGNOSTICS", "invalid"),
}, { retain: false });
const wrongHandoffCatalogReference = createRecord(PackageHandoffType, {
  releaseRef: authoredReleaseR1,
  manifestRecordId: manifestR1.recordId,
  payloadClosureRoot: smallPayloadClosure.rootRecordId,
  resolvedSetRecordId: smallSetR1.record.recordId,
  resolutionReceiptRecordId: receiptA.recordId,
  runtimeRequestRecordId: runtimeRequestR1.recordId,
  selectedCatalogReleaseRef: authoredReleaseR1,
  evidenceClosureRoot: evidenceClosureR1.rootRecordId,
  discoveryGrade: "COMPLETE",
  coverageDigest: digest("FIXTURE_DISCOVERY_COVERAGE", "wrong catalog occurrence class"),
}, { retain: false });
const negativeReferenceValidations = {
  manifestWrongView: validateRecordReferenceRoles(wrongManifestReferences, PackageManifestType),
  releaseWrongManifestType: validateRecordReferenceRoles(wrongReleaseReferences, PackageReleaseType),
  branchWrongChildClass: validateRecordReferenceRoles(wrongBranchReferences, ClosureBranchType),
  receiptWrongSetType: validateRecordReferenceRoles(wrongReceiptReferences, ResolutionReceiptType),
  handoffWrongCatalogOccurrenceType: validateRecordReferenceRoles(wrongHandoffCatalogReference, PackageHandoffType),
};
check("wrong exact Type/View/Occurrence reference targets are rejected", Object.values(negativeReferenceValidations).every((result) => result.status === "INVALID"));

function queryAbsenceResult({ queryProfileId, coverage, rows, cursor }) {
  if (coverage.queryProfileId !== queryProfileId) {
    return { absenceProven: false, status: "UNSUPPORTED", reason: "QUERY_PROFILE_MISMATCH", rows, cursor };
  }
  const terminal = coverage.status === "COMPLETE"
    && coverage.backfillComplete === true
    && Number.isSafeInteger(coverage.terminalHighWater)
    && /^sha256:[0-9a-f]{64}$/.test(coverage.basisId);
  if (!terminal) return { absenceProven: false, status: coverage.status, rows, cursor, basisId: coverage.basisId };
  return { absenceProven: rows.length === 0, status: "COMPLETE", rows, cursor: null, basisId: coverage.basisId, terminalHighWater: coverage.terminalHighWater };
}
const releaseQueryBasis = digest("FIXTURE_QUERY_BASIS", "release-query-realm-a-generation-3");
const emptyPartial = queryAbsenceResult({
  queryProfileId: releaseQueryV1.queryProfileId,
  coverage: { queryProfileId: releaseQueryV1.queryProfileId, status: "PARTIAL", backfillComplete: false, terminalHighWater: 41, basisId: releaseQueryBasis },
  rows: [],
  cursor: "cursor-17",
});
const emptyComplete = queryAbsenceResult({
  queryProfileId: releaseQueryV1.queryProfileId,
  coverage: { queryProfileId: releaseQueryV1.queryProfileId, status: "COMPLETE", backfillComplete: true, terminalHighWater: 42, basisId: releaseQueryBasis },
  rows: [],
  cursor: null,
});
const emptyYankPartial = queryAbsenceResult({
  queryProfileId: yankQuery.queryProfileId,
  coverage: { queryProfileId: yankQuery.queryProfileId, status: "PARTIAL", backfillComplete: false, terminalHighWater: 7, basisId: digest("FIXTURE_QUERY_BASIS", "yank-partial") },
  rows: [],
  cursor: "yank-cursor-8",
});
check("empty PARTIAL page is not absence", emptyPartial.absenceProven === false && emptyPartial.cursor === "cursor-17");
check("empty COMPLETE exact-profile page proves only scoped absence", emptyComplete.absenceProven === true);
check("empty partial yank query remains UNKNOWN rather than evidence of availability", emptyYankPartial.absenceProven === false && emptyYankPartial.status === "PARTIAL");

let maliciousViewError = null;
try {
  validateViewBinding(PackageReleaseType.fields, ReleaseIdentityView, [
    { slotKey: 1, op: "deref", fieldKey: 1 },
    { slotKey: 2, op: "directField", fieldKey: 2 },
    { slotKey: 3, op: "directField", fieldKey: 3 },
  ]);
} catch (error) {
  maliciousViewError = error;
}
check("bounded View rejects dereference", maliciousViewError?.code === "VIEW_BINDING_UNBOUNDED");

const overBudgetView = {
  slots: Array.from({ length: MAX_VIEW_SLOTS + 1 }, (_, index) => ({ key: index + 1, kind: "id" })),
};
let overBudgetViewError = null;
try {
  validateViewBinding(
    Array.from({ length: MAX_VIEW_SLOTS + 1 }, (_, index) => ({ key: index + 1, kind: "id" })),
    overBudgetView,
    Array.from({ length: MAX_VIEW_SLOTS + 1 }, (_, index) => ({ slotKey: index + 1, op: "directField", fieldKey: index + 1 })),
  );
} catch (error) {
  overBudgetViewError = error;
}
check("bounded View rejects a ninth fixture slot", overBudgetViewError?.code === "VIEW_SLOT_LIMIT");
let duplicateViewMappingError = null;
try {
  validateViewBinding(PackageReleaseType.fields, ReleaseIdentityView, [
    { slotKey: 1, op: "directField", fieldKey: 1 },
    { slotKey: 1, op: "directField", fieldKey: 1 },
    { slotKey: 2, op: "directField", fieldKey: 2 },
    { slotKey: 3, op: "directField", fieldKey: 3 },
  ]);
} catch (error) {
  duplicateViewMappingError = error;
}
check("bounded View rejects duplicate slot mappings", duplicateViewMappingError?.code === "VIEW_DUPLICATE_MAPPING");

const closure16 = buildClosure(syntheticMembers(16, "closure16"), "closure16", { retain: true, retainContent: false });
const closure17 = buildClosure(syntheticMembers(17, "closure17"), "closure17", { retain: true, retainContent: false });
const candidateTypePackageTypeRoots = [
  ProjectGenesisType,
  RuntimeRequestType,
  PackageManifestType,
  PackageReleaseType,
  ResolvedPackageSetType,
  ResolutionReceiptType,
  CatalogMembershipType,
  CatalogEditionType,
  CatalogReleaseType,
  AdvisoryType,
  CompatibilityType,
  ProvenanceType,
];
const candidateTypePackageViewRoots = [
  ClosureSummaryView,
  ReleaseIdentityView,
  CatalogMembershipView,
  EvidenceTargetView,
  LineageKeyView,
];
const exactTypePackageMembers = [
  ...candidateTypePackageTypeRoots.map((type, index) => ({
    path: `exact/types/${String(index).padStart(3, "0")}.json`,
    content: canonical({ typeRevisionId: type.typeRevisionId, descriptor: type.descriptor }),
    role: "EXACT_TYPE_DESCRIPTOR",
  })),
  ...candidateTypePackageViewRoots.map((view, index) => ({
    path: `exact/views/${String(index).padStart(3, "0")}.json`,
    content: canonical({ viewRevisionId: view.viewRevisionId, descriptor: view.canonicalView }),
    role: "EXACT_VIEW_DESCRIPTOR",
  })),
];
const typePackage10kMembers = [
  ...exactTypePackageMembers,
  ...Array.from({ length: 10_000 - exactTypePackageMembers.length }, (_, index) => ({
    path: `vectors/${String(index).padStart(5, "0")}.json`,
    content: canonical({ fixtureVector: index, expected: digest("FIXTURE_VECTOR_EXPECTED", index) }),
    role: "CONFORMANCE_VECTOR",
  })),
];
const closure10kStart = performance.now();
const closure10kHeapBefore = process.memoryUsage().heapUsed;
const closure10k = buildClosure(typePackage10kMembers, "type-package-closure10k", { retain: true, retainContent: true });
const closure10kHeapAfter = process.memoryUsage().heapUsed;
const closure10kElapsedMs = performance.now() - closure10kStart;
check("16 members fit one closure node", closure16.memberCount === 16 && closure16.closureNodeCount === 1 && closure16.depth === 1);
check("17 members use canonical nesting rather than a wider node", closure17.memberCount === 17 && closure17.closureNodeCount === 3 && closure17.depth === 2);
check("10k members remain within direct-reference and depth budgets", closure10k.memberCount === 10_000 && closure10k.closureNodeCount === 669 && closure10k.depth === 4 && closure10k.maxDirectRefs === 16);
const liveClosureStores = { records: recordStore, contents: contentStore };
const closure16Validation = walkClosure(closure16.rootRecordId, liveClosureStores, { requireContent: false });
const closure17Validation = walkClosure(closure17.rootRecordId, liveClosureStores, { requireContent: false });
const closure10kValidation = walkClosure(closure10k.rootRecordId, liveClosureStores, { requireContent: true, maxMembers: 10_000 });
check("16/17/10k closure validators recompute counts, ordering, and aggregate digests", closure16Validation.status === "COMPLETE" && closure17Validation.status === "COMPLETE" && closure10kValidation.status === "COMPLETE" && closure10kValidation.members === 10_000);
const malformedClosureLeaf = createRecord(ClosureLeafType, {
  memberCount: readField(recordStore.get(closure16.rootRecordId), ClosureLeafType, "memberCount"),
  aggregateDigest: digest("FIXTURE_WRONG_AGGREGATE", "closure16"),
  memberRefs: readField(recordStore.get(closure16.rootRecordId), ClosureLeafType, "memberRefs"),
}, { retain: false });
const malformedClosureStores = { records: new Map(recordStore), contents: contentStore };
malformedClosureStores.records.set(malformedClosureLeaf.recordId, malformedClosureLeaf);
const malformedClosureValidation = walkClosure(malformedClosureLeaf.recordId, malformedClosureStores, { requireContent: false });
check("hash-valid but semantically false closure aggregate is rejected", malformedClosureValidation.status === "INVALID" && malformedClosureValidation.reason === "LEAF_AGGREGATE_DIGEST");

const typePackageProjectId = digest("FIXTURE_TYPE_PACKAGE_PROJECT", "type-package-project");
objectStore.set(typePackageProjectId, { fixture: "type package project" });
const directTypeRootIds = candidateTypePackageTypeRoots.map((type) => type.typeRevisionId);
const directViewRootIds = candidateTypePackageViewRoots.slice(0, 4).map((view) => view.viewRevisionId);
let typePackageReferenceTraversalCount = 0;
function createTypePackageRelease(values, { retain = false } = {}) {
  const directCount = values.directTypeRootIds.length + values.directViewRootIds.length;
  if (directCount > MAX_DIRECT_REFS) {
    throw new FixtureValidationError("DIRECT_REFERENCE_LIMIT", `Type package has ${directCount} direct roots`);
  }
  const record = createRecord(TypePackageReleaseType, values, { retain });
  const validation = validateRecordReferenceRoles(record, TypePackageReleaseType);
  typePackageReferenceTraversalCount += validation.results.length;
  if (validation.status !== "VALID") throw new FixtureValidationError("REFERENCE_TARGET", canonical(validation.invalid));
  return record;
}
const typePackage16 = createTypePackageRelease({
  packageProjectId: typePackageProjectId,
  directTypeRootIds,
  directViewRootIds,
  artifactClosureRoot: closure10k.rootRecordId,
  closureEntryCount: closure10k.memberCount,
}, { retain: true });
const missingDirectDescriptorClosure = buildClosure([{
  path: "vectors/only.json",
  content: canonical({ fixtureVector: "no-direct-root-descriptor" }),
  role: "CONFORMANCE_VECTOR",
}], "missing-direct-descriptor", { retain: true, retainContent: true });
const missingDirectDescriptorPackage = createTypePackageRelease({
  packageProjectId: typePackageProjectId,
  directTypeRootIds: [directTypeRootIds[0]],
  directViewRootIds: [],
  artifactClosureRoot: missingDirectDescriptorClosure.rootRecordId,
  closureEntryCount: missingDirectDescriptorClosure.memberCount,
}, { retain: true });
const mismatchedDirectDescriptorClosure = buildClosure([{
  path: "exact/types/substituted.json",
  content: canonical({
    typeRevisionId: directTypeRootIds[0],
    descriptor: candidateTypePackageTypeRoots[1].descriptor,
  }),
  role: "EXACT_TYPE_DESCRIPTOR",
}], "mismatched-direct-descriptor", { retain: true, retainContent: true });
const mismatchedDirectDescriptorPackage = createTypePackageRelease({
  packageProjectId: typePackageProjectId,
  directTypeRootIds: [directTypeRootIds[0]],
  directViewRootIds: [],
  artifactClosureRoot: mismatchedDirectDescriptorClosure.rootRecordId,
  closureEntryCount: mismatchedDirectDescriptorClosure.memberCount,
}, { retain: true });
const traversalCountAfter16 = typePackageReferenceTraversalCount;
let direct17Error = null;
try {
  createTypePackageRelease({
    packageProjectId: typePackageProjectId,
    directTypeRootIds,
    directViewRootIds: candidateTypePackageViewRoots.map((view) => view.viewRevisionId),
    artifactClosureRoot: closure10k.rootRecordId,
    closureEntryCount: closure10k.memberCount,
  });
} catch (error) {
  direct17Error = error;
}
check("16 exact Type/View direct package roots validate against closed target classes", Boolean(typePackage16.recordId) && directTypeRootIds.length + directViewRootIds.length === 16);
check("17th direct Type/View root rejects before target traversal", direct17Error?.code === "DIRECT_REFERENCE_LIMIT" && typePackageReferenceTraversalCount === traversalCountAfter16);
check("16 direct roots can close over a semantically validated 10k-member nested package", readField(typePackage16, TypePackageReleaseType, "artifactClosureRoot") === closure10k.rootRecordId && readField(typePackage16, TypePackageReleaseType, "closureEntryCount") === 10_000 && closure10kValidation.status === "COMPLETE");

function buildScaleGraph(environment) {
  const nodes = Array.from({ length: 10_000 }, (_, index) => {
    const projectIndex = index < 1600 ? Math.floor(index / 2) : 800 + (index - 1600);
    return {
      projectId: digest("FIXTURE_SCALE_PROJECT", projectIndex),
      releaseRef: digest("FIXTURE_SCALE_AUTHORED_RELEASE", index),
      manifestRecordId: digest("FIXTURE_SCALE_MANIFEST", index),
      payloadClosureRoot: digest("FIXTURE_SCALE_PAYLOAD_CLOSURE", index),
      runtimeRequestRecordId: digest("FIXTURE_SCALE_RUNTIME_REQUEST", index),
      role: index === 0 ? "ROOT" : "LIBRARY",
    };
  });
  const release = (index) => nodes[index % nodes.length].releaseRef;
  const edges = [];
  for (let block = 0; block < 100; block += 1) {
    const start = block * 100;
    for (let offset = 0; offset < 100; offset += 1) {
      edges.push({ from: release(start + offset), to: release(start + ((offset + 1) % 100)), kind: "REQUIRED", slot: `ring-${offset}` });
    }
    if (block < 99) edges.push({ from: release(start), to: release(start + 100), kind: "INTER_SCC", slot: `chain-${block}` });
  }
  for (let index = 0; index < 1000; index += 1) {
    edges.push({ from: release(index * 10), to: release(index * 10 + 17), kind: "PEER", slot: `peer-${index}` });
  }
  for (let index = 0; index < 910; index += 1) {
    edges.push({ from: release(index * 11), to: release(index * 11 + 31), kind: "OPTIONAL_SELECTED", slot: `feature-${index}` });
  }
  for (let index = 0; index < 770; index += 1) {
    const targetDelta = environment === "linux-x64" ? 23 : 29;
    edges.push({ from: release(index * 13), to: release(index * 13 + targetDelta), kind: "PLATFORM_SELECTED", slot: `platform-${index}` });
  }
  const activationUnits = Array.from({ length: 32 }, (_, index) => ({
    releaseRef: release(index * 313),
    runtimeRequestRecordId: nodes[index * 313].runtimeRequestRecordId,
    executableHook: index === 31,
    executedDuringResolution: false,
  }));
  return { environment, nodes, edges, activationUnits };
}

function replaceRelease(graph, nodeIndex) {
  const oldRelease = graph.nodes[nodeIndex].releaseRef;
  const newRelease = digest("FIXTURE_SCALE_AUTHORED_RELEASE_MUTATION", nodeIndex);
  return {
    environment: graph.environment,
    nodes: graph.nodes.map((node, index) => index === nodeIndex ? { ...node, releaseRef: newRelease } : { ...node }),
    edges: graph.edges.map((edge) => ({
      ...edge,
      from: edge.from === oldRelease ? newRelease : edge.from,
      to: edge.to === oldRelease ? newRelease : edge.to,
    })),
    activationUnits: graph.activationUnits.map((unit) => ({
      ...unit,
      releaseRef: unit.releaseRef === oldRelease ? newRelease : unit.releaseRef,
    })),
  };
}

function sccCount(nodes, edges) {
  const ids = nodes.map((node) => node.releaseRef);
  const adjacency = new Map(ids.map((id) => [id, []]));
  const reverse = new Map(ids.map((id) => [id, []]));
  for (const edge of edges.filter((edge) => edge.kind === "REQUIRED" || edge.kind === "INTER_SCC")) {
    adjacency.get(edge.from).push(edge.to);
    reverse.get(edge.to).push(edge.from);
  }
  const seen = new Set();
  const order = [];
  for (const root of ids) {
    if (seen.has(root)) continue;
    const stack = [[root, false]];
    while (stack.length) {
      const [node, expanded] = stack.pop();
      if (expanded) {
        order.push(node);
        continue;
      }
      if (seen.has(node)) continue;
      seen.add(node);
      stack.push([node, true]);
      for (const next of adjacency.get(node)) if (!seen.has(next)) stack.push([next, false]);
    }
  }
  const assigned = new Set();
  let count = 0;
  for (const root of order.reverse()) {
    if (assigned.has(root)) continue;
    count += 1;
    const stack = [root];
    assigned.add(root);
    while (stack.length) {
      const node = stack.pop();
      for (const next of reverse.get(node)) {
        if (!assigned.has(next)) {
          assigned.add(next);
          stack.push(next);
        }
      }
    }
  }
  return count;
}

const scaleStart = performance.now();
const scaleHeapBefore = process.memoryUsage().heapUsed;
const linuxGraph = buildScaleGraph("linux-x64");
const linuxSetA = createSetRecord(linuxGraph, linuxGraph.nodes[0].releaseRef, "scale-linux-A", false);
const linuxSetB = createSetRecord({
  ...linuxGraph,
  nodes: [...linuxGraph.nodes].reverse(),
  edges: [...linuxGraph.edges].reverse(),
  activationUnits: [...linuxGraph.activationUnits].reverse(),
}, linuxGraph.nodes[0].releaseRef, "scale-linux-B", false);
const macGraph = buildScaleGraph("macos-arm64");
const macSet = createSetRecord(macGraph, macGraph.nodes[0].releaseRef, "scale-macos", false);
const mutatedLinuxGraph = replaceRelease(linuxGraph, 5000);
const mutatedLinuxSet = createSetRecord(mutatedLinuxGraph, mutatedLinuxGraph.nodes[0].releaseRef, "scale-linux-mutated", false);
const observedSccCount = sccCount(linuxGraph.nodes, linuxGraph.edges);
const scaleHeapAfter = process.memoryUsage().heapUsed;
const scaleElapsedMs = performance.now() - scaleStart;
check("10k Set canonicalization ignores input traversal order", linuxSetA.record.recordId === linuxSetB.record.recordId);
check("environment selection changes exact Set identity", linuxSetA.record.recordId !== macSet.record.recordId);
check("one transitive Release mutation changes Set identity", linuxSetA.record.recordId !== mutatedLinuxSet.record.recordId && readField(linuxSetA.record, ResolvedPackageSetType, "rootReleaseRef") === readField(mutatedLinuxSet.record, ResolvedPackageSetType, "rootReleaseRef"));
check("scale graph contains 9,200 Projects and 10,000 Releases", new Set(linuxGraph.nodes.map((node) => node.projectId)).size === 9200 && linuxGraph.nodes.length === 10_000);
check("required graph reconstructs 100 intended SCCs", observedSccCount === 100);
check("32 hook activation units remain inert during resolution", linuxGraph.activationUnits.length === 32 && linuxGraph.activationUnits.every((unit) => unit.executedDuringResolution === false));

function verifyRecord(record) {
  return record.recordId === digest("FIXTURE_RECORD", {
    typeRevisionId: record.typeRevisionId,
    bodyHash: digest("FIXTURE_RECORD_BODY", record.body),
  });
}

function walkClosure(rootRecordId, stores, {
  requireContent,
  requireReferencedRecord = false,
  maxDepth = 16,
  maxNodes = 100_000,
  maxMembers = 100_000,
} = {}) {
  const visiting = new Set();
  const memo = new Map();
  let nodeCount = 0;

  function fail(status, reason, detail = {}) {
    return { status, reason, members: 0, visited: nodeCount, entries: [], ...detail };
  }

  function visit(recordId, depth) {
    if (depth > maxDepth) return fail("UNSUPPORTED", "DEPTH_LIMIT");
    if (visiting.has(recordId)) return fail("INVALID", "CLOSURE_CYCLE");
    if (memo.has(recordId)) return memo.get(recordId);
    const record = stores.records.get(recordId);
    if (!record) return fail("UNKNOWN", "MISSING_RECORD");
    if (!verifyRecord(record)) return fail("INVALID", "INVALID_RECORD_HASH");
    nodeCount += 1;
    if (nodeCount > maxNodes) return fail("UNSUPPORTED", "NODE_LIMIT");
    visiting.add(recordId);
    let result;
    if (record.typeRevisionId === ClosureLeafType.typeRevisionId) {
      const memberRefs = readField(record, ClosureLeafType, "memberRefs");
      if (new Set(memberRefs).size !== memberRefs.length) {
        result = fail("INVALID", "DUPLICATE_MEMBER_REF");
      } else {
        const entries = [];
        for (const memberRef of memberRefs) {
          const member = stores.records.get(memberRef);
          if (!member) {
            result = fail("UNKNOWN", "MISSING_MEMBER_RECORD");
            break;
          }
          if (!verifyRecord(member) || member.typeRevisionId !== ClosureMemberType.typeRevisionId) {
            result = fail("INVALID", "INVALID_MEMBER_RECORD");
            break;
          }
          const entry = {
            path: readField(member, ClosureMemberType, "path"),
            contentDigest: readField(member, ClosureMemberType, "contentDigest"),
            size: readField(member, ClosureMemberType, "size"),
            role: readField(member, ClosureMemberType, "role"),
            memberRecordId: member.recordId,
          };
          try {
            normalizePath(entry.path);
          } catch {
            result = fail("INVALID", "INVALID_MEMBER_PATH");
            break;
          }
          if (requireReferencedRecord) {
            const referencedRecord = stores.records.get(entry.contentDigest);
            if (!referencedRecord) {
              result = fail("UNKNOWN", "MISSING_REFERENCED_RECORD");
              break;
            }
            if (!verifyRecord(referencedRecord)) {
              result = fail("INVALID", "INVALID_REFERENCED_RECORD");
              break;
            }
          }
          if (requireContent) {
            const content = stores.contents.get(entry.contentDigest);
            if (content === undefined) {
              result = fail("UNKNOWN", "MISSING_BYTES");
              break;
            }
            if (digest("FIXTURE_CONTENT", content) !== entry.contentDigest || Buffer.byteLength(content, "utf8") !== entry.size) {
              result = fail("INVALID", "INVALID_BYTES");
              break;
            }
          }
          entries.push(entry);
          if (entries.length > maxMembers) {
            result = fail("UNSUPPORTED", "MEMBER_LIMIT");
            break;
          }
        }
        if (!result) {
          const semanticEntries = entries.map(({ path, contentDigest, size, role }) => ({ path, contentDigest, size, role }));
          if (readField(record, ClosureLeafType, "memberCount") !== entries.length) {
            result = fail("INVALID", "LEAF_MEMBER_COUNT");
          } else if (readField(record, ClosureLeafType, "aggregateDigest") !== digest("FIXTURE_CLOSURE_RANGE", semanticEntries)) {
            result = fail("INVALID", "LEAF_AGGREGATE_DIGEST");
          } else {
            result = { status: "COMPLETE", members: entries.length, visited: nodeCount, entries, depth };
          }
        }
      }
    } else if (record.typeRevisionId === ClosureBranchType.typeRevisionId) {
      const childRefs = readField(record, ClosureBranchType, "childRefs");
      if (new Set(childRefs).size !== childRefs.length) {
        result = fail("INVALID", "DUPLICATE_CHILD_REF");
      } else {
        const entries = [];
        let childDepth = depth;
        for (const childRef of childRefs) {
          const child = visit(childRef, depth + 1);
          if (child.status !== "COMPLETE") {
            result = child;
            break;
          }
          entries.push(...child.entries);
          childDepth = Math.max(childDepth, child.depth);
          if (entries.length > maxMembers) {
            result = fail("UNSUPPORTED", "MEMBER_LIMIT");
            break;
          }
        }
        if (!result) {
          const semanticEntries = entries.map(({ path, contentDigest, size, role }) => ({ path, contentDigest, size, role }));
          if (readField(record, ClosureBranchType, "memberCount") !== entries.length) {
            result = fail("INVALID", "BRANCH_MEMBER_COUNT");
          } else if (readField(record, ClosureBranchType, "aggregateDigest") !== digest("FIXTURE_CLOSURE_RANGE", semanticEntries)) {
            result = fail("INVALID", "BRANCH_AGGREGATE_DIGEST");
          } else {
            result = { status: "COMPLETE", members: entries.length, visited: nodeCount, entries, depth: childDepth };
          }
        }
      }
    } else {
      result = fail("INVALID", "WRONG_CLOSURE_NODE_TYPE");
    }
    visiting.delete(recordId);
    memo.set(recordId, result);
    return result;
  }

  const result = visit(rootRecordId, 1);
  if (result.status !== "COMPLETE") return result;
  for (let index = 1; index < result.entries.length; index += 1) {
    if (utf8Compare(result.entries[index - 1].path, result.entries[index].path) >= 0) {
      return fail("INVALID", "NON_CANONICAL_OR_DUPLICATE_PATH_ORDER", { members: result.entries.length });
    }
  }
  return { ...result, visited: nodeCount };
}

function reconstructTypePackageFromClosure(typePackageRecordId, stores) {
  const typePackage = stores.records.get(typePackageRecordId);
  if (!typePackage) return { status: "UNKNOWN", reason: "MISSING_TYPE_PACKAGE_RECORD" };
  if (!verifyRecord(typePackage) || typePackage.typeRevisionId !== TypePackageReleaseType.typeRevisionId) {
    return { status: "INVALID", reason: "INVALID_TYPE_PACKAGE_RECORD" };
  }
  const packageProjectId = readField(typePackage, TypePackageReleaseType, "packageProjectId");
  if (!stores.objects.get(packageProjectId)) return { status: "UNKNOWN", reason: "MISSING_TYPE_PACKAGE_PROJECT" };
  const directTypeRootIds = readField(typePackage, TypePackageReleaseType, "directTypeRootIds");
  const directViewRootIds = readField(typePackage, TypePackageReleaseType, "directViewRootIds");
  if (new Set(directTypeRootIds).size !== directTypeRootIds.length) return { status: "INVALID", reason: "DUPLICATE_DIRECT_TYPE_ROOT" };
  if (new Set(directViewRootIds).size !== directViewRootIds.length) return { status: "INVALID", reason: "DUPLICATE_DIRECT_VIEW_ROOT" };
  if (directTypeRootIds.length + directViewRootIds.length > MAX_DIRECT_REFS) return { status: "UNSUPPORTED", reason: "DIRECT_REFERENCE_LIMIT" };

  const closure = walkClosure(readField(typePackage, TypePackageReleaseType, "artifactClosureRoot"), stores, {
    requireContent: true,
    maxMembers: readField(typePackage, TypePackageReleaseType, "closureEntryCount"),
  });
  if (closure.status !== "COMPLETE") return { status: closure.status, reason: `TYPE_PACKAGE_CLOSURE_${closure.reason}`, closure };
  if (closure.members !== readField(typePackage, TypePackageReleaseType, "closureEntryCount")) {
    return { status: "INVALID", reason: "TYPE_PACKAGE_ENTRY_COUNT_MISMATCH" };
  }

  const typeDescriptors = new Map();
  const viewDescriptors = new Map();
  for (const entry of closure.entries) {
    if (!new Set(["EXACT_TYPE_DESCRIPTOR", "EXACT_VIEW_DESCRIPTOR"]).has(entry.role)) continue;
    let decoded;
    try {
      decoded = JSON.parse(stores.contents.get(entry.contentDigest));
    } catch {
      return { status: "INVALID", reason: "INVALID_DESCRIPTOR_BYTES", path: entry.path };
    }
    if (!decoded || typeof decoded !== "object" || !decoded.descriptor || typeof decoded.descriptor !== "object") {
      return { status: "INVALID", reason: "INVALID_DESCRIPTOR_SHAPE", path: entry.path };
    }
    if (entry.role === "EXACT_TYPE_DESCRIPTOR") {
      const recomputedId = digest("FIXTURE_TYPE_REVISION", decoded.descriptor);
      if (decoded.typeRevisionId !== recomputedId) {
        return { status: "INVALID", reason: "TYPE_DESCRIPTOR_ID_MISMATCH", path: entry.path };
      }
      if (typeDescriptors.has(recomputedId)) return { status: "INVALID", reason: "DUPLICATE_TYPE_DESCRIPTOR", path: entry.path };
      typeDescriptors.set(recomputedId, entry);
    } else {
      const recomputedId = digest("FIXTURE_VIEW_REVISION", decoded.descriptor);
      if (decoded.viewRevisionId !== recomputedId) {
        return { status: "INVALID", reason: "VIEW_DESCRIPTOR_ID_MISMATCH", path: entry.path };
      }
      if (viewDescriptors.has(recomputedId)) return { status: "INVALID", reason: "DUPLICATE_VIEW_DESCRIPTOR", path: entry.path };
      viewDescriptors.set(recomputedId, entry);
    }
  }
  for (const rootId of directTypeRootIds) {
    if (!typeDescriptors.has(rootId)) return { status: "INVALID", reason: "MISSING_DIRECT_TYPE_DESCRIPTOR", rootId };
  }
  for (const rootId of directViewRootIds) {
    if (!viewDescriptors.has(rootId)) return { status: "INVALID", reason: "MISSING_DIRECT_VIEW_DESCRIPTOR", rootId };
  }
  return {
    status: "COMPLETE",
    closure,
    boundTypeRoots: directTypeRootIds.length,
    boundViewRoots: directViewRootIds.length,
    discoveredTypeDescriptors: typeDescriptors.size,
    discoveredViewDescriptors: viewDescriptors.size,
  };
}

function reconstructResolvedPackageSet(setRecordId, stores) {
  const setRecord = stores.records.get(setRecordId);
  if (!setRecord) return { status: "UNKNOWN", reason: "MISSING_SET_RECORD" };
  if (!verifyRecord(setRecord) || setRecord.typeRevisionId !== ResolvedPackageSetType.typeRevisionId) {
    return { status: "INVALID", reason: "INVALID_SET_RECORD" };
  }
  const referenceValidation = validateRecordReferenceRoles(setRecord, ResolvedPackageSetType, referenceStores({
    records: stores.records,
    occurrences: stores.occurrences,
    objects: stores.objects,
  }));
  if (referenceValidation.status !== "VALID") return { status: "UNKNOWN", reason: "SET_REFERENCE_FAILURE", referenceValidation };
  const closure = walkClosure(readField(setRecord, ResolvedPackageSetType, "graphClosureRoot"), stores, { requireContent: true });
  if (closure.status !== "COMPLETE") return { status: closure.status, reason: `SET_CLOSURE_${closure.reason}`, closure };
  const graph = {
    environment: readField(setRecord, ResolvedPackageSetType, "environment"),
    nodes: [],
    edges: [],
    activationUnits: [],
  };
  try {
    for (const entry of closure.entries) {
      const item = JSON.parse(stores.contents.get(entry.contentDigest));
      if (entry.role === "SET_NODE") graph.nodes.push(item);
      else if (entry.role === "SET_EDGE") graph.edges.push(item);
      else if (entry.role === "ACTIVATION_UNIT") graph.activationUnits.push(item);
      else return { status: "INVALID", reason: "UNKNOWN_SET_MEMBER_ROLE" };
    }
    const normalized = canonicalGraph(graph);
    if (normalized.nodes.length !== readField(setRecord, ResolvedPackageSetType, "nodeCount")) return { status: "INVALID", reason: "SET_NODE_COUNT" };
    if (normalized.edges.length !== readField(setRecord, ResolvedPackageSetType, "edgeCount")) return { status: "INVALID", reason: "SET_EDGE_COUNT" };
    if (!normalized.nodes.some((node) => node.releaseRef === readField(setRecord, ResolvedPackageSetType, "rootReleaseRef"))) return { status: "INVALID", reason: "SET_ROOT_NOT_SELECTED" };
    if (digest("FIXTURE_RESOLVED_SET_GRAPH", normalized) !== readField(setRecord, ResolvedPackageSetType, "graphSemanticDigest")) return { status: "INVALID", reason: "SET_GRAPH_DIGEST" };
    if (digest("FIXTURE_ACTIVATION_SUMMARY", normalized.activationUnits) !== readField(setRecord, ResolvedPackageSetType, "activationSummaryDigest")) return { status: "INVALID", reason: "SET_ACTIVATION_DIGEST" };
    const packageGraphValidation = validateSelectedGraphPackages(normalized, stores);
    if (packageGraphValidation.status !== "VALID") return { status: packageGraphValidation.status, reason: packageGraphValidation.reason, packageGraphValidation };
    return { status: "COMPLETE", graph: normalized, closure: { members: closure.members, visited: closure.visited }, packageGraphValidation };
  } catch (error) {
    return { status: "INVALID", reason: error.code ?? "SET_MEMBER_DECODE", message: error.message };
  }
}

function reconstructCatalogRelease(catalogReleaseOccurrenceId, stores) {
  const occurrence = stores.occurrences.get(catalogReleaseOccurrenceId);
  if (!occurrence) return { status: "UNKNOWN", reason: "MISSING_CATALOG_RELEASE_OCCURRENCE" };
  const release = stores.records.get(occurrence.recordId);
  if (!release) return { status: "UNKNOWN", reason: "MISSING_CATALOG_RELEASE_RECORD" };
  if (!verifyRecord(release) || release.typeRevisionId !== CatalogReleaseType.typeRevisionId) return { status: "INVALID", reason: "INVALID_CATALOG_RELEASE_RECORD" };
  const catalogProjectId = readField(release, CatalogReleaseType, "catalogProjectId");
  const catalogProject = stores.objects.get(catalogProjectId);
  if (!catalogProject) return { status: "UNKNOWN", reason: "MISSING_CATALOG_PROJECT" };
  if (catalogProject.authorPrincipalId !== occurrence.authorPrincipalId) return { status: "INVALID", reason: "CATALOG_RELEASE_AUTHOR_MISMATCH" };
  const releaseReferenceValidation = validateRecordReferenceRoles(release, CatalogReleaseType, referenceStores({
    records: stores.records,
    occurrences: stores.occurrences,
    objects: stores.objects,
  }));
  if (releaseReferenceValidation.status !== "VALID") return { status: "UNKNOWN", reason: "CATALOG_RELEASE_REFERENCE_FAILURE", releaseReferenceValidation };
  const edition = stores.records.get(readField(release, CatalogReleaseType, "editionRecordId"));
  if (!edition) return { status: "UNKNOWN", reason: "MISSING_CATALOG_EDITION" };
  if (!verifyRecord(edition) || edition.typeRevisionId !== CatalogEditionType.typeRevisionId) return { status: "INVALID", reason: "INVALID_CATALOG_EDITION" };
  const editionReferenceValidation = validateRecordReferenceRoles(edition, CatalogEditionType, referenceStores({ records: stores.records, objects: stores.objects }));
  if (editionReferenceValidation.status !== "VALID") return { status: "UNKNOWN", reason: "CATALOG_EDITION_REFERENCE_FAILURE", editionReferenceValidation };
  if (readField(edition, CatalogEditionType, "catalogProjectId") !== catalogProjectId) return { status: "INVALID", reason: "CATALOG_PROJECT_MISMATCH" };
  if (readField(edition, CatalogEditionType, "rowClosureRoot") !== readField(release, CatalogReleaseType, "rowClosureRoot")) return { status: "INVALID", reason: "CATALOG_ROW_ROOT_MISMATCH" };
  if (readField(edition, CatalogEditionType, "rowCount") !== readField(release, CatalogReleaseType, "rowCount")) return { status: "INVALID", reason: "CATALOG_ROW_COUNT_MISMATCH" };
  if (readField(edition, CatalogEditionType, "declaredCoverage") !== "FINITE_EXACT") return { status: "INVALID", reason: "CATALOG_COVERAGE_NOT_FINITE_EXACT" };
  const rowClosure = walkClosure(readField(edition, CatalogEditionType, "rowClosureRoot"), stores, { requireContent: false, requireReferencedRecord: true });
  if (rowClosure.status !== "COMPLETE") return { status: rowClosure.status, reason: `CATALOG_ROWS_${rowClosure.reason}`, rowClosure };
  if (rowClosure.members !== readField(edition, CatalogEditionType, "rowCount")) return { status: "INVALID", reason: "CATALOG_ROW_COUNT_VS_CLOSURE" };
  const membershipIds = rowClosure.entries.map((entry) => entry.contentDigest);
  if (new Set(membershipIds).size !== membershipIds.length) return { status: "INVALID", reason: "CATALOG_DUPLICATE_MEMBERSHIP" };
  const memberships = [];
  for (const membershipId of membershipIds) {
    const membership = stores.records.get(membershipId);
    if (membership.typeRevisionId !== CatalogMembershipType.typeRevisionId) return { status: "INVALID", reason: "CATALOG_ROW_WRONG_TYPE" };
    const membershipReferences = validateRecordReferenceRoles(membership, CatalogMembershipType, referenceStores({
      records: stores.records,
      occurrences: stores.occurrences,
      objects: stores.objects,
    }));
    if (membershipReferences.status !== "VALID") return { status: "UNKNOWN", reason: "CATALOG_MEMBERSHIP_REFERENCE_FAILURE", membershipReferences };
    memberships.push(membership);
  }
  return {
    status: "COMPLETE",
    catalogReleaseOccurrenceId,
    catalogProjectId,
    curatorPrincipalId: occurrence.authorPrincipalId,
    realmId: occurrence.realmId,
    basisDigest: readField(edition, CatalogEditionType, "basisDigest"),
    editionRecordId: edition.recordId,
    rowClosureRoot: readField(edition, CatalogEditionType, "rowClosureRoot"),
    memberships,
  };
}

function compareVerifiedCatalogs(catalogs) {
  if (catalogs.some((catalog) => catalog.status !== "COMPLETE")) return { status: "UNKNOWN", sources: catalogs };
  const selections = catalogs.flatMap((catalog) => catalog.memberships.map((membership) => ({
    catalogReleaseOccurrenceId: catalog.catalogReleaseOccurrenceId,
    catalogProjectId: catalog.catalogProjectId,
    curatorPrincipalId: catalog.curatorPrincipalId,
    realmId: catalog.realmId,
    basisDigest: catalog.basisDigest,
    targetProjectId: readField(membership, CatalogMembershipType, "targetProjectId"),
    selectedReleaseRef: readField(membership, CatalogMembershipType, "selectedReleaseRef"),
    disposition: readField(membership, CatalogMembershipType, "disposition"),
  })));
  const releaseRefs = [...new Set(selections.map((selection) => selection.selectedReleaseRef))].sort(utf8Compare);
  return {
    status: releaseRefs.length === 1 ? "AGREEMENT" : "CONFLICT",
    selectedReleaseRefs: releaseRefs,
    selections,
    authorityEffectCount: 0,
  };
}

const exportedBundle = {
  records: new Map(recordStore),
  occurrences: new Map(occurrenceStore),
  objects: new Map(objectStore),
  contents: new Map(contentStore),
  types: new Map(typeStore),
  views: new Map(viewStore),
  queryProfiles: new Map(queryProfileStore),
};
let mutableNetworkReads = 0;
function unavailableNetworkRead() {
  mutableNetworkReads += 1;
  throw new Error("network is disabled in steward-death fixture");
}

function reconstructExactPackage(releaseOccurrenceId, bundle, { readNetwork } = {}) {
  const occurrence = bundle.occurrences.get(releaseOccurrenceId);
  if (!occurrence) return { status: "UNKNOWN", reason: "MISSING_RELEASE_OCCURRENCE" };
  const release = bundle.records.get(occurrence.recordId);
  if (!release || !verifyRecord(release)) return { status: "UNKNOWN", reason: "MISSING_RELEASE_RECORD" };
  const releaseReferences = validateRecordReferenceRoles(release, PackageReleaseType, referenceStores({ records: bundle.records, occurrences: bundle.occurrences, objects: bundle.objects }));
  if (releaseReferences.status !== "VALID") return { status: "UNKNOWN", reason: "INVALID_RELEASE_REFERENCES", releaseReferences };
  const manifestId = readField(release, PackageReleaseType, "manifestRecordId");
  const manifest = bundle.records.get(manifestId);
  if (!manifest || !verifyRecord(manifest)) return { status: "UNKNOWN", reason: "MISSING_MANIFEST" };
  const manifestReferences = validateRecordReferenceRoles(manifest, PackageManifestType, referenceStores({ records: bundle.records, occurrences: bundle.occurrences, objects: bundle.objects }));
  if (manifestReferences.status !== "VALID") return { status: "UNKNOWN", reason: "INVALID_MANIFEST_REFERENCES", manifestReferences };
  const payloadResult = walkClosure(readField(manifest, PackageManifestType, "payloadClosureRoot"), bundle, { requireContent: true });
  const dependencyRequirements = walkClosure(readField(manifest, PackageManifestType, "dependencyRequirementClosureRoot"), bundle, { requireContent: false, requireReferencedRecord: true });
  if (payloadResult.status !== "COMPLETE" || dependencyRequirements.status !== "COMPLETE") {
    return { status: "UNKNOWN", reason: "INCOMPLETE_PACKAGE_CLOSURE", payload: payloadResult, dependencyRequirements };
  }
  void readNetwork;
  return {
    status: "COMPLETE",
    releaseRecordId: release.recordId,
    manifestRecordId: manifest.recordId,
    payload: payloadResult,
    dependencyRequirements,
  };
}

const packageReconstruction = reconstructExactPackage(releaseOccurrenceR1.occurrenceId, exportedBundle, { readNetwork: unavailableNetworkRead });
const typePackageReferenceReconstruction = validateRecordReferenceRoles(typePackage16, TypePackageReleaseType, referenceStores({
  records: exportedBundle.records,
  objects: exportedBundle.objects,
  types: exportedBundle.types,
  views: exportedBundle.views,
}));
const typePackageClosureReconstruction = walkClosure(readField(typePackage16, TypePackageReleaseType, "artifactClosureRoot"), exportedBundle, {
  requireContent: true,
  maxMembers: 10_000,
});
const typePackageDescriptorReconstruction = reconstructTypePackageFromClosure(typePackage16.recordId, {
  ...exportedBundle,
  types: new Map(),
  views: new Map(),
});
const missingDirectDescriptorResult = reconstructTypePackageFromClosure(missingDirectDescriptorPackage.recordId, exportedBundle);
const mismatchedDirectDescriptorResult = reconstructTypePackageFromClosure(mismatchedDirectDescriptorPackage.recordId, exportedBundle);
const setReconstruction = reconstructResolvedPackageSet(smallSetR1.record.recordId, exportedBundle);
const mismatchedSetRecord = createRecord(ResolvedPackageSetType, {
  rootReleaseRef: authoredReleaseR1,
  environment: readField(smallSetR1.record, ResolvedPackageSetType, "environment"),
  graphSemanticDigest: digest("FIXTURE_WRONG_GRAPH_DIGEST", "small-set-r1"),
  graphClosureRoot: smallSetR1.closure.rootRecordId,
  nodeCount: readField(smallSetR1.record, ResolvedPackageSetType, "nodeCount"),
  edgeCount: readField(smallSetR1.record, ResolvedPackageSetType, "edgeCount"),
  activationSummaryDigest: readField(smallSetR1.record, ResolvedPackageSetType, "activationSummaryDigest"),
}, { retain: false });
const mismatchedSetBundle = { ...exportedBundle, records: new Map(exportedBundle.records) };
mismatchedSetBundle.records.set(mismatchedSetRecord.recordId, mismatchedSetRecord);
const mismatchedSetReconstruction = reconstructResolvedPackageSet(mismatchedSetRecord.recordId, mismatchedSetBundle);
const catalogReconstructionA = reconstructCatalogRelease(catalogReleaseA, exportedBundle);
const catalogReconstructionB = reconstructCatalogRelease(catalogReleaseB, exportedBundle);
const catalogConflict = compareVerifiedCatalogs([catalogReconstructionA, catalogReconstructionB]);
const rowCountMismatchCatalogRelease = createRecord(CatalogReleaseType, {
  catalogProjectId: catalogProjectA,
  editionRecordId: editionA.edition.recordId,
  rowClosureRoot: editionA.rows.rootRecordId,
  rowCount: 2,
}, { retain: false });
const rowCountMismatchOccurrence = createOccurrence(rowCountMismatchCatalogRelease, curatorA, realmA, 99, { retain: false });
const rowCountMismatchBundle = {
  ...exportedBundle,
  records: new Map(exportedBundle.records),
  occurrences: new Map(exportedBundle.occurrences),
};
rowCountMismatchBundle.records.set(rowCountMismatchCatalogRelease.recordId, rowCountMismatchCatalogRelease);
rowCountMismatchBundle.occurrences.set(rowCountMismatchOccurrence.occurrenceId, rowCountMismatchOccurrence);
const rowCountMismatchResult = reconstructCatalogRelease(rowCountMismatchOccurrence.occurrenceId, rowCountMismatchBundle);
const wrongAuthorCatalogOccurrence = createOccurrence(catalogReleaseRecordA, curatorB, realmB, 99, { retain: false });
const wrongAuthorCatalogBundle = { ...exportedBundle, occurrences: new Map(exportedBundle.occurrences) };
wrongAuthorCatalogBundle.occurrences.set(wrongAuthorCatalogOccurrence.occurrenceId, wrongAuthorCatalogOccurrence);
const wrongAuthorCatalogResult = reconstructCatalogRelease(wrongAuthorCatalogOccurrence.occurrenceId, wrongAuthorCatalogBundle);
const sourceReconstruction = walkClosure(sourceClosure.rootRecordId, exportedBundle, { requireContent: true });
const droppedCatalogBundle = { ...exportedBundle, records: new Map(exportedBundle.records) };
droppedCatalogBundle.records.delete(editionA.rows.rootRecordId);
const droppedCatalogResult = reconstructCatalogRelease(catalogReleaseA, droppedCatalogBundle);
const droppedCatalogMemberBundle = { ...exportedBundle, records: new Map(exportedBundle.records) };
droppedCatalogMemberBundle.records.delete(membershipA.recordId);
const droppedCatalogMemberResult = reconstructCatalogRelease(catalogReleaseA, droppedCatalogMemberBundle);
const catalogsGoneBundle = { ...exportedBundle, records: new Map(exportedBundle.records), occurrences: new Map(exportedBundle.occurrences) };
for (const occurrenceId of [catalogReleaseA, catalogReleaseB]) catalogsGoneBundle.occurrences.delete(occurrenceId);
for (const recordId of [catalogReleaseRecordA.recordId, catalogReleaseRecordB.recordId, editionA.edition.recordId, editionB.edition.recordId, editionA.rows.rootRecordId, editionB.rows.rootRecordId]) catalogsGoneBundle.records.delete(recordId);
const directPackageAfterCatalogLoss = reconstructExactPackage(readField(directHandoffR1, PackageHandoffType, "releaseRef"), catalogsGoneBundle, { readNetwork: unavailableNetworkRead });
const futureUpdateStatus = "UNKNOWN";
const forgeAvailability = "UNKNOWN";
check("retained reconstruction completes with an installed network trap and zero mutable reads", mutableNetworkReads === 0 && packageReconstruction.status === "COMPLETE" && directPackageAfterCatalogLoss.status === "COMPLETE");
check("retained package reconstructs without publisher or registry", packageReconstruction.status === "COMPLETE" && packageReconstruction.payload.members === 3);
check("retained 10k Type package binds exact direct Type/View roots to matching nested descriptor bytes without exported Type/View indexes", typePackageReferenceReconstruction.status === "VALID" && typePackageClosureReconstruction.status === "COMPLETE" && typePackageClosureReconstruction.members === 10_000 && typePackageDescriptorReconstruction.status === "COMPLETE" && typePackageDescriptorReconstruction.boundTypeRoots === directTypeRootIds.length && typePackageDescriptorReconstruction.boundViewRoots === directViewRootIds.length);
check("Type package reconstruction rejects missing and ID/descriptor-mismatched direct roots", missingDirectDescriptorResult.status === "INVALID" && missingDirectDescriptorResult.reason === "MISSING_DIRECT_TYPE_DESCRIPTOR" && mismatchedDirectDescriptorResult.status === "INVALID" && mismatchedDirectDescriptorResult.reason === "TYPE_DESCRIPTOR_ID_MISMATCH");
check("retained exact Set reconstructs and binds canonical graph bytes to its semantic digest", setReconstruction.status === "COMPLETE" && setReconstruction.graph.nodes.length === 2 && setReconstruction.graph.edges.length === 1);
check("Set with unrelated semantic digest and valid closure is rejected", mismatchedSetReconstruction.status === "INVALID" && mismatchedSetReconstruction.reason === "SET_GRAPH_DIGEST");
check("two issuer-qualified finite Catalog Releases reconstruct as scoped COMPLETE", catalogReconstructionA.status === "COMPLETE" && catalogReconstructionB.status === "COMPLETE" && catalogReconstructionA.memberships.length === 1 && catalogReconstructionB.memberships.length === 1);
check("verified conflicting catalogs preserve curator, Realm, basis, and exact selections", catalogConflict.status === "CONFLICT" && catalogConflict.selectedReleaseRefs.length === 2 && catalogConflict.selections.every((selection) => selection.curatorPrincipalId && selection.realmId && selection.basisDigest));
check("catalog comparison has no authority effect", catalogConflict.authorityEffectCount === 0);
check("catalog reconstruction rejects row-count mismatch and curator-author mismatch", rowCountMismatchResult.status === "INVALID" && rowCountMismatchResult.reason === "CATALOG_ROW_COUNT_MISMATCH" && wrongAuthorCatalogResult.status === "INVALID" && wrongAuthorCatalogResult.reason === "CATALOG_RELEASE_AUTHOR_MISMATCH");
check("missing Catalog root is UNKNOWN rather than empty", droppedCatalogResult.status === "UNKNOWN");
check("missing retained Catalog membership Record is UNKNOWN rather than complete", droppedCatalogMemberResult.status === "UNKNOWN");
check("catalog-free direct exact Release remains reconstructible after both catalogs disappear", directPackageAfterCatalogLoss.status === "COMPLETE");
check("retained source closure survives forge disappearance", forgeAvailability === "UNKNOWN" && sourceReconstruction.status === "COMPLETE");
check("future updates become UNKNOWN without mutating retained identity", futureUpdateStatus === "UNKNOWN" && packageReconstruction.releaseRecordId === releaseRecordR1.recordId);

const report = {
  fixture: {
    version: FIXTURE_VERSION,
    codec: FIXTURE_CODEC,
    date: "2026-08-22",
    standing: "disposable comparison evidence",
    protocolConformance: false,
    adoptedProtocolBytes: false,
  },
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  },
  exactTypeIds: Object.fromEntries([
    ProjectGenesisType,
    RuntimeRequestType,
    DependencyRequirementType,
    PackageManifestType,
    PackageReleaseType,
    ResolvedPackageSetType,
    ResolutionReceiptType,
    CatalogMembershipType,
    CatalogEditionType,
    CatalogReleaseType,
    AdvisoryType,
    YankClaimType,
    CompatibilityType,
    ProvenanceType,
    PackageHandoffType,
    TypePackageReleaseType,
    LineageNodeV1Type,
    LineageNodeV2Type,
  ].map((type) => [type.name, type.typeRevisionId])),
  exactViewIds: Object.fromEntries([
    ClosureSummaryView,
    ReleaseIdentityView,
    CatalogMembershipView,
    EvidenceTargetView,
    PackageHandoffView,
    LineageKeyView,
  ].map((view) => [view.name, view.viewRevisionId])),
  queryProfiles: {
    releaseV1: releaseQueryV1.queryProfileId,
    releaseV2: releaseQueryV2.queryProfileId,
    catalogMembership: catalogMembershipQuery.queryProfileId,
    advisory: advisoryQuery.queryProfileId,
    yank: yankQuery.queryProfileId,
    compatibility: compatibilityQuery.queryProfileId,
    provenance: provenanceQuery.queryProfileId,
    evidenceViewPinned: evidenceViewQueryProfile.viewQueryProfileId,
    evidenceViewAtPinnedTip,
    evidenceViewAfterLaterType,
    partialEmpty: emptyPartial,
    completeEmpty: emptyComplete,
    yankPartialEmpty: emptyYankPartial,
  },
  objectIds: {
    projectRecordId: commonProjectRecord.recordId,
    projectIdPublisherA: projectIdA,
    projectIdPublisherB: projectIdB,
    manifestR1: manifestR1.recordId,
    authoredReleaseR1,
    authoredReleaseR2,
    resolvedSetR1: smallSetR1.record.recordId,
    resolvedSetDependencyMutation: smallSetR2Dependency.record.recordId,
    resolutionReceiptA: receiptA.recordId,
    resolutionReceiptB: receiptB.recordId,
    catalogReleaseA,
    catalogReleaseB,
    advisoryR1: advisoryR1.recordId,
    compatibilityR1: compatibilityR1.recordId,
    provenanceR1: provenanceR1.recordId,
    packageHandoffR1: handoffR1.recordId,
    directPackageHandoffR1: directHandoffR1.recordId,
    packageHandoffEvidenceMutation: handoffR1b.recordId,
  },
  referenceControls: {
    unqualifiedAnyUsed: false,
    existenceAndExactProbe: {
      status: referenceSemanticsValidation.status,
      results: referenceSemanticsValidation.results,
      rawBytesObservation,
    },
    exactRevisionEvolution: {
      lineageV1TypeRevisionId: LineageNodeV1Type.typeRevisionId,
      lineageV2TypeRevisionId: LineageNodeV2Type.typeRevisionId,
      selfV1: lineageV1SelfValidation.status,
      selfV2ToV1: lineageV2CrossValidation.status,
      finiteSet: validateRecordReferenceRoles(finiteLineageReference, FiniteLineageReferenceType).status,
      pinnedView: validateRecordReferenceRoles(viewLineageReference, ViewLineageReferenceType).status,
      existencePlusApplicationValidation: existenceLineageValidation.status,
    },
    negativeTargetVectors: Object.fromEntries(Object.entries(negativeReferenceValidations).map(([name, result]) => [name, { status: result.status, reasons: result.invalid.map((item) => item.targetClass) }])),
    workloadDisposition: {
      unqualifiedAny: "AVOID; package/catalog records use closed target roles",
      exactRevisionSelf: "AVOID for package identity; versioned consumers use finite exact Type sets or pinned Views",
      existenceOnly: "USE only for structural discovery with separate application validation; never authority/currentness",
      viewWideCompleteness: "NOT REQUIRED for MVP; exact-Type QueryProfiles plus finite CatalogEdition reconstruction suffice",
    },
  },
  versionLabelPressure: {
    labelOutReleaseStable: authoredReleaseR1,
    labelClaim100: labelClaim100.recordId,
    labelClaimStable: labelClaimStable.recordId,
    labelInArm100: labelInIdentity100,
    labelInArmStable: labelInIdentityStable,
    finding: "Keeping labels as separate testimony avoids package identity churn; the current prose should make this choice explicit.",
  },
  closures: {
    direct16: closure16,
    nested17: closure17,
    nested10k: {
      ...closure10k,
      elapsedMs: Number(closure10kElapsedMs.toFixed(3)),
      heapDeltaBytes: Math.max(0, closure10kHeapAfter - closure10kHeapBefore),
    },
    typePackageDirectRootBoundary: {
      acceptedCount: directTypeRootIds.length + directViewRootIds.length,
      rejectedCount: 17,
      rejection: direct17Error?.code,
      nestedMemberCountStillAccepted: closure10k.memberCount,
      directTypeRoots: directTypeRootIds.length,
      directViewRoots: directViewRootIds.length,
      closureOnlyBinding: {
        status: typePackageDescriptorReconstruction.status,
        exportedTypeIndexEntries: 0,
        exportedViewIndexEntries: 0,
        boundTypeRoots: typePackageDescriptorReconstruction.boundTypeRoots,
        boundViewRoots: typePackageDescriptorReconstruction.boundViewRoots,
        missingDescriptorRejection: missingDirectDescriptorResult.reason,
        substitutedDescriptorRejection: mismatchedDirectDescriptorResult.reason,
      },
    },
  },
  resolvedSetSemantics: {
    smallExactGraph: smallGraphPackageValidation,
    negativeRelations: selectedGraphNegativeSemantics,
    scope: "two-node exact package graph; the 10k arm remains synthetic selected-graph serialization evidence",
  },
  scaleGraph: {
    scope: "canonical selected-graph serialization/materialization; not dependency solving",
    selectedReleases: linuxGraph.nodes.length,
    projects: new Set(linuxGraph.nodes.map((node) => node.projectId)).size,
    edges: linuxGraph.edges.length,
    sccs: observedSccCount,
    activationUnits: linuxGraph.activationUnits.length,
    linuxSetId: linuxSetA.record.recordId,
    linuxReorderedSetId: linuxSetB.record.recordId,
    macosSetId: macSet.record.recordId,
    transitiveMutationSetId: mutatedLinuxSet.record.recordId,
    graphClosureMembers: linuxSetA.closure.memberCount,
    graphClosureNodes: linuxSetA.closure.closureNodeCount,
    graphClosureDepth: linuxSetA.closure.depth,
    elapsedMs: Number(scaleElapsedMs.toFixed(3)),
    heapDeltaBytes: Math.max(0, scaleHeapAfter - scaleHeapBefore),
    hookExecutionsDuringMaterialization: 0,
    measuredPhase: "four graph/Set materializations plus required-edge SCC analysis in one non-warmed run",
  },
  catalogAndAuthority: {
    conflict: catalogConflict,
    directReleaseUnaffected: authoredReleaseR1,
    osStateBeforeDiscovery,
    osStateAfterDiscovery: discoveryResult.osState,
    catalogMembershipSideEffects: Object.values(discoveryResult.effectCalls).reduce((sum, value) => sum + value, 0),
    hostileEvidenceRejected: discoveryResult.unrecognizedEvidenceCount,
  },
  evidencePlurality: {
    advisoryOccurrences: [advisoryOccurrenceR1.occurrenceId, advisoryCounterOccurrenceR1.occurrenceId],
    yankOccurrences: [yankOccurrenceR1.occurrenceId, yankCounterOccurrenceR1.occurrenceId],
    compatibilityOccurrences: [compatibilityOccurrenceR1.occurrenceId, compatibilityFailOccurrenceR1.occurrenceId],
    provenanceOccurrence: provenanceOccurrenceR1.occurrenceId,
    releaseIdentityUnchanged: authoredReleaseR1,
    resolvedSetIdentityUnchanged: smallSetR1.record.recordId,
  },
  unknownCapabilities: {
    unknownRequired: unknownCapabilityResult,
    missingRequired: missingRequiredCapabilityResult,
  },
  disappearance: {
    publisher: "UNAVAILABLE",
    catalogService: "UNAVAILABLE",
    registry: "UNAVAILABLE",
    forge: forgeAvailability,
    mutableNetworkReads,
    packageReconstruction: {
      status: packageReconstruction.status,
      releaseRecordId: packageReconstruction.releaseRecordId,
      manifestRecordId: packageReconstruction.manifestRecordId,
      payloadMembers: packageReconstruction.payload.members,
      dependencyRequirementMembers: packageReconstruction.dependencyRequirements.members,
    },
    typePackageReconstruction: {
      referenceStatus: typePackageReferenceReconstruction.status,
      closureStatus: typePackageClosureReconstruction.status,
      members: typePackageClosureReconstruction.members,
      descriptorBindingStatus: typePackageDescriptorReconstruction.status,
      boundTypeRoots: typePackageDescriptorReconstruction.boundTypeRoots,
      boundViewRoots: typePackageDescriptorReconstruction.boundViewRoots,
    },
    resolvedSetReconstruction: {
      status: setReconstruction.status,
      nodes: setReconstruction.graph?.nodes.length ?? 0,
      edges: setReconstruction.graph?.edges.length ?? 0,
    },
    retainedCatalogReconstructions: [catalogReconstructionA, catalogReconstructionB].map((catalog) => ({
      status: catalog.status,
      catalogReleaseOccurrenceId: catalog.catalogReleaseOccurrenceId,
      catalogProjectId: catalog.catalogProjectId,
      curatorPrincipalId: catalog.curatorPrincipalId,
      realmId: catalog.realmId,
      basisDigest: catalog.basisDigest,
      rows: catalog.memberships?.length ?? 0,
    })),
    missingCatalogReconstruction: droppedCatalogResult,
    sourceReconstruction,
    futureUpdateStatus,
  },
  checks: {
    passed: checks.length,
    failed: 0,
    results: checks,
  },
  limits: [
    "One JavaScript implementation cannot establish cross-language canonicalization or rejection precedence.",
    "The hash, canonical JSON codec, Type names, field keys, View slot budget, direct-reference cap, and query states are fixture-local and not protocol proposals.",
    "The 10k selected-graph generator tests deterministic serialization/materialization and identity relations, not dependency solving, EVM gas/state cost, or a production resolver's semver/peer/hoist semantics.",
    "The small selected-graph authority check models an initial publisher-qualified Project only; it does not adopt publisher succession or delegation policy.",
    "Timing and heap deltas are one non-warmed Node run, not comparative budgets or peak-memory measurements.",
    "Fixture Occurrences are unsigned and Realm-bound; portable authorship, signature verification, succession, and admission remain unresolved protocol/application evidence questions.",
    "Advisory, yank, compatibility, and provenance Records prove plural attributable evidence shapes and identity non-mutation, not that any claim is true, safe, current, or endorsed.",
    "The handoff is modeled as an exact snapshot Record only for this arm; the product design has not decided that PackageHandoff needs stable semantic identity.",
    "No code executes, no public catalog is published, and no runtime, Core contract, Realm, or package schema is adopted.",
  ],
};

console.log(JSON.stringify(report, null, 2));
