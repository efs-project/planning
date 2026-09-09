// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {BindingFold} from "./BindingFold.sol";
import {StateBindingReads} from "./StateBindingReads.sol";
import {StateStore} from "./StateStore.sol";

library QueryReadLibrary {
    function getBindingHead(StateStore.Store storage s, bytes32 bindingKey)
        external
        view
        returns (BindingFold.Head memory, bytes32, uint64)
    {
        return StateBindingReads.getBindingHead(s, bindingKey);
    }

    function getBindingAtBasis(StateStore.Store storage s, bytes32 bindingKey, uint64 basisOrdinal)
        external
        view
        returns (BindingFold.Head memory, bytes32, uint64)
    {
        return StateBindingReads.getBindingAtBasis(s, bindingKey, basisOrdinal);
    }

    function readHistory(StateStore.Store storage s, bytes32 bindingKey, uint32 fromRevision, uint16 limit)
        external
        view
        returns (StateBindingReads.BindingHistoryEntry[] memory, uint32, uint8)
    {
        return StateBindingReads.readHistory(s, bindingKey, fromRevision, limit);
    }
}
