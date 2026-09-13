// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Finding 1 + coordinator corrections. These tests show that, fed table-correct inputs which a
 * PERMISSIVE `is Store` control accepts, every IStoreWrite / IStoreRegistration selector reverts on
 * the Ledger and on the IndexModule and leaves row data, registry metadata and hook metadata
 * unchanged; that the IndexModule's only writer is its sealed Ledger; and that attachment is
 * one-shot, reciprocal and rejects zero/no-code addresses. They are a necessary check of the
 * boundary, not a proof that no write path exists (see README).
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { Schema } from "@latticexyz/store/src/Schema.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import "../src/EfsTypes.sol";
import { Ledger } from "../src/Ledger.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { Records } from "../src/tables/LedgerTables.sol";
import { Occurrences, ByType } from "../src/tables/IndexTables.sol";
import { LabBase } from "./LabBase.sol";
import { OpenStore } from "./OpenStore.sol";
import { EncodedLengths } from "@latticexyz/store/src/EncodedLengths.sol";

contract RawWriteDenialTest is LabBase {
  bytes32 constant RECORDS = 0x746265667300000000000000000000005265636f726473000000000000000000;
  bytes32 constant RECORDS_LAYOUT = 0x0028020120080000000000000000000000000000000000000000000000000000;
  bytes32 constant OCCURRENCES = 0x746265667369647800000000000000004f6363757272656e6365730000000000;
  bytes32 constant OCCURRENCES_LAYOUT = 0x0004010004000000000000000000000000000000000000000000000000000000;
  bytes32 constant BYTYPE = 0x7462656673696478000000000000000042795479706500000000000000000000;
  bytes32 constant BYTYPE_LAYOUT = 0x0000000100000000000000000000000000000000000000000000000000000000;
  // vendored Store internal tables (namespace "store")
  bytes32 constant STORE_TABLES = 0x746273746f72650000000000000000005461626c657300000000000000000000;
  bytes32 constant STORE_RESOURCE_IDS = 0x746273746f72650000000000000000005265736f757263654964730000000000;
  bytes32 constant STORE_HOOKS = 0x746273746f726500000000000000000053746f7265486f6f6b73000000000000;
  // ResourceId "tb" + namespace "efs" + name "Probe" (a table that must never become registrable)
  bytes32 constant PROBE_TABLE = 0x7462656673000000000000000000000050726f62650000000000000000000000;

  struct Snap {
    bytes32 row; // keccak of the target row's full record bytes
    bytes32 layout;
    bytes32 keySchema;
    bytes32 valueSchema;
    uint256 hooks; // StoreHooks length for the table
    bytes32 probeExists; // ResourceIds row for PROBE_TABLE
  }

  function setUp() public {
    _deployRealm();
    _seed(); // Records[PAIR] and ByType[ITEM_T]/Occurrences[ITEM_ETH] are non-empty rows to splice/pop against
  }

  // ---- inputs ----------------------------------------------------------------

  function _key(bytes32 k) internal pure returns (bytes32[] memory t) {
    t = new bytes32[](1);
    t[0] = k;
  }

  /// Records-shaped inputs (2 static fields = 40 bytes, 1 dynamic `body`), against an existing row.
  function _recordsCalls(bytes32 row) internal view returns (bytes[] memory c) {
    bytes32[] memory key = _key(row);
    bytes memory staticData = abi.encodePacked(bytes32(uint256(1)), uint64(1));
    bytes32 lengths = bytes32(uint256(3) | (uint256(3) << 56)); // EncodedLengths.pack(3)
    string[] memory keyNames = Records.getKeyNames();
    string[] memory fieldNames = Records.getFieldNames();
    c = new bytes[](13);
    c[0] = abi.encodeWithSelector(bytes4(0x298314fb), RECORDS, key, staticData, lengths, bytes("abc")); // setRecord
    c[1] = abi.encodeWithSelector(bytes4(0xb047c1eb), RECORDS, key, uint48(0), abi.encodePacked(bytes32(uint256(2)))); // spliceStaticData
    c[2] = abi.encodeWithSelector(bytes4(0xc0a2895a), RECORDS, key, uint8(0), uint40(0), uint40(1), bytes("x")); // spliceDynamicData
    c[3] = abi.encodeWithSelector(bytes4(0x114a7266), RECORDS, key, uint8(0), abi.encodePacked(bytes32(uint256(2)))); // setField
    c[4] = abi.encodeWithSelector(bytes4(0x3708196e), RECORDS, key, uint8(1), abi.encodePacked(uint64(9)), RECORDS_LAYOUT); // setField(+layout)
    c[5] = abi.encodeWithSelector(bytes4(0x390baae0), RECORDS, key, uint8(1), abi.encodePacked(uint64(9)), RECORDS_LAYOUT); // setStaticField
    c[6] = abi.encodeWithSelector(bytes4(0xef6ea862), RECORDS, key, uint8(0), bytes("xy")); // setDynamicField
    c[7] = abi.encodeWithSelector(bytes4(0x150f3262), RECORDS, key, uint8(0), bytes("z")); // pushToDynamicField
    c[8] = abi.encodeWithSelector(bytes4(0xd9c03a04), RECORDS, key, uint8(0), uint256(1)); // popFromDynamicField
    c[9] = abi.encodeWithSelector(bytes4(0x505a181d), RECORDS, key); // deleteRecord
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
  function _indexCalls(bytes32 staticRow, bytes32 dynRow) internal view returns (bytes[] memory c) {
    bytes32[] memory skey = _key(staticRow);
    bytes32[] memory dkey = _key(dynRow);
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

  // ---- snapshots ---------------------------------------------------------------

  function _snap(IStoreRead s, bytes32 tableId, bytes32 layout, bytes32 row) internal view returns (Snap memory z) {
    (bytes memory st, , bytes memory dy) = s.getRecord(ResourceId.wrap(tableId), _key(row), FieldLayout.wrap(layout));
    z.row = keccak256(abi.encode(st, dy));
    z.layout = FieldLayout.unwrap(s.getFieldLayout(ResourceId.wrap(tableId)));
    z.keySchema = Schema.unwrap(s.getKeySchema(ResourceId.wrap(tableId)));
    z.valueSchema = Schema.unwrap(s.getValueSchema(ResourceId.wrap(tableId)));
    z.hooks = s.getDynamicFieldLength(ResourceId.wrap(STORE_HOOKS), _key(tableId), 0);
    FieldLayout ridLayout = s.getFieldLayout(ResourceId.wrap(STORE_RESOURCE_IDS));
    z.probeExists = s.getStaticField(ResourceId.wrap(STORE_RESOURCE_IDS), _key(PROBE_TABLE), 0, ridLayout);
  }

  function _same(Snap memory a, Snap memory b, string memory what) internal pure {
    require(a.row == b.row, what);
    require(a.layout == b.layout && a.keySchema == b.keySchema && a.valueSchema == b.valueSchema, "registry metadata changed");
    require(a.hooks == b.hooks, "hook metadata changed");
    require(a.probeExists == b.probeExists && a.probeExists == bytes32(0), "probe table must stay unregistered");
  }

  /// Every call must revert AND leave the snapshot identical (checked after each call, not only at the end).
  function _denyAll(IStoreRead s, address target, bytes[] memory calls, bytes32 tableId, bytes32 layout, bytes32 row) internal {
    Snap memory before = _snap(s, tableId, layout, row);
    for (uint256 i = 0; i < calls.length; i++) {
      (bool ok, ) = target.call(calls[i]);
      require(!ok, "raw write selector must revert");
      _same(before, _snap(s, tableId, layout, row), "row changed after a denied call");
    }
  }

  // ---- positive control --------------------------------------------------------

  function test_control_openStore_acceptsTheSameInputs() public {
    OpenStore open = new OpenStore();
    bytes32 row = keccak256("seeded");
    // seed a non-empty Records row so splice/pop/delete operate on real data
    open.setRecord(ResourceId.wrap(RECORDS), _key(row), abi.encodePacked(bytes32(uint256(1)), uint64(1)), EncodedLengths.wrap(_lengths(3)), bytes("abc"));
    bytes[] memory calls = _recordsCalls(row);
    for (uint256 i = 0; i < calls.length; i++) {
      (bool ok, bytes memory err) = address(open).call(calls[i]);
      require(ok, string(abi.encodePacked("control call must succeed: #", _digit(i), " ", err)));
    }
    // and the index-shaped inputs, after seeding their rows
    open.setRecord(ResourceId.wrap(OCCURRENCES), _key(row), abi.encodePacked(uint32(1)), EncodedLengths.wrap(bytes32(0)), bytes(""));
    open.pushToDynamicField(ResourceId.wrap(BYTYPE), _key(row), 0, abi.encodePacked(bytes32(uint256(1))));
    calls = _indexCalls(row, row);
    for (uint256 i = 0; i < calls.length; i++) {
      if (i == 10) continue; // PROBE_TABLE is already registered by the Records-shaped run above
      (bool ok, bytes memory err) = address(open).call(calls[i]);
      require(ok, string(abi.encodePacked("index-shaped control call must succeed: #", _digit(i), " ", err)));
    }
  }

  function _lengths(uint256 n) internal pure returns (bytes32) {
    return bytes32(n | (n << 56));
  }

  function _digit(uint256 i) internal pure returns (bytes memory) {
    return abi.encodePacked(bytes1(uint8(48 + i / 10)), bytes1(uint8(48 + (i % 10))));
  }

  // ---- denials -----------------------------------------------------------------

  function test_ledger_rawWritersDenied_rowAndMetadataUnchanged() public {
    _denyAll(L(), address(ledger), _recordsCalls(PAIR), RECORDS, RECORDS_LAYOUT, PAIR);
    require(ledger.highWater() == 6, "no admission happened");
  }

  function test_index_rawWritersDenied_rowAndMetadataUnchanged() public {
    _denyAll(X(), address(index), _indexCalls(ITEM_ETH, ITEM_T), OCCURRENCES, OCCURRENCES_LAYOUT, ITEM_ETH);
    require(ByType.length(X(), ITEM_T) == 2 && Occurrences.get(X(), ITEM_ETH) == 1, "index rows unchanged");
  }

  function test_readSurfaceWorks() public view {
    require(FieldLayout.unwrap(L().getFieldLayout(ResourceId.wrap(RECORDS))) == RECORDS_LAYOUT, "Records layout readable");
    require(ledger.storeVersion() == bytes32("2.0.2"), "vendored STORE_VERSION");
    (, uint64 adm, ) = Records.get(L(), PAIR);
    require(adm == 6, "seeded row readable");
  }

  // ---- attachment / foreign writers --------------------------------------------

  function test_indexWriterIsOnlyTheSealedLedger() public {
    Effect[] memory effects = new Effect[](0);
    try index.onPublication(bytes32(0), 1, effects) {
      revert("direct index call must revert");
    } catch (bytes memory err) {
      expectSel(err, IndexModule.NotLedger.selector, "NotLedger expected");
    }
  }

  function test_attachIsOneShot_andSealsCodehash() public {
    require(index.ledger() == address(ledger) && index.ledgerCodehash() == address(ledger).codehash, "sealed at attach");
    require(ledger.indexCodehash() == address(index).codehash, "ledger sealed the index codehash");
    try index.attach(address(ledger)) {
      revert("second attach must revert");
    } catch (bytes memory err) {
      expectSel(err, IndexModule.AlreadyAttached.selector, "AlreadyAttached expected");
    }
  }

  function test_attachRejectsZeroAndNoCode() public {
    IndexModule fresh = new IndexModule(POISON);
    try fresh.attach(address(0)) {
      revert("zero address must revert");
    } catch (bytes memory err) {
      expectSel(err, IndexModule.BadAttachment.selector, "zero attachment");
    }
    try fresh.attach(vm.addr(0xEEEE)) {
      revert("no-code address must revert");
    } catch (bytes memory err) {
      expectSel(err, IndexModule.BadAttachment.selector, "no-code attachment");
    }
    require(fresh.ledger() == address(0), "still unattached");
  }

  function test_attachRequiresReciprocity() public {
    IndexModule fresh = new IndexModule(POISON);
    try fresh.attach(address(ledger)) {
      revert("ledger names another module: must revert");
    } catch (bytes memory err) {
      expectSel(err, IndexModule.NotReciprocal.selector, "NotReciprocal expected");
    }
  }

  function test_ledgerRejectsZeroOrNoCodeIndex() public {
    try new Ledger(IIndexModule(address(0))) {
      revert("zero index must revert");
    } catch (bytes memory err) {
      expectSel(err, Ledger.BadAttachment.selector, "zero index");
    }
    try new Ledger(IIndexModule(vm.addr(0xEEEE))) {
      revert("no-code index must revert");
    } catch (bytes memory err) {
      expectSel(err, Ledger.BadAttachment.selector, "no-code index");
    }
  }

  function test_ledgerRefusesUnattachedOrForeignModule() public {
    // a Ledger whose module never attached to it (the module is attached to nothing)
    IndexModule loose = new IndexModule(POISON);
    Ledger orphan = new Ledger(loose);
    bytes32 self = EfsIds.contractPrincipal(orphan.realmOrigin(), address(this));
    Action[] memory acts = new Action[](1);
    acts[0] = subjectAction(self, keccak256("s"));
    try orphan.publishNative(intentOf(self, 1, acts), noBodies(1)) {
      revert("must refuse an unattached module");
    } catch (bytes memory err) {
      expectSel(err, Ledger.IndexNotAttached.selector, "IndexNotAttached expected");
    }
    require(orphan.highWater() == 0, "nothing admitted");
    // a module attached to a DIFFERENT Ledger is refused too (Y names the module, the module names X)
    IndexModule shared = new IndexModule(POISON);
    Ledger x = new Ledger(shared);
    shared.attach(address(x));
    Ledger y = new Ledger(shared);
    bytes32 selfY = EfsIds.contractPrincipal(y.realmOrigin(), address(this));
    acts[0] = subjectAction(selfY, keccak256("s"));
    try y.publishNative(intentOf(selfY, 1, acts), noBodies(1)) {
      revert("must refuse a module sealed to another Ledger");
    } catch (bytes memory err) {
      expectSel(err, Ledger.IndexNotAttached.selector, "foreign module");
    }
    require(y.highWater() == 0 && x.highWater() == 0, "nothing admitted anywhere");
  }

  function test_noFallbackNoReceive() public {
    (bool ok, ) = address(ledger).call{ value: 0 }(hex"deadbeef");
    require(!ok, "unknown selector must revert (no fallback)");
    (ok, ) = address(ledger).call("");
    require(!ok, "empty calldata must revert (no receive)");
    (ok, ) = address(index).call(hex"deadbeef");
    require(!ok, "unknown selector must revert on the index too");
  }
}
