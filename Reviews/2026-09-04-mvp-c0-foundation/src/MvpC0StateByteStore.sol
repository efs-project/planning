// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {C0RunCodec as C} from "./C0RunCodec.sol";
import {C0ChunkTree} from "./C0ChunkTree.sol";

interface IC0CarrierContext {
    function c0CarrierContext() external view returns (bytes32, bytes32, bytes32, uint8);
}

/// @notice Disposable carrier component; not Core, genesis, or deployment attestation.
contract MvpC0StateByteStore {
    bytes32 public immutable experimentSeed;
    address public immutable expectedCore;
    uint64 public immutable maxStateFileBytes;
    uint64 public immutable maxReadRangeBytes;
    bool public isSealed;
    bytes32 public experimentCommitment;
    bytes32 public chunkTreeTypeId;
    bytes public deploymentBytes;
    uint256 public entryCount;
    uint256 public totalStoredBytes;
    error InvalidCarrier();
    error MissingEntry();
    error InvalidBounds();

    struct Entry {
        bool exists;
        bytes body;
        bytes data;
    }
    mapping(bytes32 => Entry) private files;
    bytes32[] private inventory;

    constructor(bytes32 seed, address core, uint64 fileCap, uint64 rangeCap) {
        if (seed == 0 || core == address(0) || fileCap == 0 || rangeCap == 0 || rangeCap > fileCap) {
            revert InvalidCarrier();
        }
        experimentSeed = seed;
        expectedCore = core;
        maxStateFileBytes = fileCap;
        maxReadRangeBytes = rangeCap;
    }

    function sealFromCore(bytes calldata encoded) external {
        if (msg.sender != expectedCore || isSealed) revert InvalidCarrier();
        C.Deployment memory d = C.decodeDeployment(encoded);
        if (
            d.experimentSeed != experimentSeed || d.coreAddress != expectedCore || d.byteStoreAddress != address(this)
                || d.coreRuntimeCodeHash != expectedCore.codehash
                || d.byteStoreRuntimeCodeHash != address(this).codehash
        ) {
            revert InvalidCarrier();
        }
        bytes32 commitment = C.experimentCommitment(d);
        (bytes32 seed, bytes32 reported, bytes32 treeType, uint8 phase) =
            IC0CarrierContext(expectedCore).c0CarrierContext();
        if (seed != experimentSeed || reported != commitment || treeType == 0 || phase != 1) revert InvalidCarrier();
        experimentCommitment = commitment;
        chunkTreeTypeId = treeType;
        deploymentBytes = encoded;
        isSealed = true;
    }

    function _writeContext() private view {
        if (msg.sender != expectedCore || !isSealed) revert InvalidCarrier();
        (bytes32 seed, bytes32 commitment, bytes32 treeType, uint8 phase) =
            IC0CarrierContext(expectedCore).c0CarrierContext();
        if (seed != experimentSeed || commitment != experimentCommitment || treeType != chunkTreeTypeId || phase != 3) {
            revert InvalidCarrier();
        }
    }

    function putFromCore(bytes32 id, bytes calldata body, bytes calldata data) external {
        _writeContext();
        if (data.length > maxStateFileBytes || body.length != 48) revert InvalidCarrier();
        C0ChunkTree.validate(chunkTreeTypeId, id, body, data);
        Entry storage entry = files[id];
        if (entry.exists) {
            if (keccak256(entry.body) != keccak256(body) || keccak256(entry.data) != keccak256(data)) {
                revert InvalidCarrier();
            }
            return;
        }
        entry.exists = true;
        entry.body = body;
        entry.data = data;
        inventory.push(id);
        ++entryCount;
        totalStoredBytes += data.length;
    }

    function metadata(bytes32 id) external view returns (bool, bytes memory) {
        Entry storage entry = files[id];
        return (entry.exists, entry.body);
    }

    function read(bytes32 id) external view returns (bytes memory) {
        Entry storage entry = files[id];
        if (!entry.exists) revert MissingEntry();
        if (entry.data.length > maxStateFileBytes) revert InvalidBounds();
        return entry.data;
    }

    /// @notice Raw range bytes are not a Merkle proof. Readers verify the complete bounded file independently.
    function readRange(bytes32 id, uint64 offset, uint32 length) external view returns (bytes memory out) {
        Entry storage entry = files[id];
        if (!entry.exists) revert MissingEntry();
        uint256 size = entry.data.length;
        // Subtraction after offset check avoids overflow even for the largest ABI offset/length.
        if (length > maxReadRangeBytes || offset > size || length > size - offset) revert InvalidBounds();
        out = new bytes(length);
        for (uint256 i; i < length; ++i) {
            out[i] = entry.data[uint256(offset) + i];
        }
    }

    function entries(uint256 cursor, uint32 limit) external view returns (bytes32[] memory ids, uint256 next) {
        uint256 count = inventory.length;
        if (limit == 0 || limit > 64 || cursor > count) revert InvalidBounds();
        uint256 length = count - cursor;
        if (length > limit) length = limit;
        ids = new bytes32[](length);
        for (uint256 i; i < length; ++i) {
            ids[i] = inventory[cursor + i];
        }
        return (ids, cursor + length);
    }
}
