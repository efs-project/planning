// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../src/EfsTypes.sol";
import { CIncomingQuotesReader } from "../src/IncomingQuotesReader.sol";
import { LabBase } from "./LabBase.sol";
import { Deploy } from "./Deploy.sol";

abstract contract IncomingQuotesBase is LabBase {
  CIncomingQuotesReader internal incoming;
  bytes32 internal otherPair;
  bytes32 internal otherType;
  bytes32 internal a3;
  uint64 internal oldBasis;

  function setUp() public {
    _boot(true);
    incoming = _newReader(QUOTE_T, PAIR_T, address(quoteAcceptor).codehash);
  }

  function _newReader(bytes32 source, bytes32 targetType, bytes32 rule) internal returns (CIncomingQuotesReader) {
    return CIncomingQuotesReader(Deploy.deployArtifact("IncomingQuotesReader.sol:CIncomingQuotesReader",
      abi.encode(address(ledger), address(index), address(ledger).codehash, address(index).codehash, source, targetType, rule)));
  }

  function _empty() internal pure returns (CIncomingQuotesReader.Cursor memory c) {}

  function _publish(bytes32 t, bytes memory body) internal returns (bytes32 id) {
    Action[] memory acts = new Action[](1);
    acts[0] = recordAction(t, body);
    bytes[] memory bodies = new bytes[](1);
    bodies[0] = body;
    producer.publish(ledger, intentOf(B, seeder.nextNonceB(), acts), bodies);
    return EfsIds.recordId(t, keccak256(body));
  }

  function _reuse(bytes32 id) internal {
    Action[] memory acts = new Action[](1);
    acts[0] = reuseAction(QUOTE_T, id);
    producer.publish(ledger, intentOf(B, seeder.nextNonceB(), acts), noBodies(1));
  }

  function _declare(bytes32[] memory refs, address acceptor, bytes32 shape) internal returns (bytes32 id) {
    bytes memory body = builders.typeBody(shape, refs, acceptor.codehash);
    Action[] memory acts = new Action[](1);
    acts[0] = declareTypeAction(body, acceptor);
    bytes[] memory bodies = new bytes[](1);
    bodies[0] = body;
    producer.publish(ledger, intentOf(B, seeder.nextNonceB(), acts), bodies);
    return EfsIds.recordId(TYPE_META, keccak256(body));
  }

  function _fixture() internal {
    bytes32[] memory refs = new bytes32[](2);
    refs[0] = ITEM_USDC; refs[1] = ITEM_ETH;
    otherPair = _publish(PAIR_T, recordBody(refs, bytes("Q")));
    refs = new bytes32[](1); refs[0] = PAIR_T;
    otherType = _declare(refs, address(actors.passAcceptor()), keccak256("NonQuote"));
    _publish(QUOTE_T, quoteBody(otherPair, 101)); // U1
    _a1();
    _publish(QUOTE_T, quoteBody(otherPair, 102)); // U2
    _a2();
    _reuse(QUOTE_A1);
    _publish(QUOTE_T, quoteBody(otherPair, 103)); // U3
    _b1();
    for (uint256 i = 104; i <= 108; i++) _publish(QUOTE_T, quoteBody(otherPair, i));
    refs[0] = PAIR;
    _publish(otherType, recordBody(refs, bytes("R1")));
    oldBasis = ledger.highWater();
    a3 = _publish(QUOTE_T, quoteBody(PAIR, 2_503_000_000));
    _publish(QUOTE_T, quoteBody(otherPair, 109));
    _reuse(QUOTE_B1);
  }

}

