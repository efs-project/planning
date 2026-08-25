// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Disposable EXP-C0/v0 ABI-v2 control. This is not an EFS protocol
/// implementation, production library, stable ABI, or deployment candidate.
library ExpC0Codec {
    uint16 internal constant PROFILE_VERSION = 0;

    bytes32 internal constant DOMAIN_REALM = keccak256("EFS2/EXP-C0/V0/REALM");
    bytes32 internal constant DOMAIN_INITIAL_REVISION = keccak256("EFS2/EXP-C0/V0/INITIAL_REVISION");
    bytes32 internal constant DOMAIN_REALM_REVISION = keccak256("EFS2/EXP-C0/V0/REALM_REVISION");
    bytes32 internal constant DOMAIN_PRINCIPAL = keccak256("EFS2/EXP-C0/V0/PRINCIPAL");
    bytes32 internal constant DOMAIN_TYPE = keccak256("EFS2/EXP-C0/V0/TYPE");
    bytes32 internal constant DOMAIN_BODY = keccak256("EFS2/EXP-C0/V0/BODY");
    bytes32 internal constant DOMAIN_RECORD = keccak256("EFS2/EXP-C0/V0/RECORD");
    bytes32 internal constant DOMAIN_PUBLICATION = keccak256("EFS2/EXP-C0/V0/PUBLICATION");
    bytes32 internal constant DOMAIN_OCCURRENCE = keccak256("EFS2/EXP-C0/V0/OCCURRENCE");
    bytes32 internal constant DOMAIN_ADMISSION_PLAN = keccak256("EFS2/EXP-C0/V0/ADMISSION_PLAN");
    bytes32 internal constant DOMAIN_EFFECT_SET = keccak256("EFS2/EXP-C0/V0/EFFECT_SET");
    bytes32 internal constant DOMAIN_OPERATION = keccak256("EFS2/EXP-C0/V0/OPERATION");
    bytes32 internal constant DOMAIN_ADMISSION = keccak256("EFS2/EXP-C0/V0/ADMISSION");
    bytes32 internal constant DOMAIN_CURSOR = keccak256("EFS2/EXP-C0/V0/CURSOR");
    bytes32 internal constant DOMAIN_PROJECTION = keccak256("EFS2/EXP-C0/V0/PROJECTION");

    error MalformedTypeEnvelope();
    error TypeEnvelopeLimitExceeded();

    struct Principal {
        uint8 authorityKind;
        bytes originLineage;
        address account;
    }

    struct InitialRevision {
        uint32 generation;
        bytes32 componentCommitment;
        bytes32 executionProfileId;
        bytes32 policyId;
        bytes32 verifierProfileId;
        bytes32 administrationCommitment;
        uint64 activationStart;
        uint64 activationEndExclusive;
    }

    struct RealmBootstrap {
        bytes originLineage;
        bytes32 genesisCommitment;
        bytes32 coreCommitment;
        bytes32 initialRevisionCommitment;
        bytes32 initialRevisionId;
        uint8[] disclosedPowers;
    }

    struct RealmRevision {
        bytes32 realmId;
        uint32 generation;
        bytes32 componentCommitment;
        bytes32 executionProfileId;
        bytes32 policyId;
        bytes32 verifierProfileId;
        bytes32 administrationCommitment;
        uint64 activationStart;
        uint64 activationEndExclusive;
    }

    struct FieldV0 {
        uint16 fieldKey;
        uint8 scalarKind;
        bool required;
        uint16 maxLengthOrCount;
    }

    struct ShapeV0 {
        FieldV0[] fields;
    }

    struct RepresentationV0 {
        uint8 fieldOrder;
        uint8 encoding;
    }

    struct ConstraintV0 {
        uint16 fieldKey;
        uint8 rule;
    }

    struct ReferenceRoleV0 {
        uint16 fieldKey;
        uint8 targetKind;
        bytes32 targetTypeSchemaId;
    }

    struct TypeSchema {
        bytes semanticCommitment;
        ShapeV0 shape;
        RepresentationV0 representation;
        ConstraintV0[] intrinsicConstraints;
        ReferenceRoleV0[] referenceRoles;
    }

    struct OptionalRecord {
        bool present;
        bytes32 value;
    }

    struct RecordV0 {
        bytes32 typeSchemaId;
        bytes canonicalBody;
    }

    struct PublicationSet {
        bytes32 semanticAuthor;
        bytes32 sourcePublicationActor;
        bytes32 sourceAuthorityProfileId;
        uint32 sourceAuthorityEpoch;
        uint32 nonceLane;
        uint64 nonce;
        uint64 expiryCoordinate;
        uint8 visibility;
        uint8 suites;
        bytes32[] leaves;
    }

    struct EffectV0 {
        uint8 kind;
        bytes32 principalId;
        bytes32 positionKey;
        bytes32 recordId;
        bytes32 occurrenceId;
        uint32 expectedRevision;
        bytes32 queryProfileId;
        uint32 generation;
        uint64 coverageHighWater;
        uint32 terminalCount;
        bytes32 terminalPostingsRoot;
    }

    struct AdmissionPlan {
        bytes32[] occurrenceIds;
        bytes32 realmId;
        bytes32 realmRevisionId;
        bytes32 coreCommitment;
        bytes32 semanticAuthor;
        bytes32 actor;
        bytes32 verifierProfileId;
        uint32 nonceLane;
        uint64 nonce;
        uint64 expiryCoordinate;
        bytes32 executorCommitment;
        bytes32 dependencyCommitment;
        bytes32 payer;
        uint64 maximumCost;
        EffectV0[] effects;
    }

    struct CursorV0 {
        bytes32 realmId;
        bytes32 realmRevisionId;
        bytes32 queryProfileId;
        uint32 generation;
        uint8 ordering;
        uint32 activationHighWater;
        uint32 coveredThroughHighWater;
        uint64 executionCoordinate;
        bytes32 observerBlockHash;
        uint32 afterPostingOrdinal;
        bytes32 declaredDomainRoot;
    }

    struct ProjectionEntryV0 {
        uint8 collectionKind;
        bytes key;
        bytes value;
    }

    function principalId(Principal memory principal) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_PRINCIPAL, PROFILE_VERSION, principal));
    }

    function initialRevisionCommitment(InitialRevision memory revision) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_INITIAL_REVISION,
                PROFILE_VERSION,
                revision.generation,
                revision.componentCommitment,
                revision.executionProfileId,
                revision.policyId,
                revision.verifierProfileId,
                revision.administrationCommitment,
                revision.activationStart,
                revision.activationEndExclusive
            )
        );
    }

    function realmId(RealmBootstrap memory bootstrap) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_REALM,
                PROFILE_VERSION,
                bootstrap.originLineage,
                bootstrap.genesisCommitment,
                bootstrap.coreCommitment,
                bootstrap.initialRevisionCommitment,
                bootstrap.disclosedPowers
            )
        );
    }

    function realmRevisionId(RealmRevision memory revision) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_REALM_REVISION, PROFILE_VERSION, revision));
    }

    function encodeTypeSchemaPayloadV0(TypeSchema memory schema) internal pure returns (bytes memory) {
        return abi.encode(schema);
    }

    /// @notice Canonical outer Type wire. Codec payloads remain opaque to this
    /// layer so old readers can preserve future codec bytes losslessly.
    function encodeTypeSchemaEnvelope(uint16 codecVersion, bytes memory payloadBytes)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode(codecVersion, payloadBytes);
    }

    function encodeTypeSchemaV0(TypeSchema memory schema) internal pure returns (bytes memory) {
        return encodeTypeSchemaEnvelope(0, encodeTypeSchemaPayloadV0(schema));
    }

    function decodeTypeSchemaEnvelope(bytes memory raw)
        internal
        pure
        returns (uint16 codecVersion, bytes memory payloadBytes)
    {
        // Exact canonical abi.encode(uint16,bytes): two-word head, length word,
        // exact zero padding, and no trailing bytes. Manual framing lets an old
        // reader reject malformed outer bytes before any codec dispatch.
        // C0's whole-envelope cap is checked before reading or allocating the
        // opaque payload. This bound is disposable and not a Core freeze.
        if (raw.length > 2048) revert TypeEnvelopeLimitExceeded();
        if (raw.length < 96 || raw.length % 32 != 0) revert MalformedTypeEnvelope();
        uint256 codecWord;
        uint256 payloadOffset;
        uint256 payloadLength;
        assembly ("memory-safe") {
            codecWord := mload(add(raw, 0x20))
            payloadOffset := mload(add(raw, 0x40))
            payloadLength := mload(add(raw, 0x60))
        }
        if (codecWord > type(uint16).max || payloadOffset != 64) revert MalformedTypeEnvelope();
        if (payloadLength > raw.length - 96) revert MalformedTypeEnvelope();
        uint256 paddedLength = (payloadLength + 31) & ~uint256(31);
        if (paddedLength < payloadLength || raw.length != 96 + paddedLength) revert MalformedTypeEnvelope();
        for (uint256 i = 96 + payloadLength; i < raw.length; ++i) {
            if (raw[i] != 0) revert MalformedTypeEnvelope();
        }

        payloadBytes = new bytes(payloadLength);
        for (uint256 i; i < payloadLength; ++i) {
            payloadBytes[i] = raw[96 + i];
        }
        codecVersion = uint16(codecWord);
    }

    function typeSchemaId(uint16 codecVersion, bytes memory payloadBytes) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_TYPE, PROFILE_VERSION, codecVersion, payloadBytes));
    }

    function typeSchemaId(TypeSchema memory schema) internal pure returns (bytes32) {
        return typeSchemaId(0, encodeTypeSchemaPayloadV0(schema));
    }

    function recordId(bytes32 schemaId, bytes memory canonicalBody) internal pure returns (bytes32) {
        bytes32 bodyHash = keccak256(abi.encode(DOMAIN_BODY, PROFILE_VERSION, canonicalBody));
        return keccak256(abi.encode(DOMAIN_RECORD, PROFILE_VERSION, schemaId, bodyHash));
    }

    function publicationSetId(PublicationSet memory publication) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_PUBLICATION, PROFILE_VERSION, publication));
    }

    function occurrenceId(bytes32 publicationSet, uint16 leafIndex) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_OCCURRENCE, PROFILE_VERSION, publicationSet, leafIndex));
    }

    function admissionPlanId(AdmissionPlan memory plan) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_ADMISSION_PLAN, PROFILE_VERSION, plan));
    }

    function effectSetId(EffectV0[] memory effects) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_EFFECT_SET, PROFILE_VERSION, effects));
    }

    function operationId(bytes32 planId, bytes32 effectsId) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_OPERATION, PROFILE_VERSION, planId, effectsId));
    }

    function admissionId(bytes32 occurrence, bytes32 revision, bytes32 operation, uint32 ordinal)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(DOMAIN_ADMISSION, PROFILE_VERSION, occurrence, revision, operation, ordinal));
    }

    function cursorCommitment(CursorV0 memory cursor) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_CURSOR, PROFILE_VERSION, cursor));
    }

    function projectionRoot(ProjectionEntryV0[] memory entries) internal pure returns (bytes32) {
        bytes memory payload = abi.encode(entries);
        return keccak256(abi.encode(DOMAIN_PROJECTION, PROFILE_VERSION, payload, uint32(entries.length)));
    }
}
