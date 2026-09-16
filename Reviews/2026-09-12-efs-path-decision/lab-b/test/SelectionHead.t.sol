// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {FilesPageReaderTest,PageVm} from "./FilesPageReader.t.sol";
import {FilesPageReader} from "./FilesPageReader.sol";
import {FilesCarrierIndex} from "./FilesCarrierProfile.sol";
import {RawHeadFilesLiveLens} from "./SelectionHeadControl.sol";

interface SelectionStorageVm {function store(address,bytes32,bytes32) external;}

contract SelectionHeadTest is LabBase {
    SelectionStorageVm private constant storageVm=SelectionStorageVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function projection(bytes32 key) internal view returns(uint8,uint32,uint64,bytes32) {
        (bool ok,bytes memory out)=address(ledger).staticcall(abi.encodeWithSignature("selectionHead(bytes32)",key));
        require(ok,"selectionHead ABI unavailable");
        return abi.decode(out,(uint8,uint32,uint64,bytes32));
    }
    function check(bytes32 key,uint8 wantState,uint32 wantRevision,uint64 wantAdmission,bytes32 wantTarget) internal view {
        (uint8 state,uint32 revision,uint64 at,bytes32 target)=projection(key);
        require(state==wantState&&revision==wantRevision&&at==wantAdmission&&target==wantTarget,"selection projection mismatch");
    }
    // Catches missing getter, truncation before extraction, and normalized raw APIs.
    function test_selection_absent_live_mask_and_raw_guard_parity() public {
        bytes32 subject=ledger.create(bytes32("selection"));bytes32 pos=Keys.position(HEAD,subject,0);bytes32 principal=pid(address(this));bytes32 key=Keys.binding(principal,pos);
        check(key,0,0,0,0);
        bytes32 target=ledger.publish(BINARY,hex"010203");ledger.bind(HEAD,subject,0,target,0);uint64 liveAt=admissions();
        check(key,1,1,liveAt,target);
        ledger.unbind(HEAD,subject,0,1);check(key,2,2,admissions(),0);
        (uint8 state,uint32 rev,uint64 at,uint64 previous,uint64 ordinal,bytes32 raw)=ledger.head(key);
        require(state==2&&rev==2&&at==admissions()&&previous==liveAt&&ordinal==1&&raw==0,"raw tombstone changed");
        require(ledger.headSnapshot(principal,pos)==keccak256(abi.encode(ledger.HEAD_SNAPSHOT_V2(),state,rev,at,raw)),"guard/raw incongruent");
    }
    function test_selection_malformed_raw_target_retained_and_wide_metadata() public {
        bytes32 principal=bytes32("principal");bytes32 pos=bytes32("position");bytes32 key=Keys.binding(principal,pos);
        bytes32 slot=keccak256(abi.encode(key,uint256(8)));bytes32 rawTarget=bytes32("diagnostic target");
        uint32 rev=0xfedcba98;uint64 at=0xfedcba987654;uint64 previous=0xabcdef987654;uint64 ordinal=0xedcba9876543;
        for(uint8 state;state<4;state++){
            uint256 meta=uint256(state)|(uint256(rev)<<8)|(uint256(at)<<40)|(uint256(previous)<<120)|(uint256(ordinal)<<168);
            storageVm.store(address(ledger),slot,bytes32(meta));storageVm.store(address(ledger),bytes32(uint256(slot)+1),rawTarget);
            check(key,state,rev,at,state==1?rawTarget:bytes32(0));
            (uint8 s,uint32 r,uint64 a,uint64 p,uint64 b,bytes32 target)=ledger.head(key);
            require(s==state&&r==rev&&a==at&&p==previous&&b==ordinal&&target==rawTarget,"raw diagnostics normalized");
            require(ledger.headSnapshot(principal,pos)==keccak256(abi.encode(ledger.HEAD_SNAPSHOT_V2(),state,rev,at,rawTarget)),"raw snapshot changed");
            (bool ok,bytes memory forwarded)=address(lens).staticcall(abi.encodeWithSignature("head(bytes32)",key));
            require(ok&&keccak256(forwarded)==keccak256(abi.encode(s,r,a,p,b,target)),"Lens raw forwarding normalized");
        }
    }
    function test_selection_newer_tombstone_retains_history_at_origin() public {
        bytes32 subject=ledger.create(bytes32("history"));bytes32 target=ledger.publish(BINARY,hex"99");
        ledger.bind(HEAD,subject,0,target,0);uint64 origin=admissions();
        ledger.unbind(HEAD,subject,0,1);
        bytes32 principal=pid(address(this));bytes32 key=Keys.binding(principal,Keys.position(HEAD,subject,0));
        check(key,2,2,admissions(),0);
        bytes32[] memory principals=new bytes32[](1);principals[0]=principal;
        (uint8 status,bytes32 value,uint32 rev,bytes32 author,uint64 at)=lens.resolvePrincipalsAt(principals,HEAD,subject,0,origin,ledger.executionSet());
        require(status==1&&value==target&&rev==1&&author==principal&&at==origin,"new tombstone skipped origin history");
    }
}

