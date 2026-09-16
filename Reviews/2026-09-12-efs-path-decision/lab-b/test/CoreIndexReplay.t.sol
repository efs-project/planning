// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {IIndexReadiness,IIndexModule} from "../src/Interfaces.sol";
import {ExecutionSlots} from "../src/ExecutionSlots.sol";

interface ReplayEntry {
    function replayNextPublication() external;
    function provenFrom() external view returns(uint64);
}
interface CutoverEntry {
    struct Request {address replacement;address expectedOld;uint64 expectedAdmission;uint64 expectedPublication;bytes32 requiredManifest;bytes32 expectedReplacementCodehash;uint64 expectedGeneration;}
    function replaceIndexWhenReady(Request calldata request) external;
}
interface ReplayVm {function store(address,bytes32,bytes32) external;function prank(address) external;function etch(address,bytes calldata) external;}

/// Fault-injection source is only the reviewed index getter boundary. Assertions
/// exercise the real Ledger/helper refusal and unchanged execution/index state.
contract BadReadiness {
    bytes public response;
    bytes32 public manifest;
    constructor(bytes memory r,bytes32 m){response=r;manifest=m;}
    function manifestHash() external view returns(bytes32){return manifest;}
    fallback() external {bytes memory r=response;assembly("memory-safe"){return(add(r,32),mload(r))}}
}
contract GasBurningReadiness {
    fallback() external {assembly("memory-safe"){for {} 1 {} {}}}
}

