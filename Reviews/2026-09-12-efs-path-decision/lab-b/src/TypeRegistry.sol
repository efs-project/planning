// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "./Keys.sol";
import {ITypeRegistry} from "./Interfaces.sol";

/// @title TypeRegistry — exact Type identity + separate Realm acceptance policy (lab)
/// @notice DISPOSABLE LAB, NO PROTOCOL CLAIM. Authority repair 2026-09-13 (REPAIR.md R2).
///
///         IDENTITY. A Type is its descriptor: an opaque shape commitment, the expected Type of
///         each leading checked-reference word, and the declared rule identity (the acceptor's
///         codehash at registration; 0 = no rule). The id is derived from the descriptor
///         (`Keys.typeId`), so the same descriptor is the same Type on every Realm and a changed
///         descriptor is a NEW Type. Registration under an existing id is refused: nothing about
///         a Type's identity is ever mutated in place, and a clean reader recomputes the id from
///         the retained descriptor.
///
///         POLICY. Which acceptor enforces a Type on this Realm is a separate, append-only
///         activation history per Type. `register` records activation 1 (the declared rule's
///         acceptor); `activate` appends a later one. The Ledger reads the ACTIVE activation at
///         every admission, records its index in the admission row, and the signed acceptance
///         profile binds (typeId, active codehash, epoch), so a signature made before an
///         activation is stale after it and the basis that admitted a record stays readable
///         forever (`Ledger.acceptanceBasis`). Binding-role target Types are Realm placement
///         policy, not Type identity; they stay mutable and epoch-bumping.
contract TypeRegistry is ITypeRegistry {
    /// Immutable once registered (3 slots: packed header, shape, ruleId).
    struct TypeInfo {
        bool registered;
        uint8 refCount;
        uint16 activations; // policy rows so far (>= 1 once registered)
        uint64 registeredAt;
        bytes32 shape;
        bytes32 ruleId;
    }

    /// One policy row (2 slots: packed header, codehash). Append-only.
    struct Activation {
        address acceptor;
        uint48 epoch; // global rules epoch after this activation
        uint40 activatedAt; // block number
        bytes32 acceptorCodehash;
    }

    address public immutable admin;
    uint64 public epoch; // rules epoch: bumped by every register / activate / setBindingRefType
    mapping(bytes32 => TypeInfo) private _types;
    mapping(bytes32 => bytes32[]) private _refTypes; // typeId => expected Type per leading body word
    mapping(bytes32 => mapping(uint16 => Activation)) private _activation; // typeId => 1-based index => row
    mapping(bytes32 => mapping(bytes32 => bytes32)) private _bindingRefTypes; // purpose => role => expected Type

    event TypeRegistered(bytes32 indexed typeId, bytes32 shape, bytes32 ruleId, uint8 refCount);
    event PolicyActivated(bytes32 indexed typeId, uint16 activation, address acceptor, bytes32 acceptorCodehash, uint64 epoch);
    event BindingRoleSet(bytes32 indexed purpose, bytes32 indexed role, bytes32 expectedType);

    error E_ADMIN();
    error E_TYPE_EXISTS(bytes32 typeId);
    error E_UNKNOWN_TYPE(bytes32 typeId);
    error E_ACCEPTOR_CODE();
    error E_TOO_MANY_REFS();
    error E_ACTIVATION(bytes32 typeId, uint16 index);

    constructor() {
        admin = msg.sender;
    }

    /// Register a Type by descriptor. Returns the derived exact id. Refused if that id exists
    /// (same descriptor twice); a different descriptor never collides with an existing id.
    function register(bytes32 shape, address acceptor, bytes32[] calldata expectedRefTypes)
        external
        returns (bytes32 typeId)
    {
        if (msg.sender != admin) revert E_ADMIN();
        if (expectedRefTypes.length > 8) revert E_TOO_MANY_REFS();
        bytes32 codehash = _codehashOf(acceptor);
        typeId = Keys.typeId(shape, expectedRefTypes, codehash);
        if (_types[typeId].registered) revert E_TYPE_EXISTS(typeId);
        _types[typeId] = TypeInfo(true, uint8(expectedRefTypes.length), 0, uint64(block.number), shape, codehash);
        _refTypes[typeId] = expectedRefTypes;
        emit TypeRegistered(typeId, shape, codehash, uint8(expectedRefTypes.length));
        _activate(typeId, acceptor, codehash);
    }

    /// Append a policy activation: from now on `acceptor` enforces `typeId` on this Realm. The
    /// Type's identity (descriptor, id) is untouched; earlier admissions keep their recorded basis.
    function activate(bytes32 typeId, address acceptor) external returns (uint16 activation_) {
        if (msg.sender != admin) revert E_ADMIN();
        if (!_types[typeId].registered) revert E_UNKNOWN_TYPE(typeId);
        return _activate(typeId, acceptor, _codehashOf(acceptor));
    }

    function _activate(bytes32 typeId, address acceptor, bytes32 codehash) private returns (uint16 index) {
        TypeInfo storage t = _types[typeId];
        index = t.activations + 1;
        if (index == 0) revert E_ACTIVATION(typeId, index); // uint16 wrap
        t.activations = index;
        uint64 e = ++epoch;
        _activation[typeId][index] = Activation(acceptor, uint48(e), uint40(block.number), codehash);
        emit PolicyActivated(typeId, index, acceptor, codehash, e);
    }

    function _codehashOf(address acceptor) private view returns (bytes32 codehash) {
        if (acceptor != address(0)) {
            if (acceptor.code.length == 0) revert E_ACCEPTOR_CODE();
            codehash = acceptor.codehash;
        }
    }

    function setBindingRefType(bytes32 purpose, bytes32 role, bytes32 expectedType) external {
        if (msg.sender != admin) revert E_ADMIN();
        _bindingRefTypes[purpose][role] = expectedType;
        ++epoch;
        emit BindingRoleSet(purpose, role, expectedType);
    }

    /// The id a descriptor would get (pure derivation exposed for clients and clean readers).
    function typeIdOf(bytes32 shape, address acceptor, bytes32[] calldata expectedRefTypes) external view returns (bytes32) {
        return Keys.typeId(shape, expectedRefTypes, _codehashOf(acceptor));
    }

    /// Active policy + identity refCount (what the Ledger reads at every admission).
    function typeInfo(bytes32 typeId)
        external
        view
        returns (bool registered, address acceptor, bytes32 acceptorCodehash, uint8 refCount, uint16 activation_)
    {
        TypeInfo storage t = _types[typeId];
        if (!t.registered) return (false, address(0), bytes32(0), 0, 0);
        Activation storage a = _activation[typeId][t.activations];
        return (true, a.acceptor, a.acceptorCodehash, t.refCount, t.activations);
    }

    /// The immutable descriptor (identity) of a registered Type.
    function descriptor(bytes32 typeId)
        external
        view
        returns (bytes32 shape, bytes32 ruleId, uint8 refCount, uint16 activations, uint64 registeredAt)
    {
        TypeInfo storage t = _types[typeId];
        if (!t.registered) revert E_UNKNOWN_TYPE(typeId);
        return (t.shape, t.ruleId, t.refCount, t.activations, t.registeredAt);
    }

    function activation(bytes32 typeId, uint16 index)
        external
        view
        returns (address acceptor, bytes32 acceptorCodehash, uint64 epoch_, uint64 activatedAt)
    {
        if (index == 0 || index > _types[typeId].activations) revert E_ACTIVATION(typeId, index);
        Activation storage a = _activation[typeId][index];
        return (a.acceptor, a.acceptorCodehash, a.epoch, a.activatedAt);
    }

    function refTypes(bytes32 typeId) external view returns (bytes32[] memory) {
        return _refTypes[typeId];
    }

    function bindingRefType(bytes32 purpose, bytes32 role) external view returns (bytes32) {
        return _bindingRefTypes[purpose][role];
    }
}
