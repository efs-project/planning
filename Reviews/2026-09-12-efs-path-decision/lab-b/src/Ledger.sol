// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "./Keys.sol";
import {ExecutionSlots} from "./ExecutionSlots.sol";
import {PublicationSupport} from "./PublicationSupport.sol";
import {PublicationPreparation as P} from "./PublicationPreparation.sol";
import {ReadSetStorage} from "./ReadSetStorage.sol";
import {ContractSignatureEvidenceStore} from "./ContractSignatureEvidenceStore.sol";
import {IAcceptor, IIndexModule, ITypeRegistry,IIndexReadiness,IndexReadinessProfile} from "./Interfaces.sol";

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
        uint8 kind; // PUBLISH | REUSE | BIND | UNBIND | CREATE | WITHDRAW | RELEASE
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

    /// Versioned guarded ABI. Never reinterpret a legacy coreCodeCommitment as executionSet.
    struct IntentV2 {
        bytes32 realmId;
        bytes32 realmOrigin;
        bytes32 executionSet;
        address author;
        uint64 nonce;
        uint64 deadline;
        bytes32 acceptanceProfile;
        bytes32 indexObligations;
        bytes32 readSetHash;
    }
    struct ReadSetV2 { bytes32[] principalIds; bytes32[] positions; bytes32[] expectedHeads; }
    struct PublicationContext {
        bytes32 principalId;
        bytes32 executionSet;
        bytes32 readSetHash;
        bytes32 intentDigest;
        uint8 principalKind; // 1 signing-key namespace, 2 instance-qualified contract
        uint8 authorizationProfile; // 1 EVM call, 2 ECDSA per-intent signature
        uint8 intentFormat; // 1 legacy, 2 guarded; source import context is separate
    }
    struct ExecutionInfo {
        bytes32 origin;
        uint256 revision;
        bytes32 shellCodeHash;
        address implementation;
        bytes32 implementationCodeHash;
        address registryAddress;
        bytes32 registryCodeHash;
        address indexAddress;
        bytes32 indexCodeHash;
        uint64 indexGeneration;
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
        bytes32 publicationId; // set by _beginPublication (kept off the batch loop's stack)
        uint64 first; // first admission ordinal of this publication (idem)
        bytes32 execution;
        bytes32 intentHash;
        bytes32 readsHash;
        bytes readBytes;
        uint8 format;
        bytes contractSignature;
    }

    // What one admission reads from the registry (memory struct: one pointer on the stack; the
    // publish path is split into small helpers to stay within the via-IR stack, see _applyPublish).
    struct TypeView {
        bytes32 typeId;
        address mandatory; // the Type's declared rule (pinned instance); 0 = no rule
        bytes32 ruleId; // its codehash (part of the Type id)
        address policy; // the Realm's additional policy acceptor; 0 = none
        bytes32 policyCodehash;
        uint8 refCount;
        uint16 activation; // active policy row index (recorded per admission)
    }

    // ---- durable rows (slot counts are ESTIMATED fresh slots per row)
    struct RecordCell { bytes32 typeId; uint256 meta; } // meta: firstAdmission u48@0 | length u32@48 | occurrences u32@80   (2 + body words)
    struct AdmissionRow { uint256 meta; bytes32 a; bytes32 b; } // meta: kind u4@0 | leaf u16@4 | publication u48@20 | bindingOrd u48@68 | expectedRevision u32@116 | withdrawn u1@148 | activation u16@152 (publish/reuse: registry policy row that admitted it)
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
        uint8 v; // 0 = no signature (contract-author source: chain-state witness) — UNSUPPORTED at import, see importPublication
        uint8 grade; // 1 = source signature verified here. 0 is never retained: an unverified witness is refused (E_SOURCE_UNSUPPORTED)
    }

    // ------------------------------------------------------------------------ constants
    uint8 public constant PUBLISH = 1;
    uint8 public constant REUSE = 2;
    uint8 public constant BIND = 3;
    uint8 public constant UNBIND = 4;
    uint8 public constant CREATE = 5;
    uint8 public constant WITHDRAW = 6;
    uint8 public constant RELEASE = 7;
    uint8 public constant PROOF_NATIVE = 1; // author = msg.sender; portability proof = chain-state witness
    uint8 public constant PROOF_SIGNED = 2; // author = ecrecover(PublicationIntent); portability proof = the signature
    uint256 public constant MAX_ACTIONS = 64;
    uint256 public constant MAX_BODY = 8192;
    uint256 public constant ACCEPT_GAS = 300_000; // bounded STATICCALL to the acceptor
    uint256 public constant INDEX_GAS_BASE = 200_000; // bounded CALL to the index module ...
    uint256 public constant INDEX_GAS_PER_ACTION = 150_000; // ... plus this per action
    uint64 private constant GUARD = (uint64(1) << 48) - 1;
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
    bytes32 public immutable guardedDomainSeparator;
    address public immutable implementationSelf;
    // Address and expected codehash are embedded in implementationCodeHash, hence
    // recoverable/pinned by every historical ExecutionInfo. No linker configuration.
    address private immutable publicationSupport;
    bytes32 private immutable publicationSupportCodehash;
    // Compatible root family only. Full read-set physical support additionally
    // requires readSetStorageProfile plus the exact implementation code identity.
    bytes32 public constant LAYOUT_ID = keccak256("efs.lab.ledger-layout/2:roots-0-12-preserved:context-13:execution-14:readsets-15");
    bytes32 public constant GUARDED_INTENT_TYPEHASH = keccak256("IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)");
    bytes32 public constant HEAD_SNAPSHOT_V2 = keccak256("efs.lab.head-snapshot/2");
    bytes32 public constant READ_SET_V2 = keccak256("efs.lab.read-set/2:ordered-first-binding");

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
    mapping(uint64 => PublicationContext) private _context; // 13, never infer old principals from account code
    mapping(bytes32 => ExecutionInfo) private _execution; // 14, first publication records exact components
    mapping(bytes32 => bytes) private _readSets; // 15, exact legacy dynamic-bytes codec; never a pointer

    event Admitted(bytes32 indexed author, bytes32 indexed scope, bytes32 recordId, uint64 admission);
    event Published(uint64 indexed publication, bytes32 indexed publicationId, address indexed author, uint8 proofKind, uint64 firstAdmission, uint16 leafCount);
    event IndexModuleSet(address module);
    event ExecutionChanged(bytes32 indexed executionSet, uint256 revision);
    event ReadSetChecked(uint64 indexed publication, bytes32 indexed readSetHash);

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
    error E_REJECTED(uint256 leaf, bytes32 typeId); // the Type's MANDATORY (declared) rule refused: final
    error E_POLICY_REJECTED(uint256 leaf, bytes32 typeId); // the Realm's ADDITIONAL policy acceptor refused
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
    error E_SOURCE_UNSUPPORTED(); // native (contract-author) source packet: no verifiable witness here — fail closed
    error E_NO_BASIS(uint64 ordinal); // acceptanceBasis asked for a row that is not a publish/reuse admission
    error E_NATIVE_AMBIGUOUS();
    error E_CHAIN();
    error E_READSET_SHAPE();
    error E_READSET_STALE(uint256 positionIndex, uint256 principalIndex);
    error E_GUARDED_IMPORT_UNSUPPORTED();
    error E_LEGACY_UNSUPPORTED();

    constructor(ITypeRegistry registry_, bytes32 realmId_) {
        ExecutionSlots.initialize();
        implementationSelf = address(this);
        publicationSupport = address(new PublicationSupport());
        publicationSupportCodehash = publicationSupport.codehash;
        registry = registry_;
        realmId = realmId_;
        admin = msg.sender;
        domainSeparator = keccak256(
            abi.encode(keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-RoadB-Lab"), keccak256("1"))
        );
        guardedDomainSeparator = keccak256(abi.encode(keccak256("EIP712Domain(string name,string version)"), keccak256("EFS2-RoadB-Lab"), keccak256("2")));
    }

    // ------------------------------------------------------------------------ ingress
    /// Explicit ordinary deployed-wallet lane; opaque/empty bytes are not ECDSA.
    function executeGuarded1271(IntentV2 memory intent,Action[] memory actions,bytes[] memory bodies,
        ReadSetV2 memory readSet,bytes calldata signature) external returns(uint64,uint64)
    {
        if(signature.length>4096)revert E_SIGNATURE();
        return _guardedSignature(intent,actions,bodies,readSet,signature,true);
    }

    function executeGuardedSigned(IntentV2 memory intent, Action[] memory actions, bytes[] memory bodies,
        ReadSetV2 memory readSet, bytes memory sig) external returns (uint64, uint64)
    {
        return _guardedSignature(intent,actions,bodies,readSet,sig,false);
    }

    function _guardedSignature(IntentV2 memory intent,Action[] memory actions,bytes[] memory bodies,
        ReadSetV2 memory readSet,bytes memory sig,bool wallet) private returns(uint64,uint64)
    {
        bytes memory readBytes = abi.encode(readSet);
        Pub memory p = _prepare(abi.encodeWithSelector(wallet?PublicationSupport.prepareGuarded1271.selector:PublicationSupport.prepareGuardedSigned.selector,
            intent, abi.encode(actions), readBytes, sig));
        p.readBytes = readBytes;
        p.contractSignature=sig;
        return _run(p, actions, bodies);
    }

    /// Same-call checked application flow: actual caller remains the author.
    function executeGuarded(Action[] memory actions, bytes[] memory bodies, uint64 nonce,
        bytes32 expectedExecution, ReadSetV2 memory readSet) external returns (uint64, uint64)
    {
        bytes memory readBytes = abi.encode(readSet);
        Pub memory p = _prepare(abi.encodeCall(PublicationSupport.prepareGuardedNative,
            (nonce, expectedExecution, abi.encode(actions), readBytes)));
        p.readBytes = readBytes;
        return _run(p, actions, bodies);
    }

    /// Canonical empty means all three arrays empty. Principal order is significant;
    /// duplicate principals or coordinates and non-Cartesian vectors are ambiguous.
    function readSetHash(ReadSetV2 memory rs) public view returns (bytes32) {
        return _supportRead(abi.encodeCall(PublicationSupport.readSetHash,(abi.encode(rs))));
    }

    function headSnapshot(bytes32 principalId, bytes32 position) public view returns (bytes32) {
        HeadRow storage h = _head[Keys.binding(principalId, position)];
        uint256 meta = h.meta;
        return keccak256(abi.encode(HEAD_SNAPSHOT_V2, uint8(meta), uint32(meta >> 8), uint64((meta >> 40) & GUARD), h.target));
    }

    function guardedIntentDigest(IntentV2 memory intent, bytes32 actionsHash) public view returns (bytes32) {
        return _supportRead(abi.encodeWithSelector(PublicationSupport.guardedDigest.selector,guardedDomainSeparator,GUARDED_INTENT_TYPEHASH,intent,actionsHash));
    }

    function guardedPublicationId(bytes32 principalId, bytes32 digest) public pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs.lab.publication/2"), principalId, digest));
    }

    /// The v1 import envelope cannot represent guarded context. No reinterpretation.
    function importGuardedPublication(bytes calldata) external pure { revert E_GUARDED_IMPORT_UNSUPPORTED(); }

    /// Native batch. Author = msg.sender (EOA or contract). `nonce` must equal nonces[author];
    /// an exact retry (same author, nonce, actions) reverts AlreadyAdmitted with no new rows.
    function execute(Action[] memory actions, bytes[] memory bodies, uint64 nonce)
        external
        returns (uint64 publication, uint64 firstAdmission)
    {
        Pub memory p = _prepare(abi.encodeCall(PublicationSupport.prepareNative, (nonce, abi.encode(actions))));
        return _run(p, actions, bodies);
    }

    /// Signed batch, relayable by anyone. Everything the author authorizes is under the
    /// signature: realm, core code, nonce, deadline, acceptance profile, index obligations
    /// and the full action tuples. All checks precede the first write.
    function executeSigned(Intent memory intent, Action[] memory actions, bytes[] memory bodies, bytes memory sig)
        external
        returns (uint64 publication, uint64 firstAdmission)
    {
        Pub memory p = _prepare(abi.encodeWithSelector(PublicationSupport.prepareSigned.selector, intent, abi.encode(actions), sig));
        return _run(p, actions, bodies);
    }

    /// Import (pre-seal check 3). The source signature is verified over the SOURCE context
    /// and retained as evidence; it authorizes nothing here. Destination authority is a
    /// separate signature by the same EOA under THIS Realm's context, or the destination's
    /// native path (msg.sender == author, empty dstSig). Destination acceptance (under THIS
    /// Realm's current policy), CAS and index effects then run exactly as for a local
    /// publication. Subject ids minted by the imported actions keep the verified SOURCE principal.
    ///
    /// Native-source packets (src.v == 0: a contract author at the source, whose only proof is a
    /// chain-state witness) are UNSUPPORTED here and fail closed with E_SOURCE_UNSUPPORTED: this
    /// Realm cannot verify such a witness, and an unverified claim must not mint or control a
    /// subject under the claimed principal (REPAIR.md R1). This is a temporary prototype limit —
    /// not a waiver of portability and not an invented source proof. Lifting it needs a declared,
    /// verifiable source-witness format (chain id + Realm deployment + account + finalized-state
    /// proof of the historical admission), which this lab does not build. Local native
    /// publication (execute / the convenience entrypoints) is unchanged.
    function importPublication(
        SourceEvidence memory src,
        Action[] memory actions,
        bytes[] memory bodies,
        Intent memory dst,
        bytes memory dstSig
    ) external returns (uint64 publication, uint64 firstAdmission) {
        Pub memory p = _prepare(abi.encodeWithSelector(PublicationSupport.prepareImport.selector, src, abi.encode(actions), dst, dstSig));
        (publication, firstAdmission) = _run(p, actions, bodies);
        src.grade = 1; // preparation verified the source; only Ledger retains it after successful admission
        _source[publication] = src;
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
        Pub memory p = _prepare(abi.encodeCall(PublicationSupport.prepareNative, (nonces[msg.sender], abi.encode(actions))));
        (, admissionOrdinal) = _run(p, actions, bodies);
    }

    // ------------------------------------------------------------------------ the single pass
    // The batch loop holds no per-item temporaries (via-IR stack discipline, 08:00 compile finding):
    // the prologue and epilogue are helpers and each item is applied through _applyOne.
    function _run(Pub memory p, Action[] memory actions, bytes[] memory bodies)
        private
        returns (uint64, uint64)
    {
        ExecutionSlots.requireIdle();
        ExecutionSlots.write(ExecutionSlots.PUBLICATION_ACTIVE, 1);
        if (block.chainid != ExecutionSlots.read(ExecutionSlots.GENESIS)) revert E_CHAIN();
        if (p.proofKind == PROOF_NATIVE && msg.sender.code.length == 0 && msg.sender != tx.origin) revert E_NATIVE_AMBIGUOUS();
        uint256 n = actions.length;
        if (n == 0 || n > MAX_ACTIONS || bodies.length != n) revert E_BOUNDS(0);
        uint64 registryEpoch = registry.epoch();
        IIndexModule.Effect[] memory effects = _beginPublication(p, n);
        IIndexModule.Effect[] memory segment = new IIndexModule.Effect[](1);
        uint256 budget = uint256(_supportRead(abi.encodeCall(PublicationSupport.indexAllowance,(indexModule,address(registry),abi.encode(actions)))));
        for (uint256 i; i < n; ++i) {
            ++p.ord;
            effects[i] = _applyOne(p, actions[i], bodies[i], i);
            _checkpoint(p);
            segment[0] = effects[i];
            budget = _notifyIndex(p.publication, segment, budget, false);
            _requirePublicationBasis(p.execution, registryEpoch);
        }
        _notifyIndex(p.publication, effects, budget, true);
        _requirePublicationBasis(p.execution, registryEpoch);
        ExecutionSlots.write(ExecutionSlots.PUBLICATION_ACTIVE, 0);
        emit Published(p.publication, p.publicationId, p.author, p.proofKind, p.first, uint16(n));
        return (p.publication, p.first);
    }

    function _requirePublicationBasis(bytes32 execution, uint64 registryEpoch) private view {
        if (registry.epoch() != registryEpoch) revert E_INTENT(3);
        if (executionSet() != execution) revert E_INTENT(2);
    }

    /// Retry/nonce/counter checks, then the first writes (nonce, retry key, evidence cell).
    function _beginPublication(Pub memory p, uint256 n) private returns (IIndexModule.Effect[] memory effects) {
        if (p.format == 0) {
            p.format = 1;
            p.execution = executionSet();
            p.intentHash = intentDigest(Intent(realmId, address(this).codehash, p.author, p.nonce, p.deadline, p.acceptanceProfile, p.indexObligations), p.actionsHash);
        }
        p.publicationId = p.format == 2 ? guardedPublicationId(p.author32, p.intentHash) : keccak256(abi.encode(p.author, p.nonce, p.actionsHash));
        uint64 prior = _publicationOrdinal[p.publicationId];
        if (prior != 0) revert AlreadyAdmitted(prior);
        if (p.nonce != nonces[p.author]) revert E_NONCE(p.author, nonces[p.author], p.nonce);
        uint256 c = _counters;
        p.ord = uint64(c);
        p.records = uint64(c >> 64);
        p.bindings = uint64(c >> 128);
        uint64 publications = uint64(c >> 192);
        if (p.ord + uint64(n) >= GUARD || publications >= GUARD - 1) revert E_BOUNDS(1);
        p.publication = publications + 1;
        p.first = p.ord + 1;
        // ---- writes begin; any later failure reverts every one of them (EVM rollback, no journal)
        nonces[p.author] = p.nonce + 1;
        _publicationOrdinal[p.publicationId] = p.publication;
        _writeEvidence(p, p.first, uint16(n));
        effects = new IIndexModule.Effect[](n);
    }

    function _checkpoint(Pub memory p) private {
        _counters = uint256(p.ord) | (uint256(p.records) << 64) | (uint256(p.bindings) << 128)
            | (uint256(p.publication) << 192);
    }

    /// One action of the ordered prefix. Kept out of the loop body so its callees' locals never
    /// join the loop's live set.
    function _applyOne(Pub memory p, Action memory x, bytes memory data, uint256 i)
        private
        returns (IIndexModule.Effect memory)
    {
        uint8 k = x.kind;
        if (k == PUBLISH || k == REUSE) return _applyPublish(p, x, data, i);
        if (data.length != 0) revert E_SHAPE(i);
        if (k == BIND) return _applyBind(p, x, i);
        if (k == UNBIND || k == RELEASE) return _applyUnbind(p, x, i);
        if (k == CREATE) return _applyCreate(p, x, i);
        if (k == WITHDRAW) return _applyWithdraw(p, x, i);
        revert E_BOUNDS(2);
    }

    function _writeEvidence(Pub memory p, uint64 first, uint16 leafCount) private {
        _context[p.publication] = PublicationContext(p.author32, p.execution, p.readsHash, p.intentHash,
            p.author32 == Keys.principal(p.author) ? 1 : 2, p.proofKind, p.format);
        if (_execution[p.execution].revision == 0) _execution[p.execution] = _currentExecution();
        if (p.format == 2) {
            if (_readSets[p.readsHash].length == 0) ReadSetStorage.retain(p.readsHash,p.readBytes);
            emit ReadSetChecked(p.publication, p.readsHash);
        }
        EvidenceCell storage e = _evidence[p.publication];
        e.w0 = uint256(uint160(p.author)) | (uint256(p.proofKind) << 160) | (uint256(p.v) << 164)
            | (uint256(leafCount) << 172) | (uint256(first) << 188) | (p.imported ? (uint256(1) << 236) : 0);
        if (p.proofKind != PROOF_NATIVE) {
            e.r = p.proofKind==3?ContractSignatureEvidenceStore(address(uint160(uint256(p.s)))).retain(
                p.publication,p.intentHash,p.r,p.contractSignature):p.r;
            e.s = p.s;
        }
        e.w3 = uint256(p.nonce) | (uint256(p.deadline) << 64) | ((block.number & 0xFFFFFFFFFF) << 128);
        e.acceptanceProfile = p.acceptanceProfile;
        e.indexObligations = p.indexObligations;
        e.actionsHash = p.actionsHash;
    }

    /// PUBLISH (bytes supplied) or REUSE (existing id, bytes loaded). Checked references and
    /// the acceptance rules run on EVERY admission, dedup and reuse included. Earlier actions of
    /// the same publication are already written, so a reference to them resolves (delta 5).
    /// Split into helpers (Type view, body, reference check, acceptance, record writes) so no
    /// more than ~8 locals are live here and `expected` never coexists with the Effect struct
    /// (via-IR stack discipline, 08:00 compile finding).
    function _applyPublish(Pub memory p, Action memory x, bytes memory data, uint256 leaf)
        private
        returns (IIndexModule.Effect memory ef)
    {
        if (x.purpose != 0 || x.subject != 0 || x.role != 0 || x.target != 0 || x.expectedRevision != 0 || x.salt != 0) {
            revert E_SHAPE(leaf);
        }
        TypeView memory t = _typeOf(x.typeId);
        (bytes32 id, bytes memory bodyBytes) = _bodyOf(x, data, leaf);
        _acceptAll(t, x.typeId, bodyBytes, _checkRefs(t, bodyBytes, leaf), leaf);
        _admitRecord(p, x, id, bodyBytes, t.activation, leaf);
        ef.kind = x.kind;
        ef.admission = p.ord;
        ef.author = p.author32;
        ef.recordId = id;
        ef.typeId = x.typeId;
        emit Admitted(p.author32, x.typeId, id, p.ord);
    }

    function _typeOf(bytes32 typeId) private view returns (TypeView memory t) {
        t.typeId = typeId;
        bool registered;
        (registered, t.mandatory, t.ruleId, t.policy, t.policyCodehash, t.refCount, t.activation) = registry.typeInfo(typeId);
        if (!registered) revert E_UNKNOWN_TYPE(typeId);
    }

    /// Record id and body bytes of a publish (supplied, hash-checked) or reuse (loaded from state).
    function _bodyOf(Action memory x, bytes memory data, uint256 leaf) private view returns (bytes32 id, bytes memory bodyBytes) {
        if (x.kind == PUBLISH) {
            if (data.length > MAX_BODY) revert E_BOUNDS(3);
            if (keccak256(data) != x.bodyHashOrRecordId) revert E_BODY_HASH(leaf);
            return (Keys.recordFromHash(x.typeId, x.bodyHashOrRecordId), data);
        }
        if (data.length != 0) revert E_SHAPE(leaf);
        id = x.bodyHashOrRecordId;
        RecordCell storage existing = _record[id];
        if (existing.typeId == bytes32(0)) revert E_MISSING_RECORD(leaf, id);
        if (existing.typeId != x.typeId) revert E_TYPE_MISMATCH(leaf, x.typeId, existing.typeId);
        bodyBytes = _loadBody(id, uint32(existing.meta >> 48));
    }

    /// The leading `refCount` body words must be existing records of the registry's expected Types.
    function _checkRefs(TypeView memory t, bytes memory bodyBytes, uint256 leaf)
        private
        view
        returns (bytes32[] memory refs)
    {
        refs = new bytes32[](t.refCount);
        if (t.refCount == 0) return refs;
        if (bodyBytes.length < 32 * uint256(t.refCount)) revert E_SHAPE(leaf);
        bytes32[] memory expected = registry.refTypes(t.typeId);
        if (expected.length < t.refCount) revert E_BOUNDS(4);
        for (uint256 i; i < t.refCount; ++i) {
            bytes32 ref = _word(bodyBytes, i);
            bytes32 have = _record[ref].typeId;
            if (have == bytes32(0)) revert E_REF_MISSING(leaf, i, ref);
            if (expected[i] != bytes32(0) && expected[i] != have) revert E_REF_TYPE(leaf, i, expected[i], have);
            refs[i] = ref;
        }
    }

    /// The Type's declared (mandatory) rule ALWAYS runs and its refusal is final (F5): no policy
    /// activation can remove or replace it. The Realm's additional policy acceptor, if any, runs
    /// after it and may only add constraints — both must accept.
    function _acceptAll(TypeView memory t, bytes32 typeId, bytes memory bodyBytes, bytes32[] memory refs, uint256 leaf) private view {
        if (t.mandatory != address(0)) _accept(t.mandatory, t.ruleId, typeId, bodyBytes, refs, leaf, false);
        if (t.policy != address(0)) _accept(t.policy, t.policyCodehash, typeId, bodyBytes, refs, leaf, true);
    }

    /// Record cell (fresh or one more occurrence) and the admission row. The policy row that
    /// admitted this action is packed into the row (no extra slot): historical reads report it
    /// instead of today's policy (acceptanceBasis).
    function _admitRecord(Pub memory p, Action memory x, bytes32 id, bytes memory bodyBytes, uint16 activation, uint256 leaf) private {
        RecordCell storage cell = _record[id];
        uint256 meta = cell.meta;
        if (meta == 0) {
            ++p.records;
            cell.typeId = x.typeId;
            cell.meta = uint256(p.ord) | (bodyBytes.length << 48) | (uint256(1) << 80);
            _storeBody(id, bodyBytes);
        } else {
            if (meta >> 80 >= type(uint32).max) revert E_BOUNDS(7);
            // Full shifted-word guard proves the result is below 2^112; no uint256 overflow.
            unchecked { cell.meta = meta + (uint256(1) << 80); } // low metadata and body unchanged
        }
        AdmissionRow storage ar = _admission[p.ord];
        ar.meta = uint256(x.kind) | (leaf << 4) | (uint256(p.publication) << 20) | (uint256(activation) << 152);
        ar.a = x.bodyHashOrRecordId;
        if (x.kind == PUBLISH) ar.b = x.typeId;
    }

    /// One bounded STATICCALL to an acceptance rule. The codehash is re-verified at every call
    /// (E_ACCEPTOR_CODE): it pins the rule's CODE, not its mutable dependencies (see TypeRegistry).
    /// `policyRule` selects the error: the mandatory rule's refusal is E_REJECTED (final), the
    /// additional policy's is E_POLICY_REJECTED.
    function _accept(address acceptor, bytes32 codehash, bytes32 typeId, bytes memory data, bytes32[] memory refs, uint256 leaf, bool policyRule)
        private
        view
    {
        if (acceptor.codehash != codehash) revert E_ACCEPTOR_CODE(typeId);
        // 63/64 guard: the callee must receive the full bound, or a stingy relayer could
        // make an honest acceptor fail spuriously.
        if (gasleft() < ACCEPT_GAS + ACCEPT_GAS / 63 + 20_000) revert E_GAS();
        (bool ok, bytes memory ret) =
            acceptor.staticcall{gas: ACCEPT_GAS}(abi.encodeWithSelector(IAcceptor.accept.selector, typeId, data, refs));
        if (!ok || ret.length != 32 || bytes32(ret) != bytes32(uint256(1))) {
            if (policyRule) revert E_POLICY_REJECTED(leaf, typeId);
            revert E_REJECTED(leaf, typeId);
        }
    }

    function _applyBind(Pub memory p, Action memory x, uint256 leaf) private returns (IIndexModule.Effect memory ef) {
        if (x.typeId != 0 || x.bodyHashOrRecordId != 0 || x.salt != 0 || x.purpose == 0 || x.target == 0) revert E_SHAPE(leaf);
        bytes32 position = Keys.position(x.purpose, x.subject, x.role);
        bytes32 key = Keys.binding(p.author32, position);
        HeadRow storage h = _head[key];
        uint256 meta = h.meta;
        uint8 state = uint8(meta);
        if (state > 3) revert E_NOT_LIVE(key);
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
        ef.freshBinding = state == 0;
        ef.recordId = x.target;
        ef.typeId = targetType;
        ef.bindingKey = key;
        ef.bindingOrdinal = bOrd;
        ef.target = x.target;
        _writeBinding(p,x,leaf,ef,h,meta,1);
    }

    function _applyUnbind(Pub memory p, Action memory x, uint256 leaf) private returns (IIndexModule.Effect memory ef) {
        if (x.typeId != 0 || x.bodyHashOrRecordId != 0 || x.salt != 0 || x.target != 0 || x.purpose == 0) revert E_SHAPE(leaf);
        bytes32 key = Keys.binding(p.author32, Keys.position(x.purpose, x.subject, x.role));
        HeadRow storage h = _head[key];
        uint256 meta = h.meta;
        uint8 state = uint8(meta);
        if (state != 1 && !(x.kind == RELEASE && state == 2)) revert E_NOT_LIVE(key);
        uint32 revision = uint32(meta >> 8);
        if (revision != x.expectedRevision) revert E_CAS(key, x.expectedRevision, revision);
        if (revision >= type(uint32).max - 1) revert E_BOUNDS(5);
        ef.bindingKey = key;
        ef.bindingOrdinal = uint64((meta >> 168) & GUARD);
        _writeBinding(p,x,leaf,ef,h,meta,x.kind == RELEASE ? 3 : 2);
    }

    // Shared retained write boundary for bind, mask and release. No new roots.
    function _writeBinding(Pub memory p,Action memory x,uint256 leaf,IIndexModule.Effect memory ef,
        HeadRow storage h,uint256 meta,uint8 nextState) private
    {
        ef.oldTarget = h.target;
        ef.oldLive = uint8(meta) == 1;
        h.meta = uint256(nextState) | (uint256(x.expectedRevision + 1) << 8) | (uint256(p.ord) << 40)
            | (nextState == 1 ? uint256(1) << 88 : nextState == 2 ? uint256(1) << 96 : 0)
            | (((meta >> 40) & GUARD) << 120) | (uint256(ef.bindingOrdinal) << 168);
        h.target = x.target;
        AdmissionRow storage ar = _admission[p.ord];
        ar.meta = uint256(x.kind) | (leaf << 4) | (uint256(p.publication) << 20) | (uint256(ef.bindingOrdinal) << 68)
            | (uint256(x.expectedRevision) << 116);
        if (nextState == 1) ar.a = x.target;
        bytes32 scopeKey = Keys.scope(p.author32, x.purpose, x.subject);
        ef.kind = x.kind;
        ef.admission = p.ord;
        ef.author = p.author32;
        ef.scopeKey = scopeKey;
        emit Admitted(p.author32, scopeKey, x.target, p.ord);
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
        bytes32 targetPrincipal = _context[tpub].principalId;
        if (targetPrincipal == 0 || targetPrincipal != p.author32) revert E_WITHDRAW(leaf, 3);
        bytes32 rid = tk == PUBLISH ? Keys.recordFromHash(tr.b, tr.a) : tr.a;
        tr.meta = tm | (uint256(1) << 148);
        RecordCell storage cell = _record[rid];
        cell.meta = cell.meta - (uint256(1) << 80);
        AdmissionRow storage ar = _admission[p.ord];
        ar.meta = uint256(WITHDRAW) | (leaf << 4) | (uint256(p.publication) << 20);
        ar.a = x.target;
        ef.kind = WITHDRAW;
        ef.admission = p.ord;
        ef.author = targetPrincipal;
        ef.recordId = rid;
        ef.typeId = cell.typeId;
        emit Admitted(p.author32, cell.typeId, rid, p.ord);
    }

    /// One joint allowance including ABI dispatch and return-copy overhead. The final
    /// callback is read-only and mandatory. address(0) remains the labelled ablation.
    function _notifyIndex(uint64 publication, IIndexModule.Effect[] memory effects, uint256 budget, bool finalPhase)
        private returns (uint256 remaining)
    {
        uint256 beforeGas = gasleft();
        address m = indexModule;
        if (m == address(0)) return budget;
        _requireSupport();
        // Effect has exactly 12 fixed ABI words. Flatten its memory pointers once;
        // the stateless dispatcher adds the public callback selector/array offset.
        // This private format avoids two dynamic ABI encoders in the near-cap Core.
        // _run bounds both the one-effect segment and full array to 1..64.
        // Consequently this aligned allocation is <=24,736 bytes; multiplication,
        // pointer arithmetic and bounded gas subtraction cannot overflow.
        address dispatcher = publicationSupport;
        assembly ("memory-safe") {
            let data := mload(0x40)
            let size := add(160,mul(mload(effects),384))
            mstore(0x40,add(data,size))
            mstore(data,m) mstore(add(data,32),budget) mstore(add(data,64),finalPhase)
            mstore(add(data,96),publication) mstore(add(data,128),mload(effects))
            for { let i := 0 } lt(i,mload(effects)) { i := add(i,1) } {
                mcopy(add(add(data,160),mul(i,384)),mload(add(add(effects,32),mul(i,32))),384)
            }
            if iszero(delegatecall(gas(),dispatcher,data,size,0,0)) {
                let ptr := mload(0x40)
                // Helper limits a raw callback response to 4096 bytes. Its largest
                // error is E_INDEX(bytes), 68 + 4096 bytes. Never copy past that.
                if gt(returndatasize(),4164) {
                    mstore(ptr,shl(224,0x2bd4fb9c)) mstore(add(ptr,4),32) mstore(add(ptr,36),0)
                    revert(ptr,68)
                }
                returndatacopy(ptr,0,returndatasize())
                revert(ptr,returndatasize())
            }
            let spent := add(sub(beforeGas,gas()),256)
            if gt(spent,budget) {
                mstore(data,shl(224,0x2bd4fb9c)) mstore(add(data,4),32) mstore(add(data,36),0)
                revert(data,68)
            }
            remaining := sub(budget,spent)
        }
    }

    function _requireSupport() private view {
        if (publicationSupport.codehash != publicationSupportCodehash) revert E_INDEX("");
    }

    /// One fixed typed preparation call. Copy only its seventeen static fields;
    /// mutable ordinals/counters, exact read bytes and every canonical write stay here.
    function _prepare(bytes memory input) private returns (Pub memory p) {
        _requireSupport();
        address support = publicationSupport;
        bytes memory output = new bytes(544);
        assembly ("memory-safe") {
            let ptr := add(output, 32)
            // A ceiling, not a demanded reserve. EIP-150 applies to actual gas.
            let ok := delegatecall(12000000, support, add(input,32), mload(input), ptr, 544)
            if or(iszero(ok), iszero(eq(returndatasize(),544))) {
                if or(ok, gt(returndatasize(),4164)) {
                    mstore(ptr,shl(224,0x2bd4fb9c)) mstore(add(ptr,4),32) mstore(add(ptr,36),0)
                    revert(ptr,68)
                }
                returndatacopy(ptr,0,returndatasize()) revert(ptr,returndatasize())
            }
        }
        P.Result memory r = abi.decode(output, (P.Result));
        // Both typed memory structs begin with the same thirteen static fields.
        // Decode above still checks every address/bool/narrow integer. Copy only
        // that shared prefix; mutable ordinals and dynamic pointers stay zero.
        assembly("memory-safe"){mcopy(p,r,416)}
        p.execution = r.execution; p.intentHash = r.intentHash;
        p.readsHash = r.readsHash; p.format = r.format;
    }

    /// Fixed output and bounded error copies, including for malformed helper code.
    function _supportRead(bytes memory input) private view returns(bytes32 result) {
        _requireSupport();
        address support=publicationSupport;
        assembly ("memory-safe") {
            let ptr:=mload(0x40)
            let ok:=staticcall(gas(),support,add(input,32),mload(input),ptr,32)
            if or(iszero(ok),iszero(eq(returndatasize(),32))) {
                if or(ok,gt(returndatasize(),4164)) {
                    mstore(ptr,shl(224,0x2bd4fb9c)) mstore(add(ptr,4),32) mstore(add(ptr,36),0)
                    revert(ptr,68)
                }
                returndatacopy(ptr,0,returndatasize()) revert(ptr,returndatasize())
            }
            result:=mload(ptr)
        }
    }

    // ------------------------------------------------------------------------ commitments a signer computes
    /// Running hash over (typeId, mandatory ruleId, ACTIVE policy codehash, registry epoch) of every
    /// publish/reuse action, in order (ruling E.B.4: a rule change invalidates unsent signatures).
    /// The ruleId is the Type's declared rule (part of its identity); the policy codehash is the
    /// Realm's current additional acceptor (0 = none): a policy activation changes the profile
    /// (and moves the epoch) without changing the Type id.
    function acceptanceProfileOf(Action[] memory actions) public view returns (bytes32 profile) {
        return _supportRead(abi.encodeCall(PublicationSupport.acceptanceProfile,(address(registry),abi.encode(actions))));
    }

    /// The acceptance basis that admitted a publish/reuse admission: its Type, the Type's mandatory
    /// rule (pinned instance + ruleId; immutable, so today's registry value IS the historical one)
    /// and the registry policy row (index, acceptor, codehash, epoch, block) in force at that
    /// admission. Read from the admission row, never re-derived from today's policy. Reverts for
    /// other kinds.
    function acceptanceBasis(uint64 ordinal)
        external
        view
        returns (
            bytes32 typeId,
            uint16 activation,
            address mandatoryAcceptor,
            bytes32 ruleId,
            address policyAcceptor,
            bytes32 policyCodehash,
            uint64 epoch,
            uint64 activatedAt
        )
    {
        _requireSupport();
        bytes memory input=abi.encodeCall(PublicationSupport.acceptanceBasis,(address(this),address(registry),ordinal));
        address support=publicationSupport;
        // Read-only extraction; exactly eight static ABI words, bounded errors.
        assembly ("memory-safe") {
            let ptr:=mload(0x40)
            let ok:=staticcall(gas(),support,add(input,32),mload(input),ptr,256)
            if or(iszero(ok),iszero(eq(returndatasize(),256))) {
                if or(ok,gt(returndatasize(),4164)) {
                    mstore(ptr,shl(224,0x2bd4fb9c)) mstore(add(ptr,4),32) mstore(add(ptr,36),0)
                    revert(ptr,68)
                }
                returndatacopy(ptr,0,returndatasize()) revert(ptr,returndatasize())
            }
            return(ptr,256)
        }
    }

    function indexObligations() public view returns (bytes32) {
        return _supportRead(abi.encodeCall(PublicationSupport.indexObligations,(indexModule)));
    }

    function intentDigest(Intent memory intent, bytes32 actionsHash) public view returns (bytes32) {
        return _supportRead(abi.encodeWithSelector(PublicationSupport.legacyDigest.selector,domainSeparator,INTENT_TYPEHASH,intent,actionsHash));
    }

    function coreCodeCommitment() external view returns (bytes32) {
        return address(this).codehash;
    }

    function layoutId() public pure virtual returns (bytes32) { return LAYOUT_ID; }
    function bindingLifecycleProfile() external pure returns (bytes32) {
        return keccak256("efs.lab.binding-lifecycle/2:bind-mask-release");
    }
    function executionRevision() public view returns (uint256) { return ExecutionSlots.read(ExecutionSlots.REVISION); }
    function genesisChainId() external view returns (uint256) { return ExecutionSlots.read(ExecutionSlots.GENESIS); }
    function implementationCodeHash() external view returns (bytes32) { return implementationSelf.codehash; }
    function publicationSupportIdentity() external view returns (address, bytes32) { return (publicationSupport,publicationSupportCodehash); }
    function _indexGeneration() private view returns (uint64) {
        (bool ok, bytes memory data) = indexModule.staticcall{gas: 30_000}(abi.encodeWithSignature("generation()"));
        return ok && data.length == 32 ? uint64(uint256(bytes32(data))) : 0;
    }
    function _currentExecution() private view returns (ExecutionInfo memory e) {
        e = ExecutionInfo(realmOrigin(), executionRevision(), address(this).codehash, implementationSelf,
            implementationSelf.codehash, address(registry), address(registry).codehash, indexModule, indexModule.codehash, _indexGeneration());
    }
    function executionSet() public view returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs.lab.execution-set/2"), layoutId(), domainSeparator, guardedDomainSeparator, _currentExecution()));
    }
    function executionInfo(bytes32 key) external view returns (ExecutionInfo memory) { return _execution[key]; }
    function publicationContext(uint64 publication) external view returns (PublicationContext memory) { return _context[publication]; }
    /// Missing hash returns empty bytes (UNKNOWN), not an inferred empty read set.
    /// Maximum preimage is 10,592 bytes (64 principals, 4 positions, 256 heads).
    function readSetStorageProfile() external pure returns(bytes32 profile,bytes32 namespace) {
        return (ReadSetStorage.PROFILE,ReadSetStorage.ROOT);
    }
    function readSetBytes(bytes32 key) external view returns (bytes memory) {
        bytes memory legacy=_readSets[key];
        return legacy.length!=0?legacy:ReadSetStorage.read(key);
    }
    function keyPrincipal(address account) external pure returns (bytes32) { return Keys.principal(account); }
    function contractPrincipal(bytes32 origin, address account) external pure returns (bytes32) { return Keys.contractPrincipal(origin, account); }

    /// Origin of this Realm for contract principals (pre-seal check 1).
    function realmOrigin() public view returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs.lab.realm-origin/2"), ExecutionSlots.read(ExecutionSlots.GENESIS), address(this)));
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

    /// Selection projection only; raw head/snapshot preserve every stored field.
    function selectionHead(bytes32 key)
        external view returns (uint8 state, uint32 revision, uint64 admissionOrdinal, bytes32 target)
    {
        HeadRow storage h = _head[key];
        uint256 m = h.meta;
        state = uint8(m);
        revision = uint32(m >> 8);
        admissionOrdinal = uint64((m >> 40) & GUARD);
        if (state == 1) target = h.target;
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

    /// Admin ablation path. Rows produced with module == 0 are NOT EQUIVALENT (a named
    /// guarantee is omitted); they are diagnostic only and must be labelled so everywhere.
    function setIndexModule(address module) external {
        _indexAdmin();
        _setIndex(module);
    }

    function replaceIndexWhenReady(IIndexReadiness.ReplacementRequest calldata request) external {
        _indexAdmin();
        if(_supportRead(abi.encodeCall(PublicationSupport.checkReplacement,(request)))!=IndexReadinessProfile.ACK)revert E_INDEX("");
        _setIndex(request.replacement);
    }

    function _indexAdmin() private view {
        ExecutionSlots.requireIdle();
        if(msg.sender!=admin)revert E_ADMIN();
    }

    function _setIndex(address module) private {
        indexModule = module;
        ExecutionSlots.advance();
        emit IndexModuleSet(module);
        emit ExecutionChanged(executionSet(), executionRevision());
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
