// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {QuoteAcceptor, LabelAcceptor} from "../src/LabAcceptors.sol";
import {JoinedConsumer, StatelessConsumer} from "../src/JoinedConsumer.sol";
import {LabBase} from "./LabBase.sol";

/// DISPOSABLE LAB, NO PROTOCOL CLAIM. UNRUN (written under another worker's compiler lease).
/// sdk-fixture steps 1–6 with the exact fixture values, read through the stateless test-only
/// measurement consumer; the stateless twin of the storing Consumer; the joined acceptor.
contract JoinedConsumerTest is LabBase {
    bytes32 internal constant QUOTE_J = keccak256("lab/type/quote-joined/1");
    bytes32 internal constant LABEL = keccak256("lab/type/label/1");
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
        registry.register(QUOTE_J, address(quoteAcceptor), pairRef);
        registry.register(LABEL, address(labelAcceptor), new bytes32[](0));
        joined = new JoinedConsumer(ledger, lens, QUOTE_J, PAIR, ITEM, LABEL);
        stateless = new StatelessConsumer(lens);
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
