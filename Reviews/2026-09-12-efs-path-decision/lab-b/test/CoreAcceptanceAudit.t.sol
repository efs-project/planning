// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {IAcceptor} from "../src/Interfaces.sol";
import {Keys} from "../src/Keys.sol";

/// An ordinary read-only rule using the mandatory, coverage-qualified index.
/// Intention: only one occurrence of this Type is allowed in the Realm.
contract AuditSingletonRule is IAcceptor {
    IndexModule public immutable index;
    constructor(IndexModule index_) { index = index_; }
    function accept(bytes32 typeId, bytes calldata, bytes32[] calldata) external view returns (bool) {
        (uint8 coverage, uint64 from,) = index.coverage(index.FAMILY_BY_TYPE(), bytes32(0));
        (uint64 count,,,) = index.postingHead(Keys.byTypeList(typeId));
        return coverage == index.COMPLETE() && from == 1 && count == 0;
    }
}

/// The successful negative reproduction is retained at historical commit 09e022f.
/// Regression: the second singleton must see the indexed ordered prefix and refuse.
contract CoreAcceptanceAuditTest is LabBase {
    event log_named_uint(string key, uint256 value);
    function test_indexed_rule_observes_ordered_prefix_and_rolls_back() public {
        AuditSingletonRule rule = new AuditSingletonRule(index);
        bytes32 t = registry.register(keccak256("audit/singleton/batch"), address(rule), new bytes32[](0));
        Ledger.Action[] memory actions = new Ledger.Action[](2);
        bytes[] memory bodies = new bytes[](2);
        bodies[0] = abi.encode(uint256(1)); bodies[1] = abi.encode(uint256(2));
        actions[0] = aPublish(t, bodies[0]); actions[1] = aPublish(t, bodies[1]);
        bytes32 publicationId = keccak256(abi.encode(address(this), uint64(0), keccak256(abi.encode(actions))));
        (bool ok, bytes memory err) = address(ledger).call(abi.encodeCall(ledger.execute, (actions, bodies, uint64(0))));
        require(!ok, "second singleton accepted");
        require(keccak256(err) == keccak256(abi.encodeWithSelector(Ledger.E_REJECTED.selector, uint256(1), t)), "wrong leaf/type refusal");
        (uint64 count,,,) = index.postingHead(Keys.byTypeList(t));
        require(count == 0 && index.postingWord(Keys.byTypeList(t), 0) == 0, "index leaked");
        require(ledger.extsload(bytes32(uint256(1))) == 0 && index.lastProcessed() == 0, "counts leaked");
        require(ledger.nonces(address(this)) == 0 && ledger.publicationOf(publicationId) == 0, "nonce/key leaked");
        require(ledger.publicationContext(1).principalId == 0, "evidence leaked");
        (uint8 coverage,,) = index.coverage(index.FAMILY_BY_TYPE(), bytes32(0));
        require(coverage == index.COMPLETE(), "not a complete index fixture");
        (, uint64 first,,) = ledger.record(rid(t, bodies[0]));
        (, uint64 second,,) = ledger.record(rid(t, bodies[1]));
        require(first == 0 && second == 0 && ledger.body(rid(t, bodies[0])).length == 0, "records leaked");
    }

    function test_audit_singleton_separate_publication_negative_control() public {
        AuditSingletonRule rule = new AuditSingletonRule(index);
        bytes32 t = registry.register(keccak256("audit/singleton/separate"), address(rule), new bytes32[](0));
        ledger.publish(t, abi.encode(uint256(1)));
        uint64 beforeCount = admissions();
        (bool ok,) = address(ledger).call(abi.encodeCall(ledger.publish, (t, abi.encode(uint256(2)))));
        require(!ok && admissions() == beforeCount, "separate-publication rule control did not reject atomically");
        (uint64 count,,,) = index.postingHead(Keys.byTypeList(t));
        require(count == 1, "control index count wrong");
    }

    function test_ordered_singleton_rejection_across_native_signed_and_guarded_ingress() public {
        AuditSingletonRule rule = new AuditSingletonRule(index);
        bytes32 t = registry.register(keccak256("audit/singleton/all-ingress"), address(rule), new bytes32[](0));
        Ledger.Action[] memory actions = two(aPublish(t,q(1)),aPublish(t,q(2)));
        bytes[] memory bodies = new bytes[](2); bodies[0]=q(1);bodies[1]=q(2);
        Ledger.ReadSetV2 memory empty;
        for(uint256 path;path<4;path++) {
            bytes memory input;
            if(path==0)input=abi.encodeCall(ledger.execute,(actions,bodies,uint64(0)));
            if(path==1){
                (Ledger.Intent memory intent,bytes memory sig)=signed(PK_A,ledger,0,actions);
                input=abi.encodeCall(ledger.executeSigned,(intent,actions,bodies,sig));
            }
            if(path==2)input=abi.encodeCall(ledger.executeGuarded,(actions,bodies,uint64(0),ledger.executionSet(),empty));
            if(path==3){
                Ledger.IntentV2 memory intent=Ledger.IntentV2(REALM,ledger.realmOrigin(),ledger.executionSet(),eoaA,0,uint64(block.timestamp+3600),
                    ledger.acceptanceProfileOf(actions),ledger.indexObligations(),ledger.readSetHash(empty));
                (uint8 v,bytes32 r,bytes32 s)=vm.sign(PK_A,ledger.guardedIntentDigest(intent,keccak256(abi.encode(actions))));
                input=abi.encodeCall(ledger.executeGuardedSigned,(intent,actions,bodies,empty,abi.encodePacked(r,s,v)));
            }
            (bool ok,bytes memory err)=address(ledger).call(input);
            require(!ok && keccak256(err)==keccak256(abi.encodeWithSelector(Ledger.E_REJECTED.selector,uint256(1),t)),"ingress bypassed ordered acceptance");
            require(admissions()==0 && ledger.nonces(eoaA)==0 && ledger.nonces(address(this))==0 && index.lastProcessed()==0,"ingress partial commit");
        }
        ledger.publish(t,q(1));require(admissions()==1,"lock retained after ingress refusals");
    }
}
