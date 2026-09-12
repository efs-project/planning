// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateStore} from "C0Core/StateStore.sol";
import {StateKernel} from "C0Core/StateKernel.sol";
import {Preparation} from "C0Core/Preparation.sol";

library UpgradeAdmissionLibrary {
    function initialize(StateStore.Store storage s, StateKernel.Init memory init, Preparation.Config memory prep)
        external
    {
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
