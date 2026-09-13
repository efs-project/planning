// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../src/EfsTypes.sol";
import { LensReader } from "../src/LensReader.sol";
import { LabBase } from "./LabBase.sol";
import { Deploy } from "./Deploy.sol";
import { MeasurementConsumer, ILensReads, ITableReads } from "./MeasurementConsumer.sol";
import { MeasurementFixture } from "./MeasurementFixture.sol";
import { FaultyReads } from "./FaultyReads.sol";

/*
 * Three suites (split for EIP-170/EIP-3860 on the test side):
 *  - MeasurementFramedTest: the framed c32 diagnostic surface (paidPointFramed / paidListFramed), unchanged checks.
 *  - MeasurementSealedTest: the sealed paid point/list slice (sdk-fixture appendix) against the measurement-local
 *    one-placement fixture (A1 with placement, A2 CAS, B1 head-only), plus the negatives that refuse the corresponding
 *    successful result as WRONG EXPECTATIONS; the broader FixtureSeeder.b1() (second placement) is the extra-placement
 *    negative and is not altered.
 *  - MeasurementFaultyReadsTest: bounded public-ABI controls where the ACTUAL replies are malformed or missing
 *    (test/FaultyReads.sol), named distinctly from the wrong-expectation negatives.
 */

abstract contract MeasurementBase is LabBase {
  MeasurementConsumer internal consumer;
  MeasurementFixture internal fixture;
  bytes32 internal pubA1;
  bytes32 internal pubA2;
  bytes32 internal pubB1;

  function _bootMeasurement() internal {
    _boot(true);
    consumer = MeasurementConsumer(Deploy.deployArtifact("MeasurementConsumer.sol:MeasurementConsumer", ""));
    fixture = MeasurementFixture(Deploy.deployArtifact("MeasurementFixture.sol:MeasurementFixture", abi.encode(address(seeder))));
  }

  function _lensA() internal view returns (LensReader.Lens memory) {
    return lensOf(A, B, 0);
  }

  function _lensB() internal view returns (LensReader.Lens memory) {
    return lensOf(B, A, 0);
  }

  function _rd() internal view returns (ILensReads) {
    return ILensReads(address(reader));
  }

  function _lg() internal view returns (ITableReads) {
    return ITableReads(address(ledger));
  }

  /// The sealed post-B1 state of the slice: A1 (with the one placement), A2 (CAS), B1 head-only. Returns the basis.
  function _sealed() internal returns (uint64) {
    pubA1 = _a1();
    pubA2 = _a2();
    pubB1 = fixture.b1HeadOnly();
    return ledger.highWater();
  }

  function _expectA(uint64 basis) internal view returns (MeasurementConsumer.Expect memory e) {
    e.subject = FILE;
    e.expectedHead = QUOTE_A2;
    e.selectedRevision = 2;
    e.selectedAuthor = A;
    e.selectedProofKind = PROOF_EOA_SIG;
    e.quoteType = QUOTE_T;
    e.pairType = PAIR_T;
    e.itemType = ITEM_T;
    e.pairId = PAIR;
    e.itemA = ITEM_ETH;
    e.itemB = ITEM_USDC;
    e.mantissa = 2_502_000_000;
    e.scale = 6;
    e.observedAt = 1_800_000_000;
    e.noteCommitment = builders.NOTE();
    e.basisAdmission = basis;
  }

  function _expectB(uint64 basis) internal view returns (MeasurementConsumer.Expect memory e) {
    e = _expectA(basis);
    e.expectedHead = QUOTE_B1;
    e.selectedRevision = 1;
    e.selectedAuthor = B;
    e.selectedProofKind = PROOF_NATIVE;
    e.mantissa = 2_501_000_000;
  }

  function _placement() internal view returns (MeasurementConsumer.PlacementExpect memory p) {
    p.folder = SWAPS;
    p.name = NAME;
    p.actor = A;
    p.proofKind = PROOF_EOA_SIG;
    p.publicationId = _pubIdA1();
    p.revision = 1;
    p.budget = 10;
  }

  function _refusesPoint(
    ILensReads rd,
    ITableReads lg,
    LensReader.Lens memory lens,
    MeasurementConsumer.Expect memory e,
    bytes4 sel,
    string memory what
  ) internal {
    try consumer.paidPoint(rd, lg, lens, e) {
      revert(what);
    } catch (bytes memory err) {
      expectSel(err, sel, what);
    }
  }

  function _refusesList(
    ILensReads rd,
    ITableReads lg,
    LensReader.Lens memory lens,
    MeasurementConsumer.Expect memory e,
    MeasurementConsumer.PlacementExpect memory p,
    bytes4 sel,
    string memory what
  ) internal {
    try consumer.paidList(rd, lg, lens, e, p) {
      revert(what);
    } catch (bytes memory err) {
      expectSel(err, sel, what);
    }
  }

  function _same(MeasurementConsumer.Selection memory x, MeasurementConsumer.Selection memory y) internal pure returns (bool) {
    return keccak256(abi.encode(x)) == keccak256(abi.encode(y));
  }
}

