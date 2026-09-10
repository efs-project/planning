// Generated; edit declarations, then npm run generate.
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {AT} from "../contracts/src/AcceptanceTypes.sol";
import {AcceptanceCore} from "../contracts/src/AcceptanceCore.sol";
library OutfitCodec {
    struct Fields { uint256 species; uint256 shirt; uint256 pants; }
    function descriptor() internal pure returns(bytes32) { return 0xe21621f716a01fc2bc40959975ddc2a1f74a8131a3dc88a9232f14fa3efa1210; }
    function kinds() internal pure returns(bytes memory) { return hex"000000"; }
    function encode(Fields memory v) internal pure returns(bytes memory) { return abi.encode(v.species, v.shirt, v.pants); }
    function decode(bytes memory body) internal pure returns(Fields memory v) {
        require(body.length == 96, "canonical length");
        bytes32[3] memory words = abi.decode(body,(bytes32[3]));

        v.species = uint256(words[0]);
        v.shirt = uint256(words[1]);
        v.pants = uint256(words[2]);
    }
    function rule(bytes32 codeHash) internal pure returns(AT.Rule memory) {
        require(codeHash != 0, "mandatory code hash");
        return AT.Rule(codeHash, bytes32(0x01dbb2a8e441545da08244ef3c5415ef01df2702473938d05950b31bfac649ca), 1, 150000);
    }
    function typeId(AT.Rule memory r) internal pure returns(bytes32) {
        AT.Rule memory expected = rule(r.codeHash);
        require(r.codeHash == expected.codeHash && r.semanticConfig == expected.semanticConfig && r.mode == expected.mode && r.gasLimit == expected.gasLimit, "declaration rule mismatch");
        bytes32 rid = r.mode == 0 ? bytes32(0) : keccak256(abi.encode(keccak256("efs.acceptance.rule.v1"),r.codeHash,r.semanticConfig,r.mode,r.gasLimit));
        bytes32 shape = keccak256(abi.encode(keccak256("efs.acceptance.shape.v1"),kinds()));
        return keccak256(abi.encode(keccak256("efs.acceptance.type.v1"),descriptor(),shape,rid));
    }
    function register(AcceptanceCore core, AT.Rule memory r) internal returns(bytes32) {
        typeId(r);
        return core.registerType(descriptor(),kinds(),r);
    }
}
