// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {BindingReadHarness} from "./BindingReadHarness.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {QueryReadLibrary} from "../src/QueryReadLibrary.sol";
import {StateAuditPages} from "../src/StateAuditPages.sol";

contract AuditPageReadHarness is BindingReadHarness {
    constructor(
        StateKernel.Init memory init,
        address helper,
        bytes32 helperHash,
        bytes32 libraryHash,
        bytes32 pointReadHash,
        bytes32 queryReadHash
    ) BindingReadHarness(init, helper, helperHash, libraryHash, pointReadHash, queryReadHash) {}

    function pagePostings(
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        StateAuditPages.PageRequest memory req
    ) external view returns (StateAuditPages.PageResult memory) {
        _requireQueryRead();
        return QueryReadLibrary.pagePostings(s, T, kind, indexOrdinal, valueKey, req);
    }

    function pagePostingsHydrated(
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        StateAuditPages.PageRequest memory req
    ) external view returns (StateAuditPages.PageResult memory, StateAuditPages.HydratedItem[] memory) {
        _requireQueryRead();
        return QueryReadLibrary.pagePostingsHydrated(s, T, kind, indexOrdinal, valueKey, req);
    }

    function counts(bytes32 T, uint8 kind, uint8 indexOrdinal, bytes32 valueKey)
        external
        view
        returns (uint64, uint64, uint64, bytes32, uint64)
    {
        _requireQueryRead();
        return QueryReadLibrary.counts(s, T, kind, indexOrdinal, valueKey);
    }
}

/// @notice Sparse/corrupt Store fixtures only; never the normally deployed host.
contract SyntheticAuditPageReadHarness is AuditPageReadHarness {
    constructor(
        StateKernel.Init memory init,
        address helper,
        bytes32 helperHash,
        bytes32 libraryHash,
        bytes32 pointReadHash,
        bytes32 queryReadHash
    ) AuditPageReadHarness(init, helper, helperHash, libraryHash, pointReadHash, queryReadHash) {}

    function seedAuditCountForTest(uint64 H) external {
        s.count.admissions = H;
    }

    function seedAuditHeadForTest(bytes32 key, uint256 packed) external {
        s.postings[key].head = packed;
    }

    function seedAuditWordForTest(bytes32 key, uint64 wordIndex, uint256 packed) external {
        s.postingWords[key][wordIndex] = packed;
    }

    function clearAuditRevisionForTest() external {
        s.init.initialRevisionId = 0;
    }

    function clearAuditRealmForTest() external {
        s.init.realmId = 0;
    }

    function seedAuditLifecycleForTest(bytes32 envelopeId, uint256 packed) external {
        s.occurrences[keccak256(abi.encode(keccak256("efs2/occurrence/1"), envelopeId, uint256(0)))].packed = packed;
    }

    function auditWordSlotForTest(bytes32 key, uint64 wordIndex) external view returns (bytes32) {
        mapping(uint64 => uint256) storage words = s.postingWords[key];
        uint256 slot;
        assembly ("memory-safe") { slot := words.slot }
        return keccak256(abi.encode(uint256(wordIndex), slot));
    }
}
