// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ExpC0Codec} from "../src-sol/ExpC0Codec.sol";

contract ExpC0CodecTest {
    bytes32 internal constant EXPECTED_PRINCIPAL = 0xd2b78ce29c18b7339d04311cf898b594370b1055428a10dfd740eff5db3725bc;
    bytes32 internal constant EXPECTED_INITIAL_REVISION =
        0xf3247948df06a029f8ac08ec4e721a9182f14f489920a42426fc585e809675ea;
    bytes32 internal constant EXPECTED_REALM = 0x9e289671410f2b79594923c400395dd6196f90419c55b6fc1370ef5a08022633;
    bytes32 internal constant EXPECTED_REALM_REVISION =
        0x6f02a444ef364f0869c54fce0ea261c1d7c017419068d27cbadeb6d25c280ecd;
    bytes32 internal constant EXPECTED_TYPE = 0x62f835130312d0bfee6e99785405e3d3b86e9739be7cadce830d6be7fcf24452;
    bytes32 internal constant EXPECTED_RECORD_A = 0x7f80167c8ca5fdb7ce2d7556d3a60e249433db54a0c52532b44316677e044a5b;
    bytes32 internal constant EXPECTED_RECORD_B = 0x36bdd764fbcb78f3b557ad6e73f93216311acf0566da52fb6288bf6e80c01b09;
    bytes32 internal constant EXPECTED_PUBLICATION = 0x3ad43ff4f4f07d47a08dfbfe7b7912b0008b43d9f4cba2e340803568da6dfc24;
    bytes32 internal constant EXPECTED_OCCURRENCE_0 =
        0x7d703c567d5971362614cd761b377bf49caeba949c60d49293f1bb092241bce9;
    bytes32 internal constant EXPECTED_OCCURRENCE_1 =
        0xef16adcba179f0db0a21579aacab0d066768b1dc11450ecc54f814366aa0646f;
    bytes32 internal constant EXPECTED_CURSOR = 0xe8deae999409cd5f4e7288e53064e3fe8c205d29547a48e030850a92610a9ffd;
    bytes32 internal constant EXPECTED_PROJECTION = 0x07f261afb9cb94c32fc13b810d82f3ce927eae5392a40f3d37544c6918815db4;

    function testPrincipalVector() external pure {
        _assertEq(ExpC0Codec.principalId(_alice()), EXPECTED_PRINCIPAL);
    }

    function testRealmVectorsAndMutationSensitivity() external pure {
        ExpC0Codec.InitialRevision memory initial = _initialRevision();
        _assertEq(ExpC0Codec.initialRevisionCommitment(initial), EXPECTED_INITIAL_REVISION);

        ExpC0Codec.RealmBootstrap memory bootstrap = _bootstrap(initial);
        _assertEq(ExpC0Codec.realmId(bootstrap), EXPECTED_REALM);

        ExpC0Codec.RealmRevision memory revision = _realmRevision(initial);
        _assertEq(ExpC0Codec.realmRevisionId(revision), EXPECTED_REALM_REVISION);

        bootstrap.disclosedPowers[1] = 3;
        require(ExpC0Codec.realmId(bootstrap) != EXPECTED_REALM, "powers must bind RealmId");
    }

    function testTypeAndRecordVectors() external pure {
        ExpC0Codec.TypeSchema memory schema = _typeNote();
        _assertEq(ExpC0Codec.typeSchemaId(schema), EXPECTED_TYPE);

        bytes memory bodyA = abi.encode(bytes("alpha"), ExpC0Codec.OptionalRecord(false, bytes32(0)));
        _assertEq(ExpC0Codec.recordId(EXPECTED_TYPE, bodyA), EXPECTED_RECORD_A);

        bytes memory bodyB = abi.encode(bytes("beta"), ExpC0Codec.OptionalRecord(true, EXPECTED_RECORD_A));
        _assertEq(ExpC0Codec.recordId(EXPECTED_TYPE, bodyB), EXPECTED_RECORD_B);
    }

    function testPublicationAndOccurrenceVectors() external pure {
        ExpC0Codec.PublicationSet memory publication = _publication();
        _assertEq(ExpC0Codec.publicationSetId(publication), EXPECTED_PUBLICATION);
        _assertEq(ExpC0Codec.occurrenceId(EXPECTED_PUBLICATION, 0), EXPECTED_OCCURRENCE_0);
        _assertEq(ExpC0Codec.occurrenceId(EXPECTED_PUBLICATION, 1), EXPECTED_OCCURRENCE_1);

        (publication.leaves[0], publication.leaves[1]) = (publication.leaves[1], publication.leaves[0]);
        require(ExpC0Codec.publicationSetId(publication) != EXPECTED_PUBLICATION, "leaf order must bind ID");
    }

    function testCursorVectorAndCoordinateSensitivity() external pure {
        ExpC0Codec.CursorV0 memory cursor = ExpC0Codec.CursorV0({
            realmId: EXPECTED_REALM,
            realmRevisionId: EXPECTED_REALM_REVISION,
            queryProfileId: 0x12de5034d05bb21f1c0a48779a3228622bbacef5d3332dbe6c548719af0f770f,
            generation: 1,
            ordering: 1,
            activationHighWater: 2,
            coveredThroughHighWater: 1,
            executionCoordinate: 42,
            observerBlockHash: 0xa5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5,
            afterPostingOrdinal: 1,
            declaredDomainRoot: 0xbb308a5f3fc667db5d5737a2c62bd51f5944f3332b804391fe73e4cb59fefe00
        });
        _assertEq(ExpC0Codec.cursorCommitment(cursor), EXPECTED_CURSOR);
        cursor.activationHighWater = 3;
        require(ExpC0Codec.cursorCommitment(cursor) != EXPECTED_CURSOR, "cursor coordinate must bind");
    }

    function testProjectionRootVectorAndMissingEntrySensitivity() external pure {
        ExpC0Codec.InitialRevision memory initial = _initialRevision();
        ExpC0Codec.RealmBootstrap memory bootstrap = _bootstrap(initial);
        ExpC0Codec.RealmRevision memory revision = _realmRevision(initial);
        ExpC0Codec.TypeSchema memory schema = _typeNote();
        ExpC0Codec.PublicationSet memory publication = _publication();
        bytes memory bodyA = abi.encode(bytes("alpha"), ExpC0Codec.OptionalRecord(false, bytes32(0)));
        bytes memory bodyB = abi.encode(bytes("beta"), ExpC0Codec.OptionalRecord(true, EXPECTED_RECORD_A));

        ExpC0Codec.ProjectionEntryV0[] memory entries = new ExpC0Codec.ProjectionEntryV0[](7);
        entries[0] = ExpC0Codec.ProjectionEntryV0(1, abi.encode(EXPECTED_REALM), abi.encode(bootstrap));
        entries[1] = ExpC0Codec.ProjectionEntryV0(2, abi.encode(EXPECTED_REALM, uint32(0)), abi.encode(revision));
        entries[2] = ExpC0Codec.ProjectionEntryV0(3, abi.encode(EXPECTED_TYPE), ExpC0Codec.encodeTypeSchemaV0(schema));
        entries[3] = ExpC0Codec.ProjectionEntryV0(
            4, abi.encode(EXPECTED_RECORD_A), abi.encode(ExpC0Codec.RecordV0(EXPECTED_TYPE, bodyA))
        );
        entries[4] = ExpC0Codec.ProjectionEntryV0(
            4, abi.encode(EXPECTED_RECORD_B), abi.encode(ExpC0Codec.RecordV0(EXPECTED_TYPE, bodyB))
        );
        entries[5] = ExpC0Codec.ProjectionEntryV0(5, abi.encode(EXPECTED_PUBLICATION), abi.encode(publication));
        entries[6] =
            ExpC0Codec.ProjectionEntryV0(23, abi.encode(), abi.encode(uint32(0), uint32(0), uint32(0), uint32(0)));

        _assertEq(ExpC0Codec.projectionRoot(entries), EXPECTED_PROJECTION);

        ExpC0Codec.ProjectionEntryV0[] memory missing = new ExpC0Codec.ProjectionEntryV0[](6);
        for (uint256 i; i < missing.length; ++i) {
            missing[i] = entries[i];
        }
        require(ExpC0Codec.projectionRoot(missing) != EXPECTED_PROJECTION, "missing entry must change root");
    }

    function _alice() internal pure returns (ExpC0Codec.Principal memory) {
        return ExpC0Codec.Principal({
            authorityKind: 1, originLineage: bytes(""), account: 0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa
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
            initialRevisionId: EXPECTED_REALM_REVISION,
            disclosedPowers: powers
        });
    }

    function _realmRevision(ExpC0Codec.InitialRevision memory initial)
        internal
        pure
        returns (ExpC0Codec.RealmRevision memory)
    {
        return ExpC0Codec.RealmRevision({
            realmId: EXPECTED_REALM,
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

    function _publication() internal pure returns (ExpC0Codec.PublicationSet memory publication) {
        bytes32[] memory leaves = new bytes32[](2);
        leaves[0] = EXPECTED_RECORD_A;
        leaves[1] = EXPECTED_RECORD_B;
        publication = ExpC0Codec.PublicationSet({
            semanticAuthor: EXPECTED_PRINCIPAL,
            sourcePublicationActor: EXPECTED_PRINCIPAL,
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

    function _assertEq(bytes32 actual, bytes32 expected) internal pure {
        require(actual == expected, "vector mismatch");
    }
}
