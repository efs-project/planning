// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateKernel} from "../src/StateKernel.sol";
import {StateStore} from "../src/StateStore.sol";
import {Preparation} from "../src/Preparation.sol";

contract StateJournalHarness {
    StateStore.Store private s;

    // Break: latest-row lookup loses sequential prestate or coalesces writes.
    function sequentialReplay() external {
        bytes32 key = bytes32(uint256(17));
        s.postingWords[key][3] = 41;
        StateKernel.Plan memory p;
        StateKernel.allocateJournal(p, 4);
        StateKernel.put(s, p, StateStore.Kind.Word, key, 3, abi.encode(uint256(42)));
        StateKernel.put(s, p, StateStore.Kind.Word, key, 3, abi.encode(uint256(43)));
        StateKernel.put(s, p, StateStore.Kind.Word, key, 3, abi.encode(uint256(44)));
        require(p.length == 3, "every change retained");
        require(abi.decode(StateKernel.get(s, p, StateStore.Kind.Word, key, 3), (uint256)) == 44, "latest");
        require(s.postingWords[key][3] == 41, "planning is write free");
        for (uint256 i; i < 3; ++i) {
            require(abi.decode(p.changes[i].beforeValue, (uint256)) == 41 + i, "sequential before");
            require(abi.decode(p.changes[i].afterValue, (uint256)) == 42 + i, "ordered after");
            StateStore.replay(s, p.changes[i], Preparation.Config(address(0), 0)); // no Type change: helper unused
            require(s.postingWords[key][3] == 42 + i, "ordered storage replay");
        }
    }

    // Break: kind, high key bits, or index omitted from tuple equality.
    function distinctTuples(bytes32 key, uint64 index) external view {
        StateKernel.Plan memory p;
        StateKernel.allocateJournal(p, 4);
        bytes32 other = key ^ bytes32(uint256(1) << 255);
        uint64 otherIndex = index ^ 1;
        StateKernel.put(s, p, StateStore.Kind.Word, key, index, abi.encode(uint256(11)));
        StateKernel.put(s, p, StateStore.Kind.Word, other, index, abi.encode(uint256(22)));
        StateKernel.put(s, p, StateStore.Kind.Word, key, otherIndex, abi.encode(uint256(33)));
        StateKernel.put(s, p, StateStore.Kind.Posting, key, index, abi.encode(uint256(44)));
        require(abi.decode(StateKernel.get(s, p, StateStore.Kind.Word, key, index), (uint256)) == 11, "original");
        require(abi.decode(StateKernel.get(s, p, StateStore.Kind.Word, other, index), (uint256)) == 22, "key");
        require(abi.decode(StateKernel.get(s, p, StateStore.Kind.Word, key, otherIndex), (uint256)) == 33, "index");
        require(abi.decode(StateKernel.get(s, p, StateStore.Kind.Posting, key, index), (uint256)) == 44, "kind");
    }

    // Break: absent reads invent a zero value instead of reading storage.
    function absentReadsStorage(bool empty) external {
        bytes32 key = bytes32(uint256(23));
        s.postingWords[key][9] = 8675309;
        StateKernel.Plan memory p;
        StateKernel.allocateJournal(p, empty ? 0 : 2);
        if (!empty) StateKernel.put(s, p, StateStore.Kind.Word, key, 8, abi.encode(uint256(77)));
        require(
            abi.decode(StateKernel.get(s, p, StateStore.Kind.Word, key, 9), (uint256)) == 8675309, "storage fallback"
        );
        if (empty) require(p.slots.length == 0 && p.changes.length == 0, "no exact replay allocation");
    }

    // Break: a hash collision is mistaken for tuple equality or loses a row.
    function collisionChain() external view {
        StateKernel.Plan memory p;
        StateKernel.allocateJournal(p, 4);
        bytes32[3] memory keys;
        uint256 found;
        for (uint256 i = 1; found < 3; ++i) {
            bytes32 key = bytes32(i);
            if (uint256(keccak256(abi.encode(StateStore.Kind.Word, key, uint64(7)))) & (p.slots.length - 1) == 0) {
                keys[found++] = key;
            }
        }
        for (uint256 i; i < 3; ++i) {
            StateKernel.put(s, p, StateStore.Kind.Word, keys[i], 7, abi.encode(100 + i));
        }
        StateKernel.put(s, p, StateStore.Kind.Word, keys[0], 7, abi.encode(uint256(999)));
        require(
            abi.decode(StateKernel.get(s, p, StateStore.Kind.Word, keys[0], 7), (uint256)) == 999, "collision update"
        );
        require(
            abi.decode(StateKernel.get(s, p, StateStore.Kind.Word, keys[1], 7), (uint256)) == 101, "collision middle"
        );
        require(abi.decode(StateKernel.get(s, p, StateStore.Kind.Word, keys[2], 7), (uint256)) == 102, "collision tail");
        require(abi.decode(p.changes[3].beforeValue, (uint256)) == 100, "collision before");
    }

    // Test-only malformed capacity forces the otherwise unreachable full table.
    function exhausted(bool write) external view {
        StateKernel.Plan memory p;
        StateKernel.allocateJournal(p, 2);
        p.slots = new uint256[](1);
        StateKernel.put(s, p, StateStore.Kind.Word, bytes32(uint256(1)), 0, abi.encode(uint256(10)));
        if (write) StateKernel.put(s, p, StateStore.Kind.Word, bytes32(uint256(2)), 0, abi.encode(uint256(20)));
        else StateKernel.get(s, p, StateStore.Kind.Word, bytes32(uint256(2)), 0);
    }

    function boundedCapacity(uint256 fresh) external pure {
        StateKernel.Plan memory p;
        uint256 capacity = fresh == 0 ? 0 : fresh * 256 + 5;
        StateKernel.allocateJournal(p, capacity);
        require(p.changes.length == capacity, "unchanged capacity");
        uint256 n = p.slots.length;
        if (fresh == 0) require(n == 0, "empty");
        else require(n >= 2 * capacity && n <= 65536 && n & (n - 1) == 0, "bounded half load power two");
    }
}

contract StateJournalTest {
    StateJournalHarness h = new StateJournalHarness();

    function testSequentialBeforeValuesAndReplay() public {
        h.sequentialReplay();
    }

    function testFuzzFullTupleDoesNotAlias(bytes32 key, uint64 index) public view {
        h.distinctTuples(key, index);
    }

    function testAbsentTupleReadsOriginalStorage() public {
        h.absentReadsStorage(false);
    }

    function testExactReplayHasNoTableAndReadsStorage() public {
        h.absentReadsStorage(true);
    }

    function testCollisionChainPreservesLatestAndOtherRows() public view {
        h.collisionChain();
    }

    function testAllAdmissionCapacitiesHaveBoundedHalfLoad() public view {
        // Separate call frames model separate admissions, not cumulative memory.
        for (uint256 fresh; fresh <= 64; ++fresh) {
            h.boundedCapacity(fresh);
        }
    }

    function testProbeExhaustionCannotReadOrWriteWrongTuple() public view {
        for (uint256 i; i < 2; ++i) {
            (bool ok, bytes memory reason) = address(h).staticcall(abi.encodeCall(h.exhausted, (i == 1)));
            require(
                !ok && keccak256(reason) == keccak256(abi.encodeWithSignature("Panic(uint256)", 1)), "loud exhaustion"
            );
        }
    }
}
