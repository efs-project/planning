// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {FailingIndexModule, MockAcceptor} from "../src/LabHarness.sol";
import {LabBase} from "./LabBase.sol";

/// DISPOSABLE LAB, NO PROTOCOL CLAIM. road-b.md §6 matrix: {native, signed} x {single, two under a
/// lens}, checked references through direct/batch/dedup/reuse, stale CAS, whole-publication
/// rollback on failed acceptance and on failed mandatory index, complete folder listing with a
/// count, and as-of history. Semantics only; gas is measured by script/measure.mjs.
contract LedgerMatrixTest is LabBase {
    function test_native_single_author_lifecycle() public {
        bytes32 subj = subjectOf(address(alice), 1);
        bytes32 r1 = rid(QUOTE, q(3000));
        Ledger.Action[] memory a = new Ledger.Action[](4);
        a[0] = aCreate(bytes32(uint256(1)));
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aBind(HEAD, subj, NO_ROLE, r1, 0);
        a[3] = aBind(FOLDER, SWAPS, name("eth-usdc"), subj, 0);
        bytes[] memory b = new bytes[](4);
        b[1] = q(3000);
        (uint64 pub, uint64 first) = alice.execute(a, b);
        require(pub == 1 && first == 1, "first publication");
        require(ledger.subjectCreatedAt(subj) == 1, "subject minted at admission 1");
        (uint8 st, bytes32 t, uint32 rev, address au,) = lens.resolve(lensOf(address(alice)), HEAD, subj, NO_ROLE);
        require(st == 1 && t == r1 && rev == 1 && au == address(alice), "head resolves");
        (st, t,,,) = lens.resolve(lensOf(address(alice)), FOLDER, SWAPS, name("eth-usdc"));
        require(st == 1 && t == subj, "placement resolves to the subject");
        // edit: fresh body + CAS rebind of the head
        bytes32 r2 = rid(QUOTE, q(3100));
        a = two(aPublish(QUOTE, q(3100)), aBind(HEAD, subj, NO_ROLE, r2, 1));
        b = new bytes[](2);
        b[0] = q(3100);
        alice.execute(a, b);
        (st, t, rev,,) = lens.resolve(lensOf(address(alice)), HEAD, subj, NO_ROLE);
        require(st == 1 && t == r2 && rev == 2, "edited head");
        // dedup: same bytes again -> new admission and occurrence, no new record
        (, uint64 recordsBefore,,) = ledger.counts();
        require(alice.publish(QUOTE, q(3100)) == r2, "dedup id");
        (, uint64 recordsAfter,,) = ledger.counts();
        (, uint64 firstAdm, uint32 occ,) = ledger.record(r2);
        require(recordsAfter == recordsBefore && occ == 2 && firstAdm == 5, "dedup: admission only");
        // as-of history: admission 3 was the first head bind, admission 6 the rebind
        bytes32 pos = Keys.position(HEAD, subj, NO_ROLE);
        (uint8 hs, bool live, bytes32 ht, uint32 hr, uint64 ha) = lens.history(address(alice), pos, 3);
        require(hs == 2 && live && ht == r1 && hr == 1 && ha == 3, "as-of first head");
        (hs, live, ht, hr, ha) = lens.history(address(alice), pos, 99);
        require(hs == 2 && live && ht == r2 && hr == 2 && ha == 6, "as-of latest");
        (hs,,,,) = lens.history(address(alice), pos, 2);
        require(hs == 1, "before the first head: none");
        consumer.readQuote(lensOf(address(alice)), HEAD, subj, NO_ROLE);
        require(consumer.lastValue() == 3100 && consumer.lastRevision() == 2, "paid consumer read");
    }

    function test_native_two_authors_lens_mask_fallthrough() public {
        bytes32 subj = subjectOf(address(alice), 7);
        bytes32 ra = rid(QUOTE, q(2500));
        bytes32 rb = rid(QUOTE, q(2501));
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aCreate(bytes32(uint256(7)));
        a[1] = aPublish(QUOTE, q(2500));
        a[2] = aBind(HEAD, subj, NO_ROLE, ra, 0);
        bytes[] memory b = new bytes[](3);
        b[1] = q(2500);
        alice.execute(a, b);
        a = two(aPublish(QUOTE, q(2501)), aBind(HEAD, subj, NO_ROLE, rb, 0)); // bob's own head on the shared subject
        b = new bytes[](2);
        b[0] = q(2501);
        bob.execute(a, b);
        address[] memory ab = lensOf(address(alice), address(bob));
        address[] memory ba = lensOf(address(bob), address(alice));
        (uint8 st, bytes32 t,, address au,) = lens.resolve(ab, HEAD, subj, NO_ROLE);
        require(st == 1 && t == ra && au == address(alice), "A-first selects A");
        (st, t,, au,) = lens.resolve(ba, HEAD, subj, NO_ROLE);
        require(st == 1 && t == rb && au == address(bob), "B-first selects B");
        (uint8 cs, LensReader.Entry[] memory cands) = lens.resolveNoTiebreak(ab, HEAD, subj, NO_ROLE);
        require(cs == 3 && cands.length == 2, "no-tiebreak: CONFLICT with both candidates");
        // a removal by the higher principal masks; it never falls through
        alice.unbind(HEAD, subj, NO_ROLE, 1);
        (st, t,,,) = lens.resolve(ab, HEAD, subj, NO_ROLE);
        require(st == 2 && t == bytes32(0), "A's tombstone masks B under A-first");
        (st, t,,,) = lens.resolve(ba, HEAD, subj, NO_ROLE);
        require(st == 1 && t == rb, "B-first still selects B");
        (st, t,,,) = lens.resolve(lensOf(address(consumer), address(bob)), HEAD, subj, NO_ROLE);
        require(st == 1 && t == rb, "an absent principal falls through");
        (cs, cands) = lens.resolveNoTiebreak(ab, HEAD, subj, NO_ROLE);
        require(cs == 3 && cands.length == 1, "live next to a removal is CONFLICT");
        consumer.readQuote(ba, HEAD, subj, NO_ROLE);
        require(consumer.lastValue() == 2501, "paid two-author read");
    }

    function test_signed_single_author() public {
        bytes32 subj = subjectOf(eoaA, 1);
        bytes32 r1 = rid(QUOTE, q(3000));
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aCreate(bytes32(uint256(1)));
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aBind(HEAD, subj, NO_ROLE, r1, 0);
        bytes[] memory b = new bytes[](3);
        b[1] = q(3000);
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, 0, a);
        (uint64 pub,) = ledger.executeSigned(intent, a, b, sig); // this contract relays
        (address author, uint8 proofKind, uint8 v,, uint64 first, bytes32 r, bytes32 s,,,,,,) = ledger.evidence(pub);
        require(author == eoaA && proofKind == 2 && (v == 27 || v == 28) && first == 1, "signed evidence");
        require(r != bytes32(0) && s != bytes32(0), "signature retained");
        require(ledger.nonces(eoaA) == 1, "nonce consumed");
        (uint8 st, bytes32 t,, address au,) = lens.resolve(lensOf(eoaA), HEAD, subj, NO_ROLE);
        require(st == 1 && t == r1 && au == eoaA, "EOA head");
        uint64 before = admissions();
        try ledger.executeSigned(intent, a, b, sig) {
            require(false, "retry must revert");
        } catch (bytes memory err) {
            expectSel(err, Ledger.AlreadyAdmitted.selector, "exact retry is a no-op");
        }
        require(admissions() == before, "retry wrote nothing");
        a = one(aPublish(QUOTE, q(1)));
        b = new bytes[](1);
        b[0] = q(1);
        (intent, sig) = signed(PK_A, ledger, 0, a);
        try ledger.executeSigned(intent, a, b, sig) {
            require(false, "stale nonce must revert");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_NONCE.selector, "stale nonce");
        }
        (intent, sig) = signed(PK_A, ledger, 1, a);
        intent.deadline = uint64(block.timestamp - 1);
        sig = signIntent(PK_A, ledger, intent, a);
        try ledger.executeSigned(intent, a, b, sig) {
            require(false, "expired must revert");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_EXPIRED.selector, "expired deadline");
        }
        (pub,) = alice.execute(a, b);
        (author, proofKind,,,,,,,,,,,) = ledger.evidence(pub);
        require(author == address(alice) && proofKind == 1, "native evidence: contract author, no signature");
    }

    function test_signed_two_authors_and_reconstruction() public {
        bytes32 subj = subjectOf(eoaA, 2);
        bytes32 ra = rid(QUOTE, q(2500));
        bytes32 rb = rid(QUOTE, q(2501));
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aCreate(bytes32(uint256(2)));
        a[1] = aPublish(QUOTE, q(2500));
        a[2] = aBind(HEAD, subj, NO_ROLE, ra, 0);
        bytes[] memory b = new bytes[](3);
        b[1] = q(2500);
        (Ledger.Intent memory ia, bytes memory sa) = signed(PK_A, ledger, 0, a);
        (uint64 pubA,) = ledger.executeSigned(ia, a, b, sa);
        Ledger.Action[] memory a2 = two(aPublish(QUOTE, q(2501)), aBind(HEAD, subj, NO_ROLE, rb, 0));
        bytes[] memory b2 = new bytes[](2);
        b2[0] = q(2501);
        (Ledger.Intent memory ib, bytes memory sb) = signed(PK_B, ledger, 0, a2);
        (uint64 pubB,) = ledger.executeSigned(ib, a2, b2, sb);
        (uint8 st, bytes32 t,,,) = lens.resolve(lensOf(eoaA, eoaB), HEAD, subj, NO_ROLE);
        require(st == 1 && t == ra, "A-first");
        (st, t,,,) = lens.resolve(lensOf(eoaB, eoaA), HEAD, subj, NO_ROLE);
        require(st == 1 && t == rb, "B-first");
        (, bytes32 h1,, address rec1, bool ok1) = recon.reconstruct(ledger, pubA);
        require(ok1 && rec1 == eoaA && h1 == keccak256(abi.encode(a)), "A reconstructed from state");
        (,,, address rec2, bool ok2) = recon.reconstruct(ledger, pubB);
        require(ok2 && rec2 == eoaB, "B reconstructed from state");
    }

    function test_checked_references_direct_batch_dedup_reuse() public {
        bytes32 i1 = alice.publish(ITEM, q(1));
        bytes32 i2 = alice.publish(ITEM, q(2));
        bytes32 qq = alice.publish(QUOTE, q(3000));
        bytes memory good = abi.encode(i1, i2, uint256(5)); // two checked refs, then payload
        bytes32 pairId = alice.publish(PAIR, good);
        require(pairId == rid(PAIR, good), "pair admitted");
        bytes memory wrong = abi.encode(i1, qq, uint256(5));
        bytes memory missing = abi.encode(i1, keccak256("nowhere"), uint256(5));
        try alice.publish(PAIR, wrong) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_REF_TYPE.selector, "direct: wrong-Type ref");
        }
        try alice.publish(PAIR, missing) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_REF_MISSING.selector, "direct: missing ref");
        }
        Ledger.Action[] memory a = one(aPublish(PAIR, wrong));
        bytes[] memory b = new bytes[](1);
        b[0] = wrong;
        try alice.execute(a, b) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_REF_TYPE.selector, "batch: wrong-Type ref");
        }
        a = one(aPublish(PAIR, missing));
        b[0] = missing;
        try alice.execute(a, b) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_REF_MISSING.selector, "batch: missing ref");
        }
        // rule change after acceptance: dedup (bytes again) and reuse (id only) are both re-checked
        // against the Realm's CURRENT policy. Since the authority repair (REPAIR.md R2) the ref
        // layout is part of PAIR's identity: registering tighter refs is a DIFFERENT Type and PAIR is
        // untouched, so the re-check lever is a policy activation (a refusing acceptor), not a rewrite.
        bytes32[] memory tighter = new bytes32[](2);
        tighter[0] = QUOTE;
        tighter[1] = ITEM;
        bytes32 pairStrict = registry.register(PAIR_SHAPE, address(pairRule), tighter);
        require(pairStrict != PAIR && registry.refTypes(PAIR)[0] == ITEM && registry.refTypes(pairStrict)[0] == QUOTE, "tighter refs are a new exact Type; PAIR unchanged");
        MockAcceptor refuser = new MockAcceptor();
        refuser.set(1, 0);
        require(registry.activate(PAIR, address(refuser)) == 3, "policy activation 3 for PAIR (row 2 is the setUp mock)");
        try alice.publish(PAIR, good) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_POLICY_REJECTED.selector, "dedup re-checks the current policy");
        }
        a = one(aReuse(PAIR, pairId));
        b[0] = "";
        try bob.execute(a, b) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_POLICY_REJECTED.selector, "reuse re-checks the current policy");
        }
        require(registry.activate(PAIR, address(acceptor)) == 4, "policy activation 4 (the accepting mock again)");
        (, uint64 first) = bob.execute(a, b); // reuse by another author: new admission and occurrence, same record
        (uint8 kind,,,,,, bytes32 ra,) = ledger.admission(first);
        require(kind == 2 && ra == pairId, "reuse admission row");
        (,, uint32 occ,) = ledger.record(pairId);
        require(occ == 2, "two occurrences of one record");
        (bytes32 bt, uint16 act, address bman,, address bpol,,,) = ledger.acceptanceBasis(first);
        require(bt == PAIR && act == 4 && bman == address(pairRule) && bpol == address(acceptor), "the reuse records the mandatory rule and the policy row that admitted it");
        (,, uint32 occ0,) = ledger.record(pairId);
        (bytes32 bt0, uint16 act0, address bman0,, address bpol0,,,) = ledger.acceptanceBasis(4); // alice's original PAIR publish: admission 4
        require(occ0 == 2 && bt0 == PAIR && act0 == 2 && bman0 == address(pairRule) && bpol0 == address(acceptor), "the original admission keeps policy row 2 as its basis");
    }

    function test_binding_role_demands_target_type() public {
        bytes32 subj = alice.create(bytes32(uint256(3)));
        bytes32 qq = alice.publish(QUOTE, q(1));
        bytes32 it = alice.publish(ITEM, q(2));
        registry.setBindingRefType(TAG, name("market"), QUOTE);
        alice.bind(TAG, subj, name("market"), qq, 0);
        try alice.bind(TAG, subj, name("market"), it, 1) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_TARGET_TYPE.selector, "wrong-Type binding target");
        }
        try alice.bind(TAG, subj, name("market"), subj, 1) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_TARGET_TYPE.selector, "a subject is untyped");
        }
        try alice.bind(HEAD, subj, NO_ROLE, keccak256("nowhere"), 0) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_TARGET_MISSING.selector, "missing binding target");
        }
        alice.bind(TAG, subj, name("other"), subj, 0); // untyped role accepts a subject target
    }

    function test_stale_cas_and_not_live() public {
        bytes32 subj = alice.create(bytes32(uint256(4)));
        bytes32 qq = alice.publish(QUOTE, q(1));
        alice.bind(HEAD, subj, NO_ROLE, qq, 0);
        try alice.bind(HEAD, subj, NO_ROLE, qq, 0) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_CAS.selector, "stale bind");
        }
        try alice.unbind(HEAD, subj, NO_ROLE, 0) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_CAS.selector, "stale unbind");
        }
        alice.unbind(HEAD, subj, NO_ROLE, 1);
        try alice.unbind(HEAD, subj, NO_ROLE, 2) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_NOT_LIVE.selector, "unbind a tombstone");
        }
        alice.bind(HEAD, subj, NO_ROLE, qq, 2);
        (uint8 st, uint32 rev, bytes32 t) = headOf(address(alice), HEAD, subj, NO_ROLE);
        require(st == 1 && rev == 3 && t == qq, "revision continues after a tombstone");
    }

    function test_failed_acceptance_rolls_back_publication() public {
        bytes32 salt = bytes32(uint256(5));
        bytes32 subj = subjectOf(address(alice), 5);
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aCreate(salt);
        a[1] = aPublish(ITEM, q(9));
        a[2] = aPublish(QUOTE, q(3000));
        bytes[] memory b = new bytes[](3);
        b[1] = q(9);
        b[2] = q(3000);
        (uint64 adm0, uint64 rec0,, uint64 pub0) = ledger.counts();
        for (uint8 mode = 1; mode <= 3; ++mode) {
            acceptor.set(mode, 0); // return false / revert / burn the bounded gas (the mock is QUOTE's ADDITIONAL policy, row 2)
            try alice.execute(a, b) {
                require(false, "x");
            } catch (bytes memory err) {
                expectSel(err, Ledger.E_POLICY_REJECTED.selector, "rejected by the policy acceptor");
            }
            (uint64 adm1, uint64 rec1,, uint64 pub1) = ledger.counts();
            require(adm1 == adm0 && rec1 == rec0 && pub1 == pub0, "nothing admitted");
            require(ledger.subjectCreatedAt(subj) == 0, "earlier actions rolled back");
            (bytes32 tt,,,) = ledger.record(rid(ITEM, q(9)));
            require(tt == bytes32(0), "item rolled back");
            require(ledger.nonces(address(alice)) == 0, "nonce rolled back");
        }
        acceptor.set(0, 0);
        alice.execute(a, b);
        require(ledger.subjectCreatedAt(subj) == 1, "accepted afterwards");
    }

    function test_failed_index_module_reverts_and_coverage_is_honest() public {
        FailingIndexModule failing = new FailingIndexModule();
        ledger.setIndexModule(address(failing));
        uint64 adm0 = admissions();
        try alice.publish(QUOTE, q(1)) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_INDEX.selector, "index failure reverts the publication");
        }
        require(admissions() == adm0, "rolled back");
        (uint8 cov,,) = index.coverage(index.FAMILY_SCOPE(), bytes32(0));
        require(cov == 2, "COMPLETE before any gap");
        ledger.setIndexModule(address(0));
        alice.publish(QUOTE, q(1)); // admitted while detached: a gap the module can never close
        ledger.setIndexModule(address(index));
        alice.publish(QUOTE, q(2));
        (cov,,) = index.coverage(index.FAMILY_SCOPE(), bytes32(0));
        require(cov == 1 && index.gapped(), "gap => PARTIAL");
        bytes32 optional = keccak256("efs2/family/by-digest/1");
        (cov,,) = index.coverage(optional, bytes32(0));
        require(cov == 0, "undeclared => UNKNOWN");
        index.declareOptional(optional, 3);
        (uint8 cov2, uint64 from,) = index.coverage(optional, bytes32(0));
        require(cov2 == 1 && from == 3, "optional => PARTIAL from its declared start");
    }

    function test_folder_listing_mask_count_and_paging() public {
        bytes32 sA1 = alice.create(bytes32(uint256(11)));
        bytes32 sA2 = alice.create(bytes32(uint256(12)));
        bytes32 sA3 = alice.create(bytes32(uint256(13)));
        bytes32 sB2 = bob.create(bytes32(uint256(22)));
        bytes32 sB4 = bob.create(bytes32(uint256(24)));
        alice.bind(FOLDER, DRAFTS, name("n1"), sA1, 0);
        alice.bind(FOLDER, DRAFTS, name("n2"), sA2, 0);
        alice.bind(FOLDER, DRAFTS, name("n3"), sA3, 0);
        bob.bind(FOLDER, DRAFTS, name("n2"), sB2, 0);
        bob.bind(FOLDER, DRAFTS, name("n4"), sB4, 0);
        address[] memory ab = lensOf(address(alice), address(bob));
        LensReader.Cursor memory fresh;
        LensReader.Page memory page = lens.list(ab, FOLDER, DRAFTS, fresh, 10);
        require(page.status == 2 && page.selectedSoFar == 4 && page.rawTotal == 5 && page.scanned == 5, "4 selected of 5 raw");
        require(page.items.length == 4 && page.items[1].target == sA2 && page.items[3].target == sB4, "A's n2 wins, B's n4 shows");
        alice.unbind(FOLDER, DRAFTS, name("n2"), 1);
        page = lens.list(ab, FOLDER, DRAFTS, fresh, 10);
        require(page.status == 2 && page.selectedSoFar == 3, "A's removal masks B's n2");
        page = lens.list(ab, FOLDER, DRAFTS, fresh, 2);
        require(page.status == 1 && page.scanned == 2 && page.items.length == 1 && page.selectedSoFar == 1, "page 1: partial");
        page = lens.list(ab, FOLDER, DRAFTS, page.next, 2);
        require(page.status == 1 && page.scanned == 2 && page.items.length == 1 && page.selectedSoFar == 2, "page 2: partial");
        page = lens.list(ab, FOLDER, DRAFTS, page.next, 2);
        require(page.status == 2 && page.scanned == 1 && page.selectedSoFar == 3 && page.items[0].target == sB4, "page 3: complete");
        consumer.readList(ab, FOLDER, DRAFTS, 10);
        require(consumer.lastCount() == 3 && consumer.lastStatus() == 2, "paid listing");
        try lens.list(lensOf(address(bob), address(alice)), FOLDER, DRAFTS, page.next, 2) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, LensReader.E_CURSOR.selector, "cursor is bound to the lens");
        }
    }

    function test_history_as_of_tombstone_and_rebind() public {
        bytes32 subj = alice.create(bytes32(uint256(21)));
        bytes32 r1 = alice.publish(QUOTE, q(1));
        bytes32 r2 = alice.publish(QUOTE, q(2));
        uint64 o1 = alice.bind(HEAD, subj, NO_ROLE, r1, 0);
        uint64 o2 = alice.bind(HEAD, subj, NO_ROLE, r2, 1);
        uint64 o3 = alice.unbind(HEAD, subj, NO_ROLE, 2);
        uint64 o4 = alice.bind(HEAD, subj, NO_ROLE, r1, 3);
        bytes32 pos = Keys.position(HEAD, subj, NO_ROLE);
        (uint8 s, bool live, bytes32 t, uint32 rev, uint64 adm) = lens.history(address(alice), pos, o1);
        require(s == 2 && live && t == r1 && rev == 1 && adm == o1, "as-of o1");
        (s, live, t, rev, adm) = lens.history(address(alice), pos, o2);
        require(s == 2 && live && t == r2 && rev == 2 && adm == o2, "as-of o2");
        (s, live, t, rev, adm) = lens.history(address(alice), pos, o3);
        require(s == 2 && !live && t == bytes32(0) && rev == 3 && adm == o3, "as-of o3: tombstone");
        (s, live, t, rev, adm) = lens.history(address(alice), pos, o4);
        require(s == 2 && live && t == r1 && rev == 4 && adm == o4, "as-of o4");
        (s,,,,) = lens.history(address(alice), pos, o1 - 1);
        require(s == 1, "as-of before any head: none");
        consumer.readHistory(address(alice), pos, o2);
        require(consumer.lastTarget() == r2 && consumer.lastRevision() == 2, "paid as-of read");
        (uint8 st,, uint64 adm2, uint64 prev,,) = ledger.head(Keys.binding(pid(address(alice)), pos));
        require(st == 1 && adm2 == o4 && prev == o3, "head keeps its previous admission");
    }

    function test_two_authors_identical_record_and_withdraw() public {
        bytes32 id = alice.publish(QUOTE, q(42));
        require(bob.publish(QUOTE, q(42)) == id, "same record id");
        (, uint64 first, uint32 occ,) = ledger.record(id);
        require(first == 1 && occ == 2, "one record, two occurrences");
        (uint64 c, uint64 live,,) = index.postingHead(Keys.byTypeList(QUOTE));
        require(c == 2 && live == 2, "by-Type discovery without opting in");
        (c, live,,) = index.postingHead(Keys.byAuthorList(pid(address(alice))));
        require(c == 1 && live == 1, "by-author discovery without opting in");
        Ledger.Action[] memory a = one(aWithdraw(1));
        bytes[] memory b = new bytes[](1);
        try bob.execute(a, b) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_WITHDRAW.selector, "only the author withdraws");
        }
        alice.execute(a, b);
        (,, occ,) = ledger.record(id);
        require(occ == 1, "alice's occurrence withdrawn");
        (,,,,, bool wd,,) = ledger.admission(1);
        require(wd, "alice's admission flagged");
        (,,,,, wd,,) = ledger.admission(2);
        require(!wd, "bob's admission untouched");
        (c, live,,) = index.postingHead(Keys.byAuthorList(pid(address(alice))));
        require(c == 1 && live == 0, "by-author live count released");
        (, live,,) = index.postingHead(Keys.byTypeList(QUOTE));
        require(live == 1, "by-Type live count released once");
        require(ledger.body(id).length == 32, "record bytes remain");
        try alice.execute(a, b) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_WITHDRAW.selector, "cannot withdraw twice");
        }
    }
}
