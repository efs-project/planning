// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * FixtureExport: export/import helpers over PUBLIC reads (packet building, destination authorization,
 * A1 import) and the SELF-CHECK reconstructor factory. Inlines the Evidence/Admissions/Records decoders
 * (candidate code => self-check grade). ESTIMATED runtime ≈ 9–12 KB.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "../src/EfsTypes.sol";
import { Ledger } from "../src/Ledger.sol";
import { Records, Admissions, AdmissionData, Evidence, EvidenceData } from "../src/tables/LedgerTables.sol";
import { FixtureBuilders } from "./FixtureBuilders.sol";
import { FixtureSeeder } from "./FixtureSeeder.sol";

// SELF-CHECK reader: re-derives the signed digest from public reads (Evidence cell + Admission rows)
// with the candidate's own table decoders and EfsIds.intentDigest. A consistency self-check of the
// candidate, NOT the independent oracle (raw-bytes re-derivation is owed).
contract EvidenceReconstructor {
  function actionFrom(AdmissionData memory ad) public pure returns (Action memory a) {
    a.kind = ad.kind;
    a.typeId = ad.typeId;
    a.digestKind = ad.digestKind;
    a.digest = ad.digest;
    a.purpose = ad.purpose;
    a.subject = ad.subject;
    a.role = ad.role;
    a.target = ad.target;
    a.expectedRevision = ad.expectedRevision;
    a.salt = ad.salt;
  }

  function actionsOf(IStoreRead ledger, bytes32 publicationId) public view returns (Action[] memory acts, EvidenceData memory ev) {
    ev = Evidence.get(ledger, publicationId);
    acts = new Action[](ev.leafCount);
    for (uint256 i = 0; i < ev.leafCount; i++) {
      AdmissionData memory ad = Admissions.get(ledger, ev.firstAdmission + uint64(i));
      require(ad.publicationId == publicationId, "row belongs to another publication");
      acts[i] = actionFrom(ad);
    }
  }

  function digestOf(Action[] memory acts, EvidenceData memory ev) public pure returns (bytes32 actionsHash, bytes32 digest) {
    actionsHash = keccak256(abi.encode(acts));
    DigestInput memory d;
    d.realmId = ev.realmId;
    d.coreCodeCommitment = ev.coreCodeCommitment;
    d.author = ev.author;
    d.nonce = ev.nonce;
    d.deadline = ev.deadline;
    d.acceptanceProfile = ev.acceptanceProfile;
    d.indexObligations = ev.indexObligations;
    d.actionsHash = actionsHash;
    digest = EfsIds.intentDigest(d);
  }

  function reconstruct(
    IStoreRead ledger,
    bytes32 publicationId
  ) external view returns (bytes32 digest, address signer, bytes32 actionsHash, EvidenceData memory ev) {
    Action[] memory acts;
    (acts, ev) = actionsOf(ledger, publicationId);
    (actionsHash, digest) = digestOf(acts, ev);
    require(actionsHash == ev.actionsHash, "actionsHash mismatch");
    signer = ev.proofKind == PROOF_EOA_SIG ? ecrecover(digest, ev.v, ev.r, ev.s) : address(0);
  }

  /// Negative control: flip the bodyHash-vs-recordId discriminator of one row and recompute.
  function reconstructFlipped(IStoreRead ledger, bytes32 publicationId, uint256 row) external view returns (bytes32 digest) {
    (Action[] memory acts, EvidenceData memory ev) = actionsOf(ledger, publicationId);
    acts[row].digestKind = acts[row].digestKind == DIGEST_BODY_HASH ? DIGEST_RECORD_ID : DIGEST_BODY_HASH;
    (, digest) = digestOf(acts, ev);
  }
}

contract FixtureExport {
  uint256 public constant PK_I = 0x1F1F; // destination importer (not the author)

  FixtureBuilders public immutable b;
  FixtureSeeder public immutable seeder;
  Ledger public immutable ledger;

  constructor(FixtureBuilders b_, FixtureSeeder seeder_, Ledger ledger_) {
    b = b_;
    seeder = seeder_;
    ledger = ledger_;
  }

  function newReconstructor() external returns (EvidenceReconstructor) {
    return new EvidenceReconstructor();
  }

  function sourceOf(EvidenceData memory ev) public pure returns (SourceEvidence memory s) {
    s.realmId = ev.realmId;
    s.coreCodeCommitment = ev.coreCodeCommitment;
    s.author = ev.author;
    s.proofKind = ev.proofKind;
    s.v = ev.v;
    s.r = ev.r;
    s.s = ev.s;
    s.nonce = ev.nonce;
    s.deadline = ev.deadline;
    s.acceptanceProfile = ev.acceptanceProfile;
    s.indexObligations = ev.indexObligations;
    s.firstAdmission = ev.firstAdmission;
    s.leafCount = ev.leafCount;
    s.basis = ev.basis;
  }

  function actionFrom(AdmissionData memory ad) public pure returns (Action memory a) {
    a.kind = ad.kind;
    a.typeId = ad.typeId;
    a.digestKind = ad.digestKind;
    a.digest = ad.digest;
    a.purpose = ad.purpose;
    a.subject = ad.subject;
    a.role = ad.role;
    a.target = ad.target;
    a.expectedRevision = ad.expectedRevision;
    a.salt = ad.salt;
  }

  function packetOf(Ledger src, bytes32 pubId) public view returns (ImportPacket memory pkt) {
    IStoreRead s = IStoreRead(address(src));
    EvidenceData memory ev = Evidence.get(s, pubId);
    pkt.source = sourceOf(ev);
    pkt.actions = new Action[](ev.leafCount);
    pkt.bodies = new bytes[](ev.leafCount);
    for (uint256 i = 0; i < ev.leafCount; i++) {
      AdmissionData memory ad = Admissions.get(s, ev.firstAdmission + uint64(i));
      pkt.actions[i] = actionFrom(ad);
      if (ad.kind == KIND_RECORD && ad.digestKind == DIGEST_BODY_HASH) {
        (, , pkt.bodies[i]) = Records.get(s, EfsIds.recordId(ad.typeId, ad.digest));
      } else if (ad.kind == KIND_DECLARE_TYPE) {
        (, , pkt.bodies[i]) = Records.get(s, EfsIds.recordId(TYPE_META, ad.digest));
      }
    }
  }

  /// Imports A's first publication into `dst` under an EOA importer's signed authorization.
  function importA1Into(Ledger dst, bytes32 importer, uint64 nonce) public returns (bytes32 srcId, bytes32 authId) {
    ImportPacket memory pkt = packetOf(ledger, seeder.pubIdA1());
    Intent memory auth = b.authFor(importer, nonce, pkt);
    (srcId, authId) = dst.importPublication(pkt, auth, b.signWith(PK_I, dst, auth));
  }
}
