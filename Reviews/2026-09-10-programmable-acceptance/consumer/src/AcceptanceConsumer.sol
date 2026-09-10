// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {AT, IAcceptanceRead} from "acceptance-contracts/src/AcceptanceTypes.sol";
import {OutfitCodec} from "acceptance-generated/OutfitCodec.sol";
import {EquipCodec} from "acceptance-generated/EquipCodec.sol";
import {PaidClaimCodec} from "acceptance-generated/PaidClaimCodec.sol";

interface IAcceptanceConsumerCore is IAcceptanceRead {
    function getType(bytes32 id) external view returns (AT.TypeInfo memory);
    function receiptId(bytes32 planId, uint256 index) external pure returns (bytes32);
}

interface IEquipHistoryPolicy {
    function grandfathered(bytes32 receiptId) external view returns (bool);
}

/// @notice Purpose-specific reader for retained standalone-lab acceptance.
/// @dev This contract never calls an application validator. Its constructor pins
///      the exact Core, author, generated Type/rule and local activation selected
///      by this consumer's policy.
contract AcceptanceConsumer {
    error InvalidTypePin();
    error InvalidActivationPin();
    error NotAccepted();
    error WrongCoreContext();
    error WrongAuthor();
    error WrongExactType();
    error WrongRule();
    error WrongActivation();
    error WrongReceiptId();
    error BodyCommitmentMismatch();

    struct ActivationPin {
        bytes32 activationId;
        address hook;
        bytes32 localConfig;
    }

    struct HistoricalAcceptance {
        bytes32 receiptId;
        address author;
        address submitter;
        bytes32 typeId;
        bytes32 ruleId;
        bytes32 activationId;
        bytes32 basis;
        bytes32 planId;
        uint256 itemIndex;
        uint256 acceptedAtBlock;
        uint256 chainId;
        address core;
    }

    IAcceptanceConsumerCore public immutable core;
    address public immutable trustedAuthor;
    uint256 public immutable trustedChainId;
    bytes32 public immutable outfitTypeId;
    bytes32 public immutable outfitRuleId;
    bytes32 public immutable outfitActivationId;
    bytes32 public immutable equipTypeId;
    bytes32 public immutable equipRuleId;
    bytes32 public immutable equipActivationId;
    address public immutable equipPolicy;
    bytes32 public immutable paidClaimTypeId;
    bytes32 public immutable paidClaimRuleId;
    bytes32 public immutable paidClaimActivationId;

    constructor(
        IAcceptanceConsumerCore core_,
        address author_,
        ActivationPin memory outfitPin,
        ActivationPin memory equipPin,
        ActivationPin memory paidClaimPin,
        uint256 paidClaimFee
    ) {
        core = core_;
        trustedAuthor = author_;
        trustedChainId = block.chainid;

        AT.Rule memory outfitRule = OutfitCodec.rule(outfitPin.hook.codehash);
        bytes32 expectedOutfitType = OutfitCodec.typeId(outfitRule);
        outfitRuleId = _requireType(core_, expectedOutfitType, outfitRule);
        _requireActivation(core_, outfitPin, expectedOutfitType);
        outfitTypeId = expectedOutfitType;
        outfitActivationId = outfitPin.activationId;

        AT.Rule memory equipRule = EquipCodec.rule(equipPin.hook.codehash, expectedOutfitType);
        bytes32 expectedEquipType = EquipCodec.typeId(equipRule);
        equipRuleId = _requireType(core_, expectedEquipType, equipRule);
        _requireActivation(core_, equipPin, expectedEquipType);
        equipTypeId = expectedEquipType;
        equipActivationId = equipPin.activationId;
        equipPolicy = equipPin.hook;

        AT.Rule memory paidClaimRule = PaidClaimCodec.rule(paidClaimPin.hook.codehash, paidClaimFee);
        bytes32 expectedPaidClaimType = PaidClaimCodec.typeId(paidClaimRule);
        paidClaimRuleId = _requireType(core_, expectedPaidClaimType, paidClaimRule);
        _requireActivation(core_, paidClaimPin, expectedPaidClaimType);
        paidClaimTypeId = expectedPaidClaimType;
        paidClaimActivationId = paidClaimPin.activationId;
    }

    function readEquip(bytes32 id)
        external
        view
        returns (HistoricalAcceptance memory accepted, EquipCodec.Fields memory fields)
    {
        bytes memory body;
        (accepted, body) = _readAccepted(id, equipTypeId, equipRuleId, equipActivationId);
        fields = EquipCodec.decode(body);
    }

    /// @notice Separate current application policy signal for an already accepted Equip.
    /// @dev This calls only the pinned rule's historical getter, never its validator.
    function isGrandfatheredUnderPinnedPolicy(bytes32 id) external view returns (bool) {
        _readAccepted(id, equipTypeId, equipRuleId, equipActivationId);
        return IEquipHistoryPolicy(equipPolicy).grandfathered(id);
    }

    function readPaidClaim(bytes32 id)
        external
        view
        returns (HistoricalAcceptance memory accepted, PaidClaimCodec.Fields memory fields)
    {
        bytes memory body;
        (accepted, body) = _readAccepted(id, paidClaimTypeId, paidClaimRuleId, paidClaimActivationId);
        fields = PaidClaimCodec.decode(body);
    }

    function readOutfit(bytes32 id)
        external
        view
        returns (HistoricalAcceptance memory accepted, OutfitCodec.Fields memory fields)
    {
        bytes memory body;
        (accepted, body) = _readAccepted(id, outfitTypeId, outfitRuleId, outfitActivationId);
        fields = OutfitCodec.decode(body);
    }

    function _readAccepted(bytes32 id, bytes32 expectedType, bytes32 expectedRule, bytes32 expectedActivation)
        private
        view
        returns (HistoricalAcceptance memory accepted, bytes memory body)
    {
        AT.Receipt memory receipt = core.getReceipt(id);
        if (!receipt.accepted) revert NotAccepted();
        if (receipt.core != address(core) || receipt.chainId != trustedChainId) revert WrongCoreContext();
        if (receipt.author != trustedAuthor) revert WrongAuthor();
        if (receipt.typeId != expectedType) revert WrongExactType();
        if (receipt.ruleId != expectedRule) revert WrongRule();
        if (receipt.activationId != expectedActivation) revert WrongActivation();
        if (core.receiptId(receipt.planId, receipt.index) != id) revert WrongReceiptId();

        body = core.getBody(id);
        if (keccak256(body) != receipt.bodyHash) revert BodyCommitmentMismatch();

        accepted = HistoricalAcceptance({
            receiptId: id,
            author: receipt.author,
            submitter: receipt.submitter,
            typeId: receipt.typeId,
            ruleId: receipt.ruleId,
            activationId: receipt.activationId,
            basis: receipt.basis,
            planId: receipt.planId,
            itemIndex: receipt.index,
            acceptedAtBlock: receipt.blockNumber,
            chainId: receipt.chainId,
            core: receipt.core
        });
    }

    function _sameRule(AT.Rule memory left, AT.Rule memory right) private pure returns (bool) {
        return left.codeHash == right.codeHash && left.semanticConfig == right.semanticConfig && left.mode == right.mode
            && left.gasLimit == right.gasLimit;
    }

    function _requireType(IAcceptanceConsumerCore core_, bytes32 expectedType, AT.Rule memory expectedRule)
        private
        view
        returns (bytes32)
    {
        AT.TypeInfo memory registered = core_.getType(expectedType);
        if (!registered.exists || !_sameRule(registered.rule, expectedRule)) revert InvalidTypePin();
        return registered.ruleId;
    }

    function _requireActivation(IAcceptanceConsumerCore core_, ActivationPin memory pin, bytes32 expectedType)
        private
        view
    {
        AT.Activation memory activation = core_.getActivation(pin.activationId);
        if (
            !activation.exists || activation.typeId != expectedType || activation.hook != pin.hook
                || activation.localConfig != pin.localConfig
        ) revert InvalidActivationPin();
    }
}
