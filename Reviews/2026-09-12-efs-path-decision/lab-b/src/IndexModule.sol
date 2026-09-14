// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "./Keys.sol";
import {IIndexModule} from "./Interfaces.sol";

interface ILedgerCounts {
    function counts() external view returns (uint64 admissions, uint64 records, uint64 bindings, uint64 publications);
}

/// @title IndexModule — the separate index responsibility (coordinator delta 3)
/// @notice DISPOSABLE LAB, NO PROTOCOL CLAIM. Owns EVERY query structure; the Ledger keeps
///         none. Called once per publication in the same transaction; a revert here reverts
///         the accepted logical action (mandatory-index rollback).
///
/// Mandatory families (maintained here, coverage reported):
///   scope     kind 10  per (author, purpose, subject): binding ordinals, one per fresh key (audit list)
///   history   kind 8   per binding key: admission ordinals of every head change (audit list)
///   backlink  kind 5   per target: admission ordinals of binds; `live` = heads still pointing there
///   by-type   kind 1   per Type: publish/reuse admissions; `live` decremented on withdraw
///   by-author kind 4   per author: publish/reuse admissions; `live` decremented on withdraw
/// Per-record occurrence count lives in the Ledger's Record row (delta 3 allows this).
/// Optional families are declared with a start admission; this lab maintains no optional data.
///
/// Posting-list representation is the fuller model's (StateKernel.append): head word =
/// count u64 at bit 0 | live u64 at 64 | last u48 at 128 | flags u16 at 176 (1 = audit list); data words hold
/// five 48-bit ordinals each at shift 48*(index%5). ESTIMATED per append: ~5k head rewrite +
/// 22.1k/5 amortized fresh word (fresh list: ~44k).
contract IndexModule is IIndexModule {
    uint8 public constant UNKNOWN = 0;
    uint8 public constant PARTIAL = 1;
    uint8 public constant COMPLETE = 2;
    bytes32 public constant FAMILY_SCOPE = keccak256("efs2/family/scope/1");
    bytes32 public constant FAMILY_HISTORY = keccak256("efs2/family/history/1");
    bytes32 public constant FAMILY_BACKLINK = keccak256("efs2/family/backlink/1");
    bytes32 public constant FAMILY_BY_TYPE = keccak256("efs2/family/by-type/1");
    bytes32 public constant FAMILY_BY_AUTHOR = keccak256("efs2/family/by-author/1");
    uint64 private constant GUARD = (uint64(1) << 48) - 1;

    struct Family {
        bool declared;
        bool mandatory;
        uint64 fromAdmission;
    }

    address public immutable ledger;
    address public immutable admin;
    uint64 public immutable attachedFrom; // first admission this module could have seen
    uint64 public lastProcessed; // last admission ordinal indexed
    uint64 public lastPublication;
    uint64 public generation; // bumped by the admin after a backfill/re-index; part of a cursor's basis
    bool public gapped; // an admission range was skipped while detached: coverage can never be COMPLETE again

    mapping(bytes32 => Family) private _family;
    mapping(bytes32 => uint256) private _postingHead;
    mapping(bytes32 => mapping(uint64 => uint256)) private _postingWord;

    event FamilyDeclared(bytes32 indexed family, bool mandatory, uint64 fromAdmission);

    error E_LEDGER();
    error E_ADMIN();
    error E_ORDER(bytes32 key, uint64 last, uint64 proposed);
    error E_GUARD();

    constructor(address ledger_) {
        ledger = ledger_;
        admin = msg.sender;
        (uint64 admissions,,,) = ILedgerCounts(ledger_).counts();
        attachedFrom = admissions + 1;
        lastProcessed = admissions;
        _declare(FAMILY_SCOPE, true, admissions + 1);
        _declare(FAMILY_HISTORY, true, admissions + 1);
        _declare(FAMILY_BACKLINK, true, admissions + 1);
        _declare(FAMILY_BY_TYPE, true, admissions + 1);
        _declare(FAMILY_BY_AUTHOR, true, admissions + 1);
    }

    function declareOptional(bytes32 family, uint64 fromAdmission) external {
        if (msg.sender != admin) revert E_ADMIN();
        _declare(family, false, fromAdmission);
    }

    /// A new index generation invalidates every outstanding listing cursor.
    function bumpGeneration() external {
        if (msg.sender != admin) revert E_ADMIN();
        ++generation;
    }

    function _declare(bytes32 family, bool mandatory, uint64 fromAdmission) internal {
        _family[family] = Family(true, mandatory, fromAdmission);
        emit FamilyDeclared(family, mandatory, fromAdmission);
    }

    // ---------------------------------------------------------------- maintenance
    function onAdmission(uint64 publication, Effect[] calldata effects) public virtual {
        if (msg.sender != ledger) revert E_LEDGER();
        uint256 n = effects.length;
        if (n == 0) return;
        if (effects[0].admission != lastProcessed + 1) gapped = true;
        for (uint256 i; i < n; ++i) {
            Effect calldata e = effects[i];
            if (e.kind == 1 || e.kind == 2) {
                _append(Keys.byTypeList(e.typeId), e.admission, false);
                _append(Keys.byAuthorList(e.author), e.admission, false);
            } else if (e.kind == 3) {
                if (e.freshBinding) _append(Keys.scopeList(e.scopeKey), e.bindingOrdinal, true);
                if (e.oldLive) _release(Keys.backlinkList(e.oldTarget));
                _append(Keys.backlinkList(e.target), e.admission, false);
                _append(Keys.historyList(e.bindingKey), e.admission, true);
            } else if (e.kind == 4) {
                _release(Keys.backlinkList(e.oldTarget));
                _append(Keys.historyList(e.bindingKey), e.admission, true);
            } else if (e.kind == 6) {
                _release(Keys.byTypeList(e.typeId));
                _release(Keys.byAuthorList(e.author));
            }
            // kind 5 (create) maintains no list in this lab
        }
        lastProcessed = effects[n - 1].admission;
        lastPublication = publication;
    }

    // ---------------------------------------------------------------- coverage
    /// COMPLETE only if the family is mandatory, maintained from admission 1, and no
    /// admission was ever made while this module was detached. Otherwise PARTIAL with the
    /// honest range; undeclared families are UNKNOWN. `scope` is accepted for the API shape
    /// (per-(family,scope) frontiers are a later lab); coverage here is per family.
    function coverage(bytes32 family, bytes32 /* scope */)
        external
        view
        returns (uint8 status, uint64 fromAdmission, uint64 throughAdmission)
    {
        Family storage f = _family[family];
        if (!f.declared) return (UNKNOWN, 0, 0);
        (uint64 admissions,,,) = ILedgerCounts(ledger).counts();
        fromAdmission = f.fromAdmission;
        throughAdmission = lastProcessed;
        bool upToDate = lastProcessed == admissions && !gapped;
        status = (f.mandatory && fromAdmission == 1 && upToDate) ? COMPLETE : PARTIAL;
    }

    // ---------------------------------------------------------------- reads
    function postingHead(bytes32 key) external view returns (uint64 count, uint64 live, uint64 last, uint16 flags) {
        uint256 hw = _postingHead[key];
        return (uint64(hw), uint64(hw >> 64), uint64((hw >> 128) & GUARD), uint16(hw >> 176));
    }

    function postingWord(bytes32 key, uint64 index) external view returns (uint256) {
        return _postingWord[key][index];
    }

    function postingAt(bytes32 key, uint64 index) external view returns (uint64) {
        return uint64((_postingWord[key][index / 5] >> (48 * (index % 5))) & GUARD);
    }

    // ---------------------------------------------------------------- packed lists
    function _append(bytes32 key, uint64 ordinal, bool audit) internal {
        uint256 hw = _postingHead[key];
        uint64 count = uint64(hw);
        uint64 live = uint64(hw >> 64);
        uint64 last = uint64((hw >> 128) & GUARD);
        if (ordinal <= last) revert E_ORDER(key, last, ordinal);
        if (ordinal >= GUARD || count >= GUARD - 1) revert E_GUARD();
        _postingWord[key][count / 5] |= uint256(ordinal) << (48 * (count % 5));
        _postingHead[key] = uint256(count + 1) | (uint256(live + 1) << 64) | (uint256(ordinal) << 128)
            | (audit ? (uint256(1) << 176) : 0);
    }

    /// One fewer live entry. A list this module never saw (attached late) is left at zero:
    /// that family is already reported PARTIAL, never COMPLETE.
    function _release(bytes32 key) private {
        uint256 hw = _postingHead[key];
        uint64 live = uint64(hw >> 64);
        if (live == 0) return;
        _postingHead[key] = (hw & ~(uint256(type(uint64).max) << 64)) | (uint256(live - 1) << 64);
    }
}
