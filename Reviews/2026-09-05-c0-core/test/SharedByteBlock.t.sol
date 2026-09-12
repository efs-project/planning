// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {StateKernelTest} from "./StateKernel.t.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StateStore} from "../src/StateStore.sol";
import {StorageByteView} from "../src/StorageByteView.sol";
import {Preparation} from "../src/Preparation.sol";

interface VmSharedBlock {
    function load(address, bytes32) external view returns (bytes32);
    function getNonce(address) external view returns (uint64);
    function etch(address, bytes calldata) external;
    function record() external;
    function accesses(address) external returns (bytes32[] memory, bytes32[] memory);
}

contract SharedBlockViewHarness {
    StateStore.Store private s;

    function seed(uint256 refWord, uint64 ordinal, bytes32 typeId, uint64 first) external {
        s.records[bytes32(uint256(1))] = StateStore.RecordCell(typeId, refWord, ordinal, first);
    }

    function read() external view returns (StateStore.RecordRow memory) {
        return StateStore.recordRow(s, bytes32(uint256(1)));
    }

    function slice(uint256 at, uint256 n) external view returns (bytes memory) {
        return StateStore.recordSlice(s, bytes32(uint256(1)), at, n, bytes32(uint256(1)));
    }

    function short(uint256 at) external view returns (uint16) {
        return StateStore.recordShort(s, bytes32(uint256(1)), at, bytes32(uint256(1)));
    }

    function seedEnvelope(address pointer, uint16 offset, uint16 n, uint16 extent, uint48 ordinal) external {
        s.envelopes[bytes32(uint256(1))] = StateStore.EnvelopeCell(pointer, offset, n, extent, ordinal);
    }

    function envelope() external view returns (StateStore.EnvelopeRow memory) {
        return StateStore.envelopeRow(s, bytes32(uint256(1)));
    }
}

