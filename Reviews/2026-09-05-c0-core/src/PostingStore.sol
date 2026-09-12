// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// Mandatory fresh-genesis posting storage. Only the fixed state owner may mutate.
contract PostingStore {
    address public immutable writer;
    mapping(bytes32 => uint256) public head;
    mapping(bytes32 => mapping(uint64 => uint256)) public word;
    mapping(uint64 => bytes32) public keyAt;
    uint64 private constant GUARD = (uint64(1) << 48) - 1;
    error PostingWriter();
    error U48_GUARD();

    constructor(address owner) {
        if (owner == address(0)) revert PostingWriter();
        writer = owner;
    }

    modifier onlyWriter() {
        if (msg.sender != writer) revert PostingWriter();
        _;
    }

    function append(bytes32 key, uint64 ordinal, bool audit, uint64 stagedKeyHigh)
        external onlyWriter returns (uint256 oldHead, uint64 newKeyHigh)
    {
        oldHead = head[key];
        uint64 count = uint64(oldHead);
        uint64 live = uint64(oldHead >> 64);
        uint64 last = uint64((oldHead >> 128) & GUARD);
        uint16 flags = uint16(oldHead >> 176);
        assert(ordinal > last && (count == 0 || flags == (audit ? 1 : 0)));
        if (count >= GUARD - 1 || live >= GUARD - 1) revert U48_GUARD();
        newKeyHigh = stagedKeyHigh;
        if (count == 0) {
            if (newKeyHigh >= GUARD - 1) revert U48_GUARD();
            ++newKeyHigh;
            keyAt[newKeyHigh] = key;
        }
        uint64 wi = count / 5;
        uint256 beforeWord = word[key][wi];
        uint256 shift = 48 * (count % 5);
        assert((beforeWord >> shift) == 0);
        word[key][wi] = beforeWord | (uint256(ordinal) << shift);
        head[key] = uint256(count + 1) | (uint256(live + 1) << 64) | (uint256(ordinal) << 128)
            | (uint256(audit ? 1 : 0) << 176);
    }

    function liveDelta(bytes32 key, bool increase) external onlyWriter returns (uint256 oldHead) {
        oldHead = head[key];
        uint64 live = uint64(oldHead >> 64);
        assert(uint16(oldHead >> 176) == 0);
        if (increase) {
            if (live >= GUARD - 1) revert U48_GUARD();
            ++live;
        } else {
            assert(live > 0);
            --live;
        }
        head[key] = (oldHead & ~(uint256(type(uint64).max) << 64)) | (uint256(live) << 64);
    }
}
