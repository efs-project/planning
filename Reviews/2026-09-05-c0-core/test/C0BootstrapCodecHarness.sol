// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {C0RunCodec} from "C0Admission/../../2026-09-04-mvp-c0-foundation/src/C0RunCodec.sol";
import {C0RunCodecV2} from "../src/C0RunCodecV2.sol";
import {C0InitializationSelection} from "../src/C0InitializationSelection.sol";

contract C0BootstrapCodecHarness {
    function encodeSeed(C0RunCodecV2.Seed memory value) external pure returns (bytes memory) {
        return C0RunCodecV2.encodeSeed(value);
    }

    function decodeSeed(bytes calldata encoded) external pure returns (C0RunCodecV2.Seed memory) {
        return C0RunCodecV2.decodeSeed(encoded);
    }

    function experimentSeed(C0RunCodecV2.Seed memory value) external pure returns (bytes32) {
        return C0RunCodecV2.experimentSeed(value);
    }

    function encodeDeployment(C0RunCodecV2.Deployment memory value) external pure returns (bytes memory) {
        return C0RunCodecV2.encodeDeployment(value);
    }

    function decodeDeployment(bytes calldata encoded) external pure returns (C0RunCodecV2.Deployment memory) {
        return C0RunCodecV2.decodeDeployment(encoded);
    }

    function experimentCommitment(C0RunCodecV2.Deployment memory value) external pure returns (bytes32) {
        return C0RunCodecV2.experimentCommitment(value);
    }

    function c0ProfileId(bytes32 commitment) external pure returns (bytes32) {
        return C0RunCodecV2.c0ProfileId(commitment);
    }

    function selectionDigest(C0RunCodecV2.Seed memory value) external pure returns (bytes32) {
        return C0RunCodecV2.selectionDigest(value);
    }

    function encodeSelection(C0InitializationSelection.Selection memory value) external pure returns (bytes memory) {
        return C0InitializationSelection.encode(value);
    }

    function decodeSelection(bytes calldata encoded)
        external
        pure
        returns (C0InitializationSelection.Selection memory)
    {
        return C0InitializationSelection.decode(encoded);
    }

    function openSelection(bytes calldata encoded, bytes32 expectedDigest)
        external
        pure
        returns (C0InitializationSelection.Selection memory)
    {
        return C0InitializationSelection.open(encoded, expectedDigest);
    }

    function nullPolicyBytes() external pure returns (bytes memory) {
        return C0InitializationSelection.nullPolicyBytes();
    }

    function initConfig(C0InitializationSelection.Selection memory value, bytes32 deploymentCommitment)
        external
        pure
        returns (bytes memory)
    {
        return C0InitializationSelection.initConfig(value, deploymentCommitment);
    }

    function requireInitConfig(
        bytes calldata encoded,
        C0InitializationSelection.Selection memory value,
        bytes32 deploymentCommitment
    ) external pure {
        C0InitializationSelection.requireInitConfig(encoded, value, deploymentCommitment);
    }

    function decodeSeedV1(bytes memory encoded) external pure returns (C0RunCodec.SeedInputs memory) {
        return C0RunCodec.decodeSeed(encoded);
    }

    function decodeDeploymentV1(bytes memory encoded) external pure returns (C0RunCodec.Deployment memory) {
        return C0RunCodec.decodeDeployment(encoded);
    }
}
