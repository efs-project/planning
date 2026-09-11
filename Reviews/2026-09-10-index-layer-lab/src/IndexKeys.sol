// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";
import {RecordBody} from "./RecordBody.sol";

library IndexKeys {
    error InvalidDigest(uint16 algorithm, uint256 length);
    error InvalidIndex(uint8 kind, uint8 target);
    error TooManyKeys(uint256 count);

    bytes32 private constant DOM_PK = keccak256("efs2/pk/1");
    bytes32 private constant DOM_SCALAR = keccak256("efs2/vk/scalar/1");
    bytes32 private constant DOM_OCCURRENCE_VALUE = keccak256("efs2/vk/occ/1");
    bytes32 private constant DOM_DIGEST = keccak256("efs2/vk/digest/1");
    bytes32 private constant DOM_SCOPE = keccak256("efs2/vk/binding-scope/1");

    function posting(bytes32 typeId, uint8 kind, uint8 ordinal, bytes32 valueKey) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_PK, typeId, uint256(kind), uint256(ordinal), valueKey));
    }

    function scalar(bytes memory fieldBytes) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_SCALAR, keccak256(fieldBytes)));
    }

    function occurrenceTarget(bytes32 envelopeId, uint16 leafIndex) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_OCCURRENCE_VALUE, envelopeId, uint256(leafIndex)));
    }

    function digest(uint16 algorithm, bytes memory digestBytes) internal pure returns (bytes32) {
        uint256 expected = algorithm == 0x11 || algorithm == 0xef01
            ? 20
            : algorithm == 0x12 || algorithm == 0x1b ? 32 : algorithm == 0x13 ? 64 : 0;
        if (expected == 0 || digestBytes.length != expected) revert InvalidDigest(algorithm, digestBytes.length);
        return keccak256(abi.encode(DOM_DIGEST, uint256(algorithm), keccak256(digestBytes)));
    }

    function scope(bytes32 principalId, bytes32 purpose, bytes32 subject) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_SCOPE, principalId, purpose, subject));
    }

    function occurrenceKeys(
        TypeGroupParser.SchemaCache memory schema,
        RecordBody.CheckedBody memory body,
        bytes32 recordId,
        bytes32 principalId
    ) internal pure returns (bytes32[] memory keys) {
        uint256 maximum = 3 + body.references.length * 2 + schema.indexes.length;
        if (maximum > 43) revert TooManyKeys(maximum);
        keys = new bytes32[](maximum);
        uint256 count;
        count = add(keys, count, posting(bytes32(0), 3, 0, recordId));
        count = add(keys, count, posting(schema.typeId, 1, 0, bytes32(0)));
        count = add(keys, count, posting(bytes32(0), 4, 0, principalId));

        for (uint256 i; i < body.references.length; ++i) {
            RecordBody.ReferenceValue memory refValue = body.references[i];
            TypeGroupParser.RoleCache memory role = schema.roles[refValue.roleIndex];
            bytes32 targetKey =
                role.targetClass == 4 ? occurrenceTarget(refValue.targetId, refValue.leafIndex) : refValue.targetId;
            count = add(keys, count, posting(bytes32(0), 5, 0, targetKey));
            count = add(keys, count, posting(schema.typeId, 6, refValue.roleIndex, targetKey));
        }

        for (uint256 i; i < schema.indexes.length; ++i) {
            TypeGroupParser.IndexCache memory index = schema.indexes[i];
            if (index.kind == 1) {
                count = add(keys, count, posting(schema.typeId, 7, uint8(i), scalar(body.fields[index.target])));
            } else if (index.kind == 2) {
                // Reference roles already emitted the mandatory general and predicate families.
            } else if (index.kind == 3) {
                bytes memory encoded = body.fields[index.target];
                uint16 algorithm = (uint16(uint8(encoded[0])) << 8) | uint16(uint8(encoded[1]));
                uint16 length = (uint16(uint8(encoded[2])) << 8) | uint16(uint8(encoded[3]));
                bytes memory value = new bytes(length);
                for (uint256 j; j < length; ++j) {
                    value[j] = encoded[j + 4];
                }
                count = add(keys, count, posting(bytes32(0), 9, 0, digest(algorithm, value)));
            } else {
                revert InvalidIndex(index.kind, index.target);
            }
        }
        assembly ("memory-safe") { mstore(keys, count) }
    }

    function add(bytes32[] memory keys, uint256 count, bytes32 key) private pure returns (uint256) {
        for (uint256 i; i < count; ++i) {
            if (keys[i] == key) return count;
        }
        keys[count] = key;
        return count + 1;
    }
}
