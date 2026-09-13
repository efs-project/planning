// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "../src/EfsTypes.sol";
import { LensReader } from "../src/LensReader.sol";
import { LabBase } from "./LabBase.sol";
import { Deploy } from "./Deploy.sol";
import { MeasurementConsumer } from "./MeasurementConsumer.sol";

contract MeasurementConsumerTest is LabBase {
  MeasurementConsumer internal consumer;

  function setUp() public {
    _boot(true);
    consumer = MeasurementConsumer(Deploy.deployArtifact("MeasurementConsumer.sol:MeasurementConsumer", ""));
  }

  function _lensA() internal view returns (LensReader.Lens memory) {
    return lensOf(A, B, 0);
  }

  function _expected(bytes32 recordId, uint256 mantissa) internal view returns (MeasurementConsumer.Expected memory e) {
    e.author = A;
    e.typeId = QUOTE_T;
    e.recordId = recordId;
    e.expectedRef = PAIR;
    e.payloadLength = 128;
    e.payloadHash = keccak256(quotePayload(mantissa));
  }

  function test_paidPoint_checksJoinedQuoteAndEvidence() public {
    _a1();
    _a2();
    (bytes32 commitment, bytes32 recordId) = consumer.paidPoint(
      reader,
      L(),
      _lensA(),
      PURPOSE_HEAD,
      FILE,
      bytes32(0),
      _expected(QUOTE_A2, 2_502_000_000)
    );
    require(recordId == QUOTE_A2 && commitment != bytes32(0), "joined point result committed");
  }

  function test_paidList_checksCompleteSelectionAndCursorBasis() public {
    _a1();
    _a2();
    _b1();
    (bytes32 commitment, bytes32 recordId, uint64 basis) = consumer.paidList(
      reader,
      L(),
      _lensA(),
      SWAPS,
      NAME,
      FILE,
      10,
      _expected(QUOTE_A2, 2_502_000_000)
    );
    require(recordId == QUOTE_A2 && commitment != bytes32(0), "joined list result committed");
    require(basis == ledger.highWater(), "list commitment uses current basis");
  }

  function test_rejectsWrongReference() public {
    _a1();
    MeasurementConsumer.Expected memory e = _expected(QUOTE_A1, 2_500_000_000);
    e.expectedRef = bytes32(uint256(1));
    try consumer.paidPoint(reader, L(), _lensA(), PURPOSE_HEAD, FILE, bytes32(0), e) {
      revert("wrong reference must fail");
    } catch (bytes memory err) {
      expectSel(err, MeasurementConsumer.WrongReference.selector, "wrong reference selector");
    }
  }

  function test_rejectsWrongAuthorEvidenceContext() public {
    _a1();
    MeasurementConsumer.Expected memory e = _expected(QUOTE_A1, 2_500_000_000);
    e.author = B;
    try consumer.paidPoint(reader, L(), _lensA(), PURPOSE_HEAD, FILE, bytes32(0), e) {
      revert("wrong author context must fail");
    } catch (bytes memory err) {
      expectSel(err, MeasurementConsumer.WrongAuthorContext.selector, "wrong author selector");
    }
  }

  function test_rejectsWrongPayloadLengthAndHash() public {
    _a1();
    MeasurementConsumer.Expected memory e = _expected(QUOTE_A1, 2_500_000_000);
    e.payloadLength = 127;
    try consumer.paidPoint(reader, L(), _lensA(), PURPOSE_HEAD, FILE, bytes32(0), e) {
      revert("wrong payload length must fail");
    } catch (bytes memory err) {
      expectSel(err, MeasurementConsumer.WrongPayloadLength.selector, "wrong length selector");
    }
    e = _expected(QUOTE_A1, 2_500_000_000);
    e.payloadHash = keccak256("wrong");
    try consumer.paidPoint(reader, L(), _lensA(), PURPOSE_HEAD, FILE, bytes32(0), e) {
      revert("wrong payload hash must fail");
    } catch (bytes memory err) {
      expectSel(err, MeasurementConsumer.WrongPayloadHash.selector, "wrong hash selector");
    }
  }

  function test_rejectsIncompleteListSelection() public {
    _a1();
    _b1();
    try consumer.paidList(reader, L(), _lensA(), SWAPS, NAME, FILE, 1, _expected(QUOTE_A1, 2_500_000_000)) {
      revert("partial list must fail");
    } catch (bytes memory err) {
      expectSel(err, MeasurementConsumer.IncompleteSelection.selector, "incomplete selector");
    }
  }
}
