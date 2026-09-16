// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// Declarations only. These static wire shapes mirror the existing Ledger ABI;
/// Ledger-qualified public Solidity types and every storage root remain intact.
library PublicationPreparation {
    struct Result {
        address author;
        bytes32 author32;
        bytes32 creator;
        bool imported;
        uint8 proofKind;
        uint8 v;
        uint64 nonce;
        uint64 deadline;
        bytes32 r;
        bytes32 s;
        bytes32 acceptanceProfile;
        bytes32 indexObligations;
        bytes32 actionsHash;
        bytes32 execution;
        bytes32 intentHash;
        bytes32 readsHash;
        uint8 format;
    }

    struct Intent {
        bytes32 realmId;
        bytes32 coreCodeCommitment;
        address author;
        uint64 nonce;
        uint64 deadline;
        bytes32 acceptanceProfile;
        bytes32 indexObligations;
    }

    struct IntentV2 {
        bytes32 realmId;
        bytes32 realmOrigin;
        bytes32 executionSet;
        address author;
        uint64 nonce;
        uint64 deadline;
        bytes32 acceptanceProfile;
        bytes32 indexObligations;
        bytes32 readSetHash;
    }

    struct SourceEvidence {
        bytes32 realmId;
        bytes32 coreCodeCommitment;
        bytes32 acceptanceProfile;
        bytes32 indexObligations;
        bytes32 r;
        bytes32 s;
        bytes32 sourcePrincipal;
        address author;
        uint64 nonce;
        uint64 deadline;
        uint8 v;
        uint8 grade;
    }
}
