// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabBase} from "./LabBase.sol";
import {Ledger} from "../src/Ledger.sol";
import {Keys} from "../src/Keys.sol";
import {LensReader} from "../src/LensReader.sol";
import {FilesLayout, FilesRootRule, FilesChildRule, FilesParentIndex} from "./FilesJoinedProfile.sol";
import {FilesNameLayout, FilesNameRule, FilesNamesIndex, FilesNameReader, IFilesNameSource} from "./FilesNamesProfile.sol";

/// Response substitution only. It never writes Core, index, heads, or placement membership.
contract FilesNameResponseFacade is IFilesNameSource {
    Ledger public immutable core;
    uint8 public immutable mode;
    bytes32 public immutable wrongType;
    error E_SOURCE();
    constructor(Ledger core_, uint8 mode_, bytes32 wrongType_) { core = core_; mode = mode_; wrongType = wrongType_; }
    function record(bytes32 id) external view returns (bytes32 t, uint64 first, uint32 occurrences, bytes memory value) {
        if (mode == 1) return (bytes32(0), 0, 0, new bytes(0));
        if (mode == 2) revert E_SOURCE();
        (t, first, occurrences, value) = core.record(id);
        if (mode == 3) t = wrongType;
        if (mode == 4) value = bytes("other.txt");
        if (mode == 5) { (uint64 admission,,,) = core.counts(); first = admission + 1; }
        if (mode == 6) first = 1; // plausible within-basis metadata, but not the actual Name admission
    }
}

