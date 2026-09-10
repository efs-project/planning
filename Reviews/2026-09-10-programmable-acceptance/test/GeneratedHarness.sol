// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {OutfitCodec} from "../generated/OutfitCodec.sol";
import {OutfitV2Codec} from "../generated/OutfitV2Codec.sol";
import {EquipCodec} from "../generated/EquipCodec.sol";
import {PaidClaimCodec} from "../generated/PaidClaimCodec.sol";
import {OutfitRule, EquipRule} from "../contracts/src/OutfitRules.sol";
import {PaidClaimRule} from "../contracts/src/PaidClaimRule.sol";
contract GeneratedHarness {
 function outfit(OutfitCodec.Fields memory fields,bytes32 codeHash) external pure returns(bytes memory,bytes32) { return(OutfitCodec.encode(fields),OutfitCodec.typeId(OutfitCodec.rule(codeHash))); }
 function decodeOutfit(bytes memory body) external pure returns(OutfitCodec.Fields memory) {return OutfitCodec.decode(body);}
 function revision(OutfitV2Codec.Fields memory fields,bytes32 codeHash) external pure returns(bytes memory,bytes32) { return(OutfitV2Codec.encode(fields),OutfitV2Codec.typeId(OutfitV2Codec.rule(codeHash))); }
 function equip(EquipCodec.Fields memory fields,bytes32 codeHash,bytes32 outfitType) external pure returns(bytes memory,bytes32) { return(EquipCodec.encode(fields),EquipCodec.typeId(EquipCodec.rule(codeHash,outfitType))); }
 function paid(PaidClaimCodec.Fields memory fields,bytes32 codeHash,uint256 fee) external pure returns(bytes memory,bytes32) { return(PaidClaimCodec.encode(fields),PaidClaimCodec.typeId(PaidClaimCodec.rule(codeHash,fee))); }
}
