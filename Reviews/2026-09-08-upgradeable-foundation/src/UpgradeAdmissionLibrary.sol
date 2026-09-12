// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateStore} from "C0Core/StateStore.sol";
import {StateKernel} from "C0Core/StateKernel.sol";
import {Preparation} from "C0Core/Preparation.sol";
import {PostingAccess} from "C0Core/PostingAccess.sol";

library UpgradeAdmissionLibrary {
    error FixtureConfiguration();
    error InventoryBounds();

    function rawPostingRead(StateStore.Store storage s, uint8 kind, bytes32 id, uint64 i)
        external view returns (uint256)
    {
        if (kind == 0) return PostingAccess.head(s.postingStore, id);
        if (kind == 1) {
            if (i >= (uint64(PostingAccess.head(s.postingStore, id)) + 4) / 5) revert InventoryBounds();
            return PostingAccess.word(s.postingStore, id, i);
        }
        if (kind == 2) return uint256(PostingAccess.keyAt(s.postingStore, i));
        revert InventoryBounds();
    }

    function postingConfiguration(StateStore.Store storage s, bytes32 base, address store, bytes32 codehash)
        external view returns (bytes32)
    {
        if (s.postingStore != store || store.codehash != codehash || PostingAccess.writer(store) != address(this))
            revert FixtureConfiguration();
        return keccak256(abi.encode(keccak256("efs.fixture.core-posting-store/1"), base, store, codehash));
    }

    function initialize(StateStore.Store storage s, StateKernel.Init memory init, Preparation.Config memory prep,
        address postingStore, bytes32 postingHash)
        external
    {
        if (s.postingStore != address(0) || postingStore.code.length == 0 || postingStore.codehash != postingHash
            || PostingAccess.writer(postingStore) != address(this)) revert FixtureConfiguration();
        s.postingStore = postingStore;
        StateKernel.initialize(s, init, prep);
    }

    function admit(
        StateStore.Store storage s,
        StateKernel.VerifiedContext memory v,
        StateKernel.Publication memory p,
        Preparation.Config memory prep,
        uint32 revision
    ) external returns (StateKernel.AdmitResult memory) {
        return StateKernel.admitAtRevision(s, v, p, prep, revision);
    }
}
