// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {RecentStateRootCheckpoint} from "../src/RecentStateRootCheckpoint.sol";
import {BoundedStateProof} from "../src/BoundedStateProof.sol";
interface VmNativeProof {
    function roll(uint256) external;
    function setBlockhash(uint256,bytes32) external;
}
contract NativeProofHarness {
    function storageValue(bytes32 root,bytes32 key,bytes[] memory nodes) external pure returns(uint256) {
        return BoundedStateProof.storageValue(root,key,nodes);
    }
}
contract NativeStateProofTest {
    VmNativeProof constant vm=VmNativeProof(address(uint160(uint256(keccak256("hevm cheat code")))));
    function _rlp(bytes memory b) private pure returns(bytes memory) {
        if(b.length==1&&uint8(b[0])<128)return b;
        if(b.length<56)return bytes.concat(bytes1(uint8(128+b.length)),b);
        return bytes.concat(hex"b9",bytes2(uint16(b.length)),b);
    }
    function _header(bytes memory number) private pure returns(bytes memory) {
        bytes memory p;
        for(uint256 i;i<20;i++){
            bytes memory b;
            if(i==2)b=new bytes(20);
            else if(i==6)b=new bytes(256);
            else if(i==14)b=new bytes(8);
            else if(i==8)b=number;
            else if(i==7||i==9||i==10||i==11||i==12||i==15||i==17||i==18)b=hex"";
            else b=abi.encode(bytes32(uint256(i+1)));
            p=bytes.concat(p,_rlp(b));
        }
        return bytes.concat(hex"f9",bytes2(uint16(p.length)),p);
    }
    function test_checkpoint_write_once_recent_cancun_and_retained_retry() public {
        RecentStateRootCheckpoint c=new RecentStateRootCheckpoint();bytes memory h=_header(hex"64");
        vm.roll(101);vm.setBlockhash(100,keccak256(h));c.checkpoint(h);
        (bytes32 hash,bytes32 root)=c.roots(100);require(hash==keccak256(h)&&root==bytes32(uint256(4)),"authenticated root");
        vm.roll(1000);c.checkpoint(h); // acquired evidence survives BLOCKHASH window
        bytes memory mutated=_header(hex"64");mutated[50]=bytes1(uint8(mutated[50])^1);
        (bool ok,)=address(c).call(abi.encodeCall(c.checkpoint,(mutated)));require(!ok,"mutation");
    }
    function test_checkpoint_rejects_current_future_expired_nonminimal_and_trailing() public {
        RecentStateRootCheckpoint c=new RecentStateRootCheckpoint();vm.roll(400);
        bytes[6] memory bad=[_header(hex"0190"),_header(hex"0191"),_header(hex"64"),_header(hex"0001"),bytes.concat(_header(hex"018f"),hex"00"),_header(hex"")];
        for(uint256 i;i<bad.length;i++){
            vm.setBlockhash(399,keccak256(bad[i]));
            (bool ok,)=address(c).call(abi.encodeCall(c.checkpoint,(bad[i])));require(!ok,"invalid checkpoint accepted");
        }
    }
    function test_positive_storage_exact_secure_key_and_complete_consumption() public {
        NativeProofHarness h=new NativeProofHarness();bytes32 key=bytes32(uint256(17));
        bytes memory leaf=bytes.concat(hex"e3a120",keccak256(abi.encode(key)),hex"01");
        bytes[] memory nodes=new bytes[](1);nodes[0]=leaf;
        require(h.storageValue(keccak256(leaf),key,nodes)==1,"positive leaf");
        (bool ok,)=address(h).call(abi.encodeCall(h.storageValue,(keccak256(leaf),bytes32(uint256(18)),nodes)));require(!ok,"wrong secure key");
        nodes=new bytes[](2);nodes[0]=leaf;nodes[1]=leaf;
        (ok,)=address(h).call(abi.encodeCall(h.storageValue,(keccak256(leaf),key,nodes)));require(!ok,"trailing node");
    }
}
