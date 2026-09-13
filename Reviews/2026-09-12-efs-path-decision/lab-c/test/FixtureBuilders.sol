// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * FixtureBuilders: stateless action/intent/body builders, digest and signing. Deployed once;
 * called externally so nothing here is inlined into test contracts. ESTIMATED runtime ≈ 7–9 KB.
 */

import "../src/EfsTypes.sol";
import { Ledger } from "../src/Ledger.sol";
import { Vm, VM_ADDRESS } from "./Vm.sol";

contract FixtureBuilders {
  Vm internal constant vm = Vm(VM_ADDRESS);
  bytes32 public constant NOTE = keccak256(hex"7265666572656e63652071756f7465"); // "reference quote"

  function declareTypeAction(bytes memory body, address acceptor) public pure returns (Action memory a) {
    a.kind = KIND_DECLARE_TYPE;
    a.typeId = TYPE_META;
    a.digestKind = DIGEST_BODY_HASH;
    a.digest = keccak256(body);
    a.target = bytes32(uint256(uint160(acceptor)));
  }

  function recordAction(bytes32 typeId, bytes memory body) public pure returns (Action memory a) {
    a.kind = KIND_RECORD;
    a.typeId = typeId;
    a.digestKind = DIGEST_BODY_HASH;
    a.digest = keccak256(body);
  }

  function reuseAction(bytes32 typeId, bytes32 recordId) public pure returns (Action memory a) {
    a.kind = KIND_RECORD;
    a.typeId = typeId;
    a.digestKind = DIGEST_RECORD_ID;
    a.digest = recordId;
  }

  function subjectAction(bytes32 author, bytes32 salt) public pure returns (Action memory a) {
    a.kind = KIND_SUBJECT;
    a.subject = EfsIds.subjectId(author, salt);
    a.salt = salt;
  }

  function bindAction(
    bytes32 purpose,
    bytes32 subject,
    bytes32 role,
    bytes32 target,
    uint32 expectedRevision
  ) public pure returns (Action memory a) {
    a.kind = KIND_BIND;
    a.purpose = purpose;
    a.subject = subject;
    a.role = role;
    a.target = target;
    a.expectedRevision = expectedRevision;
  }

  function intentOf(bytes32 author, uint64 nonce, Action[] memory actions) public pure returns (Intent memory it) {
    it.author = author;
    it.nonce = nonce;
    it.acceptanceProfile = ACCEPTANCE_PROFILE_V1;
    it.indexObligations = INDEX_OBLIGATIONS_V1;
    it.actions = actions;
  }

  function digestOf(Ledger lg, Intent memory it) public view returns (bytes32) {
    DigestInput memory d;
    d.realmId = lg.realmId();
    d.coreCodeCommitment = address(lg).codehash;
    d.author = it.author;
    d.nonce = it.nonce;
    d.deadline = it.deadline;
    d.acceptanceProfile = it.acceptanceProfile;
    d.indexObligations = it.indexObligations;
    d.actionsHash = keccak256(abi.encode(it.actions));
    return EfsIds.intentDigest(d);
  }

  function signWith(uint256 pk, Ledger lg, Intent memory it) public view returns (Sig memory s) {
    (s.v, s.r, s.s) = vm.sign(pk, digestOf(lg, it));
  }

  function typeBody(bytes32 shape, bytes32[] memory refTypes) public pure returns (bytes memory) {
    return abi.encode(shape, refTypes);
  }

  function recordBody(bytes32[] memory refs, bytes memory payload) public pure returns (bytes memory) {
    return abi.encode(refs, payload);
  }

  function quotePayload(uint256 mantissa) public pure returns (bytes memory) {
    return abi.encode(mantissa, uint8(6), uint64(1_800_000_000), NOTE);
  }

  function quoteBody(bytes32 pair, uint256 mantissa) public pure returns (bytes memory) {
    bytes32[] memory refs = new bytes32[](1);
    refs[0] = pair;
    return recordBody(refs, quotePayload(mantissa));
  }

  function authFor(bytes32 importer, uint64 nonce, ImportPacket memory pkt) public pure returns (Intent memory) {
    Action[] memory acts = new Action[](1);
    acts[0].kind = KIND_IMPORT;
    acts[0].digestKind = DIGEST_PACKET;
    acts[0].digest = keccak256(abi.encode(pkt.source, pkt.actions));
    return intentOf(importer, nonce, acts);
  }
}
