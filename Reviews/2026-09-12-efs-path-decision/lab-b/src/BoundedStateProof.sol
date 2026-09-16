// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {RLPReader} from "./vendor/optimism/rlp/RLPReader.sol";
import {SecureMerkleTrie} from "./vendor/optimism/trie/SecureMerkleTrie.sol";

/// Positive inclusion only. Upstream is preserved byte-for-byte; stricter
/// canonical/shape/budget checks live here, never reinterpret failure as zero.
library BoundedStateProof {
    error InvalidProof();
    function check(bytes memory b) internal pure {
        if(b.length==0||_item(b,0,0)!=b.length)revert InvalidProof();
    }
    function _item(bytes memory b,uint256 at,uint256 depth) private pure returns(uint256 end) {
        if(at>=b.length||depth>32)revert InvalidProof();
        uint256 tag=uint8(b[at]);if(tag<128)return at+1;
        bool list=tag>=192;uint256 start=at+1;uint256 len;
        uint256 shortBase=list?192:128;uint256 longBase=list?247:183;
        if(tag<=longBase){len=tag-shortBase;}
        else {
            uint256 n=tag-longBase;
            if(n>4||start+n>b.length||b[start]==0)revert InvalidProof();
            for(uint256 i;i<n;i++)len=(len<<8)|uint8(b[start+i]);
            if(len<56)revert InvalidProof();start+=n;
        }
        end=start+len;if(end>b.length)revert InvalidProof();
        if(!list){if(len==1&&uint8(b[start])<128)revert InvalidProof();return end;}
        uint256 cursor=start;while(cursor<end)cursor=_item(b,cursor,depth+1);
        if(cursor!=end)revert InvalidProof();
    }
    function integer(RLPReader.RLPItem memory item) internal pure returns(uint256 v) {
        bytes memory b=RLPReader.readBytes(item);
        if(b.length>32||(b.length>0&&b[0]==0))revert InvalidProof();
        for(uint256 i;i<b.length;i++)v=(v<<8)|uint8(b[i]);
    }
    function fixedWord(RLPReader.RLPItem memory item) internal pure returns(bytes32 v){
        bytes memory b=RLPReader.readBytes(item);if(b.length!=32)revert InvalidProof();
        assembly("memory-safe"){v:=mload(add(b,32))}
    }
    function bounds(bytes[] memory nodes) internal pure returns(uint256 total){
        if(nodes.length==0||nodes.length>65)revert InvalidProof();
        for(uint256 i;i<nodes.length;i++){
            if(nodes[i].length==0||nodes[i].length>1024)revert InvalidProof();total+=nodes[i].length;
        }
    }
    function _child(RLPReader.RLPItem memory item) private pure {
        bytes memory b=RLPReader.readRawBytes(item);
        if(uint8(b[0])>=192){if(b.length>=32)revert InvalidProof();_shape(b);}
        else {uint256 n=RLPReader.readBytes(item).length;if(n!=0&&n!=32)revert InvalidProof();}
    }
    function _shape(bytes memory b) private pure {
        RLPReader.RLPItem[] memory n=RLPReader.readList(b);
        if(n.length==17){for(uint256 i;i<16;i++)_child(n[i]);RLPReader.readBytes(n[16]);}
        else if(n.length==2){
            bytes memory p=RLPReader.readBytes(n[0]);if(p.length==0)revert InvalidProof();
            uint8 prefix=uint8(p[0])>>4;
            if(prefix>3||(prefix%2==0&&(uint8(p[0])&15)!=0))revert InvalidProof();
            if(prefix<2){if(prefix==0&&p.length==1)revert InvalidProof();_child(n[1]);}
            else if(RLPReader.readBytes(n[1]).length==0)revert InvalidProof();
        }else revert InvalidProof();
    }
    function value(bytes32 root,bytes memory key,bytes[] memory nodes) internal pure returns(bytes memory v){
        bounds(nodes);
        for(uint256 i;i<nodes.length;i++){
            check(nodes[i]);_shape(nodes[i]);
            for(uint256 j;j<i;j++)if(keccak256(nodes[i])==keccak256(nodes[j]))revert InvalidProof();
        }
        return SecureMerkleTrie.get(key,nodes,root);
    }
    function account(bytes32 root,address who,bytes[] memory nodes) internal pure returns(bytes32 storageRoot,bytes32 codeHash){
        bytes memory v=value(root,abi.encodePacked(who),nodes);check(v);
        RLPReader.RLPItem[] memory a=RLPReader.readList(v);if(a.length!=4)revert InvalidProof();
        integer(a[0]);integer(a[1]);return(fixedWord(a[2]),fixedWord(a[3]));
    }
    function storageValue(bytes32 root,bytes32 key,bytes[] memory nodes) internal pure returns(uint256 v){
        bytes memory encoded=value(root,abi.encode(key),nodes);check(encoded);
        v=integer(RLPReader.toRLPItem(encoded));if(v==0)revert InvalidProof();
    }
}
