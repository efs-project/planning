// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateStore} from "./StateStore.sol";
import {StatePointReads} from "./StatePointReads.sol";
import {StorageByteView} from "./StorageByteView.sol";
import {IndexKeys} from "./IndexKeys.sol";
import {BindingFold} from "./BindingFold.sol";

library StateReadPrimitives {
    struct PostingHead {
        uint64 count;
        uint64 live;
        uint64 last;
    }

    error ErrPageBasis(uint64 requestedBasis, uint64 currentHighWater);

    uint256 private constant ORDINAL_GUARD = (uint256(1) << 48) - 1;

    function basis(StateStore.Store storage s, uint64 requested, bytes32 subject)
        internal
        view
        returns (bytes32 realmBasis, uint64 selectedH, uint64 currentH)
    {
        currentH = StatePointReads.requireState(s, subject);
        if (s.scopeLayout > 1) revert StorageByteView.ErrReadState(subject);
        realmBasis = s.init.initialRevisionId;
        if (realmBasis == 0) revert StorageByteView.ErrReadState(subject);
        if (requested > currentH || requested >= ORDINAL_GUARD) revert ErrPageBasis(requested, currentH);
        selectedH = requested == 0 ? currentH : requested;
    }

    /// Physical kind-10 values use this bound only in the explicitly selected K10 arm.
    function scopeBound(StateStore.Store storage s, uint64 currentH, bytes32 subject) internal view returns (uint64) {
        if (s.scopeLayout > 1) revert StorageByteView.ErrReadState(subject);
        if (s.scopeLayout == 0) return currentH;
        uint64 count = s.count.bindingKeys;
        if (count >= ORDINAL_GUARD || count > currentH) revert StorageByteView.ErrReadState(subject);
        return count;
    }

    /// Recover admission time through the unchanged kind-8 history, not a reverse map.
    function firstBindingAdmission(StateStore.Store storage s, uint64 keyOrdinal, uint64 currentH, bytes32 subject)
        internal
        view
        returns (uint64 first)
    {
        if (keyOrdinal == 0 || keyOrdinal >= ORDINAL_GUARD || keyOrdinal > s.count.bindingKeys) {
            revert StorageByteView.ErrReadState(subject);
        }
        bytes32 key = s.bindingKeys[keyOrdinal];
        if (key == 0) revert StorageByteView.ErrReadState(subject);
        StateStore.BindingRow storage row = s.bindings[key];
        BindingFold.Head memory binding = BindingFold.unpack(row.meta, row.target);
        if (row.meta >> 120 != 0 || !BindingFold.validHead(binding) || binding.state == 0) {
            revert StorageByteView.ErrReadState(subject);
        }
        bytes32 historyKey = IndexKeys.posting(0, 8, 0, key);
        PostingHead memory history = postingHead(s, historyKey, true, currentH, subject);
        if (
            history.count == 0 || history.count != binding.revision || history.last != binding.admissionOrdinal
                || history.count >= type(uint32).max
        ) revert StorageByteView.ErrReadState(subject);
        first = postingAt(s, historyKey, history, 0, subject);
        if (history.count > 1 && postingAt(s, historyKey, history, 1, subject) <= first) {
            revert StorageByteView.ErrReadState(subject);
        }
    }

    function postingHead(StateStore.Store storage s, bytes32 key, bool audit, uint64 currentH, bytes32 subject)
        internal
        view
        returns (PostingHead memory result)
    {
        uint256 packed = s.postings[key].head;
        if (packed >> 192 != 0) revert StorageByteView.ErrReadState(subject);
        uint64 count = uint64(packed);
        uint64 live = uint64(packed >> 64);
        uint64 last = uint64((packed >> 128) & ORDINAL_GUARD);
        uint16 flags = uint16(packed >> 176);
        if (count == 0) {
            if (packed != 0) revert StorageByteView.ErrReadState(subject);
            return result;
        }
        if (
            count >= ORDINAL_GUARD || live >= ORDINAL_GUARD || live > count || count > last || last > currentH
                || last >= ORDINAL_GUARD || flags != (audit ? 1 : 0) || (audit && live != count)
        ) revert StorageByteView.ErrReadState(subject);
        result = PostingHead(count, live, last);
    }

    function postingAt(
        StateStore.Store storage s,
        bytes32 key,
        PostingHead memory head,
        uint64 position,
        bytes32 subject
    ) internal view returns (uint64 ordinal) {
        if (position >= head.count) revert StorageByteView.ErrReadState(subject);
        uint256 packed = s.postingWords[key][position / 5];
        if (packed >> 240 != 0) revert StorageByteView.ErrReadState(subject);
        ordinal = uint64((packed >> (48 * (position % 5))) & ORDINAL_GUARD);
        if (ordinal == 0 || ordinal >= ORDINAL_GUARD || ordinal > head.last) {
            revert StorageByteView.ErrReadState(subject);
        }
        uint64 finalPosition = head.count - 1;
        if (position / 5 == finalPosition / 5) {
            uint256 used = 48 * ((finalPosition % 5) + 1);
            if (used < 240 && packed >> used != 0) revert StorageByteView.ErrReadState(subject);
        }
        if (position == finalPosition && ordinal != head.last) revert StorageByteView.ErrReadState(subject);
    }
}
