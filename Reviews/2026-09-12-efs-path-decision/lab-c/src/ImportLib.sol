// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * ImportLib: the import path as an EXTERNAL library (EIP-170 decomposition, coordinator option 1).
 * `Ledger.importPublication` reaches `ImportLib.importPublication` through a DELEGATECALL that the
 * compiler emits for external library functions: the code runs in the Ledger's storage context,
 * `msg.sender` and `address(this)` are the caller's and the Ledger's, events are emitted from the
 * Ledger, and the library holds no storage and exposes no privileged function. The library address
 * is linked into the Ledger's bytecode at deployment and is therefore immutable; its address and
 * codehash are part of the deployment identity (MANIFEST build.linkedLibraries).
 *
 * Semantics are unchanged from the inlined version: separate destination authorization, only
 * EOA-signed (grade 1) sources are importable (native sources revert UnsupportedSourceProof before
 * any write), imported actions re-run acceptance/CAS/index effects under the verified source author.
 */

import "./EfsTypes.sol";
import "./LedgerErrors.sol";
import { ActionLib } from "./ActionLib.sol";
import { Evidence, EvidenceData, Counters } from "./tables/LedgerTables.sol";

library ImportLib {
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

  function importPublication(
    ImportPacket calldata pkt,
    Intent calldata auth,
    Sig calldata authSig,
    ActionLib.LedgerRefs memory refs
  ) external returns (bytes32 sourcePublicationId, bytes32 authorizationId) {
    ImportCtx memory c;
    c.authProof = validateAuthorization(pkt, auth, authSig, refs);
    ActionLib.checkShape(pkt.actions.length, pkt.bodies.length);
    openImport(pkt, refs.realmId, c);
    c.authActionsHash = keccak256(abi.encode(auth.actions));
    c.authId = EfsIds.publicationId(auth.author, auth.nonce, c.authActionsHash);
    ActionLib.openPublication(c.authId, auth.author, auth.nonce);
    c.basis = Counters._get(COUNTER_ADMISSIONS);
    Effect[] memory effects = runImport(pkt, auth, c);
    Evidence._set(c.authId, authEvidence(auth, authSig, c, refs.realmId));
    Evidence._set(c.sourceId, sourceEvidence(pkt, c));
    uint256 g = ActionLib.dispatchIndex(refs, c.sourceId, c.basis + 1, effects);
    emit Imported(c.sourceId, c.authId, auth.author, c.grade);
    emit Published(c.authId, auth.author, c.authProof, c.basis + 1, 1, g); // == the authorization cell's leafCount
    emit Published(c.sourceId, pkt.source.author, pkt.source.proofKind, c.basis + 2, uint16(c.rows - 1), 0);
    return (c.sourceId, c.authId);
  }

  function packetCommitment(ImportPacket calldata pkt) internal pure returns (bytes32) {
    return keccak256(abi.encode(pkt.source, pkt.actions));
  }

  function validateAuthorization(
    ImportPacket calldata pkt,
    Intent calldata auth,
    Sig calldata sig,
    ActionLib.LedgerRefs memory refs
  ) internal view returns (uint8 proofKind) {
    if (auth.actions.length != 1 || auth.actions[0].kind != KIND_IMPORT) revert BadAuthorization();
    if (auth.actions[0].digestKind != DIGEST_PACKET || auth.actions[0].digest != packetCommitment(pkt)) {
      revert BadAuthorization();
    }
    proofKind = authorize(auth, sig, refs.realmId);
    ActionLib.checkProfile(auth, refs.index);
  }

  function authorize(Intent calldata auth, Sig calldata sig, bytes32 realmId) internal view returns (uint8) {
    if (sig.v == 0 && sig.r == bytes32(0) && sig.s == bytes32(0)) {
      if (auth.deadline != 0 && block.timestamp > auth.deadline) revert Expired(auth.deadline);
      bytes32 expected = EfsIds.contractPrincipal(EfsIds.realmOrigin(block.chainid, address(this)), msg.sender);
      if (expected != auth.author) revert AuthorMismatch(expected, auth.author);
      return PROOF_NATIVE;
    }
    ActionLib.requireEoaAuthor(auth, sig, realmId);
    return PROOF_EOA_SIG;
  }

  function openImport(ImportPacket calldata pkt, bytes32 realmId, ImportCtx memory c) internal view {
    if (pkt.source.realmId == realmId) revert NotAnImport();
    c.sourceActionsHash = keccak256(abi.encode(pkt.actions));
    c.sourceId = EfsIds.publicationId(pkt.source.author, pkt.source.nonce, c.sourceActionsHash);
    if (Evidence._exists(c.sourceId)) revert AlreadyAdmitted(c.sourceId);
    c.grade = gradeSource(pkt.source, c.sourceActionsHash);
  }

  /// Only an EOA-signed source can be verified here; anything else is unsupported (blocker fix).
  function gradeSource(SourceEvidence calldata src, bytes32 sourceActionsHash) internal pure returns (uint8) {
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
      address signer = ActionLib.recover(EfsIds.intentDigest(d), src.v, src.r, src.s);
      if (EfsIds.eoaPrincipal(signer) != src.author) revert BadSourceEvidence();
      return GRADE_SIGNATURE_VERIFIED;
    }
    revert UnsupportedSourceProof(src.proofKind);
  }

  /// Row 0 = the authorization; rows 1..n = the imported actions under the (verified) source author.
  function runImport(
    ImportPacket calldata pkt,
    Intent calldata auth,
    ImportCtx memory c
  ) internal returns (Effect[] memory effects) {
    uint256 n = pkt.actions.length;
    effects = new Effect[](n + 1);
    effects[0] = ActionLib.applyImportRow(auth.actions[0], auth.author, c.authId, c.basis + 1);
    Effect[] memory rows = ActionLib.runActions(pkt.actions, pkt.bodies, pkt.source.author, c.sourceId, c.basis, 1);
    for (uint256 i = 0; i < n; i++) effects[i + 1] = rows[i];
    c.rows = uint16(n + 1);
    Counters._set(COUNTER_ADMISSIONS, c.basis + 1 + uint64(n));
  }

  function authEvidence(
    Intent calldata auth,
    Sig calldata sig,
    ImportCtx memory c,
    bytes32 realmId
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

  function sourceEvidence(ImportPacket calldata pkt, ImportCtx memory c) internal pure returns (EvidenceData memory e) {
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
}
