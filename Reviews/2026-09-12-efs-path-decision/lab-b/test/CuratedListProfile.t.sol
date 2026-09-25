// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabBase} from "./LabBase.sol";
import {CuratedListProfile, CuratedEntryRule, CuratedSnapshotRule} from "./CuratedListProfile.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";

/// Disposable ordinary-Type application profile, not a proposed Core LIST noun.
contract CuratedListProfileTest is LabBase {
    event log_named_uint(string key, uint256 value);
    bytes32 internal constant LIST_HEAD = keccak256("lab/curated-list/head/1");
    bytes32 internal constant ENTRY_SHAPE = keccak256("lab/curated-list/entry/1");
    bytes32 internal constant SNAPSHOT_SHAPE = keccak256("lab/curated-list/snapshot/1");
    bytes32 internal entryType;
    bytes32 internal snapshotType;
    CuratedListProfile internal profile;
    mapping(bytes32 => bytes32) internal editionSalts;

    function setUp() public override {
        super.setUp();
        bytes32[] memory targetRef = new bytes32[](1);
        targetRef[0] = BINARY;
        CuratedEntryRule entryRule = new CuratedEntryRule(ledger, eoaA);
        entryType = registry.register(ENTRY_SHAPE, address(entryRule), targetRef);
        CuratedSnapshotRule rule = new CuratedSnapshotRule(ledger, eoaA, entryType);
        snapshotType = registry.register(SNAPSHOT_SHAPE, address(rule), new bytes32[](0));
        registry.setBindingRefType(LIST_HEAD, bytes32(0), snapshotType);
        profile = new CuratedListProfile(ledger, eoaA, entryType, snapshotType, LIST_HEAD);
    }

    function _signed(uint256 key, Ledger.Action[] memory actions, bytes[] memory bodies) internal returns (uint64 publication) {
        (Ledger.Intent memory intent, bytes memory sig) = signed(key, ledger, ledger.nonces(vm.addr(key)), actions);
        (publication,) = ledger.executeSigned(intent, actions, bodies, sig);
    }

    function _entry(bytes32 target, bytes32 edition, bytes32 id, bytes32 salt, string memory label)
        internal view returns (bytes memory) {
        return abi.encode(target, edition, id, salt, editionSalts[edition], label);
    }

    function _snapshot(bytes32 edition, CuratedListProfile.EntryRef[] memory refs) internal view returns (bytes memory) {
        return abi.encode(edition, editionSalts[edition], refs);
    }

    function _refs(bytes32 id1, bytes32 record1, bytes32 id2, bytes32 record2)
        internal pure returns (CuratedListProfile.EntryRef[] memory refs) {
        refs = new CuratedListProfile.EntryRef[](2);
        refs[0] = CuratedListProfile.EntryRef(id1, record1);
        refs[1] = CuratedListProfile.EntryRef(id2, record2);
    }

    function _createEdition(bytes32 salt) internal returns (bytes32 edition) {
        edition = Keys.subject(pid(eoaA), salt);
        editionSalts[edition] = salt;
        _signed(PK_A, one(aCreate(salt)), new bytes[](1));
    }

    function _setSnapshot(bytes32 edition, CuratedListProfile.EntryRef[] memory refs, uint32 expectedRevision)
        internal returns (bytes32 snapshot, uint64 publication) {
        bytes memory body = _snapshot(edition, refs);
        snapshot = rid(snapshotType, body);
        Ledger.Action[] memory actions = two(aPublish(snapshotType, body), aBind(LIST_HEAD, edition, bytes32(0), snapshot, expectedRevision));
        bytes[] memory bodies = new bytes[](2);
        bodies[0] = body;
        publication = _signed(PK_A, actions, bodies);
    }

    function _addEntry(bytes32 edition, bytes32 salt, bytes32 target, string memory label)
        internal returns (CuratedListProfile.EntryRef memory ref) {
        bytes32 id = Keys.subject(pid(eoaA), salt);
        bytes memory body = _entry(target, edition, id, salt, label);
        ref = CuratedListProfile.EntryRef(id, rid(entryType, body));
        Ledger.Action[] memory actions = two(aCreate(salt), aPublish(entryType, body));
        bytes[] memory bodies = new bytes[](2);
        bodies[1] = body;
        _signed(PK_A, actions, bodies);
    }

    function test_add_reorder_remove_and_page_two_independent_editions() public {
        bytes32 targetA = ledger.publish(BINARY, bytes("song A"));
        bytes32 targetB = ledger.publish(BINARY, bytes("song B"));
        bytes32 firstEdition = _createEdition(bytes32("friends"));
        bytes32 secondEdition = _createEdition(bytes32("music"));
        CuratedListProfile.EntryRef memory a = _addEntry(firstEdition, bytes32("alice"), targetA, "Alice");
        CuratedListProfile.EntryRef memory b = _addEntry(firstEdition, bytes32("bob"), targetB, "");
        CuratedListProfile.EntryRef[] memory first = _refs(a.id, a.recordId, b.id, b.recordId);
        (bytes32 snapshot1,) = _setSnapshot(firstEdition, first, 0);
        (CuratedListProfile.Entry[] memory page, uint256 next, uint256 total) = profile.readPage(firstEdition, snapshot1, 0, 1);
        require(total == 2 && next == 1 && page.length == 1, "first page bounded and complete");
        require(page[0].id == a.id && page[0].target == targetA && keccak256(bytes(page[0].label)) == keccak256("Alice"), "first member");
        (page, next, total) = profile.readPage(firstEdition, snapshot1, next, 1);
        require(total == 2 && next == 0 && page.length == 1 && page[0].id == b.id && page[0].target == targetB
            && bytes(page[0].label).length == 0, "optional label and last page");

        CuratedListProfile.EntryRef[] memory reversed = _refs(b.id, b.recordId, a.id, a.recordId);
        (bytes32 snapshot2,) = _setSnapshot(firstEdition, reversed, 1);
        (page,,) = profile.readPage(firstEdition, snapshot2, 0, 2);
        require(page[0].id == b.id && page[1].id == a.id, "reorder preserves stable entry ids");
        CuratedListProfile.EntryRef[] memory oneLeft = new CuratedListProfile.EntryRef[](1);
        oneLeft[0] = a;
        (bytes32 snapshot3,) = _setSnapshot(firstEdition, oneLeft, 2);
        (page, next, total) = profile.readPage(firstEdition, snapshot3, 0, 2);
        require(total == 1 && next == 0 && page[0].id == a.id, "remove changes membership");

        CuratedListProfile.EntryRef memory c = _addEntry(secondEdition, bytes32("charlie"), targetB, "other edition");
        CuratedListProfile.EntryRef[] memory other = new CuratedListProfile.EntryRef[](1);
        other[0] = c;
        (bytes32 secondSnapshot,) = _setSnapshot(secondEdition, other, 0);
        (page,,total) = profile.readPage(secondEdition, secondSnapshot, 0, 2);
        require(total == 1 && page[0].id == c.id, "second edition independent");
        (page,,total) = profile.readPage(firstEdition, snapshot3, 0, 2);
        require(total == 1 && page[0].id == a.id, "first edition unchanged");
    }

    function test_stale_reorder_cas_and_page_token_refusal() public {
        bytes32 target = ledger.publish(BINARY, bytes("song"));
        bytes32 edition = _createEdition(bytes32("edition"));
        CuratedListProfile.EntryRef memory a = _addEntry(edition, bytes32("entry"), target, "entry");
        CuratedListProfile.EntryRef[] memory refs = new CuratedListProfile.EntryRef[](1);
        refs[0] = a;
        (bytes32 oldSnapshot,) = _setSnapshot(edition, refs, 0);
        profile.readPage(edition, oldSnapshot, 0, 1);
        CuratedListProfile.EntryRef[] memory empty = new CuratedListProfile.EntryRef[](0);
        (bytes32 newSnapshot,) = _setSnapshot(edition, empty, 1);
        require(newSnapshot != oldSnapshot, "new edition revision");
        try profile.readPage(edition, oldSnapshot, 0, 1) { revert("stale page accepted"); }
        catch (bytes memory err) { expectSel(err, CuratedListProfile.E_STALE.selector, "page token must pin current HEAD"); }
        bytes memory staleBody = _snapshot(edition, refs);
        Ledger.Action[] memory actions = two(aPublish(snapshotType, staleBody), aBind(LIST_HEAD, edition, bytes32(0), oldSnapshot, 1));
        bytes[] memory bodies = new bytes[](2); bodies[0] = staleBody;
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, ledger.nonces(eoaA), actions);
        try ledger.executeSigned(intent, actions, bodies, sig) { revert("stale reorder accepted"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_CAS.selector, "signed stale reorder CAS"); }
        (uint8 state, uint32 revision, bytes32 targetAfter) = headOf(eoaA, LIST_HEAD, edition, bytes32(0));
        require(state == 1 && revision == 2 && targetAfter == newSnapshot, "stale write has no effects");
    }

    function test_foreign_author_binding_and_wrong_type_cannot_be_read_as_curated_membership() public {
        bytes32 edition = _createEdition(bytes32("edition"));
        bytes memory emptyBody = _snapshot(edition, new CuratedListProfile.EntryRef[](0));
        bytes32 foreignSnapshot = ledger.publish(snapshotType, emptyBody);
        _signed(PK_B, one(aBind(LIST_HEAD, edition, bytes32(0), foreignSnapshot, 0)), new bytes[](1));
        try profile.readPage(edition, foreignSnapshot, 0, 1) { revert("foreign curator selected"); }
        catch (bytes memory err) { expectSel(err, CuratedListProfile.E_STALE.selector, "author-scoped HEAD"); }
        bytes32 wrongType = ledger.publish(BINARY, emptyBody);
        Ledger.Action[] memory wrongBind = one(aBind(LIST_HEAD, edition, bytes32(0), wrongType, 0));
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, ledger.nonces(eoaA), wrongBind);
        try ledger.executeSigned(intent, wrongBind, new bytes[](1), sig) { revert("wrong Type bound"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_TARGET_TYPE.selector, "Core binding exact Type"); }

        CuratedListProfile.EntryRef[] memory badRefs = new CuratedListProfile.EntryRef[](1);
        badRefs[0] = CuratedListProfile.EntryRef(Keys.subject(pid(eoaA), bytes32("entry")), wrongType);
        _signed(PK_A, one(aCreate(bytes32("entry"))), new bytes[](1));
        try this.publishBadSnapshot(edition, badRefs) { revert("wrong entry Type admitted"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_REJECTED.selector, "snapshot Type rejects wrong entry Type"); }
    }

    function test_snapshot_type_rejects_malformed_member_hidden_on_later_page() public {
        bytes32 target = ledger.publish(BINARY, bytes("song"));
        bytes32 edition = _createEdition(bytes32("edition"));
        CuratedListProfile.EntryRef memory good = _addEntry(edition, bytes32("good"), target, "good");
        bytes32 badId = Keys.subject(pid(eoaA), bytes32("bad"));
        _signed(PK_A, one(aCreate(bytes32("bad"))), new bytes[](1));
        bytes32 wrongRecord = ledger.publish(BINARY, bytes("not an entry"));
        CuratedListProfile.EntryRef[] memory refs = _refs(good.id, good.recordId, badId, wrongRecord);
        try this.publishBadSnapshot(edition, refs) { revert("malformed membership admitted"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_REJECTED.selector, "Type validates all members at admission"); }
    }

    function test_entry_type_rejects_noncanonical_label_padding() public {
        bytes32 target = ledger.publish(BINARY, bytes("song"));
        bytes32 edition = _createEdition(bytes32("edition"));
        bytes32 salt = bytes32("entry");
        bytes32 id = Keys.subject(pid(eoaA), salt);
        _signed(PK_A, one(aCreate(salt)), new bytes[](1));
        bytes memory body = _entry(target, edition, id, salt, "A");
        ledger.publish(entryType, body);
        body[body.length - 1] = bytes1(uint8(1));
        try ledger.publish(entryType, body) { revert("noncanonical label padding admitted"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_REJECTED.selector, "alternate bytes for decoded label"); }
    }

    function publishBadSnapshot(bytes32 edition, CuratedListProfile.EntryRef[] memory refs) external {
        _setSnapshot(edition, refs, 0);
    }

    function test_snapshot_is_capped_at_eight_and_entry_target_uses_exact_ordinary_type() public {
        bytes32 edition = _createEdition(bytes32("edition"));
        CuratedListProfile.EntryRef[] memory nine = new CuratedListProfile.EntryRef[](9);
        bytes memory oversized = _snapshot(edition, nine);
        try ledger.publish(snapshotType, oversized) { revert("oversized snapshot admitted"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_REJECTED.selector, "mandatory eight-entry cap"); }
        bytes32 itemTarget = ledger.publish(ITEM, bytes("not binary"));
        bytes32 id = Keys.subject(pid(eoaA), bytes32("entry"));
        bytes memory entryBody = _entry(itemTarget, edition, id, bytes32("entry"), "wrong target Type");
        Ledger.Action[] memory actions = two(aCreate(bytes32("entry")), aPublish(entryType, entryBody));
        bytes[] memory bodies = new bytes[](2); bodies[1] = entryBody;
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, ledger.nonces(eoaA), actions);
        try ledger.executeSigned(intent, actions, bodies, sig) { revert("wrong entry target Type admitted"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_REF_TYPE.selector, "ordinary Type reference enforcement"); }
    }

    function test_entry_type_rejects_malformed_body_and_bob_minted_id() public {
        bytes32 target = ledger.publish(BINARY, bytes("target"));
        bytes32 edition = _createEdition(bytes32("edition"));
        bytes memory truncated = abi.encode(target);
        try ledger.publish(entryType, truncated) { revert("malformed entry admitted"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_REJECTED.selector, "entry Type owns body shape"); }

        bytes32 salt = bytes32("bob-id");
        bytes32 bobId = Keys.subject(pid(eoaB), salt);
        _signed(PK_B, one(aCreate(salt)), new bytes[](1));
        bytes memory spoof = _entry(target, edition, bobId, salt, "Bob's subject");
        try ledger.publish(entryType, spoof) { revert("Bob-minted id admitted as curator entry"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_REJECTED.selector, "curator subject namespace"); }
    }

    function test_snapshot_type_rejects_duplicate_entry_id() public {
        bytes32 target = ledger.publish(BINARY, bytes("target"));
        bytes32 edition = _createEdition(bytes32("edition"));
        CuratedListProfile.EntryRef memory a = _addEntry(edition, bytes32("entry"), target, "entry");
        CuratedListProfile.EntryRef[] memory duplicate = _refs(a.id, a.recordId, a.id, a.recordId);
        try this.publishBadSnapshot(edition, duplicate) { revert("duplicate member admitted"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_REJECTED.selector, "unique stable entry ids"); }
    }

    function test_snapshot_write_gas_grows_with_bounded_membership() public {
        bytes32 target = ledger.publish(BINARY, bytes("target"));
        bytes32 edition = _createEdition(bytes32("edition"));
        CuratedListProfile.EntryRef[] memory eight = new CuratedListProfile.EntryRef[](8);
        for (uint256 i; i < eight.length; ++i) {
            eight[i] = _addEntry(edition, bytes32(i + 1), target, "item");
        }
        CuratedListProfile.EntryRef[] memory oneRef = new CuratedListProfile.EntryRef[](1);
        oneRef[0] = eight[0];
        uint256 beforeGas = gasleft();
        _setSnapshot(edition, oneRef, 0);
        uint256 oneGas = beforeGas - gasleft();
        beforeGas = gasleft();
        (bytes32 snapshot,) = _setSnapshot(edition, eight, 1);
        uint256 eightGas = beforeGas - gasleft();
        emit log_named_uint("one-entry snapshot signed write gas", oneGas);
        emit log_named_uint("eight-entry snapshot signed write gas", eightGas);
        require(eightGas > oneGas, "whole-snapshot write grows with membership");
        (CuratedListProfile.Entry[] memory page, uint256 next, uint256 total) = profile.readPage(edition, snapshot, 0, 8);
        require(total == 8 && next == 0 && page.length == 8, "eight-entry complete page");
    }
}
