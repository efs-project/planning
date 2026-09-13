// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * FixtureActors: the fixture acceptors and the genuine producer contract (AUTHOR_B), deployed by a
 * small helper so their creation code is embedded here only. ESTIMATED runtime ≈ 10–12 KB.
 */

import "../src/EfsTypes.sol";
import { Ledger } from "../src/Ledger.sol";

contract PassAcceptor is IAcceptor {
  function accept(bytes32, bytes32, bytes32[] calldata, bytes calldata) external pure returns (bytes4) {
    return ACCEPT_MAGIC;
  }
}

/// Fixture rule v1: exactly one checked reference (the Pair), payload = (mantissa, scale, observedAt, note).
contract QuoteAcceptorV1 is IAcceptor {
  uint256 public constant MAX_MANTISSA = 10_000_000_000;

  function accept(bytes32, bytes32, bytes32[] calldata refs, bytes calldata payload) external pure returns (bytes4) {
    if (refs.length != 1 || payload.length != 128) return bytes4(0);
    (uint256 mantissa, uint8 scale, uint64 observedAt, ) = abi.decode(payload, (uint256, uint8, uint64, bytes32));
    require(scale == 6, "quote: scale must be 6");
    require(mantissa != 0 && mantissa <= MAX_MANTISSA, "quote: mantissa out of bounds");
    require(observedAt != 0, "quote: observation required");
    return ACCEPT_MAGIC;
  }
}

/// Different mandatory rule: rejects mantissas above 2_500_000_000. It is a different exact Type,
/// not an additive destination policy that may replace V1 under the same Type identity.
contract QuoteAcceptorV2 is IAcceptor {
  uint256 public constant MAX_MANTISSA = 2_500_000_000;

  function accept(bytes32, bytes32, bytes32[] calldata refs, bytes calldata payload) external pure returns (bytes4) {
    if (refs.length != 1 || payload.length != 128) return bytes4(0);
    (uint256 mantissa, uint8 scale, uint64 observedAt, ) = abi.decode(payload, (uint256, uint8, uint64, bytes32));
    require(scale == 6, "quote: scale must be 6");
    require(mantissa != 0 && mantissa <= MAX_MANTISSA, "quote v2: mantissa above 2.5e9");
    require(observedAt != 0, "quote: observation required");
    return ACCEPT_MAGIC;
  }
}

/// AUTHOR_B: a genuine producer contract; it originates its own publications natively.
contract Producer {
  function principal(Ledger lg) public view returns (bytes32) {
    return EfsIds.contractPrincipal(lg.realmOrigin(), address(this));
  }

  function publish(Ledger lg, Intent memory intent, bytes[] memory bodies) external returns (bytes32, uint64) {
    return lg.publishNative(intent, bodies);
  }

  function importInto(Ledger lg, ImportPacket memory pkt, Intent memory auth) external returns (bytes32, bytes32) {
    return lg.importPublication(pkt, auth, Sig(0, bytes32(0), bytes32(0)));
  }

  /// The test-only mutable account-authentication probe (sdk-fixture AUTHOR_B). Never a historical witness.
  bool public probeApproves = true;

  function flipProbe() external {
    probeApproves = !probeApproves;
  }
}

contract FixtureActors {
  PassAcceptor public passAcceptor;
  QuoteAcceptorV1 public quoteAcceptor;
  Producer public producer;

  constructor() {
    passAcceptor = new PassAcceptor();
    quoteAcceptor = new QuoteAcceptorV1();
    producer = new Producer();
  }

  function newQuoteAcceptorV2() external returns (address) {
    return address(new QuoteAcceptorV2());
  }
}
