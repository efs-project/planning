// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {LabBase} from "./LabBase.sol";

/// DISPOSABLE LAB, NO PROTOCOL CLAIM. Coordinator deltas: signature binds every field (A),
/// subject ids are portable across deployments (B), state-only reconstruction (C), listing
/// cursor across a mutation (D/4), rename-then-recreate keeps identity (1), ordered-prefix
/// batch law and exact-retry no-op (5).
contract LedgerEvidenceTest is LabBase {
    function expectSignedFail(
        Ledger.Intent memory intent,
        Ledger.Action[] memory a,
        bytes[] memory b,
        bytes memory sig,
        bytes4 expected,
        string memory label
    ) internal {
        uint64 before = admissions();
        try ledger.executeSigned(intent, a, b, sig) {
            require(false, label);
        } catch (bytes memory err) {
            expectSel(err, expected, label);
        }
        require(admissions() == before && ledger.nonces(eoaA) == 0, "rejected before any write");
    }

    function test_signature_binds_every_field() public {
        bytes32 salt = bytes32(uint256(1));
        bytes32 subj = subjectOf(eoaA, 1);
        bytes32 r1 = rid(QUOTE, q(3000));
        Ledger.Action[] memory a = new Ledger.Action[](4);
        a[0] = aCreate(salt);
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aBind(HEAD, subj, NO_ROLE, r1, 0);
        a[3] = aBind(FOLDER, SWAPS, name("eth-usdc"), subj, 0);
        bytes[] memory b = new bytes[](4);
        b[1] = q(3000);
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 0, a);
        Ledger.Action[] memory m;
        m = cloneAll(a);
        m[3].role = name("eth-usdt");
        expectSignedFail(intent, m, b, sig, Ledger.E_SIGNATURE.selector, "name");
        m = cloneAll(a);
        m[2].target = rid(QUOTE, q(3001));
        expectSignedFail(intent, m, b, sig, Ledger.E_SIGNATURE.selector, "target");
        m = cloneAll(a);
        m[2].subject = keccak256("other subject");
        expectSignedFail(intent, m, b, sig, Ledger.E_SIGNATURE.selector, "subject");
        m = cloneAll(a);
        m[3].expectedRevision = 1;
        expectSignedFail(intent, m, b, sig, Ledger.E_SIGNATURE.selector, "expectedRevision");
        m = cloneAll(a);
        m[1] = clone(a[2]);
        m[2] = clone(a[1]);
        expectSignedFail(intent, m, b, sig, Ledger.E_SIGNATURE.selector, "action order");
        m = cloneAll(a);
        m[0].salt = bytes32(uint256(2));
        expectSignedFail(intent, m, b, sig, Ledger.E_SIGNATURE.selector, "subject salt");
        Ledger.Intent memory bad = cloneIntent(intent);
        bad.realmId = keccak256("other realm");
        expectSignedFail(bad, a, b, sig, Ledger.E_INTENT.selector, "realm");
        bad = cloneIntent(intent);
        bad.coreCodeCommitment = keccak256("other code");
        expectSignedFail(bad, a, b, sig, Ledger.E_INTENT.selector, "code commitment");
        bad = cloneIntent(intent);
        bad.acceptanceProfile = keccak256("other rules");
        expectSignedFail(bad, a, b, sig, Ledger.E_INTENT.selector, "acceptance profile");
        bad = cloneIntent(intent);
        bad.indexObligations = keccak256("other index");
        expectSignedFail(bad, a, b, sig, Ledger.E_INTENT.selector, "index obligations");
        bad = cloneIntent(intent);
        bad.nonce = 1;
        expectSignedFail(bad, a, b, sig, Ledger.E_SIGNATURE.selector, "nonce (digest differs before the sequence check)");
        bad = cloneIntent(intent);
        bad.deadline = intent.deadline + 1;
        expectSignedFail(bad, a, b, sig, Ledger.E_SIGNATURE.selector, "deadline");
        (uint64 pub,) = ledger.executeSigned(intent, a, b, sig);
        require(pub == 1 && admissions() == 4, "the unmutated publication is admitted");
    }

    function test_subject_id_portable_across_fresh_deployment() public {
        // Key subject identity travels; execution authorization does not. The
        // implementation-self immutable makes these exact runtime identities distinct.
        ledger.setIndexModule(address(0));
        Ledger ledger2 = new Ledger(registry, REALM);
        require(address(ledger2).codehash != address(ledger).codehash, "distinct exact implementation commitments");
        bytes32 salt = bytes32(uint256(77));
        bytes32 subj = subjectOf(eoaA, 77);
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aCreate(salt);
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aBind(HEAD, subj, NO_ROLE, rid(QUOTE, q(3000)), 0);
        bytes[] memory b = new bytes[](3);
        b[1] = q(3000);
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 0, a);
        (uint64 p1,) = ledger.executeSigned(intent, a, b, sig);
        (bool accepted,) = address(ledger2).call(abi.encodeCall(ledger2.executeSigned,(intent,a,b,sig)));
        require(!accepted,"source authorization cannot be relabeled as destination authorization");
        (intent,sig) = signed(PK_A,ledger2,0,a);
        (uint64 p2,) = ledger2.executeSigned(intent, a, b, sig);
        require(ledger.subjectCreatedAt(subj) == 1 && ledger2.subjectCreatedAt(subj) == 1, "same subject id on both");
        (,,,,,,,,,,,, bytes32 h1) = ledger.evidence(p1);
        (,,,,,,,,,,,, bytes32 h2) = ledger2.evidence(p2);
        require(h1 == h2 && h1 == keccak256(abi.encode(a)), "same actions hash");
        bytes32 pubId = keccak256(abi.encode(eoaA, uint64(0), h1));
        require(ledger.publicationOf(pubId) == p1 && ledger2.publicationOf(pubId) == p2, "same publication id");
        (,,, address rec, bool ok) = recon.reconstruct(ledger2, p2);
        require(ok && rec == eoaA, "destination verifies its own authorization");
    }

    function test_reconstruction_from_state_only_all_kinds() public {
        bytes32 salt = bytes32(uint256(5));
        bytes32 subj = subjectOf(eoaA, 5);
        bytes32 r1 = rid(QUOTE, q(3000));
        Ledger.Action[] memory a = new Ledger.Action[](6);
        a[0] = aCreate(salt);
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aBind(HEAD, subj, NO_ROLE, r1, 0);
        a[3] = aUnbind(HEAD, subj, NO_ROLE, 1);
        a[4] = aReuse(QUOTE, r1);
        a[5] = aWithdraw(2); // the publish two rows earlier in this same publication
        bytes[] memory b = new bytes[](6);
        b[1] = q(3000);
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 0, a);
        (uint64 pub,) = ledger.executeSigned(intent, a, b, sig);
        (Ledger.Action[] memory rebuilt, bytes32 h, bytes32 digest, address recovered, bool ok) = recon.reconstruct(ledger, pub);
        require(ok && recovered == eoaA && h == keccak256(abi.encode(a)), "signed publication reconstructed from rows");
        require(digest == ledger.intentDigest(intent, h), "same typed-data digest");
        require(rebuilt.length == 6 && rebuilt[3].kind == 4 && rebuilt[4].typeId == QUOTE && rebuilt[5].target == bytes32(uint256(2)), "all kinds rebuilt");
        (,, uint32 occ,) = ledger.record(r1);
        require(occ == 1, "publish withdrawn, reuse remains");
        Ledger.Action[] memory n = two(aPublish(QUOTE, q(1)), aBind(HEAD, subj, NO_ROLE, rid(QUOTE, q(1)), 0));
        bytes[] memory nb = new bytes[](2);
        nb[0] = q(1);
        (uint64 pubN,) = alice.execute(n, nb);
        (, bytes32 hn,, address recN, bool okN) = recon.reconstruct(ledger, pubN);
        require(okN && recN == address(0) && hn == keccak256(abi.encode(n)), "native: hash matches, no signature to recover");
    }

    function test_rename_move_recreate_old_path_keeps_identity() public {
        bytes32 F = alice.create(bytes32(uint256(1)));
        bytes32 R0 = alice.publish(BINARY, f41(0x61));
        require(keccak256(ledger.body(R0)) == keccak256(f41(0x61)), "41-byte body round-trips exactly");
        alice.bind(HEAD, F, NO_ROLE, R0, 0);
        alice.bind(FOLDER, DRAFTS, name("note.txt"), F, 0);
        alice.bind(TAG, F, name("project_efs"), F, 0); // File tag about the stable subject
        alice.unbind(FOLDER, DRAFTS, name("note.txt"), 1); // rename
        alice.bind(FOLDER, DRAFTS, name("brief.txt"), F, 0);
        alice.unbind(FOLDER, DRAFTS, name("brief.txt"), 1); // move
        alice.bind(FOLDER, PUBLISHED, name("brief.txt"), F, 0);
        bytes32 G = alice.create(bytes32(uint256(2))); // unrelated File at the vacated name
        bytes32 RG = alice.publish(BINARY, f41(0x62));
        alice.bind(HEAD, G, NO_ROLE, RG, 0);
        alice.bind(FOLDER, DRAFTS, name("note.txt"), G, 2);
        require(F != G, "different identities");
        address[] memory la = lensOf(address(alice));
        (uint8 st, bytes32 t,,,) = lens.resolve(la, FOLDER, DRAFTS, name("note.txt"));
        require(st == 1 && t == G, "old name now holds G");
        (st, t,,,) = lens.resolve(la, FOLDER, PUBLISHED, name("brief.txt"));
        require(st == 1 && t == F, "F at its new path");
        (st,,,,) = lens.resolve(la, FOLDER, DRAFTS, name("brief.txt"));
        require(st == 2, "no ghost: an explicit removal, not absence");
        (st, t,,,) = lens.resolve(la, HEAD, F, NO_ROLE);
        require(st == 1 && t == R0, "F's head untouched by rename and move");
        (st,,,,) = lens.resolve(la, TAG, F, name("project_efs"));
        require(st == 1, "tag follows F");
        (st,,,,) = lens.resolve(la, TAG, G, name("project_efs"));
        require(st == 0, "tag does not transfer to G");
        bytes32 pos = Keys.position(FOLDER, DRAFTS, name("note.txt"));
        (uint8 hs, bool live, bytes32 ht, uint32 hr,) = lens.history(address(alice), pos, 5);
        require(hs == 2 && live && ht == F && hr == 1, "name history: F first");
        (hs, live, ht, hr,) = lens.history(address(alice), pos, 6);
        require(hs == 2 && !live && hr == 2, "name history: removed");
        (hs, live, ht, hr,) = lens.history(address(alice), pos, 13);
        require(hs == 2 && live && ht == G && hr == 3, "name history: G now");
        LensReader.Cursor memory fresh;
        LensReader.Page memory page = lens.list(la, FOLDER, DRAFTS, fresh, 10);
        require(page.status == 2 && page.selectedSoFar == 1 && page.items[0].target == G, "/drafts lists exactly G");
    }

    function nm(uint256 i) internal pure returns (bytes32) {
        return keccak256(abi.encode("f", i));
    }

    function test_page_across_mutation_cursor_law() public {
        bytes32[5] memory s;
        for (uint256 i; i < 5; ++i) {
            s[i] = alice.create(bytes32(uint256(100 + i)));
            alice.bind(FOLDER, DRAFTS, nm(i), s[i], 0);
        }
        address[] memory la = lensOf(address(alice));
        LensReader.Cursor memory fresh;
        LensReader.Page memory p1 = lens.list(la, FOLDER, DRAFTS, fresh, 2);
        require(p1.status == 1 && p1.items.length == 2 && !p1.mutated && p1.next.basisAdmission == admissions(), "page 1 pins the basis");
        alice.unbind(FOLDER, DRAFTS, nm(3), 1); // mutations after the basis
        alice.bind(FOLDER, DRAFTS, nm(5), s[0], 0);
        LensReader.Page memory p2 = lens.list(la, FOLDER, DRAFTS, p1.next, 10);
        require(p2.next.basisAdmission == p1.next.basisAdmission, "continuation keeps the basis");
        require(p2.status == 2 && p2.mutated, "complete, but flagged: heads changed after the basis");
        require(p2.items.length == 3 && p2.selectedSoFar == 5, "no duplicate, no skip: f2, f4, f5");
        try lens.list(la, FOLDER, PUBLISHED, p1.next, 2) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, LensReader.E_CURSOR.selector, "cursor is bound to the scope");
        }
    }

    function test_same_batch_typed_reference_and_wrong_type() public {
        bytes memory i1 = q(1);
        bytes memory i2 = q(2);
        bytes32 id1 = rid(ITEM, i1);
        bytes32 id2 = rid(ITEM, i2);
        bytes memory pair = abi.encode(id1, id2, uint256(1));
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aPublish(ITEM, i1);
        a[1] = aPublish(ITEM, i2);
        a[2] = aPublish(PAIR, pair);
        bytes[] memory b = new bytes[](3);
        b[0] = i1;
        b[1] = i2;
        b[2] = pair;
        alice.execute(a, b); // I -> O in one publication: ordered-prefix observation
        (bytes32 tt,,,) = ledger.record(rid(PAIR, pair));
        require(tt == PAIR, "pair admitted against same-batch items");
        bytes memory i3 = q(3);
        bytes memory pair2 = abi.encode(rid(ITEM, i3), id2, uint256(2));
        a = two(aPublish(PAIR, pair2), aPublish(ITEM, i3));
        b = new bytes[](2);
        b[0] = pair2;
        b[1] = i3;
        try alice.execute(a, b) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_REF_MISSING.selector, "O before I: not yet written");
        }
        bytes memory qb = q(9);
        bytes memory pair3 = abi.encode(rid(QUOTE, qb), id2, uint256(3));
        a = two(aPublish(QUOTE, qb), aPublish(PAIR, pair3));
        b[0] = qb;
        b[1] = pair3;
        try alice.execute(a, b) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_REF_TYPE.selector, "O referencing a wrong-Type I");
        }
        (tt,,,) = ledger.record(rid(QUOTE, qb));
        require(tt == bytes32(0), "the earlier action of the failed batch is rolled back");
    }

    function test_exact_native_retry_is_noop() public {
        Ledger.Action[] memory a = one(aPublish(QUOTE, q(5)));
        bytes[] memory b = new bytes[](1);
        b[0] = q(5);
        alice.executeWithNonce(a, b, 0);
        uint64 before = admissions();
        try alice.executeWithNonce(a, b, 0) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.AlreadyAdmitted.selector, "exact retry");
        }
        require(admissions() == before && ledger.nonces(address(alice)) == 1, "no effect");
        a = one(aPublish(QUOTE, q(6)));
        b[0] = q(6);
        try alice.executeWithNonce(a, b, 0) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_NONCE.selector, "a different action under a consumed nonce is refused, not duplicated");
        }
    }
}
