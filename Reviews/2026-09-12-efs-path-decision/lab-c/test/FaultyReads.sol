// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * TEST-ONLY forwarding reader. It implements exactly the consumer-local read ABI MeasurementConsumer uses
 * (ITableReads + ILensReads + ILedgerViews) on top of the real Ledger and LensReader and, when one fault is armed,
 * returns a corrupted or missing ACTUAL reply for that call while every other reply stays faithful. It exists so the
 * paid consumer's refusals are exercised against bad replies (the `test_faultyReads_*` controls), not only against
 * wrong expectations (the `test_sealed_refuses*` negatives). Not a Core change: Ledger and LensReader are untouched;
 * the consumer only had to call its readers through interface types instead of concrete contract types.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { EncodedLengths } from "@latticexyz/store/src/EncodedLengths.sol";
import { LensReader } from "../src/LensReader.sol";
import { ILensReads, ITableReads, ILedgerViews } from "./MeasurementConsumer.sol";

contract FaultyReads is ILensReads, ITableReads, ILedgerViews {
  uint8 public constant NONE = 0;
  uint8 public constant MISSING_RECORD = 1; // getRecord(Records, target) -> the absent-row reply (40 zero bytes, empty body)
  uint8 public constant WRONG_TYPE_RECORD = 2; // getRecord(Records, target) -> a foreign Type id in the static region
  uint8 public constant SHORT_ADMISSION = 3; // getRecord(Admissions, *) -> a 32-byte static region (decoding must fail closed)
  uint8 public constant SHORT_EVIDENCE = 4; // getRecord(Evidence, *) -> a 32-byte static region
  uint8 public constant PARTIAL_CLAIMS_COMPLETE = 5; // list(*) -> status COMPLETE while the scan stopped short of rawTotal

  bytes32 internal constant RECORDS_TABLE = 0x746265667300000000000000000000005265636f726473000000000000000000;
  bytes32 internal constant ADMISSIONS_TABLE = 0x7462656673000000000000000000000041646d697373696f6e73000000000000;
  bytes32 internal constant EVIDENCE_TABLE = 0x7462656673000000000000000000000045766964656e63650000000000000000;
  bytes32 public constant FOREIGN_TYPE = keccak256("faulty/not-that-type");

  IStoreRead public immutable realLedger;
  LensReader public immutable realReader;
  uint8 public mode;
  bytes32 public target;

  constructor(address ledger_, address reader_) {
    realLedger = IStoreRead(ledger_);
    realReader = LensReader(reader_);
  }

  function fault(uint8 mode_, bytes32 target_) external {
    mode = mode_;
    target = target_;
  }

  // ---- ITableReads ------------------------------------------------------------------------------------------
  function getRecord(
    bytes32 tableId,
    bytes32[] calldata keyTuple,
    bytes32 fieldLayout
  ) external view returns (bytes memory staticData, bytes32 encodedLengths, bytes memory dynamicData) {
    EncodedLengths lengths;
    (staticData, lengths, dynamicData) = realLedger.getRecord(ResourceId.wrap(tableId), keyTuple, FieldLayout.wrap(fieldLayout));
    encodedLengths = EncodedLengths.unwrap(lengths);
    if (tableId == RECORDS_TABLE && keyTuple.length == 1 && keyTuple[0] == target) {
      if (mode == MISSING_RECORD) return (new bytes(40), bytes32(0), new bytes(0));
      if (mode == WRONG_TYPE_RECORD) {
        bytes32 foreign = FOREIGN_TYPE;
        for (uint256 i = 0; i < 32 && i < staticData.length; i++) staticData[i] = foreign[i];
      }
    }
    if ((mode == SHORT_ADMISSION && tableId == ADMISSIONS_TABLE) || (mode == SHORT_EVIDENCE && tableId == EVIDENCE_TABLE)) {
      bytes memory cut = new bytes(32);
      for (uint256 i = 0; i < 32 && i < staticData.length; i++) cut[i] = staticData[i];
      staticData = cut;
    }
  }

  // ---- ILensReads (faithful except the armed page fault) -----------------------------------------------------
  function ledger() external view returns (address) {
    return address(this); // the consumer decodes rows through THIS reader: reader and table reads are one address
  }

  function index() external view returns (address) {
    return address(realReader.index());
  }

  function highWater() external view returns (uint64) {
    return realReader.highWater();
  }

  function resolve(
    LensReader.Lens calldata lens,
    bytes32 purpose,
    bytes32 subject,
    bytes32 role
  ) external view returns (LensReader.Resolution memory) {
    return realReader.resolve(lens, purpose, subject, role);
  }

  function resolveAt(
    LensReader.Lens calldata lens,
    bytes32 purpose,
    bytes32 subject,
    bytes32 role,
    uint64 basis
  ) external view returns (LensReader.Resolution memory) {
    return realReader.resolveAt(lens, purpose, subject, role, basis);
  }

  function list(
    LensReader.Lens calldata lens,
    bytes32 purpose,
    bytes32 scope,
    LensReader.Cursor calldata cursor,
    uint32 budget
  ) external view returns (LensReader.Page memory page) {
    page = realReader.list(lens, purpose, scope, cursor, budget);
    if (mode == PARTIAL_CLAIMS_COMPLETE) page.status = 1; // C_COMPLETE claimed while page.next.position < page.rawTotal
  }

  // ---- ILedgerViews (faithful) -----------------------------------------------------------------------------
  function realmId() external view returns (bytes32) {
    return ILedgerViews(address(realLedger)).realmId();
  }

  function coreCodeCommitment() external view returns (bytes32) {
    return ILedgerViews(address(realLedger)).coreCodeCommitment();
  }

  function rulesEpoch() external view returns (uint32) {
    return ILedgerViews(address(realLedger)).rulesEpoch();
  }
}
