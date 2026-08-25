// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Disposable V2-E1 Principal-surface comparator. Not a protocol ABI,
/// production contract, deployment candidate, or permanent encoding selection.
contract ExpC0PrincipalComparator {
    uint16 public constant PROFILE_VERSION = 0;
    bytes32 public constant DOMAIN_PRINCIPAL = keccak256("EFS2/EXP-C0/V0/PRINCIPAL");
    bytes32 public constant DOMAIN_TAGGED_AUTHOR_KEY = keccak256("efs2/bakeoff/author-key/1");
    bytes32 public constant DOMAIN_SIGN = keccak256("EFS2/EXP-C0/V0/SIGN");

    struct Principal {
        uint8 authorityKind;
        bytes originLineage;
        address account;
    }

    /// @dev Disposable tagged arm: 0 ACCOUNT, 1 PRINCIPAL.
    struct AuthorRef {
        uint8 kind;
        bytes32 value;
    }

    struct Governance {
        bytes32 managedAuthorityRef;
        uint64 sinceOrdinal;
    }

    struct TaggedAssociation {
        bytes32 managedPrincipalKey;
        uint64 sinceOrdinal;
    }

    mapping(bytes32 => bytes32) private uniformValues;
    mapping(bytes32 => bytes32) private taggedValues;
    mapping(bytes32 => Governance) public uniformGovernance;
    mapping(bytes32 => TaggedAssociation) public taggedAssociation;

    function uniformPrincipalId(Principal calldata principal) external pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_PRINCIPAL, PROFILE_VERSION, principal));
    }

    function taggedAuthorKey(AuthorRef calldata authorRef) public pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_TAGGED_AUTHOR_KEY, uint256(authorRef.kind), authorRef.value));
    }

    function signatureDigest(bytes32 messageId, bytes32 authorKey, bytes32 verifierProfileId)
        external
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(DOMAIN_SIGN, PROFILE_VERSION, messageId, authorKey, verifierProfileId));
    }

    function writeUniform(bytes32 principalId, bytes32 value) external {
        uniformValues[principalId] = value;
    }

    function readUniform(bytes32 principalId) external view returns (bytes32) {
        return uniformValues[principalId];
    }

    function writeTagged(AuthorRef calldata authorRef, bytes32 value) external returns (bytes32 authorKey) {
        authorKey = taggedAuthorKey(authorRef);
        taggedValues[authorKey] = value;
    }

    function readTagged(AuthorRef calldata authorRef) external view returns (bytes32) {
        return taggedValues[taggedAuthorKey(authorRef)];
    }

    function associateUniform(bytes32 principalId, bytes32 managedAuthorityRef, uint64 sinceOrdinal) external {
        uniformGovernance[principalId] = Governance(managedAuthorityRef, sinceOrdinal);
    }

    function associateTagged(AuthorRef calldata accountRef, AuthorRef calldata managedPrincipal, uint64 sinceOrdinal)
        external
    {
        taggedAssociation[taggedAuthorKey(accountRef)] =
            TaggedAssociation(taggedAuthorKey(managedPrincipal), sinceOrdinal);
    }
}
