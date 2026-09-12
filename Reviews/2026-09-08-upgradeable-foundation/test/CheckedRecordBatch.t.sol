// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {UpgradeReadGuardsTest} from "./UpgradeReads.t.sol";
import {UpgradeStorage} from "../src/UpgradeStorage.sol";
import {StateStore} from "C0Core/StateStore.sol";
import {PointReadLibrary} from "C0Core/PointReadLibrary.sol";
import {UpgradeQueryReadLibrary} from "../src/UpgradeQueryReadLibrary.sol";

// Independent ABI lets the absent API fail as a runtime assertion during RED.
interface RecordBatchPort {
    struct ReadBasis {
        bytes32 executionSetId;
        uint32 revision;
        uint64 blockNumber;
        uint64 admissionHigh;
    }

    struct RecordResult {
        bytes32 recordId;
        bytes32 typeSchemaId;
        bytes canonicalBody;
        uint64 firstAdmitOrdinal;
    }
    function getRecordsCurrent(bytes32[] calldata ids) external view returns (ReadBasis memory, RecordResult[] memory);
    function getRecordsChecked(ReadBasis calldata expected, bytes32[] calldata ids)
        external
        view
        returns (ReadBasis memory, RecordResult[] memory);
}

// Replaces proxy code only while seeding in a cheatcode test; never a deployment path.
contract RecordBatchSeed {
    function seed(uint256 length, bool malformedLast) external {
        StateStore.Store storage s = UpgradeStorage.efs();
        s.count.records = 8;
        s.count.admissions = 8;
        for (uint64 i = 1; i <= 8; ++i) {
            s.records[bytes32(uint256(i))] = StateStore.RecordRow(s.init.metaTypeId, new bytes(length), i, i);
        }
        if (malformedLast) s.records[bytes32(uint256(8))].firstAdmissionOrdinal = 9;
    }
}

