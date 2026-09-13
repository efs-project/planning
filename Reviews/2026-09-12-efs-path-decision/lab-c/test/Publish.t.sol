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
import { QuoteAcceptorV2, EvidenceReconstructor } from "./Fixture.sol";

/*
 * sdk-fixture steps 1–4 and the rejection/authorship-closure rows (split from Fixture.t.sol for EIP-3860). Unrun.
 */

contract PublishTest is LabBase {
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
      expectSel(err, RefWrongType.selector, "RefWrongType");
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
      expectSel(err, RefMissing.selector, "RefMissing");
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
      expectSel(err, StaleCas.selector, "StaleCas");
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
      require(bytes4(err) == AuthorMismatch.selector || bytes4(err) == BadSignature.selector, "realm mutation");
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
      require(bytes4(err) == AuthorMismatch.selector || bytes4(err) == BadSignature.selector, what);
    }
  }
  function test_exactRetry_alreadyAdmitted() public {
    _a1();
    (Intent memory it, bytes[] memory bodies) = _a1Intent();
    uint64 hw = ledger.highWater();
    try ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it)) {
      revert("retry must revert");
    } catch (bytes memory err) {
      expectSel(err, AlreadyAdmitted.selector, "AlreadyAdmitted");
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
    (bytes32 pubB, uint64 admB) = producer.publish(ledger, intentOf(B, fx.nextNonceB(), acts), bodies);
    (, uint64 firstAfter, ) = Records.get(L(), QUOTE_A1);
    require(firstAfter == first, "firstAdmission unchanged (content reused)");
    require(Occurrences.get(X(), QUOTE_A1) == 2, "second occurrence counted");
    require(Evidence.get(L(), pubB).author == B && Admissions.get(L(), admB).publicationId == pubB, "new admission under B");
    // reuse by recordId with an empty body (digestKind = RECORD_ID)
    acts[0] = reuseAction(QUOTE_T, QUOTE_A1);
    producer.publish(ledger, intentOf(B, fx.nextNonceB(), acts), noBodies(1));
    require(Occurrences.get(X(), QUOTE_A1) == 3, "recordId reuse is a third occurrence");
    // reuse with the wrong Type is rejected
    acts[0] = reuseAction(PAIR_T, QUOTE_A1);
    try producer.publish(ledger, intentOf(B, fx.nonceB() + 1, acts), noBodies(1)) {
      revert("must reject");
    } catch (bytes memory err) {
      expectSel(err, RefWrongType.selector, "reuse under a wrong Type");
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
      expectSel(err, AuthorMismatch.selector, "unrelated contract spoof");
    }
    try ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it)) {
      revert("EOA cannot claim B");
    } catch (bytes memory err) {
      expectSel(err, AuthorMismatch.selector, "EOA spoof");
    }
    (, uint64 adm, ) = Records.get(L(), EfsIds.recordId(QUOTE_T, keccak256(b)));
    require(adm == 0, "no effect");
  }
}
