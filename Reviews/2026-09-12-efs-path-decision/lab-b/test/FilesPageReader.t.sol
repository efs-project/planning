// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {FilesCarrierIndexTest} from "./FilesCarrierProfile.t.sol";
import {FilesCarrierIndex} from "./FilesCarrierProfile.sol";
import {FilesPageReader,FilesPagePaid} from "./FilesPageReader.sol";
import {FilesLiveLens} from "./FilesLiveIndex.sol";
import {FilesLayout,FilesParentIndex} from "./FilesJoinedProfile.sol";
import {FilesJoinedConsumer} from "./FilesJoinedConsumer.sol";
import {FilesNameReader} from "./FilesNamesProfile.sol";
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {Keys} from "../src/Keys.sol";
interface PageVm {function mockCallRevert(address,bytes calldata,bytes calldata) external;function clearMockedCalls() external;function prank(address) external;}
contract FilesPageReaderTest is FilesCarrierIndexTest {
    PageVm private constant probe=PageVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function reader() internal returns(FilesPageReader){return new FilesPageReader(ledger,new FilesLiveLens(ledger,index),FilesCarrierIndex(address(index)));}
    function basis() internal view returns(FilesPageReader.Basis memory){return FilesPageReader.Basis(admissions(),index.generation(),registry.epoch(),ledger.executionSet());}
    function selectors() internal view returns(bytes32[] memory a){a=new bytes32[](2);a[0]=pid(address(this));a[1]=pid(address(alice));}
    function file(bytes32 folder,string memory label,uint256 salt) internal returns(bytes32 f,bytes32 revision){
        f=ledger.create(bytes32(salt));revision=ledger.publish(rt,bytes.concat(abi.encode(f),bytes("hello")));
        ledger.bind(HEAD,f,0,revision,0);ledger.publish(nt,bytes(label));ledger.bind(FOLDER,folder,keccak256(bytes(label)),f,0);
    }
    function test_page_unsupported_header_cannot_disappear_under_filter() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1);(bytes32 f,)=file(folder,"a",2);
        ledger.bind(HEAD,f,0,ledger.publish(BINARY,bytes("unsupported")),1);
        FilesPageReader.Query memory q=FilesPageReader.Query(bytes32(uint256(99)),2,false,"");
        FilesPageReader.Page memory p=r.readPage(folder,selectors(),q,basis(),"",8);
        require(p.rows.length==1,"unsupported selected row hidden by tag filter");require(p.rows[0].header.qualification==4,"unsupported not qualified");
    }
    function test_page_forged_terminal_cannot_license_whole_query_absence() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1);file(folder,"a",2);file(folder,"b",3);
        FilesPageReader.Query memory q;FilesPageReader.Page memory first=r.readPage(folder,selectors(),q,basis(),"",1);
        (bytes32 domain,LensReader.PrincipalCursor memory c)=abi.decode(first.continuation,(bytes32,LensReader.PrincipalCursor));
        c.lensIndex=2;c.rawIndex=0;c.selectedSoFar=0;
        FilesPageReader.Page memory forged=r.readPage(folder,selectors(),q,basis(),abi.encode(domain,c),1);
        require(forged.scanStatus==2&&!forged.startsAtOrigin&&!forged.completeFromOrigin,"fabricated terminal cursor licensed full-query COMPLETE/absence");
        // The consumer's caller domain differs. It can forge that domain hash,
        // but suffix exhaustion still cannot license a whole-query empty claim.
        FilesPagePaid consumer=new FilesPagePaid();
        domain=keccak256(abi.encode(address(consumer),address(r),folder,selectors(),q,basis()));
        require(!consumer.queryAbsent(r,folder,selectors(),q,basis(),abi.encode(domain,c),1),"consumer trusted arbitrary terminal prefix");
        c.lensIndex=0;c.rawIndex=1;c.selectedSoFar=0;
        require(!consumer.queryAbsent(r,folder,selectors(),q,basis(),abi.encode(domain,c),1),"consumer trusted skipped prefix");
        q.search="no-match";
        require(consumer.queryAbsent(r,folder,selectors(),q,basis(),"",8),"origin exhaustive negative control unavailable");
    }
    function test_page_name_header_and_tag_failures_keep_known_axes() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1);(bytes32 f,bytes32 revision)=file(folder,"a",2);
        bytes32 tag=bytes32(uint256(99));ledger.bind(TAG,f,tag,f,0);
        FilesPageReader.Query memory q=FilesPageReader.Query(tag,1,false,"");
        probe.mockCallRevert(address(ledger),abi.encodeCall(ledger.record,(revision)),hex"01");
        FilesPageReader.Page memory headerOnly=r.readPage(folder,selectors(),q,basis(),"",8);
        require(headerOnly.rows[0].header.qualification==1,"listing fetches full revision body");probe.clearMockedCalls();
        probe.mockCallRevert(address(ledger),abi.encodeCall(ledger.record,(Keys.recordFromHash(nt,keccak256("a")))),hex"01");
        FilesPageReader.Page memory p=r.readPage(folder,selectors(),q,basis(),"",8);
        require(p.scanStatus==2&&p.rows.length==1&&p.rows[0].name.qualification==0,"missing name drops placement");
        require(p.rows[0].placement.target==f&&p.rows[0].header.recordId==revision&&p.rows[0].stableTag.present,"known joins erased");
        probe.clearMockedCalls();
        probe.mockCallRevert(address(ledger),abi.encodeCall(ledger.extsload,(FilesLayout.recordBase(revision))),hex"01");
        p=r.readPage(folder,selectors(),q,basis(),"",8);
        require(p.rows.length==1&&p.rows[0].header.qualification==0&&p.rows[0].name.qualification==1&&p.rows[0].stableTag.present,"header failure loses independent axes");
        probe.clearMockedCalls();
        probe.mockCallRevert(address(r.lens()),abi.encodeWithSelector(r.lens().resolvePrincipalsAt.selector,selectors(),TAG,revision,tag,admissions(),ledger.executionSet()),hex"01");
        q.tagScope=2;p=r.readPage(folder,selectors(),q,basis(),"",8);
        require(p.rows.length==1&&p.rows[0].matchStatus==0&&p.rows[0].revisionTag.qualification==0,"unknown tag filtered as false");
    }
    function test_page_fault_matrix_matches_independent_point_and_name_oracles() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1);(bytes32 f,bytes32 revision)=file(folder,"a",2);
        FilesNameReader names=new FilesNameReader(ledger,address(ledger),nt,r.index().expectedNameRuleHash());
        FilesJoinedConsumer points=new FilesJoinedConsumer(ledger,r.lens(),FilesParentIndex(address(index)),rt,ct,r.index().expectedRootRuleHash(),r.index().expectedChildRuleHash());
        bytes32 tag=bytes32(uint256(99));ledger.bind(TAG,f,tag,f,0);ledger.bind(TAG,revision,tag,f,0);
        FilesPageReader.Basis memory pinned=basis();
        FilesPageReader.Query memory q=FilesPageReader.Query(tag,3,false,"");
        // Same immutable basis, three independent source conditions. Header-slot
        // unavailability need not prevent the full-body point oracle from reading
        // its different source; compare preserved axes without upgrading the page.
        for(uint256 fault;fault<3;fault++){
            if(fault==1)probe.mockCallRevert(address(ledger),abi.encodeCall(ledger.record,(Keys.recordFromHash(nt,keccak256("a")))),hex"01");
            if(fault==2)probe.mockCallRevert(address(ledger),abi.encodeCall(ledger.extsload,(FilesLayout.recordBase(revision))),hex"01");
            FilesPageReader.Page memory page=r.readPage(folder,selectors(),q,pinned,"",8);
            require(page.rows.length==1&&page.completeFromOrigin,"fault erased selected placement");
            FilesPageReader.Row memory row=page.rows[0];
            FilesNameReader.Name memory name=names.readNameAt(row.placement.position,folder,row.role,FilesNameReader.ExecutionBasis(pinned.admission,pinned.epoch,pinned.executionSet));
            require(row.name.qualification==name.status&&row.name.recordId==name.recordId&&row.name.firstAdmission==name.firstAdmission&&keccak256(row.name.value)==keccak256(name.value),"independent Name mismatch");
            FilesJoinedConsumer.FilePoint memory point=points.readFilePointPrincipals(f,selectors(),tag,FilesJoinedConsumer.PrincipalBasis(pinned.admission,pinned.generation,pinned.epoch,pinned.executionSet));
            require(row.placement.target==point.file&&row.head.status==point.status&&row.head.target==point.revision.recordId&&row.header.recordId==point.revision.recordId,"independent point mismatch");
            require(row.stableTag.subject==point.fileTag.subject&&row.stableTag.present==point.fileTag.present&&row.stableTag.selection.status==point.fileTag.status,"independent stable tag mismatch");
            require(row.revisionTag.subject==point.revisionTag.subject&&row.revisionTag.present==point.revisionTag.present&&row.revisionTag.selection.status==point.revisionTag.status,"independent revision tag mismatch");
            if(fault==2)require(row.header.qualification==0&&point.revision.document.length==5,"unavailable header silently upgraded");
            else require(row.header.qualification==1&&row.header.typeId==point.revision.typeId&&row.header.parent==point.revision.parent&&row.header.bodyLength==point.revision.document.length+32,"independent header mismatch");
            require(row.matchStatus==(fault==0?1:0),"fault filtered or represented as definite match");
            probe.clearMockedCalls();
        }
    }
    function test_page_header_helper_refuses_unguarded_external_use() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1);(bytes32 f,bytes32 revision)=file(folder,"a",2);
        (bool ok,)=address(r).staticcall(abi.encodeCall(r.readHeader,(revision,f,admissions())));
        require(!ok,"header helper exposed without page basis guard");
    }
    function test_page_uncertain_join_cannot_license_filtered_empty_origin() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1);(,bytes32 revision)=file(folder,"a",2);
        FilesPageReader.Query memory q=FilesPageReader.Query(bytes32(uint256(99)),1,false,"");FilesPagePaid consumer=new FilesPagePaid();
        probe.mockCallRevert(address(ledger),abi.encodeCall(ledger.record,(Keys.recordFromHash(nt,keccak256("a")))),hex"01");
        require(!consumer.queryAbsent(r,folder,selectors(),q,basis(),"",8),"missing Name turned into filtered empty proof");probe.clearMockedCalls();
        probe.mockCallRevert(address(ledger),abi.encodeCall(ledger.extsload,(FilesLayout.recordBase(revision))),hex"01");
        require(!consumer.queryAbsent(r,folder,selectors(),q,basis(),"",8),"missing header turned into filtered empty proof");probe.clearMockedCalls();
        probe.mockCallRevert(address(r.lens()),abi.encodeWithSelector(r.lens().resolvePrincipalsAt.selector,selectors(),TAG,revision,q.concept,admissions(),ledger.executionSet()),hex"01");
        q.tagScope=2;q.search="no-match";
        require(!consumer.queryAbsent(r,folder,selectors(),q,basis(),"",8),"unknown requested tag turned into filtered empty proof");
    }
    function test_page_continuations_bind_caller_filter_basis_and_swap_removal() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1);file(folder,"a",2);file(folder,"b",3);
        FilesPageReader.Query memory q;FilesPageReader.Page memory p=r.readPage(folder,selectors(),q,basis(),"",1);
        require(p.scanStatus==1&&p.rows.length==1,"bounded first page");
        q.search="b";(bool ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,selectors(),q,basis(),p.continuation,1)));require(!ok,"changed filter reused cursor");q.search="";
        bytes32[] memory authors=selectors();FilesPageReader.Basis memory pinned=basis();probe.prank(address(123));(ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,authors,q,pinned,p.continuation,1)));require(!ok,"changed caller reused cursor");
        ledger.unbind(FOLDER,folder,keccak256("a"),1);
        (ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,authors,q,basis(),p.continuation,1)));require(!ok,"swap removal accepted stale page");
        p=r.readPage(folder,authors,q,basis(),"",1);require(p.scanStatus==2&&p.rows.length==1&&keccak256(p.rows[0].name.value)==keccak256("b"),"restart missed swapped entry");
        (ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,authors,q,basis(),bytes(""),0)));require(!ok,"zero budget complete");
    }
    function test_page_conflict_keeps_file_tag_and_unknown_revision_tag() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1);(bytes32 f,)=file(folder,"a",2);
        bytes32 other=ledger.publish(rt,bytes.concat(abi.encode(f),bytes("other")));alice.bind(HEAD,f,0,other,0);
        bytes32 tag=bytes32(uint256(99));ledger.bind(TAG,f,tag,f,0);
        FilesPageReader.Query memory q=FilesPageReader.Query(tag,2,true,"");
        FilesPageReader.Page memory p=r.readPage(folder,selectors(),q,basis(),"",8);
        require(p.rows.length==1&&p.rows[0].head.status==3&&p.rows[0].name.qualification==1,"conflict erased known placement");
        require(p.rows[0].stableTag.present&&p.rows[0].revisionTag.qualification==0&&p.rows[0].header.recordId==0,"conflict invented selected revision");
        q.concept=bytes32(uint256(100));q.tagScope=1;p=r.readPage(folder,selectors(),q,basis(),"",8);
        require(p.rows.length==1&&p.rows[0].head.status==3,"diagnostic conflict hidden by filter");
    }
    function test_page_unavailable_head_keeps_selected_placement_name_and_file_tag() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1);(bytes32 f,)=file(folder,"a",2);bytes32 tag=bytes32(uint256(99));ledger.bind(TAG,f,tag,f,0);
        probe.mockCallRevert(address(r.lens()),abi.encodeWithSelector(r.lens().resolvePrincipalsAt.selector,selectors(),HEAD,f,bytes32(0),admissions(),ledger.executionSet()),hex"01");
        FilesPageReader.Query memory q=FilesPageReader.Query(tag,1,false,"");FilesPageReader.Page memory p=r.readPage(folder,selectors(),q,basis(),"",8);
        require(p.scanStatus==2&&p.rows.length==1&&p.rows[0].head.status==4&&p.rows[0].name.qualification==1&&p.rows[0].stableTag.present,"HEAD failure erases independent selection evidence");
    }
    function test_page_masked_budget_exhaustion_is_partial_not_empty() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1);(bytes32 f,)=file(folder,"a",2);
        alice.bind(FOLDER,folder,keccak256("a"),f,0);ledger.unbind(FOLDER,folder,keccak256("a"),1);
        ledger.publish(nt,bytes("b"));alice.bind(FOLDER,folder,keccak256("b"),f,0);
        FilesPageReader.Query memory q;FilesPageReader.Page memory p=r.readPage(folder,selectors(),q,basis(),"",1);
        require(p.rawTotal==2&&p.scanned==1&&p.rows.length==0&&p.scanStatus==1&&p.continuation.length>0,"masked partial is false complete");
        p=r.readPage(folder,selectors(),q,basis(),p.continuation,1);require(p.scanStatus==2&&p.rows.length==1&&!p.completeFromOrigin,"completion lost lower unmasked row");
    }
    function test_page_partial_family_coverage_is_unknown() public {
        FilesPageReader r=reader();bytes32 folder=_directory(1);file(folder,"a",2);
        probe.mockCallRevert(address(index),abi.encodeCall(index.coverage,(live.FAMILY_LIVE_SCOPE(),keccak256(abi.encode(FOLDER,folder)))),hex"01");
        FilesPageReader.Query memory q;(bool ok,)=address(r).staticcall(abi.encodeCall(r.readPage,(folder,selectors(),q,basis(),bytes(""),8)));
        require(!ok,"unavailable coverage silently complete");
    }
}
