// SPDX-License-Identifier: UNLICENSED
// DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
pragma solidity 0.8.30;

// Independent canonical decoder for the tournament's fixture wire.
// Algorithm is inline-checked (NOT re-encode based) so it shares no logic with
// the Python oracle. Schema byte: low nibble kind (1=u64,2=bool,3=bytes,4=b32),
// bit 0x80 = optional. maxLen array parallels schema for bytes fields (0 = none).
library Codec {
    struct Field {
        bool present; // for optional; true for required
        uint256 word; // scalar value (u64/bool) or, for b32, the raw word as uint
        bytes32 b32v; // raw b32 value
        uint256 blen; // bytes length (bytes fields)
        bytes32 bhash; // keccak of bytes data
    }

    // returns ok, symbol (0 if ok), decoded fields
    function decodeEnvelope(bytes memory env)
        internal
        pure
        returns (bool ok, bytes32 sym, uint256 codec, bytes memory payload)
    {
        if (env.length < 96) return (false, "E_ENV_SHORT", 0, "");
        uint256 c;
        uint256 off;
        uint256 n;
        assembly {
            c := mload(add(env, 32))
            off := mload(add(env, 64))
            n := mload(add(env, 96))
        }
        if (c > 0xffff) return (false, "E_CODEC_RANGE", 0, "");
        if (off != 64) return (false, "E_ENV_OFFSET", 0, "");
        uint256 pad = (32 - (n % 32)) % 32;
        if (env.length < 96 + n) return (false, "E_ENV_LEN_LIE", 0, "");
        if (env.length != 96 + n + pad) return (false, "E_ENV_TRAILING", 0, "");
        // padding must be zero
        for (uint256 i = 96 + n; i < env.length; i++) {
            if (env[i] != 0) return (false, "E_ENV_PAD_DIRTY", 0, "");
        }
        payload = new bytes(n);
        for (uint256 i = 0; i < n; i++) {
            payload[i] = env[96 + i];
        }
        return (true, bytes32(0), c, payload);
    }

    function _word(bytes memory p, uint256 pos) private pure returns (uint256 w) {
        assembly {
            w := mload(add(add(p, 32), pos))
        }
    }

    // schema/opt/maxLen parallel arrays. Fully canonical inline checks.
    function decodeTuple(bytes memory p, uint8[] memory kind, bool[] memory opt, uint32[] memory maxLen)
        internal
        pure
        returns (bool ok, bytes32 sym, Field[] memory out)
    {
        uint256 nf = kind.length;
        out = new Field[](nf);
        // head length
        uint256 headLen = 0;
        for (uint256 i = 0; i < nf; i++) {
            if (kind[i] == 3) headLen += 32; // bytes -> offset word
            else if (opt[i]) headLen += 64; // static optional inlined (bool,val)
            else headLen += 32;
        }
        if (p.length < headLen) return (false, "E_HEAD_SHORT", out);
        uint256 pos = 0;
        uint256 expectOff = headLen;
        for (uint256 i = 0; i < nf; i++) {
            if (kind[i] == 3) {
                uint256 o = _word(p, pos);
                pos += 32;
                if (o != expectOff) return (false, "E_NONCANON_OFFSET", out);
                if (opt[i]) {
                    if (p.length < o + 96) return (false, "E_OPT_SHORT", out);
                    uint256 present = _word(p, o);
                    uint256 innoff = _word(p, o + 32);
                    if (innoff != 64) return (false, "E_OPT_INNER_OFF", out);
                    uint256 n = _word(p, o + 64);
                    if (present > 1) return (false, "E_BOOL_RANGE", out);
                    uint256 pad = (32 - (n % 32)) % 32;
                    if (p.length < o + 96 + n + pad) return (false, "E_TRUNC_BYTES", out);
                    if (present == 0 && n != 0) return (false, "E_ABSENT_NONZERO", out);
                    if (maxLen[i] != 0 && n > maxLen[i]) return (false, "E_OVER_MAX", out);
                    // padding zero
                    for (uint256 k = o + 96 + n; k < o + 96 + n + pad; k++) {
                        if (p[k] != 0) return (false, "E_PAD_DIRTY", out);
                    }
                    bytes32 bh;
                    {
                        bytes memory d = new bytes(n);
                        for (uint256 k = 0; k < n; k++) d[k] = p[o + 96 + k];
                        bh = keccak256(d);
                    }
                    out[i] = Field(present == 1, 0, bytes32(0), n, bh);
                    expectOff = o + 96 + n + pad;
                } else {
                    if (p.length < o + 32) return (false, "E_TRUNC_BYTES", out);
                    uint256 n = _word(p, o);
                    uint256 pad = (32 - (n % 32)) % 32;
                    if (p.length < o + 32 + n + pad) return (false, "E_TRUNC_BYTES", out);
                    if (maxLen[i] != 0 && n > maxLen[i]) return (false, "E_OVER_MAX", out);
                    for (uint256 k = o + 32 + n; k < o + 32 + n + pad; k++) {
                        if (p[k] != 0) return (false, "E_PAD_DIRTY", out);
                    }
                    bytes32 bh;
                    {
                        bytes memory d = new bytes(n);
                        for (uint256 k = 0; k < n; k++) d[k] = p[o + 32 + k];
                        bh = keccak256(d);
                    }
                    out[i] = Field(true, 0, bytes32(0), n, bh);
                    expectOff = o + 32 + n + pad;
                }
            } else if (opt[i]) {
                uint256 present = _word(p, pos);
                uint256 val = _word(p, pos + 32);
                pos += 64;
                if (present > 1) return (false, "E_BOOL_RANGE", out);
                if (present == 0 && val != 0) return (false, "E_ABSENT_NONZERO", out);
                if (kind[i] == 1 && (val >> 64) != 0) return (false, "E_U64_RANGE", out);
                out[i] = Field(present == 1, val, bytes32(val), 0, bytes32(0));
            } else {
                uint256 val = _word(p, pos);
                pos += 32;
                if (kind[i] == 1 && (val >> 64) != 0) return (false, "E_U64_RANGE", out);
                if (kind[i] == 2 && val > 1) return (false, "E_BOOL_RANGE", out);
                out[i] = Field(true, val, bytes32(val), 0, bytes32(0));
            }
        }
        if (expectOff != p.length) return (false, "E_PAYLOAD_TRAILING", out);
        return (true, bytes32(0), out);
    }
}