contract MeasurementFramedTest is MeasurementBase {
  function setUp() public {
    _bootMeasurement();
  }

  function _expected(bytes32 recordId, uint256 mantissa) internal view returns (MeasurementConsumer.FramedExpected memory e) {
    e.author = A;
    e.typeId = QUOTE_T;
    e.recordId = recordId;
    e.expectedRef = PAIR;
    e.payloadLength = 128;
    e.payloadHash = keccak256(quotePayload(mantissa));
  }

  function test_paidPointFramed_checksJoinedQuoteAndEvidence() public {
    _a1();
    _a2();
    (bytes32 commitment, bytes32 recordId) = consumer.paidPointFramed(_rd(), _lg(), _lensA(), PURPOSE_HEAD, FILE, bytes32(0), _expected(QUOTE_A2, 2_502_000_000));
    require(recordId == QUOTE_A2 && commitment != bytes32(0), "joined point result committed");
  }

  function test_paidListFramed_checksCompleteSelectionAndCursorBasis() public {
    _a1();
    _a2();
    _b1();
    (bytes32 commitment, bytes32 recordId, uint64 basis) = consumer.paidListFramed(_rd(), _lg(), _lensA(), SWAPS, NAME, FILE, 10, _expected(QUOTE_A2, 2_502_000_000));
    require(recordId == QUOTE_A2 && commitment != bytes32(0), "joined list result committed");
    require(basis == ledger.highWater(), "list commitment uses current basis");
  }

  function test_framed_rejectsWrongReference() public {
    _a1();
    MeasurementConsumer.FramedExpected memory e = _expected(QUOTE_A1, 2_500_000_000);
    e.expectedRef = bytes32(uint256(1));
    try consumer.paidPointFramed(_rd(), _lg(), _lensA(), PURPOSE_HEAD, FILE, bytes32(0), e) {
      revert("wrong reference must fail");
    } catch (bytes memory err) {
      expectSel(err, MeasurementConsumer.WrongReference.selector, "wrong reference selector");
    }
  }

  function test_framed_rejectsWrongAuthorEvidenceContext() public {
    _a1();
    MeasurementConsumer.FramedExpected memory e = _expected(QUOTE_A1, 2_500_000_000);
    e.author = B;
    try consumer.paidPointFramed(_rd(), _lg(), _lensA(), PURPOSE_HEAD, FILE, bytes32(0), e) {
      revert("wrong author context must fail");
    } catch (bytes memory err) {
      expectSel(err, MeasurementConsumer.WrongAuthorContext.selector, "wrong author selector");
    }
  }

  function test_framed_rejectsWrongPayloadLengthAndHash() public {
    _a1();
    MeasurementConsumer.FramedExpected memory e = _expected(QUOTE_A1, 2_500_000_000);
    e.payloadLength = 127;
    try consumer.paidPointFramed(_rd(), _lg(), _lensA(), PURPOSE_HEAD, FILE, bytes32(0), e) {
      revert("wrong payload length must fail");
    } catch (bytes memory err) {
      expectSel(err, MeasurementConsumer.WrongPayloadLength.selector, "wrong length selector");
    }
    e = _expected(QUOTE_A1, 2_500_000_000);
    e.payloadHash = keccak256("wrong");
    try consumer.paidPointFramed(_rd(), _lg(), _lensA(), PURPOSE_HEAD, FILE, bytes32(0), e) {
      revert("wrong payload hash must fail");
    } catch (bytes memory err) {
      expectSel(err, MeasurementConsumer.WrongPayloadHash.selector, "wrong hash selector");
    }
  }

  function test_framed_rejectsIncompleteListSelection() public {
    _a1();
    _b1();
    try consumer.paidListFramed(_rd(), _lg(), _lensA(), SWAPS, NAME, FILE, 1, _expected(QUOTE_A1, 2_500_000_000)) {
      revert("partial list must fail");
    } catch (bytes memory err) {
      expectSel(err, MeasurementConsumer.IncompleteSelection.selector, "incomplete selector");
    }
  }
}

