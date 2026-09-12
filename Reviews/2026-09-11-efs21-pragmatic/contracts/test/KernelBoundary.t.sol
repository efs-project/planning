// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {TestBase} from "./TestBase.sol";
import {NativeKernel} from "../src/NativeKernel.sol";
import {NavigationIndex} from "../src/NavigationIndex.sol";
import {Uint256Validator} from "../src/ExactTypeRegistry.sol";
import {NativeRecordKernel} from "../src/NativeRecordKernel.sol";
import {RecordInventoryIndex} from "../src/RecordInventoryIndex.sol";
import {RecordProducer, GenericRecords} from "./fixtures/RecordProducer.sol";

interface BoundaryVm {
    function mockCall(address, bytes calldata, bytes calldata) external;
    function clearMockedCalls() external;
}

interface RecordBoundary {
    function recordKernel() external view returns (address);
    function recordInventory() external view returns (address);
    function kernel() external view returns (address);
    function storeRecord(bytes32, bytes calldata) external returns (bytes32);
    function readRecord(bytes32) external view returns (NativeKernel.Record memory);
}

contract KernelBoundaryTest is TestBase {
    NativeKernel k;
    NavigationIndex nav;
    bytes32 uintType;

    function setUp() public {
        k = new NativeKernel();
        nav = k.navigation();
        uintType = k.types().register("quote:uint256", address(new Uint256Validator()));
    }

    function start() internal pure returns (NavigationIndex.Cursor memory) {
        return NavigationIndex.Cursor(0, 0, 0);
    }

    function testInventoryOutageRefusesNewAdmissionButDedupCreatesNoNewObligation() public {
        NativeRecordKernel record = k.recordKernel();
        address inventory = address(k.recordInventory());
        bytes32 id = record.storeRecord(uintType, abi.encode(uint256(7)));
        bytes memory code = inventory.code;
        for (uint256 i; i < 2; ++i) {
            vm.etch(inventory, i == 0 ? bytes("") : bytes(hex"00"));
            vm.expectRevert(NativeRecordKernel.RecordInventoryUnavailable.selector);
            record.storeRecord(uintType, abi.encode(uint256(8)));
            eq(record.storeRecord(uintType, abi.encode(uint256(7))), id);
            eq(record.readRecord(id).body, abi.encode(uint256(7)));
        }
        vm.etch(inventory, code);
        eq(nav.typeInventory(uintType, start(), 64).ids.length, 1);
    }

    function testMalformedInventoryRepliesCannotCommitMetadataOrPostings() public {
        NativeRecordKernel record = k.recordKernel();
        RecordInventoryIndex inventory = k.recordInventory();
        BoundaryVm bvm = BoundaryVm(address(vm));
        bytes memory body = abi.encode(uint256(19));
        bytes32 id = k.recordId(uintType, body);
        bytes[5] memory replies = [
            new bytes(0),
            new bytes(31),
            new bytes(32),
            new bytes(33),
            abi.encode(inventory.SUCCESS(), inventory.SUCCESS())
        ];
        for (uint256 i; i < replies.length; ++i) {
            bvm.mockCall(address(inventory), abi.encodeCall(inventory.noteRecord, (uintType, id)), replies[i]);
            vm.expectRevert(NativeRecordKernel.RecordInventoryUnavailable.selector);
            record.storeRecord(uintType, body);
            bvm.clearMockedCalls();
            vm.expectRevert(NativeRecordKernel.MissingRecord.selector);
            record.readRecord(id);
            eq(nav.typeInventory(uintType, start(), 64).ids.length, 0);
        }
        eq(record.storeRecord(uintType, body), id);
        eq(nav.typeInventory(uintType, start(), 64).ids.length, 1);
    }

    function testDirectContractProducerHasNoFilesAuthorityOrPlacement() public {
        RecordProducer producer = new RecordProducer();
        address record = address(k.recordKernel());
        vm.prank(address(0xBEEF));
        bytes32 id = producer.publish(GenericRecords(record), uintType, abi.encode(uint256(31)));
        eq(k.readRecord(id).body, abi.encode(uint256(31)));
        eq(nav.fileCount(address(producer)), 0);
        eq(nav.fileCount(address(0xBEEF)), 0);
        eq(k.fileNonce(address(producer)), 0);
        eq(k.fileNonce(address(0xBEEF)), 0);
        eq(nav.typeInventory(uintType, start(), 64).ids[0], id);
    }

    function testNoOpOrMissingNavigationCannotAcknowledgeFilesMutation() public {
        bytes32 root = k.ensureRoot();
        bytes memory code = address(nav).code;
        for (uint256 mode; mode < 2; ++mode) {
            vm.etch(address(nav), mode == 0 ? bytes("") : bytes(hex"00"));
            vm.expectRevert(NativeKernel.NavigationUnavailable.selector);
            k.createFile(root, "never", uintType, abi.encode(uint256(99)));
            eq(k.fileNonce(address(this)), 0);
        }
        vm.etch(address(nav), code);
        eq(k.lookup(address(this), root, "never"), bytes32(0));
        eq(nav.typeInventory(uintType, start(), 64).ids.length, 0);
    }

    function testRecordInventoryHasBoundedHighWaterAndSourceSpecificCursor() public {
        NativeRecordKernel record = k.recordKernel();
        RecordInventoryIndex inventory = k.recordInventory();
        bytes32 first = record.storeRecord(uintType, abi.encode(uint256(1)));
        bytes32 second = record.storeRecord(uintType, abi.encode(uint256(2)));
        RecordInventoryIndex.Page memory p = inventory.typeInventory(uintType, RecordInventoryIndex.Cursor(0, 0, 0), 1);
        eq(p.ids[0], first);
        yes(!p.complete);
        record.storeRecord(uintType, abi.encode(uint256(3)));
        RecordInventoryIndex.Page memory rest = inventory.typeInventory(uintType, p.next, 64);
        eq(rest.ids.length, 1);
        eq(rest.ids[0], second);
        yes(rest.complete);
        NavigationIndex.Page memory forwarded =
            nav.typeInventory(uintType, NavigationIndex.Cursor(p.next.scope, p.next.revision, p.next.offset), 64);
        eq(abi.encode(rest), abi.encode(forwarded));
        eq(p.next.scope, keccak256(abi.encode("EFS21_RECORDS", address(inventory), uintType)));
        p.next.scope = keccak256(abi.encode("EFS21_RECORDS", address(nav), uintType));
        vm.expectRevert(RecordInventoryIndex.InvalidCursor.selector);
        inventory.typeInventory(uintType, p.next, 64);
        vm.expectRevert(RecordInventoryIndex.InvalidLimit.selector);
        inventory.typeInventory(uintType, RecordInventoryIndex.Cursor(0, 0, 0), 65);
    }

    // Break caught: keeping bytes/inventory in Files, or admitting bytes via a Files callback.
    function testDirectAdmissionHasIndependentStorageWriterAndNoFilesEffects() public {
        (bool ok, bytes memory result) = address(k).staticcall(abi.encodeWithSignature("recordKernel()"));
        require(ok && result.length == 32, "missing generic Record boundary");
        address record = abi.decode(result, (address));
        address inventory = RecordBoundary(address(k)).recordInventory();
        require(record != address(k) && record.code.length != 0, "Record must own a distinct account");
        require(inventory != record && inventory != address(nav), "inventory must be distinct");
        eq(RecordBoundary(inventory).kernel(), record);
        bytes32 id = RecordBoundary(record).storeRecord(uintType, abi.encode(uint256(7)));
        eq(RecordBoundary(record).readRecord(id).body, abi.encode(uint256(7)));
        eq(k.readRecord(id).body, abi.encode(uint256(7)));
        eq(k.fileNonce(address(this)), 0);
        eq(nav.fileCount(address(this)), 0);
        eq(nav.fileCount(record), 0);
        bytes32 absentRoot = k.rootId(address(this));
        vm.expectRevert(NativeKernel.MissingFile.selector);
        k.fileInfo(absentRoot);
        vm.expectRevert(NativeKernel.InvalidRevision.selector);
        k.revisionAt(absentRoot, 1);
        eq(nav.typeInventory(uintType, start(), 64).ids.length, 1);
        eq(k.storeRecord(uintType, abi.encode(uint256(7))), id);
        bytes32 root = k.ensureRoot();
        bytes32 file = k.createFile(root, "same-record", uintType, abi.encode(uint256(7)));
        eq(k.fileInfo(file).recordId, id);
        eq(nav.typeInventory(uintType, start(), 64).ids.length, 1);
    }
}