contract IncomingQuotesTest is IncomingQuotesBase {
  // Removing fixed-header filtering, charging filtered entries, or retained history breaks this.
  function test_matchedOldAndCurrentRetainedIds() public {
    _fixture();
    _assertFixture(oldBasis, 3);
    _assertFixture(ledger.highWater(), 4);
  }

  function _assertFixture(uint64 basis, uint256 expected) internal view {
    CIncomingQuotesReader.Cursor memory cursor;
    bytes32[] memory all = new bytes32[](expected);
    uint256 count; uint256 scanned; uint256 pages;
    while (true) {
      CIncomingQuotesReader.Page memory page = incoming.incomingQuotes(PAIR, basis, 2, cursor);
      require(page.records.length <= 2, "candidate budget bounds output");
      require(page.bodyReads == 0, "discovery never fetches opaque framed bodies");
      require(page.headerReads == page.scanned, "logical header per charged candidate");
      require(page.rawTotal == 5, "includes filtered non-Quote R1");
      for (uint256 i; i < page.records.length; i++) all[count++] = page.records[i];
      scanned += page.scanned; pages++;
      cursor = page.next;
      if (page.status == 2) break;
      require(page.status == 1 && pages < 8 && scanned <= 16, "sealed bounded continuation");
    }
    require(count == expected && scanned == 5 && pages == 3, "matched retained set and charged future sentinel");
    require(all[0] == QUOTE_A1 && all[1] == QUOTE_A2 && all[2] == QUOTE_B1, "old basis A1,A2,B1, not non-Quote R1");
    if (expected == 4) require(all[3] == a3, "current adds A3");
    require(cursor.position == 5 && cursor.reader == address(incoming), "committed terminal cursor");
  }
}

contract IncomingQuotesDomainTest is IncomingQuotesBase {
  // Body canonicalization or body hydration would omit accepted records or trip the read guards.
  function test_acceptedTrailingAndNoncanonicalBodiesAreIncluded() public {
    bytes memory trailing = bytes.concat(quoteBody(PAIR, 201), bytes32(uint256(123)));
    bytes32 first = _publish(QUOTE_T, trailing);
    // Outer heads point to payload first (offset 64), then the one-reference array (offset 256).
    // A spare word at offset 224 is legal ABI padding; admission retains these exact bytes.
    bytes memory noncanonical = abi.encodePacked(uint256(256), uint256(64), uint256(128),
      quotePayload(202), bytes32(uint256(999)), uint256(1), PAIR);
    bytes32 second = _publish(QUOTE_T, noncanonical);
    _publish(QUOTE_T, trailing);
    _reuse(second);
    QueryVm(address(vm)).mockCallRevert(address(ledger), hex"419b58fd", bytes("no whole rows"));
    QueryVm(address(vm)).mockCallRevert(address(ledger), hex"cc49db7e", bytes("no whole rows"));
    QueryVm(address(vm)).mockCallRevert(address(ledger), hex"1e788977", bytes("no dynamic bodies"));
    CIncomingQuotesReader.Page memory page = incoming.incomingQuotes(PAIR, ledger.highWater(), 2, _empty());
    require(page.records.length == 2 && page.records[0] == first && page.records[1] == second, "accepted byte domain");
    require(page.rawTotal == 2 && page.scanned == 2 && page.headerReads == 2 && page.bodyReads == 0 && page.status == 2,
      "fresh-only postings with no body reads");
  }

  // Rejecting rawTotal > highWater or demanding strictly increasing filtered headers breaks this.
  function test_repeatedNonQuoteRefsMayExceedAdmissionCount() public {
    bytes32[] memory refs = new bytes32[](32);
    for (uint256 i; i < refs.length; i++) refs[i] = PAIR_T;
    bytes32 t = _declare(refs, address(actors.passAcceptor()), keccak256("RepeatedNonQuote"));
    bytes32 first = _publish(QUOTE_T, quoteBody(PAIR, 301));
    for (uint256 i; i < refs.length; i++) refs[i] = PAIR;
    _publish(t, recordBody(refs, bytes("repeated")));
    bytes32 last = _publish(QUOTE_T, quoteBody(PAIR, 302));
    CIncomingQuotesReader.Cursor memory cursor;
    uint256 count; uint256 scanned; uint256 pages;
    while (true) {
      CIncomingQuotesReader.Page memory page = incoming.incomingQuotes(PAIR, ledger.highWater(), 2, cursor);
      require(page.rawTotal == 34 && page.rawTotal > ledger.highWater(), "postings are not admissions");
      require(page.headerReads == page.scanned && page.bodyReads == 0, "charge every repeated candidate");
      for (uint256 i; i < page.records.length; i++) {
        require(page.records[i] == (count == 0 ? first : last), "only exact Quote IDs"); count++;
      }
      scanned += page.scanned; pages++; cursor = page.next;
      if (page.status == 2) break;
      require(pages < 17 && page.status == 1, "bounded repeated-reference auxiliary");
    }
    require(count == 2 && scanned == 34 && pages == 17, "all raw entries charged");
  }

  function test_maximumPageAndPaidConsumerCommitmentAbi() public {
    for (uint256 i; i < 64; i++) _publish(QUOTE_T, quoteBody(PAIR, 400 + i));
    CIncomingQuotesReader.Page memory page = incoming.incomingQuotes(PAIR, ledger.highWater(), 64, _empty());
    require(page.records.length == 64 && page.scanned == 64 && page.bodyReads == 0 && page.status == 2, "full page");
    require(abi.encode(page).length == 2688 && abi.encode(page).length <= 4096, "Page4096");
    IncomingQuotesPaidConsumer consumer = IncomingQuotesPaidConsumer(Deploy.deployArtifact("IncomingQuotes.t.sol:IncomingQuotesPaidConsumer", ""));
    CIncomingQuotesReader.Page memory paid = consumer.paidIncomingQuotes(incoming, PAIR, ledger.highWater(), 64, _empty());
    require(keccak256(abi.encode(paid)) == keccak256(abi.encode(page)), "common paid Page ABI");
  }
}

