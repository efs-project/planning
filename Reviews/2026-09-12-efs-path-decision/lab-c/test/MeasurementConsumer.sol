// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Stateless, test-only paid consumer for the Road C measurement runner. It has no constructor, owner, mutable
 * fields or privileged call path. Its result events are deliberately part of the paid transaction overhead.
 *
 * Two surfaces:
 *  - the SEALED PAID POINT/LIST SLICE (sdk-fixture appendix; matched-cost-scope-review "Bounded C follow-through"):
 *    `paidPoint` / `paidList` are the arm-neutral checks in C's native representation. The caller supplies every
 *    expectation (`Expect`, `PlacementExpect`) from the sealed expectation manifest and the arm-local fixture map;
 *    this contract derives no id (no EfsTypes/EfsIds import, no candidate table library), reads no seeded answer and
 *    reverts on every outcome that is not found, supported, admitted and uniquely selected at the pinned basis.
 *    Placement provenance (the one A placement: sourceStep A1, AUTHOR_A, EOA_SIGNED_PUBLICATION_EFFECT) is checked
 *    and reported SEPARATELY from selected-content authorship — no equality between the two is required or implied,
 *    so B-first selects B's head while the placement stays A's. Point and list share the same Quote -> Pair -> two
 *    Items closure at the same pinned admission frontier; the list additionally establishes the one-row COMPLETE
 *    placement window with an end condition; the point performs no directory lookup. One `PaidObserved` log per
 *    paid row carries the concrete observations, not only a digest.
 *  - the FRAMED c32 diagnostic surface (`paidPointFramed` / `paidListFramed`, `FramedExpected`, `PointCommitted` /
 *    `ListCommitted`), kept for the supplemental framed cells of script/measure.mjs; not part of the sealed slice.
 *
 * Decoding is consumer-local over the PUBLIC read ABI only: `getRecord(bytes32,bytes32[],bytes32)` of the Store
 * (MUD user-defined value types encode as bytes32, so the selectors are the Ledger's) with the table ids, field
 * layouts and packed offsets pinned as literals from README "Fixture coordinates". Every reply's static region is
 * length-checked before any byte is read, so a malformed or missing reply fails closed. The readers are called
 * through interface types so a test can substitute a faulty forwarding reader (test/FaultyReads.sol).
 */

import { LensReader } from "../src/LensReader.sol"; // struct types (Lens, Resolution, Cursor, Page, Item) only

/// The Store's public table-read ABI as this consumer uses it (Ledger selector 0x419b58fd).
interface ITableReads {
  function getRecord(
    bytes32 tableId,
    bytes32[] calldata keyTuple,
    bytes32 fieldLayout
  ) external view returns (bytes memory staticData, bytes32 encodedLengths, bytes memory dynamicData);
}

/// The Ledger's identity views this consumer pins (public getters of src/Ledger.sol).
interface ILedgerViews {
  function realmId() external view returns (bytes32);

  function coreCodeCommitment() external view returns (bytes32);

  function rulesEpoch() external view returns (uint32);
}

/// The LensReader's public read ABI as this consumer uses it.
interface ILensReads {
  function ledger() external view returns (address);

  function index() external view returns (address);

  function highWater() external view returns (uint64);

  function resolve(
    LensReader.Lens calldata lens,
    bytes32 purpose,
    bytes32 subject,
    bytes32 role
  ) external view returns (LensReader.Resolution memory);

  function resolveAt(
    LensReader.Lens calldata lens,
    bytes32 purpose,
    bytes32 subject,
    bytes32 role,
    uint64 basis
  ) external view returns (LensReader.Resolution memory);

  function list(
    LensReader.Lens calldata lens,
    bytes32 purpose,
    bytes32 scope,
    LensReader.Cursor calldata cursor,
    uint32 budget
  ) external view returns (LensReader.Page memory);
}

/// The IndexModule's public coverage/generation views.
interface IIndexReads {
  function generation() external view returns (uint32);

  function coverage(bytes32 family, bytes32 partition) external view returns (uint8 status, uint64 through);
}

contract MeasurementConsumer {
  // ---- pinned public coordinates (README "Fixture coordinates"); consumer-local, not imported from the candidate ----
  bytes32 internal constant RECORDS_TABLE = 0x746265667300000000000000000000005265636f726473000000000000000000;
  bytes32 internal constant RECORDS_LAYOUT = 0x0028020120080000000000000000000000000000000000000000000000000000;
  bytes32 internal constant ADMISSIONS_TABLE = 0x7462656673000000000000000000000041646d697373696f6e73000000000000;
  bytes32 internal constant ADMISSIONS_LAYOUT = 0x01060b0020012001202020202004200000000000000000000000000000000000;
  bytes32 internal constant EVIDENCE_TABLE = 0x7462656673000000000000000000000045766964656e63650000000000000000;
  bytes32 internal constant EVIDENCE_LAYOUT = 0x0145110020012020010808202020080208202020010000000000000000000000;
  bytes32 internal constant PURPOSE_HEAD = keccak256("efs2/lab-c/purpose/head");
  bytes32 internal constant PURPOSE_FOLDER = keccak256("efs2/lab-c/purpose/folder");
  bytes32 internal constant FAMILY_SCOPES = keccak256("efs2/lab-c/index/scopes");
  uint8 internal constant KIND_BIND = 4;
  uint8 public constant PROOF_NATIVE = 1; // evidence category CONTRACT_ORIGINATED_PUBLICATION: no signature exists
  uint8 public constant PROOF_EOA_SIG = 2; // evidence category EOA_SIGNED_PUBLICATION
  uint8 internal constant P_FOUND = 1;
  uint8 internal constant C_COMPLETE = 1;
  uint8 internal constant COV_COMPLETE = 1;
  uint256 internal constant QUOTE_PAYLOAD = 128; // abi.encode(uint256 mantissa, uint8 scale, uint64 observedAt, bytes32 note)
  bytes32 public constant KIND_PAID_POINT = keccak256("road-c/measurement/paid-point/2");
  bytes32 public constant KIND_PAID_LIST = keccak256("road-c/measurement/paid-list/2");

  // ---- decoded public rows (consumer-local views) ----
  struct RecordView {
    bytes32 typeId;
    uint64 firstAdmission;
    bytes body;
  }

  struct AdmissionView {
    bytes32 publicationId;
    uint8 kind;
    bytes32 purpose;
    bytes32 subject;
    bytes32 role;
    bytes32 target;
    uint32 expectedRevision;
  }

  struct EvidenceView {
    bytes32 author;
    uint8 proofKind;
    bytes32 r;
    bytes32 s;
    uint8 v;
    uint64 firstAdmission;
    uint16 leafCount;
    bytes32 realmId;
    bytes32 coreCodeCommitment;
    bytes32 importOf;
    uint8 sourceGrade;
  }

  // ---- the sealed paid point/list slice -------------------------------------------------------------------

  /// Semantic expectations of one paid row (the same struct for point and list): the selected content, its exact
  /// Types and fixture fields, and the exact arm-local observation basis. Supplied by the run controller from its
  /// sealed manifest / fixture map; nothing here is derived by this contract.
  struct Expect {
    bytes32 subject; // FILE_QUOTE (physical subject id from the sealed fixture map)
    bytes32 expectedHead; // QUOTE_A2 (A-first) / QUOTE_B1 (B-first): the expected selected head record id (an INPUT)
    uint32 selectedRevision; // the selected principal's HEAD binding revision (A2 = 2, B1 = 1)
    bytes32 selectedAuthor; // principal id expected to hold the selected HEAD (AUTHOR_A or AUTHOR_B)
    uint8 selectedProofKind; // PROOF_EOA_SIG (A-first) or PROOF_NATIVE (B-first)
    bytes32 quoteType; // exact Type ids (content-derived Type Records)
    bytes32 pairType;
    bytes32 itemType;
    bytes32 pairId; // PAIR_ETH_USDC
    bytes32 itemA; // ITEM_ETH: the Pair's first ordered reference
    bytes32 itemB; // ITEM_USDC: the second
    uint256 mantissa; // the selected Quote's exact fixture fields, compared on chain against these INPUTS
    uint8 scale;
    uint64 observedAt;
    bytes32 noteCommitment;
    uint64 basisAdmission; // the admission frontier at the post-B1 seal
  }

  /// Expectations of the one placement a list row must find (list rows only).
  struct PlacementExpect {
    bytes32 folder; // /swaps
    bytes32 name; // keccak256("eth-usdc")
    bytes32 actor; // AUTHOR_A: whose placement it is
    uint8 proofKind; // PROOF_EOA_SIG: category EOA_SIGNED_PUBLICATION_EFFECT
    bytes32 publicationId; // the A1 publication id (sourceStep A1) from the independently retained A1 receipt
    uint32 revision; // 1
    uint32 budget; // candidate budget of the one bounded page
  }

  /// Concrete observations of the content selection (point and list). Physical ids and ordinals only: the fixture
  /// labels (QUOTE_A2 / A2, QUOTE_B1 / B1) are joined by the run controller, never assumed here.
  struct Selection {
    uint64 basisAdmission;
    uint32 indexGeneration;
    uint32 rulesEpoch;
    bytes32 coreCodeCommitment;
    bytes32 realmId;
    bytes32 lensHash;
    bytes32 subject;
    bytes32 selectedHead;
    uint32 selectedRevision;
    uint64 selectedAdmission;
    bytes32 selectedBindingKey;
    bytes32 selectedPublication;
    bytes32 selectedAuthor;
    uint8 selectedProofKind;
    uint8 selectedSourceGrade;
    uint64 quoteFirstAdmission;
    bytes32 pairId;
    bytes32 itemA;
    bytes32 itemB;
    uint256 mantissa;
    uint8 scale;
    uint64 observedAt;
    bytes32 note;
  }

  /// Concrete observations of the placement window and its provenance (list only; all-zero for a point row).
  struct Placement {
    bytes32 folder;
    bytes32 name;
    bytes32 target;
    bytes32 actor;
    uint32 revision;
    uint64 admission;
    bytes32 bindingKey;
    bytes32 publicationId;
    uint8 proofKind;
    uint8 sourceGrade;
    uint64 basisAdmission;
    uint8 pageStatus;
    uint32 rawTotal;
    uint32 scanned;
    uint32 hydrated;
    uint32 selected;
    uint32 endPosition;
    bool ended;
    uint8 coverageStatus;
    uint64 coverageThrough;
  }

  /// The admission that must have set an observed binding, and the author/category its evidence must name.
  struct BindProbe {
    uint64 admission;
    bytes32 purpose;
    bytes32 subject;
    bytes32 role;
    bytes32 target;
    bytes32 author;
    uint8 proofKind;
  }

  struct AdmittedBy {
    bytes32 publicationId;
    uint8 proofKind;
    uint8 sourceGrade;
  }

  /// The one log of a paid row: the digest AND the concrete observations.
  /// commitment = keccak256(abi.encode(kind, selection, placement))
  event PaidObserved(bytes32 indexed kind, bytes32 commitment, Selection selection, Placement placement);

  error NotSelected(uint8 status);
  error ReaderLedgerMismatch(address readerLedger, address ledger);
  error BasisMismatch(uint64 expected, uint64 observed);
  error SelectionMismatch(uint8 field, bytes32 expected, bytes32 observed); // 1 selected author, 2 selected head, 3 selected revision
  error NotAtBasis(uint8 what, uint64 ordinal, uint64 basis); // 1 head admission, 2 record first admission, 3 placement admission
  error MalformedRecord(bytes32 id, uint256 staticLength);
  error RecordAbsent(bytes32 id);
  error MalformedFrame(bytes32 id);
  error WrongType(bytes32 id, bytes32 expected, bytes32 observed);
  // 1 quote ref count, 2 pair id, 3 pair ref count, 4 item A, 5 item B, 6 payload length, 7 mantissa, 8 scale, 9 observedAt, 10 note, 11 item ref count
  error ClosureMismatch(uint8 field, bytes32 expected, bytes32 observed);
  error MalformedAdmission(uint64 ordinal, uint256 staticLength);
  error AdmissionShape(uint64 ordinal, uint8 kind, bytes32 purpose, bytes32 target);
  error MalformedEvidence(bytes32 publicationId, uint256 staticLength);
  error EvidenceBounds(uint64 admission, bytes32 publicationId, uint64 firstAdmission, uint16 leafCount);
  error AuthorMismatch(bytes32 expected, bytes32 observed);
  error ProofCategory(uint8 expected, uint8 observed, bytes32 importOf, uint8 sourceGrade);
  error ProofShape(uint8 proofKind, uint8 v, bytes32 r, bytes32 s);
  error RealmMismatch(uint8 field, bytes32 expected, bytes32 observed); // 1 realmId, 2 coreCodeCommitment
  error PlacementWindow(uint8 status, uint32 rawTotal, uint32 scanned, uint256 items, uint32 selected, uint32 endPosition);
  error PlacementMismatch(uint8 field, bytes32 expected, bytes32 observed); // 1 name/status, 2 target, 3 actor, 4 revision, 5 resolution, 6 publication
  error IncompleteCoverage(uint8 status, uint64 through, uint64 basis);
  error ShortReply(uint256 length, uint256 needed);

  /// PAID_POINT: File-keyed content selection under the ordered lens, closure-checked at the pinned basis.
  /// No directory lookup is performed or charged.
  function paidPoint(
    ILensReads reader,
    ITableReads ledger,
    LensReader.Lens calldata lens,
    Expect calldata e
  ) external returns (bytes32 commitment, Selection memory selection) {
    selection = _select(reader, ledger, lens, e);
    Placement memory none;
    commitment = keccak256(abi.encode(KIND_PAID_POINT, selection, none));
    emit PaidObserved(KIND_PAID_POINT, commitment, selection, none);
  }

  /// PAID_LIST: the SAME content selection and closure as the point at the same basis, then the one bounded
  /// placement window (COMPLETE with its end condition, exactly one raw entry: no duplicate, no B placement),
  /// mandatory scope coverage through the basis, and the placement's provenance.
  function paidList(
    ILensReads reader,
    ITableReads ledger,
    LensReader.Lens calldata lens,
    Expect calldata e,
    PlacementExpect calldata p
  ) external returns (bytes32 commitment, Selection memory selection, Placement memory placement) {
    selection = _select(reader, ledger, lens, e);
    placement = _placement(reader, ledger, lens, selection, p);
    commitment = keccak256(abi.encode(KIND_PAID_LIST, selection, placement));
    emit PaidObserved(KIND_PAID_LIST, commitment, selection, placement);
  }

  /// The content selection shared by point and list: basis pin, ordered-lens HEAD resolution AT that basis, the
  /// admitting publication's author / proof category / range bounds / Realm commitments, then the closure.
  function _select(
    ILensReads reader,
    ITableReads ledger,
    LensReader.Lens calldata lens,
    Expect calldata e
  ) internal view returns (Selection memory s) {
    _pinBasis(reader, ledger, s, e.basisAdmission);
    s.lensHash = keccak256(abi.encode(lens.principals, lens.mode));
    s.subject = e.subject;
    LensReader.Resolution memory r = reader.resolveAt(lens, PURPOSE_HEAD, e.subject, bytes32(0), s.basisAdmission);
    if (r.status != P_FOUND) revert NotSelected(r.status);
    if (r.selectedBy != e.selectedAuthor) revert SelectionMismatch(1, e.selectedAuthor, r.selectedBy);
    if (r.target != e.expectedHead) revert SelectionMismatch(2, e.expectedHead, r.target);
    if (r.revision != e.selectedRevision) {
      revert SelectionMismatch(3, bytes32(uint256(e.selectedRevision)), bytes32(uint256(r.revision)));
    }
    if (r.admission == 0 || r.admission > s.basisAdmission) revert NotAtBasis(1, r.admission, s.basisAdmission);
    s.selectedHead = r.target;
    s.selectedRevision = r.revision;
    s.selectedAdmission = r.admission;
    s.selectedBindingKey = r.selectedKey;
    s.selectedAuthor = r.selectedBy;
    BindProbe memory b = BindProbe(r.admission, PURPOSE_HEAD, e.subject, bytes32(0), r.target, e.selectedAuthor, e.selectedProofKind);
    AdmittedBy memory ab = _admittedBy(ledger, b, s.realmId, s.coreCodeCommitment);
    s.selectedPublication = ab.publicationId;
    s.selectedProofKind = ab.proofKind;
    s.selectedSourceGrade = ab.sourceGrade;
    _closure(ledger, s, e);
  }

  /// The arm-local observation basis: the admission frontier (pinned exactly — a moved frontier is a mixed basis
  /// and reverts), plus the index generation, rules epoch, Core code commitment and Realm id a cursor would bind.
  function _pinBasis(ILensReads reader, ITableReads ledger, Selection memory s, uint64 expected) internal view {
    address readerLedger = reader.ledger();
    if (readerLedger != address(ledger)) revert ReaderLedgerMismatch(readerLedger, address(ledger));
    uint64 hw = reader.highWater();
    if (hw != expected) revert BasisMismatch(expected, hw);
    s.basisAdmission = hw;
    s.indexGeneration = IIndexReads(reader.index()).generation();
    s.rulesEpoch = ILedgerViews(address(ledger)).rulesEpoch();
    s.coreCodeCommitment = ILedgerViews(address(ledger)).coreCodeCommitment();
    s.realmId = ILedgerViews(address(ledger)).realmId();
  }

  /// The admission that set the observed binding must be a BIND of exactly (purpose, subject, role) -> target, inside
  /// the admission range of its publication, whose retained Evidence names `author` under the expected proof category
  /// at THIS Realm and code (not an imported cell): a native publication carries no signature at all (nothing
  /// fabricated), an EOA-signed one carries (v in {27, 28}, r, s).
  function _admittedBy(
    ITableReads ledger,
    BindProbe memory b,
    bytes32 realmId,
    bytes32 core
  ) internal view returns (AdmittedBy memory out) {
    AdmissionView memory a = _admission(ledger, b.admission);
    if (a.kind != KIND_BIND || a.purpose != b.purpose || a.subject != b.subject || a.role != b.role || a.target != b.target) {
      revert AdmissionShape(b.admission, a.kind, a.purpose, a.target);
    }
    EvidenceView memory ev = _evidence(ledger, a.publicationId);
    if (ev.firstAdmission == 0 || b.admission < ev.firstAdmission || b.admission >= ev.firstAdmission + uint64(ev.leafCount)) {
      revert EvidenceBounds(b.admission, a.publicationId, ev.firstAdmission, ev.leafCount);
    }
    if (ev.author != b.author) revert AuthorMismatch(b.author, ev.author);
    if (ev.proofKind != b.proofKind || ev.importOf != bytes32(0) || ev.sourceGrade != 0) {
      revert ProofCategory(b.proofKind, ev.proofKind, ev.importOf, ev.sourceGrade);
    }
    if (ev.proofKind == PROOF_NATIVE) {
      if (ev.v != 0 || ev.r != bytes32(0) || ev.s != bytes32(0)) revert ProofShape(ev.proofKind, ev.v, ev.r, ev.s);
    } else if (ev.proofKind == PROOF_EOA_SIG) {
      if ((ev.v != 27 && ev.v != 28) || ev.r == bytes32(0) || ev.s == bytes32(0)) revert ProofShape(ev.proofKind, ev.v, ev.r, ev.s);
    } else {
      revert ProofShape(ev.proofKind, ev.v, ev.r, ev.s);
    }
    if (ev.realmId != realmId) revert RealmMismatch(1, realmId, ev.realmId);
    if (ev.coreCodeCommitment != core) revert RealmMismatch(2, core, ev.coreCodeCommitment);
    out.publicationId = a.publicationId;
    out.proofKind = ev.proofKind;
    out.sourceGrade = ev.sourceGrade;
  }

  /// Quote -> Pair -> two Items with exact Types, canonical frames and ordered references, each admitted at or before
  /// the basis; then EVERY sealed Quote field (pair, mantissa, scale, observedAt, note commitment) against the caller's
  /// inputs. Item checks are Type + frame checks only (no Item payload semantics in this slice).
  function _closure(ITableReads ledger, Selection memory s, Expect calldata e) internal view {
    RecordView memory q = _recordAt(ledger, s.selectedHead, s.basisAdmission);
    if (q.typeId != e.quoteType) revert WrongType(s.selectedHead, e.quoteType, q.typeId);
    s.quoteFirstAdmission = q.firstAdmission;
    (bytes32[] memory refs, bytes memory payload) = _frame(s.selectedHead, q.body);
    if (refs.length != 1) revert ClosureMismatch(1, bytes32(uint256(1)), bytes32(refs.length));
    if (refs[0] != e.pairId) revert ClosureMismatch(2, e.pairId, refs[0]);
    if (payload.length != QUOTE_PAYLOAD) revert ClosureMismatch(6, bytes32(QUOTE_PAYLOAD), bytes32(payload.length));
    (uint256 mantissa, uint8 scale, uint64 observedAt, bytes32 note) = abi.decode(payload, (uint256, uint8, uint64, bytes32));
    if (mantissa != e.mantissa) revert ClosureMismatch(7, bytes32(e.mantissa), bytes32(mantissa));
    if (scale != e.scale) revert ClosureMismatch(8, bytes32(uint256(e.scale)), bytes32(uint256(scale)));
    if (observedAt != e.observedAt) revert ClosureMismatch(9, bytes32(uint256(e.observedAt)), bytes32(uint256(observedAt)));
    if (note != e.noteCommitment) revert ClosureMismatch(10, e.noteCommitment, note);
    s.pairId = refs[0];
    s.mantissa = mantissa;
    s.scale = scale;
    s.observedAt = observedAt;
    s.note = note;
    _pair(ledger, s, e);
  }

  function _pair(ITableReads ledger, Selection memory s, Expect calldata e) internal view {
    RecordView memory p = _recordAt(ledger, s.pairId, s.basisAdmission);
    if (p.typeId != e.pairType) revert WrongType(s.pairId, e.pairType, p.typeId);
    (bytes32[] memory refs, ) = _frame(s.pairId, p.body);
    if (refs.length != 2) revert ClosureMismatch(3, bytes32(uint256(2)), bytes32(refs.length));
    if (refs[0] != e.itemA) revert ClosureMismatch(4, e.itemA, refs[0]);
    if (refs[1] != e.itemB) revert ClosureMismatch(5, e.itemB, refs[1]);
    s.itemA = refs[0];
    s.itemB = refs[1];
    _item(ledger, refs[0], e.itemType, s.basisAdmission);
    _item(ledger, refs[1], e.itemType, s.basisAdmission);
  }

  function _item(ITableReads ledger, bytes32 id, bytes32 itemType, uint64 basis) internal view {
    RecordView memory it = _recordAt(ledger, id, basis);
    if (it.typeId != itemType) revert WrongType(id, itemType, it.typeId);
    (bytes32[] memory refs, ) = _frame(id, it.body);
    if (refs.length != 0) revert ClosureMismatch(11, bytes32(0), bytes32(refs.length));
  }

  /// The one placement window (list only): one bounded page from a fresh cursor must be COMPLETE, ended (the scan
  /// consumed every raw scope entry), hold exactly ONE raw entry in the whole folder scope (any other entry by any
  /// principal — a second placement, a duplicate, a tombstone — is refused) and select exactly the expected
  /// (folder, name) -> subject row held by the expected actor at the expected revision; then mandatory scope coverage
  /// through the basis; then the placement's provenance (its admission, publication and evidence category).
  function _placement(
    ILensReads reader,
    ITableReads ledger,
    LensReader.Lens calldata lens,
    Selection memory s,
    PlacementExpect calldata p
  ) internal view returns (Placement memory pl) {
    _window(reader, lens, s.subject, s.basisAdmission, p, pl);
    _coverage(reader, s.basisAdmission, pl);
    _provenance(reader, ledger, lens, s, p, pl);
  }

  function _window(
    ILensReads reader,
    LensReader.Lens calldata lens,
    bytes32 subject,
    uint64 basis,
    PlacementExpect calldata p,
    Placement memory pl
  ) internal view {
    LensReader.Cursor memory fresh;
    LensReader.Page memory page = reader.list(lens, PURPOSE_FOLDER, p.folder, fresh, p.budget);
    pl.basisAdmission = page.next.basisAdmission;
    pl.pageStatus = page.status;
    pl.rawTotal = page.rawTotal;
    pl.scanned = page.scanned;
    pl.hydrated = page.hydrated;
    pl.selected = page.selected;
    pl.endPosition = page.next.position;
    pl.ended = page.next.position == page.rawTotal && page.scanned == page.rawTotal; // the end condition, independent of the status byte
    if (page.next.basisAdmission != basis) revert BasisMismatch(basis, page.next.basisAdmission);
    if (page.status != C_COMPLETE || !pl.ended || page.rawTotal != 1 || page.items.length != 1 || page.selected != 1) {
      revert PlacementWindow(page.status, page.rawTotal, page.scanned, page.items.length, page.selected, page.next.position);
    }
    LensReader.Item memory it = page.items[0];
    if (it.status != P_FOUND || it.name != p.name) revert PlacementMismatch(1, p.name, it.name);
    if (it.target != subject) revert PlacementMismatch(2, subject, it.target);
    if (it.selectedBy != p.actor) revert PlacementMismatch(3, p.actor, it.selectedBy);
    if (it.revision != p.revision) revert PlacementMismatch(4, bytes32(uint256(p.revision)), bytes32(uint256(it.revision)));
    pl.folder = p.folder;
    pl.name = it.name;
    pl.target = it.target;
    pl.actor = it.selectedBy;
    pl.revision = it.revision;
  }

  function _coverage(ILensReads reader, uint64 basis, Placement memory pl) internal view {
    (uint8 status, uint64 through) = IIndexReads(reader.index()).coverage(FAMILY_SCOPES, bytes32(0));
    if (status != COV_COMPLETE || through < basis) revert IncompleteCoverage(status, through, basis);
    pl.coverageStatus = status;
    pl.coverageThrough = through;
  }

  function _provenance(
    ILensReads reader,
    ITableReads ledger,
    LensReader.Lens calldata lens,
    Selection memory s,
    PlacementExpect calldata p,
    Placement memory pl
  ) internal view {
    LensReader.Resolution memory r = reader.resolveAt(lens, PURPOSE_FOLDER, p.folder, p.name, s.basisAdmission);
    if (r.status != P_FOUND || r.target != pl.target || r.selectedBy != pl.actor || r.revision != pl.revision) {
      revert PlacementMismatch(5, pl.target, r.target);
    }
    if (r.admission == 0 || r.admission > s.basisAdmission) revert NotAtBasis(3, r.admission, s.basisAdmission);
    BindProbe memory b = BindProbe(r.admission, PURPOSE_FOLDER, p.folder, p.name, pl.target, p.actor, p.proofKind);
    AdmittedBy memory ab = _admittedBy(ledger, b, s.realmId, s.coreCodeCommitment);
    if (ab.publicationId != p.publicationId) revert PlacementMismatch(6, p.publicationId, ab.publicationId);
    pl.admission = r.admission;
    pl.bindingKey = r.selectedKey;
    pl.publicationId = ab.publicationId;
    pl.proofKind = ab.proofKind;
    pl.sourceGrade = ab.sourceGrade;
  }

  // ---- the framed c32 diagnostic surface (unchanged checks; supplemental cells only) ---------------------------

  struct FramedExpected {
    bytes32 author;
    bytes32 typeId;
    bytes32 recordId;
    bytes32 expectedRef; // zero means the canonical frame must contain no references
    uint256 payloadLength;
    bytes32 payloadHash;
  }

  event PointCommitted(
    bytes32 indexed commitment,
    bytes32 indexed subject,
    bytes32 indexed recordId,
    bytes32 selectedBy,
    uint64 basis
  );
  event ListCommitted(
    bytes32 indexed commitment,
    bytes32 indexed folder,
    bytes32 indexed subject,
    bytes32 recordId,
    bytes32 selectedBy,
    uint64 basis,
    uint64 coverageThrough
  );

  error WrongSelection();
  error WrongAuthorContext();
  error WrongRecordType();
  error WrongRecordId();
  error WrongReference();
  error WrongPayloadLength(uint256 actual);
  error WrongPayloadHash();
  error IncompleteSelection(uint8 status);

  function paidPointFramed(
    ILensReads reader,
    ITableReads ledger,
    LensReader.Lens calldata lens,
    bytes32 purpose,
    bytes32 subject,
    bytes32 role,
    FramedExpected calldata expected
  ) external returns (bytes32 commitment, bytes32 recordId) {
    LensReader.Resolution memory r = reader.resolve(lens, purpose, subject, role);
    bytes32 payloadHash = _validate(ledger, r, purpose, subject, role, expected);
    recordId = r.target;
    commitment = keccak256(
      abi.encode("road-c/measurement/point/1", subject, role, recordId, r.selectedBy, r.admission, r.basis, payloadHash)
    );
    emit PointCommitted(commitment, subject, recordId, r.selectedBy, r.basis);
  }

  function paidListFramed(
    ILensReads reader,
    ITableReads ledger,
    LensReader.Lens calldata lens,
    bytes32 folder,
    bytes32 name,
    bytes32 expectedSubject,
    uint32 budget,
    FramedExpected calldata expected
  ) external returns (bytes32 commitment, bytes32 recordId, uint64 basis) {
    LensReader.Cursor memory cursor;
    LensReader.Page memory page = reader.list(lens, PURPOSE_FOLDER, folder, cursor, budget);
    if (page.status != C_COMPLETE) revert IncompleteSelection(page.status);
    basis = page.next.basisAdmission;
    (uint8 coverageStatus, uint64 coverageThrough) = IIndexReads(reader.index()).coverage(FAMILY_SCOPES, bytes32(0));
    if (coverageStatus != COV_COMPLETE || coverageThrough < basis) {
      revert IncompleteCoverage(coverageStatus, coverageThrough, basis);
    }

    bool found;
    for (uint256 i = 0; i < page.items.length; i++) {
      LensReader.Item memory item = page.items[i];
      if (item.name != name) continue;
      // the placement's actor is observed, never required to equal the content author (provenance != authorship)
      if (found || item.status != P_FOUND || item.target != expectedSubject) revert WrongSelection();
      found = true;
    }
    if (!found) revert WrongSelection();

    LensReader.Resolution memory r = reader.resolveAt(lens, PURPOSE_HEAD, expectedSubject, bytes32(0), basis);
    bytes32 payloadHash = _validate(ledger, r, PURPOSE_HEAD, expectedSubject, bytes32(0), expected);
    recordId = r.target;
    commitment = keccak256(
      abi.encode(
        "road-c/measurement/list/1",
        folder,
        name,
        expectedSubject,
        recordId,
        r.selectedBy,
        basis,
        coverageThrough,
        page.rawTotal,
        page.scanned,
        page.hydrated,
        payloadHash
      )
    );
    emit ListCommitted(commitment, folder, expectedSubject, recordId, r.selectedBy, basis, coverageThrough);
  }

  function _validate(
    ITableReads ledger,
    LensReader.Resolution memory r,
    bytes32 purpose,
    bytes32 subject,
    bytes32 role,
    FramedExpected calldata expected
  ) internal view returns (bytes32 payloadHash) {
    if (r.status != P_FOUND) revert NotSelected(r.status);
    if (r.target != expected.recordId) revert WrongRecordId();
    if (r.selectedBy != expected.author) revert WrongAuthorContext();

    AdmissionView memory a = _admission(ledger, r.admission);
    if (a.kind != KIND_BIND || a.purpose != purpose || a.subject != subject || a.role != role || a.target != r.target) {
      revert WrongSelection();
    }
    EvidenceView memory ev = _evidence(ledger, a.publicationId);
    if (ev.author != expected.author || ev.firstAdmission == 0 || ev.firstAdmission > r.admission) revert WrongAuthorContext();

    RecordView memory rec = _record(ledger, r.target);
    if (rec.typeId != expected.typeId) revert WrongRecordType();
    (bytes32[] memory refs, bytes memory payload) = _frame(r.target, rec.body);
    if (expected.expectedRef == bytes32(0)) {
      if (refs.length != 0) revert WrongReference();
    } else if (refs.length != 1 || refs[0] != expected.expectedRef) {
      revert WrongReference();
    }
    if (payload.length != expected.payloadLength) revert WrongPayloadLength(payload.length);
    payloadHash = keccak256(payload);
    if (payloadHash != expected.payloadHash) revert WrongPayloadHash();
  }

  // ---- consumer-local decoders over the public table-read ABI (README "Fixture coordinates") --------------------

  /// Records row: static (typeId @0, firstAdmission uint64 @32; 40 bytes) + dynamic body. An absent row is all zeros.
  function _record(ITableReads ledger, bytes32 id) internal view returns (RecordView memory rec) {
    (bytes memory st, , bytes memory dyn) = ledger.getRecord(RECORDS_TABLE, _key(id), RECORDS_LAYOUT);
    if (st.length != 40) revert MalformedRecord(id, st.length);
    rec.typeId = _word(st, 0);
    rec.firstAdmission = uint64(_uintAt(st, 32, 8));
    if (rec.firstAdmission == 0) revert RecordAbsent(id);
    rec.body = dyn;
  }

  function _recordAt(ITableReads ledger, bytes32 id, uint64 basis) internal view returns (RecordView memory rec) {
    rec = _record(ledger, id);
    if (rec.firstAdmission > basis) revert NotAtBasis(2, rec.firstAdmission, basis);
  }

  /// Admissions row (262 packed bytes): publicationId @0, kind @32, typeId @33, digestKind @65, digest @66, purpose @98,
  /// subject @130, role @162, target @194, expectedRevision uint32 @226, salt @230.
  function _admission(ITableReads ledger, uint64 ordinal) internal view returns (AdmissionView memory a) {
    (bytes memory st, , ) = ledger.getRecord(ADMISSIONS_TABLE, _key(bytes32(uint256(ordinal))), ADMISSIONS_LAYOUT);
    if (st.length != 262) revert MalformedAdmission(ordinal, st.length);
    a.publicationId = _word(st, 0);
    a.kind = uint8(_uintAt(st, 32, 1));
    a.purpose = _word(st, 98);
    a.subject = _word(st, 130);
    a.role = _word(st, 162);
    a.target = _word(st, 194);
    a.expectedRevision = uint32(_uintAt(st, 226, 4));
  }

  /// Evidence row (325 packed bytes): author @0, proofKind @32, r @33, s @65, v @97, nonce @98, deadline @106,
  /// acceptanceProfile @114, indexObligations @146, actionsHash @178, firstAdmission @210, leafCount uint16 @218,
  /// basis @220, realmId @228, coreCodeCommitment @260, importOf @292, sourceGrade @324.
  function _evidence(ITableReads ledger, bytes32 publicationId) internal view returns (EvidenceView memory e) {
    (bytes memory st, , ) = ledger.getRecord(EVIDENCE_TABLE, _key(publicationId), EVIDENCE_LAYOUT);
    if (st.length != 325) revert MalformedEvidence(publicationId, st.length);
    e.author = _word(st, 0);
    e.proofKind = uint8(_uintAt(st, 32, 1));
    e.r = _word(st, 33);
    e.s = _word(st, 65);
    e.v = uint8(_uintAt(st, 97, 1));
    e.firstAdmission = uint64(_uintAt(st, 210, 8));
    e.leafCount = uint16(_uintAt(st, 218, 2));
    e.realmId = _word(st, 228);
    e.coreCodeCommitment = _word(st, 260);
    e.importOf = _word(st, 292);
    e.sourceGrade = uint8(_uintAt(st, 324, 1));
  }

  /// C's record frame, abi.encode(bytes32[] refs, bytes payload), decoded and checked canonical (re-encodes to the same bytes).
  function _frame(bytes32 id, bytes memory body) internal pure returns (bytes32[] memory refs, bytes memory payload) {
    (refs, payload) = abi.decode(body, (bytes32[], bytes));
    if (keccak256(body) != keccak256(abi.encode(refs, payload))) revert MalformedFrame(id);
  }

  function _key(bytes32 k) internal pure returns (bytes32[] memory t) {
    t = new bytes32[](1);
    t[0] = k;
  }

  /// 32 bytes of a memory byte string at `offset`, bounds-checked first (memory-safe: reads inside the array only).
  function _word(bytes memory b, uint256 offset) internal pure returns (bytes32 w) {
    if (offset + 32 > b.length) revert ShortReply(b.length, offset + 32);
    assembly ("memory-safe") {
      w := mload(add(add(b, 32), offset))
    }
  }

  /// A big-endian unsigned field of `width` bytes at `offset`; for a field near the end the last full word is read
  /// and the field shifted out, so no byte outside the array is ever touched.
  function _uintAt(bytes memory b, uint256 offset, uint256 width) internal pure returns (uint256) {
    if (b.length < 32 || offset + width > b.length) revert ShortReply(b.length, offset + width);
    uint256 start = offset + 32 <= b.length ? offset : b.length - 32;
    bytes32 w = _word(b, start);
    return uint256(w << (8 * (offset - start))) >> (256 - 8 * width);
  }
}
