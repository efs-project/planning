// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {NativeKernel} from "../src/NativeKernel.sol";
import {CanonicalFixtures} from "./fixtures/CanonicalFixtures.sol";

contract CanonicalTypesTest {
    function testActualLegacyRegistryCannotRegisterCanonicalGroup() public {
        NativeKernel old = new NativeKernel();
        (bool ok,) = address(old.types()).call(
            abi.encodeWithSignature("registerGroup(bytes)", CanonicalFixtures.group_defaults())
        );
        require(ok, "canonical group admission missing");
    }
}
