// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// Minimal Foundry cheatcode surface declared by hand (no forge-std in this lab).
interface Vm {
  function addr(uint256 privateKey) external pure returns (address);

  function sign(uint256 privateKey, bytes32 digest) external pure returns (uint8 v, bytes32 r, bytes32 s);

  function prank(address msgSender) external;

  function chainId(uint256 newChainId) external;

  function warp(uint256 newTimestamp) external;

  function label(address account, string calldata newLabel) external;

  /// Creation bytecode of a compiled artifact ("File.sol:Contract"); fails for unlinked artifacts.
  function getCode(string calldata artifactPath) external view returns (bytes memory creationBytecode);

  function envOr(string calldata name, string calldata defaultValue) external view returns (string memory value);

  function readFile(string calldata path) external view returns (string memory data);

  function parseJsonKeys(string calldata json, string calldata key) external pure returns (string[] memory keys);

  function parseJsonString(string calldata json, string calldata key) external pure returns (string memory);

  function parseJsonUint(string calldata json, string calldata key) external pure returns (uint256);

  function parseBytes(string calldata stringifiedValue) external pure returns (bytes memory parsedValue);
}

address constant VM_ADDRESS = address(uint160(uint256(keccak256("hevm cheat code"))));
