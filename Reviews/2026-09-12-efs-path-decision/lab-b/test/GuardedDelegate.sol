// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Ledger} from "../src/Ledger.sol";

/// Disposable Prague fixture only. No wallet installation UI or arbitrary call
/// executor. The real authorization-list control is in guarded-integration.test.mjs.
contract GuardedDelegate {
    error E_SELF_ONLY();
    function run(Ledger ledger, Ledger.Action[] calldata actions, bytes[] calldata bodies,
        uint64 nonce, bytes32 execution, Ledger.ReadSetV2 calldata reads) external
    {
        if (msg.sender != address(this)) revert E_SELF_ONLY();
        ledger.executeGuarded(actions,bodies,nonce,execution,reads);
    }
    receive() external payable { if (msg.sender != address(this)) revert E_SELF_ONLY(); }
}
