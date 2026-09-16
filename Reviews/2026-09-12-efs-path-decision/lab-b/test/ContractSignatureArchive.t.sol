// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Guarded1271Harness,WalletIngress} from "./Guarded1271.t.sol";
import {Ledger} from "../src/Ledger.sol";
import {ContractSignatureWallet} from "./ContractSignatureWallet.sol";
import {ContractSignatureEvidenceArchive as Archive} from "../src/ContractSignatureEvidenceArchive.sol";

contract ContractSignatureArchiveTest is Guarded1271Harness {
    // Break caught: the source's acceptance cannot be copied after wallet state
    // changes, or retained opaque bytes lose exact context in the copy.
    function test_archive_local_acceptance_survives_wallet_rotation() public {
        (ContractSignatureWallet wallet,Archive archive,Archive.Bundle memory b)=_packet();
        wallet.rotate(eoaB);
        (bool ok,bytes memory raw)=address(archive).call(abi.encodeCall(archive.retain,(b,true)));
        require(ok,"historical ERC1271 retention missing");
        bytes32 id=abi.decode(raw,(bytes32));(uint8 grade,,,,,)=archive.receipts(id);
        require(grade==2,"not locally anchored");
        require(keccak256(abi.encode(archive.bundle(id)))==keccak256(abi.encode(b)),"not exact bundle");
    }
    function _packet() private returns(ContractSignatureWallet wallet,Archive archive,Archive.Bundle memory b){
        wallet=new ContractSignatureWallet(address(ledger));
        Ledger.Action[] memory a=one(aCreate(bytes32("retained")));Ledger.ReadSetV2 memory rs;
        Ledger.IntentV2 memory intent=_intent(ledger,address(wallet),a,rs);
        bytes memory sig=hex"deadbeef123456";
        wallet.approve(ledger.guardedIntentDigest(intent,keccak256(abi.encode(a))),sig);
        WalletIngress(address(ledger)).executeGuarded1271(intent,a,new bytes[](1),rs,sig);
        (,,,,uint64 first,bytes32 h,bytes32 ptr,,,uint64 basis,,,)=ledger.evidence(1);
        b=Archive.Bundle(Archive.Context(block.chainid,address(ledger),1,first,basis,intent,
            ledger.executionInfo(intent.executionSet),address(uint160(uint256(ptr))),address(wallet).codehash,h),abi.encode(a),abi.encode(rs),sig);
        archive=new Archive(ledger);
    }
    function test_archive_unverified_grade_cannot_be_promoted_by_altered_context() public {
        (,Archive archive,Archive.Bundle memory b)=_packet();
        bytes32 id=archive.retain(b,false);(uint8 grade,,,,,)=archive.receipts(id);require(grade==1,"unverified source promoted");
        for(uint256 i;i<7;i++){
            Archive.Bundle memory changed=archive.bundle(id);
            if(i==0)changed.signature=hex"00";
            if(i==1)changed.context.ledger=eoaB;
            if(i==2)changed.context.execution.implementation=eoaB;
            if(i==3)changed.context.store=eoaB;
            if(i==4)changed.context.firstAdmission=999;
            if(i==5)changed.context.basis=999;
            if(i==6)changed.context.walletCodehash=bytes32("forged");
            (bool ok,)=address(archive).call(abi.encodeCall(archive.retain,(changed,true)));require(!ok,"tampered acceptance promoted");
        }
        archive.retain(b,true);(grade,,,,,)=archive.receipts(id);require(grade==2,"exact local promotion");
        archive.retain(b,false);(grade,,,,,)=archive.receipts(id);require(grade==2,"downgraded receipt");
    }
    function test_archive_local_pin_refuses_different_source_and_changed_implementation_code() public {
        (,Archive archive,Archive.Bundle memory b)=_packet();
        Ledger other=new Ledger(registry,REALM);Archive counterfeitSelection=new Archive(other);
        (bool ok,)=address(counterfeitSelection).call(abi.encodeCall(archive.retain,(b,true)));require(!ok,"different local source");
        svm.etch(address(ledger),hex"00");
        (ok,)=address(archive).call(abi.encodeCall(archive.retain,(b,true)));require(!ok,"changed pinned code accepted");
        bytes32 id=archive.retain(b,false);require(keccak256(archive.bundle(id).signature)==keccak256(b.signature),"unverified offline bytes unavailable");
    }
}
