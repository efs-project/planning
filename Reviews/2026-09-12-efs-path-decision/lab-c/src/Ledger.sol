// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Ledger: the ONLY write entrypoints of the Store-only probe.
 *   publishNative(intent, bodies)          author = origin-qualified contract principal of msg.sender
 *   publishSigned(intent, bodies, sig)     author = EOA principal recovered from the EIP-712 PublicationIntent
 *   importPublication(packet, auth, sig)   source evidence (graded) + separate destination authorization
 * Laws: ordered-prefix batch (action k sees writes of actions < k, whole tx reverts on any failure);
 * strict CAS on every binding; typed references checked against declared refTypes at that point;
 * view-only acceptance bound to (typeId, acceptor codehash, basis); exact retry reverts AlreadyAdmitted;
 * one IndexModule call per publication in the same tx (index revert = publication revert); the Ledger and
 * its IndexModule are reciprocally sealed (address + codehash) before any dispatch.
 * Every durable fact is a MUD table row (see tables/LedgerTables.sol); no raw slots.
 *
 * Stack discipline: the vendored Store's inline assembly is not memory-safe, so via-IR cannot move stack
 * variables to memory in any contract that inlines it. Every function here keeps <= ~10 live locals and
 * passes bundles of values as memory structs (PubCtx, ImportCtx, TypeRow, DigestInput, EvidenceData).
 */

import { EfsStoreCore } from "./EfsStoreCore.sol";
import "./EfsTypes.sol";
import {
  Records,
  Admissions,
  AdmissionData,
  Evidence,
  EvidenceData,
  Bindings,
  Subjects,
  Types,
  Nonces,
  Counters
} from "./tables/LedgerTables.sol";

