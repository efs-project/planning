// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateStore} from "./StateStore.sol";
import {StateKernel} from "./StateKernel.sol";
import {StorageByteView} from "./StorageByteView.sol";

library StatePointReads {
    uint256 private constant ORDINAL_MAX = (uint256(1) << 48) - 1;
    uint256 private constant CACHE_MAX = 131072;

    function getTypeSchema(StateStore.Store storage s, bytes32 typeId)
        internal
        view
        returns (
            bytes memory canonicalBody,
            uint48 typeOrd,
            uint64 admitOrdinal,
            uint8 refRoleCount,
            uint8 indexSpecCount
        )
    {
        _requireInitialized(s, typeId);
        StateStore.TypeRow storage row = s.types[typeId];
        if (row.typeOrdinal == 0) {
            if (
                row.groupRecordId != 0 || row.memberIndex != 0 || row.admittedAtOrdinal != 0
                    || row.cacheBytes.length != 0
            ) {
                revert StorageByteView.ErrReadState(typeId);
            }
            return (new bytes(0), 0, 0, 0, 0);
        }
        _validOrdinal(row.typeOrdinal, s.count.types, typeId);
        if (typeId == s.init.metaTypeId) {
            if (row.typeOrdinal != 1 || row.admittedAtOrdinal != 0 || row.groupRecordId != 0 || row.memberIndex != 0) {
                revert StorageByteView.ErrReadState(typeId);
            }
            canonicalBody = _intrinsicBlob(s, typeId);
        } else {
            (uint256 start, uint256 length) = _ordinaryMemberRange(s, row, typeId);
            canonicalBody = StorageByteView.slice(s.records[row.groupRecordId].body, start, length, typeId);
        }
        (refRoleCount, indexSpecCount) = _cacheCounts(row.cacheBytes, typeId, canonicalBody);
        // The ordinal was checked against the u48 exhaustion boundary before narrowing.
        // forge-lint: disable-next-line(unsafe-typecast)
        typeOrd = uint48(row.typeOrdinal);
        return (canonicalBody, typeOrd, row.admittedAtOrdinal, refRoleCount, indexSpecCount);
    }

    function getTypeOrigin(StateStore.Store storage s, bytes32 typeId)
        internal
        view
        returns (bytes32 groupRecordId, uint16 memberIndex, bool intrinsic)
    {
        _requireInitialized(s, typeId);
        StateStore.TypeRow storage row = s.types[typeId];
        if (row.typeOrdinal == 0) {
            if (row.groupRecordId != 0 || row.memberIndex != 0 || row.admittedAtOrdinal != 0) {
                revert StorageByteView.ErrReadState(typeId);
            }
            return (0, 0, false);
        }
        _validOrdinal(row.typeOrdinal, s.count.types, typeId);
        if (typeId == s.init.metaTypeId) {
            if (row.typeOrdinal != 1 || row.admittedAtOrdinal != 0 || row.groupRecordId != 0 || row.memberIndex != 0) {
                revert StorageByteView.ErrReadState(typeId);
            }
            return (0, 0, true);
        }
        _ordinaryMemberRange(s, row, typeId);
        return (row.groupRecordId, row.memberIndex, false);
    }

    function intrinsicTypeGroupBytes(StateStore.Store storage s) internal view returns (bytes memory) {
        _requireInitialized(s, s.init.metaTypeId);
        bytes32 subject = s.init.metaTypeId;
        StateStore.TypeRow storage row = s.types[subject];
        _validOrdinal(row.typeOrdinal, s.count.types, subject);
        if (row.typeOrdinal != 1 || row.admittedAtOrdinal != 0 || row.groupRecordId != 0 || row.memberIndex != 0) {
            revert StorageByteView.ErrReadState(subject);
        }
        bytes storage raw = s.init.intrinsicGroupBytes;
        uint256 n = raw.length;
        if (n > 8190 || n < 4 || _u16(raw, 0, subject) != 1) revert StorageByteView.ErrReadState(subject);
        uint256 memberLength = _u16(raw, 2, subject);
        if (memberLength == 0 || memberLength != n - 4) revert StorageByteView.ErrReadState(subject);
        return StorageByteView.slice(raw, 0, n, subject);
    }

    function getRecord(StateStore.Store storage s, bytes32 recordId)
        internal
        view
        returns (bytes32 typeSchemaId, bytes memory canonicalBody, uint64 firstAdmitOrdinal)
    {
        _requireInitialized(s, recordId);
        StateStore.RecordRow storage row = s.records[recordId];
        if (row.recordOrdinal == 0) {
            if (row.typeId != 0 || row.firstAdmissionOrdinal != 0 || row.body.length != 0) {
                revert StorageByteView.ErrReadState(recordId);
            }
            return (0, new bytes(0), 0);
        }
        _validOrdinal(row.recordOrdinal, s.count.records, recordId);
        _validAdmission(row.firstAdmissionOrdinal, s.count.admissions, recordId);
        StateStore.TypeRow storage typeRow = s.types[row.typeId];
        if (typeRow.typeOrdinal == 0) revert StorageByteView.ErrReadState(recordId);
        _validOrdinal(typeRow.typeOrdinal, s.count.types, recordId);
        uint256 n = row.body.length;
        if (n > 8192) revert StorageByteView.ErrReadState(recordId);
        return (row.typeId, StorageByteView.slice(row.body, 0, n, recordId), row.firstAdmissionOrdinal);
    }

    function getEnvelope(StateStore.Store storage s, bytes32 envelopeId)
        internal
        view
        returns (
            bytes memory canonicalUnsignedEnvelope,
            uint48 envelopeOrdinal,
            uint16 leafCount,
            bytes32 principalId,
            uint64 authEpoch
        )
    {
        _requireInitialized(s, envelopeId);
        StateStore.EnvelopeRow storage row = s.envelopes[envelopeId];
        uint256 n = row.canonicalUnsignedEnvelope.length;
        if (row.envelopeOrdinal == 0) {
            if (n != 0) revert StorageByteView.ErrReadState(envelopeId);
            return (new bytes(0), 0, 0, 0, 0);
        }
        _validOrdinal(row.envelopeOrdinal, s.count.envelopes, envelopeId);
        bytes storage raw = row.canonicalUnsignedEnvelope;
        if (n < 288 || n > 2304) revert StorageByteView.ErrReadState(envelopeId);
        uint256 profile = StorageByteView.word(raw, 0, envelopeId);
        principalId = bytes32(StorageByteView.word(raw, 32, envelopeId));
        uint256 authorityRef = StorageByteView.word(raw, 64, envelopeId);
        uint256 epoch = StorageByteView.word(raw, 96, envelopeId);
        uint256 notAfter = StorageByteView.word(raw, 160, envelopeId);
        uint256 arrayOffset = StorageByteView.word(raw, 192, envelopeId);
        uint256 count = StorageByteView.word(raw, 224, envelopeId);
        if (
            profile != 1 || authorityRef != 0 || epoch != 0 || notAfter > type(uint64).max || arrayOffset != 224
                || count == 0 || count > 64 || n != 256 + 32 * count
        ) revert StorageByteView.ErrReadState(envelopeId);
        canonicalUnsignedEnvelope = StorageByteView.slice(raw, 0, n, envelopeId);
        // Values are bounded before both narrowings.
        // forge-lint: disable-next-line(unsafe-typecast)
        envelopeOrdinal = uint48(row.envelopeOrdinal);
        // forge-lint: disable-next-line(unsafe-typecast)
        leafCount = uint16(count);
        // forge-lint: disable-next-line(unsafe-typecast)
        authEpoch = uint64(epoch);
    }

    function _requireInitialized(StateStore.Store storage s, bytes32 subject) private view {
        bytes32 metaTypeId = s.init.metaTypeId;
        StateStore.TypeRow storage meta = s.types[metaTypeId];
        if (s.init.realmId == 0 || metaTypeId == 0 || meta.typeOrdinal == 0) {
            revert StateKernel.InvalidInitialization();
        }
        if (
            meta.typeOrdinal != 1 || meta.admittedAtOrdinal != 0 || meta.groupRecordId != 0 || meta.memberIndex != 0
                || s.count.types == 0 || s.count.types >= ORDINAL_MAX
        ) revert StorageByteView.ErrReadState(subject);
    }

    function _validOrdinal(uint64 ordinal, uint64 retained, bytes32 subject) private pure {
        if (ordinal == 0 || ordinal >= ORDINAL_MAX || retained >= ORDINAL_MAX || ordinal > retained) {
            revert StorageByteView.ErrReadState(subject);
        }
    }

    function _validAdmission(uint64 ordinal, uint64 current, bytes32 subject) private pure {
        if (ordinal == 0 || ordinal >= ORDINAL_MAX || current >= ORDINAL_MAX || ordinal > current) {
            revert StorageByteView.ErrReadState(subject);
        }
    }

    function _intrinsicBlob(StateStore.Store storage s, bytes32 subject) private view returns (bytes memory) {
        bytes storage raw = s.init.intrinsicGroupBytes;
        uint256 n = raw.length;
        if (n > 8190 || n < 4 || _u16(raw, 0, subject) != 1) revert StorageByteView.ErrReadState(subject);
        uint256 memberLength = _u16(raw, 2, subject);
        if (memberLength == 0 || memberLength != n - 4) revert StorageByteView.ErrReadState(subject);
        return StorageByteView.slice(raw, 4, memberLength, subject);
    }

    function _ordinaryMemberRange(StateStore.Store storage s, StateStore.TypeRow storage row, bytes32 subject)
        private
        view
        returns (uint256 selectedStart, uint256 selectedLength)
    {
        if (row.typeOrdinal < 2 || row.memberIndex >= 16 || row.groupRecordId == 0) {
            revert StorageByteView.ErrReadState(subject);
        }
        _validAdmission(row.admittedAtOrdinal, s.count.admissions, subject);
        StateStore.RecordRow storage groupRecord = s.records[row.groupRecordId];
        _validOrdinal(groupRecord.recordOrdinal, s.count.records, subject);
        if (groupRecord.typeId != s.init.metaTypeId || groupRecord.firstAdmissionOrdinal != row.admittedAtOrdinal) {
            revert StorageByteView.ErrReadState(subject);
        }
        bytes storage body = groupRecord.body;
        uint256 n = body.length;
        if (n < 4 || n > 8192 || _u16(body, 0, subject) != n - 2) {
            revert StorageByteView.ErrReadState(subject);
        }
        uint256 memberCount = _u16(body, 2, subject);
        if (memberCount == 0 || memberCount > 16 || row.memberIndex >= memberCount) {
            revert StorageByteView.ErrReadState(subject);
        }
        uint256 pos = 4;
        for (uint256 i; i < memberCount; ++i) {
            if (pos > n || 2 > n - pos) revert StorageByteView.ErrReadState(subject);
            uint256 memberLength = _u16(body, pos, subject);
            pos += 2;
            if (memberLength == 0 || memberLength > n - pos) revert StorageByteView.ErrReadState(subject);
            if (i == row.memberIndex) {
                selectedStart = pos;
                selectedLength = memberLength;
            }
            pos += memberLength;
        }
        if (pos != n) revert StorageByteView.ErrReadState(subject);
    }

    function _cacheCounts(bytes storage cache, bytes32 typeId, bytes memory blob)
        private
        view
        returns (uint8 roles, uint8 indexes)
    {
        uint256 n = cache.length;
        if (n > CACHE_MAX || n < 320) revert StorageByteView.ErrReadState(typeId);
        if (
            StorageByteView.word(cache, 0, typeId) != 32 || bytes32(StorageByteView.word(cache, 32, typeId)) != typeId
                || bytes32(StorageByteView.word(cache, 64, typeId)) != keccak256(blob)
                || StorageByteView.word(cache, 96, typeId) > 8192
        ) revert StorageByteView.ErrReadState(typeId);

        uint256 fieldsOffset = StorageByteView.word(cache, 128, typeId);
        uint256 rolesOffset = StorageByteView.word(cache, 160, typeId);
        uint256 indexesOffset = StorageByteView.word(cache, 192, typeId);
        uint256 constraintsOffset = StorageByteView.word(cache, 224, typeId);
        if (fieldsOffset != 224) revert StorageByteView.ErrReadState(typeId);
        uint256 fieldsPos = _relativePosition(n, fieldsOffset, typeId);
        uint256 rolesPos = _relativePosition(n, rolesOffset, typeId);
        uint256 indexesPos = _relativePosition(n, indexesOffset, typeId);
        uint256 constraintsPos = _relativePosition(n, constraintsOffset, typeId);

        uint256 fields = StorageByteView.word(cache, fieldsPos, typeId);
        uint256 roleCount = StorageByteView.word(cache, rolesPos, typeId);
        uint256 indexCount = StorageByteView.word(cache, indexesPos, typeId);
        uint256 constraintCount = StorageByteView.word(cache, constraintsPos, typeId);
        if (fields == 0 || fields > 64 || roleCount > 16 || indexCount > 8 || constraintCount > 32) {
            revert StorageByteView.ErrReadState(typeId);
        }
        if (fieldsPos > rolesPos || 32 + 32 * fields > rolesPos - fieldsPos) {
            revert StorageByteView.ErrReadState(typeId);
        }
        if (
            indexesPos != rolesPos + 32 + 96 * roleCount || constraintsPos != indexesPos + 32 + 64 * indexCount
                || constraintsPos > n || 32 + 128 * constraintCount != n - constraintsPos
        ) revert StorageByteView.ErrReadState(typeId);

        // Counts are bounded above before narrowing.
        // forge-lint: disable-next-line(unsafe-typecast)
        roles = uint8(roleCount);
        // forge-lint: disable-next-line(unsafe-typecast)
        indexes = uint8(indexCount);
    }

    function _relativePosition(uint256 n, uint256 relative, bytes32 subject) private pure returns (uint256) {
        if (relative & 31 != 0 || relative < 224 || n < 64 || relative > n - 64) {
            revert StorageByteView.ErrReadState(subject);
        }
        return 32 + relative;
    }

    function _u16(bytes storage value, uint256 offset, bytes32 subject) private view returns (uint16 result) {
        uint256 n = value.length;
        if (offset > n || 2 > n - offset) revert StorageByteView.ErrReadState(subject);
        result = (uint16(_byteAt(value, offset)) << 8) | uint16(_byteAt(value, offset + 1));
    }

    function _byteAt(bytes storage value, uint256 offset) private view returns (uint8 result) {
        uint256 data;
        if (value.length < 32) {
            assembly ("memory-safe") {
                data := sload(value.slot)
            }
        } else {
            uint256 base;
            assembly ("memory-safe") {
                mstore(0, value.slot)
                base := keccak256(0, 32)
                data := sload(add(base, div(offset, 32)))
            }
        }
        // The source range was checked by _u16 before this narrowing.
        // forge-lint: disable-next-line(unsafe-typecast)
        result = uint8(data >> ((31 - (offset & 31)) * 8));
    }
}
