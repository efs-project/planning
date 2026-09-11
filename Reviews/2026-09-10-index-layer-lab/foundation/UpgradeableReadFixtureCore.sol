// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {UpgradeableFixtureCore} from "./UpgradeableFixtureCore.sol";
import {UpgradeStorage} from "./UpgradeStorage.sol";
import {UpgradeQueryReadLibrary} from "./UpgradeQueryReadLibrary.sol";
import {PointReadLibrary} from "C0Core/PointReadLibrary.sol";
import {BindingFold} from "C0Core/BindingFold.sol";
import {StateBindingReads} from "C0Core/StateBindingReads.sol";
import {StateAuditPages} from "C0Core/StateAuditPages.sol";
import {LensPlan} from "C0Core/LensPlan.sol";
import {StorageByteView} from "C0Core/StorageByteView.sol";

/// @notice Disposable observed-active-execution read profile. Raw inherited ports
/// remain diagnostics. Linked readers are trusted Store-authorized code, not plugins.
contract UpgradeableReadFixtureCore is UpgradeableFixtureCore {
    address public immutable pointReadLibrary;
    bytes32 public immutable pointReadCodehash;
    address public immutable queryReadLibrary;
    bytes32 public immutable queryReadCodehash;
    error ReadCodeMismatch(uint8 role);
    error PlanUnavailable(bytes32 planRecordId);
    error PlanMalformed(bytes32 planRecordId, uint8 rejectCode);
    error ResolveNotAccepted(uint8 presence, uint8 reasonCode);
    error ErrReadState(bytes32 subject);
    error ErrReadOrdinal(uint64 ordinal);
    error ErrReadHistory(uint32 fromRevision, uint16 limit);
    error ErrPageCursor(uint256 cursor);
    error ErrPageBasis(uint64 requestedBasis, uint64 currentHighWater);
    error ErrIndexQueryUnsupported(bytes32 typeSchemaId, uint8 indexKind, uint8 indexOrdinal, bytes32 valueKey);

    constructor(address factory, address helper, bytes32 pointReadHash, bytes32 queryReadHash)
        UpgradeableFixtureCore(factory, helper)
    {
        if (address(PointReadLibrary).code.length == 0 || address(PointReadLibrary).codehash != pointReadHash) {
            revert ReadCodeMismatch(1);
        }
        if (
            address(UpgradeQueryReadLibrary).code.length == 0
                || address(UpgradeQueryReadLibrary).codehash != queryReadHash
        ) revert ReadCodeMismatch(2);
        pointReadLibrary = address(PointReadLibrary);
        pointReadCodehash = pointReadHash;
        queryReadLibrary = address(UpgradeQueryReadLibrary);
        queryReadCodehash = queryReadHash;
    }

    function _readBasis() internal view returns (UpgradeStorage.ExecutionSet memory e) {
        if (address(PointReadLibrary).code.length == 0 || address(PointReadLibrary).codehash != pointReadCodehash) {
            revert ReadCodeMismatch(1);
        }
        if (
            address(UpgradeQueryReadLibrary).code.length == 0
                || address(UpgradeQueryReadLibrary).codehash != queryReadCodehash
        ) revert ReadCodeMismatch(2);
        return _execution(currentRevision());
    }

    function fixtureReadContext()
        external
        view
        returns (bytes32 executionSetId, uint32 revision, uint64 blockNumber, uint64 admissionHigh)
    {
        UpgradeStorage.ExecutionSet memory e = _readBasis();
        if (block.number > type(uint64).max) revert StorageByteView.ErrReadState(e.id);
        // Checked immediately above before narrowing the executing block.
        // forge-lint: disable-next-line(unsafe-typecast)
        return (e.id, e.ordinal, uint64(block.number), UpgradeStorage.efs().count.admissions);
    }

    function getTypeSchema(bytes32 typeId) external view returns (bytes memory, uint48, uint64, uint8, uint8) {
        _readBasis();
        return PointReadLibrary.getTypeSchema(UpgradeStorage.efs(), typeId);
    }

    function getTypeOrigin(bytes32 typeId) external view returns (bytes32, uint16, bool) {
        _readBasis();
        return PointReadLibrary.getTypeOrigin(UpgradeStorage.efs(), typeId);
    }

    function intrinsicTypeGroupBytes() external view returns (bytes memory) {
        _readBasis();
        return PointReadLibrary.intrinsicTypeGroupBytes(UpgradeStorage.efs());
    }

    function getRecord(bytes32 recordId) external view returns (bytes32, bytes memory, uint64) {
        _readBasis();
        return PointReadLibrary.getRecord(UpgradeStorage.efs(), recordId);
    }

    function getEnvelope(bytes32 envelopeId) external view returns (bytes memory, uint48, uint16, bytes32, uint64) {
        _readBasis();
        return PointReadLibrary.getEnvelope(UpgradeStorage.efs(), envelopeId);
    }

    function getOccurrence(bytes32 envelopeId, uint16 leafIndex)
        external
        view
        returns (uint8, uint64, bytes32, bytes32, bytes32, uint64)
    {
        _readBasis();
        return PointReadLibrary.getOccurrence(UpgradeStorage.efs(), envelopeId, leafIndex);
    }

    function getOccurrenceByOrdinal(uint64 ordinal)
        external
        view
        returns (bytes32, uint16, bytes32, bytes32, bytes32, uint8, uint64)
    {
        _readBasis();
        return PointReadLibrary.getOccurrenceByOrdinal(UpgradeStorage.efs(), ordinal);
    }

    function getBindingHead(bytes32 bindingKey) external view returns (BindingFold.Head memory, bytes32, uint64) {
        bytes32 readBasis = _readBasis().id;
        return UpgradeQueryReadLibrary.getBindingHead(UpgradeStorage.efs(), readBasis, bindingKey);
    }

    function getBindingAtBasis(bytes32 bindingKey, uint64 basisOrdinal)
        external
        view
        returns (BindingFold.Head memory, bytes32, uint64)
    {
        bytes32 readBasis = _readBasis().id;
        return UpgradeQueryReadLibrary.getBindingAtBasis(UpgradeStorage.efs(), readBasis, bindingKey, basisOrdinal);
    }

    function readHistory(bytes32 bindingKey, uint32 fromRevision, uint16 limit)
        external
        view
        returns (StateBindingReads.BindingHistoryEntry[] memory, uint32, uint8)
    {
        bytes32 readBasis = _readBasis().id;
        return UpgradeQueryReadLibrary.readHistory(UpgradeStorage.efs(), readBasis, bindingKey, fromRevision, limit);
    }

    function pagePostings(
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        StateAuditPages.PageRequest memory req
    ) external view returns (StateAuditPages.PageResult memory) {
        bytes32 readBasis = _readBasis().id;
        return
            UpgradeQueryReadLibrary.pagePostings(UpgradeStorage.efs(), readBasis, T, kind, indexOrdinal, valueKey, req);
    }

    function pagePostingsHydrated(
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        StateAuditPages.PageRequest memory req
    ) external view returns (StateAuditPages.PageResult memory, StateAuditPages.HydratedItem[] memory) {
        bytes32 readBasis = _readBasis().id;
        return UpgradeQueryReadLibrary.pagePostingsHydrated(
            UpgradeStorage.efs(), readBasis, T, kind, indexOrdinal, valueKey, req
        );
    }

    function counts(bytes32 T, uint8 kind, uint8 indexOrdinal, bytes32 valueKey)
        external
        view
        returns (uint64, uint64, uint64, bytes32, uint64)
    {
        bytes32 readBasis = _readBasis().id;
        return UpgradeQueryReadLibrary.counts(UpgradeStorage.efs(), readBasis, T, kind, indexOrdinal, valueKey);
    }

    function resolve(bytes32 planRecordId, bytes32 positionKey) external view returns (LensPlan.ResolveResult memory) {
        bytes32 readBasis = _readBasis().id;
        return UpgradeQueryReadLibrary.resolve(UpgradeStorage.efs(), readBasis, planRecordId, positionKey);
    }

    function resolveStrict(bytes32 planRecordId, bytes32 positionKey, uint8 acceptMask)
        external
        view
        returns (LensPlan.ResolvedTarget memory, LensPlan.ResolveResult memory)
    {
        bytes32 readBasis = _readBasis().id;
        return
            UpgradeQueryReadLibrary.resolveStrict(
                UpgradeStorage.efs(), readBasis, planRecordId, positionKey, acceptMask
            );
    }

    function validatePlan(bytes32 planRecordId) external view returns (bool, uint8) {
        bytes32 readBasis = _readBasis().id;
        return UpgradeQueryReadLibrary.validatePlan(UpgradeStorage.efs(), readBasis, planRecordId);
    }

    function deriveBindingKey(bytes32 principalId, bytes32 positionKey) external pure returns (bytes32) {
        return LensPlan.deriveBindingKey(principalId, positionKey);
    }
}

contract UpgradeableReadFixtureCoreU2 is UpgradeableReadFixtureCore {
    constructor(address factory, address helper, bytes32 pointReadHash, bytes32 queryReadHash)
        UpgradeableReadFixtureCore(factory, helper, pointReadHash, queryReadHash)
    {}

    function migratePresentation(string calldata label, bool fail) external {
        _migrate(label, fail);
    }

    function presentationLabel() external view returns (string memory) {
        return UpgradeStorage.presentation().label;
    }
}
