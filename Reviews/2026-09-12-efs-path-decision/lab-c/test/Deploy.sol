// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Test-only deployment helper (EIP-170 / EIP-3860 for the test side).
 *
 * `new X()` embeds X's CREATION code into the creating contract, so any helper or test contract that
 * `new`s the Ledger carries >= 23,145 B of runtime + Ledger's constructor code and cannot itself fit
 * under 24,576 B. Instead, creation bytecode is fetched at run time from the compiled artifacts with
 * the `getCode` cheatcode and created here; nothing embeds another contract's creation code except
 * the tiny fixture actors. The Ledger artifact is unlinked (ImportLib placeholder), which `getCode`
 * refuses, so its `bytecode.object` is read from the artifact JSON, the `__$…$__` placeholder is
 * replaced by the deployed library address, and the hex is parsed with `parseBytes`.
 *
 * The run sets FOUNDRY_OUT once for Forge, getCode and direct JSON reads. The only inline assembly in
 * the lab is here (test side, memory-safe): CREATE bubbles constructor revert data, and EXTCODECOPY
 * checks the deployed Ledger's exact linked-library address.
 */

import { Vm, VM_ADDRESS } from "./Vm.sol";

library Deploy {
  Vm internal constant vm = Vm(VM_ADDRESS);

  string internal constant LEDGER_ARTIFACT = "Ledger.sol/Ledger.json";
  string internal constant IMPORT_SOURCE = "src/ImportLib.sol";
  string internal constant IMPORT_PLACEHOLDER = "__$788d975a4cd26993df85cb0e01ce8f8e61$__";

  function create(bytes memory initcode) internal returns (address deployed) {
    assembly ("memory-safe") {
      deployed := create(0, add(initcode, 0x20), mload(initcode))
      if iszero(deployed) {
        let size := returndatasize()
        let ptr := mload(0x40)
        returndatacopy(ptr, 0, size)
        revert(ptr, size)
      }
    }
  }

  function artifact(string memory id) internal view returns (bytes memory) {
    return vm.getCode(id);
  }

  function artifactRoot() internal view returns (string memory) {
    return vm.envOr("FOUNDRY_OUT", string("out"));
  }

  function ledgerArtifactPath() internal view returns (string memory) {
    return string.concat(artifactRoot(), "/", LEDGER_ARTIFACT);
  }

  function deployArtifact(string memory id, bytes memory constructorArgs) internal returns (address) {
    return create(abi.encodePacked(artifact(id), constructorArgs));
  }

  /// Creation bytecode of the Ledger with `ImportLib` linked to `lib`.
  function linkedLedgerCode(address lib) internal view returns (bytes memory) {
    string memory json = vm.readFile(ledgerArtifactPath());
    (uint256 start, uint256 length) = oneImportReference(json, ".bytecode.linkReferences");
    bytes memory hex_ = bytes(vm.parseJsonString(json, ".bytecode.object"));
    bytes memory addr = bytes(toHex40(lib));
    uint256 at = 2 + start * 2; // bytecode.object has a leading 0x and two characters per byte
    require(length == 20 && at + 40 <= hex_.length, "invalid ImportLib link reference");
    require(matches(hex_, at, bytes(IMPORT_PLACEHOLDER)), "unexpected ImportLib placeholder");
    for (uint256 j = 0; j < 40; j++) hex_[at + j] = addr[j];
    require(!hasPlaceholder(hex_), "unexpected additional library reference");
    return vm.parseBytes(string(hex_));
  }

  function assertLedgerLinked(address ledger, address lib) internal view {
    string memory json = vm.readFile(ledgerArtifactPath());
    (uint256 start, uint256 length) = oneImportReference(json, ".deployedBytecode.linkReferences");
    require(length == 20 && ledger.code.length >= start + length, "invalid deployed link reference");
    bytes memory linked = new bytes(20);
    assembly ("memory-safe") {
      extcodecopy(ledger, add(linked, 0x20), start, 20)
    }
    require(address(bytes20(linked)) == lib, "wrong deployed ImportLib identity");
  }

  function oneImportReference(string memory json, string memory root) internal pure returns (uint256 start, uint256 length) {
    string[] memory files = vm.parseJsonKeys(json, root);
    require(files.length == 1 && keccak256(bytes(files[0])) == keccak256(bytes(IMPORT_SOURCE)), "unexpected library source");
    // Recursive descent is intentionally scalar: missing or multiple references cannot decode as uint256.
    start = vm.parseJsonUint(json, string.concat(root, "..start"));
    length = vm.parseJsonUint(json, string.concat(root, "..length"));
  }

  function matches(bytes memory haystack, uint256 at, bytes memory needle) internal pure returns (bool) {
    if (at + needle.length > haystack.length) return false;
    for (uint256 i = 0; i < needle.length; i++) {
      if (haystack[at + i] != needle[i]) return false;
    }
    return true;
  }

  function hasPlaceholder(bytes memory hex_) internal pure returns (bool) {
    for (uint256 i = 0; i + 2 < hex_.length; i++) {
      if (hex_[i] == "_" && hex_[i + 1] == "_" && hex_[i + 2] == "$") return true;
    }
    return false;
  }

  function toHex40(address a) internal pure returns (string memory) {
    bytes16 digits = "0123456789abcdef";
    bytes memory s = new bytes(40);
    uint160 v = uint160(a);
    for (uint256 i = 0; i < 20; i++) {
      s[2 * i] = digits[uint8(v >> (8 * (19 - i)) >> 4) & 0xf];
      s[2 * i + 1] = digits[uint8(v >> (8 * (19 - i))) & 0xf];
    }
    return string(s);
  }
}
