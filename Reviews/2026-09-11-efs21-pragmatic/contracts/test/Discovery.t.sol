// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {TestBase} from "./TestBase.sol";
import {LegacyNativeKernel as NativeKernel} from "./fixtures/legacy4cb/LegacyNativeKernel.sol";
import {LegacyUint256Validator as Uint256Validator, LegacyBytesValidator as BytesValidator, LegacyExactTypeRegistry as ExactTypeRegistry} from "./fixtures/legacy4cb/LegacyExactTypeRegistry.sol";
import {LegacyDiscoveryIndex as DiscoveryIndex, LegacyDiscoverySource as DiscoverySource} from "./fixtures/legacy4cb/LegacyDiscoveryIndex.sol";
import {LegacyNavigationIndex as NavigationIndex} from "./fixtures/legacy4cb/LegacyNavigationIndex.sol";

interface FaultVM {
    function mockCallRevert(address, bytes calldata, bytes calldata) external;
    function mockCall(address, bytes calldata, bytes calldata) external;
    function clearMockedCalls() external;
}

contract FaultDiscovery is DiscoveryIndex {
    uint256 public fault;
    uint256 public childWrite;
    constructor(NavigationIndex nav, ExactTypeRegistry registry) DiscoveryIndex(nav, registry) {}

    function setFault(uint256 value) external {
        fault = value;
    }

    function _maintain(address namespace, bytes32 id) internal override {
        super._maintain(namespace, id);
        if (fault == 1) {
            childWrite = 42;
            revert("after partial writes");
        }
        if (fault == 2) {
            childWrite = 42;
            assembly { for {} 1 {} { sstore(999, 1) } }
        }
        if (fault == 3) {
            bytes[] memory calls = new bytes[](6);
            calls[0] = abi.encodeCall(this.probe, (namespace, 1, 1, id));
            calls[1] = abi.encodeCall(this.page, (namespace, 1, 1, Cursor(0, 0, 0), 1));
            calls[2] = abi.encodeCall(this.status, (namespace));
            calls[3] = abi.encodeCall(this.attach, (bytes32(0), false));
            calls[4] = abi.encodeCall(this.restart, ());
            calls[5] = abi.encodeCall(this.backfill, (namespace, 1, 0, 1));
            for (uint256 i; i < calls.length; ++i) {
                (bool ok, bytes memory reason) = address(this).call(calls[i]);
                require(
                    !ok && keccak256(reason) == keccak256(abi.encodeWithSelector(Busy.selector)),
                    "partial state callback escaped"
                );
            }
        }
    }
}

/// @dev Test-only receipt fixture: actual kernel source, explicit fault coordinator owned by this driver.
contract DiscoveryFaultDriver {
    NativeKernel public immutable source;
    FaultDiscovery public immutable index;
    bytes32 public file;
    bytes32 public exactType;

    constructor(NativeKernel k) {
        source = k;
        index = new FaultDiscovery(k.navigation(), k.types());
    }

    function initialize(bytes32 t, bool required) external {
        require(file == 0);
        exactType = t;
        bytes32 root = source.ensureRoot();
        file = source.createFile(root, "fault file", t, abi.encode(uint256(1)));
        index.attach(t, required);
        index.backfill(address(this), 1, 0, 64);
    }

    function change(uint256 value, uint64 expected) external {
        source.editFile(file, expected, exactType, abi.encode(value));
        index.onFileChanged(address(this), file);
    }

    function changeOuterOOG(uint256 value, uint64 expected) external {
        source.editFile(file, expected, exactType, abi.encode(value));
        (bool ok,) = address(index).call{gas: 1000}(abi.encodeCall(index.onFileChanged, (address(this), file)));
        require(ok, "outer OOG fails closed");
    }

    function recover() external {
        index.setFault(0);
        index.restart();
        DiscoveryIndex.Profile memory p = index.status(address(this));
        index.backfill(address(this), p.epoch, 0, 64);
    }

    function fileInfo(bytes32 id) external view returns (DiscoverySource.FileInfo memory) {
        NativeKernel.FileInfo memory f = source.fileInfo(id);
        return DiscoverySource.FileInfo(f.owner, f.directory, f.live, f.revision, f.recordId);
    }

    function readRecord(bytes32 id) external view returns (DiscoverySource.Record memory) {
        NativeKernel.Record memory r = source.readRecord(id);
        return DiscoverySource.Record(r.typeId, r.body);
    }
}

interface DiscoveryAPI {
    struct Profile {
        bytes32 typeId;
        uint256 epoch;
        uint256 highWater;
        uint256 through;
        uint256 generation;
        uint8 health;
        bool required;
    }

