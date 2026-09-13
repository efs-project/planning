// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Finding 1 + coordinator corrections. These tests show that, fed table-correct inputs which a
 * PERMISSIVE `is Store` control accepts, every IStoreWrite / IStoreRegistration selector reverts on
 * the Ledger and on the IndexModule and leaves row data, registry metadata and hook metadata
 * unchanged; that the IndexModule's only writer is its sealed Ledger; and that attachment is
 * one-shot, reciprocal and rejects zero/no-code addresses. They are a necessary check of the
 * boundary, not a proof that no write path exists (see README). Probe code lives in DenialProbe.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import "../src/EfsTypes.sol";
import "../src/LedgerErrors.sol";
import { Ledger } from "../src/Ledger.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { Records } from "../src/tables/LedgerTables.sol";
import { Occurrences, ByType } from "../src/tables/IndexTables.sol";
import { LabBase } from "./LabBase.sol";
import { OpenStore } from "./OpenStore.sol";
import { DenialProbe } from "./DenialProbe.sol";

contract RawWriteDenialTest is LabBase {
  DenialProbe internal probe;

  function setUp() public {
    _boot(true); // Records[PAIR] and ByType[ITEM_T]/Occurrences[ITEM_ETH] are non-empty rows to splice/pop against
    probe = new DenialProbe();
  }

  // ---- positive control --------------------------------------------------------

  function test_control_openStore_acceptsTheSameInputs() public {
    OpenStore open = new OpenStore();
    bytes32 row = keccak256("seeded");
    open.setRecord(ResourceId.wrap(probe.RECORDS()), probe.key(row), abi.encodePacked(bytes32(uint256(1)), uint64(1)), probe.lengths(3), bytes("abc"));
    uint256 f = probe.controlAll(address(open), probe.recordsCalls(row), 99);
    require(f == 99, "every Records-shaped control call must succeed");
    open.setRecord(ResourceId.wrap(probe.OCCURRENCES()), probe.key(row), abi.encodePacked(uint32(1)), bytes32(0), bytes(""));
    open.pushToDynamicField(ResourceId.wrap(probe.BYTYPE()), probe.key(row), 0, abi.encodePacked(bytes32(uint256(1))));
    f = probe.controlAll(address(open), probe.indexCalls(row, row), 10); // PROBE_TABLE already registered above
    require(f == 99, "every index-shaped control call must succeed");
  }

  // ---- denials -----------------------------------------------------------------

  function test_ledger_rawWritersDenied_rowAndMetadataUnchanged() public {
    probe.denyAll(L(), address(ledger), probe.recordsCalls(PAIR), probe.RECORDS(), probe.RECORDS_LAYOUT(), PAIR);
    require(ledger.highWater() == 6, "no admission happened");
  }

  function test_index_rawWritersDenied_rowAndMetadataUnchanged() public {
    probe.denyAll(X(), address(index), probe.indexCalls(ITEM_ETH, ITEM_T), probe.OCCURRENCES(), probe.OCCURRENCES_LAYOUT(), ITEM_ETH);
    require(ByType.length(X(), ITEM_T) == 2 && Occurrences.get(X(), ITEM_ETH) == 1, "index rows unchanged");
  }

  function test_readSurfaceWorks() public view {
    require(FieldLayout.unwrap(L().getFieldLayout(ResourceId.wrap(probe.RECORDS()))) == probe.RECORDS_LAYOUT(), "Records layout readable");
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
    (uint8 st, ) = fresh.coverage(fresh.FAMILY_SCOPES(), bytes32(0));
    require(st == 0, "coverage pre-attach is UNKNOWN, not a revert");
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
      expectSel(err, BadAttachment.selector, "zero index");
    }
    try new Ledger(IIndexModule(vm.addr(0xEEEE))) {
      revert("no-code index must revert");
    } catch (bytes memory err) {
      expectSel(err, BadAttachment.selector, "no-code index");
    }
  }

  function test_ledgerRefusesUnattachedOrForeignModule() public {
    IndexModule loose = new IndexModule(POISON);
    Ledger orphan = new Ledger(loose); // the module never attached to it
    bytes32 self = EfsIds.contractPrincipal(orphan.realmOrigin(), address(this));
    Action[] memory acts = new Action[](1);
    acts[0] = subjectAction(self, keccak256("s"));
    try orphan.publishNative(intentOf(self, 1, acts), noBodies(1)) {
      revert("must refuse an unattached module");
    } catch (bytes memory err) {
      expectSel(err, IndexNotAttached.selector, "IndexNotAttached expected");
    }
    require(orphan.highWater() == 0, "nothing admitted");
    // a module sealed to a DIFFERENT Ledger is refused too (Y names the module, the module names X)
    IndexModule shared = new IndexModule(POISON);
    Ledger x = new Ledger(shared);
    shared.attach(address(x));
    Ledger y = new Ledger(shared);
    bytes32 selfY = EfsIds.contractPrincipal(y.realmOrigin(), address(this));
    acts[0] = subjectAction(selfY, keccak256("s"));
    try y.publishNative(intentOf(selfY, 1, acts), noBodies(1)) {
      revert("must refuse a module sealed to another Ledger");
    } catch (bytes memory err) {
      expectSel(err, IndexNotAttached.selector, "foreign module");
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
