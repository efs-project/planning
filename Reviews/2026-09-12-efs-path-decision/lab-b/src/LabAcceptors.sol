// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IAcceptor} from "./Interfaces.sol";

/// DISPOSABLE LAB, NO PROTOCOL CLAIM. UNRUN (written under another worker's compiler lease).
/// Test-only acceptance rules registered through the existing TypeRegistry mechanism:
///   QuoteAcceptor  the structural rule of the joined quote Type QUOTE_J (sdk-fixture steps 1–6);
///   LabelAcceptor  the lab convention of the label-retention probe (road-b-review,
///                  "Label-retention review — September 13"): exact UTF-8 bytes, 1..255.
/// Both are view-only rules bounded by Ledger.ACCEPT_GAS; neither reads or writes storage.
/// Neither is a proposed Type descriptor or a Files semantics ruling.

/// Joined quote body = abi.encode(pairId, mantissa, scale, observedAt, noteCommitment): exactly
/// 160 bytes. The Ledger has already resolved the leading word as a checked reference of Type
/// PAIR and passes it in `refs`; this rule re-checks that binding, pins scale 6 and the declared
/// integer bounds. Fixture rule v1 only; the step-10 rule v2 (mantissa cap) is not modelled.
contract QuoteAcceptor is IAcceptor {
    uint256 public constant BODY_LENGTH = 160;
    uint8 public constant SCALE = 6;
    uint256 public constant MAX_MANTISSA = type(uint128).max;

    function accept(bytes32, bytes calldata data, bytes32[] calldata refs) external pure returns (bool) {
        if (data.length != BODY_LENGTH || refs.length != 1) return false;
        (bytes32 pairId, uint256 mantissa, uint8 scale, uint64 observedAt, bytes32 note) =
            abi.decode(data, (bytes32, uint256, uint8, uint64, bytes32));
        if (pairId == bytes32(0) || pairId != refs[0]) return false;
        if (scale != SCALE) return false;
        if (mantissa == 0 || mantissa > MAX_MANTISSA) return false;
        if (observedAt == 0 || note == bytes32(0)) return false;
        return true;
    }
}

/// Immutable-configuration rule (authority repair F5): accepts a body of at least `minBody` bytes.
/// The threshold is a constructor immutable, so it is embedded in the runtime code and therefore
/// in the codehash the Type id commits to: MinBodyAcceptor(32) and MinBodyAcceptor(96) are
/// different rules with different ids. No storage, no external reads — a fixture-grade mandatory
/// rule (QUOTE: 32, one uint256 word; PAIR: 96, two checked refs + one payload word). Not a
/// proposed Type descriptor.
contract MinBodyAcceptor is IAcceptor {
    uint256 public immutable minBody;

    constructor(uint256 minBody_) {
        minBody = minBody_;
    }

    function accept(bytes32, bytes calldata data, bytes32[] calldata) external view returns (bool) {
        return data.length >= minBody;
    }
}

/// Label body = the exact UTF-8 bytes of a display name, 1..255 bytes, well-formed per the
/// Unicode "well-formed UTF-8 byte sequences" table (no overlongs, no surrogates, max U+10FFFF).
/// Normalization (NFC, case folding) is a client policy layered on exact bytes; it is NOT applied
/// here. A Label Record is per (Type, exact bytes): its id is derivable from the placement role
/// (role == keccak256(bytes)), so a cold reader looks it up directly, without a by-Type scan.
contract LabelAcceptor is IAcceptor {
    uint256 public constant MAX_LABEL = 255;

    function accept(bytes32, bytes calldata data, bytes32[] calldata refs) external pure returns (bool) {
        if (refs.length != 0) return false;
        return _wellFormed(data);
    }

    /// Test hook: the same predicate the acceptor applies.
    function check(bytes calldata data) external pure returns (bool) {
        return _wellFormed(data);
    }

    function _wellFormed(bytes calldata s) private pure returns (bool) {
        uint256 n = s.length;
        if (n == 0 || n > MAX_LABEL) return false;
        uint256 i;
        while (i < n) {
            uint8 b0 = uint8(s[i]);
            if (b0 < 0x80) {
                ++i;
                continue;
            }
            uint256 need;
            uint8 lo = 0x80;
            uint8 hi = 0xBF;
            if (b0 >= 0xC2 && b0 <= 0xDF) {
                need = 1;
            } else if (b0 == 0xE0) {
                need = 2;
                lo = 0xA0;
            } else if (b0 >= 0xE1 && b0 <= 0xEC) {
                need = 2;
            } else if (b0 == 0xED) {
                need = 2;
                hi = 0x9F;
            } else if (b0 == 0xEE || b0 == 0xEF) {
                need = 2;
            } else if (b0 == 0xF0) {
                need = 3;
                lo = 0x90;
            } else if (b0 >= 0xF1 && b0 <= 0xF3) {
                need = 3;
            } else if (b0 == 0xF4) {
                need = 3;
                hi = 0x8F;
            } else {
                return false; // 0x80..0xC1 (stray continuation / overlong lead), 0xF5..0xFF
            }
            if (i + need >= n) return false; // truncated sequence
            uint8 b1 = uint8(s[i + 1]);
            if (b1 < lo || b1 > hi) return false;
            for (uint256 k = 2; k <= need; ++k) {
                uint8 bk = uint8(s[i + k]);
                if (bk < 0x80 || bk > 0xBF) return false;
            }
            i += need + 1;
        }
        return true;
    }
}
