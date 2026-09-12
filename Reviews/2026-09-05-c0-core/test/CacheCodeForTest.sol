// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateStore} from "../src/StateStore.sol";

/// @notice Test-only cache deployment from the harness's own account: the same
/// `0x00 || cache` payload the PreparationHelper produces, without the helper.
library CacheCodeForTest {
    error TestCacheDeployFailed(uint256 length);

    function deploy(bytes memory cache) internal returns (address code) {
        if (cache.length == 0) return address(0);
        return deployBlock(cache);
    }

    function recordReference(bytes memory body) internal returns (uint256) {
        return uint256(uint160(deployBlock(body))) | (body.length << 176) | (body.length << 192);
    }

    function recordCell(bytes32 typeId, bytes memory body, uint64 ordinal, uint64 first)
        internal
        returns (StateStore.RecordCell memory)
    {
        return StateStore.RecordCell(typeId, recordReference(body), ordinal, first);
    }

    function deployBlock(bytes memory cache) internal returns (address code) {
        uint256 n = cache.length;
        assembly ("memory-safe") {
            let init := mload(0x40)
            mstore(init, or(shl(248, 0x61), or(shl(232, add(n, 1)), shl(168, 0x80600a3d393df300))))
            mcopy(add(init, 11), add(cache, 32), n)
            code := create(0, init, add(n, 11))
        }
        if (code == address(0)) revert TestCacheDeployFailed(n);
    }
}
