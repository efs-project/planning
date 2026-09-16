// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {FilesPageReaderTest,PageVm} from "./FilesPageReader.t.sol";
import {FilesPageReader} from "./FilesPageReader.sol";
import {FilesQueryAccumulator} from "./FilesQueryAccumulator.sol";
import {LensReader} from "../src/LensReader.sol";
import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";

contract FilesQueryOriginTest is FilesPageReaderTest {
    PageVm private constant queryProbe=PageVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function test_query_owned_prefix_progress_and_reject_foreign_restart_suffix() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1001);file(folder,"a",1002);file(folder,"b",1003);
        FilesPageReader.Query memory q;
        FilesQueryAccumulator acc=new FilesQueryAccumulator(r,folder,selectors(),q,basis(),bytes32("session"));
        acc.step(bytes32("session"),1);
        require(!acc.complete()&&acc.scanned()==1&&acc.rawTotal()==2&&acc.rowCount()==1,"owned first prefix wrong");
        bytes32 prior=acc.resultCommitment();
        (bool ok,)=address(acc).call(abi.encodeCall(acc.step,(bytes32("foreign"),1)));require(!ok,"foreign session accepted");
        queryProbe.prank(address(123));(ok,)=address(acc).call(abi.encodeCall(acc.step,(bytes32("session"),1)));require(!ok,"foreign owner accepted");
        (ok,)=address(acc).call(bytes.concat(abi.encodeCall(acc.step,(bytes32("session"),1)),abi.encode(uint256(999))));require(!ok,"forged appended suffix accepted");
        ledger.publish(BINARY,bytes("unrelated"));
        acc.step(bytes32("session"),1);
        require(acc.complete()&&acc.scanned()==2&&acc.rowCount()==2&&acc.resultCommitment()!=prior,"owned prefix did not exhaust");
        require(!acc.originAbsent(),"positive origin became absent");
        (ok,)=address(acc).call(abi.encodeCall(acc.step,(bytes32("session"),1)));require(!ok,"completed session restarted");
    }
    function test_query_historical_heads_masks_first_head_tags_and_conflict() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1101);
        (bytes32 a,)=file(folder,"a",1102);(bytes32 b,bytes32 br)=file(folder,"b",1103);
        alice.bind(HEAD,b,0,br,0);ledger.unbind(HEAD,b,0,1); // higher-priority mask at A
        bytes32 c=ledger.create(bytes32(uint256(1104)));ledger.publish(nt,bytes("c"));ledger.bind(FOLDER,folder,name("c"),c,0);
        (bytes32 d,bytes32 dr)=file(folder,"d",1105);
        bytes32 other=ledger.publish(rt,bytes.concat(abi.encode(d),bytes("other")));alice.bind(HEAD,d,0,other,0);
        bytes32 concept=bytes32("tag");FilesPageReader.Query memory q=FilesPageReader.Query(concept,0,false,"");
        FilesPageReader.Basis memory origin=basis();
        FilesPageReader.Page memory first=r.readPage(folder,selectors(),q,origin,"",1);
        q.diagnosticHead=true;FilesPageReader.Page memory diag=r.readPage(folder,selectors(),q,origin,"",1);q.diagnosticHead=false;
        bytes32 anew=ledger.publish(rt,bytes.concat(abi.encode(a),bytes("later-a")));ledger.bind(HEAD,a,0,anew,1);ledger.bind(TAG,a,concept,a,0);
        ledger.bind(HEAD,b,0,br,2);ledger.bind(HEAD,c,0,ledger.publish(rt,bytes.concat(abi.encode(c),bytes("first-c"))),0);
        bytes32 dnew=ledger.publish(rt,bytes.concat(abi.encode(d),bytes("later-d")));ledger.bind(HEAD,d,0,dnew,1);ledger.bind(TAG,dnew,concept,d,0);
        FilesPageReader.Page memory rest=r.readPage(folder,selectors(),q,origin,first.continuation,8);
        require(rest.observedCurrent==admissions()&&rest.observedCurrent>origin.admission&&rest.rows.length==3,"origin/current or row count");
        require(rest.rows[0].placement.target==b&&rest.rows[0].head.status==2,"historical tombstone fell through");
        require(rest.rows[1].placement.target==c&&rest.rows[1].head.status==0,"first post-origin head selected");
        require(rest.rows[2].placement.target==d&&rest.rows[2].head.target==dr&&rest.rows[2].revisionTag.subject==dr
            &&rest.rows[2].revisionTag.qualification==1&&!rest.rows[2].revisionTag.present,"revision tag joined current head");
        q.diagnosticHead=true;rest=r.readPage(folder,selectors(),q,origin,diag.continuation,8);
        require(rest.rows[2].head.status==3,"diagnostic historical conflict lost");
        (bool ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,selectors(),q,origin,bytes(""),8)));
        require(!ok,"old origin accepted empty nested start");
    }
    function test_query_missing_history_keeps_unknown_and_never_falls_through() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1201);file(folder,"a",1202);(bytes32 b,bytes32 br)=file(folder,"b",1203);
        alice.bind(HEAD,b,0,br,0);
        FilesPageReader.Query memory q=FilesPageReader.Query(bytes32("missing"),1,false,"no-match");FilesPageReader.Basis memory origin=basis();
        FilesPageReader.Page memory first=r.readPage(folder,selectors(),q,origin,"",1);
        ledger.bind(HEAD,b,0,ledger.publish(rt,bytes.concat(abi.encode(b),bytes("new"))),1);
        bytes32 historyKey=Keys.historyList(Keys.binding(pid(address(this)),Keys.position(HEAD,b,0)));
        queryProbe.mockCallRevert(address(index),abi.encodeCall(index.coverage,(index.FAMILY_HISTORY(),historyKey)),hex"01");
        FilesPageReader.Page memory rest=r.readPage(folder,selectors(),q,origin,first.continuation,1);
        require(rest.rows.length==1&&rest.rows[0].head.status==4&&rest.rows[0].matchStatus==0,"unknown history became filtered absence or lower head");
        queryProbe.clearMockedCalls();
        queryProbe.mockCallRevert(address(index),abi.encodeCall(index.coverage,(index.FAMILY_HISTORY(),bytes32(0))),hex"01");
        rest=r.readPage(folder,selectors(),q,origin,first.continuation,1);
        require(rest.rows.length==1&&rest.rows[0].stableTag.qualification==0&&rest.rows[0].matchStatus==0,"global history unknown became point ABSENT");
    }
    function test_query_post_origin_withdrawal_preserves_retained_headers() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1301);file(folder,"a",1302);(,bytes32 br)=file(folder,"b",1303);
        FilesPageReader.Query memory q;FilesPageReader.Basis memory origin=basis();FilesPageReader.Page memory first=r.readPage(folder,selectors(),q,origin,"",1);
        (,uint64 at,,)=ledger.record(br);ledger.execute(one(aWithdraw(at)),new bytes[](1),ledger.nonces(address(this)));
        (,at,,)=ledger.record(Keys.recordFromHash(nt,name("b")));ledger.execute(one(aWithdraw(at)),new bytes[](1),ledger.nonces(address(this)));
        (,at,,)=ledger.record(folder);ledger.execute(one(aWithdraw(at)),new bytes[](1),ledger.nonces(address(this)));
        FilesPageReader.Page memory rest=r.readPage(folder,selectors(),q,origin,first.continuation,1);
        require(rest.rows.length==1&&rest.rows[0].name.qualification==1&&rest.rows[0].header.qualification==1,"withdrawal erased retained origin data");
    }
    function test_query_selected_overwrite_mask_swap_restore_refuse() public {
        for(uint256 mutation;mutation<4;mutation++){
            FilesPageReader r=reader();bytes32 folder=_directory(1401+mutation*10);(bytes32 a,)=file(folder,"a",1402+mutation*10);file(folder,"b",1403+mutation*10);
            FilesPageReader.Query memory q;FilesPageReader.Basis memory origin=basis();FilesPageReader.Page memory first=r.readPage(folder,selectors(),q,origin,"",1);
            if(mutation==0)ledger.bind(FOLDER,folder,name("a"),a,1);
            else if(mutation==1)ledger.unbind(FOLDER,folder,name("b"),1);
            else {ledger.unbind(FOLDER,folder,name("a"),1);if(mutation==3)ledger.bind(FOLDER,folder,name("a"),a,2);}
            (bool ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,selectors(),q,origin,first.continuation,1)));
            require(!ok,"selected mutation resumed stale inventory");
        }
    }
    function test_query_empty_consumed_terminal_scopes_guarded_other_folder_allowed() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1501);bytes32 other=_directory(1502);
        (bytes32 a,)=file(folder,"a",1503);ledger.publish(nt,bytes("b"));alice.bind(FOLDER,folder,name("b"),a,0);
        FilesPageReader.Query memory q;FilesPageReader.Basis memory origin=basis();FilesPageReader.Page memory first=r.readPage(folder,selectors(),q,origin,"",1);
        ledger.bind(FOLDER,other,name("a"),a,0);
        FilesPageReader.Page memory rest=r.readPage(folder,selectors(),q,origin,first.continuation,1);require(rest.scanStatus==2&&rest.rows.length==1,"different folder invalidated");
        ledger.bind(FOLDER,folder,name("a"),a,1);
        (bool ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,selectors(),q,origin,first.continuation,1)));require(!ok,"already-consumed scope unchecked");
        bytes32[] memory principals=new bytes32[](3);principals[0]=pid(address(bob));principals[1]=pid(address(this));principals[2]=pid(address(alice));
        LensReader.PrincipalCursor memory empty;
        LensReader.PrincipalPage memory terminal=r.lens().listPrincipals(principals,FOLDER,folder,empty,8);
        require(terminal.status==2,"terminal fixture");
        bob.bind(FOLDER,folder,name("a"),a,0);
        (ok,)=address(r.lens()).staticcall(abi.encodeCall(r.lens().listPrincipals,(principals,FOLDER,folder,terminal.next,1)));
        require(!ok,"empty higher or terminal scope unchecked");
    }
    function test_query_nested_origin_generation_epoch_execution_and_gap_refuse() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1601);file(folder,"a",1602);file(folder,"b",1603);
        FilesPageReader.Query memory q;FilesPageReader.Basis memory origin=basis();FilesPageReader.Page memory first=r.readPage(folder,selectors(),q,origin,"",1);
        ledger.publish(BINARY,bytes("advance"));
        (bytes32 hash,LensReader.PrincipalCursor memory nested)=abi.decode(first.continuation,(bytes32,LensReader.PrincipalCursor));nested.basisAdmission=admissions();
        (bool ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,selectors(),q,origin,abi.encode(hash,nested),1)));require(!ok,"nested origin rebased");
        index.bumpGeneration();(ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,selectors(),q,origin,first.continuation,1)));require(!ok,"generation changed");
        origin=basis();first=r.readPage(folder,selectors(),q,origin,"",1);registry.register(bytes32("new type"),address(0),new bytes32[](0));
        (ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,selectors(),q,origin,first.continuation,1)));require(!ok,"epoch changed");
        origin=basis();first=r.readPage(folder,selectors(),q,origin,"",1);ledger.setIndexModule(address(index));
        (ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,selectors(),q,origin,first.continuation,1)));require(!ok,"execution changed");
        ledger.setIndexModule(address(0));ledger.publish(BINARY,bytes("detached"));ledger.setIndexModule(address(index));
        FilesPageReader.Page memory unavailable=r.readPage(folder,selectors(),q,basis(),"",8);
        require(unavailable.scanStatus==0&&!unavailable.completeFromOrigin,"coverage gap licensed absence");
    }
    function test_query_owned_negative_is_historical_not_current_authority() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1701);(bytes32 a,)=file(folder,"a",1702);
        FilesPageReader.Query memory q;q.search="missing";
        FilesQueryAccumulator acc=new FilesQueryAccumulator(r,folder,selectors(),q,basis(),bytes32("negative"));
        bytes32[] memory positions=new bytes32[](1);positions[0]=Keys.position(FOLDER,folder,name("missing"));
        bytes32[] memory principals=selectors();bytes32[] memory expected=new bytes32[](2);
        for(uint256 i;i<2;i++)expected[i]=ledger.headSnapshot(principals[i],positions[0]);
        Ledger.ReadSetV2 memory rs=Ledger.ReadSetV2(principals,positions,expected);
        acc.step(bytes32("negative"),1);require(acc.originAbsent(),"qualified zero did not complete");
        ledger.publish(nt,bytes("missing"));ledger.bind(FOLDER,folder,name("missing"),a,0);
        require(acc.originAbsent(),"stored historical fact changed meaning");
        uint64 before=admissions();
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.executeGuarded,(one(aCreate(bytes32("unauthorized"))),new bytes[](1),ledger.nonces(address(this)),ledger.executionSet(),rs)));
        require(!ok&&admissions()==before,"historical complete bypassed current dependency validation");
    }
    function test_query_owned_unknown_and_old_empty_start_refuse_absence() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1801);file(folder,"a",1802);
        FilesPageReader.Query memory q;q.search="missing";
        FilesPageReader.Basis memory origin=basis();
        FilesQueryAccumulator old=new FilesQueryAccumulator(r,folder,selectors(),q,origin,bytes32("old"));
        ledger.publish(BINARY,bytes("advance"));
        (bool ok,)=address(old).call(abi.encodeCall(old.step,(bytes32("old"),1)));require(!ok&&!old.complete(),"old-A empty session started");
        FilesQueryAccumulator unknown=new FilesQueryAccumulator(r,folder,selectors(),q,basis(),bytes32("unknown"));
        queryProbe.mockCallRevert(address(index),abi.encodeCall(index.coverage,(index.FAMILY_HISTORY(),bytes32(0))),hex"01");
        unknown.step(bytes32("unknown"),1);
        require(unknown.complete()&&unknown.rowCount()==1&&unknown.unknownCount()==1&&!unknown.originAbsent(),"unknown row hidden by zero result");
    }
}
