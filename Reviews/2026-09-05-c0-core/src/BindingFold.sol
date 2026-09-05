// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {RecordBody} from "./RecordBody.sol";

library BindingFold {
    struct OccurrenceRef {
        bytes32 envelopeId;
        uint16 leafIndex;
    }

    struct KernelIds {
        bytes32 setType;
        bytes32 tombstoneType;
        bytes32 withdrawalType;
    }

    struct Head {
        uint8 state;
        uint8 targetKind;
        uint8 tombstoneCause;
        uint32 revision;
        uint64 admissionOrdinal;
        bytes32 targetA;
        uint16 targetLeaf;
    }

    struct Effect {
        uint8 kind;
        bytes32 purpose;
        bytes32 subject;
        bytes32 fieldRole;
        uint8 targetKind;
        bytes32 targetA;
        uint16 targetLeaf;
        bool predecessorPresent;
        OccurrenceRef predecessor;
    }

    error ErrCasPredecessor(
        bytes32 bindingKey, bytes32 haveEnvelopeId, uint16 haveLeafIndex, uint64 haveOrdinal, uint32 haveRevision
    );
    error ErrCasRevision(bytes32 bindingKey, uint32 expected, uint32 have);
    error ErrRevisionGuard(bytes32 bindingKey);
    error InvalidEffect(uint8 kind);
    error InvalidOrdinal(bytes32 bindingKey, uint64 previous, uint64 proposed);
    error InvalidHead();

    bytes32 private constant DOM_POSITION = keccak256("efs2/position/1");
    bytes32 private constant DOM_BINDING = keccak256("efs2/binding/1");
    uint64 private constant ORDINAL_GUARD = (uint64(1) << 48) - 1;

    function decode(KernelIds memory ids, bytes32 typeId, RecordBody.CheckedBody memory body)
        internal
        pure
        returns (Effect memory e)
    {
        if (typeId == ids.setType) {
            e.kind = 1;
            e.purpose = word(body.fields[0], 0);
            e.subject = word(body.fields[1], 0);
            e.fieldRole = word(body.fields[2], 0);
            bool recordPresent = present(body.fields[3]);
            bool occurrencePresent = present(body.fields[4]);
            if (recordPresent == occurrencePresent) revert RecordBody.InvalidBody(17);
            if (recordPresent) {
                e.targetKind = 1;
                e.targetA = word(body.fields[3], 1);
            } else {
                e.targetKind = 2;
                e.targetA = word(body.fields[4], 1);
                e.targetLeaf = short(body.fields[4], 33);
            }
            e.predecessorPresent = present(body.fields[5]);
            if (e.predecessorPresent) {
                e.predecessor = OccurrenceRef(word(body.fields[5], 1), short(body.fields[5], 33));
            }
        } else if (typeId == ids.tombstoneType) {
            e.kind = 2;
            e.purpose = word(body.fields[0], 0);
            e.subject = word(body.fields[1], 0);
            e.fieldRole = word(body.fields[2], 0);
            e.predecessorPresent = present(body.fields[3]);
            if (e.predecessorPresent) {
                e.predecessor = OccurrenceRef(word(body.fields[3], 1), short(body.fields[3], 33));
            }
        } else if (typeId == ids.withdrawalType) {
            e.kind = 3;
            e.targetKind = 2;
            e.targetA = word(body.fields[0], 0);
            e.targetLeaf = short(body.fields[0], 32);
        }
    }

    function positionKey(Effect memory e) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_POSITION, e.purpose, e.subject, e.fieldRole));
    }

    function bindingKey(bytes32 principalId, bytes32 position) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_BINDING, principalId, position));
    }

    function advance(
        bytes32 key,
        Head memory beforeHead,
        OccurrenceRef memory beforeSource,
        Effect memory e,
        uint32 expectedRevision,
        uint64 newOrdinal
    ) internal pure returns (Head memory) {
        if (e.kind != 1 && e.kind != 2) revert InvalidEffect(e.kind);
        validateHead(beforeHead);
        if (e.kind == 1) {
            if (
                (e.targetKind != 1 && e.targetKind != 2) || e.targetA == bytes32(0)
                    || (e.targetKind == 1 && e.targetLeaf != 0)
            ) revert InvalidEffect(e.kind);
        } else if (e.targetKind != 0 || e.targetA != bytes32(0) || e.targetLeaf != 0) {
            revert InvalidEffect(e.kind);
        }
        if (beforeHead.state == 0) {
            if (e.predecessorPresent) revert ErrCasPredecessor(key, bytes32(0), 0, 0, 0);
        } else if (
            !e.predecessorPresent || e.predecessor.envelopeId != beforeSource.envelopeId
                || e.predecessor.leafIndex != beforeSource.leafIndex
        ) {
            revert ErrCasPredecessor(
                key, beforeSource.envelopeId, beforeSource.leafIndex, beforeHead.admissionOrdinal, beforeHead.revision
            );
        }
        if (expectedRevision != beforeHead.revision) {
            revert ErrCasRevision(key, expectedRevision, beforeHead.revision);
        }
        if (beforeHead.revision >= type(uint32).max - 1) revert ErrRevisionGuard(key);
        ordinal(key, beforeHead.admissionOrdinal, newOrdinal);

        Head memory afterHead;
        afterHead.state = e.kind == 1 ? 1 : 2;
        afterHead.revision = beforeHead.revision + 1;
        afterHead.admissionOrdinal = newOrdinal;
        if (e.kind == 1) {
            afterHead.targetKind = e.targetKind;
            afterHead.targetA = e.targetA;
            afterHead.targetLeaf = e.targetLeaf;
        } else {
            afterHead.tombstoneCause = 1;
        }
        return afterHead;
    }

    function withdrawHead(bytes32 key, Head memory beforeHead, uint64 newOrdinal)
        internal
        pure
        returns (Head memory afterHead)
    {
        validateHead(beforeHead);
        if (beforeHead.state != 1 && beforeHead.state != 2) revert InvalidHead();
        if (beforeHead.revision >= type(uint32).max - 1) revert ErrRevisionGuard(key);
        ordinal(key, beforeHead.admissionOrdinal, newOrdinal);
        afterHead.state = 2;
        afterHead.tombstoneCause = 2;
        afterHead.revision = beforeHead.revision + 1;
        afterHead.admissionOrdinal = newOrdinal;
    }

    function pack(Head memory head) internal pure returns (uint256 meta, bytes32 target) {
        validateHead(head);
        meta = uint256(head.state) | (uint256(head.revision) << 8) | (uint256(head.admissionOrdinal) << 40)
            | (uint256(head.targetKind) << 88) | (uint256(head.tombstoneCause) << 96)
            | (uint256(head.targetLeaf) << 104);
        target = head.targetA;
    }

    function unpack(uint256 meta, bytes32 target) internal pure returns (Head memory head) {
        head.state = uint8(meta);
        head.revision = uint32(meta >> 8);
        head.admissionOrdinal = uint64((meta >> 40) & ((uint256(1) << 48) - 1));
        head.targetKind = uint8(meta >> 88);
        head.tombstoneCause = uint8(meta >> 96);
        head.targetLeaf = uint16(meta >> 104);
        head.targetA = target;
    }

    function validateHead(Head memory head) private pure {
        if (head.state == 0) {
            if (
                head.revision != 0 || head.admissionOrdinal != 0 || head.targetKind != 0 || head.tombstoneCause != 0
                    || head.targetA != bytes32(0) || head.targetLeaf != 0
            ) revert InvalidHead();
            return;
        }
        if (
            head.revision == 0 || head.revision >= type(uint32).max || head.admissionOrdinal == 0
                || head.admissionOrdinal >= ORDINAL_GUARD
        ) revert InvalidHead();
        if (head.state == 1) {
            if (
                (head.targetKind != 1 && head.targetKind != 2) || head.tombstoneCause != 0 || head.targetA == bytes32(0)
                    || (head.targetKind == 1 && head.targetLeaf != 0)
            ) revert InvalidHead();
        } else if (head.state == 2) {
            if (
                head.targetKind != 0 || (head.tombstoneCause != 1 && head.tombstoneCause != 2)
                    || head.targetA != bytes32(0) || head.targetLeaf != 0
            ) revert InvalidHead();
        } else {
            revert InvalidHead();
        }
    }

    function ordinal(bytes32 key, uint64 previous, uint64 proposed) private pure {
        if (proposed == 0 || proposed >= ORDINAL_GUARD || proposed <= previous) {
            revert InvalidOrdinal(key, previous, proposed);
        }
    }

    function present(bytes memory option) private pure returns (bool) {
        return option[0] == 0x01;
    }

    function word(bytes memory value, uint256 offset) private pure returns (bytes32 out) {
        assembly { out := mload(add(add(value, 32), offset)) }
    }

    function short(bytes memory value, uint256 offset) private pure returns (uint16) {
        return (uint16(uint8(value[offset])) << 8) | uint16(uint8(value[offset + 1]));
    }
}
