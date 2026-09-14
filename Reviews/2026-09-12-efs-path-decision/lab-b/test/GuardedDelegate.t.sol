// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {GuardedDelegate} from "./GuardedDelegate.sol";

contract GuardedDelegateTest {
    function testNonSelfCallerCannotPublishThroughDelegate() public {
        TypeRegistry registry = new TypeRegistry();
        Ledger ledger = new Ledger(registry,keccak256("delegate-fixture"));
        GuardedDelegate delegated = new GuardedDelegate();
        Ledger.Action[] memory actions = new Ledger.Action[](1);
        actions[0].kind = 5; actions[0].salt = keccak256("unauthorized");
        bytes[] memory bodies = new bytes[](1);
        Ledger.ReadSetV2 memory reads;
        (bool ok,bytes memory reason) = address(delegated).call(abi.encodeCall(delegated.run,
            (ledger,actions,bodies,uint64(0),ledger.executionSet(),reads)));
        require(!ok,"outsider published through delegated execution");
        require(bytes4(reason) == GuardedDelegate.E_SELF_ONLY.selector,"self-call authorization boundary");
        (uint64 admissions,,,) = ledger.counts();
        require(admissions == 0 && ledger.nonces(address(delegated)) == 0,"unauthorized effects");
    }
}
