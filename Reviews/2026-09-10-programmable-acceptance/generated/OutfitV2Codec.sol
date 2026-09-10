// Generated; edit declarations, then npm run generate.
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {AT} from "../contracts/src/AcceptanceTypes.sol";
import {AcceptanceCore} from "../contracts/src/AcceptanceCore.sol";
library OutfitV2Codec {
    struct Fields { uint256 species; uint256 shirt; uint256 pants; uint256 badge; }
    function descriptor() internal pure returns(bytes32) { return 0xc75fc77827d97f74113e8a2f3461bf9d9077c7675ad11e0d07e33ca36f4c9259; }
    function kinds() internal pure returns(bytes memory) { return hex"00000000"; }
    function encode(Fields memory v) internal pure returns(bytes memory) { return abi.encode(v.species, v.shirt, v.pants, v.badge); }
    function decode(bytes memory body) internal pure returns(Fields memory v) {
        require(body.length == 128, "canonical length");
        bytes32[4] memory words = abi.decode(body,(bytes32[4]));

        v.species = uint256(words[0]);
        v.shirt = uint256(words[1]);
        v.pants = uint256(words[2]);
        v.badge = uint256(words[3]);
    }
    function rule(bytes32 codeHash) internal pure returns(AT.Rule memory) { return AT.Rule(codeHash, bytes32(0x01dbb2a8e441545da08244ef3c5415ef01df2702473938d05950b31bfac649ca), 1, 150000); }
    function typeId(AT.Rule memory r) internal pure returns(bytes32) {
        bytes32 rid = r.mode == 0 ? bytes32(0) : keccak256(abi.encode(keccak256("efs.acceptance.rule.v1"),r.codeHash,r.semanticConfig,r.mode,r.gasLimit));
        bytes32 shape = keccak256(abi.encode(keccak256("efs.acceptance.shape.v1"),kinds()));
        return keccak256(abi.encode(keccak256("efs.acceptance.type.v1"),descriptor(),shape,rid));
    }
    function register(AcceptanceCore core, AT.Rule memory r) internal returns(bytes32) { return core.registerType(descriptor(),kinds(),r); }
}
