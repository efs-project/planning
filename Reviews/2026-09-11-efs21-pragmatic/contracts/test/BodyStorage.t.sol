// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {TestBase} from "./TestBase.sol";
import {LegacyNativeKernel as NativeKernel} from "./fixtures/legacy4cb/LegacyNativeKernel.sol";
import {HistoryVm} from "./History.t.sol";
import {LegacyNavigationIndex as NavigationIndex} from "./fixtures/legacy4cb/LegacyNavigationIndex.sol";
import {LegacyBytesValidator as BytesValidator} from "./fixtures/legacy4cb/LegacyExactTypeRegistry.sol";

interface BodyVm {
    function getNonce(address) external view returns (uint64);
    function setNonce(address, uint64) external;
    function computeCreateAddress(address, uint256) external pure returns (address);
}

interface Writer {
    function write(bytes calldata) external returns (address);
}

interface ReadConsumer {
    function capture(NativeKernel, bytes32, uint256) external;
    function lastDigest() external view returns (bytes32);
    function lastReads() external view returns (uint256);
}

contract BodyStorageTest is TestBase {
    function frozenBytesValidator() internal returns (address deployed) {
        bytes memory code = vm.getCode("test/fixtures/bytes-validator-4cb0042.json");
        assembly { deployed := create(0, add(code, 32), mload(code)) }
    }
    BodyVm constant bvm = BodyVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    HistoryVm constant hvm = HistoryVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    NativeKernel kernel;
    bytes32 rawType;
    address writer;

    function setUp() public {
        bytes memory creation = vm.getCode("test/fixtures/native-kernel-4cb0042.json");
        address deployed;
        assembly { deployed := create(0, add(creation, 32), mload(creation)) }
        kernel = NativeKernel(deployed);
        creation = vm.getCode("test/fixtures/raw-validator-4cb0042.json");
        address validator;
        assembly ("memory-safe") { validator := create(0, add(creation, 32), mload(creation)) }
        rawType = kernel.types().register("EFS21 exact raw bytes v1", validator);
        writer = address(kernel.recordKernel().bodyWriter());
    }

    // Code faults use naturally code-selected dense payloads on the actual split facade.

    // Catches storage-only admission or helper creation on a dedup hit.
    function testUniqueCreatesOneHelperObjectDuplicateCreatesNone() public {
        uint64 beforeNonce = bvm.getNonce(writer);
        uint64 kernelNonce = bvm.getNonce(address(kernel));
        address pointer = bvm.computeCreateAddress(writer, beforeNonce);
        bytes32 id = kernel.storeRecord(
            rawType,
            hex"ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff"
        );
        eq(bvm.getNonce(writer), beforeNonce + 1);
        eq(
            pointer.code,
            hex"00ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff"
        );
        eq(
            kernel.readRecord(id).body,
            hex"ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff"
        );
        eq(
            kernel.storeRecord(
                rawType,
                hex"ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff"
            ),
            id
        );
        eq(bvm.getNonce(writer), beforeNonce + 1);
        eq(bvm.getNonce(address(kernel)), kernelNonce);
    }

    // A same-sized STOP-prefixed replacement must fail the exact RecordId check.
    function testWrongSameLengthCodeIsCorruptNotReturned() public {
        address pointer = bvm.computeCreateAddress(writer, bvm.getNonce(writer));
        bytes32 id = kernel.storeRecord(
            rawType,
            hex"ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff"
        );
        vm.etch(
            pointer,
            hex"00ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080fe"
        );
        vm.expectRevert(bytes4(keccak256("CorruptRecord()")));
        kernel.readRecord(id);
    }

    function testMalformedCodeAndMetadataRefuseBeforeCopy() public {
        address pointer = bvm.computeCreateAddress(writer, bvm.getNonce(writer));
        bytes32 id = kernel.storeRecord(
            rawType,
            hex"ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff"
        );
        bytes[6] memory corrupt = [
            bytes(""),
            hex"00",
            hex"00ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080",
            hex"00ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff00",
            hex"01ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff",
            hex"00ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080fe"
        ];
        for (uint256 i; i < corrupt.length; ++i) {
            vm.etch(pointer, corrupt[i]);
            vm.expectRevert(bytes4(keccak256("CorruptRecord()")));
            kernel.readRecord(id);
        }
        vm.etch(
            pointer,
            hex"00ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff"
        );
        bytes32 packedSlot = bytes32(uint256(keccak256(abi.encode(id, uint256(0)))) + 1);
        bytes32 original = hvm.load(address(kernel.recordKernel()), packedSlot);
        // Absent pointer; boundedness violation before allocation; wrong stored Type.
        hvm.store(address(kernel.recordKernel()), packedSlot, bytes32((uint256(128) << 160) | (uint256(1) << 176)));
        vm.expectRevert(bytes4(keccak256("CorruptRecord()")));
        kernel.readRecord(id);
        hvm.store(
            address(kernel.recordKernel()),
            packedSlot,
            bytes32(uint256(uint160(pointer)) | (uint256(65535) << 160) | (uint256(1) << 176))
        );
        vm.expectRevert(bytes4(keccak256("CorruptRecord()")));
        kernel.readRecord(id);
        hvm.store(address(kernel.recordKernel()), packedSlot, original);
        hvm.store(address(kernel.recordKernel()), keccak256(abi.encode(id, uint256(0))), bytes32(uint256(123)));
        vm.expectRevert(bytes4(keccak256("CorruptRecord()")));
        kernel.readRecord(id);
    }

    function testEmptyPresenceInventoryAndEvents() public {
        address pointer = bvm.computeCreateAddress(writer, bvm.getNonce(writer));
        hvm.recordLogs();
        bytes32 id = kernel.storeRecord(rawType, "");
        eq(pointer.code, bytes("")); // Real hybrid empty body has presence, not a code child.
        eq(kernel.readRecord(id).body, bytes(""));
        eq(kernel.readRecord(id).typeId, rawType);
        eq(kernel.storeRecord(rawType, ""), id);
        HistoryVm.Log[] memory logs = hvm.getRecordedLogs();
        uint256 events;
        for (uint256 i; i < logs.length; ++i) {
            if (
                logs[i].emitter == address(kernel.recordKernel())
                    && logs[i].topics[0] == keccak256("RecordStored(bytes32,bytes32)")
            ) {
                ++events;
            }
        }
        eq(events, 1);
        eq(kernel.navigation().typeInventory(rawType, NavigationIndex.Cursor(0, 0, 0), 64).ids.length, 1);
        vm.expectRevert(NativeKernel.MissingRecord.selector);
        kernel.readRecord(bytes32(uint256(1)));
    }

    function testSameBytesDifferentTypesNeverShareBodyObjects() public {
        bytes32 canonicalType = kernel.types().register("EFS21 canonical ABI bytes v1", frozenBytesValidator());
        bytes memory body = abi.encode(hex"ef0000ff00");
        uint64 nonce = bvm.getNonce(writer);
        address first = bvm.computeCreateAddress(writer, nonce);
        address second = bvm.computeCreateAddress(writer, nonce + 1);
        bytes32 raw = kernel.storeRecord(rawType, body);
        bytes32 canonical = kernel.storeRecord(canonicalType, body);
        yes(raw != canonical);
        eq(bvm.getNonce(writer), nonce + 2);
        eq(first.code, abi.encodePacked(hex"00", body));
        eq(second.code, first.code);
        eq(kernel.readRecord(raw).body, body);
        eq(kernel.readRecord(canonical).body, body);
    }

    function testFrozenControlReadDefenseIsBehaviorallyDistinct() public {
        string[2] memory paths =
            ["test/fixtures/native-kernel-c088363.json", "test/fixtures/native-kernel-c088363-read-integrity.json"];
        for (uint256 arm; arm < 2; ++arm) {
            bytes memory creation = hvm.parseJsonBytes(hvm.readFile(paths[arm]), ".bytecode.object");
            address target;
            assembly ("memory-safe") { target := create(0, add(creation, 32), mload(creation)) }
            NativeKernel control = NativeKernel(target);
            bytes memory validatorCode = vm.getCode("test/fixtures/raw-validator-4cb0042.json");
            address validator;
            assembly ("memory-safe") { validator := create(0, add(validatorCode, 32), mload(validatorCode)) }
            bytes32 exactType = control.types().register("EFS21 exact raw bytes v1", validator);
            eq(exactType, rawType);
            bytes32 id = control.storeRecord(exactType, hex"ef0080ff");
            eq(control.readRecord(id).body, hex"ef0080ff");
            bytes32 slot = bytes32(uint256(keccak256(abi.encode(id, uint256(3)))) + 1);
            hvm.store(target, slot, bytes32(uint256(hvm.load(target, slot)) ^ (uint256(1) << 224)));
            if (arm == 0) {
                eq(control.readRecord(id).body, hex"ef0080fe");
            } else {
                vm.expectRevert(NativeKernel.CorruptRecord.selector);
                control.readRecord(id);
            }
        }
    }

    function testHelperAuthorityBoundsPinAndInertOpcodes() public {
        vm.expectRevert(bytes4(keccak256("Unauthorized()")));
        Writer(writer).write(hex"ff");
        bytes memory tooLarge = new bytes(4097);
        vm.prank(address(kernel.recordKernel()));
        vm.expectRevert(bytes4(keccak256("BodyTooLarge()")));
        Writer(writer).write(tooLarge);
        address pointer = bvm.computeCreateAddress(writer, bvm.getNonce(writer));
        bytes32 id = kernel.storeRecord(
            rawType,
            hex"efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00"
        );
        bytes memory code = pointer.code;
        (bool ok, bytes memory output) = pointer.call(hex"ffffffff");
        yes(ok);
        eq(output.length, 0);
        eq(pointer.code, code);
        eq(
            kernel.readRecord(id).body,
            hex"efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00"
        );
        bytes memory writerCode = writer.code;
        for (uint256 i; i < 2; ++i) {
            vm.etch(writer, i == 0 ? bytes("") : bytes(hex"00"));
            vm.expectRevert(bytes4(keccak256("BodyWriterUnavailable()")));
            kernel.storeRecord(rawType, hex"1122");
            // Dedup still validates Type, but needs no helper write.
            eq(
                kernel.storeRecord(
                    rawType,
                    hex"efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00efff6000ff00"
                ),
                id
            );
        }
        vm.etch(writer, writerCode);
    }

    function testCreateCollisionAndLowGasRollback() public {
        uint64 nonce = bvm.getNonce(writer);
        address pointer = bvm.computeCreateAddress(writer, nonce);
        vm.etch(pointer, hex"00");
        vm.expectRevert(bytes4(keccak256("DeploymentFailed()")));
        kernel.storeRecord{gas: 1000000}(
            rawType,
            hex"abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd"
        );
        eq(bvm.getNonce(writer), nonce);
        vm.etch(pointer, "");
        bytes memory body = new bytes(4096);
        (bool ok,) = address(kernel).call{gas: 100000}(abi.encodeCall(kernel.storeRecord, (rawType, body)));
        yes(!ok);
        eq(bvm.getNonce(writer), nonce);
        eq(pointer.code.length, 0);
        eq(kernel.navigation().typeInventory(rawType, NavigationIndex.Cursor(0, 0, 0), 64).ids.length, 0);
    }

    function snapshot(bytes32 root, bytes32 file) internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                bvm.getNonce(writer),
                bvm.getNonce(address(kernel)),
                kernel.fileNonce(address(this)),
                kernel.fileInfo(file),
                kernel.revisionAt(file, 1),
                kernel.navigation().location(file),
                kernel.navigation().typeInventory(rawType, NavigationIndex.Cursor(0, 0, 0), 64),
                kernel.navigation().fileInventory(address(this), NavigationIndex.Cursor(0, 0, 0), 64),
                kernel.listDirectory(address(this), root, NavigationIndex.Cursor(0, 0, 0), 64)
            )
        );
    }

    function testLateFailuresRollbackBodyNonceInventoryHistoryAndLocation() public {
        bytes32 root = kernel.ensureRoot();
        bytes32 file = kernel.createFile(root, "taken", rawType, hex"0001");
        bytes32 beforeState = snapshot(root, file);
        address pointer = bvm.computeCreateAddress(writer, bvm.getNonce(writer));
        bytes32 unique = kernel.recordId(rawType, hex"0002");
        for (uint256 mode; mode < 3; ++mode) {
            address discovery = address(kernel.discovery());
            bytes memory original = discovery.code;
            if (mode == 2) vm.etch(discovery, hex"60006000fd");
            vm.expectRevert();
            if (mode == 0) kernel.createFile(root, "taken", rawType, hex"0002");
            else kernel.editFile(file, mode == 1 ? 0 : 1, rawType, hex"0002");
            if (mode == 2) vm.etch(discovery, original);
            eq(snapshot(root, file), beforeState);
            eq(pointer.code.length, 0);
            vm.expectRevert(NativeKernel.MissingRecord.selector);
            kernel.readRecord(unique);
            vm.expectRevert(NativeKernel.InvalidRevision.selector);
            kernel.revisionAt(file, 2);
        }
    }

    function testPaidConsumerSingleRepeatedAndBoundedReads() public {
        bytes memory creation = vm.getCode("LegacyBodyReadConsumer.sol:LegacyBodyReadConsumer");
        address consumer;
        assembly ("memory-safe") { consumer := create(0, add(creation, 32), mload(creation)) }
        bytes32 id = kernel.storeRecord(
            rawType,
            hex"ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff"
        );
        ReadConsumer(consumer).capture(kernel, id, 1);
        eq(
            ReadConsumer(consumer).lastDigest(),
            keccak256(
                hex"ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff"
            )
        );
        eq(ReadConsumer(consumer).lastReads(), 1);
        ReadConsumer(consumer).capture(kernel, id, 2);
        eq(
            ReadConsumer(consumer).lastDigest(),
            keccak256(
                hex"ef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ffef0080ff"
            )
        );
        eq(ReadConsumer(consumer).lastReads(), 2);
        vm.expectRevert();
        ReadConsumer(consumer).capture(kernel, id, 0);
        vm.expectRevert();
        ReadConsumer(consumer).capture(kernel, id, 9);
    }
}
