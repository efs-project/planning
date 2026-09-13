// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * DenialProbe: separately deployed helper for the raw-write denial suite (EIP-3860). Builds the
 * table-correct inputs, snapshots row/registry/hook/ResourceIds metadata, performs the probe calls
 * and the permissive-control calls. Reverts (with a message) on any violation so the thin test
 * contract only asserts on return values.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { Schema } from "@latticexyz/store/src/Schema.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { Records } from "../src/tables/LedgerTables.sol";
import { Occurrences } from "../src/tables/IndexTables.sol";

contract DenialProbe {
  bytes32 public constant RECORDS = 0x746265667300000000000000000000005265636f726473000000000000000000;
  bytes32 public constant RECORDS_LAYOUT = 0x0028020120080000000000000000000000000000000000000000000000000000;
  bytes32 public constant OCCURRENCES = 0x746265667369647800000000000000004f6363757272656e6365730000000000;
  bytes32 public constant OCCURRENCES_LAYOUT = 0x0004010004000000000000000000000000000000000000000000000000000000;
  bytes32 public constant BYTYPE = 0x7462656673696478000000000000000042795479706500000000000000000000;
  // vendored Store internal tables (namespace "store")
  bytes32 public constant STORE_RESOURCE_IDS = 0x746273746f72650000000000000000005265736f757263654964730000000000;
  bytes32 public constant STORE_HOOKS = 0x746273746f726500000000000000000053746f7265486f6f6b73000000000000;
  // ResourceId "tb" + namespace "efs" + name "Probe" (a table that must never become registrable)
  bytes32 public constant PROBE_TABLE = 0x7462656673000000000000000000000050726f62650000000000000000000000;

  struct Snap {
    bytes32 row; // keccak of the target row's full record bytes
    bytes32 layout;
    bytes32 keySchema;
    bytes32 valueSchema;
    uint256 hooks; // StoreHooks length for the table
    bytes32 probeExists; // ResourceIds row for PROBE_TABLE
  }

  function key(bytes32 k) public pure returns (bytes32[] memory t) {
    t = new bytes32[](1);
    t[0] = k;
  }

  function lengths(uint256 n) public pure returns (bytes32) {
    return bytes32(n | (n << 56)); // EncodedLengths.pack(n)
  }

  /// Records-shaped inputs (2 static fields = 40 bytes, 1 dynamic `body`), against an existing row.
  function recordsCalls(bytes32 row) public pure returns (bytes[] memory c) {
    bytes32[] memory k = key(row);
    bytes memory staticData = abi.encodePacked(bytes32(uint256(1)), uint64(1));
    string[] memory keyNames = Records.getKeyNames();
    string[] memory fieldNames = Records.getFieldNames();
    c = new bytes[](13);
    c[0] = abi.encodeWithSelector(bytes4(0x298314fb), RECORDS, k, staticData, lengths(3), bytes("abc")); // setRecord
    c[1] = abi.encodeWithSelector(bytes4(0xb047c1eb), RECORDS, k, uint48(0), abi.encodePacked(bytes32(uint256(2)))); // spliceStaticData
    c[2] = abi.encodeWithSelector(bytes4(0xc0a2895a), RECORDS, k, uint8(0), uint40(0), uint40(1), bytes("x")); // spliceDynamicData
    c[3] = abi.encodeWithSelector(bytes4(0x114a7266), RECORDS, k, uint8(0), abi.encodePacked(bytes32(uint256(2)))); // setField
    c[4] = abi.encodeWithSelector(bytes4(0x3708196e), RECORDS, k, uint8(1), abi.encodePacked(uint64(9)), RECORDS_LAYOUT); // setField(+layout)
    c[5] = abi.encodeWithSelector(bytes4(0x390baae0), RECORDS, k, uint8(1), abi.encodePacked(uint64(9)), RECORDS_LAYOUT); // setStaticField
    c[6] = abi.encodeWithSelector(bytes4(0xef6ea862), RECORDS, k, uint8(0), bytes("xy")); // setDynamicField
    c[7] = abi.encodeWithSelector(bytes4(0x150f3262), RECORDS, k, uint8(0), bytes("z")); // pushToDynamicField
    c[8] = abi.encodeWithSelector(bytes4(0xd9c03a04), RECORDS, k, uint8(0), uint256(1)); // popFromDynamicField
    c[9] = abi.encodeWithSelector(bytes4(0x505a181d), RECORDS, k); // deleteRecord
    c[10] = abi.encodeWithSelector(
      bytes4(0x0ba51f49),
      PROBE_TABLE,
      RECORDS_LAYOUT,
      bytes32(0x002001005f000000000000000000000000000000000000000000000000000000),
      bytes32(0x002802015f07c400000000000000000000000000000000000000000000000000),
      keyNames,
      fieldNames
    ); // registerTable with a key-name array (1) and field-name array (3) matching the Records schema
    c[11] = abi.encodeWithSelector(bytes4(0x530f4b60), RECORDS, address(this), uint8(0xff)); // registerStoreHook
    c[12] = abi.encodeWithSelector(bytes4(0x05609129), RECORDS, address(this)); // unregisterStoreHook
  }

  /// Index-shaped inputs: static ops against Occurrences (uint32), dynamic ops against ByType (bytes32[]).
  function indexCalls(bytes32 staticRow, bytes32 dynRow) public pure returns (bytes[] memory c) {
    bytes32[] memory skey = key(staticRow);
    bytes32[] memory dkey = key(dynRow);
    string[] memory keyNames = Occurrences.getKeyNames();
    string[] memory fieldNames = Occurrences.getFieldNames();
    c = new bytes[](13);
    c[0] = abi.encodeWithSelector(bytes4(0x298314fb), OCCURRENCES, skey, abi.encodePacked(uint32(7)), bytes32(0), bytes("")); // setRecord
    c[1] = abi.encodeWithSelector(bytes4(0xb047c1eb), OCCURRENCES, skey, uint48(0), abi.encodePacked(uint32(8))); // spliceStaticData
    c[2] = abi.encodeWithSelector(bytes4(0xc0a2895a), BYTYPE, dkey, uint8(0), uint40(0), uint40(32), abi.encodePacked(bytes32(uint256(5)))); // spliceDynamicData
    c[3] = abi.encodeWithSelector(bytes4(0x114a7266), OCCURRENCES, skey, uint8(0), abi.encodePacked(uint32(9))); // setField
    c[4] = abi.encodeWithSelector(bytes4(0x3708196e), OCCURRENCES, skey, uint8(0), abi.encodePacked(uint32(9)), OCCURRENCES_LAYOUT); // setField(+layout)
    c[5] = abi.encodeWithSelector(bytes4(0x390baae0), OCCURRENCES, skey, uint8(0), abi.encodePacked(uint32(9)), OCCURRENCES_LAYOUT); // setStaticField
    c[6] = abi.encodeWithSelector(bytes4(0xef6ea862), BYTYPE, dkey, uint8(0), abi.encodePacked(bytes32(uint256(6)))); // setDynamicField
    c[7] = abi.encodeWithSelector(bytes4(0x150f3262), BYTYPE, dkey, uint8(0), abi.encodePacked(bytes32(uint256(7)))); // pushToDynamicField
    c[8] = abi.encodeWithSelector(bytes4(0xd9c03a04), BYTYPE, dkey, uint8(0), uint256(32)); // popFromDynamicField
    c[9] = abi.encodeWithSelector(bytes4(0x505a181d), BYTYPE, dkey); // deleteRecord
    c[10] = abi.encodeWithSelector(
      bytes4(0x0ba51f49),
      PROBE_TABLE,
      OCCURRENCES_LAYOUT,
      bytes32(0x002001005f000000000000000000000000000000000000000000000000000000),
      bytes32(0x0004010003000000000000000000000000000000000000000000000000000000),
      keyNames,
      fieldNames
    ); // registerTable with names matching the one-field Occurrences schema
    c[11] = abi.encodeWithSelector(bytes4(0x530f4b60), OCCURRENCES, address(this), uint8(0xff)); // registerStoreHook
    c[12] = abi.encodeWithSelector(bytes4(0x05609129), OCCURRENCES, address(this)); // unregisterStoreHook
  }

  function snap(IStoreRead s, bytes32 tableId, bytes32 layout, bytes32 row) public view returns (Snap memory z) {
    (bytes memory st, , bytes memory dy) = s.getRecord(ResourceId.wrap(tableId), key(row), FieldLayout.wrap(layout));
    z.row = keccak256(abi.encode(st, dy));
    z.layout = FieldLayout.unwrap(s.getFieldLayout(ResourceId.wrap(tableId)));
    z.keySchema = Schema.unwrap(s.getKeySchema(ResourceId.wrap(tableId)));
    z.valueSchema = Schema.unwrap(s.getValueSchema(ResourceId.wrap(tableId)));
    z.hooks = s.getDynamicFieldLength(ResourceId.wrap(STORE_HOOKS), key(tableId), 0);
    FieldLayout ridLayout = s.getFieldLayout(ResourceId.wrap(STORE_RESOURCE_IDS));
    z.probeExists = s.getStaticField(ResourceId.wrap(STORE_RESOURCE_IDS), key(PROBE_TABLE), 0, ridLayout);
  }

  function same(Snap memory a, Snap memory b, string memory what) public pure {
    require(a.row == b.row, what);
    require(a.layout == b.layout && a.keySchema == b.keySchema && a.valueSchema == b.valueSchema, "registry metadata changed");
    require(a.hooks == b.hooks, "hook metadata changed");
    require(a.probeExists == b.probeExists && a.probeExists == bytes32(0), "probe table must stay unregistered");
  }

  /// Every call must revert AND leave the snapshot identical (checked after each call, not only at the end).
  function denyAll(IStoreRead s, address target, bytes[] memory calls, bytes32 tableId, bytes32 layout, bytes32 row) public {
    Snap memory before = snap(s, tableId, layout, row);
    for (uint256 i = 0; i < calls.length; i++) {
      (bool ok, ) = target.call(calls[i]);
      require(!ok, "raw write selector must revert");
      same(before, snap(s, tableId, layout, row), "row changed after a denied call");
    }
  }

  /// Permissive-control run: every call must SUCCEED; returns the first failing index (or 99 when all succeed).
  function controlAll(address target, bytes[] memory calls, uint256 skip) public returns (uint256 firstFailure) {
    for (uint256 i = 0; i < calls.length; i++) {
      if (i == skip) continue;
      (bool ok, ) = target.call(calls[i]);
      if (!ok) return i;
    }
    return 99;
  }
}
