// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateKernelTest} from "./StateKernel.t.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {StateStore} from "../src/StateStore.sol";
import {StorageByteView} from "../src/StorageByteView.sol";
import {Preparation} from "../src/Preparation.sol";

interface VmEnvelopeCode {
    function load(address, bytes32) external view returns (bytes32);
    function etch(address, bytes calldata) external;
    function getNonce(address) external view returns (uint64);
    function record() external;
    function accesses(address) external returns (bytes32[] memory, bytes32[] memory);
}

contract EnvelopeViewHarness {
    StateStore.Store internal s;

    function seed(bytes32 id, address pointer, uint16 offset, uint16 length, uint64 ordinal) external {
        s.envelopes[id] = StateStore.EnvelopeCell(pointer, offset, length, ordinal);
    }

    function read(bytes32 id) external view returns (StateStore.EnvelopeRow memory) {
        return StateStore.envelopeRow(s, id);
    }

    function word(bytes32 id, uint256 at) external view returns (uint256) {
        return StateStore.envelopeWord(s, id, at, id);
    }

    function slice(bytes32 id, uint256 at, uint256 n) external view returns (bytes memory) {
        return StateStore.envelopeSlice(s, id, at, n, id);
    }
}

contract EnvelopeCodeStorageTest is StateKernelTest {
    VmEnvelopeCode constant codeVm = VmEnvelopeCode(address(uint160(uint256(keccak256("hevm cheat code")))));

    // Catches a dynamic Envelope payload or an incorrectly packed/persisted code pointer.
    function testEnvelopeIsOneCellAndExactImmutableBytes() public {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = groupLeaf(0, 0);
        StateKernel.Publication memory p = request(leaves, 91001);
        h.publishTrustedForTest(verified(), p);
        bytes memory expected = abi.encode(p.header, p.recordIds);
        // Store: Counts two slots, Bootstrap ten slots, records root12, envelopes root13.
        bytes32 cell = keccak256(abi.encode(p.envelopeId, uint256(13)));
        uint256 packed = uint256(codeVm.load(address(h), cell));
        address pointer = address(uint160(packed));
        require(pointer.code.length == expected.length + 1, "Envelope must point to immutable bytes");
        require(keccak256(pointer.code) == keccak256(bytes.concat(hex"00", expected)), "exact STOP payload");
        require(uint16(packed >> 160) == 0 && uint16(packed >> 176) == expected.length, "offset and length");
        require(uint64(packed >> 192) == 1, "packed Envelope ordinal");
        require(codeVm.load(address(h), bytes32(uint256(cell) + 1)) == 0, "no second metadata word");
        require(codeVm.load(address(h), keccak256(abi.encode(cell))) == 0, "no dynamic payload slot");
        StateStore.EnvelopeRow memory logical = h.envelope(p.envelopeId);
        require(keccak256(logical.canonicalUnsignedEnvelope) == keccak256(expected), "logical ABI exact");
        require(logical.envelopeOrdinal == 1, "logical ordinal exact");
    }

    function testMaximumEnvelopeWithOneSelectedLeafAndRetryAllocatesOnce() public {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = groupLeaf(0, 0);
        StateKernel.Publication memory p = request(leaves, 91002);
        p.recordIds = new bytes32[](64);
        p.recordIds[0] = rid(leaves[0].typeId, leaves[0].body);
        identify(p);
        h.publishTrustedForTest(verified(), p);
        require(h.envelope(p.envelopeId).canonicalUnsignedEnvelope.length == 2304, "maximum exact Envelope");
        uint64 nonce = codeVm.getNonce(h.preparationHelper());
        bytes32 beforeState = snapshot();
        codeVm.record();
        StateKernel.AdmitResult memory r = h.publishTrustedForTest(verified(), p);
        (, bytes32[] memory writes) = codeVm.accesses(address(h));
        require(r.leaves[0].outcome == 2 && r.acceptingBatchId == 0, "ACTIVE retry");
        require(
            writes.length == 0 && codeVm.getNonce(h.preparationHelper()) == nonce, "retry allocates and writes nothing"
        );
        require(snapshot() == beforeState, "retry exact inventory");
    }

    function testPartialExistingEnvelopeDoesNotCreateAnotherObject() public {
        install();
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](2);
        leaves[0] = objectLeaf(0);
        leaves[1] = objectLeaf(1);
        StateKernel.Publication memory p = request(leaves, 91003);
        StateKernel.Publication memory first = abi.decode(abi.encode(p), (StateKernel.Publication));
        first.leaves = new StateKernel.SelectedLeaf[](1);
        first.leaves[0] = leaves[0];
        first.leafMask = 1;
        h.publishTrustedForTest(verified(), first);
        uint64 nonce = codeVm.getNonce(h.preparationHelper());
        bytes32 cell = keccak256(abi.encode(p.envelopeId, uint256(13)));
        bytes32 beforeCell = codeVm.load(address(h), cell);
        p.leaves = new StateKernel.SelectedLeaf[](1);
        p.leaves[0] = leaves[1];
        p.leafMask = 2;
        h.publishTrustedForTest(verified(), p);
        require(codeVm.getNonce(h.preparationHelper()) == nonce, "partial reuse no CREATE");
        require(codeVm.load(address(h), cell) == beforeCell, "same Envelope cell");
        require(
            h.record(p.recordIds[0]).recordOrdinal == h.record(p.recordIds[1]).recordOrdinal, "Record dedup unchanged"
        );
    }

    function testReachedLateReferenceFailureRollsBackCreateAndProvisionalRows() public {
        install();
        bytes32 beforeState = snapshot();
        address helper = h.preparationHelper();
        uint64 nonce = codeVm.getNonce(helper);
        require(nonce < 128, "test RLP one-byte nonce");
        address predicted = address(uint160(uint256(keccak256(abi.encodePacked(hex"d694", helper, uint8(nonce))))));
        require(predicted.code.length == 0, "new helper child prestate");
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](2);
        leaves[0] = objectLeaf(0);
        leaves[1] = StateKernel.SelectedLeaf(
            1, setType, abi.encodePacked(new bytes(96), hex"01", bytes32(uint256(65536)), hex"0000")
        );
        StateKernel.Publication memory p = request(leaves, 91004);
        p.expectedRevisions = new StateKernel.ExpectedRevision[](1);
        p.expectedRevisions[0] = StateKernel.ExpectedRevision(1, 0);
        codeVm.record();
        (bool ok, bytes memory e) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), p)));
        (, bytes32[] memory writes) = codeVm.accesses(address(h));
        require(
            !ok
                && keccak256(e)
                    == keccak256(abi.encodeWithSelector(StateKernel.ReferenceUnproved.selector, uint16(1), uint8(0))),
            "reached late leaf"
        );
        require(writes.length > 1, "provisional Core writes reached");
        require(codeVm.getNonce(helper) == nonce && predicted.code.length == 0, "helper CREATE reverted");
        require(snapshot() == beforeState && h.envelope(p.envelopeId).envelopeOrdinal == 0, "complete Core rollback");
        require(h.record(p.recordIds[0]).recordOrdinal == 0, "earlier new Record absent");
    }

    function testEarlyHelperIdentityRefusesBeforeEnvelopeWrites() public {
        StateKernel.SelectedLeaf[] memory leaves = new StateKernel.SelectedLeaf[](1);
        leaves[0] = groupLeaf(0, 0);
        StateKernel.Publication memory p = request(leaves, 91005);
        codeVm.etch(h.preparationHelper(), hex"00");
        codeVm.record();
        (bool ok, bytes memory e) = address(h).call(abi.encodeCall(h.publishTrustedForTest, (verified(), p)));
        (, bytes32[] memory writes) = codeVm.accesses(address(h));
        require(!ok && bytes4(e) == Preparation.HelperIdentity.selector, "explicit early helper identity");
        require(writes.length == 0, "no Envelope writes");
    }

    function testPhysicalCorruptionAndSliceBoundsRefuse() public {
        EnvelopeViewHarness view_ = new EnvelopeViewHarness();
        bytes32 id = keccak256("physical-envelope");
        address pointer = address(0x100001);
        bytes memory raw = new bytes(288);
        raw[0] = 0x12;
        raw[287] = 0xab;
        codeVm.etch(pointer, bytes.concat(hex"00", raw));
        view_.seed(id, pointer, 0, 288, 1);
        require(keccak256(view_.read(id).canonicalUnsignedEnvelope) == keccak256(raw), "exact physical view");
        require(view_.word(id, 0) == uint256(0x12) << 248, "aligned word");
        require(keccak256(view_.slice(id, 287, 1)) == keccak256(hex"ab"), "final byte");
        rejectView(address(view_), abi.encodeCall(view_.word, (id, 1)), id);
        rejectView(address(view_), abi.encodeCall(view_.word, (id, 288)), id);
        rejectView(address(view_), abi.encodeCall(view_.slice, (id, 287, 2)), id);
        rejectView(address(view_), abi.encodeCall(view_.slice, (id, type(uint256).max, 1)), id);
        for (uint256 i; i < 9; ++i) {
            codeVm.etch(pointer, bytes.concat(hex"00", raw));
            view_.seed(id, pointer, 0, 288, 1);
            if (i == 0) view_.seed(id, pointer, 1, 288, 1);
            if (i == 1) view_.seed(id, pointer, 0, 65535, 1);
            if (i == 2) view_.seed(id, address(0), 0, 288, 1);
            if (i == 3) codeVm.etch(pointer, hex"");
            if (i == 4) codeVm.etch(pointer, bytes.concat(hex"00", new bytes(287)));
            if (i == 5) codeVm.etch(pointer, bytes.concat(hex"00", new bytes(289)));
            if (i == 6) codeVm.etch(pointer, bytes.concat(hex"01", raw));
            if (i == 7) view_.seed(id, pointer, 0, 288, 0);
            if (i == 8) view_.seed(id, address(0), 1, 0, 0);
            rejectView(address(view_), abi.encodeCall(view_.read, (id)), id);
        }
        view_.seed(id, address(0), 0, 0, 0);
        require(
            view_.read(id).envelopeOrdinal == 0 && view_.read(id).canonicalUnsignedEnvelope.length == 0,
            "absent is zero"
        );
    }

    function rejectView(address target, bytes memory input, bytes32 id) private view {
        (bool ok, bytes memory e) = target.staticcall(input);
        require(
            !ok && keccak256(e) == keccak256(abi.encodeWithSelector(StorageByteView.ErrReadState.selector, id)),
            "bounded read refusal subject"
        );
    }
}
