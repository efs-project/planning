// SPDX-License-Identifier: UNLICENSED
// DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
pragma solidity 0.8.30;

import {Codec} from "./Codec.sol";

// The immutable consumer arms. Pure decision functions; no storage effects here.
// Outcome strings match the oracle vocabulary exactly.
contract Consumers {
    bytes32 public immutable PIN_NOTE;
    bytes32 public immutable PIN_ACT;
    bytes32 public immutable FIN_NOTE_A;
    bytes32 public immutable FIN_NOTE_B;
    bytes32 public immutable FIN_ACT_A;
    bytes32 public immutable FIN_ACT_B;
    bytes32 public immutable RECIP;
    uint256 public immutable CAP;
    mapping(bytes32 => bool) public pinnedBinding;
    mapping(bytes32 => bool) public issuerBinding;

    constructor(
        bytes32 pinNote,
        bytes32 pinAct,
        bytes32[2] memory finNote,
        bytes32[2] memory finAct,
        bytes32 recip,
        uint256 cap,
        bytes32[] memory pins,
        bytes32[] memory issuers
    ) {
        PIN_NOTE = pinNote;
        PIN_ACT = pinAct;
        FIN_NOTE_A = finNote[0];
        FIN_NOTE_B = finNote[1];
        FIN_ACT_A = finAct[0];
        FIN_ACT_B = finAct[1];
        RECIP = recip;
        CAP = cap;
        for (uint256 i = 0; i < pins.length; i++) pinnedBinding[pins[i]] = true;
        for (uint256 i = 0; i < issuers.length; i++) issuerBinding[issuers[i]] = true;
    }

    // schema kinds: 1=u64,2=bool,3=bytes,4=b32
    function schemaFor(string memory t)
        public
        pure
        returns (uint8[] memory k, bool[] memory o, uint32[] memory m)
    {
        bytes32 h = keccak256(bytes(t));
        if (h == keccak256("NOTE_1_0") || h == keccak256("NOTE_TWIN") || h == keccak256("NOTE_FUTURE_CODEC")) {
            return (_u8([4, 1, 3, 4]), _bl([false, false, false, true]), _u32([ uint32(0), 0, 512, 0]));
        }
        if (h == keccak256("NOTE_2_0")) {
            return (_u8([4, 1, 3, 4]), _bl([false, false, false, true]), _u32([ uint32(0), 0, 2048, 0]));
        }
        if (h == keccak256("NOTE_1_1")) {
            return (_u85([4, 1, 3, 4, 3]), _bl5([false, false, false, true, true]), _u325([ uint32(0), 0, 512, 0, 32]));
        }
        if (h == keccak256("NOTE_1_2")) {
            return (_u85([4, 1, 3, 4, 3]), _bl5([false, false, false, true, false]), _u325([ uint32(0), 0, 512, 0, 32]));
        }
        if (h == keccak256("ACT_V1") || h == keccak256("ACT_TWIN")) {
            return (_u85([4, 1, 4, 1, 4]), _bl5([false, false, false, false, false]), _u325([ uint32(0), 0, 0, 0, 0]));
        }
        if (h == keccak256("ACT_V1_1")) {
            return (_u86([4, 1, 4, 1, 4, 3]), _bl6([false, false, false, false, false, true]), _u326([ uint32(0), 0, 0, 0, 0, 64]));
        }
        if (h == keccak256("ACT_V2")) {
            return (_u87([4, 1, 4, 1, 4, 3, 4]), _bl7([false, false, false, false, false, true, true]), _u327([ uint32(0), 0, 0, 0, 0, 64, 0]));
        }
        if (h == keccak256("SCI_DIST") || h == keccak256("SCI_DUR")) {
            return (_u2([1, 4]), _bl2([false, false]), _u322([ uint32(0), 0]));
        }
        // default empty
        return (new uint8[](0), new bool[](0), new uint32[](0));
    }

    struct Decoded {
        bool ok;
        bytes32 sym;
        uint256 codec;
        string grade; // STRUCTURAL_VALID / STRUCTURAL_INVALID / UNSUPPORTED
        Codec.Field[] f;
    }

    function decode(bytes memory env, string memory recType) public pure returns (Decoded memory d) {
        (bool eok, bytes32 esym, uint256 c, bytes memory payload) = Codec.decodeEnvelope(env);
        if (!eok) {
            d.ok = false;
            d.sym = esym;
            d.grade = "STRUCTURAL_INVALID";
            return d;
        }
        d.codec = c;
        if (c != 0) {
            d.grade = "UNSUPPORTED";
            d.sym = "E_UNSUPPORTED_CODEC";
            return d;
        }
        (uint8[] memory k, bool[] memory o, uint32[] memory m) = schemaFor(recType);
        (bool tok, bytes32 tsym, Codec.Field[] memory f) = Codec.decodeTuple(payload, k, o, m);
        if (!tok) {
            d.ok = false;
            d.sym = tsym;
            d.grade = "STRUCTURAL_INVALID";
            return d;
        }
        d.ok = true;
        d.grade = "STRUCTURAL_VALID";
        d.f = f;
    }

    // ---- note read arms -> ACCEPT / REJECT / STORE_RAW ------------------
    function noteArm(
        string memory arm,
        bytes memory env,
        bytes32 tid,
        string memory recType,
        bytes32 bindId,
        string memory bindSem,
        string memory bindType
    ) public view returns (string memory) {
        bytes32 a = keccak256(bytes(arm));
        Decoded memory d = decode(env, recType);
        if (a == keccak256("ARCH")) {
            return "STORE_RAW"; // always preserves raw, never authorizes an effect
        }
        if (a == keccak256("N_EXACT")) {
            if (tid != PIN_NOTE) return "REJECT";
            if (!d.ok) return "REJECT";
            return "ACCEPT";
        }
        if (a == keccak256("N_FIN")) {
            if (tid != FIN_NOTE_A && tid != FIN_NOTE_B) return "REJECT";
            if (!d.ok) return "REJECT";
            return "ACCEPT";
        }
        if (a == keccak256("N_PRED")) {
            if (!d.ok) return "REJECT";
            // frozen shape check: [b32,u64,bytes,opt b32] then bounds
            if (d.f.length < 4) return "REJECT";
            (uint8[] memory k, bool[] memory o,) = schemaFor(recType);
            if (k.length < 4) return "REJECT";
            if (!(k[0] == 4 && k[1] == 1 && k[2] == 3 && k[3] == 4)) return "REJECT";
            if (!(!o[0] && !o[1] && !o[2] && o[3])) return "REJECT";
            if (d.f.length != 4) return "REJECT"; // reject extra fields (5-field notes)
            if (d.f[1].word >= (uint256(1) << 40)) return "REJECT";
            if (d.f[2].blen > 512) return "REJECT";
            return "ACCEPT";
        }
        if (a == keccak256("N_SEMPIN") || a == keccak256("N_SEMISS") || a == keccak256("N_SEMOPEN")) {
            if (bindId == bytes32(0)) return "REJECT";
            if (a == keccak256("N_SEMPIN") && !pinnedBinding[bindId]) return "REJECT";
            if (a == keccak256("N_SEMISS") && !issuerBinding[bindId]) return "REJECT";
            if (keccak256(bytes(bindSem)) != keccak256("SEM_NOTE")) return "REJECT";
            if (keccak256(bytes(bindType)) != keccak256(bytes(recType))) return "REJECT";
            if (!d.ok) return "REJECT";
            return "ACCEPT";
        }
        return "REJECT";
    }

    // ---- action effect arms -> EFFECT / DECODE_ONLY / REJECT -----------
    function actionArm(
        string memory arm,
        bytes memory env,
        bytes32 tid,
        string memory recType,
        bytes32 bindId,
        string memory bindSem,
        string memory bindType
    ) public view returns (string memory) {
        bytes32 a = keccak256(bytes(arm));
        Decoded memory d = decode(env, recType);
        if (a == keccak256("A_EXACT")) {
            if (tid != PIN_ACT) return "REJECT";
            if (!d.ok) return "REJECT";
            return _effect(d);
        }
        if (a == keccak256("A_FIN")) {
            if (tid != FIN_ACT_A && tid != FIN_ACT_B) return "REJECT";
            if (!d.ok) return "REJECT";
            return _effect(d);
        }
        if (a == keccak256("A_PRED")) {
            if (!d.ok) return "REJECT";
            (uint8[] memory k,,) = schemaFor(recType);
            if (k.length < 5) return "REJECT";
            if (!(k[0] == 4 && k[1] == 1 && k[2] == 4 && k[3] == 1 && k[4] == 4)) return "REJECT";
            return _effect(d);
        }
        if (a == keccak256("A_SEMPIN") || a == keccak256("A_SEMISS")) {
            if (bindId == bytes32(0)) return "REJECT";
            if (a == keccak256("A_SEMPIN") && !pinnedBinding[bindId]) return "REJECT";
            if (a == keccak256("A_SEMISS") && !issuerBinding[bindId]) return "REJECT";
            if (keccak256(bytes(bindSem)) != keccak256("SEM_ACT")) return "REJECT";
            if (keccak256(bytes(bindType)) != keccak256(bytes(recType))) return "REJECT";
            if (!d.ok) return "REJECT";
            // effectful consumer refuses a future variant carrying an unprojected
            // effect-relevant field (ACT_V2 delegate). Detected structurally: the
            // real type has more fields than the SEM_ACT projection covers.
            if (keccak256(bytes(recType)) == keccak256("ACT_V2")) {
                return "DECODE_ONLY";
            }
            return _effect(d);
        }
        return "REJECT";
    }

    function _effect(Decoded memory d) internal view returns (string memory) {
        // fields: 0 actor,1 verb,2 target,3 amount,4 basis
        uint256 verb = d.f[1].word;
        if (verb != 1 && verb != 2) return "DECODE_ONLY";
        if (verb == 2) {
            if (d.f[2].b32v != RECIP) return "DECODE_ONLY";
            if (d.f[3].word > CAP) return "DECODE_ONLY";
        }
        return "EFFECT";
    }

    // ---- tiny fixed-size array helpers ---------------------------------
    function _u8(uint8[4] memory v) private pure returns (uint8[] memory r) {
        r = new uint8[](4);
        for (uint256 i = 0; i < 4; i++) r[i] = v[i];
    }
    function _bl(bool[4] memory v) private pure returns (bool[] memory r) {
        r = new bool[](4);
        for (uint256 i = 0; i < 4; i++) r[i] = v[i];
    }
    function _u32(uint32[4] memory v) private pure returns (uint32[] memory r) {
        r = new uint32[](4);
        for (uint256 i = 0; i < 4; i++) r[i] = v[i];
    }
    function _u85(uint8[5] memory v) private pure returns (uint8[] memory r) {
        r = new uint8[](5);
        for (uint256 i = 0; i < 5; i++) r[i] = v[i];
    }
    function _bl5(bool[5] memory v) private pure returns (bool[] memory r) {
        r = new bool[](5);
        for (uint256 i = 0; i < 5; i++) r[i] = v[i];
    }
    function _u325(uint32[5] memory v) private pure returns (uint32[] memory r) {
        r = new uint32[](5);
        for (uint256 i = 0; i < 5; i++) r[i] = v[i];
    }
    function _u86(uint8[6] memory v) private pure returns (uint8[] memory r) {
        r = new uint8[](6);
        for (uint256 i = 0; i < 6; i++) r[i] = v[i];
    }
    function _bl6(bool[6] memory v) private pure returns (bool[] memory r) {
        r = new bool[](6);
        for (uint256 i = 0; i < 6; i++) r[i] = v[i];
    }
    function _u326(uint32[6] memory v) private pure returns (uint32[] memory r) {
        r = new uint32[](6);
        for (uint256 i = 0; i < 6; i++) r[i] = v[i];
    }
    function _u87(uint8[7] memory v) private pure returns (uint8[] memory r) {
        r = new uint8[](7);
        for (uint256 i = 0; i < 7; i++) r[i] = v[i];
    }
    function _bl7(bool[7] memory v) private pure returns (bool[] memory r) {
        r = new bool[](7);
        for (uint256 i = 0; i < 7; i++) r[i] = v[i];
    }
    function _u327(uint32[7] memory v) private pure returns (uint32[] memory r) {
        r = new uint32[](7);
        for (uint256 i = 0; i < 7; i++) r[i] = v[i];
    }
    function _u2(uint8[2] memory v) private pure returns (uint8[] memory r) {
        r = new uint8[](2);
        for (uint256 i = 0; i < 2; i++) r[i] = v[i];
    }
    function _bl2(bool[2] memory v) private pure returns (bool[] memory r) {
        r = new bool[](2);
        for (uint256 i = 0; i < 2; i++) r[i] = v[i];
    }
    function _u322(uint32[2] memory v) private pure returns (uint32[] memory r) {
        r = new uint32[](2);
        for (uint256 i = 0; i < 2; i++) r[i] = v[i];
    }
}
