// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {Keys} from "../src/Keys.sol";
import {TypeRegistry} from "../src/TypeRegistry.sol";
import {FilesLayout, FilesChildRule, FilesParentIndex} from "./FilesJoinedProfile.sol";

/// Disposable unrelated Files consumer, not a production grammar or result API.
/// All composition is current-state in one EVM call. Profile identity and retained
/// admission are verified; this does not re-run mutable application policy or prove
/// historical native authorship. Full inline document reads are not a gas optimization.
contract FilesJoinedConsumer {
    bytes32 private constant HEAD = keccak256("efs2/purpose/head/1");
    bytes32 private constant FOLDER = keccak256("efs2/purpose/folder/1");
    bytes32 private constant TAG = keccak256("efs2/purpose/tag/1");

    enum TagScope { File, SelectedRevision }
    struct Basis { uint64 admission; uint64 generation; uint64 epoch; bytes32 core; }
    struct TagAssessment { bytes32 subject; bytes32 target; uint8 status; bool evaluated; bool present; }
    struct Revision {
        bytes32 recordId;
        bytes32 typeId;
        bytes32 parent;
        bytes32 file;
        bytes document;
        bytes32 documentHash;
    }
    struct FilePoint {
        uint8 status;
        bytes32 file;
        Revision revision;
        TagAssessment fileTag;
        TagAssessment revisionTag;
    }
    struct ConflictCandidate { LensReader.Entry binding; Revision revision; }
    // Deliberately no overall selected revision or overall revision-tag assessment.
    struct ConflictResult { uint8 status; bytes32 file; TagAssessment fileTag; ConflictCandidate[] candidates; }
    struct FolderResult { uint8 status; bool mutated; LensReader.Cursor next; FilePoint[] files; }

    Ledger public immutable ledger;
    LensReader public immutable lensReader;
    FilesParentIndex public immutable filesIndex;
    bytes32 public immutable rootType;
    bytes32 public immutable childType;
    bytes32 public immutable expectedRootRuleHash;
    bytes32 public immutable expectedChildRuleHash;
    bytes32 private immutable coreCodeHash;
    bytes32 private immutable lensCodeHash;
    bytes32 private immutable indexCodeHash;

    error E_BASIS();
    error E_INCOMPLETE();
    error E_PROFILE();

    constructor(Ledger ledger_, LensReader lens_, FilesParentIndex index_, bytes32 rootType_, bytes32 childType_,
        bytes32 rootHash_, bytes32 childHash_)
    {
        if (address(ledger_).code.length == 0 || address(lens_).code.length == 0 || address(index_).code.length == 0)
            revert E_PROFILE();
        ledger = ledger_;
        lensReader = lens_;
        filesIndex = index_;
        rootType = rootType_;
        childType = childType_;
        expectedRootRuleHash = rootHash_;
        expectedChildRuleHash = childHash_;
        coreCodeHash = address(ledger_).codehash;
        lensCodeHash = address(lens_).codehash;
        indexCodeHash = address(index_).codehash;
        _checkBinding();
        _checkProfile();
    }

    function _checkBinding() private view {
        if (address(ledger).codehash != coreCodeHash || address(lensReader).codehash != lensCodeHash
            || address(filesIndex).codehash != indexCodeHash || ledger.indexModule() != address(filesIndex)
            || address(lensReader.ledger()) != address(ledger) || address(lensReader.index()) != address(filesIndex)
            || filesIndex.ledger() != address(ledger)) revert E_BASIS();
    }

    function _checkProfile() private view {
        if (rootType == 0 || childType == 0 || rootType == childType || filesIndex.rootType() != rootType
            || filesIndex.childType() != childType || filesIndex.expectedRootRuleHash() != expectedRootRuleHash
            || filesIndex.expectedChildRuleHash() != expectedChildRuleHash) revert E_PROFILE();
        TypeRegistry types = TypeRegistry(address(ledger.registry()));
        _descriptor(types, rootType, FilesLayout.ROOT_SHAPE, expectedRootRuleHash, false);
        address childRule = _descriptor(types, childType, FilesLayout.CHILD_SHAPE, expectedChildRuleHash, true);
        if (FilesChildRule(childRule).rootType() != rootType) revert E_PROFILE();
    }

    function _descriptor(TypeRegistry types, bytes32 t, bytes32 expectedShape, bytes32 expectedHash, bool child)
        private view returns (address)
    {
        (bool registered,,,,,,) = types.typeInfo(t);
        if (!registered) revert E_PROFILE();
        (bytes32 shape, bytes32 ruleHash, address mandatory, uint8 count,,) = types.descriptor(t);
        bytes32[] memory refs = types.refTypes(t);
        uint256 expectedCount = child ? 1 : 0;
        if (expectedHash == 0 || mandatory.code.length == 0 || mandatory.codehash != expectedHash
            || shape != expectedShape || ruleHash != expectedHash || count != expectedCount
            || refs.length != expectedCount || (child && refs[0] != 0)
            || Keys.typeId(shape, refs, ruleHash) != t) revert E_PROFILE();
        return mandatory;
    }

    function _guard(Basis calldata basis) private view {
        _checkBinding();
        (uint64 current,,,) = ledger.counts();
        if (basis.admission != current || basis.generation != filesIndex.generation()
            || basis.epoch != ledger.registry().epoch() || basis.core != coreCodeHash) revert E_BASIS();
        _checkProfile();
    }

    // The index ignores scope: this is gap-free FAMILY coverage, not per-scope maintenance.
    // Exact point/parent-by-ID reads do not consume reverse-parent enumeration.
    function _completeFamily(bytes32 family, bytes32 scope, uint64 admission) private view {
        (uint8 status, uint64 from, uint64 through) = filesIndex.coverage(family, scope);
        if (status != 2 || from != 1 || through != admission || filesIndex.attachedFrom() != 1)
            revert E_INCOMPLETE();
    }

    function readFilePoint(bytes32 file, address[] calldata authors, bytes32 concept, Basis calldata basis)
        external view returns (FilePoint memory)
    {
        _guard(basis);
        return _point(file, authors, concept, basis.admission);
    }

    function _point(bytes32 file, address[] calldata authors, bytes32 concept, uint64 basis)
        private view returns (FilePoint memory result)
    {
        result.file = file;
        bytes32 selected;
        (result.status, selected,,,) = lensReader.resolve(authors, HEAD, file, bytes32(0));
        // HEAD is selected first. A missing/masked/conflicted selection never has an
        // evaluated revision-tag assessment, even if the File itself has a tag.
        if (result.status == 1) result.revision = _decode(selected, file, basis);
        result.fileTag = _tag(authors, file, concept, file);
        if (result.status == 1) {
            result.revisionTag = _tag(authors, selected, concept, file);
        }
    }

    function _tag(address[] calldata authors, bytes32 subject, bytes32 concept, bytes32 file)
        private view returns (TagAssessment memory result)
    {
        result.subject = subject;
        result.evaluated = true;
        (result.status, result.target,,,) = lensReader.resolve(authors, TAG, subject, concept);
        result.present = result.status == 1 && result.target == file;
    }

    function _decode(bytes32 selected, bytes32 file, uint64 basis) private view returns (Revision memory result) {
        bytes memory body;
        uint64 firstAdmission;
        uint32 occurrences;
        result.recordId = selected;
        (result.typeId, firstAdmission, occurrences, body) = ledger.record(selected);
        if (selected == 0 || (result.typeId != rootType && result.typeId != childType)
            || firstAdmission == 0 || firstAdmission > basis || occurrences == 0
            || body.length > 8192 || Keys.recordFromHash(result.typeId, keccak256(body)) != selected) revert E_PROFILE();
        (uint8 kind,,,,,, bytes32 bodyHash, bytes32 admittedType) = ledger.admission(firstAdmission);
        if (kind != 1 || admittedType != result.typeId || bodyHash != keccak256(body)) revert E_PROFILE();
        uint256 prefix = result.typeId == rootType ? 32 : 64;
        if (body.length < prefix) revert E_PROFILE();
        bytes32 first;
        bytes32 second;
        assembly ("memory-safe") { first := mload(add(body, 32)) }
        if (prefix == 64) {
            assembly ("memory-safe") { second := mload(add(body, 64)) }
        }
        result.file = prefix == 32 ? first : second;
        result.parent = prefix == 32 ? bytes32(0) : first;
        uint64 created = ledger.subjectCreatedAt(file);
        if (file == 0 || result.file != file || created == 0 || created > basis) revert E_PROFILE();
        if (prefix == 64) _parent(result.parent, file, firstAdmission);
        result.document = new bytes(body.length - prefix);
        for (uint256 i; i < result.document.length; ++i) result.document[i] = body[prefix + i];
        result.documentHash = keccak256(result.document);
    }

    // The pinned mandatory rule already checked this immutable parent relationship.
    // Recheck its exact bounded header without fetching the entire ancestor chain.
    function _parent(bytes32 parent, bytes32 file, uint64 childAdmission) private view {
        (bytes32 t, uint64 first, uint32 length) = FilesLayout.header(ledger, parent);
        if (parent == 0 || first == 0 || first >= childAdmission || length > 8192) revert E_PROFILE();
        if (t == rootType) {
            if (length < 32 || FilesLayout.word(ledger, parent, 0) != file) revert E_PROFILE();
        } else if (t == childType) {
            if (length < 64 || FilesLayout.word(ledger, parent, 1) != file) revert E_PROFILE();
        } else revert E_PROFILE();
    }

    function readFileConflict(bytes32 file, address[] calldata authors, bytes32 concept, Basis calldata basis)
        external view returns (ConflictResult memory result)
    {
        _guard(basis);
        result.file = file;
        LensReader.Entry[] memory candidates;
        (result.status, candidates) = lensReader.resolveNoTiebreak(authors, HEAD, file, bytes32(0));
        result.fileTag = _tag(authors, file, concept, file);
        result.candidates = new ConflictCandidate[](candidates.length);
        for (uint256 i; i < candidates.length; ++i) {
            if (candidates[i].admission == 0 || candidates[i].admission > basis.admission
                || candidates[i].position != Keys.position(HEAD, file, bytes32(0))) revert E_PROFILE();
            result.candidates[i] = ConflictCandidate(candidates[i], _decode(candidates[i].target, file, basis.admission));
        }
    }

    function readFolderTaggedOnce(bytes32 folder, address[] calldata authors, bytes32 concept, TagScope scope,
        uint256 budget, Basis calldata basis) external view returns (FolderResult memory result)
    {
        _guard(basis);
        bytes32 scopeKey = keccak256(abi.encode(FOLDER, folder));
        _completeFamily(filesIndex.FAMILY_SCOPE(), scopeKey, basis.admission);
        LensReader.Cursor memory fresh;
        LensReader.Page memory page = lensReader.list(authors, FOLDER, folder, fresh, budget);
        if (page.status != 2 || page.mutated || page.next.lensIndex != authors.length || page.next.rawIndex != 0
            || page.next.basisAdmission != basis.admission || page.next.indexGeneration != basis.generation
            || page.next.rulesEpoch != basis.epoch || page.next.coreCodeCommitment != basis.core
            || page.next.lensHash != keccak256(abi.encodePacked(authors)) || page.next.scopeKey != scopeKey
            || page.scanned != page.rawTotal || page.selectedSoFar != page.items.length
            || page.next.selectedSoFar != page.items.length) revert E_INCOMPLETE();
        result.status = page.status;
        result.mutated = page.mutated;
        result.next = page.next;
        result.files = new FilePoint[](page.items.length);
        uint256 count;
        for (uint256 i; i < page.items.length; ++i) {
            LensReader.Entry memory entry = page.items[i];
            (bytes32 purpose, bytes32 subject, bytes32 role) = ledger.positionCell(entry.position);
            if (purpose != FOLDER || subject != folder || entry.position != Keys.position(FOLDER, folder, role)
                || entry.admission == 0 || entry.admission > basis.admission
                || entry.target == 0 || ledger.subjectCreatedAt(entry.target) == 0) revert E_PROFILE();
            FilePoint memory point = _point(entry.target, authors, concept, basis.admission);
            if (point.status == 3) revert E_INCOMPLETE();
            // Proven ABSENT or MASKED HEAD cannot match a selected-revision query.
            // Neither is promoted into a verified selected File merely by a File tag.
            bool present = scope == TagScope.File ? point.fileTag.present : point.revisionTag.present;
            if (point.status == 1 && present) result.files[count++] = point;
        }
        FilePoint[] memory selectedFiles = result.files;
        assembly ("memory-safe") { mstore(selectedFiles, count) }
    }
}
