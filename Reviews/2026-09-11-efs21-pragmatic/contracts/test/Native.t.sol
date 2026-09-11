// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {TestBase} from "./TestBase.sol";
import {NativeKernel} from "../src/NativeKernel.sol";
import {NavigationIndex} from "../src/NavigationIndex.sol";
import {Uint256Validator, BytesValidator} from "../src/ExactTypeRegistry.sol";

contract FailIndex {
    fallback() external {
        revert("INDEX_UNAVAILABLE");
    }
}

contract NativeTest is TestBase {
    NativeKernel k;
    NavigationIndex nav;
    bytes32 uintType;
    bytes32 bytesType;
    bytes32 root;
    address constant OTHER = address(0xBEEF);

    function setUp() public {
        k = new NativeKernel();
        nav = k.navigation();
        uintType = k.types().register(bytes("quote:uint256"), address(new Uint256Validator()));
        bytesType = k.types().register(bytes("text:ABI-bytes"), address(new BytesValidator()));
    }

    function init() internal {
        root = k.ensureRoot();
    }

    function make(bytes memory name, uint256 value) internal returns (bytes32) {
        return k.createFile(root, name, uintType, abi.encode(value));
    }

    function start() internal pure returns (NavigationIndex.Cursor memory) {
        return NavigationIndex.Cursor(bytes32(0), 0, 0);
    }

    // Missing allocation, non-native owners, or failure to persist bytes breaks these.
    function testCreateRootDirectoryFileAndRead() public {
        init();
        eq(k.ensureRoot(), root);
        bytes32 dir = k.createDirectory(root, "folder");
        bytes32 f = k.createFile(dir, "quote", uintType, abi.encode(uint256(42)));
        eq(k.lookup(address(this), dir, "quote"), f);
        NativeKernel.FileInfo memory info = k.fileInfo(f);
        eq(info.owner, address(this));
        eq(info.revision, 1);
        yes(info.live && !info.directory);
        NativeKernel.Record memory r = k.readRecord(info.recordId);
        eq(r.typeId, uintType);
        eq(abi.decode(r.body, (uint256)), 42);
        yes(address(nav) != address(k));
        eq(nav.kernel(), address(k));
        eq(nav.location(f).name, bytes("quote"));
    }

    function testNativeCallerIsolationAndForeignParents() public {
        init();
        bytes32 f = make("one", 1);
        vm.prank(OTHER);
        bytes32 otherRoot = k.ensureRoot();
        yes(otherRoot != root);
        vm.prank(OTHER);
        vm.expectRevert();
        k.editFile(f, 1, uintType, abi.encode(uint256(2)));
        vm.prank(OTHER);
        vm.expectRevert();
        k.moveFile(f, 1, otherRoot, "stolen");
        vm.prank(OTHER);
        vm.expectRevert();
        k.unlink(f, 1);
        vm.prank(OTHER);
        vm.expectRevert();
        k.createDirectory(root, "foreign");
        vm.prank(OTHER);
        bytes32 otherFile = k.createFile(otherRoot, "one", uintType, abi.encode(uint256(2)));
        yes(otherFile != f);
        eq(k.lookup(OTHER, otherRoot, "one"), otherFile);
        vm.expectRevert();
        k.lookup(OTHER, root, "one");
        vm.expectRevert();
        k.createDirectory(f, "not-a-directory");
    }

    function testStableIdentityHistoryEditMoveUnlinkRecreate() public {
        init();
        bytes32 f = make("before", 1);
        bytes32 record1 = k.fileInfo(f).recordId;
        k.editFile(f, 1, uintType, abi.encode(uint256(2)));
        bytes32 record2 = k.fileInfo(f).recordId;
        bytes32 dir = k.createDirectory(root, "next");
        k.moveFile(f, 2, dir, "after");
        eq(k.lookup(address(this), root, "before"), bytes32(0));
        eq(k.lookup(address(this), dir, "after"), f);
        k.unlink(f, 3);
        NativeKernel.FileInfo memory info = k.fileInfo(f);
        yes(!info.live);
        eq(info.revision, 4);
        eq(info.recordId, record2);
        eq(k.lookup(address(this), dir, "after"), bytes32(0));
        NativeKernel.Revision memory r1 = k.revisionAt(f, 1);
        eq(r1.recordId, record1);
        eq(r1.name, bytes("before"));
        eq(r1.parent, root);
        yes(r1.live);
        NativeKernel.Revision memory r3 = k.revisionAt(f, 3);
        eq(r3.recordId, record2);
        eq(r3.name, bytes("after"));
        eq(r3.parent, dir);
        yes(r3.live);
        yes(!k.revisionAt(f, 4).live);
        eq(abi.decode(k.readRecord(record1).body, (uint256)), 1);
        vm.expectRevert();
        k.editFile(f, 4, uintType, abi.encode(uint256(3)));
        vm.expectRevert();
        k.moveFile(f, 4, root, "resurrect");
        vm.expectRevert();
        k.unlink(f, 4);
        bytes32 replacement = k.createFile(dir, "after", uintType, abi.encode(uint256(2)));
        yes(replacement != f);
    }

    function testStaleCASRejectsAllMutations() public {
        init();
        bytes32 f = make("x", 1);
        k.editFile(f, 1, uintType, abi.encode(uint256(2)));
        vm.expectRevert(NativeKernel.StaleRevision.selector);
        k.editFile(f, 1, uintType, abi.encode(uint256(3)));
        vm.expectRevert(NativeKernel.StaleRevision.selector);
        k.moveFile(f, 1, root, "y");
        vm.expectRevert(NativeKernel.StaleRevision.selector);
        k.unlink(f, 1);
        eq(k.fileInfo(f).revision, 2);
        eq(k.lookup(address(this), root, "x"), f);
    }

    function testRecordDedupTypeSeparationAndCrossDeployment() public {
        bytes memory body = abi.encode(uint256(7));
        bytes32 a = k.storeRecord(uintType, body);
        eq(a, keccak256(abi.encode(keccak256("EFS21_RECORD_V1"), uintType, body)));
        eq(k.storeRecord(uintType, body), a);
        bytes32 otherType = k.types().register(bytes("other:uint256"), address(new Uint256Validator()));
        yes(k.storeRecord(otherType, body) != a);
        NativeKernel second = new NativeKernel();
        bytes32 secondType = second.types().register(bytes("quote:uint256"), address(new Uint256Validator()));
        eq(secondType, uintType);
        eq(second.storeRecord(secondType, body), a);
        eq(nav.typeInventory(uintType, start(), 64).ids.length, 1);
    }

    function testInvalidBodyAtomicAndLimit() public {
        init();
        vm.expectRevert();
        k.createFile(root, "bad", uintType, hex"01");
        eq(k.lookup(address(this), root, "bad"), bytes32(0));
        vm.expectRevert();
        k.storeRecord(bytesType, abi.encode(new bytes(4096)));
        bytes32 r = k.storeRecord(bytesType, abi.encode(new bytes(4032)));
        eq(k.readRecord(r).body.length, 4096);
    }

    function testNestedPathMissingEmptyAndNonemptyRemoval() public {
        init();
        bytes32 a = k.createDirectory(root, "a");
        bytes32 b = k.createDirectory(a, "b");
        bytes32 f = k.createFile(b, "c", uintType, abi.encode(uint256(9)));
        bytes[] memory path = new bytes[](3);
        path[0] = "a";
        path[1] = "b";
        path[2] = "c";
        eq(k.resolve(address(this), path), f);
        path[2] = "missing";
        eq(k.resolve(address(this), path), bytes32(0));
        vm.expectRevert();
        k.unlink(b, 1);
        k.unlink(f, 1);
        NavigationIndex.Page memory page = nav.directoryPage(address(this), b, start(), 4);
        eq(page.ids.length, 0);
        yes(page.complete);
        k.unlink(b, 1);
        vm.expectRevert();
        nav.directoryPage(address(this), b, start(), 4);
        vm.expectRevert();
        nav.directoryPage(address(this), bytes32(uint256(99)), start(), 4);
        vm.expectRevert();
        k.moveFile(a, 1, a, "cycle");
        vm.expectRevert();
        k.unlink(root, 1);
    }

    function testNameConflictsAndBoundedGrammar() public {
        init();
        bytes32 f = make("same", 1);
        bytes32 other = make("other", 2);
        vm.expectRevert();
        make("same", 3);
        vm.expectRevert();
        k.createDirectory(root, "same");
        vm.expectRevert();
        k.moveFile(other, 1, root, "same");
        vm.expectRevert();
        make("", 1);
        vm.expectRevert();
        make(".", 1);
        vm.expectRevert();
        make("..", 1);
        vm.expectRevert();
        make("slash/name", 1);
        bytes memory longName = new bytes(65);
        for (uint256 i; i < longName.length; ++i) {
            longName[i] = 0x78;
        }
        vm.expectRevert(NativeKernel.InvalidName.selector);
        make(longName, 1);
        make("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", 1);
        vm.expectRevert();
        make(hex"00", 1);
        vm.expectRevert();
        make(hex"c3a9", 1);
        eq(k.lookup(address(this), root, "same"), f);
        bytes32 literal = make("percent%2F", 4);
        eq(k.lookup(address(this), root, "percent%2F"), literal);
    }

    function testLivePagesContinuationStaleAfterEditAndEmptyEnd() public {
        init();
        bytes32 a = make("a", 1);
        bytes32 b = make("b", 2);
        make("c", 3);
        NavigationIndex.Page memory p = nav.directoryPage(address(this), root, start(), 2);
        eq(p.ids.length, 2);
        yes(!p.complete);
        eq(p.ids[0], a);
        eq(p.ids[1], b);
        NavigationIndex.Page memory end = nav.directoryPage(address(this), root, p.next, 2);
        eq(end.ids.length, 1);
        yes(end.complete);
        k.editFile(a, 1, uintType, abi.encode(uint256(5)));
        vm.expectRevert();
        nav.directoryPage(address(this), root, p.next, 2);
        vm.expectRevert();
        nav.directoryPage(address(this), root, end.next, 2);
        NavigationIndex.Page memory fresh = nav.directoryPage(address(this), root, start(), 1);
        k.unlink(a, 2);
        vm.expectRevert();
        nav.directoryPage(address(this), root, fresh.next, 1);
        bytes32 empty = k.createDirectory(root, "empty");
        NavigationIndex.Page memory e = nav.directoryPage(address(this), empty, start(), 2);
        k.createFile(empty, "later", uintType, abi.encode(uint256(1)));
        vm.expectRevert();
        nav.directoryPage(address(this), empty, e.next, 2);
    }

    function testCursorsBoundScopeAndLimits() public {
        init();
        bytes32 dir = k.createDirectory(root, "dir");
        NavigationIndex.Page memory p = nav.directoryPage(address(this), root, start(), 1);
        vm.expectRevert();
        nav.directoryPage(address(this), dir, p.next, 1);
        vm.expectRevert();
        nav.directoryPage(OTHER, root, p.next, 1);
        vm.expectRevert();
        nav.directoryPage(address(this), root, start(), 0);
        vm.expectRevert();
        nav.directoryPage(address(this), root, start(), 65);
        p.next.offset = 99;
        vm.expectRevert();
        nav.directoryPage(address(this), root, p.next, 1);
    }

    function testHistoricalInventoriesPinnedHighAndUnlinkedRetained() public {
        init();
        bytes32 a = make("a", 1);
        bytes32 b = make("b", 2);
        NavigationIndex.Page memory p = nav.fileInventory(address(this), start(), 2);
        eq(p.ids[0], root);
        eq(p.ids[1], a);
        yes(!p.complete);
        k.unlink(b, 1);
        make("c", 3);
        NavigationIndex.Page memory rest = nav.fileInventory(address(this), p.next, 64);
        eq(rest.ids.length, 1);
        eq(rest.ids[0], b);
        yes(rest.complete);
        eq(nav.fileInventory(address(this), start(), 64).ids.length, 4);
        eq(nav.typeInventory(uintType, start(), 64).ids.length, 3);
        vm.expectRevert();
        nav.fileInventory(OTHER, p.next, 1);
        vm.expectRevert();
        nav.typeInventory(uintType, p.next, 1);
    }

    function testIndexOnlyKernelMutates() public {
        init();
        bytes32 f = make("a", 1);
        vm.expectRevert(NavigationIndex.OnlyKernel.selector);
        nav.addNode(address(this), bytes32(uint256(1)), root, "evil", false);
        vm.expectRevert(NavigationIndex.OnlyKernel.selector);
        nav.moveNode(f, root, "evil");
        vm.expectRevert(NavigationIndex.OnlyKernel.selector);
        nav.removeNode(f);
        vm.expectRevert(NavigationIndex.OnlyKernel.selector);
        nav.touchNode(f);
        vm.expectRevert(NavigationIndex.OnlyKernel.selector);
        nav.noteRecord(uintType, bytes32(uint256(1)));
        eq(k.lookup(address(this), root, "a"), f);
    }

    function testMandatoryIndexFailureRollsBackKernelRecordAndFile() public {
        init();
        bytes32 f = make("existing", 1);
        bytes memory indexCode = address(nav).code;
        vm.etch(address(nav), type(FailIndex).runtimeCode);
        bytes memory body = abi.encode(uint256(123));
        bytes32 rid = k.recordId(uintType, body);
        vm.expectRevert();
        k.editFile(f, 1, uintType, body);
        eq(k.fileInfo(f).revision, 1);
        vm.expectRevert();
        k.readRecord(rid);
        vm.expectRevert();
        k.createFile(root, "failed", uintType, body);
        vm.etch(address(nav), indexCode);
        eq(k.lookup(address(this), root, "failed"), bytes32(0));
        eq(nav.typeInventory(uintType, start(), 64).ids.length, 1);
        // Existing record bypasses record-admission writes but still MUST maintain live generation.
        bytes32 old = k.fileInfo(f).recordId;
        vm.etch(address(nav), type(FailIndex).runtimeCode);
        vm.expectRevert();
        k.editFile(f, 1, uintType, abi.encode(uint256(1)));
        eq(k.fileInfo(f).revision, 1);
        eq(k.fileInfo(f).recordId, old);
    }

    function testMissingReadsAndDepthLimit() public {
        vm.expectRevert();
        k.fileInfo(bytes32(uint256(99)));
        vm.expectRevert();
        k.readRecord(bytes32(uint256(99)));
        bytes[] memory none = new bytes[](0);
        eq(k.resolve(address(this), none), bytes32(0));
        init();
        eq(k.resolve(address(this), none), root);
        vm.expectRevert();
        k.revisionAt(root, 0);
        vm.expectRevert();
        k.revisionAt(root, 2);
        bytes[] memory tooDeep = new bytes[](33);
        vm.expectRevert();
        k.resolve(address(this), tooDeep);
    }

    function testFuzzRecordIdentityAndImmutableHistory(uint256 a, uint256 b) public {
        init();
        bytes32 f = make("fuzz", a);
        bytes32 original = k.fileInfo(f).recordId;
        k.editFile(f, 1, uintType, abi.encode(b));
        eq(k.revisionAt(f, 1).recordId, original);
        eq(abi.decode(k.readRecord(original).body, (uint256)), a);
        bytes32 latest = k.fileInfo(f).recordId;
        eq(latest, keccak256(abi.encode(keccak256("EFS21_RECORD_V1"), uintType, abi.encode(b))));
        if (a == b) eq(original, latest);
        else yes(original != latest);
    }

    function testHydratedDirectoryPage32AndStaleAfterRename() public {
        init();
        for (uint256 i; i < 32; ++i) {
            // 65 <= 65+i <= 96, hence the byte conversion cannot truncate.
            // forge-lint: disable-next-line(unsafe-typecast)
            make(abi.encodePacked(bytes1(uint8(65 + i))), i);
        }
        NativeKernel.DirectoryPage memory p = k.listDirectory(address(this), root, start(), 16);
        eq(p.entries.length, 16);
        yes(!p.complete);
        for (uint256 i; i < 16; ++i) {
            // 65 <= 65+i <= 80, hence the byte conversion cannot truncate.
            // forge-lint: disable-next-line(unsafe-typecast)
            eq(p.entries[i].name, abi.encodePacked(bytes1(uint8(65 + i))));
            eq(p.entries[i].file.owner, address(this));
            eq(p.entries[i].file.revision, 1);
            eq(abi.decode(k.readRecord(p.entries[i].file.recordId).body, (uint256)), i);
        }
        NativeKernel.DirectoryPage memory rest = k.listDirectory(address(this), root, p.next, 16);
        eq(rest.entries.length, 16);
        yes(rest.complete);
        eq(k.listDirectory(address(this), root, start(), 32).entries.length, 32);
        k.moveFile(p.entries[0].id, 1, root, "renamed");
        vm.expectRevert();
        k.listDirectory(address(this), root, rest.next, 16);
    }
}
