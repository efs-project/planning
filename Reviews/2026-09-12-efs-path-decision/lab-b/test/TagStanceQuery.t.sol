// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {TagStanceProfileTest} from "./TagStanceProfile.t.sol";
import {TagStanceIndex} from "./TagStanceProfile.sol";
import {TagStanceReader,TagStanceLens} from "./TagStanceReader.sol";
import {Keys} from "../src/Keys.sol";
import {TagStanceQueryAccumulator} from "./TagStanceQueryAccumulator.sol";

contract TagStanceQueryTest is TagStanceProfileTest {
    TagStanceReader reader;
    function setupQuery() internal {seed();TagStanceLens helper=new TagStanceLens(ledger,TagStanceIndex(address(index)));reader=new TagStanceReader(ledger,TagStanceIndex(address(index)),helper,address(helper).codehash);}
    function principals() internal view returns(bytes32[] memory p){p=new bytes32[](2);p[0]=pid(address(alice));p[1]=pid(address(bob));}
    function basis() internal view returns(TagStanceReader.Basis memory){return TagStanceReader.Basis(admissions(),index.generation(),registry.epoch(),ledger.executionSet(),ledger.realmId(),TagStanceIndex(address(index)).tagProfileHash());}
    function test_query_literal_priority_and_new_tombstone() public {
        setupQuery();bob.bind(PURPOSE,fileF,conceptC,tokens[0],0);alice.bind(PURPOSE,fileF,conceptC,tokens[2],0);
        TagStanceReader.Row memory r=reader.assess(principals(),fileF,conceptC,basis());
        require(r.assessment==1&&r.author==pid(address(bob))&&r.stance==1,"SILENT did not fall through");
        alice.bind(PURPOSE,fileF,conceptC,tokens[1],1);r=reader.assess(principals(),fileF,conceptC,basis());
        require(r.assessment==2&&r.author==pid(address(alice))&&r.stance==2,"DENY not attributable");
        alice.unbind(PURPOSE,fileF,conceptC,2);r=reader.assess(principals(),fileF,conceptC,basis());
        require(r.assessment==1&&r.author==pid(address(bob)),"new tombstone masked");
        r=reader.assess(principals(),fileG,conceptC,basis());require(r.assessment==2&&r.stance==0&&r.author==0,"untouched became DENY");
    }
    function test_query_both_directions_deduplicate_exact_identity_and_keep_orphan() public {
        setupQuery();alice.bind(PURPOSE,fileF,conceptC,tokens[2],0);bob.bind(PURPOSE,fileF,conceptC,tokens[0],0);
        alice.bind(PURPOSE,fileF,conceptC2,tokens[0],0);alice.bind(PURPOSE,orphanH,conceptC,tokens[0],0);
        TagStanceReader.TagPage memory p=reader.readPage(principals(),TagStanceReader.Query(1,1,fileF,false),basis(),"",8);
        require(p.scanStatus==2&&p.rawTotal==3&&p.scanned==3&&p.rows.length==2,"exact concepts not deduplicated");
        p=reader.readPage(principals(),TagStanceReader.Query(2,1,conceptC,false),basis(),"",8);
        require(p.rawTotal==3&&p.rows.length==2,"inverse inventory wrong");
        require(p.rows[1].subject==orphanH&&p.rows[1].assessment==1,"orphan lost");
    }
    function test_query_exact_placement_stance_and_inverse_after_occupant_change() public {
        setupQuery();bytes32 slot=Keys.position(FOLDER,directoryD,name("f"));
        alice.bind(PURPOSE,slot,conceptC,tokens[0],0);
        TagStanceReader.Row memory point=reader.assess(principals(),slot,conceptC,basis());
        require(point.assessment==1&&point.subject==slot&&point.intrinsicFile==0,"location point not qualified");
        TagStanceReader.TagPage memory bySlot=reader.readPage(principals(),TagStanceReader.Query(1,5,slot,false),basis(),"",8);
        require(bySlot.scanStatus==2&&bySlot.rows.length==1&&bySlot.rows[0].assessment==1,"location's tags incomplete");
        ledger.bind(FOLDER,directoryD,name("f"),fileG,1);
        TagStanceReader.TagPage memory byConcept=reader.readPage(principals(),TagStanceReader.Query(2,5,conceptC,false),basis(),"",8);
        require(byConcept.scanStatus==2&&byConcept.rows.length==1&&byConcept.rows[0].subject==slot
            &&byConcept.rows[0].assessment==1,"slot tag did not survive rebind in inverse query");
        TagStanceReader.Row memory filePoint=reader.assess(principals(),fileG,conceptC,basis());
        require(filePoint.assessment==2,"slot tag silently became File tag");
    }
    function test_query_future_folder_observation_cannot_qualify_past_origin() public {
        setupQuery();
        ledger.publish(legacy[4],bytes("future"));
        bytes32 slot=Keys.position(FOLDER,directoryD,name("future"));
        TagStanceIndex stanceIndex=TagStanceIndex(address(index));
        TagStanceReader.Basis memory beforeBind=basis();
        require(stanceIndex.firstFolderObservation(slot)==0,"unbound slot has first observation");
        bytes32 invalidSlot=Keys.position(FOLDER,directoryD,name("never-published"));
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.bind,
            (FOLDER,directoryD,name("never-published"),fileF,uint32(0))));
        require(!ok&&stanceIndex.firstFolderObservation(invalidSlot)==0,"failed FOLDER bind leaked observation");
        (uint8 kind,)=reader.classify(slot,beforeBind.admission);
        require(kind==0,"unobserved slot qualified before bind");

        ledger.bind(FOLDER,directoryD,name("future"),fileF,0);
        uint64 firstFolder=admissions();
        require(stanceIndex.firstFolderObservation(slot)==firstFolder,"first FOLDER admission not retained");
        (kind,)=reader.classify(slot,beforeBind.admission);
        require(kind==0,"future FOLDER bind retroactively qualified slot");
        require(reader.assess(principals(),slot,conceptC,beforeBind).assessment==0,"past point became qualified absence");
        (ok,)=address(reader).staticcall(abi.encodeCall(reader.readPage,
            (principals(),TagStanceReader.Query(1,5,slot,false),beforeBind,bytes(""),uint256(8))));
        require(!ok,"past location returned a complete empty page");
        (kind,)=reader.classify(slot,basis().admission);
        require(kind==5,"observed location did not qualify at current origin");
        TagStanceReader.TagPage memory current=reader.readPage(principals(),
            TagStanceReader.Query(1,5,slot,false),basis(),"",8);
        require(current.scanStatus==2&&current.rows.length==0&&current.queryAssessment==1,
            "current observed location did not support qualified absence");
        ledger.bind(FOLDER,directoryD,name("future"),fileG,1);
        require(stanceIndex.firstFolderObservation(slot)==firstFolder,"rebind rewrote first FOLDER observation");
    }
    function test_query_frozen_origin_and_zero_match_partial() public {
        setupQuery();alice.bind(PURPOSE,fileF,conceptC,tokens[2],0);alice.bind(PURPOSE,fileG,conceptC,tokens[0],0);
        TagStanceReader.Basis memory b=basis();TagStanceReader.Query memory q=TagStanceReader.Query(2,1,conceptC,false);
        TagStanceReader.TagPage memory p=reader.readPage(principals(),q,b,"",1);
        require(p.scanStatus==1&&p.scanned==1&&p.rawTotal==2&&p.rows[0].assessment==2,"empty budget incorrectly complete");
        alice.bind(PURPOSE,fileG,conceptC,tokens[1],1);alice.bind(PURPOSE,orphanH,conceptC,tokens[0],0);
        TagStanceReader.TagPage memory next=reader.readPage(principals(),q,b,p.continuation,1);
        require(next.scanStatus==2&&next.rawTotal==2&&next.inventoryPin==p.inventoryPin&&next.rows[0].assessment==1,"origin lost after churn");
        require(next.historyProbes>0,"historical work omitted");
    }
    function test_query_subject_modes_and_selected_head_at_origin() public {
        setupQuery();alice.bind(HEAD,fileF,0,revision1,0);alice.bind(PURPOSE,revision1,conceptC,tokens[0],0);
        alice.bind(PURPOSE,revision2,conceptC,tokens[0],0);alice.bind(PURPOSE,directoryD,conceptC,tokens[0],0);
        TagStanceReader.Basis memory b=basis();TagStanceReader.Query memory q=TagStanceReader.Query(2,3,conceptC,false);
        TagStanceReader.TagPage memory p=reader.readPage(principals(),q,b,"",1);
        require(p.rows[0].subject==revision1&&p.rows[0].intrinsicFile==fileF&&p.rows[0].assessment==1,"selected origin revision missing");
        alice.bind(HEAD,fileF,0,revision2,1);p=reader.readPage(principals(),q,b,p.continuation,8);
        require(p.rows[0].subject==revision2&&p.rows[0].assessment==3,"former losing revision became current match");
        require(p.rows[1].assessment==3,"Directory became File revision");
        p=reader.readPage(principals(),TagStanceReader.Query(2,2,conceptC,false),basis(),"",8);
        require(p.rows[0].assessment==1&&p.rows[1].assessment==1&&p.rows[2].assessment==3,"exact revision scope wrong");
    }
    function test_query_unknown_higher_never_falls_through() public {
        setupQuery();alice.bind(PURPOSE,fileF,conceptC,tokens[0],0);bob.bind(PURPOSE,fileF,conceptC,tokens[0],0);
        TagStanceReader.Basis memory b=basis();
        // Corrupt selected target only; a missing/invalid token is UNKNOWN,
        // never semantic silence that exposes the lower ASSERT.
        bytes32 key=Keys.binding(pid(address(alice)),Keys.position(PURPOSE,fileF,conceptC));
        fault.store(address(ledger),bytes32(uint256(keccak256(abi.encode(key,uint256(8))))+1),bytes32(uint256(444)));
        TagStanceReader.Row memory r=reader.assess(principals(),fileF,conceptC,b);
        require(r.assessment==0&&r.author==pid(address(alice)),"unknown fell through");
    }
    function owned(bytes32 session) internal returns(TagStanceQueryAccumulator){return new TagStanceQueryAccumulator(reader,address(reader).codehash,principals(),TagStanceReader.Query(2,1,conceptC,false),basis(),session);}
    function test_query_owned_prefix_rejects_suffix_reset_and_wrong_session() public {
        setupQuery();alice.bind(PURPOSE,fileF,conceptC,tokens[2],0);alice.bind(PURPOSE,fileG,conceptC,tokens[0],0);
        TagStanceQueryAccumulator consumer=owned(bytes32(uint256(1)));
        require(!consumer.originAbsent(),"unstarted absence");consumer.step(bytes32(uint256(1)),1);
        require(!consumer.complete()&&!consumer.originAbsent()&&consumer.scanned()==1,"prefix certified suffix");
        (bool ok,)=address(consumer).call(abi.encodeCall(consumer.step,(bytes32(uint256(2)),uint256(1))));require(!ok,"changed session accepted");
        (ok,)=address(consumer).call(bytes.concat(abi.encodeCall(consumer.step,(bytes32(uint256(1)),uint256(1))),abi.encode(uint256(0))));require(!ok,"suffix accepted");
        consumer.step(bytes32(uint256(1)),1);require(consumer.complete()&&!consumer.originAbsent()&&consumer.scanned()==2,"terminal proof wrong");
        (ok,)=address(consumer).call(abi.encodeCall(consumer.step,(bytes32(uint256(1)),uint256(1))));require(!ok,"reset allowed");
    }
    function test_query_owned_unknown_accumulates_and_pins_profile() public {
        setupQuery();alice.bind(PURPOSE,fileF,conceptC,tokens[0],0);alice.bind(PURPOSE,fileG,conceptC,tokens[2],0);
        TagStanceQueryAccumulator consumer=owned(bytes32(uint256(1)));
        bytes32 key=Keys.binding(pid(address(alice)),Keys.position(PURPOSE,fileF,conceptC));
        fault.store(address(ledger),bytes32(uint256(keccak256(abi.encode(key,uint256(8))))+1),bytes32(uint256(444)));
        consumer.step(bytes32(uint256(1)),1);consumer.step(bytes32(uint256(1)),1);
        require(consumer.complete()&&consumer.unknownCount()==1&&!consumer.originAbsent(),"unknown reset by terminal page");
        TagStanceReader.Basis memory b=basis();b.profile=0;
        (bool ok,)=address(reader).staticcall(abi.encodeCall(reader.readPage,(principals(),TagStanceReader.Query(2,1,conceptC,false),b,bytes(""),uint256(1))));
        require(!ok,"changed profile accepted");
    }
    function test_query_conflicting_head_explicit_and_unrelated_inventory_isolated() public {
        setupQuery();alice.bind(HEAD,fileF,0,revision1,0);bob.bind(HEAD,fileF,0,revision2,0);
        alice.bind(PURPOSE,revision1,conceptC,tokens[0],0);
        TagStanceReader.Query memory q=TagStanceReader.Query(2,3,conceptC,true);
        TagStanceReader.TagPage memory p=reader.readPage(principals(),q,basis(),"",8);
        require(p.rows.length==1&&p.rows[0].assessment==0&&p.rows[0].headStatus==3,"conflict hidden");
        ledger.bind(PURPOSE,revision2,conceptC,tokens[0],0);alice.bind(PURPOSE,fileG,conceptC2,tokens[0],0);
        p=reader.readPage(principals(),q,basis(),"",8);require(p.rawTotal==1,"unrelated principal or Concept inflated candidates");
    }
    function test_query_missing_query_meaning_cannot_certify_empty() public {
        setupQuery();
        (bool ok,)=address(reader).staticcall(abi.encodeCall(reader.readPage,(principals(),TagStanceReader.Query(2,1,tokens[0],false),basis(),bytes(""),uint256(1))));
        require(!ok,"wrong Concept returned complete empty");
        (ok,)=address(reader).staticcall(abi.encodeCall(reader.readPage,(principals(),TagStanceReader.Query(1,1,revision1,false),basis(),bytes(""),uint256(1))));
        require(!ok,"wrong subject class returned complete empty");
    }
    function test_query_point_intrinsic_identity_and_missing_selected_head() public {
        setupQuery();alice.bind(PURPOSE,revision1,conceptC,tokens[0],0);
        TagStanceReader.Row memory r=reader.assess(principals(),revision1,conceptC,basis());
        require(r.assessment==1&&r.intrinsicFile==fileF,"point lost intrinsic File");
        r=reader.assess(principals(),fileF,tokens[0],basis());require(r.assessment==0,"wrong Concept became point absence");
        TagStanceReader.TagPage memory p=reader.readPage(principals(),TagStanceReader.Query(1,3,orphanH,false),basis(),"",1);
        require(p.scanStatus==0&&p.unknowns==0&&p.queryAssessment==3&&p.headStatus==0,"proven missing HEAD is not unknown testimony");
        alice.bind(HEAD,fileF,0,revision1,0);bob.bind(HEAD,fileF,0,revision2,0);
        p=reader.readPage(principals(),TagStanceReader.Query(1,3,fileF,true),basis(),"",1);
        require(p.scanStatus==0&&p.unknowns==1&&p.headStatus==3&&p.queryAssessment==0,"selected HEAD conflict not explicit");
    }
    function test_query_diagnostic_attributes_assert_deny_without_changing_priority() public {
        setupQuery();alice.bind(PURPOSE,fileF,conceptC,tokens[0],0);uint64 a=admissions();bob.bind(PURPOSE,fileF,conceptC,tokens[1],0);uint64 b=admissions();
        TagStanceReader.Diagnostic memory d=reader.diagnose(principals(),fileF,conceptC,basis(),false);
        require(d.stances.length==2,"diagnostic observations missing");
        require(d.complete&&d.stanceDisagreement&&d.basis.admission==b&&d.intrinsicFile==fileF,"diagnostic basis/disagreement lost");
        require(d.stances[0].author==pid(address(alice))&&d.stances[0].kind==2&&d.stances[0].admission==a&&d.stances[0].revision==1,"ASSERT attribution lost");
        require(d.stances[1].author==pid(address(bob))&&d.stances[1].kind==3&&d.stances[1].admission==b&&d.stances[1].target==tokens[1],"DENY attribution lost");
        require(reader.assess(principals(),fileF,conceptC,basis()).author==pid(address(alice)),"priority changed");
    }
    function test_query_diagnostic_attributes_conflicting_heads_at_origin() public {
        setupQuery();alice.bind(HEAD,fileF,0,revision1,0);uint64 a=admissions();bob.bind(HEAD,fileF,0,revision2,0);uint64 b=admissions();
        TagStanceReader.Basis memory origin=basis();alice.bind(HEAD,fileF,0,revision2,1);
        TagStanceReader.Diagnostic memory d=reader.diagnose(principals(),revision1,conceptC,origin,true);
        require(d.heads.length==2,"HEAD observations missing");
        require(d.complete&&d.headDisagreement&&d.basis.admission==b,"HEAD disagreement lost");
        require(d.heads[0].author==pid(address(alice))&&d.heads[0].target==revision1&&d.heads[0].admission==a&&d.heads[0].revision==1,"origin HEAD A lost");
        require(d.heads[1].author==pid(address(bob))&&d.heads[1].target==revision2&&d.heads[1].admission==b,"origin HEAD B lost");
    }
    function test_query_diagnostic_silence_tombstone_and_unknown_are_not_votes() public {
        setupQuery();alice.bind(PURPOSE,fileF,conceptC,tokens[2],0);bob.bind(PURPOSE,fileF,conceptC,tokens[1],0);
        TagStanceReader.Diagnostic memory d=reader.diagnose(principals(),fileF,conceptC,basis(),false);
        require(d.stances.length==2,"silence observations missing");require(d.complete&&!d.stanceDisagreement&&d.stances[0].kind==4,"SILENT counted as disagreement");
        alice.unbind(PURPOSE,fileF,conceptC,1);d=reader.diagnose(principals(),fileF,conceptC,basis(),false);
        require(d.stances[0].kind==5&&d.stances[0].revision==2&&!d.stanceDisagreement,"tombstone evidence lost");
        bytes32 key=Keys.binding(pid(address(bob)),Keys.position(PURPOSE,fileF,conceptC));
        fault.store(address(ledger),bytes32(uint256(keccak256(abi.encode(key,uint256(8))))+1),bytes32(uint256(444)));
        d=reader.diagnose(principals(),fileF,conceptC,basis(),false);
        require(!d.complete&&d.stances[1].kind==0&&d.stances[1].author==pid(address(bob)),"unavailable testimony became silence");
    }
}
