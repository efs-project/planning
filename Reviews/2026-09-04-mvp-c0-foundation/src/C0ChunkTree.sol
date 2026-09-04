// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice Source-pinned ChunkTree/Stage A Record identity for this disposable component.
library C0ChunkTree {
    bytes32 internal constant DOM_RECORD = keccak256("efs2/record/1");
    error InvalidChunkTree();

    function _geometry(uint32 chunkSize) private pure {
        if (chunkSize < 4096 || chunkSize > 8388608 || chunkSize % 4096 != 0) revert InvalidChunkTree();
    }

    function root(bytes memory data, uint32 chunkSize) internal pure returns (bytes32) {
        if (data.length == 0) {
            if (chunkSize != 262144) revert InvalidChunkTree();
            return keccak256(hex"02");
        }
        _geometry(chunkSize);
        uint256 count = (data.length - 1) / chunkSize + 1;
        if (count > 16777216) revert InvalidChunkTree();
        bytes32[] memory nodes = new bytes32[](count);
        for (uint256 i; i < count; ++i) {
            uint256 start = i * chunkSize;
            uint256 length = data.length - start;
            if (length > chunkSize) length = chunkSize;
            // Prefix defaults to 0x00; mcopy copies the exact short final chunk.
            bytes memory leaf = new bytes(length + 1);
            assembly ("memory-safe") { mcopy(add(leaf, 33), add(add(data, 32), start), length) }
            nodes[i] = keccak256(leaf);
        }
        while (count > 1) {
            uint256 next;
            for (uint256 i; i < count; i += 2) {
                nodes[next++] =
                    i + 1 < count ? keccak256(abi.encodePacked(bytes1(0x01), nodes[i], nodes[i + 1])) : nodes[i];
            }
            count = next;
        }
        return nodes[0];
    }

    function recordId(bytes32 typeId, bytes memory body) internal pure returns (bytes32) {
        return keccak256(abi.encode(DOM_RECORD, typeId, keccak256(body)));
    }

    function validate(bytes32 typeId, bytes32 id, bytes memory body, bytes memory data) internal pure {
        if (body.length != 48) revert InvalidChunkTree();
        uint32 chunkSize;
        uint32 chunkCount;
        uint64 totalSize;
        bytes32 merkleRoot;
        assembly ("memory-safe") {
            chunkSize := shr(224, mload(add(body, 32)))
            chunkCount := shr(224, mload(add(body, 36)))
            totalSize := shr(192, mload(add(body, 40)))
            merkleRoot := mload(add(body, 48))
        }
        if (totalSize != data.length) revert InvalidChunkTree();
        if (totalSize == 0) {
            if (chunkSize != 262144 || chunkCount != 0) revert InvalidChunkTree();
        } else {
            _geometry(chunkSize);
            uint256 expectedCount = (uint256(totalSize) - 1) / chunkSize + 1;
            if (chunkCount != expectedCount || chunkCount > 16777216) revert InvalidChunkTree();
        }
        if (merkleRoot != root(data, chunkSize) || id != recordId(typeId, body)) revert InvalidChunkTree();
    }
}
