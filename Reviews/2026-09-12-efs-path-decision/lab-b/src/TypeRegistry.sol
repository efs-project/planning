// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "./Keys.sol";
import {ITypeRegistry} from "./Interfaces.sol";

/// @title TypeRegistry — exact Type identity + mandatory rule + separate Realm acceptance policy (lab)
/// @notice DISPOSABLE LAB, NO PROTOCOL CLAIM. Authority repair 2026-09-13 (REPAIR.md R2, F5).
///
///         IDENTITY. A Type is its descriptor: an opaque shape commitment, the expected Type of
///         each leading checked-reference word, and the declared rule identity (the acceptor's
///         codehash at registration; 0 = no rule). The id is derived from the descriptor
///         (`Keys.typeId`), so the same descriptor is the same Type on every Realm and a changed
///         descriptor is a NEW Type. Registration under an existing id is refused: nothing about
///         a Type's identity is ever mutated in place, and a clean reader recomputes the id from
///         the retained descriptor.
///
///         MANDATORY RULE. The registration-time acceptor (address pinned here, codehash = the
///         descriptor's ruleId) is the Type's fixed predicate: the Ledger runs it on EVERY
///         publish/reuse of the Type, re-verifying its codehash, and its refusal is final. No
///         later action of this registry can remove or replace it.
///
///         POLICY. A Realm may ADD constraints: an append-only activation history per Type names
///         an additional policy acceptor that must ALSO accept (row 1, written by `register`, is
///         "no additional policy"; `activate(typeId, address(0))` returns to that — it never means
///         "no validation"). The Ledger records the policy row index per admission, and the signed
///         acceptance profile binds (typeId, ruleId, active policy codehash, epoch), so a signature
///         made before an activation is stale after it while every admission's basis stays
///         readable (`Ledger.acceptanceBasis`). Binding-role target Types are Realm placement
///         policy, not Type identity; they stay mutable and epoch-bumping.
///
///         LIMIT (coordinator, 2026-09-13): a codehash pins an acceptor's CODE, not its mutable
///         dependencies (its own storage, contracts it reads). This registry cannot tell a
///         stateless rule from a stateful one, and no self-declared "stateless" flag would prove
///         it, so none is added. Lab convention: every MANDATORY fixture rule is stateless or
///         immutable-configured (QuoteAcceptor, LabelAcceptor, MinBodyAcceptor in src/,
///         StrictQuoteAcceptor in test/ — constructor immutables are part of the runtime codehash); the
///         mutable MockAcceptor (mode/minBody, unchanged codehash) is installed only as an
///         ADDITIONAL policy through `activate`. A production mandatory rule is either stateless /
///         immutable-configured, or stateful with its dependency and basis semantics explicitly
///         declared (programmable acceptance); stateful developer rules remain allowed — pinning a
///         codehash alone simply declares nothing about them.
contract TypeRegistry is ITypeRegistry {
    /// Immutable once registered (3 slots: packed header incl. the pinned mandatory acceptor, shape, ruleId).
    struct TypeInfo {
        bool registered;
        uint8 refCount;
        uint16 activations; // policy rows so far (>= 1 once registered)
        uint64 registeredAt;
        address mandatoryAcceptor; // the declared rule's pinned instance (0 = no rule); codehash == ruleId
        bytes32 shape;
        bytes32 ruleId;
    }

    /// One policy row (2 slots: packed header, codehash). Append-only. acceptor 0 = no additional policy.
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

    event TypeRegistered(bytes32 indexed typeId, bytes32 shape, bytes32 ruleId, address mandatoryAcceptor, uint8 refCount);
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
    /// (same descriptor twice); a different descriptor never collides with an existing id. The
    /// acceptor becomes the Type's MANDATORY rule; policy row 1 = no additional policy.
    function register(bytes32 shape, address acceptor, bytes32[] calldata expectedRefTypes)
        external
        returns (bytes32 typeId)
    {
        if (msg.sender != admin) revert E_ADMIN();
        if (expectedRefTypes.length > 8) revert E_TOO_MANY_REFS();
        bytes32 codehash = _codehashOf(acceptor);
        typeId = Keys.typeId(shape, expectedRefTypes, codehash);
        if (_types[typeId].registered) revert E_TYPE_EXISTS(typeId);
        _types[typeId] = TypeInfo(true, uint8(expectedRefTypes.length), 0, uint64(block.number), acceptor, shape, codehash);
        _refTypes[typeId] = expectedRefTypes;
        emit TypeRegistered(typeId, shape, codehash, acceptor, uint8(expectedRefTypes.length));
        _activate(typeId, address(0), bytes32(0));
    }

    /// Append a policy activation: from now on `acceptor` must ALSO accept every publish/reuse of
    /// `typeId` on this Realm (address(0) = no additional policy). The Type's identity and its
    /// mandatory rule are untouched; earlier admissions keep their recorded basis.
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

    /// What the Ledger reads at every admission: the mandatory rule (pinned instance + ruleId),
    /// the active policy row (acceptor + codehash; 0/0 = none) and its index, and refCount.
    function typeInfo(bytes32 typeId)
        external
        view
        returns (
            bool registered,
            address mandatoryAcceptor,
            bytes32 ruleId,
            address policyAcceptor,
            bytes32 policyCodehash,
            uint8 refCount,
            uint16 activation_
        )
    {
        TypeInfo storage t = _types[typeId];
        if (!t.registered) return (false, address(0), bytes32(0), address(0), bytes32(0), 0, 0);
        Activation storage a = _activation[typeId][t.activations];
        return (true, t.mandatoryAcceptor, t.ruleId, a.acceptor, a.acceptorCodehash, t.refCount, t.activations);
    }

    /// The immutable descriptor (identity) of a registered Type plus its pinned mandatory instance.
    function descriptor(bytes32 typeId)
        external
        view
        returns (bytes32 shape, bytes32 ruleId, address mandatoryAcceptor, uint8 refCount, uint16 activations, uint64 registeredAt)
    {
        TypeInfo storage t = _types[typeId];
        if (!t.registered) revert E_UNKNOWN_TYPE(typeId);
        return (t.shape, t.ruleId, t.mandatoryAcceptor, t.refCount, t.activations, t.registeredAt);
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
