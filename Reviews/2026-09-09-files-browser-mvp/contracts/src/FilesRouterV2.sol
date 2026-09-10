// SPDX-License-Identifier: UNLICENSED
// Disposable prototype FilesRouter, revision 2: authority moved into Core U3.
// The AUTHOR signs one intent naming this router as the sole executor and
// committing to the exact operation and publication; Core verifies the
// author account, nonce, execution set and executor binding, so a bearer of
// the signed intent CANNOT strip this router's Files preconditions. This
// router keeps the name profile, plan-wide source/destination preconditions,
// cycle witnesses and publication templates, then executes atomically.
pragma solidity 0.8.30;

struct AuthorIntent {
    bytes32 opCommitment;
    bytes32 byteCommitment;
    address executor;
    bytes32 executorCodehash;
    uint64 nonce;
    uint64 deadline;
}

interface IFixtureCoreU3 {
    struct EnvelopeHeader {
        uint16 profile;
        bytes32 principalId;
        bytes32 authorityRef;
        uint64 authEpoch;
        bytes32 pubNonce;
        uint64 notAfter;
    }

    struct SelectedLeaf {
        uint16 leafIndex;
        bytes32 typeId;
        bytes body;
    }

    struct ExpectedRevision {
        uint16 leafIndex;
        uint32 revision;
    }

    struct Publication {
        bytes32 envelopeId;
        EnvelopeHeader header;
        bytes32[] recordIds;
        uint64 leafMask;
        SelectedLeaf[] leaves;
        ExpectedRevision[] expectedRevisions;
    }

    struct LeafResult {
        uint16 leafIndex;
        uint8 outcome;
        uint64 admissionOrdinal;
    }

    struct AdmitResult {
        bytes32 envelopeId;
        uint64 envelopeOrdinal;
        uint64 acceptingBatchId;
        LeafResult[] leaves;
    }

    struct ResolvedTarget {
        uint8 targetKind;
        bytes32 targetA;
        uint16 targetLeaf;
    }

    struct BasisReport {
        bytes32 realmRevisionId;
        uint64 blockNumber;
        uint64 admissionHigh;
        uint8 basisKind;
    }

    struct ResolveResult {
        uint8 presence; // 0 UNKNOWN 1 FOUND 2 ABSENT 3 CONFLICT 4 UNSUPPORTED
        uint8 reasonCode;
        ResolvedTarget target;
        uint16 winnerIndex;
        uint16 winnerTier;
        uint64 winnerAdmissionOrdinal;
        uint16 presentCount;
        uint16 agreeCount;
        BasisReport basis;
    }

    struct Head {
        uint8 state;
        uint8 targetKind;
        uint8 tombstoneCause;
        uint32 revision;
        uint64 admissionOrdinal;
        bytes32 targetA;
        uint16 targetLeaf;
    }

    function executeAuthorized(
        Publication calldata publication,
        uint32 expectedRevision,
        AuthorIntent calldata intent,
        bytes calldata authorSignature
    ) external returns (AdmitResult memory);
    function principalAccount(bytes32 principal) external view returns (address);

    function resolve(bytes32 planRecordId, bytes32 positionKey) external view returns (ResolveResult memory);
    function getRecord(bytes32 recordId) external view returns (bytes32, bytes memory, uint64);
    function getBindingHead(bytes32 bindingKey) external view returns (Head memory, bytes32, uint64);
}

