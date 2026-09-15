// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {FilesPageReaderTest, PageVm} from "./FilesPageReader.t.sol";
import {FilesPageReader, FilesPagePaid} from "./FilesPageReader.sol";
import {FilesNameLayout} from "./FilesNamesProfile.sol";
import {FilesLayout} from "./FilesJoinedProfile.sol";
import {Keys} from "../src/Keys.sol";

contract FilesByteworkTest is FilesPageReaderTest {
    PageVm private constant faults = PageVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    // Literal expectations catch off-by-one, overlapping-prefix and empty-pattern errors.
    function test_bytework_substring_boundaries() public {
        FilesPageReader r = reader();
        bytes32 folder = _directory(600);
        file(folder, "aaaaab", 601);
        file(folder, "aaaaa", 602);
        string[8] memory patterns = ["aaab", "aaaaab", "", "aaaaabc", "b", "aaaaa", "abab", "aa"];
        uint256[8] memory counts = [uint256(1), 1, 2, 0, 1, 2, 0, 2];
        for (uint256 i; i < patterns.length; ++i) {
            FilesPageReader.Query memory q;
            q.search = patterns[i];
            FilesPageReader.Page memory p = r.readPage(folder, selectors(), q, basis(), "", 8);
            require(p.completeFromOrigin && p.rows.length == counts[i], "byte substring result");
            for (uint256 j; j < p.rows.length; ++j) require(p.rows[j].matchStatus == 1, "known match not qualified");
            if (counts[i] == 1) require(keccak256(p.rows[0].name.value) == keccak256("aaaaab"), "wrong overlapping/final match");
        }
    }

    function test_bytework_nonmatching_search_keeps_unknown_axes() public {
        FilesPageReader r = reader();
        bytes32 folder = _directory(610);
        (, bytes32 revision) = file(folder, "aaaaa", 611);
        FilesPageReader.Query memory q = FilesPageReader.Query(bytes32(uint256(99)), 2, false, "aaab");
        FilesPagePaid paid = new FilesPagePaid();
        for (uint256 fault; fault < 3; ++fault) {
            if (fault == 0) faults.mockCallRevert(address(ledger), abi.encodeCall(ledger.record, (Keys.recordFromHash(nt, keccak256("aaaaa")))), hex"01");
            if (fault == 1) faults.mockCallRevert(address(ledger), abi.encodeCall(ledger.extsload, (FilesLayout.recordBase(revision))), hex"01");
            if (fault == 2) faults.mockCallRevert(address(r.lens()), abi.encodeWithSelector(r.lens().resolvePrincipals.selector,
                selectors(), TAG, revision, q.concept, ledger.executionSet()), hex"01");
            FilesPageReader.Page memory p = r.readPage(folder, selectors(), q, basis(), "", 8);
            require(p.completeFromOrigin && p.rows.length == 1 && p.rows[0].matchStatus == 0, "unknown row filtered by negative search");
            require(!paid.queryAbsent(r, folder, selectors(), q, basis(), "", 8), "unknown became paid absence");
            faults.clearMockedCalls();
        }
    }
}

// Exact ABI response fixture for the bounded decoder, not a membership oracle.
contract ByteworkNameSource {
    bytes private response;
    constructor(bytes memory response_) { response = response_; }
    fallback() external {
        bytes memory output = response;
        assembly ("memory-safe") { return(add(output, 32), mload(output)) }
    }
}

contract FilesNameByteBoundaryTest {
    function test_bytework_name_copy_exact_lengths() public {
        uint256[7] memory lengths = [uint256(0), 1, 31, 32, 33, 254, 255];
        for (uint256 j; j < lengths.length; ++j) {
            bytes memory expected = new bytes(lengths[j]);
            for (uint256 i; i < expected.length; ++i) expected[i] = bytes1(uint8(i));
            ByteworkNameSource source = new ByteworkNameSource(abi.encode(bytes32(uint256(7)), uint64(9), uint32(0), expected));
            (uint8 status, bytes32 t, uint64 first, bytes memory actual) = FilesNameLayout.load(address(source), 0);
            require(status == 1 && t == bytes32(uint256(7)) && first == 9, "bounded ABI metadata");
            require(actual.length == expected.length && keccak256(actual) == keccak256(expected), "copy changed bytes or length");
        }
    }

    function test_bytework_name_decoder_rejects_malformed_bounds() public {
        bytes[7] memory malformed;
        malformed[0] = new bytes(159);
        malformed[1] = new bytes(417);
        malformed[2] = abi.encode(bytes32(uint256(7)), uint256(1) << 64, uint32(1), bytes("a"));
        malformed[3] = abi.encode(bytes32(uint256(7)), uint64(9), uint256(1) << 32, bytes("a"));
        malformed[4] = abi.encode(bytes32(uint256(7)), uint64(9), uint32(1), new bytes(256));
        malformed[5] = abi.encode(bytes32(uint256(7)), uint64(9), uint32(1), bytes("a"));
        bytes memory badOffset = malformed[5];
        assembly ("memory-safe") { mstore(add(badOffset, 128), 160) }
        malformed[6] = abi.encode(bytes32(uint256(7)), uint64(9), uint32(1), bytes("a"));
        bytes memory badPaddingLength = malformed[6];
        assembly ("memory-safe") { mstore(badPaddingLength, 191) }
        for (uint256 i; i < malformed.length; ++i) {
            ByteworkNameSource source = new ByteworkNameSource(malformed[i]);
            (uint8 status,,, bytes memory value) = FilesNameLayout.load(address(source), 0);
            require(status == 3 && value.length == 0, "malformed ABI accepted");
        }
    }
}
