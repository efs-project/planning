// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ITypeRegistry} from "./Interfaces.sol";

/// @title TypeRegistry — minimal Type table for the lab
/// @notice DISPOSABLE LAB, NO PROTOCOL CLAIM. A Type id here is any nonzero bytes32 chosen
///         by the admin (the v2 typeschema-group derivation is out of scope; records stay
///         portable as long as the same typeId is used). Each Type pins an acceptor address
///         AND its codehash (the Ledger refuses a changed acceptor), and declares how many
///         leading 32-byte words of a body are checked references and which Type each must
///         have. Binding roles under a purpose can demand a target Type too.
///         Re-registration is allowed on purpose: the dedup/reuse tests change a rule after
///         a record was accepted and require the re-admission to be re-checked.
contract TypeRegistry is ITypeRegistry {
    struct TypeInfo {
        bool registered;
        address acceptor;
        bytes32 acceptorCodehash;
        uint8 refCount;
        uint64 registeredAt;
    }

    address public immutable admin;
    uint64 public epoch; // rules epoch: bumped by every register / setBindingRefType
    mapping(bytes32 => TypeInfo) private _types;
    mapping(bytes32 => bytes32[]) private _refTypes; // typeId => expected Type per leading body word
    mapping(bytes32 => mapping(bytes32 => bytes32)) private _bindingRefTypes; // purpose => role => expected Type

    event TypeRegistered(bytes32 indexed typeId, address acceptor, bytes32 acceptorCodehash, uint8 refCount);
    event BindingRoleSet(bytes32 indexed purpose, bytes32 indexed role, bytes32 expectedType);

    error E_ADMIN();
    error E_TYPE_ID();
    error E_ACCEPTOR_CODE();
    error E_TOO_MANY_REFS();

    constructor() {
        admin = msg.sender;
    }

    function register(bytes32 typeId, address acceptor, bytes32[] calldata expectedRefTypes) external {
        if (msg.sender != admin) revert E_ADMIN();
        if (typeId == bytes32(0)) revert E_TYPE_ID();
        if (expectedRefTypes.length > 8) revert E_TOO_MANY_REFS();
        bytes32 codehash;
        if (acceptor != address(0)) {
            if (acceptor.code.length == 0) revert E_ACCEPTOR_CODE();
            codehash = acceptor.codehash;
        }
        _types[typeId] = TypeInfo(true, acceptor, codehash, uint8(expectedRefTypes.length), uint64(block.number));
        _refTypes[typeId] = expectedRefTypes;
        ++epoch;
        emit TypeRegistered(typeId, acceptor, codehash, uint8(expectedRefTypes.length));
    }

    function setBindingRefType(bytes32 purpose, bytes32 role, bytes32 expectedType) external {
        if (msg.sender != admin) revert E_ADMIN();
        _bindingRefTypes[purpose][role] = expectedType;
        ++epoch;
        emit BindingRoleSet(purpose, role, expectedType);
    }

    function typeInfo(bytes32 typeId)
        external
        view
        returns (bool registered, address acceptor, bytes32 acceptorCodehash, uint8 refCount)
    {
        TypeInfo storage t = _types[typeId];
        return (t.registered, t.acceptor, t.acceptorCodehash, t.refCount);
    }

    function refTypes(bytes32 typeId) external view returns (bytes32[] memory) {
        return _refTypes[typeId];
    }

    function bindingRefType(bytes32 purpose, bytes32 role) external view returns (bytes32) {
        return _bindingRefTypes[purpose][role];
    }
}
