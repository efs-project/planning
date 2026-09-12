// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BodyStorageTest} from "./BodyStorage.t.sol";
import {NativeKernel} from "../src/NativeKernel.sol";
import {NavigationIndex} from "../src/NavigationIndex.sol";

contract PackedPresenceTest is BodyStorageTest {
    // forge inspect NativeKernel storage-layout: records root 3, reserved root 4,
    // locations root 5. address (20) + uint16 (2) puts explicit presence at byte 22.
    uint256 constant PRESENT = uint256(1) << 176;

    function metadata(bytes32 id) internal pure returns (bytes32) {
        return bytes32(uint256(keccak256(abi.encode(id, uint256(3)))) + 1);
    }

    function legacy(bytes32 id) internal pure returns (bytes32) {
        return keccak256(abi.encode(id, uint256(4)));
    }

    // Catches a separate existence SSTORE, and helper/inventory growth on dedup.
    function testPackedAdmissionLeavesLegacyEmptyAndDuplicateUnchanged() public {
        forceCode(); // Exact tag-zero encoding is the preserved code backend, not the selector.
        uint64 nonce = bvm.getNonce(writer);
        bytes32 id = kernel.storeRecord(rawType, hex"123456");
        require(hvm.load(address(kernel), legacy(id)) == 0, "legacy presence must remain zero");
        uint256 word = uint256(hvm.load(address(kernel), metadata(id)));
        eq(word, uint256(uint160(bvm.computeCreateAddress(writer, nonce))) | (uint256(3) << 160) | PRESENT);
        eq(kernel.storeRecord(rawType, hex"123456"), id);
        eq(uint256(hvm.load(address(kernel), metadata(id))), word);
        eq(bvm.getNonce(writer), nonce + 1);
        eq(kernel.navigation().typeInventory(rawType, NavigationIndex.Cursor(0, 0, 0), 64).ids.length, 1);
    }

    // A cleared flag is absence, not detectable corruption; even poisoned fields cannot override it.
    function testClearedPresenceIsMissingBeforeMalformedMetadata() public {
        bytes32 id = kernel.storeRecord(rawType, hex"abcd");
        bytes32 slot = metadata(id);
        bytes32 original = hvm.load(address(kernel), slot);
        hvm.store(address(kernel), slot, bytes32(uint256(original) & ~PRESENT));
        vm.expectRevert(NativeKernel.MissingRecord.selector);
        kernel.readRecord(id);
        hvm.store(address(kernel), slot, bytes32(uint256(65535) << 160));
        vm.expectRevert(NativeKernel.MissingRecord.selector);
        kernel.readRecord(id);
        hvm.store(address(kernel), slot, original);
        eq(kernel.readRecord(id).body, hex"abcd");
    }

    function testPresenceAloneCannotTurnUnknownIntoReadableRecord() public {
        bytes32 id = bytes32(uint256(1234));
        vm.expectRevert(NativeKernel.MissingRecord.selector);
        kernel.readRecord(id);
        hvm.store(address(kernel), metadata(id), bytes32(PRESENT));
        vm.expectRevert(NativeKernel.CorruptRecord.selector);
        kernel.readRecord(id);
    }

    function testEmptyPackedPresenceAndLateFailureRestoreAllState() public {
        bytes32 empty = kernel.storeRecord(rawType, "");
        yes((uint256(hvm.load(address(kernel), metadata(empty))) & PRESENT) != 0);
        eq(hvm.load(address(kernel), legacy(empty)), bytes32(0));
        eq(kernel.readRecord(empty).body, bytes(""));
        bytes32 root = kernel.ensureRoot();
        bytes32 file = kernel.createFile(root, "kept", rawType, hex"01");
        bytes32 beforeState = snapshot(root, file);
        bytes32 id = kernel.recordId(rawType, hex"02");
        address next = bvm.computeCreateAddress(writer, bvm.getNonce(writer));
        address discovery = address(kernel.discovery());
        bytes memory code = discovery.code;
        vm.etch(discovery, hex"60006000fd");
        vm.expectRevert(NativeKernel.DiscoveryUnavailable.selector);
        kernel.editFile(file, 1, rawType, hex"02");
        vm.etch(discovery, code);
        eq(snapshot(root, file), beforeState);
        eq(hvm.load(address(kernel), metadata(id)), bytes32(0));
        eq(hvm.load(address(kernel), legacy(id)), bytes32(0));
        eq(hvm.load(address(kernel), keccak256(abi.encode(id, uint256(3)))), bytes32(0));
        eq(next.code.length, 0);
        vm.expectRevert(NativeKernel.MissingRecord.selector);
        kernel.readRecord(id);
        vm.expectRevert(NativeKernel.InvalidRevision.selector);
        kernel.revisionAt(file, 2);
    }

    // Bounded mixed unique/duplicate edits against the frozen reviewed code-body control.
    function testFuzzPackedHistoryMatchesFrozenControl(uint64 seed) public {
        bytes memory code =
            hvm.parseJsonBytes(hvm.readFile("test/fixtures/native-kernel-58e61c4.json"), ".bytecode.object");
        address deployed;
        assembly ("memory-safe") { deployed := create(0, add(code, 32), mload(code)) }
        yes(deployed != address(0));
        NativeKernel control = NativeKernel(deployed);
        eq(control.types().register("EFS21 exact raw bytes v1", kernel.types().typeInfo(rawType).validator), rawType);
        bytes32 root = kernel.ensureRoot();
        bytes32 controlRoot = control.ensureRoot();
        bytes32 file = kernel.createFile(root, "sequence", rawType, "");
        bytes32 controlFile = control.createFile(controlRoot, "sequence", rawType, "");
        for (uint64 i = 1; i <= 8; ++i) {
            bytes memory body = abi.encode(uint256(seed), uint256(i / 2));
            kernel.editFile(file, i, rawType, body);
            control.editFile(controlFile, i, rawType, body);
            eq(abi.encode(kernel.fileInfo(file)), abi.encode(control.fileInfo(controlFile)));
            for (uint64 revision = 1; revision <= i + 1; ++revision) {
                NativeKernel.Revision memory a = kernel.revisionAt(file, revision);
                NativeKernel.Revision memory b = control.revisionAt(controlFile, revision);
                eq(a.parent, root);
                eq(b.parent, controlRoot);
                b.parent = root;
                eq(abi.encode(a), abi.encode(b));
                eq(abi.encode(kernel.readRecord(a.recordId)), abi.encode(control.readRecord(b.recordId)));
            }
        }
        NavigationIndex.Page memory page =
            kernel.navigation().typeInventory(rawType, NavigationIndex.Cursor(0, 0, 0), 64);
        NavigationIndex.Page memory controlPage =
            control.navigation().typeInventory(rawType, NavigationIndex.Cursor(0, 0, 0), 64);
        eq(abi.encode(page.ids), abi.encode(controlPage.ids));
        eq(page.ids.length, 6);
    }
}
