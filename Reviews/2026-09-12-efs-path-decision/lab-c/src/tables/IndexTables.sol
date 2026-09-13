// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Hand-written MUD-style table libraries for the IndexModule (namespace "efsidx").
 * Postings are MUD dynamic fields: bytes32[] (32 B/element) and uint64[]
 * (tight-packed 8 B/element, 4 per slot — MUD's tightcoder, no padding).
 * Same `_x` (StoreCore) / `x(IStoreRead store, …)` split as LedgerTables.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import { StoreCore } from "@latticexyz/store/src/StoreCore.sol";
import { Bytes } from "@latticexyz/store/src/Bytes.sol";
import { SliceLib } from "@latticexyz/store/src/Slice.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { Schema } from "@latticexyz/store/src/Schema.sol";
import { EncodedLengths } from "@latticexyz/store/src/EncodedLengths.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { KEY_BYTES32, NO_LENGTHS, key1 } from "./LedgerTables.sol";

FieldLayout constant LAYOUT_ONE_DYNAMIC =
  FieldLayout.wrap(0x0000000100000000000000000000000000000000000000000000000000000000);
Schema constant SCHEMA_BYTES32_ARRAY = Schema.wrap(0x00000001c1000000000000000000000000000000000000000000000000000000);
Schema constant SCHEMA_UINT64_ARRAY = Schema.wrap(0x0000000169000000000000000000000000000000000000000000000000000000);

/// Generic helpers shared by the bytes32[] posting tables.
library Bytes32List {
  function push(ResourceId tableId, bytes32 k, bytes32 el) internal {
    StoreCore.pushToDynamicField(tableId, key1(k), 0, abi.encodePacked(el));
  }

  function push3(ResourceId tableId, bytes32 k, bytes32 a, bytes32 b, bytes32 c) internal {
    StoreCore.pushToDynamicField(tableId, key1(k), 0, abi.encodePacked(a, b, c));
  }

  function lengthOf(ResourceId tableId, bytes32 k) internal view returns (uint256) {
    return StoreCore.getDynamicFieldLength(tableId, key1(k), 0) / 32;
  }

  function length(IStoreRead store, ResourceId tableId, bytes32 k) internal view returns (uint256) {
    return store.getDynamicFieldLength(tableId, key1(k), 0) / 32;
  }

  /// Elements [from, to) in one external read. Empty range returns an empty array (MUD reverts on start>=length).
  function slice(
    IStoreRead store,
    ResourceId tableId,
    bytes32 k,
    uint256 from,
    uint256 to
  ) internal view returns (bytes32[] memory out) {
    if (to <= from) return new bytes32[](0);
    bytes memory blob = store.getDynamicFieldSlice(tableId, key1(k), 0, from * 32, to * 32);
    out = SliceLib.getSubslice(blob, 0, blob.length).decodeArray_bytes32();
  }
}

library Uint64List {
  function push(ResourceId tableId, bytes32 k, uint64 el) internal {
    StoreCore.pushToDynamicField(tableId, key1(k), 0, abi.encodePacked(el));
  }

  function lengthOf(ResourceId tableId, bytes32 k) internal view returns (uint256) {
    return StoreCore.getDynamicFieldLength(tableId, key1(k), 0) / 8;
  }

  function length(IStoreRead store, ResourceId tableId, bytes32 k) internal view returns (uint256) {
    return store.getDynamicFieldLength(tableId, key1(k), 0) / 8;
  }

  function slice(
    IStoreRead store,
    ResourceId tableId,
    bytes32 k,
    uint256 from,
    uint256 to
  ) internal view returns (uint64[] memory out) {
    if (to <= from) return new uint64[](0);
    bytes memory blob = store.getDynamicFieldSlice(tableId, key1(k), 0, from * 8, to * 8);
    out = SliceLib.getSubslice(blob, 0, blob.length).decodeArray_uint64();
  }

  /// First element or 0 when empty (admission ordinals start at 1).
  function first(IStoreRead store, ResourceId tableId, bytes32 k) internal view returns (uint64) {
    if (length(store, tableId, k) == 0) return 0;
    bytes memory blob = store.getDynamicFieldSlice(tableId, key1(k), 0, 0, 8);
    return uint64(bytes8(blob));
  }
}

// Scopes: scopeKey -> entries bytes32[] laid out as triples (author, name, bindingKey)
library Scopes {
  ResourceId constant _tableId = ResourceId.wrap(0x7462656673696478000000000000000053636f70657300000000000000000000);
  FieldLayout constant _fieldLayout = LAYOUT_ONE_DYNAMIC;
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = SCHEMA_BYTES32_ARRAY;

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "scopeKey";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "entries";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _push3(bytes32 scopeKey, bytes32 author, bytes32 name, bytes32 bindingKey) internal {
    Bytes32List.push3(_tableId, scopeKey, author, name, bindingKey);
  }

  function length(IStoreRead store, bytes32 scopeKey) internal view returns (uint256) {
    return Bytes32List.length(store, _tableId, scopeKey);
  }

  function slice(IStoreRead store, bytes32 scopeKey, uint256 from, uint256 to) internal view returns (bytes32[] memory) {
    return Bytes32List.slice(store, _tableId, scopeKey, from, to);
  }
}

// BindingHistory: bindingKey -> admissions uint64[] (one per revision, ascending)
library BindingHistory {
  ResourceId constant _tableId = ResourceId.wrap(0x7462656673696478000000000000000042696e64696e67486973746f72790000);
  FieldLayout constant _fieldLayout = LAYOUT_ONE_DYNAMIC;
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = SCHEMA_UINT64_ARRAY;

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "bindingKey";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "admissions";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _push(bytes32 bindingKey, uint64 admission) internal {
    Uint64List.push(_tableId, bindingKey, admission);
  }

  function length(IStoreRead store, bytes32 bindingKey) internal view returns (uint256) {
    return Uint64List.length(store, _tableId, bindingKey);
  }

  function first(IStoreRead store, bytes32 bindingKey) internal view returns (uint64) {
    return Uint64List.first(store, _tableId, bindingKey);
  }

  function slice(IStoreRead store, bytes32 bindingKey, uint256 from, uint256 to) internal view returns (uint64[] memory) {
    return Uint64List.slice(store, _tableId, bindingKey, from, to);
  }
}

// Backlinks: target recordId -> sources bytes32[] (referencing recordIds; appended on fresh-body admission only)
library Backlinks {
  ResourceId constant _tableId = ResourceId.wrap(0x746265667369647800000000000000004261636b6c696e6b7300000000000000);
  FieldLayout constant _fieldLayout = LAYOUT_ONE_DYNAMIC;
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = SCHEMA_BYTES32_ARRAY;

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "target";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "sources";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _push(bytes32 target, bytes32 source) internal {
    Bytes32List.push(_tableId, target, source);
  }

  function length(IStoreRead store, bytes32 target) internal view returns (uint256) {
    return Bytes32List.length(store, _tableId, target);
  }

  function slice(IStoreRead store, bytes32 target, uint256 from, uint256 to) internal view returns (bytes32[] memory) {
    return Bytes32List.slice(store, _tableId, target, from, to);
  }
}

// ByType: typeId -> records bytes32[] (unique records; appended on fresh-body admission only)
library ByType {
  ResourceId constant _tableId = ResourceId.wrap(0x7462656673696478000000000000000042795479706500000000000000000000);
  FieldLayout constant _fieldLayout = LAYOUT_ONE_DYNAMIC;
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = SCHEMA_BYTES32_ARRAY;

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "typeId";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "records";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _push(bytes32 typeId, bytes32 recordId) internal {
    Bytes32List.push(_tableId, typeId, recordId);
  }

  function length(IStoreRead store, bytes32 typeId) internal view returns (uint256) {
    return Bytes32List.length(store, _tableId, typeId);
  }

  function slice(IStoreRead store, bytes32 typeId, uint256 from, uint256 to) internal view returns (bytes32[] memory) {
    return Bytes32List.slice(store, _tableId, typeId, from, to);
  }
}

// ByAuthor: author -> admissions uint64[] (every admitted action of that author)
library ByAuthor {
  ResourceId constant _tableId = ResourceId.wrap(0x746265667369647800000000000000004279417574686f720000000000000000);
  FieldLayout constant _fieldLayout = LAYOUT_ONE_DYNAMIC;
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = SCHEMA_UINT64_ARRAY;

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "author";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "admissions";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _push(bytes32 author, uint64 admission) internal {
    Uint64List.push(_tableId, author, admission);
  }

  function length(IStoreRead store, bytes32 author) internal view returns (uint256) {
    return Uint64List.length(store, _tableId, author);
  }

  function slice(IStoreRead store, bytes32 author, uint256 from, uint256 to) internal view returns (uint64[] memory) {
    return Uint64List.slice(store, _tableId, author, from, to);
  }
}

// Occurrences: recordId -> count uint32 (per-record occurrence counter; every RECORD admission increments)
library Occurrences {
  ResourceId constant _tableId = ResourceId.wrap(0x746265667369647800000000000000004f6363757272656e6365730000000000);
  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x0004010004000000000000000000000000000000000000000000000000000000);
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = Schema.wrap(0x0004010003000000000000000000000000000000000000000000000000000000);

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "recordId";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "count";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _set(bytes32 recordId, uint32 count) internal {
    StoreCore.setStaticField(_tableId, key1(recordId), 0, abi.encodePacked(count), _fieldLayout);
  }

  function _get(bytes32 recordId) internal view returns (uint32) {
    return uint32(bytes4(StoreCore.getStaticField(_tableId, key1(recordId), 0, _fieldLayout)));
  }

  function get(IStoreRead store, bytes32 recordId) internal view returns (uint32) {
    return uint32(bytes4(store.getStaticField(_tableId, key1(recordId), 0, _fieldLayout)));
  }
}

