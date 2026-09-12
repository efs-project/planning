// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract LegacyUint256Validator {
    function validate(bytes calldata body) external pure returns (bool) {
        return body.length == 32;
    }
}

/// @notice Canonical ABI bytes (also the byte representation of an ABI string).
/// Does not promise UTF-8 validity; applications choose text interpretation.
contract LegacyBytesValidator {
    function validate(bytes calldata body) external pure returns (bool) {
        if (body.length < 64) return false;
        uint256 offset;
        uint256 length;
        assembly {
            offset := calldataload(body.offset)
            length := calldataload(add(body.offset, 32))
        }
        if (offset != 32 || length > body.length - 64) return false;
        // Intentional ceiling to a 32-byte ABI word, not a precision-sensitive ratio.
        // forge-lint: disable-next-line(divide-before-multiply)
        if (body.length != 64 + ((length + 31) / 32) * 32) return false;
        for (uint256 i = 64 + length; i < body.length; ++i) {
            if (body[i] != 0) return false;
        }
        return true;
    }
}

/// @notice Experimental exact types. Only these reviewed stateless runtimes are supported.
/// Registration is permissionless; selecting arbitrary developer validator programs is not.
contract LegacyExactTypeRegistry {
    struct TypeInfo {
        bytes32 schemaHash;
        address validator;
        bytes32 codeHash;
    }
    uint256 public constant VALIDATOR_GAS = 50_000;
    uint256 public constant MAX_DESCRIPTOR = 1024;
    bytes32 public constant TYPE_DOMAIN = keccak256("EFS21_TYPE_V1");
    mapping(bytes32 => TypeInfo) private types;
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
            codeHash != keccak256(type(LegacyUint256Validator).runtimeCode)
                && codeHash != keccak256(type(LegacyBytesValidator).runtimeCode)
        ) revert UnsupportedValidator();
        // Local execution address is not part of portable identity. Equal supported code has
        // no constructor/storage/dependency configuration and cannot reinterpret the schema.
        id = keccak256(abi.encode(TYPE_DOMAIN, schemaHash, codeHash));
        if (types[id].validator == address(0)) {
            types[id] = TypeInfo(schemaHash, validator, codeHash);
            descriptors[id] = descriptor;
        }
    }

    function descriptorOf(bytes32 id) external view returns (bytes memory) {
        if (types[id].validator == address(0)) revert UnknownType();
        return descriptors[id];
    }

    function validate(bytes32 id, bytes calldata body) external view {
        TypeInfo storage info = types[id];
        if (info.validator == address(0)) revert UnknownType();
        if (info.validator.codehash != info.codeHash) revert ValidatorCodeChanged();
        if (!_boundedValidate(info.validator, body)) revert InvalidBody();
    }

    function typeInfo(bytes32 id) external view returns (TypeInfo memory info) {
        info = types[id];
        if (info.validator == address(0)) revert UnknownType();
    }

    function _boundedValidate(address validator, bytes memory body) internal view returns (bool valid) {
        bytes memory input = abi.encodeWithSelector(LegacyUint256Validator.validate.selector, body);
        uint256 gasLimit = VALIDATOR_GAS;
        // Fixed 32-byte copy, exact returndata length and canonical ABI bool. Never copy a bomb.
        assembly ("memory-safe") {
            let out := mload(0x40)
            mstore(out, 0)
            let ok := staticcall(gasLimit, validator, add(input, 32), mload(input), out, 32)
            valid := and(and(ok, eq(returndatasize(), 32)), eq(mload(out), 1))
        }
    }
}
