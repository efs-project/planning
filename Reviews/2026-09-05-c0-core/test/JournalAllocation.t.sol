// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {StateKernel} from "../src/StateKernel.sol";
import {StateStore} from "../src/StateStore.sol";
import {Preparation} from "../src/Preparation.sol";

contract JournalAllocationHarness {
    StateStore.Store private candidateStore;
    StateStore.Store private controlStore;

    // The exact old allocator, test-only. All lookup, put and replay code is
    // shared production code: this is not a second kernel implementation.
    function original(StateKernel.Plan memory p, uint256 capacity) private pure {
        p.changes = new StateStore.Change[](capacity);
        if (capacity == 0) return;
        uint256 size = 1;
        while (size < capacity * 2) size <<= 1;
        p.slots = new uint256[](size);
    }

    function footprint(uint256 capacity, bool control) external pure returns (uint256 delta, uint256 slots) {
        StateKernel.Plan memory p;
        uint256 beforePointer;
        // Referencing p here forces its allocation before the sample. No
        // allocation, copying or encoding occurs between allocator and sample.
        assembly ("memory-safe") {
            mstore(0, p)
            beforePointer := mload(0x40)
        }
        if (control) original(p, capacity);
        else StateKernel.allocateJournal(p, capacity);
        assembly ("memory-safe") { delta := sub(mload(0x40), beforePointer) }
        slots = p.slots.length;
        require(p.changes.length == capacity, "unchanged journal bound");
        uint256 zero;
        assembly ("memory-safe") { zero := mload(0x60) }
        require(zero == 0, "zero slot preserved");
    }

    function equalChange(StateStore.Change memory a, StateStore.Change memory b) private pure {
        require(a.kind == b.kind && a.key == b.key && a.index == b.index, "exact tuple");
        require(keccak256(a.beforeValue) == keccak256(b.beforeValue), "exact before bytes");
        require(keccak256(a.afterValue) == keccak256(b.afterValue), "exact after bytes");
    }

    function compare(StateKernel.Plan memory a, StateKernel.Plan memory b) private pure {
        require(a.length == b.length && a.changes.length == b.changes.length, "unchanged ordered length");
        // Never encode/copy either whole backing array: unused candidate
        // entries are not initialized structs and are outside the invariant.
        for (uint256 i; i < a.length; i++) {
            equalChange(a.changes[i], b.changes[i]);
            for (uint256 j; j < i; j++) {
                StateStore.Change memory x = a.changes[i];
                StateStore.Change memory y = a.changes[j];
                bool distinct;
                assembly ("memory-safe") { distinct := iszero(eq(x, y)) }
                require(distinct, "initialized structs do not alias");
            }
        }
        require(a.slots.length == b.slots.length, "unchanged hash table size");
        for (uint256 i; i < a.slots.length; i++) {
            require(a.slots[i] == b.slots[i], "exact hash table rows");
        }
    }

    function putBoth(
        StateKernel.Plan memory a,
        StateKernel.Plan memory b,
        StateStore.Kind k,
        bytes32 key,
        uint64 index,
        bytes memory value
    ) private view {
        StateKernel.put(candidateStore, a, k, key, index, value);
        // Interleaved Solidity allocations and dirty scratch are realistic
        // callers of journalSlot, which itself hashes in free scratch memory.
        bytes memory scratch = new bytes(97);
        for (uint256 j; j < scratch.length; j++) {
            scratch[j] = bytes1(uint8(j + 1));
        }
        StateKernel.put(controlStore, b, k, key, index, value);
        require(scratch[96] == bytes1(uint8(97)), "interleaved allocation intact");
        require(
            keccak256(StateKernel.get(candidateStore, a, k, key, index)) == keccak256(value), "candidate read latest"
        );
        require(keccak256(StateKernel.get(controlStore, b, k, key, index)) == keccak256(value), "control read latest");
    }

    // Break: skipped initialization, accidental pointer alias, tuple collision,
    // lost repeated write or shortened empty/dynamic value.
    function dynamicCollisionReplay() external {
        StateKernel.Plan memory a;
        StateKernel.Plan memory b;
        StateKernel.allocateJournal(a, 7);
        original(b, 7);
        bytes32[3] memory keys;
        uint256 found;
        for (uint256 i = 1; found < 3; i++) {
            if (uint256(keccak256(abi.encode(StateStore.Kind.Record, bytes32(i), uint64(0)))) & 15 == 0) {
                keys[found++] = bytes32(i);
            }
        }
        bytes memory longBody = new bytes(129);
        for (uint256 i; i < longBody.length; i++) {
            longBody[i] = bytes1(uint8(i + 1));
        }
        for (uint256 i; i < 3; i++) {
            bytes memory value =
                abi.encode(StateStore.RecordRow(bytes32(uint256(55)), i == 1 ? bytes("") : longBody, uint64(i + 1), 9));
            putBoth(a, b, StateStore.Kind.Record, keys[i], 0, value);
        }
        putBoth(
            a, b, StateStore.Kind.Record, keys[0], 0, abi.encode(StateStore.RecordRow(bytes32(uint256(66)), "", 1, 9))
        );
        putBoth(a, b, StateStore.Kind.Word, keys[0], 0, abi.encode(uint256(11)));
        putBoth(a, b, StateStore.Kind.Word, keys[0], 1, abi.encode(uint256(22)));
        putBoth(a, b, StateStore.Kind.Word, keys[0] ^ bytes32(uint256(1) << 255), 0, abi.encode(uint256(33)));
        compare(a, b);
        require(a.length == 7, "full capacity last pointer initialized");
        require(
            abi.decode(a.changes[3].beforeValue, (StateStore.RecordRow)).body.length == 129, "repeated tuple before"
        );
        require(abi.decode(a.changes[3].afterValue, (StateStore.RecordRow)).body.length == 0, "empty body retained");
        for (uint256 i; i < a.length; i++) {
            StateStore.replay(candidateStore, a.changes[i], Preparation.Config(address(0), 0));
            StateStore.replay(controlStore, b.changes[i], Preparation.Config(address(0), 0));
            require(
                keccak256(StateStore.read(candidateStore, a.changes[i].kind, a.changes[i].key, a.changes[i].index))
                    == keccak256(a.changes[i].afterValue),
                "exact ordered replay"
            );
        }
        for (uint256 i; i < 3; i++) {
            require(
                keccak256(abi.encode(candidateStore.records[keys[i]]))
                    == keccak256(abi.encode(controlStore.records[keys[i]])),
                "same final records"
            );
        }
    }

    // Truly empty bytes are valid journal values even though replay for a Word
    // expects encoded uint256. Do not replay malformed storage representations.
    function emptyBytesAndDirtyFreeMemory() external view {
        StateKernel.Plan memory a;
        StateKernel.Plan memory b;
        assembly ("memory-safe") {
            let p := mload(0x40)
            mstore(p, not(0))
            mstore(add(p, 32), not(0))
            mstore(add(p, 64), not(0))
        }
        StateKernel.allocateJournal(a, 2);
        original(b, 2);
        putBoth(a, b, StateStore.Kind.Word, bytes32(uint256(10)), 0, bytes(""));
        putBoth(a, b, StateStore.Kind.Word, bytes32(uint256(10)), 0, hex"010203");
        compare(a, b);
        require(
            a.changes[0].afterValue.length == 0 && a.changes[1].beforeValue.length == 0,
            "empty bytes distinct from invalid pointer"
        );
    }

    function capacityBoundary(uint256 capacity) external view {
        StateKernel.Plan memory a;
        StateKernel.Plan memory b;
        StateKernel.allocateJournal(a, capacity);
        original(b, capacity);
        for (uint256 i; i < capacity; i++) {
            StateKernel.put(candidateStore, a, StateStore.Kind.Word, bytes32(uint256(123)), 0, abi.encode(i + 1));
            StateKernel.put(controlStore, b, StateStore.Kind.Word, bytes32(uint256(123)), 0, abi.encode(i + 1));
            equalChange(a.changes[i], b.changes[i]);
            require(abi.decode(a.changes[i].beforeValue, (uint256)) == i, "ordered capacity prestate");
        }
        require(a.length == capacity && b.length == capacity, "full capacity retained");
        if (capacity != 0) {
            require(abi.decode(a.changes[capacity - 1].afterValue, (uint256)) == capacity, "last entry usable");
        }
        require(
            keccak256(StateKernel.get(candidateStore, a, StateStore.Kind.Word, bytes32(uint256(999)), 0))
                == keccak256(abi.encode(uint256(0))),
            "absent storage fallback"
        );
    }

    function nonzeroFallback(bool empty) external {
        candidateStore.postingWords[bytes32(uint256(33))][9] = 8675309;
        controlStore.postingWords[bytes32(uint256(33))][9] = 8675309;
        StateKernel.Plan memory a;
        StateKernel.Plan memory b;
        StateKernel.allocateJournal(a, empty ? 0 : 2);
        original(b, empty ? 0 : 2);
        require(
            keccak256(StateKernel.get(candidateStore, a, StateStore.Kind.Word, bytes32(uint256(33)), 9))
                == keccak256(StateKernel.get(controlStore, b, StateStore.Kind.Word, bytes32(uint256(33)), 9)),
            "same absent fallback"
        );
        require(
            abi.decode(StateKernel.get(candidateStore, a, StateStore.Kind.Word, bytes32(uint256(33)), 9), (uint256))
                == 8675309,
            "actual original storage"
        );
    }

    function stalePrestate(bool control) external {
        StateKernel.Plan memory p;
        if (control) original(p, 1);
        else StateKernel.allocateJournal(p, 1);
        StateKernel.put(candidateStore, p, StateStore.Kind.Word, bytes32(uint256(97)), 0, abi.encode(uint256(2)));
        candidateStore.postingWords[bytes32(uint256(97))][0] = 99;
        StateStore.replay(candidateStore, p.changes[0], Preparation.Config(address(0), 0));
    }
}

