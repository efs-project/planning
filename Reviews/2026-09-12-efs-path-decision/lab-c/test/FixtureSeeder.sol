// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * FixtureSeeder: fixture ids, step 1 seeding (types + items + pair, native from this contract),
 * steps 2–4 (A1 signed, A2 CAS, B1 from the producer) and nonce counters. Uses FixtureBuilders and
 * FixtureActors externally. ESTIMATED runtime ≈ 9–12 KB.
 */

import "../src/EfsTypes.sol";
import { Ledger } from "../src/Ledger.sol";
import { FixtureBuilders } from "./FixtureBuilders.sol";
import { FixtureActors, Producer } from "./FixtureActors.sol";

contract FixtureSeeder {
  uint256 public constant PK_A = 0xA11CE;
  bytes32 public constant SALT_F = keccak256("F");
  bytes32 public constant SWAPS = keccak256("/swaps");
  bytes32 public constant NAME = keccak256("eth-usdc");
  bytes32 public constant MARKET = keccak256("market");

  FixtureBuilders public immutable b;
  FixtureActors public immutable actors;
  Ledger public immutable ledger;
  Producer public immutable producer;

  bytes32 public A;
  bytes32 public B;
  uint64 public nonceSelf;
  uint64 public nonceA;
  uint64 public nonceB;

  bytes32 public ITEM_T;
  bytes32 public PAIR_T;
  bytes32 public QUOTE_T;
  bytes32 public ITEM_ETH;
  bytes32 public ITEM_USDC;
  bytes32 public PAIR;
  bytes32 public FILE;
  bytes32 public QUOTE_A1;
  bytes32 public QUOTE_A2;
  bytes32 public QUOTE_B1;

  constructor(FixtureBuilders b_, FixtureActors actors_, Ledger ledger_, bytes32 a) {
    b = b_;
    actors = actors_;
    ledger = ledger_;
    producer = actors_.producer();
    A = a;
    B = producer.principal(ledger_);
    computeFixtureIds();
  }

  function nextNonceA() external returns (uint64) {
    return ++nonceA;
  }

  function nextNonceB() external returns (uint64) {
    return ++nonceB;
  }

  // ---- bodies ----------------------------------------------------------------

  function itemTypeBody() public view returns (bytes memory) {
    return b.typeBody(keccak256("Item"), new bytes32[](0), address(actors.passAcceptor()).codehash);
  }

  function pairTypeBody() public view returns (bytes memory) {
    bytes32[] memory two = new bytes32[](2);
    two[0] = ITEM_T;
    two[1] = ITEM_T;
    return b.typeBody(keccak256("Pair"), two, address(actors.passAcceptor()).codehash);
  }

  function quoteTypeBody() public view returns (bytes memory) {
    bytes32[] memory one = new bytes32[](1);
    one[0] = PAIR_T;
    return b.typeBody(keccak256("Quote"), one, address(actors.quoteAcceptor()).codehash);
  }

  function ethBody() public view returns (bytes memory) {
    return b.recordBody(new bytes32[](0), bytes("ETH"));
  }

  function usdcBody() public view returns (bytes memory) {
    return b.recordBody(new bytes32[](0), bytes("USDC"));
  }

  function pairBody() public view returns (bytes memory) {
    bytes32[] memory refs = new bytes32[](2);
    refs[0] = ITEM_ETH;
    refs[1] = ITEM_USDC;
    return b.recordBody(refs, bytes(""));
  }

  /// Content-derived fixture ids commit each default actor's immutable runtime,
  /// not its local address. A different selected rule must not silently change these bodies.
  function computeFixtureIds() public {
    ITEM_T = EfsIds.recordId(TYPE_META, keccak256(itemTypeBody()));
    PAIR_T = EfsIds.recordId(TYPE_META, keccak256(pairTypeBody()));
    QUOTE_T = EfsIds.recordId(TYPE_META, keccak256(quoteTypeBody()));
    ITEM_ETH = EfsIds.recordId(ITEM_T, keccak256(ethBody()));
    ITEM_USDC = EfsIds.recordId(ITEM_T, keccak256(usdcBody()));
    PAIR = EfsIds.recordId(PAIR_T, keccak256(pairBody()));
    FILE = EfsIds.subjectId(A, SALT_F);
    QUOTE_A1 = EfsIds.recordId(QUOTE_T, keccak256(b.quoteBody(PAIR, 2_500_000_000)));
    QUOTE_A2 = EfsIds.recordId(QUOTE_T, keccak256(b.quoteBody(PAIR, 2_502_000_000)));
    QUOTE_B1 = EfsIds.recordId(QUOTE_T, keccak256(b.quoteBody(PAIR, 2_501_000_000)));
  }

  // ---- step 1 -----------------------------------------------------------------

  function seedActions(address quoteAcceptorAddr) public view returns (Action[] memory acts, bytes[] memory bodies) {
    acts = new Action[](6);
    bodies = new bytes[](6);
    address pass = address(actors.passAcceptor());
    bodies[0] = itemTypeBody();
    acts[0] = b.declareTypeAction(bodies[0], pass);
    bodies[1] = pairTypeBody();
    acts[1] = b.declareTypeAction(bodies[1], pass);
    bodies[2] = quoteTypeBody(); // Always commits the default V1 rule, even when probing a substituted target.
    acts[2] = b.declareTypeAction(bodies[2], quoteAcceptorAddr);
    bodies[3] = ethBody();
    acts[3] = b.recordAction(ITEM_T, bodies[3]);
    bodies[4] = usdcBody();
    acts[4] = b.recordAction(ITEM_T, bodies[4]);
    bodies[5] = pairBody();
    acts[5] = b.recordAction(PAIR_T, bodies[5]); // ordered-prefix: sees the two Items admitted just before
  }

  function seedInto(Ledger lg, address quoteAcceptorAddr) public {
    (Action[] memory acts, bytes[] memory bodies) = seedActions(quoteAcceptorAddr);
    bytes32 self = EfsIds.contractPrincipal(lg.realmOrigin(), address(this));
    lg.publishNative(b.intentOf(self, ++nonceSelf, acts), bodies);
  }

  function seed() public {
    seedInto(ledger, address(actors.quoteAcceptor()));
  }

  // ---- steps 2–4 -----------------------------------------------------------

  function a1Intent() public view returns (Intent memory it, bytes[] memory bodies) {
    Action[] memory acts = new Action[](5);
    bodies = new bytes[](5);
    bodies[1] = b.quoteBody(PAIR, 2_500_000_000);
    acts[0] = b.subjectAction(A, SALT_F);
    acts[1] = b.recordAction(QUOTE_T, bodies[1]);
    acts[2] = b.bindAction(PURPOSE_HEAD, FILE, bytes32(0), QUOTE_A1, 0);
    acts[3] = b.bindAction(PURPOSE_FOLDER, SWAPS, NAME, FILE, 0);
    acts[4] = b.bindAction(PURPOSE_TAG, FILE, MARKET, TAG_ASSERT, 0);
    it = b.intentOf(A, 1, acts);
  }

  /// step 2: AUTHOR_A publishes QUOTE_A1 through the signed path (subject mint + record + head + placement + tag)
  function a1() public returns (bytes32 pubId) {
    (Intent memory it, bytes[] memory bodies) = a1Intent();
    nonceA = 1;
    (pubId, ) = ledger.publishSigned(it, bodies, b.signWith(PK_A, ledger, it));
  }

  function a2Intent() public view returns (Intent memory it, bytes[] memory bodies) {
    Action[] memory acts = new Action[](2);
    bodies = new bytes[](2);
    bodies[0] = b.quoteBody(PAIR, 2_502_000_000);
    acts[0] = b.recordAction(QUOTE_T, bodies[0]);
    acts[1] = b.bindAction(PURPOSE_HEAD, FILE, bytes32(0), QUOTE_A2, 1); // CAS against A1
    it = b.intentOf(A, 2, acts);
  }

  /// step 3: QUOTE_A2 with a CAS against QUOTE_A1
  function a2() public returns (bytes32 pubId) {
    (Intent memory it, bytes[] memory bodies) = a2Intent();
    nonceA = 2;
    (pubId, ) = ledger.publishSigned(it, bodies, b.signWith(PK_A, ledger, it));
  }

  /// step 4: AUTHOR_B (the producer contract) publishes QUOTE_B1 natively: record + its own head + its own placement
  function b1() public returns (bytes32 pubId) {
    Action[] memory acts = new Action[](3);
    bytes[] memory bodies = new bytes[](3);
    bodies[0] = b.quoteBody(PAIR, 2_501_000_000);
    acts[0] = b.recordAction(QUOTE_T, bodies[0]);
    acts[1] = b.bindAction(PURPOSE_HEAD, FILE, bytes32(0), QUOTE_B1, 0);
    acts[2] = b.bindAction(PURPOSE_FOLDER, SWAPS, NAME, FILE, 0);
    (pubId, ) = producer.publish(ledger, b.intentOf(B, ++nonceB, acts), bodies);
  }

  /// A signs and publishes an arbitrary batch with her next nonce.
  function publishA(Action[] memory acts, bytes[] memory bodies) public returns (bytes32 pubId) {
    Intent memory it = b.intentOf(A, ++nonceA, acts);
    (pubId, ) = ledger.publishSigned(it, bodies, b.signWith(PK_A, ledger, it));
  }

  function pubIdA1() public view returns (bytes32) {
    (Intent memory it, ) = a1Intent();
    return EfsIds.publicationId(A, 1, keccak256(abi.encode(it.actions)));
  }
}
