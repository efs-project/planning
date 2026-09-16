// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {FilesBytesRule,FilesContentRule} from "./FilesCarrierProfile.sol";
import {FilesExternalContentRule} from "./FilesExternalContentProfile.sol";
contract FilesExternalContentProfileTest is LabBase {
    bytes32 bt;bytes32 dt;bytes32 old;bytes32 sentinel;
    function setUp() public override {
        super.setUp();bt=registry.register(keccak256("lab/type/files-bytes/1"),address(new FilesBytesRule()),new bytes32[](0));
        bytes32[] memory refs=new bytes32[](1);refs[0]=bt;
        old=registry.register(keccak256("lab/type/files-content/1"),address(new FilesContentRule(bt)),refs);
        dt=registry.register(keccak256("lab/type/files-content/1"),address(new FilesExternalContentRule(bt)),refs);
        sentinel=ledger.publish(bt,abi.encode(sha256("")));
    }
    function body(uint32 length,string memory uri,uint8 carrier) internal view returns(bytes memory){
        return abi.encodePacked(sentinel,uint8(2),carrier,uint8(1),bytes29(0),bytes32(0),uint256(1),uint256(length),sha256("hello"),uri);
    }
    function reject(bytes32 t,bytes memory b) internal{(bool ok,)=address(ledger).call(abi.encodeCall(ledger.publish,(t,b)));require(!ok,"bad descriptor admitted");}
    function test_compact_ar_and_ipfs_exact_locator_retained() public {
        bytes memory ar=body(5,"ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",2);
        require(ar.length==240,"not compact");bytes32 r=ledger.publish(dt,ar);
        (,,,bytes memory retained)=ledger.record(r);require(keccak256(ar)==keccak256(retained),"locator lost");
        ledger.publish(dt,body(5,"ipfs://QmYwAPJzv5CZsnAzt8auVZRnGi2C2ZWfQ7eFMbB7xq4GoH/hello.txt",3));
    }
    function test_new_type_does_not_reinterpret_old_type_or_descriptor() public {
        require(old!=dt,"same Type identity");reject(old,body(5,"ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",2));
        bytes memory v1=abi.encode(sentinel,uint256(1),uint256(1),uint256(1),uint256(5),sha256("hello"),uint256(1),uint256(0),bytes32(0),uint256(5),sha256("hello"));
        ledger.publish(old,v1);ledger.publish(dt,v1);
    }
    function test_invalid_external_and_sentinel_fail_closed() public {
        reject(dt,body(16777217,"ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",2));
        reject(dt,body(5,"ar://short",2));reject(dt,body(5,"ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",3));
        reject(dt,body(5,"ipfs://QmYwAPJzv5CZsnAzt8auVZRnGi2C2ZWfQ7eFMbB7xq4GoH/../x",3));
        reject(dt,body(5,"ipfs://QmYwAPJzv5CZsnAzt8auVZRnGi2C2ZWfQ7eFMbB7xq4GoH/%2e",3));
        bytes memory b=body(5,"ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",2);b[34]=bytes1(uint8(3));reject(dt,b);
        sentinel=ledger.publish(bt,bytes.concat(abi.encode(sha256("x")),bytes("x")));reject(dt,body(5,"ar://AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",2));
    }
}
