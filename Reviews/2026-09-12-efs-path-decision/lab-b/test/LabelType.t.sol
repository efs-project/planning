// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {LabelAcceptor} from "../src/LabAcceptors.sol";
import {JoinedConsumer, ILedgerReads, ILensReads} from "../src/JoinedConsumer.sol";
import {LabBase} from "./LabBase.sol";

/// DISPOSABLE LAB, NO PROTOCOL CLAIM. UNRUN (written under another worker's compiler lease).
/// The label-retention probe exactly as road-b-review ("Label-retention review — September 13")
/// scopes it: Ledger unchanged; one fixed lab Label Type registered in common setup; hash-only
/// create versus the same batch plus a Label PUBLISH of exact ASCII "entry"; fresh, existing
/// republished, existing omitted; paid retrieval with a hash check. A client-convention
/// filename-retention baseline, NOT mandatory Files semantics.
contract LabelTypeTest is LabBase {
    bytes32 internal constant LABEL_SHAPE = keccak256("lab/type/label/1");
    bytes32 internal constant QUOTE_J_SHAPE = keccak256("lab/type/quote-joined/1");
    bytes32 internal LABEL; // exact id, derived by the registry (REPAIR.md R2)

    LabelAcceptor internal labelAcceptor;
    JoinedConsumer internal joined;

    function setUp() public override {
        super.setUp();
        labelAcceptor = new LabelAcceptor();
        LABEL = registry.register(LABEL_SHAPE, address(labelAcceptor), new bytes32[](0));
        // QUOTE_J is not registered in this probe; the consumer's quote Type is never read here,
        // so the shape commitment stands in for the (unregistered) id.
        joined = new JoinedConsumer(ILedgerReads(address(ledger)), ILensReads(address(lens)), QUOTE_J_SHAPE, PAIR, ITEM, LABEL);
    }

    function ok(bytes memory s) internal view returns (bool) {
        return labelAcceptor.check(s);
    }

    function fill(uint256 n, bytes1 b) internal pure returns (bytes memory out) {
        out = new bytes(n);
        for (uint256 i; i < n; ++i) {
            out[i] = b;
        }
    }

    function test_label_acceptor_is_a_lab_convention_utf8_1_to_255() public view {
        require(ok("entry"), "ascii");
        require(ok("eth-usdc"), "ascii with punctuation");
        require(!ok(""), "empty");
        require(ok(fill(255, "a")), "255 bytes");
        require(!ok(fill(256, "a")), "256 bytes");
        require(ok(hex"c3a9"), "2-byte e-acute");
        require(ok(hex"e282ac"), "3-byte euro sign");
        require(ok(hex"f09f9880"), "4-byte emoji");
        require(ok(hex"656e74727965"), "mixed ascii");
        require(!ok(hex"ff"), "invalid lead byte");
        require(!ok(hex"80"), "stray continuation");
        require(!ok(hex"c0af"), "overlong 2-byte");
        require(!ok(hex"e080af"), "overlong 3-byte");
        require(!ok(hex"f0808080"), "overlong 4-byte");
        require(!ok(hex"eda080"), "surrogate");
        require(!ok(hex"f4908080"), "above U+10FFFF");
        require(!ok(hex"e282"), "truncated 3-byte");
        require(!ok(hex"c3"), "truncated 2-byte");
        require(!ok(hex"e2822c"), "bad continuation");
        bytes32[] memory refs = new bytes32[](1);
        refs[0] = bytes32(uint256(1));
        require(!labelAcceptor.accept(LABEL, "entry", refs), "labels carry no references");
    }

    function test_label_admission_rejects_non_utf8_empty_and_over_255() public {
        expectPublishFail(hex"ff", "non-UTF-8 is refused at admission");
        expectPublishFail("", "an empty label is refused at admission");
        expectPublishFail(fill(256, "a"), "256 bytes are refused at admission");
        bytes memory entry = bytes("entry");
        require(alice.publish(LABEL, entry) == rid(LABEL, entry), "exact ASCII entry is admitted");
    }

    function expectPublishFail(bytes memory body, string memory label) internal {
        uint64 before = admissions();
        try alice.publish(LABEL, body) {
            require(false, label);
        } catch (bytes memory err) {
            expectSel(err, Ledger.E_REJECTED.selector, label);
        }
        require(admissions() == before, label);
    }

    /// Admission ordinals (sealed setUp, admissions == 0):
    ///   hash-only create:                 1 create F0, 2 publish quote, 3 HEAD, 4 FOLDER /drafts "note"
    ///   create + label fresh:             5 create F1, 6 publish quote, 7 HEAD, 8 FOLDER /drafts "entry", 9 PUBLISH LABEL "entry"
    ///   create + label republished (bob): 10 create F2, 11 publish quote (occurrence), 12 HEAD, 13 FOLDER /published "entry", 14 PUBLISH LABEL (occurrence)
    ///   create + label omitted:           15 create F3, 16 FOLDER /swaps "entry"
    ///   withdraw alice's label occurrence: 17
    function test_label_fresh_republished_omitted_and_hash_only_retrieval() public {
        bytes memory entry = bytes("entry");
        bytes32 role = keccak256(entry);
        require(role == name("entry"), "placement role == keccak256(label bytes): self-certifying");
        bytes32 labelId = rid(LABEL, entry);
        // hash-only create (today's create): the name is a hash; a cold reader cannot print it
        bytes32 f0 = alice.create(bytes32(uint256(1)));
        bytes32 r0 = alice.publish(QUOTE, q(3000));
        alice.bind(HEAD, f0, NO_ROLE, r0, 0);
        alice.bind(FOLDER, DRAFTS, name("note"), f0, 0);
        bytes32 posNote = Keys.position(FOLDER, DRAFTS, name("note"));
        try joined.readLabel(posNote, rid(LABEL, bytes("note"))) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.LabelUnavailable.selector, "hash-only: LABEL_UNAVAILABLE, never an empty name");
        }
        (bytes32 t0,,,) = ledger.record(labelId);
        require(t0 == bytes32(0), "pre-absence of the label Record");
        // create + label fresh: the same batch plus one LABEL PUBLISH (one Record, one occurrence)
        bytes32 f1 = subjectOf(address(alice), 2);
        bytes32 r1 = rid(QUOTE, q(3100));
        Ledger.Action[] memory a = new Ledger.Action[](5);
        a[0] = aCreate(bytes32(uint256(2)));
        a[1] = aPublish(QUOTE, q(3100));
        a[2] = aBind(HEAD, f1, NO_ROLE, r1, 0);
        a[3] = aBind(FOLDER, DRAFTS, role, f1, 0);
        a[4] = aPublish(LABEL, entry);
        bytes[] memory b = new bytes[](5);
        b[1] = q(3100);
        b[4] = entry;
        alice.execute(a, b);
        bytes32 pos1 = Keys.position(FOLDER, DRAFTS, role);
        (bytes32 purpose, bytes32 folderId, bytes32 cellRole) = ledger.positionCell(pos1);
        require(purpose == FOLDER && folderId == DRAFTS && cellRole == role, "a cold reader derives the role from the position cell");
        (bytes32 t1, uint64 first1, uint32 occ1, bytes memory data1) = ledger.record(Keys.recordFromHash(LABEL, cellRole));
        require(t1 == LABEL && first1 == 9 && occ1 == 1 && data1.length == 5 && keccak256(data1) == role, "exact bytes, self-certifying, direct lookup (no by-Type scan)");
        (bytes32 c, bytes32 e) = joined.readLabel(pos1, labelId);
        require(c == keccak256(abi.encode(pos1, role, entry)), "paid retrieval commits to position, role and exact bytes");
        require(e == keccak256(abi.encode(DRAFTS, labelId, uint64(9), uint32(1), uint256(5))), "retrieval evidence");
        // existing label republished by ANOTHER author: the same Record, a second occurrence, bob's own admission
        bytes32 f2 = subjectOf(address(bob), 3);
        a[0] = aCreate(bytes32(uint256(3)));
        a[2] = aBind(HEAD, f2, NO_ROLE, r1, 0);
        a[3] = aBind(FOLDER, PUBLISHED, role, f2, 0);
        bob.execute(a, b);
        (,, uint32 occ2,) = ledger.record(labelId);
        require(occ2 == 2, "republished: a new occurrence and admission, no new Record");
        (,, uint64 pub14,,,,,) = ledger.admission(14);
        (address au14,,,,,,,,,,,,) = ledger.evidence(pub14);
        require(au14 == address(bob), "bob's republication is bob's own evidence, not alice's");
        bytes32 pos2 = Keys.position(FOLDER, PUBLISHED, role);
        (c, e) = joined.readLabel(pos2, labelId);
        require(c == keccak256(abi.encode(pos2, role, entry)), "retrievable from the second placement");
        require(e == keccak256(abi.encode(PUBLISHED, labelId, uint64(9), uint32(2), uint256(5))), "same Record, first admission unchanged, two occurrences");
        // existing label omitted: the client relies on the retained Record (reuse-by-existence)
        bytes32 f3 = alice.create(bytes32(uint256(4)));
        alice.bind(FOLDER, SWAPS, role, f3, 0);
        bytes32 pos3 = Keys.position(FOLDER, SWAPS, role);
        (,, uint32 occ3,) = ledger.record(labelId);
        require(occ3 == 2, "omitted: no new occurrence, nothing asserted by this author");
        (c,) = joined.readLabel(pos3, labelId);
        require(c == keccak256(abi.encode(pos3, role, entry)), unicode"retrievable by existence — retained bytes, not this author's acceptance");
        // occurrence withdrawal does not erase the retained Record
        Ledger.Action[] memory w = one(aWithdraw(9));
        bytes[] memory wb = new bytes[](1);
        alice.execute(w, wb);
        (,, uint32 occ4,) = ledger.record(labelId);
        require(occ4 == 1, "alice's occurrence withdrawn");
        (c,) = joined.readLabel(pos1, labelId);
        require(c == keccak256(abi.encode(pos1, role, entry)), "the bytes remain readable after the withdrawal");
        // explicit display-label mapping: HEAD positions carry no label
        try joined.readLabel(Keys.position(HEAD, f1, NO_ROLE), labelId) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.LabelUnavailable.selector, "HEAD bodies stay empty: no display label at a HEAD position");
        }
        // a placement whose role has no retained preimage stays unavailable even though other labels exist
        try joined.readLabel(posNote, rid(LABEL, bytes("note"))) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.LabelUnavailable.selector, "an unrelated retained label does not name this placement");
        }
        // the supplied record id cannot substitute bytes: a retained LABEL whose bytes do not hash to this role is refused
        try joined.readLabel(posNote, labelId) {
            require(false, "x");
        } catch (bytes memory err) {
            expectSel(err, JoinedConsumer.LabelIntegrity.selector, "a wrong label id fails the self-certification, never renames the placement");
        }
    }
}
