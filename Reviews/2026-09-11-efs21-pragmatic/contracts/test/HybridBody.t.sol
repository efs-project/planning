// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {BodyStorageTest} from "./BodyStorage.t.sol";
import {NativeKernel} from "../src/NativeKernel.sol";
import {BytesValidator} from "../src/ExactTypeRegistry.sol";

contract PolicyProbe is NativeKernel {
    function select(uint256 length, uint256 occupied) external pure returns (uint8) {
        return _selectBodyBackend(length, occupied);
    }
}

contract HybridBodyTest is BodyStorageTest {
    function testFuzzBothBackendsHistoryEqualsFrozenPacked(uint64 seed) public {
        bytes memory creation =
            hvm.parseJsonBytes(hvm.readFile("test/fixtures/native-kernel-f43501a.json"), ".bytecode.object");
        address deployed;
        assembly ("memory-safe") { deployed := create(0, add(creation, 32), mload(creation)) }
        NativeKernel control = NativeKernel(deployed);
        eq(control.types().register("EFS21 exact raw bytes v1", kernel.types().typeInfo(rawType).validator), rawType);
        bytes32 root = kernel.ensureRoot();
        bytes32 otherRoot = control.ensureRoot();
        bytes32 file = kernel.createFile(root, "same", rawType, "");
        bytes32 other = control.createFile(otherRoot, "same", rawType, "");
        for (uint64 revision = 1; revision <= 4; ++revision) {
            bytes memory body = new bytes(256);
            if (revision >= 3) {
                for (uint256 i; i < 256; ++i) {
                    // Modulo plus one bounds this value to 1..254 before narrowing.
                    // forge-lint: disable-next-line(unsafe-typecast)
                    body[i] = bytes1(uint8(uint256(seed) % 254 + 1));
                }
            } else {
                // Modulo plus one bounds this value to 1..254 before narrowing.
                // forge-lint: disable-next-line(unsafe-typecast)
                body[255] = bytes1(uint8(uint256(seed) % 254 + 1));
            }
            kernel.editFile(file, revision, rawType, body);
            control.editFile(other, revision, rawType, body);
            eq(abi.encode(kernel.fileInfo(file)), abi.encode(control.fileInfo(other)));
            for (uint64 j = 1; j <= revision + 1; ++j) {
                NativeKernel.Revision memory a = kernel.revisionAt(file, j);
                NativeKernel.Revision memory b = control.revisionAt(other, j);
                eq(a.parent, root);
                eq(b.parent, otherRoot);
                b.parent = root;
                eq(abi.encode(a), abi.encode(b));
                eq(abi.encode(kernel.readRecord(a.recordId)), abi.encode(control.readRecord(b.recordId)));
            }
        }
    }

    function meta(bytes32 id) internal pure returns (bytes32) {
        return bytes32(uint256(keccak256(abi.encode(id, uint256(3)))) + 1);
    }

    function wordSlot(bytes32 id, uint256 i) internal pure returns (bytes32) {
        return bytes32(uint256(keccak256(abi.encode(id, uint256(6)))) + i);
    }

    function testWordsMetadataAndHashCorruptionRefuseBoundedly() public {
        bytes memory body = new bytes(65);
        body[64] = 0x01;
        bytes32 id = kernel.storeRecord(rawType, body);
        bytes32 slot = meta(id);
        bytes32 original = hvm.load(address(kernel), slot);
        uint256[3] memory bad = [
            uint256(original) | (uint256(2) << 184),
            (uint256(original) & ~(uint256(65535) << 160)) | (uint256(65535) << 160),
            uint256(original) | uint256(123)
        ];
        for (uint256 i; i < bad.length; ++i) {
            hvm.store(address(kernel), slot, bytes32(bad[i]));
            vm.expectRevert(NativeKernel.CorruptRecord.selector);
            kernel.readRecord{gas: 100000}(id);
        }
        hvm.store(address(kernel), slot, original);
        bytes32 tail = wordSlot(id, 2);
        bytes32 word = hvm.load(address(kernel), tail);
        hvm.store(address(kernel), tail, bytes32(uint256(word) | 1));
        vm.expectRevert(NativeKernel.CorruptRecord.selector);
        kernel.readRecord(id);
        hvm.store(address(kernel), tail, bytes32(0));
        vm.expectRevert(NativeKernel.CorruptRecord.selector);
        kernel.readRecord(id);
        hvm.store(address(kernel), tail, bytes32(uint256(2) << 248));
        vm.expectRevert(NativeKernel.CorruptRecord.selector);
        kernel.readRecord(id);
        hvm.store(address(kernel), tail, word);
        bytes32 typeSlot = keccak256(abi.encode(id, uint256(3)));
        hvm.store(address(kernel), typeSlot, bytes32(uint256(123)));
        vm.expectRevert(NativeKernel.CorruptRecord.selector);
        kernel.readRecord(id);
        hvm.store(address(kernel), typeSlot, rawType);
        // Beyond authoritative range is deliberately not read or claimed detectable.
        hvm.store(address(kernel), wordSlot(id, 3), bytes32(uint256(123)));
        eq(kernel.readRecord(id).body, body);
        hvm.store(address(kernel), slot, bytes32(uint256(original) & ~(uint256(1) << 176)));
        vm.expectRevert(NativeKernel.MissingRecord.selector);
        kernel.readRecord(id);
    }

    function testTailMaskIgnoresCalldataAfterExactBody() public {
        bytes memory callData = abi.encodeCall(kernel.storeRecord, (rawType, hex"01"));
        callData[101] = 0xff; // First ABI padding byte, outside the one-byte body.
        (bool ok, bytes memory output) = address(kernel).call(callData);
        yes(ok);
        bytes32 id = abi.decode(output, (bytes32));
        eq(id, kernel.recordId(rawType, hex"01"));
        eq(hvm.load(address(kernel), wordSlot(id, 0)), bytes32(uint256(1) << 248));
        eq(kernel.readRecord(id).body, hex"01");
        eq(kernel.storeRecord(rawType, hex"01"), id);
    }

    function testWordDuplicatesValidateAndRequireHelperOnlyOnNewAdmission() public {
        bytes32 id = kernel.storeRecord(rawType, hex"01");
        bytes32 metadata = hvm.load(address(kernel), meta(id));
        uint64 nonce = bvm.getNonce(writer);
        bytes memory code = writer.code;
        vm.etch(writer, hex"00");
        eq(kernel.storeRecord(rawType, hex"01"), id);
        vm.expectRevert(NativeKernel.BodyWriterUnavailable.selector);
        kernel.storeRecord(rawType, hex"02");
        eq(bvm.getNonce(writer), nonce);
        eq(hvm.load(address(kernel), meta(id)), metadata);
        vm.etch(writer, code);
        address validator = kernel.types().typeInfo(rawType).validator;
        vm.etch(validator, hex"00");
        vm.expectRevert();
        kernel.storeRecord(rawType, hex"01");
    }

    function testIdenticalWordBodiesUnderDifferentTypesHaveIndependentStorage() public {
        bytes32 canonicalType = kernel.types().register("EFS21 canonical ABI bytes v1", address(new BytesValidator()));
        bytes memory body = abi.encode(bytes(""));
        bytes32 raw = kernel.storeRecord(rawType, body);
        bytes32 canonical = kernel.storeRecord(canonicalType, body);
        yes(raw != canonical);
        eq(uint256(hvm.load(address(kernel), meta(raw))) >> 184, 1);
        eq(uint256(hvm.load(address(kernel), meta(canonical))) >> 184, 1);
        hvm.store(address(kernel), wordSlot(raw, 0), bytes32(0));
        vm.expectRevert(NativeKernel.CorruptRecord.selector);
        kernel.readRecord(raw);
        eq(kernel.readRecord(canonical).body, body);
    }

    function testLateNameAndIndexFailuresRestoreBothChosenBackends() public {
        bytes32 root = kernel.ensureRoot();
        bytes32 file = kernel.createFile(root, "taken", rawType, hex"01");
        bytes32 beforeState = snapshot(root, file);
        for (uint256 backend; backend < 2; ++backend) {
            bytes memory body = new bytes(256);
            if (backend == 0) {
                for (uint256 i; i < body.length; ++i) {
                    body[i] = 0xef;
                }
            } else {
                body[255] = 0x01;
            }
            bytes32 id = kernel.recordId(rawType, body);
            for (uint256 failure; failure < 2; ++failure) {
                address discovery = address(kernel.discovery());
                bytes memory code = discovery.code;
                if (failure == 1) vm.etch(discovery, hex"00");
                vm.expectRevert();
                if (failure == 0) kernel.createFile(root, "taken", rawType, body);
                else kernel.editFile(file, 1, rawType, body);
                vm.etch(discovery, code);
                eq(snapshot(root, file), beforeState);
                eq(hvm.load(address(kernel), meta(id)), bytes32(0));
                eq(hvm.load(address(kernel), keccak256(abi.encode(id, uint256(3)))), bytes32(0));
                for (uint256 i; i < 8; ++i) {
                    eq(hvm.load(address(kernel), wordSlot(id, i)), bytes32(0));
                }
                eq(bvm.computeCreateAddress(writer, bvm.getNonce(writer)).code.length, 0);
                vm.expectRevert(NativeKernel.MissingRecord.selector);
                kernel.readRecord(id);
                vm.expectRevert(NativeKernel.InvalidRevision.selector);
                kernel.revisionAt(file, 2);
            }
        }
    }

    function testCalibratedPolicyUsesWordOccupancyAndCodeOnExactTie() public {
        bytes memory creation = vm.getCode("HybridBody.t.sol:PolicyProbe");
        address probe;
        assembly ("memory-safe") { probe := create(0, add(creation, 32), mload(creation)) }
        eq(PolicyProbe(probe).select(256, 3), 1);
        eq(PolicyProbe(probe).select(256, 4), 0);
        eq(PolicyProbe(probe).select(636, 7), 0);
        eq(PolicyProbe(probe).select(637, 7), 0);
        eq(PolicyProbe(probe).select(638, 7), 1);
    }

    // Catches always-code admission: empty and sparse bodies need no child or dynamic header.
    function testTinyAndZeroBodiesUseHeaderlessWordsWithoutChild() public {
        uint64 nonce = bvm.getNonce(writer);
        bytes32 empty = kernel.storeRecord(rawType, "");
        bytes32 tiny = kernel.storeRecord(rawType, hex"01");
        bytes32 zero = kernel.storeRecord(rawType, new bytes(4096));
        eq(bvm.getNonce(writer), nonce);
        eq(kernel.readRecord(empty).body, bytes(""));
        eq(kernel.readRecord(tiny).body, hex"01");
        eq(kernel.readRecord(zero).body, new bytes(4096));
        eq(hvm.load(address(kernel), keccak256(abi.encode(tiny, uint256(6)))), bytes32(uint256(1) << 248));
        eq(hvm.load(address(kernel), keccak256(abi.encode(zero, uint256(6)))), bytes32(0));
        bytes32 metadataSlot = bytes32(uint256(keccak256(abi.encode(empty, uint256(3)))) + 1);
        eq(uint256(hvm.load(address(kernel), metadataSlot)), (uint256(1) << 176) | (uint256(1) << 184));
    }
}
