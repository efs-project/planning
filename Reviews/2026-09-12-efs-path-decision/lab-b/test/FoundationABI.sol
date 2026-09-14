// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";

/// Independent ABI declaration makes missing guarded ingress a runtime RED control.
interface FoundationABI {
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
    struct ReadSetV2 { bytes32[] principalIds; bytes32[] positions; bytes32[] expectedHeads; }
    struct PublicationContext {
        bytes32 principalId;
        bytes32 executionSet;
        bytes32 readSetHash;
        bytes32 intentDigest;
        uint8 principalKind;
        uint8 authorizationProfile;
        uint8 intentFormat;
    }
    function executionSet() external view returns (bytes32);
    function publicationContext(uint64 publication) external view returns (PublicationContext memory);
    function readSetBytes(bytes32 hash) external view returns (bytes memory);
    function guardedIntentDigest(IntentV2 calldata intent, bytes32 actionsHash) external view returns (bytes32);
    function readSetHash(ReadSetV2 calldata readSet) external pure returns (bytes32);
    function executeGuardedSigned(IntentV2 calldata intent, Ledger.Action[] calldata actions, bytes[] calldata bodies,
        ReadSetV2 calldata readSet, bytes calldata signature) external returns (uint64, uint64);
}
