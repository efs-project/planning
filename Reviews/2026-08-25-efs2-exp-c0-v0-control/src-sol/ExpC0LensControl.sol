// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Disposable EXP-C0/v0 bounded point-Lens control. Not a protocol ABI.
contract ExpC0LensControl {
    uint16 public constant PROFILE_VERSION = 0;
    bytes32 public constant DOMAIN_RESOLUTION_PLAN = keccak256("EFS2/EXP-C0/V0/RESOLUTION_PLAN");
    bytes32 public constant DOMAIN_POSITION = keccak256("EFS2/EXP-C0/V0/POSITION");

    uint8 public constant STATUS_FOUND = 1;
    uint8 public constant STATUS_ABSENT_PROVEN = 2;
    uint8 public constant STATUS_UNKNOWN = 3;
    uint8 public constant STATUS_CONFLICT = 4;
    uint8 public constant STATUS_UNSUPPORTED = 5;

    struct ResolutionPlan {
        bytes32 purpose;
        bytes32 subject;
        bytes32[] principals;
        uint8 combiner;
        uint8 maximumProbes;
    }

    struct PlanMeta {
        bytes32 purpose;
        bytes32 subject;
        uint8 combiner;
        uint8 maximumProbes;
        bool known;
    }

    struct PointEvidence {
        bool present;
        uint8 status;
        bytes32 recordId;
    }

    struct LensProbeV0 {
        bytes32 principalId;
        bytes32 positionKey;
        uint8 status;
        bytes32 basisCommitment;
        bytes32 recordId;
    }

    struct ResolutionResult {
        LensProbeV0[] probes;
        bool selectedPresent;
        bytes32 selectedPrincipalId;
        bytes32 selectedRecordId;
        uint8 terminalStatus;
    }

    mapping(bytes32 planId => PlanMeta) internal _plans;
    mapping(bytes32 planId => bytes32[]) internal _principals;
    mapping(bytes32 pointKey => PointEvidence) internal _points;

    function resolutionPlanId(ResolutionPlan memory plan) public pure returns (bytes32) {
        return keccak256(abi.encode(DOMAIN_RESOLUTION_PLAN, PROFILE_VERSION, plan));
    }

    function positionKey(bytes32 purpose, bytes32 subject, bytes32 fieldRole) public pure returns (bytes32) {
        require(purpose != bytes32(0) && subject != bytes32(0), "position scope");
        require(fieldRole != bytes32(0), "fieldRole");
        return keccak256(abi.encode(DOMAIN_POSITION, PROFILE_VERSION, purpose, subject, fieldRole));
    }

    function registerPlan(ResolutionPlan calldata plan) external returns (bytes32 planId) {
        uint256 count = plan.principals.length;
        require(plan.purpose != bytes32(0) && plan.subject != bytes32(0), "plan scope");
        require(count >= 1 && count <= 64, "principals 1..64");
        require(plan.combiner == 1, "combiner");
        require(plan.maximumProbes == count, "maximumProbes");
        for (uint256 i; i < count; ++i) {
            require(plan.principals[i] != bytes32(0), "zero principal");
            for (uint256 j; j < i; ++j) {
                require(plan.principals[j] != plan.principals[i], "duplicate principal");
            }
        }
        planId = resolutionPlanId(plan);
        if (_plans[planId].known) return planId;
        _plans[planId] = PlanMeta(plan.purpose, plan.subject, plan.combiner, plan.maximumProbes, true);
        for (uint256 i; i < count; ++i) {
            _principals[planId].push(plan.principals[i]);
        }
    }

    function setPointEvidence(
        bytes32 planId,
        bytes32 principalId,
        bytes32 fieldRole,
        bytes32 basisCommitment,
        uint8 status,
        bytes32 recordId
    ) external {
        require(_plans[planId].known, "unknown plan");
        require(principalId != bytes32(0) && basisCommitment != bytes32(0), "point key");
        require(fieldRole != bytes32(0), "fieldRole");
        bytes32[] storage principals = _principals[planId];
        bool retainedPrincipal;
        for (uint256 i; i < principals.length; ++i) {
            if (principals[i] == principalId) {
                retainedPrincipal = true;
                break;
            }
        }
        require(retainedPrincipal, "principal outside plan");
        require(status >= STATUS_FOUND && status <= STATUS_UNSUPPORTED, "status");
        if (status == STATUS_FOUND) require(recordId != bytes32(0), "FOUND record");
        else require(recordId == bytes32(0), "non-FOUND record");
        PlanMeta memory meta = _plans[planId];
        bytes32 position = positionKey(meta.purpose, meta.subject, fieldRole);
        _points[_pointKey(principalId, position, basisCommitment)] = PointEvidence(true, status, recordId);
    }

    function resolve(bytes32 planId, bytes32 fieldRole, bytes32 basisCommitment)
        external
        view
        returns (ResolutionResult memory result)
    {
        require(_plans[planId].known, "unknown plan");
        require(basisCommitment != bytes32(0), "basis");
        require(fieldRole != bytes32(0), "fieldRole");
        PlanMeta memory meta = _plans[planId];
        bytes32 position = positionKey(meta.purpose, meta.subject, fieldRole);
        bytes32[] storage principals = _principals[planId];
        LensProbeV0[] memory working = new LensProbeV0[](principals.length);
        for (uint256 i; i < principals.length; ++i) {
            PointEvidence memory evidence = _points[_pointKey(principals[i], position, basisCommitment)];
            uint8 status = evidence.present ? evidence.status : STATUS_UNKNOWN;
            working[i] = LensProbeV0(principals[i], position, status, basisCommitment, evidence.recordId);
            if (status == STATUS_ABSENT_PROVEN) continue;
            result.probes = _prefix(working, i + 1);
            result.terminalStatus = status;
            if (status == STATUS_FOUND) {
                result.selectedPresent = true;
                result.selectedPrincipalId = principals[i];
                result.selectedRecordId = evidence.recordId;
            }
            return result;
        }
        result.probes = working;
        result.terminalStatus = STATUS_ABSENT_PROVEN;
    }

    function _prefix(LensProbeV0[] memory values, uint256 length) internal pure returns (LensProbeV0[] memory copied) {
        copied = new LensProbeV0[](length);
        for (uint256 i; i < length; ++i) {
            copied[i] = values[i];
        }
    }

    function _pointKey(bytes32 principalId, bytes32 position, bytes32 basisCommitment) internal pure returns (bytes32) {
        return keccak256(abi.encode(principalId, position, basisCommitment));
    }
}