contract CoreIndexReplayTest is LabBase {
    ReplayVm private constant probe=ReplayVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function test_imported_create_replays_retained_source_creator() public {
        Ledger.Action[] memory actions=one(aCreate(bytes32("imported-subject")));
        (Ledger.Intent memory intent,bytes memory signature)=signed(PK_A,ledger,0,actions);
        (uint64 publication,)=ledger.executeSigned(intent,actions,new bytes[](1),signature);
        Ledger.SourceEvidence memory src;
        (src.author,,src.v,,,src.r,src.s,src.nonce,src.deadline,,src.acceptanceProfile,src.indexObligations,)=ledger.evidence(publication);
        src.realmId=ledger.realmId();src.coreCodeCommitment=address(ledger).codehash;src.sourcePrincipal=ledger.principalOf(eoaA);
        Ledger dest=new Ledger(registry,bytes32("import-destination"));
        (Ledger.Intent memory authorization,bytes memory sig)=signed(PK_A,dest,0,actions);
        dest.importPublication(src,actions,new bytes[](1),authorization,sig);
        IndexModule replacement=new IndexModule(address(dest));
        bytes32 creatorSlot=bytes32(uint256(keccak256(abi.encode(uint256(1),uint256(12))))+6);
        probe.store(address(dest),creatorSlot,bytes32("wrong-source-creator"));
        (bool ok,)=address(replacement).call(abi.encodeCall(replacement.replayNextPublication,()));
        require(!ok&&replacement.lastProcessed()==0,"import ignored retained source creator");
        probe.store(address(dest),creatorSlot,src.sourcePrincipal);replacement.replayNextPublication();
        require(replacement.lastProcessed()==1&&replacement.replayReadiness().phase==1,"import replay incomplete");
        require(dest.subjectCreatedAt(Keys.subject(src.sourcePrincipal,actions[0].salt))==1,"source subject lost");
    }
    function test_cutover_rejects_wide_fixed_request_and_old_guarded_signature() public {
        ledger.publish(ITEM,hex"01");IndexModule next=new IndexModule(address(ledger));next.replayNextPublication();
        CutoverEntry.Request memory request=CutoverEntry.Request(address(next),address(index),1,1,next.manifestHash(),address(next).codehash,0);
        bytes memory encoded=abi.encodeCall(CutoverEntry.replaceIndexWhenReady,(request));
        assembly("memory-safe"){mstore(add(encoded,100),shl(64,1))}
        (bool ok,)=address(ledger).call(encoded);require(!ok&&ledger.indexModule()==address(index),"wide admission truncated");
        Ledger.Action[] memory actions=one(aCreate(bytes32("old-plan")));Ledger.ReadSetV2 memory rs;
        Ledger.IntentV2 memory intent=Ledger.IntentV2(REALM,ledger.realmOrigin(),ledger.executionSet(),eoaA,0,uint64(block.timestamp+100),ledger.acceptanceProfileOf(actions),ledger.indexObligations(),ledger.readSetHash(rs));
        (uint8 v,bytes32 r,bytes32 s)=vm.sign(PK_A,ledger.guardedIntentDigest(intent,keccak256(abi.encode(actions))));
        bytes memory sig=abi.encodePacked(r,s,v);CutoverEntry(address(ledger)).replaceIndexWhenReady(request);
        (ok,)=address(ledger).call(abi.encodeCall(ledger.executeGuardedSigned,(intent,actions,new bytes[](1),rs,sig)));
        require(!ok&&ledger.nonces(eoaA)==0&&admissions()==1,"old signed physical plan survived cutover");
    }
    function test_guard_codec_preserves_hash_error_before_exact_stale_coordinates() public {
        Ledger.ReadSetV2 memory rs;rs.principalIds=new bytes32[](3);rs.positions=new bytes32[](2);rs.expectedHeads=new bytes32[](6);
        for(uint256 i;i<3;i++)rs.principalIds[i]=bytes32(i+1);for(uint256 i;i<2;i++)rs.positions[i]=bytes32(i+11);
        bytes32 empty=keccak256(abi.encode(keccak256("efs.lab.head-snapshot/2"),uint8(0),uint32(0),uint64(0),bytes32(0)));
        for(uint256 i;i<6;i++)rs.expectedHeads[i]=empty;rs.expectedHeads[5]=bytes32("stale");
        Ledger.Action[] memory actions=one(aCreate(bytes32("no-write")));
        Ledger.IntentV2 memory intent=Ledger.IntentV2(REALM,ledger.realmOrigin(),ledger.executionSet(),eoaA,0,uint64(block.timestamp+100),ledger.acceptanceProfileOf(actions),ledger.indexObligations(),bytes32("wrong-hash"));
        (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.executeGuardedSigned,(intent,actions,new bytes[](1),rs,new bytes(65))));
        require(!ok&&keccak256(err)==keccak256(abi.encodeWithSelector(Ledger.E_INTENT.selector,uint256(5))),"guard hash error order changed");
        intent.readSetHash=ledger.readSetHash(rs);
        (ok,err)=address(ledger).call(abi.encodeCall(ledger.executeGuardedSigned,(intent,actions,new bytes[](1),rs,new bytes(65))));
        require(!ok&&keccak256(err)==keccak256(abi.encodeWithSelector(Ledger.E_READSET_STALE.selector,uint256(1),uint256(2))),"stale coordinates changed");
        require(admissions()==0&&ledger.nonces(eoaA)==0,"guard failed after mutation");
    }
    function test_decoder_pin_and_unsupported_retained_execution_fail_closed() public {
        ledger.publish(ITEM,hex"01");IndexModule next=new IndexModule(address(ledger));
        bytes32 contextBase=keccak256(abi.encode(uint256(1),uint256(13)));
        bytes32 executionSlot=bytes32(uint256(contextBase)+1);bytes32 old=ledger.extsload(executionSlot);
        probe.store(address(ledger),executionSlot,bytes32("unknown-execution"));
        (bool ok,)=address(next).call(abi.encodeCall(next.replayNextPublication,()));require(!ok&&next.lastProcessed()==0,"unknown execution replayed");
        probe.store(address(ledger),executionSlot,old);probe.etch(address(next.replayDecoder()),hex"00");
        (ok,)=address(next).call(abi.encodeCall(next.replayNextPublication,()));require(!ok&&next.lastProcessed()==0,"decoder code pin bypass");
    }
    function test_readiness_rejects_wrong_basis_manifest_identity_and_malformed_getters() public {
        ledger.publish(ITEM,hex"01");IndexModule replacement=new IndexModule(address(ledger));
        ReplayEntry(address(replacement)).replayNextPublication();
        IIndexReadiness.Ready memory good=replacement.replayReadiness();
        bytes32 beforeExecution=ledger.executionSet();
        for(uint256 fault;fault<13;fault++){
            IIndexReadiness.Ready memory bad=abi.decode(abi.encode(good),(IIndexReadiness.Ready));
            if(fault==0)bad.sourceLedger=address(123);
            if(fault==1)bad.physicalProfile=bytes32(0);
            if(fault==2)bad.callbackProfile=bytes32(0);
            if(fault==3)bad.obligationManifest=bytes32(0);
            if(fault==4)bad.coveredManifest=bytes32(0);
            if(fault==5)bad.provenFrom=2;
            if(fault==6)bad.completedAdmission=0;
            if(fault==7)bad.completedPublication=0;
            if(fault==8)bad.generation=1;
            if(fault==9)bad.phase=0;
            bytes memory bytes_=abi.encode(bad);
            if(fault==10)bytes_=new bytes(319);
            if(fault==11)bytes_=new bytes(321);
            if(fault==12)assembly("memory-safe"){mstore(add(bytes_,32),shl(160,1))}
            address candidate=address(new BadReadiness(bytes_,good.obligationManifest));
            CutoverEntry.Request memory r=CutoverEntry.Request(candidate,address(index),1,1,good.obligationManifest,candidate.codehash,0);
            (bool ok,)=address(ledger).call(abi.encodeCall(CutoverEntry.replaceIndexWhenReady,(r)));
            require(!ok&&ledger.indexModule()==address(index)&&ledger.executionSet()==beforeExecution,"invalid readiness mutated cutover");
        }
        CutoverEntry.Request memory request=CutoverEntry.Request(address(replacement),address(index),1,1,replacement.manifestHash(),address(replacement).codehash,0);
        request.requiredManifest=0;rejectCutover(request);
        request.requiredManifest=replacement.manifestHash();request.expectedOld=address(987);rejectCutover(request);
        request.expectedOld=address(index);request.expectedReplacementCodehash=0;rejectCutover(request);
        request.expectedReplacementCodehash=address(replacement).codehash;replacement.bumpGeneration();rejectCutover(request);
        require(replacement.manifestHash()==good.obligationManifest,"generation changed obligations");
        request.expectedGeneration=1;probe.prank(address(123));
        (bool ok,)=address(ledger).call(abi.encodeCall(CutoverEntry.replaceIndexWhenReady,(request)));
        require(!ok,"non-admin cutover");
        address burner=address(new GasBurningReadiness());request.replacement=burner;request.expectedReplacementCodehash=burner.codehash;
        (ok,)=address(ledger).call{gas:300_000}(abi.encodeCall(CutoverEntry.replaceIndexWhenReady,(request)));
        require(!ok&&ledger.indexModule()==address(index)&&ledger.executionSet()==beforeExecution,"unbounded readiness getter");
    }
    function rejectCutover(CutoverEntry.Request memory r) private {
        bytes32 execution=ledger.executionSet();(bool ok,)=address(ledger).call(abi.encodeCall(CutoverEntry.replaceIndexWhenReady,(r)));
        require(!ok&&ledger.executionSet()==execution&&ledger.indexModule()==address(index),"unsafe cutover");
    }
    function test_active_lock_and_incomplete_final_publication_cannot_advance_replay() public {
        Ledger.Action[] memory a=two(aPublish(ITEM,hex"01"),aPublish(ITEM,hex"02"));
        bytes[] memory b=new bytes[](2);b[0]=hex"01";b[1]=hex"02";ledger.execute(a,b,0);
        IndexModule replacement=new IndexModule(address(ledger));
        probe.store(address(ledger),ExecutionSlots.PUBLICATION_ACTIVE,bytes32(uint256(1)));
        (bool ok,)=address(replacement).call(abi.encodeCall(ReplayEntry.replayNextPublication,()));
        require(!ok&&replacement.lastProcessed()==0&&replacement.replayReadiness().phase==2,"active replay advanced");
        probe.store(address(ledger),ExecutionSlots.PUBLICATION_ACTIVE,0);
        bytes32 ev=keccak256(abi.encode(uint256(1),uint256(6)));bytes32 original=ledger.extsload(ev);
        probe.store(address(ledger),ev,bytes32((uint256(original)&~(uint256(0xffff)<<172))|(uint256(1)<<172)));
        (ok,)=address(replacement).call(abi.encodeCall(ReplayEntry.replayNextPublication,()));
        require(!ok&&replacement.lastProcessed()==0,"truncated whole-publication boundary advanced");
        probe.store(address(ledger),ev,original);
        bytes32 row=keccak256(abi.encode(uint256(1),uint256(5)));original=ledger.extsload(row);
        probe.store(address(ledger),row,bytes32(uint256(original)|(uint256(1)<<4)));
        (ok,)=address(replacement).call(abi.encodeCall(ReplayEntry.replayNextPublication,()));
        require(!ok&&replacement.lastProcessed()==0,"middle leaf accepted");
        probe.store(address(ledger),row,original);
        replacement.replayNextPublication();require(replacement.lastProcessed()==2,"whole publication retry failed");
        probe.store(address(ledger),ExecutionSlots.PUBLICATION_ACTIVE,bytes32(uint256(1)));
        rejectCutover(CutoverEntry.Request(address(replacement),address(index),2,1,replacement.manifestHash(),address(replacement).codehash,0));
        probe.store(address(ledger),ExecutionSlots.PUBLICATION_ACTIVE,0);
    }
    function test_detached_complete_replay_ignores_mutable_policy_and_live_instance_cannot_backfill() public {
        ledger.publish(QUOTE,q(1));acceptor.set(1,0);
        IndexModule replacement=new IndexModule(address(ledger));replacement.replayNextPublication();
        require(replacement.lastProcessed()==1,"today policy rerun on history");
        (bool ok,)=address(index).call(abi.encodeCall(ReplayEntry.replayNextPublication,()));require(!ok,"active live index replayed");
        ledger.setIndexModule(address(0));ledger.publish(ITEM,hex"02");index.bumpGeneration();
        (uint8 status,,)=index.coverage(index.FAMILY_BY_TYPE(),ITEM);require(status==1,"generation healed gap");
        (ok,)=address(index).call(abi.encodeCall(ReplayEntry.replayNextPublication,()));require(!ok,"live instance skipped shadow history");
    }
    function test_checked_cutover_stale_basis_suffix_retry_and_exactly_once_live() public {
        ledger.publish(ITEM,hex"01");
        IndexModule replacement=new IndexModule(address(ledger));
        ReplayEntry(address(replacement)).replayNextPublication();
        CutoverEntry.Request memory request=CutoverEntry.Request(address(replacement),address(index),1,1,replacement.manifestHash(),address(replacement).codehash,0);
        bytes32 execution=ledger.executionSet();
        (bool ok,)=address(ledger).call(abi.encodeCall(CutoverEntry.replaceIndexWhenReady,(request)));
        require(ok&&ledger.indexModule()==address(replacement),"ready populated replacement refused");
        require(ledger.executionSet()!=execution,"physical replacement failed to invalidate old execution");
        ledger.publish(ITEM,hex"02");
        require(index.lastProcessed()==1&&replacement.lastProcessed()==2,"next write not exactly once at replacement");
        (uint64 count,,,)=replacement.postingHead(Keys.byTypeList(ITEM));require(count==2,"replay prefix lost or duplicated");
        IndexModule next=new IndexModule(address(ledger));
        ReplayEntry(address(next)).replayNextPublication();ReplayEntry(address(next)).replayNextPublication();
        request=CutoverEntry.Request(address(next),address(replacement),2,2,next.manifestHash(),address(next).codehash,0);
        ledger.publish(ITEM,hex"03");
        (ok,)=address(ledger).call(abi.encodeCall(CutoverEntry.replaceIndexWhenReady,(request)));
        require(!ok&&ledger.indexModule()==address(replacement),"concurrent source write accepted stale cutover");
        ReplayEntry(address(next)).replayNextPublication();request.expectedAdmission=3;request.expectedPublication=3;
        CutoverEntry(address(ledger)).replaceIndexWhenReady(request);
        require(ledger.indexModule()==address(next),"suffix replay retry refused");
    }
    // Catches a detached module pretending deployment admission is replay progress,
    // or using today's tombstone/withdrawn state for historical effects.
    function test_detached_genesis_replays_historical_heads_and_withdrawal() public {
        bytes32 a=ledger.publish(ITEM,hex"01");
        bytes32 b=ledger.publish(ITEM,hex"02");
        ledger.bind(HEAD,bytes32("file"),0,a,0);
        ledger.bind(HEAD,bytes32("file"),0,b,1);
        ledger.unbind(HEAD,bytes32("file"),0,2);
        ledger.bind(HEAD,bytes32("file"),0,a,3);
        ledger.execute(one(aReuse(ITEM,a)),new bytes[](1),ledger.nonces(address(this)));
        ledger.execute(one(aWithdraw(1)),new bytes[](1),ledger.nonces(address(this)));
        IndexModule replacement=new IndexModule(address(ledger));
        require(replacement.attachedFrom()==9 && replacement.lastProcessed()==0,"detached must start at genesis frontier zero");
        (uint8 status,,)=replacement.coverage(replacement.FAMILY_BY_TYPE(),ITEM);
        require(status==1,"unreplayed replacement claimed complete");
        for(uint256 i;i<8;i++)ReplayEntry(address(replacement)).replayNextPublication();
        require(ledger.indexModule()==address(index),"replay changed active module");
        compare(replacement,Keys.byTypeList(ITEM));
        compare(replacement,Keys.byAuthorList(pid(address(this))));
        compare(replacement,Keys.byRecordList(a));
        compare(replacement,Keys.uniqueByTypeList(ITEM));
        compare(replacement,Keys.backlinkList(a));compare(replacement,Keys.backlinkList(b));
        compare(replacement,Keys.historyList(Keys.binding(pid(address(this)),Keys.position(HEAD,bytes32("file"),0))));
        compare(replacement,Keys.scopeList(Keys.scope(pid(address(this)),HEAD,bytes32("file"))));
        (status,,)=replacement.coverage(replacement.FAMILY_BY_TYPE(),ITEM);
        require(status==2 && replacement.lastProcessed()==8,"replay not complete");
    }

    function compare(IndexModule other,bytes32 key) internal view {
        (uint64 n,uint64 l,uint64 last,uint16 flags)=index.postingHead(key);
        (uint64 n2,uint64 l2,uint64 last2,uint16 flags2)=other.postingHead(key);
        require(n==n2&&l==l2&&last==last2&&flags==flags2,"posting head mismatch");
        for(uint64 i;i<n;i++)require(index.postingAt(key,i)==other.postingAt(key,i),"posting sequence mismatch");
    }
}
