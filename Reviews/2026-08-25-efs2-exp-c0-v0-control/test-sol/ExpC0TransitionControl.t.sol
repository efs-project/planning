// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ExpC0Codec} from "../src-sol/ExpC0Codec.sol";
import {ExpC0TransitionControl} from "../src-sol/ExpC0TransitionControl.sol";

contract ExpC0TransitionControlTest {
    bytes32 internal constant REALM = 0x9e289671410f2b79594923c400395dd6196f90419c55b6fc1370ef5a08022633;
    bytes32 internal constant REVISION = 0x6f02a444ef364f0869c54fce0ea261c1d7c017419068d27cbadeb6d25c280ecd;
    bytes32 internal constant TYPE_ID = 0x62f835130312d0bfee6e99785405e3d3b86e9739be7cadce830d6be7fcf24452;
    bytes32 internal constant RECORD_A = 0x7f80167c8ca5fdb7ce2d7556d3a60e249433db54a0c52532b44316677e044a5b;
    bytes32 internal constant RECORD_B = 0x36bdd764fbcb78f3b557ad6e73f93216311acf0566da52fb6288bf6e80c01b09;
    bytes32 internal constant PUBLICATION = 0x3ad43ff4f4f07d47a08dfbfe7b7912b0008b43d9f4cba2e340803568da6dfc24;
    bytes32 internal constant OCCURRENCE_0 = 0x7d703c567d5971362614cd761b377bf49caeba949c60d49293f1bb092241bce9;
    bytes32 internal constant OCCURRENCE_1 = 0xef16adcba179f0db0a21579aacab0d066768b1dc11450ecc54f814366aa0646f;
    bytes32 internal constant ALICE = 0xd2b78ce29c18b7339d04311cf898b594370b1055428a10dfd740eff5db3725bc;
    bytes32 internal constant POSITION = keccak256("position-k");

    ExpC0TransitionControl internal sut;

    function setUp() public {
        sut = new ExpC0TransitionControl();
        ExpC0Codec.InitialRevision memory initial = _initialRevision();
        sut.bootstrap(_bootstrap(initial), _realmRevision(initial));
        sut.registerType(_wire(_typeNote()));

        bytes memory bodyA = abi.encode(bytes("alpha"), ExpC0Codec.OptionalRecord(false, bytes32(0)));
        bytes memory bodyB = abi.encode(bytes("beta"), ExpC0Codec.OptionalRecord(true, RECORD_A));
        require(sut.registerRecord(TYPE_ID, bodyA) == RECORD_A, "record A");
        require(sut.registerRecord(TYPE_ID, bodyB) == RECORD_B, "record B");
        require(sut.registerPublication(_publication()) == PUBLICATION, "publication");
    }

    function testP0AndP3AtomicAdmissionBindingAndRetry() external {
        ExpC0Codec.AdmissionPlan memory plan = _plan(1, RECORD_B, 0);
        (bytes32 operationId, uint8 errorCode, bool idempotent) = sut.execute(plan, 99, true);
        require(operationId != bytes32(0), "operation missing");
        require(errorCode == 0 && !idempotent, "first execution");
        require(sut.admissionHighWater() == 2, "two admissions");

        (uint32 revision, bool tombstone, bytes32 target,) = sut.bindingHead(ALICE, POSITION);
        require(revision == 1 && !tombstone && target == RECORD_B, "binding rev1");

        bytes32 beforeRetry = sut.controlStateDigest();
        (bytes32 retryId, uint8 retryError, bool retryIdempotent) = sut.execute(plan, 101, true);
        require(retryId == operationId && retryError == 0 && retryIdempotent, "expired retry must read back");
        require(sut.controlStateDigest() == beforeRetry, "retry mutated state");
    }

    function testP1InvalidSecondOccurrenceRejectsAtomically() external {
        ExpC0Codec.AdmissionPlan memory plan = _plan(2, RECORD_B, 0);
        plan.occurrenceIds[1] = bytes32(uint256(123));
        bytes32 beforeState = sut.controlStateDigest();
        (, uint8 errorCode,) = sut.execute(plan, 99, true);
        require(errorCode == 5, "plan/source mismatch precedence");
        require(sut.controlStateDigest() == beforeState, "partial admission");
        require(sut.admissionHighWater() == 0, "counter changed");
    }

    function testP2DNonceCollisionRejectsChangedPlan() external {
        ExpC0Codec.AdmissionPlan memory plan = _plan(3, RECORD_B, 0);
        (bytes32 operationId, uint8 firstError,) = sut.execute(plan, 99, true);
        require(operationId != bytes32(0) && firstError == 0, "setup commit");

        ExpC0Codec.AdmissionPlan memory changed = _plan(3, RECORD_A, 1);
        bytes32 beforeState = sut.controlStateDigest();
        (, uint8 errorCode,) = sut.execute(changed, 99, true);
        require(errorCode == 7, "nonce collision precedence");
        require(sut.controlStateDigest() == beforeState, "collision mutated state");
    }

    function testP0BAndP2EAuthorityAndExpiryRejectUnchanged() external {
        bytes32 beforeState = sut.controlStateDigest();
        (, uint8 denied,) = sut.execute(_plan(4, RECORD_B, 0), 99, false);
        require(denied == 8, "verifier precedence");
        require(sut.controlStateDigest() == beforeState, "denial mutated state");

        (, uint8 expired,) = sut.execute(_plan(5, RECORD_B, 0), 100, true);
        require(expired == 6, "exclusive expiry");
        require(sut.controlStateDigest() == beforeState, "expiry mutated state");
    }

    function testB1StaleCASRejectsUnchanged() external {
        (, uint8 firstError,) = sut.execute(_plan(6, RECORD_B, 0), 99, true);
        require(firstError == 0, "setup commit");
        bytes32 beforeState = sut.controlStateDigest();
        (, uint8 stale,) = sut.execute(_plan(7, RECORD_A, 0), 99, true);
        require(stale == 10, "precondition precedence");
        require(sut.controlStateDigest() == beforeState, "stale CAS mutated state");
    }

    function testRealmTotalTypeCapAllowsSixteenAndRejectsSeventeenthUnchanged() external {
        ExpC0TransitionControl limited = new ExpC0TransitionControl();
        ExpC0Codec.InitialRevision memory initial = _initialRevision();
        limited.bootstrap(_bootstrap(initial), _realmRevision(initial));

        for (uint256 i; i < 16; ++i) {
            bytes32 registered = limited.registerType(_wire(_plainType(i)));
            require(registered != bytes32(0), "Type registration");
        }
        require(limited.typeCount() == 16, "Realm-total Type cap");

        bytes32 beforeState = limited.controlStateDigest();
        bool rejected;
        try limited.registerType(_wire(_plainType(16))) returns (bytes32) {}
        catch {
            rejected = true;
        }
        require(rejected, "seventeenth Type accepted");
        require(limited.typeCount() == 16, "Type count mutated");
        require(limited.controlStateDigest() == beforeState, "Type-cap rejection mutated state");
    }

    function testUnknownTypeCodecAndMalformedCodecZeroRejectWithZeroEffect() external {
        bytes32 beforeState = sut.controlStateDigest();
        (bool unknownOk, bytes memory unknownReason) =
            address(sut).call(abi.encodeCall(sut.registerType, (ExpC0Codec.encodeTypeSchemaEnvelope(1, hex"deadbeef"))));
        require(!unknownOk, "unknown codec admitted");
        require(_selector(unknownReason) == ExpC0TransitionControl.UnsupportedTypeCodec.selector, "unknown grade");
        require(sut.controlStateDigest() == beforeState, "unknown codec mutated state");

        (bool malformedOk, bytes memory malformedReason) =
            address(sut).call(abi.encodeCall(sut.registerType, (ExpC0Codec.encodeTypeSchemaEnvelope(0, hex"1234"))));
        require(!malformedOk, "malformed codec-0 payload admitted");
        require(_selector(malformedReason) == ExpC0TransitionControl.MalformedTypePayload.selector, "malformed grade");
        require(sut.controlStateDigest() == beforeState, "malformed payload mutated state");
    }

    function testExactRoleRequiresRetainedTargetTypeAndCorrectTargetRecordType() external {
        ExpC0Codec.TypeSchema memory parent = _parentType();
        bytes32 parentTypeId = sut.registerType(_wire(parent));
        ExpC0Codec.TypeSchema memory file = _fileType(parentTypeId);
        bytes32 fileTypeId = sut.registerType(_wire(file));

        bytes memory parentBody = abi.encode(bytes("parent"));
        bytes32 parentRecordId = sut.registerRecord(parentTypeId, parentBody);
        bytes memory fileBody = abi.encode(bytes("hello.txt"), ExpC0Codec.OptionalRecord(true, parentRecordId));
        require(sut.registerRecord(fileTypeId, fileBody) != bytes32(0), "exact File record");

        bytes32 beforeState = sut.controlStateDigest();
        bool rejected;
        bytes memory missingBody =
            abi.encode(bytes("missing"), ExpC0Codec.OptionalRecord(true, bytes32(uint256(0xdead))));
        try sut.registerRecord(fileTypeId, missingBody) returns (bytes32) {}
        catch {
            rejected = true;
        }
        require(rejected, "missing exact target Record accepted");
        require(sut.controlStateDigest() == beforeState, "missing target mutated state");

        rejected = false;
        bytes memory wrongTypeBody = abi.encode(bytes("wrong"), ExpC0Codec.OptionalRecord(true, RECORD_A));
        try sut.registerRecord(fileTypeId, wrongTypeBody) returns (bytes32) {}
        catch {
            rejected = true;
        }
        require(rejected, "wrong exact target Record Type accepted");
        require(sut.controlStateDigest() == beforeState, "wrong target Type mutated state");
    }

    function testExactRoleRejectsMissingTargetTypeUnchanged() external {
        bytes32 beforeState = sut.controlStateDigest();
        bool rejected;
        try sut.registerType(_wire(_fileType(bytes32(uint256(0xbeef))))) returns (bytes32) {}
        catch {
            rejected = true;
        }
        require(rejected, "missing exact target Type accepted");
        require(sut.controlStateDigest() == beforeState, "missing target Type mutated state");
    }

    function _plan(uint64 nonce, bytes32 target, uint32 expectedRevision)
        internal
        pure
        returns (ExpC0Codec.AdmissionPlan memory plan)
    {
        bytes32[] memory occurrences = new bytes32[](2);
        occurrences[0] = OCCURRENCE_0;
        occurrences[1] = OCCURRENCE_1;
        ExpC0Codec.EffectV0[] memory effects = new ExpC0Codec.EffectV0[](1);
        effects[0] = ExpC0Codec.EffectV0({
            kind: 1,
            principalId: ALICE,
            positionKey: POSITION,
            recordId: target,
            occurrenceId: bytes32(0),
            expectedRevision: expectedRevision,
            queryProfileId: bytes32(0),
            generation: 0,
            coverageHighWater: 0,
            terminalCount: 0,
            terminalPostingsRoot: bytes32(0)
        });
        plan = ExpC0Codec.AdmissionPlan({
            occurrenceIds: occurrences,
            realmId: REALM,
            realmRevisionId: REVISION,
            coreCommitment: 0x3030303030303030303030303030303030303030303030303030303030303030,
            semanticAuthor: ALICE,
            actor: ALICE,
            verifierProfileId: 0x9191919191919191919191919191919191919191919191919191919191919191,
            nonceLane: 0,
            nonce: nonce,
            expiryCoordinate: 100,
            executorCommitment: keccak256("executor"),
            dependencyCommitment: keccak256("dependencies"),
            payer: ALICE,
            maximumCost: 1_000_000,
            effects: effects
        });
    }

    function _initialRevision() internal pure returns (ExpC0Codec.InitialRevision memory) {
        return ExpC0Codec.InitialRevision({
            generation: 0,
            componentCommitment: 0x4040404040404040404040404040404040404040404040404040404040404040,
            executionProfileId: 0x5050505050505050505050505050505050505050505050505050505050505050,
            policyId: 0x6060606060606060606060606060606060606060606060606060606060606060,
            verifierProfileId: 0x7070707070707070707070707070707070707070707070707070707070707070,
            administrationCommitment: 0x8080808080808080808080808080808080808080808080808080808080808080,
            activationStart: 0,
            activationEndExclusive: type(uint64).max
        });
    }

    function _bootstrap(ExpC0Codec.InitialRevision memory initial)
        internal
        pure
        returns (ExpC0Codec.RealmBootstrap memory bootstrap)
    {
        uint8[] memory powers = new uint8[](2);
        powers[0] = 1;
        powers[1] = 2;
        bootstrap = ExpC0Codec.RealmBootstrap({
            originLineage: bytes("evm:31337:genesis-A"),
            genesisCommitment: 0x1010101010101010101010101010101010101010101010101010101010101010,
            coreCommitment: 0x3030303030303030303030303030303030303030303030303030303030303030,
            initialRevisionCommitment: ExpC0Codec.initialRevisionCommitment(initial),
            initialRevisionId: REVISION,
            disclosedPowers: powers
        });
    }

    function _realmRevision(ExpC0Codec.InitialRevision memory initial)
        internal
        pure
        returns (ExpC0Codec.RealmRevision memory)
    {
        return ExpC0Codec.RealmRevision({
            realmId: REALM,
            generation: initial.generation,
            componentCommitment: initial.componentCommitment,
            executionProfileId: initial.executionProfileId,
            policyId: initial.policyId,
            verifierProfileId: initial.verifierProfileId,
            administrationCommitment: initial.administrationCommitment,
            activationStart: initial.activationStart,
            activationEndExclusive: initial.activationEndExclusive
        });
    }

    function _typeNote() internal pure returns (ExpC0Codec.TypeSchema memory schema) {
        ExpC0Codec.FieldV0[] memory fields = new ExpC0Codec.FieldV0[](2);
        fields[0] = ExpC0Codec.FieldV0(1, 3, true, 64);
        fields[1] = ExpC0Codec.FieldV0(2, 4, false, 0);
        ExpC0Codec.ConstraintV0[] memory constraints = new ExpC0Codec.ConstraintV0[](1);
        constraints[0] = ExpC0Codec.ConstraintV0(1, 2);
        ExpC0Codec.ReferenceRoleV0[] memory roles = new ExpC0Codec.ReferenceRoleV0[](1);
        roles[0] = ExpC0Codec.ReferenceRoleV0(2, 2, bytes32(0));
        schema = ExpC0Codec.TypeSchema({
            semanticCommitment: bytes("exact Note/v0"),
            shape: ExpC0Codec.ShapeV0(fields),
            representation: ExpC0Codec.RepresentationV0(1, 1),
            intrinsicConstraints: constraints,
            referenceRoles: roles
        });
    }

    function _plainType(uint256 salt) internal pure returns (ExpC0Codec.TypeSchema memory schema) {
        ExpC0Codec.FieldV0[] memory fields = new ExpC0Codec.FieldV0[](1);
        fields[0] = ExpC0Codec.FieldV0(1, 3, true, 64);
        ExpC0Codec.ConstraintV0[] memory constraints = new ExpC0Codec.ConstraintV0[](1);
        constraints[0] = ExpC0Codec.ConstraintV0(1, 2);
        schema = ExpC0Codec.TypeSchema({
            semanticCommitment: abi.encodePacked("exact Plain/v0:", salt),
            shape: ExpC0Codec.ShapeV0(fields),
            representation: ExpC0Codec.RepresentationV0(1, 1),
            intrinsicConstraints: constraints,
            referenceRoles: new ExpC0Codec.ReferenceRoleV0[](0)
        });
    }

    function _parentType() internal pure returns (ExpC0Codec.TypeSchema memory schema) {
        schema = _plainType(0x706172656e74);
        schema.semanticCommitment = bytes("exact Parent/v0");
    }

    function _fileType(bytes32 parentTypeId) internal pure returns (ExpC0Codec.TypeSchema memory schema) {
        ExpC0Codec.FieldV0[] memory fields = new ExpC0Codec.FieldV0[](2);
        fields[0] = ExpC0Codec.FieldV0(1, 3, true, 64);
        fields[1] = ExpC0Codec.FieldV0(2, 4, false, 0);
        ExpC0Codec.ConstraintV0[] memory constraints = new ExpC0Codec.ConstraintV0[](1);
        constraints[0] = ExpC0Codec.ConstraintV0(1, 2);
        ExpC0Codec.ReferenceRoleV0[] memory roles = new ExpC0Codec.ReferenceRoleV0[](1);
        roles[0] = ExpC0Codec.ReferenceRoleV0(2, 1, parentTypeId);
        schema = ExpC0Codec.TypeSchema({
            semanticCommitment: bytes("exact File/v0"),
            shape: ExpC0Codec.ShapeV0(fields),
            representation: ExpC0Codec.RepresentationV0(1, 1),
            intrinsicConstraints: constraints,
            referenceRoles: roles
        });
    }

    function _wire(ExpC0Codec.TypeSchema memory schema) internal pure returns (bytes memory) {
        return ExpC0Codec.encodeTypeSchemaV0(schema);
    }

    function _selector(bytes memory reason) internal pure returns (bytes4 selector) {
        if (reason.length < 4) return bytes4(0);
        assembly ("memory-safe") {
            selector := mload(add(reason, 0x20))
        }
    }

    function _publication() internal pure returns (ExpC0Codec.PublicationSet memory publication) {
        bytes32[] memory leaves = new bytes32[](2);
        leaves[0] = RECORD_A;
        leaves[1] = RECORD_B;
        publication = ExpC0Codec.PublicationSet({
            semanticAuthor: ALICE,
            sourcePublicationActor: ALICE,
            sourceAuthorityProfileId: 0x9191919191919191919191919191919191919191919191919191919191919191,
            sourceAuthorityEpoch: 0,
            nonceLane: 0,
            nonce: 7,
            expiryCoordinate: 100,
            visibility: 1,
            suites: 1,
            leaves: leaves
        });
    }
}
