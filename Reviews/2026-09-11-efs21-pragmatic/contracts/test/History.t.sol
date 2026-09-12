// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {TestBase} from "./TestBase.sol";
import {NativeKernel} from "../src/NativeKernel.sol";
import {NavigationIndex} from "../src/NavigationIndex.sol";
import {ExactTypeRegistry, Uint256Validator, BytesValidator} from "../src/ExactTypeRegistry.sol";

interface HistoryVm {
    struct Log {
        bytes32[] topics;
        bytes data;
        address emitter;
    }
    function readFile(string calldata) external view returns (string memory);
    function parseJsonBytes(string calldata, string calldata) external pure returns (bytes memory);
    function record() external;
    function accesses(address) external returns (bytes32[] memory, bytes32[] memory);
    function load(address, bytes32) external view returns (bytes32);
    function store(address, bytes32, bytes32) external;
    function snapshotState() external returns (uint256);
    function revertToState(uint256) external returns (bool);
    function recordLogs() external;
    function getRecordedLogs() external returns (Log[] memory);
}

contract HistoryTest is TestBase {
    HistoryVm constant hvm = HistoryVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    NativeKernel[2] kernels;
    bytes32[][2] ids;
    bytes32 uintType;
    bytes32 bytesType;
    address constant OTHER = address(0xBEEF);

    function setUp() public {
        bytes memory code =
            hvm.parseJsonBytes(hvm.readFile("test/fixtures/native-kernel-aa6b1b6.json"), ".bytecode.object");
        address baseline;
        assembly ("memory-safe") { baseline := create(0, add(code, 32), mload(code)) }
        require(baseline != address(0), "baseline deployment");
        kernels[0] = NativeKernel(baseline);
        kernels[1] = new NativeKernel();
        address u = address(new Uint256Validator());
        address b = address(new BytesValidator());
        for (uint256 arm; arm < 2; ++arm) {
            bytes32 ut = kernels[arm].types().register("history:uint256", u);
            bytes32 bt = kernels[arm].types().register("history:bytes", b);
            if (arm == 0) {
                uintType = ut;
                bytesType = bt;
            } else {
                eq(uintType, ut);
                eq(bytesType, bt);
            }
        }
    }

    function start() internal pure returns (NavigationIndex.Cursor memory) {
        return NavigationIndex.Cursor(0, 0, 0);
    }

    // Only deployment-qualified file IDs are normalized; Type/Record IDs stay exact.
    function logical(uint256 arm, bytes32 id) internal view returns (bytes32) {
        if (id == 0) return 0;
        for (uint256 i; i < ids[arm].length; ++i) {
            if (ids[arm][i] == id) return bytes32(i + 1);
        }
        revert("unmapped file");
    }

    function comparePage(NavigationIndex.Page memory a, NavigationIndex.Page memory b) internal view {
        eq(a.ids.length, b.ids.length);
        for (uint256 i; i < a.ids.length; ++i) {
            eq(logical(0, a.ids[i]), logical(1, b.ids[i]));
        }
        eq(a.next.revision, b.next.revision);
        eq(a.next.offset, b.next.offset);
        yes(a.complete == b.complete);
    }

    function compare() internal view {
        eq(kernels[0].fileNonce(address(this)), kernels[1].fileNonce(address(this)));
        comparePage(
            kernels[0].navigation().fileInventory(address(this), start(), 64),
            kernels[1].navigation().fileInventory(address(this), start(), 64)
        );
        for (uint256 t; t < 2; ++t) {
            bytes32 tid = t == 0 ? uintType : bytesType;
            NavigationIndex.Page memory a = kernels[0].navigation().typeInventory(tid, start(), 64);
            NavigationIndex.Page memory b = kernels[1].navigation().typeInventory(tid, start(), 64);
            eq(
                abi.encode(a.ids, a.next.revision, a.next.offset, a.complete),
                abi.encode(b.ids, b.next.revision, b.next.offset, b.complete)
            );
            for (uint256 r; r < a.ids.length; ++r) {
                eq(abi.encode(kernels[0].readRecord(a.ids[r])), abi.encode(kernels[1].readRecord(a.ids[r])));
            }
        }
        for (uint256 i; i < ids[0].length; ++i) {
            NativeKernel.FileInfo memory f = kernels[0].fileInfo(ids[0][i]);
            eq(abi.encode(f), abi.encode(kernels[1].fileInfo(ids[1][i])));
            for (uint64 r = 1; r <= f.revision; ++r) {
                NativeKernel.Revision memory a = kernels[0].revisionAt(ids[0][i], r);
                NativeKernel.Revision memory b = kernels[1].revisionAt(ids[1][i], r);
                a.parent = logical(0, a.parent);
                b.parent = logical(1, b.parent);
                eq(abi.encode(a), abi.encode(b));
            }
            NavigationIndex.Location memory la = kernels[0].navigation().location(ids[0][i]);
            NavigationIndex.Location memory lb = kernels[1].navigation().location(ids[1][i]);
            la.parent = logical(0, la.parent);
            lb.parent = logical(1, lb.parent);
            eq(abi.encode(la), abi.encode(lb));
            if (f.live && f.directory) {
                comparePage(
                    kernels[0].navigation().directoryPage(address(this), ids[0][i], start(), 64),
                    kernels[1].navigation().directoryPage(address(this), ids[1][i], start(), 64)
                );
                NativeKernel.DirectoryPage memory a = kernels[0].listDirectory(address(this), ids[0][i], start(), 64);
                NativeKernel.DirectoryPage memory b = kernels[1].listDirectory(address(this), ids[1][i], start(), 64);
                eq(a.entries.length, b.entries.length);
                for (uint256 j; j < a.entries.length; ++j) {
                    a.entries[j].id = logical(0, a.entries[j].id);
                    b.entries[j].id = logical(1, b.entries[j].id);
                    eq(abi.encode(a.entries[j]), abi.encode(b.entries[j]));
                }
            }
        }
    }

    function callPair(bytes memory a, bytes memory b, bool creates, bytes4 failure) internal {
        bytes[2] memory data = [a, b];
        HistoryVm.Log[][2] memory logs;
        bytes memory first;
        for (uint256 arm; arm < 2; ++arm) {
            hvm.recordLogs();
            (bool ok, bytes memory result) = address(kernels[arm]).call(data[arm]);
            logs[arm] = hvm.getRecordedLogs();
            if (failure == 0) {
                yes(ok);
                if (creates) ids[arm].push(abi.decode(result, (bytes32)));
            } else {
                yes(!ok);
                require(result.length >= 4, "missing revert selector");
                // Intentionally extract only the selector; full revert bytes are compared below.
                // forge-lint: disable-next-line(unsafe-typecast)
                eq(bytes32(bytes4(result)), bytes32(failure));
            }
            if (arm == 0) first = result;
            else if (!creates) eq(first, result);
        }
        eq(logs[0].length, logs[1].length);
        for (uint256 i; i < logs[0].length; ++i) {
            HistoryVm.Log memory x = logs[0][i];
            HistoryVm.Log memory y = logs[1][i];
            eq(x.emitter, address(kernels[0]));
            eq(
                y.emitter,
                y.topics[0] == keccak256("RecordStored(bytes32,bytes32)")
                    ? address(kernels[1].recordKernel())
                    : address(kernels[1])
            );
            if (x.topics[0] == keccak256("FileChanged(bytes32,address,uint64)")) {
                x.topics[1] = logical(0, x.topics[1]);
                y.topics[1] = logical(1, y.topics[1]);
            }
            eq(abi.encode(x.topics, x.data), abi.encode(y.topics, y.data));
        }
        compare();
    }

    function init() internal {
        callPair(abi.encodeCall(NativeKernel.ensureRoot, ()), abi.encodeCall(NativeKernel.ensureRoot, ()), true, 0);
    }

    function directory(bytes memory name) internal {
        callPair(
            abi.encodeCall(NativeKernel.createDirectory, (ids[0][0], name)),
            abi.encodeCall(NativeKernel.createDirectory, (ids[1][0], name)),
            true,
            0
        );
    }

    function create(bytes memory name, bytes32 tid, bytes memory body) internal {
        callPair(
            abi.encodeCall(NativeKernel.createFile, (ids[0][0], name, tid, body)),
            abi.encodeCall(NativeKernel.createFile, (ids[1][0], name, tid, body)),
            true,
            0
        );
    }

    function edit(uint256 f, uint64 r, bytes32 tid, bytes memory body, bytes4 failure) internal {
        callPair(
            abi.encodeCall(NativeKernel.editFile, (ids[0][f], r, tid, body)),
            abi.encodeCall(NativeKernel.editFile, (ids[1][f], r, tid, body)),
            false,
            failure
        );
    }

    function move(uint256 f, uint64 r, uint256 parent, bytes memory name, bytes4 failure) internal {
        callPair(
            abi.encodeCall(NativeKernel.moveFile, (ids[0][f], r, ids[0][parent], name)),
            abi.encodeCall(NativeKernel.moveFile, (ids[1][f], r, ids[1][parent], name)),
            false,
            failure
        );
    }

    function unlink(uint256 f, uint64 r, bytes4 failure) internal {
        callPair(
            abi.encodeCall(NativeKernel.unlink, (ids[0][f], r)),
            abi.encodeCall(NativeKernel.unlink, (ids[1][f], r)),
            false,
            failure
        );
    }

    // Catches copying immutable parent/name into every edit: 64-byte names must not allocate again.
    function testEditAllocatesOnlyTwoFreshHistoryWords() public {
        NativeKernel k = kernels[1];
        bytes32 root = k.ensureRoot();
        bytes32 f = k.createFile(
            root, "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", uintType, abi.encode(uint256(1))
        );
        uint256 snapshot = hvm.snapshotState();
        hvm.record();
        k.editFile(f, 1, uintType, abi.encode(uint256(1)));
        (, bytes32[] memory writes) = hvm.accesses(address(k));
        bytes32[] memory values = new bytes32[](writes.length);
        for (uint256 i; i < writes.length; ++i) {
            values[i] = hvm.load(address(k), writes[i]);
        }
        yes(hvm.revertToState(snapshot));
        uint256 fresh;
        for (uint256 i; i < writes.length; ++i) {
            bool duplicate;
            for (uint256 j; j < i; ++j) {
                if (writes[i] == writes[j]) duplicate = true;
            }
            if (!duplicate && values[i] != 0 && hvm.load(address(k), writes[i]) == 0) ++fresh;
        }
        require(fresh == 2, "edit must allocate exactly two fresh kernel words");
    }

    function sequence(uint256 seed, uint256 nameLength) internal {
        init();
        directory("destination");
        directory("empty");
        bytes memory name = new bytes(nameLength);
        for (uint256 i; i < nameLength; ++i) {
            name[i] = 0x78;
        }
        create(name, uintType, abi.encode(uint256(0))); // logical file 3
        create("isolated", bytesType, abi.encode(bytes(""))); // cross-file snapshot isolation
        for (uint64 r = 1; r <= 5; ++r) {
            edit(3, r, uintType, abi.encode(seed + r), 0);
        }
        edit(3, 6, uintType, abi.encode(seed + 5), 0); // same value still revises
        move(3, 7, 0, "rename", 0);
        move(3, 8, 1, name, 0);
        move(3, 9, 1, name, 0); // same place still revises and invalidates generation
        edit(3, 10, bytesType, abi.encode(bytes("")), 0);
        edit(4, 1, uintType, abi.encode(uint256(0)), 0);
        unlink(3, 11, 0);
        unlink(2, 1, 0);
        edit(3, 12, uintType, abi.encode(seed), NativeKernel.NotLive.selector);
        move(3, 12, 0, "dead", NativeKernel.NotLive.selector);
        unlink(3, 12, NativeKernel.NotLive.selector);
        create(name, uintType, abi.encode(uint256(0))); // new identity under old name
    }

    function testDifferentialNameBoundariesAndHistory() public {
        sequence(91, 1);
    }

    function testDifferentialName31() public {
        sequence(91, 31);
    }

    function testDifferentialName32() public {
        sequence(91, 32);
    }

    function testDifferentialName33() public {
        sequence(91, 33);
    }

    function testDifferentialName64() public {
        sequence(91, 64);
    }

    function testFuzzDifferentialHistory(uint64 seed, uint8 choice) public {
        uint256[5] memory lengths = [uint256(1), 31, 32, 33, 64];
        sequence(uint256(seed), lengths[choice % 5]);
    }

    function testDifferentialRollbackAndBounds() public {
        init();
        directory("destination");
        create("file", uintType, abi.encode(uint256(0)));
        create("occupied", uintType, abi.encode(uint256(1)));
        edit(2, 0, uintType, abi.encode(uint256(2)), NativeKernel.StaleRevision.selector);
        move(2, 0, 1, "stale", NativeKernel.StaleRevision.selector);
        unlink(2, 0, NativeKernel.StaleRevision.selector);
        move(2, 1, 0, "occupied", NavigationIndex.NameConflict.selector);
        move(2, 1, 0, "a/b", NativeKernel.InvalidName.selector);
        move(1, 1, 0, "renamed", NativeKernel.DirectoryMoveUnsupported.selector);
        unlink(0, 1, NativeKernel.RootRemovalUnsupported.selector);
        edit(2, 1, uintType, hex"00", ExactTypeRegistry.InvalidBody.selector);
        edit(2, 1, bytes32(uint256(123)), abi.encode(uint256(0)), ExactTypeRegistry.UnknownType.selector);
        callPair(
            abi.encodeCall(NativeKernel.createFile, (ids[0][0], bytes("occupied"), uintType, abi.encode(uint256(99)))),
            abi.encodeCall(NativeKernel.createFile, (ids[1][0], bytes("occupied"), uintType, abi.encode(uint256(99)))),
            false,
            NavigationIndex.NameConflict.selector
        );
        address validator = kernels[0].types().typeInfo(uintType).validator;
        bytes memory validatorCode = validator.code;
        vm.etch(validator, hex"00");
        edit(2, 1, uintType, abi.encode(uint256(0)), ExactTypeRegistry.ValidatorCodeChanged.selector);
        vm.etch(validator, validatorCode);
        for (uint256 arm; arm < 2; ++arm) {
            NativeKernel k = kernels[arm];
            for (uint256 op; op < 3; ++op) {
                vm.prank(OTHER);
                vm.expectRevert(NativeKernel.Unauthorized.selector);
                if (op == 0) k.editFile(ids[arm][2], 1, uintType, abi.encode(uint256(0)));
                if (op == 1) k.moveFile(ids[arm][2], 1, ids[arm][1], "stolen");
                if (op == 2) k.unlink(ids[arm][2], 1);
            }
            for (uint256 i; i < 3; ++i) {
                uint64 r = i == 0 ? 0 : i == 1 ? 2 : type(uint64).max;
                vm.expectRevert(NativeKernel.InvalidRevision.selector);
                k.revisionAt(ids[arm][2], r);
            }
        }
        compare();
        // Index failure after kernel writes must roll back newly allocated move snapshots too.
        bytes[2] memory code;
        for (uint256 arm; arm < 2; ++arm) {
            address nav = address(kernels[arm].navigation());
            code[arm] = nav.code;
            vm.etch(nav, hex"60006000fd");
        }
        for (uint256 arm; arm < 2; ++arm) {
            NativeKernel k = kernels[arm];
            vm.expectRevert();
            k.editFile(ids[arm][2], 1, uintType, abi.encode(uint256(0)));
            vm.expectRevert();
            k.moveFile(ids[arm][2], 1, ids[arm][1], "failed");
            vm.expectRevert();
            k.unlink(ids[arm][2], 1);
            vm.etch(address(k.navigation()), code[arm]);
        }
        compare();
        move(2, 1, 1, "succeeded", 0);
        // Both scopes are valid and have the SAME generation: only scope binding can reject.
        for (uint256 arm; arm < 2; ++arm) {
            NativeKernel k = kernels[arm];
            bytes32 a = k.createDirectory(ids[arm][0], "scope-a");
            bytes32 b = k.createDirectory(ids[arm][0], "scope-b");
            NavigationIndex.Page memory p = k.navigation().directoryPage(address(this), a, start(), 1);
            NavigationIndex.Page memory q = k.navigation().directoryPage(address(this), b, start(), 1);
            eq(p.next.revision, q.next.revision);
            NavigationIndex nav = k.navigation();
            vm.expectRevert(NavigationIndex.InvalidCursor.selector);
            nav.directoryPage(address(this), b, p.next, 1);
        }
    }

    // Synthetic unreachable-in-practice boundary, same private FileInfo/array-length slots
    // in both artifacts. Overflow must panic atomically, never wrap or replace snapshot 1.
    function testUint64RevisionOverflowRollback() public {
        init();
        create("limit", uintType, abi.encode(uint256(0)));
        for (uint256 arm; arm < 2; ++arm) {
            NativeKernel k = kernels[arm];
            bytes32 f = ids[arm][1];
            uint256 snapshot = hvm.snapshotState();
            bytes32 fileSlot = keccak256(abi.encode(f, uint256(1)));
            bytes32 historySlot = keccak256(abi.encode(f, uint256(2)));
            uint256 packed = uint256(hvm.load(address(k), fileSlot));
            uint256 mask = uint256(type(uint64).max) << 176;
            hvm.store(address(k), fileSlot, bytes32((packed & ~mask) | mask));
            hvm.store(address(k), historySlot, bytes32(uint256(type(uint64).max)));
            for (uint256 op; op < 3; ++op) {
                bytes memory input = op == 0
                    ? abi.encodeCall(NativeKernel.editFile, (f, type(uint64).max, uintType, abi.encode(uint256(0))))
                    : op == 1
                        ? abi.encodeCall(NativeKernel.moveFile, (f, type(uint64).max, ids[arm][0], bytes("overflow")))
                        : abi.encodeCall(NativeKernel.unlink, (f, type(uint64).max));
                (bool ok, bytes memory result) = address(k).call(input);
                yes(!ok);
                eq(result, abi.encodeWithSignature("Panic(uint256)", uint256(0x11)));
                eq(k.fileInfo(f).revision, type(uint64).max);
                eq(hvm.load(address(k), historySlot), bytes32(uint256(type(uint64).max)));
                eq(k.revisionAt(f, 1).name, bytes("limit"));
                eq(k.lookup(address(this), ids[arm][0], "overflow"), bytes32(0));
            }
            yes(hvm.revertToState(snapshot));
        }
        compare();
    }
}
