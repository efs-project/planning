// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @title Keys — identity derivations, copied byte-for-byte from the c0-core model
/// @notice Disposable lab, no protocol claim. Every id this lab mints must be
///         portable to the fuller kernel, so the domain tags, argument order and
///         ABI encoding below are exactly those of IndexKeys.sol / BindingFold.sol /
///         StateKernel.sol in Reviews/2026-09-05-c0-core. Do not "tidy" them.
///         DOM_SUBJECT is new (coordinator delta 1/B): a stable File identity that
///         depends only on the creating author and a signed salt, never on chain
///         state, so the same signed create yields the same subject id on any
///         deployment.
library Keys {
    // Record id: keccak256(abi.encode(DOM_RECORD, typeId, keccak256(body)))   (StateKernel.carriage)
    bytes32 internal constant DOM_RECORD = keccak256("efs2/record/1");
    // Position: keccak256(abi.encode(DOM_POSITION, purpose, subject, role))     (BindingFold.positionKey)
    bytes32 internal constant DOM_POSITION = keccak256("efs2/position/1");
    // Binding key: keccak256(abi.encode(DOM_BINDING, principal, position))      (BindingFold.bindingKey)
    bytes32 internal constant DOM_BINDING = keccak256("efs2/binding/1");
    // Scope key: keccak256(abi.encode(DOM_SCOPE, principal, purpose, subject))   (IndexKeys.scope)
    bytes32 internal constant DOM_SCOPE = keccak256("efs2/vk/binding-scope/1");
    // Posting key: keccak256(abi.encode(DOM_POSTING, typeId, uint256(kind), uint256(ordinal), valueKey))
    bytes32 internal constant DOM_POSTING = keccak256("efs2/pk/1");
    // Subject id (lab-new): keccak256(abi.encode(DOM_SUBJECT, creatorPrincipal, creatorSalt))
    bytes32 internal constant DOM_SUBJECT = keccak256("efs2/subject/1");
    // Contract principal (lab-new, pre-seal check 1): keccak256(abi.encode(DOM_PRINCIPAL, uint256(2), realmOrigin, address))
    // where realmOrigin = keccak256(abi.encode(chainId, coreCodeCommitment)). A contract address is
    // not unique across Realms; an EOA key is, so EOA principals stay the padded address (c0 form).
    bytes32 internal constant DOM_PRINCIPAL = keccak256("efs2/principal/1");

    // Posting-list kinds reused from the fuller model (IndexKeys.occurrenceKeys / StateKernel):
    //   1  = by-Type list                                                   typeId = T, valueKey = 0
    //   4  = by-author list                                                 typeId 0, valueKey = principal
    //   5  = backlinks per target ("what points at me")                     typeId 0, valueKey = target id
    //   8  = history per binding key (every head change, ascending)         typeId 0, valueKey = binding key
    //   10 = scope list per (principal, purpose, subject)                    typeId 0, valueKey = scope key
    uint8 internal constant KIND_BY_TYPE = 1;
    uint8 internal constant KIND_BY_AUTHOR = 4;
    uint8 internal constant KIND_BACKLINK = 5;
    uint8 internal constant KIND_HISTORY = 8;
    uint8 internal constant KIND_SCOPE = 10;

    /// EOA principal id: the left-padded address (c0 form). The same key names the same
    /// principal on every Realm.
    function principal(address account) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(account)));
    }

    /// Contract principal id, qualified by the Realm that observed it (kind 2).
    function contractPrincipal(bytes32 realmOrigin, address account) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_PRINCIPAL, uint256(2), realmOrigin, account));
    }

    /// The principal an account presents at native ingress on the Realm with `realmOrigin`.
    function principalFor(address account, bytes32 realmOrigin) internal view returns (bytes32) {
        return account.code.length != 0 ? contractPrincipal(realmOrigin, account) : principal(account);
    }

    function record(bytes32 typeId, bytes memory data) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_RECORD, typeId, keccak256(data)));
    }

    /// Same id as `record`, from an already-computed body hash (the signed Action carries the hash).
    function recordFromHash(bytes32 typeId, bytes32 bodyHash) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_RECORD, typeId, bodyHash));
    }

    function subject(bytes32 creator, bytes32 creatorSalt) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_SUBJECT, creator, creatorSalt));
    }

    function position(bytes32 purpose, bytes32 subjectKey, bytes32 role) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_POSITION, purpose, subjectKey, role));
    }

    function binding(bytes32 principalId, bytes32 positionKey) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_BINDING, principalId, positionKey));
    }

    function scope(bytes32 principalId, bytes32 purpose, bytes32 subjectKey) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_SCOPE, principalId, purpose, subjectKey));
    }

    function posting(bytes32 typeId, uint8 kind, uint8 ordinal, bytes32 valueKey) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_POSTING, typeId, uint256(kind), uint256(ordinal), valueKey));
    }

    function byTypeList(bytes32 typeId) internal pure returns (bytes32) {
        return posting(typeId, KIND_BY_TYPE, 0, bytes32(0));
    }

    function byAuthorList(bytes32 principalId) internal pure returns (bytes32) {
        return posting(bytes32(0), KIND_BY_AUTHOR, 0, principalId);
    }

    function historyList(bytes32 bindingKey) internal pure returns (bytes32) {
        return posting(bytes32(0), KIND_HISTORY, 0, bindingKey);
    }

    function scopeList(bytes32 scopeKey) internal pure returns (bytes32) {
        return posting(bytes32(0), KIND_SCOPE, 0, scopeKey);
    }

    function backlinkList(bytes32 target) internal pure returns (bytes32) {
        return posting(bytes32(0), KIND_BACKLINK, 0, target);
    }
}
