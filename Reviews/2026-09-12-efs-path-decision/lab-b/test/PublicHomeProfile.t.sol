// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {FilesJoinedTest} from "./FilesJoined.t.sol";
import {CuratedEntryRule, CuratedSnapshotRule, CuratedListProfile} from "./CuratedListProfile.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {IndexModule} from "../src/IndexModule.sol";

/// An intentionally narrow application query: records with a Root/Child revision
/// published by one Principal in this Realm, at the current covered basis. It is
/// neither a creator registry nor an all-chain/hidden-file discovery service.
contract ScopedAuthoredFiles {
    Ledger public immutable ledger;
    IndexModule public immutable index;
    bytes32 public immutable rootType;
    bytes32 public immutable childType;

    error E_BASIS();
    error E_INVENTORY_TOO_LARGE();

    constructor(Ledger l, IndexModule i, bytes32 root, bytes32 child) {
        ledger = l;
        index = i;
        rootType = root;
        childType = child;
    }

    function contributedFiles(bytes32 author, uint64 basis) external view returns (bytes32[] memory files) {
        (uint64 current,,,) = ledger.counts();
        (uint8 status, uint64 from, uint64 through) = index.coverage(index.FAMILY_BY_AUTHOR(), bytes32(0));
        if (basis != current || status != 2 || from != 1 || through < basis) revert E_BASIS();
        bytes32 key = Keys.byAuthorList(author);
        (uint64 count,,,) = index.postingHead(key);
        // A successful result is complete only for this finite author posting at
        // this basis. Refuse, rather than silently truncate, a larger inventory.
        if (count > 32) revert E_INVENTORY_TOO_LARGE();
        bytes32[] memory found = new bytes32[](count);
        uint256 used;
        for (uint64 i; i < count; ++i) {
            uint64 ordinal = index.postingAt(key, i);
            (uint8 kind,, uint64 publication,,, bool withdrawn, bytes32 a, bytes32 t) = ledger.admission(ordinal);
            if ((kind != 1 && kind != 2) || withdrawn || (t != rootType && t != childType)) continue;
            // Do not recompute a historical contract Principal from today's code.
            if (ledger.publicationContext(publication).principalId != author) revert E_BASIS();
            bytes32 id = kind == 1 ? Keys.recordFromHash(t, a) : a;
            (bytes32 actualType, uint64 first,, bytes memory body) = ledger.record(id);
            if (actualType != t || first == 0 || body.length < (t == rootType ? 32 : 64)) revert E_BASIS();
            uint256 offset = t == childType ? 64 : 32;
            bytes32 file;
            assembly ("memory-safe") { file := mload(add(body, offset)) }
            if (ledger.subjectCreatedAt(file) == 0) revert E_BASIS();
            bool seen;
            for (uint256 j; j < used; ++j) if (found[j] == file) seen = true;
            if (!seen) found[used++] = file;
        }
        files = new bytes32[](used);
        for (uint256 j; j < used; ++j) files[j] = found[j];
    }
}

