// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * PERMISSIVE POSITIVE CONTROL for the denial tests: a minimal `is Store`-derived contract with
 * every IStoreWrite / IStoreRegistration selector implemented as an open passthrough to StoreCore.
 * The denial suite feeds it exactly the inputs it feeds the Ledger/IndexModule; here they must
 * SUCCEED, proving the inputs are table-correct and that only the absence of the selector makes
 * them fail elsewhere. Test-only; never deployed with the probe.
 */

import { Store } from "@latticexyz/store/src/Store.sol";
import { StoreCore } from "@latticexyz/store/src/StoreCore.sol";
import { IStoreHook } from "@latticexyz/store/src/IStoreHook.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { Schema } from "@latticexyz/store/src/Schema.sol";
import { EncodedLengths } from "@latticexyz/store/src/EncodedLengths.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { Records, Types } from "../src/tables/LedgerTables.sol";
import { Occurrences, ByType } from "../src/tables/IndexTables.sol";

contract OpenStore is Store {
  constructor() {
    StoreCore.registerInternalTables();
    Records._register();
    Types._register();
    Occurrences._register();
    ByType._register();
  }

  function setRecord(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    bytes calldata staticData,
    EncodedLengths encodedLengths,
    bytes calldata dynamicData
  ) public {
    StoreCore.setRecord(tableId, keyTuple, staticData, encodedLengths, dynamicData);
  }

  function spliceStaticData(ResourceId tableId, bytes32[] calldata keyTuple, uint48 start, bytes calldata data) public {
    StoreCore.spliceStaticData(tableId, keyTuple, start, data);
  }

  function spliceDynamicData(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    uint40 startWithinField,
    uint40 deleteCount,
    bytes calldata data
  ) public {
    StoreCore.spliceDynamicData(tableId, keyTuple, dynamicFieldIndex, startWithinField, deleteCount, data);
  }

  function setField(ResourceId tableId, bytes32[] calldata keyTuple, uint8 fieldIndex, bytes calldata data) public {
    StoreCore.setField(tableId, keyTuple, fieldIndex, data);
  }

  function setField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 fieldIndex,
    bytes calldata data,
    FieldLayout fieldLayout
  ) public {
    StoreCore.setField(tableId, keyTuple, fieldIndex, data, fieldLayout);
  }

  function setStaticField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 fieldIndex,
    bytes calldata data,
    FieldLayout fieldLayout
  ) public {
    StoreCore.setStaticField(tableId, keyTuple, fieldIndex, data, fieldLayout);
  }

  function setDynamicField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    bytes calldata data
  ) public {
    StoreCore.setDynamicField(tableId, keyTuple, dynamicFieldIndex, data);
  }

  function pushToDynamicField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    bytes calldata dataToPush
  ) public {
    StoreCore.pushToDynamicField(tableId, keyTuple, dynamicFieldIndex, dataToPush);
  }

  function popFromDynamicField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    uint256 byteLengthToPop
  ) public {
    StoreCore.popFromDynamicField(tableId, keyTuple, dynamicFieldIndex, byteLengthToPop);
  }

  function deleteRecord(ResourceId tableId, bytes32[] memory keyTuple) public {
    StoreCore.deleteRecord(tableId, keyTuple);
  }

  function registerTable(
    ResourceId tableId,
    FieldLayout fieldLayout,
    Schema keySchema,
    Schema valueSchema,
    string[] calldata keyNames,
    string[] calldata fieldNames
  ) public {
    StoreCore.registerTable(tableId, fieldLayout, keySchema, valueSchema, keyNames, fieldNames);
  }

  function registerStoreHook(ResourceId tableId, IStoreHook hookAddress, uint8 enabledHooksBitmap) public {
    StoreCore.registerStoreHook(tableId, hookAddress, enabledHooksBitmap);
  }

  function unregisterStoreHook(ResourceId tableId, IStoreHook hookAddress) public {
    StoreCore.unregisterStoreHook(tableId, hookAddress);
  }
}