    struct Cursor {
        bytes32 scope;
        uint256 generation;
        uint256 offset;
    }

    struct Page {
        bytes32[] ids;
        Cursor next;
        bool complete;
    }
    function attach(bytes32, bool) external;
    function restart() external;
    function detach() external;
    function status(address) external view returns (Profile memory);
    function backfill(address, uint256, uint256, uint256) external;
    function probe(address, uint256, uint256, bytes32) external view returns (uint8);
    function page(address, uint256, uint256, Cursor calldata, uint256) external view returns (Page memory);
}

contract DiscoveryTest is TestBase {
    FaultVM constant faults = FaultVM(address(uint160(uint256(keccak256("hevm cheat code")))));
    NativeKernel k;
    DiscoveryAPI d;
    bytes32 t;
    bytes32 root;

    function fileInfo(bytes32 id) external view returns (DiscoverySource.FileInfo memory) {
        NativeKernel.FileInfo memory f = k.fileInfo(id);
        return DiscoverySource.FileInfo(f.owner, f.directory, f.live, f.revision, f.recordId);
    }

    function readRecord(bytes32 id) external view returns (DiscoverySource.Record memory) {
        NativeKernel.Record memory r = k.readRecord(id);
        return DiscoverySource.Record(r.typeId, r.body);
    }

    function setUp() public {
        k = new NativeKernel();
        t = k.types().register("scalar", address(new Uint256Validator()));
        root = k.ensureRoot();
    }

    function discovery() internal {
        (bool ok, bytes memory result) = address(k).staticcall(abi.encodeWithSignature("discovery()"));
        require(ok && result.length == 32, "missing optional coordinator");
        d = DiscoveryAPI(abi.decode(result, (address)));
    }

    function make(bytes memory name, uint256 value) internal returns (bytes32) {
        return k.createFile(root, name, t, abi.encode(value));
    }

    // Removing late attachment/backfill loses old distinct files or confuses UNKNOWN with absence.
    function testLateAttachDuplicateZeroAndExactUniverse() public {
        bytes32 a = make("a", 0);
        bytes32 b = make("b", 0);
        k.createDirectory(root, "directory");
        k.storeRecord(t, abi.encode(uint256(99)));
        discovery();
        d.attach(t, false);
        DiscoveryAPI.Profile memory s = d.status(address(this));
        eq(s.highWater, 4);
        eq(s.through, 0);
        eq(s.health, 1);
        eq(d.probe(address(this), s.epoch, 0, a), 0); // UNKNOWN while building.
        DiscoveryAPI.Page memory p = d.page(address(this), s.epoch, 0, DiscoveryAPI.Cursor(0, 0, 0), 64);
        eq(p.ids.length, 0);
        yes(!p.complete);
        d.backfill(address(this), s.epoch, 0, 64);
        p = d.page(address(this), s.epoch, 0, DiscoveryAPI.Cursor(0, 0, 0), 64);
        eq(p.ids.length, 2);
        yes(p.complete);
        eq(p.ids[0], a);
        eq(p.ids[1], b);
        eq(d.probe(address(this), s.epoch, 0, a), 1);
        eq(d.probe(address(this), s.epoch, 99, a), 2);
        eq(d.status(address(this)).health, 2);
    }

    // A missed hook, duplicate insert, or stale source snapshot corrupts these exact sets.
    function testEditsUnlinksAndCreatesInterleaveWithBackfill() public {
        bytes32 a = make("a", 1);
        bytes32 b = make("b", 1);
        bytes32 c = make("c", 1);
        discovery();
        d.attach(t, true);
        k.editFile(a, 1, t, abi.encode(uint256(2)));
        k.unlink(b, 1);
        bytes32 t2 = k.types().register("other scalar", address(new Uint256Validator()));
        k.editFile(c, 1, t2, abi.encode(uint256(1)));
        bytes32 fresh = make("new", 2);
        d.backfill(address(this), 1, 0, 2);
        vm.expectRevert();
        d.backfill(address(this), 1, 0, 2);
        vm.expectRevert();
        d.backfill(address(this), 2, 2, 2);
        d.backfill(address(this), 1, 2, 64);
        DiscoveryAPI.Page memory p = d.page(address(this), 1, 2, DiscoveryAPI.Cursor(0, 0, 0), 64);
        eq(p.ids.length, 2);
        eq(p.ids[0], a);
        eq(p.ids[1], fresh);
        yes(p.complete);
        eq(d.probe(address(this), 1, 1, b), 2);
        eq(d.probe(address(this), 1, 1, c), 2);
        k.editFile(c, 2, t, abi.encode(uint256(2)));
        k.editFile(a, 2, t, abi.encode(uint256(2)));
        eq(d.page(address(this), 1, 2, DiscoveryAPI.Cursor(0, 0, 0), 64).ids.length, 3);
        k.editFile(a, 3, t, abi.encode(uint256(3)));
        k.unlink(fresh, 1);
        eq(d.page(address(this), 1, 2, DiscoveryAPI.Cursor(0, 0, 0), 64).ids.length, 1);
        eq(d.probe(address(this), 1, 3, a), 1);
    }

    // A cursor missing any identity/generation field would accept at least one foreign continuation.
    function testStaleForeignAndEndCursorsAndLimits() public {
        bytes32 a = make("a", 1);
        discovery();
        d.attach(t, false);
        d.backfill(address(this), 1, 0, 64);
        DiscoveryAPI.Cursor memory empty = DiscoveryAPI.Cursor(0, 0, 0);
        DiscoveryAPI.Page memory p = d.page(address(this), 1, 1, empty, 1);
        yes(p.complete);
        vm.expectRevert();
        d.page(address(this), 1, 2, p.next, 1);
        vm.expectRevert();
        d.page(address(this), 1, 1, empty, 0);
        vm.expectRevert();
        d.page(address(this), 1, 1, empty, 65);
        vm.expectRevert();
        d.page(address(this), 1, 1, DiscoveryAPI.Cursor(0, 1, 0), 1);
        k.moveFile(a, 1, root, "renamed");
        vm.expectRevert();
        d.page(address(this), 1, 1, p.next, 1);
        d.restart();
        vm.expectRevert();
        d.page(address(this), 1, 1, empty, 1);
        vm.expectRevert();
        d.page(address(this), 2, 1, p.next, 1);
        d.detach();
        vm.expectRevert();
        d.probe(address(this), 3, 1, a);
        d.attach(t, false);
        eq(d.status(address(this)).epoch, 4);
    }

    // Required child failure must roll back kernel, required navigation, and optional membership.
    function testRequiredChildFailureRollsBackAllThree() public {
        bytes32 a = make("a", 1);
        discovery();
        d.attach(t, true);
        d.backfill(address(this), 1, 0, 64);
        bytes memory beforeStatus = abi.encode(d.status(address(this)));
        NavigationIndex.Page memory beforeNav =
            k.navigation().directoryPage(address(this), root, NavigationIndex.Cursor(0, 0, 0), 64);
        faults.mockCallRevert(
            address(d), abi.encodeWithSignature("maintain(address,bytes32)", address(this), a), "child failed"
        );
        bytes32 rid = k.recordId(t, abi.encode(uint256(2)));
        vm.expectRevert();
        k.editFile(a, 1, t, abi.encode(uint256(2)));
        faults.clearMockedCalls();
        eq(k.fileInfo(a).revision, 1);
        vm.expectRevert();
        k.readRecord(rid);
        eq(abi.encode(d.status(address(this))), beforeStatus);
        eq(k.navigation().directoryPage(address(this), root, beforeNav.next, 64).ids.length, 0);
        eq(d.probe(address(this), 1, 1, a), 1);
        eq(d.probe(address(this), 1, 2, a), 2);
    }

    // Tolerated failure invalidates even previously observed positives and never self-heals.
    function testToleratedChildFailureDirtyAndFreshEpochRecovery() public {
        bytes32 a = make("a", 1);
        discovery();
        d.attach(t, false);
        d.backfill(address(this), 1, 0, 64);
        faults.mockCallRevert(
            address(d), abi.encodeWithSignature("maintain(address,bytes32)", address(this), a), "child failed"
        );
        k.editFile(a, 1, t, abi.encode(uint256(2)));
        faults.clearMockedCalls();
        eq(k.fileInfo(a).revision, 2);
        eq(d.status(address(this)).health, 3);
        vm.expectRevert();
        d.probe(address(this), 1, 1, a);
        vm.expectRevert();
        d.probe(address(this), 1, 2, a);
        vm.expectRevert();
        d.page(address(this), 1, 1, DiscoveryAPI.Cursor(0, 0, 0), 64);
        vm.expectRevert();
        d.backfill(address(this), 1, 3, 64);
        k.editFile(a, 2, t, abi.encode(uint256(3)));
        eq(d.status(address(this)).health, 3);
        d.restart();
        eq(d.status(address(this)).epoch, 2);
        eq(d.probe(address(this), 2, 3, a), 0);
        d.backfill(address(this), 2, 0, 64);
        eq(d.probe(address(this), 2, 3, a), 1);
        eq(d.probe(address(this), 2, 1, a), 2);
    }

    // The kernel must reject wrong fixed markers and malformed returns, even a successful CALL.
    function testOuterReturnFailureAtomic() public {
        bytes32 a = make("a", 1);
        discovery();
        d.attach(t, false);
        d.backfill(address(this), 1, 0, 64);
        bytes memory beforeStatus = abi.encode(d.status(address(this)));
        NavigationIndex.Page memory beforeNav =
            k.navigation().directoryPage(address(this), root, NavigationIndex.Cursor(0, 0, 0), 64);
        bytes memory input = abi.encodeWithSignature("onFileChanged(address,bytes32)", address(this), a);
        for (uint256 mode; mode < 3; ++mode) {
            faults.mockCall(
                address(d),
                input,
                mode == 0
                    ? abi.encode(uint256(7))
                    : mode == 1 ? bytes(hex"01") : abi.encode(keccak256("EFS21_DISCOVERY_OK"), uint256(0))
            );
            vm.expectRevert();
            k.editFile(a, 1, t, abi.encode(uint256(2)));
            faults.clearMockedCalls();
            eq(k.fileInfo(a).revision, 1);
            eq(abi.encode(d.status(address(this))), beforeStatus);
            eq(k.navigation().directoryPage(address(this), root, beforeNav.next, 64).ids.length, 0);
            eq(d.probe(address(this), 1, 1, a), 1);
        }
    }

    // A failed child frame must not leak partial writes; OOG must leave enough gas to mark DIRTY.
    function testActualChildPartialWriteAndOOGAreIsolated() public {
        bytes32 a = make("a", 1);
        FaultDiscovery fd = new FaultDiscovery(k.navigation(), k.types());
        fd.attach(t, false);
        fd.backfill(address(this), 1, 0, 64);
        for (uint256 mode = 1; mode <= 2; ++mode) {
            fd.setFault(mode);
            // The loop bounds mode to 1 or 2, so this conversion cannot truncate.
            // forge-lint: disable-next-line(unsafe-typecast)
            k.editFile(a, uint64(mode), t, abi.encode(mode + 1));
            fd.onFileChanged(address(this), a);
            eq(fd.childWrite(), 0);
            eq(uint256(fd.status(address(this)).health), 3);
            vm.expectRevert();
            fd.probe(address(this), mode, mode, a);
            fd.setFault(0);
            fd.restart();
            fd.backfill(address(this), mode + 1, 0, 64);
            eq(uint256(fd.probe(address(this), mode + 1, mode + 1, a)), 1);
        }
    }

    // A callback must not inspect membership or change configuration during child maintenance.
    function testCallbackCannotObservePartialStateOrReenter() public {
        bytes32 a = make("a", 1);
        FaultDiscovery fd = new FaultDiscovery(k.navigation(), k.types());
        fd.attach(t, true);
        fd.setFault(3);
        fd.backfill(address(this), 1, 0, 64);
        fd.onFileChanged(address(this), a);
        eq(uint256(fd.probe(address(this), 1, 1, a)), 1);
    }

    // Namespace attachment is caller-scoped, never permissionless taxation of another namespace.
    function testAuthorizationTypeValidationAndDetachedSemantics() public {
        bytes32 a = make("a", 1);
        discovery();
        bytes32 bt = k.types().register("bytes", address(new BytesValidator()));
        vm.expectRevert();
        d.attach(bt, false);
        vm.expectRevert();
        d.attach(bytes32(uint256(999)), false);
        vm.prank(address(0xBEEF));
        d.attach(t, true);
        eq(d.status(address(this)).health, 0);
        d.attach(t, false);
        vm.expectRevert();
        d.attach(t, true);
        vm.expectRevert();
        DiscoveryIndex(address(d)).onFileChanged(address(this), a);
        vm.expectRevert();
        DiscoveryIndex(address(d)).maintain(address(this), a);
        vm.prank(address(0xBEEF));
        d.detach();
        eq(d.status(address(this)).epoch, 1);
        vm.expectRevert();
        d.page(address(0xBEEF), 2, 1, DiscoveryAPI.Cursor(0, 0, 0), 1);
        vm.expectRevert();
        d.backfill(address(this), 1, 0, 0);
        vm.expectRevert();
        d.backfill(address(this), 1, 0, 65);
        vm.prank(address(0xCAFE));
        d.backfill(address(this), 1, 0, 64);
        eq(d.probe(address(this), 1, 1, a), 1);
    }

    // An outer revert/code substitution/starvation is never a tolerated maintenance failure.
    function testOuterFailureCodeIdentityAndInsufficientGasRollBack() public {
        bytes32 a = make("a", 1);
        discovery();
        d.attach(t, false);
        d.backfill(address(this), 1, 0, 64);
        bytes memory beforeStatus = abi.encode(d.status(address(this)));
        NavigationIndex nav = k.navigation();
        NavigationIndex.Page memory beforeNav =
            nav.directoryPage(address(this), root, NavigationIndex.Cursor(0, 0, 0), 64);
        bytes memory body = abi.encode(uint256(2));
        bytes32 rid = k.recordId(t, body);
        faults.mockCallRevert(
            address(d), abi.encodeWithSignature("onFileChanged(address,bytes32)", address(this), a), "outer fail"
        );
        vm.expectRevert();
        k.editFile(a, 1, t, body);
        faults.clearMockedCalls();
        bytes memory code = address(d).code;
        vm.etch(address(d), hex"60006000fd");
        vm.expectRevert();
        k.editFile(a, 1, t, body);
        vm.etch(address(d), code);
        // Enough to reach the coordinator, insufficient for its reserved child budget.
        (bool ok,) = address(k).call{gas: 500000}(abi.encodeCall(k.editFile, (a, 1, t, body)));
        yes(!ok);
        eq(k.fileInfo(a).revision, 1);
        vm.expectRevert();
        k.readRecord(rid);
        eq(abi.encode(d.status(address(this))), beforeStatus);
        eq(nav.directoryPage(address(this), root, beforeNav.next, 64).ids.length, 0);
        eq(d.probe(address(this), 1, 1, a), 1);
        eq(d.probe(address(this), 1, 2, a), 2);
    }

    // New namespaces and new source ordinals must be maintained after an empty captured high-water.
    function testAttachBeforeRootAndForeignQualifiedCursor() public {
        discovery();
        d.attach(t, false);
        d.backfill(address(this), 1, 0, 64);
        DiscoveryAPI.Cursor memory cursor = d.page(address(this), 1, 0, DiscoveryAPI.Cursor(0, 0, 0), 64).next;
        address other = address(0xBEEF);
        vm.prank(other);
        d.attach(t, false);
        eq(d.status(other).highWater, 0);
        eq(d.status(other).health, 2);
        vm.prank(other);
        bytes32 otherRoot = k.ensureRoot();
        vm.prank(other);
        bytes32 dir = k.createDirectory(otherRoot, "dir");
        vm.prank(other);
        bytes32 f = k.createFile(dir, "file", t, abi.encode(uint256(0)));
        eq(d.probe(other, 1, 0, f), 1);
        eq(d.status(other).generation, 4);
        vm.expectRevert();
        d.page(other, 1, 0, cursor, 64);
        NativeKernel second = new NativeKernel();
        second.types().register("scalar", address(new Uint256Validator()));
        DiscoveryIndex otherIndex = second.discovery();
        otherIndex.attach(t, false);
        vm.expectRevert();
        otherIndex.page(address(this), 1, 0, DiscoveryIndex.Cursor(cursor.scope, cursor.generation, cursor.offset), 64);
    }

    // Backfill failure cannot advance to READY or permit continuation of a DIRTY epoch.
    function testBackfillFailureAndMalformedChildCannotQualify() public {
        make("a", 1);
        FaultDiscovery fd = new FaultDiscovery(k.navigation(), k.types());
        fd.attach(t, false);
        fd.setFault(1);
        fd.backfill(address(this), 1, 0, 64);
        eq(uint256(fd.status(address(this)).health), 3);
        eq(fd.status(address(this)).through, 0);
        vm.expectRevert();
        fd.backfill(address(this), 1, 0, 64);
        fd.setFault(0);
        fd.restart();
        fd.backfill(address(this), 2, 0, 64);
        eq(uint256(fd.status(address(this)).health), 2);
        discovery();
        d.attach(t, false);
        d.backfill(address(this), 1, 0, 64);
        bytes32 a = k.lookup(address(this), root, "a");
        faults.mockCall(
            address(d), abi.encodeWithSignature("maintain(address,bytes32)", address(this), a), abi.encode(uint256(7))
        );
        k.editFile(a, 1, t, abi.encode(uint256(2)));
        faults.clearMockedCalls();
        eq(d.status(address(this)).health, 3);
        vm.expectRevert();
        d.probe(address(this), 1, 1, a);
    }
}
