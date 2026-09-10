// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {AT, IAcceptanceRead} from "./AcceptanceTypes.sol";

contract OutfitRule {
    address internal boundCore;

    constructor(address core) {
        boundCore = core;
    }

    function binding() external view returns (address, bytes32, bytes32) {
        return (boundCore, keccak256("outfit.compatibility.v1"), keccak256(abi.encode(boundCore)));
    }

    function accept(AT.Context calldata, bytes calldata body) external view returns (bytes32, bytes32) {
        require(msg.sender == boundCore, "only Core");
        require(body.length == 96 || body.length == 128, "Outfit shape");
        (uint256 species, uint256 shirt, uint256 pants) = abi.decode(body[:96], (uint256, uint256, uint256));
        require(species > 0 && species <= 3 && shirt > 0 && shirt <= 3 && pants > 0 && pants <= 3, "unknown piece");
        require(!(species == 1 && shirt == 2) && !(shirt == 2 && pants == 3), "incompatible pieces");
        return (keccak256("efs.acceptance.ok.v1"), keccak256(abi.encode(species, shirt, pants)));
    }
}

contract EquipRule {
    address internal boundCore;
    address public admin;
    bytes32 public outfitType;
    uint256 public policyVersion = 1;
    bool public allowed = true;

    constructor(address core, address admin_, bytes32 outfitType_) {
        boundCore = core;
        admin = admin_;
        outfitType = outfitType_;
    }

    function binding() external view returns (address, bytes32, bytes32) {
        return (
            boundCore,
            keccak256(abi.encode(keccak256("equip.current.v1"), outfitType)),
            keccak256(abi.encode(boundCore, admin))
        );
    }

    function accept(AT.Context calldata context, bytes calldata body) external view returns (bytes32, bytes32) {
        require(msg.sender == boundCore, "only Core");
        require(allowed && body.length == 32, "new equip unavailable");
        bytes32 outfitId = abi.decode(body, (bytes32));
        if (outfitId == 0) {
            require(context.index > 0, "previous item absent");
            outfitId = keccak256(abi.encode(keccak256("efs.acceptance.receipt.v1"), context.planId, context.index - 1));
        }
        AT.Receipt memory r = IAcceptanceRead(boundCore).getReceipt(outfitId);
        require(r.accepted && r.typeId == outfitType && r.author == context.author, "exact authored Outfit required");
        return (keccak256("efs.acceptance.ok.v1"), keccak256(abi.encode(policyVersion, outfitId)));
    }

    function setAllowed(bool next) external {
        require(msg.sender == admin, "only policy admin");
        allowed = next;
        ++policyVersion;
    }

    /// @notice Explicit lab policy: prior accepted equip actions persist, not a game selection/lifecycle engine.
    function grandfathered(bytes32 id) external view returns (bool) {
        AT.Receipt memory r = IAcceptanceRead(boundCore).getReceipt(id);
        return r.accepted && IAcceptanceRead(boundCore).getActivation(r.activationId).hook == address(this);
    }
}
