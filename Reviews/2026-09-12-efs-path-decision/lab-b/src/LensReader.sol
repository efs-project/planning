// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "./Keys.sol";
import {Ledger} from "./Ledger.sol";
import {IndexModule} from "./IndexModule.sol";

/// @title LensReader — path resolution, budgeted listing and as-of history under an ordered lens
/// @notice DISPOSABLE LAB, NO PROTOCOL CLAIM. Pure reads over Ledger heads and IndexModule
///         lists; usable by a consuming contract (paid) and by a static browser (eth_call).
///
/// Point reducer (road-b §8.4, files-journey J4): walk the lens in order; the FIRST principal
/// with any binding at the position decides — live → FOUND, tombstone → MASKED (a removal by
/// a higher principal hides a lower principal's same name; it never falls through). Only a
/// principal with no binding at all falls through. The page reducer is the same reducer.
///
/// Listing law (delta 4/D): a page consumes a bounded candidate budget and returns items,
/// scanned, rawTotal (always known), selectedSoFar and status; the selected total is final
/// only when the raw lists are exhausted (COMPLETE). A budget exhausted through masked or
/// dead names is PARTIAL with a cursor, never an empty folder. Without a COMPLETE scope
/// coverage from the index module the page is UNKNOWN.
contract LensReader {
    // point statuses
    uint256 internal constant MAX_BUDGET = 256; // reviewer MINOR: cap caller budget
    uint8 public constant ABSENT = 0;
    uint8 public constant FOUND = 1;
    uint8 public constant MASKED = 2;
    uint8 public constant CONFLICT = 3;
    // page / history statuses
    uint8 public constant UNKNOWN = 0;
    uint8 public constant PARTIAL = 1;
    uint8 public constant COMPLETE = 2;
    uint8 public constant H_NONE = 1; // history: nothing at or before asOf
    uint8 public constant H_FOUND = 2;

    struct Entry {
        bytes32 position;
        address author;
        bytes32 target;
        uint32 revision;
        uint64 admission;
    }

    /// Continuation bound to (basisAdmission, indexGeneration, rulesEpoch, coreCodeCommitment,
    /// scopeKey, lensHash, position) — pre-seal check 4: an admission ordinal alone is not a
    /// basis when code, rules or the index generation changed without new admissions. A stale
    /// continuation reverts E_CURSOR. lensIndex/rawIndex make continuation O(1); selectedSoFar
    /// carries the running selected count.
    struct Cursor {
        uint64 basisAdmission;
        uint64 indexGeneration;
        uint64 rulesEpoch;
        bytes32 coreCodeCommitment;
        bytes32 scopeKey;
        bytes32 lensHash;
        bytes32 position;
        uint8 lensIndex;
        uint64 rawIndex;
        uint64 selectedSoFar;
    }

    struct Page {
        Entry[] items;
        uint64 scanned; // raw candidates consumed by this call (the candidate budget)
        uint64 hydrations; // head loads paid for this call: one per candidate plus one per mask probe
        uint64 rawTotal; // scope head counts summed over the lens (always known)
        uint64 selectedSoFar; // including earlier pages; final only when status == COMPLETE
        uint8 status; // UNKNOWN | PARTIAL | COMPLETE
        bool mutated; // a scanned head changed after basisAdmission: page reflects current state, not the basis
        Cursor next;
    }

    Ledger public immutable ledger;
    IndexModule public immutable index; // address(0) => lists and history are UNKNOWN

    error E_LENS();
    error E_CURSOR();

    constructor(Ledger ledger_, IndexModule index_) {
        ledger = ledger_;
        index = index_;
    }

    /// Same derivation as Ledger.realmOrigin / principalOf, computed locally (no call).
    function _origin() private view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(ledger).codehash));
    }

    // ------------------------------------------------------------------ point reads
    function resolve(address[] calldata lens, bytes32 purpose, bytes32 subject, bytes32 role)
        external
        view
        returns (uint8 status, bytes32 target, uint32 revision, address author, uint64 admissionOrdinal)
    {
        if (lens.length == 0) revert E_LENS();
        bytes32 position = Keys.position(purpose, subject, role);
        bytes32 origin = _origin();
        for (uint256 i; i < lens.length; ++i) {
            (uint8 state, uint32 rev, uint64 adm,,, bytes32 t) =
                ledger.head(Keys.binding(Keys.principalFor(lens[i], origin), position));
            if (state == 1) return (FOUND, t, rev, lens[i], adm);
            if (state == 2) return (MASKED, bytes32(0), rev, lens[i], adm);
        }
        return (ABSENT, bytes32(0), 0, address(0), 0);
    }

    /// Agreement policy (LENS_NO_TIEBREAK / L-EQ): every live candidate is returned; more than
    /// one live, or a live next to a removal, is CONFLICT — never an incidental-order winner.
    function resolveNoTiebreak(address[] calldata lens, bytes32 purpose, bytes32 subject, bytes32 role)
        external
        view
        returns (uint8 status, Entry[] memory candidates)
    {
        if (lens.length == 0) revert E_LENS();
        bytes32 position = Keys.position(purpose, subject, role);
        candidates = new Entry[](lens.length);
        uint256 live;
        bool removed;
        bytes32 origin = _origin();
        for (uint256 i; i < lens.length; ++i) {
            (uint8 state, uint32 rev, uint64 adm,,, bytes32 t) =
                ledger.head(Keys.binding(Keys.principalFor(lens[i], origin), position));
            if (state == 1) candidates[live++] = Entry(position, lens[i], t, rev, adm);
            else if (state == 2) removed = true;
        }
        assembly ("memory-safe") {
            mstore(candidates, live)
        }
        if (live == 0) status = removed ? MASKED : ABSENT;
        else if (live == 1 && !removed) status = FOUND;
        else status = CONFLICT;
    }

    // ------------------------------------------------------------------ budgeted listing
    function list(address[] calldata lens, bytes32 purpose, bytes32 subject, Cursor calldata cursor, uint256 budget)
        public
        view
        virtual
        returns (Page memory page)
    {
        if (lens.length == 0 || lens.length > 255) revert E_LENS();
        bytes32 scopeKey = keccak256(abi.encode(purpose, subject));
        bytes32 lensHash = keccak256(abi.encodePacked(lens));
        Cursor memory c = cursor;
        uint64 generation = address(index) == address(0) ? 0 : index.generation();
        uint64 epoch = ledger.registry().epoch();
        if (c.basisAdmission == 0) {
            (uint64 admissions,,,) = ledger.counts();
            c.basisAdmission = admissions;
            c.indexGeneration = generation;
            c.rulesEpoch = epoch;
            c.coreCodeCommitment = address(ledger).codehash;
            c.scopeKey = scopeKey;
            c.lensHash = lensHash;
        } else if (
            c.scopeKey != scopeKey || c.lensHash != lensHash || c.indexGeneration != generation || c.rulesEpoch != epoch
                || c.coreCodeCommitment != address(ledger).codehash
        ) {
            revert E_CURSOR();
        }
        bytes32 origin = _origin();
        if (budget > MAX_BUDGET) budget = MAX_BUDGET; // paid reads: bound memory expansion
        page.items = new Entry[](budget);
        page.next = c;
        if (address(index) == address(0)) return _finish(page, c, 0, UNKNOWN);
        (uint8 cov,,) = index.coverage(_scopeFamily(purpose), scopeKey);
        if (cov != COMPLETE) return _finish(page, c, 0, UNKNOWN);
        for (uint256 i; i < lens.length; ++i) {
            uint64 n = _scopeCount(purpose, Keys.scopeList(Keys.scope(Keys.principalFor(lens[i], origin), purpose, subject)));
            page.rawTotal += n;
        }
        uint256 filled;
        uint256 k = c.lensIndex;
        uint64 j = c.rawIndex;
        while (k < lens.length) {
            bytes32 principal = Keys.principalFor(lens[k], origin);
            bytes32 listKey = Keys.scopeList(Keys.scope(principal, purpose, subject));
            uint64 n = _scopeCount(purpose,listKey);
            while (j < n) {
                if (page.scanned >= budget) {
                    c.lensIndex = uint8(k);
                    c.rawIndex = j;
                    return _finish(page, c, filled, PARTIAL);
                }
                bytes32 position = ledger.bindingPosition(_scopeAt(purpose,listKey,j));
                (uint8 state, uint32 rev, uint64 adm,,, bytes32 t) = ledger.head(Keys.binding(principal, position));
                ++page.scanned;
                ++page.hydrations;
                ++j;
                if (adm > c.basisAdmission) page.mutated = true;
                if (state != 1) continue;
                (bool masked, uint256 probes) = _masked(lens, k, position, origin);
                page.hydrations += uint64(probes);
                if (masked) continue;
                page.items[filled++] = Entry(position, lens[k], t, rev, adm);
                ++c.selectedSoFar;
                c.position = position;
            }
            ++k;
            j = 0;
        }
        c.lensIndex = uint8(lens.length);
        c.rawIndex = 0;
        return _finish(page, c, filled, COMPLETE);
    }

    // Candidate storage is replaceable without forking the selection/masking
    // reducer. The default remains the original append-only audit inventory.
    function _scopeFamily(bytes32) internal view virtual returns(bytes32) {return index.FAMILY_SCOPE();}
    function _scopeCount(bytes32,bytes32 key) internal view virtual returns(uint64 count) {(count,,,)=index.postingHead(key);}
    function _scopeAt(bytes32,bytes32 key,uint64 i) internal view virtual returns(uint64) {return index.postingAt(key,i);}

    /// A higher lens principal with ANY binding at the position (live or removed) masks it, so
    /// the same name bound by several authors yields one selected entry. Returns the probes paid.
    function _masked(address[] calldata lens, uint256 upto, bytes32 position, bytes32 origin)
        private
        view
        returns (bool masked, uint256 probes)
    {
        for (uint256 i; i < upto; ++i) {
            ++probes;
            (uint8 state,,,,,) = ledger.head(Keys.binding(Keys.principalFor(lens[i], origin), position));
            if (state != 0) return (true, probes);
        }
        return (false, probes);
    }

    function _finish(Page memory page, Cursor memory c, uint256 filled, uint8 status) private pure returns (Page memory) {
        Entry[] memory items = page.items;
        assembly ("memory-safe") {
            mstore(items, filled)
        }
        page.selectedSoFar = c.selectedSoFar;
        page.status = status;
        page.next = c;
        return page;
    }

    // ------------------------------------------------------------------ as-of history (bisection over the packed history list)
    function history(address author, bytes32 position, uint64 asOf)
        external
        view
        returns (uint8 status, bool live, bytes32 target, uint32 revision, uint64 admissionOrdinal)
    {
        return _history(author, position, asOf);
    }

    function historyByRole(address author, bytes32 purpose, bytes32 subject, bytes32 role, uint64 asOf)
        external
        view
        returns (uint8 status, bool live, bytes32 target, uint32 revision, uint64 admissionOrdinal)
    {
        return _history(author, Keys.position(purpose, subject, role), asOf);
    }

    function _history(address author, bytes32 position, uint64 asOf)
        private
        view
        returns (uint8 status, bool live, bytes32 target, uint32 revision, uint64 admissionOrdinal)
    {
        if (address(index) == address(0)) return (UNKNOWN, false, bytes32(0), 0, 0);
        bytes32 listKey = Keys.historyList(Keys.binding(Keys.principalFor(author, _origin()), position));
        (uint8 cov,,) = index.coverage(index.FAMILY_HISTORY(), listKey);
        if (cov != COMPLETE) return (UNKNOWN, false, bytes32(0), 0, 0);
        (uint64 n,,,) = index.postingHead(listKey);
        // upper bound: number of history entries with ordinal <= asOf; entry i is revision i+1
        uint64 lo;
        uint64 hi = n;
        while (lo < hi) {
            uint64 mid = (lo + hi) / 2;
            if (index.postingAt(listKey, mid) <= asOf) lo = mid + 1;
            else hi = mid;
        }
        if (lo == 0) return (H_NONE, false, bytes32(0), 0, 0);
        admissionOrdinal = index.postingAt(listKey, lo - 1);
        revision = uint32(lo);
        (uint8 kind,,,,,, bytes32 a,) = ledger.admission(admissionOrdinal);
        live = kind == 3; // BIND; an UNBIND row is the tombstone revision
        target = live ? a : bytes32(0);
        status = H_FOUND;
    }

    // ------------------------------------------------------------------ raw getters (forwarded)
    function positionKey(bytes32 purpose, bytes32 subject, bytes32 role) external pure returns (bytes32) {
        return Keys.position(purpose, subject, role);
    }

    function head(bytes32 key)
        external
        view
        returns (uint8 state, uint32 revision, uint64 admissionOrdinal, uint64 previous, uint64 bindingOrdinal, bytes32 target)
    {
        return ledger.head(key);
    }

    function record(bytes32 id) external view returns (bytes32 typeId, uint64 firstAdmission, uint32 occurrences, bytes memory data) {
        return ledger.record(id);
    }

    function body(bytes32 id) external view returns (bytes memory) {
        return ledger.body(id);
    }

    function extsload(bytes32 slot) external view returns (bytes32) {
        return ledger.extsload(slot);
    }
}
