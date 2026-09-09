// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {BindingFold} from "./BindingFold.sol";
import {StateBindingReads} from "./StateBindingReads.sol";
import {StateStore} from "./StateStore.sol";
import {StateAuditPages} from "./StateAuditPages.sol";

library QueryReadLibrary {
    function pagePostings(
        StateStore.Store storage s,
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        StateAuditPages.PageRequest memory req
    ) external view returns (StateAuditPages.PageResult memory) {
        return StateAuditPages.pagePostings(s, T, kind, indexOrdinal, valueKey, req);
    }

    function pagePostingsHydrated(
        StateStore.Store storage s,
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        StateAuditPages.PageRequest memory req
    ) external view returns (StateAuditPages.PageResult memory, StateAuditPages.HydratedItem[] memory) {
        return StateAuditPages.pagePostingsHydrated(s, T, kind, indexOrdinal, valueKey, req);
    }

    function counts(StateStore.Store storage s, bytes32 T, uint8 kind, uint8 indexOrdinal, bytes32 valueKey)
        external
        view
        returns (uint64, uint64, uint64, bytes32, uint64)
    {
        return StateAuditPages.counts(s, T, kind, indexOrdinal, valueKey);
    }

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
