// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IndexModule} from "./IndexModule.sol";
import {Ledger} from "./Ledger.sol";
import {Keys} from "./Keys.sol";
import {TypeRegistry} from "./TypeRegistry.sol";
import {QuoteAcceptor} from "./LabAcceptors.sol";

/// Shared exact-profile proof, not a general descriptor/body-size inference.
library BQuoteProfile {
    error E_PROFILE();

    function check(Ledger ledger, bytes32 sourceType, bytes32 pairType, bytes32 expectedRuleCodehash)
        internal view returns (bytes32 shape)
    {
        TypeRegistry registry = TypeRegistry(address(ledger.registry()));
        (bytes32 shape_, bytes32 ruleId, address rule, uint8 refs,,) = registry.descriptor(sourceType);
        if (refs != 1 || pairType == bytes32(0) || expectedRuleCodehash == bytes32(0)
            || ruleId != expectedRuleCodehash || rule.codehash != expectedRuleCodehash || rule.code.length == 0) revert E_PROFILE();
        bytes32[] memory refTypes = registry.refTypes(sourceType);
        if (refTypes.length != 1 || refTypes[0] != pairType
            || Keys.typeId(shape_, refTypes, ruleId) != sourceType
            || QuoteAcceptor(rule).BODY_LENGTH() != 160) revert E_PROFILE();
        return shape_;
    }
}

/// DISPOSABLE LAB. Only the exact one-Pair-reference Quote profile is supported.
/// Expected rule hash must be independently pinned to the reviewed QuoteAcceptor runtime.
/// Register that Type before construction. Attach before admission 1 for COMPLETE coverage;
/// late construction is permitted but remains honestly PARTIAL. Retained membership is NOT
/// current validity: withdrawals never release this new family's audit entries.
contract SelectiveReferenceIndexModule is IndexModule {
    bytes32 public immutable sourceType;
    uint8 public immutable referenceOrdinal;
    bytes32 public immutable pairType;
    bytes32 public immutable expectedShape;
    bytes32 public immutable expectedRuleCodehash;

    error E_REFERENCE_PROFILE();
    error E_REFERENCE_RECORD();
    function _manifestExtension() internal view override returns(bytes32){
        return keccak256(abi.encode("SelectiveQuote/1:generic-ref-alias",sourceType,referenceOrdinal,pairType,expectedShape,expectedRuleCodehash));
    }

    constructor(address ledger_, bytes32 sourceType_, uint8 referenceOrdinal_, bytes32 pairType_, bytes32 expectedShape_, bytes32 expectedRuleCodehash_)
        IndexModule(ledger_)
    {
        if (referenceOrdinal_ != 0
            || BQuoteProfile.check(Ledger(ledger_), sourceType_, pairType_, expectedRuleCodehash_) != expectedShape_) revert E_REFERENCE_PROFILE();
        sourceType = sourceType_;
        referenceOrdinal = referenceOrdinal_;
        pairType = pairType_;
        expectedShape = expectedShape_;
        expectedRuleCodehash = expectedRuleCodehash_;
    }

    function _foldEffect(Effect memory e) internal override {
        super._foldEffect(e);
            if ((e.kind != 1 && e.kind != 2) || e.typeId != sourceType) return;
            (bytes32 t, uint64 first,, bytes memory body_) = Ledger(ledger).record(e.recordId);
            if (t != sourceType || body_.length != 160 || first == 0 || first > e.admission) revert E_REFERENCE_RECORD();
    }
}
