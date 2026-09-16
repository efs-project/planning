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
///         calls `onAdmission` after each staged leaf, before the next Type rule.
///         Segments of one publication are contiguous and applied exactly once.
///         `afterPublication` is a mandatory STATICCALL over all effects, for
///         final-state obligations (not maintenance or repeated Type acceptance).
///         Both phases jointly spend one bounded allowance; either failure rolls
///         back the whole publication. Staged counters/coverage are not receipts.
interface IIndexModule {
    struct Effect {
        uint8 kind; // Ledger action kind (PUBLISH/REUSE/BIND/UNBIND/CREATE/WITHDRAW)
        uint64 admission; // admission ordinal of this action
        bytes32 author; // publication principal; WITHDRAW: target admission's retained principal being released
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
    // Exact selector acknowledgement prevents a permissive old fallback qualifying.
    function afterPublication(uint64 publication, Effect[] calldata effects) external view returns (bytes4);
    // Immutable required semantics; excludes generation, attachment and progress.
    function manifestHash() external view returns(bytes32);
}

/// @notice What the Ledger needs from the Type registry. Three layers (authority repair
///         2026-09-13, F5): the Type's IDENTITY (descriptor: shape, refTypes, declared rule) is
///         immutable and the id is derived from it; its MANDATORY RULE (the registration-time
///         acceptor, pinned address + codehash == ruleId) always runs and its refusal is final;
///         the Realm's ACCEPTANCE POLICY (an additional acceptor that must also accept; 0 = none)
///         is an append-only activation history per Type.
interface ITypeRegistry {
    /// Mandatory rule + active policy row + identity refCount. `policyAcceptor`/`policyCodehash`
    /// are the ACTIVE activation (0/0 = no additional policy), `activation` its 1-based index.
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
            uint16 activation
        );

    /// One row of the append-only policy history of a Type (1-based; reverts when absent).
    function activation(bytes32 typeId, uint16 index)
        external
        view
        returns (address acceptor, bytes32 acceptorCodehash, uint64 epoch, uint64 activatedAt);

    /// Expected typeId per body reference slot (0 = any registered type).
    function refTypes(bytes32 typeId) external view returns (bytes32[] memory);

    /// Expected target typeId for a binding role under a purpose (0 = any record or subject).
    function bindingRefType(bytes32 purpose, bytes32 role) external view returns (bytes32);

    /// Bumped on every rule change; part of a listing cursor's basis (pre-seal check 4).
    function epoch() external view returns (uint64);
}
