// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateStore} from "./StateStore.sol";
import {StatePointReads} from "./StatePointReads.sol";
import {StorageByteView} from "./StorageByteView.sol";

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
        realmBasis = s.init.initialRevisionId;
        if (realmBasis == 0) revert StorageByteView.ErrReadState(subject);
        if (requested > currentH || requested >= ORDINAL_GUARD) revert ErrPageBasis(requested, currentH);
        selectedH = requested == 0 ? currentH : requested;
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
