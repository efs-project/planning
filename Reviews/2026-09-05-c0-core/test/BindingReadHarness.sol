// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {BindingFold} from "../src/BindingFold.sol";
import {StateBindingReads} from "../src/StateBindingReads.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {OccurrenceReadHarness} from "./OccurrenceReadHarness.sol";

contract BindingReadHarness is OccurrenceReadHarness {
    constructor(StateKernel.Init memory init, address helper, bytes32 helperHash, bytes32 libraryHash)
        OccurrenceReadHarness(init, helper, helperHash, libraryHash)
    {}

    function getBindingHead(bytes32 bindingKey) external view returns (BindingFold.Head memory, bytes32, uint64) {
        return StateBindingReads.getBindingHead(s, bindingKey);
    }

    function getBindingAtBasis(bytes32 bindingKey, uint64 basisOrdinal)
        external
        view
        returns (BindingFold.Head memory, bytes32, uint64)
    {
        return StateBindingReads.getBindingAtBasis(s, bindingKey, basisOrdinal);
    }

    function readHistory(bytes32 bindingKey, uint32 fromRevision, uint16 limit)
        external
        view
        returns (StateBindingReads.BindingHistoryEntry[] memory, uint32, uint8)
    {
        return StateBindingReads.readHistory(s, bindingKey, fromRevision, limit);
    }
}
