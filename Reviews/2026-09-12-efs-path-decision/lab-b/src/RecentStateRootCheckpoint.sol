// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BoundedStateProof as B} from "./BoundedStateProof.sol";
import {RLPReader as R} from "./vendor/optimism/rlp/RLPReader.sol";

/// Permissionless local-chain BLOCKHASH acquisition; no setter/admin/foreign
/// adapter. Persistence does not remove source-chain finality/reorg assumptions.
contract RecentStateRootCheckpoint {
    struct Root {bytes32 blockHash;bytes32 stateRoot;}
    mapping(uint256=>Root) public roots;
    error InvalidCheckpoint();
    event Checkpoint(uint256 indexed number,bytes32 blockHash,bytes32 stateRoot);
    function checkpoint(bytes memory header) external returns(uint256 number,bytes32 root){
        if(header.length>1024)revert InvalidCheckpoint();B.check(header);
        R.RLPItem[] memory h=R.readList(header);if(h.length!=20)revert InvalidCheckpoint();
        for(uint256 i;i<20;i++){
            bytes memory b=R.readBytes(h[i]);
            if(i==2){if(b.length!=20)revert InvalidCheckpoint();}
            else if(i==6){if(b.length!=256)revert InvalidCheckpoint();}
            else if(i==14){if(b.length!=8)revert InvalidCheckpoint();}
            else if(i==12){if(b.length>32)revert InvalidCheckpoint();}
            else if(i==7||i==8||i==9||i==10||i==11||i==15||i==17||i==18){B.integer(h[i]);}
            else if(b.length!=32)revert InvalidCheckpoint();
        }
        number=B.integer(h[8]);root=B.fixedWord(h[3]);bytes32 hash=keccak256(header);
        if(number==0||number>=1<<40||root==0)revert InvalidCheckpoint();
        Root memory old=roots[number];
        if(old.blockHash!=0){if(old.blockHash!=hash||old.stateRoot!=root)revert InvalidCheckpoint();return(number,root);}
        if(number>=block.number||block.number-number>256||blockhash(number)==0||blockhash(number)!=hash)revert InvalidCheckpoint();
        roots[number]=Root(hash,root);emit Checkpoint(number,hash,root);
    }
}
