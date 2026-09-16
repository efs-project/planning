// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {CoreIndexFilesTest} from "./CoreIndexFiles.t.sol";
import {ProfiledFilesIndex} from "./ProfiledFilesIndex.sol";
import {FilesDirectoryIndex} from "./FilesDirectoryProfile.sol";
import {FilesPageReader} from "./FilesPageReader.sol";
import {FilesLiveLens} from "./FilesLiveIndex.sol";
import {Ledger} from "../src/Ledger.sol";
import {IIndexReadiness} from "../src/Interfaces.sol";
import {Keys} from "../src/Keys.sol";
interface ScopeCodeVm { function etch(address,bytes calldata) external; }

contract CoreIndexReplayFilesTest is CoreIndexFilesTest {
    function replacement() private returns(ProfiledFilesIndex){
        bytes32[8] memory legacy=[rt,ct,live.expectedRootRuleHash(),live.expectedChildRuleHash(),nt,live.expectedNameRuleHash(),dt,FilesDirectoryIndex(address(live)).expectedDirectoryRuleHash()];
        return new ProfiledFilesIndex(address(ledger),legacy,ts,hs);
    }
    function test_replayed_late_files_index_qualifies_actual_page_reader() public {
        bytes32 folder=_directory(911);bytes32 file=ledger.create(bytes32(uint256(912)));
        Ledger.Action[] memory actions=two(aBind(FOLDER,folder,name("after"),file,0),aPublish(nt,bytes("after")));
        bytes[] memory bodies=new bytes[](2);bodies[1]=bytes("after");ledger.execute(actions,bodies,ledger.nonces(address(this)));
        ProfiledFilesIndex next=replacement();(uint64 a,,,uint64 p)=ledger.counts();
        for(uint64 i;i<p;i++)next.replayNextPublication();
        require(next.attachedFrom()==a+1&&next.provenFrom()==1,"deployment and proven origin conflated");
        bytes32 oldExecution=ledger.executionSet();
        FilesPageReader oldReader=new FilesPageReader(ledger,new FilesLiveLens(ledger,next),next);
        ledger.replaceIndexWhenReady(IIndexReadiness.ReplacementRequest(address(next),address(index),a,p,next.manifestHash(),address(next).codehash,0));
        FilesPageReader reader=new FilesPageReader(ledger,new FilesLiveLens(ledger,next),next);
        bytes32[] memory principals=new bytes32[](1);principals[0]=pid(address(this));FilesPageReader.Query memory q;
        FilesPageReader.Page memory page=reader.readPage(folder,principals,q,FilesPageReader.Basis(a,0,registry.epoch(),ledger.executionSet()),"",8);
        require(page.completeFromOrigin&&page.rows.length==1&&page.rows[0].placement.target==file,"replayed replacement page denied");
        require(keccak256(page.rows[0].name.value)==keccak256("after"),"Name after BIND not terminal-qualified");
        (bool ok,)=address(oldReader).staticcall(abi.encodeCall(oldReader.readPage,(folder,principals,q,FilesPageReader.Basis(a,0,registry.epoch(),oldExecution),page.continuation,8)));
        require(!ok,"old execution basis or continuation survived cutover");
    }
    function test_later_name_cannot_repair_earlier_invalid_publication_during_replay() public {
        bytes32 folder=_directory(921);bytes32 file=ledger.create(bytes32(uint256(922)));
        ledger.setIndexModule(address(0));
        ledger.bind(FOLDER,folder,name("too-late"),file,0);
        ledger.publish(nt,bytes("too-late"));
        ProfiledFilesIndex next=replacement();
        next.replayNextPublication();next.replayNextPublication();next.replayNextPublication();
        uint64 before=next.lastProcessed();
        (bool ok,)=address(next).call(abi.encodeCall(next.replayNextPublication,()));
        require(!ok&&next.lastProcessed()==before&&next.lastPublication()==3,"later Name repaired invalid historical bind");
        bytes32 scope=Keys.scopeList(Keys.scope(pid(address(this)),FOLDER,folder));
        require(next.liveCount(scope)==0&&next.lastMutation(scope)==0,"failed Name final check leaked companion writes");
        (uint8 status,,)=next.coverage(next.FAMILY_LIVE_SCOPE(),0);require(status==1,"failed final publication qualified");
    }
    function test_replayed_scope_stamps_dense_order_two_authors_two_folders() public {
        bytes32 folder=_directory(931);bytes32 other=_directory(932);bytes32 file=ledger.create(bytes32(uint256(933)));
        ledger.publish(nt,bytes("a"));ledger.publish(nt,bytes("b"));
        ledger.bind(FOLDER,folder,name("a"),file,0);ledger.bind(FOLDER,folder,name("b"),file,0);
        alice.bind(FOLDER,folder,name("a"),file,0);uint64 aliceStamp=admissions();
        ledger.bind(FOLDER,other,name("a"),file,0);uint64 otherStamp=admissions();
        ledger.bind(FOLDER,folder,name("a"),file,1);ledger.unbind(FOLDER,folder,name("a"),2);
        ledger.unbind(FOLDER,folder,name("b"),1);ledger.bind(FOLDER,folder,name("a"),file,3);uint64 stamp=admissions();
        ProfiledFilesIndex next=replacement();(,,,uint64 publications)=ledger.counts();
        for(uint64 i;i<publications;i++)next.replayNextPublication();
        bytes32[3] memory scopes=[Keys.scopeList(Keys.scope(pid(address(this)),FOLDER,folder)),
            Keys.scopeList(Keys.scope(pid(address(alice)),FOLDER,folder)),Keys.scopeList(Keys.scope(pid(address(this)),FOLDER,other))];
        uint64[3] memory stamps=[stamp,aliceStamp,otherStamp];
        for(uint256 i;i<3;i++){
            require(live.lastMutation(scopes[i])==stamps[i]&&next.lastMutation(scopes[i])==stamps[i],"live/replay last mutation mismatch");
            require(live.liveCount(scopes[i])==1&&next.liveCount(scopes[i])==1&&live.liveAt(scopes[i],0)==next.liveAt(scopes[i],0),"live/replay dense inventory mismatch");
        }
        require(address(next.scopeState())!=address(live.scopeState())&&next.manifestHash()==live.manifestHash(),"deployment identity polluted semantic recipe");
        require(next.PHYSICAL_PROFILE()==next.replayReadiness().physicalProfile,"public physical profile disagrees with readiness");
    }
    function test_scope_code_pin_rejects_replacement_and_live_write() public {
        ProfiledFilesIndex next=replacement();
        ScopeCodeVm probe=ScopeCodeVm(address(uint160(uint256(keccak256("hevm cheat code")))));
        probe.etch(address(next.scopeState()),hex"00");
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.replaceIndexWhenReady,(IIndexReadiness.ReplacementRequest(address(next),address(index),0,0,next.manifestHash(),address(next).codehash,0))));
        require(!ok&&ledger.indexModule()==address(index),"replacement ignored companion code pin");
        bytes32 folder=_directory(951);bytes32 file=ledger.create(bytes32(uint256(952)));ledger.publish(nt,bytes("a"));
        uint64 before=admissions();probe.etch(address(live.scopeState()),hex"00");
        (ok,)=address(ledger).call(abi.encodeCall(ledger.bind,(FOLDER,folder,name("a"),file,uint32(0))));
        require(!ok&&admissions()==before,"live fold ignored companion code pin");
    }
}
