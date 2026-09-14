// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {FilesLayout,FilesRootRule,FilesChildRule} from "./FilesJoinedProfile.sol";
import {FilesNameLayout,FilesNameRule} from "./FilesNamesProfile.sol";
import {FilesLiveNamesIndex} from "./FilesLiveIndex.sol";
import {FilesDirectoryRule,FilesDirectoryIndex,FilesDirectoryLayout} from "./FilesDirectoryProfile.sol";

contract FilesDirectoryProfileTest is LabBase {
    bytes32 rt; bytes32 ct; bytes32 nt; bytes32 dt;
    FilesLiveNamesIndex live;
    function setUp() public override {
        super.setUp();
        FilesRootRule rr=new FilesRootRule(); rt=registry.register(FilesLayout.ROOT_SHAPE,address(rr),new bytes32[](0));
        FilesChildRule cr=new FilesChildRule(rt); ct=registry.register(FilesLayout.CHILD_SHAPE,address(cr),new bytes32[](1));
        FilesNameRule nr=new FilesNameRule(); nt=registry.register(FilesNameLayout.SHAPE,address(nr),new bytes32[](0));
        FilesDirectoryRule dr=new FilesDirectoryRule();dt=registry.register(keccak256("lab/type/files-directory/1"),address(dr),new bytes32[](0));
        live=new FilesDirectoryIndex(address(ledger),rt,ct,address(rr).codehash,address(cr).codehash,nt,address(nr).codehash,dt,address(dr).codehash);
        index=live;ledger.setIndexModule(address(index));
    }
    function _reject(bytes32 parent,bytes32 target) internal {
        ledger.publish(nt,bytes("entry"));
        uint64 beforeCount=admissions();
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.bind,(FOLDER,parent,name("entry"),target,uint32(0))));
        require(!ok,"raw folder bind bypassed Directory parent validation");
        require(admissions()==beforeCount,"failed bind retained admission");
    }
    function test_nonexistent_parent_raw_ingress_rejected() public {_reject(bytes32(uint256(999)),ledger.create(bytes32(uint256(1))));}
    function test_file_subject_parent_raw_ingress_rejected() public {_reject(ledger.create(bytes32(uint256(2))),ledger.create(bytes32(uint256(1))));}
    function test_unrelated_record_parent_raw_ingress_rejected() public {_reject(ledger.publish(BINARY,bytes("forged-directory")),ledger.create(bytes32(uint256(1))));}
    function _directory(uint256 salt) internal returns(bytes32) {return ledger.publish(dt,abi.encode(ledger.create(bytes32(salt))));}
    function test_directory_exact_body_length_required() public {
        bytes32 seed=ledger.create(bytes32(uint256(7)));
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.publish,(dt,bytes.concat(abi.encode(seed),hex"ff"))));
        require(!ok,"Directory rule accepted trailing metadata");
    }
    function test_unrelated_record_target_raw_ingress_rejected() public {_reject(_directory(1),ledger.publish(BINARY,bytes("not-a-file")));}
    function test_self_link_raw_ingress_rejected() public {bytes32 dir=_directory(1);_reject(dir,dir);}
    function test_valid_directory_bootstrap_and_nested_file_without_head() public {
        require(live.attachedFrom()==1 && admissions()==0,"required index must precede admission 1");
        bytes32 root=_directory(1);bytes32 child=_directory(2);bytes32 file=ledger.create(bytes32(uint256(3)));
        ledger.publish(nt,bytes("child"));ledger.bind(FOLDER,root,name("child"),child,0);
        ledger.publish(nt,bytes("file"));ledger.bind(FOLDER,child,name("file"),file,0);
        require(live.liveCount(Keys.scopeList(Keys.scope(pid(address(this)),FOLDER,child)))==1,"typed child membership");
        require(ledger.subjectCreatedAt(root)==0,"descriptor identity is not CREATE subject");
    }
    function test_missing_zero_and_wrong_length_directory_seeds_rejected() public {
        bytes[3] memory bodies=[abi.encode(bytes32(0)),abi.encode(bytes32(uint256(999))),bytes("x")];
        for(uint256 i;i<bodies.length;i++){
            (bool ok,)=address(ledger).call(abi.encodeCall(ledger.publish,(dt,bodies[i])));require(!ok,"invalid Directory admitted");
        }
    }
    function test_lookalike_type_with_wrong_rule_is_not_a_directory() public {
        bytes32 forged=registry.register(FilesDirectoryLayout.SHAPE,address(0),new bytes32[](0));
        bytes32 id=ledger.publish(forged,abi.encode(ledger.create(bytes32(uint256(1)))));
        _reject(_directory(2),id);
    }
    function test_directory_pin_rejects_wrong_rule_hash() public {
        (bool ok,)=address(this).staticcall(abi.encodeCall(this.pinDirectory,(bytes32(uint256(1)))));
        require(!ok,"unreviewed rule hash accepted");
    }
    function pinDirectory(bytes32 ruleHash) external view {FilesDirectoryLayout.pin(ledger,dt,ruleHash);}
    function test_withdrawn_descriptor_remains_valid_and_bind_before_name_parent_publish_is_atomic() public {
        bytes32 seed=ledger.create(bytes32(uint256(1)));bytes memory body=abi.encode(seed);bytes32 parent=rid(dt,body);
        bytes32 target=ledger.create(bytes32(uint256(2)));Ledger.Action[] memory a=new Ledger.Action[](3);bytes[] memory b=new bytes[](3);
        a[0]=aBind(FOLDER,parent,name("later"),target,0);a[1]=aPublish(dt,body);b[1]=body;
        a[2]=aPublish(nt,bytes("later"));b[2]=bytes("later");ledger.execute(a,b,ledger.nonces(address(this)));
        (,uint64 first,,)=ledger.record(parent);
        Ledger.Action[] memory w=new Ledger.Action[](1);bytes[] memory wb=new bytes[](1);
        w[0].kind=6;w[0].target=bytes32(uint256(first));ledger.execute(w,wb,ledger.nonces(address(this)));
        (,,uint32 occurrences,)=ledger.record(parent);require(occurrences==0,"occurrence withdrawn");
        require(FilesDirectoryLayout.validate(ledger,dt,parent,admissions()),"withdrawal treated as erasure");
        ledger.bind(FOLDER,parent,name("later"),target,1);
    }
    function test_required_index_failure_rolls_back_whole_signed_batch() public {
        bytes32 file=subjectOf(eoaA,88);bytes32 role=name("late-name");
        Ledger.Action[] memory a=new Ledger.Action[](3);bytes[] memory b=new bytes[](3);
        a[0]=aCreate(bytes32(uint256(88)));a[1]=aBind(FOLDER,bytes32(uint256(999)),role,file,0);
        a[2]=aPublish(nt,bytes("late-name"));b[2]=bytes("late-name");
        (Ledger.Intent memory intent,bytes memory sig)=signed(PK_A,ledger,0,a);
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.executeSigned,(intent,a,b,sig)));
        require(!ok,"required directory validation bypassed in signed batch");
        require(admissions()==0 && ledger.nonces(eoaA)==0 && ledger.subjectCreatedAt(file)==0 && index.lastProcessed()==0,"partial core/index commit");
        (bytes32 t,,,)=ledger.record(rid(nt,bytes("late-name")));require(t==0,"Name leaked");
        bytes32 key=Keys.scopeList(Keys.scope(pid(eoaA),FOLDER,bytes32(uint256(999))));
        (uint64 count,,,)=index.postingHead(key);require(count==0 && live.liveCount(key)==0,"postings leaked");
        (uint8 state,uint32 revision,,,,)=ledger.head(Keys.binding(pid(eoaA),Keys.position(FOLDER,bytes32(uint256(999)),role)));
        require(state==0 && revision==0 && ledger.bindingPosition(1)==0,"head/coordinate leaked");
    }
}
