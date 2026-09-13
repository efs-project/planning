// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Thin base for the test contracts (EIP-170 / EIP-3860 on the test side). Every helper is deployed
 * from artifact bytecode (test/Deploy.sol) so no creation code is embedded in any test contract, and
 * heavy logic lives in the five deployed helpers; the wrappers below are one-line external calls so
 * test bodies keep their original names.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "../src/EfsTypes.sol";
import { Ledger } from "../src/Ledger.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { LensReader } from "../src/LensReader.sol";
import { Vm, VM_ADDRESS } from "./Vm.sol";
import { Deploy } from "./Deploy.sol";
import { FixtureActors, Producer, QuoteAcceptorV1 } from "./FixtureActors.sol";
import { FixtureBuilders } from "./FixtureBuilders.sol";
import { FixtureRealm } from "./FixtureRealm.sol";
import { FixtureSeeder } from "./FixtureSeeder.sol";
import { FixtureExport } from "./FixtureExport.sol";

abstract contract LabBase {
  Vm internal constant vm = Vm(VM_ADDRESS);

  uint256 internal constant PK_A = 0xA11CE;
  uint256 internal constant PK_I = 0x1F1F;
  bytes32 internal constant POISON = keccak256("poison");
  bytes32 internal constant SALT_F = keccak256("F");
  bytes32 internal constant SALT_G = keccak256("G");
  bytes32 internal constant SWAPS = keccak256("/swaps");
  bytes32 internal constant MARKETS = keccak256("/markets");
  bytes32 internal constant NAME = keccak256("eth-usdc");
  bytes32 internal constant NAME2 = keccak256("eth-usdt");
  bytes32 internal constant MARKET = keccak256("market");

  FixtureActors internal actors;
  FixtureBuilders internal builders;
  FixtureRealm internal realm;
  FixtureSeeder internal seeder;
  FixtureExport internal export;

  IndexModule internal index;
  Ledger internal ledger;
  LensReader internal reader;
  Producer internal producer;
  QuoteAcceptorV1 internal quoteAcceptor;

  address internal aAddr;
  bytes32 internal A;
  bytes32 internal B;
  bytes32 internal ITEM_T;
  bytes32 internal PAIR_T;
  bytes32 internal QUOTE_T;
  bytes32 internal ITEM_ETH;
  bytes32 internal ITEM_USDC;
  bytes32 internal PAIR;
  bytes32 internal FILE;
  bytes32 internal QUOTE_A1;
  bytes32 internal QUOTE_A2;
  bytes32 internal QUOTE_B1;

  function _boot(bool seed) internal {
    actors = FixtureActors(Deploy.deployArtifact("FixtureActors.sol:FixtureActors", ""));
    builders = FixtureBuilders(Deploy.deployArtifact("FixtureBuilders.sol:FixtureBuilders", ""));
    realm = FixtureRealm(Deploy.deployArtifact("FixtureRealm.sol:FixtureRealm", ""));
    (index, ledger, reader) = realm.deployRealm(POISON);
    aAddr = vm.addr(PK_A);
    A = EfsIds.eoaPrincipal(aAddr);
    seeder = FixtureSeeder(
      Deploy.deployArtifact("FixtureSeeder.sol:FixtureSeeder", abi.encode(address(builders), address(actors), address(ledger), A))
    );
    export = FixtureExport(
      Deploy.deployArtifact("FixtureExport.sol:FixtureExport", abi.encode(address(builders), address(seeder), address(ledger)))
    );
    producer = actors.producer();
    quoteAcceptor = actors.quoteAcceptor();
    B = seeder.B();
    ITEM_T = seeder.ITEM_T();
    PAIR_T = seeder.PAIR_T();
    QUOTE_T = seeder.QUOTE_T();
    ITEM_ETH = seeder.ITEM_ETH();
    ITEM_USDC = seeder.ITEM_USDC();
    PAIR = seeder.PAIR();
    FILE = seeder.FILE();
    QUOTE_A1 = seeder.QUOTE_A1();
    QUOTE_A2 = seeder.QUOTE_A2();
    QUOTE_B1 = seeder.QUOTE_B1();
    if (seed) seeder.seed();
  }

  function L() internal view returns (IStoreRead) {
    return IStoreRead(address(ledger));
  }

  function X() internal view returns (IStoreRead) {
    return IStoreRead(address(index));
  }

  // ---- wrappers (external calls into the helpers; nothing heavy is inlined here) ----

  function _deployRealmWith(bytes32 poison) internal returns (IndexModule, Ledger, LensReader) {
    return realm.deployRealm(poison);
  }

  function _seedInto(Ledger lg, address acceptor) internal {
    seeder.seedInto(lg, acceptor);
  }

  function _a1() internal returns (bytes32) {
    return seeder.a1();
  }

  function _a2() internal returns (bytes32) {
    return seeder.a2();
  }

  function _b1() internal returns (bytes32) {
    return seeder.b1();
  }

  function _publishA(Action[] memory acts, bytes[] memory bodies) internal returns (bytes32) {
    return seeder.publishA(acts, bodies);
  }

  function _a1Intent() internal view returns (Intent memory, bytes[] memory) {
    return seeder.a1Intent();
  }

  function _a2Intent() internal view returns (Intent memory, bytes[] memory) {
    return seeder.a2Intent();
  }

  function _pubIdA1() internal view returns (bytes32) {
    return seeder.pubIdA1();
  }

  function _packetOf(Ledger src, bytes32 pubId) internal view returns (ImportPacket memory) {
    return export.packetOf(src, pubId);
  }

  function _authFor(bytes32 importer, uint64 nonce, ImportPacket memory pkt) internal view returns (Intent memory) {
    return builders.authFor(importer, nonce, pkt);
  }

  function _importA1Into(Ledger dst, bytes32 importer, uint64 nonce) internal returns (bytes32, bytes32) {
    return export.importA1Into(dst, importer, nonce);
  }

  function declareTypeAction(bytes memory body, address acceptor) internal view returns (Action memory) {
    return builders.declareTypeAction(body, acceptor);
  }

  function recordAction(bytes32 typeId, bytes memory body) internal view returns (Action memory) {
    return builders.recordAction(typeId, body);
  }

  function reuseAction(bytes32 typeId, bytes32 recordId) internal view returns (Action memory) {
    return builders.reuseAction(typeId, recordId);
  }

  function subjectAction(bytes32 author, bytes32 salt) internal view returns (Action memory) {
    return builders.subjectAction(author, salt);
  }

  function bindAction(
    bytes32 purpose,
    bytes32 subject,
    bytes32 role,
    bytes32 target,
    uint32 expectedRevision
  ) internal view returns (Action memory) {
    return builders.bindAction(purpose, subject, role, target, expectedRevision);
  }

  function intentOf(bytes32 author, uint64 nonce, Action[] memory actions) internal view returns (Intent memory) {
    return builders.intentOf(author, nonce, actions);
  }

  function digestOf(Ledger lg, Intent memory it) internal view returns (bytes32) {
    return builders.digestOf(lg, it);
  }

  function signWith(uint256 pk, Ledger lg, Intent memory it) internal view returns (Sig memory) {
    return builders.signWith(pk, lg, it);
  }

  function recordBody(bytes32[] memory refs, bytes memory payload) internal view returns (bytes memory) {
    return builders.recordBody(refs, payload);
  }

  function quotePayload(uint256 mantissa) internal view returns (bytes memory) {
    return builders.quotePayload(mantissa);
  }

  function quoteBody(bytes32 pair, uint256 mantissa) internal view returns (bytes memory) {
    return builders.quoteBody(pair, mantissa);
  }

  // ---- tiny pure helpers -------------------------------------------------------

  function noBodies(uint256 n) internal pure returns (bytes[] memory b) {
    b = new bytes[](n);
  }

  function zeroCursor() internal pure returns (LensReader.Cursor memory c) {}

  function lensOf(bytes32 p0, bytes32 p1, uint8 mode) internal pure returns (LensReader.Lens memory l) {
    l.principals = new bytes32[](2);
    l.principals[0] = p0;
    l.principals[1] = p1;
    l.mode = mode;
  }

  function lensOne(bytes32 p0) internal pure returns (LensReader.Lens memory l) {
    l.principals = new bytes32[](1);
    l.principals[0] = p0;
  }

  function expectSel(bytes memory err, bytes4 sel, string memory what) internal pure {
    require(err.length >= 4 && bytes4(err) == sel, what);
  }
}
