// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {PointReadLibrary} from "C0Core/PointReadLibrary.sol";
import {UpgradeableReadFixtureCore} from "../src/UpgradeableReadFixtureCore.sol";

/// @notice Test-only conventional external multicall, with ordinary scalar Core APIs.
contract RecordExternalMulticall {
    function aggregate(address target, bytes[] calldata calls) external view returns (bytes[] memory results) {
        require(calls.length > 0 && calls.length <= 8, "test multicall bound");
        results = new bytes[](calls.length);
        for (uint256 i; i < calls.length; ++i) {
            (bool ok, bytes memory data) = target.staticcall(calls[i]);
            if (!ok) assembly ("memory-safe") { revert(add(data, 32), mload(data)) }
            results[i] = data;
        }
    }
}

/// @notice Mined read consumer. All three paths consume the same row digest.
/// Current intentionally calls no context getter before reading.
contract RecordBatchConsumer {
    function scalar(UpgradeableReadFixtureCore host, bytes32[] calldata ids) external view returns (bytes32) {
        PointReadLibrary.RecordResult[] memory rows = new PointReadLibrary.RecordResult[](ids.length);
        for (uint256 i; i < ids.length; ++i) {
            (bytes32 t, bytes memory body, uint64 ordinal) = host.getRecord(ids[i]);
            rows[i] = PointReadLibrary.RecordResult(ids[i], t, body, ordinal);
        }
        return keccak256(abi.encode(rows));
    }

    function current(UpgradeableReadFixtureCore host, bytes32[] calldata ids) external view returns (bytes32) {
        (, PointReadLibrary.RecordResult[] memory rows) = host.getRecordsCurrent(ids);
        return keccak256(abi.encode(rows));
    }

    function multicall(RecordExternalMulticall aggregate, UpgradeableReadFixtureCore host, bytes32[] calldata ids)
        external
        view
        returns (bytes32)
    {
        bytes[] memory calls = new bytes[](ids.length);
        for (uint256 i; i < ids.length; ++i) {
            calls[i] = abi.encodeCall(host.getRecord, (ids[i]));
        }
        bytes[] memory results = aggregate.aggregate(address(host), calls);
        PointReadLibrary.RecordResult[] memory rows = new PointReadLibrary.RecordResult[](ids.length);
        for (uint256 i; i < ids.length; ++i) {
            (bytes32 t, bytes memory body, uint64 ordinal) = abi.decode(results[i], (bytes32, bytes, uint64));
            rows[i] = PointReadLibrary.RecordResult(ids[i], t, body, ordinal);
        }
        return keccak256(abi.encode(rows));
    }
}