contract SelectionHeadFilesTest is FilesPageReaderTest {
    PageVm private constant probeSelection=PageVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function rawReader() internal returns(FilesPageReader) {
        return new FilesPageReader(ledger,new RawHeadFilesLiveLens(ledger,index),FilesCarrierIndex(address(index)));
    }
    function samePage(FilesPageReader.Page memory a,FilesPageReader.Page memory b) internal pure {
        // Only the caller/reader-bound continuation domain differs by address.
        if(a.continuation.length!=0){
            (,LensReader.PrincipalCursor memory ac)=abi.decode(a.continuation,(bytes32,LensReader.PrincipalCursor));
            (,LensReader.PrincipalCursor memory bc)=abi.decode(b.continuation,(bytes32,LensReader.PrincipalCursor));
            require(keccak256(abi.encode(ac))==keccak256(abi.encode(bc)),"selection cursor parity");
        }else require(b.continuation.length==0,"selection terminal parity");
        a.continuation="";b.continuation="";
        require(keccak256(abi.encode(a))==keccak256(abi.encode(b)),"full qualified page parity");
    }
    function sameCall(LensReader fast,LensReader raw,bytes memory input) internal view {
        (bool a,bytes memory av)=address(fast).staticcall(input);(bool b,bytes memory bv)=address(raw).staticcall(input);
        require(a==b&&keccak256(av)==keccak256(bv),"exact point or refusal parity");
    }
    // Breaks if absent/masked/conflict states, post-A history, retained headers,
    // independent UNKNOWN axes or selected-scope guards diverge from raw reads.
    function test_selection_full_rows_history_withdrawal_unknown_scope_parity() public {
        FilesPageReader fast=reader();FilesPageReader raw=rawReader();bytes32 folder=_directory(8001);
        (bytes32 a,bytes32 ar)=file(folder,"a",8002);(bytes32 b,bytes32 br)=file(folder,"b",8003);
        bytes32 c=ledger.create(bytes32(uint256(8004)));ledger.publish(nt,bytes("c"));ledger.bind(FOLDER,folder,name("c"),c,0);
        (bytes32 d,bytes32 dr)=file(folder,"d",8005);
        alice.bind(HEAD,b,0,br,0);ledger.unbind(HEAD,b,0,1);
        alice.bind(HEAD,d,0,ledger.publish(rt,bytes.concat(abi.encode(d),bytes("competing"))),0);
        bytes32 concept=bytes32("selection tag");FilesPageReader.Query memory q=FilesPageReader.Query(concept,0,true,"");
        FilesPageReader.Basis memory origin=basis();
        FilesPageReader.Page memory fa=fast.readPage(folder,selectors(),q,origin,"",1);
        FilesPageReader.Page memory ra=raw.readPage(folder,selectors(),q,origin,"",1);
        bytes memory fc=fa.continuation;bytes memory rc=ra.continuation;samePage(fa,ra);
        require(fa.rows[0].head.target==ar,"first live selection");
        q.diagnosticHead=false;
        bytes memory orderedFast=fast.readPage(folder,selectors(),q,origin,"",1).continuation;
        bytes memory orderedRaw=raw.readPage(folder,selectors(),q,origin,"",1).continuation;
        q.diagnosticHead=true;
        ledger.unbind(HEAD,a,0,1);ledger.bind(HEAD,b,0,br,2);
        ledger.bind(HEAD,c,0,ledger.publish(rt,bytes.concat(abi.encode(c),bytes("first after A"))),0);
        ledger.bind(HEAD,d,0,ledger.publish(rt,bytes.concat(abi.encode(d),bytes("overwrite"))),1);
        ledger.bind(TAG,d,concept,d,0);ledger.bind(TAG,dr,concept,d,0);
        (,uint64 at,,)=ledger.record(dr);ledger.execute(one(aWithdraw(at)),new bytes[](1),ledger.nonces(address(this)));
        (,at,,)=ledger.record(Keys.recordFromHash(nt,name("d")));ledger.execute(one(aWithdraw(at)),new bytes[](1),ledger.nonces(address(this)));
        // Unselected same-folder scope changes must not invalidate this selector.
        bob.bind(FOLDER,folder,name("a"),a,0);
        fa=fast.readPage(folder,selectors(),q,origin,fc,8);ra=raw.readPage(folder,selectors(),q,origin,rc,8);samePage(fa,ra);
        require(fa.rows.length==3&&fa.rows[0].head.status==3&&fa.rows[1].head.status==0&&fa.rows[2].head.status==3,"history state literal controls");
        q.diagnosticHead=false;
        fa=fast.readPage(folder,selectors(),q,origin,orderedFast,8);ra=raw.readPage(folder,selectors(),q,origin,orderedRaw,8);samePage(fa,ra);
        require(fa.rows[0].head.status==2&&fa.rows[1].head.status==0&&fa.rows[2].head.target==dr,"ordered origin masks or revision lost");
        require(fa.rows[2].header.qualification==1&&fa.rows[2].name.qualification==1&&fa.rows[2].revisionTag.subject==dr&&!fa.rows[2].revisionTag.present,"withdrawal or later tag contaminated retained origin");
        // Query identity cannot be changed on an existing continuation.
        (bool ok,)=address(fast).staticcall(abi.encodeCall(fast.readPage,(folder,selectors(),q,origin,fc,8)));require(!ok,"filter domain weakened");q.diagnosticHead=true;
        for(uint256 i;i<4;i++){
            bytes32 subject=i==0?a:i==1?b:i==2?c:d;
            sameCall(fast.lens(),raw.lens(),abi.encodeCall(fast.lens().resolvePrincipalsAt,(selectors(),HEAD,subject,bytes32(0),origin.admission,origin.executionSet)));
            sameCall(fast.lens(),raw.lens(),abi.encodeCall(fast.lens().resolveNoTiebreakPrincipalsAt,(selectors(),HEAD,subject,bytes32(0),origin.admission,origin.executionSet)));
            sameCall(fast.lens(),raw.lens(),abi.encodeCall(fast.lens().resolvePrincipals,(selectors(),HEAD,subject,bytes32(0),ledger.executionSet())));
            sameCall(fast.lens(),raw.lens(),abi.encodeCall(fast.lens().resolveNoTiebreakPrincipals,(selectors(),HEAD,subject,bytes32(0),ledger.executionSet())));
        }
        bytes32 historyKey=Keys.historyList(Keys.binding(pid(address(this)),Keys.position(HEAD,b,0)));
        probeSelection.mockCallRevert(address(index),abi.encodeCall(index.coverage,(index.FAMILY_HISTORY(),historyKey)),hex"01");
        fa=fast.readPage(folder,selectors(),q,origin,fc,8);ra=raw.readPage(folder,selectors(),q,origin,rc,8);samePage(fa,ra);
        require(fa.rows[0].head.status==4&&fa.rows[0].matchStatus==0,"history unknown fell through");probeSelection.clearMockedCalls();
        ledger.bind(FOLDER,folder,name("a"),a,1);
        (ok,)=address(fast).staticcall(abi.encodeCall(fast.readPage,(folder,selectors(),q,origin,fc,8)));require(!ok,"consumed scope accepted");
        (ok,)=address(raw).staticcall(abi.encodeCall(raw.readPage,(folder,selectors(),q,origin,rc,8)));require(!ok,"raw consumed scope accepted");
    }
}
