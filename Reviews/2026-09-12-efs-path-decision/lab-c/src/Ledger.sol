// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Ledger: the ONLY write entrypoints of the Store-only probe.
 *   publishNative(intent, bodies)          author = deployment-qualified contract principal of msg.sender
 *   publishSigned(intent, bodies, sig)     author = EOA principal recovered from the EIP-712 PublicationIntent
 *   importPublication(packet, auth, sig)   source evidence (graded) + separate destination authorization
 * Laws: ordered-prefix batch (action k sees writes of actions < k, whole tx reverts on any failure);
 * strict CAS on every binding; typed references checked against declared refTypes at that point;
 * view-only acceptance bound to (typeId, acceptor codehash, basis); exact retry reverts AlreadyAdmitted;
 * one IndexModule call per publication in the same tx (index revert = publication revert); the Ledger and
 * its IndexModule are reciprocally sealed (address + codehash) before any dispatch.
 * Every durable fact is a MUD table row (see tables/LedgerTables.sol); no raw slots.
 *
 * EIP-170 decomposition (build #2d measured 25,032 B): the shared write machinery lives in the INTERNAL
 * ActionLib (inlined here), the import path lives in the EXTERNAL ImportLib reached by DELEGATECALL
 * (no storage of its own, no privileged function, address linked immutably into this bytecode).
 * Errors and events are file-level (LedgerErrors.sol) so all three raise the same selectors.
 */

import { EfsStoreCore } from "./EfsStoreCore.sol";
import "./EfsTypes.sol";
import "./LedgerErrors.sol";
import { ActionLib } from "./ActionLib.sol";
import { ImportLib } from "./ImportLib.sol";
import { Records, Admissions, Evidence, Bindings, Subjects, Types, Nonces, Counters } from "./tables/LedgerTables.sol";

contract Ledger is EfsStoreCore {
  IIndexModule public immutable index;
  bytes32 public immutable indexCodehash; // sealed at construction; checked before every dispatch
  bytes32 public immutable realmId; // keccak(TAG_REALM, chainId, address(this)) — chain + deployment

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
    return ActionLib.intentDigest(intent, realmId);
  }

  /// Structural decode of a typed body; reached by ActionLib through an external self-call so a decode
  /// failure becomes StructuralInvalid instead of a raw panic.
  function decodeBody(bytes calldata body) external pure returns (bytes32[] memory refs, bytes memory payload) {
    (refs, payload) = abi.decode(body, (bytes32[], bytes));
  }

  /// Exact Type body commits shape, reference Types, and the mandatory rule runtime.
  function decodeTypeBody(bytes calldata body) external pure returns (bytes32 shape, bytes32[] memory refTypes, bytes32 mandatoryRuleId) {
    (shape, refTypes, mandatoryRuleId) = abi.decode(body, (bytes32, bytes32[], bytes32));
  }

  function _refs() internal view returns (ActionLib.LedgerRefs memory r) {
    r.realmId = realmId;
    r.index = index;
    r.indexCodehash = indexCodehash;
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
    ActionLib.PubCtx memory c;
    c.proofKind = PROOF_NATIVE;
    return ActionLib.publish(intent, bodies, c, _refs());
  }

  function publishSigned(
    Intent calldata intent,
    bytes[] calldata bodies,
    Sig calldata sig
  ) external returns (bytes32 publicationId, uint64 firstAdmission) {
    ActionLib.requireEoaAuthor(intent, sig, realmId);
    ActionLib.PubCtx memory c;
    c.proofKind = PROOF_EOA_SIG;
    c.v = sig.v;
    c.r = sig.r;
    c.s = sig.s;
    return ActionLib.publish(intent, bodies, c, _refs());
  }

  /// Import (see ImportLib): the source-Realm-bound signature is source evidence only; admission here needs a
  /// separate destination authorization; only EOA-signed (grade 1) sources are importable — a native source
  /// reverts UnsupportedSourceProof before any write. Executed in this contract's storage via DELEGATECALL.
  function importPublication(
    ImportPacket calldata pkt,
    Intent calldata auth,
    Sig calldata authSig
  ) external returns (bytes32 sourcePublicationId, bytes32 authorizationId) {
    return ImportLib.importPublication(pkt, auth, authSig, _refs());
  }
}