contract MeasurementSealedTest is MeasurementBase {
  function setUp() public {
    _bootMeasurement();
  }

  // ---- positive one-placement flow --------------------------------------------------------------------------

  function test_sealed_aFirst_pointAndListAgreeOnA2_overTheOnePlacement() public {
    uint64 basis = _sealed();
    (bytes32 c1, MeasurementConsumer.Selection memory sp) = consumer.paidPoint(_rd(), _lg(), _lensA(), _expectA(basis));
    (bytes32 c2, MeasurementConsumer.Selection memory sl, MeasurementConsumer.Placement memory pl) = consumer.paidList(
      _rd(),
      _lg(),
      _lensA(),
      _expectA(basis),
      _placement()
    );
    require(c1 != bytes32(0) && c2 != bytes32(0) && c1 != c2, "commitments");
    require(sp.selectedHead == QUOTE_A2 && sp.selectedAuthor == A && sp.selectedRevision == 2 && sp.selectedProofKind == PROOF_EOA_SIG, "A-first selects A2 signed by A");
    require(sp.pairId == PAIR && sp.itemA == ITEM_ETH && sp.itemB == ITEM_USDC && sp.mantissa == 2_502_000_000 && sp.scale == 6, "Quote -> Pair -> Items closure");
    require(sp.observedAt == 1_800_000_000 && sp.note == builders.NOTE() && sp.selectedSourceGrade == 0, "exact fixture fields, native at source");
    require(sp.basisAdmission == basis && sl.basisAdmission == basis && pl.basisAdmission == basis, "one arm-local basis");
    require(sp.selectedPublication == pubA2 && pubA1 == _pubIdA1(), "the head was admitted by the A2 publication");
    require(_same(sp, sl), "point and list observe the identical A2 selection");
    require(pl.rawTotal == 1 && pl.scanned == 1 && pl.selected == 1 && pl.endPosition == 1 && pl.ended && pl.pageStatus == 1, "one COMPLETE window with its end condition");
    require(pl.folder == SWAPS && pl.name == NAME && pl.target == FILE && pl.actor == A && pl.revision == 1, "the one A placement");
    require(pl.publicationId == pubA1 && pl.proofKind == PROOF_EOA_SIG && pl.sourceGrade == 0, "sourceStep A1 / AUTHOR_A / EOA-signed effect");
    require(pl.coverageStatus == 1 && pl.coverageThrough == basis, "mandatory scope coverage through the basis");
  }

  function test_sealed_bFirst_selectsB1_whilePlacementProvenanceStaysA1() public {
    uint64 basis = _sealed();
    (, MeasurementConsumer.Selection memory sp) = consumer.paidPoint(_rd(), _lg(), _lensB(), _expectB(basis));
    (, MeasurementConsumer.Selection memory sl, MeasurementConsumer.Placement memory pl) = consumer.paidList(_rd(), _lg(), _lensB(), _expectB(basis), _placement());
    require(sp.selectedHead == QUOTE_B1 && sp.selectedAuthor == B && sp.selectedRevision == 1 && sp.selectedProofKind == PROOF_NATIVE, "B-first selects B1 natively");
    require(sp.mantissa == 2_501_000_000 && sp.pairId == PAIR && sp.itemA == ITEM_ETH && sp.itemB == ITEM_USDC, "same closure");
    require(_same(sp, sl) && sp.selectedPublication == pubB1, "point and list observe the identical B1 selection");
    require(pl.actor == A && pl.actor != sl.selectedAuthor && pl.proofKind == PROOF_EOA_SIG && pl.publicationId == pubA1, "placement provenance is the A1 effect, separate from B's content authorship");
    require(pl.rawTotal == 1 && pl.scanned == 1 && pl.selected == 1 && pl.ended && pl.pageStatus == 1 && pl.target == FILE && pl.revision == 1, "one complete window");
  }

  // ---- negatives: wrong EXPECTATIONS refuse the corresponding successful result --------------------------------

  function test_sealed_refusesWrongOrMissingPair() public {
    uint64 basis = _sealed();
    MeasurementConsumer.Expect memory e = _expectA(basis);
    e.pairId = keccak256("a pair that is not referenced");
    _refusesPoint(_rd(), _lg(), _lensA(), e, MeasurementConsumer.ClosureMismatch.selector, "wrong pair id");
    e = _expectA(basis);
    e.pairType = keccak256("another exact type");
    _refusesList(_rd(), _lg(), _lensA(), e, _placement(), MeasurementConsumer.WrongType.selector, "wrong pair type");
  }

  function test_sealed_refusesWrongOrMissingItem() public {
    uint64 basis = _sealed();
    MeasurementConsumer.Expect memory e = _expectB(basis);
    e.itemB = keccak256("an item that is not referenced");
    _refusesPoint(_rd(), _lg(), _lensB(), e, MeasurementConsumer.ClosureMismatch.selector, "wrong item id");
    e = _expectB(basis);
    e.itemA = ITEM_USDC;
    e.itemB = ITEM_ETH;
    _refusesPoint(_rd(), _lg(), _lensB(), e, MeasurementConsumer.ClosureMismatch.selector, "item order matters");
    e = _expectB(basis);
    e.itemType = keccak256("another exact type");
    _refusesList(_rd(), _lg(), _lensB(), e, _placement(), MeasurementConsumer.WrongType.selector, "wrong item type");
  }

  function test_sealed_refusesWrongAuthorOrProofCategory() public {
    uint64 basis = _sealed();
    MeasurementConsumer.Expect memory e = _expectA(basis);
    e.selectedAuthor = B;
    _refusesPoint(_rd(), _lg(), _lensA(), e, MeasurementConsumer.SelectionMismatch.selector, "wrong selected author");
    e = _expectA(basis);
    e.selectedProofKind = PROOF_NATIVE;
    _refusesList(_rd(), _lg(), _lensA(), e, _placement(), MeasurementConsumer.ProofCategory.selector, "A2 is EOA-signed, not contract-originated");
    e = _expectB(basis);
    e.selectedProofKind = PROOF_EOA_SIG;
    _refusesPoint(_rd(), _lg(), _lensB(), e, MeasurementConsumer.ProofCategory.selector, "B1 is contract-originated, not EOA-signed");
    MeasurementConsumer.PlacementExpect memory p = _placement();
    p.actor = B;
    p.proofKind = PROOF_NATIVE;
    _refusesList(_rd(), _lg(), _lensB(), _expectB(basis), p, MeasurementConsumer.PlacementMismatch.selector, "the selected author is never laundered into placement provenance");
    p = _placement();
    p.proofKind = PROOF_NATIVE;
    _refusesList(_rd(), _lg(), _lensA(), _expectA(basis), p, MeasurementConsumer.ProofCategory.selector, "wrong placement proof category");
  }

  function test_sealed_refusesWrongHeadRevisionOrQuoteFields() public {
    uint64 basis = _sealed();
    MeasurementConsumer.Expect memory e = _expectA(basis);
    e.expectedHead = QUOTE_A1;
    _refusesPoint(_rd(), _lg(), _lensA(), e, MeasurementConsumer.SelectionMismatch.selector, "A1 is history, not the head");
    e = _expectA(basis);
    e.selectedRevision = 1;
    _refusesPoint(_rd(), _lg(), _lensA(), e, MeasurementConsumer.SelectionMismatch.selector, "A2 is revision 2");
    e = _expectA(basis);
    e.mantissa = 2_500_000_000;
    _refusesPoint(_rd(), _lg(), _lensA(), e, MeasurementConsumer.ClosureMismatch.selector, "wrong mantissa");
    e = _expectA(basis);
    e.observedAt = 1;
    _refusesList(_rd(), _lg(), _lensA(), e, _placement(), MeasurementConsumer.ClosureMismatch.selector, "wrong observedAt");
    e = _expectA(basis);
    e.noteCommitment = keccak256("another note");
    _refusesPoint(_rd(), _lg(), _lensA(), e, MeasurementConsumer.ClosureMismatch.selector, "wrong note commitment");
    e = _expectA(basis);
    e.scale = 8;
    _refusesPoint(_rd(), _lg(), _lensA(), e, MeasurementConsumer.ClosureMismatch.selector, "wrong scale");
    e = _expectA(basis);
    e.quoteType = PAIR_T;
    _refusesPoint(_rd(), _lg(), _lensA(), e, MeasurementConsumer.WrongType.selector, "wrong quote type");
  }

  function test_sealed_refusesSecondPlacement_pointUnaffected() public {
    _a1();
    _a2();
    _b1(); // the broader fixture: B binds its OWN /swaps placement too (two raw scope entries)
    uint64 basis = ledger.highWater();
    _refusesList(_rd(), _lg(), _lensA(), _expectA(basis), _placement(), MeasurementConsumer.PlacementWindow.selector, "a second placement refuses the one-row window");
    _refusesList(_rd(), _lg(), _lensB(), _expectB(basis), _placement(), MeasurementConsumer.PlacementWindow.selector, "under B-first too");
    (, MeasurementConsumer.Selection memory sp) = consumer.paidPoint(_rd(), _lg(), _lensA(), _expectA(basis));
    require(sp.selectedHead == QUOTE_A2, "a File-keyed point read performs no directory lookup");
  }

  function test_sealed_refusesMixedBases() public {
    uint64 basis = _sealed();
    MeasurementConsumer.Expect memory e = _expectA(basis);
    e.basisAdmission = basis - 1;
    _refusesPoint(_rd(), _lg(), _lensA(), e, MeasurementConsumer.BasisMismatch.selector, "an older basis than the frontier");
    _refusesList(_rd(), _lg(), _lensA(), e, _placement(), MeasurementConsumer.BasisMismatch.selector, "list at an older basis");
    Action[] memory acts = new Action[](1);
    acts[0] = bindAction(PURPOSE_TAG, FILE, keccak256("later"), TAG_ASSERT, 0); // the frontier moves past the sealed basis
    _publishA(acts, noBodies(1));
    _refusesPoint(_rd(), _lg(), _lensA(), _expectA(basis), MeasurementConsumer.BasisMismatch.selector, "the sealed basis no longer matches");
    _refusesList(_rd(), _lg(), _lensA(), _expectA(basis), _placement(), MeasurementConsumer.BasisMismatch.selector, "list after the frontier moved");
  }

  function test_sealed_refusesIncompleteCoverage() public {
    uint64 basis = _sealed();
    MeasurementConsumer.PlacementExpect memory p = _placement();
    p.budget = 0; // PARTIAL page: the scan never reaches rawTotal
    _refusesList(_rd(), _lg(), _lensA(), _expectA(basis), p, MeasurementConsumer.PlacementWindow.selector, "a partial window is not an empty complete page");
  }

  function test_sealed_refusesPointListDisagreement() public {
    uint64 basis = _sealed();
    (, MeasurementConsumer.Selection memory sp) = consumer.paidPoint(_rd(), _lg(), _lensA(), _expectA(basis));
    require(sp.selectedHead == QUOTE_A2, "the point establishes A2 under A-first");
    _refusesList(_rd(), _lg(), _lensA(), _expectB(basis), _placement(), MeasurementConsumer.SelectionMismatch.selector, "a list expecting B1 under the same lens disagrees with the point");
    _refusesPoint(_rd(), _lg(), _lensB(), _expectA(basis), MeasurementConsumer.SelectionMismatch.selector, "a point expecting A2 under B-first disagrees with the B-first list");
  }

  function test_sealed_refusesWrongPlacementCoordinateRevisionOrPublication() public {
    uint64 basis = _sealed();
    MeasurementConsumer.PlacementExpect memory p = _placement();
    p.name = NAME2;
    _refusesList(_rd(), _lg(), _lensA(), _expectA(basis), p, MeasurementConsumer.PlacementMismatch.selector, "wrong name");
    p = _placement();
    p.revision = 2;
    _refusesList(_rd(), _lg(), _lensA(), _expectA(basis), p, MeasurementConsumer.PlacementMismatch.selector, "wrong placement revision");
    p = _placement();
    p.publicationId = keccak256("another publication");
    _refusesList(_rd(), _lg(), _lensA(), _expectA(basis), p, MeasurementConsumer.PlacementMismatch.selector, "wrong source publication");
    p = _placement();
    p.folder = MARKETS;
    _refusesList(_rd(), _lg(), _lensA(), _expectA(basis), p, MeasurementConsumer.PlacementWindow.selector, "an empty folder has no placement row");
  }
}

