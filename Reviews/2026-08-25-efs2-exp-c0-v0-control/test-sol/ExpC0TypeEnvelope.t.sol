// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ExpC0Codec} from "../src-sol/ExpC0Codec.sol";
import {ExpC0TypeInterpreter} from "../src-sol/ExpC0TypeInterpreter.sol";

contract ExpC0TypeEnvelopeHarness {
    function inspect(bytes memory raw)
        external
        pure
        returns (uint16 codecVersion, bytes memory payloadBytes, bytes32 typeSchemaId, bool supported)
    {
        return ExpC0TypeInterpreter.inspectEnvelope(raw);
    }
}

contract ExpC0TypeEnvelopeTest {
    bytes32 internal constant OPAQUE_CODEC_1_ID = 0x3b7ffc8e2419e69f092b5d8a209a48b2d3ed54cae5b759c431b5e568e08d1ab2;
    bytes32 internal constant MUTATED_OPAQUE_CODEC_1_ID =
        0x557e54e2e14eddf11c44cdcaf48751e08524e4cfedc1ed1c5c7efc47507ff2d6;

    ExpC0TypeEnvelopeHarness internal immutable harness = new ExpC0TypeEnvelopeHarness();

    function testCodecZeroEnvelopeAndIdentityUseRawPayload() external view {
        ExpC0Codec.TypeSchema memory schema = _typeNote();
        bytes memory payload = ExpC0Codec.encodeTypeSchemaPayloadV0(schema);
        bytes memory raw = ExpC0Codec.encodeTypeSchemaV0(schema);
        (uint16 codecVersion, bytes memory retained, bytes32 typeId, bool supported) = harness.inspect(raw);

        require(codecVersion == 0, "codec");
        require(keccak256(retained) == keccak256(payload), "payload");
        require(typeId == ExpC0Codec.typeSchemaId(0, payload), "id");
        require(typeId == ExpC0Codec.typeSchemaId(schema), "schema id");
        require(supported, "support");
    }

    function testOpaqueCodecOneIsRetainedButUnsupported() external view {
        bytes memory payload = hex"deadbeef0001";
        bytes memory raw = hex"0000000000000000000000000000000000000000000000000000000000000001"
            hex"0000000000000000000000000000000000000000000000000000000000000040"
            hex"0000000000000000000000000000000000000000000000000000000000000006"
            hex"deadbeef00010000000000000000000000000000000000000000000000000000";
        require(
            keccak256(raw) == keccak256(ExpC0Codec.encodeTypeSchemaEnvelope(1, payload)), "serialized codec-1 vector"
        );
        (uint16 codecVersion, bytes memory retained, bytes32 typeId, bool supported) = harness.inspect(raw);

        require(codecVersion == 1, "codec");
        require(keccak256(retained) == keccak256(payload), "raw lost");
        require(typeId == OPAQUE_CODEC_1_ID, "pinned id");
        require(typeId == ExpC0Codec.typeSchemaId(1, payload), "id formula");
        require(!supported, "future codec interpreted");

        payload[5] = 0;
        require(ExpC0Codec.typeSchemaId(1, payload) == MUTATED_OPAQUE_CODEC_1_ID, "pinned payload mutation");
        require(typeId != MUTATED_OPAQUE_CODEC_1_ID, "payload mutation did not bind identity");
    }

    function testMalformedOuterOffsetPaddingAndTrailingReject() external view {
        bytes memory canonical = ExpC0Codec.encodeTypeSchemaEnvelope(1, hex"ab");

        bytes memory offset = _copy(canonical);
        assembly ("memory-safe") {
            mstore(add(offset, 0x40), 0x80)
        }
        _mustReject(offset);

        bytes memory padding = _copy(canonical);
        padding[padding.length - 1] = 0x01;
        _mustReject(padding);

        bytes memory trailing = bytes.concat(canonical, new bytes(32));
        _mustReject(trailing);
        _mustReject(hex"00");
    }

    function testWholeEnvelopeCapRejectsBeforeOpaquePayloadAllocation() external view {
        bytes memory oversized = ExpC0Codec.encodeTypeSchemaEnvelope(1, new bytes(2000));
        (bool ok, bytes memory reason) = address(harness).staticcall(abi.encodeCall(harness.inspect, (oversized)));
        require(!ok, "oversized envelope accepted");
        require(_selector(reason) == ExpC0Codec.TypeEnvelopeLimitExceeded.selector, "wrong limit grade");
    }

    function _mustReject(bytes memory raw) private view {
        (bool ok,) = address(harness).staticcall(abi.encodeCall(harness.inspect, (raw)));
        require(!ok, "malformed outer accepted");
    }

    function _copy(bytes memory input) private pure returns (bytes memory output) {
        output = new bytes(input.length);
        for (uint256 i; i < input.length; ++i) {
            output[i] = input[i];
        }
    }

    function _selector(bytes memory reason) private pure returns (bytes4 selector) {
        if (reason.length < 4) return bytes4(0);
        assembly ("memory-safe") {
            selector := mload(add(reason, 0x20))
        }
    }

    function _typeNote() private pure returns (ExpC0Codec.TypeSchema memory schema) {
        ExpC0Codec.FieldV0[] memory fields = new ExpC0Codec.FieldV0[](2);
        fields[0] = ExpC0Codec.FieldV0(1, 3, true, 64);
        fields[1] = ExpC0Codec.FieldV0(2, 4, false, 0);

        ExpC0Codec.ConstraintV0[] memory constraints = new ExpC0Codec.ConstraintV0[](1);
        constraints[0] = ExpC0Codec.ConstraintV0(1, 2);

        ExpC0Codec.ReferenceRoleV0[] memory roles = new ExpC0Codec.ReferenceRoleV0[](1);
        roles[0] = ExpC0Codec.ReferenceRoleV0(2, 2, bytes32(0));

        schema = ExpC0Codec.TypeSchema({
            semanticCommitment: bytes("exact Note/v0"),
            shape: ExpC0Codec.ShapeV0(fields),
            representation: ExpC0Codec.RepresentationV0(1, 1),
            intrinsicConstraints: constraints,
            referenceRoles: roles
        });
    }
}
