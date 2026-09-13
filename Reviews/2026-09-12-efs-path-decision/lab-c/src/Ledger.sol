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
 * one IndexModule call per publication in the same tx (index revert = publication revert).
 * Every durable fact is a MUD table row (see tables/LedgerTables.sol); no raw slots.
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
  bytes32 public immutable realmId; // keccak(TAG_REALM, chainId, address(this)) — Realm identity for signatures
  uint256 internal constant MAX_ACTIONS = 32;
  uint256 internal constant ACCEPT_GAS = 300_000;

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
    index = index_;
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
    return EfsIds.realmOrigin(block.chainid, address(this).codehash);
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
    return
      EfsIds.intentDigest(
        realmId,
        coreCodeCommitment(),
        intent.author,
        intent.nonce,
        intent.deadline,
        intent.acceptanceProfile,
        intent.indexObligations,
        keccak256(abi.encode(intent.actions))
      );
  }

  function packetCommitment(ImportPacket calldata pkt) public pure returns (bytes32) {
    return keccak256(abi.encode(pkt.source, pkt.actions));
  }

  /// Structural decode of a typed body; exposed so _structural can convert a decode failure into StructuralInvalid.
  function decodeBody(bytes calldata body) external pure returns (bytes32[] memory refs, bytes memory payload) {
    (refs, payload) = abi.decode(body, (bytes32[], bytes));
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
    return _publish(intent, bodies, PROOF_NATIVE, 0, bytes32(0), bytes32(0));
  }

  function publishSigned(
    Intent calldata intent,
    bytes[] calldata bodies,
    Sig calldata sig
  ) external returns (bytes32 publicationId, uint64 firstAdmission) {
    if (intent.deadline != 0 && block.timestamp > intent.deadline) revert Expired(intent.deadline);
    address signer = ecrecover(intentDigest(intent), sig.v, sig.r, sig.s);
    if (signer == address(0)) revert BadSignature();
    bytes32 expected = EfsIds.eoaPrincipal(signer);
    if (expected != intent.author) revert AuthorMismatch(expected, intent.author);
    return _publish(intent, bodies, PROOF_EOA_SIG, sig.v, sig.r, sig.s);
  }

  /// Import: the source-Realm-bound signature is source evidence only (graded, retained verbatim);
  /// admission at this Realm needs a separate destination authorization (auth = one KIND_IMPORT action
  /// committing to the packet, signed by an EOA importer or sent natively by a contract importer), and the
  /// imported actions re-run acceptance, CAS and index effects here under the SOURCE author's principal,
  /// which preserves subject ids and binding ownership. Source acceptance never becomes destination authority.
  function importPublication(
    ImportPacket calldata pkt,
    Intent calldata auth,
    Sig calldata authSig
  ) external returns (bytes32 sourcePublicationId, bytes32 authorizationId) {
    // 1. destination authorization
    if (auth.actions.length != 1 || auth.actions[0].kind != KIND_IMPORT) revert BadAuthorization();
    if (auth.actions[0].digestKind != DIGEST_PACKET || auth.actions[0].digest != packetCommitment(pkt)) {
      revert BadAuthorization();
    }
    uint8 authProof = _authorize(auth, authSig);
    _checkProfile(auth);
    uint256 n = pkt.actions.length;
    if (n == 0 || n > MAX_ACTIONS) revert BadActionCount(n);
    if (pkt.bodies.length != n) revert BodiesLengthMismatch(n, pkt.bodies.length);

    // 2. source evidence at its stated proof level
    if (pkt.source.realmId == realmId) revert NotAnImport();
    bytes32 sah = keccak256(abi.encode(pkt.actions));
    sourcePublicationId = EfsIds.publicationId(pkt.source.author, pkt.source.nonce, sah);
    if (Evidence._getFirstAdmission(sourcePublicationId) != 0) revert AlreadyAdmitted(sourcePublicationId);
    uint8 grade = _gradeSource(pkt.source, sah);

    // 3. admission run: row 0 = the authorization, rows 1..n = the imported actions under the source author
    bytes32 aah = keccak256(abi.encode(auth.actions));
    authorizationId = EfsIds.publicationId(auth.author, auth.nonce, aah);
    _openPublication(authorizationId, auth.author, auth.nonce);
    uint64 basis = Counters._get(COUNTER_ADMISSIONS);
    Effect[] memory effects = new Effect[](n + 1);
    effects[0] = _applyImportRow(auth.actions[0], auth.author, authorizationId, basis + 1);
    for (uint256 i = 0; i < n; i++) {
      if (pkt.actions[i].kind == KIND_IMPORT) revert ImportOnlyViaImportPublication(i);
      effects[i + 1] = _apply(
        i,
        pkt.actions[i],
        pkt.bodies[i],
        pkt.source.author,
        sourcePublicationId,
        basis + 2 + uint64(i)
      );
    }
    Counters._set(COUNTER_ADMISSIONS, basis + 1 + uint64(n));
    Evidence._set(
      authorizationId,
      EvidenceData({
        author: auth.author,
        proofKind: authProof,
        r: authSig.r,
        s: authSig.s,
        v: authSig.v,
        nonce: auth.nonce,
        deadline: auth.deadline,
        acceptanceProfile: auth.acceptanceProfile,
        indexObligations: auth.indexObligations,
        actionsHash: aah,
        firstAdmission: basis + 1,
        leafCount: 1,
        basis: basis,
        realmId: realmId,
        coreCodeCommitment: coreCodeCommitment(),
        importOf: sourcePublicationId,
        sourceGrade: grade
      })
    );
    Evidence._set(
      sourcePublicationId,
      EvidenceData({
        author: pkt.source.author,
        proofKind: pkt.source.proofKind,
        r: pkt.source.r,
        s: pkt.source.s,
        v: pkt.source.v,
        nonce: pkt.source.nonce,
        deadline: pkt.source.deadline,
        acceptanceProfile: pkt.source.acceptanceProfile,
        indexObligations: pkt.source.indexObligations,
        actionsHash: sah,
        firstAdmission: basis + 2,
        leafCount: uint16(n),
        basis: pkt.source.basis,
        realmId: pkt.source.realmId,
        coreCodeCommitment: pkt.source.coreCodeCommitment,
        importOf: bytes32(0),
        sourceGrade: grade
      })
    );
    uint256 g = gasleft();
    index.onPublication(sourcePublicationId, basis + 1, effects);
    emit Imported(sourcePublicationId, authorizationId, auth.author, grade);
    emit Published(authorizationId, auth.author, authProof, basis + 1, uint16(n + 1), g - gasleft());
  }

  // ---------------------------------------------------------------------------
  // internals
  // ---------------------------------------------------------------------------

  function _authorize(Intent calldata auth, Sig calldata sig) internal view returns (uint8 proofKind) {
    if (sig.v == 0 && sig.r == bytes32(0) && sig.s == bytes32(0)) {
      bytes32 expected = EfsIds.contractPrincipal(realmOrigin(), msg.sender);
      if (expected != auth.author) revert AuthorMismatch(expected, auth.author);
      return PROOF_NATIVE;
    }
    if (auth.deadline != 0 && block.timestamp > auth.deadline) revert Expired(auth.deadline);
    address signer = ecrecover(intentDigest(auth), sig.v, sig.r, sig.s);
    if (signer == address(0)) revert BadSignature();
    bytes32 expectedEoa = EfsIds.eoaPrincipal(signer);
    if (expectedEoa != auth.author) revert AuthorMismatch(expectedEoa, auth.author);
    return PROOF_EOA_SIG;
  }

  function _gradeSource(SourceEvidence calldata src, bytes32 sourceActionsHash) internal pure returns (uint8) {
    if (src.proofKind == PROOF_EOA_SIG) {
      bytes32 digest = EfsIds.intentDigest(
        src.realmId,
        src.coreCodeCommitment,
        src.author,
        src.nonce,
        src.deadline,
        src.acceptanceProfile,
        src.indexObligations,
        sourceActionsHash
      );
      address signer = ecrecover(digest, src.v, src.r, src.s);
      if (signer == address(0) || EfsIds.eoaPrincipal(signer) != src.author) revert BadSourceEvidence();
      return GRADE_SIGNATURE_VERIFIED;
    }
    if (src.proofKind == PROOF_NATIVE) return GRADE_UNVERIFIED_NATIVE;
    revert BadSourceEvidence();
  }

  function _checkProfile(Intent calldata intent) internal view {
    if (intent.acceptanceProfile != ACCEPTANCE_PROFILE_V1) revert BadProfile(intent.acceptanceProfile);
    if (intent.indexObligations != index.obligationsId()) revert BadObligations(intent.indexObligations);
  }

  function _openPublication(bytes32 publicationId, bytes32 author, uint64 nonce) internal {
    if (Evidence._getFirstAdmission(publicationId) != 0) revert AlreadyAdmitted(publicationId);
    uint64 last = Nonces._get(author);
    if (nonce <= last) revert NonceNotIncreasing(last, nonce);
    Nonces._set(author, nonce);
  }

  function _publish(
    Intent calldata intent,
    bytes[] calldata bodies,
    uint8 proofKind,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal returns (bytes32 publicationId, uint64 firstAdmission) {
    uint256 n = intent.actions.length;
    if (n == 0 || n > MAX_ACTIONS) revert BadActionCount(n);
    if (bodies.length != n) revert BodiesLengthMismatch(n, bodies.length);
    _checkProfile(intent);
    bytes32 ah = keccak256(abi.encode(intent.actions));
    publicationId = EfsIds.publicationId(intent.author, intent.nonce, ah);
    _openPublication(publicationId, intent.author, intent.nonce);
    uint64 basis = Counters._get(COUNTER_ADMISSIONS);
    firstAdmission = basis + 1;
    Effect[] memory effects = new Effect[](n);
    for (uint256 i = 0; i < n; i++) {
      if (intent.actions[i].kind == KIND_IMPORT) revert ImportOnlyViaImportPublication(i);
      effects[i] = _apply(i, intent.actions[i], bodies[i], intent.author, publicationId, basis + 1 + uint64(i));
    }
    Counters._set(COUNTER_ADMISSIONS, basis + uint64(n));
    Evidence._set(
      publicationId,
      EvidenceData({
        author: intent.author,
        proofKind: proofKind,
        r: r,
        s: s,
        v: v,
        nonce: intent.nonce,
        deadline: intent.deadline,
        acceptanceProfile: intent.acceptanceProfile,
        indexObligations: intent.indexObligations,
        actionsHash: ah,
        firstAdmission: firstAdmission,
        leafCount: uint16(n),
        basis: basis,
        realmId: realmId,
        coreCodeCommitment: coreCodeCommitment(),
        importOf: bytes32(0),
        sourceGrade: GRADE_NONE
      })
    );
    uint256 g = gasleft();
    index.onPublication(publicationId, firstAdmission, effects);
    emit Published(publicationId, intent.author, proofKind, firstAdmission, uint16(n), g - gasleft());
  }

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

  function _admissionOf(Action calldata a, bytes32 publicationId) internal pure returns (AdmissionData memory) {
    return
      AdmissionData({
        publicationId: publicationId,
        kind: a.kind,
        typeId: a.typeId,
        digestKind: a.digestKind,
        digest: a.digest,
        purpose: a.purpose,
        subject: a.subject,
        role: a.role,
        target: a.target,
        expectedRevision: a.expectedRevision,
        salt: a.salt
      });
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
    (, bytes32[] memory refTypes) = abi.decode(body, (bytes32, bytes32[]));
    address acceptor = address(uint160(uint256(a.target)));
    if (acceptor.code.length == 0) revert AcceptorHasNoCode(acceptor);
    Records._set(typeId, TYPE_META, ordinal, body);
    Types._set(typeId, acceptor, acceptor.codehash, ordinal, refTypes);
  }

  function _admitRecord(
    uint256 i,
    Action calldata a,
    bytes calldata body,
    uint64 ordinal
  ) internal returns (bytes32 recordId, bool fresh, bytes32[] memory refs) {
    (address acceptor, bytes32 codehash, uint64 typeAdmission, bytes32[] memory refTypes) = Types._get(a.typeId);
    if (typeAdmission == 0) revert UnknownType(a.typeId);
    bytes memory canonical;
    if (a.digestKind == DIGEST_BODY_HASH) {
      recordId = EfsIds.recordId(a.typeId, a.digest);
      if (Records._getFirstAdmission(recordId) == 0) {
        if (body.length == 0) revert RecordBodyRequired(i);
        if (keccak256(body) != a.digest) revert BodyHashMismatch(i);
        canonical = body;
        fresh = true;
      } else {
        if (body.length != 0 && keccak256(body) != a.digest) revert BodyHashMismatch(i);
        canonical = Records._getBody(recordId);
      }
    } else if (a.digestKind == DIGEST_RECORD_ID) {
      recordId = a.digest;
      if (Records._getFirstAdmission(recordId) == 0) revert MissingRecord(i, recordId);
      bytes32 actualType = Records._getTypeId(recordId);
      if (actualType != a.typeId) revert RefWrongType(i, type(uint256).max, a.typeId, actualType);
      canonical = Records._getBody(recordId);
    } else {
      revert BadDigestKind(i, a.digestKind);
    }
    bytes memory payload;
    (refs, payload) = _structural(i, canonical);
    if (refs.length != refTypes.length) revert RefCountMismatch(i, refTypes.length, refs.length);
    for (uint256 k = 0; k < refs.length; k++) {
      if (Records._getFirstAdmission(refs[k]) == 0) revert RefMissing(i, k, refs[k]);
      bytes32 actual = Records._getTypeId(refs[k]);
      if (actual != refTypes[k]) revert RefWrongType(i, k, refTypes[k], actual);
    }
    if (acceptor.codehash != codehash) revert AcceptorDrift(a.typeId);
    bytes4 magic = IAcceptor(acceptor).accept{ gas: ACCEPT_GAS }(a.typeId, recordId, refs, payload);
    if (magic != ACCEPT_MAGIC) revert Rejected(i, a.typeId);
    if (fresh) Records._set(recordId, a.typeId, ordinal, canonical);
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
