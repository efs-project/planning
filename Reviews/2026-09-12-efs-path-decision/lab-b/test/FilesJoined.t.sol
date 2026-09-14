// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {LabBase} from "./LabBase.sol";
import {LensReader} from "../src/LensReader.sol";
import {FilesJoinedConsumer} from "./FilesJoinedConsumer.sol";
import {FilesLayout, FilesRootRule, FilesChildRule, FilesParentIndex, FilesFailingParentIndex} from "./FilesJoinedProfile.sol";

interface VmFilesCold { function cool(address target) external; }

/// Disposable actual revision journey; raw layout and profile hashes are explicit pins.
contract FilesJoinedTest is LabBase {
    bytes32 internal rootType;
    bytes32 internal childType;
    bytes32 internal file;
    bytes32 internal r0;
    bytes32 internal ra;
    bytes32 internal rb;
    bytes32 internal rr;
    bytes32 internal constant PROJECT_EFS = keccak256("project_efs");
    bytes32 internal constant DRAFT = keccak256("draft");
    bytes32 internal constant APPROVED = keccak256("approved");
    FilesRootRule internal rootRule;
    FilesChildRule internal childRule;
    FilesParentIndex internal filesIndex;

    function setUp() public virtual override {
        super.setUp();
        rootRule = new FilesRootRule();
        rootType = registry.register(FilesLayout.ROOT_SHAPE, address(rootRule), new bytes32[](0));
        childRule = new FilesChildRule(rootType);
        bytes32[] memory refs = new bytes32[](1);
        childType = registry.register(FilesLayout.CHILD_SHAPE, address(childRule), refs);
        require(rootType == Keys.typeId(FilesLayout.ROOT_SHAPE, new bytes32[](0), address(rootRule).codehash), "Root descriptor");
        require(childType == Keys.typeId(FilesLayout.CHILD_SHAPE, refs, address(childRule).codehash), "Child descriptor");
        _installFilesIndex(false);
    }

    function _installFilesIndex(bool failChild) internal {
        // These expected hashes come from reviewed deployments above, not a registry assertion.
        if (failChild) {
            filesIndex = new FilesFailingParentIndex(address(ledger), rootType, childType, address(rootRule).codehash, address(childRule).codehash);
        } else {
            filesIndex = new FilesParentIndex(address(ledger), rootType, childType, address(rootRule).codehash, address(childRule).codehash);
        }
        index = filesIndex;
        ledger.setIndexModule(address(filesIndex));
        lens = new LensReader(ledger, filesIndex);
        require(address(lens.index()) == address(filesIndex) && filesIndex.attachedFrom() == 1, "fresh Lens and required index");
    }

    function _rootBody(bytes32 f, bytes memory document) internal pure returns (bytes memory) {
        return bytes.concat(abi.encode(f), document);
    }

    function _childBody(bytes32 parent, bytes32 f, bytes memory document) internal pure returns (bytes memory) {
        return bytes.concat(abi.encode(parent, f), document);
    }

    function _signedActions(Ledger.Action[] memory actions, bytes[] memory bodies) internal returns (uint64 publication) {
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, ledger.nonces(eoaA), actions);
        (publication,) = ledger.executeSigned(intent, actions, bodies, sig);
    }

    function _assertEvidence(uint64 publication, address expectedAuthor, uint8 expectedProof) internal view {
        (address author, uint8 proof,,,,,,,,,,,) = ledger.evidence(publication);
        require(author == expectedAuthor && proof == expectedProof, "actual author and evidence category");
    }

    function _createRoot() internal {
        file = subjectOf(eoaA, 401);
        bytes memory body = _rootBody(file, bytes("Meeting at 10:00.\n"));
        r0 = Keys.recordFromHash(rootType, keccak256(body));
        Ledger.Action[] memory actions = new Ledger.Action[](6);
        bytes[] memory bodies = new bytes[](6);
        actions[0] = aCreate(bytes32(uint256(401)));
        actions[1] = aPublish(rootType, body);
        bodies[1] = body;
        actions[2] = aBind(HEAD, file, NO_ROLE, r0, 0);
        actions[3] = aBind(FOLDER, DRAFTS, name("note.txt"), file, 0);
        actions[4] = aBind(TAG, file, PROJECT_EFS, file, 0);
        actions[5] = aBind(TAG, r0, DRAFT, file, 0);
        _assertEvidence(_signedActions(actions, bodies), eoaA, ledger.PROOF_SIGNED());
        require(ledger.subjectCreatedAt(file) != 0, "real File Subject");
        _assertRecord(r0, rootType, body);
    }

    function _publishBranches() internal {
        bytes memory body = _childBody(r0, file, bytes("Meeting at 11:00.\n"));
        ra = Keys.recordFromHash(childType, keccak256(body));
        Ledger.Action[] memory actions = new Ledger.Action[](3);
        bytes[] memory bodies = new bytes[](3);
        actions[0] = aPublish(childType, body);
        bodies[0] = body;
        actions[1] = aBind(HEAD, file, NO_ROLE, ra, 1);
        actions[2] = aBind(TAG, ra, APPROVED, file, 0);
        _assertEvidence(_signedActions(actions, bodies), eoaA, ledger.PROOF_SIGNED());
        _assertRecord(ra, childType, body);
        body = _childBody(r0, file, bytes("Meeting at 09:00.\n"));
        rb = Keys.recordFromHash(childType, keccak256(body));
        actions = two(aPublish(childType, body), aBind(HEAD, file, NO_ROLE, rb, 0));
        bodies = new bytes[](2);
        bodies[0] = body;
        (uint64 publication,) = bob.execute(actions, bodies);
        _assertEvidence(publication, address(bob), ledger.PROOF_NATIVE());
        _assertRecord(rb, childType, body);
    }

    function _publishGrandchild() internal {
        bytes memory body = _childBody(ra, file, bytes("Meeting at 10:00.\n"));
        rr = Keys.recordFromHash(childType, keccak256(body));
        bytes[] memory bodies = new bytes[](2);
        bodies[0] = body;
        _assertEvidence(_signedActions(two(aPublish(childType, body), aBind(HEAD, file, NO_ROLE, rr, 2)), bodies), eoaA, ledger.PROOF_SIGNED());
        _assertRecord(rr, childType, body);
        require(rr != r0, "equal document bytes are a new revision");
    }

    function _assertRecord(bytes32 id, bytes32 expectedType, bytes memory body) internal view {
        (bytes32 t, uint64 first, uint32 occurrences, bytes memory observed) = ledger.record(id);
        require(t == expectedType && first != 0 && occurrences != 0, "revision admitted");
        require(keccak256(observed) == keccak256(body), "exact revision bytes");
    }

    function _historyAt(address author, uint64 basis, bytes32 target, uint32 revision) internal view {
        (uint8 status, bool live, bytes32 got, uint32 rev, uint64 at) = lens.historyByRole(author, HEAD, file, NO_ROLE, basis);
        require(status == 2 && live && got == target && rev == revision && at <= basis, "qualified as-of history");
    }

    // Catches refusal of valid root/child/grandchild, overwritten history or forged Bob authorship.
    function test_revision_acceptance_history() public {
        _createRoot();
        uint64 rootBasis = admissions();
        _publishBranches();
        uint64 branchBasis = admissions();
        _publishGrandchild();
        _historyAt(eoaA, rootBasis, r0, 1);
        _historyAt(eoaA, branchBasis, ra, 2);
        _historyAt(address(bob), branchBasis, rb, 1);
        _historyAt(eoaA, admissions(), rr, 3);
    }

    function _stateSnapshot() internal view returns (bytes32) {
        (uint64 a, uint64 r, uint64 b, uint64 p) = ledger.counts();
        (uint8 hs, uint32 hr, bytes32 ht) = headOf(eoaA, HEAD, file, NO_ROLE);
        (uint64 tc, uint64 tl, uint64 last, uint16 flags) = index.postingHead(Keys.byTypeList(childType));
        (uint64 ac, uint64 al, uint64 aLast, uint16 aFlags) = index.postingHead(Keys.byAuthorList(pid(eoaA)));
        return keccak256(abi.encode(ledger.nonces(eoaA), a, r, b, p, hs, hr, ht, tc, tl, last, flags, ac, al, aLast, aFlags));
    }

    function _expectRejected(bytes32 t, bytes memory body, bytes memory expected) internal {
        bytes32 beforeState = _stateSnapshot();
        bytes32 candidate = Keys.recordFromHash(t, keccak256(body));
        Ledger.Action[] memory actions = one(aPublish(t, body));
        bytes[] memory bodies = new bytes[](1);
        bodies[0] = body;
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, ledger.nonces(eoaA), actions);
        try ledger.executeSigned(intent, actions, bodies, sig) { revert("invalid revision accepted"); }
        catch (bytes memory err) { require(keccak256(err) == keccak256(expected), "exact rejection"); }
        require(_stateSnapshot() == beforeState, "nonce/counts/head/type and author posting heads unchanged");
        (bytes32 found, uint64 first, uint32 occurrences, bytes memory data) = ledger.record(candidate);
        require(found == 0 && first == 0 && occurrences == 0 && data.length == 0, "candidate absent");
    }

    function test_root_requires_existing_nonzero_file_and_shape() public {
        _createRoot(); // real successful control, CREATE must precede publication
        bytes memory rejection = abi.encodeWithSelector(Ledger.E_REJECTED.selector, uint256(0), rootType);
        _expectRejected(rootType, bytes("short"), rejection);
        _expectRejected(rootType, _rootBody(0, bytes("zero")), rejection);
        _expectRejected(rootType, _rootBody(keccak256("missing Subject"), bytes("missing")), rejection);
    }

    // Catches treating wildcard checked reference as arbitrary acceptable parent.
    function test_missing_unrelated_and_wrong_file_parents_roll_back() public {
        _createRoot();
        _publishBranches(); // successful Child control before each negative family
        bytes32 missing = keccak256("missing parent");
        _expectRejected(childType, _childBody(missing, file, bytes("missing")), abi.encodeWithSelector(Ledger.E_REF_MISSING.selector, uint256(0), uint256(0), missing));
        bytes memory rejection = abi.encodeWithSelector(Ledger.E_REJECTED.selector, uint256(0), childType);
        bytes32 unrelated = bob.publish(BINARY, _rootBody(file, bytes("unrelated Type")));
        _expectRejected(childType, _childBody(unrelated, file, bytes("unrelated")), rejection);
        bytes32 otherFile = bob.create(bytes32(uint256(402)));
        bytes32 otherRoot = bob.publish(rootType, _rootBody(otherFile, bytes("other root")));
        bytes32 otherChild = bob.publish(childType, _childBody(otherRoot, otherFile, bytes("other child")));
        _expectRejected(childType, _childBody(otherRoot, file, bytes("wrong Root File")), rejection);
        _expectRejected(childType, _childBody(otherChild, file, bytes("wrong Child File")), rejection);
        _expectRejected(childType, _childBody(r0, 0, bytes("zero File")), rejection);
        _expectRejected(childType, _childBody(r0, keccak256("missing File"), bytes("missing File")), rejection);
        _expectRejected(childType, abi.encode(r0), rejection);
    }

    // Changed predicate versus prior diagnostic: real Subject existence and Child-as-parent.
    function test_cold_large_root_and_child_headers_accept() public {
        _createRoot();
        bytes memory document = new bytes(8160);
        bytes32 largeRoot = bob.publish(rootType, _rootBody(file, document));
        bytes memory child = _childBody(largeRoot, file, new bytes(8128));
        VmFilesCold(address(vm)).cool(address(ledger));
        bytes32 largeChild = bob.publish(childType, child);
        VmFilesCold(address(vm)).cool(address(ledger));
        bytes memory grandchild = _childBody(largeChild, file, bytes("cold grandchild"));
        bytes32 id = bob.publish(childType, grandchild);
        _assertRecord(id, childType, grandchild);
    }

    function _assertParents(bytes32 parent, bytes32 firstChild, bytes32 secondChild) internal view {
        bytes32 key = Keys.referenceList(childType, 0, parent);
        (uint8 status, uint64 from, uint64 through) = filesIndex.coverage(filesIndex.FAMILY_FILES_PARENT(), key);
        require(status == 2 && from == 1 && through == admissions(), "gap-free family-wide coverage at current basis");
        // Coverage is family-wide, not separately maintained per parent. Exhaust this exact list.
        (uint64 count, uint64 live,, uint16 flags) = filesIndex.postingHead(key);
        uint64 expected = secondChild == 0 ? 1 : 2;
        require(count == expected && live == expected && flags == 1, "exact parent backlink count");
        (, uint64 first,,) = ledger.record(firstChild);
        require(filesIndex.postingAt(key, 0) == first, "first child backlink admission");
        (uint8 kind,,,,,, bytes32 bodyHash, bytes32 t) = ledger.admission(first);
        require(kind == 1 && Keys.recordFromHash(t, bodyHash) == firstChild && t == childType, "first parent member resolves to exact Child");
        if (secondChild != 0) {
            (, uint64 second,,) = ledger.record(secondChild);
            require(filesIndex.postingAt(key, 1) == second && second > first, "second child backlink admission");
            (uint8 secondKind,,,,,, bytes32 secondHash, bytes32 secondType) = ledger.admission(second);
            require(secondKind == 1 && Keys.recordFromHash(secondType, secondHash) == secondChild && secondType == childType, "second exact Child");
        }
        require(filesIndex.postingAt(key, count) == 0, "count-bounded list exhausted");
    }

    // Catches missing append and conflating parentage with each author's head history.
    function test_revision_acceptance_history_and_parent_backlinks() public {
        test_revision_acceptance_history();
        _assertParents(r0, ra, rb);
        _assertParents(ra, rr, 0);
    }

    // Catches using every occurrence ordinal instead of the masked first admission.
    function test_reuse_does_not_duplicate_parent_membership() public {
        _createRoot();
        _publishBranches();
        _assertParents(r0, ra, rb);
        bytes[] memory bodies = new bytes[](1);
        _signedActions(one(aReuse(childType, ra)), bodies);
        bytes memory body = _childBody(r0, file, bytes("Meeting at 11:00.\n"));
        bodies[0] = body;
        _signedActions(one(aPublish(childType, body)), bodies);
        _assertParents(r0, ra, rb);
        (,, uint32 occurrences,) = ledger.record(ra);
        require(occurrences == 3, "reuse and republication are real occurrences");
        (uint64 byTypeCount,,,) = filesIndex.postingHead(Keys.byTypeList(childType));
        require(byTypeCount == 4, "inherited by-Type retains every occurrence");
    }

    function _postingDigest(bytes32 key) internal view returns (bytes32 result) {
        (uint64 count, uint64 live, uint64 last, uint16 flags) = filesIndex.postingHead(key);
        result = keccak256(abi.encode(count, live, last, flags));
        for (uint64 i; i <= count / 5; ++i) result = keccak256(abi.encode(result, filesIndex.postingWord(key, i)));
    }

    function _callbackSnapshot(bytes32 candidate) internal view returns (bytes32) {
        return keccak256(abi.encode(
            _stateSnapshot(), filesIndex.lastProcessed(), filesIndex.lastPublication(), filesIndex.gapped(),
            _postingDigest(Keys.byTypeList(childType)), _postingDigest(Keys.byAuthorList(pid(eoaA))),
            _postingDigest(Keys.historyList(Keys.binding(pid(eoaA), Keys.position(HEAD, file, NO_ROLE)))),
            _postingDigest(Keys.scopeList(Keys.scope(pid(eoaA), HEAD, file))),
            _postingDigest(Keys.backlinkList(r0)), _postingDigest(Keys.backlinkList(candidate)),
            _postingDigest(Keys.referenceList(childType, 0, r0))
        ));
    }

    // Catches index writes escaping Core rollback after both maintenance halves ran.
    function test_required_parent_callback_failure_rolls_back() public {
        _installFilesIndex(true); // this test's Ledger still has zero admissions
        _createRoot(); // real successful signed CREATE/Root/head/folder/tag control
        bytes memory body = _childBody(r0, file, bytes("Meeting at 11:00.\n"));
        bytes32 candidate = Keys.recordFromHash(childType, keccak256(body));
        bytes32 beforeState = _callbackSnapshot(candidate);
        Ledger.Action[] memory actions = two(aPublish(childType, body), aBind(HEAD, file, NO_ROLE, candidate, 1));
        bytes[] memory bodies = new bytes[](2);
        bodies[0] = body;
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, ledger.nonces(eoaA), actions);
        try ledger.executeSigned(intent, actions, bodies, sig) { revert("required callback unexpectedly passed"); }
        catch (bytes memory err) {
            require(keccak256(err) == keccak256(abi.encodeWithSelector(Ledger.E_INDEX.selector,
                abi.encodeWithSelector(FilesFailingParentIndex.E_FORCED_CHILD.selector))), "exact wrapped forced Child error");
        }
        require(_callbackSnapshot(candidate) == beforeState, "nonce four counts head and tested inherited/parent postings rollback");
        (bytes32 t, uint64 first, uint32 occurrences, bytes memory data) = ledger.record(candidate);
        require(t == 0 && first == 0 && occurrences == 0 && data.length == 0, "failed Child Record absent");
        _historyAt(eoaA, admissions(), r0, 1);
    }

    function _expectProfileReject(bytes32 rt, bytes32 ct, bytes32 rh, bytes32 ch) internal {
        try new FilesParentIndex(address(ledger), rt, ct, rh, ch) { revert("non-profile index accepted"); }
        catch (bytes memory err) { require(sel(err) == FilesParentIndex.E_FILES_PROFILE.selector, "profile rejection"); }
    }

    // Catches trusting size, registry labels, an arbitrary rule, or wrong immutable Root configuration.
    function test_index_constructor_pins_exact_reviewed_profile() public {
        _createRoot(); // configured real profile is attached and operational
        bytes32 rootHash = address(rootRule).codehash;
        bytes32 childHash = address(childRule).codehash;
        _expectProfileReject(rootType, childType, 0, childHash);
        bytes32 badRoot = registry.register(keccak256("wrong Root shape"), address(rootRule), new bytes32[](0));
        _expectProfileReject(badRoot, childType, rootHash, childHash);
        badRoot = registry.register(FilesLayout.ROOT_SHAPE, address(0), new bytes32[](0));
        _expectProfileReject(badRoot, childType, rootHash, childHash);
        bytes32[] memory refs = new bytes32[](1);
        bytes32 badChild = registry.register(keccak256("wrong Child shape"), address(childRule), refs);
        _expectProfileReject(rootType, badChild, rootHash, childHash);
        refs[0] = rootType;
        badChild = registry.register(FilesLayout.CHILD_SHAPE, address(childRule), refs);
        _expectProfileReject(rootType, badChild, rootHash, childHash);
        FilesChildRule wrongConfiguration = new FilesChildRule(BINARY);
        refs[0] = 0;
        badChild = registry.register(FilesLayout.CHILD_SHAPE, address(wrongConfiguration), refs);
        _expectProfileReject(rootType, badChild, rootHash, address(wrongConfiguration).codehash);
        _expectProfileReject(rootType, childType, childHash, rootHash);
    }

    function _filesReader() internal returns (FilesJoinedConsumer) {
        return new FilesJoinedConsumer(ledger, lens, filesIndex, rootType, childType,
            address(rootRule).codehash, address(childRule).codehash);
    }

    function _basis() internal view returns (FilesJoinedConsumer.Basis memory) {
        return FilesJoinedConsumer.Basis(admissions(), filesIndex.generation(), registry.epoch(), address(ledger).codehash);
    }

    function _assertRevision(FilesJoinedConsumer.Revision memory revision, bytes32 id, bytes32 t,
        bytes32 parent, string memory document) internal view
    {
        require(revision.recordId == id && revision.typeId == t && revision.parent == parent && revision.file == file,
            "exact selected revision identity and parent");
        require(keccak256(revision.document) == keccak256(bytes(document))
            && revision.documentHash == keccak256(bytes(document)), "exact document bytes and hash");
    }

    // Catches evaluating approved at File F instead of the selected revision, or inheriting RA's tag after RR.
    function test_point_selection_applies_revision_tag_after_head() public {
        _createRoot();
        _publishBranches();
        FilesJoinedConsumer reader = _filesReader();
        address[] memory la = lensOf(eoaA, address(bob));
        address[] memory lb = lensOf(address(bob), eoaA);
        FilesJoinedConsumer.FilePoint memory a = reader.readFilePoint(file, la, APPROVED, _basis());
        require(a.status == 1 && a.file == file, "Alice point FOUND");
        _assertRevision(a.revision, ra, childType, r0, "Meeting at 11:00.\n");
        require(a.revisionTag.present, "approved belongs to selected RA, not File F");
        require(a.revisionTag.evaluated && a.revisionTag.status == 1 && a.revisionTag.subject == ra
            && a.revisionTag.target == file, "qualified RA approved assessment");
        require(a.fileTag.evaluated && a.fileTag.subject == file && a.fileTag.status == 0 && !a.fileTag.present,
            "approved is absent on File itself");
        FilesJoinedConsumer.FilePoint memory b = reader.readFilePoint(file, lb, APPROVED, _basis());
        _assertRevision(b.revision, rb, childType, r0, "Meeting at 09:00.\n");
        require(b.status == 1 && b.revisionTag.evaluated && b.revisionTag.subject == rb
            && b.revisionTag.status == 0 && !b.revisionTag.present, "RB does not inherit RA approved");
        a = reader.readFilePoint(file, la, PROJECT_EFS, _basis());
        b = reader.readFilePoint(file, lb, PROJECT_EFS, _basis());
        require(a.fileTag.present && b.fileTag.present && a.fileTag.subject == file && b.fileTag.subject == file,
            "File project tag survives both lenses");
        require(!a.revisionTag.present && !b.revisionTag.present, "File project tag is not a revision tag");
        _publishGrandchild();
        a = reader.readFilePoint(file, la, APPROVED, _basis());
        _assertRevision(a.revision, rr, childType, ra, "Meeting at 10:00.\n");
        require(a.revisionTag.evaluated && a.revisionTag.subject == rr && a.revisionTag.status == 0
            && !a.revisionTag.present, "RR has no inherited approval");
        a = reader.readFilePoint(file, la, PROJECT_EFS, _basis());
        require(a.fileTag.present && a.fileTag.subject == file, "File project tag survives RR");
    }

    // Catches selecting an incidental winner or dropping a conflict candidate's binding provenance/bytes.
    function test_conflict_preserves_both_exact_revisions() public {
        _createRoot();
        _publishBranches();
        FilesJoinedConsumer reader = _filesReader();
        FilesJoinedConsumer.ConflictResult memory result =
            reader.readFileConflict(file, lensOf(eoaA, address(bob)), PROJECT_EFS, _basis());
        require(result.status == 3 && result.file == file && result.candidates.length == 2, "retained conflict, no winner");
        require(result.fileTag.evaluated && result.fileTag.subject == file && result.fileTag.present, "qualified File tag");
        _assertRevision(result.candidates[0].revision, ra, childType, r0, "Meeting at 11:00.\n");
        _assertRevision(result.candidates[1].revision, rb, childType, r0, "Meeting at 09:00.\n");
        require(result.candidates[0].binding.author == eoaA && result.candidates[0].binding.target == ra
            && result.candidates[0].binding.revision == 2 && result.candidates[0].binding.admission != 0,
            "Alice candidate binding retained");
        require(result.candidates[1].binding.author == address(bob) && result.candidates[1].binding.target == rb
            && result.candidates[1].binding.revision == 1 && result.candidates[1].binding.admission != 0,
            "Bob candidate binding retained");
        result = reader.readFileConflict(file, lensOf(address(bob), eoaA), APPROVED, _basis());
        require(result.status == 3 && result.candidates.length == 2 && result.candidates[0].revision.recordId == rb
            && result.candidates[1].revision.recordId == ra, "reversing lens preserves both candidates");
    }

    function _folder(FilesJoinedConsumer reader, address[] memory authors, bytes32 concept,
        FilesJoinedConsumer.TagScope scope) internal view returns (FilesJoinedConsumer.FolderResult memory result)
    {
        result = reader.readFolderTaggedOnce(DRAFTS, authors, concept, scope, 8, _basis());
        require(result.status == 2 && !result.mutated && result.next.lensIndex == authors.length && result.next.rawIndex == 0,
            "complete exhausted single folder window");
        require(result.next.basisAdmission == admissions() && result.next.indexGeneration == filesIndex.generation()
            && result.next.rulesEpoch == registry.epoch() && result.next.coreCodeCommitment == address(ledger).codehash
            && result.next.lensHash == keccak256(abi.encodePacked(authors))
            && result.next.scopeKey == keccak256(abi.encode(FOLDER, DRAFTS)), "exact folder context");
    }

    // Catches using point proof as folder completeness or filtering a revision tag before selecting each HEAD.
    function test_complete_one_page_folder_tag_join_is_not_point_evidence() public {
        _createRoot();
        _publishBranches();
        FilesJoinedConsumer reader = _filesReader();
        address[] memory la = lensOf(eoaA, address(bob));
        address[] memory lb = lensOf(address(bob), eoaA);
        FilesJoinedConsumer.FolderResult memory result = _folder(reader, la, PROJECT_EFS, FilesJoinedConsumer.TagScope.File);
        require(result.files.length == 1 && result.files[0].file == file, "File project join Alice");
        _assertRevision(result.files[0].revision, ra, childType, r0, "Meeting at 11:00.\n");
        result = _folder(reader, lb, PROJECT_EFS, FilesJoinedConsumer.TagScope.File);
        require(result.files.length == 1 && result.files[0].file == file, "File project join Bob");
        _assertRevision(result.files[0].revision, rb, childType, r0, "Meeting at 09:00.\n");
        result = _folder(reader, la, APPROVED, FilesJoinedConsumer.TagScope.SelectedRevision);
        require(result.files.length == 1 && result.files[0].revision.recordId == ra, "Alice approved folder joins RA");
        result = _folder(reader, lb, APPROVED, FilesJoinedConsumer.TagScope.SelectedRevision);
        require(result.files.length == 0, "complete Bob approved join proves no matches");
        _publishGrandchild();
        result = _folder(reader, la, APPROVED, FilesJoinedConsumer.TagScope.SelectedRevision);
        require(result.files.length == 0, "complete RR approved join proves no matches");
        result = _folder(reader, la, PROJECT_EFS, FilesJoinedConsumer.TagScope.File);
        require(result.files.length == 1 && result.files[0].revision.recordId == rr, "project join retains current RR");
    }

    function _rejectRead(FilesJoinedConsumer reader, bytes memory callData, bytes4 expected) internal view {
        (bool ok, bytes memory result) = address(reader).staticcall(callData);
        require(!ok && sel(result) == expected, "exact fail-closed reader error");
    }

    function _rejectPointBasis(FilesJoinedConsumer reader, FilesJoinedConsumer.Basis memory basis) internal view {
        _rejectRead(reader, abi.encodeCall(reader.readFilePoint, (file, lensOf(eoaA, address(bob)), APPROVED, basis)),
            FilesJoinedConsumer.E_BASIS.selector);
    }

    // Catches empty-on-PARTIAL, accepting historical point bases, and immutable Lens detached from Core's index.
    function test_partial_stale_and_wrong_index_reads_fail_closed() public {
        _createRoot();
        _publishBranches();
        FilesJoinedConsumer reader = _filesReader();
        FilesJoinedConsumer.Basis memory basis = _basis();
        address[] memory authors = lensOf(eoaA, address(bob));
        _rejectRead(reader, abi.encodeCall(reader.readFolderTaggedOnce,
            (DRAFTS, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File, 0, basis)), FilesJoinedConsumer.E_INCOMPLETE.selector);
        --basis.admission;
        _rejectPointBasis(reader, basis);
        _rejectRead(reader, abi.encodeCall(reader.readFileConflict, (file, authors, APPROVED, basis)), FilesJoinedConsumer.E_BASIS.selector);
        _rejectRead(reader, abi.encodeCall(reader.readFolderTaggedOnce,
            (DRAFTS, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File, 8, basis)), FilesJoinedConsumer.E_BASIS.selector);
        basis = _basis();
        ++basis.generation;
        _rejectPointBasis(reader, basis);
        basis = _basis();
        ++basis.epoch;
        _rejectPointBasis(reader, basis);
        basis = _basis();
        basis.core = keccak256("wrong Core");
        _rejectPointBasis(reader, basis);
        basis = _basis();
        ledger.setIndexModule(address(0));
        _rejectPointBasis(reader, basis);
        _rejectRead(reader, abi.encodeCall(reader.readFolderTaggedOnce,
            (DRAFTS, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File, 8, basis)), FilesJoinedConsumer.E_BASIS.selector);
        FilesParentIndex replacement = new FilesParentIndex(address(ledger), rootType, childType,
            address(rootRule).codehash, address(childRule).codehash);
        ledger.setIndexModule(address(replacement));
        _rejectPointBasis(reader, basis);
    }

    // Catches incomplete folder success and coupling exact point reads to unused reverse-parent coverage.
    function test_reader_rechecks_parent_and_scope_coverage() public {
        _createRoot();
        _publishBranches();
        FilesJoinedConsumer reader = _filesReader();
        FilesJoinedConsumer.Basis memory basis = _basis();
        filesIndex.declareOptional(filesIndex.FAMILY_SCOPE(), 1);
        _rejectRead(reader, abi.encodeCall(reader.readFolderTaggedOnce,
            (DRAFTS, lensOf(eoaA, address(bob)), PROJECT_EFS, FilesJoinedConsumer.TagScope.File, 8, basis)),
            FilesJoinedConsumer.E_INCOMPLETE.selector);
        FilesJoinedConsumer.FilePoint memory before = reader.readFilePoint(file, lensOf(eoaA), APPROVED, basis);
        require(before.status == 1 && before.revision.recordId == ra && before.revisionTag.present,
            "exact point control does not consume scope enumeration");
        filesIndex.declareOptional(filesIndex.FAMILY_FILES_PARENT(), 1);
        (uint8 status, uint64 from, uint64 through) =
            filesIndex.coverage(filesIndex.FAMILY_FILES_PARENT(), Keys.referenceList(childType, 0, r0));
        require(status == 1 && from == 1 && through == admissions(), "parent enumeration coverage is honestly PARTIAL");
        FilesJoinedConsumer.FilePoint memory afterDowngrade = reader.readFilePoint(file, lensOf(eoaA), APPROVED, basis);
        require(keccak256(abi.encode(afterDowngrade)) == keccak256(abi.encode(before)),
            "exact point remains unchanged without reverse-parent enumeration");
    }

    // Catches a false revision-tag assessment when HEAD is absent/masked, and treating FOUND wrong-target as yes.
    function test_absent_masked_and_wrong_target_tags_remain_qualified() public {
        _createRoot();
        FilesJoinedConsumer reader = _filesReader();
        FilesJoinedConsumer.FilePoint memory result = reader.readFilePoint(file, lensOf(eoaA), DRAFT, _basis());
        _assertRevision(result.revision, r0, rootType, 0, "Meeting at 10:00.\n");
        require(result.revisionTag.present && result.revisionTag.subject == r0, "root draft selected");
        result = reader.readFilePoint(file, lensOf(address(bob)), APPROVED, _basis());
        require(result.status == 0 && result.revision.recordId == 0 && !result.revisionTag.evaluated
            && result.revisionTag.subject == 0, "absent HEAD has no evaluated revision tag");
        _signedActions(one(aBind(TAG, file, PROJECT_EFS, r0, 1)), new bytes[](1));
        result = reader.readFilePoint(file, lensOf(eoaA), PROJECT_EFS, _basis());
        require(result.fileTag.evaluated && result.fileTag.status == 1 && result.fileTag.target == r0
            && !result.fileTag.present, "FOUND wrong target is not a positive File tag");
        _signedActions(one(aUnbind(TAG, r0, DRAFT, 1)), new bytes[](1));
        result = reader.readFilePoint(file, lensOf(eoaA), DRAFT, _basis());
        require(result.revisionTag.evaluated && result.revisionTag.status == 2 && !result.revisionTag.present,
            "masked revision tag is not absence or yes");
        _signedActions(one(aUnbind(HEAD, file, NO_ROLE, 1)), new bytes[](1));
        result = reader.readFilePoint(file, lensOf(eoaA, address(bob)), DRAFT, _basis());
        require(result.status == 2 && result.revision.recordId == 0 && !result.revisionTag.evaluated
            && result.revisionTag.subject == 0, "masked HEAD has no evaluated revision tag");
    }

    // Task 3 helpers are additive. PUBLISHED is the inherited local /published hash;
    // none of these role hashes claims cold reconstruction of a filename.
    function _lifeHead(address author, bytes32 purpose, bytes32 subject, bytes32 role,
        uint8 state, uint32 revision, bytes32 target) internal view
    {
        (uint8 s, uint32 r, bytes32 t) = headOf(author, purpose, subject, role);
        require(s == state && r == revision && t == target, "lifecycle exact raw head");
    }

    function _lifeCursor(LensReader.Cursor memory cursor, bytes32 folder, address[] memory authors,
        FilesJoinedConsumer.Basis memory basis) internal pure
    {
        require(cursor.basisAdmission == basis.admission && cursor.indexGeneration == basis.generation
            && cursor.rulesEpoch == basis.epoch && cursor.coreCodeCommitment == basis.core
            && cursor.scopeKey == keccak256(abi.encode(FOLDER, folder))
            && cursor.lensHash == keccak256(abi.encodePacked(authors)), "lifecycle full current context");
    }

    function _lifePlain(bytes32 folder, address[] memory authors, bytes32 expectedFile, bytes32 role,
        address author, uint32 revision, FilesJoinedConsumer.Basis memory basis) internal view
    {
        LensReader.Cursor memory fresh;
        LensReader.Page memory page = lens.list(authors, FOLDER, folder, fresh, 2);
        _lifeCursor(page.next, folder, authors, basis);
        uint256 count = expectedFile == 0 ? 0 : 1;
        require(page.status == 2 && !page.mutated && page.scanned == 2 && page.rawTotal == 2
            && page.items.length == count && page.selectedSoFar == count && page.next.selectedSoFar == count
            && page.next.lensIndex == authors.length && page.next.rawIndex == 0, "lifecycle exhausted plain window");
        if (count == 1) {
            LensReader.Entry memory entry = page.items[0];
            require(entry.position == Keys.position(FOLDER, folder, role) && entry.target == expectedFile
                && entry.author == author && entry.revision == revision && entry.admission != 0
                && entry.admission <= basis.admission, "lifecycle exact selected placement");
        }
    }

    function _lifePath(address[] memory authors, bytes32 folder, bytes32 role, uint8 expectedStatus,
        bytes32 expectedTarget, uint32 expectedRevision, address expectedAuthor) internal view
    {
        (uint8 status, bytes32 target, uint32 revision, address author, uint64 at) =
            lens.resolve(authors, FOLDER, folder, role);
        require(status == expectedStatus && target == expectedTarget && revision == expectedRevision
            && author == expectedAuthor && at != 0 && at <= admissions(), "lifecycle exact path selection");
    }

    function _lifeTagged(FilesJoinedConsumer reader, bytes32 folder, address[] memory authors,
        bytes32 concept, FilesJoinedConsumer.TagScope scope, bytes32 expected,
        FilesJoinedConsumer.Basis memory basis) internal view
    {
        FilesJoinedConsumer.FolderResult memory result =
            reader.readFolderTaggedOnce(folder, authors, concept, scope, 2, basis);
        _lifeCursor(result.next, folder, authors, basis);
        require(result.status == 2 && !result.mutated && result.next.lensIndex == authors.length
            && result.next.rawIndex == 0, "lifecycle exhausted tagged window");
        require(result.files.length == (expected == 0 ? 0 : 1), "lifecycle exact tagged live set");
        if (expected != 0) {
            FilesJoinedConsumer.FilePoint memory point = result.files[0];
            require(point.status == 1 && point.file == file, "lifecycle tag join selects F only");
            _assertRevision(point.revision, expected, childType, expected == rr ? ra : r0,
                expected == rb ? "Meeting at 09:00.\n" : expected == ra ? "Meeting at 11:00.\n" : "Meeting at 10:00.\n");
            FilesJoinedConsumer.TagAssessment memory tag = scope == FilesJoinedConsumer.TagScope.File
                ? point.fileTag : point.revisionTag;
            require(tag.evaluated && tag.present && tag.status == 1 && tag.target == file
                && tag.subject == (scope == FilesJoinedConsumer.TagScope.File ? file : expected), "lifecycle qualified tag join");
        }
    }

    // No graph writes in this checkpoint: plain/path/point/tag views share one fresh current basis.
    function _lifeRevisionEvidence(bytes32 recordId, address author, uint8 proof) internal view {
        (, uint64 first,,) = ledger.record(recordId);
        (,, uint64 publication,,,,,) = ledger.admission(first);
        _assertEvidence(publication, author, proof); // retained local evidence, not portable native source proof
    }

    function _lifeCheckpoint(FilesJoinedConsumer reader, bytes32 g, bytes32 rg, bool masked, bool restored) internal view {
        FilesJoinedConsumer.Basis memory basis = _basis();
        for (uint256 i; i < 2; ++i) {
            bool aliceFirst = i == 0;
            address[] memory authors = aliceFirst ? lensOf(eoaA, address(bob)) : lensOf(address(bob), eoaA);
            bytes32 selected = aliceFirst ? (restored ? rr : ra) : rb;
            bool visible = !masked || !aliceFirst;
            _lifePlain(DRAFTS, authors, g, name("note.txt"), eoaA, 3, basis);
            _lifePath(authors, DRAFTS, name("note.txt"), 1, g, 3, eoaA);
            _lifePath(authors, DRAFTS, name("brief.txt"), 2, 0, 2, eoaA);
            _lifePlain(PUBLISHED, authors, visible ? file : bytes32(0), name("brief.txt"),
                aliceFirst ? eoaA : address(bob), aliceFirst ? (restored ? 3 : 1) : 1, basis);
            _lifePath(authors, PUBLISHED, name("brief.txt"), visible ? 1 : 2, visible ? file : bytes32(0),
                aliceFirst ? (masked ? 2 : restored ? 3 : 1) : 1, aliceFirst ? eoaA : address(bob));
            FilesJoinedConsumer.FilePoint memory replacement = reader.readFilePoint(g, authors, PROJECT_EFS, basis);
            require(replacement.status == 1 && replacement.file == g && replacement.revision.recordId == rg
                && replacement.revision.typeId == rootType && replacement.revision.parent == 0
                && replacement.revision.file == g && keccak256(replacement.revision.document) == keccak256(bytes("Replacement file.\n"))
                && replacement.revision.documentHash == keccak256(bytes("Replacement file.\n"))
                && replacement.fileTag.evaluated && !replacement.fileTag.present && replacement.fileTag.status == 0
                && replacement.fileTag.subject == g, "lifecycle exact unrelated replacement and absent project tag");
            replacement = reader.readFilePoint(g, authors, APPROVED, basis);
            require(replacement.revisionTag.evaluated && replacement.revisionTag.subject == rg
                && replacement.revisionTag.status == 0 && !replacement.revisionTag.present, "G does not inherit approval");
            FilesJoinedConsumer.FilePoint memory point = reader.readFilePoint(file, authors, APPROVED, basis);
            require(point.status == 1 && point.file == file, "exact F survives namespace masking");
            _lifeRevisionEvidence(selected, aliceFirst ? eoaA : address(bob),
                aliceFirst ? ledger.PROOF_SIGNED() : ledger.PROOF_NATIVE());
            _assertRevision(point.revision, selected, childType, restored && aliceFirst ? ra : r0,
                aliceFirst ? (restored ? "Meeting at 10:00.\n" : "Meeting at 11:00.\n") : "Meeting at 09:00.\n");
            require(point.revisionTag.evaluated && point.revisionTag.subject == selected
                && point.revisionTag.present == (aliceFirst && !restored)
                && point.revisionTag.status == (aliceFirst && !restored ? 1 : 0), "selected revision approval stays local");
            point = reader.readFilePoint(file, authors, PROJECT_EFS, basis);
            require(point.fileTag.evaluated && point.fileTag.subject == file && point.fileTag.target == file
                && point.fileTag.status == 1 && point.fileTag.present, "File tag independent of namespace visibility");
            _lifeTagged(reader, DRAFTS, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File, 0, basis);
            _lifeTagged(reader, DRAFTS, authors, APPROVED, FilesJoinedConsumer.TagScope.SelectedRevision, 0, basis);
            _lifeTagged(reader, PUBLISHED, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File,
                visible ? selected : bytes32(0), basis);
            _lifeTagged(reader, PUBLISHED, authors, APPROVED, FilesJoinedConsumer.TagScope.SelectedRevision,
                visible && aliceFirst && !restored ? ra : bytes32(0), basis);
            if (restored) {
                point = reader.readFilePoint(file, authors, DRAFT, basis);
                require(point.revisionTag.evaluated && point.revisionTag.subject == selected
                    && point.revisionTag.status == 0 && !point.revisionTag.present, "old document does not transfer draft tag");
                _lifeTagged(reader, PUBLISHED, authors, DRAFT, FilesJoinedConsumer.TagScope.SelectedRevision, 0, basis);
            }
        }
    }

    function _lifeEmptyPartial(FilesJoinedConsumer reader) internal view {
        address[] memory authors = lensOf(eoaA, address(bob));
        FilesJoinedConsumer.Basis memory basis = _basis();
        LensReader.Cursor memory fresh;
        LensReader.Page memory first = lens.list(authors, FOLDER, DRAFTS, fresh, 1);
        _lifeCursor(first.next, DRAFTS, authors, basis);
        require(first.status == 1 && !first.mutated && first.items.length == 0 && first.scanned == 1
            && first.rawTotal == 2 && first.selectedSoFar == 0 && first.next.selectedSoFar == 0
            && first.next.lensIndex == 0 && first.next.rawIndex == 1, "empty partial page is non-final");
        LensReader.Page memory last = lens.list(authors, FOLDER, DRAFTS, first.next, 1);
        _lifeCursor(last.next, DRAFTS, authors, basis);
        require(last.status == 2 && !last.mutated && last.items.length == 0 && last.scanned == 1
            && last.rawTotal == 2 && last.selectedSoFar == 0 && last.next.selectedSoFar == 0
            && last.next.lensIndex == authors.length && last.next.rawIndex == 0, "same-state continuation completes empty");
        _rejectRead(reader, abi.encodeCall(reader.readFolderTaggedOnce,
            (DRAFTS, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File, 1, basis)), FilesJoinedConsumer.E_INCOMPLETE.selector);
    }

    function _lifeHeadDigest(address author, bytes32 purpose, bytes32 subject, bytes32 role) internal view returns (bytes32) {
        (uint8 state, uint32 revision, uint64 at, uint64 previous, uint64 ordinal, bytes32 target) =
            ledger.head(Keys.binding(pid(author), Keys.position(purpose, subject, role)));
        return keccak256(abi.encode(state, revision, at, previous, ordinal, target));
    }

    function _lifePartialAfterReuse(FilesJoinedConsumer reader, bytes32 g) internal view {
        address[] memory authors = lensOf(eoaA, address(bob));
        FilesJoinedConsumer.Basis memory basis = _basis();
        LensReader.Cursor memory fresh;
        LensReader.Page memory page = lens.list(authors, FOLDER, DRAFTS, fresh, 1);
        _lifeCursor(page.next, DRAFTS, authors, basis);
        require(page.status == 1 && !page.mutated && page.scanned == 1 && page.rawTotal == 2
            && page.items.length <= 1 && page.selectedSoFar == page.items.length
            && page.next.lensIndex == 0 && page.next.rawIndex == 1, "reuse budget1 remains non-final regardless of posting order");
        if (page.items.length != 0) require(page.items[0].target == g
            && page.items[0].position == Keys.position(FOLDER, DRAFTS, name("note.txt"))
            && page.items[0].revision == 3 && page.items[0].author == eoaA, "partial item is exact G placement, never old F");
        _rejectRead(reader, abi.encodeCall(reader.readFolderTaggedOnce,
            (DRAFTS, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File, 1, basis)), FilesJoinedConsumer.E_INCOMPLETE.selector);
    }

    function _lifeReuseSnapshot(bytes32 g) internal view returns (bytes32 digest) {
        digest = keccak256(abi.encode(_stateSnapshot(), ledger.nonces(address(bob)),
            filesIndex.lastProcessed(), filesIndex.lastPublication(), filesIndex.gapped(),
            _lifeHeadDigest(eoaA, HEAD, file, NO_ROLE), _lifeHeadDigest(address(bob), HEAD, file, NO_ROLE),
            _lifeHeadDigest(eoaA, HEAD, g, NO_ROLE), _lifeHeadDigest(eoaA, FOLDER, DRAFTS, name("note.txt")),
            _lifeHeadDigest(eoaA, FOLDER, DRAFTS, name("brief.txt")),
            _lifeHeadDigest(eoaA, FOLDER, PUBLISHED, name("brief.txt")),
            _lifeHeadDigest(address(bob), FOLDER, PUBLISHED, name("brief.txt"))));
        bytes32[9] memory keys = [Keys.byTypeList(rootType), Keys.byTypeList(childType), Keys.byAuthorList(pid(eoaA)),
            Keys.historyList(Keys.binding(pid(eoaA), Keys.position(HEAD, g, NO_ROLE))),
            Keys.historyList(Keys.binding(pid(eoaA), Keys.position(FOLDER, DRAFTS, name("note.txt")))),
            Keys.scopeList(Keys.scope(pid(eoaA), HEAD, g)), Keys.scopeList(Keys.scope(pid(eoaA), FOLDER, DRAFTS)),
            Keys.referenceList(childType, 0, r0), Keys.referenceList(childType, 0, ra)];
        for (uint256 i; i < keys.length; ++i) digest = keccak256(abi.encode(digest, _postingDigest(keys[i])));
    }

    function _lifeReuseOldPath() internal returns (bytes32 g, bytes32 rg) {
        g = subjectOf(eoaA, 404);
        bytes memory body = _rootBody(g, bytes("Replacement file.\n"));
        rg = Keys.recordFromHash(rootType, keccak256(body));
        Ledger.Action[] memory actions = new Ledger.Action[](4);
        bytes[] memory bodies = new bytes[](4);
        actions[0] = aCreate(bytes32(uint256(404)));
        actions[1] = aPublish(rootType, body);
        bodies[1] = body;
        actions[2] = aBind(HEAD, g, NO_ROLE, rg, 0);
        actions[3] = aBind(FOLDER, DRAFTS, name("note.txt"), g, 0); // intentionally stale, actual tombstone is 2
        bytes32 beforeState = _lifeReuseSnapshot(g);
        (Ledger.Intent memory intent, bytes memory sig) = signed(PK_A, ledger, ledger.nonces(eoaA), actions);
        try ledger.executeSigned(intent, actions, bodies, sig) { revert("stale reuse CAS accepted"); }
        catch (bytes memory err) {
            require(keccak256(err) == keccak256(abi.encodeWithSelector(Ledger.E_CAS.selector,
                Keys.binding(pid(eoaA), Keys.position(FOLDER, DRAFTS, name("note.txt"))), uint32(0), uint32(2))),
                "exact reused-path E_CAS expected0 actual2");
        }
        require(_lifeReuseSnapshot(g) == beforeState, "reuse rollback tested nonce counts heads and posting bodies");
        require(ledger.subjectCreatedAt(g) == 0, "failed G creation absent");
        (bytes32 t, uint64 first, uint32 occurrences, bytes memory data) = ledger.record(rg);
        require(t == 0 && first == 0 && occurrences == 0 && data.length == 0, "failed RG publication absent");
        actions[3].expectedRevision = 2; // same four-action shape, genuine successful control
        _assertEvidence(_signedActions(actions, bodies), eoaA, ledger.PROOF_SIGNED());
        require(ledger.subjectCreatedAt(g) != 0 && g != file && rg != r0, "successful distinct G and RG");
        _assertRecord(rg, rootType, body);
        _lifeHead(eoaA, HEAD, g, NO_ROLE, 1, 1, rg);
        _lifeHead(eoaA, FOLDER, DRAFTS, name("note.txt"), 1, 3, g);
    }

    function _lifeHistory(bytes32 folder, bytes32 role, uint64 basis, bool expectedLive,
        bytes32 expectedTarget, uint32 expectedRevision) internal view
    {
        (uint8 status, bool live, bytes32 target, uint32 revision, uint64 at) =
            lens.historyByRole(eoaA, FOLDER, folder, role, basis);
        require(status == 2 && live == expectedLive && target == expectedTarget && revision == expectedRevision
            && at != 0 && at <= basis, "lifecycle exact sealed as-of state, not history array");
    }

    // Catches reset-on-tombstone CAS, fall-through whiteouts, ghost/duplicate placements,
    // revision-tag inheritance and empty-PARTIAL promoted to COMPLETE. Existing behavior;
    // the real stale-CAS negative and expected2 control do not require a manufactured RED.
    function test_real_files_move_reuse_whiteout_restore() public {
        _createRoot();
        uint64 rootBasis = admissions();
        _publishBranches();
        _lifeHead(eoaA, HEAD, file, NO_ROLE, 1, 2, ra);
        _lifeHead(address(bob), HEAD, file, NO_ROLE, 1, 1, rb);
        _lifeHead(eoaA, FOLDER, DRAFTS, name("note.txt"), 1, 1, file);
        bytes32 revisionState = keccak256(abi.encode(ledger.body(r0), ledger.body(ra), ledger.body(rb),
            _lifeHeadDigest(eoaA, HEAD, file, NO_ROLE), _lifeHeadDigest(address(bob), HEAD, file, NO_ROLE)));
        _assertEvidence(_signedActions(two(aUnbind(FOLDER, DRAFTS, name("note.txt"), 1),
            aBind(FOLDER, DRAFTS, name("brief.txt"), file, 0)), new bytes[](2)), eoaA, ledger.PROOF_SIGNED());
        uint64 renameBasis = admissions();
        _lifeHead(eoaA, FOLDER, DRAFTS, name("note.txt"), 2, 2, 0);
        _lifeHead(eoaA, FOLDER, DRAFTS, name("brief.txt"), 1, 1, file);
        _assertEvidence(_signedActions(two(aUnbind(FOLDER, DRAFTS, name("brief.txt"), 1),
            aBind(FOLDER, PUBLISHED, name("brief.txt"), file, 0)), new bytes[](2)), eoaA, ledger.PROOF_SIGNED());
        uint64 moveBasis = admissions();
        (uint64 bobPlacement,) = bob.execute(one(aBind(FOLDER, PUBLISHED, name("brief.txt"), file, 0)), new bytes[](1));
        _assertEvidence(bobPlacement, address(bob), ledger.PROOF_NATIVE());
        _lifeHead(eoaA, FOLDER, DRAFTS, name("brief.txt"), 2, 2, 0);
        _lifeHead(eoaA, FOLDER, PUBLISHED, name("brief.txt"), 1, 1, file);
        _lifeHead(address(bob), FOLDER, PUBLISHED, name("brief.txt"), 1, 1, file);
        require(revisionState == keccak256(abi.encode(ledger.body(r0), ledger.body(ra), ledger.body(rb),
            _lifeHeadDigest(eoaA, HEAD, file, NO_ROLE), _lifeHeadDigest(address(bob), HEAD, file, NO_ROLE))),
            "rename and move preserve exact Records and both HEADs");
        require(rr == 0, "RR not seeded before atomic restore");
        FilesJoinedConsumer reader = _filesReader();
        _lifeEmptyPartial(reader);
        (bytes32 g, bytes32 rg) = _lifeReuseOldPath();
        uint64 reuseBasis = admissions();
        _lifePartialAfterReuse(reader, g);
        _lifeCheckpoint(reader, g, rg, false, false);
        _assertEvidence(_signedActions(one(aUnbind(FOLDER, PUBLISHED, name("brief.txt"), 1)), new bytes[](1)),
            eoaA, ledger.PROOF_SIGNED());
        uint64 whiteoutBasis = admissions();
        _lifeHead(eoaA, FOLDER, PUBLISHED, name("brief.txt"), 2, 2, 0);
        _lifeCheckpoint(reader, g, rg, true, false);
        bytes memory restoredBody = _childBody(ra, file, bytes("Meeting at 10:00.\n"));
        rr = Keys.recordFromHash(childType, keccak256(restoredBody));
        Ledger.Action[] memory restore = new Ledger.Action[](3);
        bytes[] memory restoreBodies = new bytes[](3);
        restore[0] = aPublish(childType, restoredBody);
        restoreBodies[0] = restoredBody;
        restore[1] = aBind(HEAD, file, NO_ROLE, rr, 2);
        restore[2] = aBind(FOLDER, PUBLISHED, name("brief.txt"), file, 2);
        _assertEvidence(_signedActions(restore, restoreBodies), eoaA, ledger.PROOF_SIGNED());
        uint64 restoreBasis = admissions();
        require(restoreBasis == whiteoutBasis + 3, "restore is one three-action publication");
        _assertRecord(rr, childType, restoredBody);
        _assertRecord(r0, rootType, _rootBody(file, bytes("Meeting at 10:00.\n")));
        _assertRecord(ra, childType, _childBody(r0, file, bytes("Meeting at 11:00.\n")));
        _assertRecord(rb, childType, _childBody(r0, file, bytes("Meeting at 09:00.\n")));
        require(rr != r0 && keccak256(ledger.body(rr)) != keccak256(ledger.body(r0)), "equal documents different Root and Child bodies");
        _lifeHead(eoaA, HEAD, file, NO_ROLE, 1, 3, rr);
        _lifeHead(address(bob), HEAD, file, NO_ROLE, 1, 1, rb);
        _lifeHead(eoaA, FOLDER, PUBLISHED, name("brief.txt"), 1, 3, file);
        _lifeCheckpoint(reader, g, rg, false, true);
        _assertParents(r0, ra, rb);
        _assertParents(ra, rr, 0);
        (uint64 unrelatedCount,,,) = filesIndex.postingHead(Keys.referenceList(childType, 0, rg));
        require(unrelatedCount == 0 && filesIndex.postingAt(Keys.referenceList(childType, 0, rg), 0) == 0,
            "G root has no F children");
        _lifeHistory(DRAFTS, name("note.txt"), rootBasis, true, file, 1);
        _lifeHistory(DRAFTS, name("note.txt"), renameBasis, false, 0, 2);
        _lifeHistory(DRAFTS, name("note.txt"), reuseBasis, true, g, 3);
        _lifeHistory(DRAFTS, name("brief.txt"), renameBasis, true, file, 1);
        _lifeHistory(DRAFTS, name("brief.txt"), moveBasis, false, 0, 2);
        _lifeHistory(PUBLISHED, name("brief.txt"), moveBasis, true, file, 1);
        _lifeHistory(PUBLISHED, name("brief.txt"), whiteoutBasis, false, 0, 2);
        _lifeHistory(PUBLISHED, name("brief.txt"), restoreBasis, true, file, 3);
    }

    // Optional bounded churn control: catches budgeting by the live set instead of
    // retained distinct names. Two additional masked names must still cost scans.
    function test_real_files_two_name_churn_requires_four_scans() public {
        _createRoot();
        _assertEvidence(_signedActions(two(aUnbind(FOLDER, DRAFTS, name("note.txt"), 1),
            aBind(FOLDER, DRAFTS, name("brief.txt"), file, 0)), new bytes[](2)), eoaA, ledger.PROOF_SIGNED());
        _assertEvidence(_signedActions(one(aUnbind(FOLDER, DRAFTS, name("brief.txt"), 1)), new bytes[](1)),
            eoaA, ledger.PROOF_SIGNED());
        (bytes32 g, bytes32 rg) = _lifeReuseOldPath();
        FilesJoinedConsumer reader = _filesReader();
        address[] memory authors = lensOf(eoaA, address(bob));
        FilesJoinedConsumer.Basis memory beforeBasis = _basis();
        _lifePlain(DRAFTS, authors, g, name("note.txt"), eoaA, 3, beforeBasis);
        LensReader.Cursor memory fresh;
        LensReader.Page memory beforePage = lens.list(authors, FOLDER, DRAFTS, fresh, 2);
        bytes32 scope = Keys.scopeList(Keys.scope(pid(eoaA), FOLDER, DRAFTS));
        (uint64 beforeCount,,,) = filesIndex.postingHead(scope);
        require(beforeCount == 2, "two distinct lifetime names before churn");
        FilesJoinedConsumer.FilePoint memory beforePoint = reader.readFilePoint(g, authors, PROJECT_EFS, beforeBasis);
        require(beforePoint.status == 1 && beforePoint.file == g && beforePoint.revision.recordId == rg,
            "real G selected before churn");
        bytes32 fHead = _lifeHeadDigest(eoaA, HEAD, file, NO_ROLE);
        bytes32 gHead = _lifeHeadDigest(eoaA, HEAD, g, NO_ROLE);
        bytes32 tempA = name("temporary-a.txt");
        bytes32 tempB = name("temporary-b.txt");
        require(tempA != tempB && tempA != name("note.txt") && tempA != name("brief.txt")
            && tempB != name("note.txt") && tempB != name("brief.txt"), "two genuinely new role hashes");
        _lifeHead(eoaA, FOLDER, DRAFTS, tempA, 0, 0, 0);
        _lifeHead(eoaA, FOLDER, DRAFTS, tempB, 0, 0, 0);
        _assertEvidence(_signedActions(two(aBind(FOLDER, DRAFTS, tempA, file, 0),
            aBind(FOLDER, DRAFTS, tempB, file, 0)), new bytes[](2)), eoaA, ledger.PROOF_SIGNED());
        _lifeHead(eoaA, FOLDER, DRAFTS, tempA, 1, 1, file);
        _lifeHead(eoaA, FOLDER, DRAFTS, tempB, 1, 1, file);
        _assertEvidence(_signedActions(two(aUnbind(FOLDER, DRAFTS, tempA, 1),
            aUnbind(FOLDER, DRAFTS, tempB, 1)), new bytes[](2)), eoaA, ledger.PROOF_SIGNED());
        _lifeHead(eoaA, FOLDER, DRAFTS, tempA, 2, 2, 0);
        _lifeHead(eoaA, FOLDER, DRAFTS, tempB, 2, 2, 0);
        (uint64 afterCount,,,) = filesIndex.postingHead(scope);
        require(afterCount == 4, "four retained lifetime names despite unchanged live set");
        FilesJoinedConsumer.Basis memory basis = _basis();
        LensReader.Page memory partialPage = lens.list(authors, FOLDER, DRAFTS, fresh, 2);
        _lifeCursor(partialPage.next, DRAFTS, authors, basis);
        require(partialPage.status == 1 && !partialPage.mutated && partialPage.scanned == 2 && partialPage.rawTotal == 4
            && partialPage.selectedSoFar == 1 && partialPage.next.selectedSoFar == 1
            && partialPage.next.lensIndex == 0 && partialPage.next.rawIndex == 2
            && keccak256(abi.encode(partialPage.items)) == keccak256(abi.encode(beforePage.items)),
            "budget2 sees G but cannot claim exhaustion of four names");
        _rejectRead(reader, abi.encodeCall(reader.readFolderTaggedOnce,
            (DRAFTS, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File, 2, basis)), FilesJoinedConsumer.E_INCOMPLETE.selector);
        LensReader.Page memory complete = lens.list(authors, FOLDER, DRAFTS, fresh, 4);
        _lifeCursor(complete.next, DRAFTS, authors, basis);
        require(complete.status == 2 && !complete.mutated && complete.scanned == 4 && complete.rawTotal == 4
            && complete.items.length == 1 && complete.selectedSoFar == 1 && complete.next.selectedSoFar == 1
            && complete.next.lensIndex == authors.length && complete.next.rawIndex == 0
            && keccak256(abi.encode(complete.items)) == keccak256(abi.encode(beforePage.items)),
            "budget4 exhausts four lifetime names and proves exact unchanged G placement");
        _lifePath(authors, DRAFTS, tempA, 2, 0, 2, eoaA);
        _lifePath(authors, DRAFTS, tempB, 2, 0, 2, eoaA);
        require(_lifeHeadDigest(eoaA, HEAD, file, NO_ROLE) == fHead
            && _lifeHeadDigest(eoaA, HEAD, g, NO_ROLE) == gHead, "churn does not edit either File HEAD");
        require(keccak256(abi.encode(reader.readFilePoint(g, authors, PROJECT_EFS, basis))) == keccak256(abi.encode(beforePoint)),
            "exact G revision bytes and tag assessment unchanged by name churn");
        FilesJoinedConsumer.FolderResult memory tagged = reader.readFolderTaggedOnce(
            DRAFTS, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File, 4, basis);
        _lifeCursor(tagged.next, DRAFTS, authors, basis);
        require(tagged.status == 2 && !tagged.mutated && tagged.files.length == 0
            && tagged.next.lensIndex == authors.length && tagged.next.rawIndex == 0,
            "complete tag filter excludes masked project-tagged F and untagged G");
    }

    // Catches accepting arbitrary admitted bytes or a different File's revision as this File's HEAD.
    function test_reader_rejects_nonprofile_and_wrong_file_selected_records() public {
        _createRoot();
        FilesJoinedConsumer reader = _filesReader();
        bytes32 unrelated = bob.publish(BINARY, _rootBody(file, bytes("looks like a root")));
        _signedActions(one(aBind(HEAD, file, NO_ROLE, unrelated, 1)), new bytes[](1));
        _rejectRead(reader, abi.encodeCall(reader.readFilePoint, (file, lensOf(eoaA), APPROVED, _basis())),
            FilesJoinedConsumer.E_PROFILE.selector);
        bytes32 otherFile = bob.create(bytes32(uint256(403)));
        bytes32 otherRoot = bob.publish(rootType, _rootBody(otherFile, bytes("other File")));
        _signedActions(one(aBind(HEAD, file, NO_ROLE, otherRoot, 2)), new bytes[](1));
        _rejectRead(reader, abi.encodeCall(reader.readFilePoint, (file, lensOf(eoaA), APPROVED, _basis())),
            FilesJoinedConsumer.E_PROFILE.selector);
    }
}
