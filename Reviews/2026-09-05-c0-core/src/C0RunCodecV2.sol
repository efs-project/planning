// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {C0RunCodec} from "C0Admission/../../2026-09-04-mvp-c0-foundation/src/C0RunCodec.sol";

/// @notice Pure V2 run framing only; this neither observes code nor authorizes initialization.
library C0RunCodecV2 {
    struct Seed {
        C0RunCodec.SeedInputs base;
        bytes32 admissionLibraryCreate2Salt;
        bytes32 preparationHelperCreate2Salt;
        bytes32 admissionCreationCodeTemplateHash;
        bytes32 preparationCreationCodeTemplateHash;
        bytes32 coreLinkReferencesHash;
    }

    struct Component {
        address account;
        bytes32 create2Salt;
        bytes32 initCodeHash;
        bytes32 runtimeCodeHash;
    }

    struct Deployment {
        bytes32 experimentSeed;
        Component core;
        Component byteStore;
        Component admissionLibrary;
        Component preparationHelper;
    }

    error InvalidRunV2();

    bytes32 private constant DOM_EXPERIMENT_SEED = keccak256("efs2/mvp-c0/experiment-seed/2");
    bytes32 private constant DOM_EXPERIMENT_DEPLOYMENT = keccak256("efs2/mvp-c0/experiment-deployment/2");
    bytes32 private constant DOM_C0_PROFILE = keccak256("efs2/mvp-c0/profile/1");
    bytes32 private constant RESERVED_SELECTION_LABEL = keccak256("c0/init-selection/1");

    function _check(bool ok) private pure {
        if (!ok) revert InvalidRunV2();
    }

    function _validateSuffix(Seed memory value) private pure {
        _check(
            value.admissionCreationCodeTemplateHash != 0 && value.preparationCreationCodeTemplateHash != 0
                && value.coreLinkReferencesHash != 0
        );
    }

    function _selectionDigest(C0RunCodec.SeedInputs memory value) private pure returns (bytes32 digest) {
        uint256 matches;
        for (uint256 i; i < value.sourceCommitments.length; ++i) {
            if (keccak256(bytes(value.sourceCommitments[i].label)) == RESERVED_SELECTION_LABEL) {
                ++matches;
                digest = value.sourceCommitments[i].digest;
            }
        }
        _check(matches == 1 && digest != 0);
    }

    function encodeSeed(Seed memory value) internal pure returns (bytes memory encoded) {
        bytes memory base = C0RunCodec.encodeSeed(value.base);
        _validateSuffix(value);
        _selectionDigest(value.base);
        encoded = bytes.concat(
            hex"0002",
            base,
            value.admissionLibraryCreate2Salt,
            value.preparationHelperCreate2Salt,
            value.admissionCreationCodeTemplateHash,
            value.preparationCreationCodeTemplateHash,
            value.coreLinkReferencesHash
        );
        _check(encoded.length >= 712 && encoded.length <= 13_690);
    }

    function decodeSeed(bytes calldata encoded) internal pure returns (Seed memory value) {
        if (encoded.length < 712 || encoded.length > 13_690) revert InvalidRunV2();
        if (uint16(bytes2(encoded[0:2])) != 2) revert InvalidRunV2();
        uint256 end = encoded.length - 160;
        value.base = C0RunCodec.decodeSeed(encoded[2:end]);
        value.admissionLibraryCreate2Salt = bytes32(encoded[end:end + 32]);
        value.preparationHelperCreate2Salt = bytes32(encoded[end + 32:end + 64]);
        value.admissionCreationCodeTemplateHash = bytes32(encoded[end + 64:end + 96]);
        value.preparationCreationCodeTemplateHash = bytes32(encoded[end + 96:end + 128]);
        value.coreLinkReferencesHash = bytes32(encoded[end + 128:end + 160]);
        _validateSuffix(value);
        _selectionDigest(value.base);
    }

    function experimentSeed(Seed memory value) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_EXPERIMENT_SEED, keccak256(encodeSeed(value))));
    }

    function _validateComponent(Component memory value) private pure {
        _check(value.account != address(0) && value.initCodeHash != 0 && value.runtimeCodeHash != 0);
    }

    function _validateDeployment(Deployment memory value) private pure {
        _check(value.experimentSeed != 0);
        _validateComponent(value.core);
        _validateComponent(value.byteStore);
        _validateComponent(value.admissionLibrary);
        _validateComponent(value.preparationHelper);
        address[4] memory accounts = [
            value.core.account, value.byteStore.account, value.admissionLibrary.account, value.preparationHelper.account
        ];
        for (uint256 left; left < accounts.length; ++left) {
            for (uint256 right = left + 1; right < accounts.length; ++right) {
                _check(accounts[left] != accounts[right]);
            }
        }
    }

    function _componentBytes(Component memory value) private pure returns (bytes memory) {
        return abi.encodePacked(value.account, value.create2Salt, value.initCodeHash, value.runtimeCodeHash);
    }

    function encodeDeployment(Deployment memory value) internal pure returns (bytes memory encoded) {
        _validateDeployment(value);
        encoded = bytes.concat(
            hex"0002",
            value.experimentSeed,
            _componentBytes(value.core),
            _componentBytes(value.byteStore),
            _componentBytes(value.admissionLibrary),
            _componentBytes(value.preparationHelper)
        );
        assert(encoded.length == 498);
    }

    function _decodeComponent(bytes calldata encoded, uint256 position) private pure returns (Component memory value) {
        value.account = address(bytes20(encoded[position:position + 20]));
        value.create2Salt = bytes32(encoded[position + 20:position + 52]);
        value.initCodeHash = bytes32(encoded[position + 52:position + 84]);
        value.runtimeCodeHash = bytes32(encoded[position + 84:position + 116]);
    }

    function decodeDeployment(bytes calldata encoded) internal pure returns (Deployment memory value) {
        if (encoded.length != 498 || uint16(bytes2(encoded[0:2])) != 2) revert InvalidRunV2();
        value.experimentSeed = bytes32(encoded[2:34]);
        value.core = _decodeComponent(encoded, 34);
        value.byteStore = _decodeComponent(encoded, 150);
        value.admissionLibrary = _decodeComponent(encoded, 266);
        value.preparationHelper = _decodeComponent(encoded, 382);
        _validateDeployment(value);
        _check(keccak256(encoded) == keccak256(encodeDeployment(value)));
    }

    function experimentCommitment(Deployment memory value) internal pure returns (bytes32) {
        bytes memory encoded = encodeDeployment(value);
        return keccak256(abi.encode(DOM_EXPERIMENT_DEPLOYMENT, value.experimentSeed, keccak256(encoded)));
    }

    function c0ProfileId(bytes32 commitment) internal pure returns (bytes32) {
        _check(commitment != 0);
        return keccak256(abi.encode(DOM_C0_PROFILE, commitment));
    }

    function selectionDigest(Seed memory value) internal pure returns (bytes32) {
        C0RunCodec.encodeSeed(value.base);
        _validateSuffix(value);
        return _selectionDigest(value.base);
    }
}