// Coverage: family -> (mandatory, declared, declaredAt, through)
library Coverage {
  ResourceId constant _tableId = ResourceId.wrap(0x74626566736964780000000000000000436f7665726167650000000000000000);
  FieldLayout constant _fieldLayout =
    FieldLayout.wrap(0x0012040001010808000000000000000000000000000000000000000000000000);
  Schema constant _keySchema = KEY_BYTES32;
  Schema constant _valueSchema = Schema.wrap(0x0012040060600707000000000000000000000000000000000000000000000000);

  function getKeyNames() internal pure returns (string[] memory n) {
    n = new string[](1);
    n[0] = "family";
  }

  function getFieldNames() internal pure returns (string[] memory n) {
    n = new string[](4);
    n[0] = "mandatory";
    n[1] = "declared";
    n[2] = "declaredAt";
    n[3] = "through";
  }

  function _register() internal {
    StoreCore.registerTable(_tableId, _fieldLayout, _keySchema, _valueSchema, getKeyNames(), getFieldNames());
  }

  function _set(bytes32 family, bool mandatory, bool declared, uint64 declaredAt, uint64 through) internal {
    StoreCore.setRecord(
      _tableId,
      key1(family),
      abi.encodePacked(mandatory, declared, declaredAt, through),
      NO_LENGTHS,
      new bytes(0),
      _fieldLayout
    );
  }

  function decodeStatic(
    bytes memory s
  ) internal pure returns (bool mandatory, bool declared, uint64 declaredAt, uint64 through) {
    mandatory = uint8(bytes1(Bytes.getBytes32(s, 0))) != 0;
    declared = uint8(bytes1(Bytes.getBytes32(s, 1))) != 0;
    declaredAt = uint64(bytes8(Bytes.getBytes32(s, 2)));
    through = uint64(bytes8(Bytes.getBytes32(s, 10)));
  }

  function _get(bytes32 family) internal view returns (bool, bool, uint64, uint64) {
    (bytes memory s, , ) = StoreCore.getRecord(_tableId, key1(family), _fieldLayout);
    return decodeStatic(s);
  }

  function get(IStoreRead store, bytes32 family) internal view returns (bool, bool, uint64, uint64) {
    (bytes memory s, , ) = store.getRecord(_tableId, key1(family), _fieldLayout);
    return decodeStatic(s);
  }
}
