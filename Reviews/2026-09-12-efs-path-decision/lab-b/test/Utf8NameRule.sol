// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IAcceptor} from "../src/Interfaces.sol";

/// Disposable alternative Name Type rule. No NFC, case folding, or Files-index integration.
contract Utf8NameRule is IAcceptor {
    function accept(bytes32, bytes calldata data, bytes32[] calldata refs) external pure returns (bool) {
        return refs.length == 0 && _valid(data);
    }

    function _valid(bytes calldata data) private pure returns (bool) {
        uint256 n = data.length;
        if (n == 0 || n > 255 || (n == 1 && data[0] == 0x2e)
            || (n == 2 && data[0] == 0x2e && data[1] == 0x2e)) return false;

        for (uint256 i; i < n;) {
            uint8 first = uint8(data[i]);
            uint256 width;
            uint32 scalar;
            if (first < 0x80) {
                width = 1; scalar = first;
            } else if (first >= 0xc2 && first <= 0xdf) {
                width = 2; scalar = uint32(first & 0x1f);
            } else if (first >= 0xe0 && first <= 0xef) {
                width = 3; scalar = uint32(first & 0x0f);
            } else if (first >= 0xf0 && first <= 0xf4) {
                width = 4; scalar = uint32(first & 0x07);
            } else return false;
            if (i + width > n) return false;
            for (uint256 j = 1; j < width; ++j) {
                uint8 next = uint8(data[i + j]);
                if (next < 0x80 || next > 0xbf) return false;
                scalar = (scalar << 6) | uint32(next & 0x3f);
            }
            // Reject overlong encodings, UTF-16 surrogates, and values above U+10FFFF.
            if ((width == 2 && scalar < 0x80)
                || (width == 3 && scalar < 0x800)
                || (width == 4 && (scalar < 0x10000 || scalar > 0x10ffff))
                || (scalar >= 0xd800 && scalar <= 0xdfff)) return false;
            // Exclude C0/C1 controls and path separators; otherwise preserve raw bytes.
            if (scalar <= 0x1f || (scalar >= 0x7f && scalar <= 0x9f)
                || scalar == 0x2f || scalar == 0x5c) return false;
            i += width;
        }
        return true;
    }
}
