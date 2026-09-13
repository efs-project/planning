// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * TEST-ONLY forwarding reader. It implements exactly the consumer-local read ABI MeasurementConsumer uses
 * (ITableReads + ILensReads + ILedgerViews) on top of the real Ledger and LensReader and, when one fault is armed,
 * returns a corrupted or missing ACTUAL reply for that call while every other reply stays faithful. It exists so the
 * paid consumer's refusals are exercised against bad replies (the `test_faulty*` controls), not only against wrong
 * expectations (the `test_sealed_refuses*` negatives). Not a Core change: Ledger and LensReader are untouched; the
 * consumer only had to call its readers through interface types instead of concrete contract types.
 * One fault at a time; `target` scopes the record faults to one Records key or names the laundered principal.
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
  uint8 public constant PARTIAL_CLAIMS_COMPLETE = 5; // list(*) -> status COMPLETE while the cursor says the scan never reached rawTotal (next.position = 0)
  uint8 public constant LAUNDERED_SELECTED_BY = 6; // resolveAt / list report selectedBy = `target` (the other principal); key, revision and admission kept
  uint8 public constant EVIDENCE_OUT_OF_RANGE = 7; // getRecord(Evidence, *) -> firstAdmission (@210) low byte forced to 0xff: the admission falls outside the range
  uint8 public constant ADMISSION_WRONG_TARGET = 8; // getRecord(Admissions, *) -> target (@194) replaced by a foreign word
  uint8 public constant PROOF_SHAPE = 9; // getRecord(Evidence, *) -> v (@97) = 0 and r (@33) nonzero: neither the native nor the EOA-signed shape
  uint8 public constant REALM_MISMATCH = 10; // getRecord(Evidence, *) -> realmId (@228) replaced by a foreign word
  uint8 public constant NOT_AT_BASIS = 11; // resolveAt reports admission = type(uint64).max (past the pinned basis)
  uint8 public constant MALFORMED_FRAME = 12; // getRecord(Records, target) -> the body gains a trailing byte: it decodes but no longer re-encodes to itself
  uint8 public constant SHORT_RECORD = 13; // getRecord(Records, target) -> a 32-byte static region
  uint8 public constant LEDGER_MISMATCH = 14; // ledger() names the real Ledger instead of this reader

  bytes32 internal constant RECORDS_TABLE = 0x746265667300000000000000000000005265636f726473000000000000000000;
  bytes32 internal constant ADMISSIONS_TABLE = 0x7462656673000000000000000000000041646d697373696f6e73000000000000;
  bytes32 internal constant EVIDENCE_TABLE = 0x7462656673000000000000000000000045766964656e63650000000000000000;
  bytes32 public constant FOREIGN_TYPE = keccak256("faulty/not-that-type");
  bytes32 public constant FOREIGN_WORD = keccak256("faulty/foreign-word");

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
      if (mode == WRONG_TYPE_RECORD) _patchWord(staticData, 0, FOREIGN_TYPE);
      if (mode == MALFORMED_FRAME) dynamicData = abi.encodePacked(dynamicData, bytes1(0));
      if (mode == SHORT_RECORD) staticData = _cut(staticData, 32);
    }
    if (tableId == ADMISSIONS_TABLE) {
      if (mode == SHORT_ADMISSION) staticData = _cut(staticData, 32);
      if (mode == ADMISSION_WRONG_TARGET) _patchWord(staticData, 194, FOREIGN_WORD);
    }
    if (tableId == EVIDENCE_TABLE) {
      if (mode == SHORT_EVIDENCE) staticData = _cut(staticData, 32);
      if (mode == EVIDENCE_OUT_OF_RANGE && staticData.length > 217) staticData[217] = bytes1(0xff);
      if (mode == PROOF_SHAPE && staticData.length > 97) {
        staticData[97] = bytes1(0);
        _patchWord(staticData, 33, FOREIGN_WORD);
      }
      if (mode == REALM_MISMATCH) _patchWord(staticData, 228, FOREIGN_WORD);
    }
  }

  function _patchWord(bytes memory b, uint256 offset, bytes32 word) internal pure {
    for (uint256 i = 0; i < 32 && offset + i < b.length; i++) b[offset + i] = word[i];
  }

  function _cut(bytes memory b, uint256 n) internal pure returns (bytes memory cut) {
    cut = new bytes(n);
    for (uint256 i = 0; i < n && i < b.length; i++) cut[i] = b[i];
  }

  // ---- ILensReads (faithful except the armed fault) ---------------------------------------------------------
  function ledger() external view returns (address) {
    return mode == LEDGER_MISMATCH ? address(realLedger) : address(this); // the consumer decodes rows through THIS reader
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
  ) external view returns (LensReader.Resolution memory r) {
    r = realReader.resolveAt(lens, purpose, subject, role, basis);
    if (mode == LAUNDERED_SELECTED_BY && r.status == 1) r.selectedBy = target;
    if (mode == NOT_AT_BASIS && r.status == 1) r.admission = type(uint64).max;
  }

  function list(
    LensReader.Lens calldata lens,
    bytes32 purpose,
    bytes32 scope,
    LensReader.Cursor calldata cursor,
    uint32 budget
  ) external view returns (LensReader.Page memory page) {
    page = realReader.list(lens, purpose, scope, cursor, budget);
    if (mode == PARTIAL_CLAIMS_COMPLETE) {
      page.status = 1; // C_COMPLETE claimed ...
      page.next.position = 0; // ... while the cursor says the scan consumed nothing (items and scanned kept intact)
    }
    if (mode == LAUNDERED_SELECTED_BY) {
      for (uint256 i = 0; i < page.items.length; i++) page.items[i].selectedBy = target;
    }
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
