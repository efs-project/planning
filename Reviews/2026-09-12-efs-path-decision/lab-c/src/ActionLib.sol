// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * ActionLib: the shared write machinery (ordered-prefix action application, acceptance, CAS,
 * evidence, index dispatch). INTERNAL library: inlined into the Ledger (publish paths) and into
 * the external ImportLib (import path). Everything that used to be Ledger state (realmId, index,
 * indexCodehash) is passed in a LedgerRefs struct; `address(this)` is always the Ledger, whether
 * inlined or reached through ImportLib's DELEGATECALL.
 *
 * Stack discipline: no memory mover (vendored assembly is not memory-safe); <= ~10 live locals.
 */

import "./EfsTypes.sol";
import "./LedgerErrors.sol";
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

/// The Ledger's own decode helpers, reached through an external self-call so a malformed body reverts
/// StructuralInvalid instead of a raw ABI-decoding panic.
interface ILedgerDecode {
  function decodeBody(bytes calldata body) external pure returns (bytes32[] memory refs, bytes memory payload);

  function decodeTypeBody(bytes calldata body) external pure returns (bytes32 shape, bytes32[] memory refTypes);
}

library ActionLib {
  uint256 internal constant MAX_ACTIONS = 32;
  uint256 internal constant ACCEPT_GAS = 300_000;
  /// secp256k1 n/2: signatures with s above this are malleable and rejected (EIP-2 rule applied at the app layer).
  bytes32 internal constant LOW_S_MAX = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

  struct LedgerRefs {
    bytes32 realmId;
    IIndexModule index;
    bytes32 indexCodehash;
  }

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

  struct TypeRow {
    address acceptor;
    bytes32 codehash;
    bytes32[] refTypes;
  }

  // ---------------------------------------------------------------------------
  // authorship / digest
  // ---------------------------------------------------------------------------

  function digestInput(Intent calldata intent, bytes32 realmId, bytes32 actionsHash) internal view returns (DigestInput memory d) {
    d.realmId = realmId;
    d.coreCodeCommitment = address(this).codehash;
    d.author = intent.author;
    d.nonce = intent.nonce;
    d.deadline = intent.deadline;
    d.acceptanceProfile = intent.acceptanceProfile;
    d.indexObligations = intent.indexObligations;
    d.actionsHash = actionsHash;
  }

  function intentDigest(Intent calldata intent, bytes32 realmId) internal view returns (bytes32) {
    return EfsIds.intentDigest(digestInput(intent, realmId, keccak256(abi.encode(intent.actions))));
  }

  /// ecrecover with the v ∈ {27,28} and low-s guards; a zero recovery is a bad signature.
  function recover(bytes32 digest, uint8 v, bytes32 r, bytes32 s) internal pure returns (address signer) {
    if (v != 27 && v != 28) revert BadSignature();
    if (uint256(s) > uint256(LOW_S_MAX)) revert BadSignature();
    signer = ecrecover(digest, v, r, s);
    if (signer == address(0)) revert BadSignature();
  }

  function requireEoaAuthor(Intent calldata intent, Sig calldata sig, bytes32 realmId) internal view {
    if (intent.deadline != 0 && block.timestamp > intent.deadline) revert Expired(intent.deadline);
    bytes32 expected = EfsIds.eoaPrincipal(recover(intentDigest(intent, realmId), sig.v, sig.r, sig.s));
    if (expected != intent.author) revert AuthorMismatch(expected, intent.author);
  }

  // ---------------------------------------------------------------------------
  // publication shell
  // ---------------------------------------------------------------------------

  function checkShape(uint256 actions, uint256 bodies) internal pure {
    if (actions == 0 || actions > MAX_ACTIONS) revert BadActionCount(actions);
    if (bodies != actions) revert BodiesLengthMismatch(actions, bodies);
  }

  function checkProfile(Intent calldata intent, IIndexModule index) internal view {
    if (intent.acceptanceProfile != ACCEPTANCE_PROFILE_V1) revert BadProfile(intent.acceptanceProfile);
    if (intent.indexObligations != index.obligationsId()) revert BadObligations(intent.indexObligations);
  }

  function openPublication(bytes32 publicationId, bytes32 author, uint64 nonce) internal {
    if (Evidence._exists(publicationId)) revert AlreadyAdmitted(publicationId);
    uint64 last = Nonces._get(author);
    if (nonce <= last) revert NonceNotIncreasing(last, nonce);
    Nonces._set(author, nonce);
  }

  /// The complete native/signed publication (called by the Ledger with the proof already established).
  function publish(
    Intent calldata intent,
    bytes[] calldata bodies,
    PubCtx memory c,
    LedgerRefs memory refs
  ) internal returns (bytes32, uint64) {
    checkShape(intent.actions.length, bodies.length);
    checkProfile(intent, refs.index);
    c.actionsHash = keccak256(abi.encode(intent.actions));
    c.publicationId = EfsIds.publicationId(intent.author, intent.nonce, c.actionsHash);
    openPublication(c.publicationId, intent.author, intent.nonce);
    c.basis = Counters._get(COUNTER_ADMISSIONS);
    c.firstAdmission = c.basis + 1;
    Effect[] memory effects = runActions(intent.actions, bodies, intent.author, c.publicationId, c.basis, 0);
    Counters._set(COUNTER_ADMISSIONS, c.basis + uint64(intent.actions.length));
    Evidence._set(c.publicationId, evidenceOf(intent, c, refs.realmId));
    uint256 g = dispatchIndex(refs, c.publicationId, c.firstAdmission, effects);
    emit Published(c.publicationId, intent.author, c.proofKind, c.firstAdmission, uint16(intent.actions.length), g);
    return (c.publicationId, c.firstAdmission);
  }

  /// Applies actions in order; action i gets ordinal basis + 1 + offset + i.
  function runActions(
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
      effects[i] = applyAction(i, actions[i], bodies[i], author, publicationId, basis + 1 + offset + uint64(i));
    }
  }

  function evidenceOf(Intent calldata intent, PubCtx memory c, bytes32 realmId) internal view returns (EvidenceData memory e) {
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
  function dispatchIndex(
    LedgerRefs memory refs,
    bytes32 publicationId,
    uint64 firstAdmission,
    Effect[] memory effects
  ) internal returns (uint256) {
    bytes32 current = address(refs.index).codehash;
    if (current != refs.indexCodehash) revert IndexCodeChanged(refs.indexCodehash, current);
    address attachedTo = refs.index.ledger();
    if (attachedTo != address(this)) revert IndexNotAttached(address(refs.index), attachedTo);
    uint256 g = gasleft();
    refs.index.onPublication(publicationId, firstAdmission, effects);
    return g - gasleft();
  }

  // ---------------------------------------------------------------------------
  // action internals
  // ---------------------------------------------------------------------------

  function applyAction(
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
      e.recordId = declareType(i, a, body, ordinal);
      e.fresh = true;
    } else if (a.kind == KIND_RECORD) {
      (e.recordId, e.fresh, e.refs) = admitRecord(i, a, body, ordinal);
    } else if (a.kind == KIND_SUBJECT) {
      e.recordId = mintSubject(i, a, author, ordinal);
    } else if (a.kind == KIND_BIND) {
      (e.bindingKey, e.revision) = bind(i, a, author, ordinal);
    } else {
      revert UnknownKind(i, a.kind);
    }
    Admissions._set(ordinal, admissionOf(a, publicationId));
  }

  function applyImportRow(
    Action calldata a,
    bytes32 author,
    bytes32 publicationId,
    uint64 ordinal
  ) internal returns (Effect memory e) {
    e.author = author;
    e.kind = a.kind;
    e.admission = ordinal;
    Admissions._set(ordinal, admissionOf(a, publicationId));
  }

  function admissionOf(Action calldata a, bytes32 publicationId) internal pure returns (AdmissionData memory r) {
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

  function declareType(uint256 i, Action calldata a, bytes calldata body, uint64 ordinal) internal returns (bytes32 typeId) {
    if (a.typeId != TYPE_META) revert UnknownType(a.typeId);
    if (a.digestKind != DIGEST_BODY_HASH) revert BadDigestKind(i, a.digestKind);
    if (body.length == 0 || keccak256(body) != a.digest) revert BodyHashMismatch(i);
    typeId = EfsIds.recordId(TYPE_META, a.digest);
    if (Types._getAdmission(typeId) != 0) revert TypeExists(typeId);
    bytes32[] memory refTypes = structuralType(i, body);
    address acceptor = address(uint160(uint256(a.target)));
    if (acceptor.code.length == 0) revert AcceptorHasNoCode(acceptor);
    Records._set(typeId, TYPE_META, ordinal, body);
    Types._set(typeId, acceptor, acceptor.codehash, ordinal, refTypes);
  }

  function loadType(bytes32 typeId) internal view returns (TypeRow memory t) {
    uint64 admission;
    (t.acceptor, t.codehash, admission, t.refTypes) = Types._get(typeId);
    if (admission == 0) revert UnknownType(typeId);
  }

  /// Resolves the record id and canonical bytes for a RECORD action (fresh body, existing body, or reuse by id).
  function canonical(
    uint256 i,
    Action calldata a,
    bytes calldata body
  ) internal view returns (bytes32 recordId, bool fresh, bytes memory bytes_) {
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

  function checkRefs(uint256 i, bytes32[] memory refs, bytes32[] memory refTypes) internal view {
    if (refs.length != refTypes.length) revert RefCountMismatch(i, refTypes.length, refs.length);
    for (uint256 k = 0; k < refs.length; k++) {
      if (Records._getFirstAdmission(refs[k]) == 0) revert RefMissing(i, k, refs[k]);
      bytes32 actual = Records._getTypeId(refs[k]);
      if (actual != refTypes[k]) revert RefWrongType(i, k, refTypes[k], actual);
    }
  }

  function accept(
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

  function admitRecord(
    uint256 i,
    Action calldata a,
    bytes calldata body,
    uint64 ordinal
  ) internal returns (bytes32 recordId, bool fresh, bytes32[] memory refs) {
    TypeRow memory t = loadType(a.typeId);
    bytes memory bytes_;
    (recordId, fresh, bytes_) = canonical(i, a, body);
    bytes memory payload;
    (refs, payload) = structural(i, bytes_);
    checkRefs(i, refs, t.refTypes);
    accept(i, t, a.typeId, recordId, refs, payload);
    if (fresh) Records._set(recordId, a.typeId, ordinal, bytes_);
  }

  function structural(uint256 i, bytes memory bytes_) internal view returns (bytes32[] memory refs, bytes memory payload) {
    try ILedgerDecode(address(this)).decodeBody(bytes_) returns (bytes32[] memory r_, bytes memory p_) {
      return (r_, p_);
    } catch {
      revert StructuralInvalid(i);
    }
  }

  function structuralType(uint256 i, bytes calldata body) internal view returns (bytes32[] memory refTypes) {
    try ILedgerDecode(address(this)).decodeTypeBody(body) returns (bytes32, bytes32[] memory r_) {
      return r_;
    } catch {
      revert StructuralInvalid(i);
    }
  }

  function mintSubject(uint256 i, Action calldata a, bytes32 author, uint64 ordinal) internal returns (bytes32 subjectId) {
    subjectId = EfsIds.subjectId(author, a.salt);
    if (a.subject != subjectId) revert SubjectMismatch(i, subjectId, a.subject);
    if (Subjects._getAdmission(subjectId) != 0) revert SubjectExists(subjectId);
    Subjects._set(subjectId, author, a.salt, ordinal);
  }

  function bind(uint256 i, Action calldata a, bytes32 author, uint64 ordinal) internal returns (bytes32 key, uint32 revision) {
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
