// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateStore} from "./StateStore.sol";
import {StateKernel} from "./StateKernel.sol";
import {Preparation} from "./Preparation.sol";
import {StorageByteView} from "./StorageByteView.sol";

library StatePointReads {
    uint256 private constant ORDINAL_MAX = (uint256(1) << 48) - 1;
    uint256 private constant CACHE_MAX = Preparation.CACHE_CODE_MAX;

    error ErrReadOrdinal(uint64 ordinal);

    struct IndexedReceiptView {
        bytes32 envelopeId;
        uint16 leafIndex;
        bytes32 realmId;
        bytes32 realmRevisionId;
        uint256 authorityBasis;
        bytes32 authorityCodehash;
        uint64 authEpoch;
        uint64 admissionOrdinal;
        uint48 admittedAtBlock;
        uint8 acceptedStatus;
        uint8 occurrenceStatus;
        uint64 revokedAtOrdinal;
    }

    struct EnvelopeMetadata {
        uint64 ordinal;
        uint16 leafCount;
        bytes32 principalId;
        uint64 authEpoch;
        uint256 byteLength;
    }

    struct HydratedOccurrence {
        bytes32 envelopeId;
        uint16 leafIndex;
        bytes32 recordId;
        bytes32 typeSchemaId;
        bytes32 principalId;
        uint8 status;
        uint64 ordinal;
        uint64 revokedAtOrdinal;
    }

    struct BatchMetadata {
        uint64 first;
        uint16 count;
        uint48 admittedAtBlock;
        uint256 authorityBasis;
        bytes32 authorityCodehash;
    }

    struct ProbeBudget {
        uint8 used;
    }

    function getOccurrence(StateStore.Store storage s, bytes32 envelopeId, uint16 leafIndex)
        internal
        view
        returns (
            uint8 status,
            uint64 ordinal,
            bytes32 recordId,
            bytes32 typeSchemaId,
            bytes32 principalId,
            uint64 revokedAtOrdinal
        )
    {
        _requireOccurrenceCounters(s, envelopeId);
        uint256 lifecycle = s.occurrences[StateKernel.occKey(envelopeId, leafIndex)].packed;
        if (lifecycle == 0) return (0, 0, 0, 0, 0, 0);
        (HydratedOccurrence memory occurrence,) = _hydrate(s, envelopeId, leafIndex, 0, lifecycle, envelopeId);
        return (
            occurrence.status,
            occurrence.ordinal,
            occurrence.recordId,
            occurrence.typeSchemaId,
            occurrence.principalId,
            occurrence.revokedAtOrdinal
        );
    }

    function getOccurrenceByOrdinal(StateStore.Store storage s, uint64 ordinal)
        internal
        view
        returns (
            bytes32 envelopeId,
            uint16 leafIndex,
            bytes32 recordId,
            bytes32 typeSchemaId,
            bytes32 principalId,
            uint8 status,
            uint64 revokedAtOrdinal
        )
    {
        bytes32 subject = bytes32(uint256(ordinal));
        uint64 currentH = requireState(s, subject);
        _requireRequestedOrdinal(ordinal, currentH);
        HydratedOccurrence memory occurrence = _hydrateOrdinalChecked(s, ordinal, subject);
        return (
            occurrence.envelopeId,
            occurrence.leafIndex,
            occurrence.recordId,
            occurrence.typeSchemaId,
            occurrence.principalId,
            occurrence.status,
            occurrence.revokedAtOrdinal
        );
    }

    function requireState(StateStore.Store storage s, bytes32 subject) internal view returns (uint64 currentH) {
        _requireOccurrenceCounters(s, subject);
        currentH = s.count.admissions;
    }

    function hydrateOrdinal(StateStore.Store storage s, uint64 ordinal, bytes32 subject)
        internal
        view
        returns (HydratedOccurrence memory)
    {
        uint64 currentH = requireState(s, subject);
        if (ordinal == 0 || ordinal >= ORDINAL_MAX || ordinal > currentH) {
            revert StorageByteView.ErrReadState(subject);
        }
        return _hydrateOrdinalChecked(s, ordinal, subject);
    }

    function _hydrateOrdinalChecked(StateStore.Store storage s, uint64 ordinal, bytes32 subject)
        private
        view
        returns (HydratedOccurrence memory occurrence)
    {
        StateStore.AdmissionRow storage admission = s.admissions[ordinal];
        uint256 packed = admission.packed;
        if (admission.envelopeId == 0 || packed >> 112 != 0) revert StorageByteView.ErrReadState(subject);
        // The remaining high bits were validated before selecting the low leaf field.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint16 leafIndex = uint16(packed);
        (occurrence,) = _hydrate(
            s,
            admission.envelopeId,
            leafIndex,
            ordinal,
            s.occurrences[StateKernel.occKey(admission.envelopeId, leafIndex)].packed,
            subject
        );
    }

    function getReceipt(StateStore.Store storage s, uint64 ordinal) internal view returns (IndexedReceiptView memory) {
        bytes32 subject = bytes32(uint256(ordinal));
        _requireOccurrenceCounters(s, subject);
        _requireRequestedOrdinal(ordinal, s.count.admissions);
        if (s.init.initialRevisionId == 0) revert StorageByteView.ErrReadState(subject);
        StateStore.AdmissionRow storage admission = s.admissions[ordinal];
        uint256 packed = admission.packed;
        if (admission.envelopeId == 0 || packed >> 112 != 0) revert StorageByteView.ErrReadState(subject);
        // The remaining high bits were validated before selecting the low leaf field.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint16 leafIndex = uint16(packed);
        (HydratedOccurrence memory occurrence, uint64 authEpoch) = _hydrate(
            s,
            admission.envelopeId,
            leafIndex,
            ordinal,
            s.occurrences[StateKernel.occKey(admission.envelopeId, leafIndex)].packed,
            subject
        );
        BatchMetadata memory batch = _acceptingBatch(s, ordinal, subject);
        return IndexedReceiptView(
            occurrence.envelopeId,
            occurrence.leafIndex,
            s.init.realmId,
            s.init.initialRevisionId,
            batch.authorityBasis,
            batch.authorityCodehash,
            authEpoch,
            occurrence.ordinal,
            batch.admittedAtBlock,
            1,
            occurrence.status,
            occurrence.revokedAtOrdinal
        );
    }

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
        StateStore.TypeCell storage row = s.types[typeId];
        if (row.typeOrdinal == 0) {
            if (
                row.groupRecordId != 0 || row.memberIndex != 0 || row.admittedAtOrdinal != 0
                    || row.cacheCode != address(0)
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
            canonicalBody = StateStore.recordSlice(s, row.groupRecordId, start, length, typeId);
        }
        (refRoleCount, indexSpecCount) = _cacheCounts(row.cacheCode, typeId, canonicalBody);
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
        StateStore.TypeCell storage row = s.types[typeId];
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
        StateStore.TypeCell storage row = s.types[subject];
        _validOrdinal(row.typeOrdinal, s.count.types, subject);
        if (row.typeOrdinal != 1 || row.admittedAtOrdinal != 0 || row.groupRecordId != 0 || row.memberIndex != 0) {
            revert StorageByteView.ErrReadState(subject);
        }
        bytes storage raw = s.init.intrinsicGroupBytes;
        _intrinsicMemberLength(raw, subject);
        return StorageByteView.slice(raw, 0, raw.length, subject);
    }

    function getRecord(StateStore.Store storage s, bytes32 recordId)
        internal
        view
        returns (bytes32 typeSchemaId, bytes memory canonicalBody, uint64 firstAdmitOrdinal)
    {
        _requireInitialized(s, recordId);
        StateStore.RecordCell memory row = s.records[recordId];
        uint256 n = StateStore.recordLength(row, recordId);
        if (row.recordOrdinal == 0) {
            if (row.typeId != 0 || row.firstAdmissionOrdinal != 0 || row.byteRef != 0) {
                revert StorageByteView.ErrReadState(recordId);
            }
            return (0, new bytes(0), 0);
        }
        _validOrdinal(row.recordOrdinal, s.count.records, recordId);
        _validAdmission(row.firstAdmissionOrdinal, s.count.admissions, recordId);
        StateStore.TypeCell storage typeRow = s.types[row.typeId];
        if (typeRow.typeOrdinal == 0) revert StorageByteView.ErrReadState(recordId);
        _validOrdinal(typeRow.typeOrdinal, s.count.types, recordId);
        return (row.typeId, StateStore.recordSlice(s, recordId, 0, n, recordId), row.firstAdmissionOrdinal);
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
        EnvelopeMetadata memory metadata = _envelopeMetadata(s, envelopeId);
        if (metadata.ordinal == 0) {
            return (new bytes(0), 0, 0, 0, 0);
        }
        canonicalUnsignedEnvelope = StateStore.envelopeSlice(s, envelopeId, 0, metadata.byteLength, envelopeId);
        // Values are bounded before both narrowings.
        // forge-lint: disable-next-line(unsafe-typecast)
        envelopeOrdinal = uint48(metadata.ordinal);
        leafCount = metadata.leafCount;
        principalId = metadata.principalId;
        authEpoch = metadata.authEpoch;
    }

    function _hydrate(
        StateStore.Store storage s,
        bytes32 envelopeId,
        uint16 leafIndex,
        uint64 expectedOrdinal,
        uint256 lifecycle,
        bytes32 subject
    ) private view returns (HydratedOccurrence memory occurrence, uint64 authEpoch) {
        if (lifecycle == 0) revert StorageByteView.ErrReadState(subject);
        // Lifecycle status occupies the validated low byte.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint8 status = uint8(lifecycle);
        // Both values are masked to their declared u48 packed ranges before narrowing.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 ordinal = uint64((lifecycle >> 8) & ORDINAL_MAX);
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 revokedAtOrdinal = uint64((lifecycle >> 56) & ORDINAL_MAX);
        if (
            lifecycle >> 104 != 0 || ordinal == 0 || ordinal >= ORDINAL_MAX || ordinal > s.count.admissions
                || (expectedOrdinal != 0 && ordinal != expectedOrdinal) || (status == 1 && revokedAtOrdinal != 0)
                || (status == 2
                    && (revokedAtOrdinal <= ordinal
                        || revokedAtOrdinal > s.count.admissions
                        || revokedAtOrdinal >= ORDINAL_MAX)) || (status != 1 && status != 2)
        ) revert StorageByteView.ErrReadState(subject);

        StateStore.AdmissionRow storage admission = s.admissions[ordinal];
        uint256 packed = admission.packed;
        if (admission.envelopeId == 0 || admission.envelopeId != envelopeId || packed >> 112 != 0) {
            revert StorageByteView.ErrReadState(subject);
        }
        // All three values are masked to their packed widths before narrowing.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint16 loggedLeaf = uint16(packed);
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 typeOrdinal = uint64((packed >> 16) & ORDINAL_MAX);
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 principalOrdinal = uint64((packed >> 64) & ORDINAL_MAX);
        if (loggedLeaf != leafIndex) revert StorageByteView.ErrReadState(subject);
        _validOrdinal(typeOrdinal, s.count.types, subject);
        _validOrdinal(principalOrdinal, s.count.principals, subject);

        EnvelopeMetadata memory envelope = _envelopeMetadataChecked(s, envelopeId, subject);
        if (leafIndex >= envelope.leafCount || s.envelopeIds[envelope.ordinal] != envelopeId) {
            revert StorageByteView.ErrReadState(subject);
        }
        bytes32 recordId = bytes32(StateStore.envelopeWord(s, envelopeId, 256 + 32 * leafIndex, subject));
        StateStore.RecordCell storage record = s.records[recordId];
        _validOrdinal(record.recordOrdinal, s.count.records, subject);
        _validAdmissionAt(record.firstAdmissionOrdinal, ordinal, s.count.admissions, subject);
        if (record.typeId == 0 || s.recordIds[record.recordOrdinal] != recordId) {
            revert StorageByteView.ErrReadState(subject);
        }

        bytes32 typeSchemaId = s.typeIds[typeOrdinal];
        StateStore.TypeCell storage typeRow = s.types[typeSchemaId];
        if (typeSchemaId == 0 || record.typeId != typeSchemaId || typeRow.typeOrdinal != typeOrdinal) {
            revert StorageByteView.ErrReadState(subject);
        }
        _validOrdinal(typeRow.typeOrdinal, s.count.types, subject);
        if (typeSchemaId == s.init.metaTypeId) {
            if (
                typeRow.typeOrdinal != 1 || typeRow.admittedAtOrdinal != 0 || typeRow.groupRecordId != 0
                    || typeRow.memberIndex != 0
            ) revert StorageByteView.ErrReadState(subject);
        } else {
            _validAdmissionAt(typeRow.admittedAtOrdinal, ordinal, s.count.admissions, subject);
        }

        bytes32 principalId = s.principalIds[principalOrdinal];
        StateStore.PrincipalRow storage principal = s.principals[principalId];
        if (principalId == 0 || principalId != envelope.principalId || principal.principalOrdinal != principalOrdinal) {
            revert StorageByteView.ErrReadState(subject);
        }
        _validOrdinal(principal.principalOrdinal, s.count.principals, subject);
        _validAdmissionAt(principal.firstAdmissionOrdinal, ordinal, s.count.admissions, subject);

        occurrence = HydratedOccurrence(
            envelopeId, leafIndex, recordId, typeSchemaId, principalId, status, ordinal, revokedAtOrdinal
        );
        authEpoch = envelope.authEpoch;
    }

    function _acceptingBatch(StateStore.Store storage s, uint64 ordinal, bytes32 subject)
        private
        view
        returns (BatchMetadata memory candidate)
    {
        uint64 highWater = s.count.admissions;
        uint64 batchCount = s.count.batches;
        if (batchCount == 0 || batchCount >= ORDINAL_MAX || batchCount > highWater) {
            revert StorageByteView.ErrReadState(subject);
        }
        ProbeBudget memory budget;
        uint64 lo = 1;
        uint64 hi = batchCount;
        uint64 cachedId;
        BatchMetadata memory cached;
        while (lo < hi) {
            uint64 mid = lo + (hi - lo + 1) / 2;
            cached = _batchProbe(s, mid, highWater, subject, budget);
            cachedId = mid;
            if (cached.first <= ordinal) lo = mid;
            else hi = mid - 1;
        }
        if (cachedId == lo) candidate = cached;
        else candidate = _batchProbe(s, lo, highWater, subject, budget);
        uint256 candidateEnd = uint256(candidate.first) + candidate.count;
        if (candidate.first > ordinal || ordinal >= candidateEnd) revert StorageByteView.ErrReadState(subject);

        BatchMetadata memory previous;
        if (lo > 1) {
            if (cachedId == lo - 1) previous = cached;
            else previous = _batchProbe(s, lo - 1, highWater, subject, budget);
            if (uint256(previous.first) + previous.count != candidate.first) {
                revert StorageByteView.ErrReadState(subject);
            }
        }
        BatchMetadata memory nextBatch;
        if (lo < batchCount) {
            if (cachedId == lo + 1) nextBatch = cached;
            else nextBatch = _batchProbe(s, lo + 1, highWater, subject, budget);
            if (candidateEnd != nextBatch.first) revert StorageByteView.ErrReadState(subject);
        }

        BatchMetadata memory firstBatch;
        if (lo == 1) firstBatch = candidate;
        else if (lo == 2) firstBatch = previous;
        else if (cachedId == 1) firstBatch = cached;
        else firstBatch = _batchProbe(s, 1, highWater, subject, budget);
        if (firstBatch.first != 1) revert StorageByteView.ErrReadState(subject);

        BatchMetadata memory lastBatch;
        if (lo == batchCount) lastBatch = candidate;
        else if (lo + 1 == batchCount) lastBatch = nextBatch;
        else if (cachedId == batchCount) lastBatch = cached;
        else lastBatch = _batchProbe(s, batchCount, highWater, subject, budget);
        if (uint256(lastBatch.first) + lastBatch.count != uint256(highWater) + 1) {
            revert StorageByteView.ErrReadState(subject);
        }
    }

    function _batchProbe(
        StateStore.Store storage s,
        uint64 batchId,
        uint64 highWater,
        bytes32 subject,
        ProbeBudget memory budget
    ) private view returns (BatchMetadata memory result) {
        if (++budget.used > 64) revert StorageByteView.ErrReadState(subject);
        StateStore.BatchRow storage row = s.batches[batchId];
        uint256 meta = row.meta;
        // All fields are masked to their packed widths before narrowing.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 first = uint64(meta & ORDINAL_MAX);
        // forge-lint: disable-next-line(unsafe-typecast)
        uint16 count = uint16((meta >> 48) & type(uint16).max);
        // forge-lint: disable-next-line(unsafe-typecast)
        uint48 admittedAtBlock = uint48((meta >> 64) & ORDINAL_MAX);
        // forge-lint: disable-next-line(unsafe-typecast)
        uint32 revision = uint32((meta >> 112) & type(uint32).max);
        if (
            meta >> 144 != 0 || first == 0 || first >= ORDINAL_MAX || count == 0 || count > 64 || revision != 1
                || uint256(first) + count > uint256(highWater) + 1
        ) revert StorageByteView.ErrReadState(subject);
        result = BatchMetadata(first, count, admittedAtBlock, row.authorityBasis, row.authorityCodehash);
    }

    function _envelopeMetadata(StateStore.Store storage s, bytes32 envelopeId)
        private
        view
        returns (EnvelopeMetadata memory)
    {
        _requireInitialized(s, envelopeId);
        return _envelopeMetadataChecked(s, envelopeId, envelopeId);
    }

    function _envelopeMetadataChecked(StateStore.Store storage s, bytes32 envelopeId, bytes32 subject)
        private
        view
        returns (EnvelopeMetadata memory metadata)
    {
        StateStore.EnvelopeCell memory row = s.envelopes[envelopeId];
        uint256 n = StateStore.envelopeLength(row, subject);
        if (row.envelopeOrdinal == 0) {
            if (n != 0) revert StorageByteView.ErrReadState(subject);
            return metadata;
        }
        _validOrdinal(row.envelopeOrdinal, s.count.envelopes, subject);
        if (n < 288 || n > 2304) revert StorageByteView.ErrReadState(subject);
        uint256 profile = StateStore.envelopeWord(s, envelopeId, 0, subject);
        bytes32 principalId = bytes32(StateStore.envelopeWord(s, envelopeId, 32, subject));
        uint256 authorityRef = StateStore.envelopeWord(s, envelopeId, 64, subject);
        uint256 epoch = StateStore.envelopeWord(s, envelopeId, 96, subject);
        uint256 notAfter = StateStore.envelopeWord(s, envelopeId, 160, subject);
        uint256 arrayOffset = StateStore.envelopeWord(s, envelopeId, 192, subject);
        uint256 count = StateStore.envelopeWord(s, envelopeId, 224, subject);
        if (
            profile != 1 || authorityRef != 0 || epoch != 0 || notAfter > type(uint64).max || arrayOffset != 224
                || count == 0 || count > 64 || n != 256 + 32 * count
        ) revert StorageByteView.ErrReadState(subject);
        // Count and epoch were bounded before narrowing.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint16 narrowedCount = uint16(count);
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 narrowedEpoch = uint64(epoch);
        metadata = EnvelopeMetadata(row.envelopeOrdinal, narrowedCount, principalId, narrowedEpoch, n);
    }

    function _requireOccurrenceCounters(StateStore.Store storage s, bytes32 subject) private view {
        _requireInitialized(s, subject);
        if (
            s.typeIds[1] != s.init.metaTypeId || s.count.records >= ORDINAL_MAX || s.count.envelopes >= ORDINAL_MAX
                || s.count.principals >= ORDINAL_MAX || s.count.admissions >= ORDINAL_MAX
        ) revert StorageByteView.ErrReadState(subject);
    }

    function _requireRequestedOrdinal(uint64 ordinal, uint64 highWater) private pure {
        if (ordinal == 0 || ordinal >= ORDINAL_MAX || ordinal > highWater) revert ErrReadOrdinal(ordinal);
    }

    function _validAdmissionAt(uint64 ordinal, uint64 at, uint64 current, bytes32 subject) private pure {
        if (ordinal == 0 || ordinal >= ORDINAL_MAX || current >= ORDINAL_MAX || ordinal > at || ordinal > current) {
            revert StorageByteView.ErrReadState(subject);
        }
    }

    function _requireInitialized(StateStore.Store storage s, bytes32 subject) private view {
        bytes32 metaTypeId = s.init.metaTypeId;
        StateStore.TypeCell storage meta = s.types[metaTypeId];
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
        uint256 memberLength = _intrinsicMemberLength(raw, subject);
        return StorageByteView.slice(raw, 4, memberLength, subject);
    }

    function _intrinsicMemberLength(bytes storage raw, bytes32 subject) private view returns (uint256 memberLength) {
        uint256 n = raw.length;
        if (n > 8190 || n < 4 || _u16(raw, 0, subject) != 1) revert StorageByteView.ErrReadState(subject);
        memberLength = _u16(raw, 2, subject);
        if (memberLength == 0 || memberLength != n - 4) revert StorageByteView.ErrReadState(subject);
    }

    function _ordinaryMemberRange(StateStore.Store storage s, StateStore.TypeCell storage row, bytes32 subject)
        private
        view
        returns (uint256 selectedStart, uint256 selectedLength)
    {
        if (row.typeOrdinal < 2 || row.memberIndex >= 16 || row.groupRecordId == 0) {
            revert StorageByteView.ErrReadState(subject);
        }
        _validAdmission(row.admittedAtOrdinal, s.count.admissions, subject);
        StateStore.RecordCell memory groupRecord = s.records[row.groupRecordId];
        _validOrdinal(groupRecord.recordOrdinal, s.count.records, subject);
        if (groupRecord.typeId != s.init.metaTypeId || groupRecord.firstAdmissionOrdinal != row.admittedAtOrdinal) {
            revert StorageByteView.ErrReadState(subject);
        }
        uint256 n = StateStore.recordLength(groupRecord, subject);
        if (n < 4 || n > 8192 || StateStore.recordShort(s, row.groupRecordId, 0, subject) != n - 2) {
            revert StorageByteView.ErrReadState(subject);
        }
        uint256 memberCount = StateStore.recordShort(s, row.groupRecordId, 2, subject);
        if (memberCount == 0 || memberCount > 16 || row.memberIndex >= memberCount) {
            revert StorageByteView.ErrReadState(subject);
        }
        uint256 pos = 4;
        for (uint256 i; i < memberCount; ++i) {
            if (pos > n || 2 > n - pos) revert StorageByteView.ErrReadState(subject);
            uint256 memberLength = StateStore.recordShort(s, row.groupRecordId, pos, subject);
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

    function _cacheCounts(address cache, bytes32 typeId, bytes memory blob)
        private
        view
        returns (uint8 roles, uint8 indexes)
    {
        uint256 n = cache == address(0) ? 0 : cache.code.length;
        if (n == 0) revert StorageByteView.ErrReadState(typeId);
        n -= 1;
        if (n > CACHE_MAX || n < 320) revert StorageByteView.ErrReadState(typeId);
        if (
            StorageByteView.codeWord(cache, 0, typeId) != 32
                || bytes32(StorageByteView.codeWord(cache, 32, typeId)) != typeId
                || bytes32(StorageByteView.codeWord(cache, 64, typeId)) != keccak256(blob)
                || StorageByteView.codeWord(cache, 96, typeId) > 8192
        ) revert StorageByteView.ErrReadState(typeId);

        uint256 fieldsOffset = StorageByteView.codeWord(cache, 128, typeId);
        uint256 rolesOffset = StorageByteView.codeWord(cache, 160, typeId);
        uint256 indexesOffset = StorageByteView.codeWord(cache, 192, typeId);
        uint256 constraintsOffset = StorageByteView.codeWord(cache, 224, typeId);
        if (fieldsOffset != 224) revert StorageByteView.ErrReadState(typeId);
        uint256 fieldsPos = _relativePosition(n, fieldsOffset, typeId);
        uint256 rolesPos = _relativePosition(n, rolesOffset, typeId);
        uint256 indexesPos = _relativePosition(n, indexesOffset, typeId);
        uint256 constraintsPos = _relativePosition(n, constraintsOffset, typeId);

        uint256 fields = StorageByteView.codeWord(cache, fieldsPos, typeId);
        uint256 roleCount = StorageByteView.codeWord(cache, rolesPos, typeId);
        uint256 indexCount = StorageByteView.codeWord(cache, indexesPos, typeId);
        uint256 constraintCount = StorageByteView.codeWord(cache, constraintsPos, typeId);
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
