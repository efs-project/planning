// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {C0PlanCodec} from "../src/C0PlanCodec.sol";
import {C0Request} from "../src/C0Request.sol";
import {StateKernel} from "../src/StateKernel.sol";

contract C0RequestHarness {
    struct AccountPrincipal {
        uint8 authorityKind;
        bytes originRef;
        bytes accountOrKey;
    }

    uint64 private immutable FILE_CAP;

    constructor(uint64 fileCap) {
        FILE_CAP = fileCap;
    }

    /// Test-only full-layout transport. Effects, Plan, branch, Principal and
    /// witness are intentionally neither authenticated nor consumed here.
    function inspectBoundsForTest(
        StateKernel.EnvelopeHeader calldata header,
        bytes32[] calldata recordIds,
        StateKernel.SelectedLeaf[] calldata selectedLeaves,
        StateKernel.ExpectedRevision[] calldata expectedRevisions,
        C0PlanCodec.Effects calldata,
        C0PlanCodec.Plan calldata,
        uint8,
        AccountPrincipal calldata,
        bytes calldata,
        bytes calldata payload
    ) external view returns (C0Request.Prepared memory) {
        return C0Request.prepare(header, recordIds, selectedLeaves, expectedRevisions, payload.length, FILE_CAP);
    }

    function limitForTest(uint64 fileCap) external pure returns (uint256) {
        return C0Request.maxCallBytes(fileCap);
    }
}
