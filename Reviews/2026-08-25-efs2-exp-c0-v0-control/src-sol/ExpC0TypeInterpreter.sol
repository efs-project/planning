// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ExpC0Codec} from "./ExpC0Codec.sol";

/// @notice Disposable closed interpreter for the EXP-C0/v0 T_NOTE fixture and
/// a two-Type exact parent/file control. NON-DURABLE and NON-CONFORMANT: this
/// is not a general Type/Data ABI, stable interface, deployment candidate, or
/// production implementation.
library ExpC0TypeInterpreter {
    uint16 internal constant PROFILE_VERSION = 0;
    bytes32 internal constant DOMAIN_TYPE = keccak256("EFS2/EXP-C0/V0/TYPE");
    bytes32 internal constant DOMAIN_BODY = keccak256("EFS2/EXP-C0/V0/BODY");
    bytes32 internal constant DOMAIN_RECORD = keccak256("EFS2/EXP-C0/V0/RECORD");

    error Noncanonical();
    error MalformedAbi();
    error LimitExceeded();
    error InvalidTypeOrRecord();
    error UnsupportedSchema();

    struct FieldV0 {
        uint16 fieldKey;
        uint8 scalarKind;
        bool required;
        uint16 maxLengthOrCount;
    }

    struct ShapeV0 {
        FieldV0[] fields;
    }

    struct RepresentationV0 {
        uint8 fieldOrder;
        uint8 encoding;
    }

    struct ConstraintV0 {
        uint16 fieldKey;
        uint8 rule;
    }

    struct ReferenceRoleV0 {
        uint16 fieldKey;
        uint8 targetKind;
        bytes32 targetTypeSchemaId;
    }

    struct TypeSchemaV0 {
        bytes semanticCommitment;
        ShapeV0 shape;
        RepresentationV0 representation;
        ConstraintV0[] intrinsicConstraints;
        ReferenceRoleV0[] referenceRoles;
    }

    struct OptionalRecordV0 {
        bool present;
        bytes32 value;
    }

    struct RecordInputV0 {
        bytes32 expectedRecordId;
        bytes32 typeSchemaId;
        bytes canonicalBody;
    }

    struct TypeInputV0 {
        bytes32 expectedTypeSchemaId;
        bytes canonicalType;
    }

    struct ValidationV0 {
        bytes32 typeSchemaId;
        uint16 typeCount;
        uint16 recordCount;
        uint8 referenceCount;
        bytes32 referenceFrom;
        bytes32 referenceTarget;
        uint8 passes;
    }

    function typeSchemaId(TypeSchemaV0 memory schema) internal pure returns (bytes32) {
        return ExpC0Codec.typeSchemaId(0, abi.encode(schema));
    }

    function encodeTypeSchemaV0(TypeSchemaV0 memory schema) internal pure returns (bytes memory) {
        return ExpC0Codec.encodeTypeSchemaEnvelope(0, abi.encode(schema));
    }

    function inspectEnvelope(bytes memory raw)
        internal
        pure
        returns (uint16 codecVersion, bytes memory payloadBytes, bytes32 schemaId, bool supported)
    {
        (codecVersion, payloadBytes) = ExpC0Codec.decodeTypeSchemaEnvelope(raw);
        schemaId = ExpC0Codec.typeSchemaId(codecVersion, payloadBytes);
        supported = codecVersion == 0;
    }

    function recordId(bytes32 schemaId, bytes memory canonicalBody) internal pure returns (bytes32) {
        bytes32 bodyHash = keccak256(abi.encode(DOMAIN_BODY, PROFILE_VERSION, canonicalBody));
        return keccak256(abi.encode(DOMAIN_RECORD, PROFILE_VERSION, schemaId, bodyHash));
    }

    function validateClosedInventory(bytes memory typeBytes, bytes32 expectedTypeId, RecordInputV0[] memory records)
        internal
        pure
        returns (ValidationV0 memory result)
    {
        TypeInputV0[] memory types = new TypeInputV0[](1);
        types[0] = TypeInputV0({expectedTypeSchemaId: expectedTypeId, canonicalType: typeBytes});
        return validateClosedInventory(types, records);
    }

    function validateClosedInventory(TypeInputV0[] memory types, RecordInputV0[] memory records)
        internal
        pure
        returns (ValidationV0 memory result)
    {
        if (types.length == 0 || types.length > 16 || records.length > 16) revert LimitExceeded();

        TypeSchemaV0[] memory schemas = new TypeSchemaV0[](types.length);
        bytes32[] memory typeIds = new bytes32[](types.length);

        // Pass one closes both finite identity inventories. No reference is
        // followed until every Type and Record identity has been recomputed.
        for (uint256 i; i < types.length; ++i) {
            TypeInputV0 memory candidate = types[i];
            (uint16 codecVersion, bytes memory payloadBytes, bytes32 schemaId, bool supported) =
                inspectEnvelope(candidate.canonicalType);
            if (!supported || codecVersion != 0) revert UnsupportedSchema();
            TypeSchemaV0 memory schema = abi.decode(payloadBytes, (TypeSchemaV0));
            if (keccak256(payloadBytes) != keccak256(abi.encode(schema))) revert MalformedAbi();
            if (candidate.canonicalType.length > 2048) revert LimitExceeded();
            _validateType(schema, candidate.expectedTypeSchemaId);

            if (schemaId != candidate.expectedTypeSchemaId) revert InvalidTypeOrRecord();
            for (uint256 j; j < i; ++j) {
                if (typeIds[j] == schemaId) revert Noncanonical();
            }
            schemas[i] = schema;
            typeIds[i] = schemaId;
        }

        for (uint256 i; i < schemas.length; ++i) {
            for (uint256 j; j < schemas[i].referenceRoles.length; ++j) {
                ReferenceRoleV0 memory role = schemas[i].referenceRoles[j];
                if (role.targetKind == 1 && !_hasType(typeIds, role.targetTypeSchemaId)) {
                    revert InvalidTypeOrRecord();
                }
            }
        }

        for (uint256 i; i < records.length; ++i) {
            RecordInputV0 memory candidate = records[i];
            if (!_hasType(typeIds, candidate.typeSchemaId)) revert InvalidTypeOrRecord();
            if (recordId(candidate.typeSchemaId, candidate.canonicalBody) != candidate.expectedRecordId) {
                revert InvalidTypeOrRecord();
            }
            for (uint256 j; j < i; ++j) {
                if (records[j].expectedRecordId == candidate.expectedRecordId) revert Noncanonical();
            }
        }

        // Pass two interprets canonical bodies and resolves every exact or
        // self-Type Record edge against the already closed inventories.
        uint8 references;
        bytes32 referenceFrom;
        bytes32 referenceTarget;
        for (uint256 i; i < records.length; ++i) {
            uint256 schemaIndex = _typeIndex(typeIds, records[i].typeSchemaId);
            (bool present, bytes32 target) = _decodeReference(schemas[schemaIndex], records[i].canonicalBody);
            if (!present) continue;
            if (references == 8) revert LimitExceeded();
            if (target == records[i].expectedRecordId) revert InvalidTypeOrRecord();

            uint256 targetIndex = _recordIndex(records, target);
            ReferenceRoleV0 memory role = schemas[schemaIndex].referenceRoles[0];
            bytes32 requiredTargetType = role.targetKind == 1 ? role.targetTypeSchemaId : records[i].typeSchemaId;
            if (records[targetIndex].typeSchemaId != requiredTargetType) revert InvalidTypeOrRecord();

            ++references;
            referenceFrom = records[i].expectedRecordId;
            referenceTarget = target;
        }

        result = ValidationV0({
            typeSchemaId: typeIds[0],
            typeCount: uint16(types.length),
            recordCount: uint16(records.length),
            referenceCount: references,
            referenceFrom: referenceFrom,
            referenceTarget: referenceTarget,
            passes: 2
        });
    }

    function _validateType(TypeSchemaV0 memory schema, bytes32 expectedTypeId) private pure {
        if (schema.semanticCommitment.length == 0 || schema.semanticCommitment.length > 512) revert LimitExceeded();
        uint256 fieldsLength = schema.shape.fields.length;
        if (fieldsLength == 0 || fieldsLength > 16) revert LimitExceeded();
        if (schema.intrinsicConstraints.length > 8 || schema.referenceRoles.length > 8) revert LimitExceeded();
        if (schema.representation.fieldOrder != 1 || schema.representation.encoding != 1) revert Noncanonical();

        uint16 previous;
        for (uint256 i; i < fieldsLength; ++i) {
            FieldV0 memory field = schema.shape.fields[i];
            if (field.fieldKey == 0 || field.fieldKey <= previous) revert Noncanonical();
            if (field.scalarKind < 1 || field.scalarKind > 4) revert Noncanonical();
            if (
                (field.scalarKind == 1 || field.scalarKind == 2 || field.scalarKind == 4) && field.maxLengthOrCount != 0
            ) revert Noncanonical();
            if (field.scalarKind == 3 && field.maxLengthOrCount == 0) revert Noncanonical();
            if (field.scalarKind == 3 && field.maxLengthOrCount > 4096) revert LimitExceeded();
            previous = field.fieldKey;
        }

        previous = 0;
        for (uint256 i; i < schema.intrinsicConstraints.length; ++i) {
            ConstraintV0 memory constraint = schema.intrinsicConstraints[i];
            if (constraint.fieldKey <= previous || !_hasField(schema.shape.fields, constraint.fieldKey)) {
                revert Noncanonical();
            }
            if (constraint.rule != 2 || _fieldScalar(schema.shape.fields, constraint.fieldKey) != 3) {
                revert Noncanonical();
            }
            previous = constraint.fieldKey;
        }

        previous = 0;
        for (uint256 i; i < schema.referenceRoles.length; ++i) {
            ReferenceRoleV0 memory role = schema.referenceRoles[i];
            if (role.fieldKey <= previous || !_hasField(schema.shape.fields, role.fieldKey)) revert Noncanonical();
            if (_fieldScalar(schema.shape.fields, role.fieldKey) != 4) revert InvalidTypeOrRecord();
            if (role.targetKind == 1) {
                if (role.targetTypeSchemaId == bytes32(0) || role.targetTypeSchemaId == expectedTypeId) {
                    revert Noncanonical();
                }
            } else if (role.targetKind == 2) {
                if (role.targetTypeSchemaId != bytes32(0)) revert Noncanonical();
            } else {
                revert Noncanonical();
            }
            previous = role.fieldKey;
        }

        bool supportedShape = fieldsLength == 1 && _fieldEquals(schema.shape.fields[0], 1, 3, true, 64)
            && schema.referenceRoles.length == 0;
        supportedShape = supportedShape
            || (fieldsLength == 2
                && _fieldEquals(schema.shape.fields[0], 1, 3, true, 64)
                && _fieldEquals(schema.shape.fields[1], 2, 4, false, 0)
                && schema.referenceRoles.length == 1
                && schema.referenceRoles[0].fieldKey == 2);
        if (
            !supportedShape || schema.intrinsicConstraints.length != 1 || schema.intrinsicConstraints[0].fieldKey != 1
                || schema.intrinsicConstraints[0].rule != 2
        ) revert UnsupportedSchema();
    }

    function _decodeReference(TypeSchemaV0 memory schema, bytes memory canonicalBody)
        private
        pure
        returns (bool present, bytes32 target)
    {
        if (canonicalBody.length > 4096) revert LimitExceeded();
        if (schema.referenceRoles.length == 0) {
            bytes memory scalarValue = abi.decode(canonicalBody, (bytes));
            if (keccak256(canonicalBody) != keccak256(abi.encode(scalarValue))) revert Noncanonical();
            if (scalarValue.length > schema.shape.fields[0].maxLengthOrCount) revert LimitExceeded();
            return (false, bytes32(0));
        }

        bytes memory value;
        OptionalRecordV0 memory recordRef;
        (value, recordRef) = abi.decode(canonicalBody, (bytes, OptionalRecordV0));
        if (keccak256(canonicalBody) != keccak256(abi.encode(value, recordRef))) revert Noncanonical();
        if (value.length > schema.shape.fields[0].maxLengthOrCount) revert LimitExceeded();
        if (!recordRef.present && recordRef.value != bytes32(0)) revert Noncanonical();
        return (recordRef.present, recordRef.value);
    }

    function _hasType(bytes32[] memory typeIds, bytes32 target) private pure returns (bool) {
        for (uint256 i; i < typeIds.length; ++i) {
            if (typeIds[i] == target) return true;
        }
        return false;
    }

    function _typeIndex(bytes32[] memory typeIds, bytes32 target) private pure returns (uint256) {
        for (uint256 i; i < typeIds.length; ++i) {
            if (typeIds[i] == target) return i;
        }
        revert InvalidTypeOrRecord();
    }

    function _recordIndex(RecordInputV0[] memory records, bytes32 target) private pure returns (uint256) {
        for (uint256 i; i < records.length; ++i) {
            if (records[i].expectedRecordId == target) return i;
        }
        revert InvalidTypeOrRecord();
    }

    function _hasField(FieldV0[] memory fields, uint16 fieldKey) private pure returns (bool) {
        for (uint256 i; i < fields.length; ++i) {
            if (fields[i].fieldKey == fieldKey) return true;
        }
        return false;
    }

    function _fieldScalar(FieldV0[] memory fields, uint16 fieldKey) private pure returns (uint8) {
        for (uint256 i; i < fields.length; ++i) {
            if (fields[i].fieldKey == fieldKey) return fields[i].scalarKind;
        }
        return 0;
    }

    function _fieldEquals(FieldV0 memory field, uint16 key, uint8 scalar, bool required, uint16 bound)
        private
        pure
        returns (bool)
    {
        return field.fieldKey == key && field.scalarKind == scalar && field.required == required
            && field.maxLengthOrCount == bound;
    }
}