/// Disposable home discriminator. No ENS RPC, global search, or permanent Type bytes.
contract PublicHomeProfileTest is FilesJoinedTest {
    event log_named_uint(string key, uint256 value);

    bytes32 internal constant HOME = keccak256("lab/public-home/current/1");
    bytes32 internal constant DISPLAY_HINT = keccak256("lab/public-home/display-hint/1");
    bytes32 internal constant LIST_HEAD = keccak256("lab/curated-list/head/1");
    bytes32 internal constant PROFILE_SHAPE = keccak256("lab/public-home/profile/1");
    bytes32 internal constant HOME_SHAPE = keccak256("lab/public-home/home/1");
    bytes32 internal constant ENTRY_SHAPE = keccak256("lab/curated-list/entry/1");
    bytes32 internal constant SNAPSHOT_SHAPE = keccak256("lab/curated-list/snapshot/1");

    bytes32 internal profileType;
    bytes32 internal homeType;
    bytes32 internal entryType;
    bytes32 internal snapshotType;
    CuratedListProfile internal curated;
    ScopedAuthoredFiles internal authored;

    function setUp() public override {
        super.setUp();
        profileType = registry.register(PROFILE_SHAPE, address(0), new bytes32[](0));
        bytes32[] memory rootRef = new bytes32[](1);
        rootRef[0] = rootType;
        CuratedEntryRule entryRule = new CuratedEntryRule(ledger, eoaA);
        entryType = registry.register(ENTRY_SHAPE, address(entryRule), rootRef);
        CuratedSnapshotRule snapshotRule = new CuratedSnapshotRule(ledger, eoaA, entryType);
        snapshotType = registry.register(SNAPSHOT_SHAPE, address(snapshotRule), new bytes32[](0));
        bytes32[] memory homeRefs = new bytes32[](2);
        homeRefs[0] = profileType;
        homeRefs[1] = snapshotType;
        homeType = registry.register(HOME_SHAPE, address(0), homeRefs);
        registry.setBindingRefType(HOME, NO_ROLE, homeType);
        registry.setBindingRefType(DISPLAY_HINT, NO_ROLE, BINARY);
        registry.setBindingRefType(LIST_HEAD, NO_ROLE, snapshotType);
        curated = new CuratedListProfile(ledger, eoaA, entryType, snapshotType, LIST_HEAD);
        authored = new ScopedAuthoredFiles(ledger, filesIndex, rootType, childType);
    }

    function _signedAs(uint256 key, Ledger.Action[] memory actions, bytes[] memory bodies)
        internal returns (uint64 publication)
    {
        address author = vm.addr(key);
        (Ledger.Intent memory intent, bytes memory sig) = signed(key, ledger, ledger.nonces(author), actions);
        (publication,) = ledger.executeSigned(intent, actions, bodies, sig);
    }

    function _profile(bytes memory body) internal returns (bytes32 id, uint256 gasUsed) {
        id = rid(profileType, body);
        bytes[] memory bodies = new bytes[](1);
        bodies[0] = body;
        uint256 beforeGas = gasleft();
        _signedAs(PK_A, one(aPublish(profileType, body)), bodies);
        gasUsed = beforeGas - gasleft();
    }

    function _home(bytes32 profile, bytes32 listSnapshot, uint32 revision) internal returns (bytes32 id, uint256 gasUsed) {
        bytes memory body = abi.encode(profile, listSnapshot);
        id = rid(homeType, body);
        Ledger.Action[] memory actions = two(aPublish(homeType, body), aBind(HOME, pid(eoaA), NO_ROLE, id, revision));
        bytes[] memory bodies = new bytes[](2);
        bodies[0] = body;
        uint256 beforeGas = gasleft();
        _signedAs(PK_A, actions, bodies);
        gasUsed = beforeGas - gasleft();
    }

    function _curatedFile(bytes32 rootRecord) internal returns (bytes32 snapshot) {
        bytes32 editionSalt = bytes32("home-list");
        bytes32 entrySalt = bytes32("first-file");
        bytes32 edition = Keys.subject(pid(eoaA), editionSalt);
        bytes32 entry = Keys.subject(pid(eoaA), entrySalt);
        Ledger.Action[] memory creates = two(aCreate(editionSalt), aCreate(entrySalt));
        _signedAs(PK_A, creates, new bytes[](2));
        bytes memory entryBody = abi.encode(rootRecord, edition, entry, entrySalt, editionSalt, "first file");
        bytes32 entryRecord = rid(entryType, entryBody);
        CuratedListProfile.EntryRef[] memory refs = new CuratedListProfile.EntryRef[](1);
        refs[0] = CuratedListProfile.EntryRef(entry, entryRecord);
        bytes memory snapshotBody = abi.encode(edition, editionSalt, refs);
        snapshot = rid(snapshotType, snapshotBody);
        Ledger.Action[] memory actions = new Ledger.Action[](3);
        bytes[] memory bodies = new bytes[](3);
        actions[0] = aPublish(entryType, entryBody);
        bodies[0] = entryBody;
        actions[1] = aPublish(snapshotType, snapshotBody);
        bodies[1] = snapshotBody;
        actions[2] = aBind(LIST_HEAD, edition, NO_ROLE, snapshot, 0);
        _signedAs(PK_A, actions, bodies);
        (CuratedListProfile.Entry[] memory page,, uint256 total) = curated.readPage(edition, snapshot, 0, 1);
        require(total == 1 && page.length == 1 && page[0].id == entry && page[0].target == rootRecord,
            "curated root is an independently read exact List entry");
    }

    function test_home_owner_binding_typed_refs_and_foreign_contribution() public {
        _createRoot();
        bytes32 listSnapshot = _curatedFile(r0);
        (bytes32 profile,) = _profile(bytes("Alice profile; photo/AR bio reference"));
        (bytes32 home,) = _home(profile, listSnapshot, 0);
        (uint8 state, uint32 revision, bytes32 current) = headOf(eoaA, HOME, pid(eoaA), NO_ROLE);
        require(state == 1 && revision == 1 && current == home, "raw Principal finds owner-selected home");
        (bytes32 exactType,, uint32 occurrences, bytes memory body) = ledger.record(current);
        require(exactType == homeType && occurrences == 1, "exact Home Type");
        (bytes32 profileRef, bytes32 listRef) = abi.decode(body, (bytes32, bytes32));
        require(profileRef == profile && listRef == listSnapshot, "typed profile and curated List refs");

        bytes32 alternateProfile = ledger.publish(profileType, bytes("Bob's suggested profile"));
        bytes memory foreignBody = abi.encode(alternateProfile, listSnapshot);
        bytes32 foreignHome = rid(homeType, foreignBody);
        Ledger.Action[] memory foreignActions = two(
            aPublish(homeType, foreignBody), aBind(HOME, pid(eoaA), NO_ROLE, foreignHome, 0)
        );
        bytes[] memory foreignBodies = new bytes[](2);
        foreignBodies[0] = foreignBody;
        _signedAs(PK_B, foreignActions, foreignBodies);
        require(headOfTarget(eoaA, HOME, pid(eoaA)) == home, "foreign binding cannot update owner binding");
        require(headOfTarget(eoaB, HOME, pid(eoaA)) == foreignHome, "foreign assertion remains separately attributed");

        bytes memory childBody = _childBody(r0, file, bytes("Bob's contribution"));
        bytes32 child = rid(childType, childBody);
        Ledger.Action[] memory contribution = two(aPublish(childType, childBody), aBind(HEAD, file, NO_ROLE, child, 0));
        bytes[] memory contributionBodies = new bytes[](2);
        contributionBodies[0] = childBody;
        _signedAs(PK_B, contribution, contributionBodies);
        (uint8 selected, bytes32 target,, address author,) = lens.resolve(lensOf(eoaA, eoaB), HEAD, file, NO_ROLE);
        require(selected == 1 && target == r0 && author == eoaA, "Alice-first Lens selects Alice");
        (selected, target,, author,) = lens.resolve(lensOf(eoaB, eoaA), HEAD, file, NO_ROLE);
        require(selected == 1 && target == child && author == eoaB, "Bob-first Lens selects Bob, not home owner");
        require(headOfTarget(eoaA, HOME, pid(eoaA)) == home, "contribution cannot take home authority");
    }

    function headOfTarget(address author, bytes32 purpose, bytes32 subject) internal view returns (bytes32 target) {
        (,, target) = headOf(author, purpose, subject, NO_ROLE);
    }

    function test_home_rejects_wrong_referenced_and_bound_types_without_partial_effects() public {
        _createRoot();
        bytes32 listSnapshot = _curatedFile(r0);
        bytes32 wrongProfile = ledger.publish(BINARY, bytes("same bytes, wrong Type"));
        bytes memory badHome = abi.encode(wrongProfile, listSnapshot);
        bytes32 badHomeId = rid(homeType, badHome);
        Ledger.Action[] memory publish = one(aPublish(homeType, badHome));
        bytes[] memory bodies = new bytes[](1);
        bodies[0] = badHome;
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, ledger.nonces(eoaA), publish);
        uint64 beforeAdmission = admissions();
        try ledger.executeSigned(intent, publish, bodies, sig) { revert("wrong profile Type accepted"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_REF_TYPE.selector, "exact Home reference Type"); }
        require(admissions() == beforeAdmission && headOfTarget(eoaA, HOME, pid(eoaA)) == 0,
            "failed reference leaves no admission or home binding");
        (bytes32 storedType,,,) = ledger.record(badHomeId);
        require(storedType == 0, "failed Home record absent");

        (bytes32 profile,) = _profile(bytes("valid profile"));
        Ledger.Action[] memory wrongBinding = one(aBind(HOME, pid(eoaA), NO_ROLE, profile, 0));
        (intent, sig) = signed(PK_A, ledger, ledger.nonces(eoaA), wrongBinding);
        beforeAdmission = admissions();
        try ledger.executeSigned(intent, wrongBinding, new bytes[](1), sig) { revert("wrong Home target Type accepted"); }
        catch (bytes memory err) { expectSel(err, Ledger.E_TARGET_TYPE.selector, "exact HOME binding Type"); }
        require(admissions() == beforeAdmission && headOfTarget(eoaA, HOME, pid(eoaA)) == 0,
            "failed binding leaves no effect");
    }

    function test_repointed_display_hint_never_rewrites_author_or_principal() public {
        _createRoot();
        bytes32 originalPrincipal = pid(eoaA);
        bytes32 beforeAuthor = Keys.byAuthorList(originalPrincipal);
        bytes32 hint1 = ledger.publish(BINARY, bytes("alice.eth"));
        _signedAs(PK_A, one(aBind(DISPLAY_HINT, originalPrincipal, NO_ROLE, hint1, 0)), new bytes[](1));
        bytes32 hint2 = ledger.publish(BINARY, bytes("renamed.eth"));
        _signedAs(PK_A, one(aBind(DISPLAY_HINT, originalPrincipal, NO_ROLE, hint2, 1)), new bytes[](1));
        require(headOfTarget(eoaA, DISPLAY_HINT, originalPrincipal) == hint2, "display hint repointed");
        require(pid(eoaA) == originalPrincipal && Keys.byAuthorList(pid(eoaA)) == beforeAuthor,
            "raw Principal and author index stable");
        (address author,,,,,,,,,,,,) = ledger.evidence(1);
        require(author == eoaA, "earlier File publication author unchanged");
        require(headOfTarget(eoaA, HEAD, file) == r0, "File citation unchanged");
    }

    function test_scoped_authored_query_filters_deduplicates_and_rejects_stale_basis() public {
        _createRoot();
        _publishBranches();
        bytes32[] memory aliceFiles = authored.contributedFiles(pid(eoaA), admissions());
        bytes32[] memory bobFiles = authored.contributedFiles(pid(address(bob)), admissions());
        require(aliceFiles.length == 1 && aliceFiles[0] == file, "Alice's Root and Child collapse to one File");
        require(bobFiles.length == 1 && bobFiles[0] == file, "Bob's independent revision contributes to same File");
        uint64 stale = admissions();
        ledger.publish(BINARY, bytes("unrelated"));
        try authored.contributedFiles(pid(eoaA), stale) { revert("stale inventory basis accepted"); }
        catch (bytes memory err) { expectSel(err, ScopedAuthoredFiles.E_BASIS.selector, "basis gate"); }
    }

    function test_scoped_authored_query_refuses_oversized_inventory_instead_of_claiming_completeness() public {
        for (uint256 i; i < 33; ++i) ledger.publish(BINARY, abi.encode(i));
        try authored.contributedFiles(pid(address(this)), admissions()) { revert("truncated inventory called complete"); }
        catch (bytes memory err) {
            expectSel(err, ScopedAuthoredFiles.E_INVENTORY_TOO_LARGE.selector, "bounded author inventory");
        }
    }

    function test_home_mutation_and_profile_data_write_gas() public {
        _createRoot();
        bytes32 listSnapshot = _curatedFile(r0);
        (bytes32 p1, uint256 profileWrite1) = _profile(bytes("profile v1"));
        (, uint256 homeWrite1) = _home(p1, listSnapshot, 0);
        (bytes32 p2, uint256 profileWrite2) = _profile(bytes("profile v2"));
        (bytes32 home2, uint256 homeWrite2) = _home(p2, listSnapshot, 1);
        require(profileWrite1 != 0 && profileWrite2 != 0 && homeWrite1 != 0 && homeWrite2 != 0,
            "actual gas measured");
        require(headOfTarget(eoaA, HOME, pid(eoaA)) == home2, "second mutation current");
        emit log_named_uint("profile_first_publish_gas", profileWrite1);
        emit log_named_uint("home_first_publish_and_bind_gas", homeWrite1);
        emit log_named_uint("profile_second_publish_gas", profileWrite2);
        emit log_named_uint("home_second_publish_and_rebind_gas", homeWrite2);
    }
}
