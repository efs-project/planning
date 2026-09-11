// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StorageByteView} from "C0Core/StorageByteView.sol";
import {BindingFold} from "C0Core/BindingFold.sol";
import {StateBindingReads} from "C0Core/StateBindingReads.sol";
import {StateStore} from "C0Core/StateStore.sol";
import {StateAuditPages} from "C0Core/StateAuditPages.sol";
import {LensPlan} from "C0Core/LensPlan.sol";
import {StateLensReads} from "C0Core/StateLensReads.sol";

library UpgradeQueryReadLibrary {
    function pagePostings(
        StateStore.Store storage s,
        bytes32 readBasis,
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        StateAuditPages.PageRequest memory req
    ) external view returns (StateAuditPages.PageResult memory) {
        if (readBasis == 0) revert StorageByteView.ErrReadState(readBasis);
        return StateAuditPages.pagePostingsAtReadBasis(s, T, kind, indexOrdinal, valueKey, req, readBasis);
    }

    function pagePostingsHydrated(
        StateStore.Store storage s,
        bytes32 readBasis,
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey,
        StateAuditPages.PageRequest memory req
    ) external view returns (StateAuditPages.PageResult memory, StateAuditPages.HydratedItem[] memory) {
        if (readBasis == 0) revert StorageByteView.ErrReadState(readBasis);
        return StateAuditPages.pagePostingsHydratedAtReadBasis(s, T, kind, indexOrdinal, valueKey, req, readBasis);
    }

    function counts(
        StateStore.Store storage s,
        bytes32 readBasis,
        bytes32 T,
        uint8 kind,
        uint8 indexOrdinal,
        bytes32 valueKey
    ) external view returns (uint64, uint64, uint64, bytes32, uint64) {
        if (readBasis == 0) revert StorageByteView.ErrReadState(readBasis);
        (uint64 count, uint64 live, uint64 last,, uint64 high) =
            StateAuditPages.counts(s, T, kind, indexOrdinal, valueKey);
        return (count, live, last, readBasis, high);
    }

    function getBindingHead(StateStore.Store storage s, bytes32 readBasis, bytes32 bindingKey)
        external
        view
        returns (BindingFold.Head memory, bytes32, uint64)
    {
        if (readBasis == 0) revert StorageByteView.ErrReadState(readBasis);
        (BindingFold.Head memory head,, uint64 high) = StateBindingReads.getBindingHead(s, bindingKey);
        return (head, readBasis, high);
    }

    function getBindingAtBasis(StateStore.Store storage s, bytes32 readBasis, bytes32 bindingKey, uint64 basisOrdinal)
        external
        view
        returns (BindingFold.Head memory, bytes32, uint64)
    {
        if (readBasis == 0) revert StorageByteView.ErrReadState(readBasis);
        (BindingFold.Head memory head,, uint64 high) = StateBindingReads.getBindingAtBasis(s, bindingKey, basisOrdinal);
        return (head, readBasis, high);
    }

    function readHistory(
        StateStore.Store storage s,
        bytes32 readBasis,
        bytes32 bindingKey,
        uint32 fromRevision,
        uint16 limit
    ) external view returns (StateBindingReads.BindingHistoryEntry[] memory, uint32, uint8) {
        if (readBasis == 0) revert StorageByteView.ErrReadState(readBasis);
        return StateBindingReads.readHistory(s, bindingKey, fromRevision, limit);
    }

    function resolve(StateStore.Store storage s, bytes32 readBasis, bytes32 planRecordId, bytes32 positionKey)
        external
        view
        returns (LensPlan.ResolveResult memory)
    {
        if (readBasis == 0) revert StorageByteView.ErrReadState(readBasis);
        LensPlan.ResolveResult memory r = StateLensReads.resolve(s, planRecordId, positionKey);
        r.basis.realmRevisionId = readBasis;
        return r;
    }

    function resolveStrict(
        StateStore.Store storage s,
        bytes32 readBasis,
        bytes32 planRecordId,
        bytes32 positionKey,
        uint8 acceptMask
    ) external view returns (LensPlan.ResolvedTarget memory, LensPlan.ResolveResult memory) {
        if (readBasis == 0) revert StorageByteView.ErrReadState(readBasis);
        (LensPlan.ResolvedTarget memory target, LensPlan.ResolveResult memory r) =
            StateLensReads.resolveStrict(s, planRecordId, positionKey, acceptMask);
        r.basis.realmRevisionId = readBasis;
        return (target, r);
    }

    function validatePlan(StateStore.Store storage s, bytes32 readBasis, bytes32 planRecordId)
        external
        view
        returns (bool, uint8)
    {
        if (readBasis == 0) revert StorageByteView.ErrReadState(readBasis);
        return StateLensReads.validatePlan(s, planRecordId);
    }

    function deriveBindingKey(bytes32 principalId, bytes32 positionKey) external pure returns (bytes32) {
        return LensPlan.deriveBindingKey(principalId, positionKey);
    }
}
