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

/// Successful tests reproduce an OPEN limitation, not a repaired invariant.
contract CoreAcceptanceAuditTest is LabBase {
    event log_named_uint(string key, uint256 value);
    function test_audit_indexed_rule_observes_committed_not_ordered_prefix() public {
        AuditSingletonRule rule = new AuditSingletonRule(index);
        bytes32 t = registry.register(keccak256("audit/singleton/batch"), address(rule), new bytes32[](0));
        Ledger.Action[] memory actions = new Ledger.Action[](2);
        bytes[] memory bodies = new bytes[](2);
        bodies[0] = abi.encode(uint256(1)); bodies[1] = abi.encode(uint256(2));
        actions[0] = aPublish(t, bodies[0]); actions[1] = aPublish(t, bodies[1]);
        ledger.execute(actions, bodies, ledger.nonces(address(this)));
        (uint64 count,,,) = index.postingHead(Keys.byTypeList(t));
        require(count == 2, "hypothesis disproved: second leaf was not accepted");
        emit log_named_uint("occurrences accepted despite singleton rule", count);
        (uint8 coverage,,) = index.coverage(index.FAMILY_BY_TYPE(), bytes32(0));
        require(coverage == index.COMPLETE(), "not a complete index fixture");
        (, uint64 first,,) = ledger.record(rid(t, bodies[0]));
        (, uint64 second,,) = ledger.record(rid(t, bodies[1]));
        require(first != 0 && second == first + 1, "missing accepted records");
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
}
