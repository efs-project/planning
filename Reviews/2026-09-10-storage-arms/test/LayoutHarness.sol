// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

// Import the actual C0 structs; this lab does not redefine or re-encode them.
import {StateStore} from "C0State/StateStore.sol";

contract LayoutHarness {
    StateStore.Store internal current;
}
