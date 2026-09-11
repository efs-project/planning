// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateStore} from "C0Core/StateStore.sol";
import {IndexKeys} from "C0Core/IndexKeys.sol";

/// @notice The ONE place in the lab that turns a kind-10 lane into an
/// admission ordinal, so the three ordinal domains (index-layer §11a: scope
/// position, admission ordinal, global binding-key ordinal) never get mixed.
///
/// The layout is the Store's stored discriminator `scopeLayout` (Codex's K10
/// patch: 0 legacy, 1 K10), never inferred from lane values.
///  - mode 0: the lane IS the first admission ordinal of the position's key.
///  - mode 1: the lane is the global binding-key ordinal `k`; the first
///    admission ordinal is recovered as `postingWords[kind8(bindingKeys[k])][0]`
///    lane 0 (the key's oldest history entry), i.e. TWO more cold reads per
///    lane (bindingKeys[k] 2,100 + kind-8 word 0 2,100). Codex's reader
///    (`StateReadPrimitives.firstBindingAdmission`) recovers it the same way,
///    with extra head/history validation; the lab keeps the minimal form and
///    prices it.
library ScopeOrdinals {
    error ScopeLayoutUnsupported(uint256 layout);
    error ScopeIntegrity(uint8 code);

    uint256 internal constant U48 = (uint256(1) << 48) - 1;

    function layoutOf(StateStore.Store storage s) internal view returns (uint256 layout) {
        layout = s.scopeLayout;
        if (layout > 1) revert ScopeLayoutUnsupported(layout);
    }

    function k10(bytes32 scopeKey) internal pure returns (bytes32) {
        return IndexKeys.posting(bytes32(0), 10, 0, scopeKey);
    }

    function count(StateStore.Store storage s, bytes32 k10Key) internal view returns (uint64) {
        return uint64(s.postings[k10Key].head);
    }

    /// Raw u48 lane at `position` (admission ordinal in mode 0, binding-key ordinal in mode 1).
    function laneAt(StateStore.Store storage s, bytes32 k10Key, uint64 position) internal view returns (uint64) {
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64((s.postingWords[k10Key][position / 5] >> (48 * (position % 5))) & U48);
    }

    /// The key's FIRST admission ordinal: kind-8 (binding history) word 0, lane 0.
    /// Ordinals start at 1, so 0 means the key has no history; under the kernel
    /// that is unreachable for a key named by a kind-10 lane (both appends are
    /// journaled in one plan), but a 0 would sort as "<= d" in `lowerBound` /
    /// `probe` — the confirms-but-unreadable shape — so it reverts instead.
    /// Mode-0 invariant relied on by `locate`: first-admission ordinals are unique
    /// per scope because the kernel allocates one ordinal per fresh leaf and
    /// `append` asserts `ord > last`; a per-publication ordinal would break it.
    function firstAdmissionOfKey(StateStore.Store storage s, bytes32 key) internal view returns (uint64 first) {
        // forge-lint: disable-next-line(unsafe-typecast)
        first = uint64(s.postingWords[IndexKeys.posting(bytes32(0), 8, 0, key)][0] & U48);
        if (first == 0) revert ScopeIntegrity(5);
    }

    /// Mode 1 only: the binding key at `position`.
    function keyAt(StateStore.Store storage s, bytes32 k10Key, uint64 position) internal view returns (bytes32 key) {
        uint64 k = laneAt(s, k10Key, position);
        if (k == 0) revert ScopeIntegrity(1);
        key = s.bindingKeys[k];
        if (key == bytes32(0)) revert ScopeIntegrity(2);
    }

    /// First admission ordinal of the position's key, in either layout. This is
    /// the ONLY admission-domain value a lane ever yields; "born after d" is
    /// `admissionAt(position) > d` in both modes.
    function admissionAt(StateStore.Store storage s, bytes32 k10Key, uint64 position, uint256 layout)
        internal
        view
        returns (uint64)
    {
        if (layout == 0) return laneAt(s, k10Key, position);
        return firstAdmissionOfKey(s, keyAt(s, k10Key, position));
    }

    /// First position whose first-binding admission ordinal is > d (the kind-10
    /// list is first-admission-sorted in both layouts: keys are allocated in
    /// admission order). log2(count) lane reads in mode 0, 3x that in mode 1.
    function lowerBound(StateStore.Store storage s, bytes32 k10Key, uint64 n, uint64 d, uint256 layout)
        internal
        view
        returns (uint64)
    {
        uint64 lo;
        uint64 hi = n;
        while (lo < hi) {
            uint64 mid = lo + (hi - lo) / 2;
            if (admissionAt(s, k10Key, mid, layout) <= d) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    /// Reverse locator (binding key -> scope position) for a rebind: the key's
    /// first admission ordinal (kind-8 word 0, one read) found by binary search
    /// over the kind-10 list. No reverse-map slot, nothing from calldata, no
    /// linear walk. Mode 1 additionally checks the located lane names the key.
    function locate(StateStore.Store storage s, bytes32 k10Key, bytes32 key, uint256 layout)
        internal
        view
        returns (uint64 position)
    {
        uint64 first = firstAdmissionOfKey(s, key);
        uint64 n = count(s, k10Key);
        uint64 lo;
        uint64 hi = n;
        while (lo < hi) {
            uint64 mid = lo + (hi - lo) / 2;
            if (admissionAt(s, k10Key, mid, layout) < first) lo = mid + 1;
            else hi = mid;
        }
        if (lo >= n || admissionAt(s, k10Key, lo, layout) != first) revert ScopeIntegrity(3);
        if (layout == 1 && keyAt(s, k10Key, lo) != key) revert ScopeIntegrity(4);
        return lo;
    }
}
