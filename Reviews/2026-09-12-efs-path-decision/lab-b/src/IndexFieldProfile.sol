// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// Finite immutable lab interpretation, not a universal schema language.
/// Offsets are full 32-byte body words. bytes32/uint256 have no padding or
/// alternate encodings. Digest value means stored/ciphertext bytes, NOT plaintext
/// identity, availability, integrity of fetched bytes, or a current File head.
contract IndexFieldProfile {
    struct Scalar {
        uint8 kind; // 1 bytes32, 2 uint256
        uint16 word;
    }

    struct Digest {
        bool enabled;
        uint16 word;
        uint16 algorithmWord;
        bytes32 algorithm;
    }

    struct Spec {
        bytes32 typeId;
        Scalar[] scalars;
        Digest digest;
    }
    uint8 public constant MAX_TYPES = 16;
    uint8 public constant MAX_SCALARS = 4;
    bytes32 public immutable dataHash;
    bytes32[] private _types;
    mapping(bytes32 => Spec) private _spec;
    error E_FIELD_PROFILE();

    constructor(Spec[] memory specs) {
        if (specs.length > MAX_TYPES) revert E_FIELD_PROFILE();
        for (uint256 i; i < specs.length; i++) {
            Spec memory s = specs[i];
            if (
                s.typeId == 0 || _spec[s.typeId].typeId != 0 || s.scalars.length > MAX_SCALARS
                    || (s.scalars.length == 0 && !s.digest.enabled)
            ) revert E_FIELD_PROFILE();
            for (uint256 j; j < s.scalars.length; j++) {
                if (s.scalars[j].kind == 0 || s.scalars[j].kind > 2 || s.scalars[j].word >= 256) revert E_FIELD_PROFILE();
                _spec[s.typeId].scalars.push(s.scalars[j]);
            }
            Digest memory d = s.digest;
            if (d.enabled
                    ? (d.word >= 256 || d.algorithmWord >= 256 || d.algorithm == 0 || d.word == d.algorithmWord)
                    : (d.word != 0 || d.algorithmWord != 0 || d.algorithm != 0)) revert E_FIELD_PROFILE();
            _spec[s.typeId].typeId = s.typeId;
            _spec[s.typeId].digest = d;
            _types.push(s.typeId);
        }
        dataHash = keccak256(
            abi.encode(keccak256("efs.lab.fields/1:exact-type:full-word:bytes32-1:uint256-2:ciphertext-digest"), specs)
        );
    }

    function count() external view returns (uint256) {
        return _types.length;
    }

    function entry(uint256 i) external view returns (Spec memory) {
        return _spec[_types[i]];
    }

    function spec(bytes32 t) external view returns (Spec memory) {
        return _spec[t];
    }

    function workUnits(bytes32 t) external view returns (uint256) {
        Spec storage s = _spec[t];
        return s.scalars.length + (s.digest.enabled ? 1 : 0);
    }
}
