// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ExpC0Codec} from "./ExpC0Codec.sol";

/// @notice Monolithic, deliberately incomplete state-transition control for
/// the EXP-C0/v0 micro-Realm. It exists only to falsify candidate semantics.
/// It is not production code, a stable ABI, a signature verifier, or an EFS
/// protocol implementation.
contract ExpC0TransitionControl {
    uint256 internal constant MAX_TYPES = 16;
    uint256 internal constant MAX_RECORDS = 16;
    uint256 internal constant MAX_PUBLICATIONS = 8;
    uint256 internal constant MAX_OCCURRENCES_PER_PLAN = 2;
    uint256 internal constant MAX_EFFECTS_PER_PLAN = 4;
    uint256 internal constant MAX_OPERATIONS = 32;
    uint256 internal constant MAX_ADMISSIONS = 32;
    uint64 internal constant CONTROL_MAX_COST = 1_000_000;

    struct NonceState {
        bytes32 planId;
        bytes32 operationId;
    }

    struct BindingHeadV0 {
        uint32 revision;
        bool tombstone;
        bytes32 target;
        bytes32 operationId;
    }

    bool public bootstrapped;
    bytes32 public realmId;
    bytes32 public realmRevisionId;
    bytes32 public coreCommitment;
    uint32 public admissionHighWater;

    mapping(bytes32 => bool) public knownTypes;
    mapping(bytes32 => bool) public knownRecords;
    mapping(bytes32 => bytes32) public recordTypeSchemaId;
    mapping(bytes32 => bool) public knownPublications;
    mapping(bytes32 => bool) public knownOccurrences;
    mapping(bytes32 => NonceState) internal _nonceStates;
    mapping(bytes32 => BindingHeadV0) internal _bindingHeads;

    bytes32[] internal _typeIds;
    bytes32[] internal _recordIds;
    bytes32[] internal _publicationIds;
    bytes32[] internal _operationIds;
    bytes32[] internal _admissionIds;
    bytes32[] internal _bindingKeys;
    mapping(bytes32 => bool) internal _bindingKeyKnown;
    mapping(bytes32 => uint8) internal _referenceTargetKinds;
    mapping(bytes32 => bytes32) internal _referenceTargetTypeIds;

    function bootstrap(ExpC0Codec.RealmBootstrap calldata bootstrapValue, ExpC0Codec.RealmRevision calldata revision)
        external
        returns (bytes32 id)
    {
        require(!bootstrapped, "BOOTSTRAP_EXISTS");
        id = ExpC0Codec.realmId(bootstrapValue);
        bytes32 revisionId = ExpC0Codec.realmRevisionId(revision);
        require(revision.realmId == id && revision.generation == 0, "REVISION_REALM");
        require(bootstrapValue.initialRevisionId == revisionId, "REVISION_ID");
        ExpC0Codec.InitialRevision memory initial = ExpC0Codec.InitialRevision({
            generation: revision.generation,
            componentCommitment: revision.componentCommitment,
            executionProfileId: revision.executionProfileId,
            policyId: revision.policyId,
            verifierProfileId: revision.verifierProfileId,
            administrationCommitment: revision.administrationCommitment,
            activationStart: revision.activationStart,
            activationEndExclusive: revision.activationEndExclusive
        });
        require(
            bootstrapValue.initialRevisionCommitment == ExpC0Codec.initialRevisionCommitment(initial),
            "REVISION_COMMITMENT"
        );
        require(bootstrapValue.disclosedPowers.length <= 8, "POWERS_LIMIT");
        for (uint256 i = 1; i < bootstrapValue.disclosedPowers.length; ++i) {
            require(bootstrapValue.disclosedPowers[i - 1] < bootstrapValue.disclosedPowers[i], "POWERS_ORDER");
        }
        bootstrapped = true;
        realmId = id;
        realmRevisionId = revisionId;
        coreCommitment = bootstrapValue.coreCommitment;
    }

    error UnsupportedTypeCodec(uint16 codecVersion);
    error MalformedTypePayload();

    /// @notice Kind-3 admits the exact outer envelope bytes. Codec dispatch
    /// happens only after canonical outer framing, so an unknown future codec
    /// is rejected atomically without being mis-decoded as codec 0.
    function registerType(bytes calldata canonicalType) external returns (bytes32 id) {
        require(bootstrapped, "NO_REALM");
        require(canonicalType.length <= 2048, "TYPE_DESCRIPTOR_LIMIT");
        (uint16 codecVersion, bytes memory payloadBytes) = ExpC0Codec.decodeTypeSchemaEnvelope(canonicalType);
        if (codecVersion != 0) revert UnsupportedTypeCodec(codecVersion);

        ExpC0Codec.TypeSchema memory schema;
        try this.decodeTypePayloadV0(payloadBytes) returns (ExpC0Codec.TypeSchema memory decoded) {
            schema = decoded;
        } catch {
            revert MalformedTypePayload();
        }
        require(schema.semanticCommitment.length > 0, "EMPTY_SEMANTICS");
        require(schema.shape.fields.length > 0 && schema.shape.fields.length <= 16, "FIELD_LIMIT");
        require(schema.intrinsicConstraints.length <= 8 && schema.referenceRoles.length <= 1, "TYPE_LIMIT");
        require(schema.representation.fieldOrder == 1 && schema.representation.encoding == 1, "REPRESENTATION");
        for (uint256 i; i < schema.shape.fields.length; ++i) {
            ExpC0Codec.FieldV0 memory field = schema.shape.fields[i];
            require(field.fieldKey != 0, "FIELD_KEY");
            if (i > 0) require(schema.shape.fields[i - 1].fieldKey < field.fieldKey, "FIELD_ORDER");
            require(field.scalarKind >= 1 && field.scalarKind <= 4, "SCALAR_KIND");
            if (field.scalarKind == 3) {
                require(field.maxLengthOrCount > 0 && field.maxLengthOrCount <= 4096, "FIELD_BOUND");
            } else {
                require(field.maxLengthOrCount == 0, "FIELD_BOUND");
            }
        }
        id = ExpC0Codec.typeSchemaId(codecVersion, payloadBytes);

        uint16 priorRoleKey;
        for (uint256 i; i < schema.referenceRoles.length; ++i) {
            ExpC0Codec.ReferenceRoleV0 memory role = schema.referenceRoles[i];
            require(role.fieldKey > priorRoleKey, "REFERENCE_ORDER");
            require(_fieldScalar(schema, role.fieldKey) == 4, "REFERENCE_FIELD");
            if (role.targetKind == 1) {
                require(role.targetTypeSchemaId != bytes32(0), "REFERENCE_TARGET");
                require(role.targetTypeSchemaId != id, "REFERENCE_SELF_EXACT");
                require(knownTypes[role.targetTypeSchemaId], "REFERENCE_TYPE");
            } else if (role.targetKind == 2) {
                require(role.targetTypeSchemaId == bytes32(0), "REFERENCE_SELF_TARGET");
            } else {
                revert("REFERENCE_KIND");
            }
            priorRoleKey = role.fieldKey;
        }
        if (knownTypes[id]) return id;
        require(_typeIds.length < MAX_TYPES, "TYPE_COUNT");
        knownTypes[id] = true;
        _typeIds.push(id);
        if (schema.referenceRoles.length == 1) {
            _referenceTargetKinds[id] = schema.referenceRoles[0].targetKind;
            _referenceTargetTypeIds[id] = schema.referenceRoles[0].targetTypeSchemaId;
        }
    }

    /// @dev External only so registerType can catch every abi.decode failure
    /// and grade it as malformed payload. It has no state or authority effect.
    function decodeTypePayloadV0(bytes calldata payloadBytes)
        external
        pure
        returns (ExpC0Codec.TypeSchema memory schema)
    {
        schema = abi.decode(payloadBytes, (ExpC0Codec.TypeSchema));
        if (keccak256(payloadBytes) != keccak256(abi.encode(schema))) revert MalformedTypePayload();
    }

    function registerRecord(bytes32 typeId, bytes calldata canonicalBody) external returns (bytes32 id) {
        require(knownTypes[typeId], "UNKNOWN_TYPE");
        require(canonicalBody.length <= 4096, "BODY_LIMIT");
        id = ExpC0Codec.recordId(typeId, canonicalBody);
        if (knownRecords[id]) return id;
        uint8 targetKind = _referenceTargetKinds[typeId];
        if (targetKind != 0) {
            (bytes memory value, ExpC0Codec.OptionalRecord memory recordRef) =
                abi.decode(canonicalBody, (bytes, ExpC0Codec.OptionalRecord));
            require(keccak256(canonicalBody) == keccak256(abi.encode(value, recordRef)), "BODY_CANONICAL");
            require(recordRef.present || recordRef.value == bytes32(0), "REFERENCE_ABSENT");
            if (recordRef.present) {
                require(recordRef.value != id && knownRecords[recordRef.value], "REFERENCE_RECORD");
                bytes32 requiredType = targetKind == 1 ? _referenceTargetTypeIds[typeId] : typeId;
                require(recordTypeSchemaId[recordRef.value] == requiredType, "REFERENCE_RECORD_TYPE");
            }
        }
        require(_recordIds.length < MAX_RECORDS, "RECORD_COUNT");
        knownRecords[id] = true;
        recordTypeSchemaId[id] = typeId;
        _recordIds.push(id);
    }

    function typeCount() external view returns (uint256) {
        return _typeIds.length;
    }

    function registerPublication(ExpC0Codec.PublicationSet calldata publication) external returns (bytes32 id) {
        require(publication.leaves.length > 0 && publication.leaves.length <= 2, "LEAF_LIMIT");
        for (uint256 i; i < publication.leaves.length; ++i) {
            require(knownRecords[publication.leaves[i]], "UNKNOWN_RECORD");
            if (i > 0) require(publication.leaves[i - 1] != publication.leaves[i], "DUPLICATE_LEAF");
        }
        id = ExpC0Codec.publicationSetId(publication);
        if (knownPublications[id]) return id;
        require(_publicationIds.length < MAX_PUBLICATIONS, "PUBLICATION_COUNT");
        knownPublications[id] = true;
        _publicationIds.push(id);
        for (uint16 i; i < publication.leaves.length; ++i) {
            knownOccurrences[ExpC0Codec.occurrenceId(id, i)] = true;
        }
    }

    /// @dev Error codes are the candidate precedence from the design packet.
    /// Code zero means committed or exact idempotent read-back. `authorized`
    /// is an injected verifier result; this control does not implement crypto.
    function execute(ExpC0Codec.AdmissionPlan calldata plan, uint64 executionCoordinate, bool authorized)
        external
        returns (bytes32 operation, uint8 errorCode, bool idempotent)
    {
        bytes32 planId = ExpC0Codec.admissionPlanId(plan);
        bytes32 effectsId = ExpC0Codec.effectSetId(plan.effects);
        operation = ExpC0Codec.operationId(planId, effectsId);
        bytes32 nonceKey = keccak256(abi.encode(plan.realmId, plan.semanticAuthor, plan.nonceLane, plan.nonce));
        NonceState storage prior = _nonceStates[nonceKey];

        // An exact retry is recovery/read-back, not a second execution. It is
        // intentionally resolved before the now-expired fresh-write checks.
        if (prior.planId == planId && prior.planId != bytes32(0)) {
            return (prior.operationId, 0, true);
        }

        if (
            plan.occurrenceIds.length == 0 || plan.occurrenceIds.length > MAX_OCCURRENCES_PER_PLAN
                || plan.effects.length == 0 || plan.effects.length > MAX_EFFECTS_PER_PLAN
                || _operationIds.length >= MAX_OPERATIONS
                || _admissionIds.length + plan.occurrenceIds.length > MAX_ADMISSIONS
        ) return (operation, 3, false);

        if (
            !bootstrapped || plan.realmId != realmId || plan.realmRevisionId != realmRevisionId
                || plan.coreCommitment != coreCommitment || plan.actor == bytes32(0)
                || plan.semanticAuthor == bytes32(0)
        ) return (operation, 5, false);
        for (uint256 i; i < plan.occurrenceIds.length; ++i) {
            if (!knownOccurrences[plan.occurrenceIds[i]]) return (operation, 5, false);
        }
        if (executionCoordinate >= plan.expiryCoordinate) return (operation, 6, false);
        if (prior.planId != bytes32(0)) return (operation, 7, false);
        if (!authorized) return (operation, 8, false);
        if (plan.maximumCost > CONTROL_MAX_COST) return (operation, 9, false);

        // This control executes exactly one BIND effect. Other exact effects
        // remain model/vector obligations and report UNSUPPORTED here.
        if (plan.effects.length != 1 || plan.effects[0].kind != 1) return (operation, 11, false);
        ExpC0Codec.EffectV0 calldata effect = plan.effects[0];
        if (
            effect.principalId != plan.semanticAuthor || effect.positionKey == bytes32(0)
                || !knownRecords[effect.recordId]
        ) return (operation, 5, false);
        bytes32 bindingKey = keccak256(abi.encode(effect.principalId, effect.positionKey));
        BindingHeadV0 storage current = _bindingHeads[bindingKey];
        if (current.revision != effect.expectedRevision || current.tombstone) return (operation, 10, false);

        _nonceStates[nonceKey] = NonceState(planId, operation);
        _operationIds.push(operation);
        for (uint256 i; i < plan.occurrenceIds.length; ++i) {
            unchecked {
                ++admissionHighWater;
            }
            bytes32 admission =
                ExpC0Codec.admissionId(plan.occurrenceIds[i], plan.realmRevisionId, operation, admissionHighWater);
            _admissionIds.push(admission);
        }
        current.revision = effect.expectedRevision + 1;
        current.tombstone = false;
        current.target = effect.recordId;
        current.operationId = operation;
        if (!_bindingKeyKnown[bindingKey]) {
            _bindingKeyKnown[bindingKey] = true;
            _bindingKeys.push(bindingKey);
        }
        return (operation, 0, false);
    }

    function bindingHead(bytes32 principal, bytes32 position)
        external
        view
        returns (uint32 revision, bool tombstone, bytes32 target, bytes32 operation)
    {
        BindingHeadV0 storage head = _bindingHeads[keccak256(abi.encode(principal, position))];
        return (head.revision, head.tombstone, head.target, head.operationId);
    }

    /// @notice Control-only whole-state digest used to prove rejected calls and
    /// exact retries did not mutate this SUT. This is not ProjectionRootV0.
    function controlStateDigest() external view returns (bytes32) {
        bytes32[] memory headDigests = new bytes32[](_bindingKeys.length);
        for (uint256 i; i < _bindingKeys.length; ++i) {
            BindingHeadV0 storage head = _bindingHeads[_bindingKeys[i]];
            headDigests[i] =
                keccak256(abi.encode(_bindingKeys[i], head.revision, head.tombstone, head.target, head.operationId));
        }
        return keccak256(
            abi.encode(
                bootstrapped,
                realmId,
                realmRevisionId,
                coreCommitment,
                _typeIds,
                _recordIds,
                _publicationIds,
                _operationIds,
                _admissionIds,
                headDigests,
                admissionHighWater
            )
        );
    }

    function _fieldScalar(ExpC0Codec.TypeSchema memory schema, uint16 fieldKey) private pure returns (uint8) {
        for (uint256 i; i < schema.shape.fields.length; ++i) {
            if (schema.shape.fields[i].fieldKey == fieldKey) return schema.shape.fields[i].scalarKind;
        }
        return 0;
    }
}
