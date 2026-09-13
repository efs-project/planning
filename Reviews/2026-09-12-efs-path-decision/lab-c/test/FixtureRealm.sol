// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * FixtureRealm: deploys Realms (ImportLib → IndexModule → Ledger (linked) → attach → LensReader)
 * from artifact bytecode, never by `new`, so it embeds no creation code. It is the DEPLOYER of every
 * IndexModule it creates, hence the only party that may `attach`: the denial tests route every
 * attach through `attachAs` (the deployer/admin context), never from a test contract's own address.
 * ESTIMATED runtime ≈ 6–8 KB.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import { Ledger } from "../src/Ledger.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { LensReader } from "../src/LensReader.sol";
import { Deploy } from "./Deploy.sol";

contract FixtureRealm {
  address public importLib; // one stateless library instance is linked into every Ledger deployed here

  function _lib() internal returns (address) {
    if (importLib == address(0)) importLib = Deploy.deployArtifact("ImportLib.sol:ImportLib", "");
    return importLib;
  }

  function newIndex(bytes32 poison) public returns (IndexModule) {
    return IndexModule(Deploy.deployArtifact("IndexModule.sol:IndexModule", abi.encode(poison)));
  }

  /// Bubbles the Ledger constructor's custom errors (BadAttachment) to the caller.
  function newLedger(address index) public returns (Ledger) {
    address lib = _lib();
    Ledger ledger = Ledger(Deploy.create(abi.encodePacked(Deploy.linkedLedgerCode(lib), abi.encode(index))));
    Deploy.assertLedgerLinked(address(ledger), lib);
    return ledger;
  }

  function newReader(address ledger, address index) public returns (LensReader) {
    return LensReader(Deploy.deployArtifact("LensReader.sol:LensReader", abi.encode(ledger, index)));
  }

  /// Deployer-context attach (this contract deployed the module); reverts bubble to the caller.
  function attachAs(IndexModule ix, address ledger) public {
    ix.attach(ledger);
  }

  function deployRealm(bytes32 poison) public returns (IndexModule ix, Ledger lg, LensReader rd) {
    ix = newIndex(poison);
    lg = newLedger(address(ix));
    ix.attach(address(lg));
    rd = newReader(address(lg), address(ix));
  }
}
