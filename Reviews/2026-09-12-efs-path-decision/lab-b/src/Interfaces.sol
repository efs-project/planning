// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// Disposable lab, no protocol claim.

/// @notice A Type's mandatory developer acceptance rule. The Ledger calls it with
///         STATICCALL and bounded gas on EVERY publish/reuse admission (dedup and
///         reuse included), inside the ordered apply, before that action's writes.
///         `refs` are the checked reference targets the Ledger extracted from the
///         body (the first `refCount` 32-byte words, per TypeRegistry) and has
///         already verified to exist with the expected Type. Return false or
///         revert to reject; rejection reverts the whole publication.
interface IAcceptor {
    function accept(bytes32 typeId, bytes calldata data, bytes32[] calldata refs) external view returns (bool);
}

/// @notice The separate index responsibility (coordinator delta 3). The Ledger
///         calls `onAdmission` once per publication, in the same transaction,
///         after its own writes, with a plain CALL and bounded gas. Any failure
///         reverts the whole publication (mandatory-index rollback). The module
///         owns every posting list; the Ledger keeps no list at all.
interface IIndexModule {
    struct Effect {
        uint8 kind; // Ledger action kind (PUBLISH/REUSE/BIND/UNBIND/CREATE/WITHDRAW)
        uint64 admission; // admission ordinal of this action
        bytes32 author; // principal id of the publication author
        bytes32 recordId; // record admitted (publish/reuse/withdraw) or bound target (bind)
        bytes32 typeId; // Type of `recordId` (0 when the target is a subject)
        bytes32 scopeKey; // Keys.scope(author, purpose, subject) for bind/unbind
        bytes32 bindingKey; // Keys.binding(author, position) for bind/unbind
        uint64 bindingOrdinal; // ledger binding ordinal (scope-list entry)
        bytes32 target; // new head target (bind)
        bytes32 oldTarget; // previous head target when it was live (bind/unbind)
        bool freshBinding; // first admission on this binding key (append to scope list)
        bool oldLive; // previous head was live (release one backlink)
    }

    function onAdmission(uint64 publication, Effect[] calldata effects) external;
}

/// @notice What the Ledger needs from the Type registry.
interface ITypeRegistry {
    function typeInfo(bytes32 typeId)
        external
        view
        returns (bool registered, address acceptor, bytes32 acceptorCodehash, uint8 refCount);

    /// Expected typeId per body reference slot (0 = any registered type).
    function refTypes(bytes32 typeId) external view returns (bytes32[] memory);

    /// Expected target typeId for a binding role under a purpose (0 = any record or subject).
    function bindingRefType(bytes32 purpose, bytes32 role) external view returns (bytes32);

    /// Bumped on every rule change; part of a listing cursor's basis (pre-seal check 4).
    function epoch() external view returns (uint64);
}
