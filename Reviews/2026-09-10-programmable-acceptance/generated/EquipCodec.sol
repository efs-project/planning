// Generated; edit declarations, then npm run generate.
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {AT} from "../contracts/src/AcceptanceTypes.sol";
import {AcceptanceCore} from "../contracts/src/AcceptanceCore.sol";
library EquipCodec {
    struct Fields { bytes32 outfitReceipt; }
    function descriptor() internal pure returns(bytes32) { return 0xbaad5e6a086cad87e6e86132060258fefed2b218c9ca71382e96f28aa0b19c92; }
    function kinds() internal pure returns(bytes memory) { return hex"02"; }
    function encode(Fields memory v) internal pure returns(bytes memory) { return abi.encode(v.outfitReceipt); }
    function decode(bytes memory body) internal pure returns(Fields memory v) {
        require(body.length == 32, "canonical length");
        bytes32[1] memory words = abi.decode(body,(bytes32[1]));

        v.outfitReceipt = words[0];
    }
    function rule(bytes32 codeHash, bytes32 outfitType) internal pure returns(AT.Rule memory) {
        require(codeHash != 0, "mandatory code hash");
        return AT.Rule(codeHash, keccak256(abi.encode(bytes32(0x2074ecda09d00cc1d344de9c7b2beaa70ee9643851ccb7919ac93e269d4f1a26), outfitType)), 1, 250000);
    }
    function typeId(AT.Rule memory r, bytes32 outfitType) internal pure returns(bytes32) {
        AT.Rule memory expected = rule(r.codeHash, outfitType);
        require(r.codeHash == expected.codeHash && r.semanticConfig == expected.semanticConfig && r.mode == expected.mode && r.gasLimit == expected.gasLimit, "declaration rule mismatch");
        bytes32 rid = r.mode == 0 ? bytes32(0) : keccak256(abi.encode(keccak256("efs.acceptance.rule.v1"),r.codeHash,r.semanticConfig,r.mode,r.gasLimit));
        bytes32 shape = keccak256(abi.encode(keccak256("efs.acceptance.shape.v1"),kinds()));
        return keccak256(abi.encode(keccak256("efs.acceptance.type.v1"),descriptor(),shape,rid));
    }
    function register(AcceptanceCore core, AT.Rule memory r, bytes32 outfitType) internal returns(bytes32) {
        typeId(r, outfitType);
        return core.registerType(descriptor(),kinds(),r);
    }
}
