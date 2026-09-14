// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {QuoteAcceptor} from "../src/LabAcceptors.sol";
import {Actor} from "../src/LabHarness.sol";
import {Keys} from "../src/Keys.sol";
import {BIncomingQuotesReader, BScanIncomingQuotesReader, BIndexedIncomingQuotesReader} from "../src/IncomingQuotesReader.sol";
import {SelectiveReferenceIndexModule} from "../src/SelectiveReferenceIndexModule.sol";

interface IncomingVm {
    function etch(address target, bytes calldata code) external;
}

/// Disposable required-query prototype; real Ledger/Index/mandatory Quote rule, no query mocks.
contract IncomingQuotesTest is LabBase {
    bytes32 internal constant JOINED_SHAPE = keccak256("lab/type/quote-joined/1");
    bytes32 internal joinedType;
    QuoteAcceptor internal joinedRule;
    BScanIncomingQuotesReader internal scan;
    BIndexedIncomingQuotesReader internal indexedReader;
    struct Full { bytes32 p; bytes32 q; bytes32 a1; bytes32 a2; bytes32 b1; bytes32 a3; }

    function setUp() public override {
        super.setUp();
        joinedRule = new QuoteAcceptor();
        bytes32[] memory refs = new bytes32[](1);
        refs[0] = PAIR;
        joinedType = registry.register(JOINED_SHAPE, address(joinedRule), refs);
        // Profile registration precedes index construction; attachment precedes admission 1.
        index = new SelectiveReferenceIndexModule(address(ledger), joinedType, 0, PAIR, JOINED_SHAPE, address(joinedRule).codehash);
        ledger.setIndexModule(address(index));
        scan = new BScanIncomingQuotesReader(address(ledger), address(index), address(ledger).codehash, address(index).codehash, joinedType, PAIR, address(joinedRule).codehash);
        indexedReader = new BIndexedIncomingQuotesReader(address(ledger), address(index), address(ledger).codehash, address(index).codehash, joinedType, PAIR, address(joinedRule).codehash);
    }

    function quote(bytes32 pair, uint256 mantissa) internal pure returns (bytes memory) {
        return abi.encode(pair, mantissa, uint8(6), uint64(1_800_000_000), keccak256("reference quote"));
    }

    function publish(Actor author, bytes32 t, bytes memory body_) internal returns (bytes32) {
        bytes[] memory bodies = new bytes[](1);
        bodies[0] = body_;
        author.execute(one(aPublish(t, body_)), bodies);
        return rid(t, body_);
    }

    function pairFixture() internal returns (bytes32) {
        bytes32 itemA = publish(alice, ITEM, abi.encode(uint256(1)));
        bytes32 itemB = publish(alice, ITEM, abi.encode(uint256(2)));
        return publish(alice, PAIR, abi.encode(itemA, itemB, uint256(1)));
    }

    // Catches HEAD-only enumeration and reuse duplication across a page boundary.
    function test_retained_revisions_and_cross_page_reuse_both_readers() public {
        bytes32 pair = pairFixture();
        bytes32 subject = subjectOf(address(alice), 1);
        alice.execute(one(aCreate(bytes32(uint256(1)))), new bytes[](1));
        bytes32 a1 = publish(alice, joinedType, quote(pair, 2_500_000_000));
        alice.execute(one(aBind(HEAD, subject, NO_ROLE, a1, 0)), new bytes[](1));
        bytes32 a2 = publish(alice, joinedType, quote(pair, 2_502_000_000));
        alice.execute(one(aBind(HEAD, subject, NO_ROLE, a2, 1)), new bytes[](1));
        bob.execute(one(aReuse(joinedType, a1)), new bytes[](1));
        bytes32 b1 = publish(bob, joinedType, quote(pair, 2_501_000_000));
        checkSmall(scan, pair, a1, a2, b1);
        checkSmall(indexedReader, pair, a1, a2, b1);
    }

    function checkSmall(BIncomingQuotesReader reader, bytes32 pair, bytes32 a1, bytes32 a2, bytes32 b1) internal view {
        BIncomingQuotesReader.Cursor memory cursor;
        BIncomingQuotesReader.Page memory first = reader.incomingQuotes(pair, admissions(), 2, cursor);
        require(first.status == reader.PARTIAL(), "not complete before exhaustion");
        require(first.records.length == 2 && first.records[0] == a1 && first.records[1] == a2, "retained revisions, not HEADs");
        BIncomingQuotesReader.Page memory last = reader.incomingQuotes(pair, admissions(), 2, first.next);
        require(last.status == reader.COMPLETE(), "complete only at covered end");
        require(last.records.length == 1 && last.records[0] == b1, "reuse never duplicated");
        require(last.next.reader == address(reader) && last.next.position == last.rawTotal, "populated terminal cursor");
        require(abi.encode(last).length <= 4096, "bounded returned Page");
    }

    function signedBatch(uint256 pk, uint64 nonce, Ledger.Action[] memory actions, bytes[] memory bodies) internal {
        (Ledger.Intent memory intent, bytes memory signature) = signed(pk, ledger, nonce, actions);
        ledger.executeSigned(intent, actions, bodies, signature);
    }

    // Exact logical batches/admissions from the independent schedule. Unit tests use LabBase
    // EOAs; the later paid runner separately seals its standard-mnemonic EOAs and deadline.
    function fullFixture() internal returns (Full memory f) {
        bytes32[] memory refs = new bytes32[](1);
        refs[0] = PAIR;
        bytes32 other = registry.register(keccak256("lab/type/pair-note/1"), address(pairRule), refs);
        bytes[] memory bodies = new bytes[](5);
        bodies[0] = abi.encode(bytes32("ETH"), uint8(18));
        bodies[1] = abi.encode(bytes32("USDC"), uint8(6));
        bytes32 eth = rid(ITEM, bodies[0]);
        bytes32 usdc = rid(ITEM, bodies[1]);
        bodies[2] = abi.encode(eth, usdc, bytes32("ETH/USDC"));
        bodies[3] = abi.encode(usdc, eth, bytes32("USDC/ETH"));
        f.p = rid(PAIR, bodies[2]); f.q = rid(PAIR, bodies[3]);
        bytes32 salt = keccak256("required-query/subject/1");
        bytes32 subject = Keys.subject(pid(eoaA), salt);
        Ledger.Action[] memory actions = new Ledger.Action[](5);
        for (uint256 i; i < 4; ++i) actions[i] = aPublish(i < 2 ? ITEM : PAIR, bodies[i]);
        actions[4] = aCreate(salt);
        signedBatch(PK_A, 0, actions, bodies);
        f.a1 = rid(joinedType, quote(f.p, 2_500_000_000));
        f.a2 = rid(joinedType, quote(f.p, 2_500_000_001));
        f.b1 = rid(joinedType, quote(f.p, 2_500_000_002));
        f.a3 = rid(joinedType, quote(f.p, 2_500_000_003));
        for (uint256 i; i < 2; ++i) {
            bodies = new bytes[](3); actions = new Ledger.Action[](3);
            bodies[0] = quote(f.q, 1_000_000_001 + i);
            bodies[1] = quote(f.p, 2_500_000_000 + i);
            actions[0] = aPublish(joinedType, bodies[0]); actions[1] = aPublish(joinedType, bodies[1]);
            actions[2] = aBind(HEAD, subject, NO_ROLE, i == 0 ? f.a1 : f.a2, uint32(i));
            signedBatch(PK_A, uint64(i + 1), actions, bodies);
        }
        signedBatch(PK_B, 0, one(aReuse(joinedType, f.a1)), new bytes[](1));
        bodies = new bytes[](1); bodies[0] = quote(f.q, 1_000_000_003);
        signedBatch(PK_A, 3, one(aPublish(joinedType, bodies[0])), bodies);
        bodies = new bytes[](2); bodies[0] = quote(f.p, 2_500_000_002);
        signedBatch(PK_B, 1, two(aPublish(joinedType, bodies[0]), aBind(HEAD, subject, NO_ROLE, f.b1, 0)), bodies);
        bodies = new bytes[](6); actions = new Ledger.Action[](6);
        for (uint256 i; i < 5; ++i) {
            bodies[i] = quote(f.q, 1_000_000_004 + i);
            actions[i] = aPublish(joinedType, bodies[i]);
        }
        bodies[5] = abi.encode(f.p, bytes32("R1"), uint256(1)); actions[5] = aPublish(other, bodies[5]);
        signedBatch(PK_A, 4, actions, bodies);
        require(admissions() == 21, "old basis is admission 21");
        bodies = new bytes[](3); actions = new Ledger.Action[](3);
        bodies[0] = quote(f.p, 2_500_000_003); bodies[1] = quote(f.q, 1_000_000_009);
        actions[0] = aPublish(joinedType, bodies[0]); actions[1] = aPublish(joinedType, bodies[1]);
        actions[2] = aReuse(joinedType, f.b1);
        signedBatch(PK_A, 5, actions, bodies);
        require(admissions() == 24, "current basis is admission 24");
        (, uint64 firstA,,) = ledger.record(f.a1); (, uint64 firstB,,) = ledger.record(f.b1);
        require(firstA == 7 && firstB == 14, "independent first-admission seal");
    }

    // Catches unrelated targets, old-basis tail leakage, premature COMPLETE, and cost counters
    // which omit filtered/reused/future candidates. Every expected page is independently fixed.
    function test_full_signed_schedule_old_and_current_against_current_tail() public {
        Full memory f = fullFixture();
        checkFull(scan, f, false, 21); checkFull(scan, f, false, 24);
        checkFull(indexedReader, f, true, 21); checkFull(indexedReader, f, true, 24);
    }

    function checkFull(BIncomingQuotesReader reader, Full memory f, bool selective_, uint64 basis) internal view {
        BIncomingQuotesReader.Cursor memory cursor;
        uint32 scanned; uint32 headers; uint32 bodies; uint256 seen;
        uint256 pages = selective_ ? 2 : (basis == 21 ? 7 : 8);
        bytes32[4] memory expected = [f.a1, f.a2, f.b1, f.a3];
        for (uint256 n; n < pages; ++n) {
            BIncomingQuotesReader.Page memory page = reader.incomingQuotes(f.p, basis, 2, cursor);
            require(page.rawTotal == (selective_ ? 4 : 15), "rawTotal observes current tail");
            require(page.scanned == ((!selective_ && n == pages - 1) ? 1 : 2), "exact charged page work");
            require(page.status == (n == pages - 1 ? reader.COMPLETE() : reader.PARTIAL()), "exact status sequence");
            uint256 count = selective_ ? ((basis == 21 && n == 1) ? 1 : 2)
                : ((n == 0 || n == 1 || n == 3 || (basis == 24 && n == 6)) ? 1 : 0);
            require(page.records.length == count, "exact page membership count");
            for (uint256 i; i < page.records.length; ++i) require(page.records[i] == expected[seen++], "exact retained order without duplicate");
            scanned += page.scanned; headers += page.headerReads; bodies += page.bodyReads;
            require(abi.encode(page).length <= 4096, "Page encoding bound");
            cursor = page.next;
        }
        require(seen == (basis == 21 ? 3 : 4), "exact full retained set");
        require(scanned == (selective_ ? 4 : (basis == 21 ? 13 : 15)), "all examined candidates charged");
        require(headers == (selective_ ? (basis == 21 ? 3 : 4) : (basis == 21 ? 12 : 15)), "actual fixed admission lookups");
        require(bodies == (selective_ ? 0 : headers), "indexed discovery never copies bodies");
        require(cursor.position == (selective_ ? 4 : 15), "terminal position is observed total");
        BIncomingQuotesReader.Page memory ended = reader.incomingQuotes(f.p, basis, 2, cursor);
        require(ended.status == reader.COMPLETE() && ended.scanned == 0 && ended.records.length == 0, "terminal continuation does not restart");
    }

    function reject(BIncomingQuotesReader reader, bytes32 pair, uint64 basis, uint32 budget, BIncomingQuotesReader.Cursor memory cursor, bytes4 expected) internal view {
        (bool ok, bytes memory error) = address(reader).staticcall(abi.encodeCall(reader.incomingQuotes, (pair, basis, budget, cursor)));
        require(!ok && sel(error) == expected, "expected fail-closed query error");
    }

    function test_invalid_budget_basis_absent_or_wrong_target_rejected() public {
        bytes32 pair = pairFixture();
        BIncomingQuotesReader.Cursor memory zero;
        BIncomingQuotesReader[2] memory readers = [BIncomingQuotesReader(scan), BIncomingQuotesReader(indexedReader)];
        for (uint256 i; i < 2; ++i) {
            reject(readers[i], pair, admissions(), 0, zero, BIncomingQuotesReader.E_BOUNDS.selector);
            reject(readers[i], pair, admissions(), 65, zero, BIncomingQuotesReader.E_BOUNDS.selector);
            reject(readers[i], pair, 0, 2, zero, BIncomingQuotesReader.E_BOUNDS.selector);
            reject(readers[i], pair, admissions() + 1, 2, zero, BIncomingQuotesReader.E_BOUNDS.selector);
            reject(readers[i], pair, 2, 2, zero, BIncomingQuotesReader.E_PAIR.selector);
            reject(readers[i], bytes32(uint256(999)), admissions(), 2, zero, BIncomingQuotesReader.E_PAIR.selector);
            reject(readers[i], rid(ITEM, abi.encode(uint256(1))), admissions(), 2, zero, BIncomingQuotesReader.E_PAIR.selector);
        }
    }

    function test_each_cursor_commitment_mutation_and_same_graph_cross_mode_replay_rejected() public {
        Full memory f = fullFixture();
        BIncomingQuotesReader.Cursor memory zero;
        BIncomingQuotesReader[2] memory readers = [BIncomingQuotesReader(scan), BIncomingQuotesReader(indexedReader)];
        for (uint256 r; r < 2; ++r) {
            BIncomingQuotesReader.Page memory page = readers[r].incomingQuotes(f.p, 21, 2, zero);
            reject(readers[1-r], f.p, 21, 2, page.next, BIncomingQuotesReader.E_CURSOR.selector);
            for (uint256 field; field < 12; ++field) {
                BIncomingQuotesReader.Cursor memory bad = abi.decode(abi.encode(page.next), (BIncomingQuotesReader.Cursor));
                if (field == 0) bad.reader = address(1);
                if (field == 1) bad.ledger = address(1);
                if (field == 2) bad.ledgerCodehash = bytes32(uint256(1));
                if (field == 3) bad.index = address(1);
                if (field == 4) bad.indexCodehash = bytes32(uint256(1));
                if (field == 5) bad.realmOrigin = bytes32(uint256(1));
                if (field == 6) bad.sourceType = ITEM;
                if (field == 7) bad.referenceOrdinal = 1;
                if (field == 8) bad.target = f.q;
                if (field == 9) bad.basisAdmission = 24;
                if (field == 10) bad.moduleGeneration++;
                if (field == 11) bad.position = page.rawTotal + 1;
                reject(readers[r], f.p, 21, 2, bad, BIncomingQuotesReader.E_CURSOR.selector);
            }
            BIncomingQuotesReader.Cursor memory partialZero;
            partialZero.target = f.p;
            reject(readers[r], f.p, 21, 2, partialZero, BIncomingQuotesReader.E_CURSOR.selector);
        }
    }

    function test_generation_invalidation_and_changed_attachment_rejected() public {
        Full memory f = fullFixture();
        BIncomingQuotesReader.Cursor memory zero;
        BIncomingQuotesReader.Page memory a = scan.incomingQuotes(f.p, 21, 2, zero);
        BIncomingQuotesReader.Page memory b = indexedReader.incomingQuotes(f.p, 21, 2, zero);
        index.bumpGeneration();
        reject(scan, f.p, 21, 2, a.next, BIncomingQuotesReader.E_CURSOR.selector);
        reject(indexedReader, f.p, 21, 2, b.next, BIncomingQuotesReader.E_CURSOR.selector);
        ledger.setIndexModule(address(new IndexModule(address(ledger))));
        reject(scan, f.p, 21, 2, zero, BIncomingQuotesReader.E_IDENTITY.selector);
        reject(indexedReader, f.p, 21, 2, zero, BIncomingQuotesReader.E_IDENTITY.selector);
    }

    function test_runtime_pins_rechecked_for_ledger_index_and_rule() public {
        bytes32 pair = pairFixture();
        uint64 basis = admissions();
        BIncomingQuotesReader.Cursor memory zero;
        address[3] memory targets = [address(ledger), address(index), address(joinedRule)];
        for (uint256 i; i < 3; ++i) {
            bytes memory original = targets[i].code;
            IncomingVm(address(vm)).etch(targets[i], hex"00");
            bytes4 expected = i == 2 ? bytes4(keccak256("E_PROFILE()")) : BIncomingQuotesReader.E_IDENTITY.selector;
            reject(scan, pair, basis, 2, zero, expected);
            reject(indexedReader, pair, basis, 2, zero, expected);
            IncomingVm(address(vm)).etch(targets[i], original);
        }
    }

    function test_wrong_source_ordinal_rule_shape_and_code_constructor_rejected() public {
        bool failed;
        try new BScanIncomingQuotesReader(address(ledger), address(index), address(ledger).codehash, address(index).codehash, ITEM, PAIR, address(joinedRule).codehash) {} catch { failed = true; }
        require(failed, "wrong source descriptor rejected"); failed = false;
        try new SelectiveReferenceIndexModule(address(ledger), joinedType, 1, PAIR, JOINED_SHAPE, address(joinedRule).codehash) {} catch { failed = true; }
        require(failed, "wrong ordinal rejected"); failed = false;
        try new SelectiveReferenceIndexModule(address(ledger), joinedType, 0, PAIR, bytes32(0), address(joinedRule).codehash) {} catch { failed = true; }
        require(failed, "wrong shape rejected"); failed = false;
        try new SelectiveReferenceIndexModule(address(ledger), joinedType, 0, PAIR, JOINED_SHAPE, address(pairRule).codehash) {} catch { failed = true; }
        require(failed, "wrong mandatory rule rejected"); failed = false;
        IndexModule wrong = new IndexModule(address(ledger));
        ledger.setIndexModule(address(wrong));
        try new BIndexedIncomingQuotesReader(address(ledger), address(wrong), address(ledger).codehash, address(index).codehash, joinedType, PAIR, address(joinedRule).codehash) {} catch { failed = true; }
        require(failed, "wrong-code index cannot masquerade as selective module"); failed = false;
        // Even honestly pinned ordinary index cannot supply the mandatory selective profile/family.
        try new BIndexedIncomingQuotesReader(address(ledger), address(wrong), address(ledger).codehash, address(wrong).codehash, joinedType, PAIR, address(joinedRule).codehash) {} catch { failed = true; }
        require(failed, "unknown selective family is unavailable, not empty complete");
    }

    function test_exactly_one_pair_reference_and_reciprocal_ledger_required() public {
        bytes32[] memory refs = new bytes32[](2); refs[0] = ITEM; refs[1] = PAIR;
        bytes32 another = registry.register(keccak256("other-ordinal-profile"), address(joinedRule), refs);
        bool failed;
        try new BScanIncomingQuotesReader(address(ledger), address(index), address(ledger).codehash, address(index).codehash, another, PAIR, address(joinedRule).codehash) {} catch { failed = true; }
        require(failed, "Pair at another ordinal is not this query profile"); failed = false;
        Ledger otherLedger = new Ledger(registry, REALM);
        ledger.setIndexModule(address(new IndexModule(address(otherLedger))));
        address wrong = ledger.indexModule();
        try new BScanIncomingQuotesReader(address(ledger), wrong, address(ledger).codehash, wrong.codehash, joinedType, PAIR, address(joinedRule).codehash) {} catch { failed = true; }
        require(failed, "same ABI and pinned code cannot replace reciprocal attachment");
    }

    function installReaders() internal {
        scan = new BScanIncomingQuotesReader(address(ledger), address(index), address(ledger).codehash, address(index).codehash, joinedType, PAIR, address(joinedRule).codehash);
        indexedReader = new BIndexedIncomingQuotesReader(address(ledger), address(index), address(ledger).codehash, address(index).codehash, joinedType, PAIR, address(joinedRule).codehash);
    }

    function assertPartial(bytes32 pair) internal view {
        BIncomingQuotesReader.Cursor memory zero;
        BIncomingQuotesReader.Page memory a = scan.incomingQuotes(pair, admissions(), 64, zero);
        BIncomingQuotesReader.Page memory b = indexedReader.incomingQuotes(pair, admissions(), 64, zero);
        require(a.status == scan.PARTIAL() && b.status == indexedReader.PARTIAL(), "incomplete family never complete");
        require(a.next.position == a.rawTotal && b.next.position == b.rawTotal, "exhausted partial stays at tail");
    }

    function test_late_attachment_exhausted_partial_never_complete() public {
        bytes32 pair = pairFixture();
        publish(alice, joinedType, quote(pair, 1));
        index = new SelectiveReferenceIndexModule(address(ledger), joinedType, 0, PAIR, JOINED_SHAPE, address(joinedRule).codehash);
        ledger.setIndexModule(address(index)); installReaders();
        assertPartial(pair);
    }

    function test_gapped_and_optional_family_never_complete() public {
        bytes32 pair = pairFixture();
        ledger.setIndexModule(address(new IndexModule(address(ledger))));
        publish(alice, joinedType, quote(pair, 1));
        ledger.setIndexModule(address(index));
        publish(alice, joinedType, quote(pair, 2));
        require(index.gapped(), "real detached publication creates coverage gap");
        assertPartial(pair);
    }

    function test_downgraded_mandatory_families_never_complete() public {
        bytes32 pair = pairFixture();
        publish(alice, joinedType, quote(pair, 1));
        index.declareOptional(index.FAMILY_BY_TYPE(), 1);
        index.declareOptional(SelectiveReferenceIndexModule(address(index)).FAMILY_REFERENCE_POSITION(), 1);
        assertPartial(pair);
    }

    function test_scan_works_with_original_nonselective_index() public {
        index = new IndexModule(address(ledger)); ledger.setIndexModule(address(index));
        scan = new BScanIncomingQuotesReader(address(ledger), address(index), address(ledger).codehash, address(index).codehash, joinedType, PAIR, address(joinedRule).codehash);
        Full memory f = fullFixture();
        checkFull(scan, f, false, 21); checkFull(scan, f, false, 24);
    }

    function backlink(bytes32 id, uint64 count_, uint64 live_) internal view {
        (uint64 count, uint64 live,,) = index.postingHead(Keys.backlinkList(id));
        require(count == count_ && live == live_, "original binding backlink count/live maintained");
    }

    function test_binding_backlink_rebind_unbind_preserved_and_retained_membership_unchanged() public {
        bytes32 pair = pairFixture();
        bytes32 q1 = publish(alice, joinedType, quote(pair, 1));
        bytes32 q2 = publish(alice, joinedType, quote(pair, 2));
        bytes32 subject = subjectOf(address(alice), 1);
        alice.execute(one(aCreate(bytes32(uint256(1)))), new bytes[](1));
        alice.execute(one(aBind(HEAD, subject, NO_ROLE, q1, 0)), new bytes[](1));
        backlink(q1, 1, 1); backlink(q2, 0, 0);
        alice.execute(one(aBind(HEAD, subject, NO_ROLE, q2, 1)), new bytes[](1));
        backlink(q1, 1, 0); backlink(q2, 1, 1);
        alice.execute(one(aUnbind(HEAD, subject, NO_ROLE, 2)), new bytes[](1));
        backlink(q1, 1, 0); backlink(q2, 1, 0);
        BIncomingQuotesReader.Cursor memory zero;
        BIncomingQuotesReader.Page memory page = indexedReader.incomingQuotes(pair, admissions(), 2, zero);
        require(page.status == indexedReader.COMPLETE() && page.records.length == 2
            && page.records[0] == q1 && page.records[1] == q2, "retained relation survives unbind");
    }

    /// B-only auxiliary, not matched C parity and not a price measurement.
    function test_B_only_auxiliary_zero_occurrence_record_still_returned() public {
        bytes32 pair = pairFixture();
        bytes32 z = publish(alice, joinedType, quote(pair, 99)); uint64 a = admissions();
        bob.execute(one(aReuse(joinedType, z)), new bytes[](1)); uint64 b = admissions();
        alice.execute(one(aWithdraw(a)), new bytes[](1)); bob.execute(one(aWithdraw(b)), new bytes[](1));
        (,, uint32 occurrences,) = ledger.record(z); require(occurrences == 0, "both authors withdrew");
        (uint64 count, uint64 live,,) = index.postingHead(Keys.byTypeList(joinedType));
        require(count == 2 && live == 0, "old occurrence maintenance preserved");
        (count, live,,) = index.postingHead(Keys.referenceList(joinedType, 0, pair));
        require(count == 1 && live == 1, "retained-family live is not current validity");
        BIncomingQuotesReader.Cursor memory zero;
        BIncomingQuotesReader.Page memory x = scan.incomingQuotes(pair, admissions(), 2, zero);
        BIncomingQuotesReader.Page memory y = indexedReader.incomingQuotes(pair, admissions(), 2, zero);
        require(x.status == scan.COMPLETE() && y.status == indexedReader.COMPLETE(), "retained complete after withdrawals");
        require(x.records.length == 1 && y.records.length == 1 && x.records[0] == z && y.records[0] == z, "zero occurrence Z remains queryable");
    }

    function test_64_returned_ids_fit_Page_4096_bound() public {
        bytes32 pair = pairFixture();
        bytes32[64] memory ids;
        // Separate publications here isolate Page size from the separate max-action callback test.
        for (uint256 i; i < 64; ++i) ids[i] = publish(alice, joinedType, quote(pair, i + 1));
        BIncomingQuotesReader.Cursor memory zero;
        BIncomingQuotesReader[2] memory readers = [BIncomingQuotesReader(scan), BIncomingQuotesReader(indexedReader)];
        for (uint256 r; r < 2; ++r) {
            BIncomingQuotesReader.Page memory page = readers[r].incomingQuotes(pair, admissions(), 64, zero);
            require(page.records.length == 64 && page.scanned == 64 && page.status == readers[r].COMPLETE(), "full maximum page");
            for (uint256 i; i < 64; ++i) require(page.records[i] == ids[i], "every maximum-page id in order");
            require(abi.encode(page).length == 2688 && abi.encode(page).length <= 4096, "actual maximum Page ABI bytes");
        }
    }

    /// Resource experiment: retain any real E_INDEX/E_GAS failure; never raise callback bounds.
    function test_max64_action_distinct_quote_targets_existing_callback_allowance() public {
        bytes32 itemA = publish(alice, ITEM, abi.encode(uint256(1)));
        bytes32 itemB = publish(alice, ITEM, abi.encode(uint256(2)));
        bytes32[64] memory targets;
        for (uint256 i; i < 64; ++i) targets[i] = publish(alice, PAIR, abi.encode(itemA, itemB, i + 1));
        Ledger.Action[] memory actions = new Ledger.Action[](64); bytes[] memory bodies = new bytes[](64);
        for (uint256 i; i < 64; ++i) { bodies[i] = quote(targets[i], i + 1); actions[i] = aPublish(joinedType, bodies[i]); }
        uint64 before = admissions();
        alice.execute(actions, bodies);
        require(admissions() == before + 64, "all 64 accepted under unchanged callback budget");
        for (uint256 i; i < 64; ++i) {
            (uint64 count, uint64 live,,) = index.postingHead(Keys.referenceList(joinedType, 0, targets[i]));
            require(count == 1 && live == 1, "every distinct target callback posting retained");
        }
    }
}

/// Root's paid runner can transact through this test-only consumer; no product API/storage added.
contract IncomingQuotesPaidConsumer {
    event PageRead(bytes32 commitment);
    function paidIncomingQuotes(BIncomingQuotesReader reader, bytes32 pair, uint64 basis, uint32 budget, BIncomingQuotesReader.Cursor calldata cursor)
        external returns (BIncomingQuotesReader.Page memory page)
    {
        page = reader.incomingQuotes(pair, basis, budget, cursor);
        emit PageRead(keccak256(abi.encode(page)));
    }
}
