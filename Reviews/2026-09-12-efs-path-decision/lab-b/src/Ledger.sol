// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "./Keys.sol";
import {IAcceptor, IIndexModule, ITypeRegistry} from "./Interfaces.sol";

/// @title Ledger — Road B single-pass ingestion kernel
/// @notice DISPOSABLE LAB, NO PROTOCOL CLAIM. Implements road-b.md §2/§3/§5 plus the
///         coordinator deltas (subject ids, evidence cell, index split, ordered-prefix
///         batch law, PublicationIntent signature binding). Every gas figure in the
///         comments is ESTIMATED (unmeasured; no compile or run has happened).
///
/// Durable facts kept here (why each exists):
///   Record        typeId, body words, first admission, occurrence count — portable data
///                 identity, dedup by id, "what still asserts this record" count.
///   Subject       create admission per subject id — stable File identity minted from
///                 (creator, salt); rename/move rebinds placements, the subject never moves.
///   Admission     one row per action with its re-encodable effect fields — a clean reader
///                 rebuilds the signed Action tuple from rows firstAdmission..+leafCount.
///   Evidence      one cell per publication: author, proof kind, signature (r,s,v), nonce,
///                 deadline, acceptance profile, index obligations, actions hash, first
///                 admission, leaf count, basis — authorship closure recoverable from state.
///   Head          per binding key: state, revision, admission, previous admission, target,
///                 binding ordinal — stable File identity via subject, CAS, evidence-preserving
///                 rename/move/remove. Bit layout mirrors BindingFold.pack so c0's unpack reads it.
///   PositionCell  (purpose, subject, role) preimage per position — shared by all authors, lets
///                 the reconstruction and the lens merge recover the preimage of a position hash.
///   Counters, nonces, publicationId → ordinal (exact retry is a no-op: AlreadyAdmitted).
/// NOT kept here: any posting list. Scope/history/backlink/by-type/by-author lists live in
/// the IndexModule (delta 3); a failure there reverts the whole publication.
contract Ledger {
    // ------------------------------------------------------------------------ shapes
    /// One logical action. All fields are value types, so the tuple is static and
    /// keccak256(abi.encode(actions)) is identical from calldata, memory, ethers, or a
    /// clean re-encoding from Admission rows. Unused fields MUST be zero (E_SHAPE).
    struct Action {
        uint8 kind; // PUBLISH | REUSE | BIND | UNBIND | CREATE | WITHDRAW
        bytes32 typeId; // publish/reuse: record Type
        bytes32 bodyHashOrRecordId; // publish: keccak256(body); reuse: existing record id
        bytes32 purpose; // bind/unbind (nonzero)
        bytes32 subject; // bind/unbind
        bytes32 role; // bind/unbind
        bytes32 target; // bind: record id or subject id; withdraw: bytes32(uint256(admission ordinal))
        uint32 expectedRevision; // bind/unbind CAS
        bytes32 salt; // create: creator salt (subject id preimage)
    }

    /// What a signed caller authorizes besides the actions (delta A). actionsHash is
    /// appended by the Ledger when hashing: PublicationIntent(..., bytes32 actionsHash).
    struct Intent {
        bytes32 realmId;
        bytes32 coreCodeCommitment; // must equal address(ledger).codehash
        address author;
        uint64 nonce;
        uint64 deadline;
        bytes32 acceptanceProfile; // must equal acceptanceProfileOf(actions)
        bytes32 indexObligations; // must equal indexObligations()
    }

    // Publication-scoped values threaded through the ordered apply (memory, by reference).
    struct Pub {
        address author;
        bytes32 author32; // destination-side principal id (authority for bindings)
        bytes32 creator; // principal id used to mint subject ids (source principal for imports)
        bool imported;
        uint8 proofKind;
        uint8 v;
        uint64 nonce;
        uint64 deadline;
        bytes32 r;
        bytes32 s;
        bytes32 acceptanceProfile;
        bytes32 indexObligations;
        bytes32 actionsHash;
        uint64 publication;
        uint64 ord; // running admission ordinal
        uint64 records;
        uint64 bindings;
    }

    // ---- durable rows (slot counts are ESTIMATED fresh slots per row)
    struct RecordCell { bytes32 typeId; uint256 meta; } // meta: firstAdmission u48@0 | length u32@48 | occurrences u32@80   (2 + body words)
    struct AdmissionRow { uint256 meta; bytes32 a; bytes32 b; } // meta: kind u4@0 | leaf u16@4 | publication u48@20 | bindingOrd u48@68 | expectedRevision u32@116 | withdrawn u1@148
    //   a: publish=bodyHash, reuse=recordId, bind=target, create=salt, withdraw=bytes32(admission); b: publish=typeId   (2, or 3 for publish, 1 for unbind)
    struct HeadRow { uint256 meta; bytes32 target; } // meta: state u8@0 | revision u32@8 | admission u48@40 | targetKind u8@88 | tombstoneCause u8@96 | leaf u16@104 (0) | prev u48@120 | bindingOrd u48@168   (2)
    struct PositionCell { bytes32 purpose; bytes32 subject; bytes32 role; } // (3, once per position, shared by all authors)
    struct EvidenceCell { uint256 w0; bytes32 r; bytes32 s; uint256 w3; bytes32 acceptanceProfile; bytes32 indexObligations; bytes32 actionsHash; }
    //   w0: author u160@0 | proofKind u4@160 | v u8@164 | leafCount u16@172 | firstAdmission u48@188 | imported u1@236;  w3: nonce u64@0 | deadline u64@64 | basis u40@128   (5 native, 7 signed)

    /// Retained SOURCE evidence of an imported publication (pre-seal check 3): the source
    /// Realm's intent context and signature, verified here over the source domain, and the
    /// origin-qualified source principal that minted its subject ids. Source acceptance is
    /// evidence; destination authority comes from the separate destination authorization.
    /// (9 slots, ESTIMATED: the import price on top of a normal publication.)
    struct SourceEvidence {
        bytes32 realmId;
        bytes32 coreCodeCommitment;
        bytes32 acceptanceProfile;
        bytes32 indexObligations;
        bytes32 r;
        bytes32 s;
        bytes32 sourcePrincipal;
        address author;
        uint64 nonce;
        uint64 deadline;
        uint8 v; // 0 = no signature (contract-author source: chain-state witness)
        uint8 grade; // 1 = source signature verified here; 0 = unverified witness, retained as claimed
    }

    // ------------------------------------------------------------------------ constants
    uint8 public constant PUBLISH = 1;
    uint8 public constant REUSE = 2;
    uint8 public constant BIND = 3;
    uint8 public constant UNBIND = 4;
    uint8 public constant CREATE = 5;
    uint8 public constant WITHDRAW = 6;
    uint8 public constant PROOF_NATIVE = 1; // author = msg.sender; portability proof = chain-state witness
    uint8 public constant PROOF_SIGNED = 2; // author = ecrecover(PublicationIntent); portability proof = the signature
    uint256 public constant MAX_ACTIONS = 64;
    uint256 public constant MAX_BODY = 8192;
    uint256 public constant ACCEPT_GAS = 300_000; // bounded STATICCALL to the acceptor
    uint256 public constant INDEX_GAS_BASE = 200_000; // bounded CALL to the index module ...
    uint256 public constant INDEX_GAS_PER_ACTION = 150_000; // ... plus this per action
    uint64 private constant GUARD = (uint64(1) << 48) - 1;
    uint256 private constant SECP256K1_N_HALF = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;
    bytes32 public constant INTENT_TYPEHASH = keccak256(
        "PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)"
    );

    ITypeRegistry public immutable registry;
    bytes32 public immutable realmId;
    address public immutable admin;
    /// EIP712Domain(string name,string version) only — no chainId/verifyingContract, so the
    /// same signed publication can be imported into a second deployment with the same realm
    /// and code (delta B). Replay within one deployment is stopped by the nonce.
    bytes32 public immutable domainSeparator;

    // ------------------------------------------------------------------------ storage (slot numbers ESTIMATED; verify with `forge inspect Ledger storage-layout`)
    address public indexModule; // 0
    uint256 private _counters; // 1: admissions u64@0 | records u64@64 | bindings u64@128 | publications u64@192
    mapping(bytes32 => RecordCell) private _record; // 2
    mapping(bytes32 => mapping(uint256 => bytes32)) private _bodyWord; // 3: id => word index => word
    mapping(bytes32 => uint64) private _subject; // 4: subject id => create admission
    mapping(uint64 => AdmissionRow) private _admission; // 5
    mapping(uint64 => EvidenceCell) private _evidence; // 6: publication ordinal => cell
    mapping(bytes32 => uint64) private _publicationOrdinal; // 7: keccak(author, nonce, actionsHash) => publication
    mapping(bytes32 => HeadRow) private _head; // 8
    mapping(uint64 => bytes32) private _bindingPosition; // 9: binding ordinal => position key
    mapping(bytes32 => PositionCell) private _position; // 10
    mapping(address => uint64) public nonces; // 11
    mapping(uint64 => SourceEvidence) private _source; // 12: publication ordinal => source evidence (imports only)

    event Admitted(bytes32 indexed author, bytes32 indexed scope, bytes32 recordId, uint64 admission);
    event Published(uint64 indexed publication, bytes32 indexed publicationId, address indexed author, uint8 proofKind, uint64 firstAdmission, uint16 leafCount);
    event IndexModuleSet(address module);

    error E_ADMIN();
    error E_BOUNDS(uint256 code);
    error E_SHAPE(uint256 leaf);
    error E_UNKNOWN_TYPE(bytes32 typeId);
    error E_BODY_HASH(uint256 leaf);
    error E_MISSING_RECORD(uint256 leaf, bytes32 id);
    error E_TYPE_MISMATCH(uint256 leaf, bytes32 expected, bytes32 have);
    error E_REF_MISSING(uint256 leaf, uint256 slot, bytes32 id);
    error E_REF_TYPE(uint256 leaf, uint256 slot, bytes32 expected, bytes32 have);
    error E_ACCEPTOR_CODE(bytes32 typeId);
    error E_REJECTED(uint256 leaf, bytes32 typeId);
    error E_TARGET_MISSING(uint256 leaf, bytes32 target);
    error E_TARGET_TYPE(uint256 leaf, bytes32 expected, bytes32 have);
    error E_CAS(bytes32 key, uint32 expected, uint32 have);
    error E_NOT_LIVE(bytes32 key);
    error E_SUBJECT_EXISTS(bytes32 subjectId);
    error E_WITHDRAW(uint256 leaf, uint256 code);
    error E_GAS();
    error E_INDEX(bytes revertData);
    error AlreadyAdmitted(uint64 publication);
    error E_NONCE(address author, uint64 expected, uint64 have);
    error E_EXPIRED(uint64 deadline);
    error E_SIGNATURE();
    error E_INTENT(uint256 field);
    error E_SOURCE_SIGNATURE();
    error E_DESTINATION_AUTH();

    constructor(ITypeRegistry registry_, bytes32 realmId_) {
        registry = registry_;
        realmId = realmId_;
        admin = msg.sender;
        domainSeparator = keccak256(
            abi.encode(keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-RoadB-Lab"), keccak256("1"))
        );
    }

    // ------------------------------------------------------------------------ ingress
    /// Native batch. Author = msg.sender (EOA or contract). `nonce` must equal nonces[author];
    /// an exact retry (same author, nonce, actions) reverts AlreadyAdmitted with no new rows.
    function execute(Action[] memory actions, bytes[] memory bodies, uint64 nonce)
        external
        returns (uint64 publication, uint64 firstAdmission)
    {
        Pub memory p;
        p.author = msg.sender;
        p.author32 = principalOf(msg.sender);
        p.creator = p.author32;
        p.proofKind = PROOF_NATIVE;
        p.nonce = nonce;
        p.acceptanceProfile = acceptanceProfileOf(actions);
        p.indexObligations = indexObligations();
        p.actionsHash = keccak256(abi.encode(actions));
        return _run(p, actions, bodies);
    }

    /// Signed batch, relayable by anyone. Everything the author authorizes is under the
    /// signature: realm, core code, nonce, deadline, acceptance profile, index obligations
    /// and the full action tuples. All checks precede the first write.
    function executeSigned(Intent memory intent, Action[] memory actions, bytes[] memory bodies, bytes memory sig)
        external
        returns (uint64 publication, uint64 firstAdmission)
    {
        if (intent.realmId != realmId) revert E_INTENT(1);
        if (intent.coreCodeCommitment != address(this).codehash) revert E_INTENT(2);
        if (block.timestamp > intent.deadline) revert E_EXPIRED(intent.deadline);
        Pub memory p;
        p.author = intent.author;
        p.author32 = Keys.principal(intent.author); // an EOA key is the same principal everywhere
        p.creator = p.author32;
        p.proofKind = PROOF_SIGNED;
        p.nonce = intent.nonce;
        p.deadline = intent.deadline;
        p.acceptanceProfile = acceptanceProfileOf(actions);
        if (intent.acceptanceProfile != p.acceptanceProfile) revert E_INTENT(3);
        p.indexObligations = indexObligations();
        if (intent.indexObligations != p.indexObligations) revert E_INTENT(4);
        p.actionsHash = keccak256(abi.encode(actions));
        (bytes32 r, bytes32 s, uint8 v) = _split(sig);
        address recovered = ecrecover(intentDigest(intent, p.actionsHash), v, r, s);
        if (recovered == address(0) || recovered != intent.author) revert E_SIGNATURE();
        p.r = r;
        p.s = s;
        p.v = v;
        return _run(p, actions, bodies);
    }

    /// Import (pre-seal check 3). The source signature is verified over the SOURCE context
    /// and retained as evidence; it authorizes nothing here. Destination authority is a
    /// separate signature by the same EOA under THIS Realm's context, or the destination's
    /// contract-author path (msg.sender == author, empty dstSig). Destination acceptance, CAS
    /// and index effects then run exactly as for a local publication. Subject ids minted by
    /// the imported actions keep the origin-qualified SOURCE principal.
    function importPublication(
        SourceEvidence memory src,
        Action[] memory actions,
        bytes[] memory bodies,
        Intent memory dst,
        bytes memory dstSig
    ) external returns (uint64 publication, uint64 firstAdmission) {
        bytes32 hash = keccak256(abi.encode(actions));
        if (src.v != 0) {
            if (uint256(src.s) > SECP256K1_N_HALF || (src.v != 27 && src.v != 28)) revert E_SOURCE_SIGNATURE();
            Intent memory si = Intent(
                src.realmId, src.coreCodeCommitment, src.author, src.nonce, src.deadline, src.acceptanceProfile, src.indexObligations
            );
            address signer = ecrecover(intentDigest(si, hash), src.v, src.r, src.s);
            if (signer == address(0) || signer != src.author) revert E_SOURCE_SIGNATURE();
            if (src.sourcePrincipal != Keys.principal(src.author)) revert E_SOURCE_SIGNATURE();
            src.grade = 1;
        } else {
            src.grade = 0; // contract-author source: a chain-state witness this Realm cannot check
        }
        Pub memory p;
        p.author = src.author;
        p.imported = true;
        p.creator = src.sourcePrincipal;
        p.acceptanceProfile = acceptanceProfileOf(actions);
        p.indexObligations = indexObligations();
        p.actionsHash = hash;
        if (dstSig.length == 0) {
            if (msg.sender != src.author) revert E_DESTINATION_AUTH();
            p.author32 = principalOf(msg.sender);
            p.proofKind = PROOF_NATIVE;
            p.nonce = nonces[msg.sender];
        } else {
            if (dst.author != src.author || dst.realmId != realmId || dst.coreCodeCommitment != address(this).codehash) {
                revert E_DESTINATION_AUTH();
            }
            if (block.timestamp > dst.deadline) revert E_EXPIRED(dst.deadline);
            if (dst.acceptanceProfile != p.acceptanceProfile || dst.indexObligations != p.indexObligations) revert E_DESTINATION_AUTH();
            (bytes32 r, bytes32 s, uint8 v) = _split(dstSig);
            address signer = ecrecover(intentDigest(dst, hash), v, r, s);
            if (signer == address(0) || signer != dst.author) revert E_SIGNATURE();
            p.author32 = Keys.principal(dst.author);
            p.proofKind = PROOF_SIGNED;
            p.nonce = dst.nonce;
            p.deadline = dst.deadline;
            p.r = r;
            p.s = s;
            p.v = v;
        }
        (publication, firstAdmission) = _run(p, actions, bodies);
        _source[publication] = src;
    }

    function _split(bytes memory sig) private pure returns (bytes32 r, bytes32 s, uint8 v) {
        if (sig.length != 65) revert E_SIGNATURE();
        assembly ("memory-safe") {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (uint256(s) > SECP256K1_N_HALF || (v != 27 && v != 28)) revert E_SIGNATURE();
    }

    // Convenience single-action entrypoints (native). They consume nonces[msg.sender].
    function publish(bytes32 typeId, bytes calldata data) external returns (bytes32 recordId) {
        Action memory x;
        x.kind = PUBLISH;
        x.typeId = typeId;
        x.bodyHashOrRecordId = keccak256(data);
        _single(x, data);
        return Keys.recordFromHash(typeId, x.bodyHashOrRecordId);
    }

    function create(bytes32 salt) external returns (bytes32 subjectId) {
        Action memory x;
        x.kind = CREATE;
        x.salt = salt;
        _single(x, "");
        return Keys.subject(principalOf(msg.sender), salt);
    }

    function bind(bytes32 purpose, bytes32 subject, bytes32 role, bytes32 target, uint32 expectedRevision)
        external
        returns (uint64 admissionOrdinal)
    {
        Action memory x;
        x.kind = BIND;
        x.purpose = purpose;
        x.subject = subject;
        x.role = role;
        x.target = target;
        x.expectedRevision = expectedRevision;
        return _single(x, "");
    }

    function unbind(bytes32 purpose, bytes32 subject, bytes32 role, uint32 expectedRevision)
        external
        returns (uint64 admissionOrdinal)
    {
        Action memory x;
        x.kind = UNBIND;
        x.purpose = purpose;
        x.subject = subject;
        x.role = role;
        x.expectedRevision = expectedRevision;
        return _single(x, "");
    }

    function _single(Action memory x, bytes memory data) private returns (uint64 admissionOrdinal) {
        Action[] memory actions = new Action[](1);
        actions[0] = x;
        bytes[] memory bodies = new bytes[](1);
        bodies[0] = data;
        Pub memory p;
        p.author = msg.sender;
        p.author32 = principalOf(msg.sender);
        p.creator = p.author32;
        p.proofKind = PROOF_NATIVE;
        p.nonce = nonces[msg.sender];
        p.acceptanceProfile = acceptanceProfileOf(actions);
        p.indexObligations = indexObligations();
        p.actionsHash = keccak256(abi.encode(actions));
        (, admissionOrdinal) = _run(p, actions, bodies);
    }

    // ------------------------------------------------------------------------ the single pass
    function _run(Pub memory p, Action[] memory actions, bytes[] memory bodies)
        private
        returns (uint64 publication, uint64 first)
    {
        uint256 n = actions.length;
        if (n == 0 || n > MAX_ACTIONS || bodies.length != n) revert E_BOUNDS(0);
        bytes32 publicationId = keccak256(abi.encode(p.author, p.nonce, p.actionsHash));
        uint64 prior = _publicationOrdinal[publicationId];
        if (prior != 0) revert AlreadyAdmitted(prior);
        if (p.nonce != nonces[p.author]) revert E_NONCE(p.author, nonces[p.author], p.nonce);
        uint256 c = _counters;
        p.ord = uint64(c);
        p.records = uint64(c >> 64);
        p.bindings = uint64(c >> 128);
        uint64 publications = uint64(c >> 192);
        if (p.ord + uint64(n) >= GUARD || publications >= GUARD - 1) revert E_BOUNDS(1);
        p.publication = publications + 1;
        first = p.ord + 1;
        // ---- writes begin; any later failure reverts every one of them (EVM rollback, no journal)
        nonces[p.author] = p.nonce + 1;
        _publicationOrdinal[publicationId] = p.publication;
        _writeEvidence(p, first, uint16(n));
        IIndexModule.Effect[] memory effects = new IIndexModule.Effect[](n);
        for (uint256 i; i < n; ++i) {
            ++p.ord;
            Action memory x = actions[i];
            uint8 k = x.kind;
            if (k == PUBLISH || k == REUSE) {
                effects[i] = _applyPublish(p, x, bodies[i], i);
                continue;
            }
            if (bodies[i].length != 0) revert E_SHAPE(i);
            if (k == BIND) effects[i] = _applyBind(p, x, i);
            else if (k == UNBIND) effects[i] = _applyUnbind(p, x, i);
            else if (k == CREATE) effects[i] = _applyCreate(p, x, i);
            else if (k == WITHDRAW) effects[i] = _applyWithdraw(p, x, i);
            else revert E_BOUNDS(2);
        }
        _counters = uint256(p.ord) | (uint256(p.records) << 64) | (uint256(p.bindings) << 128)
            | (uint256(p.publication) << 192);
        _notifyIndex(p.publication, effects);
        emit Published(p.publication, publicationId, p.author, p.proofKind, first, uint16(n));
        publication = p.publication;
    }

    function _writeEvidence(Pub memory p, uint64 first, uint16 leafCount) private {
        EvidenceCell storage e = _evidence[p.publication];
        e.w0 = uint256(uint160(p.author)) | (uint256(p.proofKind) << 160) | (uint256(p.v) << 164)
            | (uint256(leafCount) << 172) | (uint256(first) << 188) | (p.imported ? (uint256(1) << 236) : 0);
        if (p.proofKind == PROOF_SIGNED) {
            e.r = p.r;
            e.s = p.s;
        }
        e.w3 = uint256(p.nonce) | (uint256(p.deadline) << 64) | ((block.number & 0xFFFFFFFFFF) << 128);
        e.acceptanceProfile = p.acceptanceProfile;
        e.indexObligations = p.indexObligations;
        e.actionsHash = p.actionsHash;
    }

    /// PUBLISH (bytes supplied) or REUSE (existing id, bytes loaded). Checked references and
    /// the acceptance hook run on EVERY admission, dedup and reuse included. Earlier actions of
    /// the same publication are already written, so a reference to them resolves (delta 5).
    function _applyPublish(Pub memory p, Action memory x, bytes memory data, uint256 leaf)
        private
        returns (IIndexModule.Effect memory ef)
    {
        if (x.purpose != 0 || x.subject != 0 || x.role != 0 || x.target != 0 || x.expectedRevision != 0 || x.salt != 0) {
            revert E_SHAPE(leaf);
        }
        (bool registered, address acceptor, bytes32 codehash, uint8 refCount) = registry.typeInfo(x.typeId);
        if (!registered) revert E_UNKNOWN_TYPE(x.typeId);
        bytes32 id;
        bytes memory bodyBytes;
        if (x.kind == PUBLISH) {
            if (data.length > MAX_BODY) revert E_BOUNDS(3);
            if (keccak256(data) != x.bodyHashOrRecordId) revert E_BODY_HASH(leaf);
            id = Keys.recordFromHash(x.typeId, x.bodyHashOrRecordId);
            bodyBytes = data;
        } else {
            if (data.length != 0) revert E_SHAPE(leaf);
            id = x.bodyHashOrRecordId;
            RecordCell storage existing = _record[id];
            if (existing.typeId == bytes32(0)) revert E_MISSING_RECORD(leaf, id);
            if (existing.typeId != x.typeId) revert E_TYPE_MISMATCH(leaf, x.typeId, existing.typeId);
            bodyBytes = _loadBody(id, uint32(existing.meta >> 48));
        }
        bytes32[] memory refs = new bytes32[](refCount);
        if (refCount != 0) {
            if (bodyBytes.length < 32 * uint256(refCount)) revert E_SHAPE(leaf);
            bytes32[] memory expected = registry.refTypes(x.typeId);
            if (expected.length < refCount) revert E_BOUNDS(4);
            for (uint256 i; i < refCount; ++i) {
                bytes32 ref = _word(bodyBytes, i);
                bytes32 have = _record[ref].typeId;
                if (have == bytes32(0)) revert E_REF_MISSING(leaf, i, ref);
                if (expected[i] != bytes32(0) && expected[i] != have) revert E_REF_TYPE(leaf, i, expected[i], have);
                refs[i] = ref;
            }
        }
        if (acceptor != address(0)) _accept(acceptor, codehash, x.typeId, bodyBytes, refs, leaf);
        RecordCell storage cell = _record[id];
        uint256 meta = cell.meta;
        if (meta == 0) {
            ++p.records;
            cell.typeId = x.typeId;
            cell.meta = uint256(p.ord) | (bodyBytes.length << 48) | (uint256(1) << 80);
            _storeBody(id, bodyBytes);
        } else {
            cell.meta = meta + (uint256(1) << 80); // one more occurrence; Record row unchanged otherwise
        }
        AdmissionRow storage ar = _admission[p.ord];
        ar.meta = uint256(x.kind) | (leaf << 4) | (uint256(p.publication) << 20);
        ar.a = x.bodyHashOrRecordId;
        if (x.kind == PUBLISH) ar.b = x.typeId;
        ef.kind = x.kind;
        ef.admission = p.ord;
        ef.author = p.author32;
        ef.recordId = id;
        ef.typeId = x.typeId;
        emit Admitted(p.author32, x.typeId, id, p.ord);
    }

    function _accept(address acceptor, bytes32 codehash, bytes32 typeId, bytes memory data, bytes32[] memory refs, uint256 leaf)
        private
        view
    {
        if (acceptor.codehash != codehash) revert E_ACCEPTOR_CODE(typeId);
        // 63/64 guard: the callee must receive the full bound, or a stingy relayer could
        // make an honest acceptor fail spuriously.
        if (gasleft() < ACCEPT_GAS + ACCEPT_GAS / 63 + 20_000) revert E_GAS();
        (bool ok, bytes memory ret) =
            acceptor.staticcall{gas: ACCEPT_GAS}(abi.encodeWithSelector(IAcceptor.accept.selector, typeId, data, refs));
        if (!ok || ret.length != 32 || bytes32(ret) != bytes32(uint256(1))) revert E_REJECTED(leaf, typeId);
    }

    function _applyBind(Pub memory p, Action memory x, uint256 leaf) private returns (IIndexModule.Effect memory ef) {
        if (x.typeId != 0 || x.bodyHashOrRecordId != 0 || x.salt != 0 || x.purpose == 0 || x.target == 0) revert E_SHAPE(leaf);
        bytes32 position = Keys.position(x.purpose, x.subject, x.role);
        bytes32 key = Keys.binding(p.author32, position);
        HeadRow storage h = _head[key];
        uint256 meta = h.meta;
        uint8 state = uint8(meta);
        uint32 revision = uint32(meta >> 8);
        if (revision != x.expectedRevision) revert E_CAS(key, x.expectedRevision, revision);
        if (revision >= type(uint32).max - 1) revert E_BOUNDS(5);
        // target: an existing record (typed) or an existing subject (untyped)
        bytes32 targetType = _record[x.target].typeId;
        if (targetType == bytes32(0) && _subject[x.target] == 0) revert E_TARGET_MISSING(leaf, x.target);
        bytes32 expected = registry.bindingRefType(x.purpose, x.role);
        if (expected != bytes32(0) && expected != targetType) revert E_TARGET_TYPE(leaf, expected, targetType);
        uint64 bOrd = uint64((meta >> 168) & GUARD);
        if (state == 0) {
            bOrd = ++p.bindings;
            if (bOrd >= GUARD) revert E_BOUNDS(6);
            _bindingPosition[bOrd] = position;
            PositionCell storage pc = _position[position];
            if (pc.purpose == bytes32(0)) {
                pc.purpose = x.purpose;
                pc.subject = x.subject;
                pc.role = x.role;
            }
        }
        ef.oldTarget = h.target;
        ef.oldLive = state == 1;
        ef.freshBinding = state == 0;
        h.meta = 1 | (uint256(revision + 1) << 8) | (uint256(p.ord) << 40) | (uint256(1) << 88)
            | (((meta >> 40) & GUARD) << 120) | (uint256(bOrd) << 168);
        h.target = x.target;
        AdmissionRow storage ar = _admission[p.ord];
        ar.meta = uint256(BIND) | (leaf << 4) | (uint256(p.publication) << 20) | (uint256(bOrd) << 68)
            | (uint256(x.expectedRevision) << 116);
        ar.a = x.target;
        bytes32 scopeKey = Keys.scope(p.author32, x.purpose, x.subject);
        ef.kind = BIND;
        ef.admission = p.ord;
        ef.author = p.author32;
        ef.recordId = x.target;
        ef.typeId = targetType;
        ef.scopeKey = scopeKey;
        ef.bindingKey = key;
        ef.bindingOrdinal = bOrd;
        ef.target = x.target;
        emit Admitted(p.author32, scopeKey, x.target, p.ord);
    }

    function _applyUnbind(Pub memory p, Action memory x, uint256 leaf) private returns (IIndexModule.Effect memory ef) {
        if (x.typeId != 0 || x.bodyHashOrRecordId != 0 || x.salt != 0 || x.target != 0 || x.purpose == 0) revert E_SHAPE(leaf);
        bytes32 key = Keys.binding(p.author32, Keys.position(x.purpose, x.subject, x.role));
        HeadRow storage h = _head[key];
        uint256 meta = h.meta;
        if (uint8(meta) != 1) revert E_NOT_LIVE(key);
        uint32 revision = uint32(meta >> 8);
        if (revision != x.expectedRevision) revert E_CAS(key, x.expectedRevision, revision);
        if (revision >= type(uint32).max - 1) revert E_BOUNDS(5);
        uint64 bOrd = uint64((meta >> 168) & GUARD);
        ef.oldTarget = h.target;
        ef.oldLive = true;
        // tombstone: state 2, tombstoneCause 1 (BindingFold layout), target cleared, evidence kept
        h.meta = 2 | (uint256(revision + 1) << 8) | (uint256(p.ord) << 40) | (uint256(1) << 96)
            | (((meta >> 40) & GUARD) << 120) | (uint256(bOrd) << 168);
        h.target = bytes32(0);
        AdmissionRow storage ar = _admission[p.ord];
        ar.meta = uint256(UNBIND) | (leaf << 4) | (uint256(p.publication) << 20) | (uint256(bOrd) << 68)
            | (uint256(x.expectedRevision) << 116);
        bytes32 scopeKey = Keys.scope(p.author32, x.purpose, x.subject);
        ef.kind = UNBIND;
        ef.admission = p.ord;
        ef.author = p.author32;
        ef.scopeKey = scopeKey;
        ef.bindingKey = key;
        ef.bindingOrdinal = bOrd;
        emit Admitted(p.author32, scopeKey, bytes32(0), p.ord);
    }

    function _applyCreate(Pub memory p, Action memory x, uint256 leaf) private returns (IIndexModule.Effect memory ef) {
        if (
            x.typeId != 0 || x.bodyHashOrRecordId != 0 || x.purpose != 0 || x.subject != 0 || x.role != 0 || x.target != 0
                || x.expectedRevision != 0
        ) revert E_SHAPE(leaf);
        bytes32 subjectId = Keys.subject(p.creator, x.salt);
        if (_subject[subjectId] != 0) revert E_SUBJECT_EXISTS(subjectId);
        _subject[subjectId] = p.ord;
        AdmissionRow storage ar = _admission[p.ord];
        ar.meta = uint256(CREATE) | (leaf << 4) | (uint256(p.publication) << 20);
        ar.a = x.salt;
        ef.kind = CREATE;
        ef.admission = p.ord;
        ef.author = p.author32;
        ef.recordId = subjectId;
        emit Admitted(p.author32, subjectId, bytes32(0), p.ord);
    }

    /// Withdraw the author's own publish/reuse admission: the occurrence count drops, the
    /// record bytes and the other authors' admissions are untouched. (Lab scope: does not
    /// tombstone heads that were set by that admission — see TODO.)
    function _applyWithdraw(Pub memory p, Action memory x, uint256 leaf) private returns (IIndexModule.Effect memory ef) {
        if (
            x.typeId != 0 || x.bodyHashOrRecordId != 0 || x.purpose != 0 || x.subject != 0 || x.role != 0
                || x.expectedRevision != 0 || x.salt != 0
        ) revert E_SHAPE(leaf);
        uint256 t = uint256(x.target);
        if (t == 0 || t >= p.ord) revert E_WITHDRAW(leaf, 0);
        AdmissionRow storage tr = _admission[uint64(t)];
        uint256 tm = tr.meta;
        uint8 tk = uint8(tm & 0xF);
        if (tk != PUBLISH && tk != REUSE) revert E_WITHDRAW(leaf, 1);
        if (((tm >> 148) & 1) != 0) revert E_WITHDRAW(leaf, 2);
        uint64 tpub = uint64((tm >> 20) & GUARD);
        if (address(uint160(_evidence[tpub].w0)) != p.author) revert E_WITHDRAW(leaf, 3);
        bytes32 rid = tk == PUBLISH ? Keys.recordFromHash(tr.b, tr.a) : tr.a;
        tr.meta = tm | (uint256(1) << 148);
        RecordCell storage cell = _record[rid];
        cell.meta = cell.meta - (uint256(1) << 80);
        AdmissionRow storage ar = _admission[p.ord];
        ar.meta = uint256(WITHDRAW) | (leaf << 4) | (uint256(p.publication) << 20);
        ar.a = x.target;
        ef.kind = WITHDRAW;
        ef.admission = p.ord;
        ef.author = p.author32;
        ef.recordId = rid;
        ef.typeId = cell.typeId;
        emit Admitted(p.author32, cell.typeId, rid, p.ord);
    }

    /// One bounded CALL per publication. The module must revert to refuse; refusal reverts
    /// the whole publication (mandatory-index rollback). address(0) = run "without".
    function _notifyIndex(uint64 publication, IIndexModule.Effect[] memory effects) private {
        address m = indexModule;
        if (m == address(0)) return;
        uint256 budget = INDEX_GAS_BASE + INDEX_GAS_PER_ACTION * effects.length;
        if (gasleft() < budget + budget / 63 + 20_000) revert E_GAS();
        (bool ok, bytes memory ret) =
            m.call{gas: budget}(abi.encodeWithSelector(IIndexModule.onAdmission.selector, publication, effects));
        if (!ok) revert E_INDEX(ret);
    }

    // ------------------------------------------------------------------------ commitments a signer computes
    /// Running hash over (typeId, pinned acceptor codehash) of every publish/reuse action, in order.
    function acceptanceProfileOf(Action[] memory actions) public view returns (bytes32 profile) {
        for (uint256 i; i < actions.length; ++i) {
            uint8 k = actions[i].kind;
            if (k != PUBLISH && k != REUSE) continue;
            (,, bytes32 codehash,) = registry.typeInfo(actions[i].typeId);
            profile = keccak256(abi.encode(profile, actions[i].typeId, codehash));
        }
    }

    function indexObligations() public view returns (bytes32) {
        address m = indexModule;
        return m == address(0) ? bytes32(0) : keccak256(abi.encode(m, m.codehash));
    }

    function intentDigest(Intent memory intent, bytes32 actionsHash) public view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                INTENT_TYPEHASH,
                intent.realmId,
                intent.coreCodeCommitment,
                intent.author,
                intent.nonce,
                intent.deadline,
                intent.acceptanceProfile,
                intent.indexObligations,
                actionsHash
            )
        );
        return keccak256(abi.encodePacked(hex"1901", domainSeparator, structHash));
    }

    function coreCodeCommitment() external view returns (bytes32) {
        return address(this).codehash;
    }

    /// Origin of this Realm for contract principals (pre-seal check 1).
    function realmOrigin() public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this).codehash));
    }

    /// The principal id an account presents at native ingress here: an EOA is its key
    /// everywhere; a contract is (kind 2, realmOrigin, address).
    function principalOf(address account) public view returns (bytes32) {
        return Keys.principalFor(account, realmOrigin());
    }

    function isImported(uint64 publication) external view returns (bool) {
        return ((_evidence[publication].w0 >> 236) & 1) != 0;
    }

    function sourceEvidence(uint64 publication) external view returns (SourceEvidence memory) {
        return _source[publication];
    }

    // ------------------------------------------------------------------------ raw getters (LensReader and clean readers)
    function record(bytes32 id) external view returns (bytes32 typeId, uint64 firstAdmission, uint32 occurrences, bytes memory data) {
        RecordCell storage c = _record[id];
        typeId = c.typeId;
        uint256 meta = c.meta;
        firstAdmission = uint64(meta & GUARD);
        occurrences = uint32(meta >> 80);
        data = _loadBody(id, uint32(meta >> 48));
    }

    function body(bytes32 id) external view returns (bytes memory) {
        return _loadBody(id, uint32(_record[id].meta >> 48));
    }

    function subjectCreatedAt(bytes32 subjectId) external view returns (uint64) {
        return _subject[subjectId];
    }

    function admission(uint64 ordinal)
        external
        view
        returns (uint8 kind, uint16 leaf, uint64 publication, uint64 bindingOrdinal, uint32 expectedRevision, bool withdrawn, bytes32 a, bytes32 b)
    {
        AdmissionRow storage ar = _admission[ordinal];
        uint256 m = ar.meta;
        kind = uint8(m & 0xF);
        leaf = uint16((m >> 4) & 0xFFFF);
        publication = uint64((m >> 20) & GUARD);
        bindingOrdinal = uint64((m >> 68) & GUARD);
        expectedRevision = uint32(m >> 116);
        withdrawn = ((m >> 148) & 1) != 0;
        a = ar.a;
        b = ar.b;
    }

    function evidence(uint64 publication)
        external
        view
        returns (
            address author,
            uint8 proofKind,
            uint8 v,
            uint16 leafCount,
            uint64 firstAdmission,
            bytes32 r,
            bytes32 s,
            uint64 nonce,
            uint64 deadline,
            uint64 basis,
            bytes32 acceptanceProfile,
            bytes32 indexObligations_,
            bytes32 actionsHash
        )
    {
        EvidenceCell storage e = _evidence[publication];
        uint256 w0 = e.w0;
        uint256 w3 = e.w3;
        author = address(uint160(w0));
        proofKind = uint8((w0 >> 160) & 0xF);
        v = uint8((w0 >> 164) & 0xFF);
        leafCount = uint16((w0 >> 172) & 0xFFFF);
        firstAdmission = uint64((w0 >> 188) & GUARD);
        r = e.r;
        s = e.s;
        nonce = uint64(w3);
        deadline = uint64(w3 >> 64);
        basis = uint64((w3 >> 128) & 0xFFFFFFFFFF);
        acceptanceProfile = e.acceptanceProfile;
        indexObligations_ = e.indexObligations;
        actionsHash = e.actionsHash;
    }

    function head(bytes32 key)
        external
        view
        returns (uint8 state, uint32 revision, uint64 admissionOrdinal, uint64 previous, uint64 bindingOrdinal, bytes32 target)
    {
        HeadRow storage h = _head[key];
        uint256 m = h.meta;
        state = uint8(m);
        revision = uint32(m >> 8);
        admissionOrdinal = uint64((m >> 40) & GUARD);
        previous = uint64((m >> 120) & GUARD);
        bindingOrdinal = uint64((m >> 168) & GUARD);
        target = h.target;
    }

    function bindingPosition(uint64 ordinal) external view returns (bytes32) {
        return _bindingPosition[ordinal];
    }

    function positionCell(bytes32 position) external view returns (bytes32 purpose, bytes32 subject, bytes32 role) {
        PositionCell storage pc = _position[position];
        return (pc.purpose, pc.subject, pc.role);
    }

    function counts() external view returns (uint64 admissions, uint64 records, uint64 bindings, uint64 publications) {
        uint256 c = _counters;
        return (uint64(c), uint64(c >> 64), uint64(c >> 128), uint64(c >> 192));
    }

    function publicationOf(bytes32 publicationId) external view returns (uint64) {
        return _publicationOrdinal[publicationId];
    }

    function extsload(bytes32 slot) external view returns (bytes32 value) {
        assembly ("memory-safe") {
            value := sload(slot)
        }
    }

    function setIndexModule(address module) external {
        if (msg.sender != admin) revert E_ADMIN();
        indexModule = module;
        emit IndexModuleSet(module);
    }

    // ------------------------------------------------------------------------ body words
    // Bodies are stored as whole words (no Solidity `bytes` length slot): a 32-byte quote is
    // one word, a 41-byte binary is two. The tail word is masked so state is canonical.
    function _storeBody(bytes32 id, bytes memory data) private {
        uint256 len = data.length;
        uint256 words = (len + 31) >> 5;
        uint256 tail = len & 31;
        for (uint256 i; i < words; ++i) {
            bytes32 w;
            assembly ("memory-safe") {
                w := mload(add(add(data, 32), shl(5, i)))
            }
            if (tail != 0 && i == words - 1) w &= bytes32(~uint256(0) << (256 - 8 * tail));
            _bodyWord[id][i] = w;
        }
    }

    function _loadBody(bytes32 id, uint256 len) private view returns (bytes memory out) {
        out = new bytes(len);
        uint256 words = (len + 31) >> 5;
        for (uint256 i; i < words; ++i) {
            bytes32 w = _bodyWord[id][i];
            assembly ("memory-safe") {
                mstore(add(add(out, 32), shl(5, i)), w)
            }
        }
    }

    function _word(bytes memory data, uint256 index) private pure returns (bytes32 w) {
        assembly ("memory-safe") {
            w := mload(add(add(data, 32), shl(5, index)))
        }
    }
}