contract FilesRouterV2 {
    // ---- operation kinds ---------------------------------------------------
    uint8 public constant CREATE_FILE = 1;
    uint8 public constant CREATE_DIR = 2;
    uint8 public constant EDIT = 3;
    uint8 public constant RENAME_MOVE = 4;
    uint8 public constant COPY = 5;
    uint8 public constant PLACEMENT = 6;
    uint8 public constant REMOVE = 7;
    uint8 public constant RESTORE = 8;
    uint8 public constant TAG = 9;
    uint8 public constant UNTAG = 10;

    struct TypeIds {
        bytes32 objectGenesis;
        bytes32 bindingSet;
        bytes32 bindingTombstone;
        bytes32 directoryEntry;
        bytes32 directoryWhiteout;
        bytes32 fileRevision;
        bytes32 chunkTree;
        bytes32 removalMarker;
        bytes32 tagAssertion;
    }

    struct Purposes {
        bytes32 namePurpose;
        bytes32 headPurpose;
        bytes32 headRole;
        bytes32 charterPurpose;
        bytes32 removedPurpose;
        bytes32 tagPurpose;
        bytes32 fileMeaning;
        bytes32 directoryMeaning;
    }

    struct FilesOp {
        uint8 kind;
        bytes32 mountId;
        bytes32 parent; // destination parent directory node
        bytes name; // destination name
        bytes32 sourceParent; // rename/move source parent
        bytes sourceName; // rename/move source name
        bytes32 object; // subject File/Directory Object
        bytes32 aux; // EDIT: expected prior revision id; RESTORE: marker id; TAG/UNTAG: tag id
        bytes[] ancestorNames; // cycle witness root->destination parent (directory moves)
    }

    error ErrRoutedExecutor(address expected);
    error ErrOpCommitment(bytes32 expected, bytes32 got);
    error ErrByteCommitment(bytes32 expected, bytes32 got);
    error ErrNameMalformed(uint8 code);
    error ErrNameUnsupported();
    error ErrParentNotDirectory(bytes32 node);
    error ErrObjectKind(bytes32 node);
    error ErrDestinationOccupied(bytes32 selected);
    error ErrDestinationConflict();
    error ErrDestinationUnknown(uint8 presence);
    error ErrSourceMismatch(uint8 presence, bytes32 selected);
    error ErrStaleEdit(bytes32 currentRevision, bytes32 expected);
    error ErrTemplate(uint8 leafIndex, uint8 code);
    error ErrCycle(bytes32 node);
    error ErrWitness(uint8 hop);
    error ErrRestoreCollision(bytes32 selected);
    error ErrMarkerInactive(bytes32 markerId);
    error ErrUnknownKind(uint8 kind);
    error ErrMountShape();

    IFixtureCoreU3 public immutable core;
    TypeIds public typeIds;
    Purposes public purposes;
    bytes32 private immutable DOM_RECORD;
    bytes32 private immutable DOM_POSITION;
    bytes32 private immutable DOM_BINDING;
    bytes32 private immutable DOM_FIELDROLE;
    event FilesOperation(uint8 indexed kind, bytes32 indexed principal, bytes32 envelopeId, uint64 batchId);

    constructor(IFixtureCoreU3 core_, TypeIds memory t, Purposes memory p) {
        core = core_;
        typeIds = t;
        purposes = p;
        DOM_RECORD = keccak256(bytes("efs2/record/1"));
        DOM_POSITION = keccak256(bytes("efs2/position/1"));
        DOM_BINDING = keccak256(bytes("efs2/binding/1"));
        DOM_FIELDROLE = keccak256(bytes("efs2/fieldrole/1"));
    }

    // ---- key derivations (byte-identical to the shared reader/SDK) ---------
    function recordIdOf(bytes32 typeId, bytes memory body) public view returns (bytes32) {
        return keccak256(abi.encodePacked(DOM_RECORD, typeId, keccak256(body)));
    }

    function nameRole(bytes memory name) public view returns (bytes32) {
        return keccak256(abi.encodePacked(DOM_FIELDROLE, keccak256(name)));
    }

    function positionKey(bytes32 purpose, bytes32 subject, bytes32 fieldRole) public view returns (bytes32) {
        return keccak256(abi.encodePacked(DOM_POSITION, purpose, subject, fieldRole));
    }

    function bindingKey(bytes32 principal, bytes32 purpose, bytes32 subject, bytes32 fieldRole)
        public
        view
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(DOM_BINDING, principal, positionKey(purpose, subject, fieldRole)));
    }

    // ---- ASCII name profile: MALFORMED vs UNSUPPORTED, never rewritten -----
    // code 1 empty/too long; 2 dot traversal; 3 forbidden byte. Uppercase or
    // other printable UTF-8 is UNSUPPORTED (valid rich name, unsupported arm).
    function assessName(bytes memory name) public pure returns (uint8 malformed, bool supported) {
        uint256 n = name.length;
        if (n == 0 || n > 255) return (1, false);
        if (n <= 2) {
            if (n == 1 && name[0] == ".") return (2, false);
            if (n == 2 && name[0] == "." && name[1] == ".") return (2, false);
        }
        bool ascii = true;
        for (uint256 i = 0; i < n; i++) {
            uint8 c = uint8(name[i]);
            if (c < 0x20 || c == 0x2f || c == 0x5c || c == 0x7f) return (3, false);
            bool ok = (c >= 0x61 && c <= 0x7a) || (c >= 0x30 && c <= 0x39) || c == 0x2e || c == 0x5f || c == 0x2d;
            if (!ok) ascii = false;
        }
        return (0, ascii);
    }

    function _requireSupportedName(bytes memory name) internal pure {
        (uint8 malformed, bool supported) = assessName(name);
        if (malformed != 0) revert ErrNameMalformed(malformed);
        if (!supported) revert ErrNameUnsupported();
    }

    // ---- record decoding helpers -------------------------------------------
    function _word(bytes memory b, uint256 at) private pure returns (bytes32 w) {
        require(b.length >= at + 32, "slice");
        assembly ("memory-safe") {
            w := mload(add(add(b, 32), at))
        }
    }

    function _meaning(bytes32 node) private view returns (bytes32 meaning) {
        (bytes32 t, bytes memory body,) = core.getRecord(node);
        if (t != typeIds.objectGenesis || body.length != 97 || body[64] != 0x01) revert ErrObjectKind(node);
        return _word(body, 65);
    }

    function _requireDirectory(bytes32 node) internal view {
        if (_meaning(node) != purposes.directoryMeaning) revert ErrParentNotDirectory(node);
    }

    function _requireFile(bytes32 node) internal view {
        if (_meaning(node) != purposes.fileMeaning) revert ErrObjectKind(node);
    }

    struct Mount {
        bytes32 root;
        bytes32 namespacePlan;
        bytes32 contentPlan;
    }

    function _mount(bytes32 mountId) internal view returns (Mount memory m) {
        (bytes32 t, bytes memory body,) = core.getRecord(mountId);
        if (body.length != 96) revert ErrMountShape();
        t; // typeId shape is enforced by the reader; the router needs the config path
        m.root = _word(body, 0);
        (, bytes memory config,) = core.getRecord(_word(body, 64));
        if (config.length < 34 || config[0] != 0x01) revert ErrMountShape();
        m.namespacePlan = _word(config, 1);
        m.contentPlan = _word(config, 33);
    }

    // Entry body: parent(32) u16len name child(32) option-mount(1[+32])
    function _entry(bytes memory body) private pure returns (bytes32 parent, bytes memory name, bytes32 child) {
        require(body.length >= 67, "entry");
        parent = _word(body, 0);
        uint256 n = (uint256(uint8(body[32])) << 8) | uint256(uint8(body[33]));
        require(body.length >= 34 + n + 33, "entry");
        name = new bytes(n);
        for (uint256 i = 0; i < n; i++) {
            name[i] = body[34 + i];
        }
        child = _word(body, 34 + n);
    }

    // ---- destination and source preconditions over the WHOLE plan ----------
    function _destinationState(Mount memory m, bytes32 parent, bytes memory name)
        internal
        view
        returns (bytes32 selectedEntry)
    {
        IFixtureCoreU3.ResolveResult memory r =
            core.resolve(m.namespacePlan, positionKey(purposes.namePurpose, parent, nameRole(name)));
        if (r.presence == 2) return bytes32(0); // ABSENT: free
        if (r.presence == 3) revert ErrDestinationConflict();
        if (r.presence != 1) revert ErrDestinationUnknown(r.presence);
        (bytes32 t,,) = core.getRecord(r.target.targetA);
        if (t == typeIds.directoryWhiteout) return bytes32(0); // masked: free to rebind
        revert ErrDestinationOccupied(r.target.targetA);
    }

    function _sourceEntry(Mount memory m, bytes32 parent, bytes memory name, bytes32 expectObject)
        internal
        view
        returns (bytes32 selectedEntry)
    {
        IFixtureCoreU3.ResolveResult memory r =
            core.resolve(m.namespacePlan, positionKey(purposes.namePurpose, parent, nameRole(name)));
        if (r.presence != 1) revert ErrSourceMismatch(r.presence, bytes32(0));
        (bytes32 t, bytes memory body,) = core.getRecord(r.target.targetA);
        if (t != typeIds.directoryEntry) revert ErrSourceMismatch(r.presence, r.target.targetA);
        (bytes32 p,, bytes32 child) = _entry(body);
        if (p != parent || child != expectObject) revert ErrSourceMismatch(r.presence, r.target.targetA);
        return r.target.targetA;
    }

    // Cycle witness: resolve root->destParent by supplied names; the moved
    // directory must not appear anywhere on that chain (and never equal it).
    function _checkWitness(Mount memory m, FilesOp calldata op) internal view {
        if (op.object == op.parent) revert ErrCycle(op.object);
        bytes32 at = m.root;
        if (at == op.object) revert ErrCycle(at);
        uint256 hops = op.ancestorNames.length;
        if (hops > 16) revert ErrWitness(255);
        for (uint256 i = 0; i < hops; i++) {
            IFixtureCoreU3.ResolveResult memory r =
                core.resolve(m.namespacePlan, positionKey(purposes.namePurpose, at, nameRole(op.ancestorNames[i])));
            if (r.presence != 1) revert ErrWitness(uint8(i));
            (bytes32 t, bytes memory body,) = core.getRecord(r.target.targetA);
            if (t != typeIds.directoryEntry) revert ErrWitness(uint8(i));
            (,, bytes32 child) = _entry(body);
            if (child == op.object) revert ErrCycle(child);
            at = child;
        }
        if (at != op.parent) revert ErrWitness(254);
    }

    // ---- publication template checks ---------------------------------------
    function _leaf(IFixtureCoreU3.Publication calldata p, uint256 i, bytes32 expectType)
        private
        view
        returns (bytes memory body, bytes32 id)
    {
        if (p.leaves.length <= i) revert ErrTemplate(uint8(i), 1);
        IFixtureCoreU3.SelectedLeaf calldata l = p.leaves[i];
        if (l.typeId != expectType) revert ErrTemplate(uint8(i), 2);
        body = l.body;
        id = recordIdOf(l.typeId, body);
    }

    function _binding(bytes memory body, bytes32 purpose, bytes32 subject, bytes32 role, bytes32 target)
        private
        pure
        returns (bool)
    {
        if (body.length < 129 || body[96] != 0x01) return false;
        return _word(body, 0) == purpose && _word(body, 32) == subject && _word(body, 64) == role
            && _word(body, 97) == target;
    }

    function _tombstone(bytes memory body, bytes32 purpose, bytes32 subject, bytes32 role)
        private
        pure
        returns (bool)
    {
        if (body.length < 96) return false;
        return _word(body, 0) == purpose && _word(body, 32) == subject && _word(body, 64) == role;
    }

    function _entryLeafMatches(bytes memory body, bytes32 parent, bytes calldata name, bytes32 child)
        private
        pure
        returns (bool)
    {
        (bytes32 p, bytes memory n, bytes32 c) = _entry(body);
        return p == parent && keccak256(n) == keccak256(name) && c == child;
    }

    // ---- the routed execution ----------------------------------------------
    function execute(
        FilesOp calldata op,
        IFixtureCoreU3.Publication calldata publication,
        uint32 expectedRevision,
        AuthorIntent calldata intent,
        bytes calldata authorSig
    ) external returns (IFixtureCoreU3.AdmitResult memory result) {
        // The author's signed intent must name THIS router as sole executor
        // and commit to THIS exact operation; Core enforces the signature,
        // account, nonce, execution set and msg.sender==executor binding.
        if (intent.executor != address(this)) revert ErrRoutedExecutor(intent.executor);
        bytes32 opCommitment = keccak256(abi.encode(op));
        if (intent.opCommitment != opCommitment) revert ErrOpCommitment(opCommitment, intent.opCommitment);
        // The signed byteCommitment must equal the commitment derived from the
        // ACTUAL publication's ChunkTree leaf for content-carrying kinds, and
        // zero for every other kind. Without this it is unchecked metadata.
        bytes32 expectedByteCommitment;
        Mount memory m = _mount(op.mountId);
        TypeIds memory T = typeIds;
        Purposes memory P = purposes;

        if (op.kind == CREATE_FILE || op.kind == CREATE_DIR || op.kind == COPY) {
            _requireSupportedName(op.name);
            _requireDirectory(op.parent);
            _destinationState(m, op.parent, op.name);
            uint256 e; // entry leaf index
            bytes32 objectId;
            if (op.kind == CREATE_DIR) {
                (, objectId) = _leaf(publication, 0, T.objectGenesis);
                e = 2;
                if (publication.leaves.length != 4) revert ErrTemplate(0, 3);
            } else if (op.kind == CREATE_FILE) {
                (, objectId) = _leaf(publication, 0, T.objectGenesis);
                (bytes memory tree, bytes32 treeId) = _leaf(publication, 2, T.chunkTree);
                (bytes memory rev,) = _leaf(publication, 3, T.fileRevision);
                if (_word(rev, 0) != objectId) revert ErrTemplate(3, 4);
                // The revision must reference the publication's OWN tree leaf.
                if (_word(rev, 32) != treeId) revert ErrTemplate(3, 8);
                expectedByteCommitment = keccak256(abi.encode(treeId, keccak256(tree)));
                (bytes memory head,) = _leaf(publication, 4, T.bindingSet);
                bytes32 revisionId = recordIdOf(T.fileRevision, rev);
                if (!_binding(head, P.headPurpose, objectId, P.headRole, revisionId)) revert ErrTemplate(4, 5);
                e = 5;
                if (publication.leaves.length != 7) revert ErrTemplate(0, 3);
            } else {
                // COPY: new object shares an existing admitted ChunkTree.
                (, objectId) = _leaf(publication, 0, T.objectGenesis);
                (bytes memory rev,) = _leaf(publication, 2, T.fileRevision);
                if (_word(rev, 0) != objectId) revert ErrTemplate(2, 4);
                (bytes memory head,) = _leaf(publication, 3, T.bindingSet);
                if (!_binding(head, P.headPurpose, objectId, P.headRole, recordIdOf(T.fileRevision, rev))) {
                    revert ErrTemplate(3, 5);
                }
                e = 4;
                if (publication.leaves.length != 6) revert ErrTemplate(0, 3);
            }
            (bytes memory charter,) = _leaf(publication, 1, T.bindingSet);
            if (!_binding(charter, P.charterPurpose, objectId, bytes32(uint256(1)), objectId)) revert ErrTemplate(1, 5);
            (bytes memory entryBody, bytes32 entryId) = _leaf(publication, e, T.directoryEntry);
            if (!_entryLeafMatches(entryBody, op.parent, op.name, objectId)) revert ErrTemplate(uint8(e), 6);
            (bytes memory nameBind,) = _leaf(publication, e + 1, T.bindingSet);
            if (!_binding(nameBind, P.namePurpose, op.parent, nameRole(op.name), entryId)) {
                revert ErrTemplate(uint8(e + 1), 5);
            }
            if (op.object != objectId) revert ErrTemplate(0, 7);
        } else if (op.kind == EDIT) {
            _requireFile(op.object);
            (IFixtureCoreU3.Head memory h,,) =
                core.getBindingHead(bindingKey(publication.header.principalId, P.headPurpose, op.object, P.headRole));
            if (h.state != 1 || h.targetA != op.aux) revert ErrStaleEdit(h.targetA, op.aux);
            (bytes memory rev,) = _leaf(publication, 1, T.fileRevision);
            if (_word(rev, 0) != op.object) revert ErrTemplate(1, 4);
            (bytes memory head,) = _leaf(publication, 2, T.bindingSet);
            if (!_binding(head, P.headPurpose, op.object, P.headRole, recordIdOf(T.fileRevision, rev))) {
                revert ErrTemplate(2, 5);
            }
            (bytes memory tree, bytes32 treeId) = _leaf(publication, 0, T.chunkTree);
            if (_word(rev, 32) != treeId) revert ErrTemplate(1, 8);
            expectedByteCommitment = keccak256(abi.encode(treeId, keccak256(tree)));
            if (publication.leaves.length != 3) revert ErrTemplate(0, 3);
        } else if (op.kind == RENAME_MOVE) {
            _requireSupportedName(op.name);
            _requireDirectory(op.parent);
            _sourceEntry(m, op.sourceParent, op.sourceName, op.object);
            _destinationState(m, op.parent, op.name);
            if (_meaning(op.object) == purposes.directoryMeaning && op.parent != op.sourceParent) {
                _checkWitness(m, op);
            }
            (bytes memory entryBody, bytes32 entryId) = _leaf(publication, 0, T.directoryEntry);
            if (!_entryLeafMatches(entryBody, op.parent, op.name, op.object)) revert ErrTemplate(0, 6);
            (bytes memory destBind,) = _leaf(publication, 1, T.bindingSet);
            if (!_binding(destBind, P.namePurpose, op.parent, nameRole(op.name), entryId)) revert ErrTemplate(1, 5);
            (bytes memory maskBody, bytes32 maskId) = _leaf(publication, 2, T.directoryWhiteout);
            {
                bytes32 mp = _word(maskBody, 0);
                if (mp != op.sourceParent) revert ErrTemplate(2, 6);
            }
            (bytes memory srcBind,) = _leaf(publication, 3, T.bindingSet);
            if (!_binding(srcBind, P.namePurpose, op.sourceParent, nameRole(op.sourceName), maskId)) {
                revert ErrTemplate(3, 5);
            }
            if (publication.leaves.length != 4) revert ErrTemplate(0, 3);
        } else if (op.kind == PLACEMENT) {
            _requireSupportedName(op.name);
            _requireDirectory(op.parent);
            _requireFile(op.object);
            _destinationState(m, op.parent, op.name);
            (bytes memory entryBody, bytes32 entryId) = _leaf(publication, 0, T.directoryEntry);
            if (!_entryLeafMatches(entryBody, op.parent, op.name, op.object)) revert ErrTemplate(0, 6);
            (bytes memory nameBind,) = _leaf(publication, 1, T.bindingSet);
            if (!_binding(nameBind, P.namePurpose, op.parent, nameRole(op.name), entryId)) revert ErrTemplate(1, 5);
            if (publication.leaves.length != 2) revert ErrTemplate(0, 3);
        } else if (op.kind == REMOVE) {
            bytes32 selected = _sourceEntry(m, op.parent, op.name, op.object);
            (bytes memory markerBody, bytes32 markerId) = _leaf(publication, 0, T.removalMarker);
            if (markerBody.length != 32 || _word(markerBody, 0) != selected) revert ErrTemplate(0, 8);
            (bytes memory markerBind,) = _leaf(publication, 1, T.bindingSet);
            if (!_binding(markerBind, P.removedPurpose, op.parent, markerId, markerId)) revert ErrTemplate(1, 5);
            (bytes memory maskBody, bytes32 maskId) = _leaf(publication, 2, T.directoryWhiteout);
            if (_word(maskBody, 0) != op.parent) revert ErrTemplate(2, 6);
            (bytes memory nameBind,) = _leaf(publication, 3, T.bindingSet);
            if (!_binding(nameBind, P.namePurpose, op.parent, nameRole(op.name), maskId)) revert ErrTemplate(3, 5);
            if (publication.leaves.length != 4) revert ErrTemplate(0, 3);
        } else if (op.kind == RESTORE) {
            _requireSupportedName(op.name);
            bytes32 principal = publication.header.principalId;
            (IFixtureCoreU3.Head memory h,,) =
                core.getBindingHead(bindingKey(principal, P.removedPurpose, op.parent, op.aux));
            if (h.state != 1 || h.targetA != op.aux) revert ErrMarkerInactive(op.aux);
            // The marker names the exact original entry; restore must target its object.
            (, bytes memory markerBody,) = core.getRecord(op.aux);
            (, bytes memory originalEntry,) = core.getRecord(_word(markerBody, 0));
            (,, bytes32 child) = _entry(originalEntry);
            if (child != op.object) revert ErrTemplate(0, 8);
            IFixtureCoreU3.ResolveResult memory r =
                core.resolve(m.namespacePlan, positionKey(P.namePurpose, op.parent, nameRole(op.name)));
            if (r.presence == 1) {
                (bytes32 t,,) = core.getRecord(r.target.targetA);
                if (t != typeIds.directoryWhiteout) revert ErrRestoreCollision(r.target.targetA);
            } else if (r.presence != 2) {
                revert ErrDestinationUnknown(r.presence);
            }
            (bytes memory entryBody, bytes32 entryId) = _leaf(publication, 0, T.directoryEntry);
            if (!_entryLeafMatches(entryBody, op.parent, op.name, op.object)) revert ErrTemplate(0, 6);
            (bytes memory nameBind,) = _leaf(publication, 1, T.bindingSet);
            if (!_binding(nameBind, P.namePurpose, op.parent, nameRole(op.name), entryId)) revert ErrTemplate(1, 5);
            (bytes memory retire,) = _leaf(publication, 2, T.bindingTombstone);
            if (!_tombstone(retire, P.removedPurpose, op.parent, op.aux)) revert ErrTemplate(2, 5);
            if (publication.leaves.length != 3) revert ErrTemplate(0, 3);
        } else if (op.kind == TAG) {
            _meaning(op.object); // must be a chartered node shape
            (bytes memory assertion, bytes32 assertionId) = _leaf(publication, 0, T.tagAssertion);
            if (assertion.length != 64 || _word(assertion, 0) != op.aux || _word(assertion, 32) != op.object) {
                revert ErrTemplate(0, 8);
            }
            (bytes memory bind,) = _leaf(publication, 1, T.bindingSet);
            if (!_binding(bind, P.tagPurpose, op.object, op.aux, assertionId)) revert ErrTemplate(1, 5);
            if (publication.leaves.length != 2) revert ErrTemplate(0, 3);
        } else if (op.kind == UNTAG) {
            (bytes memory retire,) = _leaf(publication, 0, T.bindingTombstone);
            if (!_tombstone(retire, P.tagPurpose, op.object, op.aux)) revert ErrTemplate(0, 5);
            if (publication.leaves.length != 1) revert ErrTemplate(0, 3);
        } else {
            revert ErrUnknownKind(op.kind);
        }

        if (intent.byteCommitment != expectedByteCommitment) {
            revert ErrByteCommitment(expectedByteCommitment, intent.byteCommitment);
        }
        result = core.executeAuthorized(publication, expectedRevision, intent, authorSig);
        emit FilesOperation(op.kind, publication.header.principalId, result.envelopeId, result.acceptingBatchId);
    }
}
