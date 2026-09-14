// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {LabBase} from "./LabBase.sol";
import {LensReader} from "../src/LensReader.sol";
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
}
