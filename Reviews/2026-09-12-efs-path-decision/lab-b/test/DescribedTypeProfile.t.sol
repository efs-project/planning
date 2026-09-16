// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {Keys} from "../src/Keys.sol";
import {IAcceptor} from "../src/Interfaces.sol";
import {DescribedTypeRule,IDescribedRegistry} from "../src/DescribedTypeProfile.sol";
import {DescribedPredicateFixture,FakeDescribedLedger,DescribedPermissivePolicy,DescribedFinalFailure,CallbackRegistrationIndex} from "./DescribedFixtures.sol";

interface DescribedVm {
    function prank(address) external;function etch(address,bytes calldata) external;
    function chainId(uint256) external;function mockCall(address,bytes calldata,bytes calldata) external;function clearMockedCalls() external;
}

interface IDescribedRegistration {
    function describedTypeId(bytes calldata descriptor) external view returns(bytes32);
    function registerDescribed(bytes calldata descriptor,bytes calldata declaration,address custom,address allowedLedger,bytes calldata bindingSignature) external returns(bytes32);
    function declarationDigest(bytes32 typeId) external pure returns(bytes32);
    function descriptorBytes(bytes32 typeId) external view returns(bytes memory);
    function catalogRevision() external view returns(uint64);
}

/// RED targets: unknown profiles are currently signable; public described
/// registration/mandatory structural interpretation do not yet exist.
contract DescribedTypeProfileTest is LabBase {
    DescribedVm private constant probe=DescribedVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function test_unknown_publish_and_reuse_refuse_initial_profile() public view {
        (bool ok,)=address(ledger).staticcall(abi.encodeCall(ledger.acceptanceProfileOf,(one(aPublish(bytes32("unknown"),hex"01")))));
        require(!ok,"unknown publish profile was signable");
        (ok,)=address(ledger).staticcall(abi.encodeCall(ledger.acceptanceProfileOf,(one(aReuse(bytes32("unknown"),bytes32("record"))))));
        require(!ok,"unknown reuse profile was signable");
    }

    function textDescriptor(bytes32 namespace) internal view returns(bytes memory){
        return abi.encodePacked(hex"01010001",eoaA,namespace,bytes32(0),uint16(4),bytes("Note"),
            bytes32(uint256(1)),bytes32(uint256(101)),uint8(7),uint8(0),uint16(0),uint256(1),uint256(1024),bytes32(0));
    }
    function install(bytes memory d) internal returns(bytes32 t){
        IDescribedRegistration r=IDescribedRegistration(address(registry));
        t=r.describedTypeId(d);
        (uint8 v,bytes32 rr,bytes32 s)=vm.sign(PK_A,r.declarationDigest(t));
        require(r.registerDescribed(d,abi.encodePacked(rr,s,v),address(0),address(0),"")==t,"id changed");
    }
    function test_public_registration_retains_bytes_and_requires_structure() public {
        uint64 epoch=registry.epoch();bytes memory d=textDescriptor(bytes32("notes"));bytes32 t=install(d);
        require(registry.epoch()==epoch,"unrelated policy epoch bumped");
        require(keccak256(IDescribedRegistration(address(registry)).descriptorBytes(t))==keccak256(d),"lost descriptor");
        bytes32 id=ledger.publish(t,hex"00026869");
        (,uint64 first,,)=ledger.record(id);require(first!=0,"valid described publication missing");
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.publish,(t,hex"00036869")));
        require(!ok,"invalid text length accepted");
    }

    function signature(uint256 key,bytes32 digest) internal pure returns(bytes memory){
        (uint8 v,bytes32 r,bytes32 s)=vm.sign(key,digest);return abi.encodePacked(r,s,v);
    }
    function declaration(TypeRegistry r,bytes memory d) internal view returns(bytes memory){return signature(PK_A,r.declarationDigest(r.describedTypeId(d)));}
    function customDescriptor(DescribedPredicateFixture custom) internal view returns(bytes memory d){
        d=textDescriptor(bytes32("custom-note"));d[2]=0x01;bytes32 h=address(custom).codehash;
        assembly("memory-safe"){mstore(add(d,88),h)}
    }
    function customInstall(DescribedPredicateFixture custom,bytes memory d) internal returns(bytes32 t){
        return registry.registerDescribed(d,declaration(registry,d),address(custom),address(ledger),signature(PK_A,keccak256(registry.bindingPreimage(d,address(custom),address(ledger)))));
    }
    function refuses(bytes32 t,bytes memory body) internal {
        uint64 nonce=ledger.nonces(address(this));(uint64 admissions,,,uint64 pubs)=ledger.counts();
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.publish,(t,body)));
        require(!ok,"invalid body accepted");(uint64 afterA,,,uint64 afterP)=ledger.counts();
        require(afterA==admissions&&afterP==pubs&&ledger.nonces(address(this))==nonce,"failed operation changed state");
    }
    function test_custom_instance_valid_structure_and_callback_both_mandatory() public {
        DescribedPredicateFixture custom=new DescribedPredicateFixture(registry.describedRule().codehash,address(ledger));
        bytes memory d=customDescriptor(custom);bytes32 t=customInstall(custom,d);
        IDescribedRegistry.Info memory info=registry.describedInfo(t);
        require(info.mandatory!=registry.describedRule()&&info.mandatory==registry.bindingAddress(info.bindingId),"binding not address committed");
        require(info.mandatory.codehash==registry.describedRule().codehash,"runtime identity differs");
        bytes32 id=ledger.publish(t,hex"00026869");
        refuses(t,hex"00036869"); // custom currently true, structural length wrong
        registry.activate(t,address(new DescribedPermissivePolicy()));custom.setMode(1);
        refuses(t,hex"00026869"); // same body dedup still invokes custom
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.execute,(one(aReuse(t,id)),new bytes[](1),ledger.nonces(address(this)))));
        require(!ok,"reuse bypassed rejecting mandatory custom");
        registry.activate(t,address(0));refuses(t,hex"00026869");
        custom.setMode(0);ledger.execute(one(aReuse(t,id)),new bytes[](1),ledger.nonces(address(this)));
        (,uint64 first,uint32 occurrences,)=ledger.record(id);require(first==1&&occurrences==2,"reuse did not succeed after custom control");
    }
    function test_custom_signature_scope_and_same_code_different_state_squatting() public {
        DescribedPredicateFixture custom=new DescribedPredicateFixture(registry.describedRule().codehash,address(ledger));
        DescribedPredicateFixture squat=new DescribedPredicateFixture(registry.describedRule().codehash,address(ledger));squat.setMode(1);
        require(address(custom).codehash==address(squat).codehash,"fixture needs same code");
        bytes memory d=customDescriptor(custom);bytes32 t=registry.describedTypeId(d);bytes memory auth=signature(PK_A,keccak256(registry.bindingPreimage(d,address(custom),address(ledger))));
        (bool ok,)=address(registry).call(abi.encodeCall(registry.registerDescribed,(d,declaration(registry,d),address(squat),address(ledger),auth)));
        require(!ok,"same code squat installed");(bool registered,,,,,,)=registry.typeInfo(t);require(!registered,"failed install not atomic");
        require(registry.descriptorBytes(t).length==0,"failed install retained partial declaration");
        customInstall(custom,d);
        // Even a fresh valid authorization cannot mutate installed binding.
        bytes memory alternate=signature(PK_A,keccak256(registry.bindingPreimage(d,address(squat),address(ledger))));
        (ok,)=address(registry).call(abi.encodeCall(registry.registerDescribed,(d,declaration(registry,d),address(squat),address(ledger),alternate)));
        require(!ok,"installed binding replaced");
        require(registry.registerDescribed(d,declaration(registry,d),address(custom),address(ledger),auth)==t,"identical relay not idempotent");
        (bytes32 bindingId,bytes memory preimage,bytes memory retained)=registry.describedBinding(t);
        require(bindingId==keccak256(preimage)&&keccak256(retained)==keccak256(auth)&&preimage.length==384,"binding evidence lost");
    }
    function test_direct_forged_context_and_fake_ledger_cannot_impersonate() public {
        DescribedPredicateFixture custom=new DescribedPredicateFixture(registry.describedRule().codehash,address(ledger));
        bytes32 t=customInstall(custom,customDescriptor(custom));
        require(!custom.acceptDescribed(address(ledger),t,hex"00026869",new bytes32[](0)),"direct forged context trusted");
        FakeDescribedLedger fake=new FakeDescribedLedger(registry);
        IDescribedRegistry.Info memory info=registry.describedInfo(t);
        (bool ok,)=address(fake).staticcall(abi.encodeCall(fake.ask,(info.mandatory,t,hex"00026869",new bytes32[](0))));
        require(!ok,"fake ledger impersonated authorized ledger");
        // Emulate a fake Ledger's forged registry response. Even if it lies
        // about allowedLedger, the authenticated predicate sees the actual fake
        // caller, not the genuine Ledger and not a caller-supplied context.
        info.allowedLedger=address(fake);probe.mockCall(address(registry),abi.encodeCall(registry.describedInfo,(t)),abi.encode(info));
        require(!fake.ask(info.mandatory,t,hex"00026869",new bytes32[](0)),"forged registry fabricated genuine context");probe.clearMockedCalls();
        ledger.publish(t,hex"00026869");
    }
    function test_custom_bad_bool_oversized_return_exhaustion_and_code_drift_refuse() public {
        DescribedPredicateFixture custom=new DescribedPredicateFixture(registry.describedRule().codehash,address(ledger));
        bytes32 t=customInstall(custom,customDescriptor(custom));
        for(uint256 mode=2;mode<=4;mode++){custom.setMode(mode);refuses(t,hex"00026869");}
        probe.etch(address(custom),hex"00");refuses(t,hex"00026869");
    }
    function test_descriptor_canonicality_and_body_negative_matrix() public {
        bytes memory d=textDescriptor(bytes32("canonical"));bytes32 t=install(d);
        bytes[] memory bad=new bytes[](7);bad[0]=hex"";bad[1]=hex"0000";bad[2]=hex"00016100";bad[3]=hex"000109";bad[4]=hex"00017f";bad[5]=hex"0001ff";bad[6]=hex"000261";
        for(uint256 i;i<bad.length;i++)refuses(t,bad[i]);
        ledger.publish(t,hex"00020a20");
        for(uint256 i;i<7;i++){
            bytes memory malformed=bytes.concat(d);
            if(i==0)malformed[0]=0x02;
            if(i==1)malformed[1]=0x02;
            if(i==2)malformed[2]=0x01; // ABI without hash
            if(i==3)malformed[3]=0x11;
            if(i==4)malformed=bytes.concat(malformed,hex"00");
            if(i==5)malformed[158]=0xff; // kind
            if(i==6)malformed[159]=0x02; // optional
            (bool ok,)=address(registry).staticcall(abi.encodeCall(registry.describedTypeId,(malformed)));require(!ok,"malformed descriptor accepted");
        }
    }
    function test_public_relayer_wrong_signature_zero_custom_fields_and_opaque_boundary() public {
        bytes memory d=textDescriptor(bytes32("public"));bytes32 t=registry.describedTypeId(d);bytes memory sig=declaration(registry,d);
        (bool ok,)=address(registry).call(abi.encodeCall(registry.registerDescribed,(d,signature(PK_B,registry.declarationDigest(t)),address(0),address(0),bytes(""))));
        require(!ok,"wrong namespace signature accepted");
        (ok,)=address(registry).call(abi.encodeCall(registry.registerDescribed,(d,sig,address(0),address(ledger),bytes(""))));require(!ok,"hidden portable allowedLedger");
        uint64 before=registry.catalogRevision();probe.prank(eoaB);registry.registerDescribed(d,sig,address(0),address(0),"");
        probe.prank(eoaB);registry.registerDescribed(d,sig,address(0),address(0),"");
        require(registry.catalogRevision()==before+1,"duplicate advanced catalog");
        probe.prank(eoaA);(ok,)=address(registry).call(abi.encodeCall(registry.activate,(t,address(0))));require(!ok,"declarer became policy admin");
        bytes memory opaque=textDescriptor(bytes32("opaque"));bytes32 shape=keccak256(abi.encode(keccak256("efs.lab.described-shape/1"),opaque));
        bytes32 opaqueId=registry.register(shape,registry.describedRule(),new bytes32[](0));
        (ok,)=address(registry).call(abi.encodeCall(registry.retainDeclaration,(opaque,declaration(registry,opaque))));
        require(!ok&&registry.descriptorBytes(opaqueId).length==0,"opaque retroactively interpreted");
    }
    function test_portable_destination_unchanged_declaration_and_custom_retention_only() public {
        bytes memory d=textDescriptor(bytes32("portable"));bytes32 t=install(d);TypeRegistry destination=new TypeRegistry();
        require(destination.registerDescribed(d,declaration(registry,d),address(0),address(0),"")==t,"portable declaration destination-bound");
        require(destination.describedRule()!=registry.describedRule()&&destination.describedRule().codehash==registry.describedRule().codehash,"runtime sharing wrong");
        DescribedPredicateFixture custom=new DescribedPredicateFixture(registry.describedRule().codehash,address(ledger));d=customDescriptor(custom);t=customInstall(custom,d);
        destination.retainDeclaration(d,declaration(registry,d));
        require(keccak256(destination.descriptorBytes(t))==keccak256(d),"custom meaning unavailable without local bind");
        (bool registered,,,,,,)=destination.typeInfo(t);require(!registered,"retention granted admission");
        (bool ok,)=address(destination).call(abi.encodeCall(destination.registerDescribed,(d,declaration(registry,d),address(custom),address(ledger),signature(PK_A,keccak256(registry.bindingPreimage(d,address(custom),address(ledger)))))));
        require(!ok,"source context authorized destination");
    }
    function test_unknown_future_leaf_refuses_before_callback_registration() public {
        bytes memory d=textDescriptor(bytes32("future"));bytes32 future=registry.describedTypeId(d);
        CallbackRegistrationIndex callback=new CallbackRegistrationIndex(registry,d,declaration(registry,d));ledger.setIndexModule(address(callback));
        Ledger.Action[] memory actions=two(aPublish(BINARY,hex"01"),aPublish(future,hex"00026869"));bytes[] memory bodies=new bytes[](2);bodies[0]=hex"01";bodies[1]=hex"00026869";
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.execute,(actions,bodies,ledger.nonces(address(this)))));
        require(!ok&&!callback.called(),"future registration callback reached");
        (bool registered,,,,,,)=registry.typeInfo(future);require(!registered,"future type installed during publication");
    }
    function test_final_failure_rolls_back_described_records_and_nonce() public {
        bytes32 t=install(textDescriptor(bytes32("rollback")));ledger.setIndexModule(address(new DescribedFinalFailure()));
        refuses(t,hex"00026869");(,uint64 first,,)=ledger.record(Keys.record(t,hex"00026869"));require(first==0,"final hook leaked record");
    }
    function field(uint256 id,uint8 kind,uint8 optional,uint16 width,uint256 lower,uint256 upper,bytes32 ref) internal pure returns(bytes memory){
        return abi.encodePacked(bytes32(id),bytes32(id+100),kind,optional,width,lower,upper,ref);
    }
    function schema(bytes32 ns,bytes32 customHash,uint8 count,bytes memory description,bytes memory fields) internal view returns(bytes memory){
        return abi.encodePacked(uint8(1),uint8(1),uint8(customHash==0?0:1),count,eoaA,ns,customHash,uint16(description.length),description,fields);
    }
    function test_all_kinds_optional_presence_and_checked_reference_projection() public {
        bytes memory fields=bytes.concat(field(1,1,0,32,0,0,BINARY),field(2,2,0,32,0,0,0),field(3,3,0,2,10,1000,0),field(4,4,0,1,0,1,0),
            field(5,5,0,1,1,2,0),field(6,6,0,0,0,4,0),field(7,7,0,0,1,1024,0),field(8,8,1,0,1,64,0));
        bytes32 t=install(schema(bytes32("all-kinds"),0,8,bytes("Reference, digest, range, bool, enum, bytes, text, optional title."),fields));
        bytes32 ref=ledger.publish(BINARY,hex"aabb");
        bytes memory valid=abi.encodePacked(ref,bytes32(uint256(99)),hex"000a01020002beef0002686900");
        ledger.publish(t,valid);
        for(uint256 i;i<6;i++){
            bytes memory bad=bytes.concat(valid);
            if(i==0)bad[65]=0x09;
            if(i==1)bad[66]=0x02;
            if(i==2)bad[67]=0x03;
            if(i==3)bad[69]=0x05;
            if(i==4)bad[76]=0x02;
            if(i==5)bad[76]=0x01;
            refuses(t,bad);
        }
        bytes memory present=abi.encodePacked(ref,bytes32(uint256(99)),hex"000a01020002beef0002686901000141");ledger.publish(t,present);
        present[present.length-1]=0x0a;refuses(t,present);
        bytes32 wrong=ledger.publish(ITEM,hex"aabb");bytes memory wrongRef=bytes.concat(valid);assembly("memory-safe"){mstore(add(wrongRef,32),wrong)}refuses(t,wrongRef);
        bytes memory optionalRef=schema(bytes32("optional-ref"),0,1,bytes("Unsupported nullable reference"),field(1,1,1,32,0,0,BINARY));
        (bool ok,)=address(registry).staticcall(abi.encodeCall(registry.describedTypeId,(optionalRef)));require(!ok,"optional reference descriptor allowed");
        bytes memory duplicate=schema(bytes32("duplicate"),0,2,bytes("Duplicate IDs"),bytes.concat(field(1,4,0,1,0,1,0),field(1,4,0,1,0,1,0)));
        (ok,)=address(registry).staticcall(abi.encodeCall(registry.describedTypeId,(duplicate)));require(!ok,"duplicate field IDs accepted");
        bytes memory lateRef=schema(bytes32("late-ref"),0,2,bytes("Reference after scalar"),bytes.concat(field(1,4,0,1,0,1,0),field(2,1,0,32,0,0,BINARY)));
        (ok,)=address(registry).staticcall(abi.encodeCall(registry.describedTypeId,(lateRef)));require(!ok,"nonleading reference accepted");
    }
    function test_ordered_prefix_custom_reads_and_whole_batch_rollback() public {
        DescribedPredicateFixture custom=new DescribedPredicateFixture(registry.describedRule().codehash,address(ledger));custom.setMode(5);
        bytes memory d=schema(bytes32("prefix-custom"),address(custom).codehash,2,bytes("Read prefix Record; reject text ending exclamation."),bytes.concat(field(1,1,0,32,0,0,BINARY),field(2,7,0,0,1,1024,0)));
        bytes32 t=customInstall(custom,d);bytes memory first=hex"beef";bytes32 ref=Keys.record(BINARY,first);
        bytes memory good=abi.encodePacked(ref,hex"00026869");bytes[] memory bodies=new bytes[](2);bodies[0]=first;bodies[1]=good;
        Ledger.Action[] memory actions=two(aPublish(BINARY,first),aPublish(t,good));
        ledger.execute(actions,bodies,ledger.nonces(address(this)));
        (,uint64 at,,)=ledger.record(Keys.record(t,good));require(at==2,"custom failed to see ordered prefix");
        first=hex"babe";ref=Keys.record(BINARY,first);bytes memory bad=abi.encodePacked(ref,hex"00026821");bodies[0]=first;bodies[1]=bad;actions=two(aPublish(BINARY,first),aPublish(t,bad));
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.execute,(actions,bodies,ledger.nonces(address(this)))));require(!ok,"custom semantic refusal bypassed");
        (,at,,)=ledger.record(ref);require(at==0,"failed custom leaked prefix");
        bodies[1]=abi.encodePacked(ref,hex"00036869");actions[1]=aPublish(t,bodies[1]);
        (ok,)=address(ledger).call(abi.encodeCall(ledger.execute,(actions,bodies,ledger.nonces(address(this)))));require(!ok,"malformed prefix child accepted");
        (,at,,)=ledger.record(ref);require(at==0,"failed structure leaked prefix");
    }
    function test_note_maxima_and_max_descriptor_field_reference_body_bytes_combination() public {
        bytes memory fields=bytes.concat(field(1,7,0,0,1,1024,0),field(2,8,1,0,1,64,0));
        bytes32 t=install(schema(bytes32("note-max"),0,2,bytes("Note: text1..1024 ASCII or LF; optional title1..64 printable ASCII."),fields));
        bytes memory text=new bytes(1024);bytes memory title=new bytes(64);for(uint256 i;i<1024;i++)text[i]=0x61;for(uint256 i;i<64;i++)title[i]=0x62;
        bytes memory body=abi.encodePacked(uint16(1024),text,hex"01",uint16(64),title);ledger.publish(t,body);
        body[1025]=0x0a;ledger.publish(t,body);body[body.length-1]=0x0a;refuses(t,body);
        fields="";bytes32 ref=ledger.publish(BINARY,hex"01");body="";
        for(uint256 i;i<8;i++){fields=bytes.concat(fields,field(i+1,1,0,32,0,0,BINARY));body=bytes.concat(body,abi.encodePacked(ref));}
        for(uint256 i;i<7;i++){fields=bytes.concat(fields,field(i+9,3,0,1,0,255,0));body=bytes.concat(body,hex"01");}
        fields=bytes.concat(fields,field(16,6,0,0,0,8192,0));
        bytes memory description=new bytes(1382);for(uint256 i;i<1382;i++)description[i]=0x64;
        bytes memory d=schema(bytes32("joint-max-bytes"),0,16,description,fields);require(d.length==4096,"descriptor maximum fixture");
        t=install(d);body=bytes.concat(body,abi.encodePacked(uint16(7927)),new bytes(7927));require(body.length==8192,"body maximum fixture");
        ledger.publish(t,body);
        refuses(t,bytes.concat(body,hex"00"));
    }
    function test_signed_native_duplicate_and_portable_record_identity() public {
        bytes memory d=textDescriptor(bytes32("signed"));bytes32 t=install(d);bytes memory body=hex"00026869";Ledger.Action[] memory actions=one(aPublish(t,body));
        bytes[] memory bodies=new bytes[](1);bodies[0]=body;(Ledger.Intent memory intent,bytes memory sig)=signed(PK_B,ledger,0,actions);
        ledger.executeSigned(intent,actions,bodies,sig);uint64 epoch=registry.epoch();
        (bool duplicateOk,bytes memory duplicateError)=address(ledger).call(abi.encodeCall(ledger.executeSigned,(intent,actions,bodies,sig)));
        require(!duplicateOk&&sel(duplicateError)==Ledger.AlreadyAdmitted.selector,"exact retry must report existing publication");
        ledger.publish(t,body);(,uint64 at,uint32 occurrences,)=ledger.record(Keys.record(t,body));require(at==1&&occurrences==2,"signed/native dedup wrong");
        require(registry.epoch()==epoch,"admission changed policy");
        TypeRegistry r=new TypeRegistry();r.registerDescribed(d,declaration(registry,d),address(0),address(0),"");Ledger other=new Ledger(r,bytes32("another"));
        require(other.publish(t,body)==Keys.record(t,body),"portable record identity changed");
    }
    function test_retained_declaration_before_opaque_registration_does_not_install_interpretation() public {
        bytes memory d=textDescriptor(bytes32("retained-then-opaque"));bytes32 t=registry.retainDeclaration(d,declaration(registry,d));
        bytes32 shape=keccak256(abi.encode(keccak256("efs.lab.described-shape/1"),d));
        require(registry.register(shape,registry.describedRule(),new bytes32[](0))==t,"fixture ID mismatch");
        refuses(t,hex"00026869");
    }
    function test_zero_field_unit_type_requires_exact_empty_body() public {
        bytes32 t=install(schema(bytes32("unit"),0,0,bytes("Unit marker, no fields."),""));
        ledger.publish(t,hex"");refuses(t,hex"00");
    }
    function test_custom_another_realm_requires_its_own_binding_but_preserves_portable_identity() public {
        DescribedPredicateFixture source=new DescribedPredicateFixture(registry.describedRule().codehash,address(ledger));
        bytes memory d=customDescriptor(source);bytes32 t=customInstall(source,d);bytes memory body=hex"00026869";bytes32 sourceId=ledger.publish(t,body);
        TypeRegistry destination=new TypeRegistry();Ledger other=new Ledger(destination,bytes32("custom-destination"));
        DescribedPredicateFixture local=new DescribedPredicateFixture(destination.describedRule().codehash,address(other));
        require(address(local).codehash==address(source).codehash,"custom runtime portability fixture");
        bytes memory original=declaration(registry,d);bytes memory sourceAuth=signature(PK_A,keccak256(registry.bindingPreimage(d,address(source),address(ledger))));
        (bool ok,)=address(destination).call(abi.encodeCall(destination.registerDescribed,(d,original,address(local),address(other),sourceAuth)));
        require(!ok,"source binding authorized different destination context");
        bytes memory localAuth=signature(PK_A,keccak256(destination.bindingPreimage(d,address(local),address(other))));
        require(destination.registerDescribed(d,original,address(local),address(other),localAuth)==t,"custom Type changed across realms");
        require(other.publish(t,body)==sourceId,"custom Record identity changed");
        require(registry.describedInfo(t).bindingId!=destination.describedInfo(t).bindingId,"local binding identity was portable");
    }
    function test_wrong_local_authority_chain_and_custom_code_refuse_atomically() public {
        DescribedPredicateFixture custom=new DescribedPredicateFixture(registry.describedRule().codehash,address(ledger));bytes memory d=customDescriptor(custom);
        bytes memory decl=declaration(registry,d);bytes32 digest=keccak256(registry.bindingPreimage(d,address(custom),address(ledger)));
        (bool ok,)=address(registry).call(abi.encodeCall(registry.registerDescribed,(d,decl,address(custom),address(ledger),signature(PK_B,digest))));require(!ok,"wrong local authority");
        uint256 oldChain=block.chainid;probe.chainId(oldChain+1);
        (ok,)=address(registry).call(abi.encodeCall(registry.registerDescribed,(d,decl,address(custom),address(ledger),signature(PK_A,digest))));require(!ok,"local authorization replayed across chain");probe.chainId(oldChain);
        (ok,)=address(registry).call(abi.encodeCall(registry.registerDescribed,(d,decl,registry.describedRule(),address(ledger),signature(PK_A,digest))));require(!ok,"wrong custom runtime installed");
        require(registry.describedStatus(registry.describedTypeId(d))==0,"failed installation left retained state");customInstall(custom,d);
    }
    function test_descriptor_code_and_bounded_registry_return_are_rechecked() public {
        bytes32 t=install(textDescriptor(bytes32("tamper")));IDescribedRegistry.Info memory info=registry.describedInfo(t);
        bytes memory code=info.blob.code;bytes memory bad=bytes.concat(code);bad[bad.length-1]=0x01;probe.etch(info.blob,bad);refuses(t,hex"00026869");probe.etch(info.blob,code);
        bad=bytes.concat(code);bad[0]=0x01;probe.etch(info.blob,bad);refuses(t,hex"00026869");probe.etch(info.blob,code);
        probe.mockCall(address(registry),abi.encodeCall(registry.describedInfo,(t)),new bytes(65536));
        probe.prank(address(ledger));(bool ok,bytes memory result)=info.mandatory.call{gas:300_000}(abi.encodeCall(IAcceptor.accept,(t,hex"00026869",new bytes32[](0))));
        require(!ok&&sel(result)==DescribedTypeRule.E_CONTEXT.selector,"oversized registry return was copied/accepted");probe.clearMockedCalls();
        probe.etch(info.mandatory,hex"00");refuses(t,hex"00026869");
    }
}
