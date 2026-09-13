// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "../src/EfsTypes.sol";
import "../src/LedgerErrors.sol";
import { Ledger } from "../src/Ledger.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { LensReader } from "../src/LensReader.sol";
import { QuoteConsumer } from "../src/Consumer.sol";
import { Records, Types, Nonces, Admissions, AdmissionData, Evidence, EvidenceData, Bindings, Subjects } from "../src/tables/LedgerTables.sol";
import { Occurrences, ByType, ByAuthor, Backlinks } from "../src/tables/IndexTables.sol";
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

// Separate contract keeps the added rule-identity cases within normal test runtime limits.
contract ImportRuleCommitmentTest is LabBase {
  function setUp() public {
    _boot(true);
  }

  // Replaces the old "V2 rule, same exact Type" scenario. An additive Realm-policy
  // assessment is UNSUPPORTED in this lab, not represented by substituting V2 here.
  function test_import_destinationTypeSubstitutionRefused_thenSameRuleAcceptsA1A2() public {
    _a1();
    bytes32 pub2 = _a2();
    (IndexModule ix2, Ledger dst, LensReader rd2) = _deployRealmWith(POISON);
    address replacement = actors.newQuoteAcceptorV2();
    try seeder.seedInto(dst, replacement) {
      revert("same exact Type accepted a substituted mandatory rule");
    } catch (bytes memory err) {
      require(
        keccak256(err) == keccak256(abi.encodeWithSelector(AcceptorRuleMismatch.selector, QUOTE_T, address(quoteAcceptor).codehash, replacement.codehash)),
        "destination substitution must identify the committed and selected rules"
      );
    }
    _assertRejectedDestinationSeed(dst, ix2, replacement);

    // Only repair the selected local rule; the committed body and exact Type stay fixed.
    _seedInto(dst, address(quoteAcceptor));
    bytes32 importer = EfsIds.eoaPrincipal(vm.addr(PK_I));
    _importA1Into(dst, importer, 1);
    ImportPacket memory p2 = _packetOf(ledger, pub2);
    Intent memory auth2 = _authFor(importer, 2, p2);
    dst.importPublication(p2, auth2, signWith(PK_I, dst, auth2));
    (, uint64 a2Dst, ) = Records.get(IStoreRead(address(dst)), QUOTE_A2);
    (, uint64 a2Src, ) = Records.get(L(), QUOTE_A2);
    require(a2Dst != 0 && a2Src != 0, "same mandatory rule admits A2 in both Realms");
    LensReader.Resolution memory selected = rd2.resolve(lensOne(A), PURPOSE_HEAD, FILE, bytes32(0));
    require(selected.target == QUOTE_A2 && selected.revision == 2, "same-rule imports preserve A1 to A2 history");
    require(dst.highWater() == 15 && Occurrences.get(IStoreRead(address(ix2)), QUOTE_A2) == 1, "same-rule import effects missing");
  }

  function _assertRejectedDestinationSeed(Ledger dst, IndexModule ix2, address replacement) internal view {
    IStoreRead store = IStoreRead(address(dst));
    bytes32[] memory typeIds = new bytes32[](3);
    typeIds[0] = ITEM_T;
    typeIds[1] = PAIR_T;
    typeIds[2] = QUOTE_T;
    for (uint256 i = 0; i < typeIds.length; i++) {
      (address rule, bytes32 ruleHash, uint64 typeAdmission, bytes32[] memory refs) = Types.get(store, typeIds[i]);
      require(rule == address(0) && ruleHash == bytes32(0) && typeAdmission == 0 && refs.length == 0, "substitution left a Type row");
      (, uint64 recordAdmission, bytes memory body) = Records.get(store, typeIds[i]);
      require(recordAdmission == 0 && body.length == 0, "substitution retained a prefix Type Record");
      require(Admissions.get(store, uint64(i + 1)).publicationId == bytes32(0), "substitution retained a prefix admission");
      require(Occurrences.get(IStoreRead(address(ix2)), typeIds[i]) == 0, "substitution retained an index occurrence");
    }
    bytes32 seedAuthor = EfsIds.contractPrincipal(dst.realmOrigin(), address(seeder));
    (Action[] memory seedActions, ) = seeder.seedActions(replacement);
    bytes32 rejectedId = keccak256(abi.encode(seedAuthor, seeder.nonceSelf() + 1, keccak256(abi.encode(seedActions))));
    require(Evidence.get(store, rejectedId).firstAdmission == 0, "substitution retained publication evidence");
    require(Nonces.get(store, seedAuthor) == 0 && dst.highWater() == 0, "substitution advanced destination admission state");
    require(ByType.length(IStoreRead(address(ix2)), TYPE_META) == 0, "substitution changed Type inventory");
    require(ByAuthor.length(IStoreRead(address(ix2)), seedAuthor) == 0, "substitution changed author inventory");
  }

  /// Signature verification is not proof of source admission. Even a correctly
  /// signed source intent must satisfy the same mandatory rule at the destination.
  function test_import_validSignatureNeverSourceAdmitted_revalidatesMandatoryRule() public {
    _a1();
    (IndexModule ix2, Ledger dst, LensReader rd2) = _deployRealmWith(POISON);
    _seedInto(dst, address(quoteAcceptor));
    bytes32 importer = EfsIds.eoaPrincipal(vm.addr(PK_I));
    _importA1Into(dst, importer, 1);
    (ImportPacket memory pkt, bytes32 invalidRecord) = _signedUnadmittedA2Packet();
    bytes32 sourceId = keccak256(abi.encode(A, pkt.source.nonce, keccak256(abi.encode(pkt.actions))));
    require(Evidence.get(L(), sourceId).firstAdmission == 0, "invalid intent must never have been source-admitted");
    (, uint64 sourceAdmission, ) = Records.get(L(), invalidRecord);
    require(sourceAdmission == 0, "invalid source Record unexpectedly exists");
    Intent memory auth = _authFor(importer, 2, pkt);
    try dst.importPublication(pkt, auth, signWith(PK_I, dst, auth)) {
      revert("signature-only source evidence bypassed mandatory acceptance");
    } catch (bytes memory err) {
      require(
        keccak256(err) == keccak256(abi.encodeWithSignature("Error(string)", "quote: mantissa out of bounds")),
        "must reach and fail the real immutable Quote rule"
      );
    }
    _assertRejectedSignedImport(dst, ix2, pkt, auth, invalidRecord);
    LensReader.Resolution memory selected = rd2.resolve(lensOne(A), PURPOSE_HEAD, FILE, bytes32(0));
    require(selected.target == QUOTE_A1 && selected.revision == 1, "invalid signed update changed selected head");
  }

  function _signedUnadmittedA2Packet() internal view returns (ImportPacket memory pkt, bytes32 invalidRecord) {
    (Intent memory intent, bytes[] memory bodies) = _a2Intent();
    bodies[0] = quoteBody(PAIR, 0); // Valid structure and references; the mandatory rule rejects zero.
    invalidRecord = keccak256(abi.encode(QUOTE_T, keccak256(bodies[0])));
    intent.actions[0] = recordAction(QUOTE_T, bodies[0]);
    intent.actions[1].target = invalidRecord;
    Sig memory signature = signWith(PK_A, ledger, intent);
    pkt.actions = intent.actions;
    pkt.bodies = bodies;
    pkt.source.realmId = ledger.realmId();
    pkt.source.coreCodeCommitment = address(ledger).codehash;
    pkt.source.author = intent.author;
    pkt.source.proofKind = PROOF_EOA_SIG;
    pkt.source.v = signature.v;
    pkt.source.r = signature.r;
    pkt.source.s = signature.s;
    pkt.source.nonce = intent.nonce;
    pkt.source.deadline = intent.deadline;
    pkt.source.acceptanceProfile = intent.acceptanceProfile;
    pkt.source.indexObligations = intent.indexObligations;
    pkt.source.firstAdmission = 0; // Deliberately no claimed source admission.
    pkt.source.leafCount = uint16(intent.actions.length);
    pkt.source.basis = ledger.highWater();
  }

  function _assertRejectedSignedImport(
    Ledger dst,
    IndexModule ix2,
    ImportPacket memory pkt,
    Intent memory auth,
    bytes32 invalidRecord
  ) internal view {
    IStoreRead store = IStoreRead(address(dst));
    bytes32 sourceId = keccak256(abi.encode(A, pkt.source.nonce, keccak256(abi.encode(pkt.actions))));
    bytes32 authId = keccak256(abi.encode(auth.author, auth.nonce, keccak256(abi.encode(auth.actions))));
    (, uint64 admission, ) = Records.get(store, invalidRecord);
    require(admission == 0 && Occurrences.get(IStoreRead(address(ix2)), invalidRecord) == 0, "invalid imported Record or occurrence survived");
    require(dst.highWater() == 12 && Nonces.get(store, auth.author) == 1, "rejected import advanced admission state");
    require(Admissions.get(store, 13).publicationId == bytes32(0), "destination authorization row survived rejection");
    require(Admissions.get(store, 14).publicationId == bytes32(0), "invalid source action row survived rejection");
    require(Evidence.get(store, sourceId).firstAdmission == 0 && Evidence.get(store, authId).firstAdmission == 0, "rejected import retained evidence");
    require(ByType.length(IStoreRead(address(ix2)), QUOTE_T) == 1, "rejected import changed Quote inventory");
    require(ByAuthor.length(IStoreRead(address(ix2)), A) == 5, "rejected import changed source-author inventory");
    require(ByAuthor.length(IStoreRead(address(ix2)), auth.author) == 1, "rejected import changed importer inventory");
  }
}
