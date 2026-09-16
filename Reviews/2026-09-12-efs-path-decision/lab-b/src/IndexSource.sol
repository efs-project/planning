// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ITypeRegistry} from "./Interfaces.sol";

interface IIndexSource {
    function counts() external view returns (uint64, uint64, uint64, uint64);
    function extsload(bytes32 slot) external view returns (bytes32);
    function registry() external view returns (ITypeRegistry);
}

/// Bounded retained reads for the pinned Ledger layout (Record roots 2/3).
/// No full-body copy. Replay uses these immutable words, never current liveness.
library IndexSource {
    function header(address source, bytes32 id) internal view returns (bytes32 t, uint64 first, uint32 size) {
        bytes32 base = keccak256(abi.encode(id, uint256(2)));
        uint256 meta = uint256(IIndexSource(source).extsload(bytes32(uint256(base) + 1)));
        return (IIndexSource(source).extsload(base), uint64(meta & ((1 << 48) - 1)), uint32(meta >> 48));
    }

    function word(address source, bytes32 id, uint256 ordinal) internal view returns (bytes32) {
        return IIndexSource(source).extsload(keccak256(abi.encode(ordinal, keccak256(abi.encode(id, uint256(3))))));
    }
}
