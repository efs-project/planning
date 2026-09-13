// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {QuoteAcceptor, LabelAcceptor} from "../src/LabAcceptors.sol";
import {JoinedConsumer, StatelessConsumer, ILedgerReads, ILensReads} from "../src/JoinedConsumer.sol";
import {FaultyReads} from "./FaultyReads.sol";
import {LabBase} from "./LabBase.sol";

/// DISPOSABLE LAB, NO PROTOCOL CLAIM. UNRUN (written under another worker's compiler lease).
/// sdk-fixture steps 1–6 with the exact fixture values, read through the stateless test-only
/// measurement consumer; the stateless twin of the storing Consumer; the joined acceptor.
contract JoinedConsumerTest is LabBase {
    bytes32 internal constant QUOTE_J_SHAPE = keccak256("lab/type/quote-joined/1");
    bytes32 internal constant LABEL_SHAPE = keccak256("lab/type/label/1");
    bytes32 internal QUOTE_J; // exact ids, derived by the registry (REPAIR.md R2)
    bytes32 internal LABEL;
    bytes32 internal constant MARKETS = keccak256("/markets");
    bytes internal constant NOTE_BYTES = hex"7265666572656e63652071756f7465"; // UTF-8 "reference quote"
    uint256 internal constant M_A1 = 2_500_000_000;
    uint256 internal constant M_A2 = 2_502_000_000;
    uint256 internal constant M_B1 = 2_501_000_000;
    uint8 internal constant SCALE = 6;
    uint64 internal constant OBSERVED_AT = 1_800_000_000;

    QuoteAcceptor internal quoteAcceptor;
    LabelAcceptor internal labelAcceptor;
    JoinedConsumer internal joined;
    StatelessConsumer internal stateless;
    FaultyReads internal faulty; // forwarding reader with one armable fault (test/FaultyReads.sol)
    JoinedConsumer internal faultyJoined; // the same consumer code reading through `faulty`

    struct Ids {
        bytes32 itemA;
        bytes32 itemB;
        bytes32 pairId;
        bytes32 subj;
        bytes32 a1;
        bytes32 a2;
        bytes32 b1;
        bytes32 headPos;
        bytes32 swapsPos;
    }

    function setUp() public override {
        super.setUp();
        quoteAcceptor = new QuoteAcceptor();
        labelAcceptor = new LabelAcceptor();
        bytes32[] memory pairRef = new bytes32[](1);
        pairRef[0] = PAIR;
        QUOTE_J = registry.register(QUOTE_J_SHAPE, address(quoteAcceptor), pairRef);
        LABEL = registry.register(LABEL_SHAPE, address(labelAcceptor), new bytes32[](0));
        joined = new JoinedConsumer(ILedgerReads(address(ledger)), ILensReads(address(lens)), QUOTE_J, PAIR, ITEM, LABEL);
        stateless = new StatelessConsumer(lens);
        faulty = new FaultyReads(ledger, lens);
        faultyJoined = new JoinedConsumer(ILedgerReads(address(faulty)), ILensReads(address(faulty)), QUOTE_J, PAIR, ITEM, LABEL);
    }

    function quoteBody(bytes32 pairId, uint256 mantissa) internal pure returns (bytes memory) {
        return abi.encode(pairId, mantissa, SCALE, OBSERVED_AT, keccak256(NOTE_BYTES));
    }

    /// Step 1: ITEM_ETH, ITEM_USDC and PAIR_ETH_USDC in one native batch (I -> O, ordered prefix).
    /// Admissions 1, 2, 3; publication 1.
    function admitItemsAndPair(Ids memory id) internal {
        bytes memory iA = abi.encode(uint256(1));
        bytes memory iB = abi.encode(uint256(2));
        id.itemA = rid(ITEM, iA);
        id.itemB = rid(ITEM, iB);
        bytes memory pair = abi.encode(id.itemA, id.itemB, uint256(1));
        id.pairId = rid(PAIR, pair);
        Ledger.Action[] memory a = new Ledger.Action[](3);
        a[0] = aPublish(ITEM, iA);
        a[1] = aPublish(ITEM, iB);
        a[2] = aPublish(PAIR, pair);
        bytes[] memory b = new bytes[](3);
        b[0] = iA;
        b[1] = iB;
        b[2] = pair;
        alice.execute(a, b);
        (bytes32 t,,,) = ledger.record(id.pairId);
        require(t == PAIR, "pair admitted against same-batch items");
    }

    /// Steps 1–4. Admission ordinals from the sealed setUp (admissions == 0):
    ///   1 ITEM_ETH, 2 ITEM_USDC, 3 PAIR                                        (native batch, publication 1)
    ///   4 create FILE_QUOTE, 5 QUOTE_A1, 6 A head rev 1, 7 A /swaps rev 1, 8 A tag rev 1 (signed nonce 0, publication 2)
    ///   9 QUOTE_A2, 10 A head rev 2 (CAS against 1)                            (signed nonce 1, publication 3)
    ///   11 QUOTE_B1, 12 B head rev 1                                            (bob = the producer contract, publication 4)
    function runSteps1to4() internal returns (Ids memory id) {
        admitItemsAndPair(id);
        id.subj = subjectOf(eoaA, 1);
        bytes memory q1 = quoteBody(id.pairId, M_A1);
        id.a1 = rid(QUOTE_J, q1);
        Ledger.Action[] memory a = new Ledger.Action[](5);
        a[0] = aCreate(bytes32(uint256(1)));
        a[1] = aPublish(QUOTE_J, q1);
        a[2] = aBind(HEAD, id.subj, NO_ROLE, id.a1, 0);
        a[3] = aBind(FOLDER, SWAPS, name("eth-usdc"), id.subj, 0);
        a[4] = aBind(TAG, id.subj, name("market"), id.subj, 0);
        bytes[] memory b = new bytes[](5);
        b[1] = q1;
        (Ledger.Intent memory i0, bytes memory s0) = signed(PK_A, ledger, 0, a);
        ledger.executeSigned(i0, a, b, s0);
        bytes memory q2 = quoteBody(id.pairId, M_A2);
        id.a2 = rid(QUOTE_J, q2);
        a = two(aPublish(QUOTE_J, q2), aBind(HEAD, id.subj, NO_ROLE, id.a2, 1));
        b = new bytes[](2);
        b[0] = q2;
        (Ledger.Intent memory i1, bytes memory s1) = signed(PK_A, ledger, 1, a);
        ledger.executeSigned(i1, a, b, s1);
        bytes memory q3 = quoteBody(id.pairId, M_B1);
        id.b1 = rid(QUOTE_J, q3);
        a = two(aPublish(QUOTE_J, q3), aBind(HEAD, id.subj, NO_ROLE, id.b1, 0));
        b[0] = q3;
        bob.execute(a, b);
        id.headPos = Keys.position(HEAD, id.subj, NO_ROLE);
        id.swapsPos = Keys.position(FOLDER, SWAPS, name("eth-usdc"));
        require(admissions() == 12, "twelve admissions after steps 1-4");
        (address au, uint8 kind,,,,,,,,,,,) = ledger.evidence(4);
        require(au == address(bob) && kind == 1, "B1 evidence: the contract is the author, native proof kind");
        (au, kind,,,,,,,,,,,) = ledger.evidence(3);
        require(au == eoaA && kind == 2, "A2 evidence: EOA author, signed proof kind");
    }

    function test_joined_steps_1_to_5_point_list_tag_history() public {
        Ids memory id = runSteps1to4();
        address[] memory ab = lensOf(eoaA, address(bob));
        address[] memory ba = lensOf(address(bob), eoaA);
        uint64 basis = admissions(); // 12
        bytes32 note = keccak256(NOTE_BYTES);
        (bytes32 c, bytes32 e) = joined.readPoint(ab, id.subj);
        require(c == keccak256(abi.encode(id.pairId, M_A2, SCALE, uint8(2), keccak256(abi.encode(ab)), basis)), "A-first selects QUOTE_A2, signed authorship");
        require(
            e == keccak256(abi.encode(id.itemA, id.itemB, OBSERVED_AT, note, eoaA, uint64(3), uint64(10), uint32(2), id.a2)),
            "A2 evidence: pair resolves to the two items; publication 3; admission 10; revision 2"
        );
        (c, e) = joined.readPoint(ba, id.subj);
        require(c == keccak256(abi.encode(id.pairId, M_B1, SCALE, uint8(1), keccak256(abi.encode(ba)), basis)), "B-first selects QUOTE_B1, native (contract) authorship");
        require(
            e == keccak256(abi.encode(id.itemA, id.itemB, OBSERVED_AT, note, address(bob), uint64(4), uint64(12), uint32(1), id.b1)),
            "B1 evidence: publication 4; admission 12; revision 1"
        );
        try joined.readPointNoTiebreak(ab, id.subj) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.Conflict.selector, "no-tiebreak: CONFLICT exposes no quote");
        }
        (uint8 cs, LensReader.Entry[] memory cands) = lens.resolveNoTiebreak(ab, HEAD, id.subj, NO_ROLE);
        require(cs == 3 && cands.length == 2, "both qualified candidates are returned");
        // the directory page under the same lens and basis agrees with the point read
        LensReader.Entry[] memory items = new LensReader.Entry[](1);
        items[0] = LensReader.Entry(id.swapsPos, eoaA, id.subj, 1, 7);
        (c,) = joined.readList(ab, SWAPS, 16);
        require(c == keccak256(abi.encode(keccak256(abi.encode(items)), uint64(1), keccak256(abi.encode(ab)), basis)), "/swaps lists FILE_QUOTE once");
        (c,) = joined.readList(ba, SWAPS, 16);
        require(c == keccak256(abi.encode(keccak256(abi.encode(items)), uint64(1), keccak256(abi.encode(ba)), basis)), "B-first lists the same placement (only A placed it)");
        // tag filtering after selection
        bytes32[] memory tagged = new bytes32[](1);
        tagged[0] = id.subj;
        (c,) = joined.readListTagged(ab, SWAPS, name("market"), 16);
        require(c == keccak256(abi.encode(keccak256(abi.encode(tagged)), uint256(1), name("market"), keccak256(abi.encode(ab)), basis)), "market tag keeps FILE_QUOTE");
        bytes32[] memory none = new bytes32[](0);
        (c,) = joined.readListTagged(ab, SWAPS, name("other"), 16);
        require(c == keccak256(abi.encode(keccak256(abi.encode(none)), uint256(0), name("other"), keccak256(abi.encode(ab)), basis)), "an unrelated tag filters everything out");
        // as-of history: a strictly OLDER basis returns A1; the latest returns A2
        (c, e) = joined.readHistoryAsOf(eoaA, HEAD, id.subj, NO_ROLE, 6);
        require(c == keccak256(abi.encode(true, id.a1, uint32(1), uint64(6), uint64(6), eoaA, basis)), "as of admission 6: QUOTE_A1 at revision 1");
        require(e == keccak256(abi.encode(id.pairId, M_A1, SCALE, id.itemA, id.itemB)), "the older revision is a well-formed quote");
        (c, e) = joined.readHistoryAsOf(eoaA, HEAD, id.subj, NO_ROLE, 9);
        require(c == keccak256(abi.encode(true, id.a1, uint32(1), uint64(6), uint64(9), eoaA, basis)), "as of admission 9 (A2 published, head not yet rebound): still A1");
        (c, e) = joined.readHistoryAsOf(eoaA, HEAD, id.subj, NO_ROLE, 1_000_000);
        require(c == keccak256(abi.encode(true, id.a2, uint32(2), uint64(10), uint64(1_000_000), eoaA, basis)), "latest: QUOTE_A2 at revision 2");
        require(e == keccak256(abi.encode(id.pairId, M_A2, SCALE, id.itemA, id.itemB)), "latest quote verified");
        (c,) = joined.readHistoryAsOf(address(bob), HEAD, id.subj, NO_ROLE, 1_000_000);
        require(c == keccak256(abi.encode(true, id.b1, uint32(1), uint64(12), uint64(1_000_000), address(bob), basis)), "B's own history: QUOTE_B1");
        try joined.readHistoryAsOf(eoaA, HEAD, id.subj, NO_ROLE, 5) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.HistoryUnavailable.selector, "before the first head: no fabricated revision");
        }
    }

    function test_joined_step_6_move_replace_remove_restore_keeps_identity() public {
        Ids memory id = runSteps1to4();
        address[] memory ab = lensOf(eoaA, address(bob));
        // 6a move: unbind /swaps rev 1, bind /markets rev 0                      -> admissions 13, 14 (nonce 2)
        Ledger.Action[] memory a = two(aUnbind(FOLDER, SWAPS, name("eth-usdc"), 1), aBind(FOLDER, MARKETS, name("eth-usdc"), id.subj, 0));
        bytes[] memory b = new bytes[](2);
        (Ledger.Intent memory i2, bytes memory s2) = signed(PK_A, ledger, 2, a);
        ledger.executeSigned(i2, a, b, s2);
        // 6b replacement: create G, publish, bind HEAD, bind /swaps rev 2 -> G     -> 15..18 (nonce 3)
        bytes32 g = subjectOf(eoaA, 2);
        bytes memory gBody = bytes("replacement");
        bytes32 rg = rid(BINARY, gBody);
        a = new Ledger.Action[](4);
        a[0] = aCreate(bytes32(uint256(2)));
        a[1] = aPublish(BINARY, gBody);
        a[2] = aBind(HEAD, g, NO_ROLE, rg, 0);
        a[3] = aBind(FOLDER, SWAPS, name("eth-usdc"), g, 2);
        b = new bytes[](4);
        b[1] = gBody;
        (Ledger.Intent memory i3, bytes memory s3) = signed(PK_A, ledger, 3, a);
        ledger.executeSigned(i3, a, b, s3);
        // 6c remove: unbind /markets rev 1                                        -> 19 (nonce 4)
        a = one(aUnbind(FOLDER, MARKETS, name("eth-usdc"), 1));
        b = new bytes[](1);
        (Ledger.Intent memory i4, bytes memory s4) = signed(PK_A, ledger, 4, a);
        ledger.executeSigned(i4, a, b, s4);
        // 6d restore: bind /markets rev 2 -> FILE_QUOTE                            -> 20 (nonce 5)
        a = one(aBind(FOLDER, MARKETS, name("eth-usdc"), id.subj, 2));
        (Ledger.Intent memory i5, bytes memory s5) = signed(PK_A, ledger, 5, a);
        ledger.executeSigned(i5, a, b, s5);
        require(admissions() == 20 && g != id.subj, "twenty admissions; distinct identities");
        uint64 basis = 20;
        bytes32 lid = keccak256(abi.encode(ab));
        (bytes32 c,) = joined.readPoint(ab, id.subj);
        require(c == keccak256(abi.encode(id.pairId, M_A2, SCALE, uint8(2), lid, basis)), "FILE_QUOTE still selects QUOTE_A2 under A-first");
        LensReader.Entry[] memory items = new LensReader.Entry[](1);
        items[0] = LensReader.Entry(Keys.position(FOLDER, MARKETS, name("eth-usdc")), eoaA, id.subj, 3, 20);
        (c,) = joined.readList(ab, MARKETS, 16);
        require(c == keccak256(abi.encode(keccak256(abi.encode(items)), uint64(1), lid, basis)), "/markets lists the restored FILE_QUOTE at revision 3");
        items[0] = LensReader.Entry(id.swapsPos, eoaA, g, 3, 18);
        (c,) = joined.readList(ab, SWAPS, 16);
        require(c == keccak256(abi.encode(keccak256(abi.encode(items)), uint64(1), lid, basis)), "/swaps lists only the replacement");
        bytes32[] memory tagged = new bytes32[](1);
        tagged[0] = id.subj;
        (c,) = joined.readListTagged(ab, MARKETS, name("market"), 16);
        require(c == keccak256(abi.encode(keccak256(abi.encode(tagged)), uint256(1), name("market"), lid, basis)), "the tag followed FILE_QUOTE to /markets");
        bytes32[] memory none = new bytes32[](0);
        (c,) = joined.readListTagged(ab, SWAPS, name("market"), 16);
        require(c == keccak256(abi.encode(keccak256(abi.encode(none)), uint256(0), name("market"), lid, basis)), "the replacement inherits no tag");
        (c,) = joined.readHistoryAsOf(eoaA, FOLDER, MARKETS, name("eth-usdc"), 19);
        require(c == keccak256(abi.encode(false, bytes32(0), uint32(2), uint64(19), uint64(19), eoaA, basis)), "the removal is retained as revision 2 of the /markets placement");
        (c,) = joined.readHistoryAsOf(eoaA, FOLDER, SWAPS, name("eth-usdc"), 13);
        require(c == keccak256(abi.encode(false, bytes32(0), uint32(2), uint64(13), uint64(13), eoaA, basis)), "the move is retained as a removal at /swaps");
        (c,) = joined.readHistoryAsOf(eoaA, HEAD, id.subj, NO_ROLE, 6);
        require(c == keccak256(abi.encode(true, id.a1, uint32(1), uint64(6), uint64(6), eoaA, basis)), "A1 history survives move, replacement, remove and restore");
        (uint8 st, bytes32 t,,,) = lens.resolve(ab, HEAD, g, NO_ROLE);
        require(st == 1 && t == rg, "the replacement has its own head and body");
        (st,,,,) = lens.resolve(ab, TAG, g, name("market"));
        require(st == 0, "no tag on the replacement");
        try joined.readPoint(ab, g) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.QuoteShape.selector, "the replacement is not a joined quote: refused, not decoded");
        }
    }

    function test_quote_acceptor_pins_shape_scale_bounds_and_pair_reference() public {
        Ids memory id;
        admitItemsAndPair(id);
        bytes32 note = keccak256(NOTE_BYTES);
        expectPublishFail(QUOTE_J, abi.encode(id.pairId, M_A1, uint8(7), OBSERVED_AT, note), Ledger.E_REJECTED.selector, "scale 7");
        expectPublishFail(QUOTE_J, abi.encode(id.pairId, uint256(0), SCALE, OBSERVED_AT, note), Ledger.E_REJECTED.selector, "zero mantissa");
        expectPublishFail(QUOTE_J, abi.encode(id.pairId, uint256(type(uint128).max) + 1, SCALE, OBSERVED_AT, note), Ledger.E_REJECTED.selector, "mantissa above the declared bound");
        expectPublishFail(QUOTE_J, abi.encode(id.pairId, M_A1, SCALE, uint64(0), note), Ledger.E_REJECTED.selector, "zero observation time");
        expectPublishFail(QUOTE_J, abi.encode(id.pairId, M_A1, SCALE, OBSERVED_AT, bytes32(0)), Ledger.E_REJECTED.selector, "zero note commitment");
        expectPublishFail(QUOTE_J, abi.encodePacked(id.pairId, M_A1, SCALE, OBSERVED_AT), Ledger.E_REJECTED.selector, "wrong length");
        bytes32 wrong = alice.publish(QUOTE, q(99));
        expectPublishFail(QUOTE_J, quoteBody(wrong, M_A1), Ledger.E_REF_TYPE.selector, "pair reference of the wrong Type (present record)");
        expectPublishFail(QUOTE_J, quoteBody(name("nowhere"), M_A1), Ledger.E_REF_MISSING.selector, "missing pair");
        bytes memory good = quoteBody(id.pairId, M_A1);
        require(alice.publish(QUOTE_J, good) == rid(QUOTE_J, good), "the well-formed quote is admitted");
        (,, uint32 occ,) = ledger.record(rid(QUOTE_J, good));
        require(occ == 1, "one occurrence");
    }

    function expectPublishFail(bytes32 typeId, bytes memory body, bytes4 expected, string memory label) internal {
        uint64 before = admissions();
        try alice.publish(typeId, body) {
            require(false, label);
        } catch (bytes memory err) {
            expectSel(err, expected, label);
        }
        require(admissions() == before, label);
    }

    function test_consumer_exposes_no_quote_on_absent_masked_wrong_type_or_unknown_page() public {
        address[] memory la = lensOf(address(alice));
        bytes32 s = alice.create(bytes32(uint256(5)));
        try joined.readPoint(la, s) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.NoSelection.selector, "absent head: no value");
        }
        bytes32 r = alice.publish(QUOTE, q(3000));
        alice.bind(HEAD, s, NO_ROLE, r, 0);
        try joined.readPoint(la, s) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.QuoteShape.selector, "a 32-byte QUOTE is not a joined quote");
        }
        alice.unbind(HEAD, s, NO_ROLE, 1);
        try joined.readPoint(la, s) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.NoSelection.selector, "masked head: no value");
        }
        ledger.setIndexModule(address(0));
        alice.publish(QUOTE, q(1)); // an admission the module never saw: coverage is PARTIAL from here on
        try joined.readList(la, DRAFTS, 16) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.PageNotComplete.selector, "an UNKNOWN page is refused, never an empty folder");
        }
        try joined.readHistoryAsOf(address(alice), HEAD, s, NO_ROLE, 1_000_000) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.HistoryUnavailable.selector, "history without complete coverage is UNKNOWN, not a value");
        }
    }

    // ------------------------------------------------------------------ the sealed paid point/list slice (sdk-fixture appendix)
    // Measurement-local fixtures ALONGSIDE the tests above (the shared setUp and runSteps1to4 are unchanged).
    // Ordinals from the sealed setUp: placement admission 7 / publication 2 (A1); A head rev 2 = admission 10 /
    // publication 3; B head rev 1 = admission 12 / publication 4; frontier 12 after steps 1-4.
    uint64 internal constant BASIS_POST_B1 = 12;
    uint64 internal constant PUB_A1 = 2;
    uint8 internal constant KIND_SIGNED = 2;
    uint8 internal constant KIND_NATIVE = 1;

    function expectFor(Ids memory id, bytes32 head, address author, uint8 proofKind, uint256 mantissa, uint64 basis)
        internal
        view
        returns (JoinedConsumer.Expect memory e)
    {
        uint32 expectedRevision = author == address(bob) ? 1 : 2;
        e = JoinedConsumer.Expect(
            id.subj,
            head,
            author,
            proofKind,
            id.pairId,
            id.itemA,
            id.itemB,
            mantissa,
            SCALE,
            OBSERVED_AT,
            keccak256(NOTE_BYTES),
            basis,
            expectedRevision
        );
    }

    function placementFor() internal view returns (JoinedConsumer.PlacementExpect memory p) {
        p = JoinedConsumer.PlacementExpect(SWAPS, name("eth-usdc"), eoaA, KIND_SIGNED, PUB_A1, 16);
    }

    function expectPointFail(address[] memory l, JoinedConsumer.Expect memory e, bytes4 expected, string memory label) internal {
        try joined.paidPoint(l, e) {
            require(false, label);
        } catch (bytes memory err) {
            expectSel(err, expected, label);
        }
    }

    function expectListFail(address[] memory l, JoinedConsumer.Expect memory e, JoinedConsumer.PlacementExpect memory p, bytes4 expected, string memory label)
        internal
    {
        try joined.paidList(l, e, p) {
            require(false, label);
        } catch (bytes memory err) {
            expectSel(err, expected, label);
        }
    }

    function checkSelection(JoinedConsumer.Selection memory s, Ids memory id, bytes32 head, uint32 rev, uint64 adm, uint64 pub, address author, uint8 kind, uint256 mantissa, string memory label)
        internal
        view
    {
        require(s.basisAdmission == BASIS_POST_B1 && s.rulesEpoch == registry.epoch() && s.indexGeneration == index.generation() && s.coreCodeCommitment == address(ledger).codehash, string.concat(label, ": basis fields"));
        require(s.subject == id.subj && s.selectedHead == head && s.selectedRevision == rev && s.selectedAdmission == adm && s.selectedPublication == pub, string.concat(label, ": selected head / revision / admission / publication"));
        require(s.selectedAuthor == author && s.selectedProofKind == kind, string.concat(label, ": selected author / proof category"));
        require(s.pairId == id.pairId && s.itemA == id.itemA && s.itemB == id.itemB && s.mantissa == mantissa && s.scale == SCALE && s.observedAt == OBSERVED_AT && s.note == keccak256(NOTE_BYTES), string.concat(label, ": closure fields"));
    }

    function checkPlacement(JoinedConsumer.Placement memory p, Ids memory id, string memory label) internal view {
        require(p.position == id.swapsPos && p.actor == eoaA && p.proofKind == KIND_SIGNED && p.revision == 1 && p.admission == 7 && p.publication == PUB_A1, string.concat(label, ": placement provenance (A1 effect)"));
        require(p.basisAdmission == BASIS_POST_B1 && p.pageStatus == 2 && p.rawTotal == 1 && p.scanned == 1 && p.selectedSoFar == 1 && !p.mutated && p.ended, string.concat(label, ": one complete, ended, unmixed window over one raw candidate"));
    }

    /// A-first half of the positive slice test (own frame: keeps the via-IR stack shallow). Returns the A-first
    /// list's placement observation for the cross-lens comparison.
    function assertAFirst(Ids memory id, JoinedConsumer.PlacementExpect memory p) internal returns (JoinedConsumer.Placement memory pL) {
        address[] memory ab = lensOf(eoaA, address(bob));
        JoinedConsumer.Expect memory eA = expectFor(id, id.a2, eoaA, KIND_SIGNED, M_A2, BASIS_POST_B1);
        // point and list select QUOTE_A2 (revision 2, signed by AUTHOR_A)
        (bytes32 cP, JoinedConsumer.Selection memory sP) = joined.paidPoint(ab, eA);
        checkSelection(sP, id, id.a2, 2, 10, 3, eoaA, KIND_SIGNED, M_A2, "A-first point");
        JoinedConsumer.Placement memory none;
        require(cP == keccak256(abi.encode(joined.KIND_PAID_POINT(), sP, none)), "A-first point commitment = keccak(kind, selection, zero placement)");
        bytes32 cL;
        JoinedConsumer.Selection memory sL;
        (cL, sL, pL) = joined.paidList(ab, eA, p);
        checkSelection(sL, id, id.a2, 2, 10, 3, eoaA, KIND_SIGNED, M_A2, "A-first list");
        require(keccak256(abi.encode(sP)) == keccak256(abi.encode(sL)), "A-first: point and list observe the identical selection");
        checkPlacement(pL, id, "A-first list");
        require(cL == keccak256(abi.encode(joined.KIND_PAID_LIST(), sL, pL)), "A-first list commitment");
    }

    /// B-first half: point and list select QUOTE_B1 (revision 1, contract-originated, no signature) while the
    /// placement provenance stays the A1 effect: placement actor != selected author, and that is correct.
    function assertBFirst(Ids memory id, JoinedConsumer.PlacementExpect memory p, JoinedConsumer.Placement memory pL) internal {
        address[] memory ba = lensOf(address(bob), eoaA);
        JoinedConsumer.Expect memory eB = expectFor(id, id.b1, address(bob), KIND_NATIVE, M_B1, BASIS_POST_B1);
        (, JoinedConsumer.Selection memory sPB) = joined.paidPoint(ba, eB);
        checkSelection(sPB, id, id.b1, 1, 12, 4, address(bob), KIND_NATIVE, M_B1, "B-first point");
        (, JoinedConsumer.Selection memory sLB, JoinedConsumer.Placement memory pLB) = joined.paidList(ba, eB, p);
        checkSelection(sLB, id, id.b1, 1, 12, 4, address(bob), KIND_NATIVE, M_B1, "B-first list");
        require(keccak256(abi.encode(sPB)) == keccak256(abi.encode(sLB)), "B-first: point and list observe the identical selection");
        checkPlacement(pLB, id, "B-first list");
        require(pLB.actor != sLB.selectedAuthor, "B-first: placement actor (AUTHOR_A) and selected author (AUTHOR_B) are different observations");
        require(pL.position == pLB.position && pL.actor == pLB.actor && pL.admission == pLB.admission && pL.publication == pLB.publication, "placement provenance does not change with the lens order (hydrations may)");
    }

    function test_paid_slice_point_and_list_agree_under_both_lenses_with_A_placement_provenance() public {
        Ids memory id = runSteps1to4();
        JoinedConsumer.PlacementExpect memory p = placementFor();
        JoinedConsumer.Placement memory pL = assertAFirst(id, p);
        assertBFirst(id, p, pL);
        (address au, uint8 kind, uint8 v,,, bytes32 r, bytes32 s,,,,,,) = ledger.evidence(4);
        require(au == address(bob) && kind == KIND_NATIVE && v == 0 && r == 0 && s == 0, "B1 evidence carries no signature: nothing fabricated");
    }

    function test_paid_slice_refuses_wrong_author_proof_category_pair_items_and_mantissa() public {
        Ids memory id = runSteps1to4();
        address[] memory ab = lensOf(eoaA, address(bob));
        address[] memory ba = lensOf(address(bob), eoaA);
        JoinedConsumer.PlacementExpect memory p = placementFor();
        // wrong selected author (the expectation names B under an A-first lens)
        expectPointFail(ab, expectFor(id, id.b1, address(bob),KIND_NATIVE, M_B1, BASIS_POST_B1), JoinedConsumer.SelectionMismatch.selector, "A-first point: expecting AUTHOR_B is refused");
        expectListFail(ab, expectFor(id, id.b1, address(bob),KIND_NATIVE, M_B1, BASIS_POST_B1), p, JoinedConsumer.SelectionMismatch.selector, "A-first list: a selection disagreeing with the point is refused");
        expectPointFail(ba, expectFor(id, id.a2, eoaA,KIND_SIGNED, M_A2, BASIS_POST_B1), JoinedConsumer.SelectionMismatch.selector, "B-first point: expecting AUTHOR_A is refused");
        // wrong expected head id for the right author (the retained older QUOTE_A1 / the competing QUOTE_B1 are not the selection)
        expectPointFail(ab, expectFor(id, id.a1, eoaA, KIND_SIGNED, M_A2, BASIS_POST_B1), JoinedConsumer.SelectionMismatch.selector, "A-first point: expecting the older head QUOTE_A1 is refused");
        expectListFail(ab, expectFor(id, id.b1, eoaA, KIND_SIGNED, M_A2, BASIS_POST_B1), p, JoinedConsumer.SelectionMismatch.selector, "A-first list: expecting B's head under A's authorship is refused");
        JoinedConsumer.Expect memory wrongRevision = expectFor(id, id.a2, eoaA, KIND_SIGNED, M_A2, BASIS_POST_B1);
        wrongRevision.expectedRevision = 1;
        expectPointFail(ab, wrongRevision, JoinedConsumer.RevisionMismatch.selector, "A-first: the sealed expected revision is exact, not inferred from the reply");
        // wrong proof category for the right author
        expectPointFail(ab, expectFor(id, id.a2, eoaA,KIND_NATIVE, M_A2, BASIS_POST_B1), JoinedConsumer.ProofCategory.selector, "A-first: AUTHOR_A is EOA-signed, not contract-originated");
        expectPointFail(ba, expectFor(id, id.b1, address(bob),KIND_SIGNED, M_B1, BASIS_POST_B1), JoinedConsumer.ProofCategory.selector, "B-first: AUTHOR_B is contract-originated, not EOA-signed");
        // wrong Pair, wrong ordered Items, wrong mantissa (a present, well-typed graph that is not the expected one)
        JoinedConsumer.Expect memory e = expectFor(id, id.a2, eoaA,KIND_SIGNED, M_A2, BASIS_POST_B1);
        e.pairId = name("other-pair");
        expectPointFail(ab, e, JoinedConsumer.ClosureMismatch.selector, "wrong Pair reference is refused");
        e = expectFor(id, id.a2, eoaA,KIND_SIGNED, M_A2, BASIS_POST_B1);
        e.itemA = id.itemB;
        e.itemB = id.itemA;
        expectPointFail(ab, e, JoinedConsumer.ClosureMismatch.selector, "swapped Item order is refused (references are ordered)");
        expectListFail(ab, e, p, JoinedConsumer.ClosureMismatch.selector, "the list runs the same closure and refuses the same graph");
        expectPointFail(ab, expectFor(id, id.a2, eoaA,KIND_SIGNED, M_A1, BASIS_POST_B1), JoinedConsumer.ClosureMismatch.selector, "the retained older mantissa is not the selected one");
        // wrong sealed observedAt / note commitment (compared on chain, not only returned)
        e = expectFor(id, id.a2, eoaA,KIND_SIGNED, M_A2, BASIS_POST_B1);
        e.observedAt = OBSERVED_AT + 1;
        expectPointFail(ab, e, JoinedConsumer.SelectionMismatch.selector, "a wrong observedAt is refused");
        e = expectFor(id, id.a2, eoaA,KIND_SIGNED, M_A2, BASIS_POST_B1);
        e.noteCommitment = name("another note");
        expectListFail(ab, e, p, JoinedConsumer.SelectionMismatch.selector, "a wrong note commitment is refused (the list runs the same field checks)");
        // a head that is not a joined quote at all (32-byte QUOTE): refused by shape before any field is exposed
        bytes32 other = alice.create(bytes32(uint256(9))); // admission 13
        bytes32 rq = alice.publish(QUOTE, q(3000)); // admission 14
        alice.bind(HEAD, other, NO_ROLE, rq, 0); // admission 15
        JoinedConsumer.Expect memory eo = expectFor(id, rq, address(alice), KIND_NATIVE, 3000, 15);
        eo.subject = other;
        eo.expectedRevision = 1;
        expectPointFail(lensOf(address(alice)), eo, JoinedConsumer.QuoteShape.selector, "a non-joined head is refused, not decoded");
    }

    function test_paid_slice_refuses_extra_placement_wrong_provenance_and_incomplete_coverage() public {
        Ids memory id = runSteps1to4();
        address[] memory ab = lensOf(eoaA, address(bob));
        address[] memory ba = lensOf(address(bob), eoaA);
        JoinedConsumer.Expect memory eA = expectFor(id, id.a2, eoaA,KIND_SIGNED, M_A2, BASIS_POST_B1);
        JoinedConsumer.Expect memory eB = expectFor(id, id.b1, address(bob),KIND_NATIVE, M_B1, BASIS_POST_B1);
        // wrong placement provenance: actor, proof category, source publication, name
        JoinedConsumer.PlacementExpect memory p = placementFor();
        p.actor = address(bob);
        expectListFail(ba, eB, p, JoinedConsumer.PlacementMismatch.selector, "the placement is AUTHOR_A's even when B-first wins content selection");
        p = placementFor();
        p.proofKind = KIND_NATIVE;
        expectListFail(ab, eA, p, JoinedConsumer.ProofCategory.selector, "the placement effect is EOA-signed, not contract-originated");
        p = placementFor();
        p.publication = 3;
        expectListFail(ab, eA, p, JoinedConsumer.PlacementMismatch.selector, "the placement is the A1 effect (publication 2), not A2's");
        p = placementFor();
        p.nameRole = name("eth-dai");
        expectListFail(ab, eA, p, JoinedConsumer.PlacementMismatch.selector, "a different entry name is refused");
        // a PARTIAL page (budget 0) is never an empty complete page
        p = placementFor();
        p.budget = 0;
        expectListFail(ab, eA, p, JoinedConsumer.PlacementWindow.selector, "PARTIAL is refused");
        // an extra (B) placement of the same name: the window holds two raw candidates -> refused under both lenses
        p = placementFor();
        bob.bind(FOLDER, SWAPS, name("eth-usdc"), id.subj, 0); // admission 13
        JoinedConsumer.Expect memory eA13 = expectFor(id, id.a2, eoaA, KIND_SIGNED, M_A2, 13);
        JoinedConsumer.Expect memory eB13 = expectFor(id, id.b1, address(bob), KIND_NATIVE, M_B1, 13);
        expectListFail(ab, eA13, p, JoinedConsumer.PlacementWindow.selector, "a second placement is refused (A-first)");
        expectListFail(ba, eB13, p, JoinedConsumer.PlacementWindow.selector, "a second placement is refused (B-first)");
        bob.unbind(FOLDER, SWAPS, name("eth-usdc"), 1); // admission 14: B's tombstone still counts as a raw candidate
        expectListFail(ab, expectFor(id, id.a2, eoaA, KIND_SIGNED, M_A2, 14), p, JoinedConsumer.PlacementWindow.selector, "a removed second placement is still a second raw candidate");
        // mixed bases: the frontier moved (14) while the expectation still says 12
        expectPointFail(ab, eA, JoinedConsumer.BasisMismatch.selector, "point: a moved admission frontier is a mixed basis");
        // the point does not need the directory: it still selects at the new basis after A's placement is removed
        alice.publish(QUOTE, q(5)); // admission 15
        (Ledger.Intent memory i2, bytes memory s2) = signed(PK_A, ledger, 2, one(aUnbind(FOLDER, SWAPS, name("eth-usdc"), 1)));
        ledger.executeSigned(i2, one(aUnbind(FOLDER, SWAPS, name("eth-usdc"), 1)), new bytes[](1), s2); // admission 16
        JoinedConsumer.Expect memory e16 = expectFor(id, id.a2, eoaA,KIND_SIGNED, M_A2, 16);
        (, JoinedConsumer.Selection memory s16) = joined.paidPoint(ab, e16);
        require(s16.selectedHead == id.a2 && s16.basisAdmission == 16, "point selection is independent of any placement");
        expectListFail(ab, e16, p, JoinedConsumer.PlacementWindow.selector, "list: no live placement row -> refused, never an empty complete page");
        // incomplete coverage: an admission the index never saw makes the page UNKNOWN -> refused
        ledger.setIndexModule(address(0));
        alice.publish(QUOTE, q(6)); // admission 17, not indexed
        expectListFail(ab, expectFor(id, id.a2, eoaA,KIND_SIGNED, M_A2, 17), p, JoinedConsumer.PlacementWindow.selector, "UNKNOWN coverage is refused, never reported complete");
    }

    // ------------------------------------------------------------------ corrupted / unavailable ACTUAL replies (test/FaultyReads.sol)
    // The `test_paid_slice_refuses_*` negatives above feed WRONG EXPECTATIONS to a consumer reading the real Ledger and
    // LensReader (one branch). The tests below keep the sealed expectations and corrupt the ACTUAL public-ABI replies
    // through `FaultyReads`, a forwarding reader deployed in place of the Ledger/LensReader (the other branch): the
    // consumer must refuse every one of them and never expose a value.
    function expectFaultyPointFail(Ids memory id, bytes4 expected, string memory label) internal {
        try faultyJoined.paidPoint(lensOf(eoaA, address(bob)), expectFor(id, id.a2, eoaA, KIND_SIGNED, M_A2, BASIS_POST_B1)) {
            require(false, label);
        } catch (bytes memory err) {
            expectSel(err, expected, label);
        }
    }

    function expectFaultyListFail(Ids memory id, bytes4 expected, string memory label) internal {
        try faultyJoined.paidList(
            lensOf(eoaA, address(bob)),
            expectFor(id, id.a2, eoaA, KIND_SIGNED, M_A2, BASIS_POST_B1),
            placementFor()
        ) {
            require(false, label);
        } catch (bytes memory err) {
            expectSel(err, expected, label);
        }
    }

    function test_faulty_actual_reply_wrong_selected_revision_is_refused() public {
        Ids memory id = runSteps1to4();
        faulty.fault(faulty.WRONG_SELECTED_REVISION(), bytes32(0));
        expectFaultyPointFail(id, bytes4(keccak256("RevisionMismatch(uint32,uint32)")), "the exact sealed A2 revision is required");
    }

    function test_faulty_actual_reply_zero_or_future_record_first_admission_is_refused_for_quote_pair_and_both_items() public {
        Ids memory id = runSteps1to4();
        bytes32[4] memory records = [id.a2, id.pairId, id.itemA, id.itemB];
        for (uint256 i; i < records.length; ++i) {
            faulty.fault(faulty.ZERO_RECORD_FIRST_ADMISSION(), records[i]);
            expectFaultyPointFail(id, bytes4(keccak256("RecordAdmissionBounds(bytes32,uint64,uint64)")), "a zero record firstAdmission is refused");
            faulty.fault(faulty.FUTURE_RECORD_FIRST_ADMISSION(), records[i]);
            expectFaultyPointFail(id, bytes4(keccak256("RecordAdmissionBounds(bytes32,uint64,uint64)")), "a record firstAdmission after the sealed basis is refused");
        }
    }

    function test_faulty_actual_reply_zero_or_future_selected_and_placement_admissions_are_refused() public {
        Ids memory id = runSteps1to4();
        faulty.fault(faulty.ZERO_SELECTED_ADMISSION(), bytes32(0));
        expectFaultyPointFail(id, bytes4(keccak256("AdmissionBounds(uint64,uint64)")), "a zero selected admission is refused");
        faulty.fault(faulty.FUTURE_SELECTED_ADMISSION(), bytes32(0));
        expectFaultyPointFail(id, bytes4(keccak256("AdmissionBounds(uint64,uint64)")), "a selected admission after the sealed basis is refused");
        faulty.fault(faulty.ZERO_PLACEMENT_ADMISSION(), bytes32(0));
        expectFaultyListFail(id, bytes4(keccak256("AdmissionBounds(uint64,uint64)")), "a zero placement admission is refused");
        faulty.fault(faulty.FUTURE_PLACEMENT_ADMISSION(), bytes32(0));
        expectFaultyListFail(id, bytes4(keccak256("AdmissionBounds(uint64,uint64)")), "a placement admission after the sealed basis is refused");
    }

    function test_faulty_actual_reply_same_author_and_target_at_wrong_head_or_folder_coordinate_is_refused() public {
        Ids memory id = runSteps1to4();
        faulty.fault(faulty.WRONG_BINDING_POSITION(), id.swapsPos);
        expectFaultyPointFail(id, bytes4(keccak256("AdmissionCoordinate(uint64,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32)")), "selected evidence at the FOLDER coordinate cannot prove the HEAD coordinate");
        faulty.fault(faulty.WRONG_BINDING_POSITION(), id.headPos);
        expectFaultyListFail(id, bytes4(keccak256("AdmissionCoordinate(uint64,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32)")), "placement evidence at the HEAD coordinate cannot prove the FOLDER coordinate");
    }

    function test_faulty_actual_reply_mismatched_or_wrapping_admission_revision_is_refused() public {
        Ids memory id = runSteps1to4();
        faulty.fault(faulty.WRONG_ADMISSION_REVISION(), bytes32(0));
        expectFaultyPointFail(id, bytes4(keccak256("AdmissionRevision(uint64,uint32,uint32)")), "selected admission CAS revision must precede the selected revision");
        expectFaultyListFail(id, bytes4(keccak256("AdmissionRevision(uint64,uint32,uint32)")), "placement admission CAS revision must precede the placement revision");
        faulty.fault(faulty.MAX_ADMISSION_REVISION(), bytes32(0));
        JoinedConsumer.Expect memory zeroRevision = expectFor(id, id.a2, eoaA, KIND_SIGNED, M_A2, BASIS_POST_B1);
        zeroRevision.expectedRevision = 0;
        try faultyJoined.paidPoint(lensOf(eoaA, address(bob)), zeroRevision) {
            require(false, "uint32 max admission expectedRevision wrapped into selected revision zero");
        } catch (bytes memory err) {
            expectSel(err, bytes4(keccak256("AdmissionRevision(uint64,uint32,uint32)")), "uint32 max admission expectedRevision cannot wrap into selected revision zero");
        }
        expectFaultyListFail(id, bytes4(keccak256("AdmissionRevision(uint64,uint32,uint32)")), "uint32 max admission expectedRevision cannot wrap into placement revision zero");
    }

    function test_faulty_actual_reply_imported_signed_and_native_publications_are_refused_as_local_fixture_evidence() public {
        Ids memory id = runSteps1to4();
        faulty.fault(faulty.IMPORTED_PUBLICATION(), bytes32(0));
        expectFaultyPointFail(id, bytes4(keccak256("ImportedPublication(uint64)")), "A-first signed fixture evidence must be non-imported");
        expectFaultyListFail(id, bytes4(keccak256("ImportedPublication(uint64)")), "the A1 signed placement effect must also be non-imported");
        try faultyJoined.paidPoint(
            lensOf(address(bob), eoaA), expectFor(id, id.b1, address(bob), KIND_NATIVE, M_B1, BASIS_POST_B1)
        ) {
            require(false, "B-first imported publication accepted");
        } catch (bytes memory err) {
            expectSel(err, bytes4(keccak256("ImportedPublication(uint64)")), "B-first native fixture evidence must be non-imported");
        }
    }

    function test_faulty_actual_reply_cursor_generation_epoch_core_scope_and_packed_lens_context_are_refused() public {
        Ids memory id = runSteps1to4();
        uint8[5] memory modes = [
            faulty.CURSOR_GENERATION_MISMATCH(), faulty.CURSOR_EPOCH_MISMATCH(), faulty.CURSOR_CORE_MISMATCH(),
            faulty.CURSOR_SCOPE_MISMATCH(), faulty.CURSOR_LENS_MISMATCH()
        ];
        for (uint256 i; i < modes.length; ++i) {
            faulty.fault(modes[i], bytes32(0));
            expectFaultyListFail(id, bytes4(keccak256("CursorContext(uint8,bytes32,bytes32)")), "list cursor context mismatch is refused");
        }
    }

    function test_faulty_actual_reply_missing_pair_is_refused() public {
        Ids memory id = runSteps1to4();
        (, JoinedConsumer.Selection memory s) = faultyJoined.paidPoint(lensOf(eoaA, address(bob)), expectFor(id, id.a2, eoaA, KIND_SIGNED, M_A2, BASIS_POST_B1));
        require(s.selectedHead == id.a2 && s.pairId == id.pairId, "control: the forwarding reader is faithful with no fault armed");
        faulty.fault(faulty.MISSING_PAIR(), id.pairId);
        expectFaultyPointFail(id, JoinedConsumer.RecordAdmissionBounds.selector, "an absent Pair record (zero Type, zero admission, empty body) is refused before decoding");
    }

    function test_faulty_actual_reply_wrong_type_item_is_refused() public {
        Ids memory id = runSteps1to4();
        faulty.fault(faulty.WRONG_TYPE_ITEM(), id.itemB);
        expectFaultyPointFail(id, JoinedConsumer.ItemShape.selector, "an Item record of a foreign Type is refused");
    }

    function test_faulty_actual_reply_admission_not_a_bind_is_refused() public {
        Ids memory id = runSteps1to4();
        faulty.fault(faulty.ADMISSION_NOT_BIND(), bytes32(0));
        expectFaultyPointFail(id, JoinedConsumer.AdmissionShape.selector, "a head admission that is not a live BIND of the target is refused");
    }

    function test_faulty_actual_reply_admission_outside_its_publication_range_is_refused() public {
        Ids memory id = runSteps1to4();
        faulty.fault(faulty.ADMISSION_OUT_OF_RANGE(), bytes32(0));
        expectFaultyPointFail(id, JoinedConsumer.EvidenceBounds.selector, "an admission outside its publication's admission range is refused");
    }

    function test_faulty_actual_reply_short_evidence_fails_closed() public {
        Ids memory id = runSteps1to4();
        faulty.fault(faulty.SHORT_EVIDENCE(), bytes32(0));
        try faultyJoined.paidPoint(lensOf(eoaA, address(bob)), expectFor(id, id.a2, eoaA, KIND_SIGNED, M_A2, BASIS_POST_B1)) {
            require(false, "a one-word evidence reply must not decode into an author and proof kind");
        } catch (bytes memory err) {
            require(err.length == 0, "a short evidence reply fails the consumer's ABI decoding: empty revert, no value exposed");
        }
    }

    function test_faulty_actual_reply_partial_page_claiming_ended_is_refused() public {
        Ids memory id = runSteps1to4();
        faulty.fault(faulty.PARTIAL_CLAIMS_ENDED(), bytes32(0));
        try faultyJoined.paidList(lensOf(eoaA, address(bob)), expectFor(id, id.a2, eoaA, KIND_SIGNED, M_A2, BASIS_POST_B1), placementFor()) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.PlacementWindow.selector, "a PARTIAL page is refused even when its cursor claims every list was exhausted");
        }
    }

    function test_stateless_twin_commits_exactly_what_the_storing_consumer_stores() public {
        bytes32 subj = subjectOf(address(alice), 1);
        bytes32 r1 = rid(QUOTE, q(3000));
        bytes32 r2 = rid(QUOTE, q(3100));
        Ledger.Action[] memory a = new Ledger.Action[](4);
        a[0] = aCreate(bytes32(uint256(1)));
        a[1] = aPublish(QUOTE, q(3000));
        a[2] = aBind(HEAD, subj, NO_ROLE, r1, 0);
        a[3] = aBind(FOLDER, SWAPS, name("eth-usdc"), subj, 0);
        bytes[] memory b = new bytes[](4);
        b[1] = q(3000);
        alice.execute(a, b);
        a = two(aPublish(QUOTE, q(3100)), aBind(HEAD, subj, NO_ROLE, r2, 1));
        b = new bytes[](2);
        b[0] = q(3100);
        alice.execute(a, b);
        address[] memory la = lensOf(address(alice));
        consumer.readQuote(la, HEAD, subj, NO_ROLE);
        bytes32 c = stateless.commitQuote(la, HEAD, subj, NO_ROLE);
        require(c == keccak256(abi.encode(consumer.lastStatus(), consumer.lastTarget(), consumer.lastRevision(), consumer.lastAdmission(), consumer.lastValue())), "quote twin");
        require(c == keccak256(abi.encode(uint8(1), r2, uint32(2), uint64(6), uint256(3100))), "quote twin expected values");
        consumer.readList(la, FOLDER, SWAPS, 16);
        c = stateless.commitList(la, FOLDER, SWAPS, 16);
        require(c == keccak256(abi.encode(consumer.lastStatus(), consumer.lastCount(), consumer.lastScanned())), "list twin");
        require(c == keccak256(abi.encode(uint8(2), uint64(1), uint64(1))), "list twin expected values");
        bytes32 pos = Keys.position(HEAD, subj, NO_ROLE);
        consumer.readHistory(address(alice), pos, 3);
        c = stateless.commitHistory(address(alice), pos, 3);
        require(c == keccak256(abi.encode(consumer.lastStatus(), consumer.lastTarget(), consumer.lastRevision(), consumer.lastAdmission())), "history twin (older basis)");
        require(c == keccak256(abi.encode(uint8(1), r1, uint32(1), uint64(3))), "a strictly older as-of basis returns the first head, not the latest");
        consumer.readHistory(address(alice), pos, 1_000_000);
        c = stateless.commitHistory(address(alice), pos, 1_000_000);
        require(c == keccak256(abi.encode(uint8(1), r2, uint32(2), uint64(6))), "latest as-of basis returns the rebound head");
        consumer.readHead(la, FOLDER, SWAPS, name("eth-usdc"));
        c = stateless.commitHead(la, FOLDER, SWAPS, name("eth-usdc"));
        require(c == keccak256(abi.encode(consumer.lastStatus(), consumer.lastTarget(), consumer.lastRevision(), consumer.lastAdmission())), "head twin");
        require(c == keccak256(abi.encode(uint8(1), subj, uint32(1), uint64(4))), "head twin expected values");
    }
}
