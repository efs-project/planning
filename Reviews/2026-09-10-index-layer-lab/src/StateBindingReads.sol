// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {BindingFold} from "./BindingFold.sol";
import {IndexKeys} from "./IndexKeys.sol";
import {StatePointReads} from "./StatePointReads.sol";
import {StateReadPrimitives} from "./StateReadPrimitives.sol";
import {StateStore} from "./StateStore.sol";
import {StorageByteView} from "./StorageByteView.sol";

library StateBindingReads {
    error ErrReadHistory(uint32 fromRevision, uint16 limit);

    struct BindingHistoryEntry {
        uint32 revision;
        uint64 admissionOrdinal;
        bytes32 envelopeId;
        uint16 leafIndex;
        uint8 occurrenceStatus;
        uint64 revokedAtOrdinal;
    }

    struct Cursor {
        bytes body;
        uint256 at;
    }

    struct ParsedMutation {
        uint8 kind;
        bytes32 purpose;
        bytes32 subject;
        bytes32 fieldRole;
        uint8 targetKind;
        bytes32 targetA;
        uint16 targetLeaf;
        bool predecessorPresent;
        bytes32 predecessorEnvelope;
        uint16 predecessorLeaf;
    }

    struct DecodedMutation {
        BindingFold.Head head;
        StatePointReads.HydratedOccurrence source;
    }

    struct ProbeBudget {
        uint8 used;
    }

    bytes32 private constant DOM_RECORD = keccak256("efs2/record/1");

    function getBindingHead(StateStore.Store storage s, bytes32 bindingKey)
        internal
        view
        returns (BindingFold.Head memory head, bytes32 realmBasis, uint64 highWaterOrdinal)
    {
        (realmBasis,, highWaterOrdinal) = StateReadPrimitives.basis(s, 0, bindingKey);
        head = _checkedCurrentHead(s, bindingKey, highWaterOrdinal);
    }

    function getBindingAtBasis(StateStore.Store storage s, bytes32 bindingKey, uint64 basisOrdinal)
        internal
        view
        returns (BindingFold.Head memory head, bytes32 realmBasis, uint64 highWaterOrdinal)
    {
        uint64 selectedH;
        (realmBasis, selectedH, highWaterOrdinal) = StateReadPrimitives.basis(s, basisOrdinal, bindingKey);
        BindingFold.Head memory current = _checkedCurrentHead(s, bindingKey, highWaterOrdinal);
        if (current.state == 0 || current.admissionOrdinal <= selectedH) return (current, realmBasis, selectedH);

        (bytes32 historyKey, StateReadPrimitives.PostingHead memory history) =
            _checkedHistoryHead(s, bindingKey, current, highWaterOrdinal);
        (uint64 end, uint64 ordinal) = _firstAfter(s, historyKey, history, selectedH, bindingKey);
        if (end == 0) return (head, realmBasis, selectedH);
        head = _decodeAt(s, bindingKey, historyKey, history, uint32(end), ordinal).head;
        return (head, realmBasis, selectedH);
    }

    function readHistory(StateStore.Store storage s, bytes32 bindingKey, uint32 fromRevision, uint16 limit)
        internal
        view
        returns (BindingHistoryEntry[] memory entries, uint32 nextRevision, uint8 completeness)
    {
        (,, uint64 currentH) = StateReadPrimitives.basis(s, 0, bindingKey);
        if (fromRevision == 0 || limit == 0 || limit > 64) revert ErrReadHistory(fromRevision, limit);
        BindingFold.Head memory current = _checkedCurrentHead(s, bindingKey, currentH);
        (bytes32 historyKey, StateReadPrimitives.PostingHead memory history) =
            _checkedHistoryHead(s, bindingKey, current, currentH);
        uint64 start = uint64(fromRevision) - 1;
        if (start >= history.count) return (new BindingHistoryEntry[](0), 0, 1);

        uint64 length = history.count - start;
        if (length > limit) length = limit;
        entries = new BindingHistoryEntry[](length);
        uint64 previous;
        if (start != 0) previous = StateReadPrimitives.postingAt(s, historyKey, history, start - 1, bindingKey);
        for (uint64 i; i < length; ++i) {
            uint64 position = start + i;
            uint64 ordinal = StateReadPrimitives.postingAt(s, historyKey, history, position, bindingKey);
            if (previous != 0 && ordinal <= previous) revert StorageByteView.ErrReadState(bindingKey);
            DecodedMutation memory decoded =
                _decodeAt(s, bindingKey, historyKey, history, uint32(position + 1), ordinal);
            entries[i] = BindingHistoryEntry(
                uint32(position + 1),
                ordinal,
                decoded.source.envelopeId,
                decoded.source.leafIndex,
                decoded.source.status,
                decoded.source.revokedAtOrdinal
            );
            previous = ordinal;
        }
        uint64 firstUnreturned = start + length;
        if (firstUnreturned == history.count) return (entries, 0, 1);
        uint64 following = StateReadPrimitives.postingAt(s, historyKey, history, firstUnreturned, bindingKey);
        if (following <= previous) revert StorageByteView.ErrReadState(bindingKey);
        nextRevision = uint32(firstUnreturned + 1);
        completeness = 2;
    }

    function _checkedCurrentHead(StateStore.Store storage s, bytes32 key, uint64 currentH)
        private
        view
        returns (BindingFold.Head memory head)
    {
        StateStore.BindingRow storage row = s.bindings[key];
        uint256 meta = row.meta;
        if (meta >> 120 != 0) revert StorageByteView.ErrReadState(key);
        head = BindingFold.unpack(meta, row.target);
        if (!BindingFold.validHead(head) || head.admissionOrdinal > currentH) {
            revert StorageByteView.ErrReadState(key);
        }
    }

    function _checkedHistoryHead(
        StateStore.Store storage s,
        bytes32 key,
        BindingFold.Head memory current,
        uint64 currentH
    ) private view returns (bytes32 historyKey, StateReadPrimitives.PostingHead memory history) {
        historyKey = IndexKeys.posting(0, 8, 0, key);
        history = StateReadPrimitives.postingHead(s, historyKey, true, currentH, key);
        if (current.state == 0) {
            if (history.count != 0) revert StorageByteView.ErrReadState(key);
            return (historyKey, history);
        }
        if (
            history.count != uint64(current.revision) || history.last != current.admissionOrdinal
                || history.count >= type(uint32).max
        ) revert StorageByteView.ErrReadState(key);
    }

    function _firstAfter(
        StateStore.Store storage s,
        bytes32 historyKey,
        StateReadPrimitives.PostingHead memory history,
        uint64 selectedH,
        bytes32 subject
    ) private view returns (uint64 end, uint64 selected) {
        uint64 lo;
        uint64 hi = history.count;
        ProbeBudget memory budget;
        while (lo < hi) {
            uint64 mid = lo + (hi - lo) / 2;
            uint64 value = _countedPostingAt(s, historyKey, history, mid, subject, budget);
            if (value <= selectedH) lo = mid + 1;
            else hi = mid;
        }
        end = lo;
        if (end != 0) {
            selected = _countedPostingAt(s, historyKey, history, end - 1, subject, budget);
            if (selected > selectedH) revert StorageByteView.ErrReadState(subject);
            if (end > 1) {
                uint64 previous = _countedPostingAt(s, historyKey, history, end - 2, subject, budget);
                if (previous >= selected) revert StorageByteView.ErrReadState(subject);
            }
        }
        if (end < history.count) {
            uint64 next = _countedPostingAt(s, historyKey, history, end, subject, budget);
            if (next <= selectedH || (selected != 0 && selected >= next)) {
                revert StorageByteView.ErrReadState(subject);
            }
            if (end + 1 < history.count) {
                uint64 following = _countedPostingAt(s, historyKey, history, end + 1, subject, budget);
                if (next >= following) revert StorageByteView.ErrReadState(subject);
            }
        }
    }

    function _countedPostingAt(
        StateStore.Store storage s,
        bytes32 historyKey,
        StateReadPrimitives.PostingHead memory history,
        uint64 position,
        bytes32 subject,
        ProbeBudget memory budget
    ) private view returns (uint64) {
        if (++budget.used > 48) revert StorageByteView.ErrReadState(subject);
        return StateReadPrimitives.postingAt(s, historyKey, history, position, subject);
    }

    function _decodeAt(
        StateStore.Store storage s,
        bytes32 key,
        bytes32 historyKey,
        StateReadPrimitives.PostingHead memory history,
        uint32 revision,
        uint64 ordinal
    ) private view returns (DecodedMutation memory result) {
        result.source = StatePointReads.hydrateOrdinal(s, ordinal, key);
        ParsedMutation memory mutation = _decodeBody(s, result.source, key);
        if (mutation.kind == 1 || mutation.kind == 2) {
            _validateDirect(s, key, historyKey, history, revision, ordinal, mutation, result.source.principalId);
            result.head = _directHead(mutation, revision, ordinal);
            return result;
        }
        if (mutation.kind != 3 || revision <= 1) revert StorageByteView.ErrReadState(key);

        uint64 targetOrdinal = StateReadPrimitives.postingAt(s, historyKey, history, uint64(revision) - 2, key);
        StatePointReads.HydratedOccurrence memory target = StatePointReads.hydrateOrdinal(s, targetOrdinal, key);
        if (
            mutation.targetA != target.envelopeId || mutation.targetLeaf != target.leafIndex
                || target.principalId != result.source.principalId || target.status != 2
                || target.revokedAtOrdinal != ordinal
        ) revert StorageByteView.ErrReadState(key);
        ParsedMutation memory targetMutation = _decodeBody(s, target, key);
        if (targetMutation.kind != 1 && targetMutation.kind != 2) revert StorageByteView.ErrReadState(key);
        _validateDirect(s, key, historyKey, history, revision - 1, targetOrdinal, targetMutation, target.principalId);
        result.head = BindingFold.Head(2, 0, 2, revision, ordinal, bytes32(0), 0);
    }

    function _validateDirect(
        StateStore.Store storage s,
        bytes32 key,
        bytes32 historyKey,
        StateReadPrimitives.PostingHead memory history,
        uint32 revision,
        uint64 ordinal,
        ParsedMutation memory mutation,
        bytes32 principal
    ) private view {
        bytes32 position = keccak256(
            abi.encode(keccak256("efs2/position/1"), mutation.purpose, mutation.subject, mutation.fieldRole)
        );
        bytes32 actualKey = keccak256(abi.encode(keccak256("efs2/binding/1"), principal, position));
        if (actualKey != key) revert StorageByteView.ErrReadState(key);
        if (revision == 1) {
            if (mutation.predecessorPresent) revert StorageByteView.ErrReadState(key);
            return;
        }
        if (!mutation.predecessorPresent || uint64(revision) > history.count) {
            revert StorageByteView.ErrReadState(key);
        }
        uint64 previousOrdinal = StateReadPrimitives.postingAt(s, historyKey, history, uint64(revision) - 2, key);
        if (previousOrdinal >= ordinal) revert StorageByteView.ErrReadState(key);
        StatePointReads.HydratedOccurrence memory previous = StatePointReads.hydrateOrdinal(s, previousOrdinal, key);
        if (mutation.predecessorEnvelope != previous.envelopeId || mutation.predecessorLeaf != previous.leafIndex) {
            revert StorageByteView.ErrReadState(key);
        }
    }

    function _directHead(ParsedMutation memory mutation, uint32 revision, uint64 ordinal)
        private
        pure
        returns (BindingFold.Head memory head)
    {
        if (mutation.kind == 1) {
            head = BindingFold.Head(1, mutation.targetKind, 0, revision, ordinal, mutation.targetA, mutation.targetLeaf);
        } else {
            head = BindingFold.Head(2, 0, 1, revision, ordinal, bytes32(0), 0);
        }
    }

    function _decodeBody(StateStore.Store storage s, StatePointReads.HydratedOccurrence memory occurrence, bytes32 key)
        private
        view
        returns (ParsedMutation memory mutation)
    {
        if (
            occurrence.typeSchemaId != s.init.bindingSetType && occurrence.typeSchemaId != s.init.bindingTombstoneType
                && occurrence.typeSchemaId != s.init.withdrawalType
        ) revert StorageByteView.ErrReadState(key);
        StateStore.RecordRow storage record = s.records[occurrence.recordId];
        uint256 length = record.body.length;
        if (length > 167) revert StorageByteView.ErrReadState(key);
        bytes memory body = StorageByteView.slice(record.body, 0, length, key);
        bytes32 actual = keccak256(abi.encode(DOM_RECORD, occurrence.typeSchemaId, keccak256(body)));
        if (actual != occurrence.recordId) revert StorageByteView.ErrReadState(key);
        Cursor memory cursor = Cursor(body, 0);
        if (occurrence.typeSchemaId == s.init.bindingSetType) {
            mutation.kind = 1;
            mutation.purpose = _word(cursor, key);
            mutation.subject = _word(cursor, key);
            mutation.fieldRole = _word(cursor, key);
            (bool recordPresent, bytes32 recordTarget) = _optionReference(cursor, key);
            (bool occurrencePresent, bytes32 occurrenceTarget, uint16 occurrenceLeaf) = _optionOccurrence(cursor, key);
            if (recordPresent == occurrencePresent) revert StorageByteView.ErrReadState(key);
            if (recordPresent) {
                mutation.targetKind = 1;
                mutation.targetA = recordTarget;
            } else {
                mutation.targetKind = 2;
                mutation.targetA = occurrenceTarget;
                mutation.targetLeaf = occurrenceLeaf;
            }
            (mutation.predecessorPresent, mutation.predecessorEnvelope, mutation.predecessorLeaf) =
                _optionOccurrence(cursor, key);
        } else if (occurrence.typeSchemaId == s.init.bindingTombstoneType) {
            mutation.kind = 2;
            mutation.purpose = _word(cursor, key);
            mutation.subject = _word(cursor, key);
            mutation.fieldRole = _word(cursor, key);
            (mutation.predecessorPresent, mutation.predecessorEnvelope, mutation.predecessorLeaf) =
                _optionOccurrence(cursor, key);
        } else if (occurrence.typeSchemaId == s.init.withdrawalType) {
            mutation.kind = 3;
            mutation.targetA = _referenceWord(cursor, key);
            mutation.targetLeaf = _short(cursor, key);
            if (mutation.targetLeaf >= 64) revert StorageByteView.ErrReadState(key);
        } else {
            revert StorageByteView.ErrReadState(key);
        }
        if (cursor.at != body.length) revert StorageByteView.ErrReadState(key);
    }

    function _optionReference(Cursor memory cursor, bytes32 subject)
        private
        pure
        returns (bool present, bytes32 value)
    {
        uint8 flag = _byte(cursor, subject);
        if (flag > 1) revert StorageByteView.ErrReadState(subject);
        present = flag == 1;
        if (present) value = _referenceWord(cursor, subject);
    }

    function _optionOccurrence(Cursor memory cursor, bytes32 subject)
        private
        pure
        returns (bool present, bytes32 envelopeId, uint16 leafIndex)
    {
        uint8 flag = _byte(cursor, subject);
        if (flag > 1) revert StorageByteView.ErrReadState(subject);
        present = flag == 1;
        if (present) {
            envelopeId = _referenceWord(cursor, subject);
            leafIndex = _short(cursor, subject);
            if (leafIndex >= 64) revert StorageByteView.ErrReadState(subject);
        }
    }

    function _referenceWord(Cursor memory cursor, bytes32 subject) private pure returns (bytes32 value) {
        value = _word(cursor, subject);
        if (uint256(value) < 65536) revert StorageByteView.ErrReadState(subject);
    }

    function _word(Cursor memory cursor, bytes32 subject) private pure returns (bytes32 value) {
        uint256 at = cursor.at;
        if (at > cursor.body.length || cursor.body.length - at < 32) revert StorageByteView.ErrReadState(subject);
        bytes memory body = cursor.body;
        assembly ("memory-safe") { value := mload(add(add(body, 32), at)) }
        cursor.at = at + 32;
    }

    function _short(Cursor memory cursor, bytes32 subject) private pure returns (uint16 value) {
        uint256 at = cursor.at;
        if (at > cursor.body.length || cursor.body.length - at < 2) revert StorageByteView.ErrReadState(subject);
        value = (uint16(uint8(cursor.body[at])) << 8) | uint16(uint8(cursor.body[at + 1]));
        cursor.at = at + 2;
    }

    function _byte(Cursor memory cursor, bytes32 subject) private pure returns (uint8 value) {
        if (cursor.at >= cursor.body.length) revert StorageByteView.ErrReadState(subject);
        value = uint8(cursor.body[cursor.at]);
        ++cursor.at;
    }
}
