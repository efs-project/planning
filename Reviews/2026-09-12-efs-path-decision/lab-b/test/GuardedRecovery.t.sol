// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {SignedClaimArchiveBase,SignedClaimArchiveCodeBlob} from "../src/SignedClaimArchive.sol";
import {GuardedRecovery,RecoveryStatementRule} from "../src/GuardedRecovery.sol";
import {FailingIndexModule} from "../src/LabHarness.sol";

/// These tests catch loss of original EOA authority and replayed effects. Inputs
/// are independently signed against actual Ledger digests, not helper encoders.
contract GuardedRecoveryTest is LabBase {
    SignedClaimArchiveCodeBlob archive;
    GuardedRecovery recovery;
    bytes32 statementType;
    function setUp() public override {
        super.setUp();
        archive=new SignedClaimArchiveCodeBlob();
        statementType=registry.register(keccak256("lab/type/recovery-statement/1"),address(new RecoveryStatementRule()),new bytes32[](0));
        recovery=new GuardedRecovery(ledger,archive,statementType);
    }
    function reads() internal pure returns(Ledger.ReadSetV2 memory r) {
        r=Ledger.ReadSetV2(new bytes32[](0),new bytes32[](0),new bytes32[](0));
    }
    function intent(uint256 pk,uint64 nonce,Ledger.Action[] memory a) internal view returns(Ledger.IntentV2 memory) {
        return Ledger.IntentV2(ledger.realmId(),ledger.realmOrigin(),ledger.executionSet(),vm.addr(pk),nonce,
            uint64(block.timestamp+3600),ledger.acceptanceProfileOf(a),ledger.indexObligations(),ledger.readSetHash(reads()));
    }
    function sig(uint256 pk,Ledger.IntentV2 memory i,Ledger.Action[] memory a) internal view returns(bytes memory) {
        (uint8 v,bytes32 r,bytes32 s)=vm.sign(pk,ledger.guardedIntentDigest(i,keccak256(abi.encode(a))));
        return abi.encodePacked(r,s,v);
    }
    function retain(uint256 pk,uint64 nonce,Ledger.Action[] memory a) internal returns(bytes32 id,Ledger.IntentV2 memory src) {
        // Source fixture signs context but need not admit: archive proves signature only.
        src=intent(pk,nonce,a);
        Ledger.ExecutionInfo memory ex=Ledger.ExecutionInfo(ledger.realmOrigin(),ledger.executionRevision(),address(ledger).codehash,
            address(ledger),address(ledger).codehash,address(registry),address(registry).codehash,address(index),address(index).codehash,index.generation());
        id=archive.retainGuardedSignedClaim(src,a,reads(),ex,sig(pk,src,a),new SignedClaimArchiveBase.BodyInput[](0));
    }
    function publication(bytes32 id,Ledger.IntentV2 memory src,Ledger.Action[] memory a)
        internal view returns(Ledger.Action[] memory full,bytes[] memory bodies) {
        full=new Ledger.Action[](a.length+1);bodies=new bytes[](a.length+1);
        for(uint256 j;j<a.length;j++)full[j]=a[j];
        bodies[a.length]=abi.encode(keccak256("efs.lab.recovery-lineage/1"),address(archive),address(recovery),id,
            src.realmOrigin,src.executionSet,keccak256(abi.encode(a)));
        full[a.length]=aPublish(statementType,bodies[a.length]);
    }
    function recover(uint256 pk,uint64 nonce,bytes32 id,Ledger.Action[] memory a,bytes[] memory b) internal returns(uint64) {
        Ledger.IntentV2 memory dst=intent(pk,nonce,a);return recovery.recover(id,dst,a,b,reads(),sig(pk,dst,a));
    }
    function test_original_author_recovery_preserves_subject_and_duplicate_has_no_effect() public {
        Ledger.Action[] memory a=one(aCreate(bytes32(uint256(1))));
        (bytes32 id,Ledger.IntentV2 memory src)=retain(PK_A,0,a);
        (Ledger.Action[] memory full,bytes[] memory b)=publication(id,src,a);
        uint64 p=recover(PK_A,0,id,full,b);
        require(ledger.subjectCreatedAt(subjectOf(eoaA,1))==1,"original EOA subject missing");
        require(!ledger.isImported(p)&&ledger.nonces(eoaA)==1,"not a Core import");
        require(ledger.publicationContext(p).principalId==Keys.principal(eoaA),"wrong author");
        require(recover(PK_A,0,id,full,b)==p&&admissions()==2&&ledger.nonces(eoaA)==1,"duplicate effects");
    }
    function test_exact_front_run_reconciles_and_continues_prefix() public {
        Ledger.Action[] memory a=one(aCreate(bytes32(uint256(1))));
        (bytes32 id,Ledger.IntentV2 memory src)=retain(PK_A,0,a);
        (Ledger.Action[] memory full,bytes[] memory b)=publication(id,src,a);
        Ledger.IntentV2 memory dst=intent(PK_A,0,full);
        (uint64 p,)=ledger.executeGuardedSigned(dst,full,b,reads(),sig(PK_A,dst,full));
        require(recover(PK_A,0,id,full,b)==p&&admissions()==2,"front run replayed");
        a=one(aCreate(bytes32(uint256(2))));(id,src)=retain(PK_A,1,a);(full,b)=publication(id,src,a);
        recover(PK_A,1,id,full,b);require(ledger.nonces(eoaA)==2&&admissions()==4,"prefix did not continue");
    }
    function reject(uint256 pk,uint64 nonce,bytes32 id,Ledger.Action[] memory a,bytes[] memory b) internal {
        uint64 beforeCount=admissions();uint64 beforeNonce=ledger.nonces(eoaA);
        Ledger.IntentV2 memory dst=intent(pk,nonce,a);
        (bool ok,)=address(recovery).call(abi.encodeCall(recovery.recover,(id,dst,a,b,reads(),sig(pk,dst,a))));
        require(!ok,"unsafe recovery accepted");require(admissions()==beforeCount&&ledger.nonces(eoaA)==beforeNonce,"failed recovery leaked");
    }
    function test_wrong_author_lineage_prefix_and_withdraw_rejected() public {
        Ledger.Action[] memory a=one(aCreate(bytes32(uint256(1))));
        (bytes32 id,Ledger.IntentV2 memory src)=retain(PK_A,0,a);
        (Ledger.Action[] memory full,bytes[] memory b)=publication(id,src,a);
        reject(PK_B,0,id,full,b);
        full[0].salt=bytes32(uint256(2));reject(PK_A,0,id,full,b);
        (id,src)=retain(PK_A,1,a);(full,b)=publication(id,src,a);reject(PK_A,0,id,full,b);
        a=one(aWithdraw(1));(id,src)=retain(PK_A,0,a);(full,b)=publication(id,src,a);reject(PK_A,0,id,full,b);
    }
    function test_equal_revision_different_target_cannot_start_recovery() public {
        bytes32 target1=ledger.create(bytes32(uint256(1)));bytes32 target2=ledger.create(bytes32(uint256(2)));
        Ledger.Action[] memory a=one(aBind(FOLDER,DRAFTS,name("x"),target1,1));
        // Native unrelated signed-author state with the same expected revision.
        Ledger.Action[] memory conflict=one(aBind(FOLDER,DRAFTS,name("x"),target2,0));
        Ledger.IntentV2 memory dst=intent(PK_A,0,conflict);
        ledger.executeGuardedSigned(dst,conflict,new bytes[](1),reads(),sig(PK_A,dst,conflict));
        (bytes32 id,Ledger.IntentV2 memory src)=retain(PK_A,0,a);(Ledger.Action[] memory full,bytes[] memory b)=publication(id,src,a);
        reject(PK_A,1,id,full,b);
    }
    function test_rejected_policy_rolls_back_helper_core_and_index_then_retry_succeeds() public {
        Ledger.Action[] memory a=one(aPublish(QUOTE,q(9)));
        (bytes32 id,Ledger.IntentV2 memory src)=retain(PK_A,0,a);(Ledger.Action[] memory full,bytes[] memory b)=publication(id,src,a);b[0]=q(9);
        acceptor.set(1,0);reject(PK_A,0,id,full,b);
        require(index.lastProcessed()==0,"index leaked");(bytes32 t,,,)=ledger.record(rid(QUOTE,q(9)));require(t==0,"record leaked");
        acceptor.set(0,0);recover(PK_A,0,id,full,b);require(admissions()==2,"helper progress leaked on rejection");
    }
    function test_linked_duplicate_rejects_inconsistent_readset_preimage() public {
        Ledger.Action[] memory a=one(aCreate(bytes32(uint256(1))));
        (bytes32 id,Ledger.IntentV2 memory src)=retain(PK_A,0,a);(Ledger.Action[] memory full,bytes[] memory b)=publication(id,src,a);
        recover(PK_A,0,id,full,b);Ledger.IntentV2 memory dst=intent(PK_A,0,full);
        Ledger.ReadSetV2 memory bad=reads();bad.principalIds=new bytes32[](1);bad.principalIds[0]=Keys.principal(eoaA);
        (bool ok,)=address(recovery).call(abi.encodeCall(recovery.recover,(id,dst,full,b,bad,sig(PK_A,dst,full))));
        require(!ok,"linked duplicate accepted inconsistent read-set preimage");
    }
    function test_tampered_statement_and_post_front_run_interleaving_rejected() public {
        Ledger.Action[] memory a=one(aCreate(bytes32(uint256(1))));
        (bytes32 id,Ledger.IntentV2 memory src)=retain(PK_A,0,a);(Ledger.Action[] memory full,bytes[] memory b)=publication(id,src,a);
        b[1]=abi.encode(bytes32(uint256(4)));full[1]=aPublish(statementType,b[1]);reject(PK_A,0,id,full,b);
        (full,b)=publication(id,src,a);Ledger.IntentV2 memory dst=intent(PK_A,0,full);
        ledger.executeGuardedSigned(dst,full,b,reads(),sig(PK_A,dst,full));
        Ledger.Action[] memory extra=one(aCreate(bytes32(uint256(99))));dst=intent(PK_A,1,extra);
        ledger.executeGuardedSigned(dst,extra,new bytes[](1),reads(),sig(PK_A,dst,extra));
        reject(PK_A,0,id,full,b);(,,uint64 next,)=recovery.sessions(eoaA);require(next==0,"interleaving advanced helper");
    }
    function test_independent_other_author_interleaving_preserves_prefix() public {
        Ledger.Action[] memory a=one(aCreate(bytes32(uint256(1))));
        (bytes32 id,Ledger.IntentV2 memory src)=retain(PK_A,0,a);(Ledger.Action[] memory full,bytes[] memory b)=publication(id,src,a);
        recover(PK_A,0,id,full,b);ledger.create(bytes32(uint256(55))); // different native author
        a=one(aCreate(bytes32(uint256(2))));(id,src)=retain(PK_A,1,a);(full,b)=publication(id,src,a);
        recover(PK_A,1,id,full,b);require(ledger.nonces(eoaA)==2,"global ordinal incorrectly used for continuity");
    }
    function test_required_index_rejection_rolls_back_progress_publication_and_subject() public {
        Ledger.Action[] memory a=one(aCreate(bytes32(uint256(1))));
        (bytes32 id,Ledger.IntentV2 memory src)=retain(PK_A,0,a);(Ledger.Action[] memory full,bytes[] memory b)=publication(id,src,a);
        ledger.setIndexModule(address(new FailingIndexModule()));
        reject(PK_A,0,id,full,b);(,,uint64 next,)=recovery.sessions(eoaA);(,uint64 linked)=recovery.links(id);
        require(next==0&&linked==0&&ledger.subjectCreatedAt(subjectOf(eoaA,1))==0&&index.lastProcessed()==0,"partial required-index failure");
        Ledger.IntentV2 memory failed=intent(PK_A,0,full);
        require(ledger.publicationOf(ledger.guardedPublicationId(Keys.principal(eoaA),ledger.guardedIntentDigest(failed,keccak256(abi.encode(full)))))==0,"publication retry key leaked");
        ledger.setIndexModule(address(index));recover(PK_A,0,id,full,b);require(admissions()==2,"failed attempt consumed helper progress");
    }
    function changedSource(Ledger.Action[] memory a,bool changeRealm) internal returns(bytes32 id,Ledger.IntentV2 memory src) {
        src=intent(PK_A,1,a);Ledger.ExecutionInfo memory ex=Ledger.ExecutionInfo(ledger.realmOrigin(),ledger.executionRevision(),address(ledger).codehash,
            address(ledger),address(ledger).codehash,address(registry),address(registry).codehash,address(index),address(index).codehash,index.generation());
        if(changeRealm)src.realmId=keccak256("different-realm");
        else {src.realmOrigin=keccak256("different-origin");ex.origin=src.realmOrigin;
            src.executionSet=keccak256(abi.encode(archive.EXECUTION_DOMAIN(),archive.SUPPORTED_LAYOUT(),archive.DOMAIN_SEPARATOR(),archive.GUARDED_DOMAIN_SEPARATOR(),ex));}
        id=archive.retainGuardedSignedClaim(src,a,reads(),ex,sig(PK_A,src,a),new SignedClaimArchiveBase.BodyInput[](0));
    }
    function test_changed_source_realm_and_origin_rejected_mid_prefix() public {
        Ledger.Action[] memory a=one(aCreate(bytes32(uint256(1))));
        (bytes32 id,Ledger.IntentV2 memory src)=retain(PK_A,0,a);(Ledger.Action[] memory full,bytes[] memory b)=publication(id,src,a);
        recover(PK_A,0,id,full,b);a=one(aCreate(bytes32(uint256(2))));
        (id,src)=changedSource(a,true);(full,b)=publication(id,src,a);reject(PK_A,1,id,full,b);
        (id,src)=changedSource(a,false);(full,b)=publication(id,src,a);reject(PK_A,1,id,full,b);
    }
    function test_legacy_signed_claim_rejected() public {
        Ledger.Action[] memory a=one(aCreate(bytes32(uint256(1))));(Ledger.Intent memory legacy,bytes memory signature)=signed(PK_A,ledger,0,a);
        bytes32 id=archive.retainSignedClaim(legacy,a,signature,new SignedClaimArchiveBase.BodyInput[](0));
        Ledger.IntentV2 memory fake=intent(PK_A,0,a);(Ledger.Action[] memory full,bytes[] memory b)=publication(id,fake,a);reject(PK_A,0,id,full,b);
    }
    function test_sixty_four_source_actions_leave_no_room_for_statement() public {
        Ledger.Action[] memory a=new Ledger.Action[](64);for(uint256 j;j<64;j++)a[j]=aCreate(bytes32(j+1));
        (bytes32 id,Ledger.IntentV2 memory src)=retain(PK_A,0,a);(Ledger.Action[] memory full,bytes[] memory b)=publication(id,src,a);
        reject(PK_A,0,id,full,b);require(admissions()==0,"oversized prefix wrote effects");
    }
}
