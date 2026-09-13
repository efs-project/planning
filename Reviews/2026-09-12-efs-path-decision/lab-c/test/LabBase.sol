// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Test helpers for the disposable Road C lab: fixture acceptors, the genuine producer
 * contract (AUTHOR_B), a fresh reader contract that reconstructs signatures from public
 * state, and a base contract with action/intent builders. Plain Solidity, `require`
 * assertions, no forge-std.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "../src/EfsTypes.sol";
import { Ledger } from "../src/Ledger.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { LensReader } from "../src/LensReader.sol";
import {
  Records,
  Admissions,
  AdmissionData,
  Evidence,
  EvidenceData,
  Bindings,
  Subjects
} from "../src/tables/LedgerTables.sol";
import { Occurrences } from "../src/tables/IndexTables.sol";
import { Vm, VM_ADDRESS } from "./Vm.sol";

// ---------------------------------------------------------------------------
// fixture acceptors (view-only developer acceptance)
// ---------------------------------------------------------------------------

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

/// Fixture rule v2 (sdk-fixture step 10 / destination rule): rejects mantissas above 2_500_000_000.
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

// ---------------------------------------------------------------------------
// AUTHOR_B: a genuine producer contract; it originates its own publications natively
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Fresh reader contract: reconstructs the signed digest from PUBLIC reads only
// (Evidence cell + Admission rows) and recovers the signer. Realm/code come from
// the retained cell, not from the Ledger being read.
// ---------------------------------------------------------------------------

contract EvidenceReconstructor {
  function actionsOf(IStoreRead ledger, bytes32 publicationId) public view returns (Action[] memory acts, EvidenceData memory ev) {
    ev = Evidence.get(ledger, publicationId);
    acts = new Action[](ev.leafCount);
    for (uint256 i = 0; i < ev.leafCount; i++) {
      AdmissionData memory ad = Admissions.get(ledger, ev.firstAdmission + uint64(i));
      require(ad.publicationId == publicationId, "row belongs to another publication");
      acts[i] = Action(
        ad.kind,
        ad.typeId,
        ad.digestKind,
        ad.digest,
        ad.purpose,
        ad.subject,
        ad.role,
        ad.target,
        ad.expectedRevision,
        ad.salt
      );
    }
  }

  function digestOf(Action[] memory acts, EvidenceData memory ev) public pure returns (bytes32 actionsHash, bytes32 digest) {
    actionsHash = keccak256(abi.encode(acts));
    digest = EfsIds.intentDigest(
      ev.realmId,
      ev.coreCodeCommitment,
      ev.author,
      ev.nonce,
      ev.deadline,
      ev.acceptanceProfile,
      ev.indexObligations,
      actionsHash
    );
  }

  function reconstruct(
    IStoreRead ledger,
    bytes32 publicationId
  ) external view returns (bytes32 digest, address signer, bytes32 actionsHash, EvidenceData memory ev) {
    Action[] memory acts;
    (acts, ev) = actionsOf(ledger, publicationId);
    (actionsHash, digest) = digestOf(acts, ev);
    require(actionsHash == ev.actionsHash, "actionsHash mismatch");
    signer = ev.proofKind == PROOF_EOA_SIG ? ecrecover(digest, ev.v, ev.r, ev.s) : address(0);
  }

  /// Negative control: flip the bodyHash-vs-recordId discriminator of one row and recompute.
  function reconstructFlipped(IStoreRead ledger, bytes32 publicationId, uint256 row) external view returns (bytes32 digest) {
    (Action[] memory acts, EvidenceData memory ev) = actionsOf(ledger, publicationId);
    acts[row].digestKind = acts[row].digestKind == DIGEST_BODY_HASH ? DIGEST_RECORD_ID : DIGEST_BODY_HASH;
    (, digest) = digestOf(acts, ev);
  }
}

// ---------------------------------------------------------------------------
// base test contract
// ---------------------------------------------------------------------------

