// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * MeasurementFixture: the measurement-local B1 of the sealed paid point/list slice (sdk-fixture appendix):
 * AUTHOR_B (the genuine Producer contract) admits QUOTE_B1 and binds ITS OWN HEAD only — no FOLDER bind, so the
 * post-B1 state holds exactly one placement (A's, from A1). It sits ALONGSIDE the broader FixtureSeeder.b1()
 * (record + head + B's own placement), which the two-placement tests keep using unchanged. Deployed from its
 * artifact (test/Deploy.sol) like every other helper. ESTIMATED runtime < 2 KB.
 */

import "../src/EfsTypes.sol";
import { FixtureBuilders } from "./FixtureBuilders.sol";
import { FixtureSeeder } from "./FixtureSeeder.sol";

contract MeasurementFixture {
  FixtureSeeder public immutable seeder;

  constructor(FixtureSeeder seeder_) {
    seeder = seeder_;
  }

  /// step 4 of the sealed slice: QUOTE_B1 + B's competing HEAD; a content head only, never a second placement.
  function b1HeadOnly() public returns (bytes32 pubId) {
    FixtureBuilders b = seeder.b();
    Action[] memory acts = new Action[](2);
    bytes[] memory bodies = new bytes[](2);
    bodies[0] = b.quoteBody(seeder.PAIR(), 2_501_000_000);
    acts[0] = b.recordAction(seeder.QUOTE_T(), bodies[0]);
    acts[1] = b.bindAction(PURPOSE_HEAD, seeder.FILE(), bytes32(0), seeder.QUOTE_B1(), 0);
    (pubId, ) = seeder.producer().publish(seeder.ledger(), b.intentOf(seeder.B(), seeder.nextNonceB(), acts), bodies);
  }
}
