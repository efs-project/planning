// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IAcceptor} from "../src/Interfaces.sol";
import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";

/// Entry Type rule: first body word is one exact Type-checked target reference.
/// A curator-minted edition and entry Subject are named by their salts in-body.
contract CuratedEntryRule is IAcceptor {
    Ledger public immutable ledger;
    bytes32 public immutable curatorPrincipal;

    constructor(Ledger ledger_, address curator) {
        ledger = ledger_;
        curatorPrincipal = ledger_.principalOf(curator);
    }

    function accept(bytes32, bytes calldata body, bytes32[] calldata refs) external view returns (bool) {
        if (msg.sender != address(ledger) || refs.length != 1 || body.length < 224 || body.length > 288) return false;
        bytes32 target;
        bytes32 edition;
        bytes32 id;
        bytes32 salt;
        bytes32 editionSalt;
        uint256 offset;
        uint256 labelLength;
        assembly ("memory-safe") {
            target := calldataload(body.offset)
            edition := calldataload(add(body.offset, 32))
            id := calldataload(add(body.offset, 64))
            salt := calldataload(add(body.offset, 96))
            editionSalt := calldataload(add(body.offset, 128))
            offset := calldataload(add(body.offset, 160))
            labelLength := calldataload(add(body.offset, 192))
        }
        if (target != refs[0] || target == bytes32(0) || salt == bytes32(0) || editionSalt == bytes32(0)
            || offset != 192 || labelLength > 64 || body.length != 224 + ((labelLength + 31) / 32) * 32) return false;
        // ABI dynamic-string padding is part of the Record's content address.
        // Reject alternate byte strings that decode to the same visible label.
        for (uint256 i = 224 + labelLength; i < body.length; ++i) if (body[i] != 0) return false;
        return id == Keys.subject(curatorPrincipal, salt) && edition == Keys.subject(curatorPrincipal, editionSalt)
            && ledger.subjectCreatedAt(id) != 0 && ledger.subjectCreatedAt(edition) != 0;
    }
}

/// Ordinary Type rule for a deliberately small, whole-snapshot list profile.
/// Every member is checked during admission, within Ledger's 300k callback cap.
contract CuratedSnapshotRule is IAcceptor {
    uint256 public constant MAX_ENTRIES = 8;
    Ledger public immutable ledger;
    bytes32 public immutable curatorPrincipal;
    bytes32 public immutable entryType;

    constructor(Ledger ledger_, address curator, bytes32 entryType_) {
        ledger = ledger_;
        curatorPrincipal = ledger_.principalOf(curator);
        entryType = entryType_;
    }

    function accept(bytes32, bytes calldata body, bytes32[] calldata refs) external view returns (bool) {
        if (msg.sender != address(ledger) || refs.length != 0 || body.length < 128
            || body.length > 128 + 64 * MAX_ENTRIES) return false;
        bytes32 edition;
        bytes32 editionSalt;
        uint256 offset;
        uint256 count;
        assembly ("memory-safe") {
            edition := calldataload(body.offset)
            editionSalt := calldataload(add(body.offset, 32))
            offset := calldataload(add(body.offset, 64))
            count := calldataload(add(body.offset, 96))
        }
        if (editionSalt == bytes32(0) || edition != Keys.subject(curatorPrincipal, editionSalt)
            || ledger.subjectCreatedAt(edition) == 0 || offset != 96 || count > MAX_ENTRIES
            || body.length != 128 + 64 * count) return false;
        for (uint256 i; i < count; ++i) {
            bytes32 id;
            bytes32 recordId;
            assembly ("memory-safe") {
                id := calldataload(add(body.offset, add(128, mul(i, 64))))
                recordId := calldataload(add(body.offset, add(160, mul(i, 64))))
            }
            if (id == bytes32(0) || recordId == bytes32(0)) return false;
            for (uint256 j; j < i; ++j) {
                bytes32 prior;
                assembly ("memory-safe") { prior := calldataload(add(body.offset, add(128, mul(j, 64)))) }
                if (prior == id) return false;
            }
            (bytes32 actualType, uint64 first,, bytes memory entryBody) = ledger.record(recordId);
            if (first == 0 || actualType != entryType || entryBody.length < 224) return false;
            bytes32 declaredEdition;
            bytes32 declaredId;
            assembly ("memory-safe") {
                declaredEdition := mload(add(entryBody, 64))
                declaredId := mload(add(entryBody, 96))
            }
            if (declaredEdition != edition || declaredId != id) return false;
        }
        return true;
    }
}