contract Ledger is EfsStoreCore {
  IIndexModule public immutable index;
  bytes32 public immutable indexCodehash; // sealed at construction; checked before every dispatch
  bytes32 public immutable realmId; // keccak(TAG_REALM, chainId, address(this)) — chain + deployment
  uint256 internal constant MAX_ACTIONS = 32;
  uint256 internal constant ACCEPT_GAS = 300_000;

  struct PubCtx {
    bytes32 publicationId;
    bytes32 actionsHash;
    uint64 basis;
    uint64 firstAdmission;
    uint8 proofKind;
    uint8 v;
    bytes32 r;
    bytes32 s;
  }

  struct ImportCtx {
    bytes32 sourceId;
    bytes32 authId;
    bytes32 sourceActionsHash;
    bytes32 authActionsHash;
    uint64 basis;
    uint8 grade;
    uint8 authProof;
    uint16 rows;
  }

  struct TypeRow {
    address acceptor;
    bytes32 codehash;
    bytes32[] refTypes;
  }

  error AlreadyAdmitted(bytes32 publicationId);
  error AuthorMismatch(bytes32 expected, bytes32 given);
  error BadSignature();
  error Expired(uint64 deadline);
  error NonceNotIncreasing(uint64 last, uint64 given);
  error BadProfile(bytes32 given);
  error BadObligations(bytes32 given);
  error BadActionCount(uint256 n);
  error BodiesLengthMismatch(uint256 actions, uint256 bodies);
  error BodyHashMismatch(uint256 i);
  error BadDigestKind(uint256 i, uint8 digestKind);
  error UnknownKind(uint256 i, uint8 kind);
  error UnknownType(bytes32 typeId);
  error TypeExists(bytes32 typeId);
  error AcceptorHasNoCode(address acceptor);
  error AcceptorDrift(bytes32 typeId);
  error StructuralInvalid(uint256 i);
  error RefCountMismatch(uint256 i, uint256 expected, uint256 given);
  error RefMissing(uint256 i, uint256 role, bytes32 target);
  error RefWrongType(uint256 i, uint256 role, bytes32 expected, bytes32 actual);
  error Rejected(uint256 i, bytes32 typeId);
  error RecordBodyRequired(uint256 i);
  error MissingRecord(uint256 i, bytes32 recordId);
  error SubjectExists(bytes32 subjectId);
  error SubjectMismatch(uint256 i, bytes32 expected, bytes32 given);
  error UnknownPurpose(uint256 i, bytes32 purpose);
  error StaleCas(uint256 i, uint32 expected, uint32 actual);
  error MissingSubject(uint256 i, bytes32 subjectId);
  error BadTagStance(uint256 i, bytes32 target);
  error ImportOnlyViaImportPublication(uint256 i);
  error BadAuthorization();
  error NotAnImport();
  error BadSourceEvidence();
  error BadAttachment(address given);
  error IndexNotAttached(address index, address attachedTo);
  error IndexCodeChanged(bytes32 sealedCodehash, bytes32 current);
  error UnsupportedSourceProof(uint8 proofKind);

  /// secp256k1 n/2: signatures with s above this are malleable and rejected (EIP-2 rule applied at the app layer).
  bytes32 internal constant LOW_S_MAX = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

  event Published(
    bytes32 indexed publicationId,
    bytes32 indexed author,
    uint8 proofKind,
    uint64 firstAdmission,
    uint16 leafCount,
    uint256 indexGas
  );
  event Imported(bytes32 indexed sourcePublicationId, bytes32 indexed authorizationId, bytes32 importer, uint8 sourceGrade);

  constructor(IIndexModule index_) {
    if (address(index_) == address(0) || address(index_).code.length == 0) revert BadAttachment(address(index_));
    index = index_;
    indexCodehash = address(index_).codehash;
    realmId = keccak256(abi.encode(TAG_REALM, block.chainid, address(this)));
  }

  function _registerEfsTables() internal override {
    Records._register();
    Admissions._register();
    Evidence._register();
    Bindings._register();
    Subjects._register();
    Types._register();
    Nonces._register();
    Counters._register();
  }

  // ---------------------------------------------------------------------------
  // identity / digest views
  // ---------------------------------------------------------------------------

  function coreCodeCommitment() public view returns (bytes32) {
    return address(this).codehash;
  }

  function realmOrigin() public view returns (bytes32) {
    return EfsIds.realmOrigin(block.chainid, address(this));
  }

  function rulesEpoch() external pure returns (uint32) {
    return 1;
  }

  function highWater() public view returns (uint64) {
    return Counters._get(COUNTER_ADMISSIONS);
  }

  function domainSeparator() public pure returns (bytes32) {
    return keccak256(abi.encode(EIP712_DOMAIN_TYPEHASH, keccak256("EFS Lab C"), keccak256("1")));
  }

  function intentDigest(Intent calldata intent) public view returns (bytes32) {
    return EfsIds.intentDigest(_digestInput(intent, keccak256(abi.encode(intent.actions))));
  }

  function packetCommitment(ImportPacket calldata pkt) public pure returns (bytes32) {
    return keccak256(abi.encode(pkt.source, pkt.actions));
  }

  /// Structural decode of a typed body; exposed so _structural can convert a decode failure into StructuralInvalid.
  function decodeBody(bytes calldata body) external pure returns (bytes32[] memory refs, bytes memory payload) {
    (refs, payload) = abi.decode(body, (bytes32[], bytes));
  }

  /// Structural decode of a Type declaration body (shape commitment, refTypes); same try/catch wrapping.
  function decodeTypeBody(bytes calldata body) external pure returns (bytes32 shape, bytes32[] memory refTypes) {
    (shape, refTypes) = abi.decode(body, (bytes32, bytes32[]));
  }

  /// ecrecover with the v ∈ {27,28} and low-s guards; a zero recovery is a bad signature.
  function _recover(bytes32 digest, uint8 v, bytes32 r, bytes32 s) internal pure returns (address signer) {
    if (v != 27 && v != 28) revert BadSignature();
    if (uint256(s) > uint256(LOW_S_MAX)) revert BadSignature();
    signer = ecrecover(digest, v, r, s);
    if (signer == address(0)) revert BadSignature();
  }

  function _digestInput(Intent calldata intent, bytes32 actionsHash) internal view returns (DigestInput memory d) {
    d.realmId = realmId;
    d.coreCodeCommitment = address(this).codehash;
    d.author = intent.author;
    d.nonce = intent.nonce;
    d.deadline = intent.deadline;
    d.acceptanceProfile = intent.acceptanceProfile;
    d.indexObligations = intent.indexObligations;
    d.actionsHash = actionsHash;
  }

  // ---------------------------------------------------------------------------
  // write entrypoints
  // ---------------------------------------------------------------------------

  function publishNative(
    Intent calldata intent,
    bytes[] calldata bodies
  ) external returns (bytes32 publicationId, uint64 firstAdmission) {
    bytes32 expected = EfsIds.contractPrincipal(realmOrigin(), msg.sender);
    if (expected != intent.author) revert AuthorMismatch(expected, intent.author);
    PubCtx memory c;
    c.proofKind = PROOF_NATIVE;
    return _publish(intent, bodies, c);
  }

  function publishSigned(
    Intent calldata intent,
    bytes[] calldata bodies,
    Sig calldata sig
  ) external returns (bytes32 publicationId, uint64 firstAdmission) {
    _requireEoaAuthor(intent, sig);
    PubCtx memory c;
    c.proofKind = PROOF_EOA_SIG;
    c.v = sig.v;
    c.r = sig.r;
    c.s = sig.s;
    return _publish(intent, bodies, c);
  }

  /// Import: the source-Realm-bound signature is source evidence only (graded, retained verbatim);
  /// admission at this Realm needs a separate destination authorization (auth = one KIND_IMPORT action
  /// committing to the packet, signed by an EOA importer or sent natively by a contract importer).
  /// Verified (grade 1, EOA-signed) imports re-run acceptance, CAS and index effects here under the SOURCE
  /// author's principal, preserving subject ids and binding ownership. A native (grade-zero) source carries
  /// no verifiable witness: it is REJECTED (`UnsupportedSourceProof`) — nothing is minted or written as
  /// that principal and no attributed cell is created — until a chain-state witness profile exists.
  function importPublication(
    ImportPacket calldata pkt,
    Intent calldata auth,
    Sig calldata authSig
  ) external returns (bytes32 sourcePublicationId, bytes32 authorizationId) {
    ImportCtx memory c;
    c.authProof = _validateAuthorization(pkt, auth, authSig);
    _checkShape(pkt.actions.length, pkt.bodies.length);
    _openImport(pkt, c);
    c.authActionsHash = keccak256(abi.encode(auth.actions));
    c.authId = EfsIds.publicationId(auth.author, auth.nonce, c.authActionsHash);
    _openPublication(c.authId, auth.author, auth.nonce);
    c.basis = Counters._get(COUNTER_ADMISSIONS);
    Effect[] memory effects = _runImport(pkt, auth, c);
    Evidence._set(c.authId, _authEvidence(auth, authSig, c));
    Evidence._set(c.sourceId, _sourceEvidence(pkt, c));
    uint256 g = _dispatchIndex(c.sourceId, c.basis + 1, effects);
    emit Imported(c.sourceId, c.authId, auth.author, c.grade);
    emit Published(c.authId, auth.author, c.authProof, c.basis + 1, 1, g); // == the authorization cell's leafCount
    emit Published(c.sourceId, pkt.source.author, pkt.source.proofKind, c.basis + 2, uint16(c.rows - 1), 0);
    return (c.sourceId, c.authId);
  }

  // ---------------------------------------------------------------------------
  // publication internals
  // ---------------------------------------------------------------------------

  function _requireEoaAuthor(Intent calldata intent, Sig calldata sig) internal view {
    if (intent.deadline != 0 && block.timestamp > intent.deadline) revert Expired(intent.deadline);
    bytes32 expected = EfsIds.eoaPrincipal(_recover(intentDigest(intent), sig.v, sig.r, sig.s));
    if (expected != intent.author) revert AuthorMismatch(expected, intent.author);
  }

  function _checkShape(uint256 actions, uint256 bodies) internal pure {
    if (actions == 0 || actions > MAX_ACTIONS) revert BadActionCount(actions);
    if (bodies != actions) revert BodiesLengthMismatch(actions, bodies);
  }

  function _checkProfile(Intent calldata intent) internal view {
    if (intent.acceptanceProfile != ACCEPTANCE_PROFILE_V1) revert BadProfile(intent.acceptanceProfile);
    if (intent.indexObligations != index.obligationsId()) revert BadObligations(intent.indexObligations);
  }

  function _openPublication(bytes32 publicationId, bytes32 author, uint64 nonce) internal {
    if (Evidence._exists(publicationId)) revert AlreadyAdmitted(publicationId);
    uint64 last = Nonces._get(author);
    if (nonce <= last) revert NonceNotIncreasing(last, nonce);
    Nonces._set(author, nonce);
  }

  function _publish(
    Intent calldata intent,
    bytes[] calldata bodies,
    PubCtx memory c
  ) internal returns (bytes32, uint64) {
    _checkShape(intent.actions.length, bodies.length);
    _checkProfile(intent);
    c.actionsHash = keccak256(abi.encode(intent.actions));
    c.publicationId = EfsIds.publicationId(intent.author, intent.nonce, c.actionsHash);
    _openPublication(c.publicationId, intent.author, intent.nonce);
    c.basis = Counters._get(COUNTER_ADMISSIONS);
    c.firstAdmission = c.basis + 1;
    Effect[] memory effects = _runActions(intent.actions, bodies, intent.author, c.publicationId, c.basis, 0);
    Counters._set(COUNTER_ADMISSIONS, c.basis + uint64(intent.actions.length));
    Evidence._set(c.publicationId, _evidenceOf(intent, c));
    uint256 g = _dispatchIndex(c.publicationId, c.firstAdmission, effects);
    emit Published(c.publicationId, intent.author, c.proofKind, c.firstAdmission, uint16(intent.actions.length), g);
    return (c.publicationId, c.firstAdmission);
  }

  /// Applies actions in order; action i gets ordinal basis + 1 + offset + i.
  function _runActions(
    Action[] calldata actions,
    bytes[] calldata bodies,
    bytes32 author,
    bytes32 publicationId,
    uint64 basis,
    uint64 offset
  ) internal returns (Effect[] memory effects) {
    uint256 n = actions.length;
    effects = new Effect[](n);
    for (uint256 i = 0; i < n; i++) {
      if (actions[i].kind == KIND_IMPORT) revert ImportOnlyViaImportPublication(i);
      effects[i] = _apply(i, actions[i], bodies[i], author, publicationId, basis + 1 + offset + uint64(i));
    }
  }

  function _evidenceOf(Intent calldata intent, PubCtx memory c) internal view returns (EvidenceData memory e) {
    e.author = intent.author;
    e.proofKind = c.proofKind;
    e.r = c.r;
    e.s = c.s;
    e.v = c.v;
    e.nonce = intent.nonce;
    e.deadline = intent.deadline;
    e.acceptanceProfile = intent.acceptanceProfile;
    e.indexObligations = intent.indexObligations;
    e.actionsHash = c.actionsHash;
    e.firstAdmission = c.firstAdmission;
    e.leafCount = uint16(intent.actions.length);
    e.basis = c.basis;
    e.realmId = realmId;
    e.coreCodeCommitment = address(this).codehash;
    // importOf = 0, sourceGrade = GRADE_UNVERIFIED (no source witness: this IS the source)
  }

  /// Reciprocal seal: the module must still carry the sealed code and must be attached to this Ledger.
  function _dispatchIndex(bytes32 publicationId, uint64 firstAdmission, Effect[] memory effects) internal returns (uint256) {
    bytes32 current = address(index).codehash;
    if (current != indexCodehash) revert IndexCodeChanged(indexCodehash, current);
    address attachedTo = index.ledger();
    if (attachedTo != address(this)) revert IndexNotAttached(address(index), attachedTo);
    uint256 g = gasleft();
    index.onPublication(publicationId, firstAdmission, effects);
    return g - gasleft();
  }

  // ---------------------------------------------------------------------------
  // import internals
  // ---------------------------------------------------------------------------

  function _validateAuthorization(
    ImportPacket calldata pkt,
    Intent calldata auth,
    Sig calldata sig
  ) internal view returns (uint8 proofKind) {
    if (auth.actions.length != 1 || auth.actions[0].kind != KIND_IMPORT) revert BadAuthorization();
    if (auth.actions[0].digestKind != DIGEST_PACKET || auth.actions[0].digest != packetCommitment(pkt)) {
      revert BadAuthorization();
    }
    proofKind = _authorize(auth, sig);
    _checkProfile(auth);
  }

  function _authorize(Intent calldata auth, Sig calldata sig) internal view returns (uint8) {
    if (sig.v == 0 && sig.r == bytes32(0) && sig.s == bytes32(0)) {
      if (auth.deadline != 0 && block.timestamp > auth.deadline) revert Expired(auth.deadline);
      bytes32 expected = EfsIds.contractPrincipal(realmOrigin(), msg.sender);
      if (expected != auth.author) revert AuthorMismatch(expected, auth.author);
      return PROOF_NATIVE;
    }
    _requireEoaAuthor(auth, sig);
    return PROOF_EOA_SIG;
  }

  function _openImport(ImportPacket calldata pkt, ImportCtx memory c) internal view {
    if (pkt.source.realmId == realmId) revert NotAnImport();
    c.sourceActionsHash = keccak256(abi.encode(pkt.actions));
    c.sourceId = EfsIds.publicationId(pkt.source.author, pkt.source.nonce, c.sourceActionsHash);
    if (Evidence._exists(c.sourceId)) revert AlreadyAdmitted(c.sourceId);
    c.grade = _gradeSource(pkt.source, c.sourceActionsHash);
  }

  function _gradeSource(SourceEvidence calldata src, bytes32 sourceActionsHash) internal pure returns (uint8) {
    if (src.proofKind == PROOF_EOA_SIG) {
      DigestInput memory d;
      d.realmId = src.realmId;
      d.coreCodeCommitment = src.coreCodeCommitment;
      d.author = src.author;
      d.nonce = src.nonce;
      d.deadline = src.deadline;
      d.acceptanceProfile = src.acceptanceProfile;
      d.indexObligations = src.indexObligations;
      d.actionsHash = sourceActionsHash;
      address signer = _recover(EfsIds.intentDigest(d), src.v, src.r, src.s);
      if (EfsIds.eoaPrincipal(signer) != src.author) revert BadSourceEvidence();
      return GRADE_SIGNATURE_VERIFIED;
    }
    // PROOF_NATIVE (and anything else): no verifiable witness in this probe -> the import is unsupported.
    revert UnsupportedSourceProof(src.proofKind);
  }

  /// Row 0 = the authorization; rows 1..n = the imported actions under the (verified) source author.
  function _runImport(
    ImportPacket calldata pkt,
    Intent calldata auth,
    ImportCtx memory c
  ) internal returns (Effect[] memory effects) {
    uint256 n = pkt.actions.length;
    effects = new Effect[](n + 1);
    effects[0] = _applyImportRow(auth.actions[0], auth.author, c.authId, c.basis + 1);
    Effect[] memory rows = _runActions(pkt.actions, pkt.bodies, pkt.source.author, c.sourceId, c.basis, 1);
    for (uint256 i = 0; i < n; i++) effects[i + 1] = rows[i];
    c.rows = uint16(n + 1);
    Counters._set(COUNTER_ADMISSIONS, c.basis + 1 + uint64(n));
  }

  function _authEvidence(
    Intent calldata auth,
    Sig calldata sig,
    ImportCtx memory c
  ) internal view returns (EvidenceData memory e) {
    e.author = auth.author;
    e.proofKind = c.authProof;
    e.r = sig.r;
    e.s = sig.s;
    e.v = sig.v;
    e.nonce = auth.nonce;
    e.deadline = auth.deadline;
    e.acceptanceProfile = auth.acceptanceProfile;
    e.indexObligations = auth.indexObligations;
    e.actionsHash = c.authActionsHash;
    e.firstAdmission = c.basis + 1;
    e.leafCount = 1;
    e.basis = c.basis;
    e.realmId = realmId;
    e.coreCodeCommitment = address(this).codehash;
    e.importOf = c.sourceId;
    e.sourceGrade = c.grade;
  }

  function _sourceEvidence(ImportPacket calldata pkt, ImportCtx memory c) internal pure returns (EvidenceData memory e) {
    e.author = pkt.source.author;
    e.proofKind = pkt.source.proofKind;
    e.r = pkt.source.r;
    e.s = pkt.source.s;
    e.v = pkt.source.v;
    e.nonce = pkt.source.nonce;
    e.deadline = pkt.source.deadline;
    e.acceptanceProfile = pkt.source.acceptanceProfile;
    e.indexObligations = pkt.source.indexObligations;
    e.actionsHash = c.sourceActionsHash;
    e.firstAdmission = c.basis + 2;
    e.leafCount = uint16(pkt.actions.length);
    e.basis = pkt.source.basis;
    e.realmId = pkt.source.realmId;
    e.coreCodeCommitment = pkt.source.coreCodeCommitment;
    e.sourceGrade = c.grade;
  }

  // ---------------------------------------------------------------------------
  // action internals
  // ---------------------------------------------------------------------------

  function _apply(
    uint256 i,
    Action calldata a,
    bytes calldata body,
    bytes32 author,
    bytes32 publicationId,
    uint64 ordinal
  ) internal returns (Effect memory e) {
    e.author = author;
    e.kind = a.kind;
    e.admission = ordinal;
    e.typeId = a.typeId;
    e.purpose = a.purpose;
    e.subject = a.subject;
    e.role = a.role;
    e.target = a.target;
    if (a.kind == KIND_DECLARE_TYPE) {
      e.recordId = _declareType(i, a, body, ordinal);
      e.fresh = true;
    } else if (a.kind == KIND_RECORD) {
      (e.recordId, e.fresh, e.refs) = _admitRecord(i, a, body, ordinal);
    } else if (a.kind == KIND_SUBJECT) {
      e.recordId = _mintSubject(i, a, author, ordinal);
    } else if (a.kind == KIND_BIND) {
      (e.bindingKey, e.revision) = _bind(i, a, author, ordinal);
    } else {
      revert UnknownKind(i, a.kind);
    }
    Admissions._set(ordinal, _admissionOf(a, publicationId));
  }

  function _applyImportRow(
    Action calldata a,
    bytes32 author,
    bytes32 publicationId,
    uint64 ordinal
  ) internal returns (Effect memory e) {
    e.author = author;
    e.kind = a.kind;
    e.admission = ordinal;
    Admissions._set(ordinal, _admissionOf(a, publicationId));
  }

  function _admissionOf(Action calldata a, bytes32 publicationId) internal pure returns (AdmissionData memory r) {
    r.publicationId = publicationId;
    r.kind = a.kind;
    r.typeId = a.typeId;
    r.digestKind = a.digestKind;
    r.digest = a.digest;
    r.purpose = a.purpose;
    r.subject = a.subject;
    r.role = a.role;
    r.target = a.target;
    r.expectedRevision = a.expectedRevision;
    r.salt = a.salt;
  }

  function _declareType(
    uint256 i,
    Action calldata a,
    bytes calldata body,
    uint64 ordinal
  ) internal returns (bytes32 typeId) {
    if (a.typeId != TYPE_META) revert UnknownType(a.typeId);
    if (a.digestKind != DIGEST_BODY_HASH) revert BadDigestKind(i, a.digestKind);
    if (body.length == 0 || keccak256(body) != a.digest) revert BodyHashMismatch(i);
    typeId = EfsIds.recordId(TYPE_META, a.digest);
    if (Types._getAdmission(typeId) != 0) revert TypeExists(typeId);
    bytes32[] memory refTypes = _structuralType(i, body);
    address acceptor = address(uint160(uint256(a.target)));
    if (acceptor.code.length == 0) revert AcceptorHasNoCode(acceptor);
    Records._set(typeId, TYPE_META, ordinal, body);
    Types._set(typeId, acceptor, acceptor.codehash, ordinal, refTypes);
  }

  function _loadType(bytes32 typeId) internal view returns (TypeRow memory t) {
    uint64 admission;
    (t.acceptor, t.codehash, admission, t.refTypes) = Types._get(typeId);
    if (admission == 0) revert UnknownType(typeId);
  }

  /// Resolves the record id and canonical bytes for a RECORD action (fresh body, existing body, or reuse by id).
  function _canonical(
    uint256 i,
    Action calldata a,
    bytes calldata body
  ) internal view returns (bytes32 recordId, bool fresh, bytes memory canonical) {
    if (a.digestKind == DIGEST_BODY_HASH) {
      recordId = EfsIds.recordId(a.typeId, a.digest);
      if (Records._getFirstAdmission(recordId) == 0) {
        if (body.length == 0) revert RecordBodyRequired(i);
        if (keccak256(body) != a.digest) revert BodyHashMismatch(i);
        return (recordId, true, body);
      }
      if (body.length != 0 && keccak256(body) != a.digest) revert BodyHashMismatch(i);
      return (recordId, false, Records._getBody(recordId));
    }
    if (a.digestKind != DIGEST_RECORD_ID) revert BadDigestKind(i, a.digestKind);
    recordId = a.digest;
    if (Records._getFirstAdmission(recordId) == 0) revert MissingRecord(i, recordId);
    bytes32 actualType = Records._getTypeId(recordId);
    if (actualType != a.typeId) revert RefWrongType(i, type(uint256).max, a.typeId, actualType);
    return (recordId, false, Records._getBody(recordId));
  }

  function _checkRefs(uint256 i, bytes32[] memory refs, bytes32[] memory refTypes) internal view {
    if (refs.length != refTypes.length) revert RefCountMismatch(i, refTypes.length, refs.length);
    for (uint256 k = 0; k < refs.length; k++) {
      if (Records._getFirstAdmission(refs[k]) == 0) revert RefMissing(i, k, refs[k]);
      bytes32 actual = Records._getTypeId(refs[k]);
      if (actual != refTypes[k]) revert RefWrongType(i, k, refTypes[k], actual);
    }
  }

  function _accept(
    uint256 i,
    TypeRow memory t,
    bytes32 typeId,
    bytes32 recordId,
    bytes32[] memory refs,
    bytes memory payload
  ) internal view {
    if (t.acceptor.codehash != t.codehash) revert AcceptorDrift(typeId);
    bytes4 magic = IAcceptor(t.acceptor).accept{ gas: ACCEPT_GAS }(typeId, recordId, refs, payload);
    if (magic != ACCEPT_MAGIC) revert Rejected(i, typeId);
  }

  function _admitRecord(
    uint256 i,
    Action calldata a,
    bytes calldata body,
    uint64 ordinal
  ) internal returns (bytes32 recordId, bool fresh, bytes32[] memory refs) {
    TypeRow memory t = _loadType(a.typeId);
    bytes memory canonical;
    (recordId, fresh, canonical) = _canonical(i, a, body);
    bytes memory payload;
    (refs, payload) = _structural(i, canonical);
    _checkRefs(i, refs, t.refTypes);
    _accept(i, t, a.typeId, recordId, refs, payload);
    if (fresh) Records._set(recordId, a.typeId, ordinal, canonical);
  }

  function _structuralType(uint256 i, bytes calldata body) internal view returns (bytes32[] memory refTypes) {
    try this.decodeTypeBody(body) returns (bytes32, bytes32[] memory r_) {
      return r_;
    } catch {
      revert StructuralInvalid(i);
    }
  }

  function _structural(
    uint256 i,
    bytes memory canonical
  ) internal view returns (bytes32[] memory refs, bytes memory payload) {
    try this.decodeBody(canonical) returns (bytes32[] memory r_, bytes memory p_) {
      return (r_, p_);
    } catch {
      revert StructuralInvalid(i);
    }
  }

  function _mintSubject(
    uint256 i,
    Action calldata a,
    bytes32 author,
    uint64 ordinal
  ) internal returns (bytes32 subjectId) {
    subjectId = EfsIds.subjectId(author, a.salt);
    if (a.subject != subjectId) revert SubjectMismatch(i, subjectId, a.subject);
    if (Subjects._getAdmission(subjectId) != 0) revert SubjectExists(subjectId);
    Subjects._set(subjectId, author, a.salt, ordinal);
  }

  function _bind(
    uint256 i,
    Action calldata a,
    bytes32 author,
    uint64 ordinal
  ) internal returns (bytes32 key, uint32 revision) {
    if (a.purpose == PURPOSE_FOLDER) {
      if (a.target != bytes32(0) && Subjects._getAdmission(a.target) == 0) revert MissingSubject(i, a.target);
    } else if (a.purpose == PURPOSE_HEAD) {
      if (Subjects._getAdmission(a.subject) == 0) revert MissingSubject(i, a.subject);
      if (a.target != bytes32(0) && Records._getFirstAdmission(a.target) == 0) revert MissingRecord(i, a.target);
    } else if (a.purpose == PURPOSE_TAG) {
      if (Subjects._getAdmission(a.subject) == 0 && Records._getFirstAdmission(a.subject) == 0) {
        revert MissingSubject(i, a.subject);
      }
      if (a.target != bytes32(0) && a.target != TAG_ASSERT) revert BadTagStance(i, a.target);
    } else {
      revert UnknownPurpose(i, a.purpose);
    }
    key = EfsIds.bindingKey(author, a.purpose, a.subject, a.role);
    (, uint32 current, ) = Bindings._get(key);
    if (current != a.expectedRevision) revert StaleCas(i, a.expectedRevision, current);
    revision = current + 1;
    Bindings._set(key, a.target, revision, ordinal);
  }
}
