// Generated; edit declarations, then npm run generate.
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {AT} from "../contracts/src/AcceptanceTypes.sol";
import {AcceptanceCore} from "../contracts/src/AcceptanceCore.sol";
library PaidClaimCodec {
    struct Fields { bytes32 claimKey; }
    function descriptor() internal pure returns(bytes32) { return 0xc3c71076e3c67bc2eec33750fea8fe1bda5c43e1cad3eaf19b5b8db4d4e8c9af; }
    function kinds() internal pure returns(bytes memory) { return hex"02"; }
    function encode(Fields memory v) internal pure returns(bytes memory) { return abi.encode(v.claimKey); }
    function decode(bytes memory body) internal pure returns(Fields memory v) {
        require(body.length == 32, "canonical length");
        bytes32[1] memory words = abi.decode(body,(bytes32[1]));

        v.claimKey = words[0];
    }
    function rule(bytes32 codeHash, uint256 fee) internal pure returns(AT.Rule memory) { return AT.Rule(codeHash, keccak256(abi.encode(bytes32(0x3bccf65278a79104f9bcdf96cd1335c11931f6a92e3ca1f4811adf67ed579961), fee)), 2, 250000); }
    function typeId(AT.Rule memory r) internal pure returns(bytes32) {
        bytes32 rid = r.mode == 0 ? bytes32(0) : keccak256(abi.encode(keccak256("efs.acceptance.rule.v1"),r.codeHash,r.semanticConfig,r.mode,r.gasLimit));
        bytes32 shape = keccak256(abi.encode(keccak256("efs.acceptance.shape.v1"),kinds()));
        return keccak256(abi.encode(keccak256("efs.acceptance.type.v1"),descriptor(),shape,rid));
    }
    function register(AcceptanceCore core, AT.Rule memory r) internal returns(bytes32) { return core.registerType(descriptor(),kinds(),r); }
}
