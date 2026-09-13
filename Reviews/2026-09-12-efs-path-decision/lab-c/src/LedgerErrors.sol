// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * File-level errors and events of the Ledger write path, shared by the Ledger, the inlined
 * ActionLib and the external (delegatecalled) ImportLib so every path raises the same
 * selectors and events are emitted from the Ledger's address. Tests reference them by bare name.
 */

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
error IndexCodeChanged(bytes32 sealed, bytes32 current);
error UnsupportedSourceProof(uint8 proofKind);

event Published(
  bytes32 indexed publicationId,
  bytes32 indexed author,
  uint8 proofKind,
  uint64 firstAdmission,
  uint16 leafCount,
  uint256 indexGas
);
event Imported(bytes32 indexed sourcePublicationId, bytes32 indexed authorizationId, bytes32 importer, uint8 sourceGrade);
