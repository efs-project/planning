// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Fixture: a SEPARATELY DEPLOYED helper (EIP-3860 fix — the test contracts' initcode exceeded
 * 49,152 bytes when every builder, decoder and seeding routine was inlined into them). It owns
 * the realm deployment, fixture ids, action/intent builders, signing, seeding (steps 1–4) and the
 * export helpers. Test contracts call it externally, so none of this code is inlined into them.
 * Also hosts the fixture acceptors, the producer contract and the SELF-CHECK reconstructor.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "../src/EfsTypes.sol";
import { Ledger } from "../src/Ledger.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { LensReader } from "../src/LensReader.sol";
import { Records, Admissions, AdmissionData, Evidence, EvidenceData } from "../src/tables/LedgerTables.sol";
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
// SELF-CHECK reader: re-derives the signed digest from public reads (Evidence cell + Admission
// rows) with the candidate's own table decoders and EfsIds.intentDigest. A consistency self-check
// of the candidate, NOT the independent oracle (raw-bytes re-derivation is owed).
// ---------------------------------------------------------------------------

contract EvidenceReconstructor {
  function actionFrom(AdmissionData memory ad) public pure returns (Action memory a) {
    a.kind = ad.kind;
    a.typeId = ad.typeId;
    a.digestKind = ad.digestKind;
    a.digest = ad.digest;
    a.purpose = ad.purpose;
    a.subject = ad.subject;
    a.role = ad.role;
    a.target = ad.target;
    a.expectedRevision = ad.expectedRevision;
    a.salt = ad.salt;
  }

  function actionsOf(IStoreRead ledger, bytes32 publicationId) public view returns (Action[] memory acts, EvidenceData memory ev) {
    ev = Evidence.get(ledger, publicationId);
    acts = new Action[](ev.leafCount);
    for (uint256 i = 0; i < ev.leafCount; i++) {
      AdmissionData memory ad = Admissions.get(ledger, ev.firstAdmission + uint64(i));
      require(ad.publicationId == publicationId, "row belongs to another publication");
      acts[i] = actionFrom(ad);
    }
  }

  function digestOf(Action[] memory acts, EvidenceData memory ev) public pure returns (bytes32 actionsHash, bytes32 digest) {
    actionsHash = keccak256(abi.encode(acts));
    DigestInput memory d;
    d.realmId = ev.realmId;
    d.coreCodeCommitment = ev.coreCodeCommitment;
    d.author = ev.author;
    d.nonce = ev.nonce;
    d.deadline = ev.deadline;
    d.acceptanceProfile = ev.acceptanceProfile;
    d.indexObligations = ev.indexObligations;
    d.actionsHash = actionsHash;
    digest = EfsIds.intentDigest(d);
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
// the deployed fixture
// ---------------------------------------------------------------------------

contract Fixture {
  Vm internal constant vm = Vm(VM_ADDRESS);

  uint256 public constant PK_A = 0xA11CE;
  uint256 public constant PK_I = 0x1F1F; // destination importer (not the author)
  bytes32 public constant POISON = keccak256("poison");
  bytes32 public constant SALT_F = keccak256("F");
  bytes32 public constant SALT_G = keccak256("G");
  bytes32 public constant SWAPS = keccak256("/swaps");
  bytes32 public constant MARKETS = keccak256("/markets");
  bytes32 public constant NAME = keccak256("eth-usdc");
  bytes32 public constant NAME2 = keccak256("eth-usdt");
  bytes32 public constant MARKET = keccak256("market");
  bytes32 public constant NOTE = keccak256(hex"7265666572656e63652071756f7465"); // "reference quote"

  IndexModule public index;
  Ledger public ledger;
  LensReader public reader;
  PassAcceptor public passAcceptor;
  QuoteAcceptorV1 public quoteAcceptor;
  Producer public producer;

  address public aAddr;
  bytes32 public A; // AUTHOR_A principal (EOA, chain-independent)
  bytes32 public B; // AUTHOR_B principal (producer contract, deployment-qualified)
  bytes32 public SELF; // this fixture's native principal on `ledger`
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

  constructor() {
    passAcceptor = new PassAcceptor();
    quoteAcceptor = new QuoteAcceptorV1();
    producer = new Producer();
    aAddr = vm.addr(PK_A);
    A = EfsIds.eoaPrincipal(aAddr);
    (index, ledger, reader) = deployRealmWith(POISON);
    SELF = EfsIds.contractPrincipal(ledger.realmOrigin(), address(this));
    B = producer.principal(ledger);
    computeFixtureIds();
  }

  function deployRealmWith(bytes32 poison) public returns (IndexModule ix, Ledger lg, LensReader rd) {
    ix = new IndexModule(poison);
    lg = new Ledger(ix);
    ix.attach(address(lg));
    rd = new LensReader(IStoreRead(address(lg)), IStoreRead(address(ix)));
  }

  function nextNonceA() external returns (uint64) {
    return ++nonceA;
  }

  function nextNonceB() external returns (uint64) {
    return ++nonceB;
  }

  // ---- builders --------------------------------------------------------------

  function declareTypeAction(bytes memory body, address acceptor) public pure returns (Action memory a) {
    a.kind = KIND_DECLARE_TYPE;
    a.typeId = TYPE_META;
    a.digestKind = DIGEST_BODY_HASH;
    a.digest = keccak256(body);
    a.target = bytes32(uint256(uint160(acceptor)));
  }

  function recordAction(bytes32 typeId, bytes memory body) public pure returns (Action memory a) {
    a.kind = KIND_RECORD;
    a.typeId = typeId;
    a.digestKind = DIGEST_BODY_HASH;
    a.digest = keccak256(body);
  }

  function reuseAction(bytes32 typeId, bytes32 recordId) public pure returns (Action memory a) {
    a.kind = KIND_RECORD;
    a.typeId = typeId;
    a.digestKind = DIGEST_RECORD_ID;
    a.digest = recordId;
  }

  function subjectAction(bytes32 author, bytes32 salt) public pure returns (Action memory a) {
    a.kind = KIND_SUBJECT;
    a.subject = EfsIds.subjectId(author, salt);
    a.salt = salt;
  }

  function bindAction(
    bytes32 purpose,
    bytes32 subject,
    bytes32 role,
    bytes32 target,
    uint32 expectedRevision
  ) public pure returns (Action memory a) {
    a.kind = KIND_BIND;
    a.purpose = purpose;
    a.subject = subject;
    a.role = role;
    a.target = target;
    a.expectedRevision = expectedRevision;
  }

  function intentOf(bytes32 author, uint64 nonce, Action[] memory actions) public pure returns (Intent memory it) {
    it.author = author;
    it.nonce = nonce;
    it.acceptanceProfile = ACCEPTANCE_PROFILE_V1;
    it.indexObligations = INDEX_OBLIGATIONS_V1;
    it.actions = actions;
  }

  function digestOf(Ledger lg, Intent memory it) public view returns (bytes32) {
    DigestInput memory d;
    d.realmId = lg.realmId();
    d.coreCodeCommitment = address(lg).codehash;
    d.author = it.author;
    d.nonce = it.nonce;
    d.deadline = it.deadline;
    d.acceptanceProfile = it.acceptanceProfile;
    d.indexObligations = it.indexObligations;
    d.actionsHash = keccak256(abi.encode(it.actions));
    return EfsIds.intentDigest(d);
  }

  function signWith(uint256 pk, Ledger lg, Intent memory it) public view returns (Sig memory s) {
    (s.v, s.r, s.s) = vm.sign(pk, digestOf(lg, it));
  }

  function typeBody(bytes32 shape, bytes32[] memory refTypes) public pure returns (bytes memory) {
    return abi.encode(shape, refTypes);
  }

  function recordBody(bytes32[] memory refs, bytes memory payload) public pure returns (bytes memory) {
    return abi.encode(refs, payload);
  }

  function quotePayload(uint256 mantissa) public pure returns (bytes memory) {
    return abi.encode(mantissa, uint8(6), uint64(1_800_000_000), NOTE);
  }

  function quoteBody(bytes32 pair, uint256 mantissa) public pure returns (bytes memory) {
    bytes32[] memory refs = new bytes32[](1);
    refs[0] = pair;
    return recordBody(refs, quotePayload(mantissa));
  }

  // ---- step 1: types, items, pair ------------------------------------------

  function itemTypeBody() public pure returns (bytes memory) {
    return typeBody(keccak256("Item"), new bytes32[](0));
  }

  function pairTypeBody() public view returns (bytes memory) {
    bytes32[] memory two = new bytes32[](2);
    two[0] = ITEM_T;
    two[1] = ITEM_T;
    return typeBody(keccak256("Pair"), two);
  }

  function quoteTypeBody() public view returns (bytes memory) {
    bytes32[] memory one = new bytes32[](1);
    one[0] = PAIR_T;
    return typeBody(keccak256("Quote"), one);
  }

  function ethBody() public pure returns (bytes memory) {
    return recordBody(new bytes32[](0), bytes("ETH"));
  }

  function usdcBody() public pure returns (bytes memory) {
    return recordBody(new bytes32[](0), bytes("USDC"));
  }

  function pairBody() public view returns (bytes memory) {
    bytes32[] memory refs = new bytes32[](2);
    refs[0] = ITEM_ETH;
    refs[1] = ITEM_USDC;
    return recordBody(refs, bytes(""));
  }

  /// Content-derived fixture ids (the acceptor address is not part of typeId).
  function computeFixtureIds() public {
    ITEM_T = EfsIds.recordId(TYPE_META, keccak256(itemTypeBody()));
    PAIR_T = EfsIds.recordId(TYPE_META, keccak256(pairTypeBody()));
    QUOTE_T = EfsIds.recordId(TYPE_META, keccak256(quoteTypeBody()));
    ITEM_ETH = EfsIds.recordId(ITEM_T, keccak256(ethBody()));
    ITEM_USDC = EfsIds.recordId(ITEM_T, keccak256(usdcBody()));
    PAIR = EfsIds.recordId(PAIR_T, keccak256(pairBody()));
    FILE = EfsIds.subjectId(A, SALT_F);
    QUOTE_A1 = EfsIds.recordId(QUOTE_T, keccak256(quoteBody(PAIR, 2_500_000_000)));
    QUOTE_A2 = EfsIds.recordId(QUOTE_T, keccak256(quoteBody(PAIR, 2_502_000_000)));
    QUOTE_B1 = EfsIds.recordId(QUOTE_T, keccak256(quoteBody(PAIR, 2_501_000_000)));
  }

  function seedActions(address quoteAcceptorAddr) public view returns (Action[] memory acts, bytes[] memory bodies) {
    acts = new Action[](6);
    bodies = new bytes[](6);
    bodies[0] = itemTypeBody();
    acts[0] = declareTypeAction(bodies[0], address(passAcceptor));
    bodies[1] = pairTypeBody();
    acts[1] = declareTypeAction(bodies[1], address(passAcceptor));
    bodies[2] = quoteTypeBody();
    acts[2] = declareTypeAction(bodies[2], quoteAcceptorAddr);
    bodies[3] = ethBody();
    acts[3] = recordAction(ITEM_T, bodies[3]);
    bodies[4] = usdcBody();
    acts[4] = recordAction(ITEM_T, bodies[4]);
    bodies[5] = pairBody();
    acts[5] = recordAction(PAIR_T, bodies[5]); // ordered-prefix: sees the two Items admitted just before
  }

  function seedInto(Ledger lg, address quoteAcceptorAddr) public {
    (Action[] memory acts, bytes[] memory bodies) = seedActions(quoteAcceptorAddr);
    bytes32 self = EfsIds.contractPrincipal(lg.realmOrigin(), address(this));
    lg.publishNative(intentOf(self, ++nonceSelf, acts), bodies);
  }

  function seed() public {
    seedInto(ledger, address(quoteAcceptor));
  }

  // ---- steps 2–4 -----------------------------------------------------------

  function a1Intent() public view returns (Intent memory it, bytes[] memory bodies) {
    Action[] memory acts = new Action[](5);
    bodies = new bytes[](5);
    bodies[1] = quoteBody(PAIR, 2_500_000_000);
    acts[0] = subjectAction(A, SALT_F);
    acts[1] = recordAction(QUOTE_T, bodies[1]);
    acts[2] = bindAction(PURPOSE_HEAD, FILE, bytes32(0), QUOTE_A1, 0);
    acts[3] = bindAction(PURPOSE_FOLDER, SWAPS, NAME, FILE, 0);
    acts[4] = bindAction(PURPOSE_TAG, FILE, MARKET, TAG_ASSERT, 0);
    it = intentOf(A, 1, acts);
  }

  /// step 2: AUTHOR_A publishes QUOTE_A1 through the signed path (subject mint + record + head + placement + tag)
  function a1() public returns (bytes32 pubId) {
    (Intent memory it, bytes[] memory bodies) = a1Intent();
    nonceA = 1;
    (pubId, ) = ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it));
  }

  function a2Intent() public view returns (Intent memory it, bytes[] memory bodies) {
    Action[] memory acts = new Action[](2);
    bodies = new bytes[](2);
    bodies[0] = quoteBody(PAIR, 2_502_000_000);
    acts[0] = recordAction(QUOTE_T, bodies[0]);
    acts[1] = bindAction(PURPOSE_HEAD, FILE, bytes32(0), QUOTE_A2, 1); // CAS against A1
    it = intentOf(A, 2, acts);
  }

  /// step 3: QUOTE_A2 with a CAS against QUOTE_A1
  function a2() public returns (bytes32 pubId) {
    (Intent memory it, bytes[] memory bodies) = a2Intent();
    nonceA = 2;
    (pubId, ) = ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it));
  }

  /// step 4: AUTHOR_B (the producer contract) publishes QUOTE_B1 natively: record + its own head + its own placement
  function b1() public returns (bytes32 pubId) {
    Action[] memory acts = new Action[](3);
    bytes[] memory bodies = new bytes[](3);
    bodies[0] = quoteBody(PAIR, 2_501_000_000);
    acts[0] = recordAction(QUOTE_T, bodies[0]);
    acts[1] = bindAction(PURPOSE_HEAD, FILE, bytes32(0), QUOTE_B1, 0);
    acts[2] = bindAction(PURPOSE_FOLDER, SWAPS, NAME, FILE, 0);
    (pubId, ) = producer.publish(ledger, intentOf(B, ++nonceB, acts), bodies);
  }

  /// A signs and publishes an arbitrary batch with her next nonce.
  function publishA(Action[] memory acts, bytes[] memory bodies) public returns (bytes32 pubId) {
    Intent memory it = intentOf(A, ++nonceA, acts);
    (pubId, ) = ledger.publishSigned(it, bodies, signWith(PK_A, ledger, it));
  }

  function pubIdA1() public view returns (bytes32) {
    (Intent memory it, ) = a1Intent();
    return EfsIds.publicationId(A, 1, keccak256(abi.encode(it.actions)));
  }

  // ---- export helpers (public reads only; candidate decoders => self-check grade) ----

  function sourceOf(EvidenceData memory ev) public pure returns (SourceEvidence memory s) {
    s.realmId = ev.realmId;
    s.coreCodeCommitment = ev.coreCodeCommitment;
    s.author = ev.author;
    s.proofKind = ev.proofKind;
    s.v = ev.v;
    s.r = ev.r;
    s.s = ev.s;
    s.nonce = ev.nonce;
    s.deadline = ev.deadline;
    s.acceptanceProfile = ev.acceptanceProfile;
    s.indexObligations = ev.indexObligations;
    s.firstAdmission = ev.firstAdmission;
    s.leafCount = ev.leafCount;
    s.basis = ev.basis;
  }

  function actionFrom(AdmissionData memory ad) public pure returns (Action memory a) {
    a.kind = ad.kind;
    a.typeId = ad.typeId;
    a.digestKind = ad.digestKind;
    a.digest = ad.digest;
    a.purpose = ad.purpose;
    a.subject = ad.subject;
    a.role = ad.role;
    a.target = ad.target;
    a.expectedRevision = ad.expectedRevision;
    a.salt = ad.salt;
  }

  function packetOf(Ledger src, bytes32 pubId) public view returns (ImportPacket memory pkt) {
    IStoreRead s = IStoreRead(address(src));
    EvidenceData memory ev = Evidence.get(s, pubId);
    pkt.source = sourceOf(ev);
    pkt.actions = new Action[](ev.leafCount);
    pkt.bodies = new bytes[](ev.leafCount);
    for (uint256 i = 0; i < ev.leafCount; i++) {
      AdmissionData memory ad = Admissions.get(s, ev.firstAdmission + uint64(i));
      pkt.actions[i] = actionFrom(ad);
      if (ad.kind == KIND_RECORD && ad.digestKind == DIGEST_BODY_HASH) {
        (, , pkt.bodies[i]) = Records.get(s, EfsIds.recordId(ad.typeId, ad.digest));
      } else if (ad.kind == KIND_DECLARE_TYPE) {
        (, , pkt.bodies[i]) = Records.get(s, EfsIds.recordId(TYPE_META, ad.digest));
      }
    }
  }

  function authFor(bytes32 importer, uint64 nonce, ImportPacket memory pkt) public pure returns (Intent memory) {
    Action[] memory acts = new Action[](1);
    acts[0].kind = KIND_IMPORT;
    acts[0].digestKind = DIGEST_PACKET;
    acts[0].digest = keccak256(abi.encode(pkt.source, pkt.actions));
    return intentOf(importer, nonce, acts);
  }

  /// Imports A's first publication into `dst` under an EOA importer's signed authorization.
  function importA1Into(Ledger dst, bytes32 importer, uint64 nonce) public returns (bytes32 srcId, bytes32 authId) {
    ImportPacket memory pkt = packetOf(ledger, pubIdA1());
    Intent memory auth = authFor(importer, nonce, pkt);
    (srcId, authId) = dst.importPublication(pkt, auth, signWith(PK_I, dst, auth));
  }
}