contract CheckedRecordBatchTest is UpgradeReadGuardsTest {
    function ids(uint256 n) private pure returns (bytes32[] memory result) {
        result = new bytes32[](n);
        for (uint256 i; i < n; ++i) {
            result[i] = bytes32(i + 1);
        }
    }

    function seed(uint256 length, bool malformed) private {
        bytes memory original = address(host).code;
        RecordBatchSeed helper = new RecordBatchSeed();
        rv.etch(address(host), address(helper).code);
        RecordBatchSeed(address(host)).seed(length, malformed);
        rv.etch(address(host), original);
    }

    function basis() private view returns (RecordBatchPort.ReadBasis memory b) {
        (b.executionSetId, b.revision, b.blockNumber, b.admissionHigh) = host.fixtureReadContext();
    }

    function refuses(bytes memory data, bytes memory expected) private view {
        (bool ok, bytes memory reason) = address(host).staticcall(data);
        require(!ok, "must refuse whole batch");
        require(keccak256(reason) == keccak256(expected), "exact error preserved");
    }

    // Break: absent API, changed order, dropped duplicate/missing row or mismatched basis.
    function testCurrentCheckedScalarAgreeAndNeverWrite() public {
        seed(31, false);
        bytes32[] memory request = ids(4);
        request[1] = request[0];
        request[2] = bytes32(0);
        rv.record();
        (bool ok, bytes memory raw) =
            address(host).staticcall(abi.encodeCall(RecordBatchPort.getRecordsCurrent, (request)));
        require(ok, "current batch API must return Records");
        (RecordBatchPort.ReadBasis memory actual, RecordBatchPort.RecordResult[] memory rows) =
            abi.decode(raw, (RecordBatchPort.ReadBasis, RecordBatchPort.RecordResult[]));
        require(rows.length == 4 && keccak256(abi.encode(actual)) == keccak256(abi.encode(basis())), "basis/count");
        for (uint256 i; i < rows.length; ++i) {
            (bytes32 t, bytes memory b, uint64 ordinal) = host.getRecord(request[i]);
            require(rows[i].recordId == request[i], "order/echo");
            require(
                keccak256(abi.encode(t, b, ordinal))
                    == keccak256(abi.encode(rows[i].typeSchemaId, rows[i].canonicalBody, rows[i].firstAdmitOrdinal)),
                "scalar match"
            );
        }
        (RecordBatchPort.ReadBasis memory checked, RecordBatchPort.RecordResult[] memory same) =
            RecordBatchPort(address(host)).getRecordsChecked(actual, request);
        require(keccak256(raw) == keccak256(abi.encode(checked, same)), "checked same call");
        (, bytes32[] memory writes) = rv.accesses(address(host));
        require(writes.length == 0, "no writes");
    }

    // Break: missing allocation bound (duplicates still count).
    function testRejectsZeroAndNineBeforeAllocation() public view {
        for (uint256 n; n <= 9; n += 9) {
            bytes memory error = abi.encodeWithSignature("ErrRecordBatchSize(uint256)", n);
            refuses(abi.encodeCall(RecordBatchPort.getRecordsCurrent, (ids(n))), error);
            refuses(abi.encodeCall(RecordBatchPort.getRecordsChecked, (basis(), ids(n))), error);
        }
    }

    // Break: skipping any optimistic precondition, or reading malformed data first.
    function testEachWrongExpectedFieldRejectsBeforeMalformedData() public {
        seed(31, true);
        for (uint256 i; i < 4; ++i) {
            RecordBatchPort.ReadBasis memory b = basis();
            if (i == 0) b.executionSetId = bytes32(0);
            if (i == 1) ++b.revision;
            if (i == 2) ++b.blockNumber;
            if (i == 3) ++b.admissionHigh;
            refuses(
                abi.encodeCall(RecordBatchPort.getRecordsChecked, (b, ids(8))),
                abi.encodeWithSignature("ErrRecordBatchBasis()")
            );
        }
    }

    // Break: batch bypasses either linked code guard, or returns earlier data.
    function testPointAndQueryCodeGuardsSurvive() public {
        RecordBatchPort.ReadBasis memory b = basis();
        address[2] memory libraries = [address(PointReadLibrary), address(UpgradeQueryReadLibrary)];
        for (uint8 i; i < 2; ++i) {
            bytes memory original = libraries[i].code;
            rv.etch(libraries[i], hex"60006000fd");
            bytes memory error = abi.encodeWithSignature("ReadCodeMismatch(uint8)", i + 1);
            refuses(abi.encodeCall(RecordBatchPort.getRecordsCurrent, (ids(8))), error);
            refuses(abi.encodeCall(RecordBatchPort.getRecordsChecked, (b, ids(8))), error);
            rv.etch(libraries[i], original);
        }
    }

    // Break: silently returning seven successful rows after eighth-row corruption.
    function testMalformedEighthRowAndOverlongBodyRetainScalarError() public {
        for (uint256 i; i < 2; ++i) {
            seed(i == 0 ? 31 : 8193, i == 0);
            bytes32 bad = bytes32(uint256(i == 0 ? 8 : 1));
            (bool ok, bytes memory scalar) = address(host).staticcall(abi.encodeCall(host.getRecord, (bad)));
            require(!ok, "scalar refuses");
            require(
                keccak256(scalar) == keccak256(abi.encodeWithSignature("ErrReadState(bytes32)", bad)),
                "scalar single fault"
            );
            refuses(abi.encodeCall(RecordBatchPort.getRecordsCurrent, (ids(8))), scalar);
            refuses(abi.encodeCall(RecordBatchPort.getRecordsChecked, (basis(), ids(8))), scalar);
        }
    }

    // Break: uint64 block wrapping or a smaller-than-promised legal read cap.
    function testMaximumBodySerializationAndBlockOverflow() public {
        seed(8192, false);
        (bool ok, bytes memory raw) =
            address(host).staticcall(abi.encodeCall(RecordBatchPort.getRecordsCurrent, (ids(8))));
        require(ok && raw.length == 67264, "eight maximum ABI responses");
        RecordBatchPort.ReadBasis memory b = basis();
        rv.roll(uint256(type(uint64).max) + 1);
        bytes memory error = abi.encodeWithSignature("ErrReadState(bytes32)", b.executionSetId);
        refuses(abi.encodeCall(RecordBatchPort.getRecordsCurrent, (ids(8))), error);
        refuses(abi.encodeCall(RecordBatchPort.getRecordsChecked, (b, ids(8))), error);
    }
}
