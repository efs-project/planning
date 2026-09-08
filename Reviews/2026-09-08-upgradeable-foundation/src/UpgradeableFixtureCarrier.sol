// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {UpgradeStorage, FixtureEndpoint} from "./UpgradeStorage.sol";
import {C0ChunkTree} from "C0Foundation/C0ChunkTree.sol";

/// @notice Detached operator-authorized byte staging; NOT file publication.
contract UpgradeableFixtureCarrier is FixtureEndpoint {
    uint256 public constant MAX_FIXTURE_BYTES = 16384;
    error FixtureBytesBounds();
    error FixtureBytesMissing();
    error FixtureBytesImmutable();
    event FixtureBytesStaged(bytes32 indexed treeId, bytes32 dataHash, uint256 length);
    constructor(address factory, address helper) FixtureEndpoint(factory, helper) {}

    function initialize(address controller, address peer, address admin, address operator, bytes32 treeType) external {
        _initialize(controller, peer, admin, operator, treeType);
    }

    function stageFixtureBytes(
        bytes32 treeId,
        bytes calldata body,
        bytes calldata data,
        uint32 expectedRevision,
        uint64 nonce,
        uint64 deadline,
        bytes calldata signature
    ) external {
        if (data.length > MAX_FIXTURE_BYTES || body.length != 48) revert FixtureBytesBounds();
        UpgradeStorage.ExecutionSet memory e = _execution(expectedRevision);
        _authorize(
            keccak256(
                abi.encode(
                    keccak256(
                        "FixtureBytes(bytes32 treeId,bytes32 bodyHash,bytes32 dataHash,bytes32 executionSetId,uint64 nonce,uint64 deadline)"
                    ),
                    treeId,
                    keccak256(body),
                    keccak256(data),
                    e.id,
                    nonce,
                    deadline
                )
            ),
            nonce,
            deadline,
            signature
        );
        UpgradeStorage.Control storage c = UpgradeStorage.control();
        C0ChunkTree.validate(c.treeType, treeId, body, data);
        if (c.staged[treeId]) {
            if (keccak256(c.stagedBytes[treeId]) != keccak256(data)) revert FixtureBytesImmutable();
        } else {
            c.staged[treeId] = true;
            c.stagedBytes[treeId] = data;
        }
        c.usedNonces[nonce] = true;
        emit FixtureBytesStaged(treeId, keccak256(data), data.length);
    }

    function hasFixtureBytes(bytes32 id) external view returns (bool) {
        return UpgradeStorage.control().staged[id];
    }

    function readFixtureBytes(bytes32 id) external view returns (bytes memory) {
        if (!UpgradeStorage.control().staged[id]) revert FixtureBytesMissing();
        return UpgradeStorage.control().stagedBytes[id];
    }
}

contract UpgradeableFixtureCarrierU2 is UpgradeableFixtureCarrier {
    constructor(address factory, address helper) UpgradeableFixtureCarrier(factory, helper) {}

    function migratePresentation(string calldata label, bool fail) external {
        _migrate(label, fail);
    }

    function presentationLabel() external view returns (string memory) {
        return UpgradeStorage.presentation().label;
    }
}
