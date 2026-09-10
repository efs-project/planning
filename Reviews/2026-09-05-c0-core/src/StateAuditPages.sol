// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {AuditPageCursor} from "./AuditPageCursor.sol";
import {StateReadPrimitives} from "./StateReadPrimitives.sol";
import {StatePointReads} from "./StatePointReads.sol";
import {IndexKeys} from "./IndexKeys.sol";
import {StorageByteView} from "./StorageByteView.sol";
import {StateStore} from "./StateStore.sol";

/// @notice Checked audit inventory over the sole admission writer's indexes.
/// Raw pages check inspected physical metadata/order, not body/query membership.
/// Neither raw nor hydrated anchors claim a resolved current Files value.
library StateAuditPages {
    enum Completeness {
        UNKNOWN,
        COMPLETE,
        PARTIAL,
        UNSUPPORTED
    }

    struct PageRequest {
        uint256 cursor;
        uint16 maxItems;
        uint64 basisOrdinal;
    }

    struct PageResult {
        bytes32 realmBasis;
        uint64 highWaterOrdinal;
        uint256 cursor;
        bytes32[] items;
        uint32 coverage;
        Completeness completeness;
    }

    struct HydratedItem {
        uint64 ordinal;
        bytes32 envelopeId;
        uint16 leafIndex;
        bytes32 recordId;
        bytes32 principalId;
        uint8 occurrenceStatus;
        uint64 revokedAtOrdinal;
    }
    error ErrIndexQueryUnsupported(bytes32 typeSchemaId, uint8 indexKind, uint8 indexOrdinal, bytes32 valueKey);
    uint256 private constant CURSOR_END = type(uint256).max;
    uint32 private constant SCAN_MAX = 1024;

    function supported(bytes32 T, uint8 kind, uint8 ordinal) private pure returns (bool) {
        return T == 0 && ordinal == 0 && (kind == 8 || kind == 10);
    }

    function pagePostings(
        StateStore.Store storage s,
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        PageRequest memory req
    ) internal view returns (PageResult memory result) {
        (result,) = page(s, T, kind, indexOrdinal, valueKey, req, false, false, 0);
    }

    function pagePostingsHydrated(
        StateStore.Store storage s,
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        PageRequest memory req
    ) internal view returns (PageResult memory, HydratedItem[] memory) {
        return page(s, T, kind, indexOrdinal, valueKey, req, true, false, 0);
    }

    function pagePostingsAtReadBasis(
        StateStore.Store storage s,
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        PageRequest memory req,
        bytes32 readBasis
    ) internal view returns (PageResult memory result) {
        (result,) = page(s, T, kind, indexOrdinal, valueKey, req, false, true, readBasis);
    }

    function pagePostingsHydratedAtReadBasis(
        StateStore.Store storage s,
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        PageRequest memory req,
        bytes32 readBasis
    ) internal view returns (PageResult memory, HydratedItem[] memory) {
        return page(s, T, kind, indexOrdinal, valueKey, req, true, true, readBasis);
    }

    function counts(StateStore.Store storage s, bytes32 T, uint8 kind, uint8 indexOrdinal, bytes32 valueKey)
        internal
        view
        returns (uint64, uint64, uint64, bytes32, uint64)
    {
        bytes32 key = IndexKeys.posting(T, kind, indexOrdinal, valueKey);
        (bytes32 revision,, uint64 H) = StateReadPrimitives.basis(s, 0, key);
        if (!supported(T, kind, indexOrdinal)) revert ErrIndexQueryUnsupported(T, kind, indexOrdinal, valueKey);
        uint64 bound = kind == 10 ? StateReadPrimitives.scopeBound(s, H, key) : H;
        StateReadPrimitives.PostingHead memory head = StateReadPrimitives.postingHead(s, key, true, bound, key);
        return (head.count, head.live, head.last, revision, H);
    }

    function page(
        StateStore.Store storage s,
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        PageRequest memory req,
        bool hydrated,
        bool explicitBasis,
        bytes32 readBasis
    ) private view returns (PageResult memory result, HydratedItem[] memory rows) {
        bytes32 key = IndexKeys.posting(T, kind, indexOrdinal, valueKey);
        uint64 currentH;
        (result.realmBasis,, currentH) = StateReadPrimitives.basis(s, 0, key);
        if (explicitBasis) {
            if (readBasis == 0) revert StorageByteView.ErrReadState(key);
            result.realmBasis = readBasis;
        }
        if (req.cursor == 0) {
            (, result.highWaterOrdinal,) = StateReadPrimitives.basis(s, req.basisOrdinal, key);
        } else {
            if (req.basisOrdinal == 0 || req.basisOrdinal > currentH || req.basisOrdinal >= AuditPageCursor.GUARD) {
                revert AuditPageCursor.ErrPageCursor(req.cursor);
            }
            result.highWaterOrdinal = req.basisOrdinal;
        }
        result.items = new bytes32[](0);
        rows = new HydratedItem[](0);
        if (!supported(T, kind, indexOrdinal)) {
            result.completeness = Completeness.UNSUPPORTED;
            return (result, rows);
        }
        bool k10 = kind == 10 && s.scopeLayout == 1;
        uint64 bound = kind == 10 ? StateReadPrimitives.scopeBound(s, currentH, key) : currentH;
        StateReadPrimitives.PostingHead memory head = StateReadPrimitives.postingHead(s, key, true, bound, key);
        uint64 end = prefixEnd(s, key, head, result.highWaterOrdinal, currentH, k10);
        uint256 tag = AuditPageCursor.context(
            s.init.realmId,
            result.realmBasis,
            s.scopeLayout == 1 ? (hydrated ? 4 : 3) : (hydrated ? 2 : 1),
            T,
            kind,
            indexOrdinal,
            valueKey
        );
        uint64 next = req.cursor == 0 ? 0 : AuditPageCursor.decode(req.cursor, end, result.highWaterOrdinal, tag);
        uint64 previous = next == 0 ? 0 : StateReadPrimitives.postingAt(s, key, head, next - 1, key);
        uint64 previousAdmission = previous == 0 ? 0 : admissionTime(s, key, previous, currentH, k10);
        if (previousAdmission > result.highWaterOrdinal) revert StorageByteView.ErrReadState(key);
        uint256 limit = req.maxItems == 0 ? 1 : req.maxItems;
        uint256 maximum = hydrated ? 256 : 512;
        if (limit > maximum) limit = maximum;
        result.items = new bytes32[](limit);
        if (hydrated) rows = new HydratedItem[](limit);
        uint256 n;
        while (next < end && n < limit && result.coverage < SCAN_MAX) {
            uint64 ordinal = StateReadPrimitives.postingAt(s, key, head, next, key);
            uint64 admission = admissionTime(s, key, ordinal, currentH, k10);
            if (ordinal <= previous || admission <= previousAdmission || admission > result.highWaterOrdinal) {
                revert StorageByteView.ErrReadState(key);
            }
            result.items[n] = bytes32(uint256(ordinal));
            if (hydrated) {
                StatePointReads.HydratedOccurrence memory occurrence = StatePointReads.hydrateOrdinal(s, admission, key);
                bool withdrawn = occurrence.status == 2 && occurrence.revokedAtOrdinal <= result.highWaterOrdinal;
                rows[n] = HydratedItem(
                    admission,
                    occurrence.envelopeId,
                    occurrence.leafIndex,
                    occurrence.recordId,
                    occurrence.principalId,
                    withdrawn ? 2 : 1,
                    withdrawn ? occurrence.revokedAtOrdinal : 0
                );
            }
            previous = ordinal;
            previousAdmission = admission;
            ++next;
            ++n;
            ++result.coverage;
        }
        bytes32[] memory items = result.items;
        assembly ("memory-safe") { mstore(items, n) }
        if (hydrated) assembly ("memory-safe") { mstore(rows, n) }
        result.completeness = next == end ? Completeness.COMPLETE : Completeness.PARTIAL;
        result.cursor = next == end ? CURSOR_END : AuditPageCursor.encode(next, end, result.highWaterOrdinal, tag);
    }

    // At most 48 bisection probes plus two physical boundary probes. These
    // inspections are not consumed coverage. The sole writer supplies membership.
    function prefixEnd(
        StateStore.Store storage s,
        bytes32 key,
        StateReadPrimitives.PostingHead memory head,
        uint64 H,
        uint64 currentH,
        bool k10
    ) private view returns (uint64 end) {
        if (head.count == 0) return 0;
        if (admissionTime(s, key, head.last, currentH, k10) <= H) return head.count;
        uint64 lo;
        uint64 hi = head.count;
        while (lo < hi) {
            uint64 mid = lo + (hi - lo) / 2;
            uint64 ordinal = StateReadPrimitives.postingAt(s, key, head, mid, key);
            if (admissionTime(s, key, ordinal, currentH, k10) <= H) lo = mid + 1;
            else hi = mid;
        }
        end = lo;
        if (
            end > 0
                && admissionTime(s, key, StateReadPrimitives.postingAt(s, key, head, end - 1, key), currentH, k10) > H
        ) {
            revert StorageByteView.ErrReadState(key);
        }
        if (
            end < head.count
                && admissionTime(s, key, StateReadPrimitives.postingAt(s, key, head, end, key), currentH, k10) <= H
        ) {
            revert StorageByteView.ErrReadState(key);
        }
    }

    function admissionTime(StateStore.Store storage s, bytes32 key, uint64 physical, uint64 currentH, bool k10)
        private
        view
        returns (uint64)
    {
        return k10 ? StateReadPrimitives.firstBindingAdmission(s, physical, currentH, key) : physical;
    }
}
