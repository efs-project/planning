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
/// principal with no binding or an explicit released head falls through.
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

    /// V2 readers carry explicit identities and an execution-bound continuation.
    /// Legacy address methods above/below describe current ingress classification only.
    struct PrincipalEntry { bytes32 position; bytes32 principalId; bytes32 target; uint32 revision; uint64 admission; }
    struct PrincipalCursor {
        uint64 basisAdmission;
        uint64 indexGeneration;
        uint64 rulesEpoch;
        bytes32 executionSet;
        bytes32 scopeKey;
        bytes32 lensHash;
        bytes32 position;
        uint8 lensIndex;
        uint64 rawIndex;
        uint64 selectedSoFar;
    }
    struct PrincipalPage {
        PrincipalEntry[] items;
        uint64 scanned;
        uint64 hydrations;
        uint64 rawTotal;
        uint64 selectedSoFar;
        uint8 status;
        bool mutated;
        PrincipalCursor next;
        bytes32 inventoryPin; // zero for the current-inventory profile
        uint64 prefixProbes; // retained origin-length comparisons, not row scans
        uint64 prefixGas; // in-call prefix-discovery diagnostic, not receipt gas
    }
    // Internal reducers return selector ordinals, so wrappers can expose either
    // addresses or explicit IDs without a second scan or reverse identity lookup.
    struct Selection { bytes32 position; uint256 selector; bytes32 target; uint32 revision; uint64 admission; }
    struct ScanPage {
        Selection[] items;
        uint64 scanned;
        uint64 hydrations;
        uint64 rawTotal;
        uint64 selectedSoFar;
        uint8 status;
        bool mutated;
        PrincipalCursor next;
        bytes32 inventoryPin;
        uint64 prefixProbes;
        uint64 prefixGas;
    }
    bytes32 private constant SUPPORTED_LAYOUT = keccak256("efs.lab.ledger-layout/2:roots-0-12-preserved:context-13:execution-14:readsets-15");

    Ledger public immutable ledger;
    IndexModule public immutable index; // address(0) => lists and history are UNKNOWN

    error E_LENS();
    error E_CURSOR();

    constructor(Ledger ledger_, IndexModule index_) {
        if (ledger_.bindingLifecycleProfile() != bindingLifecycleProfile()) revert E_LENS();
        ledger = ledger_;
        index = index_;
    }
    function bindingLifecycleProfile() public pure returns(bytes32) {
        return keccak256("efs.lab.binding-lifecycle/2:bind-mask-release");
    }

    /// Legacy convenience readers classify accounts now using the stable instance origin.
    function _origin() private view returns (bytes32) {
        return ledger.realmOrigin();
    }

    function _explicitBasis(bytes32 execution) private view {
        if (ledger.bindingLifecycleProfile() != bindingLifecycleProfile()
            || ledger.layoutId() != SUPPORTED_LAYOUT || ledger.executionSet() != execution
            || ledger.indexModule() != address(index)
            || (address(index) != address(0) && index.ledger() != address(ledger))) revert E_CURSOR();
    }

    function resolvePrincipals(bytes32[] calldata principals, bytes32 purpose, bytes32 subject, bytes32 role, bytes32 execution)
        external view returns (uint8 status, bytes32 target, uint32 revision, bytes32 principalId, uint64 admissionOrdinal)
    {
        _explicitBasis(execution);
        if (principals.length == 0 || principals.length > 255) revert E_LENS();
        Selection memory selected;
        (status,selected) = _resolve(principals,Keys.position(purpose,subject,role));
        return (status,selected.target,selected.revision,status == ABSENT ? bytes32(0) : principals[selected.selector],selected.admission);
    }

    function resolveNoTiebreakPrincipals(bytes32[] calldata principals, bytes32 purpose, bytes32 subject, bytes32 role, bytes32 execution)
        external view returns (uint8 status, PrincipalEntry[] memory candidates)
    {
        _explicitBasis(execution);
        if (principals.length == 0 || principals.length > 255) revert E_LENS();
        Selection[] memory selected;
        (status,selected) = _conflicts(principals,Keys.position(purpose,subject,role));
        return (status,_principalEntries(selected,principals));
    }

    function listPrincipals(bytes32[] calldata principals, bytes32 purpose, bytes32 subject, PrincipalCursor calldata cursor, uint256 budget)
        external view returns (PrincipalPage memory page)
    {
        if (principals.length == 0 || principals.length > 255) revert E_LENS();
        PrincipalCursor memory c = cursor;
        bytes32 execution = ledger.executionSet();
        _explicitBasis(execution);
        bytes32 scopeKey = keccak256(abi.encode(purpose, subject));
        bytes32 lensHash = keccak256(abi.encode(principals));
        uint64 generation = address(index) == address(0) ? 0 : index.generation();
        uint64 epoch = ledger.registry().epoch();
        (uint64 current,,,) = ledger.counts();
        if (c.executionSet == 0) {
            if (c.basisAdmission != 0 || c.indexGeneration != 0 || c.rulesEpoch != 0 || c.scopeKey != 0 || c.lensHash != 0
                || c.position != 0 || c.lensIndex != 0 || c.rawIndex != 0 || c.selectedSoFar != 0) revert E_CURSOR();
            c.basisAdmission = current;
            c.executionSet = execution; c.indexGeneration = generation; c.rulesEpoch = epoch;
            c.scopeKey = scopeKey; c.lensHash = lensHash;
        } else {
            if (c.executionSet != execution || c.indexGeneration != generation || c.rulesEpoch != epoch
                || c.scopeKey != scopeKey || c.lensHash != lensHash) revert E_CURSOR();
            _continuationBasis(principals,purpose,subject,c.basisAdmission,current);
        }
        ScanPage memory scanned = _scan(principals,purpose,subject,c,budget);
        return PrincipalPage(_principalEntries(scanned.items,principals),scanned.scanned,scanned.hydrations,scanned.rawTotal,
            scanned.selectedSoFar,scanned.status,scanned.mutated,scanned.next,scanned.inventoryPin,scanned.prefixProbes,scanned.prefixGas);
    }

    /// Strict by default. A derived candidate profile may relax only when it
    /// proves every selected inventory and masking head unchanged since origin.
    function _continuationBasis(bytes32[] memory,bytes32,bytes32,uint64 origin,uint64 current) internal view virtual {
        if(origin!=current)revert E_CURSOR();
    }

    function _historicalBasis(uint64 asOf,bytes32 execution) internal view {
        _explicitBasis(execution);
        (uint64 current,,,)=ledger.counts();
        if(asOf>current||address(index)==address(0))revert E_CURSOR();
        (uint8 cov,uint64 from,uint64 through)=index.coverage(index.FAMILY_HISTORY(),0);
        if(cov!=COMPLETE||from!=1||through!=current||index.provenFrom()!=1)revert E_CURSOR();
    }

    /// Explicit retained-origin reducers. History UNKNOWN is not point ABSENT:
    /// unavailable history reverts into callers' unavailable/catch path.
    function resolvePrincipalsAt(bytes32[] calldata principals,bytes32 purpose,bytes32 subject,bytes32 role,uint64 asOf,bytes32 execution)
        external view returns(uint8 status,bytes32 target,uint32 revision,bytes32 principalId,uint64 admissionOrdinal)
    {
        _historicalBasis(asOf,execution);
        if(principals.length==0||principals.length>255)revert E_LENS();
        bytes32 position=Keys.position(purpose,subject,role);
        for(uint256 i;i<principals.length;i++){
            (uint8 state,bytes32 value,uint32 rev,uint64 at)=_headAt(principals[i],position,asOf);
            if(state==1||state==2)return(state==1?FOUND:MASKED,state==1?value:bytes32(0),rev,principals[i],at);
        }
    }

    function resolveNoTiebreakPrincipalsAt(bytes32[] calldata principals,bytes32 purpose,bytes32 subject,bytes32 role,uint64 asOf,bytes32 execution)
        external view returns(uint8 status,PrincipalEntry[] memory candidates)
    {
        _historicalBasis(asOf,execution);
        if(principals.length==0||principals.length>255)revert E_LENS();
        bytes32 position=Keys.position(purpose,subject,role);
        candidates=new PrincipalEntry[](principals.length);uint256 live;bool removed;
        for(uint256 i;i<principals.length;i++){
            (uint8 state,bytes32 value,uint32 rev,uint64 at)=_headAt(principals[i],position,asOf);
            if(state==1)candidates[live++]=PrincipalEntry(position,principals[i],value,rev,at);
            else if(state==2)removed=true;
        }
        assembly("memory-safe"){mstore(candidates,live)}
        status=live==0?(removed?MASKED:ABSENT):(live==1&&!removed?FOUND:CONFLICT);
    }

    function _headAt(bytes32 principal,bytes32 position,uint64 asOf) internal view returns(uint8 state,bytes32 value,uint32 revision,uint64 at){
        (state,revision,at,value)=_selectionHead(Keys.binding(principal,position));
        if(at<=asOf)return(state,value,revision,at);
        (uint8 h,uint8 historicalState,bytes32 target,uint32 rev,uint64 admission)=_historyStatePrincipal(principal,position,asOf);
        if(h==UNKNOWN)revert E_CURSOR();
        if(h==H_NONE)return(0,0,0,0);
        return(historicalState,target,rev,admission);
    }

    /// One candidate/mask/paging reducer for both public ABIs. The wrappers own
    /// their basis laws; only traversal fields and scopeKey are interpreted here.
    function _scan(bytes32[] memory principals, bytes32 purpose, bytes32 subject, PrincipalCursor memory c, uint256 budget)
        internal view virtual returns (ScanPage memory page)
    {
        if (budget > MAX_BUDGET) budget = MAX_BUDGET;
        page.items = new Selection[](budget);
        if (address(index) == address(0)) return _finishScan(page, c, 0, UNKNOWN);
        (uint8 cov,,) = index.coverage(_scopeFamily(purpose), c.scopeKey);
        if (cov != COMPLETE) return _finishScan(page, c, 0, UNKNOWN);
        for (uint256 i; i < principals.length; ++i)
            page.rawTotal += _scopeCount(purpose, Keys.scopeList(Keys.scope(principals[i], purpose, subject)));
        uint256 filled;
        uint256 k = c.lensIndex;
        uint64 j = c.rawIndex;
        while (k < principals.length) {
            bytes32 listKey = Keys.scopeList(Keys.scope(principals[k], purpose, subject));
            uint64 n = _scopeCount(purpose, listKey);
            while (j < n) {
                if (page.scanned >= budget) {
                    c.lensIndex = uint8(k); c.rawIndex = j;
                    return _finishScan(page, c, filled, PARTIAL);
                }
                bytes32 position = ledger.bindingPosition(_scopeAt(purpose, listKey, j++));
                (uint8 state, uint32 rev, uint64 at, bytes32 target) = _selectionHead(Keys.binding(principals[k], position));
                ++page.scanned; ++page.hydrations;
                if (at > c.basisAdmission) page.mutated = true;
                if (state != 1) continue;
                (bool masked, uint64 probes) = _masked(principals, k, position);
                page.hydrations += probes;
                if (masked) continue;
                page.items[filled++] = Selection(position, k, target, rev, at);
                ++c.selectedSoFar; c.position = position;
            }
            ++k; j = 0;
        }
        c.lensIndex = uint8(principals.length); c.rawIndex = 0;
        return _finishScan(page, c, filled, COMPLETE);
    }

    function _finishScan(ScanPage memory page, PrincipalCursor memory c, uint256 filled, uint8 status)
        internal pure returns (ScanPage memory)
    {
        Selection[] memory items = page.items;
        assembly ("memory-safe") { mstore(items, filled) }
        page.selectedSoFar = c.selectedSoFar; page.status = status; page.next = c;
        return page;
    }

    function _masked(bytes32[] memory principals, uint256 upto, bytes32 position) private view returns (bool, uint64 probes) {
        for (uint256 i; i < upto; ++i) {
            ++probes;
            (uint8 state,,,) = _selectionHead(Keys.binding(principals[i], position));
            if (state == 1 || state == 2) return (true, probes);
        }
        return (false, probes);
    }

    function historyPrincipalAt(bytes32 principalId, bytes32 position, uint64 asOf, bytes32 execution)
        external view returns (uint8, bool, bytes32, uint32, uint64)
    {
        _explicitBasis(execution);
        return historyPrincipal(principalId, position, asOf);
    }
    function historyStatePrincipalAt(bytes32 principalId, bytes32 position, uint64 asOf, bytes32 execution)
        external view returns (uint8 coverage, uint8 state, bytes32 target, uint32 revision, uint64 admission)
    {
        _explicitBasis(execution);
        return _historyStatePrincipal(principalId,position,asOf);
    }

    // ------------------------------------------------------------------ point reads
    function resolve(address[] calldata lens, bytes32 purpose, bytes32 subject, bytes32 role)
        external
        view
        returns (uint8 status, bytes32 target, uint32 revision, address author, uint64 admissionOrdinal)
    {
        if (lens.length == 0) revert E_LENS();
        Selection memory selected;
        (status,selected) = _resolve(_principals(lens),Keys.position(purpose,subject,role));
        return (status,selected.target,selected.revision,status == ABSENT ? address(0) : lens[selected.selector],selected.admission);
    }

    /// Agreement policy (LENS_NO_TIEBREAK / L-EQ): every live candidate is returned; more than
    /// one live, or a live next to a removal, is CONFLICT — never an incidental-order winner.
    function resolveNoTiebreak(address[] calldata lens, bytes32 purpose, bytes32 subject, bytes32 role)
        external
        view
        returns (uint8 status, Entry[] memory candidates)
    {
        if (lens.length == 0) revert E_LENS();
        Selection[] memory selected;
        (status,selected) = _conflicts(_principals(lens),Keys.position(purpose,subject,role));
        return (status,_addressEntries(selected,lens));
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
        // The common worker treats this field as opaque; it remains shell code
        // in the legacy wrapper, never a silently upgraded execution guarantee.
        PrincipalCursor memory traversal = PrincipalCursor(c.basisAdmission,c.indexGeneration,c.rulesEpoch,c.coreCodeCommitment,
            c.scopeKey,c.lensHash,c.position,c.lensIndex,c.rawIndex,c.selectedSoFar);
        ScanPage memory scanned = _scan(_principals(lens),purpose,subject,traversal,budget);
        traversal = scanned.next;
        Cursor memory next = Cursor(traversal.basisAdmission,traversal.indexGeneration,traversal.rulesEpoch,traversal.executionSet,
            traversal.scopeKey,traversal.lensHash,traversal.position,traversal.lensIndex,traversal.rawIndex,traversal.selectedSoFar);
        return Page(_addressEntries(scanned.items,lens),scanned.scanned,scanned.hydrations,scanned.rawTotal,
            scanned.selectedSoFar,scanned.status,scanned.mutated,next);
    }

    // Candidate storage is replaceable without forking the selection/masking
    // reducer. The default remains the original append-only audit inventory.
    function _scopeFamily(bytes32) internal view virtual returns(bytes32) {return index.FAMILY_SCOPE();}
    function _scopeCount(bytes32,bytes32 key) internal view virtual returns(uint64 count) {(count,,,)=index.postingHead(key);}
    function _scopeAt(bytes32,bytes32 key,uint64 i) internal view virtual returns(uint64) {return index.postingAt(key,i);}

    function _principals(address[] calldata authors) private view returns (bytes32[] memory ids) {
        ids = new bytes32[](authors.length);
        bytes32 origin = _origin();
        for (uint256 i; i < authors.length; ++i) ids[i] = Keys.principalFor(authors[i],origin);
    }

    function _selectionHead(bytes32 key) internal view virtual returns(uint8 state,uint32 revision,uint64 admissionOrdinal,bytes32 target) {
        (state,revision,admissionOrdinal,target)=ledger.selectionHead(key);
        if(state>3)revert E_CURSOR();
    }

    function _resolve(bytes32[] memory ids, bytes32 position) private view returns (uint8 status, Selection memory selected) {
        for (uint256 i; i < ids.length; ++i) {
            (uint8 state,uint32 revision,uint64 at,bytes32 target) = _selectionHead(Keys.binding(ids[i],position));
            if (state == 1 || state == 2) return (state == 1 ? FOUND : MASKED,Selection(position,i,state == 1 ? target : bytes32(0),revision,at));
        }
    }

    function _conflicts(bytes32[] memory ids, bytes32 position) private view returns (uint8 status, Selection[] memory selected) {
        selected = new Selection[](ids.length);
        uint256 live;
        bool removed;
        for (uint256 i; i < ids.length; ++i) {
            (uint8 state,uint32 revision,uint64 at,bytes32 target) = _selectionHead(Keys.binding(ids[i],position));
            if (state == 1) selected[live++] = Selection(position,i,target,revision,at);
            else if (state == 2) removed = true;
        }
        assembly ("memory-safe") { mstore(selected,live) }
        status = live == 0 ? (removed ? MASKED : ABSENT) : (live == 1 && !removed ? FOUND : CONFLICT);
    }

    function _principalEntries(Selection[] memory selected, bytes32[] memory ids) private pure returns (PrincipalEntry[] memory entries) {
        entries = new PrincipalEntry[](selected.length);
        for (uint256 i; i < selected.length; ++i) {
            Selection memory s = selected[i];
            entries[i] = PrincipalEntry(s.position,ids[s.selector],s.target,s.revision,s.admission);
        }
    }

    function _addressEntries(Selection[] memory selected, address[] calldata authors) private pure returns (Entry[] memory entries) {
        entries = new Entry[](selected.length);
        for (uint256 i; i < selected.length; ++i) {
            Selection memory s = selected[i];
            entries[i] = Entry(s.position,authors[s.selector],s.target,s.revision,s.admission);
        }
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
        return historyPrincipal(Keys.principalFor(author, _origin()), position, asOf);
    }

    /// Explicit retained principal: never reads or classifies an author's current code.
    function historyPrincipal(bytes32 principalId, bytes32 position, uint64 asOf)
        public view returns (uint8 status, bool live, bytes32 target, uint32 revision, uint64 admissionOrdinal)
    {
        uint8 state;
        (status,state,target,revision,admissionOrdinal)=_historyStatePrincipal(principalId,position,asOf);
        live=state==1; // Legacy diagnostic only: false cannot distinguish mask/release.
    }

    function _historyStatePrincipal(bytes32 principalId, bytes32 position, uint64 asOf)
        private view returns (uint8 status, uint8 state, bytes32 target, uint32 revision, uint64 admissionOrdinal)
    {
        if (address(index) == address(0)) return (UNKNOWN, 0, bytes32(0), 0, 0);
        bytes32 listKey = Keys.historyList(Keys.binding(principalId, position));
        (uint8 cov,,) = index.coverage(index.FAMILY_HISTORY(), listKey);
        if (cov != COMPLETE) return (UNKNOWN, 0, bytes32(0), 0, 0);
        (uint64 n,,,) = index.postingHead(listKey);
        // upper bound: number of history entries with ordinal <= asOf; entry i is revision i+1
        uint64 lo;
        uint64 hi = n;
        while (lo < hi) {
            uint64 mid = (lo + hi) / 2;
            if (index.postingAt(listKey, mid) <= asOf) lo = mid + 1;
            else hi = mid;
        }
        if (lo == 0) return (H_NONE, 0, bytes32(0), 0, 0);
        admissionOrdinal = index.postingAt(listKey, lo - 1);
        revision = uint32(lo);
        (uint8 kind,,,,,, bytes32 a,) = ledger.admission(admissionOrdinal);
        if(kind!=3&&kind!=4&&kind!=7)revert E_CURSOR();
        state = kind==3?1:kind==4?2:3;
        target = state==1 ? a : bytes32(0);
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
