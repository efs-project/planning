// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";

contract IndexDigestVectorsTest is LabBase {
    /// Explicit independent word serialization, not the production tuple helper.
    /// Nonzero and max-width values catch omitted, reordered or truncated words.
    function test_legacy_digest_matches_independent_static_word_vector() public view {
        Ledger.Intent memory intent=Ledger.Intent(bytes32(uint256(11)),bytes32(uint256(12)),address(0x1234567890AbcdEF1234567890aBcdef12345678),type(uint64).max,17,bytes32(uint256(18)),bytes32(uint256(19)));
        bytes32 actions=bytes32(uint256(20));
        bytes32 typehash=keccak256("PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)");
        bytes32 inner=keccak256(abi.encodePacked(typehash,bytes32(uint256(11)),bytes32(uint256(12)),bytes32(uint256(uint160(intent.author))),bytes32(uint256(type(uint64).max)),bytes32(uint256(17)),bytes32(uint256(18)),bytes32(uint256(19)),bytes32(uint256(20))));
        bytes32 expected=keccak256(abi.encodePacked(hex"1901",ledger.domainSeparator(),inner));
        require(ledger.intentDigest(intent,actions)==expected,"legacy digest vector");
    }
    function test_guarded_digest_matches_independent_static_word_vector() public view {
        Ledger.IntentV2 memory intent=Ledger.IntentV2(bytes32(uint256(31)),bytes32(uint256(32)),bytes32(uint256(33)),address(0x1234567890AbcdEF1234567890aBcdef12345678),type(uint64).max,37,bytes32(uint256(38)),bytes32(uint256(39)),bytes32(uint256(40)));
        bytes32 typehash=keccak256("IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)");
        bytes32 inner=keccak256(abi.encodePacked(typehash,bytes32(uint256(31)),bytes32(uint256(32)),bytes32(uint256(33)),bytes32(uint256(uint160(intent.author))),bytes32(uint256(type(uint64).max)),bytes32(uint256(37)),bytes32(uint256(38)),bytes32(uint256(39)),bytes32(uint256(40)),bytes32(uint256(41))));
        bytes32 expected=keccak256(abi.encodePacked(hex"1901",ledger.guardedDomainSeparator(),inner));
        require(ledger.guardedIntentDigest(intent,bytes32(uint256(41)))==expected,"guarded digest vector");
    }
}
