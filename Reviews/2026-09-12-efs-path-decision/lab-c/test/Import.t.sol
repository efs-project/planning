// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "../src/EfsTypes.sol";
import "../src/LedgerErrors.sol";
import { Ledger } from "../src/Ledger.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { LensReader } from "../src/LensReader.sol";
import { QuoteConsumer } from "../src/Consumer.sol";
import { Records, Admissions, AdmissionData, Evidence, EvidenceData, Bindings, Subjects } from "../src/tables/LedgerTables.sol";
import { Occurrences, ByType, Backlinks } from "../src/tables/IndexTables.sol";
import { LabBase } from "./LabBase.sol";
import { EvidenceReconstructor } from "./FixtureExport.sol";

/*
 * Pre-seal checks 1–3: SELF-CHECK reconstruction, import, deployment-bound identity, spoof-via-import (split for EIP-3860). Unrun.
 */

contract ImportTest is LabBase {
  function setUp() public {
    _boot(true);
  }

  function _lensA() internal view returns (LensReader.Lens memory) {
    return lensOf(A, B, 0);
  }

  function _lensB() internal view returns (LensReader.Lens memory) {
    return lensOf(B, A, 0);
  }

  function _lensEq() internal view returns (LensReader.Lens memory) {
    return lensOf(A, B, 1);
  }

  function test_selfcheck_reconstruct_signature_from_state() public {
    bytes32 pubId = _a1();
    (Intent memory it, ) = _a1Intent();
    EvidenceReconstructor rec = export.newReconstructor();
    (bytes32 digest, address signer, bytes32 ah, EvidenceData memory ev) = rec.reconstruct(L(), pubId);
    require(digest == digestOf(ledger, it), "self-check: digest from Admission rows + Evidence cell");
    require(signer == aAddr, "self-check: signer recovered from state");
    require(ah == keccak256(abi.encode(it.actions)), "self-check: actionsHash identical despite MUD's packed row layout");
    require(ev.realmId == ledger.realmId() && ev.coreCodeCommitment == address(ledger).codehash, "realm/code retained in the cell");
    require(ev.r != bytes32(0) && ev.s != bytes32(0), "signature bytes retained");
  }
  function test_selfcheck_reconstruct_flippedDiscriminator_changesDigest() public {
    bytes32 pubId = _a1();
    EvidenceReconstructor rec = export.newReconstructor();
    (bytes32 digest, , , ) = rec.reconstruct(L(), pubId);
    bytes32 flipped = rec.reconstructFlipped(L(), pubId, 1);
    require(flipped != digest, "the bodyHash-vs-recordId discriminator is inside the signature");
  }
  function test_import_requiresDestinationAuthorization() public {
    bytes32 pubId = _a1();
    (, Ledger dst, ) = _deployRealmWith(POISON);
    _seedInto(dst, address(quoteAcceptor));
    ImportPacket memory pkt = _packetOf(ledger, pubId);
    // (a) the source signature alone: replaying it as a publication on the destination fails
    (Intent memory srcIntent, bytes[] memory bodies) = _a1Intent();
    try dst.publishSigned(srcIntent, bodies, Sig(pkt.source.v, pkt.source.r, pkt.source.s)) {
      revert("source signature is not destination authority");
    } catch (bytes memory err) {
      require(bytes4(err) == AuthorMismatch.selector || bytes4(err) == BadSignature.selector, "realm-bound");
    }
    // (b) import with an authorization the sender does not hold (EOA importer, native call)
    Intent memory auth = _authFor(EfsIds.eoaPrincipal(vm.addr(PK_I)), 1, pkt);
    try dst.importPublication(pkt, auth, Sig(0, bytes32(0), bytes32(0))) {
      revert("must reject");
    } catch (bytes memory err) {
      expectSel(err, AuthorMismatch.selector, "authorization must be held");
    }
    // (c) authorization over a different packet
    Intent memory wrong = _authFor(EfsIds.eoaPrincipal(vm.addr(PK_I)), 1, pkt);
    wrong.actions[0].digest = keccak256("other packet");
    try dst.importPublication(pkt, wrong, signWith(PK_I, dst, wrong)) {
      revert("must reject");
    } catch (bytes memory err) {
      expectSel(err, BadAuthorization.selector, "packet commitment mismatch");
    }
    (, , uint64 subjAdm) = Subjects.get(IStoreRead(address(dst)), FILE);
    require(subjAdm == 0 && dst.highWater() == 6, "nothing imported");
  }
  function _assertImportedSubject(Ledger dst, LensReader rd2) internal view {
    (bytes32 creator, , uint64 subjAdm) = Subjects.get(IStoreRead(address(dst)), FILE);
    require(subjAdm != 0 && creator == A, "id(F) preserved with its original creator");
    LensReader.Resolution memory r = rd2.resolve(lensOne(A), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.status == 1 && r.target == QUOTE_A1, "A's head selectable on the destination under A");
  }
  function _assertImportEvidence(Ledger dst, bytes32 srcId, bytes32 authId, bytes32 importer) internal view {
    EvidenceData memory src = Evidence.get(IStoreRead(address(dst)), srcId);
    require(src.author == A && src.proofKind == PROOF_EOA_SIG && src.sourceGrade == GRADE_SIGNATURE_VERIFIED, "source evidence retained and graded");
    require(src.realmId == ledger.realmId() && src.realmId != dst.realmId(), "source realm recorded, not relabelled");
    EvidenceData memory au = Evidence.get(IStoreRead(address(dst)), authId);
    require(au.author == importer && au.importOf == srcId && au.realmId == dst.realmId(), "destination authority is the importer");
    require(au.leafCount == 1, "authorization cell counts its own row only");
  }
  function test_import_preservesSubject_separatesAuthority() public {
    bytes32 pubId = _a1();
    (IndexModule ix2, Ledger dst, LensReader rd2) = _deployRealmWith(POISON);
    _seedInto(dst, address(quoteAcceptor));
    bytes32 importer = EfsIds.eoaPrincipal(vm.addr(PK_I));
    (bytes32 srcId, bytes32 authId) = _importA1Into(dst, importer, 1);
    require(srcId == pubId, "source publication id preserved");
    _assertImportedSubject(dst, rd2);
    _assertImportEvidence(dst, srcId, authId, importer);
    require(Occurrences.get(IStoreRead(address(ix2)), QUOTE_A1) == 1, "destination index effects are new");
    // re-import of the same source publication is refused
    try this.reimport(dst, importer) {
      revert("must reject");
    } catch (bytes memory err) {
      expectSel(err, AlreadyAdmitted.selector, "duplicate import");
    }
  }
  function reimport(Ledger dst, bytes32 importer) external {
    require(msg.sender == address(this), "self only");
    _importA1Into(dst, importer, 2);
  }
  function test_import_destinationRuleRejects_A2() public {
    _a1();
    bytes32 pub2 = _a2();
    (, Ledger dst, ) = _deployRealmWith(POISON);
    _seedInto(dst, actors.newQuoteAcceptorV2()); // stricter destination rule, same typeId
    bytes32 importer = EfsIds.eoaPrincipal(vm.addr(PK_I));
    ImportPacket memory p1 = _packetOf(ledger, _pubIdA1());
    Intent memory auth1 = _authFor(importer, 1, p1);
    dst.importPublication(p1, auth1, signWith(PK_I, dst, auth1)); // A1 (2.5e9) accepted by v2
    ImportPacket memory p2 = _packetOf(ledger, pub2);
    Intent memory auth2 = _authFor(importer, 2, p2);
    try dst.importPublication(p2, auth2, signWith(PK_I, dst, auth2)) {
      revert("must reject");
    } catch (bytes memory err) {
      require(err.length > 0, "A2 (2.502e9) rejected by the destination rule");
    }
    (, uint64 a2Dst, ) = Records.get(IStoreRead(address(dst)), QUOTE_A2);
    (, uint64 a2Src, ) = Records.get(L(), QUOTE_A2);
    require(a2Dst == 0 && a2Src != 0, "source acceptance is not destination authority");
  }
  function test_twoRealms_sameContractAndSalt_differentSubject_nativeImportUnsupported() public {
    bytes32 salt = keccak256("S");
    Action[] memory acts = new Action[](1);
    acts[0] = subjectAction(B, salt);
    (bytes32 pubB, ) = producer.publish(ledger, intentOf(B, seeder.nextNonceB(), acts), noBodies(1));
    bytes32 s1 = EfsIds.subjectId(B, salt);

    (, Ledger r3, ) = _deployRealmWith(POISON);
    bytes32 B3 = producer.principal(r3);
    require(B3 != B, "same address, different Ledger deployment -> different principal");
    acts[0] = subjectAction(B3, salt);
    producer.publish(r3, intentOf(B3, 1, acts), noBodies(1));
    require(EfsIds.subjectId(B3, salt) != s1, "same contract + salt on two Realms -> different subjectIds");

    // a native (grade-zero) source publication is not importable: no witness, no attributed cell, no writes
    ImportPacket memory pkt = _packetOf(ledger, pubB);
    Intent memory auth = _authFor(B3, 2, pkt);
    try producer.importInto(r3, pkt, auth) {
      revert("native source import must be unsupported");
    } catch (bytes memory err) {
      expectSel(err, UnsupportedSourceProof.selector, "UnsupportedSourceProof expected");
    }
    (, , uint64 adm) = Subjects.get(IStoreRead(address(r3)), s1);
    require(adm == 0, "no subject minted under the source principal");
    require(!_evidenceExists(r3, pubB), "no attributed evidence cell either");
  }
  function _evidenceExists(Ledger lg, bytes32 pubId) internal view returns (bool) {
    return Evidence.get(IStoreRead(address(lg)), pubId).author != bytes32(0);
  }
  function test_spoofViaImport_nativeSourceClaimingB_rejected_stateUnchanged() public {
    _a1();
    _b1();
    (, Ledger dst, LensReader rd2) = _deployRealmWith(POISON);
    _seedInto(dst, address(quoteAcceptor));
    // legitimately move A's publication over so FILE exists on the destination, then B's real head
    bytes32 importer = EfsIds.eoaPrincipal(vm.addr(PK_I));
    _importA1Into(dst, importer, 1);
    ImportPacket memory pkt = _packetOf(ledger, _pubIdA1());
    // forge: claim B (native proof, no signature) and rebind B's head to QUOTE_A1 at the destination
    pkt.source.author = B;
    pkt.source.proofKind = PROOF_NATIVE;
    pkt.source.nonce = 99;
    pkt.actions = new Action[](1);
    pkt.actions[0] = bindAction(PURPOSE_HEAD, FILE, bytes32(0), QUOTE_A1, 0);
    pkt.bodies = new bytes[](1);
    Intent memory auth = _authFor(importer, 2, pkt);
    uint64 hw = dst.highWater();
    try dst.importPublication(pkt, auth, signWith(PK_I, dst, auth)) {
      revert("spoof via import must revert");
    } catch (bytes memory err) {
      expectSel(err, UnsupportedSourceProof.selector, "UnsupportedSourceProof expected");
    }
    require(dst.highWater() == hw, "no admission");
    LensReader.Resolution memory r = rd2.resolve(lensOne(B), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.status == 2, "B has no head on the destination (absent proven), nothing was selected as FOUND");
    (, uint32 rev, ) = Bindings.get(IStoreRead(address(dst)), EfsIds.bindingKey(B, PURPOSE_HEAD, FILE, bytes32(0)));
    require(rev == 0, "B's binding untouched");
  }
}
