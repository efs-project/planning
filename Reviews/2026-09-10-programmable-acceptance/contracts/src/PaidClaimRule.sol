// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {AT} from "./AcceptanceTypes.sol";

contract PaidClaimRule {
    address internal boundCore;
    address public treasury;
    uint256 public fee;
    mapping(bytes32 => bool) public used;
    uint256 public count;

    constructor(address core, address treasury_, uint256 fee_) {
        boundCore = core;
        treasury = treasury_;
        fee = fee_;
    }

    function binding() external view returns (address, bytes32, bytes32) {
        return (
            boundCore,
            keccak256(abi.encode(keccak256("paid.unique.v1"), fee)),
            keccak256(abi.encode(boundCore, treasury))
        );
    }

    function accept(AT.Context calldata context, bytes calldata body) external payable returns (bytes32, bytes32) {
        require(msg.sender == boundCore, "only Core");
        require(body.length == 32 && msg.value == fee, "exact claim fee/shape");
        bytes32 key = abi.decode(body, (bytes32));
        require(!used[key], "claim already used");
        used[key] = true;
        ++count;
        (bool ok,) = treasury.call{value: fee, gas: 50_000}("");
        require(ok, "treasury refused");
        return (
            keccak256("efs.acceptance.ok.v1"),
            keccak256(abi.encode(key, count, context.author, context.planId, context.index))
        );
    }
}
