// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Disposable literal ResultV0 ABI control. NON-DURABLE,
/// NON-CONFORMANT, and not a production or deployment library.
library ExpC0ResultCodec {
    uint16 internal constant PROFILE_VERSION = 0;
    bytes32 internal constant DOMAIN_RESULT = keccak256("EFS2/EXP-C0/V0/RESULT");

    struct OptionalBytes32 {
        bool present;
        bytes32 value;
    }

    struct OptionalUint64 {
        bool present;
        uint64 value;
    }

    struct OptionalUint32 {
        bool present;
        uint32 value;
    }

    struct ObserverBasisV0 {
        bytes32 blockHash;
        bytes32 stateRoot;
        uint8 sourceKind;
        uint8 finality;
        uint64 freshnessCoordinate;
    }

    struct OptionalObserverBasisV0 {
        bool present;
        ObserverBasisV0 value;
    }

    struct ProfileCommitmentsV0 {
        OptionalBytes32 typeSchemaId;
        OptionalBytes32 queryProfileId;
        OptionalUint32 queryGeneration;
        OptionalBytes32 policyId;
        OptionalBytes32 verifierProfileId;
        OptionalBytes32 codeCommitment;
        OptionalBytes32 dependencyCommitment;
        OptionalBytes32 resolutionPlanId;
    }

    struct FactsV0 {
        uint8 presence;
        uint8 coverage;
        uint8 support;
        uint8 validation;
        uint8 authority;
        uint8 lifecycle;
        uint8 selection;
        uint8 bytesStatus;
        uint8 effect;
    }

    struct PayloadV0 {
        uint8 payloadKind;
        bytes data;
    }

    struct RawRetentionV0 {
        bool present;
        bytes canonicalBytes;
        bytes32 commitment;
    }

    struct ResultV0 {
        uint8 kind;
        uint8 subjectKind;
        bytes subject;
        OptionalBytes32 realmId;
        OptionalBytes32 realmRevisionId;
        OptionalUint64 executionCoordinate;
        OptionalUint32 admissionHighWater;
        OptionalObserverBasisV0 observerBasis;
        ProfileCommitmentsV0 profileCommitments;
        FactsV0 facts;
        PayloadV0 payload;
        RawRetentionV0 rawRetention;
        uint8 projectionIntegrity;
    }

    struct PlanSignatureReceiptV0 {
        bytes32 admissionPlanId;
        bytes32 signer;
        bytes32 verifierProfileId;
        bytes32 signedDigest;
        bytes32 verifierTranscriptCommitment;
        uint8 authority;
    }

    /// @dev Whole-mutation projection evidence. There is deliberately no
    /// effect index: one receipt speaks for the atomic operation as a whole.
    struct CanonicalEffectReceiptV0 {
        bool operationPresent;
        bytes32 operationId;
        bytes32 realmId;
        bytes32 realmRevisionId;
        uint64 executionCoordinate;
        bytes32 beforeProjectionRoot;
        bytes32 afterProjectionRoot;
        uint8 effect;
    }

    struct ErrorV0 {
        uint8 code;
        bytes subject;
    }

    struct MutationPayloadV0 {
        bool operationPresent;
        bytes32 operationId;
        bytes32[] admissionReceiptIds;
        bool planSignatureReceiptPresent;
        PlanSignatureReceiptV0 planSignatureReceipt;
        bool canonicalEffectReceiptPresent;
        CanonicalEffectReceiptV0 canonicalEffectReceipt;
        bool errorPresent;
        ErrorV0 error;
    }

    function decodeReencodeCommit(bytes memory encoded)
        internal
        pure
        returns (bytes memory reencoded, bytes32 commitment)
    {
        ResultV0 memory result = abi.decode(encoded, (ResultV0));
        reencoded = abi.encode(result);
        require(keccak256(reencoded) == keccak256(encoded), "NONCANONICAL_RESULT_ABI");
        _validateObserverBasis(result.observerBasis);
        commitment = keccak256(abi.encode(DOMAIN_RESULT, PROFILE_VERSION, result));
    }

    function _validateObserverBasis(OptionalObserverBasisV0 memory optionalBasis) private pure {
        ObserverBasisV0 memory basis = optionalBasis.value;
        if (!optionalBasis.present) {
            require(
                basis.blockHash == bytes32(0) && basis.stateRoot == bytes32(0) && basis.sourceKind == 0
                    && basis.finality == 0 && basis.freshnessCoordinate == 0,
                "ABSENT_OBSERVER_NONZERO"
            );
            return;
        }
        require(basis.finality == 1 || basis.finality == 2, "UNKNOWN_FINALITY");
        if (basis.sourceKind == 1) {
            require(basis.blockHash == bytes32(0) && basis.stateRoot == bytes32(0), "ATOMIC_OBSERVER_HAS_ROOTS");
            require(basis.finality == 1, "ATOMIC_OBSERVER_FINALITY");
        } else if (basis.sourceKind == 2) {
            require(
                basis.blockHash != bytes32(0) && basis.stateRoot != bytes32(0), "AUTHENTICATED_OBSERVER_MISSING_ROOTS"
            );
        } else if (basis.sourceKind == 3) {
            require(basis.blockHash != bytes32(0) && basis.stateRoot != bytes32(0), "SOURCE_OBSERVED_MISSING_ROOTS");
            require(basis.finality == 1, "SOURCE_OBSERVED_FINALITY");
        } else {
            revert("UNKNOWN_OBSERVER_SOURCE");
        }
    }

    function decodeValidateCanonicalEffectMutation(bytes memory encoded, bool bootstrap)
        internal
        pure
        returns (MutationPayloadV0 memory mutation)
    {
        mutation = abi.decode(encoded, (MutationPayloadV0));
        require(mutation.canonicalEffectReceiptPresent, "MISSING_CANONICAL_EFFECT_RECEIPT");
        require(mutation.operationPresent || mutation.operationId == bytes32(0), "ABSENT_MUTATION_OPERATION_NONZERO");
        require(
            mutation.canonicalEffectReceipt.operationPresent
                || mutation.canonicalEffectReceipt.operationId == bytes32(0),
            "ABSENT_RECEIPT_OPERATION_NONZERO"
        );

        if (bootstrap) {
            require(!mutation.operationPresent && mutation.operationId == bytes32(0), "BOOTSTRAP_HAS_OPERATION");
            require(
                !mutation.canonicalEffectReceipt.operationPresent
                    && mutation.canonicalEffectReceipt.operationId == bytes32(0),
                "BOOTSTRAP_RECEIPT_HAS_OPERATION"
            );
        } else {
            require(mutation.operationPresent && mutation.operationId != bytes32(0), "MUTATION_OPERATION_ABSENT");
            require(
                mutation.canonicalEffectReceipt.operationPresent
                    && mutation.canonicalEffectReceipt.operationId != bytes32(0),
                "RECEIPT_OPERATION_ABSENT"
            );
            require(mutation.operationId == mutation.canonicalEffectReceipt.operationId, "RECEIPT_OPERATION_MISMATCH");
        }
    }
}
