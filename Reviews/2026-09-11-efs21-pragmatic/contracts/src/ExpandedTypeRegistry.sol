// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ExactTypeRegistry, Uint256Validator, BytesValidator} from "./ExactTypeRegistry.sol";
import {RawBytesValidator} from "./RawBytesValidator.sol";

/// @notice Fresh-world representation experiment. Same external registry seam;
/// exactly three stateless runtime hashes, not arbitrary validator programming.
/// Original validators stay in their unchanged source file to preserve metadata/TypeIds.
contract ExpandedTypeRegistry {
    uint256 public constant VALIDATOR_GAS = 50_000;
    uint256 public constant MAX_DESCRIPTOR = 1024;
    bytes32 public constant TYPE_DOMAIN = keccak256("EFS21_TYPE_V1");
    mapping(bytes32 => ExactTypeRegistry.TypeInfo) private types;
    mapping(bytes32 => bytes) private descriptors;
    error UnsupportedValidator();
    error UnknownType();
    error ValidatorCodeChanged();
    error InvalidBody();
    error InvalidDescriptor();

    function register(bytes calldata descriptor, address validator) external returns (bytes32 id) {
        if (descriptor.length == 0 || descriptor.length > MAX_DESCRIPTOR) revert InvalidDescriptor();
        bytes32 schemaHash = keccak256(descriptor);
        bytes32 codeHash = validator.codehash;
        if (
            codeHash != keccak256(type(Uint256Validator).runtimeCode)
                && codeHash != keccak256(type(BytesValidator).runtimeCode)
                && codeHash != keccak256(type(RawBytesValidator).runtimeCode)
        ) revert UnsupportedValidator();
        id = keccak256(abi.encode(TYPE_DOMAIN, schemaHash, codeHash));
        if (types[id].validator == address(0)) {
            types[id] = ExactTypeRegistry.TypeInfo(schemaHash, validator, codeHash);
            descriptors[id] = descriptor;
        }
    }

    function descriptorOf(bytes32 id) external view returns (bytes memory) {
        if (types[id].validator == address(0)) revert UnknownType();
        return descriptors[id];
    }

    function validate(bytes32 id, bytes calldata body) external view {
        ExactTypeRegistry.TypeInfo storage info = types[id];
        if (info.validator == address(0)) revert UnknownType();
        if (info.validator.codehash != info.codeHash) revert ValidatorCodeChanged();
        if (!_boundedValidate(info.validator, body)) revert InvalidBody();
    }

    function typeInfo(bytes32 id) external view returns (ExactTypeRegistry.TypeInfo memory info) {
        info = types[id];
        if (info.validator == address(0)) revert UnknownType();
    }

    function _boundedValidate(address validator, bytes memory body) internal view returns (bool valid) {
        bytes memory input = abi.encodeWithSelector(Uint256Validator.validate.selector, body);
        uint256 gasLimit = VALIDATOR_GAS;
        assembly ("memory-safe") {
            let out := mload(0x40)
            mstore(out, 0)
            let ok := staticcall(gasLimit, validator, add(input, 32), mload(input), out, 32)
            valid := and(and(ok, eq(returndatasize(), 32)), eq(mload(out), 1))
        }
    }
}
