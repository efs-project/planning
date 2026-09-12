// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {RecordBody} from "../src/RecordBody.sol";

/// Test-only access to the real internal function; no product external surface.
contract BodyCopyHarness {
    function copy(bytes memory source, uint256 start, uint256 n) external pure returns (bytes memory) {
        return RecordBody.slice(source, start, n);
    }

    function memoryChecks(bytes memory source, uint256 start, uint256 n) external pure returns (bytes memory out) {
        bytes32 beforeHash = keccak256(source);
        bytes memory canary = new bytes(64);
        for (uint256 i; i < canary.length; ++i) {
            canary[i] = bytes1(uint8(i + 1));
        }
        bytes32 canaryHash = keccak256(canary);
        uint256 beforeFree;
        assembly ("memory-safe") { beforeFree := mload(0x40) }
        out = RecordBody.slice(source, start, n);
        uint256 afterFree;
        uint256 zero;
        assembly ("memory-safe") {
            afterFree := mload(0x40)
            zero := mload(0x60)
        }
        require(afterFree == beforeFree + 32 + ((n + 31) / 32) * 32, "same Solidity allocation");
        require(
            zero == 0 && keccak256(source) == beforeHash && keccak256(canary) == canaryHash, "source/canary/zero slot"
        );
        if (n % 32 != 0) {
            uint256 tail;
            assembly ("memory-safe") { tail := mload(add(add(out, 32), sub(n, mod(n, 32)))) }
            require(tail << (8 * (n % 32)) == 0, "untouched zero padding");
        }
        bytes memory following = new bytes(64);
        require(keccak256(following) == keccak256(new bytes(64)), "following allocation zero");
        following[0] = 0xd3;
        require(keccak256(source) == beforeHash && keccak256(canary) == canaryHash, "adjacent allocations independent");
    }
}

/// Independent retained byte-loop oracle, including allocation-first failures.
contract BodyCopyOracle {
    function copy(bytes memory b, uint256 start, uint256 n) external pure returns (bytes memory out) {
        out = new bytes(n);
        for (uint256 i; i < n; ++i) {
            out[i] = b[start + i];
        }
    }
}

contract BodyCopyTest {
    BodyCopyHarness private h = new BodyCopyHarness();
    BodyCopyOracle private oracle = new BodyCopyOracle();

    function pattern(uint256 n) private pure returns (bytes memory b) {
        b = new bytes(n);
        for (uint256 i; i < n; ++i) {
            b[i] = bytes1(uint8(1 + i % 251));
        }
    }

    function testExactUnalignedBoundarySpansAndMemory() public view {
        uint256[7] memory sizes = [uint256(0), 1, 2, 31, 32, 33, 8192];
        bytes memory b = pattern(8257);
        for (uint256 i; i < sizes.length; ++i) {
            for (uint256 start; start <= 33; start += 11) {
                bytes memory actual = h.memoryChecks(b, start, sizes[i]);
                require(actual.length == sizes[i], "exact length");
                require(keccak256(actual) == keccak256(oracle.copy(b, start, sizes[i])), "independent loop output");
            }
            require(
                keccak256(h.copy(b, b.length - sizes[i], sizes[i]))
                    == keccak256(oracle.copy(b, b.length - sizes[i], sizes[i])),
                "last span"
            );
        }
    }

    function compareFailure(uint256 start, uint256 n, uint256 panicCode) private view {
        bytes memory input = abi.encodeCall(h.copy, (hex"112233", start, n));
        (bool ok, bytes memory actual) = address(h).staticcall(input);
        (bool oldOk, bytes memory expected) = address(oracle).staticcall(input);
        require(!ok && !oldOk, "both refuse");
        require(keccak256(actual) == keccak256(expected), "same failure ordering");
        require(keccak256(actual) == keccak256(abi.encodeWithSignature("Panic(uint256)", panicCode)), "exact Panic");
    }

    function testPrivateNonemptyRangePanics() public view {
        compareFailure(3, 1, 0x32);
        compareFailure(4, 1, 0x32);
        compareFailure(2, 2, 0x32);
        compareFailure(type(uint256).max, 1, 0x32);
    }

    function testPrivateEmptyBeyondEndIsStillAllowed() public view {
        require(h.copy(hex"11", type(uint256).max, 0).length == 0, "empty ignores start");
        require(h.copy(hex"", 7, 0).length == 0, "empty source");
    }

    function testPrivateAllocationFailurePrecedesInvalidSpan() public view {
        compareFailure(type(uint256).max, type(uint256).max, 0x41);
    }

    function testFuzzActualMatchesLoop(uint16 rawLength, uint16 rawStart, uint16 rawCount) public view {
        uint256 length = uint256(rawLength) % 257;
        uint256 start = uint256(rawStart) % (length + 1);
        uint256 count = uint256(rawCount) % (length - start + 1);
        bytes memory b = pattern(length);
        require(
            keccak256(h.memoryChecks(b, start, count)) == keccak256(oracle.copy(b, start, count)), "differential copy"
        );
    }
}
