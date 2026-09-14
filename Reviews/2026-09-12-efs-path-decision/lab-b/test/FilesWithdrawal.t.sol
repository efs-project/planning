// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {FilesJoinedTest} from "./FilesJoined.t.sol";
import {FilesJoinedConsumer} from "./FilesJoinedConsumer.sol";

/// Characterizes existing behavior, including an undesirable E_PROFILE conflation.
/// Not a specification approving that reader policy. No Core/profile/reader fixes.
/// Run only test_withdraw_ methods; inherited tests are not three new test results.
contract FilesWithdrawalTest is FilesJoinedTest {
    struct PostingBefore {
        uint64 count;
        uint64 live;
        uint64 last;
        uint16 flags;
        bytes32 words;
    }

    struct CountsBefore {
        uint64 admissions;
        uint64 records;
        uint64 bindings;
        uint64 publications;
        uint64 aliceNonce;
        uint64 bobNonce;
    }

    function _countsBefore() private view returns (CountsBefore memory c) {
        (c.admissions, c.records, c.bindings, c.publications) = ledger.counts();
        c.aliceNonce = ledger.nonces(eoaA);
        c.bobNonce = ledger.nonces(address(bob));
    }

    function _oneLifecycleAction(CountsBefore memory before_, bool byAlice) private view {
        (uint64 a, uint64 r, uint64 b, uint64 p) = ledger.counts();
        require(a == before_.admissions + 1 && r == before_.records && b == before_.bindings
            && p == before_.publications + 1, "one admission/publication, no new Record or Binding");
        require(ledger.nonces(eoaA) == before_.aliceNonce + (byAlice ? 1 : 0)
            && ledger.nonces(address(bob)) == before_.bobNonce + (byAlice ? 0 : 1), "only actual author's nonce advances");
    }

    function _postingWords(bytes32 key, uint64 count) private view returns (bytes32 digest) {
        for (uint64 i; i <= count / 5; ++i) digest = keccak256(abi.encode(digest, filesIndex.postingWord(key, i)));
    }

    function _postingBefore(bytes32 key) private view returns (PostingBefore memory p) {
        (p.count, p.live, p.last, p.flags) = filesIndex.postingHead(key);
        p.words = _postingWords(key, p.count);
    }

    function _releasedExactlyOnce(bytes32 key, PostingBefore memory before_) private view {
        PostingBefore memory after_ = _postingBefore(key);
        require(before_.live > 0 && after_.live + 1 == before_.live, "named occurrence list live decremented once");
        require(after_.count == before_.count && after_.last == before_.last && after_.flags == before_.flags
            && after_.words == before_.words, "named occurrence list retains exact admissions");
    }

    function _headDigest(address author, bytes32 purpose_, bytes32 subject, bytes32 role_) private view returns (bytes32) {
        bytes32 key = Keys.binding(pid(author), Keys.position(purpose_, subject, role_));
        (bool ok, bytes memory data) = address(ledger).staticcall(abi.encodeWithSelector(ledger.head.selector, key));
        require(ok, "real Core head getter");
        return keccak256(data);
    }

    function _allFixtureBindings() private view returns (bytes32) {
        return keccak256(abi.encode(
            _headDigest(eoaA, HEAD, file, NO_ROLE), _headDigest(address(bob), HEAD, file, NO_ROLE),
            _headDigest(eoaA, FOLDER, DRAFTS, name("note.txt")),
            _headDigest(eoaA, TAG, file, PROJECT_EFS), _headDigest(eoaA, TAG, r0, DRAFT),
            _headDigest(eoaA, TAG, ra, APPROVED)
        ));
    }

    function _retainedPostingState() private view returns (bytes32) {
        return keccak256(abi.encode(
            _postingDigest(Keys.referenceList(childType, 0, r0)),
            _postingDigest(Keys.referenceList(childType, 0, ra)),
            _postingDigest(Keys.referenceList(childType, 0, rb)),
            _postingDigest(Keys.scopeList(Keys.scope(pid(eoaA), FOLDER, DRAFTS))),
            _postingDigest(Keys.historyList(Keys.binding(pid(eoaA), Keys.position(HEAD, file, NO_ROLE)))),
            _postingDigest(Keys.historyList(Keys.binding(pid(address(bob)), Keys.position(HEAD, file, NO_ROLE)))),
            _postingDigest(Keys.backlinkList(r0)), _postingDigest(Keys.backlinkList(ra)),
            _postingDigest(Keys.backlinkList(rb)), _postingDigest(Keys.backlinkList(file))
        ));
    }

    function _completeCurrentFamilies() private view {
        bytes32[6] memory families = [filesIndex.FAMILY_FILES_PARENT(), filesIndex.FAMILY_SCOPE(), filesIndex.FAMILY_HISTORY(),
            filesIndex.FAMILY_BACKLINK(), filesIndex.FAMILY_BY_TYPE(), filesIndex.FAMILY_BY_AUTHOR()];
        for (uint256 i; i < families.length; ++i) {
            (uint8 status, uint64 from, uint64 through) = filesIndex.coverage(families[i], bytes32(0));
            require(status == 2 && from == 1 && through == admissions(), "current complete family-wide retained coverage");
        }
    }

    function _assertZeroRetained(bytes32 recordId, bytes32 t, uint64 first, bytes memory body) private view {
        (bytes32 gotType, uint64 gotFirst, uint32 occurrences, bytes memory gotBody) = ledger.record(recordId);
        require(gotType == t && gotFirst == first && first != 0 && occurrences == 0, "retained Record header with zero occurrences");
        require(keccak256(gotBody) == keccak256(body) && Keys.recordFromHash(t, keccak256(gotBody)) == recordId,
            "exact retained bytes and identity");
        (uint8 kind,,,,, bool withdrawn, bytes32 bodyHash, bytes32 admittedType) = ledger.admission(first);
        require(kind == 1 && withdrawn && bodyHash == keccak256(body) && admittedType == t,
            "original exact PUBLISH retained and withdrawn");
    }

    function _withdrawAliceSole(bytes32 recordId) private returns (uint64 first) {
        (bytes32 t, uint64 originalFirst, uint32 occurrences, bytes memory body) = ledger.record(recordId);
        require(occurrences == 1 && originalFirst != 0, "real sole occurrence before withdrawal");
        (,,,,, bool withdrawn,,) = ledger.admission(originalFirst);
        require(!withdrawn, "original occurrence initially maintained");
        CountsBefore memory counts_ = _countsBefore();
        bytes32 bindings_ = _allFixtureBindings();
        bytes32 retained_ = _retainedPostingState();
        bytes32 typeKey = Keys.byTypeList(t);
        bytes32 authorKey = Keys.byAuthorList(pid(eoaA));
        PostingBefore memory type_ = _postingBefore(typeKey);
        PostingBefore memory author_ = _postingBefore(authorKey);
        uint64 publication = _signedActions(one(aWithdraw(originalFirst)), new bytes[](1));
        _assertEvidence(publication, eoaA, ledger.PROOF_SIGNED());
        _oneLifecycleAction(counts_, true);
        _assertZeroRetained(recordId, t, originalFirst, body);
        require(_allFixtureBindings() == bindings_, "HEAD placement File tag and revision tag bindings unchanged");
        require(_retainedPostingState() == retained_, "named parent/history/scope/backlink postings unchanged");
        _releasedExactlyOnce(typeKey, type_);
        _releasedExactlyOnce(authorKey, author_);
        _completeCurrentFamilies();
        return originalFirst;
    }

    function _assertBobStillReads(FilesJoinedConsumer reader) private view {
        address[] memory authors = lensOf(address(bob), eoaA);
        FilesJoinedConsumer.FilePoint memory point = reader.readFilePoint(file, authors, APPROVED, _basis());
        require(point.status == 1 && point.file == file && !point.revisionTag.present, "Bob-first selected File remains readable");
        _assertRevision(point.revision, rb, childType, r0, "Meeting at 09:00.\n");
        FilesJoinedConsumer.FolderResult memory result = _folder(reader, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File);
        require(result.files.length == 1 && result.files[0].revision.recordId == rb && result.files[0].fileTag.present,
            "Bob-first File tag folder succeeds");
        result = _folder(reader, authors, APPROVED, FilesJoinedConsumer.TagScope.SelectedRevision);
        require(result.files.length == 0 && result.next.selectedSoFar == 1, "Bob approved is complete empty after placement selection");
    }

    function _validControls(FilesJoinedConsumer reader) private view {
        address[] memory authors = lensOf(eoaA, address(bob));
        FilesJoinedConsumer.FilePoint memory point = reader.readFilePoint(file, authors, APPROVED, _basis());
        require(point.status == 1 && point.file == file && point.revisionTag.present, "valid Alice approved point control");
        _assertRevision(point.revision, ra, childType, r0, "Meeting at 11:00.\n");
        FilesJoinedConsumer.FolderResult memory result = _folder(reader, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File);
        require(result.files.length == 1 && result.files[0].revision.recordId == ra, "valid Alice File folder control");
        result = _folder(reader, authors, APPROVED, FilesJoinedConsumer.TagScope.SelectedRevision);
        require(result.files.length == 1 && result.files[0].revision.recordId == ra, "valid Alice revision folder control");
        FilesJoinedConsumer.ConflictResult memory conflict = reader.readFileConflict(file, authors, PROJECT_EFS, _basis());
        require(conflict.status == 3 && conflict.candidates.length == 2, "valid conflict control");
        _assertBobStillReads(reader);
    }

    function _profileError(FilesJoinedConsumer reader, bytes memory callData) private view {
        (bool ok, bytes memory data) = address(reader).staticcall(callData);
        require(!ok && keccak256(data) == keccak256(abi.encodeWithSelector(FilesJoinedConsumer.E_PROFILE.selector)),
            "characterization: exact E_PROFILE, not stale basis or missing data");
    }

    function _aliceReadFailures(FilesJoinedConsumer reader) private view {
        address[] memory authors = lensOf(eoaA, address(bob));
        FilesJoinedConsumer.Basis memory basis = _basis();
        _profileError(reader, abi.encodeCall(reader.readFilePoint, (file, authors, APPROVED, basis)));
        _profileError(reader, abi.encodeCall(reader.readFileConflict, (file, authors, PROJECT_EFS, basis)));
        _profileError(reader, abi.encodeCall(reader.readFolderTaggedOnce,
            (DRAFTS, authors, PROJECT_EFS, FilesJoinedConsumer.TagScope.File, 8, basis)));
        _profileError(reader, abi.encodeCall(reader.readFolderTaggedOnce,
            (DRAFTS, authors, APPROVED, FilesJoinedConsumer.TagScope.SelectedRevision, 8, basis)));
    }

    function test_withdraw_selected_revision_retained_but_reads_reject() public {
        _createRoot();
        _publishBranches();
        FilesJoinedConsumer reader = _filesReader();
        _validControls(reader);
        _assertParents(r0, ra, rb);
        _withdrawAliceSole(ra);
        _assertParents(r0, ra, rb); // retained parent membership is not current validity
        (uint8 state, uint32 revision, bytes32 target) = headOf(eoaA, HEAD, file, NO_ROLE);
        require(state == 1 && revision == 2 && target == ra, "Alice still explicitly selects RA");
        _aliceReadFailures(reader);
        _assertBobStillReads(reader);
    }

    function _publishNewChild(bytes32 parent, bytes memory document, bool select) private returns (bytes32 recordId) {
        bytes memory body = _childBody(parent, file, document);
        recordId = Keys.recordFromHash(childType, keccak256(body));
        (bytes32 absent,,,) = ledger.record(recordId);
        require(absent == 0, "distinct new revision, not reuse");
        Ledger.Action[] memory actions = new Ledger.Action[](select ? 2 : 1);
        bytes[] memory bodies = new bytes[](actions.length);
        actions[0] = aPublish(childType, body);
        bodies[0] = body;
        if (select) actions[1] = aBind(HEAD, file, NO_ROLE, recordId, 2);
        _assertEvidence(_signedActions(actions, bodies), eoaA, ledger.PROOF_SIGNED());
        _assertRecord(recordId, childType, body);
    }

    function _threeRootChildren(bytes32 third) private view {
        bytes32 key = Keys.referenceList(childType, 0, r0);
        (uint64 count, uint64 live,, uint16 flags) = filesIndex.postingHead(key);
        require(count == 3 && live == 3 && flags == 1, "exact three retained Root children");
        (, uint64 a,,) = ledger.record(ra);
        (, uint64 b,,) = ledger.record(rb);
        (, uint64 c,,) = ledger.record(third);
        require(filesIndex.postingAt(key, 0) == a && filesIndex.postingAt(key, 1) == b
            && filesIndex.postingAt(key, 2) == c && filesIndex.postingAt(key, 3) == 0, "exact first-admission parent list exhausted");
    }

    function test_withdraw_parent_keeps_descendants_and_new_child_admissible() public {
        _createRoot();
        _publishBranches();
        FilesJoinedConsumer reader = _filesReader();
        _validControls(reader);
        uint64 rootFirst = _withdrawAliceSole(r0);
        _validControls(reader); // live RA/RB decode retained zero-occurrence Root header
        bytes32 newChild = _publishNewChild(r0, bytes("Meeting at 12:00.\n"), false);
        _threeRootChildren(newChild);
        _completeCurrentFamilies();
        uint64 aliceFirst = _withdrawAliceSole(ra);
        _aliceReadFailures(reader); // positive gate for the currently selected zero-count failure
        bytes32 grandchild = _publishNewChild(ra, bytes("Meeting at 08:00.\n"), true);
        _assertParents(ra, grandchild, 0);
        _threeRootChildren(newChild);
        FilesJoinedConsumer.FilePoint memory point = reader.readFilePoint(file, lensOf(eoaA, address(bob)), PROJECT_EFS, _basis());
        require(point.status == 1 && point.fileTag.present, "new grandchild selected and File tag retained");
        _assertRevision(point.revision, grandchild, childType, ra, "Meeting at 08:00.\n");
        _assertZeroRetained(r0, rootType, rootFirst, _rootBody(file, bytes("Meeting at 10:00.\n")));
        _assertZeroRetained(ra, childType, aliceFirst, _childBody(r0, file, bytes("Meeting at 11:00.\n")));
        _completeCurrentFamilies();
        _assertBobStillReads(reader);
    }

    function test_withdraw_other_author_reuse_restores_read_without_head_change() public {
        _createRoot();
        _publishBranches();
        FilesJoinedConsumer reader = _filesReader();
        _validControls(reader);
        uint64 original = _withdrawAliceSole(ra);
        _aliceReadFailures(reader);
        bytes32 bindings_ = _allFixtureBindings();
        bytes32 retained_ = _retainedPostingState();
        CountsBefore memory counts_ = _countsBefore();
        (uint64 publication, uint64 admission_) = bob.execute(one(aReuse(childType, ra)), new bytes[](1));
        _assertEvidence(publication, address(bob), ledger.PROOF_NATIVE());
        _oneLifecycleAction(counts_, false);
        (uint8 kind,,,,, bool reuseWithdrawn, bytes32 reused,) = ledger.admission(admission_);
        require(kind == 2 && !reuseWithdrawn && reused == ra, "Bob made a real maintained REUSE occurrence");
        (, uint64 first, uint32 occurrences,) = ledger.record(ra);
        require(first == original && occurrences == 1, "one aggregate maintainer without replacing first admission");
        (,,,,, bool aliceWithdrawn,,) = ledger.admission(original);
        require(aliceWithdrawn, "Alice original publication remains withdrawn");
        require(_allFixtureBindings() == bindings_ && _retainedPostingState() == retained_,
            "Bob REUSE changed no HEAD placement tag or retained parent membership");
        _assertParents(r0, ra, rb);
        _completeCurrentFamilies();
        _validControls(reader); // Alice-first returns RA again despite Alice's still-withdrawn occurrence
    }
}