contract SharedByteBlockTest is StateKernelTest {
    VmSharedBlock constant blockVm = VmSharedBlock(address(uint160(uint256(keccak256("hevm cheat code")))));

    // Catches per-Record payload storage and per-row code allocation in real admission.
    function testNewEnvelopeAndTwoRecordsShareOneExactBlock() public {
        install();
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](2);
        leaves[0] = objectLeaf(0);
        leaves[1] = StateKernel.SelectedLeaf(1, objectType, abi.encodePacked(AUTHOR, bytes32(uint256(2)), hex"00"));
        StateKernel.Publication memory p = request(leaves, 92001);
        uint64 beforeNonce = blockVm.getNonce(h.preparationHelper());
        h.publishTrustedForTest(verified(), p);
        bytes memory envelope = abi.encode(p.header, p.recordIds);
        bytes32 envelopeSlot = keccak256(abi.encode(p.envelopeId, uint256(13)));
        uint256 envelopeCell = uint256(blockVm.load(address(h), envelopeSlot));
        address pointer = address(uint160(envelopeCell));
        require(blockVm.getNonce(h.preparationHelper()) == beforeNonce + 1, "one helper CREATE");
        require(
            keccak256(pointer.code) == keccak256(bytes.concat(hex"00", envelope, leaves[0].body, leaves[1].body)),
            "one shared exact payload"
        );
        for (uint256 i; i < 2; ++i) {
            bytes32 slot = keccak256(abi.encode(p.recordIds[i], uint256(12)));
            uint256 refWord = uint256(blockVm.load(address(h), bytes32(uint256(slot) + 1)));
            require(address(uint160(refWord)) == pointer, "Record shares Envelope pointer");
            require(uint16(refWord >> 160) == envelope.length + 65 * i, "first-seen unaligned slice");
            require(uint16(refWord >> 176) == 65, "exact Record length");
            require(
                uint16(refWord >> 192) == envelope.length + 130 && refWord >> 208 == 0, "whole extent and reserved bits"
            );
            require(
                blockVm.load(address(h), keccak256(abi.encode(uint256(slot) + 1))) == 0,
                "no old dynamic Record body write"
            );
            StateStore.RecordRow memory row = h.record(p.recordIds[i]);
            require(
                row.typeId == objectType && keccak256(row.body) == keccak256(leaves[i].body), "logical Record exact"
            );
        }
        require(
            keccak256(h.envelope(p.envelopeId).canonicalUnsignedEnvelope) == keccak256(envelope),
            "logical Envelope exact"
        );
    }

    function testRecordsOnlyPartialAllocatesOnceAndNeverRewritesEnvelope() public {
        install();
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](2);
        leaves[0] = objectLeaf(0);
        leaves[1] = StateKernel.SelectedLeaf(1, objectType, abi.encodePacked(AUTHOR, bytes32(uint256(3)), hex"00"));
        StateKernel.Publication memory p = request(leaves, 92002);
        StateKernel.Publication memory first = abi.decode(abi.encode(p), (StateKernel.Publication));
        first.leaves = new StateKernel.SelectedLeaf[](1);
        first.leaves[0] = leaves[0];
        first.leafMask = 1;
        h.publishTrustedForTest(verified(), first);
        bytes32 slot = keccak256(abi.encode(p.envelopeId, uint256(13)));
        bytes32 beforeCell = blockVm.load(address(h), slot);
        uint64 nonce = blockVm.getNonce(h.preparationHelper());
        h.publishTrustedForTest(verified(), p);
        require(blockVm.getNonce(h.preparationHelper()) == nonce + 1, "records-only CREATE");
        require(blockVm.load(address(h), slot) == beforeCell, "Envelope cell retained");
        uint256 refWord =
            uint256(blockVm.load(address(h), bytes32(uint256(keccak256(abi.encode(p.recordIds[1], uint256(12)))) + 1)));
        require(uint16(refWord >> 160) == 0 && uint16(refWord >> 192) == 65, "records-only extent");
        require(
            keccak256(address(uint160(refWord)).code) == keccak256(bytes.concat(hex"00", leaves[1].body)),
            "records-only exact payload"
        );
        require(h.counts().admissions == 4 && h.record(p.recordIds[1]).recordOrdinal == 4, "all logical facts retained");
    }

    function testRecordsOnlyAllocationChecksWrongAndEmptyHelperBeforeWrites() public {
        install();
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](2);
        leaves[0] = objectLeaf(0);
        leaves[1] = StateKernel.SelectedLeaf(1, objectType, abi.encodePacked(AUTHOR, bytes32(uint256(4)), hex"00"));
        StateKernel.Publication memory p = request(leaves, 92003);
        StateKernel.Publication memory first = abi.decode(abi.encode(p), (StateKernel.Publication));
        first.leaves = new StateKernel.SelectedLeaf[](1);
        first.leaves[0] = leaves[0];
        first.leafMask = 1;
        h.publishTrustedForTest(verified(), first);
        p.leaves = new StateKernel.SelectedLeaf[](1);
        p.leaves[0] = leaves[1];
        p.leafMask = 2;
        bytes32 state = snapshot();
        address helper = h.preparationHelper();
        bytes memory code = helper.code;
        for (uint256 i; i < 2; ++i) {
            blockVm.etch(helper, i == 0 ? bytes(hex"00") : bytes(hex""));
            blockVm.record();
            (bool ok, bytes memory error) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), p)));
            (, bytes32[] memory writes) = blockVm.accesses(address(h));
            require(
                !ok && bytes4(error) == Preparation.HelperIdentity.selector && writes.length == 0,
                "records-only early identity refusal"
            );
        }
        blockVm.etch(helper, code);
        require(snapshot() == state, "no admission effect");
    }

    function testPhysicalReferenceFaultsAndUnalignedSubranges() public {
        SharedBlockViewHarness v = new SharedBlockViewHarness();
        address pointer = address(0xB10C);
        bytes memory payload = new bytes(68);
        payload[3] = 0x12;
        payload[4] = 0x34;
        payload[67] = 0xab;
        blockVm.etch(pointer, bytes.concat(hex"00", payload));
        uint256 good = uint256(uint160(pointer)) | (uint256(3) << 160) | (uint256(65) << 176) | (uint256(68) << 192);
        v.seed(good, 1, bytes32(uint256(7)), 1);
        require(v.read().body.length == 65 && v.short(0) == 0x1234, "unaligned logical starts");
        require(keccak256(v.slice(64, 1)) == keccak256(hex"ab"), "exact tail subrange");
        reject(address(v), abi.encodeCall(v.slice, (64, 2)));
        reject(address(v), abi.encodeCall(v.slice, (type(uint256).max, 1)));
        reject(address(v), abi.encodeCall(v.short, (64)));
        for (uint256 i; i < 10; ++i) {
            blockVm.etch(pointer, bytes.concat(hex"00", payload));
            uint256 bad = good;
            if (i == 0) bad |= uint256(1) << 208;
            if (i == 1) bad = good & ~uint256(type(uint160).max);
            if (i == 2) bad = (good & ~(uint256(65535) << 160)) | (uint256(69) << 160);
            if (i == 3) bad = (good & ~(uint256(65535) << 176)) | (uint256(66) << 176);
            if (i == 4) bad = (good & ~(uint256(65535) << 192)) | (uint256(10497) << 192);
            if (i == 5) blockVm.etch(pointer, hex"");
            if (i == 6) blockVm.etch(pointer, bytes.concat(hex"01", payload));
            if (i == 7) blockVm.etch(pointer, bytes.concat(hex"00", payload, hex"00"));
            if (i == 8) blockVm.etch(pointer, bytes.concat(hex"00", new bytes(67)));
            v.seed(bad, i == 9 ? 0 : 1, bytes32(uint256(7)), 1);
            reject(address(v), abi.encodeCall(v.read, ()));
        }
        blockVm.etch(pointer, bytes.concat(hex"00", payload));
        // Shape integrity deliberately does not authenticate content identity.
        v.seed(good - (uint256(1) << 160), 1, bytes32(uint256(7)), 1);
        require(v.short(0) == 0x0012, "contained wrong slice is not a hash proof");
        address other = address(0xB10E);
        payload[3] = 0x56;
        blockVm.etch(other, bytes.concat(hex"00", payload));
        v.seed((good & ~uint256(type(uint160).max)) | uint256(uint160(other)), 1, bytes32(uint256(7)), 1);
        require(v.short(0) == 0x5634, "same-sized pointer swap is not a hash proof");
        blockVm.etch(pointer, hex"00");
        v.seed(uint256(uint160(pointer)), 1, bytes32(uint256(7)), 1);
        require(v.read().body.length == 0 && v.read().recordOrdinal == 1, "present empty STOP block");
        v.seed(0, 0, 0, 0);
        require(v.read().recordOrdinal == 0, "absent zero cell");
    }

    function testEnvelopeOffsetExtentAndPhysicalOrdinalGuards() public {
        SharedBlockViewHarness v = new SharedBlockViewHarness();
        address pointer = address(0xB10D);
        blockVm.etch(pointer, bytes.concat(hex"00", new bytes(10496)));
        v.seedEnvelope(pointer, 0, 288, 10496, type(uint48).max - 1);
        require(v.envelope().envelopeOrdinal == type(uint48).max - 1, "last valid ordinal widens");
        v.seedEnvelope(pointer, 1, 288, 10496, 1);
        reject(address(v), abi.encodeCall(v.envelope, ()));
        v.seedEnvelope(pointer, 0, 288, 10496, type(uint48).max);
        reject(address(v), abi.encodeCall(v.envelope, ()));
        v.seedEnvelope(pointer, 0, 288, 10495, 1);
        reject(address(v), abi.encodeCall(v.envelope, ()));
        v.seedEnvelope(address(0), 0, 0, 1, 0);
        reject(address(v), abi.encodeCall(v.envelope, ()));
    }

    function reject(address target, bytes memory input) private view {
        (bool ok, bytes memory error) = target.staticcall(input);
        require(
            !ok
                && keccak256(error)
                    == keccak256(abi.encodeWithSelector(StorageByteView.ErrReadState.selector, bytes32(uint256(1)))),
            "bounded physical refusal"
        );
    }
}
