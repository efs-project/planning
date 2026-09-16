// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {FilesPageReaderTest} from "./FilesPageReader.t.sol";
import {FilesPageReader} from "./FilesPageReader.sol";
import {FilesQueryAccumulator} from "./FilesQueryAccumulator.sol";
import {Ledger} from "../src/Ledger.sol";

/// Actual pending signature and consumer-owned query prefix, not only an epoch
/// comparison. Reverting the registration initialization to ++epoch breaks both.
contract DescribedTypeParticipationTest is FilesPageReaderTest {
    function test_registration_preserves_pending_signed_bytes_and_owned_query_policy_change_invalidates() public {
        FilesPageReader r=reader();bytes32 folder=_directory(4101);file(folder,"a",4102);file(folder,"b",4103);
        FilesPageReader.Query memory q;FilesQueryAccumulator acc=new FilesQueryAccumulator(r,folder,selectors(),q,basis(),bytes32("registration"));
        acc.step(bytes32("registration"),1);require(!acc.complete()&&acc.started(),"pending prefix fixture");bytes32 pin=acc.inventoryPin();
        Ledger.Action[] memory actions=one(aPublish(BINARY,hex"cafe"));bytes[] memory bodies=new bytes[](1);bodies[0]=hex"cafe";
        (Ledger.Intent memory intent,bytes memory sig)=signed(PK_A,ledger,0,actions);bytes32 pendingHash=keccak256(abi.encode(intent,actions,bodies,sig));
        bytes memory d=abi.encodePacked(hex"01010001",eoaB,bytes32("independent-type"),bytes32(0),uint16(4),bytes("Bool"),bytes32(uint256(1)),bytes32(uint256(101)),hex"04000001",uint256(0),uint256(1),bytes32(0));
        bytes32 t=registry.describedTypeId(d);(uint8 v,bytes32 rr,bytes32 s)=vm.sign(PK_B,registry.declarationDigest(t));
        registry.registerDescribed(d,abi.encodePacked(rr,s,v),address(0),address(0),"");
        require(pendingHash==keccak256(abi.encode(intent,actions,bodies,sig)),"pending bytes altered");ledger.executeSigned(intent,actions,bodies,sig);
        acc.step(bytes32("registration"),8);require(acc.complete()&&acc.rowCount()==2&&acc.scanned()==2&&acc.inventoryPin()==pin,"registration invalidated owned continuation");
        FilesQueryAccumulator stale=new FilesQueryAccumulator(r,folder,selectors(),q,basis(),bytes32("policy"));stale.step(bytes32("policy"),1);
        (intent,sig)=signed(PK_A,ledger,1,actions);registry.activate(BINARY,address(0));
        (bool ok,)=address(ledger).call(abi.encodeCall(ledger.executeSigned,(intent,actions,bodies,sig)));require(!ok,"real policy change left signature valid");
        (ok,)=address(stale).call(abi.encodeCall(stale.step,(bytes32("policy"),8)));require(!ok,"real policy change left query valid");
    }
}
