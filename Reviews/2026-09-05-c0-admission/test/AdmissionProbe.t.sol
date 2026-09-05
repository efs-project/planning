// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {AdmissionProbe} from "../src/AdmissionProbe.sol";

interface VmAdmission {
    function addr(uint256) external returns (address);
    function sign(uint256, bytes32) external returns (uint8, bytes32, bytes32);
    function readFile(string calldata) external view returns (string memory);
    function parseJsonString(string calldata, string calldata) external pure returns (string memory);
    function parseBytes(string calldata) external pure returns (bytes memory);
    function toString(uint256) external pure returns (string memory);
    function warp(uint256) external;
    function chainId(uint256) external;
}

contract AdmissionProbeTest {
    VmAdmission private constant vm = VmAdmission(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 private constant AUTHOR_KEY = 0xa11ce;
    AdmissionProbe private probe;
    bytes[4] private groups;
    bytes32 private principal;

    struct Request {
        AdmissionProbe.EnvelopeHeader publication;
        bytes32[] recordIds;
        bytes body;
        AdmissionProbe.C0RealmEffects effects;
        AdmissionProbe.WritePlan plan;
        bytes witness;
    }

    function setUp() public {
        string memory json = vm.readFile("../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json");
        bytes32[4] memory hashes;
        for (uint256 i; i < 4; ++i) {
            groups[i] = vm.parseBytes(string.concat("0x", vm.parseJsonString(json,
                string.concat(".groups[", vm.toString(i), "].groupHex"))));
            hashes[i] = keccak256(groups[i]);
        }
        // Independent literal metadata/field framing; only group/blob lengths are computed.
        bytes memory blob = abi.encodePacked(hex"0001001154797065536368656d6147726f75702f31000000", bytes32(0),
            hex"0001000a67726f75704279746573051ffe0000000000000000");
        bytes memory metaGroup = abi.encodePacked(uint16(1), uint16(blob.length), blob);
        address author = vm.addr(AUTHOR_KEY);
        probe = new AdmissionProbe(AdmissionProbe.Config(keccak256("synthetic-realm"), address(0xf00d),
            author, address(0xb007), hashes), metaGroup, bytes("declarations-only;no-full-c0"));
        principal = keccak256(abi.encode(keccak256("efs2/principal/1"), uint256(1),
            keccak256(abi.encodePacked(hex"0100", author))));
    }

    function makeRequest(uint256 group, uint64 seq, bytes32 pubNonce, uint64 deadline) private returns (Request memory r) {
        r.body = abi.encodePacked(uint16(groups[group].length), groups[group]);
        r.recordIds = new bytes32[](1);
        r.recordIds[0] = keccak256(abi.encode(keccak256("efs2/record/1"), probe.metaTypeId(), keccak256(r.body)));
        r.publication = AdmissionProbe.EnvelopeHeader(1, principal, 0, 0, pubNonce, deadline);
        bytes32 envDomain = keccak256(abi.encode(keccak256("EIP712Domain(string name,string version)"),
            keccak256("EFS2-Envelope"), keccak256("1")));
        bytes32 envHash = keccak256(abi.encode(keccak256("PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)"),
            uint16(1), principal, bytes32(0), uint64(0), pubNonce, deadline, keccak256(abi.encodePacked(r.recordIds))));
        bytes32 publicationDigest = keccak256(abi.encodePacked(hex"1901", envDomain, envHash));
        bytes32 envelopeId = keccak256(abi.encode(keccak256("efs2/envelope/1"), publicationDigest));
        r.effects = AdmissionProbe.C0RealmEffects(probe.realmId(), address(probe), 0, 0, 1, envelopeId, 1,
            keccak256(""), probe.stateByteStore(), 0);
        bytes32 effectsDigest = keccak256(abi.encode(keccak256("C0RealmEffects(bytes32 realmId,address core,bytes32 routeConfigId,bytes32 genesisReceiptHash,uint8 operationKind,bytes32 envelopeId,uint64 leafMask,bytes32 expectedRevisionsHash,address stateByteStore,bytes32 byteCommitment)"), r.effects));
        r.plan = AdmissionProbe.WritePlan(probe.c0ProfileId(), publicationDigest, probe.realmId(), effectsDigest,
            address(probe), address(probe).codehash, 0, seq, deadline);
        r.witness = signPlan(r.plan, AUTHOR_KEY);
    }

    function signPlan(AdmissionProbe.WritePlan memory p, uint256 key) private returns (bytes memory) {
        bytes32 domain = keccak256(abi.encode(keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("EFS2-MVP-C0-WritePlan"), keccak256("1"), block.chainid, address(probe)));
        bytes32 planHash = keccak256(abi.encode(keccak256("WritePlan(bytes32 c0ProfileId,bytes32 publicationDigest,bytes32 realmId,bytes32 realmEffectsDigest,address executor,bytes32 executorCodeHash,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)"), p));
        (uint8 v, bytes32 rr, bytes32 s) = vm.sign(key, keccak256(abi.encodePacked(hex"1901", domain, planHash)));
        return abi.encodePacked(rr, s, v);
    }
    function requestedPublicationDigest(Request memory r) private pure returns (bytes32) {
        bytes32 domain = keccak256(abi.encode(keccak256("EIP712Domain(string name,string version)"),
            keccak256("EFS2-Envelope"), keccak256("1")));
        AdmissionProbe.EnvelopeHeader memory p = r.publication;
        bytes32 statement = keccak256(abi.encode(keccak256("PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)"),
            p.profile, p.principalId, p.authorityRef, p.authEpoch, p.pubNonce, p.notAfter,
            keccak256(abi.encodePacked(r.recordIds))));
        return keccak256(abi.encodePacked(hex"1901", domain, statement));
    }
    function requestedEffectsDigest(Request memory r) private pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("C0RealmEffects(bytes32 realmId,address core,bytes32 routeConfigId,bytes32 genesisReceiptHash,uint8 operationKind,bytes32 envelopeId,uint64 leafMask,bytes32 expectedRevisionsHash,address stateByteStore,bytes32 byteCommitment)"), r.effects));
    }
    function assertConsistentCommitments(Request memory r) private pure {
        bytes32 publication = requestedPublicationDigest(r);
        require(r.plan.publicationDigest == publication, "stale publication commitment in semantic test");
        require(r.effects.envelopeId == keccak256(abi.encode(keccak256("efs2/envelope/1"), publication)), "stale envelope commitment in semantic test");
        require(r.plan.realmEffectsDigest == requestedEffectsDigest(r), "stale effects commitment in semantic test");
    }
    function recommitPublicationAndEffects(Request memory r) private pure {
        r.plan.publicationDigest = requestedPublicationDigest(r);
        r.effects.envelopeId = keccak256(abi.encode(keccak256("efs2/envelope/1"), r.plan.publicationDigest));
        recommitEffects(r);
    }
    function recommitEffects(Request memory r) private pure {
        r.plan.realmEffectsDigest = requestedEffectsDigest(r);
    }
    function sendRequest(Request memory r) private returns (uint8 outcome, uint64 ordinal) {
        return probe.publishWithPlanC0(r.publication, r.recordIds, r.body, r.effects, r.plan, r.witness);
    }
    function tryRequest(Request memory r, uint256 gasLimit) private returns (bool ok) {
        (ok,) = address(probe).call{gas: gasLimit}(abi.encodeCall(probe.publishWithPlanC0,
            (r.publication, r.recordIds, r.body, r.effects, r.plan, r.witness)));
    }
    function occurrence(Request memory r) private pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs2/occurrence/1"), r.effects.envelopeId, uint256(0)));
    }
    function emptyState() private view {
        require(probe.admissionCount() == 0 && probe.recordCount() == 0 && probe.envelopeCount() == 0, "partial admission");
        require(probe.lastSequence(principal, 0) == 0 && probe.admittedGroupCount() == 0, "partial control");
    }

    function testUnsignedRequestCannotMutate() public {
        Request memory r = makeRequest(0, 1, 0, 0);
        r.witness = "";
        require(!tryRequest(r, 16_000_000), "unsigned request accepted");
        emptyState();
    }
    function testOneOrdinaryAdmissionRetainsEvidenceAndCaches() public {
        Request memory r = makeRequest(0, 1, 0, 0);
        (uint8 result, uint64 ordinal) = sendRequest(r);
        require(result == 1 && ordinal == 1, "valid publication not admitted");
        require(probe.admissionCount() == 1 && probe.recordCount() == 1 && probe.envelopeCount() == 1, "missing rows");
        require(probe.indexLength(1, 0) == 7 && probe.indexLength(2, 0) == 1, "missing metadata");
        require(probe.indexLength(3, probe.metaTypeId()) == 1 && probe.indexLength(4, probe.metaTypeId()) == 1, "missing type indexes");
        require(probe.indexAt(5, r.recordIds[0], 0) == occurrence(r), "missing record posting");
        require(probe.indexAt(6, principal, 0) == occurrence(r) && probe.indexAt(7, 0, 0) == occurrence(r), "missing principal/log");
        require(keccak256(probe.getRecord(r.recordIds[0]).body) == keccak256(r.body), "body not retained");
        AdmissionProbe.EnvelopeRow memory e = probe.getEnvelope(r.effects.envelopeId);
        require(keccak256(e.unsignedStatement) == keccak256(abi.encode(r.publication, r.recordIds)), "unsigned carriage");
        require(keccak256(e.witness) == keccak256(r.witness) && keccak256(e.plan) == keccak256(abi.encode(r.plan)), "witness/plan retention");
        require(probe.getAdmission(occurrence(r)).principalId == principal, "attribution");
        AdmissionProbe.TypeRow memory t = probe.getTypeCache(0x1dc6366ab6cc72f3602e01be571613ab84ae40288fe07000f6d5eb688c923c44);
        require(t.groupRecordId == r.recordIds[0] && t.admittedAtOrdinal == 1 && t.cacheBytes.length > 0, "atomic cache");
    }
    function testAllFourRealGroupsFitPerCallCap() public {
        for (uint64 i; i < 4; ++i) {
            Request memory r = makeRequest(i, i + 1, bytes32(uint256(i + 1)), 0);
            require(tryRequest(r, 16_700_000), "group exceeds frame or fails admission");
        }
        require(probe.admittedGroupCount() == 4 && probe.admissionCount() == 4, "incomplete group admission");
        require(probe.indexLength(1, 0) == 17 && probe.indexLength(3, probe.metaTypeId()) == 4, "incomplete type/record inventory");
    }
    function testExactReplayAfterExpiryDoesNotConsumeAnything() public {
        Request memory r = makeRequest(0, 1, 0, uint64(block.timestamp + 10));
        sendRequest(r);
        vm.warp(block.timestamp + 11);
        (uint8 result, uint64 ordinal) = sendRequest(r);
        require(result == 2 && ordinal == 1, "exact retry not idempotent");
        require(probe.admissionCount() == 1 && probe.lastSequence(principal, 0) == 1, "retry consumed state");
        require(probe.indexLength(4, probe.metaTypeId()) == 1 && probe.indexLength(1, 0) == 7, "retry duplicated indexes");
        r.witness = "";
        require(!tryRequest(r, 16_000_000), "retry skipped authentication");
    }
    function testNewEnvelopeSameRecordReusesCacheButAddsAttribution() public {
        Request memory a = makeRequest(0, 1, 0, 0);
        sendRequest(a);
        bytes32 cacheHash = keccak256(probe.getTypeCache(0x1dc6366ab6cc72f3602e01be571613ab84ae40288fe07000f6d5eb688c923c44).cacheBytes);
        Request memory b = makeRequest(0, 2, bytes32(uint256(7)), 0);
        (uint8 result, uint64 ordinal) = sendRequest(b);
        require(result == 1 && ordinal == 2 && occurrence(a) != occurrence(b), "new attribution lost");
        require(probe.recordCount() == 1 && probe.admittedGroupCount() == 1 && probe.envelopeCount() == 2, "cache/record duplicated");
        require(probe.indexLength(1, 0) == 7 && probe.indexLength(5, a.recordIds[0]) == 2, "record history lost");
        require(keccak256(probe.getTypeCache(0x1dc6366ab6cc72f3602e01be571613ab84ae40288fe07000f6d5eb688c923c44).cacheBytes) == cacheHash, "cache changed");
    }
    function testUnderfundedFrameRollsBackCachesRowsAndNonce() public {
        Request memory r = makeRequest(0, 1, 0, 0);
        require(!tryRequest(r, 6_000_000), "expected bounded OOG");
        emptyState();
        require(probe.indexLength(1, 0) == 1 && probe.indexLength(2, 0) == 0, "partial metadata survived");
        require(probe.getTypeCache(0x1dc6366ab6cc72f3602e01be571613ab84ae40288fe07000f6d5eb688c923c44).ordinal == 0, "partial cache survived");
        require(probe.getRecord(r.recordIds[0]).ordinal == 0 && probe.getEnvelope(r.effects.envelopeId).ordinal == 0, "partial records survived");
        require(probe.indexLength(7, 0) == 0, "partial log survived");
        sendRequest(r);
        require(probe.admissionCount() == 1, "failed call poisoned retry");
    }
    function testMissingOrReorderedGroupIsNotAdmitted() public {
        Request memory second = makeRequest(1, 1, 0, 0);
        require(!tryRequest(second, 16_000_000), "reordered group admitted");
        emptyState();
        Request memory first = makeRequest(0, 1, 0, 0);
        first.body[20] = bytes1(uint8(first.body[20]) ^ 1);
        require(!tryRequest(first, 16_000_000), "substituted group admitted");
        emptyState();
    }
    function testPinnedMalformedDescriptorStillFailsParser() public {
        // Change MC/1 version inside a group, then PIN that malformed inventory.
        // This catches a hash-allowlist-only implementation even with valid author consent.
        groups[0][5] = bytes1(uint8(2));
        bytes32[4] memory hashes;
        for (uint256 i; i < 4; ++i) hashes[i] = keccak256(groups[i]);
        probe = new AdmissionProbe(AdmissionProbe.Config(probe.realmId(), probe.stateByteStore(),
            probe.schemaAuthor(), probe.bootstrapAuthor(), hashes), probe.intrinsicGroupBytes(), probe.declarationInventoryBytes());
        Request memory r = makeRequest(0, 1, 0, 0);
        require(!tryRequest(r, 16_000_000), "pinned malformed descriptor bypassed parsing");
        emptyState();
        require(probe.indexLength(1, 0) == 1, "malformed cache survived");
    }
    function testSignedWrongBindingsCannotMutate() public {
        // Deliberate commitment/plan substitutions are distinct from invalid
        // semantic fields with current parent commitments below.
        for (uint256 i; i < 8; ++i) {
            Request memory r = makeRequest(0, 1, 0, 0);
            if (i == 0) r.plan.c0ProfileId = bytes32(uint256(1));
            else if (i == 1) r.plan.publicationDigest = bytes32(uint256(1));
            else if (i == 2) r.plan.realmId = bytes32(uint256(1));
            else if (i == 3) r.plan.realmEffectsDigest = bytes32(uint256(1));
            else if (i == 4) r.plan.executor = address(0xdead);
            else if (i == 5) r.plan.executorCodeHash = bytes32(uint256(1));
            else if (i == 6) r.plan.nonceSeq = 2;
            else r.plan.notAfter = 1;
            r.witness = signPlan(r.plan, AUTHOR_KEY);
            require(!tryRequest(r, 16_000_000), "invalid signed binding accepted");
            emptyState();
        }
    }
    function testSelfConsistentSignedSemanticViolationsCannotMutate() public {
        // Each case differs in one semantic input, with every parent hash and
        // signature rebuilt. Removing its semantic guard must admit that case.
        for (uint256 i; i < 12; ++i) {
            Request memory r = makeRequest(0, 1, 0, 0);
            if (i == 0) r.effects.routeConfigId = bytes32(uint256(1));
            else if (i == 1) r.effects.genesisReceiptHash = bytes32(uint256(1));
            else if (i == 2) r.effects.byteCommitment = bytes32(uint256(1));
            else if (i == 3) r.effects.operationKind = 2;
            else if (i == 4) r.effects.leafMask = 2;
            else if (i == 5) r.publication.profile = 2;
            else if (i == 6) r.publication.authEpoch = 1;
            else if (i == 7) r.publication.authorityRef = bytes32(uint256(1));
            else if (i == 8) r.effects.stateByteStore = address(0xbeef);
            else if (i == 9) r.effects.expectedRevisionsHash = bytes32(uint256(1));
            else if (i == 10) r.effects.realmId = bytes32(uint256(1));
            else r.effects.core = address(0xbeef);
            recommitPublicationAndEffects(r);
            assertConsistentCommitments(r);
            r.witness = signPlan(r.plan, AUTHOR_KEY);
            require(!tryRequest(r, 16_000_000), "self-consistent invalid semantics accepted");
            emptyState();
            require(probe.indexLength(1, 0) == 1 && probe.indexLength(7, 0) == 0, "invalid semantics left cache or log");
        }
    }
    function testWrongEnvelopeIdWithCurrentEffectsDigestCannotMutate() public {
        Request memory r = makeRequest(0, 1, 0, 0);
        bytes32 correctEnvelope = r.effects.envelopeId;
        r.effects.envelopeId = bytes32(uint256(1));
        // Deliberately do NOT recommit the publication: the bad envelope ID is
        // the tested mismatch. Only its enclosing effects digest is refreshed.
        recommitEffects(r);
        require(r.plan.publicationDigest == requestedPublicationDigest(r), "publication changed");
        require(r.effects.envelopeId != correctEnvelope, "envelope mismatch repaired accidentally");
        require(r.plan.realmEffectsDigest == requestedEffectsDigest(r), "stale outer effects digest");
        r.witness = signPlan(r.plan, AUTHOR_KEY);
        require(!tryRequest(r, 16_000_000), "wrong envelope binding accepted");
        emptyState();
    }
    function testRecomputedValidPublicationAndEffectsAdmit() public {
        Request memory r = makeRequest(0, 1, 0, 0);
        r.publication.pubNonce = bytes32(uint256(0xabc));
        recommitPublicationAndEffects(r);
        assertConsistentCommitments(r);
        r.witness = signPlan(r.plan, AUTHOR_KEY);
        (uint8 result,) = sendRequest(r);
        require(result == 1 && probe.admissionCount() == 1, "recommit helper made valid request invalid");
    }
    function testSignatureSignerChainMalleabilityAndExpiryReject() public {
        Request memory r = makeRequest(0, 1, 0, 0);
        r.witness = signPlan(r.plan, 0xb0b);
        require(!tryRequest(r, 16_000_000), "wrong signer accepted");
        r = makeRequest(0, 1, 0, 0);
        uint256 chain = block.chainid;
        vm.chainId(chain + 1);
        require(!tryRequest(r, 16_000_000), "wrong chain accepted");
        vm.chainId(chain);
        r = makeRequest(0, 1, 0, 0);
        bytes32 s;
        bytes memory w = r.witness;
        assembly ("memory-safe") { s := mload(add(w, 64)) }
        bytes32 highS = bytes32(0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141 - uint256(s));
        assembly ("memory-safe") { mstore(add(w, 64), highS) }
        w[64] = w[64] == bytes1(uint8(27)) ? bytes1(uint8(28)) : bytes1(uint8(27));
        require(!tryRequest(r, 16_000_000), "malleable signature accepted");
        r = makeRequest(0, 1, 0, uint64(block.timestamp + 1));
        vm.warp(block.timestamp + 2);
        require(!tryRequest(r, 16_000_000), "expired fresh admission accepted");
        emptyState();
    }
}
