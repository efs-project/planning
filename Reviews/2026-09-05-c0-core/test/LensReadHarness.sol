// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AuditPageReadHarness} from "./AuditPageReadHarness.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StateStore} from "../src/StateStore.sol";
import {BindingFold} from "../src/BindingFold.sol";
import {LensPlan} from "../src/LensPlan.sol";
import {QueryReadLibrary} from "../src/QueryReadLibrary.sol";
import {CacheCodeForTest} from "./CacheCodeForTest.sol";

contract LensReadHarness is AuditPageReadHarness {
    // External-library errors do not automatically enter the host artifact ABI.
    error PlanUnavailable(bytes32 planRecordId);
    error PlanMalformed(bytes32 planRecordId, uint8 rejectCode);
    error ResolveNotAccepted(uint8 presence, uint8 reasonCode);
    constructor(
        StateKernel.Init memory init,
        address helper,
        bytes32 helperHash,
        bytes32 libraryHash,
        bytes32 pointReadHash,
        bytes32 queryReadHash
    ) AuditPageReadHarness(init, helper, helperHash, libraryHash, pointReadHash, queryReadHash) {}

    function resolve(bytes32 planRecordId, bytes32 positionKey) external view returns (LensPlan.ResolveResult memory) {
        _requireQueryRead();
        return QueryReadLibrary.resolve(s, planRecordId, positionKey);
    }

    function resolveStrict(bytes32 planRecordId, bytes32 positionKey, uint8 acceptMask)
        external
        view
        returns (LensPlan.ResolvedTarget memory, LensPlan.ResolveResult memory)
    {
        _requireQueryRead();
        return QueryReadLibrary.resolveStrict(s, planRecordId, positionKey, acceptMask);
    }

    function validatePlan(bytes32 planRecordId) external view returns (bool, uint8) {
        _requireQueryRead();
        return QueryReadLibrary.validatePlan(s, planRecordId);
    }

    function deriveBindingKey(bytes32 principalId, bytes32 positionKey) external pure returns (bytes32) {
        return LensPlan.deriveBindingKey(principalId, positionKey);
    }
}

/// @notice Seeded hostile-store fixtures ONLY, never normal deployment measurements.
contract SyntheticLensReadHarness is LensReadHarness {
    constructor(
        StateKernel.Init memory init,
        address helper,
        bytes32 helperHash,
        bytes32 libraryHash,
        bytes32 pointReadHash,
        bytes32 queryReadHash
    ) LensReadHarness(init, helper, helperHash, libraryHash, pointReadHash, queryReadHash) {}

    function seedPlanForTest(bytes32 typeId, bytes memory body) external returns (bytes32 id) {
        id = keccak256(abi.encode(keccak256("efs2/record/1"), typeId, keccak256(body)));
        s.count.admissions = 100;
        s.count.types = 2;
        s.types[typeId].typeOrdinal = 2;
        ++s.count.records;
        s.records[id] = CacheCodeForTest.recordCell(typeId, body, s.count.records, 1);
        s.recordIds[s.count.records] = id;
    }

    function seedHeadForTest(bytes32 key, BindingFold.Head memory h) external {
        (uint256 meta, bytes32 target) = BindingFold.pack(h);
        s.bindings[key] = StateStore.BindingRow(meta, target);
    }

    function corruptHeadForTest(bytes32 key) external {
        s.bindings[key].meta = uint256(1) << 255;
    }

    function corruptBodyForTest(bytes32 id) external {
        bytes memory body = StateStore.recordRow(s, id).body;
        body[34] = 0xff;
        s.records[id].byteRef = CacheCodeForTest.recordReference(body);
    }
}