contract MeasurementFaultyReadsTest is MeasurementBase {
  FaultyReads internal faulty;

  function setUp() public {
    _bootMeasurement();
    faulty = FaultyReads(Deploy.deployArtifact("FaultyReads.sol:FaultyReads", abi.encode(address(ledger), address(reader))));
  }

  function _fr() internal view returns (ILensReads) {
    return ILensReads(address(faulty));
  }

  function _ft() internal view returns (ITableReads) {
    return ITableReads(address(faulty));
  }

  function test_faultyReads_faithfulForwardingMatchesTheRealReaders() public {
    uint64 basis = _sealed();
    (bytes32 real, MeasurementConsumer.Selection memory sr) = consumer.paidPoint(_rd(), _lg(), _lensB(), _expectB(basis));
    (bytes32 forwarded, MeasurementConsumer.Selection memory sf) = consumer.paidPoint(_fr(), _ft(), _lensB(), _expectB(basis));
    require(real == forwarded && _same(sr, sf), "the unarmed forwarding reader reproduces the real result");
    (bytes32 realList, , ) = consumer.paidList(_rd(), _lg(), _lensA(), _expectA(basis), _placement());
    (bytes32 forwardedList, , ) = consumer.paidList(_fr(), _ft(), _lensA(), _expectA(basis), _placement());
    require(realList == forwardedList, "list too");
  }

  function test_faultyReads_missingPairRecordRefused() public {
    uint64 basis = _sealed();
    faulty.fault(faulty.MISSING_RECORD(), PAIR);
    _refusesPoint(_fr(), _ft(), _lensA(), _expectA(basis), MeasurementConsumer.RecordAbsent.selector, "an absent Pair row is refused, not reported valid");
    _refusesList(_fr(), _ft(), _lensA(), _expectA(basis), _placement(), MeasurementConsumer.RecordAbsent.selector, "list too");
  }

  function test_faultyReads_wrongTypeItemRefused() public {
    uint64 basis = _sealed();
    faulty.fault(faulty.WRONG_TYPE_RECORD(), ITEM_USDC);
    _refusesPoint(_fr(), _ft(), _lensB(), _expectB(basis), MeasurementConsumer.WrongType.selector, "a wrong-Type Item is refused");
    _refusesList(_fr(), _ft(), _lensB(), _expectB(basis), _placement(), MeasurementConsumer.WrongType.selector, "list too");
  }

  function test_faultyReads_malformedAdmissionReplyRefused() public {
    uint64 basis = _sealed();
    faulty.fault(faulty.SHORT_ADMISSION(), bytes32(0));
    _refusesPoint(_fr(), _ft(), _lensA(), _expectA(basis), MeasurementConsumer.MalformedAdmission.selector, "a short Admissions region fails closed");
  }

  function test_faultyReads_malformedEvidenceReplyRefused() public {
    uint64 basis = _sealed();
    faulty.fault(faulty.SHORT_EVIDENCE(), bytes32(0));
    _refusesPoint(_fr(), _ft(), _lensA(), _expectA(basis), MeasurementConsumer.MalformedEvidence.selector, "a short Evidence region fails closed");
    _refusesList(_fr(), _ft(), _lensA(), _expectA(basis), _placement(), MeasurementConsumer.MalformedEvidence.selector, "list too");
  }

  function test_faultyReads_partialPageClaimingCompleteRefused() public {
    uint64 basis = _sealed();
    faulty.fault(faulty.PARTIAL_CLAIMS_COMPLETE(), bytes32(0));
    MeasurementConsumer.PlacementExpect memory p = _placement();
    p.budget = 0; // the page says COMPLETE, but its end condition (position == rawTotal == scanned) is false
    _refusesList(_fr(), _ft(), _lensA(), _expectA(basis), p, MeasurementConsumer.PlacementWindow.selector, "a PARTIAL page claiming COMPLETE is refused by the end condition");
  }
}
