// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {NativeClaimArchive} from "../src/NativeClaimArchive.sol";
import {NativePublicationProof} from "../src/NativePublicationProof.sol";

/// Ordinary deployed app: actual caller authors; mutable controller/app state
/// is not read by retention. No authority is imported from the archive.
contract NativeClaimApplication {
    Ledger public immutable ledger;address public controller;uint256 public writes;
    constructor(Ledger l){ledger=l;controller=msg.sender;}
    function rotate(address next) external {require(msg.sender==controller);controller=next;}
    function run(Ledger.Action[] memory a,bytes[] memory bodies,Ledger.ReadSetV2 memory reads,bool failAfter) external returns(uint64 p,uint64 first){
        require(msg.sender==controller);writes++;
        (p,first)=ledger.executeGuarded(a,bodies,ledger.nonces(address(this)),ledger.executionSet(),reads);
        require(!failAfter,"APP_ROLLBACK");
    }
}
contract NativeRetainedConsumer {
    NativeClaimArchive public immutable selectedArchive;
    NativePublicationProof public immutable selectedVerifier;
    bytes32 public immutable selectedArchiveCodeHash;
    bytes32 public immutable selectedAnchor;
    bytes32 public observed;bytes32 public principal;bytes32 public recordId;
    constructor(NativeClaimArchive archive,bytes32 archiveCodeHash,NativePublicationProof verifier,bytes32 anchor){
        require(address(archive).codehash==archiveCodeHash&&archive.verifier()==verifier&&verifier.anchorHash()==anchor,"TRUST_CONFIG");
        selectedArchive=archive;selectedArchiveCodeHash=archiveCodeHash;selectedVerifier=verifier;selectedAnchor=anchor;
    }
    function verifyOnly(NativePublicationProof verifier,NativePublicationProof.Witness memory witness) external {
        require(verifier==selectedVerifier,"VERIFIER_PIN");
        observed=verifier.verify(witness).claimId;
    }
    function consume(NativeClaimArchive archive,bytes32 witnessId) external {
        require(archive==selectedArchive&&address(archive).codehash==selectedArchiveCodeHash,"ARCHIVE_PIN");
        NativeClaimArchive.Receipt memory r=archive.claim(witnessId);require(r.importer!=address(0),"MISSING");
        require(r.anchorHash==selectedAnchor,"SOURCE_PIN");
        observed=keccak256(r.body);principal=r.principalId;recordId=r.recordId;
    }
}
contract NativeFakeArchive {
    function claim(bytes32) external pure returns(NativeClaimArchive.Receipt memory r){r.importer=address(1);r.body=hex"bad0";}
}