abstract contract LabBase {
  Vm internal constant vm = Vm(VM_ADDRESS);

  uint256 internal constant PK_A = 0xA11CE;
  uint256 internal constant PK_I = 0x1F1F; // destination importer (not the author)
  bytes32 internal constant POISON = keccak256("poison");
  bytes32 internal constant SALT_F = keccak256("F");
  bytes32 internal constant SALT_G = keccak256("G");
  bytes32 internal constant SWAPS = keccak256("/swaps");
  bytes32 internal constant MARKETS = keccak256("/markets");
  bytes32 internal constant NAME = keccak256("eth-usdc");
  bytes32 internal constant NAME2 = keccak256("eth-usdt");
  bytes32 internal constant MARKET = keccak256("market");
  bytes32 internal constant NOTE = keccak256(hex"7265666572656e63652071756f7465"); // "reference quote"

  IndexModule internal index;
  Ledger internal ledger;
  LensReader internal reader;
  PassAcceptor internal passAcceptor;
  QuoteAcceptorV1 internal quoteAcceptor;
  Producer internal producer;

  address internal aAddr;
  bytes32 internal A; // AUTHOR_A principal (EOA, chain-independent)
  bytes32 internal B; // AUTHOR_B principal (producer contract, origin-qualified)
  bytes32 internal SELF; // this test contract's native principal
  uint64 internal nonceSelf;
  uint64 internal nonceA;
  uint64 internal nonceB;

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

  // ---- deployment ----------------------------------------------------------

  function _deployRealmWith(bytes32 poison) internal returns (IndexModule ix, Ledger lg, LensReader rd) {
    ix = new IndexModule(poison);
    lg = new Ledger(ix);
    ix.attach(address(lg));
    rd = new LensReader(IStoreRead(address(lg)), IStoreRead(address(ix)));
  }

  function _deployRealm() internal {
    passAcceptor = new PassAcceptor();
    quoteAcceptor = new QuoteAcceptorV1();
    producer = new Producer();
    aAddr = vm.addr(PK_A);
    A = EfsIds.eoaPrincipal(aAddr);
    (index, ledger, reader) = _deployRealmWith(POISON);
    SELF = EfsIds.contractPrincipal(ledger.realmOrigin(), address(this));
    B = producer.principal(ledger);
  }

  function L() internal view returns (IStoreRead) {
    return IStoreRead(address(ledger));
  }

  function X() internal view returns (IStoreRead) {
    return IStoreRead(address(index));
  }

  // ---- builders ------------------------------------------------------------

  function declareTypeAction(bytes memory body, address acceptor) internal pure returns (Action memory) {
    return
      Action(
        KIND_DECLARE_TYPE,
        TYPE_META,
        DIGEST_BODY_HASH,
        keccak256(body),
        bytes32(0),
        bytes32(0),
        bytes32(0),
        bytes32(uint256(uint160(acceptor))),
        0,
        bytes32(0)
      );
  }

  function recordAction(bytes32 typeId, bytes memory body) internal pure returns (Action memory) {
    return
      Action(
        KIND_RECORD,
        typeId,
        DIGEST_BODY_HASH,
        keccak256(body),
        bytes32(0),
        bytes32(0),
        bytes32(0),
        bytes32(0),
        0,
        bytes32(0)
      );
  }

  function reuseAction(bytes32 typeId, bytes32 recordId) internal pure returns (Action memory) {
    return
      Action(KIND_RECORD, typeId, DIGEST_RECORD_ID, recordId, bytes32(0), bytes32(0), bytes32(0), bytes32(0), 0, bytes32(0));
  }

  function subjectAction(bytes32 author, bytes32 salt) internal pure returns (Action memory) {
    return
      Action(
        KIND_SUBJECT,
        bytes32(0),
        0,
        bytes32(0),
        bytes32(0),
        EfsIds.subjectId(author, salt),
        bytes32(0),
        bytes32(0),
        0,
        salt
      );
  }

  function bindAction(
    bytes32 purpose,
    bytes32 subject,
    bytes32 role,
    bytes32 target,
    uint32 expectedRevision
  ) internal pure returns (Action memory) {
    return Action(KIND_BIND, bytes32(0), 0, bytes32(0), purpose, subject, role, target, expectedRevision, bytes32(0));
  }

  function intentOf(bytes32 author, uint64 nonce, Action[] memory actions) internal pure returns (Intent memory it) {
    it.author = author;
    it.nonce = nonce;
    it.deadline = 0;
    it.acceptanceProfile = ACCEPTANCE_PROFILE_V1;
    it.indexObligations = INDEX_OBLIGATIONS_V1;
    it.actions = actions;
  }

  function digestOf(Ledger lg, Intent memory it) internal view returns (bytes32) {
    return
      EfsIds.intentDigest(
        lg.realmId(),
        address(lg).codehash,
        it.author,
        it.nonce,
        it.deadline,
        it.acceptanceProfile,
        it.indexObligations,
        keccak256(abi.encode(it.actions))
      );
  }

  function signWith(uint256 pk, Ledger lg, Intent memory it) internal view returns (Sig memory s) {
    (s.v, s.r, s.s) = vm.sign(pk, digestOf(lg, it));
  }

  function typeBody(bytes32 shape, bytes32[] memory refTypes) internal pure returns (bytes memory) {
    return abi.encode(shape, refTypes);
  }

  function recordBody(bytes32[] memory refs, bytes memory payload) internal pure returns (bytes memory) {
    return abi.encode(refs, payload);
  }

  function quotePayload(uint256 mantissa) internal pure returns (bytes memory) {
    return abi.encode(mantissa, uint8(6), uint64(1_800_000_000), NOTE);
  }

  function quoteBody(bytes32 pair, uint256 mantissa) internal pure returns (bytes memory) {
    bytes32[] memory refs = new bytes32[](1);
    refs[0] = pair;
    return recordBody(refs, quotePayload(mantissa));
  }

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
    l.mode = 0;
  }

  function expectSel(bytes memory err, bytes4 sel, string memory what) internal pure {
    require(err.length >= 4 && bytes4(err) == sel, what);
  }

  // ---- fixture step 1: types, items, pair (native, from this contract) -----

  function _seedInto(Ledger lg, address quoteAcceptorAddr) internal {
    bytes32 self = EfsIds.contractPrincipal(lg.realmOrigin(), address(this));
    bytes32[] memory none = new bytes32[](0);
    bytes memory itemT = typeBody(keccak256("Item"), none);
    ITEM_T = EfsIds.recordId(TYPE_META, keccak256(itemT));
    bytes32[] memory two = new bytes32[](2);
    two[0] = ITEM_T;
    two[1] = ITEM_T;
    bytes memory pairT = typeBody(keccak256("Pair"), two);
    PAIR_T = EfsIds.recordId(TYPE_META, keccak256(pairT));
    bytes32[] memory one = new bytes32[](1);
    one[0] = PAIR_T;
    bytes memory quoteT = typeBody(keccak256("Quote"), one);
    QUOTE_T = EfsIds.recordId(TYPE_META, keccak256(quoteT));

    bytes memory eth = recordBody(none, bytes("ETH"));
    bytes memory usdc = recordBody(none, bytes("USDC"));
    ITEM_ETH = EfsIds.recordId(ITEM_T, keccak256(eth));
    ITEM_USDC = EfsIds.recordId(ITEM_T, keccak256(usdc));
    bytes32[] memory refs = new bytes32[](2);
    refs[0] = ITEM_ETH;
    refs[1] = ITEM_USDC;
    bytes memory pairB = recordBody(refs, bytes(""));
    PAIR = EfsIds.recordId(PAIR_T, keccak256(pairB));

    Action[] memory acts = new Action[](6);
    bytes[] memory bodies = new bytes[](6);
    acts[0] = declareTypeAction(itemT, address(passAcceptor));
    bodies[0] = itemT;
    acts[1] = declareTypeAction(pairT, address(passAcceptor));
    bodies[1] = pairT;
    acts[2] = declareTypeAction(quoteT, quoteAcceptorAddr);
    bodies[2] = quoteT;
    acts[3] = recordAction(ITEM_T, eth);
    bodies[3] = eth;
    acts[4] = recordAction(ITEM_T, usdc);
    bodies[4] = usdc;
    acts[5] = recordAction(PAIR_T, pairB); // ordered-prefix: sees the two Items admitted just before
    bodies[5] = pairB;
    lg.publishNative(intentOf(self, ++nonceSelf, acts), bodies);
  }

  function _seed() internal {
    _seedInto(ledger, address(quoteAcceptor));
  }

  // ---- fixture steps 2–4 ---------------------------------------------------

  function _a1Intent() internal view returns (Intent memory it, bytes[] memory bodies) {
    bytes memory b = quoteBody(PAIR, 2_500_000_000);
    Action[] memory acts = new Action[](5);
    bodies = new bytes[](5);
    acts[0] = subjectAction(A, SALT_F);
    acts[1] = recordAction(QUOTE_T, b);
    bodies[1] = b;
    acts[2] = bindAction(PURPOSE_HEAD, EfsIds.subjectId(A, SALT_F), bytes32(0), EfsIds.recordId(QUOTE_T, keccak256(b)), 0);
    acts[3] = bindAction(PURPOSE_FOLDER, SWAPS, NAME, EfsIds.subjectId(A, SALT_F), 0);
    acts[4] = bindAction(PURPOSE_TAG, EfsIds.subjectId(A, SALT_F), MARKET, TAG_ASSERT, 0);
    it = intentOf(A, 1, acts);
  }

  /// step 2: AUTHOR_A publishes QUOTE_A1 through the signed path (subject mint + record + head + placement + tag)
  function _a1() internal returns (bytes32 pubId) {
    FILE = EfsIds.subjectId(A, SALT_F);
    QUOTE_A1 = EfsIds.recordId(QUOTE_T, keccak256(quoteBody(PAIR, 2_500_000_000)));
    (Intent memory it, bytes[] memory bodies) = _a1Intent();
    nonceA = 1;
    (pubId, ) = ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it));
  }

  function _a2Intent() internal view returns (Intent memory it, bytes[] memory bodies) {
    bytes memory b = quoteBody(PAIR, 2_502_000_000);
    Action[] memory acts = new Action[](2);
    bodies = new bytes[](2);
    acts[0] = recordAction(QUOTE_T, b);
    bodies[0] = b;
    acts[1] = bindAction(PURPOSE_HEAD, FILE, bytes32(0), EfsIds.recordId(QUOTE_T, keccak256(b)), 1); // CAS against A1
    it = intentOf(A, 2, acts);
  }

  /// step 3: QUOTE_A2 with a CAS against QUOTE_A1
  function _a2() internal returns (bytes32 pubId) {
    QUOTE_A2 = EfsIds.recordId(QUOTE_T, keccak256(quoteBody(PAIR, 2_502_000_000)));
    (Intent memory it, bytes[] memory bodies) = _a2Intent();
    nonceA = 2;
    (pubId, ) = ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it));
  }

  /// step 4: AUTHOR_B (the producer contract) publishes QUOTE_B1 natively: record + its own head + its own placement
  function _b1() internal returns (bytes32 pubId) {
    bytes memory b = quoteBody(PAIR, 2_501_000_000);
    QUOTE_B1 = EfsIds.recordId(QUOTE_T, keccak256(b));
    Action[] memory acts = new Action[](3);
    bytes[] memory bodies = new bytes[](3);
    acts[0] = recordAction(QUOTE_T, b);
    bodies[0] = b;
    acts[1] = bindAction(PURPOSE_HEAD, FILE, bytes32(0), QUOTE_B1, 0);
    acts[2] = bindAction(PURPOSE_FOLDER, SWAPS, NAME, FILE, 0);
    (pubId, ) = producer.publish(ledger, intentOf(B, ++nonceB, acts), bodies);
  }

  /// A signs and publishes an arbitrary batch with her next nonce.
  function _publishA(Action[] memory acts, bytes[] memory bodies) internal returns (bytes32 pubId) {
    Intent memory it = intentOf(A, ++nonceA, acts);
    (pubId, ) = ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it));
  }

  // ---- export helpers (public reads only) ----------------------------------

  function _packetOf(Ledger src, bytes32 pubId) internal view returns (ImportPacket memory pkt) {
    IStoreRead s = IStoreRead(address(src));
    EvidenceData memory ev = Evidence.get(s, pubId);
    pkt.source = SourceEvidence(
      ev.realmId,
      ev.coreCodeCommitment,
      ev.author,
      ev.proofKind,
      ev.v,
      ev.r,
      ev.s,
      ev.nonce,
      ev.deadline,
      ev.acceptanceProfile,
      ev.indexObligations,
      ev.firstAdmission,
      ev.leafCount,
      ev.basis
    );
    pkt.actions = new Action[](ev.leafCount);
    pkt.bodies = new bytes[](ev.leafCount);
    for (uint256 i = 0; i < ev.leafCount; i++) {
      AdmissionData memory ad = Admissions.get(s, ev.firstAdmission + uint64(i));
      pkt.actions[i] = Action(
        ad.kind,
        ad.typeId,
        ad.digestKind,
        ad.digest,
        ad.purpose,
        ad.subject,
        ad.role,
        ad.target,
        ad.expectedRevision,
        ad.salt
      );
      if (ad.kind == KIND_RECORD && ad.digestKind == DIGEST_BODY_HASH) {
        (, , pkt.bodies[i]) = Records.get(s, EfsIds.recordId(ad.typeId, ad.digest));
      }
      if (ad.kind == KIND_DECLARE_TYPE) {
        (, , pkt.bodies[i]) = Records.get(s, EfsIds.recordId(TYPE_META, ad.digest));
      }
    }
  }

  function _authFor(bytes32 importer, uint64 nonce, ImportPacket memory pkt) internal pure returns (Intent memory) {
    Action[] memory acts = new Action[](1);
    acts[0] = Action(
      KIND_IMPORT,
      bytes32(0),
      DIGEST_PACKET,
      keccak256(abi.encode(pkt.source, pkt.actions)),
      bytes32(0),
      bytes32(0),
      bytes32(0),
      bytes32(0),
      0,
      bytes32(0)
    );
    return intentOf(importer, nonce, acts);
  }
}
