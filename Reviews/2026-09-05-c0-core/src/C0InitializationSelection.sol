// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Pure C0 configuration selection codec; caller authority is checked by the future initializer.
library C0InitializationSelection {
    struct Selection {
        uint16 initConfigVersion;
        uint8 finalityRuleKind;
        uint32 finalityParam;
        uint8 upgradeAuthorityKind;
        bytes32 upgradeAuthorityRef;
        uint64 declaredTxGasLimit;
        bytes32 nullPolicyHash;
        address bootstrapExecutor;
    }

    error InvalidInitializationSelection();

    bytes32 private constant DOM_SELECTION = keccak256("efs2/mvp-c0/initialization-selection/1");
    bytes32 private constant DOM_NULL_POLICY = keccak256("efs2/mvp-c0/null-policy/1");
    bytes32 private constant DOM_INITIAL_POLICY = keccak256("efs2/mvp-c0/initial-policy/1");
    uint64 private constant MIN_DECLARED_TX_GAS = 16_777_216;

    function _check(bool ok) private pure {
        if (!ok) revert InvalidInitializationSelection();
    }

    function nullPolicyBytes() internal pure returns (bytes memory) {
        return abi.encode(DOM_NULL_POLICY);
    }

    function _validate(Selection memory value) private pure {
        _check(value.initConfigVersion == 1 && value.finalityRuleKind <= 3);
        _check(value.finalityRuleKind == 2 ? value.finalityParam > 0 : value.finalityParam == 0);
        _check(value.upgradeAuthorityKind == 0 && value.upgradeAuthorityRef == 0);
        _check(value.declaredTxGasLimit >= MIN_DECLARED_TX_GAS);
        _check(value.nullPolicyHash == keccak256(nullPolicyBytes()));
        _check(value.bootstrapExecutor != address(0));
    }

    function encode(Selection memory value) internal pure returns (bytes memory) {
        _validate(value);
        return abi.encode(
            DOM_SELECTION,
            value.initConfigVersion,
            value.finalityRuleKind,
            value.finalityParam,
            value.upgradeAuthorityKind,
            value.upgradeAuthorityRef,
            value.declaredTxGasLimit,
            value.nullPolicyHash,
            value.bootstrapExecutor
        );
    }

    function decode(bytes calldata encoded) internal pure returns (Selection memory value) {
        if (encoded.length != 288) revert InvalidInitializationSelection();
        bytes32 domain;
        (
            domain,
            value.initConfigVersion,
            value.finalityRuleKind,
            value.finalityParam,
            value.upgradeAuthorityKind,
            value.upgradeAuthorityRef,
            value.declaredTxGasLimit,
            value.nullPolicyHash,
            value.bootstrapExecutor
        ) = abi.decode(encoded, (bytes32, uint16, uint8, uint32, uint8, bytes32, uint64, bytes32, address));
        _check(domain == DOM_SELECTION);
        _validate(value);
        _check(keccak256(encoded) == keccak256(encode(value)));
    }

    function open(bytes calldata encoded, bytes32 expectedDigest) internal pure returns (Selection memory value) {
        value = decode(encoded);
        _check(expectedDigest != 0 && keccak256(encoded) == expectedDigest);
    }

    function initConfig(Selection memory value, bytes32 experimentCommitment) internal pure returns (bytes memory) {
        _validate(value);
        _check(experimentCommitment != 0);
        bytes32 policy = keccak256(abi.encode(DOM_INITIAL_POLICY, value.nullPolicyHash, experimentCommitment));
        return abi.encode(
            value.initConfigVersion,
            value.finalityRuleKind,
            value.finalityParam,
            value.upgradeAuthorityKind,
            value.upgradeAuthorityRef,
            value.declaredTxGasLimit,
            policy
        );
    }

    function requireInitConfig(bytes calldata encoded, Selection memory value, bytes32 experimentCommitment)
        internal
        pure
    {
        if (encoded.length != 224) revert InvalidInitializationSelection();
        _check(keccak256(encoded) == keccak256(initConfig(value, experimentCommitment)));
    }
}
