// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TypeGroupParser} from "C0Admission/TypeGroupParser.sol";

/// @notice FIELD_EQ field locator. At declaration the Type's admitted schema
/// cache is compiled into a one-word "program" that reaches field `i` of a
/// validated record body without the schema: fixed-width prefixes are summed,
/// length-prefixed (BYTES/STRING) prefixes are walked by their 2-byte length.
/// Types whose earlier fields are containers (ARRAY/MAP/STRUCT/OPTION) or
/// DIGEST are refused as Unsupported at declaration, never at read time.
/// The extracted bytes are exactly the slice RecordBody.validate yields for
/// that field (length prefix included for BYTES/STRING), so
/// IndexKeys.scalar(slice) equals the value key the kind-7 scalar index would use.
library FieldWalk {
    error UnsupportedField(uint8 code);

    uint8 internal constant OP_END = 0;
    uint8 internal constant OP_SKIP = 1; // arg = bytes
    uint8 internal constant OP_SKIPVAR = 2; // 2-byte length + payload
    uint8 internal constant OP_TARGET = 3; // arg = width
    uint8 internal constant OP_TARGETVAR = 4; // 2-byte length + payload

    function compile(TypeGroupParser.SchemaCache memory sc, uint8 fieldIndex) internal pure returns (uint256 program) {
        if (fieldIndex >= sc.fields.length) revert UnsupportedField(1);
        uint256 steps;
        uint256 pendingFixed;
        for (uint256 i; i < fieldIndex; ++i) {
            uint8 k = sc.fields[i].kind;
            uint256 w = fixedWidth(k, sc.fields[i].widthOrMax);
            if (w != 0) {
                pendingFixed += w;
                continue;
            }
            if (k == 5 || k == 6) {
                if (pendingFixed != 0) {
                    program = push(program, steps++, OP_SKIP, pendingFixed);
                    pendingFixed = 0;
                }
                program = push(program, steps++, OP_SKIPVAR, 0);
                continue;
            }
            revert UnsupportedField(2);
        }
        if (pendingFixed != 0) program = push(program, steps++, OP_SKIP, pendingFixed);
        uint8 tk = sc.fields[fieldIndex].kind;
        uint256 tw = fixedWidth(tk, sc.fields[fieldIndex].widthOrMax);
        if (tw != 0) program = push(program, steps++, OP_TARGET, tw);
        else if (tk == 5 || tk == 6) program = push(program, steps++, OP_TARGETVAR, 0);
        else revert UnsupportedField(3);
    }

    function push(uint256 program, uint256 index, uint8 op, uint256 arg) private pure returns (uint256) {
        if (index >= 8 || arg > 0xffffff) revert UnsupportedField(4);
        return program | (((uint256(op) << 24) | arg) << (32 * index));
    }

    function fixedWidth(uint8 k, uint16 w) internal pure returns (uint256) {
        if (k == 1) return 1; // BOOL
        if (k >= 2 && k <= 4) return w; // UINT / INT / BYTES_FIXED
        if (k == 7 || k == 9) return 32; // REF / PRINCIPAL
        if (k == 8) return 34; // OCCREF
        return 0;
    }

    /// Canonical bytes of the declared field inside an admitted (already validated) body.
    function extract(bytes memory body, uint256 program) internal pure returns (bytes memory) {
        uint256 pos;
        for (uint256 i; i < 8; ++i) {
            uint256 step = (program >> (32 * i)) & 0xffffffff;
            uint8 op = uint8(step >> 24);
            uint256 arg = step & 0xffffff;
            if (op == OP_END) break;
            if (op == OP_SKIP) pos += arg;
            else if (op == OP_SKIPVAR) pos += 2 + len16(body, pos);
            else if (op == OP_TARGET) return slice(body, pos, arg);
            else return slice(body, pos, 2 + len16(body, pos));
            if (pos > body.length) revert UnsupportedField(5);
        }
        revert UnsupportedField(6);
    }

    function len16(bytes memory b, uint256 at) private pure returns (uint256) {
        if (at + 2 > b.length) revert UnsupportedField(5);
        return (uint256(uint8(b[at])) << 8) | uint256(uint8(b[at + 1]));
    }

    function slice(bytes memory b, uint256 start, uint256 n) private pure returns (bytes memory out) {
        if (start + n > b.length) revert UnsupportedField(5);
        out = new bytes(n);
        for (uint256 i; i < n; ++i) {
            out[i] = b[start + i];
        }
    }
}