interface QueryVm {
  function mockCall(address callee, bytes calldata data, bytes calldata result) external;
  function mockCallRevert(address callee, bytes calldata data, bytes calldata reason) external;
  function clearMockedCalls() external;
  function etch(address target, bytes calldata code) external;
}

contract IncomingQuotesFailureTest is IncomingQuotesBase {
  function _reject(bytes32 pair, uint64 basis, uint32 budget, CIncomingQuotesReader.Cursor memory c) internal view {
    (bool ok,) = address(incoming).staticcall(abi.encodeCall(incoming.incomingQuotes, (pair, basis, budget, c)));
    require(!ok, "invalid query accepted");
  }

  function _mock(address target, bytes memory data, bytes memory result) internal {
    QueryVm(address(vm)).mockCall(target, data, result);
  }

  function test_invalidBasisBudgetPairAndEveryCursorCommitment() public {
    _fixture();
    uint64 basis = ledger.highWater();
    _reject(PAIR, 0, 2, _empty());
    _reject(PAIR, basis + 1, 2, _empty());
    _reject(PAIR, basis, 0, _empty());
    _reject(PAIR, basis, 65, _empty());
    _reject(ITEM_ETH, basis, 2, _empty());
    _reject(keccak256("missing pair"), basis, 2, _empty());
    _reject(PAIR, 5, 2, _empty());
    CIncomingQuotesReader.Page memory page = incoming.incomingQuotes(PAIR, basis, 2, _empty());
    bytes memory encoded = abi.encode(page.next);
    // All 12 ABI words are independently mutated; field 11 is out-of-range position.
    for (uint256 field; field < 12; field++) {
      bytes memory changed = bytes.concat(encoded);
      assembly ("memory-safe") {
        let at := add(add(changed, 32), mul(field, 32))
        mstore(at, xor(mload(at), 1))
      }
      CIncomingQuotesReader.Cursor memory c = abi.decode(changed, (CIncomingQuotesReader.Cursor));
      if (field == 11) c.position = page.rawTotal + 1;
      _reject(PAIR, basis, 2, c);
    }
    CIncomingQuotesReader other = _newReader(QUOTE_T, PAIR_T, address(quoteAcceptor).codehash);
    (bool ok,) = address(other).staticcall(abi.encodeCall(other.incomingQuotes, (PAIR, basis, uint32(2), page.next)));
    require(!ok, "same graph cross-reader replay rejected");
    CIncomingQuotesReader.Cursor memory half;
    half.position = 1;
    _reject(PAIR, basis, 2, half);
    _mock(address(index), abi.encodeWithSignature("generation()"), abi.encode(uint32(2)));
    _reject(PAIR, basis, 2, page.next);
    QueryVm(address(vm)).clearMockedCalls();
    vm.chainId(block.chainid + 1);
    _reject(PAIR, basis, 2, page.next);
  }

  function test_unknownPartialAndShortCoverageNeverComplete() public {
    _publish(QUOTE_T, quoteBody(PAIR, 501));
    uint64 basis = ledger.highWater();
    bytes memory callData = abi.encodeWithSignature("coverage(bytes32,bytes32)", index.FAMILY_BACKLINKS(), bytes32(0));
    for (uint256 variant; variant < 4; variant++) {
      uint8 status = variant == 0 ? 0 : variant == 1 ? 2 : 1;
      uint64 through = variant == 3 ? basis : basis - 1;
      _mock(address(index), callData, abi.encode(status, through));
      CIncomingQuotesReader.Page memory page = incoming.incomingQuotes(PAIR, basis, 2, _empty());
      require(page.records.length == 1 && page.next.position == 1, "qualified member regardless of coverage");
      require(page.status == (variant == 3 ? 2 : 1), "only covered end is complete");
      CIncomingQuotesReader.Page memory end = incoming.incomingQuotes(PAIR, basis, 2, page.next);
      require(end.records.length == 0 && end.scanned == 0 && end.status == page.status, "exhausted incomplete stays partial");
    }
  }

  // A future sentinel proves the query tail, but incomplete coverage cannot issue a COMPLETE cursor.
  function test_incompleteEarlyFutureTailKeepsNextUnexaminedPosition() public {
    _fixture();
    _publish(QUOTE_T, quoteBody(PAIR, 701));
    _publish(QUOTE_T, quoteBody(PAIR, 702));
    _mock(address(index), abi.encodeWithSignature("coverage(bytes32,bytes32)", index.FAMILY_BACKLINKS(), bytes32(0)),
      abi.encode(uint8(2), oldBasis - 1));
    CIncomingQuotesReader.Page memory prefix = incoming.incomingQuotes(PAIR, oldBasis, 4, _empty());
    require(prefix.status == 1 && prefix.next.position == 4, "old prefix partial");
    CIncomingQuotesReader.Page memory sentinel = incoming.incomingQuotes(PAIR, oldBasis, 1, prefix.next);
    require(sentinel.status == 1 && sentinel.rawTotal == 7 && sentinel.records.length == 0, "uncovered future tail partial");
    require(sentinel.scanned == 1 && sentinel.headerReads == 1 && sentinel.bodyReads == 0, "future sentinel charged");
    require(sentinel.next.position == 5, "PARTIAL keeps next unexamined position");
  }

  function test_runtimeAndReciprocalAttachmentRechecked() public {
    uint64 basis = ledger.highWater();
    bytes[4] memory calls = [abi.encodeWithSignature("index()"), abi.encodeWithSignature("indexCodehash()"),
      abi.encodeWithSignature("ledger()"), abi.encodeWithSignature("ledgerCodehash()")];
    for (uint256 i; i < calls.length; i++) {
      _mock(i < 2 ? address(ledger) : address(index), calls[i], abi.encode(bytes32(0)));
      _reject(PAIR, basis, 2, _empty());
      QueryVm(address(vm)).clearMockedCalls();
    }
    bytes memory code = address(index).code;
    QueryVm(address(vm)).etch(address(index), hex"00");
    _reject(PAIR, basis, 2, _empty());
    QueryVm(address(vm)).etch(address(index), code);
    QueryVm(address(vm)).etch(address(ledger), hex"00");
    _reject(PAIR, basis, 2, _empty());
  }

  function test_constructorRejectsWrongCodeAttachmentAndProfiles() public {
    (bool ok,) = address(this).call(abi.encodeCall(this.construct,
      (address(ledger), address(index), bytes32(0), address(index).codehash, QUOTE_T, PAIR_T, address(quoteAcceptor).codehash)));
    require(!ok, "independently expected ledger runtime required");
    (ok,) = address(this).call(abi.encodeCall(this.construct,
      (address(ledger), address(index), address(ledger).codehash, bytes32(0), QUOTE_T, PAIR_T, address(quoteAcceptor).codehash)));
    require(!ok, "independently expected index runtime required");
    bytes32[] memory refs = new bytes32[](2); refs[0] = ITEM_T; refs[1] = PAIR_T;
    bytes32 two = _declare(refs, address(quoteAcceptor), keccak256("Quote at another ordinal"));
    _rejectProfile(two, PAIR_T, address(quoteAcceptor).codehash);
    _rejectProfile(QUOTE_T, PAIR_T, address(actors.passAcceptor()).codehash);
    _rejectProfile(QUOTE_T, ITEM_T, address(quoteAcceptor).codehash);
    _rejectProfile(keccak256("unknown Type"), PAIR_T, address(quoteAcceptor).codehash);
    _mock(address(index), abi.encodeWithSignature("ledger()"), abi.encode(address(0)));
    _rejectProfile(QUOTE_T, PAIR_T, address(quoteAcceptor).codehash);
    QueryVm(address(vm)).clearMockedCalls();
    QueryVm(address(vm)).etch(address(quoteAcceptor), hex"00");
    _reject(PAIR, ledger.highWater(), 2, _empty());
  }

  function _rejectProfile(bytes32 source, bytes32 target, bytes32 rule) internal {
    (bool ok,) = address(this).call(abi.encodeCall(this.construct,
      (address(ledger), address(index), address(ledger).codehash, address(index).codehash, source, target, rule)));
    require(!ok, "unsafe Type profile accepted");
  }

  function construct(address lg, address ix, bytes32 lh, bytes32 ih, bytes32 source, bytes32 target, bytes32 rule)
    external returns (address)
  {
    return Deploy.deployArtifact("IncomingQuotesReader.sol:CIncomingQuotesReader", abi.encode(lg, ix, lh, ih, source, target, rule));
  }

  function test_missingAndBeyondHighWaterHeadersRejected() public {
    bytes32 id = _publish(QUOTE_T, quoteBody(PAIR, 601));
    bytes32[] memory key = new bytes32[](1); key[0] = id;
    bytes memory data = abi.encodeWithSelector(bytes4(0x8c364d59),
      bytes32(0x746265667300000000000000000000005265636f726473000000000000000000), key, uint8(1),
      bytes32(0x0028020120080000000000000000000000000000000000000000000000000000));
    uint64 basis = ledger.highWater();
    _mock(address(ledger), data, abi.encode(bytes32(0)));
    _reject(PAIR, basis, 2, _empty());
    _mock(address(ledger), data, abi.encode(bytes32(bytes8(basis + 1))));
    _reject(PAIR, basis, 2, _empty());
  }

  function test_postingCountMustFitUint64() public {
    bytes32[] memory key = new bytes32[](1); key[0] = PAIR;
    _mock(address(index), abi.encodeWithSelector(bytes4(0xdbbf0e21),
      bytes32(0x746265667369647800000000000000004261636b6c696e6b7300000000000000), key, uint8(0)),
      abi.encode((uint256(type(uint64).max) + 1) * 32));
    _reject(PAIR, ledger.highWater(), 2, _empty());
  }
}

/// Root-owned paid runner artifact; unit calls are not paid transaction measurements.
contract IncomingQuotesPaidConsumer {
  event PageRead(bytes32 commitment);
  function paidIncomingQuotes(CIncomingQuotesReader reader, bytes32 pair, uint64 basis, uint32 budget,
    CIncomingQuotesReader.Cursor calldata cursor) external returns (CIncomingQuotesReader.Page memory page)
  {
    page = reader.incomingQuotes(pair, basis, budget, cursor);
    emit PageRead(keccak256(abi.encode(page)));
  }
}