/// Seven standalone cases; no inherited FilesJoined tests or paid/browser claims.
contract FilesNamesTest is LabBase {
    bytes32 internal constant MOUNT = keccak256("lab/files-names/mounted-folder/1"); // caller mounts this exact ID as /
    bytes32 internal rootType;
    bytes32 internal childType;
    bytes32 internal nameType;
    FilesRootRule internal rootRule;
    FilesChildRule internal childRule;
    FilesNameRule internal nameRule;
    FilesNamesIndex internal namesIndex;
    FilesNameReader internal reader;

    function setUp() public override {
        super.setUp();
        rootRule = new FilesRootRule();
        rootType = registry.register(FilesLayout.ROOT_SHAPE, address(rootRule), new bytes32[](0));
        childRule = new FilesChildRule(rootType);
        childType = registry.register(FilesLayout.CHILD_SHAPE, address(childRule), new bytes32[](1));
        nameRule = new FilesNameRule();
        nameType = registry.register(FilesNameLayout.SHAPE, address(nameRule), new bytes32[](0));
        require(nameType == Keys.typeId(FilesNameLayout.SHAPE, new bytes32[](0), address(nameRule).codehash), "actual deployed Name Type identity");
        namesIndex = new FilesNamesIndex(address(ledger), rootType, childType, address(rootRule).codehash,
            address(childRule).codehash, nameType, address(nameRule).codehash);
        index = namesIndex;
        ledger.setIndexModule(address(index));
        lens = new LensReader(ledger, index);
        reader = new FilesNameReader(ledger, address(ledger), nameType, address(nameRule).codehash);
    }

    function _basis() internal view returns (FilesNameReader.Basis memory) {
        return FilesNameReader.Basis(admissions(), registry.epoch(), address(ledger).codehash);
    }

    function _creation(uint256 salt, bytes memory filename, bool includeName, uint32 revision) internal view
        returns (bytes32 file, bytes32 root, Ledger.Action[] memory actions, bytes[] memory bodies)
    {
        file = subjectOf(eoaA, salt);
        bytes memory document = bytes.concat(abi.encode(file), bytes("Named file.\n"));
        root = rid(rootType, document);
        actions = new Ledger.Action[](includeName ? 5 : 4);
        bodies = new bytes[](actions.length);
        actions[0] = aCreate(bytes32(salt));
        actions[1] = aPublish(rootType, document); bodies[1] = document;
        actions[2] = aBind(HEAD, file, NO_ROLE, root, 0);
        actions[3] = aBind(FOLDER, MOUNT, keccak256(filename), file, revision);
        // Intentional: Name follows BIND. The required callback observes the atomic final batch.
        if (includeName) { actions[4] = aPublish(nameType, filename); bodies[4] = filename; }
    }

    function _submit(Ledger.Action[] memory actions, bytes[] memory bodies) internal returns (uint64 publication, uint64 first) {
        (Ledger.Intent memory intent, bytes memory signature) = signed(PK_A, ledger, ledger.nonces(eoaA), actions);
        return ledger.executeSigned(intent, actions, bodies, signature);
    }

    function _create(uint256 salt, bytes memory filename, bool includeName, uint32 revision) internal returns (bytes32 file, bytes32 root) {
        Ledger.Action[] memory actions; bytes[] memory bodies;
        (file, root, actions, bodies) = _creation(salt, filename, includeName, revision);
        _submit(actions, bodies);
    }

    function _readDigest(bytes memory data) internal view returns (bytes32) {
        (bool ok, bytes memory result) = address(ledger).staticcall(data);
        require(ok, "real Core read"); return keccak256(result);
    }

    function _posting(bytes32 key) internal view returns (bytes32 digest) {
        (uint64 count, uint64 live, uint64 last, uint16 flags) = index.postingHead(key);
        digest = keccak256(abi.encode(count, live, last, flags));
        for (uint64 i; i <= count / 5; ++i) digest = keccak256(abi.encode(digest, index.postingWord(key, i)));
    }

    function _snapshot(address author, bytes32 file, bytes32 root, bytes32 role) internal view returns (bytes32 digest) {
        bytes32 position = Keys.position(FOLDER, MOUNT, role);
        bytes32 headKey = Keys.binding(pid(author), Keys.position(HEAD, file, NO_ROLE));
        bytes32 folderKey = Keys.binding(pid(author), position);
        digest = keccak256(abi.encode(_readDigest(abi.encodeCall(ledger.counts, ())), ledger.nonces(author),
            ledger.subjectCreatedAt(file), _readDigest(abi.encodeCall(ledger.record, (root))),
            _readDigest(abi.encodeCall(ledger.record, (Keys.recordFromHash(nameType, role))))));
        digest = keccak256(abi.encode(digest, _readDigest(abi.encodeCall(ledger.head, (headKey))),
            _readDigest(abi.encodeCall(ledger.head, (folderKey))), _readDigest(abi.encodeCall(ledger.positionCell, (position))),
            ledger.bindingPosition(1), ledger.bindingPosition(2), index.lastProcessed(), index.lastPublication()));
        bytes32[9] memory lists = [
            Keys.scopeList(Keys.scope(pid(author), FOLDER, MOUNT)), Keys.byTypeList(rootType),
            Keys.byTypeList(nameType), Keys.byAuthorList(pid(author)), Keys.historyList(headKey),
            Keys.historyList(folderKey), Keys.backlinkList(root), Keys.backlinkList(file),
            Keys.referenceList(childType, 0, root)
        ];
        for (uint256 i; i < lists.length; ++i) digest = keccak256(abi.encode(digest, _posting(lists[i])));
    }

    function _missingError(bytes32 role) internal view returns (bytes memory) {
        return abi.encodeWithSelector(Ledger.E_INDEX.selector,
            abi.encodeWithSelector(FilesNamesIndex.E_NAME_REQUIRED.selector, Keys.position(FOLDER, MOUNT, role),
                Keys.recordFromHash(nameType, role)));
    }

    function _members(uint256 count) internal view returns (LensReader.Page memory page) {
        LensReader.Cursor memory zero;
        page = lens.list(lensOf(eoaA, address(bob)), FOLDER, MOUNT, zero, 32);
        require(page.status == lens.COMPLETE() && page.items.length == count && page.selectedSoFar == count, "real complete membership");
    }

    function _name(FilesNameReader sourceReader, bytes32 role, bytes memory expected) internal view {
        FilesNameReader.Name memory result = sourceReader.readName(Keys.position(FOLDER, MOUNT, role), MOUNT, role, _basis());
        require(result.status == sourceReader.FOUND() && result.recordId == Keys.recordFromHash(nameType, role)
            && result.firstAdmission != 0 && result.firstAdmission <= admissions(), "verified exact name qualification");
        require(keccak256(result.value) == keccak256(expected) && keccak256(result.value) == role, "actual exact name bytes, not dictionary label");
    }

    function _file(bytes32 file, bytes32 root) internal view {
        (uint8 status, bytes32 target,,,)= lens.resolve(lensOf(eoaA, address(bob)), HEAD, file, NO_ROLE);
        require(status == lens.FOUND() && target == root, "selected authored HEAD remains exact");
        (bytes32 t, uint64 first,, bytes memory body) = ledger.record(root);
        require(t == rootType && first != 0 && keccak256(body) == keccak256(bytes.concat(abi.encode(file), bytes("Named file.\n"))),
            "actual retained file contents");
    }

    // Catches an SDK-only name convention: actual signed batch and generic BIND must both fail atomically.
    function test_names_missing_signed_and_generic_ingress_roll_back() public {
        bytes32 role = keccak256("missing.txt");
        (bytes32 file, bytes32 root, Ledger.Action[] memory actions, bytes[] memory bodies) = _creation(501, bytes("missing.txt"), false, 0);
        (Ledger.Intent memory intent, bytes memory signature) = signed(PK_A, ledger, 0, actions);
        bytes32 beforeState = _snapshot(eoaA, file, root, role);
        (bool ok, bytes memory err) = address(ledger).call(abi.encodeCall(ledger.executeSigned, (intent, actions, bodies, signature)));
        require(!ok && keccak256(err) == keccak256(_missingError(role)), "missing Name rejects exact nested mandatory error");
        require(_snapshot(eoaA, file, root, role) == beforeState, "signed missing Name rolls back Core and inherited index maintenance");
        require(ledger.subjectCreatedAt(file) == 0 && admissions() == 0 && ledger.nonces(eoaA) == 0, "failed create retains no File or admission");
        bytes32 publicationId = keccak256(abi.encode(eoaA, uint64(0), keccak256(abi.encode(actions))));
        require(ledger.publicationOf(publicationId) == 0, "failed signed retry evidence absent");

        bytes32 generic = ledger.create(bytes32(uint256(601))); // genuine native author, separate successful setup
        beforeState = _snapshot(address(this), generic, bytes32(0), role);
        (ok, err) = address(ledger).call(abi.encodeCall(ledger.bind, (FOLDER, MOUNT, role, generic, uint32(0))));
        require(!ok && keccak256(err) == keccak256(_missingError(role)), "direct generic bind hits identical Name guard");
        require(_snapshot(address(this), generic, bytes32(0), role) == beforeState && ledger.subjectCreatedAt(generic) != 0,
            "generic rejected bind rolls back but does not erase prior successful setup");
    }

    // Catches comparing Name.firstAdmission to BIND rather than the callback's atomic publication end.
    function test_names_signed_name_after_bind_and_parent_maintenance() public {
        (bytes32 file, bytes32 root) = _create(501, bytes("note.txt"), true, 0);
        bytes32 role = keccak256("note.txt");
        bytes32 position = Keys.position(FOLDER, MOUNT, role);
        (bytes32 t, uint64 first, uint32 occurrences, bytes memory bytes_) = ledger.record(Keys.recordFromHash(nameType, role));
        require(t == nameType && first == 5 && occurrences == 1 && keccak256(bytes_) == role, "exact Name retained after placement action");
        (uint8 state, uint32 revision, uint64 at,, uint64 ordinal, bytes32 target) = ledger.head(Keys.binding(pid(eoaA), position));
        require(state == 1 && revision == 1 && at == 4 && first > at && ordinal == 2 && target == file, "Name-after-BIND accepted by final-state callback");
        require(ledger.bindingPosition(ordinal) == position, "retained binding position");
        (bytes32 purpose, bytes32 folder, bytes32 observedRole) = ledger.positionCell(position);
        require(purpose == FOLDER && folder == MOUNT && observedRole == role, "exact retained placement tuple");
        (address author, uint8 proof,,,,,,,,,,,) = ledger.evidence(1);
        require(author == eoaA && proof == ledger.PROOF_SIGNED(), "genuine signed create evidence");
        _file(file, root);
        LensReader.Page memory page = _members(1);
        require(page.items[0].position == position && page.items[0].target == file, "real selected position supplies Name lookup");
        _name(reader, role, bytes("note.txt"));

        bytes memory childBody = bytes.concat(abi.encode(root, file), bytes("Edited.\n"));
        bytes32 child = rid(childType, childBody);
        bytes[] memory bodies = new bytes[](2); bodies[0] = childBody;
        _submit(two(aPublish(childType, childBody), aBind(HEAD, file, NO_ROLE, child, 1)), bodies);
        (uint64 count, uint64 live,, uint16 flags) = index.postingHead(Keys.referenceList(childType, 0, root));
        require(count == 1 && live == 1 && flags == 1 && index.postingAt(Keys.referenceList(childType, 0, root), 0) == 6,
            "derived Names callback preserves actual first-admission parent maintenance");
        (uint8 coverage, uint64 from, uint64 through) = index.coverage(namesIndex.FAMILY_FILES_PARENT(), 0);
        require(coverage == 2 && from == 1 && through == 7, "parent family remains required and complete");
        (coverage, from, through) = index.coverage(index.FAMILY_SCOPE(), 0);
        require(coverage == 2 && from == 1 && through == 7, "scope family remains required and complete");
    }

    // Catches deriving names from File IDs or requiring a new name occurrence for every placement.
    function test_names_multiple_positions_and_reused_name_without_republication() public {
        (bytes32 file, bytes32 root) = _create(501, bytes("note.txt"), true, 0);
        bytes[] memory bodies = new bytes[](2); bodies[0] = bytes("brief.txt");
        _submit(two(aPublish(nameType, bodies[0]), aBind(FOLDER, MOUNT, keccak256("brief.txt"), file, 0)), bodies);
        {
            LensReader.Page memory both = _members(2);
            require(both.items[0].target == file && both.items[1].target == file
                && both.items[0].position != both.items[1].position, "one File has two independent named placements");
        }
        (bytes32 otherFile, bytes32 otherRoot) = _create(502, bytes("note.txt"), false, 1);
        require(otherFile != file && otherRoot != root, "two independent Files");
        LensReader.Page memory page = _members(2);
        require(page.items[0].position == Keys.position(FOLDER, MOUNT, keccak256("note.txt")) && page.items[0].target == otherFile,
            "old name position now selects other File");
        require(page.items[1].position == Keys.position(FOLDER, MOUNT, keccak256("brief.txt")) && page.items[1].target == file,
            "second placement retains original File and its own name");
        _name(reader, keccak256("note.txt"), bytes("note.txt"));
        _name(reader, keccak256("brief.txt"), bytes("brief.txt"));
        (, uint64 first, uint32 occurrences,) = ledger.record(Keys.recordFromHash(nameType, keccak256("note.txt")));
        require(first == 5 && occurrences == 1, "omitted retained Name adds no occurrence");
        (uint64 count, uint64 live,,) = index.postingHead(Keys.byTypeList(nameType));
        require(count == 2 && live == 2, "only two explicit Name publications");
        _file(file, root); _file(otherFile, otherRoot);
    }

    // Catches treating the last withdrawn name occurrence as invalid display data or selection removal.
    function test_names_last_occurrence_withdrawal_preserves_name_membership_and_contents() public {
        (bytes32 file, bytes32 root) = _create(501, bytes("note.txt"), true, 0);
        bytes32 role = keccak256("note.txt");
        bytes32 lowerFile = subjectOf(address(bob), 701);
        (uint64 bobPublication,) = bob.execute(two(aCreate(bytes32(uint256(701))), aBind(FOLDER, MOUNT, role, lowerFile, 0)), new bytes[](2));
        (address author, uint8 proof,,,,,,,,,,,) = ledger.evidence(bobPublication);
        require(author == address(bob) && proof == ledger.PROOF_NATIVE(), "real lower-priority Bob placement");
        bytes32 position = Keys.position(FOLDER, MOUNT, role);
        bytes32 placementBefore = _readDigest(abi.encodeCall(ledger.head, (Keys.binding(pid(eoaA), position))));
        bytes32 scopeBefore = _posting(Keys.scopeList(Keys.scope(pid(eoaA), FOLDER, MOUNT)));
        (, uint64 first, uint32 occurrences,) = ledger.record(Keys.recordFromHash(nameType, role));
        require(first == 5 && occurrences == 1, "withdraw the sole actual Name occurrence");
        _submit(one(aWithdraw(first)), new bytes[](1));
        (, uint64 retainedFirst, uint32 afterOccurrences, bytes memory retained) = ledger.record(Keys.recordFromHash(nameType, role));
        require(retainedFirst == first && afterOccurrences == 0 && keccak256(retained) == role, "zero-occurrence Name bytes retained");
        (uint8 kind,,,,, bool withdrawn,,) = ledger.admission(first);
        require(kind == 1 && withdrawn, "original Name publication is actually withdrawn");
        require(ledger.nonces(eoaA) == 2 && admissions() == 8, "valid withdrawal advances actual nonce and admission");
        require(_readDigest(abi.encodeCall(ledger.head, (Keys.binding(pid(eoaA), position)))) == placementBefore
            && _posting(Keys.scopeList(Keys.scope(pid(eoaA), FOLDER, MOUNT))) == scopeBefore, "withdrawal does not mutate placement");
        (uint64 count, uint64 live,,) = index.postingHead(Keys.byTypeList(nameType));
        require(count == 1 && live == 0, "Name occurrence maintenance is independent of retained display bytes");
        LensReader.Page memory page = _members(1);
        require(page.items[0].target == file && page.items[0].author == eoaA && page.rawTotal == 2, "no automatic fallthrough to Bob");
        _name(reader, role, bytes("note.txt")); _file(file, root);
    }

    // Reader-isolation arm: real base-index membership lets the reader stub fail independently of the callback stub.
    function test_names_response_faults_preserve_membership_and_reject_mixed_basis() public {
        index = new FilesParentIndex(address(ledger), rootType, childType, address(rootRule).codehash, address(childRule).codehash);
        ledger.setIndexModule(address(index));
        lens = new LensReader(ledger, index);
        (bytes32 file, bytes32 root) = _create(501, bytes("note.txt"), true, 0);
        bytes32 role = keccak256("note.txt");
        bytes32 position = Keys.position(FOLDER, MOUNT, role);
        LensReader.Page memory page = _members(1);
        require(page.items[0].position == position && page.items[0].target == file, "independent real membership before Name reads");
        _name(reader, role, bytes("note.txt")); // actual-byte positive, not a fixture label or source mock
        bytes32 beforeState = _snapshot(eoaA, file, root, role);
        bytes32 membership = keccak256(abi.encode(page));
        for (uint8 mode = 1; mode <= 5; ++mode) {
            FilesNameResponseFacade facade = new FilesNameResponseFacade(ledger, mode, BINARY);
            FilesNameReader badSource = new FilesNameReader(ledger, address(facade), nameType, address(nameRule).codehash);
            FilesNameReader.Name memory result = badSource.readName(position, MOUNT, role, _basis());
            uint8 expected = mode == 1 ? reader.MISSING() : mode == 2 ? reader.UNAVAILABLE() : reader.INVALID();
            require(result.status == expected && result.value.length == 0, "missing transport or corrupt Name never becomes verified display bytes");
            require(keccak256(abi.encode(_members(1))) == membership && _snapshot(eoaA, file, root, role) == beforeState,
                "name-only result substitution cannot remove or corrupt authoritative membership");
        }
        _name(reader, role, bytes("note.txt")); // verified same-basis fallback after faults
        _file(file, root);
        for (uint8 mode; mode < 4; ++mode) {
            FilesNameReader.Basis memory bad = _basis();
            if (mode == 0) ++bad.admission;
            if (mode == 1) --bad.admission;
            if (mode == 2) ++bad.epoch;
            if (mode == 3) bad.core = keccak256("wrong Core");
            (bool ok, bytes memory err) = address(reader).staticcall(abi.encodeCall(reader.readName, (position, MOUNT, role, bad)));
            require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(FilesNameReader.E_BASIS.selector)),
                "future or mismatched name-read basis refuses exactly");
        }
        (bool ok, bytes memory err) = address(reader).staticcall(abi.encodeCall(reader.readName,
            (position, keccak256("other mounted folder"), role, _basis())));
        require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(FilesNameReader.E_POSITION.selector)),
            "caller cannot relabel a genuine position as another folder");
    }

    // Post-review falsifier: correct preimage does not authenticate a source's earlier admission claim.
    function test_names_forged_earlier_metadata_refuses_without_membership_change() public {
        (bytes32 file, bytes32 root) = _create(501, bytes("note.txt"), true, 0);
        require(address(index) == address(namesIndex), "real mandatory named fixture, not reader-isolation arm");
        bytes32 role = keccak256("note.txt");
        bytes32 id = Keys.recordFromHash(nameType, role);
        (bytes32 coreType, uint64 coreFirst, uint32 coreLength) = FilesLayout.header(ledger, id);
        require(coreType == nameType && coreFirst == 5 && coreLength == 8, "authoritative Core header records Name at admission five");
        _name(reader, role, bytes("note.txt"));
        LensReader.Page memory membership = _members(1);
        require(membership.items[0].target == file, "genuine selected placement before metadata substitution");
        bytes32 beforeState = _snapshot(eoaA, file, root, role);
        FilesNameResponseFacade facade = new FilesNameResponseFacade(ledger, 6, BINARY);
        {
            (bytes32 t, uint64 first, uint32 occurrences, bytes memory value) = facade.record(id);
            require(t == coreType && first == 1 && first < coreFirst && first <= admissions()
                && occurrences == 1 && keccak256(value) == role, "only first admission is forged; exact name preimage is unchanged");
        }
        FilesNameReader badSource = new FilesNameReader(ledger, address(facade), nameType, address(nameRule).codehash);
        FilesNameReader.Name memory result = badSource.readName(Keys.position(FOLDER, MOUNT, role), MOUNT, role, _basis());
        require(result.status == reader.INVALID() && result.value.length == 0,
            "forged earlier metadata is invalid despite correct name bytes");
        require(keccak256(abi.encode(_members(1))) == keccak256(abi.encode(membership))
            && _snapshot(eoaA, file, root, role) == beforeState, "metadata source cannot change real membership or Core state");
        _name(reader, role, bytes("note.txt")); _file(file, root);
    }

    // Catches permissive grammar, silent normalization, and accepting an unrelated Name Type profile.
    function test_names_ascii_grammar_refuses_unsupported_bytes_without_normalizing() public {
        bytes[] memory invalid = new bytes[](9);
        invalid[0] = new bytes(0);
        invalid[1] = bytes("a/b");
        invalid[2] = hex"610a";
        invalid[3] = bytes(".");
        invalid[4] = bytes("..");
        invalid[5] = new bytes(256);
        for (uint256 i; i < invalid[5].length; ++i) invalid[5][i] = bytes1("a");
        invalid[6] = bytes("Upper.txt");
        invalid[7] = hex"636166c3a9"; // rich UTF-8 is outside this explicit ASCII profile, not universally invalid
        invalid[8] = bytes(" note.txt");
        for (uint256 i; i < invalid.length; ++i) {
            Ledger.Action[] memory actions = one(aPublish(nameType, invalid[i]));
            bytes[] memory bodies = new bytes[](1); bodies[0] = invalid[i];
            (Ledger.Intent memory intent, bytes memory signature) = signed(PK_A, ledger, 0, actions);
            (bool ok, bytes memory err) = address(ledger).call(abi.encodeCall(ledger.executeSigned, (intent, actions, bodies, signature)));
            require(!ok && keccak256(err) == keccak256(abi.encodeWithSelector(Ledger.E_REJECTED.selector, uint256(0), nameType)),
                "unsupported Name bytes refuse exact mandatory acceptor error");
            (bytes32 t, uint64 first, uint32 occurrences, bytes memory retained) = ledger.record(rid(nameType, invalid[i]));
            require(t == 0 && first == 0 && occurrences == 0 && retained.length == 0
                && admissions() == 0 && ledger.nonces(eoaA) == 0, "rejected Name never retained or normalized");
        }
        bytes[] memory good = new bytes[](2);
        good[0] = bytes("a-0_note.txt");
        good[1] = new bytes(255);
        for (uint256 i; i < good[1].length; ++i) good[1][i] = bytes1("a");
        for (uint256 i; i < good.length; ++i) {
            bytes[] memory bodies = new bytes[](1); bodies[0] = good[i];
            _submit(one(aPublish(nameType, good[i])), bodies);
            (bytes32 t, uint64 first, uint32 occurrences, bytes memory retained) = ledger.record(rid(nameType, good[i]));
            require(t == nameType && first == i + 1 && occurrences == 1 && keccak256(retained) == keccak256(good[i]),
                "supported ASCII retained exactly, including maximum length");
        }
        try new FilesNameReader(ledger, address(ledger), BINARY, address(nameRule).codehash) returns (FilesNameReader) {
            revert("unrelated Name Type accepted");
        } catch (bytes memory err) {
            require(keccak256(err) == keccak256(abi.encodeWithSelector(FilesNameLayout.E_NAME_PROFILE.selector)), "reader pins exact Name descriptor");
        }
    }
}
