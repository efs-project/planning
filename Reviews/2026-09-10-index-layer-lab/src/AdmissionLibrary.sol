// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateStore} from "./StateStore.sol";
import {StateKernel} from "./StateKernel.sol";
import {Preparation} from "./Preparation.sol";

/// @notice Experimental immutable linked code: has full caller storage authority.
library AdmissionLibrary {
    function admit(
        StateStore.Store storage s,
        StateKernel.VerifiedContext memory v,
        StateKernel.Publication memory p,
        Preparation.Config memory prep
    ) external returns (StateKernel.AdmitResult memory) {
        return StateKernel.admit(s, v, p, prep);
    }
}
