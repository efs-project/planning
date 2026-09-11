// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface Vm {
    function prank(address) external;
    function expectRevert() external;
    function expectRevert(bytes4) external;
    function etch(address, bytes calldata) external;
    function getCode(string calldata) external returns (bytes memory);
}

contract TestBase {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function eq(bytes32 a, bytes32 b) internal pure {
        require(a == b, "bytes32 mismatch");
    }

    function eq(uint256 a, uint256 b) internal pure {
        require(a == b, "uint mismatch");
    }

    function eq(address a, address b) internal pure {
        require(a == b, "address mismatch");
    }

    function eq(bytes memory a, bytes memory b) internal pure {
        require(keccak256(a) == keccak256(b), "bytes mismatch");
    }

    function yes(bool a) internal pure {
        require(a, "expected true");
    }
}
