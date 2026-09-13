// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * sdk-fixture steps 1–6 in miniature + adversarial variants + the coordinator's four
 * pre-seal checks. Unrun: no compiler lease has been granted (see TODO.md).
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "../src/EfsTypes.sol";
import { Ledger } from "../src/Ledger.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { LensReader } from "../src/LensReader.sol";
import { QuoteConsumer } from "../src/Consumer.sol";
import {
  Records,
  Admissions,
  AdmissionData,
  Evidence,
  EvidenceData,
  Bindings,
  Subjects
} from "../src/tables/LedgerTables.sol";
import { Occurrences, ByType, Backlinks } from "../src/tables/IndexTables.sol";
import { LabBase, QuoteAcceptorV2, EvidenceReconstructor } from "./LabBase.sol";

contract FixtureTest is LabBase {
  function setUp() public {
    _deployRealm();
    _seed();
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

  // ---------------------------------------------------------------------------
  // steps 1–5
  // ---------------------------------------------------------------------------

  function test_step1_itemsPairAdmitted_refsChecked() public view {
    (bytes32 t, uint64 adm, ) = Records.get(L(), PAIR);
    require(t == PAIR_T && adm == 6, "pair admitted as 6th row of the seed publication");
    require(Backlinks.length(X(), ITEM_ETH) == 1 && Backlinks.length(X(), ITEM_USDC) == 1, "backlinks from pair");
    require(ByType.length(X(), ITEM_T) == 2 && ByType.length(X(), PAIR_T) == 1, "by-type inventories");
    require(ByType.length(X(), TYPE_META) == 3, "three Types listed under the meta type");
    (uint8 st, uint64 thr) = index.coverage(index.FAMILY_BY_TYPE(), bytes32(0));
    require(st == 1 && thr == ledger.highWater(), "mandatory family complete through high-water");
  }

  function test_step2_a1_signed_freshBody_preAbsence() public {
    bytes32 rid = EfsIds.recordId(QUOTE_T, keccak256(quoteBody(PAIR, 2_500_000_000)));
    (, uint64 pre, ) = Records.get(L(), rid);
    require(pre == 0, "pre-absence of the exact Record");
    bytes32 pubId = _a1();
    (, uint64 post, ) = Records.get(L(), QUOTE_A1);
    require(post == 8, "fresh Record admitted at ordinal 8 (seed=6, subject=7)");
    EvidenceData memory ev = Evidence.get(L(), pubId);
    require(ev.author == A && ev.proofKind == PROOF_EOA_SIG && ev.leafCount == 5 && ev.firstAdmission == 7, "evidence cell");
    require(ev.realmId == ledger.realmId() && ev.coreCodeCommitment == address(ledger).codehash, "realm/code retained");
    LensReader.Resolution memory r = reader.resolve(lensOne(A), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.status == 1 && r.target == QUOTE_A1 && r.revision == 1, "head read-back");
    LensReader.Page memory p = reader.list(lensOne(A), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE && p.status == 1, "folder listing complete");
    p = reader.listTagged(lensOne(A), SWAPS, MARKET, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE, "tag query complete");
    require(Occurrences.get(X(), QUOTE_A1) == 1, "one occurrence");
  }

  function test_step3_a2_cas_history() public {
    _a1();
    _a2();
    (, uint64 a1, ) = Records.get(L(), QUOTE_A1);
    require(a1 != 0, "A1 remains historically readable");
    LensReader.Resolution memory r = reader.resolve(lensOne(A), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.target == QUOTE_A2 && r.revision == 2, "A2 is A's current head exactly once");
    (, bytes32[] memory targets, uint32 total) = reader.history(EfsIds.bindingKey(A, PURPOSE_HEAD, FILE, bytes32(0)), 0, 10);
    require(total == 2 && targets[0] == QUOTE_A1 && targets[1] == QUOTE_A2, "head history");
    LensReader.Page memory p = reader.list(lensOne(A), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.rawTotal == 1, "directory result non-duplicated");
  }

  function test_step4_b1_contractAuthor() public {
    _a1();
    _a2();
    bytes32 pubId = _b1();
    EvidenceData memory ev = Evidence.get(L(), pubId);
    require(ev.author == B && ev.proofKind == PROOF_NATIVE && ev.r == bytes32(0) && ev.v == 0, "native evidence, no fabricated signature");
    require(ev.author == EfsIds.contractPrincipal(ledger.realmOrigin(), address(producer)), "deployment-qualified contract principal");
    require(producer.probeApproves(), "the mutable account probe is captured separately");
    LensReader.Resolution memory r = reader.resolve(lensOne(B), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.target == QUOTE_B1, "B's own head");
  }

  function test_step5_threeLenses_agree_point_list_tag() public {
    _a1();
    _a2();
    _b1();
    LensReader.Resolution memory r = reader.resolve(_lensA(), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.status == 1 && r.target == QUOTE_A2 && r.selectedBy == A, "A-first selects A2");
    r = reader.resolve(_lensB(), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.status == 1 && r.target == QUOTE_B1 && r.selectedBy == B, "B-first selects B1");
    r = reader.resolve(_lensEq(), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.status == 3 && r.target == bytes32(0), "no-tiebreak reports CONFLICT with no winner");
    LensReader.Page memory p = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].selectedBy == A && p.rawTotal == 2, "A-first page agrees with point read");
    p = reader.list(_lensB(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].selectedBy == B, "B-first page agrees with point read");
    p = reader.listTagged(_lensB(), SWAPS, MARKET, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE, "tag stance falls through to A under B-first");
    p = reader.list(_lensEq(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].status == 1, "both placements target the same subject: no conflict in the folder");
  }

  // ---------------------------------------------------------------------------
  // step 6: move, path reuse, remove, restore
  // ---------------------------------------------------------------------------

  function test_step6_move_replace_remove_restore() public {
    _a1();
    _a2();
    _b1();
    Action[] memory acts = new Action[](2);
    acts[0] = bindAction(PURPOSE_FOLDER, SWAPS, NAME, bytes32(0), 1); // whiteout the old placement
    acts[1] = bindAction(PURPOSE_FOLDER, MARKETS, NAME, FILE, 0); // place at the new path
    _publishA(acts, noBodies(2));
    bytes32 G = EfsIds.subjectId(A, SALT_G);
    acts = new Action[](2);
    acts[0] = subjectAction(A, SALT_G);
    acts[1] = bindAction(PURPOSE_FOLDER, SWAPS, NAME, G, 2); // unrelated File takes the vacated path
    _publishA(acts, noBodies(2));

    LensReader.Page memory p = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == G, "A-first: /swaps shows the replacement");
    p = reader.list(_lensB(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE, "B-first: B never moved its placement");
    p = reader.list(_lensA(), PURPOSE_FOLDER, MARKETS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE, "/markets shows FILE");
    p = reader.listTagged(_lensA(), SWAPS, MARKET, zeroCursor(), 10);
    require(p.items.length == 0, "replacement carries no market tag");
    p = reader.listTagged(_lensA(), MARKETS, MARKET, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE, "tag followed the File");

    acts = new Action[](1);
    acts[0] = bindAction(PURPOSE_FOLDER, MARKETS, NAME, bytes32(0), 1); // remove
    _publishA(acts, noBodies(1));
    p = reader.list(_lensA(), PURPOSE_FOLDER, MARKETS, zeroCursor(), 10);
    require(p.items.length == 0 && p.status == 1 && p.rawTotal == 1, "removed: complete, zero selected, evidence retained");

    acts = new Action[](1);
    acts[0] = bindAction(PURPOSE_FOLDER, MARKETS, NAME, FILE, 2); // restore
    _publishA(acts, noBodies(1));
    p = reader.list(_lensA(), PURPOSE_FOLDER, MARKETS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE && p.items[0].revision == 3, "restored as a new revision");

    LensReader.Resolution memory r = reader.resolve(_lensA(), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.target == QUOTE_A2, "A-first head unchanged by moves");
    r = reader.resolve(_lensB(), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.target == QUOTE_B1, "B-first head unchanged by moves");
    r = reader.resolve(_lensA(), PURPOSE_TAG, FILE, MARKET);
    require(r.status == 1 && r.target == TAG_ASSERT, "tag still bound to the stable subject");
    r = reader.resolve(_lensA(), PURPOSE_TAG, G, MARKET);
    require(r.status == 2, "replacement: tag absent (proven)");
    (uint64[] memory adms, bytes32[] memory tgts, uint32 total) = reader.history(
      EfsIds.bindingKey(A, PURPOSE_FOLDER, MARKETS, NAME),
      0,
      10
    );
    require(total == 3 && adms.length == 3 && tgts[0] == FILE && tgts[1] == bytes32(0) && tgts[2] == FILE, "placement history");
  }

  // ---------------------------------------------------------------------------
  // rejections with pre/post read-back
  // ---------------------------------------------------------------------------

  function test_reject_wrongTypePair() public {
    bytes32[] memory refs = new bytes32[](1);
    refs[0] = ITEM_ETH; // an Item where a Pair is declared
    bytes memory b = recordBody(refs, quotePayload(2_500_000_000));
    Action[] memory acts = new Action[](1);
    acts[0] = recordAction(QUOTE_T, b);
    bytes[] memory bodies = new bytes[](1);
    bodies[0] = b;
    Intent memory it = intentOf(A, 1, acts);
    try ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it)) {
      revert("must reject");
    } catch (bytes memory err) {
      expectSel(err, Ledger.RefWrongType.selector, "RefWrongType");
    }
    (, uint64 adm, ) = Records.get(L(), EfsIds.recordId(QUOTE_T, keccak256(b)));
    require(adm == 0 && ledger.highWater() == 6, "no effect committed");
  }

  function test_reject_missingPair_noEffects() public {
    bytes32[] memory refs = new bytes32[](1);
    refs[0] = keccak256("no such pair");
    bytes memory b = recordBody(refs, quotePayload(2_500_000_000));
    Action[] memory acts = new Action[](2);
    acts[0] = subjectAction(A, SALT_F);
    acts[1] = recordAction(QUOTE_T, b);
    bytes[] memory bodies = new bytes[](2);
    bodies[1] = b;
    Intent memory it = intentOf(A, 1, acts);
    try ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it)) {
      revert("must reject");
    } catch (bytes memory err) {
      expectSel(err, Ledger.RefMissing.selector, "RefMissing");
    }
    (, , uint64 subjAdm) = Subjects.get(L(), EfsIds.subjectId(A, SALT_F));
    require(subjAdm == 0, "earlier action in the batch rolled back too (ordered prefix, whole revert)");
  }

  function test_reject_staleCas() public {
    _a1();
    (Intent memory it, bytes[] memory bodies) = _a2Intent();
    it.actions[1].expectedRevision = 0; // stale precondition
    try ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it)) {
      revert("must reject");
    } catch (bytes memory err) {
      expectSel(err, Ledger.StaleCas.selector, "StaleCas");
    }
    LensReader.Resolution memory r = reader.resolve(lensOne(A), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.target == QUOTE_A1 && r.revision == 1, "old head remains current at its own basis");
  }

  function test_reject_failedAcceptance_rollback() public {
    _a1();
    bytes memory b = quoteBody(PAIR, 0); // rule v1: mantissa must be non-zero -> acceptor reverts
    Action[] memory acts = new Action[](2);
    acts[0] = recordAction(QUOTE_T, b);
    acts[1] = bindAction(PURPOSE_HEAD, FILE, bytes32(0), EfsIds.recordId(QUOTE_T, keccak256(b)), 1);
    bytes[] memory bodies = new bytes[](2);
    bodies[0] = b;
    uint64 hw = ledger.highWater();
    Intent memory it = intentOf(A, 2, acts);
    try ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it)) {
      revert("must reject");
    } catch {}
    (, uint64 adm, ) = Records.get(L(), EfsIds.recordId(QUOTE_T, keccak256(b)));
    require(adm == 0 && ledger.highWater() == hw, "acceptance failure leaves no state");
    (, uint32 rev, ) = Bindings.get(L(), EfsIds.bindingKey(A, PURPOSE_HEAD, FILE, bytes32(0)));
    require(rev == 1, "head untouched");
  }

  function test_reject_failedIndex_rollback() public {
    _a1();
    bytes memory b = quoteBody(PAIR, 2_600_000_000);
    Action[] memory acts = new Action[](2);
    acts[0] = recordAction(QUOTE_T, b); // would be a fresh Record...
    acts[1] = bindAction(PURPOSE_TAG, FILE, POISON, TAG_ASSERT, 0); // ...but the index refuses this tag
    bytes[] memory bodies = new bytes[](2);
    bodies[0] = b;
    Intent memory it = intentOf(A, 2, acts);
    try ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it)) {
      revert("must reject");
    } catch (bytes memory err) {
      expectSel(err, IndexModule.IndexPoisoned.selector, "IndexPoisoned bubbles up");
    }
    (, uint64 adm, ) = Records.get(L(), EfsIds.recordId(QUOTE_T, keccak256(b)));
    require(adm == 0, "late index failure rolled the whole publication back");
    require(Occurrences.get(X(), EfsIds.recordId(QUOTE_T, keccak256(b))) == 0, "no partial index");
    require(Evidence.get(L(), EfsIds.publicationId(A, 2, keccak256(abi.encode(acts)))).firstAdmission == 0, "no evidence cell");
  }

  // ---------------------------------------------------------------------------
  // authorship closure
  // ---------------------------------------------------------------------------

  function test_signature_mutations_rejected_then_original_admitted() public {
    (Intent memory it, bytes[] memory bodies) = _a1Intent();
    Sig memory sig = signWith(PK_A, ledger, it);

    Intent memory m = _clone(it);
    m.actions[3].role = NAME2; // name
    _mustRejectSigned(m, bodies, sig, "name mutation");
    m = _clone(it);
    m.actions[2].target = PAIR; // target
    _mustRejectSigned(m, bodies, sig, "target mutation");
    m = _clone(it);
    m.actions[4].subject = PAIR; // subject
    _mustRejectSigned(m, bodies, sig, "subject mutation");
    m = _clone(it);
    m.actions[3].expectedRevision = 1; // CAS precondition
    _mustRejectSigned(m, bodies, sig, "expectedRevision mutation");
    m = _clone(it);
    (m.actions[3], m.actions[4]) = (m.actions[4], m.actions[3]); // order
    _mustRejectSigned(m, bodies, sig, "order mutation");
    m = _clone(it);
    m.actions[1].typeId = PAIR_T; // typeId
    _mustRejectSigned(m, bodies, sig, "typeId mutation");
    m = _clone(it);
    m.actions[1].digestKind = DIGEST_RECORD_ID; // discriminator
    _mustRejectSigned(m, bodies, sig, "digestKind mutation");
    // realm mutation: replay the same signed intent on a second Realm
    (, Ledger other, ) = _deployRealmWith(POISON);
    try other.publishSigned(it, bodies, sig) {
      revert("realm replay must fail");
    } catch (bytes memory err) {
      require(bytes4(err) == Ledger.AuthorMismatch.selector || bytes4(err) == Ledger.BadSignature.selector, "realm mutation");
    }
    require(ledger.highWater() == 6, "nothing admitted by any mutation");
    // the untouched original is valid
    ledger.publishSigned(it, bodies, sig);
    require(ledger.highWater() == 11, "original admitted");
  }

  function _clone(Intent memory it) internal pure returns (Intent memory c) {
    c.author = it.author;
    c.nonce = it.nonce;
    c.deadline = it.deadline;
    c.acceptanceProfile = it.acceptanceProfile;
    c.indexObligations = it.indexObligations;
    c.actions = new Action[](it.actions.length);
    for (uint256 i = 0; i < it.actions.length; i++) c.actions[i] = it.actions[i];
  }

  function _mustRejectSigned(Intent memory m, bytes[] memory bodies, Sig memory sig, string memory what) internal {
    try ledger.publishSigned(m, bodies, sig) {
      revert(what);
    } catch (bytes memory err) {
      require(bytes4(err) == Ledger.AuthorMismatch.selector || bytes4(err) == Ledger.BadSignature.selector, what);
    }
  }

  function test_exactRetry_alreadyAdmitted() public {
    _a1();
    (Intent memory it, bytes[] memory bodies) = _a1Intent();
    uint64 hw = ledger.highWater();
    try ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it)) {
      revert("retry must revert");
    } catch (bytes memory err) {
      expectSel(err, Ledger.AlreadyAdmitted.selector, "AlreadyAdmitted");
    }
    require(ledger.highWater() == hw && Occurrences.get(X(), QUOTE_A1) == 1, "retry created nothing");
  }

  function test_existingBody_byOtherAuthor_and_recordIdReuse() public {
    _a1();
    (, uint64 first, ) = Records.get(L(), QUOTE_A1);
    require(first != 0 && Occurrences.get(X(), QUOTE_A1) == 1, "pre: record present, one occurrence");
    // B publishes identical bytes: storage reused, authorship/admission/index new
    Action[] memory acts = new Action[](1);
    acts[0] = recordAction(QUOTE_T, quoteBody(PAIR, 2_500_000_000));
    bytes[] memory bodies = new bytes[](1);
    bodies[0] = quoteBody(PAIR, 2_500_000_000);
    (bytes32 pubB, uint64 admB) = producer.publish(ledger, intentOf(B, ++nonceB, acts), bodies);
    (, uint64 firstAfter, ) = Records.get(L(), QUOTE_A1);
    require(firstAfter == first, "firstAdmission unchanged (content reused)");
    require(Occurrences.get(X(), QUOTE_A1) == 2, "second occurrence counted");
    require(Evidence.get(L(), pubB).author == B && Admissions.get(L(), admB).publicationId == pubB, "new admission under B");
    // reuse by recordId with an empty body (digestKind = RECORD_ID)
    acts[0] = reuseAction(QUOTE_T, QUOTE_A1);
    producer.publish(ledger, intentOf(B, ++nonceB, acts), noBodies(1));
    require(Occurrences.get(X(), QUOTE_A1) == 3, "recordId reuse is a third occurrence");
    // reuse with the wrong Type is rejected
    acts[0] = reuseAction(PAIR_T, QUOTE_A1);
    try producer.publish(ledger, intentOf(B, nonceB + 1, acts), noBodies(1)) {
      revert("must reject");
    } catch (bytes memory err) {
      expectSel(err, Ledger.RefWrongType.selector, "reuse under a wrong Type");
    }
  }

  function test_spoofAuthorB_rejected() public {
    _a1();
    bytes memory b = quoteBody(PAIR, 2_501_000_000);
    Action[] memory acts = new Action[](1);
    acts[0] = recordAction(QUOTE_T, b);
    bytes[] memory bodies = new bytes[](1);
    bodies[0] = b;
    Intent memory it = intentOf(B, 1, acts); // claims AUTHOR_B
    try ledger.publishNative(it, bodies) {
      revert("test contract cannot claim B");
    } catch (bytes memory err) {
      expectSel(err, Ledger.AuthorMismatch.selector, "unrelated contract spoof");
    }
    try ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it)) {
      revert("EOA cannot claim B");
    } catch (bytes memory err) {
      expectSel(err, Ledger.AuthorMismatch.selector, "EOA spoof");
    }
    (, uint64 adm, ) = Records.get(L(), EfsIds.recordId(QUOTE_T, keccak256(b)));
    require(adm == 0, "no effect");
  }

  // ---------------------------------------------------------------------------
  // pre-seal check 2: SELF-CHECK reconstruction from public state. The reader decodes with
  // the candidate's table libraries and hashes with EfsIds.intentDigest, and the expected
  // digest uses the same encoder: this proves internal consistency of what is retained, not
  // independence. Oracle re-derivation from raw IStoreRead.getRecord bytes is owed.
  // ---------------------------------------------------------------------------

  function test_selfcheck_reconstruct_signature_from_state() public {
    bytes32 pubId = _a1();
    (Intent memory it, ) = _a1Intent();
    EvidenceReconstructor rec = new EvidenceReconstructor();
    (bytes32 digest, address signer, bytes32 ah, EvidenceData memory ev) = rec.reconstruct(L(), pubId);
    require(digest == digestOf(ledger, it), "self-check: digest from Admission rows + Evidence cell");
    require(signer == aAddr, "self-check: signer recovered from state");
    require(ah == keccak256(abi.encode(it.actions)), "self-check: actionsHash identical despite MUD's packed row layout");
    require(ev.realmId == ledger.realmId() && ev.coreCodeCommitment == address(ledger).codehash, "realm/code retained in the cell");
    require(ev.r != bytes32(0) && ev.s != bytes32(0), "signature bytes retained");
  }

  function test_selfcheck_reconstruct_flippedDiscriminator_changesDigest() public {
    bytes32 pubId = _a1();
    EvidenceReconstructor rec = new EvidenceReconstructor();
    (bytes32 digest, , , ) = rec.reconstruct(L(), pubId);
    bytes32 flipped = rec.reconstructFlipped(L(), pubId, 1);
    require(flipped != digest, "the bodyHash-vs-recordId discriminator is inside the signature");
  }

  // ---------------------------------------------------------------------------
  // pre-seal checks 1 and 3: origin-qualified ids and import
  // ---------------------------------------------------------------------------

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
      require(bytes4(err) == Ledger.AuthorMismatch.selector || bytes4(err) == Ledger.BadSignature.selector, "realm-bound");
    }
    // (b) import with an authorization the sender does not hold (EOA importer, native call)
    Intent memory auth = _authFor(EfsIds.eoaPrincipal(vm.addr(PK_I)), 1, pkt);
    try dst.importPublication(pkt, auth, Sig(0, bytes32(0), bytes32(0))) {
      revert("must reject");
    } catch (bytes memory err) {
      expectSel(err, Ledger.AuthorMismatch.selector, "authorization must be held");
    }
    // (c) authorization over a different packet
    Intent memory wrong = _authFor(EfsIds.eoaPrincipal(vm.addr(PK_I)), 1, pkt);
    wrong.actions[0].digest = keccak256("other packet");
    try dst.importPublication(pkt, wrong, signWith(PK_I, dst, wrong)) {
      revert("must reject");
    } catch (bytes memory err) {
      expectSel(err, Ledger.BadAuthorization.selector, "packet commitment mismatch");
    }
    (, , uint64 subjAdm) = Subjects.get(IStoreRead(address(dst)), FILE);
    require(subjAdm == 0 && dst.highWater() == 6, "nothing imported");
  }

  function _importA1Into(Ledger dst, bytes32 importer, uint64 nonce) internal returns (bytes32 srcId, bytes32 authId) {
    ImportPacket memory pkt = _packetOf(ledger, _pubIdA1());
    Intent memory auth = _authFor(importer, nonce, pkt);
    (srcId, authId) = dst.importPublication(pkt, auth, signWith(PK_I, dst, auth));
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
      expectSel(err, Ledger.AlreadyAdmitted.selector, "duplicate import");
    }
  }

  /// external so the duplicate import can be caught; only callable by this test contract.
  function reimport(Ledger dst, bytes32 importer) external {
    require(msg.sender == address(this), "self only");
    _importA1Into(dst, importer, 2);
  }

  function test_import_destinationRuleRejects_A2() public {
    _a1();
    bytes32 pub2 = _a2();
    (, Ledger dst, ) = _deployRealmWith(POISON);
    _seedInto(dst, address(new QuoteAcceptorV2())); // stricter destination rule, same typeId
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

  function _pubIdA1() internal view returns (bytes32) {
    (Intent memory it, ) = _a1Intent();
    return EfsIds.publicationId(A, 1, keccak256(abi.encode(it.actions)));
  }

  /// Deployment-bound identity (by design): the same contract + salt on two Ledger deployments — here on the
  /// same chain — yields two principals and two subject ids; a verified import keeps the original principal
  /// (test_import_preservesSubject_separatesAuthority); a NATIVE source cannot be imported at all.
  function test_twoRealms_sameContractAndSalt_differentSubject_nativeImportUnsupported() public {
    bytes32 salt = keccak256("S");
    Action[] memory acts = new Action[](1);
    acts[0] = subjectAction(B, salt);
    (bytes32 pubB, ) = producer.publish(ledger, intentOf(B, ++nonceB, acts), noBodies(1));
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
      expectSel(err, Ledger.UnsupportedSourceProof.selector, "UnsupportedSourceProof expected");
    }
    (, , uint64 adm) = Subjects.get(IStoreRead(address(r3)), s1);
    require(adm == 0, "no subject minted under the source principal");
    require(!_evidenceExists(r3, pubB), "no attributed evidence cell either");
  }

  function _evidenceExists(Ledger lg, bytes32 pubId) internal view returns (bool) {
    return Evidence.get(IStoreRead(address(lg)), pubId).author != bytes32(0);
  }

  /// BLOCKER regression: an importer forging a native-source packet that claims AUTHOR_B and rebinds B's head
  /// must be rejected before any write; B's head and every index row stay unchanged.
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
      expectSel(err, Ledger.UnsupportedSourceProof.selector, "UnsupportedSourceProof expected");
    }
    require(dst.highWater() == hw, "no admission");
    LensReader.Resolution memory r = rd2.resolve(lensOne(B), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.status == 2, "B has no head on the destination (absent proven), nothing was selected as FOUND");
    (, uint32 rev, ) = Bindings.get(IStoreRead(address(dst)), EfsIds.bindingKey(B, PURPOSE_HEAD, FILE, bytes32(0)));
    require(rev == 0, "B's binding untouched");
  }

  // ---------------------------------------------------------------------------
  // pre-seal check 4: cursor law, dedupe, coverage
  // ---------------------------------------------------------------------------

  function test_cursor_basisPinned_and_stale() public {
    _a1();
    _b1();
    LensReader.Page memory p1 = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 1);
    require(p1.items.length == 1 && p1.status == 2 && p1.next.position == 1 && p1.rawTotal == 2 && p1.selected == 1, "page one partial");
    uint64 basis = p1.next.basisAdmission;
    Action[] memory acts = new Action[](1);
    acts[0] = bindAction(PURPOSE_FOLDER, SWAPS, NAME2, FILE, 0); // admitted after the cursor's basis
    _publishA(acts, noBodies(1));
    LensReader.Page memory p2 = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, p1.next, 10);
    require(p2.next.basisAdmission == basis, "continuation stays at its basis");
    require(p2.items.length == 0 && p2.status == 1 && p2.rawTotal == 3, "later entry omitted; B's entry is a loser; complete");
    LensReader.Page memory fresh = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(fresh.items.length == 2, "a fresh listing includes the later entry");
    LensReader.Cursor memory stale = p1.next;
    stale.indexGeneration = 99;
    try reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, stale, 10) {
      revert("must revert");
    } catch (bytes memory err) {
      expectSel(err, LensReader.StaleCursor.selector, "stale generation");
    }
    try reader.list(_lensA(), PURPOSE_FOLDER, MARKETS, p1.next, 10) {
      revert("must revert");
    } catch (bytes memory err) {
      expectSel(err, LensReader.CursorMismatch.selector, "wrong scope");
    }
    require(p1.hydrated > 0 && p2.scanned == 2, "hydration and scan budgets are reported");
  }

  function test_dedupe_sameName_acrossAuthors() public {
    _a1();
    _b1();
    LensReader.Page memory p = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.rawTotal == 2 && p.scanned == 2 && p.items.length == 1 && p.items[0].selectedBy == A, "one selected entry per name");
    p = reader.list(_lensB(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].selectedBy == B, "the other lens selects the other author, still once");
  }

  function test_coverage_families() public view {
    (uint8 st, uint64 thr) = index.coverage(index.FAMILY_SCOPES(), bytes32(0));
    require(st == 1 && thr == ledger.highWater(), "mandatory: COMPLETE through high-water");
    (st, thr) = index.coverage(index.FAMILY_OPTIONAL_DIGEST(), bytes32(0));
    require(st == 2 && thr == 0, "declared optional family with no backfill: PARTIAL(0)");
    (st, ) = index.coverage(keccak256("never declared"), bytes32(0));
    require(st == 0, "undeclared family: UNKNOWN, never empty/complete");
  }

  function test_consumer_paidRead() public {
    _a1();
    _a2();
    _b1();
    QuoteConsumer c = new QuoteConsumer();
    (bytes32 rid, uint256 mantissa) = c.consume(reader, L(), _lensA(), FILE);
    require(rid == QUOTE_A2 && mantissa == 2_502_000_000, "A-first consumer value");
    (rid, mantissa) = c.consume(reader, L(), _lensB(), FILE);
    require(rid == QUOTE_B1 && mantissa == 2_501_000_000, "B-first consumer value");
    try c.consume(reader, L(), _lensEq(), FILE) {
      revert("conflict must not yield a quote");
    } catch (bytes memory err) {
      expectSel(err, QuoteConsumer.NotSelected.selector, "NotSelected(CONFLICT)");
    }
  }
}
