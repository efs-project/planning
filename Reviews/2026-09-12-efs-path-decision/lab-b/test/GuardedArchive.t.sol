// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {SignedClaimArchiveCodeBlob, SignedClaimArchiveBase as Archive} from "../src/SignedClaimArchive.sol";
import {ArchiveVm} from "./SignedClaimArchive.t.sol";
import {ArchiveReadConsumer} from "./ArchiveReadConsumer.sol";

interface GuardedArchiveAPI {
    function retainGuardedSignedClaim(Ledger.IntentV2 calldata source, Ledger.Action[] calldata actions,
        Ledger.ReadSetV2 calldata reads, Ledger.ExecutionInfo calldata execution, bytes calldata sig,
        Archive.BodyInput[] calldata bodies) external returns (bytes32);
    function claimFormat(bytes32 id) external view returns (uint8);
    function readSetBytes(bytes32 key) external view returns (bool, bytes memory);
    function executionInfo(bytes32 key) external view returns (bool, Ledger.ExecutionInfo memory);
}

contract GuardedArchiveTest is LabBase {
    SignedClaimArchiveCodeBlob archive;
    GuardedArchiveAPI api;
    ArchiveVm constant avm = ArchiveVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function setUp() public override { super.setUp(); archive = new SignedClaimArchiveCodeBlob(); api = GuardedArchiveAPI(address(archive)); }

    function fixture(Ledger.ReadSetV2 memory reads) internal view returns (Ledger.IntentV2 memory x, Ledger.ExecutionInfo memory execution) {
        execution = Ledger.ExecutionInfo(keccak256("source-origin"), 7, keccak256("shell"), address(11),
            keccak256("implementation"), address(12), keccak256("registry"), address(13), keccak256("index"), 4);
        x = Ledger.IntentV2(REALM, execution.origin, keccak256(abi.encode(keccak256("efs.lab.execution-set/2"),
            ledger.LAYOUT_ID(), ledger.domainSeparator(), ledger.guardedDomainSeparator(), execution)), eoaA, 0, 1,
            keccak256("past-policy"), keccak256("past-index"), keccak256(abi.encode(ledger.READ_SET_V2(), reads)));
    }
    function sign(Ledger.IntentV2 memory x, Ledger.Action[] memory actions) internal pure returns (bytes32 digest, bytes memory sig) {
        bytes32 domain = keccak256(abi.encode(keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-RoadB-Lab"), keccak256("2")));
        bytes32 typeHash = keccak256("IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)");
        digest = keccak256(abi.encodePacked(hex"1901", domain, keccak256(abi.encode(typeHash, x, keccak256(abi.encode(actions))))));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(PK_A, digest); sig = abi.encodePacked(r,s,v);
    }
    function test_guarded_retains_exact_mandatory_preimages_and_refuses_legacy_getter() public {
        Ledger.ReadSetV2 memory reads;
        (Ledger.IntentV2 memory x, Ledger.ExecutionInfo memory execution) = fixture(reads);
        Ledger.Action[] memory actions = one(aPublish(BINARY, hex"01"));
        (bytes32 digest, bytes memory sig) = sign(x, actions);
        bytes32 id = api.retainGuardedSignedClaim(x, actions, reads, execution, sig, new Archive.BodyInput[](0));
        require(id == digest && api.claimFormat(id) == 2, "explicit guarded digest and format");
        (bool exists, bytes memory encoded) = api.readSetBytes(x.readSetHash);
        require(exists && encoded.length == 224 && keccak256(encoded) == keccak256(abi.encode(reads)), "explicit canonical empty read preimage");
        (exists, execution) = api.executionInfo(x.executionSet);
        require(exists && execution.revision == 7, "historical execution retained");
        (bool ok,) = address(archive).staticcall(abi.encodeCall(archive.claim, (id)));
        require(!ok, "v2 cannot masquerade as zero legacy intent");
        require(archive.actionAt(id,0).bodyHashOrRecordId == keccak256(hex"01"), "shared vector reader");
    }

    function readsAt(uint256 n, uint256 m) internal pure returns (Ledger.ReadSetV2 memory rs) {
        rs.principalIds = new bytes32[](n); rs.positions = new bytes32[](m); rs.expectedHeads = new bytes32[](n*m);
        for (uint256 i; i < n; ++i) rs.principalIds[i] = bytes32(i+1);
        for (uint256 i; i < m; ++i) rs.positions[i] = bytes32(i+100);
        for (uint256 i; i < n*m; ++i) rs.expectedHeads[i] = bytes32(i+1000);
    }
    function retain(Ledger.IntentV2 memory x, Ledger.Action[] memory a, Ledger.ReadSetV2 memory rs, Ledger.ExecutionInfo memory ex,
        Archive.BodyInput[] memory bodies) internal returns (bytes32 id) {
        (,bytes memory sig) = sign(x,a); id = api.retainGuardedSignedClaim(x,a,rs,ex,sig,bodies);
    }
    function rejected(Ledger.IntentV2 memory x, Ledger.Action[] memory a, Ledger.ReadSetV2 memory rs, Ledger.ExecutionInfo memory ex,
        bytes memory sig, bytes4 errorSelector) internal {
        uint64 nonce = avm.getNonce(address(archive)); avm.record();
        (bool ok,bytes memory error) = address(api).call(abi.encodeCall(api.retainGuardedSignedClaim,(x,a,rs,ex,sig,new Archive.BodyInput[](0))));
        require(!ok && bytes4(error) == errorSelector, "expected guarded refusal");
        (,bytes32[] memory writes) = avm.accesses(address(archive));
        require(writes.length == 0 && avm.getNonce(address(archive)) == nonce, "refusal before writes or CREATE");
    }
    function test_guarded_all_intent_execution_action_fields_order_domains_and_signature_tamper() public {
        Ledger.ReadSetV2 memory rs = readsAt(2,2);
        (Ledger.IntentV2 memory x,Ledger.ExecutionInfo memory ex) = fixture(rs);
        Ledger.Action[] memory actions = two(aPublish(BINARY,hex"01"),aPublish(BINARY,hex"02"));
        (,bytes memory sig) = sign(x,actions);
        bytes memory encoded = abi.encode(x);
        for(uint256 i; i<9; ++i) {
            bytes memory changed = bytes.concat(encoded);
            changed[i*32+31] = bytes1(uint8(changed[i*32+31]) ^ 1);
            Ledger.IntentV2 memory wrong = abi.decode(changed,(Ledger.IntentV2));
            rejected(wrong,actions,rs,ex,sig,i==1||i==2||i==8?Archive.E_CONTEXT.selector:Archive.E_SIGNATURE.selector);
        }
        encoded = abi.encode(ex);
        for(uint256 i; i<10; ++i) {
            bytes memory changed = bytes.concat(encoded); changed[i*32+31] = bytes1(uint8(changed[i*32+31]) ^ 1);
            rejected(x,actions,rs,abi.decode(changed,(Ledger.ExecutionInfo)),sig,Archive.E_CONTEXT.selector);
        }
        encoded = abi.encode(actions[0]);
        for(uint256 i; i<9; ++i) {
            bytes memory changed = bytes.concat(encoded); changed[i*32+31] = bytes1(uint8(changed[i*32+31]) ^ 1);
            actions[0] = abi.decode(changed,(Ledger.Action)); rejected(x,actions,rs,ex,sig,Archive.E_SIGNATURE.selector);
        }
        actions[0] = aPublish(BINARY,hex"01");
        (actions[0],actions[1]) = (actions[1],actions[0]); rejected(x,actions,rs,ex,sig,Archive.E_SIGNATURE.selector);
        (actions[0],actions[1]) = (actions[1],actions[0]);
        (rs.principalIds[0],rs.principalIds[1]) = (rs.principalIds[1],rs.principalIds[0]); rejected(x,actions,rs,ex,sig,Archive.E_CONTEXT.selector);
        rs = readsAt(2,2); (rs.positions[0],rs.positions[1]) = (rs.positions[1],rs.positions[0]); rejected(x,actions,rs,ex,sig,Archive.E_CONTEXT.selector);
        rs = readsAt(2,2); rs.expectedHeads[0] = bytes32(0); rejected(x,actions,rs,ex,sig,Archive.E_CONTEXT.selector);
        rs = readsAt(2,2);
        rejected(x,actions,rs,ex,hex"",Archive.E_SOURCE_UNSUPPORTED.selector);
        rejected(x,actions,rs,ex,new bytes(64),Archive.E_SIGNATURE.selector);
        bytes memory bad = bytes.concat(sig); bad[64] = bytes1(uint8(29)); rejected(x,actions,rs,ex,bad,Archive.E_SIGNATURE.selector);
        bad = bytes.concat(sig); for(uint256 i=32;i<64;++i)bad[i]=0xff; rejected(x,actions,rs,ex,bad,Archive.E_SIGNATURE.selector);
        (uint8 v,bytes32 r,bytes32 s) = vm.sign(PK_A,keccak256(abi.encodePacked(hex"1901",ledger.domainSeparator(),bytes32(0))));
        rejected(x,actions,rs,ex,abi.encodePacked(r,s,v),Archive.E_SIGNATURE.selector);
    }
    function test_guarded_readset_shape_bounds_and_missing_preimages() public {
        Ledger.ReadSetV2 memory rs = readsAt(2,2);
        (Ledger.IntentV2 memory x,Ledger.ExecutionInfo memory ex) = fixture(rs);
        Ledger.Action[] memory a = one(aPublish(BINARY,hex"01")); (,bytes memory sig) = sign(x,a);
        for(uint256 i; i<7; ++i) {
            Ledger.ReadSetV2 memory bad = readsAt(2,2);
            if(i==0)bad.principalIds=new bytes32[](65);
            if(i==1)bad.positions=new bytes32[](5);
            if(i==2)bad.expectedHeads=new bytes32[](3);
            if(i==3)bad.principalIds[0]=0;
            if(i==4)bad.principalIds[0]=bad.principalIds[1];
            if(i==5)bad.positions[0]=0;
            if(i==6)bad.positions[0]=bad.positions[1];
            rejected(x,a,bad,ex,sig,Archive.E_READSET_SHAPE.selector);
        }
        Ledger.ReadSetV2 memory empty; rejected(x,a,empty,ex,sig,Archive.E_CONTEXT.selector);
        Ledger.ExecutionInfo memory absent; rejected(x,a,rs,absent,sig,Archive.E_CONTEXT.selector);
        (bool exists,bytes memory raw)=api.readSetBytes(bytes32(uint256(99)));require(!exists&&raw.length==0,"unknown is not empty");
        (exists,absent)=api.executionInfo(bytes32(uint256(99)));require(!exists,"explicit absent execution");
    }
    function test_guarded_64_leaves_max_readset_shared_dedupe_retries_and_claim_local_completion() public {
        Ledger.ReadSetV2 memory rs=readsAt(64,4);(Ledger.IntentV2 memory x,Ledger.ExecutionInfo memory ex)=fixture(rs);
        Ledger.Action[] memory a=new Ledger.Action[](64);
        for(uint256 i;i<64;++i){a[i]=aPublish(BINARY,abi.encode(i));}
        bytes32 id=retain(x,a,rs,ex,new Archive.BodyInput[](0));
        require(avm.getNonce(address(archive))==3,"one vector and one read carrier");
        (bool exists,bytes memory raw)=api.readSetBytes(x.readSetHash);
        require(exists&&raw.length==10592&&keccak256(raw)==keccak256(abi.encode(rs)),"max readset exact");
        require(keccak256(abi.encode(archive.actionAt(id,63)))==keccak256(abi.encode(a[63])),"leaf 63 exact");
        (,bytes memory sig)=sign(x,a);avm.record();
        require(api.retainGuardedSignedClaim(x,a,rs,ex,sig,new Archive.BodyInput[](0))==id,"retry digest");
        (,bytes32[] memory writes)=avm.accesses(address(archive));require(writes.length==0&&avm.getNonce(address(archive))==3,"retry no writes or CREATE");
        x.deadline=2;bytes32 other=retain(x,a,rs,ex,new Archive.BodyInput[](0));
        require(other!=id&&avm.getNonce(address(archive))==4,"same nonce distinct claim shared read/execution");
        Archive.BodyInput[] memory bodies=new Archive.BodyInput[](1);bodies[0]=Archive.BodyInput(63,abi.encode(uint256(63)));
        archive.attachBodies(id,bodies);
        (,,bool attached,bytes memory body)=archive.selectedRecord(other,63);require(!attached&&body.length==0,"no global coverage laundering");
        archive.attachBodies(other,bodies);(,,attached,body)=archive.selectedRecord(other,63);require(attached&&keccak256(body)==keccak256(bodies[0].body),"explicit complete leaf");
        require(archive.signedRecordClaimCount(rid(BINARY,abi.encode(uint256(63))))==2,"one posting per claim leaf");
    }
    function test_guarded_optional_bodies_bounds_duplicates_empty_and_unknown_actions() public {
        Ledger.ReadSetV2 memory rs;(Ledger.IntentV2 memory x,Ledger.ExecutionInfo memory ex)=fixture(rs);
        Ledger.Action[] memory a=two(aPublish(BINARY,hex""),aPublish(BINARY,new bytes(8193)));
        (,bytes memory sig)=sign(x,a);Archive.BodyInput[] memory b=new Archive.BodyInput[](1);b[0]=Archive.BodyInput(1,new bytes(8193));
        (bool ok,bytes memory error)=address(api).call(abi.encodeCall(api.retainGuardedSignedClaim,(x,a,rs,ex,sig,b)));
        require(!ok&&bytes4(error)==Archive.E_BOUNDS.selector&&avm.getNonce(address(archive))==1,"oversized body no CREATE");
        b[0]=Archive.BodyInput(0,hex"");bytes32 id=api.retainGuardedSignedClaim(x,a,rs,ex,sig,b);
        (,,bool attached,bytes memory body)=archive.selectedRecord(id,0);require(attached&&body.length==0,"empty body is present");
        b=new Archive.BodyInput[](2);b[0]=Archive.BodyInput(0,hex"");b[1]=Archive.BodyInput(0,hex"");
        (ok,error)=address(archive).call(abi.encodeCall(archive.attachBodies,(id,b)));require(!ok&&bytes4(error)==Archive.E_BODY_LEAF.selector,"duplicate leaf rejected");
        a=one(aPublish(BINARY,hex"01"));a[0].kind=99;x.nonce=1;id=retain(x,a,rs,ex,new Archive.BodyInput[](0));
        require(archive.actionAt(id,0).kind==99,"signed unknown action is retained uninterpreted");
        require(archive.signedRecordClaimCount(rid(BINARY,hex"01"))==0,"unknown action is not a Record posting");
    }
    function test_paid_full_preimages_require_presence_and_return_exact_commitments() public {
        Ledger.ReadSetV2 memory rs=readsAt(64,4);(Ledger.IntentV2 memory x,Ledger.ExecutionInfo memory ex)=fixture(rs);
        retain(x,one(aPublish(BINARY,hex"01")),rs,ex,new Archive.BodyInput[](0));
        ArchiveReadConsumer consumer=new ArchiveReadConsumer();
        (bool ok,bytes memory out)=address(consumer).call(abi.encodeWithSignature("readPreimages(address,bytes32,bytes32)",address(archive),x.readSetHash,x.executionSet));
        require(ok&&keccak256(out)==keccak256(abi.encode(keccak256(abi.encode(rs)),keccak256(abi.encode(ex)))),"paid exact preimages");
    }
}
