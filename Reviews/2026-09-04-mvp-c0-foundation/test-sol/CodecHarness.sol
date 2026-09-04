// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {C0RunCodec} from "../src/C0RunCodec.sol";

/// @notice ABI-callable codec only. No admission state or Core impersonation.
contract CodecHarness {
    function encodeSeed(C0RunCodec.SeedInputs memory s) external pure returns (bytes memory) {
        return C0RunCodec.encodeSeed(s);
    }

    function decodeSeed(bytes memory b) external pure returns (C0RunCodec.SeedInputs memory) {
        return C0RunCodec.decodeSeed(b);
    }

    function seedInputsHash(C0RunCodec.SeedInputs memory s) external pure returns (bytes32) {
        return C0RunCodec.seedInputsHash(s);
    }

    function experimentSeed(C0RunCodec.SeedInputs memory s) external pure returns (bytes32) {
        return C0RunCodec.experimentSeed(s);
    }

    function encodeDeployment(C0RunCodec.Deployment memory d) external pure returns (bytes memory) {
        return C0RunCodec.encodeDeployment(d);
    }

    function decodeDeployment(bytes memory b) external pure returns (C0RunCodec.Deployment memory) {
        return C0RunCodec.decodeDeployment(b);
    }

    function deploymentHash(C0RunCodec.Deployment memory d) external pure returns (bytes32) {
        return C0RunCodec.deploymentHash(d);
    }

    function experimentCommitment(C0RunCodec.Deployment memory d) external pure returns (bytes32) {
        return C0RunCodec.experimentCommitment(d);
    }

    function c0ProfileId(bytes32 c) external pure returns (bytes32) {
        return C0RunCodec.c0ProfileId(c);
    }
}
