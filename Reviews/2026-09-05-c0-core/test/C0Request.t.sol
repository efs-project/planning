// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {C0PlanCodec} from "../src/C0PlanCodec.sol";
import {C0Request} from "../src/C0Request.sol";
import {StateKernel} from "../src/StateKernel.sol";
import {C0RequestHarness} from "./C0RequestHarness.sol";

contract C0RequestTest {
    struct Request {
        StateKernel.EnvelopeHeader header;
        bytes32[] recordIds;
        StateKernel.SelectedLeaf[] leaves;
        StateKernel.ExpectedRevision[] revisions;
        C0PlanCodec.Effects effects;
        C0PlanCodec.Plan plan;
        uint8 branch;
        C0RequestHarness.AccountPrincipal principal;
        bytes witness;
        bytes payload;
    }

    C0RequestHarness private h0 = new C0RequestHarness(0);
    C0RequestHarness private h32 = new C0RequestHarness(32);
    C0RequestHarness private h8192 = new C0RequestHarness(8192);

    function recordId(bytes32 typeId, bytes memory body) private pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs2/record/1"), typeId, keccak256(body)));
    }

    function base() private pure returns (Request memory r) {
        bytes memory body = hex"42";
        bytes32 typeId = bytes32(uint256(7));
        r.header = StateKernel.EnvelopeHeader(1, bytes32(uint256(11)), bytes32(0), 0, bytes32(uint256(12)), 0);
        r.recordIds = new bytes32[](1);
        r.recordIds[0] = recordId(typeId, body);
        r.leaves = new StateKernel.SelectedLeaf[](1);
        r.leaves[0] = StateKernel.SelectedLeaf(0, typeId, body);
        r.revisions = new StateKernel.ExpectedRevision[](0);
        r.branch = 1;
        r.principal = C0RequestHarness.AccountPrincipal(1, new bytes(0), abi.encodePacked(address(0xa11ce)));
        r.witness = new bytes(65);
        for (uint256 i; i < r.witness.length; ++i) {
            r.witness[i] = bytes1(uint8(i + 1));
        }
        r.payload = new bytes(0);
    }

    function data(C0RequestHarness target, Request memory r) private pure returns (bytes memory) {
        return abi.encodeCall(
            target.inspectBoundsForTest,
            (
                r.header,
                r.recordIds,
                r.leaves,
                r.revisions,
                r.effects,
                r.plan,
                r.branch,
                r.principal,
                r.witness,
                r.payload
            )
        );
    }

    function inspect(C0RequestHarness target, Request memory r) private view returns (C0Request.Prepared memory) {
        return target.inspectBoundsForTest(
            r.header, r.recordIds, r.leaves, r.revisions, r.effects, r.plan, r.branch, r.principal, r.witness, r.payload
        );
    }

    function equal(bytes memory actual, bytes memory expected, string memory reason) private pure {
        require(actual.length == expected.length && keccak256(actual) == keccak256(expected), reason);
    }

    function expectError(C0RequestHarness target, Request memory r, bytes memory expected) private view {
        (bool ok, bytes memory result) = address(target).staticcall(data(target, r));
        require(!ok, "expected request rejection");
        equal(result, expected, "exact request error");
    }

    function expectRawError(C0RequestHarness target, bytes memory callData, bytes memory expected) private view {
        (bool ok, bytes memory result) = address(target).staticcall(callData);
        require(!ok, "expected raw request rejection");
        equal(result, expected, "exact raw request error");
    }

    function decodeRaw(C0RequestHarness target, bytes memory callData)
        private
        view
        returns (C0Request.Prepared memory result)
    {
        (bool ok, bytes memory raw) = address(target).staticcall(callData);
        require(ok, "expected raw request acceptance");
        result = abi.decode(raw, (C0Request.Prepared));
    }

    function setBodies(Request memory r, uint256[] memory lengths) private pure {
        r.recordIds = new bytes32[](lengths.length);
        r.leaves = new StateKernel.SelectedLeaf[](lengths.length);
        for (uint256 i; i < lengths.length; ++i) {
            bytes memory body = new bytes(lengths[i]);
            bytes32 typeId = bytes32(i + 7);
            r.recordIds[i] = recordId(typeId, body);
            r.leaves[i] = StateKernel.SelectedLeaf(uint16(i), typeId, body);
        }
    }

    function maximumRequest(uint256 firstLength, uint256 otherLength) private pure returns (Request memory r) {
        r = base();
        r.recordIds = new bytes32[](64);
        r.leaves = new StateKernel.SelectedLeaf[](64);
        r.revisions = new StateKernel.ExpectedRevision[](64);
        for (uint256 i; i < 64; ++i) {
            bytes memory body = new bytes(i == 0 ? firstLength : otherLength);
            bytes32 typeId = bytes32(i + 7);
            r.recordIds[i] = recordId(typeId, body);
            r.leaves[i] = StateKernel.SelectedLeaf(uint16(i), typeId, body);
            r.revisions[i] = StateKernel.ExpectedRevision(uint16(i), uint32(i));
        }
    }

    function manualDigest(StateKernel.EnvelopeHeader memory header, bytes32[] memory recordIds)
        private
        pure
        returns (bytes32)
    {
        bytes32 domainSeparator = keccak256(
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
                keccak256(abi.encodePacked(recordIds))
            )
        );
        return keccak256(abi.encodePacked(hex"1901", domainSeparator, structHash));
    }

    function wordAt(bytes memory raw, uint256 offset) private pure returns (uint256 value) {
        assembly ("memory-safe") {
            value := mload(add(add(raw, 32), offset))
        }
    }

    function putWord(bytes memory raw, uint256 offset, uint256 value) private pure {
        assembly ("memory-safe") {
            mstore(add(add(raw, 32), offset), value)
        }
    }

    function bodyTail(bytes memory raw, uint256 leafPosition) private pure returns (uint256) {
        uint256 arrayStart = 4 + wordAt(raw, 4 + 7 * 32);
        uint256 tupleHeads = arrayStart + 32;
        uint256 tupleStart = tupleHeads + wordAt(raw, tupleHeads + leafPosition * 32);
        return tupleStart + wordAt(raw, tupleStart + 64);
    }

    function aliasFirstBodyToSecond(bytes memory raw) private pure {
        uint256 arrayStart = 4 + wordAt(raw, 4 + 7 * 32);
        uint256 tupleHeads = arrayStart + 32;
        uint256 firstTuple = tupleHeads + wordAt(raw, tupleHeads);
        uint256 secondBody = bodyTail(raw, 1);
        putWord(raw, firstTuple + 64, secondBody - firstTuple);
    }

    function insertGapBeforePayload(bytes memory canonical) private pure returns (bytes memory gapped) {
        uint256 payloadHead = 4 + 31 * 32;
        uint256 payloadOffset = wordAt(canonical, payloadHead);
        uint256 payloadStart = 4 + payloadOffset;
        gapped = new bytes(canonical.length + 32);
        for (uint256 i; i < payloadStart; ++i) {
            gapped[i] = canonical[i];
        }
        for (uint256 i = payloadStart; i < canonical.length; ++i) {
            gapped[i + 32] = canonical[i];
        }
        putWord(gapped, payloadHead, payloadOffset + 32);
    }

    function testPreparesOneBytePublicationWithoutAuthenticatingOuterFields() public view {
        Request memory r = base();
        r.effects.operationKind = type(uint8).max;
        r.plan.nonceSeq = type(uint64).max;
        r.branch = type(uint8).max;
        r.principal.authorityKind = type(uint8).max;
        r.principal.originRef = hex"deadbeef";
        r.principal.accountOrKey = hex"01";
        r.witness = hex"99";
        C0Request.Prepared memory result = inspect(h0, r);
        bytes32 expectedDigest = manualDigest(r.header, r.recordIds);

        require(result.equivalentWireBytes == 768, "one-byte W");
        require(result.publicationDigest == expectedDigest, "independent unsigned digest");
        require(
            result.publication.envelopeId == keccak256(abi.encode(keccak256("efs2/envelope/1"), expectedDigest)),
            "independent envelope identity"
        );
        require(result.publication.leafMask == 1, "derived mask");
        require(result.publication.recordIds[0] == r.recordIds[0], "record retained");
        require(result.publication.leaves[0].leafIndex == 0, "index retained");
        require(result.publication.leaves[0].typeId == bytes32(uint256(7)), "type retained");
        equal(result.publication.leaves[0].body, hex"42", "body retained");
        require(result.publication.expectedRevisions.length == 0, "CAS retained");
    }

    function testHeaderAndCountGuardSignaturesAndPrecedence() public view {
        Request memory r = base();
        r.header.profile = 2;
        r.header.authorityRef = bytes32(uint256(9));
        r.header.authEpoch = 10;
        r.recordIds = new bytes32[](0);
        expectError(h0, r, abi.encodeWithSelector(C0Request.E_PROFILE.selector, uint16(2)));
        r.header.profile = 1;
        expectError(
            h0, r, abi.encodeWithSelector(C0Request.E_RESERVED_AUTHORITY.selector, bytes32(uint256(9)), uint64(10))
        );
        r.header.authorityRef = bytes32(0);
        r.header.authEpoch = 0;
        expectError(h0, r, abi.encodeWithSelector(C0Request.E_EMPTY_ENVELOPE.selector));

        r = base();
        r.recordIds = new bytes32[](65);
        expectError(h0, r, abi.encodeWithSelector(C0Request.E_LEAF_LIMIT.selector, uint256(65)));
        r = base();
        r.leaves = new StateKernel.SelectedLeaf[](0);
        expectError(h0, r, abi.encodeWithSelector(C0Request.E_BOUNDS.selector, uint16(1)));
        r = base();
        r.leaves = new StateKernel.SelectedLeaf[](65);
        expectError(h0, r, abi.encodeWithSelector(C0Request.E_BOUNDS.selector, uint16(1)));
        r = base();
        r.revisions = new StateKernel.ExpectedRevision[](65);
        expectError(h0, r, abi.encodeWithSelector(C0Request.E_BOUNDS.selector, uint16(1)));
    }

    function testMaximumCountsAscendingBit63AndDuplicateRecordIdsRemainLegal() public view {
        Request memory r = maximumRequest(0, 0);
        bytes32 duplicate = recordId(bytes32(uint256(7)), new bytes(0));
        for (uint256 i; i < 64; ++i) {
            r.recordIds[i] = duplicate;
            r.leaves[i].typeId = bytes32(uint256(7));
        }
        C0Request.Prepared memory result = inspect(h0, r);
        require(result.publication.recordIds.length == 64, "64 records");
        require(result.publication.leaves.length == 64, "64 selected");
        require(result.publication.expectedRevisions.length == 64, "64 CAS");
        require(result.publication.leafMask == type(uint64).max, "bit 63 included");
        require(result.equivalentWireBytes == 12_832, "maximum empty W");
    }

    function testSelectedIndexAndBodyGuardsUseExactOffendingValue() public view {
        Request memory r = base();
        r.leaves[0].leafIndex = 1;
        expectError(h8192, r, abi.encodeWithSelector(C0Request.E_LEAF_RANGE.selector, uint16(1)));

        r = base();
        uint256[] memory two = new uint256[](2);
        setBodies(r, two);
        r.leaves[1].leafIndex = 0;
        expectError(h8192, r, abi.encodeWithSelector(C0Request.E_LEAF_RANGE.selector, uint16(0)));
        r.leaves[0].leafIndex = 1;
        expectError(h8192, r, abi.encodeWithSelector(C0Request.E_LEAF_RANGE.selector, uint16(0)));

        r = base();
        uint256[] memory one = new uint256[](1);
        one[0] = 8192;
        setBodies(r, one);
        require(inspect(h8192, r).equivalentWireBytes == 8928, "individual body exact");
        one[0] = 8193;
        setBodies(r, one);
        expectError(h8192, r, abi.encodeWithSelector(C0Request.E_BODY_LIMIT.selector, uint256(8193)));

        r = base();
        two[0] = 4096;
        two[1] = 4096;
        setBodies(r, two);
        require(inspect(h8192, r).equivalentWireBytes == 9120, "aggregate body exact");
        two[0] = 4097;
        setBodies(r, two);
        expectError(h8192, r, abi.encodeWithSelector(C0Request.E_BODY_LIMIT.selector, uint256(8193)));
    }

    function testFullLengthPassPrecedesBodyHashing() public view {
        Request memory r = base();
        uint256[] memory lengths = new uint256[](2);
        lengths[0] = 4097;
        lengths[1] = 4096;
        setBodies(r, lengths);
        r.recordIds[0] = bytes32(uint256(1));
        expectError(h8192, r, abi.encodeWithSelector(C0Request.E_BODY_LIMIT.selector, uint256(8193)));
    }

    function testWireGuardPrecedesCasAndExactWireBoundaryFits() public view {
        Request memory r = maximumRequest(128, 128);
        r.revisions[1].leafIndex = 0;
        expectError(h8192, r, abi.encodeWithSelector(C0Request.E_WIRE_LIMIT.selector, uint256(21_024)));

        r = maximumRequest(1537, 1);
        require(data(h32, r).length == 21_444, "F=32 exact call cap");
        expectError(h32, r, abi.encodeWithSelector(C0Request.E_WIRE_LIMIT.selector, uint256(16_416)));

        r = maximumRequest(1505, 1);
        C0Request.Prepared memory exact = inspect(h0, r);
        require(exact.equivalentWireBytes == 16_384, "exact W accepted");
    }

    function testCasIndexOrderThenBodyMismatch() public view {
        Request memory r = base();
        r.recordIds[0] = bytes32(uint256(1));
        r.revisions = new StateKernel.ExpectedRevision[](1);
        r.revisions[0] = StateKernel.ExpectedRevision(64, 0);
        expectError(h0, r, abi.encodeWithSelector(C0PlanCodec.InvalidExpectedRevisions.selector));
        r.revisions = new StateKernel.ExpectedRevision[](2);
        r.revisions[0] = StateKernel.ExpectedRevision(1, 0);
        r.revisions[1] = StateKernel.ExpectedRevision(1, 1);
        expectError(h0, r, abi.encodeWithSelector(C0PlanCodec.InvalidExpectedRevisions.selector));
        r.revisions[0] = StateKernel.ExpectedRevision(2, 0);
        r.revisions[1] = StateKernel.ExpectedRevision(1, 1);
        expectError(h0, r, abi.encodeWithSelector(C0PlanCodec.InvalidExpectedRevisions.selector));
        r.revisions = new StateKernel.ExpectedRevision[](0);
        expectError(h0, r, abi.encodeWithSelector(C0Request.E_BODY_MISMATCH.selector, uint16(0)));
    }

    function testActualCallAndPayloadCapsUseExactWideArithmetic() public view {
        Request memory exact = maximumRequest(1505, 1);
        bytes memory canonical = data(h0, exact);
        require(canonical.length == 21_412, "canonical exact call bytes");
        decodeRaw(h0, canonical);
        canonical = bytes.concat(canonical, hex"00");
        expectRawError(
            h0, canonical, abi.encodeWithSelector(C0Request.C0_CALL_LIMIT.selector, uint256(21_413), uint256(21_412))
        );

        Request memory payload = base();
        payload.payload = new bytes(32);
        inspect(h32, payload);
        payload.payload = new bytes(33);
        payload.header.profile = 2;
        expectError(h32, payload, abi.encodeWithSelector(C0Request.C0_PAYLOAD_LIMIT.selector, uint256(33), uint256(32)));
        require(h0.limitForTest(type(uint64).max) == 18_446_744_073_709_573_028, "u64 cap widened before add");
    }

    function testDecoderAcceptedAliasGapAndSuffixKeepSemanticResult() public view {
        Request memory r = base();
        uint256[] memory lengths = new uint256[](2);
        lengths[0] = 1;
        lengths[1] = 1;
        setBodies(r, lengths);
        r.leaves[1].typeId = r.leaves[0].typeId;
        r.recordIds[1] = r.recordIds[0];
        bytes memory canonical = data(h0, r);
        C0Request.Prepared memory expected = decodeRaw(h0, canonical);

        bytes memory aliased = bytes.concat(canonical);
        aliasFirstBodyToSecond(aliased);
        C0Request.Prepared memory aliasResult = decodeRaw(h0, aliased);
        require(aliasResult.publicationDigest == expected.publicationDigest, "alias digest");
        require(aliasResult.publication.envelopeId == expected.publication.envelopeId, "alias envelope");
        require(aliasResult.publication.leafMask == expected.publication.leafMask, "alias mask");
        equal(aliasResult.publication.leaves[0].body, hex"00", "alias first body");
        equal(aliasResult.publication.leaves[1].body, hex"00", "alias second body");

        C0Request.Prepared memory gapResult = decodeRaw(h0, insertGapBeforePayload(canonical));
        require(gapResult.publicationDigest == expected.publicationDigest, "gap digest");
        C0Request.Prepared memory suffixResult = decodeRaw(h0, bytes.concat(canonical, hex"aabbcc"));
        require(suffixResult.publication.envelopeId == expected.publication.envelopeId, "suffix envelope");
    }

    function testAliasAmplificationAndInflatedLiveLengthCannotEvadeBodyBudget() public view {
        Request memory r = base();
        uint256[] memory lengths = new uint256[](2);
        lengths[0] = 0;
        lengths[1] = 8192;
        setBodies(r, lengths);
        bytes memory aliased = data(h8192, r);
        aliasFirstBodyToSecond(aliased);
        expectRawError(h8192, aliased, abi.encodeWithSelector(C0Request.E_BODY_LIMIT.selector, uint256(16_384)));

        bytes memory inflated = bytes.concat(data(h8192, r), new bytes(32));
        putWord(inflated, bodyTail(inflated, 1), 8193);
        expectRawError(h8192, inflated, abi.encodeWithSelector(C0Request.E_BODY_LIMIT.selector, uint256(8193)));
    }

    function testInaccessibleLiveBodyOffsetRemainsOuterFramingFailure() public view {
        Request memory r = base();
        bytes memory malformed = data(h0, r);
        uint256 arrayStart = 4 + wordAt(malformed, 4 + 7 * 32);
        uint256 tupleHeads = arrayStart + 32;
        uint256 firstTuple = tupleHeads + wordAt(malformed, tupleHeads);
        putWord(malformed, firstTuple + 64, type(uint256).max);
        (bool ok,) = address(h0).staticcall(malformed);
        require(!ok, "inaccessible body offset must fail");
    }
}
