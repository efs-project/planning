// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Finding 1: every IStoreWrite / IStoreRegistration selector must be unreachable on both
 * Stores, with VALID arguments (so an accidental implementation would have executed),
 * and post-state must prove nothing landed. Also: the IndexModule's writer is only the
 * Ledger, attach is one-shot, and IStoreRead positively works.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { Schema } from "@latticexyz/store/src/Schema.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import "../src/EfsTypes.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { Records } from "../src/tables/LedgerTables.sol";
import { Occurrences } from "../src/tables/IndexTables.sol";
import { LabBase } from "./LabBase.sol";

contract RawWriteDenialTest is LabBase {
  bytes32 constant RECORDS = 0x746265667300000000000000000000005265636f726473000000000000000000;
  bytes32 constant RECORDS_LAYOUT = 0x0028020120080000000000000000000000000000000000000000000000000000;
  bytes32 constant OCCURRENCES = 0x746265667369647800000000000000004f6363757272656e6365730000000000;
  bytes32 constant OCCURRENCES_LAYOUT = 0x0004010004000000000000000000000000000000000000000000000000000000;
  bytes32 constant PROBE_KEY = keccak256("raw-write-probe");
  // ResourceId "tb" + namespace "efs" + name "Probe" (a table that must never become registrable)
  bytes32 constant PROBE_TABLE = 0x7462656673000000000000000000000050726f62650000000000000000000000;

  function setUp() public {
    _deployRealm();
  }

  function _calls(bytes32 tableId, bytes32 layout) internal view returns (bytes[] memory c) {
    bytes32[] memory key = new bytes32[](1);
    key[0] = PROBE_KEY;
    bytes memory staticData = abi.encodePacked(bytes32(uint256(1)), uint64(1));
    bytes32 lengths = bytes32(uint256(3) | (uint256(3) << 56)); // EncodedLengths.pack(3)
    string[] memory names = new string[](1);
    names[0] = "x";
    c = new bytes[](13);
    // IStoreWrite (selectors from README "External selector inventory")
    c[0] = abi.encodeWithSelector(bytes4(0x298314fb), tableId, key, staticData, lengths, bytes("abc")); // setRecord
    c[1] = abi.encodeWithSelector(bytes4(0xb047c1eb), tableId, key, uint48(0), abi.encodePacked(bytes32(uint256(2)))); // spliceStaticData
    c[2] = abi.encodeWithSelector(bytes4(0xc0a2895a), tableId, key, uint8(0), uint40(0), uint40(0), bytes("x")); // spliceDynamicData
    c[3] = abi.encodeWithSelector(bytes4(0x114a7266), tableId, key, uint8(0), abi.encodePacked(bytes32(uint256(2)))); // setField
    c[4] = abi.encodeWithSelector(bytes4(0x3708196e), tableId, key, uint8(0), abi.encodePacked(bytes32(uint256(2))), layout); // setField(+layout)
    c[5] = abi.encodeWithSelector(bytes4(0x390baae0), tableId, key, uint8(0), abi.encodePacked(bytes32(uint256(2))), layout); // setStaticField
    c[6] = abi.encodeWithSelector(bytes4(0xef6ea862), tableId, key, uint8(0), bytes("x")); // setDynamicField
    c[7] = abi.encodeWithSelector(bytes4(0x150f3262), tableId, key, uint8(0), bytes("x")); // pushToDynamicField
    c[8] = abi.encodeWithSelector(bytes4(0xd9c03a04), tableId, key, uint8(0), uint256(1)); // popFromDynamicField
    c[9] = abi.encodeWithSelector(bytes4(0x505a181d), tableId, key); // deleteRecord
    // IStoreRegistration
    c[10] = abi.encodeWithSelector(
      bytes4(0x0ba51f49),
      PROBE_TABLE,
      RECORDS_LAYOUT,
      bytes32(0x002001005f000000000000000000000000000000000000000000000000000000),
      bytes32(0x002802015f07c400000000000000000000000000000000000000000000000000),
      names,
      names
    ); // registerTable
    c[11] = abi.encodeWithSelector(bytes4(0x530f4b60), tableId, address(this), uint8(0xff)); // registerStoreHook
    c[12] = abi.encodeWithSelector(bytes4(0x05609129), tableId, address(this)); // unregisterStoreHook
  }

  function _denyAll(address target, bytes[] memory calls) internal {
    for (uint256 i = 0; i < calls.length; i++) {
      (bool ok, ) = target.call(calls[i]);
      require(!ok, "inherited raw write selector must be unreachable");
    }
  }

  function test_ledger_rawWritersUnreachable_postStateAbsent() public {
    _denyAll(address(ledger), _calls(RECORDS, RECORDS_LAYOUT));
    (, uint64 firstAdmission, ) = Records.get(L(), PROBE_KEY);
    require(firstAdmission == 0, "probe row must be absent");
    require(ledger.highWater() == 0, "no admission happened");
  }

  function test_index_rawWritersUnreachable_postStateAbsent() public {
    _denyAll(address(index), _calls(OCCURRENCES, OCCURRENCES_LAYOUT));
    require(Occurrences.get(X(), PROBE_KEY) == 0, "probe row must be absent");
  }

  function test_readSurfaceWorks() public view {
    require(FieldLayout.unwrap(L().getFieldLayout(ResourceId.wrap(RECORDS))) == RECORDS_LAYOUT, "Records layout readable");
    require(
      Schema.unwrap(L().getKeySchema(ResourceId.wrap(RECORDS))) ==
        0x002001005f000000000000000000000000000000000000000000000000000000,
      "Records key schema readable"
    );
    require(ledger.storeVersion() == bytes32("2.0.2"), "vendored STORE_VERSION");
  }

  function test_indexWriterIsOnlyTheLedger() public {
    Effect[] memory effects = new Effect[](0);
    try index.onPublication(bytes32(0), 1, effects) {
      revert("direct index call must revert");
    } catch (bytes memory err) {
      expectSel(err, IndexModule.NotLedger.selector, "NotLedger expected");
    }
  }

  function test_attachIsOneShot() public {
    try index.attach(address(this)) {
      revert("second attach must revert");
    } catch (bytes memory err) {
      expectSel(err, IndexModule.AlreadyAttached.selector, "AlreadyAttached expected");
    }
    require(index.ledger() == address(ledger), "ledger binding unchanged");
  }

  function test_noFallbackNoReceive() public {
    (bool ok, ) = address(ledger).call{ value: 0 }(hex"deadbeef");
    require(!ok, "unknown selector must revert (no fallback)");
    (ok, ) = address(ledger).call("");
    require(!ok, "empty calldata must revert (no receive)");
  }
}
