// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {PublicationSupport} from "../src/PublicationSupport.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {Ledger} from "../src/Ledger.sol";

contract WorkUnitsProbe {
    uint256 immutable units;

    constructor(uint256 n) {
        units = n;
    }

    function fieldProfile() external view returns (address) {
        return address(this);
    }

    function workUnits(bytes32) external view returns (uint256) {
        return units;
    }
}

contract MalformedProfilePointer {
    fallback() external {
        assembly ("memory-safe") {
            mstore(0, not(0))
            return(0, 32)
        }
    }
}

contract IndexWorkTest {
    function test_finite_quote_full_profile_ceiling_and_scalar_output_bounds() public {
        TypeRegistry registry = new TypeRegistry();
        PublicationSupport support = new PublicationSupport();
        bytes32 t = registry.register(bytes32("eight"), address(0), new bytes32[](8));
        Ledger.Action[] memory actions = new Ledger.Action[](1);
        actions[0].kind = 1;
        actions[0].typeId = t;
        WorkUnitsProbe five = new WorkUnitsProbe(5);
        require(
            support.indexAllowance(address(five), address(registry), abi.encode(actions)) == 790_600,
            "full8-plus5 quote"
        );
        actions = new Ledger.Action[](64);
        for (uint256 i; i < 64; i++) {
            actions[i].kind = 1;
            actions[i].typeId = t;
        }
        require(
            support.indexAllowance(address(five), address(registry), abi.encode(actions)) == 9_800_000, "shared maximum"
        );
        WorkUnitsProbe six = new WorkUnitsProbe(6);
        (bool ok,) = address(support)
            .staticcall(abi.encodeCall(support.indexAllowance, (address(six), address(registry), abi.encode(actions))));
        require(!ok, "unbounded declarations accepted");
        MalformedProfilePointer pointer = new MalformedProfilePointer();
        (ok,) = address(support)
            .staticcall(
                abi.encodeCall(support.indexAllowance, (address(pointer), address(registry), abi.encode(actions)))
            );
        require(!ok, "noncanonical address accepted");
        actions = new Ledger.Action[](65);
        (ok,) = address(support)
            .staticcall(abi.encodeCall(support.indexAllowance, (address(five), address(registry), abi.encode(actions))));
        require(!ok, "unbounded actions accepted");
    }
}
