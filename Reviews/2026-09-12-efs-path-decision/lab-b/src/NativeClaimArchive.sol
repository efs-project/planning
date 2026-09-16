// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {NativePublicationProof} from "./NativePublicationProof.sol";

/// Same-chain verified retention, no destination edit rights. Full trie nodes
/// remain in the offline packet; archive stores their exact witness commitment.
contract NativeClaimArchive {
    NativePublicationProof public immutable verifier;
    struct Receipt {bytes32 claimId;bytes32 recordId;bytes32 principalId;bytes32 root;bytes32 anchorHash;uint64 checkpoint;uint64 acceptanceBlock;address importer;bool withdrawn;uint32 occurrences;bytes body;}
    mapping(bytes32=>Receipt) private retained;
    event Retained(bytes32 indexed witnessId,bytes32 indexed claimId,address importer);
    constructor(NativePublicationProof v){verifier=v;}
    function retain(NativePublicationProof.Witness memory w) external returns(bytes32 witnessId){
        NativePublicationProof.Result memory r=verifier.verify(w);witnessId=r.witnessId;
        if(retained[witnessId].importer==address(0)){
            retained[witnessId]=Receipt(r.claimId,r.recordId,r.principalId,r.stateRoot,verifier.anchorHash(),w.checkpoint,r.acceptanceBlock,msg.sender,r.withdrawn,r.occurrences,w.body);
            emit Retained(witnessId,r.claimId,msg.sender);
        }
    }
    function claim(bytes32 witnessId) external view returns(Receipt memory){return retained[witnessId];}
}
