// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {C0PlanCodec} from "../src/C0PlanCodec.sol";
import {C0BatchEvidence} from "../src/C0BatchEvidence.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {C0CodecHarness} from "./C0CodecHarness.sol";

contract C0CodecTest {
    C0CodecHarness private h = new C0CodecHarness();

    bytes32 private constant CAS_HASH = hex"4efdbe2f47739ce9c5544159f07e456f85f0bf2ea5b463d244714bedad903d80";
    bytes32 private constant EFFECTS_HASH = hex"0c405e03b8602dec96cf4574d26783cb75cecdcfb06adb2869fe780df196a59d";

    function equal(bytes memory actual, bytes memory expected, string memory reason) private pure {
        require(actual.length == expected.length && keccak256(actual) == keccak256(expected), reason);
    }

    function expectError(bytes memory callData, bytes memory expected) private view {
        (bool ok, bytes memory result) = address(h).staticcall(callData);
        require(!ok, "expected codec rejection");
        equal(result, expected, "exact codec error");
    }

    function fixtureRows() private pure returns (StateKernel.ExpectedRevision[] memory rows) {
        rows = new StateKernel.ExpectedRevision[](2);
        rows[0] = StateKernel.ExpectedRevision(1, 7);
        rows[1] = StateKernel.ExpectedRevision(63, 4_294_967_294);
    }

    function fixtureEffects() private pure returns (C0PlanCodec.Effects memory) {
        return C0PlanCodec.Effects(
            bytes32(uint256(1)),
            address(2),
            bytes32(uint256(3)),
            bytes32(uint256(4)),
            8,
            bytes32(uint256(5)),
            9_223_372_036_854_775_810,
            CAS_HASH,
            address(6),
            bytes32(uint256(7))
        );
    }

    function fixturePlan() private pure returns (C0PlanCodec.Plan memory) {
        return C0PlanCodec.Plan(
            bytes32(uint256(8)),
            bytes32(uint256(9)),
            bytes32(uint256(1)),
            EFFECTS_HASH,
            address(2),
            bytes32(uint256(10)),
            0,
            1,
            9000
        );
    }

    function manualExpectedRevisionsHash(StateKernel.ExpectedRevision[] memory rows) private pure returns (bytes32) {
        bytes32 typeHash = keccak256("ExpectedRevision(uint16 leafIndex,uint32 revision)");
        bytes memory hashes;
        for (uint256 i; i < rows.length; ++i) {
            hashes = bytes.concat(
                hashes, abi.encodePacked(keccak256(abi.encode(typeHash, rows[i].leafIndex, rows[i].revision)))
            );
        }
        return keccak256(hashes);
    }

    function manualEffectsHash(C0PlanCodec.Effects memory e) private pure returns (bytes32) {
        bytes32 typeHash = keccak256(
            "C0RealmEffects(bytes32 realmId,address core,bytes32 routeConfigId,bytes32 genesisReceiptHash,uint8 operationKind,bytes32 envelopeId,uint64 leafMask,bytes32 expectedRevisionsHash,address stateByteStore,bytes32 byteCommitment)"
        );
        return keccak256(
            abi.encode(
                typeHash,
                e.realmId,
                e.core,
                e.routeConfigId,
                e.genesisReceiptHash,
                e.operationKind,
                e.envelopeId,
                e.leafMask,
                e.expectedRevisionsHash,
                e.stateByteStore,
                e.byteCommitment
            )
        );
    }

    function manualPlanStructHash(C0PlanCodec.Plan memory p) private pure returns (bytes32) {
        bytes32 typeHash = keccak256(
            "WritePlan(bytes32 c0ProfileId,bytes32 publicationDigest,bytes32 realmId,bytes32 realmEffectsDigest,address executor,bytes32 executorCodeHash,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)"
        );
        return keccak256(
            abi.encode(
                typeHash,
                p.c0ProfileId,
                p.publicationDigest,
                p.realmId,
                p.realmEffectsDigest,
                p.executor,
                p.executorCodeHash,
                p.nonceKey,
                p.nonceSeq,
                p.notAfter
            )
        );
    }

    function manualDomain(uint256 chainId, address core) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("EFS2-MVP-C0-WritePlan"),
                keccak256("1"),
                chainId,
                core
            )
        );
    }

    function manualPlan(C0PlanCodec.Plan memory p) private pure returns (bytes memory) {
        return abi.encodePacked(
            p.c0ProfileId,
            p.publicationDigest,
            p.realmId,
            p.realmEffectsDigest,
            p.executor,
            p.executorCodeHash,
            p.nonceKey,
            p.nonceSeq,
            p.notAfter
        );
    }

    function manualEffects(C0PlanCodec.Effects memory e) private pure returns (bytes memory) {
        return abi.encodePacked(
            e.realmId,
            e.core,
            e.routeConfigId,
            e.genesisReceiptHash,
            e.operationKind,
            e.envelopeId,
            e.leafMask,
            e.expectedRevisionsHash,
            e.stateByteStore,
            e.byteCommitment
        );
    }

    function manualEvidence(C0BatchEvidence.Evidence memory e) private pure returns (bytes memory framed) {
        framed = bytes.concat(
            abi.encodePacked(uint16(1), e.branch), e.descriptor, manualPlan(e.plan), manualEffects(e.effects)
        );
        framed = bytes.concat(framed, abi.encodePacked(uint8(e.expectedRevisions.length)));
        for (uint256 i; i < e.expectedRevisions.length; ++i) {
            framed = bytes.concat(
                framed, abi.encodePacked(e.expectedRevisions[i].leafIndex, e.expectedRevisions[i].revision)
            );
        }
        framed = bytes.concat(
            framed,
            e.witness,
            abi.encodePacked(
                e.actualSigner,
                e.submittingCaller,
                e.transactionOrigin,
                uint8(e.observedAccountCode.length),
                e.observedAccountCode,
                e.admittedAtTimestamp,
                e.previousSequence
            )
        );
    }

    function baseEvidence(uint8 branch) private pure returns (C0BatchEvidence.Evidence memory e) {
        e.branch = branch;
        e.descriptor = abi.encodePacked(hex"0100", address(0xa11ce));
        e.plan = fixturePlan();
        e.effects = fixtureEffects();
        e.expectedRevisions = new StateKernel.ExpectedRevision[](0);
        e.witness = branch == 1 ? new bytes(65) : new bytes(0);
        e.actualSigner = address(0xa11ce);
        e.submittingCaller = address(0xb0b);
        e.transactionOrigin = address(0xc0de);
        e.observedAccountCode = new bytes(0);
        e.admittedAtTimestamp = 8_888;
        e.previousSequence = 0;
    }

    function testLiteralPlanDigest() public view {
        C0PlanCodec.Plan memory p = fixturePlan();
        require(
            h.planDigest(p, 31337, address(2)) == hex"6fb6e6bbf70cbd51fa95b373752e525e9a79aea40051ba6a36bb5dd370187c4f",
            "literal C0 WritePlan commitment"
        );
    }

    function testLiteralIndependentTypedHashes() public view {
        StateKernel.ExpectedRevision[] memory rows = fixtureRows();
        C0PlanCodec.Effects memory e = fixtureEffects();
        C0PlanCodec.Plan memory p = fixturePlan();
        require(h.expectedRevisionsHash(rows) == CAS_HASH, "literal CAS hash");
        require(h.effectsHash(e) == EFFECTS_HASH, "literal effects hash");
        require(
            h.planStructHash(p) == hex"a4fd0267c4aa60f334a1ae06cd1c03372081ab0a73e38cb0545daddb3cc6f9e0",
            "literal plan struct hash"
        );
        require(
            h.domainSeparator(31337, address(2))
                == hex"42227fe1cacfc7e934646314ed4171975a4f299efb99df14fa119558b2b7df01",
            "literal domain"
        );
        require(manualExpectedRevisionsHash(rows) == CAS_HASH, "manual CAS preimage");
        require(manualEffectsHash(e) == EFFECTS_HASH, "manual effects preimage");
        require(manualPlanStructHash(p) == h.planStructHash(p), "manual plan preimage");
    }

    function testPublicationDigestUsesExactEnvelopePreimage() public view {
        StateKernel.EnvelopeHeader memory header =
            StateKernel.EnvelopeHeader(1, bytes32(uint256(11)), bytes32(0), 0, bytes32(uint256(12)), type(uint64).max);
        bytes32[] memory ids = new bytes32[](2);
        ids[0] = bytes32(uint256(21));
        ids[1] = bytes32(uint256(22));
        bytes32 domain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-Envelope"), keccak256("1")
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)"
                ),
                header.profile,
                header.principalId,
                header.authorityRef,
                header.authEpoch,
                header.pubNonce,
                header.notAfter,
                keccak256(abi.encodePacked(ids))
            )
        );
        bytes32 expected = keccak256(abi.encodePacked(hex"1901", domain, structHash));
        require(h.publicationDigest(header, ids) == expected, "manual envelope commitment");
        (ids[0], ids[1]) = (ids[1], ids[0]);
        require(h.publicationDigest(header, ids) != expected, "record order is committed");
    }

    function testPublicationHeaderPrecedesRecordCountAndCountsAreBounded() public view {
        bytes32[] memory none = new bytes32[](0);
        StateKernel.EnvelopeHeader memory header =
            StateKernel.EnvelopeHeader(2, bytes32(0), bytes32(uint256(1)), 1, bytes32(0), 0);
        expectError(
            abi.encodeCall(h.publicationDigest, (header, none)),
            abi.encodeWithSelector(C0PlanCodec.InvalidPublicationHeader.selector)
        );
        header = StateKernel.EnvelopeHeader(1, bytes32(0), bytes32(0), 0, bytes32(0), 0);
        expectError(
            abi.encodeCall(h.publicationDigest, (header, none)),
            abi.encodeWithSelector(C0PlanCodec.InvalidRecordCount.selector, uint256(0))
        );
        bytes32[] memory tooMany = new bytes32[](65);
        expectError(
            abi.encodeCall(h.publicationDigest, (header, tooMany)),
            abi.encodeWithSelector(C0PlanCodec.InvalidRecordCount.selector, uint256(65))
        );
        bytes32[] memory maximum = new bytes32[](64);
        for (uint256 i; i < maximum.length; ++i) {
            maximum[i] = bytes32(i + 1);
        }
        require(h.publicationDigest(header, maximum) != bytes32(0), "64 records accepted");
    }

    function testEveryInvalidPublicationHeaderFieldRejects() public view {
        bytes32[] memory ids = new bytes32[](1);
        ids[0] = bytes32(uint256(1));
        StateKernel.EnvelopeHeader memory header =
            StateKernel.EnvelopeHeader(2, bytes32(0), bytes32(0), 0, bytes32(0), 0);
        expectError(
            abi.encodeCall(h.publicationDigest, (header, ids)),
            abi.encodeWithSelector(C0PlanCodec.InvalidPublicationHeader.selector)
        );
        header = StateKernel.EnvelopeHeader(1, bytes32(0), bytes32(uint256(1)), 0, bytes32(0), 0);
        expectError(
            abi.encodeCall(h.publicationDigest, (header, ids)),
            abi.encodeWithSelector(C0PlanCodec.InvalidPublicationHeader.selector)
        );
        header = StateKernel.EnvelopeHeader(1, bytes32(0), bytes32(0), 1, bytes32(0), 0);
        expectError(
            abi.encodeCall(h.publicationDigest, (header, ids)),
            abi.encodeWithSelector(C0PlanCodec.InvalidPublicationHeader.selector)
        );
    }

    function testExpectedRevisionsEmptyTwoAndMaximum() public view {
        StateKernel.ExpectedRevision[] memory none = new StateKernel.ExpectedRevision[](0);
        require(h.expectedRevisionsHash(none) == keccak256(""), "empty CAS commitment");
        require(h.expectedRevisionsHash(fixtureRows()) == CAS_HASH, "two-row CAS commitment");
        StateKernel.ExpectedRevision[] memory maximum = new StateKernel.ExpectedRevision[](64);
        for (uint16 i; i < 64; ++i) {
            maximum[i] = StateKernel.ExpectedRevision(i, type(uint32).max);
        }
        require(h.expectedRevisionsHash(maximum) == manualExpectedRevisionsHash(maximum), "64-row CAS commitment");
    }

    function testExpectedRevisionsRejectCountOrderDuplicateAndIndex() public view {
        StateKernel.ExpectedRevision[] memory rows = new StateKernel.ExpectedRevision[](65);
        expectError(
            abi.encodeCall(h.expectedRevisionsHash, (rows)),
            abi.encodeWithSelector(C0PlanCodec.InvalidExpectedRevisions.selector)
        );
        rows = new StateKernel.ExpectedRevision[](2);
        rows[0] = StateKernel.ExpectedRevision(2, 0);
        rows[1] = StateKernel.ExpectedRevision(1, 0);
        expectError(
            abi.encodeCall(h.expectedRevisionsHash, (rows)),
            abi.encodeWithSelector(C0PlanCodec.InvalidExpectedRevisions.selector)
        );
        rows[1] = StateKernel.ExpectedRevision(2, 1);
        expectError(
            abi.encodeCall(h.expectedRevisionsHash, (rows)),
            abi.encodeWithSelector(C0PlanCodec.InvalidExpectedRevisions.selector)
        );
        rows = new StateKernel.ExpectedRevision[](1);
        rows[0] = StateKernel.ExpectedRevision(64, 0);
        expectError(
            abi.encodeCall(h.expectedRevisionsHash, (rows)),
            abi.encodeWithSelector(C0PlanCodec.InvalidExpectedRevisions.selector)
        );
    }

    function testPackedPlanAndEffectsUseExactWidthsAtBoundaries() public view {
        C0PlanCodec.Plan memory p = fixturePlan();
        p.nonceKey = type(uint192).max;
        p.nonceSeq = type(uint64).max;
        p.notAfter = type(uint64).max;
        bytes memory packedPlan = h.encodePlan(p);
        equal(packedPlan, manualPlan(p), "exact packed plan");
        require(packedPlan.length == 220, "220-byte plan");
        require(h.planStructHash(p) == manualPlanStructHash(p), "full-width plan hash");
        require(
            h.domainSeparator(type(uint256).max, address(type(uint160).max))
                == manualDomain(type(uint256).max, address(type(uint160).max)),
            "full-width domain"
        );

        C0PlanCodec.Effects memory e = fixtureEffects();
        e.operationKind = type(uint8).max;
        e.leafMask = type(uint64).max;
        bytes memory packedEffects = h.encodeEffects(e);
        equal(packedEffects, manualEffects(e), "exact packed effects");
        require(packedEffects.length == 241, "241-byte effects");
        require(h.effectsHash(e) == manualEffectsHash(e), "full-width effects hash");
    }

    function testEveryPlanFieldChangesTypedHash() public view {
        C0PlanCodec.Plan memory p = fixturePlan();
        bytes32 original = h.planStructHash(p);
        p.c0ProfileId = bytes32(uint256(101));
        require(h.planStructHash(p) != original, "c0ProfileId");
        p = fixturePlan();
        p.publicationDigest = bytes32(uint256(102));
        require(h.planStructHash(p) != original, "publicationDigest");
        p = fixturePlan();
        p.realmId = bytes32(uint256(103));
        require(h.planStructHash(p) != original, "realmId");
        p = fixturePlan();
        p.realmEffectsDigest = bytes32(uint256(104));
        require(h.planStructHash(p) != original, "realmEffectsDigest");
        p = fixturePlan();
        p.executor = address(105);
        require(h.planStructHash(p) != original, "executor");
        p = fixturePlan();
        p.executorCodeHash = bytes32(uint256(106));
        require(h.planStructHash(p) != original, "executorCodeHash");
        p = fixturePlan();
        p.nonceKey = 107;
        require(h.planStructHash(p) != original, "nonceKey");
        p = fixturePlan();
        p.nonceSeq = 108;
        require(h.planStructHash(p) != original, "nonceSeq");
        p = fixturePlan();
        p.notAfter = 109;
        require(h.planStructHash(p) != original, "notAfter");
    }

    function testEveryEffectsFieldChangesTypedHash() public view {
        C0PlanCodec.Effects memory e = fixtureEffects();
        bytes32 original = h.effectsHash(e);
        e.realmId = bytes32(uint256(101));
        require(h.effectsHash(e) != original, "realmId");
        e = fixtureEffects();
        e.core = address(102);
        require(h.effectsHash(e) != original, "core");
        e = fixtureEffects();
        e.routeConfigId = bytes32(uint256(103));
        require(h.effectsHash(e) != original, "routeConfigId");
        e = fixtureEffects();
        e.genesisReceiptHash = bytes32(uint256(104));
        require(h.effectsHash(e) != original, "genesisReceiptHash");
        e = fixtureEffects();
        e.operationKind = 105;
        require(h.effectsHash(e) != original, "operationKind");
        e = fixtureEffects();
        e.envelopeId = bytes32(uint256(106));
        require(h.effectsHash(e) != original, "envelopeId");
        e = fixtureEffects();
        e.leafMask = 107;
        require(h.effectsHash(e) != original, "leafMask");
        e = fixtureEffects();
        e.expectedRevisionsHash = bytes32(uint256(108));
        require(h.effectsHash(e) != original, "expectedRevisionsHash");
        e = fixtureEffects();
        e.stateByteStore = address(109);
        require(h.effectsHash(e) != original, "stateByteStore");
        e = fixtureEffects();
        e.byteCommitment = bytes32(uint256(110));
        require(h.effectsHash(e) != original, "byteCommitment");
    }

    function testHandFramedCompositeEvidenceExactBytes() public view {
        C0BatchEvidence.Evidence memory e = baseEvidence(1);
        e.expectedRevisions = fixtureRows();
        e.witness =
            hex"0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f4041";
        e.observedAccountCode = abi.encodePacked(hex"ef0100", address(0xd1e6a7e));
        bytes memory expected = manualEvidence(e);
        require(expected.length == 664, "manual composite length");
        equal(h.encodeEvidence(e), expected, "hand-framed composite evidence");
    }

    function testHandFramedDirectEvidenceExactBytes() public view {
        C0BatchEvidence.Evidence memory e = baseEvidence(2);
        bytes memory expected = manualEvidence(e);
        require(expected.length == 564, "manual direct length");
        equal(h.encodeEvidence(e), expected, "hand-framed direct evidence");
    }

    function testEvidenceMaximumLengthsAndBoundaryWords() public view {
        StateKernel.ExpectedRevision[] memory rows = new StateKernel.ExpectedRevision[](64);
        for (uint16 i; i < 64; ++i) {
            rows[i] = StateKernel.ExpectedRevision(i, type(uint32).max);
        }
        C0BatchEvidence.Evidence memory composite = baseEvidence(1);
        composite.expectedRevisions = rows;
        composite.observedAccountCode = abi.encodePacked(hex"ef0100", address(type(uint160).max));
        composite.admittedAtTimestamp = type(uint64).max;
        composite.previousSequence = type(uint64).max;
        bytes memory compositeBytes = h.encodeEvidence(composite);
        require(compositeBytes.length == 1036, "composite maximum");
        equal(compositeBytes, manualEvidence(composite), "composite boundary framing");

        C0BatchEvidence.Evidence memory direct = baseEvidence(2);
        direct.expectedRevisions = rows;
        bytes memory directBytes = h.encodeEvidence(direct);
        require(directBytes.length == 948, "direct maximum");
        equal(directBytes, manualEvidence(direct), "direct boundary framing");
    }

    function testEvidenceRejectsUnsupportedBranchBeforeOtherFraming() public view {
        C0BatchEvidence.Evidence memory e = baseEvidence(3);
        e.descriptor = new bytes(0);
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.UnsupportedBranch.selector, uint8(3))
        );
    }

    function testEvidenceFramingPrecedesCasValidation() public view {
        C0BatchEvidence.Evidence memory e = baseEvidence(1);
        e.expectedRevisions = new StateKernel.ExpectedRevision[](2);
        e.expectedRevisions[0] = StateKernel.ExpectedRevision(1, 0);
        e.expectedRevisions[1] = StateKernel.ExpectedRevision(1, 1);
        e.witness = new bytes(64);
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
    }

    function testEvidenceRequiresExactPrincipalDescriptor() public view {
        C0BatchEvidence.Evidence memory e = baseEvidence(1);
        e.descriptor = new bytes(21);
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
        e.descriptor = new bytes(23);
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
        e.descriptor = abi.encodePacked(hex"0200", address(1));
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
        e.descriptor = abi.encodePacked(hex"0101", address(1));
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
    }

    function testEvidenceRequiresBranchWitnessFraming() public view {
        C0BatchEvidence.Evidence memory e = baseEvidence(1);
        e.witness = new bytes(64);
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
        e.witness = new bytes(66);
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
        e = baseEvidence(2);
        e.witness = new bytes(1);
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
    }

    function testCompositeCodeAllowsEmptyAndExactDesignatorIncludingZero() public view {
        C0BatchEvidence.Evidence memory e = baseEvidence(1);
        bytes memory emptyCode = h.encodeEvidence(e);
        require(emptyCode.length == 629, "composite empty-code length");
        e.observedAccountCode = abi.encodePacked(hex"ef0100", address(0));
        bytes memory zeroDesignator = h.encodeEvidence(e);
        require(zeroDesignator.length == 652, "zero designator retained");
        require(keccak256(emptyCode) != keccak256(zeroDesignator), "empty and zero-designator differ");
        equal(zeroDesignator, manualEvidence(e), "zero designator framing");
    }

    function testEvidenceRejectsInvalidCompositeCodeLengthsAndPrefix() public view {
        C0BatchEvidence.Evidence memory e = baseEvidence(1);
        e.observedAccountCode = new bytes(1);
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
        e.observedAccountCode = new bytes(22);
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
        e.observedAccountCode = new bytes(24);
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
        e.observedAccountCode = abi.encodePacked(hex"ef0101", address(1));
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
    }

    function testDirectEvidenceRefusesNonemptyObservedCode() public view {
        C0BatchEvidence.Evidence memory e = baseEvidence(2);
        e.observedAccountCode = abi.encodePacked(hex"ef0100", address(1));
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)),
            abi.encodeWithSelector(C0BatchEvidence.InvalidEvidenceFraming.selector)
        );
    }

    function testEvidenceRetainsPlanCodecCasRejection() public view {
        C0BatchEvidence.Evidence memory e = baseEvidence(1);
        e.expectedRevisions = new StateKernel.ExpectedRevision[](2);
        e.expectedRevisions[0] = StateKernel.ExpectedRevision(1, 0);
        e.expectedRevisions[1] = StateKernel.ExpectedRevision(1, 1);
        expectError(
            abi.encodeCall(h.encodeEvidence, (e)), abi.encodeWithSelector(C0PlanCodec.InvalidExpectedRevisions.selector)
        );
    }
}