/// Stateless reader/validator for a curator-selected List. The curator mints
/// edition and entry Subjects and signs the edition HEAD binding selecting an
/// exact immutable snapshot. Anyone may publish valid Entry/Snapshot Records;
/// that publication is not evidence of curator authorship. Membership, order,
/// labels, selection and publication provenance remain distinct Ledger facts.
contract CuratedListProfile {
    uint256 public constant MAX_ENTRIES = 8;
    struct EntryRef { bytes32 id; bytes32 recordId; }
    struct Entry { bytes32 id; bytes32 target; string label; }

    Ledger public immutable ledger;
    bytes32 public immutable curatorPrincipal;
    bytes32 public immutable entryType;
    bytes32 public immutable snapshotType;
    bytes32 public immutable headPurpose;

    error E_PROFILE();
    error E_STALE();
    error E_PAGE();

    constructor(Ledger ledger_, address curator, bytes32 entryType_, bytes32 snapshotType_, bytes32 headPurpose_) {
        if (address(ledger_).code.length == 0 || curator == address(0) || entryType_ == bytes32(0)
            || snapshotType_ == bytes32(0) || headPurpose_ == bytes32(0)) revert E_PROFILE();
        ledger = ledger_;
        curatorPrincipal = ledger_.principalOf(curator);
        entryType = entryType_;
        snapshotType = snapshotType_;
        headPurpose = headPurpose_;
    }

    /// An expected snapshot is a current-HEAD page token. It protects traversal
    /// from silent reorder/remove between calls, but is not a historical as-of
    /// query: after HEAD changes, callers restart with the new snapshot.
    function readPage(bytes32 edition, bytes32 expectedSnapshot, uint256 offset, uint256 limit)
        external view returns (Entry[] memory page, uint256 nextOffset, uint256 total) {
        if (limit == 0 || limit > MAX_ENTRIES) revert E_PAGE();
        bytes32 bindingKey = Keys.binding(curatorPrincipal, Keys.position(headPurpose, edition, bytes32(0)));
        (uint8 state,,,,, bytes32 currentSnapshot) = ledger.head(bindingKey);
        if (state != 1 || expectedSnapshot == bytes32(0) || currentSnapshot != expectedSnapshot) revert E_STALE();
        (bytes32 actualType, uint64 first,, bytes memory body) = ledger.record(expectedSnapshot);
        if (first == 0 || actualType != snapshotType) revert E_PROFILE();
        (bytes32 declaredEdition, bytes32 editionSalt, EntryRef[] memory refs) = abi.decode(body, (bytes32, bytes32, EntryRef[]));
        total = refs.length;
        if (editionSalt == bytes32(0) || declaredEdition != edition
            || Keys.subject(curatorPrincipal, editionSalt) != edition || total > MAX_ENTRIES || offset > total) revert E_PROFILE();
        uint256 length = total - offset;
        if (length > limit) length = limit;
        page = new Entry[](length);
        for (uint256 i; i < total; ++i) {
            if (refs[i].id == bytes32(0) || refs[i].recordId == bytes32(0)
                || ledger.subjectCreatedAt(refs[i].id) == 0) revert E_PROFILE();
            for (uint256 j; j < i; ++j) if (refs[j].id == refs[i].id) revert E_PROFILE();
            EntryRef memory ref = refs[i];
            (actualType, first,, body) = ledger.record(ref.recordId);
            if (first == 0 || actualType != entryType) revert E_PROFILE();
            (bytes32 target, bytes32 inEdition, bytes32 inId, bytes32 salt, bytes32 inEditionSalt, string memory label) =
                abi.decode(body, (bytes32, bytes32, bytes32, bytes32, bytes32, string));
            if (target == bytes32(0) || inEdition != edition || inId != ref.id || inEditionSalt != editionSalt
                || Keys.subject(curatorPrincipal, salt) != ref.id) revert E_PROFILE();
            if (i >= offset && i < offset + length) page[i - offset] = Entry(ref.id, target, label);
        }
        nextOffset = offset + length == total ? 0 : offset + length;
    }
}
