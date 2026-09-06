// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {C0PlanCodec} from "../src/C0PlanCodec.sol";
import {C0BatchEvidence} from "../src/C0BatchEvidence.sol";
import {StateKernel} from "../src/StateKernel.sol";

contract C0CodecHarness {
    function publicationDigest(StateKernel.EnvelopeHeader memory header, bytes32[] memory recordIds)
        external
        pure
        returns (bytes32)
    {
        return C0PlanCodec.publicationDigest(header, recordIds);
    }

    function expectedRevisionsHash(StateKernel.ExpectedRevision[] memory rows) external pure returns (bytes32) {
        return C0PlanCodec.expectedRevisionsHash(rows);
    }

    function effectsHash(C0PlanCodec.Effects memory effects) external pure returns (bytes32) {
        return C0PlanCodec.effectsHash(effects);
    }

    function domainSeparator(uint256 chainId, address core) external pure returns (bytes32) {
        return C0PlanCodec.domainSeparator(chainId, core);
    }

    function planStructHash(C0PlanCodec.Plan memory plan) external pure returns (bytes32) {
        return C0PlanCodec.planStructHash(plan);
    }

    function planDigest(C0PlanCodec.Plan memory plan, uint256 chainId, address core) external pure returns (bytes32) {
        return C0PlanCodec.planDigest(plan, chainId, core);
    }

    function encodePlan(C0PlanCodec.Plan memory plan) external pure returns (bytes memory) {
        return C0PlanCodec.encodePlan(plan);
    }

    function encodeEffects(C0PlanCodec.Effects memory effects) external pure returns (bytes memory) {
        return C0PlanCodec.encodeEffects(effects);
    }

    function encodeEvidence(C0BatchEvidence.Evidence memory evidence) external pure returns (bytes memory) {
        return C0BatchEvidence.encode(evidence);
    }
}
