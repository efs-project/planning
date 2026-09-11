// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {C0PlanCodec} from "./C0PlanCodec.sol";
import {StateKernel} from "./StateKernel.sol";

library C0Request {
    error C0_CALL_LIMIT(uint256 got, uint256 maximum);
    error C0_PAYLOAD_LIMIT(uint256 got, uint256 maximum);
    error E_PROFILE(uint16 got);
    error E_RESERVED_AUTHORITY(bytes32 authorityRef, uint64 authEpoch);
    error E_EMPTY_ENVELOPE();
    error E_LEAF_LIMIT(uint256 count);
    error E_BOUNDS(uint16 code);
    error E_LEAF_RANGE(uint16 leafIndex);
    error E_BODY_LIMIT(uint256 length);
    error E_WIRE_LIMIT(uint256 wireBytes);
    error E_BODY_MISMATCH(uint16 leafIndex);

    struct Prepared {
        StateKernel.Publication publication;
        bytes32 publicationDigest;
        uint256 equivalentWireBytes;
    }

    function maxCallBytes(uint64 fileCap) internal pure returns (uint256) {
        return 21_412 + ((uint256(fileCap) + 31) / 32) * 32;
    }

    function prepare(
        StateKernel.EnvelopeHeader calldata header,
        bytes32[] calldata recordIds,
        StateKernel.SelectedLeaf[] calldata leaves,
        StateKernel.ExpectedRevision[] calldata expectedRevisions,
        uint256 payloadLength,
        uint64 fileCap
    ) internal view returns (Prepared memory prepared) {
        uint256 callMaximum = maxCallBytes(fileCap);
        if (msg.data.length > callMaximum) revert C0_CALL_LIMIT(msg.data.length, callMaximum);
        if (payloadLength > fileCap) revert C0_PAYLOAD_LIMIT(payloadLength, fileCap);
        if (header.profile != 1) revert E_PROFILE(header.profile);
        if (header.authorityRef != bytes32(0) || header.authEpoch != 0) {
            revert E_RESERVED_AUTHORITY(header.authorityRef, header.authEpoch);
        }

        uint256 recordCount = recordIds.length;
        if (recordCount == 0) revert E_EMPTY_ENVELOPE();
        if (recordCount > 64) revert E_LEAF_LIMIT(recordCount);
        uint256 leafCount = leaves.length;
        if (leafCount == 0 || leafCount > 64 || expectedRevisions.length > 64) revert E_BOUNDS(uint16(1));

        uint256 wire = 544 + 32 * recordCount + 160 * leafCount;
        uint256 total;
        uint64 mask;
        for (uint256 i; i < leafCount; ++i) {
            uint16 index = leaves[i].leafIndex;
            if (index >= recordCount || (i != 0 && index <= leaves[i - 1].leafIndex)) revert E_LEAF_RANGE(index);
            uint256 length = leaves[i].body.length;
            if (length > 8192) revert E_BODY_LIMIT(length);
            total += length;
            if (total > 8192) revert E_BODY_LIMIT(total);
            wire += ((length + 31) / 32) * 32;
            mask |= uint64(1) << index;
        }
        if (wire > 16_384) revert E_WIRE_LIMIT(wire);

        for (uint256 i; i < expectedRevisions.length; ++i) {
            uint16 index = expectedRevisions[i].leafIndex;
            if (index >= 64 || (i != 0 && index <= expectedRevisions[i - 1].leafIndex)) {
                revert C0PlanCodec.InvalidExpectedRevisions();
            }
        }

        for (uint256 i; i < leafCount; ++i) {
            StateKernel.SelectedLeaf calldata leaf = leaves[i];
            bytes32 actual = keccak256(abi.encode(keccak256("efs2/record/1"), leaf.typeId, keccak256(leaf.body)));
            if (recordIds[leaf.leafIndex] != actual) revert E_BODY_MISMATCH(leaf.leafIndex);
        }

        StateKernel.EnvelopeHeader memory boundedHeader = header;
        bytes32[] memory boundedRecordIds = recordIds;
        StateKernel.SelectedLeaf[] memory boundedLeaves = leaves;
        StateKernel.ExpectedRevision[] memory boundedExpectedRevisions = expectedRevisions;
        bytes32 digest = C0PlanCodec.publicationDigest(boundedHeader, boundedRecordIds);
        bytes32 envelopeId = keccak256(abi.encode(keccak256("efs2/envelope/1"), digest));
        prepared.publication = StateKernel.Publication(
            envelopeId, boundedHeader, boundedRecordIds, mask, boundedLeaves, boundedExpectedRevisions
        );
        prepared.publicationDigest = digest;
        prepared.equivalentWireBytes = wire;
    }
}
