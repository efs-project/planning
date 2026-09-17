// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {Actor} from "../src/LabHarness.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {LensReader} from "../src/LensReader.sol";
import {IIndexModule} from "../src/Interfaces.sol";
import {FilesRetainedLens} from "./FilesRetainedLens.sol";

interface ReleaseHistory {
    function historyStatePrincipalAt(bytes32,bytes32,uint64,bytes32) external view returns(uint8,uint8,bytes32,uint32,uint64);
}
contract RefuseReleaseIndex is IndexModule {
    constructor(address core) IndexModule(core) {}
    function _foldEffect(IIndexModule.Effect memory e) internal override {
        super._foldEffect(e);
        require(e.kind!=7,"release refused");
    }
}

contract BindingReleaseTest is LabBase {
    function testMatchedRuntimeFitsAndReleaseSnapshotRemainsGuarded() public {
        require(address(ledger).code.length<=24576&&address(index).code.length<=24576&&address(lens).code.length<=24576,"EIP170 runtime cap");
        pair();(,uint64 at)=release(bob,1);
        bytes32 position=Keys.position(FOLDER,DRAFTS,name("shared"));
        bytes32 snapshot=keccak256(abi.encode(ledger.HEAD_SNAPSHOT_V2(),uint8(3),uint32(2),at,bytes32(0)));
        require(ledger.headSnapshot(pid(address(bob)),position)==snapshot,"release snapshot changed hash format");
        Ledger.ReadSetV2 memory reads;
        reads.principalIds=new bytes32[](1);reads.principalIds[0]=pid(address(bob));
        reads.positions=new bytes32[](1);reads.positions[0]=position;
        reads.expectedHeads=new bytes32[](1);reads.expectedHeads[0]=snapshot;
        ledger.executeGuarded(one(aCreate("guarded")),new bytes[](1),ledger.nonces(address(this)),ledger.executionSet(),reads);
        bob.bind(FOLDER,DRAFTS,name("shared"),ledger.create("next"),2);
        (bool ok,bytes memory err)=address(ledger).call(abi.encodeCall(ledger.executeGuarded,
            (one(aCreate("stale")),new bytes[](1),ledger.nonces(address(this)),ledger.executionSet(),reads)));
        require(!ok&&bytes4(err)==Ledger.E_READSET_STALE.selector,"rebind bypassed release snapshot guard");
    }
    function release(Actor actor,uint32 revision) internal returns(uint64 publication,uint64 at) {
        Ledger.Action memory action=aUnbind(FOLDER,DRAFTS,name("shared"),revision);
        action.kind=7;
        return actor.execute(one(action),new bytes[](1));
    }
    // Catches treating release as mask, and decrementing mask backlinks twice.
    function testReleaseFallsThroughAndMaskToReleaseDoesNotUnderflow() public {
        bytes32 a=alice.create("a");bytes32 b=bob.create("b");
        alice.bind(FOLDER,DRAFTS,name("shared"),a,0);
        bob.bind(FOLDER,DRAFTS,name("shared"),b,0);
        (uint8 status,bytes32 target,,,)=lens.resolve(lensOf(address(bob),address(alice)),FOLDER,DRAFTS,name("shared"));
        require(status==1&&target==b,"bob wins");
        release(bob,1);
        (status,target,,,)=lens.resolve(lensOf(address(bob),address(alice)),FOLDER,DRAFTS,name("shared"));
        require(status==1&&target==a,"released bob must yield to alice");
        bob.bind(FOLDER,DRAFTS,name("shared"),b,2);
        bob.unbind(FOLDER,DRAFTS,name("shared"),3);
        (status,target,,,)=lens.resolve(lensOf(address(bob),address(alice)),FOLDER,DRAFTS,name("shared"));
        require(status==2&&target==0,"mask still blocks");
        release(bob,4);
        (status,target,,,)=lens.resolve(lensOf(address(bob),address(alice)),FOLDER,DRAFTS,name("shared"));
        require(status==1&&target==a,"released mask must yield");
        (,uint64 live,,)=index.postingHead(Keys.backlinkList(b));
        require(live==0,"no backlink underflow");
    }
    function principals() internal view returns(bytes32[] memory ids) {
        ids=new bytes32[](2);ids[0]=pid(address(bob));ids[1]=pid(address(alice));
    }
    function pair() internal returns(bytes32 a,bytes32 b) {
        a=alice.create("a");b=bob.create("b");
        alice.bind(FOLDER,DRAFTS,name("shared"),a,0);bob.bind(FOLDER,DRAFTS,name("shared"),b,0);
    }
    // Catches replay accepting only live->release or losing released historical state.
    function testHistoryReplayListsAndRebindKeepOrdinal() public {
        (bytes32 a,bytes32 b)=pair();bytes32 pos=Keys.position(FOLDER,DRAFTS,name("shared"));
        bytes32 key=Keys.binding(pid(address(bob)),pos);
        (,,,,uint64 ordinal,)=ledger.head(key);
        (,uint64 releasedAt)=release(bob,1);
        FilesRetainedLens retained=new FilesRetainedLens(ledger,index);
        LensReader.PrincipalCursor memory fresh;
        LensReader.PrincipalPage memory page=retained.listPrincipals(principals(),FOLDER,DRAFTS,fresh,1);
        require(page.items.length==0&&page.status==1,"released inventory retained");
        bob.bind(FOLDER,DRAFTS,name("shared"),b,2);
        page=retained.listPrincipals(principals(),FOLDER,DRAFTS,page.next,10);
        require(page.items.length==1&&page.items[0].target==a,"retained reducer fell back to mask");
        (uint8 status,bytes32 target,,,)=lens.resolvePrincipalsAt(principals(),FOLDER,DRAFTS,name("shared"),releasedAt,ledger.executionSet());
        require(status==1&&target==a,"historical release yields even after rebind");
        (uint8 coverage,uint8 state,bytes32 value,uint32 revision,uint64 at)=ReleaseHistory(address(lens)).historyStatePrincipalAt(pid(address(bob)),pos,releasedAt,ledger.executionSet());
        require(coverage==2&&state==3&&value==0&&revision==2&&at==releasedAt,"lossless release history");
        (,,,,uint64 afterOrdinal,)=ledger.head(key);require(ordinal==afterOrdinal,"rebind allocated new ordinal");
        bob.unbind(FOLDER,DRAFTS,name("shared"),3);release(bob,4);
        IndexModule replay=new IndexModule(address(ledger));
        (,,,uint64 publications)=ledger.counts();for(uint64 i;i<publications;i++)replay.replayNextPublication();
        bytes32[] memory keys=new bytes32[](4);
        keys[0]=Keys.historyList(key);keys[1]=Keys.scopeList(Keys.scope(pid(address(bob)),FOLDER,DRAFTS));
        keys[2]=Keys.backlinkList(a);keys[3]=Keys.backlinkList(b);
        for(uint256 i;i<keys.length;i++){
            (uint64 n,uint64 live,uint64 last,uint16 flags)=index.postingHead(keys[i]);
            (uint64 rn,uint64 rl,uint64 rt,uint16 rf)=replay.postingHead(keys[i]);
            require(n==rn&&live==rl&&last==rt&&flags==rf,"replay header mismatch");
            for(uint64 j;j<n;j++)require(index.postingAt(keys[i],j)==replay.postingAt(keys[i],j),"replay item mismatch");
        }
        (status,)=lens.resolveNoTiebreakPrincipals(principals(),FOLDER,DRAFTS,name("shared"),ledger.executionSet());
        require(status==1,"released author is not conflict");
        LensReader.PrincipalPage memory current=lens.listPrincipals(principals(),FOLDER,DRAFTS,fresh,32);
        require(current.items.length==1&&current.items[0].target==a,"current list must yield");
    }
    // Catches changing another author's binding, stale CAS, and repeat admission leaks.
    function testAuthorityCasRepeatAndExactRetry() public {
        bytes32 a=alice.create("a");alice.bind(FOLDER,DRAFTS,name("shared"),a,0);
        Ledger.Action memory action=aUnbind(FOLDER,DRAFTS,name("shared"),0);action.kind=7;
        (bool ok,)=address(bob).call(abi.encodeCall(bob.execute,(one(action),new bytes[](1))));require(!ok,"unset author released alice");
        (ok,)=address(alice).call(abi.encodeCall(alice.execute,(one(action),new bytes[](1))));require(!ok,"stale release accepted");
        action.expectedRevision=1;uint64 nonce=ledger.nonces(address(alice));
        alice.execute(one(action),new bytes[](1));uint64 before=admissions();
        bytes memory err;(ok,err)=address(alice).call(abi.encodeCall(alice.executeWithNonce,(one(action),new bytes[](1),nonce)));
        require(!ok&&sel(err)==Ledger.AlreadyAdmitted.selector,"exact retry identity changed");
        action.expectedRevision=2;(ok,)=address(alice).call(abi.encodeCall(alice.execute,(one(action),new bytes[](1))));
        require(!ok&&admissions()==before,"released twice");
    }
    // Required callback refusal must undo retained state, history, nonce and backlink.
    function testRequiredIndexFailureRollsBackRelease() public {
        RefuseReleaseIndex refused=new RefuseReleaseIndex(address(ledger));ledger.setIndexModule(address(refused));index=refused;
        pair();uint64 before=admissions();uint64 nonce=ledger.nonces(address(bob));
        Ledger.Action memory action=aUnbind(FOLDER,DRAFTS,name("shared"),1);action.kind=7;
        (bool ok,bytes memory err)=address(bob).call(abi.encodeCall(bob.execute,(one(action),new bytes[](1))));
        require(!ok&&sel(err)==Ledger.E_INDEX.selector,"required index bypassed");
        (uint8 state,uint32 revision,bytes32 target)=headOf(address(bob),FOLDER,DRAFTS,name("shared"));
        (,uint64 live,,)=index.postingHead(Keys.backlinkList(target));
        require(state==1&&revision==1&&live==1&&admissions()==before&&ledger.nonces(address(bob))==nonce&&index.lastProcessed()==before,"partial release commit");
    }
    function testSignedReleaseReconstructsExactAction() public {
        Ledger.Action[] memory actions=two(aCreate("signed"),aBind(FOLDER,DRAFTS,name("shared"),Keys.subject(pid(eoaA),"signed"),0));
        (Ledger.Intent memory intent,bytes memory sig)=signed(PK_A,ledger,0,actions);
        ledger.executeSigned(intent,actions,new bytes[](2),sig);
        Ledger.Action memory action=aUnbind(FOLDER,DRAFTS,name("shared"),1);action.kind=7;actions=one(action);
        (intent,sig)=signed(PK_A,ledger,1,actions);
        (uint64 publication,)=ledger.executeSigned(intent,actions,new bytes[](1),sig);
        (,bytes32 actual,,address author,bool verified)=recon.reconstruct(ledger,publication);
        require(actual==keccak256(abi.encode(actions))&&author==eoaA&&verified,"signed release reconstruction");
    }
}
