# DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
# Minimal canonical Solidity-ABI encoder for the tournament's fixture shapes.
# Component kinds: 'u16','u64','bool','b32','bytes', ('opt', T) => tuple(bool,T).
# Standard head/tail encoding; tight, zero-padded, canonical.

def _word(i: int) -> bytes:
    return i.to_bytes(32, "big")


def _is_dynamic(t) -> bool:
    if isinstance(t, tuple) and t[0] == "opt":
        return _is_dynamic(t[1])
    return t == "bytes"


def _enc_static(t, v) -> bytes:
    if t in ("u16", "u64"):
        return _word(int(v))
    if t == "bool":
        return _word(1 if v else 0)
    if t == "b32":
        assert isinstance(v, (bytes, bytearray)) and len(v) == 32
        return bytes(v)
    if isinstance(t, tuple) and t[0] == "opt":  # static inner => inlined tuple
        present, inner = v
        return _word(1 if present else 0) + _enc_static(t[1], inner)
    raise ValueError(f"not static: {t}")


def _enc_bytes(v: bytes) -> bytes:
    n = len(v)
    pad = (32 - n % 32) % 32
    return _word(n) + bytes(v) + b"\x00" * pad


def _enc_dynamic(t, v) -> bytes:
    if t == "bytes":
        return _enc_bytes(v)
    if isinstance(t, tuple) and t[0] == "opt":  # (bool, bytes) dynamic tuple
        present, inner = v
        # head: bool word + offset word; tail: bytes payload
        head = _word(1 if present else 0) + _word(64)
        return head + _enc_bytes(inner)
    raise ValueError(f"not dynamic: {t}")


def _head_size(t) -> int:
    if _is_dynamic(t):
        return 32
    if isinstance(t, tuple) and t[0] == "opt":
        return 32 + _head_size(t[1])
    return 32


def encode_tuple(components) -> bytes:
    """components: list of (type, value). Returns abi.encode(c1,...,cn)."""
    head_len = sum(_head_size(t) for t, _ in components)
    heads, tails = [], []
    off = head_len
    for t, v in components:
        if _is_dynamic(t):
            heads.append(_word(off))
            tail = _enc_dynamic(t, v)
            tails.append(tail)
            off += len(tail)
        else:
            heads.append(_enc_static(t, v))
    return b"".join(heads) + b"".join(tails)


def encode_envelope(codec_version: int, payload: bytes) -> bytes:
    """abi.encode(uint16, bytes)"""
    return encode_tuple([("u16", codec_version), ("bytes", payload)])


if __name__ == "__main__":
    # self-test vectors checked against `cast abi-encode` (see selftest.sh)
    v = encode_tuple([("u64", 7), ("bool", True), ("bytes", b"ab"), ("b32", b"\x11" * 32)])
    print(v.hex())
    print(encode_envelope(0, b"\xde\xad").hex())