contract JournalAllocationTest {
    JournalAllocationHarness h = new JournalAllocationHarness();

    function testPinnedOriginalFootprintCharacterization() public view {
        uint256[5] memory capacities = [uint256(0), 261, 517, 1797, 16389];
        uint256[5] memory tableSlots = [uint256(0), 1024, 2048, 4096, 65536];
        uint256[5] memory measuredBytes = [uint256(32), 82944, 164864, 476160, 5243904];
        for (uint256 i; i < capacities.length; i++) {
            (uint256 used, uint256 slots) = h.footprint(capacities[i], true);
            require(used == measuredBytes[i] && slots == tableSlots[i], "pinned original free-pointer observation");
        }
    }

    // RED on the old pinned compiler allocator: it allocates a default five-word
    // Change for EVERY capacity entry. GREEN must use pointer backing only.
    function testAllocationFootprintOnlyInitializesPointerBacking() public view {
        uint256[5] memory fresh = [uint256(0), 1, 2, 7, 64];
        for (uint256 i; i < fresh.length; i++) {
            uint256 capacity = fresh[i] == 0 ? 0 : fresh[i] * 256 + 5;
            (uint256 used, uint256 slots) = h.footprint(capacity, false);
            require(
                used == 32 * (capacity + slots + (capacity == 0 ? 1 : 2)),
                "allocator eagerly initializes unused structs"
            );
            (uint256 oldUsed, uint256 oldSlots) = h.footprint(capacity, true);
            require(oldSlots == slots && oldUsed - used == capacity * 160, "measured five-word allocation delta");
        }
    }

    function testAllZeroThrough64CapacitiesAndAdmissionBounds() public view {
        for (uint256 capacity; capacity <= 64; capacity++) {
            h.capacityBoundary(capacity);
            (uint256 used, uint256 slots) = h.footprint(capacity == 0 ? 0 : capacity * 256 + 5, false);
            require(
                used == 32 * ((capacity == 0 ? 0 : capacity * 256 + 5) + slots + (capacity == 0 ? 1 : 2)),
                "all admission bounds footprint"
            );
        }
    }

    function testLargestAdmissionFullCapacityLastEntry() public view {
        h.capacityBoundary(64 * 256 + 5);
    }

    function testDifferentialDynamicCollisionRepeatedAndReplay() public {
        h.dynamicCollisionReplay();
    }

    function testEmptyBytesDirtyScratchAndInterleavedAllocation() public view {
        h.emptyBytesAndDirtyFreeMemory();
    }

    function testAbsentTupleRetainsStorageFallback() public {
        h.nonzeroFallback(true);
        h.nonzeroFallback(false);
    }

    function testDifferentialReplayRejectsModifiedPrestate() public {
        for (uint256 i; i < 2; i++) {
            (bool ok, bytes memory reason) = address(h).call(abi.encodeCall(h.stalePrestate, (i == 1)));
            require(
                !ok && keccak256(reason) == keccak256(abi.encodeWithSignature("Panic(uint256)", 1)),
                "stale prestate must panic"
            );
        }
    }
}
