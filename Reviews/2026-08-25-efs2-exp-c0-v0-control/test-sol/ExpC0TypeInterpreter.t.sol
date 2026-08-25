// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ExpC0TypeInterpreter} from "../src-sol/ExpC0TypeInterpreter.sol";

contract ExpC0TypeInterpreterTest {
    function testTwoPassClosureAcceptsRecordBReferenceToRecordA() external pure {
        bytes32 typeId = _noteTypeId();
        ExpC0TypeInterpreter.RecordInputV0[] memory records = _records(typeId);
        ExpC0TypeInterpreter.ValidationV0 memory result =
            ExpC0TypeInterpreter.validateClosedInventory(_typeBytes(), typeId, records);

        require(result.typeSchemaId == typeId, "type id");
        require(result.typeCount == 1, "type count");
        require(result.recordCount == 2, "record count");
        require(result.referenceCount == 1, "reference count");
        require(result.referenceFrom == records[1].expectedRecordId, "reference source");
        require(result.referenceTarget == records[0].expectedRecordId, "reference target");
        require(result.passes == 2, "passes");
    }

    function testExactRoleClosesAcyclicParentAndFileInventory() external pure {
        ExpC0TypeInterpreter.TypeSchemaV0 memory parent = _typeParent();
        bytes32 parentTypeId = ExpC0TypeInterpreter.typeSchemaId(parent);
        ExpC0TypeInterpreter.TypeSchemaV0 memory file = _typeFile(parentTypeId);
        bytes32 fileTypeId = ExpC0TypeInterpreter.typeSchemaId(file);

        ExpC0TypeInterpreter.TypeInputV0[] memory types = new ExpC0TypeInterpreter.TypeInputV0[](2);
        // Reverse dependency order proves resolution starts only after the
        // finite Type inventory has closed.
        types[0] = ExpC0TypeInterpreter.TypeInputV0(fileTypeId, _wire(file));
        types[1] = ExpC0TypeInterpreter.TypeInputV0(parentTypeId, _wire(parent));

        bytes memory parentBody = abi.encode(bytes("parent"));
        bytes32 parentRecordId = ExpC0TypeInterpreter.recordId(parentTypeId, parentBody);
        bytes memory fileBody =
            abi.encode(bytes("hello.txt"), ExpC0TypeInterpreter.OptionalRecordV0(true, parentRecordId));
        ExpC0TypeInterpreter.RecordInputV0[] memory records = new ExpC0TypeInterpreter.RecordInputV0[](2);
        records[0] = ExpC0TypeInterpreter.RecordInputV0(parentRecordId, parentTypeId, parentBody);
        records[1] = ExpC0TypeInterpreter.RecordInputV0(
            ExpC0TypeInterpreter.recordId(fileTypeId, fileBody), fileTypeId, fileBody
        );

        ExpC0TypeInterpreter.ValidationV0 memory result = ExpC0TypeInterpreter.validateClosedInventory(types, records);
        require(result.typeCount == 2, "two Types");
        require(result.recordCount == 2, "two Records");
        require(result.referenceCount == 1, "one exact edge");
        require(result.referenceTarget == parentRecordId, "exact target");
    }

    function testExactRoleStaticCoordinatesReject() external view {
        ExpC0TypeInterpreter.TypeSchemaV0 memory schema = _typeFile(bytes32(0));
        require(!_acceptsSingle(schema, ExpC0TypeInterpreter.typeSchemaId(schema)), "zero exact target accepted");

        schema = _typeNote();
        schema.referenceRoles[0].targetTypeSchemaId = bytes32(uint256(1));
        require(!_acceptsSingle(schema, ExpC0TypeInterpreter.typeSchemaId(schema)), "nonzero SELF target accepted");

        schema = _typeFile(bytes32(uint256(1)));
        schema.referenceRoles[0].targetKind = 3;
        require(!_acceptsSingle(schema, ExpC0TypeInterpreter.typeSchemaId(schema)), "unknown target kind accepted");

        schema = _typeFile(bytes32(uint256(1)));
        schema.referenceRoles[0].fieldKey = 1;
        require(!_acceptsSingle(schema, ExpC0TypeInterpreter.typeSchemaId(schema)), "non-Record role accepted");

        // A literal EXACT-to-containing descriptor cannot be constructed by
        // copying a prior ID: embedding that ID changes the descriptor and its
        // Type ID. The mutual-guess test below exercises that fixed-point
        // failure without pretending a stale ID is the containing Type.
    }

    function testExactRoleDynamicClosureRejectsMissingTypeRecordAndWrongRecordType() external view {
        ExpC0TypeInterpreter.TypeSchemaV0 memory parent = _typeParent();
        bytes32 parentTypeId = ExpC0TypeInterpreter.typeSchemaId(parent);
        ExpC0TypeInterpreter.TypeSchemaV0 memory file = _typeFile(parentTypeId);
        bytes32 fileTypeId = ExpC0TypeInterpreter.typeSchemaId(file);
        bytes memory parentBody = abi.encode(bytes("parent"));
        bytes32 parentRecordId = ExpC0TypeInterpreter.recordId(parentTypeId, parentBody);
        bytes memory fileBody =
            abi.encode(bytes("hello.txt"), ExpC0TypeInterpreter.OptionalRecordV0(true, parentRecordId));
        ExpC0TypeInterpreter.RecordInputV0 memory fileRecord = ExpC0TypeInterpreter.RecordInputV0(
            ExpC0TypeInterpreter.recordId(fileTypeId, fileBody), fileTypeId, fileBody
        );

        ExpC0TypeInterpreter.TypeInputV0[] memory types = new ExpC0TypeInterpreter.TypeInputV0[](1);
        types[0] = ExpC0TypeInterpreter.TypeInputV0(fileTypeId, _wire(file));
        ExpC0TypeInterpreter.RecordInputV0[] memory records = new ExpC0TypeInterpreter.RecordInputV0[](1);
        records[0] = fileRecord;
        require(!_acceptsInventory(types, records), "missing exact target Type accepted");

        types = new ExpC0TypeInterpreter.TypeInputV0[](2);
        types[0] = ExpC0TypeInterpreter.TypeInputV0(parentTypeId, _wire(parent));
        types[1] = ExpC0TypeInterpreter.TypeInputV0(fileTypeId, _wire(file));
        require(!_acceptsInventory(types, records), "missing exact target Record accepted");

        ExpC0TypeInterpreter.TypeSchemaV0 memory note = _typeNote();
        bytes32 noteTypeId = ExpC0TypeInterpreter.typeSchemaId(note);
        bytes memory noteBody =
            abi.encode(bytes("not-parent"), ExpC0TypeInterpreter.OptionalRecordV0(false, bytes32(0)));
        bytes32 noteRecordId = ExpC0TypeInterpreter.recordId(noteTypeId, noteBody);
        fileBody = abi.encode(bytes("hello.txt"), ExpC0TypeInterpreter.OptionalRecordV0(true, noteRecordId));
        fileRecord = ExpC0TypeInterpreter.RecordInputV0(
            ExpC0TypeInterpreter.recordId(fileTypeId, fileBody), fileTypeId, fileBody
        );
        types = new ExpC0TypeInterpreter.TypeInputV0[](3);
        types[0] = ExpC0TypeInterpreter.TypeInputV0(parentTypeId, _wire(parent));
        types[1] = ExpC0TypeInterpreter.TypeInputV0(fileTypeId, _wire(file));
        types[2] = ExpC0TypeInterpreter.TypeInputV0(noteTypeId, _wire(note));
        records = new ExpC0TypeInterpreter.RecordInputV0[](2);
        records[0] = fileRecord;
        records[1] = ExpC0TypeInterpreter.RecordInputV0(noteRecordId, noteTypeId, noteBody);
        require(!_acceptsInventory(types, records), "wrong exact target Record Type accepted");
    }

    function testMutualExactTypeGuessesDoNotCloseAfterIdentityRecomputation() external view {
        ExpC0TypeInterpreter.TypeSchemaV0 memory typeA = _typeFile(bytes32(uint256(1)));
        ExpC0TypeInterpreter.TypeSchemaV0 memory typeB = _typeFile(bytes32(uint256(2)));
        typeA.semanticCommitment = bytes("exact Mutual-A/v0");
        typeB.semanticCommitment = bytes("exact Mutual-B/v0");

        bytes32 firstA = ExpC0TypeInterpreter.typeSchemaId(typeA);
        bytes32 firstB = ExpC0TypeInterpreter.typeSchemaId(typeB);
        typeA.referenceRoles[0].targetTypeSchemaId = firstB;
        typeB.referenceRoles[0].targetTypeSchemaId = firstA;

        // Pinning the first-round IDs changes both Type identities. The final
        // finite inventory therefore cannot satisfy either embedded target.
        bytes32 finalA = ExpC0TypeInterpreter.typeSchemaId(typeA);
        bytes32 finalB = ExpC0TypeInterpreter.typeSchemaId(typeB);
        ExpC0TypeInterpreter.TypeInputV0[] memory types = new ExpC0TypeInterpreter.TypeInputV0[](2);
        types[0] = ExpC0TypeInterpreter.TypeInputV0(finalA, _wire(typeA));
        types[1] = ExpC0TypeInterpreter.TypeInputV0(finalB, _wire(typeB));
        require(!_acceptsInventory(types, _emptyRecords()), "mutual exact Type guesses closed");
    }

    function testSelfRoleRejectsMissingAndWrongTypeTargets() external view {
        bytes32 typeId = _noteTypeId();
        bytes memory selfBody =
            abi.encode(bytes("self"), ExpC0TypeInterpreter.OptionalRecordV0(true, bytes32(uint256(0xff))));
        ExpC0TypeInterpreter.RecordInputV0[] memory records = new ExpC0TypeInterpreter.RecordInputV0[](1);
        records[0] =
            ExpC0TypeInterpreter.RecordInputV0(ExpC0TypeInterpreter.recordId(typeId, selfBody), typeId, selfBody);
        require(!_accepts(_typeBytes(), typeId, records), "missing SELF target accepted");

        ExpC0TypeInterpreter.TypeSchemaV0 memory parent = _typeParent();
        bytes32 parentTypeId = ExpC0TypeInterpreter.typeSchemaId(parent);
        bytes memory parentBody = abi.encode(bytes("parent"));
        bytes32 parentRecordId = ExpC0TypeInterpreter.recordId(parentTypeId, parentBody);
        selfBody = abi.encode(bytes("self"), ExpC0TypeInterpreter.OptionalRecordV0(true, parentRecordId));
        records = new ExpC0TypeInterpreter.RecordInputV0[](2);
        records[0] =
            ExpC0TypeInterpreter.RecordInputV0(ExpC0TypeInterpreter.recordId(typeId, selfBody), typeId, selfBody);
        records[1] = ExpC0TypeInterpreter.RecordInputV0(parentRecordId, parentTypeId, parentBody);
        ExpC0TypeInterpreter.TypeInputV0[] memory types = new ExpC0TypeInterpreter.TypeInputV0[](2);
        types[0] = ExpC0TypeInterpreter.TypeInputV0(typeId, _typeBytes());
        types[1] = ExpC0TypeInterpreter.TypeInputV0(parentTypeId, _wire(parent));
        require(!_acceptsInventory(types, records), "wrong SELF target Record Type accepted");
    }

    function testHostileBodiesReject() external view {
        bytes32 typeId = _noteTypeId();
        ExpC0TypeInterpreter.RecordInputV0[] memory records = _records(typeId);

        records[0].canonicalBody =
            abi.encode(bytes("alpha"), ExpC0TypeInterpreter.OptionalRecordV0(false, bytes32(uint256(1))));
        records[0].expectedRecordId = ExpC0TypeInterpreter.recordId(typeId, records[0].canonicalBody);
        require(!_accepts(_typeBytes(), typeId, records), "hidden absent value accepted");

        records = _records(typeId);
        records[0].canonicalBody = bytes.concat(records[0].canonicalBody, bytes32(0));
        records[0].expectedRecordId = ExpC0TypeInterpreter.recordId(typeId, records[0].canonicalBody);
        require(!_accepts(_typeBytes(), typeId, records), "trailing bytes accepted");

        records = _records(typeId);
        records[0].canonicalBody = abi.encode(new bytes(65), ExpC0TypeInterpreter.OptionalRecordV0(false, bytes32(0)));
        records[0].expectedRecordId = ExpC0TypeInterpreter.recordId(typeId, records[0].canonicalBody);
        require(!_accepts(_typeBytes(), typeId, records), "oversize bytes accepted");

        records = _records(typeId);
        records[1].canonicalBody =
            abi.encode(bytes("beta"), ExpC0TypeInterpreter.OptionalRecordV0(true, bytes32(uint256(0xff))));
        records[1].expectedRecordId = ExpC0TypeInterpreter.recordId(typeId, records[1].canonicalBody);
        require(!_accepts(_typeBytes(), typeId, records), "unknown reference accepted");

        records = _records(typeId);
        records[0].canonicalBody = _noncanonicalBodyOffset(records[0].canonicalBody);
        records[0].expectedRecordId = ExpC0TypeInterpreter.recordId(typeId, records[0].canonicalBody);
        require(!_accepts(_typeBytes(), typeId, records), "noncanonical offset accepted");

        records = _records(typeId);
        records[0].canonicalBody = hex"00";
        records[0].expectedRecordId = ExpC0TypeInterpreter.recordId(typeId, records[0].canonicalBody);
        require(!_accepts(_typeBytes(), typeId, records), "malformed body accepted");

        records = _records(typeId);
        bytes32 wrongType = bytes32(uint256(0xff));
        records[0].typeSchemaId = wrongType;
        records[0].expectedRecordId = ExpC0TypeInterpreter.recordId(wrongType, records[0].canonicalBody);
        records[1].canonicalBody =
            abi.encode(bytes("beta"), ExpC0TypeInterpreter.OptionalRecordV0(true, records[0].expectedRecordId));
        records[1].expectedRecordId = ExpC0TypeInterpreter.recordId(typeId, records[1].canonicalBody);
        require(!_accepts(_typeBytes(), typeId, records), "wrong SELF_TYPE_RECORD Type accepted");
    }

    function testHostileSchemasReject() external view {
        ExpC0TypeInterpreter.TypeSchemaV0 memory schema = _typeNote();
        schema.shape.fields[1].fieldKey = 1;
        require(
            !_accepts(_wire(schema), ExpC0TypeInterpreter.typeSchemaId(schema), _emptyRecords()), "duplicate accepted"
        );

        schema = _typeNote();
        schema.shape.fields[0].fieldKey = 0;
        require(
            !_accepts(_wire(schema), ExpC0TypeInterpreter.typeSchemaId(schema), _emptyRecords()),
            "reserved zero accepted"
        );

        schema = _typeNote();
        schema.shape.fields[0].scalarKind = 99;
        require(
            !_accepts(_wire(schema), ExpC0TypeInterpreter.typeSchemaId(schema), _emptyRecords()),
            "unknown scalar accepted"
        );

        schema = _typeNote();
        schema.representation.encoding = 99;
        require(
            !_accepts(_wire(schema), ExpC0TypeInterpreter.typeSchemaId(schema), _emptyRecords()),
            "unknown encoding accepted"
        );

        schema = _typeNote();
        (schema.shape.fields[0], schema.shape.fields[1]) = (schema.shape.fields[1], schema.shape.fields[0]);
        require(
            !_accepts(_wire(schema), ExpC0TypeInterpreter.typeSchemaId(schema), _emptyRecords()), "field order accepted"
        );

        schema = _typeNote();
        schema.representation.fieldOrder = 99;
        require(
            !_accepts(_wire(schema), ExpC0TypeInterpreter.typeSchemaId(schema), _emptyRecords()),
            "unknown field order accepted"
        );

        schema = _typeNote();
        schema.referenceRoles[0].fieldKey = 1;
        require(
            !_accepts(_wire(schema), ExpC0TypeInterpreter.typeSchemaId(schema), _emptyRecords()),
            "malformed role accepted"
        );

        schema = _typeNote();
        schema.referenceRoles[0].targetKind = 99;
        require(
            !_accepts(_wire(schema), ExpC0TypeInterpreter.typeSchemaId(schema), _emptyRecords()),
            "unknown role target accepted"
        );

        schema = _typeNote();
        schema.intrinsicConstraints[0].rule = 1;
        require(
            !_accepts(_wire(schema), ExpC0TypeInterpreter.typeSchemaId(schema), _emptyRecords()),
            "reserved constraint accepted"
        );

        schema = _typeNote();
        schema.intrinsicConstraints[0].fieldKey = 2;
        require(
            !_accepts(_wire(schema), ExpC0TypeInterpreter.typeSchemaId(schema), _emptyRecords()),
            "MAX_BYTES on fixed scalar accepted"
        );

        schema = _typeNote();
        schema.shape.fields[0].maxLengthOrCount = 4097;
        require(
            !_accepts(_wire(schema), ExpC0TypeInterpreter.typeSchemaId(schema), _emptyRecords()),
            "oversized BYTES declaration accepted"
        );
    }

    function testEnvelopeFailureGradesSeparateMalformedNoncanonicalAndWrongKey() external view {
        ExpC0TypeInterpreter.TypeSchemaV0 memory schema = _typeNote();
        bytes32 typeId = ExpC0TypeInterpreter.typeSchemaId(schema);

        bytes memory trailingPayload = bytes.concat(abi.encode(schema), bytes32(0));
        bytes memory trailingEnvelope = abi.encode(uint16(0), trailingPayload);
        _requiresSelector(
            trailingEnvelope, typeId, ExpC0TypeInterpreter.MalformedAbi.selector, "trailing payload grade"
        );

        schema.shape.fields[0].scalarKind = 99;
        _requiresSelector(
            _wire(schema),
            ExpC0TypeInterpreter.typeSchemaId(schema),
            ExpC0TypeInterpreter.Noncanonical.selector,
            "unknown coordinate grade"
        );

        _requiresSelector(
            _typeBytes(), bytes32(uint256(1)), ExpC0TypeInterpreter.InvalidTypeOrRecord.selector, "key grade"
        );
    }

    function check(bytes memory typeBytes, bytes32 expectedTypeId, ExpC0TypeInterpreter.RecordInputV0[] memory records)
        external
        pure
        returns (ExpC0TypeInterpreter.ValidationV0 memory)
    {
        return ExpC0TypeInterpreter.validateClosedInventory(typeBytes, expectedTypeId, records);
    }

    function checkInventory(
        ExpC0TypeInterpreter.TypeInputV0[] memory types,
        ExpC0TypeInterpreter.RecordInputV0[] memory records
    ) external pure returns (ExpC0TypeInterpreter.ValidationV0 memory) {
        return ExpC0TypeInterpreter.validateClosedInventory(types, records);
    }

    function _accepts(
        bytes memory typeBytes,
        bytes32 expectedTypeId,
        ExpC0TypeInterpreter.RecordInputV0[] memory records
    ) internal view returns (bool) {
        try this.check(typeBytes, expectedTypeId, records) returns (ExpC0TypeInterpreter.ValidationV0 memory) {
            return true;
        } catch {
            return false;
        }
    }

    function _acceptsInventory(
        ExpC0TypeInterpreter.TypeInputV0[] memory types,
        ExpC0TypeInterpreter.RecordInputV0[] memory records
    ) internal view returns (bool) {
        try this.checkInventory(types, records) returns (ExpC0TypeInterpreter.ValidationV0 memory) {
            return true;
        } catch {
            return false;
        }
    }

    function _acceptsSingle(ExpC0TypeInterpreter.TypeSchemaV0 memory schema, bytes32 expectedTypeId)
        internal
        view
        returns (bool)
    {
        ExpC0TypeInterpreter.TypeInputV0[] memory types = new ExpC0TypeInterpreter.TypeInputV0[](1);
        types[0] = ExpC0TypeInterpreter.TypeInputV0(expectedTypeId, _wire(schema));
        return _acceptsInventory(types, _emptyRecords());
    }

    function _requiresSelector(bytes memory raw, bytes32 expectedTypeId, bytes4 expected, string memory label)
        internal
        view
    {
        (bool ok, bytes memory reason) =
            address(this).staticcall(abi.encodeCall(this.check, (raw, expectedTypeId, _emptyRecords())));
        require(!ok && _selector(reason) == expected, label);
    }

    function _selector(bytes memory reason) internal pure returns (bytes4 selector) {
        if (reason.length < 4) return bytes4(0);
        assembly ("memory-safe") {
            selector := mload(add(reason, 0x20))
        }
    }

    function _records(bytes32 typeId) internal pure returns (ExpC0TypeInterpreter.RecordInputV0[] memory records) {
        records = new ExpC0TypeInterpreter.RecordInputV0[](2);
        bytes memory bodyA = abi.encode(bytes("alpha"), ExpC0TypeInterpreter.OptionalRecordV0(false, bytes32(0)));
        bytes32 recordA = ExpC0TypeInterpreter.recordId(typeId, bodyA);
        bytes memory bodyB = abi.encode(bytes("beta"), ExpC0TypeInterpreter.OptionalRecordV0(true, recordA));
        records[0] =
            ExpC0TypeInterpreter.RecordInputV0({expectedRecordId: recordA, typeSchemaId: typeId, canonicalBody: bodyA});
        records[1] = ExpC0TypeInterpreter.RecordInputV0({
            expectedRecordId: ExpC0TypeInterpreter.recordId(typeId, bodyB), typeSchemaId: typeId, canonicalBody: bodyB
        });
    }

    function _emptyRecords() internal pure returns (ExpC0TypeInterpreter.RecordInputV0[] memory) {
        return new ExpC0TypeInterpreter.RecordInputV0[](0);
    }

    function _typeBytes() internal pure returns (bytes memory) {
        return _wire(_typeNote());
    }

    function _typeNote() internal pure returns (ExpC0TypeInterpreter.TypeSchemaV0 memory schema) {
        ExpC0TypeInterpreter.FieldV0[] memory fields = new ExpC0TypeInterpreter.FieldV0[](2);
        fields[0] = ExpC0TypeInterpreter.FieldV0(1, 3, true, 64);
        fields[1] = ExpC0TypeInterpreter.FieldV0(2, 4, false, 0);

        ExpC0TypeInterpreter.ConstraintV0[] memory constraints = new ExpC0TypeInterpreter.ConstraintV0[](1);
        constraints[0] = ExpC0TypeInterpreter.ConstraintV0(1, 2);

        ExpC0TypeInterpreter.ReferenceRoleV0[] memory roles = new ExpC0TypeInterpreter.ReferenceRoleV0[](1);
        roles[0] = ExpC0TypeInterpreter.ReferenceRoleV0(2, 2, bytes32(0));

        schema = ExpC0TypeInterpreter.TypeSchemaV0({
            semanticCommitment: bytes("exact Note/v0"),
            shape: ExpC0TypeInterpreter.ShapeV0(fields),
            representation: ExpC0TypeInterpreter.RepresentationV0(1, 1),
            intrinsicConstraints: constraints,
            referenceRoles: roles
        });
    }

    function _typeParent() internal pure returns (ExpC0TypeInterpreter.TypeSchemaV0 memory schema) {
        ExpC0TypeInterpreter.FieldV0[] memory fields = new ExpC0TypeInterpreter.FieldV0[](1);
        fields[0] = ExpC0TypeInterpreter.FieldV0(1, 3, true, 64);
        ExpC0TypeInterpreter.ConstraintV0[] memory constraints = new ExpC0TypeInterpreter.ConstraintV0[](1);
        constraints[0] = ExpC0TypeInterpreter.ConstraintV0(1, 2);
        schema = ExpC0TypeInterpreter.TypeSchemaV0({
            semanticCommitment: bytes("exact Parent/v0"),
            shape: ExpC0TypeInterpreter.ShapeV0(fields),
            representation: ExpC0TypeInterpreter.RepresentationV0(1, 1),
            intrinsicConstraints: constraints,
            referenceRoles: new ExpC0TypeInterpreter.ReferenceRoleV0[](0)
        });
    }

    function _typeFile(bytes32 parentTypeId) internal pure returns (ExpC0TypeInterpreter.TypeSchemaV0 memory schema) {
        ExpC0TypeInterpreter.FieldV0[] memory fields = new ExpC0TypeInterpreter.FieldV0[](2);
        fields[0] = ExpC0TypeInterpreter.FieldV0(1, 3, true, 64);
        fields[1] = ExpC0TypeInterpreter.FieldV0(2, 4, false, 0);
        ExpC0TypeInterpreter.ConstraintV0[] memory constraints = new ExpC0TypeInterpreter.ConstraintV0[](1);
        constraints[0] = ExpC0TypeInterpreter.ConstraintV0(1, 2);
        ExpC0TypeInterpreter.ReferenceRoleV0[] memory roles = new ExpC0TypeInterpreter.ReferenceRoleV0[](1);
        roles[0] = ExpC0TypeInterpreter.ReferenceRoleV0(2, 1, parentTypeId);
        schema = ExpC0TypeInterpreter.TypeSchemaV0({
            semanticCommitment: bytes("exact File/v0"),
            shape: ExpC0TypeInterpreter.ShapeV0(fields),
            representation: ExpC0TypeInterpreter.RepresentationV0(1, 1),
            intrinsicConstraints: constraints,
            referenceRoles: roles
        });
    }

    function _noteTypeId() internal pure returns (bytes32) {
        return ExpC0TypeInterpreter.typeSchemaId(_typeNote());
    }

    function _wire(ExpC0TypeInterpreter.TypeSchemaV0 memory schema) internal pure returns (bytes memory) {
        return ExpC0TypeInterpreter.encodeTypeSchemaV0(schema);
    }

    function _noncanonicalBodyOffset(bytes memory canonical) internal pure returns (bytes memory mutated) {
        require(canonical.length >= 96, "short canonical body");
        mutated = new bytes(canonical.length + 32);
        assembly ("memory-safe") {
            mstore(add(mutated, 0x20), 0x80)
        }
        for (uint256 i = 32; i < 96; ++i) {
            mutated[i] = canonical[i];
        }
        for (uint256 i = 96; i < canonical.length; ++i) {
            mutated[i + 32] = canonical[i];
        }
    }
}
