// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {C0RunCodec as C} from "../src/C0RunCodec.sol";
import {MvpC0StateByteStore as Store} from "../src/MvpC0StateByteStore.sol";
import {CarrierHost} from "./CarrierHost.sol";
import {C0ChunkTree as Tree} from "../src/C0ChunkTree.sol";

contract StateByteStoreTest {
    bytes32 constant SEED = bytes32(uint256(1));
    bytes32 constant TYPE = 0x1111111111111111111111111111111111111111111111111111111111111111;
    CarrierHost host;
    Store store;

    function setUp() public {
        host = new CarrierHost();
        store = new Store(SEED, address(host), 16385, 4096);
    }

    function deployment() internal view returns (C.Deployment memory) {
        return C.Deployment(
            SEED,
            address(host),
            0,
            bytes32(uint256(2)),
            address(host).codehash,
            address(store),
            0,
            bytes32(uint256(3)),
            address(store).codehash
        );
    }

    function context(C.Deployment memory d, bytes32 s, bytes32 t, uint8 p) internal {
        host.setContext(s, C.experimentCommitment(d), t, p);
    }

    function rejected(address target, bytes memory callData) internal {
        (bool ok,) = target.call(callData);
        require(!ok, "accepted invalid operation");
    }

    function rejectSeal(C.Deployment memory d) internal {
        rejected(address(host), abi.encodeCall(host.seal, (store, C.encodeDeployment(d))));
        require(!store.isSealed(), "failed seal persisted");
    }

    function activate() internal {
        C.Deployment memory d = deployment();
        host.initialize(store, C.encodeDeployment(d), TYPE, false);
        context(d, SEED, TYPE, 3);
    }

    // Catches absent constructor guards before any seal can establish invalid immutable facts.
    function testConstructorRejectsInvalidFacts() public {
        for (uint256 i; i < 5; ++i) {
            bool ok;
            try new Store(
                i == 0 ? bytes32(0) : SEED,
                i == 1 ? address(0) : address(host),
                i == 2 ? 0 : 8,
                i == 3 ? 0 : i == 4 ? 9 : 4
            ) {
                ok = true;
            } catch {}
            require(!ok, "invalid constructor");
        }
    }

    function testSealPersistsExactFrozenFactsAndRejectsRepeat() public {
        C.Deployment memory d = deployment();
        bytes memory b = C.encodeDeployment(d);
        host.initialize(store, b, TYPE, false);
        require(store.isSealed(), "not sealed");
        require(store.experimentCommitment() == C.experimentCommitment(d), "wrong commitment");
        require(store.chunkTreeTypeId() == TYPE, "wrong type");
        require(keccak256(store.deploymentBytes()) == keccak256(b), "deployment lost");
        rejected(address(host), abi.encodeCall(host.seal, (store, b)));
    }

    function testUnauthorizedSealAndPutReject() public {
        context(deployment(), SEED, TYPE, 1);
        rejected(address(store), abi.encodeCall(store.sealFromCore, (C.encodeDeployment(deployment()))));
        activate();
        (bytes32 id, bytes memory body, bytes memory data) = vector(1);
        rejected(address(store), abi.encodeCall(store.putFromCore, (id, body, data)));
    }

    function testUnsealedPutRejects() public {
        context(deployment(), SEED, TYPE, 3);
        (bytes32 id, bytes memory body, bytes memory data) = vector(1);
        rejected(address(host), abi.encodeCall(host.put, (store, id, body, data)));
    }

    function testSealRejectsMismatchedDeploymentFacts() public {
        for (uint256 i; i < 5; ++i) {
            C.Deployment memory d = deployment();
            if (i == 0) d.experimentSeed = bytes32(uint256(9));
            if (i == 1) d.coreAddress = address(9);
            if (i == 2) d.byteStoreAddress = address(9);
            if (i == 3) d.coreRuntimeCodeHash = bytes32(uint256(9));
            if (i == 4) d.byteStoreRuntimeCodeHash = bytes32(uint256(9));
            context(d, d.experimentSeed, TYPE, 1);
            rejectSeal(d);
        }
    }

    function testSealRejectsWrongContextAndPhase() public {
        C.Deployment memory d = deployment();
        context(d, bytes32(uint256(9)), TYPE, 1);
        rejectSeal(d);
        host.setContext(SEED, bytes32(uint256(9)), TYPE, 1);
        rejectSeal(d);
        context(d, SEED, 0, 1);
        rejectSeal(d);
        for (uint8 p; p < 5; ++p) {
            if (p == 1) continue;
            context(d, SEED, TYPE, p);
            rejectSeal(d);
        }
    }

    function testSealRejectsMalformedPackedDeployment() public {
        bytes memory b = C.encodeDeployment(deployment());
        context(deployment(), SEED, TYPE, 1);
        rejected(address(host), abi.encodeCall(host.seal, (store, bytes.concat(b, hex"00"))));
        rejected(address(host), abi.encodeCall(host.seal, (store, bytes(""))));
    }

    function testEnclosingInitializeRollbackLeavesCarrierUnsealed() public {
        bytes memory b = C.encodeDeployment(deployment());
        rejected(address(host), abi.encodeCall(host.initialize, (store, b, TYPE, true)));
        require(!store.isSealed() && store.deploymentBytes().length == 0, "rollback leaked seal");
        host.initialize(store, b, TYPE, false);
        require(store.isSealed(), "retry after rollback failed");
    }

    // Literal body/root/ID expectations transcribed from fixtures/chunk-tree-known.json.
    // No implementation helper derives a valid expected body or RecordId.
    function vector(uint256 i) internal pure returns (bytes32 id, bytes memory body, bytes memory data) {
        if (i == 0) {
            return (
                0xa93083b1473bbe6fd33836a46c5d8290cba2c1e2017542d48c47d8f532aa9f84,
                hex"00040000000000000000000000000000f2ee15ea639b73fa3db9b34a245bdfa015c260c598b211bf05a1ecc4b3e3b4f2",
                ""
            );
        }
        if (i == 1) {
            return (
                0x87110d56143d39288704faa9bf67b56d92ae39c442d9cb0d56f271468d9d38d2,
                hex"00001000000000010000000000000005aa872873635ad305d25327a952b25396b95b3ddfcfd661ab26241a853f70451c",
                "hello"
            );
        }
        if (i == 2) {
            return (
                0xe178ba5c7fe788191fc0fe9d6b1302bc34d665977b30e78abbbe06cc655b7c98,
                hex"00001000000000020000000000001001113e8f5bd4119a204f74e0ac437d9f3ed438b80cdcb2ed69706621ee0a3e5bfd",
                pattern(4097)
            );
        }
        if (i == 3) {
            return (
                0xcc8d28193a623bf9bf7c2675674ad8bffac4f248bc6f783af2758b8d7df0c4de,
                hex"00001000000000030000000000002001e37bb5d72c61958b2f3e99451d13c8dd11df318bfbc49874b6e63cc419fa76ba",
                pattern(8193)
            );
        }
        return (
            0x639b6f1767d53a530e03a1390ff5cc5a08fe0a15f5a31c2496fa3eff66185194,
            hex"000010000000000500000000000040017b3b20a0317f809afdf2bfe894ff69253da2bf52d60aa2a1cb8aeeb740638c01",
            pattern(16385)
        );
    }

    function pattern(uint256 n) internal pure returns (bytes memory b) {
        b = new bytes(n);
        for (uint256 i; i < n; ++i) {
            b[i] = bytes1(uint8(i % 251));
        }
    }

    function putVector(uint256 i) internal returns (bytes32 id) {
        bytes memory body;
        bytes memory data;
        (id, body, data) = vector(i);
        host.put(store, id, body, data);
    }

    function rejectPut(bytes32 id, bytes memory body, bytes memory data) internal {
        rejected(address(host), abi.encodeCall(host.put, (store, id, body, data)));
    }

    function rejectRange(bytes32 id, uint64 offset, uint32 length) internal {
        rejected(address(store), abi.encodeCall(store.readRange, (id, offset, length)));
    }

    // Catches sorted pairs, duplicate-last padding, wrong hash domains, and wrong Record identity.
    function testIndependentTreeAndRecordVectors() public pure {
        for (uint256 i; i < 5; ++i) {
            (bytes32 id, bytes memory body, bytes memory data) = vector(i);
            bytes32 expectedRoot;
            assembly ("memory-safe") { expectedRoot := mload(add(body, 48)) }
            require(Tree.root(data, i == 0 ? 262144 : 4096) == expectedRoot, "wrong independent tree root");
            require(Tree.recordId(TYPE, body) == id, "wrong Stage A RecordId");
        }
    }

    function testStoresExactCompleteFilesAndCanonicalBodies() public {
        activate();
        for (uint256 i; i < 5; ++i) {
            (bytes32 id, bytes memory body, bytes memory data) = vector(i);
            host.put(store, id, body, data);
            (bool exists, bytes memory retained) = store.metadata(id);
            require(exists && keccak256(retained) == keccak256(body), "metadata lost");
            require(keccak256(store.read(id)) == keccak256(data), "file bytes lost");
        }
        require(store.entryCount() == 5 && store.totalStoredBytes() == 28680, "wrong unique totals");
    }

    function testMissingIsNotCanonicalEmpty() public {
        activate();
        (bool exists, bytes memory body) = store.metadata(bytes32(uint256(7)));
        require(!exists && body.length == 0, "invented metadata");
        rejected(address(store), abi.encodeCall(store.read, (bytes32(uint256(7)))));
        rejectRange(bytes32(uint256(7)), 0, 0);
        bytes32 empty = putVector(0);
        (exists, body) = store.metadata(empty);
        require(exists && body.length == 48 && store.read(empty).length == 0, "empty absent");
        require(store.readRange(empty, 0, 0).length == 0, "empty range");
        rejectRange(empty, 1, 0);
        rejectRange(empty, 0, 1);
    }

    function testFileCapAndCapPlusOne() public {
        // Five-chunk test cap is a laboratory input, not Task3's measurement cap.
        activate();
        bytes32 id = putVector(4);
        require(store.read(id).length == 16385, "file cap boundary");
        bytes memory body;
        (id, body,) = vector(4);
        rejectPut(id, body, pattern(16386));
        // The same otherwise-valid file must fail at a smaller carrier cap.
        store = new Store(SEED, address(host), 16384, 4096);
        activate();
        rejectPut(id, body, pattern(16385));
    }

    function testRejectMutatedDataGeometryPaddingAndRecordId() public {
        activate();
        (bytes32 id, bytes memory body, bytes memory data) = vector(1);
        rejectPut(bytes32(uint256(id) ^ 1), body, data);
        rejectPut(id, body, "jello");
        rejectPut(id, bytes.concat(body, hex"00"), data);
        rejectPut(id, abi.encode(uint32(4096), uint32(1), uint64(5), bytes32(0)), data);
        for (uint256 i; i < 48; ++i) {
            bytes memory bad = bytes.concat(body);
            bad[i] = bytes1(uint8(bad[i]) ^ 1);
            rejectPut(id, bad, data);
        }
        require(store.entryCount() == 0 && store.totalStoredBytes() == 0, "failed writes inflated totals");
    }

    // Recomputed IDs isolate geometry validation from the RecordId mismatch guard.
    function testRejectNoncanonicalGeometryEvenWithMatchingRecordId() public {
        activate();
        uint32[6] memory sizes = [uint32(0), 4095, 4097, 8388609, 8388608 + 4096, 4096];
        for (uint256 i; i < sizes.length; ++i) {
            bytes memory bad = abi.encodePacked(
                sizes[i],
                uint32(i == 5 ? 2 : 1),
                uint64(5),
                bytes32(0xaa872873635ad305d25327a952b25396b95b3ddfcfd661ab26241a853f70451c)
            );
            rejectPut(Tree.recordId(TYPE, bad), bad, "hello");
        }
        bytes memory emptyBad = abi.encodePacked(
            uint32(4096),
            uint32(0),
            uint64(0),
            bytes32(0xf2ee15ea639b73fa3db9b34a245bdfa015c260c598b211bf05a1ecc4b3e3b4f2)
        );
        rejectPut(Tree.recordId(TYPE, emptyBad), emptyBad, "");
        bytes memory wrongSize = abi.encodePacked(
            uint32(4096),
            uint32(1),
            uint64(6),
            bytes32(0xaa872873635ad305d25327a952b25396b95b3ddfcfd661ab26241a853f70451c)
        );
        rejectPut(Tree.recordId(TYPE, wrongSize), wrongSize, "hello");
        for (uint256 i; i < 2; ++i) {
            bytes memory bad = abi.encodePacked(
                uint32(4096),
                uint32(3),
                uint64(8193),
                i == 0
                    ? bytes32(0x9070dc814691f60983bea75674381f53ce49d7e39b1e7d286440449db1852398)
                    : bytes32(0xcc61919a562dd70f3c27fd6e426b7b46cedbe03235dec81e73e85ab041265495)
            );
            rejectPut(Tree.recordId(TYPE, bad), bad, pattern(8193));
        }
    }

    function testDuplicatePutsDoNotInflateAndConflictsReject() public {
        activate();
        bytes32 id = putVector(1);
        putVector(1);
        putVector(0);
        putVector(0);
        require(store.entryCount() == 2 && store.totalStoredBytes() == 5, "duplicate inflation");
        (, bytes memory body,) = vector(1);
        rejectPut(id, body, "jello");
        require(keccak256(store.read(id)) == keccak256("hello"), "conflict mutated bytes");
    }

    function testEveryNonRuntimePhaseAndChangedFrozenContextRejectWrites() public {
        activate();
        (bytes32 id, bytes memory body, bytes memory data) = vector(1);
        C.Deployment memory d = deployment();
        for (uint8 p; p < 5; ++p) {
            if (p == 3) continue;
            context(d, SEED, TYPE, p);
            rejectPut(id, body, data);
        }
        context(d, bytes32(uint256(9)), TYPE, 3);
        rejectPut(id, body, data);
        context(d, SEED, bytes32(uint256(9)), 3);
        rejectPut(id, body, data);
        host.setContext(SEED, bytes32(uint256(9)), TYPE, 3);
        rejectPut(id, body, data);
        context(d, SEED, TYPE, 3);
        host.put(store, id, body, data);
        context(d, SEED, TYPE, 2); // Pending receipt cannot even repeat a put.
        rejectPut(id, body, data);
        require(store.entryCount() == 1, "context test did not store");
    }

    function testRangeBoundsEOFZeroAndOverflow() public {
        activate();
        bytes32 id = putVector(2);
        bytes memory edge = store.readRange(id, 4095, 2);
        require(keccak256(edge) == keccak256(hex"4f50"), "cross-chunk range");
        require(store.readRange(id, 1, 4096).length == 4096, "range cap boundary");
        require(store.readRange(id, 4097, 0).length == 0, "EOF empty range");
        require(store.readRange(id, 0, 0).length == 0, "zero start");
        rejectRange(id, 0, 4097);
        rejectRange(id, 4097, 1);
        rejectRange(id, 4098, 0);
        rejectRange(id, type(uint64).max, 1);
        rejectRange(id, type(uint64).max, type(uint32).max);
    }

    function testInventoryBoundedAppendOnlyPagination() public {
        activate();
        (bytes32[] memory ids, uint256 next) = store.entries(0, 64);
        require(ids.length == 0 && next == 0, "empty inventory");
        for (uint256 i; i < 5; ++i) {
            putVector(i);
        }
        (ids, next) = store.entries(0, 2);
        (bytes32 first,,) = vector(0);
        (bytes32 second,,) = vector(1);
        require(ids.length == 2 && ids[0] == first && ids[1] == second && next == 2, "first page");
        (ids, next) = store.entries(2, 64);
        (bytes32 third,,) = vector(2);
        require(ids.length == 3 && ids[0] == third && next == 5, "last page");
        (ids, next) = store.entries(5, 1);
        require(ids.length == 0 && next == 5, "end cursor");
        rejected(address(store), abi.encodeCall(store.entries, (0, 0)));
        rejected(address(store), abi.encodeCall(store.entries, (0, 65)));
        rejected(address(store), abi.encodeCall(store.entries, (6, 1)));
        rejected(address(store), abi.encodeCall(store.entries, (type(uint256).max, 1)));
    }

    function testEnclosingPutRollbackLeavesNoBytesBodyOrInventory() public {
        activate();
        (bytes32 id, bytes memory body, bytes memory data) = vector(1);
        rejected(address(host), abi.encodeCall(host.putAndRevert, (store, id, body, data)));
        (bool exists, bytes memory retained) = store.metadata(id);
        require(
            !exists && retained.length == 0 && store.entryCount() == 0 && store.totalStoredBytes() == 0,
            "put rollback leak"
        );
        rejected(address(store), abi.encodeCall(store.read, (id)));
        (bytes32[] memory ids, uint256 next) = store.entries(0, 64);
        require(ids.length == 0 && next == 0, "rollback inventory leak");
        host.put(store, id, body, data);
        require(store.entryCount() == 1 && keccak256(store.read(id)) == keccak256(data), "rollback retry failed");
    }

    function testFuzzRangeSlice(uint16 rawOffset, uint16 rawLength) public {
        activate();
        bytes32 id = putVector(1);
        uint64 offset = uint64(rawOffset % 6);
        uint32 length = uint32(rawLength % (6 - offset));
        bytes memory got = store.readRange(id, offset, length);
        bytes memory expected = new bytes(length);
        bytes memory original = "hello";
        for (uint256 i; i < length; ++i) {
            expected[i] = original[offset + i];
        }
        require(keccak256(got) == keccak256(expected), "fuzz slice mismatch");
    }

    function testFuzzMutatedBytesRejected(uint16 index, uint8 delta) public {
        activate();
        (bytes32 id, bytes memory body, bytes memory data) = vector(2);
        uint256 at = uint256(index) % data.length;
        data[at] = bytes1(uint8(data[at]) ^ (delta == 0 ? 1 : delta));
        rejectPut(id, body, data);
        require(store.entryCount() == 0, "mutation stored");
    }
}
