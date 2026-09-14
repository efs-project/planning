// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {ArchiveReadConsumer} from "./ArchiveReadConsumer.sol";
import {SignedClaimArchive, SignedClaimArchivePacked, SignedClaimArchiveCodeBlob,
    SignedClaimArchiveBase as Archive} from "../src/SignedClaimArchive.sol";

interface ArchiveVm {
    struct Log { bytes32[] topics; bytes data; address emitter; }
    function record() external;
    function accesses(address target) external returns (bytes32[] memory reads, bytes32[] memory writes);
    function recordLogs() external;
    function getRecordedLogs() external returns (Log[] memory);
    function getNonce(address account) external view returns (uint64);
}

contract ArchiveActor {
    function attach(Archive archive, bytes32 id, Archive.BodyInput[] calldata bodies) external {
        archive.attachBodies(id, bodies);
    }
    function retain(Archive archive, Ledger.Intent calldata source, Ledger.Action[] calldata actions,
        bytes calldata sig, Archive.BodyInput[] calldata bodies) external returns (bytes32) {
        return archive.retainSignedClaim(source, actions, sig, bodies);
    }
}

/// Real Ledger integration plus bounded signed-claim invariants. No source-state proof is implied.
contract SignedClaimArchiveTest is LabBase {
    ArchiveVm internal constant avm = ArchiveVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    SignedClaimArchive internal archive;
    ArchiveActor internal importer;
    struct ClaimView {
        Ledger.Intent source;
        bytes32 actionsHash;
        uint16 leafCount;
        bytes32 r;
        bytes32 s;
        uint8 v;
        uint64 coverage;
        Archive.ProofLevel proof;
        address firstImporter;
        uint64 retainedAt;
    }

    function setUp() public override {
        super.setUp();
        archive = new SignedClaimArchive();
        importer = new ArchiveActor();
    }

    function noBodies() internal pure returns (Archive.BodyInput[] memory) {
        return new Archive.BodyInput[](0);
    }
    function bodyAt(uint16 leaf, bytes memory body) internal pure returns (Archive.BodyInput[] memory b) {
        b = new Archive.BodyInput[](1);
        b[0] = Archive.BodyInput(leaf, body);
    }
    function retain(uint64 nonce, Ledger.Action[] memory actions, Archive.BodyInput[] memory bodies)
        internal returns (bytes32 id, Ledger.Intent memory intent, bytes memory sig) {
        (intent, sig) = signed(PK_A, ledger, nonce, actions);
        bytes32 h = keccak256(abi.encode(actions));
        id = archive.retainSignedClaim(intent, actions, sig, bodies);
        require(id == ledger.intentDigest(intent, h), "claim id is exact B digest");
    }
    function claimView(bytes32 id) internal view returns (ClaimView memory c) {
        (bool ok, bytes memory out) = address(archive).staticcall(abi.encodeCall(archive.claim, (id)));
        require(ok && out.length == 512, "bounded claim ABI");
        c = abi.decode(out, (ClaimView));
    }
    function headerHash(bytes32 id) internal view returns (bytes32) {
        ClaimView memory c = claimView(id);
        c.coverage = 0;
        return keccak256(abi.encode(c));
    }
    function headHash(bytes32 key) internal view returns (bytes32) {
        (bool ok, bytes memory out) = address(ledger).staticcall(abi.encodeCall(ledger.head, (key)));
        require(ok && out.length == 192, "full six-field head read");
        return keccak256(out);
    }
    function ledgerSnapshot(bytes32 key) internal view returns (bytes32) {
        (bool ok, bytes memory counts) = address(ledger).staticcall(abi.encodeCall(ledger.counts, ()));
        require(ok, "counts read");
        return keccak256(abi.encode(headHash(key), counts, ledger.nonces(eoaA), ledger.nonces(address(this))));
    }
    function fails(bytes memory callData, bytes memory expected, string memory why) internal {
        (bool ok, bytes memory err) = address(archive).call(callData);
        require(!ok && keccak256(err) == keccak256(expected), why);
    }
    function rejectsSignature(Ledger.Intent memory intent, Ledger.Action[] memory actions,
        bytes memory sig, bytes4 expected) internal {
        fails(abi.encodeCall(archive.retainSignedClaim, (intent, actions, sig, noBodies())),
            abi.encodeWithSelector(expected), "signature must reject without retention");
    }
    function sameAction(Ledger.Action memory got, Ledger.Action memory want) internal pure {
        require(got.kind == want.kind && got.typeId == want.typeId &&
            got.bodyHashOrRecordId == want.bodyHashOrRecordId && got.purpose == want.purpose &&
            got.subject == want.subject && got.role == want.role && got.target == want.target &&
            got.expectedRevision == want.expectedRevision && got.salt == want.salt, "all nine action fields round trip");
    }
    function assertClaim(bytes32 id, Ledger.Intent memory intent, Ledger.Action[] memory actions,
        bytes memory signature, uint64 coverage) internal view {
        (Ledger.Intent memory source, bytes32 h, uint16 n, bytes32 r, bytes32 s, uint8 v,
            uint64 bits, Archive.ProofLevel proof, address firstImporter, uint64 retainedAt) = archive.claim(id);
        require(keccak256(abi.encode(source)) == keccak256(abi.encode(intent)), "immutable signed source header");
        require(h == keccak256(abi.encode(actions)) && n == actions.length, "immutable full vector commitment");
        require(keccak256(abi.encodePacked(r, s, v)) == keccak256(signature), "exact retained signature");
        require(bits == coverage && proof == Archive.ProofLevel.AUTHOR_SIGNATURE_VERIFIED, "signature proof and local coverage only");
        require(firstImporter == address(this) && retainedAt == block.timestamp, "first import context");
        for (uint16 i; i < n; ++i) sameAction(archive.actionAt(id, i), actions[i]);
    }

    // Catches accidental coupling of archival to CAS, policy, native authorship or body completeness.
    function test_joined_diverged_cas_current_rejection_and_missing_body() public {
        bytes32 file = subjectOf(eoaA, 10);
        bytes memory oldBody = f41(0x11);
        Ledger.Action[] memory initial = two(aPublish(BINARY, oldBody), aBind(HEAD, file, NO_ROLE, rid(BINARY, oldBody), 0));
        (Ledger.Intent memory first, bytes memory firstSig) = signed(PK_A, ledger, 0, initial);
        bytes[] memory initialBodies = new bytes[](2);
        initialBodies[0] = oldBody;
        ledger.executeSigned(first, initial, initialBodies, firstSig);
        bytes32 key = Keys.binding(pid(eoaA), Keys.position(HEAD, file, NO_ROLE));
        (, uint32 revision,,,,) = ledger.head(key);
        require(revision == 1, "destination head advanced before archive retention");
        bytes32 fullHead = headHash(key);
        bytes32 beforeRetention = ledgerSnapshot(key);
        bytes memory selected = f41(0x22);
        Ledger.Action[] memory actions = new Ledger.Action[](3);
        actions[0] = aPublish(BINARY, selected);
        actions[1] = aBind(HEAD, file, NO_ROLE, rid(BINARY, selected), 0);
        actions[2] = aPublish(BINARY, f41(0x33));
        avm.recordLogs();
        (bytes32 id, Ledger.Intent memory intent, bytes memory sig) = retain(1, actions, bodyAt(0, selected));
        ArchiveVm.Log[] memory logs = avm.getRecordedLogs();
        for (uint256 i; i < logs.length; ++i) require(logs[i].emitter != address(ledger), "archive cannot emit Ledger admission");
        require(ledgerSnapshot(key) == beforeRetention, "retention leaves full destination state unchanged");
        bytes[] memory replayBodies = new bytes[](3);
        replayBodies[0] = selected; // bind empty; unrelated body deliberately unavailable
        (bool ok, bytes memory err) = address(ledger).call(abi.encodeCall(ledger.executeSigned, (intent, actions, replayBodies, sig)));
        require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(Ledger.E_CAS.selector, key, uint32(0), uint32(1))), "replay reaches exact stale CAS before missing body");
        require(ledgerSnapshot(key) == beforeRetention, "failed replay leaves full head counts and both nonces unchanged");

        (bytes32 selectedId, bytes32 selectedType, bool attached, bytes memory selectedBytes) = archive.selectedRecord(id, 0);
        require(attached && keccak256(selectedBytes) == keccak256(selected), "selected attached bytes available separately");
        (,,, uint64 publicationsBefore) = ledger.counts();
        require(ledger.publish(selectedType, selectedBytes) == selectedId, "publish returns selected Record ID not ordinal");
        (,,, uint64 publicationsAfter) = ledger.counts();
        require(publicationsAfter == publicationsBefore + 1, "one ordinary destination publication");
        (address actualAuthor,,,,,,,,,,,,) = ledger.evidence(publicationsAfter);
        require(actualAuthor == address(this) && actualAuthor != intent.author, "destination author is actual native caller");
        require(headHash(key) == fullHead, "separate publication does not rewrite source author's head");

        bytes memory rejectedBody = q(999);
        Ledger.Action[] memory rejectedActions = one(aPublish(QUOTE, rejectedBody));
        (bytes32 secondId, Ledger.Intent memory second, bytes memory secondSig) = retain(2, rejectedActions, bodyAt(0, rejectedBody));
        acceptor.set(1, 0);
        bytes32 beforeRejection = ledgerSnapshot(key);
        (ok, err) = address(ledger).call(abi.encodeCall(ledger.publish, (QUOTE, rejectedBody)));
        require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(Ledger.E_POLICY_REJECTED.selector, uint256(0), QUOTE)), "current policy rejects ordinary destination publish");
        require(ledgerSnapshot(key) == beforeRejection, "policy rejection leaves full destination state unchanged");
        assertClaim(secondId, second, rejectedActions, secondSig, 1);
        (bytes32 secondRecord, bytes32 secondType, bool secondAttached, bytes memory retainedBody) = archive.selectedRecord(secondId, 0);
        require(secondType == QUOTE && secondAttached && keccak256(retainedBody) == keccak256(rejectedBody), "rejected current data stays available as signed claim");
        require(archive.signedRecordClaimCount(secondRecord) == 1, "rejected claim remains discoverable");
        (bytes32 postingId, uint16 postingLeaf) = archive.signedRecordClaimAt(secondRecord, 0);
        require(postingId == secondId && postingLeaf == 0 && acceptor.mode() == 1, "archive reads while policy still rejecting");
        acceptor.set(0, 0);

        (,, bool selectedAttached,) = archive.selectedRecord(id, 0);
        (,, bool unrelatedAttached, bytes memory missing) = archive.selectedRecord(id, 2);
        require(selectedAttached && !unrelatedAttached && missing.length == 0, "unavailable body remains explicitly unattached");
        Ledger.Action[] memory omitted = new Ledger.Action[](2);
        omitted[0] = clone(actions[0]); omitted[1] = clone(actions[1]);
        fails(abi.encodeCall(archive.retainSignedClaim, (intent, omitted, sig, noBodies())), abi.encodeWithSelector(Archive.E_SIGNATURE.selector), "unavailable action tuples, not merely bodies, remain unsupported");
        Ledger.Action[] memory changed = cloneAll(actions);
        changed[2].salt = bytes32(uint256(1));
        fails(abi.encodeCall(archive.retainSignedClaim, (intent, changed, sig, noBodies())), abi.encodeWithSelector(Archive.E_SIGNATURE.selector), "mutated full tuple is not the signed claim");
        changed = cloneAll(actions);
        changed[0] = clone(actions[2]); changed[2] = clone(actions[0]);
        fails(abi.encodeCall(archive.retainSignedClaim, (intent, changed, sig, noBodies())), abi.encodeWithSelector(Archive.E_SIGNATURE.selector), "reordered full vector is not the signed claim");
    }

    // Catches permissive signature recovery, deadline admission checks and malformed-length acceptance.
    function test_signature_rejects_empty_bad_v_high_s_wrong_author_and_expired_is_archivable() public {
        Ledger.Action[] memory actions = one(aPublish(BINARY, hex"01"));
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 0, actions);
        rejectsSignature(intent, actions, hex"", Archive.E_SOURCE_UNSUPPORTED.selector);
        rejectsSignature(intent, actions, new bytes(64), Archive.E_SIGNATURE.selector);
        rejectsSignature(intent, actions, new bytes(66), Archive.E_SIGNATURE.selector);
        bytes memory badV = bytes.concat(sig); badV[64] = bytes1(uint8(29));
        rejectsSignature(intent, actions, badV, Archive.E_SIGNATURE.selector);
        bytes memory highS = bytes.concat(sig);
        for (uint256 i = 32; i < 64; ++i) highS[i] = 0xff;
        rejectsSignature(intent, actions, highS, Archive.E_SIGNATURE.selector);
        bytes memory zeroRecovery = new bytes(65); zeroRecovery[64] = bytes1(uint8(27));
        rejectsSignature(intent, actions, zeroRecovery, Archive.E_SIGNATURE.selector);
        Ledger.Intent memory wrong = cloneIntent(intent); wrong.author = eoaB;
        rejectsSignature(wrong, actions, sig, Archive.E_SIGNATURE.selector);
        wrong.author = address(0);
        rejectsSignature(wrong, actions, zeroRecovery, Archive.E_SIGNATURE.selector);
        vm.warp(intent.deadline + 1);
        bytes32 id = archive.retainSignedClaim(intent, actions, sig, noBodies());
        assertClaim(id, intent, actions, sig, 0);
        require(id == ledger.intentDigest(intent, keccak256(abi.encode(actions))), "expired exact signature is archivable");
    }

    // Catches any retry write, duplicate posting or changed immutable importer/header/vector.
    function test_retry_keeps_first_importer_vector_and_posting_counts() public {
        bytes memory body = f41(0x44);
        Ledger.Action[] memory actions = one(aPublish(BINARY, body));
        (bytes32 id, Ledger.Intent memory intent, bytes memory sig) = retain(3, actions, bodyAt(0, body));
        bytes32 header = headerHash(id);
        vm.warp(block.timestamp + 99);
        avm.record();
        require(importer.retain(archive, intent, actions, sig, bodyAt(0, body)) == id, "identical retry id");
        (, bytes32[] memory writes) = avm.accesses(address(archive));
        require(writes.length == 0, "identical retention retry has no storage writes");
        require(headerHash(id) == header && archive.signedRecordClaimCount(rid(BINARY, body)) == 1, "retry preserves first importer header and posting count");
        sameAction(archive.actionAt(id, 0), actions[0]);
        avm.record();
        archive.attachBodies(id, bodyAt(0, body));
        (, writes) = avm.accesses(address(archive));
        require(writes.length == 0, "fully attached correct attachment retry has no storage writes");
    }

    // Catches caller authorization on body completion and first-importer replacement.
    function test_any_account_can_complete_claim_without_changing_first_importer() public {
        bytes memory body = f41(0x55);
        Ledger.Action[] memory actions = one(aPublish(BINARY, body));
        (bytes32 id, Ledger.Intent memory intent, bytes memory sig) = retain(4, actions, noBodies());
        bytes32 header = headerHash(id);
        importer.retain(archive, intent, actions, sig, bodyAt(0, body));
        require(headerHash(id) == header && claimView(id).coverage == 1, "any caller can complete via retention without header change");
        require(claimView(id).firstImporter == address(this), "completion is not first import");
    }

    // Catches nonce-keyed overwrite instead of digest-keyed retention.
    function test_conflicting_same_nonce_signed_claims_remain_distinct() public {
        Ledger.Action[] memory a = one(aPublish(BINARY, hex"01"));
        Ledger.Action[] memory b = one(aPublish(BINARY, hex"02"));
        (bytes32 first,,) = retain(5, a, noBodies());
        (bytes32 second,,) = retain(5, b, noBodies());
        require(first != second && claimView(first).source.nonce == claimView(second).source.nonce, "conflicting same nonce signatures remain distinct");
        sameAction(archive.actionAt(first, 0), a[0]); sameAction(archive.actionAt(second, 0), b[0]);
    }

    // Catches global cache laundering local coverage or rewriting bytes on a cache hit.
    function test_claim_local_coverage_requires_explicit_attachment_after_global_cache_hit() public {
        bytes memory body = f41(0x66);
        Ledger.Action[] memory actions = one(aPublish(BINARY, body));
        (bytes32 a,,) = retain(6, actions, noBodies());
        (bytes32 b,,) = retain(7, actions, bodyAt(0, body));
        (,, bool attached, bytes memory unavailable) = archive.selectedRecord(a, 0);
        require(!attached && unavailable.length == 0 && claimView(a).coverage == 0 && claimView(b).coverage == 1, "global cache is not claim-local coverage");
        bytes32 header = headerHash(a);
        avm.record();
        importer.attach(archive, a, bodyAt(0, body));
        (, bytes32[] memory writes) = avm.accesses(address(archive));
        // The only permitted change is the uncovered ClaimCell bitmap word, never cached-byte slots.
        require(writes.length == 1, "global-cache attachment writes only the local coverage slot, no cached bytes");
        require(headerHash(a) == header && claimView(a).coverage == 1, "explicit attachment preserves first importer");
        (,, attached, unavailable) = archive.selectedRecord(a, 0);
        require(attached && keccak256(unavailable) == keccak256(body), "explicit local attachment exposes verified bytes");
        require(archive.signedRecordClaimCount(rid(BINARY, body)) == 2, "attachment does not append postings");
    }

    // Catches treating a valid zero-length preimage as cache absence.
    function test_valid_empty_body_is_present_and_attached() public {
        (bytes32 id,,) = retain(8, one(aPublish(BINARY, hex"")), bodyAt(0, hex""));
        (bytes32 recordId, bytes32 typeId, bool attached, bytes memory body) = archive.selectedRecord(id, 0);
        require(attached && body.length == 0 && recordId == rid(BINARY, hex"") && typeId == BINARY, "empty body is present and attached");
        require(claimView(id).coverage == 1, "empty preimage sets coverage");
    }

    // Catches REUSE bypassing Type-qualified body identity or partial writes before a later mismatch.
    function test_reuse_rejects_conflicting_type_or_body() public {
        bytes memory body = f41(0x77);
        bytes32 recordId = rid(BINARY, body);
        (bytes32 id,,) = retain(9, one(aReuse(BINARY, recordId)), bodyAt(0, body));
        fails(abi.encodeCall(archive.attachBodies, (id, bodyAt(0, hex"00"))),
            abi.encodeWithSelector(Archive.E_BODY_MISMATCH.selector, uint16(0), recordId, rid(BINARY, hex"00")), "cached reuse still verifies supplied body");
        (bytes32 wrongType,,) = retain(10, one(aReuse(QUOTE, recordId)), noBodies());
        fails(abi.encodeCall(archive.attachBodies, (wrongType, bodyAt(0, body))),
            abi.encodeWithSelector(Archive.E_BODY_MISMATCH.selector, uint16(0), recordId, rid(QUOTE, body)), "reuse rejects conflicting Type");
        require(claimView(wrongType).coverage == 0, "mismatch does not attach");
        Ledger.Action[] memory pair = two(aPublish(BINARY, hex"a1"), aPublish(BINARY, hex"a2"));
        (bytes32 pairId,,) = retain(11, pair, noBodies());
        Archive.BodyInput[] memory inputs = new Archive.BodyInput[](2);
        inputs[0] = Archive.BodyInput(0, hex"a1"); inputs[1] = Archive.BodyInput(1, hex"ff");
        avm.record();
        fails(abi.encodeCall(archive.attachBodies, (pairId, inputs)),
            abi.encodeWithSelector(Archive.E_BODY_MISMATCH.selector, uint16(1), rid(BINARY, hex"a2"), rid(BINARY, hex"ff")), "validate all hashes before any body write");
        (, bytes32[] memory writes) = avm.accesses(address(archive));
        require(writes.length == 0 && claimView(pairId).coverage == 0, "later mismatch performs no attempted archive write");
    }

    function arbitraryAction() internal pure returns (Ledger.Action memory) {
        return Ledger.Action(251, bytes32(uint256(0x11)), bytes32(uint256(0x22)), bytes32(uint256(0x33)),
            bytes32(uint256(0x44)), bytes32(uint256(0x55)), bytes32(uint256(0x66)), uint32(0x80000001), bytes32(uint256(0x77)));
    }
    function arbitraryIntent(uint64 nonce) internal view returns (Ledger.Intent memory) {
        return Ledger.Intent(bytes32(uint256(0x101)), bytes32(uint256(0x202)), eoaA, nonce, 1,
            bytes32(uint256(0x303)), bytes32(uint256(0x404)));
    }

    // Catches upper packed-bit truncation, off-by-one leaves and missing unknown-claim guards.
    function test_leaf_63_round_trips_and_wrong_leaf_reverts() public {
        Ledger.Action[] memory actions = new Ledger.Action[](64);
        for (uint256 i; i < 64; ++i) actions[i] = arbitraryAction();
        Ledger.Intent memory intent = arbitraryIntent(12);
        bytes memory sig = signIntent(PK_A, ledger, intent, actions);
        bytes32 id = archive.retainSignedClaim(intent, actions, sig, noBodies());
        sameAction(archive.actionAt(id, 63), actions[63]);
        fails(abi.encodeCall(archive.actionAt, (id, uint16(64))), abi.encodeWithSelector(Archive.E_LEAF.selector, uint16(64)), "wrong action leaf rejects");
        fails(abi.encodeCall(archive.selectedRecord, (id, uint16(64))), abi.encodeWithSelector(Archive.E_LEAF.selector, uint16(64)), "wrong selected leaf rejects");
        fails(abi.encodeCall(archive.selectedRecord, (id, uint16(63))), abi.encodeWithSelector(Archive.E_BODY_LEAF.selector, uint16(63)), "nonrecord selection rejects");
        bytes32 unknown = bytes32(uint256(0xdead));
        fails(abi.encodeCall(archive.claim, (unknown)), abi.encodeWithSelector(Archive.E_UNKNOWN_CLAIM.selector, unknown), "unknown claim rejects");
        fails(abi.encodeCall(archive.actionAt, (unknown, uint16(0))), abi.encodeWithSelector(Archive.E_UNKNOWN_CLAIM.selector, unknown), "unknown action claim rejects");
        fails(abi.encodeCall(archive.selectedRecord, (unknown, uint16(0))), abi.encodeWithSelector(Archive.E_UNKNOWN_CLAIM.selector, unknown), "unknown selected claim rejects");
        fails(abi.encodeCall(archive.attachBodies, (unknown, noBodies())), abi.encodeWithSelector(Archive.E_UNKNOWN_CLAIM.selector, unknown), "unknown attachment claim rejects");
    }

    // Catches bitmap overwrite, wrong shift widths or unsolicited body attachment.
    function test_staged_attachments_only_set_requested_bits() public {
        Ledger.Action[] memory actions = new Ledger.Action[](64);
        for (uint256 i; i < 64; ++i) actions[i] = aPublish(BINARY, abi.encode(i));
        (bytes32 id,,) = retain(13, actions, bodyAt(63, abi.encode(uint256(63))));
        require(claimView(id).coverage == uint64(0x8000000000000000), "leaf 63 uses high coverage bit");
        archive.attachBodies(id, bodyAt(0, abi.encode(uint256(0))));
        require(claimView(id).coverage == uint64(0x8000000000000001), "stage preserves previous bits");
        archive.attachBodies(id, bodyAt(31, abi.encode(uint256(31))));
        require(claimView(id).coverage == uint64(0x8000000080000001), "only requested bits set");
        (,, bool attached, bytes memory absent) = archive.selectedRecord(id, 32);
        require(!attached && absent.length == 0, "unstaged leaf remains unavailable");
    }

    // Catches accepting oversized trailing calldata or truncating the maximum vector/body envelope.
    function test_maximum_vector_and_exact_calldata_ceilings() public {
        Ledger.Action[] memory actions = new Ledger.Action[](64);
        Archive.BodyInput[] memory bodies = new Archive.BodyInput[](64);
        uint256 total;
        for (uint16 i; i < 64; ++i) {
            bytes memory body = new bytes(i == 63 ? 65 : 129);
            body[0] = bytes1(uint8(i));
            actions[i] = aPublish(BINARY, body); bodies[i] = Archive.BodyInput(i, body);
            total += body.length;
        }
        require(total == 8192, "exact aggregate raw byte maximum");
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 14, actions);
        bytes memory encoded = abi.encodeCall(archive.retainSignedClaim, (intent, actions, sig, bodies));
        require(encoded.length == 37_316, "exact retention calldata ceiling");
        fails(bytes.concat(encoded, hex"00"), abi.encodeWithSelector(Archive.E_BOUNDS.selector, uint8(4)), "one trailing retention byte over ceiling rejects");
        bytes32 id = archive.retainSignedClaim(intent, actions, sig, bodies);
        encoded = abi.encodeCall(archive.attachBodies, (id, bodies));
        require(encoded.length == 18_468, "exact attachment calldata ceiling");
        fails(bytes.concat(encoded, hex"00"), abi.encodeWithSelector(Archive.E_BOUNDS.selector, uint8(4)), "one trailing attachment byte over ceiling rejects");
        archive.attachBodies(id, bodies);
        require(claimView(id).coverage == type(uint64).max, "maximum complete coverage");
        Ledger.Action[] memory rebuilt = new Ledger.Action[](64);
        for (uint16 i; i < 64; ++i) rebuilt[i] = archive.actionAt(id, i);
        sameAction(rebuilt[63], actions[63]);
        require(keccak256(abi.encode(rebuilt)) == claimView(id).actionsHash, "rebuilt maximum vector matches retained hash");
    }

    // Catches each independent bounds/descriptor branch before body copying or writes.
    function test_rejects_zero_actions_65_actions_65_bodies_duplicate_body_leaf_and_8193_bytes() public {
        Ledger.Action[] memory actions = one(aPublish(BINARY, hex"01"));
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 15, actions);
        fails(abi.encodeCall(archive.retainSignedClaim, (intent, new Ledger.Action[](0), sig, noBodies())), abi.encodeWithSelector(Archive.E_BOUNDS.selector, uint8(1)), "zero actions reject");
        fails(abi.encodeCall(archive.retainSignedClaim, (intent, new Ledger.Action[](65), sig, noBodies())), abi.encodeWithSelector(Archive.E_BOUNDS.selector, uint8(1)), "65 actions reject");
        Archive.BodyInput[] memory many = new Archive.BodyInput[](65);
        fails(abi.encodeCall(archive.retainSignedClaim, (intent, actions, sig, many)), abi.encodeWithSelector(Archive.E_BOUNDS.selector, uint8(2)), "65 bodies reject");
        fails(abi.encodeCall(archive.retainSignedClaim, (intent, actions, sig, bodyAt(0, new bytes(8193)))), abi.encodeWithSelector(Archive.E_BOUNDS.selector, uint8(3)), "8193 aggregate bytes reject");
        bytes32 id = archive.retainSignedClaim(intent, actions, sig, noBodies());
        fails(abi.encodeCall(archive.attachBodies, (id, many)), abi.encodeWithSelector(Archive.E_BOUNDS.selector, uint8(2)), "attachment body count bounded");
        fails(abi.encodeCall(archive.attachBodies, (id, bodyAt(0, new bytes(8193)))), abi.encodeWithSelector(Archive.E_BOUNDS.selector, uint8(3)), "attachment aggregate bytes bounded");
        many = new Archive.BodyInput[](2); many[0] = Archive.BodyInput(0, hex"01"); many[1] = Archive.BodyInput(0, hex"01");
        fails(abi.encodeCall(archive.retainSignedClaim, (intent, actions, sig, many)), abi.encodeWithSelector(Archive.E_BODY_LEAF.selector, uint16(0)), "duplicate retain leaf rejects");
        fails(abi.encodeCall(archive.attachBodies, (id, many)), abi.encodeWithSelector(Archive.E_BODY_LEAF.selector, uint16(0)), "duplicate attach leaf rejects");
        fails(abi.encodeCall(archive.attachBodies, (id, bodyAt(1, hex"01"))), abi.encodeWithSelector(Archive.E_LEAF.selector, uint16(1)), "out-of-range body leaf rejects");
        Ledger.Action[] memory nonrecord = one(arbitraryAction());
        Ledger.Intent memory arbitrary = arbitraryIntent(16);
        bytes memory arbitrarySig = signIntent(PK_A, ledger, arbitrary, nonrecord);
        fails(abi.encodeCall(archive.retainSignedClaim, (arbitrary, nonrecord, arbitrarySig, bodyAt(0, hex""))), abi.encodeWithSelector(Archive.E_BODY_LEAF.selector, uint16(0)), "nonrecord body leaf rejects");
    }

    // Catches covert Ledger shape/Type/profile validation or lossy normalization in the archive.
    function test_arbitrary_signed_tuples_and_unknown_type_are_claims_not_admissions() public {
        Ledger.Action[] memory actions = two(arbitraryAction(), aPublish(bytes32(uint256(0x999)), hex"cafe"));
        Ledger.Intent memory intent = arbitraryIntent(17);
        bytes memory sig = signIntent(PK_A, ledger, intent, actions);
        bytes32 beforeState = ledgerSnapshot(bytes32(0));
        bytes32 id = archive.retainSignedClaim(intent, actions, sig, noBodies());
        assertClaim(id, intent, actions, sig, 0);
        Ledger.Action[] memory rebuilt = new Ledger.Action[](2);
        rebuilt[0] = archive.actionAt(id, 0); rebuilt[1] = archive.actionAt(id, 1);
        require(keccak256(abi.encode(rebuilt)) == claimView(id).actionsHash, "arbitrary full vector reconstructs");
        bytes32 unknownRecord = rid(bytes32(uint256(0x999)), hex"cafe");
        require(archive.signedRecordClaimCount(unknownRecord) == 1, "unknown Type PUBLISH discoverable as a claim");
        (bytes32 posted, uint16 leaf) = archive.signedRecordClaimAt(unknownRecord, 0);
        require(posted == id && leaf == 1 && ledgerSnapshot(bytes32(0)) == beforeState, "signed claim discovery is not Ledger admission");
    }

    // Catches deduplicating postings by Record rather than immutable leaf occurrence.
    function test_record_postings_are_per_leaf_even_for_repeated_record_id() public {
        bytes memory body = hex"1234";
        bytes32 recordId = rid(BINARY, body);
        Ledger.Action[] memory actions = new Ledger.Action[](3);
        actions[0] = aPublish(BINARY, body); actions[1] = aReuse(BINARY, recordId); actions[2] = aPublish(BINARY, body);
        (bytes32 id, Ledger.Intent memory intent, bytes memory sig) = retain(18, actions, bodyAt(0, body));
        require(archive.signedRecordClaimCount(recordId) == 3, "one posting per record-bearing leaf");
        for (uint16 i; i < 3; ++i) {
            (bytes32 posted, uint16 leaf) = archive.signedRecordClaimAt(recordId, i);
            require(posted == id && leaf == i, "zero-based stable leaf posting order");
        }
        archive.attachBodies(id, bodyAt(1, body));
        archive.retainSignedClaim(intent, actions, sig, bodyAt(2, body));
        require(archive.signedRecordClaimCount(recordId) == 3 && claimView(id).coverage == 7, "attachment and retention retries never append postings");
        (bool ok,) = address(archive).staticcall(abi.encodeCall(archive.signedRecordClaimAt, (recordId, uint64(3))));
        require(!ok, "posting ordinal equal to count rejects");
        require(archive.signedRecordClaimCount(bytes32(uint256(0xdead))) == 0, "unknown record has no signed postings");
    }

    function representationBody(uint16 leaf) internal pure returns (bytes memory) {
        return leaf < 2 ? bytes("") : abi.encode(uint256(leaf / 2));
    }

    function representationVector(uint16 n) internal pure returns (Ledger.Action[] memory actions) {
        actions = new Ledger.Action[](n);
        for (uint16 i; i < n; ++i) {
            bytes32 t = keccak256("archive/equivalence/unknown-type");
            bytes memory body = representationBody(i);
            actions[i] = Ledger.Action(i % 2 == 0 ? 1 : 2, t,
                i % 2 == 0 ? keccak256(body) : rid(t, body),
                bytes32(uint256(0x100 + i)), bytes32(uint256(0x200 + i)),
                bytes32(uint256(0x300 + i)), bytes32(uint256(0x400 + i)),
                uint32(0x80000000 + i), bytes32(uint256(0x500 + i)));
        }
    }

    function representationClaim(Archive target, bytes32 id) internal view returns (ClaimView memory c) {
        (bool ok, bytes memory raw) = address(target).staticcall(abi.encodeCall(target.claim, (id)));
        require(ok && raw.length == 512, "representation claim has bounded ABI");
        c = abi.decode(raw, (ClaimView));
    }

    function retainedLocation(ArchiveVm.Log[] memory logs, address emitter, bytes32 id, uint16 n)
        internal pure returns (address location) {
        uint256 matches;
        for (uint256 i; i < logs.length; ++i) {
            if (logs[i].emitter != emitter) continue;
            require(logs[i].topics.length == 2 &&
                logs[i].topics[0] == keccak256("ClaimRetained(bytes32,address,uint16)") &&
                logs[i].topics[1] == id, "neutral retention event matches claim and emitter");
            uint16 count;
            (location, count) = abi.decode(logs[i].data, (address, uint16));
            require(count == n, "retention event observes complete vector length");
            ++matches;
        }
        require(matches == 1, "one neutral event per first retention");
    }

    function assertRepresentationRecords(Archive target, bytes32 id, Ledger.Action[] memory actions, bool covered)
        internal view {
        for (uint16 i; i < actions.length; ++i) {
            bytes memory expectedBody = representationBody(i);
            bytes32 expectedId = rid(actions[i].typeId, expectedBody);
            (bytes32 recordId, bytes32 typeId, bool attached, bytes memory body) = target.selectedRecord(id, i);
            require(recordId == expectedId && typeId == actions[i].typeId && attached == covered,
                "selected identity and claim-local coverage match fixture");
            require(covered ? keccak256(body) == keccak256(expectedBody) : body.length == 0,
                "selected bytes distinguish missing from attached empty body");
            uint64 expectedCount = actions.length == 1 ? 1 : 2;
            require(target.signedRecordClaimCount(expectedId) == expectedCount, "repeated record preserves each leaf posting");
            for (uint64 j; j < expectedCount; ++j) {
                (bytes32 posted, uint16 leaf) = target.signedRecordClaimAt(expectedId, j);
                require(posted == id && leaf == (i / 2) * 2 + j, "posting claim and leaf order match fixture");
            }
        }
    }

    // Catches missing/truncated vectors, shifted decoding, changed headers and representation-dependent body/posting semantics.
    function test_packed_and_codeblob_reconstruct_identical_1_2_64_vectors() public {
        uint16[3] memory sizes = [uint16(1), uint16(2), uint16(64)];
        for (uint256 cell; cell < sizes.length; ++cell) {
            uint16 n = sizes[cell];
            Archive packed = new SignedClaimArchivePacked();
            Archive blob = new SignedClaimArchiveCodeBlob();
            Ledger.Action[] memory actions = representationVector(n);
            Ledger.Intent memory intent = arbitraryIntent(n);
            bytes memory signature = signIntent(PK_A, ledger, intent, actions);
            bytes32 expectedId = ledger.intentDigest(intent, keccak256(abi.encode(actions)));
            avm.recordLogs();
            require(importer.retain(packed, intent, actions, signature, noBodies()) == expectedId, "packed exact digest");
            require(importer.retain(blob, intent, actions, signature, noBodies()) == expectedId, "codeblob exact digest");
            ArchiveVm.Log[] memory logs = avm.getRecordedLogs();
            Ledger.Action[] memory rebuiltPacked = new Ledger.Action[](n);
            Ledger.Action[] memory rebuiltBlob = new Ledger.Action[](n);
            for (uint16 leaf; leaf < n; ++leaf) {
                rebuiltPacked[leaf] = packed.actionAt(expectedId, leaf);
                rebuiltBlob[leaf] = blob.actionAt(expectedId, leaf);
                sameAction(rebuiltPacked[leaf], actions[leaf]);
                sameAction(rebuiltBlob[leaf], actions[leaf]);
            }
            bytes32 vectorHash = keccak256(abi.encode(actions));
            require(keccak256(abi.encode(rebuiltPacked)) == vectorHash &&
                keccak256(abi.encode(rebuiltBlob)) == vectorHash, "both complete vectors reconstruct signed hash");
            ClaimView memory pc = representationClaim(packed, expectedId);
            ClaimView memory bc = representationClaim(blob, expectedId);
            require(keccak256(abi.encode(pc)) == keccak256(abi.encode(bc)), "all header fields identical");
            require(keccak256(abi.encode(pc.source)) == keccak256(abi.encode(intent)) && pc.actionsHash == vectorHash &&
                pc.leafCount == n && pc.coverage == 0 && pc.firstImporter == address(importer) &&
                pc.retainedAt == block.timestamp && pc.proof == Archive.ProofLevel.AUTHOR_SIGNATURE_VERIFIED &&
                keccak256(abi.encodePacked(pc.r, pc.s, pc.v)) == keccak256(signature), "header matches independent signed fixture");
            require(retainedLocation(logs, address(packed), expectedId, n) == address(0), "packed has no code location");
            address location = retainedLocation(logs, address(blob), expectedId, n);
            require(location != address(0) && location.code.length == 65 + 288 * uint256(n), "exact bounded code size");
            if (n == 64) require(location.code.length == 18_497, "bound fits EIP-170");
            require(keccak256(location.code) == keccak256(bytes.concat(hex"00", abi.encode(actions))), "STOP plus exact vector bytes");
            assertRepresentationRecords(packed, expectedId, actions, false);
            assertRepresentationRecords(blob, expectedId, actions, false);
            Archive.BodyInput[] memory bodies = new Archive.BodyInput[](n);
            for (uint16 leaf; leaf < n; ++leaf) bodies[leaf] = Archive.BodyInput(leaf, representationBody(leaf));
            packed.attachBodies(expectedId, bodies);
            blob.attachBodies(expectedId, bodies);
            pc = representationClaim(packed, expectedId);
            bc = representationClaim(blob, expectedId);
            uint64 expectedCoverage = n == 64 ? type(uint64).max : uint64((uint256(1) << n) - 1);
            require(pc.coverage == expectedCoverage && keccak256(abi.encode(pc)) == keccak256(abi.encode(bc)),
                "identical claim-local coverage including high bit");
            assertRepresentationRecords(packed, expectedId, actions, true);
            assertRepresentationRecords(blob, expectedId, actions, true);
        }
    }

    // Catches retries redeploying CREATE carriers, emitting duplicate retention observations or rewriting state.
    function test_codeblob_retry_preserves_event_location_codehash_and_creation_nonce() public {
        Archive blob = new SignedClaimArchiveCodeBlob();
        Ledger.Action[] memory actions = representationVector(2);
        Ledger.Intent memory intent = arbitraryIntent(200);
        bytes memory signature = signIntent(PK_A, ledger, intent, actions);
        avm.recordLogs();
        bytes32 id = blob.retainSignedClaim(intent, actions, signature, bodyAt(0, hex""));
        address location = retainedLocation(avm.getRecordedLogs(), address(blob), id, 2);
        bytes32 codehash = location.codehash;
        uint64 creationNonce = avm.getNonce(address(blob));
        bytes32 header = keccak256(abi.encode(representationClaim(blob, id)));
        vm.warp(block.timestamp + 99);
        avm.record();
        avm.recordLogs();
        require(importer.retain(blob, intent, actions, signature, bodyAt(0, hex"")) == id, "retry exact digest");
        (, bytes32[] memory writes) = avm.accesses(address(blob));
        require(writes.length == 0 && avm.getRecordedLogs().length == 0, "retry has no archive writes or new retention event");
        require(avm.getNonce(address(blob)) == creationNonce && location.codehash == codehash &&
            codehash == keccak256(bytes.concat(hex"00", abi.encode(actions))), "retry preserves original carrier and creates no replacement");
        require(keccak256(abi.encode(representationClaim(blob, id))) == header, "retry preserves all header fields");
        for (uint16 leaf; leaf < 2; ++leaf) sameAction(blob.actionAt(id, leaf), actions[leaf]);
        require(blob.signedRecordClaimCount(rid(actions[0].typeId, hex"")) == 2, "retry appends no duplicate posting");
    }

    // Catches hashing a partial/wrong tuple, ignoring the leaf, swallowing archive errors, or storing read results.
    function test_paid_consumer_emits_exact_first_last_action_hash_without_storage() public {
        ArchiveReadConsumer paid = new ArchiveReadConsumer();
        Archive[2] memory targets = [Archive(new SignedClaimArchivePacked()), Archive(new SignedClaimArchiveCodeBlob())];
        Ledger.Action[] memory actions = representationVector(64);
        Ledger.Intent memory intent = arbitraryIntent(201);
        bytes memory signature = signIntent(PK_A, ledger, intent, actions);
        for (uint256 candidate; candidate < targets.length; ++candidate) {
            Archive target = targets[candidate];
            bytes32 id = target.retainSignedClaim(intent, actions, signature, noBodies());
            uint16[2] memory leaves = [uint16(0), uint16(63)];
            for (uint256 i; i < leaves.length; ++i) {
                uint16 leaf = leaves[i];
                avm.record();
                avm.recordLogs();
                paid.readAction(address(target), id, leaf);
                ArchiveVm.Log[] memory logs = avm.getRecordedLogs();
                require(logs.length == 1, "one paid action observation");
                require(logs[0].emitter == address(paid) && logs[0].topics.length == 3 &&
                    logs[0].topics[0] == keccak256("ActionRead(bytes32,uint16,bytes32)") &&
                    logs[0].topics[1] == id && logs[0].topics[2] == bytes32(uint256(leaf)) &&
                    abi.decode(logs[0].data, (bytes32)) == keccak256(abi.encode(actions[leaf])),
                    "paid event binds intended claim leaf and complete action hash");
                (, bytes32[] memory writes) = avm.accesses(address(paid));
                require(writes.length == 0, "paid consumer writes no storage");
                (, writes) = avm.accesses(address(target));
                require(writes.length == 0, "paid read leaves archive unchanged");
            }
            (bool ok, bytes memory err) = address(paid).call(abi.encodeCall(paid.readAction, (address(target), id, uint16(64))));
            require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(Archive.E_LEAF.selector, uint16(64))),
                "paid consumer preserves bounded archive errors");
        }
    }
}
