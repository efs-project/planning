// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {FilesDirectoryProfileTest} from "./FilesDirectoryProfile.t.sol";
import {FilesDirectoryIndex} from "./FilesDirectoryProfile.sol";
import {FilesLayout,FilesRootRule,FilesChildRule} from "./FilesJoinedProfile.sol";
import {FilesBytesRule,FilesContentRule,FilesCarrierRootRule,FilesCarrierChildRule,FilesConceptRule,FilesCarrierIndex} from "./FilesCarrierProfile.sol";
contract FilesCarrierProfileTest is LabBase {
    bytes32 bt;bytes32 dt;bytes32 rt;bytes32 ct;bytes32 ir;bytes32 ic;bytes32 concept;
    function setUp() public override {
        super.setUp();
        ir=registry.register(FilesLayout.ROOT_SHAPE,address(new FilesRootRule()),new bytes32[](0));
        ic=registry.register(FilesLayout.CHILD_SHAPE,address(new FilesChildRule(ir)),new bytes32[](1));
        bt=registry.register(keccak256("lab/type/files-bytes/1"),address(new FilesBytesRule()),new bytes32[](0));
        bytes32[] memory ref=new bytes32[](1);ref[0]=bt;
        dt=registry.register(keccak256("lab/type/files-content/1"),address(new FilesContentRule(bt)),ref);
        ref[0]=dt;rt=registry.register(keccak256("lab/type/files-carrier-root/1"),address(new FilesCarrierRootRule()),ref);
        ref=new bytes32[](2);ref[1]=dt;
        ct=registry.register(keccak256("lab/type/files-carrier-child/1"),address(new FilesCarrierChildRule(ir,ic,rt)),ref);
        concept=registry.register(keccak256("lab/type/files-concept/1"),address(new FilesConceptRule()),new bytes32[](0));
    }
    function descriptor(bytes memory raw,uint256 carrier) internal returns(bytes memory) {
        bytes memory payload=carrier==0?raw:bytes("");bytes32 target=ledger.publish(bt,bytes.concat(abi.encode(sha256(payload)),payload));
        return abi.encode(target,uint256(1),carrier,uint256(1),raw.length,sha256(raw),uint256(0),uint256(0),bytes32(0),raw.length,sha256(raw));
    }
    function reject(bytes32 t,bytes memory b) internal {
        uint64 beforeCount=admissions();(bool ok,)=address(ledger).call(abi.encodeCall(ledger.publish,(t,b)));
        require(!ok,"invalid carrier profile admitted through raw Core");require(admissions()==beforeCount,"failed publication leaked admission");
    }
    function test_empty_and_binary_descriptor_accepted() public {ledger.publish(dt,descriptor(bytes(""),0));ledger.publish(dt,descriptor(hex"00ff8041",0));}
    function test_maximum_inline_descriptor_inside_mandatory_budget() public {ledger.publish(dt,descriptor(new bytes(8160),0));}
    function test_bytes_supplied_digest_must_match_payload() public {reject(bt,bytes.concat(abi.encode(bytes32(uint256(9))),hex"00ff"));}
    function test_bytes_maximum_payload_admission() public {bytes memory raw=new bytes(8160);ledger.publish(bt,bytes.concat(abi.encode(sha256(raw)),raw));}
    function test_descriptor_extra_missing_length_rejected() public {bytes memory d=descriptor(hex"ff",0);reject(dt,bytes.concat(d,hex"00"));bytes memory short=new bytes(320);for(uint256 i;i<320;i++)short[i]=d[i];reject(dt,short);}
    function test_unsupported_algorithm_carrier_media_rejected() public {
        bytes memory d=descriptor(hex"ff",0);d[127]=bytes1(uint8(2));reject(dt,d);d[127]=bytes1(uint8(1));d[95]=bytes1(uint8(2));reject(dt,d);d[95]=0;d[223]=bytes1(uint8(3));reject(dt,d);
    }
    function test_inline_target_length_hash_and_type_rejected() public {
        bytes memory d=descriptor(hex"ff",0);d[159]=bytes1(uint8(2));reject(dt,d);d[159]=bytes1(uint8(1));d[160]^=bytes1(uint8(1));reject(dt,d);
        bytes32 wrong=ledger.publish(BINARY,hex"ff");d=descriptor(hex"ff",0);assembly("memory-safe"){mstore(add(d,32),wrong)}reject(dt,d);
    }
    function test_external_requires_empty_inline_sentinel() public {bytes memory d=descriptor(hex"ff",0);d[95]=bytes1(uint8(1));reject(dt,d);ledger.publish(dt,descriptor(hex"ff",1));}
    function test_bytes_and_concept_limits() public {reject(bt,new bytes(8193));reject(bt,bytes(""));reject(concept,abi.encode(bytes32(0)));reject(concept,bytes.concat(abi.encode(bytes32(uint256(1))),hex"00"));reject(concept,new bytes(161));ledger.publish(concept,bytes.concat(abi.encode(bytes32(uint256(7))),bytes("vacation")));}
    function test_root_child_exact_lineage_and_finite_parent_profiles() public {
        bytes32 file=ledger.create(bytes32(uint256(1)));bytes32 other=ledger.create(bytes32(uint256(2)));bytes32 d=ledger.publish(dt,descriptor(hex"00ff",0));
        bytes32 root=ledger.publish(rt,abi.encode(d,file));ledger.publish(ct,abi.encode(root,d,file));reject(ct,abi.encode(root,d,other));reject(rt,abi.encode(d,file,uint256(9)));reject(rt,abi.encode(d,bytes32(uint256(999))));
        bytes32 old=ledger.publish(ir,bytes.concat(abi.encode(file),hex"ff"));ledger.publish(ct,abi.encode(old,d,file));
        bytes32 oldChild=ledger.publish(ic,bytes.concat(abi.encode(old,file),hex"00"));ledger.publish(ct,abi.encode(oldChild,d,file));
        bytes32 fake=ledger.publish(BINARY,abi.encode(file));reject(ct,abi.encode(fake,d,file));
    }
    function test_encryption_canonical_parameters_required() public {
        bytes memory d=descriptor(new bytes(17),1);d[255]=bytes1(uint8(1));d[319]=bytes1(uint8(1));for(uint256 i=320;i<352;i++)d[i]=0;ledger.publish(dt,d);
        d[319]=bytes1(uint8(2));reject(dt,d);d[319]=bytes1(uint8(1));d[280]=bytes1(uint8(1));reject(dt,d);
    }
    function test_encrypted_public_plaintext_fingerprint_rejected_direct_core() public {
        bytes memory d=descriptor(new bytes(17),1);d[255]=bytes1(uint8(1));d[319]=bytes1(uint8(1));
        reject(dt,d); // The previous profile accepted this public nonzero digest.
        for(uint256 i=320;i<352;i++)d[i]=0;ledger.publish(dt,d);
        d[351]=bytes1(uint8(1));reject(dt,d);
    }
    function test_signed_batch_rejection_rolls_back_prior_create_and_publication() public {
        bytes memory d=descriptor(hex"ff",0);d[159]=bytes1(uint8(2));uint64 beforeCount=admissions();
        Ledger.Action[] memory a=new Ledger.Action[](2);bytes[] memory b=new bytes[](2);a[0]=aCreate(bytes32(uint256(9)));a[1]=aPublish(dt,d);b[1]=d;
        (Ledger.Intent memory intent,bytes memory sig)=signed(PK_A,ledger,0,a);
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.executeSigned,(intent,a,b,sig)));
        require(!ok,"signed invalid descriptor accepted");require(admissions()==beforeCount&&ledger.subjectCreatedAt(subjectOf(eoaA,9))==0&&ledger.nonces(eoaA)==0,"partial effects leaked");
    }
}
contract FilesCarrierIndexTest is FilesDirectoryProfileTest {
    bytes32[5] ts;bytes32[5] hs;
    function setUp() public virtual override {
        super.setUp();address rule=address(new FilesBytesRule());hs[0]=rule.codehash;ts[0]=registry.register(keccak256("lab/type/files-bytes/1"),rule,new bytes32[](0));
        bytes32[] memory refs=new bytes32[](1);refs[0]=ts[0];rule=address(new FilesContentRule(ts[0]));hs[1]=rule.codehash;
        ts[1]=registry.register(keccak256("lab/type/files-content/1"),rule,refs);
        refs[0]=ts[1];rule=address(new FilesCarrierRootRule());hs[2]=rule.codehash;ts[2]=registry.register(keccak256("lab/type/files-carrier-root/1"),rule,refs);
        refs=new bytes32[](2);refs[1]=ts[1];rule=address(new FilesCarrierChildRule(rt,ct,ts[2]));hs[3]=rule.codehash;ts[3]=registry.register(keccak256("lab/type/files-carrier-child/1"),rule,refs);
        rule=address(new FilesConceptRule());hs[4]=rule.codehash;ts[4]=registry.register(keccak256("lab/type/files-concept/1"),rule,new bytes32[](0));
        bytes32[8] memory old=[rt,ct,live.expectedRootRuleHash(),live.expectedChildRuleHash(),nt,live.expectedNameRuleHash(),dt,FilesDirectoryIndex(address(live)).expectedDirectoryRuleHash()];
        live=new FilesCarrierIndex(address(ledger),old,ts,hs);index=live;ledger.setIndexModule(address(index));
    }
    function test_carrier_child_reverse_parent_postings_and_reuse() public {
        bytes32 file=ledger.create(bytes32(uint256(101)));
        bytes32 raw=ledger.publish(ts[0],bytes.concat(abi.encode(sha256(hex"00ff")),hex"00ff"));
        bytes32 descriptorId=ledger.publish(ts[1],abi.encode(raw,uint256(1),uint256(0),uint256(1),uint256(2),sha256(hex"00ff"),uint256(0),uint256(0),bytes32(0),uint256(2),sha256(hex"00ff")));
        bytes32 root=ledger.publish(ts[2],abi.encode(descriptorId,file));bytes memory child=abi.encode(root,descriptorId,file);
        ledger.publish(ts[3],child);ledger.publish(ts[3],child);
        (uint64 count,,,)=index.postingHead(Keys.referenceList(ts[3],0,root));require(count==1,"carrier reverse-parent postings missing or duplicated");
    }
}
