// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {PostingAccess, PostingView} from "../src/PostingAccess.sol";

contract PostingScalarResponder {
    bytes32 immutable expected;
    uint256 immutable value;
    uint256 immutable length;
    bool immutable fails;
    constructor(bytes memory input, uint256 result, uint256 size, bool fail) {
        expected = keccak256(input);
        value = result;
        length = size;
        fails = fail;
    }
    fallback() external {
        require(keccak256(msg.data) == expected, "wrong wire input");
        uint256 result = value;
        uint256 size = length;
        bool fail = fails;
        assembly ("memory-safe") {
            let p := mload(0x40)
            mstore(p, result)
            if fail { revert(p, size) }
            return(p, size)
        }
    }
}

contract PostingScalarHarness {
    function read(address target, uint8 method, bytes32 key, uint256 rawIndex, bool checkMemory)
        external view returns (uint256 result)
    {
        bytes memory canary = abi.encode(bytes32(uint256(0x1234)), bytes32(type(uint256).max));
        uint256 beforePointer;
        assembly ("memory-safe") { beforePointer := mload(0x40) }
        uint64 index;
        assembly ("memory-safe") { index := rawIndex }
        if (method == 0) result = PostingAccess.head(target, key);
        else if (method == 1) result = PostingAccess.word(target, key, index);
        else if (method == 2) result = uint256(PostingAccess.keyAt(target, index));
        else result = uint160(PostingAccess.writer(target));
        if (checkMemory) {
            uint256 afterPointer;
            uint256 zero;
            assembly ("memory-safe") { afterPointer := mload(0x40) zero := mload(0x60) }
            // The rejected fixed-wire experiment promised zero allocation. Restored
            // abi.encodeCall owns an input buffer; preserve memory integrity, not that promise.
            require(afterPointer > beforePointer && (afterPointer & 31) == 0, "ABI allocation invalid");
            require(zero == 0, "zero slot changed");
            require(canary.length == 64, "canary length changed");
            (bytes32 a, bytes32 b) = abi.decode(canary, (bytes32, bytes32));
            require(a == bytes32(uint256(0x1234)) && b == bytes32(type(uint256).max), "canary changed");
            bytes memory next = abi.encode(result, uint256(0x9876));
            (uint256 x, uint256 y) = abi.decode(next, (uint256, uint256));
            require(x == result && y == 0x9876, "later allocation changed");
        }
    }
}

contract PostingAccessTest {
    PostingScalarHarness private h = new PostingScalarHarness();
    bytes32 constant KEY = keccak256("posting-wire-key");
    function input(uint8 method, uint64 index) private pure returns (bytes memory) {
        if (method == 0) return abi.encodeCall(PostingView.head, (KEY));
        if (method == 1) return abi.encodeCall(PostingView.word, (KEY, index));
        if (method == 2) return abi.encodeCall(PostingView.keyAt, (index));
        return abi.encodeCall(PostingView.writer, ());
    }
    function testScalarExactAbiAllMethodsZeroMaxAndDirtyU64() public {
        for (uint8 method; method < 4; ++method) {
            for (uint256 i; i < 3; ++i) {
                uint256 raw = i == 0 ? 0 : i == 1 ? type(uint64).max : type(uint256).max;
                uint256 expected = method == 3 ? uint160(address(0x1234)) : type(uint256).max;
                PostingScalarResponder target = new PostingScalarResponder(input(method, uint64(raw)), expected, 32, false);
                require(h.read(address(target), method, KEY, raw, false) == expected, "wire return");
            }
        }
    }
    function testScalarAbiMemoryAndAllocatorAllMethods() public {
        for (uint8 method; method < 4; ++method) {
            PostingScalarResponder target = new PostingScalarResponder(input(method, type(uint64).max), 0x1234, 32, false);
            require(h.read(address(target), method, KEY, type(uint256).max, true) == 0x1234, "memory return");
        }
    }
    function testScalarMalformedAndFailureAllMethods() public {
        uint256[5] memory lengths = [uint256(0), 1, 31, 33, 65536];
        for (uint8 method; method < 4; ++method) {
            for (uint256 i; i < lengths.length + 1; ++i) {
                PostingScalarResponder target = new PostingScalarResponder(input(method, 0), 0x1234, i == lengths.length ? 32 : lengths[i], i == lengths.length);
                (bool ok, bytes memory err) = address(h).staticcall(abi.encodeCall(h.read, (address(target), method, KEY, 0, false)));
                require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(PostingAccess.PostingUnavailable.selector)), "malformed wire accepted");
            }
        }
    }
    function testScalarWriterRejectsNoncanonicalAddress() public {
        PostingScalarResponder target = new PostingScalarResponder(input(3, 0), uint256(1) << 160, 32, false);
        (bool ok, bytes memory err) = address(h).staticcall(abi.encodeCall(h.read, (address(target), 3, KEY, 0, false)));
        require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(PostingAccess.PostingUnavailable.selector)), "dirty writer accepted");
    }
}
